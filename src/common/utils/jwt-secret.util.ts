/**
 * Resolves a JWT signing secret from the environment.
 *
 * The first env var that is set wins. Outside production a fixed development fallback keeps
 * local setups working; in production a missing secret aborts startup, because a publicly
 * known default would let anyone forge tokens for any user.
 */
import { config as loadDotenv } from 'dotenv';

const DEV_FALLBACK_SECRET = 'medical-aesthetics-secret-key';

export function resolveJwtSecret(...envNames: string[]): string {
  // Module decorators run at import time, before ConfigModule has read .env. Load it here
  // (never overrides variables that are already set) so the real secret is seen.
  loadDotenv();
  for (const name of envNames) {
    const value = process.env[name];
    if (value) return value;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`Missing JWT secret: set ${envNames.join(' or ')} in the environment.`);
  }
  return DEV_FALLBACK_SECRET;
}
