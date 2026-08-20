// src/api/webrtc-signaling.js
// POST /api/webrtc-signaling  { roomId, type, payload }

import { withRateLimit, SWR_CACHE_HEADER } from '../lib/rateLimiter.js';

const rooms = {};

async function _handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }
  try {
    const { roomId, type, payload } = JSON.parse(event.body);
    if (!roomId || !type) return { statusCode: 400, body: JSON.stringify({ error: 'roomId and type required' }) };

    if (!rooms[roomId]) rooms[roomId] = [];
    console.log(`[WebRTC Signaling] Room: ${roomId}, Type: ${type}`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': SWR_CACHE_HEADER },
      body: JSON.stringify({ ok: true, message: 'Signal processed' }),
    };
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }
}

export const handler = withRateLimit(_handler);
