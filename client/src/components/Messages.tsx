import React, { useState, useEffect } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

// Types for chat functionality
interface Conversation {
  _id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  lastMessageAt: string;
  createdAt: string;
  listing?: {
    _id: string;
    title: string;
    price: number;
  };
  buyer?: {
    _id: string;
    name: string;
    email: string;
  };
  seller?: {
    _id: string;
    name: string;
    email: string;
  };
}

interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  sender?: {
    _id: string;
    name: string;
    email: string;
  };
}

interface MessagesProps {
  onNavigate: (view: string) => void;
  initialConversationId?: string;
}

export const Messages: React.FC<MessagesProps> = ({ onNavigate, initialConversationId }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load conversations on component mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Select initial conversation
  useEffect(() => {
    if (conversations.length === 0) return;
    const first = conversations.find(c => c._id === initialConversationId) || conversations[0];
    setSelectedConversation(prev => prev ?? first);
  }, [conversations, initialConversationId]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation._id);
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/chats/');
      setConversations(response.data.conversations || []);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await api.get(`/api/chats/${conversationId}/messages`);
      setMessages(response.data.messages || []);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load messages');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    try {
      const response = await api.post(`/api/chats/${selectedConversation._id}/messages`, {
        body: newMessage.trim()
      });

      // Add the new message to the local state
      setMessages(prev => [...prev, response.data.message]);
      
      // Update conversation last message time
      setConversations(prev => {
        const updated = prev.map(c =>
          c._id === selectedConversation._id
            ? { ...c, lastMessageAt: new Date().toISOString() }
            : c
        );
        return updated.sort((a, b) => 
          new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
        );
      });

      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getOtherPartyName = (conv: Conversation) => {
    if (conv.buyerId === user?._id) {
      return conv.seller?.name || 'Unknown';
    }
    return conv.buyer?.name || 'Unknown';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center text-white font-bold text-sm">
                CM
              </div>
              <h1 className="text-xl font-semibold text-gray-900">
                Campus Market
              </h1>
            </div>
            <div className="flex items-center gap-6">
              <button
                onClick={() => onNavigate('marketplace')}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Marketplace
              </button>
              <button
                onClick={() => onNavigate('messages')}
                className="text-sm font-medium text-gray-900 flex items-center gap-2"
              >
                <MessageSquare className="w-5 h-5" />
                Messages
              </button>
              <button className="text-sm text-gray-600 hover:text-gray-900">
                <span className="w-5 h-5">👤</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-3xl font-semibold text-gray-900 mb-8">Messages</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-240px)]">
          <div className="col-span-4 bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Conversations
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>No conversations yet</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv._id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full p-5 border-b border-gray-100 hover:bg-gray-50 text-left transition-colors ${
                      selectedConversation?._id === conv._id ? 'bg-gray-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-semibold flex-shrink-0">
                        {getOtherPartyName(conv).charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between mb-1">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {getOtherPartyName(conv)}
                          </h4>
                          <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                            {formatDate(conv.lastMessageAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {conv.listing?.title} - ${conv.listing?.price}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="col-span-8 bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col">
            {selectedConversation ? (
              <>
                <div className="p-5 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-semibold">
                      {getOtherPartyName(selectedConversation).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {getOtherPartyName(selectedConversation)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {selectedConversation.listing?.title} - ${selectedConversation.listing?.price}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.map((message) => {
                    const isCurrentUser = message.senderId === user?._id;
                    return (
                      <div
                        key={message._id}
                        className={`flex ${
                          isCurrentUser ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div className={`max-w-[70%] ${isCurrentUser ? '' : ''}`}>
                          <div
                            className={`px-4 py-3 rounded-2xl ${
                              isCurrentUser
                                ? 'bg-gray-100 text-gray-900'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm leading-relaxed">
                              {message.body}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 px-2">
                            {formatTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-5 border-t border-gray-200">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-3 bg-gray-100 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="bg-black text-white p-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <p>Select a conversation to start messaging</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
