/**
 * BookProvider.js
 * Base interface/class for all library providers.
 */

export class BookProvider {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.providerType = config.providerType; // PUBLIC_DOMAIN, OPEN_ACCESS, LIBRARY, LICENSED, EXTERNAL_SEARCH
    this.baseUrl = config.baseUrl;
    this.status = '🟢 Operational'; // 🟢, 🟡, 🔴
    this.capabilities = {
      supportsSearch: config.supportsSearch || false,
      supportsMetadata: config.supportsMetadata || false,
      supportsReader: config.supportsReader || false,
      supportsBorrow: config.supportsBorrow || false,
      supportsPurchase: config.supportsPurchase || false,
    };
  }

  /**
   * Search for books
   * @param {string} query 
   * @returns {Promise<Array>} Array of book objects normalized to our schema
   */
  async search(query) {
    throw new Error(`search() not implemented for provider ${this.name}`);
  }

  /**
   * Get detailed metadata for a single book
   * @param {string} bookId 
   * @returns {Promise<Object>}
   */
  async getBookDetails(bookId) {
    throw new Error(`getBookDetails() not implemented for provider ${this.name}`);
  }

  /**
   * Get the direct PDF or EPUB read URL if available
   * @param {string} bookId 
   * @returns {Promise<string|null>}
   */
  async getReadUrl(bookId) {
    return null; // Override if supported
  }

  /**
   * Normalize an API specific result into our standard Book Schema
   * @param {Object} rawData 
   * @returns {Object}
   */
  normalizeData(rawData) {
    return {
      id: rawData.id || `unknown-${Date.now()}`,
      providerId: this.id,
      title: rawData.title || 'Unknown Title',
      author: rawData.author || 'Unknown Author',
      cover: rawData.cover || null,
      description: rawData.description || '',
      category: rawData.category || 'General',
      accessType: rawData.accessType || 'PREVIEW_ONLY', 
      sourceUrl: rawData.sourceUrl || null,
      pdfUrl: rawData.pdfUrl || null, 
      isInternal: !!rawData.pdfUrl || rawData.accessType === 'INTERNAL_READER',
      language: rawData.language || 'English',
      isbn: rawData.isbn || null,
    };
  }
}
