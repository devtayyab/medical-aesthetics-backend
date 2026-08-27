import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';

const logger = new Logger('DeduplicateLeads');

async function bootstrap() {
  logger.log('Starting deduplication of leads...');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });
  const dataSource = app.get(DataSource);
  
  // Find all emails that have more than 1 lead
  const duplicates = await dataSource.query(`
    SELECT email, COUNT(*) as count
    FROM leads
    WHERE email IS NOT NULL AND email != '' AND email NOT LIKE '%@noemail.hubspot.com'
    GROUP BY email
    HAVING COUNT(*) > 1
  `);

  logger.log(`Found ${duplicates.length} emails with duplicate leads.`);

  let removedCount = 0;

  for (const dup of duplicates) {
    const email = dup.email;
    
    // Get all leads for this email, ordered by created date DESC (keep newest)
    const leads = await dataSource.query(`
      SELECT id, "createdAt", "facebookLeadId", "facebookAdName", "lastMetaFormName"
      FROM leads
      WHERE email = $1
      ORDER BY "createdAt" DESC
    `, [email]);

    // Keep the first one, delete the rest
    const keepId = leads[0].id;
    const deleteIds = leads.slice(1).map((l: any) => l.id);

    if (deleteIds.length > 0) {
      await dataSource.query(`DELETE FROM leads WHERE id = ANY($1)`, [deleteIds]);
      removedCount += deleteIds.length;
      logger.log(`Merged ${deleteIds.length} duplicates for email: ${email}`);
    }
  }

  // Also deduplicate by phone if needed (where email is null)
  const phoneDuplicates = await dataSource.query(`
    SELECT phone, COUNT(*) as count
    FROM leads
    WHERE (email IS NULL OR email = '' OR email LIKE '%@noemail.hubspot.com') 
      AND phone IS NOT NULL AND phone != ''
    GROUP BY phone
    HAVING COUNT(*) > 1
  `);

  logger.log(`Found ${phoneDuplicates.length} phones with duplicate leads (no email).`);

  for (const dup of phoneDuplicates) {
    const phone = dup.phone;
    
    const leads = await dataSource.query(`
      SELECT id
      FROM leads
      WHERE phone = $1 AND (email IS NULL OR email = '' OR email LIKE '%@noemail.hubspot.com')
      ORDER BY "createdAt" DESC
    `, [phone]);

    const keepId = leads[0].id;
    const deleteIds = leads.slice(1).map((l: any) => l.id);

    if (deleteIds.length > 0) {
      await dataSource.query(`DELETE FROM leads WHERE id = ANY($1)`, [deleteIds]);
      removedCount += deleteIds.length;
      logger.log(`Merged ${deleteIds.length} duplicates for phone: ${phone}`);
    }
  }

  logger.log(`✅ Deduplication complete! Removed ${removedCount} duplicate records.`);
  
  await app.close();
  process.exit(0);
}

bootstrap();
