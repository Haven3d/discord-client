import { useState, useEffect } from 'react';
import { socketService } from '../services/socket';

export const useWebCodecs = () => {
  const [activeStreamers, setActiveStreamers] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const currentSocket = socketService.getSocket();
    if (!currentSocket) return;

    const onActivity = (payload: any) => {
      setIsConnected(true);
      setActiveStreamers(prev => {
        if (!prev.includes(payload.from)) {
          return [...prev, payload.from];
        }
        return prev;
      });
    };

    const onStop = ({ socketId }: { socketId: string }) => {
      setActiveStreamers(prev => prev.filter(id => id !== socketId));
    };

    currentSocket.on('video-config', onActivity);
    currentSocket.on('video-chunk', onActivity);
    currentSocket.on('user-left', onStop);
    currentSocket.on('stream-stopped', onStop);

    return () => {
      currentSocket.off('video-config', onActivity);
      currentSocket.off('video-chunk', onActivity);
      currentSocket.off('user-left', onStop);
      currentSocket.off('stream-stopped', onStop);
    };
  }, []);

  return { activeStreamers, isConnected };
};
