import { describe, it, expect } from 'vitest'
import { Bike, Landmark } from 'lucide-react'
import {
  CATEGORY_SPEC, categoryMeta, STATUS_SPEC, tint, UNCATEGORIZED_META,
} from '../../../../src/mobile/screens/collections/collectionsMobileModel'

// FE-MOB-COLL-001 onwards

describe('collectionsMobileModel', () => {
  it('FE-MOB-COLL-001: canonical categories use the design colour table, not the DB colour', () => {
    const meta = categoryMeta({ name: 'Activity', color: '#10b981', icon: 'Bike' })
    expect(meta).toEqual(CATEGORY_SPEC.Activity)
    expect(meta?.color).toBe('#4A7DDB')
    expect(meta?.icon).toBe(Bike)
  })

  it('FE-MOB-COLL-002: custom categories fall back to their own colour and the neutral colour when unset', () => {
    expect(categoryMeta({ name: 'Wineries', color: '#123456', icon: null })?.color).toBe('#123456')
    expect(categoryMeta({ name: 'Wineries', color: null, icon: null })?.color).toBe(UNCATEGORIZED_META.color)
    expect(categoryMeta(null)).toBeNull()
    expect(categoryMeta({ name: null, color: '#123456' })).toBeNull()
  })

  it('FE-MOB-COLL-003: the status canon covers the Idea → Want to go → Visited cycle', () => {
    expect(STATUS_SPEC.idea.labelKey).toBe('collections.status.idea')
    expect(STATUS_SPEC.want.labelKey).toBe('collections.status.want')
    expect(STATUS_SPEC.visited.labelKey).toBe('collections.status.visited')
    expect(STATUS_SPEC.idea.color).toBe('#9A9AA1')
    expect(STATUS_SPEC.want.color).toBe('#4A7DDB')
    expect(STATUS_SPEC.visited.color).toBe('#2FA37A')
  })

  it('FE-MOB-COLL-004: tint appends the design alpha suffix to a hex colour', () => {
    expect(tint('#4A7DDB', '18')).toBe('#4A7DDB18')
    expect(UNCATEGORIZED_META.icon).toBe(Landmark)
  })
})
