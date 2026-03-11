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
import { NotificationsModule } from '../notifications/notifications.module';
import { User } from '../users/entities/user.entity';
import { Clinic } from '../clinics/entities/clinic.entity';
import { Appointment } from '../bookings/entities/appointment.entity';
import { LoyaltyLedger } from '../loyalty/entities/loyalty-ledger.entity';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { GiftCardsController } from './gift-cards.controller';
import { GiftCardsService } from './gift-cards.service';

import { GiftCard } from '../clinics/entities/gift-card.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { BlogsController } from './blogs.controller';
import { BlogsService } from './blogs.service';

import { BlogCategory, BlogPost } from '../clinics/entities/blog.entity';
import { AgentClinicAccess } from '../crm/entities/agent-clinic-access.entity';

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
      GiftCard,
      BlogCategory,
      BlogPost,
      AgentClinicAccess,
    ]),
    UsersModule,
    ClinicsModule,
    BookingsModule,
    LoyaltyModule,
    NotificationsModule,
  ],
  controllers: [AdminController, WalletController, GiftCardsController, PaymentsController, BlogsController],
  providers: [AdminService, WalletService, GiftCardsService, PaymentsService, BlogsService],
  exports: [AdminService],
})
export class AdminModule { }