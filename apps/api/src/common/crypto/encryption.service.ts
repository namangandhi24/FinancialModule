import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const PREFIX = 'enc:v1:';

@Injectable()
export class EncryptionService implements OnModuleInit {
  private key!: Buffer;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const raw = this.configService.get<string>('encryption.key');
    if (!raw) {
      throw new Error('ENCRYPTION_KEY is required');
    }

    this.key = this.parseKey(raw);

    if (this.key.length !== 32) {
      throw new Error('ENCRYPTION_KEY must decode to exactly 32 bytes');
    }
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return [
      PREFIX,
      iv.toString('base64url'),
      authTag.toString('base64url'),
      encrypted.toString('base64url'),
    ].join('');
  }

  decrypt(payload: string): string {
    if (!payload.startsWith(PREFIX)) {
      throw new Error('Unsupported ciphertext format');
    }

    const parts = payload.slice(PREFIX.length).split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid ciphertext');
    }

    const [ivB64, tagB64, dataB64] = parts;
    const iv = Buffer.from(ivB64, 'base64url');
    const authTag = Buffer.from(tagB64, 'base64url');
    const encrypted = Buffer.from(dataB64, 'base64url');

    const decipher = createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  }

  /** Supports legacy plaintext values during migration. */
  decryptIfEncrypted(value: string): string {
    if (value.startsWith(PREFIX)) {
      return this.decrypt(value);
    }
    return value;
  }

  private parseKey(raw: string): Buffer {
    const trimmed = raw.trim();
    if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
      return Buffer.from(trimmed, 'hex');
    }
    return Buffer.from(trimmed, 'base64');
  }
}
