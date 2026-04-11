import React from "react";
import { initializeApp } from "firebase/app";
import { notificationsAPI } from "./api";
import { toast } from "react-hot-toast";
import type { AppDispatch } from "@/store";
import { openDialer } from "@/store/slices/dialerSlice";
import { Phone, Bell } from "lucide-react";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "your-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-auth-domain",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-storage-bucket",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "your-messaging-sender-id",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "your-app-id",
};

const app = initializeApp(firebaseConfig);

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
    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey: "your-vapid-key", // Replace with your VAPID key
      });
      console.log("FCM Token:", token);

      // Send token to backend
      const apiUrl = import.meta.env.VITE_API_URL || "";
      await fetch(`${apiUrl}/notifications/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({ token }),
      });
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
                customerName: data.customerName || "Meta Lead",
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
        id: payload.messageId,
        recipientId: "", 
        type: "push",
        title: payload.notification?.title || "",
        message: payload.notification?.body || "",
        data: payload.data,
        isRead: false,
        isSent: true,
        sentAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      
      dispatch({
        type: "notifications/addNotification",
        payload: notification,
      });
    });
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
};
