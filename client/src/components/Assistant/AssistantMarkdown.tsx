import { memo } from 'react';
import Markdown, { type Components } from 'react-markdown';
import { Link } from 'react-router';
import remarkGfm from 'remark-gfm';

import { sanitizedMarkdownPlugins } from '../shared/markdownSanitize';

/**
 * An answer's text, as Markdown. The model writes it, and what the model reads
 * (trip notes, place descriptions, search results) can carry someone else's
 * words, so it renders like untrusted input: raw HTML is skipped and
 * sanitized, and nothing that loads on its own (an image is a tracking pixel
 * that leaks a request to any host) is drawn at all.
 *
 * A link shows where it goes: an outside one names its host beside the text
 * and opens in its own tab, a link into TREK stays in the app.
 */

const DISALLOWED = ['img', 'picture', 'source', 'video', 'audio', 'iframe', 'object', 'embed'];

function hostOf(href: string): string | null {
  try {
    return new URL(href).host || null;
  } catch {
    return null;
  }
}

const components: Components = {
  a: ({ href, children }) => {
    if (href?.startsWith('/') && !href.startsWith('//')) return <Link to={href}>{children}</Link>;
    const host = href ? hostOf(href) : null;
    const text = typeof children === 'string' ? children : null;
    return (
      <a href={href} target="_blank" rel="noopener noreferrer nofollow">
        {children}
        {host && text !== host && text !== href && <span className="text-content-muted"> ({host})</span>}
      </a>
    );
  },
};

function AssistantMarkdown({ text, writing = false }: { text: string; writing?: boolean }) {
  return (
    <div
      dir="auto"
      data-writing={writing || undefined}
      className="trek-assistant-md break-words text-body text-content"
    >
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={sanitizedMarkdownPlugins}
        disallowedElements={DISALLOWED}
        skipHtml
        components={components}
      >
        {text}
      </Markdown>
    </div>
  );
}

// An answer re-renders with every streamed word; a block whose text did not change keeps its parse.
export default memo(AssistantMarkdown);
