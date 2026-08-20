import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import useAppStore from "./store/useAppStore.js";

// Hydrate watch history from IndexedDB into Zustand on startup.
// This is async and non-blocking — the app renders immediately.
useAppStore.getState().hydrateHistory();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Register Service Worker (production only)
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        console.log("[SW] Registered. Scope:", reg.scope);
        setInterval(() => reg.update(), 60_000);
      })
      .catch((err) => console.warn("[SW] Registration failed:", err));
  });
}
