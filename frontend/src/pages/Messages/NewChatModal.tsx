import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { X, Search, ArrowRight, Check, Users } from 'lucide-react';
import { userAPI } from '../../services/api';
import { createConversation } from '../../store/slices/messagesSlice';
import type { AppDispatch } from '../../store';
import { motion, AnimatePresence } from 'framer-motion';

interface NewChatModalProps {
 onClose: () => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ onClose }) => {
 const dispatch = useDispatch<AppDispatch>();
 const [searchTerm, setSearchTerm] = useState('');
 const [results, setResults] = useState<any[]>([]);
 const [isLoading, setIsLoading] = useState(false);
 const [searchError, setSearchError] = useState(false);
 const [selectedUsers, setSelectedUsers] = useState<any[]>([]);

 useEffect(() => {
 const delayDebounceFn = setTimeout(() => {
 if (searchTerm.length >= 2) {
 searchUsers();
 } else {
 setResults([]);
 }
 }, 300);

 return () => clearTimeout(delayDebounceFn);
 }, [searchTerm]);

 const searchUsers = async () => {
 setIsLoading(true);
 setSearchError(false);
 try {
 const response = await userAPI.getAllUsers({ search: searchTerm, limit: 50 });
 const users = Array.isArray(response.data) ? response.data : response.data.users || [];
 setResults(users);
 } catch (error) {
 console.error('Failed to search users:', error);
 setSearchError(true);
 setResults([]);
 } finally {
 setIsLoading(false);
 }
 };

 const toggleUser = (user: any) => {
 if (selectedUsers.find(u => u.id === user.id)) {
 setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
 } else {
 setSelectedUsers([...selectedUsers, user]);
 }
 };

 const handleLaunchChannel = async () => {
 if (selectedUsers.length === 0) return;
 const participantIds = selectedUsers.map(u => u.id);
 const isGroup = participantIds.length > 1;
 
 await dispatch(createConversation({ 
 participantIds, 
 isGroup,
 title: isGroup ? selectedUsers.map(u => u.firstName).join(', ') : undefined
 }));
 onClose();
 };

 return (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 md:p-10">
  <motion.div 
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  onClick={onClose}
  className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm"
  />
  
  <motion.div 
  initial={{ opacity: 0, scale: 0.9, y: 20 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  exit={{ opacity: 0, scale: 0.9, y: 20 }}
  className="bg-white rounded-2xl sm:rounded-[36px] md:rounded-[48px] w-full max-w-2xl shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden relative z-10 flex flex-col max-h-[85vh] sm:h-[700px] border border-white/20"
  >
  {/* Header Section */}
  <header className="p-4 sm:p-8 md:p-10 bg-gray-50 text-gray-900 border-b border-gray-100 relative overflow-hidden shrink-0">
  <div className="absolute top-0 right-0 w-64 h-full bg-[#CBFF38]/10 blur-3xl rounded-full translate-x-1/2" />
  
  <div className="flex items-center justify-between relative z-10">
  <div className="space-y-1.5 sm:space-y-3">
  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 sm:py-1 bg-white rounded-full border border-gray-200 shadow-sm">
  <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
  <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600">New Conversation</span>
  </div>
  <h2 className="text-xl sm:text-3xl md:text-4xl font-black uppercase tracking-tighter leading-none">Start New Chat</h2>
  </div>
  <button 
  onClick={onClose} 
  className="size-9 sm:size-12 bg-white border border-gray-200 rounded-xl sm:rounded-2xl flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 hover:border-gray-300 transition-all group shadow-sm shrink-0"
  >
  <X className="size-4 sm:size-5 group-hover:rotate-90 transition-transform" />
  </button>
  </div>
  </header>

  <div className="p-4 sm:p-8 md:p-10 flex-1 flex flex-col min-h-0 overflow-hidden bg-white">
  {/* Selected Users HUD */}
  <AnimatePresence>
  {selectedUsers.length > 0 && (
  <motion.div 
  initial={{ height: 0, opacity: 0, marginBottom: 0 }}
  animate={{ height: 'auto', opacity: 1, marginBottom: 16 }}
  exit={{ height: 0, opacity: 0, marginBottom: 0 }}
  className="overflow-hidden shrink-0"
  >
  <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border border-gray-100 rounded-2xl items-center shadow-sm">
  {selectedUsers.map(user => (
  <motion.div 
  layout
  initial={{ scale: 0.5, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  key={user.id} 
  className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 bg-white rounded-lg border border-gray-200 shadow-sm"
  >
  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tighter text-gray-900 truncate max-w-[80px] sm:max-w-[100px]">{user.firstName}</span>
  <button 
  onClick={() => toggleUser(user)}
  className="size-4 rounded hover:bg-gray-100 flex items-center justify-center transition-colors"
  >
  <X size={10} className="text-gray-400" />
  </button>
  </motion.div>
  ))}
  <div className="flex-1" />
  <button 
  onClick={handleLaunchChannel}
  className="px-4 py-1.5 bg-gray-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:scale-105 active:scale-95 transition-all shadow-md"
  >
  Start Chat ({selectedUsers.length})
  </button>
  </div>
  </motion.div>
  )}
  </AnimatePresence>

  {/* Search Bar */}
  <div className="relative group mb-4 sm:mb-6 shrink-0">
  <Search className="absolute left-3.5 sm:left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors size-4 sm:size-5" />
  <input
  autoFocus
  type="text"
  placeholder="Search peer or patient name..."
  className="w-full h-11 sm:h-14 pl-10 sm:pl-14 pr-4 bg-white border border-gray-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-black focus:border-black transition-all shadow-sm"
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  />
  </div>

  {/* Results Area */}
  <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-2 sm:space-y-3 pr-1">
  <AnimatePresence mode="popLayout">
  {isLoading ? (
  <motion.div 
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  className="flex flex-col items-center justify-center py-12 gap-3"
  >
  <div className="size-8 border-3 border-gray-900 border-t-transparent rounded-full animate-spin" />
  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Searching users...</p>
  </motion.div>
  ) : searchError ? (
  <motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  className="flex flex-col items-center justify-center py-12 gap-3"
  >
  <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Couldn't load users. Try again.</p>
  </motion.div>
  ) : results.length > 0 ? (
  results.map((user, idx) => {
  const isSelected = selectedUsers.find(u => u.id === user.id);
  return (
  <motion.button
  initial={{ opacity: 0, x: -20 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ delay: idx * 0.05 }}
  key={user.id}
  onClick={() => toggleUser(user)}
  className={`w-full p-3 sm:p-4 bg-white rounded-xl sm:rounded-2xl border flex items-center gap-3 sm:gap-4 group transition-all shadow-sm hover:shadow-md ${isSelected ? 'border-gray-900 bg-gray-50' : 'border-gray-100 hover:border-gray-200'}`}
  >
  <div className={`size-10 sm:size-12 rounded-xl flex items-center justify-center font-black text-xs sm:text-base border transition-all shrink-0 ${isSelected ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-50 text-gray-400 border-gray-100 group-hover:bg-gray-100 group-hover:text-gray-900'}`}>
  {isSelected ? <Check size={20} /> : `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`}
  </div>
  <div className="text-left flex-1 min-w-0">
  <div className="font-black uppercase tracking-tight text-xs sm:text-sm leading-snug text-gray-900 truncate">
  {user.firstName} {user.lastName}
  </div>
  <div className="flex items-center gap-2 flex-wrap">
  <span className={`text-[8px] font-black uppercase tracking-widest bg-gray-100 px-1.5 py-0.5 rounded transition-colors ${isSelected ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900'}`}>{user.role?.replace('_', ' ')}</span>
  <span className={`text-[9px] sm:text-[10px] font-bold truncate transition-colors ${isSelected ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'}`}>{user.email}</span>
  </div>
  </div>
  <div className={`size-7 sm:size-9 rounded-full border flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-gray-900 border-gray-900 text-white' : 'border-gray-100 group-hover:bg-gray-100 group-hover:text-gray-900 group-hover:border-gray-200 text-gray-400'}`}>
  {isSelected ? <X size={14} /> : <ArrowRight size={14} />}
  </div>
  </motion.button>
  );
  })
  ) : searchTerm.length >= 2 ? (
  <motion.div 
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200"
  >
  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">No users found</p>
  </motion.div>
  ) : (
  <div className="text-center py-10">
  <div className="size-12 sm:size-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
  <Search className="text-gray-400 size-5 sm:size-8" />
  </div>
  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4">Search by name to start chatting</p>
  </div>
  )}
  </AnimatePresence>
  </div>
  </div>

  {/* Footer Tip */}
  <footer className="p-3 sm:p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-center shrink-0">
  <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5 text-center leading-tight">
  <Users size={12} className="text-gray-400 shrink-0" />
  Select multiple users to create a group chat.
  </p>
  </footer>
  </motion.div>
  </div>
 );
};
