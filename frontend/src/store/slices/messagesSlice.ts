import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../services/api';

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    type: string;
    createdAt: string;
    sender: {
        id: string;
        firstName: string;
        lastName: string;
        profilePictureUrl?: string;
    };
}

export interface ConversationParticipant {
    userId: string;
    conversationId: string;
    lastReadAt?: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
        profilePictureUrl?: string;
    };
}

export interface Conversation {
    id: string;
    title?: string;
    isGroup: boolean;
    lastMessage?: Message;
    participants: ConversationParticipant[];
    updatedAt: string;
    unreadCount?: number;
}
interface MessagesState {
    conversations: Conversation[];
    searchResults: Conversation[];
    activeConversationMessages: Message[];
    activeConversationId: string | null;
    isLoading: boolean;
    isMessagesLoading: boolean;
    error: string | null;
}

const initialState: MessagesState = {
    conversations: [],
    searchResults: [],
    activeConversationMessages: [],
    activeConversationId: null,
    isLoading: false,
    isMessagesLoading: false,
    error: null,
};

export const fetchConversations = createAsyncThunk(
    'messages/fetchConversations',
    async () => {
        const response = await api.get('/messages/conversations');
        return response.data;
    }
);

export const fetchMessages = createAsyncThunk(
    'messages/fetchMessages',
    async ({ conversationId, limit = 50, offset = 0 }: { conversationId: string; limit?: number; offset?: number }) => {
        const response = await api.get(`/messages/conversations/${conversationId}/messages`, {
            params: { limit, offset }
        });
        return { conversationId, messages: response.data };
    }
);

export const sendMessage = createAsyncThunk(
    'messages/sendMessage',
    async ({ conversationId, content, type = 'text' }: { conversationId: string; content: string; type?: string }) => {
        const response = await api.post(`/messages/conversations/${conversationId}/messages`, { content, type });
        return response.data;
    }
);

export const createConversation = createAsyncThunk(
    'messages/createConversation',
    async (participantIds: string[]) => {
        const response = await api.post('/messages/conversations', { participantIds });
        return response.data;
    }
);

export const searchConversations = createAsyncThunk(
    'messages/searchConversations',
    async (query: string) => {
        const response = await api.get('/messages/search', { params: { q: query } });
        return response.data;
    }
);

const messagesSlice = createSlice({
    name: 'messages',
    initialState,
    reducers: {
        setActiveConversation: (state, action: PayloadAction<string | null>) => {
            state.activeConversationId = action.payload;
            if (!action.payload) {
                state.activeConversationMessages = [];
            } else {
                // Optimistically mark as read when opening
                const conv = state.conversations.find(c => c.id === action.payload);
                if (conv) conv.unreadCount = 0;
            }
        },
        receiveMessage: (state, action: PayloadAction<Message>) => {
            if (state.activeConversationId === action.payload.conversationId) {
                state.activeConversationMessages.push(action.payload);
            }

            // Update last message in conversation list
            const conv = state.conversations.find(c => c.id === action.payload.conversationId);
            if (conv) {
                conv.lastMessage = action.payload;
                conv.updatedAt = action.payload.createdAt;

                // Increment unread count if not active
                if (state.activeConversationId !== action.payload.conversationId) {
                    conv.unreadCount = (conv.unreadCount || 0) + 1;
                }

                // Move to top
                state.conversations = [
                    conv,
                    ...state.conversations.filter(c => c.id !== action.payload.conversationId)
                ];
            } else {
                // If conversation doesn't exist in list (e.g., new one started by someone else), fetch it or handle 'newConversation' event separately.
                // Assuming 'newConversation' event handles the addition, but if message arrives first?
                // For now, rely on newConversation event.
            }
        },
        newConversation: (state, action: PayloadAction<Conversation>) => {
            if (!state.conversations.find(c => c.id === action.payload.id)) {
                state.conversations.unshift({ ...action.payload, unreadCount: 1 }); // Assume 1 unread if new
            }
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchConversations.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchConversations.fulfilled, (state, action) => {
                state.isLoading = false;
                state.conversations = action.payload;
            })
            .addCase(fetchConversations.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Failed to fetch conversations';
            })
            .addCase(fetchMessages.pending, (state) => {
                state.isMessagesLoading = true;
            })
            .addCase(fetchMessages.fulfilled, (state, action) => {
                state.isMessagesLoading = false;
                state.activeConversationMessages = action.payload.messages;
                // Reset unread count
                const conv = state.conversations.find(c => c.id === action.payload.conversationId);
                if (conv) conv.unreadCount = 0;
            })
            .addCase(fetchMessages.rejected, (state, action) => {
                state.isMessagesLoading = false;
                state.error = action.error.message || 'Failed to fetch messages';
            })
            .addCase(createConversation.fulfilled, (state, action) => {
                if (!state.conversations.find(c => c.id === action.payload.id)) {
                    state.conversations.unshift({ ...action.payload, unreadCount: 0 });
                }
                state.activeConversationId = action.payload.id;
            })
            .addCase(searchConversations.fulfilled, (state, action) => {
                state.searchResults = action.payload;
            });
    },
});

export const { setActiveConversation, receiveMessage, newConversation } = messagesSlice.actions;
export default messagesSlice.reducer;
