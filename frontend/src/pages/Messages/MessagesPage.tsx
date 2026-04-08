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
            {/* Premium Header */}
            <div className="bg-black text-white pt-16 pb-24 px-6 md:px-10 rounded-b-[48px] shadow-2xl relative overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] size-[500px] bg-[#CBFF38]/10 blur-[120px] rounded-full" />
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 backdrop-blur-md rounded-full border border-white/10">
                                <div className="size-1.5 rounded-full bg-[#CBFF38] animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#CBFF38] italic">Neural Comms</span>
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-none">Transmission Hub</h1>
                                <p className="text-gray-400 font-medium max-w-md">Secure end-to-end clinical communication matrix for practitioners and patients.</p>
                            </div>
                        </div>
                        
                        <button
                            onClick={() => setShowNewChatModal(true)}
                            className="group h-16 px-10 bg-[#CBFF38] text-black rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-white transition-all shadow-xl shadow-lime-500/10 flex items-center gap-4"
                        >
                            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                            Initialize Thread
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 md:px-10 -mt-10 relative z-20 pb-20">
                <div className="bg-white rounded-[48px] shadow-2xl border border-gray-100 overflow-hidden flex flex-col lg:flex-row h-[750px]">
                    
                    {/* Sidebar: Conversation List */}
                    <aside className="w-full lg:w-[380px] border-r border-gray-50 flex flex-col bg-gray-50/30">
                        <div className="p-8 pb-4">
                            <div className="relative group mb-6">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-black transition-colors" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search Matrix..."
                                    className="w-full h-12 pl-12 pr-6 bg-white border-none rounded-2xl text-[10px] font-bold text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-black transition-all shadow-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic mb-4 ml-1">Active Channels</h2>
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
                                    className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-gray-50/20"
                                >
                                    <div className="size-24 bg-black rounded-[32px] flex items-center justify-center mb-8 shadow-2xl animate-bounce">
                                        <MessageSquare size={40} className="text-[#CBFF38]" />
                                    </div>
                                    <h2 className="text-3xl font-black uppercase italic tracking-tighter text-gray-900 mb-4">Channel Standby</h2>
                                    <p className="text-gray-400 font-medium max-w-sm mb-10 italic">
                                        Select a peer or patient transmission from the registry to initialize the communication handshake.
                                    </p>
                                    <div className="flex flex-wrap justify-center gap-4">
                                        <div className="flex items-center gap-3 px-6 py-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                                            <div className="size-2 rounded-full bg-[#CBFF38]" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Patient Registry</span>
                                        </div>
                                        <div className="flex items-center gap-3 px-6 py-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                                            <div className="size-2 rounded-full bg-blue-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Sales Ops</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </main>

                    {/* Right Sidebar: Contextual Info */}
                    <aside className="w-[300px] border-l border-gray-50 bg-gray-50/30 p-8 hidden xl:flex flex-col gap-10">
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Protocol Guidelines</h3>
                            <div className="space-y-6">
                                <ProtocolItem 
                                    num="01" 
                                    title="Clinician Path" 
                                    desc="Direct transmission line to assigned sales delegates and patients."
                                    icon={<User size={14} />}
                                />
                                <ProtocolItem 
                                    num="02" 
                                    title="Sales Matrix" 
                                    desc="Coordinate clinic-wide logistics and update patient datasets."
                                    icon={<Send size={14} />}
                                />
                                <ProtocolItem 
                                    num="03" 
                                    title="Patient Vector" 
                                    desc="Direct access for patients to query clinical protocols."
                                    icon={<Info size={14} />}
                                />
                            </div>
                        </div>

                        <div className="mt-auto bg-black text-white p-6 rounded-[32px] shadow-xl relative overflow-hidden">
                             <div className="absolute -right-4 -bottom-4 opacity-10">
                                <MessageSquare size={80} className="text-[#CBFF38]" />
                             </div>
                             <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#CBFF38] mb-4">Encryption Active</p>
                             <p className="text-xs font-bold italic leading-relaxed text-gray-400">
                                All clinical transmissions are proxied through our secure neural mesh.
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
