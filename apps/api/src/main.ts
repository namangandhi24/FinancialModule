import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Use the core querystring parser — avoids qs/extended parser crashes on some requests.
  const expressApp = app.getHttpAdapter().getInstance();
  if (typeof expressApp.set === 'function') {
    expressApp.set('query parser', 'simple');
  }

  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: (origin, callback) => {
      const allowed = [
        configService.get<string>('webUrl'),
        'http://localhost:3000',
        'http://127.0.0.1:3000',
      ].filter(Boolean);

      // Allow non-browser clients (curl, server-side) and known web origins
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  });

  const port = configService.get<number>('port') || 3001;

  app.getHttpAdapter().get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  await app.listen(port);
  console.log(`FinPilot API running on http://localhost:${port}`);
}

bootstrap();
