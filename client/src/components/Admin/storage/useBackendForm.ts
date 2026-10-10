import { useState } from 'react';

import {
  STORAGE_BACKEND_TYPES,
  type StorageBackend,
  type StorageBackendFieldDef,
  type StorageBackendTypeId,
} from '@trek/shared';

type FieldValues = Record<string, string | string[]>;

function valuesOf(backend: StorageBackend | null): FieldValues {
  if (!backend) return {};
  const values: FieldValues = {};
  for (const [key, value] of Object.entries(backend.options)) {
    values[key] = Array.isArray(value) ? value : String(value);
  }
  return values;
}

interface UseBackendFormOptions {
  /** null = new backend */
  initial: StorageBackend | null;
  /** Every defined backend name: mirror-target options and the duplicate pre-check. */
  backendNames: string[];
  /** The Mirror-targets composer's inputs, when the shell shows one. */
  mirror?: { candidates: string[]; initialTargets: string[] };
}

/**
 * The storage backend editor behind both admin shells (the desktop dialog and the phone
 * card render their own fields over it). Holds the draft name, type, option values and
 * mirror targets, checks the draft against the type's declared fields, and builds the
 * backend the shell commits. Which arguments the commit gets stays with each shell.
 */
export function useBackendForm({ initial, backendNames, mirror }: UseBackendFormOptions) {
  const [type, setType] = useState<StorageBackendTypeId>(initial?.type ?? 'local');
  const [name, setName] = useState(initial?.name ?? '');
  const [values, setValues] = useState<FieldValues>(() => valuesOf(initial));
  const [targets, setTargets] = useState<string[]>(mirror?.initialTargets ?? []);

  const fields = STORAGE_BACKEND_TYPES[type].fields as readonly StorageBackendFieldDef[];
  const refOptions = backendNames.filter((candidate) => candidate !== name.trim());
  const setValue = (key: string, value: string | string[]) => setValues((prev) => ({ ...prev, [key]: value }));

  const changeType = (next: StorageBackendTypeId) => {
    setType(next);
    setValues({}); // a different type has different fields
  };

  /** Adds or drops one backend from a `backend-ref-list` field. */
  const toggleRef = (key: string, candidate: string, checked: boolean) => {
    const value = values[key];
    const selected = Array.isArray(value) ? value : [];
    setValue(key, checked ? [...selected, candidate] : selected.filter((existing) => existing !== candidate));
  };

  const toggleTarget = (candidate: string, checked: boolean) =>
    setTargets(checked ? [...targets, candidate] : targets.filter((existing) => existing !== candidate));

  const filled = (field: StorageBackendFieldDef): boolean => {
    const value = values[field.key];
    if (field.kind === 'backend-ref-list') return Array.isArray(value) && value.length > 0;
    return typeof value === 'string' && value.trim() !== '';
  };
  const duplicate = name.trim() !== (initial?.name ?? '') && backendNames.includes(name.trim());
  const canApply = name.trim() !== '' && !duplicate && fields.every((f) => !f.required || filled(f));

  const buildBackend = (): StorageBackend => {
    const options: Record<string, unknown> = {};
    for (const field of fields) {
      const value = values[field.key];
      if (field.kind === 'backend-ref-list') {
        options[field.key] = Array.isArray(value) ? value : [];
        continue;
      }
      const text = typeof value === 'string' ? value : '';
      if (text === '' && !field.required) continue; // omitted, so the shared schema default applies
      options[field.key] = field.kind === 'number' ? Number(text) : text;
    }
    // The options were built from the same field defs the schema is generated
    // from, the same sanctioned cast storageModel.asWireBackend makes.
    return { name: name.trim(), type, options } as StorageBackend;
  };

  const visibleCandidates = mirror ? mirror.candidates.filter((candidate) => candidate !== name.trim()) : [];

  return {
    type,
    changeType,
    name,
    setName,
    values,
    setValue,
    toggleRef,
    targets,
    toggleTarget,
    fields,
    refOptions,
    duplicate,
    canApply,
    buildBackend,
    visibleCandidates,
  };
}
