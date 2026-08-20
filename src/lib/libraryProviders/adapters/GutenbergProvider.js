/**
 * GutenbergProvider.js
 * Adapter for Project Gutenberg via RapidAPI.
 */
import { BookProvider } from '../BookProvider';

export class GutenbergProvider extends BookProvider {
  constructor() {
    super({
      id: 'gutenberg',
      name: 'Project Gutenberg (RapidAPI)',
      providerType: 'PUBLIC_DOMAIN',
      baseUrl: 'https://project-gutenberg-free-books-api1.p.rapidapi.com',
      supportsSearch: true,
      supportsMetadata: true,
      supportsReader: true,
      supportsBorrow: false,
    });
    this.apiKey = '34868728f7msh9e2b80cd39725d5p1d3e7fjsnbe2b2ce7d805';
    this.apiHost = 'project-gutenberg-free-books-api1.p.rapidapi.com';
  }

  async search(query) {
    // The RapidAPI endpoint uses search query param or similar, but the exact search endpoint might be /books?search=
    // Based on standard Gutendex mapping, it's /books?search=...
    const url = `${this.baseUrl}/books?search=${encodeURIComponent(query)}&limit=10`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': this.apiHost,
        'x-rapidapi-key': this.apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error(`RapidAPI Gutenberg error: ${response.status}`);
    
    const data = await response.json();
    // RapidAPI returns either { results: [...] } or just an array depending on the exact endpoint proxy. 
    const results = Array.isArray(data) ? data : (data.results || []);
    
    return results.slice(0, 10).map(doc => this.normalizeData(doc));
  }

  normalizeData(rawData) {
    const htmlFormatUrl = rawData.formats && (rawData.formats['text/html'] || rawData.formats['text/html; charset=utf-8']);
    const epubFormatUrl = rawData.formats && rawData.formats['application/epub+zip'];
    const coverUrl = rawData.cover_image || (rawData.formats && rawData.formats['image/jpeg']) || 'https://via.placeholder.com/200x300?text=No+Cover';

    let accessType = 'PUBLIC_DOMAIN';
    let pdfUrl = null;

    if (htmlFormatUrl) {
      pdfUrl = htmlFormatUrl; 
    }

    return super.normalizeData({
      id: rawData.id.toString(),
      title: rawData.title,
      author: (rawData.authors && rawData.authors.length > 0) ? rawData.authors[0].name : 'Unknown Author',
      cover: coverUrl,
      description: rawData.summary || `Project Gutenberg ID: ${rawData.id}. Subjects: ${(rawData.subjects || []).join(', ')}`,
      category: (rawData.subjects && rawData.subjects.length > 0) ? rawData.subjects[0].split(' -- ')[0] : 'Literature',
      accessType: accessType,
      sourceUrl: `https://gutenberg.org/ebooks/${rawData.id}`,
      pdfUrl: pdfUrl,
      language: (rawData.languages && rawData.languages.length > 0) ? rawData.languages[0] : 'English',
    });
  }
}
