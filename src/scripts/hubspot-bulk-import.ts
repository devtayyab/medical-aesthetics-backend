import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { Lead } from '../modules/crm/entities/lead.entity';
import { LeadStatus } from '../common/enums/lead-status.enum';
import axios from 'axios';
import * as dotenv from 'dotenv';
import { Logger } from '@nestjs/common';

dotenv.config();

const logger = new Logger('HubSpotBulkImport');

// Map HubSpot statuses to our LeadStatus
const mapHubSpotStatus = (status: string | undefined | null, lifecycle: string | undefined | null): LeadStatus => {
  // 1. Check explicit Lead Statuses first (they are more accurate)
  const s = status?.toUpperCase() || '';
  if (['UNQUALIFIED', 'BAD_TIMING', 'ΔΕΝ ΘΑ ΞΑΝΑΠΆΕΙ', 'ΚΑΚΌΣ ΥΠΟΨΉΦΙΟΣ ΠΕΛΆΤΗΣ', 'ΆΛΛΟΣ ΔΙΑΦΗΜΙΣΤΉΣ', 'ΆΛΛΗ ΑΝΆΓΚΗ', 'ΠΟΛΛΑΠΛΈΣ ΦΌΡΜΕΣ'].includes(s)) return LeadStatus.LOST;
  if (['CONNECTED', 'OPEN_DEAL'].includes(s)) return LeadStatus.QUALIFIED;
  if (['ATTEMPTED_TO_CONTACT', 'CONTACTED', 'IN_PROGRESS', 'Δ.Α', 'ΔΑΣΣ'].includes(s)) return LeadStatus.CONTACTED;
  if (['ΘΑ ΤΟ ΣΚΕΦΤΕΊ', 'ΆΛΛΟ'].includes(s)) return LeadStatus.FOLLOW_UP;

  // 2. Fallback to Lifecycle Stage if status is empty/new
  const l = lifecycle?.toLowerCase() || '';
  if (['customer', 'evangelist'].includes(l)) return LeadStatus.CONVERTED;
  if (l === 'opportunity') return LeadStatus.FOLLOW_UP;
  if (['marketingqualifiedlead', 'salesqualifiedlead'].includes(l)) return LeadStatus.QUALIFIED;
  if (l === 'other') return LeadStatus.LOST;

  return LeadStatus.NEW; // default
};

async function bootstrap() {
  logger.log('Starting NestJS Application Context for Bulk Import...');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });
  
  const dataSource = app.get(DataSource);
  const leadsRepository = dataSource.getRepository(Lead);
  
  const hubspotToken = process.env.HUBSPOT_API_TOKEN;
  if (!hubspotToken) {
    logger.error('HUBSPOT_API_TOKEN is missing in .env!');
    process.exit(1);
  }
  
  logger.warn('WARNING: TRUNCATING LEADS TABLE IN 5 SECONDS...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  try {
    logger.warn('Truncating leads and dependent tables...');
    await dataSource.query('TRUNCATE TABLE leads CASCADE;');
    logger.log('Leads table successfully truncated!');
  } catch (error) {
    logger.error(`Error truncating table: ${error.message}`);
    process.exit(1);
  }

  logger.log('Fetching contacts from HubSpot API...');
  
  let hasMore = true;
  let afterToken: string | undefined = undefined;
  let totalFetched = 0;
  
  // Properties we want to fetch
  const properties = [
    'email', 
    'firstname', 
    'lastname', 
    'phone', 
    'createdate', 
    'hs_lead_status', 
    'lifecyclestage', 
    'hs_analytics_source', 
    'notes_last_contacted'
  ].join(',');

  while (hasMore) {
    try {
      const url = `https://api.hubapi.com/crm/v3/objects/contacts`;
      const params: any = {
        limit: 100,
        properties: properties,
      };
      
      if (afterToken) {
        params.after = afterToken;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${hubspotToken}` },
        params,
      });

      const results = response.data.results || [];
      const paging = response.data.paging;
      
      if (results.length > 0) {
        // Map HubSpot contacts to local Lead entities
        const newLeads = results.map(contact => {
          const props = contact.properties;
          const hubspotSource = props.hs_analytics_source || 'hubspot_import';
          const mappedSource = (hubspotSource.toLowerCase().includes('paid_social') || hubspotSource.toLowerCase().includes('facebook')) 
            ? 'facebook_ads' 
            : hubspotSource;

          return leadsRepository.create({
            firstName: props.firstname || 'Unknown',
            lastName: props.lastname || 'Lead',
            email: props.email || `${contact.id}@noemail.hubspot.com`, // enforce unique
            phone: props.phone || null,
            status: mapHubSpotStatus(props.hs_lead_status, props.lifecyclestage),
            source: mappedSource,
            createdAt: props.createdate ? new Date(props.createdate) : new Date(),
            lastContactedAt: props.notes_last_contacted ? new Date(props.notes_last_contacted) : null,
            metadata: { hubspotId: contact.id }
          });
        });

        // Batch Insert for performance
        await leadsRepository.insert(newLeads);
        totalFetched += newLeads.length;
        
        logger.log(`Imported ${totalFetched} leads so far...`);
      }

      if (paging && paging.next && paging.next.after) {
        afterToken = paging.next.after;
        hasMore = true;
      } else {
        hasMore = false;
        afterToken = undefined;
      }
      
      // Delay to avoid HubSpot rate limits (100 requests per 10 seconds standard)
      await new Promise(resolve => setTimeout(resolve, 200)); 

    } catch (error) {
      logger.error(`Error fetching from HubSpot: ${error.message}`);
      if (error.response) {
        logger.error(JSON.stringify(error.response.data));
      }
      break;
    }
  }

  logger.log(`✅ Bulk Import Complete! Total Leads Imported: ${totalFetched}`);
  
  await app.close();
  process.exit(0);
}

bootstrap();
