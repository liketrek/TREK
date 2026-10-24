import type { StorageTestResponse } from '@trek/shared';

import { useTranslation } from '../../i18n';

/**
 * The outcome of a storage backend test on the phone admin panel: a running
 * note while it is in flight, then the verdict with one line per target.
 * Renders nothing before the first test.
 */
export default function MStorageTestResult({ result }: { result: StorageTestResponse | 'running' | undefined }) {
  const { t } = useTranslation();
  if (result === 'running') {
    return <p className="mt-2 font-geist text-[0.625rem] text-m-muted">{t('storage.test.running')}</p>;
  }
  if (!result) return null;
  return (
    <div className="mt-2 space-y-0.5">
      <p className="text-[0.75rem] font-bold text-m-ink">
        {result.ok ? t('storage.test.ok') : t('storage.test.failed')}
      </p>
      {result.targets.map((target) => (
        <p key={target.name} className="font-geist text-[0.625rem] text-m-muted">
          {target.ok ? '✓' : '✗'} {target.name}
          {target.error ? ` — ${target.error}` : ''}
        </p>
      ))}
    </div>
  );
}
