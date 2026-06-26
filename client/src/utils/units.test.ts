import { describe, it, expect } from 'vitest'
import { convertDistance, formatDistance, getDistanceUnitLabel } from './units'

describe('units', () => {
  describe('getDistanceUnitLabel', () => {
    it('returns km for metric and mi for imperial', () => {
      expect(getDistanceUnitLabel('metric')).toBe('km')
      expect(getDistanceUnitLabel('imperial')).toBe('mi')
    })
  })

  describe('convertDistance', () => {
    it('keeps kilometres for metric', () => {
      expect(convertDistance(10, 'metric')).toBe(10)
    })
    it('converts kilometres to miles for imperial', () => {
      expect(convertDistance(10, 'imperial')).toBeCloseTo(6.21371, 4)
    })
    it('clamps negative and non-finite input to 0', () => {
      expect(convertDistance(-5, 'imperial')).toBe(0)
      expect(convertDistance(NaN, 'metric')).toBe(0)
      expect(convertDistance(Infinity, 'metric')).toBe(0)
    })
  })

  describe('formatDistance', () => {
    it('shows metres below 1 km for metric', () => {
      expect(formatDistance(0.3, 'metric')).toBe('300 m')
      expect(formatDistance(0.05, 'metric')).toBe('50 m')
    })
    it('shows kilometres at or above 1 km for metric', () => {
      expect(formatDistance(1.5, 'metric')).toBe('1.5 km')
      expect(formatDistance(10, 'metric')).toBe('10 km')
    })
    it('shows miles for imperial', () => {
      expect(formatDistance(10, 'imperial')).toBe('6.2 mi')
    })
    it('shows <0.1 for a tiny imperial distance', () => {
      expect(formatDistance(0.05, 'imperial')).toBe('<0.1 mi')
    })
    it('clamps negative and non-finite input to 0', () => {
      expect(formatDistance(-1, 'metric')).toBe('0 m')
      expect(formatDistance(NaN, 'imperial')).toBe('0 mi')
    })
  })
})
