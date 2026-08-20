// src/components/VidkingPlayer.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Search, AlertTriangle, X } from "lucide-react";
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
// All data stays in-memory — zero localStorage, zero network requests.
// Swap console.log for a real analytics endpoint in a future iteration.
// ---------------------------------------------------------------------------
function createQoS(label) {
  return {
    label,
    mountTime: performance.now(),   // when player mounted (ms)
    ttff: null,                     // Time To First Frame (ms)
    serverSwitches: 0,              // how many times user switched server
    hiddenAt: null,                 // timestamp tab was hidden (detect stalls)
    totalHiddenMs: 0,               // cumulative bg time (not stall time)

    onIframeLoad(serverName) {
      if (this.ttff === null) {
        this.ttff = Math.round(performance.now() - this.mountTime);
        console.info(
          `[QoS] "${this.label}" — TTFF: ${this.ttff}ms via ${serverName}`,
          this.ttff < 3000 ? "✅ Under target" : "⚠️ Exceeded 3s target"
        );
      }
    },

    onServerSwitch(fromServer, toServer) {
      this.serverSwitches += 1;
      console.info(
        `[QoS] "${this.label}" — Server switch #${this.serverSwitches}: ${fromServer} → ${toServer}`
      );
    },

    onVisibilityHide() {
      this.hiddenAt = performance.now();
    },

    onVisibilityShow() {
      if (this.hiddenAt !== null) {
        const hiddenFor = Math.round(performance.now() - this.hiddenAt);
        this.totalHiddenMs += hiddenFor;
        this.hiddenAt = null;
        // A tab hidden for >5 s with no interaction likely means a stall or user pause
        if (hiddenFor > 5000) {
          console.info(
            `[QoS] "${this.label}" — Potential stall detected: tab hidden for ${hiddenFor}ms`
          );
        }
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
  const [serverIndex, setServerIndex] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [showVolumeBooster, setShowVolumeBooster] = useState(false);
  const [isRotated, setIsRotated] = useState(false);
  const [showVpnBanner, setShowVpnBanner] = useState(true);

  // QoS session — stable ref across renders, reset when tmdbId changes
  const qos = useRef(null);

  useEffect(() => {
    qos.current = createQoS(title || tmdbId);

    const handleVisibilityChange = () => {
      if (!qos.current) return;
      if (document.visibilityState === "hidden") {
        qos.current.onVisibilityHide();
      } else {
        qos.current.onVisibilityShow();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Report summary on unmount
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      qos.current?.report();
    };
  }, [tmdbId, title]);

  // Track server switches via a ref holding the previous index
  const prevServerIndex = useRef(serverIndex);
  const handleServerSwitch = useCallback(
    (newIndex) => {
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
    },
    []
  );

  // iframe onLoad -> record TTFF
  const handleIframeLoad = useCallback(() => {
    qos.current?.onIframeLoad(SERVERS[serverIndex]?.name);
  }, [serverIndex]);

  useEffect(() => {
    if (isHindi || tmdbId === "indias-got-latent") {
      setServerIndex(0);
    }
  }, [isHindi, tmdbId]);

  const server = SERVERS[serverIndex];
  const actualTmdbId = tmdbId === "indias-got-latent" ? "262838" : tmdbId;
  const url =
    type === "movie"
      ? server.movieUrl(actualTmdbId)
      : server.tvUrl(actualTmdbId, season, episode);

  const searchQuery = encodeURIComponent(`${title} full movie watch online`);

  // ── YouTube shortcut ──────────────────────────────────────────────────────
  if (type === "youtube") {
    return (
      <div className="vidking-wrapper">
        {isRotated ? (
          createPortal(
            <div className="player-container rotated">
              <button className="close-rotate-btn" onClick={() => setIsRotated(false)}>
                ✖ Exit Rotation
              </button>
              <iframe
                src={`https://www.youtube.com/embed/${tmdbId}?autoplay=1`}
                width="100%"
                height="100%"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={title}
                onLoad={handleIframeLoad}
              />
            </div>,
            document.body
          )
        ) : (
          <div className="player-container">
            <iframe
              src={`https://www.youtube.com/embed/${tmdbId}?autoplay=1`}
              width="100%"
              height="100%"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={title}
              onLoad={handleIframeLoad}
            />
          </div>
        )}
      </div>
    );
  }

  // ── Main player ───────────────────────────────────────────────────────────
  return (
    <div className="vidking-wrapper">
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
          title="Boost Volume"
        >
          🔊 Volume Booster
        </button>

        <button
          className="server-btn help-btn"
          onClick={() => { setShowHelp(!showHelp); setShowVolumeBooster(false); }}
          title="Movie not available?"
        >
          <AlertTriangle size={14} /> Help
        </button>
      </div>

      {/* Volume booster panel */}
      {showVolumeBooster && (
        <div className="player-help glass" style={{ borderColor: "#39ff14", background: "rgba(57,255,20,0.05)" }}>
          <h4 style={{ color: "#39ff14" }}>🔊 How to Boost Volume up to 600%</h4>
          <p>
            Because movies are streamed from external secure servers, websites are technically blocked from forcing
            the volume higher than 100%. However, you can instantly boost the volume by installing a free browser
            extension!
          </p>
          <div className="help-links">
            <a
              href="https://chrome.google.com/webstore/detail/volume-master/jghecgabfgfdldnmbfkhmffcabokigjc"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{ borderColor: "#39ff14", color: "#39ff14" }}
            >
              Download Volume Booster for Chrome
            </a>
          </div>
        </div>
      )}

      {/* Help / not playing panel */}
      {showHelp && (
        <div className="player-help glass">
          <h4>🎬 Movie not playing on any server?</h4>
          <p>Some regional movies may not be available on streaming servers. Try these alternatives:</p>
          <div className="help-links">
            <a
              href={`https://www.youtube.com/results?search_query=${searchQuery}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              <Search size={16} /> Search on YouTube
            </a>
            <a
              href={`https://www.google.com/search?q=${searchQuery}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
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
              <p>Your ISP might be tracking your streaming activity. Hide your IP and get 70% off a premium VPN!</p>
            </div>
          </div>
          <div className="vpn-banner-actions">
            <a href="https://nordvpn.com/" target="_blank" rel="noopener noreferrer" className="btn btn-primary vpn-btn">
              Get VPN Offer
            </a>
            <button className="vpn-close-btn" onClick={() => setShowVpnBanner(false)} aria-label="Close Ad">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* iframe — rotated or normal */}
      {isRotated ? (
        createPortal(
          <div className="player-container rotated">
            <button className="close-rotate-btn" onClick={() => setIsRotated(false)}>
              ✖ Exit Rotation
            </button>
            <iframe
              src={url}
              width="100%"
              height="100%"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; encrypted-media; fullscreen"
              referrerPolicy="origin"
              title="Video Player"
              onLoad={handleIframeLoad}
            />
          </div>,
          document.body
        )
      ) : (
        <div className="player-container">
          <iframe
            src={url}
            width="100%"
            height="100%"
            frameBorder="0"
            allowFullScreen
            allow="autoplay; encrypted-media; fullscreen"
            referrerPolicy="origin"
            title="Video Player"
            onLoad={handleIframeLoad}
          />
        </div>
      )}
    </div>
  );
};

export default VidkingPlayer;
