export enum TaskType {
  // General purpose task
  GENERAL = 'general',

  // Call-related tasks
  CALL = 'call',
  FOLLOW_UP_CALL = 'follow_up_call',
  CONFIRMATION_CALL_REMINDER = 'confirmation_call_reminder',

  // Communication channel specific
  EMAIL_FOLLOW_UP = 'email_follow_up',

  // Booking / treatment related
  APPOINTMENT_REMINDER = 'appointment_reminder',
  TREATMENT_FOLLOW_UP = 'treatment_follow_up',

  // Loyalty / marketing
  LOYALTY_REWARD = 'loyalty_reward',
}