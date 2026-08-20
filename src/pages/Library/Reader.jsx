import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { X, Maximize, Settings, AlignLeft, Bookmark, BookA, Loader, Search } from 'lucide-react';
import './Library.css';

const Reader = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [book, setBook] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [fontSize, setFontSize] = useState('1.1rem');
  
  // Dictionary State
  const [isDictOpen, setIsDictOpen] = useState(false);
  const [dictQuery, setDictQuery] = useState('');
  const [dictResult, setDictResult] = useState(null);
  const [dictLoading, setDictLoading] = useState(false);
  const [dictError, setDictError] = useState('');

  useEffect(() => {
    // Prefer the book passed from the SearchFederator via state
    if (location.state?.book) {
      setBook(location.state.book);
    } else {
      navigate('/library');
    }

    const handleKeyDown = (e) => {
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen();
          setIsFullscreen(false);
        } else {
          navigate(-1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [id, navigate, location.state]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleDictionarySearch = async (e) => {
    e.preventDefault();
    if (!dictQuery.trim()) return;
    
    setDictLoading(true);
    setDictError('');
    setDictResult(null);
    
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(dictQuery.trim())}`);
      if (!response.ok) {
        throw new Error('Word not found.');
      }
      const data = await response.json();
      setDictResult(data[0]);
    } catch (err) {
      setDictError(err.message);
    } finally {
      setDictLoading(false);
    }
  };

  if (!book) return <div className="library-container"><p style={{padding:'40px'}}>Loading Book...</p></div>;

  return (
    <div className={`reader-container theme-${theme}`} style={{ 
      height: '100vh', 
      background: theme === 'dark' ? '#0a0a0a' : '#f5f5f5',
      color: theme === 'dark' ? '#e5e5e5' : '#111',
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Reader Toolbar */}
      <div className="reader-toolbar" style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        padding: '15px 20px', 
        background: theme === 'dark' ? '#1a1a1a' : '#ffffff',
        borderBottom: `1px solid ${theme === 'dark' ? '#333' : '#ddd'}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            <X size={24} />
          </button>
          <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '300px' }}>
            <div style={{ fontWeight: '600' }}>{book.title}</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{book.author}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button 
            onClick={() => setIsDictOpen(!isDictOpen)} 
            title="Dictionary" 
            style={{ 
              background: isDictOpen ? '#3b82f6' : 'transparent', 
              border: 'none', 
              color: isDictOpen ? '#fff' : 'inherit', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
              padding: '5px 10px', borderRadius: '5px'
            }}
          >
            <BookA size={20} /> <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Dictionary</span>
          </button>
          <button title="Bookmark" style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            <Bookmark size={20} />
          </button>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle Theme" style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            <Settings size={20} />
          </button>
          <button onClick={toggleFullscreen} title="Fullscreen (F)" style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            <Maximize size={20} />
          </button>
        </div>
      </div>

      {/* Main Content Area: Reader + Sidebar */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Reader Core */}
        <div className="reader-content-wrapper" style={{ 
          flex: 1, 
          height: '100%',
          background: theme === 'dark' ? '#0a0a0a' : '#d4d4d8', // Canvas background
          display: 'flex',
          justifyContent: 'center',
          padding: '20px 0',
          boxSizing: 'border-box'
        }}>
          {book.pdfUrl ? (
             <iframe 
               src={book.pdfUrl} 
               title={book.title}
               style={{ 
                 width: '100%', 
                 maxWidth: '850px', // Constrain to comfortable reading width
                 height: '100%', 
                 border: 'none',
                 background: '#ffffff', // Force white page
                 boxShadow: '0 15px 35px rgba(0,0,0,0.2)', // Float the page
                 borderRadius: '4px 4px 0 0' // Slight page rounding
               }}
             />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <p style={{ opacity: 0.7 }}>No readable content provided by the source API.</p>
            </div>
          )}
        </div>

        {/* Dictionary Sidebar */}
        {isDictOpen && (
          <div className="dictionary-sidebar slide-in-right" style={{
            width: '350px',
            background: theme === 'dark' ? '#1a1a1a' : '#ffffff',
            borderLeft: `1px solid ${theme === 'dark' ? '#333' : '#ddd'}`,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-5px 0 15px rgba(0,0,0,0.1)'
          }}>
            <div style={{ padding: '20px', borderBottom: `1px solid ${theme === 'dark' ? '#333' : '#ddd'}` }}>
              <h3 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookA size={18} /> Dictionary
              </h3>
              <form onSubmit={handleDictionarySearch} style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  placeholder="Search a word..." 
                  value={dictQuery}
                  onChange={(e) => setDictQuery(e.target.value)}
                  style={{ 
                    flex: 1, padding: '8px 12px', borderRadius: '5px', 
                    border: `1px solid ${theme === 'dark' ? '#444' : '#ccc'}`,
                    background: theme === 'dark' ? '#222' : '#fff',
                    color: 'inherit'
                  }}
                />
                <button type="submit" className="btn-primary" style={{ padding: '8px 12px', borderRadius: '5px' }}>
                  <Search size={16} />
                </button>
              </form>
            </div>

            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              {dictLoading && <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}><Loader className="spinner" size={24} /></div>}
              {dictError && <p style={{ color: '#ef4444' }}>{dictError}</p>}
              
              {dictResult && !dictLoading && (
                <div className="fade-in">
                  <h2 style={{ fontSize: '2rem', margin: '0 0 5px 0', color: '#3b82f6' }}>{dictResult.word}</h2>
                  {dictResult.phonetic && <p style={{ color: '#a1a1aa', marginBottom: '15px' }}>{dictResult.phonetic}</p>}
                  
                  {dictResult.meanings.map((meaning, idx) => (
                    <div key={idx} style={{ marginBottom: '20px' }}>
                      <h4 style={{ fontStyle: 'italic', color: theme === 'dark' ? '#d4d4d8' : '#555', borderBottom: `1px solid ${theme === 'dark' ? '#333' : '#eee'}`, paddingBottom: '5px', marginBottom: '10px' }}>
                        {meaning.partOfSpeech}
                      </h4>
                      <ol style={{ paddingLeft: '20px', margin: 0, color: theme === 'dark' ? '#a1a1aa' : '#333' }}>
                        {meaning.definitions.slice(0, 3).map((def, i) => (
                          <li key={i} style={{ marginBottom: '10px', lineHeight: '1.5' }}>
                            {def.definition}
                            {def.example && <div style={{ opacity: 0.7, fontStyle: 'italic', marginTop: '5px' }}>"{def.example}"</div>}
                          </li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
              )}
              
              {!dictResult && !dictLoading && !dictError && (
                <div style={{ textAlign: 'center', opacity: 0.5, marginTop: '40px' }}>
                  <BookA size={40} style={{ marginBottom: '10px' }} />
                  <p>Search any word to see its definition.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default Reader;
