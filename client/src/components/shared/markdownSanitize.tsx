import type { Components, Options } from 'react-markdown'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'

type HastNode = { type: string; children?: HastNode[] }

/**
 * react-markdown never builds an element out of raw HTML, it shows the markup
 * verbatim instead. It does that after the rehype plugins ran, though, so the
 * sanitizer gets the raw nodes first and drops them without a trace: a note
 * reading "Zimmernummer <TBD>" loses the placeholder on screen while the stored
 * text still has it (#2177). Turning raw into text up front keeps it readable
 * and still yields no element.
 */
function rehypeRawAsText() {
  return (tree: HastNode) => {
    const walk = (node: HastNode) => {
      if (node.type === 'raw') node.type = 'text'
      for (const child of node.children || []) walk(child)
    }
    walk(tree)
  }
}

// remark-gfm already writes footnote ids with the `user-content-` prefix, and
// the hrefs pointing at them carry it too. Clobbering them a second time only
// makes target and reference disagree.
const schema = { ...defaultSchema, clobberPrefix: '' }

export const sanitizedMarkdownPlugins: NonNullable<Options['rehypePlugins']> = [
  rehypeRawAsText,
  [rehypeSanitize, schema],
]

/**
 * Links as in markdownLinkComponents (#1629): own tab plus `rel` protection.
 * The exception is a footnote or heading link, which points inside the text
 * that is already on screen, so opening a tab for it would only reload the trip
 * somewhere else.
 */
export const sanitizedMarkdownComponents: Components = {
  a: ({ children, href, ...rest }) =>
    href?.startsWith('#') ? (
      <a {...rest} href={href}>
        {children}
      </a>
    ) : (
      <a {...rest} href={href} target="_blank" rel="noopener noreferrer nofollow">
        {children}
      </a>
    ),
}
