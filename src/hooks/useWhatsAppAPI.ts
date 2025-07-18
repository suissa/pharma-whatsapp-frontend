import { useState, useRef } from 'react';
import axios from 'axios';
import { API_URL, POLL_INTERVAL } from '../config';

interface ApiResponse {
  success: boolean;
  message?: string;
  instanceId?: string;
  qrCode?: string;
}

export const useWhatsAppAPI = () => {
  const [instanceId, setInstanceId] = useState<string>('');
  const [qrCode, setQrCode] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [existingInstances, setExistingInstances] = useState<any[]>([]);
  const [isLoadingInstances, setIsLoadingInstances] = useState<boolean>(true);
  const [connectedInstanceId, setConnectedInstanceId] = useState<string>('');
  const [autoOpenCountdown, setAutoOpenCountdown] = useState<number>(0);
  const [forceShowForm, setForceShowForm] = useState<boolean>(false);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionsPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Função para limpar o polling
  const clearPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  // Função para limpar o polling de sessões
  const clearSessionsPolling = () => {
    if (sessionsPollingRef.current) {
      clearInterval(sessionsPollingRef.current);
      sessionsPollingRef.current = null;
    }
  };

  // Função para verificar status da instância
  const checkInstanceStatus = async () => {
    try {
              const response = await axios.get(`/api/sessions/${instanceId}`);
      
      if (response.data.success) {
        if (response.data.status === 'connected') {
          setIsConnected(true);
          setIsConnecting(false);
          setStatus('WhatsApp conectado com sucesso!');
          setQrCode('');
          clearPolling();
          
          // Iniciar countdown de 10 segundos
          setAutoOpenCountdown(10);
          const countdownInterval = setInterval(() => {
            setAutoOpenCountdown(prev => {
              if (prev <= 1) {
                clearInterval(countdownInterval);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
      }
    } catch (err) {
      console.error('Erro ao verificar status:', err);
    }
  };

  // Função para fazer polling do QR Code
  const startPolling = () => {
    console.log('🔄 Iniciando polling para instância:', instanceId);
    clearPolling();
    
    pollingRef.current = setInterval(async () => {
      try {
        const response = await axios.get<ApiResponse>(`/api/sessions/${instanceId}/qrcode`);
        
        if (response.data.success && response.data.qrCode) {
          setQrCode(response.data.qrCode);
          setStatus('QR Code gerado! Escaneie com o WhatsApp');
          
          // Buscar versão em imagem do QR Code
          try {
            const imageResponse = await axios.get<{success: boolean; qrCodeImage: string}>(`/api/sessions/${instanceId}/qrcode/image`);
            if (imageResponse.data.success) {
              setQrCode(imageResponse.data.qrCodeImage);
            }
          } catch (imgErr) {
            console.log('Usando QR Code em texto');
          }
        }
      } catch (err: any) {
        // Se não há QR Code disponível, pode ser que já esteja conectado
        if (err.response?.status === 404) {
          // Verificar se a instância está conectada
          checkInstanceStatus();
        }
      }
    }, POLL_INTERVAL);
  };

  // Função para fazer polling contínuo de sessões conectadas
  const startSessionsPolling = () => {
    console.log('🔄 Iniciando polling de sessões conectadas...');
    clearSessionsPolling();
    
    sessionsPollingRef.current = setInterval(async () => {
      try {
        const response = await fetch('/api/sessions', {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📨 Polling de sessões:', data);
        
        if (data.success && data.sessions && data.sessions.length > 0) {
          // Procurar por sessão conectada
          const connectedSession = data.sessions.find((session: any) => 
            session.status === 'connected'
          );
          
          if (connectedSession && !isConnected) {
            console.log('✅ Sessão conectada encontrada via polling:', connectedSession.sessionId);
            setConnectedInstanceId(connectedSession.sessionId);
            setInstanceId(connectedSession.sessionId);
            setIsConnected(true);
            setIsConnecting(false);
            setStatus('WhatsApp conectado com sucesso!');
            setQrCode('');
            clearSessionsPolling(); // Parar polling quando encontrar
            
            // Iniciar countdown para abrir chat
            setAutoOpenCountdown(10);
            const countdownInterval = setInterval(() => {
              setAutoOpenCountdown(prev => {
                if (prev <= 1) {
                  clearInterval(countdownInterval);
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);
          }
        }
      } catch (err) {
        console.error('❌ Erro no polling de sessões:', err);
      }
    }, 5000); // Verificar a cada 5 segundos
  };

  // Função para criar instância
  const createInstance = async () => {
    if (!instanceId.trim()) {
      setError('Por favor, insira um ID para a instância');
      return;
    }

    setIsConnecting(true);
    setError('');
    setStatus('Criando instância...');

    try {
      const url = `/api/sessions/create`;
      console.log('🔗 URL da requisição:', url);
      console.log('📋 Dados enviados:', { instanceId: instanceId.trim() });
      
      const response = await axios.post<ApiResponse>(url, {
        instanceId: instanceId.trim()
      });

      if (response.data.success) {
        setStatus('Instância criada! Aguardando QR Code...');
        startPolling();
        // Também iniciar polling de sessões para detectar quando conectar
        startSessionsPolling();
      } else {
        setError(response.data.message || 'Erro ao criar instância');
        setIsConnecting(false);
      }
    } catch (err: any) {
      console.error('❌ Erro completo:', err);
      
      let errorMessage = 'Erro ao conectar com a API';
      
      if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK') {
        errorMessage = 'Servidor não está respondendo. Verifique se a API está rodando.';
      } else if (err.response?.status === 404) {
        errorMessage = 'Endpoint não encontrado. Verifique a URL da API.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
      setIsConnecting(false);
    }
  };

  // Função para desconectar
  const disconnect = async () => {
    try {
      await axios.delete(`/api/sessions/${instanceId}`);
      
      // Reset do estado
      setIsConnected(false);
      setIsConnecting(false);
      setQrCode('');
      setStatus('');
      setError('');
      clearPolling();
      clearSessionsPolling();
    } catch (err: any) {
      setError('Erro ao desconectar');
    }
  };

  // Função para buscar instâncias existentes com timeout de 30s
  const checkExistingInstances = async () => {
    try {
      setIsLoadingInstances(true);
      console.log('🔍 Verificando sessões existentes...');
      console.log('🌉 Usando proxy do Vite: /api/sessions → localhost:3000/api/sessions');
      
      const controller = new AbortController();
      // const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('/api/sessions', {
        signal: controller.signal,
          headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      // clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
             const data = await response.json();
       console.log('📨 Resposta do backend:', data);
       
       if (data.success && data.sessions) {
         setExistingInstances(data.sessions);
         console.log('📋 Sessões encontradas:', data.sessions);
          
         // Procurar por sessão conectada primeiro
         const connectedSession = data.sessions.find((session: any) => 
           session.status === 'connected'
         );
          
         // Se não encontrar conectada, procurar por sessão em conexão
         const connectingSession = data.sessions.find((session: any) => 
           session.status === 'connecting'
         );
          
         if (connectedSession) {
           console.log('✅ Sessão conectada encontrada:', connectedSession.sessionId);
           setConnectedInstanceId(connectedSession.sessionId);
           setInstanceId(connectedSession.sessionId);
           setIsConnected(true);
           return connectedSession.sessionId;
         } else if (connectingSession) {
           console.log('🔄 Sessão em conexão encontrada:', connectingSession.sessionId);
           setConnectedInstanceId(connectingSession.sessionId);
           setInstanceId(connectingSession.sessionId);
           setIsConnecting(true);
           // Iniciar polling para verificar se ela se conecta
           setTimeout(() => {
             setStatus('Sessão em conexão encontrada! Aguardando QR Code...');
             startPolling();
             startSessionsPolling(); // Também monitorar sessões
           }, 1000);
           return connectingSession.sessionId;
         } else {
           console.log('📋 Nenhuma sessão ativa encontrada');
           // Iniciar polling de sessões para detectar quando uma conectar
           startSessionsPolling();
           return null;
         }
       } else {
         console.log('⚠️ Resposta inválida do backend:', data);
         // Iniciar polling de sessões mesmo com resposta inválida
         startSessionsPolling();
         return null;
       }
    } catch (err: any) {
      console.error('❌ Erro ao verificar instâncias:', err);
      console.error('❌ Detalhes do erro:', {
        code: err.code,
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        responseData: err.response?.data
      });
      
             // Se foi abortado ou erro de rede
       if (err.name === 'AbortError') {
         console.log('⏰ Timeout: Mostrando formulário de conexão após timeout');
         setError('Timeout na busca de sessões. Mostrando formulário de conexão.');
         setForceShowForm(true); // Forçar exibição do formulário
         // Iniciar polling de sessões mesmo após timeout
         startSessionsPolling();
       } else {
         // Definir mensagem de erro mais específica
         let errorMessage = 'Erro ao conectar com a API';
         
         if (err.message?.includes('Failed to fetch')) {
           errorMessage = 'Servidor não está respondendo. Verifique se a API está rodando.';
         } else if (err.message?.includes('404')) {
           errorMessage = 'Endpoint não encontrado. Verifique a configuração da API.';
         } else if (err.message) {
           errorMessage = err.message;
         }
         
         setError(errorMessage);
         // Iniciar polling de sessões mesmo com erro
         startSessionsPolling();
       }
      
      return null;
    } finally {
      setIsLoadingInstances(false);
    }
  };

  return {
    // Estados
    instanceId,
    qrCode,
    isConnecting,
    isConnected,
    status,
    error,
    existingInstances,
    isLoadingInstances,
    connectedInstanceId,
    autoOpenCountdown,
    forceShowForm,
    
    // Setters
    setInstanceId,
    setAutoOpenCountdown,
    setConnectedInstanceId,
    setIsConnected,
    setForceShowForm,
    
    // Funções
    createInstance,
    disconnect,
    checkExistingInstances,
    clearPolling,
    clearSessionsPolling
  };
}; 