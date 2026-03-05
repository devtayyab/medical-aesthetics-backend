import React, { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { Bell, CheckCircle, Clock, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { css } from "@emotion/css";
import type { RootState, AppDispatch } from "@/store";
import { fetchNotifications, markAsRead, markAllAsRead, fetchUnreadCount } from "@/store/slices/notificationsSlice";

const dropdownStyle = css`
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  width: 400px;
  background: white;
  border-radius: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
  border: 1px solid #f0f0f0;
  z-index: 1001;
  overflow: hidden;
  max-height: 600px;
  display: flex;
  flex-direction: column;
  animation: slide-in 0.2s ease-out;

  @keyframes slide-in {
    from { transform: translateY(-10px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  @media (max-width: 480px) {
    width: calc(100vw - 32px);
    right: 0;
    left: auto;
  }
`;

const headerStyle = css`
  padding: 24px;
  border-bottom: 1px solid #f7f7f7;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
`;

const scrollAreaStyle = css`
  overflow-y: auto;
  flex: 1;
  background: #fdfdfd;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 10px;
  }
`;

const notificationItemStyle = (isRead: boolean) => css`
  padding: 20px 24px;
  border-bottom: 1px solid #f7f7f7;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  background: ${isRead ? 'white' : '#f8faf4'};
  display: flex;
  gap: 16px;
  position: relative;
  
  &:hover {
    background: ${isRead ? '#fcfcfc' : '#f3f9e4'};
    transform: scale(0.995);
  }
`;

interface NotificationDropdownProps {
    isOpen: boolean;
    onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { notifications, isLoading } = useSelector((state: RootState) => state.notifications);
    const { user } = useSelector((state: RootState) => state.auth);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const getNotificationsLink = () => {
        if (['clinic_owner', 'doctor', 'secretariat'].includes(user?.role || '')) {
            return '/clinic/my-notifications';
        }
        return '/crm/notifications';
    };

    const handleMarkAllRead = async (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.nativeEvent.stopImmediatePropagation) {
            e.nativeEvent.stopImmediatePropagation();
        }

        if (isLoading) return;

        try {
            await dispatch(markAllAsRead()).unwrap();
            await dispatch(fetchNotifications(10));
        } catch (err) {
            console.error("Failed to mark all as read:", err);
        }
    };

    useEffect(() => {
        if (isOpen) {
            dispatch(fetchNotifications(10));
            dispatch(fetchUnreadCount());
        }
    }, [isOpen, dispatch]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            const timer = setTimeout(() => {
                document.addEventListener('mousedown', handleClickOutside);
            }, 0);
            return () => {
                clearTimeout(timer);
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className={dropdownStyle}
            ref={dropdownRef}
            onClick={(e) => {
                e.stopPropagation();
            }}
            onMouseDown={(e) => {
                e.stopPropagation();
            }}
        >
            <div className={headerStyle}>
                <div className="flex-1 min-w-0 pr-4">
                    <h3 className="text-lg font-black uppercase italic tracking-tighter text-gray-900 leading-none truncate">Activity</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 truncate">Updates & Alerts</p>
                </div>
                <div
                    role="button"
                    tabIndex={0}
                    className="flex-shrink-0 text-[10px] font-black uppercase tracking-widest text-[#CBFF38] hover:bg-white/10 transition-all bg-black px-4 py-2 rounded-full cursor-pointer disabled:opacity-50 border border-transparent hover:border-[#CBFF38]/20 select-none"
                    onClick={handleMarkAllRead}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            handleMarkAllRead(e as any);
                        }
                    }}
                >
                    {isLoading ? '...' : 'Clear All'}
                </div>
            </div>

            <div className={scrollAreaStyle}>
                {notifications.length === 0 ? (
                    <div className="py-20 text-center flex flex-col items-center justify-center px-8">
                        <div className="size-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                            <Bell className="text-gray-200" size={32} />
                        </div>
                        <p className="text-sm font-black uppercase tracking-tighter text-gray-400">All caught up</p>
                        <p className="text-xs text-gray-300 mt-2">No new notifications at the moment.</p>
                    </div>
                ) : (
                    notifications.map((notif) => (
                        <div
                            key={notif.id}
                            className={notificationItemStyle(notif.isRead)}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!notif.isRead) {
                                    dispatch(markAsRead(notif.id));
                                }
                                onClose();
                            }}
                        >
                            <div className="relative shrink-0">
                                <div className={`size-12 rounded-2xl flex items-center justify-center ${notif.isRead ? 'bg-gray-50 text-gray-400' : 'bg-white text-black shadow-sm'}`}>
                                    {notif.type === 'appointment' ? <Clock size={20} /> :
                                        notif.type === 'task' ? <CheckCircle size={20} /> : <Bell size={20} />}
                                </div>
                                {!notif.isRead && (
                                    <div className="absolute -top-1 -right-1 size-3 bg-[#CBFF38] rounded-full border-2 border-[#f8faf4]" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <p className={`text-sm tracking-tight ${notif.isRead ? 'font-bold text-gray-500' : 'font-black text-gray-900'}`}>
                                        {notif.title}
                                    </p>
                                    <p className="text-[10px] font-bold text-gray-400 shrink-0 ml-4">
                                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: false })}
                                    </p>
                                </div>
                                <p className={`text-xs mt-1 leading-relaxed ${notif.isRead ? 'text-gray-400' : 'text-gray-600 font-medium'}`}>
                                    {notif.message}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-6 bg-white border-t border-[#f7f7f7]">
                <Link
                    to={getNotificationsLink()}
                    onClick={onClose}
                    className="w-full h-14 bg-gray-900 text-[#CBFF38] hover:bg-black transition-all rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-xs decoration-none"
                    style={{ textDecoration: 'none' }}
                >
                    Expand Feed
                    <ExternalLink size={14} />
                </Link>
            </div>
        </div>
    );
};
