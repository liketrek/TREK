/**
 * The only module that pulls in the Google Maps JS API.
 *
 * Unlike mapbox-gl and maplibre-gl this engine cannot be an npm dependency in a
 * chunk of its own: Google licenses the renderer only through their hosted
 * loader, and the SDK refuses to run if it is self-hosted. So the "engine" here
 * is a loader rather than a bundled module, and the key travels in the script
 * URL — a Maps JS key is public by design and is restricted by HTTP referrer in
 * the Google console, not kept secret.
 *
 * The loader is shared: the API throws if it is included twice on one page, so
 * every caller awaits the same promise and a second call with the same key is a
 * no-op. Changing the key needs a reload, which is why switching it in settings
 * asks for one.
 */

/** The slice of the Google Maps SDK TREK uses. Kept narrow on purpose. */
export interface GoogleMapsApi {
  Map: typeof google.maps.Map
  LatLngBounds: typeof google.maps.LatLngBounds
  InfoWindow: typeof google.maps.InfoWindow
  Polyline: typeof google.maps.Polyline
  marker: typeof google.maps.marker
  OverlayView: typeof google.maps.OverlayView
  LatLng: typeof google.maps.LatLng
}

let pending: Promise<GoogleMapsApi> | null = null
let loadedKey: string | null = null

const CALLBACK = '__trekGoogleMapsReady'
const SCRIPT_ID = 'trek-google-maps-sdk'

/** Exported for tests; resets the module's one-shot state. */
export function resetGoogleMapsLoader(): void {
  pending = null
  loadedKey = null
  document.getElementById(SCRIPT_ID)?.remove()
}

/**
 * Loads the Maps JS API and resolves the pieces TREK uses.
 *
 * @param apiKey the instance's Google Maps key
 * @param language basemap label language, so place names match the UI language
 *   rather than the browser locale (the same reason the GL providers pin it)
 */
export function loadGoogleMaps(apiKey: string, language?: string): Promise<GoogleMapsApi> {
  if (!apiKey) return Promise.reject(new Error('Google Maps API key is not set'))

  // A different key means a different billing account and possibly different
  // enabled APIs; the SDK cannot be re-initialised in place, so refuse rather
  // than silently keep using the first one.
  if (pending && loadedKey && loadedKey !== apiKey) {
    return Promise.reject(new Error('Google Maps is already loaded with a different key; reload the page'))
  }
  if (pending) return pending

  loadedKey = apiKey
  pending = new Promise<GoogleMapsApi>((resolve, reject) => {
    const params = new URLSearchParams({
      key: apiKey,
      callback: CALLBACK,
      // The marker library is where AdvancedMarkerElement lives; TREK renders
      // its own DOM pins rather than Google's default red teardrops.
      libraries: 'marker',
      v: 'weekly',
      // Without this the SDK logs a performance warning on every load.
      loading: 'async',
    })
    if (language) params.set('language', language)

    const globals = window as unknown as Record<string, unknown>
    globals[CALLBACK] = () => {
      delete globals[CALLBACK]
      resolve({
        Map: google.maps.Map,
        LatLngBounds: google.maps.LatLngBounds,
        InfoWindow: google.maps.InfoWindow,
        Polyline: google.maps.Polyline,
        marker: google.maps.marker,
        OverlayView: google.maps.OverlayView,
        LatLng: google.maps.LatLng,
      })
    }

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.async = true
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`
    // A bad key does not fail the request — Google serves the SDK and then calls
    // gm_authFailure. Both paths have to reject, or the map hangs on a spinner.
    script.onerror = () => {
      pending = null
      loadedKey = null
      delete globals[CALLBACK]
      reject(new Error('Failed to load the Google Maps SDK'))
    }
    globals.gm_authFailure = () => {
      pending = null
      loadedKey = null
      reject(new Error('Google Maps rejected the API key (check its HTTP referrer restrictions)'))
    }
    document.head.appendChild(script)
  })

  return pending
}
