import type { AiApiKeyKind, AiConnectionScope, AiParsingPrefill } from '@trek/shared';
import { ChevronRight, KeyRound, Loader2, Server, ShieldCheck } from 'lucide-react';
import React, { useId, useState } from 'react';
import { useTranslation } from '../../../i18n';
import { useAssistantStore } from '../../../store/assistantStore';
import { AI_PROVIDERS, API_KEY_KINDS, providerLabel } from '../../Assistant/providerCatalog';
import { fs } from '../../shared/DialogShell';
import { EditorField, GRID_2, INPUT } from '../../shared/dialogParts';
import { SETTINGS_BUTTON, SETTINGS_BUTTON_PRIMARY, SettingsHint, StatusPill } from '../settingsKit';
import ChatGptPasteStep, { ConnectErrorNote } from './ChatGptPasteStep';
import { type AiConnectMode } from './aiConnectModel';
import { useChatgptConnect, useCustomConnect, useKeyConnect, useOpenrouterStart } from './useAiConnect';

interface AiConnectPanelProps {
  /** A user's own connection, or the one the admin sets up for everyone. */
  scope: AiConnectionScope;
  onConnected: () => void;
  /** Opens on one way at once: the sign-in to renew, the key to replace. */
  initialMode?: AiConnectMode;
  /** What AI parsing runs on, filled into the instance form while it has no connection (R14). */
  prefill?: AiParsingPrefill | null;
}

/** The neutral letter tile a provider shows instead of a logo. */
export function ProviderMark({ kind, size = 'md' }: { kind: keyof typeof AI_PROVIDERS; size?: 'sm' | 'md' }) {
  const monogram = AI_PROVIDERS[kind].monogram;
  return (
    <span
      className={`grid flex-none place-items-center bg-surface-tertiary font-bold text-content-secondary ${
        size === 'sm' ? 'h-7 w-7 rounded-lg' : 'h-8 w-8 rounded-[10px]'
      }`}
      style={fs(size === 'sm' ? 12 : 13, 'body')}
      aria-hidden
    >
      {monogram ?? <Server size={15} strokeWidth={2} />}
    </span>
  );
}

/** The key tile's mark, in the provider tiles' shape. */
function KeyMark() {
  return (
    <span
      className="grid h-8 w-8 flex-none place-items-center rounded-[10px] bg-surface-tertiary text-content-secondary"
      aria-hidden
    >
      <KeyRound size={15} strokeWidth={2} />
    </span>
  );
}

/** One way to connect, as a tile that opens its form below the pair. */
function ModeTile({
  active,
  onClick,
  mark,
  title,
  subtitle,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  mark: React.ReactNode;
  title: string;
  subtitle: string;
  badge?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex min-w-0 items-start gap-3 rounded-xl border bg-surface-card p-3 text-start transition-colors ${active ? 'border-[color:var(--text-primary)] shadow-sm' : 'border-edge hover:border-edge-secondary'}`}
    >
      {mark}
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="font-semibold text-content" style={fs(13, 'body')}>
            {title}
          </span>
          {badge}
        </span>
        <span className="mt-0.5 block leading-snug text-content-faint" style={fs(11.5)}>
          {subtitle}
        </span>
      </span>
    </button>
  );
}

/**
 * The four providers a key can be for, as a quiet two-by-two grid: the mark,
 * the name and what it costs. Before a key is pasted each one links to where
 * its keys are made and remembers the choice; for a pasted key whose prefix
 * we don't know the same grid asks which provider it belongs to.
 */
function ProviderChips({
  ask,
  picked,
  onPick,
}: {
  ask: boolean;
  picked: AiApiKeyKind | null;
  onPick: (kind: AiApiKeyKind) => void;
}) {
  const { t } = useTranslation();
  const tile = (kind: AiApiKeyKind) =>
    `flex min-w-0 items-center gap-2 rounded-lg border px-2 py-1.5 text-start transition-colors hover:bg-surface-hover ${
      picked === kind
        ? 'border-accent bg-surface-card ring-1 ring-accent'
        : 'border-edge-faint bg-surface-card hover:border-edge'
    }`;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-geist font-bold uppercase tracking-[.08em] text-content-faint" style={fs(9.5)}>
        {t(ask ? 'assistant.connect.whichProvider' : 'assistant.connect.getKey')}
      </span>
      <div className="grid grid-cols-2 gap-1.5">
        {API_KEY_KINDS.map((kind) => {
          const info = AI_PROVIDERS[kind];
          const body = (
            <>
              <ProviderMark kind={kind} size="sm" />
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-medium text-content" style={fs(12.5, 'body')}>
                  {info.label}
                </span>
                <span className={`truncate ${info.free ? 'text-success' : 'text-content-muted'}`} style={fs(11)}>
                  {t(info.free ? 'assistant.connect.free' : 'assistant.connect.paid')}
                </span>
              </span>
            </>
          );
          return ask ? (
            <button key={kind} type="button" onClick={() => onPick(kind)} className={tile(kind)}>
              {body}
            </button>
          ) : (
            <a
              key={kind}
              href={info.keyUrl ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onPick(kind)}
              aria-current={picked === kind ? 'true' : undefined}
              className={tile(kind)}
            >
              {body}
            </a>
          );
        })}
      </div>
    </div>
  );
}

/** The key field (K2): the prefix names the provider, a paste tests the key at once. */
function KeyForm({ scope, keyConnect }: { scope: AiConnectionScope; keyConnect: ReturnType<typeof useKeyConnect> }) {
  const { t } = useTranslation();
  const fieldId = useId();
  const { key, kind, detected, picked, change, paste, pick, submit, testing, error, needsProvider } = keyConnect;
  const openrouter = useOpenrouterStart(scope);
  const openrouterOAuth = useAssistantStore((s) => s.status?.openrouterOAuth ?? false);
  // Only a key that names its provider is "detected"; a chosen tile just stays selected below.
  const info = detected ? AI_PROVIDERS[detected] : null;

  return (
    <div className="flex flex-col gap-3">
      <EditorField label={t('assistant.connect.key')} htmlFor={fieldId}>
        <div className="flex gap-2">
          <input
            id={fieldId}
            type="password"
            autoComplete="off"
            spellCheck={false}
            dir="ltr"
            value={key}
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
            placeholder={t('assistant.connect.keyPlaceholder')}
            className={`${INPUT} font-mono`}
          />
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!kind || testing}
            className={`${SETTINGS_BUTTON_PRIMARY} whitespace-nowrap`}
            style={fs(13, 'body')}
          >
            {testing && <Loader2 size={14} className="animate-spin" />}
            {testing ? t('assistant.connect.testing') : t('assistant.connect.save')}
          </button>
        </div>
      </EditorField>

      {info?.label ? (
        <div className="flex items-start gap-2.5">
          <ProviderMark kind={info.kind} />
          <div className="min-w-0 flex-1">
            <p className="m-0 font-medium text-content" style={fs(12.5, 'body')}>
              {t('assistant.connect.detected', { provider: info.label })}
            </p>
            {info.kind !== 'openrouter' && <SettingsHint>{t(info.hintKey)}</SettingsHint>}
          </div>
        </div>
      ) : (
        <ProviderChips ask={needsProvider} picked={picked} onPick={pick} />
      )}

      {error && <ConnectErrorNote error={error} provider={kind ? (AI_PROVIDERS[kind].label ?? '') : ''} />}

      {/* OpenRouter can hand over a key itself, but only back to an https address. */}
      {openrouterOAuth && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-edge-faint pt-3">
          <button
            type="button"
            onClick={() => void openrouter.start()}
            disabled={openrouter.busy}
            className={SETTINGS_BUTTON}
            style={fs(13, 'body')}
          >
            {openrouter.busy ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <span className="font-bold text-content-secondary" aria-hidden>
                {AI_PROVIDERS.openrouter.monogram}
              </span>
            )}
            {t('assistant.connect.openrouter')}
          </button>
          <SettingsHint>{t('assistant.connect.hintOpenrouter')}</SettingsHint>
        </div>
      )}
    </div>
  );
}

/** An own OpenAI-compatible server, for the instance only (#1772). */
function CustomForm({ custom }: { custom: ReturnType<typeof useCustomConnect> }) {
  const { t } = useTranslation();
  const fieldId = useId();
  return (
    <div className="flex flex-col gap-3">
      <EditorField
        label={t('assistant.admin.baseUrl')}
        htmlFor={`${fieldId}-url`}
        hint={t('assistant.admin.customHint')}
      >
        <input
          id={`${fieldId}-url`}
          type="url"
          autoComplete="off"
          spellCheck={false}
          dir="ltr"
          className={INPUT}
          value={custom.baseUrl}
          onChange={(e) => custom.setBaseUrl(e.target.value)}
          placeholder="http://localhost:11434/v1"
        />
      </EditorField>
      <div className={GRID_2}>
        <EditorField label={t('assistant.admin.apiKeyOptional')} htmlFor={`${fieldId}-key`}>
          <input
            id={`${fieldId}-key`}
            type="password"
            autoComplete="off"
            dir="ltr"
            className={`${INPUT} font-mono`}
            value={custom.apiKey}
            onChange={(e) => custom.setApiKey(e.target.value)}
          />
        </EditorField>
        <EditorField label={t('assistant.connect.model')} htmlFor={`${fieldId}-model`}>
          <input
            id={`${fieldId}-model`}
            autoComplete="off"
            spellCheck={false}
            dir="ltr"
            className={`${INPUT} font-geist`}
            value={custom.model}
            onChange={(e) => custom.setModel(e.target.value)}
            placeholder="qwen3:8b"
          />
        </EditorField>
      </div>
      {custom.error && <ConnectErrorNote error={custom.error} provider={custom.host} />}
      <div className="flex">
        <button
          type="button"
          onClick={() => void custom.submit()}
          disabled={!custom.ready || custom.saving}
          className={SETTINGS_BUTTON_PRIMARY}
          style={fs(13, 'body')}
        >
          {custom.saving && <Loader2 size={14} className="animate-spin" />}
          {custom.saving ? t('assistant.connect.testing') : t('assistant.connect.save')}
        </button>
      </div>
    </div>
  );
}

/**
 * What leaves TREK, said before anything is saved: the provider by name once
 * it is known, and the three lines behind "What gets shared?".
 */
function PrivacyNote({ provider }: { provider: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-[12px] bg-surface-tertiary px-3 py-2.5">
      {provider && (
        <p className="m-0 mb-1.5 leading-snug text-content-secondary" style={fs(12, 'body')}>
          {t('assistant.privacy.banner', { provider })}
        </p>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 font-medium text-content-muted hover:text-content"
        style={fs(12, 'body')}
      >
        <ShieldCheck size={13} strokeWidth={2.2} />
        {t('assistant.privacy.what')}
        <ChevronRight
          size={13}
          strokeWidth={2.2}
          className={`transition-transform ${open ? 'rotate-90' : 'rtl:rotate-180'}`}
        />
      </button>
      {open && (
        <ul className="m-0 mt-2 flex list-disc flex-col gap-1 ps-5 text-content-faint" style={fs(11.5)}>
          <li>{t('assistant.privacy.shared')}</li>
          <li>{t('assistant.privacy.notShared')}</li>
          {provider && <li>{t('assistant.privacy.provider', { provider })}</li>}
        </ul>
      )}
    </div>
  );
}

/**
 * The ways each scope offers. An own server is never a user's (#1772). An
 * admin may share their own ChatGPT plan with everyone: whether their plan and
 * OpenAI's terms allow that is theirs to judge, and the form says so.
 */
const SCOPE_MODES: Record<AiConnectionScope, readonly AiConnectMode[]> = {
  user: ['chatgpt', 'key'],
  instance: ['key', 'chatgpt', 'custom'],
};

const MODE_TILES: Record<
  AiConnectMode,
  { titleKey: string; subtitleKey: string; mark: React.ReactNode; beta?: boolean }
> = {
  chatgpt: {
    titleKey: 'assistant.connect.chatgpt',
    subtitleKey: 'assistant.connect.chatgptHint',
    mark: <ProviderMark kind="chatgpt" />,
    beta: true,
  },
  key: { titleKey: 'assistant.connect.key', subtitleKey: 'assistant.setup.keySubtitle', mark: <KeyMark /> },
  custom: {
    titleKey: 'assistant.admin.custom',
    subtitleKey: 'assistant.admin.customHint',
    mark: <ProviderMark kind="custom" />,
  },
};

/** The form a prefill from AI parsing opens on. */
function prefillModeOf(prefill: AiParsingPrefill | null): AiConnectMode | null {
  if (!prefill) return null;
  return prefill.kind === 'custom' ? 'custom' : 'key';
}

/**
 * Connecting a provider in under a minute: a tile for each way, and the form
 * of the one picked below them. A user picks between signing in with ChatGPT
 * and pasting a key; the admin, setting up the connection for everyone, between
 * a key, their own ChatGPT plan and an own server. An own server is never named
 * by a user (#1772): the server refuses it, so it is not offered.
 */
export default function AiConnectPanel({ scope, onConnected, initialMode, prefill = null }: AiConnectPanelProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<AiConnectMode | null>(() => {
    const first = initialMode ?? prefillModeOf(prefill);
    return first && SCOPE_MODES[scope].includes(first) ? first : null;
  });
  const chatgpt = useChatgptConnect({ active: mode === 'chatgpt', onConnected, scope });
  const keyConnect = useKeyConnect({ scope, prefill, onConnected });
  const custom = useCustomConnect({ prefill, onConnected });

  // The privacy line names whoever would receive the messages, once that is known.
  const receivers: Record<AiConnectMode, string> = {
    chatgpt: providerLabel('chatgpt', ''),
    key: keyConnect.kind ? providerLabel(keyConnect.kind, '') : '',
    custom: custom.host,
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="m-0 font-medium text-content" style={fs(13, 'body')}>
        {t('assistant.setup.question')}
      </p>
      <div
        role="group"
        aria-label={t('assistant.setup.question')}
        className="grid grid-cols-2 gap-2 max-sm:grid-cols-1"
      >
        {SCOPE_MODES[scope].map((m) => {
          const tile = MODE_TILES[m];
          return (
            <ModeTile
              key={m}
              active={mode === m}
              onClick={() => setMode(m)}
              mark={tile.mark}
              title={t(tile.titleKey)}
              subtitle={t(tile.subtitleKey)}
              badge={tile.beta ? <StatusPill>{t('assistant.setup.beta')}</StatusPill> : undefined}
            />
          );
        })}
      </div>
      {scope === 'instance' && prefill && <SettingsHint>{t('assistant.admin.prefilled')}</SettingsHint>}

      {mode === 'chatgpt' && scope === 'instance' && (
        // Sharing one person's plan with everyone is the admin's call to make; TREK only says what it means.
        <p
          role="note"
          className="m-0 rounded-lg bg-warning-soft px-3 py-2 leading-snug text-content"
          style={fs(12, 'body')}
        >
          {t('assistant.admin.chatgptShared')}
        </p>
      )}
      {mode === 'chatgpt' && <ChatGptPasteStep chatgpt={chatgpt} onOtherProvider={() => setMode('key')} />}
      {mode === 'key' && <KeyForm scope={scope} keyConnect={keyConnect} />}
      {mode === 'custom' && <CustomForm custom={custom} />}

      <PrivacyNote provider={mode ? receivers[mode] : ''} />
    </div>
  );
}
