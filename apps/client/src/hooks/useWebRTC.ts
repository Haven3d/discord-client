import React, { useState, useEffect, useCallback } from 'react';
import { socketService, sendAnswer, sendIceCandidate } from '../services/socket';

export interface RemoteStreamInfo {
  id: string; // The sender's socket ID
  stream: MediaStream;
}

export const useWebRTC = () => {
  const [remoteStreams, setRemoteStreams] = useState<RemoteStreamInfo[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const peerConnections = React.useRef<Map<string, RTCPeerConnection>>(new Map());

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
          peerConnections.current.delete(from);
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      sendAnswer(from, pc.localDescription!);

      peerConnections.current.set(from, pc);

    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }, []);

  const handleIceCandidate = useCallback(async (from: string, candidate: RTCIceCandidateInit) => {
    const pc = peerConnections.current.get(from);
    if (pc) {
      pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error(e));
    }
  }, []);

  const handleUserLeft = useCallback((socketId: string) => {
    const pc = peerConnections.current.get(socketId);
    if (pc) {
      pc.close();
      peerConnections.current.delete(socketId);
    }
    setRemoteStreams(prev => prev.filter(rs => rs.id !== socketId));
  }, []);

  useEffect(() => {
    const currentSocket = socketService.getSocket();
    if (!currentSocket) return;

    const onOffer = ({ from, offer }: { from: string, offer: any }) => handleOffer(from, offer);
    const onIceCandidate = ({ from, candidate }: { from: string, candidate: any }) => handleIceCandidate(from, candidate);
    const onUserLeft = ({ socketId }: { socketId: string }) => handleUserLeft(socketId);

    currentSocket.on('offer', onOffer);
    currentSocket.on('ice-candidate', onIceCandidate);
    currentSocket.on('user-left', onUserLeft);
    currentSocket.on('stream-stopped', onUserLeft);

    return () => {
      currentSocket.off('offer', onOffer);
      currentSocket.off('ice-candidate', onIceCandidate);
      currentSocket.off('user-left', onUserLeft);
      currentSocket.off('stream-stopped', onUserLeft);
    };
  }, [handleOffer, handleIceCandidate, handleUserLeft]);

  return {
    remoteStreams,
    isConnected,
  };
};
