import React, { useState } from 'react'
import { Check, ChevronDown, ChevronRight, Minus } from 'lucide-react'
import { getScopesByGroup } from '../../api/oauthScopes'
import { useTranslation } from '../../i18n'
import { fs } from '../shared/DialogShell'
import { SettingRows, SETTINGS_BUTTON } from '../Settings/settingsKit'

interface Props {
  selected: string[]
  onChange: (scopes: string[]) => void
}

/** The square of a checkbox in the accent look: ticked, partly ticked (mixed) or empty. */
function CheckBox({ checked, mixed = false }: { checked: boolean; mixed?: boolean }) {
  const on = checked || mixed
  return (
    <span
      aria-hidden="true"
      className={`grid h-[18px] w-[18px] flex-none place-items-center rounded-[5px] border transition-colors ${
        on ? 'border-transparent bg-accent text-accent-text' : 'border-edge bg-surface-card'
      }`}
    >
      {mixed ? <Minus size={12} strokeWidth={3} /> : checked ? <Check size={12} strokeWidth={3} /> : null}
    </span>
  )
}

/**
 * The scopes an OAuth client may ask for, grouped like the consent page: one row
 * per group with a fold-out list of its scopes. Every tick is a button with
 * role="checkbox", so it reads as one and answers to Space and Enter.
 */
export default function ScopeGroupPicker({ selected, onChange }: Props): React.ReactElement {
  const { t } = useTranslation()
  const [open, setOpen] = useState<Record<string, boolean>>({})

  const scopesByGroup = getScopesByGroup(t)
  const allScopeKeys = Object.values(scopesByGroup).flat().map(s => s.scope)
  const allSelected  = allScopeKeys.every(s => selected.includes(s))

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => onChange(allSelected ? [] : allScopeKeys)}
          className={`${SETTINGS_BUTTON} px-3 py-1.5`}
          style={fs(12, 'body')}
        >
          {allSelected ? t('settings.oauth.modal.deselectAll') : t('settings.oauth.modal.selectAll')}
        </button>
      </div>
      <div className="max-h-96 overflow-y-auto overscroll-contain">
        <SettingRows>
          {Object.entries(scopesByGroup).map(([group, groupScopes]) => {
            const groupScopeKeys    = groupScopes.map(s => s.scope)
            const allGroupSelected  = groupScopeKeys.every(s => selected.includes(s))
            const someGroupSelected = groupScopeKeys.some(s => selected.includes(s))
            const mixed = someGroupSelected && !allGroupSelected
            return (
              <div key={group}>
                <div className="flex items-center gap-2 px-3.5 py-2.5">
                  <button
                    type="button"
                    onClick={() => setOpen(prev => ({ ...prev, [group]: !prev[group] }))}
                    aria-expanded={!!open[group]}
                    className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-content-secondary hover:text-content"
                  >
                    {open[group]
                      ? <ChevronDown size={13} className="flex-none" />
                      : <ChevronRight size={13} className="flex-none" />}
                    <span className="truncate font-geist font-bold uppercase tracking-[.08em]" style={fs(10.5)}>{group}</span>
                    {someGroupSelected && (
                      <span className="flex-none font-geist tabular-nums text-content-faint" style={fs(11)}>
                        ({groupScopeKeys.filter(s => selected.includes(s)).length}/{groupScopeKeys.length})
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={mixed ? 'mixed' : allGroupSelected}
                    aria-label={allGroupSelected ? `Deselect all ${group}` : `Select all ${group}`}
                    onClick={() => onChange(
                      allGroupSelected
                        ? selected.filter(s => !groupScopeKeys.includes(s))
                        : [...new Set([...selected, ...groupScopeKeys])]
                    )}
                    className="grid h-7 w-7 flex-none place-items-center rounded-[8px] hover:bg-surface-secondary"
                  >
                    <CheckBox checked={allGroupSelected} mixed={mixed} />
                  </button>
                </div>
                {open[group] && (
                  <div className="divide-y divide-edge-faint border-t border-edge-faint bg-surface-secondary">
                    {groupScopes.map(({ scope, label, description }) => {
                      const on = selected.includes(scope)
                      return (
                        <button
                          key={scope}
                          type="button"
                          role="checkbox"
                          aria-checked={on}
                          onClick={() => onChange(on ? selected.filter(s => s !== scope) : [...selected, scope])}
                          className="flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left transition-colors hover:bg-surface-tertiary"
                        >
                          <span className="mt-px"><CheckBox checked={on} /></span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-medium text-content" style={fs(12.5, 'body')}>{label}</span>
                            <span className="block leading-snug text-content-faint" style={fs(11.5)}>{description}</span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </SettingRows>
      </div>
    </div>
  )
}
