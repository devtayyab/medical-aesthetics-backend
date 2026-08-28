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
import { css } from"@emotion/css";

const marbleBackground = css`
 background: #121212;
 background-image: url("https://www.transparenttextures.com/patterns/dark-matter.png");
 min-height: calc(100vh - 56px);
 @media (min-width: 640px) {
 min-height: calc(100vh - 64px);
 }
 color: white;
 padding: 16px 12px;
 @media (min-width: 640px) {
 padding: 32px 24px;
 }
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
 <div className="bg-gray-50 min-h-[calc(100vh-64px)] p-4 sm:p-6 lg:p-8 text-gray-900">
 <div className="max-w-[1400px] mx-auto h-[calc(100vh-100px)] sm:h-[calc(100vh-140px)] flex flex-col min-h-0 overflow-hidden">
 {/* Header Section */}
 <div className="mb-3 sm:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2 sm:gap-0 shrink-0">
 <div>
 <h1 className="text-lg sm:text-2xl font-black uppercase tracking-tighter mb-0.5 sm:mb-1">
 Messages
 </h1>
 <p className="text-gray-500 text-[10px] sm:text-xs font-medium max-w-md leading-tight">
 Manage real-time clinical transmissions and secure patient communications.
 </p>
 </div>
 <button 
 onClick={() => setShowNewChatModal(true)}
 className="bg-[#CBFF38] text-black h-9 sm:h-12 px-4 sm:px-6 rounded-xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-lg w-full sm:w-auto shrink-0"
 >
 <Plus size={16} /> Initialize
 </button>
 </div>

 <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 flex-1 min-h-0">
 {/* Left: Contact List */}
 <div className={`w-full lg:w-[320px] flex-col min-h-0 ${activeConversationId ? 'hidden lg:flex' : 'flex'}`}>
 <div className="relative mb-3 sm:mb-4 shrink-0">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
 <input 
 type="text" 
 placeholder="Search matrix..."
 className="w-full h-10 sm:h-11 bg-white rounded-xl pl-12 pr-4 text-xs font-medium border border-gray-200 focus:border-[#CBFF38] text-gray-900 transition-all outline-none"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>

 <div className="flex gap-2 mb-3 sm:mb-4 overflow-x-auto no-scrollbar shrink-0">
 {['All', 'Primary', 'Clinical'].map(tab => (
 <button 
 key={tab}
 onClick={() => setSelectedTab(tab)}
 className={`px-4 h-8 rounded-full text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${selectedTab === tab ? 'bg-[#CBFF38]/20 text-[#88b31a] border border-[#CBFF38]' : 'bg-white/5 text-gray-400'}`}
 >
 {tab}
 </button>
 ))}
 </div>

 <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pr-1">
 <div className="flex justify-between items-center mb-3">
 <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Channels</span>
 <span className="text-[8px] font-black uppercase text-emerald-600">{conversations.length} Active</span>
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
 <div className={`flex-1 h-full min-h-0 bg-white rounded-2xl sm:rounded-3xl border border-gray-200 shadow-sm overflow-hidden relative flex-col ${activeConversationId ? 'flex' : 'hidden lg:flex'}`}>
 <AnimatePresence mode="wait">
 {activeConversationId ? (
 <motion.div 
 key={activeConversationId}
 initial={{ opacity: 0, scale: 0.98 }}
 animate={{ opacity: 1, scale: 1 }}
 className="w-full h-full min-h-0 flex flex-col"
 >
 <ChatWindow 
 conversationId={activeConversationId} 
 onBack={() => dispatch(setActiveConversation(null))}
 />
 </motion.div>
 ) : (
 <div className="h-full flex flex-col items-center justify-center text-center p-6 sm:p-12">
 <div className="size-16 sm:size-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6 text-gray-200">
 <MessageSquare className="size-8 sm:size-10" />
 </div>
 <h2 className="text-lg sm:text-xl font-black uppercase tracking-widest mb-2 text-gray-300">Select Transmission</h2>
 <p className="text-[10px] font-bold text-gray-400 uppercase max-w-xs tracking-wider">Initialize a communication channel to begin clinical data exchange.</p>
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
