// FE-BOOKINGS-EXPORT-001 to FE-BOOKINGS-EXPORT-003 (#1360)
import { describe, it, expect } from 'vitest'
import type { Reservation } from '../../../types'
import { bookingsCsv, bookingsFileName, csvCell } from './bookingsExport'

const labels = {
  type: (t: string) => `T:${t}`,
  status: (s: string) => `S:${s}`,
  headers: { type: 'Type', title: 'Title', status: 'Status', start: 'Start', end: 'End', from: 'From', to: 'To', location: 'Location', confirmation: 'Confirmation', notes: 'Notes' },
}

describe('bookingsExport', () => {
  it('FE-BOOKINGS-EXPORT-001: quotes what needs it and defuses formulas', () => {
    expect(csvCell('plain')).toBe('plain')
    expect(csvCell('a;b')).toBe('"a;b"')
    expect(csvCell('say "hi"')).toBe('"say ""hi"""')
    expect(csvCell('=SUM(A1)')).toBe("'=SUM(A1)")
    expect(csvCell('-5')).toBe("'-5")
    expect(csvCell(null)).toBe('')
  })

  it('FE-BOOKINGS-EXPORT-002: writes a header and one row per booking, route from its stops', () => {
    const rows = [
      { id: 1, type: 'flight', title: 'LH 190', status: 'confirmed', reservation_time: '2026-07-07T09:15', reservation_end_time: '2026-07-07T10:25', location: null, confirmation_number: 'ABC123', notes: 'Window',
        endpoints: [{ sequence: 1, code: 'BER', name: 'Berlin' }, { sequence: 0, code: 'FRA', name: 'Frankfurt' }] },
      { id: 2, type: 'hotel', title: 'Redo XXL', status: 'pending', reservation_time: null, reservation_end_time: null, location: 'Berlin', confirmation_number: null, notes: null },
    ] as unknown as Reservation[]
    const csv = bookingsCsv(rows, labels)
    expect(csv.startsWith('\uFEFF')).toBe(true)
    const lines = csv.slice(1).trim().split('\r\n')
    expect(lines[0]).toBe('Type;Title;Status;Start;End;From;To;Location;Confirmation;Notes')
    expect(lines[1]).toBe('T:flight;LH 190;S:confirmed;2026-07-07T09:15;2026-07-07T10:25;FRA Frankfurt;BER Berlin;;ABC123;Window')
    expect(lines[2]).toBe('T:hotel;Redo XXL;S:pending;;;;;Berlin;;')
  })

  it('FE-BOOKINGS-EXPORT-003: names the file after the trip', () => {
    expect(bookingsFileName('Berlin 2026', 'transports')).toBe('berlin-2026-transports.csv')
    expect(bookingsFileName('Zürich & Côte', 'bookings')).toBe('zurich-cote-bookings.csv')
    expect(bookingsFileName(undefined, 'bookings')).toBe('trip-bookings.csv')
    expect(bookingsFileName('!!!', 'bookings')).toBe('trip-bookings.csv')
  })
})
