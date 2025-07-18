import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  useWhatsAppAPI, 
  useMessages, 
  ConnectionForm, 
  ChatLayout, 
  LoadingSpinner 
} from '../components';
import '../App.css'; // Garantir que os estilos customizados estejam disponíveis

export default function WhatsAppPage() {
  const [showChat, setShowChat] = useState<boolean>(false);
  const { instanceId: urlInstanceId } = useParams();
  const navigate = useNavigate();

  // Hook personalizado para gerenciar API do WhatsApp
  const {
    instanceId,
    setInstanceId,
    qrCode,
    isConnecting,
    isConnected,
    status,
    error,
    isLoadingInstances,
    connectedInstanceId,
    autoOpenCountdown,
    forceShowForm,
    setAutoOpenCountdown,
    setConnectedInstanceId,
    setForceShowForm,
    createInstance,
    disconnect,
    checkExistingInstances,
    clearPolling,
    clearSessionsPolling
  } = useWhatsAppAPI();

  // Hook personalizado para gerenciar mensagens
  const {
    conversations,
    selectedContact,
    isLoadingMessages,
    wsConnected,
    message,
    setMessage,
    isSending,
    messageStatus,
    messagesEndRef,
    loadMessages,
    selectContact,
    sendMessage,
    getCombinedMessages,
    clearAutoRefresh
  } = useMessages(connectedInstanceId, showChat);

  // Função para abrir o chat após conexão
  const handleOpenChat = async () => {
    setConnectedInstanceId(instanceId);
    setShowChat(true);
    setForceShowForm(false); // Limpar flag de timeout
    await loadMessages(instanceId);
  };

  // Verificar se há instanceId na URL e redirecionar automaticamente
  useEffect(() => {
    if (urlInstanceId && !showChat) {
      console.log('🔗 InstanceId encontrado na URL:', urlInstanceId);
      setInstanceId(urlInstanceId);
      setConnectedInstanceId(urlInstanceId);
      setShowChat(true);
      setForceShowForm(false);
      loadMessages(urlInstanceId);
    }
  }, [urlInstanceId, showChat]);

  // Verificar instâncias existentes na inicialização
  useEffect(() => {
    const initializeApp = async () => {
      console.log('🚀 Iniciando aplicação - verificando instâncias...');
      try {
        const foundInstanceId = await checkExistingInstances();
        console.log('🔍 Resultado da busca:', foundInstanceId);
        if (foundInstanceId) {
          console.log('✅ Instância encontrada, abrindo chat:', foundInstanceId);
          setShowChat(true);
          setForceShowForm(false); // Limpar flag de timeout se encontrou instância
          await loadMessages(foundInstanceId);
          
          // Se não há instanceId na URL, navegar para a rota da instância
          if (!urlInstanceId) {
            navigate(`/${foundInstanceId}`);
          }
        } else {
          console.log('⚠️ Nenhuma instância ativa encontrada');
        }
      } catch (err) {
        console.error('❌ Erro na inicialização:', err);
      }
    };

    console.log('📱 Componente WhatsAppPage montado - iniciando...');
    initializeApp();
    
    return () => {
      clearPolling();
      clearSessionsPolling();
      clearAutoRefresh();
    };
  }, []);

  // Auto-abrir chat após countdown
  useEffect(() => {
    if (isConnected && autoOpenCountdown === 0 && !showChat) {
      setTimeout(async () => {
        console.log('🚀 Abrindo chat automaticamente após conexão...');
        setConnectedInstanceId(instanceId);
        setShowChat(true);
        setForceShowForm(false); // Limpar flag de timeout
        await loadMessages(instanceId);
        
        // Navegar para a rota da instância
        navigate(`/${instanceId}`);
      }, 100);
    }
  }, [isConnected, autoOpenCountdown, showChat, instanceId]);

  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* Loading inicial - só mostra se não forçou o formulário */}
      {isLoadingInstances && !forceShowForm && (
        <div>
          <LoadingSpinner message="Verificando instâncias conectadas..." />
          <div className="text-center mt-4">
            <p className="text-gray-600 text-sm">
              Aguardando resposta... (máximo 30 segundos)
            </p>
          </div>
        </div>
      )}
      
      {/* Tela de Conexão - mostra se não está carregando OU se forçou após timeout */}
      {(!isLoadingInstances || forceShowForm) && !showChat && (
        <ConnectionForm
          instanceId={instanceId}
          setInstanceId={setInstanceId}
          qrCode={qrCode}
          isConnecting={isConnecting}
          isConnected={isConnected}
          status={status}
          error={error}
          autoOpenCountdown={autoOpenCountdown}
          createInstance={createInstance}
          disconnect={disconnect}
          onOpenChat={handleOpenChat}
          setAutoOpenCountdown={setAutoOpenCountdown}
        />
      )}
      
      {/* Interface do Chat */}
      {!isLoadingInstances && showChat && connectedInstanceId && (
        <ChatLayout
          conversations={conversations}
          selectedContact={selectedContact}
          isLoadingMessages={isLoadingMessages}
          message={message}
          setMessage={setMessage}
          isSending={isSending}
          messageStatus={messageStatus}
          messagesEndRef={messagesEndRef}
          onSelectContact={selectContact}
          onSendMessage={sendMessage}
          getCombinedMessages={getCombinedMessages}
        />
      )}
    </div>
  );
} 