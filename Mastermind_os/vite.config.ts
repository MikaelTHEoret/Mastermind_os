import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig(() => {
  return {
    envPrefix: 'VITE_',
    plugins: [
      react(),
      nodePolyfills({
        protocolImports: true,
      }),
    ],
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
  };
});
