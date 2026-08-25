import React, { useEffect, useMemo, useState } from 'react';

import { notificationsApi } from '../../api/client';
import { useTranslation } from '../../i18n';
import { detectWebPushCapability, enableWebPush, getWebPushInstallationId } from '../../services/webPush';
import { useAuthStore } from '../../store/authStore';

export default function WebPushInvitation(): React.ReactElement | null {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const capability = detectWebPushCapability();
  const installationId = useMemo(() => getWebPushInstallationId(), []);
  const dismissKey = user ? `trek_web_push_invitation_dismissed:${user.id}:${installationId}` : '';

  useEffect(() => {
    if (!isAuthenticated || !user || !dismissKey || localStorage.getItem(dismissKey) === '1') {
      setVisible(false);
      return;
    }
    if (capability === 'unsupported' || capability === 'denied') return;
    Promise.all([notificationsApi.webPushConfig(), notificationsApi.webPushDevices()])
      .then(([config, result]) => {
        const current = result.devices.some((device) => device.installationId === installationId);
        setVisible(config.enabled && config.available && !current);
      })
      .catch(() => {});
  }, [capability, dismissKey, installationId, isAuthenticated, user]);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(dismissKey, '1');
    setVisible(false);
  };

  const enable = async () => {
    setBusy(true);
    try {
      const result = await enableWebPush();
      if (result.state === 'active') setVisible(false);
    } catch {
      // The Settings panel exposes the detailed browser/permission error state.
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md rounded-xl border border-edge bg-surface p-4 shadow-xl md:bottom-6">
      <p className="text-sm font-semibold text-content">{t('settings.webPush.title')}</p>
      <p className="mt-1 text-xs text-content-muted">
        {capability === 'ios-install-required' ? t('settings.webPush.iosInstall') : t('settings.webPush.description')}
      </p>
      <div className="mt-3 flex gap-2">
        {capability === 'supported' && (
          <button
            type="button"
            onClick={enable}
            disabled={busy}
            className="rounded-md bg-content px-3 py-2 text-xs font-medium text-surface disabled:opacity-50"
          >
            {busy ? t('settings.webPush.enabling') : t('settings.webPush.enable')}
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          className="rounded-md border border-edge px-3 py-2 text-xs text-content-muted"
        >
          {t('settings.webPush.notNow')}
        </button>
      </div>
    </div>
  );
}
