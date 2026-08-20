import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Star, Share2, BookmarkPlus, ArrowLeft, ExternalLink, Library } from 'lucide-react';
import './Library.css';

const BookDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [book, setBook] = useState(null);
  const [authorBio, setAuthorBio] = useState(null);
  const [bioLoading, setBioLoading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    // Prefer the book passed from the SearchFederator via state
    if (location.state?.book) {
      setBook(location.state.book);
    } else {
      // Direct navigation without state
      navigate('/library');
    }
  }, [id, location.state, navigate]);

  const handleFetchAuthorBio = async () => {
    if (!book || !book.author || book.author === 'Unknown Author') return;
    if (authorBio) {
      setAuthorBio(null); // Toggle off
      return;
    }
    
    setBioLoading(true);
    try {
      // Format author name (e.g. "Stoker, Bram" -> "Bram Stoker")
      let queryName = book.author;
      if (queryName.includes(',')) {
        const parts = queryName.split(',');
        queryName = `${parts[1].trim()} ${parts[0].trim()}`;
      }
      
      const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(queryName)}`);
      if (!res.ok) throw new Error('Not found');
      
      const data = await res.json();
      setAuthorBio({
        title: data.title,
        description: data.description,
        extract: data.extract,
        thumbnail: data.thumbnail?.source || null,
        url: data.content_urls?.desktop?.page || null
      });
    } catch (err) {
      setAuthorBio({ error: "Wikipedia biography not found for this author." });
    } finally {
      setBioLoading(false);
    }
  };

  if (!book) return <div className="library-container"><p>Book not found.</p></div>;

  const handleRead = () => {
    if (book.access?.type === 'EXTERNAL_READER' || book.access?.type === 'BORROW' || book.accessType === 'EXTERNAL') {
      window.open(book.access?.url || book.sourceUrl || book.pdfUrl || '#', '_blank');
    } else {
      // INTERNAL_READER or fallback to mock reader
      navigate(`/library/read/${book.id}`, { state: { book } });
    }
  };

  return (
    <div className="library-container fade-in">
      <button className="back-button" onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '20px' }}>
        <ArrowLeft size={20} /> Back to Library
      </button>

      <div className="book-details-layout" style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
        
        {/* Left: Cover */}
        <div className="book-details-left" style={{ flex: '1', minWidth: '300px', maxWidth: '400px' }}>
          <div className="book-cover-large" style={{ width: '100%', aspectRatio: '2/3', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <img src={book.cover} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>

        {/* Right: Info */}
        <div className="book-details-right" style={{ flex: '2', minWidth: '300px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <span className={`access-badge badge-${book.accessType === 'OPEN_ACCESS' || book.accessType === 'PUBLIC_DOMAIN' ? 'success' : book.accessType === 'LICENSED' ? 'primary' : 'warning'}`} style={{ position: 'static' }}>
              {book.accessType.replace('_', ' ')}
            </span>
            <span style={{ color: '#a1a1aa' }}>{book.category} {book.subcategory ? `• ${book.subcategory}` : ''}</span>
          </div>

          <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>{book.title}</h1>
          <h2 
            onClick={handleFetchAuthorBio}
            style={{ fontSize: '1.2rem', color: '#3b82f6', marginBottom: '20px', fontWeight: 'normal', cursor: 'pointer', display: 'inline-block', borderBottom: '1px dashed #3b82f6' }}
            title="Click to load Wikipedia bio"
          >
            By {book.author}
          </h2>

          {/* Author Bio Panel */}
          {(bioLoading || authorBio) && (
            <div className="author-bio-panel slide-in-bottom" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6', borderRadius: '8px', padding: '15px', marginBottom: '20px', display: 'flex', gap: '15px' }}>
              {bioLoading ? (
                <p>Loading Wikipedia...</p>
              ) : authorBio.error ? (
                <p style={{ color: '#a1a1aa' }}>{authorBio.error}</p>
              ) : (
                <>
                  {authorBio.thumbnail && <img src={authorBio.thumbnail} alt={authorBio.title} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }}/>}
                  <div>
                    <h3 style={{ margin: '0 0 5px 0' }}>{authorBio.title}</h3>
                    <p style={{ color: '#a1a1aa', margin: '0 0 10px 0', fontSize: '0.9rem' }}>{authorBio.description}</p>
                    <p style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>{authorBio.extract}</p>
                    {authorBio.url && <a href={authorBio.url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', fontSize: '0.9rem', marginTop: '10px', display: 'inline-block' }}>Read more on Wikipedia</a>}
                  </div>
                </>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Star fill="gold" color="gold" size={18} />
              <span style={{ fontWeight: 'bold' }}>{book.rating || 'N/A'}</span>
              <span style={{ color: '#a1a1aa' }}>({(book.reviews || 0).toLocaleString()} reviews)</span>
            </div>
            <div style={{ color: '#a1a1aa' }}>{book.pages || 'N/A'} Pages</div>
            <div style={{ color: '#a1a1aa' }}>{book.language || 'English'}</div>
          </div>

          <p style={{ fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '30px', color: '#d4d4d8' }}>
            {book.description || 'No description available for this book.'}
          </p>

          <div className="book-metadata-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px', background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '10px' }}>
            <div><strong style={{ color: '#a1a1aa' }}>Publisher:</strong> {book.publisher || 'Unknown'}</div>
            <div><strong style={{ color: '#a1a1aa' }}>Year:</strong> {book.publicationYear || 'Unknown'}</div>
            <div><strong style={{ color: '#a1a1aa' }}>ISBN:</strong> {book.isbn || 'N/A'}</div>
            <div>
              <strong style={{ color: '#a1a1aa' }}>Tags:</strong> 
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '5px' }}>
                {(book.tags || []).map(t => <span key={t} style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem' }}>{t}</span>)}
              </div>
            </div>
          </div>
          
          {book.sources && book.sources.length > 1 && (
            <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '10px', color: '#a1a1aa' }}>
                <Library size={16} /> Available Sources ({book.sources.length})
              </h4>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {book.sources.map((src, idx) => (
                  <span key={idx} className="badge-secondary" style={{ padding: '4px 10px', borderRadius: '15px', fontSize: '0.8rem' }}>
                    {src.providerId}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="book-actions" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={handleRead} style={{ padding: '15px 30px', fontSize: '1.1rem' }}>
              <BookOpen size={20} /> 
              {book.access?.type === 'PREVIEW' ? 'Preview Extract' : book.access?.type === 'BORROW' ? 'Borrow from Library' : book.access?.type === 'EXTERNAL_READER' ? 'Read Official Source' : 'Read Now'}
              {(book.access?.type === 'EXTERNAL_READER' || book.access?.type === 'BORROW' || book.accessType === 'EXTERNAL') && <ExternalLink size={16} style={{ marginLeft: '5px' }}/>}
            </button>
            <button className="btn-secondary" style={{ padding: '15px 30px', fontSize: '1.1rem' }}>
              <BookmarkPlus size={20} /> Save to Library
            </button>
            <button className="btn-secondary" style={{ padding: '15px' }} title="Share">
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetails;
