import ContactsList from './ContactsList';
import ChatPanel from './ChatPanel';

interface ChatLayoutProps {
  conversations: any[];
  selectedContact: string;
  isLoadingMessages: boolean;
  message: string;
  setMessage: (message: string) => void;
  isSending: boolean;
  messageStatus: string;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onSelectContact: (contact: string) => void;
  onSendMessage: () => void;
  getCombinedMessages: (contact: string) => any[];
}

export default function ChatLayout({
  conversations,
  selectedContact,
  isLoadingMessages,
  message,
  setMessage,
  isSending,
  messageStatus,
  messagesEndRef,
  onSelectContact,
  onSendMessage,
  getCombinedMessages
}: ChatLayoutProps) {
  return (
    <div className="whatsapp-layout flex h-screen w-screen bg-whatsapp-bg">
      <ContactsList
        conversations={conversations}
        selectedContact={selectedContact}
        isLoadingMessages={isLoadingMessages}
        onSelectContact={onSelectContact}
      />
      
      <ChatPanel
        selectedContact={selectedContact}
        conversations={conversations}
        getCombinedMessages={getCombinedMessages}
        message={message}
        setMessage={setMessage}
        isSending={isSending}
        messageStatus={messageStatus}
        onSendMessage={onSendMessage}
        messagesEndRef={messagesEndRef}
      />
    </div>
  );
} 