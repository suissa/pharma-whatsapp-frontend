import { useDLQ } from '../hooks/useDLQ';
import StatsGrid from '../components/dlq/StatsGrid';
import ActionButtons from '../components/dlq/ActionButtons';
import MessagesList from '../components/dlq/MessagesList';
import '../App.css'; // Garantir que os estilos customizados estejam disponíveis

export default function DLQ() {
  const {
    messages,
    stats,
    isLoading,
    error,
    refreshData,
    retryMessage,
    retryAllMessages,
    clearDLQ,
    downloadReport,
    formatDate,
    getTodayMessages,
    setError
  } = useDLQ();

  const handleRetryAll = async () => {
    if (!confirm('Deseja tentar reprocessar todas as mensagens da DLQ?')) {
      return;
    }

    const result = await retryAllMessages();
    if (result) {
      alert(`✅ Reprocessamento concluído! ${result.stats?.retried || 0} mensagens reenviadas.`);
    } else {
      alert('❌ Erro no reprocessamento em massa');
    }
  };

  const handleClear = async () => {
    if (!confirm('⚠️ ATENÇÃO: Isso irá remover TODAS as mensagens da DLQ permanentemente!\n\nDeseja continuar?')) {
      return;
    }

    const messagesCleared = await clearDLQ();
    if (messagesCleared !== null) {
      alert(`✅ DLQ limpa! ${messagesCleared} mensagens removidas.`);
    } else {
      alert('❌ Erro ao limpar DLQ');
    }
  };

  const handleDownloadReport = async () => {
    const success = await downloadReport();
    if (success) {
      alert('✅ Relatório baixado com sucesso!');
    } else {
      alert('❌ Erro ao gerar relatório');
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 pt-8">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center mb-4 pt-8">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="w-[400px] h-auto"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.style.display = 'none';
                const fallback = document.createElement('div');
                fallback.className = 'text-2xl font-bold text-gray-800';
                fallback.innerHTML = '🤖 PHARMA CHAT BOT';
                img.parentNode?.appendChild(fallback);
              }}
            />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[#e62657] mb-2">
              Dashboard Dead Letter Queue
            </h1>
            <p className="text-gray-600">
              Monitoramento e Gerenciamento de Mensagens Falhadas
            </p>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Exibir erro se houver */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex items-start">
              <div className="text-red-400 mt-0.5">❌</div>
              <div className="ml-3">
                <p className="text-red-800 font-medium">Erro</p>
                <p className="text-red-700 text-sm">{error}</p>
                <button
                  onClick={() => setError('')}
                  className="text-red-600 hover:text-red-800 text-sm underline mt-1"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Estatísticas */}
        <StatsGrid
          stats={stats}
          todayMessages={getTodayMessages()}
          isLoading={isLoading}
        />

        {/* Botões de ação */}
        <ActionButtons
          onRefresh={refreshData}
          onRetryAll={handleRetryAll}
          onClear={handleClear}
          onDownloadReport={handleDownloadReport}
          isLoading={isLoading}
        />

        {/* Lista de mensagens */}
        <MessagesList
          messages={messages}
          isLoading={isLoading}
          onRetryMessage={retryMessage}
          formatDate={formatDate}
        />
      </div>
    </div>
  );
} 