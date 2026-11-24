const STAFF_ROLES = ['salesperson', 'manager', 'admin', 'super_admin'];

/**
 * Where clicking a notification should take the user, or null when it has no target.
 * Appointment notifications open that appointment in the calendar (staff only: the
 * calendar is a staff page); customer / lead notifications open the customer page.
 */
export function notificationTarget(data: any, role?: string | null): string | null {
  const isStaff = STAFF_ROLES.includes(String(role || '').toLowerCase());
  if (isStaff && data?.appointmentId) {
    return `/crm/calendar?appointmentId=${data.appointmentId}`;
  }
  const cid = data?.customerId || data?.leadId;
  if (cid) return `/crm/customer/${cid}`;
  return null;
}
