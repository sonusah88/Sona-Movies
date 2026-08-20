// public/sw.js — Sona-Movies Service Worker
// Strategy overview:
//   /assets/*  ->  Cache-First (hashed filenames, safe to cache forever)
//   /api/*     ->  Network-First with cache fallback (fresh data preferred, stale OK)
//   TMDB imgs  ->  Stale-While-Revalidate (always paint instantly, refresh in background)
//   Navigate   ->  Network-First (always try fresh HTML; fall back to cached shell)

const CACHE_VERSION = "sona-v1";
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const API_CACHE     = `${CACHE_VERSION}-api`;
const IMAGE_CACHE   = `${CACHE_VERSION}-images`;

// Assets to pre-cache on install (Vite hashes these, so they never change)
const PRECACHE_ASSETS = [
  "/",
  "/favicon.svg",
  "/logo.png",
];

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      // skipWaiting so the new SW activates immediately without waiting for old tabs to close
      cache.addAll(PRECACHE_ASSETS).then(() => self.skipWaiting())
    )
  );
});

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("sona-") && key !== STATIC_CACHE && key !== API_CACHE && key !== IMAGE_CACHE)
          .map((key) => caches.delete(key)) // delete stale caches from old SW versions
      )
    ).then(() => self.clients.claim()) // take control of all open tabs immediately
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== "GET") return;

  // 1. Vite-hashed static assets — Cache-First (permanent cache)
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(cacheFirst(request, STATIC_CACHE, { maxAge: 365 * 24 * 60 * 60 }));
    return;
  }

  // 2. TMDB poster & backdrop images — Stale-While-Revalidate
  if (url.hostname === "image.tmdb.org") {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  // 3. API calls (/api/*) — Network-First with 5-second timeout, then cache fallback
  if (url.pathname.startsWith("/api/") || url.hostname === "api.themoviedb.org") {
    event.respondWith(networkFirst(request, API_CACHE, 5000));
    return;
  }

  // 4. Navigation (HTML pages) — Network-First, fall back to cached app shell
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/"))
    );
    return;
  }
});

// ─── Strategy Implementations ─────────────────────────────────────────────────

/** Cache-First: serve from cache; fetch & update cache only on miss. */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const fresh = await fetch(request);
    if (fresh.ok) cache.put(request, fresh.clone());
    return fresh;
  } catch (err) {
    return new Response("Offline", { status: 503 });
  }
}

/** Stale-While-Revalidate: return cache immediately; refresh in background. */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Always kick off a background refresh
  const fetchPromise = fetch(request)
    .then((fresh) => {
      if (fresh.ok) cache.put(request, fresh.clone());
      return fresh;
    })
    .catch(() => null);

  // Return cached immediately if available; otherwise wait for network
  return cached || fetchPromise;
}

/** Network-First: try network with timeout; fall back to cache on failure. */
async function networkFirst(request, cacheName, timeoutMs = 4000) {
  const cache = await caches.open(cacheName);

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("timeout")), timeoutMs)
  );

  try {
    const fresh = await Promise.race([fetch(request), timeoutPromise]);
    if (fresh.ok) cache.put(request, fresh.clone());
    return fresh;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: "Offline", cached: false }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}
