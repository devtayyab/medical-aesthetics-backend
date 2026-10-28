import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

/**
 * Browsers may only send credentialed (cookie) requests from these origins.
 * CORS_ORIGINS: comma-separated list, e.g. "https://beautydoctors.gr,https://www.beautydoctors.gr".
 * Falls back to FRONTEND_URL, local dev servers and the Capacitor/WebView origins.
 */
function allowedOrigins(): string[] {
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

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Enforce @Exclude() on entities (passwordHash, refreshToken, etc.) in all responses.
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Security headers. The API serves uploaded images to the web app on another origin,
  // so resources must be loadable cross-origin; CSP is relaxed only for Swagger UI.
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          frameAncestors: ["'none'"],
          objectSrc: ["'none'"],
        },
      },
    }),
  );

  // Enable CORS. Auth uses cookies, so origins must be an explicit allow-list
  // (reflecting any origin with credentials would let any site call the API as the user).
  const origins = allowedOrigins();
  app.enableCors({
    origin: (origin, callback) => {
      // Non-browser clients (curl, server-to-server, native apps) send no Origin header.
      if (!origin || origins.includes(origin.replace(/\/$/, ''))) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // Set global prefix
  app.setGlobalPrefix('api', {
    exclude: ['health', '/'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      forbidNonWhitelisted: false, // Riverside: disabled strictly for compatibility during transition
    }),
  );

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Medical Aesthetics Platform API')
    .setDescription('Complete backend API for Medical Aesthetics Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('CRM', 'Lead and customer management')
    .addTag('Bookings', 'Appointment and availability management')
    .addTag('Tasks', 'Task management')
    .addTag('Loyalty', 'Loyalty program management')
    .addTag('Notifications', 'Notification system')
    .addTag('Admin', 'Administrative endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  const baseUrl = process.env.API_BASE_URL || `http://localhost:${port}`;
  console.log(`🚀 Medical Aesthetics Platform API running on port ${port}`);
  console.log(`📚 API Documentation: ${baseUrl}/api/docs`);
}

bootstrap();