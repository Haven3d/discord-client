import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from './config.js';
import { corsMiddleware } from './middleware/cors.js';
import { authRouter } from './routes/auth.js';
import { setupSocketHandlers } from './signaling/socketHandler.js';

const app = express();
const httpServer = createServer(app);

app.use(express.json());
app.use(corsMiddleware);

const io = new Server(httpServer, {
  path: '/ws/',
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  // Compatível com Vercel serverless — polling funciona melhor que websocket
  transports: ['polling', 'websocket'],
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Request logging for debugging proxy behavior
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  next();
});

app.use('/api', authRouter);
app.use('/', authRouter); // Catch-all just in case Discord strips the /api prefix

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

setupSocketHandlers(io);

// Configuração para rodar localmente durante o desenvolvimento
const PORT = config.port;
if (process.env.NODE_ENV !== 'production') {
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server rodando na porta ${PORT}`);
    console.log(`📡 Origens permitidas: ${config.allowedOrigins.join(', ')}`);
  });
}

// CORREÇÃO CRÍTICA PARA VERCEL SERVERLESS
// Exportamos uma função handler em vez do 'app' (Express).
// Isso garante que o tráfego HTTP chegue ao servidor base, permitindo 
// que o motor do Socket.io intercepte a rota '/ws/' com sucesso.
export default function handler(req: any, res: any) {
  httpServer.emit('request', req, res);
}
