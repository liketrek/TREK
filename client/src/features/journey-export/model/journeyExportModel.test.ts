import { describe, expect, it } from 'vitest'
import { createJourneyExportModel } from './journeyExportModel'
import type { JourneyDetail } from '../../../store/journeyStore'

function journey(): JourneyDetail {
  return {
    title: 'Iceland Ring Road',
    subtitle: 'Two weeks around the island',
    cover_image: 'journeys/cover.jpg',
    entries: [
      {
        type: 'entry',
        title: 'Golden Circle',
        story: 'Waterfalls and geysers.',
        entry_date: '2026-07-01',
        entry_time: '09:00',
        location_name: 'Thingvellir',
        pros_cons: { pros: ['Views'], cons: ['Crowds'] },
        photos: [{ photo_id: 42 }],
      },
      {
        type: 'skeleton',
        title: 'Draft entry',
        entry_date: '2026-07-02',
        photos: [],
      },
    ],
  } as JourneyDetail
}

describe('createJourneyExportModel', () => {
  it('takes only printable Journey data into the export contract', () => {
    expect(createJourneyExportModel(journey())).toEqual({
      title: 'Iceland Ring Road',
      subtitle: 'Two weeks around the island',
      coverImage: 'journeys/cover.jpg',
      entries: [{
        title: 'Golden Circle',
        story: 'Waterfalls and geysers.',
        entry_date: '2026-07-01',
        entry_time: '09:00',
        location_name: 'Thingvellir',
        pros_cons: { pros: ['Views'], cons: ['Crowds'] },
        photos: [{ photo_id: 42 }],
      }],
    })
  })
})
