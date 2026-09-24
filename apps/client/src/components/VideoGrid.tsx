import React, { useEffect, useRef, useState } from 'react';
import { socketService } from '../services/socket';

interface VideoGridProps {
  activeStreamers?: string[];
  channelId?: string;
}

/**
 * Player WebCodecs usando WebSocket Puro.
 */
const WebCodecPlayer = ({ streamerId, channelId }: { streamerId: string, channelId: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const decoderRef = useRef<VideoDecoder | null>(null);
  const [status, setStatus] = useState<string>('conectando WS puro...');
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // 1. Conectar ao WebSocket puro como viewer
    // (Em prod o SERVER_URL pode estar vazio e ser resolvido via proxy)
    let baseUrl = import.meta.env.VITE_SERVER_URL;
    if (!baseUrl) {
       baseUrl = window.location.origin; // O proxy resolve relative
    }
    const wsUrl = baseUrl.replace(/^http/, 'ws') + `/video-relay?channelId=${channelId}&role=viewer`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.binaryType = 'arraybuffer'; // Queremos os buffers crus

    const decoder = new VideoDecoder({
      output: (frame) => {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            if (canvas.width !== frame.displayWidth || canvas.height !== frame.displayHeight) {
              canvas.width = frame.displayWidth;
              canvas.height = frame.displayHeight;
            }
            ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
          }
        }
        frame.close();
      },
      error: (e) => {
        console.error('[WebCodecPlayer] Decoder error:', e);
        setStatus(`erro: ${e.message}`);
      },
    });
    decoderRef.current = decoder;

    ws.onopen = () => {
      setStatus('ws conectado, aguardando vídeo...');
    };

    ws.onmessage = (event) => {
      if (typeof event.data === 'string') {
        const parts = event.data.split('|');
        if (parts.length < 2) return;
        const sid = parts[0].trim();
        if (sid !== streamerId) return;

        const payloadStr = event.data.substring(parts[0].length + 1);
        if (payloadStr.startsWith('C|')) {
          const configJson = payloadStr.substring(2);
          try {
            const payload = JSON.parse(configJson);
            if (decoder.state === 'closed') return;
            decoder.configure({
              codec: payload.codec,
              codedWidth: payload.codedWidth,
              codedHeight: payload.codedHeight,
              optimizeForLatency: true,
            });
            setStatus(`codec: ${payload.codec} ${payload.codedWidth}x${payload.codedHeight}`);
          } catch (e) {
            console.error('[WebCodecPlayer] Configure failed:', e);
          }
        }
        return;
      }

      if (event.data instanceof ArrayBuffer) {
        if (!decoderRef.current || decoderRef.current.state !== 'configured') return;
        
        const buf = event.data;
        if (buf.byteLength < 20) return;

        const decoderView = new DataView(buf);
        let sidBuf = '';
        for (let i = 0; i < 20; i++) sidBuf += String.fromCharCode(decoderView.getUint8(i));
        const sid = sidBuf.trim();

        if (sid !== streamerId) return;

        const headerSize = 20 + 1 + 8; // 20 ID + 1 Tipo + 8 TS
        if (buf.byteLength < headerSize) return;

        const type = decoderView.getUint8(20) === 0 ? 'key' : 'delta';
        const timestamp = decoderView.getFloat64(21, true);
        const videoData = new Uint8Array(buf, headerSize);

        try {
          const chunk = new EncodedVideoChunk({
            type,
            timestamp,
            data: videoData,
          });
          decoderRef.current.decode(chunk);
        } catch (e) {
          // Chunk descartado, espera próximo keyframe
        }
      }
    };

    // Usar o Socket.io (sinalização) para saber se ele saiu da sala
    const socketIo = socketService.getSocket();
    const onUserLeft = ({ socketId }: { socketId: string }) => {
      if (socketId === streamerId) {
        setStatus('transmissão encerrada');
      }
    };
    if (socketIo) {
      socketIo.on('user-left', onUserLeft);
      socketIo.on('stream-stopped', onUserLeft);
    }

    return () => {
      ws.close();
      if (socketIo) {
        socketIo.off('user-left', onUserLeft);
        socketIo.off('stream-stopped', onUserLeft);
      }
      if (decoder.state !== 'closed') {
        try { decoder.close(); } catch (e) {}
      }
    };
  }, [streamerId, channelId]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          backgroundColor: '#000',
          borderRadius: '8px'
        }}
      />
      <div style={{
        position: 'absolute', bottom: '8px', left: '8px',
        backgroundColor: 'rgba(0,0,0,0.7)', padding: '4px 8px',
        borderRadius: '4px', fontSize: '10px', color: '#0f0',
      }}>
        {status}
      </div>
    </div>
  );
};

export const VideoGrid: React.FC<VideoGridProps> = ({ activeStreamers = [], channelId = 'default-room' }) => {

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      {activeStreamers.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '40px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', backgroundColor: 'rgba(255, 140, 0, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
            </div>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>Nenhuma transmissão ativa</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>Seja o primeiro a compartilhar sua tela com o grupo.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', width: '100%', height: '100%' }}>
          {activeStreamers.map((id) => (
            <WebCodecPlayer key={id} streamerId={id} channelId={channelId} />
          ))}
        </div>
      )}
    </div>
  );
};
