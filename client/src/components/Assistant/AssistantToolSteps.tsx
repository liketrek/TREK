import { ChevronRight } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '../../i18n';
import AssistantLiveStep from './AssistantLiveStep';
import { toolStepKey } from './assistantModel';
import type { ToolStep } from './assistantParts';

/**
 * What the assistant looked up on the way to its answer. While a step runs it
 * says what it does ("Reading your plan", "Searching near Trastevere") and
 * shimmers; once the run is done the steps fold into one quiet line that
 * opens to the list. Tool names never show: they are the model's words, not
 * the user's.
 */
export default function AssistantToolSteps({ steps }: { steps: ToolStep[] }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const running = steps.filter((s) => s.running).pop();

  if (running) return <AssistantLiveStep toolCallId={running.toolCallId} toolName={running.toolName} />;

  return (
    <div className="text-caption text-content-muted">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="-ms-1 inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-caption text-content-muted hover:bg-surface-hover hover:text-content-secondary"
      >
        <ChevronRight
          size={13}
          aria-hidden="true"
          className={`transition-transform duration-150 rtl:-scale-x-100 ${open ? 'rotate-90' : ''}`}
        />
        {t('assistant.step.collapsed', { count: steps.length })}
      </button>
      {open && (
        <ul className="m-0 mt-1 list-none space-y-0.5 border-s border-edge-faint ps-3">
          {steps.map((step) => (
            <li key={step.toolCallId}>{t(toolStepKey(step.toolName))}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
