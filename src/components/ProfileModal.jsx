import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { X, User, Heart, History, LogOut } from 'lucide-react';
import MediaGrid from './MediaGrid';
import './ProfileModal.css';

const ProfileModal = ({ isOpen, onClose }) => {
  const { user, favorites, history, login, signup, logout } = useUser();
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [emailInput, setEmailInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('favorites'); // 'favorites' or 'history'

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

            <div className="profile-tabs">
              <button 
                className={`tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
                onClick={() => setActiveTab('favorites')}
              >
                <Heart size={16} /> My Favorites
              </button>
              <button 
                className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                <History size={16} /> Watch History
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileModal;
