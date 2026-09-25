import React, { useEffect, useRef, useState } from 'react';
import { socketService } from '../services/socket';

interface VideoGridProps {
  streamerId: string | null;
  channelId?: string;
}

export const WebCodecPlayer = ({ streamerId, channelId }: { streamerId: string, channelId: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const decoderRef = useRef<VideoDecoder | null>(null);
  const [status, setStatus] = useState<string>('Conectando...');

  useEffect(() => {
    let baseUrl = import.meta.env.VITE_SERVER_URL;
    if (!baseUrl) {
       baseUrl = window.location.origin;
    }
    const wsUrl = baseUrl.replace(/^http/, 'ws') + `/video-relay?channelId=${channelId}&role=viewer`;
    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer';

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
      setStatus('Aguardando vídeo...');
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
            setStatus(''); // Limpa o status
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

        const headerSize = 20 + 1 + 8;
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
        }
      }
    };

    const socketIo = socketService.getSocket();
    const onUserLeft = ({ socketId }: { socketId: string }) => {
      if (socketId === streamerId) {
        setStatus('Transmissão encerrada');
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
    <div className="tile" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        id="player"
        className="player"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      />
      {status && (
        <div style={{
          position: 'absolute', bottom: '20px', left: '20px',
          backgroundColor: 'rgba(0,0,0,0.7)', padding: '4px 8px',
          borderRadius: '4px', fontSize: '12px', color: '#fff',
          zIndex: 100
        }}>
          {status}
        </div>
      )}
    </div>
  );
};

export const VideoGrid: React.FC<VideoGridProps> = ({ streamerId, channelId = 'default-room' }) => {
  if (!streamerId) return null;
  return <WebCodecPlayer streamerId={streamerId} channelId={channelId} />;
};
