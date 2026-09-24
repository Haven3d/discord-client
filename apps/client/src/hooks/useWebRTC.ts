import { useState, useEffect, useCallback } from 'react';
import socket, { sendAnswer, sendIceCandidate } from '../services/socket';

export interface RemoteStreamInfo {
  id: string; // The sender's socket ID
  stream: MediaStream;
}

export const useWebRTC = () => {
  const [remoteStreams, setRemoteStreams] = useState<RemoteStreamInfo[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [peerConnections, setPeerConnections] = useState<Map<string, RTCPeerConnection>>(new Map());

  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];

  const handleOffer = useCallback(async (from: string, offer: RTCSessionDescriptionInit) => {
    try {
      const pc = new RTCPeerConnection({ iceServers });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendIceCandidate(from, event.candidate);
        }
      };

      pc.ontrack = (event) => {
        setRemoteStreams(prev => {
          const exists = prev.find(rs => rs.id === from);
          if (exists) return prev;
          
          const newStream = new MediaStream();
          newStream.addTrack(event.track);
          return [...prev, { id: from, stream: newStream }];
        });
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') setIsConnected(true);
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          setRemoteStreams(prev => prev.filter(rs => rs.id !== from));
          setPeerConnections(prev => {
            const newMap = new Map(prev);
            newMap.delete(from);
            return newMap;
          });
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      sendAnswer(from, pc.localDescription!);

      setPeerConnections(prev => {
        const newMap = new Map(prev);
        newMap.set(from, pc);
        return newMap;
      });

    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }, []);

  const handleIceCandidate = useCallback(async (from: string, candidate: RTCIceCandidateInit) => {
    setPeerConnections(prev => {
      const pc = prev.get(from);
      if (pc) {
        pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error(e));
      }
      return prev;
    });
  }, []);

  const handleUserLeft = useCallback((socketId: string) => {
    setPeerConnections(prev => {
      const pc = prev.get(socketId);
      if (pc) pc.close();
      const newMap = new Map(prev);
      newMap.delete(socketId);
      return newMap;
    });
    setRemoteStreams(prev => prev.filter(rs => rs.id !== socketId));
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onOffer = ({ from, offer }: { from: string, offer: any }) => handleOffer(from, offer);
    const onIceCandidate = ({ from, candidate }: { from: string, candidate: any }) => handleIceCandidate(from, candidate);
    const onUserLeft = ({ socketId }: { socketId: string }) => handleUserLeft(socketId);

    socket.on('offer', onOffer);
    socket.on('ice-candidate', onIceCandidate);
    socket.on('user-left', onUserLeft);
    socket.on('stream-stopped', onUserLeft); // Stream ended

    return () => {
      socket.off('offer', onOffer);
      socket.off('ice-candidate', onIceCandidate);
      socket.off('user-left', onUserLeft);
      socket.off('stream-stopped', onUserLeft);
    };
  }, [handleOffer, handleIceCandidate, handleUserLeft]);

  return {
    remoteStreams,
    isConnected,
  };
};
