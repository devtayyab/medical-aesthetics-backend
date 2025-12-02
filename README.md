# Medical Aesthetics Platform Backend

A comprehensive backend API for a Medical Aesthetics Platform built with NestJS and PostgreSQL. This platform connects clients, clinics, salespeople, and administrators through a broker-led system handling lead intake, CRM, appointment scheduling, clinic operations, loyalty programs, and multi-channel notifications.

## 🚀 Features

### Core Functionality
- **Authentication & Authorization**: JWT-based auth with role-based access control (RBAC)
- **User Management**: Support for Admin, Clinic Owner, Doctor, Secretariat, Salesperson, and Client roles
- **CRM System**: Complete lead management with status tracking and assignment
- **Appointment Booking**: Advanced scheduling with availability management and hold functionality
- **Task Management**: Automated task creation for follow-ups and reminders
- **Loyalty Program**: Points-based system with tier management
- **Multi-Channel Notifications**: Push, SMS, Viber, and Email notifications
- **Admin Panel**: Platform management and comprehensive reporting

### Technical Features
- **Event-Driven Architecture**: Real-time event handling for business processes
- **Background Processing**: BullMQ queues for reminders, follow-ups, and recurring tasks
- **Audit Logging**: Complete audit trail for all system changes
- **GDPR Compliance**: Data export, deletion, and consent management
- **Timezone Support**: Proper timezone handling for global operations
- **Soft Delete**: Data integrity with soft deletion capabilities
- **Input Validation**: Comprehensive validation using class-validator
- **API Documentation**: Auto-generated Swagger/OpenAPI documentation

## 🛠️ Tech Stack

- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with Passport.js
- **Queues**: BullMQ with Redis
- **Notifications**: Firebase (Push), SMS/Viber gateway integration
- **Documentation**: Swagger/OpenAPI
- **Language**: TypeScript

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 13+
- Redis 6+
- npm or yarn

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd medical-aesthetics-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration values.

4. **Start services with Docker (recommended)**
   ```bash
   docker-compose up -d postgres redis
   ```

   Or install PostgreSQL and Redis locally.

5. **Run database migrations**
   ```bash
   npm run migration:run
   ```

6. **Start the development server**
   ```bash
   npm run start:dev
   ```

## 📚 API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000

## 🎯 Core Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout

### User Management
- `GET /users/me` - Get current user profile
- `PATCH /users/me/profile` - Update own profile
- `GET /users/me/export` - Export user data (GDPR)
- `POST /users/me/delete` - Delete user data (GDPR)

### CRM & Leads
- `POST /crm/leads` - Create lead from ads/webhook
- `GET /crm/leads` - List/filter/search leads
- `GET /crm/leads/{id}` - Get lead details
- `PATCH /crm/leads/{id}` - Update lead information

### Appointments & Booking
- `GET /availability` - Get available time slots
- `POST /appointments/hold` - Hold a slot temporarily
- `POST /appointments` - Confirm appointment booking
- `PATCH /appointments/{id}/reschedule` - Reschedule appointment
- `PATCH /appointments/{id}/complete` - Mark as completed

### Tasks
- `POST /tasks` - Create task
- `GET /tasks` - List tasks with filters
- `PATCH /tasks/{id}` - Update task status

### Loyalty Program
- `GET /loyalty/{clientId}` - Get loyalty balance & tier
- `POST /loyalty/redeem` - Redeem points for discount
- `GET /loyalty/{clientId}/history` - Transaction history

### Notifications
- `POST /notifications/send` - Send notification
- `GET /notifications` - List user notifications
- `GET /notifications/unread-count` - Get unread count

### Admin Panel
- `POST /admin/tags` - Create CRM tag
- `GET /admin/reports` - Platform analytics
- `PATCH /admin/settings` - Update platform settings

## 🔐 Authentication & Authorization

The platform uses JWT-based authentication with the following roles:

- **Admin**: Full platform access
- **Clinic Owner**: Manage own clinics and staff
- **Doctor**: Handle appointments and treatments
- **Secretariat**: Manage appointments and basic CRM
- **Salesperson**: Lead management and conversion
- **Client**: Book appointments and view loyalty status

## 🔄 Event System

The platform uses an event-driven architecture for:

- **Lead Events**: Automatic task creation and notifications
- **Appointment Events**: Confirmations, reminders, loyalty point awards
- **Loyalty Events**: Tier upgrades and point notifications
- **Audit Events**: Complete activity logging

## 📊 Background Processing

BullMQ queues handle:

- **Appointment Reminders**: 24-hour advance notifications
- **Lead Follow-ups**: Automated follow-up task creation
- **Recurring Appointments**: Scheduled appointment creation
- **Loyalty Expiration**: Points expiration management

## 🛡️ GDPR Compliance

Features include:

- **Consent Management**: Version-tracked consent records
- **Data Export**: Complete user data export
- **Data Deletion**: GDPR-compliant data removal
- **Audit Trails**: Complete activity logging
- **Data Retention**: Configurable retention policies

## 🚀 Deployment

### Using Docker

1. **Build the application**
   ```bash
   docker-compose up -d
   ```

2. **Run migrations**
   ```bash
   docker-compose exec app npm run migration:run
   ```

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start in production mode**
   ```bash
   npm run start:prod
   ```

## 🧪 Testing

```bash
# Unit tests
npm run test

# Integration tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📝 Database Schema

The platform includes the following main entities:

- **Users**: Platform users with role-based access
- **Clinics**: Medical facilities and their services
- **Leads**: Potential clients from various sources
- **Appointments**: Scheduled treatments and consultations
- **Tasks**: Follow-up and reminder tasks
- **Loyalty Ledger**: Points tracking and tier management
- **Notifications**: Multi-channel messaging
- **Audit Logs**: Complete activity tracking

## 🔧 Configuration

Key configuration options in `.env`:

```bash
# Database
DATABASE_HOST=localhost
DATABASE_NAME=medical_aesthetics

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=1d

# Redis (for queues)
REDIS_HOST=localhost
REDIS_PORT=6379

# Firebase (for push notifications)
FIREBASE_PROJECT_ID=your-project

# External APIs
SMS_GATEWAY_API_KEY=your-sms-key
VIBER_AUTH_TOKEN=your-viber-token
```

## 📈 Monitoring & Logging

The platform includes:

- **Structured Logging**: JSON-formatted logs
- **Health Checks**: Built-in health monitoring
- **Audit Trails**: Complete user activity tracking
- **Queue Monitoring**: BullMQ job tracking
- **Performance Metrics**: Request/response timing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation at `/api/docs`
- Review the example payloads in the Swagger UI

---

Built with ❤️ using NestJS and TypeScript

-- Update AdSpendLog table structure
ALTER TABLE ad_spend_logs 
ALTER COLUMN spend TYPE numeric(12,2) USING spend::numeric(12,2);

ALTER TABLE ad_spend_logs 
RENAME COLUMN spend TO amount;


-- Add FK: ad_spend_logs.campaignId → ad_campaigns(id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_ad_spend_logs_campaign'
    ) THEN
        ALTER TABLE ad_spend_logs
        ADD CONSTRAINT fk_ad_spend_logs_campaign
        FOREIGN KEY (campaignId) REFERENCES ad_campaigns(id)
        ON DELETE CASCADE;
    END IF;
END $$;


-- Add FK: ad_campaigns.ownerAgentId → users(id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_ad_campaigns_owner_agent'
    ) THEN
        ALTER TABLE ad_campaigns
        ADD CONSTRAINT fk_ad_campaigns_owner_agent
        FOREIGN KEY (ownerAgentId) REFERENCES users(id)
        ON DELETE SET NULL;
    END IF;
END $$;



-- Add FK: agent_user_id → users(id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_agent_clinic_access_agent_user_id'
    ) THEN
        ALTER TABLE agent_clinic_access
        ADD CONSTRAINT fk_agent_clinic_access_agent_user_id
        FOREIGN KEY (agent_user_id) REFERENCES users(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- Add FK: clinic_id → clinics(id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_agent_clinic_access_clinic_id'
    ) THEN
        ALTER TABLE agent_clinic_access
        ADD CONSTRAINT fk_agent_clinic_access_clinic_id
        FOREIGN KEY (clinic_id) REFERENCES clinics(id)
        ON DELETE CASCADE;
    END IF;
END $$;


-- Create table
CREATE TABLE IF NOT EXISTS agent_clinic_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_user_id UUID NOT NULL,
    clinic_id UUID NOT NULL,
    UNIQUE(agent_user_id, clinic_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_clinic_access_agent_user_id 
    ON agent_clinic_access(agent_user_id);

CREATE INDEX IF NOT EXISTS idx_agent_clinic_access_clinic_id 
    ON agent_clinic_access(clinic_id);

-- Add foreign key: agent_user_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_agent_clinic_access_agent_user_id'
    ) THEN
        ALTER TABLE agent_clinic_access
        ADD CONSTRAINT fk_agent_clinic_access_agent_user_id
        FOREIGN KEY (agent_user_id) REFERENCES agent_users(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key: clinic_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_agent_clinic_access_clinic_id'
    ) THEN
        ALTER TABLE agent_clinic_access
        ADD CONSTRAINT fk_agent_clinic_access_clinic_id
        FOREIGN KEY (clinic_id) REFERENCES clinics(id)
        ON DELETE CASCADE;
    END IF;
END $$;


-- 1. Add ownerAgentId column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='ad_campaigns' 
          AND column_name='owneragentid'
    ) THEN
        ALTER TABLE ad_campaigns 
        ADD COLUMN owneragentid UUID NULL;
    END IF;
END $$;


-- 2. Update AdSpendLog table structure (if needed)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='ad_spend_logs' 
          AND column_name='spend'
    ) THEN
        ALTER TABLE ad_spend_logs 
        ALTER COLUMN spend TYPE numeric(12,2) USING spend::numeric(12,2),
        RENAME COLUMN spend TO amount;
    END IF;
END $$;


-- 3. Add channel column to ad_campaigns if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='ad_campaigns' 
          AND column_name='channel'
    ) THEN
        ALTER TABLE ad_campaigns 
        ADD COLUMN channel VARCHAR(255);
    END IF;
END $$;


-- 4. Add FK: ad_spend_logs.campaignId → ad_campaigns.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_ad_spend_logs_campaign'
    ) THEN
        ALTER TABLE ad_spend_logs
        ADD CONSTRAINT fk_ad_spend_logs_campaign
        FOREIGN KEY (campaignId) REFERENCES ad_campaigns(id)
        ON DELETE CASCADE;
    END IF;
END $$;


-- 5. Add FK: ad_campaigns.ownerAgentId → users.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_ad_campaigns_owner_agent'
    ) THEN
        ALTER TABLE ad_campaigns
        ADD CONSTRAINT fk_ad_campaigns_owner_agent
        FOREIGN KEY (owneragentid) REFERENCES users(id)
        ON DELETE SET NULL;
    END IF;
END $$;


-- 1. First, check what columns actually exist in ad_spend_logs
SELECT column_name, data_type, is_nullable, ordinal_position
FROM information_schema.columns 
WHERE table_name = 'ad_spend_logs' 
ORDER BY ordinal_position;


-- 2. Add missing columns to ad_spend_logs table if they don't exist
DO $$
BEGIN
    -- Add campaignId column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='ad_spend_logs' 
          AND column_name='campaignid'
    ) THEN
        ALTER TABLE ad_spend_logs ADD COLUMN campaignid UUID NULL;
    END IF;

    -- Rename spend to amount if spend exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='ad_spend_logs' 
          AND column_name='spend'
    ) THEN
        ALTER TABLE ad_spend_logs 
        ALTER COLUMN spend TYPE numeric(12,2) USING spend::numeric(12,2),
        RENAME COLUMN spend TO amount;
    END IF;

    -- Add amount column if neither spend nor amount exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='ad_spend_logs' 
          AND column_name='amount'
    ) AND NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='ad_spend_logs' 
          AND column_name='spend'
    ) THEN
        ALTER TABLE ad_spend_logs ADD COLUMN amount numeric(12,2) DEFAULT 0;
    END IF;
END $$;


-- 3. Add missing columns to ad_campaigns table if they don't exist
DO $$
BEGIN
    -- Add owneragentid column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='ad_campaigns'
          AND column_name='owneragentid'
    ) THEN
        ALTER TABLE ad_campaigns ADD COLUMN owneragentid UUID NULL;
    END IF;

    -- Add channel column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='ad_campaigns'
          AND column_name='channel'
    ) THEN
        ALTER TABLE ad_campaigns ADD COLUMN channel VARCHAR(255);
    END IF;
END $$;


-- 4. Add foreign key constraints if they don't exist
DO $$
BEGIN
    -- FK for ad_spend_logs.campaignid -> ad_campaigns.id
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_ad_spend_logs_campaign'
    ) THEN
        ALTER TABLE ad_spend_logs
        ADD CONSTRAINT fk_ad_spend_logs_campaign
        FOREIGN KEY (campaignid) REFERENCES ad_campaigns(id)
        ON DELETE CASCADE;
    END IF;

    -- FK for ad_campaigns.owneragentid -> users.id
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_ad_campaigns_owner_agent'
    ) THEN
        ALTER TABLE ad_campaigns
        ADD CONSTRAINT fk_ad_campaigns_owner_agent
        FOREIGN KEY (owneragentid) REFERENCES users(id)
        ON DELETE SET NULL;
    END IF;
END $$;


-- 5. Create indexes if they don't exist
DO $$
BEGIN
    -- Index on ad_spend_logs.campaignid
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'ad_spend_logs' 
          AND indexname = 'idx_ad_spend_logs_campaign_id'
    ) THEN
        CREATE INDEX idx_ad_spend_logs_campaign_id ON ad_spend_logs(campaignid);
    END IF;

    -- Index on ad_campaigns.owneragentid
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'ad_campaigns' 
          AND indexname = 'idx_ad_campaigns_owner_agent_id'
    ) THEN
        CREATE INDEX idx_ad_campaigns_owner_agent_id ON ad_campaigns(owneragentid);
    END IF;
END $$;


-- 6. Verify final structure
SELECT 
    'ad_campaigns' as table_name,
    column_name,
    data_type,
    is_nullable,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'ad_campaigns'

UNION ALL

SELECT 
    'ad_spend_logs' as table_name,
    column_name,
    data_type,
    is_nullable,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'ad_spend_logs'

ORDER BY table_name, ordinal_position;
