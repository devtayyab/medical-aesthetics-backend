import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MessageSquare, Plus, Search, Info, Send, User } from 'lucide-react';
import type { RootState, AppDispatch } from '../../store';
import {
    fetchConversations,
    setActiveConversation,
    receiveMessage,
    newConversation
} from '../../store/slices/messagesSlice';
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';
import { NewChatModal } from './NewChatModal';
import { socketService } from '../../services/socket';
import { motion, AnimatePresence } from 'framer-motion';

export const MessagesPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { activeConversationId, conversations } = useSelector((state: RootState) => state.messages);
    const { accessToken, user: currentUser } = useSelector((state: RootState) => state.auth);
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewChatModal, setShowNewChatModal] = useState(false);

    useEffect(() => {
        dispatch(fetchConversations());

        if (accessToken) {
            const socket = socketService.connect(accessToken, '/messages');

            socket.on('new-message', (message) => {
                dispatch(receiveMessage(message));
            });

            socket.on('new-conversation', (conversation) => {
                dispatch(newConversation(conversation));
            });
        }

        return () => {
            socketService.disconnect();
        };
    }, [dispatch, accessToken]);

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Refined Minimal Header */}
            <div className="relative pt-8 pb-16 px-6 md:px-10 border-b border-gray-100 bg-white">
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                                <div className="size-1.5 rounded-full bg-green-500" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 italic">Neural Comms</span>
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-none text-gray-900">Transmission Hub</h1>
                                <p className="text-gray-500 font-medium max-w-md text-sm">Clinical communication engine and secure patient terminal.</p>
                            </div>
                        </div>
                        
                        <button
                            onClick={() => setShowNewChatModal(true)}
                            className="group h-12 px-8 bg-black text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-[#CBFF38] hover:text-black transition-all shadow-lg flex items-center gap-3"
                        >
                            <Plus size={16} className="transition-transform" />
                            Initialize Thread
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 md:px-10 mt-8 relative z-20 pb-20">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col lg:flex-row h-[700px]">
                    
                    {/* Sidebar: Conversation List */}
                    <aside className="w-full lg:w-[320px] border-r border-gray-50 flex flex-col bg-gray-50/20">
                        <div className="p-6 pb-2">
                            <div className="relative group mb-4">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                                <input
                                    type="text"
                                    placeholder="Search Matrix..."
                                    className="w-full h-10 pl-10 pr-4 bg-white border border-gray-100 rounded-xl text-[10px] font-semibold text-gray-900 placeholder:text-gray-400 focus:ring-1 focus:ring-black transition-all shadow-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <h2 className="text-[9px] font-black uppercase tracking-widest text-gray-400 italic mb-3 ml-1">Channels</h2>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-8">
                             <ConversationList
                                onSelect={(id) => dispatch(setActiveConversation(id))}
                                selectedId={activeConversationId}
                                searchQuery={searchQuery}
                                onSearchChange={setSearchQuery}
                            />
                        </div>
                    </aside>

                    {/* Main Chat Area */}
                    <main className="flex-1 flex flex-col bg-white relative">
                        <AnimatePresence mode="wait">
                            {activeConversationId ? (
                                <motion.div 
                                    key={activeConversationId}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="h-full"
                                >
                                    <ChatWindow conversationId={activeConversationId} />
                                </motion.div>
                            ) : (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50/10"
                                >
                                    <div className="size-16 bg-black rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                                        <MessageSquare size={24} className="text-[#CBFF38]" />
                                    </div>
                                    <h2 className="text-2xl font-black uppercase italic tracking-tighter text-gray-900 mb-2">Standby</h2>
                                    <p className="text-[10px] text-gray-400 font-medium max-w-[240px] mb-8 italic">
                                        Select a transmitter from the registry to initialize communication.
                                    </p>
                                    <div className="flex flex-wrap justify-center gap-3">
                                        <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl shadow-sm border border-gray-100">
                                            <div className="size-1.5 rounded-full bg-[#CBFF38]" />
                                            <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Registry</span>
                                        </div>
                                        <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl shadow-sm border border-gray-100">
                                            <div className="size-1.5 rounded-full bg-blue-500" />
                                            <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Logistics</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </main>

                    {/* Right Sidebar: Contextual Info */}
                    <aside className="w-[260px] border-l border-gray-50 bg-gray-50/20 p-6 hidden xl:flex flex-col gap-8">
                        <div className="space-y-4">
                            <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-400 italic">Protocol</h3>
                            <div className="space-y-5">
                                <ProtocolItem 
                                    num="01" 
                                    title="Clinician Path" 
                                    desc="Direct transmission line to delegates and patients."
                                    icon={<User size={12} />}
                                />
                                <ProtocolItem 
                                    num="02" 
                                    title="Sales Matrix" 
                                    desc="Coordinate clinic-wide logistics and dataset updates."
                                    icon={<Send size={12} />}
                                />
                            </div>
                        </div>

                        <div className="mt-auto bg-black text-white p-5 rounded-2xl shadow-xl relative overflow-hidden">
                             <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#CBFF38] mb-2">Encrypted</p>
                             <p className="text-[10px] font-bold italic leading-tight text-gray-400">
                                Secure neural mesh enabled.
                             </p>
                        </div>
                    </aside>
                </div>
            </div>

            {showNewChatModal && (
                <NewChatModal onClose={() => setShowNewChatModal(false)} />
            )}
        </div>
    );
};

const ProtocolItem = ({ num, title, desc, icon }: any) => (
    <div className="space-y-3 group cursor-default">
        <div className="flex items-center gap-3">
            <div className="size-8 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center font-black italic text-[10px] group-hover:bg-black group-hover:text-[#CBFF38] transition-all">
                {num}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-900 italic">{title}</span>
        </div>
        <p className="text-[10px] font-bold text-gray-400 leading-relaxed italic group-hover:text-gray-600 transition-colors">
            {desc}
        </p>
    </div>
);
