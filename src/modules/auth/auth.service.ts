import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { UsersService } from "../users/users.service";
import { User } from "../users/entities/user.entity";
import { ConfigService } from "@nestjs/config";
import { RegisterDto } from "./dto/register.dto";
import { ClinicsService } from "../clinics/clinics.service";
import { UserRole } from "@/common/enums/user-role.enum";
import { LoyaltyService } from "../loyalty/loyalty.service";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private clinicsService: ClinicsService,
    private loyaltyService: LoyaltyService
  ) { }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    // console the db password for testing
    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      console.log("[AuthService] User validated:", user.email);
      return user;
    }
    console.log("[AuthService] User validation failed for:", email);
    return user;
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
      registerDto.email,
      "with role:",
      registerDto.role
    );

    // Create user
    const user = await this.usersService.create({
      ...registerDto,
      referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
    });

    // Handle referral if code provided
    if (registerDto.referralCode) {
      try {
        await this.loyaltyService.handleReferral(user.id, registerDto.referralCode);
      } catch (error) {
        console.error("[AuthService] Referral handling failed:", error.message);
      }
    }

    // If role is clinic_owner and clinicData is provided, create clinic
    if (
      registerDto.role === UserRole.CLINIC_OWNER ||
      registerDto.role === UserRole.DOCTOR ||
      (registerDto.role === UserRole.SECRETARIAT && registerDto?.clinicData)
    ) {
      console.log("[AuthService] Creating clinic for user:", user.id);
      try {
        // Ensure required fields are present
        if (!registerDto.clinicData?.address) {
          throw new Error("Address is required for clinic creation");
        }

        await this.clinicsService.createClinic({
          name: registerDto.clinicData.name,
          description: registerDto.clinicData.description || "", // Provide default empty description
          address: registerDto.clinicData.address,
          phone: registerDto.clinicData.phone,
          email: registerDto.clinicData.email,
          ownerId: user.id,
        });
        console.log("[AuthService] Clinic created successfully");
      } catch (error) {
        console.error("[AuthService] Failed to create clinic:", error.message);
        // Continue with registration even if clinic creation fails
      }
    }

    // Generate tokens and return
    return this.login(user);
  }

  async logout(userId: string) {
    console.log("[AuthService] Logging out user:", userId);
    await this.usersService.updateRefreshToken(userId, null);
    console.log("[AuthService] Logout success for user:", userId);
  }
}
