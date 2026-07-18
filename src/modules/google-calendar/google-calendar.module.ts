import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';

import { ClinicCalendarConnection } from './entities/clinic-calendar-connection.entity';
import { Appointment } from '../bookings/entities/appointment.entity';
import { BlockedTimeSlot } from '../bookings/entities/blocked-time-slot.entity';
import { ClinicsModule } from '../clinics/clinics.module';
import { NotificationsModule } from '../notifications/notifications.module';

import { GoogleCalendarConfig } from './google-calendar.config';
import { TokenCryptoService } from './services/token-crypto.service';
import { GoogleOAuthService } from './services/google-oauth.service';
import { CalendarConnectionService } from './services/calendar-connection.service';
import { GoogleCalendarClientService } from './services/google-calendar-client.service';
import { CalendarOutboundService } from './services/calendar-outbound.service';
import { CalendarInboundService } from './services/calendar-inbound.service';
import { GoogleCalendarService } from './google-calendar.service';
import { CalendarSyncListener } from './listeners/calendar-sync.listener';
import { CalendarSyncProcessor } from './processors/calendar-sync.processor';
import { CalendarSyncScheduler } from './calendar-sync.scheduler';
import { GoogleCalendarController } from './google-calendar.controller';
import { GoogleCalendarWebhookController } from './google-calendar-webhook.controller';
import { CALENDAR_SYNC_QUEUE } from './calendar-sync.constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClinicCalendarConnection,
      Appointment,
      BlockedTimeSlot,
    ]),
    BullModule.registerQueue({ name: CALENDAR_SYNC_QUEUE }),
    ScheduleModule,
    ClinicsModule,
    NotificationsModule,
  ],
  controllers: [GoogleCalendarController, GoogleCalendarWebhookController],
  providers: [
    GoogleCalendarConfig,
    TokenCryptoService,
    GoogleOAuthService,
    CalendarConnectionService,
    GoogleCalendarClientService,
    CalendarOutboundService,
    CalendarInboundService,
    GoogleCalendarService,
    CalendarSyncListener,
    CalendarSyncProcessor,
    CalendarSyncScheduler,
  ],
  exports: [GoogleCalendarService, CalendarConnectionService],
})
export class GoogleCalendarModule {}
