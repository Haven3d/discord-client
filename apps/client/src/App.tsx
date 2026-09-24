import React, { useEffect } from 'react';
import { useDiscordSdk } from './hooks/useDiscordSdk';
import { useWebCodecs } from './hooks/useWebCodecs';
import { VideoGrid } from './components/VideoGrid';
import { StartButton } from './components/StartButton';
import { UserAvatar } from './components/UserAvatar';
import { ControlPanel } from './components/ControlPanel';
import { socketService, connectSocket, disconnectSocket } from './services/socket';
import './styles/global.css';

const App: React.FC = () => {
  // Forçando o uso do layout local mesmo dentro do iframe do Discord
  const isInsideDiscord = false;

  if (!isInsideDiscord && !socketService.getSocket()) {
      connectSocket({ room: 'default-room', uid: 'dev-user', name: 'Dev User', role: 'viewer' });
  }

  const { auth, channelId, discordSdk, isReady, error } = useDiscordSdk();
  const { activeStreamers, isConnected } = useWebCodecs();

  const [isSocketConnected, setIsSocketConnected] = React.useState(false);
  const [socketError, setSocketError] = React.useState('');

  useEffect(() => {
    if (isReady && auth && channelId) {
      // O viewer entra usando Token-Based Auth como Objeto JSON direto (o Socket.io serializa pra gente)
      const viewerPayload = {
        room: channelId,
        uid: auth.id,
        name: auth.username,
        role: 'viewer'
      };
      
      connectSocket(viewerPayload);
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

  if (!isInsideDiscord) {
    // Modo de Desenvolvimento (Mock)
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <header style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/haven-logo.png" alt="Haven 3D" style={{ height: '32px' }} />
            <h1 style={{ fontSize: '1rem', margin: 0, fontWeight: 500, color: 'var(--text-secondary)' }}>Transmissão (Local Test)</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={async () => {
              const captureUrl = import.meta.env.VITE_CAPTURE_URL || 'http://localhost:5174';
              const fullUrl = captureUrl + '?channelId=default-room&userId=dev';
              
              if (window.parent !== window) {
                // Dentro do Discord, window.open é bloqueado. Precisamos do SDK.
                try {
                  await discordSdk.ready();
                  discordSdk.commands.openExternalLink({ url: fullUrl });
                } catch (e) {
                  console.error("Falha ao abrir link pelo SDK:", e);
                }
              } else {
                window.open(fullUrl, '_blank');
              }
            }} style={{ padding: '8px 16px', backgroundColor: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
              🔴 Abrir Captura
            </button>
            <div style={{ color: '#fff' }}>Dev User</div>
          </div>
        </header>

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          <VideoGrid activeStreamers={activeStreamers} channelId="default-room" />
          <div style={{ padding: '16px', zIndex: 10 }}><ControlPanel /></div>
        </main>
      </div>
    );
  }

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
        <p>Carregando Discord SDK...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
        <VideoGrid activeStreamers={activeStreamers} channelId={channelId!} />
        
        <div style={{ padding: '16px', zIndex: 10 }}>
          <ControlPanel />
        </div>

        {/* Debug Overlay Temporário para caçar o bug */}
        <div style={{ position: 'absolute', bottom: '80px', left: '16px', backgroundColor: 'rgba(0,0,0,0.8)', padding: '8px', borderRadius: '4px', fontSize: '10px', color: '#0f0', pointerEvents: 'none', zIndex: 100 }}>
          <p>🔧 DIAGNÓSTICO DO SISTEMA</p>
          <p>Socket.io: {isSocketConnected ? '✅ Conectado' : '❌ Desconectado'}</p>
          {socketError && <p style={{ color: '#f87171' }}>└─ Erro: {socketError}</p>}
          <p>WebCodecs: {isConnected ? '✅ Recebendo' : '⌛ Aguardando'}</p>
          <p>Telas ativas: {activeStreamers.length}</p>
          <p>Proxy: {import.meta.env.DEV ? 'Local' : 'Discord CDN'}</p>
        </div>
      </main>
    </div>
  );
};

export default App;
