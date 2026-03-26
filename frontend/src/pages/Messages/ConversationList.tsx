import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { MessageSquare, Clock } from 'lucide-react';
import type { RootState, AppDispatch } from '../../store';
import type { Conversation } from '../../store/slices/messagesSlice';
import { searchConversations } from '../../store/slices/messagesSlice';
import { motion } from 'framer-motion';

interface ConversationListProps {
    onSelect: (id: string) => void;
    selectedId: string | null;
    searchQuery: string;
    onSearchChange: (query: string) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
    onSelect,
    selectedId,
    searchQuery,
}) => {
    const dispatch = useDispatch<AppDispatch>();
    const { conversations, searchResults, isLoading } = useSelector((state: RootState) => state.messages);
    const { user } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        if (searchQuery.length >= 2) {
            dispatch(searchConversations(searchQuery));
        }
    }, [searchQuery, dispatch]);

    const displayConversations = searchQuery.length >= 2 ? searchResults : conversations;

    const getOtherParticipant = (conversation: Conversation) => {
        return conversation.participants.find(p => p.user.id !== user?.id)?.user;
    };

    const getTimeString = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    return (
        <div className="flex flex-col h-full bg-transparent">
            {isLoading && displayConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 gap-4">
                    <div className="size-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-300 italic">Accessing Archives...</p>
                </div>
            ) : displayConversations.length === 0 ? (
                <div className="p-12 text-center">
                    <div className="size-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100">
                        <MessageSquare className="w-8 h-8 text-gray-200" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">No Active Channels Found</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {displayConversations.map((conv, idx) => {
                        const otherUser = getOtherParticipant(conv);
                        const isActive = selectedId === conv.id;

                        return (
                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                key={conv.id}
                                onClick={() => onSelect(conv.id)}
                                className={`w-full p-5 flex gap-4 text-left transition-all rounded-[32px] group relative ${isActive 
                                    ? 'bg-black text-white shadow-2xl shadow-gray-200 z-10' 
                                    : 'bg-white hover:bg-gray-100/50 text-gray-900 border border-gray-50'
                                }`}
                            >
                                <div className="relative shrink-0">
                                    <div className={`size-12 rounded-2xl flex items-center justify-center font-black italic text-sm transition-all ${isActive 
                                        ? 'bg-[#CBFF38] text-black shadow-lg rotate-3 group-hover:rotate-0' 
                                        : 'bg-gray-50 text-gray-400 group-hover:bg-white'
                                    }`}>
                                        {otherUser?.firstName?.[0] || '?'}{otherUser?.lastName?.[0] || ''}
                                    </div>
                                    {(conv.unreadCount || 0) > 0 && (
                                        <div className="absolute -top-1 -right-1 size-5 bg-[#CBFF38] text-black text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-sm ring-2 ring-black/5">
                                            {conv.unreadCount}
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0 py-0.5">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className={`text-xs font-black uppercase italic tracking-tighter truncate ${isActive ? 'text-white' : 'text-gray-900'}`}>
                                            {conv.title || `${otherUser?.firstName} ${otherUser?.lastName}`}
                                        </h4>
                                        {conv.lastMessage && (
                                            <div className="flex items-center gap-1 opacity-40 shrink-0 ml-2">
                                                <Clock size={8} />
                                                <span className="text-[8px] font-black uppercase tracking-tighter italic">
                                                    {getTimeString(conv.lastMessage.createdAt)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <p className={`text-[10px] truncate font-bold italic leading-tight ${isActive ? 'text-[#CBFF38]' : 'text-gray-400 group-hover:text-gray-600'}`}>
                                        {conv.lastMessage?.content || 'Initialize connection...'}
                                    </p>
                                </div>

                                {isActive && (
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20">
                                        <div className="size-1 rounded-full bg-[#CBFF38] animate-ping" />
                                    </div>
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
