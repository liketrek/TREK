import { useId, useState } from 'react'
import { useTranslation } from '../../i18n/TranslationContext'

export interface RoutingDefaults {
  routing_base_url?: string
  valhalla_base_url?: string
}

interface RoutingFieldsProps {
  defaults: RoutingDefaults
  onSave: (patch: RoutingDefaults) => Promise<void>
  onReset: (key: keyof RoutingDefaults) => Promise<void>
  hintClassName?: string
}

const ROUTERS = [
  { key: 'routing_base_url', label: 'settings.routingBase', hint: 'settings.routingBaseHint', placeholder: 'https://osrm.example.org' },
  { key: 'valhalla_base_url', label: 'settings.valhallaBase', hint: 'settings.valhallaBaseHint', placeholder: 'https://valhalla.example.org' },
] as const

function RoutingUrlField({ router, defaults, onSave, onReset, hintClassName = 'text-caption leading-relaxed text-content-faint' }: RoutingFieldsProps & { router: typeof ROUTERS[number] }) {
  const { t } = useTranslation()
  const id = useId()
  const [draft, setDraft] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const saved = defaults[router.key] ?? ''
  const commit = async () => {
    if (draft === null) return
    const value = draft.trim()
    if (value === saved) { setDraft(null); return }
    setSaving(true)
    try { await onSave({ [router.key]: value }) }
    finally { setDraft(null); setSaving(false) }
  }
  const reset = async () => {
    setSaving(true)
    try { await onReset(router.key) }
    finally { setDraft(null); setSaving(false) }
  }
  return (
    <div className="min-w-0 space-y-1.5" aria-busy={saving}>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <label htmlFor={id} className="text-body font-medium text-content-secondary">{t(router.label)}</label>
        {defaults[router.key] !== undefined && (
          <button type="button" disabled={saving} onClick={reset} className="text-caption text-content-muted underline disabled:opacity-50">
            {t('admin.defaultSettings.resetToBuiltIn')}
          </button>
        )}
      </div>
      <input id={id} type="url" inputMode="url" value={draft ?? saved} disabled={saving}
        onChange={e => setDraft(e.target.value)} onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
        placeholder={router.placeholder} spellCheck={false} autoComplete="off" autoCapitalize="none"
        aria-describedby={`${id}-hint`}
        className="min-h-11 w-full min-w-0 rounded-lg border border-edge bg-surface-input px-3 py-2 text-body text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
      />
      <p id={`${id}-hint`} className={hintClassName}>{t(router.hint)}</p>
    </div>
  )
}

export default function RoutingInstanceFields(props: RoutingFieldsProps) {
  return <div className="flex flex-col gap-3">{ROUTERS.map(router => <RoutingUrlField key={router.key} router={router} {...props} />)}</div>
}
