import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { useToast } from '../shared/Toast'
import type { Place, Day } from '../../types'

interface PhotoUploadProps {
  tripId: number
  days: Day[]
  places: Place[]
  onUpload: (fd: FormData) => Promise<void>
  onClose: () => void
}

export function PhotoUpload({ tripId, days, places, onUpload, onClose }: PhotoUploadProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const [files, setFiles] = useState([])
  const [dayId, setDayId] = useState('')
  const [placeId, setPlaceId] = useState('')
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const onDrop = useCallback((acceptedFiles) => {
    const withPreview = acceptedFiles.map(file =>
      Object.assign(file, { preview: URL.createObjectURL(file) })
    )
    setFiles(prev => [...prev, ...withPreview])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.heic'] },
    maxFiles: 30,
    maxSize: 10 * 1024 * 1024,
  })

  const removeFile = (index) => {
    setFiles(prev => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleUpload = async () => {
    if (files.length === 0) return
    setUploading(true)
    setProgress(0)

    try {
      const formData = new FormData()
      files.forEach(file => formData.append('photos', file))
      if (dayId) formData.append('day_id', dayId)
      if (placeId) formData.append('place_id', placeId)
      if (caption) formData.append('caption', caption)

      await onUpload(formData)
      files.forEach(f => URL.revokeObjectURL(f.preview))
      setFiles([])
    } catch (err: unknown) {
      console.error('Upload failed:', err)
      toast.error(t('common.error'))
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragActive
            ? 'border-slate-900 bg-slate-50'
            : 'border-gray-300 hover:border-slate-400 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragActive ? 'text-slate-900' : 'text-gray-400'}`} />
        {isDragActive ? (
          <p className="text-slate-700 font-medium">{t('photos.dropHere')}</p>
        ) : (
          <>
            <p className="text-gray-600 font-medium">{t('photos.dropHereActive')}</p>
            <p className="text-gray-400 text-sm mt-1">{t('photos.clickToSelect')}</p>
            <p className="text-gray-400 text-xs mt-2">{t('photos.fileTypeHint')}</p>
          </>
        )}
      </div>

      {/* Preview grid */}
      {files.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">{files.length} {t(files.length !== 1 ? 'photos.photosSelected' : 'photos.photoSelected')}</p>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto">
            {files.map((file, idx) => (
              <div key={idx} className="relative aspect-square group">
                <img
                  src={file.preview}
                  alt={file.name}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  onClick={() => removeFile(idx)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity truncate">
                  {formatSize(file.size)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Options */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t('photos.linkDay')}</label>
            <select
              value={dayId}
              onChange={e => setDayId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="">{t('photos.noDay')}</option>
              {(days || []).map(day => (
                <option key={day.id} value={day.id}>{t('photos.dayLabel', { number: day.day_number })}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t('photos.linkPlace')}</label>
            <select
              value={placeId}
              onChange={e => setPlaceId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="">{t('photos.noPlace')}</option>
              {(places || []).map(place => (
                <option key={place.id} value={place.id}>{place.name}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">{t('photos.captionForAll')}</label>
            <input
              type="text"
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder={t('photos.captionPlaceholder')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-slate-900">{t('common.uploading')}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div
              className="bg-slate-900 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          {t('common.cancel')}
        </button>
        <button
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
          className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-700 disabled:opacity-60 font-medium"
        >
          <Upload className="w-4 h-4" />
          {uploading ? t('common.uploading') : t('photos.uploadN', { n: files.length })}
        </button>
      </div>
    </div>
  )
}
