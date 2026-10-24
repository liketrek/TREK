import {
  MIN_PRINT_DPI,
  PHOTO_ADJUSTMENTS,
  PHOTO_DUOTONES,
  PHOTO_EDGE_MAX,
  PHOTO_LOOK_STARTS,
  PHOTO_SHADOW_REACH,
  PHOTO_ZOOM,
  photoDpi,
  photoLookOf,
  type BookPhotoAdjust,
  type BookPhotoEdge,
  type BookPhotoElement,
  type PhotoAdjustment,
} from '@trek/shared';
import { FlipHorizontal2, Printer, RotateCcw, TriangleAlert } from 'lucide-react';

import '../../../styles/studio-photo.css';
import { photoEdgesInUse } from '../inspector/inspectorModel';
import { Line, NumField, Section, Switch } from '../StudioControls';
import { Swatches } from '../StudioSwatches';
import { StudioSlider } from './StudioSlider';
import { usePhotoPixels } from './usePhotoPixels';

/**
 * The inspector rows of the photo look (book-photo-look.schema.ts in shared):
 * zoom, mirror and the print resolution beside the crop, then the border, the
 * hard shadow and the cutout, the adjustments and the duotone.
 *
 * Its own file so the inspector carries two hooks for it and nothing else;
 * every other Studio package edits that panel too.
 *
 * A part that is off is left out of the document (undefined), never stored as
 * a neutral value, so a photo nobody restyled stays exactly what it was.
 */

type Patch = Partial<BookPhotoElement>;
type T = (k: string, params?: Record<string, string | number>) => string;

interface RowProps {
  el: BookPhotoElement;
  /** One undo step. */
  set: (patch: Patch) => void;
  /** While a slider moves: the page follows, nothing is committed. */
  live: (patch: Patch) => void;
  t: T;
}

const percent = (v: number) => `${Math.round(v * 100)}%`;
const signed = (v: number) => {
  const n = Math.round(v * 100);
  return n > 0 ? `+${n}` : String(n);
};

/** What prints when the photo leaves the printer: about this many dots per inch, and a warning under the threshold. */
function PrintResolution({ el, t }: { el: BookPhotoElement; t: T }) {
  const pixels = usePhotoPixels(el.photoId);
  if (el.photoId == null || !pixels) return null;
  const dpi = photoDpi(el, { photoId: el.photoId, ...pixels });
  if (dpi === null) return null;
  const low = dpi < MIN_PRINT_DPI;
  return (
    <div className={`st-photo-dpi ${low ? 'is-low' : ''}`} role="status">
      {low ? <TriangleAlert size={14} aria-hidden /> : <Printer size={14} aria-hidden />}
      <div>
        <p className="st-photo-dpi-value">{t('journey.studio.photo.dpi', { dpi })}</p>
        {low && <p className="st-photo-dpi-hint">{t('journey.studio.photo.dpiLow', { min: MIN_PRINT_DPI })}</p>}
      </div>
    </div>
  );
}

/** Beside the crop: how far the picture is zoomed about its focal point, whether it is mirrored, and how it prints. */
export function PhotoCropExtras({ el, set, live, t }: RowProps) {
  // An empty frame has no picture to zoom, mirror or print.
  if (el.photoId == null) return null;
  const look = photoLookOf(el);
  const zoomOf = (v: number) => (v > PHOTO_ZOOM.min ? Math.round(v * 100) / 100 : undefined);
  return (
    <div className="st-photo-crop">
      <StudioSlider
        label={t('journey.studio.photo.zoom')}
        value={look.zoom}
        min={PHOTO_ZOOM.min}
        max={PHOTO_ZOOM.max}
        step={0.05}
        format={percent}
        onLive={(v) => live({ zoom: zoomOf(v) })}
        onCommit={(v) => set({ zoom: zoomOf(v) })}
      />
      <button
        type="button"
        className={`st-chip ${look.flipX ? 'is-on' : ''}`}
        aria-pressed={look.flipX}
        onClick={() => set({ flipX: look.flipX ? undefined : true })}
      >
        <FlipHorizontal2 size={13} aria-hidden />
        {t('journey.studio.photo.flip')}
      </button>
      <PrintResolution el={el} t={t} />
    </div>
  );
}

/** A border or a cutout: on or off, how deep, what colour. */
function EdgeRow({
  label,
  value,
  start,
  onSet,
  t,
}: {
  label: string;
  value: BookPhotoEdge | null;
  start: BookPhotoEdge;
  onSet: (edge: BookPhotoEdge | undefined) => void;
  t: T;
}) {
  return (
    <div className="st-photo-part">
      <Switch label={label} on={!!value} onToggle={() => onSet(value ? undefined : { ...start })} />
      {value && (
        <div className="st-photo-part-body">
          <NumField
            label={t('journey.studio.photo.width')}
            value={value.width}
            min={0.1}
            max={PHOTO_EDGE_MAX}
            step={0.5}
            unit="mm"
            onChange={(width) => onSet({ ...value, width })}
          />
          <Line label={t('journey.studio.colour')} wide>
            <Swatches value={value.color} onPick={(color) => onSet({ ...value, color })} />
          </Line>
        </div>
      )}
    </div>
  );
}

/** The hard shadow: on or off, how far it falls, how strong, what colour. */
function ShadowRow({ el, set, live, t }: RowProps) {
  const shadow = photoLookOf(el).shadow;
  return (
    <div className="st-photo-part">
      <Switch
        label={t('journey.studio.photo.shadow')}
        on={!!shadow}
        onToggle={() => set({ shadow: shadow ? undefined : { ...PHOTO_LOOK_STARTS.shadow } })}
      />
      {shadow && (
        <div className="st-photo-part-body">
          <div className="st-grid2">
            {(['dx', 'dy'] as const).map((axis) => (
              <NumField
                key={axis}
                label={t(`journey.studio.photo.${axis}`)}
                value={shadow[axis]}
                min={-PHOTO_SHADOW_REACH}
                max={PHOTO_SHADOW_REACH}
                step={0.5}
                unit="mm"
                onChange={(v) => set({ shadow: { ...shadow, [axis]: v } })}
              />
            ))}
          </div>
          <StudioSlider
            label={t('journey.studio.opacity')}
            value={shadow.alpha}
            min={0}
            max={1}
            step={0.05}
            format={percent}
            onLive={(alpha) => live({ shadow: { ...shadow, alpha } })}
            onCommit={(alpha) => set({ shadow: { ...shadow, alpha } })}
          />
          <Line label={t('journey.studio.colour')} wide>
            <Swatches value={shadow.color} onPick={(color) => set({ shadow: { ...shadow, color } })} />
          </Line>
        </div>
      )}
    </div>
  );
}

/** Brightness, contrast, saturation and warmth, each from -100 to +100, and one press back to the picture as shot. */
function AdjustRows({ el, set, live, t }: RowProps) {
  const adjust = photoLookOf(el).adjust;
  const next = (key: PhotoAdjustment, v: number): BookPhotoAdjust | undefined => {
    const all = { ...(adjust ?? {}), [key]: Math.round(v * 100) / 100 };
    return PHOTO_ADJUSTMENTS.some((k) => all[k]) ? all : undefined;
  };
  return (
    <>
      {PHOTO_ADJUSTMENTS.map((key) => (
        <StudioSlider
          key={key}
          label={t(`journey.studio.photo.${key}`)}
          value={adjust?.[key] ?? 0}
          min={-1}
          max={1}
          step={0.05}
          format={signed}
          onLive={(v) => live({ adjust: next(key, v) })}
          onCommit={(v) => set({ adjust: next(key, v) })}
        />
      ))}
      {adjust && (
        <button type="button" className="st-chip st-photo-reset" onClick={() => set({ adjust: undefined })}>
          <RotateCcw size={13} aria-hidden />
          {t('journey.studio.photo.reset')}
        </button>
      )}
    </>
  );
}

/** The duotone: on or off, one of the ready pairs, or the two inks picked by hand. */
function DuotoneRows({ el, set, t }: Omit<RowProps, 'live'>) {
  const duotone = photoLookOf(el).duotone;
  return (
    <>
      <Switch
        label={t('journey.studio.photo.duotone')}
        on={!!duotone}
        onToggle={() => set({ duotone: duotone ? undefined : { ...PHOTO_LOOK_STARTS.duotone } })}
      />
      {duotone && (
        <div className="st-photo-part-body">
          <div className="st-photo-duos" role="radiogroup" aria-label={t('journey.studio.photo.duotone')}>
            {PHOTO_DUOTONES.map((pair) => {
              const on = pair.dark === duotone.dark && pair.light === duotone.light;
              return (
                <button
                  type="button"
                  key={`${pair.dark}${pair.light}`}
                  role="radio"
                  aria-checked={on}
                  aria-label={`${pair.dark} ${pair.light}`}
                  className={`st-photo-duo ${on ? 'is-on' : ''}`}
                  // A swatch shows the two inks themselves, half and half.
                  style={{ backgroundImage: `linear-gradient(135deg, ${pair.dark} 50%, ${pair.light} 50%)` }}
                  onClick={() => set({ duotone: { ...pair } })}
                />
              );
            })}
          </div>
          <Line label={t('journey.studio.photo.duotoneDark')} wide>
            <Swatches value={duotone.dark} onPick={(dark) => set({ duotone: { ...duotone, dark } })} />
          </Line>
          <Line label={t('journey.studio.photo.duotoneLight')} wide>
            <Swatches value={duotone.light} onPick={(light) => set({ duotone: { ...duotone, light } })} />
          </Line>
        </div>
      )}
    </>
  );
}

/** The look's own sections, after the inspector's Look section. */
export function PhotoLookSections(props: RowProps) {
  const { el, set, t } = props;
  const look = photoLookOf(el);
  const raster = t('journey.studio.photo.rasterHint');
  return (
    <>
      <Section label={t('journey.studio.photo.edges')} defaultOpen={photoEdgesInUse(el)}>
        <EdgeRow
          label={t('journey.studio.photo.border')}
          value={look.border}
          start={PHOTO_LOOK_STARTS.border}
          onSet={(border) => set({ border })}
          t={t}
        />
        <ShadowRow {...props} />
        <EdgeRow
          label={t('journey.studio.photo.cutout')}
          value={look.cutout}
          start={PHOTO_LOOK_STARTS.cutout}
          onSet={(cutout) => set({ cutout })}
          t={t}
        />
      </Section>
      <Section label={t('journey.studio.photo.adjust')} hint={raster} defaultOpen={!!look.adjust}>
        <AdjustRows {...props} />
      </Section>
      <Section label={t('journey.studio.photo.duotone')} hint={raster} defaultOpen={!!look.duotone}>
        <DuotoneRows el={el} set={set} t={t} />
      </Section>
    </>
  );
}
