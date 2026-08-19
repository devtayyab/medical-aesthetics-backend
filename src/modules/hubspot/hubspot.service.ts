import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class HubspotService {
  private readonly logger = new Logger(HubspotService.name);
  // Default to the provided token for now; can be moved to ConfigService later
  private readonly HUBSPOT_TOKEN = process.env.HUBSPOT_API_TOKEN;
  private readonly BASE_URL = 'https://api.hubapi.com/crm';

  async getContactOverview(email?: string, phone?: string) {
    if (!email && !phone) {
      throw new HttpException('Email or phone is required to find Hubspot contact', HttpStatus.BAD_REQUEST);
    }

    try {
      const contact = await this.searchContact(email, phone);
      if (!contact) {
        return { message: 'Contact not found in HubSpot', data: null };
      }

      const contactId = contact.id;

      // Fetch Associations concurrently
      const [dealsAssoc, meetingsAssoc] = await Promise.all([
        this.getAssociations(contactId, 'contacts', 'deals'),
        this.getAssociations(contactId, 'contacts', 'meetings'),
      ]);

      const dealIds = dealsAssoc.map(a => a.toObjectId);
      const meetingIds = meetingsAssoc.map(a => a.toObjectId);

      // Fetch Deals details
      const deals = await this.getBatchObjects('deals', dealIds, [
        'amount', 'dealname', 'dealstage', 'closedate', 'createdate', 'pipeline'
      ]);

      // Fetch Meetings details
      const meetings = await this.getBatchObjects('meetings', meetingIds, [
        'hs_meeting_body', 'hs_meeting_title', 'hs_createdate'
      ]);

      return {
        message: 'HubSpot overview fetched successfully',
        data: {
          contact: contact.properties,
          deals: deals.map(d => ({
            id: d.id,
            name: d.properties.dealname,
            amount: d.properties.amount,
            stage: d.properties.dealstage,
            pipeline: d.properties.pipeline,
            date: d.properties.closedate || d.properties.createdate,
          })),
          summaryNotes: meetings.map(m => ({
            id: m.id,
            title: m.properties.hs_meeting_title || 'Meeting',
            body: m.properties.hs_meeting_body,
            date: m.properties.hs_createdate,
          })),
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

  private async searchContact(email?: string, phone?: string) {
    const filterGroups = [];
    if (email) {
      filterGroups.push({ filters: [{ propertyName: 'email', operator: 'EQ', value: email }] });
    }
    if (phone) {
      // Hubspot phone search might need exact formatting.
      filterGroups.push({ filters: [{ propertyName: 'phone', operator: 'EQ', value: phone }] });
    }

    const payload = {
      filterGroups,
      properties: ['email', 'firstname', 'lastname', 'phone'],
      limit: 1,
    };

    const response = await axios.post(`${this.BASE_URL}/v3/objects/contacts/search`, payload, {
      headers: { Authorization: `Bearer ${this.HUBSPOT_TOKEN}` },
    });

    return response.data.results[0] || null;
  }

  private async getAssociations(fromId: string, fromType: string, toType: string) {
    const response = await axios.get(`${this.BASE_URL}/v4/objects/${fromType}/${fromId}/associations/${toType}`, {
      headers: { Authorization: `Bearer ${this.HUBSPOT_TOKEN}` },
    });
    return response.data.results || [];
  }

  private async getBatchObjects(objectType: string, ids: string[], properties: string[]) {
    if (ids.length === 0) return [];

    const inputs = ids.map(id => ({ id }));
    const response = await axios.post(
      `${this.BASE_URL}/v3/objects/${objectType}/batch/read`,
      { inputs, properties },
      { headers: { Authorization: `Bearer ${this.HUBSPOT_TOKEN}` } }
    );
    return response.data.results || [];
  }
}
