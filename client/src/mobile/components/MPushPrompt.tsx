import { BellRing } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useWebPush } from '../../hooks/useWebPush';
import { useTranslation } from '../../i18n';
import { useNativeCapabilities } from '../../native/capabilities';
import { nativePushActive, nativePushEndpoint } from '../../native/push';
import { pushChannelOffered } from '../../push/webPush';
import { useAuthStore } from '../../store/authStore';
import MSheet from './MSheet';

/** Asked once per device; the settings' push card is where it is changed after. */
export const PUSH_PROMPT_KEY = 'trek.pushPromptShown';
/** Long enough that the app has opened and the user sees where they are first. */
export const PUSH_PROMPT_DELAY_MS = 2500;

function alreadyAsked(): boolean {
  try {
    return window.localStorage.getItem(PUSH_PROMPT_KEY) != null;
  } catch {
    // Without storage it would ask on every launch: better not at all.
    return true;
  }
}

function rememberAsked(): void {
  try {
    window.localStorage.setItem(PUSH_PROMPT_KEY, new Date().toISOString());
  } catch {
    // Nothing to keep it in; alreadyAsked says yes then anyway.
  }
}

/**
 * The app asks for notifications by itself, once, a moment after the user is
 * signed in: iOS shows its own question only when an app asks, and nobody went
 * looking for the switch in the settings. Only in the app, only where this
 * server offers push, and only while this device is not signed up yet. Turning
 * it on goes the way the settings' push card goes (useWebPush), which brings up
 * the system's question.
 *
 * It counts as asked once the user answers it, not when it opens: a sheet that
 * went under another one, or an app closed while it was up, asks again. And it
 * waits for the app's capabilities, which can arrive after the sign-in.
 */
export default function MPushPrompt(): React.ReactElement | null {
  const signedIn = useAuthStore((s) => s.isAuthenticated);
  const { caps } = useNativeCapabilities();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!signedIn || !nativePushActive() || alreadyAsked() || nativePushEndpoint()) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void pushChannelOffered().then((offered) => {
        if (cancelled || !offered || nativePushEndpoint() || alreadyAsked()) return;
        setOpen(true);
      });
    }, PUSH_PROMPT_DELAY_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [signedIn, caps]);

  const answered = () => {
    rememberAsked();
    setOpen(false);
  };
  return open ? <PushPromptSheet onClose={answered} /> : null;
}

function PushPromptSheet({ onClose }: { onClose: () => void }): React.ReactElement {
  const { t } = useTranslation();
  const push = useWebPush();
  const turnOn = () => {
    if (!push.on) push.toggle();
    onClose();
  };
  return (
    <MSheet open onClose={onClose} variant="bottom" ariaLabel={t('native.pushPrompt.title')}>
      <div className="flex flex-col items-center px-[22px] pb-5 pt-6 text-center">
        <span
          aria-hidden="true"
          className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--m-ic)] text-m-ink"
        >
          <BellRing size={26} strokeWidth={1.9} />
        </span>
        <h2 className="mb-2 text-[length:calc(18px*var(--fs-scale-title,1))] font-bold text-m-ink">
          {t('native.pushPrompt.title')}
        </h2>
        <p className="mb-5 text-[length:calc(14px*var(--fs-scale-body,1))] text-m-muted">
          {t('native.pushPrompt.body')}
        </p>
        <button
          type="button"
          onClick={turnOn}
          disabled={!push.canSwitch || push.busy}
          className="mb-2 w-full rounded-full bg-m-act py-3 text-[length:calc(15px*var(--fs-scale-body,1))] font-semibold text-m-actfg transition-transform active:scale-[.98] disabled:opacity-50"
        >
          {t('native.pushPrompt.enable')}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-full py-3 text-[length:calc(15px*var(--fs-scale-body,1))] font-medium text-m-muted"
        >
          {t('native.pushPrompt.later')}
        </button>
      </div>
    </MSheet>
  );
}
