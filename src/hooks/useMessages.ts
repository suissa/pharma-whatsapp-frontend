import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

const WS_URL = 'ws://localhost:8899';

export const useMessages = (connectedInstanceId: string, showChat: boolean) => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<string>('');
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const [isAutoRefreshActive, setIsAutoRefreshActive] = useState<boolean>(false);
  
  // Estados para envio de mensagem
  const [phone, setPhone] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [messageStatus, setMessageStatus] = useState<string>('');

  // Estados para WebSocket
  const [wsConnected, setWsConnected] = useState<boolean>(false);

  // Controles para evitar duplicação
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const processedMessageIds = useRef<Set<string>>(new Set());
  const lastLoadTime = useRef<number>(0);

  // Controles de reconexão e heartbeat
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectAttempts = useRef<number>(0);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000; // 1 segundo

  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Função para limpar auto-refresh
  const clearAutoRefresh = () => {
    if (autoRefreshRef.current) {
      clearInterval(autoRefreshRef.current);
      autoRefreshRef.current = null;
    }
    setIsAutoRefreshActive(false);
  };

  // Função para conectar WebSocket com validação robusta
  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('🔌 WebSocket já está conectado');
      return; // Já conectado
    }

    // Limpar tentativas de reconexão anteriores
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    console.log(`🔌 Tentativa ${reconnectAttempts.current + 1}/${maxReconnectAttempts} - Conectando WebSocket:`, WS_URL);
    
    try {
      wsRef.current = new WebSocket(WS_URL);

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket conectado com sucesso');
        setWsConnected(true);
        reconnectAttempts.current = 0; // Reset contador de tentativas
        
        // Iniciar heartbeat
        startHeartbeat();
      };

      wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 Mensagem recebida do WebSocket:', data);
        
        // Verificar se é resposta do comando de listar mensagens
        if (data.type === 'messages:list' && data.success && data.messages) {
          console.log('📋 Processando', data.messages.length, 'mensagens recebidas (list)');
          
          // Agrupar mensagens por usuário para criar conversas
          const conversationsMap = new Map();
          
          data.messages.forEach((message: any) => {
            // Verificar se a mensagem já foi processada
            if (processedMessageIds.current.has(message.messageId)) {
              console.log('🔄 Mensagem já processada, pulando:', message.messageId);
              return;
            }
            
            const contact = message.fromUser;
            
            if (!conversationsMap.has(contact)) {
              conversationsMap.set(contact, {
                contact: contact,
                messages: [],
                lastMessage: null,
                lastMessageTime: 0,
                unreadCount: 0
              });
            }
            
            const conversation = conversationsMap.get(contact);
            conversation.messages.push(message);
            
            // Marcar mensagem como processada
            processedMessageIds.current.add(message.messageId);
            
            // Atualizar última mensagem se esta é mais recente
            const messageTime = new Date(message.timestamp).getTime();
            if (messageTime > conversation.lastMessageTime) {
              conversation.lastMessage = {
                text: message.content || `[${message.messageType}]`,
                timestamp: messageTime,
                messageType: message.messageType
              };
              conversation.lastMessageTime = messageTime;
            }
          });
          
          // Converter Map para array e ordenar por última mensagem
          const processedConversations = Array.from(conversationsMap.values())
            .sort((a: any, b: any) => b.lastMessageTime - a.lastMessageTime);
          
          setConversations(prevConversations => {
            // Mesclar com conversas existentes, evitando duplicatas
            const existingContacts = new Set(prevConversations.map(c => c.contact));
            const newConversations = processedConversations.filter(c => !existingContacts.has(c.contact));
            const merged = [...prevConversations, ...newConversations];
            // Ordenar por lastMessageTime (mais recente no topo)
            return merged.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
          });
          
          console.log('✅ Conversas processadas:', processedConversations.length);
          console.log('📊 Contatos encontrados:', processedConversations.map(c => c.contact));
          
          // Selecionar primeira conversa se não há nenhuma selecionada
          if (processedConversations.length > 0 && !selectedContact) {
            selectContact(processedConversations[0].contact);
          }
        }
        
        // Verificar se é nova mensagem via update
        else if (data.type === 'messages:update') {
          console.log('📨 Nova mensagem recebida via update:', data.message);
          
          const newMessage = data.message;
          
          // Verificar se a mensagem já foi processada
          if (processedMessageIds.current.has(newMessage.messageId)) {
            console.log('🔄 Mensagem já processada, pulando:', newMessage.messageId);
            return;
          }
          
          // Determinar o contato correto para a mensagem
          let contact = newMessage.fromUser;
          
          // Se for mensagem de IA, usar o destinatário como contato
          if (newMessage.isAIResponse && newMessage.toUser) {
            contact = newMessage.toUser;
            console.log('🤖 Mensagem de IA detectada, usando destinatário como contato:', contact);
          }
          
          setConversations(prevConversations => {
            const updatedConversations = [...prevConversations];
            
            // Encontrar ou criar conversa para este contato
            let conversationIndex = updatedConversations.findIndex(c => c.contact === contact);
            
            if (conversationIndex === -1) {
              // Criar nova conversa se não existir
              updatedConversations.push({
                contact: contact,
                messages: [newMessage],
                lastMessage: {
                  text: newMessage.content || `[${newMessage.messageType}]`,
                  timestamp: new Date(newMessage.timestamp).getTime(),
                  messageType: newMessage.messageType
                },
                lastMessageTime: new Date(newMessage.timestamp).getTime(),
                unreadCount: selectedContact === contact ? 0 : 1
              });
            } else {
              // Adicionar mensagem à conversa existente
              const conversation = updatedConversations[conversationIndex];
              
              // Verificar se a mensagem já existe (evitar duplicatas)
              const messageExists = conversation.messages.some((m: any) => m.messageId === newMessage.messageId);
              
              if (!messageExists) {
                conversation.messages.push(newMessage);
                
                // Marcar mensagem como processada
                processedMessageIds.current.add(newMessage.messageId);
                
                // Atualizar última mensagem
                const messageTime = new Date(newMessage.timestamp).getTime();
                conversation.lastMessage = {
                  text: newMessage.content || `[${newMessage.messageType}]`,
                  timestamp: messageTime,
                  messageType: newMessage.messageType
                };
                conversation.lastMessageTime = messageTime;
                
                // Incrementar contador de não lidas se não for o contato selecionado
                if (selectedContact !== contact) {
                  conversation.unreadCount = (conversation.unreadCount || 0) + 1;
                }
                
                // Mover conversa para o topo
                updatedConversations.splice(conversationIndex, 1);
                updatedConversations.unshift(conversation);
                
                // NÃO REMOVER MENSAGENS LOCAIS - Elas ficam no chat permanentemente
                console.log('✅ Mensagem do servidor adicionada, mantendo mensagem local');
              }
            }
            
            return updatedConversations.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
          });
          
          console.log('✅ Nova mensagem adicionada à conversa');
          
          // Rolar para baixo se estamos vendo essa conversa
          if (selectedContact === contact) {
            setTimeout(() => scrollToBottom(), 100);
          }
        }
        
        // Verificar se é resposta do comando de envio
        else if (data.type === 'messages:send' && data.success) {
          console.log('✅ Confirmação de envio recebida:', data);
          // A mensagem já foi adicionada localmente, então não precisa fazer nada
        }
      } catch (err) {
        console.error('❌ Erro ao processar mensagem do WebSocket:', err);
      }
    };

    wsRef.current.onclose = (event) => {
      console.log('🔌 WebSocket desconectado', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean
      });
      setWsConnected(false);
      stopHeartbeat();
      
      // Usar reconexão inteligente apenas se não foi fechamento limpo
      if (!event.wasClean && connectedInstanceId && showChat) {
        handleReconnect();
      }
    };

    wsRef.current.onerror = (error) => {
      console.error('❌ Erro no WebSocket:', error);
      setWsConnected(false);
    };
    } catch (error) {
      console.error('❌ Erro ao criar conexão WebSocket:', error);
      setWsConnected(false);
    }
  };

  // Função para iniciar heartbeat
  const startHeartbeat = () => {
    // Limpar heartbeat anterior se existir
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    // Enviar ping a cada 30 segundos
    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send('ping');
          console.log('💓 Heartbeat enviado');
        } catch (error) {
          console.error('❌ Erro ao enviar heartbeat:', error);
          // Se falhar o heartbeat, tentar reconectar
          handleReconnect();
        }
      }
    }, 30000); // 30 segundos
  };

  // Função para parar heartbeat
  const stopHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  };

  // Função para reconexão inteligente com backoff exponencial
  const handleReconnect = () => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.error('🔴 Máximo de tentativas de reconexão atingido');
      return;
    }

    reconnectAttempts.current++;
    const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts.current - 1);
    
    console.log(`🔄 Agendando reconexão em ${delay}ms (tentativa ${reconnectAttempts.current}/${maxReconnectAttempts})`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (connectedInstanceId && showChat) {
        connectWebSocket();
      }
    }, delay);
  };

  // Função para desconectar WebSocket
  const disconnectWebSocket = () => {
    console.log('🔌 Desconectando WebSocket');
    
    // Limpar timers
    stopHeartbeat();
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Reset contadores
    reconnectAttempts.current = 0;
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Desconexão solicitada pelo usuário');
      wsRef.current = null;
    }
    setWsConnected(false);
  };

  // Função para rolar mensagens para baixo
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Função para carregar conversas via WebSocket
  const loadMessages = async (instanceId: string, isAutoRefresh = false) => {
    // Evitar múltiplas chamadas simultâneas
    if (isLoading && !isAutoRefresh) {
      console.log('🔄 Já carregando mensagens, pulando...');
      return;
    }
    
    // Evitar carregamento muito frequente (mínimo 2 segundos entre carregamentos)
    const now = Date.now();
    if (now - lastLoadTime.current < 2000 && isAutoRefresh) {
      console.log('⏱️ Carregamento muito frequente, pulando...');
      return;
    }
    
    try {
      if (!isAutoRefresh) {
        setIsLoading(true);
        setIsLoadingMessages(true);
      }
      
      lastLoadTime.current = now;
      
      // Conectar WebSocket se não estiver conectado
      if (!wsConnected || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.log('🔌 WebSocket não conectado, tentando conectar...');
        connectWebSocket();
        
        // Aguardar conexão com timeout
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Timeout ao aguardar conexão WebSocket'));
          }, 10000); // 10 segundos de timeout
          
          const checkConnection = () => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              clearTimeout(timeout);
              resolve(true);
            } else if (wsRef.current?.readyState === WebSocket.CLOSED) {
              clearTimeout(timeout);
              reject(new Error('WebSocket fechado durante tentativa de conexão'));
            } else {
              setTimeout(checkConnection, 100);
            }
          };
          checkConnection();
        });
      }

      console.log('📥 Enviando comandos para carregar conversas:', instanceId);
      
      // Enviar evento para buscar mensagens existentes
      const listCommand = `${instanceId}:messages:list`;
      console.log('📡 Enviando comando WebSocket:', listCommand);
      
      // Enviar evento para se inscrever em novas mensagens
      const updateCommand = `${instanceId}:messages:update`;
      console.log('📡 Enviando comando WebSocket:', updateCommand);
      
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          // Enviar comandos no formato correto (string simples)
          wsRef.current.send(listCommand);
          wsRef.current.send(updateCommand);
          console.log('✅ Comandos enviados com sucesso');
        } catch (error) {
          console.error('❌ Erro ao enviar comandos WebSocket:', error);
          throw error;
        }
      } else {
        throw new Error('WebSocket não está conectado ou pronto');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar mensagens:', error);
    } finally {
      if (!isAutoRefresh) {
        setIsLoading(false);
        setIsLoadingMessages(false);
      }
    }
  };

  // Função para iniciar auto-refresh
  const startAutoRefresh = () => {
    if (isAutoRefreshActive) {
      console.log('🔄 Auto-refresh já está ativo');
      return;
    }
    
    console.log('🔄 Iniciando auto-refresh');
    setIsAutoRefreshActive(true);
    
    autoRefreshRef.current = setInterval(() => {
      if (connectedInstanceId && showChat) {
        refreshMessages();
      }
    }, 10000); // 10 segundos
  };

  // Função para atualizar mensagens
  const refreshMessages = () => {
    if (connectedInstanceId) {
      loadMessages(connectedInstanceId, true);
    }
  };

  // Função para selecionar contato
  const selectContact = (contact: string) => {
    console.log('👤 Selecionando contato:', contact);
    setSelectedContact(contact);
    
    // Resetar contador de mensagens não lidas para este contato
    setConversations(prevConversations => 
      prevConversations.map(conv => 
        conv.contact === contact 
          ? { ...conv, unreadCount: 0 }
          : conv
      )
    );
    
    // Rolar para baixo após selecionar contato
    setTimeout(() => scrollToBottom(), 100);
  };

  // Função para enviar mensagem
  const sendMessage = async () => {
    if (!message.trim() || !selectedContact || isSending) {
      return;
    }

    setIsSending(true);
    setMessageStatus('Enviando...');

    try {
      // Criar mensagem local
      const localMessage = {
        messageId: `local_${Date.now()}_${Math.random()}`,
        content: message.trim(),
        fromUser: 'me',
        toUser: selectedContact,
        timestamp: new Date().toISOString(),
        messageType: 'text',
        isLocal: true,
        fromMe: true
      };

      // Adicionar mensagem local ao estado
      setLocalMessages(prev => [...prev, localMessage]);

      // Adicionar mensagem local à conversa
      setConversations(prevConversations => {
        const updatedConversations = [...prevConversations];
        const conversationIndex = updatedConversations.findIndex(c => c.contact === selectedContact);
        
        if (conversationIndex !== -1) {
          const conversation = updatedConversations[conversationIndex];
          conversation.messages.push(localMessage);
          
          // Atualizar última mensagem
          conversation.lastMessage = {
            text: localMessage.content,
            timestamp: new Date(localMessage.timestamp).getTime(),
            messageType: localMessage.messageType
          };
          conversation.lastMessageTime = new Date(localMessage.timestamp).getTime();
          
          // Mover conversa para o topo
          updatedConversations.splice(conversationIndex, 1);
          updatedConversations.unshift(conversation);
        }
        
        return updatedConversations.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
      });

      // Enviar via WebSocket
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          const sendCommand = `${connectedInstanceId}:messages:send`;
          const payload = {
            to: selectedContact.endsWith('@s.whatsapp.net') ? selectedContact : `${selectedContact}@s.whatsapp.net`,
            message: message.trim()
          };

          console.log('📤 Enviando mensagem via WebSocket:', sendCommand, payload);
          
          // Enviar no formato correto: comando + payload JSON
          wsRef.current.send(`${sendCommand} ${JSON.stringify(payload)}`);

          setMessageStatus('Enviado');
          setMessage('');
          
          // Rolar para baixo
          setTimeout(() => scrollToBottom(), 100);
        } catch (error) {
          console.error('❌ Erro ao enviar mensagem via WebSocket:', error);
          setMessageStatus('Erro ao enviar');
          throw error;
        }
      } else {
        console.error('❌ WebSocket não conectado ou não pronto');
        setMessageStatus('Erro: WebSocket desconectado');
        throw new Error('WebSocket não está conectado');
      }
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      setMessageStatus('Erro ao enviar');
    } finally {
      setIsSending(false);
    }
  };

  // Função para obter mensagens combinadas (locais + servidor)
  const getCombinedMessages = (contact: string) => {
    const conversation = conversations.find(c => c.contact === contact);
    const conversationMessages = conversation ? conversation.messages : [];
    
    // Combinar mensagens da conversa com mensagens locais para este contato
    // (mensagens locais enviadas por mim para este contato)
    const localMessagesForContact = localMessages.filter(m => 
      m.toUser === contact && m.fromUser === 'me'
    );
    
    const allMessages = [...conversationMessages, ...localMessagesForContact];
    
    // Remover duplicatas baseado em messageId
    const uniqueMessages = allMessages.filter((message, index, self) => 
      index === self.findIndex(m => m.messageId === message.messageId)
    );
    
    // Ordenar por timestamp
    return uniqueMessages.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  };

  // Efeito para carregar mensagens quando a instância conectar
  useEffect(() => {
    if (connectedInstanceId && showChat) {
      console.log('🚀 Carregando mensagens para instância:', connectedInstanceId);
      loadMessages(connectedInstanceId);
      startAutoRefresh();
    }

    return () => {
      clearAutoRefresh();
      disconnectWebSocket();
      
      // Limpar todos os timers
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      stopHeartbeat();
    };
  }, [connectedInstanceId, showChat]);

  // Efeito para rolar para baixo quando mensagens mudarem
  useEffect(() => {
    if (selectedContact) {
      // Só rolar automaticamente se o usuário estiver no final do chat
      const messagesContainer = messagesEndRef.current?.parentElement;
      if (messagesContainer) {
        const isAtBottom = messagesContainer.scrollTop + messagesContainer.clientHeight >= messagesContainer.scrollHeight - 100;
        
        if (isAtBottom) {
          setTimeout(() => scrollToBottom(), 100);
        }
      }
    }
  }, [conversations, localMessages, selectedContact]);

  return {
    conversations,
    selectedContact,
    isLoadingMessages,
    localMessages,
    isAutoRefreshActive,
    phone,
    setPhone,
    message,
    setMessage,
    isSending,
    messageStatus,
    wsConnected,
    loadMessages,
    startAutoRefresh,
    clearAutoRefresh,
    refreshMessages,
    selectContact,
    sendMessage,
    getCombinedMessages,
    scrollToBottom,
    messagesEndRef
  };
}; 