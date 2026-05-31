export interface ChatReaction {
  emoji: string
  count: number
  users: { id: number; username: string }[]
}

export interface ChatMessage {
  id: number
  trip_id: number
  user_id: number
  text: string
  reply_to_id: number | null
  reactions: ChatReaction[]
  created_at: string
  user?: { username: string; avatar_url: string | null }
  reply_to?: ChatMessage | null
}
