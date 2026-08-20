import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchFederator } from '../../lib/libraryProviders';
import BookCard from '../../components/Library/BookCard';
import './Library.css';
import { Search, BookOpen, TrendingUp, Loader } from 'lucide-react';

const LIBRARY_CATEGORIES = [
  { id: 'fiction', name: 'Fiction', icon: '✨' },
  { id: 'science', name: 'Science', icon: '🔬' },
  { id: 'history', name: 'History', icon: '🏛️' },
  { id: 'fantasy', name: 'Fantasy', icon: '🐉' },
  { id: 'mystery', name: 'Mystery', icon: '🔍' },
  { id: 'biography', name: 'Biography', icon: '👤' },
  { id: 'philosophy', name: 'Philosophy', icon: '🤔' },
  { id: 'technology', name: 'Technology', icon: '💻' }
];

const LibraryHome = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  const [trendingBooks, setTrendingBooks] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [quote, setQuote] = useState(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        // Fire parallel API requests
        const [trending, newest, quoteRes] = await Promise.all([
          SearchFederator.search('popular'),
          SearchFederator.search('classics'),
          fetch('https://dummyjson.com/quotes/random').then(r => r.json()).catch(() => null)
        ]);
        setTrendingBooks(trending);
        setNewArrivals(newest);
        if (quoteRes && quoteRes.quote) {
          setQuote({ text: quoteRes.quote, author: quoteRes.author });
        }
      } catch (error) {
        console.error("Failed to fetch home books:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/library/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="library-container fade-in">
      {/* Hero Section */}
      <section className="library-hero">
        <div className="library-hero-content">
          <h1>The World's Knowledge,<br />One Library.</h1>
          <p>Explore books, novels, and knowledge from real global libraries — 100% readable inside the app.</p>
          
          <form className="library-search-bar" onSubmit={handleSearch}>
            <Search className="search-icon" size={20} />
            <input 
              type="text" 
              placeholder="Search books, authors, subjects..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>
          
          {quote && (
            <div className="daily-quote fade-in" style={{
              background: 'rgba(255,255,255,0.05)',
              borderLeft: '4px solid #3b82f6',
              padding: '15px 20px',
              borderRadius: '0 8px 8px 0',
              marginTop: '30px',
              maxWidth: '600px',
              fontStyle: 'italic'
            }}>
              <p style={{ margin: '0 0 10px 0', color: '#e5e5e5', fontSize: '1.1rem' }}>"{quote.text}"</p>
              <span style={{ color: '#a1a1aa', fontSize: '0.9rem', fontWeight: 'bold' }}>— {quote.author}</span>
            </div>
          )}
          
          <div className="hero-actions" style={{ marginTop: '30px' }}>
            <button className="btn-primary" onClick={() => document.getElementById('trending').scrollIntoView({behavior: 'smooth'})}>
              <TrendingUp size={16} /> Trending Now
            </button>
            <button className="btn-secondary" onClick={() => document.getElementById('categories').scrollIntoView({behavior: 'smooth'})}>
              <BookOpen size={16} /> Browse Categories
            </button>
          </div>
        </div>
      </section>

      {/* Trending Books */}
      <section id="trending" className="library-section">
        <div className="section-header">
          <h2>🔥 Trending Books</h2>
          <button className="view-all">View All</button>
        </div>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Loader className="spinner" size={30} style={{ animation: 'spin 1s linear infinite', color: '#a1a1aa' }}/></div>
        ) : (
          <div className="horizontal-book-list">
            {trendingBooks.map(book => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </section>

      {/* New Arrivals */}
      <section className="library-section">
        <div className="section-header">
          <h2>✨ Classics Collection</h2>
          <button className="view-all">View All</button>
        </div>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Loader className="spinner" size={30} style={{ animation: 'spin 1s linear infinite', color: '#a1a1aa' }}/></div>
        ) : (
          <div className="horizontal-book-list">
            {newArrivals.map(book => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </section>

      {/* Categories */}
      <section id="categories" className="library-section">
        <h2>📚 Popular Categories</h2>
        <div className="category-grid">
          {LIBRARY_CATEGORIES.map(category => (
            <div key={category.id} className="category-card" onClick={() => navigate(`/library/search?q=${category.id}`)}>
              <span className="category-icon">{category.icon}</span>
              <h3>{category.name}</h3>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default LibraryHome;
