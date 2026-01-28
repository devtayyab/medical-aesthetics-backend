import { DataSource } from "typeorm";
import * as bcrypt from 'bcrypt';
import { User } from "../modules/users/entities/user.entity";
import { UserRole } from "../common/enums/user-role.enum";
import 'dotenv/config';

// Define minimal DataSource just for this script if needed, or import existing
import AppDataSource from "../config/data-source";

async function createAdmin() {
    try {
        await AppDataSource.initialize();
        console.log("Database connected!");

        const userRepository = AppDataSource.getRepository(User);

        const existingAdmin = await userRepository.findOne({ where: { email: 'admin@example.com' } });
        if (existingAdmin) {
            console.log("Admin user 'admin@example.com' already exists.");
            return;
        }

        const hashedPassword = await bcrypt.hash('Admin123!', 10);

        const admin = userRepository.create({
            email: 'admin@example.com',
            passwordHash: hashedPassword,
            firstName: 'System',
            lastName: 'Admin',
            role: UserRole.ADMIN,
            isActive: true
        });

        await userRepository.save(admin);
        console.log("Admin user created successfully!");
        console.log("Email: admin@example.com");
        console.log("Password: Admin123!");

    } catch (error) {
        console.error("Error creating admin:", error);
    } finally {
        await AppDataSource.destroy();
    }
}

createAdmin();
