import React from "react";
import { NotificationCard } from "@/components/molecules/NotificationCard";
import type { Notification } from "@/types";

interface NotificationBannerProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  notifications,
  onMarkAsRead,
}) => {
  return (
    <div className="flex flex-col gap-4">
      {notifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onMarkAsRead={onMarkAsRead}
        />
      ))}
    </div>
  );
};
