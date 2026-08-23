// FE-W4UPQ-001 to FE-W4UPQ-012
import { describe, it, expect, vi } from 'vitest'
import { uploadFilesResilient, type UploadOpts, type UploadProgress } from './uploadQueue'

function file(name: string, size = 100): File {
  const f = new File(['x'], name, { type: 'text/plain' })
  Object.defineProperty(f, 'size', { value: size })
  return f
}

describe('uploadFilesResilient', () => {
  it('FE-W4UPQ-001: returns every uploaded item and no failures', async () => {
    const files = [file('a.txt'), file('b.txt')]
    const uploadOne = vi.fn(async (f: File) => [{ name: f.name }])

    const res = await uploadFilesResilient(files, uploadOne)

    expect(res.failed).toEqual([])
    expect(res.succeeded).toEqual([{ name: 'a.txt' }, { name: 'b.txt' }])
    expect(uploadOne).toHaveBeenCalledTimes(2)
  })

  it('FE-W4UPQ-002: passes a fresh idempotency key per file', async () => {
    const keys: string[] = []
    const uploadOne = async (_f: File, opts: UploadOpts) => { keys.push(opts.idempotencyKey); return [] }

    await uploadFilesResilient([file('a.txt'), file('b.txt')], uploadOne)

    expect(keys).toHaveLength(2)
    expect(keys[0]).not.toBe(keys[1])
    expect(keys[0]).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('FE-W4UPQ-003: streams onUploaded per file as it lands', async () => {
    const onUploaded = vi.fn()
    await uploadFilesResilient(
      [file('a.txt'), file('b.txt')],
      async (f: File) => [f.name],
      { concurrency: 1, onUploaded },
    )

    expect(onUploaded).toHaveBeenNthCalledWith(1, ['a.txt'])
    expect(onUploaded).toHaveBeenNthCalledWith(2, ['b.txt'])
  })

  it('FE-W4UPQ-004: reports byte progress from onUploadProgress and finishes at 100%', async () => {
    const seen: UploadProgress[] = []
    const uploadOne = async (f: File, opts: UploadOpts) => {
      opts.onUploadProgress({ loaded: f.size / 2, total: f.size } as never)
      return [f.name]
    }

    await uploadFilesResilient([file('a.txt', 200)], uploadOne, { onProgress: p => { seen.push(p) } })

    expect(seen[0]).toEqual({ done: 0, total: 1, failed: 0, percent: 50 })
    expect(seen[seen.length - 1]).toEqual({ done: 1, total: 1, failed: 0, percent: 100 })
  })

  it('FE-W4UPQ-005: reports 0% when the files carry no bytes', async () => {
    const seen: UploadProgress[] = []
    await uploadFilesResilient([file('a.txt', 0)], async () => [], { onProgress: p => { seen.push(p) } })

    expect(seen[seen.length - 1]).toEqual({ done: 1, total: 1, failed: 0, percent: 0 })
  })

  it('FE-W4UPQ-006: retries a transient failure and keeps the file', async () => {
    let calls = 0
    const uploadOne = vi.fn(async (f: File) => {
      calls++
      if (calls === 1) throw new Error('network down')
      return [f.name]
    })

    const res = await uploadFilesResilient([file('a.txt')], uploadOne, { retries: 1 })

    expect(calls).toBe(2)
    expect(res.succeeded).toEqual(['a.txt'])
    expect(res.failed).toEqual([])
  })

  it('FE-W4UPQ-007: does not retry a 4xx and reports the file as failed', async () => {
    const uploadOne = vi.fn(async () => { throw { response: { status: 413 } } })
    const f = file('big.txt')

    const res = await uploadFilesResilient([f], uploadOne, { retries: 2 })

    expect(uploadOne).toHaveBeenCalledTimes(1)
    expect(res.succeeded).toEqual([])
    expect(res.failed).toEqual([f])
  })

  it('FE-W4UPQ-007b: retries a 429 rather than dropping the file', async () => {
    let calls = 0
    const uploadOne = vi.fn(async (f: File) => {
      calls++
      // A proxy in front of a self-hosted instance rate-limits the batch.
      if (calls === 1) throw { response: { status: 429 } }
      return [f.name]
    })

    const res = await uploadFilesResilient([file('a.txt')], uploadOne, { retries: 1 })

    expect(calls).toBe(2)
    expect(res.succeeded).toEqual(['a.txt'])
    expect(res.failed).toEqual([])
  })

  it('FE-W4UPQ-008: retries a 5xx up to the limit then gives up', async () => {
    const uploadOne = vi.fn(async () => { throw { response: { status: 502 } } })
    const f = file('a.txt')

    const res = await uploadFilesResilient([f], uploadOne, { retries: 1 })

    expect(uploadOne).toHaveBeenCalledTimes(2)
    expect(res.failed).toEqual([f])
  })

  it('FE-W4UPQ-009: a failed file counts into the progress failure tally', async () => {
    const seen: UploadProgress[] = []
    const ok = file('ok.txt')
    const bad = file('bad.txt')
    const uploadOne = async (f: File) => {
      if (f.name === 'bad.txt') throw { response: { status: 400 } }
      return [f.name]
    }

    const res = await uploadFilesResilient([ok, bad], uploadOne, { concurrency: 1, onProgress: p => { seen.push(p) } })

    expect(res.succeeded).toEqual(['ok.txt'])
    expect(res.failed).toEqual([bad])
    expect(seen[seen.length - 1]).toMatchObject({ done: 1, failed: 1, total: 2 })
  })

  it('FE-W4UPQ-010: never spawns more workers than files', async () => {
    let inFlight = 0
    let peak = 0
    const uploadOne = async (f: File) => {
      inFlight++
      peak = Math.max(peak, inFlight)
      await Promise.resolve()
      inFlight--
      return [f.name]
    }

    const res = await uploadFilesResilient([file('a.txt'), file('b.txt')], uploadOne, { concurrency: 10 })

    expect(peak).toBeLessThanOrEqual(2)
    expect(res.succeeded).toHaveLength(2)
  })

  it('FE-W4UPQ-011: an empty file list resolves without calling the uploader', async () => {
    const uploadOne = vi.fn(async () => [])
    const res = await uploadFilesResilient([], uploadOne)

    expect(uploadOne).not.toHaveBeenCalled()
    expect(res).toEqual({ succeeded: [], failed: [] })
  })

  it('FE-W4UPQ-012: the bytes of an aborted attempt do not survive into the retry', async () => {
    const seen: UploadProgress[] = []
    let attempt = 0
    const uploadOne = async (f: File, opts: UploadOpts) => {
      attempt++
      opts.onUploadProgress({ loaded: f.size / 2, total: f.size } as never)
      if (attempt === 1) throw new Error('connection reset')
      return [f.name]
    }

    await uploadFilesResilient([file('a.txt', 200)], uploadOne, { retries: 1, onProgress: p => { seen.push(p) } })

    // 50% from the aborted attempt, then back to 0 before the retry reports its own.
    expect(seen.map(p => p.percent)).toEqual([50, 0, 50, 100])
  })
})
