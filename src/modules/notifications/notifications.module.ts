import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { FirebaseService } from './services/firebase.service';
import { SmsService } from './services/sms.service';
import { ViberService } from './services/viber.service';
import { NotificationProcessor } from './processors/notification.processor';
import { NotificationsGateway } from './gateways/notifications.gateway';
import { Notification } from './entities/notification.entity';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
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
    SmsService,
    ViberService,
    NotificationProcessor,
  ],
  exports: [NotificationsService, NotificationsGateway, SmsService],
})
export class NotificationsModule { }