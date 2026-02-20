// User Roles
export enum UserRole {
  ADMIN = 'admin',
  CLINIC_OWNER = 'clinic_owner',
  DOCTOR = 'doctor',
  SECRETARIAT = 'secretariat',
  SALESPERSON = 'salesperson',
  MANAGER = 'manager',
  CLIENT = 'client',
}

// Clinic Profile
export interface ClinicProfile {
  id: string;
  name: string;
  description?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  phone: string;
  email: string;
  website?: string;
  businessHours: BusinessHours;
  timezone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessHours {
  [key: string]: {
    open: string;
    close: string;
    isOpen: boolean;
  };
}

// Services/Treatments
export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  durationMinutes: number;
  category?: string;
  isActive: boolean;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceDto {
  name: string;
  description?: string;
  price: number;
  durationMinutes: number;
  category?: string;
  metadata?: any;
}

// Appointments
export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export interface Appointment {
  id: string;
  clinicId: string;
  clientId: string;
  serviceId: string;
  providerId?: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  totalAmount: number;
  notes?: string;
  treatmentDetails?: any;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  showStatus?: 'showed_up' | 'no_show' | 'pending';
  service?: Service;
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  clientDetails?: {
    fullName: string;
    email: string;
    phone: string;
  };
  provider?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface AppointmentFilters {
  status?: AppointmentStatus;
  date?: string;
  providerId?: string;
  clinicId?: string;
}

// Payment
export enum PaymentMethod {
  CASH = 'cash',
  POS = 'pos',
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
}

export interface Payment {
  id: string;
  appointmentId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  isAdvancePayment: boolean;
  createdAt: string;
}

export interface RecordPaymentDto {
  paymentMethod: PaymentMethod;
  amount: number;
  notes?: string;
  isAdvancePayment?: boolean;
}

export interface CompleteAppointmentDto {
  paymentData?: RecordPaymentDto;
  treatmentDetails?: any;
}

// Analytics
export interface AppointmentAnalytics {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShows: number;
  averageAppointmentValue: number;
  totalRevenue: number;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  monthlyRevenue: number;
  averageAppointmentValue: number;
  revenueByService: Array<{
    serviceName: string;
    revenue: number;
    count: number;
  }>;
}

export interface LoyaltyAnalytics {
  totalPoints: number;
  uniqueClients: number;
  avgPointsPerTransaction: number;
  topClients: Array<{
    clientId: string;
    totalPoints: number;
    transactions: number;
  }>;
}

export interface RepeatForecast {
  customersExpectedNextMonth: number;
  estimatedRevenue: number;
  repeatRate: number;
  customers: Array<{
    id: string;
    name: string;
    lastVisit: string;
    expectedNextVisit: string;
    averageDaysBetween: number;
  }>;
}

// Clients
export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  totalAppointments: number;
  lifetimeValue: number;
  lastAppointment?: string;
  createdAt: string;
}

// Reviews
export interface Review {
  id: string;
  clinicId: string;
  clientId: string;
  appointmentId?: string;
  rating: number;
  comment?: string;
  isVisible: boolean;
  response?: string;
  respondedAt?: string;
  createdAt: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface ReviewStatistics {
  totalReviews: number;
  averageRating: number;
  distribution: {
    [key: number]: number;
  };
}

// Notifications
export enum NotificationType {
  PUSH = 'push',
  SMS = 'sms',
  EMAIL = 'email',
}

export interface SendNotificationDto {
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
}

export interface SendBulkNotificationDto {
  recipientIds: string[];
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
}

// Availability
export interface BlockedSlot {
  date: string;
  startTime: string;
  endTime: string;
  note?: string;
}

export interface AvailabilitySettings {
  businessHours: BusinessHours;
  blockedDates?: string[];
  blockedSlots?: BlockedSlot[];
  timezone: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}
