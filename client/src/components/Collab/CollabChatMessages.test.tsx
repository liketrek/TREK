// FE-W5CCM-001 to FE-W5CCM-024
// ChatMessages is a pure presentational component — every piece of state arrives
// as a prop from useCollabChat, so the tests drive it directly instead of going
// through CollabChat (that path is covered in CollabChat.test.tsx).

vi.mock('./CollabChatLinkPreview', () => ({
  LinkPreview: ({ url, onLoad }: { url: string; onLoad?: () => void }) => (
    <button type="button" data-testid={`preview-${url}`} onClick={() => onLoad?.()}>
      preview
    </button>
  ),
}))

import { render, screen, fireEvent, waitFor } from '../../../tests/helpers/render'
import { ChatMessages } from './CollabChatMessages'

interface ChatMsg {
  id: number
  user_id: number
  username: string
  text: string
  created_at: string
  user_avatar?: string | null
  reply_text?: string | null
  reply_username?: string | null
  reply_to?: number | null
  reactions?: { emoji: string; count: number; users: { user_id: number; username: string }[] }[]
  _deleted?: boolean
}

const currentUser = { id: 1, username: 'me' }

function buildMsg(overrides: Partial<ChatMsg> = {}): ChatMsg {
  return {
    id: 1,
    user_id: 2,
    username: 'alice',
    text: 'hello',
    created_at: '2025-06-01T10:00:00.000Z',
    reactions: [],
    ...overrides,
  }
}

interface Handles {
  setHoveredId: ReturnType<typeof vi.fn>
  setReplyTo: ReturnType<typeof vi.fn>
  setReactMenu: ReturnType<typeof vi.fn>
  handleDelete: ReturnType<typeof vi.fn>
  handleReact: ReturnType<typeof vi.fn>
  handleLoadMore: ReturnType<typeof vi.fn>
  scrollToBottom: ReturnType<typeof vi.fn>
}

function renderMessages(
  messages: ChatMsg[],
  overrides: Record<string, unknown> = {},
): Handles {
  const handles: Handles = {
    setHoveredId: vi.fn(),
    setReplyTo: vi.fn(),
    setReactMenu: vi.fn(),
    handleDelete: vi.fn(),
    handleReact: vi.fn(),
    handleLoadMore: vi.fn(),
    scrollToBottom: vi.fn(),
  }
  const props = {
    currentUser,
    tripId: 1,
    t: (key: string) => key,
    is12h: false,
    canEdit: true,
    messages,
    loading: false,
    hasMore: false,
    loadingMore: false,
    hoveredId: null,
    deletingIds: new Set<number>(),
    scrollRef: { current: null },
    isAtBottom: { current: false },
    checkAtBottom: vi.fn(),
    isOwn: (m: ChatMsg) => String(m.user_id) === String(currentUser.id),
    isEmojiOnly: (text: string) => /^\p{Extended_Pictographic}$/u.test(text),
    ...handles,
    ...overrides,
  }
  render(<ChatMessages {...props} />)
  return handles
}

describe('ChatMessages', () => {
  it('FE-W5CCM-001: renders the empty state when there are no messages', () => {
    renderMessages([])
    expect(screen.getByText('collab.chat.empty')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('FE-W5CCM-002: the load-more button reports its loading state and calls back', () => {
    const { handleLoadMore } = renderMessages([buildMsg()], { hasMore: true })
    const btn = screen.getByRole('button', { name: 'collab.chat.loadMore' })
    fireEvent.click(btn)
    expect(handleLoadMore).toHaveBeenCalledTimes(1)
  })

  it('FE-W5CCM-003: the load-more button is disabled and shows an ellipsis while loading', () => {
    renderMessages([buildMsg()], { hasMore: true, loadingMore: true })
    const btn = screen.getByText('...').closest('button')
    expect(btn).toBeDisabled()
  })

  it('FE-W5CCM-004: a deleted message renders the placeholder line with its author', () => {
    renderMessages([buildMsg({ _deleted: true })])
    expect(screen.getByText(/collab\.chat\.deletedMessage/)).toBeInTheDocument()
    expect(screen.queryByText('hello')).not.toBeInTheDocument()
  })

  it('FE-W5CCM-005: the deleted placeholder falls back to English when the key is missing', () => {
    renderMessages([buildMsg({ _deleted: true })], {
      t: (key: string) => (key === 'collab.chat.deletedMessage' ? '' : key),
    })
    expect(screen.getByText(/deleted a message/)).toBeInTheDocument()
  })

  it('FE-W5CCM-006: a message not at the end of its group keeps the rounded tail', () => {
    renderMessages([
      buildMsg({ id: 1, user_id: 1, username: 'me', text: 'first' }),
      buildMsg({ id: 2, user_id: 1, username: 'me', text: 'second' }),
    ])
    const first = screen.getByText('first').closest('div[style]')!
    const last = screen.getByText('second').closest('div[style]')!
    expect(first.getAttribute('style')).toContain('border-radius: 18px 18px 18px 18px')
    expect(last.getAttribute('style')).toContain('border-radius: 18px 18px 4px 18px')
  })

  it('FE-W5CCM-007: the avatar image is rendered for a foreign author who has one', () => {
    renderMessages([buildMsg({ user_avatar: '/uploads/avatars/alice.png' })])
    const avatar = document.querySelector('img[src="/uploads/avatars/alice.png"]')
    expect(avatar).toBeInTheDocument()
  })

  it('FE-W5CCM-008: the avatar initial falls back to a question mark without a username', () => {
    renderMessages([buildMsg({ username: '' })])
    expect(screen.getByText('?')).toBeInTheDocument()
  })

  it('FE-W5CCM-009: hovering a bubble reports the hovered id and clears it on leave', () => {
    const { setHoveredId } = renderMessages([buildMsg({ id: 7 })])
    const bubble = screen.getByText('hello').closest('div[style="position: relative;"]')!
    fireEvent.mouseEnter(bubble)
    expect(setHoveredId).toHaveBeenCalledWith(7)
    fireEvent.mouseLeave(bubble)
    expect(setHoveredId).toHaveBeenLastCalledWith(null)
  })

  it('FE-W5CCM-010: the hover actions become visible for the hovered message only', () => {
    renderMessages(
      [buildMsg({ id: 1, text: 'one' }), buildMsg({ id: 2, text: 'two' })],
      { hoveredId: 1 },
    )
    const actions = screen.getAllByTitle('collab.chat.reply').map(b => b.parentElement!)
    expect(actions[0].getAttribute('style')).toContain('opacity: 1')
    expect(actions[1].getAttribute('style')).toContain('opacity: 0')
  })

  it('FE-W5CCM-011: right-clicking a bubble opens the reaction menu at the cursor', () => {
    const { setReactMenu } = renderMessages([buildMsg({ id: 9 })])
    const bubble = screen.getByText('hello').closest('div[style="position: relative;"]')!
    fireEvent.contextMenu(bubble, { clientX: 120, clientY: 240 })
    expect(setReactMenu).toHaveBeenCalledWith({ msgId: 9, x: 120, y: 240 })
  })

  it('FE-W5CCM-012: right-clicking does nothing without edit rights', () => {
    const { setReactMenu } = renderMessages([buildMsg()], { canEdit: false })
    const bubble = screen.getByText('hello').closest('div[style="position: relative;"]')!
    fireEvent.contextMenu(bubble, { clientX: 10, clientY: 20 })
    expect(setReactMenu).not.toHaveBeenCalled()
  })

  it('FE-W5CCM-013: a single tap only records the tap, a double tap opens the reaction menu', () => {
    const { setReactMenu } = renderMessages([buildMsg({ id: 4 })])
    const bubble = screen.getByText('hello').closest('div[style="position: relative;"]') as HTMLElement
    fireEvent.touchEnd(bubble, { changedTouches: [{ clientX: 5, clientY: 6 }] })
    expect(setReactMenu).not.toHaveBeenCalled()
    expect(bubble.dataset.lastTap).toBeTruthy()

    fireEvent.touchEnd(bubble, { changedTouches: [{ clientX: 33, clientY: 44 }] })
    expect(setReactMenu).toHaveBeenCalledWith({ msgId: 4, x: 33, y: 44 })
  })

  it('FE-W5CCM-014: a double tap without touch coordinates does not open the menu', () => {
    const { setReactMenu } = renderMessages([buildMsg()])
    const bubble = screen.getByText('hello').closest('div[style="position: relative;"]') as HTMLElement
    fireEvent.touchEnd(bubble, { changedTouches: [] })
    fireEvent.touchEnd(bubble, { changedTouches: [] })
    expect(setReactMenu).not.toHaveBeenCalled()
  })

  it('FE-W5CCM-015: a double tap is ignored without edit rights', () => {
    const { setReactMenu } = renderMessages([buildMsg()], { canEdit: false })
    const bubble = screen.getByText('hello').closest('div[style="position: relative;"]') as HTMLElement
    fireEvent.touchEnd(bubble, { changedTouches: [{ clientX: 1, clientY: 2 }] })
    fireEvent.touchEnd(bubble, { changedTouches: [{ clientX: 1, clientY: 2 }] })
    expect(setReactMenu).not.toHaveBeenCalled()
  })

  it('FE-W5CCM-016: an own reply quote shows the quoted author and a truncated body', () => {
    const longQuote = 'q'.repeat(120)
    renderMessages([
      buildMsg({ user_id: 1, username: 'me', reply_username: 'alice', reply_text: longQuote }),
    ])
    expect(screen.getByText('alice')).toBeInTheDocument()
    expect(screen.getByText('q'.repeat(80))).toBeInTheDocument()
  })

  it('FE-W5CCM-017: a reply without stored quote data renders empty quote fields', () => {
    renderMessages([buildMsg({ reply_to: 55, reply_text: null, reply_username: null })])
    const quote = screen.getByText('hello').closest('div[style]')!.parentElement!
    // The quote block renders before the message text with both fields blank
    expect(quote.textContent).toBe('hello')
  })

  it('FE-W5CCM-018: a resolved link preview scrolls down when the view is pinned to the bottom', async () => {
    const { scrollToBottom } = renderMessages(
      [buildMsg({ text: 'look at https://example.com/a' })],
      { isAtBottom: { current: true } },
    )
    fireEvent.click(screen.getByTestId('preview-https://example.com/a'))
    await waitFor(() => expect(scrollToBottom).toHaveBeenCalledWith('smooth'))
  })

  it('FE-W5CCM-019: a resolved link preview does not scroll when the user scrolled up', async () => {
    const { scrollToBottom } = renderMessages(
      [buildMsg({ text: 'look at https://example.com/b' })],
      { isAtBottom: { current: false } },
    )
    fireEvent.click(screen.getByTestId('preview-https://example.com/b'))
    await new Promise(r => setTimeout(r, 80))
    expect(scrollToBottom).not.toHaveBeenCalled()
  })

  it('FE-W5CCM-020: the reply and delete buttons react to hover and fire their handlers', () => {
    const { setReplyTo, handleDelete } = renderMessages([
      buildMsg({ id: 3, user_id: 1, username: 'me', text: 'mine' }),
    ])
    const replyBtn = screen.getByTitle('collab.chat.reply')
    fireEvent.mouseEnter(replyBtn)
    expect(replyBtn.style.transform).toBe('scale(1.2)')
    fireEvent.mouseLeave(replyBtn)
    expect(replyBtn.style.transform).toBe('scale(1)')
    fireEvent.click(replyBtn)
    expect(setReplyTo).toHaveBeenCalledWith(expect.objectContaining({ id: 3 }))

    const deleteBtn = screen.getByTitle('common.delete')
    fireEvent.mouseEnter(deleteBtn)
    expect(deleteBtn.style.background).toBe('rgb(239, 68, 68)')
    fireEvent.mouseLeave(deleteBtn)
    expect(deleteBtn.style.background).toBe('var(--accent)')
    fireEvent.click(deleteBtn)
    expect(handleDelete).toHaveBeenCalledWith(3)
  })

  it('FE-W5CCM-021: clicking a reaction badge on an own message reacts again', () => {
    const { handleReact } = renderMessages([
      buildMsg({
        id: 8,
        user_id: 1,
        username: 'me',
        reactions: [{ emoji: '🔥', count: 2, users: [{ user_id: 1, username: 'me' }] }],
      }),
    ])
    fireEvent.click(screen.getByAltText('🔥').closest('button')!)
    expect(handleReact).toHaveBeenCalledWith(8, '🔥')
  })

  it('FE-W5CCM-022: reaction badges are inert without edit rights', () => {
    const { handleReact } = renderMessages(
      [
        buildMsg({
          reactions: [{ emoji: '👍', count: 1, users: [{ user_id: 2, username: 'alice' }] }],
        }),
      ],
      { canEdit: false },
    )
    fireEvent.click(screen.getByAltText('👍').closest('button')!)
    expect(handleReact).not.toHaveBeenCalled()
  })

  it('FE-W5CCM-023: a message being deleted collapses instead of disappearing instantly', () => {
    renderMessages([buildMsg({ id: 12 })], { deletingIds: new Set([12]) })
    const row = screen.getByText('hello').closest('div[style*="row"]')!
    expect(row.getAttribute('style')).toContain('opacity: 0')
  })

  it('FE-W5CCM-024: a single emoji message renders without a bubble background', () => {
    renderMessages([buildMsg({ text: '🎉' })])
    const big = screen.getByText('🎉')
    expect(big.getAttribute('style')).toContain('font-size: calc(40px')
  })
})
