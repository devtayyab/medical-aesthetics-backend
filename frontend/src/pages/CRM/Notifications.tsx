import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCircle, Clock, Trash2, CheckCheck } from "lucide-react";
import { fetchNotifications, markAsRead, markAllAsRead } from "@/store/slices/notificationsSlice";
import type { RootState, AppDispatch } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/molecules/Card/Card";
import { Button } from "@/components/atoms/Button/Button";

export const Notifications: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { notifications, isLoading } = useSelector((state: RootState) => state.notifications);

    useEffect(() => {
        dispatch(fetchNotifications(50)); // Fetch last 50 notifications
    }, [dispatch]);

    const handleMarkAllRead = () => {
        dispatch(markAllAsRead());
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'appointment': return <Clock className="w-5 h-5 text-blue-600" />;
            case 'task': return <CheckCircle className="w-5 h-5 text-amber-600" />;
            default: return <Bell className="w-5 h-5 text-gray-600" />;
        }
    };

    const getBgColor = (type: string) => {
        switch (type) {
            case 'appointment': return 'bg-blue-50';
            case 'task': return 'bg-amber-50';
            default: return 'bg-gray-50';
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                    <p className="text-gray-500">Stay updated with your latest alerts and tasks</p>
                </div>
                <Button
                    variant="outline"
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-2"
                >
                    <CheckCheck className="w-4 h-4" />
                    Mark all as read
                </Button>
            </div>

            <Card className="border-none shadow-sm">
                <CardContent className="p-0 divide-y divide-gray-100">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-500">Loading notifications...</div>
                    ) : notifications.length === 0 ? (
                        <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                            <Bell className="w-12 h-12 text-gray-200 mb-4" />
                            <p className="font-medium text-lg">All caught up!</p>
                            <p className="text-sm">You have no new notifications.</p>
                        </div>
                    ) : (
                        notifications.map((notif) => (
                            <div
                                key={notif.id}
                                className={`p-4 flex gap-4 transition-colors hover:bg-gray-50 ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                                onClick={() => !notif.isRead && dispatch(markAsRead(notif.id))}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getBgColor(notif.type || 'general')}`}>
                                    {getIcon(notif.type || 'general')}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h3 className={`font-medium text-gray-900 ${!notif.isRead ? 'font-semibold' : ''}`}>
                                            {notif.title}
                                        </h3>
                                        <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                                </div>

                                {!notif.isRead && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" title="Unread" />
                                )}
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
