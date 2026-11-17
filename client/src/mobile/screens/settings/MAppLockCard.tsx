import { ScanFace } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from '../../../i18n';
import {
  appLockSupported,
  biometryAvailable,
  isAppLockEnabled,
  setAppLockEnabled,
  unlockApp,
} from '../../../native/appLock';
import MToggle from '../../components/MToggle';
import { MSetCard, MSetRow } from './MSettingsUi';

/**
 * The app lock switch, inside the app on a device that can unlock with Face ID,
 * Touch ID or its passcode. Turning it on asks once, so nobody locks themselves
 * out with a lock that does not work on this phone.
 */
export default function MAppLockCard() {
  const { t } = useTranslation();
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabled] = useState(isAppLockEnabled);

  useEffect(() => {
    if (!appLockSupported()) return;
    void biometryAvailable().then((info) => setAvailable(info.available));
  }, []);

  if (!available) return null;

  const toggle = async () => {
    if (enabled) {
      await setAppLockEnabled(false);
      setEnabled(false);
      return;
    }
    if (!(await unlockApp(t('native.lock.reason')))) return;
    await setAppLockEnabled(true);
    setEnabled(true);
  };

  return (
    <MSetCard title={t('native.lock.settingTitle')} icon={ScanFace} className="mt-3">
      <div className="-mt-[4px]">
        <MSetRow
          first
          label={t('native.lock.setting')}
          hint={t('native.lock.settingHint')}
          trailing={<MToggle checked={enabled} onChange={() => void toggle()} ariaLabel={t('native.lock.setting')} />}
        />
      </div>
    </MSetCard>
  );
}
