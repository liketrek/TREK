// FE-W5ASG-001 to FE-W5ASG-022
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../../../tests/helpers/render'
import type { Day, Place, Reservation, TripFile } from '../../types'
import type { FileManagerState } from './useFileManager'

const getLinks = vi.fn(async (_tripId: number, _fileId: number): Promise<{ links?: unknown[] }> => ({ links: [] }))
const addLink = vi.fn(async (_tripId: number, _fileId: number, _data: unknown) => ({}))
const removeLink = vi.fn(async (_tripId: number, _fileId: number, _linkId: number) => ({}))

vi.mock('../../api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/client')>()
  return {
    ...actual,
    filesApi: {
      ...actual.filesApi,
      getLinks: (tripId: number, fileId: number) => getLinks(tripId, fileId),
      addLink: (tripId: number, fileId: number, data: unknown) => addLink(tripId, fileId, data),
      removeLink: (tripId: number, fileId: number, linkId: number) => removeLink(tripId, fileId, linkId),
    },
  }
})

import { AssignModal } from './FileManagerAssignModal'

const setAssignFileId = vi.fn()
const handleAssign = vi.fn(async (_fileId: number, _data: unknown) => {})
const refreshFiles = vi.fn(async () => {})

const file = (overrides: Partial<TripFile> = {}) =>
  ({ id: 7, original_name: 'ticket.pdf', description: '', url: '/uploads/files/ticket.pdf', ...overrides }) as unknown as TripFile

const place = (id: number, name: string) => ({ id, name }) as unknown as Place
const reservation = (id: number, title: string, type: string) => ({ id, title, type }) as unknown as Reservation
const day = (overrides: Partial<Day> = {}) => ({ id: 100, day_number: 1, ...overrides }) as unknown as Day

function state(overrides: Partial<FileManagerState> = {}): FileManagerState {
  return {
    files: [file()],
    assignFileId: 7,
    setAssignFileId,
    t: (key: string) => key,
    days: [],
    assignments: {},
    places: [],
    reservations: [],
    tripId: 3,
    handleAssign,
    refreshFiles,
    ...overrides,
  } as unknown as FileManagerState
}

beforeEach(() => {
  vi.clearAllMocks()
  getLinks.mockResolvedValue({ links: [] })
  addLink.mockResolvedValue({})
  removeLink.mockResolvedValue({})
})

describe('AssignModal shell', () => {
  it('FE-W5ASG-001: portals the modal and names the selected file', () => {
    const { container } = render(<AssignModal {...state()} />)

    expect(container).toBeEmptyDOMElement()
    expect(screen.getByText('files.assignTitle')).toBeInTheDocument()
    expect(screen.getByText('ticket.pdf')).toBeInTheDocument()
  })

  it('FE-W5ASG-002: the backdrop closes the modal but the card swallows the click', () => {
    render(<AssignModal {...state()} />)
    const card = screen.getByText('files.assignTitle').closest('div[style*="border-radius: 16px"]') as HTMLElement

    fireEvent.click(card)
    expect(setAssignFileId).not.toHaveBeenCalled()

    fireEvent.click(card.parentElement!)
    expect(setAssignFileId).toHaveBeenCalledWith(null)
  })

  it('FE-W5ASG-003: the header close button clears the selection', () => {
    render(<AssignModal {...state()} />)

    fireEvent.click(screen.getAllByRole('button')[0])

    expect(setAssignFileId).toHaveBeenCalledWith(null)
  })

  it('FE-W5ASG-034: the note label falls back to English when the key is missing', () => {
    render(<AssignModal {...state({ t: ((key: string) => (key === 'files.noteLabel' ? '' : key)) as FileManagerState['t'] })} />)

    expect(screen.getByText('Note')).toBeInTheDocument()
  })

  it('FE-W5ASG-004: an unknown file id leaves the header blank and the body empty', () => {
    render(<AssignModal {...state({ assignFileId: 999, places: [place(1, 'Louvre')] })} />)

    expect(screen.queryByText('ticket.pdf')).not.toBeInTheDocument()
    expect(screen.queryByText('files.assignPlace')).not.toBeInTheDocument()
  })
})

describe('AssignModal note field', () => {
  it('FE-W5ASG-005: a changed note is persisted on blur', () => {
    render(<AssignModal {...state()} />)
    const input = screen.getByPlaceholderText('files.notePlaceholder')

    fireEvent.blur(input, { target: { value: '  seat 14A  ' } })

    expect(handleAssign).toHaveBeenCalledWith(7, { description: 'seat 14A' })
  })

  it('FE-W5ASG-006: an unchanged note is not persisted', () => {
    render(<AssignModal {...state({ files: [file({ description: 'seat 14A' })] })} />)
    const input = screen.getByPlaceholderText('files.notePlaceholder')

    fireEvent.blur(input, { target: { value: 'seat 14A' } })

    expect(handleAssign).not.toHaveBeenCalled()
  })

  it('FE-W5ASG-007: Enter blurs the note field, other keys do not', () => {
    render(<AssignModal {...state()} />)
    const input = screen.getByPlaceholderText('files.notePlaceholder') as HTMLInputElement
    const blur = vi.spyOn(input, 'blur')

    fireEvent.keyDown(input, { key: 'a' })
    expect(blur).not.toHaveBeenCalled()

    fireEvent.keyDown(input, { key: 'Enter' })
    expect(blur).toHaveBeenCalled()
  })
})

describe('AssignModal place list', () => {
  const places = [place(1, 'Louvre'), place(2, 'Eiffel Tower'), place(3, 'Sacré-Cœur')]

  it('FE-W5ASG-008: groups places under their day and shows the date badge', () => {
    render(<AssignModal {...state({
      places,
      days: [day({ id: 100, date: '2026-03-15', title: 'Museums' }), day({ id: 101, day_number: 2 })],
      assignments: { '100': [{ place: { id: 1 } }, { place_id: 2 }] as never },
    })} />)

    expect(screen.getByText('Museums')).toBeInTheDocument()
    expect(screen.getByText('2026-03-15')).toBeInTheDocument()
    // day 2 has no places and is dropped entirely
    expect(screen.queryByText('dayplan.dayN')).not.toBeInTheDocument()
    expect(screen.getByText('files.unassigned')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sacré-Cœur' })).toBeInTheDocument()
  })

  it('FE-W5ASG-009: a titled day without a date badges the day number', () => {
    render(<AssignModal {...state({
      places,
      days: [day({ title: 'Museums' })],
      assignments: { '100': [{ place: { id: 1 } }] as never },
    })} />)

    expect(screen.getAllByText('dayplan.dayN')).toHaveLength(1)
  })

  it('FE-W5ASG-010: an untitled day without a date gets no badge', () => {
    render(<AssignModal {...state({
      places,
      days: [day()],
      assignments: { '100': [{ place: { id: 1 } }] as never },
    })} />)

    // only the group heading itself, no badge next to it
    expect(screen.getAllByText('dayplan.dayN')).toHaveLength(1)
  })

  it('FE-W5ASG-011: without day groups the unassigned heading is dropped', () => {
    render(<AssignModal {...state({ places })} />)

    expect(screen.getByText('files.assignPlace')).toBeInTheDocument()
    expect(screen.queryByText('files.unassigned')).not.toBeInTheDocument()
  })

  it('FE-W5ASG-012: the first place assignment goes through handleAssign', () => {
    render(<AssignModal {...state({ places })} />)

    fireEvent.click(screen.getByRole('button', { name: 'Louvre' }))

    expect(handleAssign).toHaveBeenCalledWith(7, { place_id: 1 })
    expect(addLink).not.toHaveBeenCalled()
  })

  it('FE-W5ASG-013: a second place becomes an extra link', async () => {
    render(<AssignModal {...state({ places, files: [file({ place_id: 1 })] })} />)

    fireEvent.click(screen.getByRole('button', { name: 'Eiffel Tower' }))

    await waitFor(() => expect(addLink).toHaveBeenCalledWith(3, 7, { place_id: 2 }))
    expect(refreshFiles).toHaveBeenCalled()
  })

  it('FE-W5ASG-014: a failing link request is swallowed', async () => {
    addLink.mockRejectedValueOnce(new Error('offline'))
    render(<AssignModal {...state({ places, files: [file({ place_id: 1 })] })} />)

    fireEvent.click(screen.getByRole('button', { name: 'Eiffel Tower' }))

    await waitFor(() => expect(addLink).toHaveBeenCalled())
    expect(refreshFiles).not.toHaveBeenCalled()
  })

  it('FE-W5ASG-015: clicking the primary place again unassigns it', () => {
    render(<AssignModal {...state({ places, files: [file({ place_id: 1 })] })} />)

    fireEvent.click(screen.getByRole('button', { name: 'Louvre' }))

    expect(handleAssign).toHaveBeenCalledWith(7, { place_id: null })
  })

  it('FE-W5ASG-016: clicking a linked place removes just that link', async () => {
    getLinks.mockResolvedValueOnce({ links: [{ id: 55, place_id: 2 }] })
    render(<AssignModal {...state({ places, files: [file({ place_id: 1, linked_place_ids: [2] })] })} />)

    fireEvent.click(screen.getByRole('button', { name: 'Eiffel Tower' }))

    await waitFor(() => expect(removeLink).toHaveBeenCalledWith(3, 7, 55))
    expect(refreshFiles).toHaveBeenCalled()
  })

  it('FE-W5ASG-017: a linked place with no matching link row still refreshes', async () => {
    getLinks.mockResolvedValueOnce({})
    render(<AssignModal {...state({ places, files: [file({ place_id: 1, linked_place_ids: [2] })] })} />)

    fireEvent.click(screen.getByRole('button', { name: 'Eiffel Tower' }))

    await waitFor(() => expect(refreshFiles).toHaveBeenCalled())
    expect(removeLink).not.toHaveBeenCalled()
  })

  it('FE-W5ASG-018: a failing links lookup is swallowed', async () => {
    getLinks.mockRejectedValueOnce(new Error('offline'))
    render(<AssignModal {...state({ places, files: [file({ place_id: 1, linked_place_ids: [2] })] })} />)

    fireEvent.click(screen.getByRole('button', { name: 'Eiffel Tower' }))

    await waitFor(() => expect(getLinks).toHaveBeenCalled())
    expect(refreshFiles).not.toHaveBeenCalled()
  })

  it('FE-W5ASG-019: rows keep the linked highlight on mouse-out, free rows do not', () => {
    render(<AssignModal {...state({ places, files: [file({ place_id: 1 })] })} />)
    const linked = screen.getByRole('button', { name: 'Louvre' })
    const free = screen.getByRole('button', { name: 'Eiffel Tower' })

    expect(linked.style.fontWeight).toBe('600')
    fireEvent.mouseEnter(linked)
    fireEvent.mouseLeave(linked)
    expect(linked.style.background).toBe('var(--bg-hover)')

    fireEvent.mouseEnter(free)
    expect(free.style.background).toBe('var(--bg-hover)')
    fireEvent.mouseLeave(free)
    expect(free.style.background).toBe('transparent')
  })
})

describe('AssignModal reservation list', () => {
  const bookings = [reservation(10, 'Hotel Lutetia', 'hotel')]
  const transports = [reservation(20, 'AF1234', 'flight'), reservation(21, 'TGV 8712', 'train')]

  it('FE-W5ASG-020: splits bookings from transports and gives each its own icon', () => {
    render(<AssignModal {...state({ reservations: [...bookings, ...transports] })} />)
    const iconOf = (name: string) =>
      screen.getByRole('button', { name }).querySelector('svg')?.getAttribute('class') ?? ''

    expect(screen.getByText('files.assignBooking')).toBeInTheDocument()
    expect(screen.getByText('files.assignTransport')).toBeInTheDocument()
    expect(iconOf('Hotel Lutetia')).toMatch(/ticket/)
    expect(iconOf('TGV 8712')).toMatch(/tram-front/)
    expect(iconOf('AF1234')).toMatch(/plane/)
  })

  it('FE-W5ASG-021: a transport-only trip shows no booking heading', () => {
    render(<AssignModal {...state({ reservations: transports })} />)

    expect(screen.queryByText('files.assignBooking')).not.toBeInTheDocument()
    expect(screen.getByText('files.assignTransport')).toBeInTheDocument()
  })

  it('FE-W5ASG-022: a booking-only trip shows no transport heading', () => {
    render(<AssignModal {...state({ reservations: bookings })} />)

    expect(screen.getByText('files.assignBooking')).toBeInTheDocument()
    expect(screen.queryByText('files.assignTransport')).not.toBeInTheDocument()
  })

  it('FE-W5ASG-023: the first reservation assignment goes through handleAssign', () => {
    render(<AssignModal {...state({ reservations: bookings })} />)

    fireEvent.click(screen.getByRole('button', { name: 'Hotel Lutetia' }))

    expect(handleAssign).toHaveBeenCalledWith(7, { reservation_id: 10 })
  })

  it('FE-W5ASG-024: a second reservation becomes an extra link', async () => {
    render(<AssignModal {...state({ reservations: [...bookings, ...transports], files: [file({ reservation_id: 10 })] })} />)

    fireEvent.click(screen.getByRole('button', { name: 'AF1234' }))

    await waitFor(() => expect(addLink).toHaveBeenCalledWith(3, 7, { reservation_id: 20 }))
    expect(refreshFiles).toHaveBeenCalled()
  })

  it('FE-W5ASG-025: a failing reservation link is swallowed', async () => {
    addLink.mockRejectedValueOnce(new Error('offline'))
    render(<AssignModal {...state({ reservations: [...bookings, ...transports], files: [file({ reservation_id: 10 })] })} />)

    fireEvent.click(screen.getByRole('button', { name: 'AF1234' }))

    await waitFor(() => expect(addLink).toHaveBeenCalled())
    expect(refreshFiles).not.toHaveBeenCalled()
  })

  it('FE-W5ASG-026: clicking the primary reservation again unassigns it', () => {
    render(<AssignModal {...state({ reservations: bookings, files: [file({ reservation_id: 10 })] })} />)

    fireEvent.click(screen.getByRole('button', { name: 'Hotel Lutetia' }))

    expect(handleAssign).toHaveBeenCalledWith(7, { reservation_id: null })
  })

  it('FE-W5ASG-027: clicking a linked reservation removes just that link', async () => {
    getLinks.mockResolvedValueOnce({ links: [{ id: 66, reservation_id: 20 }] })
    render(<AssignModal {...state({
      reservations: [...bookings, ...transports],
      files: [file({ reservation_id: 10, linked_reservation_ids: [20] })],
    })} />)

    fireEvent.click(screen.getByRole('button', { name: 'AF1234' }))

    await waitFor(() => expect(removeLink).toHaveBeenCalledWith(3, 7, 66))
    expect(refreshFiles).toHaveBeenCalled()
  })

  it('FE-W5ASG-028: a linked reservation with no matching link row still refreshes', async () => {
    getLinks.mockResolvedValueOnce({})
    render(<AssignModal {...state({
      reservations: [...bookings, ...transports],
      files: [file({ reservation_id: 10, linked_reservation_ids: [20] })],
    })} />)

    fireEvent.click(screen.getByRole('button', { name: 'AF1234' }))

    await waitFor(() => expect(refreshFiles).toHaveBeenCalled())
    expect(removeLink).not.toHaveBeenCalled()
  })

  it('FE-W5ASG-029: a failing reservation links lookup is swallowed', async () => {
    getLinks.mockRejectedValueOnce(new Error('offline'))
    render(<AssignModal {...state({
      reservations: [...bookings, ...transports],
      files: [file({ reservation_id: 10, linked_reservation_ids: [20] })],
    })} />)

    fireEvent.click(screen.getByRole('button', { name: 'AF1234' }))

    await waitFor(() => expect(getLinks).toHaveBeenCalled())
    expect(refreshFiles).not.toHaveBeenCalled()
  })

  it('FE-W5ASG-030: reservation rows keep the linked highlight on mouse-out', () => {
    render(<AssignModal {...state({ reservations: [...bookings, ...transports], files: [file({ reservation_id: 10 })] })} />)
    const linked = screen.getByRole('button', { name: 'Hotel Lutetia' })
    const free = screen.getByRole('button', { name: 'TGV 8712' })

    fireEvent.mouseEnter(linked)
    fireEvent.mouseLeave(linked)
    expect(linked.style.background).toBe('var(--bg-hover)')

    fireEvent.mouseEnter(free)
    expect(free.style.background).toBe('var(--bg-hover)')
    fireEvent.mouseLeave(free)
    expect(free.style.background).toBe('transparent')
  })
})

describe('AssignModal split layout', () => {
  it('FE-W5ASG-031: places and bookings sit side by side when both exist', () => {
    const { baseElement } = render(<AssignModal {...state({
      places: [place(1, 'Louvre')],
      reservations: [reservation(10, 'Hotel Lutetia', 'hotel')],
    })} />)

    expect(baseElement.querySelector('.md\\:flex')).not.toBeNull()
    expect(baseElement.querySelectorAll('.md\\:w-1\\/2')).toHaveLength(2)
  })

  it('FE-W5ASG-032: a places-only trip renders a single column', () => {
    const { baseElement } = render(<AssignModal {...state({ places: [place(1, 'Louvre')] })} />)

    expect(baseElement.querySelector('.md\\:flex')).toBeNull()
    expect(screen.getByText('files.assignPlace')).toBeInTheDocument()
    expect(screen.queryByText('files.assignBooking')).not.toBeInTheDocument()
  })

  it('FE-W5ASG-033: a bookings-only trip renders a single column', () => {
    const { baseElement } = render(<AssignModal {...state({ reservations: [reservation(10, 'Hotel Lutetia', 'hotel')] })} />)

    expect(baseElement.querySelector('.md\\:flex')).toBeNull()
    expect(screen.getByText('files.assignBooking')).toBeInTheDocument()
    expect(screen.queryByText('files.assignPlace')).not.toBeInTheDocument()
  })
})
