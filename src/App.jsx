import React, { useState, useEffect } from 'react';
import Home from './components/Home';
import PlayerUI from './components/PlayerUI';
import YouTubeEngine from './components/YouTubeEngine';
import SilentAudio from './components/SilentAudio';

function App() {
  const [originalPlaylist, setOriginalPlaylist] = useState([]);
  const [playQueue, setPlayQueue] = useState([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [view, setView] = useState('home'); // 'home' or 'player'
  
  // 0: none, 1: repeat all, 2: repeat one
  const [repeatMode, setRepeatMode] = useState(0); 
  const [isShuffle, setIsShuffle] = useState(false);
  
  // We use this to force the engine to restart a song when repeatMode is 2
  const [restartCounter, setRestartCounter] = useState(0);

  const handlePlayPlaylist = (tracks) => {
    const tracksWithUid = tracks.map((t, i) => ({ ...t, uid: `uid-${t.id}-${Date.now()}-${i}` }));
    setOriginalPlaylist(tracksWithUid);
    setPlayQueue(tracksWithUid);
    setCurrentQueueIndex(0);
    setIsShuffle(false);
    setRepeatMode(0);
    setIsPlaying(true);
    setView('player');
  };

  const handleNext = () => {
    if (currentQueueIndex < playQueue.length - 1) {
      setCurrentQueueIndex(prev => prev + 1);
      setProgress(0);
      setIsPlaying(true);
    } else if (repeatMode === 1) {
      // Repeat All
      setCurrentQueueIndex(0);
      setProgress(0);
      setIsPlaying(true);
    } else {
      // Stop playing
      setIsPlaying(false);
    }
  };

  const handlePrev = () => {
    if (currentQueueIndex > 0) {
      setCurrentQueueIndex(prev => prev - 1);
      setProgress(0);
      setIsPlaying(true);
    } else {
      setProgress(0);
      setRestartCounter(c => c + 1);
      setIsPlaying(true);
    }
  };

  const handleStateChange = (state) => {
    // 0 = ended, 1 = playing, 2 = paused
    if (state === 0) {
      if (repeatMode === 2) {
        // Repeat One
        setProgress(0);
        setRestartCounter(c => c + 1);
        setIsPlaying(true);
      } else {
        handleNext();
      }
    } else if (state === 1) {
      setIsPlaying(true);
    } else if (state === 2) {
      // Pause state is now only trusted if we aren't changing tracks, handled in YouTubeEngine
      setIsPlaying(false);
    }
  };

  const toggleShuffle = () => {
    if (isShuffle) {
      // Turn off shuffle
      setIsShuffle(false);
      const currentTrack = playQueue[currentQueueIndex];
      const newIndex = originalPlaylist.findIndex(t => t.id === currentTrack.id);
      setPlayQueue(originalPlaylist);
      setCurrentQueueIndex(newIndex !== -1 ? newIndex : 0);
    } else {
      // Turn on shuffle
      setIsShuffle(true);
      const currentTrack = playQueue[currentQueueIndex];
      const remainingTracks = originalPlaylist.filter(t => t.id !== currentTrack.id);
      
      // Fisher-Yates shuffle
      for (let i = remainingTracks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [remainingTracks[i], remainingTracks[j]] = [remainingTracks[j], remainingTracks[i]];
      }
      
      setPlayQueue([currentTrack, ...remainingTracks]);
      setCurrentQueueIndex(0);
    }
  };

  const toggleRepeat = () => {
    setRepeatMode(prev => (prev + 1) % 3);
  };

  const handleSelectTrack = (index) => {
    setCurrentQueueIndex(index);
    setProgress(0);
    setIsPlaying(true);
  };

  const handleReorderQueue = (oldIndex, newIndex) => {
    if (oldIndex === newIndex) return;
    
    setPlayQueue(prevQueue => {
      const newQueue = [...prevQueue];
      const [movedItem] = newQueue.splice(oldIndex, 1);
      newQueue.splice(newIndex, 0, movedItem);
      
      // Update current index if the playing track or a track before it was moved
      if (oldIndex === currentQueueIndex) {
        setCurrentQueueIndex(newIndex);
      } else if (oldIndex < currentQueueIndex && newIndex >= currentQueueIndex) {
        setCurrentQueueIndex(currentQueueIndex - 1);
      } else if (oldIndex > currentQueueIndex && newIndex <= currentQueueIndex) {
        setCurrentQueueIndex(currentQueueIndex + 1);
      }
      
      return newQueue;
    });
  };

  const currentTrack = playQueue[currentQueueIndex];

  return (
    <div className="app-container">
      {view === 'home' && (
        <Home onPlayPlaylist={handlePlayPlaylist} />
      )}
      
      {view === 'player' && currentTrack && (
        <PlayerUI 
          track={currentTrack} 
          isPlaying={isPlaying} 
          onTogglePlay={setIsPlaying}
          onNext={handleNext}
          onPrev={handlePrev}
          progress={progress}
          duration={duration}
          onBack={() => setView('home')}
          
          // New props for playlist view and controls
          playQueue={playQueue}
          currentQueueIndex={currentQueueIndex}
          onSelectTrack={handleSelectTrack}
          onReorderQueue={handleReorderQueue}
          isShuffle={isShuffle}
          onToggleShuffle={toggleShuffle}
          repeatMode={repeatMode}
          onToggleRepeat={toggleRepeat}
        />
      )}

      {/* The engine is always rendered when there is a track so it can play in the background */}
      {currentTrack && (
        <YouTubeEngine 
          trackId={currentTrack.id}
          isPlaying={isPlaying}
          restartCounter={restartCounter}
          onReady={() => {}}
          onStateChange={handleStateChange}
          onProgress={setProgress}
          onDuration={setDuration}
        />
      )}
      
      <SilentAudio isPlaying={isPlaying} />
    </div>
  );
}

export default App;
