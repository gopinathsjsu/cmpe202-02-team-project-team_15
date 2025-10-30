import React, { useState, useRef, useEffect, useMemo } from 'react';
import { apiService } from '../services/api';
import { Send, X, Bot, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const storageKey = useMemo(() => (user ? `chatbot:messages:${user.id}` : ''), [user?.id]);

  // Do not render chatbot UI if user is not authenticated
  if (!user) return null;

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const stored = storageKey ? sessionStorage.getItem(storageKey) : null;
      if (stored) return JSON.parse(stored) as ChatMessage[];
    } catch (e) {
      // ignore parse errors and fall back to default greeting
    }
    return [
      {
        role: 'assistant',
        content:
          'Hi! I\'m your campus marketplace assistant. I can help you find information about products, categories, and answer questions about our marketplace. What would you like to know?'
      }
    ];
  });
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Persist messages to sessionStorage for the current user (clears on tab close)
  useEffect(() => {
    try {
      if (storageKey) {
        sessionStorage.setItem(storageKey, JSON.stringify(messages));
      }
    } catch (e) {
      // ignore storage errors (quota, etc.)
    }
  }, [messages, storageKey]);

  // When the user changes (login/logout), load that user's stored conversation if present
  useEffect(() => {
    try {
      if (!storageKey) return;
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        setMessages(JSON.parse(stored) as ChatMessage[]);
      } else {
        setMessages([
          {
            role: 'assistant',
            content:
              'Hi! I\'m your campus marketplace assistant. I can help you find information about products, categories, and answer questions about our marketplace. What would you like to know?'
          }
        ]);
      }
    } catch (e) {
      setMessages([
        {
          role: 'assistant',
          content:
            'Hi! I\'m your campus marketplace assistant. I can help you find information about products, categories, and answer questions about our marketplace. What would you like to know?'
        }
      ]);
    }
  }, [storageKey]);

  // Reload messages from sessionStorage when chatbot opens (in case of navigation)
  useEffect(() => {
    if (!isOpen || !storageKey) return;
    
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        const parsedMessages = JSON.parse(stored) as ChatMessage[];
        setMessages(parsedMessages);
      }
    } catch (e) {
      // ignore errors - keep current state
    }
  }, [isOpen, storageKey]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage.trim()
    };

    // Update state immediately with user message
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Send conversation history WITHOUT the current user message (API adds it)
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await apiService.chatWithBot(inputMessage.trim(), conversationHistory);
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.response
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again later.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5" />
          <span className="font-semibold">Marketplace Assistant</span>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.role === 'assistant' && (
                  <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />
                )}
                {message.role === 'user' && (
                  <User className="w-4 h-4 mt-0.5 flex-shrink-0" />
                )}
                <div 
                  className="text-sm whitespace-pre-wrap [&_a]:text-blue-600 [&_a]:underline [&_a]:hover:text-blue-800 [&_a]:transition-colors"
                  dangerouslySetInnerHTML={message.role === 'assistant' ? { __html: message.content } : undefined}
                >
                  {message.role === 'user' ? message.content : undefined}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 rounded-lg px-3 py-2 max-w-[80%]">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about products or categories..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Ask about products, categories, or general marketplace information
        </p>
      </div>
    </div>
  );
};

export default Chatbot;
