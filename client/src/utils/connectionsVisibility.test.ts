import { describe, it, expect } from 'vitest'
import {
  parseStoredConnections, resolveEffectiveConnections, resolveVisibleConnectionIds,
  toggleConnectionId, toggleAllConnections,
} from './connectionsVisibility'

describe('parseStoredConnections', () => {
  it('returns null when nothing was ever stored', () => {
    expect(parseStoredConnections(null)).toBeNull()
  })

  it('reads a legacy bare-array value as "only" mode', () => {
    expect(parseStoredConnections('[1,2,3]')).toEqual({ mode: 'only', ids: [1, 2, 3] })
  })

  it('reads an empty legacy array as "only" mode with no ids', () => {
    expect(parseStoredConnections('[]')).toEqual({ mode: 'only', ids: [] })
  })

  it('reads the tagged "only" object format', () => {
    expect(parseStoredConnections('{"mode":"only","ids":[5]}')).toEqual({ mode: 'only', ids: [5] })
  })

  it('reads the tagged "all-except" object format', () => {
    expect(parseStoredConnections('{"mode":"all-except","ids":[7,8]}')).toEqual({ mode: 'all-except', ids: [7, 8] })
  })

  it('returns null for invalid JSON', () => {
    expect(parseStoredConnections('not json')).toBeNull()
  })

  it('returns null for a well-formed but unrecognized shape', () => {
    expect(parseStoredConnections('{"foo":"bar"}')).toBeNull()
    expect(parseStoredConnections('{"mode":"bogus","ids":[1]}')).toBeNull()
    expect(parseStoredConnections('null')).toBeNull()
    expect(parseStoredConnections('42')).toBeNull()
  })
})

describe('resolveEffectiveConnections', () => {
  it('returns the stored preference unchanged when present, regardless of the account default', () => {
    const stored = { mode: 'only' as const, ids: [1] }
    expect(resolveEffectiveConnections(stored, true)).toEqual(stored)
    expect(resolveEffectiveConnections(stored, false)).toEqual(stored)
  })

  it('falls back to "all-except []" when nothing is stored and the account default is on', () => {
    expect(resolveEffectiveConnections(null, true)).toEqual({ mode: 'all-except', ids: [] })
  })

  it('falls back to "only []" when nothing is stored and the account default is off', () => {
    expect(resolveEffectiveConnections(null, false)).toEqual({ mode: 'only', ids: [] })
  })
})

describe('resolveVisibleConnectionIds', () => {
  it('"only" mode shows exactly the stored ids, independent of what is routable', () => {
    expect(resolveVisibleConnectionIds({ mode: 'only', ids: [2, 4] }, [1, 2, 3, 4, 5])).toEqual([2, 4])
  })

  it('"all-except" mode shows every routable id except the stored ones', () => {
    expect(resolveVisibleConnectionIds({ mode: 'all-except', ids: [3] }, [1, 2, 3, 4])).toEqual([1, 2, 4])
  })

  it('"all-except []" shows every routable id', () => {
    expect(resolveVisibleConnectionIds({ mode: 'all-except', ids: [] }, [1, 2, 3])).toEqual([1, 2, 3])
  })
})

describe('toggleConnectionId', () => {
  it('materializes the account default before toggling when nothing is stored yet (default on)', () => {
    // Default on -> effective mode is 'all-except []'; turning id 5 off adds it to the exceptions.
    expect(toggleConnectionId(null, true, 5)).toEqual({ mode: 'all-except', ids: [5] })
  })

  it('materializes the account default before toggling when nothing is stored yet (default off)', () => {
    // Default off -> effective mode is 'only []'; turning id 5 on adds it to the inclusion list.
    expect(toggleConnectionId(null, false, 5)).toEqual({ mode: 'only', ids: [5] })
  })

  it('adds an id in "only" mode', () => {
    expect(toggleConnectionId({ mode: 'only', ids: [1] }, false, 2)).toEqual({ mode: 'only', ids: [1, 2] })
  })

  it('removes an id already present in "only" mode', () => {
    expect(toggleConnectionId({ mode: 'only', ids: [1, 2] }, false, 2)).toEqual({ mode: 'only', ids: [1] })
  })

  it('adds an id to the exception list in "all-except" mode (hides it)', () => {
    expect(toggleConnectionId({ mode: 'all-except', ids: [] }, true, 9)).toEqual({ mode: 'all-except', ids: [9] })
  })

  it('removes an id from the exception list in "all-except" mode (re-shows it)', () => {
    expect(toggleConnectionId({ mode: 'all-except', ids: [9] }, true, 9)).toEqual({ mode: 'all-except', ids: [] })
  })
})

describe('toggleAllConnections', () => {
  it('flips "only" to "all-except []"', () => {
    expect(toggleAllConnections({ mode: 'only', ids: [1, 2] }, false)).toEqual({ mode: 'all-except', ids: [] })
  })

  it('flips "all-except" to "only []"', () => {
    expect(toggleAllConnections({ mode: 'all-except', ids: [3] }, false)).toEqual({ mode: 'only', ids: [] })
  })

  it('materializes the account default first when nothing is stored yet, then flips it', () => {
    // Default on -> effective is 'all-except []' -> flips to 'only []'.
    expect(toggleAllConnections(null, true)).toEqual({ mode: 'only', ids: [] })
    // Default off -> effective is 'only []' -> flips to 'all-except []'.
    expect(toggleAllConnections(null, false)).toEqual({ mode: 'all-except', ids: [] })
  })
})
