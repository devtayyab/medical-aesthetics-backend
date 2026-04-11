import React from "react";
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { notificationsAPI } from "./api";
import { toast } from "react-hot-toast";
import type { AppDispatch } from "@/store";
import { openDialer } from "@/store/slices/dialerSlice";

const firebaseConfig = {
  // Replace with your Firebase config
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id",
};

const app = initializeApp(firebaseConfig);

export const initializeFirebase = async (
  dispatch: AppDispatch
) => {
  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn("FCM is not supported in this environment (likely non-HTTPS or incompatible browser).");
      return;
    }

    const messaging = getMessaging(app);

    // Request permission for notifications
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey: "your-vapid-key", // Replace with your VAPID key
      });
      console.log("FCM Token:", token);

      // Send token to backend to associate with user
      await fetch("http://localhost:3001/notifications/register", {
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
        icon: isCallAction ? '📞' : '🔔'
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
