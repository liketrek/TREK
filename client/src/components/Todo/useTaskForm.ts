import { useCallback, useState } from 'react';
import type { TodoItem } from '../../types';
import { blankTaskFields, taskFieldsOf, type TaskFieldValues } from './todoListModel';

/**
 * The task form behind the desktop detail pane, the desktop new-task pane and the
 * phone task sheet: the name and fields being edited, and whether a save is out.
 * It starts on `item`, or on a blank task in `category`. Each surface keeps its
 * own guard, the payload of a new task and the wording of a failure.
 */
export function useTaskForm(item: TodoItem | null, category?: string | null) {
  const [name, setName] = useState(() => item?.name ?? '');
  const [fields, setFields] = useState<TaskFieldValues>(() => (item ? taskFieldsOf(item) : blankTaskFields(category)));
  const [saving, setSaving] = useState(false);

  const patchFields = useCallback((patch: Partial<TaskFieldValues>) => setFields((f) => ({ ...f, ...patch })), []);

  /** Puts the form back on a task, or on a blank one in `nextCategory`. */
  const load = useCallback((next: TodoItem | null, nextCategory?: string | null) => {
    setName(next ? next.name : '');
    setFields(next ? taskFieldsOf(next) : blankTaskFields(nextCategory));
  }, []);

  /** Runs one write with `saving` raised, and hands a failure to `onError`. */
  const saveWith = async (write: () => Promise<unknown>, onError: (err: unknown) => void) => {
    setSaving(true);
    try {
      await write();
    } catch (err) {
      onError(err);
    } finally {
      setSaving(false);
    }
  };

  return { name, setName, fields, patchFields, saving, load, saveWith };
}
