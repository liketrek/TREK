import React from 'react'
import { adminApi } from '../../api/client'
import Modal from '../../components/shared/Modal'
import CustomSelect from '../../components/shared/CustomSelect'
import { CheckCircle, ArrowUpCircle, ExternalLink, RefreshCw, AlertTriangle, Fingerprint, Eye, EyeOff } from 'lucide-react'
import type { TranslationFn } from '../../types'
import type { useAdmin } from './useAdmin'

interface AdminUserModalsProps {
  admin: ReturnType<typeof useAdmin>
  t: TranslationFn
}

// The admin page's modal layer: create-user, edit-user, the "how to update"
// popup and the rotate-JWT confirmation. Pure layout around the useAdmin hook.
export default function AdminUserModals({ admin, t }: AdminUserModalsProps): React.ReactElement {
  const {
    logout, navigate, toast,
    editingUser, setEditingUser, editForm, setEditForm,
    showCreateUser, setShowCreateUser, createForm, setCreateForm,
    updateInfo, showUpdateModal, setShowUpdateModal,
    showRotateJwtModal, setShowRotateJwtModal, rotatingJwt, setRotatingJwt,
    handleCreateUser, handleSaveUser,
  } = admin
  const [showCreatePw, setShowCreatePw] = React.useState(false)
  const [showEditPw, setShowEditPw] = React.useState(false)

  return (
    <>
      {/* Create user modal */}
      <Modal
        isOpen={showCreateUser}
        onClose={() => setShowCreateUser(false)}
        title={t('admin.createUser')}
        size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowCreateUser(false)}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleCreateUser}
              className="px-4 py-2 text-sm bg-slate-900 hover:bg-slate-700 text-white rounded-lg"
            >
              {t('admin.createUser')}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('settings.username')} *</label>
            <input
              type="text"
              value={createForm.username}
              onChange={e => setCreateForm(f => ({ ...f, username: e.target.value }))}
              placeholder={t('settings.username')}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-400 focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('common.email')} *</label>
            <input
              type="email"
              value={createForm.email}
              onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
              placeholder={t('common.email')}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-400 focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('common.password')} *</label>
            <div className="relative">
              <input
                type={showCreatePw ? 'text' : 'password'}
                value={createForm.password}
                onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                placeholder={t('common.password')}
                className="w-full px-3 py-2.5 pr-10 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-400 focus:border-transparent text-sm"
              />
              <button
                type="button"
                onClick={() => setShowCreatePw(v => !v)}
                tabIndex={-1}
                aria-label="Show or hide password"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                {showCreatePw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('settings.role')}</label>
            <CustomSelect
              value={createForm.role}
              onChange={value => setCreateForm(f => ({ ...f, role: String(value) }))}
              options={[
                { value: 'user', label: t('settings.roleUser') },
                { value: 'admin', label: t('settings.roleAdmin') },
              ]}
            />
          </div>
        </div>
      </Modal>

      {/* Edit user modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title={t('admin.editUser')}
        size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setEditingUser(null)}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSaveUser}
              className="px-4 py-2 text-sm bg-slate-900 hover:bg-slate-700 text-white rounded-lg"
            >
              {t('common.save')}
            </button>
          </div>
        }
      >
        {editingUser && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('settings.username')}</label>
              <input
                type="text"
                value={editForm.username}
                onChange={e => setEditForm(f => ({ ...f, username: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-400 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('common.email')}</label>
              <input
                type="email"
                value={editForm.email}
                onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-400 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('admin.newPassword')} <span className="text-slate-400 font-normal">({t('admin.newPasswordHint')})</span></label>
              <div className="relative">
                <input
                  type={showEditPw ? 'text' : 'password'}
                  value={editForm.password}
                  onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))}
                  placeholder={t('admin.newPasswordPlaceholder')}
                  className="w-full px-3 py-2.5 pr-10 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-400 focus:border-transparent text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowEditPw(v => !v)}
                  tabIndex={-1}
                  aria-label="Show or hide password"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                >
                  {showEditPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('settings.role')}</label>
              <CustomSelect
                value={editForm.role}
                onChange={value => setEditForm(f => ({ ...f, role: String(value) }))}
                options={[
                  { value: 'user', label: t('settings.roleUser') },
                  { value: 'admin', label: t('settings.roleAdmin') },
                ]}
              />
            </div>
            <div className="pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-400 mb-2">{t('admin.passkey.resetHint')}</p>
              <button
                type="button"
                onClick={async () => {
                  if (!editingUser) return
                  if (!confirm(t('admin.passkey.resetConfirm', { name: editingUser.username }))) return
                  try {
                    const r = await adminApi.resetUserPasskeys(editingUser.id)
                    toast.success(t('admin.passkey.resetDone', { count: r.deleted ?? 0 }))
                  } catch {
                    toast.error(t('common.error'))
                  }
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
              >
                <Fingerprint size={14} /> {t('admin.passkey.reset')}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Update instructions popup */}
      {showUpdateModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setShowUpdateModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 440, borderRadius: 16, overflow: 'hidden' }}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
          >
            <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="bg-[rgba(255,255,255,0.2)]" style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ArrowUpCircle size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-white" style={{ margin: 0, fontSize: 'calc(16px * var(--fs-scale-subtitle, 1))', fontWeight: 700 }}>{t('admin.update.howTo')}</h3>
                <p className="text-[rgba(255,255,255,0.8)]" style={{ margin: '2px 0 0', fontSize: 'calc(12px * var(--fs-scale-body, 1))' }}>
                  v{updateInfo?.current} → v{updateInfo?.latest}
                </p>
              </div>
            </div>

            <div style={{ padding: '20px 24px' }}>
              <p className="text-gray-700 dark:text-gray-300" style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', lineHeight: 1.6, margin: 0 }}>
                {(updateInfo?.is_docker === false ? t('admin.update.nonDockerText') : t('admin.update.dockerText')).replace('{version}', `v${updateInfo?.latest ?? ''}`)}
              </p>

              {updateInfo?.is_docker === false ? (
                <a
                  href="https://github.com/mauriceboe/TREK/wiki/Updating"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ marginTop: 14, padding: '12px 14px', borderRadius: 10, fontSize: 'calc(13px * var(--fs-scale-body, 1))', lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
                  className="bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <ExternalLink className="w-4 h-4 flex-shrink-0" />
                  <span className="font-semibold underline">{t('admin.update.wikiLink')}</span>
                </a>
              ) : (
                <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 10, fontSize: 'calc(12px * var(--fs-scale-body, 1))', lineHeight: 1.8, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
                  className="bg-gray-900 dark:bg-gray-950 text-gray-100 border border-gray-700"
                >
{`docker pull mauriceboe/trek:latest
docker stop trek && docker rm trek
docker run -d --name trek \\
  -p 3000:3000 \\
  -v /opt/trek/data:/app/data \\
  -v /opt/trek/uploads:/app/uploads \\
  --restart unless-stopped \\
  mauriceboe/trek:latest`}
                </div>
              )}

              <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 10, fontSize: 'calc(12px * var(--fs-scale-body, 1))', lineHeight: 1.5 }}
                className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              >
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>{t('admin.update.dataInfo')}</span>
                </div>
              </div>

              {updateInfo?.release_url && (
                <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 10, fontSize: 'calc(12px * var(--fs-scale-body, 1))', lineHeight: 1.5 }}
                  className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                >
                  <div className="flex items-start gap-2">
                    <ExternalLink className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>
                      <a href={updateInfo.release_url} target="_blank" rel="noopener noreferrer" className="underline font-semibold">
                        {t('admin.update.button')}
                      </a>
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '0 24px 20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowUpdateModal(false)}
                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-gray-200"
                style={{ padding: '9px 20px', borderRadius: 10, fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rotate JWT Secret confirmation modal */}
      <Modal
        isOpen={showRotateJwtModal}
        onClose={() => setShowRotateJwtModal(false)}
        title="Rotate JWT Secret"
        size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowRotateJwtModal(false)}
              disabled={rotatingJwt}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={async () => {
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
              }}
              disabled={rotatingJwt}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-lg font-medium"
            >
              {rotatingJwt ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Rotate &amp; Log out
            </button>
          </div>
        }
      >
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900 mb-1">Warning, this will invalidate all sessions and log you out.</p>
            <p className="text-xs text-slate-500">A new JWT secret will be generated immediately. Every logged-in user — including you — will be signed out and will need to log in again.</p>
          </div>
        </div>
      </Modal>
    </>
  )
}
