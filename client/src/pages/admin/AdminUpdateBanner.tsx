import React from 'react'
import { ArrowUpCircle, ExternalLink, Download } from 'lucide-react'
import type { TranslationFn } from '../../types'
import type { UpdateInfo } from './adminModel'
import { fs } from '../../components/shared/DialogShell'
import { SETTINGS_BUTTON, SETTINGS_BUTTON_PRIMARY } from '../../components/Settings/settingsKit'

interface AdminUpdateBannerProps {
  updateInfo: UpdateInfo
  t: TranslationFn
  onHowTo: () => void
}

// The "new version available" banner shown at the top of the admin page, as a
// card of the settings kit: a warning tile, the versions, and the two actions
// in the dialogs' button shapes. Purely presentational.
export default function AdminUpdateBanner({ updateInfo, t, onHowTo }: AdminUpdateBannerProps): React.ReactElement {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-edge-faint bg-surface-secondary px-4 py-3">
      <span className="grid h-10 w-10 flex-none place-items-center rounded-[12px] bg-warning-soft text-warning">
        <ArrowUpCircle size={18} strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1 basis-64">
        <p className="m-0 font-bold text-content" style={fs(14, 'body')}>{t('admin.update.available')}</p>
        <p className="m-0 mt-0.5 text-content-muted" style={fs(12.5, 'body')}>
          {t('admin.update.text').replace('{version}', `v${updateInfo.latest}`).replace('{current}', `v${updateInfo.current}`)}
        </p>
      </div>
      <div className="flex flex-none flex-wrap items-center gap-2" style={fs(13, 'body')}>
        {updateInfo.release_url && (
          <a
            href={updateInfo.release_url}
            target="_blank"
            rel="noopener noreferrer"
            className={SETTINGS_BUTTON}
          >
            <ExternalLink size={14} strokeWidth={2.1} className="flex-none" />
            {t('admin.update.button')}
          </a>
        )}
        <button type="button" onClick={onHowTo} className={SETTINGS_BUTTON_PRIMARY}>
          <Download size={14} strokeWidth={2.1} className="flex-none" />
          {t('admin.update.howTo')}
        </button>
      </div>
    </div>
  )
}
