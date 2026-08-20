import React from 'react';
import { Link } from 'react-router-dom';
import './GenreSlider.css';

const GENRES = [
  { id: 28, name: 'Action', emoji: '💥', color: 'linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%)' },
  { id: 35, name: 'Comedy', emoji: '😂', color: 'linear-gradient(135deg, #F2C94C 0%, #F2994A 100%)' },
  { id: 27, name: 'Horror', emoji: '👻', color: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)' },
  { id: 878, name: 'Sci-Fi', emoji: '👽', color: 'linear-gradient(135deg, #00B4DB 0%, #0083B0 100%)' },
  { id: 10749, name: 'Romance', emoji: '❤️', color: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)' },
  { id: 16, name: 'Animation', emoji: '🎨', color: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
  { id: 12, name: 'Adventure', emoji: '🗺️', color: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  { id: 53, name: 'Thriller', emoji: '🔪', color: 'linear-gradient(135deg, #141E30 0%, #243B55 100%)' }
];

const GenreSlider = () => {
  return (
    <div className="container media-grid-section fade-in">
      <div className="section-header">
        <h2 className="section-title">🎭 Browse by Genre</h2>
      </div>
      <div className="genre-slider">
        {GENRES.map((genre) => (
          <Link 
            key={genre.id} 
            to={`/genre/${genre.id}/${encodeURIComponent(genre.name)}`} 
            className="genre-card"
            style={{ background: genre.color }}
          >
            <span className="genre-emoji">{genre.emoji}</span>
            <span className="genre-name">{genre.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default GenreSlider;
