import { Check, ChevronDown, Minus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '../../i18n';

export function VerdictSection({ pros, cons }: { pros: string[]; cons: string[] }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  // On desktop always show, on mobile toggle
  return (
    <div className="mt-5">
      {/* Header — clickable on mobile */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="group mb-3.5 flex w-full items-center gap-2.5 md:pointer-events-none"
      >
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
          {t('journey.editor.prosCons')}
          <ChevronDown
            size={12}
            className={`text-zinc-400 transition-transform duration-300 md:hidden ${open ? 'rotate-180' : ''}`}
          />
        </span>
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
      </button>

      {/* Collapsed summary on mobile */}
      {!open && (
        <div className="flex items-center justify-center gap-3 md:hidden">
          {pros.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-green-500">
                <Check size={11} className="text-white" strokeWidth={3} />
              </div>
              <span className="text-[12px] font-semibold text-green-700 dark:text-green-400">{pros.length}</span>
            </div>
          )}
          {cons.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-red-500">
                <Minus size={11} className="text-white" strokeWidth={3} />
              </div>
              <span className="text-[12px] font-semibold text-red-700 dark:text-red-400">{cons.length}</span>
            </div>
          )}
        </div>
      )}

      {/* Content — always visible on desktop, toggled on mobile */}
      <div
        className={`grid grid-cols-1 gap-3 overflow-hidden transition-all duration-300 ease-in-out md:grid-cols-2 ${
          open ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0 md:max-h-none md:opacity-100'
        }`}
      >
        {pros.length > 0 && (
          <div className="rounded-xl border border-green-200 bg-gradient-to-b from-green-50 to-white p-4 dark:border-green-800/30 dark:from-green-950/30 dark:to-zinc-900">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-green-500">
                <Check size={14} className="text-white" strokeWidth={3} />
              </div>
              <span className="hidden text-[11px] font-bold uppercase tracking-[0.1em] text-green-700 dark:text-green-400 md:inline">
                {t('journey.verdict.lovedIt')}
              </span>
              <span className="ml-auto text-[11px] font-semibold text-green-600">{pros.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {pros.map((p, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="mt-[7px] h-[5px] w-[5px] flex-shrink-0 rounded-full bg-green-500" />
                  <span className="text-[13px] leading-snug text-green-900 dark:text-green-100">{p}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {cons.length > 0 && (
          <div className="rounded-xl border border-red-200 bg-gradient-to-b from-red-50 to-white p-4 dark:border-red-800/30 dark:from-red-950/30 dark:to-zinc-900">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-500">
                <Minus size={14} className="text-white" strokeWidth={3} />
              </div>
              <span className="hidden text-[11px] font-bold uppercase tracking-[0.1em] text-red-700 dark:text-red-400 md:inline">
                {t('journey.verdict.couldBeBetter')}
              </span>
              <span className="ml-auto text-[11px] font-semibold text-red-600">{cons.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {cons.map((c, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="mt-[7px] h-[5px] w-[5px] flex-shrink-0 rounded-full bg-red-500" />
                  <span className="text-[13px] leading-snug text-red-900 dark:text-red-100">{c}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
