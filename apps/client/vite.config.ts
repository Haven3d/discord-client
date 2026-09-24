import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  envPrefix: 'VITE_',
  envDir: '../../',
  server: {
    port: 5173,
    allowedHosts: ['.discordsays.com', '.trycloudflare.com', '.devtunnels.ms'],
    hmr: {
      clientPort: 443,
    },
    proxy: {
      '/api': 'http://localhost:3001',
      '/ws': {
        target: 'http://localhost:3001',
        ws: true,
      },
      '/video-relay': {
        target: 'http://localhost:3001',
        ws: true,
      },
    },
  },
});
