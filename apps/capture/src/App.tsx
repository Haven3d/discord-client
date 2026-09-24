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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenBase64 = params.get('t');

    if (!tokenBase64) {
      setError('Sessão inválida. O link de transmissão requer um token.');
      return;
    }

    try {
      const sessionData = JSON.parse(atob(tokenBase64));
      
      connectSocket(sessionData);

      // Listener de inicialização do sender (agora sem joinRoom manual!)
      socket.on('connect', () => {
        webrtcSenderRef.current = new WebRTCSender(socket, sessionData.room);
        if (screenStream) {
          webrtcSenderRef.current.setLocalStream(screenStream, qualityPreset.bitrate);
        }
      });

      socket.on('room-participants', (participants: any[]) => {
        // Quantidade de pessoas assistindo (não contar com a própria captura)
        setViewers(participants.length > 0 ? participants.length - 1 : 0);
      });
      socket.on('user-joined', () => setViewers(v => v + 1));
      socket.on('user-left', () => setViewers(v => Math.max(0, v - 1)));
      
    } catch (e) {
      setError('Token corrompido ou formato inválido.');
    }

    return () => {
      disconnectSocket();
    };
  }, [screenStream, qualityPreset]);

  const handleStartCapture = async () => {
    try {
      const presetWithFps = { ...qualityPreset, fps };
      const stream = await startScreenCapture(presetWithFps);
      setScreenStream(stream);
      setIsStreaming(true);
      
      if (webrtcSenderRef.current) {
        webrtcSenderRef.current.setLocalStream(stream, qualityPreset.bitrate);
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
    if (webrtcSenderRef.current) {
      // Clear stream in WebRTC sender
      // Actually we probably want to restart or let it close
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
