import { Module } from '@nestjs/common';
import { HubspotService } from './hubspot.service';
import { HubspotController } from './hubspot.controller';

@Module({
  providers: [HubspotService],
  controllers: [HubspotController],
  exports: [HubspotService],
})
export class HubspotModule {}
