import type { DLQMessage } from '../../types/dlq';
import MessageItem from './MessageItem';
import LoadingSpinner from '../ui/LoadingSpinner';

interface MessagesListProps {
  messages: DLQMessage[];
  isLoading: boolean;
  onRetryMessage: (messageId: string) => Promise<boolean>;
  formatDate: (dateString: string) => string;
}

export default function MessagesList({
  messages,
  isLoading,
  onRetryMessage,
  formatDate
}: MessagesListProps) {
  if (isLoading) {
    return <LoadingSpinner message="Carregando mensagens..." />;
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      {/* Header da seção */}
      <div className="flex justify-between items-center p-6 border-b border-gray-200">
        <span className="text-xl font-semibold text-gray-900">
          Mensagens na Dead Letter Queue
        </span>
        <span className="text-gray-600">
          {messages.length} mensagens
        </span>
      </div>

      {/* Lista de mensagens */}
      <div className="p-6">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhuma mensagem na DLQ
            </h3>
            <p className="text-gray-600">
              Todas as mensagens estão sendo processadas corretamente!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                onRetry={onRetryMessage}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 