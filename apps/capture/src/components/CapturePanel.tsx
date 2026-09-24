import { useRef, useEffect } from 'react';
import { QualityPreset, QUALITY_PRESETS } from '../services/media-capture';
import { QualitySelector } from './QualitySelector';

interface CapturePanelProps {
  isStreaming: boolean;
  stream: MediaStream | null;
  qualityPreset: QualityPreset;
  setQualityPreset: (preset: QualityPreset) => void;
  fps: number;
  setFps: (fps: number) => void;
  onStart: () => void;
  onStop: () => void;
}

export function CapturePanel({
  isStreaming,
  stream,
  qualityPreset,
  setQualityPreset,
  fps,
  setFps,
  onStart,
  onStop
}: CapturePanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', width: '100%' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Qualidade</label>
          <QualitySelector
            value={qualityPreset}
            options={QUALITY_PRESETS}
            onChange={setQualityPreset}
            disabled={isStreaming}
          />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Quadros</label>
          <select
            value={fps}
            onChange={(e) => setFps(Number(e.target.value))}
            disabled={isStreaming}
            style={{ padding: '0.5rem', borderRadius: '4px', backgroundColor: 'var(--bg-secondary)', color: 'white', border: '1px solid #333' }}
          >
            <option value={30}>30 FPS</option>
            <option value={60}>60 FPS</option>
          </select>
        </div>
      </div>

      <div className="preview-container">
        {isStreaming ? (
          <video ref={videoRef} autoPlay playsInline muted />
        ) : (
          <div className="no-preview">Sem preview</div>
        )}
      </div>

      <div>
        {!isStreaming ? (
          <button className="primary" onClick={onStart} style={{ width: '100%' }}>
            Escolher tela a transmitir
          </button>
        ) : (
          <button className="secondary" onClick={onStop} style={{ width: '100%' }}>
            Parar transmissão
          </button>
        )}
      </div>
    </div>
  );
}
