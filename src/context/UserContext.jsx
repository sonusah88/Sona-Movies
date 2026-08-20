import React, { createContext, useContext, useEffect } from 'react';
import { ClerkProvider, useUser as useClerkUser, useClerk } from '@clerk/clerk-react';
import useAppStore from '../store/useAppStore';

// Access Clerk publishable key from env (or use a placeholder if not set yet)
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "pk_test_placeholder_key";

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

export const UserProvider = ({ children }) => {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <InnerUserProvider>
        {children}
      </InnerUserProvider>
    </ClerkProvider>
  );
};
