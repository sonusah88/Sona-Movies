import React, { useState, useEffect, useTransition, useDeferredValue } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SearchFederator } from '../../lib/libraryProviders';
import BookCard from '../../components/Library/BookCard';
import { Search, Filter, ArrowLeft, Loader } from 'lucide-react';
import './Library.css';

const LibrarySearch = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const initialQuery = queryParams.get('q') || '';

  // Local input state — updates immediately so typing is never blocked
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // useTransition: marks the results state update as non-urgent.
  // React will keep the UI responsive during the expensive re-render.
  const [isPending, startTransition] = useTransition();

  // useDeferredValue: the book grid reads from this deferred copy.
  // While a new search is loading, the previous results stay visible.
  const deferredResults = useDeferredValue(results);

  useEffect(() => {
    const performSearch = async () => {
      if (initialQuery) {
        setLoading(true);
        window.scrollTo(0, 0);
        try {
          const fetchedResults = await SearchFederator.search(initialQuery, 8000);
          // Wrap the state update in startTransition — React can interrupt
          // this render if the user types something else.
          startTransition(() => {
            setResults(fetchedResults);
            setHasSearched(true);
          });
        } catch (error) {
          console.error('Search failed:', error);
          setHasSearched(true);
        } finally {
          setLoading(false);
        }
      }
    };
    performSearch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/library/search?q=${encodeURIComponent(query)}`);
    }
  };

  // Show a subtle stale indicator while the deferred value is catching up
  const isStale = deferredResults !== results;

  return (
    <div className="library-container fade-in">
      <button
        className="back-button"
        onClick={() => navigate('/library')}
        style={{ background: 'transparent', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '20px' }}
      >
        <ArrowLeft size={20} /> Back to Library
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <h1 style={{ fontSize: '2rem', margin: 0 }}>Search Results</h1>

        <form className="library-search-bar" onSubmit={handleSearch} style={{ margin: 0, width: '100%', maxWidth: '400px' }}>
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search books, authors..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ padding: '8px' }}
          />
          <button type="submit" style={{ padding: '8px 15px' }}>Search</button>
        </form>
      </div>

      <div style={{ display: 'flex', gap: '30px' }}>
        {/* Filters Sidebar */}
        <div style={{ width: '250px', flexDirection: 'column', gap: '20px', display: window.innerWidth > 768 ? 'flex' : 'none' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '10px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', marginBottom: '15px' }}>
              <Filter size={18} /> Filters
            </h3>
            <div style={{ marginBottom: '15px' }}>
              <h4 style={{ color: '#a1a1aa', marginBottom: '10px', fontSize: '0.9rem' }}>Availability</h4>
              <label style={{ display: 'flex', gap: '10px', marginBottom: '5px', fontSize: '0.9rem' }}><input type="checkbox" /> Read Free</label>
              <label style={{ display: 'flex', gap: '10px', marginBottom: '5px', fontSize: '0.9rem' }}><input type="checkbox" /> Borrow</label>
            </div>
          </div>
        </div>

        {/* Results Grid — reads from deferredResults so it never blocks typing */}
        <div style={{ flex: 1, minHeight: '400px', opacity: isStale || isPending ? 0.6 : 1, transition: 'opacity 0.2s' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#a1a1aa' }}>
              <Loader size={40} className="spinner" style={{ animation: 'spin 1s linear infinite', marginBottom: '20px' }} />
              <p>Searching multiple libraries globally...</p>
            </div>
          ) : deferredResults.length > 0 ? (
            <div className="fade-in">
              <p style={{ color: '#a1a1aa', marginBottom: '20px' }}>
                Found {deferredResults.length} unified results for "{initialQuery}"
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '25px' }}>
                {deferredResults.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            </div>
          ) : hasSearched ? (
            <div className="fade-in" style={{ textAlign: 'center', padding: '50px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
              <h2>No books found</h2>
              <p style={{ color: '#a1a1aa' }}>Try adjusting your search terms or filters.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default LibrarySearch;


