/**
 * HubSpot Full Sync Script
 * 
 * This script syncs the following fields from HubSpot to our CRM:
 *  - createdAt           (from HubSpot `createdate`)
 *  - lastContactedAt     (from HubSpot `notes_last_contacted`)
 *  - lastMetaFormSubmittedAt (from HubSpot `createdate`, if currently wrong Aug 19 date)
 *  - status              (from HubSpot `hs_lead_status` / `lifecyclestage`)
 *  - source              (set to 'facebook_ads' if HubSpot source is PAID_SOCIAL or has ad data)
 * 
 * Usage (on EC2):
 *   DATABASE_HOST=localhost npx ts-node src/scripts/hubspot-full-sync.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Lead } from '../modules/crm/entities/lead.entity';
import { Repository } from 'typeorm';
import axios from 'axios';

const HUBSPOT_TOKEN = process.env.HUBSPOT_API_TOKEN;
const BASE_URL = 'https://api.hubapi.com/crm';

// HubSpot lead status → Our CRM status mapping
const HUBSPOT_STATUS_MAP: Record<string, string> = {
  // hs_lead_status values
  'new':                    'new',
  'open':                   'new',
  'in_progress':            'contacted',
  'open_deal':              'qualified',
  'attempted_to_contact':   'contacted',
  'connected':              'contacted',
  'bad_timing':             'follow_up',
  'unqualified':            'lost',
  // lifecyclestage values
  'lead':                   'new',
  'subscriber':             'new',
  'marketingqualifiedlead': 'qualified',
  'salesqualifiedlead':     'qualified',
  'opportunity':            'appointment_scheduled',
  'customer':               'converted',
  'evangelist':             'converted',
  'other':                  'new',
};

function isImportDate(date: Date | null): boolean {
  if (!date) return false;
  const d = new Date(date);
  return d.getFullYear() === 2026 && d.getMonth() === 7 && d.getDate() === 19;
}

async function searchHubSpotContact(email?: string, phone?: string) {
  const filterGroups = [];
  if (email) {
    filterGroups.push({ filters: [{ propertyName: 'email', operator: 'EQ', value: email }] });
  }
  if (phone) {
    filterGroups.push({ filters: [{ propertyName: 'phone', operator: 'EQ', value: phone }] });
  }
  if (filterGroups.length === 0) return null;

  const payload = {
    filterGroups,
    properties: [
      'email', 'firstname', 'lastname', 'phone',
      'createdate',
      'notes_last_contacted',
      'hs_lead_status',
      'lifecyclestage',
      'hs_analytics_source',
      'hs_analytics_source_data_1',
    ],
    limit: 5,
  };

  try {
    const response = await axios.post(`${BASE_URL}/v3/objects/contacts/search`, payload, {
      headers: { Authorization: `Bearer ${HUBSPOT_TOKEN}` },
    });
    return response.data.results || [];
  } catch (err: any) {
    if (err?.response?.status === 429) {
      await new Promise(r => setTimeout(r, 1000));
      const response = await axios.post(`${BASE_URL}/v3/objects/contacts/search`, payload, {
        headers: { Authorization: `Bearer ${HUBSPOT_TOKEN}` },
      });
      return response.data.results || [];
    }
    throw err;
  }
}

async function bootstrap() {
  console.log('Starting NestJS Application Context...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const leadRepository = app.get<Repository<Lead>>(getRepositoryToken(Lead));

  const leads = await leadRepository.find();
  console.log(`\nFound ${leads.length} leads in database.`);
  console.log(`HubSpot Token: ${HUBSPOT_TOKEN ? 'Found ✅' : 'MISSING ❌'}\n`);

  if (!HUBSPOT_TOKEN) {
    console.error('ERROR: HUBSPOT_API_TOKEN is not set in environment!');
    process.exit(1);
  }

  let updatedCreatedAt = 0;
  let updatedLastContacted = 0;
  let updatedLastFormDate = 0;
  let updatedStatus = 0;
  let updatedSource = 0;
  let notFound = 0;
  let errors = 0;

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];

    if (i % 50 === 0) {
      console.log(`\n[${i + 1}/${leads.length}] Progress: ${Math.round((i / leads.length) * 100)}%`);
      console.log(`  Updated: createdAt=${updatedCreatedAt}, contacted=${updatedLastContacted}, formDate=${updatedLastFormDate}, status=${updatedStatus}, source=${updatedSource}`);
    }

    if (!lead.email && !lead.phone) {
      continue;
    }

    try {
      const contacts = await searchHubSpotContact(lead.email, lead.phone);

      if (!contacts || contacts.length === 0) {
        notFound++;
        continue;
      }

      let oldestDate: Date | null = null;
      let latestContactedDate: Date | null = null;
      let hubspotStatus: string | null = null;
      let hubspotSource: string | null = null;

      for (const contact of contacts) {
        const props = contact.properties;

        if (props.createdate) {
          const d = new Date(props.createdate);
          if (!oldestDate || d < oldestDate) {
            oldestDate = d;
          }
        }

        if (props.notes_last_contacted) {
          const d = new Date(props.notes_last_contacted);
          if (!latestContactedDate || d > latestContactedDate) {
            latestContactedDate = d;
          }
        }

        if (!hubspotStatus) {
          hubspotStatus = props.hs_lead_status || props.lifecyclestage || null;
        }

        if (!hubspotSource) {
          hubspotSource = props.hs_analytics_source || props.hs_analytics_source_data_1 || null;
        }
      }

      let changed = false;

      // 1. Fix createdAt
      if (oldestDate) {
        const diffHours = Math.abs(lead.createdAt.getTime() - oldestDate.getTime()) / (1000 * 60 * 60);
        if (isImportDate(lead.createdAt) || (diffHours > 24 && oldestDate < lead.createdAt)) {
          lead.createdAt = oldestDate;
          updatedCreatedAt++;
          changed = true;
        }
      }

      // 2. Fix lastMetaFormSubmittedAt (if Aug 19 fake date)
      if (isImportDate(lead.lastMetaFormSubmittedAt) && oldestDate) {
        lead.lastMetaFormSubmittedAt = oldestDate;
        updatedLastFormDate++;
        changed = true;
      }

      // 3. Fix lastContactedAt (if null or Aug 26 fake date)
      if (latestContactedDate) {
        const existingContacted = lead.lastContactedAt ? new Date(lead.lastContactedAt) : null;
        const isFakeDate = existingContacted &&
          existingContacted.getFullYear() === 2026 &&
          existingContacted.getMonth() === 7 &&
          existingContacted.getDate() === 26;

        if (!existingContacted || isFakeDate) {
          lead.lastContactedAt = latestContactedDate;
          updatedLastContacted++;
          changed = true;
        }
      }

      // 4. Fix status (only if currently new/default)
      if (hubspotStatus) {
        const mappedStatus = HUBSPOT_STATUS_MAP[hubspotStatus.toLowerCase()];
        if (mappedStatus && (lead.status === 'new' || lead.status === 'NEW' || !lead.status)) {
          lead.status = mappedStatus;
          updatedStatus++;
          changed = true;
        }
      }

      // 5. Fix source (if Facebook signals found)
      const isFacebookSource =
        hubspotSource?.toLowerCase().includes('paid_social') ||
        hubspotSource?.toLowerCase().includes('facebook') ||
        !!lead.facebookAdId ||
        !!lead.facebookLeadId ||
        !!lead.facebookFormId ||
        !!lead.facebookAdName;

      if (isFacebookSource && (lead.source === 'csv_import' || lead.source === 'manual' || !lead.source)) {
        lead.source = 'facebook_ads';
        updatedSource++;
        changed = true;
      }

      if (changed) {
        await leadRepository.save(lead);
      }

      // 110ms delay to stay within HubSpot rate limits (100 req/10s)
      await new Promise(r => setTimeout(r, 110));

    } catch (e: any) {
      errors++;
      if (errors <= 10) {
        console.error(`  -> ERROR on lead ${lead.id} (${lead.firstName} ${lead.lastName}): ${e.message}`);
      }
    }
  }

  console.log('\n\n========================================');
  console.log('HubSpot Full Sync Complete!');
  console.log('========================================');
  console.log(`Total leads processed : ${leads.length}`);
  console.log(`createdAt updated     : ${updatedCreatedAt}`);
  console.log(`lastContactedAt fixed : ${updatedLastContacted}`);
  console.log(`Last Form date fixed  : ${updatedLastFormDate}`);
  console.log(`Status updated        : ${updatedStatus}`);
  console.log(`Source fixed          : ${updatedSource}`);
  console.log(`Not found in HubSpot  : ${notFound}`);
  console.log(`Errors                : ${errors}`);
  console.log('========================================\n');

  await app.close();
  process.exit(0);
}

bootstrap().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
