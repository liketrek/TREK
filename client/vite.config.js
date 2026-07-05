import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2,ttf}'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [
          /^\/api/,
          /^\/uploads/,
          /^\/mcp/,
          /^\/oauth\//,
          /^\/.well-known\//,
          /^\/plugin-frame\//,
        ],
        runtimeCaching: [
          {
            // Carto map tiles (default provider)
            // maxEntries MUST stay >= MAX_TILES in src/sync/tilePrefetcher.ts
            // (both are 12288) so prefetched tiles aren't evicted on arrival.
            urlPattern: /^https:\/\/[a-d]\.basemaps\.cartocdn\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles',
              expiration: { maxEntries: 12288, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // OpenStreetMap tiles (fallback / alternative)
            // Shares the 'map-tiles' cache; keep maxEntries equal to the Carto
            // rule above and MAX_TILES in src/sync/tilePrefetcher.ts (12288).
            urlPattern: /^https:\/\/[a-c]\.tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles',
              expiration: { maxEntries: 12288, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Leaflet CSS/JS from unpkg CDN
            urlPattern: /^https:\/\/unpkg\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdn-libs',
              expiration: { maxEntries: 30, maxAgeSeconds: 365 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Mapbox GL style, glyphs, sprites and vector tiles. Best-effort
            // offline only: opportunistically caches what the user has already
            // viewed online. Full pre-download offline maps require the Leaflet
            // renderer (raster prefetch in tilePrefetcher.ts) — the GL vector
            // pipeline is not prefetched. StaleWhileRevalidate keeps the basemap
            // fresh online while still serving from cache when offline. Mapbox
            // sends CORS, so responses are non-opaque (real 200s, no quota pad).
            urlPattern: /^https:\/\/(api\.mapbox\.com|[a-d]\.tiles\.mapbox\.com)\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'mapbox-tiles',
              expiration: { maxEntries: 3000, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            // OpenFreeMap MapLibre style, glyphs, sprites and vector tiles.
            // Same best-effort offline model as Mapbox GL: viewed resources are
            // reused from cache, but the vector tile pipeline is not prefetched.
            urlPattern: /^https:\/\/tiles\.openfreemap\.org\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'openfreemap-tiles',
              expiration: { maxEntries: 3000, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            // API calls — network only. We deliberately do NOT cache API
            // responses in the Service Worker: Workbox keys entries by URL and
            // cannot vary on the httpOnly session cookie, so a shared device
            // could serve one user's cached data to the next (cross-user leak).
            // Offline reads are served from the per-user IndexedDB cache via the
            // repo layer instead. The urlPattern is kept so these requests still
            // bypass the SPA navigation fallback.
            urlPattern: /\/api\/(?!auth|admin|backup|settings|health).*/i,
            handler: 'NetworkOnly',
          },
          {
            // Uploaded files (photos, covers — public assets only)
            urlPattern: /\/uploads\/(?:covers|avatars)\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'user-uploads',
              expiration: { maxEntries: 300, maxAgeSeconds: 7 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
      manifest: {
        name: 'TREK \u2014 Travel Planner',
        short_name: 'TREK',
        description: 'Travel Resource & Exploration Kit',
        theme_color: '#111827',
        background_color: '#0f172a',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        categories: ['travel', 'navigation'],
        icons: [
          { src: 'icons/apple-touch-icon-180x180.png', sizes: '180x180', type: 'image/png' },
          { src: 'icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
    }),
  ],
  build: {
    sourcemap: false,
    modulePreload: { polyfill: true },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/plugin-frame': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/ws': {
        target: 'http://localhost:3001',
        ws: true,
      },
      '/mcp': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      // OAuth 2.1 endpoints handled by backend (SDK authorize handler + token/revoke)
      // /oauth/authorize goes to backend so the SDK can redirect to /oauth/consent
      // /oauth/consent is served by Vite as a SPA route (no proxy entry needed)
      '/oauth/authorize': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/oauth/token': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/oauth/register': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/oauth/revoke': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/.well-known': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
