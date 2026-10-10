import { useEffect, useState } from 'react';

import { packingApi } from '../../api/client';
import { useTripStore } from '../../store/tripStore';
import type { PackingView } from './packingListModel';

type Translate = (key: string, params?: Record<string, string | number>) => string;
interface Toaster {
  success: (message: string) => void;
  error: (message: string) => void;
}

export interface PackingTemplate {
  id: number;
  name: string;
  item_count: number;
}

/**
 * Packing templates for both packing lists: the trip's template list, applying
 * one into the list being looked at, and saving the trip's list as a new one.
 * Each surface closes its own menu, dropdown or field through `onApplied` and
 * `onSaved`, which run where the surface used to close it.
 */
export function usePackingTemplates({
  tripId,
  view,
  t,
  toast,
  onApplied,
  onSaved,
}: {
  tripId: number;
  view: PackingView;
  t: Translate;
  toast: Toaster;
  onApplied: () => void;
  onSaved: () => void;
}) {
  const [templates, setTemplates] = useState<PackingTemplate[]>([]);
  const [applyingTemplate, setApplyingTemplate] = useState(false);
  const [saveTemplateName, setSaveTemplateName] = useState('');

  useEffect(() => {
    packingApi
      .listTemplates(tripId)
      .then((d) => setTemplates(d.templates || []))
      .catch(() => {
        // Without the list there is simply nothing to apply.
      });
  }, [tripId]);

  const applyTemplate = async (templateId: number) => {
    setApplyingTemplate(true);
    try {
      // Land the items in the list the user is looking at: without the
      // visibility the API defaults to 'common' and they vanish from My list.
      const data = await packingApi.applyTemplate(tripId, templateId, view);
      useTripStore.setState((s) => ({ packingItems: [...s.packingItems, ...(data.items || [])] }));
      toast.success(t('packing.templateApplied', { count: data.count }));
      onApplied();
    } catch {
      toast.error(t('packing.templateError'));
    } finally {
      setApplyingTemplate(false);
    }
  };

  const saveAsTemplate = async () => {
    if (!saveTemplateName.trim()) return;
    try {
      await packingApi.saveAsTemplate(tripId, saveTemplateName.trim());
      toast.success(t('packing.templateSaved'));
      setSaveTemplateName('');
      onSaved();
      packingApi
        .listTemplates(tripId)
        .then((d) => setTemplates(d.templates || []))
        .catch(() => {
          // The template is saved; the list catches up on the next load.
        });
    } catch {
      toast.error(t('common.error'));
    }
  };

  return { templates, applyingTemplate, applyTemplate, saveTemplateName, setSaveTemplateName, saveAsTemplate };
}
