import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityManager } from 'typeorm';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';

export interface FacebookLeadData {
  id: string;
  field_data: Array<{
    name: string;
    values: string[];
  }>;
  created_time: string;
  ad_id?: string;
  adset_id?: string;
  campaign_id?: string;
  form_id?: string;
}

export interface ParsedFacebookLead {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  facebookLeadId: string;
  facebookFormId?: string;
  facebookCampaignId?: string;
  facebookAdSetId?: string;
  facebookAdId?: string;
  facebookLeadData: any;
}

@Injectable()
export class FacebookService {
  private readonly axiosInstance: AxiosInstance;
  private readonly apiVersion: string = 'v18.0';
  private readonly logger = new Logger(FacebookService.name);

  constructor(
    private configService: ConfigService,
    private entityManager: EntityManager,
  ) {
    this.axiosInstance = axios.create({
      baseURL: `https://graph.facebook.com/${this.apiVersion}`,
      timeout: 10000,
    });
  }

  private async getFacebookCredentials(): Promise<{ accessToken: string; appSecret: string; appId?: string }> {
    let accessToken = this.configService.get<string>('FACEBOOK_ACCESS_TOKEN');
    let appSecret = this.configService.get<string>('FACEBOOK_APP_SECRET');
    let appId = this.configService.get<string>('FACEBOOK_APP_ID');

    try {
      const dbSettings = await this.entityManager.query(
        `SELECT key, value FROM platform_settings WHERE key IN ('facebook_access_token', 'facebook_app_secret', 'facebook_app_id')`
      );
      
      const settingsMap: Record<string, any> = {};
      for (const row of dbSettings) {
        settingsMap[row.key] = row.value;
      }

      if (settingsMap['facebook_access_token']) {
        accessToken = settingsMap['facebook_access_token'];
      }
      if (settingsMap['facebook_app_secret']) {
        appSecret = settingsMap['facebook_app_secret'];
      }
      if (settingsMap['facebook_app_id']) {
        appId = settingsMap['facebook_app_id'];
      }
    } catch (err) {
      this.logger.error('Failed to load facebook settings from DB, falling back to env', err.stack);
    }

    return { accessToken, appSecret, appId };
  }

  async validateSignature(signature: string, payload: any): Promise<boolean> {
    const creds = await this.getFacebookCredentials();
    if (!creds.appSecret) {
      this.logger.warn('FACEBOOK_APP_SECRET not configured. Skipping signature validation.');
      // Return true to allow testing without secret, but this is insecure for production
      return true;
    }

    if (!signature) {
      return false;
    }

    const [algorithm, signatureHash] = signature.split('=');
    if (!algorithm || !signatureHash) {
      return false;
    }

    const hmac = crypto.createHmac(algorithm, creds.appSecret);
    const digest = hmac.update(JSON.stringify(payload)).digest('hex');

    return signatureHash === digest;
  }

  async getLead(leadId: string): Promise<FacebookLeadData> {
    const creds = await this.getFacebookCredentials();
    if (leadId.startsWith('mock_') || creds.accessToken === 'MOCK_TOKEN') {
      return {
        id: leadId,
        created_time: new Date().toISOString(),
        field_data: [
          { name: 'full_name', values: ['Mock User'] },
          { name: 'email', values: ['mock@example.com'] },
          { name: 'phone_number', values: ['+1234567890'] },
        ],
      };
    }
    try {
      const response = await this.axiosInstance.get(`/${leadId}`, {
        params: {
          access_token: creds.accessToken,
          fields: 'id,field_data,created_time,ad_id,adset_id,campaign_id,form_id',
        },
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BadRequestException(
          `Facebook API error: ${error.response?.data?.error?.message || error.message}`,
        );
      }
      throw error;
    }
  }

  async getLeadsByForm(formId: string, limit: number = 10000): Promise<FacebookLeadData[]> {
    const creds = await this.getFacebookCredentials();
    if (creds.accessToken === 'MOCK_TOKEN' || creds.accessToken === 'your-facebook-access-token') {
      const mockCount = Math.min(limit, 50);
      return Array(mockCount).fill(null).map((_, i) => ({
        id: `mock_lead_${i + 1}`,
        created_time: new Date().toISOString(),
        field_data: [
          { name: 'full_name', values: [`Mock Lead ${i + 1}`] },
          { name: 'email', values: [`mock${i + 1}@example.com`] },
          { name: 'phone_number', values: ['+15550000000'] }
        ],
        form_id: formId
      }));
    }

    try {
      let allLeads: FacebookLeadData[] = [];
      let nextPageUrl: string | null = `/${formId}/leads`;
      let params: any = {
        access_token: creds.accessToken,
        fields: 'id,field_data,created_time,ad_id,adset_id,campaign_id,form_id',
        limit: 100,
      };

      while (nextPageUrl) {
        const response = await this.axiosInstance.get(nextPageUrl, { params });
        const data = response.data.data || [];
        allLeads = [...allLeads, ...data];

        if (response.data.paging && response.data.paging.next && allLeads.length < limit) {
          nextPageUrl = response.data.paging.next;
          params = {}; // Clear params since absolute URL contains query params
        } else {
          nextPageUrl = null;
        }
      }

      return allLeads;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BadRequestException(
          `Facebook API error: ${error.response?.data?.error?.message || error.message}`,
        );
      }
      throw error;
    }
  }

  parseLeadData(leadData: FacebookLeadData): ParsedFacebookLead {
    const fieldMap = new Map<string, string>();

    // Map Facebook field names to our field names
    leadData.field_data.forEach((field) => {
      fieldMap.set(field.name, field.values[0]);
    });

    return {
      firstName: fieldMap.get('full_name')?.split(' ')[0] || fieldMap.get('first_name'),
      lastName: fieldMap.get('full_name')?.split(' ').slice(1).join(' ') || fieldMap.get('last_name'),
      email: fieldMap.get('email'),
      phone: fieldMap.get('phone_number') || fieldMap.get('phone'),
      facebookLeadId: leadData.id,
      facebookFormId: leadData.form_id,
      facebookCampaignId: leadData.campaign_id,
      facebookAdSetId: leadData.adset_id,
      facebookAdId: leadData.ad_id,
      facebookLeadData: leadData,
    };
  }

  async testFacebookConnection(): Promise<{ success: boolean; message: string }> {
    const creds = await this.getFacebookCredentials();
    try {
      if (creds.accessToken === 'MOCK_TOKEN' || creds.accessToken === 'your-facebook-access-token') {
        return {
          success: true,
          message: 'Facebook API connection successful (MOCK MODE). Connected as: Mock User',
        };
      }

      // Test the connection by making a simple API call to verify the access token
      const response = await this.axiosInstance.get('/me', {
        params: {
          access_token: creds.accessToken,
          fields: 'id,name',
        },
      });

      if (response.data && response.data.id) {
        return {
          success: true,
          message: `Facebook API connection successful. Connected as: ${response.data.name || response.data.id}`,
        };
      }

      return {
        success: false,
        message: 'Facebook API call succeeded but returned unexpected response',
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          message: `Facebook API connection failed: ${error.response?.data?.error?.message || error.message}`,
        };
      }

      return {
        success: false,
        message: `Facebook API connection failed: ${error.message}`,
      };
    }
  }

  async getForms(pageId?: string): Promise<any[]> {
    const creds = await this.getFacebookCredentials();
    if (!creds.accessToken || creds.accessToken === 'MOCK_TOKEN' || creds.accessToken === 'your-facebook-access-token') {
      return [
        { id: '12', name: 'Newsletter Signup', status: 'ACTIVE' },
        { id: '13', name: 'Spring Promo', status: 'ACTIVE' },
        { id: '14', name: 'Consultation Request', status: 'PAUSED' },
      ];
    }

    // Load page ID from DB settings if not provided
    let targetPageId = pageId;
    if (!targetPageId) {
      try {
        const dbSettings = await this.entityManager.query(
          `SELECT key, value FROM platform_settings WHERE key IN ('facebook_page_id', 'facebook_page_access_token')`
        );
        const settingsMap: Record<string, any> = {};
        for (const row of dbSettings) {
          settingsMap[row.key] = row.value;
        }
        targetPageId = settingsMap['facebook_page_id'];
        // If a page-specific access token exists, use it (page tokens have leadgen permissions)
        if (settingsMap['facebook_page_access_token']) {
          creds.accessToken = settingsMap['facebook_page_access_token'];
        }
      } catch (err) {
        this.logger.warn('Could not load facebook_page_id from DB settings');
      }
    }

    if (!targetPageId) {
      this.logger.error('No Facebook Page ID configured. Set facebook_page_id in platform_settings or pass pageId explicitly.');
      return [];
    }

    try {
      const response = await this.axiosInstance.get(`/${targetPageId}/leadgen_forms`, {
        params: {
          access_token: creds.accessToken,
          fields: 'id,name,status,leads_count',
        },
      });

      return response.data.data || [];
    } catch (error) {
      this.logger.error(`Failed to fetch Facebook forms: ${error.message}`);
      if (axios.isAxiosError(error)) {
        this.logger.error(`FB API error detail: ${JSON.stringify(error.response?.data)}`);
      }
      return [];
    }
  }
}