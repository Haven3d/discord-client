import React, { useEffect } from 'react';
import { useDiscordSdk } from './hooks/useDiscordSdk';
import { useWebRTC } from './hooks/useWebRTC';
import { VideoGrid } from './components/VideoGrid';
import { StartButton } from './components/StartButton';
import { UserAvatar } from './components/UserAvatar';
import { ControlPanel } from './components/ControlPanel';
import socket, { connectSocket, disconnectSocket, joinRoom } from './services/socket';
import './styles/global.css';

const App: React.FC = () => {
  const { auth, channelId, discordSdk, isReady, error } = useDiscordSdk();
  const { remoteStreams } = useWebRTC();

  useEffect(() => {
    if (isReady && auth && channelId) {
      connectSocket();
      socket?.on('connect', () => {
        joinRoom(channelId, { id: auth.id, username: auth.username, avatar: auth.avatar || '' });
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
          <h1 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 600 }}>Compartilhar Tela</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <StartButton discordSdk={discordSdk} channelId={channelId!} userId={auth.id} />
          <UserAvatar user={auth} />
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <VideoGrid remoteStreams={remoteStreams} />
        
        <div style={{ padding: '16px' }}>
          <ControlPanel />
        </div>
      </main>
    </div>
  );
};

export default App;
