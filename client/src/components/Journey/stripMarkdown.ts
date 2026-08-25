/**
 * Strip markdown formatting to get plain text for previews.
 * Handles: bold, italic, headings, links, images, blockquotes, code, lists, hr.
 */
export function stripMarkdown(md: string): string {
  return md
    .replace(/^#{1,6}\s+/gm, '')           // headings
    // the alt text is a run that cannot contain "](", so it ends on the first one
    // instead of being retried against every later "](". Same matches, no backtracking
    .replace(/!\[(?:(?!\]\().)*\]\(.*?\)/g, '') // images
    .replace(/\[([^\]]*)\]\(.*?\)/g, '$1')  // links → text
    .replace(/(`{3}[\s\S]*?`{3})/g, '')     // code blocks
    .replace(/`([^`]+)`/g, '$1')            // inline code
    .replace(/\*\*(.+?)\*\*/g, '$1')        // bold **
    .replace(/__(.+?)__/g, '$1')            // bold __
    .replace(/\*(.+?)\*/g, '$1')            // italic *
    .replace(/_(.+?)_/g, '$1')              // italic _
    .replace(/~~(.+?)~~/g, '$1')            // strikethrough
    .replace(/^>\s?/gm, '')                 // blockquotes
    .replace(/^[-*+]\s+/gm, '')             // unordered lists
    .replace(/^\d+\.\s+/gm, '')             // ordered lists
    .replace(/^---+$/gm, '')                // horizontal rules
    .replace(/\n{2,}/g, ' ')               // collapse multiple newlines
    .replace(/\n/g, ' ')                    // remaining newlines → spaces
    .trim()
}
