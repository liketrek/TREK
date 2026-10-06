import { Eye, EyeOff, Loader2, Share2, X } from 'lucide-react';
import { useId, useState } from 'react';
import apiClient from '../../api/client';
import { useTranslation } from '../../i18n';
import { useVacayStore } from '../../store/vacayStore';
import { getApiErrorMessage } from '../../types';
import CustomSelect from '../shared/CustomSelect';
import {
  DialogButton,
  DialogFooter,
  DialogHeader,
  DialogShell,
  DialogTile,
  FooterSpacer,
  NEUTRAL_TINT,
  fs,
} from '../shared/DialogShell';
import { useToast } from '../shared/Toast';
import VacayBadge from './VacayBadge';

/**
 * Sidebar card for read-only calendar sharing (#444/#667). Deliberately separate
 * from the Persons card: Persons is the fusion (merge) feature, this card only
 * grants view access. Incoming rows toggle that person's calendar overlay.
 */
export default function VacaySharedCalendars() {
  const { t } = useTranslation();
  const toast = useToast();
  const { outgoingShares, incomingShares, shareWith, removeShare, setShareHidden } = useVacayStore();

  const [showShare, setShowShare] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<{ id: number; username: string }[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [sharing, setSharing] = useState(false);
  const shareLabelId = useId();

  const loadAvailable = async () => {
    try {
      const data = await apiClient.get('/addons/vacay/shares/available-users').then((r) => r.data);
      setAvailableUsers(data.users);
    } catch {
      /* */
    }
  };

  const handleShare = async () => {
    if (!selectedUser) return;
    setSharing(true);
    try {
      await shareWith(selectedUser);
      toast.success(t('vacay.shareSent'));
      setShowShare(false);
      setSelectedUser(null);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('vacay.shareFailed')));
    } finally {
      setSharing(false);
    }
  };

  // The optimistic hide and the removals reject on server errors — surface them
  // instead of leaving an unhandled rejection behind a silently reverted toggle.
  const handleToggleHidden = (id: number, hidden: boolean) => {
    setShareHidden(id, hidden).catch((err: unknown) => toast.error(getApiErrorMessage(err, t('vacay.shareFailed'))));
  };
  const handleRemove = (id: number) => {
    removeShare(id).catch((err: unknown) => toast.error(getApiErrorMessage(err, t('vacay.shareFailed'))));
  };

  const closeShare = () => setShowShare(false);

  const empty = incomingShares.length === 0 && outgoingShares.length === 0;

  return (
    <div className="vg-card rounded-[22px]" style={{ padding: '14px 18px' }}>
      <div className="mb-2 flex items-center justify-between">
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: 'var(--vg-ink3)',
          }}
        >
          {t('vacay.sharedCalendars')}
        </span>
        <button
          type="button"
          onClick={() => {
            setShowShare(true);
            void loadAvailable();
          }}
          className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
          style={{ color: 'var(--vg-ink3)' }}
          title={t('vacay.shareCalendar')}
        >
          <Share2 size={14} />
        </button>
      </div>

      {empty && <p style={{ fontSize: 12, color: 'var(--vg-ink3)', lineHeight: 1.5 }}>{t('vacay.sharedEmpty')}</p>}

      {incomingShares.length > 0 && (
        <div className="flex flex-col gap-1">
          {incomingShares.map((s) => (
            <div
              key={s.id}
              role="button"
              // No press-scale on the row: shrinking it mid-click slides the remove X
              // out from under the pointer, so the click retargets onto the row and
              // toggles visibility instead of removing the share (#2158).
              data-no-press
              tabIndex={0}
              onClick={() => handleToggleHidden(s.id, !s.hidden)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleToggleHidden(s.id, !s.hidden);
                }
              }}
              className="group flex cursor-pointer items-center gap-2.5 transition-colors"
              style={{ padding: '7px 10px', borderRadius: 12, opacity: s.hidden ? 0.55 : 1 }}
              title={s.hidden ? t('vacay.showInCalendar') : t('vacay.hideFromCalendar')}
            >
              {/* Ring dot — mirrors how shared days render in the grid (outline, not fill). */}
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ border: `2.5px solid ${s.color}` }} />
              <span className="min-w-0 truncate" style={{ fontSize: 13, fontWeight: 600, color: 'var(--vg-ink)' }}>
                {s.username}
              </span>
              <VacayBadge label={t('vacay.viewOnly')} />
              <span className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(s.id);
                  }}
                  className="flex h-5 w-5 items-center justify-center rounded opacity-0 transition-all group-hover:opacity-100"
                  style={{ color: 'var(--vg-ink3)' }}
                  title={t('vacay.remove')}
                >
                  <X size={12} />
                </button>
                {s.hidden ? (
                  <EyeOff size={14} style={{ color: 'var(--vg-ink3)' }} />
                ) : (
                  <Eye size={14} style={{ color: 'var(--vg-ink2)' }} />
                )}
              </span>
            </div>
          ))}
        </div>
      )}

      {outgoingShares.length > 0 && (
        <div className="flex flex-col gap-1" style={{ marginTop: incomingShares.length > 0 ? 10 : 0 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--vg-ink3)',
              padding: '0 10px',
            }}
          >
            {t('vacay.youShareWith')}
          </span>
          {outgoingShares.map((s) => (
            <div
              key={s.id}
              className="group flex items-center gap-2.5"
              style={{ padding: '5px 10px', borderRadius: 12 }}
            >
              <Share2 size={12} style={{ color: 'var(--vg-ink3)' }} />
              <span className="min-w-0 truncate" style={{ fontSize: 13, color: 'var(--vg-ink2)' }}>
                {s.username}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(s.id)}
                className="ml-auto rounded px-1.5 py-0.5 text-[10px] opacity-0 transition-all group-hover:opacity-100"
                style={{ color: 'var(--vg-ink3)' }}
              >
                {t('vacay.stopSharing')}
              </button>
            </div>
          ))}
        </div>
      )}

      <DialogShell
        open={showShare}
        onClose={closeShare}
        labelledBy={shareLabelId}
        width="narrow"
        header={
          <DialogHeader
            tile={
              <DialogTile>
                <Share2 size={20} strokeWidth={1.9} className="text-content-muted" />
              </DialogTile>
            }
            tint={NEUTRAL_TINT}
            labelId={shareLabelId}
            onClose={closeShare}
            title={t('vacay.shareCalendar')}
            sub={t('vacay.shareCalendarHint')}
            subWraps
          />
        }
        footer={
          <DialogFooter>
            <FooterSpacer />
            <DialogButton onClick={closeShare}>{t('common.cancel')}</DialogButton>
            <DialogButton
              variant="primary"
              onClick={handleShare}
              disabled={!selectedUser || sharing}
              icon={sharing ? <Loader2 size={14} className="animate-spin" /> : undefined}
            >
              {t('vacay.share')}
            </DialogButton>
          </DialogFooter>
        }
      >
        {availableUsers.length === 0 ? (
          <p
            className="m-0 rounded-[12px] bg-surface-secondary px-4 py-5 text-center text-content-faint"
            style={fs(12.5, 'body')}
          >
            {t('vacay.noUsersAvailable')}
          </p>
        ) : (
          <CustomSelect
            value={selectedUser}
            onChange={(v) => setSelectedUser(Number(v))}
            options={availableUsers.map((u) => ({ value: u.id, label: u.username }))}
            placeholder={t('vacay.selectUser')}
            searchable
          />
        )}
      </DialogShell>
    </div>
  );
}
