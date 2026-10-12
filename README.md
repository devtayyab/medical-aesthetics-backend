# Medical Aesthetics Platform

A full-stack, enterprise-grade Medical Aesthetics Platform connecting clients, medical aesthetic clinics, doctors, secretariats, salespeople, and super administrators through a centralized broker-led system.

The platform handles omni-channel lead capture, CRM pipeline management, real-time availability calculations with hold locking, appointment scheduling, loyalty reward systems, payment processing, and multi-channel notifications.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | NestJS (Node.js), TypeScript, TypeORM, PostgreSQL |
| **Async Queues** | BullMQ, Redis |
| **Frontend** | React 18, TypeScript, Vite, Redux Toolkit, TailwindCSS, Emotion CSS |
| **Auth & Security** | JWT (Access + Refresh tokens with auto-rotation), RBAC Guards, Helmet, Rate Limiter |
| **Payments** | Viva Wallet (Smart Checkout & Webhooks), Stripe (Gift Cards/Online) |
| **Integrations** | Facebook Leads Webhook, HubSpot CRM, Google Calendar OAuth, Firebase Cloud Messaging (FCM), AWS SES / SMTP, Viber |
| **Documentation** | Swagger / OpenAPI (`/api/docs`) |

---

## 📁 Project Folder Structure

```
medical-aesthetics-platform/
├── src/                                  # NestJS Backend Application
│   ├── app.module.ts                     # Root application module
│   ├── main.ts                           # Server entrypoint, CORS, Swagger setup
│   ├── common/                           # Cross-cutting decorators, filters, enums, DTOs
│   │   ├── decorators/                   # @Roles(), @CurrentUser()
│   │   ├── enums/                        # UserRole, AppointmentStatus, LeadStatus
│   │   ├── filters/                      # Global exception filters
│   │   └── guards/                       # JwtAuthGuard, RolesGuard
│   ├── config/                           # Database & runtime configuration
│   ├── database/                         # TypeORM data source, migrations, seeds
│   └── modules/                          # Domain Feature Modules
│       ├── admin/                        # Admin dashboard, audit logs, system lists
│       ├── auth/                         # Authentication, JWT strategy, refresh token
│       ├── bookings/                     # Scheduling, hold locking, availability engine
│       ├── clinics/                      # Clinics, doctors, operating hours, treatments
│       ├── crm/                          # Leads, duplication engine, customer records
│       ├── google-calendar/              # Two-way Google Calendar synchronization
│       ├── loyalty/                      # Points ledger, tier rules, redemptions
│       ├── messages/                     # Internal messaging & conversation threads
│       ├── notifications/                # Multi-channel push (FCM), SMS, Viber, email
│       ├── payments/                     # Viva Wallet integration, ledger, refunds
│       ├── queue/                        # BullMQ queues for scheduled tasks & reminders
│       ├── tasks/                        # CRM follow-up and reminder task management
│       ├── upload/                       # Multipart file & image storage handling
│       └── users/                        # User profiles, role-based access, GDPR tools
│
├── frontend/                             # React + Vite Frontend Application
│   ├── index.html                        # Application HTML shell
│   ├── vite.config.ts                    # Vite build configuration & path aliases (@/*)
│   └── src/
│       ├── main.tsx                      # Frontend mount point & Redux Provider
│       ├── App.tsx                       # Master routing & role-based route guards
│       ├── assets/                       # Static media, icons, and hero illustrations
│       ├── components/                   # Atomic Design UI Components
│       │   ├── atoms/                    # Buttons, Inputs, Badges, Modals
│       │   ├── molecules/                # Dropdowns, Cards, TimeSlotPickers
│       │   └── organisms/                # Navbars, Sidebars, SearchBars, Forms
│       ├── config/                       # Client environment loader (env.ts)
│       ├── pages/                        # View Pages
│       │   ├── Admin/                    # Super Admin portals & metrics dashboards
│       │   ├── Client/                   # Client booking portal, checkout, account
│       │   ├── Clinic/                   # Clinic owner dashboard & calendar views
│       │   └── CRM/                      # Lead pipelines, dialer, activities
│       ├── services/                     # Central API Layer
│       │   ├── client.ts                 # Base Axios instance & token refresh queue
│       │   ├── api.ts                    # Central API gateway & legacy alias layer
│       │   ├── index.ts                  # Barrel export
│       │   └── features/                 # Modular Feature Services
│       │       ├── auth.service.ts       # authService
│       │       ├── user.service.ts       # userService, loyaltyService
│       │       ├── product.service.ts    # productService (treatments, master items)
│       │       ├── clinic.service.ts     # clinicService, publicCatalogService
│       │       ├── booking.service.ts    # bookingService (holds, slots, appointments)
│       │       ├── crm.service.ts        # crmService, taskService
│       │       ├── payment.service.ts    # paymentService (wallet, vouchers)
│       │       ├── admin.service.ts      # adminService, audit logs, system lists
│       │       ├── blog.service.ts       # blogService
│       │       ├── notification.service.ts# notificationService, messageService
│       │       └── upload.service.ts     # uploadService
│       ├── store/                        # Global State Management (Redux Toolkit)
│       │   ├── index.ts                  # Central store & root reducer setup
│       │   ├── hooks.ts                  # Typed useAppDispatch & useAppSelector
│       │   └── slices/                   # authSlice, bookingSlice, crmSlice, etc.
│       └── types/                        # TypeScript type definitions
│
├── docker-compose.yml                    # Containerized services (PostgreSQL, Redis)
├── package.json                          # Root / Backend dependencies & scripts
└── README.md                             # Project documentation
```

---

## ⚙️ Environment Variables

### 1. Backend (`.env`)

Copy `.env.example` to `.env` in the root directory:

```bash
cp .env.example .env
```

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `DATABASE_HOST` | PostgreSQL server host | `localhost` |
| `DATABASE_PORT` | PostgreSQL port | `5432` |
| `DATABASE_USERNAME` | Database username | `postgres` |
| `DATABASE_PASSWORD` | Database password | `postgres` |
| `DATABASE_NAME` | Database name | `medical_aesthetics` |
| `DB_SYNCHRONIZE` | Auto-sync TypeORM schema (disable in prod) | `false` |
| `JWT_SECRET` | Primary JWT encryption secret | `your-secret-key` |
| `JWT_ACCESS_SECRET` | Access token JWT secret | `your-access-secret` |
| `JWT_REFRESH_SECRET` | Refresh token JWT secret | `your-refresh-secret` |
| `JWT_EXPIRATION` | Access token lifespan | `1d` |
| `JWT_REFRESH_EXPIRATION` | Refresh token lifespan | `7d` |
| `REDIS_HOST` | Redis host for BullMQ queues | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_PASSWORD` | Redis password (if any) | `""` |
| `PORT` | Backend HTTP listening port | `3001` |
| `API_BASE_URL` | Canonical backend base URL | `http://localhost:3001` |
| `APP_FRONTEND_URL` | Allowed frontend origin for CORS | `http://localhost:5173` |
| `FIREBASE_PROJECT_ID` | Firebase project ID for push alerts | `your-project-id` |
| `MAIL_HOST` / `MAIL_USER` / `MAIL_PASS` | SMTP credentials for transactional emails | AWS SES / Custom SMTP |
| `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` | Facebook Lead Ads webhook integration | Facebook Developer Portal |
| `VIVA_CLIENT_ID` / `VIVA_CLIENT_SECRET` | Viva Wallet payment integration | Viva Payments Portal |
| `HUBSPOT_API_TOKEN` | HubSpot CRM contact synchronization | HubSpot Private App Token |

### 2. Frontend (`frontend/.env`)

Copy `frontend/.env.example` to `frontend/.env`:

```bash
cp frontend/.env.example frontend/.env
```

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base API endpoint consumed by Axios | `http://localhost:3001/api` |
| `VITE_NODE_ENV` | Frontend environment mode | `development` |
| `VITE_APP_TYPE` | App target profile (`'all'`, `'client'`, `'clinic'`, `'crm'`, `'admin'`) | `all` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key for gift card checkout | `pk_test_...` |
| `VITE_FIREBASE_API_KEY` | Firebase Web API key for in-browser notifications | `your_api_key` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Web Project ID | `your_project_id` |

---

## 🚀 Installation & Setup

### Prerequisites
- **Node.js**: v18.x or v20.x LTS
- **PostgreSQL**: v13 or higher
- **Redis**: v6 or higher
- **npm**: v9 or higher

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd medical-aesthetics-backend
```

### Step 2: Install Backend Dependencies
```bash
npm install
```

### Step 3: Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

### Step 4: Configure Environment Files
1. Create and review root `.env` from `.env.example`.
2. Create and review `frontend/.env` from `frontend/.env.example`.

### Step 5: Start Infrastructure with Docker (Optional)
If PostgreSQL and Redis are not installed locally, launch them via Docker Compose:
```bash
docker-compose up -d postgres redis
```

### Step 6: Run Database Migrations
Initialize database tables, foreign keys, and indexes:
```bash
npm run migration:run
```

---

## 💻 Running the Application

### Development Mode

Run the Backend server:
```bash
# In project root
npm run start:dev
```
The backend starts at `http://localhost:3001`.
- Swagger Documentation: `http://localhost:3001/api/docs`

In a separate terminal, run the Frontend dev server:
```bash
# In frontend directory
cd frontend
npm run dev
```
The frontend starts at `http://localhost:5173`.

### Production Build

Build and run the Backend:
```bash
npm run build
npm run start:prod
```

Build and preview the Frontend bundle:
```bash
cd frontend
npm run build
npm run preview
```

---

## 📡 Central API Layer & Feature Services

The frontend uses a modular API architecture located in `frontend/src/services/`:

1. **Base HTTP Client (`client.ts`)**:
   - Centralizes Axios configuration, base headers, and timeouts.
   - **Request Interceptor**: Hydrates Bearer tokens dynamically from Redux store (`state.auth.accessToken`) or `localStorage`.
   - **Response Interceptor & Queue**: On `401 Unauthorized`, queues concurrent requests while asynchronously invoking `/auth/refresh`. When refreshed, replays queued requests with updated tokens.
   - Exported `httpClient` helper for typed HTTP requests (`get`, `post`, `put`, `patch`, `delete`).

2. **Feature Services (`features/*.service.ts`)**:
   - Each domain capability lives in its own dedicated service file:
     - `authService` in [`auth.service.ts`](file:///e:/ebizz/medical-aesthetics-backend/frontend/src/services/features/auth.service.ts)
     - `userService` & `loyaltyService` in [`user.service.ts`](file:///e:/ebizz/medical-aesthetics-backend/frontend/src/services/features/user.service.ts)
     - `productService` in [`product.service.ts`](file:///e:/ebizz/medical-aesthetics-backend/frontend/src/services/features/product.service.ts)
     - `clinicService` & `publicCatalogService` in [`clinic.service.ts`](file:///e:/ebizz/medical-aesthetics-backend/frontend/src/services/features/clinic.service.ts)
     - `bookingService` in [`booking.service.ts`](file:///e:/ebizz/medical-aesthetics-backend/frontend/src/services/features/booking.service.ts)
     - `crmService` & `taskService` in [`crm.service.ts`](file:///e:/ebizz/medical-aesthetics-backend/frontend/src/services/features/crm.service.ts)
     - `paymentService` in [`payment.service.ts`](file:///e:/ebizz/medical-aesthetics-backend/frontend/src/services/features/payment.service.ts)
     - `adminService`, `adminAuditLogsService`, `adminSettingsService` in [`admin.service.ts`](file:///e:/ebizz/medical-aesthetics-backend/frontend/src/services/features/admin.service.ts)
     - `blogService` in [`blog.service.ts`](file:///e:/ebizz/medical-aesthetics-backend/frontend/src/services/features/blog.service.ts)
     - `notificationService` & `messageService` in [`notification.service.ts`](file:///e:/ebizz/medical-aesthetics-backend/frontend/src/services/features/notification.service.ts)
     - `uploadService` in [`upload.service.ts`](file:///e:/ebizz/medical-aesthetics-backend/frontend/src/services/features/upload.service.ts)

3. **Adding a New Endpoint**:
   To add an endpoint to an existing service, simply add the method calling `api`:
   ```typescript
   // frontend/src/services/features/user.service.ts
   export const userService = {
     // ...existing methods
     updatePreferences: (data: any) => api.patch('/users/me/preferences', data),
   };
   ```

4. **100% Backward Compatibility (`api.ts`)**:
   Re-exports both modern feature services and legacy aliases (`authAPI`, `clinicsAPI`, `bookingAPI`, `userAPI`, `paymentsAPI`, `crmAPI`, etc.) to guarantee zero regressions across the codebase.

---

## 🧠 State Management (Redux Toolkit)

Global state is organized in `frontend/src/store/`:
- **Store Configuration (`store/index.ts`)**: Combines slice reducers for `auth`, `clinics`, `booking`, `crm`, `notifications`, `task`, `admin`, `messages`, `dialer`, and `ui`.
- **Typed Hooks (`store/hooks.ts`)**: Exported `useAppDispatch` and `useAppSelector` with inferred `RootState` and `AppDispatch` types for TypeScript intellisense.
- **Persistent Auth**: `authSlice` synchronizes credentials across Redux memory, `localStorage`, and `sessionStorage`.

---

## 🧪 Testing & Verification

```bash
# Backend unit tests
npm run test

# Backend end-to-end tests
npm run test:e2e

# Backend test coverage
npm run test:cov

# Frontend build verification
cd frontend && npm run build
```

---

## 🔒 Security & GDPR Best Practices

- **Strict RBAC**: Enforced via NestJS guards (`@Roles(...)` and `JwtAuthGuard`).
- **Audit Trails**: All modifications to leads, customer records, and appointments are logged with actor IDs and timestamps.
- **GDPR Compliance**: Endpoints available for data export (`GET /users/me/export`) and user deletion (`POST /users/me/delete`).
- **Encrypted Secrets**: Sensitive tokens (Google OAuth tokens) are encrypted with AES-256 keys.
