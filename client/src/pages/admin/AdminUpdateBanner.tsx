import React from 'react'
import { ArrowUpCircle, ExternalLink, Download } from 'lucide-react'
import type { TranslationFn } from '../../types'
import type { UpdateInfo } from './adminModel'

interface AdminUpdateBannerProps {
  updateInfo: UpdateInfo
  t: TranslationFn
  onHowTo: () => void
}

// The "new version available" banner shown at the top of the admin page.
// Purely presentational — extracted from AdminPage with identical markup.
export default function AdminUpdateBanner({ updateInfo, t, onHowTo }: AdminUpdateBannerProps): React.ReactElement {
  return (
    <div className="mb-6 p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-amber-500 dark:bg-amber-600">
          <ArrowUpCircle className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">{t('admin.update.available')}</p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
            {t('admin.update.text').replace('{version}', `v${updateInfo.latest}`).replace('{current}', `v${updateInfo.current}`)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {updateInfo.release_url && (
          <a
            href={updateInfo.release_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/50"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {t('admin.update.button')}
          </a>
        )}
        <button
          onClick={onHowTo}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-gray-200"
        >
          <Download className="w-4 h-4" />
          {t('admin.update.howTo')}
        </button>
      </div>
    </div>
  )
}
