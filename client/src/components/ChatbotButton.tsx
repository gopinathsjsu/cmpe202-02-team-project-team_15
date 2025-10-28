import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import Chatbot from './Chatbot';

const ChatbotButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 right-4 w-14 h-14 rounded-full shadow-lg transition-all duration-300 z-40 ${
          isOpen
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
        aria-label={isOpen ? 'Close chatbot' : 'Open chatbot'}
      >
        {isOpen ? (
          <X className="w-6 h-6 mx-auto" />
        ) : (
          <MessageCircle className="w-6 h-6 mx-auto" />
        )}
      </button>

      {/* Chatbot Component */}
      <Chatbot isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default ChatbotButton;
