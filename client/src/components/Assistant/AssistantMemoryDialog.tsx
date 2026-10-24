import { NotebookPen, Plus } from 'lucide-react';
import { useId, useState } from 'react';

import { useTranslation } from '../../i18n';
import {
  DialogButton,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogShell,
  DialogTile,
  FooterSpacer,
  NEUTRAL_TINT,
} from '../shared/DialogShell';
import { TEXTAREA } from '../shared/dialogParts';
import { MAX_MEMORY_CHARS, useTripMemory } from './useTripMemory';

/** What travellers most often want minded, one tap to add each. */
const QUICK = ['vegetarian', 'kids', 'budget', 'slow', 'accessible', 'noMuseums'] as const;

/**
 * The trip's notes for the assistant: a few lines it follows in every
 * suggestion on this trip, written once instead of in every question. The
 * common ones are a tap away; the rest is free text.
 */
export default function AssistantMemoryDialog({ tripId, onClose }: { tripId: number; onClose: () => void }) {
  const { t } = useTranslation();
  const labelId = useId();
  const memory = useTripMemory(tripId);
  const [draft, setDraft] = useState(memory.text);
  const [saving, setSaving] = useState(false);

  const add = (line: string) =>
    setDraft((prev) => (prev.includes(line) ? prev : `${prev.trimEnd()}${prev.trim() ? '\n' : ''}${line}`));

  const save = async () => {
    setSaving(true);
    const done = await memory.save(draft);
    setSaving(false);
    if (done) onClose();
  };

  return (
    <DialogShell
      onClose={onClose}
      labelledBy={labelId}
      width="narrow"
      discardGuard={draft}
      header={
        <DialogHeader
          tile={
            <DialogTile>
              <NotebookPen size={20} strokeWidth={2} />
            </DialogTile>
          }
          tint={NEUTRAL_TINT}
          labelId={labelId}
          eyebrow={t('assistant.launcher.tooltip')}
          title={t('assistant.memory.title')}
          sub={t('assistant.memory.sub')}
          subWraps
          onClose={onClose}
        />
      }
      footer={
        <DialogFooter>
          <span className="text-caption tabular-nums text-content-faint">
            {draft.length}/{MAX_MEMORY_CHARS}
          </span>
          <FooterSpacer />
          <DialogButton onClick={onClose}>{t('common.cancel')}</DialogButton>
          <DialogButton variant="primary" disabled={saving} onClick={() => void save()}>
            {t(saving ? 'common.saving' : 'common.save')}
          </DialogButton>
        </DialogFooter>
      }
    >
      <DialogSection label={t('assistant.memory.quick')}>
        <div className="flex flex-wrap gap-1.5">
          {QUICK.map((key, i) => {
            const line = t(`assistant.memory.quick.${key}`);
            const taken = draft.includes(line);
            return (
              <button
                key={key}
                type="button"
                disabled={taken}
                onClick={() => add(line)}
                className="trek-assistant-enter inline-flex items-center gap-1 rounded-full bg-surface-card px-2.5 py-1 text-caption font-medium text-content-secondary shadow-sm ring-1 ring-edge-faint transition-all hover:-translate-y-px hover:text-content hover:shadow-md disabled:translate-y-0 disabled:opacity-40 disabled:shadow-none"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <Plus size={11} aria-hidden="true" />
                {line}
              </button>
            );
          })}
        </div>
      </DialogSection>
      <DialogSection label={t('assistant.memory.notes')}>
        <textarea
          aria-label={t('assistant.memory.notes')}
          rows={6}
          maxLength={MAX_MEMORY_CHARS}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t('assistant.memory.placeholder')}
          className={TEXTAREA}
        />
      </DialogSection>
    </DialogShell>
  );
}
