import WebSocket from 'ws';

const WS_URL = 'ws://localhost:8899';
const INSTANCE_ID = 'euhueue';

console.log('🔌 Conectando ao WebSocket:', WS_URL);

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('✅ WebSocket conectado!');
  
  // Aguardar um pouco e enviar mensagem de teste
  setTimeout(() => {
    const sendCommand = {
      to: '5515991957645@s.whatsapp.net',
      message: `🧪 Teste via WebSocket - ${new Date().toLocaleString('pt-BR')}`
    };
    
    const wsCommand = `${INSTANCE_ID}:messages:send ${JSON.stringify(sendCommand)}`;
    console.log('📤 Enviando comando:', wsCommand);
    ws.send(wsCommand);
  }, 1000);
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log('\n📨 RESPOSTA RECEBIDA:');
    console.log('- Type:', message.type);
    console.log('- Success:', message.success);
    console.log('- Message:', message.message);
    
    if (message.result) {
      console.log('- Result:', JSON.stringify(message.result, null, 2));
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

console.log('⏱️ Teste rodando por 10 segundos...'); 