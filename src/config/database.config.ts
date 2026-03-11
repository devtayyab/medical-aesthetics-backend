import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';


import { User } from '../modules/users/entities/user.entity';
import { Clinic } from '../modules/clinics/entities/clinic.entity';
import { Service } from '../modules/clinics/entities/service.entity';
import { Treatment } from '../modules/clinics/entities/treatment.entity';
import { TreatmentCategory } from '../modules/clinics/entities/treatment-category.entity';
import { Review } from '../modules/clinics/entities/review.entity';
import { GiftCard } from '../modules/clinics/entities/gift-card.entity';
import { BlogPost, BlogCategory } from '../modules/clinics/entities/blog.entity';
import { Lead, CrmAction, CustomerRecord } from '../modules/crm/entities';
import { Tag } from '../modules/admin/entities/tag.entity';
import { Offer } from '../modules/admin/entities/offer.entity';
import { Reward } from '../modules/admin/entities/reward.entity';
import { PlatformSettings } from '../modules/admin/entities/platform-settings.entity';
import { AuditLog } from '../modules/audit/entities/audit-log.entity';
import { ConsentRecord } from '../modules/users/entities/consent-record.entity';
import { CommunicationLog } from '../modules/crm/entities/communication-log.entity';
import { CustomerTag } from '../modules/crm/entities/customer-tag.entity';
import { AdAttribution } from '../modules/crm/entities/ad-attribution.entity';
import { AdCampaign } from '../modules/crm/entities/ad-campaign.entity';
import { Task } from '../modules/tasks/entities/task.entity';
import { Appointment } from '../modules/bookings/entities/appointment.entity';
import { AppointmentHold } from '../modules/bookings/entities/appointment-hold.entity';
import { LoyaltyLedger } from '../modules/loyalty/entities/loyalty-ledger.entity';
import { Notification } from '../modules/notifications/entities/notification.entity';
import { BlockedTimeSlot } from '../modules/bookings/entities/blocked-time-slot.entity';
import { AgentClinicAccess } from '../modules/crm/entities/agent-clinic-access.entity';
import { LeadClinicStatus } from '../modules/crm/entities/lead-clinic-status.entity';
import { Conversation } from '../modules/messages/entities/conversation.entity';
import { Message } from '../modules/messages/entities/message.entity';
import { ConversationParticipant } from '../modules/messages/entities/conversation-participant.entity';
import { PaymentRecord } from '../modules/payments/entities/payment-record.entity';
import { NotificationTemplate } from '../modules/notifications/entities/notification-template.entity';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) { }

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: this.configService.get('DATABASE_HOST', 'localhost'),
      port: this.configService.get('DATABASE_PORT', 5432),
      username: this.configService.get('DATABASE_USERNAME', 'postgres'),
      password: this.configService.get('DATABASE_PASSWORD', 'postgres'),
      database: this.configService.get('DATABASE_NAME', 'medical_aesthetics'),
      entities: [
        User,
        Clinic,
        Service,
        Treatment,
        TreatmentCategory,
        Lead,
        CommunicationLog,
        CustomerRecord,
        CrmAction,
        CustomerTag,
        Task,
        Appointment,
        AppointmentHold,
        LoyaltyLedger,
        Notification,
        Tag,
        Offer,
        Reward,
        PlatformSettings,
        AuditLog,
        ConsentRecord,
        AdAttribution,
        AdCampaign,
        BlockedTimeSlot,
        Review,
        AgentClinicAccess,
        LeadClinicStatus,
        Conversation,
        Message,
        ConversationParticipant,
        GiftCard,
        BlogPost,
        BlogCategory,
        PaymentRecord,
        NotificationTemplate,
      ],
      // Since we are running in Docker on the same network, we don't need SSL
      // If using a managed database like AWS RDS in the future, we might need to enable this again
      ssl: false,
      synchronize: this.configService.get('DB_SYNCHRONIZE') === 'true',
    };
  }
}