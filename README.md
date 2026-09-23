# 📺 Discord Screen Share Activity

Uma **Discord Activity** moderna para compartilhamento de tela e transmissão de vídeo/áudio em tempo real com ultra-baixa latência dentro dos canais de voz do Discord. Construída utilizando **Discord Embedded App SDK**, **WebRTC**, **Socket.io**, **React**, **Vite** e **Express**.

---

## 🚀 Visão Geral da Arquitetura

O projeto é estruturado como um **Monorepo (npm workspaces)** composto por três aplicações integradas:

```
discord-screen-share/
├── apps/
│   ├── client/       # Discord Activity (React + Vite + Embedded App SDK)
│   ├── capture/      # Capturador de Tela no Navegador (React + Vite + WebRTC)
│   └── server/       # Servidor de Sinalização & Autenticação (Node.js + Express + Socket.io)
├── .env.example      # Variáveis de ambiente de exemplo
├── .gitignore        # Arquivos ignorados pelo Git
├── package.json      # Configuração raiz do monorepo
└── README.md         # Documentação do projeto
```

### 1. `apps/client` (Discord Activity Viewer)
- Aplicação executada dentro do cliente do Discord (Desktop, Web ou Mobile) dentro de um `iframe` seguro.
- Utiliza `@discord/embedded-app-sdk` para autenticação OAuth2 transparente com a conta do Discord do usuário.
- Conecta-se ao servidor de sinalização via Socket.io e consome o stream WebRTC emitido pela aplicação de captura.

### 2. `apps/capture` (Screen Presenter)
- Aplicação web aberta em uma aba independente de navegador para contornar restrições de permissão de mídia dentro do sandbox de iframes do Discord.
- Utiliza `navigator.mediaDevices.getDisplayMedia` para capturar a tela inteira, janelas de aplicativos ou abas individuais com suporte a áudio do sistema.
- Atua como transmissor (*publisher*) WebRTC, enviando faixas de vídeo e áudio para os participantes da sala.

### 3. `apps/server` (Signaling & Auth API)
- Servidor HTTP Express e WebSocket Socket.io em TypeScript.
- Realiza a troca de código OAuth2 por token de acesso da API do Discord (`POST /api/token`).
- Gerencia salas de transmissão vinculadas aos canais de voz/atividades do Discord.
- Orquestra a troca de mensagens de sinalização WebRTC (SDP Offers, Answers e ICE Candidates).

---

## ⚙️ Pré-requisitos

- **Node.js**: Versão 18.0.0 ou superior
- **npm**: Versão 7.0.0 ou superior (com suporte nativo a workspaces)
- Conta no [Discord Developer Portal](https://discord.com/developers/applications)
- Ferramenta de túnel HTTPS local para desenvolvimento (ex: [Cloudflare Tunnel](https://developers.cloudflare.com/pages/how-to/preview-with-cloudflare-tunnel/), [ngrok](https://ngrok.com/) ou [localtunnel](https://localtunnel.github.io/www/)), necessária pois o Discord exige URLs HTTPS válidas para carregar Activities.

---

## 🛠️ Configuração do Discord Developer Portal

1. Acesse o [Discord Developer Portal](https://discord.com/developers/applications) e crie uma nova aplicação (ex: `Screen Share Activity`).
2. Vá até a aba **OAuth2**:
   - Copie o **Client ID** e gere um **Client Secret**.
   - Adicione os redirecionamentos necessários se aplicável.
3. Vá até a aba **Activities**:
   - Ative a funcionalidade de Activity.
   - Configure o **URL Mapping** mapeando o caminho raiz para a URL do seu cliente (ou URL do túnel durante o desenvolvimento local).

---

## 📦 Instalação e Configuração Local

1. Clone o repositório ou navegue até a pasta do projeto:
   ```bash
   cd discord-screen-share
   ```

2. Crie o arquivo `.env` na raiz do projeto copiando o exemplo:
   ```bash
   cp .env.example .env
   ```

3. Edite o `.env` com suas credenciais do Discord e URLs desejadas:
   ```env
   DISCORD_CLIENT_ID=seu_client_id_aqui
   DISCORD_CLIENT_SECRET=seu_client_secret_aqui
   SERVER_URL=http://localhost:3001
   VITE_SERVER_URL=http://localhost:3001
   VITE_CAPTURE_URL=http://localhost:5174
   PORT=3001
   ```

4. Instale as dependências de todo o monorepo a partir da raiz:
   ```bash
   npm install
   ```

---

## 💻 Scripts Disponíveis

Na raiz do monorepo, utilize os seguintes scripts:

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia todos os serviços (`server`, `client`, `capture`) simultaneamente. |
| `npm run dev:server` | Inicia apenas o servidor de sinalização em modo desenvolvimento (`PORT 3001`). |
| `npm run dev:client` | Inicia a aplicação Discord Activity Client (`PORT 5173`). |
| `npm run dev:capture` | Inicia a aplicação web de captura de tela (`PORT 5174`). |
| `npm run build` | Compila todos os pacotes do monorepo para produção. |
| `npm run build:server` | Compila o backend Express/TypeScript (`apps/server/dist`). |
| `npm run build:client` | Compila o frontend do cliente (`apps/client/dist`). |
| `npm run build:capture` | Compila o frontend de captura (`apps/capture/dist`). |

---

## 🚀 Guia de Deploy em Produção

### 1. Servidor de Sinalização (Railway)

1. Crie um novo projeto no [Railway](https://railway.app/) conectado ao repositório GitHub.
2. Nas configurações do serviço:
   - **Root Directory**: `apps/server` (ou mantenha na raiz configurando os scripts de build).
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start` (ou `node dist/index.js`)
3. Adicione as seguintes **Variáveis de Ambiente** no Railway:
   - `PORT`: `3001` (ou a porta atribuída dinamicamente pelo Railway `${{PORT}}`)
   - `DISCORD_CLIENT_ID`: Seu Client ID do Discord
   - `DISCORD_CLIENT_SECRET`: Seu Client Secret do Discord
   - `ALLOWED_ORIGINS`: URLs do Client e do Capture em produção (separadas por vírgula)
4. Obtenha o domínio público gerado pelo Railway (ex: `https://seu-servidor.up.railway.app`).

### 2. Frontends Client e Capture (Vercel)

Você pode criar dois projetos separados na [Vercel](https://vercel.com/) a partir do mesmo repositório:

#### Deploy do `apps/client` (Discord Activity Viewer):
1. Importe o repositório na Vercel.
2. Em **Root Directory**, selecione `apps/client`.
3. Em **Framework Preset**, selecione **Vite**.
4. Configure as Variáveis de Ambiente:
   - `VITE_SERVER_URL`: `https://seu-servidor.up.railway.app`
   - `VITE_CAPTURE_URL`: `https://seu-capture.vercel.app`
5. Finalize o deploy e adicione o domínio gerado na aba **Activities** do Discord Developer Portal.

#### Deploy do `apps/capture` (Screen Share Presenter):
1. Importe o mesmo repositório na Vercel para um segundo projeto.
2. Em **Root Directory**, selecione `apps/capture`.
3. Em **Framework Preset**, selecione **Vite**.
4. Configure as Variáveis de Ambiente:
   - `VITE_SERVER_URL`: `https://seu-servidor.up.railway.app`
5. Finalize o deploy e atualize `VITE_CAPTURE_URL` no client com o domínio obtido.

---

## 🛡️ Licença

Este projeto está sob a licença [MIT](LICENSE).
