// FE-COMP-DAYIMPACT-001 to FE-COMP-DAYIMPACT-006
import { describe, it, expect } from 'vitest'
import { BedDouble, CalendarCheck, MapPin } from 'lucide-react'
import { render, screen } from '../../../tests/helpers/render'
import DayImpactList from './DayImpactList'
import MDayImpactList from '../../mobile/components/MDayImpactList'
import type { ImpactLine } from '../../utils/dayImpactLines'

const lines: ImpactLine[] = [
  { key: 'stay-9', icon: BedDouble, tone: 'danger', text: 'Stay at Harbour Hotel', hint: 'Cancelled with its booking.' },
  { key: 'places', icon: MapPin, tone: 'neutral', text: 'Planned places: 3' },
]

describe('DayImpactList', () => {
  it('FE-COMP-DAYIMPACT-001: one row per line, text and hint, named for assistive tech', () => {
    render(<DayImpactList lines={lines} label="Delete Tue, Oct 13?" />)
    const list = screen.getByRole('list', { name: 'Delete Tue, Oct 13?' })
    const rows = screen.getAllByRole('listitem')
    expect(list).toContainElement(rows[0])
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent('Stay at Harbour Hotel')
    expect(rows[0]).toHaveTextContent('Cancelled with its booking.')
    expect(rows[1]).toHaveTextContent('Planned places: 3')
  })

  it('FE-COMP-DAYIMPACT-002: the tone reaches the row: money tints the whole row in the danger tokens, the rest stays in the content tokens', () => {
    render(<DayImpactList lines={lines} />)
    const [stay, places] = screen.getAllByRole('listitem')
    expect(stay).toHaveAttribute('data-tone', 'danger')
    expect(stay).toHaveClass('bg-danger-soft')
    expect(screen.getByText('Stay at Harbour Hotel')).toHaveClass('text-danger')
    // The chip stands out on the tinted row instead of melting into it.
    expect(stay.querySelector('span')).toHaveClass('text-danger')
    expect(stay.querySelector('span')).not.toHaveClass('bg-danger-soft')
    expect(places).not.toHaveClass('bg-danger-soft')
    expect(screen.getByText('Planned places: 3')).toHaveClass('text-content')
    expect(places.querySelectorAll('p')).toHaveLength(1)
  })

  it('FE-COMP-DAYIMPACT-003: renders nothing without lines, and the phone skin draws the same rows in its own tokens', () => {
    const { container } = render(<DayImpactList lines={[]} />)
    expect(container).toBeEmptyDOMElement()

    render(<MDayImpactList lines={lines} label="phone" />)
    const phone = screen.getByRole('list', { name: 'phone' })
    expect(phone.className).toContain('var(--m-inner)')
    const rows = phone.querySelectorAll('li')
    expect(rows).toHaveLength(2)
    // Hairlines between rows, not above the first.
    expect(rows[0].className).not.toContain('border-t')
    expect(rows[1].className).toContain('border-t')
  })

  it('FE-COMP-DAYIMPACT-004: the days themselves lead the list as chips, in both skins', () => {
    render(<DayImpactList lines={lines} days={['Fri, Oct 9', 'Sat, Oct 10', '+2 more']} label="desk" />)
    const desk = screen.getByRole('list', { name: 'desk' })
    const [daysRow, stay] = Array.from(desk.querySelectorAll('li'))
    expect(daysRow).toHaveAttribute('data-kind', 'days')
    expect(Array.from(daysRow.querySelectorAll('div > span')).map(s => s.textContent)).toEqual(['Fri, Oct 9', 'Sat, Oct 10', '+2 more'])
    expect(daysRow.querySelector('span')).toHaveClass('bg-warning-soft')
    expect(stay).toHaveTextContent('Stay at Harbour Hotel')

    render(<MDayImpactList lines={lines} days={['Fri, Oct 9']} label="phone" />)
    const phoneRows = screen.getByRole('list', { name: 'phone' }).querySelectorAll('li')
    expect(phoneRows).toHaveLength(3)
    expect(phoneRows[0].className).not.toContain('border-t')
    // The first content row sits under the day chips, so it gets the hairline.
    expect(phoneRows[1].className).toContain('border-t')
  })
  it('FE-COMP-DAYIMPACT-005: a day with nothing on it is one plain line, without the card and its chips', () => {
    const empty: ImpactLine[] = [{ key: 'empty', icon: CalendarCheck, tone: 'muted', text: 'Nothing is planned on this day.' }]
    render(<DayImpactList lines={empty} label="desk" />)
    const list = screen.getByRole('list', { name: 'desk' })
    const rows = list.querySelectorAll('li')
    expect(rows).toHaveLength(1)
    expect(rows[0]).toHaveAttribute('data-kind', 'empty')
    expect(rows[0]).toHaveTextContent('Nothing is planned on this day.')
    expect(list).not.toHaveClass('divide-y')
    expect(rows[0].querySelectorAll('p')).toHaveLength(0)

    // The same quiet line on the phone, and a muted line among others keeps its row.
    render(<MDayImpactList lines={empty} label="phone" />)
    expect(screen.getByRole('list', { name: 'phone' }).querySelector('li')?.className).toContain('var(--m-inner)')
    render(<DayImpactList lines={[...lines, empty[0]]} label="mixed" />)
    expect(screen.getByRole('list', { name: 'mixed' }).querySelectorAll('li')).toHaveLength(3)
  })

  it('FE-COMP-DAYIMPACT-006: on the phone the cancelled stay is tinted as a whole row too', () => {
    render(<MDayImpactList lines={lines} label="phone" />)
    const [stay, places] = Array.from(screen.getByRole('list', { name: 'phone' }).querySelectorAll('li'))
    expect(stay.className).toContain('var(--m-st-danger)')
    expect(places.className).not.toContain('var(--m-st-danger)')
  })
})
