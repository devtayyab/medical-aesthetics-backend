import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MessageSquare, Plus } from 'lucide-react';
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
import { Button } from '@/components/atoms/Button/Button';

export const MessagesPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { activeConversationId } = useSelector((state: RootState) => state.messages);
    const { accessToken } = useSelector((state: RootState) => state.auth);
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
        <div className="flex h-[calc(100vh-100px)] overflow-hidden bg-white rounded-xl shadow-sm border border-slate-200 m-4 relative">
            {/* Sidebar */}
            <div className="w-80 flex-shrink-0 flex flex-col border-r border-gray-50">
                <ConversationList
                    onSelect={(id) => dispatch(setActiveConversation(id))}
                    selectedId={activeConversationId}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                />

                <div className="p-4 bg-slate-50 border-t border-slate-100">
                    <Button
                        onClick={() => setShowNewChatModal(true)}
                        className="w-full justify-center gap-2 rounded-lg py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold shadow-sm transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        New Message
                    </Button>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-gray-50/20">
                {activeConversationId ? (
                    <ChatWindow conversationId={activeConversationId} />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/50">
                        <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mb-6 shadow-sm border border-slate-200">
                            <MessageSquare className="w-8 h-8 text-blue-500" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Select a Conversation</h2>
                        <p className="text-slate-500 max-w-sm font-medium text-sm leading-relaxed">
                            Choose a message from your list on the left to start chatting with your clinics, salespersons or clients.
                        </p>
                        <div className="mt-8 flex gap-3">
                            <Button variant="outline" className="rounded-lg px-6 h-10 text-xs font-bold border-slate-200 hover:bg-slate-50 text-slate-600">View Help</Button>
                            <Button className="rounded-lg px-6 h-10 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm">Browse Contacts</Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Sidebar / Info (Optional) */}
            <div className="w-72 border-l border-slate-200 bg-white p-6 hidden xl:block">
                <div className="flex items-center gap-2 mb-6">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded inline-block border border-slate-100">
                        Messaging Tips
                    </div>
                </div>
                <div className="space-y-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-blue-50 text-blue-600 rounded-md flex items-center justify-center font-bold text-xs border border-blue-100">1</div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clinics</span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">Clinics can message their assigned salespersons and clients directly.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-indigo-50 text-indigo-600 rounded-md flex items-center justify-center font-bold text-xs border border-indigo-100">2</div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Salespersons</span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">Salespersons can coordinate with clinic owners and update clients.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-emerald-50 text-emerald-600 rounded-md flex items-center justify-center font-bold text-xs border border-emerald-100">3</div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clients</span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">Clients can reach out to both their clinic and dedicated advisor.</p>
                    </div>
                </div>
            </div>

            {showNewChatModal && (
                <NewChatModal onClose={() => setShowNewChatModal(false)} />
            )}
        </div>
    );
};
