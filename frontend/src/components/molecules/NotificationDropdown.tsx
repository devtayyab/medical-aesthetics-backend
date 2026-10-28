import React, { useEffect, useRef } from"react";
import { useSelector, useDispatch } from"react-redux";
import { Link, useNavigate } from "react-router-dom";
import { Bell, CheckCircle, Clock, ExternalLink } from"lucide-react";
import { css } from"@emotion/css";
import type { RootState, AppDispatch } from"@/store";
import { fetchNotifications, markAsRead, markAllAsRead, fetchUnreadCount } from"@/store/slices/notificationsSlice";
import { openDialer } from"@/store/slices/dialerSlice";

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
 max-height: min(600px, calc(100vh - 100px));
 display: flex;
 flex-direction: column;
 animation: slide-in 0.2s ease-out;

 @keyframes slide-in {
 from { transform: translateY(-10px); opacity: 0; }
 to { transform: translateY(0); opacity: 1; }
 }

 @media (max-width: 480px) {
 position: fixed;
 top: 70px;
 left: 16px;
 right: 16px;
 width: calc(100vw - 32px);
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
 const navigate = useNavigate();
 const dispatch = useDispatch<AppDispatch>();
 const { notifications } = useSelector((state: RootState) => state.notifications);
 const { user } = useSelector((state: RootState) => state.auth);
 const dropdownRef = useRef<HTMLDivElement>(null);

 const getNotificationsLink = () => {
 const role = user?.role || '';
 if (['clinic_owner', 'doctor', 'secretariat'].includes(role)) {
 return '/clinic/my-notifications';
 }
 if (['salesperson', 'manager', 'admin', 'SUPER_ADMIN'].includes(role)) {
 return '/crm/notifications';
 }
 return '/notifications';
 };

 // Opening the bell marks everything read (counter back to 0); the items stay listed.
 useEffect(() => {
 if (!isOpen) return;
 let cancelled = false;
 (async () => {
 try {
 await dispatch(fetchNotifications(20));
 if (!cancelled) await dispatch(markAllAsRead());
 } catch {
 dispatch(fetchUnreadCount());
 }
 })();
 return () => {
 cancelled = true;
 };
 }, [isOpen, dispatch]);

 const formatAthens = (value: string) =>
 new Date(value).toLocaleString('el-GR', {
 timeZone: 'Europe/Athens',
 day: '2-digit',
 month: '2-digit',
 year: 'numeric',
 hour: '2-digit',
 minute: '2-digit',
 hour12: false,
 });

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
 <h3 className="text-lg font-black uppercase tracking-tighter text-gray-900 leading-none truncate">Ειδοποιήσεις</h3>
 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 truncate">Ενημερώσεις</p>
 </div>

 </div>

 <div className={scrollAreaStyle}>
 {notifications.length === 0 ? (
 <div className="py-20 text-center flex flex-col items-center justify-center px-8">
 <div className="size-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
 <Bell className="text-gray-200" size={32} />
 </div>
 <p className="text-sm font-black uppercase tracking-tighter text-gray-400">Δεν υπάρχουν ειδοποιήσεις</p>
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
 
 // Old Logic: Navigate to customer detail page
 const data = notif.data as any;
 const cid = data?.customerId || data?.leadId;
 if (cid) {
 navigate(`/crm/customer/${cid}`);
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
 {formatAthens(notif.createdAt)}
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
 Όλες οι ειδοποιήσεις
 <ExternalLink size={14} />
 </Link>
 </div>
 </div>
 );
};
