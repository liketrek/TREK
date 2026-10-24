import {
  WANDERER_TOKEN_MASK,
  WANDERER_TOKEN_PREFIX,
  type WandererConnection,
  type WandererTestResponse,
} from '@trek/shared';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '../../i18n';
import { wandererErrorCode, wandererRepo } from '../../repo/wandererRepo';
import { useToast } from '../shared/Toast';
import { wandererErrorText } from '../Tours/wanderer/wandererErrors';

/** What the last test found, said in the card; null before a test. */
export interface WandererProbe {
  ok: boolean;
  message: string;
}

type Translate = (key: string, params?: Record<string, unknown>) => string;

/** What a test answered, as the line the card shows under its buttons. */
function probeOf(result: WandererTestResponse, t: Translate): WandererProbe {
  if (!result.ok) return { ok: false, message: wandererErrorText(t, result.code ?? 'unknown') };
  const message =
    result.trailCount != null ? t('wanderer.test.okCount', { count: result.trailCount }) : t('wanderer.test.ok');
  return { ok: true, message };
}

/**
 * The wanderer connection card's logic: the form, saving, testing and
 * disconnecting, with every failure turned into a sentence the reader can act
 * on. The token field is never filled from the server; blank keeps the stored one.
 */
export function useWandererConnection() {
  const { t } = useTranslation();
  const toast = useToast();
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const [allowInsecureTls, setAllowInsecureTls] = useState(false);
  const [saved, setSaved] = useState<WandererConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [probe, setProbe] = useState<WandererProbe | null>(null);

  const errorText = useCallback((code: string) => wandererErrorText(t, code), [t]);

  const apply = useCallback((connection: WandererConnection) => {
    setSaved(connection);
    setUrl(connection.url);
    setAllowInsecureTls(connection.allowInsecureTls);
    setToken('');
  }, []);

  useEffect(() => {
    let cancelled = false;
    wandererRepo
      .getSettings()
      .then((connection) => {
        if (!cancelled) apply(connection);
      })
      .catch(() => {
        if (!cancelled) toast.error(t('wanderer.loadFailed'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apply, t, toast]);

  const typedToken = token.trim();
  /** A typed token that wanderer would read as no token at all, said before it is sent. */
  const tokenInvalid =
    typedToken !== '' && typedToken !== WANDERER_TOKEN_MASK && !typedToken.startsWith(WANDERER_TOKEN_PREFIX);
  const connected = !!saved?.connected;
  const canSave = !!url.trim() && !tokenInvalid && (connected || typedToken !== '');

  const save = useCallback(async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const result = await wandererRepo.saveSettings({
        url: url.trim(),
        token: typedToken || undefined,
        allowInsecureTls,
      });
      apply(await wandererRepo.getSettings());
      setProbe(null);
      toast.success(t('wanderer.saved'));
      if (result.warning === 'private_ip') toast.info(t('wanderer.privateIp'));
    } catch (error: unknown) {
      toast.error(errorText(wandererErrorCode(error)));
    } finally {
      setSaving(false);
    }
  }, [allowInsecureTls, apply, canSave, errorText, t, toast, typedToken, url]);

  const test = useCallback(async () => {
    if (!url.trim() || tokenInvalid) return;
    setTesting(true);
    try {
      const result = await wandererRepo.test({ url: url.trim(), token: typedToken || undefined, allowInsecureTls });
      setProbe(probeOf(result, t));
      if (!typedToken) setSaved(await wandererRepo.getSettings());
    } catch (error: unknown) {
      setProbe({ ok: false, message: errorText(wandererErrorCode(error)) });
    } finally {
      setTesting(false);
    }
  }, [allowInsecureTls, errorText, t, tokenInvalid, typedToken, url]);

  const disconnect = useCallback(async () => {
    setSaving(true);
    try {
      await wandererRepo.disconnect();
      apply(await wandererRepo.getSettings());
      setProbe(null);
      toast.success(t('wanderer.disconnected'));
    } catch (error: unknown) {
      toast.error(errorText(wandererErrorCode(error)));
    } finally {
      setSaving(false);
    }
  }, [apply, errorText, t, toast]);

  const lastCheck =
    saved?.lastCheckedAt && saved.lastCheckOk === false && saved.lastCheckError
      ? errorText(saved.lastCheckError)
      : null;
  /**
   * Changes whenever the server's view of the connection does: connecting,
   * disconnecting, a saved token (which clears the last check) or a test that
   * stored a new result. The watch row re-reads itself on it, since each of
   * those can lift or set its "token refused" state.
   */
  const checkKey = `${connected}|${saved?.lastCheckedAt ?? ''}|${saved?.lastCheckOk ?? ''}`;

  return {
    url,
    setUrl,
    token,
    setToken,
    allowInsecureTls,
    toggleInsecureTls: () => setAllowInsecureTls((value) => !value),
    connected,
    loading,
    saving,
    testing,
    probe,
    tokenInvalid,
    canSave,
    lastCheck,
    checkKey,
    save,
    test,
    disconnect,
  };
}
