import { describe, expect, it, vi } from 'vitest'

vi.mock('marked', () => ({
  marked: {
    parse: (str: string) => `<p>${str}</p>`,
  },
}))

import { buildJourneyBookDocument } from './buildJourneyBookDocument'
import type { JourneyDetail } from '../../../store/journeyStore'

function buildJourney(overrides: Partial<JourneyDetail> = {}): JourneyDetail {
  return {
    id: 1,
    user_id: 1,
    title: 'Iceland Ring Road',
    subtitle: null,
    status: 'active',
    cover_image: null,
    cover_gradient: null,
    created_at: 1,
    updated_at: 1,
    entries: [
      {
        id: 10,
        journey_id: 1,
        author_id: 1,
        type: 'entry',
        title: 'Golden Circle',
        story: 'An incredible day.',
        entry_date: '2026-07-01',
        visibility: 'private',
        sort_order: 0,
        photos: [{ id: 100, entry_id: 10, photo_id: 42, shared: 0, sort_order: 0, created_at: 1 }],
        created_at: 1,
        updated_at: 1,
      },
    ],
    gallery: [],
    trips: [],
    contributors: [],
    stats: { entries: 1, photos: 1, places: 1 },
    ...overrides,
  } as JourneyDetail
}

describe('buildJourneyBookDocument', () => {
  it('builds a complete document and estimates cover, entry, and closing pages', () => {
    const result = buildJourneyBookDocument(buildJourney())

    expect(result.html).toContain('<!DOCTYPE html>')
    expect(result.html).toContain('Iceland Ring Road')
    expect(result.html).toContain('Golden Circle')
    expect(result.html).toContain('/api/photos/42/original')
    expect(result.estimatedPageCount).toBe(3)
  })

  it('does not render skeleton entries', () => {
    const journey = buildJourney({
      entries: [
        ...buildJourney().entries,
        {
          id: 11,
          journey_id: 1,
          author_id: 1,
          type: 'skeleton',
          title: 'Not published',
          entry_date: '2026-07-02',
          visibility: 'private',
          sort_order: 1,
          photos: [],
          created_at: 1,
          updated_at: 1,
        },
      ],
    })

    const result = buildJourneyBookDocument(journey)

    expect(result.html).not.toContain('Not published')
    expect(result.estimatedPageCount).toBe(3)
  })

  it('preserves the original English labels and Inter font', () => {
    const result = buildJourneyBookDocument(buildJourney())

    expect(result.html).toContain('Journey Book')
    expect(result.html).toContain('Day 1')
    expect(result.html).toContain('Made with TREK')
    expect(result.html).toContain('fonts.googleapis.com')
  })
})
