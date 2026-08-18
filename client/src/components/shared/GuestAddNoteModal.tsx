import React, { useState, useRef, useEffect } from 'react';
import Modal from './Modal';
import { shareApi } from '../../api/client';
import { useToast } from './Toast';
import { getApiErrorMessage } from '../../types';
import { Paperclip, X, Loader2 } from 'lucide-react';

export interface GuestAddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  categories: string[];
  t: (key: string, params?: Record<string, string | number>) => string;
}

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB limit

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function GuestAddNoteModal({
  isOpen,
  onClose,
  token,
  categories = [],
  t,
}: GuestAddNoteModalProps) {
  const [guestName, setGuestName] = useState('');
  const [category, setCategory] = useState(categories[0] || 'General');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      if (categories.length > 0 && !categories.includes(category)) {
        setCategory(categories[0]);
      } else if (!category) {
        setCategory('General');
      }
    }
  }, [isOpen, categories]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetForm = () => {
    setGuestName('');
    setTitle('');
    setContent('');
    setCategory(categories.length > 0 ? categories[0] : 'General');
    setFile(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > MAX_FILE_SIZE_BYTES) {
      const errorMsg = t('share.fileTooLarge') || 'File size exceeds 50MB limit';
      setFileError(errorMsg);
      toast.error(errorMsg);
      e.target.value = '';
      return;
    }

    setFile(selected);
    setFileError(null);
  };

  const handleClearFile = () => {
    setFile(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = guestName.trim();
    const trimmedTitle = title.trim();
    if (!trimmedName || !trimmedTitle || submitting) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('guest_name', trimmedName);
      formData.append('title', trimmedTitle);
      if (content.trim()) {
        formData.append('content', content.trim());
      }
      if (category) {
        formData.append('category', category);
      }
      if (file) {
        formData.append('file', file);
      }

      await shareApi.addGuestNote(token, formData);
      toast.success(t('share.guestNoteSuccess') || 'Note sent successfully!');
      resetForm();
      onClose();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('common.error') || 'An error occurred'));
    } finally {
      setSubmitting(false);
    }
  };

  const availableCategories = categories.length > 0 ? categories : ['General'];
  const canSubmit = guestName.trim().length > 0 && title.trim().length > 0 && !submitting;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!submitting) {
          onClose();
        }
      }}
      title={t('share.addNote') || 'Add note'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Guest Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            {t('share.guestName') || 'Your name'} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder={t('share.guestName') || 'Your name'}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            {t('share.noteCategory') || 'Category'}
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400"
          >
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            {t('share.noteTitle') || 'Note title'} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('share.noteTitle') || 'Note title'}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            {t('share.noteContent') || 'Note details (optional)'}
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('share.noteContent') || 'Note details (optional)'}
            rows={4}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 resize-y"
          />
        </div>

        {/* Attach File */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            {t('share.attachFile') || 'Attach file / photo'}
          </label>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
            data-testid="guest-note-file-input"
          />
          {file ? (
            <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <Paperclip className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                  {file.name}
                </span>
                <span className="text-xs text-slate-400 flex-shrink-0">
                  ({formatFileSize(file.size)})
                </span>
              </div>
              <button
                type="button"
                onClick={handleClearFile}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                aria-label="Remove attachment"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors"
            >
              <Paperclip className="w-4 h-4" />
              <span>{t('share.attachFile') || 'Attach file / photo'}</span>
            </button>
          )}
          {fileError && (
            <p className="text-xs text-red-500 mt-1">{fileError}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold shadow transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('share.sendNote') || 'Send Note'}...</span>
              </>
            ) : (
              <span>{t('share.sendNote') || 'Send Note'}</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
