import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt'],
      manifest: {
        name: 'KIVU — Unir l\'Afrique par la langue',
        short_name: 'KIVU',
        description: 'Plateforme mondiale de traduction et d\'apprentissage linguistique',
        theme_color: '#174E9C',
        background_color: '#FAF8F2',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        runtimeCaching: [{
          urlPattern: /^https:\/\/api\.kivu\.africa\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'kivu-api-cache',
            expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 }
          }
        }]
      }
    })
  ],
  server: { port: 5173, host: true },
  build: {
    chunkSizeWarningLimit: 600 // KIVU is a rich SPA — single chunk is acceptable for demo
  }
});
