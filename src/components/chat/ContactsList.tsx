import LoadingSpinner from '../ui/LoadingSpinner';

interface ContactsListProps {
  conversations: any[];
  selectedContact: string;
  isLoadingMessages: boolean;
  onSelectContact: (contact: string) => void;
}

export default function ContactsList({
  conversations,
  selectedContact,
  isLoadingMessages,
  onSelectContact
}: ContactsListProps) {
  return (
    <div className="contacts-panel w-1/3 max-w-[400px] bg-white border-r border-whatsapp-border flex flex-col h-screen overflow-y-auto">
      <div className="contacts-header flex justify-center items-center p-4">
        <div className="w-[250px] mx-auto max-w-xs">
          <img src="/logo-pequeno.png" className="w-full max-w-32" alt="Pharma Chat Bot" onError={(e) => {
            // Se a imagem não carregar, mostrar texto alternativo
            const img = e.target as HTMLImageElement;
            img.style.display = 'none';
            const fallback = document.createElement('div');
            fallback.className = 'text-center text-sm font-bold text-gray-800 py-2';
            fallback.innerHTML = '🤖 PHARMA';
            img.parentNode?.appendChild(fallback);
          }} />
        </div>
      </div>
      
      <div className="contacts-list text-[#6c6d6d]">
        {isLoadingMessages ? (
          <LoadingSpinner message="Carregando conversas..." />
        ) : conversations.length > 0 ? (
          conversations.map((conversation, index) => (
            <div 
              key={index} 
              className={`contact-item ${selectedContact === conversation.contact ? 'active' : ''} cursor-pointer flex items-center p-4 hover:bg-pink-200 transition-colors`}
              onClick={() => onSelectContact(conversation.contact)}
            >
              <div className="w-[50px] h-[50px] rounded-full bg-gray-200 flex items-center justify-center mr-3 flex-shrink-0 overflow-hidden">
              {conversation.isGroup && (
                <img src="/avatar-group.png" alt="Avatar" className="w-full h-full object-cover" />
              )}
              {!conversation.isGroup && (
                <img src="/avatar-cinza.png" alt="Avatar" className="w-full h-full object-cover" />
              )}
              </div>
              <div className="contact-info flex-1 min-w-0">
                <div className="contact-name flex items-center gap-1 font-semibold truncate">
                  {conversation.contactName?.split("@")[0] || conversation.contact?.split("@")[0]}
                  
                </div>
                <div>


                  <div className="contact-meta flex flex-col items-end ml-2">
                    <div className="contact-time text-xs text-right text-gray-400">
                      {new Date(conversation.lastMessage?.timestamp * 1000).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    {conversation.unreadCount > 0 && (
                      <div className="unread-count bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center mt-1">
                        {conversation.unreadCount}
                      </div>
                    )}
                  </div>
                  <div className="contact-last-message text-xs text-right text-gray-400 truncate">
                    {conversation.lastMessage?.content || '[Mensagem]'}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-contacts">
            <p>📭 Nenhuma conversa encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
} 