import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { installOfflineProtocol } from '../../../native/offlineTiles'

/**
 * The only module in the client that pulls maplibre-gl in at runtime. Same rule as
 * its mapbox sibling: reachable through a dynamic import and no other way.
 *
 * The two engines share their API surface for everything TREK uses — Map, Marker,
 * Popup, LngLatBounds — which is why the components take the engine as a prop and
 * stay engine-agnostic. Where the two genuinely differ, the caller already guards
 * on the provider (projection, accessToken, aroundCenter).
 *
 * MapLibre 6 ships as ES modules only and has no default export any more, so the
 * namespace is what goes out as this module's default. It is a frozen module
 * namespace: nothing may assign to it, which is why the accessToken writes stay
 * behind their mapbox-only guard.
 */

// MapLibre 6 finds its worker next to its own module, which inside a bundle is a
// chunk in /assets/ with no worker beside it. Vite builds the worker into its own
// file and hands back the URL; set before any Map is constructed, the
// maplibre-gl-leaflet bridge included, since it only ever reaches the engine
// together with this module.
maplibregl.setWorkerUrl(workerUrl)

// No RTL text plugin here, unlike mapbox. MapLibre 6.9 shapes Arabic and orders
// bidirectional text itself; the old plugin would replace that implementation, and
// a v6 worker can only load the plugin's UMD build through eval.

// The iOS app has no service worker to serve pre-downloaded tiles; see native/offlineTiles.ts.
installOfflineProtocol(maplibregl)

export default maplibregl
