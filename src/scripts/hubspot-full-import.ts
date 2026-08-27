import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { Lead } from '../modules/crm/entities/lead.entity';
import { LeadStatus } from '../common/enums/lead-status.enum';
import { Logger } from '@nestjs/common';
import axios from 'axios';

const logger = new Logger('HubSpotFullImport');
const HUBSPOT_TOKEN = 'pat-na1-' + '0636c4c1-d343-4cf5-9908-1b5733ce051d';

const mapHubSpotStatus = (status?: string, lifecycle?: string): LeadStatus => {
  const s = (status || '').toUpperCase().trim();
  if (['UNQUALIFIED', 'BAD_TIMING', 'ΔΕΝ ΘΑ ΞΑΝΑΠΆΕΙ', 'ΚΑΚΌΣ ΥΠΟΨΉΦΙΟΣ ΠΕΛΆΤΗΣ', 'ΆΛΛΟΣ ΔΙΑΦΗΜΙΣΤΉΣ', 'ΆΛΛΗ ΑΝΆΓΚΗ', 'ΠΟΛΛΑΠΛΈΣ ΦΌΡΜΕΣ'].includes(s)) return LeadStatus.LOST;
  if (['CONNECTED', 'OPEN_DEAL'].includes(s)) return LeadStatus.QUALIFIED;
  if (['ATTEMPTED_TO_CONTACT', 'CONTACTED', 'IN_PROGRESS', 'Δ.Α', 'ΔΑΣΣ'].includes(s)) return LeadStatus.CONTACTED;
  if (['ΘΑ ΤΟ ΣΚΕΦΤΕΊ', 'ΆΛΛΟ'].includes(s)) return LeadStatus.FOLLOW_UP;

  const l = (lifecycle || '').toLowerCase().trim();
  if (['customer', 'evangelist'].includes(l)) return LeadStatus.CONVERTED;
  if (l === 'opportunity') return LeadStatus.FOLLOW_UP;
  if (['marketingqualifiedlead', 'salesqualifiedlead'].includes(l)) return LeadStatus.QUALIFIED;
  if (l === 'other') return LeadStatus.LOST;

  return LeadStatus.NEW;
};

async function bootstrap() {
  logger.log('Starting FULL IMPORT from HubSpot...');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });
  const dataSource = app.get(DataSource);
  const leadsRepository = dataSource.getRepository(Lead);

  logger.warn('TRUNCATING LEADS TABLE...');
  await dataSource.query('TRUNCATE TABLE leads CASCADE');
  logger.log('Table Truncated!');

  let hasMore = true;
  let afterToken: string | undefined = undefined;
  let totalFetched = 0;

  const properties = [
    'email', 
    'firstname', 
    'lastname', 
    'phone', 
    'createdate', 
    'hs_lead_status', 
    'lifecyclestage', 
    'hs_analytics_source', 
    'notes_last_contacted',
    'hs_analytics_source_data_1',
    'hs_analytics_source_data_2',
    'hs_facebook_ad_id',
    'hs_facebook_campaign_id'
  ].join(',');

  while (hasMore) {
    try {
      const url = `https://api.hubapi.com/crm/v3/objects/contacts`;
      const params: any = {
        limit: 100,
        properties: properties,
      };
      if (afterToken) params.after = afterToken;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${HUBSPOT_TOKEN}` },
        params,
      });

      const results = response.data.results || [];
      const paging = response.data.paging;

      if (results.length > 0) {
        const newLeads = results.map(contact => {
          const props = contact.properties;
          const hubspotSource = props.hs_analytics_source || 'hubspot_import';
          
          const isFacebook = hubspotSource.toLowerCase().includes('paid_social') || hubspotSource.toLowerCase().includes('facebook');
          const mappedSource = isFacebook ? 'facebook_ads' : hubspotSource;
          
          const adName = props.hs_analytics_source_data_2 || props.hs_analytics_source_data_1 || null;
          const creationDate = props.createdate ? new Date(props.createdate) : new Date();

          return leadsRepository.create({
            firstName: props.firstname || 'Unknown',
            lastName: props.lastname || 'Lead',
            email: props.email || `${contact.id}@noemail.hubspot.com`,
            phone: props.phone || null,
            status: mapHubSpotStatus(props.hs_lead_status, props.lifecyclestage),
            source: mappedSource,
            
            facebookAdName: isFacebook ? adName : null,
            lastMetaFormName: isFacebook ? adName : null,
            facebookAdId: props.hs_facebook_ad_id || null,
            facebookCampaignId: props.hs_facebook_campaign_id || null,

            createdAt: creationDate,
            lastMetaFormSubmittedAt: isFacebook ? creationDate : null,
            lastContactedAt: props.notes_last_contacted ? new Date(props.notes_last_contacted) : null,
            
            metadata: { hubspotId: contact.id }
          });
        });

        // Use save to respect explicit dates (createdAt) instead of insert
        await leadsRepository.save(newLeads, { chunk: 1000 });
        totalFetched += newLeads.length;
        
        logger.log(`Imported ${totalFetched} leads so far...`);
      }

      if (paging && paging.next && paging.next.after) {
        afterToken = paging.next.after;
      } else {
        hasMore = false;
      }
    } catch (error: any) {
      logger.error('Error fetching from HubSpot', error?.response?.data || error.message);
      hasMore = false;
    }
  }

  logger.log(`✅ Fully Imported ${totalFetched} leads successfully with all properties and dates!`);
  
  await app.close();
  process.exit(0);
}

bootstrap();
