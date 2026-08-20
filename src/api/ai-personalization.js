// src/api/ai-personalization.js
// POST /api/ai-personalization  { mediaId, currentMood }
// Returns personalized tagline and simple recommendations.

import { withRateLimit, SWR_CACHE_HEADER } from '../lib/rateLimiter.js';

const TMDB_API_KEY = process.env.TMDB_API_KEY;

async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }
  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const { mediaId, currentMood = 'relaxed' } = body;
  if (!mediaId) return { statusCode: 400, body: JSON.stringify({ error: 'mediaId required' }) };

  let tmdbData = null;
  try {
    const resp = await fetch(`https://api.themoviedb.org/3/movie/${mediaId}?api_key=${TMDB_API_KEY}`);
    if (resp.ok) tmdbData = await resp.json();
  } catch (_) {}

  const title = tmdbData?.title || `Movie #${mediaId}`;
  const basePoster = tmdbData?.poster_path
    ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}`
    : null;

  const recommendations = (tmdbData?.genres || []).slice(0, 2).map((g) => ({
    id: `${mediaId}-${g.id}`,
    title: `${title} – ${g.name} Vibes`,
    poster_path: basePoster,
  }));

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': SWR_CACHE_HEADER },
    body: JSON.stringify({ personalizedTagline: `${title} – perfect for a ${currentMood} night`, thumbnailUrl: basePoster, recommendations }),
  };
}

export const handler = withRateLimit(handler);
