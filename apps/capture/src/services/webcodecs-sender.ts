import { Socket } from 'socket.io-client';

export class WebCodecsSender {
  private socket: Socket;
  private channelId: string;
  private encoder: VideoEncoder | null = null;
  private processor: any = null;
  private reader: any = null;
  private isRunning: boolean = false;

  constructor(socket: Socket, channelId: string) {
    this.socket = socket;
    this.channelId = channelId;
  }

  public async start(stream: MediaStream, bitrate: number) {
    this.isRunning = true;
    const track = stream.getVideoTracks()[0];
    if (!track) return;

    // Criar o codificador de vídeo
    this.encoder = new VideoEncoder({
      output: (chunk, meta) => {
        if (!this.isRunning) return;
        
        const data = new Uint8Array(chunk.byteLength);
        chunk.copyTo(data);

        this.socket.emit('video-chunk', {
          channelId: this.channelId,
          type: chunk.type,
          timestamp: chunk.timestamp,
          data: data, // ArrayBuffer nativo
          config: meta?.decoderConfig // Mandar a configuração sempre que for um keyframe novo
        });
      },
      error: (e) => console.error('Erro no WebCodecs Encoder:', e)
    });

    const trackSettings = track.getSettings();
    const width = trackSettings.width || 1280;
    const height = trackSettings.height || 720;
    const fps = trackSettings.frameRate || 30;

    // Configurar VP8, que é extremamente leve e compatível com todos os Chromium
    this.encoder.configure({
      codec: 'vp8',
      width: width,
      height: height,
      bitrate: bitrate,
      framerate: fps,
      latencyMode: 'realtime' // O segredo da baixa latência
    });

    // Puxar os frames crus direto da câmera/tela
    const MSTP = (window as any).MediaStreamTrackProcessor;
    this.processor = new MSTP({ track });
    this.reader = this.processor.readable.getReader();

    this.readFrames();
  }

  private async readFrames() {
    if (!this.reader) return;

    let frameCount = 0;
    while (this.isRunning) {
      try {
        const { done, value: frame } = await this.reader.read();
        if (done || !frame) break;
        
        if (this.encoder?.state === 'configured') {
          // Exigir um Keyframe (foto completa) a cada segundo para quem acabar de entrar na sala não ficar com a tela cinza
          const isKeyFrame = frameCount % 30 === 0;
          this.encoder.encode(frame, { keyFrame: isKeyFrame });
          frameCount++;
        }
        
        frame.close(); // Limpar a memória do quadro
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
      try {
        this.encoder.close();
      } catch (e) {}
      this.encoder = null;
    }
  }
}
