import { Socket } from 'socket.io-client';

/**
 * WebCodecs Sender — Codifica frames de vídeo e envia via WebSocket Puro.
 */
export class WebCodecsSender {
  private socketIo: Socket;
  private channelId: string;
  private encoder: VideoEncoder | null = null;
  private reader: any = null;
  private isRunning: boolean = false;
  
  // Conexão WebSocket pura apenas para vídeo
  private videoWs: WebSocket | null = null;

  constructor(socketIo: Socket, channelId: string) {
    this.socketIo = socketIo;
    this.channelId = channelId;
  }

  public async start(stream: MediaStream, bitrate: number) {
    this.isRunning = true;

    // 1. Conectar no WebSocket Puro
    const wsUrl = import.meta.env.VITE_SERVER_URL.replace(/^http/, 'ws') + `/video-relay?channelId=${this.channelId}&role=broadcaster&socketId=${this.socketIo.id}`;
    this.videoWs = new WebSocket(wsUrl);

    this.videoWs.onopen = () => {
      console.log('[WebCodecsSender] WebSocket puro de vídeo conectado!');
      this.initVideoPipeline(stream, bitrate);
    };
    
    this.videoWs.onerror = (e) => {
      console.error('[WebCodecsSender] Erro no WebSocket de vídeo:', e);
    };
  }

  private initVideoPipeline(stream: MediaStream, bitrate: number) {
    const track = stream.getVideoTracks()[0];
    if (!track) return;

    const trackSettings = track.getSettings();
    const width = trackSettings.width || 1280;
    const height = trackSettings.height || 720;
    const fps = trackSettings.frameRate || 30;

    // 2. Avisar a sala via Socket.io que vamos iniciar o streaming (Sinalização)
    this.socketIo.emit('start-stream', { channelId: this.channelId });

    // Criar o codificador de vídeo
    this.encoder = new VideoEncoder({
      output: (chunk, meta) => this.onEncoded(chunk, meta),
      error: (e) => console.error('[WebCodecsSender] Encoder error:', e)
    });

    const config: VideoEncoderConfig = {
      codec: 'vp8',
      width,
      height,
      bitrate,
      framerate: fps,
      latencyMode: 'realtime',
    };

    this.encoder.configure(config);

    // Enviar a configuração inicial pelo próprio WebSocket de Vídeo usando JSON
    // Prefixamos a string JSON com 'C|' para identificar que é config
    const configMsg = JSON.stringify({
      type: 'config',
      codec: 'vp8',
      codedWidth: width,
      codedHeight: height,
    });
    if (this.videoWs?.readyState === WebSocket.OPEN) {
      this.videoWs.send('C|' + configMsg);
    }

    const MSTP = (window as any).MediaStreamTrackProcessor;
    this.reader = new MSTP({ track }).readable.getReader();

    this.readFrames(fps);
  }

  private onEncoded(chunk: EncodedVideoChunk, _meta: EncodedVideoChunkMetadata | undefined) {
    if (!this.isRunning || this.videoWs?.readyState !== WebSocket.OPEN) return;

    // Extrair os bytes codificados
    const data = new ArrayBuffer(chunk.byteLength);
    chunk.copyTo(data);

    // Formato do buffer binário:
    // [1 byte: Tipo (0 = Keyframe, 1 = Delta)] [8 bytes: Timestamp Float64] [N bytes: Payload de Vídeo]
    const headerSize = 1 + 8;
    const buf = new ArrayBuffer(headerSize + data.byteLength);
    const view = new DataView(buf);
    
    view.setUint8(0, chunk.type === 'key' ? 0 : 1);
    view.setFloat64(1, chunk.timestamp, true);
    
    new Uint8Array(buf, headerSize).set(new Uint8Array(data));

    // Envia o ArrayBuffer cru pelo WebSocket puro
    this.videoWs.send(buf);
  }

  private async readFrames(fps: number) {
    if (!this.reader) return;

    const keyframeInterval = Math.max(fps, 30);
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

    if (this.videoWs) {
      this.videoWs.close();
      this.videoWs = null;
    }

    this.socketIo.emit('stop-stream', { channelId: this.channelId });
  }
}
