import { ClipboardPaste, ExternalLink, Globe, Loader2 } from 'lucide-react';
import React, { useId } from 'react';
import { useTranslation } from '../../../i18n';
import { CHATGPT_USAGE_URL, providerLabel } from '../../Assistant/providerCatalog';
import { fs } from '../../shared/DialogShell';
import { INPUT } from '../../shared/dialogParts';
import { SETTINGS_BUTTON, SETTINGS_BUTTON_PRIMARY, SettingsHint } from '../settingsKit';
import type { ConnectError, useChatgptConnect } from './useAiConnect';

type ChatgptConnect = ReturnType<typeof useChatgptConnect>;

/** The sign-in window: small, beside TREK, without access back to this page. */
const POPUP_FEATURES = 'popup,width=520,height=760,noopener,noreferrer';

/** A numbered step: the number, what to do, and the control that does it. */
function Step({ n, text, children }: { n: number; text: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span
        className="grid h-6 w-6 flex-none place-items-center rounded-full bg-surface-tertiary font-semibold tabular-nums text-content-secondary"
        style={fs(11.5, 'body')}
      >
        {n}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="m-0 leading-snug text-content" style={fs(12.5, 'body')}>
          {text}
        </p>
        {children}
      </div>
    </li>
  );
}

/**
 * A refused connect in one line, with the one action that helps: another
 * provider for an account ChatGPT will not share, its usage page when the plan
 * ran out. Everything else is fixed by trying again in place.
 */
export function ConnectErrorNote({
  error,
  provider,
  onOtherProvider,
}: {
  error: ConnectError;
  provider: string;
  onOtherProvider?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div role="alert" className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <p className="m-0 min-w-0 flex-1 basis-48 leading-snug text-danger" style={fs(11.5)}>
        {t(error.messageKey, { provider })}
      </p>
      {error.code === 'not_eligible' && onOtherProvider && (
        <button
          type="button"
          onClick={onOtherProvider}
          className="font-medium text-content underline underline-offset-2"
          style={fs(12, 'body')}
        >
          {t('assistant.errorAction.otherProvider')}
        </button>
      )}
      {error.code === 'usage_limit' && (
        <a
          href={CHATGPT_USAGE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-content underline underline-offset-2"
          style={fs(12, 'body')}
        >
          {t('assistant.errorAction.viewUsage')}
        </a>
      )}
    </div>
  );
}

/**
 * The ChatGPT sign-in as two steps: open the sign-in (a prefetched link, so no
 * popup blocker), then paste the address the browser ends on. A pasted
 * address is sent at once; on a phone the button reads it off the clipboard.
 */
export default function ChatGptPasteStep({
  chatgpt,
  onOtherProvider,
}: {
  chatgpt: ChatgptConnect;
  onOtherProvider: () => void;
}) {
  const { t } = useTranslation();
  const inputId = useId();
  const { flow, markOpened, pasted, change, paste, pasteFromClipboard, submit, busy, error, inputRef } = chatgpt;

  return (
    <div className="flex flex-col gap-3">
      <ol className="m-0 flex list-none flex-col gap-3.5 p-0">
        <Step n={1} text={t('assistant.connect.chatgptStep1')}>
          <div className="flex">
            <a
              href={flow?.authorizeUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                // A small window over TREK: its last page is the one to copy from, and TREK stays in view.
                // With noopener the browser hands back no window, so a blocked one cannot be told apart.
                if (flow) {
                  e.preventDefault();
                  window.open(flow.authorizeUrl, 'trek-chatgpt', POPUP_FEATURES);
                }
                markOpened();
              }}
              aria-disabled={!flow}
              className={`${SETTINGS_BUTTON_PRIMARY} ${flow ? '' : 'pointer-events-none opacity-50'}`}
              style={fs(13, 'body')}
            >
              {flow ? <ExternalLink size={14} strokeWidth={2.2} /> : <Loader2 size={14} className="animate-spin" />}
              {t('assistant.connect.chatgptOpen')}
            </a>
          </div>
        </Step>
        <Step n={2} text={t('assistant.connect.chatgptStep2')}>
          {/* What the window ends on, so the error page is expected rather than alarming. */}
          <div
            aria-hidden="true"
            dir="ltr"
            className="flex min-w-0 items-center gap-2 rounded-full bg-surface-secondary px-3 py-1.5 font-mono text-content-muted"
            style={fs(11.5)}
          >
            <Globe size={12} className="flex-none text-content-faint" />
            <span className="truncate">
              <span className="rounded bg-accent-subtle px-1 text-content">127.0.0.1:1455/auth/callback?code=…</span>
            </span>
          </div>
          <div className="flex gap-2">
            <input
              id={inputId}
              ref={inputRef}
              type="url"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              dir="ltr"
              value={pasted}
              onChange={(e) => change(e.target.value)}
              onPaste={(e) => {
                if (paste(e.clipboardData.getData('text'))) e.preventDefault();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void submit();
                }
              }}
              placeholder="http://127.0.0.1:1455/auth/callback?code=…"
              aria-label={t('assistant.connect.chatgptPaste')}
              className={`${INPUT} font-mono`}
            />
            {pasted.trim() ? (
              <button
                type="button"
                onClick={() => void submit()}
                disabled={busy || !flow}
                className={SETTINGS_BUTTON_PRIMARY}
                style={fs(13, 'body')}
              >
                {busy && <Loader2 size={14} className="animate-spin" />}
                {t('assistant.connect.save')}
              </button>
            ) : (
              <button
                type="button"
                onClick={pasteFromClipboard}
                disabled={!flow}
                className={`${SETTINGS_BUTTON} whitespace-nowrap`}
                style={fs(13, 'body')}
              >
                <ClipboardPaste size={14} strokeWidth={2} />
                {t('assistant.connect.chatgptPaste')}
              </button>
            )}
          </div>
        </Step>
      </ol>
      {error && (
        <ConnectErrorNote error={error} provider={providerLabel('chatgpt', '')} onOtherProvider={onOtherProvider} />
      )}
      <SettingsHint>{t('assistant.setup.chatgptNote')}</SettingsHint>
    </div>
  );
}
