import React, { useState, useEffect, useRef } from 'react';
import { MOCK_SHORTS } from '../data/shortsData';
import ShortVideo from '../components/Shorts/ShortVideo';
import CategoryPills from '../components/Shorts/CategoryPills';
import CommentsDrawer from '../components/Shorts/CommentsDrawer';
import './Shorts.css';

const Shorts = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true); // Default to muted for autoplay policies
  const [commentsOpenId, setCommentsOpenId] = useState(null);
  const [displayedShorts, setDisplayedShorts] = useState([]);
  
  const feedRef = useRef(null);
  const videoRefs = useRef([]);

  // Initialize and filter shorts based on category
  useEffect(() => {
    const initialShorts = activeCategory === 'all' 
      ? MOCK_SHORTS 
      : MOCK_SHORTS.filter(short => short.category === activeCategory);
    setDisplayedShorts(initialShorts);
    setActiveVideoIndex(0);
    if (feedRef.current) {
      feedRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [activeCategory]);

  // Infinite scroll logic: append more videos when nearing the end
  useEffect(() => {
    if (displayedShorts.length > 0 && activeVideoIndex >= displayedShorts.length - 2) {
      const baseShorts = activeCategory === 'all' 
        ? MOCK_SHORTS 
        : MOCK_SHORTS.filter(short => short.category === activeCategory);
      
      if (baseShorts.length === 0) return;

      // Duplicate and assign unique IDs
      const nextBatch = baseShorts.map((short, i) => ({
        ...short,
        id: `${short.id}-${displayedShorts.length + i}`
      }));
      
      setDisplayedShorts(prev => [...prev, ...nextBatch]);
    }
  }, [activeVideoIndex, displayedShorts.length, activeCategory]);

  // Setup Intersection Observer to detect which video is active
  useEffect(() => {
    const observerOptions = {
      root: feedRef.current,
      rootMargin: '0px',
      threshold: 0.6 // Trigger when 60% of video is visible
    };

    const handleIntersect = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = Number(entry.target.dataset.index);
          setActiveVideoIndex(index);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    videoRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      observer.disconnect();
    };
  }, [displayedShorts]); // Re-run when displayed shorts change

  // Handle Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!feedRef.current) return;
      
      const containerHeight = feedRef.current.clientHeight;
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (activeVideoIndex < filteredShorts.length - 1) {
          feedRef.current.scrollTo({
            top: (activeVideoIndex + 1) * containerHeight,
            behavior: 'smooth'
          });
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (activeVideoIndex > 0) {
          feedRef.current.scrollTo({
            top: (activeVideoIndex - 1) * containerHeight,
            behavior: 'smooth'
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeVideoIndex, displayedShorts.length]);



  return (
    <div className="shorts-page-container fade-in">
      {/* Top Category Filter */}
      <CategoryPills 
        activeCategory={activeCategory} 
        setActiveCategory={setActiveCategory} 
      />

      {/* Vertical Feed */}
      <div className="shorts-feed-container" ref={feedRef}>
        {displayedShorts.length > 0 ? (
          displayedShorts.map((short, index) => (
            <div 
              key={short.id} 
              data-index={index}
              ref={el => (videoRefs.current[index] = el)}
              style={{ height: '100%' }} // Ensure it takes full height of container for observer
            >
              <ShortVideo
                short={short}
                isActive={index === activeVideoIndex}
                isMuted={isMuted}
                toggleMute={() => setIsMuted(!isMuted)}
                onOpenComments={(id) => setCommentsOpenId(id)}
              />
            </div>
          ))
        ) : (
          <div className="short-video-container" style={{ color: 'white', flexDirection: 'column' }}>
            <h2>No Shorts Found</h2>
            <p>Try selecting a different category.</p>
          </div>
        )}
      </div>

      {/* Comments Drawer */}
      <CommentsDrawer 
        isOpen={!!commentsOpenId} 
        shortId={commentsOpenId}
        onClose={() => setCommentsOpenId(null)} 
      />
    </div>
  );
};

export default Shorts;
