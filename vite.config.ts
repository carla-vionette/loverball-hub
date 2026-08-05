import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mcpPlugin(),
    mode === "development" && componentTagger(),
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
    rollupOptions: {
      output: {
        // Explicitly disable manualChunks. A previous split into
        // vendor-react / vendor-data / vendor-ui produced a circular ESM
        // import between vendor-data and vendor-react, causing a runtime
        // "Cannot read properties of undefined (reading 'createContext')"
        // that blanks the page on first load of routes like /e/:id.
        // Letting Rollup co-locate React with its consumers avoids it.
        manualChunks: undefined,
      },
    },
  },
}));
