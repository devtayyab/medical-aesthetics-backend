import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { Lead } from '../modules/crm/entities/lead.entity';
import { LeadStatus } from '../common/enums/lead-status.enum';
import * as fs from 'fs';
import { Logger } from '@nestjs/common';

const logger = new Logger('SyncCsvStatus');

const mapCsvStatus = (label: string): LeadStatus => {
  const s = label.trim();
  if (['Νέο Lead', 'Ενεργός Πελάτης'].includes(s)) return LeadStatus.NEW;
  if (['Μελλοντική Επικοινωνία', 'Ξ/Τ', 'Δ.Α', 'ΔΑΣΣ'].includes(s)) return LeadStatus.CONTACTED;
  if (['Κλεισμένο Ραντεβού', 'Δυσαρεστημένη'].includes(s)) return LeadStatus.QUALIFIED;
  if (['Θα το σκεφτεί', 'Άλλο'].includes(s)) return LeadStatus.FOLLOW_UP;
  if (['Δεν Ενδιαφερεται- Το Κλεινει', 'Επαρχία', 'Δεν θα ξαναπάει', 'Κακός Υποψήφιος Πελάτης', 'Άλλος Διαφημιστής', 'Άλλη Ανάγκη', 'Πολλαπλές Φόρμες'].includes(s)) return LeadStatus.LOST;
  
  return LeadStatus.NEW;
};

async function bootstrap() {
  logger.log('Starting CSV Status Sync...');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });
  const dataSource = app.get(DataSource);
  
  logger.log('Reading all-contacts.csv...');
  const lines = fs.readFileSync('all-contacts.csv', 'utf8').split('\n');
  const headers = lines[0].split('","');
  
  const idIndex = headers.findIndex(h => h.includes('Record ID'));
  const statusIndex = headers.findIndex(h => h.includes('Lead Status'));
  
  if (idIndex === -1 || statusIndex === -1) {
    logger.error('Could not find required columns in CSV!');
    process.exit(1);
  }

  const updates = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cols = lines[i].split('","');
    
    const recordId = cols[idIndex]?.replace(/"/g, '').trim();
    const csvStatus = cols[statusIndex]?.replace(/"/g, '').trim();
    
    if (recordId && csvStatus) {
      const mappedStatus = mapCsvStatus(csvStatus);
      updates.push({ hubspotId: recordId, status: mappedStatus });
    }
  }

  logger.log(`Found ${updates.length} valid records in CSV. Updating database...`);

  let updatedCount = 0;
  for (let i = 0; i < updates.length; i += 1000) {
    const chunk = updates.slice(i, i + 1000);
    
    // Construct a bulk UPDATE query using CASE statement for performance
    let query = `UPDATE leads SET status = CASE `;
    const ids = [];
    chunk.forEach(u => {
      query += `WHEN metadata->>'hubspotId' = '${u.hubspotId}' THEN '${u.status}' `;
      ids.push(`'${u.hubspotId}'`);
    });
    query += `END WHERE metadata->>'hubspotId' IN (${ids.join(',')})`;
    
    await dataSource.query(query);
    updatedCount += chunk.length;
    logger.log(`Updated ${updatedCount} / ${updates.length} leads...`);
  }

  logger.log('✅ CSV Status Sync Complete!');
  
  await app.close();
  process.exit(0);
}

bootstrap();
