import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  envPrefix: 'VITE_',
  server: {
    port: 5173,
    allowedHosts: ['.discordsays.com'],
    hmr: {
      clientPort: 443,
    },
  },
});
