import { describe, expect, it } from 'vitest'
import { DOCK_CAP, DOCK_PRIORITY, dockTabIds, pickDockTabs } from './dockTabs'

// FE-MOB-DOCK-001 to FE-MOB-DOCK-008

/** Alles, was ein voll ausgestatteter Trip anbieten kann, in der Reihenfolge des Docks. */
const ALL = ['plan', 'roadtrip', 'transports', 'buchungen', 'finanzplan', 'listen']

const ids = (enabled: string[]) => pickDockTabs(new Set(enabled)).map((tab) => tab.id)

describe('pickDockTabs', () => {
  it('FE-MOB-DOCK-001: five seats beside More, so the packing list gives way to the drive', () => {
    // Ein sechster Kreis laesst 3px Abstand, auf die kein Daumen zielt.
    expect(DOCK_CAP).toBe(5)
    expect(ids(ALL)).toEqual(['plan', 'roadtrip', 'transports', 'buchungen', 'finanzplan'])
    expect(ids(ALL)).not.toContain('listen')
  })

  it('FE-MOB-DOCK-002: without the road trip the packing list has its seat back', () => {
    expect(ids(ALL.filter((id) => id !== 'roadtrip'))).toEqual([
      'plan',
      'transports',
      'buchungen',
      'finanzplan',
      'listen',
    ])
  })

  it('FE-MOB-DOCK-003: priority decides who is cut, not the order the tabs were enabled', () => {
    const scrambled = ['listen', 'finanzplan', 'roadtrip', 'plan']
    expect(ids(scrambled)).toEqual(['plan', 'roadtrip', 'finanzplan', 'listen'])
  })

  it('FE-MOB-DOCK-004: a trip with few sections gets few seats, never padded', () => {
    expect(ids(['plan', 'listen'])).toEqual(['plan', 'listen'])
    expect(ids([])).toEqual([])
  })

  it('FE-MOB-DOCK-005: a plugin tab never takes a seat, it belongs in the More sheet', () => {
    expect(ids(['plugin:trip-todos', 'plan'])).toEqual(['plan'])
    expect(ids(['plugin:trip-todos', 'plugin:weather'])).toEqual([])
  })

  it('FE-MOB-DOCK-006: a seat is the priority entry itself, icon and all', () => {
    // Das Dock zeichnet den Kreis aus tab.icon; eine umgebaute Kopie ohne Icon bliebe leer.
    expect(pickDockTabs(new Set(ALL))).toEqual(DOCK_PRIORITY.slice(0, DOCK_CAP))
    expect(pickDockTabs(new Set(ALL))[1]).toBe(DOCK_PRIORITY[1])
  })
})

describe('dockTabIds', () => {
  it('FE-MOB-DOCK-007: names exactly the ids that got a seat, so the More sheet leaves them out', () => {
    const enabled = new Set(ALL)
    expect([...dockTabIds(enabled)]).toEqual(pickDockTabs(enabled).map((tab) => tab.id))
    expect(dockTabIds(enabled).has('listen')).toBe(false)
    expect(dockTabIds(enabled).has('roadtrip')).toBe(true)
  })

  it('FE-MOB-DOCK-008: never names more than the dock can hold', () => {
    expect(dockTabIds(new Set([...ALL, 'plugin:trip-todos'])).size).toBe(DOCK_CAP)
  })
})
