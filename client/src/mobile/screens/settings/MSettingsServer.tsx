import { Server } from 'lucide-react';

import { useNativeServer } from '../../../components/Settings/useNativeServer';
import { useTranslation } from '../../../i18n';
import { MSetButton, MSetCard, MSetHint } from './MSettingsUi';

/** Only inside the iOS/Android app: which server it talks to, and the way to another one. */
export default function MSettingsServer() {
  const { t } = useTranslation();
  const { host, changeServer, privacyUrl } = useNativeServer();
  if (!host) return null;
  return (
    <MSetCard title={t('native.settings.server')} icon={Server} className="mb-3">
      <MSetHint className="mb-3 mt-0">{t('native.settings.serverHint', { server: host })}</MSetHint>
      <MSetButton variant="ghost" onClick={changeServer}>
        {t('native.changeServer')}
      </MSetButton>
      <a
        href={privacyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 block text-center text-caption text-m-muted underline"
      >
        {t('native.privacy')}
      </a>
    </MSetCard>
  );
}
