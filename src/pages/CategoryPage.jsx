import React, { useEffect, useState } from 'react';
import MediaGrid from '../components/MediaGrid';
import { fetchTrending, fetchPopularTV, fetchByGenre, fetchNewAndUpcoming } from '../lib/tmdb';
import { useParams } from 'react-router-dom';
import './CategoryPage.css';

const CategoryPage = ({ type }) => {
  const { id: genreId, name: genreName } = useParams();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const loadData = async () => {
      try {
        let results = [];
        
        if (type === 'movies') {
          // Fetch multiple pages of movies to make a large grid
          const page1 = await fetchTrending(1);
          const page2 = await fetchTrending(2);
          const page3 = await fetchTrending(3);
          results = [...page1, ...page2, ...page3].filter(item => item.media_type === 'movie' || !item.media_type).map(i => ({...i, media_type: 'movie'}));
        } 
        else if (type === 'tv') {
          const page1 = await fetchPopularTV(1);
          const page2 = await fetchPopularTV(2);
          const page3 = await fetchPopularTV(3);
          results = [...page1, ...page2, ...page3].map(i => ({...i, media_type: 'tv'}));
        }
        else if (type === 'new-releases') {
          const page1 = await fetchNewAndUpcoming(1);
          const page2 = await fetchNewAndUpcoming(2);
          const page3 = await fetchNewAndUpcoming(3);
          results = [...page1, ...page2, ...page3];
        }
        else if (type === 'genre') {
          const page1 = await fetchByGenre(genreId, 1);
          const page2 = await fetchByGenre(genreId, 2);
          const page3 = await fetchByGenre(genreId, 3);
          results = [...page1, ...page2, ...page3];
        }

        if (!cancelled) {
          // Remove duplicates
          const uniqueResults = Array.from(new Set(results.map(a => a.id))).map(id => {
            return results.find(a => a.id === id)
          });
          setData(uniqueResults);
        }
      } catch (error) {
        console.error('Failed to load category data:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();
    return () => { cancelled = true; };
  }, [type, genreId]);

  const getTitle = () => {
    switch (type) {
      case 'movies': return '🎬 Discover Movies';
      case 'tv': return '📺 Popular TV Shows';
      case 'hindi-dubbed': return '🎙️ South Indian (Hindi Dubbed)';
      case 'new-releases': return '🔥 New & Upcoming Releases';
      case 'genre': return `🍿 ${decodeURIComponent(genreName || 'Movies')}`;
      default: return 'Explore';
    }
  };

  const getTag = () => {
    switch (type) {
      case 'movies': return 'movies';
      case 'tv': return 'tv';
      case 'hindi-dubbed': return 'dubbed';
      case 'new-releases': return 'new';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="category-page" style={{ paddingTop: '100px' }}>
        <div className="container">
          <div className="skeleton" style={{ width: 300, height: 40, marginBottom: '2rem' }}></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '2rem' }}>
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ aspectRatio: '2/3', borderRadius: 12 }}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="category-page fade-in">
      <div className="category-header">
        {/* Adds spacing below the navbar */}
      </div>
      <MediaGrid title={getTitle()} items={data} tag={getTag()} />
    </div>
  );
};

export default CategoryPage;
