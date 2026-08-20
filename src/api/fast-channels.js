// src/api/fast-channels.js
// GET /api/fast-channels?genre=
// Returns mock virtual FAST channel schedule.

import { withRateLimit, SWR_CACHE_HEADER } from '../lib/rateLimiter.js';

const SCHEDULE = [
  {
    id: 'fast-1', title: 'Action Hits 24/7', genre: 'action',
    currentStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    poster: 'https://via.placeholder.com/500x750?text=Action+Hits',
    currentProgram: 'Die Hard - Live', timeRemaining: 1800
  },
  {
    id: 'fast-2', title: 'Comedy Central', genre: 'comedy',
    currentStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    poster: 'https://via.placeholder.com/500x750?text=Comedy+Central',
    currentProgram: 'Standup Special', timeRemaining: 3200
  }
];

async function _handler(event) {
  const genre = event.queryStringParameters?.genre || 'movies';
  const filtered = genre === 'all' ? SCHEDULE : SCHEDULE.filter(c => c.genre === genre || genre === 'movies');
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': SWR_CACHE_HEADER },
    body: JSON.stringify({ success: true, channels: filtered }),
  };
}

export const handler = withRateLimit(_handler);
