/**
 * OpenLibraryProvider.js
 * Adapter for OpenLibrary.org (Internet Archive).
 */
import { BookProvider } from '../BookProvider';

export class OpenLibraryProvider extends BookProvider {
  constructor() {
    super({
      id: 'openlibrary',
      name: 'Open Library',
      providerType: 'LIBRARY',
      baseUrl: 'https://openlibrary.org',
      supportsSearch: true,
      supportsMetadata: true,
      supportsReader: true, // Supports borrowing/reading via IA
      supportsBorrow: true,
    });
  }

  async search(query) {
    // We use the OpenLibrary Search API
    const url = `${this.baseUrl}/search.json?q=${encodeURIComponent(query)}&limit=10`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`OpenLibrary API error: ${response.status}`);
    
    const data = await response.json();
    return data.docs.map(doc => this.normalizeData(doc));
  }

  normalizeData(rawData) {
    // OpenLibrary returns complex objects, we extract what we need
    const coverId = rawData.cover_i;
    const coverUrl = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : 'https://via.placeholder.com/200x300?text=No+Cover';
    
    // Determine access type. 
    let accessType = 'PREVIEW_ONLY';
    let sourceUrl = `${this.baseUrl}${rawData.key}`; 
    let pdfUrl = null;

    if (rawData.public_scan_b && rawData.ia && rawData.ia.length > 0) {
      accessType = 'OPEN_ACCESS'; 
      sourceUrl = `https://archive.org/details/${rawData.ia[0]}`;
      // Use Internet Archive's embeddable book reader
      pdfUrl = `https://archive.org/stream/${rawData.ia[0]}?ui=embed`;
    } else if (rawData.has_fulltext) {
      accessType = 'LIBRARY'; // Requires borrowing
    }

    return super.normalizeData({
      id: rawData.key.replace('/works/', ''),
      title: rawData.title,
      author: rawData.author_name ? rawData.author_name[0] : 'Unknown Author',
      cover: coverUrl,
      description: '', 
      category: rawData.subject ? rawData.subject[0] : 'General',
      accessType: accessType,
      sourceUrl: sourceUrl,
      pdfUrl: pdfUrl,
      language: rawData.language ? rawData.language[0] : 'English',
      isbn: rawData.isbn ? rawData.isbn[0] : null,
    });
  }
}
