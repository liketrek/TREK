import { useState } from 'react'
import { AlertTriangle, ChevronDown, RefreshCw } from 'lucide-react'
import { adminApi, authApi } from '../../../api/client'
import { getApiErrorMessage } from '../../../types'
import type { TranslationFn } from '../../../types'
import type { useAdmin } from '../../../pages/admin/useAdmin'
import MToggle from '../../components/MToggle'
import { MBlockDisclosure, MProviderBlock, MTrekApiBlock } from './MApiProviderBlocks'
import MSetPickerSheet from '../settings/MSetPickerSheet'
import {
  MAdminButton,
  MAdminCard,
  MAdminCardHead,
  MAdminField,
  MAdminInput,
  MAdminRow,
  MAdminSecretInput,
} from './MAdminUi'

interface MAdminSettingsSectionProps {
  admin: ReturnType<typeof useAdmin>
  t: TranslationFn
}

// Settings section: auth methods, passkey login, require-MFA, allowed file
// types, API keys, OIDC and the danger zone — the full desktop settings tab
// relaid as mobile cards. All state and mutations come from useAdmin.
export default function MAdminSettingsSection({ admin, t }: MAdminSettingsSectionProps) {
  const [providerPickerOpen, setProviderPickerOpen] = useState(false)
  const {
    toast,
    setPlacesPhotosEnabled, setPlacesAutocompleteEnabled, setPlacesDetailsEnabled, setPlacesEnrichEnabled, setPlaceShadowEnabled,
    placesPhotosEnabled, setPlacesPhotosEnabledState,
    placesAutocompleteEnabled, setPlacesAutocompleteEnabledState,
    placesDetailsEnabled, setPlacesDetailsEnabledState,
    placesEnrichEnabled, setPlacesEnrichEnabledState,
    placeShadowEnabled, setPlaceShadowEnabledState,
    oidcConfig, setOidcConfig, savingOidc, setSavingOidc,
    passwordLogin, setPasswordLogin, passwordRegistration, setPasswordRegistration,
    oidcLogin, setOidcLogin, oidcRegistration, setOidcRegistration,
    envOverrideOidcOnly, oidcConfigured, requireMfa,
    passkeyLogin, setPasskeyLogin, passkeyConfigured,
    webauthnRpId, setWebauthnRpId, webauthnOrigins, setWebauthnOrigins, savingWebauthn, handleSaveWebauthn,
    allowedFileTypes, setAllowedFileTypes, savingFileTypes, setSavingFileTypes,
    mapsKey, setMapsKey, unsplashKey, setUnsplashKey, amapKey, setAmapKey, hasMapsKey, hasAmapKey, savingKeys, validating, validation,
    placesProvider, savingPlacesProvider, handleSavePlacesProvider,
    managed,
    setShowRotateJwtModal,
    handleToggleAuthSetting, handleToggleRequireMfa,
    handleSaveApiKeys, handleValidateKey,
  } = admin

  const saveFileTypes = async () => {
    setSavingFileTypes(true)
    try {
      await authApi.updateAppSettings({ allowed_file_types: allowedFileTypes })
      toast.success(t('admin.fileTypesSaved'))
    } catch {
      toast.error(t('common.error'))
    } finally {
      setSavingFileTypes(false)
    }
  }

  const saveOidc = async () => {
    setSavingOidc(true)
    try {
      const payload: Record<string, unknown> = {
        issuer: oidcConfig.issuer,
        client_id: oidcConfig.client_id,
        display_name: oidcConfig.display_name,
        discovery_url: oidcConfig.discovery_url,
      }
      if (oidcConfig.client_secret) payload.client_secret = oidcConfig.client_secret
      await adminApi.updateOidc(payload)
      toast.success(t('admin.oidcSaved'))
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('common.error')))
    } finally {
      setSavingOidc(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Authentication methods */}
      <MAdminCard>
        <MAdminCardHead title={t('admin.authMethods')} />
        {envOverrideOidcOnly && (
          <p className="mb-2 rounded-xl border border-[color:color-mix(in_srgb,var(--m-st-pending)_28%,transparent)] bg-[color:color-mix(in_srgb,var(--m-st-pending)_10%,transparent)] px-3 py-2 font-geist text-[0.625rem] leading-relaxed text-m-ink">
            {t('admin.envOverrideHint')}
          </p>
        )}
        <MAdminRow
          title={t('admin.passwordLogin')}
          hint={t('admin.passwordLoginHint')}
          trailing={
            <MToggle
              checked={passwordLogin}
              disabled={envOverrideOidcOnly || (!passwordLogin && !oidcLogin)}
              ariaLabel={t('admin.passwordLogin')}
              onChange={(v) => handleToggleAuthSetting('password_login', v, setPasswordLogin)}
            />
          }
        />
        <MAdminRow
          title={t('admin.passwordRegistration')}
          hint={t('admin.passwordRegistrationHint')}
          trailing={
            <MToggle
              checked={passwordRegistration}
              disabled={envOverrideOidcOnly}
              ariaLabel={t('admin.passwordRegistration')}
              onChange={(v) => handleToggleAuthSetting('password_registration', v, setPasswordRegistration)}
            />
          }
        />
        {oidcConfigured && (
          <MAdminRow
            title={t('admin.oidcLogin')}
            hint={t('admin.oidcLoginHint')}
            trailing={
              <MToggle
                checked={oidcLogin}
                disabled={!passwordLogin && oidcLogin}
                ariaLabel={t('admin.oidcLogin')}
                onChange={(v) => handleToggleAuthSetting('oidc_login', v, setOidcLogin)}
              />
            }
          />
        )}
        {oidcConfigured && (
          <MAdminRow
            title={t('admin.oidcRegistration')}
            hint={t('admin.oidcRegistrationHint')}
            trailing={
              <MToggle
                checked={oidcRegistration}
                ariaLabel={t('admin.oidcRegistration')}
                onChange={(v) => handleToggleAuthSetting('oidc_registration', v, setOidcRegistration)}
              />
            }
          />
        )}
      </MAdminCard>

      {/* Passkey login */}
      <MAdminCard>
        <MAdminCardHead title={t('admin.passkey.title')} hint={t('admin.passkey.cardHint')} />
        <MAdminRow
          title={t('admin.passkey.login')}
          hint={t('admin.passkey.loginHint')}
          trailing={
            <MToggle
              checked={passkeyLogin}
              ariaLabel={t('admin.passkey.login')}
              onChange={(v) => handleToggleAuthSetting('passkey_login', v, setPasskeyLogin)}
            />
          }
        />
        {passkeyLogin && !passkeyConfigured && (
          <p className="mb-3 flex items-start gap-2 rounded-xl border border-[color:color-mix(in_srgb,var(--m-st-pending)_28%,transparent)] bg-[color:color-mix(in_srgb,var(--m-st-pending)_10%,transparent)] px-3 py-2 font-geist text-[0.625rem] leading-relaxed text-m-ink">
            <AlertTriangle size={14} className="mt-[1px] flex-none text-[color:var(--m-st-pending)]" />
            {t('admin.passkey.notConfigured')}
          </p>
        )}
        <div className="space-y-3">
          <MAdminField label={t('admin.passkey.rpId')} hint={t('admin.passkey.rpIdHint')}>
            <MAdminInput
              type="text"
              value={webauthnRpId}
              onChange={(e) => setWebauthnRpId(e.target.value)}
              placeholder="trek.example.org"
            />
          </MAdminField>
          <MAdminField label={t('admin.passkey.origins')} hint={t('admin.passkey.originsHint')}>
            <MAdminInput
              type="text"
              value={webauthnOrigins}
              onChange={(e) => setWebauthnOrigins(e.target.value)}
              placeholder="https://trek.example.org"
            />
          </MAdminField>
          <MAdminButton busy={savingWebauthn} onClick={handleSaveWebauthn}>
            {t('common.save')}
          </MAdminButton>
        </div>
      </MAdminCard>

      {/* Require 2FA */}
      <MAdminCard>
        <MAdminRow
          first
          title={t('admin.requireMfa')}
          hint={t('admin.requireMfaHint')}
          trailing={
            <MToggle checked={requireMfa} ariaLabel={t('admin.requireMfa')} onChange={handleToggleRequireMfa} />
          }
        />
      </MAdminCard>

      {/* Allowed file types */}
      <MAdminCard>
        <MAdminCardHead title={t('admin.fileTypes')} hint={t('admin.fileTypesHint')} />
        <div className="space-y-3">
          <MAdminField label={t('admin.fileTypes')} hint={t('admin.fileTypesFormat')}>
            <MAdminInput
              type="text"
              value={allowedFileTypes}
              onChange={(e) => setAllowedFileTypes(e.target.value)}
              placeholder="jpg,png,pdf,doc,docx,xls,xlsx,txt,csv"
            />
          </MAdminField>
          <MAdminButton busy={savingFileTypes} onClick={saveFileTypes}>
            {t('common.save')}
          </MAdminButton>
        </div>
      </MAdminCard>

      {/* API keys */}
      <MAdminCard>
        <MAdminCardHead title={t('admin.apiKeys')} hint={t('admin.apiKeysHint')} />
        <div className="space-y-3">
          {/* Comparable blocks in the order we would have somebody choose them,
              matching the desktop tab: the free source first, the keys after it.
              The recommendation used to sit on the Google field here, which told
              a phone admin the opposite of what the same setting says on a
              laptop. */}
          <MTrekApiBlock />

          {/* The keys belong to the operator on a managed install, same as on the
              desktop tab; the provider choice below stays the admin's. */}
          {!managed && (<>
          <MProviderBlock title={t('admin.mapsKey')} badge={t('admin.googleCaveat.badge')} tone="caution">
            {/* Said before the field, not after it: somebody about to paste a key
                should read this while deciding, not once they already have. */}
            <p className="font-geist text-[0.625rem] leading-relaxed text-m-faint">
              {t('admin.mapsKeyHintShort')}
            </p>
            <div className="flex gap-2">
              <div className="min-w-0 flex-1">
                <MAdminSecretInput
                  aria-label={t('admin.mapsKey')}
                  value={mapsKey}
                  onChange={(e) => setMapsKey(e.target.value)}
                  placeholder={t('settings.keyPlaceholder')}
                />
              </div>
              <MAdminButton
                variant="ghost"
                disabled={!mapsKey}
                busy={!!validating.maps}
                onClick={() => handleValidateKey('maps')}
                className="h-[42px]"
              >
                {t('admin.validateKey')}
              </MAdminButton>
            </div>
            {validation.maps === true && (
              <p className="font-geist text-[0.625rem] font-bold text-[color:var(--m-st-confirmed)]">
                {t('admin.keyValid')}
              </p>
            )}
            {validation.maps === false && (
              <p className="font-geist text-[0.625rem] font-bold text-[color:var(--m-st-danger)]">
                {t('admin.keyInvalid')}
              </p>
            )}
            {/* What the key is allowed to be spent on. Under the key rather than
                loose at the foot of the card: every one of them is a Google
                request, and none of them mean anything without it. */}
            <MBlockDisclosure label={t('admin.placesUsageTitle')}>
            <MAdminRow
              title={t('admin.placesPhotos.title')}
              hint={t('admin.placesPhotos.subtitle')}
              trailing={
                <MToggle
                  checked={placesPhotosEnabled}
                  ariaLabel={t('admin.placesPhotos.title')}
                  onChange={async (next) => {
                    setPlacesPhotosEnabledState(next)
                    setPlacesPhotosEnabled(next)
                    try {
                      await adminApi.updatePlacesPhotos(next)
                    } catch {
                      setPlacesPhotosEnabledState(!next)
                      setPlacesPhotosEnabled(!next)
                    }
                  }}
                />
              }
            />
            <MAdminRow
              title={t('admin.placesAutocomplete.title')}
              hint={t('admin.placesAutocomplete.subtitle')}
              trailing={
                <MToggle
                  checked={placesAutocompleteEnabled}
                  ariaLabel={t('admin.placesAutocomplete.title')}
                  onChange={async (next) => {
                    setPlacesAutocompleteEnabledState(next)
                    setPlacesAutocompleteEnabled(next)
                    try {
                      await adminApi.updatePlacesAutocomplete(next)
                    } catch {
                      setPlacesAutocompleteEnabledState(!next)
                      setPlacesAutocompleteEnabled(!next)
                    }
                  }}
                />
              }
            />
            <MAdminRow
              title={t('admin.placesDetails.title')}
              hint={t('admin.placesDetails.subtitle')}
              trailing={
                <MToggle
                  checked={placesDetailsEnabled}
                  ariaLabel={t('admin.placesDetails.title')}
                  onChange={async (next) => {
                    setPlacesDetailsEnabledState(next)
                    setPlacesDetailsEnabled(next)
                    try {
                      await adminApi.updatePlacesDetails(next)
                    } catch {
                      setPlacesDetailsEnabledState(!next)
                      setPlacesDetailsEnabled(!next)
                    }
                  }}
                />
              }
            />
            <MAdminRow
              title={t('admin.placesEnrich.title')}
              hint={t('admin.placesEnrich.subtitle')}
              trailing={
                <MToggle
                  checked={placesEnrichEnabled}
                  ariaLabel={t('admin.placesEnrich.title')}
                  onChange={async (next) => {
                    setPlacesEnrichEnabledState(next)
                    setPlacesEnrichEnabled(next)
                    try {
                      await adminApi.updatePlacesEnrich(next)
                    } catch {
                      setPlacesEnrichEnabledState(!next)
                      setPlacesEnrichEnabled(!next)
                    }
                  }}
                />
              }
            />
            </MBlockDisclosure>
          </MProviderBlock>

          {/* No Test button, same as the desktop tab: /auth/validate-keys only
              knows how to probe Google Places and OpenWeatherMap. */}
          <MProviderBlock title={t('admin.amapKey')}>
            <p className="font-geist text-[0.625rem] leading-relaxed text-m-faint">{t('admin.amapKeyHintShort')}</p>
            <MAdminSecretInput
              aria-label={t('admin.amapKey')}
              value={amapKey}
              onChange={(e) => setAmapKey(e.target.value)}
              placeholder={t('settings.keyPlaceholder')}
            />
          </MProviderBlock>

          <MProviderBlock title={t('admin.unsplashKey')}>
            <p className="font-geist text-[0.625rem] leading-relaxed text-m-faint">{t('admin.unsplashKeyHint')}</p>
            <MAdminSecretInput
              aria-label={t('admin.unsplashKey')}
              value={unsplashKey}
              onChange={(e) => setUnsplashKey(e.target.value)}
              placeholder={t('settings.keyPlaceholder')}
            />
          </MProviderBlock>
          </>)}

          <MAdminField label={t('admin.placesProvider.title')} hint={t('admin.placesProvider.subtitle')}>
            {/* The app's own picker rather than a bare <select>: a native one is
                drawn by the operating system and was the one control on this page
                that did not belong to TREK. Same sheet the settings selects use. */}
            <button
              type="button"
              disabled={savingPlacesProvider}
              onClick={() => setProviderPickerOpen(true)}
              className="flex h-[42px] w-full items-center gap-2 rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-3 text-left text-[0.84375rem] text-m-ink disabled:opacity-50"
            >
              <span className="min-w-0 flex-1 truncate">{t(`admin.placesProvider.${placesProvider}`)}</span>
              <ChevronDown size={15} strokeWidth={2.2} className="flex-none text-m-faint" aria-hidden />
            </button>
            <MSetPickerSheet
              open={providerPickerOpen}
              onClose={() => setProviderPickerOpen(false)}
              title={t('admin.placesProvider.title')}
              value={placesProvider}
              onSelect={(value) => { if (value !== placesProvider) void handleSavePlacesProvider(value) }}
              options={[
                { value: 'auto', label: t('admin.placesProvider.auto') },
                { value: 'google', label: t('admin.placesProvider.google') },
                { value: 'amap', label: t('admin.placesProvider.amap') },
                { value: 'openstreetmap', label: t('admin.placesProvider.openstreetmap') },
              ]}
            />
            {/* From app-config, like the desktop card: the key fields are empty
                on a managed install and on an operator key set by environment. */}
            {((placesProvider === 'google' && !hasMapsKey) || (placesProvider === 'amap' && !hasAmapKey)) && (
              <p className="mt-1 font-geist text-[0.625rem] font-bold text-[color:var(--m-st-pending)]">
                {t('admin.placesProvider.missingKey')}
              </p>
            )}
          </MAdminField>

          <div>
            {/* The instance's own search log, which is not Google's to spend. */}
            <MAdminRow
              first
              title={t('admin.placeShadow.title')}
              hint={t('admin.placeShadow.subtitle')}
              trailing={
                <MToggle
                  checked={placeShadowEnabled}
                  ariaLabel={t('admin.placeShadow.title')}
                  onChange={async (next) => {
                    setPlaceShadowEnabledState(next)
                    setPlaceShadowEnabled(next)
                    try {
                      await adminApi.updatePlaceShadow(next)
                    } catch {
                      setPlaceShadowEnabledState(!next)
                      setPlaceShadowEnabled(!next)
                    }
                  }}
                />
              }
            />
          </div>

          {!managed && (
            <MAdminButton busy={savingKeys} onClick={handleSaveApiKeys}>
              {t('common.save')}
            </MAdminButton>
          )}
        </div>
      </MAdminCard>

      {/* OIDC / SSO */}
      <MAdminCard>
        <MAdminCardHead title={t('admin.oidcTitle')} hint={t('admin.oidcSubtitle')} />
        <div className="space-y-3">
          <MAdminField label={t('admin.oidcDisplayName')}>
            <MAdminInput
              type="text"
              value={oidcConfig.display_name}
              onChange={(e) => setOidcConfig((c) => ({ ...c, display_name: e.target.value }))}
              placeholder="z.B. Google, Authentik, Keycloak"
            />
          </MAdminField>
          <MAdminField label={t('admin.oidcIssuer')} hint={t('admin.oidcIssuerHint')}>
            <MAdminInput
              type="url"
              value={oidcConfig.issuer}
              onChange={(e) => setOidcConfig((c) => ({ ...c, issuer: e.target.value }))}
              placeholder="https://accounts.google.com"
            />
          </MAdminField>
          <MAdminField label="Discovery URL" hint="Override the auto-constructed discovery URL. Required for providers like Authentik where the endpoint is not at <issuer>/.well-known/openid-configuration.">
            <MAdminInput
              type="url"
              value={oidcConfig.discovery_url}
              onChange={(e) => setOidcConfig((c) => ({ ...c, discovery_url: e.target.value }))}
              placeholder="https://auth.example.com/application/o/trek/.well-known/openid-configuration"
            />
          </MAdminField>
          <MAdminField label="Client ID">
            <MAdminInput
              type="text"
              value={oidcConfig.client_id}
              onChange={(e) => setOidcConfig((c) => ({ ...c, client_id: e.target.value }))}
            />
          </MAdminField>
          <MAdminField label="Client Secret">
            <MAdminInput
              type="password"
              value={oidcConfig.client_secret}
              onChange={(e) => setOidcConfig((c) => ({ ...c, client_secret: e.target.value }))}
              placeholder={oidcConfig.client_secret_set ? '••••••••' : ''}
            />
          </MAdminField>
          <MAdminButton busy={savingOidc} onClick={saveOidc}>
            {t('common.save')}
          </MAdminButton>
        </div>
      </MAdminCard>

      {/* Danger zone */}
      <MAdminCard className="border-[color:color-mix(in_srgb,var(--m-st-danger)_28%,transparent)]">
        <div className="mb-1 flex items-center gap-2 text-[color:var(--m-st-danger)]">
          <AlertTriangle size={14} strokeWidth={2.2} />
          <span className="text-[0.875rem] font-extrabold">Danger Zone</span>
        </div>
        <MAdminRow
          first
          title="Rotate JWT Secret"
          hint="Generate a new JWT signing secret. All active sessions will be invalidated immediately."
          trailing={
            <MAdminButton variant="danger" onClick={() => setShowRotateJwtModal(true)}>
              <RefreshCw size={12} strokeWidth={2.2} />
              Rotate
            </MAdminButton>
          }
        />
      </MAdminCard>
    </div>
  )
}
