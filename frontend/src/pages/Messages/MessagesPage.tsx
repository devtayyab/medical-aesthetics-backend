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
        <div className="flex h-[calc(100vh-100px)] overflow-hidden bg-white rounded-2xl shadow-xl border border-gray-100 m-4 relative">
            {/* Sidebar */}
            <div className="w-80 flex-shrink-0 flex flex-col border-r border-gray-50">
                <ConversationList
                    onSelect={(id) => dispatch(setActiveConversation(id))}
                    selectedId={activeConversationId}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                />

                <div className="p-4 bg-white border-t border-gray-50">
                    <Button
                        onClick={() => setShowNewChatModal(true)}
                        className="w-full justify-center gap-2 rounded-xl py-6 font-bold shadow-lg shadow-blue-100 transition-all hover:scale-[1.02]"
                    >
                        <Plus className="w-5 h-5" />
                        New Messages
                    </Button>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-gray-50/20">
                {activeConversationId ? (
                    <ChatWindow conversationId={activeConversationId} />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-blue-100/50">
                            <MessageSquare className="w-10 h-10 text-blue-500" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">Select a Conversation</h2>
                        <p className="text-gray-500 max-w-sm font-medium leading-relaxed">
                            Choose a message from your list on the left to start chatting with your clinics, salespersons or clients.
                        </p>
                        <div className="mt-8 flex gap-3">
                            <Button variant="outline" className="rounded-xl px-6 font-bold border-gray-200">View Help</Button>
                            <Button className="rounded-xl px-6 font-bold shadow-md shadow-blue-100">Browse Contacts</Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Sidebar / Info (Optional) */}
            <div className="w-64 border-l border-gray-50 bg-white p-6 hidden xl:block">
                <h3 className="font-black text-gray-900 mb-6 uppercase tracking-widest text-[10px]">Messaging Tips</h3>
                <div className="space-y-6">
                    <div className="group cursor-default">
                        <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center mb-2 font-bold text-xs ring-4 ring-emerald-50/50 transition-all group-hover:scale-110">1</div>
                        <p className="text-xs text-gray-500 font-bold leading-relaxed">Clinics can message their assigned salespersons and clients directly.</p>
                    </div>
                    <div className="group cursor-default">
                        <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-2 font-bold text-xs ring-4 ring-blue-50/50 transition-all group-hover:scale-110">2</div>
                        <p className="text-xs text-gray-500 font-bold leading-relaxed">Salespersons can coordinate with clinic owners and update clients.</p>
                    </div>
                    <div className="group cursor-default">
                        <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mb-2 font-bold text-xs ring-4 ring-purple-50/50 transition-all group-hover:scale-110">3</div>
                        <p className="text-xs text-gray-500 font-bold leading-relaxed">Clients can reach out to both their clinic and dedicated advisor.</p>
                    </div>
                </div>
            </div>

            {showNewChatModal && (
                <NewChatModal onClose={() => setShowNewChatModal(false)} />
            )}
        </div>
    );
};
