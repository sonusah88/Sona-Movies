// src/context/UserContext.jsx
// ---------------------------------------------------------------------------
// Thin compatibility shim — delegates all state to the Zustand store.
// Existing consumers of `useUser()` continue to work unchanged.
// Only the components that subscribe to specific Zustand slices re-render.
// ---------------------------------------------------------------------------
import React, { createContext, useContext } from 'react';
import useAppStore from '../store/useAppStore';

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  // Pull everything directly from the Zustand store.
  // Each selector is atomic — only subscribes to the slice it needs.
  const user = useAppStore((s) => s.user);
  const favorites = useAppStore((s) => s.favorites);
  const history = useAppStore((s) => s.history);
  const login = useAppStore((s) => s.login);
  const signup = useAppStore((s) => s.signup);
  const logout = useAppStore((s) => s.logout);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const addToHistory = useAppStore((s) => s.addToHistory);
  const isFavorite = useAppStore((s) => s.isFavorite);

  return (
    <UserContext.Provider
      value={{ user, favorites, history, login, signup, logout, toggleFavorite, addToHistory, isFavorite }}
    >
      {children}
    </UserContext.Provider>
  );
};

