import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { CommunicationLog } from '../crm/entities/communication-log.entity';

@Injectable()
export class HubspotService {
  private readonly logger = new Logger(HubspotService.name);
  private readonly HUBSPOT_TOKEN = process.env.HUBSPOT_API_TOKEN;
  private readonly BASE_URL = 'https://api.hubapi.com/crm';

  constructor(
    @InjectRepository(CommunicationLog)
    private communicationLogsRepository: Repository<CommunicationLog>,
  ) {}

  async getContactOverview(email?: string, phone?: string) {
    if (!email && !phone) {
      throw new HttpException('Email or phone is required to find Hubspot contact', HttpStatus.BAD_REQUEST);
    }

    try {
      const contacts = await this.searchContact(email, phone);
      if (!contacts || contacts.length === 0) {
        return { message: 'Contact not found in HubSpot', data: null };
      }

      // Collect associations across all matched contacts
      const dealIds = new Set<string>();
      const meetingIds = new Set<string>();
      const noteIds = new Set<string>();
      const emailIds = new Set<string>();
      const callIds = new Set<string>();
      const taskIds = new Set<string>();

      for (const contact of contacts) {
        const contactId = contact.id;
        const [dealsAssoc, meetingsAssoc, notesAssoc, emailsAssoc, callsAssoc, tasksAssoc] = await Promise.all([
          this.getAssociations(contactId, 'contacts', 'deals'),
          this.getAssociations(contactId, 'contacts', 'meetings'),
          this.getAssociations(contactId, 'contacts', 'notes'),
          this.getAssociations(contactId, 'contacts', 'emails'),
          this.getAssociations(contactId, 'contacts', 'calls'),
          this.getAssociations(contactId, 'contacts', 'tasks'),
        ]);

        dealsAssoc.forEach(a => dealIds.add(a.toObjectId));
        meetingsAssoc.forEach(a => meetingIds.add(a.toObjectId));
        notesAssoc.forEach(a => noteIds.add(a.toObjectId));
        emailsAssoc.forEach(a => emailIds.add(a.toObjectId));
        callsAssoc.forEach(a => callIds.add(a.toObjectId));
        tasksAssoc.forEach(a => taskIds.add(a.toObjectId));
      }

      const deals = await this.getBatchObjects('deals', Array.from(dealIds), [
        'amount', 'dealname', 'dealstage', 'closedate', 'createdate', 'pipeline'
      ]);
      const meetings = await this.getBatchObjects('meetings', Array.from(meetingIds), [
        'hs_meeting_body', 'hs_meeting_title', 'hs_createdate', 'hs_timestamp'
      ]);
      const notes = await this.getBatchObjects('notes', Array.from(noteIds), [
        'hs_note_body', 'hs_createdate', 'hs_timestamp'
      ]);
      const emails = await this.getBatchObjects('emails', Array.from(emailIds), [
        'hs_email_subject', 'hs_email_text', 'hs_createdate', 'hs_timestamp'
      ]);
      const calls = await this.getBatchObjects('calls', Array.from(callIds), [
        'hs_call_title', 'hs_call_body', 'hs_createdate', 'hs_timestamp'
      ]);
      const tasks = await this.getBatchObjects('tasks', Array.from(taskIds), [
        'hs_task_subject', 'hs_task_body', 'hs_createdate', 'hs_timestamp'
      ]);

      return {
        message: 'HubSpot overview fetched successfully',
        data: {
          contact: contacts[0].properties, // Just use properties from the primary contact
          deals: deals.map(d => ({
            id: d.id,
            name: d.properties.dealname,
            amount: d.properties.amount,
            stage: d.properties.dealstage,
            pipeline: d.properties.pipeline,
            date: d.properties.closedate || d.properties.createdate,
          })),
          summaryNotes: [
            ...meetings.map(m => ({
              id: m.id,
              title: m.properties.hs_meeting_title || 'Meeting',
              body: m.properties.hs_meeting_body,
              date: m.properties.hs_timestamp || m.properties.hs_createdate,
            })),
            ...notes.map(n => ({
              id: n.id,
              title: 'Note',
              body: n.properties.hs_note_body,
              date: n.properties.hs_timestamp || n.properties.hs_createdate,
            })),
            ...emails.map(e => ({
              id: e.id,
              title: e.properties.hs_email_subject || 'Email',
              body: e.properties.hs_email_text,
              date: e.properties.hs_timestamp || e.properties.hs_createdate,
            })),
            ...calls.map(c => ({
              id: c.id,
              title: c.properties.hs_call_title || 'Call',
              body: c.properties.hs_call_body,
              date: c.properties.hs_timestamp || c.properties.hs_createdate,
            })),
            ...tasks.map(t => ({
              id: t.id,
              title: t.properties.hs_task_subject || 'Task',
              body: t.properties.hs_task_body,
              date: t.properties.hs_timestamp || t.properties.hs_createdate,
            }))
          ],
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching HubSpot data: ${error.message}`);
      if (error.response) {
        this.logger.error(JSON.stringify(error.response.data));
      }
      throw new HttpException('Failed to fetch data from HubSpot', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Syncs HubSpot activities (notes, calls, meetings, emails) for a contact
   * into our local communication_logs table.
   *
   * Safe to call multiple times — uses metadata.hubspotId to skip
   * already-saved entries (no duplicates).
   */
  async syncActivitiesToLocal(
    email: string | undefined,
    phone: string | undefined,
    relatedLeadId: string,
    salespersonId: string = '00000000-0000-0000-0000-000000000000',
  ): Promise<void> {
    if (!this.HUBSPOT_TOKEN) {
      this.logger.warn('[HubSpot Sync] HUBSPOT_API_TOKEN is not set. Skipping sync.');
      return;
    }
    if (!email && !phone) return;

    try {
      const contacts = await this.searchContact(email, phone);
      if (!contacts || contacts.length === 0) {
        this.logger.debug(`[HubSpot Sync] No HubSpot contact found for lead ${relatedLeadId}`);
        return;
      }

      const meetingIds = new Set<string>();
      const noteIds = new Set<string>();
      const emailIds = new Set<string>();
      const callIds = new Set<string>();
      const taskIds = new Set<string>();

      for (const contact of contacts) {
        const contactId = contact.id;

        const [meetingsAssoc, notesAssoc, emailsAssoc, callsAssoc, tasksAssoc] = await Promise.all([
          this.getAssociations(contactId, 'contacts', 'meetings'),
          this.getAssociations(contactId, 'contacts', 'notes'),
          this.getAssociations(contactId, 'contacts', 'emails'),
          this.getAssociations(contactId, 'contacts', 'calls'),
          this.getAssociations(contactId, 'contacts', 'tasks'),
        ]);

        meetingsAssoc.forEach(a => meetingIds.add(a.toObjectId));
        notesAssoc.forEach(a => noteIds.add(a.toObjectId));
        emailsAssoc.forEach(a => emailIds.add(a.toObjectId));
        callsAssoc.forEach(a => callIds.add(a.toObjectId));
        tasksAssoc.forEach(a => taskIds.add(a.toObjectId));
      }

      const [meetings, notes, emails, calls, tasks] = await Promise.all([
        this.getBatchObjects('meetings', Array.from(meetingIds), ['hs_meeting_body', 'hs_meeting_title', 'hs_createdate', 'hs_timestamp']),
        this.getBatchObjects('notes', Array.from(noteIds), ['hs_note_body', 'hs_createdate', 'hs_timestamp']),
        this.getBatchObjects('emails', Array.from(emailIds), ['hs_email_subject', 'hs_email_text', 'hs_createdate', 'hs_timestamp']),
        this.getBatchObjects('calls', Array.from(callIds), ['hs_call_title', 'hs_call_body', 'hs_createdate', 'hs_timestamp']),
        this.getBatchObjects('tasks', Array.from(taskIds), ['hs_task_subject', 'hs_task_body', 'hs_createdate', 'hs_timestamp']),
      ]);

      const activities: Array<{
        hubspotId: string;
        type: string;
        subject: string;
        notes: string;
        createdAt: Date;
      }> = [
        ...meetings.map(m => ({
          hubspotId: `hs_meeting_${m.id}`,
          type: 'meeting',
          subject: m.properties.hs_meeting_title || 'Meeting (HubSpot)',
          notes: m.properties.hs_meeting_body || '',
          createdAt: new Date(m.properties.hs_timestamp || m.properties.hs_createdate || Date.now()),
        })),
        ...notes.map(n => ({
          hubspotId: `hs_note_${n.id}`,
          type: 'note',
          subject: 'Note (HubSpot)',
          notes: n.properties.hs_note_body || '',
          createdAt: new Date(n.properties.hs_timestamp || n.properties.hs_createdate || Date.now()),
        })),
        ...emails.map(e => ({
          hubspotId: `hs_email_${e.id}`,
          type: 'email',
          subject: e.properties.hs_email_subject || 'Email (HubSpot)',
          notes: e.properties.hs_email_text || '',
          createdAt: new Date(e.properties.hs_timestamp || e.properties.hs_createdate || Date.now()),
        })),
        ...calls.map(c => ({
          hubspotId: `hs_call_${c.id}`,
          type: 'call',
          subject: c.properties.hs_call_title || 'Call (HubSpot)',
          notes: c.properties.hs_call_body || '',
          createdAt: new Date(c.properties.hs_timestamp || c.properties.hs_createdate || Date.now()),
        })),
        ...tasks.map(t => ({
          hubspotId: `hs_task_${t.id}`,
          type: 'note',
          subject: t.properties.hs_task_subject || 'Task (HubSpot)',
          notes: t.properties.hs_task_body || '',
          createdAt: new Date(t.properties.hs_timestamp || t.properties.hs_createdate || Date.now()),
        })),
      ];

      let savedCount = 0;
      for (const activity of activities) {
        // Skip if already saved (idempotency via hubspotId in metadata)
        const existing = await this.communicationLogsRepository
          .createQueryBuilder('log')
          .where('log."relatedLeadId" = :relatedLeadId', { relatedLeadId })
          .andWhere("log.metadata->>'hubspotId' = :hubspotId", { hubspotId: activity.hubspotId })
          .getOne();

        if (existing) continue;

        const log = this.communicationLogsRepository.create({
          relatedLeadId,
          salespersonId,
          type: activity.type as any,
          direction: 'incoming',
          status: 'completed',
          subject: activity.subject,
          notes: activity.notes,
          metadata: { hubspotId: activity.hubspotId, source: 'hubspot_sync' },
        } as any);

        // Override createdAt after create (TypeORM ignores it during create())
        (log as any).createdAt = activity.createdAt;
        await this.communicationLogsRepository.save(log);
        savedCount++;
      }

      if (savedCount > 0) {
        this.logger.log(`[HubSpot Sync] Saved ${savedCount} new HubSpot activities for lead ${relatedLeadId}`);
      }
    } catch (error) {
      // Non-fatal — never break the lead detail page due to HubSpot issues
      this.logger.warn(`[HubSpot Sync] Failed for lead ${relatedLeadId}: ${error.message}`);
    }
  }

  private async searchContact(email?: string, phone?: string) {
    const filterGroups = [];
    if (email) {
      filterGroups.push({ filters: [{ propertyName: 'email', operator: 'EQ', value: email }] });
    }
    if (phone) {
      filterGroups.push({ filters: [{ propertyName: 'phone', operator: 'EQ', value: phone }] });
    }

    const payload = {
      filterGroups,
      properties: ['email', 'firstname', 'lastname', 'phone'],
      limit: 5,
    };

    const response = await axios.post(`${this.BASE_URL}/v3/objects/contacts/search`, payload, {
      headers: { Authorization: `Bearer ${this.HUBSPOT_TOKEN}` },
    });

    return response.data.results || [];
  }

  private async getAssociations(fromId: string, fromType: string, toType: string) {
    try {
      const response = await axios.get(`${this.BASE_URL}/v4/objects/${fromType}/${fromId}/associations/${toType}`, {
        headers: { Authorization: `Bearer ${this.HUBSPOT_TOKEN}` },
      });
      return response.data.results || [];
    } catch (e) {
      this.logger.warn(`Failed to fetch associations for ${toType}: ${e.message}`);
      return [];
    }
  }

  private async getBatchObjects(type: string, ids: string[], properties: string[]) {
    if (!ids.length) return [];
    try {
      const payload = {
        inputs: ids.map(id => ({ id })),
        properties,
      };
      const response = await axios.post(`${this.BASE_URL}/v3/objects/${type}/batch/read`, payload, {
        headers: { Authorization: `Bearer ${this.HUBSPOT_TOKEN}` },
      });
      return response.data.results || [];
    } catch (e) {
      this.logger.warn(`Failed to fetch batch objects for ${type}: ${e.message}`);
      return [];
    }
  }
}
