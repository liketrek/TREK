import type { TourSourceHint, TourSourceHintState } from '@trek/shared';
import { HelpCircle, History, PenLine, type LucideIcon } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { SoftPill } from '../../Planner/planParts';
import { Tooltip } from '../../shared/Tooltip';
import WandererMark from './WandererMark';

/**
 * WAN-02: how a hint of the wanderer watch looks wherever it shows (the
 * settings list, a tour's provenance): one tone and one icon per state, so a
 * possible change never reads like a proven one.
 */
const HINT_LOOK: Record<TourSourceHintState, { tone: 'info' | 'warning' | 'neutral'; text: string; Icon: LucideIcon }> =
  {
    possible_change: { tone: 'info', text: 'text-info', Icon: History },
    changed: { tone: 'warning', text: 'text-warning', Icon: PenLine },
    unverifiable: { tone: 'neutral', text: 'text-content-muted', Icon: HelpCircle },
  };

/** The state as a pill with its meaning in the tooltip, then what the record proves changed or why it could not judge. */
export function SourceHintPills({ hint }: { hint: Pick<TourSourceHint, 'state' | 'changes' | 'reason'> }) {
  const { t } = useTranslation();
  const look = HINT_LOOK[hint.state];
  return (
    <>
      <Tooltip label={t(`wanderer.watch.stateHint.${hint.state}`)}>
        <span className="inline-flex" data-testid="source-hint-state" data-state={hint.state}>
          <SoftPill tone={look.tone} icon={<look.Icon size={10} strokeWidth={2.4} />}>
            {t(`wanderer.watch.state.${hint.state}`)}
          </SoftPill>
        </span>
      </Tooltip>
      {hint.changes.map((part) => (
        <SoftPill key={part}>{t(`tours.provenance.change.${part}`)}</SoftPill>
      ))}
      {hint.reason && <SoftPill>{t(`wanderer.watch.reason.${hint.reason}`)}</SoftPill>}
    </>
  );
}

/** The wanderer emblem on a raised round tile, with the state's icon as a badge on its corner. */
export function SourceHintTile({ state }: { state: TourSourceHintState }) {
  const look = HINT_LOOK[state];
  return (
    <span className="relative grid h-9 w-9 flex-none place-items-center rounded-full bg-surface-card text-content-secondary shadow-sm ring-1 ring-inset ring-edge-faint">
      <WandererMark size={17} />
      <span
        aria-hidden="true"
        className={`absolute -bottom-1 -end-1 grid h-4 w-4 place-items-center rounded-full bg-surface-card shadow-sm ring-2 ring-[color:var(--bg-card)] ${look.text}`}
      >
        <look.Icon size={9} strokeWidth={2.6} />
      </span>
    </span>
  );
}
