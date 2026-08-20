import React, { useState, useEffect } from 'react';
import { Play, Info, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './HeroCarousel.css';

const HeroCarousel = ({ items = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (items.length === 0) return;
    
    setIsVideoPlaying(false);
    
    const videoTimer = setTimeout(() => {
      setIsVideoPlaying(true);
    }, 2500);

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 12000); // 12s interval to allow watching the trailer

    return () => {
      clearInterval(interval);
      clearTimeout(videoTimer);
    };
  }, [currentIndex, items.length]);

  if (!items || items.length === 0) return null;

  return (
    <div className="hero-container fade-in">
      {items.map((item, index) => {
        const isActive = index === currentIndex;
        const imageUrl = `https://image.tmdb.org/t/p/original${item.backdrop_path}`;
        const title = item.title || item.name;
        const releaseYear = (item.release_date || item.first_air_date || '').substring(0, 4);

        return (
          <div key={item.id} className={`hero-slide ${isActive ? 'active' : ''}`}>
            <div 
              className={`hero-background ${isActive && isVideoPlaying && item.trailerKey ? 'fade-out' : ''}`}
              style={{ backgroundImage: `url(${imageUrl})` }}
            />
            
            {isActive && item.trailerKey && (
              <div className={`hero-video-wrapper ${isVideoPlaying ? 'visible' : ''}`}>
                <iframe
                  src={`https://www.youtube.com/embed/${item.trailerKey}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${item.trailerKey}&modestbranding=1`}
                  title="Trailer"
                  frameBorder="0"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  className="hero-video"
                />
              </div>
            )}
            
            <div className="hero-overlay" />
            
            <div className="container hero-content-container">
              <div className="hero-content">
                <h1 className="hero-title">{title}</h1>
                
                <div className="hero-meta">
                  {releaseYear && <span>{releaseYear}</span>}
                  <span className="hero-rating">
                    <Star fill="currentColor" size={18} />
                    {item.vote_average?.toFixed(1)}
                  </span>
                  <span style={{ textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.1em' }}>
                    {item.media_type === 'tv' ? 'TV Series' : 'Movie'}
                  </span>
                </div>

                <p className="hero-overview">{item.overview}</p>

                <div className="hero-actions">
                  <button 
                    className="btn btn-primary hero-btn"
                    onClick={() => navigate(`/watch/${item.media_type || 'movie'}/${item.id}`)}
                  >
                    <Play size={20} fill="currentColor" /> Play Now
                  </button>
                  <button 
                    className="btn btn-secondary hero-btn"
                    onClick={() => navigate(`/details/${item.media_type || 'movie'}/${item.id}`)}
                  >
                    <Info size={20} /> More Info
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <div className="hero-indicators">
        {items.map((_, index) => (
          <button
            key={index}
            className={`indicator ${index === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
