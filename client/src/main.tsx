import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App'
// Self-hosted Poppins (bundled, same-origin) so the app font can't be blocked by
// ad/tracker blockers the way the Google Fonts CDN can.
import '@fontsource/poppins/300.css'
import '@fontsource/poppins/400.css'
import '@fontsource/poppins/500.css'
import '@fontsource/poppins/600.css'
import '@fontsource/poppins/700.css'
// MuseoModerno for the login wordmark — same reasoning, it used to come from the
// Google Fonts CDN via a render-blocking <link> in index.html.
import '@fontsource/museomoderno/400.css'
import '@fontsource/museomoderno/700.css'
import '@fontsource/museomoderno/800.css'
// Geist Sans (self-hosted too) — used only for secondary "subtext" via --font-subtext.
import '@fontsource/geist-sans/400.css'
import '@fontsource/geist-sans/500.css'
import '@fontsource/geist-sans/600.css'
// Leaflet CSS bundled from node_modules instead of unpkg: the service worker
// cached the CDN stylesheet as an opaque response, which the browser then
// rejected, breaking the Atlas/trip maps (#1497). Bundling keeps it same-origin
// and precached with the app shell. Must stay above index.css, which overrides
// several .leaflet-* styles.
import 'leaflet/dist/leaflet.css'
import './index.css'
// Native HTML5 drag-and-drop never fires on touch input, so the planner's place /
// day reordering was dead on Android and iOS. The `drag-drop-touch` polyfill synthesises
// the standard drag events from touch gestures over draggable elements (#1265). It is
// loaded only on non-mobile viewports: reorder DnD is disabled on mobile (#1432), where
// the polyfill's synthetic click/dblclick otherwise turned quick one-finger map pans into
// double-tap zooms (#1440). See utils/touchDragPolyfill.ts.
import { maybeInstallTouchDragPolyfill } from './utils/touchDragPolyfill'
import { startConnectivityProbe } from './sync/connectivity'
import { requestPersistentStorage } from './sync/persistentStorage'
import ErrorBoundary, { RootErrorFallback } from './components/shared/ErrorBoundary'
import { installGlobalErrorHandlers } from './utils/globalErrorHandlers'

maybeInstallTouchDragPolyfill()
startConnectivityProbe()
// Keep offline data (map tiles, file blobs, IndexedDB) exempt from eviction.
requestPersistentStorage()
// Event handlers and async code never reach a boundary; this is where they land.
installGlobalErrorHandlers()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* Outermost net: catches App itself and TranslationProvider, which every
          boundary further in sits below. Its fallback is untranslated on purpose
          — if the provider is the thing that broke, t() would echo raw keys. */}
      <ErrorBoundary boundaryId="root" level="root" fallback={s => <RootErrorFallback {...s} />}>
        <App />
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>,
)
