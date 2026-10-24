import { useCallback } from 'react'
import { abortedError, mapsApi } from '../api/client'
import { useTranslation } from '../i18n'
import { pluginSearchRepo } from '../repo/pluginSearchRepo'
import { usePluginStore } from '../store/pluginStore'
import { sourceLabelFor } from '../utils/placeSource'
import { pointFromBox, type LocationBiasBox } from './useLocationBias'

/**
 * The typed-ahead half of the place search, for the desktop form and the phone sheet
 * alike: the core suggestions with the rows of the plugins that answer as you type
 * appended (#2221), and the mark each row carries.
 *
 * Appended rather than interleaved, as the full search does it: the core list is
 * ranked against the query and has earned its order. The plugin route is only asked
 * while a search plugin is installed, so an instance without one sends exactly the
 * requests it always did, and the route itself only reaches the plugins whose build
 * implements `suggest`, the ones that can take a request per keystroke.
 */
export function usePlaceSuggestions() {
  const { t } = useTranslation()
  const plugins = usePluginStore(s => s.plugins)
  const asksPlugins = plugins.some(p => p.searchProvider)

  const autocomplete = useCallback(
    async (input: string, lang: string, box: LocationBiasBox | undefined, signal: AbortSignal, sessionToken?: string) => {
      // Side by side, and the plugin half never rejects, so only the core call can
      // send the list down its error path.
      const [core, fromPlugins] = await Promise.all([
        mapsApi.autocomplete(input, lang, box, signal, sessionToken),
        asksPlugins ? pluginSearchRepo.suggest(input, lang, pointFromBox(box), signal) : [],
      ])
      // Both shells order their lists by aborting the previous keystroke and dropping
      // its rejection. The core half can have answered before the abort while the
      // plugin half was still out, so a superseded answer rejects here as well rather
      // than overwriting the newer list.
      if (signal.aborted) throw abortedError()
      if (fromPlugins.length === 0) return core
      return { ...core, suggestions: [...(core.suggestions || []), ...fromPlugins] }
    },
    [asksPlugins],
  )

  const sourceLabel = useCallback(
    (row: unknown, listSource: string) => sourceLabelFor(row, listSource, t, id => plugins.find(p => p.id === id)?.name),
    [plugins, t],
  )

  return { autocomplete, sourceLabel }
}
