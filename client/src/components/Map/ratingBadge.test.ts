import { describe, it, expect } from 'vitest'
import { ratingBadgeHtml } from './ratingBadge'

describe('ratingBadgeHtml', () => {
  it('FE-MAP-RATINGBADGE-001: shows a whole rating without a decimal', () => {
    // "4" reads faster than "4.0", and at this size every character costs.
    expect(ratingBadgeHtml(4)).toContain('>4<')
    expect(ratingBadgeHtml(4)).not.toContain('4.0')
  })

  it('FE-MAP-RATINGBADGE-002: keeps one decimal where an average has one', () => {
    expect(ratingBadgeHtml(4.5)).toContain('>4.5<')
    expect(ratingBadgeHtml(4.25)).toContain('>4.3<')
  })

  it('FE-MAP-RATINGBADGE-003: draws nothing without a rating', () => {
    // An unrated place is most of them. A badge on every marker would say nothing and
    // cover the photo it sits on.
    expect(ratingBadgeHtml(null)).toBe('')
    expect(ratingBadgeHtml(undefined)).toBe('')
    expect(ratingBadgeHtml(0)).toBe('')
  })
})
