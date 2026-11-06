/**
 * AppLockGate: covers TREK until Face ID, Touch ID or the passcode unlocks it,
 * when the app lock is on (native/appLock.ts). It locks at launch and again
 * after the app spent more than half a minute in the background, and asks at
 * once rather than waiting for a tap; the button is there for a second try.
 * Rendered once in App; outside the app, or with the lock off, it is nothing.
 */
import { App } from '@capacitor/app';
import { Lock } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from '../../i18n';
import { RELOCK_AFTER_MS, isAppLockEnabled, unlockApp } from '../../native/appLock';
import { useNativeCapabilities } from '../../native/capabilities';

export default function AppLockGate(): React.ReactElement | null {
  const { t } = useTranslation();
  // Re-read once the binary has said what it can do.
  const { caps } = useNativeCapabilities();
  const [locked, setLocked] = useState(false);
  const asking = useRef(false);
  const backgroundSince = useRef<number | null>(null);

  const ask = useCallback(async () => {
    if (asking.current) return;
    asking.current = true;
    const ok = await unlockApp(t('native.lock.reason'));
    asking.current = false;
    if (ok) setLocked(false);
  }, [t]);

  // At launch, once the capabilities are known.
  useEffect(() => {
    if (!isAppLockEnabled()) return;
    setLocked(true);
    void ask();
  }, [caps, ask]);

  // Back from the background after a while.
  useEffect(() => {
    if (!isAppLockEnabled()) return;
    const listener = App.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) {
        backgroundSince.current = Date.now();
        return;
      }
      const since = backgroundSince.current;
      backgroundSince.current = null;
      if (since != null && Date.now() - since > RELOCK_AFTER_MS) {
        setLocked(true);
        void ask();
      }
    });
    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, [caps, ask]);

  if (!locked) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('native.lock.title')}
      className="fixed inset-0 z-[calc(var(--z-toast)+1)] flex flex-col items-center justify-center gap-5 bg-surface p-8 text-center backdrop-blur-2xl"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-card text-content shadow-lg">
        <Lock size={26} strokeWidth={2} aria-hidden="true" />
      </span>
      <p className="text-title font-semibold text-content">{t('native.lock.title')}</p>
      <button
        type="button"
        onClick={() => void ask()}
        className="rounded-full bg-accent px-6 py-3 text-body font-semibold text-accent-text transition-transform active:scale-[.98]"
      >
        {t('native.lock.unlock')}
      </button>
    </div>
  );
}
