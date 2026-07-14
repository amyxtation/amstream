import React, { useEffect, useRef } from 'react';

const YouTubeEngine = ({ trackId, isPlaying, restartCounter, onReady, onStateChange, onProgress, onDuration }) => {
  const playerRef = useRef(null);
  const intervalRef = useRef(null);
  const isChangingTrackRef = useRef(false);

  useEffect(() => {
    // Load YouTube API if not already loaded (handled in index.html)
    // Wait for YT.Player to be available
    const initPlayer = () => {
      if (window.YT && window.YT.Player) {
        playerRef.current = new window.YT.Player('youtube-player', {
          height: '100%',
          width: '100%',
          videoId: trackId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            playsinline: 1, // Crucial for iOS background playback
            vq: 'hd1080', // Hint for high quality
          },
          events: {
            onReady: (event) => {
              onReady(event.target);
              if (isPlaying) event.target.playVideo();
            },
            onStateChange: (event) => {
              if (event.data === window.YT.PlayerState.PLAYING) {
                isChangingTrackRef.current = false;
              }
              
              if (event.data === window.YT.PlayerState.PAUSED && isChangingTrackRef.current) {
                // Ignore the PAUSED event that occurs right before a new video loads
                return;
              }
              
              onStateChange(event.data);
              
              if (event.data === window.YT.PlayerState.PLAYING) {
                onDuration(playerRef.current.getDuration());
                startProgressInterval();
              } else {
                stopProgressInterval();
              }
            }
          }
        });
      } else {
        setTimeout(initPlayer, 100);
      }
    };

    initPlayer();

    return () => {
      stopProgressInterval();
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, []); // Only run once to initialize player

  // Handle trackId change and restarts
  useEffect(() => {
    if (playerRef.current && playerRef.current.loadVideoById) {
      if (trackId !== playerRef.current.getVideoData?.()?.video_id || restartCounter > 0) {
        isChangingTrackRef.current = true;
        // Using suggestedQuality to try and force higher audio bitrate
        playerRef.current.loadVideoById({ videoId: trackId, suggestedQuality: 'hd1080' });
      }
      if (!isPlaying) {
         playerRef.current.pauseVideo();
      }
    }
  }, [trackId, restartCounter]);

  // Handle play/pause state change from parent
  useEffect(() => {
    if (playerRef.current && playerRef.current.playVideo) {
      if (isPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    }
  }, [isPlaying]);

  const startProgressInterval = () => {
    stopProgressInterval();
    intervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        onProgress(playerRef.current.getCurrentTime());
      }
    }, 1000);
  };

  const stopProgressInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  return (
    <div className="visually-hidden">
      <div id="youtube-player"></div>
    </div>
  );
};

export default YouTubeEngine;
