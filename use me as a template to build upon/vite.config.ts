import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/cluster': {
        target: 'ws://localhost:8080',
        ws: true,
      },
    },
    watch: {
      usePolling: true,
    },
    hmr: {
      overlay: false, // Disable error overlay
    },
  },
  optimizeDeps: {
    exclude: ['openai', 'anthropic'],
  },
});