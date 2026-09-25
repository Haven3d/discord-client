import { useState, useEffect, useRef } from 'react';
import socket, { connectSocket, disconnectSocket } from './services/socket';
import { WebCodecsSender } from './services/webcodecs-sender';
import { QualityPreset, QUALITY_PRESETS, startScreenCapture, stopCapture } from './services/media-capture';
import './styles/global.css';

function App() {
  const [error, setError] = useState<string | null>(null);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  
  // Use state with indices or match with presets
  const [qualityPresetIndex, setQualityPresetIndex] = useState<number>(2); // 2.5 Mbps
  const [fps, setFps] = useState<number>(30);
  
  const webcodecsSenderRef = useRef<WebCodecsSender | null>(null);
  const [viewers, setViewers] = useState(0);
  const [room, setRoom] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [elapsed, setElapsed] = useState(0);
  
  useEffect(() => {
    let interval: any;
    if (isStreaming) {
      interval = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [isStreaming]);

  const formatElapsed = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const getBitrateDisplay = () => {
    const preset = QUALITY_PRESETS[qualityPresetIndex];
    if (!preset) return '0 Mbps';
    return `${(preset.bitrate / 1000000).toFixed(1)} Mb/s`;
  };

  useEffect(() => {
    if (videoRef.current && screenStream) {
      videoRef.current.srcObject = screenStream;
    }
  }, [screenStream, isStreaming]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenBase64 = params.get('t');
    const channelId = params.get('channelId');

    let sessionData: any = null;

    if (tokenBase64) {
      try {
        sessionData = JSON.parse(decodeURIComponent(escape(atob(tokenBase64))));
      } catch (e) {
        setError('Token corrompido ou formato inválido.');
        return;
      }
    } else if (channelId && import.meta.env.DEV) {
      sessionData = { room: channelId, uid: 'dev-user', name: 'Dev User', role: 'broadcaster' };
    } else {
      setError('Sessão inválida. O link de transmissǜo requer um token.');
      return;
    }

    try {
      setRoom(sessionData.room);
      webcodecsSenderRef.current = new WebCodecsSender(socket, sessionData.room);
      connectSocket(sessionData);

      const onRoomParticipants = (participants: any[]) => {
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
  }, []);

  const handleStartCapture = async () => {
    try {
      const preset = QUALITY_PRESETS[qualityPresetIndex];
      const presetWithFps = { ...preset, fps };
      const stream = await startScreenCapture(presetWithFps);
      setScreenStream(stream);
      setIsStreaming(true);
      
      if (webcodecsSenderRef.current) {
        webcodecsSenderRef.current.start(stream, preset.bitrate);
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
    
    if (webcodecsSenderRef.current) {
       webcodecsSenderRef.current.stop();
    }
  };

  const toggleTheme = () => {
    const doc = document.documentElement;
    const active = doc.getAttribute('data-theme') || 'dark';
    const next = active === 'light' ? 'dark' : 'light';
    doc.setAttribute('data-theme', next);
    localStorage.setItem('haven-theme', next);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('haven-theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  if (error) {
    return <div style={{ padding: 20, color: 'var(--danger)', textAlign: 'center' }}>{error}</div>;
  }

  return (
    <div className="shell">
      <header className="top-nav">
        <div className="brand-wrap">
          <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/haven-logo.png" alt="HAVEN" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
            <span style={{ fontWeight: 700, fontSize: '24px', letterSpacing: '-0.05em', color: 'var(--c-logo-text)' }}>HAVEN</span>
          </div>
        </div>
        <div className="top-actions">
            <button id="themeToggle" type="button" className="btn-theme" title="Alternar tema" onClick={toggleTheme}>
              <svg className="theme-icon-moon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
              <svg className="theme-icon-sun" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'none' }}>
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            </button>
          </div>
      </header>

      <main className="card">
        <div className="card-head">
            <div className="card-title-wrap">
              <h1>Painel de Transmissão</h1>
              <div className="card-tag">Painel HAVEN</div>
            </div>
          </div>

          <div className="fontes">
            <section className="bloco">
              <h2>Tela</h2>

              <div className="ajustes">
                <label>
                  Qualidade
                  <select 
                    value={qualityPresetIndex} 
                    onChange={e => setQualityPresetIndex(Number(e.target.value))}
                    disabled={isStreaming}
                  >
                    {QUALITY_PRESETS.map((p, i) => (
                      <option key={i} value={i}>{p.name} ({(p.bitrate/1000000).toFixed(1)} Mbps)</option>
                    ))}
                  </select>
                </label>
                <label>
                  Quadros
                  <select value={fps} onChange={e => setFps(Number(e.target.value))} disabled={isStreaming}>
                    <option value={15}>15 fps</option>
                    <option value={30}>30 fps</option>
                    <option value={60}>60 fps</option>
                  </select>
                </label>
              </div>

              {!isStreaming ? (
                <div id="tela-setup">
                  <div className="sem-preview">Sem preview</div>
                  <p className="note">Marque "Compartilhar o áudio" na janela do navegador para transmitir o som.</p>
                  <div className="acao">
                    <button className="primary" onClick={handleStartCapture}>Escolher tela e transmitir</button>
                  </div>
                </div>
              ) : (
                <div id="tela-live">
                  <div className="live-badge"><span className="dot"></span> No ar</div>
                  <video ref={videoRef} autoPlay playsInline muted></video>
                  <div className="stats">
                    <div><strong>{viewers}</strong><span>assistindo</span></div>
                    <div><strong>{fps} fps</strong><span>quadros</span></div>
                    <div><strong>{getBitrateDisplay()}</strong><span>enviando</span></div>
                    <div><strong>{formatElapsed(elapsed)}</strong><span>no ar</span></div>
                  </div>
                  <button className="danger" onClick={handleStopCapture}>Parar de transmitir a tela</button>
                </div>
              )}
            </section>

            <section className="bloco">
              <h2>Câmera (Em Breve)</h2>
              <div id="camera-setup">
                <div className="sem-preview">Sem preview</div>
                <div className="acao">
                  <button className="primary" disabled style={{ opacity: 0.5 }}>Câmera indisponível</button>
                </div>
              </div>
            </section>
          </div>

          <footer>
            <p>Mantenha esta aba aberta enquanto transmite. O Discord continuarǭ exibindo sua transmissǜo normalmente.</p>
            <div className="card-wpp-help">
              <span>Precisa de ajuda para transmitir?</span>
              <a href="https://wa.me/5571988612495?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20para%20transmitir%20minha%20tela!" target="_blank" rel="noopener noreferrer">
                Falar no WhatsApp
              </a>
            </div>
          </footer>
      </main>

      <div className="wpp-float-container">
        <div className="wpp-float-popup" id="wppPopup">
          <span className="wpp-popup-tag">Ajuda WhatsApp</span>
          <p className="wpp-popup-text">Precisa de ajuda para transmitir? Fale comigo!</p>
        </div>
        <a href="https://wa.me/5571988612495?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20para%20transmitir%20minha%20tela!" target="_blank" rel="noopener noreferrer" className="wpp-float-btn" title="Falar com suporte no WhatsApp" aria-label="Falar com suporte no WhatsApp">
          <span className="wpp-radar"></span>
          <svg className="wpp-float-icon" viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.34C9.36 7.34 9.08 7.41 8.84 7.67C8.6 7.93 7.93 8.55 7.93 9.82C7.93 11.09 8.86 12.31 9 12.48C9.13 12.65 10.79 15.36 13.42 16.39C15.61 17.25 16.05 17.08 16.53 17.03C17 16.99 18.06 16.41 18.28 15.79C18.5 15.17 18.5 14.64 18.43 14.53C18.37 14.42 18.2 14.35 17.94 14.22C17.68 14.09 16.42 13.47 16.18 13.38C15.95 13.29 15.78 13.25 15.61 13.51C15.44 13.77 14.95 14.35 14.8 14.53C14.66 14.7 14.51 14.72 14.25 14.6C13.99 14.47 12.9 14.11 11.61 12.96C10.6 12.06 9.93 10.95 9.8 10.73C9.67 10.51 9.79 10.39 9.92 10.26C10.04 10.14 10.18 9.96 10.31 9.81C10.45 9.66 10.5 9.55 10.59 9.38C10.68 9.21 10.63 9.06 10.57 8.93C10.5 8.8 10.04 7.67 9.84 7.21C9.65 6.76 9.46 6.82 9.32 6.81C9.19 6.81 9.02 6.81 8.85 6.81L9.53 7.34Z"></path>
          </svg>
        </a>
      </div>
    </div>
  );
}

export default App;
