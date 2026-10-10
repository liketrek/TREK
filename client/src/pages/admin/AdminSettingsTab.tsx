import React from 'react'
import { adminApi } from '../../api/client'
import { getApiErrorMessage } from '../../types'
import {
  AlertTriangle, CheckCircle, Eye, EyeOff, FileType, Fingerprint, KeyRound, Loader2, LockKeyhole, LogIn,
  RefreshCw, Save, ShieldCheck, XCircle,
} from 'lucide-react'
import ToggleSwitch from '../../components/Settings/ToggleSwitch'
import CustomSelect from '../../components/shared/CustomSelect'
import { fs } from '../../components/shared/DialogShell'
import { EditorField, GRID_2, INPUT } from '../../components/shared/dialogParts'
import {
  SETTINGS_BUTTON, SETTINGS_BUTTON_DANGER, SETTINGS_BUTTON_PRIMARY, SettingRow, SettingRows, SettingsCard, SettingsHint, StatusPill,
} from '../../components/Settings/settingsKit'
import GoogleOptions from './GoogleOptions'
import GoogleDailyLimitRow from '../../components/Admin/GoogleDailyLimitRow'
import ProviderBlock from './ProviderBlock'
import TrekApiCard from './TrekApiCard'
import { useAdminSettingsActions } from '../../components/Admin/useAdminSettingsActions'
import { placesGoogleOnlyHint } from '../../utils/placeSource'
import type { TranslationFn } from '../../types'
import type { useAdmin } from './useAdmin'

interface AdminSettingsTabProps {
  admin: ReturnType<typeof useAdmin>
  t: TranslationFn
}

/**
 * ToggleSwitch's look for the login switches that can be locked: the last way
 * in may not be switched off, and an OIDC_ONLY environment pins the password
 * ones. ToggleSwitch itself has no disabled state, so the same track and knob
 * are drawn here with one. The title carries the lockout reason.
 */
function LockableSwitch({ on, onToggle, label, disabled, title }: {
  on: boolean
  onToggle: () => void
  label: string
  disabled?: boolean
  title?: string
}) {
  return (
    <button type="button" onClick={onToggle} disabled={disabled} title={title} aria-pressed={on} aria-label={label}
      className="group relative h-6 w-11 flex-none cursor-pointer rounded-full border-0 p-0 outline-none transition-colors duration-200 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-[color:var(--text-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-card)] disabled:cursor-default disabled:opacity-50"
      style={{
        background: on ? 'var(--accent)' : 'var(--border-primary)',
        boxShadow: 'inset 0 1px 2px color-mix(in srgb, var(--text-primary) 12%, transparent)',
      }}>
      <span className="absolute top-0.5 h-5 w-5 rounded-full transition-[left,transform] duration-200 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)] group-enabled:group-active:scale-95"
        style={{ left: on ? 22 : 2, background: on ? 'var(--accent-text)' : 'var(--bg-card)', boxShadow: 'var(--shadow-sm)' }} />
    </button>
  )
}

/** A warning in a card body: what a setting will not do as things stand. */
function Callout({ children }: { children: React.ReactNode }) {
  return (
    <p className="m-0 flex items-start gap-2 rounded-[12px] bg-warning-soft px-3 py-2.5 leading-snug text-warning" style={fs(12, 'body')}>
      <AlertTriangle size={14} strokeWidth={2.2} className="mt-px flex-none" />
      <span className="min-w-0">{children}</span>
    </p>
  )
}

/**
 * A secret key field with its show/hide eye inside the box. The eye carries the
 * key's name as its accessible name and is the input's sibling, which is how
 * the tests find each field.
 */
function KeyField({ shown, value, onChange, inputProps, label, onToggle }: {
  shown: boolean
  value: string
  onChange: (value: string) => void
  inputProps: React.InputHTMLAttributes<HTMLInputElement>
  label: string
  onToggle: () => void
}) {
  return (
    <div className="relative min-w-0 flex-1">
      <input
        type={shown ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        {...inputProps}
        className={`${INPUT} pe-10 font-geist`}
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={label}
        className="absolute end-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-[8px] text-content-faint hover:bg-surface-hover hover:text-content"
      >
        {shown ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  )
}

/** The save at the foot of a card body, on the right like a dialog's main action. */
function SaveBar({ onClick, saving, label }: { onClick: () => void; saving: boolean; label: string }) {
  return (
    <div className="flex justify-end">
      <button type="button" onClick={onClick} disabled={saving} className={SETTINGS_BUTTON_PRIMARY} style={fs(13, 'body')}>
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        {label}
      </button>
    </div>
  )
}

// "Settings" admin tab: auth methods, require-MFA, allowed file types, API keys,
// OIDC config and the danger zone. Pure layout around the useAdmin hook.
export default function AdminSettingsTab({ admin, t }: AdminSettingsTabProps): React.ReactElement {
  const {
    toast,
    placesPhotosEnabled, placesAutocompleteEnabled, placesDetailsEnabled, placesEnrichEnabled,
    placesGoogleOnly, handleTogglePlacesGoogleOnly,
    transitProvider, setTransitProviderState,
    transitGoogleKeySource, setTransitGoogleKeySource,
    placeShadowEnabled,
    oidcConfig, setOidcConfig, savingOidc,
    passwordLogin, setPasswordLogin, passwordRegistration, setPasswordRegistration,
    oidcLogin, setOidcLogin, oidcRegistration, setOidcRegistration,
    envOverrideOidcOnly, oidcConfigured, requireMfa,
    passkeyLogin, setPasskeyLogin, passkeyConfigured,
    webauthnRpId, setWebauthnRpId, webauthnOrigins, setWebauthnOrigins, savingWebauthn, handleSaveWebauthn,
    allowedFileTypes, setAllowedFileTypes, savingFileTypes,
    mapsKey, setMapsKey, unsplashKey, setUnsplashKey, amapKey, setAmapKey, hasMapsKey, hasAmapKey, keyInputProps, mapsKeyTestable, showKeys, savingKeys, validating, validation,
    placesProvider, savingPlacesProvider, handleSavePlacesProvider,
    managed,
    setShowRotateJwtModal,
    handleToggleAuthSetting, handleToggleRequireMfa,
    toggleKey, handleSaveApiKeys, handleValidateKey,
  } = admin
  const {
    saveOidc, saveFileTypes, togglePlacesPhotos, togglePlacesAutocomplete, togglePlacesDetails, togglePlacesEnrich,
    togglePlaceShadow,
  } = useAdminSettingsActions(admin, t)

  const passwordLoginLocked = !passwordLogin && !oidcLogin
  const oidcLoginLocked = !passwordLogin && oidcLogin

  return (
        <div>
      {/* Two columns from xl up. Nearly every card here is "label left,
          switch right", so on a wide screen the middle stayed empty while the
          page scrolled for ages. Two explicit columns rather than a grid over
          the flat list: a plain grid pairs cards row by row and leaves a hole
          under whichever of the pair is shorter, and these differ by hundreds
          of pixels. Grouped by subject, not by height — access and identity
          left, integrations and data right. The cards carry their own bottom
          margin, so only the column gap is set here. */}
      <div className="grid grid-cols-1 gap-x-5 xl:grid-cols-2 xl:items-start">
        <div className="min-w-0">
        {/* Authentication Methods */}
        <SettingsCard icon={LockKeyhole} title={t('admin.authMethods')}>
          {envOverrideOidcOnly && <Callout>{t('admin.envOverrideHint')}</Callout>}
          <SettingRows>
            <SettingRow
              label={t('admin.passwordLogin')}
              hint={t('admin.passwordLoginHint')}
              control={
                <LockableSwitch
                  on={passwordLogin}
                  label={t('admin.passwordLogin')}
                  disabled={envOverrideOidcOnly || passwordLoginLocked}
                  title={passwordLoginLocked ? t('admin.lockoutWarning') : undefined}
                  onToggle={() => handleToggleAuthSetting('password_login', !passwordLogin, setPasswordLogin)}
                />
              }
            />
            <SettingRow
              label={t('admin.passwordRegistration')}
              hint={t('admin.passwordRegistrationHint')}
              control={
                <LockableSwitch
                  on={passwordRegistration}
                  label={t('admin.passwordRegistration')}
                  disabled={envOverrideOidcOnly}
                  onToggle={() => handleToggleAuthSetting('password_registration', !passwordRegistration, setPasswordRegistration)}
                />
              }
            />
            {/* SSO Login (only when OIDC configured) */}
            {oidcConfigured && (
              <SettingRow
                label={t('admin.oidcLogin')}
                hint={t('admin.oidcLoginHint')}
                control={
                  <LockableSwitch
                    on={oidcLogin}
                    label={t('admin.oidcLogin')}
                    disabled={oidcLoginLocked}
                    title={oidcLoginLocked ? t('admin.lockoutWarning') : undefined}
                    onToggle={() => handleToggleAuthSetting('oidc_login', !oidcLogin, setOidcLogin)}
                  />
                }
              />
            )}
            {/* SSO Registration (only when OIDC configured) */}
            {oidcConfigured && (
              <SettingRow
                label={t('admin.oidcRegistration')}
                hint={t('admin.oidcRegistrationHint')}
                control={
                  <ToggleSwitch
                    on={oidcRegistration}
                    label={t('admin.oidcRegistration')}
                    onToggle={() => handleToggleAuthSetting('oidc_registration', !oidcRegistration, setOidcRegistration)}
                  />
                }
              />
            )}
          </SettingRows>
        </SettingsCard>

        {/* Passkey (WebAuthn) login */}
        <SettingsCard icon={Fingerprint} title={t('admin.passkey.title')} hint={t('admin.passkey.cardHint')}>
          <SettingRows>
            <SettingRow
              label={t('admin.passkey.login')}
              hint={t('admin.passkey.loginHint')}
              control={
                <ToggleSwitch
                  on={passkeyLogin}
                  label={t('admin.passkey.login')}
                  onToggle={() => handleToggleAuthSetting('passkey_login', !passkeyLogin, setPasskeyLogin)}
                />
              }
            />
          </SettingRows>

          {passkeyLogin && !passkeyConfigured && <Callout>{t('admin.passkey.notConfigured')}</Callout>}

          {/* The domain passkeys bind to and the origins that may present them
              follow from the address the instance is served on, which the operator
              owns. Getting either wrong invalidates every enrolled passkey, and on
              a shared parent domain a wrong RP ID reaches past this instance
              entirely — so they are pinned per container, not offered here. The
              switch above stays: whether to offer passkeys at all is a house rule. */}
          {!managed && (<>
            <EditorField label={t('admin.passkey.rpId')} htmlFor="admin-webauthn-rp-id" hint={t('admin.passkey.rpIdHint')}>
              <input
                id="admin-webauthn-rp-id"
                type="text"
                value={webauthnRpId}
                onChange={e => setWebauthnRpId(e.target.value)}
                placeholder="trek.example.org"
                className={`${INPUT} font-geist`}
              />
            </EditorField>
            <EditorField label={t('admin.passkey.origins')} htmlFor="admin-webauthn-origins" hint={t('admin.passkey.originsHint')}>
              <input
                id="admin-webauthn-origins"
                type="text"
                value={webauthnOrigins}
                onChange={e => setWebauthnOrigins(e.target.value)}
                placeholder="https://trek.example.org"
                className={`${INPUT} font-geist`}
              />
            </EditorField>
            <SaveBar onClick={handleSaveWebauthn} saving={savingWebauthn} label={t('common.save')} />
          </>)}
        </SettingsCard>

        {/* Require 2FA for all users */}
        <SettingsCard icon={ShieldCheck} title={t('admin.requireMfa')}>
          <SettingRows>
            <SettingRow
              label={t('admin.requireMfa')}
              hint={t('admin.requireMfaHint')}
              control={
                <ToggleSwitch
                  on={requireMfa}
                  label={t('admin.requireMfa')}
                  onToggle={() => handleToggleRequireMfa(!requireMfa)}
                />
              }
            />
          </SettingRows>
        </SettingsCard>

          {/* An issuer the instance names can assert any address as verified, and the
              discovery calls leave from inside the operator’s network. Sign-on is theirs
              to wire, so the fields are not offered. */}
          {!managed && (
          /* OIDC / SSO Configuration */
          <SettingsCard icon={LogIn} title={t('admin.oidcTitle')} hint={t('admin.oidcSubtitle')}>
            <div className={GRID_2}>
              <EditorField label={t('admin.oidcDisplayName')} htmlFor="oidc-display-name">
                <input
                  id="oidc-display-name"
                  type="text"
                  value={oidcConfig.display_name}
                  onChange={e => setOidcConfig(c => ({ ...c, display_name: e.target.value }))}
                  placeholder='z.B. Google, Authentik, Keycloak'
                  className={INPUT}
                />
              </EditorField>
              <EditorField label={t('admin.oidcIssuer')} htmlFor="oidc-issuer" hint={t('admin.oidcIssuerHint')}>
                <input
                  id="oidc-issuer"
                  type="url"
                  value={oidcConfig.issuer}
                  onChange={e => setOidcConfig(c => ({ ...c, issuer: e.target.value }))}
                  placeholder='https://accounts.google.com'
                  className={`${INPUT} font-geist`}
                />
              </EditorField>
            </div>
            <EditorField
              label={<>Discovery URL <span className="normal-case tracking-normal">(optional)</span></>}
              htmlFor="oidc-discovery-url"
              hint={<>Override the auto-constructed discovery URL. Required for providers like Authentik where the endpoint is not at <code className="rounded-[4px] bg-surface-tertiary px-1 font-geist">{'<issuer>/.well-known/openid-configuration'}</code>.</>}
            >
              <input
                id="oidc-discovery-url"
                type="url"
                value={oidcConfig.discovery_url}
                onChange={e => setOidcConfig(c => ({ ...c, discovery_url: e.target.value }))}
                placeholder='https://auth.example.com/application/o/trek/.well-known/openid-configuration'
                className={`${INPUT} font-geist`}
              />
            </EditorField>
            <div className={GRID_2}>
              <EditorField label="Client ID" htmlFor="oidc-client-id">
                <input
                  id="oidc-client-id"
                  type="text"
                  value={oidcConfig.client_id}
                  onChange={e => setOidcConfig(c => ({ ...c, client_id: e.target.value }))}
                  className={`${INPUT} font-geist`}
                />
              </EditorField>
              <EditorField label="Client Secret" htmlFor="oidc-client-secret">
                <input
                  id="oidc-client-secret"
                  type="password"
                  value={oidcConfig.client_secret}
                  onChange={e => setOidcConfig(c => ({ ...c, client_secret: e.target.value }))}
                  placeholder={oidcConfig.client_secret_set ? '••••••••' : ''}
                  className={`${INPUT} font-geist`}
                />
              </EditorField>
            </div>
            <SaveBar
              label={t('common.save')}
              saving={savingOidc}
              onClick={saveOidc}
            />
          </SettingsCard>
          )}
        </div>

        <div className="min-w-0">
        {/* Allowed File Types */}
        <SettingsCard icon={FileType} title={t('admin.fileTypes')} hint={t('admin.fileTypesHint')}>
          <div>
            <input
              type="text"
              aria-label={t('admin.fileTypes')}
              value={allowedFileTypes}
              onChange={e => setAllowedFileTypes(e.target.value)}
              placeholder="jpg,png,pdf,doc,docx,xls,xlsx,txt,csv"
              className={`${INPUT} font-geist`}
            />
            <SettingsHint className="mt-1.5">{t('admin.fileTypesFormat')}</SettingsHint>
          </div>
          <SaveBar
            label={t('common.save')}
            saving={savingFileTypes}
            onClick={saveFileTypes}
          />
        </SettingsCard>

          {/* API Keys.
              The card itself stays on a managed install: the TREK index needs no key,
              and which keyed provider answers place search is the admin's call there
              too (server managed.ts). What folds away is the operator's: the keys,
              what a lookup costs, and the per-place Google switches. Those switches
              sit under the keys rather than flat beside them because they are set
              once and then never touched, and side by side a rarely-used option
              looked as important as the key it depends on. Weather is a quiet row
              for the same reason in reverse: it had the loudest treatment on the
              card and is the one thing here with nothing to configure. */}
          <SettingsCard icon={KeyRound} title={t('admin.apiKeys')} hint={t('admin.apiKeysHint')}>
          {/* Three comparable blocks, in the order we would have people choose
              them. Weather moved out entirely: it needs no key and had nothing
              to configure, so it had no business in a card about keys. */}
          <TrekApiCard t={t} />

          {!managed && (<>
          <ProviderBlock title={t('admin.mapsKey')}>
            {/* Said before the field, not after it. Someone about to paste a key
                should read this while deciding, not once they already have. */}
            <SettingsHint>{t('admin.googleCaveat.body')}</SettingsHint>

            <div className="flex flex-col gap-1.5">
              <div className="flex gap-2">
                <KeyField
                  shown={showKeys.maps}
                  value={mapsKey}
                  onChange={setMapsKey}
                  inputProps={keyInputProps('maps')}
                  label={t('admin.mapsKey')}
                  onToggle={() => toggleKey('maps')}
                />
                <button type="button"
                  onClick={() => handleValidateKey('maps')}
                  disabled={!mapsKeyTestable || validating.maps}
                  className={`${SETTINGS_BUTTON} flex-none whitespace-nowrap`}
                  style={fs(13, 'body')}
                >
                  {validating.maps ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : validation.maps === true ? (
                    <CheckCircle size={14} className="text-success" />
                  ) : validation.maps === false ? (
                    <XCircle size={14} className="text-danger" />
                  ) : null}
                  {t('admin.validateKey')}
                </button>
              </div>
              <SettingsHint>{t('admin.mapsKeyHintLong')}</SettingsHint>
              {validation.maps === true && (
                <div><StatusPill tone="success" icon={<span className="me-0.5 h-1.5 w-1.5 rounded-full bg-success" />}>{t('admin.keyValid')}</StatusPill></div>
              )}
              {validation.maps === false && (
                <div><StatusPill tone="danger" icon={<span className="me-0.5 h-1.5 w-1.5 rounded-full bg-danger" />}>{t('admin.keyInvalid')}</StatusPill></div>
              )}
            </div>

            {/* What the key may be spent on, inside the block that owns the key
                rather than beside it. Each row's own subtitle says which of them
                still work without one; enrichment always does, from Wikipedia
                and OpenStreetMap. */}
            <GoogleOptions
              title={t('admin.googleOptions')}
              summary={t('admin.googleOptionsSummary', {
                on: [placesPhotosEnabled, placesAutocompleteEnabled, placesDetailsEnabled, placesEnrichEnabled, placesGoogleOnly].filter(Boolean).length,
                total: 5,
              })}
            >
              <SettingRow
                label={t('admin.placesPhotos.title')}
                hint={t('admin.placesPhotos.subtitle')}
                control={
                  <ToggleSwitch
                    on={placesPhotosEnabled}
                    label={t('admin.placesPhotos.title')}
                    onToggle={() => togglePlacesPhotos(!placesPhotosEnabled)}
                  />
                }
              />
              <SettingRow
                label={t('admin.placesAutocomplete.title')}
                hint={t('admin.placesAutocomplete.subtitle')}
                control={
                  <ToggleSwitch
                    on={placesAutocompleteEnabled}
                    label={t('admin.placesAutocomplete.title')}
                    onToggle={() => togglePlacesAutocomplete(!placesAutocompleteEnabled)}
                  />
                }
              />
              <SettingRow
                label={t('admin.placesDetails.title')}
                hint={t('admin.placesDetails.subtitle')}
                control={
                  <ToggleSwitch
                    on={placesDetailsEnabled}
                    label={t('admin.placesDetails.title')}
                    onToggle={() => togglePlacesDetails(!placesDetailsEnabled)}
                  />
                }
              />
              <SettingRow
                label={t('admin.placesEnrich.title')}
                hint={t('admin.placesEnrich.subtitle')}
                control={
                  <ToggleSwitch
                    on={placesEnrichEnabled}
                    label={t('admin.placesEnrich.title')}
                    onToggle={() => togglePlacesEnrich(!placesEnrichEnabled)}
                  />
                }
              />
              {/* The one row here that is about where a search goes rather than
                  what the key may be spent on. Without a key, or with Amap or
                  OpenStreetMap holding the slot, it is a promise the search
                  cannot keep, and the subtitle says so. */}
              <SettingRow
                label={t('admin.placesGoogleOnly.title')}
                hint={t(placesGoogleOnlyHint(hasMapsKey, placesProvider))}
                control={
                  <ToggleSwitch
                    on={placesGoogleOnly}
                    label={t('admin.placesGoogleOnly.title')}
                    onToggle={handleTogglePlacesGoogleOnly}
                  />
                }
              />
              <GoogleDailyLimitRow />
            </GoogleOptions>
          </ProviderBlock>

          <ProviderBlock title={t('admin.unsplashKey')}>
            <KeyField
              shown={showKeys.unsplash}
              value={unsplashKey}
              onChange={setUnsplashKey}
              inputProps={keyInputProps('unsplash')}
              label={t('admin.unsplashKey')}
              onToggle={() => toggleKey('unsplash')}
            />
            <SettingsHint className="-mt-1.5">{t('admin.unsplashKeyHint')}</SettingsHint>
          </ProviderBlock>

          {/* Amap Key. No Test button: /auth/validate-keys only knows how to
              probe Google Places and OpenWeatherMap, and a button that silently
              tests something else is worse than no button. */}
          <ProviderBlock title={t('admin.amapKey')}>
            <KeyField
              shown={showKeys.amap}
              value={amapKey}
              onChange={setAmapKey}
              inputProps={keyInputProps('amap')}
              label={t('admin.amapKey')}
              onToggle={() => toggleKey('amap')}
            />
            <SettingsHint className="-mt-1.5">{t('admin.amapKeyHint')}</SettingsHint>
          </ProviderBlock>
          {/* Transit Backend (#1699) — Transitous has no GTFS for much of Asia,
              so an install can point transit search at Google instead, on the
              same key. Falls back to Transitous when no key resolves. A block of
              its own rather than a row inside the Google one: picking Transitous
              is a decision about a provider that has nothing to do with a key. */}
          <ProviderBlock title={t('admin.transitProvider.title')}>
            <SettingsHint>{t('admin.transitProvider.subtitle')}</SettingsHint>
            {/* The app's own select rather than the browser's: a native option list
                is drawn by the OS, so it ignores the scheme, the radius and the
                text-size setting the rest of this card follows. The menu portals to
                the body, which is what lets it escape the card's overflow-hidden. */}
            <CustomSelect
              value={transitProvider}
              onChange={async value => {
                // A native select stayed silent when the option already selected was
                // picked again; this one reports every pick, and a no-op PUT is still
                // a write on an audited settings route.
                if (value === transitProvider) return
                const next = value === 'google' ? 'google' : 'transitous'
                const previous = transitProvider
                setTransitProviderState(next)
                try {
                  const saved = await adminApi.updateTransitProvider(next)
                  setTransitGoogleKeySource(saved.googleKeySource)
                } catch (err: unknown) {
                  // The select springs back on its own; without a word that reads
                  // as a broken control, not as a save that failed.
                  setTransitProviderState(previous)
                  toast.error(getApiErrorMessage(err, t('common.error')))
                }
              }}
              options={[
                { value: 'transitous', label: t('admin.transitProvider.transitous') },
                { value: 'google', label: t('admin.transitProvider.google') },
              ]}
            />
            <SettingsHint className="-mt-1.5">
              {transitProvider === 'google' ? t('admin.transitProvider.googleHint') : t('admin.transitProvider.transitousHint')}
            </SettingsHint>

            {/* Picking Google without a key that resolves changes nothing — the
                request-time fallback is silent, so this is the only place it can
                be said. 'user-row' is the subtler half: the resolver's last step
                is the caller's own row, so a personal key serves this admin and
                nobody else. */}
            {transitProvider === 'google' && transitGoogleKeySource === null && (
              <Callout>{t('admin.transitProvider.noKeyWarning')}</Callout>
            )}
            {transitProvider === 'google' && transitGoogleKeySource === 'user-row' && (
              <Callout>{t('admin.transitProvider.personalKeyWarning')}</Callout>
            )}
          </ProviderBlock>
          </>)}

          {/* Which keyed provider answers place search. Outside the managed guard
              on purpose: the operator owns the credentials, but what their users
              search against is still the admin's call (see server managed.ts). */}
          <ProviderBlock title={t('admin.placesProvider.title')}>
            <SettingsHint>{t('admin.placesProvider.subtitle')}</SettingsHint>
            <div className={savingPlacesProvider ? 'opacity-60' : undefined}>
              <CustomSelect
                value={placesProvider}
                disabled={savingPlacesProvider}
                onChange={value => {
                  if (value === placesProvider) return
                  void handleSavePlacesProvider(String(value))
                }}
                options={[
                  { value: 'auto', label: t('admin.placesProvider.auto') },
                  { value: 'google', label: t('admin.placesProvider.google') },
                  { value: 'amap', label: t('admin.placesProvider.amap') },
                  { value: 'openstreetmap', label: t('admin.placesProvider.openstreetmap') },
                ]}
              />
            </div>
            {/* A provider chosen without a key behind it answers with
                OpenStreetMap rather than failing, which is quiet enough to be
                mistaken for the provider working. Say so. Asked of app-config
                and not of the fields above: those are empty on a managed
                install and on an operator key that came from the environment,
                and saying "falls back to OpenStreetMap" to an admin whose
                search works is worse than saying nothing. */}
            {((placesProvider === 'google' && !hasMapsKey) || (placesProvider === 'amap' && !hasAmapKey)) && (
              <Callout>{t('admin.placesProvider.missingKey')}</Callout>
            )}
          </ProviderBlock>

          {/* The search log sits with the index rather than with a provider:
              it records which result somebody picked, so a candidate index can
              be judged against real searches later. Off unless switched on,
              and nothing it records leaves the instance. */}
          <SettingRows>
            <SettingRow
              label={t('admin.placeShadow.title')}
              hint={t('admin.placeShadow.subtitle')}
              control={
                <ToggleSwitch
                  on={placeShadowEnabled}
                  label={t('admin.placeShadow.title')}
                  onToggle={() => togglePlaceShadow(!placeShadowEnabled)}
                />
              }
            />
          </SettingRows>

          {!managed && <SaveBar onClick={handleSaveApiKeys} saving={savingKeys} label={t('common.save')} />}
          </SettingsCard>
        </div>
      </div>

      {/* Full width, and last. A destructive action should not sit beside a
          harmless toggle where a mis-aimed click can reach it. */}
      {/* Rotating the secret signs every user out and fixes nothing an instance admin
          can reach: the file it writes belongs to the host. */}
      {!managed && (
      /* Danger Zone */
      <SettingsCard icon={AlertTriangle} title="Danger Zone" tone="danger">
        <SettingRows>
          <SettingRow
            label="Rotate JWT Secret"
            hint="Generate a new JWT signing secret. All active sessions will be invalidated immediately."
            control={
              <button type="button"
                onClick={() => setShowRotateJwtModal(true)}
                className={SETTINGS_BUTTON_DANGER}
                style={fs(13, 'body')}
              >
                <RefreshCw size={14} />
                Rotate
              </button>
            }
          />
        </SettingRows>
      </SettingsCard>
      )}
    </div>
  )
}
