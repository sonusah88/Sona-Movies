import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Increase warning limit — hls.js is large but gets cached permanently
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React core — changes almost never, should be cached permanently
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router') ||
              id.includes('node_modules/scheduler/')) {
            return 'react-vendor';
          }
          // Video player — large but cached independently; only busts on hls/react-player upgrades
          if (id.includes('node_modules/hls.js') ||
              id.includes('node_modules/react-player')) {
            return 'player-vendor';
          }
          // UI icons — stable, cache independently
          if (id.includes('node_modules/lucide-react')) {
            return 'ui-vendor';
          }
          // Zustand + TanStack Virtual — small, group together
          if (id.includes('node_modules/zustand') ||
              id.includes('node_modules/@tanstack')) {
            return 'state-vendor';
          }
          // All other node_modules go into a general vendor chunk
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
});

