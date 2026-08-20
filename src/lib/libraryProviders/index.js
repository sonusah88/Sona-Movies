import { registry } from './ProviderRegistry';
import { OpenLibraryProvider } from './adapters/OpenLibraryProvider';
import { GutenbergProvider } from './adapters/GutenbergProvider';
import { MangaProvider } from './adapters/MangaProvider';
import { FreeBooksProvider } from './adapters/FreeBooksProvider';
import { SearchFederator } from './SearchFederator';

// Initialize and register adapters
registry.register(new OpenLibraryProvider());
registry.register(new GutenbergProvider());
registry.register(new MangaProvider());
registry.register(new FreeBooksProvider());

// Export public APIs
export {
  registry,
  SearchFederator
};
