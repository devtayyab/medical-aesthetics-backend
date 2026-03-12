import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function seedTestData() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/medical_aesthetics'
  });
  await client.connect();

  try {
      const joiya = await client.query("SELECT id FROM clinics WHERE name ILIKE '%Joiya%' LIMIT 1");
      if (joiya.rows.length === 0) {
          console.error("Joiya Clinic not found. Please create it first or check the name.");
          return;
      }
      const clinicId = joiya.rows[0].id;
      console.log(`Found Clinic: Joiya (ID: ${clinicId})`);

      // 1. Create/Find Category
      let cat = await client.query("SELECT id FROM treatment_categories WHERE name = 'Botox' LIMIT 1");
      let catId;
      if (cat.rows.length === 0) {
          const res = await client.query("INSERT INTO treatment_categories (name, description, status, \"isActive\") VALUES ('Botox', 'Botox Treatments', 'approved', true) RETURNING id");
          catId = res.rows[0].id;
          console.log(`Created Category: Botox (ID: ${catId})`);
      } else {
          catId = cat.rows[0].id;
          await client.query("UPDATE treatment_categories SET status = 'approved', \"isActive\" = true WHERE id = $1", [catId]);
      }

      // 2. Create/Find Treatment
      let treat = await client.query("SELECT id FROM treatments WHERE name = 'Botox Face' LIMIT 1");
      let treatId;
      if (treat.rows.length === 0) {
          const res = await client.query("INSERT INTO treatments (name, \"shortDescription\", \"fullDescription\", category, \"categoryId\", status, \"isActive\") VALUES ('Botox Face', 'Basic face botox', 'Complete face botox treatment', 'Botox', $1, 'approved', true) RETURNING id", [catId]);
          treatId = res.rows[0].id;
          console.log(`Created Treatment: Botox Face (ID: ${treatId})`);
      } else {
          treatId = treat.rows[0].id;
          await client.query("UPDATE treatments SET status = 'approved', \"isActive\" = true, \"categoryId\" = $2 WHERE id = $1", [treatId, catId]);
      }

      // 3. Create/Find Service (Clinic Offering)
      let service = await client.query("SELECT id FROM services WHERE \"clinicId\" = $1 AND \"treatmentId\" = $2 LIMIT 1", [clinicId, treatId]);
      if (service.rows.length === 0) {
          const res = await client.query("INSERT INTO services (\"clinicId\", \"treatmentId\", price, duration, \"isActive\") VALUES ($1, $2, 150.00, 30, true) RETURNING id", [clinicId, treatId]);
          console.log(`Created Service: Botox Face Offering (ID: ${res.rows[0].id})`);
      } else {
          await client.query("UPDATE services SET \"isActive\" = true WHERE id = $1", [service.rows[0].id]);
          console.log("Updated existing service to active.");
      }

      console.log("\nSuccess! Data seeded. Now check the clinic page.");

  } finally {
      await client.end();
  }
}

seedTestData().catch(console.error);
