import Markdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { sanitizedMarkdownComponents, sanitizedMarkdownPlugins } from './markdownSanitize';

/**
 * Text a user wrote in markdown (a place's description, its notes), rendered
 * the way the planner shows it: GitHub flavour, line breaks kept, raw HTML
 * shown as text, the rest sanitized, links in a new tab without an opener.
 * Safe for pages strangers see, like a shared trip (#2692).
 */
export function SafeMarkdown({ children }: { children: string }) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm, remarkBreaks]}
      rehypePlugins={sanitizedMarkdownPlugins}
      components={sanitizedMarkdownComponents}
    >
      {children}
    </Markdown>
  );
}
