import React, { useState, useEffect } from 'react';

interface StreamStatusProps {
  isStreaming: boolean;
  viewers: number;
}

export function StreamStatus({ isStreaming, viewers }: StreamStatusProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let interval: number;
    if (isStreaming) {
      interval = window.setInterval(() => {
        setElapsed(e => e + 1);
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [isStreaming]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div className="status-indicator">
        {isStreaming ? (
          <>
            <div className="dot"></div>
            <span>Transmitindo... ({formatTime(elapsed)})</span>
          </>
        ) : (
          <span>Aguardando transmissão</span>
        )}
      </div>
      
      {isStreaming && (
        <div style={{ color: '#a0a0b0' }}>
          <span>Espectadores: {viewers}</span>
        </div>
      )}
      
      <div style={{ fontSize: '0.9rem', color: '#f97316' }}>
        Mantenha esta aba aberta
      </div>
    </div>
  );
}
