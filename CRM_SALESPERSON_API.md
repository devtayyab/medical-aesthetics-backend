# Native CRM - Salesperson Application API Documentation

This document outlines all the endpoints available for salespeople in the Medical Aesthetics Backend CRM system.

## Overview

The Native CRM provides salespeople with comprehensive tools to manage customer relationships, track communications, manage tasks, and analyze performance.

**Base URL**: `/crm`

**Roles**: `SALESPERSON`, `SECRETARIAT`, `ADMIN`

---

## Customer Record Management

### Get Complete Customer Record
- **Endpoint**: `GET /crm/customers/:id/record`
- **Description**: Get complete customer record with full communication history, appointments, treatments, and characterization
- **Response**:
  ```json
  {
    "record": {
      "id": "string",
      "customerId": "string",
      "customerStatus": "new | contacted | qualified | active | inactive | vip",
      "lifetimeValue": 1500.00,
      "totalAppointments": 10,
      "completedAppointments": 9,
      "cancelledAppointments": 1,
      "lastAppointmentDate": "2024-01-15T10:00:00Z",
      "nextAppointmentDate": "2024-02-01T14:00:00Z",
      "lastContactDate": "2024-01-20T09:00:00Z",
      "averageDaysBetweenVisits": 30,
      "isRepeatCustomer": true,
      "repeatCount": 3,
      "expectedNextVisit": "2024-02-15",
      "notes": "Prefers morning appointments",
      "preferences": {},
      "treatmentHistory": []
    },
    "appointments": [
      {
        "id": "string",
        "serviceName": "Botox Treatment",
        "clinicName": "Beauty Clinic",
        "startTime": "2024-01-15T10:00:00Z",
        "status": "completed",
        "totalAmount": 150.00,
        "treatmentDetails": {}
      }
    ],
    "communications": [],
    "actions": [],
    "tags": [],
    "summary": {
      "totalAppointments": 10,
      "completedAppointments": 9,
      "lifetimeValue": 1500.00,
      "lastAppointment": "2024-01-15T10:00:00Z",
      "nextAppointment": "2024-02-01T14:00:00Z",
      "isRepeatCustomer": true,
      "repeatCount": 3
    }
  }
  ```

### Update Customer Record
- **Endpoint**: `PUT /crm/customers/:id/record`
- **Description**: Update customer record information
- **Body**:
  ```json
  {
    "customerStatus": "vip",
    "notes": "High-value client, prefers premium services",
    "preferences": {
      "preferredTime": "morning",
      "preferredServices": ["botox", "fillers"]
    }
  }
  ```

---

## Communication History

### Log Communication
- **Endpoint**: `POST /crm/communications`
- **Description**: Record any communication with customer (calls, emails, meetings, etc.)
- **Body**:
  ```json
  {
    "customerId": "string",
    "type": "call | email | sms | whatsapp | meeting | note",
    "direction": "outgoing | incoming | missed",
    "status": "completed | missed | no_answer | voicemail | scheduled | cancelled",
    "subject": "Follow-up call regarding next appointment",
    "notes": "Customer confirmed interest in new treatment",
    "durationSeconds": 300,
    "scheduledAt": "2024-01-20T10:00:00Z",
    "metadata": {}
  }
  ```

### Get Communication History
- **Endpoint**: `GET /crm/customers/:id/communications`
- **Description**: Get all communications with a specific customer
- **Query Parameters**:
  - `type`: Filter by communication type
  - `startDate`: Filter from date
  - `endDate`: Filter to date
- **Response**: Array of communication logs with timestamps and details

---

## Action Recording & Task System

### Create Action/Task
- **Endpoint**: `POST /crm/actions`
- **Description**: Create actions like phone calls, follow-ups, appointments, updates
- **Body**:
  ```json
  {
    "customerId": "string",
    "actionType": "phone_call | follow_up | appointment_scheduled | email_sent | meeting | update | other",
    "title": "Follow-up call",
    "description": "Call customer to confirm next appointment",
    "status": "pending | completed | cancelled | missed",
    "priority": "low | medium | high | urgent",
    "dueDate": "2024-01-25T10:00:00Z",
    "relatedAppointmentId": "string",
    "relatedLeadId": "string",
    "metadata": {
      "callOutcome": "interested",
      "nextSteps": "Schedule consultation"
    }
  }
  ```

### Update Action/Task
- **Endpoint**: `PUT /crm/actions/:id`
- **Description**: Update action status, notes, or details
- **Body**:
  ```json
  {
    "status": "completed",
    "metadata": {
      "callOutcome": "appointment_scheduled",
      "notes": "Customer booked for Feb 1st"
    }
  }
  ```

### Get Actions/Tasks
- **Endpoint**: `GET /crm/actions`
- **Description**: Get all actions/tasks with filtering
- **Query Parameters**:
  - `status`: Filter by status (pending, completed, etc.)
  - `priority`: Filter by priority
  - `customerId`: Filter by specific customer
- **Response**: Array of actions sorted by due date

### Get Pending Actions
- **Endpoint**: `GET /crm/actions/pending`
- **Description**: Get all pending actions/tasks for the salesperson
- **Response**: Array of pending actions with time tracking

---

## Customer Characterization Tags

### Add Customer Tag
- **Endpoint**: `POST /crm/customers/:id/tags`
- **Description**: Add characterization tag to customer (VIP, High-Value, Price-Sensitive, etc.)
- **Body**:
  ```json
  {
    "tagId": "string",
    "notes": "Customer shows strong interest in premium services"
  }
  ```

### Remove Customer Tag
- **Endpoint**: `DELETE /crm/customer-tags/:id`
- **Description**: Remove a tag from customer

### Get Customers by Tag
- **Endpoint**: `GET /crm/tags/:tagId/customers`
- **Description**: Get all customers with a specific tag
- **Response**: Array of customers with that tag

---

## Repeat Management

### Get Repeat Customers
- **Endpoint**: `GET /crm/customers/repeat`
- **Description**: Get all repeat customers sorted by repeat count
- **Response**:
  ```json
  [
    {
      "id": "string",
      "customerId": "string",
      "customer": {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      },
      "repeatCount": 5,
      "lifetimeValue": 2500.00,
      "lastAppointmentDate": "2024-01-15T10:00:00Z",
      "expectedNextVisit": "2024-02-15"
    }
  ]
  ```

### Get Customers Due for Follow-Up
- **Endpoint**: `GET /crm/customers/follow-up`
- **Description**: Get customers who haven't been contacted recently
- **Query Parameters**:
  - `daysThreshold`: Number of days since last contact (default: 30)
- **Response**: Array of customers needing follow-up

---

## Lead Management

### Create Lead
- **Endpoint**: `POST /crm/leads`
- **Description**: Create a new lead from various sources
- **Body**:
  ```json
  {
    "source": "facebook_ads | google_ads | referral | walk_in | website",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.com",
    "phone": "+1234567890",
    "status": "new",
    "notes": "Interested in botox treatment",
    "estimatedValue": 500.00,
    "metadata": {}
  }
  ```

### Get Leads
- **Endpoint**: `GET /crm/leads`
- **Description**: Get leads with filtering
- **Query Parameters**:
  - `status`: Filter by lead status
  - `assignedSalesId`: Filter by assigned salesperson
  - `source`: Filter by lead source
  - `search`: Search by name or email

### Update Lead
- **Endpoint**: `PATCH /crm/leads/:id`
- **Description**: Update lead information and status
- **Body**:
  ```json
  {
    "status": "contacted | qualified | converted | lost",
    "notes": "Customer scheduled consultation",
    "estimatedValue": 750.00
  }
  ```

---

## Salesperson Analytics

### Get Performance Analytics
- **Endpoint**: `GET /crm/analytics/salesperson`
- **Description**: Get comprehensive performance metrics
- **Query Parameters**:
  - `startDate`: Start date for analytics (YYYY-MM-DD)
  - `endDate`: End date for analytics (YYYY-MM-DD)
- **Response**:
  ```json
  {
    "communications": {
      "total": 150,
      "calls": 100,
      "missedCalls": 10,
      "emails": 50
    },
    "actions": {
      "total": 200,
      "pending": 25,
      "completed": 160,
      "missed": 15
    },
    "customers": {
      "total": 75,
      "repeat": 30,
      "totalRevenue": 15000.00
    }
  }
  ```

---

## Notifications

The CRM system automatically sends notifications for:

### New Leads
- Notification sent when a new lead is assigned to the salesperson
- Contains lead details and source information

### Pending Communications
- Reminders for scheduled calls or meetings
- Alerts for missed calls requiring follow-up

### Pending Appointments
- Notifications for upcoming customer appointments
- Reminders to prepare for consultations

### Task Deadlines
- Alerts for tasks approaching due date
- Notifications for overdue tasks

---

## Key Features

### ✅ Customer Record
- **Full Communication History**: All calls, emails, meetings tracked
- **Appointment History**: Complete treatment and service history
- **Financial Tracking**: Lifetime value, amounts spent, payment history
- **Repeat Patterns**: Track visit frequency and predict next visit
- **Custom Notes**: Add personalized notes and preferences

### ✅ Communication Tracking
- **Multi-Channel**: Calls, emails, SMS, WhatsApp, meetings
- **Call Status**: Completed, missed, no answer, voicemail
- **Duration Tracking**: Track call lengths
- **Scheduled Follow-ups**: Set reminders for future communications

### ✅ Action Recording
- **Phone Calls**: Log all calls with outcome and notes
- **Follow-ups**: Schedule and track follow-up actions
- **Appointments**: Link actions to appointments
- **Updates**: Record customer status changes

### ✅ Task System
- **Time Tracking**: Due dates and completion tracking
- **Priority Levels**: Low, medium, high, urgent
- **Status Management**: Pending, completed, cancelled, missed
- **Notifications**: Automatic reminders for pending tasks

### ✅ Customer Characterization
- **Flexible Tagging**: VIP, High-Value, Price-Sensitive, etc.
- **Tag Notes**: Add context to each tag
- **Tag-based Filtering**: Find customers by characteristics
- **Multiple Tags**: Assign multiple tags per customer

### ✅ Repeat Management
- **Repeat Identification**: Automatic repeat customer detection
- **Visit Patterns**: Track average days between visits
- **Forecasting**: Predict next visit dates
- **Follow-up Lists**: Identify customers needing contact

---

## Usage Examples

### Recording a Phone Call
```bash
POST /crm/communications
{
  "customerId": "customer-123",
  "type": "call",
  "direction": "outgoing",
  "status": "completed",
  "subject": "Follow-up on treatment interest",
  "notes": "Customer confirmed booking for next week",
  "durationSeconds": 420
}
```

### Creating a Follow-up Task
```bash
POST /crm/actions
{
  "customerId": "customer-123",
  "actionType": "follow_up",
  "title": "Confirm appointment",
  "description": "Call to confirm appointment 24 hours before",
  "status": "pending",
  "priority": "high",
  "dueDate": "2024-01-31T09:00:00Z"
}
```

### Tagging a VIP Customer
```bash
POST /crm/customers/customer-123/tags
{
  "tagId": "vip-tag-id",
  "notes": "Spent over $5000 in last 6 months"
}
```

### Finding Customers Needing Follow-up
```bash
GET /crm/customers/follow-up?daysThreshold=21
```

---

## Best Practices

1. **Log All Communications**: Record every interaction for complete history
2. **Set Follow-up Tasks**: Always create follow-up tasks after calls
3. **Use Tags Effectively**: Tag customers for easy segmentation
4. **Update Customer Status**: Keep customer status current
5. **Review Pending Actions**: Check pending actions daily
6. **Track Repeat Customers**: Focus on repeat customer retention
7. **Monitor Analytics**: Review performance metrics weekly

---

## Integration with Other Modules

- **Appointments**: Actions automatically created for appointments
- **Notifications**: Automatic notifications for tasks and leads
- **Analytics**: Performance data feeds into platform analytics
- **Loyalty**: Customer value tracked for loyalty programs

---

## Error Responses

Standard HTTP status codes:
- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **500**: Internal Server Error

---

## Summary

The Native CRM provides salespeople with:
- **20+ API endpoints** for customer management
- **Complete communication tracking** across all channels
- **Comprehensive task system** with notifications
- **Flexible tagging system** for customer characterization
- **Repeat customer management** and forecasting
- **Performance analytics** and reporting

All features are designed to help salespeople maximize customer relationships and drive revenue growth!
