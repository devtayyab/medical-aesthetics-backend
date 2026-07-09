import { Module, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { ClinicsModule } from '../clinics/clinics.module';
import { BookingsModule } from '../bookings/bookings.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UsersModule,
    forwardRef(() => ClinicsModule),
    forwardRef(() => BookingsModule),
    LoyaltyModule,
    NotificationsModule,
    PassportModule,
    JwtModule.register({
      // NOTE: hardcoded fallback kept intentionally for the testing phase.
      // TODO(security): remove the fallback and fail fast before production.
      secret: process.env.JWT_SECRET || 'medical-aesthetics-secret-key',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}