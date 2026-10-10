import type React from 'react';
import { useRef, useState } from 'react';

import type { useTranslation } from '../../i18n';
import type { Category } from '../../types';
import type { useToast } from '../shared/Toast';
import type { PlaceDetailsSelection } from './PlaceDetailsColumn';
import {
  DEFAULT_FORM,
  duplicateName,
  openingAutoFilled,
  openingDetailsSelection,
  type PlaceFormData,
  type PlacePrefill,
  type ResultField,
} from './PlaceFormModal.helpers';

type Translate = ReturnType<typeof useTranslation>['t'];
type Toast = ReturnType<typeof useToast>;

export interface PlaceFormOptions {
  t: Translate;
  toast: Toast;
  /** Files and pictures pasted into the form become attachments only for a member who may upload. */
  canUploadFiles: boolean;
}

/**
 * The place add/edit form's own state: the one logic path behind the desktop dialog and
 * the phone sheet, which render their own markup over it and keep their own openings,
 * search and save flow. It holds the fields, which of them the last picked search result
 * wrote (see mergeResult), the files chosen before the place exists, what the details
 * column describes, and the duplicate warning a first save of a new place may raise.
 */
export function usePlaceForm({ t, toast, canUploadFiles }: PlaceFormOptions) {
  const [form, setForm] = useState<PlaceFormData>(DEFAULT_FORM);
  // Which fields the last picked search result wrote. Anything in here belongs
  // to that place and goes when another is picked; anything outside it is the
  // user's and survives. See mergeResult.
  const autoFilledRef = useRef<Set<ResultField>>(new Set());
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  // What the details column is describing. Null until there is a place to describe.
  const [detailsSelection, setDetailsSelection] = useState<PlaceDetailsSelection | null>(null);

  /**
   * A fresh opening, on the form the caller built for it: the fields that opening owns,
   * what the details column follows (otherwise it kept showing the previous place's
   * pictures and facts), no files and no warning left from the last one.
   */
  const openForm = (
    next: PlaceFormData,
    place: Parameters<typeof openingDetailsSelection>[0],
    prefill: PlacePrefill | null | undefined
  ) => {
    setForm(next);
    autoFilledRef.current = openingAutoFilled(place, prefill);
    setDetailsSelection(openingDetailsSelection(place, prefill));
    setPendingFiles([]);
    setDuplicateWarning(null);
  };

  const handleChange = (field: string, value: string) => {
    // Typed by hand, so the next pick must not clear it.
    autoFilledRef.current.delete(field as ResultField);
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addFiles = (files: File[]) => setPendingFiles((prev) => [...prev, ...files]);

  /** The file input's pick; the input is cleared so the same file can be chosen again. */
  const addFilesFromInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files || []));
    e.target.value = '';
  };

  const removeFile = (idx: number) => setPendingFiles((prev) => prev.filter((_, i) => i !== idx));

  // Clipboard images/PDFs from any focused field become pending attachments.
  const handlePaste = (e: React.ClipboardEvent) => {
    if (!canUploadFiles) return;
    for (const item of Array.from(e.clipboardData?.items || [])) {
      if (item.type.startsWith('image/') || item.type === 'application/pdf') {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) setPendingFiles((prev) => [...prev, file]);
        return;
      }
    }
  };

  /** A hero image picked in the details column, or none. */
  const pickImage = (url: string | null) => setForm((prev) => ({ ...prev, image_url: url ?? undefined }));

  /** The details column's description, taken over into the form. */
  const adoptDescription = (text: string) => setForm((prev) => ({ ...prev, description: text }));

  /**
   * #1152: the first save of a new place warns when the trip seems to have it already;
   * a second press with the warning showing is the explicit "add anyway". True when it
   * warned, and the save stops there.
   */
  const warnIfDuplicate = (places: Parameters<typeof duplicateName>[1]) => {
    const name = duplicateName(form, places);
    if (!name) return false;
    setDuplicateWarning(name);
    toast.warning(t('places.duplicateExists', { name }));
    return true;
  };

  return {
    form,
    setForm,
    autoFilledRef,
    pendingFiles,
    addFiles,
    addFilesFromInput,
    removeFile,
    handlePaste,
    isSaving,
    setIsSaving,
    duplicateWarning,
    detailsSelection,
    setDetailsSelection,
    openForm,
    handleChange,
    pickImage,
    adoptDescription,
    warnIfDuplicate,
  };
}

const NEW_CATEGORY_COLOR = '#6366f1'; // theme-lint-disable: a new category's stored default, not a colour of the form

/** What a new category is created with, besides its name. */
type NewCategory = { name: string; color: string; icon: string };

export type NewCategoryOptions = {
  t: Translate;
  toast: Toast;
  /** The new category's id, once it exists: it is picked straight away. */
  onCreated: (categoryId: string) => void;
} & (
  | {
      /** Desktop: the name goes as typed, and a create that hands nothing back picks nothing. */
      variant: 'dialog';
      create: (category: NewCategory) => Promise<Category> | undefined;
    }
  | {
      /** Phone: the name goes trimmed, and a second create waits until the first is done. */
      variant: 'sheet';
      create: (category: NewCategory) => Promise<Category>;
    }
);

/**
 * The inline "new category" of the place form, for both shells: a name typed where the
 * category pills are, created with the default colour and icon and picked at once.
 */
export function useNewCategory({ t, toast, onCreated, variant, create }: NewCategoryOptions) {
  const sheet = variant === 'sheet';
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim() || (sheet && saving)) return;
    if (sheet) setSaving(true);
    try {
      const cat = await create({ name: sheet ? name.trim() : name, color: NEW_CATEGORY_COLOR, icon: 'MapPin' });
      // The phone's create always hands one back; reading it unguarded fails into the catch as before.
      if (sheet || cat) onCreated(String((cat as Category).id));
      setName('');
      setOpen(false);
    } catch {
      toast.error(t('places.categoryCreateError'));
    } finally {
      if (sheet) setSaving(false);
    }
  };

  return { open, setOpen, name, setName, saving, submit };
}
