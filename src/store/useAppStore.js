// src/store/useAppStore.js
// Atomic Zustand store. Only components that subscribe to a specific slice re-render.
//
// History is stored in IndexedDB (async, non-blocking, 200 entries / 90-day TTL).
// User + favorites stay in localStorage via zustand/persist (small, sync-safe).

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { addHistory, getHistory, clearHistory } from "../lib/db.js";

const useAppStore = create(
  persist(
    (set, get) => ({
      // ── Auth ──────────────────────────────────────────────────────────────
      user: null,
      favorites: [],

      // history is kept in Zustand only as an in-memory cache of IDB data
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
        // Hydrate history from IDB on login
        getHistory().then((h) => set({ history: h }));
      },

      logout: () => {
        clearHistory();
        set({ user: null, favorites: [], history: [] });
      },

      // ── Favorites ─────────────────────────────────────────────────────────
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

      isFavorite: (mediaId, mediaType) =>
        get().favorites.some((f) => f.id === mediaId && f.media_type === mediaType),

      // ── History (IndexedDB-backed) ─────────────────────────────────────────
      // addToHistory writes to IDB (async, non-blocking) and updates the
      // in-memory Zustand slice so the UI reflects changes immediately.
      addToHistory: async (media) => {
        const { user } = get();
        if (!user) return;

        await addHistory(media); // non-blocking write to IndexedDB

        // Update in-memory slice (remove dupe then prepend)
        const prev = get().history;
        const filtered = prev.filter(
          (h) => !(h.id === media.id && h.media_type === media.media_type)
        );
        set({
          history: [{ ...media, watchedAt: new Date().toISOString() }, ...filtered].slice(0, 200),
        });
      },

      // Call once on app init to hydrate history from IDB into memory
      hydrateHistory: async () => {
        const h = await getHistory();
        set({ history: h });
      },
    }),
    {
      name: "sona-app-store",
      storage: createJSONStorage(() => localStorage),
      // Only persist user + favorites to localStorage.
      // History lives in IndexedDB — no need to duplicate it in localStorage.
      partialize: (state) => ({
        user: state.user,
        favorites: state.favorites,
      }),
    }
  )
);

export default useAppStore;
