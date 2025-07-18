# 📱 Baileys WhatsApp Frontend

Frontend React + TypeScript + Vite para gerenciar instâncias WhatsApp via API Baileys.

## 🚀 Funcionalidades

- ✅ **Conectar instâncias WhatsApp** via botão simples
- ✅ **Exibição de QR Code** com polling automático a cada 10 segundos
- ✅ **Interface responsiva** e minimalista
- ✅ **Status em tempo real** da conexão
- ✅ **Desconexão de instâncias** ativas

## 🛠️ Configuração

### 1. Instalação

```bash
npm install
```

### 2. Configuração da API

Por padrão, o frontend conecta em `http://localhost:3000`. Para alterar:

**Opção 1: Variável de ambiente**
```bash
# Criar arquivo .env
echo "VITE_API_URL=http://sua-api.com" > .env
```

**Opção 2: Editar config.ts**
```typescript
// src/config.ts
export const config = {
  API_URL: 'http://sua-api.com',
  // ...
}
```

### 3. Desenvolvimento

```bash
npm run dev
```

Acesse: `http://localhost:5173`

### 4. Build para produção

```bash
npm run build
```

Os arquivos serão gerados em `dist/`

## 📋 Como usar

1. **Certifique-se** de que a API Baileys está rodando
2. **Abra o frontend** no navegador
3. **Digite um ID** para sua instância WhatsApp
4. **Clique em "Conectar"**
5. **Escaneie o QR Code** que aparecerá
6. **Aguarde** a confirmação de conexão

## 🔧 Estrutura do projeto

```
baileys-frontend/
├── src/
│   ├── App.tsx          # Componente principal
│   ├── App.css          # Estilos da aplicação
│   ├── config.ts        # Configurações da API
│   └── main.tsx         # Ponto de entrada
├── public/
│   └── logo.png         # Logo da aplicação (opcional)
└── package.json
```

## 🎨 Personalização

### Alterar URL da API

```typescript
// src/config.ts
export const config = {
  API_URL: 'https://sua-api.com',
  POLLING_INTERVAL: 10000, // 10 segundos
}
```

### Alterar intervalo de polling

```typescript
// src/config.ts
export const config = {
  API_URL: 'http://localhost:3000',
  POLLING_INTERVAL: 5000, // 5 segundos
}
```

### Adicionar logo personalizado

Coloque sua logo em `public/logo.png` (recomendado: 200x200px)

## 🔗 Endpoints utilizados

- `POST /api/instance/create` - Criar instância
- `GET /api/instance/{id}/qrcode` - Obter QR Code
- `GET /api/instance/{id}` - Status da instância
- `DELETE /api/instance/{id}` - Desconectar instância

## 🚨 Solução de problemas

### Erro de CORS

Se encontrar erro de CORS, adicione no seu servidor da API:

```typescript
app.use(cors({
  origin: 'http://localhost:5173' // URL do frontend
}))
```

### API não encontrada

1. Verifique se a API está rodando
2. Confirme a URL no arquivo `config.ts`
3. Teste a API diretamente: `curl http://localhost:3000/api/health`

### QR Code não aparece

1. Aguarde alguns segundos após clicar "Conectar"
2. O QR Code é gerado automaticamente a cada 10 segundos
3. Verifique se a instância não está já conectada

## 📦 Dependências

- **React 18** - Framework frontend
- **TypeScript** - Tipagem estática
- **Vite** - Build tool
- **Axios** - Cliente HTTP
- **CSS3** - Estilização responsiva

## 📱 Compatibilidade

- ✅ Chrome/Edge 90+
- ✅ Firefox 85+
- ✅ Safari 14+
- ✅ Mobile (iOS/Android)

## 🎯 Próximos passos

- [ ] Histórico de mensagens
- [ ] Envio de mensagens
- [ ] Múltiplas instâncias simultâneas
- [ ] Dashboard de estatísticas
- [ ] Configurações avançadas
