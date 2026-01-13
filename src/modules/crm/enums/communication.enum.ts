export enum CommunicationType {
  CALL = 'call',
  EMAIL = 'email',
  SMS = 'sms',
  WHATSAPP = 'whatsapp',
  MEETING = 'meeting',
  NOTE = 'note',
  SYSTEM = 'system',
}

export enum CommunicationDirection {
  OUTGOING = 'outgoing',
  INCOMING = 'incoming',
  MISSED = 'missed',
}

export enum CommunicationStatus {
  COMPLETED = 'completed',
  MISSED = 'missed',
  NO_ANSWER = 'no_answer',
  VOICEMAIL = 'voicemail',
  SCHEDULED = 'scheduled',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

export enum CommunicationOutcome {
  POSITIVE = 'positive',
  NEUTRAL = 'neutral',
  NEGATIVE = 'negative',
  FOLLOW_UP_NEEDED = 'follow_up_needed',
}
