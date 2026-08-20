import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { Search, AlertTriangle, Tv } from 'lucide-react';
import './LiveTV.css';

const LiveTV = () => {
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [proxyMode, setProxyMode] = useState(false);

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        // Attempt to fetch from optimized Vercel Serverless Function
        const response = await fetch('/api/channels');
        
        let apiSuccess = false;
        if (response.ok) {
          try {
            const data = await response.json();
            if (data.success && data.channels) {
              setChannels(data.channels);
              if (data.channels.length > 0) {
                setActiveChannel(data.channels[0]);
              }
              apiSuccess = true;
            }
          } catch (e) {
            console.warn('API returned non-JSON, falling back to local parsing.');
          }
        }
        
        if (!apiSuccess) {
          // Fallback for local Vite dev server without Vercel CLI
          console.log('Falling back to direct M3U parsing...');
          const [inRes, npRes, sportsRes, moviesRes, docRes] = await Promise.all([
            fetch('https://iptv-org.github.io/iptv/countries/in.m3u'),
            fetch('https://iptv-org.github.io/iptv/countries/np.m3u'),
            fetch('https://iptv-org.github.io/iptv/categories/sports.m3u'),
            fetch('https://iptv-org.github.io/iptv/categories/movies.m3u'),
            fetch('https://iptv-org.github.io/iptv/categories/documentary.m3u')
          ]);
          
          const inText = await inRes.text();
          const npText = await npRes.text();
          const sportsText = await sportsRes.text();
          const moviesText = await moviesRes.text();
          const docText = await docRes.text();
          
          const parseM3U = (text, countryLabel) => {
            const lines = text.split('\n');
            const parsed = [];
            let currentChannel = {};
            
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i].trim();
              if (line.startsWith('#EXTINF:')) {
                const logoMatch = line.match(/tvg-logo="([^"]+)"/);
                if (logoMatch) currentChannel.logo = logoMatch[1];
                
                const groupMatch = line.match(/group-title="([^"]+)"/);
                currentChannel.category = groupMatch ? groupMatch[1] : 'General';
                currentChannel.country = countryLabel;
                
                const namePart = line.split(',').pop();
                currentChannel.name = namePart.trim();
                currentChannel.id = currentChannel.name.toLowerCase().replace(/[^a-z0-9]/g, '');
              } else if (line && !line.startsWith('#')) {
                currentChannel.streamUrl = line;
                if (currentChannel.name && currentChannel.streamUrl) {
                  parsed.push({ ...currentChannel });
                }
                currentChannel = {};
              }
            }
            return parsed;
          };

          const allChannels = [
            ...parseM3U(inText, 'India'),
            ...parseM3U(npText, 'Nepal'),
            ...parseM3U(sportsText, 'Global'),
            ...parseM3U(moviesText, 'Global'),
            ...parseM3U(docText, 'Global')
          ];
          
          const uniqueChannels = [];
          const seenUrls = new Set();
          for (const channel of allChannels) {
            if (!seenUrls.has(channel.streamUrl)) {
              seenUrls.add(channel.streamUrl);
              uniqueChannels.push(channel);
            }
          }

          setChannels(uniqueChannels);
          if (uniqueChannels.length > 0) {
            setActiveChannel(uniqueChannels[0]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch IPTV playlists:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChannels();
  }, []);

  if (loading) {
    return (
      <div className="live-page fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <h2 style={{ color: 'var(--accent)' }}>Loading Live TV Database...</h2>
      </div>
    );
  }

  if (!activeChannel) {
    return (
      <div className="live-page fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <h2>No Channels Available</h2>
      </div>
    );
  }

  // Custom HLS Player Component
  const HlsVideoPlayer = ({ src, useProxy }) => {
    const videoRef = useRef(null);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
      setHasError(false); // Reset error state on new source
      let hls;
      const video = videoRef.current;
      
      if (video) {
        // Handle native video errors (like CORS or unplayable formats)
        const handleNativeError = () => {
          console.error("Native video error encountered.");
          setHasError(true);
        };
        video.addEventListener('error', handleNativeError);

        if (Hls.isSupported()) {
          const hlsConfig = {
            maxBufferLength: 30,
            enableWorker: true,
            lowLatencyMode: true,
          };

          // Apply CORS Proxy interceptor if enabled
          if (useProxy) {
            hlsConfig.xhrSetup = function (xhr, url) {
              if (url.startsWith('http')) {
                // Use a reliable proxy, e.g., corsproxy.io
                const proxiedUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                xhr.open('GET', proxiedUrl, true);
              }
            };
          }

          hls = new Hls(hlsConfig);
          
          hls.loadSource(src);
          hls.attachMedia(video);
          
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(e => console.log('Autoplay prevented:', e));
          });
          
          hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
              switch(data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  console.log("fatal network error encountered, try to recover");
                  // If it fails repeatedly, it's likely CORS or a dead link
                  if (data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR || data.details === Hls.ErrorDetails.MANIFEST_LOAD_TIMEOUT) {
                    setHasError(true);
                  } else {
                    hls.startLoad();
                  }
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.log("fatal media error encountered, try to recover");
                  hls.recoverMediaError();
                  break;
                default:
                  hls.destroy();
                  setHasError(true);
                  break;
              }
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = src;
          video.addEventListener('loadedmetadata', () => {
            video.play().catch(e => console.log('Autoplay prevented:', e));
          });
        }

        return () => {
          video.removeEventListener('error', handleNativeError);
          if (hls) hls.destroy();
        };
      }
    }, [src]);

    if (hasError) {
      return (
        <div className="live-player-error">
          <AlertTriangle size={48} className="error-icon" />
          <h3>Stream Offline or Blocked</h3>
          <p>This open-source stream is currently unavailable or region-blocked by the broadcaster. Please select another channel.</p>
        </div>
      );
    }

    return (
      <video
        ref={videoRef}
        controls
        autoPlay
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        className="live-iframe"
      />
    );
  };

  const filteredChannels = channels.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  
  const isMovie = (c) => c.category.toLowerCase().includes('movie') || c.category.toLowerCase().includes('cinema');
  const isDoc = (c) => c.category.toLowerCase().includes('documentary') || c.category.toLowerCase().includes('history') || c.name.toLowerCase().includes('discovery') || c.name.toLowerCase().includes('history') || c.name.toLowerCase().includes('nat geo');
  
  const indianChannels = filteredChannels.filter(c => c.country === 'India' && !isMovie(c) && !isDoc(c));
  const indianMovies = filteredChannels.filter(c => c.country === 'India' && isMovie(c));
  
  const nepaliChannels = filteredChannels.filter(c => c.country === 'Nepal' && !isMovie(c) && !isDoc(c));
  const nepaliMovies = filteredChannels.filter(c => c.country === 'Nepal' && isMovie(c));
  
  const sportsChannels = filteredChannels.filter(c => c.category.toLowerCase().includes('sports'));
  const docChannels = filteredChannels.filter(c => isDoc(c));

  return (
    <div className="live-page fade-in">
      <div className="live-header container">
        <h1 className="live-title">
          <span className="live-badge">LIVE</span> Television
        </h1>
        <p className="live-subtitle">Watch 24/7 news and entertainment channels from India and Nepal.</p>
      </div>

      <div className="live-container container">
        {/* Main Video Player */}
        <div className="live-player-section">
          <div className="live-player-wrapper glass cinematic-wrapper">
            <div className="player-top-bar">
              <div className="live-badge-indicator">
                <span className="pulsing-dot"></span> LIVE
              </div>
              <button 
                className={`proxy-toggle-btn ${proxyMode ? 'active' : ''}`}
                onClick={() => setProxyMode(!proxyMode)}
                title="Enable to bypass region blocks (may be slower)"
              >
                <AlertTriangle size={14} /> Anti-Block Mode {proxyMode ? 'ON' : 'OFF'}
              </button>
            </div>
            <HlsVideoPlayer src={activeChannel.streamUrl} useProxy={proxyMode} />
          </div>
          <div className="live-channel-info">
            <h2>{activeChannel.name}</h2>
            <span className="live-category-badge">{activeChannel.category}</span>
          </div>
        </div>

        {/* Channel Selector Sidebar */}
        <div className="live-sidebar">
          <div className="live-sidebar-header">
            <div className="channel-search-box">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search channels..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="channel-search-input"
              />
            </div>
          </div>

          <div className="live-sidebar-content">
            {indianChannels.length > 0 && (
              <>
                <h3>Indian Channels <span className="channel-count">({indianChannels.length})</span></h3>
                <div className="channel-grid">
                  {indianChannels.slice(0, 50).map((channel, i) => (
                    <button 
                      key={`in-${channel.id}-${i}`}
                      className={`channel-btn ${activeChannel.streamUrl === channel.streamUrl ? 'active' : ''}`}
                      onClick={() => setActiveChannel(channel)}
                    >
                      {channel.logo ? (
                        <img src={channel.logo} alt={channel.name} className="channel-logo-img" onError={(e) => e.target.style.display='none'} />
                      ) : (
                        <div className="channel-logo-placeholder">
                          <Tv size={20} />
                        </div>
                      )}
                      <span>{channel.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {indianMovies.length > 0 && (
              <>
                <h3 style={{ marginTop: '2rem' }}>Hindi Movies <span className="channel-count">({indianMovies.length})</span></h3>
                <div className="channel-grid">
                  {indianMovies.slice(0, 50).map((channel, i) => (
                    <button 
                      key={`in-mov-${channel.id}-${i}`}
                      className={`channel-btn ${activeChannel.streamUrl === channel.streamUrl ? 'active' : ''}`}
                      onClick={() => setActiveChannel(channel)}
                    >
                      {channel.logo ? (
                        <img src={channel.logo} alt={channel.name} className="channel-logo-img" onError={(e) => e.target.style.display='none'} />
                      ) : (
                        <div className="channel-logo-placeholder">
                          <Tv size={20} />
                        </div>
                      )}
                      <span>{channel.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {nepaliChannels.length > 0 && (
              <>
                <h3 style={{ marginTop: '2rem' }}>Nepali Channels <span className="channel-count">({nepaliChannels.length})</span></h3>
                <div className="channel-grid">
                  {nepaliChannels.slice(0, 50).map((channel, i) => (
                    <button 
                      key={`np-${channel.id}-${i}`}
                      className={`channel-btn ${activeChannel.streamUrl === channel.streamUrl ? 'active' : ''}`}
                      onClick={() => setActiveChannel(channel)}
                    >
                      {channel.logo ? (
                        <img src={channel.logo} alt={channel.name} className="channel-logo-img" onError={(e) => e.target.style.display='none'} />
                      ) : (
                        <div className="channel-logo-placeholder">
                          <Tv size={20} />
                        </div>
                      )}
                      <span>{channel.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {nepaliMovies.length > 0 && (
              <>
                <h3 style={{ marginTop: '2rem' }}>Nepali Movies <span className="channel-count">({nepaliMovies.length})</span></h3>
                <div className="channel-grid">
                  {nepaliMovies.slice(0, 50).map((channel, i) => (
                    <button 
                      key={`np-mov-${channel.id}-${i}`}
                      className={`channel-btn ${activeChannel.streamUrl === channel.streamUrl ? 'active' : ''}`}
                      onClick={() => setActiveChannel(channel)}
                    >
                      {channel.logo ? (
                        <img src={channel.logo} alt={channel.name} className="channel-logo-img" onError={(e) => e.target.style.display='none'} />
                      ) : (
                        <div className="channel-logo-placeholder">
                          <Tv size={20} />
                        </div>
                      )}
                      <span>{channel.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {docChannels.length > 0 && (
              <>
                <h3 style={{ marginTop: '2rem' }}>Discovery & History <span className="channel-count">({docChannels.length})</span></h3>
                <div className="channel-grid">
                  {docChannels.slice(0, 50).map((channel, i) => (
                    <button 
                      key={`doc-${channel.id}-${i}`}
                      className={`channel-btn ${activeChannel.streamUrl === channel.streamUrl ? 'active' : ''}`}
                      onClick={() => setActiveChannel(channel)}
                    >
                      {channel.logo ? (
                        <img src={channel.logo} alt={channel.name} className="channel-logo-img" onError={(e) => e.target.style.display='none'} />
                      ) : (
                        <div className="channel-logo-placeholder">
                          <Tv size={20} />
                        </div>
                      )}
                      <span>{channel.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {sportsChannels.length > 0 && (
              <>
                <h3 style={{ marginTop: '2rem' }}>Sports Channels <span className="channel-count">({sportsChannels.length})</span></h3>
                <div className="channel-grid">
                  {sportsChannels.slice(0, 50).map((channel, i) => (
                    <button 
                      key={`sp-${channel.id}-${i}`}
                      className={`channel-btn ${activeChannel.streamUrl === channel.streamUrl ? 'active' : ''}`}
                      onClick={() => setActiveChannel(channel)}
                    >
                      {channel.logo ? (
                        <img src={channel.logo} alt={channel.name} className="channel-logo-img" onError={(e) => e.target.style.display='none'} />
                      ) : (
                        <div className="channel-logo-placeholder">
                          <Tv size={20} />
                        </div>
                      )}
                      <span>{channel.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
            
            {filteredChannels.length === 0 && (
              <div className="no-channels-found">
                <p>No channels found for "{searchQuery}"</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTV;
