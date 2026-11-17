import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useAdminSettingsActions } from '../../../components/Admin/useAdminSettingsActions'
import { placesGoogleOnlyHint } from '../../../utils/placeSource'
import type { TranslationFn } from '../../../types'
import type { useAdmin } from '../../../pages/admin/useAdmin'
import MToggle from '../../components/MToggle'
import { MBlockDisclosure, MProviderBlock, MTrekApiBlock } from './MApiProviderBlocks'
import MAdminOidcCard from './MAdminOidcCard'
import MMailIngestAdminCard from './MMailIngestAdminCard'
import MAdminGoogleDailyLimit from './MAdminGoogleDailyLimit'
import MAdminPlaceContrib from './MAdminPlaceContrib'
import MAdminServiceQuota from './MAdminServiceQuota'
import {
  MAdminButton,
  MAdminCard,
  MAdminCardHead,
  MAdminField,
  MAdminInput,
  MAdminNote,
  MAdminRow,
  MAdminSecretInput,
  MAdminSelect,
} from './MAdminUi'

interface MAdminSettingsSectionProps {
  admin: ReturnType<typeof useAdmin>
  t: TranslationFn
  /**
   * Which section this renders, cut the way the desktop tabs are: who may sign
   * in and what it takes (security), what the install talks to outside
   * (services), and the setup of the features the addons switch on (features).
   */
  part: 'security' | 'services' | 'features'
}

type PartProps = Omit<MAdminSettingsSectionProps, 'part'>

// The admin's security, services and feature setup sections as phone cards,
// one function each. All state and mutations come from useAdmin.
export default function MAdminSettingsSection({ admin, t, part }: MAdminSettingsSectionProps) {
  if (part === 'features') return <FeaturesPart admin={admin} t={t} />
  if (part === 'security') return <SecurityPart admin={admin} t={t} />
  return <ServicesPart admin={admin} t={t} />
}

/** Live flights and booking mails: how the integrations of the addons tab reach the world. */
function FeaturesPart({ admin, t }: PartProps) {
  const { managed, flightLive, setFlightLive, flightLiveLocked, handleToggleAuthSetting } = admin
  return (
    <div className="space-y-3">
      {/* Live flight status: open ADS-B data, no key, on by default (desktop parity). */}
      <FlightLiveCard
        t={t}
        managed={!!managed}
        on={flightLive}
        locked={flightLiveLocked}
        onChange={(v) => void handleToggleAuthSetting('flight_live_enabled', v, setFlightLive)}
      />
      {/* Booking mail import: self-hosted only, the operator runs the TREK Cloud relay (desktop parity). */}
      {!managed && <MMailIngestAdminCard />}
    </div>
  )
}

/** Who may sign in and what it takes, with the one destructive action last. */
function SecurityPart({ admin, t }: PartProps) {
  const {
    passwordLogin, setPasswordLogin, passwordRegistration, setPasswordRegistration,
    oidcLogin, setOidcLogin, oidcRegistration, setOidcRegistration, oidcAutoRedirect, setOidcAutoRedirect,
    envOverrideOidcOnly, oidcConfigured, requireMfa,
    passkeyLogin, setPasskeyLogin, passkeyConfigured,
    webauthnRpId, setWebauthnRpId, webauthnOrigins, setWebauthnOrigins, savingWebauthn, handleSaveWebauthn,
    managed,
    setShowRotateJwtModal,
    handleToggleAuthSetting, handleToggleRequireMfa,
  } = admin
  const { saveOidc } = useAdminSettingsActions(admin, t)

  return (
    <div className="space-y-3">
      {/* Authentication methods, with the passkey switch and the 2FA rule: they are ways in too. */}
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
        {oidcConfigured && (
          <MAdminRow
            title={t('admin.oidcAutoRedirect')}
            hint={t('admin.oidcAutoRedirectHint')}
            trailing={
              <MToggle
                checked={oidcAutoRedirect}
                ariaLabel={t('admin.oidcAutoRedirect')}
                onChange={(v) => void handleToggleAuthSetting('oidc_auto_redirect', v, setOidcAutoRedirect)}
              />
            }
          />
        )}
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
        <MAdminRow
          title={t('admin.requireMfa')}
          hint={t('admin.requireMfaHint')}
          trailing={
            <MToggle checked={requireMfa} ariaLabel={t('admin.requireMfa')} onChange={handleToggleRequireMfa} />
          }
        />
      </MAdminCard>

      {/* The passkey domain: the instance's address, which the operator owns on a
          managed install (server managed.ts), same as the desktop tab. */}
      {!managed && (
      <MAdminCard>
        <MAdminCardHead title={t('admin.passkey.title')} hint={t('admin.passkey.cardHint')} />
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
      )}

      {/* OIDC / SSO: the operator's on a managed install, as on the desktop tab. */}
      {!managed && <MAdminOidcCard admin={admin} t={t} onSave={saveOidc} />}

      {/* Last and on its own, not beside a harmless switch. Rotating the secret fixes
          nothing an instance admin of a managed install can reach. */}
      {!managed && (
      <MAdminCard className="border-[color:color-mix(in_srgb,var(--m-st-danger)_28%,transparent)]">
        <div className="mb-1 flex items-center gap-2 text-[color:var(--m-st-danger)]">
          <AlertTriangle size={14} strokeWidth={2.2} />
          <span className="text-[length:calc(14px*var(--fs-scale-body,1))] font-extrabold">{t('admin.danger.title')}</span>
        </div>
        <MAdminRow
          first
          title={t('admin.rotateJwt.title')}
          hint={t('admin.rotateJwt.hint')}
          trailing={
            <MAdminButton variant="danger" onClick={() => setShowRotateJwtModal(true)}>
              <RefreshCw size={12} strokeWidth={2.2} />
              {t('admin.rotateJwt.button')}
            </MAdminButton>
          }
        />
      </MAdminCard>
      )}
    </div>
  )
}

/** What the install talks to outside: place search and routing, the keys, the file types. */
function ServicesPart({ admin, t }: PartProps) {
  const {
    placesPhotosEnabled, placesAutocompleteEnabled, placesDetailsEnabled, placesEnrichEnabled,
    placesGoogleOnly, handleTogglePlacesGoogleOnly,
    placeShadowEnabled,
    transitProvider, transitGoogleKeySource,
    allowedFileTypes, setAllowedFileTypes, savingFileTypes,
    mapsKey, setMapsKey, unsplashKey, setUnsplashKey, amapKey, setAmapKey, hasMapsKey, hasAmapKey, keyInputProps, mapsKeyTestable, savingKeys, validating, validation,
    placesProvider, savingPlacesProvider, handleSavePlacesProvider,
    managed,
    handleSaveApiKeys, handleValidateKey,
  } = admin
  const {
    saveFileTypes, togglePlacesPhotos, togglePlacesAutocomplete, togglePlacesDetails, togglePlacesEnrich,
    togglePlaceShadow, changeTransitProvider,
  } = useAdminSettingsActions(admin, t)

  // Services, cut like the desktop tab: place search and routing (TREK's own
  // services, which provider answers what, the search log), then the keys for
  // the keyed providers, then the file types.
  const providerMissingKey = (placesProvider === 'google' && !hasMapsKey) || (placesProvider === 'amap' && !hasAmapKey)
  return (
    <div className="space-y-3">
      {/* On a managed install place search and routing are the operator's, but
          sharing place details stays the admin's decision, as on the desktop. */}
      {managed && <MAdminPlaceContrib hideWhenSwitchedOff />}

      {!managed && (
      <MAdminCard>
        <MAdminCardHead title={t('admin.servicesCard.title')} hint={t('admin.servicesCard.hint')} />
        <div className="space-y-3">
          <MTrekApiBlock />
          <MAdminServiceQuota />
          <MAdminPlaceContrib />

          {/* Transit backend (#1699): Transitous has no GTFS for much of Asia, so an
              install can send transit search to Google on the same key. */}
          <MAdminField label={t('admin.transitProvider.title')} hint={t('admin.transitProvider.subtitle')}>
            <MAdminSelect
              title={t('admin.transitProvider.title')}
              value={transitProvider}
              onChange={(value) => void changeTransitProvider(value)}
              options={[
                { value: 'transitous', label: t('admin.transitProvider.transitous') },
                { value: 'google', label: t('admin.transitProvider.google') },
              ]}
            />
            <MAdminNote>
              {transitProvider === 'google' ? t('admin.transitProvider.googleHint') : t('admin.transitProvider.transitousHint')}
            </MAdminNote>
            {/* Google without a key that resolves changes nothing, and a personal key
                serves this admin alone: the request-time fallback is silent, so here
                is the only place to say it. */}
            {transitProvider === 'google' && transitGoogleKeySource === null && (
              <MAdminNote warn>{t('admin.transitProvider.noKeyWarning')}</MAdminNote>
            )}
            {transitProvider === 'google' && transitGoogleKeySource === 'user-row' && (
              <MAdminNote warn>{t('admin.transitProvider.personalKeyWarning')}</MAdminNote>
            )}
          </MAdminField>

          {/* Which keyed provider answers place search. */}
          <MAdminField label={t('admin.placesProvider.title')} hint={t('admin.placesProvider.subtitle')}>
            <MAdminSelect
              title={t('admin.placesProvider.title')}
              value={placesProvider}
              disabled={savingPlacesProvider}
              onChange={(value) => void handleSavePlacesProvider(value)}
              options={[
                { value: 'auto', label: t('admin.placesProvider.auto') },
                { value: 'google', label: t('admin.placesProvider.google') },
                { value: 'amap', label: t('admin.placesProvider.amap') },
                { value: 'openstreetmap', label: t('admin.placesProvider.openstreetmap') },
              ]}
            />
            {/* From app-config, like the desktop card: the key fields are empty
                on a managed install and on an operator key set by environment. */}
            {providerMissingKey && <MAdminNote warn>{t('admin.placesProvider.missingKey')}</MAdminNote>}
          </MAdminField>

          {/* The instance's own search log, which is not Google's to spend. */}
          <div>
            <MAdminRow
              first
              title={t('admin.placeShadow.title')}
              hint={t('admin.placeShadow.subtitle')}
              trailing={
                <MToggle
                  checked={placeShadowEnabled}
                  ariaLabel={t('admin.placeShadow.title')}
                  onChange={togglePlaceShadow}
                />
              }
            />
          </div>
        </div>
      </MAdminCard>
      )}

      {/* The keys of the keyed providers, in the desktop order: Google, Unsplash, Amap. */}
      {!managed && (
      <MAdminCard>
        <MAdminCardHead title={t('admin.apiKeys')} hint={t('admin.apiKeysHint')} />
        <div className="space-y-3">
          <MProviderBlock title={t('admin.mapsKey')} badge={t('admin.googleCaveat.badge')} tone="caution">
            {/* Said before the field, not after it: somebody about to paste a key
                should read this while deciding, not once they already have. */}
            <MAdminNote>{t('admin.mapsKeyHintShort')}</MAdminNote>
            <div className="flex gap-2">
              <div className="min-w-0 flex-1">
                <MAdminSecretInput
                  aria-label={t('admin.mapsKey')}
                  value={mapsKey}
                  onChange={(e) => setMapsKey(e.target.value)}
                  {...keyInputProps('maps')}
                />
              </div>
              <MAdminButton
                variant="ghost"
                disabled={!mapsKeyTestable}
                busy={!!validating.maps}
                onClick={() => handleValidateKey('maps')}
                className="h-[42px]"
              >
                {t('admin.validateKey')}
              </MAdminButton>
            </div>
            {validation.maps === true && (
              <p className="font-geist text-[length:calc(10px*var(--fs-scale-caption,1))] font-bold text-[color:var(--m-st-confirmed)]">
                {t('admin.keyValid')}
              </p>
            )}
            {validation.maps === false && (
              <p className="font-geist text-[length:calc(10px*var(--fs-scale-caption,1))] font-bold text-[color:var(--m-st-danger)]">
                {t('admin.keyInvalid')}
              </p>
            )}
            {/* What the key may be spent on, and how much of it a day. Under the key:
                every one of them is a Google request. */}
            <MBlockDisclosure label={t('admin.placesUsageTitle')}>
            <MAdminRow
              title={t('admin.placesPhotos.title')}
              hint={t('admin.placesPhotos.subtitle')}
              trailing={
                <MToggle
                  checked={placesPhotosEnabled}
                  ariaLabel={t('admin.placesPhotos.title')}
                  onChange={togglePlacesPhotos}
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
                  onChange={togglePlacesAutocomplete}
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
                  onChange={togglePlacesDetails}
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
                  onChange={togglePlacesEnrich}
                />
              }
            />
            <MAdminRow
              title={t('admin.placesGoogleOnly.title')}
              hint={t(placesGoogleOnlyHint(hasMapsKey, placesProvider))}
              trailing={
                <MToggle
                  checked={placesGoogleOnly}
                  ariaLabel={t('admin.placesGoogleOnly.title')}
                  onChange={() => handleTogglePlacesGoogleOnly()}
                />
              }
            />
            <MAdminGoogleDailyLimit />
            </MBlockDisclosure>
          </MProviderBlock>

          <MProviderBlock title={t('admin.unsplashKey')}>
            <MAdminNote>{t('admin.unsplashKeyHint')}</MAdminNote>
            <MAdminSecretInput
              aria-label={t('admin.unsplashKey')}
              value={unsplashKey}
              onChange={(e) => setUnsplashKey(e.target.value)}
              {...keyInputProps('unsplash')}
            />
          </MProviderBlock>

          {/* No Test button, same as the desktop tab: /auth/validate-keys only
              knows how to probe Google Places and OpenWeatherMap. */}
          <MProviderBlock title={t('admin.amapKey')}>
            <MAdminNote>{t('admin.amapKeyHintShort')}</MAdminNote>
            <MAdminSecretInput
              aria-label={t('admin.amapKey')}
              value={amapKey}
              onChange={(e) => setAmapKey(e.target.value)}
              {...keyInputProps('amap')}
            />
          </MProviderBlock>

          <MAdminButton busy={savingKeys} onClick={handleSaveApiKeys}>
            {t('common.save')}
          </MAdminButton>
        </div>
      </MAdminCard>
      )}

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
    </div>
  )
}

/** The live flight status switch, locked with a word when the server environment holds it. */
function FlightLiveCard({ t, managed, on, locked, onChange }: {
  t: TranslationFn
  managed: boolean
  on: boolean
  locked: boolean
  onChange: (on: boolean) => void
}) {
  return (
    <MAdminCard>
      <MAdminCardHead title={t('flightLive.adminTitle')} hint={managed ? t('flightLive.adminHintManaged') : t('flightLive.adminHint')} />
      <MAdminRow
        title={t('flightLive.adminToggle')}
        hint={locked ? t('flightLive.envLocked') : undefined}
        trailing={<MToggle checked={on} ariaLabel={t('flightLive.adminToggle')} disabled={locked} onChange={onChange} />}
      />
    </MAdminCard>
  )
}
