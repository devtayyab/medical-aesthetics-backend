import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Send, Phone, Video, MoreVertical, Paperclip, Smile } from 'lucide-react';
import type { RootState, AppDispatch } from '../../store';
import { sendMessage, fetchMessages } from '../../store/slices/messagesSlice';

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
        <div className="flex flex-col h-full bg-gray-50/30">
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-50">
                        {otherUser?.firstName?.[0]}{otherUser?.lastName?.[0]}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 leading-none">
                            {conversation.title || `${otherUser?.firstName} ${otherUser?.lastName}`}
                        </h3>
                        <span className="text-[10px] text-green-500 font-bold flex items-center gap-1 mt-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                            Online
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors text-gray-400 hover:text-blue-600"><Phone className="w-4 h-4" /></button>
                    <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors text-gray-400 hover:text-blue-600"><Video className="w-4 h-4" /></button>
                    <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors text-gray-400 hover:text-blue-600"><MoreVertical className="w-4 h-4" /></button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {isMessagesLoading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    activeConversationMessages.map((msg, idx) => {
                        const isMe = msg.senderId === user?.id;
                        return (
                            <div
                                key={msg.id || idx}
                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[70%] p-3 rounded-2xl shadow-sm ${isMe
                                            ? 'bg-blue-600 text-white rounded-tr-none'
                                            : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                                        }`}
                                >
                                    <p className="text-sm leading-relaxed">{msg.content}</p>
                                    <div className={`text-[9px] mt-1 font-medium ${isMe ? 'text-blue-100 text-right' : 'text-gray-400'}`}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
                <form onSubmit={handleSend} className="flex items-center gap-2">
                    <button type="button" className="p-2.5 text-gray-400 hover:bg-gray-50 rounded-xl transition-all">
                        <Smile className="w-5 h-5" />
                    </button>
                    <button type="button" className="p-2.5 text-gray-400 hover:bg-gray-50 rounded-xl transition-all">
                        <Paperclip className="w-5 h-5" />
                    </button>
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Type your message..."
                            className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-transparent focus:border-blue-500 rounded-xl text-sm transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                        <button
                            type="submit"
                            disabled={!content.trim()}
                            className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${content.trim()
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                    : 'bg-gray-100 text-gray-300'
                                }`}
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
