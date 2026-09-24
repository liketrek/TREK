import { describe, it, expect, vi, beforeEach } from 'vitest'
import { keepOfflineShellFresh, manifestFiles } from './offlineShell'
import { TrekShell } from './trekShell'

vi.mock('./trekShell', () => ({ TrekShell: { refreshOfflineCopy: vi.fn() } }))

const manifest = {
  'index.html': { file: 'assets/index-a1b2c3d4.js', css: ['assets/index-e5f6a7b8.css'], assets: ['assets/poppins-11223344.woff2'] },
  'src/pages/AtlasPage.tsx': { file: 'assets/AtlasPage-99887766.js', css: ['assets/index-e5f6a7b8.css'] },
  _shared: { file: 'assets/shared-55443322.js', assets: 'not-a-list' },
  broken: null,
}

beforeEach(() => {
  vi.mocked(TrekShell.refreshOfflineCopy).mockReset().mockResolvedValue({ saved: true })
})

describe('manifestFiles', () => {
  it('collects every chunk, stylesheet and asset once', () => {
    expect(manifestFiles(manifest).sort()).toEqual([
      'assets/AtlasPage-99887766.js',
      'assets/index-a1b2c3d4.js',
      'assets/index-e5f6a7b8.css',
      'assets/poppins-11223344.woff2',
      'assets/shared-55443322.js',
    ])
  })

  it('returns nothing for something that is not a manifest', () => {
    expect(manifestFiles(null)).toEqual([])
    expect(manifestFiles('x')).toEqual([])
  })
})

describe('keepOfflineShellFresh', () => {
  it('refreshes the stored start page and fetches every file of the build', async () => {
    const fetched: string[] = []
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url === '/asset-manifest.json') {
        expect(init).toEqual({ cache: 'no-store' })
        return new Response(JSON.stringify(manifest))
      }
      fetched.push(url)
      if (url.includes('shared')) throw new Error('offline for a moment')
      return new Response('x')
    }) as unknown as typeof fetch

    await keepOfflineShellFresh(fetchImpl)

    expect(TrekShell.refreshOfflineCopy).toHaveBeenCalled()
    expect(fetched.sort()).toEqual([
      '/assets/AtlasPage-99887766.js',
      '/assets/index-a1b2c3d4.js',
      '/assets/index-e5f6a7b8.css',
      '/assets/poppins-11223344.woff2',
      '/assets/shared-55443322.js',
    ])
  })

  it('stops after the start page when the build has no manifest', async () => {
    const fetchImpl = vi.fn(async () => new Response('', { status: 404 })) as unknown as typeof fetch
    await keepOfflineShellFresh(fetchImpl)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })
})
