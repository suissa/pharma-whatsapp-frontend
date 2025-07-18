import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import type { DLQMessage, DLQStats, DLQApiResponse, RetryResponse } from '../types/dlq';

export const useDLQ = () => {
  const [messages, setMessages] = useState<DLQMessage[]>([]);
  const [stats, setStats] = useState<DLQStats>({
    totalMessages: 0,
    messagesByInstance: {},
    messagesByError: {}
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Função para carregar estatísticas
  const loadStats = useCallback(async () => {
    try {
      const [basicResponse, detailedResponse] = await Promise.all([
        axios.get<DLQApiResponse>(`${API_URL}/api/dlq`),
        axios.get<DLQApiResponse>(`${API_URL}/api/dlq/stats`)
      ]);

      if (basicResponse.data.success && basicResponse.data.stats) {
        const combinedStats = {
          ...basicResponse.data.stats,
          ...detailedResponse.data.stats
        };
        setStats(combinedStats);
      }
    } catch (err: any) {
      console.error('Erro ao carregar estatísticas da DLQ:', err);
      setError('Erro ao carregar estatísticas');
    }
  }, []);

  // Função para carregar mensagens
  const loadMessages = useCallback(async (limit = 100) => {
    try {
      const response = await axios.get<DLQApiResponse>(`${API_URL}/api/dlq/messages?limit=${limit}`);
      
      if (response.data.success && response.data.messages) {
        setMessages(response.data.messages);
      } else {
        setMessages([]);
      }
    } catch (err: any) {
      console.error('Erro ao carregar mensagens da DLQ:', err);
      setError('Erro ao carregar mensagens');
      setMessages([]);
    }
  }, []);

  // Função para recarregar todos os dados
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    
    try {
      await Promise.all([
        loadStats(),
        loadMessages()
      ]);
    } catch (err) {
      console.error('Erro ao recarregar dados da DLQ:', err);
    } finally {
      setIsLoading(false);
    }
  }, [loadStats, loadMessages]);

  // Função para tentar novamente uma mensagem específica
  const retryMessage = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      const response = await axios.post<DLQApiResponse>(`${API_URL}/api/dlq/retry/${messageId}`);
      
      if (response.data.success) {
        // Recarregar dados após sucesso
        setTimeout(refreshData, 1000);
        return true;
      } else {
        setError(response.data.message || 'Erro ao reenviar mensagem');
        return false;
      }
    } catch (err: any) {
      console.error('Erro ao tentar novamente:', err);
      setError('Erro ao reenviar mensagem');
      return false;
    }
  }, [refreshData]);

  // Função para tentar novamente todas as mensagens
  const retryAllMessages = useCallback(async (): Promise<RetryResponse | null> => {
    try {
      const response = await axios.post<RetryResponse>(`${API_URL}/api/dlq/retry-all`);
      
      if (response.data.success) {
        // Recarregar dados após sucesso
        setTimeout(refreshData, 2000);
        return response.data;
      } else {
        setError(response.data.message || 'Erro no reprocessamento em massa');
        return null;
      }
    } catch (err: any) {
      console.error('Erro no reprocessamento:', err);
      setError('Erro no reprocessamento em massa');
      return null;
    }
  }, [refreshData]);

  // Função para limpar a DLQ
  const clearDLQ = useCallback(async (): Promise<number | null> => {
    try {
      const response = await axios.delete<DLQApiResponse>(`${API_URL}/api/dlq/clear`);
      
      if (response.data.success) {
        // Recarregar dados após sucesso
        setTimeout(refreshData, 1000);
        return response.data.messagesCleared || 0;
      } else {
        setError(response.data.message || 'Erro ao limpar DLQ');
        return null;
      }
    } catch (err: any) {
      console.error('Erro ao limpar DLQ:', err);
      setError('Erro ao limpar DLQ');
      return null;
    }
  }, [refreshData]);

  // Função para baixar relatório
  const downloadReport = useCallback(async (): Promise<boolean> => {
    try {
      const [statsResponse, messagesResponse] = await Promise.all([
        axios.get<DLQApiResponse>(`${API_URL}/api/dlq/stats`),
        axios.get<DLQApiResponse>(`${API_URL}/api/dlq/messages?limit=1000`)
      ]);

      const report = {
        timestamp: new Date().toISOString(),
        statistics: statsResponse.data.stats,
        messages: messagesResponse.data.messages
      };

      const blob = new Blob([JSON.stringify(report, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dlq-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return true;
    } catch (err: any) {
      console.error('Erro ao gerar relatório:', err);
      setError('Erro ao gerar relatório');
      return false;
    }
  }, []);

  // Carregar dados iniciais
  useEffect(() => {
    refreshData();
    
    // Auto-refresh a cada 30 segundos
    const interval = setInterval(refreshData, 30000);
    
    return () => clearInterval(interval);
  }, [refreshData]);

  // Função utilitária para formatar data
  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
  }, []);

  // Calcular mensagens de hoje
  const getTodayMessages = useCallback((): number => {
    const today = new Date().toISOString().split('T')[0];
    return (stats.timeline && stats.timeline[today]) || 0;
  }, [stats.timeline]);

  return {
    // Estados
    messages,
    stats,
    isLoading,
    error,
    
    // Funções
    refreshData,
    retryMessage,
    retryAllMessages,
    clearDLQ,
    downloadReport,
    formatDate,
    getTodayMessages,
    
    // Setters
    setError
  };
}; 