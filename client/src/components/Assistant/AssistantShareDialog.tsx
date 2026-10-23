import { useTranslation } from '../../i18n';
import ToggleSwitch from '../Settings/ToggleSwitch';
import ConfirmDialog from '../shared/ConfirmDialog';
import { SHARE_MAX_CHARS } from './assistantShare';
import type { useAssistantShare } from './useAssistantShare';

/**
 * The question before an answer goes to the trip chat: who will see it, the
 * text exactly as it will arrive, and whether the applied changes go along.
 * Nothing can be edited here; what goes out is what the preview shows. One
 * dialog for the window and the phone, which lays it out as a sheet.
 */
export default function AssistantShareDialog({ share }: { share: ReturnType<typeof useAssistantShare> }) {
  const { t } = useTranslation();
  const { preview } = share;
  return (
    <ConfirmDialog
      isOpen={share.previewing}
      onClose={share.close}
      onConfirm={() => void share.send()}
      title={t('assistant.share.title')}
      message={t('assistant.share.who')}
      confirmLabel={t('assistant.share.send')}
      danger={false}
    >
      {/* Spaced on its own: the phone's sheet sets the message flush against what follows. */}
      <div className="flex flex-col gap-3 pt-2">
        <p
          dir="auto"
          className="m-0 max-h-[40vh] overflow-y-auto whitespace-pre-wrap break-words rounded-xl border border-edge-faint bg-surface-secondary p-3 text-body text-content"
        >
          {preview.text}
        </p>
        {preview.hasChanges && (
          <label className="flex items-center justify-between gap-3 text-body text-content">
            <span>{t('assistant.share.includeChanges')}</span>
            <ToggleSwitch
              on={share.includeChanges}
              onToggle={share.toggleChanges}
              label={t('assistant.share.includeChanges')}
            />
          </label>
        )}
        {preview.truncated && (
          <p className="m-0 text-caption text-content-muted">
            {t('assistant.share.truncated', { count: SHARE_MAX_CHARS })}
          </p>
        )}
      </div>
    </ConfirmDialog>
  );
}
