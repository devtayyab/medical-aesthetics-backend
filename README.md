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