import React, { useEffect, useState } from 'react';
import { useDiscordSdk } from './hooks/useDiscordSdk';
import { useWebCodecs } from './hooks/useWebCodecs';
import { VideoGrid } from './components/VideoGrid';
import { StartButton } from './components/StartButton';
import { socketService, connectSocket, disconnectSocket } from './services/socket';
import './styles/global.css';

const App: React.FC = () => {
  // Lê do painel de controle se a autenticação estrita do Discord é exigida
  const isInsideDiscord = import.meta.env.VITE_REQUIRE_DISCORD_AUTH === 'true'; 

  const { auth, channelId, discordSdk, isReady, error } = useDiscordSdk();
  const { activeStreamers } = useWebCodecs();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [watchingStreamerId, setWatchingStreamerId] = useState<string | null>(null);

  useEffect(() => {
    if (watchingStreamerId && !activeStreamers.includes(watchingStreamerId)) {
      setWatchingStreamerId(null);
    }
  }, [watchingStreamerId, activeStreamers]);

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
  
  // Exibir a própria transmissão na lista para espelho, e a tag 'você' no topo:
  const isBroadcasting = activeStreamers.includes(currentUserId);
  const allStreamers = activeStreamers;

  return (
    <div id="app">
      <div className="topbar">
        <div className="topbar-left">
          <div className="topbar-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src="/haven-logo.png" alt="HAVEN" style={{ height: '24px', width: 'auto', objectFit: 'contain' }} />
                <span style={{ fontWeight: 700, fontSize: '18px', letterSpacing: '-0.05em', color: 'var(--text)' }}>HAVEN</span>
              </div>
              <div className="pill room-pill">
                Sala de call
              </div>
            </div>
          </div>
        </div>
        {isBroadcasting && (
          <div style={{ display: 'flex', alignItems: 'center', marginRight: '16px' }}>
             <span style={{ background: '#35373d', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, color: 'var(--accent)' }}>você</span>
          </div>
        )}
      </div>

      {allStreamers.length > 0 ? (
        <main id="grid" className="grid palco" style={{ flex: 1, minHeight: 0, position: 'relative' }}>
          
          <div className="tile" style={{ width: '100%', height: '100%', position: 'relative' }}>
            {watchingStreamerId ? (
              <VideoGrid streamerId={watchingStreamerId} channelId={channelId || 'default-room'} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '10px' }}>
                <button className="btn go" onClick={() => setWatchingStreamerId(allStreamers[0])} style={{ padding: '0 20px', borderRadius: '999px', height: '46px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', border: 'none' }}>
                  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                  Assistir tela
                </button>
                <p className="muted" style={{ margin: 0, fontSize: '14px', color: 'var(--muted)' }}>
                  HAVEN 3D - {allStreamers[0] === 'dev-user' ? 'Dev User' : 'Usuário'} está transmitindo
                </p>
              </div>
            )}
          </div>

          <div className="divider" style={{ width: '1px', background: 'var(--line-subtle, rgba(255,255,255,0.09))' }}></div>
          
          <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', overflowY: 'auto' }}>
            <div className="sidebar-count" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '999px', background: 'var(--tile)', color: 'var(--muted)', fontSize: '12px', fontWeight: 500, alignSelf: 'flex-start' }}>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.85 }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              {allStreamers.length}
            </div>
            
            {allStreamers.map(id => (
              <div key={id} className="tile" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--tile)', borderRadius: '8px', marginTop: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                  {(id === 'dev-user' ? 'DU' : 'US')}
                </div>
                <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    HAVEN 3D - {id === 'dev-user' ? 'Dev User' : 'Usuário'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)' }}></span>
                    Transmitindo
                  </div>
                </div>
                {watchingStreamerId !== id && (
                  <button className="btn" onClick={() => setWatchingStreamerId(id)} style={{ padding: '4px 10px', height: 'auto', minWidth: 0, minHeight: '32px', fontSize: '12px' }}>
                    Assistir
                  </button>
                )}
              </div>
            ))}
          </aside>
        </main>
      ) : (
        <div id="empty" className="empty">
          <div className="icon" style={{ fontSize: '48px', opacity: 0.5 }}>👀</div>
          <p id="emptyText" className="muted" style={{ marginTop: '12px' }}>Nenhuma transmissão ativa.</p>
        </div>
      )}

        {!isBroadcasting && (
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

                <button id="fullscreen" className="btn" data-tip="Tela cheia" aria-label="Tela cheia" onClick={() => {
                  if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch((err) => {
                      console.log(`Erro ao tentar tela cheia: ${err.message}`);
                    });
                  } else {
                    document.exitFullscreen();
                  }
                }}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default App;
