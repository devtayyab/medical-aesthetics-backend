import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();
const ds = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'medical_aesthetics'
});
ds.initialize().then(async () => {
  const query = `
    SELECT 
      rec."assignedSalespersonId",
      COUNT(apt.id) as total,
      COUNT(CASE WHEN apt.status = 'completed' THEN 1 END) as completed,
      COUNT(CASE WHEN apt.status = 'confirmed' THEN 1 END) as confirmed,
      COUNT(CASE WHEN apt.status = 'pending' THEN 1 END) as pending,
      SUM(CASE WHEN apt.status IN ('completed', 'confirmed') THEN COALESCE(apt."totalAmount", 0) ELSE 0 END) as revenue
    FROM appointments apt
    INNER JOIN customer_records rec ON rec."customerId" = apt."clientId"
    GROUP BY rec."assignedSalespersonId";
  `;
  const res = await ds.query(query);
  console.log(res);
  
  const aptsWithoutRec = await ds.query(`
    SELECT status, COUNT(*) 
    FROM appointments apt 
    LEFT JOIN customer_records rec ON rec."customerId" = apt."clientId"
    WHERE rec."customerId" IS NULL
    GROUP BY status
  `);
  console.log('Appointments without customer_records:', aptsWithoutRec);

  process.exit(0);
}).catch(console.error);
