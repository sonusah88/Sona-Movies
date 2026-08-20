/**
 * ContentAccessResolver.js
 * Determines the final access type and reader URL based on the book's metadata and provider capabilities.
 */

export const ACCESS_TYPES = {
  INTERNAL_READER: 'INTERNAL_READER', // We have direct access to render PDF/EPUB in our Reader
  EXTERNAL_READER: 'EXTERNAL_READER', // Opens in the provider's official online reader via iframe/new tab
  BORROW: 'BORROW', // Requires the user to borrow from an external library
  PREVIEW: 'PREVIEW', // We can only show a preview
  PURCHASE: 'PURCHASE', // Requires commercial purchase
  UNAVAILABLE: 'UNAVAILABLE'
};

export class ContentAccessResolver {
  /**
   * Resolves the best way to read a book
   * @param {Object} book The normalized book object
   * @param {Object} provider The provider instance that sourced this book
   * @returns {Object} Access details including accessType and readUrl
   */
  static resolve(book, provider) {
    if (book.accessType === 'OPEN_ACCESS' || book.accessType === 'PUBLIC_DOMAIN') {
      if (provider.capabilities.supportsReader && book.pdfUrl) {
        return {
          type: ACCESS_TYPES.INTERNAL_READER,
          url: book.pdfUrl,
          message: 'Direct reading permitted'
        };
      }
      
      if (book.sourceUrl) {
        return {
          type: ACCESS_TYPES.EXTERNAL_READER,
          url: book.sourceUrl,
          message: 'Official provider reader available'
        };
      }
    }

    if (book.accessType === 'LIBRARY' || book.accessType === 'BORROW_ONLY') {
      return {
        type: ACCESS_TYPES.BORROW,
        url: book.sourceUrl,
        message: 'External library borrowing required'
      };
    }

    if (book.accessType === 'PREVIEW_ONLY') {
      return {
        type: ACCESS_TYPES.PREVIEW,
        url: book.previewUrl || book.sourceUrl,
        message: 'Preview access only'
      };
    }

    if (book.accessType === 'LICENSED') {
      return {
        type: ACCESS_TYPES.PURCHASE,
        url: book.sourceUrl,
        message: 'Commercial access required'
      };
    }

    // Fallback
    return {
      type: ACCESS_TYPES.UNAVAILABLE,
      url: null,
      message: 'Access unavailable'
    };
  }
}
