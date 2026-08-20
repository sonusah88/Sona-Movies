import React, { useEffect, useState, useTransition, useCallback } from "react";
import MediaGrid from "../components/MediaGrid";
import { fetchTrending, fetchPopularTV, fetchByGenre, fetchNewAndUpcoming } from "../lib/tmdb";
import { useParams } from "react-router-dom";
import "./CategoryPage.css";

const CategoryPage = ({ type }) => {
  const { id: genreId, name: genreName } = useParams();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // useTransition: the heavy setData() update is marked non-urgent.
  // React keeps the skeleton & any existing UI interactive while the new
  // catalog renders in the background — zero UI freeze on category switch.
  const [isPending, startTransition] = useTransition();

  const loadData = useCallback(async () => {
    let cancelled = false;
    setLoading(true);

    try {
      let results = [];

      if (type === "movies") {
        const [p1, p2, p3] = await Promise.all([
          fetchTrending(1), fetchTrending(2), fetchTrending(3),
        ]);
        results = [...p1, ...p2, ...p3]
          .filter((item) => item.media_type === "movie" || !item.media_type)
          .map((i) => ({ ...i, media_type: "movie" }));
      } else if (type === "tv") {
        const [p1, p2, p3] = await Promise.all([
          fetchPopularTV(1), fetchPopularTV(2), fetchPopularTV(3),
        ]);
        results = [...p1, ...p2, ...p3].map((i) => ({ ...i, media_type: "tv" }));
      } else if (type === "new-releases") {
        const [p1, p2, p3] = await Promise.all([
          fetchNewAndUpcoming(1), fetchNewAndUpcoming(2), fetchNewAndUpcoming(3),
        ]);
        results = [...p1, ...p2, ...p3];
      } else if (type === "genre") {
        const [p1, p2, p3] = await Promise.all([
          fetchByGenre(genreId, 1), fetchByGenre(genreId, 2), fetchByGenre(genreId, 3),
        ]);
        results = [...p1, ...p2, ...p3];
      }

      if (!cancelled) {
        // De-duplicate by id
        const unique = Array.from(
          new Map(results.map((item) => [item.id, item])).values()
        );

        // Wrap in startTransition — React can yield to user input during this render
        startTransition(() => {
          setData(unique);
          setLoading(false);
        });
      }
    } catch (error) {
      console.error("Failed to load category data:", error);
      if (!cancelled) setLoading(false);
    }

    return () => { cancelled = true; };
  }, [type, genreId]);

  useEffect(() => {
    const cleanup = loadData();
    return () => cleanup?.then?.((fn) => fn?.());
  }, [loadData]);

  const getTitle = () => {
    switch (type) {
      case "movies":       return "🎬 Discover Movies";
      case "tv":           return "📺 Popular TV Shows";
      case "hindi-dubbed": return "🎙️ South Indian (Hindi Dubbed)";
      case "new-releases": return "🔥 New & Upcoming Releases";
      case "genre":        return `🍿 ${decodeURIComponent(genreName || "Movies")}`;
      default:             return "Explore";
    }
  };

  const getTag = () => {
    switch (type) {
      case "movies":       return "movies";
      case "tv":           return "tv";
      case "hindi-dubbed": return "dubbed";
      case "new-releases": return "new";
      default:             return "";
    }
  };

  if (loading) {
    return (
      <div className="category-page" style={{ paddingTop: "100px" }}>
        <div className="container">
          <div className="skeleton" style={{ width: 300, height: 40, marginBottom: "2rem" }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "2rem" }}>
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ aspectRatio: "2/3", borderRadius: 12 }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    // Subtle opacity drop while isPending signals a background category switch in progress
    <div className="category-page fade-in" style={{ opacity: isPending ? 0.7 : 1, transition: "opacity 0.2s" }}>
      <div className="category-header" />
      <MediaGrid title={getTitle()} items={data} tag={getTag()} />
    </div>
  );
};

export default CategoryPage;
