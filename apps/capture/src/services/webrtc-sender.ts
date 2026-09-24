import { Socket } from 'socket.io-client';
import { sendOffer, sendIceCandidate } from './socket';

export class WebRTCSender {
  private socket: Socket;
  // private channelId: string;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private bitrate: number = 3600000;
  
  private iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ];

  constructor(socket: Socket, _channelId: string) {
    this.socket = socket;
    // this.channelId = channelId;
    this.setupSocketListeners();
  }

  public setLocalStream(stream: MediaStream, bitrate: number) {
    this.localStream = stream;
    this.bitrate = bitrate;
    this.peerConnections.forEach((pc) => {
      stream.getTracks().forEach(track => {
        const senders = pc.getSenders();
        const existingSender = senders.find(s => s.track && s.track.kind === track.kind);
        if (existingSender) {
          existingSender.replaceTrack(track);
        } else {
          pc.addTrack(track, stream);
        }
      });
    });
  }

  private setupSocketListeners() {
    this.socket.on('room-participants', async (participants: { socketId: string }[]) => {
      for (const p of participants) {
        if (p.socketId !== this.socket.id && !this.peerConnections.has(p.socketId)) {
          await this.createPeerConnection(p.socketId);
        }
      }
    });

    this.socket.on('user-joined', async ({ socketId }) => {
      await this.createPeerConnection(socketId);
    });

    this.socket.on('answer', async ({ from, answer }) => {
      await this.handleAnswer(from, answer);
    });

    this.socket.on('ice-candidate', async ({ from, candidate }) => {
      await this.handleIceCandidate(from, candidate);
    });

    this.socket.on('user-left', ({ socketId }) => {
      this.removePeer(socketId);
    });
  }

  private async createPeerConnection(viewerId: string) {
    const pc = new RTCPeerConnection({ iceServers: this.iceServers });
    this.peerConnections.set(viewerId, pc);

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream!);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendIceCandidate(viewerId, event.candidate);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`Connection state for ${viewerId}: ${pc.connectionState}`);
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.removePeer(viewerId);
      }
    };

    pc.onnegotiationneeded = async () => {
      try {
        const offer = await pc.createOffer();
        offer.sdp = this.mungeSDP(offer.sdp || '', this.bitrate);
        await pc.setLocalDescription(offer);
        sendOffer(viewerId, pc.localDescription!);
      } catch (error) {
        console.error('Error during renegotiation:', error);
      }
    };

    // O evento pc.onnegotiationneeded cria a oferta automaticamente!
    return pc;
  }

  private async handleAnswer(viewerId: string, answer: RTCSessionDescriptionInit) {
    const pc = this.peerConnections.get(viewerId);
    if (pc) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (error) {
        console.error('Error setting remote description:', error);
      }
    }
  }

  private async handleIceCandidate(viewerId: string, candidate: RTCIceCandidateInit) {
    const pc = this.peerConnections.get(viewerId);
    if (pc) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Error adding ice candidate:', error);
      }
    }
  }

  public removePeer(viewerId: string) {
    const pc = this.peerConnections.get(viewerId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(viewerId);
    }
  }

  public closeAll() {
    this.peerConnections.forEach(pc => pc.close());
    this.peerConnections.clear();
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
    this.socket.off('room-participants');
    this.socket.off('user-joined');
    this.socket.off('answer');
    this.socket.off('ice-candidate');
    this.socket.off('user-left');
  }

  private mungeSDP(sdp: string, bitrate: number): string {
    const lines = sdp.split('\r\n');
    const modifiedLines = [];
    let inVideoMline = false;

    for (let i = 0; i < lines.length; i++) {
      modifiedLines.push(lines[i]);
      if (lines[i].startsWith('m=video')) {
        inVideoMline = true;
      } else if (inVideoMline && lines[i].startsWith('c=')) {
        modifiedLines.push(`b=AS:${Math.floor(bitrate / 1000)}`);
        inVideoMline = false;
      }
    }
    return modifiedLines.join('\r\n');
  }
}
