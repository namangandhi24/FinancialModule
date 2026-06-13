import { buildAllowedOrigins } from './allowed-origins';

export default () => {
  const webUrl = process.env.WEB_URL || 'http://localhost:3000';
  const nodeEnv = process.env.NODE_ENV || 'development';

  return {
    port: parseInt(process.env.API_PORT || '3001', 10),
    nodeEnv,
    webUrl,
    apiUrl: process.env.API_URL || 'http://localhost:3001',
    allowedOrigins: buildAllowedOrigins(webUrl, process.env.ALLOWED_ORIGINS),
    jwt: {
      secret: process.env.JWT_SECRET || 'dev-secret-change-me',
      accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
      refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    },
    encryption: {
      key:
        process.env.ENCRYPTION_KEY ||
        (nodeEnv === 'production' ? '' : '0123456789abcdef0123456789abcdef'),
    },
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    },
    ollama: {
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    },
    ollamaModel: process.env.OLLAMA_MODEL || 'llama3.2',
    smtp: {
      host: process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
      from: process.env.SMTP_FROM || 'FinPilot AI <noreply@finpilot.ai>',
    },
  };
};
