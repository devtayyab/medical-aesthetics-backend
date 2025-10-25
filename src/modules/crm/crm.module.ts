import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';
import { Lead } from './entities/lead.entity';
import { CustomerRecord } from './entities/customer-record.entity';
import { CommunicationLog } from './entities/communication-log.entity';
import { CrmAction } from './entities/crm-action.entity';
import { CustomerTag } from './entities/customer-tag.entity';
import { FormSubmission } from './entities/form-submission.entity';
import { User } from '../users/entities/user.entity';
import { Appointment } from '../bookings/entities/appointment.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Lead,
      CustomerRecord,
      CommunicationLog,
      CrmAction,
      CustomerTag,
      FormSubmission,
      User,
      Appointment,
    ]),
    BookingsModule,
    NotificationsModule,
    UsersModule,
  ],
  controllers: [CrmController],
  providers: [CrmService],
  exports: [CrmService],
})
export class CrmModule {}