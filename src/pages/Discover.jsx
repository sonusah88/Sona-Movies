import React, { useEffect, useState } from 'react';
import MediaGrid from '../components/MediaGrid';
import { searchMedia, fetchAnime, fetchKDrama, fetchPakistaniDrama, fetchAdultRomance } from '../lib/tmdb';

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

  useEffect(() => {
    let cancelled = false;

    const loadCollections = async () => {
      try {
        // Fetch dynamic categories
        const anime = await fetchAnime();
        const kDrama = await fetchKDrama();
        const adultRomance = await fetchAdultRomance();
        const pakDrama = await fetchPakistaniDrama();

        const dynamicCollections = [
          { name: "Top Anime Series", items: anime },
          { name: "K-Dramas", items: kDrama },
          { name: "Hot & Romance (18+)", items: adultRomance },
          { name: "Pakistani Dramas", items: pakDrama }
        ];

        // Fetch specific searches
        const specificResults = await Promise.all(
          SPECIFIC_SERIES.map(async (series) => {
            const data = await searchMedia(series);
            return {
              name: series,
              items: data.filter(i => i.poster_path) // only show items with posters
            };
          })
        );
        
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
  }, []);

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
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.2rem', maxWidth: '600px', lineHeight: '1.6', margin: 0 }}>
            Explore a world of endless entertainment. From the best Anime and K-Dramas to your favorite Cartoon and Epic series.
          </p>
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
