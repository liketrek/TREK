import { createMarkdownHtml } from '../shared/markdownHtml';

/**
 * A place's description and notes are markdown in the app, so the export
 * renders them the same way instead of printing the raw syntax (#2692): one
 * info row per text, the HTML from the app's own sanitized pipeline.
 */
export function createPdfMarkdown(): { row: (text: string) => string; dispose: () => void } {
  const markdown = createMarkdownHtml();
  return {
    row: (text) =>
      `<div class="info-row"><span class="info-spacer"></span><div class="info-text muted md">${markdown.html(text)}</div></div>`,
    dispose: markdown.dispose,
  };
}

/** The markdown's own spacing, lists, tables and links at the export's small size. */
export const PDF_MARKDOWN_CSS = `
  .info-text.md { min-width: 0; overflow-wrap: anywhere; }
  .md > :first-child { margin-top: 0; }
  .md > :last-child { margin-bottom: 0; }
  .md p, .md ul, .md ol, .md table, .md blockquote, .md pre { margin: 0 0 4px; }
  .md ul, .md ol { padding-inline-start: 14px; }
  .md h1, .md h2, .md h3, .md h4, .md h5, .md h6 { font-size: 1.1em; font-weight: 700; margin: 4px 0 2px; }
  .md table { border-collapse: collapse; }
  .md th, .md td { border: 1px solid #e2e8f0; padding: 2px 5px; text-align: start; }
  .md code { font-family: ui-monospace, monospace; font-size: 8.5px; }
  .md a { color: inherit; text-decoration: underline; }
  .md blockquote { border-inline-start: 2px solid #e2e8f0; padding-inline-start: 6px; }
`;
