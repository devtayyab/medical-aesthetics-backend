import { CallHandler, ExecutionContext, Injectable, NestInterceptor, StreamableFile } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Last line of defence against credential leaks (QA NEW-1).
 *
 * @Exclude() on the User entity only works while the user is still a class instance.
 * Many services copy entities into plain objects ({ ...appointment.provider }), which drops
 * the exclusion, so password hashes and login secrets reached clients. This interceptor
 * runs after ClassSerializerInterceptor (which already returns fresh plain copies) and
 * removes these fields from every response, at any depth.
 */
const ALWAYS_STRIPPED = new Set([
  'passwordHash',
  'loginCodeHash',
  'loginCodeExpiresAt',
  'loginCodeSentAt',
  'loginCodeAttempts',
  'emailVerificationToken',
  'failedLoginAttempts',
  'lockedUntil',
  'resetPasswordToken',
  'googleRefreshToken',
  'googleAccessToken',
]);

/** A stored refresh token on a user row. The session payload of /auth/* has no `role`, so it is kept there. */
const isUserShaped = (obj: Record<string, any>) => 'role' in obj && ('firstName' in obj || 'email' in obj);

export function stripCredentials(value: any, seen: WeakSet<object> = new WeakSet()): any {
  if (!value || typeof value !== 'object') return value;
  if (value instanceof Date || Buffer.isBuffer(value) || value instanceof StreamableFile) return value;
  if (seen.has(value)) return value;
  seen.add(value);

  if (Array.isArray(value)) {
    for (const item of value) stripCredentials(item, seen);
    return value;
  }

  for (const key of Object.keys(value)) {
    if (ALWAYS_STRIPPED.has(key)) {
      delete value[key];
      continue;
    }
    stripCredentials(value[key], seen);
  }
  if ('refreshToken' in value && isUserShaped(value)) delete value.refreshToken;
  return value;
}

@Injectable()
export class StripCredentialsInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => stripCredentials(data)));
  }
}
