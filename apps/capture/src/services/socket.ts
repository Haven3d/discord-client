import { io, Socket } from 'socket.io-client';

const VITE_SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

const socket: Socket = io(VITE_SERVER_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
});

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  socket.disconnect();
};

export const joinRoom = (channelId: string, userInfo: { id: string; username: string; avatar: string }) => {
  socket.emit('join-room', { channelId, userInfo });
};

export const leaveRoom = (channelId: string) => {
  socket.emit('leave-room', { channelId });
};

export const startStream = (channelId: string) => {
  socket.emit('start-stream', { channelId });
};

export const stopStream = (channelId: string) => {
  socket.emit('stop-stream', { channelId });
};

export const sendOffer = (to: string, offer: RTCSessionDescriptionInit) => {
  socket.emit('offer', { to, offer });
};

export const sendAnswer = (to: string, answer: RTCSessionDescriptionInit) => {
  socket.emit('answer', { to, answer });
};

export const sendIceCandidate = (to: string, candidate: RTCIceCandidateInit) => {
  socket.emit('ice-candidate', { to, candidate });
};

export default socket;
