import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, ConflictException, HttpException, HttpStatus } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { UsersService } from "../users/users.service";
import { AccountLinksService } from "../users/account-links.service";
import { User, normalizeEmail } from "../users/entities/user.entity";
import { ConfigService } from "@nestjs/config";
import { RegisterDto } from "./dto/register.dto";
import { ClinicsService } from "../clinics/clinics.service";
import { UserRole } from "../../common/enums/user-role.enum";
import { LoyaltyService } from "../loyalty/loyalty.service";
import { BookingsService } from "../bookings/bookings.service";
import { NotificationsService } from "../notifications/notifications.service";
import { NotificationTrigger } from "../../common/enums/notification-trigger.enum";
import { assertPasswordPolicy } from "../../common/utils/password-policy.util";

// Lock the account for LOCK_MINUTES after MAX_FAILED_LOGINS wrong passwords or codes in a row.
const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;
// 2-step login code
const LOGIN_CODE_TTL_MINUTES = 10;
const LOGIN_CODE_MAX_ATTEMPTS = 5;
const LOGIN_CODE_RESEND_SECONDS = 60;
// Compared against when the email is unknown, so timing does not reveal which accounts exist.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);

export interface IssuedSession {
  accessToken: string;
  refreshToken: string;
  user: Partial<User>;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private clinicsService: ClinicsService,
    private loyaltyService: LoyaltyService,
    private bookingsService: BookingsService,
    private notificationsService: NotificationsService,
    private accountLinks: AccountLinksService,
  ) { }

  // ---------------------------------------------------------------------------
  // Step 1: password check (with lockout)
  // ---------------------------------------------------------------------------

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Spend the same time as a real check so response time does not reveal accounts.
      await bcrypt.compare(password || "", DUMMY_HASH).catch(() => false);
      return null;
    }

    this.assertNotLocked(user);

    const passwordOk = !!password && !!user.passwordHash && (await bcrypt.compare(password, user.passwordHash));
    if (!passwordOk) {
      await this.registerFailedAttempt(user);
      return null;
    }

    if (!user.isActive) {
      throw new UnauthorizedException("This account has been deactivated.");
    }
    if (!user.isEmailVerified) {
      throw new UnauthorizedException({
        statusCode: 401,
        code: "EMAIL_NOT_VERIFIED",
        message: "Please verify your email first. We sent you a link when you registered.",
      });
    }

    if (user.failedLoginAttempts) {
      await this.usersService.update(user.id, { failedLoginAttempts: 0, lockedUntil: null } as any);
    }
    return user;
  }

  private assertNotLocked(user: User) {
    if (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) {
      const minutes = Math.max(1, Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60000));
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          code: "ACCOUNT_LOCKED",
          message: `Too many failed attempts. Your account is locked for ${minutes} more minute(s).`,
          retryAfterMinutes: minutes,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async registerFailedAttempt(user: User) {
    const attempts = (user.failedLoginAttempts || 0) + 1;
    if (attempts >= MAX_FAILED_LOGINS) {
      await this.usersService.update(user.id, {
        failedLoginAttempts: 0,
        lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60 * 1000),
        loginCodeHash: null,
        loginCodeExpiresAt: null,
      } as any);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          code: "ACCOUNT_LOCKED",
          message: `Too many failed attempts. Your account is locked for ${LOCK_MINUTES} minutes.`,
          retryAfterMinutes: LOCK_MINUTES,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    await this.usersService.update(user.id, { failedLoginAttempts: attempts } as any);
  }

  // ---------------------------------------------------------------------------
  // Step 2: 6-digit email code
  // ---------------------------------------------------------------------------

  private hashCode(userId: string, code: string): string {
    const secret = process.env.JWT_SECRET || "medical-aesthetics-secret-key";
    return createHmac("sha256", secret).update(`${userId}:${code}`).digest("hex");
  }

  private maskEmail(email: string): string {
    const [local, domain] = (email || "").split("@");
    if (!domain) return email;
    const visible = local.slice(0, Math.min(2, local.length));
    return `${visible}${"*".repeat(Math.max(1, local.length - visible.length))}@${domain}`;
  }

  private async issueLoginCode(user: User) {
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    await this.usersService.update(user.id, {
      loginCodeHash: this.hashCode(user.id, code),
      loginCodeExpiresAt: new Date(Date.now() + LOGIN_CODE_TTL_MINUTES * 60 * 1000),
      loginCodeSentAt: new Date(),
      loginCodeAttempts: 0,
    } as any);
    await this.accountLinks.sendLoginCode(user, code);
  }

  /** POST /auth/login: password is correct, now send the email code. */
  async startLogin(user: User) {
    await this.issueLoginCode(user);
    return {
      requiresCode: true,
      challengeToken: this.accountLinks.signLoginChallenge(user),
      email: this.maskEmail(user.email),
      codeExpiresInSeconds: LOGIN_CODE_TTL_MINUTES * 60,
      message: "We sent a 6-digit code to your email.",
    };
  }

  async resendLoginCode(challengeToken: string) {
    const { sub } = this.accountLinks.verifyLoginChallenge(challengeToken);
    const user = await this.usersService.findById(sub);
    this.assertNotLocked(user);
    if (!user.isActive) throw new UnauthorizedException("This account has been deactivated.");
    if (user.loginCodeSentAt && Date.now() - new Date(user.loginCodeSentAt).getTime() < LOGIN_CODE_RESEND_SECONDS * 1000) {
      throw new BadRequestException(`Please wait a minute before requesting a new code.`);
    }
    await this.issueLoginCode(user);
    return { message: "A new code was sent to your email.", codeExpiresInSeconds: LOGIN_CODE_TTL_MINUTES * 60 };
  }

  async verifyLoginCode(challengeToken: string, code: string): Promise<IssuedSession> {
    const { sub } = this.accountLinks.verifyLoginChallenge(challengeToken);
    const user = await this.usersService.findById(sub);
    this.assertNotLocked(user);
    if (!user.isActive) throw new UnauthorizedException("This account has been deactivated.");

    const cleaned = String(code || "").replace(/\D/g, "");
    if (!user.loginCodeHash || !user.loginCodeExpiresAt || new Date(user.loginCodeExpiresAt).getTime() < Date.now()) {
      throw new UnauthorizedException({ statusCode: 401, code: "CODE_EXPIRED", message: "The code has expired. Please request a new one." });
    }

    const expected = Buffer.from(user.loginCodeHash, "hex");
    const actual = Buffer.from(this.hashCode(user.id, cleaned), "hex");
    const ok = cleaned.length === 6 && expected.length === actual.length && timingSafeEqual(expected, actual);

    if (!ok) {
      const attempts = (user.loginCodeAttempts || 0) + 1;
      if (attempts >= LOGIN_CODE_MAX_ATTEMPTS) {
        // Too many wrong codes: burn the code and count it as a failed login.
        await this.usersService.update(user.id, { loginCodeHash: null, loginCodeExpiresAt: null, loginCodeAttempts: 0 } as any);
        await this.registerFailedAttempt(user);
        throw new UnauthorizedException({ statusCode: 401, code: "CODE_EXPIRED", message: "Too many wrong codes. Please log in again." });
      }
      await this.usersService.update(user.id, { loginCodeAttempts: attempts } as any);
      throw new UnauthorizedException({ statusCode: 401, code: "INVALID_CODE", message: "Wrong code. Please try again." });
    }

    await this.usersService.update(user.id, {
      loginCodeHash: null,
      loginCodeExpiresAt: null,
      loginCodeAttempts: 0,
      failedLoginAttempts: 0,
      lockedUntil: null,
    } as any);
    await this.usersService.updateLastLogin(user.id);
    const fresh = await this.usersService.findById(user.id);
    return this.login(fresh);
  }

  // ---------------------------------------------------------------------------
  // Tokens
  // ---------------------------------------------------------------------------

  /** Issues the access + refresh token pair. Only called after both login steps. */
  async login(user: User): Promise<IssuedSession> {
    const payload = { email: user.email, sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>("JWT_ACCESS_SECRET"),
      expiresIn: "15m",
    });
    const refreshToken = this.jwtService.sign({ ...payload, type: "refresh" }, {
      secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
      expiresIn: "7d",
    });
    await this.usersService.updateRefreshToken(user.id, refreshToken);
    return {
      accessToken,
      refreshToken,
      user: this.publicUser(user),
    };
  }

  private publicUser(user: User): Partial<User> {
    const {
      passwordHash,
      refreshToken,
      emailVerificationToken,
      loginCodeHash,
      loginCodeExpiresAt,
      loginCodeSentAt,
      loginCodeAttempts,
      failedLoginAttempts,
      lockedUntil,
      ...userData
    } = user as any;
    return userData;
  }

  async refreshToken(refreshToken: string): Promise<IssuedSession> {
    if (!refreshToken) {
      throw new UnauthorizedException("Session expired. Please log in again.");
    }
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
      });
    } catch {
      throw new UnauthorizedException("Session expired. Please log in again.");
    }
    if (payload?.purpose) {
      throw new UnauthorizedException("Invalid refresh token");
    }
    let user: User;
    try {
      user = await this.usersService.findById(payload.sub);
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
    if (!user || user.refreshToken !== refreshToken) {
      throw new UnauthorizedException("Session expired. Please log in again.");
    }
    if (!user.isActive) {
      throw new UnauthorizedException("This account has been deactivated.");
    }
    return this.login(user);
  }

  // ---------------------------------------------------------------------------
  // Registration and email verification
  // ---------------------------------------------------------------------------

  async register(registerDto: RegisterDto, redirect?: string) {
    const email = normalizeEmail(registerDto.email);
    assertPasswordPolicy(registerDto.password);

    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      // Account created earlier by staff (salesperson/doctor) with this real email:
      // claim it instead of creating a second account. The password is only set through
      // the emailed link, so nobody can take over an account without owning the mailbox.
      if (existing.role === UserRole.CLIENT && (existing.accountSetupPending || !existing.lastLoginAt) && existing.isActive) {
        await this.usersService.update(existing.id, { accountSetupPending: true } as any);
        const fresh = await this.usersService.findById(existing.id);
        await this.accountLinks.sendSetPasswordLink(fresh, "client");
        return {
          requiresVerification: true,
          claimedExistingAccount: true,
          email,
          message: "You already have an account with us. We sent you an email with a link to set your password.",
        };
      }
      throw new ConflictException("User with this email already exists");
    }

    // Force role to CLIENT for public registration
    const userData = {
      ...registerDto,
      email,
      role: UserRole.CLIENT,
      referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      isEmailVerified: false,
    };
    delete (userData as any).clinicData;

    const user = await this.usersService.create(userData);

    if (registerDto.referralCode) {
      try {
        await this.loyaltyService.handleReferral(user.id, registerDto.referralCode);
      } catch (error) {
        console.error("[AuthService] Referral handling failed:", error.message);
      }
    }

    // If appointment data is provided during registration (for clients), create appointment
    if (registerDto.appointmentData && registerDto.role === UserRole.CLIENT) {
      try {
        await this.bookingsService.createAppointment({
          clinicId: registerDto.appointmentData.clinicId,
          serviceId: registerDto.appointmentData.serviceId,
          providerId: registerDto.appointmentData.providerId,
          clientId: user.id,
          startTime: registerDto.appointmentData.startTime,
          endTime: registerDto.appointmentData.endTime,
          notes: registerDto.appointmentData.notes,
          appointmentSource: 'platform_broker',
        });
      } catch (error) {
        console.error("[AuthService] Failed to create appointment during registration:", error.message);
      }
    }

    await this.accountLinks.sendVerificationLink(user, redirect);

    return {
      requiresVerification: true,
      email,
      message: "Account created. Please check your email and click the link to verify your address.",
    };
  }

  async resendVerification(email: string, redirect?: string) {
    const user = email ? await this.usersService.findByEmail(email) : null;
    if (user && user.isActive && !user.isEmailVerified) {
      await this.accountLinks.sendVerificationLink(user, redirect);
    }
    return { message: "If the address needs verification, a new link has been sent." };
  }

  async verifyEmail(token: string) {
    if (!token) throw new BadRequestException("Verification token is required.");
    const payload = this.accountLinks.verifyEmailToken(token);
    let user: User;
    try {
      user = await this.usersService.findById(payload.sub);
    } catch {
      throw new BadRequestException("Invalid verification link.");
    }
    if (normalizeEmail(user.email) !== normalizeEmail(payload.email)) {
      throw new BadRequestException("This link belongs to an older email address. Please request a new one.");
    }
    if (!user.isEmailVerified) {
      await this.usersService.markEmailVerified(user.id);
      try {
        await this.notificationsService.sendTriggeredNotification(
          NotificationTrigger.WELCOME_CREDENTIALS,
          user.id,
          { customerName: `${user.firstName} ${user.lastName}`, email: user.email },
        );
      } catch (error) {
        console.error("[AuthService] Failed to trigger welcome email:", error.message);
      }
    }
    return { verified: true, email: user.email, message: "Your email is verified. You can now log in." };
  }

  async logout(userId: string) {
    await this.usersService.updateRefreshToken(userId, null);
  }

  /** Revokes the session that belongs to a refresh token (used when the access token already expired). */
  async logoutByRefreshToken(refreshToken: string) {
    try {
      const payload: any = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
      });
      const user = await this.usersService.findById(payload.sub);
      if (user && user.refreshToken === refreshToken) {
        await this.usersService.updateRefreshToken(user.id, null);
      }
    } catch {
      // Expired or unknown token: nothing to revoke.
    }
  }

  // ---------------------------------------------------------------------------
  // Password reset / set-password links
  // ---------------------------------------------------------------------------

  async forgotPassword(email: string) {
    if (!email || !email.trim()) {
      throw new BadRequestException('Please provide a valid email address.');
    }

    const user = await this.usersService.findByEmail(email);
    if (user && user.isActive) {
      await this.accountLinks.sendPasswordResetLink(user);
    }

    // Always return success message for security (prevents user enumeration)
    return {
      message: 'If an account matches that email address, a password reset link has been dispatched.',
    };
  }

  async resetPassword(password: string, resetToken: string) {
    assertPasswordPolicy(password);
    if (!resetToken) {
      throw new BadRequestException('Reset token is required.');
    }

    const payload = this.accountLinks.verifyPasswordToken(resetToken);
    let user: User;
    try {
      user = await this.usersService.findById(payload.sub);
    } catch {
      throw new NotFoundException('User not found.');
    }
    // Single use: the link stops working once the password has changed.
    if (payload.pwf && payload.pwf !== this.accountLinks.passwordFingerprint(user.passwordHash)) {
      throw new BadRequestException('This link was already used. Please request a new one.');
    }
    if (!user.isActive) {
      throw new BadRequestException('This account is not active.');
    }

    // Opening the emailed link proves the mailbox belongs to the user.
    await this.usersService.setPassword(user.id, password, {
      isEmailVerified: true,
      accountSetupPending: false,
    } as any);

    return {
      message: 'Your password has been set. You can now log in.',
    };
  }
}
