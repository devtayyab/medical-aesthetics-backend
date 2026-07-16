import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * AES-256-GCM encryption for OAuth tokens at rest.
 *
 * The key comes from GOOGLE_TOKEN_ENC_KEY. It accepts either a 64-char hex
 * string (32 bytes) or a base64 string decoding to 32 bytes. Stored format is
 * `v1:<ivB64>:<tagB64>:<cipherB64>` so the scheme can evolve later.
 */
@Injectable()
export class TokenCryptoService {
  private readonly logger = new Logger(TokenCryptoService.name);
  private readonly algorithm = 'aes-256-gcm';
  private key: Buffer | null = null;

  constructor(private readonly configService: ConfigService) {}

  private getKey(): Buffer {
    if (this.key) return this.key;

    const raw = this.configService.get<string>('GOOGLE_TOKEN_ENC_KEY');
    if (!raw) {
      throw new InternalServerErrorException(
        'GOOGLE_TOKEN_ENC_KEY is not configured — cannot encrypt Google tokens',
      );
    }

    let buf: Buffer;
    if (/^[0-9a-fA-F]{64}$/.test(raw)) {
      buf = Buffer.from(raw, 'hex');
    } else {
      buf = Buffer.from(raw, 'base64');
    }

    if (buf.length !== 32) {
      throw new InternalServerErrorException(
        'GOOGLE_TOKEN_ENC_KEY must decode to 32 bytes (use `openssl rand -hex 32`)',
      );
    }

    this.key = buf;
    return buf;
  }

  /** Returns true when a usable encryption key is configured. */
  isConfigured(): boolean {
    try {
      this.getKey();
      return true;
    } catch {
      return false;
    }
  }

  encrypt(plaintext: string): string {
    if (plaintext == null) return null;
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.algorithm, this.getKey(), iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
  }

  decrypt(payload: string): string | null {
    if (!payload) return null;
    try {
      const parts = payload.split(':');
      if (parts.length !== 4 || parts[0] !== 'v1') {
        throw new Error('Unrecognized ciphertext format');
      }
      const iv = Buffer.from(parts[1], 'base64');
      const tag = Buffer.from(parts[2], 'base64');
      const encrypted = Buffer.from(parts[3], 'base64');
      const decipher = crypto.createDecipheriv(this.algorithm, this.getKey(), iv);
      decipher.setAuthTag(tag);
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);
      return decrypted.toString('utf8');
    } catch (err) {
      this.logger.error(`Failed to decrypt token: ${err.message}`);
      return null;
    }
  }
}
