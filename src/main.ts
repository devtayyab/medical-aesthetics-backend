import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: true,
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
      forbidNonWhitelisted: false,
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