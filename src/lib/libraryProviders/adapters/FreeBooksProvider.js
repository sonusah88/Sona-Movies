/**
 * FreeBooksProvider.js
 * Adapter for FreeBooksAPI (https://github.com/Rickaym/FreeBooksAPI)
 */
import { BookProvider } from '../BookProvider';

export class FreeBooksProvider extends BookProvider {
  constructor() {
    super({
      id: 'freebooks-api',
      name: 'FreeBooks API (Planet eBooks)',
      providerType: 'EXTERNAL_SEARCH',
      baseUrl: 'https://freebooksapi.pyaesonemyo.dev/api/latest',
      supportsSearch: true,
      supportsMetadata: true,
      supportsReader: true,
      supportsBorrow: false,
    });
  }

  async search(query) {
    try {
      // Query the planetebooks endpoint specifically as it's more likely to have clean direct links
      // Note: If the hosted API is down, this will throw and fail gracefully.
      const url = `${this.baseUrl}/planetebooks/search?q=${encodeURIComponent(query)}&limit=10`;
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      
      if (!response.ok) {
        throw new Error(`FreeBooksAPI error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract results. The API returns { results: [...] }
      const results = data.results || [];
      return results.map(doc => this.normalizeData(doc));
    } catch (err) {
      console.warn("FreeBooksAPI search failed:", err.message);
      return [];
    }
  }

  normalizeData(rawData) {
    // Determine if it has a direct PDF mirror
    let pdfUrl = null;
    let accessType = 'EXTERNAL';

    // Check if any mirror is a direct PDF link
    if (rawData.mirrors && Array.isArray(rawData.mirrors)) {
      const pdfMirror = rawData.mirrors.find(m => m.toLowerCase().endsWith('.pdf'));
      if (pdfMirror || rawData.extension === 'pdf') {
        // If extension is pdf, take the first mirror as a direct link (for planetebooks)
        pdfUrl = pdfMirror || rawData.mirrors[0];
        accessType = 'INTERNAL_READER'; // User requested STRICT internal reading
      }
    }

    return super.normalizeData({
      id: `freebooks-${rawData.id || Math.random().toString(36).substr(2, 9)}`,
      title: rawData.title || 'Unknown Title',
      author: rawData.authors || 'Unknown Author',
      cover: 'https://via.placeholder.com/200x300?text=Planet+eBook', // FreeBooksAPI doesn't typically provide covers
      description: `Format: ${rawData.extension || 'Unknown'}, Size: ${rawData.size || 'N/A'}. Data provided by FreeBooksAPI.`,
      category: 'Classic Literature', // Planet eBooks is mostly classics
      accessType: accessType, 
      sourceUrl: (rawData.mirrors && rawData.mirrors.length > 0) ? rawData.mirrors[0] : null,
      pdfUrl: pdfUrl, 
      language: rawData.lang || 'English',
      pages: rawData.pages || 'N/A',
      publicationYear: rawData.year || 'N/A',
      publisher: rawData.publisher || 'Unknown'
    });
  }
}
