import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { UserProvider } from "./context/UserContext";
import { LangProvider } from "./context/LangContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ErrorBoundary from "./components/ErrorBoundary";
import "./App.css";

// Lazy-loaded pages for code splitting
const Home         = lazy(() => import("./pages/Home"));
const Search       = lazy(() => import("./pages/Search"));
const Details      = lazy(() => import("./pages/Details"));
const Watch        = lazy(() => import("./pages/Watch"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const LiveTV       = lazy(() => import("./pages/LiveTV"));
const BestForYou   = lazy(() => import("./pages/BestForYou"));
const Discover     = lazy(() => import("./pages/Discover"));
const Shorts       = lazy(() => import("./pages/Shorts"));

const LibraryHome   = lazy(() => import("./pages/Library/LibraryHome"));
const BookDetails   = lazy(() => import("./pages/Library/BookDetails"));
const Reader        = lazy(() => import("./pages/Library/Reader"));
const LibrarySearch = lazy(() => import("./pages/Library/LibrarySearch"));

const PageLoader = () => (
  <div className="page-loader fade-in">
    <div className="loader-spinner" />
  </div>
);

const AppContent = () => {
  const location = useLocation();
  const isShortsRoute = location.pathname === "/shorts";
  const isReaderRoute = location.pathname.startsWith("/library/read/");
  const hideNavigation = isShortsRoute || isReaderRoute;

  return (
    <div className="app-container">
      {!hideNavigation && <Navbar />}
      <main>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<ErrorBoundary label="Home"><Home /></ErrorBoundary>} />
            <Route path="/movies" element={<ErrorBoundary label="Movies"><CategoryPage type="movies" /></ErrorBoundary>} />
            <Route path="/tv" element={<ErrorBoundary label="TV Shows"><CategoryPage type="tv" /></ErrorBoundary>} />
            <Route path="/new-releases" element={<ErrorBoundary label="New Releases"><CategoryPage type="new-releases" /></ErrorBoundary>} />
            <Route path="/genre/:id/:name" element={<ErrorBoundary label="Genre"><CategoryPage type="genre" /></ErrorBoundary>} />
            <Route path="/search" element={<ErrorBoundary label="Search"><Search /></ErrorBoundary>} />
            <Route path="/discover" element={<ErrorBoundary label="Discover"><Discover /></ErrorBoundary>} />
            <Route path="/live" element={<ErrorBoundary label="Live TV"><LiveTV /></ErrorBoundary>} />
            <Route path="/details/:type/:id" element={<ErrorBoundary label="Details"><Details /></ErrorBoundary>} />
            <Route path="/watch/:type/:id" element={<ErrorBoundary label="Player"><Watch /></ErrorBoundary>} />
            <Route path="/best-for-you" element={<ErrorBoundary label="Best For You"><BestForYou /></ErrorBoundary>} />
            <Route path="/shorts" element={<ErrorBoundary label="Shorts"><Shorts /></ErrorBoundary>} />
            <Route path="/library" element={<ErrorBoundary label="Library"><LibraryHome /></ErrorBoundary>} />
            <Route path="/library/search" element={<ErrorBoundary label="Library Search"><LibrarySearch /></ErrorBoundary>} />
            <Route path="/library/book/:id" element={<ErrorBoundary label="Book Details"><BookDetails /></ErrorBoundary>} />
            <Route path="/library/read/:id" element={<ErrorBoundary label="Reader"><Reader /></ErrorBoundary>} />
          </Routes>
        </Suspense>
      </main>
      {!hideNavigation && <Footer />}
    </div>
  );
};

function App() {
  return (
    <HelmetProvider>
      <LangProvider>
        <UserProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </UserProvider>
      </LangProvider>
    </HelmetProvider>
  );
}

export default App;
