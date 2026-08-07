import type { ReactElement, ReactNode } from 'react'

/**
 * Static-markup serializer for the lucide icons the map and PDF code turn into
 * SVG strings.
 *
 * It replaces renderToStaticMarkup, whose Fizz runtime is ~190 kB raw / ~57 kB
 * gzip of a chunk that three lazy route chunks share — including the Leaflet
 * renderer, which is the default. For output that is always a single <svg> with
 * a flat list of shape children, that is a poor trade.
 *
 * Deliberately generic over React elements rather than over lucide's icon
 * tables: `iconNode` is closed over inside createLucideIcon and not exported, so
 * calling the forwardRef render function is what keeps this working across
 * lucide upgrades. iconMarkup.parity.test.ts diffs the output against real Fizz
 * for every exported icon, so drift fails the suite instead of shipping.
 *
 * Byte-compatibility notes, all verified against react-dom 19.2.6:
 *  - React escapes & " ' < > the same way in attribute values and in text, so
 *    one escape function covers both.
 *  - Only the props in ATTRIBUTE_NAMES are renamed. Everything else keeps its
 *    literal name, which is what preserves the camelCase SVG attributes —
 *    viewBox has to stay viewBox and must NOT become view-box.
 *  - Fizz emits <path …></path>, never a self-closing tag. So do we.
 */

const FORWARD_REF = Symbol.for('react.forward_ref')

/** React's DOM property -> attribute renames, limited to what an SVG carries. */
const ATTRIBUTE_NAMES: Record<string, string> = {
  className: 'class',
  htmlFor: 'for',
  strokeWidth: 'stroke-width',
  strokeLinecap: 'stroke-linecap',
  strokeLinejoin: 'stroke-linejoin',
  strokeDasharray: 'stroke-dasharray',
  strokeDashoffset: 'stroke-dashoffset',
  strokeOpacity: 'stroke-opacity',
  strokeMiterlimit: 'stroke-miterlimit',
  fillOpacity: 'fill-opacity',
  fillRule: 'fill-rule',
  clipRule: 'clip-rule',
  clipPath: 'clip-path',
  vectorEffect: 'vector-effect',
  paintOrder: 'paint-order',
  shapeRendering: 'shape-rendering',
  stopColor: 'stop-color',
  stopOpacity: 'stop-opacity',
}

const SKIP_PROPS = new Set(['children', 'key', 'ref', 'dangerouslySetInnerHTML'])

type ElementProps = Record<string, unknown> & { children?: ReactNode }
type ForwardRefComponent = { $$typeof: symbol; render: (props: ElementProps, ref: null) => ReactNode }

function escape(value: string | number): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function serializeProps(props: ElementProps): string {
  let out = ''
  for (const name of Object.keys(props)) {
    if (SKIP_PROPS.has(name)) continue
    const value = props[name]
    if (value === undefined || value === null || value === false) continue
    if (typeof value === 'function' || typeof value === 'symbol' || typeof value === 'object') continue
    out += ` ${ATTRIBUTE_NAMES[name] ?? name}="${escape(value === true ? '' : (value as string | number))}"`
  }
  return out
}

function serialize(node: unknown): string {
  if (node === null || node === undefined || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return escape(node)
  if (Array.isArray(node)) return node.map(serialize).join('')

  const element = node as ReactElement<ElementProps>
  const type = element.type as unknown
  const props = (element.props ?? {}) as ElementProps

  if (typeof type === 'string') {
    return `<${type}${serializeProps(props)}>${serialize(props.children)}</${type}>`
  }
  if (typeof type === 'object' && type !== null && (type as ForwardRefComponent).$$typeof === FORWARD_REF) {
    return serialize((type as ForwardRefComponent).render(props, null))
  }
  if (typeof type === 'function') {
    return serialize((type as (p: ElementProps) => ReactNode)(props))
  }
  throw new Error(`renderIconMarkup: unsupported element type ${String(type)}`)
}

/**
 * Empty string when the element cannot be rendered: a throwing icon component
 * should cost its own glyph, not the marker it sits in. That matches how the
 * call sites already guarded renderToStaticMarkup.
 */
export function renderIconMarkup(element: ReactElement): string {
  try {
    return serialize(element)
  } catch {
    return ''
  }
}
