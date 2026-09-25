import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const discordProxyPlugin = () => ({
  name: 'discord-proxy',
  enforce: 'post' as const,
  transformIndexHtml(html: string) {
    return html.replace(/(src|href)="\//g, '$1="./').replace(/from "\//g, 'from "./');
  }
});

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), discordProxyPlugin()],
  envPrefix: 'VITE_',
  envDir: '../../',
  server: {
    host: '127.0.0.1',
    port: 5173,
    allowedHosts: ['.discordsays.com', '.trycloudflare.com', '.ngrok-free.dev', '.haven3d.com.br'],
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
