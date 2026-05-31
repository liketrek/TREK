import { useState } from 'react'
import { Check, Minus, ChevronDown } from 'lucide-react'
import { useTranslation } from '../../i18n'

export function VerdictSection({ pros, cons }: { pros: string[]; cons: string[] }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  // On desktop always show, on mobile toggle
  return (
    <div className="mt-5">
      {/* Header — clickable on mobile */}
      <button
        onClick={() => setOpen(o => !o)}
        className="md:pointer-events-none w-full flex items-center gap-2.5 mb-3.5 group"
      >
        <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
        <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-zinc-400 flex items-center gap-1.5">
          {t('journey.editor.prosCons')}
          <ChevronDown
            size={12}
            className={`md:hidden text-zinc-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          />
        </span>
        <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
      </button>

      {/* Collapsed summary on mobile */}
      {!open && (
        <div className="flex items-center justify-center gap-3 md:hidden">
          {pros.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-green-500 flex items-center justify-center">
                <Check size={11} className="text-white" strokeWidth={3} />
              </div>
              <span className="text-[12px] font-semibold text-green-700 dark:text-green-400">{pros.length}</span>
            </div>
          )}
          {cons.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-red-500 flex items-center justify-center">
                <Minus size={11} className="text-white" strokeWidth={3} />
              </div>
              <span className="text-[12px] font-semibold text-red-700 dark:text-red-400">{cons.length}</span>
            </div>
          )}
        </div>
      )}

      {/* Content — always visible on desktop, toggled on mobile */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 gap-3 overflow-hidden transition-all duration-300 ease-in-out ${
          open ? 'max-h-[800px] opacity-100' : 'max-h-0 md:max-h-none opacity-0 md:opacity-100'
        }`}
      >
        {pros.length > 0 && (
          <div className="rounded-xl border border-green-200 dark:border-green-800/30 p-4 bg-gradient-to-b from-green-50 to-white dark:from-green-950/30 dark:to-zinc-900">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-green-500 flex items-center justify-center">
                <Check size={14} className="text-white" strokeWidth={3} />
              </div>
              <span className="hidden md:inline text-[11px] font-bold tracking-[0.1em] uppercase text-green-700 dark:text-green-400">{t('journey.verdict.lovedIt')}</span>
              <span className="ml-auto text-[11px] font-semibold text-green-600">{pros.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {pros.map((p, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="w-[5px] h-[5px] rounded-full bg-green-500 flex-shrink-0 mt-[7px]" />
                  <span className="text-[13px] text-green-900 dark:text-green-100 leading-snug">{p}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {cons.length > 0 && (
          <div className="rounded-xl border border-red-200 dark:border-red-800/30 p-4 bg-gradient-to-b from-red-50 to-white dark:from-red-950/30 dark:to-zinc-900">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-red-500 flex items-center justify-center">
                <Minus size={14} className="text-white" strokeWidth={3} />
              </div>
              <span className="hidden md:inline text-[11px] font-bold tracking-[0.1em] uppercase text-red-700 dark:text-red-400">{t('journey.verdict.couldBeBetter')}</span>
              <span className="ml-auto text-[11px] font-semibold text-red-600">{cons.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {cons.map((c, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="w-[5px] h-[5px] rounded-full bg-red-500 flex-shrink-0 mt-[7px]" />
                  <span className="text-[13px] text-red-900 dark:text-red-100 leading-snug">{c}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
