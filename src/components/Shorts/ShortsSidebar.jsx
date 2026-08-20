import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MoreVertical } from 'lucide-react';

const ShortsSidebar = ({ short, onOpenComments }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // Format numbers to K/M
  const formatCount = (count) => {
    if (typeof count === 'string') return count;
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
    return count;
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    // In a real app, send API request here
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: short.title,
          text: short.description,
          url: `${window.location.origin}/shorts/${short.id}`,
        });
      } catch (error) {
        console.log('Error sharing', error);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/shorts/${short.id}`);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="short-sidebar">
      <div className="action-btn-wrapper">
        <button 
          className={`action-btn ${isLiked ? 'liked' : ''}`} 
          onClick={handleLike}
          aria-label="Like"
        >
          <Heart size={24} fill={isLiked ? 'currentColor' : 'none'} />
        </button>
        <span className="action-count">
          {isLiked ? (parseInt(short.stats.likes) || 0) + 1 + (typeof short.stats.likes === 'string' ? 'K' : '') : short.stats.likes}
        </span>
      </div>

      <div className="action-btn-wrapper">
        <button 
          className="action-btn" 
          onClick={() => onOpenComments(short.id)}
          aria-label="Comments"
        >
          <MessageCircle size={24} />
        </button>
        <span className="action-count">{short.stats.comments}</span>
      </div>

      <div className="action-btn-wrapper">
        <button 
          className="action-btn" 
          onClick={handleSave}
          aria-label="Save"
        >
          <Bookmark size={24} fill={isSaved ? 'currentColor' : 'none'} />
        </button>
        <span className="action-count">{short.stats.saves}</span>
      </div>

      <div className="action-btn-wrapper">
        <button 
          className="action-btn" 
          onClick={handleShare}
          aria-label="Share"
        >
          <Share2 size={24} />
        </button>
        <span className="action-count">Share</span>
      </div>

      <div className="action-btn-wrapper" style={{ marginTop: '0.5rem' }}>
        <button className="action-btn" aria-label="More">
          <MoreVertical size={24} />
        </button>
      </div>
    </div>
  );
};

export default ShortsSidebar;
