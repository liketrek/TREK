import { beforeEach, describe, expect, it } from 'vitest'
import { useServerVersionStore } from '../../../src/store/serverVersionStore'

beforeEach(() => {
  useServerVersionStore.setState({ first: null, reported: null })
})

describe('serverVersionStore', () => {
  it('FE-STORE-SRVVER-001: keeps the last release tag the server reported, and the first one', () => {
    useServerVersionStore.getState().note('4.3.4')
    expect(useServerVersionStore.getState()).toMatchObject({ first: '4.3.4', reported: '4.3.4' })
    useServerVersionStore.getState().note('4.4.0-rc.1')
    expect(useServerVersionStore.getState()).toMatchObject({ first: '4.3.4', reported: '4.4.0-rc.1' })
  })

  it('FE-STORE-SRVVER-002: ignores what is not a release tag, and a repeat of the same version', () => {
    useServerVersionStore.getState().note('4.3.4')
    const before = useServerVersionStore.getState()
    for (const value of [undefined, null, 434, '', '<b>5</b>', '4'.repeat(65)]) {
      useServerVersionStore.getState().note(value)
    }
    useServerVersionStore.getState().note('4.3.4')
    expect(useServerVersionStore.getState()).toBe(before)
  })
})
