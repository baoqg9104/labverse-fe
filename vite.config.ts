import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import * as path from "path";

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  build: {
    // Raise chunk warning limit to 1 MB to avoid noisy warnings during dev builds
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          // Prioritize very large libs into their own chunks
          if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
          if (id.includes('antd')) return 'vendor-antd';
          if (id.includes('lodash')) return 'vendor-lodash';
          if (id.includes('recharts')) return 'vendor-recharts';
          if (id.includes('highlight.js')) return 'vendor-highlight';
          if (id.includes('framer-motion')) return 'vendor-framer';
          if (id.includes('socket.io-client')) return 'vendor-socketio';
          if (id.includes('react-icons')) return 'vendor-reacticons';
          if (id.includes('swiper')) return 'vendor-swiper';
          // fallback vendor chunk for other dependencies
          return 'vendor-other';
        },
      },
    },
  },
  resolve: {
    alias: {
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
      // also alias react-dom/client if needed
      "react-dom/client": path.resolve(__dirname, "node_modules/react-dom/client"),
    },
  },
});
