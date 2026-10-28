import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AccountLinksService } from './account-links.service';
import { User } from './entities/user.entity';
import { ConsentRecord } from './entities/consent-record.entity';
import { ClinicOwnership } from '../crm/entities/clinic-ownership.entity';
import { MailService } from '../notifications/services/mail.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, ConsentRecord, ClinicOwnership]),
    // Secrets are passed per call in AccountLinksService.
    JwtModule.register({}),
  ],
  controllers: [UsersController],
  // MailService only needs ConfigService, so it is provided here directly to avoid a
  // circular import with NotificationsModule.
  providers: [UsersService, AccountLinksService, MailService],
  exports: [UsersService, AccountLinksService],
})
export class UsersModule {}
