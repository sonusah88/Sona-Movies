const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || '';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p';
import latentData from '../data/latent.json';

// Simple in-memory cache to avoid duplicate network requests
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const cachedFetch = async (url) => {
  const now = Date.now();
  if (cache.has(url)) {
    const { data, timestamp } = cache.get(url);
    if (now - timestamp < CACHE_TTL) return data;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  cache.set(url, { data, timestamp: now });
  return data;
};

const formatMedia = (item, type) => ({
  id: item.id,
  title: item.title || item.name,
  poster_path: item.poster_path
    ? `${IMG_BASE}/w342${item.poster_path}`
    : null,
  backdrop_path: item.backdrop_path
    ? `${IMG_BASE}/w1280${item.backdrop_path}`
    : null,
  overview: item.overview,
  vote_average: item.vote_average,
  date: item.release_date || item.first_air_date,
  media_type: item.media_type || type,
  original_language: item.original_language
});

// Helper to evenly mix arrays
const interleaveArrays = (...arrays) => {
  const result = [];
  const maxLength = Math.max(...arrays.map(a => a.length));
  for (let i = 0; i < maxLength; i++) {
    for (const arr of arrays) {
      if (arr[i]) result.push(arr[i]);
    }
  }
  return result;
};

// ── Discover Helpers ───────────────────────────────────────
export const fetchAnime = async (page = 1) => {
  if (!TMDB_API_KEY) return [];
  try {
    const data = await cachedFetch(
      `${BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_genres=16&with_original_language=ja&sort_by=popularity.desc&page=${page}`
    );
    return data.results.map(t => formatMedia(t, 'tv'));
  } catch (e) {
    console.error('fetchAnime failed', e);
    return [];
  }
};

export const fetchKDrama = async (page = 1) => {
  if (!TMDB_API_KEY) return [];
  try {
    const data = await cachedFetch(
      `${BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_original_language=ko&sort_by=popularity.desc&page=${page}`
    );
    return data.results.map(t => formatMedia(t, 'tv'));
  } catch (e) {
    console.error('fetchKDrama failed', e);
    return [];
  }
};

export const fetchPakistaniDrama = async (page = 1) => {
  if (!TMDB_API_KEY) return [];
  try {
    const data = await cachedFetch(
      `${BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_original_language=ur&sort_by=popularity.desc&page=${page}`
    );
    return data.results.map(t => formatMedia(t, 'tv'));
  } catch (e) {
    console.error('fetchPakistaniDrama failed', e);
    return [];
  }
};

// Fetch Adult / Hot Romance Movies (18+)
export const fetchAdultRomance = async (page = 1) => {
  if (!TMDB_API_KEY) return [];
  try {
    // 10749 is Romance. certification_country=US&certification.gte=R ensures mature content
    const data = await cachedFetch(
      `${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=10749&certification_country=US&certification.gte=R&sort_by=popularity.desc&page=${page}`
    );
    return data.results.map(m => formatMedia(m, 'movie'));
  } catch (e) {
    console.error('fetchAdultRomance failed', e);
    return [];
  }
};

// ── Trending ──────────────────────────────────────────────
export const fetchTrending = async () => {
  if (!TMDB_API_KEY) return [latentData];
  try {
    const [hwMovies, bwMovies, siMovies, tvData] = await Promise.all([
      cachedFetch(`${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_original_language=en&sort_by=popularity.desc`),
      cachedFetch(`${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_original_language=hi&sort_by=popularity.desc`),
      cachedFetch(`${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_original_language=te|ta|ml|kn&sort_by=popularity.desc`),
      cachedFetch(`${BASE_URL}/trending/tv/week?api_key=${TMDB_API_KEY}`)
    ]);
    
    const interleavedMovies = interleaveArrays(
      hwMovies.results.map(m => formatMedia(m, 'movie')),
      bwMovies.results.map(m => formatMedia(m, 'movie')),
      siMovies.results.map(m => formatMedia(m, 'movie'))
    );

    return [
      latentData,
      ...interleavedMovies,
      ...tvData.results.map(t => formatMedia(t, 'tv'))
    ];
  } catch (e) {
    console.error('fetchTrending failed', e);
    return [latentData];
  }
};

// ── Hindi Movies (Bollywood) ──────────────────────────────
export const fetchHindiMovies = async (page = 1) => {
  if (!TMDB_API_KEY) return [];
  try {
    const data = await cachedFetch(
      `${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_original_language=hi&sort_by=popularity.desc&page=${page}`
    );
    return data.results.map(m => formatMedia(m, 'movie'));
  } catch (e) {
    console.error('fetchHindiMovies failed', e);
    return [];
  }
};

// ── Nepali Movies ─────────────────────────────────────────
export const fetchNepaliMovies = async () => {
  try {
    const res = await fetch('https://raw.githubusercontent.com/Prajwal100/Nepali_movies/master/backend/data/movies.json');
    if (!res.ok) throw new Error("Failed to fetch");
    const data = await res.json();
    return data.map(m => ({
      id: m.name,
      title: m.name,
      poster_path: m.image,
      backdrop_path: m.image,
      overview: m.overview,
      media_type: 'nepali',
      release_date: m.releaseDate
    }));
  } catch (e) {
    console.error('fetchNepaliMovies failed', e);
    return [];
  }
};

// ── Bhojpuri Movies ───────────────────────────────────────
export const fetchBhojpuriMovies = async () => {
  if (!TMDB_API_KEY) return [];
  try {
    // TMDB has limited regional language filtering for Bhojpuri.
    // Searching for "Nirahua" brings up the most popular Bhojpuri movies on TMDB.
    const data = await cachedFetch(
      `${BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=Nirahua`
    );
    return data.results.map(m => formatMedia(m, 'movie'));
  } catch (e) {
    console.error('fetchBhojpuriMovies failed', e);
    return [];
  }
};

// ── Hollywood Movies (English) ────────────────────────────
export const fetchHollywoodMovies = async (page = 1) => {
  if (!TMDB_API_KEY) return [];
  try {
    const data = await cachedFetch(
      `${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_original_language=en&sort_by=popularity.desc&page=${page}`
    );
    return data.results.map(m => formatMedia(m, 'movie'));
  } catch (e) {
    console.error('fetchHollywoodMovies failed', e);
    return [];
  }
};


// ── New & Upcoming (Movies & TV) ───────────────────────────
export const fetchNewAndUpcoming = async (page = 1) => {
  if (!TMDB_API_KEY) return [];
  try {
    const today = new Date();
    
    // Past 2 months
    const pastDate = new Date();
    pastDate.setMonth(today.getMonth() - 2);
    
    // Future 4 months
    const futureDate = new Date();
    futureDate.setMonth(today.getMonth() + 4);
    
    const gte = pastDate.toISOString().split('T')[0];
    const lte = futureDate.toISOString().split('T')[0];
    
    const discoverUrl = (langs) => 
      `${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_original_language=${langs}&primary_release_date.gte=${gte}&primary_release_date.lte=${lte}&sort_by=popularity.desc&page=${page}`;

    // Fetch Hollywood, Bollywood, and South Indian movies simultaneously
    const [hollywood, bollywood, south] = await Promise.all([
      cachedFetch(discoverUrl('en')),
      cachedFetch(discoverUrl('hi')),
      cachedFetch(discoverUrl('te|ta|ml|kn'))
    ]);
    
    const hwMovies = hollywood.results.map(m => formatMedia(m, 'movie'));
    const bwMovies = bollywood.results.map(m => formatMedia(m, 'movie'));
    const siMovies = south.results.map(m => formatMedia(m, 'movie'));
    
    // Interleave the results to ensure a good mix of all regions
    const combined = [];
    const maxLength = Math.max(hwMovies.length, bwMovies.length, siMovies.length);
    for (let i = 0; i < maxLength; i++) {
      if (hwMovies[i]) combined.push(hwMovies[i]);
      if (bwMovies[i]) combined.push(bwMovies[i]);
      if (siMovies[i]) combined.push(siMovies[i]);
    }
    
    // Sort all by release date descending (newest future down to newest past)
    combined.sort((a, b) => {
      const dateA = new Date(a.release_date || '1970-01-01');
      const dateB = new Date(b.release_date || '1970-01-01');
      return dateB - dateA; // Descending
    });
    
    return combined;
  } catch (e) {
    console.error('fetchNewAndUpcoming failed', e);
    return [];
  }
};

// ── Hindi Dubbed (South Indian & Hollywood) ───────────────
export const fetchHindiDubbedMovies = async (page = 1) => {
  if (!TMDB_API_KEY) return [];
  try {
    // Fetch South Indian and Hollywood separately so popular Hollywood movies don't hide South Indian ones
    const [southData, hollywoodData] = await Promise.all([
      cachedFetch(
        `${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_original_language=te|ta|ml|kn&with_spoken_languages=hi&sort_by=popularity.desc&page=${page}`
      ),
      cachedFetch(
        `${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_original_language=en&with_spoken_languages=hi&sort_by=popularity.desc&page=${page}`
      )
    ]);
    
    // Interleave the results to show a good mix
    const combined = [];
    const maxLength = Math.max(southData.results.length, hollywoodData.results.length);
    for (let i = 0; i < maxLength; i++) {
      if (southData.results[i]) combined.push(southData.results[i]);
      if (hollywoodData.results[i]) combined.push(hollywoodData.results[i]);
    }
    
    return combined.map(m => formatMedia(m, 'movie'));
  } catch (e) {
    console.error('fetchHindiDubbedMovies failed', e);
    return [];
  }
};

// ── Critically Acclaimed Recommendations ─────────────────
export const fetchCriticallyAcclaimedMovies = async (page = 1) => {
  if (!TMDB_API_KEY) return [];
  try {
    const data = await cachedFetch(
      `${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&sort_by=vote_average.desc&vote_count.gte=3000&vote_average.gte=8.0&page=${page}`
    );
    return data.results.map(m => formatMedia(m, 'movie'));
  } catch (e) {
    console.error('fetchCriticallyAcclaimedMovies failed', e);
    return [];
  }
};

// ── Popular TV Shows (Global Best & Highly Anticipated) ──────────────────
export const fetchPopularTV = async (page = 1) => {
  if (!TMDB_API_KEY) return [];
  try {
    const discoverTvUrl = (langs) => 
      `${BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_original_language=${langs}&sort_by=popularity.desc&page=${page}`;

    // Fetch Hollywood, Bollywood, and South Indian TV Shows simultaneously
    const [hollywood, bollywood, south] = await Promise.all([
      cachedFetch(discoverTvUrl('en')),
      cachedFetch(discoverTvUrl('hi')),
      cachedFetch(discoverTvUrl('te|ta|ml|kn'))
    ]);
    
    const hwTv = hollywood.results.map(t => formatMedia(t, 'tv'));
    const bwTv = bollywood.results.map(t => formatMedia(t, 'tv'));
    const siTv = south.results.map(t => formatMedia(t, 'tv'));
    
    // Interleave the results to ensure a premium mix of all regions
    const combined = [];
    const maxLength = Math.max(hwTv.length, bwTv.length, siTv.length);
    for (let i = 0; i < maxLength; i++) {
      if (hwTv[i]) combined.push(hwTv[i]);
      if (bwTv[i]) combined.push(bwTv[i]);
      if (siTv[i]) combined.push(siTv[i]);
    }
    
    // Optional: Sort by vote_average to prioritize "Best / High IMDb Rated" among the highly anticipated
    // We will push 0-rated (upcoming) to the bottom of the top tier, or keep them mixed. 
    // Leaving as interleaved preserves the sheer Popularity/Anticipation metric perfectly.
    
    return combined;
  } catch (e) {
    console.error('fetchPopularTV failed', e);
    return [];
  }
};

// ── Details ───────────────────────────────────────────────
export const fetchDetails = async (id, type) => {
  if (id === 'indias-got-latent') {
    return {
      ...latentData,
      cast: [],
      recommendations: []
    };
  }
  if (!TMDB_API_KEY) return null;
  try {
    const data = await cachedFetch(
      `${BASE_URL}/${type}/${id}?api_key=${TMDB_API_KEY}&append_to_response=credits,recommendations,images`
    );
    const base = formatMedia(data, type);
    return {
      ...base,
      screenshots: (data.images?.backdrops || []).slice(0, 8).map(img => `${IMG_BASE}/w780${img.file_path}`),
      genres: data.genres || [],
      runtime: data.runtime || null,
      number_of_seasons: data.number_of_seasons || null,
      number_of_episodes: data.number_of_episodes || null,
      cast: (data.credits?.cast || []).slice(0, 8).map(c => ({
        id: c.id,
        name: c.name,
        character: c.character,
        profile_path: c.profile_path ? `${IMG_BASE}/w185${c.profile_path}` : null
      })),
      recommendations: (data.recommendations?.results || []).slice(0, 10).map(r =>
        formatMedia(r, r.media_type || type)
      )
    };
  } catch (e) {
    console.error('fetchDetails failed', e);
    return null;
  }
};

// ── Search ────────────────────────────────────────────────
export const searchMedia = async (query) => {
  if (!TMDB_API_KEY || !query) return [];
  try {
    const data = await cachedFetch(
      `${BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
    );
    return data.results
      .filter(i => i.media_type === 'movie' || i.media_type === 'tv')
      .map(i => formatMedia(i, i.media_type));
  } catch (e) {
    console.error('searchMedia failed', e);
    return [];
  }
};

// ── Genre ─────────────────────────────────────────────────
export const fetchByGenre = async (genreId, page = 1) => {
  if (!TMDB_API_KEY) return [];
  try {
    const [hollywood, bollywood, south] = await Promise.all([
      cachedFetch(`${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&with_original_language=en&sort_by=popularity.desc&page=${page}`),
      cachedFetch(`${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&with_original_language=hi&sort_by=popularity.desc&page=${page}`),
      cachedFetch(`${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&with_original_language=te|ta|ml|kn&sort_by=popularity.desc&page=${page}`)
    ]);

    const hwMovies = hollywood.results.map(m => formatMedia(m, 'movie'));
    const bwMovies = bollywood.results.map(m => formatMedia(m, 'movie'));
    const siMovies = south.results.map(m => formatMedia(m, 'movie'));
    
    return interleaveArrays(hwMovies, bwMovies, siMovies);
  } catch (e) {
    console.error('fetchByGenre failed', e);
    return [];
  }
};

// ── Trailer ───────────────────────────────────────────────
export const fetchTrailer = async (id, type = 'movie') => {
  if (!TMDB_API_KEY) return null;
  try {
    const data = await cachedFetch(
      `${BASE_URL}/${type}/${id}/videos?api_key=${TMDB_API_KEY}`
    );
    const trailers = data.results.filter(
      (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
    );
    // Prefer Trailer over Teaser
    const trailer = trailers.find((v) => v.type === 'Trailer') || trailers[0];
    return trailer ? trailer.key : null;
  } catch (e) {
    console.error('fetchTrailer failed', e);
    return null;
  }
};

// ── Season Details ────────────────────────────────────────
export const fetchSeasonDetails = async (seriesId, seasonNumber) => {
  if (seriesId === 'indias-got-latent') {
    const season = latentData.seasons.find(s => s.season_number === parseInt(seasonNumber));
    if (season) {
      return {
        name: season.name,
        overview: season.overview,
        episodes: season.episodes.map(ep => ({
          ...ep,
          still_path: null, // You can add thumbnails in latent.json if needed
        }))
      };
    }
    return null;
  }
  if (!TMDB_API_KEY) return null;
  try {
    const data = await cachedFetch(
      `${BASE_URL}/tv/${seriesId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}`
    );
    return {
      name: data.name,
      overview: data.overview,
      episodes: (data.episodes || []).map(ep => ({
        id: ep.id,
        episode_number: ep.episode_number,
        name: ep.name,
        overview: ep.overview,
        still_path: ep.still_path ? `${IMG_BASE}/w300${ep.still_path}` : null,
        runtime: ep.runtime,
        air_date: ep.air_date
      }))
    };
  } catch (e) {
    console.error(`fetchSeasonDetails failed for season ${seasonNumber}`, e);
    return null;
  }
};
