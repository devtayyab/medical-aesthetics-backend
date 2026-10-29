/**
 * Helpers that keep personal and financial data away from callers who must not see it.
 *
 * Rules (pre-launch items 16, 17, 32):
 * - Doctor/staff personal email, phone and last login never reach clients or anonymous callers.
 * - Clinic bank details (IBAN/BIC/holder/bank) only reach the clinic owner and admins.
 */

export const CLINIC_BANK_FIELDS = ['bankIban', 'bankBic', 'bankAccountHolder', 'bankName'] as const;

const PERSONAL_USER_FIELDS = [
  'email',
  'phone',
  'lastLoginAt',
  'password',
  'passwordHash',
  'refreshToken',
  'emailVerificationToken',
  'emailVerificationExpiry',
  'profile',
  'monthlyTarget',
  'referralCode',
  'referredById',
  'marketingEmailConsent',
  'marketingEmailConsentDate',
  // @Exclude()d on the entity, but the exclusion is lost once the user is copied into a plain
  // object here, so they must be removed explicitly.
  'failedLoginAttempts',
  'lockedUntil',
  'loginCodeHash',
  'loginCodeExpiresAt',
  'loginCodeSentAt',
  'loginCodeAttempts',
] as const;

/** Returns a shallow copy of a user-like object without contact, login or credential fields. */
export function stripUserPersonalData<T extends Record<string, any> | null | undefined>(user: T): T {
  if (!user || typeof user !== 'object') return user;
  const copy: Record<string, any> = { ...user };
  PERSONAL_USER_FIELDS.forEach((f) => delete copy[f]);
  return copy as T;
}

/** Returns a shallow copy of a clinic-like object without bank details. */
export function stripClinicBankData<T extends Record<string, any> | null | undefined>(clinic: T): T {
  if (!clinic || typeof clinic !== 'object') return clinic;
  const copy: Record<string, any> = { ...clinic };
  CLINIC_BANK_FIELDS.forEach((f) => delete copy[f]);
  return copy as T;
}

/** Public display name for a reviewer: first name plus last-name initial. */
export function publicDisplayName(user: { firstName?: string; lastName?: string } | null | undefined): string {
  if (!user) return '';
  const first = (user.firstName || '').trim();
  const initial = (user.lastName || '').trim().charAt(0);
  return initial ? `${first} ${initial}.` : first;
}
