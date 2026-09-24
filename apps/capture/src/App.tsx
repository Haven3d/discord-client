import { useState, useEffect, useRef } from 'react';
import socket, { connectSocket, disconnectSocket, joinRoom } from './services/socket';
import { WebRTCSender } from './services/webrtc-sender';
import { CapturePanel } from './components/CapturePanel';
import { CameraPreview } from './components/CameraPreview';
import { StreamStatus } from './components/StreamStatus';
import { QualityPreset, QUALITY_PRESETS, startScreenCapture, stopCapture } from './services/media-capture';

function App() {
  const [error, setError] = useState<string | null>(null);
  const [channelId, setChannelId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [qualityPreset, setQualityPreset] = useState<QualityPreset>(QUALITY_PRESETS[0]);
  const [fps, setFps] = useState<number>(30);
  
  const webrtcSenderRef = useRef<WebRTCSender | null>(null);
  const [viewers, setViewers] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cId = params.get('channelId');
    const uId = params.get('userId');

    if (!cId || !uId) {
      setError('Parâmetros inválidos. channelId e userId são obrigatórios.');
      return;
    }

    setChannelId(cId);
    setUserId(uId);
    connectSocket();

    return () => {
      disconnectSocket();
    };
  }, []);

  useEffect(() => {
    if (channelId && userId) {
      socket.on('connect', () => {
        const userInfo = { id: userId, username: 'Transmissão', avatar: '' };
        joinRoom(channelId, userInfo as any);
        webrtcSenderRef.current = new WebRTCSender(socket, channelId);
        if (screenStream) {
          webrtcSenderRef.current.setLocalStream(screenStream, qualityPreset.bitrate);
        }
      });

      socket.on('user-joined', () => setViewers(v => v + 1));
      socket.on('user-left', () => setViewers(v => Math.max(0, v - 1)));
    }
  }, [channelId, userId, screenStream, qualityPreset]);

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
      <header className="header">
        <h1>Transmitir Tela - Discord Screen Share</h1>
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
