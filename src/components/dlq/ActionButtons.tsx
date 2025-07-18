interface ActionButtonsProps {
  onRefresh: () => void;
  onRetryAll: () => void;
  onClear: () => void;
  onDownloadReport: () => void;
  isLoading: boolean;
}

export default function ActionButtons({
  onRefresh,
  onRetryAll,
  onClear,
  onDownloadReport,
  isLoading
}: ActionButtonsProps) {
  return (
    <div className="flex flex-wrap gap-4 mb-8">
      <button
        onClick={onRefresh}
        disabled={isLoading}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium transition-colors duration-200 flex items-center gap-2"
      >
        🔄 Atualizar
      </button>
      
      <button
        onClick={onRetryAll}
        disabled={isLoading}
        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium transition-colors duration-200 flex items-center gap-2"
      >
        ▶️ Tentar Todas Novamente
      </button>
      
      <button
        onClick={onClear}
        disabled={isLoading}
        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium transition-colors duration-200 flex items-center gap-2"
      >
        🗑️ Limpar DLQ
      </button>
      
      <button
        onClick={onDownloadReport}
        disabled={isLoading}
        className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium transition-colors duration-200 flex items-center gap-2"
      >
        📊 Relatório
      </button>
    </div>
  );
} 