import React, { useEffect, useState } from 'react';
import MediaGrid from '../components/MediaGrid';
import { searchMedia } from '../lib/tmdb';

const FRANCHISES = [
  "Avengers",
  "Iron Man",
  "Captain America",
  "Thor",
  "Guardians of the Galaxy",
  "Spider-Man",
  "Doctor Strange",
  "Black Panther",
  "Ant-Man",
  "Deadpool",
  "Justice League",
  "Batman",
  "Superman",
  "Wonder Woman",
  "Aquaman",
  "The Flash",
  "Suicide Squad",
  "X-Men",
  "Harry Potter",
  "Star Wars",
  "Fast and Furious",
  "Transformers",
  "Jurassic Park",
  "Mission Impossible",
  "Lord of the Rings",
  "Pirates of the Caribbean",
  "The Matrix",
  "John Wick",
  "The Hunger Games",
  "James Bond"
];

const BestForYou = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadCollections = async () => {
      try {
        const results = await Promise.all(
          FRANCHISES.map(async (franchise) => {
            const data = await searchMedia(franchise);
            return {
              name: franchise,
              items: data
                .filter(i => i.poster_path) // only show items with posters
                .sort((a, b) => new Date(b.date || '1970-01-01') - new Date(a.date || '1970-01-01')) // Sort by release date, newest first
            };
          })
        );
        
        if (!cancelled) {
          setCollections(results);
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
        <h1 style={{ color: 'white', marginBottom: '2rem' }}>✨ Best For You</h1>
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
        background: 'linear-gradient(135deg, rgba(20,22,30,1) 0%, rgba(255,180,0,0.15) 100%)',
        borderBottom: '1px solid rgba(255, 180, 0, 0.2)',
        marginBottom: '3rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Abstract background blobs */}
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: '#ffb400', filter: 'blur(100px)', opacity: 0.2, borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', bottom: '-50px', left: '10%', width: '200px', height: '200px', background: '#e52e71', filter: 'blur(80px)', opacity: 0.15, borderRadius: '50%' }}></div>

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ background: 'rgba(255, 180, 0, 0.2)', padding: '1rem', borderRadius: '16px', display: 'flex' }}>
              <span style={{ fontSize: '2.5rem', lineHeight: 1 }}>✨</span>
            </div>
            <h1 style={{ color: 'white', fontSize: '3rem', fontWeight: '900', margin: 0, textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
              Best For You
            </h1>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.2rem', maxWidth: '600px', lineHeight: '1.6', margin: 0 }}>
            A specially curated collection of the greatest cinematic universes, featuring the complete Marvel and DC libraries, organized chronologically for the ultimate viewing experience.
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: '4rem' }}>
        {collections.map((collection, index) => {
        if (collection.items.length === 0) return null;
        return (
          <div key={index} style={{ marginBottom: '1rem' }}>
            <MediaGrid 
              title={`${collection.name} Series`} 
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

export default BestForYou;
