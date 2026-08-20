import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Music, Users, Tv } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ShortsSidebar from './ShortsSidebar';

const ShortVideo = ({ short, isActive, isMuted, toggleMute, onOpenComments }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showPlayPause, setShowPlayPause] = useState(false);
  const [showWatchTogether, setShowWatchTogether] = useState(false);
  const [webrtcStatus, setWebrtcStatus] = useState('');
  const videoRef = useRef(null);
  const navigate = useNavigate();

  const handleWatchTogether = async (e) => {
    e.stopPropagation();
    setShowWatchTogether(true);
    setWebrtcStatus('Connecting...');
    
    // Mock WebRTC connection
    try {
      await fetch('/api/webrtc-signaling', {
        method: 'POST',
        body: JSON.stringify({ roomId: `short-${short.id}`, type: 'offer', payload: {} })
      });
      setTimeout(() => setWebrtcStatus('Connected to Peer (DataChannel open)'), 1500);
    } catch(err) {
      setWebrtcStatus('Error connecting');
    }
  };

  const handleWatchFullFilm = (e) => {
    e.stopPropagation();
    navigate(`/details/movie/${short.tmdbId || '572802'}`);
  };

  // Sync isPlaying with isActive prop safely
  useEffect(() => {
    if (!videoRef.current) return;
    
    if (isActive) {
      setIsPlaying(true);
      // Use a promise to handle play to avoid AbortError
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("Autoplay prevented or interrupted:", error);
          setIsPlaying(false);
        });
      }
    } else {
      setIsPlaying(false);
      videoRef.current.pause();
      videoRef.current.currentTime = 0; // Reset video when not active
    }
  }, [isActive]);

  const handleVideoPress = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          setIsPlaying(true);
        }).catch(err => console.log(err));
      }
    }
    
    setShowPlayPause(true);
    // Reset the animation by hiding it after it finishes
    setTimeout(() => {
      setShowPlayPause(false);
    }, 1000);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const duration = videoRef.current.duration;
    if (duration > 0) {
      setProgress((current / duration) * 100);
    }
  };

  return (
    <div className="short-video-container">
      <div className="short-video-player-wrapper" onClick={handleVideoPress}>
        <video
          ref={videoRef}
          src={short.videoUrl}
          poster={short.thumbnail}
          loop
          muted={isMuted}
          playsInline
          onTimeUpdate={handleTimeUpdate}
          className="short-video-player"
          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
        />

        {/* Play/Pause Animation Overlay */}
        {showPlayPause && (
          <div className="play-pause-overlay">
            {isPlaying ? <Play size={40} fill="white" /> : <Pause size={40} fill="white" />}
          </div>
        )}

        {/* Top Gradient for text readability */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '100px',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)',
          pointerEvents: 'none'
        }} />

        {/* Mute Toggle Button */}
        <button 
          onClick={(e) => { e.stopPropagation(); toggleMute(); }}
          style={{
            position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 60,
            background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%',
            width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', cursor: 'pointer', backdropFilter: 'blur(4px)'
          }}
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>

        {/* Watch Full Film Banner */}
        <div 
          onClick={handleWatchFullFilm}
          style={{
            position: 'absolute', top: '1.5rem', left: '1.5rem', zIndex: 60,
            background: 'var(--accent)', color: '#000', padding: '0.5rem 1rem',
            borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            boxShadow: '0 0 15px rgba(0, 229, 255, 0.4)'
          }}
        >
          <Tv size={16} /> Watch Full Film
        </div>

        {/* Watch Together Button */}
        <button 
          onClick={handleWatchTogether}
          style={{
            position: 'absolute', top: '5rem', left: '1.5rem', zIndex: 60,
            background: 'rgba(255, 0, 85, 0.2)', border: '1px solid rgba(255, 0, 85, 0.4)',
            color: '#fff', padding: '0.4rem 0.8rem', borderRadius: '12px',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            backdropFilter: 'blur(10px)', cursor: 'pointer'
          }}
        >
          <Users size={16} /> Watch Together
        </button>

        {/* Watch Together Modal */}
        {showWatchTogether && (
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute', inset: '0', zIndex: 100,
              background: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', padding: '2rem'
            }}
          >
            <div style={{
              background: 'var(--bg-glass)', border: '1px solid rgba(255,255,255,0.1)',
              padding: '2rem', borderRadius: '24px', textAlign: 'center', width: '100%', maxWidth: '400px'
            }}>
              <Users size={48} color="var(--magenta)" style={{ marginBottom: '1rem' }} />
              <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>Co-Viewing Room</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{webrtcStatus}</p>
              <div style={{ 
                height: '150px', background: '#000', borderRadius: '12px', 
                marginBottom: '1rem', border: '1px solid var(--accent)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)'
              }}>
                [Friend's Webcam Feed]
              </div>
              <button 
                onClick={() => setShowWatchTogether(false)}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                Close Room
              </button>
            </div>
          </div>
        )}

        {/* Bottom Information Area */}
        <div className="short-ui-overlay">
          <div className="short-bottom-info">
            <div className="short-creator-info">
              <img src={short.creator.avatar} alt={short.creator.name} className="short-creator-avatar" />
              <span className="short-creator-name">@{short.creator.name.replace(' ', '')}</span>
              <button className={`short-follow-btn ${short.creator.isFollowed ? 'following' : ''}`}>
                {short.creator.isFollowed ? 'Following' : 'Follow'}
              </button>
            </div>
            
            <h2 className="short-title">{short.title}</h2>
            <p className="short-desc">{short.description}</p>
            
            <div className="short-music-info">
              <Music size={14} className="music-icon" />
              <span>{short.music}</span>
            </div>
          </div>
        </div>

        {/* Sidebar Action Rail */}
        <ShortsSidebar short={short} onOpenComments={onOpenComments} />

        {/* Progress Bar */}
        <div className="short-progress-container">
          <div className="short-progress-bar" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
};

export default ShortVideo;
