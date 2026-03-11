import { Module, forwardRef } from '@nestjs/common';
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
import { PaymentsModule } from '../payments/payments.module';
import { User } from '../users/entities/user.entity';
import { Clinic } from '../clinics/entities/clinic.entity';
import { Appointment } from '../bookings/entities/appointment.entity';
import { LoyaltyLedger } from '../loyalty/entities/loyalty-ledger.entity';
import { PaymentRecord } from '../payments/entities/payment-record.entity';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { GiftCardsController } from './gift-cards.controller';
import { GiftCardsService } from './gift-cards.service';

import { GiftCard } from '../clinics/entities/gift-card.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { BlogsController } from './blogs.controller';
import { BlogsService } from './blogs.service';
import { BlogSchedulerService } from './blog-scheduler.service';
import { PublicBlogsController } from './public-blogs.controller';
import { Treatment } from '../clinics/entities/treatment.entity';
import { TreatmentCategory } from '../clinics/entities/treatment-category.entity';

import { BlogCategory, BlogPost } from '../clinics/entities/blog.entity';
import { AgentClinicAccess } from '../crm/entities/agent-clinic-access.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { CrmModule } from '../crm/crm.module';
import { Lead } from '../crm/entities/lead.entity';
import { AuditModule } from '../audit/audit.module';

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
      PaymentRecord,
      LoyaltyLedger,
      GiftCard,
      BlogCategory,
      BlogPost,
      AgentClinicAccess,
      Lead,
      Treatment,
      TreatmentCategory,
      AuditLog,
    ]),
    UsersModule,
    ClinicsModule,
    BookingsModule,
    LoyaltyModule,
    NotificationsModule,
    PaymentsModule,
    forwardRef(() => CrmModule),
    AuditModule,
  ],
  controllers: [AdminController, WalletController, GiftCardsController, PaymentsController, BlogsController, PublicBlogsController],
  providers: [AdminService, WalletService, GiftCardsService, PaymentsService, BlogsService, BlogSchedulerService],
  exports: [AdminService],
})
export class AdminModule { }