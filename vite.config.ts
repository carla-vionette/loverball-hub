import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "react-router-dom", "zustand", "@radix-ui/react-avatar", "@radix-ui/react-popover", "framer-motion"],
  },
  optimizeDeps: {
    // Force re-bundling to clear stale dep cache causing dual React instances
    force: true,
  },
  build: {
    target: 'es2020',
    minify: 'esbuild',
    chunkSizeWarningLimit: 500,
  },
}));
