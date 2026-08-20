import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, ArrowLeft, Star, Clock, Calendar, Layers, Heart } from 'lucide-react';
import { fetchDetails, fetchSeasonDetails, fetchTrailer } from '../lib/tmdb';
import { useUser } from '../context/UserContext';
import MediaGrid from '../components/MediaGrid';
import './Details.css';

const Details = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();
  
  const { user, isFavorite, toggleFavorite } = useUser();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const [trailerKey, setTrailerKey] = useState(null);

  // TV Show specific state
  const [season, setSeason] = useState(1);
  const [seasonData, setSeasonData] = useState(null);
  const [loadingSeason, setLoadingSeason] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadDetails = async () => {
      setLoading(true);
      try {
        if (type === 'nepali') {
          // Fetch directly from github raw json
          const res = await fetch('https://raw.githubusercontent.com/Prajwal100/Nepali_movies/master/backend/data/movies.json');
          const data = await res.json();
          const movie = data.find(m => m.name === id); // We will use name as id
          if (movie && !cancelled) {
            setDetails({
              id: movie.name,
              title: movie.name,
              poster_path: movie.image,
              backdrop_path: movie.image, // Use same for backdrop
              overview: movie.overview,
              release_date: movie.releaseDate,
              media_type: 'nepali'
            });
          }
        } else {
          const data = await fetchDetails(id, type);
          if (!cancelled) setDetails(data);
        }
      } catch (error) {
        console.error('Failed to load details:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadDetails();
    return () => { cancelled = true; };
  }, [id, type]);

  useEffect(() => {
    if (type !== 'tv') return;
    let cancelled = false;
    const loadSeason = async () => {
      setLoadingSeason(true);
      try {
        const data = await fetchSeasonDetails(id, season);
        if (!cancelled) setSeasonData(data);
      } catch (error) {
        console.error('Failed to load season:', error);
      } finally {
        if (!cancelled) setLoadingSeason(false);
      }
    };
    loadSeason();
    return () => { cancelled = true; };
  }, [id, type, season]);

  if (loading) {
    return (
      <div className="details-page">
        <div className="skeleton" style={{ width: '100%', height: '60vh', borderRadius: 0 }}></div>
        <div className="container" style={{ paddingTop: '2rem', display: 'flex', gap: '3rem' }}>
          <div className="skeleton" style={{ width: 280, height: 420, borderRadius: 16, flexShrink: 0 }}></div>
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ width: '60%', height: 40, marginBottom: 16 }}></div>
            <div className="skeleton" style={{ width: '40%', height: 24, marginBottom: 16 }}></div>
            <div className="skeleton" style={{ width: '100%', height: 100, marginBottom: 16 }}></div>
            <div className="skeleton" style={{ width: 180, height: 50 }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}>
        <h2>Content not found</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
          This title may not be available. Try searching for something else.
        </p>
        <button onClick={() => navigate('/')} className="btn btn-primary" style={{ marginTop: '2rem' }}>
          Go Home
        </button>
      </div>
    );
  }

  const handlePlay = (episodeNum = null) => {
    if (type === 'nepali') {
      navigate(`/watch/youtube/${encodeURIComponent(details.title)}?title=${encodeURIComponent(details.title)}`);
      return;
    }

    let watchUrl = `/watch/${type}/${id}`;
    if (type === 'tv' && episodeNum !== null) {
      watchUrl += `?s=${season}&e=${episodeNum}`;
    }
    navigate(watchUrl);
  };

  const handleWatchTrailer = async () => {
    if (!trailerKey) {
      const key = await fetchTrailer(id, type === 'nepali' ? 'movie' : type);
      if (key) {
        setTrailerKey(key);
      } else {
        alert('Trailer not available for this title yet.');
        return;
      }
    }
    setShowTrailer(true);
  };

  const handleFavoriteClick = () => {
    if (!user) {
      alert("Please login first to save favorites!");
      return;
    }
    toggleFavorite({ ...details, media_type: type });
  };

  return (
    <div className="details-page fade-in">
      <div 
        className="details-backdrop"
        style={{ backgroundImage: details.backdrop_path ? `url(${details.backdrop_path})` : 'none' }}
      >
        <div className="details-overlay"></div>
      </div>
      
      <div className="container details-content">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Back
        </button>
        
        <div className="details-layout">
          <div className="details-poster-wrapper">
            {details.poster_path ? (
              <img src={details.poster_path} alt={details.title} className="details-poster" loading="lazy" />
            ) : (
              <div className="details-poster-placeholder">{details.title}</div>
            )}
          </div>
          
          <div className="details-info">
            <h1 className="details-title">{details.title}</h1>
            
            <div className="details-meta">
              <span className="meta-item"><Star size={16} fill="#f5c518" color="#f5c518" /> {details.vote_average?.toFixed(1)}</span>
              {details.date && <span className="meta-item"><Calendar size={16} /> {details.date.split('-')[0]}</span>}
              {details.runtime && <span className="meta-item"><Clock size={16} /> {details.runtime} min</span>}
              <span className="meta-item type-badge">{type === 'tv' ? 'TV Series' : 'Movie'}</span>
            </div>

            {details.genres?.length > 0 && (
              <div className="details-genres">
                {details.genres.map(g => (
                  <span key={g.id} className="genre-pill">{g.name}</span>
                ))}
              </div>
            )}
            
            <p className="details-overview">{details.overview}</p>

            {type === 'tv' && (
              <div className="tv-selectors">
                <div className="tv-season-header">
                  {details.number_of_seasons && (
                    <div className="tv-info-badge">
                      <Layers size={16} /> {details.number_of_seasons} Season{details.number_of_seasons > 1 ? 's' : ''}
                    </div>
                  )}
                  <div className="selector-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '1rem' }}>
                    <label>Select Season</label>
                    <select 
                      value={season} 
                      onChange={(e) => setSeason(parseInt(e.target.value) || 1)} 
                      className="premium-select"
                    >
                      {Array.from({ length: details.number_of_seasons || 1 }, (_, i) => i + 1).map(s => {
                        const seasonName = details.seasons?.find(season => season.season_number === s)?.name || `Season ${s}`;
                        return <option key={s} value={s}>{seasonName}</option>;
                      })}
                    </select>
                  </div>
                </div>

                <div className="episodes-window">
                  <h3 className="episodes-title">Episodes</h3>
                  {loadingSeason ? (
                    <div className="episodes-loading">Loading episodes...</div>
                  ) : seasonData?.episodes?.length > 0 ? (
                    <div className="episodes-list">
                      {seasonData.episodes.map(ep => (
                        <div key={ep.id} className="episode-card" onClick={() => handlePlay(ep.episode_number)}>
                          <div className="episode-thumbnail-wrapper">
                            {ep.still_path ? (
                              <img src={ep.still_path} alt={ep.name} className="episode-thumbnail" loading="lazy" />
                            ) : (
                              <div className="episode-thumbnail-placeholder"><Play size={24} /></div>
                            )}
                            <div className="episode-play-overlay">
                              <Play size={24} fill="white" />
                            </div>
                          </div>
                          <div className="episode-details">
                            <div className="episode-header">
                              <span className="episode-number">{ep.episode_number}</span>
                              <span className="episode-name">{ep.name}</span>
                            </div>
                            <p className="episode-overview">{ep.overview || "No description available."}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="episodes-empty">No episodes found for this season.</div>
                  )}
                </div>
              </div>
            )}
            
            {type !== 'tv' && (
              <div className="details-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '2rem' }}>
                {(() => {
                  const rawDateStr = details.release_date || details.first_air_date || details.date || '';
                  const isUpcoming = rawDateStr && new Date(rawDateStr) > new Date();
                  
                  if (isUpcoming) {
                    return (
                      <button onClick={handleWatchTrailer} className="btn btn-primary btn-large" style={{ background: '#ffc107', color: '#000' }}>
                        <Play fill="currentColor" size={22} /> Watch Trailer
                      </button>
                    );
                  } else {
                    return (
                      <button onClick={() => handlePlay()} className="btn btn-primary btn-large">
                        <Play fill="currentColor" size={22} /> Play Movie
                      </button>
                    );
                  }
                })()}
                <button 
                  onClick={handleFavoriteClick} 
                  className={`btn btn-large ${isFavorite(details.id, type) ? 'btn-favorite-active' : 'btn-favorite'}`}
                  style={{ 
                    background: isFavorite(details.id, type) ? 'rgba(255, 0, 85, 0.2)' : 'rgba(255, 255, 255, 0.1)', 
                    color: isFavorite(details.id, type) ? 'var(--magenta)' : 'white',
                    border: `1px solid ${isFavorite(details.id, type) ? 'var(--magenta)' : 'rgba(255, 255, 255, 0.2)'}`
                  }}
                >
                  <Heart fill={isFavorite(details.id, type) ? 'var(--magenta)' : 'none'} size={22} /> 
                  {isFavorite(details.id, type) ? 'Favorited' : 'Add to Favorites'}
                </button>
              </div>
            )}
            
            {type === 'tv' && (
              <div className="details-actions" style={{ marginTop: '2rem' }}>
                <button 
                  onClick={handleFavoriteClick} 
                  className={`btn btn-large ${isFavorite(details.id, type) ? 'btn-favorite-active' : 'btn-favorite'}`}
                  style={{ 
                    background: isFavorite(details.id, type) ? 'rgba(255, 0, 85, 0.2)' : 'rgba(255, 255, 255, 0.1)', 
                    color: isFavorite(details.id, type) ? 'var(--magenta)' : 'white',
                    border: `1px solid ${isFavorite(details.id, type) ? 'var(--magenta)' : 'rgba(255, 255, 255, 0.2)'}`,
                    display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: '300px'
                  }}
                >
                  <Heart fill={isFavorite(details.id, type) ? 'var(--magenta)' : 'none'} size={22} /> 
                  {isFavorite(details.id, type) ? 'Favorited' : 'Add to Favorites'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Trailer Modal */}
        {showTrailer && (
          <div className="trailer-modal-overlay" onClick={() => setShowTrailer(false)}>
            <div className="trailer-modal-content" onClick={e => e.stopPropagation()}>
              <button className="close-trailer-btn" onClick={() => setShowTrailer(false)}>✖ Close Trailer</button>
              <div className="trailer-video-wrapper">
                <iframe 
                  src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`} 
                  frameBorder="0" 
                  allow="autoplay; encrypted-media" 
                  allowFullScreen
                  title="Trailer"
                ></iframe>
              </div>
            </div>
          </div>
        )}

        {/* Cast */}
        {details.cast?.length > 0 && (
          <section className="cast-section fade-in">
            <h3>Top Cast</h3>
            <div className="cast-list">
              {details.cast.map(c => (
                <div key={c.id} className="cast-card">
                  {c.profile_path ? (
                    <img src={c.profile_path} alt={c.name} className="cast-image" loading="lazy" />
                  ) : (
                    <div className="cast-image placeholder">{c.name[0]}</div>
                  )}
                  <div className="cast-name">{c.name}</div>
                  <div className="cast-character">{c.character}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Screenshots */}
        {details.screenshots?.length > 0 && (
          <section className="screenshots-section fade-in" style={{ marginTop: '3rem' }}>
            <h3>Screenshots</h3>
            <div className="screenshots-grid" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
              gap: '1rem', 
              marginTop: '1rem' 
            }}>
              {details.screenshots.map((src, idx) => (
                <img 
                  key={idx} 
                  src={src} 
                  alt={`${details.title} screenshot ${idx + 1}`} 
                  style={{ width: '100%', borderRadius: '8px', objectFit: 'cover', aspectRatio: '16/9' }} 
                  loading="lazy" 
                />
              ))}
            </div>
          </section>
        )}

        {/* Recommendations */}
        {details.recommendations?.length > 0 && (
          <MediaGrid title="You Might Also Like" items={details.recommendations} layout="slider" />
        )}
      </div>
    </div>
  );
};

export default Details;
