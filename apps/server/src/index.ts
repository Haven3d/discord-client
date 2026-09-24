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
  // Habilitar WebSockets nativos e Polling
  transports: ['polling', 'websocket'],
  pingTimeout: 60000,
  pingInterval: 25000,
  // Keyframe VP8 1080p pode chegar a 200KB+; o padrão é 1MB, vamos para 4MB
  maxHttpBufferSize: 4 * 1024 * 1024,
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

const PORT = Number(process.env.PORT || config.port || 3001);

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor contínuo rodando na porta ${PORT}`);
  console.log(`📡 Origens permitidas: ${config.allowedOrigins.join(', ')}`);
});
