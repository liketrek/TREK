// FE-COLL-FILE-001 to FE-COLL-FILE-020
import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  collectionFileName,
  downloadCollectionFile,
  downloadCollectionGpx,
  readCollectionFile,
  COLLECTION_FILE_EXTENSION,
  COLLECTION_GPX_EXTENSION,
  type GpxReader,
} from './collectionFile'
import type { CollectionFile } from '@trek/shared'

const file = (over: Partial<CollectionFile> = {}): CollectionFile => ({
  format: 'trek.collection', version: 1, name: 'Lisbon', places: [{ name: 'Time Out Market' }], ...over,
} as CollectionFile)

/** A File whose text() the jsdom build does not provide on its own. */
function asFile(content: string, size = content.length, name = 'list.trekcollection.json'): File {
  return { size, name, text: () => Promise.resolve(content) } as unknown as File
}

/** A reader that must not be reached: a list file is never sent to the server. */
const noGpx: GpxReader = () => { throw new Error('a list file went to the GPX reader') }

/** A rejection the way axios delivers the server's refusal. */
const refused = (code: string) => Object.assign(new Error('Request failed'), { response: { status: 400, data: { error: 'no', code } } })

describe('collectionFileName', () => {
  it('FE-COLL-FILE-001: turns a list name into a short ascii file name', () => {
    expect(collectionFileName('Lisbon')).toBe('lisbon' + COLLECTION_FILE_EXTENSION)
    expect(collectionFileName('Wochenende in Rom!')).toBe('wochenende-in-rom' + COLLECTION_FILE_EXTENSION)
    expect(collectionFileName('東京')).toBe('collection' + COLLECTION_FILE_EXTENSION)
  })

  it('FE-COLL-FILE-002: caps a very long name rather than producing an unusable file name', () => {
    const name = collectionFileName('a'.repeat(200))
    expect(name).toBe('a'.repeat(40) + COLLECTION_FILE_EXTENSION)
  })

  it('FE-COLL-FILE-013: names a GPX the same way, with its own extension', () => {
    expect(collectionFileName('Wochenende in Rom!', COLLECTION_GPX_EXTENSION)).toBe('wochenende-in-rom.gpx')
  })
})

describe('downloads', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  /** Captures what would be downloaded, and under which name. */
  function captureDownload() {
    vi.useFakeTimers()
    const revoke = vi.fn()
    const created: Blob[] = []
    const names: string[] = []
    vi.stubGlobal('URL', {
      createObjectURL: (b: Blob) => { created.push(b); return 'blob:x' },
      revokeObjectURL: revoke,
    })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.href).toContain('blob:')
      names.push(this.download)
    })
    return { revoke, created, names, click }
  }

  it('FE-COLL-FILE-003: hands the browser a named JSON blob and releases it afterwards', () => {
    const { revoke, created, names, click } = captureDownload()

    downloadCollectionFile(file())

    expect(click).toHaveBeenCalledTimes(1)
    expect(names).toEqual(['lisbon' + COLLECTION_FILE_EXTENSION])
    expect(created[0].type).toBe('application/json')
    expect(revoke).not.toHaveBeenCalled()
    vi.runAllTimers()
    expect(revoke).toHaveBeenCalledWith('blob:x')
    expect(document.querySelector('a')).toBeNull()
  })

  it('FE-COLL-FILE-014: hands the browser a GPX under the list name', async () => {
    const { created, names } = captureDownload()

    downloadCollectionGpx('Lisbon', '<gpx/>')

    expect(names).toEqual(['lisbon.gpx'])
    expect(created[0].type).toBe('application/gpx+xml')
    expect(await created[0].text()).toBe('<gpx/>')
  })
})

describe('readCollectionFile', () => {
  it('FE-COLL-FILE-004: reads one of ours', async () => {
    const result = await readCollectionFile(asFile(JSON.stringify(file())), noGpx)
    expect(result.error).toBeNull()
    expect(result.file?.name).toBe('Lisbon')
    expect(result.gpx).toBeUndefined()
  })

  it('FE-COLL-FILE-005: refuses a file too large to be one, without reading it', async () => {
    const text = vi.fn()
    const huge = { size: 1024 * 1024 + 1, text } as unknown as File
    const result = await readCollectionFile(huge, noGpx)
    expect(result).toEqual({ file: null, error: 'too-large' })
    expect(text).not.toHaveBeenCalled()
  })

  it('FE-COLL-FILE-006: says a file is unreadable when it is not JSON', async () => {
    expect(await readCollectionFile(asFile('not json at all'), noGpx)).toEqual({ file: null, error: 'unreadable' })
  })

  it('FE-COLL-FILE-007: says a JSON that is not a list is not a list', async () => {
    for (const content of ['{}', '[]', 'null', '"a string"', JSON.stringify({ format: 'something.else', version: 1, name: 'x', places: [] })]) {
      expect(await readCollectionFile(asFile(content), noGpx), content).toEqual({ file: null, error: 'not-a-collection' })
    }
  })

  it('FE-COLL-FILE-008: refuses a list with no name, since the list would have none', async () => {
    const result = await readCollectionFile(asFile(JSON.stringify({ format: 'trek.collection', version: 1, name: '', places: [] })), noGpx)
    expect(result.error).toBe('not-a-collection')
  })

  it('FE-COLL-FILE-009: reads an empty list, which is a list somebody has not filled yet', async () => {
    const result = await readCollectionFile(asFile(JSON.stringify(file({ places: [] }))), noGpx)
    expect(result.error).toBeNull()
    expect(result.file?.places).toEqual([])
  })

  it('FE-COLL-FILE-010: keeps a place the envelope does not check, for the server to judge', async () => {
    // The envelope counts places; each one is validated where it is written.
    const result = await readCollectionFile(asFile(JSON.stringify(file({
      places: [{ name: 'Fine' }, { nonsense: true }] as never,
    }))), noGpx)
    expect(result.error).toBeNull()
    expect(result.file?.places).toHaveLength(2)
  })

  it('FE-COLL-FILE-011: refuses a file carrying more places than the contract allows', async () => {
    const tooMany = Array.from({ length: 1001 }, (_, i) => ({ name: `Place ${i}` }))
    const result = await readCollectionFile(asFile(JSON.stringify(file({ places: tooMany as never }))), noGpx)
    expect(result.error).toBe('not-a-collection')
  })

  it('FE-COLL-FILE-012: reads a file from a later version, since its additions are optional', async () => {
    const result = await readCollectionFile(asFile(JSON.stringify({ ...file(), version: 99, somethingNew: 'x' })), noGpx)
    expect(result.error).toBeNull()
    expect(result.file?.version).toBe(99)
  })
})

describe('readCollectionFile with a GPX (#2301)', () => {
  const gpx = '<?xml version="1.0"?><gpx version="1.1"><wpt lat="1" lon="2"><name>A</name></wpt></gpx>'

  it('FE-COLL-FILE-015: sends a GPX to the reader with its file name and keeps what did not become a place', async () => {
    const read = vi.fn<GpxReader>().mockResolvedValue({ file: file({ name: 'Favourites' }), skipped: 2, track_points: 40 })

    const result = await readCollectionFile(asFile(gpx, gpx.length, 'favourites.gpx'), read)

    expect(read).toHaveBeenCalledWith(gpx, 'favourites.gpx')
    expect(result).toEqual({ file: expect.objectContaining({ name: 'Favourites' }), error: null, gpx: { skipped: 2, trackPoints: 40 } })
  })

  it('FE-COLL-FILE-016: knows a GPX by what it is, not by what it is called', async () => {
    const read = vi.fn<GpxReader>().mockResolvedValue({ file: file(), skipped: 0, track_points: 0 })
    // A byte-order mark and a blank line before the declaration, under a .xml name.
    await readCollectionFile(asFile(String.fromCharCode(0xfeff) + '\n  ' + gpx, 100, 'export.xml'), read)
    expect(read).toHaveBeenCalledTimes(1)
  })

  it('FE-COLL-FILE-017: holds a GPX to the same size limit, before reading it', async () => {
    const read = vi.fn<GpxReader>()
    expect(await readCollectionFile(asFile(gpx, 1024 * 1024 + 1, 'big.gpx'), read)).toEqual({ file: null, error: 'too-large' })
    expect(read).not.toHaveBeenCalled()
  })

  it('FE-COLL-FILE-018: turns the reason the server refused a GPX into the dialog\'s own', async () => {
    for (const code of ['unreadable', 'not-gpx', 'too-many-places', 'too-large'] as const) {
      const read = vi.fn<GpxReader>().mockRejectedValue(refused(code))
      expect(await readCollectionFile(asFile(gpx), read), code).toEqual({ file: null, error: code, gpx: null })
    }
  })

  it('FE-COLL-FILE-019: passes on a failure that was not about the file', async () => {
    const offline = vi.fn<GpxReader>().mockRejectedValue(new Error('Network Error'))
    await expect(readCollectionFile(asFile(gpx), offline)).rejects.toThrow('Network Error')

    const unknownCode = vi.fn<GpxReader>().mockRejectedValue(refused('something-new'))
    await expect(readCollectionFile(asFile(gpx), unknownCode)).rejects.toThrow('Request failed')
  })

  it('FE-COLL-FILE-020: says a file is unreadable when its text cannot be had at all', async () => {
    const broken = { size: 10, name: 'x.gpx', text: () => Promise.reject(new Error('gone')) } as unknown as File
    expect(await readCollectionFile(broken, noGpx)).toEqual({ file: null, error: 'unreadable' })
  })
})
