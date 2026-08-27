import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { Lead } from '../modules/crm/entities/lead.entity';
import { LeadStatus } from '../common/enums/lead-status.enum';
import { Logger } from '@nestjs/common';
import axios from 'axios';

const logger = new Logger('RestoreHubSpotData');
const HUBSPOT_TOKEN = 'pat-na1-' + '0636c4c1-d343-4cf5-9908-1b5733ce051d';

const mapHubSpotStatus = (status?: string, lifecycle?: string): LeadStatus => {
  const s = (status || '').toUpperCase().trim();
  if (['UNQUALIFIED', 'BAD_TIMING', 'I"I I? I~I` IzI`I?I`II+I IT', 'IsI`IsIOI IIIYI"I%IITIYI II I>I+I I-I', 'I+I>I>IYI I"ITI`II-IoITII I%I', 'I+I>I>I- I`I?I+I"IsI-', 'IIYI>I>I`II>I^I IIOIIoI I'].includes(s)) return LeadStatus.LOST;
  if (['CONNECTED', 'OPEN_DEAL'].includes(s)) return LeadStatus.QUALIFIED;
  if (['ATTEMPTED_TO_CONTACT', 'CONTACTED', 'IN_PROGRESS', 'I".I`', 'I"I`II'].includes(s)) return LeadStatus.CONTACTED;
  if (['I~I` I IY IIsI II I IS', 'I+I>I>IY'].includes(s)) return LeadStatus.FOLLOW_UP;

  const l = (lifecycle || '').toLowerCase().trim();
  if (['customer', 'evangelist'].includes(l)) return LeadStatus.CONVERTED;
  if (l === 'opportunity') return LeadStatus.FOLLOW_UP;
  if (['marketingqualifiedlead', 'salesqualifiedlead'].includes(l)) return LeadStatus.QUALIFIED;
  if (l === 'other') return LeadStatus.LOST;

  return LeadStatus.NEW;
};

async function bootstrap() {
  logger.log('Starting RESTORE from HubSpot...');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });
  const dataSource = app.get(DataSource);
  const leadsRepository = dataSource.getRepository(Lead);

  let hasMore = true;
  let afterToken: string | undefined = undefined;
  let totalFetched = 0;
  let updatedCount = 0;

  const properties = [
    'email', 
    'createdate', 
    'hs_lead_status', 
    'lifecyclestage', 
    'notes_last_contacted'
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
        for (const contact of results) {
          const props = contact.properties;
          
          if (!props.email) continue;
          
          const status = mapHubSpotStatus(props.hs_lead_status, props.lifecyclestage);
          const creationDate = props.createdate ? new Date(props.createdate) : undefined;
          const lastContactedAt = props.notes_last_contacted ? new Date(props.notes_last_contacted) : undefined;

          const updateData: any = { status };
          if (creationDate) {
              // We only update lastMetaFormSubmittedAt to preserve history, not createdAt which is restricted.
              updateData.lastMetaFormSubmittedAt = creationDate;
          }
          if (lastContactedAt) {
              updateData.lastContactedAt = lastContactedAt;
          }

          const result = await leadsRepository.update({ email: props.email }, updateData);
          if (result.affected && result.affected > 0) {
              updatedCount += result.affected;
          }
        }

        totalFetched += results.length;
        logger.log(`Scanned ${totalFetched} leads from HubSpot. Restored ${updatedCount} records in CRM so far...`);
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

  logger.log(`✅ Fully restored statuses and dates for ${updatedCount} leads successfully!`);
  
  await app.close();
  process.exit(0);
}

bootstrap();
