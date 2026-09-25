import React, { useEffect, useState } from 'react';
import { useDiscordSdk } from './hooks/useDiscordSdk';
import { useWebCodecs } from './hooks/useWebCodecs';
import { VideoGrid } from './components/VideoGrid';
import { StartButton } from './components/StartButton';
import { socketService, connectSocket, disconnectSocket } from './services/socket';
import './styles/global.css';

const App: React.FC = () => {
  const isInsideDiscord = false; // Dev override

  const { auth, channelId, discordSdk, isReady, error } = useDiscordSdk();
  const { activeStreamers } = useWebCodecs();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (!isInsideDiscord && !socketService.getSocket()) {
      connectSocket({ room: 'default-room', uid: 'dev-user', name: 'Dev User', role: 'viewer' });
    }
  }, [isInsideDiscord]);

  useEffect(() => {
    if (isReady && auth && channelId) {
      const viewerPayload = {
        room: channelId,
        uid: auth.id,
        name: auth.username,
        role: 'viewer'
      };
      
      connectSocket(viewerPayload);

      return () => {
        disconnectSocket();
      };
    }
  }, [isReady, auth, channelId]);

  if (error && isInsideDiscord) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: '20px', textAlign: 'center' }}>
        <p style={{ color: '#ef4444', fontSize: '16px' }}>
          Erro: {error.message}
          <br /><br />
          <small>Abra este link por dentro do Discord (como uma Activity) ou mude isInsideDiscord para false no App.tsx para testar o layout.</small>
        </p>
      </div>
    );
  }

  if (!isInsideDiscord && false) {
     // ignoring old branch
  }

  const handleShareClick = async () => {
    const captureUrl = import.meta.env.VITE_CAPTURE_URL || 'http://localhost:5174';
    const room = channelId || 'default-room';
    
    const fakeToken = btoa(unescape(encodeURIComponent(JSON.stringify({ 
      room, 
      uid: auth?.id || 'dev-user', 
      name: auth?.username || 'Dev User', 
      role: 'broadcaster' 
    }))));

    const fullUrl = captureUrl + '?t=' + fakeToken;
    
    if (window.parent !== window && discordSdk) {
      try {
        await discordSdk.ready();
        discordSdk.commands.openExternalLink({ url: fullUrl });
      } catch (e) {
        console.error("Falha ao abrir link pelo SDK:", e);
      }
    } else {
      window.open(fullUrl, '_blank');
    }
  };

  const currentUserId = auth?.id || 'dev-user';
  const isBroadcasting = activeStreamers.includes(currentUserId);
  const otherStreamers = activeStreamers.filter(id => id !== currentUserId);

  return (
    <div id="app" className="flutua palco">
      <div className="topbar">
        <div className="topbar-left">
          <div className="topbar-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src="/haven-logo.png" alt="HAVEN" style={{ height: '24px', width: 'auto', objectFit: 'contain' }} />
              <span style={{ fontWeight: 700, fontSize: '18px', letterSpacing: '-0.05em', color: 'var(--text)' }}>HAVEN</span>
            </div>
          </div>
        </div>
        {isBroadcasting && (
          <div style={{ display: 'flex', alignItems: 'center', marginRight: '16px' }}>
             <span style={{ background: '#35373d', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, color: 'var(--accent)' }}>você</span>
          </div>
        )}
      </div>

      <div className="shell">
        <div id="mediaWrap" className="media-wrap live">
          {isBroadcasting ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '10px' }}>
              <button className="btn go" onClick={handleShareClick} style={{ padding: '0 20px', borderRadius: '999px', height: '46px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', border: 'none' }}>
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 5h18v11H3z" />
                  <path d="M8 20h8" />
                </svg>
                Ver minha tela
              </button>
              <p className="muted" style={{ margin: 0, fontSize: '14px', color: 'var(--muted)' }}>
                Sua transmissão está no ar
              </p>
            </div>
          ) : otherStreamers.length > 0 ? (
            <VideoGrid activeStreamers={otherStreamers} channelId={channelId || 'default-room'} />
          ) : (
            <p id="emptyText" className="muted">Nenhuma transmissão ativa. Seja o primeiro a compartilhar.</p>
          )}
        </div>

        <div className="bottombar">
          <div className="dock">
            <div className="group">
              <button id="share" className="btn" data-tip="Compartilhar tela" aria-label="Compartilhar tela" onClick={handleShareClick}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 5h18v11H3z" />
                  <path d="M8 20h8" />
                </svg>
              </button>
              <button id="camera" className="btn" data-tip="Ligar câmera" aria-label="Ligar câmera" disabled style={{ opacity: 0.5 }}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M23 7l-7 5 7 5V7z" />
                  <rect x="1" y="5" width="15" height="14" rx="2" />
                </svg>
              </button>
            </div>

            <div className="group">
              <div id="volumeBox" className="volume">
                <button id="mute" className="btn" data-tip={isMuted ? "Desmutar" : "Silenciar"} aria-label="Silenciar" onClick={() => setIsMuted(!isMuted)}>
                  {isMuted ? (
                    <svg id="muteOff" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M11 5 6 9H2v6h4l5 4V5z" />
                      <path d="M22 9l-6 6M16 9l6 6" />
                    </svg>
                  ) : (
                    <svg id="muteOn" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M11 5 6 9H2v6h4l5 4V5z" />
                      <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" />
                    </svg>
                  )}
                </button>

                <div className="volume-pop">
                  <span id="volumeVal" className="volume-val">{volume}%</span>
                  <input
                    id="volume"
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    aria-label="Volume"
                  />
                </div>
              </div>

              <button id="fullscreen" className="btn" data-tip="Tela cheia" aria-label="Tela cheia" onClick={() => setIsFullscreen(!isFullscreen)}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
