// src/components/VidkingPlayer.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Search, AlertTriangle, X, Flag, Video, VideoOff } from "lucide-react";
import latentData from "../data/latent.json";
import { useWebRTC } from "../hooks/useWebRTC";
import "./VidkingPlayer.css";

// ---------------------------------------------------------------------------
// Server definitions
// ---------------------------------------------------------------------------
const SERVERS = [
  {
    id: "cineverse",
    name: "Hindi Server 1 (Cineverse)",
    movieUrl: (id) => `https://rozgarlelo.modiplay.xyz/embed/tmdb/movie?id=${id}&autoplay=1`,
    tvUrl: (id, s, e) => `https://rozgarlelo.modiplay.xyz/embed/tmdb/tv?id=${id}&s=${s}&e=${e}&autoplay=1`,
    isHindi: true,
  },
  {
    id: "screenscape",
    name: "Hindi Server 2 (ScreenScape)",
    movieUrl: (id) => `https://screenscape.me/embed?tmdb=${id}&type=movie&lan=hindi&autoplay=1&server=Sealx`,
    tvUrl: (id, s, e) => `https://screenscape.me/embed?tmdb=${id}&type=tv&s=${s}&e=${e}&lan=hindi&autoplay=1&server=Sealx`,
    isHindi: true,
  },
  {
    id: "vidsrc_to",
    name: "Server 3",
    movieUrl: (id) => `https://vidsrc.to/embed/movie/${id}`,
    tvUrl: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: "multiembed",
    name: "Server 4",
    movieUrl: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    tvUrl: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
  },
  {
    id: "vidlink",
    name: "Server 5",
    movieUrl: (id) => `https://vidlink.pro/movie/${id}`,
    tvUrl: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}`,
  }
];

// ---------------------------------------------------------------------------
// Lightweight in-memory QoS telemetry
// ---------------------------------------------------------------------------
function createQoS(label) {
  return {
    label,
    mountTime: performance.now(),
    ttff: null,
    serverSwitches: 0,
    hiddenAt: null,
    totalHiddenMs: 0,

    onIframeLoad(serverName) {
      if (this.ttff === null) {
        this.ttff = Math.round(performance.now() - this.mountTime);
        console.info(
          `[QoS] "${this.label}" — TTFF: ${this.ttff}ms via ${serverName}`,
          this.ttff < 3000 ? "✅ Under target" : "⚠️ Exceeded 3s target"
        );
      }
    },
    onServerSwitch(from, to) {
      this.serverSwitches += 1;
      console.info(`[QoS] "${this.label}" — Server switch #${this.serverSwitches}: ${from} → ${to}`);
    },
    onVisibilityHide() { this.hiddenAt = performance.now(); },
    onVisibilityShow() {
      if (this.hiddenAt !== null) {
        const ms = Math.round(performance.now() - this.hiddenAt);
        this.totalHiddenMs += ms;
        this.hiddenAt = null;
        if (ms > 5000) console.info(`[QoS] "${this.label}" — Potential stall: hidden ${ms}ms`);
      }
    },
    report() {
      console.groupCollapsed(`[QoS] Final report — "${this.label}"`);
      console.info("TTFF:", this.ttff != null ? `${this.ttff}ms` : "not measured");
      console.info("Server switches:", this.serverSwitches);
      console.info("Total background time:", `${this.totalHiddenMs}ms`);
      console.groupEnd();
    },
  };
}

// ---------------------------------------------------------------------------
// VidkingPlayer
// ---------------------------------------------------------------------------
const VidkingPlayer = ({
  tmdbId,
  type = "movie",
  season = 1,
  episode = 1,
  title = "",
  isHindi = false,
}) => {
  const [serverIndex, setServerIndex]     = useState(0);
  const [isRotated, setIsRotated]         = useState(false);
  const [showVpnBanner, setShowVpnBanner] = useState(true);

  const qos = useRef(null);
  const wrapperRef = useRef(null);

  // ── QoS session ────────────────────────────────────────────────────────────
  useEffect(() => {
    qos.current = createQoS(title || tmdbId);
    const handleVis = () => {
      if (!qos.current) return;
      document.visibilityState === "hidden"
        ? qos.current.onVisibilityHide()
        : qos.current.onVisibilityShow();
    };
    document.addEventListener("visibilitychange", handleVis);
    return () => {
      document.removeEventListener("visibilitychange", handleVis);
      qos.current?.report();
    };
  }, [tmdbId, title]);

  // ── Keyboard hotkeys ───────────────────────────────────────────────────────
  // Space → focus iframe (triggers play/pause inside the embed)
  // F     → request fullscreen on the player wrapper
  // M     → not directly controllable across iframe boundary; we show a hint
  useEffect(() => {
    const handleKey = (e) => {
      // Ignore when typing in an input / textarea
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      switch (e.code) {
        case "Space": {
          e.preventDefault();
          // Focus the iframe so Space reaches the embedded player
          const iframe = wrapperRef.current?.querySelector("iframe");
          if (iframe) iframe.focus();
          break;
        }
        case "KeyF": {
          const el = wrapperRef.current || document.documentElement;
          if (!document.fullscreenElement) {
            el.requestFullscreen?.().catch(() => {});
          } else {
            document.exitFullscreen?.();
          }
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);



  // ── Server tracking ────────────────────────────────────────────────────────
  const prevServerIndex = useRef(serverIndex);
  const handleServerSwitch = useCallback((newIndex) => {
    if (newIndex !== prevServerIndex.current) {
      qos.current?.onServerSwitch(
        SERVERS[prevServerIndex.current]?.name,
        SERVERS[newIndex]?.name
      );
      prevServerIndex.current = newIndex;
    }
    setServerIndex(newIndex);
  }, []);

  const handleIframeLoad = useCallback(() => {
    qos.current?.onIframeLoad(SERVERS[serverIndex]?.name);
  }, [serverIndex]);

  useEffect(() => {
    if (isHindi || tmdbId === "indias-got-latent") setServerIndex(0);
  }, [isHindi, tmdbId]);

  const server       = SERVERS[serverIndex];
  const actualTmdbId = tmdbId === "indias-got-latent" ? "262838" : tmdbId;
  const url          = type === "movie"
    ? server.movieUrl(actualTmdbId)
    : server.tvUrl(actualTmdbId, season, episode);

  const searchQuery  = encodeURIComponent(`${title} full movie watch online`);

  // ── YouTube shortcut ───────────────────────────────────────────────────────
  if (type === "youtube") {
    return (
      <div className="vidking-wrapper" ref={wrapperRef}>
        {isRotated ? createPortal(
          <div className="player-container rotated">
            <button className="close-rotate-btn" onClick={() => setIsRotated(false)}>✖ Exit Rotation</button>
            <iframe
              src={`https://www.youtube.com/embed/${tmdbId}?autoplay=1`}
              width="100%" height="100%" frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen title={title} onLoad={handleIframeLoad}
            />
          </div>,
          document.body
        ) : (
          <div className="player-container">
            <iframe
              src={`https://www.youtube.com/embed/${tmdbId}?autoplay=1`}
              width="100%" height="100%" frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen title={title} onLoad={handleIframeLoad}
            />
          </div>
        )}
      </div>
    );
  }

  // ── WebRTC Virtual Cinema (Room Management) ──────────────────────────────────
  const [roomId, setRoomId] = useState(null);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [userId] = useState(() => "user-" + Math.random().toString(36).substring(2, 9));
  const [syncCountdown, setSyncCountdown] = useState(null);

  const startSyncCountdown = useCallback(() => {
    // In a real networked app, this would broadcast via useWatchParty
    let count = 3;
    setSyncCountdown(count);
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setSyncCountdown(count);
      } else if (count === 0) {
        setSyncCountdown("GO! (Press Play)");
      } else {
        clearInterval(interval);
        setSyncCountdown(null);
      }
    }, 1000);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get("room");
    if (roomFromUrl) {
      setRoomId(roomFromUrl);
    }
  }, []);

  const handleCreateRoom = useCallback(() => {
    // Generate a 6-digit numeric code
    const newRoomId = Math.floor(100000 + Math.random() * 900000).toString();
    const url = new URL(window.location);
    url.searchParams.set("room", newRoomId);
    window.history.pushState({}, "", url);
    setRoomId(newRoomId);
  }, []);

  const handleJoinRoomSubmit = useCallback((e) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    const cleanCode = joinCodeInput.trim().toUpperCase();
    const url = new URL(window.location);
    url.searchParams.set("room", cleanCode);
    window.history.pushState({}, "", url);
    setRoomId(cleanCode);
  }, [joinCodeInput]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    alert("Invite link copied to clipboard!");
  }, []);

  // Use dynamic roomId instead of "demo-room"
  const { localStream, remoteStreams, isJoined, joinCall, leaveCall } = useWebRTC(roomId, userId, true);

  const handleLeaveRoom = useCallback(() => {
    if (isJoined) leaveCall();
    const url = new URL(window.location);
    url.searchParams.delete("room");
    window.history.pushState({}, "", url);
    setRoomId(null);
  }, [isJoined, leaveCall]);

  // ── Main player ────────────────────────────────────────────────────────────
  return (
    <div className="vidking-wrapper" ref={wrapperRef}>

      {/* ── WebRTC Action Bar (Top) ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0, 0, 0, 0.4)', padding: '0.75rem 1.25rem', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)', marginBottom: '1rem', overflowX: 'auto', whiteSpace: 'nowrap' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--accent)' }}>Virtual Cinema</span>
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>{roomId ? `Room Code: ${roomId}` : 'Watch with friends'}</span>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {!roomId ? (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button 
                className="btn btn-primary"
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }} 
                onClick={handleCreateRoom}
              >
                👥 Create Party
              </button>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>or</span>
              <form onSubmit={handleJoinRoomSubmit} style={{ display: 'flex', gap: '0.25rem' }}>
                <input 
                  type="text" 
                  placeholder="Enter Code..." 
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.4rem 0.75rem', borderRadius: '8px', fontSize: '0.85rem', width: '110px', outline: 'none' }}
                />
                <button 
                  type="submit"
                  className="btn btn-outline"
                  style={{ fontSize: '0.85rem', padding: '0.4rem 0.75rem', fontWeight: 'bold' }} 
                >
                  Join
                </button>
              </form>
            </div>
          ) : (
            <>
              <button 
                className="btn btn-outline"
                style={{ fontSize: '0.85rem', padding: '0.4rem 0.75rem', fontWeight: 'bold', color: '#ffb300', borderColor: '#ffb300' }} 
                onClick={startSyncCountdown}
                title="Start a 3-second countdown to sync playback with friends"
              >
                ⏱️ Sync Play
              </button>

              <button 
                className="btn btn-outline"
                style={{ fontSize: '0.85rem', padding: '0.4rem 0.75rem', fontWeight: 'bold' }} 
                onClick={handleCopyLink}
              >
                📋 Copy Invite
              </button>
              
              <button 
                className={`btn ${isJoined ? 'btn-danger' : 'btn-primary'}`} 
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }} 
                onClick={isJoined ? leaveCall : joinCall}
              >
                {isJoined ? <><VideoOff size={16} /> Leave Call</> : <><Video size={16} /> Join Call</>}
              </button>

              <button 
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', color: '#ff4d4f', borderColor: '#ff4d4f' }} 
                onClick={handleLeaveRoom}
                title="Exit Room completely"
              >
                <X size={16} /> Exit Room
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── WebRTC Floating Container (10%) ── */}
      {isJoined && (
        <div className="webrtc-floating-container">
          <div className="webrtc-grid">
            {/* Local Video */}
            <div className="webrtc-feed local-feed">
              <video 
                ref={el => { if (el) el.srcObject = localStream; }} 
                autoPlay playsInline muted 
                className="webrtc-video"
              />
            </div>
            
            {/* Remote Videos */}
            {Object.entries(remoteStreams).map(([peerId, stream]) => (
              <div key={peerId} className="webrtc-feed remote-feed">
                <video 
                  ref={el => { if (el) el.srcObject = stream; }} 
                  autoPlay playsInline 
                  className="webrtc-video remote-video"
                />
              </div>
            ))}
          </div>
          <button className="btn btn-danger webrtc-leave-btn" onClick={leaveCall}>
            <X size={12} /> Leave Call
          </button>
        </div>
      )}

      {/* Server selector bar */}
      <div className="server-bar glass">
        <span className="server-label">Switch server if not playing:</span>
        {SERVERS.map((s, i) => (
          <button
            key={s.id}
            className={`server-btn ${i === serverIndex ? "active" : ""}`}
            onClick={() => handleServerSwitch(i)}
          >
            {s.name}
          </button>
        ))}

        <button
          className="server-btn mobile-only"
          style={{ marginLeft: "auto", background: "rgba(255,193,7,0.1)", color: "#ffc107", borderColor: "#ffc107" }}
          onClick={() => { setIsRotated(true); }}
          title="Rotate Video"
        >
          🔄 Rotate
        </button>
      </div>

      {/* Hotkey hint — shown once, non-intrusive */}
      <div style={{
        fontSize: "0.7rem",
        color: "rgba(255,255,255,0.3)",
        padding: "4px 8px",
        textAlign: "right",
      }}>
        Hotkeys: <kbd style={{ background: "rgba(255,255,255,0.08)", borderRadius: 4, padding: "1px 5px" }}>Space</kbd> focus &nbsp;
        <kbd style={{ background: "rgba(255,255,255,0.08)", borderRadius: 4, padding: "1px 5px" }}>F</kbd> fullscreen
      </div>

      {/* VPN banner */}
      {showVpnBanner && (
        <div className="vpn-banner glass">
          <div className="vpn-banner-content">
            <span className="vpn-badge">SPONSORED</span>
            <div className="vpn-text">
              <h4>Stream Safely &amp; Unblock All Movies</h4>
              <p>Hide your IP and get 70% off a premium VPN!</p>
            </div>
          </div>
          <div className="vpn-banner-actions">
            <a href="https://nordvpn.com/" target="_blank" rel="noopener noreferrer" className="btn btn-primary vpn-btn">Get VPN Offer</a>
            <button className="vpn-close-btn" onClick={() => setShowVpnBanner(false)} aria-label="Close Ad"><X size={16} /></button>
          </div>
        </div>
      )}

      {/* iframe */}
      {isRotated ? createPortal(
        <div className="player-container rotated">
          <button className="close-rotate-btn" onClick={() => setIsRotated(false)}>✖ Exit Rotation</button>
          <iframe
            src={url} width="100%" height="100%" frameBorder="0"
            allowFullScreen allow="autoplay; encrypted-media; fullscreen"
            referrerPolicy="origin" title="Video Player" onLoad={handleIframeLoad}
          />
        </div>,
        document.body
      ) : (
        <div className="player-container">
          <iframe
            src={url} width="100%" height="100%" frameBorder="0"
            allowFullScreen allow="autoplay; encrypted-media; fullscreen"
            referrerPolicy="origin" title="Video Player" onLoad={handleIframeLoad}
          />
        </div>
      )}
      {/* ── Sync Countdown Overlay ── */}
      {syncCountdown && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          background: 'rgba(0,0,0,0.6)', zIndex: 9999, pointerEvents: 'none'
        }}>
          <h1 style={{
            fontSize: '8rem', color: 'white', textShadow: '0 0 40px rgba(0, 229, 255, 1)',
            fontWeight: '900', margin: 0, animation: 'pulse 1s infinite'
          }}>
            {syncCountdown}
          </h1>
        </div>
      )}
    </div>
  );
};

export default VidkingPlayer;
