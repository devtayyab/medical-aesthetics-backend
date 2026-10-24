import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Search, MessageSquare, ChevronRight } from 'lucide-react';
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

// Luxury clinic background image
import MessagesBg from '@/assets/messages_bg.png';

export const MessagesPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { activeConversationId, conversations } = useSelector((state: RootState) => state.messages);
  const { accessToken, user } = useSelector((state: RootState) => state.auth);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'All' | 'Primary' | 'Clinical'>('All');

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

  const tabs: Array<{ key: 'All' | 'Primary' | 'Clinical'; label: string }> = [
    { key: 'All', label: isGreek ? 'ΟΛΑ' : 'ALL' },
    { key: 'Primary', label: isGreek ? 'ΚΥΡΙΑ' : 'PRIMARY' },
    { key: 'Clinical', label: isGreek ? 'ΚΛΙΝΙΚΑ' : 'CLINICAL' }
  ];

  return (
    <div className="min-h-screen relative bg-[#F8FAFC] overflow-x-hidden flex flex-col justify-between text-gray-900">
      {/* Background Hero Banner - 100% Crisp, unblurred aesthetic clinic visual */}
      <div className="absolute top-0 inset-x-0 h-[880px] sm:h-[1000px] lg:h-[1150px] z-0 pointer-events-none overflow-hidden">
        <img
          src={MessagesBg}
          className="w-full h-full object-cover"
          style={{ objectPosition: 'center 38%', filter: "none", imageRendering: "auto" }}
          alt="Luxury Aesthetic Consultation Lounge"
        />
        {/* Soft Ambient Left Gradient behind text so typography is 100% readable while the clinic room remains visible */}
        <div className="absolute inset-y-0 left-0 w-full sm:w-2/3 max-w-2xl bg-gradient-to-r from-white/45 via-white/15 to-transparent pointer-events-none" />
        {/* Soft bottom blend to transition smoothly into page base */}
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC]/60 to-transparent pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-[1400px] w-full mx-auto px-4 sm:px-8 pt-8 sm:pt-14 pb-16 flex-1 flex flex-col min-h-0">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 shrink-0">
          <div>
            {/* Floating Glass Breadcrumb Pill */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/40 backdrop-blur-md border border-white/60 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] shadow-sm mb-4"
            >
              <span className="text-gray-900 border-b border-gray-900/30 pb-0.5">
                BEAUTY DOCTORS
              </span>
              <ChevronRight size={12} className="text-[#84cc16]" />
              <span className="text-[#84cc16] font-extrabold">
                {isGreek ? 'ΜΗΝΥΜΑΤΑ' : 'MESSAGES'}
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-gray-900 leading-none drop-shadow-sm"
            >
              {isGreek ? 'ΜΗΝΥΜΑΤΑ' : <>COMMUNICATION <span className="text-[#84cc16] sm:text-[#a3e635]">CENTER</span></>}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-gray-600 mt-3 sm:mt-4 font-bold text-xs sm:text-sm md:text-base max-w-2xl leading-relaxed"
            >
              {isGreek
                ? 'Λάβετε ενημερώσεις για ραντεβού και λειτουργικές ειδοποιήσεις.'
                : 'Receive appointment updates, doctor consultations and operational notifications.'}
            </motion.p>
          </div>

          {user && user.role !== 'client' && (
            <motion.button 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setShowNewChatModal(true)}
              className="bg-[#CBFF38] text-black h-11 sm:h-12 px-6 rounded-2xl font-black uppercase tracking-wider text-[10px] sm:text-xs flex items-center justify-center gap-2 hover:bg-[#b8f020] hover:scale-102 transition-all shadow-[0_10px_25px_rgba(203,255,56,0.25)] cursor-pointer shrink-0 border border-white/40"
            >
              <Plus size={16} />
              <span>{isGreek ? 'Νέα Συνομιλία' : 'Start Conversation'}</span>
            </motion.button>
          )}
        </div>

        {/* 2-Column Chat Layout with Transparent Frosted Glass Panels */}
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 h-[600px] sm:h-[650px] lg:h-[700px]">
          {/* Left Column: Channels & Contacts */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className={`w-full lg:w-[360px] xl:w-[400px] h-full flex-col min-h-0 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-[32px] p-5 sm:p-6 border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.03)] transition-all duration-300 ${activeConversationId ? 'hidden lg:flex' : 'flex'}`}
          >
            {/* Search Input */}
            <div className="relative mb-4 shrink-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input 
                type="text" 
                placeholder={isGreek ? "Αναζήτηση συνομιλιών..." : "Search conversations..."}
                className="w-full bg-white/35 border border-white/50 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#CBFF38] focus:bg-white/60 transition-all shadow-xs backdrop-blur-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter Pills */}
            <div className="flex gap-1.5 mb-5 overflow-x-auto no-scrollbar shrink-0">
              {tabs.map((tab) => {
                const isActive = selectedTab === tab.key;
                return (
                  <button 
                    key={tab.key}
                    type="button"
                    onClick={() => setSelectedTab(tab.key)}
                    className={`px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-[#CBFF38] text-black shadow-sm scale-105' 
                        : 'text-gray-600 hover:text-gray-900 bg-white/25 hover:bg-white/45 border border-white/45'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Channel List Header */}
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200/40 shrink-0">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
                {isGreek ? 'ΚΑΝΑΛΙΑ' : 'CHANNELS'}
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#84cc16] bg-lime-500/10 px-2 py-0.5 rounded-full border border-lime-500/20">
                {conversations.length} {isGreek ? 'ΕΝΕΡΓΑ' : 'ACTIVE'}
              </span>
            </div>

            {/* Scrollable Conversation List */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
              <ConversationList
                onSelect={(id) => dispatch(setActiveConversation(id))}
                selectedId={activeConversationId}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </div>
          </motion.div>

          {/* Right Column: Chat Window or Empty State */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className={`flex-1 h-full min-h-0 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-[32px] border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden relative flex-col transition-all duration-300 ${activeConversationId ? 'flex' : 'hidden lg:flex'}`}
          >
            <AnimatePresence mode="wait">
              {activeConversationId ? (
                <motion.div 
                  key={activeConversationId}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="w-full h-full min-h-0 flex flex-col"
                >
                  <ChatWindow 
                    conversationId={activeConversationId} 
                    onBack={() => dispatch(setActiveConversation(null))}
                  />
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 sm:p-16 my-auto">
                  <div className="size-20 sm:size-24 rounded-3xl bg-white/35 border border-white/50 flex items-center justify-center mb-6 text-gray-400 shadow-xs backdrop-blur-md">
                    <MessageSquare className="size-10 sm:size-12 text-[#84cc16]" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight mb-2 text-gray-900">
                    {isGreek ? 'ΕΠΙΛΕΞΤΕ ΣΥΝΟΜΙΛΙΑ' : 'SELECT A CONVERSATION'}
                  </h2>
                  <p className="text-xs sm:text-sm font-semibold text-gray-500 max-w-md leading-relaxed">
                    {isGreek
                      ? 'Επιλέξτε μια συνομιλία από τη λίστα για να δείτε τα μηνύματα και τις ενημερώσεις ραντεβού.'
                      : 'Choose a conversation from the list or start a new conversation to communicate.'}
                  </p>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
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

export default MessagesPage;
