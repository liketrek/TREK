import { Image, Play } from 'lucide-react'
import type { JourneyPhoto } from '../../store/journeyStore'
import { photoUrl } from '../../pages/journeyDetail/JourneyDetailPage.helpers'

export function PhotoImg({ photo, className, style }: { photo: JourneyPhoto; className?: string; style?: React.CSSProperties }) {
  const src = photoUrl(photo, 'thumbnail')
  const isVideo = photo.media_type === 'video'

  return (
    <div
      className={`relative overflow-hidden ${isVideo ? 'bg-black' : ''} ${className || ''}`}
      style={style}
    >
      <img
        src={src}
        alt=""
        className={`w-full h-full ${isVideo ? 'object-contain' : 'object-cover'}`}
        loading="lazy"
      />

      {isVideo && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white">
            <Play size={20} className="ml-0.5" fill="currentColor" />
          </span>
        </div>
      )}
    </div>
  )
}

export function PhotoGrid({ photos, onClick }: { photos: JourneyPhoto[]; onClick: (idx: number) => void }) {
  const count = photos.length
  if (count === 0) return null

  if (count === 1) {
    return (
      <button type="button" className="block w-full overflow-hidden cursor-pointer" onClick={() => onClick(0)}>
        <PhotoImg photo={photos[0]} className="w-full h-72 object-cover" />
      </button>
    )
  }

  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-0.5 overflow-hidden">
        {photos.slice(0, 2).map((p, i) => (
          <button key={p.id} type="button" className="block w-full h-52 overflow-hidden cursor-pointer" onClick={() => onClick(i)}>
            <PhotoImg photo={p} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="overflow-hidden flex" style={{ height: 300, gap: 2 }}>
      <button type="button" className="flex-1 min-w-0 cursor-pointer" onClick={() => onClick(0)}>
        <PhotoImg photo={photos[0]} className="w-full h-full object-cover" />
      </button>
      <div className="flex-1 min-w-0 flex flex-col" style={{ gap: 2 }}>
        <button type="button" className="flex-1 min-h-0 cursor-pointer" onClick={() => onClick(1)}>
          <PhotoImg photo={photos[1]} className="w-full h-full object-cover" />
        </button>
        <button type="button" className="flex-1 min-h-0 relative cursor-pointer" onClick={() => onClick(2)}>
          <PhotoImg photo={photos[2]} className="w-full h-full object-cover" />
          {count > 3 && (
            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur text-white rounded-full px-2 py-0.5 text-[10px] font-semibold flex items-center gap-1">
              <Image size={10} />
              +{count - 3}
            </div>
          )}
        </button>
      </div>
    </div>
  )
}