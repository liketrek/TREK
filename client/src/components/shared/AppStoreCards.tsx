import React from 'react';
import { useTranslation } from '../../i18n/TranslationContext.js';
import './appStoreCards.css';

/**
 * The two app stores TREK is in, each as a card with its QR code: scanned with a
 * phone it opens the store page, clicked it opens it here. The README draws the
 * same cards. The QR codes are generated from the store addresses below (qrcode,
 * margin 0, level M); regenerate them if an address changes.
 */
const APP_STORES = [
  {
    id: 'ios',
    href: 'https://apps.apple.com/app/id6831237775',
    store: 'App Store',
    captionKey: 'settings.apps.downloadOn',
    devicesKey: 'settings.apps.iosDevices',
    logo: 'M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701',
    qrSize: 29,
    qr: 'M0 0.5h7m2 0h1m2 0h1m2 0h5m2 0h7M0 1.5h1m5 0h1m3 0h3m4 0h1m2 0h1m1 0h1m5 0h1M0 2.5h1m1 0h3m1 0h1m1 0h1m5 0h1m1 0h1m3 0h1m1 0h1m1 0h3m1 0h1M0 3.5h1m1 0h3m1 0h1m1 0h1m2 0h2m4 0h1m1 0h1m2 0h1m1 0h3m1 0h1M0 4.5h1m1 0h3m1 0h1m1 0h1m2 0h5m2 0h3m1 0h1m1 0h3m1 0h1M0 5.5h1m5 0h1m1 0h3m1 0h5m1 0h1m1 0h1m1 0h1m5 0h1M0 6.5h7m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h7M8 7.5h3m2 0h1m1 0h2m2 0h2M0 8.5h1m1 0h5m4 0h1m2 0h4m1 0h1m2 0h5M0 9.5h3m2 0h1m2 0h4m3 0h1m3 0h4m1 0h1m3 0h1M0 10.5h4m1 0h7m6 0h1m1 0h1m1 0h2M5 11.5h1m1 0h3m1 0h1m2 0h2m2 0h2m1 0h2m1 0h2m1 0h1M2 12.5h1m3 0h3m1 0h1m1 0h1m2 0h3m5 0h1m1 0h2M0 13.5h1m4 0h1m3 0h1m1 0h1m1 0h2m1 0h1m2 0h6m3 0h1M1 14.5h3m1 0h2m5 0h3m3 0h1m2 0h1m2 0h3M0 15.5h1m2 0h2m2 0h7m2 0h1m1 0h3m3 0h1m2 0h1M3 16.5h2m1 0h1m3 0h1m1 0h1m1 0h1m1 0h4m3 0h1m1 0h2M0 17.5h4m5 0h3m3 0h1m1 0h3m2 0h3m1 0h1m1 0h1M0 18.5h1m1 0h1m2 0h2m8 0h3m2 0h2m2 0h1m1 0h1M0 19.5h1m1 0h2m1 0h1m3 0h4m1 0h1m5 0h2m2 0h1m2 0h1M0 20.5h1m1 0h1m1 0h1m1 0h3m8 0h1m2 0h5m1 0h3M8 21.5h1m1 0h5m2 0h2m1 0h1m3 0h5M0 22.5h7m2 0h1m1 0h1m1 0h2m3 0h3m1 0h1m1 0h3M0 23.5h1m5 0h1m1 0h1m1 0h1m2 0h1m5 0h2m3 0h1M0 24.5h1m1 0h3m1 0h1m1 0h1m2 0h2m1 0h1m2 0h1m2 0h5m1 0h1m1 0h1M0 25.5h1m1 0h3m1 0h1m1 0h2m1 0h1m6 0h1m4 0h1m1 0h2M0 26.5h1m1 0h3m1 0h1m1 0h1m1 0h1m1 0h1m2 0h1m3 0h2m1 0h6M0 27.5h1m5 0h1m2 0h3m3 0h1m2 0h1m1 0h2m1 0h3m1 0h1M0 28.5h7m1 0h2m1 0h1m3 0h2m1 0h2m1 0h1m2 0h1m1 0h1',
  },
  {
    id: 'android',
    href: 'https://play.google.com/store/apps/details?id=com.liketrek.trek',
    store: 'Google Play',
    captionKey: 'settings.apps.getItOn',
    devicesKey: 'settings.apps.androidDevices',
    logo: 'M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594zM1.337.924a1.486 1.486 0 0 0-.112.568v21.017c0 .217.045.419.124.6l11.155-11.087L1.337.924zm12.207 10.065l3.258-3.238L3.45.195a1.466 1.466 0 0 0-.946-.179l11.04 10.973zm0 2.067l-11 10.933c.298.036.612-.016.906-.183l13.324-7.54-3.23-3.21z',
    qrSize: 37,
    qr: 'M0 0.5h7m2 0h1m3 0h1m1 0h1m2 0h1m1 0h3m1 0h2m4 0h7M0 1.5h1m5 0h1m4 0h1m2 0h1m2 0h3m5 0h4m1 0h1m5 0h1M0 2.5h1m1 0h3m1 0h1m1 0h2m2 0h5m2 0h4m1 0h1m1 0h1m3 0h1m1 0h3m1 0h1M0 3.5h1m1 0h3m1 0h1m1 0h2m1 0h1m1 0h1m2 0h5m1 0h1m2 0h2m3 0h1m1 0h3m1 0h1M0 4.5h1m1 0h3m1 0h1m1 0h2m3 0h1m4 0h3m1 0h2m1 0h1m2 0h1m1 0h1m1 0h3m1 0h1M0 5.5h1m5 0h1m1 0h6m4 0h1m3 0h1m2 0h4m1 0h1m5 0h1M0 6.5h7m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h7M8 7.5h1m1 0h4m2 0h1m6 0h1m4 0h1M0 8.5h1m1 0h5m2 0h1m3 0h3m2 0h1m1 0h7m3 0h5M0 9.5h5m5 0h1m4 0h3m3 0h1m4 0h1m1 0h1m2 0h1m3 0h1M0 10.5h3m1 0h4m1 0h3m1 0h1m3 0h1m2 0h9m1 0h1m2 0h1m1 0h2M2 11.5h2m3 0h1m5 0h1m2 0h1m4 0h1m1 0h1m2 0h3m1 0h4m2 0h1M1 12.5h1m1 0h1m2 0h1m3 0h1m1 0h2m2 0h2m2 0h1m1 0h6m1 0h4m1 0h3M0 13.5h1m6 0h1m1 0h3m1 0h1m2 0h6m1 0h2m3 0h1m2 0h1M2 14.5h1m3 0h2m1 0h1m1 0h5m1 0h1m3 0h1m4 0h3m2 0h3m1 0h2M2 15.5h2m3 0h1m1 0h1m2 0h7m2 0h2m5 0h5m2 0h2M1 16.5h1m2 0h3m3 0h2m1 0h2m1 0h1m4 0h1m1 0h1m1 0h3m1 0h2m1 0h1m1 0h1M2 17.5h1m2 0h1m2 0h2m1 0h2m2 0h1m2 0h1m1 0h1m1 0h1m1 0h3m1 0h1m2 0h1m2 0h2M1 18.5h1m4 0h1m3 0h2m2 0h3m2 0h1m2 0h1m3 0h2m1 0h1m2 0h1m2 0h2M1 19.5h3m4 0h5m2 0h1m2 0h5m1 0h1m5 0h3m3 0h1M0 20.5h1m1 0h1m1 0h1m1 0h2m2 0h1m4 0h1m1 0h1m1 0h2m1 0h1m1 0h4m1 0h2m1 0h3M1 21.5h1m6 0h2m1 0h1m1 0h2m1 0h1m1 0h3m1 0h2m4 0h1m4 0h1M2 22.5h1m1 0h5m1 0h1m2 0h4m1 0h1m1 0h1m1 0h1m2 0h1m1 0h1m3 0h3m1 0h2M0 23.5h1m2 0h1m1 0h1m5 0h2m2 0h1m7 0h1m4 0h2m1 0h2m2 0h1M1 24.5h2m3 0h1m3 0h4m4 0h1m1 0h7m1 0h3m1 0h1m1 0h2M0 25.5h4m1 0h1m2 0h4m3 0h2m4 0h1m6 0h1m4 0h1M0 26.5h1m2 0h1m1 0h2m3 0h1m1 0h3m5 0h1m2 0h2m1 0h2m2 0h2m2 0h3M0 27.5h1m1 0h3m3 0h2m6 0h1m4 0h1m1 0h1m2 0h7m2 0h1M0 28.5h1m1 0h1m1 0h1m1 0h1m1 0h2m1 0h2m1 0h1m2 0h1m4 0h4m1 0h9M8 29.5h6m2 0h2m1 0h3m1 0h1m3 0h2m3 0h2m1 0h1M0 30.5h7m2 0h1m5 0h3m2 0h2m4 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1M0 31.5h1m5 0h1m1 0h1m1 0h6m1 0h8m1 0h3m3 0h2m1 0h1M0 32.5h1m1 0h3m1 0h1m1 0h2m1 0h1m1 0h1m1 0h2m2 0h1m1 0h1m2 0h9m1 0h1m1 0h1M0 33.5h1m1 0h3m1 0h1m1 0h1m2 0h1m1 0h3m2 0h1m1 0h3m1 0h2m3 0h2m1 0h1m1 0h2M0 34.5h1m1 0h3m1 0h1m1 0h1m3 0h1m2 0h2m2 0h1m1 0h2m2 0h5m4 0h1m1 0h1M0 35.5h1m5 0h1m5 0h1m1 0h2m2 0h7m3 0h3m1 0h1m3 0h1M0 36.5h7m1 0h1m1 0h1m1 0h1m1 0h2m1 0h1m1 0h1m3 0h4m2 0h2m1 0h5',
  },
] as const;

interface Props {
  /** `dark` for a surface that stays dark in either theme, like the release modal. */
  tone?: 'theme' | 'dark';
  className?: string;
}

export default function AppStoreCards({ tone = 'theme', className }: Props): React.ReactElement {
  const { t } = useTranslation();
  return (
    <div className={['asc-row', tone === 'dark' ? 'asc-dark' : '', className ?? ''].filter(Boolean).join(' ')}>
      {APP_STORES.map((s) => (
        <a key={s.id} className="asc-card" href={s.href} target="_blank" rel="noopener noreferrer">
          <span className="asc-qr" aria-hidden="true">
            <svg viewBox={`0 0 ${s.qrSize} ${s.qrSize}`} shapeRendering="crispEdges">
              <path className="asc-qr-dots" d={s.qr} />
            </svg>
          </span>
          <span className="asc-text">
            <span className="asc-caption">
              <svg className="asc-logo" viewBox="0 0 24 24" aria-hidden="true">
                <path d={s.logo} />
              </svg>
              {t(s.captionKey)}
            </span>
            <span className="asc-store">{s.store}</span>
            <span className="asc-devices">{t(s.devicesKey)}</span>
          </span>
        </a>
      ))}
    </div>
  );
}
