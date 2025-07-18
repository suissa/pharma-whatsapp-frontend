import WebSocket from 'ws';

const WS_URL = 'ws://localhost:8899';
const INSTANCE_ID = 'euhueue';

console.log('🔌 Conectando ao WebSocket:', WS_URL);

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('✅ WebSocket conectado!');
  
  // Enviar comando para se inscrever em updates
  const updateCommand = `${INSTANCE_ID}:messages:update`;
  console.log('📤 Enviando comando de update:', updateCommand);
  ws.send(updateCommand);
  
  console.log('🎧 Ouvindo por novas mensagens...');
  console.log('📱 Envie uma mensagem no WhatsApp para ver o update em tempo real!');
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log('\n📨 MENSAGEM RECEBIDA:');
    console.log('- Type:', message.type);
    console.log('- Success:', message.success);
    
    if (message.type === 'messages:update' && message.message) {
      console.log('🆕 NOVA MENSAGEM:');
      console.log('- De:', message.message.fromUser);
      console.log('- Conteúdo:', message.message.content);
      console.log('- Tipo:', message.message.messageType);
      console.log('- Timestamp:', message.message.timestamp);
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

// Manter conexão por 60 segundos para capturar mensagens
setTimeout(() => {
  console.log('⏰ Fechando conexão...');
  ws.close();
  process.exit(0);
}, 60000);

console.log('⏱️ Teste rodando por 60 segundos. Pressione Ctrl+C para sair antes.'); 