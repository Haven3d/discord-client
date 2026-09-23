import { io } from 'socket.io-client';

const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export const socket = io(serverUrl, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
});

export interface UserInfo {
  id: string;
  username: string;
  avatar: string;
}

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  socket.disconnect();
};

export const joinRoom = (channelId: string, userInfo: UserInfo) => {
  socket.emit('join-room', { channelId, userInfo });
};

export const leaveRoom = (channelId: string) => {
  socket.emit('leave-room', { channelId });
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
