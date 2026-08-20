import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { X, User, Heart, History, LogOut, Users, Sparkles, Upload, ThumbsUp } from 'lucide-react';
import { generateAIAvatar } from '../api/aiMakeover';
import MediaGrid from './MediaGrid';
import './ProfileModal.css';

const ProfileModal = ({ isOpen, onClose }) => {
  const { user, favorites, history, login, signup, logout } = useUser();
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [emailInput, setEmailInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('favorites'); // 'favorites', 'history', 'collab', 'avatar'
  const [avatarImage, setAvatarImage] = useState(null);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [collabMovies, setCollabMovies] = useState([
    { id: 1, title: 'Inception', votes: 42 },
    { id: 2, title: 'The Dark Knight', votes: 38 },
    { id: 3, title: 'Interstellar', votes: 27 },
  ]);

  if (!isOpen) return null;

  const handleAuth = (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    // Email Validation Regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.trim())) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    try {
      if (authMode === 'login') {
        login(emailInput.trim(), passwordInput);
      } else {
        if (!usernameInput.trim()) throw new Error("Username is required");
        signup(usernameInput.trim(), emailInput.trim(), passwordInput);
      }
      setEmailInput('');
      setUsernameInput('');
      setPasswordInput('');
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        {!user ? (
          <div className="auth-container">
            <div className="auth-icon-wrapper">
              <User size={48} color="var(--accent)" />
            </div>
            <h2>{authMode === 'login' ? 'Welcome Back' : 'Join SONA'}</h2>
            <p>{authMode === 'login' ? 'Login to access your history and favorites.' : 'Create an account to save your watch history and favorites.'}</p>
            
            {errorMsg && <div className="auth-error" style={{ color: '#ff3366', marginBottom: '1rem', fontSize: '0.9rem' }}>{errorMsg}</div>}
            
            <form onSubmit={handleAuth} className="auth-form">
              {authMode === 'signup' && (
                <input 
                  type="text" 
                  placeholder="Username" 
                  value={usernameInput}
                  onChange={e => setUsernameInput(e.target.value)}
                  required
                  maxLength={20}
                />
              )}
              <input 
                type="email" 
                placeholder="Email address" 
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                required
              />
              <input 
                type="password" 
                placeholder="Password" 
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                required
                minLength={6}
              />
              <button type="submit" className="btn btn-primary auth-submit">
                {authMode === 'login' ? 'Login' : 'Sign Up'}
              </button>
            </form>
            <div style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>
              {authMode === 'login' ? (
                <>Don't have an account? <span style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={() => { setAuthMode('signup'); setErrorMsg(''); }}>Sign Up</span></>
              ) : (
                <>Already have an account? <span style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={() => { setAuthMode('login'); setErrorMsg(''); }}>Login</span></>
              )}
            </div>
          </div>
        ) : (
          <div className="profile-dashboard">
            <div className="profile-header">
              <div className="profile-user-info">
                <div className="profile-avatar">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3>{user.username}</h3>
                  <p>SONA Member</p>
                </div>
              </div>
              <button onClick={logout} className="btn-logout" title="Logout">
                <LogOut size={18} />
              </button>
            </div>

            <div className="profile-tabs" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button 
                className={`tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
                onClick={() => setActiveTab('favorites')}
              >
                <Heart size={16} /> Favorites
              </button>
              <button 
                className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                <History size={16} /> History
              </button>
              <button 
                className={`tab-btn ${activeTab === 'collab' ? 'active' : ''}`}
                onClick={() => setActiveTab('collab')}
              >
                <Users size={16} /> Watchlists
              </button>
              <button 
                className={`tab-btn ${activeTab === 'avatar' ? 'active' : ''}`}
                onClick={() => setActiveTab('avatar')}
              >
                <Sparkles size={16} /> AI Avatar
              </button>
            </div>

            <div className="profile-tab-content">
              {activeTab === 'favorites' && (
                favorites.length > 0 ? (
                  <div className="profile-grid">
                    <MediaGrid items={favorites} layout="grid" />
                  </div>
                ) : (
                  <div className="empty-state">
                    <Heart size={48} opacity={0.2} />
                    <p>No favorites yet. Save movies and shows you love!</p>
                  </div>
                )
              )}

              {activeTab === 'history' && (
                history.length > 0 ? (
                  <div className="profile-grid">
                    <MediaGrid items={history} layout="grid" />
                  </div>
                ) : (
                  <div className="empty-state">
                    <History size={48} opacity={0.2} />
                    <p>Your watch history is empty. Start watching!</p>
                  </div>
                )
              )}

              {activeTab === 'collab' && (
                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '16px' }}>
                  <h3 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Neighborhood Shared Watchlist</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {collabMovies.map((movie) => (
                      <div key={movie.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '12px' }}>
                        <span style={{ fontWeight: 600 }}>{movie.title}</span>
                        <button 
                          className="btn btn-secondary" 
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem' }}
                          onClick={() => {
                            setCollabMovies(collabMovies.map(m => m.id === movie.id ? { ...m, votes: m.votes + 1 } : m))
                          }}
                        >
                          <ThumbsUp size={16} color="var(--accent)" /> {movie.votes}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'avatar' && (
                <div style={{ padding: '1.5rem', background: 'rgba(138, 43, 226, 0.1)', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(138, 43, 226, 0.2)' }}>
                  <Sparkles size={48} color="var(--accent)" style={{ marginBottom: '1rem' }} />
                  <h3 style={{ marginBottom: '0.5rem' }}>AI Avatar Makeover</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Upload a selfie to get a retro 80s makeover!</p>
                  
                  {!avatarImage ? (
                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed rgba(255,255,255,0.2)', padding: '2rem', borderRadius: '12px', cursor: 'pointer', background: 'rgba(0,0,0,0.2)' }}>
                      <Upload size={32} style={{ marginBottom: '1rem', opacity: 0.7 }} />
                      <span>{isGeneratingAvatar ? "Generating..." : "Click to Upload Selfie"}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        style={{ display: 'none' }} 
                        disabled={isGeneratingAvatar}
                        onChange={async (e) => {
                          if (e.target.files && e.target.files[0]) {
                            setIsGeneratingAvatar(true);
                            try {
                              const res = await generateAIAvatar("dummy_base64");
                              setAvatarImage(res.imageUrl);
                            } catch (err) {
                              alert("Generation failed");
                            } finally {
                              setIsGeneratingAvatar(false);
                            }
                          }
                        }}
                      />
                    </label>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <img src={avatarImage} alt="AI Generated Avatar" style={{ width: '150px', height: '150px', borderRadius: '50%', border: '4px solid var(--accent)', marginBottom: '1rem' }} />
                      <button className="btn btn-secondary" onClick={() => setAvatarImage(null)}>Try Another</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileModal;
