import React, { useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SHORTS_CATEGORIES } from '../../data/shortsData';

const CategoryPills = ({ activeCategory, setActiveCategory }) => {
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  // Allow horizontal scroll with mouse wheel on desktop
  const handleWheel = (e) => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  return (
    <div className="shorts-categories-wrapper">
      <button 
        className="shorts-back-btn" 
        onClick={() => navigate('/')}
        aria-label="Back to home"
      >
        <ArrowLeft size={20} />
      </button>
      
      <div 
        className="category-scroll-area" 
        ref={scrollRef}
        onWheel={handleWheel}
      >
        {SHORTS_CATEGORIES.map(category => (
          <button
            key={category.id}
            className={`short-category-pill ${activeCategory === category.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryPills;
