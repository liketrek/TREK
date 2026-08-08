import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

/**
 * The only module in the client that pulls mapbox-gl in at runtime.
 *
 * It has to stay reachable through `import('./engines/mapbox')` and nothing else:
 * a static import from anywhere in the tree drags 1.8 MB into the parent chunk and
 * quietly undoes the split. `npm run check:gl-split` fails on that.
 */
export default mapboxgl
