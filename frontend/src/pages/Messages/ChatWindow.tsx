import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Send, Phone, Video, MoreVertical, Paperclip, Smile, ShieldCheck, Clock } from 'lucide-react';
import type { RootState, AppDispatch } from '../../store';
import { sendMessage, fetchMessages } from '../../store/slices/messagesSlice';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatWindowProps {
    conversationId: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ conversationId }) => {
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
        <div className="flex flex-col h-full bg-white relative">
            {/* Chat Header */}
            <header className="p-6 md:p-8 bg-black text-white flex items-center justify-between border-b border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-full bg-[#CBFF38]/5 blur-3xl rounded-full translate-x-1/2" />
                
                <div className="flex items-center gap-6 relative z-10">
                    <div className="relative group">
                       <div className="size-14 rounded-2xl bg-[#CBFF38] flex items-center justify-center text-black font-black italic text-xl shadow-lg group-hover:rotate-6 transition-transform">
                          {otherUser?.firstName?.[0]}{otherUser?.lastName?.[0]}
                       </div>
                       <div className="absolute -bottom-1 -right-1 size-4 bg-lime-500 rounded-full border-4 border-black animate-pulse" />
                    </div>
                    
                    <div>
                        <div className="flex items-center gap-3">
                           <h3 className="font-black text-white uppercase italic tracking-tighter leading-none text-xl">
                              {conversation.title || `${otherUser?.firstName} ${otherUser?.lastName}`}
                           </h3>
                           <div className="px-2 py-0.5 bg-white/5 backdrop-blur-md rounded-md border border-white/10">
                              <span className="text-[8px] font-black uppercase tracking-widest text-[#CBFF38] italic">Encrypted</span>
                           </div>
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mt-2 italic flex items-center gap-2">
                           <ShieldCheck size={10} className="text-[#CBFF38]" />
                           Secure Session Active
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 relative z-10">
                    <button className="size-12 bg-white/5 backdrop-blur-md rounded-2xl flex items-center justify-center hover:bg-[#CBFF38] hover:text-black transition-all border border-white/5">
                       <Phone size={18} />
                    </button>
                    <button className="size-12 bg-white/5 backdrop-blur-md rounded-2xl flex items-center justify-center hover:bg-[#CBFF38] hover:text-black transition-all border border-white/5">
                       <Video size={18} />
                    </button>
                </div>
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar bg-gray-50/20">
                <AnimatePresence mode="popLayout">
                    {isMessagesLoading && activeConversationMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="size-10 border-4 border-black border-t-transparent rounded-full animate-spin shadow-xl" />
                            <p className="text-[11px] font-black uppercase tracking-widest text-gray-300 italic">Decrypting incoming packets...</p>
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
                                    <div className="flex flex-col space-y-2 max-w-[80%]">
                                        <div
                                            className={`p-5 px-6 rounded-[32px] relative overflow-hidden transition-all ${isMe
                                                ? 'bg-black text-white rounded-tr-none shadow-2xl'
                                                : 'bg-white text-gray-900 border border-gray-100 rounded-tl-none shadow-xl'
                                                }`}
                                        >
                                            {isMe && (
                                              <div className="absolute top-0 right-0 p-4 opacity-5">
                                                 <Send size={40} className="text-[#CBFF38]" />
                                              </div>
                                            )}
                                            <p className="text-[13px] leading-relaxed font-bold italic z-10 relative">{msg.content}</p>
                                        </div>
                                        <div className={`flex items-center gap-2 px-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <Clock size={10} className="text-gray-300" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 italic">
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
            <div className="p-8 bg-white border-t border-gray-50 relative z-30">
                <form onSubmit={handleSend} className="flex items-center gap-6 max-w-5xl mx-auto">
                    <div className="flex gap-2">
                        <button type="button" className="size-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:bg-black hover:text-[#CBFF38] transition-all">
                            <Smile size={20} />
                        </button>
                        <button type="button" className="size-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:bg-black hover:text-[#CBFF38] transition-all">
                            <Paperclip size={20} />
                        </button>
                    </div>
                    
                    <div className="flex-1 relative group">
                        <input
                            type="text"
                            placeholder="Type transmission content..."
                            className="w-full h-16 pl-8 pr-20 bg-gray-100/50 border-none rounded-3xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-black transition-all shadow-inner placeholder:italic placeholder:font-black placeholder:uppercase placeholder:text-gray-300 placeholder:tracking-widest"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                        <button
                            type="submit"
                            disabled={!content.trim()}
                            className={`absolute right-3 top-1/2 -translate-y-1/2 h-10 px-6 rounded-2xl transition-all flex items-center gap-2 font-black uppercase text-[10px] tracking-widest italic  ${content.trim()
                                ? 'bg-black text-[#CBFF38] shadow-xl shadow-lime-500/10'
                                : 'bg-gray-200 text-gray-400 opacity-50'
                                }`}
                        >
                            Execute <Send size={14} className={content.trim() ? 'animate-pulse' : ''} />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
