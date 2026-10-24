import { photoLookOf, type BookFrame, type BookPhotoElement, type BookShapeId, type PhotoLook } from '@trek/shared';
import type { CSSProperties, ReactNode } from 'react';

import { fontStack } from './bookFonts';
import { photoSrc } from './bookRender';
import { usePaintId } from './paint/usePaintId';
import { pictureFilter, silhouetteShadows, svgFilterMatrices, zoomPlacement } from './photo/photoLook';
import { photoClip } from './shapeOutline';
import { HOLED_SHAPES, SHAPE_PATHS, scalePath } from './shapes';

/**
 * A picture on the page: possibly cut to a shape, possibly sitting in
 * something, possibly wearing a look (book-photo-look.schema.ts in shared).
 *
 * Split out of SpreadView.tsx, which draws every kind and had no room left
 * for the look. It is still the one renderer: the editor, the page
 * thumbnails and the print path all draw a photo through this.
 *
 * The mask and the decoration are independent on purpose: a heart in a Polaroid
 * is a silly thing to want and there is no reason to stop anyone wanting it, and
 * keeping them separate means neither has to know about the other.
 *
 * ── The look, and how each part prints ───────────────────────────────────
 *
 * Border, hard shadow and cutout are flat shapes of one colour, so they stay
 * vector in the PDF. On a rectangular frame (no mask, or a card such as a
 * Polaroid around it) the cutout and the shadow are box shadows without blur,
 * which follow the corner radius; on a frame cut to a shape they are that
 * shape's path, drawn behind the picture. The border is drawn over the edge of
 * the picture, inside the frame, so the frame stays the box the fold and trim
 * checks measure. Zoom and mirror move the picture inside its clip and change
 * nothing around it. Adjustments, warmth and a duotone are filters and print
 * as a raster, which the inspector says.
 *
 * Every SVG id is per instance (usePaintId): the page view draws each spread twice,
 * and two clip paths with one id cut the second picture with the first one's
 * shape.
 */

/** Two decimals of a millimetre, matching what the document itself stores. */
const round2 = (n: number) => Math.round(n * 100) / 100;

const PHOTO_FILTERS: Record<string, string | undefined> = {
  none: undefined,
  bw: 'grayscale(1) contrast(1.05)',
  warm: 'saturate(1.1) sepia(0.16)',
  cool: 'saturate(1.05) hue-rotate(-8deg) brightness(1.02)',
  // Faded, the way a print left in the light goes: lifted blacks, less colour.
  fade: 'saturate(0.72) contrast(0.88) brightness(1.08)',
  contrast: 'contrast(1.22) saturate(1.06)',
};

/**
 * How much of the frame the decoration around a picture eats, as a fraction of
 * the shorter side.
 *
 * A Polaroid's chin is the reason this is a table rather than one number: the
 * bottom border is roughly three times the others, and getting that ratio wrong
 * is the difference between a Polaroid and a photo with a white edge.
 */
const FRAME_INSET: Record<string, { pad: number; bottom: number }> = {
  none: { pad: 0, bottom: 0 },
  polaroid: { pad: 0.055, bottom: 0.17 },
  white: { pad: 0.035, bottom: 0.035 },
  shadow: { pad: 0, bottom: 0 },
  film: { pad: 0.075, bottom: 0.075 },
  tape: { pad: 0, bottom: 0 },
};

/** The frame styles that draw a card around the picture, which makes the frame's outline a rectangle. */
const CARDS = new Set(['polaroid', 'white', 'film']);

/** The cutout and the hard shadow of a frame cut to a shape: its path, grown and offset, behind the picture. */
function ShapeSilhouette({ frame, mask, look }: { frame: BookFrame; mask: BookShapeId; look: PhotoLook }) {
  const { w, h } = frame;
  const d = scalePath(SHAPE_PATHS[mask], w, h);
  const rule = HOLED_SHAPES.has(mask) ? 'evenodd' : undefined;
  const grow = look.cutout?.width ?? 0;
  const path = (color: string, dx = 0, dy = 0) => (
    <path
      d={d}
      transform={dx || dy ? `translate(${dx} ${dy})` : undefined}
      fill={color}
      fillRule={rule}
      stroke={grow ? color : undefined}
      strokeWidth={grow ? grow * 2 : undefined}
      strokeLinejoin="round"
    />
  );
  return (
    <svg
      aria-hidden
      width={`${w}mm`}
      height={`${h}mm`}
      viewBox={`0 0 ${w} ${h}`}
      style={{ position: 'absolute', inset: 0, overflow: 'visible', display: 'block' }}
    >
      {look.shadow && <g opacity={look.shadow.alpha}>{path(look.shadow.color, look.shadow.dx, look.shadow.dy)}</g>}
      {look.cutout && path(look.cutout.color)}
    </svg>
  );
}

/** The border: a band along the inside of the picture's edge, following its shape. */
function BorderBand({
  mask,
  radius,
  look,
  width,
  height,
}: {
  mask: BookShapeId | null;
  radius: number;
  look: PhotoLook;
  width: number;
  height: number;
}) {
  const border = look.border;
  if (!border || width <= 0 || height <= 0) return null;
  if (mask && mask !== 'rect') {
    // Stroked twice as wide as the band and cut by the picture's own clip, so
    // exactly the inner half shows and the band follows every curve.
    return (
      <svg
        aria-hidden
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
      >
        <path
          d={scalePath(SHAPE_PATHS[mask], width, height)}
          fill="none"
          stroke={border.color}
          strokeWidth={border.width * 2}
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        borderStyle: 'solid',
        borderWidth: `${border.width}mm`,
        borderColor: border.color,
        borderRadius: radius ? `${radius}mm` : undefined,
        boxSizing: 'border-box',
      }}
    />
  );
}

/** The picture itself, zoomed about its focal point and mirrored where the look says so. */
function Picture({
  el,
  photoId,
  look,
  big,
  print,
  filterId,
}: {
  el: BookPhotoElement;
  photoId: number;
  look: PhotoLook;
  big: boolean;
  print: boolean;
  filterId: string | null;
}) {
  const zoom = zoomPlacement(look.zoom, el.focalX, el.focalY);
  const img = (
    <img
      src={photoSrc(photoId, big)}
      alt=""
      draggable={false}
      // Lazy on the canvas, where a long book scrolls past; eager in print,
      // where every sheet is laid out at once and a picture the browser put
      // off is a picture missing from the PDF.
      loading={print ? 'eager' : 'lazy'}
      style={{
        width: zoom?.size ?? '100%',
        height: zoom?.size ?? '100%',
        transform: zoom?.transform,
        objectFit: el.fit,
        objectPosition: `${el.focalX * 100}% ${el.focalY * 100}%`,
        filter: pictureFilter(PHOTO_FILTERS[el.filter], look, filterId),
        display: 'block',
      }}
    />
  );
  if (!look.flipX) return img;
  // The picture is mirrored inside a box the size of the frame, so the part
  // the crop shows stays the same part and the mask is not mirrored with it.
  return <div style={{ position: 'absolute', inset: 0, transform: 'scaleX(-1)' }}>{img}</div>;
}

/** What an empty frame shows while editing: a hatch, and where there is room, the instruction. */
function Hatch({ clipped, label, labelSize }: { clipped: boolean; label: ReactNode; labelSize: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        /*
         * Opaque, and that is the point.
         *
         * The hatch used to be laid over nothing, so an empty frame showed
         * whatever was behind it and every attempt to arrange a shape *under*
         * one looked like it had done nothing: the frame appeared to sit at the
         * bottom of the stack no matter where it was, right up until a
         * photograph landed in it and it suddenly covered things. A frame is a
         * promise that a picture goes here, and a picture is not see-through.
         */
        background: 'repeating-linear-gradient(45deg, rgba(0,0,0,.055) 0 6px, rgba(0,0,0,.025) 6px 12px), #ffffff', // theme-lint-disable: paper, not app chrome
        // A dashed border would be cut in half lengthwise by the clip, so a
        // masked placeholder shows its shape through the hatch alone.
        border: clipped ? undefined : '1px dashed rgba(0,0,0,.16)',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2mm',
      }}
    >
      {label && (
        <span
          style={{
            fontFamily: fontStack('sans'),
            fontSize: `${labelSize}mm`,
            fontWeight: 600,
            letterSpacing: '0.16em',
            lineHeight: 1.5,
            textAlign: 'center',
            textTransform: 'uppercase',
            color: 'rgba(0,0,0,.34)',
            whiteSpace: 'pre-line',
            userSelect: 'none',
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

export function PhotoView({
  el,
  big,
  print,
  dropLabel,
  frameStyle,
}: {
  el: BookPhotoElement;
  big: boolean;
  print: boolean;
  dropLabel: string;
  /** The positioned box every element sits in, from SpreadView. */
  frameStyle: CSSProperties;
}) {
  const deco = FRAME_INSET[el.frameStyle] ?? FRAME_INSET.none;
  const side = Math.min(el.frame.w, el.frame.h);
  // Rounded to a hundredth of a millimetre, the same precision the document
  // stores. Without it a fraction of the frame lands in the CSS as
  // `10.200000000000001mm`, which is not wrong but is float noise in a
  // stylesheet that a person may well end up reading.
  const pad = round2(deco.pad * side);
  const bottom = round2(deco.bottom * side);
  const clipId = usePaintId(`c-${el.id}`);
  const filterRef = usePaintId(`f-${el.id}`);
  // The shape the picture is cut to; a rect mask is no mask at all.
  const mask = el.mask && el.mask !== 'rect' ? el.mask : null;
  // The cut as a unit path: the mask, its cut edge, or a cut edge on the rectangle (shapeOutline.ts).
  const clip = photoClip(el, el.frame.w - pad * 2, el.frame.h - pad - (bottom || pad));
  const clipped = clip !== null;
  // An empty frame wears the frame style but none of the look: a border or a
  // shadow around a hatch would read as part of the picture to come.
  const empty = el.photoId == null;
  const look = photoLookOf(empty ? {} : el);
  const matrices = svgFilterMatrices(look);
  const filterId = matrices.length ? filterRef : null;
  const card = CARDS.has(el.frameStyle);

  /*
   * An empty frame is a template's promise: it says where a picture goes before
   * anyone has chosen which, and it says it *in the frame it will wear*.
   *
   * This used to render on its own, ignoring frameStyle entirely, so a Polaroid
   * placeholder was an ordinary dashed rectangle until a photograph landed in
   * it and the chin appeared from nowhere. The two branches have been folded
   * together: the surround is drawn once, and only what goes inside it differs.
   */

  // In the printed book an unfilled frame is nothing at all: a hatch and an
  // instruction on a page someone paid to have bound would be a defect.
  if (empty && print) return null;

  // The label is sized in millimetres so it scales with the zoom exactly as the
  // page does, and it steps aside on a frame too small to hold it.
  const labelSize = Math.max(2.4, Math.min(4.6, side * 0.085));
  const roomy = side - pad * 2 > 22 && el.frame.w - pad * 2 > 34;

  // A photograph lying on a page, rather than printed into it. Soft and low: a
  // hard shadow reads as a UI card, not as paper. The look's own cutout and
  // hard shadow join it when the frame's outline is a rectangle.
  const soft = el.frameStyle === 'shadow' || el.frameStyle === 'polaroid' ? '0 1.2mm 3mm rgba(0,0,0,.22)' : null;
  const boxShadows = [
    ...(clipped && !card ? [] : silhouetteShadows(look.shadow, look.cutout)),
    ...(soft ? [soft] : []),
  ];

  const picture = (
    <div
      style={{
        position: 'absolute',
        left: `${pad}mm`,
        top: `${pad}mm`,
        right: `${pad}mm`,
        bottom: `${bottom || pad}mm`,
        overflow: 'hidden',
        borderRadius: !clipped && el.radius ? `${el.radius}mm` : undefined,
        clipPath: clipped ? `url(#${clipId})` : undefined,
      }}
    >
      {el.photoId == null ? (
        <Hatch clipped={clipped} label={roomy && dropLabel} labelSize={labelSize} />
      ) : (
        <Picture el={el} photoId={el.photoId} look={look} big={big} print={print} filterId={filterId} />
      )}
      {!empty && (
        <BorderBand
          mask={el.mask}
          radius={el.radius}
          look={look}
          width={el.frame.w - pad * 2}
          height={el.frame.h - pad - (bottom || pad)}
        />
      )}
    </div>
  );

  return (
    <div
      style={{
        ...frameStyle,
        background:
          el.frameStyle === 'polaroid' || el.frameStyle === 'white'
            ? '#ffffff'
            : el.frameStyle === 'film'
              ? '#141414'
              : undefined,
        borderRadius: !card && !clipped && el.radius ? `${el.radius}mm` : undefined,
        boxShadow: boxShadows.length ? boxShadows.join(', ') : undefined,
      }}
    >
      {mask && !card && !empty && (look.shadow || look.cutout) && (
        <ShapeSilhouette frame={el.frame} mask={mask} look={look} />
      )}

      {(clip || filterId) && (
        <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
          <defs>
            {clip && (
              <clipPath id={clipId} clipPathUnits="objectBoundingBox">
                <path d={clip} />
              </clipPath>
            )}
            {filterId && (
              <filter id={filterId} colorInterpolationFilters="sRGB">
                {matrices.map((values, i) => (
                  <feColorMatrix key={i} type="matrix" values={values} />
                ))}
              </filter>
            )}
          </defs>
        </svg>
      )}

      {picture}

      {/* Sprocket holes. Drawn as a repeating gradient rather than as elements
          so the count follows the width instead of being fixed at a size that
          only looks right on one frame. */}
      {el.frameStyle === 'film' &&
        [0, 1].map((row) => (
          <div
            key={row}
            style={{
              position: 'absolute',
              left: `${pad * 0.35}mm`,
              right: `${pad * 0.35}mm`,
              [row ? 'bottom' : 'top']: `${pad * 0.22}mm`,
              height: `${pad * 0.42}mm`,
              background:
                'repeating-linear-gradient(90deg,' +
                ` #f4f4f4 0 ${pad * 0.5}mm, transparent ${pad * 0.5}mm ${pad * 1.1}mm)`,
            }}
          />
        ))}

      {/*
        Two strips, one over each top corner, each centred *on* its corner so it
        overhangs the picture evenly on both sides, which is what a piece of
        tape does. Offsetting by a fraction of the strip instead left them
        sitting beside the corners rather than across them.
      */}
      {el.frameStyle === 'tape' &&
        ([-1, 1] as const).map((dir) => {
          const tapeW = side * 0.26;
          const tapeH = side * 0.075;
          return (
            <div
              key={dir}
              style={{
                position: 'absolute',
                [dir < 0 ? 'left' : 'right']: `${round2(-tapeW / 2)}mm`,
                top: `${round2(-tapeH / 2)}mm`,
                width: `${round2(tapeW)}mm`,
                height: `${round2(tapeH)}mm`,
                background: 'rgba(236,228,206,.82)',
                boxShadow: '0 .3mm .6mm rgba(0,0,0,.12)',
                // Away from the corner on each side: anticlockwise on the left,
                // clockwise on the right, so the pair reads as symmetric.
                transform: `rotate(${dir * 45}deg)`,
              }}
            />
          );
        })}
    </div>
  );
}
