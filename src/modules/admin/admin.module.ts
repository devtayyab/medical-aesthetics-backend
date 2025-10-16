import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Tag } from './entities/tag.entity';
import { Offer } from './entities/offer.entity';
import { Reward } from './entities/reward.entity';
import { PlatformSettings } from './entities/platform-settings.entity';
import { UsersModule } from '../users/users.module';
import { ClinicsModule } from '../clinics/clinics.module';
import { BookingsModule } from '../bookings/bookings.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { User } from '../users/entities/user.entity';
import { Clinic } from '../clinics/entities/clinic.entity';
import { Appointment } from '../bookings/entities/appointment.entity';
import { LoyaltyLedger } from '../loyalty/entities/loyalty-ledger.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tag,
      Offer,
      Reward,
      PlatformSettings,
      User,
      Clinic,
      Appointment,
      LoyaltyLedger,
    ]),
    UsersModule,
    ClinicsModule,
    BookingsModule,
    LoyaltyModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}