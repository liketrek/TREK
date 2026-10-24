import { BookmarkCheck, Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';
import { Tooltip } from '../shared/Tooltip';
import AssistantMemoryDialog from './AssistantMemoryDialog';
import { useAssistantScope } from './assistantViewContext';

/**
 * A note the assistant kept in the trip notes on its own, as a quiet line in
 * its answer, with the notes a tap away to change or drop it. Kept while the
 * answer is written, the notes on this device are read again, so the dialog
 * never saves over the note with what it held before.
 */
export default function AssistantRemembered({ note, live }: { note: string; live: boolean }) {
  const { t } = useTranslation();
  const scope = useAssistantScope();
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (live) void loadSettings();
  }, [live, loadSettings]);

  const tripId = scope.kind === 'trip' ? scope.tripId : null;
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg bg-surface-secondary px-2.5 py-1.5 text-caption">
      <BookmarkCheck size={13} strokeWidth={2.2} aria-hidden="true" className="flex-none text-success" />
      <span className="min-w-0 flex-1">
        <span className="font-semibold text-content-secondary">{t('assistant.memory.kept')}</span>{' '}
        <bdi className="text-content-muted">{note}</bdi>
      </span>
      {tripId !== null && (
        <Tooltip label={t('assistant.memory.edit')} placement="top">
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label={t('assistant.memory.edit')}
            className="grid h-6 w-6 flex-none place-items-center rounded-md text-content-faint transition-colors hover:bg-surface-hover hover:text-content"
          >
            <Pencil size={12} aria-hidden="true" />
          </button>
        </Tooltip>
      )}
      {editing && tripId !== null && <AssistantMemoryDialog tripId={tripId} onClose={() => setEditing(false)} />}
    </div>
  );
}
