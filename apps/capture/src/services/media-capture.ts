export type QualityPreset = {
  label: string;
  width: number;
  height: number;
  bitrate: number;
  fps: number;
};

export const QUALITY_PRESETS: QualityPreset[] = [
  { label: 'Boa (3.6 Mbps)', width: 1280, height: 720, bitrate: 3600000, fps: 30 },
  { label: 'Máxima (5 Mbps)', width: 1920, height: 1080, bitrate: 5000000, fps: 30 },
  { label: 'Ultra (8 Mbps)', width: 2560, height: 1440, bitrate: 8000000, fps: 30 }
];

export async function startScreenCapture(preset: QualityPreset): Promise<MediaStream> {
  const constraints = {
    video: {
      width: { ideal: preset.width },
      height: { ideal: preset.height },
      frameRate: { ideal: preset.fps, max: 60 },
      cursor: 'always' as const
    },
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      sampleRate: 48000,
      channelCount: 2
    }
  };

  return await navigator.mediaDevices.getDisplayMedia(constraints);
}

export async function startCameraCapture(): Promise<MediaStream> {
  return await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
}

export function stopCapture(stream: MediaStream): void {
  stream.getTracks().forEach(track => track.stop());
}
