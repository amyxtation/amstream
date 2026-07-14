import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, ArrowLeft, Shuffle, Repeat, Repeat1, ListMusic, X, GripVertical } from 'lucide-react';
import { setupMediaSession, updateMediaSessionPositionState, setMediaSessionPlaybackState } from '../utils/mediaSession';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableItem = ({ item, index, currentQueueIndex, formatTime, onSelectTrack, setShowPlaylist }) => {
  const id = item.uid || `${item.id}-${index}`;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
    position: 'relative',
    opacity: isDragging ? 0.8 : 1,
    boxShadow: isDragging ? '0 10px 20px rgba(0,0,0,0.3)' : 'none'
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`playlist-item ${index === currentQueueIndex ? 'active' : ''}`}
    >
      <div 
        style={{ display: 'flex', flex: 1, alignItems: 'center', gap: '1rem', cursor: 'pointer', overflow: 'hidden' }}
        onClick={() => {
          onSelectTrack(index);
          setShowPlaylist(false);
        }}
      >
        <img src={item.thumbnail} alt="" className="item-thumb" />
        <div className="item-info">
          <div className="item-title">{item.title}</div>
          <div className="item-artist">{item.artist}</div>
        </div>
        <div className="item-duration">{formatTime(item.duration)}</div>
      </div>
      
      <div 
        {...attributes} 
        {...listeners} 
        style={{ padding: '0.5rem', cursor: 'grab', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}
      >
        <GripVertical size={20} />
      </div>
    </div>
  );
};

const PlayerUI = ({ 
  track, isPlaying, onTogglePlay, onNext, onPrev, progress, duration, onBack,
  playQueue, currentQueueIndex, onSelectTrack, onReorderQueue, isShuffle, onToggleShuffle, repeatMode, onToggleRepeat
}) => {
  const [showPlaylist, setShowPlaylist] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (track) {
      setupMediaSession(track, {
        onPlay: () => {
          onTogglePlay(true);
        },
        onPause: () => {
          onTogglePlay(false);
        },
        onNext: onNext,
        onPrev: onPrev
      });
    }
  }, [track, onNext, onPrev, onTogglePlay]);

  useEffect(() => {
    setMediaSessionPlaybackState(isPlaying ? 'playing' : 'paused');
  }, [isPlaying]);

  useEffect(() => {
    updateMediaSessionPositionState(duration, 1, progress);
  }, [progress, duration]);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    if (active.id !== over.id) {
      const oldIndex = playQueue.findIndex((item, i) => (item.uid || `${item.id}-${i}`) === active.id);
      const newIndex = playQueue.findIndex((item, i) => (item.uid || `${item.id}-${i}`) === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderQueue(oldIndex, newIndex);
      }
    }
  };

  const sortableItems = playQueue ? playQueue.map((item, index) => item.uid || `${item.id}-${index}`) : [];

  return (
    <div className="player-screen">
      <div className="header">
        <button className="icon-btn" onClick={onBack}>
          <ArrowLeft size={24} />
        </button>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '1px' }}>
          NOW PLAYING
        </div>
        <div style={{ width: '48px' }}></div> {/* Spacer */}
      </div>

      <div className="artwork-container">
        <img 
          src={track.thumbnail} 
          alt="Album Art" 
          className={`artwork ${isPlaying ? 'playing' : ''}`} 
        />
      </div>

      <div className="track-info">
        <h2 className="track-title">{track.title}</h2>
        <p className="track-artist">{track.artist}</p>
      </div>

      <div className="progress-container">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
        <div className="time-info">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="controls">
        <button className="control-btn" onClick={onPrev}>
          <SkipBack size={32} fill="currentColor" />
        </button>
        
        <button className="play-btn" onClick={() => onTogglePlay(!isPlaying)}>
          {isPlaying ? (
            <Pause size={32} fill="currentColor" />
          ) : (
            <Play size={32} fill="currentColor" style={{ marginLeft: '4px' }} />
          )}
        </button>
        
        <button className="control-btn" onClick={onNext}>
          <SkipForward size={32} fill="currentColor" />
        </button>
      </div>

      {/* Secondary Controls */}
      <div className="secondary-controls">
        <button className={`sec-btn ${isShuffle ? 'active' : ''}`} onClick={onToggleShuffle}>
          <Shuffle size={20} />
        </button>
        <button className={`sec-btn ${repeatMode > 0 ? 'active' : ''}`} onClick={onToggleRepeat}>
          {repeatMode === 2 ? <Repeat1 size={20} /> : <Repeat size={20} />}
        </button>
        <button className="sec-btn" onClick={() => setShowPlaylist(true)}>
          <ListMusic size={20} />
        </button>
      </div>

      {/* Playlist Overlay */}
      <div className={`playlist-overlay ${showPlaylist ? 'open' : ''}`}>
        <div className="playlist-header">
          <h3 className="playlist-title">Up Next</h3>
          <button className="close-btn" onClick={() => setShowPlaylist(false)}>
            <X size={20} />
          </button>
        </div>
        
        <div className="playlist-list">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={sortableItems}
              strategy={verticalListSortingStrategy}
            >
              {playQueue && playQueue.map((item, index) => (
                <SortableItem 
                  key={item.uid || `${item.id}-${index}`}
                  item={item}
                  index={index}
                  currentQueueIndex={currentQueueIndex}
                  formatTime={formatTime}
                  onSelectTrack={onSelectTrack}
                  setShowPlaylist={setShowPlaylist}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  );
};

export default PlayerUI;
