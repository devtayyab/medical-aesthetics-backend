export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'client' | 'admin' | 'clinic_owner' | 'doctor' | 'secretariat' | 'salesperson';
  profile?: any;
  profilePictureUrl?: string;
  lastLoginAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
  providerId: string;
  clientId: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  paymentMethod?: string;
  advancePaymentAmount?: number;
  totalAmount?: number;
  treatmentDetails?: any;
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
}

export interface LoyaltyBalance {
  clientId: string;
  clinicId?: string;
  totalPoints: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
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
  location?: string;
  category?: string;
  priceRange?: [number, number];
  rating?: number;
  distance?: number;
  sortBy?: 'rating' | 'price' | 'distance' | 'popularity';
}