import { BellRing } from 'lucide-react';
import React from 'react';
import { useTranslation } from '../../i18n';
import { fs } from '../shared/DialogShell';
import { Tooltip } from '../shared/Tooltip';
import { InfoDot } from '../Tours/tourParts';
import WandererHintsDialog from '../Tours/wanderer/WandererHintsDialog';
import { SETTINGS_BUTTON, SettingRow, SettingRows, StatusPill } from './settingsKit';
import ToggleSwitch from './ToggleSwitch';
import { useWandererWatch, type WandererWatchController } from './useWandererWatch';

/** The switch, dimmed with a word on why while there is no connection to watch with. */
function WatchSwitch({ W }: { W: WandererWatchController }) {
  const { t } = useTranslation();
  const off = !W.available;
  // A disabled button takes no focus and, in some browsers, no hover either, so
  // the reason sits on a focusable wrapper the tooltip listens to. The wrapper
  // stays once the switch can be used, so the button is never mounted anew and
  // keeps its focus when the connection is known.
  return (
    <Tooltip label={t('wanderer.watch.notConnected')} disabled={!off}>
      <span
        tabIndex={off ? 0 : undefined}
        className={`inline-flex rounded-full outline-none ${off ? 'cursor-not-allowed opacity-50 focus-visible:ring-2 focus-visible:ring-[color:var(--text-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-card)]' : ''}`}
      >
        <span className={`inline-flex ${off ? 'pointer-events-none' : ''}`}>
          <ToggleSwitch
            on={W.enabled}
            onToggle={() => void W.toggle()}
            label={t('wanderer.watch.label')}
            disabled={off}
          />
        </span>
      </span>
    </Tooltip>
  );
}

/** The open hints behind a button, their number as a badge on its corner; dimmed while there are none. */
function HintsButton({ W }: { W: WandererWatchController }) {
  const { t } = useTranslation();
  const count = W.hints.length;
  return (
    <Tooltip label={count ? t('wanderer.watch.hintsCount', { count }) : t('wanderer.watch.empty')}>
      <span className="inline-flex">
        <button
          type="button"
          onClick={W.openHints}
          disabled={count === 0}
          className={`${SETTINGS_BUTTON} relative`}
          style={fs(12.5, 'body')}
        >
          <BellRing size={13} strokeWidth={2.2} />
          {t('wanderer.watch.hints')}
          {count > 0 && (
            <span
              aria-label={t('wanderer.watch.hintsCount', { count })}
              data-testid="wanderer-hint-count"
              className="absolute -end-1.5 -top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-accent px-1 font-geist font-semibold tabular-nums text-accent-text ring-2 ring-[color:var(--bg-card)]"
              style={fs(10)}
            >
              {count}
            </span>
          )}
        </button>
      </span>
    </Tooltip>
  );
}

/**
 * WAN-02 in the wanderer card: the optional background check of the user's
 * own imported trails. Off until switched on; while on, what it last did and
 * its open hints, which open in a dialog that leads to each tour.
 */
export default function WandererWatchRow({ refreshKey }: { refreshKey: string }): React.ReactElement {
  const { t } = useTranslation();
  const W = useWandererWatch(refreshKey);
  return (
    <SettingRows>
      <SettingRow
        label={
          <span className="inline-flex items-center gap-1.5">
            {t('wanderer.watch.label')}
            <InfoDot label={t('wanderer.watch.label')} description={t('wanderer.watch.info')} />
          </span>
        }
        hint={t('wanderer.watch.hint')}
        dimmed={W.saving}
        control={<WatchSwitch W={W} />}
      >
        {W.status && (
          <div className="flex flex-wrap items-center gap-2" data-testid="wanderer-watch-status">
            <Tooltip label={W.status.why ?? ''} disabled={!W.status.why}>
              <span className="inline-flex">
                <StatusPill tone={W.status.tone}>{W.status.text}</StatusPill>
              </span>
            </Tooltip>
            <span className="ms-auto">
              <HintsButton W={W} />
            </span>
          </div>
        )}
      </SettingRow>
      <WandererHintsDialog open={W.hintsOpen} hints={W.hints} onClose={W.closeHints} onOpenTour={W.openTour} />
    </SettingRows>
  );
}
