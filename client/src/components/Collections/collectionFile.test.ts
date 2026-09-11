// FE-COLL-FILE-001 to FE-COLL-FILE-012
import { describe, it, expect, vi, afterEach } from 'vitest'
import { collectionFileName, downloadCollectionFile, readCollectionFile, COLLECTION_FILE_EXTENSION } from './collectionFile'
import type { CollectionFile } from '@trek/shared'

const file = (over: Partial<CollectionFile> = {}): CollectionFile => ({
  format: 'trek.collection', version: 1, name: 'Lisbon', places: [{ name: 'Time Out Market' }], ...over,
} as CollectionFile)

/** A File whose text() the jsdom build does not provide on its own. */
function asFile(content: string, size = content.length): File {
  return { size, text: () => Promise.resolve(content) } as unknown as File
}

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
})

describe('downloadCollectionFile', () => {
  afterEach(() => { vi.restoreAllMocks() })

  it('FE-COLL-FILE-003: hands the browser a named JSON blob and releases it afterwards', () => {
    vi.useFakeTimers()
    const revoke = vi.fn()
    const created: Blob[] = []
    vi.stubGlobal('URL', {
      createObjectURL: (b: Blob) => { created.push(b); return 'blob:x' },
      revokeObjectURL: revoke,
    })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe('lisbon' + COLLECTION_FILE_EXTENSION)
      expect(this.href).toContain('blob:')
    })

    downloadCollectionFile(file())

    expect(click).toHaveBeenCalledTimes(1)
    expect(created[0].type).toBe('application/json')
    expect(document.querySelector('a')).toBeNull()
    expect(revoke).not.toHaveBeenCalled()
    vi.runAllTimers()
    expect(revoke).toHaveBeenCalledWith('blob:x')
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })
})

describe('readCollectionFile', () => {
  it('FE-COLL-FILE-004: reads one of ours', async () => {
    const result = await readCollectionFile(asFile(JSON.stringify(file())))
    expect(result.error).toBeNull()
    expect(result.file?.name).toBe('Lisbon')
  })

  it('FE-COLL-FILE-005: refuses a file too large to be one, without reading it', async () => {
    const text = vi.fn()
    const huge = { size: 1024 * 1024 + 1, text } as unknown as File
    const result = await readCollectionFile(huge)
    expect(result).toEqual({ file: null, error: 'too-large' })
    expect(text).not.toHaveBeenCalled()
  })

  it('FE-COLL-FILE-006: says a file is unreadable when it is not JSON', async () => {
    expect(await readCollectionFile(asFile('not json at all'))).toEqual({ file: null, error: 'unreadable' })
  })

  it('FE-COLL-FILE-007: says a JSON that is not a list is not a list', async () => {
    for (const content of ['{}', '[]', 'null', '"a string"', JSON.stringify({ format: 'something.else', version: 1, name: 'x', places: [] })]) {
      expect(await readCollectionFile(asFile(content)), content).toEqual({ file: null, error: 'not-a-collection' })
    }
  })

  it('FE-COLL-FILE-008: refuses a list with no name, since the list would have none', async () => {
    const result = await readCollectionFile(asFile(JSON.stringify({ format: 'trek.collection', version: 1, name: '', places: [] })))
    expect(result.error).toBe('not-a-collection')
  })

  it('FE-COLL-FILE-009: reads an empty list, which is a list somebody has not filled yet', async () => {
    const result = await readCollectionFile(asFile(JSON.stringify(file({ places: [] }))))
    expect(result.error).toBeNull()
    expect(result.file?.places).toEqual([])
  })

  it('FE-COLL-FILE-010: keeps a place the envelope does not check, for the server to judge', async () => {
    // The envelope counts places; each one is validated where it is written.
    const result = await readCollectionFile(asFile(JSON.stringify(file({
      places: [{ name: 'Fine' }, { nonsense: true }] as never,
    }))))
    expect(result.error).toBeNull()
    expect(result.file?.places).toHaveLength(2)
  })

  it('FE-COLL-FILE-011: refuses a file carrying more places than the contract allows', async () => {
    const tooMany = Array.from({ length: 1001 }, (_, i) => ({ name: `Place ${i}` }))
    const result = await readCollectionFile(asFile(JSON.stringify(file({ places: tooMany as never }))))
    expect(result.error).toBe('not-a-collection')
  })

  it('FE-COLL-FILE-012: reads a file from a later version, since its additions are optional', async () => {
    const result = await readCollectionFile(asFile(JSON.stringify({ ...file(), version: 99, somethingNew: 'x' })))
    expect(result.error).toBeNull()
    expect(result.file?.version).toBe(99)
  })
})
