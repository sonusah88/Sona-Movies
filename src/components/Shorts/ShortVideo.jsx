import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Music } from 'lucide-react';
import ShortsSidebar from './ShortsSidebar';

const ShortVideo = ({ short, isActive, isMuted, toggleMute, onOpenComments }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showPlayPause, setShowPlayPause] = useState(false);
  const videoRef = useRef(null);

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
