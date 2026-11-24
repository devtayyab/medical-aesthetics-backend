import React from "react";
import { toast } from "react-hot-toast";
import type { AppDispatch } from "@/store";
import { openDialer } from "@/store/slices/dialerSlice";
import { Phone, Bell } from "lucide-react";
import { firebaseApp as app } from "@/config/firebase";
import { ENV } from "@/config/env";
import api from "@/services/api";
import { playNotificationSound } from "@/utils/notificationSound";

export type PushStatus =
  | "granted" // permission given: this device can receive push
  | "default" // not asked yet: needs the user to press "enable"
  | "denied" // blocked in the browser / phone settings
  | "needs-install" // iPhone / iPad: only works once added to the Home Screen
  | "unsupported" // browser has no web push
  | "not-configured"; // Firebase web config missing from this build

const isIos = () =>
  typeof navigator !== "undefined" &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches || (navigator as any).standalone === true);

const isConfigured = () =>
  Boolean(ENV.FIREBASE.API_KEY && ENV.FIREBASE.PROJECT_ID && ENV.FIREBASE.MESSAGING_SENDER_ID && ENV.FIREBASE.APP_ID);

/** Where this device stands with push notifications (no prompt is shown). */
export const getPushStatus = (): PushStatus => {
  if (typeof window === "undefined") return "unsupported";
  if (!isConfigured()) return "not-configured";
  // iOS exposes web push only to a site installed on the Home Screen (iOS 16.4+).
  if (isIos() && !isStandalone()) return "needs-install";
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) return "unsupported";
  return Notification.permission as PushStatus;
};

let foregroundAttached = false;

/** Registers this device's push token with the backend. Permission must already be granted. */
const registerPushToken = async (dispatch: AppDispatch): Promise<boolean> => {
  // Dynamic import to prevent premature SDK initialization
  const { getMessaging, getToken, onMessage, isSupported } = await import("firebase/messaging");
  if (!(await isSupported())) {
    console.warn("FCM is not supported in this environment (likely non-HTTPS or incompatible browser).");
    return false;
  }
  const messaging = getMessaging(app);

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
  if (!token) return false;

  // Send token to backend (shared api client: same auth as every other request)
  await api.post("/notifications/register", { token });

  if (!foregroundAttached) {
    foregroundAttached = true;
    // Handle foreground messages
    onMessage(messaging, (payload) => {
      const data = payload.data as any;
      const isCallAction = data?.trigger === "DIALER_CALLBACK";

      playNotificationSound();

      // Show clickable toast
      toast(
        (t) => (
          <div
            onClick={() => {
              toast.dismiss(t.id);
              if (isCallAction && data?.phoneNumber) {
                dispatch(
                  openDialer({
                    customerName: data.customerName || "Meta Lead",
                    phoneNumber: data.phoneNumber,
                    taskId: data.actionId || data.taskId || undefined,
                  }),
                );
              } else if (typeof data?.link === "string" && data.link.startsWith("/")) {
                window.location.assign(data.link);
              }
            }}
            className="cursor-pointer"
          >
            <div className="font-bold text-sm">{payload.notification?.title}</div>
            <div className="text-xs text-gray-500">{payload.notification?.body}</div>
            {isCallAction && <div className="mt-1 text-[10px] font-bold text-blue-600">Click to Call Now</div>}
          </div>
        ),
        {
          duration: isCallAction ? 10000 : 6000,
          icon: isCallAction ? <Phone className="h-4 w-4 text-blue-500" /> : <Bell className="h-4 w-4 text-indigo-500" />,
        },
      );

      dispatch({
        type: "notifications/addNotification",
        payload: {
          // Same id as the stored notification, so the bell never lists it twice
          id: data?.notificationId || payload.messageId,
          recipientId: "",
          type: "push",
          title: payload.notification?.title || "",
          message: payload.notification?.body || "",
          data: payload.data,
          isRead: false,
          isSent: true,
          sentAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      });
    });
  }
  return true;
};

/**
 * On login: (re)register the push token when the user has ALREADY allowed notifications.
 * It never shows the permission prompt: iPhone and Chrome only show it in response to a
 * tap, and silently refuse it otherwise. The prompt is raised by enablePushNotifications().
 */
export const initializeFirebase = async (dispatch: AppDispatch) => {
  try {
    if (getPushStatus() !== "granted") return;
    await registerPushToken(dispatch);
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
};

/**
 * Call directly from a click / tap handler ("Enable notifications" button). Asks for
 * permission and registers the device. Returns the resulting status.
 */
export const enablePushNotifications = async (dispatch: AppDispatch): Promise<PushStatus | "error"> => {
  const status = getPushStatus();
  if (status !== "default" && status !== "granted") return status;
  try {
    // Must be the first await: the browser only honours it while the tap is still "active".
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return permission as PushStatus;
    const ok = await registerPushToken(dispatch);
    return ok ? "granted" : "error";
  } catch (error) {
    console.error("Enabling push notifications failed:", error);
    return "error";
  }
};
