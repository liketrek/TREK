import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';

// `npm run build:analyze` writes dist/stats.html — a treemap of what actually ended
// up in each chunk. The plain build only reports chunk sizes, which tells you a chunk
// is too big but not which dependency made it so.
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'analyze' &&
      visualizer({ filename: 'dist/stats.html', gzipSize: true, brotliSize: true }),
    VitePWA({
      registerType: 'autoUpdate',
      // Serve the generated manifest (+ dev SW) in development too, so the installed
      // PWA can be tested against the dev server. Without this, dev ships no
      // <link rel="manifest">, so iOS falls back to legacy standalone
      // (apple-mobile-web-app-capable only) and pops the Safari chrome on every
      // in-app navigation away from the start URL. Prod already serves the manifest.
      devOptions: {
        enabled: true,
        type: 'module',
        suppressWarnings: true,
      },
      workbox: {
        // Anything above this is dropped from the precache manifest. The build does
        // not fail over it, it only prints "won't be precached", so the ceiling has
        // to sit close to the real bundle or an accidental heavyweight goes
        // offline-broken unnoticed. Largest precached entry after route splitting is
        // the heic-to chunk at 3.0 MB; the entry chunk is down to 1.2 MB.
        maximumFileSizeToCacheInBytes: 3.5 * 1024 * 1024,
        // Every route chunk is precached alongside the shell, deliberately: for an
        // offline-first travel planner a route the user never opened before losing
        // signal still has to work. The trade is that route splitting buys first
        // paint and not install size — 107 entries / 17,795 KiB before the split,
        // 178 / 17,826 KiB after.
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2,ttf}'],
        // build:analyze drops a treemap next to the app; it must never end up in a
        // precache manifest if someone ships that build by accident.
        globIgnores: ['**/stats.html'],
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
            // Both spellings have to stay in the pattern: templates are rewritten
            // onto the apex host (src/utils/tileUrl.ts), but caches filled before
            // that still hold a/b/c URLs and must keep serving offline.
            urlPattern: /^https:\/\/(?:[a-c]\.)?tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles',
              expiration: { maxEntries: 12288, maxAgeSeconds: 30 * 24 * 60 * 60 },
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
  ].filter(Boolean),
  build: {
    // Pin the output level instead of inheriting whatever the current Vite default
    // is, so a toolchain bump can't silently change which browsers still work.
    target: 'es2022',
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
}));
