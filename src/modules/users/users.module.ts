import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { ConsentRecord } from './entities/consent-record.entity';
import { ClinicOwnership } from '../crm/entities/clinic-ownership.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, ConsentRecord, ClinicOwnership])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}