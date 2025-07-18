export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const POLL_INTERVAL = 10000; // 10 segundos

// Debug: Verificar se a variável de ambiente está sendo carregada
console.log('🔧 Configuração da API:');
console.log('- VITE_API_URL from env:', import.meta.env.VITE_API_URL);
console.log('- API_URL final:', API_URL);
console.log('- Mode:', import.meta.env.MODE);
console.log('- Env vars:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));