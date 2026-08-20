import React, { useState } from 'react';
import { X, Heart, MoreHorizontal, Send } from 'lucide-react';
import { MOCK_COMMENTS } from '../../data/shortsData';

const CommentsDrawer = ({ isOpen, onClose, shortId }) => {
  const [newComment, setNewComment] = useState('');
  
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    // In a real app, send to backend here
    setNewComment('');
  };

  return (
    <div className={`comments-drawer-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
      <div className="comments-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="comments-header">
          <h3>Comments ({MOCK_COMMENTS.length})</h3>
          <button className="close-comments-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <div className="comments-list">
          {MOCK_COMMENTS.map((comment) => (
            <div key={comment.id} className="comment-item">
              <img src={comment.avatar} alt={comment.user} className="comment-avatar" />
              <div className="comment-content">
                <div className="comment-header-row">
                  <span className="comment-user">@{comment.user.replace(' ', '')}</span>
                  <span className="comment-time">{comment.time}</span>
                </div>
                <div className="comment-text">
                  {comment.text}
                </div>
                <div className="comment-actions">
                  <button className="comment-action-btn">
                    <Heart size={14} /> {comment.likes}
                  </button>
                  <button className="comment-action-btn">Reply</button>
                  <button className="comment-action-btn">
                    <MoreHorizontal size={14} />
                  </button>
                </div>
                
                {/* Nested Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="replies-list" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {comment.replies.map(reply => (
                      <div key={reply.id} className="comment-item">
                        <img src={reply.avatar} alt={reply.user} className="comment-avatar" style={{width: '28px', height: '28px'}} />
                        <div className="comment-content">
                          <div className="comment-header-row">
                            <span className="comment-user">@{reply.user.replace(' ', '')}</span>
                            <span className="comment-time">{reply.time}</span>
                          </div>
                          <div className="comment-text" style={{fontSize: '0.9rem'}}>
                            {reply.text}
                          </div>
                          <div className="comment-actions">
                            <button className="comment-action-btn">
                              <Heart size={12} /> {reply.likes}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <form className="comment-input-area" onSubmit={handleSubmit}>
          <img src="https://i.pravatar.cc/150?u=currentuser" alt="You" className="comment-avatar" />
          <input 
            type="text" 
            className="comment-input" 
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button type="submit" className="send-comment-btn" disabled={!newComment.trim()}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default CommentsDrawer;
