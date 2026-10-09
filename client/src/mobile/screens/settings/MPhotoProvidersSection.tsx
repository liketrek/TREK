import React from 'react'
import { Camera, Save, RefreshCw } from 'lucide-react'
import { useTranslation } from '../../../i18n'
import { MSetCard, MSetEyebrow, MSetRow, MSetInput, MSetButton, MSetHint } from './MSettingsUi'
import MToggle from '../../components/MToggle'
import {
  getProviderConfig,
  getProviderFields,
  usePhotoProviderConnections,
  type PhotoProviderAddon,
} from '../../../components/Settings/usePhotoProviderConnections'

/**
 * Mobile-native twin of components/Settings/PhotoProvidersSection. Same logic
 * (dynamic photo-provider addon fields, seed/hydrate values, save + test with a
 * connection badge, secret fields never prefilled), rebuilt on the MSet* card
 * system with MToggle switches. Presentation only — the behaviour is identical.
 */

export default function MPhotoProvidersSection(): React.ReactElement {
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
  } = usePhotoProviderConnections({ statusRouteOwnsBadge: true })

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
