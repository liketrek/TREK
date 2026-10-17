// FE-ADMIN-GQUOTA-001 to FE-ADMIN-GQUOTA-004
import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '../../../tests/helpers/render'
import { server } from '../../../tests/helpers/msw/server'
import GoogleDailyLimitRow from './GoogleDailyLimitRow'

describe('GoogleDailyLimitRow (#1582)', () => {
  it('FE-ADMIN-GQUOTA-001: shows the stored ceiling and today against it', async () => {
    server.use(http.get('/api/admin/google-quota', () => HttpResponse.json({ daily_limit: 500, used_today: 123, exhausted: false })))
    render(<GoogleDailyLimitRow />)
    expect(await screen.findByText('Today: 123 of 500')).toBeInTheDocument()
    expect(screen.getByLabelText('Daily limit for Google calls')).toHaveValue('500')
    // Nothing to save until the number changes.
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull()
  })

  it('FE-ADMIN-GQUOTA-002: without a ceiling it counts today only', async () => {
    server.use(http.get('/api/admin/google-quota', () => HttpResponse.json({ daily_limit: null, used_today: 7, exhausted: false })))
    render(<GoogleDailyLimitRow />)
    expect(await screen.findByText('Today: 7')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('No limit')).toHaveValue('')
  })

  it('FE-ADMIN-GQUOTA-003: a used-up day says so', async () => {
    server.use(http.get('/api/admin/google-quota', () => HttpResponse.json({ daily_limit: 10, used_today: 10, exhausted: true })))
    render(<GoogleDailyLimitRow />)
    expect(await screen.findByText('Limit reached (10), Google paused until tomorrow')).toBeInTheDocument()
  })

  it('FE-ADMIN-GQUOTA-004: saving sends the new number, and an empty field sends null', async () => {
    const sent: unknown[] = []
    server.use(
      http.get('/api/admin/google-quota', () => HttpResponse.json({ daily_limit: 500, used_today: 3, exhausted: false })),
      http.put('/api/admin/google-quota', async ({ request }) => {
        const body = (await request.json()) as { daily_limit: number | null }
        sent.push(body)
        return HttpResponse.json({ daily_limit: body.daily_limit, used_today: 3, exhausted: false })
      }),
    )
    const user = userEvent.setup()
    render(<GoogleDailyLimitRow />)
    const input = await screen.findByLabelText('Daily limit for Google calls')
    await waitFor(() => expect(input).toHaveValue('500'))

    await user.clear(input)
    await user.type(input, '800')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(sent).toEqual([{ daily_limit: 800 }]))
    expect(await screen.findByText('Today: 3 of 800')).toBeInTheDocument()

    await user.clear(input)
    await user.type(input, '{Enter}')
    await waitFor(() => expect(sent).toEqual([{ daily_limit: 800 }, { daily_limit: null }]))
    expect(await screen.findByText('Today: 3')).toBeInTheDocument()
  })
})
