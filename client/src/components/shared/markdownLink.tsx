import type { Components } from 'react-markdown'

/**
 * How a link inside a note behaves (#1629).
 *
 * react-markdown renders a bare `<a href>`, which navigates the SPA away from
 * the trip: the planner state, the open day, the map viewport are all gone, and
 * the way back is the browser's back button. A note is a place to park a
 * booking confirmation or an opening-hours page, so the link opens in its own
 * tab instead.
 *
 * `rel` is not decoration. Without `noopener` the opened page gets a handle on
 * this one through `window.opener` and can navigate it somewhere else, and a
 * note is user-supplied content that other trip members read.
 */
export const markdownLinkComponents: Components = {
  a: ({ children, href, ...rest }) => (
    <a {...rest} href={href} target="_blank" rel="noopener noreferrer nofollow">
      {children}
    </a>
  ),
}
