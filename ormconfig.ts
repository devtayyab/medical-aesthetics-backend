import { DataSource } from "typeorm";
import { config } from "dotenv";
import * as path from 'path';

config();

import { User } from './src/modules/users/entities/user.entity';
import { Clinic } from './src/modules/clinics/entities/clinic.entity';
import { Service } from './src/modules/clinics/entities/service.entity';
import { Lead, CrmAction, CustomerRecord } from './src/modules/crm/entities';
import { Tag } from './src/modules/admin/entities/tag.entity';
import { AuditLog } from './src/modules/audit/entities/audit-log.entity';
import { ConsentRecord } from './src/modules/users/entities/consent-record.entity';
import { CommunicationLog } from './src/modules/crm/entities/communication-log.entity';
import { CustomerTag } from './src/modules/crm/entities/customer-tag.entity';
import { AdAttribution } from './src/modules/crm/entities/ad-attribution.entity';
import { AdCampaign } from './src/modules/crm/entities/ad-campaign.entity';
import { Task } from './src/modules/tasks/entities/task.entity';
import { Appointment } from './src/modules/bookings/entities/appointment.entity';
import { AppointmentHold } from './src/modules/bookings/entities/appointment-hold.entity';
import { LoyaltyLedger } from './src/modules/loyalty/entities/loyalty-ledger.entity';
import { Notification } from './src/modules/notifications/entities/notification.entity';
import { BlockedTimeSlot } from './src/modules/bookings/entities/blocked-time-slot.entity';
import { AgentClinicAccess } from './src/modules/crm/entities/agent-clinic-access.entity';

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DATABASE_HOST || "localhost",
    port: parseInt(process.env.DATABASE_PORT || "5432"),
    username: process.env.DATABASE_USERNAME || "postgres",
    password: process.env.DATABASE_PASSWORD || "postgres",
    database: process.env.DATABASE_NAME || "medical_aesthetics",
    entities: [
        User,
        Clinic,
        Service,
        Lead,
        CommunicationLog,
        CustomerRecord,
        CrmAction,
        CustomerTag,
        Task,
        Appointment,
        AppointmentHold,
        LoyaltyLedger,
        Notification,
        Tag,
        AuditLog,
        ConsentRecord,
        AdAttribution,
        AdCampaign,
        BlockedTimeSlot,
        AgentClinicAccess
    ],
    synchronize: false, // Don't auto-sync in production
    logging: true,
});
