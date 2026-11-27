import { BadRequestException, HttpException, Logger } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { Lead } from './entities/lead.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { LeadStatus } from '../../common/enums/lead-status.enum';
import { TASK_OWNER_ROLES } from './task-owner-roles';
import type { HubspotService } from '../hubspot/hubspot.service';

const logger = new Logger('HubspotContactImport');

export interface HubspotContactImportOptions {
  year?: number | null;
  dryRun: boolean;
  ownerMap?: Record<string, string>;
  importedBy?: string;
}

export interface HubspotContactImportDeps {
  hubspot: Pick<HubspotService, 'listManualContacts' | 'listOwners'>;
  leads: Repository<Lead>;
  users: Repository<User>;
}

/**
 * One-off admin import: HubSpot contacts that the sales team typed in by hand (record source
 * CRM_UI / MOBILE_IOS / MOBILE_ANDROID) and that never reached the platform become leads.
 *  - A contact whose mobile (last 10 digits) already belongs to a lead or a customer is skipped.
 *  - The HubSpot contact owner becomes the assigned salesperson.
 *  - Rows are written directly: no `lead.created` event, so no notification, email or
 *    automatic task is produced.
 *  - `dryRun` (the default at the endpoint) only reports. Running twice never duplicates.
 * `ownerMap` optionally maps a HubSpot owner id to a platform user id or email.
 * Without `year` every year is read (newest first), still without creating duplicates.
 */
export async function importHubspotManualContacts(deps: HubspotContactImportDeps, options: HubspotContactImportOptions) {
  const FIRST_YEAR = 2015;
  const thisYear = new Date().getUTCFullYear();
  const allYears = options.year === undefined || options.year === null || (options.year as any) === '';
  const year = allYears ? null : Number(options.year);
  if (year !== null && (!Number.isInteger(year) || year < FIRST_YEAR || year > thisYear)) {
    throw new BadRequestException(`"year" must be between ${FIRST_YEAR} and ${thisYear}, or left out for all years.`);
  }
  // Newest first: when the same mobile appears twice in HubSpot, the latest contact is kept.
  const years = year !== null
    ? [year]
    : Array.from({ length: thisYear - FIRST_YEAR + 1 }, (_v, i) => thisYear - i);
  const dryRun = options.dryRun !== false;

  const contacts: Array<{ id: string; properties: Record<string, string> }> = [];
  const perYear: Record<string, { found: number; toImport: number }> = {};
  let hubspotOwners: Array<{ id: string; email: string; firstName: string; lastName: string }> = [];
  try {
    // One request series per year keeps every search far below HubSpot's 10,000 result limit.
    for (const y of years) {
      const found = await deps.hubspot.listManualContacts(
        new Date(Date.UTC(y, 0, 1)),
        new Date(Date.UTC(y + 1, 0, 1)),
      );
      // Newest first inside the year as well.
      contacts.push(...found.reverse());
      perYear[String(y)] = { found: found.length, toImport: 0 };
    }
  } catch (e: any) {
    if (e instanceof HttpException) throw e;
    throw new BadRequestException(`HubSpot did not return the contacts: ${e?.response?.data?.message || e?.message}`);
  }
  try {
    hubspotOwners = await deps.hubspot.listOwners();
  } catch (e: any) {
    // Token without the owners scope: owners can still be matched through `ownerMap`.
    logger.warn(`[HubSpot import] Could not load HubSpot owners: ${e?.response?.data?.message || e?.message}`);
  }

  const plain = (s: string) =>
    (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  const staff = await deps.users.find({ where: { role: In(TASK_OWNER_ROLES as UserRole[]) } });
  const ownerMap = options.ownerMap || {};
  const resolveOwner = (ownerId: string): User | null => {
    const mapped = String(ownerMap[ownerId] || '').trim().toLowerCase();
    if (mapped) {
      return staff.find(u => u.id === mapped || (u.email || '').toLowerCase() === mapped) || null;
    }
    const owner = hubspotOwners.find(o => o.id === ownerId);
    if (!owner) return null;
    const email = owner.email.toLowerCase();
    const name = plain(`${owner.firstName} ${owner.lastName}`);
    return (email && staff.find(u => (u.email || '').toLowerCase() === email))
      || (name && staff.find(u => plain(`${u.firstName || ''} ${u.lastName || ''}`) === name))
      || null;
  };

  const tailOf = (phone?: string | null) => {
    const digits = (phone || '').replace(/\D/g, '');
    return digits.length >= 10 ? digits.slice(-10) : '';
  };
  const leadRows = await deps.leads.createQueryBuilder('l')
    .select('l.phone', 'phone').where('l.phone IS NOT NULL').getRawMany();
  const customerRows = await deps.users.createQueryBuilder('u')
    .select('u.phone', 'phone').where('u.phone IS NOT NULL')
    .andWhere('u.role = :role', { role: UserRole.CLIENT }).getRawMany();
  const leadTails = new Set(leadRows.map(r => tailOf(r.phone)).filter(Boolean));
  const customerTails = new Set(customerRows.map(r => tailOf(r.phone)).filter(Boolean));
  // Includes deleted leads: something imported and later deleted on purpose stays deleted.
  const importedRows = await deps.leads.createQueryBuilder('l').withDeleted()
    .select("l.metadata->>'hubspotContactId'", 'hubspotId')
    .where("l.metadata->>'hubspotContactId' IS NOT NULL").getRawMany();
  const importedIds = new Set(importedRows.map(r => String(r.hubspotId)));

  const counts = {
    total: contacts.length, toImport: 0, created: 0,
    alreadyLead: 0, alreadyCustomer: 0, alreadyImported: 0, repeatedInHubspot: 0,
    noMobile: 0, ownerNotMatched: 0, withoutOwner: 0,
  };
  const ownerStats = new Map<string, { hubspotOwnerId: string; hubspotName: string; hubspotEmail: string; salesperson: string | null; contacts: number }>();
  const skipped: Array<{ hubspotContactId: string; name: string; phone: string; reason: string }> = [];
  const seenTails = new Set<string>();
  const toCreate: Lead[] = [];

  for (const contact of contacts) {
    const p = contact.properties || {};
    const hubspotContactId = String(contact.id);
    const name = `${p.firstname || ''} ${p.lastname || ''}`.trim();
    const phone = (tailOf(p.mobilephone) ? p.mobilephone : p.phone || p.mobilephone || '').trim();
    const tail = tailOf(phone);
    const skip = (key: keyof typeof counts, reason: string) => {
      counts[key]++;
      skipped.push({ hubspotContactId, name, phone, reason });
    };

    if (importedIds.has(hubspotContactId)) { skip('alreadyImported', 'Already imported earlier'); continue; }
    if (!tail) { skip('noMobile', 'No valid mobile number'); continue; }
    if (customerTails.has(tail)) { skip('alreadyCustomer', 'Mobile already belongs to a customer'); continue; }
    if (leadTails.has(tail)) { skip('alreadyLead', 'Mobile already belongs to a lead'); continue; }
    if (seenTails.has(tail)) { skip('repeatedInHubspot', 'Same mobile as another HubSpot contact in this import'); continue; }

    const ownerId = String(p.hubspot_owner_id || '').trim();
    let salesperson: User | null = null;
    if (ownerId) {
      salesperson = resolveOwner(ownerId);
      const hs = hubspotOwners.find(o => o.id === ownerId);
      const stat = ownerStats.get(ownerId) || {
        hubspotOwnerId: ownerId,
        hubspotName: hs ? `${hs.firstName} ${hs.lastName}`.trim() : '',
        hubspotEmail: hs?.email || '',
        salesperson: salesperson ? `${salesperson.firstName || ''} ${salesperson.lastName || ''}`.trim() || salesperson.email : null,
        contacts: 0,
      };
      stat.contacts++;
      ownerStats.set(ownerId, stat);
      if (!salesperson) {
        skip('ownerNotMatched', `HubSpot owner ${stat.hubspotName || ownerId} is not matched to a salesperson`);
        continue;
      }
    } else {
      counts.withoutOwner++;
    }

    seenTails.add(tail);
    counts.toImport++;
    const contactYear = String(new Date(p.createdate || 0).getUTCFullYear());
    if (perYear[contactYear]) perYear[contactYear].toImport++;
    const email = (p.email || '').trim().toLowerCase();
    const lead = deps.leads.create({
      source: 'hubspot',
      firstName: (p.firstname || p.lastname || email.split('@')[0] || 'HubSpot contact').trim(),
      lastName: p.firstname ? (p.lastname || '').trim() || null : null,
      email: email.includes('@') ? email : null,
      phone,
      status: LeadStatus.NEW,
      assignedSalesId: salesperson?.id || null,
      metadata: {
        importSource: 'hubspot_manual_contacts',
        hubspotContactId,
        hubspotOwnerId: ownerId || null,
        hubspotRecordSource: p.hs_object_source_label || null,
        hubspotCreatedAt: p.createdate || null,
        importedBy: options.importedBy || null,
        importedAt: new Date().toISOString(),
      },
    } as any) as unknown as Lead;
    // Keep the day the salesperson entered the contact, so the lead sits in its real place.
    const created = p.createdate ? new Date(p.createdate) : null;
    if (created && !isNaN(created.getTime())) lead.createdAt = created;
    toCreate.push(lead);
  }

  if (!dryRun && toCreate.length) {
    await deps.leads.save(toCreate, { chunk: 100 });
    counts.created = toCreate.length;
    logger.log(`[HubSpot import] ${counts.created} leads created for ${year ?? 'all years'} by ${options.importedBy || 'unknown'}`);
  }

  return {
    dryRun,
    year: year ?? 'all',
    ...counts,
    perYear,
    owners: Array.from(ownerStats.values()),
    preview: toCreate.slice(0, 25).map(l => ({
      name: `${l.firstName} ${l.lastName || ''}`.trim(),
      phone: l.phone,
      email: l.email,
      salespersonId: l.assignedSalesId,
      hubspotCreatedAt: l.metadata?.hubspotCreatedAt,
    })),
    skipped,
  };
}
