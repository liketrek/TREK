import {
  AlertTriangle,
  ArrowUpCircle,
  CheckCircle,
  ExternalLink,
  Eye,
  EyeOff,
  Fingerprint,
  RefreshCw,
  UserCog,
  UserPlus,
} from 'lucide-react';
import React, { useId } from 'react';
import { adminApi } from '../../api/client';
import CustomSelect from '../../components/shared/CustomSelect';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { Tooltip } from '../../components/shared/Tooltip';
import {
  DialogButton,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogShell,
  DialogTile,
  FooterSpacer,
  NEUTRAL_TINT,
  fs,
} from '../../components/shared/DialogShell';
import { EditorField, GRID_2, INPUT } from '../../components/shared/dialogParts';
import { SETTINGS_BUTTON, SETTINGS_BUTTON_DANGER } from '../../components/Settings/settingsKit';
import type { TranslationFn } from '../../types';
import type { useAdmin } from './useAdmin';
import PasswordChecklist from '../../components/shared/PasswordChecklist';

interface AdminUserModalsProps {
  admin: ReturnType<typeof useAdmin>;
  t: TranslationFn;
}

/** The head band of a destructive question: a faint wash of the danger colour. */
const DANGER_TINT = 'color-mix(in srgb, var(--danger) 9%, transparent)';
/** The filled button that carries out a destructive action, as ConfirmDialog draws it. */
const DANGER_FILL =
  'inline-flex items-center gap-1.5 rounded-[10px] bg-danger px-4 py-2 font-medium text-white hover:opacity-90 disabled:cursor-default disabled:opacity-50'; // theme-lint-disable: white on the danger fill, as ConfirmDialog draws it
/** A quiet framed note inside a dialog body. */
const NOTE = 'flex items-start gap-2.5 rounded-[12px] border border-edge-faint px-3.5 py-3';

/** A password field in the box look with the eye that shows what was typed. */
function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  shown,
  onToggle,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  shown: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <input
        id={id}
        type={shown ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${INPUT} pr-10`}
      />
      <span className="absolute right-1.5 top-1/2 flex -translate-y-1/2">
        <Tooltip label="Show or hide password" placement="top">
          <button
            type="button"
            onClick={onToggle}
            tabIndex={-1}
            aria-label="Show or hide password"
            className="grid h-7 w-7 place-items-center rounded-[8px] text-content-faint hover:text-content"
          >
            {shown ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </Tooltip>
      </span>
    </div>
  );
}

// The admin page's modal layer: create-user, edit-user, the "how to update"
// popup and the rotate-JWT confirmation, all in the planner's dialog frame.
// Pure layout around the useAdmin hook.
export default function AdminUserModals({ admin, t }: AdminUserModalsProps): React.ReactElement {
  const {
    logout,
    navigate,
    toast,
    editingUser,
    setEditingUser,
    editForm,
    setEditForm,
    showCreateUser,
    setShowCreateUser,
    createForm,
    setCreateForm,
    updateInfo,
    showUpdateModal,
    setShowUpdateModal,
    showRotateJwtModal,
    setShowRotateJwtModal,
    rotatingJwt,
    setRotatingJwt,
    handleCreateUser,
    handleSaveUser,
  } = admin;
  const [showCreatePw, setShowCreatePw] = React.useState(false);
  const [showEditPw, setShowEditPw] = React.useState(false);
  // The user whose passkeys wait for the admin's answer in the confirm dialog.
  const [passkeyResetUser, setPasskeyResetUser] = React.useState<typeof editingUser>(null);
  const uid = useId();
  const createId = `${uid}-create`;
  const editId = `${uid}-edit`;
  const updateId = `${uid}-update`;
  const rotateId = `${uid}-rotate`;

  const roleOptions = [
    { value: 'user', label: t('settings.roleUser') },
    { value: 'admin', label: t('settings.roleAdmin') },
  ];

  return (
    <>
      {/* Create user modal */}
      <DialogShell
        open={showCreateUser}
        onClose={() => setShowCreateUser(false)}
        labelledBy={createId}
        width="narrow"
        header={
          <DialogHeader
            tile={
              <DialogTile>
                <UserPlus size={20} strokeWidth={1.9} className="text-content-muted" />
              </DialogTile>
            }
            tint={NEUTRAL_TINT}
            labelId={createId}
            onClose={() => setShowCreateUser(false)}
            title={t('admin.createUser')}
          />
        }
        footer={
          <DialogFooter>
            <FooterSpacer />
            <DialogButton onClick={() => setShowCreateUser(false)}>{t('common.cancel')}</DialogButton>
            <DialogButton variant="primary" onClick={handleCreateUser}>
              {t('admin.createUser')}
            </DialogButton>
          </DialogFooter>
        }
      >
        <div className={GRID_2}>
          <EditorField label={`${t('settings.username')} *`} htmlFor={`${createId}-username`}>
            <input
              id={`${createId}-username`}
              type="text"
              value={createForm.username}
              onChange={(e) => setCreateForm((f) => ({ ...f, username: e.target.value }))}
              placeholder={t('settings.username')}
              className={INPUT}
            />
          </EditorField>
          <EditorField label={`${t('common.email')} *`} htmlFor={`${createId}-email`}>
            <input
              id={`${createId}-email`}
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
              placeholder={t('common.email')}
              className={INPUT}
            />
          </EditorField>
        </div>
        <EditorField label={`${t('common.password')} *`} htmlFor={`${createId}-password`}>
          <PasswordInput
            id={`${createId}-password`}
            value={createForm.password}
            onChange={(value) => setCreateForm((f) => ({ ...f, password: value }))}
            placeholder={t('common.password')}
            shown={showCreatePw}
            onToggle={() => setShowCreatePw((v) => !v)}
          />
          <PasswordChecklist password={createForm.password.trim()} className="mt-2" />
        </EditorField>
        <EditorField label={t('settings.role')}>
          <CustomSelect
            value={createForm.role}
            onChange={(value) => setCreateForm((f) => ({ ...f, role: String(value) }))}
            options={roleOptions}
          />
        </EditorField>
      </DialogShell>

      {/* Edit user modal */}
      <DialogShell
        open={!!editingUser}
        onClose={() => setEditingUser(null)}
        labelledBy={editId}
        width="narrow"
        header={
          <DialogHeader
            tile={
              <DialogTile>
                <UserCog size={20} strokeWidth={1.9} className="text-content-muted" />
              </DialogTile>
            }
            tint={NEUTRAL_TINT}
            labelId={editId}
            onClose={() => setEditingUser(null)}
            title={t('admin.editUser')}
            sub={editingUser?.email}
          />
        }
        footer={
          <DialogFooter>
            <FooterSpacer />
            <DialogButton onClick={() => setEditingUser(null)}>{t('common.cancel')}</DialogButton>
            <DialogButton variant="primary" onClick={handleSaveUser}>
              {t('common.save')}
            </DialogButton>
          </DialogFooter>
        }
      >
        {editingUser && (
          <>
            <div className={GRID_2}>
              <EditorField label={t('settings.username')} htmlFor={`${editId}-username`}>
                <input
                  id={`${editId}-username`}
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm((f) => ({ ...f, username: e.target.value }))}
                  className={INPUT}
                />
              </EditorField>
              <EditorField label={t('common.email')} htmlFor={`${editId}-email`}>
                <input
                  id={`${editId}-email`}
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  className={INPUT}
                />
              </EditorField>
            </div>
            <EditorField
              label={t('admin.newPassword')}
              htmlFor={`${editId}-password`}
              hint={t('admin.newPasswordHint')}
            >
              <PasswordInput
                id={`${editId}-password`}
                value={editForm.password}
                onChange={(value) => setEditForm((f) => ({ ...f, password: value }))}
                placeholder={t('admin.newPasswordPlaceholder')}
                shown={showEditPw}
                onToggle={() => setShowEditPw((v) => !v)}
              />
              <PasswordChecklist password={editForm.password.trim()} className="mt-2" />
            </EditorField>
            <EditorField label={t('settings.role')}>
              <CustomSelect
                value={editForm.role}
                onChange={(value) => setEditForm((f) => ({ ...f, role: String(value) }))}
                options={roleOptions}
              />
            </EditorField>
            <DialogSection label={t('admin.passkey.reset')}>
              <div className="flex flex-wrap items-center gap-3 rounded-[12px] border border-edge-faint bg-surface-secondary px-3.5 py-3">
                <p className="m-0 min-w-0 flex-1 basis-52 leading-snug text-content-muted" style={fs(12, 'body')}>
                  {t('admin.passkey.resetHint')}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (editingUser) setPasskeyResetUser(editingUser);
                  }}
                  className={`${SETTINGS_BUTTON_DANGER} flex-none`}
                  style={fs(12.5, 'body')}
                >
                  <Fingerprint size={14} /> {t('admin.passkey.reset')}
                </button>
              </div>
            </DialogSection>
          </>
        )}
      </DialogShell>

      {/* Update instructions popup */}
      <DialogShell
        open={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        labelledBy={updateId}
        width="narrow"
        header={
          <DialogHeader
            tile={
              <DialogTile>
                <ArrowUpCircle size={20} strokeWidth={1.9} className="text-warning" />
              </DialogTile>
            }
            tint={NEUTRAL_TINT}
            labelId={updateId}
            onClose={() => setShowUpdateModal(false)}
            title={t('admin.update.howTo')}
            sub={`v${updateInfo?.current} → v${updateInfo?.latest}`}
          />
        }
        footer={
          <DialogFooter>
            {updateInfo?.release_url && (
              <a
                href={updateInfo.release_url}
                target="_blank"
                rel="noopener noreferrer"
                className={SETTINGS_BUTTON}
                style={fs(13, 'body')}
              >
                <ExternalLink size={14} strokeWidth={2.1} className="flex-none" />
                {t('admin.update.button')}
              </a>
            )}
            <FooterSpacer />
            <DialogButton variant="primary" onClick={() => setShowUpdateModal(false)}>
              {t('common.close')}
            </DialogButton>
          </DialogFooter>
        }
      >
        <p className="m-0 leading-relaxed text-content-secondary" style={fs(13, 'body')}>
          {(updateInfo?.is_docker === false ? t('admin.update.nonDockerText') : t('admin.update.dockerText')).replace(
            '{version}',
            `v${updateInfo?.latest ?? ''}`
          )}
        </p>

        {updateInfo?.is_docker === false ? (
          <a
            href="https://github.com/liketrek/TREK/wiki/Updating"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 rounded-[12px] border border-edge-faint bg-surface-secondary px-3.5 py-3 text-content no-underline transition-colors hover:bg-surface-tertiary"
            style={fs(13, 'body')}
          >
            <ExternalLink className="h-4 w-4 flex-shrink-0 text-content-muted" />
            <span className="font-semibold underline">{t('admin.update.wikiLink')}</span>
          </a>
        ) : (
          <pre
            className="m-0 whitespace-pre-wrap break-all rounded-[12px] border border-edge-faint bg-surface-tertiary px-3.5 py-3 font-mono leading-[1.8] text-content"
            style={fs(12, 'body')}
          >
            {`docker pull mauriceboe/trek:latest
docker stop trek && docker rm trek
docker run -d --name trek \\
  -p 3000:3000 \\
  -v /opt/trek/data:/app/data \\
  -v /opt/trek/uploads:/app/uploads \\
  --restart unless-stopped \\
  mauriceboe/trek:latest`}
          </pre>
        )}

        <div className={`${NOTE} bg-success-soft text-success`} style={fs(12, 'body')}>
          <CheckCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          <span className="leading-normal">{t('admin.update.dataInfo')}</span>
        </div>
      </DialogShell>

      {/* Rotate JWT Secret confirmation modal */}
      <DialogShell
        open={showRotateJwtModal}
        onClose={() => setShowRotateJwtModal(false)}
        labelledBy={rotateId}
        width="narrow"
        header={
          <DialogHeader
            tile={
              <DialogTile>
                <AlertTriangle size={20} strokeWidth={1.9} className="text-danger" />
              </DialogTile>
            }
            tint={DANGER_TINT}
            labelId={rotateId}
            onClose={() => setShowRotateJwtModal(false)}
            title="Rotate JWT Secret"
          />
        }
        footer={
          <DialogFooter>
            <FooterSpacer />
            <DialogButton onClick={() => setShowRotateJwtModal(false)} disabled={rotatingJwt}>
              {t('common.cancel')}
            </DialogButton>
            <button
              type="button"
              onClick={async () => {
                setRotatingJwt(true);
                try {
                  await adminApi.rotateJwtSecret();
                  setShowRotateJwtModal(false);
                  logout();
                  navigate('/login', { state: { noRedirect: true } });
                } catch {
                  toast.error(t('common.error'));
                  setRotatingJwt(false);
                }
              }}
              disabled={rotatingJwt}
              className={DANGER_FILL}
              style={fs(13, 'body')}
            >
              {rotatingJwt ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Rotate &amp; Log out
            </button>
          </DialogFooter>
        }
      >
        <div className="flex flex-col gap-1.5">
          <p className="m-0 font-semibold text-content" style={fs(13.5, 'body')}>
            Warning, this will invalidate all sessions and log you out.
          </p>
          <p className="m-0 leading-normal text-content-muted" style={fs(12.5, 'body')}>
            A new JWT secret will be generated immediately. Every logged-in user — including you — will be signed out
            and will need to log in again.
          </p>
        </div>
      </DialogShell>

      <ConfirmDialog
        isOpen={passkeyResetUser !== null}
        onClose={() => setPasskeyResetUser(null)}
        onConfirm={async () => {
          if (!passkeyResetUser) return;
          try {
            const r = await adminApi.resetUserPasskeys(passkeyResetUser.id);
            toast.success(t('admin.passkey.resetDone', { count: r.deleted ?? 0 }));
          } catch {
            toast.error(t('common.error'));
          }
        }}
        title={t('admin.passkey.reset')}
        message={passkeyResetUser ? t('admin.passkey.resetConfirm', { name: passkeyResetUser.username }) : ''}
        confirmLabel={t('admin.passkey.reset')}
        danger
      />
    </>
  );
}
