// FE-COMP-SCOPESEL-001 to -006: the scope picker logic the desktop picker and its phone twin share.
import { act, renderHook } from '@testing-library/react';
import { SCOPE_GROUPS } from '../../api/oauthScopes';
import { useScopeSelection } from './useScopeSelection';

vi.mock('../../i18n', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));

const TRIPS = 'oauth.scope.group.trips';
const ALL = Object.keys(SCOPE_GROUPS);
const TRIP_SCOPES = ALL.filter((s) => SCOPE_GROUPS[s].groupKey === TRIPS);

function setup(selected: string[]) {
  const onChange = vi.fn();
  const hook = renderHook(({ sel }) => useScopeSelection(sel, onChange), { initialProps: { sel: selected } });
  return { ...hook, onChange };
}

describe('useScopeSelection', () => {
  it('FE-COMP-SCOPESEL-001: groups every scope under its translated group', () => {
    const { result } = setup([]);
    expect(result.current.scopesByGroup[TRIPS].map((s) => s.scope)).toEqual(TRIP_SCOPES);
    expect(Object.values(result.current.scopesByGroup).flat()).toHaveLength(ALL.length);
  });

  it('FE-COMP-SCOPESEL-002: select all ticks every scope, and with all ticked it clears them', () => {
    const { result, rerender, onChange } = setup([]);
    expect(result.current.allSelected).toBe(false);
    const grouped = Object.values(result.current.scopesByGroup)
      .flat()
      .map((s) => s.scope);
    act(() => result.current.toggleAll());
    expect(onChange).toHaveBeenLastCalledWith(grouped);
    rerender({ sel: ALL });
    expect(result.current.allSelected).toBe(true);
    act(() => result.current.toggleAll());
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('FE-COMP-SCOPESEL-003: group state counts the ticked scopes and flags a partly ticked group as mixed', () => {
    const { result } = setup([TRIP_SCOPES[0]]);
    const state = result.current.groupState(result.current.scopesByGroup[TRIPS]);
    expect(state).toEqual({
      keys: TRIP_SCOPES,
      allSelected: false,
      someSelected: true,
      mixed: true,
      selectedCount: 1,
    });
  });

  it('FE-COMP-SCOPESEL-004: toggling a group adds its missing scopes once, or removes all of them', () => {
    const other = ALL.find((s) => !TRIP_SCOPES.includes(s)) as string;
    const { result, rerender, onChange } = setup([other, TRIP_SCOPES[0]]);
    act(() => result.current.toggleGroup(result.current.groupState(result.current.scopesByGroup[TRIPS])));
    expect(onChange).toHaveBeenLastCalledWith([other, ...TRIP_SCOPES]);
    rerender({ sel: [other, ...TRIP_SCOPES] });
    act(() => result.current.toggleGroup(result.current.groupState(result.current.scopesByGroup[TRIPS])));
    expect(onChange).toHaveBeenLastCalledWith([other]);
  });

  it('FE-COMP-SCOPESEL-005: toggling one scope appends or removes just that scope', () => {
    const { result, onChange } = setup([TRIP_SCOPES[0]]);
    act(() => result.current.toggleScope(TRIP_SCOPES[1]));
    expect(onChange).toHaveBeenLastCalledWith([TRIP_SCOPES[0], TRIP_SCOPES[1]]);
    act(() => result.current.toggleScope(TRIP_SCOPES[0]));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('FE-COMP-SCOPESEL-006: groups start folded and fold out and back per group', () => {
    const { result } = setup([]);
    expect(result.current.open[TRIPS]).toBeUndefined();
    act(() => result.current.toggleOpen(TRIPS));
    expect(result.current.open[TRIPS]).toBe(true);
    act(() => result.current.toggleOpen(TRIPS));
    expect(result.current.open[TRIPS]).toBe(false);
  });
});
