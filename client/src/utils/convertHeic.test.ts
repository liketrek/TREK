// FE-W4HEIC-001 to FE-W4HEIC-007
import { describe, it, expect, vi, beforeEach } from 'vitest'

const isHeic = vi.fn(async (_f: File) => true)
const heicTo = vi.fn(async (_opts: unknown) => new Blob(['jpeg'], { type: 'image/jpeg' }))

vi.mock('heic-to', () => ({
  isHeic: (f: File) => isHeic(f),
  heicTo: (opts: unknown) => heicTo(opts),
}))

import { normalizeImageFile, normalizeImageFiles } from './convertHeic'

beforeEach(() => {
  isHeic.mockClear()
  heicTo.mockClear()
  isHeic.mockResolvedValue(true)
})

describe('normalizeImageFile', () => {
  it('FE-W4HEIC-001: passes a plain jpeg straight through', async () => {
    const f = new File(['x'], 'photo.jpg', { type: 'image/jpeg' })
    await expect(normalizeImageFile(f)).resolves.toBe(f)
    expect(isHeic).not.toHaveBeenCalled()
  })

  it('FE-W4HEIC-002: converts a .heic file to jpeg and renames it', async () => {
    const f = new File(['x'], 'IMG_0042.HEIC', { type: '' })
    const out = await normalizeImageFile(f)

    expect(out).not.toBe(f)
    expect(out.name).toBe('IMG_0042.jpg')
    expect(out.type).toBe('image/jpeg')
    expect(heicTo).toHaveBeenCalledWith({ blob: f, type: 'image/jpeg', quality: 0.92 })
  })

  it('FE-W4HEIC-003: converts a .heif file too', async () => {
    const out = await normalizeImageFile(new File(['x'], 'scan.heif'))
    expect(out.name).toBe('scan.jpg')
  })

  it('FE-W4HEIC-004: detects heic by mime type when the name has no extension', async () => {
    const f = new File(['x'], 'clipboard', { type: 'image/heic' })
    const out = await normalizeImageFile(f)

    expect(heicTo).toHaveBeenCalled()
    // No .heic/.heif suffix to strip, so the name stays as-is.
    expect(out.name).toBe('clipboard')
    expect(out.type).toBe('image/jpeg')
  })

  it('FE-W4HEIC-005: returns the original when the magic bytes say it is not heic', async () => {
    isHeic.mockResolvedValue(false)
    const f = new File(['x'], 'mislabelled.heic')

    await expect(normalizeImageFile(f)).resolves.toBe(f)
    expect(heicTo).not.toHaveBeenCalled()
  })
})

describe('normalizeImageFiles', () => {
  it('FE-W4HEIC-006: normalizes a mixed list and keeps the order', async () => {
    const jpg = new File(['x'], 'a.jpg', { type: 'image/jpeg' })
    const heic = new File(['x'], 'b.heic')

    const out = await normalizeImageFiles([jpg, heic])

    expect(out).toHaveLength(2)
    expect(out[0]).toBe(jpg)
    expect(out[1].name).toBe('b.jpg')
  })

  it('FE-W4HEIC-007: accepts a FileList-like object', async () => {
    const jpg = new File(['x'], 'a.jpg', { type: 'image/jpeg' })
    const fakeList = { 0: jpg, length: 1 } as unknown as FileList

    await expect(normalizeImageFiles(fakeList)).resolves.toEqual([jpg])
  })
})
