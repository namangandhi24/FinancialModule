const VERCEL_APP_PATTERN =
  /^https:\/\/finpilot-web(-[a-z0-9-]+)*\.vercel\.app$/;

export function isAllowedOrigin(origin: string, allowed: string[]): boolean {
  if (allowed.includes(origin)) {
    return true;
  }
  return VERCEL_APP_PATTERN.test(origin);
}

export function buildAllowedOrigins(webUrl: string, extra?: string): string[] {
  const origins = new Set<string>([
    webUrl,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ]);

  if (extra) {
    for (const item of extra.split(',')) {
      const trimmed = item.trim();
      if (trimmed) origins.add(trimmed);
    }
  }

  return [...origins];
}

export function validateProductionSecrets(config: {
  nodeEnv: string;
  jwtSecret: string;
  encryptionKey: string;
}): void {
  if (config.nodeEnv !== 'production') {
    return;
  }

  const weakJwtSecrets = new Set([
    'dev-secret-change-me',
    'change-me-in-production-use-long-random-string',
  ]);

  if (!config.jwtSecret || config.jwtSecret.length < 32 || weakJwtSecrets.has(config.jwtSecret)) {
    throw new Error(
      'JWT_SECRET must be a unique random string of at least 32 characters in production',
    );
  }

  if (!config.encryptionKey || config.encryptionKey.length < 32) {
    throw new Error(
      'ENCRYPTION_KEY must be set in production (64-char hex or 44-char base64 encoding 32 bytes)',
    );
  }
}
