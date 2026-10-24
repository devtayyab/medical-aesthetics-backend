import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { MessageSquare, ChevronRight } from 'lucide-react';
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
    return conversation.participants?.find(p => p.user?.id !== user?.id)?.user;
  };

  const getTimeString = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getInitials = (conv: Conversation) => {
    const otherUser = getOtherParticipant(conv);
    if (otherUser?.firstName || otherUser?.lastName) {
      const f = otherUser.firstName?.[0] || '';
      const l = otherUser.lastName?.[0] || '';
      return (f + l).toUpperCase() || 'BD';
    }
    if (conv.title) {
      const parts = conv.title.trim().split(' ');
      if (parts.length > 1) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return conv.title.slice(0, 2).toUpperCase();
    }
    return 'BD';
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      {isLoading && displayConversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 gap-3">
          <div className="size-8 border-3 border-[#CBFF38] border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Loading channels...</p>
        </div>
      ) : displayConversations.length === 0 ? (
        <div className="p-8 text-center my-auto">
          <div className="size-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3 text-gray-300">
            <MessageSquare className="size-7" />
          </div>
          <p className="text-xs font-black uppercase tracking-wider text-gray-400">No Active Channels</p>
          <p className="text-[11px] text-gray-400 mt-1 max-w-[200px] mx-auto">
            Conversations with clinic staff will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {displayConversations.map((conv, idx) => {
            const otherUser = getOtherParticipant(conv);
            const isActive = selectedId === conv.id;
            const initials = getInitials(conv);
            const title = conv.title || (otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : 'Beauty Doctors Support');
            const lastTime = conv.lastMessage ? getTimeString(conv.lastMessage.createdAt) : getTimeString(conv.updatedAt);

            return (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                key={conv.id}
                type="button"
                onClick={() => onSelect(conv.id)}
                className={`w-full p-4 flex items-center gap-3.5 text-left transition-all duration-200 rounded-2xl group relative cursor-pointer ${
                  isActive 
                    ? 'bg-[#CBFF38] text-black shadow-md border border-[#b8f020]' 
                    : 'bg-white/25 hover:bg-white/55 backdrop-blur-sm text-gray-900 border border-white/45 hover:border-[#CBFF38] shadow-xs hover:shadow-md'
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className={`size-11 rounded-2xl flex items-center justify-center font-black text-xs transition-all ${
                    isActive 
                      ? 'bg-black text-[#CBFF38] shadow-sm' 
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-100 group-hover:bg-black group-hover:text-[#CBFF38] group-hover:border-black'
                  }`}>
                    {initials}
                  </div>
                  {(conv.unreadCount || 0) > 0 && (
                    <div className="absolute -top-1 -right-1 size-4 bg-red-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border border-white shadow-xs">
                      {conv.unreadCount}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <h4 className={`text-xs font-black uppercase tracking-tight truncate ${
                      isActive ? 'text-black' : 'text-gray-900 group-hover:text-black'
                    }`}>
                      {title}
                    </h4>
                    {lastTime && (
                      <span className={`text-[10px] font-bold shrink-0 ml-2 ${
                        isActive ? 'text-gray-800' : 'text-gray-400'
                      }`}>
                        {lastTime}
                      </span>
                    )}
                  </div>
                  <p className={`text-[11px] truncate leading-tight font-medium ${
                    isActive ? 'text-gray-900 font-semibold' : 'text-gray-500 group-hover:text-gray-700'
                  }`}>
                    {conv.lastMessage?.content || 'Clinical consultation channel'}
                  </p>
                </div>

                {/* Right Arrow */}
                <ChevronRight size={15} className={`shrink-0 transition-transform ${
                  isActive ? 'text-black translate-x-0.5' : 'text-gray-300 group-hover:text-black group-hover:translate-x-0.5'
                }`} />
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
};
