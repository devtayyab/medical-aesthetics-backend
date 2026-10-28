import { NotificationTrigger } from '../../common/enums/notification-trigger.enum';
import { NotificationType } from '../../common/enums/notification-type.enum';

/**
 * Default (Greek) notification templates, editable later by admins in Notification Settings.
 * Placeholders: {{customerName}}, {{serviceName}}, {{appointmentDate}} (dd/mm/yyyy, Athens),
 * {{appointmentTime}} (HH:mm, Athens), {{clinicName}}, {{clinicAddress}}, {{amount}},
 * {{paymentMethod}}, {{reviewUrl}}, {{taskTitle}}, {{dueDate}}, {{email}}, {{message}}.
 */
export const DEFAULT_TEMPLATES: Array<{
  trigger: NotificationTrigger;
  type: NotificationType;
  subject: string;
  content: string;
}> = [
  // --- Client: appointment lifecycle ---
  {
    trigger: NotificationTrigger.APPOINTMENT_BOOKED,
    type: NotificationType.EMAIL,
    subject: 'Το αίτημα ραντεβού σας καταχωρήθηκε - {{serviceName}}',
    content:
      'Γεια σας {{customerName}},\n\nΤο αίτημα ραντεβού σας καταχωρήθηκε:\n\nΘεραπεία: {{serviceName}}\nΗμερομηνία: {{appointmentDate}}\nΏρα: {{appointmentTime}}\nΚλινική: {{clinicName}}\n\nΘα σας ενημερώσουμε μόλις επιβεβαιωθεί.\n\nΜε εκτίμηση,\nΗ ομάδα Beauty Doctors',
  },
  {
    trigger: NotificationTrigger.APPOINTMENT_BOOKED,
    type: NotificationType.PUSH,
    subject: 'Το ραντεβού σας καταχωρήθηκε',
    content: '{{serviceName}} στις {{appointmentDate}} {{appointmentTime}}, {{clinicName}}. Αναμένει επιβεβαίωση.',
  },
  {
    trigger: NotificationTrigger.APPOINTMENT_CONFIRMED,
    type: NotificationType.PUSH,
    subject: 'Το ραντεβού σας επιβεβαιώθηκε',
    content: '{{serviceName}} στις {{appointmentDate}} {{appointmentTime}}, {{clinicName}}.',
  },
  {
    trigger: NotificationTrigger.APPOINTMENT_CONFIRMED,
    type: NotificationType.EMAIL,
    subject: 'Επιβεβαίωση ραντεβού - {{clinicName}}',
    content:
      'Γεια σας {{customerName}},\n\nΤο ραντεβού σας επιβεβαιώθηκε:\n\nΘεραπεία: {{serviceName}}\nΗμερομηνία: {{appointmentDate}}\nΏρα: {{appointmentTime}}\nΚλινική: {{clinicName}}\n{{clinicAddress}}\n\nΣας περιμένουμε!\n\nΜε εκτίμηση,\nΗ ομάδα Beauty Doctors',
  },
  {
    trigger: NotificationTrigger.APPOINTMENT_RESCHEDULED,
    type: NotificationType.PUSH,
    subject: 'Το ραντεβού σας άλλαξε',
    content: 'Νέα στοιχεία: {{serviceName}} στις {{appointmentDate}} {{appointmentTime}}, {{clinicName}}.',
  },
  {
    trigger: NotificationTrigger.APPOINTMENT_RESCHEDULED,
    type: NotificationType.EMAIL,
    subject: 'Αλλαγή ραντεβού - {{appointmentDate}} {{appointmentTime}}',
    content:
      'Γεια σας {{customerName}},\n\nΤο ραντεβού σας άλλαξε. Τα νέα στοιχεία είναι:\n\nΘεραπεία: {{serviceName}}\nΗμερομηνία: {{appointmentDate}}\nΏρα: {{appointmentTime}}\nΚλινική: {{clinicName}}\n\nΑν η νέα ώρα δεν σας εξυπηρετεί, επικοινωνήστε μαζί μας.\n\nΜε εκτίμηση,\nΗ ομάδα Beauty Doctors',
  },
  {
    trigger: NotificationTrigger.APPOINTMENT_CANCELED,
    type: NotificationType.PUSH,
    subject: 'Το ραντεβού σας ακυρώθηκε',
    content: 'Το ραντεβού {{serviceName}} στις {{appointmentDate}} {{appointmentTime}} ακυρώθηκε.',
  },
  {
    trigger: NotificationTrigger.APPOINTMENT_CANCELED,
    type: NotificationType.EMAIL,
    subject: 'Ακύρωση ραντεβού - {{appointmentDate}} {{appointmentTime}}',
    content:
      'Γεια σας {{customerName}},\n\nΣας ενημερώνουμε ότι το ραντεβού σας για {{serviceName}} στις {{appointmentDate}} {{appointmentTime}} ακυρώθηκε.\n\nΑν δεν το ζητήσατε εσείς ή θέλετε νέο ραντεβού, επικοινωνήστε μαζί μας στο info@beautydoctors.gr.\n\nΜε εκτίμηση,\nΗ ομάδα Beauty Doctors',
  },
  {
    trigger: NotificationTrigger.APPOINTMENT_REMINDER,
    type: NotificationType.PUSH,
    subject: 'Υπενθύμιση ραντεβού αύριο',
    content: 'Αύριο {{appointmentDate}} στις {{appointmentTime}}: {{serviceName}}, {{clinicName}}.',
  },
  {
    trigger: NotificationTrigger.APPOINTMENT_REMINDER,
    type: NotificationType.EMAIL,
    subject: 'Υπενθύμιση: το ραντεβού σας αύριο στις {{appointmentTime}}',
    content:
      'Γεια σας {{customerName}},\n\nΣας υπενθυμίζουμε το ραντεβού σας:\n\nΗμερομηνία: {{appointmentDate}}\nΏρα: {{appointmentTime}}\nΘεραπεία: {{serviceName}}\nΚλινική: {{clinicName}}\n{{clinicAddress}}\n\nΑν χρειάζεται αλλαγή, επικοινωνήστε μαζί μας το συντομότερο.\n\nΜε εκτίμηση,\nΗ ομάδα Beauty Doctors',
  },
  {
    trigger: NotificationTrigger.APPOINTMENT_REMINDER_SAME_DAY,
    type: NotificationType.PUSH,
    subject: 'Το ραντεβού σας σε 2 ώρες',
    content: 'Σήμερα στις {{appointmentTime}}: {{serviceName}}, {{clinicName}}.',
  },
  {
    trigger: NotificationTrigger.APPOINTMENT_REMINDER_SAME_DAY,
    type: NotificationType.EMAIL,
    subject: 'Σήμερα στις {{appointmentTime}}: το ραντεβού σας',
    content:
      'Γεια σας {{customerName}},\n\nΣας περιμένουμε σήμερα {{appointmentDate}} στις {{appointmentTime}} για {{serviceName}}.\n\nΚλινική: {{clinicName}}\n{{clinicAddress}}\n\nΜε εκτίμηση,\nΗ ομάδα Beauty Doctors',
  },
  {
    trigger: NotificationTrigger.POST_VISIT_THANK_YOU,
    type: NotificationType.EMAIL,
    subject: 'Ευχαριστούμε για την επίσκεψή σας - {{clinicName}}',
    content:
      'Γεια σας {{customerName}},\n\nΣας ευχαριστούμε που επιλέξατε το {{clinicName}} για {{serviceName}}. Ελπίζουμε να μείνατε ικανοποιημένοι!\n\nΜε εκτίμηση,\nΗ ομάδα Beauty Doctors',
  },
  {
    trigger: NotificationTrigger.REVIEW_REQUEST,
    type: NotificationType.PUSH,
    subject: 'Πώς ήταν η επίσκεψή σας;',
    content: 'Αξιολογήστε τη θεραπεία {{serviceName}} στο {{clinicName}}. Η γνώμη σας μετράει!',
  },
  {
    trigger: NotificationTrigger.REVIEW_REQUEST,
    type: NotificationType.EMAIL,
    subject: 'Πώς ήταν η επίσκεψή σας στο {{clinicName}};',
    content:
      'Γεια σας {{customerName}},\n\nΣας ευχαριστούμε για την επίσκεψή σας για {{serviceName}} στις {{appointmentDate}}.\n\nΘα θέλαμε πολύ τη γνώμη σας. Η αξιολόγηση παίρνει μόνο ένα λεπτό:\n{{reviewUrl}}\n\nΜε εκτίμηση,\nΗ ομάδα Beauty Doctors',
  },
  {
    trigger: NotificationTrigger.PAYMENT_RECEIPT,
    type: NotificationType.EMAIL,
    subject: 'Απόδειξη πληρωμής - {{amount}}',
    content:
      'Γεια σας {{customerName}},\n\nΛάβαμε την πληρωμή σας:\n\nΠοσό: {{amount}}\nΤρόπος πληρωμής: {{paymentMethod}}\nΘεραπεία: {{serviceName}}\nΡαντεβού: {{appointmentDate}} {{appointmentTime}}\nΚλινική: {{clinicName}}\n\nΣας ευχαριστούμε!\nΗ ομάδα Beauty Doctors',
  },
  {
    trigger: NotificationTrigger.REFUND_ISSUED,
    type: NotificationType.EMAIL,
    subject: 'Επιστροφή χρημάτων - {{amount}}',
    content:
      'Γεια σας {{customerName}},\n\nΣας ενημερώνουμε ότι έγινε επιστροφή {{amount}} για το ραντεβού {{serviceName}} στις {{appointmentDate}}.\n\nΗ επιστροφή εμφανίζεται στον λογαριασμό σας σε λίγες εργάσιμες ημέρες, ανάλογα με την τράπεζα.\n\nΜε εκτίμηση,\nΗ ομάδα Beauty Doctors',
  },
  {
    trigger: NotificationTrigger.WELCOME_CREDENTIALS,
    type: NotificationType.EMAIL,
    subject: 'Καλώς ήρθατε στο Beauty Doctors',
    content:
      'Γεια σας {{customerName}},\n\nΟ λογαριασμός σας δημιουργήθηκε με το email {{email}}.\n\nΜπορείτε να συνδεθείτε στο https://beautydoctors.gr για να δείτε τα ραντεβού σας.\n\nΜε εκτίμηση,\nΗ ομάδα Beauty Doctors',
  },

  // --- Clinic (doctor / secretariat) ---
  {
    trigger: NotificationTrigger.CLINIC_NEW_APPOINTMENT,
    type: NotificationType.EMAIL,
    subject: 'Νέο ραντεβού {{appointmentDate}} {{appointmentTime}}',
    content:
      'Νέο ραντεβού στο {{clinicName}}:\n\nΠελάτης: {{customerName}}\nΘεραπεία: {{serviceName}}\nΗμερομηνία: {{appointmentDate}}\nΏρα: {{appointmentTime}}\n\nΔείτε το στο ημερολόγιο του Beauty Doctors.',
  },
  {
    trigger: NotificationTrigger.CLINIC_APPOINTMENT_CANCELLED,
    type: NotificationType.EMAIL,
    subject: 'Ακύρωση ραντεβού {{appointmentDate}} {{appointmentTime}}',
    content:
      'Το ραντεβού {{appointmentDate}} {{appointmentTime}} στο {{clinicName}} ακυρώθηκε.\n\nΗ ώρα είναι πλέον διαθέσιμη στο ημερολόγιο.',
  },

  // --- Admin ---
  {
    trigger: NotificationTrigger.ADMIN_ALERT,
    type: NotificationType.EMAIL,
    subject: '[Beauty Doctors] {{title}}',
    content: '{{message}}\n\nΗ ειδοποίηση στάλθηκε αυτόματα από την πλατφόρμα Beauty Doctors.',
  },

  // --- Staff ---
  {
    trigger: NotificationTrigger.TASK_REMINDER,
    type: NotificationType.PUSH,
    subject: 'Υπενθύμιση εργασίας',
    content: 'Η εργασία "{{taskTitle}}" έληγε στις {{dueDate}}.',
  },
];

/** Subjects of the old English defaults; templates still holding them are upgraded. */
export const LEGACY_DEFAULT_SUBJECTS = new Set<string>([
  'Appointment Booked: {{serviceName}}',
  'New Appointment Booked',
  'Appointment Confirmed!',
  'Confirmed: Your Appointment at {{clinicName}}',
  'Appointment Rescheduled',
  'Updated Appointment Details',
  'Appointment Cancelled',
  'Upcoming Appointment Reminder',
  'Reminder: Your Appointment Tomorrow at {{clinicName}}',
  'Thank You for Choosing {{clinicName}}',
  'Task Reminder',
  'Welcome to Beauty & Doctors - Your Account is Ready',
  'Action Completed',
]);
