import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { PackingBag } from '../../types';
import { bagLimitInput, useBagCardEditor } from './useBagCardEditor';

// FE-PACK-BAGEDIT-001 to FE-PACK-BAGEDIT-009

const BAG: PackingBag = {
  id: 3,
  trip_id: 7,
  name: 'Backpack',
  color: '#6366f1',
  sort_order: 0,
  weight_limit_grams: 7000,
  members: [{ user_id: 1, username: 'me' }],
};

function setup(options: { followBag?: boolean; resetUnsavedName?: boolean } = {}, bag: PackingBag = BAG) {
  const onUpdate = vi.fn();
  const onSetMembers = vi.fn();
  const rendered = renderHook(
    (props: { bag: PackingBag }) => useBagCardEditor({ bag: props.bag, onUpdate, onSetMembers, ...options }),
    {
      initialProps: { bag },
    }
  );
  return { ...rendered, onUpdate, onSetMembers };
}

describe('useBagCardEditor', () => {
  it('FE-PACK-BAGEDIT-001: a limit reads in kilos, and no limit as an empty field', () => {
    expect(bagLimitInput(7000)).toBe('7');
    expect(bagLimitInput(23500)).toBe('23.5');
    expect(bagLimitInput(null)).toBe('');
    expect(bagLimitInput(undefined)).toBe('');
    expect(bagLimitInput(0)).toBe('');
    const { result } = setup();
    expect(result.current.nameVal).toBe('Backpack');
    expect(result.current.limitVal).toBe('7');
    expect(result.current.editingName).toBe(false);
    expect(result.current.editingLimit).toBe(false);
  });

  it('FE-PACK-BAGEDIT-002: a changed name is saved trimmed and the field closes', () => {
    const { result, onUpdate } = setup();
    act(() => {
      result.current.setEditingName(true);
      result.current.setNameVal('  Daypack ');
    });
    act(() => result.current.saveName());
    expect(onUpdate).toHaveBeenCalledWith({ name: 'Daypack' });
    expect(result.current.editingName).toBe(false);
  });

  it('FE-PACK-BAGEDIT-003: an unsaved name stays as typed on the desktop and snaps back on the phone', () => {
    const desktop = setup({ followBag: true });
    act(() => desktop.result.current.setNameVal('   '));
    act(() => desktop.result.current.saveName());
    expect(desktop.onUpdate).not.toHaveBeenCalled();
    expect(desktop.result.current.nameVal).toBe('   ');

    const phone = setup({ resetUnsavedName: true });
    act(() => phone.result.current.setNameVal('Backpack '));
    act(() => phone.result.current.saveName());
    expect(phone.onUpdate).not.toHaveBeenCalled();
    expect(phone.result.current.nameVal).toBe('Backpack');
  });

  it('FE-PACK-BAGEDIT-004: cancelling a name puts the bag name back and closes the field', () => {
    const { result } = setup();
    act(() => {
      result.current.setEditingName(true);
      result.current.setNameVal('Other');
    });
    act(() => result.current.cancelName());
    expect(result.current.nameVal).toBe('Backpack');
    expect(result.current.editingName).toBe(false);
  });

  it('FE-PACK-BAGEDIT-005: a limit typed in kilos, with a comma or a point, is saved in grams', () => {
    const { result, onUpdate } = setup();
    act(() => {
      result.current.setEditingLimit(true);
      result.current.setLimitVal(' 8,25 ');
    });
    act(() => result.current.saveLimit());
    expect(onUpdate).toHaveBeenCalledWith({ weight_limit_grams: 8250 });
    expect(result.current.editingLimit).toBe(false);
    onUpdate.mockClear();
    act(() => result.current.setLimitVal('7.0'));
    act(() => result.current.saveLimit());
    // The same limit as stored: nothing to send.
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('FE-PACK-BAGEDIT-006: an emptied limit removes it, but only when there was one', () => {
    const withLimit = setup();
    act(() => withLimit.result.current.setLimitVal(''));
    act(() => withLimit.result.current.saveLimit());
    expect(withLimit.onUpdate).toHaveBeenCalledWith({ weight_limit_grams: null });

    const without = setup({}, { ...BAG, weight_limit_grams: null });
    act(() => without.result.current.saveLimit());
    expect(without.onUpdate).not.toHaveBeenCalled();
  });

  it('FE-PACK-BAGEDIT-007: an unreadable or non-positive limit is dropped for the stored one', () => {
    const { result, onUpdate } = setup();
    for (const typed of ['heavy', '-3', '0']) {
      act(() => result.current.setLimitVal(typed));
      act(() => result.current.saveLimit());
      expect(result.current.limitVal).toBe('7');
    }
    act(() => {
      result.current.setEditingLimit(true);
      result.current.setLimitVal('12');
    });
    act(() => result.current.cancelLimit());
    expect(result.current.limitVal).toBe('7');
    expect(result.current.editingLimit).toBe(false);
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('FE-PACK-BAGEDIT-008: the desktop fields follow the bag as it changes elsewhere, the phone ones do not', () => {
    const renamed = { ...BAG, name: 'Daypack', weight_limit_grams: 9000 };
    const desktop = setup({ followBag: true });
    desktop.rerender({ bag: renamed });
    expect(desktop.result.current.nameVal).toBe('Daypack');
    expect(desktop.result.current.limitVal).toBe('9');

    const phone = setup({ resetUnsavedName: true });
    phone.rerender({ bag: renamed });
    expect(phone.result.current.nameVal).toBe('Backpack');
    expect(phone.result.current.limitVal).toBe('7');
  });

  it('FE-PACK-BAGEDIT-009: tapping a member takes them off the bag, anyone else is added', () => {
    const { result, onSetMembers } = setup();
    expect(result.current.memberIds).toEqual([1]);
    act(() => result.current.toggleMember(1));
    expect(onSetMembers).toHaveBeenLastCalledWith([]);
    act(() => result.current.toggleMember(4));
    expect(onSetMembers).toHaveBeenLastCalledWith([1, 4]);
    expect(setup({}, { ...BAG, members: undefined }).result.current.memberIds).toEqual([]);
  });
});
