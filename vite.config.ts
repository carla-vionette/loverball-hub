import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // PWA + service worker for offline resilience on slow / dropped connections.
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      strategies: "generateSW",
      // Use the existing /public/manifest.json instead of generating a new one.
      manifest: false,
      workbox: {
        // Precache the app shell. Skip large media — we cache those at runtime instead.
        globPatterns: ["**/*.{js,css,html,woff2,svg}"],
        globIgnores: ["**/feed-video-*", "**/*.{mp4,mov,avif,webp,png,jpg,jpeg}"],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MB cap per asset
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/, /^\/auth/, /^\/functions/],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          // Images: serve cache instantly, refresh in background.
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "images",
              expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Fonts: cache once, then serve from cache (fonts are immutable per filename).
          {
            urlPattern: ({ request }) => request.destination === "font",
            handler: "CacheFirst",
            options: {
              cacheName: "fonts",
              expiration: { maxEntries: 30, maxAgeSeconds: 365 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Supabase REST: network-first with a 5s timeout, then fall back to cache.
          // This is the magic for stadium WiFi / spotty 3G — if the network is slow,
          // we show cached data instead of spinning forever.
          {
            urlPattern: /^https:\/\/nfjavjfxgxrpvieinpdp\.supabase\.co\/rest\//,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-rest",
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 100, maxAgeSeconds: 5 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Supabase edge functions (incl. sports-data-proxy): network-first w/ 8s timeout.
          {
            urlPattern: /^https:\/\/nfjavjfxgxrpvieinpdp\.supabase\.co\/functions\//,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-functions",
              networkTimeoutSeconds: 8,
              expiration: { maxEntries: 50, maxAgeSeconds: 2 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      // Don't auto-register in dev to avoid stale caches blocking changes.
      devOptions: {
        enabled: false,
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "react-router-dom",
      "zustand",
      "@radix-ui/react-avatar",
      "@radix-ui/react-popover",
      "@radix-ui/react-checkbox",
      "@tanstack/react-query",
      "framer-motion",
    ],
  },
  optimizeDeps: {
    force: true,
    include: ["react", "react-dom", "react/jsx-runtime", "@tanstack/react-query"],
  },
  build: {
    target: 'es2020',
    minify: 'esbuild',
    chunkSizeWarningLimit: 800,
    cssCodeSplit: true,
    // NOTE: Custom manualChunks was removed because splitting React, react-query,
    // and @supabase into separate chunks caused a production-only runtime error:
    //   "Cannot read properties of undefined (reading 'createContext')"
    // The CJS↔ESM interop for react-query resolves React as `undefined` when it
    // lives in a sibling chunk loaded in parallel. Letting Vite/Rollup do default
    // chunking keeps React co-located with its consumers and ships a working bundle.
  },
}));
