/**
 * Sets HubSpot-imported ACTIVE customers to "Converted".
 *
 * The HubSpot import mapped the lead status before the lifecycle stage, so many
 * contacts that are customers in HubSpot (lifecyclestage = customer/evangelist)
 * landed here as New/Contacted/Qualified. A lead is set to Converted when it was
 * imported from HubSpot (metadata.hubspotId) and EITHER:
 *   - HubSpot lists the contact as customer/evangelist (needs HUBSPOT_API_TOKEN), or
 *   - its client account already has a completed visit in this platform.
 * Lost and merged leads are left alone (pass --include-lost to convert Lost ones too).
 *
 * DRY RUN by default: prints every lead it would change and writes nothing.
 *
 *   HUBSPOT_API_TOKEN=pat-... npx ts-node -r tsconfig-paths/register src/scripts/hubspot-active-customers-to-converted.ts
 *   HUBSPOT_API_TOKEN=pat-... npx ts-node -r tsconfig-paths/register src/scripts/hubspot-active-customers-to-converted.ts --apply
 *   (without HUBSPOT_API_TOKEN only the "completed visit" rule is used)
 */
import axios from 'axios';
import AppDataSource from '../config/data-source';

const CUSTOMER_STAGES = ['customer', 'evangelist'];

async function fetchHubSpotCustomerIds(token: string): Promise<Set<string>> {
  const ids = new Set<string>();
  let after: string | undefined;
  do {
    const res = await axios.post(
      'https://api.hubapi.com/crm/v3/objects/contacts/search',
      {
        filterGroups: [{ filters: [{ propertyName: 'lifecyclestage', operator: 'IN', values: CUSTOMER_STAGES }] }],
        properties: ['lifecyclestage'],
        limit: 100,
        ...(after ? { after } : {}),
      },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    for (const c of res.data?.results || []) ids.add(String(c.id));
    after = res.data?.paging?.next?.after;
  } while (after);
  return ids;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const includeLost = process.argv.includes('--include-lost');
  const token = process.env.HUBSPOT_API_TOKEN || '';

  AppDataSource.setOptions({ logging: false });
  await AppDataSource.initialize();

  try {
    console.log(`Mode: ${apply ? 'APPLY (writing)' : 'DRY RUN (no changes)'}`);

    let hubspotCustomers = new Set<string>();
    if (token) {
      hubspotCustomers = await fetchHubSpotCustomerIds(token);
      console.log(`HubSpot contacts with lifecycle customer/evangelist: ${hubspotCustomers.size}`);
    } else {
      console.warn('HUBSPOT_API_TOKEN not set: using only the "completed visit" rule.');
    }

    const completedClients: any[] = await AppDataSource.query(
      `SELECT DISTINCT
              u.id::text AS uid,
              LOWER(TRIM(COALESCE(u.email, ''))) AS email,
              regexp_replace(COALESCE(u.phone, ''), '[^0-9]', '', 'g') AS digits
         FROM appointments a
         JOIN users u ON u.id = a."clientId"
        WHERE UPPER(a.status::text) IN ('COMPLETED', 'EXECUTED')`,
    );
    const completedUserIds = new Set<string>();
    const completedEmails = new Set<string>();
    const completedPhones10 = new Set<string>();
    for (const c of completedClients) {
      if (c.uid) completedUserIds.add(String(c.uid));
      if (c.email) completedEmails.add(String(c.email));
      if (c.digits && c.digits.length >= 10) completedPhones10.add(String(c.digits).slice(-10));
    }

    const excluded = includeLost ? ['converted', 'merged'] : ['converted', 'merged', 'lost'];
    const rawLeads: any[] = await AppDataSource.query(
      `SELECT l.id, l."firstName", l."lastName", l.status, l.email, l.phone,
              l.metadata::jsonb ->> 'hubspotId' AS hubspot_id,
              l.metadata::jsonb ->> 'convertedToUserId' AS conv_uid,
              l.metadata::jsonb ->> 'convertedToCustomerId' AS conv_cid,
              l.metadata::jsonb ->> 'existingCustomerId' AS exist_cid
         FROM leads l
        WHERE l."deletedAt" IS NULL
          AND l.metadata::jsonb ->> 'hubspotId' IS NOT NULL
          AND l.status NOT IN (${excluded.map((_, i) => `$${i + 1}`).join(', ')})`,
      excluded,
    );
    const leads = rawLeads.map((l) => {
      const email = String(l.email || '').trim().toLowerCase();
      const digits = String(l.phone || '').replace(/[^0-9]/g, '');
      const hasCompletedVisit =
        (l.conv_uid && completedUserIds.has(String(l.conv_uid))) ||
        (l.conv_cid && completedUserIds.has(String(l.conv_cid))) ||
        (l.exist_cid && completedUserIds.has(String(l.exist_cid))) ||
        (email !== '' && completedEmails.has(email)) ||
        (digits.length >= 10 && completedPhones10.has(digits.slice(-10)));
      return { ...l, has_completed_visit: Boolean(hasCompletedVisit) };
    });
    console.log(`HubSpot-imported leads not yet converted: ${leads.length}`);

    const toConvert = leads.filter((l) => l.has_completed_visit || hubspotCustomers.has(String(l.hubspot_id)));
    for (const l of toConvert) {
      const why = [hubspotCustomers.has(String(l.hubspot_id)) ? 'HubSpot customer' : null, l.has_completed_visit ? 'completed visit' : null]
        .filter(Boolean)
        .join(' + ');
      console.log(`lead ${l.id} (${l.firstName} ${l.lastName || ''}): ${l.status} -> converted [${why}]`);
    }
    console.log(`\n${toConvert.length} lead(s) ${apply ? 'will be' : 'would be'} set to converted.`);

    if (!apply) {
      console.log('Dry run only. Re-run with --apply to write the changes.');
      return;
    }

    const ids = toConvert.map((l) => l.id);
    for (let i = 0; i < ids.length; i += 1000) {
      await AppDataSource.query(
        `UPDATE leads SET status = 'converted', "convertedAt" = COALESCE("convertedAt", NOW()), "updatedAt" = NOW() WHERE id = ANY($1::uuid[])`,
        [ids.slice(i, i + 1000)],
      );
    }
    console.log(`Updated ${ids.length} lead(s).`);
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((err) => {
  console.error('Script failed:', err?.response?.data || err);
  process.exit(1);
});
