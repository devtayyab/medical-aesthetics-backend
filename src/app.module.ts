import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { JwtModule } from '@nestjs/jwt';

// Config
import { DatabaseConfig } from './config/database.config';
import { AppController } from './app.controller';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CrmModule } from './modules/crm/crm.module';
import { ClinicsModule } from './modules/clinics/clinics.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { LoyaltyModule } from './modules/loyalty/loyalty.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuditModule } from './modules/audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfig,
    }),
    EventEmitterModule.forRoot(),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
      },
    }),
    ScheduleModule.forRoot(),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'medical-aesthetics-secret-key',
      signOptions: { expiresIn: '1d' },
    }),
    
    // Feature modules
    AuthModule,
    UsersModule,
    CrmModule,
    ClinicsModule,
    BookingsModule,
    TasksModule,
    LoyaltyModule,
    NotificationsModule,
    AdminModule,
    AuditModule,
  ],
  controllers: [AppController],
})
export class AppModule {}