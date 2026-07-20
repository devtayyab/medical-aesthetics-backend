import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { google } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';
import { GoogleCalendarConfig } from '../google-calendar.config';
import { TokenCryptoService } from './token-crypto.service';
import { ClinicCalendarConnection } from '../entities/clinic-calendar-connection.entity';

export interface OAuthStatePayload {
  clinicId: string;
  userId: string;
}

export interface ExchangedTokens {
  refreshToken: string | null;
  accessToken: string | null;
  expiryDate: Date | null;
}

/**
 * Owns everything about talking to Google's OAuth endpoints: building the
 * consent URL, exchanging the authorization code, constructing an authenticated
 * OAuth2 client that transparently refreshes (and re-persists) access tokens,
 * and revoking access on disconnect.
 */
@Injectable()
export class GoogleOAuthService {
  private readonly logger = new Logger(GoogleOAuthService.name);

  constructor(
    private readonly config: GoogleCalendarConfig,
    private readonly tokenCrypto: TokenCryptoService,
    private readonly jwtService: JwtService,
  ) {}

  private newClient(): OAuth2Client {
    return new google.auth.OAuth2(
      this.config.clientId,
      this.config.clientSecret,
      this.config.redirectUri,
    );
  }

  /** Signs a short-lived, tamper-proof `state` param carrying clinic + user. */
  signState(payload: OAuthStatePayload): string {
    return this.jwtService.sign(
      { ...payload, purpose: 'gcal_oauth' },
      { expiresIn: '15m' },
    );
  }

  verifyState(state: string): OAuthStatePayload {
    try {
      const decoded = this.jwtService.verify(state);
      if (decoded?.purpose !== 'gcal_oauth') {
        throw new Error('Wrong token purpose');
      }
      return { clinicId: decoded.clinicId, userId: decoded.userId };
    } catch (err) {
      throw new BadRequestException('Invalid or expired OAuth state');
    }
  }

  /** Google consent screen URL. offline + prompt=consent guarantees a refresh token. */
  buildConsentUrl(state: string): string {
    const client = this.newClient();
    return client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: true,
      scope: this.config.scopes,
      state,
    });
  }

  async exchangeCode(code: string): Promise<ExchangedTokens> {
    const client = this.newClient();
    const { tokens } = await client.getToken(code);
    return {
      refreshToken: tokens.refresh_token ?? null,
      accessToken: tokens.access_token ?? null,
      expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    };
  }

  /**
   * Builds an OAuth2 client bound to a stored connection. Decrypts tokens, and
   * registers a `tokens` listener so refreshed access tokens (and any rotated
   * refresh token) are re-encrypted and persisted via the provided callback.
   */
  buildClientForConnection(
    connection: ClinicCalendarConnection,
    persist: (patch: Partial<ClinicCalendarConnection>) => Promise<void>,
  ): OAuth2Client {
    const client = this.newClient();
    const refreshToken = this.tokenCrypto.decrypt(connection.refreshTokenEnc);
    const accessToken = this.tokenCrypto.decrypt(connection.accessTokenEnc);

    client.setCredentials({
      refresh_token: refreshToken ?? undefined,
      access_token: accessToken ?? undefined,
      expiry_date: connection.tokenExpiry ? connection.tokenExpiry.getTime() : undefined,
    });

    client.on('tokens', (tokens) => {
      const patch: Partial<ClinicCalendarConnection> = {};
      if (tokens.access_token) {
        patch.accessTokenEnc = this.tokenCrypto.encrypt(tokens.access_token);
      }
      if (tokens.expiry_date) {
        patch.tokenExpiry = new Date(tokens.expiry_date);
      }
      if (tokens.refresh_token) {
        patch.refreshTokenEnc = this.tokenCrypto.encrypt(tokens.refresh_token);
      }
      if (Object.keys(patch).length) {
        persist(patch).catch((err) =>
          this.logger.error(`Failed to persist refreshed tokens: ${err.message}`),
        );
      }
    });

    return client;
  }

  async revokeToken(refreshToken: string): Promise<void> {
    if (!refreshToken) return;
    try {
      const client = this.newClient();
      await client.revokeToken(refreshToken);
    } catch (err) {
      // Non-fatal: token may already be invalid/expired on Google's side.
      this.logger.warn(`Token revoke failed (ignored): ${err.message}`);
    }
  }
}
