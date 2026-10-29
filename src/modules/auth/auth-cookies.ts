import type { CookieOptions, Request, Response } from 'express';

/**
 * Session tokens live in httpOnly cookies so page scripts can never read them.
 * The Authorization: Bearer header keeps working for clients that cannot use cookies.
 *
 * Env:
 *   COOKIE_DOMAIN    optional, e.g. ".beautydoctors.gr" when web and API are on sub-domains
 *   COOKIE_SAMESITE  lax (default) | strict | none  (none needs HTTPS; use when web and API are different sites)
 *   COOKIE_SECURE    true/false; defaults to true in production
 */
export const ACCESS_COOKIE = 'bd_access';
export const REFRESH_COOKIE = 'bd_refresh';

const ACCESS_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function baseOptions(): CookieOptions {
  const sameSiteEnv = (process.env.COOKIE_SAMESITE || 'lax').toLowerCase();
  const sameSite = (['lax', 'strict', 'none'].includes(sameSiteEnv) ? sameSiteEnv : 'lax') as 'lax' | 'strict' | 'none';
  const secureEnv = process.env.COOKIE_SECURE;
  const secure = secureEnv !== undefined
    ? secureEnv === 'true'
    : process.env.NODE_ENV === 'production' || sameSite === 'none';
  return {
    httpOnly: true,
    secure: sameSite === 'none' ? true : secure,
    sameSite,
    domain: process.env.COOKIE_DOMAIN || undefined,
  };
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const base = baseOptions();
  res.cookie(ACCESS_COOKIE, accessToken, { ...base, path: '/', maxAge: ACCESS_MAX_AGE_MS });
  // The refresh token is only ever needed by /api/auth/* endpoints.
  res.cookie(REFRESH_COOKIE, refreshToken, { ...base, path: '/api/auth', maxAge: REFRESH_MAX_AGE_MS });
}

export function clearAuthCookies(res: Response) {
  const base = baseOptions();
  res.clearCookie(ACCESS_COOKIE, { ...base, path: '/' });
  res.clearCookie(REFRESH_COOKIE, { ...base, path: '/api/auth' });
}

/** Minimal cookie reader (no cookie-parser dependency). */
export function readCookie(req: Pick<Request, 'headers'> | undefined, name: string): string | null {
  const header = req?.headers?.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) {
      const value = part.slice(idx + 1).trim();
      try {
        return decodeURIComponent(value) || null;
      } catch {
        return value || null;
      }
    }
  }
  return null;
}
