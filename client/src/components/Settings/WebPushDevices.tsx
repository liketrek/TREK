import type { WebPushConfigResult, WebPushDevice } from '@trek/shared';
import React, { useCallback, useEffect, useState } from 'react';

import { notificationsApi } from '../../api/client';
import { useTranslation } from '../../i18n';
import {
  detectWebPushCapability,
  disableCurrentWebPush,
  enableWebPush,
  getWebPushInstallationId,
} from '../../services/webPush';
import { useToast } from '../shared/Toast';

export default function WebPushDevices(): React.ReactElement {
  const { t } = useTranslation();
  const toast = useToast();
  const [config, setConfig] = useState<WebPushConfigResult | null>(null);
  const [devices, setDevices] = useState<WebPushDevice[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const installationId = getWebPushInstallationId();
  const capability = detectWebPushCapability();

  const load = useCallback(async () => {
    const [nextConfig, result] = await Promise.all([
      notificationsApi.webPushConfig(),
      notificationsApi.webPushDevices(),
    ]);
    setConfig(nextConfig);
    setDevices(result.devices);
  }, []);
  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const current = devices.find((device) => device.installationId === installationId);
  const enable = async () => {
    setBusy('enable');
    try {
      await enableWebPush();
      toast.success(t('settings.webPush.enabled'));
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setBusy(null);
    }
  };
  const revoke = async (device: WebPushDevice) => {
    setBusy(`revoke:${device.id}`);
    try {
      if (device.installationId === installationId) await disableCurrentWebPush();
      else await notificationsApi.revokeWebPushDevice(device.id);
      toast.success(t('settings.webPush.revoked'));
      await load();
    } catch {
      toast.error(t('common.error'));
    } finally {
      setBusy(null);
    }
  };
  const rename = async (device: WebPushDevice) => {
    const label = window.prompt(t('settings.webPush.renamePrompt'), device.label)?.trim();
    if (!label || label === device.label) return;
    setBusy(`rename:${device.id}`);
    try {
      await notificationsApi.renameWebPushDevice(device.id, label);
      await load();
    } catch {
      toast.error(t('common.error'));
    } finally {
      setBusy(null);
    }
  };
  const test = async (device: WebPushDevice) => {
    setBusy(`test:${device.id}`);
    try {
      const result = await notificationsApi.testWebPushDevice(device.id);
      if (result.success) toast.success(t('settings.notificationPreferences.testSuccess'));
      else toast.error(result.error || t('settings.notificationPreferences.testFailed'));
    } catch {
      toast.error(t('settings.notificationPreferences.testFailed'));
    } finally {
      setBusy(null);
    }
  };

  if (!config) {
    return (
      <div
        aria-busy="true"
        aria-label={t('settings.webPush.title')}
        className="h-5 animate-pulse rounded bg-surface-subtle"
      />
    );
  }
  let guidance: string | null = null;
  if (!config.enabled) guidance = t('settings.webPush.adminDisabled');
  else if (!config.available) guidance = config.error || t('settings.webPush.unavailable');
  else if (capability === 'ios-install-required') guidance = t('settings.webPush.iosInstall');
  else if (capability === 'denied') guidance = t('settings.webPush.denied');
  else if (capability === 'unsupported') guidance = t('settings.webPush.unsupported');

  return (
    <div className="bg-surface-subtle mb-4 rounded-lg border border-edge p-4">
      <h3 className="text-sm font-semibold text-content">{t('settings.webPush.title')}</h3>
      <p className="mt-1 text-xs text-content-faint">{t('settings.webPush.description')}</p>
      {guidance && <p className="mt-3 text-xs text-content-muted">{guidance}</p>}
      {!current && !guidance && (
        <button
          type="button"
          onClick={enable}
          disabled={busy === 'enable'}
          className="mt-3 rounded-md bg-content px-3 py-2 text-xs font-medium text-surface disabled:opacity-50"
        >
          {busy === 'enable' ? t('settings.webPush.enabling') : t('settings.webPush.enable')}
        </button>
      )}
      {devices.length > 0 && (
        <div className="mt-4 space-y-2">
          {devices.map((device) => (
            <div key={device.id} className="rounded-md border border-edge bg-surface p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-content">
                    {device.label}
                    {device.installationId === installationId ? ` · ${t('settings.webPush.current')}` : ''}
                  </p>
                  <p className="text-xs text-content-faint">
                    {t('settings.webPush.lastSeen', { date: new Date(device.lastSeenAt).toLocaleString() })}
                  </p>
                  <p className="text-xs text-content-faint">
                    {device.lastSuccessAt
                      ? t('settings.webPush.lastDelivered', { date: new Date(device.lastSuccessAt).toLocaleString() })
                      : t('settings.webPush.neverDelivered')}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => test(device)}
                    disabled={busy != null}
                    className="text-xs underline"
                  >
                    {t('settings.webPush.test')}
                  </button>
                  <button
                    type="button"
                    onClick={() => rename(device)}
                    disabled={busy != null}
                    className="text-xs underline"
                  >
                    {t('settings.webPush.rename')}
                  </button>
                  <button
                    type="button"
                    onClick={() => revoke(device)}
                    disabled={busy != null}
                    className="text-xs text-danger underline"
                  >
                    {t('settings.webPush.revoke')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
