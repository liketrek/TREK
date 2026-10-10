import { useMemo, useState, type ChangeEvent } from 'react';

import { packingApi } from '../../api/client';
import { useTripStore } from '../../store/tripStore';
import { parseImportLines } from './packingListPanel.helpers';

type Translate = (key: string, params?: Record<string, string | number>) => string;
interface Toaster {
  success: (message: string) => void;
  error: (message: string) => void;
}

/**
 * The bulk packing import behind the desktop dialog and the phone sheet: the
 * pasted or loaded text, one item per line, and sending it in one request whose
 * items land straight in the trip store. `onImported` closes the surface.
 *
 * The desktop dialog says so when no line parses (`reportEmpty`); the phone sheet
 * keeps its button disabled then, and lets one import run at a time (`oneAtATime`).
 */
export function usePackingImport({
  tripId,
  t,
  toast,
  onImported,
  reportEmpty = false,
  oneAtATime = false,
}: {
  tripId: number;
  t: Translate;
  toast: Toaster;
  onImported: () => void;
  reportEmpty?: boolean;
  oneAtATime?: boolean;
}) {
  const [text, setText] = useState('');
  const [importing, setImporting] = useState(false);
  const parsed = useMemo(() => parseImportLines(text), [text]);

  /** Loads a picked CSV, text or Markdown file into the text box. */
  const readFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setText(reader.result);
    };
    reader.readAsText(file);
  };

  const runImport = async () => {
    const lines = parseImportLines(text);
    if (lines.length === 0) {
      if (reportEmpty) toast.error(t('packing.importEmpty'));
      return;
    }
    if (oneAtATime) {
      if (importing) return;
      setImporting(true);
    }
    try {
      const result = await packingApi.bulkImport(tripId, lines);
      useTripStore.setState((s) => ({ packingItems: [...s.packingItems, ...(result.items || [])] }));
      toast.success(t('packing.importSuccess', { count: result.count }));
      setText('');
      onImported();
    } catch {
      toast.error(t('packing.importError'));
    } finally {
      if (oneAtATime) setImporting(false);
    }
  };

  return { text, setText, parsed, importing, readFile, runImport };
}
