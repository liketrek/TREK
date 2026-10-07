import { Image, Play } from 'lucide-react';
import { photoUrl, posterlessVideo } from '../../pages/journeyDetail/JourneyDetailPage.helpers';
import type { JourneyPhoto } from '../../store/journeyStore';

export function PhotoImg({
  photo,
  className,
  style,
}: {
  photo: JourneyPhoto;
  className?: string;
  style?: React.CSSProperties;
}) {
  const src = photoUrl(photo, 'thumbnail');
  const isVideo = photo.media_type === 'video';

  return (
    <div className={`relative overflow-hidden ${isVideo ? 'bg-black' : ''} ${className || ''}`} style={style}>
      {/* A clip without a poster keeps the black tile and the play badge; asking
          for its thumbnail would only draw the broken-image glyph over them. */}
      {!posterlessVideo(photo) && (
        <img
          src={src}
          alt=""
          className={`h-full w-full ${isVideo ? 'object-contain' : 'object-cover'}`}
          loading="lazy"
        />
      )}

      {isVideo && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm">
            <Play size={20} className="ml-0.5" fill="currentColor" />
          </span>
        </div>
      )}
    </div>
  );
}

export function PhotoGrid({ photos, onClick }: { photos: JourneyPhoto[]; onClick: (idx: number) => void }) {
  const count = photos.length;
  if (count === 0) return null;

  if (count === 1) {
    return (
      <button type="button" className="block w-full cursor-pointer overflow-hidden" onClick={() => onClick(0)}>
        <PhotoImg photo={photos[0]} className="h-72 w-full object-cover" />
      </button>
    );
  }

  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-0.5 overflow-hidden">
        {photos.slice(0, 2).map((p, i) => (
          <button
            key={p.id}
            type="button"
            className="block h-52 w-full cursor-pointer overflow-hidden"
            onClick={() => onClick(i)}
          >
            <PhotoImg photo={p} className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex overflow-hidden" style={{ height: 300, gap: 2 }}>
      <button type="button" className="min-w-0 flex-1 cursor-pointer" onClick={() => onClick(0)}>
        <PhotoImg photo={photos[0]} className="h-full w-full object-cover" />
      </button>
      <div className="flex min-w-0 flex-1 flex-col" style={{ gap: 2 }}>
        <button type="button" className="min-h-0 flex-1 cursor-pointer" onClick={() => onClick(1)}>
          <PhotoImg photo={photos[1]} className="h-full w-full object-cover" />
        </button>
        <button type="button" className="relative min-h-0 flex-1 cursor-pointer" onClick={() => onClick(2)}>
          <PhotoImg photo={photos[2]} className="h-full w-full object-cover" />
          {count > 3 && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
              <Image size={10} />+{count - 3}
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
