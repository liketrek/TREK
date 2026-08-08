// FE-W4CCS-001 to FE-W4CCS-016
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../../../tests/helpers/render'
import type { ChatReaction } from './CollabChat.types'
import type { NoteAuthor } from './CollabNotes.types'

const linkPreview = vi.fn(async (_tripId: number, _url: string) => ({ title: 'TREK', image: null as string | null }))
vi.mock('../../api/client', () => ({ collabApi: { linkPreview: (tripId: number, url: string) => linkPreview(tripId, url) } }))

import { TwemojiImg } from './CollabChatTwemojiImg'
import { ReactionBadge } from './CollabChatReactionBadge'
import { UserAvatar } from './CollabNotesUserAvatar'
import { WebsiteThumbnail } from './CollabNotesWebsiteThumbnail'

function reaction(overrides: Partial<ChatReaction> = {}): ChatReaction {
  return { emoji: '👍', count: 1, users: [{ id: 1, username: 'ada' }], ...overrides } as unknown as ChatReaction
}

beforeEach(() => {
  linkPreview.mockReset()
  linkPreview.mockResolvedValue({ title: 'TREK', image: null })
})

describe('TwemojiImg', () => {
  it('FE-W4CCS-001: renders the twemoji asset for the codepoint', () => {
    const { container } = render(<TwemojiImg emoji="👍" />)
    const img = container.querySelector('img') as HTMLImageElement

    expect(img).toHaveAttribute('alt', '👍')
    expect(img.getAttribute('src')).toContain('/1f44d.png')
    expect(img).toHaveStyle({ width: '20px', height: '20px' })
  })

  it('FE-W4CCS-002: strips the variation selector from a multi-codepoint emoji', () => {
    const { container } = render(<TwemojiImg emoji="❤️" size={16} />)

    expect((container.querySelector('img') as HTMLImageElement).getAttribute('src')).toContain('/2764.png')
  })

  it('FE-W4CCS-003: falls back to the plain glyph when the asset fails to load', () => {
    const { container } = render(<TwemojiImg emoji="👍" size={24} />)

    fireEvent.error(container.querySelector('img')!)

    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByText('👍')).toHaveStyle({ fontSize: '24px' })
  })
})

describe('ReactionBadge', () => {
  it('FE-W4CCS-004: hides the counter for a single reactor', () => {
    render(<ReactionBadge reaction={reaction()} currentUserId={1} onReact={() => {}} />)

    expect(screen.queryByText('1')).toBeNull()
  })

  it('FE-W4CCS-005: shows the counter once more than one person reacted', () => {
    render(
      <ReactionBadge
        reaction={reaction({ count: 3, users: [{ id: 1, username: 'ada' }, { id: 2, username: 'bob' }] } as Partial<ChatReaction>)}
        currentUserId={1}
        onReact={() => {}}
      />,
    )

    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('FE-W4CCS-006: clicking toggles the own reaction', () => {
    const onReact = vi.fn()
    render(<ReactionBadge reaction={reaction()} currentUserId={1} onReact={onReact} />)

    fireEvent.click(screen.getByRole('button'))

    expect(onReact).toHaveBeenCalledOnce()
  })

  it('FE-W4CCS-007: hovering portals the list of reactors and leaving removes it', () => {
    render(
      <ReactionBadge
        reaction={reaction({ users: [{ id: 1, username: 'ada' }, { id: 2, username: 'bob' }] } as Partial<ChatReaction>)}
        currentUserId={1}
        onReact={() => {}}
      />,
    )
    const badge = screen.getByRole('button')

    fireEvent.mouseEnter(badge)
    expect(screen.getByText('ada, bob')).toBeInTheDocument()

    fireEvent.mouseLeave(badge)
    expect(screen.queryByText('ada, bob')).toBeNull()
  })

  it('FE-W4CCS-008: shows no tooltip when nobody is named', () => {
    render(<ReactionBadge reaction={reaction({ users: [] } as Partial<ChatReaction>)} currentUserId={1} onReact={() => {}} />)

    fireEvent.mouseEnter(screen.getByRole('button'))

    expect(document.body.querySelectorAll('[style*="translate(-50%, -100%)"]')).toHaveLength(0)
  })
})

describe('UserAvatar', () => {
  it('FE-W4CCS-009: renders nothing without a user', () => {
    const { container } = render(<UserAvatar user={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('FE-W4CCS-010: renders the avatar image when one is set', () => {
    const { container } = render(<UserAvatar user={{ username: 'ada', avatar: '/uploads/avatars/ada.png' } as NoteAuthor} size={20} />)
    const img = container.querySelector('img') as HTMLImageElement

    expect(img).toHaveAttribute('src', '/uploads/avatars/ada.png')
    expect(img).toHaveAttribute('alt', 'ada')
    expect(img).toHaveStyle({ width: '20px' })
  })

  it('FE-W4CCS-011: falls back to the first letter, and to ? without a name', () => {
    const { unmount } = render(<UserAvatar user={{ username: 'ada', avatar: null } as NoteAuthor} />)
    expect(screen.getByText('a')).toBeInTheDocument()
    unmount()

    render(<UserAvatar user={{ username: '', avatar: null } as NoteAuthor} />)
    expect(screen.getByText('?')).toBeInTheDocument()
  })
})

describe('WebsiteThumbnail', () => {
  it('FE-W4CCS-012: shows the domain until an OG image arrives', async () => {
    render(<WebsiteThumbnail url="https://www.liketrek.com/docs" tripId={4} color="#000" />)

    expect(screen.getByText('liketrek.com')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('link')).toHaveAttribute('title', 'TREK'))
    expect(linkPreview).toHaveBeenCalledWith(4, 'https://www.liketrek.com/docs')
  })

  it('FE-W4CCS-013: renders the OG image once the preview resolves', async () => {
    linkPreview.mockResolvedValue({ title: 'Docs', image: 'https://cdn.example/og.png' })
    const { container } = render(<WebsiteThumbnail url="https://example.com/a" tripId={4} color="#000" />)

    await waitFor(() => expect(container.querySelector('img')).not.toBeNull())
    expect(container.querySelector('img')).toHaveAttribute('src', 'https://cdn.example/og.png')

    // A broken OG image falls back to the domain chip.
    fireEvent.error(container.querySelector('img')!)
    expect(screen.getByText('example.com')).toBeInTheDocument()
  })

  it('FE-W4CCS-014: falls back to a link label for an unparseable url and a failing preview', async () => {
    linkPreview.mockRejectedValue(new Error('blocked'))
    render(<WebsiteThumbnail url="not a url" tripId={4} color="#000" />)

    expect(screen.getByText('link')).toBeInTheDocument()
    await waitFor(() => expect(linkPreview).toHaveBeenCalled())
    expect(screen.getByRole('link')).toHaveAttribute('title', 'not a url')
  })

  it('FE-W4CCS-015: caches per trip, because the preview endpoint is trip-scoped', async () => {
    linkPreview.mockResolvedValue({ title: 'Trip 4', image: null })
    const shared = 'https://example.com/shared'
    const first = render(<WebsiteThumbnail url={shared} tripId={4} color="#000" />)
    await waitFor(() => expect(screen.getByRole('link')).toHaveAttribute('title', 'Trip 4'))
    first.unmount()

    linkPreview.mockResolvedValue({ title: 'Trip 9', image: null })
    render(<WebsiteThumbnail url={shared} tripId={9} color="#000" />)

    await waitFor(() => expect(screen.getByRole('link')).toHaveAttribute('title', 'Trip 9'))
    expect(linkPreview).toHaveBeenCalledTimes(2)
    expect(linkPreview).toHaveBeenLastCalledWith(9, shared)
  })

  it('FE-W4CCS-016: a broken OG image does not poison the next url', async () => {
    linkPreview.mockResolvedValue({ title: 'A', image: 'https://cdn.example/a.png' })
    const { container, rerender } = render(<WebsiteThumbnail url="https://a.example/x" tripId={4} color="#000" />)
    await waitFor(() => expect(container.querySelector('img')).not.toBeNull())
    fireEvent.error(container.querySelector('img')!)
    expect(container.querySelector('img')).toBeNull()

    linkPreview.mockResolvedValue({ title: 'B', image: 'https://cdn.example/b.png' })
    rerender(<WebsiteThumbnail url="https://b.example/y" tripId={4} color="#000" />)

    await waitFor(() => expect(container.querySelector('img')).not.toBeNull())
    expect(container.querySelector('img')).toHaveAttribute('src', 'https://cdn.example/b.png')
  })
})
