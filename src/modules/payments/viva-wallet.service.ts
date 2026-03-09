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

    constructor() {
        this.apiUrl = process.env.VIVA_API_URL || 'https://demo-api.vivapayments.com';
        this.accountsUrl = process.env.VIVA_ACCOUNTS_URL || 'https://demo-accounts.vivapayments.com';
        this.clientId = process.env.VIVA_CLIENT_ID;
        this.clientSecret = process.env.VIVA_CLIENT_SECRET;
        this.merchantId = process.env.VIVA_MERCHANT_ID;
        this.sourceCode = process.env.VIVA_SOURCE_CODE || 'Default';
    }

    async getAccessToken(): Promise<string> {
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
            return response.data.access_token;
        } catch (error) {
            console.error('Viva Wallet Auth Error:', error.response?.data || error.message);
            throw new InternalServerErrorException('Failed to authenticate with Viva Wallet');
        }
    }

    async createPaymentOrder(params: {
        amount: number;
        customerEmail: string;
        customerPhone: string;
        customerName: string;
        merchantTrns: string; // Internal Order ID / Appointment ID
    }): Promise<string> {
        try {
            const token = await this.getAccessToken();
            const response = await axios.post(
                `${this.apiUrl}/checkout/v2/orders`,
                {
                    amount: Math.round(params.amount * 100), // In cents
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
                    // Where Viva redirects after payment completes
                    // In development: http://localhost:5173/payment/success
                    // In production: https://yourdomain.com/payment/success
                    successUrl: `${process.env.APP_FRONTEND_URL || 'http://localhost:5173'}/payment/success`,
                    failureUrl: `${process.env.APP_FRONTEND_URL || 'http://localhost:5173'}/payment/failure`,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            // Return the orderCode or complete redirect URL
            // Viva Wallet smart checkout URL format: 
            // Sandbox: https://demo.vivapayments.com/web/checkout?ref={orderCode}
            // Production: https://www.vivapayments.com/web/checkout?ref={orderCode}
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

    /**
     * Verify a completed transaction by its ID.
     * Called after the success redirect to confirm the payment is genuine.
     */
    async verifyTransaction(transactionId: string): Promise<any> {
        try {
            const token = await this.getAccessToken();
            const response = await axios.get(
                `${this.apiUrl}/checkout/v2/transactions/${transactionId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                },
            );
            return response.data;
        } catch (error) {
            console.error('Viva Wallet Verify Transaction Error:', error.response?.data || error.message);
            return null;
        }
    }
}
