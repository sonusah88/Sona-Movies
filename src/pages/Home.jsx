import React, { useEffect, useState, useMemo } from 'react';
import HeroCarousel from '../components/HeroCarousel';
import MediaGrid from '../components/MediaGrid';
import GenreSlider from '../components/GenreSlider';
import {
  fetchTrending,
  fetchHindiMovies,
  fetchHollywoodMovies,
  fetchHindiDubbedMovies,
  fetchPopularTV,
  fetchTrailer,
  fetchCriticallyAcclaimedMovies
} from '../lib/tmdb';

const SkeletonRow = () => (
  <div className="container" style={{ marginBottom: '3rem' }}>
    <div className="skeleton" style={{ width: 200, height: 28, marginBottom: 16 }}></div>
    <div style={{ display: 'flex', gap: '1rem', overflow: 'hidden' }}>
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="skeleton" style={{ flex: '0 0 180px', aspectRatio: '2/3', borderRadius: 12 }}></div>
      ))}
    </div>
  </div>
);

const Home = () => {
  const [data, setData] = useState({
    trending: [],
    hindi: [],
    hollywood: [],
    hindiDubbed: [],
    tv: [],
    acclaimed: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadAll = async () => {
      try {
        const [trending, hindi, hollywood, southIndianMovies, tv, acclaimed] = await Promise.all([
          fetchTrending(),
          fetchHindiMovies(),
          fetchHollywoodMovies(),
          fetchHindiDubbedMovies(),
          fetchPopularTV(),
          fetchCriticallyAcclaimedMovies()
        ]);

        // Fetch trailers for the top 5 hero items
        const top5 = trending.filter(i => i.backdrop_path).slice(0, 5);
        await Promise.all(
          top5.map(async (item) => {
            const key = await fetchTrailer(item.id, item.media_type || 'movie');
            if (key) item.trailerKey = key;
          })
        );

        if (!cancelled) {
          setData({ 
            trending, 
            hindi, 
            hollywood,
            hindiDubbed: southIndianMovies,
            tv, 
            acclaimed 
          });
        }
      } catch (error) {
        console.error('Failed to load home data:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadAll();
    return () => { cancelled = true; };
  }, []);

  const heroItems = useMemo(
    () => data.trending.filter(i => i.backdrop_path).slice(0, 5),
    [data.trending]
  );

  const trendingMovies = useMemo(
    () => data.trending.filter(i => i.media_type === 'movie'),
    [data.trending]
  );

  const trendingTV = useMemo(
    () => data.trending.filter(i => i.media_type === 'tv'),
    [data.trending]
  );

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ width: '100%', height: '85vh', borderRadius: 0 }}></div>
        <div style={{ marginTop: '2rem' }}>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <HeroCarousel items={heroItems} />

      <div className="home-content-wrapper">
        <GenreSlider />
        <MediaGrid title="🔥 Trending Movies" items={trendingMovies} layout="slider" />
        <MediaGrid title="📺 Trending TV Shows" items={trendingTV} layout="slider" />
        <MediaGrid title="🎬 Bollywood (Hindi)" items={data.hindi} tag="hindi" layout="slider" />
        <MediaGrid title="🌟 Hollywood" items={data.hollywood} tag="hollywood" layout="slider" />
        <MediaGrid title="🎙️ South Indian & Hollywood (Hindi Dubbed)" items={data.hindiDubbed} tag="dubbed" layout="slider" />
        <MediaGrid title="📡 Popular TV Shows" items={data.tv} layout="slider" />
        <MediaGrid title="🏆 Recommendations: Critically Acclaimed" items={data.acclaimed} layout="slider" />
      </div>
    </div>
  );
};

export default Home;
