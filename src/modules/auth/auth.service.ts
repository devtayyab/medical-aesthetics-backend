import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, ConflictException, HttpException, HttpStatus } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { createHash, createHmac, randomInt, randomUUID, timingSafeEqual } from "crypto";
import { DataSource } from "typeorm";
import { sessionHours } from "./auth-cookies";
import { UsersService } from "../users/users.service";
import { AccountLinksService } from "../users/account-links.service";
import { User, normalizeEmail } from "../users/entities/user.entity";
import { ConfigService } from "@nestjs/config";
import { RegisterDto } from "./dto/register.dto";
import { ClinicsService } from "../clinics/clinics.service";
import { UserRole } from "../../common/enums/user-role.enum";
import { LoyaltyService } from "../loyalty/loyalty.service";
import { resolveJwtSecret } from "../../common/utils/jwt-secret.util";
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
// An already-rotated refresh token still returns the session it produced for this long
const REFRESH_GRACE_SECONDS = 30;
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
    private dataSource: DataSource,
  ) { }

  // ---------------------------------------------------------------------------
  // Sessions: one row per logged-in device, so a login on the phone does not end the
  // session on the desktop (a single users.refreshToken could only hold one device).
  // ---------------------------------------------------------------------------

  private sessionsTableReady?: Promise<void>;

  /** The table also has a migration; creating it here keeps logins working if that has not run yet. */
  private ensureSessionsTable(): Promise<void> {
    if (!this.sessionsTableReady) {
      this.sessionsTableReady = this.dataSource
        .query(
          `CREATE TABLE IF NOT EXISTS "user_sessions" (
            "tokenHash" varchar(64) NOT NULL,
            "userId" uuid NOT NULL,
            "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
            "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "lastUsedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "PK_user_sessions" PRIMARY KEY ("tokenHash")
          )`,
        )
        .then(() => this.dataSource.query(`CREATE INDEX IF NOT EXISTS "IDX_user_sessions_userId" ON "user_sessions" ("userId")`))
        .then(() => undefined)
        .catch((err: any) => {
          this.sessionsTableReady = undefined;
          throw err;
        });
    }
    return this.sessionsTableReady;
  }

  /** Only a hash of the refresh token is stored, never the token itself. */
  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  private async revokeAllSessions(userId: string): Promise<void> {
    await this.ensureSessionsTable();
    await this.dataSource.query(`DELETE FROM "user_sessions" WHERE "userId" = $1`, [userId]);
  }

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
    if (!user.isEmailVerified && process.env.ENABLE_EMAIL_VERIFICATION !== "false") {
      throw new UnauthorizedException({
        statusCode: 401,
        code: "EMAIL_NOT_VERIFIED",
        message: "Παρακαλούμε επιβεβαιώστε πρώτα το email σας. / Please verify your email first. We sent you a link when you registered.",
      });
    }

    // failedLoginAttempts is only cleared after the email code is also correct (verifyLoginCode):
    // clearing it here would let a known password reset the lockout between code guesses.
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
    const secret = resolveJwtSecret("JWT_SECRET", "JWT_ACCESS_SECRET");
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

    // Count the attempt atomically BEFORE comparing, so parallel requests cannot all guess at count 0.
    const attempt = await this.usersService.incrementLoginCodeAttempts(user.id);
    if (attempt > LOGIN_CODE_MAX_ATTEMPTS) {
      throw new UnauthorizedException({ statusCode: 401, code: "CODE_EXPIRED", message: "Too many wrong codes. Please log in again." });
    }

    const expected = Buffer.from(user.loginCodeHash, "hex");
    const actual = Buffer.from(this.hashCode(user.id, cleaned), "hex");
    const ok = cleaned.length === 6 && expected.length === actual.length && timingSafeEqual(expected, actual);

    if (!ok) {
      if (attempt >= LOGIN_CODE_MAX_ATTEMPTS) {
        // Too many wrong codes: burn the code and count it as a failed login.
        await this.usersService.update(user.id, { loginCodeHash: null, loginCodeExpiresAt: null } as any);
        await this.registerFailedAttempt(user);
        throw new UnauthorizedException({ statusCode: 401, code: "CODE_EXPIRED", message: "Too many wrong codes. Please log in again." });
      }
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
  async login(user: User, replacesTokenHash?: string): Promise<IssuedSession> {
    const payload = { email: user.email, sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>("JWT_ACCESS_SECRET"),
      expiresIn: "15m",
    });
    // The session stays alive for SESSION_HOURS (default 12) after the last refresh; an
    // active user refreshes every 15 minutes, so they are never logged out while working.
    const ttlSeconds = sessionHours() * 60 * 60;
    const refreshToken = this.jwtService.sign({ ...payload, type: "refresh", jti: randomUUID() }, {
      secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
      expiresIn: ttlSeconds,
    });

    await this.ensureSessionsTable();
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    if (replacesTokenHash) {
      // Refresh: the same device keeps its session, with a new token
      await this.dataSource.query(
        `UPDATE "user_sessions" SET "tokenHash" = $1, "expiresAt" = $2, "lastUsedAt" = CURRENT_TIMESTAMP WHERE "tokenHash" = $3`,
        [tokenHash, expiresAt, replacesTokenHash],
      );
    } else {
      // New login. users.refreshToken = NULL means every session was revoked (password change,
      // deactivation): make sure none of the old devices comes back with this login.
      if (!user.refreshToken) await this.dataSource.query(`DELETE FROM "user_sessions" WHERE "userId" = $1`, [user.id]);
      await this.dataSource.query(`DELETE FROM "user_sessions" WHERE "userId" = $1 AND "expiresAt" < CURRENT_TIMESTAMP`, [user.id]);
      await this.dataSource.query(
        `INSERT INTO "user_sessions" ("tokenHash", "userId", "expiresAt") VALUES ($1, $2, $3) ON CONFLICT ("tokenHash") DO NOTHING`,
        [tokenHash, user.id, expiresAt],
      );
    }
    // Kept as the "sessions not revoked" marker (and for sessions issued before this change).
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

  /**
   * Refresh tokens rotate on every refresh. Two tabs (or a tab's restore + another tab's 401 retry)
   * often refresh with the same token at once: the second would fail and log the user out everywhere.
   * So the same old token gets the same new session for a short grace period (per server process).
   */
  private readonly recentRefreshes = new Map<string, { userId?: string; session: Promise<IssuedSession>; expiresAt: number }>();

  private forgetRecentRefreshes(userId: string) {
    for (const [token, entry] of this.recentRefreshes) {
      if (entry.userId === userId) this.recentRefreshes.delete(token);
    }
  }

  async refreshToken(refreshToken: string): Promise<IssuedSession> {
    const now = Date.now();
    for (const [token, entry] of this.recentRefreshes) {
      if (entry.expiresAt <= now) this.recentRefreshes.delete(token);
    }
    const recent = refreshToken ? this.recentRefreshes.get(refreshToken) : undefined;
    if (recent) return recent.session;

    const session = this.rotateRefreshToken(refreshToken);
    if (refreshToken) {
      const userId = (this.jwtService.decode(refreshToken) as any)?.sub;
      this.recentRefreshes.set(refreshToken, { userId, session, expiresAt: now + REFRESH_GRACE_SECONDS * 1000 });
      session.catch(() => this.recentRefreshes.delete(refreshToken));
    }
    return session;
  }

  private async rotateRefreshToken(refreshToken: string): Promise<IssuedSession> {
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
    // NULL = all sessions revoked (password change, deactivation, "log out everywhere")
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException("Session expired. Please log in again.");
    }
    if (!user.isActive) {
      throw new UnauthorizedException("This account has been deactivated.");
    }
    await this.ensureSessionsTable();
    const tokenHash = this.hashToken(refreshToken);
    const rows = await this.dataSource.query(
      `SELECT 1 FROM "user_sessions" WHERE "tokenHash" = $1 AND "userId" = $2 AND "expiresAt" > CURRENT_TIMESTAMP`,
      [tokenHash, user.id],
    );
    if (rows.length > 0) return this.login(user, tokenHash);
    // Session issued before per-device sessions existed: accept it once and register it.
    if (user.refreshToken === refreshToken) return this.login(user);
    throw new UnauthorizedException("Session expired. Please log in again.");
  }

  // ---------------------------------------------------------------------------
  // Registration and email verification
  // ---------------------------------------------------------------------------

  async register(registerDto: RegisterDto, redirect?: string) {
    const email = normalizeEmail(registerDto.email);
    assertPasswordPolicy(registerDto.password);

    const rawPhone = String(registerDto.phone || "").trim();
    const phoneDigits = rawPhone.replace(/\D/g, "");
    if (!rawPhone || phoneDigits.length < 8) {
      throw new BadRequestException(
        "Το κινητό τηλέφωνο είναι υποχρεωτικό για την εγγραφή. / Mobile phone number is mandatory during registration.",
      );
    }

    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      // Account created earlier by staff (salesperson/doctor) with this real email:
      // claim it instead of creating a second account. The password is only set through
      // the emailed link, so nobody can take over an account without owning the mailbox.
      if (existing.role === UserRole.CLIENT && (existing.accountSetupPending || !existing.lastLoginAt) && existing.isActive) {
        // The customer asked for this email themselves, so it goes out even while automatic
        // invitations are switched off. Only promise an email that was really sent.
        const result = await this.accountLinks.deliverClientInvitation(existing, { requestedBy: "customer" });
        if (!result.sent && result.reason !== "just_sent") {
          console.warn(`Set-password email for existing account ${existing.id} not sent: ${result.reason}`);
          throw new ConflictException(
            "Υπάρχει ήδη λογαριασμός με αυτό το email, αλλά δεν μπορέσαμε να στείλουμε το email ορισμού κωδικού. Επικοινωνήστε μαζί μας στο info@beautydoctors.gr. / An account with this email already exists, but we could not send the set-password email. Please contact us at info@beautydoctors.gr.",
          );
        }
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

  /** Ends every session of the user, on all devices. */
  async logout(userId: string) {
    this.forgetRecentRefreshes(userId);
    await this.revokeAllSessions(userId);
    await this.usersService.updateRefreshToken(userId, null);
  }

  /** Revokes the session that belongs to a refresh token (used when the access token already expired). */
  async logoutByRefreshToken(refreshToken: string) {
    try {
      const payload: any = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
      });
      this.recentRefreshes.delete(refreshToken);
      // Only this device is logged out; the user's other devices keep their sessions.
      await this.ensureSessionsTable();
      const deleted = await this.dataSource.query(
        `DELETE FROM "user_sessions" WHERE "tokenHash" = $1 AND "userId" = $2 RETURNING "tokenHash"`,
        [this.hashToken(refreshToken), payload.sub],
      );
      const removed = Array.isArray(deleted?.[0]) ? deleted[0].length : (deleted?.length || 0);
      if (!removed) {
        // Session from before per-device sessions: the old single-token behaviour
        const user = await this.usersService.findById(payload.sub);
        if (user && user.refreshToken === refreshToken) {
          await this.usersService.updateRefreshToken(user.id, null);
        }
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

  /** Expired "Set your password" link: emails a new one to the same account. */
  async renewSetupLink(token: string) {
    const payload = token ? this.accountLinks.verifyExpiredSetupToken(token) : null;
    const user = payload ? await this.usersService.findById(payload.sub).catch(() => null) : null;
    if (!user || !user.accountSetupPending || normalizeEmail(user.email) !== normalizeEmail(payload!.email)) {
      throw new BadRequestException("This link is no longer valid. If you already set a password, please log in.");
    }
    const result = await this.accountLinks.deliverClientInvitation(user, { requestedBy: "customer" });
    if (!result.sent && result.reason !== "just_sent") {
      throw new BadRequestException("We could not send a new link. Please contact us at info@beautydoctors.gr.");
    }
    return { message: "We sent a new link to your email." };
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
