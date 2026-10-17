import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Send, ShieldCheck, Clock, ArrowLeft, Lock } from 'lucide-react';
import type { RootState, AppDispatch } from '../../store';
import { sendMessage, fetchMessages } from '../../store/slices/messagesSlice';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatWindowProps {
  conversationId: string;
  onBack?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ conversationId, onBack }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [content, setContent] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const { activeConversationMessages, conversations, isMessagesLoading } = useSelector(
    (state: RootState) => state.messages
  );
  const { user } = useSelector((state: RootState) => state.auth);

  const conversation = conversations.find(c => c.id === conversationId);
  const otherUser = conversation?.participants?.find(p => p.user?.id !== user?.id)?.user;

  const [isGreek, setIsGreek] = useState<boolean>(
    () => typeof window !== 'undefined' && localStorage.getItem('preferredLang') === 'el'
  );

  useEffect(() => {
    const handleLang = () => {
      setIsGreek(localStorage.getItem('preferredLang') === 'el');
    };
    window.addEventListener('storage', handleLang);
    return () => window.removeEventListener('storage', handleLang);
  }, []);

  useEffect(() => {
    if (conversationId) {
      dispatch(fetchMessages({ conversationId }));
    }
  }, [dispatch, conversationId]);

  // Safely scroll internal messages container ONLY - prevents page/window from jumping down
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [activeConversationMessages, conversationId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const messageContent = content;
    setContent('');
    await dispatch(sendMessage({ conversationId, content: messageContent }));
  };

  if (!conversation) return null;

  const getInitials = () => {
    if (otherUser?.firstName || otherUser?.lastName) {
      const f = otherUser.firstName?.[0] || '';
      const l = otherUser.lastName?.[0] || '';
      return (f + l).toUpperCase() || 'BD';
    }
    if (conversation.title) {
      const parts = conversation.title.trim().split(' ');
      if (parts.length > 1) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return conversation.title.slice(0, 2).toUpperCase();
    }
    return 'BD';
  };

  const displayName = conversation.title || (otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : 'Beauty Doctors Support');

  return (
    <div className="flex flex-col h-full min-h-0 bg-transparent relative">
      {/* Chat Header */}
      <header className="shrink-0 p-4 sm:p-5 bg-white/75 backdrop-blur-md border-b border-white/70 flex items-center justify-between relative z-20 shadow-sm">
        <div className="flex items-center gap-3.5 sm:gap-4 relative z-10 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 -ml-1 rounded-xl bg-gray-100 hover:bg-[#CBFF38] text-gray-900 transition-all lg:hidden cursor-pointer"
              title="Back to channels"
            >
              <ArrowLeft size={18} />
            </button>
          )}

          <div className="relative group shrink-0">
            <div className="size-11 sm:size-12 rounded-2xl bg-black text-[#CBFF38] flex items-center justify-center font-black text-xs sm:text-sm shadow-md transition-transform group-hover:scale-105">
              {getInitials()}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 size-3 bg-[#84cc16] rounded-full border-2 border-white shadow-2xs" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <h3 className="font-black text-gray-900 uppercase tracking-tight text-sm sm:text-base truncate">
                {displayName}
              </h3>
              <span className="hidden sm:inline-block px-2 py-0.5 bg-lime-500/10 text-lime-800 border border-lime-500/20 rounded-md text-[9px] font-black uppercase tracking-wider shrink-0">
                {isGreek ? 'ΚΛΙΝΙΚΟ ΚΑΝΑΛΙ' : 'CLINICAL CHANNEL'}
              </span>
            </div>
            <p className="text-[10px] font-bold text-gray-400 mt-0.5 flex items-center gap-1.5 uppercase tracking-wider">
              <ShieldCheck size={11} className="text-[#84cc16]" />
              {isGreek ? 'Ενεργή Ασφαλής Σύνδεση' : 'Secure Session Active'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-gray-50 border border-gray-200/70 rounded-xl text-[10px] font-bold text-gray-500">
            <Lock size={11} className="text-gray-400" />
            <span>End-to-End Encrypted</span>
          </div>
        </div>
      </header>

      {/* Safety Notice Banner */}
      <div className="shrink-0 px-4 py-2 bg-amber-50/90 border-b border-amber-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left z-10">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
          <p className="text-[10px] sm:text-[11px] text-amber-950 font-semibold leading-tight">
            {isGreek
              ? 'Αυτή η υπηρεσία δεν προορίζεται για επείγοντα περιστατικά. Σε έκτακτη ανάγκη καλέστε άμεσα τις πρώτες βοήθειες.'
              : 'This messaging service is not intended for medical emergencies. In an emergency, contact emergency medical services immediately.'}
          </p>
        </div>
        <a 
          href="/medical-disclaimer" 
          target="_blank" 
          rel="noreferrer"
          className="text-[10px] font-black uppercase tracking-wider text-amber-900 underline decoration-amber-400 hover:text-black shrink-0"
        >
          {isGreek ? 'Ιατρική Αποποίηση' : 'Medical Disclaimer'}
        </a>
      </div>

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5 no-scrollbar bg-white/40"
      >
        <AnimatePresence mode="popLayout">
          {isMessagesLoading && activeConversationMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="size-8 border-3 border-[#CBFF38] border-t-transparent rounded-full animate-spin shadow-sm" />
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">Loading conversation history...</p>
            </div>
          ) : activeConversationMessages.length === 0 ? (
            <div className="py-20 text-center my-auto">
              <div className="size-14 rounded-2xl bg-white border border-gray-150 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                <ShieldCheck className="size-7 text-emerald-500" />
              </div>
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-800">
                {isGreek ? 'Αρχή Ασφαλούς Συνομιλίας' : 'Beginning of Secure Channel'}
              </h4>
              <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto">
                {isGreek
                  ? 'Όλες οι ειδοποιήσεις ραντεβού και τα μηνύματα κλινικής προστατεύονται.'
                  : 'All appointment updates and clinical communications are safely archived here.'}
              </p>
            </div>
          ) : (
            activeConversationMessages.map((msg, idx) => {
              const isMe = msg.senderId === user?.id;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  key={msg.id || idx}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex flex-col space-y-1 max-w-[85%] sm:max-w-[75%]">
                    <div
                      className={`p-3.5 sm:p-4 px-4 sm:px-5 rounded-2xl relative transition-all text-xs sm:text-[13px] leading-relaxed font-medium shadow-2xs ${
                        isMe
                          ? 'bg-gray-950 text-white rounded-tr-xs'
                          : 'bg-white text-gray-900 border border-gray-150 rounded-tl-xs shadow-2xs'
                      }`}
                    >
                      <p>{msg.content}</p>
                    </div>

                    <div className={`flex items-center gap-1.5 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <Clock size={10} className="text-gray-400" />
                      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Input or Notice Footer */}
      {user && user.role !== 'client' ? (
        <div className="shrink-0 p-3 sm:p-4 bg-white/75 backdrop-blur-md border-t border-white/60 relative z-30">
          <form onSubmit={handleSend} className="flex items-center gap-2 max-w-5xl mx-auto">
            <div className="flex-1 relative group">
              <input
                type="text"
                placeholder={isGreek ? "Πληκτρολογήστε μήνυμα..." : "Type a message..."}
                className="w-full h-11 sm:h-12 pl-4 pr-24 bg-white/60 border border-white/80 rounded-2xl text-xs sm:text-sm font-medium text-gray-900 focus:outline-none focus:border-[#CBFF38] focus:bg-white transition-all shadow-sm placeholder:text-gray-400"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <button
                type="submit"
                disabled={!content.trim()}
                className={`absolute right-1.5 top-1/2 -translate-y-1/2 h-8 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 font-black uppercase text-[10px] tracking-wider cursor-pointer ${
                  content.trim()
                    ? 'bg-[#CBFF38] text-black shadow-md hover:bg-[#b8f020]'
                    : 'bg-gray-200 text-gray-400 opacity-50 pointer-events-none'
                }`}
              >
                <span>{isGreek ? 'Αποστολή' : 'Send'}</span>
                <Send className="size-3" />
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="shrink-0 p-3.5 sm:p-4 bg-white/75 backdrop-blur-md border-t border-white/60 text-center text-[11px] text-gray-600 font-bold uppercase tracking-wider flex items-center justify-center gap-2">
          <ShieldCheck size={14} className="text-[#84cc16]" />
          <span>
            {isGreek
              ? 'Λήψη επίσημων ειδοποιήσεων ραντεβού & ενημερώσεων Beauty Doctors'
              : 'Direct appointment & operational notifications from Beauty Doctors'}
          </span>
        </div>
      )}
    </div>
  );
};
