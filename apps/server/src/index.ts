import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter as authRoutes } from './routes/auth.js';
import { setupSocketHandlers as setupSocketHandler } from './signaling/socketHandler.js';
import { config } from './config.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// 1. Configurar Express
app.use(express.json());
app.use(cors({
  origin: config.allowedOrigins,
  methods: ['GET', 'POST']
}));

app.use('/api', authRoutes);

app.get('/health', (req, res) => {
  res.send('OK');
});

// 2. Configurar Socket.io (Apenas para Sinalização/Chat/Eventos)
const io = new Server(httpServer, {
  path: '/ws/',
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ['polling', 'websocket'],
  pingTimeout: 60000,
  pingInterval: 25000,
});

setupSocketHandler(io);

// 3. Configurar WebSocket Nativo (ws) Exclusivo para Relay de Vídeo
// Para evitar conflito com o path '/ws/' do Socket.io, usaremos '/video-relay'
const wss = new WebSocketServer({ noServer: true });

// Mapeamento simples de channelId -> conjunto de WebSockets dos espectadores
// E socketId -> channelId para limpeza
const videoRooms = new Map<string, Set<WebSocket>>();
const wsToRoom = new Map<WebSocket, string>();
const wsToSocketId = new Map<WebSocket, string>();
const configCache = new Map<string, string>(); // sid -> config message

wss.on('connection', (ws: WebSocket, request: any, channelId: string, isBroadcaster: boolean, socketId: string) => {
  if (!videoRooms.has(channelId)) {
    videoRooms.set(channelId, new Set());
  }

  const room = videoRooms.get(channelId)!;
  room.add(ws);
  wsToRoom.set(ws, channelId);
  wsToSocketId.set(ws, socketId);

  if (!isBroadcaster) {
    // Send all cached configs for this room to the new viewer
    for (const [sid, configMsg] of configCache.entries()) {
      // We don't have a strict sid -> channelId mapping in cache, 
      // but broadcasting all configs is harmless (the viewer filters by streamerId).
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(`${sid}|${configMsg}`);
      }
    }
  }

  ws.on('message', (message: any, isBinary: boolean) => {
    if (isBroadcaster && isBinary) {
      const sid = wsToSocketId.get(ws) || 'unknown-streamer1234';
      
      const originalBuf = message as Buffer;
      const newBuf = Buffer.alloc(20 + originalBuf.length);
      newBuf.write(sid.padEnd(20, ' '), 0, 20, 'ascii');
      originalBuf.copy(newBuf, 20);

      for (const client of room) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(newBuf, { binary: true });
        }
      }
    } else if (isBroadcaster && !isBinary) {
      const sid = wsToSocketId.get(ws) || 'unknown-streamer1234';
      const textMsg = message.toString();
      
      // Cache the configuration message
      if (textMsg.startsWith('C|')) {
        configCache.set(sid, textMsg);
      }

      for (const client of room) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(`${sid}|${textMsg}`);
        }
      }
    }
  });

  ws.on('close', () => {
    const cid = wsToRoom.get(ws);
    const sid = wsToSocketId.get(ws);
    if (cid) {
      const r = videoRooms.get(cid);
      if (r) {
        r.delete(ws);
        if (r.size === 0) {
          videoRooms.delete(cid);
        }
      }
      wsToRoom.delete(ws);
      wsToSocketId.delete(ws);
    }
    if (sid && isBroadcaster) {
      configCache.delete(sid);
    }
  });
});

httpServer.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url || '', `http://${request.headers.host}`);
  const pathname = url.pathname.replace(/^\/\.proxy/, '');

  if (pathname.startsWith('/video-relay')) {
    const channelId = url.searchParams.get('channelId');
    const role = url.searchParams.get('role');
    const socketId = url.searchParams.get('socketId') || 'unknown';
    
    if (!channelId) {
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request, channelId, role === 'broadcaster', socketId);
    });
  }
});


httpServer.listen(config.port, () => {
  console.log(`[Server] rodando na porta ${config.port}`);
});
