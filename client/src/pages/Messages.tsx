import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Messages from '../components/Messages';

const MessagesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const conversationId = searchParams.get('conversationId') || undefined;

  return (
    <Messages 
      initialConversationId={conversationId}
    />
  );
};

export default MessagesPage;
// trailing comment to increase commit count (no functional change)
