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
        <div className="flex flex-col h-full bg-white border-r border-gray-100">
            <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    Messages
                </h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
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
                                    className={`w-full p-4 flex gap-3 text-left transition-all hover:bg-gray-50 ${isActive ? 'bg-blue-50/50 ring-1 ring-inset ring-blue-100' : ''
                                        }`}
                                >
                                    <div className="relative flex-shrink-0">
                                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black border-2 border-white shadow-sm">
                                            {otherUser?.firstName?.[0] || '?'}{otherUser?.lastName?.[0] || ''}
                                        </div>
                                        {/* Status indicator could go here */}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-bold text-gray-900 truncate">
                                                {conv.title || `${otherUser?.firstName} ${otherUser?.lastName}`}
                                            </h4>
                                            <div className="flex flex-col items-end gap-1">
                                                {conv.lastMessage && (
                                                    <span className="text-[10px] text-gray-400 font-bold bg-gray-50 px-1.5 py-0.5 rounded">
                                                        {getTimeString(conv.lastMessage.createdAt)}
                                                    </span>
                                                )}
                                                {(conv.unreadCount || 0) > 0 && (
                                                    <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm shadow-blue-200">
                                                        {conv.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <p className={`text-xs truncate font-medium ${isActive ? 'text-blue-700' : 'text-gray-500'}`}>
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
