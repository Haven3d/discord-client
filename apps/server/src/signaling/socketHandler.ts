import { Server, Socket } from 'socket.io';
import { roomManager, UserInfo } from './roomManager.js';
export function setupSocketHandlers(io: Server) {
  // Middleware de Autenticação Baseada em Token (Fase 3)
  io.use((socket, next) => {
    const session = socket.handshake.auth.token;
    if (!session || !session.room) {
      return next(new Error("Token inválido"));
    }
    // Armazena na instância do socket para usar depois
    socket.data.sessionData = session;
    next();
  });

  io.on('connection', (socket: Socket) => {
    const session = socket.data.sessionData;
    const room = session.room;
    const userInfo: UserInfo = { id: session.uid, username: session.name, avatar: '' };

    console.log(`Usuário ${session.name} (${session.role}) conectou e entrou na sala ${room}`);
    
    // Auto-Join Mágico! Nenhum emit no frontend é necessário
    socket.join(room);
    roomManager.joinRoom(room, socket.id, userInfo);

    // Opcional: Avisar aos espectadores que o broadcaster chegou
    if (session.role === 'broadcaster') {
      socket.to(room).emit('broadcaster-ready', session.uid);
    }

    // Mantém a compatibilidade com nossa arquitetura anterior enviando os avisos nativos:
    socket.to(room).emit('user-joined', {
      socketId: socket.id,
      user: userInfo,
    });

    // Enviar participantes existentes para quem acabou de entrar
    const participants = roomManager.getRoomParticipants(room);
    socket.emit('room-participants', participants);

    socket.on('leave-room', ({ channelId }: { channelId: string }) => {
      console.log(`Socket ${socket.id} leaving room ${channelId}`);
      socket.leave(channelId);
      roomManager.leaveRoom(channelId, socket.id);
      
      socket.to(channelId).emit('user-left', {
        socketId: socket.id,
      });
    });

    socket.on('offer', ({ to, offer }: { to: string; offer: any }) => {
      socket.to(to).emit('offer', { from: socket.id, offer });
    });

    socket.on('answer', ({ to, answer }: { to: string; answer: any }) => {
      socket.to(to).emit('answer', { from: socket.id, answer });
    });

    socket.on('ice-candidate', ({ to, candidate }: { to: string; candidate: any }) => {
      socket.to(to).emit('ice-candidate', { from: socket.id, candidate });
    });

    socket.on('start-stream', ({ channelId }: { channelId: string }) => {
      console.log(`Socket ${socket.id} started stream in room ${channelId}`);
      roomManager.startStream(channelId, socket.id);
      socket.to(channelId).emit('stream-started', { socketId: socket.id });
    });

    socket.on('stop-stream', ({ channelId }: { channelId: string }) => {
      console.log(`Socket ${socket.id} stopped stream in room ${channelId}`);
      roomManager.stopStream(channelId, socket.id);
      socket.to(channelId).emit('stream-stopped', { socketId: socket.id });
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      
      const channels = Array.from(socket.rooms);
      
      for (const channelId of channels) {
        if (channelId !== socket.id) {
           socket.to(channelId).emit('user-left', { socketId: socket.id });
        }
      }
      
      roomManager.removeParticipantFromAllRooms(socket.id);
    });
  });
}
