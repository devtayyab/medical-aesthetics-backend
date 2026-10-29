import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { ACCESS_COOKIE, readCookie } from '../auth-cookies';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private usersService: UsersService,
    private configService: ConfigService,
  ) {
    super({
      // Bearer header first (mobile app / transition), then the httpOnly access cookie.
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: any) => readCookie(req, ACCESS_COOKIE),
      ]),
      ignoreExpiration: false,
      // NOTE: hardcoded fallback kept intentionally for the testing phase. Remove before production.
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET') || configService.get<string>('JWT_SECRET') || 'medical-aesthetics-secret-key',
    });
  }

  async validate(payload: any) {
    // Purpose tokens (login challenge, password reset, email verification) and refresh tokens
    // can share a secret with access tokens; they must never authenticate an API call.
    if (!payload?.sub || payload.purpose || payload.type === 'refresh') {
      throw new UnauthorizedException();
    }
    let user;
    try {
      user = await this.usersService.findById(payload.sub);
    } catch {
      throw new UnauthorizedException();
    }
    // Deactivation takes effect immediately, also for tokens issued before it.
    if (!user || !user.isActive) {
      throw new UnauthorizedException('This account has been deactivated.');
    }
    return user;
  }
}
