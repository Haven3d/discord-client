import React from 'react';

interface VideoGridProps {
  remoteStreams?: { id: string; stream: MediaStream }[];
}

const StreamVideo = ({ stream }: { stream: MediaStream }) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
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

export const VideoGrid: React.FC<VideoGridProps> = ({ remoteStreams = [] }) => {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      {remoteStreams.length === 0 ? (
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
          {remoteStreams.map((rs) => (
            <StreamVideo key={rs.id} stream={rs.stream} />
          ))}
        </div>
      )}
    </div>
  );
};
