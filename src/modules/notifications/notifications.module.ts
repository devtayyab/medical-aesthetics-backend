import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { FirebaseService } from './services/firebase.service';
import { SmsService } from './services/sms.service';
import { ViberService } from './services/viber.service';
import { NotificationProcessor } from './processors/notification.processor';
import { Notification } from './entities/notification.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    BullModule.registerQueue({
      name: 'notifications',
    }),
    forwardRef(() => UsersModule),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    FirebaseService,
    SmsService,
    ViberService,
    NotificationProcessor,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}