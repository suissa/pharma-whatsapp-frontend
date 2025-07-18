import AudioPlayer from './AudioPlayer';
import { useRef } from 'react';

interface MessageBubbleProps {
  message: any;
  isGroup: boolean;
  onImageClick?: (src: string, rect: DOMRect) => void;
}

export default function MessageBubble({ message, isGroup, onImageClick }: MessageBubbleProps) {
  // Determinar o nome do remetente
  let senderName = message.pushName || message.senderName || message.originalMessage?.pushName;
  
  // Se for mensagem de IA, usar nome especial
  if (message.isAIResponse) {
    senderName = '🤖 IA Assistente';
  }
  
  // Determinar se é mensagem enviada por mim
  const isFromMe = message.fromMe || message.originalMessage?.key?.fromMe;
  
  // Função para processar formatação de texto do WhatsApp
  const formatWhatsAppText = (text: string) => {
    if (!text) return '';
    
    // Regex para diferentes tipos de formatação
    const patterns = [
      // **negrito** -> <strong>negrito</strong>
      { regex: /\*\*(.*?)\*\*/g, tag: 'strong', className: 'font-bold' },
      // *itálico* -> <em>itálico</em>
      { regex: /\*(.*?)\*/g, tag: 'em', className: 'italic' },
      // ~~tachado~~ -> <del>tachado</del>
      { regex: /~~(.*?)~~/g, tag: 'del', className: 'line-through' },
      // `monospace` -> <code>monospace</code>
      { regex: /`(.*?)`/g, tag: 'code', className: 'font-mono bg-gray-100 px-1 rounded' },
      // ```bloco de código``` -> <pre><code>bloco de código</code></pre>
      { regex: /```([\s\S]*?)```/g, tag: 'pre', className: 'bg-gray-100 p-2 rounded font-mono text-sm whitespace-pre-wrap' }
    ];
    
    let formattedText = text;
    
    // Aplicar cada padrão de formatação
    patterns.forEach(({ regex, tag, className }) => {
      formattedText = formattedText.replace(regex, (match, content) => {
        if (tag === 'pre') {
          return `<pre class="${className}"><code>${content}</code></pre>`;
        }
        return `<${tag} class="${className}">${content}</${tag}>`;
      });
    });
    
    // Converter quebras de linha para <br>
    formattedText = formattedText.replace(/\n/g, '<br>');
    
    return formattedText;
  };
  
  // Obter conteúdo da mensagem
  const getMessageContent = () => {
    // Nova estrutura (WebSocket)
    if (message.content) {
      return message.content;
    }
    
    // Estrutura antiga (HTTP)
    if (message.messageContent?.conversation) {
      return message.messageContent.conversation;
    }
    
    if (message.messageContent?.extendedTextMessage?.text) {
      return message.messageContent.extendedTextMessage.text;
    }
    
    if (message.messageContent?.imageMessage?.caption) {
      return message.messageContent.imageMessage.caption;
    }
    
    // if (message.messageContent?.imageMessage?.caption) {
    //   return message.messageContent.imageMessage.caption;
    // }
    // Tipos de mensagem especiais
    if (message.messageType) {
      switch (message.messageType) {
        case 'image':
          return '📷 Imagem';
        case 'audio':
          return '🎵 Áudio';
        case 'video':
          return '🎥 Vídeo';
        case 'document':
          return '📄 Documento';
        default:
          return `[${message.messageType}]`;
      }
    }
    
    return '[Mensagem de sistema]';
  };

  // Renderizar conteúdo da mensagem baseado no tipo
  const renderMessageContent = () => {
    // Se for imagem, renderizar a imagem
    if (message.messageType === 'image' && message.mediaInfo?.publicUrl) {
      return (
        <div className="image-message">
          <img 
            ref={imgRef}
            src={message.mediaInfo.publicUrl} 
            alt="Imagem da mensagem"
            className="max-w-full rounded-lg shadow-sm"
            style={{ maxHeight: '300px', objectFit: 'contain', cursor: onImageClick ? 'pointer' : undefined }}
            onClick={onImageClick ? (e) => {
              if (imgRef.current) {
                const rect = imgRef.current.getBoundingClientRect();
                onImageClick(message.mediaInfo.publicUrl, rect);
              }
            } : undefined}
            onError={(e) => {
              console.error('Erro ao carregar imagem:', e);
              const img = e.target as HTMLImageElement;
              img.style.display = 'none';
              // Mostrar fallback se a imagem falhar
              const fallback = document.createElement('div');
              fallback.className = 'text-gray-500 text-sm p-4 text-center';
              fallback.innerHTML = '📷 Imagem não disponível';
              img.parentNode?.appendChild(fallback);
            }}
          />
          {/* Mostrar caption se existir */}
          {message.mediaInfo?.caption && (
            <div className="image-caption mt-2 text-sm text-gray-700">
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: formatWhatsAppText(message.mediaInfo.caption) 
                }} 
              />
            </div>
          )}
        </div>
      );
    }

    // Se for áudio, renderizar o AudioPlayer
    if (message.messageType === 'audio' && message.mediaInfo?.publicUrl) {
      return (
        <div className="audio-message">
          <AudioPlayer src={message.mediaInfo.publicUrl} />
          {/* Mostrar caption se existir */}
          {message.mediaInfo?.caption && (
            <div className="audio-caption mt-2 text-sm text-gray-700">
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: formatWhatsAppText(message.mediaInfo.caption) 
                }} 
              />
            </div>
          )}
          <a className="text-sm text-blue-500" href="#" onClick={async (e) => {
            e.preventDefault();
            console.log('Transcrever');
            // const transcription = await transcribeAudio(message.mediaInfo.publicUrl);
            const response = await fetch('http://localhost:3000/api/media/transcribe', {
              method: 'POST',
              body: JSON.stringify({ audioUrl: message.mediaInfo.publicUrl }),
            });
            const data = await response.json();
            console.log(data);
            // console.log(transcription);
          }}>Transcrever</a>
        </div>
      );
    }

    // Para outros tipos, mostrar o conteúdo normal com formatação
    const content = getMessageContent();
    return (
      <div className="text-content">
        <div 
          dangerouslySetInnerHTML={{ 
            __html: formatWhatsAppText(content) 
          }} 
        />
      </div>
    );
  };
  
  // Obter timestamp da mensagem
  const getTimestamp = () => {
    if (message.timestamp) {
      return new Date(message.timestamp).getTime();
    }
    
    if (message.messageTimestamp) {
      return message.messageTimestamp * 1000;
    }
    
    return Date.now();
  };

  // Determinar classes CSS da mensagem
  const getMessageClasses = () => {
    let classes = 'message-bubble';
    
    if (message.isAIResponse) {
      classes += ' ai-message';
    } else if (isFromMe) {
      classes += ' sent';
    } else {
      classes += ' received';
    }
    
    if (message.isLocal) {
      classes += ' opacity-80';
    }
    
    return classes;
  };

  const imgRef = useRef<HTMLImageElement>(null);

  return (
    <div className={getMessageClasses()}>
      {/* Nome do remetente para IA ou grupos */}
      {(message.isAIResponse || (isGroup && !isFromMe)) && senderName && (
        <div className="sender-name">
          {senderName}
        </div>
      )}
      <div className="message-content">
        {renderMessageContent()}
      </div>
      <div className="message-time flex items-center gap-1">
        {new Date(getTimestamp()).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        })}
        {message.isLocal && <span className="text-xs">⏳</span>}
        {message.isAIResponse && <span className="text-xs">🤖</span>}
      </div>
    </div>
  );
} 