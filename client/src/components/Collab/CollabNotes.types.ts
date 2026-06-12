export interface NoteFile {
  id: number
  filename: string
  original_name: string
  mime_type: string
  file_size?: number | null
  url?: string
}

export interface CollabNote {
  id: number
  trip_id: number
  title: string
  content: string
  category: string
  website: string | null
  pinned: boolean
  color: string | null
  username: string
  avatar_url: string | null
  avatar: string | null
  user_id: number
  created_at: string
  author?: { username: string; avatar: string | null }
  user?: { username: string; avatar: string | null }
  files?: NoteFile[]
  // Wire field: collabService embeds note files as `attachments` (with url).
  attachments?: NoteFile[]
}

export interface NoteAuthor {
  username: string
  avatar?: string | null
}
