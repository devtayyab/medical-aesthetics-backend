import { initializeApp, getApps, getApp } from 'firebase/app';
import { ENV } from './env';

const firebaseConfig = {
  apiKey: ENV.FIREBASE.API_KEY || 'your-api-key',
  authDomain: ENV.FIREBASE.AUTH_DOMAIN || 'your-auth-domain',
  projectId: ENV.FIREBASE.PROJECT_ID || 'your-project-id',
  storageBucket: ENV.FIREBASE.STORAGE_BUCKET || 'your-storage-bucket',
  messagingSenderId: ENV.FIREBASE.MESSAGING_SENDER_ID || 'your-messaging-sender-id',
  appId: ENV.FIREBASE.APP_ID || 'your-app-id',
};

// Singleton pattern for Firebase App initialization
export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export default firebaseApp;
