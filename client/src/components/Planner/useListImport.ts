import { useState } from 'react';

import { placesApi } from '../../api/client';
import type { useTranslation } from '../../i18n';
import { useAuthStore } from '../../store/authStore';
import type { useToast } from '../shared/Toast';

export type ListImportProvider = 'google' | 'naver';

export interface ListImportOptions {
  tripId: number;
  t: ReturnType<typeof useTranslation>['t'];
  toast: ReturnType<typeof useToast>;
  loadTrip: (tripId: number) => Promise<unknown>;
  pushUndo?: (label: string, undoFn: () => Promise<void> | void) => void;
  /**
   * Where a successful import hands over, after its undo step is registered: the phone's
   * import sheet closes here. Without it the import runs as the desktop dialog, which
   * closes itself and clears the link before the undo step goes in.
   */
  onDone?: () => void;
}

/**
 * Importing a shared Google Maps or Naver list into the trip's places: the one logic
 * path behind the desktop dialog and the phone's import step, which render their own
 * markup over it. Same endpoints, the same optional Google enrichment, a toast for what
 * came in (or a warning when every entry was already there), and an undo step that
 * deletes the imported places again.
 */
export function useListImport({ tripId, t, toast, loadTrip, pushUndo, onDone }: ListImportOptions) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<ListImportProvider>('google');
  const [enrich, setEnrich] = useState(false);
  // Places-API enrichment (#886) needs a Google Maps key. Not the places
  // *provider* choice: enrichment's photos and summary come from Google (and,
  // keyless, from Wikimedia), which is independent of which provider answers
  // search: an Amap install with a Google key still enriches through Google.
  const canEnrich = useAuthStore((s) => s.hasMapsKey);

  /** The desktop dialog's way out: closed, and the link it held gone with it. */
  const close = () => {
    setOpen(false);
    setUrl('');
  };

  const handleImport = async () => {
    const trimmed = url.trim();
    // Only the phone step refuses a second import itself; the desktop dialog gates its
    // button and Enter key on the loading flag instead.
    if (!trimmed || (onDone && loading)) return;
    setLoading(true);
    try {
      const withEnrich = enrich && canEnrich;
      const result =
        provider === 'google'
          ? await placesApi.importGoogleList(tripId, trimmed, withEnrich)
          : await placesApi.importNaverList(tripId, trimmed, withEnrich);
      await loadTrip(tripId);
      if (result.count === 0 && result.skipped > 0) {
        toast.warning(t('places.importAllSkipped'));
      } else {
        toast.success(
          t(provider === 'google' ? 'places.googleListImported' : 'places.naverListImported', {
            count: result.count,
            list: result.listName,
          })
        );
      }
      if (!onDone) close();
      if (result.places?.length > 0) {
        const importedIds: number[] = result.places.map((p: { id: number }) => p.id);
        pushUndo?.(t(provider === 'google' ? 'undo.importGoogleList' : 'undo.importNaverList'), async () => {
          try {
            await placesApi.bulkDelete(tripId, importedIds);
          } catch {
            // best effort: the trip reload below reflects whatever happened
          }
          await loadTrip(tripId);
        });
      }
      onDone?.();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(message || t(provider === 'google' ? 'places.googleListError' : 'places.naverListError'));
    } finally {
      setLoading(false);
    }
  };

  return { open, setOpen, url, setUrl, loading, provider, setProvider, enrich, setEnrich, canEnrich, handleImport };
}
