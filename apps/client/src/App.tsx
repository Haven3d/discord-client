import React, { useEffect } from 'react';
import { useDiscordSdk } from './hooks/useDiscordSdk';
import { useWebRTC } from './hooks/useWebRTC';
import { VideoGrid } from './components/VideoGrid';
import { StartButton } from './components/StartButton';
import { UserAvatar } from './components/UserAvatar';
import { ControlPanel } from './components/ControlPanel';
import { socketService, connectSocket, disconnectSocket } from './services/socket';
import './styles/global.css';

const App: React.FC = () => {
  const { auth, channelId, discordSdk, isReady, error } = useDiscordSdk();
  const { remoteStreams, isConnected } = useWebRTC();

  const [isSocketConnected, setIsSocketConnected] = React.useState(false);
  const [socketError, setSocketError] = React.useState('');

  useEffect(() => {
    if (isReady && auth && channelId) {
      // O viewer também entra usando Token-Based Auth convertido em Base64
      const viewerPayload = {
        room: channelId,
        uid: auth.id,
        name: auth.username,
        role: 'viewer'
      };
      // Safe Base64 for UTF-8
      const tokenString = btoa(unescape(encodeURIComponent(JSON.stringify(viewerPayload))));
      
      connectSocket(tokenString);
      const currentSocket = socketService.getSocket();
      
      currentSocket?.on('connect', () => {
        setIsSocketConnected(true);
        setSocketError('');
      });
      currentSocket?.on('disconnect', () => setIsSocketConnected(false));
      currentSocket?.on('connect_error', (err) => {
        setIsSocketConnected(false);
        setSocketError(err.message);
      });

      return () => {
        disconnectSocket();
      };
    }
  }, [isReady, auth, channelId]);

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: '20px', textAlign: 'center' }}>
        <p style={{ color: '#ef4444' }}>Erro: {error.message}</p>
      </div>
    );
  }

  if (!isReady || !auth) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '16px' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid rgba(255, 255, 255, 0.1)', borderLeftColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p>Carregando...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/haven-logo.png" alt="Haven 3D" style={{ height: '32px' }} />
          <h1 style={{ fontSize: '1rem', margin: 0, fontWeight: 500, color: 'var(--text-secondary)' }}>Transmissão Haven 3D</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <StartButton discordSdk={discordSdk} channelId={channelId!} user={auth} />
          <UserAvatar user={auth} />
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        <VideoGrid remoteStreams={remoteStreams} />
        
        <div style={{ padding: '16px', zIndex: 10 }}>
          <ControlPanel />
        </div>

        {/* Debug Overlay Temporário para caçar o bug */}
        <div style={{ position: 'absolute', bottom: '80px', left: '16px', backgroundColor: 'rgba(0,0,0,0.8)', padding: '8px', borderRadius: '4px', fontSize: '10px', color: '#0f0', pointerEvents: 'none', zIndex: 100 }}>
          <p>🔧 DIAGNÓSTICO DO SISTEMA</p>
          <p>Socket.io: {isSocketConnected ? '✅ Conectado' : '❌ Desconectado'}</p>
          {socketError && <p style={{ color: '#f87171' }}>└─ Erro: {socketError}</p>}
          <p>WebRTC: {isConnected ? '✅ Conectado' : '⌛ Aguardando'}</p>
          <p>Faixas (Vídeos): {remoteStreams.length}</p>
          <p>Proxy: {import.meta.env.DEV ? 'Local' : 'Discord CDN'}</p>
        </div>
      </main>
    </div>
  );
};

export default App;
