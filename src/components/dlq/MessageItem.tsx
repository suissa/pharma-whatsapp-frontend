import type { DLQMessage } from '../../types/dlq';

interface MessageItemProps {
  message: DLQMessage;
  onRetry: (messageId: string) => Promise<boolean>;
  formatDate: (dateString: string) => string;
}

export default function MessageItem({ message, onRetry, formatDate }: MessageItemProps) {
  const handleRetry = async () => {
    const success = await onRetry(message.id);
    if (success) {
      alert('✅ Mensagem reenviada com sucesso!');
    } else {
      alert('❌ Erro ao reenviar mensagem');
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Header da mensagem */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="font-medium text-gray-900">ID: {message.id}</span>
        </div>
        <button
          onClick={handleRetry}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center gap-2"
        >
          🔄 Tentar Novamente
        </button>
      </div>

      {/* Informações da mensagem */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-600 mb-1">Instância:</span>
          <span className="text-gray-900">{message.instanceId || 'N/A'}</span>
        </div>
        
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-600 mb-1">Routing Key:</span>
          <span className="text-gray-900 break-all">{message.originalRoutingKey}</span>
        </div>
        
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-600 mb-1">Tentativas:</span>
          <span className="inline-flex items-center">
            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm font-medium">
              {message.retryCount}/{message.maxRetries}
            </span>
          </span>
        </div>
        
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-600 mb-1">Último Erro:</span>
          <span className="text-gray-900">{formatDate(message.lastErrorTimestamp)}</span>
        </div>
      </div>

      {/* Mensagem de erro */}
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <span className="text-sm font-medium text-red-800 block mb-1">Erro:</span>
        <pre className="text-sm text-red-700 whitespace-pre-wrap font-mono">
          {message.error}
        </pre>
      </div>
    </div>
  );
} 