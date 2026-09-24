import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const discordProxyPlugin = () => ({
  name: 'discord-proxy',
  enforce: 'post' as const,
  transformIndexHtml(html: string) {
    return html.replace(/(src|href)="\//g, '$1="./').replace(/from "\//g, 'from "./');
  }
});

export default defineConfig({
  base: './',
  plugins: [react(), discordProxyPlugin()],
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
