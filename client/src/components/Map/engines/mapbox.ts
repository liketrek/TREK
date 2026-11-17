import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

/**
 * The only module in the client that pulls mapbox-gl in at runtime.
 *
 * It has to stay reachable through `import('./engines/mapbox')` and nothing else:
 * a static import from anywhere in the tree drags 1.8 MB into the parent chunk and
 * quietly undoes the split. `npm run check:gl-split` fails on that.
 */
// No RTL text plugin to register: since 3.33 Mapbox GL shapes Arabic and orders
// bidirectional text itself, loading a small WebAssembly module from
// api.mapbox.com the first time such a label appears (#2235).

export default mapboxgl
