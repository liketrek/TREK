// FE-ADMIN-STOR-FORM-HOOK-001 to -007: the backend editor logic behind both admin shells.
import { act, renderHook } from '@testing-library/react';

import { STORAGE_BACKEND_TYPES, type StorageBackend, type StorageBackendFieldDef } from '@trek/shared';

import { useBackendForm } from './useBackendForm';

const NAMES = ['uploads-local', 'off-box'];
const LOCAL: StorageBackend = { name: 'off-box', type: 'local', options: { root: '/mnt' } };

function fieldsOf(type: keyof typeof STORAGE_BACKEND_TYPES) {
  return STORAGE_BACKEND_TYPES[type].fields as readonly StorageBackendFieldDef[];
}

describe('useBackendForm', () => {
  it('FE-ADMIN-STOR-FORM-HOOK-001: a new backend starts empty on the local type', () => {
    const { result } = renderHook(() => useBackendForm({ initial: null, backendNames: NAMES }));
    expect(result.current.type).toBe('local');
    expect(result.current.name).toBe('');
    expect(result.current.values).toEqual({});
    expect(result.current.targets).toEqual([]);
    expect(result.current.visibleCandidates).toEqual([]);
    expect(result.current.canApply).toBe(false);
  });

  it('FE-ADMIN-STOR-FORM-HOOK-002: an existing backend seeds its options as strings', () => {
    const initial: StorageBackend = { name: 'off-box', type: 'local', options: { root: '/mnt' } };
    const { result } = renderHook(() => useBackendForm({ initial, backendNames: NAMES }));
    expect(result.current.name).toBe('off-box');
    expect(result.current.values).toEqual({ root: '/mnt' });
    expect(result.current.duplicate).toBe(false);
    expect(result.current.refOptions).toEqual(['uploads-local']);
  });

  it('FE-ADMIN-STOR-FORM-HOOK-003: another backend name is a duplicate and blocks apply', () => {
    const { result } = renderHook(() => useBackendForm({ initial: LOCAL, backendNames: NAMES }));
    act(() => result.current.setName(' uploads-local '));
    expect(result.current.duplicate).toBe(true);
    expect(result.current.canApply).toBe(false);
  });

  it('FE-ADMIN-STOR-FORM-HOOK-004: changing the type clears the option values', () => {
    const { result } = renderHook(() => useBackendForm({ initial: null, backendNames: NAMES }));
    act(() => result.current.setValue('root', '/x'));
    act(() => result.current.changeType('s3'));
    expect(result.current.type).toBe('s3');
    expect(result.current.values).toEqual({});
    expect(result.current.fields).toBe(fieldsOf('s3'));
  });

  it('FE-ADMIN-STOR-FORM-HOOK-005: buildBackend trims the name, skips empty optional fields and reads numbers', () => {
    const { result } = renderHook(() => useBackendForm({ initial: null, backendNames: NAMES }));
    const required = fieldsOf('local').filter((f) => f.required);
    act(() => result.current.setName('  fresh  '));
    act(() => {
      for (const field of required) result.current.setValue(field.key, '/srv');
    });
    expect(result.current.canApply).toBe(true);
    const built = result.current.buildBackend();
    expect(built.name).toBe('fresh');
    expect(built.type).toBe('local');
    expect(Object.keys(built.options).sort()).toEqual(required.map((f) => f.key).sort());

    act(() => result.current.changeType('s3'));
    act(() => result.current.setValue('retries', '42'));
    expect((result.current.buildBackend().options as Record<string, unknown>).retries).toBe(42);
  });

  it('FE-ADMIN-STOR-FORM-HOOK-006: toggleRef adds and drops one backend of a list field', () => {
    const { result } = renderHook(() => useBackendForm({ initial: null, backendNames: NAMES }));
    act(() => result.current.toggleRef('replicas', 'off-box', true));
    expect(result.current.values.replicas).toEqual(['off-box']);
    act(() => result.current.toggleRef('replicas', 'uploads-local', true));
    act(() => result.current.toggleRef('replicas', 'off-box', false));
    expect(result.current.values.replicas).toEqual(['uploads-local']);
  });

  it('FE-ADMIN-STOR-FORM-HOOK-007: mirror targets start from the composer and hide the own name', () => {
    const { result } = renderHook(() =>
      useBackendForm({
        initial: LOCAL,
        backendNames: NAMES,
        mirror: { candidates: ['off-box', 'uploads-local', 'cold'], initialTargets: ['cold'] },
      })
    );
    expect(result.current.targets).toEqual(['cold']);
    expect(result.current.visibleCandidates).toEqual(['uploads-local', 'cold']);
    act(() => result.current.toggleTarget('uploads-local', true));
    act(() => result.current.toggleTarget('cold', false));
    expect(result.current.targets).toEqual(['uploads-local']);
  });
});
