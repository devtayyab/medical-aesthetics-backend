import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AccountLinksService } from './account-links.service';
import { AccountSetupListener } from './account-setup.listener';
import { User } from './entities/user.entity';
import { ConsentRecord } from './entities/consent-record.entity';
import { ClinicOwnership } from '../crm/entities/clinic-ownership.entity';
import { NotificationTemplate } from '../notifications/entities/notification-template.entity';
import { EmailBounce } from '../notifications/entities/email-bounce.entity';
import { MailService } from '../notifications/services/mail.service';
import { EmailSuppressionService } from '../notifications/services/email-suppression.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, ConsentRecord, ClinicOwnership, NotificationTemplate, EmailBounce]),
    // Secrets are passed per call in AccountLinksService.
    JwtModule.register({}),
  ],
  controllers: [UsersController],
  // MailService & EmailSuppressionService only need ConfigService + TypeORM repos, so they are
  // provided here directly to avoid a circular import with NotificationsModule.
  providers: [UsersService, AccountLinksService, AccountSetupListener, MailService, EmailSuppressionService],
  exports: [UsersService, AccountLinksService],
})
export class UsersModule {}
