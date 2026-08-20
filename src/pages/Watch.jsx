import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, ChevronRight, ChevronLeft, ListVideo } from 'lucide-react';
import VidkingPlayer from '../components/VidkingPlayer';
import { fetchDetails, fetchSeasonDetails } from '../lib/tmdb';
import { useUser } from '../context/UserContext';
import './Watch.css';
import './Details.css';

const Watch = () => {
  const { type, id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToHistory } = useUser();
  const season = parseInt(searchParams.get('s')) || 1;
  const episode = parseInt(searchParams.get('e')) || 1;

  const [details, setDetails] = useState(null);
  const [seasonData, setSeasonData] = useState(null);
  const [loadingSeason, setLoadingSeason] = useState(false);
  const episodesRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    
    if (type === 'youtube') {
      const ytTitle = searchParams.get('title') || 'YouTube Video';
      setDetails({ title: ytTitle });
      return;
    }

    const loadDetails = async () => {
      try {
        const data = await fetchDetails(id, type);
        if (!cancelled) {
          setDetails(data);
          addToHistory({ ...data, media_type: type });
        }
      } catch (error) {
        console.error('Failed to load details:', error);
      }
    };
    loadDetails();
    return () => { cancelled = true; };
  }, [id, type, searchParams]);

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

  const handlePlayEpisode = (epNum) => {
    navigate(`/watch/tv/${id}?s=${season}&e=${epNum}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasNextEpisode = seasonData?.episodes && episode < seasonData.episodes.length;
  const hasPrevEpisode = episode > 1;

  return (
    <div className="watch-page fade-in">
      <div className="watch-header container">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Back
        </button>
        
        {details && (
          <h1 className="watch-title">
            {details.title}
            {type === 'tv' && <span className="watch-subtitle"> — S{season} E{episode}</span>}
          </h1>
        )}
      </div>

      <div className="watch-container container">
        <div className="player-wrapper">
          <VidkingPlayer 
            tmdbId={id} 
            type={type} 
            season={season} 
            episode={episode} 
            title={details?.title || ''}
            isHindi={['hi', 'te', 'ta', 'ml', 'kn'].includes(details?.original_language)}
          />
        </div>
        
        {type === 'tv' && (
          <div className="watch-episodes-section" ref={episodesRef}>
            <div className="episode-navigation">
              <button 
                className="btn btn-secondary" 
                disabled={!hasPrevEpisode}
                onClick={() => handlePlayEpisode(episode - 1)}
                style={{ opacity: hasPrevEpisode ? 1 : 0.5, cursor: hasPrevEpisode ? 'pointer' : 'not-allowed' }}
              >
                <ChevronLeft size={20} /> Previous Episode
              </button>
              
              <div className="current-episode-badge">
                <ListVideo size={18} /> Season {season}
              </div>
              
              <button 
                className="btn btn-primary" 
                disabled={!hasNextEpisode}
                onClick={() => handlePlayEpisode(episode + 1)}
                style={{ opacity: hasNextEpisode ? 1 : 0.5, cursor: hasNextEpisode ? 'pointer' : 'not-allowed' }}
              >
                Next Episode <ChevronRight size={20} />
              </button>
            </div>

            <div className="episodes-window" style={{ marginTop: '2rem' }}>
              <h3 className="episodes-title">Episodes</h3>
              {loadingSeason ? (
                <div className="episodes-loading">Loading episodes...</div>
              ) : seasonData?.episodes?.length > 0 ? (
                <div className="episodes-list">
                  {seasonData.episodes.map(ep => {
                    const isCurrent = ep.episode_number === episode;
                    return (
                      <div 
                        key={ep.id} 
                        className="episode-card" 
                        onClick={() => !isCurrent && handlePlayEpisode(ep.episode_number)}
                        style={isCurrent ? { borderLeft: '4px solid var(--accent)', background: 'rgba(255, 0, 85, 0.05)' } : {}}
                      >
                        <div className="episode-thumbnail-wrapper">
                          {ep.still_path ? (
                            <img src={ep.still_path} alt={ep.name} className="episode-thumbnail" loading="lazy" />
                          ) : (
                            <div className="episode-thumbnail-placeholder"><Play size={24} /></div>
                          )}
                          <div className="episode-play-overlay">
                            {isCurrent ? <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>PLAYING</span> : <Play size={24} fill="white" />}
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
                    );
                  })}
                </div>
              ) : (
                <div className="episodes-empty">No episodes found.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Watch;
