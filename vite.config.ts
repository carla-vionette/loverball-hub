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
    chunkSizeWarningLimit: 500,
    cssCodeSplit: true,
    // Aggressive chunk splitting for slow connections
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React — cached once, never changes
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // UI framework — large but stable
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-tabs',
            '@radix-ui/react-select',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-switch',
            '@radix-ui/react-toggle',
            '@radix-ui/react-toggle-group',
            '@radix-ui/react-slider',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-separator',
            '@radix-ui/react-slot',
            '@radix-ui/react-label',
            '@radix-ui/react-progress',
          ],
          // Data/state — separate chunk
          'vendor-data': ['@tanstack/react-query', 'zustand', '@supabase/supabase-js'],
          // Animation — only loaded when needed
          'vendor-motion': ['framer-motion'],
          // Charts — only admin needs this
          'vendor-charts': ['recharts'],
          // Forms
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          // Date utilities
          'vendor-date': ['date-fns'],
        },
      },
    },
  },
}));
