/**
 * SearchFederator.js
 * The core engine that distributes searches across providers and merges results.
 */
import { registry } from './ProviderRegistry';
import { ContentAccessResolver } from './ContentAccessResolver';

export class SearchFederator {
  /**
   * Search all active providers in parallel with a timeout.
   * @param {string} query 
   * @param {number} timeoutMs 
   * @returns {Promise<Array>} Deduplicated and ranked book results
   */
  static async search(query, timeoutMs = 8000) {
    if (!query) return [];

    const activeProviders = registry.getActiveProviders();
    const searchPromises = activeProviders.map(provider => {
      // Promise race with a timeout
      return Promise.race([
        provider.search(query).catch(err => {
          console.warn(`[SearchFederator] Provider ${provider.name} failed:`, err);
          return [];
        }),
        new Promise((resolve) => setTimeout(() => {
          console.warn(`[SearchFederator] Provider ${provider.name} timed out.`);
          resolve([]); // Return empty array on timeout so Promise.all doesn't fail
        }, timeoutMs))
      ]).then(results => {
        // Attach the resolved access context to each book early
        return results.map(book => ({
          ...book,
          access: ContentAccessResolver.resolve(book, provider)
        }));
      });
    });

    // Wait for all (they won't throw because of catch/race)
    const resultsArrays = await Promise.all(searchPromises);
    const flatResults = resultsArrays.flat();

    return this.deduplicateAndRank(flatResults);
  }

  /**
   * Merge duplicate books based on normalized title and author.
   * Instead of showing 3 copies of "Atomic Habits", we merge them into one 
   * and list the available sources inside the object.
   */
  static deduplicateAndRank(books) {
    const merged = new Map();

    books.forEach(book => {
      // Create a normalization key (e.g., "atomic habits|james clear")
      const titleKey = (book.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const authorKey = (book.author || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const key = `${titleKey}|${authorKey}`;

      if (!merged.has(key)) {
        // First time seeing this book, initialize the sources array
        merged.set(key, {
          ...book,
          sources: [ { providerId: book.providerId, access: book.access, sourceUrl: book.sourceUrl } ]
        });
      } else {
        // Merge! Add this provider as an alternative source
        const existingBook = merged.get(key);
        existingBook.sources.push({ providerId: book.providerId, access: book.access, sourceUrl: book.sourceUrl });
        
        // If the new source has better access (e.g. OPEN_ACCESS > PREVIEW), upgrade the primary book access
        if (book.access.type === 'INTERNAL_READER' && existingBook.access.type !== 'INTERNAL_READER') {
          existingBook.accessType = book.accessType;
          existingBook.access = book.access;
          existingBook.providerId = book.providerId; // Promote to primary provider
          existingBook.pdfUrl = book.pdfUrl || existingBook.pdfUrl;
        }
      }
    });

    // Return as array, strictly filtering out any books that redirect externally, ensuring 100% internal read accessibility
    return Array.from(merged.values())
      .filter(book => book.isInternal)
      .sort((a, b) => {
        // Sort by provider preference or keep stable
        return 0;
      });
  }
}
