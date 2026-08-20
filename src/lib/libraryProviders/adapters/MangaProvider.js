/**
 * MangaProvider.js
 * Adapter for Manga/Comics using the Jikan API (MyAnimeList).
 */
import { BookProvider } from '../BookProvider';

export class MangaProvider extends BookProvider {
  constructor() {
    super({
      id: 'jikan-manga',
      name: 'Manga Database (Jikan)',
      providerType: 'EXTERNAL_SEARCH',
      baseUrl: 'https://api.jikan.moe/v4',
      supportsSearch: true,
      supportsMetadata: true,
      supportsReader: false, // Jikan only provides metadata, not readable files
      supportsBorrow: false,
    });
  }

  async search(query) {
    // If the query is "popular" or "classics", we can map it to top manga, otherwise standard search
    let url = `${this.baseUrl}/manga?q=${encodeURIComponent(query)}&limit=10`;
    if (query.toLowerCase() === 'popular') {
      url = `${this.baseUrl}/top/manga?limit=10`;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Jikan API error: ${response.status}`);
    
    const data = await response.json();
    return (data.data || []).map(doc => this.normalizeData(doc));
  }

  normalizeData(rawData) {
    const coverUrl = rawData.images?.jpg?.large_image_url || rawData.images?.jpg?.image_url || 'https://via.placeholder.com/200x300?text=No+Cover';
    
    return super.normalizeData({
      id: rawData.mal_id.toString(),
      title: rawData.title_english || rawData.title,
      author: (rawData.authors && rawData.authors.length > 0) ? rawData.authors[0].name : 'Unknown Artist',
      cover: coverUrl,
      description: rawData.synopsis || 'No synopsis available.',
      category: 'Manga & Comics',
      accessType: 'PREVIEW_ONLY', 
      sourceUrl: rawData.url, // Link to MyAnimeList
      pdfUrl: null, // No internal reader support for commercial manga API
      language: 'Japanese/English',
    });
  }
}
