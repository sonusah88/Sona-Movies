// api/channels.js
// Vercel Serverless Function to fetch, parse, and cache IPTV channels

export default async function handler(req, res) {
  // Add CORS headers so the frontend can hit this from localhost if needed
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Fetch all M3U files simultaneously
    const [inRes, npRes, sportsRes, moviesRes, docRes] = await Promise.all([
      fetch('https://iptv-org.github.io/iptv/countries/in.m3u'),
      fetch('https://iptv-org.github.io/iptv/countries/np.m3u'),
      fetch('https://iptv-org.github.io/iptv/categories/sports.m3u'),
      fetch('https://iptv-org.github.io/iptv/categories/movies.m3u'),
      fetch('https://iptv-org.github.io/iptv/categories/documentary.m3u')
    ]);

    const inText = await inRes.text();
    const npText = await npRes.text();
    const sportsText = await sportsRes.text();
    const moviesText = await moviesRes.text();
    const docText = await docRes.text();

    const parseM3U = (text, countryLabel) => {
      const lines = text.split('\n');
      const parsed = [];
      let currentChannel = {};

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('#EXTINF:')) {
          // Extract logo
          const logoMatch = line.match(/tvg-logo="([^"]+)"/);
          if (logoMatch) currentChannel.logo = logoMatch[1];

          // Extract category
          const groupMatch = line.match(/group-title="([^"]+)"/);
          currentChannel.category = groupMatch ? groupMatch[1] : 'General';
          currentChannel.country = countryLabel;

          // Extract name (after the last comma)
          const namePart = line.split(',').pop();
          currentChannel.name = namePart.trim();
          currentChannel.id = currentChannel.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        } else if (line && !line.startsWith('#')) {
          currentChannel.streamUrl = line;
          if (currentChannel.name && currentChannel.streamUrl) {
            parsed.push({ ...currentChannel });
          }
          currentChannel = {}; // Reset for next
        }
      }
      return parsed;
    };

    const inChannels = parseM3U(inText, 'India');
    const npChannels = parseM3U(npText, 'Nepal');
    const sportsChannelsRaw = parseM3U(sportsText, 'Global');
    const moviesChannelsRaw = parseM3U(moviesText, 'Global');
    const docChannelsRaw = parseM3U(docText, 'Global');

    // Combine all
    const allChannels = [
      ...inChannels,
      ...npChannels,
      ...sportsChannelsRaw,
      ...moviesChannelsRaw,
      ...docChannelsRaw
    ];

    // Remove duplicates by streamUrl
    const uniqueChannels = [];
    const seenUrls = new Set();
    for (const channel of allChannels) {
      if (!seenUrls.has(channel.streamUrl)) {
        seenUrls.add(channel.streamUrl);
        uniqueChannels.push(channel);
      }
    }

    // Set Edge Cache: Cache on Vercel CDN for 1 hour (3600 seconds)
    // and instruct browser to cache for 30 minutes (1800 seconds)
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');

    res.status(200).json({ success: true, channels: uniqueChannels });
  } catch (error) {
    console.error('Failed to fetch/parse IPTV playlists in API:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch channels' });
  }
}
