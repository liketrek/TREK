import { FileKey } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from '../../../i18n';
import {
  removeClientCertificate,
  replaceClientCertificate,
  storedClientCertificate,
} from '../../../native/clientCertificate';
import { TrekShell, type ClientCertificateFailure, type ClientCertificateInfo } from '../../../native/trekShell';
import MConfirmSheet from './MConfirmSheet';
import { MSetButton, MSetCard, MSetHint, MSetRow } from './MSettingsUi';

const FAILURE_KEYS: Record<ClientCertificateFailure, string> = {
  format: 'native.cert.errorFormat',
  no_key: 'native.cert.errorNoKey',
  expired: 'native.cert.errorExpired',
  not_yet_valid: 'native.cert.errorNotYetValid',
  store: 'native.cert.errorStore',
};

/**
 * The client certificate the app shows to a server behind mutual TLS, inside
 * the app only and only once one is stored: someone without a proxy that asks
 * for one never needs to see this. Replacing or removing it reloads the server,
 * so the next connection uses what is stored now.
 */
export default function MClientCertCard() {
  const { t, locale } = useTranslation();
  const [certificate, setCertificate] = useState<ClientCertificateInfo | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    void storedClientCertificate().then((found) => {
      if (live) setCertificate(found);
    });
    return () => {
      live = false;
    };
  }, []);

  if (!certificate) return null;

  const replace = async () => {
    setProblem(null);
    setBusy(true);
    const { url } = await TrekShell.getServer();
    const outcome = await replaceClientCertificate(url ?? `https://${certificate.host}:${certificate.port}`, {
      title: t('native.cert.passwordTitle'),
      message: t('native.cert.passwordMessage'),
      placeholder: t('native.cert.passwordPlaceholder'),
      ok: t('native.cert.passwordOk'),
      cancel: t('native.cert.passwordCancel'),
      wrongPassword: t('native.cert.passwordWrong'),
    });
    setBusy(false);
    if (outcome.result === 'imported') {
      await TrekShell.reload();
    } else if (outcome.result === 'failed') {
      setProblem(t(FAILURE_KEYS[outcome.failure ?? 'format']));
    }
  };

  const remove = async () => {
    setConfirmRemove(false);
    if (await removeClientCertificate()) await TrekShell.reload();
  };

  const validUntil = new Date(certificate.notAfter).toLocaleDateString(locale, { dateStyle: 'medium' });

  return (
    <MSetCard title={t('native.cert.settingTitle')} icon={FileKey} className="mt-3">
      <div className="-mt-[4px]">
        <MSetRow
          first
          label={certificate.subject}
          sub={t('native.cert.settingIssuer', { issuer: certificate.issuer })}
        />
        <MSetRow label={t('native.cert.settingServer')} sub={certificate.host} />
        <MSetRow label={t('native.cert.settingValidUntil')} sub={validUntil} />
      </div>
      <MSetHint>{t('native.cert.settingHint', { host: certificate.host })}</MSetHint>
      {problem && (
        <p role="alert" className="mt-2 text-caption text-[color:var(--m-st-danger)]">
          {problem}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <MSetButton variant="ghost" disabled={busy} onClick={() => void replace()}>
          {t('native.cert.settingReplace')}
        </MSetButton>
        <MSetButton variant="danger" disabled={busy} onClick={() => setConfirmRemove(true)}>
          {t('native.cert.settingRemove')}
        </MSetButton>
      </div>
      <MConfirmSheet
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        title={t('native.cert.removeTitle')}
        message={t('native.cert.removeMessage', { host: certificate.host })}
        confirmLabel={t('native.cert.settingRemove')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => void remove()}
      />
    </MSetCard>
  );
}
