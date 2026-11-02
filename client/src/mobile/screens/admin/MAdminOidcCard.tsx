import type { useAdmin } from '../../../pages/admin/useAdmin';
import type { TranslationFn } from '../../../types';
import { MAdminButton, MAdminCard, MAdminCardHead, MAdminField, MAdminInput } from './MAdminUi';

interface MAdminOidcCardProps {
  admin: ReturnType<typeof useAdmin>;
  t: TranslationFn;
  onSave: () => void;
}

/** OIDC / SSO, as on the desktop settings tab. The settings section leaves it out on a managed install. */
export default function MAdminOidcCard({ admin, t, onSave }: MAdminOidcCardProps) {
  const { oidcConfig, setOidcConfig, savingOidc } = admin;
  return (
    <MAdminCard>
      <MAdminCardHead title={t('admin.oidcTitle')} hint={t('admin.oidcSubtitle')} />
      <div className="space-y-3">
        <MAdminField label={t('admin.oidcDisplayName')}>
          <MAdminInput
            type="text"
            value={oidcConfig.display_name}
            onChange={(e) => setOidcConfig((c) => ({ ...c, display_name: e.target.value }))}
            placeholder={t('admin.oidcDisplayNamePlaceholder')}
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
        <MAdminField
          label={t('admin.oidcDiscoveryUrl')}
          hint={t('admin.oidcDiscoveryUrlHint', { path: '<issuer>/.well-known/openid-configuration' })}
        >
          <MAdminInput
            type="url"
            value={oidcConfig.discovery_url}
            onChange={(e) => setOidcConfig((c) => ({ ...c, discovery_url: e.target.value }))}
            placeholder="https://auth.example.com/application/o/trek/.well-known/openid-configuration"
          />
        </MAdminField>
        <MAdminField label={t('settings.oauth.clientId')}>
          <MAdminInput
            type="text"
            value={oidcConfig.client_id}
            onChange={(e) => setOidcConfig((c) => ({ ...c, client_id: e.target.value }))}
          />
        </MAdminField>
        <MAdminField label={t('settings.oauth.clientSecret')}>
          <MAdminInput
            type="password"
            value={oidcConfig.client_secret}
            onChange={(e) => setOidcConfig((c) => ({ ...c, client_secret: e.target.value }))}
            placeholder={oidcConfig.client_secret_set ? '••••••••' : ''}
          />
        </MAdminField>
        <MAdminButton busy={savingOidc} onClick={onSave}>
          {t('common.save')}
        </MAdminButton>
      </div>
    </MAdminCard>
  );
}
