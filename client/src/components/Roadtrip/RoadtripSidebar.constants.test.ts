import { describe, expect, it } from 'vitest'
import { DAY_BADGE, DISC, RAIL_DASH, RAIL_GRID, STAT_LABEL } from './RoadtripSidebar.constants'

const classes = (list: string): string[] => list.split(' ')

describe('Road trip rail styles', () => {
  it('FE-ROADTRIP-RAILSTYLE-001: the marker column is exactly as wide as the disc that sits in it', () => {
    expect(RAIL_GRID).toEqual({ gridTemplateColumns: '24px 1fr', columnGap: 10 })
    // h-6 and w-6 are 1.5rem, the 24px the column keeps free, so a disc never pushes the
    // content beside it out of line with the rows above and below.
    expect(classes(DISC)).toEqual(expect.arrayContaining(['h-6', 'w-6', 'shrink-0', 'rounded-full']))
  })

  it('FE-ROADTRIP-RAILSTYLE-002: the line between stops is a gradient with an exact dash, not a dashed border', () => {
    expect(RAIL_DASH.width).toBe(1.5)
    expect(RAIL_DASH.backgroundImage).toBe('repeating-linear-gradient(var(--border-primary) 0 4px, transparent 4px 8px)')
    expect(RAIL_DASH).not.toHaveProperty('borderStyle')
  })

  it('FE-ROADTRIP-RAILSTYLE-003: captions and day badges are tracked capitals in a quiet tone, and a day badge stays at medium weight', () => {
    expect(classes(STAT_LABEL)).toEqual(expect.arrayContaining(['uppercase', 'tracking-[0.15em]', 'text-content-faint']))
    expect(classes(DAY_BADGE)).toEqual(expect.arrayContaining(['uppercase', 'tracking-[0.09em]', 'font-medium', 'text-content-muted']))
    expect(classes(DAY_BADGE)).not.toContain('font-semibold')
  })
})
