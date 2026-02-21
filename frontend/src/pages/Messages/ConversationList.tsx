import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Search, MessageSquare } from 'lucide-react';
import type { RootState, AppDispatch } from '../../store';
import type { Conversation } from '../../store/slices/messagesSlice';
import { searchConversations } from '../../store/slices/messagesSlice';

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
    onSearchChange,
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
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString();
    };

    return (
        <div className="flex flex-col h-full bg-white border-r border-slate-100">
            <div className="p-5 border-b border-slate-50 bg-slate-50/30">
                <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-tight">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    Conversations
                </h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all font-medium shadow-sm"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isLoading && displayConversations.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 animate-pulse">
                        Loading conversations...
                    </div>
                ) : displayConversations.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <MessageSquare className="w-6 h-6 text-gray-300" />
                        </div>
                        <p className="text-sm text-gray-500 font-medium">No conversations found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {displayConversations.map((conv) => {
                            const otherUser = getOtherParticipant(conv);
                            const isActive = selectedId === conv.id;

                            return (
                                <button
                                    key={conv.id}
                                    onClick={() => onSelect(conv.id)}
                                    className={`w-full p-4 flex gap-3 text-left transition-all hover:bg-slate-50 border-b border-slate-50 ${isActive ? 'bg-blue-50/40' : 'bg-white'
                                        }`}
                                >
                                    <div className="relative flex-shrink-0">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm border shadow-sm transition-all ${isActive ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-100 text-slate-400 border-slate-200'
                                            }`}>
                                            {otherUser?.firstName?.[0] || '?'}{otherUser?.lastName?.[0] || ''}
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-0.5">
                                            <h4 className={`font-bold text-sm truncate ${isActive ? 'text-blue-600' : 'text-slate-800'}`}>
                                                {conv.title || `${otherUser?.firstName} ${otherUser?.lastName}`}
                                            </h4>
                                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                {conv.lastMessage && (
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                                                        {getTimeString(conv.lastMessage.createdAt)}
                                                    </span>
                                                )}
                                                {(conv.unreadCount || 0) > 0 && (
                                                    <span className="bg-blue-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-sm">
                                                        {conv.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <p className={`text-[11px] truncate font-medium ${isActive ? 'text-blue-500/80' : 'text-slate-400'}`}>
                                            {conv.lastMessage?.content || 'Started a conversation'}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
