import type { DLQStats } from '../../types/dlq';

interface StatsGridProps {
  stats: DLQStats;
  todayMessages: number;
  isLoading: boolean;
}

export default function StatsGrid({ stats, todayMessages, isLoading }: StatsGridProps) {
  const formatNumber = (num: number) => num.toLocaleString('pt-BR');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
        <div className="text-3xl font-bold text-gray-800 mb-2">
          {isLoading ? '-' : formatNumber(stats.totalMessages)}
        </div>
        <div className="text-gray-600">Total de Mensagens</div>
      </div>
      
      <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
        <div className="text-3xl font-bold text-gray-800 mb-2">
          {isLoading ? '-' : Object.keys(stats.messagesByInstance).length}
        </div>
        <div className="text-gray-600">Instâncias Ativas</div>
      </div>
      
      <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
        <div className="text-3xl font-bold text-gray-800 mb-2">
          {isLoading ? '-' : Object.keys(stats.messagesByError).length}
        </div>
        <div className="text-gray-600">Tipos de Erro</div>
      </div>
      
      <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
        <div className="text-3xl font-bold text-gray-800 mb-2">
          {isLoading ? '-' : formatNumber(todayMessages)}
        </div>
        <div className="text-gray-600">Hoje</div>
      </div>
    </div>
  );
} 