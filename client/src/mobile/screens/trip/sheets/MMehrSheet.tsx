import { CalendarPlus, ChevronRight, Settings, Share2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import MSheet from '../../../components/MSheet'
import type { MTripSheetsProps } from '../MTripShell'
import { useTranslation } from '../../../../i18n'

/** The sections living in the dock — everything else surfaces in this sheet. */
const DOCK_IDS = new Set(['plan', 'transports', 'buchungen', 'finanzplan', 'listen'])

/** Demo tile tints per legacy tab id; plugins share the files neutral. */
const TILE_COLORS: Record<string, string> = {
  transports: '#4A7DDB',
  buchungen: '#9B5DE5',
  listen: '#2FA9A0',
  finanzplan: '#E8A33D',
  dateien: '#68686F',
  collab: '#EC4899',
}

/**
 * "Mehr" dock-overflow sheet: bottom-anchored panel above the dock with a
 * transparent scrim. Grid of the trip sections that did not fit the dock
 * (files/collab/plugins, with short stats) plus the share/export/settings rows.
 */
export default function MMehrSheet({ planner, shell }: MTripSheetsProps) {
  const { t } = useTranslation()
  const open = shell.sheet?.id === 'mehr'
  const canEditTrip = planner.can('trip_edit', planner.trip)

  const gridTabs = planner.TRIP_TABS.filter(tab => !DOCK_IDS.has(tab.id))

  const tileStat = (id: string): string | null => {
    if (id === 'dateien') {
      return t('mobileTrip.statDocuments', { count: planner.files.filter(f => !f.deleted_at).length })
    }
    if (id === 'collab') {
      return t('mobileTrip.statPeople', { count: planner.tripMembers.length })
    }
    return null
  }

  const openSection = (id: string) => {
    shell.closeSheet()
    shell.setTrTab(id)
  }

  const actions: { id: string; icon: LucideIcon; label: string; go: () => void }[] = [
    { id: 'members', icon: Share2, label: t('members.shareTrip'), go: () => shell.openSheet('members') },
    { id: 'export', icon: CalendarPlus, label: t('mobileTrip.exportCalendar'), go: () => shell.openSheet('export') },
    ...(canEditTrip
      ? [{ id: 'tripedit', icon: Settings, label: t('dashboard.editTrip'), go: () => shell.openSheet('tripedit') }]
      : []),
  ]

  return (
    <MSheet open={open} onClose={shell.closeSheet} variant="bottom" ariaLabel={t('mobileTrip.more')}>
      <div className="overflow-y-auto p-[10px]">
        {gridTabs.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {gridTabs.map(tab => {
              const Icon = tab.icon
              const color = TILE_COLORS[tab.id] ?? TILE_COLORS.dateien
              const stat = tileStat(tab.id)
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => openSection(tab.id)}
                  className="rounded-[18px] bg-[color:var(--m-ic)] px-4 pb-[15px] pt-[14px] text-left"
                >
                  <div
                    className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px]"
                    style={{ background: `${color}22`, color }}
                  >
                    {Icon && <Icon size={19} strokeWidth={1.9} />}
                  </div>
                  <div className="mt-3 truncate text-[0.90625rem] font-bold">{tab.label}</div>
                  {stat && <div className="truncate font-geist text-[0.65625rem] text-m-muted">{stat}</div>}
                </button>
              )
            })}
          </div>
        )}

        <div className={`flex flex-col gap-2 ${gridTabs.length > 0 ? 'mt-2' : ''}`}>
          {actions.map(action => (
            <button
              key={action.id}
              type="button"
              onClick={action.go}
              className="flex w-full items-center gap-[13px] rounded-[18px] bg-[color:var(--m-ic)] px-4 py-[14px] text-left"
            >
              <div className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[10px] bg-[color:var(--m-ic)]">
                <action.icon size={17} strokeWidth={1.9} />
              </div>
              <span className="min-w-0 flex-1 truncate text-[0.875rem] font-semibold">{action.label}</span>
              <ChevronRight size={16} strokeWidth={2} className="flex-none text-m-faint" />
            </button>
          ))}
        </div>
      </div>
    </MSheet>
  )
}
