import React, { useEffect, useMemo, useState } from 'react'
import { Camera, Save, RefreshCw } from 'lucide-react'
import { useTranslation } from '../../../i18n'
import { useToast } from '../../../components/shared/Toast'
import apiClient from '../../../api/client'
import { useAddonStore } from '../../../store/addonStore'
import { MSetCard, MSetEyebrow, MSetRow, MSetInput, MSetButton, MSetHint } from './MSettingsUi'
import MToggle from '../../components/MToggle'

/**
 * Mobile-native twin of components/Settings/PhotoProvidersSection. Same logic
 * (dynamic photo-provider addon fields, seed/hydrate values, save + test with a
 * connection badge, secret fields never prefilled), rebuilt on the MSet* card
 * system with MToggle switches. Presentation only — the behaviour is identical.
 */

interface ProviderField {
  key: string
  label: string
  input_type: string
  placeholder?: string | null
  hint?: string | null
  required: boolean
  secret: boolean
  settings_key?: string | null
  payload_key?: string | null
  sort_order: number
}

interface PhotoProviderAddon {
  id: string
  name: string
  type: string
  enabled: boolean
  config?: Record<string, unknown>
  fields?: ProviderField[]
}

interface ProviderConfig {
  settings_get?: string
  settings_put?: string
  status_get?: string
  test_get?: string
  test_post?: string
}

const getProviderConfig = (provider: PhotoProviderAddon): ProviderConfig => {
  const raw = provider.config || {}
  return {
    settings_get: typeof raw.settings_get === 'string' ? raw.settings_get : undefined,
    settings_put: typeof raw.settings_put === 'string' ? raw.settings_put : undefined,
    status_get: typeof raw.status_get === 'string' ? raw.status_get : undefined,
    test_get: typeof raw.test_get === 'string' ? raw.test_get : undefined,
    test_post: typeof raw.test_post === 'string' ? raw.test_post : undefined,
  }
}

const getProviderFields = (provider: PhotoProviderAddon): ProviderField[] => {
  return [...(provider.fields || [])].sort((a, b) => a.sort_order - b.sort_order)
}

export default function MPhotoProvidersSection(): React.ReactElement {
  const { t } = useTranslation()
  const toast = useToast()
  const { isEnabled: addonEnabled, addons } = useAddonStore()
  const memoriesEnabled = addonEnabled('memories')

  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [providerValues, setProviderValues] = useState<Record<string, Record<string, string>>>({})
  const [providerConnected, setProviderConnected] = useState<Record<string, boolean>>({})
  const [providerTesting, setProviderTesting] = useState<Record<string, boolean>>({})

  const activePhotoProviders = useMemo(
    () => addons.filter(a => a.type === 'photo_provider' && a.enabled) as PhotoProviderAddon[],
    [addons],
  )

  const buildProviderPayload = (provider: PhotoProviderAddon): Record<string, unknown> => {
    const values = providerValues[provider.id] || {}
    const payload: Record<string, unknown> = {}
    for (const field of getProviderFields(provider)) {
      const payloadKey = field.payload_key || field.settings_key || field.key
      if (field.input_type === 'checkbox') {
        payload[payloadKey] = values[field.key] === 'true'
        continue
      }
      const value = (values[field.key] || '').trim()
      if (field.secret && !value) continue
      payload[payloadKey] = value
    }
    return payload
  }

  const refreshProviderConnection = async (provider: PhotoProviderAddon) => {
    const cfg = getProviderConfig(provider)
    const statusPath = cfg.status_get
    if (!statusPath) return
    try {
      const res = await apiClient.get(statusPath)
      setProviderConnected(prev => ({ ...prev, [provider.id]: !!res.data?.connected }))
    } catch {
      setProviderConnected(prev => ({ ...prev, [provider.id]: false }))
    }
  }

  const activeProviderSignature = useMemo(
    () => activePhotoProviders.map(provider => provider.id).join('|'),
    [activePhotoProviders],
  )

  useEffect(() => {
    let isCancelled = false

    for (const provider of activePhotoProviders) {
      const cfg = getProviderConfig(provider)
      const fields = getProviderFields(provider)

      // Seed checkbox defaults before the async settings load resolves
      const checkboxDefaults: Record<string, string> = {}
      for (const field of fields) {
        if (field.input_type === 'checkbox') checkboxDefaults[field.key] = 'false'
      }
      if (Object.keys(checkboxDefaults).length > 0) {
        setProviderValues(prev => ({
          ...prev,
          [provider.id]: { ...checkboxDefaults, ...(prev[provider.id] || {}) },
        }))
      }

      if (cfg.settings_get) {
        apiClient.get(cfg.settings_get).then(res => {
          if (isCancelled) return

          const nextValues: Record<string, string> = {}
          for (const field of fields) {
            // Do not prefill secret fields; user can overwrite only when needed.
            if (field.secret) continue
            const sourceKey = field.settings_key || field.payload_key || field.key
            const rawValue = (res.data as Record<string, unknown>)[sourceKey]
            if (rawValue != null) {
              nextValues[field.key] = typeof rawValue === 'string' ? rawValue : String(rawValue)
            } else if (field.input_type === 'checkbox') {
              nextValues[field.key] = 'false'
            } else {
              nextValues[field.key] = ''
            }
          }
          setProviderValues(prev => ({
            ...prev,
            [provider.id]: { ...(prev[provider.id] || {}), ...nextValues },
          }))
          if (typeof res.data?.connected === 'boolean') {
            setProviderConnected(prev => ({ ...prev, [provider.id]: !!res.data.connected }))
          }
        }).catch(() => { })
      }

      refreshProviderConnection(provider).catch(() => { })
    }

    return () => {
      isCancelled = true
    }
  }, [activePhotoProviders, activeProviderSignature])

  const handleProviderFieldChange = (providerId: string, key: string, value: string) => {
    setProviderValues(prev => ({
      ...prev,
      [providerId]: { ...(prev[providerId] || {}), [key]: value },
    }))
  }

  const isProviderSaveDisabled = (provider: PhotoProviderAddon): boolean => {
    const values = providerValues[provider.id] || {}
    return getProviderFields(provider).some(field => {
      if (!field.required) return false
      return !(values[field.key] || '').trim()
    })
  }

  const handleSaveProvider = async (provider: PhotoProviderAddon) => {
    const cfg = getProviderConfig(provider)
    if (!cfg.settings_put) return
    setSaving(s => ({ ...s, [provider.id]: true }))
    try {
      await apiClient.put(cfg.settings_put, buildProviderPayload(provider))
      await refreshProviderConnection(provider)
      toast.success(t('memories.saved', { provider_name: provider.name }))
    } catch {
      toast.error(t('memories.saveError', { provider_name: provider.name }))
    } finally {
      setSaving(s => ({ ...s, [provider.id]: false }))
    }
  }

  const handleTestProvider = async (provider: PhotoProviderAddon) => {
    const cfg = getProviderConfig(provider)
    const testPath = cfg.test_post || cfg.test_get || cfg.status_get
    if (!testPath) return
    setProviderTesting(prev => ({ ...prev, [provider.id]: true }))
    try {
      const payload = buildProviderPayload(provider)
      const res = cfg.test_post ? await apiClient.post(testPath, payload) : await apiClient.get(testPath)
      const ok = !!res.data?.connected
      setProviderConnected(prev => ({ ...prev, [provider.id]: ok }))
      if (ok) {
        toast.success(t('memories.connectionSuccess', { provider_name: provider.name }))
      } else {
        toast.error(`${t('memories.connectionError', { provider_name: provider.name })} ${res.data?.error ? `: ${String(res.data.error)}` : ''}`)
      }
    } catch {
      toast.error(t('memories.connectionError', { provider_name: provider.name }))
    } finally {
      setProviderTesting(prev => ({ ...prev, [provider.id]: false }))
    }
  }

  const renderPhotoProviderSection = (provider: PhotoProviderAddon): React.ReactElement => {
    const fields = getProviderFields(provider)
    const cfg = getProviderConfig(provider)
    const values = providerValues[provider.id] || {}
    const connected = !!providerConnected[provider.id]
    const testing = !!providerTesting[provider.id]
    const canSave = !!cfg.settings_put
    const canTest = !!(cfg.test_post || cfg.test_get || cfg.status_get)

    return (
      <MSetCard key={provider.id} title={provider.name || provider.id} icon={Camera} className="mt-3 first:mt-0">
        {fields.map((field, i) => (
          field.input_type === 'checkbox' ? (
            <MSetRow
              key={`${provider.id}-${field.key}`}
              first={i === 0}
              label={t(`memories.${field.label}`)}
              trailing={
                <MToggle
                  checked={values[field.key] === 'true'}
                  onChange={() => handleProviderFieldChange(provider.id, field.key, values[field.key] === 'true' ? 'false' : 'true')}
                  ariaLabel={t(`memories.${field.label}`)}
                />
              }
            />
          ) : (
            <div key={`${provider.id}-${field.key}`}>
              <MSetEyebrow className={`mb-[5px] ${i === 0 ? '' : 'mt-[14px]'}`}>{t(`memories.${field.label}`)}</MSetEyebrow>
              <MSetInput
                type={field.input_type || 'text'}
                value={values[field.key] || ''}
                onChange={e => handleProviderFieldChange(provider.id, field.key, e.target.value)}
                placeholder={field.secret && connected && !(values[field.key] || '') ? '••••••••' : (field.placeholder || '')}
              />
              {field.hint && <MSetHint>{t(`memories.${field.hint}`)}</MSetHint>}
            </div>
          )
        ))}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <MSetButton
            variant="primary"
            onClick={() => handleSaveProvider(provider)}
            disabled={!canSave || !!saving[provider.id] || isProviderSaveDisabled(provider)}
          >
            <Save size={14} /> {t('common.save')}
          </MSetButton>
          <MSetButton
            variant="ghost"
            onClick={() => handleTestProvider(provider)}
            disabled={!canTest || testing}
          >
            {testing ? <RefreshCw size={14} className="animate-spin" /> : <Camera size={14} />}
            {t('memories.testShort')}
          </MSetButton>
          {connected ? (
            <span className="inline-flex items-center gap-[6px] font-geist text-[0.6875rem] font-bold text-[color:var(--m-st-confirmed)]">
              <span className="h-2 w-2 rounded-full bg-[color:var(--m-st-confirmed)]" />
              {t('memories.connected')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-[6px] font-geist text-[0.6875rem] font-bold text-m-faint">
              <span className="h-2 w-2 rounded-full bg-[color:var(--m-trackoff)]" />
              {t('memories.disconnected')}
            </span>
          )}
        </div>
      </MSetCard>
    )
  }

  if (!memoriesEnabled) {
    return <></>
  }

  return <>{activePhotoProviders.map(provider => renderPhotoProviderSection(provider))}</>
}
