import React from 'react'
import { Link } from 'react-router-dom'
import PageShell from '../components/Layout/PageShell'
import { PageSpinner } from '../components/shared/Spinner'
import FileManager from '../components/Files/FileManager'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from '../i18n'
import { useFiles } from './files/useFiles'

export default function FilesPage(): React.ReactElement {
  const { t } = useTranslation()
  // Page = wiring container: trip/places load, file sync + handlers live in the hook.
  const { tripId, navigate, trip, places, files, isLoading, handleUpload, handleDelete } = useFiles()

  if (isLoading) {
    return (
      <PageSpinner
        wrapperClassName="min-h-screen flex items-center justify-center bg-slate-50"
        className="w-10 h-10 border-4 border-slate-200 border-t-slate-700"
      />
    )
  }

  return (
    <PageShell className="bg-slate-50" navbar={{ tripTitle: trip?.title, tripId, showBack: true, onBack: () => navigate(`/trips/${tripId}`) }}>
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <Link
              to={`/trips/${tripId}`}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('common.backToPlanning')}
            </Link>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('files.pageTitle')}</h1>
              <p className="text-gray-500 text-sm">{t('files.subtitle', { count: files.length, trip: trip?.title })}</p>
            </div>
          </div>

          <FileManager
            files={files}
            onUpload={handleUpload}
            onDelete={handleDelete}
            places={places}
            tripId={tripId}
          />
        </div>
    </PageShell>
  )
}
