import React, { useEffect, useRef } from 'react';
import { socketService } from '../services/socket';

interface VideoGridProps {
  activeStreamers?: string[];
}

const WebCodecPlayer = ({ streamerId }: { streamerId: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const decoderRef = useRef<VideoDecoder | null>(null);

  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    decoderRef.current = new VideoDecoder({
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
      error: (e) => console.error('VideoDecoder error:', e),
    });

    const onChunk = (payload: any) => {
      if (payload.from !== streamerId || !decoderRef.current) return;

      if (payload.config && decoderRef.current.state === 'unconfigured') {
        decoderRef.current.configure({
          codec: 'vp8',
          optimizeForLatency: true,
          ...payload.config,
        });
      }

      if (decoderRef.current.state === 'configured') {
        try {
          decoderRef.current.decode(new EncodedVideoChunk({
            type: payload.type,
            timestamp: payload.timestamp,
            data: payload.data
          }));
        } catch (e) {
          console.warn('Decode falhou, aguardando próximo frame');
        }
      }
    };

    socket.on('video-chunk', onChunk);

    return () => {
      socket.off('video-chunk', onChunk);
      if (decoderRef.current && decoderRef.current.state !== 'closed') {
        try { decoderRef.current.close(); } catch (e) {}
      }
    };
  }, [streamerId]);

  return (
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
