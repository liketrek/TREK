// Cycling color palette — works in light & dark mode
export const KAT_COLORS = [
  '#3b82f6', // blue
  '#a855f7', // purple
  '#ec4899', // pink
  '#22c55e', // green
  '#f97316', // orange
  '#06b6d4', // cyan
  '#ef4444', // red
  '#eab308', // yellow
  '#8b5cf6', // violet
  '#14b8a6', // teal
]

export const BAG_COLORS = ['#6366f1', '#ec4899', '#f97316', '#10b981', '#06b6d4', '#8b5cf6', '#ef4444', '#f59e0b', '#3b82f6', '#84cc16', '#d946ef', '#14b8a6', '#f43f5e', '#a855f7', '#eab308', '#64748b']

// A category's first item is seeded with this sentinel because the server
// rejects empty names. Treat it as a placeholder in the UI.
export const PACKING_PLACEHOLDER_NAME = '...'

/** What the import's file picker offers: CSV rows, plain text, or a Markdown list (#875). */
export const PACKING_IMPORT_ACCEPT = '.csv,.txt,.md,.markdown,text/markdown'
