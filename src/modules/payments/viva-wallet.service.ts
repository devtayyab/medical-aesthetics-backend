import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class VivaWalletService {
    private readonly apiUrl: string;
    private readonly accountsUrl: string;
    private readonly clientId: string;
    private readonly clientSecret: string;
    private readonly merchantId: string;
    private readonly sourceCode: string;

    private readonly apiKey: string;

    constructor() {
        this.apiUrl = process.env.VIVA_API_URL || 'https://demo-api.vivapayments.com';
        this.accountsUrl = process.env.VIVA_ACCOUNTS_URL || 'https://demo-accounts.vivapayments.com';
        this.clientId = process.env.VIVA_CLIENT_ID;
        this.clientSecret = process.env.VIVA_CLIENT_SECRET;
        this.merchantId = process.env.VIVA_MERCHANT_ID;
        this.apiKey = process.env.VIVA_API_KEY;
        this.sourceCode = process.env.VIVA_SOURCE_CODE || 'Default';
    }

    /**
     * Get the appropriate authorization header value based on available credentials.
     * Prefers OAuth2 (Bearer token) if Client ID/Secret are present,
     * otherwise falls back to Basic Auth (Merchant ID/API Key).
     */
    async getAuthHeader(): Promise<string> {
        // Option 1: Prefer OAuth2 (if Client ID & Secret are available)
        if (this.clientId && this.clientSecret) {
            try {
                const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
                const response = await axios.post(
                    `${this.accountsUrl}/connect/token`,
                    'grant_type=client_credentials',
                    {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            Authorization: `Basic ${auth}`,
                        },
                    },
                );
                return `Bearer ${response.data.access_token}`;
            } catch (error) {
                console.error('Viva Wallet OAuth Error (falling back):', error.response?.data || error.message);
            }
        }

        // Option 2: Fallback to Basic Auth (Merchant ID & API Key)
        if (this.merchantId && this.apiKey) {
            const auth = Buffer.from(`${this.merchantId}:${this.apiKey}`).toString('base64');
            return `Basic ${auth}`;
        }

        throw new InternalServerErrorException('No valid Viva Wallet credentials found (need ClientID/Secret or MerchantID/APIKey)');
    }

    async createPaymentOrder(params: {
        amount: number;
        customerEmail: string;
        customerPhone: string;
        customerName: string;
        merchantTrns: string;
    }): Promise<string> {
        try {
            const authHeader = await this.getAuthHeader();
            const response = await axios.post(
                `${this.apiUrl}/checkout/v2/orders`,
                {
                    amount: Math.round(params.amount * 100),
                    customerTrns: params.customerName,
                    customer: {
                        email: params.customerEmail,
                        fullName: params.customerName,
                        phone: params.customerPhone,
                    },
                    paymentTimeout: 1800,
                    preauth: false,
                    allowRecurring: false,
                    actionUser: params.customerName,
                    disableCash: true,
                    disablePayAtHome: true,
                    merchantTrns: params.merchantTrns,
                    sourceCode: this.sourceCode,
                    successUrl: `${process.env.APP_FRONTEND_URL || 'http://localhost:5173'}/payment/success`,
                    failureUrl: `${process.env.APP_FRONTEND_URL || 'http://localhost:5173'}/payment/failure`,
                },
                {
                    headers: {
                        Authorization: authHeader,
                    },
                },
            );

            const orderCode = response.data.orderCode;
            const checkoutBaseUrl = this.apiUrl.includes('demo')
                ? 'https://demo.vivapayments.com/web/checkout'
                : 'https://www.vivapayments.com/web/checkout';

            return `${checkoutBaseUrl}?ref=${orderCode}`;
        } catch (error) {
            console.error('Viva Wallet Order Creation Error:', error.response?.data || error.message);
            throw new InternalServerErrorException('Failed to create payment order with Viva Wallet');
        }
    }

    async verifyTransaction(transactionId: string): Promise<any> {
        try {
            const authHeader = await this.getAuthHeader();
            const response = await axios.get(
                `${this.apiUrl}/checkout/v2/transactions/${transactionId}`,
                {
                    headers: { Authorization: authHeader },
                },
            );
            return response.data;
        } catch (error) {
            console.error('Viva Wallet Verify Transaction Error:', error.response?.data || error.message);
            return null;
        }
    }

}
