import { useState, useEffect } from 'react';
import { socketService } from '../services/socket';

export const useWebCodecs = () => {
  const [activeStreamers, setActiveStreamers] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const currentSocket = socketService.getSocket();
    if (!currentSocket) return;

    // Entra na sala para receber eventos
    const channelId = localStorage.getItem('current_channel_id') || 'default-room';
    currentSocket.emit('join-room', { channelId, userInfo: { id: 'dev', name: 'Dev User' } });

    const onStart = (payload: any) => {
      setIsConnected(true);
      setActiveStreamers(prev => {
        if (!prev.includes(payload.socketId)) {
          return [...prev, payload.socketId];
        }
        return prev;
      });
    };

    const onStop = ({ socketId }: { socketId: string }) => {
      setActiveStreamers(prev => prev.filter(id => id !== socketId));
    };

    currentSocket.on('stream-started', onStart);
    currentSocket.on('user-left', onStop);
    currentSocket.on('stream-stopped', onStop);

    return () => {
      currentSocket.emit('leave-room', { channelId });
      currentSocket.off('stream-started', onStart);
      currentSocket.off('user-left', onStop);
      currentSocket.off('stream-stopped', onStop);
    };
  }, []);

  return { activeStreamers, isConnected };
};
