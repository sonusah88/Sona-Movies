import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import MediaGrid from '../components/MediaGrid';
import { searchMedia } from '../lib/tmdb';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  // Debounce logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      if (query) {
        setSearchParams({ q: query });
      } else {
        setSearchParams({});
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [query, setSearchParams]);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }
    let cancelled = false;
    
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await searchMedia(debouncedQuery);
        if (!cancelled) setResults(data);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    
    loadData();
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  return (
    <div className="container" style={{ paddingTop: '120px', minHeight: '100vh', paddingBottom: '100px' }}>
      
      {/* Massive Cinematic Search Input */}
      <div style={{ marginBottom: '4rem', textAlign: 'center' }}>
        <input 
          type="text" 
          placeholder="What do you want to watch?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          style={{
            width: '100%',
            maxWidth: '800px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '24px',
            padding: '1.5rem 2rem',
            fontSize: 'clamp(1.2rem, 3vw, 2rem)',
            color: 'white',
            outline: 'none',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            transition: 'all 0.3s ease',
            fontFamily: "'Outfit', sans-serif"
          }}
          onFocus={(e) => e.target.style.boxShadow = '0 10px 40px rgba(0,229,255,0.2)'}
          onBlur={(e) => e.target.style.boxShadow = '0 10px 40px rgba(0,0,0,0.5)'}
        />
      </div>

      {debouncedQuery && (
        <h2 style={{ marginBottom: '2rem', fontSize: '1.5rem' }}>
          Results for "<span style={{ color: 'var(--accent)' }}>{debouncedQuery}</span>"
        </h2>
      )}
      
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(130px, 20vw, 220px), 1fr))', gap: 'clamp(1rem, 3vw, 2.5rem)' }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ aspectRatio: '2/3', borderRadius: 12 }}></div>
          ))}
        </div>
      ) : results.length > 0 ? (
        <MediaGrid items={results} layout="grid" />
      ) : debouncedQuery ? (
        <div className="glass" style={{ padding: '4rem', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ marginBottom: '0.75rem' }}>No results found</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            Try searching for a different movie or TV show.
          </p>
        </div>
      ) : (
        <div style={{ textAlign: 'center', opacity: 0.5, marginTop: '4rem' }}>
          <p>Search for movies, TV shows, and more...</p>
        </div>
      )}
    </div>
  );
};

export default Search;
