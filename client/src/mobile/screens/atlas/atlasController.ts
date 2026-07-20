import { useAtlas } from '../../../pages/atlas/useAtlas'

/**
 * Full surface of the shared atlas hook. The mobile screen calls useAtlas()
 * once and hands the controller down to its sheets, so map state, bucket list
 * and the mark/unmark flows stay in a single instance.
 */
export type AtlasController = ReturnType<typeof useAtlas>
