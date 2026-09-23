import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const connectSocket = (serverUrl?: string) => {
  if (!socket) {
    const isDev = import.meta.env.DEV;
    let finalUrl = serverUrl || import.meta.env.VITE_SERVER_URL?.replace(/\/$/, '') || (isDev ? 'http://localhost:3001' : '');
    
    if (finalUrl.includes('discord-client-server')) {
        finalUrl = ''; // Usa o proxy
    }
    
    socket = io(finalUrl || undefined, {
      path: '/ws/',
      transports: ['polling', 'websocket'],
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connect error:', err);
    });
  }
  return socket;
};

// [Restante do arquivo que já existia mantido, re-exportando as mesmas coisas...]
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinRoom = (channelId: string, userInfo: any) => {
  if (socket) {
    socket.emit('join-room', { channelId, userInfo });
  }
};

export const sendOffer = (to: string, offer: RTCSessionDescriptionInit) => {
  if (socket) {
    socket.emit('offer', { to, offer });
  }
};

export const sendAnswer = (to: string, answer: RTCSessionDescriptionInit) => {
  if (socket) {
    socket.emit('answer', { to, answer });
  }
};

export const sendIceCandidate = (to: string, candidate: RTCIceCandidateInit) => {
  if (socket) {
    socket.emit('ice-candidate', { to, candidate });
  }
};

export const socketService = {
  connect: connectSocket,
  disconnect: disconnectSocket,
  joinRoom,
  sendOffer,
  sendAnswer,
  sendIceCandidate,
  getSocket: () => socket,
  onOffer: (callback: (from: string, offer: RTCSessionDescriptionInit) => void) => {
    socket?.on('offer', ({ sender, offer }) => callback(sender, offer));
  },
  onAnswer: (callback: (from: string, answer: RTCSessionDescriptionInit) => void) => {
    socket?.on('answer', ({ sender, answer }) => callback(sender, answer));
  },
  onIceCandidate: (callback: (from: string, candidate: RTCIceCandidateInit) => void) => {
    socket?.on('ice-candidate', ({ sender, candidate }) => callback(sender, candidate));
  }
};

export default socket;
