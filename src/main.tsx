import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { installErrorReporting } from "./lib/errorReporter";

installErrorReporting();

// Service worker is registered automatically by vite-plugin-pwa's virtual module.
// In dev, we explicitly unregister any leftover SW from previous sessions to avoid
// stale caches blocking iteration.
if (import.meta.env.DEV && "serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  });
}

// Production self-heal: a stale precached app shell can reference a hashed entry/route
// chunk that has been purged from the server (404), which leaves #root empty (blank page).
// When a dynamic import fails, unregister all SWs once and reload to pull a fresh shell.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("vite:preloadError", () => {
    if (sessionStorage.getItem("sw-recovered")) return;
    sessionStorage.setItem("sw-recovered", "1");
    navigator.serviceWorker
      .getRegistrations()
      .then((rs) => Promise.all(rs.map((r) => r.unregister())))
      .finally(() => window.location.reload());
  });
}

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
