/**
 * The worker that served the page is read once, when the module loads, so every
 * test installs its fake service worker container first and imports afresh.
 */

class FakeWorker {
  constructor(public scriptURL = '/sw.js') {}
}

interface FakeRegistration {
  unregister: ReturnType<typeof vi.fn>
}

function installContainer(controller: FakeWorker | null, registration?: FakeRegistration) {
  const container = {
    controller,
    getRegistration: vi.fn(async () => registration),
  }
  Object.defineProperty(navigator, 'serviceWorker', { value: container, configurable: true })
  return container
}

function installCaches(names: string[]) {
  const deleted: string[] = []
  const store = {
    keys: vi.fn(async () => names),
    delete: vi.fn(async (name: string) => { deleted.push(name); return true }),
  }
  Object.defineProperty(globalThis, 'caches', { value: store, configurable: true })
  return deleted
}

const net = vi.hoisted(() => ({ isEffectivelyOffline: vi.fn(() => false) }))
vi.mock('../sync/networkMode', () => ({ isEffectivelyOffline: net.isEffectivelyOffline }))

async function load() {
  vi.resetModules()
  return import('./serviceWorkerShell')
}

afterEach(() => {
  Reflect.deleteProperty(navigator, 'serviceWorker')
  Reflect.deleteProperty(globalThis, 'caches')
  vi.unstubAllGlobals()
  net.isEffectivelyOffline.mockReturnValue(false)
})

const ORIGIN = 'http://localhost:3000'
const PAGE = '<!doctype html><html><head><script type="module" src="/assets/index-a1.js"></script></head></html>'

function file(body: string, type: string, status = 200): Response {
  return new Response(body, { status, headers: { 'content-type': type } })
}

/** One Workbox precache, as Cache Storage hands it to the page. */
class FakePrecache {
  readonly entries: Map<string, Response>
  constructor(files: Record<string, Response>) {
    this.entries = new Map(Object.entries(files).map(([path, res]) => [ORIGIN + path, res]))
  }
  keys = vi.fn(async () => [...this.entries.keys()].map(url => new Request(url)))
  match = vi.fn(async (key: Request) => this.entries.get(key.url)?.clone())
  // Cache Storage lists a replaced entry last, as if it were new.
  put = vi.fn(async (key: Request, res: Response) => { this.entries.delete(key.url); this.entries.set(key.url, res) })
  delete = vi.fn(async (key: Request) => this.entries.delete(key.url))
  typeOf(path: string): string | null | undefined {
    return this.entries.get(ORIGIN + path)?.headers.get('content-type')
  }
  async text(path: string): Promise<string | undefined> {
    return this.entries.get(ORIGIN + path)?.clone().text()
  }
}

function installPrecache(files: Record<string, Response>) {
  const precache = new FakePrecache(files)
  const others = new FakePrecache({ '/tiles/1/2/3.png': file('png', 'text/html') })
  const byName: Record<string, FakePrecache> = {
    [`workbox-precache-v2-${ORIGIN}/`]: precache,
    // Not the precache: whatever a tile server put there is not ours to judge.
    'map-tiles': others,
  }
  Object.defineProperty(globalThis, 'caches', {
    value: { keys: vi.fn(async () => Object.keys(byName)), open: vi.fn(async (name: string) => byName[name]) },
    configurable: true,
  })
  return { precache, others }
}

/** The server behind the precache: what it answers for each path it is asked for. */
function serve(files: Record<string, Response | Error>) {
  const fetch = vi.fn(async (url: string) => {
    const answer = files[new URL(url).pathname]
    if (answer instanceof Error) throw answer
    return answer ? answer.clone() : file('{"error":"Not found"}', 'application/json', 404)
  })
  vi.stubGlobal('fetch', fetch)
  return fetch
}

const CSS = 'body{font-family:Poppins}'

describe('serviceWorkerShell', () => {
  it('FE-UTIL-SWSHELL-001: notes the worker that served the page', async () => {
    const worker = new FakeWorker()
    installContainer(worker)
    const shell = await load()
    expect(shell.servingWorker()).toBe(worker)
    expect(shell.currentController()).toBe(worker)
  })

  it('FE-UTIL-SWSHELL-002: a reload hits the same worker until another one takes over', async () => {
    const container = installContainer(new FakeWorker())
    const shell = await load()
    expect(shell.reloadHitsSameWorker()).toBe(true)

    container.controller = new FakeWorker()
    expect(shell.reloadHitsSameWorker()).toBe(false)
  })

  it('FE-UTIL-SWSHELL-003: a page that came from the network has no worker to blame', async () => {
    const container = installContainer(null)
    const shell = await load()
    expect(shell.servingWorker()).toBeNull()
    expect(shell.reloadHitsSameWorker()).toBe(false)

    // A worker that claims the page later did not serve it.
    container.controller = new FakeWorker()
    expect(shell.reloadHitsSameWorker()).toBe(false)
  })

  it('FE-UTIL-SWSHELL-004: without service worker support there is no controller', async () => {
    const shell = await load()
    expect(shell.currentController()).toBeNull()
    expect(shell.reloadHitsSameWorker()).toBe(false)
  })

  it('FE-UTIL-SWSHELL-005: reading the controller where site data is blocked counts as none', async () => {
    Object.defineProperty(navigator, 'serviceWorker', {
      get() { throw new Error('SecurityError') },
      configurable: true,
    })
    const shell = await load()
    expect(shell.currentController()).toBeNull()
  })

  it('FE-UTIL-SWSHELL-006: dropping the shell deletes the precache and the worker, and nothing else', async () => {
    const registration = { unregister: vi.fn(async () => true) }
    installContainer(new FakeWorker(), registration)
    const deleted = installCaches([
      'workbox-precache-v2-https://trek.example/',
      'map-tiles',
      'gl-map-styles',
      'gl-map-offline',
      'user-uploads',
    ])
    const shell = await load()

    await shell.dropAppShell()

    // Offline map regions and cached uploads were downloaded on purpose.
    expect(deleted).toEqual(['workbox-precache-v2-https://trek.example/'])
    expect(registration.unregister).toHaveBeenCalledTimes(1)
  })

  it('FE-UTIL-SWSHELL-007: dropping the shell copes with no registration and no Cache Storage', async () => {
    installContainer(null, undefined)
    const shell = await load()
    await expect(shell.dropAppShell()).resolves.toBeUndefined()
  })
})

describe('repairPrecache (#2524)', () => {
  it('FE-UTIL-SWSHELL-010: puts a stylesheet kept as a page back, fetched past the precache', async () => {
    const { precache, others } = installPrecache({
      '/assets/index-N6AFa1mB.css': file(PAGE, 'text/html; charset=utf-8'),
      '/assets/index-a1.js': file('export {}', 'text/javascript'),
      '/index.html?__WB_REVISION__=131d93be': file(PAGE, 'text/html'),
      '/?__WB_REVISION__=1': file(PAGE, 'text/html'),
    })
    const fetch = serve({ '/assets/index-N6AFa1mB.css': file(CSS, 'text/css; charset=UTF-8') })
    const shell = await load()

    expect(await shell.repairPrecache()).toEqual(['/assets/index-N6AFa1mB.css'])

    expect(precache.typeOf('/assets/index-N6AFa1mB.css')).toBe('text/css; charset=UTF-8')
    expect(await precache.text('/assets/index-N6AFa1mB.css')).toBe(CSS)
    // Only the broken entry is fetched, under a URL the precache route does not know.
    expect(fetch).toHaveBeenCalledTimes(1)
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(new URL(url).pathname).toBe('/assets/index-N6AFa1mB.css')
    expect(new URL(url).searchParams.get('trek-repair')).toBeTruthy()
    expect(init).toMatchObject({ cache: 'no-store', credentials: 'same-origin', redirect: 'error' })
    // Kept without the one-off URL it came from, since a module is known by it.
    const kept = precache.put.mock.calls[0][1] as Response
    expect(kept.url).toBe('')
    // Pages are pages, and other caches are not the precache.
    expect(precache.typeOf('/index.html?__WB_REVISION__=131d93be')).toBe('text/html')
    expect(precache.typeOf('/?__WB_REVISION__=1')).toBe('text/html')
    expect(others.match).not.toHaveBeenCalled()
  })

  it('FE-UTIL-SWSHELL-011: a revisioned file is fetched without its revision and kept under it', async () => {
    const { precache } = installPrecache({
      '/fonts/Poppins-Bold.ttf?__WB_REVISION__=92934d92': file(PAGE, 'text/html'),
      '/icons/icon-192x192.png?__WB_REVISION__=5f1a': file(PAGE, 'text/html'),
      '/assets/vendor-core-Dbh_uXoX.js': file(PAGE, 'text/html'),
    })
    const fetch = serve({
      '/fonts/Poppins-Bold.ttf': file('ttf', 'font/ttf'),
      '/icons/icon-192x192.png': file('png', 'image/png'),
      '/assets/vendor-core-Dbh_uXoX.js': file('export {}', 'text/javascript; charset=UTF-8'),
    })
    const shell = await load()

    expect((await shell.repairPrecache()).sort()).toEqual([
      '/assets/vendor-core-Dbh_uXoX.js', '/fonts/Poppins-Bold.ttf', '/icons/icon-192x192.png',
    ])

    expect(precache.typeOf('/fonts/Poppins-Bold.ttf?__WB_REVISION__=92934d92')).toBe('font/ttf')
    expect(precache.typeOf('/icons/icon-192x192.png?__WB_REVISION__=5f1a')).toBe('image/png')
    expect(precache.typeOf('/assets/vendor-core-Dbh_uXoX.js')).toBe('text/javascript; charset=UTF-8')
    const fontUrl = new URL((fetch.mock.calls as unknown as [string][]).map(([u]) => u).find(u => u.includes('Poppins'))!)
    expect(fontUrl.searchParams.has('__WB_REVISION__')).toBe(false)
  })

  it('FE-UTIL-SWSHELL-012: an entry the server has no file for is removed, so the network and the next install get it', async () => {
    const { precache } = installPrecache({ '/assets/DashboardPage-v4ODOTOr.js': file(PAGE, 'text/html') })
    serve({})
    const shell = await load()

    expect(await shell.repairPrecache()).toEqual([])

    expect(precache.entries.size).toBe(0)
    expect(localStorage.getItem('trek:precache-checked')).toBeTruthy()
  })

  it.each([
    ['no network', new TypeError('Failed to fetch')],
    ['a redirect to an auth wall', new TypeError('Failed to fetch: redirect')],
    ['the login page of a proxy', file(PAGE, 'text/html; charset=utf-8')],
    ['an auth wall that refuses', file('Unauthorized', 'text/plain', 401)],
    ['a server error', file('{"error":"Internal"}', 'application/json', 500)],
  ])('FE-UTIL-SWSHELL-013: with %s the entry stays, and the next launch tries again', async (_label, answer) => {
    const { precache } = installPrecache({ '/assets/index-N6AFa1mB.css': file(PAGE, 'text/html') })
    const fetch = serve({ '/assets/index-N6AFa1mB.css': answer })
    const shell = await load()

    expect(await shell.repairPrecache()).toEqual([])
    expect(precache.typeOf('/assets/index-N6AFa1mB.css')).toBe('text/html')
    expect(precache.delete).not.toHaveBeenCalled()
    expect(localStorage.getItem('trek:precache-checked')).toBeNull()

    fetch.mockImplementation(async () => file(CSS, 'text/css'))
    expect(await shell.repairPrecache()).toEqual(['/assets/index-N6AFa1mB.css'])
  })

  it('FE-UTIL-SWSHELL-014: a sound precache is looked through once, until its entries change', async () => {
    const { precache } = installPrecache({
      '/assets/index-N6AFa1mB.css': file(CSS, 'text/css'),
      '/assets/index-a1.js': file('export {}', 'text/javascript'),
    })
    const fetch = serve({})
    const shell = await load()

    await shell.repairPrecache()
    expect(precache.match).toHaveBeenCalledTimes(2)

    await shell.repairPrecache()
    expect(precache.match).toHaveBeenCalledTimes(2)
    expect(fetch).not.toHaveBeenCalled()

    // A new install brought entries, and with them maybe a broken one.
    precache.entries.set(`${ORIGIN}/assets/index-b2.js`, file(PAGE, 'text/html'))
    fetch.mockImplementation(async () => file('export {}', 'text/javascript'))
    expect(await shell.repairPrecache()).toEqual(['/assets/index-b2.js'])
    expect(precache.match).toHaveBeenCalledTimes(5)

    // The repaired entry moved to the end of the list, which changes nothing.
    await shell.repairPrecache()
    expect(precache.match).toHaveBeenCalledTimes(5)
  })

  it('FE-UTIL-SWSHELL-015: without Cache Storage there is nothing to put right', async () => {
    const shell = await load()
    await expect(shell.repairPrecache()).resolves.toEqual([])
  })

  it('FE-UTIL-SWSHELL-016: with storage blocked it does nothing, rather than look through the precache on every launch', async () => {
    const { precache } = installPrecache({ '/assets/index-N6AFa1mB.css': file(PAGE, 'text/html') })
    const fetch = serve({ '/assets/index-N6AFa1mB.css': file(CSS, 'text/css') })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('blocked', 'SecurityError') })
    const shell = await load()

    expect(await shell.repairPrecache()).toEqual([])

    expect(precache.keys).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
    vi.restoreAllMocks()
  })

  it('FE-UTIL-SWSHELL-017: a failed fetch leaves the rest for the next launch, and keeps what it put right', async () => {
    const { precache } = installPrecache({
      '/assets/index-N6AFa1mB.css': file(PAGE, 'text/html'),
      '/assets/maplibre-B2k4QVOw.css': file(PAGE, 'text/html'),
      '/assets/Inter-latin.woff2': file(PAGE, 'text/html'),
    })
    const fetch = serve({
      '/assets/index-N6AFa1mB.css': file(CSS, 'text/css'),
      '/assets/maplibre-B2k4QVOw.css': new TypeError('Failed to fetch'),
      '/assets/Inter-latin.woff2': file('woff2', 'font/woff2'),
    })
    const shell = await load()

    expect(await shell.repairPrecache()).toEqual(['/assets/index-N6AFa1mB.css'])

    expect(fetch).toHaveBeenCalledTimes(2)
    expect(precache.typeOf('/assets/Inter-latin.woff2')).toBe('text/html')
    expect(localStorage.getItem('trek:precache-checked')).toBeNull()
  })

  it('FE-UTIL-SWSHELL-018: a server that does not answer is given up on after a while', async () => {
    vi.useFakeTimers()
    try {
      installPrecache({ '/assets/index-N6AFa1mB.css': file(PAGE, 'text/html') })
      vi.stubGlobal('fetch', vi.fn((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
        init.signal!.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
      })))
      const shell = await load()

      const done = shell.repairPrecache()
      await vi.advanceTimersByTimeAsync(15_000)

      await expect(done).resolves.toEqual([])
      expect(localStorage.getItem('trek:precache-checked')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('restyle and schedulePrecacheRepair (#2524)', () => {
  function stylesheet(href: string): HTMLLinkElement {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.crossOrigin = ''
    link.href = href
    document.head.appendChild(link)
    return link
  }

  const sheets = () => [...document.head.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')]

  afterEach(() => {
    document.head.querySelectorAll('link').forEach(link => link.remove())
  })

  it('FE-UTIL-SWSHELL-020: loads a stylesheet taken from a broken entry again, and drops the old link once it has', async () => {
    const broken = stylesheet('/assets/index-N6AFa1mB.css')
    const sound = stylesheet('/assets/leaflet-B1.css')
    const shell = await load()

    shell.restyle(['/assets/index-N6AFa1mB.css'])

    const fresh = sheets().find(l => l !== broken && l !== sound)!
    expect(new URL(fresh.href).pathname).toBe('/assets/index-N6AFa1mB.css')
    expect(fresh.crossOrigin).toBe('')
    expect(broken.isConnected).toBe(true)

    fresh.dispatchEvent(new Event('load'))
    expect(broken.isConnected).toBe(false)
    // In the old link's place, so the cascade stays as the build ordered it.
    expect(sheets()).toEqual([fresh, sound])
  })

  it('FE-UTIL-SWSHELL-021: a stylesheet that fails to load again leaves the page as it was', async () => {
    const broken = stylesheet('/assets/index-N6AFa1mB.css')
    const shell = await load()

    shell.restyle(['/assets/index-N6AFa1mB.css'])
    sheets().find(l => l !== broken)!.dispatchEvent(new Event('error'))

    expect(sheets()).toEqual([broken])
  })

  it('FE-UTIL-SWSHELL-027: a font put right loads the app\'s own stylesheets again, where its face is declared', async () => {
    const entry = stylesheet('/assets/index-N6AFa1mB.css')
    const lazy = stylesheet('/assets/maplibre-B2k4QVOw.css')
    const foreign = stylesheet('https://tiles.example.org/assets/style.css')
    const other = stylesheet('/custom/theme.css')
    const shell = await load()

    shell.restyle(['/assets/poppins-latin-400-normal-cpxAROuN.woff2'])

    const fresh = sheets().filter(l => ![entry, lazy, foreign, other].includes(l))
    expect(fresh.map(l => new URL(l.href).pathname)).toEqual(['/assets/index-N6AFa1mB.css', '/assets/maplibre-B2k4QVOw.css'])
    fresh.forEach(l => l.dispatchEvent(new Event('load')))
    expect(sheets()).toEqual([...fresh, foreign, other])
  })

  it('FE-UTIL-SWSHELL-028: an icon or a script put right leaves the stylesheets alone', async () => {
    const entry = stylesheet('/assets/index-N6AFa1mB.css')
    const shell = await load()

    shell.restyle(['/icons/icon-192x192.png', '/assets/dashboardModel-C_5ygTOX.js'])

    expect(sheets()).toEqual([entry])
  })

  it('FE-UTIL-SWSHELL-022: once the page has loaded and the browser is idle, the repair runs and restyles the page', async () => {
    const idle = vi.fn((run: () => void) => { run(); return 1 })
    vi.stubGlobal('requestIdleCallback', idle)
    const { precache } = installPrecache({ '/assets/index-N6AFa1mB.css': file(PAGE, 'text/html') })
    serve({ '/assets/index-N6AFa1mB.css': file(CSS, 'text/css') })
    const broken = stylesheet('/assets/index-N6AFa1mB.css')
    const shell = await load()

    shell.schedulePrecacheRepair()

    // jsdom's document has finished loading, so it only waits for idle time.
    expect(idle).toHaveBeenCalledTimes(1)
    await vi.waitFor(() => expect(sheets()).toHaveLength(2))
    expect(precache.typeOf('/assets/index-N6AFa1mB.css')).toBe('text/css')
    sheets()[1].dispatchEvent(new Event('load'))
    expect(broken.isConnected).toBe(false)
  })

  it('FE-UTIL-SWSHELL-023: offline, or in offline mode, the precache is left as it is', async () => {
    vi.stubGlobal('requestIdleCallback', (run: () => void) => { run(); return 1 })
    net.isEffectivelyOffline.mockReturnValue(true)
    const { precache } = installPrecache({ '/assets/index-N6AFa1mB.css': file(PAGE, 'text/html') })
    const fetch = serve({})
    const shell = await load()

    shell.schedulePrecacheRepair()
    await new Promise(r => setTimeout(r, 0))

    expect(precache.keys).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('FE-UTIL-SWSHELL-024: a page still loading waits for its load event first', async () => {
    const idle = vi.fn()
    vi.stubGlobal('requestIdleCallback', idle)
    const readyState = vi.spyOn(document, 'readyState', 'get').mockReturnValue('interactive')
    const shell = await load()

    shell.schedulePrecacheRepair()
    expect(idle).not.toHaveBeenCalled()

    readyState.mockRestore()
    window.dispatchEvent(new Event('load'))
    expect(idle).toHaveBeenCalledTimes(1)
  })

  it('FE-UTIL-SWSHELL-025: without idle callbacks it waits a moment instead, and a refusing Cache Storage is left for the next launch', async () => {
    vi.useFakeTimers()
    try {
      vi.stubGlobal('requestIdleCallback', undefined)
      const keys = vi.fn(async () => { throw new DOMException('blocked', 'SecurityError') })
      Object.defineProperty(globalThis, 'caches', { value: { keys }, configurable: true })
      const shell = await load()

      shell.schedulePrecacheRepair()
      expect(keys).not.toHaveBeenCalled()
      await vi.advanceTimersByTimeAsync(2_000)

      expect(keys).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('FE-UTIL-SWSHELL-026: nothing put right leaves the stylesheets alone', async () => {
    const link = stylesheet('/assets/index-N6AFa1mB.css')
    const shell = await load()

    shell.restyle([])

    expect(sheets()).toEqual([link])
  })
})
