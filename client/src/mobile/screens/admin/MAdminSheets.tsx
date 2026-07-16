import { AlertTriangle, CheckCircle, ExternalLink, Fingerprint, Trash2 } from 'lucide-react'
import { adminApi } from '../../../api/client'
import type { TranslationFn } from '../../../types'
import type { useAdmin } from '../../../pages/admin/useAdmin'
import MSheet from '../../components/MSheet'
import MSegmented from '../../components/MSegmented'
import { MAdminButton, MAdminField, MAdminInput, MAdminSecretInput, MAdminSheetFrame } from './MAdminUi'

interface MAdminSheetsProps {
  admin: ReturnType<typeof useAdmin>
  t: TranslationFn
}

const DOCKER_UPDATE_COMMANDS = `docker pull mauriceboe/trek:latest
docker stop trek && docker rm trek
docker run -d --name trek \\
  -p 3000:3000 \\
  -v /opt/trek/data:/app/data \\
  -v /opt/trek/uploads:/app/uploads \\
  --restart unless-stopped \\
  mauriceboe/trek:latest`

// The admin screen's sheet layer: create user, edit user (incl. passkey reset
// and delete), the "how to update" instructions and the rotate-JWT confirm.
export default function MAdminSheets({ admin, t }: MAdminSheetsProps) {
  const {
    logout, navigate, toast, currentUser,
    editingUser, setEditingUser, editForm, setEditForm,
    showCreateUser, setShowCreateUser, createForm, setCreateForm,
    updateInfo, showUpdateModal, setShowUpdateModal,
    showRotateJwtModal, setShowRotateJwtModal, rotatingJwt, setRotatingJwt,
    handleCreateUser, handleSaveUser, handleDeleteUser,
  } = admin

  const roleOptions = [
    { value: 'user', label: t('settings.roleUser') },
    { value: 'admin', label: t('settings.roleAdmin') },
  ]

  const resetPasskeys = async () => {
    if (!editingUser) return
    if (!confirm(t('admin.passkey.resetConfirm', { name: editingUser.username }))) return
    try {
      const r = await adminApi.resetUserPasskeys(editingUser.id)
      toast.success(t('admin.passkey.resetDone', { count: r.deleted ?? 0 }))
    } catch {
      toast.error(t('common.error'))
    }
  }

  const rotateJwt = async () => {
    setRotatingJwt(true)
    try {
      await adminApi.rotateJwtSecret()
      setShowRotateJwtModal(false)
      logout()
      navigate('/login', { state: { noRedirect: true } })
    } catch {
      toast.error(t('common.error'))
      setRotatingJwt(false)
    }
  }

  return (
    <>
      {/* Create user */}
      <MSheet open={showCreateUser} onClose={() => setShowCreateUser(false)} ariaLabel={t('admin.createUser')}>
        <MAdminSheetFrame
          title={t('admin.createUser')}
          onClose={() => setShowCreateUser(false)}
          footer={
            <>
              <MAdminButton variant="ghost" onClick={() => setShowCreateUser(false)}>
                {t('common.cancel')}
              </MAdminButton>
              <MAdminButton onClick={handleCreateUser}>{t('admin.createUser')}</MAdminButton>
            </>
          }
        >
          <div className="space-y-3">
            <MAdminField label={`${t('settings.username')} *`}>
              <MAdminInput
                type="text"
                value={createForm.username}
                onChange={(e) => setCreateForm((f) => ({ ...f, username: e.target.value }))}
                placeholder={t('settings.username')}
              />
            </MAdminField>
            <MAdminField label={`${t('common.email')} *`}>
              <MAdminInput
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                placeholder={t('common.email')}
              />
            </MAdminField>
            <MAdminField label={`${t('common.password')} *`}>
              <MAdminSecretInput
                value={createForm.password}
                onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                placeholder={t('common.password')}
              />
            </MAdminField>
            <MAdminField label={t('settings.role')}>
              <MSegmented
                options={roleOptions}
                value={createForm.role}
                onChange={(role) => setCreateForm((f) => ({ ...f, role }))}
              />
            </MAdminField>
          </div>
        </MAdminSheetFrame>
      </MSheet>

      {/* Edit user */}
      <MSheet open={!!editingUser} onClose={() => setEditingUser(null)} ariaLabel={t('admin.editUser')}>
        <MAdminSheetFrame
          title={t('admin.editUser')}
          onClose={() => setEditingUser(null)}
          footer={
            <>
              <MAdminButton variant="ghost" onClick={() => setEditingUser(null)}>
                {t('common.cancel')}
              </MAdminButton>
              <MAdminButton onClick={handleSaveUser}>{t('common.save')}</MAdminButton>
            </>
          }
        >
          {editingUser && (
            <div className="space-y-3">
              <MAdminField label={t('settings.username')}>
                <MAdminInput
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm((f) => ({ ...f, username: e.target.value }))}
                />
              </MAdminField>
              <MAdminField label={t('common.email')}>
                <MAdminInput
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                />
              </MAdminField>
              <MAdminField label={t('admin.newPassword')} hint={t('admin.newPasswordHint')}>
                <MAdminSecretInput
                  value={editForm.password}
                  onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder={t('admin.newPasswordPlaceholder')}
                />
              </MAdminField>
              <MAdminField label={t('settings.role')}>
                <MSegmented
                  options={roleOptions}
                  value={editForm.role}
                  onChange={(role) => setEditForm((f) => ({ ...f, role }))}
                />
              </MAdminField>
              <div className="border-t border-[color:var(--m-rowbr)] pt-3">
                <p className="mb-2 font-geist text-[0.625rem] leading-relaxed text-m-muted">
                  {t('admin.passkey.resetHint')}
                </p>
                <div className="flex flex-wrap gap-2">
                  <MAdminButton variant="ghost" className="text-[color:var(--m-st-danger)]" onClick={resetPasskeys}>
                    <Fingerprint size={12} strokeWidth={2.2} />
                    {t('admin.passkey.reset')}
                  </MAdminButton>
                  <MAdminButton
                    variant="danger"
                    disabled={editingUser.id === currentUser?.id}
                    onClick={() => {
                      const user = editingUser
                      setEditingUser(null)
                      handleDeleteUser(user)
                    }}
                  >
                    <Trash2 size={12} strokeWidth={2.2} />
                    {t('admin.deleteUserTitle')}
                  </MAdminButton>
                </div>
              </div>
            </div>
          )}
        </MAdminSheetFrame>
      </MSheet>

      {/* How to update */}
      <MSheet open={showUpdateModal} onClose={() => setShowUpdateModal(false)} ariaLabel={t('admin.update.howTo')}>
        <MAdminSheetFrame
          title={t('admin.update.howTo')}
          onClose={() => setShowUpdateModal(false)}
          footer={<MAdminButton onClick={() => setShowUpdateModal(false)}>{t('common.close')}</MAdminButton>}
        >
          <div className="space-y-3">
            <p className="font-geist text-[0.625rem] text-m-muted">
              v{updateInfo?.current} → v{updateInfo?.latest}
            </p>
            <p className="text-[0.8125rem] leading-relaxed text-m-ink">
              {(updateInfo?.is_docker === false ? t('admin.update.nonDockerText') : t('admin.update.dockerText')).replace(
                '{version}',
                `v${updateInfo?.latest ?? ''}`,
              )}
            </p>
            {updateInfo?.is_docker === false ? (
              <a
                href="https://github.com/mauriceboe/TREK/wiki/Updating"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-[color:var(--m-ic)] px-3 py-3 text-[0.8125rem] font-bold text-m-ink underline"
              >
                <ExternalLink size={14} className="flex-none" />
                {t('admin.update.wikiLink')}
              </a>
            ) : (
              <pre className="whitespace-pre-wrap break-all rounded-xl bg-m-act p-3 font-mono text-[0.6875rem] leading-relaxed text-m-actfg">
                {DOCKER_UPDATE_COMMANDS}
              </pre>
            )}
            <div className="flex items-start gap-2 rounded-xl border border-[color:color-mix(in_srgb,var(--m-st-confirmed)_28%,transparent)] bg-[color:color-mix(in_srgb,var(--m-st-confirmed)_10%,transparent)] px-3 py-2 font-geist text-[0.625rem] leading-relaxed text-m-ink">
              <CheckCircle size={13} className="mt-[1px] flex-none text-[color:var(--m-st-confirmed)]" />
              <span>{t('admin.update.dataInfo')}</span>
            </div>
            {updateInfo?.release_url && (
              <a
                href={updateInfo.release_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl border border-[color:color-mix(in_srgb,var(--m-st-info)_28%,transparent)] bg-[color:color-mix(in_srgb,var(--m-st-info)_10%,transparent)] px-3 py-2 font-geist text-[0.625rem] font-bold text-[color:var(--m-st-info)] underline"
              >
                <ExternalLink size={13} className="flex-none" />
                {t('admin.update.button')}
              </a>
            )}
          </div>
        </MAdminSheetFrame>
      </MSheet>

      {/* Rotate JWT confirm */}
      <MSheet open={showRotateJwtModal} onClose={() => setShowRotateJwtModal(false)} ariaLabel="Rotate JWT Secret">
        <MAdminSheetFrame
          title="Rotate JWT Secret"
          onClose={() => setShowRotateJwtModal(false)}
          footer={
            <>
              <MAdminButton variant="ghost" disabled={rotatingJwt} onClick={() => setShowRotateJwtModal(false)}>
                {t('common.cancel')}
              </MAdminButton>
              <MAdminButton variant="danger" busy={rotatingJwt} onClick={rotateJwt}>
                Rotate &amp; Log out
              </MAdminButton>
            </>
          }
        >
          <div className="flex gap-3">
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--m-st-danger)_12%,transparent)] text-[color:var(--m-st-danger)]">
              <AlertTriangle size={18} strokeWidth={2.2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[0.8125rem] font-bold text-m-ink">
                Warning, this will invalidate all sessions and log you out.
              </p>
              <p className="mt-1 font-geist text-[0.625rem] leading-relaxed text-m-muted">
                A new JWT secret will be generated immediately. Every logged-in user — including you — will be signed
                out and will need to log in again.
              </p>
            </div>
          </div>
        </MAdminSheetFrame>
      </MSheet>
    </>
  )
}
