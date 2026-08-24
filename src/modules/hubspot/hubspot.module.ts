import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HubspotService } from './hubspot.service';
import { HubspotController } from './hubspot.controller';
import { CommunicationLog } from '../crm/entities/communication-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CommunicationLog])],
  providers: [HubspotService],
  controllers: [HubspotController],
  exports: [HubspotService],
})
export class HubspotModule {}

