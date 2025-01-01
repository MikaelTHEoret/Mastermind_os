import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    envPrefix: 'VITE_',
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
  };
});
