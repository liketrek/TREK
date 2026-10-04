// FE-ADMIN-NOTIFDEF-001 to FE-ADMIN-NOTIFDEF-003
import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { render, screen, fireEvent, waitFor } from '../../../tests/helpers/render'
import { server } from '../../../tests/helpers/msw/server'
import AdminNotificationDefaultsPanel from './AdminNotificationDefaultsPanel'

const matrix = (defaults: Record<string, Record<string, string>>) => ({
  defaults,
  channels: [
    { id: 'inapp', labelKey: 'settings.notificationPreferences.inapp', active: true, configured: true },
    { id: 'email', labelKey: 'settings.notificationPreferences.email', active: true, configured: true },
  ],
  event_types: ['trip_invite', 'booking_change'],
  implemented_combos: { trip_invite: ['inapp', 'email'], booking_change: ['inapp'] },
})

describe('AdminNotificationDefaultsPanel (#1536)', () => {
  it('FE-ADMIN-NOTIFDEF-001: draws each cell in its state, and a dash where the channel does not apply', async () => {
    server.use(http.get('/api/admin/notification-preferences/defaults', () => HttpResponse.json(matrix({
      trip_invite: { inapp: 'on', email: 'blocked' }, booking_change: { inapp: 'off' },
    }))))
    render(<AdminNotificationDefaultsPanel />)
    expect(await screen.findByText('Defaults for users')).toBeInTheDocument()
    const states = Array.from(document.querySelectorAll('button[data-state]')).map(b => b.getAttribute('data-state'))
    expect(states).toEqual(['on', 'blocked', 'off'])
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('FE-ADMIN-NOTIFDEF-002: a click moves the cell on to the next state and saves just that cell', async () => {
    const sent: unknown[] = []
    server.use(
      http.get('/api/admin/notification-preferences/defaults', () => HttpResponse.json(matrix({ trip_invite: { inapp: 'on', email: 'on' }, booking_change: { inapp: 'on' } }))),
      http.put('/api/admin/notification-preferences/defaults', async ({ request }) => {
        const body = await request.json() as { defaults: Record<string, Record<string, string>> }
        sent.push(body)
        return HttpResponse.json(matrix({ trip_invite: { inapp: 'on', email: 'off' }, booking_change: { inapp: 'on' } }))
      }),
    )
    render(<AdminNotificationDefaultsPanel />)
    await screen.findByText('Defaults for users')
    const emailCell = document.querySelectorAll('button[data-state]')[1] as HTMLElement
    fireEvent.click(emailCell)
    await waitFor(() => expect(sent).toEqual([{ defaults: { trip_invite: { email: 'off' } } }]))
    await waitFor(() => expect(document.querySelectorAll('button[data-state]')[1].getAttribute('data-state')).toBe('off'))
  })

  it('FE-ADMIN-NOTIFDEF-003: a refused save puts the cell back', async () => {
    server.use(
      http.get('/api/admin/notification-preferences/defaults', () => HttpResponse.json(matrix({ trip_invite: { inapp: 'on', email: 'off' }, booking_change: { inapp: 'on' } }))),
      http.put('/api/admin/notification-preferences/defaults', () => HttpResponse.json({ error: 'nope' }, { status: 500 })),
    )
    render(<AdminNotificationDefaultsPanel />)
    await screen.findByText('Defaults for users')
    fireEvent.click(document.querySelectorAll('button[data-state]')[1] as HTMLElement)
    await waitFor(() => expect(document.querySelectorAll('button[data-state]')[1].getAttribute('data-state')).toBe('off'))
  })
})
