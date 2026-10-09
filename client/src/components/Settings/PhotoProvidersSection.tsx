import React from 'react'
import { Camera, Loader2, Plug, Save } from 'lucide-react'
import { useTranslation } from '../../i18n'
import Section from './Section'
import ToggleSwitch from './ToggleSwitch'
import { SETTINGS_BUTTON, SETTINGS_BUTTON_PRIMARY, SettingRow, SettingRows, StatusPill } from './settingsKit'
import { EditorField, INPUT } from '../shared/dialogParts'
import { fs } from '../shared/DialogShell'
import { Tooltip } from '../shared/Tooltip'
import {
  getProviderConfig,
  getProviderFields,
  usePhotoProviderConnections,
  type PhotoProviderAddon,
} from './usePhotoProviderConnections'

export default function PhotoProvidersSection(): React.ReactElement {
  const { t } = useTranslation()
  const {
    memoriesEnabled,
    activePhotoProviders,
    providerValues,
    providerConnected,
    providerTesting,
    saving,
    handleProviderFieldChange,
    isProviderSaveDisabled,
    handleSaveProvider,
    handleTestProvider,
  } = usePhotoProviderConnections()

  const renderPhotoProviderSection = (provider: PhotoProviderAddon): React.ReactElement => {
    const fields = getProviderFields(provider)
    const cfg = getProviderConfig(provider)
    const values = providerValues[provider.id] || {}
    const connected = !!providerConnected[provider.id]
    const testing = !!providerTesting[provider.id]
    const canSave = !!cfg.settings_put
    const canTest = !!(cfg.test_post || cfg.test_get || cfg.status_get)

    const saveDisabledReason = !canSave
      ? t('memories.saveRouteNotConfigured')
      : isProviderSaveDisabled(provider) ? t('memories.fillRequiredFields') : ''
    const fieldId = (key: string) => `photo-provider-${provider.id}-${key}`
    // Text fields stack on top, the switches gather in one box of rows below them.
    const textFields = fields.filter(field => field.input_type !== 'checkbox')
    const switchFields = fields.filter(field => field.input_type === 'checkbox')

    return (
      <Section
        key={provider.id}
        title={provider.name || provider.id}
        icon={Camera}
        badge={
          <StatusPill tone={connected ? 'success' : 'neutral'} icon={<span className="h-1.5 w-1.5 rounded-full bg-current" />}>
            {connected ? t('memories.connected') : t('memories.disconnected')}
          </StatusPill>
        }
      >
        {textFields.length > 0 && (
          <div className="flex flex-col gap-3">
            {textFields.map(field => (
              <EditorField
                key={`${provider.id}-${field.key}`}
                label={t(`memories.${field.label}`)}
                htmlFor={fieldId(field.key)}
                hint={field.hint ? t(`memories.${field.hint}`) : undefined}
              >
                <input
                  id={fieldId(field.key)}
                  type={field.input_type || 'text'}
                  value={values[field.key] || ''}
                  onChange={e => handleProviderFieldChange(provider.id, field.key, e.target.value)}
                  placeholder={field.secret && connected && !(values[field.key] || '') ? '••••••••' : (field.placeholder || '')}
                  className={INPUT}
                />
              </EditorField>
            ))}
          </div>
        )}

        {switchFields.length > 0 && (
          <SettingRows>
            {switchFields.map(field => (
              <SettingRow
                key={`${provider.id}-${field.key}`}
                label={t(`memories.${field.label}`)}
                hint={field.hint ? t(`memories.${field.hint}`) : undefined}
                control={
                  <ToggleSwitch
                    on={values[field.key] === 'true'}
                    onToggle={() => handleProviderFieldChange(provider.id, field.key, values[field.key] === 'true' ? 'false' : 'true')}
                    label={t(`memories.${field.label}`)}
                  />
                }
              />
            ))}
          </SettingRows>
        )}

        <div className="flex flex-wrap items-center gap-2" style={fs(13, 'body')}>
          {/* The span carries the tooltip: a disabled button gets no pointer events. */}
          <Tooltip label={saveDisabledReason} placement="top">
            <span className="inline-flex">
              <button type="button"
                onClick={() => handleSaveProvider(provider)}
                disabled={!canSave || !!saving[provider.id] || isProviderSaveDisabled(provider)}
                className={SETTINGS_BUTTON_PRIMARY}
              >
                <Save size={14} strokeWidth={2.2} /> {t('common.save')}
              </button>
            </span>
          </Tooltip>
          <Tooltip label={!canTest ? t('memories.testRouteNotConfigured') : ''} placement="top">
            <span className="inline-flex">
              <button type="button"
                onClick={() => handleTestProvider(provider)}
                disabled={!canTest || testing}
                className={SETTINGS_BUTTON}
              >
                {testing
                  ? <Loader2 size={14} strokeWidth={2.2} className="animate-spin" />
                  : <Plug size={14} strokeWidth={2.2} />}
                {t('memories.testConnection')}
              </button>
            </span>
          </Tooltip>
        </div>
      </Section>
    )
  }

  if (!memoriesEnabled) {
    return <></>
  }

  return <>{activePhotoProviders.map(provider => renderPhotoProviderSection(provider))}</>
}
