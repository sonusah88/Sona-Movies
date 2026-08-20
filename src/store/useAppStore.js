// src/store/useAppStore.js
// Atomic Zustand store replacing the heavy React Context for user state.
// Only components that subscribe to a specific slice re-render on change.
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const useAppStore = create(
  persist(
    (set, get) => ({
      user: null,
      favorites: [],
      history: [],

      setUser: (user) => set({ user }),

      signup: (username, email, password) => {
        const accounts = JSON.parse(localStorage.getItem("sona_accounts") || "[]");
        if (accounts.some((a) => a.email === email)) throw new Error("Email already registered!");
        accounts.push({ username, email, password });
        localStorage.setItem("sona_accounts", JSON.stringify(accounts));
        set({ user: { username, email } });
      },

      login: (email, password) => {
        const accounts = JSON.parse(localStorage.getItem("sona_accounts") || "[]");
        const account = accounts.find((a) => a.email === email && a.password === password);
        if (!account) throw new Error("Invalid email or password!");
        set({ user: { username: account.username, email: account.email } });
      },

      logout: () => set({ user: null, favorites: [], history: [] }),

      toggleFavorite: (media) => {
        const { user, favorites } = get();
        if (!user) return false;
        const exists = favorites.find((f) => f.id === media.id && f.media_type === media.media_type);
        set({
          favorites: exists
            ? favorites.filter((f) => !(f.id === media.id && f.media_type === media.media_type))
            : [media, ...favorites].slice(0, 100),
        });
        return true;
      },

      addToHistory: (media) => {
        const { user, history } = get();
        if (!user) return;
        const filtered = history.filter((h) => !(h.id === media.id && h.media_type === media.media_type));
        set({ history: [{ ...media, watchedAt: new Date().toISOString() }, ...filtered].slice(0, 50) });
      },

      isFavorite: (mediaId, mediaType) =>
        get().favorites.some((f) => f.id === mediaId && f.media_type === mediaType),
    }),
    {
      name: "sona-app-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, favorites: state.favorites, history: state.history }),
    }
  )
);

export default useAppStore;
