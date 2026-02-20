
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../modules/users/users.service';
import { UserRole } from '../common/enums/user-role.enum';
import { getConnectionToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const usersService = app.get(UsersService);
    const dataSource = app.get<DataSource>(getConnectionToken());

    // Create Secretariat User
    const secretariatEmail = 'secretariat@example.com';
    const existingSecretariat = await usersService.findByEmail(secretariatEmail);

    if (!existingSecretariat) {
        console.log('Creating secretariat user...');

        // We need to manually insert because create method requires DTO structure
        // and might have other complexities. Simple insert is safer for script.
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash('password123', salt);

        await dataSource.query(`
      INSERT INTO "users" (
        "id", "email", "passwordHash", "firstName", "lastName", "role", "isActive", "createdAt", "updatedAt"
      ) VALUES (
        uuid_generate_v4(), $1, $2, 'Sarah', 'Secretariat', $3, true, NOW(), NOW()
      )
    `, [secretariatEmail, hashedPassword, UserRole.SECRETARIAT]);

        console.log(`Secretariat user created: ${secretariatEmail} / password123`);
    } else {
        console.log('Secretariat user already exists.');
    }

    // Create Manager User
    const managerEmail = 'manager@example.com';
    const existingManager = await usersService.findByEmail(managerEmail);

    if (!existingManager) {
        console.log('Creating manager user...');

        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash('password123', salt);

        await dataSource.query(`
      INSERT INTO "users" (
        "id", "email", "passwordHash", "firstName", "lastName", "role", "isActive", "createdAt", "updatedAt"
      ) VALUES (
        uuid_generate_v4(), $1, $2, 'Mike', 'Manager', $3, true, NOW(), NOW()
      )
    `, [managerEmail, hashedPassword, UserRole.MANAGER]);

        console.log(`Manager user created: ${managerEmail} / password123`);
    } else {
        console.log('Manager user already exists.');
    }

    await app.close();
}

bootstrap();
