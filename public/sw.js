// public/sw.js — Sona-Movies Service Worker v2
// Caching strategy:
//   /assets/*        -> Cache-First  (hashed, safe to cache forever)
//   /offline.html    -> Pre-cached on install (served when navigate fails)
//   image.tmdb.org   -> Stale-While-Revalidate (instant paint, bg refresh)
//   /api/*           -> Network-First with 5s timeout, then cache fallback
//   navigate         -> Network-First, fall back to /offline.html

const CACHE_VERSION = "sona-v2";
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const API_CACHE     = `${CACHE_VERSION}-api`;
const IMAGE_CACHE   = `${CACHE_VERSION}-images`;

const PRECACHE_ASSETS = [
  "/",
  "/offline.html",
  "/favicon.svg",
  "/logo.png",
];

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (k) =>
                k.startsWith("sona-") &&
                k !== STATIC_CACHE &&
                k !== API_CACHE &&
                k !== IMAGE_CACHE
            )
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;

  // 1. Vite-hashed static assets — Cache-First
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 2. TMDB poster/backdrop images — Stale-While-Revalidate
  if (url.hostname === "image.tmdb.org") {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  // 3. API calls — Network-First with timeout
  if (url.pathname.startsWith("/api/") || url.hostname === "api.themoviedb.org") {
    event.respondWith(networkFirst(request, API_CACHE, 5000));
    return;
  }

  // 4. SPA navigation — Network-First; serve offline shell on failure
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match("/offline.html");
        return (
          cached ||
          new Response("<h1>You are offline</h1>", {
            headers: { "Content-Type": "text/html" },
          })
        );
      })
    );
    return;
  }
});

// ─── Strategy Helpers ─────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const fresh = await fetch(request);
    if (fresh.ok) cache.put(request, fresh.clone());
    return fresh;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((fresh) => {
      if (fresh.ok) cache.put(request, fresh.clone());
      return fresh;
    })
    .catch(() => null);
  return cached || fetchPromise;
}

async function networkFirst(request, cacheName, timeoutMs) {
  const cache = await caches.open(cacheName);
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("timeout")), timeoutMs)
  );
  try {
    const fresh = await Promise.race([fetch(request), timeout]);
    if (fresh.ok) cache.put(request, fresh.clone());
    return fresh;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(
      JSON.stringify({ error: "Offline", cached: false }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}
