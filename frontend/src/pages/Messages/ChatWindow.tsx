import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Send, MoreVertical, Paperclip, Smile, ShieldCheck, Clock, ArrowLeft } from 'lucide-react';
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
 const messagesEndRef = useRef<HTMLDivElement>(null);

 const { activeConversationMessages, conversations, isMessagesLoading } = useSelector(
 (state: RootState) => state.messages
 );
 const { user } = useSelector((state: RootState) => state.auth);

 const conversation = conversations.find(c => c.id === conversationId);
 const otherUser = conversation?.participants.find(p => p.user.id !== user?.id)?.user;

 useEffect(() => {
 if (conversationId) {
 dispatch(fetchMessages({ conversationId }));
 }
 }, [dispatch, conversationId]);

 useEffect(() => {
 messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
 }, [activeConversationMessages]);

 const handleSend = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!content.trim()) return;

 const messageContent = content;
 setContent('');
 await dispatch(sendMessage({ conversationId, content: messageContent }));
 };

 if (!conversation) return null;

 return (
 <div className="flex flex-col h-full min-h-0 bg-white relative">
 {/* Chat Header */}
 <header className="shrink-0 p-3 sm:p-6 md:p-8 bg-black text-white flex items-center justify-between border-b border-white/5 relative overflow-hidden">
 <div className="absolute top-0 right-0 w-64 h-full bg-[#CBFF38]/5 blur-3xl rounded-full translate-x-1/2" />
 
 <div className="flex items-center gap-3 sm:gap-6 relative z-10 min-w-0">
 {onBack && (
 <button
 onClick={onBack}
 className="p-2 -ml-2 rounded-xl bg-white/10 text-white hover:bg-[#CBFF38] hover:text-black transition-all lg:hidden"
 title="Back to channels"
 >
 <ArrowLeft size={18} />
 </button>
 )}
 <div className="relative group">
 <div className="size-11 sm:size-14 rounded-2xl bg-[#CBFF38] flex items-center justify-center text-black font-black text-base sm:text-xl shadow-lg group-hover:rotate-6 transition-transform shrink-0">
 {otherUser?.firstName?.[0]}{otherUser?.lastName?.[0]}
 </div>
 <div className="absolute -bottom-1 -right-1 size-4 bg-lime-500 rounded-full border-4 border-black animate-pulse" />
 </div>
 
 <div className="min-w-0">
 <div className="flex items-center gap-3 min-w-0">
 <h3 className="font-black text-white uppercase tracking-tighter leading-none text-base sm:text-xl truncate">
 {conversation.title || `${otherUser?.firstName} ${otherUser?.lastName}`}
 </h3>
 <div className="hidden sm:block px-2 py-0.5 bg-white/5 backdrop-blur-md rounded-md border border-white/10 shrink-0">
 <span className="text-[8px] font-black uppercase tracking-widest text-[#CBFF38]">Encrypted</span>
 </div>
 </div>
 <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mt-1.5 flex items-center gap-2">
 <ShieldCheck size={10} className="text-[#CBFF38]" />
 Secure Session Active
 </p>
 </div>
 </div>

 <div className="flex items-center gap-4 relative z-10">
 </div>
 </header>

 {/* Messages Area */}
 <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 no-scrollbar bg-gray-50/20">
 <AnimatePresence mode="popLayout">
 {isMessagesLoading && activeConversationMessages.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-20 gap-4">
 <div className="size-10 border-4 border-black border-t-transparent rounded-full animate-spin shadow-xl" />
 <p className="text-[11px] font-black uppercase tracking-widest text-gray-300">Decrypting incoming packets...</p>
 </div>
 ) : (
 activeConversationMessages.map((msg, idx) => {
 const isMe = msg.senderId === user?.id;
 return (
 <motion.div
 initial={{ opacity: 0, y: 20, scale: 0.95 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 transition={{ delay: idx * 0.05 }}
 key={msg.id || idx}
 className={`flex ${isMe ? 'justify-end' : 'justify-start shadow-xl shadow-gray-100/5'}`}
 >
 <div className="flex flex-col space-y-1.5 max-w-[85%] sm:max-w-[80%]">
 <div
 className={`p-3.5 sm:p-5 px-4 sm:px-6 rounded-2xl sm:rounded-[32px] relative overflow-hidden transition-all ${isMe
 ? 'bg-black text-white rounded-tr-none shadow-xl'
 : 'bg-white text-gray-900 border border-gray-100 rounded-tl-none shadow-lg'
 }`}
 >
 {isMe && (
 <div className="absolute top-0 right-0 p-4 opacity-5">
 <Send size={40} className="text-[#CBFF38]" />
 </div>
 )}
 <p className="text-xs sm:text-[13px] leading-relaxed font-bold z-10 relative">{msg.content}</p>
 </div>
 <div className={`flex items-center gap-1.5 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
 <Clock size={10} className="text-gray-300" />
 <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-gray-400">
 {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
 </span>
 </div>
 </div>
 </motion.div>
 );
 })
 )}
 </AnimatePresence>
 <div ref={messagesEndRef} />
 </div>

 {/* Input Area */}
 <div className="shrink-0 p-3 sm:p-6 md:p-8 bg-white border-t border-gray-50 relative z-30">
 <form onSubmit={handleSend} className="flex items-center gap-2 sm:gap-4 max-w-5xl mx-auto">
 <div className="flex-1 relative group">
 <input
 type="text"
 placeholder="Type a message..."
 className="w-full h-11 sm:h-16 pl-4 sm:pl-8 pr-12 sm:pr-28 bg-gray-100/50 border-none rounded-xl sm:rounded-3xl text-xs sm:text-sm font-medium sm:font-bold text-gray-900 focus:ring-2 focus:ring-black transition-all shadow-inner placeholder:text-gray-400 placeholder:font-medium sm:placeholder:font-black sm:placeholder:uppercase sm:placeholder:tracking-widest"
 value={content}
 onChange={(e) => setContent(e.target.value)}
 />
 <button
 type="submit"
 disabled={!content.trim()}
 className={`absolute right-1.5 sm:right-3 top-1/2 -translate-y-1/2 h-8 sm:h-10 px-3 sm:px-6 rounded-lg sm:rounded-2xl transition-all flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest ${content.trim()
 ? 'bg-black text-[#CBFF38] shadow-lg shadow-lime-500/10'
 : 'bg-gray-200 text-gray-400 opacity-50'
 }`}
 >
 <span className="hidden sm:inline">Send</span>
 <Send className={`size-3.5 sm:size-4 ${content.trim() ? 'animate-pulse' : ''}`} />
 </button>
 </div>
 </form>
 </div>
 </div>
 );
};
