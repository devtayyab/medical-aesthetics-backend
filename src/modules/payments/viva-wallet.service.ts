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
        if (this.clientId && this.clientSecret && this.clientId !== 'your-viva-client-id') {
            console.log('[Viva Wallet] Attempting OAuth2 authentication...');
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
                console.log('[Viva Wallet] OAuth2 token obtained successfully.');
                return `Bearer ${response.data.access_token}`;
            } catch (error) {
                console.error('[Viva Wallet] OAuth2 authentication FAILED:', error.response?.data || error.message);
            }
        }

        // Option 2: Fallback to Basic Auth (Merchant ID & API Key)
        if (this.merchantId && this.apiKey && this.merchantId !== 'your-viva-merchant-id') {
            console.log('[Viva Wallet] Using Basic Auth with Merchant ID and API Key.');
            const auth = Buffer.from(`${this.merchantId}:${this.apiKey}`).toString('base64');
            return `Basic ${auth}`;
        }

        console.error('[Viva Wallet] No valid credentials found in .env');
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
                    ...(this.sourceCode && this.sourceCode !== 'Default' ? { sourceCode: this.sourceCode } : {}),
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

    /**
     * Clinic ka IBAN number par payout bhejo.
     * Yeh Viva Wallet ka "Send Money to Bank Account" API use karta hai.
     *
     * @param params.amount     - Amount in EUR (e.g. 150.00)
     * @param params.iban       - Clinic ka IBAN (e.g. "GR1601101250000000012300695")
     * @param params.fullName   - Clinic / Account Holder ka naam
     * @param params.reference  - Hamare system ka reference (appointmentId wagera)
     */
    async sendPayoutToIban(params: {
        amount: number;
        iban: string;
        fullName: string;
        reference: string;
    }): Promise<{ success: boolean; transactionId?: string; error?: string }> {
        try {
            const authHeader = await this.getAuthHeader();

            console.log(`[Viva Payout] Initiating IBAN payout: amount=${params.amount}, iban=${params.iban}, ref=${params.reference}`);

            const response = await axios.post(
                `${this.apiUrl}/api/v1/transfers`,
                {
                    amount: Math.round(params.amount * 100), // cents mein
                    description: `Clinic Payout - Ref: ${params.reference}`,
                    beneficiary: {
                        name: params.fullName,
                        iban: params.iban.replace(/\s+/g, ''), // spaces hatao
                    },
                    merchantReference: params.reference,
                },
                {
                    headers: { Authorization: authHeader },
                },
            );

            const transactionId = response.data?.transactionId || response.data?.id;
            console.log(`[Viva Payout] ✅ Payout successful! TransactionId: ${transactionId}`);

            return { success: true, transactionId };
        } catch (error) {
            const errMsg = error.response?.data?.message || error.message;
            console.error('[Viva Payout] ❌ Payout FAILED:', error.response?.data || error.message);
            // Silently fail — payout log rakho, throw mat karo taake appointment confirm ho jaye
            return { success: false, error: errMsg };
        }
    }

}

