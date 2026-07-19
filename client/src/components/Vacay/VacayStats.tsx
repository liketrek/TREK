import { useEffect, useState } from 'react'
import { Pencil } from 'lucide-react'
import { useVacayStore } from '../../store/vacayStore'
import { useAuthStore } from '../../store/authStore'
import { useTranslation } from '../../i18n'
import type { VacayStat, TranslationFn } from '../../types'
import { NumericInput } from '../shared/NumericInput'
import VacayBadge from './VacayBadge'


export default function VacayStats() {
  const { t } = useTranslation()
  const { stats, selectedYear, loadStats, updateVacationDays, isFused } = useVacayStore()
  const { user: currentUser } = useAuthStore()

  useEffect(() => { loadStats(selectedYear) }, [selectedYear])

  return (
    <div className="vg-card rounded-[22px]" style={{ padding: '14px 18px' }}>
      <div className="mb-2.5">
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--vg-ink3)' }}>
          {t('vacay.entitlement')} {selectedYear}
        </span>
      </div>

      {stats.length === 0 ? (
        <p className="text-[11px] text-center py-3" style={{ color: 'var(--vg-ink3)' }}>{t('vacay.noData')}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {stats.map(s => (
            <StatCard
              key={s.user_id}
              stat={s}
              isMe={s.user_id === currentUser?.id}
              canEdit={s.user_id === currentUser?.id || isFused}
              selectedYear={selectedYear}
              onSave={updateVacationDays}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface StatCardProps {
  stat: VacayStat
  isMe: boolean
  canEdit: boolean
  selectedYear: number
  onSave: (userId: number, year: number, days: number) => Promise<void>
  t: TranslationFn
}

function StatCard({ stat: s, isMe, canEdit, selectedYear, onSave, t }: StatCardProps) {
  const [editing, setEditing] = useState(false)
  // Holds the entitlement-day value while editing: a number on load, a string
  // once the user types into the number input.
  const [localDays, setLocalDays] = useState<number | string>(s.vacation_days)
  const pct = s.total_available > 0 ? Math.min(100, (s.used / s.total_available) * 100) : 0

  // Sync local state when stats reload from server
  useEffect(() => {
    if (!editing) setLocalDays(s.vacation_days)
  }, [s.vacation_days, editing])

  const handleSave = () => {
    setEditing(false)
    const days = parseInt(String(localDays))
    if (!isNaN(days) && days >= 0 && days <= 365 && days !== s.vacation_days) {
      onSave(selectedYear, days, s.user_id)
    }
  }

  const remainingColor = s.remaining < 0 ? '#ef4444' : s.remaining <= 3 ? '#f59e0b' : '#22c55e'
  const tileValue = { fontFamily: 'var(--font-subtext)', fontSize: 14, fontWeight: 700, height: 16, lineHeight: '16px' } as const

  return (
    <div style={{ padding: 10, borderRadius: 14, border: '1px solid var(--vg-line)' }}>
      <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.person_color }} />
        <span className="truncate min-w-0" style={{ fontSize: 13, fontWeight: 700, color: 'var(--vg-ink)' }}>
          {s.person_name}
        </span>
        {isMe && <VacayBadge label={t('vacay.you')} />}
        <span className="tabular-nums ml-auto" style={{ fontFamily: 'var(--font-subtext)', fontSize: 10.5, color: 'var(--vg-ink3)' }}>{s.used}/{s.total_available}</span>
      </div>
      <div className="overflow-hidden" style={{ height: 6, borderRadius: 99, background: 'var(--vg-surf2)', marginBottom: 7 }}>
        <div
          className="trek-bar-fill h-full rounded-full transition-[width] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"
          style={{ width: `${pct}%`, backgroundColor: s.person_color }}
        />
      </div>
      <div className="grid grid-cols-3" style={{ gap: 7 }}>
        {/* Days — editable */}
        <div
          className="group/days"
          style={{ padding: '6px 9px', borderRadius: 10, background: 'var(--vg-surf2)', cursor: canEdit ? 'pointer' : 'default' }}
          onClick={() => { if (canEdit && !editing) setEditing(true) }}
        >
          <div style={{ fontSize: 10, marginBottom: 2, color: 'var(--vg-ink3)', height: 13, lineHeight: '13px' }}>
            {t('vacay.entitlementDays')} {canEdit && !editing && <Pencil size={9} className="inline opacity-0 group-hover/days:opacity-100 transition-opacity" style={{ verticalAlign: 'middle', color: 'var(--vg-ink3)' }} />}
          </div>
          {editing ? (
            <NumericInput
              value={localDays}
              onValueChange={setLocalDays}
              onBlur={handleSave}
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') { setEditing(false); setLocalDays(s.vacation_days) } }}
              autoFocus
              className="w-full bg-transparent outline-none p-0 m-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              style={{ ...tileValue, color: 'var(--vg-ink)' }}
            />
          ) : (
            <div style={{ ...tileValue, color: 'var(--vg-ink)' }}>{s.vacation_days}</div>
          )}
        </div>
        {/* Used */}
        <div style={{ padding: '6px 9px', borderRadius: 10, background: 'var(--vg-surf2)' }}>
          <div style={{ fontSize: 10, marginBottom: 2, color: 'var(--vg-ink3)', height: 13, lineHeight: '13px' }}>{t('vacay.used')}</div>
          <div style={{ ...tileValue, color: 'var(--vg-ink)' }}>{s.used}</div>
        </div>
        {/* Remaining */}
        <div style={{ padding: '6px 9px', borderRadius: 10, background: 'var(--vg-surf2)' }}>
          <div style={{ fontSize: 10, marginBottom: 2, color: 'var(--vg-ink3)', height: 13, lineHeight: '13px' }}>{t('vacay.remaining')}</div>
          <div style={{ ...tileValue, color: remainingColor }}>{s.remaining}</div>
        </div>
      </div>
      {s.carried_over > 0 && (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.15)]" style={{ marginTop: 10 }}>
          <span className="text-[10px] text-[#d97706]">+{s.carried_over} {t('vacay.carriedOver', { year: selectedYear - 1 })}</span>
        </div>
      )}
    </div>
  )
}
