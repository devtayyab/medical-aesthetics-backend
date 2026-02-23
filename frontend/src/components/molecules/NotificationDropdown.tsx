import React, { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Bell, CheckCircle, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { css } from "@emotion/css";
import type { RootState, AppDispatch } from "@/store";
import { fetchNotifications, markAsRead, markAllAsRead } from "@/store/slices/notificationsSlice";

const dropdownStyle = css`
  position: absolute;
  top: calc(100% + 10px);
  right: -10px;
  width: 360px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  overflow: hidden;
  max-height: 500px;
  display: flex;
  flex-direction: column;

  @media (max-width: 480px) {
    width: 300px;
    right: -60px;
  }
`;

const headerStyle = css`
  padding: 16px;
  border-bottom: 1px solid #edf2f7;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
`;

const scrollAreaStyle = css`
  overflow-y: auto;
  flex: 1;
`;

const notificationItemStyle = (isRead: boolean) => css`
  padding: 12px 16px;
  border-bottom: 1px solid #edf2f7;
  cursor: pointer;
  transition: background 0.2s;
  background: ${isRead ? 'white' : '#f0f9ff'};
  display: flex;
  gap: 12px;
  &:hover {
    background: #f7fafc;
  }
`;

const iconContainerStyle = (type: string) => css`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  ${type === 'appointment' ? 'background: #e0f2fe; color: #0284c7;' :
        type === 'task' ? 'background: #fef3c7; color: #d97706;' :
            'background: #f1f5f9; color: #475569;'}
`;

interface NotificationDropdownProps {
    isOpen: boolean;
    onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { notifications } = useSelector((state: RootState) => state.notifications);
    const { user } = useSelector((state: RootState) => state.auth);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const getNotificationsLink = () => {
        if (['clinic_owner', 'doctor', 'secretariat'].includes(user?.role || '')) {
            return '/clinic/my-notifications';
        }
        return '/crm/notifications';
    };

    const handleMarkAllRead = () => {
        dispatch(markAllAsRead());
    };

    useEffect(() => {
        if (isOpen) {
            dispatch(fetchNotifications(10));
        }
    }, [isOpen, dispatch]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const getIcon = (type: string) => {
        switch (type) {
            case 'appointment': return <Clock size={18} />;
            case 'task': return <CheckCircle size={18} />;
            default: return <Bell size={18} />;
        }
    };

    return (
        <div className={dropdownStyle} ref={dropdownRef}>
            <div className={headerStyle}>
                <h3 className="font-bold text-gray-900">Notifications</h3>
                <span
                    className="text-xs text-blue-600 font-medium cursor-pointer hover:underline"
                    onClick={handleMarkAllRead}
                >
                    Mark all as read
                </span>
            </div>

            <div className={scrollAreaStyle}>
                {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <Bell className="mx-auto h-8 w-8 opacity-20 mb-2" />
                        <p className="text-sm">No new notifications</p>
                    </div>
                ) : (
                    notifications.map((notif) => (
                        <div
                            key={notif.id}
                            className={notificationItemStyle(notif.isRead)}
                            onClick={() => !notif.isRead && dispatch(markAsRead(notif.id))}
                        >
                            <div className={iconContainerStyle(notif.type || 'general')}>
                                {getIcon(notif.type || 'general')}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-2">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{notif.title}</p>
                                    {!notif.isRead && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />}
                                </div>
                                <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">{notif.message}</p>
                                <p className="text-[10px] text-gray-400 mt-1">
                                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-3 bg-gray-50 text-center border-t border-gray-100">
                <Link
                    to={getNotificationsLink()}
                    className="text-xs font-bold text-gray-600 hover:text-black"
                    onClick={onClose}
                >
                    View all notifications
                </Link>
            </div>
        </div>
    );
};
