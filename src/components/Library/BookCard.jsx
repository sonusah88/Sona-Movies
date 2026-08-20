import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import '../../pages/Library/Library.css'; // Shared CSS

const BookCard = ({ book }) => {
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
