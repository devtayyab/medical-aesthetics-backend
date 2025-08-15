import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
  private readonly logger = new Logger(FirebaseService.name);

  constructor() {
    // Initialize Firebase Admin SDK
    if (!admin.apps.length) {
      const serviceAccount = {
        // Add your Firebase service account credentials here
        // In production, use environment variables
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      };

      try {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        });
      } catch (error) {
        this.logger.warn('Firebase initialization skipped - credentials not provided');
      }
    }
  }

  async sendPushNotification(
    token: string,
    title: string,
    message: string,
    data?: any,
  ): Promise<string> {
    try {
      if (!admin.apps.length) {
        this.logger.warn('Firebase not initialized - push notification not sent');
        return 'firebase-not-initialized';
      }

      const payload = {
        notification: {
          title,
          body: message,
        },
        data: data ? JSON.stringify(data) : undefined,
        token,
      };

      const response = await admin.messaging().send(payload);
      this.logger.log(`Push notification sent successfully: ${response}`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to send push notification: ${error.message}`);
      throw error;
    }
  }

  async sendToMultipleTokens(
    tokens: string[],
    title: string,
    message: string,
    data?: any,
  ): Promise<admin.messaging.BatchResponse> {
    try {
      if (!admin.apps.length) {
        this.logger.warn('Firebase not initialized - push notifications not sent');
        return null;
      }

      const payload = {
        notification: {
          title,
          body: message,
        },
        data: data ? JSON.stringify(data) : undefined,
        tokens,
      };

      const response = await admin.messaging().sendMulticast(payload);
      this.logger.log(`Batch push notifications sent: ${response.successCount}/${tokens.length}`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to send batch push notifications: ${error.message}`);
      throw error;
    }
  }
}