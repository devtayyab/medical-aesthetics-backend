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

@Module({
  imports: [
    TypeOrmModule.forFeature([Tag, Offer, Reward, PlatformSettings]),
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