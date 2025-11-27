import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { useDispatch } from "react-redux";
import { notificationsAPI } from "./api";

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
const messaging = getMessaging(app);

export const initializeFirebase = async (
  dispatch: ReturnType<typeof useDispatch>
) => {
  try {
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
      const notification = {
        id: payload.messageId,
        recipientId: "", // Set based on user context
        type: "push",
        title: payload.notification?.title || "",
        message: payload.notification?.body || "",
        data: payload.data,
        isRead: false,
        isSent: true,
        sentAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      // Dispatch to notifications slice (assumes you have an action to add notifications)
      dispatch({
        type: "notifications/addNotification",
        payload: notification,
      });
    });
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
};
