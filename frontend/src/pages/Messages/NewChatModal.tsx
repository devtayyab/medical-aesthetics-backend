import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { X, Search, UserPlus, Loader2 } from 'lucide-react';
import { userAPI } from '../../services/api';
import { createConversation } from '../../store/slices/messagesSlice';
import type { AppDispatch } from '../../store';

interface NewChatModalProps {
    onClose: () => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ onClose }) => {
    const dispatch = useDispatch<AppDispatch>();
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

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
            const response = await userAPI.getAllUsers({ limit: 10 });
            // Filter locally for now as getAllUsers might not support search q yet
            const users = Array.isArray(response.data) ? response.data : response.data.users || [];
            const filtered = users.filter((u: any) =>
                u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setResults(filtered);
        } catch (error) {
            console.error('Failed to search users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartChat = async (userId: string) => {
        await dispatch(createConversation([userId]));
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in transition-all">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden transform animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-blue-600" />
                        New Conversation
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="relative mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Search by name or email..."
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent focus:border-blue-500 rounded-2xl text-sm transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/10 font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar space-y-2">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                                <p className="text-xs font-bold uppercase tracking-widest">Searching Users...</p>
                            </div>
                        ) : results.length > 0 ? (
                            results.map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => handleStartChat(user.id)}
                                    className="w-full p-4 flex items-center gap-4 hover:bg-blue-50/50 rounded-2xl transition-all border border-transparent hover:border-blue-100 group"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-blue-600 font-black text-lg shadow-sm border border-blue-100/50 transition-transform group-hover:scale-105">
                                        {user.firstName[0]}{user.lastName[0]}
                                    </div>
                                    <div className="text-left flex-1">
                                        <div className="font-black text-gray-900 group-hover:text-blue-700 transition-colors">
                                            {user.firstName} {user.lastName}
                                        </div>
                                        <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">{user.role}</div>
                                        <div className="text-xs text-gray-500 truncate mt-1">{user.email}</div>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <UserPlus className="w-5 h-5 text-blue-500" />
                                    </div>
                                </button>
                            ))
                        ) : searchTerm.length >= 2 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-400 font-black uppercase tracking-widest text-xs">No users found</p>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-400">
                                <p className="text-xs font-bold uppercase tracking-widest">Type to search for contacts</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
