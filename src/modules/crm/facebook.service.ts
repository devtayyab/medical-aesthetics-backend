import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityManager } from 'typeorm';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';
import { extractLeadIdentity } from './facebook-lead-fields';

export interface FacebookLeadData {
  id: string;
  field_data?: Array<{
    name: string;
    values?: string[];
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
  facebookAdName?: string;
  lastMetaFormName?: string;
  lastMetaFormSubmittedAt?: Date;
  facebookLeadData: any;
  notes?: string;
}

@Injectable()
export class FacebookService {
  private readonly axiosInstance: AxiosInstance;
  private readonly apiVersion: string = 'v18.0';
  private readonly logger = new Logger(FacebookService.name);
  /** form id -> human form name, filled by every forms listing */
  private readonly formNameCache = new Map<string, string>();
  /** Graph API failures seen since the last clearApiErrors() (sync health) */
  private lastApiErrors: Array<{ at: Date; context: string; message: string; tokenInvalid: boolean }> = [];

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

    // No app secret configured: allow only outside production (local dev). In production an
    // unsigned webhook would let anyone inject leads.
    if (!creds.appSecret) {
      if (process.env.NODE_ENV === 'production') {
        this.logger.error('FACEBOOK_APP_SECRET not set - rejecting webhook (cannot verify signature)');
        return false;
      }
      this.logger.warn('FACEBOOK_APP_SECRET not set - skipping webhook signature check (non-production)');
      return true;
    }

    if (!signature) {
      this.logger.warn('No x-hub-signature-256 header found in webhook request - rejecting');
      return false;
    }

    // Facebook signs the exact raw request bytes; hash the raw body when available.
    const payloadBuffer = Buffer.isBuffer(payload)
      ? payload
      : Buffer.from(typeof payload === 'string' ? payload : JSON.stringify(payload), 'utf8');

    const expectedSignature = 'sha256=' + crypto.createHmac('sha256', creds.appSecret).update(payloadBuffer).digest('hex');

    const received = Buffer.from(String(signature));
    const expected = Buffer.from(expectedSignature);
    if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
      this.logger.warn('Facebook webhook signature mismatch - rejecting');
      return false;
    }
    return true;
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
      this.recordApiError(`lead ${leadId}`, error);
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
      this.recordApiError(`leads of form ${formId}`, error);
      if (axios.isAxiosError(error)) {
        throw new BadRequestException(
          `Facebook API error: ${error.response?.data?.error?.message || error.message}`,
        );
      }
      throw error;
    }
  }

  parseLeadData(leadData: FacebookLeadData, formNameOverride?: string): ParsedFacebookLead {
    const fields = Array.isArray(leadData?.field_data) ? leadData.field_data : [];
    const identity = extractLeadIdentity(fields);

    // Every answer that is not the person's name/email/phone goes into the notes
    const notes = identity.otherAnswers.length > 0
      ? identity.otherAnswers.map((a) => `${a.question}: ${a.answer}`).join('\n')
      : undefined;

    const submittedAt = leadData?.created_time ? new Date(leadData.created_time) : new Date();
    const formId = leadData?.form_id;
    const formName =
      formNameOverride ||
      (leadData as any)?.form_name ||
      (formId ? this.formNameCache.get(String(formId)) : undefined) ||
      (formId ? `Facebook Form ${formId}` : undefined);
    const adName = (leadData as any)?.ad_name || undefined;

    return {
      firstName: identity.firstName,
      lastName: identity.lastName,
      email: identity.email,
      phone: identity.phone,
      facebookLeadId: leadData?.id || '',
      facebookFormId: formId,
      facebookCampaignId: leadData?.campaign_id,
      facebookAdSetId: leadData?.adset_id,
      facebookAdId: leadData?.ad_id,
      facebookAdName: adName,
      lastMetaFormName: formName,
      lastMetaFormSubmittedAt: submittedAt,
      facebookLeadData: leadData,
      notes: notes,
    };
  }

  /**
   * Human form name ("Botox Athens - October") for a form id. Cached from the
   * forms listing; fetched once from the Graph API otherwise. Falls back to
   * undefined (callers then show "Facebook Form <id>").
   */
  async getFormName(formId?: string, accessTokenOverride?: string): Promise<string | undefined> {
    if (!formId) return undefined;
    const cached = this.formNameCache.get(String(formId));
    if (cached) return cached;
    try {
      const creds = await this.getFacebookCredentials();
      const res = await this.axiosInstance.get(`/${formId}`, {
        params: { access_token: accessTokenOverride || creds.accessToken, fields: 'name' },
      });
      const name = res.data?.name;
      if (name) this.formNameCache.set(String(formId), name);
      return name || undefined;
    } catch {
      return undefined;
    }
  }

  /** Errors from the last Graph API calls of the forms sweep (empty when healthy). */
  getLastApiErrors(): Array<{ at: Date; context: string; message: string; tokenInvalid: boolean }> {
    return [...this.lastApiErrors];
  }

  clearApiErrors(): void {
    this.lastApiErrors = [];
  }

  private recordApiError(context: string, error: any): void {
    const fbError = axios.isAxiosError(error) ? error.response?.data?.error : undefined;
    const message = fbError?.message || error?.message || 'Unknown Facebook API error';
    // Graph API code 190 = invalid/expired access token, 102 = session expired
    const tokenInvalid = fbError?.code === 190 || fbError?.code === 102 || /access token|session has expired/i.test(message);
    this.lastApiErrors.push({ at: new Date(), context, message, tokenInvalid });
    if (this.lastApiErrors.length > 20) this.lastApiErrors.shift();
  }

  /**
   * Checks that the configured access token still works (expired tokens are
   * the usual reason Facebook leads stop arriving).
   */
  async checkTokenValidity(): Promise<{ valid: boolean; message: string; expiresAt?: Date | null }> {
    const creds = await this.getFacebookCredentials();
    if (!creds.accessToken || creds.accessToken === 'your-facebook-access-token') {
      return { valid: false, message: 'No Facebook access token configured' };
    }
    if (creds.accessToken === 'MOCK_TOKEN') {
      return { valid: true, message: 'Mock token' };
    }
    try {
      // debug_token reports expiry and validity; it needs an app token, so fall back to /me
      if (creds.appId && creds.appSecret) {
        const res = await this.axiosInstance.get('/debug_token', {
          params: { input_token: creds.accessToken, access_token: `${creds.appId}|${creds.appSecret}` },
        });
        const data = res.data?.data || {};
        const expiresAt = data.expires_at ? new Date(Number(data.expires_at) * 1000) : null;
        if (!data.is_valid) {
          return { valid: false, message: data.error?.message || 'Access token is invalid or expired', expiresAt };
        }
        return { valid: true, message: 'Access token is valid', expiresAt };
      }
      await this.axiosInstance.get('/me', { params: { access_token: creds.accessToken, fields: 'id' } });
      return { valid: true, message: 'Access token is valid' };
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error?.message || error.message
        : error.message;
      return { valid: false, message };
    }
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

      for (const f of allForms) {
        if (f?.id && f?.name) this.formNameCache.set(String(f.id), f.name);
      }
      return allForms;
    } catch (error) {
      // Recorded (not only logged) so a broken token shows up as an error
      // instead of an empty, "healthy looking" forms list
      this.recordApiError(`forms of page ${targetPageId}`, error);
      this.logger.error(`Failed to fetch Facebook forms: ${error.message}`);
      if (axios.isAxiosError(error)) {
        this.logger.error(`FB API error detail: ${JSON.stringify(error.response?.data)}`);
      }
      return [];
    }
  }
}