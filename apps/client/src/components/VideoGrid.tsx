import React, { useEffect, useRef, useState } from 'react';
import { socketService } from '../services/socket';

interface VideoGridProps {
  activeStreamers?: string[];
}

/**
 * Player WebCodecs — recebe config e chunks separadamente.
 * 
 * Fluxo:
 * 1. Recebe 'video-config' → configura o VideoDecoder
 * 2. Recebe 'video-chunk' → decodifica e pinta no canvas
 */
const WebCodecPlayer = ({ streamerId }: { streamerId: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const decoderRef = useRef<VideoDecoder | null>(null);
  const configuredRef = useRef(false);
  const [status, setStatus] = useState<string>('aguardando config...');

  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    // Criar o decoder
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

    // Handler para config (vem antes dos chunks)
    const onConfig = (payload: any) => {
      if (payload.from !== streamerId) return;
      if (decoder.state === 'closed') return;

      const decoderConfig: VideoDecoderConfig = {
        codec: payload.codec,
        codedWidth: payload.codedWidth,
        codedHeight: payload.codedHeight,
        optimizeForLatency: true,
      };

      // Se tiver description (H.264), decodificar de base64
      if (payload.description) {
        const bin = atob(payload.description);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        decoderConfig.description = bytes;
      }

      try {
        decoder.configure(decoderConfig);
        configuredRef.current = true;
        setStatus(`configurado: ${payload.codec} ${payload.codedWidth}x${payload.codedHeight}`);
      } catch (e: any) {
        console.error('[WebCodecPlayer] Configure failed:', e);
        setStatus(`codec não suportado: ${payload.codec}`);
      }
    };

    // Handler para chunks de vídeo
    const onChunk = (payload: any) => {
      if (payload.from !== streamerId) return;
      if (!decoderRef.current || decoderRef.current.state !== 'configured') return;

      try {
        const chunk = new EncodedVideoChunk({
          type: payload.type,        // 'key' ou 'delta'
          timestamp: payload.timestamp,
          data: payload.data,        // ArrayBuffer — Socket.io deserializa automaticamente
        });
        decoderRef.current.decode(chunk);
      } catch (e) {
        // Chunk corrompido ou fora de ordem — esperar o próximo keyframe
      }
    };

    const onUserLeft = ({ socketId }: { socketId: string }) => {
      if (socketId === streamerId) {
        setStatus('transmissão encerrada');
      }
    };

    socket.on('video-config', onConfig);
    socket.on('video-chunk', onChunk);
    socket.on('user-left', onUserLeft);
    socket.on('stream-stopped', onUserLeft);

    return () => {
      socket.off('video-config', onConfig);
      socket.off('video-chunk', onChunk);
      socket.off('user-left', onUserLeft);
      socket.off('stream-stopped', onUserLeft);
      configuredRef.current = false;
      if (decoder.state !== 'closed') {
        try { decoder.close(); } catch (e) {}
      }
    };
  }, [streamerId]);

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

export const VideoGrid: React.FC<VideoGridProps> = ({ activeStreamers = [] }) => {
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
            <WebCodecPlayer key={id} streamerId={id} />
          ))}
        </div>
      )}
    </div>
  );
};
