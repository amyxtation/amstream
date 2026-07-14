import React, { useEffect, useRef } from 'react';

const SilentAudio = ({ isPlaying }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  return (
    <audio
      ref={audioRef}
      loop
      playsInline
      // Silent 1-second WAV file base64
      src="data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"
      style={{ display: 'none' }}
    />
  );
};

export default SilentAudio;
