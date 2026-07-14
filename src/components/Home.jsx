import React, { useState } from 'react';
import { Play, Music } from 'lucide-react';

const Home = ({ onPlayPlaylist }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url) return;
    
    setLoading(true);
    setError('');

    try {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiUrl = isLocalhost && window.location.port === '5173'
        ? `http://localhost:3000/api/playlist?url=${encodeURIComponent(url)}`
        : `/api/playlist?url=${encodeURIComponent(url)}`;
        
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (response.ok && data.tracks && data.tracks.length > 0) {
        onPlayPlaylist(data.tracks);
      } else {
        setError(data.error || 'Failed to load playlist');
      }
    } catch (err) {
      setError('Network error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-screen">
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
        <Music size={48} color="var(--primary-color)" />
      </div>
      <h1 className="home-title">Streamify</h1>
      <p className="home-subtitle">Background YouTube Music Player</p>
      
      <form onSubmit={handleSubmit} className="input-group glass" style={{ padding: '2rem' }}>
        <input 
          type="text" 
          className="url-input" 
          placeholder="Paste YouTube Playlist URL..." 
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
        />
        {error && <p style={{ color: 'var(--primary-color)', fontSize: '0.9rem', textAlign: 'center' }}>{error}</p>}
        <button type="submit" className="btn-primary" disabled={loading || !url}>
          {loading ? <div className="loader"></div> : (
            <>
              <Play size={20} fill="currentColor" /> Play Now
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default Home;
