// src/api/social-stream.js
// Server-Sent Events endpoint for live chat, polls and tips.
// GET  /api/social-stream?roomId=<room>
// POST /api/social-stream  { roomId, type, payload }

import { withRateLimit, SWR_CACHE_HEADER } from '../lib/rateLimiter.js';

// In-memory store of listeners per room (dev/demo only)
const listeners = {};

async function _handler(event, context) {
  const { httpMethod, queryStringParameters, body } = event;

  // GET - establish SSE connection
  if (httpMethod === 'GET') {
    const roomId = queryStringParameters?.roomId;
    if (!roomId) return { statusCode: 400, body: JSON.stringify({ error: 'roomId required' }) };

    // SSE streams cannot use SWR; must be no-cache
    const headers = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    };

    if (!listeners[roomId]) listeners[roomId] = [];
    listeners[roomId].push({ send: (msg) => console.log('SSE send', roomId, msg) });

    context.callbackWaitsForEmptyEventLoop = true;
    return { statusCode: 200, headers, body: '' };
  }

  // POST - broadcast a new event to all room listeners
  if (httpMethod === 'POST') {
    let payload;
    try { payload = JSON.parse(body); }
    catch { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

    const { roomId, type, data } = payload;
    if (!roomId || !type) return { statusCode: 400, body: JSON.stringify({ error: 'roomId and type required' }) };

    const msg = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
    if (listeners[roomId]) listeners[roomId].forEach((l) => l.send(msg));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': SWR_CACHE_HEADER },
      body: JSON.stringify({ ok: true }),
    };
  }

  return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
}

export const handler = withRateLimit(_handler);
