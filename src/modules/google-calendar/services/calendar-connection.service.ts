import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { google, calendar_v3 } from 'googleapis';
import { ClinicCalendarConnection } from '../entities/clinic-calendar-connection.entity';
import { GoogleOAuthService, ExchangedTokens } from './google-oauth.service';
import { TokenCryptoService } from './token-crypto.service';

/**
 * Persistence + lifecycle for per-clinic calendar connections, and the factory
 * that hands out an authenticated Google Calendar API client for a connection.
 */
@Injectable()
export class CalendarConnectionService {
  private readonly logger = new Logger(CalendarConnectionService.name);

  constructor(
    @InjectRepository(ClinicCalendarConnection)
    private readonly repo: Repository<ClinicCalendarConnection>,
    private readonly oauthService: GoogleOAuthService,
    private readonly tokenCrypto: TokenCryptoService,
  ) {}

  findByClinicId(clinicId: string): Promise<ClinicCalendarConnection | null> {
    return this.repo.findOne({ where: { clinicId } });
  }

  findById(id: string): Promise<ClinicCalendarConnection | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByWatchChannelId(
    channelId: string,
  ): Promise<ClinicCalendarConnection | null> {
    return this.repo.findOne({ where: { watchChannelId: channelId } });
  }

  /** Active connections with sync enabled — used by polling/renewal crons. */
  findActive(): Promise<ClinicCalendarConnection[]> {
    return this.repo.find({ where: { status: 'connected', syncEnabled: true } });
  }

  /** Connections whose watch channel expires before `before`. */
  findWatchesExpiringBefore(before: Date): Promise<ClinicCalendarConnection[]> {
    return this.repo.find({
      where: { status: 'connected', syncEnabled: true, watchExpiration: LessThan(before) },
    });
  }

  async update(
    id: string,
    patch: Partial<ClinicCalendarConnection>,
  ): Promise<void> {
    await this.repo.update(id, patch);
  }

  /** Create or replace the connection for a clinic from freshly exchanged tokens. */
  async upsertFromTokens(
    clinicId: string,
    tokens: ExchangedTokens,
    existing?: ClinicCalendarConnection | null,
  ): Promise<ClinicCalendarConnection> {
    const entity = existing ?? this.repo.create({ clinicId, provider: 'google' });

    // A re-consent may omit the refresh token if the user already granted it;
    // keep the previously stored one in that case.
    if (tokens.refreshToken) {
      entity.refreshTokenEnc = this.tokenCrypto.encrypt(tokens.refreshToken);
    }
    if (tokens.accessToken) {
      entity.accessTokenEnc = this.tokenCrypto.encrypt(tokens.accessToken);
    }
    entity.tokenExpiry = tokens.expiryDate ?? entity.tokenExpiry;
    entity.status = 'connected';
    entity.syncEnabled = true;
    entity.lastError = null;

    return this.repo.save(entity);
  }

  async markError(id: string, message: string): Promise<void> {
    await this.repo.update(id, {
      status: 'error',
      lastError: message?.slice(0, 1000),
    });
  }

  async markSynced(id: string, syncToken?: string): Promise<void> {
    const patch: Partial<ClinicCalendarConnection> = { lastSyncedAt: new Date() };
    if (syncToken) patch.syncToken = syncToken;
    await this.repo.update(id, patch);
  }

  /**
   * Builds an authenticated Calendar v3 client for a connection. The underlying
   * OAuth client auto-refreshes access tokens and persists them back to this row.
   */
  getCalendarClient(
    connection: ClinicCalendarConnection,
  ): calendar_v3.Calendar {
    const authClient = this.oauthService.buildClientForConnection(
      connection,
      (patch) => this.update(connection.id, patch),
    );
    return google.calendar({ version: 'v3', auth: authClient });
  }

  /** Full teardown of a clinic's connection (revokes token, deletes the row). */
  async disconnect(connection: ClinicCalendarConnection): Promise<void> {
    const refreshToken = this.tokenCrypto.decrypt(connection.refreshTokenEnc);
    if (refreshToken) {
      await this.oauthService.revokeToken(refreshToken);
    }
    await this.repo.delete(connection.id);
  }
}
