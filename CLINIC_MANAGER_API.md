# Clinic Manager API Documentation

This document outlines all the endpoints available for clinic managers in the Medical Aesthetics Backend system.

## Authentication

All endpoints require JWT authentication via Bearer token. The login endpoint returns user role information.

### Role-Based Login
- **Endpoint**: `POST /auth/login`
- **Body**: 
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response**: 
  ```json
  {
    "accessToken": "string",
    "refreshToken": "string",
    "user": {
      "id": "string",
      "email": "string",
      "role": "clinic_owner | client | doctor | secretariat | salesperson"
    }
  }
  ```

## Clinic Profile Management

### Create Clinic Profile
- **Endpoint**: `POST /clinic/profile`
- **Roles**: `ADMIN`, `CLINIC_OWNER`
- **Body**:
  ```json
  {
    "name": "string",
    "description": "string",
    "address": {
      "street": "string",
      "city": "string",
      "state": "string",
      "zipCode": "string",
      "country": "string"
    },
    "phone": "string",
    "email": "string",
    "website": "string",
    "businessHours": {
      "monday": { "open": "09:00", "close": "17:00", "isOpen": true },
      "tuesday": { "open": "09:00", "close": "17:00", "isOpen": true }
    },
    "timezone": "string"
  }
  ```

### Get Clinic Profile
- **Endpoint**: `GET /clinic/profile`
- **Roles**: `ADMIN`, `CLINIC_OWNER`, `DOCTOR`, `SECRETARIAT`, `SALESPERSON`

### Update Clinic Profile
- **Endpoint**: `PUT /clinic/profile`
- **Roles**: `ADMIN`, `CLINIC_OWNER`
- **Body**: Same as Create (all fields optional)

## Treatment/Service Management (Price List)

### Get All Services
- **Endpoint**: `GET /clinic/services`
- **Roles**: `ADMIN`, `CLINIC_OWNER`, `SECRETARIAT`
- **Response**:
  ```json
  [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "price": 100.00,
      "durationMinutes": 60,
      "category": "string",
      "isActive": true
    }
  ]
  ```

### Create Service/Treatment
- **Endpoint**: `POST /clinic/services`
- **Roles**: `ADMIN`, `CLINIC_OWNER`
- **Body**:
  ```json
  {
    "name": "string",
    "description": "string",
    "price": 100.00,
    "durationMinutes": 60,
    "category": "string",
    "metadata": {}
  }
  ```

### Update Service/Treatment
- **Endpoint**: `PUT /clinic/services/:id`
- **Roles**: `ADMIN`, `CLINIC_OWNER`
- **Body**: Same as Create (all fields optional)

### Toggle Service Active Status
- **Endpoint**: `PATCH /clinic/services/:id/toggle`
- **Roles**: `ADMIN`, `CLINIC_OWNER`

## Appointment Management

### Get Clinic Appointments
- **Endpoint**: `GET /clinic/appointments`
- **Roles**: `ADMIN`, `CLINIC_OWNER`, `DOCTOR`, `SECRETARIAT`, `SALESPERSON`
- **Query Parameters**:
  - `status`: Filter by status (pending, confirmed, completed, cancelled)
  - `date`: Filter by date (YYYY-MM-DD)
  - `providerId`: Filter by provider

### Get Appointment Details
- **Endpoint**: `GET /clinic/appointments/:id`
- **Roles**: `ADMIN`, `CLINIC_OWNER`, `DOCTOR`, `SECRETARIAT`, `SALESPERSON`

### Update Appointment Status (Confirmation)
- **Endpoint**: `PATCH /clinic/appointments/:id/status`
- **Roles**: `ADMIN`, `CLINIC_OWNER`, `DOCTOR`, `SECRETARIAT`
- **Body**:
  ```json
  {
    "status": "confirmed | cancelled | completed",
    "notes": "string",
    "treatmentDetails": {}
  }
  ```

### Reschedule Appointment (Time Change)
- **Endpoint**: `PATCH /clinic/appointments/:id/reschedule`
- **Roles**: `ADMIN`, `CLINIC_OWNER`, `SECRETARIAT`
- **Body**:
  ```json
  {
    "startTime": "2024-01-01T10:00:00Z",
    "endTime": "2024-01-01T11:00:00Z",
    "reason": "string"
  }
  ```

### Complete Appointment with Payment
- **Endpoint**: `PATCH /clinic/appointments/:id/complete`
- **Roles**: `ADMIN`, `CLINIC_OWNER`, `DOCTOR`, `SECRETARIAT`
- **Body**:
  ```json
  {
    "paymentData": {
      "paymentMethod": "cash | pos | card | bank_transfer",
      "amount": 100.00,
      "notes": "string",
      "isAdvancePayment": false
    },
    "treatmentDetails": {}
  }
  ```

### Record Payment
- **Endpoint**: `POST /clinic/appointments/:id/payment`
- **Roles**: `ADMIN`, `CLINIC_OWNER`, `SECRETARIAT`
- **Body**:
  ```json
  {
    "paymentMethod": "cash | pos | card | bank_transfer",
    "amount": 100.00,
    "notes": "string",
    "isAdvancePayment": false
  }
  ```

### Get Payment History
- **Endpoint**: `GET /clinic/appointments/:id/payments`
- **Roles**: `ADMIN`, `CLINIC_OWNER`, `SECRETARIAT`

## Availability Management

### Get Clinic Availability
- **Endpoint**: `GET /clinic/availability`
- **Roles**: `ADMIN`, `CLINIC_OWNER`, `DOCTOR`, `SECRETARIAT`

### Update Availability Settings
- **Endpoint**: `PUT /clinic/availability`
- **Roles**: `ADMIN`, `CLINIC_OWNER`, `SECRETARIAT`
- **Body**:
  ```json
  {
    "businessHours": {
      "monday": { "open": "09:00", "close": "17:00", "isOpen": true }
    },
    "blockedDates": ["2024-01-01", "2024-12-25"],
    "timezone": "America/New_York"
  }
  ```

## Usage Statistics and Analytics

### Get Appointment Analytics
- **Endpoint**: `GET /clinic/analytics/appointments`
- **Roles**: `ADMIN`, `CLINIC_OWNER`, `SALESPERSON`
- **Query Parameters**:
  - `startDate`: Start date (YYYY-MM-DD)
  - `endDate`: End date (YYYY-MM-DD)
  - `serviceId`: Filter by service

### Get Revenue Analytics
- **Endpoint**: `GET /clinic/analytics/revenue`
- **Roles**: `ADMIN`, `CLINIC_OWNER`, `SALESPERSON`
- **Query Parameters**: Same as Appointment Analytics

### Get Loyalty Program Analytics
- **Endpoint**: `GET /clinic/analytics/loyalty`
- **Roles**: `ADMIN`, `CLINIC_OWNER`, `SALESPERSON`
- **Query Parameters**: Same as Appointment Analytics

### Get Repeat Client Forecast
- **Endpoint**: `GET /clinic/analytics/repeat-forecast`
- **Roles**: `ADMIN`, `CLINIC_OWNER`, `SALESPERSON`
- **Query Parameters**: Same as Appointment Analytics

## Client Management

### Get Clinic Clients
- **Endpoint**: `GET /clinic/clients`
- **Roles**: `ADMIN`, `CLINIC_OWNER`, `DOCTOR`, `SECRETARIAT`, `SALESPERSON`
- **Query Parameters**:
  - `search`: Search by name or email
  - `limit`: Number of results
  - `offset`: Pagination offset

### Get Client Details and History
- **Endpoint**: `GET /clinic/clients/:id`
- **Roles**: `ADMIN`, `CLINIC_OWNER`, `DOCTOR`, `SECRETARIAT`, `SALESPERSON`

## Notification Management

### Send Notification to User
- **Endpoint**: `POST /clinic/notifications/send`
- **Roles**: `ADMIN`, `CLINIC_OWNER`, `SECRETARIAT`
- **Body**:
  ```json
  {
    "recipientId": "string",
    "type": "push | sms | email",
    "title": "string",
    "message": "string",
    "data": {}
  }
  ```

### Send Bulk Notifications
- **Endpoint**: `POST /clinic/notifications/send-bulk`
- **Roles**: `ADMIN`, `CLINIC_OWNER`
- **Body**:
  ```json
  {
    "recipientIds": ["string"],
    "type": "push | sms | email",
    "title": "string",
    "message": "string",
    "data": {}
  }
  ```

### Send Appointment Reminder
- **Endpoint**: `POST /clinic/appointments/:id/send-reminder`
- **Roles**: `ADMIN`, `CLINIC_OWNER`, `SECRETARIAT`

## Review Management

### Get Clinic Reviews
- **Endpoint**: `GET /clinic/reviews`
- **Roles**: `ADMIN`, `CLINIC_OWNER`, `SECRETARIAT`
- **Query Parameters**:
  - `limit`: Number of results
  - `offset`: Pagination offset
- **Response**:
  ```json
  {
    "reviews": [
      {
        "id": "string",
        "rating": 5,
        "comment": "string",
        "isVisible": true,
        "response": "string",
        "respondedAt": "2024-01-01T10:00:00Z",
        "createdAt": "2024-01-01T10:00:00Z",
        "client": {
          "id": "string",
          "firstName": "string",
          "lastName": "string"
        }
      }
    ],
    "total": 100,
    "averageRating": 4.5,
    "limit": 20,
    "offset": 0
  }
  ```

### Get Review Statistics
- **Endpoint**: `GET /clinic/reviews/statistics`
- **Roles**: `ADMIN`, `CLINIC_OWNER`
- **Response**:
  ```json
  {
    "totalReviews": 100,
    "averageRating": 4.5,
    "distribution": {
      "5": 60,
      "4": 25,
      "3": 10,
      "2": 3,
      "1": 2
    }
  }
  ```

### Respond to Review
- **Endpoint**: `POST /clinic/reviews/:id/respond`
- **Roles**: `ADMIN`, `CLINIC_OWNER`
- **Body**:
  ```json
  {
    "response": "string"
  }
  ```

### Toggle Review Visibility
- **Endpoint**: `PATCH /clinic/reviews/:id/toggle-visibility`
- **Roles**: `ADMIN`, `CLINIC_OWNER`

## User Roles

The system supports the following roles with different permissions:

- **ADMIN**: Full access to all endpoints
- **CLINIC_OWNER**: Full access to their clinic's data and management
- **DOCTOR**: Access to appointments and client information
- **SECRETARIAT**: Access to appointments, scheduling, and notifications
- **SALESPERSON**: Access to analytics and client information
- **CLIENT**: Access to their own appointments and bookings (separate endpoints)

## Base URL

All endpoints are prefixed with `/clinic` for clinic management operations.

Example: `https://api.example.com/clinic/profile`

## Error Responses

All endpoints return standard HTTP status codes:

- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **409**: Conflict (e.g., time slot already booked)
- **500**: Internal Server Error

Error response format:
```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```
