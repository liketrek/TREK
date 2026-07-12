import React from 'react'
import { useParams } from 'react-router-dom'
import PageShell from '../components/Layout/PageShell'
import PluginFrame from '../components/Plugins/PluginFrame'
import { usePluginStore } from '../store/pluginStore'
import { useTranslation } from '../i18n'

/**
 * Full-page host for a `page` plugin (#plugins, M3). Thin by design (no state /
 * effects — the page-pattern rule): it resolves the plugin from the store and
 * renders its sandboxed iframe; PluginFrame owns the bridge.
 */
export default function PluginPage(): React.ReactElement {
  const { pluginId = '' } = useParams()
  const { t } = useTranslation()
  const plugin = usePluginStore((s) => s.getById(pluginId))
  const loaded = usePluginStore((s) => s.loaded)

  if (loaded && (!plugin || plugin.type !== 'page')) {
    return (
      <PageShell background="var(--bg-secondary)">
        <div className="w-full px-6 py-16 text-center text-sm text-content-faint">{t('plugins.notFound')}</div>
      </PageShell>
    )
  }

  return (
    <PageShell background="var(--bg-secondary)" navOffset="var(--nav-h, 56px)">
      <div style={{ height: 'calc(100vh - var(--nav-h, 56px))' }}>
        <PluginFrame pluginId={pluginId} title={plugin?.name} fill className="w-full h-full" />
      </div>
    </PageShell>
  )
}
