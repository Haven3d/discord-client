import React, { useState, useRef, useEffect } from 'react';
import { startCameraCapture, stopCapture } from '../services/media-capture';

export function CameraPreview() {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  const toggleCamera = async () => {
    if (isCameraOn) {
      if (cameraStream) {
        stopCapture(cameraStream);
        setCameraStream(null);
      }
      setIsCameraOn(false);
    } else {
      try {
        const stream = await startCameraCapture();
        setCameraStream(stream);
        setIsCameraOn(true);
      } catch (err) {
        console.error('Failed to start camera:', err);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3>Câmera</h3>
      </div>
      
      <div className="preview-container">
        {isCameraOn ? (
          <video ref={videoRef} autoPlay playsInline muted />
        ) : (
          <div className="no-preview">Sem preview</div>
        )}
      </div>

      <button className={isCameraOn ? 'secondary' : 'primary'} onClick={toggleCamera}>
        {isCameraOn ? 'Desligar a câmera' : 'Ligar a câmera'}
      </button>
    </div>
  );
}
