// FE-JRN-ADDTRIP-001 to FE-JRN-ADDTRIP-009

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { http, HttpResponse, delay } from 'msw'
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor, act } from '../../../tests/helpers/render'
import { server } from '../../../tests/helpers/msw/server'
import { AddTripDialog } from './JourneyDetailPageAddTripDialog'

type ToastKind = 'success' | 'error' | 'warning' | 'info'

const toastSpy = vi.fn((_message: string, _type?: ToastKind, _duration?: number) => 0)

const trips = [
  { id: 11, title: 'Italy Roadtrip', destination: 'Rome', start_date: '2026-03-14', end_date: '2026-03-20' },
  { id: 12, title: 'Winter Break', destination: 'Tromso' },
  { id: 13, title: 'City Hop' },
]

function mountDialog(props: Partial<React.ComponentProps<typeof AddTripDialog>> = {}) {
  const onClose = vi.fn()
  const onAdded = vi.fn()
  render(
    <AddTripDialog journeyId={4} existingTripIds={[]} onClose={onClose} onAdded={onAdded} {...props} />,
  )
  return { onClose, onAdded }
}

beforeEach(() => {
  toastSpy.mockClear()
  window.__addToast = toastSpy
  server.use(http.get('/api/journeys/available-trips', () => HttpResponse.json({ trips })))
})

afterEach(() => {
  delete window.__addToast
})

describe('AddTripDialog', () => {
  it('FE-JRN-ADDTRIP-001: lists the trips available for linking', async () => {
    mountDialog()

    expect(await screen.findByText('Italy Roadtrip')).toBeInTheDocument()
    expect(screen.getByText('Winter Break')).toBeInTheDocument()
    expect(screen.getByText('City Hop')).toBeInTheDocument()
  })

  it('FE-JRN-ADDTRIP-002: renders destination and start date as the trip subtitle', async () => {
    mountDialog()

    expect(await screen.findByText('Rome · 2026-03-14')).toBeInTheDocument()
    // Trips without a start date only show the destination.
    expect(screen.getByText('Tromso')).toBeInTheDocument()
  })

  it('FE-JRN-ADDTRIP-003: hides trips that are already linked', async () => {
    mountDialog({ existingTripIds: [11, 13] })

    expect(await screen.findByText('Winter Break')).toBeInTheDocument()
    expect(screen.queryByText('Italy Roadtrip')).not.toBeInTheDocument()
    expect(screen.queryByText('City Hop')).not.toBeInTheDocument()
  })

  it('FE-JRN-ADDTRIP-004: filters by title and by destination', async () => {
    const user = userEvent.setup()
    mountDialog()
    await screen.findByText('Italy Roadtrip')
    const search = screen.getByPlaceholderText('Trip name or destination...')

    await user.type(search, 'city')
    expect(screen.getByText('City Hop')).toBeInTheDocument()
    expect(screen.queryByText('Winter Break')).not.toBeInTheDocument()

    await user.clear(search)
    await user.type(search, 'tromso')
    expect(screen.getByText('Winter Break')).toBeInTheDocument()
    expect(screen.queryByText('City Hop')).not.toBeInTheDocument()
  })

  it('FE-JRN-ADDTRIP-005: shows the empty hint when no trip matches', async () => {
    const user = userEvent.setup()
    mountDialog()
    await screen.findByText('Italy Roadtrip')

    await user.type(screen.getByPlaceholderText('Trip name or destination...'), 'zzz')

    expect(screen.getByText('No trips available')).toBeInTheDocument()
  })

  it('FE-JRN-ADDTRIP-006: links the picked trip and notifies the parent', async () => {
    const bodies: Record<string, unknown>[] = []
    server.use(http.post('/api/journeys/4/trips', async ({ request }) => {
      bodies.push(await request.json() as Record<string, unknown>)
      return HttpResponse.json({ ok: true })
    }))
    const user = userEvent.setup()
    const { onAdded } = mountDialog()
    await screen.findByText('Italy Roadtrip')

    await user.click(screen.getAllByRole('button', { name: 'Link' })[0])

    await waitFor(() => expect(onAdded).toHaveBeenCalledTimes(1))
    expect(bodies[0]).toEqual({ trip_id: 11 })
    expect(toastSpy).toHaveBeenCalledWith('Trip linked', 'success', undefined)
  })

  it('FE-JRN-ADDTRIP-007: shows a busy state on the row while the link request runs', async () => {
    server.use(http.post('/api/journeys/4/trips', async () => {
      await delay(40)
      return HttpResponse.json({ ok: true })
    }))
    const user = userEvent.setup()
    const { onAdded } = mountDialog()
    await screen.findByText('Italy Roadtrip')

    await user.click(screen.getAllByRole('button', { name: 'Link' })[0])
    expect(screen.getByRole('button', { name: '...' })).toBeDisabled()

    await waitFor(() => expect(onAdded).toHaveBeenCalled())
  })

  it('FE-JRN-ADDTRIP-008: reports a failed link and re-enables the row', async () => {
    server.use(http.post('/api/journeys/4/trips', () => new HttpResponse(null, { status: 500 })))
    const user = userEvent.setup()
    const { onAdded } = mountDialog()
    await screen.findByText('Italy Roadtrip')

    await user.click(screen.getAllByRole('button', { name: 'Link' })[0])

    await waitFor(() => {
      expect(toastSpy).toHaveBeenCalledWith('Failed to link trip', 'error', undefined)
    })
    expect(onAdded).not.toHaveBeenCalled()
    expect(screen.getAllByRole('button', { name: 'Link' })[0]).toBeEnabled()
  })

  it('FE-JRN-ADDTRIP-009: closes via the header button and survives a failed trip fetch', async () => {
    server.use(http.get('/api/journeys/available-trips', () => new HttpResponse(null, { status: 500 })))
    const { onClose } = mountDialog()

    expect(await screen.findByText('No trips available')).toBeInTheDocument()

    const headerClose = screen.getByRole('heading', { name: 'Link Trip' })
      .parentElement!.querySelector('button')!
    act(() => { headerClose.click() })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
