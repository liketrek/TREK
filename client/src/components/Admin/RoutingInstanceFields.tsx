import { useId, useState } from 'react'
import type { ValhallaProvider } from '@trek/shared'
import { useTranslation } from '../../i18n/TranslationContext'
import { fs } from '../shared/DialogShell'
import { INPUT, LABEL } from '../shared/dialogParts'

export interface RoutingDefaults {
  routing_base_url?: string
  valhalla_base_url?: string
  routing_valhalla_provider?: ValhallaProvider
}

interface RoutingFieldsProps {
  defaults: RoutingDefaults
  onSave: (patch: RoutingDefaults) => Promise<void>
  onReset: (key: keyof RoutingDefaults) => Promise<void>
  /**
   * The phone's hint look. A caller that passes it keeps the phone's own field
   * styling as well; without it the fields take the desktop editors' look
   * (eyebrow label, boxed input, faint hint).
   */
  hintClassName?: string
}

const ROUTERS = [
  { key: 'routing_base_url', label: 'settings.routingBase', hint: 'settings.routingBaseHint', placeholder: 'https://osrm.example.org' },
  { key: 'valhalla_base_url', label: 'settings.valhallaBase', hint: 'settings.valhallaBaseHint', placeholder: 'https://valhalla.example.org' },
] as const

// '' is no choice of the admin: the instance then decides as before the choice existed.
const PROVIDERS = [
  { value: '', labelKey: 'settings.valhallaProviderOption.auto' },
  { value: 'trek', labelKey: 'settings.valhallaProviderOption.trek' },
  { value: 'fossgis', labelKey: 'settings.valhallaProviderOption.fossgis' },
  { value: 'custom', labelKey: 'settings.valhallaProviderOption.custom' },
] as const

// The phone screen's look, unchanged: MAdminDefaultUserSettings passes its own hint class.
const PHONE = {
  wrap: 'min-w-0 space-y-1.5',
  head: 'flex flex-wrap items-baseline gap-x-2 gap-y-1',
  label: 'text-body font-medium text-content-secondary',
  reset: 'text-caption text-content-muted underline disabled:opacity-50',
  input: 'min-h-11 w-full min-w-0 rounded-lg border border-edge bg-surface-input px-3 py-2 text-body text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50',
}

// The desktop editors' look (shared/dialogParts): an eyebrow over a boxed field.
const DESKTOP = {
  wrap: 'min-w-0',
  head: 'flex flex-wrap items-baseline justify-between gap-x-2',
  label: LABEL,
  reset: 'mb-[5px] rounded-full font-medium text-content-muted underline-offset-2 hover:text-content hover:underline disabled:opacity-50',
  input: INPUT,
}

function FieldHint({ id, text, hintClassName }: { id: string; text: string; hintClassName?: string }) {
  return hintClassName !== undefined
    ? <p id={id} className={hintClassName}>{text}</p>
    : <p id={id} className="m-0 mt-1 leading-normal text-content-faint" style={fs(11)}>{text}</p>
}

function RoutingUrlField({ router, defaults, onSave, onReset, hintClassName }: RoutingFieldsProps & { router: typeof ROUTERS[number] }) {
  const { t } = useTranslation()
  const id = useId()
  const [draft, setDraft] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const phone = hintClassName !== undefined
  const look = phone ? PHONE : DESKTOP
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
    <div className={`${look.wrap} ${!phone && saving ? 'opacity-60' : ''}`} aria-busy={saving}>
      <div className={look.head}>
        <label htmlFor={id} className={look.label}>{t(router.label)}</label>
        {defaults[router.key] !== undefined && (
          <button type="button" disabled={saving} onClick={reset} className={look.reset} style={phone ? undefined : fs(11)}>
            {t('admin.defaultSettings.resetToBuiltIn')}
          </button>
        )}
      </div>
      <input id={id} type="url" inputMode="url" value={draft ?? saved} disabled={saving}
        onChange={e => setDraft(e.target.value)} onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
        placeholder={router.placeholder} spellCheck={false} autoComplete="off" autoCapitalize="none"
        aria-describedby={`${id}-hint`}
        className={look.input}
      />
      <FieldHint id={`${id}-hint`} text={t(router.hint)} hintClassName={hintClassName} />
    </div>
  )
}

/** Which Valhalla answers what OSRM cannot; picking "automatic" clears the choice. */
function RoutingProviderField({ defaults, onSave, onReset, hintClassName }: RoutingFieldsProps) {
  const { t } = useTranslation()
  const id = useId()
  const [saving, setSaving] = useState(false)
  const phone = hintClassName !== undefined
  const look = phone ? PHONE : DESKTOP
  const pick = async (value: string) => {
    setSaving(true)
    try {
      if (value === '') await onReset('routing_valhalla_provider')
      else await onSave({ routing_valhalla_provider: value as ValhallaProvider })
    } finally { setSaving(false) }
  }
  return (
    <div className={`${look.wrap} ${!phone && saving ? 'opacity-60' : ''}`} aria-busy={saving}>
      <div className={look.head}>
        <label htmlFor={id} className={look.label}>{t('settings.valhallaProvider')}</label>
      </div>
      <select id={id} value={defaults.routing_valhalla_provider ?? ''} disabled={saving}
        onChange={e => void pick(e.target.value)} aria-describedby={`${id}-hint`} className={look.input}>
        {PROVIDERS.map(option => <option key={option.value} value={option.value}>{t(option.labelKey)}</option>)}
      </select>
      <FieldHint id={`${id}-hint`} text={t('settings.valhallaProviderHint')} hintClassName={hintClassName} />
    </div>
  )
}

export default function RoutingInstanceFields(props: RoutingFieldsProps) {
  const phone = props.hintClassName !== undefined
  return (
    <div className={phone ? 'flex flex-col gap-3' : 'flex flex-col gap-4'}>
      <RoutingProviderField {...props} />
      {ROUTERS.map(router => <RoutingUrlField key={router.key} router={router} {...props} />)}
    </div>
  )
}
