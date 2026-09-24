import { useState, useEffect, useRef } from 'react';
import socket, { connectSocket, disconnectSocket } from './services/socket';
import { WebRTCSender } from './services/webrtc-sender';
import { CapturePanel } from './components/CapturePanel';
import { CameraPreview } from './components/CameraPreview';
import { StreamStatus } from './components/StreamStatus';
import { QualityPreset, QUALITY_PRESETS, startScreenCapture, stopCapture } from './services/media-capture';

function App() {
  const [error, setError] = useState<string | null>(null);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [qualityPreset, setQualityPreset] = useState<QualityPreset>(QUALITY_PRESETS[0]);
  const [fps, setFps] = useState<number>(30);
  
  const webrtcSenderRef = useRef<WebRTCSender | null>(null);
  const [viewers, setViewers] = useState(0);

  const [room, setRoom] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenBase64 = params.get('t');

    if (!tokenBase64) {
      setError('Sessão inválida. O link de transmissão requer um token.');
      return;
    }

    try {
      // Decode Base64 safe for UTF-8
      const sessionData = JSON.parse(decodeURIComponent(escape(atob(tokenBase64))));
      setRoom(sessionData.room);
      
      // 1. Inicializa o Sender ANTES de conectar para ele registrar os listeners (como room-participants) a tempo
      webrtcSenderRef.current = new WebRTCSender(socket, sessionData.room);
      
      // 2. Conecta no servidor
      connectSocket(sessionData);

      const onRoomParticipants = (participants: any[]) => {
        // Quantidade de pessoas assistindo (não contar com a própria captura)
        setViewers(participants.length > 0 ? participants.length - 1 : 0);
      };
      
      const onUserJoined = () => setViewers(v => v + 1);
      const onUserLeft = () => setViewers(v => Math.max(0, v - 1));

      socket.on('room-participants', onRoomParticipants);
      socket.on('user-joined', onUserJoined);
      socket.on('user-left', onUserLeft);
      
      return () => {
        socket.off('room-participants', onRoomParticipants);
        socket.off('user-joined', onUserJoined);
        socket.off('user-left', onUserLeft);
        disconnectSocket();
      };
    } catch (e) {
      setError('Token corrompido ou formato inválido.');
    }
  }, []); // <-- Array vazio! Apenas conecta uma vez ao abrir a aba.

  const handleStartCapture = async () => {
    try {
      const presetWithFps = { ...qualityPreset, fps };
      const stream = await startScreenCapture(presetWithFps);
      setScreenStream(stream);
      setIsStreaming(true);
      
      if (webrtcSenderRef.current) {
        webrtcSenderRef.current.setLocalStream(stream, qualityPreset.bitrate);
      }
      
      if (room) {
        socket.emit('start-stream', { channelId: room });
      }

      stream.getVideoTracks()[0].onended = () => {
        handleStopCapture();
      };
    } catch (err) {
      console.error('Failed to start capture:', err);
    }
  };

  const handleStopCapture = () => {
    if (screenStream) {
      stopCapture(screenStream);
      setScreenStream(null);
    }
    setIsStreaming(false);
    
    if (room) {
      socket.emit('stop-stream', { channelId: room });
    }
    
    if (webrtcSenderRef.current) {
      // webrtcSenderRef.current.closeAll(); // Optamos por não destruir tudo, apenas para de enviar tracks.
    }
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="app-container">
      <header className="header" style={{ justifyContent: 'space-between', display: 'flex', width: '100%' }}>
        <img src="/haven-logo.png" alt="Haven 3D Logo" style={{ height: '40px' }} />
        <h1 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Painel de Transmissão</h1>
      </header>
      
      <main className="main-content">
        <div className="left-panel">
          <CapturePanel
            isStreaming={isStreaming}
            stream={screenStream}
            qualityPreset={qualityPreset}
            setQualityPreset={setQualityPreset}
            fps={fps}
            setFps={setFps}
            onStart={handleStartCapture}
            onStop={handleStopCapture}
          />
        </div>
        
        <div className="right-panel">
          <CameraPreview />
        </div>
      </main>

      <footer className="footer">
        <StreamStatus isStreaming={isStreaming} viewers={viewers} />
      </footer>
    </div>
  );
}

export default App;
