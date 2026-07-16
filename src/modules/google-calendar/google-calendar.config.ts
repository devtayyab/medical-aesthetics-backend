import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Centralized access to Google Calendar env configuration.
 *
 * The whole feature is inert unless GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are
 * present, so the app is safe to deploy before Google credentials exist.
 */
@Injectable()
export class GoogleCalendarConfig {
  constructor(private readonly configService: ConfigService) {}

  get clientId(): string {
    return this.configService.get<string>('GOOGLE_CLIENT_ID');
  }

  get clientSecret(): string {
    return this.configService.get<string>('GOOGLE_CLIENT_SECRET');
  }

  get redirectUri(): string {
    return this.configService.get<string>('GOOGLE_OAUTH_REDIRECT_URI');
  }

  /** Public HTTPS URL Google posts push notifications to. */
  get webhookCallbackUrl(): string {
    return this.configService.get<string>('GOOGLE_WEBHOOK_CALLBACK_URL');
  }

  get scopes(): string[] {
    const raw = this.configService.get<string>(
      'GOOGLE_CALENDAR_SCOPES',
      'https://www.googleapis.com/auth/calendar',
    );
    return raw.split(/[\s,]+/).filter(Boolean);
  }

  /** Where to send the clinic owner's browser after OAuth completes. */
  get frontendUrl(): string {
    return (
      this.configService.get<string>('APP_FRONTEND_URL') ||
      this.configService.get<string>('API_BASE_URL') ||
      'http://localhost:3001'
    );
  }

  /** True when the minimum OAuth credentials are configured. */
  isEnabled(): boolean {
    return Boolean(this.clientId && this.clientSecret && this.redirectUri);
  }
}
