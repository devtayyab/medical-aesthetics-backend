import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { FirebaseService } from './services/firebase.service';
import { NotificationProcessor } from './processors/notification.processor';
import { NotificationsGateway } from './gateways/notifications.gateway';
import { Notification } from './entities/notification.entity';
import { NotificationTemplate } from './entities/notification-template.entity';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, NotificationTemplate]),
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
    NotificationProcessor,
  ],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule { }