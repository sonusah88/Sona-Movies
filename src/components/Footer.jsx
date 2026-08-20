import React from 'react';
import { Coffee, ArrowUp, Film } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-left">
          <div className="footer-brand">
            <Film size={24} color="var(--accent)" />
            <span>SONA Movies</span>
          </div>
          <p className="footer-text">
            Your ultimate destination for discovering and enjoying the best cinematic universes, anime, live TV, and shows. 
          </p>
        </div>
        
        <div className="footer-right">
          <a 
            href="https://buymeacoffee.com/sonamovies" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="footer-support-btn"
            title="Support the site"
          >
            <Coffee size={20} />
            <span>Support Us</span>
          </a>

          <button onClick={scrollToTop} className="scroll-top-btn" aria-label="Scroll to top">
            <ArrowUp size={24} />
          </button>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} SONA Movies. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
