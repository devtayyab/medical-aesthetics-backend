import React from "react";
import { Card } from "@/components/atoms/Card/Card";
import { Button } from "@/components/atoms/Button/Button";
import type { Notification } from "@/types";

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onMarkAsRead,
}) => {
  return (
    <Card className="p-4">
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold">{notification.title}</h3>
        <p className="text-gray-600">{notification.message}</p>
        <p className="text-gray-600">
          {new Date(notification.createdAt).toLocaleString()}
        </p>
        {!notification.read && onMarkAsRead && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMarkAsRead(notification.id)}
          >
            Mark as Read
          </Button>
        )}
      </div>
    </Card>
  );
};
