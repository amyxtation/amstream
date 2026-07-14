export const setupMediaSession = (track, callbacks) => {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: track.title,
      artist: track.artist || 'Unknown Artist',
      album: 'Streamify Playlist',
      artwork: [
        { src: track.thumbnail, sizes: '512x512', type: 'image/png' }
      ]
    });

    navigator.mediaSession.setActionHandler('play', callbacks.onPlay);
    navigator.mediaSession.setActionHandler('pause', callbacks.onPause);
    navigator.mediaSession.setActionHandler('previoustrack', callbacks.onPrev);
    navigator.mediaSession.setActionHandler('nexttrack', callbacks.onNext);
  }
};

export const updateMediaSessionPositionState = (duration, playbackRate, position) => {
  if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession) {
    try {
      navigator.mediaSession.setPositionState({
        duration: duration || 0,
        playbackRate: playbackRate || 1,
        position: position || 0
      });
    } catch (e) {
      console.warn("Error setting position state:", e);
    }
  }
};

export const setMediaSessionPlaybackState = (state) => {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.playbackState = state; // 'playing', 'paused', or 'none'
  }
};
