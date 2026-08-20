// src/components/MediaGrid.jsx
import React, { useMemo, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Play, Star, Film } from "lucide-react";
import "./MediaGrid.css";

// ---------------------------------------------------------------------------
// Speculation Rules API helper
// Chrome 109+ prerenders the top N detail routes in the background.
// When the user clicks a card, the page is ALREADY rendered -> 0ms navigation.
// Firefox/Safari safely ignore the <script type="speculationrules"> tag.
// ---------------------------------------------------------------------------
const PRERENDER_COUNT = 4; // prerender top 4 visible items
const SPECULATION_SCRIPT_ID = "sona-speculation-rules";

function injectSpeculationRules(urls) {
  if (typeof document === "undefined") return;
  // Feature-detect: only inject if browser supports Speculation Rules
  if (!("HTMLScriptElement" in window) || !document.createElement("script").type.includes?.("module")) {
    // Use a looser check - just try to inject and let browser ignore if unsupported
  }

  // Remove existing script so we always reflect the current visible set
  const existing = document.getElementById(SPECULATION_SCRIPT_ID);
  if (existing) existing.remove();

  if (!urls.length) return;

  const rules = {
    prerender: [
      {
        source: "list",
        urls,
        eagerness: "moderate", // triggers on hover/pointer-over, not immediately
      },
    ],
  };

  const script = document.createElement("script");
  script.id = SPECULATION_SCRIPT_ID;
  script.type = "speculationrules";
  script.textContent = JSON.stringify(rules);
  document.head.appendChild(script);
}

// ---------------------------------------------------------------------------
// MediaCard — memoised; only re-renders when its own item prop changes
// ---------------------------------------------------------------------------
const MediaCard = React.memo(({ item }) => {
  const isCustom = item.media_type === "youtube" || item.media_type === "nepali";
  const linkTarget =
    isCustom && item.media_type === "youtube"
      ? `/watch/youtube/${item.id}?title=${encodeURIComponent(item.title)}`
      : `/details/${item.media_type || "movie"}/${item.id}`;

  const posterUrl = item.poster_path
    ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
    : "https://via.placeholder.com/342x513?text=No+Poster";

  const displayTitle = item.title || item.name;
  const rawDateStr = item.release_date || item.first_air_date || item.date || "";
  const isUpcoming = rawDateStr && new Date(rawDateStr) > new Date();
  const dateDisplay = rawDateStr
    ? isUpcoming
      ? new Date(rawDateStr).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : rawDateStr.substring(0, 4)
    : "N/A";

  return (
    <Link to={linkTarget} className={`media-card ${isUpcoming ? "is-upcoming" : ""}`}>
      <div className="card-image-wrapper">
        <img
          src={posterUrl}
          alt={displayTitle}
          className="media-image"
          loading="lazy"
          decoding="async"
          width={342}
          height={513}
        />
        {isUpcoming && <div className="coming-soon-badge">COMING SOON</div>}
        <div className="card-overlay">
          <div className="card-play-btn">
            {isUpcoming ? (
              <Film fill="currentColor" size={24} />
            ) : (
              <Play fill="currentColor" size={24} />
            )}
          </div>
        </div>
      </div>
      <div className="card-content">
        <h3 className="card-title" title={displayTitle}>
          {displayTitle}
        </h3>
        <div className="card-meta">
          <span
            className="release-year"
            style={isUpcoming ? { color: "#ffc107", fontWeight: "bold" } : {}}
          >
            {dateDisplay}
          </span>
          {item.vote_average > 0 && !isUpcoming && (
            <span className="card-rating">
              <Star fill="currentColor" size={14} className="star-icon" />
              <span className="rating-value">{item.vote_average.toFixed(1)}</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
});
MediaCard.displayName = "MediaCard";

// ---------------------------------------------------------------------------
// MediaGrid — public component used across the app
// Injects Speculation Rules for the first PRERENDER_COUNT items so Chrome
// prerenders their Detail pages in the background at idle time.
// ---------------------------------------------------------------------------
const MediaGrid = ({ title, items, tag, layout = "grid" }) => {
  const memoItems = useMemo(() => items || [], [items]);
  const didInject = useRef(false);

  useEffect(() => {
    // Only inject once per items set; skip for slider (too many URLs)
    if (layout === "grid" && memoItems.length > 0) {
      const topUrls = memoItems
        .slice(0, PRERENDER_COUNT)
        .filter((item) => item.media_type !== "youtube" && item.media_type !== "nepali")
        .map((item) => `${window.location.origin}/details/${item.media_type || "movie"}/${item.id}`);

      injectSpeculationRules(topUrls);
      didInject.current = true;
    }

    // Cleanup speculation rules on unmount to avoid stale prerender hints
    return () => {
      if (didInject.current) {
        const el = document.getElementById(SPECULATION_SCRIPT_ID);
        if (el) el.remove();
        didInject.current = false;
      }
    };
  }, [memoItems, layout]);

  if (!memoItems.length) return null;

  return (
    <div className={`container media-grid-section fade-in layout-${layout}`}>
      <div className="section-header">
        <h2 className="section-title">
          {title}
          {tag && <span className={`category-tag tag-${tag}`}>{tag}</span>}
        </h2>
      </div>
      <div className={`media-grid ${layout === "slider" ? "is-slider" : "is-grid"}`}>
        {memoItems.map((item) => (
          <MediaCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};

export default MediaGrid;
