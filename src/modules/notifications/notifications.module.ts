import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { FirebaseService } from './services/firebase.service';
import { MailService } from './services/mail.service';
import { NotificationProcessor } from './processors/notification.processor';
import { NotificationsGateway } from './gateways/notifications.gateway';
import { Notification } from './entities/notification.entity';
import { NotificationTemplate } from './entities/notification-template.entity';
import { Clinic } from '../clinics/entities/clinic.entity';
import { User } from '../users/entities/user.entity';
import { NotificationDispatch } from './entities/notification-dispatch.entity';
import { ContactMessage } from './entities/contact-message.entity';
import { NotificationDeliveryService } from './services/notification-delivery.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, NotificationTemplate, Clinic, User, NotificationDispatch, ContactMessage]),
    BullModule.registerQueue({
      name: 'notifications',
    }),
    forwardRef(() => UsersModule),
    JwtModule,
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsGateway,
    FirebaseService,
    MailService,
    NotificationDeliveryService,
    NotificationProcessor,
  ],
  exports: [NotificationsService, NotificationsGateway, MailService],
})
export class NotificationsModule { }