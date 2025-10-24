import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Messages from '../components/Messages';

const MessagesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const conversationId = searchParams.get('conversationId') || undefined;

  const handleNavigate = (view: string) => {
    if (view === 'marketplace') {
      navigate('/search');
    } else if (view === 'messages') {
      navigate('/messages');
    }
  };

  return (
    <Messages 
      onNavigate={handleNavigate} 
      initialConversationId={conversationId}
    />
  );
};

export default MessagesPage;
