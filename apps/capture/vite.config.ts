import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
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
  envPrefix: 'VITE_',
  envDir: '../../',
});
