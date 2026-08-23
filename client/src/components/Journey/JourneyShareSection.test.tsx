// FE-JRN-SHARE-001 to FE-JRN-SHARE-011

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { http, HttpResponse, delay } from 'msw'
import { render, screen, waitFor, act } from '../../../tests/helpers/render'
import { server } from '../../../tests/helpers/msw/server'
import JourneyShareSection from './JourneyShareSection'

type ToastKind = 'success' | 'error' | 'warning' | 'info'

const toastSpy = vi.fn((_message: string, _type?: ToastKind, _duration?: number) => 0)
const writeText = vi.fn(async (_text: string) => {})

const JOURNEY_ID = 7

function existingLink(overrides: Record<string, unknown> = {}) {
  return { token: 'tok-abc', share_timeline: true, share_gallery: false, share_map: true, ...overrides }
}

beforeEach(() => {
  toastSpy.mockClear()
  writeText.mockClear()
  window.__addToast = toastSpy
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true, writable: true })
  Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true, writable: true })
})

afterEach(() => {
  delete window.__addToast
})

describe('JourneyShareSection', () => {
  it('FE-JRN-SHARE-001: offers to create a link when the journey has none', async () => {
    server.use(http.get('/api/journeys/7/share-link', () => HttpResponse.json({ link: null })))
    render(<JourneyShareSection journeyId={JOURNEY_ID} />)

    expect(await screen.findByRole('button', { name: /create share link/i })).toBeInTheDocument()
    expect(screen.getByText('Public Share')).toBeInTheDocument()
  })

  it('FE-JRN-SHARE-001b: renders nothing at all when the link is not this user to manage', async () => {
    // Anyone but the owner gets 403 on the read, and would be refused on the
    // create too - so the section stays out of the dialog rather than offering
    // a button that cannot work.
    server.use(http.get('/api/journeys/7/share-link', () => HttpResponse.json({ error: 'Not allowed' }, { status: 403 })))

    const { container } = render(<JourneyShareSection journeyId={JOURNEY_ID} />)

    await waitFor(() => expect(container).toBeEmptyDOMElement())
    expect(screen.queryByText('Public Share')).not.toBeInTheDocument()
  })

  it('FE-JRN-SHARE-002: renders nothing while the share link is still loading', async () => {
    server.use(http.get('/api/journeys/7/share-link', async () => {
      await delay(30)
      return HttpResponse.json({ link: null })
    }))

    const { container } = render(<JourneyShareSection journeyId={JOURNEY_ID} />)
    expect(container).toBeEmptyDOMElement()

    await screen.findByRole('button', { name: /create share link/i })
  })

  it('FE-JRN-SHARE-003: creates a link and shows the public URL', async () => {
    server.use(
      http.get('/api/journeys/7/share-link', () => HttpResponse.json({ link: null })),
      http.post('/api/journeys/7/share-link', () => HttpResponse.json({ token: 'fresh-token' })),
    )
    render(<JourneyShareSection journeyId={JOURNEY_ID} />)

    const createBtn = await screen.findByRole('button', { name: /create share link/i })
    act(() => { createBtn.click() })

    expect(await screen.findByText(`${window.location.origin}/public/journey/fresh-token`)).toBeInTheDocument()
    expect(toastSpy).toHaveBeenCalledWith('Share link created', 'success', undefined)
  })

  it('FE-JRN-SHARE-004: warns when creating the link fails', async () => {
    server.use(
      http.get('/api/journeys/7/share-link', () => HttpResponse.json({ link: null })),
      http.post('/api/journeys/7/share-link', () => new HttpResponse(null, { status: 500 })),
    )
    render(<JourneyShareSection journeyId={JOURNEY_ID} />)

    const createBtn = await screen.findByRole('button', { name: /create share link/i })
    act(() => { createBtn.click() })

    await waitFor(() => {
      expect(toastSpy).toHaveBeenCalledWith('Failed to create link', 'error', undefined)
    })
    expect(screen.getByRole('button', { name: /create share link/i })).toBeInTheDocument()
  })

  it('FE-JRN-SHARE-005: renders the permission toggles in the state the link reports', async () => {
    server.use(http.get('/api/journeys/7/share-link', () => HttpResponse.json({ link: existingLink() })))
    render(<JourneyShareSection journeyId={JOURNEY_ID} />)

    const timeline = await screen.findByRole('button', { name: 'Timeline' })
    expect(timeline.className).toContain('bg-zinc-900')
    expect(screen.getByRole('button', { name: 'Map' }).className).toContain('bg-zinc-900')
    expect(screen.getByRole('button', { name: 'Gallery' }).className).not.toContain('bg-zinc-900')
    expect(screen.getByText(`${window.location.origin}/public/journey/tok-abc`)).toBeInTheDocument()
  })

  it('FE-JRN-SHARE-006: copies the URL and resets the button label after two seconds', async () => {
    server.use(http.get('/api/journeys/7/share-link', () => HttpResponse.json({ link: existingLink() })))
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      render(<JourneyShareSection journeyId={JOURNEY_ID} />)
      const copyBtn = await screen.findByRole('button', { name: 'Copy' })
      act(() => { copyBtn.click() })

      expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/public/journey/tok-abc`)
      expect(await screen.findByRole('button', { name: 'Copied!' })).toBeInTheDocument()

      act(() => { vi.advanceTimersByTime(2100) })
      expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('FE-JRN-SHARE-007: toggling a permission posts the updated flag set', async () => {
    const bodies: Record<string, unknown>[] = []
    server.use(
      http.get('/api/journeys/7/share-link', () => HttpResponse.json({ link: existingLink() })),
      http.post('/api/journeys/7/share-link', async ({ request }) => {
        bodies.push(await request.json() as Record<string, unknown>)
        return HttpResponse.json({ token: 'tok-abc' })
      }),
    )
    render(<JourneyShareSection journeyId={JOURNEY_ID} />)

    const gallery = await screen.findByRole('button', { name: 'Gallery' })
    act(() => { gallery.click() })

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toEqual({ share_timeline: true, share_gallery: true, share_map: true })
    expect(screen.getByRole('button', { name: 'Gallery' }).className).toContain('bg-zinc-900')
  })

  it('FE-JRN-SHARE-008: reverts the toggle when the update request fails', async () => {
    server.use(
      http.get('/api/journeys/7/share-link', () => HttpResponse.json({ link: existingLink() })),
      http.post('/api/journeys/7/share-link', () => new HttpResponse(null, { status: 500 })),
    )
    render(<JourneyShareSection journeyId={JOURNEY_ID} />)

    const timeline = await screen.findByRole('button', { name: 'Timeline' })
    act(() => { timeline.click() })

    await waitFor(() => {
      expect(toastSpy).toHaveBeenCalledWith('Failed to update', 'error', undefined)
    })
    expect(screen.getByRole('button', { name: 'Timeline' }).className).toContain('bg-zinc-900')
  })

  it('FE-JRN-SHARE-009: deleting the link returns to the create state', async () => {
    server.use(
      http.get('/api/journeys/7/share-link', () => HttpResponse.json({ link: existingLink() })),
      http.delete('/api/journeys/7/share-link', () => HttpResponse.json({ ok: true })),
    )
    render(<JourneyShareSection journeyId={JOURNEY_ID} />)

    const deleteBtn = await screen.findByRole('button', { name: 'Delete link' })
    act(() => { deleteBtn.click() })

    expect(await screen.findByRole('button', { name: /create share link/i })).toBeInTheDocument()
    expect(toastSpy).toHaveBeenCalledWith('Share link deleted', 'success', undefined)
  })

  it('FE-JRN-SHARE-010: warns and keeps the link when deleting fails', async () => {
    server.use(
      http.get('/api/journeys/7/share-link', () => HttpResponse.json({ link: existingLink() })),
      http.delete('/api/journeys/7/share-link', () => new HttpResponse(null, { status: 500 })),
    )
    render(<JourneyShareSection journeyId={JOURNEY_ID} />)

    const deleteBtn = await screen.findByRole('button', { name: 'Delete link' })
    act(() => { deleteBtn.click() })

    await waitFor(() => {
      expect(toastSpy).toHaveBeenCalledWith('Failed to delete', 'error', undefined)
    })
    expect(screen.getByRole('button', { name: 'Delete link' })).toBeInTheDocument()
  })

  it('FE-JRN-SHARE-011: falls back to the create state when the link cannot be loaded', async () => {
    server.use(http.get('/api/journeys/7/share-link', () => new HttpResponse(null, { status: 500 })))
    render(<JourneyShareSection journeyId={JOURNEY_ID} />)

    expect(await screen.findByRole('button', { name: /create share link/i })).toBeInTheDocument()
  })

  // A self-hosted install served over plain HTTP has no navigator.clipboard, and the
  // unguarded call used to throw before the button ever showed feedback.
  it('FE-JRN-SHARE-012: copies through execCommand when the clipboard API is unavailable', async () => {
    server.use(http.get('/api/journeys/7/share-link', () => HttpResponse.json({ link: existingLink() })))
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true, writable: true })
    Object.defineProperty(window, 'isSecureContext', { value: false, configurable: true, writable: true })
    const execCommand = vi.fn(() => true)
    Object.defineProperty(document, 'execCommand', { value: execCommand, configurable: true, writable: true })
    render(<JourneyShareSection journeyId={JOURNEY_ID} />)

    const copyBtn = await screen.findByRole('button', { name: 'Copy' })
    act(() => { copyBtn.click() })

    await waitFor(() => expect(execCommand).toHaveBeenCalledWith('copy'))
    expect(await screen.findByRole('button', { name: 'Copied!' })).toBeInTheDocument()
    // The temporary textarea is removed again.
    expect(document.querySelector('textarea')).toBeNull()
  })
})
