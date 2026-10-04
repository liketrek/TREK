import { beforeEach, describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '../../../helpers/msw/server'
import { useAuthStore } from '../../../../src/store/authStore'
import { useTripStore } from '../../../../src/store/tripStore'
import { buildPlanner, buildShell } from '../../../helpers/mobileTrip'
import { buildTrip, buildUser } from '../../../helpers/factories'
import { resetAllStores, seedStore } from '../../../helpers/store'
import { render, screen, waitFor } from '../../../helpers/render'

// FE-MOB-SHOST-030 to FE-MOB-SHOST-031 (001 to 029 and 032 live in MTripSheets.test.tsx)
//
// The phone has no share sheet of its own: the Mehr sheet opens the desktop
// TripMembersModal through this host. Every other sheet is stubbed away so the real
// modal is what the phone user gets (#2478).

vi.mock('../../../../src/mobile/screens/trip/sheets/MPlaceSheet', () => ({ default: () => null }))
vi.mock('../../../../src/mobile/screens/trip/sheets/MDaySheet', () => ({ default: () => null }))
vi.mock('../../../../src/mobile/screens/trip/sheets/MDaysSheet', () => ({ default: () => null }))
vi.mock('../../../../src/mobile/screens/trip/sheets/MAccommodationSheet', () => ({ default: () => null }))
vi.mock('../../../../src/mobile/screens/trip/sheets/MTransportSheet', () => ({ default: () => null }))
vi.mock('../../../../src/mobile/screens/trip/sheets/MBrowseActionsSheet', () => ({ default: () => null }))
vi.mock('../../../../src/mobile/screens/trip/sheets/MMehrSheet', () => ({ default: () => null }))
vi.mock('../../../../src/mobile/screens/trip/sheets/MExportSheet', () => ({ default: () => null }))
vi.mock('../../../../src/mobile/screens/trip/sheets/MNoteSheet', () => ({ default: () => null }))
vi.mock('../../../../src/mobile/screens/trip/sheets/MImportSheet', () => ({ default: () => null }))
vi.mock('../../../../src/mobile/screens/trip/sheets/MPlaceEditSheet', () => ({ default: () => null }))
vi.mock('../../../../src/mobile/screens/trip/sheets/MReservationSheet', () => ({ default: () => null }))
vi.mock('../../../../src/mobile/screens/trip/sheets/MTransportFormSheet', () => ({ default: () => null }))
vi.mock('../../../../src/mobile/screens/trip/sheets/MCostSheet', () => ({ default: () => null }))
vi.mock('../../../../src/mobile/screens/trip/roadtrip/MRtStopSheet', () => ({ default: () => null }))
vi.mock('../../../../src/mobile/screens/trip/roadtrip/MRtStaySheet', () => ({ default: () => null }))
vi.mock('../../../../src/mobile/screens/trip/roadtrip/MRtKindSheet', () => ({ default: () => null }))
vi.mock('../../../../src/mobile/screens/trip/roadtrip/MRtInfoSheet', () => ({ default: () => null }))
vi.mock('../../../../src/mobile/screens/trip/roadtrip/MRtCorridorSheet', () => ({ default: () => null }))
vi.mock('../../../../src/mobile/screens/trip/roadtrip/MRtDraftSheet', () => ({ default: () => null }))
vi.mock('../../../../src/mobile/screens/settings/MConfirmSheet', () => ({ default: () => null }))
vi.mock('../../../../src/components/Planner/BookingImportModal', () => ({ default: () => null }))
vi.mock('../../../../src/components/Planner/AirTrailImportModal', () => ({ default: () => null }))
vi.mock('../../../../src/components/Planner/TransitJourneyModal', () => ({ default: () => null }))
vi.mock('../../../../src/components/Trips/TripFormModal', () => ({ default: () => null }))

import MTripSheets from '../../../../src/mobile/screens/trip/sheets/MTripSheets'

const owner = buildUser({ id: 1, username: 'owner' })
const alice = buildUser({ id: 2, username: 'alice' })

function openShareSheet() {
  const planner = buildPlanner()
  render(<MTripSheets planner={planner} shell={buildShell({ sheet: { id: 'members' } })} />)
  return { planner }
}

describe('MTripSheets share sheet', () => {
  beforeEach(() => {
    resetAllStores()
    seedStore(useAuthStore, { user: owner, isAuthenticated: true })
    seedStore(useTripStore, { trip: buildTrip({ id: 1, title: 'Japan 2026', user_id: owner.id }) })
    server.use(
      http.get('/api/trips/1/members', () =>
        HttpResponse.json({ owner: { id: owner.id, username: owner.username, avatar_url: null }, members: [], current_user_id: owner.id }),
      ),
      http.get('/api/trips/1/share-link', () => HttpResponse.json({ token: null })),
      http.get('/api/trips/1/invite-link', () => HttpResponse.json({ token: null })),
      http.get('/api/auth/users', () => HttpResponse.json({ users: [alice] })),
    )
  })

  it('FE-MOB-SHOST-030: the user picked on the phone shows in the field before the invite is sent', async () => {
    const user = userEvent.setup()
    openShareSheet()

    const trigger = (await screen.findByText('Select user…')).closest('button') as HTMLButtonElement
    await user.click(trigger)
    await user.click(await screen.findByRole('button', { name: 'alice' }))

    expect(trigger).toHaveTextContent('alice')
    expect(screen.queryByText('Select user…')).toBeNull()
    expect(screen.getByRole('button', { name: 'Invite' })).toBeEnabled()
  })

  it('FE-MOB-SHOST-031: sending the invite adds the pick and frees the field again', async () => {
    const user = userEvent.setup()
    let body: unknown = null
    server.use(
      http.post('/api/trips/1/members', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ success: true })
      }),
    )
    const { planner } = openShareSheet()

    const trigger = (await screen.findByText('Select user…')).closest('button') as HTMLButtonElement
    await user.click(trigger)
    await user.click(await screen.findByRole('button', { name: 'alice' }))
    await user.click(screen.getByRole('button', { name: 'Invite' }))

    await waitFor(() => expect(planner.refreshMembers).toHaveBeenCalled())
    expect(body).toEqual({ identifier: 'alice' })
    expect(trigger).toHaveTextContent('Select user…')
  })
})
