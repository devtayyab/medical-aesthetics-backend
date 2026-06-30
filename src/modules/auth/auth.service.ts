import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { UsersService } from "../users/users.service";
import { User } from "../users/entities/user.entity";
import { ConfigService } from "@nestjs/config";
import { RegisterDto } from "./dto/register.dto";
import { ClinicsService } from "../clinics/clinics.service";
import { UserRole } from "../../common/enums/user-role.enum";
import { LoyaltyService } from "../loyalty/loyalty.service";
import { BookingsService } from "../bookings/bookings.service";
import { NotificationsService } from "../notifications/notifications.service";
import { NotificationTrigger } from "../../common/enums/notification-trigger.enum";

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
  ) { }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      console.log("[AuthService] User validated:", user.email);
      return user;
    }
    console.log("[AuthService] User validation failed for:", email);
    return null;
  }

  async login(user: User) {
    console.log("[AuthService] Login for user:", user.email);
    const payload = { email: user.email, sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>("JWT_ACCESS_SECRET"),
      expiresIn: "15m",
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
      expiresIn: "7d",
    });
    await this.usersService.updateRefreshToken(user.id, refreshToken);
    const {
      passwordHash,
      refreshToken: storedRefreshToken,
      ...userData
    } = user;
    console.log(
      "[AuthService] Login success for user:",
      user.email,
      "refreshToken:",
      refreshToken.substring(0, 20) + "..."
    );
    return {
      accessToken,
      refreshToken,
      user: userData,
    };
  }

  async refreshToken(refreshToken: string) {
    console.log(
      "[AuthService] Attempting token refresh with token:",
      refreshToken.substring(0, 20) + "..."
    );
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
      });
      const user = await this.usersService.findById(payload.sub);
      if (!user || user.refreshToken !== refreshToken) {
        console.log(
          "[AuthService] Invalid refresh token for user:",
          payload.email
        );
        throw new UnauthorizedException("Invalid refresh token");
      }
      const newPayload = { email: user.email, sub: user.id, role: user.role };
      const accessToken = this.jwtService.sign(newPayload, {
        secret: this.configService.get<string>("JWT_ACCESS_SECRET"),
        expiresIn: "15m",
      });
      const newRefreshToken = this.jwtService.sign(newPayload, {
        secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
        expiresIn: "7d",
      });
      await this.usersService.updateRefreshToken(user.id, newRefreshToken);
      const {
        passwordHash,
        refreshToken: storedRefreshToken,
        ...userData
      } = user;
      console.log(
        "[AuthService] Token refreshed for user:",
        user.email,
        "new refreshToken:",
        newRefreshToken.substring(0, 20) + "..."
      );
      return {
        accessToken,
        refreshToken: newRefreshToken,
        user: userData,
      };
    } catch (error) {
      console.error("[AuthService] Refresh token error:", error.message);
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  async register(registerDto: RegisterDto) {
    console.log(
      "[AuthService] Registering user:",
      registerDto.email
    );

    // Force role to CLIENT for public registration
    const userData = {
      ...registerDto,
      role: UserRole.CLIENT,
      referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      isEmailVerified: false,
    };

    // Create user
    const user = await this.usersService.create(userData);

    // Handle referral if code provided
    if (registerDto.referralCode) {
      try {
        await this.loyaltyService.handleReferral(user.id, registerDto.referralCode);
      } catch (error) {
        console.error("[AuthService] Referral handling failed:", error.message);
      }
    }

    // If appointment data is provided during registration (for clients), create appointment
    if (registerDto.appointmentData && registerDto.role === UserRole.CLIENT) {
      console.log("[AuthService] Creating appointment during registration for user:", user.id);
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
        console.log("[AuthService] Appointment created successfully during registration");
      } catch (error) {
        console.error("[AuthService] Failed to create appointment during registration:", error.message);
      }
    }

    // Generate a 6-digit OTP and save it with 15-min expiry
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000);
    await this.usersService.saveEmailVerificationToken(user.id, otp, expiry);

    // Send OTP via email
    try {
      await this.notificationsService.sendEmailVerificationOtp(user.id, user.firstName, otp);
      console.log("[AuthService] Verification OTP sent to:", user.email);
    } catch (error) {
      console.error("[AuthService] Failed to send OTP email:", error.message);
    }

    // Return userId so frontend can show the OTP input screen
    return {
      requiresVerification: true,
      userId: user.id,
      email: user.email,
      message: 'A verification code has been sent to your email address. Please enter it to activate your account.',
    };
  }

  async verifyEmail(userId: string, otp: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.isEmailVerified) {
      // Already verified — just log them in
      return this.login(user);
    }

    if (!user.emailVerificationToken || user.emailVerificationToken !== otp) {
      throw new UnauthorizedException('Invalid verification code');
    }

    if (!user.emailVerificationExpiry || new Date() > user.emailVerificationExpiry) {
      throw new UnauthorizedException('Verification code has expired. Please register again or request a new code.');
    }

    // Mark as verified and clear token
    await this.usersService.markEmailVerified(userId);

    // Send Welcome Email
    try {
      await this.notificationsService.sendTriggeredNotification(
        NotificationTrigger.WELCOME_CREDENTIALS,
        user.id,
        {
          customerName: `${user.firstName} ${user.lastName}`,
          email: user.email,
        }
      );
    } catch (error) {
      console.error("[AuthService] Failed to trigger welcome email:", error.message);
    }

    const verifiedUser = await this.usersService.findById(userId);
    return this.login(verifiedUser);
  }

  async logout(userId: string) {
    console.log("[AuthService] Logging out user:", userId);
    await this.usersService.updateRefreshToken(userId, null);
    console.log("[AuthService] Logout success for user:", userId);
  }
}
