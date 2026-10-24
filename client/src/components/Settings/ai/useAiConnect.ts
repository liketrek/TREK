import type { AiApiKeyKind, AiAuthStartResponse, AiConnectionScope, AiParsingPrefill } from '@trek/shared';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useTranslation } from '../../../i18n';
import { aiConnectionsRepo } from '../../../repo/aiConnectionsRepo';
import { detectKeyKind, isChatgptCallback, providerLabel } from '../../Assistant/providerCatalog';
import { useToast } from '../../shared/Toast';
import { connectErrorKey, httpHostOf, refusalCode, rememberOpenrouterFlow, takeOpenrouterFlow } from './aiConnectModel';

/**
 * The ways to connect a provider, one hook each, behind `AiConnectPanel`: a
 * pasted key (tested as it is pasted), an own server (admin only), the
 * ChatGPT sign-in that ends on a pasted address, and the OpenRouter sign-in
 * that leaves the page and comes back with a code.
 */

/** The schema's shortest key; anything shorter is still being typed. */
const MIN_KEY_LENGTH = 8;

/** A refusal shown under a form: the line, and the code it came from for the one action it offers. */
export interface ConnectError {
  messageKey: string;
  code: string | null;
}

const OPENROUTER = providerLabel('openrouter', '');

export function useKeyConnect({
  scope,
  prefill,
  onConnected,
}: {
  scope: AiConnectionScope;
  /** What AI parsing runs on: its model is kept when the key is for the same provider. */
  prefill: AiParsingPrefill | null;
  onConnected: () => void;
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const [key, setKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<ConnectError | null>(null);
  // The provider the user named, by opening its key page or answering "which provider?":
  // it stands in when a key's prefix is one we don't know, so a new key format never locks anyone out.
  const [picked, setPicked] = useState<AiApiKeyKind | null>(null);
  const kindOf = (value: string) => detectKeyKind(value) ?? picked;
  const kind = kindOf(key);

  const submit = async (raw: string, target = kindOf(raw.trim())) => {
    const apiKey = raw.trim();
    if (testing || !target || apiKey.length < MIN_KEY_LENGTH) return;
    setTesting(true);
    setError(null);
    const model = prefill?.kind === target ? { model: prefill.model } : {};
    try {
      // Saving is the test: the server lists the provider's models with the key first.
      if (scope === 'user') await aiConnectionsRepo.connectKey({ kind: target, apiKey, ...model });
      else await aiConnectionsRepo.saveAdminConnection({ kind: target, apiKey, ...model });
      setKey('');
      setPicked(null);
      toast.success(t('assistant.connect.ok'));
      onConnected();
    } catch (err) {
      setError({ messageKey: connectErrorKey(err), code: refusalCode(err) });
    } finally {
      setTesting(false);
    }
  };

  const change = (value: string) => {
    setKey(value);
    setError(null);
  };

  /** A pasted key whose provider is known is tested at once; true when it was taken. */
  const paste = (text: string): boolean => {
    const value = text.trim();
    if (value.length < MIN_KEY_LENGTH || !kindOf(value)) return false;
    setKey(value);
    void submit(value);
    return true;
  };

  /** Names the provider; with a complete key already in the field, that tests it right away. */
  const pick = (next: AiApiKeyKind) => {
    setPicked(next);
    setError(null);
    if (!detectKeyKind(key)) void submit(key, next);
  };

  return {
    key,
    kind,
    /** The provider the pasted key itself names; what "Detected" may say. */
    detected: detectKeyKind(key),
    /** The provider tile the user chose, shown as selected. */
    picked,
    change,
    paste,
    pick,
    submit: () => submit(key),
    testing,
    error,
    /** A full key whose prefix names no provider: the form asks which one it is. */
    needsProvider: !kind && key.trim().length >= MIN_KEY_LENGTH,
  };
}

/** An OpenAI-compatible server only the admin may name (#1772): its address, an optional key and the model. */
export function useCustomConnect({
  prefill,
  onConnected,
}: {
  prefill: AiParsingPrefill | null;
  onConnected: () => void;
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const fromParsing = prefill?.kind === 'custom' ? prefill : null;
  const [baseUrl, setBaseUrl] = useState(fromParsing?.baseUrl ?? '');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(fromParsing?.model ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ConnectError | null>(null);

  const host = httpHostOf(baseUrl);
  const ready = host !== '' && model.trim() !== '';

  const submit = async () => {
    if (!ready || saving) return;
    setSaving(true);
    setError(null);
    try {
      const key = apiKey.trim();
      await aiConnectionsRepo.saveAdminConnection({
        kind: 'custom',
        baseUrl: baseUrl.trim(),
        model: model.trim(),
        ...(key ? { apiKey: key } : {}),
      });
      toast.success(t('assistant.connect.ok'));
      onConnected();
    } catch (err) {
      setError({ messageKey: connectErrorKey(err), code: refusalCode(err) });
    } finally {
      setSaving(false);
    }
  };

  return { baseUrl, setBaseUrl, apiKey, setApiKey, model, setModel, host, ready, saving, error, submit };
}

/**
 * Hands `onText` what the clipboard holds where the browser lets the page read
 * it; where it does not, or the user refuses, `onUnreadable` runs instead.
 */
function readClipboard(onText: (text: string) => void, onUnreadable: () => void) {
  if (!navigator.clipboard?.readText || !window.isSecureContext) {
    onUnreadable();
    return;
  }
  navigator.clipboard.readText().then(onText, onUnreadable);
}

/** Runs `onBack` each time the user comes back to this tab while `watching` holds. */
function useOnReturnToTab(watching: boolean, onBack: () => void) {
  const back = useEffectEvent(onBack);
  useEffect(() => {
    if (!watching) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') back();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [watching]);
}

/**
 * Signing in with ChatGPT (K3). The sign-in address is fetched as soon as the
 * step shows, so opening it is a plain link and no popup blocker interferes.
 * ChatGPT then sends the browser to a loopback address that shows an error
 * page; pasting that address back finishes the sign-in at once, and coming
 * back to this tab puts the cursor in the field.
 */
export function useChatgptConnect({
  active,
  onConnected,
  scope = 'user',
}: {
  active: boolean;
  onConnected: () => void;
  /** The admin's sign-in shares their plan with everyone here. */
  scope?: AiConnectionScope;
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const [attempt, setAttempt] = useState(0);
  const [flow, setFlow] = useState<AiAuthStartResponse | null>(null);
  const [opened, setOpened] = useState(false);
  const [pasted, setPasted] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ConnectError | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    void aiConnectionsRepo.chatgptStart(scope).then(
      (next) => {
        if (!cancelled) setFlow(next);
      },
      (err: unknown) => {
        if (!cancelled) setError({ messageKey: connectErrorKey(err), code: refusalCode(err) });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [active, attempt, scope]);

  /** A fresh sign-in: the old one ran out or was used up. */
  const restart = () => {
    setFlow(null);
    setOpened(false);
    setPasted('');
    setAttempt((n) => n + 1);
  };

  const finish = async (raw: string) => {
    const url = raw.trim();
    if (!flow || busy) return;
    if (!isChatgptCallback(url)) {
      setError({ messageKey: 'assistant.connect.chatgptWrong', code: 'wrong_url' });
      return;
    }
    if (Date.parse(flow.expiresAt) <= Date.now()) {
      setError({ messageKey: 'assistant.connect.chatgptExpired', code: 'expired' });
      restart();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await aiConnectionsRepo.chatgptFinish({ flowId: flow.flowId, pastedUrl: url });
      toast.success(t('assistant.connect.ok'));
      onConnected();
    } catch (err) {
      const code = refusalCode(err);
      setError({ messageKey: connectErrorKey(err), code });
      if (code === 'expired') restart();
    } finally {
      setBusy(false);
    }
  };

  const change = (value: string) => {
    setPasted(value);
    setError(null);
  };

  /** The callback address pasted into the field is sent without a click; true when it was taken. */
  const paste = (text: string): boolean => {
    if (!isChatgptCallback(text)) return false;
    setPasted(text.trim());
    void finish(text);
    return true;
  };

  const focusField = () => inputRef.current?.focus();

  /** Reads the address off the clipboard where the browser allows it, else hands the field the cursor. */
  const pasteFromClipboard = () =>
    readClipboard((text) => {
      if (!paste(text)) change(text);
    }, focusField);

  // Back from the sign-in window: the address the user just copied is taken
  // off the clipboard where the browser allows it, else the field has the cursor.
  useOnReturnToTab(opened, () => {
    if (pasted.trim() || busy) return;
    readClipboard((text) => {
      if (!paste(text)) focusField();
    }, focusField);
  });

  return {
    flow,
    opened,
    markOpened: () => setOpened(true),
    pasted,
    change,
    paste,
    pasteFromClipboard,
    submit: () => finish(pasted),
    busy,
    error,
    restart,
    inputRef,
  };
}

/** Starts the OpenRouter sign-in: the page leaves for OpenRouter and returns to the settings or the admin addons. */
export function useOpenrouterStart(scope: AiConnectionScope) {
  const { t } = useTranslation();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const start = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const flow = await aiConnectionsRepo.openrouterStart(scope);
      rememberOpenrouterFlow(flow.flowId);
      window.location.assign(flow.authorizeUrl);
    } catch (err) {
      toast.error(t(connectErrorKey(err), { provider: OPENROUTER }));
      setBusy(false);
    }
  };

  return { start, busy };
}

/**
 * Finishes an OpenRouter sign-in the page came back from (`?ai=openrouter&code=…`)
 * once, and takes both parameters out of the address so a reload does not try again.
 */
export function useOpenrouterReturn(onConnected: () => void) {
  const { t } = useTranslation();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const handled = useRef(false);

  const finish = useEffectEvent(async (code: string | null) => {
    const flowId = takeOpenrouterFlow();
    if (!code || !flowId) {
      toast.error(t('assistant.connect.chatgptExpired'));
      return;
    }
    try {
      await aiConnectionsRepo.openrouterFinish({ flowId, code });
      toast.success(t('assistant.connect.ok'));
      onConnected();
    } catch (err) {
      toast.error(t(connectErrorKey(err), { provider: OPENROUTER }));
    }
  });

  useEffect(() => {
    if (handled.current || params.get('ai') !== 'openrouter') return;
    handled.current = true;
    const code = params.get('code');
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('ai');
        next.delete('code');
        return next;
      },
      { replace: true }
    );
    void finish(code);
  }, [params, setParams]);
}
