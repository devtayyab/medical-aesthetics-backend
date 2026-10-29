/**
 * Single notification event for appointments. Every place that changes an appointment emits
 * ONE of these (instead of sending notifications inline), and AppointmentNotificationsListener
 * decides the recipients. This is what keeps it to one notification per event and person.
 */
export const APPOINTMENT_NOTIFY_EVENT = 'appointment.notify';

export type AppointmentNotifyKind =
  | 'created'
  | 'changed'
  | 'cancelled'
  | 'confirmed'
  | 'no_show'
  | 'completed'
  | 'deleted';

export interface AppointmentNotifyPayload {
  kind: AppointmentNotifyKind;
  appointmentId: string;
  /** User who made the change; excluded from the recipients. */
  actorId?: string;
  /** Values before a change (for 'changed'). */
  previous?: {
    startTime?: Date | string;
    clinicId?: string;
    serviceId?: string;
    additionalServiceIds?: string[];
    providerId?: string;
    bookedById?: string;
    representativeId?: string;
  };
  /** Amount the client had paid before a cancellation (cancel resets amountPaid to 0). */
  paidAmount?: number;
  /** Client asked for the new time; the appointment is pending confirmation again. */
  isClientReschedule?: boolean;
}

/** Payment ledger events (payments, refunds, voids). */
export const PAYMENT_NOTIFY_EVENT = 'payment.notify';

export interface PaymentNotifyPayload {
  paymentId: string;
  actorId?: string;
}
