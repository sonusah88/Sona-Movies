import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import './App.css';

// Lazy load pages for performance
const Home = lazy(() => import('./pages/Home'));
const Search = lazy(() => import('./pages/Search'));
const Details = lazy(() => import('./pages/Details'));
const Watch = lazy(() => import('./pages/Watch'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const LiveTV = lazy(() => import('./pages/LiveTV'));
const BestForYou = lazy(() => import('./pages/BestForYou'));
const Discover = lazy(() => import('./pages/Discover'));
const Shorts = lazy(() => import('./pages/Shorts'));

// Library Routes
const LibraryHome = lazy(() => import('./pages/Library/LibraryHome'));
const BookDetails = lazy(() => import('./pages/Library/BookDetails'));
const Reader = lazy(() => import('./pages/Library/Reader'));
const LibrarySearch = lazy(() => import('./pages/Library/LibrarySearch'));

// Loading Fallback Component
const PageLoader = () => (
  <div className="page-loader fade-in">
    <div className="loader-spinner"></div>
  </div>
);

const AppContent = () => {
  const location = useLocation();
  const isShortsRoute = location.pathname === '/shorts';
  const isReaderRoute = location.pathname.startsWith('/library/read/');
  const hideNavigation = isShortsRoute || isReaderRoute;

  return (
    <div className="app-container">
      {!hideNavigation && <Navbar />}
      <main>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/movies" element={<CategoryPage type="movies" />} />
            <Route path="/tv" element={<CategoryPage type="tv" />} />
            <Route path="/new-releases" element={<CategoryPage type="new-releases" />} />
            <Route path="/genre/:id/:name" element={<CategoryPage type="genre" />} />
            <Route path="/search" element={<Search />} />
            <Route path="/live" element={<LiveTV />} />
            <Route path="/details/:type/:id" element={<Details />} />
            <Route path="/watch/:type/:id" element={<Watch />} />
            <Route path="/best-for-you" element={<BestForYou />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/shorts" element={<Shorts />} />
            
            {/* Library Ecosystem */}
            <Route path="/library" element={<LibraryHome />} />
            <Route path="/library/search" element={<LibrarySearch />} />
            <Route path="/library/book/:id" element={<BookDetails />} />
            <Route path="/library/read/:id" element={<Reader />} />
          </Routes>
        </Suspense>
      </main>
      {!hideNavigation && <Footer />}
    </div>
  );
};

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;
