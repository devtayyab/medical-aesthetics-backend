import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from '../modules/users/entities/user.entity';
import { Clinic } from '../modules/clinics/entities/clinic.entity';
import { Service } from '../modules/clinics/entities/service.entity';
import { Lead, CrmAction, CustomerRecord } from '../modules/crm/entities';
import { Tag } from '../modules/admin/entities/tag.entity';
import { AuditLog } from '../modules/audit/entities/audit-log.entity';
import { ConsentRecord } from '../modules/users/entities/consent-record.entity';
import { CommunicationLog } from '../modules/crm/entities/communication-log.entity';
import { CustomerTag } from '../modules/crm/entities/customer-tag.entity';
import { AdAttribution } from '../modules/crm/entities/ad-attribution.entity';
import { AdCampaign } from '../modules/crm/entities/ad-campaign.entity';
import { Task } from '../modules/tasks/entities/task.entity';
import { Appointment } from '../modules/bookings/entities/appointment.entity';
import { AppointmentHold } from '../modules/bookings/entities/appointment-hold.entity';
import { LoyaltyLedger } from '../modules/loyalty/entities/loyalty-ledger.entity';
import { Notification } from '../modules/notifications/entities/notification.entity';

dotenv.config();

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || '127.0.0.1',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'medical_aesthetics',
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
    ],
    migrations: ['src/migrations/*.ts'],
    synchronize: false,
    logging: true,
});
