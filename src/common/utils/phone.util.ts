/**
 * Phone matching helpers.
 *
 * Phones are stored as typed ("+30 694 123 4567", "6941234567", "0030694...").
 * Two numbers are treated as the same person when their last 10 digits match
 * (Greek numbers are 10 digits; the country code is optional in the data).
 */
export const PHONE_MATCH_DIGITS = 10;

/** Digits only, without a leading international "00". */
export function phoneDigits(phone?: string | null): string {
  if (!phone) return '';
  let digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  return digits;
}

/**
 * Key used to compare two phones, or '' when the number is too short to be a
 * full phone number (partial input must never match somebody else's record).
 */
export function phoneMatchKey(phone?: string | null): string {
  const digits = phoneDigits(phone);
  if (digits.length < PHONE_MATCH_DIGITS) return '';
  return digits.slice(-PHONE_MATCH_DIGITS);
}

/** True when both numbers are full phone numbers and refer to the same line. */
export function phonesMatch(a?: string | null, b?: string | null): boolean {
  const ka = phoneMatchKey(a);
  return !!ka && ka === phoneMatchKey(b);
}

/**
 * SQL expression producing the match key of a phone column, for use in
 * TypeORM query builders: `${phoneKeySql('u.phone')} = :phoneKey`.
 */
export function phoneKeySql(column: string): string {
  return `RIGHT(regexp_replace(COALESCE(${column}, ''), '[^0-9]', '', 'g'), ${PHONE_MATCH_DIGITS})`;
}
