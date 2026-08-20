// src/lib/db.js
// Async IndexedDB wrapper for watch history.
// Advantages over localStorage:
//   - Async / non-blocking (localStorage.setItem blocks the main thread)
//   - Supports up to ~50% of available disk space (vs 5MB localStorage quota)
//   - Structured data — no JSON.parse/stringify on every read
//
// Object store: "watch_history"
//   keyPath: "id" (media id)
//   Indexes: "watchedAt" (for TTL expiry queries)
//
// Capacity: 200 entries max; entries older than 90 days are auto-purged.

const DB_NAME    = "sona-movies-db";
const DB_VERSION = 1;
const STORE      = "watch_history";
const MAX_ENTRIES = 200;
const TTL_MS      = 90 * 24 * 60 * 60 * 1000; // 90 days

let _db = null;

/** Open (or reuse) the IndexedDB connection. */
function openDB() {
  if (_db) return Promise.resolve(_db);

  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      // SSR / test environments without IDB
      return reject(new Error("IndexedDB not available"));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("watchedAt", "watchedAt", { unique: false });
      }
    };

    request.onsuccess = (event) => {
      _db = event.target.result;
      resolve(_db);
    };

    request.onerror = () => reject(request.error);
  });
}

/** Wrap an IDBRequest in a Promise. */
function toPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror  = () => reject(req.error);
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Add or update a media entry in watch history.
 * Deduplicates by id, caps at MAX_ENTRIES, purges old entries.
 */
export async function addHistory(media) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);

    const entry = { ...media, watchedAt: new Date().toISOString() };

    // Upsert the entry
    await toPromise(store.put(entry));

    // Purge entries older than TTL
    const cutoff = new Date(Date.now() - TTL_MS).toISOString();
    const index   = store.index("watchedAt");
    const range   = IDBKeyRange.upperBound(cutoff);
    const cursor  = await toPromise(index.openCursor(range));
    let cur = cursor;
    while (cur) {
      await toPromise(store.delete(cur.primaryKey));
      cur = await toPromise(cur.continue());
    }

    // Enforce MAX_ENTRIES cap — delete oldest if over limit
    const allKeys = await toPromise(store.index("watchedAt").getAllKeys());
    if (allKeys.length > MAX_ENTRIES) {
      const excess = allKeys.slice(0, allKeys.length - MAX_ENTRIES);
      for (const key of excess) {
        await toPromise(store.delete(key));
      }
    }

    await toPromise(tx); // wait for tx to complete
  } catch (err) {
    console.warn("[db] addHistory failed:", err);
  }
}

/**
 * Retrieve all watch history entries, newest first.
 */
export async function getHistory() {
  try {
    const db  = await openDB();
    const tx  = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const all = await toPromise(store.getAll());
    // Sort newest first
    return all.sort((a, b) => (b.watchedAt > a.watchedAt ? 1 : -1));
  } catch (err) {
    console.warn("[db] getHistory failed:", err);
    return [];
  }
}

/**
 * Clear all watch history.
 */
export async function clearHistory() {
  try {
    const db  = await openDB();
    const tx  = db.transaction(STORE, "readwrite");
    await toPromise(tx.objectStore(STORE).clear());
  } catch (err) {
    console.warn("[db] clearHistory failed:", err);
  }
}
