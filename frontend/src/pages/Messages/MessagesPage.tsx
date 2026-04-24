import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
    Plus, Search, Info, Send, User, 
    ArrowRight, ChevronDown, Clock, MessageSquare
} from 'lucide-react';
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
import { css } from "@emotion/css";

const marbleBackground = css`
  background: #121212;
  background-image: url("https://www.transparenttextures.com/patterns/dark-matter.png");
  min-height: calc(100vh - 64px);
  color: white;
  padding: 24px;
`;

export const MessagesPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { activeConversationId, conversations } = useSelector((state: RootState) => state.messages);
    const { accessToken } = useSelector((state: RootState) => state.auth);
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [selectedTab, setSelectedTab] = useState('All');

    useEffect(() => {
        dispatch(fetchConversations());

        if (accessToken) {
            const socket = socketService.connect(accessToken, '/messages');

            socket.on('new-message', (message: any) => {
                dispatch(receiveMessage(message));
            });

            socket.on('new-conversation', (conversation: any) => {
                dispatch(newConversation(conversation));
            });
        }

        return () => {
            socketService.disconnect();
        };
    }, [dispatch, accessToken]);

    return (
        <div className={marbleBackground}>
            <div className="max-w-[1400px] mx-auto h-[calc(100vh-120px)] flex flex-col">
                {/* Header Section */}
                <div className="mb-6 flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-black uppercase italic tracking-tighter mb-1">Transmission <span className="text-[#CBFF38]">Hub</span></h1>
                        <p className="text-white/40 text-xs font-medium">Manage real-time clinical transmissions and secure patient communications.</p>
                    </div>
                    <button 
                        onClick={() => setShowNewChatModal(true)}
                        className="bg-[#CBFF38] text-black h-12 px-6 rounded-xl font-black uppercase italic tracking-widest text-[10px] flex items-center gap-2 hover:scale-105 transition-all shadow-lg"
                    >
                        <Plus size={16} /> Initialize
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
                    {/* Left: Contact List */}
                    <div className="w-full lg:w-[320px] flex flex-col min-h-0">
                        <div className="relative mb-4">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                            <input 
                                type="text" 
                                placeholder="Search matrix..."
                                className="w-full h-11 bg-white/5 rounded-xl pl-12 pr-4 text-xs font-medium border border-white/5 focus:border-[#CBFF38]/20 transition-all outline-none"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
                           {['All', 'Primary', 'Clinical'].map(tab => (
                               <button 
                                   key={tab}
                                   onClick={() => setSelectedTab(tab)}
                                   className={`px-4 h-8 rounded-full text-[9px] font-black uppercase italic tracking-widest transition-all ${selectedTab === tab ? 'bg-[#CBFF38]/10 text-[#CBFF38] border border-[#CBFF38]/20' : 'bg-white/5 text-white/20'}`}
                               >
                                   {tab}
                               </button>
                           ))}
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar pr-1">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-[8px] font-black uppercase italic tracking-widest text-white/20">Channels</span>
                                <span className="text-[8px] font-black uppercase text-[#CBFF38]">{conversations.length} Active</span>
                            </div>
                            <ConversationList
                                onSelect={(id) => dispatch(setActiveConversation(id))}
                                selectedId={activeConversationId}
                                searchQuery={searchQuery}
                                onSearchChange={setSearchQuery}
                            />
                        </div>
                    </div>

                    {/* Right: Chat Window */}
                    <div className="flex-1 bg-white/5 rounded-3xl border border-white/5 overflow-hidden relative flex flex-col">
                         <AnimatePresence mode="wait">
                            {activeConversationId ? (
                                <motion.div 
                                    key={activeConversationId}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="w-full h-full"
                                >
                                    <ChatWindow conversationId={activeConversationId} />
                                </motion.div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-12">
                                     <div className="size-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6 text-white/10">
                                         <MessageSquare size={40} />
                                     </div>
                                     <h2 className="text-xl font-black uppercase italic tracking-widest mb-2 opacity-10">Select Transmission</h2>
                                     <p className="text-[10px] font-bold text-white/20 uppercase max-w-xs tracking-wider">Initialize a communication channel to begin clinical data exchange.</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {showNewChatModal && (
                <NewChatModal
                    onClose={() => setShowNewChatModal(false)}
                />
            )}
        </div>
    );
};
