import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Lead } from '../modules/crm/entities/lead.entity';
import { HubspotService } from '../modules/hubspot/hubspot.service';
import { Repository } from 'typeorm';

async function bootstrap() {
  console.log('Starting NestJS Application Context for Script...');
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const leadRepository = app.get<Repository<Lead>>(getRepositoryToken(Lead));
  const hubspotService = app.get(HubspotService);

  const leads = await leadRepository.find();
  console.log(`Found ${leads.length} leads in the local database.`);

  let updatedCount = 0;
  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];
    console.log(`[${i + 1}/${leads.length}] Processing lead ${lead.id} (${lead.firstName} ${lead.lastName})...`);
    
    try {
      if (!lead.email && !lead.phone) {
        console.log(`  -> Skipping: No email or phone number to search in HubSpot.`);
        continue;
      }
      const contacts = await hubspotService.searchContact(lead.email, lead.phone);
      if (contacts && contacts.length > 0) {
        // Find the oldest createdate from all matching Hubspot contacts
        let oldestDate: Date | null = null;
        
        for (const contact of contacts) {
          const createDateStr = contact.properties.createdate || contact.createdAt;
          if (createDateStr) {
            const date = new Date(createDateStr);
            if (!oldestDate || date < oldestDate) {
              oldestDate = date;
            }
          }
        }
        
        // Only update if we found a valid date from Hubspot and it's older than our DB date
        // OR if the DB date is exactly August 19 (the date of import), let's just use Hubspot's date to be safe.
        if (oldestDate) {
          // Check if difference is more than 1 day to avoid unnecessary updates
          const diffHours = Math.abs(lead.createdAt.getTime() - oldestDate.getTime()) / (1000 * 60 * 60);
          if (diffHours > 24 && oldestDate < lead.createdAt) {
            console.log(`  -> UPDATING: Changing createdAt from ${lead.createdAt.toISOString()} to ${oldestDate.toISOString()}`);
            lead.createdAt = oldestDate;
            await leadRepository.save(lead);
            updatedCount++;
          } else {
            console.log(`  -> Skipping: Date is already roughly matching or older in DB (${lead.createdAt.toISOString()}) vs HubSpot (${oldestDate.toISOString()})`);
          }
        } else {
            console.log(`  -> Skipping: No createdate found in HubSpot.`);
        }
      } else {
          console.log(`  -> Skipping: Not found in HubSpot.`);
      }
    } catch (e) {
      console.error(`  -> ERROR processing lead ${lead.id}: ${e.message}`);
    }
  }

  console.log(`\n================================`);
  console.log(`Successfully updated ${updatedCount} leads' creation dates from HubSpot.`);
  console.log(`================================\n`);
  
  await app.close();
}

bootstrap().catch(err => {
    console.error(err);
    process.exit(1);
});
