import { Building2, ChevronLeft, ChevronRight, Eye, Minus, PenLine, Pencil, Plus, Settings2, Share2, ShieldCheck, Trash2, Unlink, UserPlus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import MSheet from '../../components/MSheet'
import MIconBtn from '../../components/MIconBtn'
import MProgress from '../../components/MProgress'
import { useTranslation } from '../../../i18n'
import { useMVacay } from './useMVacay'
import MVacayMonth from './MVacayMonth'
import MVacayInviteSheet from './MVacayInviteSheet'
import MVacaySettingsSheet from './MVacaySettingsSheet'
import MVacayShareSheet from './MVacayShareSheet'
import { FALLBACK_PERSON_COLOR } from './vacayDayModel'

const WEEKDAY_KEYS_MONDAY = ['vacay.mon', 'vacay.tue', 'vacay.wed', 'vacay.thu', 'vacay.fri', 'vacay.sat', 'vacay.sun'] as const
const WEEKDAY_KEYS_SUNDAY = ['vacay.sun', 'vacay.mon', 'vacay.tue', 'vacay.wed', 'vacay.thu', 'vacay.fri', 'vacay.sat'] as const

/**
 * Mobile Vacay screen: year pill header, person card with inline entitlement
 * stepper, member/legend chips and the 12-month grid — or, in edit mode, the
 * single-month editor with quick month nav and the person/company mode
 * switch. The dock FAB flips between the two views.
 */
export default function MVacay() {
  const { t } = useTranslation()
  const v = useMVacay()

  if (v.loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[color:var(--m-rowbr)] border-t-[color:var(--m-ink)]" />
      </div>
    )
  }

  const edit = v.view === 'edit'
  const stat = v.selectedStat
  const pct = stat && stat.total_available > 0 ? Math.round((stat.used / stat.total_available) * 100) : 0
  const leftColor = stat && stat.remaining <= 0
    ? (stat.remaining < 0 ? 'var(--m-st-danger)' : 'var(--m-st-pending)')
    : v.selectedColor
  const weekdayKeys = v.weekStart === 0 ? WEEKDAY_KEYS_SUNDAY : WEEKDAY_KEYS_MONDAY

  return (
    <div className="relative h-full">
      {/* Header */}
      <div className="absolute left-4 right-4 z-[5] flex items-center gap-2 top-[var(--m-safe-top,12px)]">
        <MIconBtn onClick={() => v.setSheet('invite')} ariaLabel={t('vacay.inviteUser')}>
          <UserPlus size={16} strokeWidth={2} className="text-m-muted" />
        </MIconBtn>
        <MIconBtn onClick={() => v.setSheet('share')} ariaLabel={t('vacay.sharedCalendars')}>
          <Share2 size={16} strokeWidth={2} className="text-m-muted" />
        </MIconBtn>
        <span className="flex flex-1 items-center justify-between rounded-full border border-[color:var(--m-gbr)] bg-[color:var(--m-sheet)] p-1 shadow-[0_5px_12px_-8px_rgba(0,0,0,.18)]">
          <button type="button" onClick={v.prevYear} aria-label={t('mobileVacay.prevYear')} className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full">
            <ChevronLeft size={17} strokeWidth={2.2} />
          </button>
          <span className="text-[1rem] font-extrabold tabular-nums">{v.selectedYear}</span>
          <button type="button" onClick={v.nextYear} aria-label={t('mobileVacay.nextYear')} className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full">
            <ChevronRight size={17} strokeWidth={2.2} />
          </button>
        </span>
        <MIconBtn onClick={() => v.setSheet('settings')} ariaLabel={t('vacay.settings')}>
          <Settings2 size={16} strokeWidth={2} className="text-m-muted" />
        </MIconBtn>
      </div>

      {/* Scroll container */}
      <div className="absolute inset-0 overflow-y-auto px-4 pt-[calc(var(--m-safe-top,12px)+44px)] pb-[calc(var(--bottom-nav-h,84px)+12px)]">
        {/* Selected person card */}
        {v.selectedUser && stat && (
          <div className="mt-2 flex items-center gap-3 rounded-[18px] border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)] px-[14px] py-[9px]">
            <span
              className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-[0.875rem] font-extrabold text-white"
              style={{ background: v.selectedColor }}
            >
              {v.selectedUser.username?.[0]?.toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[0.875rem] font-extrabold">{v.selectedUser.username}</div>
              <MProgress value={pct} color={v.selectedColor} className="mt-[6px]" />
              <div className="mt-[5px] flex items-center justify-between">
                <span className="font-geist text-[0.5625rem] font-bold text-m-muted">
                  {t('mobileVacay.usedCount', { count: stat.used })}
                </span>
                {stat.carried_over > 0 && (
                  <span className="font-geist text-[0.5625rem] font-bold text-[color:var(--m-st-pending)]">
                    +{stat.carried_over} {t('vacay.carriedOver', { year: v.selectedYear - 1 })}
                  </span>
                )}
                <span className="font-geist text-[0.5625rem] font-extrabold" style={{ color: leftColor }}>
                  {t('mobileVacay.leftCount', { count: stat.remaining })}
                </span>
              </div>
            </div>
            <div className="flex flex-none items-center gap-1">
              <button
                type="button"
                onClick={v.allowDec}
                aria-label={t('mobileVacay.decreaseAllowance')}
                className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[color:var(--m-ic)]"
              >
                <Minus size={15} strokeWidth={2.4} />
              </button>
              <div className="min-w-[40px] text-center">
                <div className="text-[1.1875rem] font-extrabold leading-none tabular-nums">{stat.vacation_days}</div>
                <div className="font-geist text-[0.5rem] font-bold uppercase tracking-[.06em] text-m-faint">
                  {t('mobileVacay.daysPerYear')}
                </div>
              </div>
              <button
                type="button"
                onClick={v.allowInc}
                aria-label={t('mobileVacay.increaseAllowance')}
                className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-m-act text-m-actfg"
              >
                <Plus size={15} strokeWidth={2.4} />
              </button>
            </div>
          </div>
        )}

        {/* Person + legend chips */}
        <div className="mx-[2px] mb-2 mt-[9px] flex flex-wrap items-center gap-[6px]">
          {v.users.map(u => {
            const color = u.color || FALLBACK_PERSON_COLOR
            const active = u.id === v.selectedUserId
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => v.selectPerson(u.id)}
                className="box-border inline-flex min-w-0 flex-[1_1_calc(25%-6px)] items-center justify-center gap-1 rounded-full px-1 py-1 font-geist text-[0.625rem] font-bold"
                style={active
                  ? { background: `${color}1f`, border: `1px solid ${color}`, color: 'var(--m-ink)' }
                  : { background: 'var(--m-sheetop)', border: '1px solid var(--m-rowbr)', color: 'var(--m-muted)' }}
              >
                <span className="h-[9px] w-[9px] flex-none rounded-[3px]" style={{ background: color }} />
                <span className="truncate">{u.username}</span>
              </button>
            )
          })}
          {/* Shared read-only calendars: tap toggles that person's ring overlay. */}
          {v.incomingShares.map(s => (
            <button
              key={`share-${s.id}`}
              type="button"
              onClick={() => v.toggleShareHidden(s.id, !s.hidden)}
              aria-pressed={!s.hidden}
              className="box-border inline-flex min-w-0 flex-[1_1_calc(25%-6px)] items-center justify-center gap-1 rounded-full px-1 py-1 font-geist text-[0.625rem] font-bold"
              style={s.hidden
                ? { background: 'var(--m-sheetop)', border: '1px solid var(--m-rowbr)', color: 'var(--m-faint)', opacity: 0.7 }
                : { background: `${s.color}1f`, border: `1px solid ${s.color}`, color: 'var(--m-ink)' }}
            >
              <span className="h-[9px] w-[9px] flex-none rounded-[3px]" style={{ border: `2px solid ${s.color}` }} />
              <span className="truncate">{s.username}</span>
            </button>
          ))}
          {v.companyHolidaysEnabled && (
            <LegendChip color="#F5D9A6" label={t('mobileVacay.companyLegend')} />
          )}
          {v.holidaysEnabled && (v.plan?.holiday_calendars ?? []).map(cal => (
            <LegendChip key={cal.id} color={cal.color} label={cal.label || cal.region} />
          ))}
        </div>

        {/* Year grid */}
        {!edit && (
          <div className="grid grid-cols-2 gap-[10px]">
            {Array.from({ length: 12 }, (_, m) => (
              <div key={m} className="rounded-2xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] p-2">
                <div className="mb-1 text-[0.75rem] font-extrabold capitalize">{v.monthNamesShort[m]}</div>
                <MVacayMonth
                  year={v.selectedYear}
                  month={m}
                  variant="mini"
                  weekStart={v.weekStart}
                  ctx={v.dayCtx}
                  tripDates={v.tripDates}
                  tripDotColor={v.tripDotColor}
                  onDayTap={v.handleDayTap}
                />
              </div>
            ))}
          </div>
        )}

        {/* Edit view: month quick nav + single month */}
        {edit && (
          <>
            <div className="mb-[10px] rounded-2xl border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)] p-2">
              <div className="grid grid-cols-6 gap-[5px]">
                {v.monthNamesShort.map((name, m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => v.setMonth(m)}
                    className={`whitespace-nowrap rounded-[11px] py-[7px] text-center text-[0.71875rem] font-bold capitalize ${
                      m === v.month
                        ? 'bg-m-act text-m-actfg'
                        : 'border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] text-m-ink'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-[18px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] p-[11px]">
              <div className="mb-[7px] flex items-center gap-2">
                <button type="button" onClick={v.prevMonth} aria-label={t('mobileVacay.prevMonth')} className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[color:var(--m-ic)]">
                  <ChevronLeft size={16} strokeWidth={2.2} />
                </button>
                <span className="flex-1 text-center text-[1rem] font-extrabold capitalize">{v.monthNameLong}</span>
                <button type="button" onClick={v.nextMonth} aria-label={t('mobileVacay.nextMonth')} className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[color:var(--m-ic)]">
                  <ChevronRight size={16} strokeWidth={2.2} />
                </button>
              </div>
              <div className="mb-[5px] grid grid-cols-7 gap-[2px]">
                {weekdayKeys.map(key => (
                  <span key={key} className="text-center font-geist text-[0.53125rem] font-bold text-m-faint">{t(key)}</span>
                ))}
              </div>
              <MVacayMonth
                year={v.selectedYear}
                month={v.month}
                variant="full"
                weekStart={v.weekStart}
                ctx={v.dayCtx}
                tripDates={v.tripDates}
                tripDotColor={v.tripDotColor}
                onDayTap={v.handleDayTap}
              />
            </div>
          </>
        )}
      </div>

      {/* Mode switch (edit only) */}
      {edit && v.selectedUser && (
        <div className="fixed inset-x-0 z-[30] flex justify-center bottom-[calc(var(--bottom-nav-h,84px)+2px)]">
          <div className="flex items-center gap-[5px] rounded-full border border-[color:var(--m-shbr)] bg-[color:var(--m-sheet)] p-[5px] shadow-[0_12px_30px_-12px_rgba(0,0,0,.4)]">
            <button
              type="button"
              onClick={() => v.setMode('vacation')}
              className={`flex items-center gap-[6px] whitespace-nowrap rounded-full px-[14px] py-2 text-[0.78125rem] font-bold ${
                v.mode === 'vacation' ? 'bg-m-act text-m-actfg' : 'bg-[color:var(--m-ic)] text-m-muted'
              }`}
            >
              <span className="h-[9px] w-[9px] rounded-full" style={{ background: v.selectedColor }} />
              {v.selectedUser.username}
            </button>
            {v.companyHolidaysEnabled && (
              <button
                type="button"
                onClick={() => v.setMode('company')}
                className={`flex items-center gap-[6px] whitespace-nowrap rounded-full px-[14px] py-2 text-[0.78125rem] font-bold ${
                  v.mode === 'company' ? 'bg-m-act text-m-actfg' : 'bg-[color:var(--m-ic)] text-m-muted'
                }`}
              >
                <Building2 size={13} strokeWidth={2.2} />
                {t('vacay.modeCompany')}
              </button>
            )}
            {/* Divider — the half-day switch modifies the selected person's logging, it isn't a mode. */}
            <span className="mx-[1px] h-5 w-px self-center bg-[color:var(--m-shbr)]" aria-hidden />
            <button
              type="button"
              onClick={() => v.setHalfDay(h => !h)}
              aria-pressed={v.halfDay}
              aria-label={t('vacay.modeHalf')}
              title={t('vacay.modeHalfHint')}
              className={`flex h-9 w-9 flex-none items-center justify-center rounded-full text-[0.9375rem] font-extrabold leading-none ${
                v.halfDay ? 'bg-m-act text-m-actfg' : 'bg-[color:var(--m-ic)] text-m-muted'
              }`}
            >
              ½
            </button>
          </div>
        </div>
      )}

      {/* View/edit FAB — replaces the dock "+" on this screen */}
      <button
        type="button"
        onClick={v.toggleView}
        aria-label={edit ? t('mobileVacay.viewYear') : t('mobileVacay.editCalendar')}
        className={`fixed left-1/2 z-50 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full transition-[background,color] duration-300 ease-in-out bottom-[calc(env(safe-area-inset-bottom,0px)+15px)] ${
          edit
            ? 'border-2 border-[color:var(--m-act)] bg-[color:var(--m-sheetop)] text-m-ink'
            : 'bg-m-act text-m-actfg shadow-[0_8px_20px_-6px_rgba(0,0,0,.4)]'
        }`}
      >
        <span className={`flex transition-transform duration-[380ms] ease-[cubic-bezier(.34,1.56,.64,1)] ${edit ? 'rotate-180' : 'rotate-0'}`}>
          {edit
            ? <Eye size={24} strokeWidth={2.3} />
            : <PenLine size={24} strokeWidth={2.3} />}
        </span>
      </button>

      {/* Sheets */}
      <MVacayInviteSheet open={v.sheet === 'invite'} onClose={() => v.setSheet(null)} />
      <MVacaySettingsSheet open={v.sheet === 'settings'} onClose={() => v.setSheet(null)} />
      <MVacayShareSheet open={v.sheet === 'share'} onClose={() => v.setSheet(null)} />
      <MVacayIncomingInvite
        invites={v.incomingInvites}
        onAccept={v.acceptInvite}
        onDecline={v.declineInvite}
      />
    </div>
  )
}

function LegendChip({ color, label }: { color: string; label: string }) {
  return (
    <span className="box-border inline-flex min-w-0 flex-[1_1_calc(25%-6px)] items-center justify-center gap-1 rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] px-1 py-1 font-geist text-[0.625rem] font-bold text-m-muted">
      <span className="h-[9px] w-[9px] flex-none rounded-[3px]" style={{ background: color }} />
      <span className="truncate">{label}</span>
    </span>
  )
}

/** Forced Fusion-request card — stays open until accepted or declined. */
function MVacayIncomingInvite({ invites, onAccept, onDecline }: {
  invites: { plan_id: number; owner_username: string }[]
  onAccept: (planId: number) => void
  onDecline: (planId: number) => void
}) {
  const { t } = useTranslation()
  const inv = invites[0]

  return (
    <MSheet open={Boolean(inv)} onClose={() => {}} variant="card" material="glass" ariaLabel={t('vacay.inviteTitle')}>
      {inv && (
        <div className="px-[18px] pb-[18px] pt-5 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--m-ic)] text-[1.125rem] font-extrabold">
            {inv.owner_username?.[0]?.toUpperCase()}
          </span>
          <div className="mt-3 text-[1.0625rem] font-bold">{t('vacay.inviteTitle')}</div>
          <div className="mt-1 font-geist text-[0.75rem] text-m-muted">
            <span className="font-bold text-m-ink">{inv.owner_username}</span> {t('vacay.inviteWantsToFuse')}
          </div>
          <div className="mt-3 flex flex-col gap-[6px] text-left">
            <FuseInfo icon={Eye} text={t('vacay.fuseInfo1')} />
            <FuseInfo icon={Pencil} text={t('vacay.fuseInfo2')} />
            <FuseInfo icon={Trash2} text={t('vacay.fuseInfo3')} />
            <FuseInfo icon={ShieldCheck} text={t('vacay.fuseInfo4')} />
            <FuseInfo icon={Unlink} text={t('vacay.fuseInfo5')} />
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => onDecline(inv.plan_id)}
              className="flex-1 rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] py-[10px] text-[0.78125rem] font-semibold"
            >
              {t('vacay.decline')}
            </button>
            <button
              type="button"
              onClick={() => onAccept(inv.plan_id)}
              className="flex-1 rounded-full bg-m-act py-[10px] text-[0.78125rem] font-semibold text-m-actfg"
            >
              {t('vacay.acceptFusion')}
            </button>
          </div>
        </div>
      )}
    </MSheet>
  )
}

function FuseInfo({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex items-start gap-[9px] rounded-xl bg-[color:var(--m-ic)] px-3 py-2">
      <Icon size={14} strokeWidth={2} className="mt-[1px] flex-none text-m-muted" />
      <span className="font-geist text-[0.6875rem] leading-snug">{text}</span>
    </div>
  )
}
