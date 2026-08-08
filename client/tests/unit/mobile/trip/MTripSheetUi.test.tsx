import { describe, expect, it, vi } from 'vitest'
import { Home } from 'lucide-react'
import {
  ActionCircle,
  Eyebrow,
  INNER_CLS,
  StatBox,
  TileHeader,
  displayTime,
} from '../../../../src/mobile/screens/trip/sheets/MTripSheetUi'
import { fireEvent, render, screen } from '../../../helpers/render'

// FE-MOB-SHUI-001 to FE-MOB-SHUI-014

describe('MTripSheetUi', () => {
  it('FE-MOB-SHUI-001: INNER_CLS carries both inner-surface tokens', () => {
    expect(INNER_CLS).toContain('var(--m-inbr)')
    expect(INNER_CLS).toContain('var(--m-inner)')
  })

  it('FE-MOB-SHUI-002: Eyebrow renders its children with the faint label styling', () => {
    render(<Eyebrow>Stops</Eyebrow>)
    const el = screen.getByText('Stops')
    expect(el).toHaveClass('font-geist', 'text-m-faint')
  })

  it('FE-MOB-SHUI-003: Eyebrow appends the caller class', () => {
    render(<Eyebrow className="uppercase">Stops</Eyebrow>)
    expect(screen.getByText('Stops')).toHaveClass('uppercase')
  })

  it('FE-MOB-SHUI-004: TileHeader shows icon, title and subline', () => {
    render(
      <TileHeader
        icon={<Home data-testid="tile-icon" />}
        title="Hotel Sacher"
        sub="Philharmonikerstrasse 4"
        onClose={vi.fn()}
        closeLabel="Close"
      />,
    )
    expect(screen.getByTestId('tile-icon')).toBeInTheDocument()
    expect(screen.getByText('Hotel Sacher')).toBeInTheDocument()
    expect(screen.getByText('Philharmonikerstrasse 4')).toBeInTheDocument()
  })

  it('FE-MOB-SHUI-005: TileHeader omits the subline when no sub is given', () => {
    render(<TileHeader icon={<Home />} title="Hotel" onClose={vi.fn()} closeLabel="Close" />)
    expect(document.querySelector('.text-m-muted')).toBeNull()
  })

  it('FE-MOB-SHUI-006: TileHeader close button reports the label and fires onClose', () => {
    const onClose = vi.fn()
    render(<TileHeader icon={<Home />} title="Hotel" onClose={onClose} closeLabel="Close" />)
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-SHUI-007: StatBox renders value over label', () => {
    render(<StatBox value="15:00" label="Check-in" />)
    expect(screen.getByText('15:00')).toBeInTheDocument()
    expect(screen.getByText('Check-in')).toBeInTheDocument()
    expect(screen.getByText('15:00')).not.toHaveClass('blur-[4px]')
  })

  it('FE-MOB-SHUI-008: StatBox blurs the value when asked', () => {
    render(<StatBox value="ABC123" label="Code" blurred />)
    expect(screen.getByText('ABC123')).toHaveClass('blur-[4px]', 'select-none')
  })

  it('FE-MOB-SHUI-009: StatBox forwards clicks', () => {
    const onClick = vi.fn()
    render(<StatBox value="ABC123" label="Code" onClick={onClick} />)
    fireEvent.click(screen.getByText('Code'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-SHUI-010: ActionCircle uses the accent surface when primary', () => {
    const onClick = vi.fn()
    render(<ActionCircle label="Route" primary onClick={onClick}><Home /></ActionCircle>)
    const btn = screen.getByRole('button', { name: 'Route' })
    expect(btn).toHaveClass('bg-m-act', 'text-m-actfg')
    expect(btn).toHaveAttribute('title', 'Route')
    fireEvent.click(btn)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-SHUI-011: ActionCircle switches to the danger tint and keeps the caller class', () => {
    render(<ActionCircle label="Delete" danger className="ml-2"><Home /></ActionCircle>)
    const btn = screen.getByRole('button', { name: 'Delete' })
    expect(btn.className).toContain('var(--m-st-danger)')
    expect(btn).toHaveClass('ml-2')
  })

  it('FE-MOB-SHUI-012: ActionCircle defaults to the neutral glass surface', () => {
    render(<ActionCircle label="Share"><Home /></ActionCircle>)
    const btn = screen.getByRole('button', { name: 'Share' })
    expect(btn).toHaveClass('text-m-ink')
    expect(btn).not.toHaveClass('bg-m-act')
  })

  it('FE-MOB-SHUI-013: displayTime formats a plain HH:MM through formatTime', () => {
    expect(displayTime('15:00', 'en-US', '24h')).toBe('15:00')
    expect(displayTime('15:00', 'en-US', '12h')).toBe('3:00 PM')
    expect(displayTime(null, 'en-US', '24h')).toBe('')
    expect(displayTime(undefined, 'en-US', '24h')).toBe('')
  })

  it('FE-MOB-SHUI-014: displayTime reads an ISO timestamp and falls back when it is unparsable', () => {
    expect(displayTime('2026-05-02T19:30:00Z', 'en-US', '24h')).toMatch(/^\d{2}:\d{2}$/)
    expect(displayTime('2026-05-02T19:30:00Z', 'en-US', '12h')).toMatch(/(AM|PM)$/)
    // Not a date, still contains "T" — formatTime takes over and returns "00:00".
    expect(displayTime('TBD', 'en-US', '24h')).toBe('00:00')
  })
})
