import { Coffee, Heart } from 'lucide-react';
import React from 'react';
import { donationsShown } from '../../utils/donations';
import { PATREON_PATH, PATREON_URL } from '../shared/PatreonIcon';

const DISCORD_PATH =
  'M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z';

interface FooterLink {
  title: string;
  href: string;
  /** The brand's colour, as a faint wash behind the icon on hover. */
  tint: string;
  icon: React.ReactNode;
}

function brandSvg(path: string): React.ReactNode {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

const DISCORD: FooterLink = {
  title: 'Discord',
  href: 'https://discord.gg/NhZBDSd4qW',
  tint: '#5865F2', // Discord's brand colour
  icon: brandSvg(DISCORD_PATH),
};

const SUPPORT: FooterLink[] = [
  {
    title: 'Patreon',
    href: PATREON_URL,
    tint: '#ff424d', // Patreon's brand colour
    icon: brandSvg(PATREON_PATH),
  },
  {
    title: 'Ko-fi',
    href: 'https://ko-fi.com/mauriceboe',
    tint: '#ff5e5b', // Ko-fi's brand colour
    icon: <Heart size={12} strokeWidth={2.4} aria-hidden="true" />,
  },
  {
    title: 'Buy Me a Coffee',
    href: 'https://buymeacoffee.com/mauriceboe',
    tint: '#ffdd00', // Buy Me a Coffee's brand colour
    icon: <Coffee size={12} strokeWidth={2.4} aria-hidden="true" />,
  },
];

interface Props {
  appVersion: string;
  dark: boolean;
  /** A centrally administered install: its users are not the ones to ask for support. */
  managed: boolean;
}

/**
 * The foot of the user menu: the running version, then the round links to the
 * community and, where donations may be shown, the three ways to support TREK.
 */
export default function UserMenuFooter({ appVersion, dark, managed }: Props): React.ReactElement {
  const links = !managed && donationsShown() ? [...SUPPORT, DISCORD] : [DISCORD];
  return (
    <div className="mt-1 flex items-center justify-center gap-1.5 border-t border-edge-secondary px-3 pb-2.5 pt-2">
      <div className="inline-flex items-center gap-[5px] rounded-full bg-surface-tertiary px-2.5 py-1">
        <img src={dark ? '/text-light.svg' : '/text-dark.svg'} alt="TREK" className="h-2.5 opacity-50" />
        <span
          className="font-semibold text-content-faint"
          style={{ fontSize: 'calc(10px * var(--fs-scale-caption, 1))' }}
        >
          v{appVersion}
        </span>
      </div>
      {links.map((link) => (
        <a
          key={link.title}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          title={link.title}
          aria-label={link.title}
          className="grid h-6 w-6 flex-none place-items-center rounded-full bg-surface-tertiary text-content-faint transition-colors"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `${link.tint}26`;
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '';
            e.currentTarget.style.color = '';
          }}
        >
          {link.icon}
        </a>
      ))}
    </div>
  );
}
