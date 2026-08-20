import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Register Service Worker for offline resilience & aggressive asset caching.
// Only runs in production (Vite sets import.meta.env.PROD=true on build).
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        console.log("[SW] Registered. Scope:", reg.scope);
        // Check for updates every 60 seconds while the app is open
        setInterval(() => reg.update(), 60_000);
      })
      .catch((err) => console.warn("[SW] Registration failed:", err));
  });
}
