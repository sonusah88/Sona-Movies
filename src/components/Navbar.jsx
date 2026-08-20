import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search, Tv, Globe, User, Menu, X,
  Star, Compass, PlaySquare, BookOpen, Languages,
} from "lucide-react";
import ProfileModal from "./ProfileModal";
import { useLang } from "../context/LangContext";
import { LANGUAGES } from "../lib/i18n";
import "./Navbar.css";

const Navbar = () => {
  const [scrolled, setScrolled]             = useState(false);
  const [searchQuery, setSearchQuery]       = useState("");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen]     = useState(false);
  const [isLangOpen, setIsLangOpen]         = useState(false);
  const langDropdownRef                     = useRef(null);
  const navigate = useNavigate();
  const { lang, changeLang, t } = useLang();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close lang dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = useCallback(
    (e) => {
      e.preventDefault();
      const q = searchQuery.trim();
      if (q) {
        navigate(`/search?q=${encodeURIComponent(q)}`);
        setSearchQuery("");
      }
    },
    [searchQuery, navigate]
  );

  const currentLang = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="navbar-container container">
        <Link to="/" className="navbar-brand">
          <img src="/logo.png" alt="SONA Movie Logo" className="brand-logo-img" />
        </Link>

        <nav className="navbar-links">
          <Link to="/discover"     className="nav-link"><Compass size={18} /> {t("discover")}</Link>
          <Link to="/tv"           className="nav-link"><Tv size={18} /> {t("tvShows")}</Link>
          <Link to="/new-releases" className="nav-link"><Globe size={18} /> {t("newReleases")}</Link>
          <Link to="/shorts"       className="nav-link"><PlaySquare size={18} /> {t("shorts")}</Link>
          <Link to="/library"      className="nav-link" style={{ color: "#fbbf24" }}><BookOpen size={18} /> {t("library")}</Link>
          <Link to="/live"         className="nav-link live-tv-link"><Tv size={18} /> {t("liveTV")}</Link>
        </nav>

        <div className="navbar-actions">
          <form className="search-form" onSubmit={handleSearch}>
            <button type="submit" className="search-btn" aria-label="Search">
              <Search size={16} />
            </button>
            <input
              type="text"
              placeholder={t("search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </form>

          <Link to="/best-for-you" className="best-for-you-link" title={t("bestForYou")}>
            <Star size={18} /> <span>{t("bestForYou")}</span>
          </Link>

          {/* ── Language switcher ──────────────────────────────────────── */}
          <div className="lang-switcher" ref={langDropdownRef}>
            <button
              className="lang-btn"
              onClick={() => setIsLangOpen(!isLangOpen)}
              aria-label="Change language"
              title="Language"
            >
              <Languages size={16} />
              <span className="lang-label">{currentLang.flag} {currentLang.label}</span>
            </button>

            {isLangOpen && (
              <div className="lang-dropdown glass">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    className={`lang-option ${l.code === lang ? "active" : ""}`}
                    onClick={() => { changeLang(l.code); setIsLangOpen(false); }}
                  >
                    <span className="lang-flag">{l.flag}</span>
                    <span className="lang-native">{l.native}</span>
                    {l.code === lang && <span className="lang-check">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

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
      <div className={`mobile-menu ${isMobileMenuOpen ? "open" : ""}`}>
        <Link to="/discover"     className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}><Compass size={18} /> {t("discover")}</Link>
        <Link to="/tv"           className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}><Tv size={18} /> {t("tvShows")}</Link>
        <Link to="/new-releases" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}><Globe size={18} /> {t("newReleases")}</Link>
        <Link to="/shorts"       className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}><PlaySquare size={18} /> {t("shorts")}</Link>
        <Link to="/library"      className="mobile-nav-link" style={{ color: "#fbbf24" }} onClick={() => setIsMobileMenuOpen(false)}><BookOpen size={18} /> {t("library")}</Link>
        <Link to="/live"         className="mobile-nav-link live-tv-link" onClick={() => setIsMobileMenuOpen(false)}><Tv size={18} /> {t("liveTV")}</Link>
        <Link to="/best-for-you" className="mobile-nav-link best-for-you-link-mobile" onClick={() => setIsMobileMenuOpen(false)}>
          <Star size={18} /> <span>{t("bestForYou")}</span>
        </Link>

        {/* Mobile language switcher */}
        <div className="mobile-lang-row">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              className={`mobile-lang-btn ${l.code === lang ? "active" : ""}`}
              onClick={() => { changeLang(l.code); setIsMobileMenuOpen(false); }}
            >
              {l.flag} {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Profile / Auth Modal */}
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </nav>
  );
};

export default React.memo(Navbar);
