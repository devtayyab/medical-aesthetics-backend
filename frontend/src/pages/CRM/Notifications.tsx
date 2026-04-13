import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCircle, Clock, CheckCheck } from "lucide-react";
import { fetchNotifications, markAsRead, markAllAsRead } from "@/store/slices/notificationsSlice";
import type { RootState, AppDispatch } from "@/store";
import { Card, CardContent } from "@/components/molecules/Card/Card";
import { useNavigate } from "react-router-dom";
import { openDialer } from "@/store/slices/dialerSlice";

export const Notifications: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { notifications, isLoading } = useSelector((state: RootState) => state.notifications);

    useEffect(() => {
        dispatch(fetchNotifications(50)); // Fetch last 50 notifications
    }, [dispatch]);


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
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Minimal Header */}
            <div className="relative pt-8 pb-16 px-6 md:px-10 border-b border-gray-100 bg-white">
                <div className="max-w-4xl mx-auto relative z-10">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                                <div className="size-1.5 rounded-full bg-blue-500" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 italic">Alert Registry</span>
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-none text-gray-900">Notifications</h1>
                                <p className="text-gray-500 font-medium max-w-md text-sm">Review your latest clinical alerts and system updates.</p>
                            </div>
                        </div>
                        
                        <button
                            onClick={async (e) => {
                                e.preventDefault();
                                await dispatch(markAllAsRead());
                            }}
                            disabled={isLoading}
                            className="h-12 px-6 bg-black text-[#CBFF38] rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-[#CBFF38] hover:text-black transition-all shadow-lg flex items-center gap-3 disabled:opacity-20"
                        >
                            <CheckCheck size={16} />
                            {isLoading ? "Syncing..." : "Clear All Registry"}
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 mt-10 pb-20">
                {isLoading && notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="size-10 border-4 border-[#CBFF38] border-t-transparent rounded-full animate-spin" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Accessing notification protocols...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 border border-gray-100 shadow-sm flex flex-col items-center text-center">
                        <div className="size-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-200 mb-6">
                            <Bell size={32} />
                        </div>
                        <h3 className="text-lg font-black uppercase italic tracking-tighter text-gray-900 mb-2">Registry Empty</h3>
                        <p className="text-sm text-gray-400 font-medium max-w-xs uppercase italic text-[10px]">You have no active alerts in the system core at this moment.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {notifications.map((notif) => (
                            <div
                                key={notif.id}
                                onClick={() => {
                                    if (!notif.isRead) dispatch(markAsRead(notif.id));
                                    const data = notif.data as any;
                                    const cid = data?.customerId || data?.leadId;
                                    if (cid) navigate(`/crm/customer/${cid}`);
                                }}
                                className={`group bg-white rounded-2xl p-5 border transition-all cursor-pointer relative overflow-hidden ${
                                    !notif.isRead 
                                    ? 'border-[#CBFF38] shadow-md shadow-lime-500/5' 
                                    : 'border-gray-100 hover:border-black shadow-sm'
                                }`}
                            >
                                {!notif.isRead && (
                                    <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none">
                                        <div className="absolute top-2 right-2 size-2 bg-[#CBFF38] rounded-full shadow-[0_0_10px_rgba(203,255,56,0.8)]" />
                                    </div>
                                )}
                                
                                <div className="flex gap-5 items-start">
                                    <div className={`size-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                                        !notif.isRead ? 'bg-black text-[#CBFF38]' : 'bg-gray-50 text-gray-400 group-hover:bg-black group-hover:text-[#CBFF38]'
                                    }`}>
                                        {getIcon(notif.type || 'general')}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 mb-2">
                                            <h3 className={`text-xs font-black uppercase italic tracking-widest ${!notif.isRead ? 'text-black' : 'text-gray-900'}`}>
                                                {notif.title}
                                            </h3>
                                            <span className="text-[8px] font-bold text-gray-400 uppercase italic">
                                                {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <p className="text-[11px] font-bold text-gray-500 leading-relaxed uppercase opacity-70">
                                            {notif.message}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
