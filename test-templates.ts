
import { createConnection } from 'typeorm';
import { NotificationTemplate } from './src/modules/notifications/entities/notification-template.entity';
import { Notification } from './src/modules/notifications/entities/notification.entity';
import { User } from './src/modules/users/entities/user.entity';
import * as dotenv from 'dotenv';

dotenv.config();

async function test() {
  try {
    const connection = await createConnection({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [NotificationTemplate, Notification, User],
      synchronize: false,
    });

    console.log('Connected to DB');
    const repo = connection.getRepository(NotificationTemplate);
    const templates = await repo.find();
    console.log('Templates found:', templates.length);
    await connection.close();
  } catch (error) {
    console.error('Error fetching templates:', error);
  }
}

test();
