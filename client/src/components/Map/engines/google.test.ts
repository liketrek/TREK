import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadGoogleMaps, resetGoogleMapsLoader } from './google'

type Globals = Record<string, unknown>

/** Stands in for the SDK the real script would define. */
function installFakeSdk() {
  ;(window as unknown as Globals).google = {
    maps: {
      Map: class {},
      LatLngBounds: class {},
      InfoWindow: class {},
      Polyline: class {},
      marker: { AdvancedMarkerElement: class {} },
    },
  }
}

/** The loader appends a <script>; nothing fetches it in jsdom, so drive it by hand. */
function lastScript(): HTMLScriptElement {
  const scripts = document.head.querySelectorAll('script')
  return scripts[scripts.length - 1] as HTMLScriptElement
}

afterEach(() => {
  resetGoogleMapsLoader()
  document.head.querySelectorAll('script').forEach(s => s.remove())
  delete (window as unknown as Globals).google
  vi.restoreAllMocks()
})

describe('loadGoogleMaps', () => {
  it('rejects without a key rather than requesting an unusable SDK', async () => {
    await expect(loadGoogleMaps('')).rejects.toThrow(/API key is not set/)
    expect(document.head.querySelector('script')).toBeNull()
  })

  it('requests the marker library and defers to an async load', async () => {
    void loadGoogleMaps('key-1', 'ar')

    const url = new URL(lastScript().src)
    expect(url.origin + url.pathname).toBe('https://maps.googleapis.com/maps/api/js')
    expect(url.searchParams.get('key')).toBe('key-1')
    expect(url.searchParams.get('libraries')).toBe('marker')
    expect(url.searchParams.get('loading')).toBe('async')
    expect(url.searchParams.get('language')).toBe('ar')
  })

  it('resolves the SDK slice once Google runs the callback', async () => {
    const promise = loadGoogleMaps('key-1')
    installFakeSdk()
    const callback = new URL(lastScript().src).searchParams.get('callback') as string
    ;((window as unknown as Globals)[callback] as () => void)()

    await expect(promise).resolves.toMatchObject({ Map: expect.any(Function) })
  })

  // Including the API twice throws inside the SDK, so every caller has to get
  // the same in-flight promise.
  it('loads the SDK once no matter how many callers ask', () => {
    void loadGoogleMaps('key-1')
    void loadGoogleMaps('key-1')

    expect(document.head.querySelectorAll('script')).toHaveLength(1)
  })

  // A second key means a different billing account; the SDK cannot be
  // re-initialised in place, so this must complain rather than quietly bill the
  // first key for the second one's maps.
  it('refuses a different key instead of silently keeping the first', async () => {
    void loadGoogleMaps('key-1')

    await expect(loadGoogleMaps('key-2')).rejects.toThrow(/different key/)
  })

  it('rejects when the script fails to load', async () => {
    const promise = loadGoogleMaps('key-1')
    lastScript().onerror?.(new Event('error'))

    await expect(promise).rejects.toThrow(/Failed to load/)
  })

  // A bad key still serves the SDK: Google reports it through gm_authFailure,
  // so without this branch the map would spin forever instead of explaining.
  it('rejects when Google reports the key as unauthorised', async () => {
    const promise = loadGoogleMaps('key-1')
    ;((window as unknown as Globals).gm_authFailure as () => void)()

    await expect(promise).rejects.toThrow(/rejected the API key/)
  })
})
