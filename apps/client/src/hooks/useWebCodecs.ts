import { useState, useEffect } from 'react';
import { socketService } from '../services/socket';

export const useWebCodecs = () => {
  const [activeStreamers, setActiveStreamers] = useState<string[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const currentSocket = socketService.getSocket();
    if (!currentSocket) return;

    const onRoomParticipants = (parts: any[]) => {
      setParticipants(parts);
    };

    const onParticipantJoined = (payload: any) => {
      setParticipants(prev => {
        if (!prev.find(p => p.socketId === payload.socketId)) {
          return [...prev, payload];
        }
        return prev;
      });
    };

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
      setParticipants(prev => prev.filter(p => p.socketId !== socketId));
    };

    currentSocket.on('room-participants', onRoomParticipants);
    currentSocket.on('participant-joined', onParticipantJoined);
    currentSocket.on('stream-started', onStart);
    currentSocket.on('user-left', onStop);
    currentSocket.on('stream-stopped', onStop);

    return () => {
      currentSocket.off('room-participants', onRoomParticipants);
      currentSocket.off('participant-joined', onParticipantJoined);
      currentSocket.off('stream-started', onStart);
      currentSocket.off('user-left', onStop);
      currentSocket.off('stream-stopped', onStop);
    };
  }, []);

  return { activeStreamers, participants, isConnected };
};
