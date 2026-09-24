/**
 * FE-CHATIMG-001..009: the pictures pinned to a chat message before it is sent.
 *
 * The reason this file exists: the hook used to create object URLs and enqueue
 * the preview state from inside a `setFiles` updater. React invokes an updater
 * an extra time in development, so one picked image produced two preview URLs
 * against one file, the composer strip drew two thumbnails for one attachment,
 * and removing one of them left a preview for a picture that would not be sent.
 * `renderHook` under StrictMode is what reproduces it.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { StrictMode } from 'react'
import { act, renderHook } from '@testing-library/react'
import { useChatImages, MAX_CHAT_IMAGES, type ChatImageDrop } from './useChatImages'

let nextUrl = 0
const revoked: string[] = []

beforeEach(() => {
  nextUrl = 0
  revoked.length = 0
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: vi.fn(() => `blob:mock/${++nextUrl}`),
    revokeObjectURL: vi.fn((url: string) => { revoked.push(url) }),
  })
})

const img = (name: string, size = 1024) =>
  new File([new Uint8Array(size)], name, { type: 'image/png' })

const strict = () => renderHook(() => useChatImages(), { wrapper: StrictMode })

describe('useChatImages', () => {
  it('FE-CHATIMG-001: one picked image is one file and one preview, in StrictMode', () => {
    const { result } = strict()

    act(() => { result.current.add([img('a.png')]) })

    expect(result.current.files).toHaveLength(1)
    expect(result.current.previews).toHaveLength(1)
    expect(result.current.previews[0]).toBe('blob:mock/1')
  })

  it('FE-CHATIMG-002: removing the only image empties both lists and revokes its URL', () => {
    const { result } = strict()
    act(() => { result.current.add([img('a.png')]) })

    act(() => { result.current.remove(0) })

    expect(result.current.files).toEqual([])
    expect(result.current.previews).toEqual([])
    expect(revoked).toEqual(['blob:mock/1'])
  })

  it('FE-CHATIMG-003: files and previews stay in step across several adds', () => {
    const { result } = strict()

    act(() => { result.current.add([img('a.png')]) })
    act(() => { result.current.add([img('b.png'), img('c.png')]) })

    expect(result.current.files.map(f => f.name)).toEqual(['a.png', 'b.png', 'c.png'])
    expect(result.current.previews).toEqual(['blob:mock/1', 'blob:mock/2', 'blob:mock/3'])
  })

  it('FE-CHATIMG-004: a rejected type is reported and nothing is pinned for it', () => {
    const { result } = strict()
    let ok = true

    act(() => { ok = result.current.add([new File(['x'], 'notes.pdf', { type: 'application/pdf' })]) })

    expect(ok).toBe(false)
    expect(result.current.files).toEqual([])
    expect(result.current.previews).toEqual([])
  })

  it('FE-CHATIMG-005: the cap holds and no URL is minted for what it turns away', () => {
    const { result } = strict()

    act(() => { result.current.add(Array.from({ length: MAX_CHAT_IMAGES + 2 }, (_, i) => img(`${i}.png`))) })

    expect(result.current.files).toHaveLength(MAX_CHAT_IMAGES)
    expect(result.current.previews).toHaveLength(MAX_CHAT_IMAGES)
  })

  it('FE-CHATIMG-006: clear revokes every URL it handed out', () => {
    const { result } = strict()
    act(() => { result.current.add([img('a.png'), img('b.png')]) })

    act(() => { result.current.clear() })

    expect(result.current.files).toEqual([])
    expect(revoked.sort()).toEqual(['blob:mock/1', 'blob:mock/2'])
  })

  // The strip shows what will be sent, so a picture the cap turned away is as gone as
  // one of the wrong kind. The sender hears about both, and hears which it was.
  it('FE-CHATIMG-007: a pick past the cap is reported as an overflow and is not a clean add', () => {
    const { result } = strict()
    const drops: ChatImageDrop[] = []
    let ok = true

    act(() => {
      ok = result.current.add(Array.from({ length: MAX_CHAT_IMAGES + 2 }, (_, i) => img(`${i}.png`)), d => drops.push(d))
    })

    expect(ok).toBe(false)
    expect(drops).toEqual([{ rejected: 0, overflow: 2 }])
    expect(result.current.files).toHaveLength(MAX_CHAT_IMAGES)
  })

  it('FE-CHATIMG-008: a wrong kind and an overflow in one pick are told apart', () => {
    const { result } = strict()
    act(() => { result.current.add([img('a.png'), img('b.png'), img('c.png')]) })
    const drops: ChatImageDrop[] = []

    act(() => {
      result.current.add([new File(['x'], 'notes.pdf', { type: 'application/pdf' }), img('d.png'), img('e.png')], d => drops.push(d))
    })

    expect(result.current.files.map(f => f.name)).toEqual(['a.png', 'b.png', 'c.png', 'd.png'])
    expect(drops).toEqual([{ rejected: 1, overflow: 1 }])
  })

  it('FE-CHATIMG-009: a pick that fits is a clean add and reports nothing', () => {
    const { result } = strict()
    const onDrop = vi.fn()
    let ok = false

    act(() => { ok = result.current.add([img('a.png')], onDrop) })

    expect(ok).toBe(true)
    expect(onDrop).not.toHaveBeenCalled()
  })
})
