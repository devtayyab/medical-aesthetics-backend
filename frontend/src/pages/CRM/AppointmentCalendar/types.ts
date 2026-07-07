// ─── Calendar View Types ───────────────────────────────────────────────────────

export type CalendarView = 'day' | 'week';

export type AppointmentStatusType =
  | 'PENDING'
  | 'CONFIRMED'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'EXECUTED';

export type PaymentStatusType = 'UNPAID' | 'PAID' | 'PARTIALLY_PAID';

export type BlockReasonType = 'LUNCH_BREAK' | 'MEETING' | 'HOLIDAY' | 'OTHER';

// ─── Calendar Filters ─────────────────────────────────────────────────────────

export interface CalendarFilters {
  clinicId: string;
  salesPersonId: string;
  status: string;
  paymentStatus: string;
}

// ─── Create / Edit Appointment Form ──────────────────────────────────────────

export interface AppointmentFormData {
  patientId: string;
  patientName: string;
  isNewPatient?: boolean;
  newPatientDetails?: {
    fullName: string;
    email: string;
    phone: string;
  };
  serviceId: string;
  additionalServiceIds?: string[];
  serviceName: string;
  clinicId: string;
  clinicName: string;
  salesPersonId: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  status: AppointmentStatusType;
  notes: string;
  // Payment
  paymentMethod: 'cash' | 'card' | '';
  amount: number;
  tax: number;
  discount: number;
  paymentStatus: PaymentStatusType;
}

// ─── Block Slot Form ──────────────────────────────────────────────────────────

export interface BlockSlotFormData {
  clinicId: string;
  salesPersonId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: BlockReasonType;
  customReason: string;
}

// ─── Block Day Form ───────────────────────────────────────────────────────────

export interface BlockDayFormData {
  clinicId: string;
  date: string;
  reason: string;
}

// ─── Drag & Drop State ────────────────────────────────────────────────────────

export interface DragState {
  appointmentId: string;
  originalStart: string;
  originalEnd: string;
  /** Pixel offset from top of the dragged element where the mouse started */
  offsetY: number;
  /** Pixel offset from left of the dragged element where the mouse started */
  offsetX: number;
}

export interface ResizeState {
  appointmentId: string;
  originalEnd: string;
}

// ─── Calendar Appointment (enriched for display) ──────────────────────────────
// Using Record<string, any> to avoid @/types path alias issues in standalone TSC.
// Vite resolves @/types correctly at build/dev time.

export type CalendarAppointment = Record<string, any> & {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  /** Computed payment status based on amountPaid / totalAmount */
  computedPaymentStatus: PaymentStatusType;
  /** Salesperson color index for multi-resource display */
  colorIndex: number;
};

// ─── Conflict Detection ───────────────────────────────────────────────────────

export interface ConflictInfo {
  hasConflict: boolean;
  message: string;
  conflictingAppointment?: any;
}


// ─── Slot Click Payload ───────────────────────────────────────────────────────

export interface SlotClickPayload {
  date: Date;
  timeStr: string; // "HH:mm"
  salesPersonId?: string;
}

// ─── Salesperson Resource ─────────────────────────────────────────────────────

export interface SalesPersonResource {
  id: string;
  name: string;
  initials: string;
  colorIndex: number;
}
