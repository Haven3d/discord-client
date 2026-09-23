import { Server, Socket } from 'socket.io';
import { roomManager, UserInfo } from './roomManager.js';

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('join-room', ({ channelId, userInfo }: { channelId: string; userInfo: UserInfo }) => {
      console.log(`Socket ${socket.id} joining room ${channelId}`);
      socket.join(channelId);
      roomManager.joinRoom(channelId, socket.id, userInfo);
      
      socket.to(channelId).emit('user-joined', {
        socketId: socket.id,
        user: userInfo,
      });
    });

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
