import React from "react";
import { toast } from "react-hot-toast";
import type { AppDispatch } from "@/store";
import { openDialer } from "@/store/slices/dialerSlice";
import { Phone, Bell } from "lucide-react";
import { firebaseApp as app } from "@/config/firebase";
import { ENV } from "@/config/env";
import api from "@/services/api";

export const initializeFirebase = async (
 dispatch: AppDispatch
) => {
 try {
 // Dynamic import to prevent premature SDK initialization
 const { getMessaging, getToken, onMessage, isSupported } = await import("firebase/messaging");
 
 const supported = await isSupported();
 if (!supported) {
 console.warn("FCM is not supported in this environment (likely non-HTTPS or incompatible browser).");
 return;
 }

 const messaging = getMessaging(app);

 // Request permission for notifications
 if (!("Notification" in window)) {
 console.warn("This browser does not support notifications.");
 return;
 }

 const permission = await Notification.requestPermission();
 if (permission ==="granted" && "serviceWorker" in navigator) {
 // Register the messaging service worker from the site root (frontend/public) and pass
 // the web config in the URL, since a service worker cannot read Vite env variables.
 const swParams = new URLSearchParams({
 apiKey: ENV.FIREBASE.API_KEY,
 authDomain: ENV.FIREBASE.AUTH_DOMAIN,
 projectId: ENV.FIREBASE.PROJECT_ID,
 storageBucket: ENV.FIREBASE.STORAGE_BUCKET,
 messagingSenderId: ENV.FIREBASE.MESSAGING_SENDER_ID,
 appId: ENV.FIREBASE.APP_ID,
 });
 const registration = await navigator.serviceWorker.register(
 `/firebase-messaging-sw.js?${swParams.toString()}`,
 { scope: "/firebase-cloud-messaging-push-scope" },
 );

 const token = await getToken(messaging, {
 vapidKey: ENV.FIREBASE.VAPID_KEY || undefined,
 serviceWorkerRegistration: registration,
 });

 // Send token to backend (shared api client: same auth as every other request)
 if (token) {
 await api.post("/notifications/register", { token });
 }
 }

 // Handle foreground messages
 onMessage(messaging, (payload) => {
 console.log("Message received:", payload);
 const data = payload.data as any;
 const isCallAction = data?.trigger === 'DIALER_CALLBACK';

 // Show clickable toast
 toast((t) => (
 <div 
 onClick={() => {
 toast.dismiss(t.id);
 if (isCallAction && data?.phoneNumber) {
 dispatch(openDialer({
 customerName: data.customerName ||"Meta Lead",
 phoneNumber: data.phoneNumber,
 taskId: data.actionId || data.taskId || undefined
 }));
 }
 }}
 className="cursor-pointer"
 >
 <div className="font-bold text-sm">{payload.notification?.title}</div>
 <div className="text-xs text-gray-500">{payload.notification?.body}</div>
 {isCallAction && (
 <div className="mt-1 text-[10px] font-bold text-blue-600">Click to Call Now</div>
 )}
 </div>
 ), {
 duration: isCallAction ? 10000 : 4000,
 icon: isCallAction ? <Phone className="h-4 w-4 text-blue-500" /> : <Bell className="h-4 w-4 text-indigo-500" />
 });

 const notification = {
 // Same id as the stored notification, so the bell never lists it twice
 id: data?.notificationId || payload.messageId,
 recipientId:"", 
 type:"push",
 title: payload.notification?.title ||"",
 message: payload.notification?.body ||"",
 data: payload.data,
 isRead: false,
 isSent: true,
 sentAt: new Date().toISOString(),
 createdAt: new Date().toISOString(),
 };
 
 dispatch({
 type:"notifications/addNotification",
 payload: notification,
 });
 });
 } catch (error) {
 console.error("Firebase initialization error:", error);
 }
};
