# Admin Panel API Documentation

This document outlines all the endpoints available for platform administrators in the Medical Aesthetics Backend system.

## Authentication

All admin endpoints require JWT authentication with `ADMIN` role. Access is restricted to platform administrators only.

**Base URL**: `/admin`

## User Management

### Get All Users
- **Endpoint**: `GET /admin/users`
- **Description**: Retrieve all users with filtering and pagination
- **Query Parameters**:
  - `role`: Filter by user role (client, clinic_owner, doctor, secretariat, salesperson)
  - `isActive`: Filter by active status (true/false)
  - `search`: Search by name or email
  - `limit`: Number of results per page
  - `offset`: Pagination offset
- **Response**:
  ```json
  {
    "users": [
      {
        "id": "string",
        "email": "string",
        "firstName": "string",
        "lastName": "string",
        "role": "string",
        "isActive": true,
        "createdAt": "2024-01-01T10:00:00Z",
        "lastLoginAt": "2024-01-01T10:00:00Z"
      }
    ],
    "total": 100,
    "limit": 20,
    "offset": 0
  }
  ```

### Get User by ID
- **Endpoint**: `GET /admin/users/:id`
- **Description**: Get detailed information about a specific user
- **Response**: Full user object with relations (owned clinics, appointments)

### Update User
- **Endpoint**: `PUT /admin/users/:id`
- **Description**: Update user information
- **Body**:
  ```json
  {
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "role": "string",
    "isActive": true
  }
  ```

### Toggle User Status
- **Endpoint**: `PATCH /admin/users/:id/toggle-status`
- **Description**: Activate or deactivate a user account

### Delete User
- **Endpoint**: `DELETE /admin/users/:id`
- **Description**: Permanently delete a user account

## Clinic Management

### Get All Clinics
- **Endpoint**: `GET /admin/clinics`
- **Description**: Retrieve all clinics with filtering and pagination
- **Query Parameters**:
  - `isActive`: Filter by active status (true/false)
  - `search`: Search by clinic name or description
  - `limit`: Number of results per page
  - `offset`: Pagination offset
- **Response**:
  ```json
  {
    "clinics": [
      {
        "id": "string",
        "name": "string",
        "description": "string",
        "address": {},
        "isActive": true,
        "createdAt": "2024-01-01T10:00:00Z",
        "owner": {
          "id": "string",
          "firstName": "string",
          "lastName": "string",
          "email": "string"
        },
        "services": []
      }
    ],
    "total": 50,
    "limit": 20,
    "offset": 0
  }
  ```

### Get Clinic by ID
- **Endpoint**: `GET /admin/clinics/:id`
- **Description**: Get detailed information about a specific clinic
- **Response**: Full clinic object with owner, services, and appointments

### Toggle Clinic Status (Approve/Suspend)
- **Endpoint**: `PATCH /admin/clinics/:id/toggle-status`
- **Description**: Approve or suspend a clinic
- **Use Cases**:
  - Approve new clinic registrations
  - Suspend clinics for policy violations
  - Reactivate suspended clinics

### Get Clinic Analytics
- **Endpoint**: `GET /admin/clinics/:id/analytics`
- **Description**: Get performance analytics for a specific clinic
- **Query Parameters**:
  - `startDate`: Start date (YYYY-MM-DD)
  - `endDate`: End date (YYYY-MM-DD)
- **Response**:
  ```json
  {
    "clinicId": "string",
    "clinicName": "string",
    "period": {
      "startDate": "2024-01-01",
      "endDate": "2024-01-31"
    },
    "stats": {
      "totalAppointments": 150,
      "totalRevenue": 15000.00,
      "avgAppointmentValue": 100.00,
      "uniqueClients": 75
    }
  }
  ```

## Platform-Wide Analytics

### Get Platform Analytics
- **Endpoint**: `GET /admin/analytics/platform`
- **Description**: Get comprehensive platform-wide analytics including users, sales, and loyalty points
- **Query Parameters**:
  - `startDate`: Start date (YYYY-MM-DD)
  - `endDate`: End date (YYYY-MM-DD)
- **Response**:
  ```json
  {
    "period": {
      "startDate": "2024-01-01",
      "endDate": "2024-01-31"
    },
    "users": {
      "total": 1000,
      "clients": 800,
      "clinicOwners": 50,
      "active": 900
    },
    "clinics": {
      "total": 50,
      "active": 45
    },
    "appointments": {
      "total": 500,
      "completed": 450,
      "cancelled": 50
    },
    "revenue": {
      "total": 50000.00,
      "avgPerAppointment": 100.00
    },
    "loyalty": {
      "totalPointsIssued": 50000,
      "clientsWithPoints": 600,
      "avgPointsPerTransaction": 83.33
    }
  }
  ```

## Offer/Promotion Management

### Create Offer
- **Endpoint**: `POST /admin/offers`
- **Description**: Create a new promotional offer
- **Body**:
  ```json
  {
    "title": "Summer Special",
    "description": "Get 20% off on all services",
    "code": "SUMMER20",
    "discountType": "percentage",
    "discountPercentage": 20,
    "discountAmount": null,
    "startDate": "2024-06-01",
    "endDate": "2024-08-31",
    "isActive": true,
    "targetAudience": "all",
    "usageLimit": 100,
    "applicableServices": ["service-id-1", "service-id-2"],
    "applicableClinics": ["clinic-id-1"],
    "minPurchaseAmount": 50.00,
    "termsAndConditions": "Valid for new bookings only"
  }
  ```

### Get All Offers
- **Endpoint**: `GET /admin/offers`
- **Description**: Retrieve all promotional offers
- **Query Parameters**:
  - `isActive`: Filter by active status
  - `limit`: Number of results per page
  - `offset`: Pagination offset

### Get Offer by ID
- **Endpoint**: `GET /admin/offers/:id`
- **Description**: Get detailed information about a specific offer

### Update Offer
- **Endpoint**: `PUT /admin/offers/:id`
- **Description**: Update an existing offer
- **Body**: Same as Create Offer (all fields optional)

### Toggle Offer Status
- **Endpoint**: `PATCH /admin/offers/:id/toggle-status`
- **Description**: Activate or deactivate an offer

### Delete Offer
- **Endpoint**: `DELETE /admin/offers/:id`
- **Description**: Permanently delete an offer

## Rewards Management

### Create Reward
- **Endpoint**: `POST /admin/rewards`
- **Description**: Create a new loyalty reward
- **Body**:
  ```json
  {
    "name": "Free Consultation",
    "description": "Redeem for a free 30-minute consultation",
    "pointsCost": 500,
    "rewardType": "free_service",
    "value": 50.00,
    "isActive": true,
    "tier": "silver",
    "stockQuantity": 100,
    "applicableServices": ["service-id-1"],
    "applicableClinics": null,
    "expiryDate": "2024-12-31",
    "termsAndConditions": "Valid for one-time use only",
    "imageUrl": "https://example.com/reward.jpg"
  }
  ```

### Get All Rewards
- **Endpoint**: `GET /admin/rewards`
- **Description**: Retrieve all loyalty rewards
- **Query Parameters**:
  - `isActive`: Filter by active status
  - `tier`: Filter by tier (bronze, silver, gold, platinum)
  - `limit`: Number of results per page
  - `offset`: Pagination offset
- **Response**:
  ```json
  {
    "rewards": [
      {
        "id": "string",
        "name": "string",
        "description": "string",
        "pointsCost": 500,
        "rewardType": "free_service",
        "value": 50.00,
        "isActive": true,
        "tier": "silver",
        "stockQuantity": 100,
        "redeemedCount": 25
      }
    ],
    "total": 20,
    "limit": 20,
    "offset": 0
  }
  ```

### Get Reward by ID
- **Endpoint**: `GET /admin/rewards/:id`
- **Description**: Get detailed information about a specific reward

### Update Reward
- **Endpoint**: `PUT /admin/rewards/:id`
- **Description**: Update an existing reward
- **Body**: Same as Create Reward (all fields optional)

### Toggle Reward Status
- **Endpoint**: `PATCH /admin/rewards/:id/toggle-status`
- **Description**: Activate or deactivate a reward

### Delete Reward
- **Endpoint**: `DELETE /admin/rewards/:id`
- **Description**: Permanently delete a reward

## Platform Settings Management

### Get All Settings
- **Endpoint**: `GET /admin/settings`
- **Description**: Get all platform settings

### Get Specific Setting
- **Endpoint**: `GET /admin/settings/:key`
- **Description**: Get a specific setting by key
- **Example**: `GET /admin/settings/loyaltyPointsPerDollar`

### Update Setting
- **Endpoint**: `PUT /admin/settings/:key`
- **Description**: Update a specific setting
- **Body**:
  ```json
  {
    "value": 1.5
  }
  ```

### Get Settings by Category
- **Endpoint**: `GET /admin/settings/category/:category`
- **Description**: Get all settings in a specific category
- **Categories**: system, loyalty, notifications, payments

## CRM Tags Management

### Create Tag
- **Endpoint**: `POST /admin/tags`
- **Description**: Create a new CRM tag
- **Body**:
  ```json
  {
    "name": "VIP Client",
    "color": "#FF5733",
    "description": "High-value clients"
  }
  ```

### Get All Tags
- **Endpoint**: `GET /admin/tags`
- **Description**: Retrieve all CRM tags

## Reporting

### Get Platform Reports
- **Endpoint**: `GET /admin/reports`
- **Description**: Get comprehensive platform reports
- **Response**:
  ```json
  {
    "leadsToConversions": {
      "totalLeads": 500,
      "conversions": 250,
      "conversionRate": 50.0
    },
    "revenueStats": {
      "totalRevenue": 100000.00,
      "monthlyRevenue": 25000.00,
      "averageAppointmentValue": 100.00
    },
    "appointmentStats": {
      "totalAppointments": 1000,
      "completedAppointments": 900,
      "cancelledAppointments": 80,
      "noShows": 20
    }
  }
  ```

## Common Response Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized (not logged in or invalid token)
- **403**: Forbidden (not an admin)
- **404**: Not Found
- **500**: Internal Server Error

## Error Response Format

```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

## Key Features

### User Management
- ✅ List all users with filtering (role, status, search)
- ✅ View detailed user information
- ✅ Update user details and roles
- ✅ Activate/deactivate user accounts
- ✅ Delete users

### Clinic Management
- ✅ List all clinics with filtering
- ✅ View detailed clinic information
- ✅ Approve new clinic registrations
- ✅ Suspend/reactivate clinics
- ✅ View clinic-specific analytics

### Platform Analytics
- ✅ User statistics (total, by role, active users)
- ✅ Clinic statistics (total, active)
- ✅ Sales analytics (appointments, revenue)
- ✅ Loyalty points analytics
- ✅ Date range filtering

### Offer Management
- ✅ Create promotional offers with discount codes
- ✅ Set usage limits and expiry dates
- ✅ Target specific audiences
- ✅ Apply to specific services/clinics
- ✅ Track usage statistics

### Rewards Management
- ✅ Create loyalty rewards
- ✅ Set point costs and tier requirements
- ✅ Manage stock quantities
- ✅ Track redemption counts
- ✅ Set expiry dates

### Reporting
- ✅ Lead conversion tracking
- ✅ Revenue reporting
- ✅ Appointment statistics
- ✅ Platform-wide metrics

## Usage Examples

### Approve a New Clinic
```bash
PATCH /admin/clinics/{clinic-id}/toggle-status
```

### Create a Promotional Offer
```bash
POST /admin/offers
Content-Type: application/json

{
  "title": "New Year Special",
  "code": "NEWYEAR2024",
  "discountPercentage": 25,
  "startDate": "2024-01-01",
  "endDate": "2024-01-31"
}
```

### View Platform Analytics
```bash
GET /admin/analytics/platform?startDate=2024-01-01&endDate=2024-01-31
```

### Suspend a User
```bash
PATCH /admin/users/{user-id}/toggle-status
```

## Security Notes

- All endpoints require `ADMIN` role
- JWT token must be included in Authorization header
- Sensitive operations are logged for audit purposes
- Rate limiting is applied to prevent abuse
