import React from 'react';

interface VideoGridProps {
  remoteStreams?: any[];
}

export const VideoGrid: React.FC<VideoGridProps> = ({ remoteStreams = [] }) => {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      {remoteStreams.length === 0 ? (
        <div style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '1.2rem' }}>
          Aguardando transmissões...
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', width: '100%' }}>
          {/* Streams renderizadas aqui no futuro */}
        </div>
      )}
    </div>
  );
};
