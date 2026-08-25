// FE-JRN-CARD-001 to FE-JRN-CARD-017

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '../../../tests/helpers/render'
import { server } from '../../../tests/helpers/msw/server'
import { usePluginStore } from '../../store/pluginStore'
import type { JourneyEntry, JourneyPhoto } from '../../store/journeyStore'
import { EntryCard, SkeletonCard, CheckinCard } from './JourneyDetailPageEntryCard'

function buildPhoto(id: number): JourneyPhoto {
  return { id, entry_id: 10, photo_id: id, caption: null, sort_order: 0, shared: 1, created_at: 0 }
}

function buildEntry(overrides: Partial<JourneyEntry> = {}): JourneyEntry {
  return {
    id: 10,
    journey_id: 1,
    author_id: 1,
    type: 'entry',
    entry_date: '2026-03-15',
    title: 'Arrived in Rome',
    story: null,
    location_name: 'Rome, Italy',
    entry_time: '10:00',
    visibility: 'private',
    sort_order: 0,
    photos: [],
    created_at: 0,
    updated_at: 0,
    ...overrides,
  }
}

function mountCard(entry: JourneyEntry, readOnly = false) {
  const onEdit = vi.fn()
  const onDelete = vi.fn()
  const onPhotoClick = vi.fn()
  const utils = render(
    <EntryCard entry={entry} readOnly={readOnly} onEdit={onEdit} onDelete={onDelete} onPhotoClick={onPhotoClick} />,
  )
  return { ...utils, onEdit, onDelete, onPhotoClick }
}

beforeEach(() => {
  usePluginStore.setState({ plugins: [], loaded: true })
})

describe('EntryCard', () => {
  it('FE-JRN-CARD-001: renders the header layout for an entry without photos', () => {
    mountCard(buildEntry())

    expect(screen.getByText('Arrived in Rome')).toBeInTheDocument()
    expect(screen.getByText('Rome, Italy')).toBeInTheDocument()
    expect(screen.getByText('10:00')).toBeInTheDocument()
  })

  it('FE-JRN-CARD-002: renders the photo hero with the title overlaid', () => {
    const { container } = mountCard(buildEntry({ photos: [buildPhoto(100)] }))

    const img = container.querySelector('img[src="/api/photos/100/thumbnail"]')
    expect(img).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Arrived in Rome' })).toBeInTheDocument()
  })

  it('FE-JRN-CARD-003: forwards a photo click with the photo list and index', async () => {
    const user = userEvent.setup()
    const photos = [buildPhoto(100), buildPhoto(101)]
    const { container, onPhotoClick } = mountCard(buildEntry({ photos }))

    await user.click(container.querySelector('img[src="/api/photos/101/thumbnail"]') as HTMLElement)

    expect(onPhotoClick).toHaveBeenCalledWith(photos, 1)
  })

  it('FE-JRN-CARD-004: opens the photo-card menu and triggers edit', async () => {
    const user = userEvent.setup()
    const { container, onEdit } = mountCard(buildEntry({ photos: [buildPhoto(100)] }))

    // The photo itself is a button now, so pick the menu trigger by its own styling.
    await user.click(container.querySelector('button[class*="bg-black/40"]') as HTMLElement)
    await user.click(screen.getByRole('button', { name: 'Edit' }))

    expect(onEdit).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
  })

  it('FE-JRN-CARD-005: opens the header menu and triggers delete', async () => {
    const user = userEvent.setup()
    const { container, onDelete } = mountCard(buildEntry())

    await user.click(container.querySelectorAll('button')[0])
    await user.click(screen.getByRole('button', { name: 'Delete' }))

    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('FE-JRN-CARD-006: closes the menu again when the backdrop is clicked', async () => {
    const user = userEvent.setup()
    const { container } = mountCard(buildEntry())

    await user.click(container.querySelectorAll('button')[0])
    const backdrop = document.querySelector('.fixed.inset-0.z-\\[99\\]') as HTMLElement
    expect(backdrop).toBeInTheDocument()

    await user.click(backdrop)
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
  })

  it('FE-JRN-CARD-007: hides the menu entirely in read-only mode', () => {
    const { container } = mountCard(buildEntry({ photos: [buildPhoto(100)] }), true)

    // Only the photo remains clickable; the menu trigger is gone.
    const buttons = container.querySelectorAll('button')
    expect(buttons).toHaveLength(1)
    expect(buttons[0].querySelector('img')).toBeInTheDocument()
  })

  it('FE-JRN-CARD-008: renders mood, weather and tags in the meta row', () => {
    mountCard(buildEntry({ mood: 'amazing', weather: 'sunny', tags: ['culture', 'food'] }))

    expect(screen.getByText('Amazing')).toBeInTheDocument()
    expect(screen.getByText('Sunny')).toBeInTheDocument()
    expect(screen.getByText('culture')).toBeInTheDocument()
    expect(screen.getByText('food')).toBeInTheDocument()
  })

  it('FE-JRN-CARD-009: renders the pros/cons verdict and the story body', () => {
    mountCard(buildEntry({ story: 'A wonderful evening', pros_cons: { pros: ['Great food'], cons: ['Crowded'] } }))

    expect(screen.getByText('A wonderful evening')).toBeInTheDocument()
    expect(screen.getByText('Great food')).toBeInTheDocument()
    expect(screen.getByText('Crowded')).toBeInTheDocument()
  })

  it('FE-JRN-CARD-010: skips the plugin request while no plugins are active', async () => {
    let called = 0
    server.use(http.get('/api/journal-entry-rows/10', () => {
      called += 1
      return HttpResponse.json({ providers: [] })
    }))
    mountCard(buildEntry())

    await waitFor(() => expect(screen.getByText('Arrived in Rome')).toBeInTheDocument())
    expect(called).toBe(0)
  })

  it('FE-JRN-CARD-011: renders plugin rows as text and links, dropping empty providers', async () => {
    usePluginStore.setState({
      plugins: [{ id: 'koffi', name: 'Koffi', type: 'widget', icon: null }],
      loaded: true,
    })
    server.use(http.get('/api/journal-entry-rows/10', () => HttpResponse.json({
      providers: [
        { pluginId: 'koffi', items: [{ label: 'Coffee', value: 'Espresso' }, { label: 'Shop', value: 'Sant Eustachio', url: 'https://example.com' }] },
        { pluginId: 'empty', items: [] },
      ],
    })))
    mountCard(buildEntry())

    expect(await screen.findByText('Espresso')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: 'Sant Eustachio' })
    expect(link).toHaveAttribute('href', 'https://example.com')
    expect(screen.queryByText('empty')).not.toBeInTheDocument()
  })

  it('FE-JRN-CARD-012: renders no plugin rows when the request fails', async () => {
    usePluginStore.setState({
      plugins: [{ id: 'koffi', name: 'Koffi', type: 'widget', icon: null }],
      loaded: true,
    })
    server.use(http.get('/api/journal-entry-rows/10', () => new HttpResponse(null, { status: 500 })))
    const { container } = mountCard(buildEntry())

    await waitFor(() => expect(screen.getByText('Arrived in Rome')).toBeInTheDocument())
    expect(container.querySelectorAll('a')).toHaveLength(0)
  })

  it('FE-JRN-CARD-013: falls back to the entry URL when a plugin row has no value', async () => {
    usePluginStore.setState({
      plugins: [{ id: 'koffi', name: 'Koffi', type: 'widget', icon: null }],
      loaded: true,
    })
    server.use(http.get('/api/journal-entry-rows/10', () => HttpResponse.json({
      providers: [{ pluginId: 'koffi', items: [{ label: 'Booking', url: 'https://book.example' }] }],
    })))
    mountCard(buildEntry())

    expect(await screen.findByRole('link', { name: 'https://book.example' })).toBeInTheDocument()
  })
})

describe('SkeletonCard', () => {
  it('FE-JRN-CARD-014: shows the placeholder title and the add CTA when clickable', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<SkeletonCard entry={buildEntry({ title: null })} onClick={onClick} />)

    expect(screen.getByText('New Entry')).toBeInTheDocument()
    expect(screen.getByText('Rome, Italy · 10:00')).toBeInTheDocument()

    await user.click(screen.getByText('Add Entry'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('FE-JRN-CARD-015: omits the add CTA when no click handler is given', () => {
    render(<SkeletonCard entry={buildEntry({ entry_time: null })} />)

    expect(screen.getByText('Arrived in Rome')).toBeInTheDocument()
    expect(screen.queryByText('Add Entry')).not.toBeInTheDocument()
    expect(screen.getByText('Rome, Italy')).toBeInTheDocument()
  })
})

describe('CheckinCard', () => {
  it('FE-JRN-CARD-016: renders title, location, story and time', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <CheckinCard
        entry={buildEntry({ type: 'checkin', title: 'Quick stop', story: 'Espresso', entry_time: '15:30' })}
        onClick={onClick}
      />,
    )

    expect(screen.getByText('Quick stop')).toBeInTheDocument()
    expect(screen.getByText('· Rome, Italy')).toBeInTheDocument()
    expect(screen.getByText('Espresso')).toBeInTheDocument()

    await user.click(screen.getByText('15:30'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('FE-JRN-CARD-017: renders a bare check-in without location, story or time', () => {
    const { container } = render(
      <CheckinCard entry={buildEntry({ type: 'checkin', title: 'Bare stop', location_name: null, entry_time: null })} />,
    )

    expect(screen.getByText('Bare stop')).toBeInTheDocument()
    expect(container.querySelector('.cursor-pointer')).not.toBeInTheDocument()
  })
})
