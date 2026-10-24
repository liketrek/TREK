import { useState } from 'react';
import { getScopesByGroup } from '../../api/oauthScopes';
import { useTranslation } from '../../i18n';

/** How much of one scope group is ticked. `mixed` is some but not all of it. */
export interface ScopeGroupState {
  keys: string[];
  allSelected: boolean;
  someSelected: boolean;
  mixed: boolean;
  selectedCount: number;
}

/**
 * The scope picker logic behind the desktop picker and its phone twin, which
 * render their own rows over it: the grouped scopes, which groups are folded
 * out, and the select-all, per-group and per-scope toggles. `selected` and
 * `onChange` stay owned by the caller.
 */
export function useScopeSelection(selected: string[], onChange: (scopes: string[]) => void) {
  const { t } = useTranslation();
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const scopesByGroup = getScopesByGroup(t);
  const allScopeKeys = Object.values(scopesByGroup)
    .flat()
    .map((s) => s.scope);
  const allSelected = allScopeKeys.every((s) => selected.includes(s));

  const groupState = (groupScopes: { scope: string }[]): ScopeGroupState => {
    const keys = groupScopes.map((s) => s.scope);
    const allGroupSelected = keys.every((s) => selected.includes(s));
    const someGroupSelected = keys.some((s) => selected.includes(s));
    return {
      keys,
      allSelected: allGroupSelected,
      someSelected: someGroupSelected,
      mixed: someGroupSelected && !allGroupSelected,
      selectedCount: keys.filter((s) => selected.includes(s)).length,
    };
  };

  const toggleOpen = (group: string) => setOpen((prev) => ({ ...prev, [group]: !prev[group] }));

  const toggleAll = () => onChange(allSelected ? [] : allScopeKeys);

  const toggleGroup = (group: ScopeGroupState) =>
    onChange(
      group.allSelected ? selected.filter((s) => !group.keys.includes(s)) : [...new Set([...selected, ...group.keys])]
    );

  const toggleScope = (scope: string) => {
    const on = selected.includes(scope);
    onChange(on ? selected.filter((s) => s !== scope) : [...selected, scope]);
  };

  return { scopesByGroup, allSelected, open, groupState, toggleOpen, toggleAll, toggleGroup, toggleScope };
}
