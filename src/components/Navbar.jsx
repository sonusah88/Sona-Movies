import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Film, Tv, Globe, User, Menu, X, Coffee, Star, Compass, Home as HomeIcon, PlaySquare, BookOpen } from 'lucide-react';
import ProfileModal from './ProfileModal';
import './Navbar.css';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
      setSearchQuery('');
    }
  }, [searchQuery, navigate]);

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container container">
        <Link to="/" className="navbar-brand">
          <img src="/logo.png" alt="SONA Movie Logo" className="brand-logo-img" />
        </Link>
        
        <nav className="navbar-links">
          <Link to="/discover" className="nav-link"><Compass size={18}/> Discover</Link>
          <Link to="/tv" className="nav-link"><Tv size={18}/> TV Shows</Link>
          <Link to="/new-releases" className="nav-link"><Globe size={18}/> New</Link>
          <Link to="/shorts" className="nav-link"><PlaySquare size={18}/> Shorts</Link>
          <Link to="/library" className="nav-link" style={{ color: '#fbbf24' }}><BookOpen size={18}/> Library</Link>
          <Link to="/live" className="nav-link live-tv-link"><Tv size={18}/> Live TV</Link>
        </nav>

        <div className="navbar-actions">
          <form className="search-form" onSubmit={handleSearch}>
            <button type="submit" className="search-btn" aria-label="Search">
              <Search size={16} />
            </button>
            <input 
              type="text" 
              placeholder="Search movies, shows..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </form>
          <Link to="/best-for-you" className="best-for-you-link" title="Best For You">
            <Star size={18} /> <span>Best For You</span>
          </Link>

          <button 
            className="profile-btn" 
            aria-label="Profile"
            onClick={() => setIsProfileModalOpen(true)}
          >
            <User size={18} />
          </button>
          
          <button 
            className="mobile-menu-btn" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        <Link to="/discover" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}><Compass size={18}/> Discover</Link>
        <Link to="/tv" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}><Tv size={18}/> TV Shows</Link>
        <Link to="/new-releases" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}><Globe size={18}/> New</Link>
        <Link to="/shorts" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}><PlaySquare size={18}/> Shorts</Link>
        <Link to="/library" className="mobile-nav-link" style={{ color: '#fbbf24' }} onClick={() => setIsMobileMenuOpen(false)}><BookOpen size={18}/> Library</Link>
        <Link to="/live" className="mobile-nav-link live-tv-link" onClick={() => setIsMobileMenuOpen(false)}><Tv size={18}/> Live TV</Link>
        <Link to="/best-for-you" className="mobile-nav-link best-for-you-link-mobile" onClick={() => setIsMobileMenuOpen(false)}>
          <Star size={18} /> <span>Best For You</span>
        </Link>
      </div>


      {/* Profile/Auth Modal */}
      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </nav>
  );
};

export default React.memo(Navbar);
