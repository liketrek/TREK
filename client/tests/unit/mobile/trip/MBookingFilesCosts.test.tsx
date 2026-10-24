import { useState, type ComponentProps } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import MBookingFilesCosts from '../../../../src/mobile/screens/trip/sheets/MBookingFilesCosts'
import { useAuthStore } from '../../../../src/store/authStore'
import { useTripStore } from '../../../../src/store/tripStore'
import { buildBudgetItem, buildTrip, buildTripFile, buildUser } from '../../../helpers/factories'
import { buildPlanner } from '../../../helpers/mobileTrip'
import { server } from '../../../helpers/msw/server'
import { resetAllStores, seedStore } from '../../../helpers/store'
import { fireEvent, render, screen, waitFor } from '../../../helpers/render'

// FE-MOB-BKFOOT-001 to FE-MOB-BKFOOT-010
// PlFileAttach speaks through planner.t (keys echoed), MLinkedCosts through the
// real translations, so file labels are asserted as keys and cost labels in English.

const planner = buildPlanner()

type Props = ComponentProps<typeof MBookingFilesCosts>

/** Holds the pending files the way the sheets do, so adding and dropping can be followed. */
function Harness(props: Partial<Omit<Props, 'pendingFiles' | 'setPendingFiles'>> & { initialPending?: File[] }) {
  const { initialPending = [], ...rest } = props
  const [pendingFiles, setPendingFiles] = useState<File[]>(initialPending)
  return (
    <MBookingFilesCosts
      planner={planner}
      reservationId={9}
      pendingFiles={pendingFiles}
      setPendingFiles={setPendingFiles}
      canUploadFiles
      showCosts
      createDisabled={false}
      onCreate={vi.fn()}
      onEdit={vi.fn()}
      {...rest}
    />
  )
}

const onBooking = buildTripFile({ id: 1, trip_id: 1, original_name: 'voucher.pdf', reservation_id: 9 })
const loose = buildTripFile({ id: 2, trip_id: 1, original_name: 'map.pdf' })

describe('MBookingFilesCosts', () => {
  beforeEach(() => {
    resetAllStores()
    seedStore(useTripStore, { trip: buildTrip({ id: 1, user_id: 1, currency: 'EUR' }), files: [], budgetItems: [] })
  })

  it('FE-MOB-BKFOOT-001: with upload rights the file row is there even without any file', () => {
    render(<Harness />)
    expect(screen.getByText('files.title')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'files.attach' })).toBeInTheDocument()
    // The booking sheets keep the row terse.
    expect(screen.queryByText('files.pasteHint')).not.toBeInTheDocument()
  })

  it('FE-MOB-BKFOOT-002: without upload rights and without files the row stays away', () => {
    seedStore(useTripStore, { files: [loose] })
    // Nobody signed in, so nothing can be linked either.
    render(<Harness canUploadFiles={false} />)
    expect(screen.queryByText('files.title')).not.toBeInTheDocument()
  })

  it('FE-MOB-BKFOOT-003: without upload rights the files already on the booking are still listed', () => {
    seedStore(useTripStore, { files: [onBooking, loose] })
    render(<Harness canUploadFiles={false} />)
    expect(screen.getByText('voucher.pdf')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'files.attach' })).not.toBeInTheDocument()
  })

  it('FE-MOB-BKFOOT-004: without upload rights a trip file can still be linked, which posts the link', async () => {
    seedStore(useAuthStore, { user: buildUser({ id: 1 }) })
    seedStore(useTripStore, { files: [loose] })
    let body: unknown = null
    server.use(
      http.post('/api/trips/1/files/2/link', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ success: true })
      }),
      http.get('/api/trips/1/files', () => HttpResponse.json({ files: [loose] })),
    )
    render(<Harness canUploadFiles={false} />)
    fireEvent.click(screen.getByRole('button', { name: 'files.link' }))
    fireEvent.click(screen.getByText('map.pdf'))
    await waitFor(() => expect(body).toEqual({ reservation_id: 9 }))
  })

  it('FE-MOB-BKFOOT-005: an unsaved booking offers no file to link', () => {
    seedStore(useAuthStore, { user: buildUser({ id: 1 }) })
    seedStore(useTripStore, { files: [onBooking, loose] })
    render(<Harness reservationId={null} />)
    expect(screen.queryByRole('button', { name: 'files.link' })).not.toBeInTheDocument()
    expect(screen.queryByText('voucher.pdf')).not.toBeInTheDocument()
  })

  it('FE-MOB-BKFOOT-006: picked files join the pending list and each X drops its own', () => {
    render(<Harness initialPending={[new File(['a'], 'a.pdf')]} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [new File(['b'], 'b.pdf'), new File(['c'], 'c.pdf')] } })
    expect(screen.getAllByText(/^[abc]\.pdf$/).map(n => n.textContent)).toEqual(['a.pdf', 'b.pdf', 'c.pdf'])

    fireEvent.click(screen.getAllByRole('button', { name: 'common.delete' })[1])
    expect(screen.getAllByText(/^[abc]\.pdf$/).map(n => n.textContent)).toEqual(['a.pdf', 'c.pdf'])
  })

  it('FE-MOB-BKFOOT-007: the costs block follows showCosts', () => {
    const { unmount } = render(<Harness showCosts={false} />)
    expect(screen.queryByRole('button', { name: /Create expense/ })).not.toBeInTheDocument()
    unmount()
    render(<Harness />)
    expect(screen.getByRole('button', { name: /Create expense/ })).toBeInTheDocument()
    expect(screen.getByText('Saves the booking, then opens the Costs editor.')).toBeInTheDocument()
  })

  it('FE-MOB-BKFOOT-008: create is handed createDisabled and onCreate', () => {
    const onCreate = vi.fn()
    const { unmount } = render(<Harness createDisabled onCreate={onCreate} />)
    expect(screen.getByRole('button', { name: /Create expense/ })).toBeDisabled()
    unmount()
    render(<Harness onCreate={onCreate} />)
    fireEvent.click(screen.getByRole('button', { name: /Create expense/ }))
    expect(onCreate).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-BKFOOT-009: the booking\'s expenses are listed and open through onEdit', () => {
    const fare = buildBudgetItem({ id: 30, trip_id: 1, name: 'Fare', total_price: 60, reservation_id: 9 })
    seedStore(useTripStore, { budgetItems: [fare, buildBudgetItem({ id: 31, trip_id: 1, name: 'Elsewhere', reservation_id: 10 })] })
    const onEdit = vi.fn()
    render(<Harness onEdit={onEdit} />)
    expect(screen.queryByText('Elsewhere')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Fare'))
    expect(onEdit).toHaveBeenCalledWith(fare)
  })

  it('FE-MOB-BKFOOT-010: the costs block links to the same booking as the files', () => {
    seedStore(useTripStore, { budgetItems: [buildBudgetItem({ id: 32, trip_id: 1, name: 'Loose cost' })] })
    const { unmount } = render(<Harness reservationId={null} />)
    // Before the first save there is nothing to link a cost to.
    expect(screen.queryByRole('button', { name: 'Link' })).not.toBeInTheDocument()
    unmount()
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: 'Link' }))
    expect(screen.getByText('Loose cost')).toBeInTheDocument()
  })
})
