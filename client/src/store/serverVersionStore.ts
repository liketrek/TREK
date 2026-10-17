import { create } from 'zustand'
import { asReleaseTag } from '../utils/versionHandover'

/**
 * The version the server says it runs: first from the app config at launch,
 * then from its realtime socket on every (re)connect. A deploy restarts the
 * server, so a client that stayed open across one reconnects and learns the
 * new version here (NewVersionNotice).
 */
interface ServerVersionState {
  /** The first version this page heard of. A different build at that point is the launch handover's to fix. */
  first: string | null
  /** The last version the server reported, or null before its first report. */
  reported: string | null
  /** Takes a reported version; anything but a release tag is ignored. */
  note: (value: unknown) => void
}

export const useServerVersionStore = create<ServerVersionState>()((set, get) => ({
  first: null,
  reported: null,
  note(value) {
    const version = asReleaseTag(value)
    if (!version || version === get().reported) return
    set({ reported: version, first: get().first ?? version })
  },
}))
