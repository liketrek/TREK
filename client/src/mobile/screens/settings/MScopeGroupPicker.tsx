/**
 * Mobile-native twin of components/OAuth/ScopeGroupPicker. Same logic
 * (getScopesByGroup, select-all / per-group / per-scope toggles with the
 * indeterminate group state) rebuilt on the mobile token system: collapsible
 * group cards, a square tri-state group selector and tap-to-toggle scope rows
 * with a confirm-coloured check.
 */
import { Check, ChevronDown, ChevronRight, Minus } from 'lucide-react'
import { useScopeSelection } from '../../../components/OAuth/useScopeSelection'
import { useTranslation } from '../../../i18n'

interface Props {
  selected: string[]
  onChange: (scopes: string[]) => void
}

export default function MScopeGroupPicker({ selected, onChange }: Props) {
  const { t } = useTranslation()
  const { scopesByGroup, allSelected, open, groupState, toggleOpen, toggleAll, toggleGroup, toggleScope } =
    useScopeSelection(selected, onChange)

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={toggleAll}
          className="rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-3 py-[5px] font-geist text-[0.6875rem] font-bold text-m-ink"
        >
          {allSelected ? t('settings.oauth.modal.deselectAll') : t('settings.oauth.modal.selectAll')}
        </button>
      </div>

      <div className="max-h-[22rem] space-y-2 overflow-y-auto pe-[2px]">
        {Object.entries(scopesByGroup).map(([group, groupScopes]) => {
          const state = groupState(groupScopes)
          const { allSelected: allGroupSelected, someSelected: someGroupSelected, selectedCount: selectedInGroup } = state
          const isOpen = !!open[group]

          return (
            <div key={group} className="overflow-hidden rounded-xl border border-[color:var(--m-rowbr)]">
              <div className="flex items-center gap-1 bg-[color:var(--m-sheet)] px-3 py-2">
                <button
                  type="button"
                  onClick={() => toggleOpen(group)}
                  className="flex flex-1 items-center gap-1 text-start text-[0.75rem] font-bold text-m-ink"
                >
                  {isOpen ? (
                    <ChevronDown size={13} className="flex-none text-m-faint" />
                  ) : (
                    <ChevronRight size={13} className="flex-none text-m-faint" />
                  )}
                  <span className="min-w-0 truncate">{group}</span>
                  {someGroupSelected && (
                    <span className="ms-[6px] flex-none font-geist text-[0.625rem] font-normal text-m-faint">
                      ({selectedInGroup}/{state.keys.length})
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => toggleGroup(state)}
                  aria-label={allGroupSelected ? `Deselect all ${group}` : `Select all ${group}`}
                  className={`flex h-[22px] w-[22px] flex-none items-center justify-center rounded-[7px] border ${
                    allGroupSelected
                      ? 'border-transparent bg-m-act text-m-actfg'
                      : someGroupSelected
                        ? 'border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] text-m-ink'
                        : 'border-[color:var(--m-rowbr)] bg-transparent text-m-ink'
                  }`}
                >
                  {allGroupSelected ? (
                    <Check size={13} strokeWidth={2.6} />
                  ) : someGroupSelected ? (
                    <Minus size={13} strokeWidth={2.6} />
                  ) : null}
                </button>
              </div>

              {isOpen && (
                <div>
                  {groupScopes.map(({ scope, label, description }) => {
                    const on = selected.includes(scope)
                    return (
                      <button
                        key={scope}
                        type="button"
                        onClick={() => toggleScope(scope)}
                        className="flex w-full items-start gap-2.5 border-t border-[color:var(--m-rowbr)] px-3 py-2 text-start"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-[0.75rem] font-semibold text-m-ink">{label}</p>
                          <p className="mt-[1px] font-geist text-[0.625rem] leading-relaxed text-m-muted">
                            {description}
                          </p>
                        </div>
                        {on && (
                          <Check
                            size={14}
                            strokeWidth={2.6}
                            className="mt-[2px] flex-none text-[color:var(--m-st-confirmed)]"
                          />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
