import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Star, Film } from 'lucide-react';
import './MediaGrid.css';

// Extract to a separate memoized component to prevent unnecessary re-renders when scrolling
const MediaCard = React.memo(({ item, isCustom }) => {
  const linkTarget = isCustom && item.media_type === 'youtube'
    ? `/watch/youtube/${item.id}?title=${encodeURIComponent(item.title)}` 
    : `/details/${item.media_type || 'movie'}/${item.id}`;

  const posterUrl = isCustom 
    ? item.poster_path 
    : (item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster');

  const displayTitle = item.title || item.name;
  
  // Detect if upcoming
  const rawDateStr = item.release_date || item.first_air_date || item.date || '';
  const releaseDateObj = new Date(rawDateStr);
  const isUpcoming = rawDateStr && releaseDateObj > new Date();
  
  let dateDisplay = 'N/A';
  if (rawDateStr) {
    if (isUpcoming) {
      dateDisplay = releaseDateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } else {
      dateDisplay = rawDateStr.substring(0, 4);
    }
  }

  return (
    <Link to={linkTarget} className={`media-card ${isUpcoming ? 'is-upcoming' : ''}`}>
      <div className="card-image-wrapper">
        <img 
          src={posterUrl} 
          alt={displayTitle} 
          className="media-image"
          loading="lazy"
          decoding="async"
        />
        {isUpcoming && <div className="coming-soon-badge">COMING SOON</div>}
        <div className="card-overlay">
          <div className="card-play-btn">
            {isUpcoming ? <Film fill="currentColor" size={24} /> : <Play fill="currentColor" size={24} />}
          </div>
        </div>
      </div>
      <div className="card-content">
        <h3 className="card-title" title={displayTitle}>{displayTitle}</h3>
        <div className="card-meta">
          <span className="release-year" style={isUpcoming ? { color: '#ffc107', fontWeight: 'bold' } : {}}>{dateDisplay}</span>
          {item.vote_average > 0 && !isUpcoming && (
            <span className="card-rating">
              <Star fill="currentColor" size={14} className="star-icon" />
              <span className="rating-value">{item.vote_average.toFixed(1)}</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
});

const MediaGrid = ({ title, items, tag, layout = 'grid' }) => {
  if (!items || items.length === 0) return null;

  return (
    <div 
      className={`container media-grid-section fade-in layout-${layout}`}
    >
      <div className="section-header">
        <h2 className="section-title">
          {title}
          {tag && <span className={`category-tag tag-${tag}`}>{tag}</span>}
        </h2>
      </div>
      <div className={`media-grid ${layout === 'slider' ? 'is-slider' : 'is-grid'}`}>
        {items.map((item) => (
          <MediaCard key={item.id} item={item} isCustom={item.media_type === 'youtube' || item.media_type === 'nepali'} />
        ))}
      </div>
    </div>
  );
};

export default MediaGrid;
