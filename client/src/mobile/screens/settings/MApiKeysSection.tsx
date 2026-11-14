import { PUBLIC_API_SCOPES } from '@trek/shared';
import { AlertTriangle, Check, Copy, KeyRound, Plus, Trash2 } from 'lucide-react';
import {
  API_SCOPE_ICONS,
  MAX_API_KEYS,
  formatApiKeyStamp,
  useApiKeys,
  type ApiKey,
} from '../../../components/Settings/useApiKeys';
import { useDateFormat } from '../../../hooks/useDateFormat';
import { useTranslation } from '../../../i18n';
import MSheet from '../../components/MSheet';
import { MAdminButton, MAdminSheetFrame } from '../admin/MAdminUi';
import MConfirmSheet from './MConfirmSheet';
import { MSetButton, MSetCard, MSetEyebrow, MSetHint, MSetInput } from './MSettingsUi';

const NOTE = 'font-geist text-[length:calc(10.5px*var(--fs-scale-caption,1))] leading-relaxed';

function MApiKeyRow({ apiKey, locale, onDelete }: { apiKey: ApiKey; locale: string; onDelete: () => void }) {
  const { t } = useTranslation();
  const dateFormat = useDateFormat();
  const scopes = apiKey.scope_mode === 'limited' ? apiKey.scopes : undefined;
  return (
    <li className="flex items-start gap-[10px] border-t border-[color:var(--m-rowbr)] py-[10px] first:border-t-0">
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-[6px]">
          <span className="min-w-0 truncate text-[length:calc(12.5px*var(--fs-scale-body,1))] font-bold text-m-ink">
            {apiKey.name}
          </span>
          <code className={`flex-none text-m-faint ${NOTE}`}>{apiKey.token_prefix}…</code>
        </div>
        <p className={`mt-[1px] tabular-nums text-m-muted first-letter:uppercase ${NOTE}`}>
          {t('settings.apiKeys.createdAt')} {formatApiKeyStamp(apiKey.created_at, locale, dateFormat)}
          {', '}
          {apiKey.last_used_at
            ? `${t('settings.apiKeys.usedAt')} ${formatApiKeyStamp(apiKey.last_used_at, locale, dateFormat)}`
            : t('settings.apiKeys.neverUsed')}
        </p>
        {/* What the key may read, on the row: the reason to narrow a key is to see later that you did. */}
        <p className={`mt-[2px] text-m-muted ${NOTE}`}>
          {scopes ? scopes.map((scope) => t(`settings.apiScopes.${scope}`)).join(', ') : t('settings.apiScopes.all')}
        </p>
      </div>
      <button
        type="button"
        onClick={onDelete}
        aria-label={t('settings.apiKeys.deleteTitle')}
        className="flex h-[32px] w-[32px] flex-none items-center justify-center rounded-full bg-[color:var(--m-ic)] text-[color:var(--m-st-danger)]"
      >
        <Trash2 size={14} />
      </button>
    </li>
  );
}

/**
 * Phone twin of components/Settings/ApiKeysSection: keys for the public API.
 * The list, minting (the key is shown once, then only its prefix), deleting and
 * copying all live in useApiKeys; this is the phone's markup and its sheets.
 */
export default function MApiKeysSection() {
  const { t, locale } = useTranslation();
  const K = useApiKeys();

  return (
    <>
      <MSetCard
        title={t('settings.apiKeys.title')}
        icon={KeyRound}
        className="mt-3"
        badge={
          K.keys.length > 0 ? (
            <span className={`flex-none font-bold text-m-muted ${NOTE}`}>
              {K.keys.length}/{MAX_API_KEYS}
            </span>
          ) : undefined
        }
      >
        <MSetHint className="mt-0">{t('settings.apiKeys.description')}</MSetHint>

        {K.atLimit && (
          <p className={`mt-2 font-bold text-[color:var(--m-st-pending)] ${NOTE}`}>
            {t('settings.apiKeys.limitReached', { count: MAX_API_KEYS })}
          </p>
        )}
        {K.loadState === 'failed' && (
          <p role="alert" className={`mt-2 font-bold text-[color:var(--m-st-danger)] ${NOTE}`}>
            {t('settings.apiKeys.loadFailed')}
          </p>
        )}
        {K.loadState === 'ready' && K.keys.length === 0 && (
          <p className={`mt-2 text-m-muted ${NOTE}`}>{t('settings.apiKeys.empty')}</p>
        )}
        {K.keys.length > 0 && (
          <ul className="mt-2">
            {K.keys.map((key) => (
              <MApiKeyRow key={key.id} apiKey={key} locale={locale} onDelete={() => K.setDeleteId(key.id)} />
            ))}
          </ul>
        )}

        <div className="mt-3">
          <MSetButton disabled={K.atLimit} onClick={K.openModal}>
            <Plus size={14} /> {t('settings.apiKeys.create')}
          </MSetButton>
        </div>

        <div className="mt-4 border-t border-[color:var(--m-rowbr)] pt-3">
          <MSetEyebrow className="mb-[5px]">{t('settings.apiKeys.endpoint')}</MSetEyebrow>
          <div className="flex items-center gap-2">
            <code className="block min-w-0 flex-1 truncate rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] px-[13px] py-[10px] font-geist text-[length:calc(12px*var(--fs-scale-body,1))] text-m-ink">
              {K.endpoint}
            </code>
            <button
              type="button"
              aria-label={t('common.copy')}
              onClick={() => void K.handleCopy(K.endpoint, 'endpoint')}
              className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full bg-[color:var(--m-ic)] text-m-ink"
            >
              {K.copied === 'endpoint' ? <Check size={15} /> : <Copy size={15} />}
            </button>
          </div>
          <MSetHint>{t('settings.apiKeys.docsHint')}</MSetHint>
        </div>
      </MSetCard>

      {/* Once the key is on screen, Done is the only way out: a stray swipe would
          throw away the one copy there will ever be. */}
      <MSheet
        open={K.modalOpen}
        onClose={K.created ? () => {} : K.closeModal}
        ariaLabel={K.created ? t('settings.apiKeys.modal.createdTitle') : t('settings.apiKeys.modal.createTitle')}
      >
        <MAdminSheetFrame
          title={K.created ? t('settings.apiKeys.modal.createdTitle') : t('settings.apiKeys.modal.createTitle')}
          icon={<KeyRound size={18} />}
          onClose={K.closeModal}
          footer={
            K.created ? (
              <MAdminButton onClick={K.closeModal}>{t('settings.apiKeys.modal.done')}</MAdminButton>
            ) : (
              <>
                <MAdminButton variant="ghost" onClick={K.closeModal}>
                  {t('common.cancel')}
                </MAdminButton>
                <MAdminButton busy={K.creating} disabled={!K.canCreate} onClick={() => void K.handleCreate()}>
                  {K.creating ? t('settings.apiKeys.modal.creating') : t('settings.apiKeys.modal.create')}
                </MAdminButton>
              </>
            )
          }
        >
          {K.created ? (
            <div className="space-y-3">
              <p className={`flex items-start gap-2 text-m-ink ${NOTE}`}>
                <AlertTriangle size={14} className="mt-[1px] flex-none text-[color:var(--m-st-pending)]" />
                {t('settings.apiKeys.modal.createdWarning')}
              </p>
              <code className="block select-all break-all rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] px-[13px] py-[11px] font-geist text-[length:calc(12px*var(--fs-scale-body,1))] text-m-ink">
                {K.created}
              </code>
              <MSetButton variant="ghost" onClick={() => void K.handleCopy(K.created ?? '', 'key')}>
                {K.copied === 'key' ? <Check size={14} /> : <Copy size={14} />}
                {K.copied === 'key' ? t('common.copied') : t('settings.apiKeys.copy')}
              </MSetButton>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <MSetEyebrow className="mb-[5px]">{t('settings.apiKeys.modal.name')}</MSetEyebrow>
                <MSetInput
                  aria-label={t('settings.apiKeys.modal.name')}
                  value={K.newName}
                  maxLength={100}
                  placeholder={t('settings.apiKeys.modal.namePlaceholder')}
                  onChange={(e) => K.setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void K.handleCreate();
                  }}
                />
                <MSetHint>{t('settings.apiKeys.modal.nameHint')}</MSetHint>
              </div>
              <section role="group" aria-label={t('settings.apiScopes.title')}>
                <div className="mb-[5px] flex items-center gap-2">
                  <MSetEyebrow className="min-w-0 flex-1">{t('settings.apiScopes.title')}</MSetEyebrow>
                  <button
                    type="button"
                    onClick={() => K.setNewScopes(K.allSelected ? new Set() : new Set(PUBLIC_API_SCOPES))}
                    className={`flex-none font-bold text-m-muted ${NOTE}`}
                  >
                    {K.allSelected ? t('common.deselectAll') : t('common.selectAll')}
                  </button>
                </div>
                <MSetHint className="mb-2 mt-0">{t('settings.apiScopes.hint')}</MSetHint>
                <div className="flex flex-wrap gap-[6px]">
                  {PUBLIC_API_SCOPES.map((scope) => {
                    const Icon = API_SCOPE_ICONS[scope];
                    const on = K.newScopes.has(scope);
                    return (
                      <button
                        key={scope}
                        type="button"
                        aria-pressed={on}
                        onClick={() => K.toggleScope(scope)}
                        className={`inline-flex h-[32px] items-center gap-[6px] whitespace-nowrap rounded-full border px-[11px] text-[length:calc(12px*var(--fs-scale-body,1))] font-bold ${
                          on
                            ? 'border-transparent bg-m-act text-m-actfg'
                            : 'border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] text-m-muted'
                        }`}
                      >
                        <Icon size={13} strokeWidth={2.2} aria-hidden />
                        {t(`settings.apiScopes.${scope}`)}
                      </button>
                    );
                  })}
                </div>
                {K.newScopes.size === 0 && (
                  <p className={`mt-2 font-bold text-[color:var(--m-st-danger)] ${NOTE}`}>
                    {t('settings.apiScopes.noneSelected')}
                  </p>
                )}
              </section>
            </div>
          )}
        </MAdminSheetFrame>
      </MSheet>

      <MConfirmSheet
        open={K.deleteId !== null}
        onClose={() => K.setDeleteId(null)}
        title={t('settings.apiKeys.deleteTitle')}
        message={t('settings.apiKeys.deleteMessage')}
        confirmLabel={t('settings.apiKeys.deleteTitle')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => {
          const id = K.deleteId;
          K.setDeleteId(null);
          if (id !== null) void K.handleDelete(id);
        }}
      />
    </>
  );
}
