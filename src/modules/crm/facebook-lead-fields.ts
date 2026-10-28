/**
 * Maps the questions of a Facebook lead form to the person's name, email and
 * phone. Forms use standard keys (full_name, phone_number) but also custom and
 * localised ones, including Greek ("Ονοματεπώνυμο", "Τηλέφωνο", "Κινητό").
 * Pure function so the import and the fix script use the same rules.
 */

export interface LeadFieldInput {
  name: string;
  values?: string[] | string | null;
}

export interface LeadIdentity {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  otherAnswers: Array<{ question: string; answer: string }>;
}

/** Lower-case, accents removed, every non letter/digit turned into "_". */
export function normalizeFieldKey(key: string): string {
  return String(key || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/ς/g, 'σ')
    .replace(/[^a-z0-9Ͱ-Ͽ]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// Keys (normalised) that contain one of these never describe the person
const EXCLUDED_PARTS = ['ad_name', 'adset', 'campaign', 'company', 'business', 'clinic', 'page_name', 'form_name', 'κλινικ', 'εταιρ'];

// Full name: checked first
const FULL_NAME_KEYS = ['full_name', 'fullname', 'name', 'ονοματεπωνυμο', 'ονομα_επωνυμο', 'ονοματεπωνυμια', 'ονομα_και_επωνυμο', 'ονοματεπωνυμο_σασ'];
const FULL_NAME_PARTS = ['full_name', 'fullname', 'ονοματεπωνυμ', 'ονομα_και_επωνυμ', 'ονομα_επωνυμ'];
const FIRST_NAME_PARTS = ['first_name', 'firstname', 'vorname', 'given_name', 'ονομα'];
const LAST_NAME_PARTS = ['last_name', 'lastname', 'surname', 'nachname', 'family_name', 'επωνυμο'];
const EMAIL_PARTS = ['email', 'e_mail', 'mail', 'ηλεκτρονικ'];
const PHONE_PARTS = ['phone', 'telefon', 'mobil', 'handy', 'tel', 'τηλεφων', 'κινητ', 'τηλ'];

function valueOf(field: LeadFieldInput): string {
  if (Array.isArray(field.values)) {
    return field.values
      .filter((v) => v !== null && v !== undefined)
      .map((v) => String(v).trim())
      .filter(Boolean)
      .join(', ');
  }
  if (field.values !== null && field.values !== undefined) return String(field.values).trim();
  return '';
}

function isFullNameKey(k: string): boolean {
  return FULL_NAME_KEYS.includes(k) || FULL_NAME_PARTS.some((p) => k.includes(p));
}

function isFirstNameKey(k: string): boolean {
  if (isFullNameKey(k)) return false;
  return FIRST_NAME_PARTS.some((p) => k.includes(p)) && !LAST_NAME_PARTS.some((p) => k.includes(p));
}

function isLastNameKey(k: string): boolean {
  if (isFullNameKey(k)) return false;
  return LAST_NAME_PARTS.some((p) => k.includes(p));
}

function isEmailKey(k: string): boolean {
  return EMAIL_PARTS.some((p) => k.includes(p));
}

function isPhoneKey(k: string): boolean {
  // "tel" must be a word on its own to avoid matching e.g. "hotel"
  return PHONE_PARTS.some((p) => (p === 'tel' ? /(^|_)tel(_|$)/.test(k) : k.includes(p)));
}

function looksLikeEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function looksLikePhone(v: string): boolean {
  const digits = v.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15 && /^[+\d\s().-]+$/.test(v);
}

export function extractLeadIdentity(fields: LeadFieldInput[]): LeadIdentity {
  let fullName: string | undefined;
  let firstName: string | undefined;
  let lastName: string | undefined;
  let email: string | undefined;
  let phone: string | undefined;
  const otherAnswers: Array<{ question: string; answer: string }> = [];

  for (const field of Array.isArray(fields) ? fields : []) {
    if (!field || !field.name) continue;
    const value = valueOf(field);
    const k = normalizeFieldKey(field.name);
    const excluded = EXCLUDED_PARTS.some((p) => k.includes(p));

    if (!excluded && value) {
      if (!email && isEmailKey(k) && looksLikeEmail(value)) { email = value; continue; }
      if (!phone && isPhoneKey(k) && looksLikePhone(value)) { phone = value; continue; }
      if (!fullName && isFullNameKey(k)) { fullName = value; continue; }
      if (!firstName && isFirstNameKey(k)) { firstName = value; continue; }
      if (!lastName && isLastNameKey(k)) { lastName = value; continue; }
    }

    // Marketing fields (ad name, campaign) are kept out of the answers
    if (value && !['ad_name', 'campaign_name', 'adset_name'].includes(k)) {
      otherAnswers.push({ question: field.name, answer: value });
    }
  }

  // Last resort: an unlabelled answer that is clearly an email/phone
  if (!email) {
    const hit = otherAnswers.find((a) => looksLikeEmail(a.answer));
    if (hit) { email = hit.answer; otherAnswers.splice(otherAnswers.indexOf(hit), 1); }
  }
  if (!phone) {
    const hit = otherAnswers.find((a) => looksLikePhone(a.answer) && !/\d{4}-\d{2}-\d{2}/.test(a.answer));
    if (hit) { phone = hit.answer; otherAnswers.splice(otherAnswers.indexOf(hit), 1); }
  }

  if (fullName && (!firstName || !lastName)) {
    const parts = fullName.split(/\s+/).filter(Boolean);
    if (!firstName) firstName = parts[0];
    if (!lastName && parts.length > 1) lastName = parts.slice(1).join(' ');
  }

  return {
    firstName: firstName?.trim() || undefined,
    lastName: lastName?.trim() || undefined,
    email: email?.trim() || undefined,
    phone: phone?.trim() || undefined,
    otherAnswers,
  };
}
