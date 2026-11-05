/**
 * Browsers may only send credentialed (cookie) requests from these origins.
 * CORS_ORIGINS: comma-separated list, e.g. "https://beautydoctors.gr,https://www.beautydoctors.gr".
 * Falls back to FRONTEND_URL, local dev servers and the Capacitor/WebView origins.
 */
export function allowedOrigins(): string[] {
  const fromEnv = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);
  const frontend = (process.env.FRONTEND_URL || '').trim().replace(/\/$/, '');
  const defaults = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4173',
    'capacitor://localhost',
    'http://localhost',
    'https://localhost',
  ];
  return Array.from(new Set([...fromEnv, ...(frontend ? [frontend] : []), ...defaults]));
}

export function isAllowedOrigin(origin: string | undefined | null): boolean {
  if (!origin) return false;
  return allowedOrigins().includes(origin.replace(/\/$/, ''));
}

/**
 * Socket handshake token: explicit token (native clients) first, otherwise the httpOnly
 * access cookie, but only from an allowed origin. Browsers attach cookies to WebSocket
 * handshakes from any site, so without the origin check another site could open a socket
 * as the logged-in user.
 */
export function socketHandshakeToken(
  handshake: { auth?: any; query?: any; headers?: any },
  readCookie: (req: any, name: string) => string | null,
  cookieName: string,
): string | null {
  const explicit = handshake.auth?.token || handshake.query?.token;
  if (explicit) return String(explicit);
  if (!isAllowedOrigin(handshake.headers?.origin)) return null;
  return readCookie(handshake, cookieName);
}
