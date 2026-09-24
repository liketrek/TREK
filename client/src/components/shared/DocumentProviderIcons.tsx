import React from 'react'

/**
 * The document providers' marks, redrawn as single-colour glyphs.
 *
 * `currentColor` rather than the brands' own palettes, and that is the point:
 * they sit in a row of lucide icons and in a list of addon toggles, where a
 * full-colour badge among line icons reads as the one thing that is switched
 * on. Following the text colour also means they invert with the theme without a
 * second asset: black on light, white on dark.
 *
 * Not in `public/brands/` beside AirTrail and Dawarich, because those are the
 * files each project ships, served unmodified. These are deliberately modified:
 * a recoloured logo is a different logo, and the trade is made knowingly here
 * for legibility in a monochrome row.
 */

interface GlyphProps {
  size?: number
  className?: string
}

function frame(size: number, className: string | undefined) {
  return {
    width: className ? undefined : size,
    height: className ? undefined : size,
    className,
    viewBox: '0 0 512 512',
    fill: 'none' as const,
    xmlns: 'http://www.w3.org/2000/svg',
    style: { flexShrink: 0, display: 'block' as const },
    'aria-hidden': true,
  }
}

/** Paperless-ngx: the leaf, with the shoot curling out of its stem. */
export function PaperlessIcon({ size = 20, className }: GlyphProps): React.ReactElement {
  return (
    <svg {...frame(size, className)}>
      <path
        d="M470 18c-38 62-104 104-179 149-63 38-119 77-146 135-25 55-17 119 8 174l-49 76"
        stroke="currentColor"
        strokeWidth="46"
        strokeLinecap="round"
      />
      <path
        d="M470 18c14 96 2 195-45 273-46 76-124 129-217 146-25-55-33-119-8-174 27-58 83-97 146-135 45-27 88-54 124-86z"
        fill="currentColor"
      />
      <path
        d="M52 214c-24 47-30 106-10 158 15 39 44 70 79 90"
        stroke="currentColor"
        strokeWidth="44"
        strokeLinecap="round"
      />
      <path
        d="M52 214c33 36 66 76 82 122 12 35 12 73-3 106"
        stroke="currentColor"
        strokeWidth="30"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Papra: a sheet with a folded corner and its lines of text. */
export function PapraIcon({ size = 20, className }: GlyphProps): React.ReactElement {
  return (
    <svg {...frame(size, className)}>
      <path
        d="M104 24h164l140 140v264a56 56 0 0 1-56 56H104a56 56 0 0 1-56-56V80a56 56 0 0 1 56-56z"
        stroke="currentColor"
        strokeWidth="56"
        strokeLinejoin="round"
      />
      <path
        d="M268 24v112a28 28 0 0 0 28 28h112"
        stroke="currentColor"
        strokeWidth="56"
        strokeLinejoin="round"
      />
      <path d="M140 216h32" stroke="currentColor" strokeWidth="56" strokeLinecap="round" />
      <path d="M140 330h216" stroke="currentColor" strokeWidth="56" strokeLinecap="round" />
      <path d="M140 442h216" stroke="currentColor" strokeWidth="56" strokeLinecap="round" />
    </svg>
  )
}

/** Nextcloud: the three rings. */
export function NextcloudIcon({ size = 20, className }: GlyphProps): React.ReactElement {
  return (
    <svg {...frame(size, className)}>
      <circle cx="256" cy="256" r="97" stroke="currentColor" strokeWidth="42" />
      <circle cx="74" cy="256" r="56" stroke="currentColor" strokeWidth="38" />
      <circle cx="438" cy="256" r="56" stroke="currentColor" strokeWidth="38" />
    </svg>
  )
}

/** OpenCloud: the open hexagon with the junction inside it. */
export function OpenCloudIcon({ size = 20, className }: GlyphProps): React.ReactElement {
  return (
    <svg {...frame(size, className)}>
      <path d="M26 128 256 8l230 120v72L256 80 26 200z" fill="currentColor" />
      <path d="M26 384 256 504l230-120v-72L256 432 26 312z" fill="currentColor" />
      <path
        d="M140 212v32l100 58v100l16 10 16-10V302l100-58v-32l-16-10-100 58-100-58z"
        fill="currentColor"
      />
    </svg>
  )
}

/** Synology Drive: the wordmark's own glyph, as the addon list already draws it. */
export function SynologyDriveIcon({ size = 20, className }: GlyphProps): React.ReactElement {
  return (
    <svg
      width={className ? undefined : size}
      height={className ? undefined : size}
      className={className}
      viewBox="0 0 24 24"
      style={{ flexShrink: 0, display: 'block' }}
      aria-hidden
    >
      <path d="M17.895 11.927a3.196 3.196 0 0 1 .394-1.53l-.008.017a2.677 2.677 0 0 1 1.075-1.108l.014-.007a3.181 3.181 0 0 1 1.523-.382h.05-.003q1.346 0 2.2.871.854.871.86 2.203c0 .895-.29 1.635-.867 2.226s-1.306.886-2.183.886c-.566 0-1.1-.137-1.571-.379l.019.009a2.535 2.535 0 0 1-1.115-1.067l-.007-.013q-.38-.708-.381-1.726zm1.593.083c0 .591.138 1.043.42 1.349a1.365 1.365 0 0 0 2.066.002l.001-.002c.275-.307.413-.764.413-1.357s-.138-1.033-.413-1.342a1.371 1.371 0 0 0-2.066-.001l-.001.002c-.281.306-.42.758-.42 1.345zm-1.602 2.941H16.33v-3.015c0-.635-.032-1.044-.101-1.234a.876.876 0 0 0-.328-.435l-.003-.002a.938.938 0 0 0-.521-.156h-.027.001-.012c-.27 0-.521.084-.727.228l.004-.003a1.115 1.115 0 0 0-.444.576l-.002.008c-.083.248-.121.696-.121 1.359v2.673H12.5V9.027h1.439v.867c.518-.656 1.167-.98 1.952-.98h.021c.335 0 .655.067.946.189l-.016-.006c.261.105.48.268.648.475l.002.003c.141.185.247.404.304.643l.002.012c.057.278.089.597.089.924l-.002.135v-.007zM6.413 9.028h1.654l1.412 4.204 1.376-4.204h1.611l-2.067 5.693-.38 1.038a4.158 4.158 0 0 1-.4.807l.01-.017a1.637 1.637 0 0 1-.422.443l-.005.003c-.17.113-.367.203-.578.26l-.014.003c-.232.064-.499.1-.774.1h-.025.001a4.13 4.13 0 0 1-.911-.105l.028.005-.129-1.229c.198.046.426.074.659.077h.002c.36 0 .628-.106.8-.318a2.27 2.27 0 0 0 .395-.807l.004-.016zM0 12.29l1.592-.149q.147.802.586 1.181.439.379 1.192.375c.528 0 .927-.113 1.197-.335.27-.222.4-.486.4-.782v-.024a.751.751 0 0 0-.167-.474l.001.001c-.113-.132-.309-.252-.59-.347-.193-.074-.631-.191-1.312-.365-.882-.216-1.496-.486-1.85-.804A2.147 2.147 0 0 1 .3 8.936v-.019V8.908c0-.431.132-.831.358-1.163l-.005.007a2.226 2.226 0 0 1 1.003-.826l.015-.005c.442-.184.973-.281 1.602-.281q1.529 0 2.304.676c.516.457.785 1.057.811 1.809l-1.649.055c-.073-.413-.219-.714-.452-.899-.233-.185-.579-.276-1.034-.276-.476 0-.85.098-1.118.298a.59.59 0 0 0-.261.49v.011-.001.002c0 .201.095.379.242.493l.001.001c.205.179.709.36 1.507.546.798.186 1.388.387 1.769.59.374.196.678.48.893.825l.006.01c.214.345.326.786.326 1.305 0 .489-.146.944-.396 1.325l.006-.009c-.264.408-.64.724-1.084.908l-.016.006c-.475.194-1.065.298-1.772.298-1.029 0-1.819-.241-2.373-.722-.554-.481-.879-1.177-.986-2.091z" fill="currentColor" />
    </svg>
  )
}

/** Keyed by the provider ids in `document_providers`. */
export const DOCUMENT_PROVIDER_ICONS: Record<string, React.ComponentType<GlyphProps>> = {
  paperless: PaperlessIcon,
  papra: PapraIcon,
  nextcloud: NextcloudIcon,
  opencloud: OpenCloudIcon,
  synologydrive: SynologyDriveIcon,
}
