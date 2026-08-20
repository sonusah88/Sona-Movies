import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import Skeleton from '../ui/Skeleton';
import '../../pages/Library/Library.css'; // Shared CSS

const BookCard = ({ book, isLoading = false }) => {
  const navigate = useNavigate();

  const getAccessBadgeClass = (type) => {
    switch (type) {
      case 'OPEN_ACCESS':
      case 'PUBLIC_DOMAIN':
        return 'badge-success';
      case 'LICENSED':
        return 'badge-primary';
      case 'PREVIEW_ONLY':
        return 'badge-warning';
      case 'EXTERNAL':
        return 'badge-secondary';
      default:
        return 'badge-secondary';
    }
  };

  const getAccessLabel = (type) => {
    return type.replace('_', ' ');
  };

  if (isLoading || !book) {
    return (
      <div className="book-card">
        <div className="book-cover-container" style={{ aspectRatio: '2/3', borderRadius: '8px', overflow: 'hidden' }}>
          <Skeleton style={{ width: '100%', height: '100%' }} />
        </div>
        <div className="book-info" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
          <Skeleton style={{ width: '80%', height: '16px', borderRadius: '4px' }} />
          <Skeleton style={{ width: '60%', height: '12px', borderRadius: '4px' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="book-card" onClick={() => navigate(`/library/book/${book.id}`, { state: { book } })}>
      <div className="book-cover-container">
        <img src={book.cover} alt={book.title} className="book-cover" loading="lazy" />
        <div className={`access-badge ${getAccessBadgeClass(book.accessType)}`}>
          {getAccessLabel(book.accessType)}
        </div>
      </div>
      <div className="book-info">
        <h4 className="book-title" title={book.title}>{book.title}</h4>
        <p className="book-author">{book.author}</p>
        <div className="book-meta">
          <span className="book-rating">
            <Star size={12} fill="gold" color="gold" /> {book.rating}
          </span>
          <span className="book-category">{book.category}</span>
        </div>
      </div>
    </div>
  );
};

export default BookCard;
