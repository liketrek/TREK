import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import MCollabChat from '../../../../src/mobile/screens/trip/tabs/MCollabChat'
import type { ChatMessage } from '../../../../src/mobile/screens/trip/tabs/collabModel'
import type { TripPlanner } from '../../../../src/mobile/screens/trip/MTripShell'
import { addListener, removeListener } from '../../../../src/api/websocket'
import { useAuthStore } from '../../../../src/store/authStore'
import { buildPlanner } from '../../../helpers/mobileTrip'
import { buildUser } from '../../../helpers/factories'
import { resetAllStores, seedStore } from '../../../helpers/store'
import { server } from '../../../helpers/msw/server'
import { act, fireEvent, render, screen, waitFor } from '../../../helpers/render'

// FE-MOB-CCHAT-001 to FE-MOB-CCHAT-031

const ME = 7

function chatMsg(id: number, over: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id,
    trip_id: 1,
    user_id: 2,
    text: `Message ${id}`,
    reply_to: null,
    username: 'Alice',
    avatar: null,
    avatar_url: null,
    created_at: new Date().toISOString(),
    reactions: [],
    ...over,
  }
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString()
}

/** Records every GET so tests can assert the `before` cursor of load-more. */
let beforeCursors: (string | null)[] = []
let sentBodies: Record<string, unknown>[] = []

interface ServeOptions {
  older?: ChatMessage[]
  olderFails?: boolean
  initialFails?: boolean
}

function serveMessages(initial: ChatMessage[], opts: ServeOptions = {}) {
  server.use(
    http.get('/api/trips/:tripId/collab/messages', ({ request }) => {
      const before = new URL(request.url).searchParams.get('before')
      beforeCursors.push(before)
      if (before) {
        if (opts.olderFails) return HttpResponse.json({ error: 'boom' }, { status: 500 })
        return HttpResponse.json({ messages: opts.older || [] })
      }
      if (opts.initialFails) return HttpResponse.json({ error: 'boom' }, { status: 500 })
      return HttpResponse.json({ messages: initial })
    }),
  )
}

function serveSend(reply: (body: Record<string, unknown>) => ChatMessage, fails = false) {
  server.use(
    http.post('/api/trips/:tripId/collab/messages', async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>
      sentBodies.push(body)
      if (fails) return HttpResponse.json({ error: 'boom' }, { status: 500 })
      return HttpResponse.json({ message: reply(body) })
    }),
  )
}

async function renderChat(planner: TripPlanner = buildPlanner()) {
  const view = render(<MCollabChat planner={planner} />)
  await waitFor(() => expect(document.querySelector('.animate-spin')).toBeNull())
  return { ...view, planner }
}

/** The bubble button of the nth rendered (non-deleted) message. */
function bubble(index = 0): HTMLElement {
  return screen.getAllByRole('button', { name: 'collab.chat.messageOptions' })[index]
}

/** Two taps inside DOUBLE_TAP_MS — the popover gesture that needs no timers. */
function doubleTap(el: HTMLElement, x = 120, y = 300) {
  fireEvent.pointerDown(el, { clientX: x, clientY: y })
  fireEvent.pointerUp(el, { clientX: x, clientY: y })
  fireEvent.pointerDown(el, { clientX: x, clientY: y })
  fireEvent.pointerUp(el, { clientX: x, clientY: y })
}

describe('MCollabChat', () => {
  beforeEach(() => {
    resetAllStores()
    seedStore(useAuthStore, { user: buildUser({ id: ME, username: 'Mo' }) })
    beforeCursors = []
    sentBodies = []
    vi.mocked(addListener).mockClear()
    vi.mocked(removeListener).mockClear()
    // jsdom has neither scrollTo on elements nor real layout metrics.
    Element.prototype.scrollTo = vi.fn()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('FE-MOB-CCHAT-001: shows the spinner until the first page has landed', async () => {
    serveMessages([chatMsg(1)])
    render(<MCollabChat planner={buildPlanner()} />)
    expect(document.querySelector('.animate-spin')).not.toBeNull()
    expect(await screen.findByText('Message 1')).toBeInTheDocument()
  })

  it('FE-MOB-CCHAT-002: renders the mascot empty state when the trip has no messages', async () => {
    serveMessages([])
    await renderChat()
    expect(screen.getByText('collab.chat.empty')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'collab.chat.messageOptions' })).not.toBeInTheDocument()
  })

  it('FE-MOB-CCHAT-003: falls back to the empty state when the first page fails', async () => {
    serveMessages([], { initialFails: true })
    await renderChat()
    expect(screen.getByText('collab.chat.empty')).toBeInTheDocument()
  })

  it('FE-MOB-CCHAT-004: collapses consecutive messages of one sender into a single group', async () => {
    serveMessages([
      chatMsg(1, { text: 'First' }),
      chatMsg(2, { text: 'Second' }),
      chatMsg(3, { text: 'Mine', user_id: ME, username: 'Mo' }),
    ])
    await renderChat()
    // name + avatar initial collapse onto the first message of the group
    expect(screen.getAllByText('Alice')).toHaveLength(1)
    expect(screen.getAllByText('A')).toHaveLength(1)
    // one trailing timestamp per group (Alice, then me)
    expect(screen.getAllByText(/^\d{2}:\d{2}$/)).toHaveLength(2)
  })

  it('FE-MOB-CCHAT-005: separates days with today / yesterday markers', async () => {
    serveMessages([
      chatMsg(1, { created_at: daysAgo(1) }),
      chatMsg(2, { created_at: new Date().toISOString() }),
    ])
    await renderChat()
    expect(screen.getByText('collab.chat.yesterday')).toBeInTheDocument()
    expect(screen.getByText('collab.chat.today')).toBeInTheDocument()
  })

  it('FE-MOB-CCHAT-006: uses the sender avatar when there is one, the initial otherwise', async () => {
    serveMessages([
      chatMsg(1, { avatar_url: '/uploads/avatars/a.png' }),
      chatMsg(2, { user_id: 3, username: 'bob' }),
    ])
    const { container } = await renderChat()
    expect(container.querySelector('img[src="/uploads/avatars/a.png"]')).not.toBeNull()
    expect(screen.getByText('B')).toBeInTheDocument()
  })

  it('FE-MOB-CCHAT-007: renders an emoji-only message large and without a bubble', async () => {
    serveMessages([chatMsg(1, { text: '🎉' }), chatMsg(2, { text: 'plain' })])
    await renderChat()
    expect(screen.getByText('🎉')).toHaveClass('text-[2.5rem]')
    expect(screen.getByText('plain')).toHaveClass('whitespace-pre-wrap')
  })

  it('FE-MOB-CCHAT-008: shows the quoted message above a reply bubble', async () => {
    serveMessages([
      chatMsg(1, { text: 'Where do we meet?' }),
      chatMsg(2, { text: 'At the station', reply_to: 1, reply_text: 'Where do we meet?', reply_username: 'Alice' }),
    ])
    await renderChat()
    const quote = screen.getAllByText('Where do we meet?')
    expect(quote).toHaveLength(2)
  })

  it('FE-MOB-CCHAT-009: replaces a deleted message with the tombstone line', async () => {
    serveMessages([chatMsg(1, { text: 'oops', deleted: 1 })])
    await renderChat()
    expect(screen.queryByText('oops')).not.toBeInTheDocument()
    expect(screen.getByText(/Alice collab\.chat\.deletedMessage/)).toBeInTheDocument()
  })

  it('FE-MOB-CCHAT-010: honours the 12h time format setting', async () => {
    serveMessages([chatMsg(1)])
    await renderChat(buildPlanner({
      settings: { time_format: '12h' } as unknown as TripPlanner['settings'],
    }))
    expect(screen.getByText(/^\d{1,2}:\d{2} (AM|PM)$/)).toBeInTheDocument()
  })

  it('FE-MOB-CCHAT-011: shows reaction badges and re-sends the emoji when one is tapped', async () => {
    serveMessages([chatMsg(1, {
      reactions: [
        { emoji: '👍', count: 2, users: [{ user_id: 2, username: 'Alice' }, { user_id: ME, username: 'Mo' }] },
        { emoji: '🔥', count: 1, users: [{ user_id: 2, username: 'Alice' }] },
      ],
    })])
    let reacted = ''
    server.use(http.post('/api/trips/:tripId/collab/messages/:id/react', async ({ request }) => {
      reacted = String(((await request.json()) as { emoji: string }).emoji)
      return HttpResponse.json({ reactions: [{ emoji: '👍', count: 1, users: [{ user_id: 2, username: 'Alice' }] }] })
    }))
    await renderChat()
    // count is only spelled out above 1
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.queryByText('1')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('🔥'))
    await waitFor(() => expect(reacted).toBe('🔥'))
    await waitFor(() => expect(screen.queryByText('2')).not.toBeInTheDocument())
  })

  it('FE-MOB-CCHAT-012: a read-only member gets the notice instead of the composer', async () => {
    serveMessages([chatMsg(1, { reactions: [{ emoji: '👍', count: 1, users: [] }] })])
    let reactCalls = 0
    server.use(http.post('/api/trips/:tripId/collab/messages/:id/react', () => {
      reactCalls++
      return HttpResponse.json({ reactions: [] })
    }))
    await renderChat(buildPlanner({ can: (() => false) as TripPlanner['can'] }))

    expect(screen.getByText('collab.chat.readOnly')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('collab.chat.placeholder')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'collab.chat.messageOptions' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('👍'))
    await Promise.resolve()
    expect(reactCalls).toBe(0)
  })

  it('FE-MOB-CCHAT-013: sends the trimmed draft, appends the answer and clears the composer', async () => {
    serveMessages([])
    serveSend(body => chatMsg(42, { user_id: ME, username: 'Mo', text: String(body.text) }))
    await renderChat()

    const input = screen.getByPlaceholderText('collab.chat.placeholder')
    const send = screen.getByRole('button', { name: 'collab.chat.send' })
    expect(send).toBeDisabled()

    fireEvent.change(input, { target: { value: '  Landed safely  ' } })
    expect(send).toBeEnabled()
    fireEvent.click(send)

    expect(await screen.findByText('Landed safely')).toBeInTheDocument()
    expect(sentBodies).toEqual([{ text: 'Landed safely' }])
    expect(input).toHaveValue('')
  })

  it('FE-MOB-CCHAT-014: keeps the draft and toasts when sending fails', async () => {
    serveMessages([])
    serveSend(() => chatMsg(1), true)
    const { planner } = await renderChat()

    const input = screen.getByPlaceholderText('collab.chat.placeholder')
    fireEvent.change(input, { target: { value: 'no network' } })
    fireEvent.click(screen.getByRole('button', { name: 'collab.chat.send' }))

    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('common.error'))
    expect(input).toHaveValue('no network')
  })

  it('FE-MOB-CCHAT-015: auto-grows the composer and caps it at 100px', async () => {
    serveMessages([])
    await renderChat()
    const input = screen.getByPlaceholderText('collab.chat.placeholder') as HTMLTextAreaElement

    fireEvent.change(input, { target: { value: 'one line' } })
    expect(input.style.overflowY).toBe('hidden')

    Object.defineProperty(input, 'scrollHeight', { configurable: true, value: 340 })
    fireEvent.change(input, { target: { value: 'a\nvery\ntall\ndraft' } })
    expect(input.style.height).toBe('100px')
    expect(input.style.overflowY).toBe('auto')
  })

  it('FE-MOB-CCHAT-016: offers load-more on a full page and prepends the older ones', async () => {
    const page = Array.from({ length: 100 }, (_, i) => chatMsg(i + 1))
    serveMessages(page, { older: [chatMsg(900, { text: 'Ancient' }), chatMsg(901, { text: 'Old' })] })
    await renderChat()

    const more = screen.getByRole('button', { name: /collab\.chat\.loadMore/ })
    fireEvent.click(more)

    expect(await screen.findByText('Ancient')).toBeInTheDocument()
    expect(screen.getByText('Old')).toBeInTheDocument()
    expect(beforeCursors).toEqual([null, '1'])
    // a short page means there is nothing left to fetch
    await waitFor(() => expect(screen.queryByRole('button', { name: /collab\.chat\.loadMore/ })).not.toBeInTheDocument())
  })

  it('FE-MOB-CCHAT-017: hides load-more when the older page comes back empty', async () => {
    const page = Array.from({ length: 100 }, (_, i) => chatMsg(i + 1))
    serveMessages(page, { older: [] })
    await renderChat()

    fireEvent.click(screen.getByRole('button', { name: /collab\.chat\.loadMore/ }))
    await waitFor(() => expect(screen.queryByRole('button', { name: /collab\.chat\.loadMore/ })).not.toBeInTheDocument())
    expect(screen.getByText('Message 1')).toBeInTheDocument()
  })

  it('FE-MOB-CCHAT-018: toasts and keeps the button when the older page fails', async () => {
    const page = Array.from({ length: 100 }, (_, i) => chatMsg(i + 1))
    serveMessages(page, { olderFails: true })
    const { planner } = await renderChat()

    fireEvent.click(screen.getByRole('button', { name: /collab\.chat\.loadMore/ }))
    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('common.error'))
    expect(screen.getByRole('button', { name: /collab\.chat\.loadMore/ })).toBeInTheDocument()
  })

  it('FE-MOB-CCHAT-019: a double tap opens the actions popover and a reaction from it lands', async () => {
    serveMessages([chatMsg(1)])
    server.use(http.post('/api/trips/:tripId/collab/messages/:id/react', () =>
      HttpResponse.json({ reactions: [{ emoji: '❤️', count: 1, users: [{ user_id: ME, username: 'Mo' }] }] })))
    await renderChat()

    doubleTap(bubble())
    expect(screen.getByRole('button', { name: 'collab.chat.reply' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '❤️' }))
    await waitFor(() => expect(screen.queryByRole('button', { name: 'collab.chat.reply' })).not.toBeInTheDocument())
    expect(await screen.findByText('❤️')).toBeInTheDocument()
  })

  it('FE-MOB-CCHAT-020: a long press opens the popover, a drag cancels it', async () => {
    serveMessages([chatMsg(1)])
    await renderChat()
    vi.useFakeTimers()

    fireEvent.pointerDown(bubble(), { clientX: 40, clientY: 90 })
    fireEvent.pointerMove(bubble(), { clientX: 90, clientY: 90 })
    act(() => { vi.advanceTimersByTime(600) })
    expect(screen.queryByRole('button', { name: 'collab.chat.reply' })).not.toBeInTheDocument()

    fireEvent.pointerDown(bubble(), { clientX: 40, clientY: 90 })
    fireEvent.pointerMove(bubble(), { clientX: 42, clientY: 92 })
    act(() => { vi.advanceTimersByTime(600) })
    expect(screen.getByRole('button', { name: 'collab.chat.reply' })).toBeInTheDocument()

    // the release after a fired long press must not toggle it again
    fireEvent.pointerUp(bubble(), { clientX: 40, clientY: 90 })
    expect(screen.getByRole('button', { name: 'collab.chat.reply' })).toBeInTheDocument()
  })

  it('FE-MOB-CCHAT-021: a pointer cancel aborts the pending long press', async () => {
    serveMessages([chatMsg(1)])
    await renderChat()
    vi.useFakeTimers()

    fireEvent.pointerDown(bubble(), { clientX: 40, clientY: 90 })
    fireEvent.pointerCancel(bubble())
    act(() => { vi.advanceTimersByTime(600) })
    expect(screen.queryByRole('button', { name: 'collab.chat.reply' })).not.toBeInTheDocument()
  })

  it('FE-MOB-CCHAT-022: replying quotes the message and sends reply_to, then clears the banner', async () => {
    serveMessages([chatMsg(1, { text: 'Bring sunscreen' })])
    serveSend(body => chatMsg(50, { user_id: ME, username: 'Mo', text: String(body.text) }))
    await renderChat()

    doubleTap(bubble())
    fireEvent.click(screen.getByRole('button', { name: 'collab.chat.reply' }))

    // banner shows who is quoted
    expect(screen.getAllByText('Alice')).toHaveLength(2)
    fireEvent.change(screen.getByPlaceholderText('collab.chat.placeholder'), { target: { value: 'Got it' } })
    fireEvent.click(screen.getByRole('button', { name: 'collab.chat.send' }))

    await waitFor(() => expect(sentBodies).toEqual([{ text: 'Got it', reply_to: 1 }]))
    await waitFor(() => expect(screen.getAllByText('Alice')).toHaveLength(1))
  })

  it('FE-MOB-CCHAT-023: the reply banner can be dismissed by hand', async () => {
    serveMessages([chatMsg(1)])
    await renderChat()

    doubleTap(bubble())
    fireEvent.click(screen.getByRole('button', { name: 'collab.chat.reply' }))
    expect(screen.getByRole('button', { name: 'common.close' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'common.close' }))
    expect(screen.queryByRole('button', { name: 'common.close' })).not.toBeInTheDocument()
  })

  it('FE-MOB-CCHAT-024: delete is offered on own messages only and tombstones the bubble', async () => {
    serveMessages([chatMsg(1, { text: 'Theirs' }), chatMsg(2, { text: 'Mine', user_id: ME, username: 'Mo' })])
    let deleted = 0
    server.use(http.delete('/api/trips/:tripId/collab/messages/:id', () => {
      deleted++
      return HttpResponse.json({ success: true })
    }))
    await renderChat()

    doubleTap(bubble(0))
    expect(screen.queryByRole('button', { name: 'common.delete' })).not.toBeInTheDocument()
    fireEvent.pointerDown(document.body)

    doubleTap(bubble(1))
    fireEvent.click(screen.getByRole('button', { name: 'common.delete' }))

    await waitFor(() => expect(deleted).toBe(1))
    expect(await screen.findByText(/Mo collab\.chat\.deletedMessage/)).toBeInTheDocument()
    expect(screen.getByText('Theirs')).toBeInTheDocument()
  })

  it('FE-MOB-CCHAT-025: toasts when deleting or reacting fails', async () => {
    serveMessages([chatMsg(1, { user_id: ME, username: 'Mo', text: 'Mine' })])
    server.use(
      http.delete('/api/trips/:tripId/collab/messages/:id', () => HttpResponse.json({ error: 'x' }, { status: 500 })),
      http.post('/api/trips/:tripId/collab/messages/:id/react', () => HttpResponse.json({ error: 'x' }, { status: 500 })),
    )
    const { planner } = await renderChat()

    doubleTap(bubble())
    fireEvent.click(screen.getByRole('button', { name: '😂' }))
    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('common.error'))

    doubleTap(bubble())
    fireEvent.click(screen.getByRole('button', { name: 'common.delete' }))
    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledTimes(2))
    expect(screen.getByText('Mine')).toBeInTheDocument()
  })

  it('FE-MOB-CCHAT-026: a pointer down outside the popover closes it', async () => {
    serveMessages([chatMsg(1)])
    await renderChat()

    doubleTap(bubble())
    expect(screen.getByRole('button', { name: 'collab.chat.reply' })).toBeInTheDocument()

    fireEvent.pointerDown(document.body)
    expect(screen.queryByRole('button', { name: 'collab.chat.reply' })).not.toBeInTheDocument()
  })

  it('FE-MOB-CCHAT-027: a pointer down inside the popover keeps it open', async () => {
    serveMessages([chatMsg(1)])
    await renderChat()

    doubleTap(bubble())
    fireEvent.pointerDown(screen.getByRole('button', { name: '👏' }))
    expect(screen.getByRole('button', { name: 'collab.chat.reply' })).toBeInTheDocument()
  })

  it('FE-MOB-CCHAT-028: applies remote create, delete and reaction events once each', async () => {
    serveMessages([chatMsg(1)])
    await renderChat()
    const handler = vi.mocked(addListener).mock.calls[0][0]

    act(() => handler({ type: 'collab:message:created', tripId: 1, message: chatMsg(5, { text: 'From WS' }) }))
    expect(screen.getByText('From WS')).toBeInTheDocument()

    act(() => handler({ type: 'collab:message:created', tripId: 1, message: chatMsg(5, { text: 'From WS' }) }))
    expect(screen.getAllByText('From WS')).toHaveLength(1)

    act(() => handler({
      type: 'collab:message:reacted',
      tripId: 1,
      messageId: 5,
      reactions: [{ emoji: '🎉', count: 3, users: [] }],
    }))
    expect(screen.getByText('🎉')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()

    act(() => handler({ type: 'collab:message:deleted', tripId: 1, messageId: 5 }))
    expect(screen.queryByText('From WS')).not.toBeInTheDocument()
    expect(screen.getByText(/Alice collab\.chat\.deletedMessage/)).toBeInTheDocument()
  })

  it('FE-MOB-CCHAT-029: ignores events addressed to another trip', async () => {
    serveMessages([chatMsg(1)])
    await renderChat()
    const handler = vi.mocked(addListener).mock.calls[0][0]

    act(() => handler({ type: 'collab:message:created', tripId: 99, message: chatMsg(5, { text: 'Other trip' }) }))
    expect(screen.queryByText('Other trip')).not.toBeInTheDocument()
  })

  it('FE-MOB-CCHAT-030: auto-scrolls to a remote message only while the view sits at the bottom', async () => {
    serveMessages([chatMsg(1)])
    const { container } = await renderChat()
    const scroller = container.querySelector('.overflow-y-auto') as HTMLElement
    const handler = vi.mocked(addListener).mock.calls[0][0]
    const metric = (name: string, value: number) =>
      Object.defineProperty(scroller, name, { configurable: true, value })

    // let the initial "jump to newest" pass finish before measuring
    await new Promise(resolve => setTimeout(resolve, 80))
    metric('scrollHeight', 1000)
    metric('clientHeight', 300)
    metric('scrollTop', 0)
    fireEvent.scroll(scroller)
    vi.mocked(Element.prototype.scrollTo).mockClear()

    act(() => handler({ type: 'collab:message:created', tripId: 1, message: chatMsg(5, { text: 'Ping' }) }))
    await new Promise(resolve => setTimeout(resolve, 80))
    expect(Element.prototype.scrollTo).not.toHaveBeenCalled()

    metric('scrollTop', 700)
    fireEvent.scroll(scroller)
    act(() => handler({ type: 'collab:message:created', tripId: 1, message: chatMsg(6, { text: 'Pong' }) }))
    await waitFor(() => expect(Element.prototype.scrollTo).toHaveBeenCalled())
  })

  it('FE-MOB-CCHAT-031: detaches its websocket listener on unmount', async () => {
    serveMessages([chatMsg(1)])
    const { unmount } = await renderChat()
    const handler = vi.mocked(addListener).mock.calls[0][0]

    unmount()
    expect(removeListener).toHaveBeenCalledWith(handler)
  })
})
