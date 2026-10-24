import { useTranslation } from '../../i18n';
import { chatOf, useAssistantStore } from '../../store/assistantStore';
import { Tooltip } from '../shared/Tooltip';

/**
 * "Before" and "after" of the block of changes applied last, as a small
 * segmented switch: "before" lays the days it touched back the way they were
 * on the map, "after" shows the plan as it is. Only there while this session
 * holds the plan from before the block ran; a thread opened after a reload has
 * no switch. Without a `blockKey` it follows whichever block is compared.
 * `tall` gives each side a thumb's room, for the phone, where a tooltip
 * would never show.
 */

const MODES = [
  { mode: 'before', labelKey: 'assistant.change.before' },
  { mode: 'after', labelKey: 'assistant.change.after' },
] as const;

interface AssistantCompareSwitchProps {
  tripId: number;
  blockKey?: string;
  tall?: boolean;
}

export default function AssistantCompareSwitch({ tripId, blockKey, tall = false }: AssistantCompareSwitchProps) {
  const { t } = useTranslation();
  const current = useAssistantStore((s) => {
    const compare = chatOf(s, tripId).compare;
    return compare && (blockKey === undefined || compare.blockKey === blockKey) ? compare.mode : null;
  });
  const setCompare = useAssistantStore((s) => s.setCompare);
  if (!current) return null;
  const label = t('assistant.change.compare');
  const group = (
    <div role="group" aria-label={label} className="inline-flex flex-shrink-0 rounded-lg bg-surface-secondary p-0.5">
      {MODES.map(({ mode, labelKey }) => (
        <button
          key={mode}
          type="button"
          aria-pressed={current === mode}
          onClick={() => setCompare(tripId, mode)}
          className={`rounded-md text-caption font-medium transition-colors ${
            tall ? 'h-9 min-w-[44px] px-3' : 'px-2 py-0.5'
          } ${current === mode ? 'bg-surface-card text-content shadow-card' : 'text-content-muted hover:text-content'}`}
        >
          {t(labelKey)}
        </button>
      ))}
    </div>
  );
  if (tall) return group;
  return (
    <Tooltip label={label} placement="top">
      {group}
    </Tooltip>
  );
}
