import WebSocket from 'ws';

const WS_URL = 'ws://localhost:8899';
const INSTANCE_ID = 'euhueue';

console.log('🔌 Conectando ao WebSocket:', WS_URL);

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('✅ WebSocket conectado!');
  
  // Enviar comando para listar mensagens
  const command = `${INSTANCE_ID}:messages:list`;
  console.log('📤 Enviando comando:', command);
  ws.send(command);
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log('📨 Resposta recebida:');
    console.log('- Type:', message.type);
    console.log('- Success:', message.success);
    console.log('- Instance ID:', message.instanceId);
    console.log('- Mensagens:', message.messages?.length || 0);
    
    if (message.messages && message.messages.length > 0) {
      console.log('📋 Primeira mensagem:', {
        id: message.messages[0].messageId,
        from: message.messages[0].fromUser,
        content: message.messages[0].content,
        type: message.messages[0].messageType
      });
    }
  } catch (err) {
    console.log('📨 Resposta recebida (raw):', data.toString());
  }
});

ws.on('close', () => {
  console.log('🔌 WebSocket desconectado');
});

ws.on('error', (error) => {
  console.error('❌ Erro no WebSocket:', error.message);
});

// Fechar conexão após 10 segundos
setTimeout(() => {
  console.log('⏰ Fechando conexão...');
  ws.close();
  process.exit(0);
}, 10000); 