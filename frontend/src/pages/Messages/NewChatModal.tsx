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
        try {
            const response = await userAPI.getAllUsers({ search: searchTerm, limit: 50 });
            const users = Array.isArray(response.data) ? response.data : response.data.users || [];
            setResults(users);
        } catch (error) {
            console.error('Failed to search users:', error);
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
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
                className="bg-white rounded-[48px] w-full max-w-2xl shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden relative z-10 flex flex-col h-[750px] border border-white/20"
            >
                {/* Header Section */}
                <header className="p-8 md:p-12 bg-black text-white relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 w-64 h-full bg-[#CBFF38]/10 blur-3xl rounded-full translate-x-1/2" />
                    
                    <div className="flex items-center justify-between relative z-10">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 backdrop-blur-md rounded-full border border-white/10">
                                <div className="size-1.5 rounded-full bg-[#CBFF38] animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#CBFF38] italic">Neural Handshake</span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter leading-none">Initialize Channel</h2>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="size-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-[#CBFF38] hover:text-black transition-all group shadow-xl"
                        >
                            <X size={24} className="group-hover:rotate-90 transition-transform" />
                        </button>
                    </div>
                </header>

                <div className="p-8 md:p-12 flex-1 flex flex-col overflow-hidden bg-gray-50/30">
                    {/* Selected Users HUD */}
                    <AnimatePresence>
                        {selectedUsers.length > 0 && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                                animate={{ height: 'auto', opacity: 1, marginBottom: 40 }}
                                exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="flex flex-wrap gap-2 p-4 bg-black rounded-3xl items-center shadow-lg">
                                    {selectedUsers.map(user => (
                                        <motion.div 
                                            layout
                                            initial={{ scale: 0.5, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            key={user.id} 
                                            className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-white/10 rounded-xl border border-white/5"
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-tighter text-white truncate max-w-[100px]">{user.firstName}</span>
                                            <button 
                                                onClick={() => toggleUser(user)}
                                                className="size-5 rounded-md hover:bg-white/20 flex items-center justify-center transition-colors"
                                            >
                                                <X size={12} className="text-gray-400" />
                                            </button>
                                        </motion.div>
                                    ))}
                                    <div className="flex-1" />
                                    <button 
                                        onClick={handleLaunchChannel}
                                        className="px-6 py-2 bg-[#CBFF38] text-black text-[10px] font-black uppercase italic tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#CBFF38]/20"
                                    >
                                        Establish Link ({selectedUsers.length})
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Search Bar */}
                    <div className="relative group mb-10">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-black transition-colors" size={20} />
                        <input
                            autoFocus
                            type="text"
                            placeholder="FIND PEER OR PATIENT VECTOR..."
                            className="w-full h-20 pl-16 pr-8 bg-white border-none rounded-[32px] text-sm font-black italic tracking-widest text-gray-900 placeholder:text-gray-200 focus:ring-2 focus:ring-black transition-all shadow-xl shadow-gray-200/50 uppercase"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Results Area */}
                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-2">
                        <AnimatePresence mode="popLayout">
                            {isLoading ? (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center justify-center py-20 gap-4"
                                >
                                    <div className="size-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Scanning clinical registry...</p>
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
                                            className={`w-full p-6 bg-white rounded-[32px] border flex items-center gap-6 group transition-all shadow-sm hover:shadow-2xl hover:-translate-y-1 ${isSelected ? 'border-black bg-gray-50' : 'border-gray-100 hover:bg-black hover:text-[#CBFF38]'}`}
                                        >
                                            <div className={`size-16 rounded-2xl flex items-center justify-center font-black text-xl italic border transition-all shadow-inner ${isSelected ? 'bg-black text-[#CBFF38] border-black scale-110' : 'bg-gray-50 text-gray-400 border-gray-100 group-hover:bg-[#CBFF38] group-hover:text-black group-hover:rotate-6'}`}>
                                                {isSelected ? <Check size={28} /> : `${user.firstName[0]}${user.lastName[0]}`}
                                            </div>
                                            <div className="text-left flex-1 min-w-0">
                                                <div className="font-black uppercase italic tracking-tighter text-lg leading-none mb-1 truncate">
                                                    {user.firstName} {user.lastName}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                   <span className={`text-[9px] font-black uppercase tracking-widest italic bg-black/5 px-2 py-0.5 rounded transition-colors ${isSelected ? 'text-black bg-black/10' : 'text-[#CBFF38] group-hover:bg-[#CBFF38]/20 group-hover:text-[#CBFF38]'}`}>{user.role?.replace('_', ' ')}</span>
                                                   <span className={`text-[10px] font-bold truncate transition-colors ${isSelected ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'}`}>{user.email}</span>
                                                </div>
                                            </div>
                                            <div className={`size-10 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'bg-black border-black text-[#CBFF38]' : 'border-gray-100 group-hover:bg-[#CBFF38] group-hover:text-black group-hover:border-[#CBFF38] opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0'}`}>
                                                {isSelected ? <X size={20} /> : <ArrowRight size={20} />}
                                            </div>
                                        </motion.button>
                                    );
                                })
                            ) : searchTerm.length >= 2 ? (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center py-20 bg-white rounded-[40px] border border-dashed border-gray-200"
                                >
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-300 italic">No valid transmission targets identified</p>
                                </motion.div>
                            ) : (
                                <div className="text-center py-20">
                                    <div className="size-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                       <Search className="text-gray-200" size={32} />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Enter parameters to scan neural registry</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Footer Tip */}
                <footer className="p-8 bg-black/5 flex items-center justify-center shrink-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 italic flex items-center gap-2">
                       <Users size={12} className="text-[#CBFF38]" />
                       Multi-Participant channels enabled. Select targets to establish link.
                    </p>
                </footer>
            </motion.div>
        </div>
    );
};
