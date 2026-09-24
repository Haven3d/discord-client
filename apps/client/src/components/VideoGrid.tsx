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
        <div style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '1.2rem' }}>
          Aguardando transmissões...
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
