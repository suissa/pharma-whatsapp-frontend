import { API_URL } from '../../config';
import axios from 'axios';

interface ConnectionFormProps {
  instanceId: string;
  setInstanceId: (id: string) => void;
  qrCode: string;
  isConnecting: boolean;
  isConnected: boolean;
  status: string;
  error: string;
  autoOpenCountdown: number;
  createInstance: () => void;
  disconnect: () => void;
  onOpenChat: () => void;
  setAutoOpenCountdown: (countdown: number) => void;
}

export default function ConnectionForm({
  instanceId,
  setInstanceId,
  qrCode,
  isConnecting,
  isConnected,
  status,
  error,
  autoOpenCountdown,
  createInstance,
  disconnect,
  onOpenChat,
  setAutoOpenCountdown
}: ConnectionFormProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="text-center mb-0 w-full max-w-2xl">
        <div className="mb-0">
          <img src="/logo.png" className="w-[300px] h-auto" alt="Pharma Chat Bot" onError={(e) => {
            // Se a imagem não carregar, mostrar texto alternativo
            const img = e.target as HTMLImageElement;
            img.style.display = 'none';
            const fallback = document.createElement('div');
            fallback.className = 'text-center text-3xl font-bold text-gray-800 py-8';
            fallback.innerHTML = '🤖 PHARMA CHAT BOT';
            img.parentNode?.appendChild(fallback);
          }} />
        </div>
      </div>

      {/* Tela de Conexão - quando não há instância conectada */}
      <div className="connection-section max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="form-section">
          <div className="input-group">
            <label htmlFor="instanceId">ID da Instância:</label>
            <input
              id="instanceId"
              type="text"
              value={instanceId}
              onChange={(e) => setInstanceId(e.target.value)}
              placeholder="Ex: meu-whatsapp-bot"
              disabled={isConnecting || isConnected}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-whatsapp-green focus:border-transparent disabled:bg-gray-100"
            />
          </div>
          
          <div className="button-group">
            {!isConnecting && !isConnected && (
              <button 
                onClick={createInstance}
                className="btn btn-primary"
                disabled={!instanceId.trim()}
              >
                📱 Conectar
              </button>
            )}
            
            {isConnected && (
              <button 
                onClick={disconnect}
                className="btn btn-danger"
              >
                🔌 Desconectar
              </button>
            )}
          </div>
        </div>
        
        {status && (
          <div className="status status-info">
            {status}
          </div>
        )}
        
        {error && (
          <div className="status status-error">
            ❌ {error}
          </div>
        )}
        
        {qrCode && (
          <div className="qrcode-section">
            <h3>📱 Escaneie o QR Code no WhatsApp</h3>
            <div className="qrcode-container">
              <img 
                src={qrCode.startsWith('data:image/') ? qrCode : `data:image/png;base64,${qrCode}`}
                alt="QR Code"
                onError={(e) => {
                  console.error('Erro ao carregar QR Code:', e);
                  // Tentar buscar como imagem se falhar
                  axios.get(`${API_URL}/api/instance/${instanceId}/qrcode/image`)
                    .then(response => {
                      if (response.data.success) {
                        const img = e.target as HTMLImageElement;
                        img.src = response.data.qrCodeImage;
                      }
                    })
                    .catch(console.error);
                }}
              />
            </div>
            <p className="qrcode-instructions">
              1. Abra o WhatsApp no seu celular<br/>
              2. Vá em Menu → Dispositivos conectados<br/>
              3. Toque em "Conectar um dispositivo"<br/>
              4. Escaneie este QR Code
            </p>
          </div>
        )}
        
        {isConnected && (
          <div className="success-section">
            <div className="success-icon">✅</div>
            <h3>WhatsApp Conectado!</h3>
            <p>Sua instância está pronta para uso.</p>
            <div className="button-group mt-4">
              <button 
                onClick={() => {
                  console.log('🚀 Abrindo chat manualmente...');
                  setAutoOpenCountdown(0); // Cancelar countdown
                  onOpenChat();
                }}
                className="btn btn-primary"
              >
                💬 Abrir Chat {autoOpenCountdown > 0 && `(${autoOpenCountdown}s)`}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {autoOpenCountdown > 0 ? 
                `O chat será aberto automaticamente em ${autoOpenCountdown} segundos...` :
                'O chat será aberto automaticamente em alguns segundos...'
              }
            </p>
          </div>
        )}
      </div>

      {isConnecting && (
        <div className="loading-section">
          <div className="spinner"></div>
          <p>Conectando...</p>
        </div>
      )}
    </div>
  );
} 