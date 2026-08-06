import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // En développement, le frontend appelle des chemins relatifs (/api, /reports) :
    // le proxy évite toute URL de backend en dur dans le code et supprime les
    // problèmes de CORS. En production, VITE_API_URL prend le relais.
    proxy: {
      '/api': 'http://localhost:3001',
      '/reports': 'http://localhost:3001',
    },
  },
});
