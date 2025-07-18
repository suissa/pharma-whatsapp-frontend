import MessageBubble from '../ui/MessageBubble';
import { useState, useRef, useEffect } from 'react';

interface ChatPanelProps {
  selectedContact: string;
  conversations: any[];
  getCombinedMessages: (contact: string) => any[];
  message: string;
  setMessage: (message: string) => void;
  isSending: boolean;
  messageStatus: string;
  onSendMessage: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export default function ChatPanel({
  selectedContact,
  conversations,
  getCombinedMessages,
  message,
  setMessage,
  isSending,
  messageStatus,
  onSendMessage,
  messagesEndRef
}: ChatPanelProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [modalRect, setModalRect] = useState<DOMRect | null>(null);
  const [animate, setAnimate] = useState(false);

  const handleImageClick = (src: string, rect: DOMRect) => {
    setModalImage(src);
    setModalRect(rect);
    setModalOpen(true);
    setTimeout(() => setAnimate(true), 10); // Garante que o CSS transition será aplicado
  };

  const closeModal = () => {
    setAnimate(false);
    setTimeout(() => {
      setModalOpen(false);
      setModalImage(null);
      setModalRect(null);
    }, 400); // Tempo igual ao transition
  };

  // Efeito para adicionar/remover event listener do ESC
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && modalOpen) {
        closeModal();
      }
    };

    if (modalOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [modalOpen]);

  if (!selectedContact) {
    return (
      <div className="chat-panel w-2/3 bg-whatsapp-bg flex flex-col">
        <div className="no-chat-selected">
          <h3>Selecione uma conversa</h3>
          <p>Escolha uma conversa na lista à esquerda para começar a ver as mensagens</p>
        </div>
      </div>
    );
  }

  const currentConversation = conversations.find(c => c.contact === selectedContact);
  const isGroup = currentConversation?.isGroup;
  const messages = getCombinedMessages(selectedContact);
  console.log("messages", messages);
  return (
    <div className="chat-panel w-2/3 bg-whatsapp-bg flex flex-col">
      {/* Header do Chat */}
      <div className="chat-header bg-white border-b border-whatsapp-border p-4 flex items-center">
        <div className="chat-contact-info">
          <div className="chat-avatar">
            {isGroup ? '👥' : (currentConversation?.contactName?.charAt(0) || '👤')}
          </div>
          <div className="chat-contact-details">
            <div className="chat-contact-name flex items-center gap-2">
              {currentConversation?.contactName || selectedContact}
              {isGroup && (
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">Grupo</span>
              )}
            </div>
            <div className="chat-contact-status">
              {currentConversation?.totalMessages || 0} mensagens
            </div>
          </div>
        </div>
      </div>
      
      {/* Área de Mensagens */}
      <div className="messages-area flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg: any, index: number) => (
          <MessageBubble
            key={msg.id || index}
            message={msg}
            isGroup={isGroup || false}
            onImageClick={(src, rect) => handleImageClick(src, rect)}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input de Mensagem */}
      <div className="message-input-area bg-gray-50 border-t border-whatsapp-border p-4">
        <div className="reply-info">
          <span className="reply-to">
            💬 Respondendo para: <strong>
              {String(currentConversation?.contactName || selectedContact).split('@')[0] || String(selectedContact).split('@')[0] || ''}
            </strong>
          </span>
        </div>
        <div className="message-input-container">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Digite sua mensagem para ${currentConversation?.contactName || 'este contato'}...`}
            rows={2}
            disabled={isSending}
            className="message-input"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!isSending && message.trim()) {
                  onSendMessage();
                }
              }
            }}
          />
          <button 
            onClick={onSendMessage}
            className="send-button"
            disabled={isSending || !message.trim()}
            title={isSending ? 'Enviando...' : 'Enviar mensagem (Enter)'}
          >
            {isSending ? '⏳' : '➤'}
          </button>
        </div>
        {messageStatus && (
          <div className={`status-small status-success`}>
            {messageStatus}
          </div>
        )}
      </div>
      {/* Modal de Imagem com efeito de zoom */}
      {modalOpen && modalRect && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal-zoom-img"
            style={{
              position: 'fixed',
              left: animate ? '50%' : modalRect.left,
              top: animate ? '50%' : modalRect.top,
              width: animate ? '90vw' : modalRect.width,
              height: animate ? '80vh' : modalRect.height,
              transform: animate ? 'translate(-50%, -50%) scale(0.9)' : 'none',
              transition: 'all 1.1s cubic-bezier(.4,2,.6,1)',
              zIndex: 10000,
              background: 'rgba(0,0,0,0.3)',
              borderRadius: animate ? 12 : 8,
              boxShadow: animate ? '0 4px 32px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.06)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={e => e.stopPropagation()}
          >
            <img src={modalImage!} alt="imagem ampliada" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8 }} />
            <button onClick={closeModal} style={{position: 'absolute', top: 16, right: 16, background: 'rgba(229,38,86,1)', border: 'none', borderRadius: '50%', width: 40, height: 40, fontSize: 34, cursor: 'pointer', color: 'white'}}>×</button>
          </div>
        </div>
      )}
    </div>
  );
} 