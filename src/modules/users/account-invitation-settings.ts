/**
 * Switch for the AUTOMATIC "Set your password" invitation (inside appointment emails, and when
 * someone registers with the email of an account that has no password yet).
 *  - off  (default, also when nothing is stored): nothing is sent
 *  - test: only to the addresses in the test list
 *  - on:   every customer who has not set a password
 * Invitations an admin sends by hand to selected customers do not depend on it.
 */
export type InvitationMode = 'off' | 'test' | 'on';

export const INVITATION_MODE_KEY = 'account_invitation_mode';
export const INVITATION_TEST_EMAILS_KEY = 'account_invitation_test_emails';

export interface InvitationSettings {
  mode: InvitationMode;
  testEmails: string[];
}

export function parseInvitationSettings(mode: unknown, testEmails: unknown): InvitationSettings {
  return {
    mode: mode === 'on' || mode === 'test' ? mode : 'off',
    testEmails: Array.isArray(testEmails)
      ? [...new Set(testEmails.map((e) => String(e || '').trim().toLowerCase()).filter(Boolean))]
      : [],
  };
}

export function invitationAllowed(settings: InvitationSettings, email?: string | null): boolean {
  if (settings.mode === 'on') return true;
  if (settings.mode !== 'test') return false;
  return settings.testEmails.includes(String(email || '').trim().toLowerCase());
}

/**
 * The part of the ACCOUNT_INVITATION template that goes at the bottom of an appointment email:
 * without its greeting and signature, which the appointment email already has.
 * Keeps {{placeholders}}; the link is added on its own line if the template has none.
 */
export function invitationBodyForAppointmentEmail(content: string): string {
  const paragraphs = String(content || '')
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (paragraphs.length > 1 && paragraphs[0].endsWith(',') && !paragraphs[0].includes('\n')) paragraphs.shift();
  const closing = paragraphs.findIndex((p) => /^Με εκτίμηση/i.test(p));
  const body = (closing === -1 ? paragraphs : paragraphs.slice(0, closing)).join('\n\n');
  return body.includes('{{link}}') ? body : `${body}\n\n{{link}}`;
}
