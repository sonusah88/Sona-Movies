import React, { useEffect, useState } from 'react';
import MediaGrid from '../components/MediaGrid';
import { searchMedia, fetchAnime, fetchKDrama, fetchPakistaniDrama, fetchAdultRomance, fetchHollywoodMovies, fetchHindiMovies, fetchBhojpuriMovies } from '../lib/tmdb';

const SPECIFIC_SERIES = [
  "Motu Patlu",
  "Oggy and the Cockroaches",
  "Pakdam Pakdai",
  "Ramayan",
  "Mahabharat",
  "Chhota Bheem",
  "Shin Chan",
  "Doraemon",
  "Tom and Jerry",
  "Mr. Bean",
  "Peppa Pig",
  "SpongeBob SquarePants",
  "Pokemon",
  "Dragon Ball Z",
  "One Piece",
  "Death Note",
  "Naruto"
];

const Discover = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [industryFilter, setIndustryFilter] = useState('all'); // 'all', 'hollywood', 'indian'

  useEffect(() => {
    let cancelled = false;

    const loadCollections = async () => {
      setLoading(true);
      try {
        let dynamicCollections = [];
        let specificResults = [];

        if (industryFilter === 'all') {
          const anime = await fetchAnime();
          const kDrama = await fetchKDrama();
          const adultRomance = await fetchAdultRomance();
          const pakDrama = await fetchPakistaniDrama();
          
          dynamicCollections = [
            { name: "Top Anime Series", items: anime },
            { name: "K-Dramas", items: kDrama },
            { name: "Hot & Romance (18+)", items: adultRomance },
            { name: "Pakistani Dramas", items: pakDrama }
          ];

          specificResults = await Promise.all(
            SPECIFIC_SERIES.map(async (series) => {
              const data = await searchMedia(series);
              return { name: series, items: data.filter(i => i.poster_path) };
            })
          );
        } else if (industryFilter === 'hollywood') {
          const hw1 = await fetchHollywoodMovies(1);
          const hw2 = await fetchHollywoodMovies(2);
          const hw3 = await fetchHollywoodMovies(3);
          dynamicCollections = [
            { name: "Top Hollywood Hits", items: hw1 },
            { name: "Hollywood Blockbusters", items: hw2 },
            { name: "Critically Acclaimed (Hollywood)", items: hw3 }
          ];
        } else if (industryFilter === 'indian') {
          const hindi = await fetchHindiMovies();
          const bhojpuri = await fetchBhojpuriMovies();
          dynamicCollections = [
            { name: "Top Bollywood Movies", items: hindi },
            { name: "Bhojpuri Hits", items: bhojpuri }
          ];
        }
        
        if (!cancelled) {
          setCollections([...dynamicCollections, ...specificResults]);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to load collections:', error);
        if (!cancelled) setLoading(false);
      }
    };

    loadCollections();
    return () => { cancelled = true; };
  }, [industryFilter]);

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '6rem', minHeight: '100vh' }}>
        <h1 style={{ color: 'white', marginBottom: '2rem' }}>🌍 Discover</h1>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ marginBottom: '3rem' }}>
            <div className="skeleton" style={{ width: 200, height: 28, marginBottom: 16 }}></div>
            <div style={{ display: 'flex', gap: '1rem', overflow: 'hidden' }}>
              {Array.from({ length: 6 }).map((_, j) => (
                <div key={j} className="skeleton" style={{ flex: '0 0 180px', aspectRatio: '2/3', borderRadius: 12 }}></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Hero Banner */}
      <div style={{ 
        paddingTop: '8rem', 
        paddingBottom: '4rem', 
        background: 'linear-gradient(135deg, rgba(20,22,30,1) 0%, rgba(138,43,226,0.15) 100%)',
        borderBottom: '1px solid rgba(138, 43, 226, 0.2)',
        marginBottom: '3rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Abstract background blobs */}
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: '#8a2be2', filter: 'blur(100px)', opacity: 0.2, borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', bottom: '-50px', left: '10%', width: '200px', height: '200px', background: '#00d2ff', filter: 'blur(80px)', opacity: 0.15, borderRadius: '50%' }}></div>

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ background: 'rgba(138, 43, 226, 0.2)', padding: '1rem', borderRadius: '16px', display: 'flex' }}>
              <span style={{ fontSize: '2.5rem', lineHeight: 1 }}>🌍</span>
            </div>
            <h1 style={{ color: 'white', fontSize: '3rem', fontWeight: '900', margin: 0, textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
              Discover
            </h1>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.2rem', maxWidth: '600px', lineHeight: '1.6', margin: 0, marginBottom: '2rem' }}>
            Explore a world of endless entertainment. Tailor your feed to your favorite industry.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              className={`btn ${industryFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setIndustryFilter('all')}
            >Global All</button>
            <button 
              className={`btn ${industryFilter === 'hollywood' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setIndustryFilter('hollywood')}
            >Top Hollywood Releases</button>
            <button 
              className={`btn ${industryFilter === 'indian' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setIndustryFilter('indian')}
            >Top Indian Movies</button>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: '4rem' }}>
        {collections.map((collection, index) => {
          if (collection.items.length === 0) return null;
          return (
            <div key={index} style={{ marginBottom: '1rem' }}>
              <MediaGrid 
                title={collection.name} 
                items={collection.items} 
                layout="slider" 
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Discover;
