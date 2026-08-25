import React, { useEffect, useMemo, useState } from 'react'
import { Camera, Save } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { useToast } from '../../components/shared/Toast'
import apiClient from '../../api/client'
import { useAddonStore } from '../../store/addonStore'
import Section from './Section'
import ToggleSwitch from './ToggleSwitch'

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

export default function PhotoProvidersSection(): React.ReactElement {
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
      // Only a POST probe carries the form values. A provider that declares just a
      // GET (test_get / status_get) is probed against its saved credentials.
      const res = cfg.test_post
        ? await apiClient.post(testPath, buildProviderPayload(provider))
        : await apiClient.get(testPath)
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
      <Section key={provider.id} title={provider.name || provider.id} icon={Camera}>
        <div className="space-y-3">
          {fields.map(field => (
            <div key={`${provider.id}-${field.key}`}>
              {field.input_type === 'checkbox' ? (
                <div className="flex items-center gap-3">
                  <ToggleSwitch
                    on={values[field.key] === 'true'}
                    onToggle={() => handleProviderFieldChange(provider.id, field.key, values[field.key] === 'true' ? 'false' : 'true')}
                  />
                  <span className="text-sm font-medium text-slate-700">{t(`memories.${field.label}`)}</span>
                </div>
              ) : (
                <>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t(`memories.${field.label}`)}</label>
                  <input
                    type={field.input_type || 'text'}
                    value={values[field.key] || ''}
                    onChange={e => handleProviderFieldChange(provider.id, field.key, e.target.value)}
                    placeholder={field.secret && connected && !(values[field.key] || '') ? '••••••••' : (field.placeholder || '')}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                  {field.hint && (
                    <p className="mt-1 text-xs text-slate-500">{t(`memories.${field.hint}`)}</p>
                  )}
                </>
              )}
            </div>
          ))}
          {/* Wraps on mobile so the connection badge drops to its own row
              instead of clipping off the side of the card. */}
          <div className="flex flex-wrap items-center gap-3">
            <button type="button"
              onClick={() => handleSaveProvider(provider)}
              disabled={!canSave || !!saving[provider.id] || isProviderSaveDisabled(provider)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-700 disabled:bg-slate-400"
              title={!canSave ? t('memories.saveRouteNotConfigured') : isProviderSaveDisabled(provider) ? t('memories.fillRequiredFields') : ''}
            >
              <Save className="w-4 h-4" /> {t('common.save')}
            </button>
            <button type="button"
              onClick={() => handleTestProvider(provider)}
              disabled={!canTest || testing}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50"
              title={!canTest ? t('memories.testRouteNotConfigured') : ''}
            >
              {testing
                ? <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
                : <Camera className="w-4 h-4" />}
              <span className="sm:hidden">{t('memories.testShort')}</span>
              <span className="hidden sm:inline">{t('memories.testConnection')}</span>
            </button>
            {/* On mobile the badge sits on its own row thanks to flex-wrap, so force a line break via basis-full. */}
            {connected ? (
              <span className="basis-full sm:basis-auto text-xs font-medium text-green-600 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                {t('memories.connected')}
              </span>
            ) : (
              <span className="basis-full sm:basis-auto text-xs font-medium text-slate-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-slate-300 rounded-full" />
                {t('memories.disconnected')}
              </span>
            )}
          </div>
        </div>
      </Section>
    )
  }

  if (!memoriesEnabled) {
    return <></>
  }

  return <>{activePhotoProviders.map(provider => renderPhotoProviderSection(provider))}</>
}
