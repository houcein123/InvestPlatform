import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    // En développement, le frontend appelle des chemins relatifs : le proxy
    // évite toute URL de backend en dur dans le code et supprime les problèmes
    // de CORS. En production, VITE_API_URL prend le relais.
    //
    // Deux cibles distinctes, et la distinction compte :
    //   /api     → backend Spring Boot (comptes, catalogue, paiement, rapports)
    //   /reports → moteur Node, qui sert les PDF produits en statique
    proxy: {
      '/api': 'http://localhost:8080',
      '/reports': 'http://localhost:3001',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Recharts et Framer Motion pèsent lourd : les isoler évite qu'une
        // retouche de page invalide tout le cache du navigateur.
        manualChunks: {
          'vendor-charts': ['recharts'],
          'vendor-motion': ['framer-motion'],
          'vendor-paypal': ['@paypal/react-paypal-js'],
        },
      },
    },
  },
});
