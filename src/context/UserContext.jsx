import React, { createContext, useContext, useEffect } from 'react';
import { ClerkProvider, useUser as useClerkUser, useClerk } from '@clerk/clerk-react';
import useAppStore from '../store/useAppStore';

// Access Clerk publishable key from env
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

const InnerUserProvider = ({ children }) => {
  const { user: clerkUser, isLoaded, isSignedIn } = useClerkUser();
  const { signOut, openSignIn, openSignUp } = useClerk();

  // Keep favorites/history in the Zustand store for now
  const favorites = useAppStore((s) => s.favorites);
  const history = useAppStore((s) => s.history);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const addToHistory = useAppStore((s) => s.addToHistory);
  const isFavorite = useAppStore((s) => s.isFavorite);

  // Map Clerk user to our existing user format
  const mappedUser = isSignedIn ? {
    id: clerkUser.id,
    name: clerkUser.fullName || clerkUser.firstName || "User",
    email: clerkUser.primaryEmailAddress?.emailAddress,
    avatar: clerkUser.imageUrl,
  } : null;

  return (
    <UserContext.Provider
      value={{ 
        user: mappedUser, 
        favorites, 
        history, 
        login: () => openSignIn(), 
        signup: () => openSignUp(), 
        logout: () => signOut(), 
        toggleFavorite, 
        addToHistory, 
        isFavorite,
        isAuthLoaded: isLoaded
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// Fallback provider for local development without an API key
const MockUserProvider = ({ children }) => {
  const user = useAppStore((s) => s.user);
  const favorites = useAppStore((s) => s.favorites);
  const history = useAppStore((s) => s.history);
  const login = useAppStore((s) => s.login);
  const logout = useAppStore((s) => s.logout);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const addToHistory = useAppStore((s) => s.addToHistory);
  const isFavorite = useAppStore((s) => s.isFavorite);

  const mappedUser = user ? {
    id: 'mock-123',
    name: user.username,
    email: 'guest@sonamovies.com',
    avatar: null,
  } : null;

  return (
    <UserContext.Provider
      value={{ 
        user: mappedUser, 
        favorites, 
        history, 
        login: () => {
          // Fake login for preview mode
          login('guest@sonamovies.com', 'password');
          alert("Running in Demo Mode: Mock login successful. Add VITE_CLERK_PUBLISHABLE_KEY to enable real authentication.");
        }, 
        signup: () => {
          login('guest@sonamovies.com', 'password');
          alert("Running in Demo Mode: Mock signup successful.");
        }, 
        logout, 
        toggleFavorite, 
        addToHistory, 
        isFavorite,
        isAuthLoaded: true
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const UserProvider = ({ children }) => {
  if (!PUBLISHABLE_KEY) {
    return <MockUserProvider>{children}</MockUserProvider>;
  }

  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <InnerUserProvider>
        {children}
      </InnerUserProvider>
    </ClerkProvider>
  );
};
