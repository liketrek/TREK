import { BookOpen, Bug, Coffee, ExternalLink, Github, Heart, Info, Lightbulb } from 'lucide-react';
import React, { type CSSProperties, type ReactNode } from 'react';
import { useTranslation } from '../../i18n';
import Section from './Section';
import { StatusPill } from './settingsKit';
import { fs } from '../shared/DialogShell';
import { useAuthStore } from '../../store/authStore';

interface Props {
  appVersion: string;
}

const DISCORD_PATH = 'M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z';

// The services' own colours: each tile takes its brand on hover and in its icon square.
const BRAND = {
  kofi: '#ff5e5b', // theme-lint-disable: brand colour (Ko-fi)
  bmac: '#ffdd00', // theme-lint-disable: brand colour (Buy Me a Coffee)
  discord: '#5865F2', // theme-lint-disable: brand colour (Discord)
} as const;

// TREK's own tiles speak in the theme's signal colours instead.
const SIGNAL = {
  bug: 'var(--danger)',
  idea: 'var(--warning)',
  wiki: 'var(--info)',
} as const;

/** Tile chrome that reads the tile's colour from `--tile`: the border and a faint ring on hover. */
const TILE_HOVER = 'hover:border-[color:var(--tile)] hover:shadow-[0_0_0_1px_color-mix(in_srgb,var(--tile)_14%,transparent)]';
/** The icon square in the tile's colour. */
const TILE_ICON = 'bg-[color-mix(in_srgb,var(--tile)_12%,transparent)] text-[color:var(--tile)]';

/**
 * One outbound link as a tile: a tinted icon square, a title and a hint, the
 * external-link mark on the right. The border picks up the tile's colour while
 * the pointer is on it.
 */
function LinkTile({ href, color, icon, title, hint }: {
  href: string;
  /** A brand colour or a theme token, handed to the classes as `--tile`. */
  color?: string;
  icon?: ReactNode;
  title: ReactNode;
  hint: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex min-w-0 items-center gap-3 overflow-hidden rounded-[14px] border border-edge bg-surface-card px-3.5 py-3 no-underline shadow-sm transition-[border-color,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${color ? TILE_HOVER : ''}`}
      style={color ? ({ '--tile': color } as CSSProperties) : undefined}
    >
      {icon && (
        <span className={`grid h-10 w-10 flex-none place-items-center rounded-[12px] ${color ? TILE_ICON : 'bg-surface-tertiary text-content-secondary'}`}>
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-content" style={fs(13, 'body')}>{title}</div>
        <div className="truncate text-content-faint" style={fs(11.5)}>{hint}</div>
      </div>
      <ExternalLink size={14} className="flex-none text-content-faint" />
    </a>
  );
}

export default function AboutTab({ appVersion }: Props): React.ReactElement {
  const { t } = useTranslation();
  const managed = useAuthStore((s) => s.managed);

  return (
    <Section title={t('settings.about')} icon={Info} badge={<StatusPill>v{appVersion}</StatusPill>}>
      <style>{`
        @keyframes heartPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
      `}</style>
      <div className="flex flex-col gap-1.5">
        <p className="m-0 leading-relaxed text-content-secondary" style={fs(13, 'body')}>
          {/* The stock line calls TREK self-hosted and points at 'your own server'.
              Both are true for the reader who set it up and neither is for a customer
              of a hosted instance, so the mode picks the sentence rather than the
              wording being watered down for everybody. */}
          {t(managed ? 'settings.about.descriptionManaged' : 'settings.about.description')}
        </p>
        <p className="m-0 leading-relaxed text-content-faint" style={fs(12, 'body')}>
          {t('settings.about.madeWith')}{' '}
          <Heart
            size={11}
            fill="currentColor"
            className="inline-block text-danger"
            style={{ verticalAlign: '-1px', animation: 'heartPulse 1.5s ease-in-out infinite' }}
          />{' '}
          {t('settings.about.madeBy')}
        </p>
      </div>

      {/* Ko-fi, Buy Me a Coffee, Discord, and the issue/discussion links assume
          the reader runs this install and can act on it. On a centrally
          administered one they support somebody they are not the customer of,
          and file bugs against an instance they do not operate. The version and
          the source link below stay in both modes: AGPL §13 wants the source
          offered prominently to the people using it over a network, and that is
          not the part being trimmed here. */}
      {!managed && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <LinkTile
            href="https://ko-fi.com/mauriceboe"
            color={BRAND.kofi}
            icon={<Coffee size={19} />}
            title="Ko-fi"
            hint={t('admin.github.support')}
          />
          <LinkTile
            href="https://buymeacoffee.com/mauriceboe"
            color={BRAND.bmac}
            icon={<Heart size={19} />}
            title="Buy Me a Coffee"
            hint={t('admin.github.support')}
          />
          <LinkTile
            href="https://discord.gg/NhZBDSd4qW"
            color={BRAND.discord}
            icon={(
              <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d={DISCORD_PATH} />
              </svg>
            )}
            title="Discord"
            hint="Join the community"
          />
          <LinkTile
            href="https://github.com/liketrek/TREK/issues/new?template=bug_report.yml"
            color={SIGNAL.bug}
            icon={<Bug size={19} />}
            title={t('settings.about.reportBug')}
            hint={t('settings.about.reportBugHint')}
          />
          <LinkTile
            href="https://github.com/liketrek/TREK/discussions/new?category=feature-requests"
            color={SIGNAL.idea}
            icon={<Lightbulb size={19} />}
            title={t('settings.about.featureRequest')}
            hint={t('settings.about.featureRequestHint')}
          />
          <LinkTile
            href="https://github.com/liketrek/TREK/wiki"
            color={SIGNAL.wiki}
            icon={<BookOpen size={19} />}
            title="Wiki"
            hint={t('settings.about.wikiHint')}
          />
        </div>
      )}

      {/* What replaces the grids above. AGPL §13 asks for the source to be
          offered prominently to whoever uses the software over a network, and a
          customer of a hosted instance is exactly that reader. The support and
          bug-report links go; this does not. */}
      {managed && (
        <LinkTile
          href="https://github.com/liketrek/TREK"
          icon={<Github size={19} />}
          title={t('settings.about.sourceTitle')}
          hint={t('settings.about.sourceHint')}
        />
      )}
    </Section>
  );
}
