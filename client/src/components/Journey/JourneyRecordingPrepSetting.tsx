import { RefreshCw } from 'lucide-react';
import type React from 'react';
import { useTranslation } from '../../i18n';
import ToggleSwitch from '../Settings/ToggleSwitch';
import { fs } from '../shared/DialogShell';
import type { JourneyRecordingPrepState } from './useJourneyRecordingPrep';

/**
 * The owner's switch for preparing the recorded days (JRN-03) in the desktop
 * journey settings, a row among the map switches. `rowClass` is the row look
 * of the list it sits in.
 */
export function JourneyRecordingPrepRow({
  on,
  prep,
  rowClass,
}: {
  on: boolean;
  prep: JourneyRecordingPrepState;
  rowClass: string;
}): React.ReactElement {
  const { t } = useTranslation();
  return (
    <div className={prep.saving ? `${rowClass} opacity-60` : rowClass}>
      <span className="min-w-0 flex-1">
        <span className="block text-content" style={fs(13, 'body')}>
          {t('journey.settings.autoPrepare')}
        </span>
        <span className="block text-content-faint" style={fs(11.5)}>
          {t('journey.settings.autoPrepareHint')}
        </span>
      </span>
      <ToggleSwitch
        on={on}
        onToggle={() => {
          if (!prep.saving) void prep.setEnabled(!on);
        }}
        label={t('journey.settings.autoPrepare')}
      />
    </div>
  );
}

/**
 * Under the switches: how the caller's own preparation stands, in warning
 * colour when something keeps it from working, with a fetch by hand where one
 * would reach anything. Nothing while the switch is off.
 */
export function JourneyRecordingPrepStatus({ prep }: { prep: JourneyRecordingPrepState }): React.ReactElement | null {
  const { t } = useTranslation();
  const line = prep.statusLine;
  if (!line) return null;
  return (
    <div className="mt-2 flex items-start gap-2" data-testid="journey-prep-status">
      <p
        className={`m-0 flex-1 leading-normal ${line.tone === 'warning' ? 'text-warning' : 'text-content-faint'}`}
        style={fs(11.5)}
      >
        {line.text}
      </p>
      {prep.canFetch && (
        <button
          type="button"
          onClick={() => {
            void prep.fetchNow();
          }}
          disabled={prep.fetching}
          className="inline-flex flex-none items-center gap-1 rounded-full bg-surface-card px-2.5 py-1 font-semibold text-content-secondary ring-1 ring-edge-faint hover:bg-surface-hover disabled:cursor-default disabled:opacity-50"
          style={fs(11.5)}
        >
          <RefreshCw size={12} className={prep.fetching ? 'animate-spin' : undefined} aria-hidden="true" />
          {prep.fetching ? t('journey.prep.fetching') : t('journey.prep.fetchNow')}
        </button>
      )}
    </div>
  );
}
