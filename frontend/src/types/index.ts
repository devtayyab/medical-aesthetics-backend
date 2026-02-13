export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'client' | 'admin' | 'SUPER_ADMIN' | 'clinic_owner' | 'doctor' | 'secretariat' | 'salesperson' | 'manager';
  profile?: any;
  profilePictureUrl?: string;
  lastLoginAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  beautyPoints?: number;
}

export interface Clinic {
  id: string;
  name: string;
  description: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  phone?: string;
  email?: string;
  website?: string;
  businessHours: {
    [day: string]: {
      open: string;
      close: string;
      isOpen: boolean;
    };
  };
  timezone?: string;
  isActive: boolean;
  ownerId: string;
  images?: string[];
  rating?: number;
  reviewCount?: number;
  priceRange?: string;
  distance?: number;
  services: Service[];
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  category: string;
  metadata?: any;
  isActive: boolean;
  clinicId: string;
  images?: string[];
}

export interface Appointment {
  id: string;
  clinicId: string;
  serviceId: string;
  providerId?: string;
  clientId: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  paymentMethod?: string;
  advancePaymentAmount?: number;
  totalAmount?: number;
  treatmentDetails?: any;
  clientDetails?: {
    fullName: string;
    email: string;
    phone: string;
  };
  completedAt?: string;
  clinic: Clinic;
  service: Service;
  provider: User;
  client: User;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  price?: number;
  discount?: number;
  providerId?: string;
}

export interface LoyaltyBalance {
  clientId: string;
  clinicId?: string;
  // totalPoints: number;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  rewards: string[];
}

export interface Notification {
  id: string;
  recipientId: string;
  type: 'push' | 'sms' | 'viber' | 'email';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  isSent: boolean;
  sentAt?: string;
  readAt?: string;
  createdAt: string;
}

export interface BookingFlow {
  selectedClinic?: Clinic;
  selectedServices: Service[];
  selectedDate?: string;
  selectedTimeSlot?: TimeSlot;
  totalAmount: number;
  step: 'services' | 'datetime' | 'details' | 'confirmation';
}

export interface SearchFilters {
  query?: string;
  location?: string;
  category?: string;
  priceRange?: [number, number];
  rating?: number;
  distance?: number;
  sortBy?: 'rating' | 'price' | 'distance' | 'popularity';
}

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  source?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: 'phone' | 'email' | 'meeting';
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo: string;
  customerId?: string;
  createdAt: string;
  updatedAt: string;
  selectedTask: boolean;
  customer?: Customer;
  assignee?: User;
}
export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedSalespersonId?: string;
  assignedSales?: {
    id: string;
    firstName: string;
    lastName: string;
    role?: string;
    email: string;
    phone: string;
    createdAt: string;
    updatedAt: string;
  };
  isRepeatCustomer: boolean;
  createdAt: string;
  updatedAt: string;
  source: string;
  summary: {
    totalAppointments: number;
    completedAppointments: number;
    lifetimeValue: number;
    repeatCount: number;
  };
}
export interface ActionLogType {
  id: string;
  customerId: string;
  type: 'call' | 'email' | 'note' | 'meeting';
  notes: string;
  createdAt: string;
}

export interface LoyaltyTier {
  name: string;
  points: number;
  rewards: string[];
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  timestamp: string;
  details?: any;
}

export * from './crm.types';