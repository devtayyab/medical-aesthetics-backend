import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

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
  private readonly accessToken: string;
  private readonly apiVersion: string = 'v18.0';

  constructor(private configService: ConfigService) {
    this.accessToken = this.configService.get<string>('FACEBOOK_ACCESS_TOKEN');
    this.axiosInstance = axios.create({
      baseURL: `https://graph.facebook.com/${this.apiVersion}`,
      timeout: 10000,
    });
  }

  async getLead(leadId: string): Promise<FacebookLeadData> {
    if (leadId.startsWith('mock_') || this.accessToken === 'MOCK_TOKEN') {
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
          access_token: this.accessToken,
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

  async getLeadsByForm(formId: string, limit: number = 50): Promise<FacebookLeadData[]> {
    if (this.accessToken === 'MOCK_TOKEN' || this.accessToken === 'your-facebook-access-token') {
      return Array(limit).fill(null).map((_, i) => ({
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
      const response = await this.axiosInstance.get(`/leads`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,field_data,created_time,ad_id,adset_id,campaign_id,form_id',
          limit,
        },
      });

      return response.data.data || [];
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
    try {
      if (this.accessToken === 'MOCK_TOKEN' || this.accessToken === 'your-facebook-access-token') {
        return {
          success: true,
          message: 'Facebook API connection successful (MOCK MODE). Connected as: Mock User',
        };
      }

      // Test the connection by making a simple API call to verify the access token
      const response = await this.axiosInstance.get('/me', {
        params: {
          access_token: this.accessToken,
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
  async getForms(): Promise<any[]> {
    // Mock implementation since we don't have page access tokens configured
    return [
      { id: '12', name: 'Newsletter Signup', status: 'ACTIVE' },
      { id: '13', name: 'Spring Promo', status: 'ACTIVE' },
      { id: '14', name: 'Consultation Request', status: 'PAUSED' },
    ];
  }
}