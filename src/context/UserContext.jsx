import React, { createContext, useState, useEffect, useContext } from 'react';

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);

  // Load from local storage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('sona_user');
    const savedFavorites = localStorage.getItem('sona_favorites');
    const savedHistory = localStorage.getItem('sona_history');

    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  // Save to local storage when state changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('sona_user', JSON.stringify(user));
      localStorage.setItem('sona_favorites', JSON.stringify(favorites));
      localStorage.setItem('sona_history', JSON.stringify(history));
    } else {
      localStorage.removeItem('sona_user');
      localStorage.removeItem('sona_favorites');
      localStorage.removeItem('sona_history');
    }
  }, [user, favorites, history]);

  const signup = (username, email, password) => {
    const existingAccounts = JSON.parse(localStorage.getItem('sona_accounts') || '[]');
    if (existingAccounts.some(acc => acc.email === email)) {
      throw new Error("Email already registered!");
    }
    const newUser = { username, email, password };
    existingAccounts.push(newUser);
    localStorage.setItem('sona_accounts', JSON.stringify(existingAccounts));
    
    // Auto login
    setUser({ username, email });
  };

  const login = (email, password) => {
    const existingAccounts = JSON.parse(localStorage.getItem('sona_accounts') || '[]');
    const account = existingAccounts.find(acc => acc.email === email && acc.password === password);
    if (!account) {
      throw new Error("Invalid email or password!");
    }
    setUser({ username: account.username, email: account.email });
  };

  const logout = () => {
    setUser(null);
    setFavorites([]);
    setHistory([]);
  };

  const toggleFavorite = (media) => {
    if (!user) return false;
    
    setFavorites(prev => {
      const exists = prev.find(item => item.id === media.id && item.media_type === media.media_type);
      if (exists) {
        return prev.filter(item => !(item.id === media.id && item.media_type === media.media_type));
      } else {
        // limit favorites to 100 items to prevent huge local storage
        return [media, ...prev].slice(0, 100);
      }
    });
    return true; // Return true on success
  };

  const addToHistory = (media) => {
    if (!user) return;
    
    setHistory(prev => {
      // Remove it if it exists so we can push it to the top
      const filtered = prev.filter(item => !(item.id === media.id && item.media_type === media.media_type));
      return [{
        ...media,
        watchedAt: new Date().toISOString()
      }, ...filtered].slice(0, 50); // Keep last 50 items
    });
  };

  const isFavorite = (mediaId, mediaType) => {
    return favorites.some(item => item.id === mediaId && item.media_type === mediaType);
  };

  return (
    <UserContext.Provider value={{
      user,
      favorites,
      history,
      login,
      signup,
      logout,
      toggleFavorite,
      addToHistory,
      isFavorite
    }}>
      {children}
    </UserContext.Provider>
  );
};
