import { useRef } from 'react'
import { Building2, Check, ChevronDown, ChevronLeft, ChevronRight, Eye, EyeOff, Minus, PenLine, Pencil, Plus, Settings2, Share2, ShieldCheck, Trash2, Unlink, UserPlus, Users, Palette } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import MSheet from '../../components/MSheet'
import MIconBtn from '../../components/MIconBtn'
import MProgress from '../../components/MProgress'
import MDayPager from '../../components/MDayPager'
import { useActivePill } from '../../components/useActivePill'
import { useTranslation } from '../../../i18n'
import { useMVacay } from './useMVacay'
import MVacayMonth from './MVacayMonth'
import MVacayInviteSheet from './MVacayInviteSheet'
import MVacaySettingsSheet from './MVacaySettingsSheet'
import MVacayShareSheet from './MVacayShareSheet'
import { FALLBACK_PERSON_COLOR } from './vacayDayModel'
import { fmtDays } from '../../../components/Vacay/vacayFormat'
import { TileHeader } from '../trip/sheets/MTripSheetUi'

/** The company-holiday tint the calendar cells use (vacayDayModel). */
const COMPANY_COLOR = 'var(--m-vacay-company)'
const GLASS_PILL_BUTTON = 'inline-flex h-8 min-w-0 flex-1 basis-0 items-center justify-center gap-2 rounded-full border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)] px-3 text-[length:calc(12px*var(--fs-scale-body,1))] font-bold text-m-ink backdrop-blur-[24px] backdrop-saturate-[1.7] transition-transform active:scale-[.97]'
const SHEET_ROW = 'flex items-center gap-3 rounded-[16px] border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)] px-4 py-3 text-start text-[length:calc(14px*var(--fs-scale-body,1))] font-bold transition-transform active:scale-[.98]'

const WEEKDAY_KEYS_MONDAY = ['vacay.mon', 'vacay.tue', 'vacay.wed', 'vacay.thu', 'vacay.fri', 'vacay.sat', 'vacay.sun'] as const
const WEEKDAY_KEYS_SUNDAY = ['vacay.sun', 'vacay.mon', 'vacay.tue', 'vacay.wed', 'vacay.thu', 'vacay.fri', 'vacay.sat'] as const

/**
 * Mobile Vacay screen: year pill header, person card with inline entitlement
 * stepper, member/legend chips and the 12-month grid — or, in edit mode, the
 * single-month editor with quick month nav and the person/company mode
 * switch. The grid navigates (month chip or day cell open that month's editor),
 * the editor logs; the screen's own FAB in the dock centre flips back.
 */
export default function MVacay() {
  const { t } = useTranslation()
  const v = useMVacay()

  if (v.loading) {
    return (
      <div className="flex h-dvh items-center justify-center">
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
  // People to pick between: fused members, or shared calendars to show or hide.
  const peopleChoosable = v.users.length > 1 || v.incomingShares.length > 0
  const legendItems = [
    ...(v.companyHolidaysEnabled ? [{ key: 'company', color: COMPANY_COLOR, label: t('mobileVacay.companyLegend') }] : []),
    ...(v.holidaysEnabled ? (v.plan?.holiday_calendars ?? []).map(cal => ({ key: `cal-${cal.id}`, color: cal.color, label: cal.label || cal.region })) : []),
  ]
  const yearPages = v.years.map(year => ({ id: year }))
  const monthPages = v.months.map((_, slot) => ({ id: slot }))

  return (
    // h-dvh, not h-full: the shell stopped providing a definite height (#1809).
    <div className="relative h-dvh">
      {/* Header */}
      <div className="absolute inset-x-4 z-[5] flex items-center gap-2 top-[var(--m-safe-top,12px)]">
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
              {/* Used, carried over and comp days all fit on a desktop sidebar; on a
                  phone they turn into four scraps of 9px text. Only the number you
                  act on stays — the rest is a tap away in the entitlement view. */}
              <div className="mt-[6px] flex items-center">
                <span
                  className="inline-flex items-center gap-[3px] rounded-full px-[8px] py-[2px] font-geist text-[0.625rem] font-bold"
                  style={{ background: `${leftColor}1f`, border: `1px solid ${leftColor}47`, color: leftColor }}
                >
                  <span className="font-extrabold tabular-nums">{fmtDays(stat.remaining)}</span>
                  {t('mobileVacay.left')}
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
                  {t('vacay.entitlementDays')}
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

        {/* Who the calendar is for, and what its colours mean: two compact pills
            instead of a row of chips. Only the people are a choice; the legend is
            explanation, so it waits behind its own pill. */}
        {(peopleChoosable || legendItems.length > 0) && (
          <div className="mx-[2px] mb-2 mt-[9px] flex items-center gap-2">
            {peopleChoosable && (
              <button
                type="button"
                onClick={() => v.setSheet('people')}
                aria-haspopup="dialog"
                className={GLASS_PILL_BUTTON}
              >
                <span className="flex [&>*+*]:-ms-1">
                  {v.users.slice(0, 4).map(u => (
                    <span
                      key={u.id}
                      className="h-[14px] w-[14px] rounded-full ring-2 ring-[color:var(--m-glass)]"
                      style={{ background: u.color || FALLBACK_PERSON_COLOR }}
                    />
                  ))}
                </span>
                {t('mobileVacay.people')}
                <ChevronDown size={13} strokeWidth={2.4} className="text-m-faint" aria-hidden="true" />
              </button>
            )}
            {legendItems.length > 0 && (
              <button
                type="button"
                onClick={() => v.setSheet('legend')}
                aria-haspopup="dialog"
                className={GLASS_PILL_BUTTON}
              >
                <span className="flex gap-[3px]">
                  {legendItems.slice(0, 3).map(item => (
                    <span key={item.key} className="h-[9px] w-[9px] rounded-[3px]" style={{ background: item.color }} />
                  ))}
                </span>
                {t('mobileVacay.legend')}
              </button>
            )}
          </div>
        )}

        {/* Year grid */}
        {/* Swipe between the plan's years, like pages. The neighbouring year
            draws its calendar at once; its entries arrive once it lands. */}
        {!edit && (
          <MDayPager
            inFlow
            days={yearPages}
            selectedDayId={v.selectedYear}
            onSelectDay={v.selectYear}
            describeDay={i => String(v.years[i] ?? '')}
            renderDay={pageYear => (
          <div className="grid grid-cols-2 gap-[10px] wide:grid-cols-3 split:grid-cols-4">
            {/* Twelve months from the window start (#737) — Jan–Dec on a calendar
                year, Jul–Jun once the leave year is shifted. */}
            {v.monthsFor(pageYear ?? v.selectedYear).map(({ year, month }, slot) => (
              <div key={`${year}-${month}`} className="rounded-2xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] p-2">
                {/* The month name is the comfortable way into the editor: the mini
                    cells below it are ~21px on a phone, precise enough to navigate
                    with but not to aim at (#1811). Same chip as the edit view's
                    month nav, so it reads as tappable. */}
                <button
                  type="button"
                  onClick={() => v.openMonthSlot(slot)}
                  className="mb-[6px] w-full rounded-full border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)] py-[6px] text-center text-[length:calc(12px*var(--fs-scale-body,1))] font-extrabold capitalize shadow-[0_4px_12px_-8px_rgba(0,0,0,.25)] backdrop-blur-[24px] backdrop-saturate-[1.7] transition-transform active:scale-[.97]"
                >
                  {v.monthNamesShort[slot]}
                </button>
                <MVacayMonth
                  year={year}
                  month={month}
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
          />
        )}

        {/* Edit view: month quick nav + single month */}
        {edit && (
          <>
            {/* One glass surface for the twelve months, the picked one under a pill
                that glides to it, across the rows too. */}
            <MonthQuickNav names={v.monthNamesShort} slot={v.monthSlot} onPick={v.setMonthSlot} />
            {/* Swipe between the months of the window, like pages. */}
            <MDayPager
              inFlow
              days={monthPages}
              selectedDayId={v.monthSlot}
              onSelectDay={v.setMonthSlot}
              describeDay={i => v.monthNameLongFor(i)}
              renderDay={pageSlot => {
                const slot = pageSlot ?? v.monthSlot
                const m = v.months[slot] ?? v.activeMonth
                return (
            <div className="rounded-[18px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] p-[11px]">
              <div className="mb-[7px] flex items-center gap-2">
                <button type="button" onClick={v.prevMonth} aria-label={t('mobileVacay.prevMonth')} className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[color:var(--m-ic)]">
                  <ChevronLeft size={16} strokeWidth={2.2} />
                </button>
                <span className="flex-1 text-center text-[length:calc(16px*var(--fs-scale-body,1))] font-extrabold capitalize">{v.monthNameLongFor(slot)}</span>
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
                year={m.year}
                month={m.month}
                variant="full"
                weekStart={v.weekStart}
                ctx={v.dayCtx}
                tripDates={v.tripDates}
                tripDotColor={v.tripDotColor}
                onDayTap={v.handleDayTap}
              />
            </div>
                )
              }}
            />
          </>
        )}
      </div>

      {/* Mode switch (edit only) */}
      {edit && v.selectedUser && (
        <div className="m-span-x fixed z-[30] flex justify-center bottom-[calc(var(--bottom-nav-h,84px)+2px)] wide:bottom-[calc(env(safe-area-inset-bottom,0px)+84px)]">
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
                {t('mobileVacay.modeCompany')}
              </button>
            )}
            {/* Divider — comp/flex and half-day modify the selected person's logging, they aren't modes. */}
            <span className="mx-[1px] h-5 w-px self-center bg-[color:var(--m-shbr)]" aria-hidden />
            <button
              type="button"
              onClick={() => v.setCompDay(c => !c)}
              aria-pressed={v.compDay}
              aria-label={t('vacay.modeComp')}
              title={t('vacay.modeCompHint')}
              className={`flex h-9 w-9 flex-none items-center justify-center rounded-full ${
                v.compDay ? 'bg-m-act text-m-actfg' : 'bg-[color:var(--m-ic)] text-m-muted'
              }`}
            >
              {/* Hatched disc in the person's colour — the marker a comp day gets
                  in the grid (#1074), rather than an abstract clock. */}
              <span
                className="rounded-full"
                style={{
                  width: 15, height: 15,
                  background: `repeating-linear-gradient(45deg, ${v.selectedColor} 0 2px, transparent 2px 4px)`,
                  boxShadow: `inset 0 0 0 1.5px ${v.selectedColor}`,
                }}
              />
            </button>
            <button
              type="button"
              onClick={() => v.setHalfDay(h => !h)}
              aria-pressed={v.halfDay}
              aria-label={t('vacay.modeHalf')}
              title={t('vacay.modeHalfHint')}
              className={`flex h-9 w-9 flex-none items-center justify-center rounded-full ${
                v.halfDay ? 'bg-m-act text-m-actfg' : 'bg-[color:var(--m-ic)] text-m-muted'
              }`}
            >
              {/* The orange corner dot a half day carries in the grid (#552). */}
              <span className="rounded-full bg-[#f97316]" style={{ width: 15, height: 15 }} />
            </button>
          </div>
        </div>
      )}

      {/* View/edit FAB. It sits in the dock's centre slot, which MBottomNav leaves
          empty on /vacay so this stays the only action there (#1811). */}
      <button
        type="button"
        onClick={v.toggleView}
        aria-label={edit ? t('mobileVacay.viewYear') : t('mobileVacay.editCalendar')}
        className={`fixed start-[calc(50%+var(--m-rail-w,0px)/2-28px)] z-50 flex h-14 w-14 items-center justify-center rounded-full transition-[background,color] duration-300 ease-in-out bottom-[calc(env(safe-area-inset-bottom,0px)+15px)] ${
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
      <MSheet open={v.sheet === 'people'} onClose={() => v.setSheet(null)} variant="bottom" ariaLabel={t('mobileVacay.people')}>
        <div className="px-[18px] pb-4 pt-4">
          <div className="mb-3">
            <TileHeader
              icon={<Users size={19} strokeWidth={1.8} />}
              title={t('mobileVacay.people')}
              onClose={() => v.setSheet(null)}
              closeLabel={t('common.close')}
            />
          </div>
          <div className="flex flex-col gap-2">
            {v.users.map(u => {
              const color = u.color || FALLBACK_PERSON_COLOR
              const active = u.id === v.selectedUserId
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => { v.selectPerson(u.id); v.setSheet(null) }}
                  aria-pressed={active}
                  className={`${SHEET_ROW} ${active ? 'border-transparent bg-m-act text-m-actfg' : ''}`}
                >
                  <span className="h-[14px] w-[14px] flex-none rounded-full" style={{ background: color }} />
                  <span className="min-w-0 flex-1 truncate">{u.username}</span>
                  {active && <Check size={16} strokeWidth={2.4} aria-hidden="true" />}
                </button>
              )
            })}
          </div>
          {/* Shared read-only calendars: a tap shows or hides that person's ring overlay. */}
          {v.incomingShares.length > 0 && (
            <>
              <div className="mb-2 mt-4 px-1 font-geist text-[length:calc(10px*var(--fs-scale-body,1))] font-bold uppercase tracking-[.09em] text-m-faint">{t('vacay.sharedCalendars')}</div>
              <div className="flex flex-col gap-2">
                {v.incomingShares.map(sh => (
                  <button
                    key={`share-${sh.id}`}
                    type="button"
                    onClick={() => v.toggleShareHidden(sh.id, !sh.hidden)}
                    aria-pressed={!sh.hidden}
                    className={`${SHEET_ROW} ${sh.hidden ? 'opacity-60' : ''}`}
                  >
                    <span className="h-[14px] w-[14px] flex-none rounded-full" style={{ border: `2px solid ${sh.color}` }} />
                    <span className="min-w-0 flex-1 truncate">{sh.username}</span>
                    {sh.hidden
                      ? <EyeOff size={16} strokeWidth={2.2} className="text-m-faint" aria-hidden="true" />
                      : <Eye size={16} strokeWidth={2.2} className="text-m-muted" aria-hidden="true" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </MSheet>
      <MSheet open={v.sheet === 'legend'} onClose={() => v.setSheet(null)} variant="bottom" ariaLabel={t('mobileVacay.legend')}>
        <div className="px-[18px] pb-4 pt-4">
          <div className="mb-3">
            <TileHeader
              icon={<Palette size={19} strokeWidth={1.8} />}
              title={t('mobileVacay.legend')}
              onClose={() => v.setSheet(null)}
              closeLabel={t('common.close')}
            />
          </div>
          <div className="flex flex-col gap-1">
            {legendItems.map(item => (
              <div key={item.key} className="flex items-center gap-3 px-1 py-2 text-[length:calc(14px*var(--fs-scale-body,1))] font-semibold">
                <span className="h-[14px] w-[14px] flex-none rounded-[4px]" style={{ background: item.color }} />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </MSheet>
      <MVacayIncomingInvite
        invites={v.incomingInvites}
        onAccept={v.acceptInvite}
        onDecline={v.declineInvite}
      />
    </div>
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
          <div className="mt-3 flex flex-col gap-[6px] text-start">
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

/** The editor's month picker: the window's twelve months on one glass surface. */
function MonthQuickNav({ names, slot, onPick }: { names: string[]; slot: number; onPick: (slot: number) => void }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const pill = useActivePill(trackRef, '[data-active="true"]', `${slot}:${names.length}`, true)
  return (
    <div className="mb-[10px] rounded-[22px] border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)] p-1.5 shadow-[0_8px_24px_-16px_rgba(0,0,0,.3)] backdrop-blur-[24px] backdrop-saturate-[1.7]">
      <div ref={trackRef} className="relative grid grid-cols-6 gap-1">
        {/* rtl-lint-disable: the pill moves by the measured offsetLeft (useActivePill) */}{pill && <span aria-hidden="true" className="pointer-events-none absolute left-0 rounded-full bg-m-act" style={pill} />}
        {names.map((name, i) => (
          <button
            key={i}
            type="button"
            data-active={i === slot}
            aria-pressed={i === slot}
            onClick={() => onPick(i)}
            className={`relative z-[1] whitespace-nowrap rounded-full py-[7px] text-center text-[length:calc(11.5px*var(--fs-scale-body,1))] font-bold capitalize transition-colors duration-200 ${
              i === slot ? `text-m-actfg ${pill ? '' : 'bg-m-act'}` : 'text-m-ink active:bg-[color:var(--m-ic)]'
            }`}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  )
}
