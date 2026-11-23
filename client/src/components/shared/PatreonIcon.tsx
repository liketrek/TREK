import React from 'react';

/** Patreon's mark (simple-icons), drawn in the current text colour. */
export const PATREON_PATH =
  'M22.957 7.21c-.004-3.064-2.391-5.576-5.191-6.482-3.478-1.125-8.064-.962-11.384.604C2.357 3.231 1.093 7.391 1.046 11.54c-.039 3.411.302 12.396 5.369 12.46 3.765.047 4.326-4.804 6.068-7.141 1.24-1.662 2.836-2.132 4.801-2.618 3.376-.836 5.678-3.501 5.673-7.031Z';

/** Where TREK takes monthly support. */
export const PATREON_URL = 'https://www.patreon.com/cw/mauriceboe';

/** Patreon's own coral, for the icon on the support tiles. */
export const PATREON_COLOR = '#ff424d';

export default function PatreonIcon({
  size = 18,
  className,
}: {
  size?: number;
  className?: string;
}): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d={PATREON_PATH} />
    </svg>
  );
}
