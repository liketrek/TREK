import { Image } from 'lucide-react'
import type { JourneyPhoto } from '../../store/journeyStore'
import { photoUrl } from '../../pages/journeyDetail/JourneyDetailPage.helpers'

export function PhotoImg({ photo, className, style, onClick }: { photo: JourneyPhoto; className?: string; style?: React.CSSProperties; onClick?: () => void }) {
  const src = photoUrl(photo, 'thumbnail')
  return (
    <img
      src={src}
      alt=""
      className={className}
      style={style}
      onClick={onClick}
      loading="lazy"
    />
  )
}

export function PhotoGrid({ photos, onClick }: { photos: JourneyPhoto[]; onClick: (idx: number) => void }) {
  const count = photos.length
  if (count === 0) return null

  if (count === 1) {
    return (
      <div className="overflow-hidden cursor-pointer" onClick={() => onClick(0)}>
        <PhotoImg photo={photos[0]} className="w-full h-72 object-cover" />
      </div>
    )
  }

  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-0.5 overflow-hidden">
        {photos.slice(0, 2).map((p, i) => (
          <PhotoImg key={p.id} photo={p} className="w-full h-52 object-cover cursor-pointer" onClick={() => onClick(i)} />
        ))}
      </div>
    )
  }

  return (
    <div className="overflow-hidden flex" style={{ height: 300, gap: 2 }}>
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onClick(0)}>
        <PhotoImg photo={photos[0]} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0 flex flex-col" style={{ gap: 2 }}>
        <div className="flex-1 min-h-0 cursor-pointer" onClick={() => onClick(1)}>
          <PhotoImg photo={photos[1]} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-h-0 relative cursor-pointer" onClick={() => onClick(2)}>
          <PhotoImg photo={photos[2]} className="w-full h-full object-cover" />
          {count > 3 && (
            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur text-white rounded-full px-2 py-0.5 text-[10px] font-semibold flex items-center gap-1">
              <Image size={10} />
              +{count - 3}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
