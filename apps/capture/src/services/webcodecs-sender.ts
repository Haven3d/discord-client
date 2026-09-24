import { Socket } from 'socket.io-client';

/**
 * WebCodecs Sender — Codifica frames de vídeo e envia via Socket.io.
 * 
 * Baseado na arquitetura do discord-screen (Jc007zZ):
 * - Usa VP8 que não precisa de decoderConfig.description
 * - Envia config separada (JSON) e chunks como ArrayBuffer
 * - Keyframe periódico para quem entra na sala depois
 */
export class WebCodecsSender {
  private socket: Socket;
  private channelId: string;
  private encoder: VideoEncoder | null = null;
  private reader: any = null;
  private isRunning: boolean = false;
  private configSent: boolean = false;

  constructor(socket: Socket, channelId: string) {
    this.socket = socket;
    this.channelId = channelId;
  }

  public async start(stream: MediaStream, bitrate: number) {
    this.isRunning = true;
    this.configSent = false;
    const track = stream.getVideoTracks()[0];
    if (!track) return;

    const trackSettings = track.getSettings();
    const width = trackSettings.width || 1280;
    const height = trackSettings.height || 720;
    const fps = trackSettings.frameRate || 30;

    // Criar o codificador de vídeo
    this.encoder = new VideoEncoder({
      output: (chunk, meta) => this.onEncoded(chunk, meta),
      error: (e) => console.error('[WebCodecsSender] Encoder error:', e)
    });

    // Configurar VP8 — extremamente leve e sem necessidade de description blob
    const config: VideoEncoderConfig = {
      codec: 'vp8',
      width,
      height,
      bitrate,
      framerate: fps,
      latencyMode: 'realtime',
    };

    this.encoder.configure(config);

    // Enviar config para o decoder do outro lado ANTES dos chunks
    this.socket.emit('video-config', {
      channelId: this.channelId,
      codec: 'vp8',
      codedWidth: width,
      codedHeight: height,
    });

    // Puxar os frames crus direto da câmera/tela
    const MSTP = (window as any).MediaStreamTrackProcessor;
    this.reader = new MSTP({ track }).readable.getReader();

    this.readFrames(fps);
  }

  private onEncoded(chunk: EncodedVideoChunk, meta: EncodedVideoChunkMetadata | undefined) {
    if (!this.isRunning || !this.socket.connected) return;

    // Se o codec entregar um decoderConfig (H.264 faz isso), manda separado
    if (meta?.decoderConfig && !this.configSent) {
      const dc = meta.decoderConfig;
      const configMsg: any = {
        channelId: this.channelId,
        codec: dc.codec,
        codedWidth: dc.codedWidth,
        codedHeight: dc.codedHeight,
      };
      // description é um ArrayBuffer (só H.264 usa)
      if (dc.description) {
        const descBytes = new Uint8Array(dc.description as ArrayBuffer);
        configMsg.description = btoa(String.fromCharCode(...descBytes));
      }
      this.socket.emit('video-config', configMsg);
      this.configSent = true;
    }

    // Extrair os bytes codificados
    const data = new ArrayBuffer(chunk.byteLength);
    chunk.copyTo(data);

    // Enviar como ArrayBuffer puro — Socket.io 4.x suporta binary natively
    this.socket.emit('video-chunk', {
      channelId: this.channelId,
      type: chunk.type,       // 'key' ou 'delta'
      timestamp: chunk.timestamp,
      data: data,             // ArrayBuffer — Socket.io envia como binary attachment
    });
  }

  private async readFrames(fps: number) {
    if (!this.reader) return;

    const keyframeInterval = Math.max(fps, 30); // keyframe a cada ~1 segundo
    let frameCount = 0;

    while (this.isRunning) {
      try {
        const { done, value: frame } = await this.reader.read();
        if (done || !frame) break;
        
        if (this.encoder?.state === 'configured') {
          const isKeyFrame = frameCount % keyframeInterval === 0;
          this.encoder.encode(frame, { keyFrame: isKeyFrame });
          frameCount++;
        }
        
        frame.close();
      } catch (e) {
        break;
      }
    }
  }

  public stop() {
    this.isRunning = false;
    
    if (this.reader) {
      this.reader.cancel().catch(() => {});
      this.reader = null;
    }
    
    if (this.encoder && this.encoder.state !== 'closed') {
      try { this.encoder.close(); } catch (e) {}
      this.encoder = null;
    }
  }
}
