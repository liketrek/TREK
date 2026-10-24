import {
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  CaseLower,
  CaseSensitive,
  CaseUpper,
} from 'lucide-react';

import type { BookElement, BookSpread, BookTextElement } from '@trek/shared';
import { bookTextIsDrawn, bookTextPaintFill } from '@trek/shared';

import '../../styles/studio-text.css';
import { photoSrc } from './bookRender';
import { FocalPad } from './inspector/FocalPad';
import { textEffectsInUse, textPlacementInUse } from './inspector/inspectorModel';
import { paintAs } from './paint/paintEdit';
import type { PaintChannel } from './paint/usePaintChannel';
import { Choice, Line, NumField, Section, Switch } from './StudioControls';
import { StudioPaintPicker } from './StudioPaintPicker';
import { Swatches } from './StudioSwatches';
import { defaultBand, defaultOutline, defaultShadow, firstFillPhoto, isHollow } from './textEffects';

/**
 * The text inspector's effects: how the letters are cased and where the lines
 * sit, whether the text shrinks to its frame, and the outline, hard shadow,
 * marker band, curve and fill (book-text-effects.schema.ts in shared). Both
 * groups start folded and open on a text that already uses them.
 *
 * Every effect is a switch that arrives already looking right: an outline in
 * the colour that stands out from the letters at a twentieth of their height,
 * a shadow a twelfth of it down and across, a band with a quarter em of room.
 * A first press that shows something good is the difference between a feature
 * people use and a row of switches nobody turns on twice.
 */

type Patch = Partial<BookTextElement>;
type SetPatch = (patch: Partial<BookElement>) => void;

interface Props {
  el: BookTextElement;
  /** One undo step. */
  set: SetPatch;
  /** A change inside a drag, as the focal pad makes. */
  live: SetPatch;
  /** The journey's photos, for filling the letters with one. */
  photos: readonly { photoId: number }[];
  spread: BookSpread | undefined;
  t: (k: string) => string;
}

/** How many photos the fill offers at once: two rows of the panel's thumbnails. */
const FILL_PHOTOS = 12;

function CaseAndPlace({ el, set, t }: Pick<Props, 'el' | 'set' | 't'>) {
  return (
    <Section label={t('journey.studio.fx.placement')} defaultOpen={textPlacementInUse(el)}>
      <Line label={t('journey.studio.fx.case')}>
        <Choice
          value={el.transform ?? 'none'}
          ariaLabel={t('journey.studio.fx.case')}
          options={[
            { value: 'none' as const, label: <CaseSensitive size={15} />, title: t('journey.studio.fx.caseNone') },
            { value: 'upper' as const, label: <CaseUpper size={15} />, title: t('journey.studio.fx.caseUpper') },
            { value: 'lower' as const, label: <CaseLower size={15} />, title: t('journey.studio.fx.caseLower') },
            { value: 'smallcaps' as const, label: t('journey.studio.fx.caseSmall') },
          ]}
          onPick={(transform) => set({ transform } as Patch)}
        />
      </Line>
      <Line label={t('journey.studio.fx.vertical')}>
        <Choice
          value={el.vAlign ?? 'top'}
          ariaLabel={t('journey.studio.fx.vertical')}
          options={[
            {
              value: 'top' as const,
              label: <AlignVerticalJustifyStart size={15} />,
              title: t('journey.studio.fx.top'),
            },
            {
              value: 'middle' as const,
              label: <AlignVerticalJustifyCenter size={15} />,
              title: t('journey.studio.fx.middle'),
            },
            {
              value: 'bottom' as const,
              label: <AlignVerticalJustifyEnd size={15} />,
              title: t('journey.studio.fx.bottom'),
            },
          ]}
          onPick={(vAlign) => set({ vAlign } as Patch)}
        />
      </Line>
      <Switch
        label={t('journey.studio.fx.fit')}
        on={el.fit === 'shrink'}
        onToggle={() =>
          set((el.fit === 'shrink' ? { fit: 'none', size: el.fitMax ?? el.size } : { fit: 'shrink' }) as Patch)
        }
      />
      {el.fit === 'shrink' && <p className="st-hint st-fx-hint">{t('journey.studio.fx.fitHint')}</p>}
    </Section>
  );
}

function OutlineControls({ el, set, t }: Pick<Props, 'el' | 'set' | 't'>) {
  const outline = el.outline;
  return (
    <div className="st-fx-group">
      <Switch
        label={t('journey.studio.stroke')}
        on={!!outline}
        onToggle={() =>
          set({
            outline: outline ? null : defaultOutline(el),
            ...(outline && isHollow(el) ? { fillPaint: null } : {}),
          } as Patch)
        }
      />
      {outline && (
        <div className="st-fx-body">
          <NumField
            label={t('journey.studio.strokeWidth')}
            value={outline.width}
            min={0.05}
            max={6}
            step={0.05}
            unit="mm"
            onChange={(width) => set({ outline: { ...outline, width } } as Patch)}
          />
          <Swatches value={outline.color} onPick={(color) => set({ outline: { ...outline, color } } as Patch)} />
        </div>
      )}
    </div>
  );
}

function ShadowControls({ el, set, t }: Pick<Props, 'el' | 'set' | 't'>) {
  const shadow = el.shadow;
  return (
    <div className="st-fx-group">
      <Switch
        label={t('journey.studio.fx.shadow')}
        on={!!shadow}
        onToggle={() => set({ shadow: shadow ? null : defaultShadow(el) } as Patch)}
      />
      {shadow && (
        <div className="st-fx-body">
          <div className="st-grid2">
            <NumField
              label={t('journey.studio.fx.across')}
              value={shadow.dx}
              min={-30}
              max={30}
              step={0.1}
              unit="mm"
              onChange={(dx) => set({ shadow: { ...shadow, dx } } as Patch)}
            />
            <NumField
              label={t('journey.studio.fx.down')}
              value={shadow.dy}
              min={-30}
              max={30}
              step={0.1}
              unit="mm"
              onChange={(dy) => set({ shadow: { ...shadow, dy } } as Patch)}
            />
          </div>
          <NumField
            label={t('journey.studio.opacity')}
            value={Math.round(shadow.alpha * 100)}
            min={0}
            max={100}
            step={5}
            unit="%"
            onChange={(v) => set({ shadow: { ...shadow, alpha: v / 100 } } as Patch)}
          />
          <Swatches value={shadow.color} onPick={(color) => set({ shadow: { ...shadow, color } } as Patch)} />
        </div>
      )}
    </div>
  );
}

function BandControls({ el, set, t }: Pick<Props, 'el' | 'set' | 't'>) {
  const band = el.highlight;
  if (bookTextIsDrawn(el)) {
    return <p className="st-hint st-fx-hint">{t('journey.studio.fx.bandDrawn')}</p>;
  }
  return (
    <div className="st-fx-group">
      <Switch
        label={t('journey.studio.fx.band')}
        on={!!band}
        onToggle={() => set({ highlight: band ? null : defaultBand(el) } as Patch)}
      />
      {band && (
        <div className="st-fx-body">
          <div className="st-grid2">
            <NumField
              label={t('journey.studio.fx.padAcross')}
              value={band.padX}
              min={0}
              max={20}
              step={0.1}
              unit="mm"
              onChange={(padX) => set({ highlight: { ...band, padX } } as Patch)}
            />
            <NumField
              label={t('journey.studio.fx.padDown')}
              value={band.padY}
              min={0}
              max={20}
              step={0.1}
              unit="mm"
              onChange={(padY) => set({ highlight: { ...band, padY } } as Patch)}
            />
          </div>
          <NumField
            label={t('journey.studio.radius')}
            value={band.radius}
            min={0}
            max={20}
            step={0.1}
            unit="mm"
            onChange={(radius) => set({ highlight: { ...band, radius } } as Patch)}
          />
          <Swatches value={band.color} onPick={(color) => set({ highlight: { ...band, color } } as Patch)} />
        </div>
      )}
    </div>
  );
}

function CurveControls({ el, set, t }: Pick<Props, 'el' | 'set' | 't'>) {
  const curve = el.curve;
  return (
    <div className="st-fx-group">
      <Line label={t('journey.studio.fx.curve')}>
        <Choice
          value={curve?.type ?? 'none'}
          ariaLabel={t('journey.studio.fx.curve')}
          options={[
            { value: 'none' as const, label: t('journey.studio.fx.straight') },
            { value: 'arc' as const, label: t('journey.studio.fx.arc') },
            { value: 'circle' as const, label: t('journey.studio.fx.circle') },
          ]}
          onPick={(type) =>
            set({
              curve: type === 'none' ? null : { type, bend: curve?.bend ?? 40, start: curve?.start ?? 0 },
            } as Patch)
          }
        />
      </Line>
      {curve?.type === 'arc' && (
        <NumField
          label={t('journey.studio.fx.bend')}
          value={curve.bend}
          min={-100}
          max={100}
          step={5}
          onChange={(bend) => set({ curve: { ...curve, bend } } as Patch)}
        />
      )}
      {curve?.type === 'circle' && (
        <NumField
          label={t('journey.studio.fx.start')}
          value={curve.start}
          min={-180}
          max={180}
          step={5}
          unit="°"
          onChange={(start) => set({ curve: { ...curve, start } } as Patch)}
        />
      )}
    </div>
  );
}

type FillKind = 'colour' | 'hollow' | 'photo' | 'gradient' | 'pattern';

function fillKindOf(el: BookTextElement): FillKind {
  const type = el.fillPaint?.type;
  if (type === 'photo') return 'photo';
  if (type === 'linear' || type === 'radial') return 'gradient';
  if (type === 'pattern') return 'pattern';
  return isHollow(el) ? 'hollow' : 'colour';
}

function FillControls({ el, set, live, photos, spread, t }: Props) {
  const kind = fillKindOf(el);
  const photo = el.fillPaint?.type === 'photo' ? el.fillPaint : null;
  const pick = (next: FillKind) => {
    if (next === 'colour') return set({ fillPaint: null } as Patch);
    if (next === 'hollow') {
      return set({
        fillPaint: { type: 'solid', color: el.color, alpha: 0 },
        // Hollow letters are their outline: one appears with them if there was none.
        outline: el.outline ?? { ...defaultOutline(el), color: el.color },
      } as Patch);
    }
    if (next === 'gradient' || next === 'pattern') {
      // From the text's own colour, as a shape's paint turns from its solid fill.
      return set({ fillPaint: paintAs(next, { type: 'solid', color: el.color }) } as Patch);
    }
    const photoId = firstFillPhoto(spread, photos);
    if (photoId != null) set({ fillPaint: { type: 'photo', photoId, focalX: 0.5, focalY: 0.5, zoom: 1 } } as Patch);
  };
  const letterPaint = bookTextPaintFill(el);
  const channel: PaintChannel = {
    live: (paint) => live({ fillPaint: paint } as Patch),
    commit: (paint) => set({ fillPaint: paint } as Patch),
  };
  return (
    <div className="st-fx-group">
      <Line label={t('journey.studio.fx.letters')}>
        <Choice
          value={kind}
          ariaLabel={t('journey.studio.fx.letters')}
          options={[
            { value: 'colour' as const, label: t('journey.studio.colour') },
            { value: 'hollow' as const, label: t('journey.studio.fx.hollow') },
            { value: 'photo' as const, label: t('journey.studio.kind.photo'), disabled: !photos.length },
            { value: 'gradient' as const, label: t('journey.studio.paint.gradient') },
            { value: 'pattern' as const, label: t('journey.studio.paint.pattern') },
          ]}
          onPick={pick}
        />
      </Line>
      {!photos.length && <p className="st-hint st-fx-hint">{t('journey.studio.fx.noPhotos')}</p>}
      {letterPaint && (kind === 'gradient' || kind === 'pattern') && (
        <StudioPaintPicker
          value={letterPaint}
          channel={channel}
          t={t}
          noneLabel={t('journey.studio.colour')}
          kinds={[kind]}
        />
      )}
      {photo && (
        <div className="st-fx-body">
          <div className="st-fx-photos" role="radiogroup" aria-label={t('journey.studio.fx.pickPhoto')}>
            {photos.slice(0, FILL_PHOTOS).map((p) => (
              <button
                type="button"
                key={p.photoId}
                role="radio"
                aria-checked={p.photoId === photo.photoId}
                aria-label={t('journey.studio.fx.pickPhoto')}
                className={`st-fx-photo ${p.photoId === photo.photoId ? 'is-on' : ''}`}
                onClick={() => set({ fillPaint: { ...photo, photoId: p.photoId } } as Patch)}
              >
                <img src={photoSrc(p.photoId, false)} alt="" draggable={false} />
              </button>
            ))}
          </div>
          <FocalPad
            photoId={photo.photoId}
            x={photo.focalX}
            y={photo.focalY}
            onDrag={(focalX, focalY) => live({ fillPaint: { ...photo, focalX, focalY } } as Patch)}
            onCommit={(focalX, focalY) => set({ fillPaint: { ...photo, focalX, focalY } } as Patch)}
            hint={t('journey.studio.fx.focalHint')}
          />
          <NumField
            label={t('journey.studio.fx.zoom')}
            value={Math.round(photo.zoom * 100)}
            min={100}
            max={400}
            step={10}
            unit="%"
            onChange={(v) => set({ fillPaint: { ...photo, zoom: v / 100 } } as Patch)}
          />
        </div>
      )}
    </div>
  );
}

export function StudioTextEffects(props: Props) {
  const { el, set, t } = props;
  return (
    <>
      <CaseAndPlace el={el} set={set} t={t} />
      <Section label={t('journey.studio.fx.effects')} defaultOpen={textEffectsInUse(el)}>
        <OutlineControls el={el} set={set} t={t} />
        <ShadowControls el={el} set={set} t={t} />
        <BandControls el={el} set={set} t={t} />
        <CurveControls el={el} set={set} t={t} />
        <FillControls {...props} />
        {bookTextIsDrawn(el) && <p className="st-hint st-fx-hint">{t('journey.studio.fx.drawnHint')}</p>}
      </Section>
    </>
  );
}
