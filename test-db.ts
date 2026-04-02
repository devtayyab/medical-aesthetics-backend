import 'reflect-metadata';
import { createConnection } from 'typeorm';

async function test() {
  console.log("Connecting to Postgres...");
  const connection = await createConnection({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'medical_aesthetics',
    entities: [__dirname + '/src/**/*.entity{.ts,.js}'],
  });

  const actionsRepo = connection.getRepository('CrmAction');
  const customersRepo = connection.getRepository('CustomerRecord');

  const customer = await customersRepo.findOne({ select: ['id', 'customerId'] });
  console.log("Found CustomerRecord:", customer);

  if (customer) {
    try { 
      const newAction = actionsRepo.create({
        customerId: customer.id,
        salespersonId: customer.customerId || 'some-id',
        title: 'Test Task',
        actionType: 'call',
        dueDate: new Date(),
        reminderDate: new Date()
      });
      await actionsRepo.save(newAction);
      console.log("Successfully saved action with customer.id!");
    } catch (e) {
      console.error("Failed to save action with customer.id:", e.message, e.detail);
    }

    try {
      const newAction2 = actionsRepo.create({
        customerId: customer.customerId,
        salespersonId: customer.customerId || 'some-id',
        title: 'Test Task 2',
        actionType: 'call',
        dueDate: new Date(),
        reminderDate: new Date()
      });
      await actionsRepo.save(newAction2);
      console.log("Successfully saved action with customer.customerId (User ID)!");
    } catch (e) {
      console.error("Failed to save action with customer.customerId:", e.message, e.detail);
    }
  }

  await connection.close();
}
test().catch(console.error);
