import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, AlertTriangle, X } from 'lucide-react';
import latentData from '../data/latent.json';
import './VidkingPlayer.css';

const SERVERS = [
  {
    id: 'cineverse',
    name: 'Hindi Server 1 (Cineverse)',
    movieUrl: (id) => `https://rozgarlelo.modiplay.xyz/embed/tmdb/movie?id=${id}&autoplay=1`,
    tvUrl: (id, s, e) => `https://rozgarlelo.modiplay.xyz/embed/tmdb/tv?id=${id}&s=${s}&e=${e}&autoplay=1`,
    isHindi: true
  },
  {
    id: 'screenscape',
    name: 'Hindi Server 2 (ScreenScape)',
    movieUrl: (id) => `https://screenscape.me/embed?tmdb=${id}&type=movie&lan=hindi&autoplay=1&server=Sealx`,
    tvUrl: (id, s, e) => `https://screenscape.me/embed?tmdb=${id}&type=tv&s=${s}&e=${e}&lan=hindi&autoplay=1&server=Sealx`,
    isHindi: true
  },
  {
    id: 'vidsrc_to',
    name: 'Server 3',
    movieUrl: (id) => `https://vidsrc.to/embed/movie/${id}`,
    tvUrl: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`
  },
  {
    id: '2embed',
    name: 'Server 3',
    movieUrl: (id) => `https://www.2embed.cc/embed/${id}`,
    tvUrl: (id, s, e) => `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`
  },
  {
    id: 'multiembed',
    name: 'Server 4',
    movieUrl: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    tvUrl: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`
  },

  {
    id: 'vidlink',
    name: 'Server 6',
    movieUrl: (id) => `https://vidlink.pro/movie/${id}`,
    tvUrl: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}`
  }
];

const VidkingPlayer = ({ 
  tmdbId, 
  type = 'movie', 
  season = 1, 
  episode = 1,
  title = '',
  isHindi = false
}) => {
  const [serverIndex, setServerIndex] = useState(() => {
    return 0; // Default to Cineverse (Index 0)
  });
  const [showHelp, setShowHelp] = useState(false);
  const [showVolumeBooster, setShowVolumeBooster] = useState(false);
  const [isRotated, setIsRotated] = useState(false);
  const [showVpnBanner, setShowVpnBanner] = useState(true);

  React.useEffect(() => {
    if (isHindi || tmdbId === 'indias-got-latent') {
      setServerIndex(0); // Start with Cineverse
    }
  }, [isHindi, tmdbId]);



  const server = SERVERS[serverIndex];
  const actualTmdbId = tmdbId === 'indias-got-latent' ? '262838' : tmdbId;
  const url = type === 'movie'
    ? server.movieUrl(actualTmdbId)
    : server.tvUrl(actualTmdbId, season, episode);

  const searchQuery = encodeURIComponent(`${title} full movie watch online`);

  if (type === 'youtube') {
    return (
      <div className="vidking-wrapper">
        {isRotated ? createPortal(
          <div className={`player-container rotated`}>
            <button className="close-rotate-btn" onClick={() => setIsRotated(false)}>
              ✖ Exit Rotation
            </button>
            <iframe 
              src={`https://www.youtube.com/embed/${tmdbId}?autoplay=1`} 
              width="100%" 
              height="100%" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
              title={title}
            ></iframe>
          </div>,
          document.body
        ) : (
          <div className="player-container">
            <iframe 
              src={`https://www.youtube.com/embed/${tmdbId}?autoplay=1`} 
              width="100%" 
              height="100%" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
              title={title}
            ></iframe>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="vidking-wrapper">
      <div className="server-bar glass">
        <span className="server-label">Switch server if not playing:</span>
        {SERVERS.map((s, i) => (
          <button
            key={s.id}
            className={`server-btn ${i === serverIndex ? 'active' : ''}`}
            onClick={() => { setServerIndex(i); setShowHelp(false); setShowVolumeBooster(false); }}
          >
            {s.name}
          </button>
        ))}
        
        <button
          className="server-btn mobile-only"
          style={{ marginLeft: 'auto', background: 'rgba(255, 193, 7, 0.1)', color: '#ffc107', borderColor: '#ffc107' }}
          onClick={() => { setIsRotated(true); setShowHelp(false); setShowVolumeBooster(false); }}
          title="Rotate Video"
        >
          🔄 Rotate
        </button>

        <button
          className="server-btn"
          style={{ background: 'rgba(57, 255, 20, 0.1)', color: '#39ff14', borderColor: '#39ff14' }}
          onClick={() => { setShowVolumeBooster(!showVolumeBooster); setShowHelp(false); }}
          title="Boost Volume"
        >
          🔊 Volume Booster
        </button>

        <button
          className="server-btn help-btn"
          onClick={() => { setShowHelp(!showHelp); setShowVolumeBooster(false); }}
          title="Movie not available?"
        >
          <AlertTriangle size={14} /> Help
        </button>
      </div>

      {showVolumeBooster && (
        <div className="player-help glass" style={{ borderColor: '#39ff14', background: 'rgba(57, 255, 20, 0.05)' }}>
          <h4 style={{ color: '#39ff14' }}>🔊 How to Boost Volume up to 600%</h4>
          <p>
            Because movies are streamed from external secure servers, websites are technically blocked from forcing the volume higher than 100%. 
            However, you can instantly boost the volume of this video by installing a free browser extension!
          </p>
          <div className="help-links">
            <a href="https://chrome.google.com/webstore/detail/volume-master/jghecgabfgfdldnmbfkhmffcabokigjc" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ borderColor: '#39ff14', color: '#39ff14' }}>
              Download Volume Booster for Chrome
            </a>
          </div>
        </div>
      )}

      {showHelp && (
        <div className="player-help glass">
          <h4>🎬 Movie not playing on any server?</h4>
          <p>Some regional movies (Nepali, independent films) may not be available on streaming servers. Try these alternatives:</p>
          <div className="help-links">
            <a href={`https://www.youtube.com/results?search_query=${searchQuery}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
              <Search size={16} /> Search on YouTube
            </a>
            <a href={`https://www.google.com/search?q=${searchQuery}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
              <Search size={16} /> Search on Google
            </a>
          </div>
        </div>
      )}

      {showVpnBanner && (
        <div className="vpn-banner glass">
          <div className="vpn-banner-content">
            <span className="vpn-badge">SPONSORED</span>
            <div className="vpn-text">
              <h4>Stream Safely & Unblock All Movies</h4>
              <p>Your ISP might be tracking your streaming activity. Hide your IP and get 70% off a premium VPN!</p>
            </div>
          </div>
          <div className="vpn-banner-actions">
            <a href="https://nordvpn.com/" target="_blank" rel="noopener noreferrer" className="btn btn-primary vpn-btn">
              Get VPN Offer
            </a>
            <button className="vpn-close-btn" onClick={() => setShowVpnBanner(false)} aria-label="Close Ad">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {isRotated ? createPortal(
        <div className={`player-container rotated`}>
          <button className="close-rotate-btn" onClick={() => setIsRotated(false)}>
            ✖ Exit Rotation
          </button>
          <iframe 
            src={url} 
            width="100%" 
            height="100%" 
            frameBorder="0" 
            allowFullScreen
            allow="autoplay; encrypted-media; fullscreen"
            referrerPolicy="origin"
            title="Video Player"
          ></iframe>
        </div>,
        document.body
      ) : (
        <div className="player-container">
          <iframe 
            src={url} 
            width="100%" 
            height="100%" 
            frameBorder="0" 
            allowFullScreen
            allow="autoplay; encrypted-media; fullscreen"
            referrerPolicy="origin"
            title="Video Player"
          ></iframe>
        </div>
      )}
    </div>
  );
};

export default VidkingPlayer;
