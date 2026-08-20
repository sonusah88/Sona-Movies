// src/components/VidkingPlayer.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Search, AlertTriangle, X, Flag } from "lucide-react";
import latentData from "../data/latent.json";
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
    id: "2embed",
    name: "Server 3",
    movieUrl: (id) => `https://www.2embed.cc/embed/${id}`,
    tvUrl: (id, s, e) => `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`,
  },
  {
    id: "multiembed",
    name: "Server 4",
    movieUrl: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    tvUrl: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
  },
  {
    id: "vidlink",
    name: "Server 6",
    movieUrl: (id) => `https://vidlink.pro/movie/${id}`,
    tvUrl: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}`,
  },
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
  const [showHelp, setShowHelp]           = useState(false);
  const [showVolumeBooster, setShowVolumeBooster] = useState(false);
  const [isRotated, setIsRotated]         = useState(false);
  const [showVpnBanner, setShowVpnBanner] = useState(true);
  const [reported, setReported]           = useState(false);

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

  // ── Report Issue ───────────────────────────────────────────────────────────
  const handleReport = useCallback(() => {
    // Log the report — wire to a webhook / analytics endpoint in production
    console.log("[Report Issue]", {
      mediaId: tmdbId,
      type,
      server: SERVERS[serverIndex]?.id,
      title,
      reportedAt: new Date().toISOString(),
    });
    setReported(true);
    // Reset the button label after 3 seconds
    setTimeout(() => setReported(false), 3000);
  }, [tmdbId, type, serverIndex, title]);

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
    setShowHelp(false);
    setShowVolumeBooster(false);
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

  // ── Main player ────────────────────────────────────────────────────────────
  return (
    <div className="vidking-wrapper" ref={wrapperRef}>

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
          onClick={() => { setIsRotated(true); setShowHelp(false); setShowVolumeBooster(false); }}
          title="Rotate Video"
        >
          🔄 Rotate
        </button>

        <button
          className="server-btn"
          style={{ background: "rgba(57,255,20,0.1)", color: "#39ff14", borderColor: "#39ff14" }}
          onClick={() => { setShowVolumeBooster(!showVolumeBooster); setShowHelp(false); }}
        >
          🔊 Volume Booster
        </button>

        {/* Report Issue button */}
        <button
          className="server-btn"
          style={{
            background: reported ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.1)",
            color: reported ? "#22c55e" : "#f87171",
            borderColor: reported ? "#22c55e" : "#f87171",
            transition: "all 0.3s ease",
          }}
          onClick={handleReport}
          title="Report broken video"
        >
          <Flag size={13} />
          {reported ? "Reported!" : "Report Issue"}
        </button>

        <button
          className="server-btn help-btn"
          onClick={() => { setShowHelp(!showHelp); setShowVolumeBooster(false); }}
        >
          <AlertTriangle size={14} /> Help
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

      {/* Volume booster panel */}
      {showVolumeBooster && (
        <div className="player-help glass" style={{ borderColor: "#39ff14", background: "rgba(57,255,20,0.05)" }}>
          <h4 style={{ color: "#39ff14" }}>🔊 How to Boost Volume up to 600%</h4>
          <p>Because movies are streamed from external servers, websites cannot force volume above 100%. Install a free extension to boost it!</p>
          <div className="help-links">
            <a href="https://chrome.google.com/webstore/detail/volume-master/jghecgabfgfdldnmbfkhmffcabokigjc" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ borderColor: "#39ff14", color: "#39ff14" }}>
              Download Volume Booster for Chrome
            </a>
          </div>
        </div>
      )}

      {/* Help panel */}
      {showHelp && (
        <div className="player-help glass">
          <h4>🎬 Movie not playing on any server?</h4>
          <p>Some regional movies may not be available. Try these alternatives:</p>
          <div className="help-links">
            <a href={`https://www.youtube.com/results?search_query=${searchQuery}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
              <Search size={16} /> Search on YouTube
            </a>
            <a href={`https://www.google.com/search?q=${searchQuery}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
              <Search size={16} /> Search on Google
            </a>
          </div>
        </div>
      )}

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
    </div>
  );
};

export default VidkingPlayer;
