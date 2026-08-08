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
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 md:p-10">
  <motion.div 
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  onClick={onClose}
  className="absolute inset-0 bg-black/80 backdrop-blur-xl"
  />
  
  <motion.div 
  initial={{ opacity: 0, scale: 0.9, y: 20 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  exit={{ opacity: 0, scale: 0.9, y: 20 }}
  className="bg-white rounded-2xl sm:rounded-[36px] md:rounded-[48px] w-full max-w-2xl shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden relative z-10 flex flex-col max-h-[85vh] sm:h-[700px] border border-white/20"
  >
  {/* Header Section */}
  <header className="p-4 sm:p-8 md:p-10 bg-black text-white relative overflow-hidden shrink-0">
  <div className="absolute top-0 right-0 w-64 h-full bg-[#CBFF38]/10 blur-3xl rounded-full translate-x-1/2" />
  
  <div className="flex items-center justify-between relative z-10">
  <div className="space-y-1.5 sm:space-y-3">
  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 sm:py-1 bg-white/5 backdrop-blur-md rounded-full border border-white/10">
  <div className="size-1.5 rounded-full bg-[#CBFF38] animate-pulse" />
  <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-[#CBFF38]">Neural Handshake</span>
  </div>
  <h2 className="text-xl sm:text-3xl md:text-4xl font-black uppercase tracking-tighter leading-none">Initialize Channel</h2>
  </div>
  <button 
  onClick={onClose} 
  className="size-9 sm:size-12 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center hover:bg-[#CBFF38] hover:text-black transition-all group shadow-xl shrink-0"
  >
  <X className="size-4 sm:size-5 group-hover:rotate-90 transition-transform" />
  </button>
  </div>
  </header>

  <div className="p-4 sm:p-8 md:p-10 flex-1 flex flex-col min-h-0 overflow-hidden bg-gray-50/30">
  {/* Selected Users HUD */}
  <AnimatePresence>
  {selectedUsers.length > 0 && (
  <motion.div 
  initial={{ height: 0, opacity: 0, marginBottom: 0 }}
  animate={{ height: 'auto', opacity: 1, marginBottom: 16 }}
  exit={{ height: 0, opacity: 0, marginBottom: 0 }}
  className="overflow-hidden shrink-0"
  >
  <div className="flex flex-wrap gap-2 p-3 bg-black rounded-2xl items-center shadow-lg">
  {selectedUsers.map(user => (
  <motion.div 
  layout
  initial={{ scale: 0.5, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  key={user.id} 
  className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 bg-white/10 rounded-lg border border-white/5"
  >
  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tighter text-white truncate max-w-[80px] sm:max-w-[100px]">{user.firstName}</span>
  <button 
  onClick={() => toggleUser(user)}
  className="size-4 rounded hover:bg-white/20 flex items-center justify-center transition-colors"
  >
  <X size={10} className="text-gray-400" />
  </button>
  </motion.div>
  ))}
  <div className="flex-1" />
  <button 
  onClick={handleLaunchChannel}
  className="px-4 py-1.5 bg-[#CBFF38] text-black text-[9px] font-black uppercase tracking-widest rounded-lg hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#CBFF38]/20"
  >
  Establish Link ({selectedUsers.length})
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
  <div className="size-8 border-3 border-black border-t-transparent rounded-full animate-spin" />
  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Scanning clinical registry...</p>
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
  className={`w-full p-3 sm:p-4 bg-white rounded-xl sm:rounded-2xl border flex items-center gap-3 sm:gap-4 group transition-all shadow-sm hover:shadow-md ${isSelected ? 'border-black bg-gray-50' : 'border-gray-100 hover:bg-black hover:text-[#CBFF38]'}`}
  >
  <div className={`size-10 sm:size-12 rounded-xl flex items-center justify-center font-black text-xs sm:text-base border transition-all shrink-0 ${isSelected ? 'bg-black text-[#CBFF38] border-black' : 'bg-gray-50 text-gray-500 border-gray-100 group-hover:bg-[#CBFF38] group-hover:text-black'}`}>
  {isSelected ? <Check size={20} /> : `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`}
  </div>
  <div className="text-left flex-1 min-w-0">
  <div className="font-black uppercase tracking-tight text-xs sm:text-sm leading-snug truncate">
  {user.firstName} {user.lastName}
  </div>
  <div className="flex items-center gap-2 flex-wrap">
  <span className={`text-[8px] font-black uppercase tracking-widest bg-black/5 px-1.5 py-0.5 rounded transition-colors ${isSelected ? 'text-black bg-black/10' : 'text-gray-700 group-hover:bg-[#CBFF38]/20 group-hover:text-[#CBFF38]'}`}>{user.role?.replace('_', ' ')}</span>
  <span className={`text-[9px] sm:text-[10px] font-bold truncate transition-colors ${isSelected ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-400'}`}>{user.email}</span>
  </div>
  </div>
  <div className={`size-7 sm:size-9 rounded-full border flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-black border-black text-[#CBFF38]' : 'border-gray-100 group-hover:bg-[#CBFF38] group-hover:text-black group-hover:border-[#CBFF38]'}`}>
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
  <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">No valid transmission targets identified</p>
  </motion.div>
  ) : (
  <div className="text-center py-10">
  <div className="size-12 sm:size-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
  <Search className="text-gray-400 size-5 sm:size-8" />
  </div>
  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4">Enter parameters to scan neural registry</p>
  </div>
  )}
  </AnimatePresence>
  </div>
  </div>

  {/* Footer Tip */}
  <footer className="p-3 sm:p-4 bg-black/5 flex items-center justify-center shrink-0">
  <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5 text-center leading-tight">
  <Users size={12} className="text-[#CBFF38] shrink-0" />
  Multi-Participant channels enabled. Select targets to establish link.
  </p>
  </footer>
  </motion.div>
  </div>
 );
};
