import { TrekShell } from './trekShell'

/**
 * iOS only. WKWebView runs no service worker for a domain the app does not
 * list at build time, so the app stands in for it: the native side keeps a
 * copy of the start page (TrekShellPlugin.refreshOfflineCopy), and this pulls
 * every chunk of the current build into WebKit's HTTP cache. The server marks
 * them immutable, so a cold start without network can load the stored start
 * page under the server's origin and find all its scripts, including the lazy
 * routes nobody has opened yet.
 */

const MANIFEST_URL = '/asset-manifest.json'
const CONCURRENCY = 4

interface ManifestChunk {
  file?: string
  css?: string[]
  assets?: string[]
}

export function manifestFiles(manifest: unknown): string[] {
  if (typeof manifest !== 'object' || manifest === null) return []
  const files = new Set<string>()
  for (const chunk of Object.values(manifest as Record<string, ManifestChunk>)) {
    if (typeof chunk?.file === 'string') files.add(chunk.file)
    for (const list of [chunk?.css, chunk?.assets]) {
      if (Array.isArray(list)) list.forEach((f) => typeof f === 'string' && files.add(f))
    }
  }
  return [...files]
}

async function warmCache(files: string[], fetchFile: (path: string) => Promise<unknown>): Promise<void> {
  const queue = [...files]
  const worker = async (): Promise<void> => {
    for (let path = queue.shift(); path !== undefined; path = queue.shift()) {
      // One missing chunk must not stop the rest; the next launch tries again.
      await fetchFile(`/${path}`).catch(() => undefined)
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
}

export async function keepOfflineShellFresh(fetchImpl: typeof fetch = fetch): Promise<void> {
  await TrekShell.refreshOfflineCopy()
  const response = await fetchImpl(MANIFEST_URL, { cache: 'no-store' })
  if (!response.ok) return
  const files = manifestFiles(await response.json())
  await warmCache(files, (path) => fetchImpl(path).then((r) => r.blob()))
}
