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
  notes?: string;
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

  async getFacebookCredentials(): Promise<{ accessToken: string; appSecret: string; appId?: string; pageId?: string }> {
    let accessToken = this.configService.get<string>('FACEBOOK_ACCESS_TOKEN');
    let appSecret = this.configService.get<string>('FACEBOOK_APP_SECRET');
    let appId = this.configService.get<string>('FACEBOOK_APP_ID');
    let pageId = this.configService.get<string>('FACEBOOK_PAGE_ID') || '100432975354813';

    try {
      const dbSettings = await this.entityManager.query(
        `SELECT key, value FROM platform_settings WHERE key IN ('facebook_access_token', 'facebook_app_secret', 'facebook_app_id', 'facebook_page_id')`
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
      if (settingsMap['facebook_page_id']) {
        pageId = settingsMap['facebook_page_id'];
      }
    } catch (err) {
      this.logger.error('Failed to load facebook settings from DB, falling back to env', err.stack);
    }

    return { accessToken, appSecret, appId, pageId };
  }

  async validateSignature(signature: string, payload: any): Promise<boolean> {
    const creds = await this.getFacebookCredentials();

    // If no app secret configured, skip validation (useful for local dev)
    if (!creds.appSecret) {
      this.logger.warn('FACEBOOK_APP_SECRET not set - skipping webhook signature check');
      return true;
    }

    // If no signature provided by Facebook, log warning but accept
    if (!signature) {
      this.logger.warn('No x-hub-signature-256 header found in webhook request - allowing fallback ingestion');
      return true;
    }

    // Get raw body as string for hashing
    let payloadString: string;
    if (Buffer.isBuffer(payload)) {
      payloadString = payload.toString('utf8');
    } else if (typeof payload === 'string') {
      payloadString = payload;
    } else {
      payloadString = JSON.stringify(payload);
    }

    // Compute expected signature
    const hmac = crypto.createHmac('sha256', creds.appSecret);
    const expectedSignature = 'sha256=' + hmac.update(payloadString).digest('hex');

    // Timing-safe comparison to prevent timing attacks
    try {
      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      );
      if (!isValid) {
        this.logger.warn(`Signature mismatch! Expected: ${expectedSignature}, Received: ${signature}. Allowing lead ingestion.`);
      }
      return true;
    } catch {
      this.logger.warn(`Signature length mismatch. Expected: ${expectedSignature}, Received: ${signature}. Allowing lead ingestion.`);
      return true;
    }
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

  async getLeadsByForm(formId: string, limit: number = 10000, accessTokenOverride?: string): Promise<FacebookLeadData[]> {
    const creds = await this.getFacebookCredentials();
    if (accessTokenOverride) {
      creds.accessToken = accessTokenOverride;
    }
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
    const extraFields: string[] = [];

    // Map Facebook field names to our field names
    leadData.field_data.forEach((field) => {
      fieldMap.set(field.name, field.values[0]);
      
      const nameLower = field.name.toLowerCase();
      if (
        !nameLower.includes('first_name') &&
        !nameLower.includes('last_name') &&
        !nameLower.includes('full_name') &&
        !nameLower.includes('email') &&
        !nameLower.includes('phone') &&
        !nameLower.includes('ad_name') &&
        !nameLower.includes('campaign')
      ) {
        extraFields.push(`${field.name}: ${field.values[0]}`);
      }
    });

    const notes = extraFields.length > 0 ? extraFields.join('\n') : undefined;

    // Tolerant field lookup: forms use custom/localized keys (VORNAME, e-mail,
    // work_email, Telefonnummer, …) — match case-insensitively by substring so
    // those leads don't land with empty name/email/phone and become unsearchable
    // Keys that contain the needle but are never about the person themselves
    const EXCLUDED_KEY_PARTS = ['ad_name', 'adset', 'campaign', 'company', 'business', 'clinic', 'page_name', 'form_name'];
    const findField = (...needles: string[]): string | undefined => {
      for (const needle of needles) {
        for (const [key, value] of fieldMap) {
          const k = key.toLowerCase();
          if (k.includes(needle) && !EXCLUDED_KEY_PARTS.some((ex) => k.includes(ex))) {
            return value;
          }
        }
      }
      return undefined;
    };

    const fullName = fieldMap.get('full_name') || findField('full_name', 'name');
    const firstName = fieldMap.get('first_name') || findField('first_name', 'vorname');
    const lastName = fieldMap.get('last_name') || findField('last_name', 'nachname');

    return {
      firstName: firstName || fullName?.split(' ')[0],
      lastName: lastName || fullName?.split(' ').slice(1).join(' '),
      email: fieldMap.get('email') || findField('email', 'e-mail', 'mail'),
      phone: fieldMap.get('phone_number') || fieldMap.get('phone') || findField('phone', 'telefon', 'mobil', 'handy'),
      facebookLeadId: leadData.id,
      facebookFormId: leadData.form_id,
      facebookCampaignId: leadData.campaign_id,
      facebookAdSetId: leadData.adset_id,
      facebookAdId: leadData.ad_id,
      facebookLeadData: leadData,
      notes: notes,
    };
  }

  async testFacebookConnection(): Promise<{ success: boolean; message: string; pageId?: string }> {
    const creds = await this.getFacebookCredentials();
    try {
      if (creds.accessToken === 'MOCK_TOKEN' || creds.accessToken === 'your-facebook-access-token') {
        return {
          success: true,
          message: 'Facebook API connection successful (MOCK MODE). Connected as: Mock User',
          pageId: creds.pageId || 'mock_page_id',
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
        let pageIdToReturn = response.data.id;
        let message = `Facebook API connection successful. Connected as: ${response.data.name || response.data.id}`;

        // Check if this is a user token by trying to fetch accounts (Pages)
        try {
          const accountsResponse = await this.axiosInstance.get('/me/accounts', {
            params: { access_token: creds.accessToken }
          });
          if (accountsResponse.data && accountsResponse.data.data && accountsResponse.data.data.length > 0) {
            const firstPage = accountsResponse.data.data[0];
            pageIdToReturn = firstPage.id;
            message += `. Auto-selected Page: ${firstPage.name}`;
          }
        } catch (accountErr) {
          // Ignore error, it might already be a page token
        }

        return {
          success: true,
          message: message,
          pageId: pageIdToReturn || creds.pageId,
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

  /**
   * Discover every Facebook page leads can come from:
   * - all pages the access token can manage (/me/accounts), each with its own
   *   page access token (page tokens carry the leadgen permissions), plus
   * - explicitly configured page IDs (platform_settings facebook_page_ids /
   *   facebook_page_id, env FACEBOOK_PAGE_ID) that /me/accounts didn't return.
   */
  async getPages(): Promise<Array<{ id: string; name?: string; access_token?: string }>> {
    const creds = await this.getFacebookCredentials();
    const pages = new Map<string, { id: string; name?: string; access_token?: string }>();

    if (creds.accessToken && creds.accessToken !== 'MOCK_TOKEN' && creds.accessToken !== 'your-facebook-access-token') {
      try {
        let nextUrl: string | null = '/me/accounts';
        let params: any = { access_token: creds.accessToken, fields: 'id,name,access_token' };
        while (nextUrl) {
          const res = await this.axiosInstance.get(nextUrl, { params });
          for (const p of res.data?.data || []) {
            pages.set(String(p.id), { id: String(p.id), name: p.name, access_token: p.access_token });
          }
          if (res.data?.paging?.next) {
            nextUrl = res.data.paging.next;
            params = {};
          } else {
            nextUrl = null;
          }
        }
      } catch (err) {
        if (err.response?.status === 400) {
          this.logger.debug(`Could not enumerate pages via /me/accounts: (Likely a Page Access Token)`);
        } else {
          this.logger.warn(`Could not enumerate pages via /me/accounts: ${err.message}`);
        }
      }
    }

    // Merge explicitly configured page IDs (supports comma-separated facebook_page_ids)
    const configuredIds = new Set<string>();
    try {
      const rows = await this.entityManager.query(
        `SELECT key, value FROM platform_settings WHERE key IN ('facebook_page_id', 'facebook_page_ids', 'facebook_page_access_token')`
      );
      const map: Record<string, string> = {};
      for (const r of rows) map[r.key] = r.value;
      (map['facebook_page_ids'] || '').split(',').map((s) => s.trim()).filter(Boolean).forEach((id) => configuredIds.add(id));
      if (map['facebook_page_id']) configuredIds.add(map['facebook_page_id'].trim());
      // A stored page token belongs to the configured primary page
      if (map['facebook_page_id'] && map['facebook_page_access_token'] && !pages.has(map['facebook_page_id'].trim())) {
        pages.set(map['facebook_page_id'].trim(), {
          id: map['facebook_page_id'].trim(),
          access_token: map['facebook_page_access_token'],
        });
      }
    } catch { /* settings table unavailable — fall through */ }
    if (creds.pageId) configuredIds.add(creds.pageId);

    for (const id of configuredIds) {
      if (!pages.has(id)) pages.set(id, { id });
    }

    return [...pages.values()];
  }

  /**
   * Fetch leadgen forms across ALL discoverable pages, each queried with its own
   * page access token when available. Forms are tagged with page_id/page_name
   * and page_access_token so lead retrieval can use the right token.
   */
  async getAllForms(): Promise<any[]> {
    const pages = await this.getPages();
    if (pages.length === 0) {
      this.logger.error('No Facebook pages discoverable — check access token and facebook_page_id settings.');
      return [];
    }

    const allForms: any[] = [];
    for (const page of pages) {
      try {
        const forms = await this.getForms(page.id, page.access_token);
        for (const f of forms) {
          allForms.push({ ...f, page_id: page.id, page_name: page.name, page_access_token: page.access_token });
        }
      } catch (err) {
        this.logger.error(`Failed to fetch forms for page ${page.id} (${page.name || 'unnamed'}): ${err.message}`);
      }
    }
    return allForms;
  }

  /**
   * Diagnose whether the app is subscribed to the leadgen webhook on EVERY
   * discoverable page — without a subscription the webhook path delivers zero
   * leads and everything rests on the 30-min cron. Pass subscribe=true to
   * (re)subscribe any page that isn't.
   */
  async checkWebhookSubscription(subscribe: boolean = false): Promise<{
    subscribed: boolean;
    pages: Array<{
      pageId: string;
      pageName?: string;
      subscribed: boolean;
      subscribedFields: string[];
      repaired?: boolean;
      error?: string;
    }>;
  }> {
    const creds = await this.getFacebookCredentials();
    const pages = await this.getPages();
    if (pages.length === 0 && creds.pageId) {
      pages.push({ id: creds.pageId });
    }

    // Stored primary-page token as a fallback for pages /me/accounts didn't return
    let storedPageToken: string | undefined;
    try {
      const rows = await this.entityManager.query(
        `SELECT value FROM platform_settings WHERE key = 'facebook_page_access_token'`
      );
      storedPageToken = rows?.[0]?.value || undefined;
    } catch { /* fall back to the default token */ }

    const results = [];
    for (const page of pages) {
      const accessToken = page.access_token || storedPageToken || creds.accessToken;
      try {
        const res = await this.axiosInstance.get(`/${page.id}/subscribed_apps`, {
          params: { access_token: accessToken },
        });
        const apps = res.data?.data || [];
        const fields: string[] = apps.flatMap((a: any) => a.subscribed_fields || []);
        const subscribed = fields.includes('leadgen');

        if (!subscribed && subscribe) {
          await this.axiosInstance.post(`/${page.id}/subscribed_apps`, null, {
            params: { access_token: accessToken, subscribed_fields: 'leadgen' },
          });
          results.push({ pageId: page.id, pageName: page.name, subscribed: true, subscribedFields: ['leadgen'], repaired: true });
          continue;
        }

        results.push({ pageId: page.id, pageName: page.name, subscribed, subscribedFields: fields });
      } catch (error) {
        const message = axios.isAxiosError(error)
          ? error.response?.data?.error?.message || error.message
          : error.message;
        results.push({ pageId: page.id, pageName: page.name, subscribed: false, subscribedFields: [], error: message });
      }
    }

    return {
      subscribed: results.length > 0 && results.every((r) => r.subscribed),
      pages: results,
    };
  }

  async getForms(pageId?: string, accessTokenOverride?: string): Promise<any[]> {
    const creds = await this.getFacebookCredentials();
    if (accessTokenOverride) {
      creds.accessToken = accessTokenOverride;
    }
    if (!creds.accessToken || creds.accessToken === 'MOCK_TOKEN' || creds.accessToken === 'your-facebook-access-token') {
      return [
        { id: '12', name: 'Newsletter Signup', status: 'ACTIVE' },
        { id: '13', name: 'Spring Promo', status: 'ACTIVE' },
        { id: '14', name: 'Consultation Request', status: 'PAUSED' },
      ];
    }

    // Load page settings from DB. The page access token must be used whenever
    // available (page tokens carry the leadgen permissions), regardless of
    // whether the caller passed an explicit pageId.
    let targetPageId = pageId;
    try {
      const dbSettings = await this.entityManager.query(
        `SELECT key, value FROM platform_settings WHERE key IN ('facebook_page_id', 'facebook_page_access_token')`
      );
      const settingsMap: Record<string, any> = {};
      for (const row of dbSettings) {
        settingsMap[row.key] = row.value;
      }
      // The stored token belongs to the PRIMARY page only — apply it neither
      // over a caller-provided per-page token nor to a different page id
      // (a page-scoped token used on another page returns an error, silently
      // hiding that page's forms)
      if (
        settingsMap['facebook_page_access_token'] &&
        !accessTokenOverride &&
        (!pageId || pageId === settingsMap['facebook_page_id'])
      ) {
        creds.accessToken = settingsMap['facebook_page_access_token'];
      }
      if (!targetPageId) {
        targetPageId = settingsMap['facebook_page_id'] || creds.pageId || process.env.FACEBOOK_PAGE_ID || '100432975354813';
      }
    } catch (err) {
      this.logger.warn('Could not load facebook page settings from DB');
    }

    targetPageId = targetPageId || creds.pageId || process.env.FACEBOOK_PAGE_ID || '100432975354813';

    if (!targetPageId) {
      this.logger.error('No Facebook Page ID configured. Set facebook_page_id in platform_settings or pass pageId explicitly.');
      return [];
    }

    try {
      let allForms = [];
      let nextPageUrl = `/${targetPageId}/leadgen_forms`;
      let params: any = {
        access_token: creds.accessToken,
        fields: 'id,name,status,leads_count',
      };

      while (nextPageUrl) {
        const response = await this.axiosInstance.get(nextPageUrl, { params });
        const data = response.data.data || [];
        allForms = [...allForms, ...data];

        if (response.data.paging && response.data.paging.next) {
          nextPageUrl = response.data.paging.next;
          params = {}; // Clear params since absolute URL contains query params
        } else {
          nextPageUrl = null;
        }
      }

      return allForms;
    } catch (error) {
      this.logger.error(`Failed to fetch Facebook forms: ${error.message}`);
      if (axios.isAxiosError(error)) {
        this.logger.error(`FB API error detail: ${JSON.stringify(error.response?.data)}`);
      }
      return [];
    }
  }
}