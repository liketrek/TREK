import { test, expect, type Locator, type Page } from '@playwright/test'
import { captureGuide, captureHero, beat, typeInto, settle, VIEWPORT, type GuideScript } from './guide'
import { ordinal, short } from '../dates'
import { SEED_CHAT } from '../screenshots/seed'
import { seededTrip, ensureCollabFixtures, COLLAB_SPARE_POLL, WHATS_NEXT_STOPS } from './fixtures'
import { openTrip } from './trip-shared'
import { tripCollabContext, tripCollabGuides } from '../../src/help/contexts/tripCollab'
import type { HelpGuide } from '../../src/help/types'

/**
 * Actions for the Collab tab of a trip, keyed by the ids in
 * `src/help/contexts/tripCollab.ts`. They run on the seeded "Autumn in Japan",
 * whose collab addon already holds three notes, two polls and a seven message
 * conversation; `ensureCollabFixtures` adds the shared links, a throwaway poll
 * for the one guide that closes a poll for good, and the two upcoming stops
 * What's Next needs. What a guide writes it takes away again in `cleanup`, with
 * one deliberate exception: a deleted chat message cannot be undeleted, which is
 * why `trip-chat` is the last guide of the screen.
 */

const guide = (id: string): HelpGuide => {
  const g = tripCollabGuides.find(x => x.id === id)
  if (!g) throw new Error(`no registered guide "${id}"`)
  return g
}

const NOTE = {
  title: 'Luggage forwarding',
  body: 'Takkyubin from the hotel front desk, **before 11:00**, and the bags are in Kyoto the next afternoon.\n\n- One bag per person\n- About 2000 JPY a bag',
  category: 'Transport',
  website: 'https://www.global-yamato.com/en/hc/',
}
/** An .example host never resolves, so the chip shows its own glyph offline too. */
const LINK = { title: 'Hakone ryokan booking', url: 'https://www.hakone-ryokan.example/booking' }
const POLL = {
  // Plain text on purpose: a bold run in the question would wrap the paragraph
  // in one more element and move the card away from `pollCard`'s ancestor depth.
  question: 'Which evening do we keep for the kaiseki dinner?',
  options: [`${short(-5).split(',')[0]} ${ordinal(-5)}, after Fushimi Inari`, `${short(-4).split(',')[0]} ${ordinal(-4)}, after Arashiyama`, 'Either, decide on the day'],
}
/** The seeded poll nobody has voted on yet. */
const SEEDED_POLL = 'Ryokan or city hotel in Hakone?'
const CHAT = {
  mine: 'Ryokan check-in is 15:00, so let us aim for the 13:10 train out of Kyoto.',
  /** Typed before the picker opens, so the picture shows the emoji being added to it. */
  emoji: 'Two weeks to go ',
  flag: '🎌',
  theirs: 'Drop bags. I want to be at Senso-ji before the crowds.',
  answer: 'Agreed, bags at the hotel first, then Asakusa.',
  reactTo: SEED_CHAT.teamlab,
  reaction: '👍',
}

// ── Locators ─────────────────────────────────────────────────────────────────

/** Each of the four right-hand panels is a card; find it from what only it holds. */
const CARD = 'xpath=ancestor::div[contains(@class,"rounded-2xl") and contains(@class,"bg-surface-card")][1]'
const notesPanel = (page: Page) => page.getByRole('button', { name: 'New Note' }).locator(CARD)
const pollsPanel = (page: Page) => page.getByRole('button', { name: 'New Poll' }).locator(CARD)
const linksPanel = (page: Page) => page.getByRole('button', { name: 'Add link' }).locator(CARD)
const nextPanel = (page: Page) => page.getByText("What's Next", { exact: true }).locator(CARD)

const chatBox = (page: Page) => page.getByPlaceholder('Type a message...')
/** The row that holds the emoji button, the image button, the box and the arrow. */
const composer = (page: Page) => chatBox(page).locator('xpath=..')
/**
 * The quoted message above the box while a reply is being written. With no reply
 * pending the same position is the composer row itself, which is what the step
 * after the send asserts against.
 */
const replyQuote = (page: Page) => chatBox(page).locator('xpath=../..').locator('> div').first()
/** The send button and the emoji button carry no text and no label at all. */
const sendButton = (page: Page) => page.locator('button:has(svg.lucide-arrow-up)')
const emojiButton = (page: Page) => page.locator('button:has(svg.lucide-smile)')
/** The emoji picker is a portal; its three category tabs are the sure thing in it. */
const emojiPicker = (page: Page) => page.getByRole('button', { name: 'Travel', exact: true }).locator('xpath=../..')
/** The right-click menu of eight reactions: a 4x2 grid in a portal of its own. */
const reactionMenu = (page: Page) => page.locator('div[style*="repeat(4"]').last()
/** One message, by the relative wrapper that also carries its Reply and Delete. */
const bubble = (page: Page, text: string) =>
  page.getByText(text).first().locator('xpath=ancestor::div[contains(@style,"position: relative")][1]')
/**
 * Put the pointer on a message's Reply or Delete. The row holding them is
 * `pointer-events: none` until its own bubble is hovered, and it sits at
 * `top: -14px`, outside that bubble's box: hovering the button alone would land
 * on whatever is behind it. `captureGuide` scrolls the target to the middle of
 * the frame between `prepare` and the shot, and that scroll can take the bubble
 * out from under the pointer, so the hover is made again here, bubble first.
 */
const hoverMessageAction = (text: string, name: 'Reply' | 'Delete') => async (page: Page): Promise<void> => {
  await page.getByText(text).first().hover()
  await beat(page, 300)
  await bubble(page, text).getByRole('button', { name }).hover()
}

/** The note form is a `form[role="presentation"]` in its own portal, not a Modal. */
const noteForm = (page: Page) => page.locator('form[role="presentation"]')
/** The poll and link forms sit inside a full-screen overlay; ring the form, not it. */
const pollForm = (page: Page) => page.locator('form').filter({ has: page.getByPlaceholder('What should we do?') })
const linkForm = (page: Page) => page.locator('form').filter({ has: page.locator('#collab-link-url') })

const noteCard = (page: Page, title: string) =>
  notesPanel(page).getByText(title, { exact: true }).locator('xpath=ancestor::div[2]')
/** A poll card, from its question: the question is markdown, so it is four up. */
const pollCard = (page: Page, question: string) =>
  page.getByText(question, { exact: true }).locator('xpath=ancestor::div[4]')
const linkChip = (page: Page, title: string) => page.locator('.collab-link-chip').filter({ hasText: title })
/** A What's Next row, from the place name in it: name → details → row. */
const nextRow = (page: Page, place: string) =>
  nextPanel(page).getByText(place, { exact: true }).locator('xpath=../..')

// ── Start and cleanup ────────────────────────────────────────────────────────

const start = async (page: Page): Promise<void> => {
  await openTrip(page, { tab: 'collab' })
  // The Collab panel is a lazy chunk: everything below needs it mounted.
  await expect(page.getByRole('button', { name: 'New Poll' })).toBeVisible({ timeout: 30_000 })
  await settle(page)
}

const collab = (): string => `/api/trips/${seededTrip().tripId}/collab`

async function listOf<T>(page: Page, path: string, key: string): Promise<T[]> {
  const res = await page.request.get(`${collab()}/${path}`)
  const body = (await res.json()) as Record<string, T[] | undefined>
  return body[key] ?? []
}

async function deleteNote(page: Page, title: string): Promise<void> {
  const notes = await listOf<{ id: number; title: string }>(page, 'notes', 'notes')
  for (const note of notes.filter(n => n.title === title)) {
    await page.request.delete(`${collab()}/notes/${note.id}`)
  }
}

async function deleteLink(page: Page, title: string): Promise<void> {
  const links = await listOf<{ id: number; title: string }>(page, 'links', 'links')
  for (const link of links.filter(l => l.title === title)) {
    await page.request.delete(`${collab()}/links/${link.id}`)
  }
}

async function deletePoll(page: Page, question: string): Promise<void> {
  const polls = await listOf<{ id: number; question: string }>(page, 'polls', 'polls')
  for (const poll of polls.filter(p => p.question === question)) {
    await page.request.delete(`${collab()}/polls/${poll.id}`)
  }
}

/**
 * Voting for an option you already chose deletes the row, so one call puts the
 * seeded, unvoted poll back the way the next guide expects it.
 */
async function resetVote(page: Page, question: string, optionIndex: number): Promise<void> {
  const polls = await listOf<{ id: number; question: string }>(page, 'polls', 'polls')
  const poll = polls.find(p => p.question === question)
  if (poll) await page.request.post(`${collab()}/polls/${poll.id}/vote`, { data: { option_index: optionIndex } })
}

const only = (target: (page: Page) => Locator) => ({ target })

// ── Scripts ──────────────────────────────────────────────────────────────────

const SCRIPTS: Record<string, GuideScript> = {
  'write-note': {
    guide: guide('write-note'),
    start,
    steps: [
      {
        target: page => notesPanel(page).getByRole('button', { name: 'New Note' }),
        act: async page => {
          await notesPanel(page).getByRole('button', { name: 'New Note' }).click()
          await expect(noteForm(page)).toBeVisible()
          await settle(page)
        },
      },
      {
        prepare: page => typeInto(page, noteForm(page).getByPlaceholder('Note title'), NOTE.title),
        target: page => noteForm(page).getByPlaceholder('Note title'),
      },
      {
        prepare: page => typeInto(page, noteForm(page).getByPlaceholder('Write something...'), NOTE.body),
        target: page => noteForm(page).getByPlaceholder('Write something...'),
      },
      {
        // The pills are the categories that already exist; ring the row, then pick.
        target: page => noteForm(page).getByRole('button', { name: NOTE.category, exact: true }).locator('xpath=..'),
        act: async page => {
          await noteForm(page).getByRole('button', { name: NOTE.category, exact: true }).click()
          await beat(page, 300)
        },
      },
      {
        prepare: page => typeInto(page, noteForm(page).getByPlaceholder('https://...'), NOTE.website),
        target: page => noteForm(page).getByPlaceholder('https://...'),
      },
      {
        target: page => noteForm(page).getByRole('button', { name: 'Create', exact: true }),
        act: async page => {
          await noteForm(page).getByRole('button', { name: 'Create', exact: true }).click()
          await expect(noteForm(page)).toHaveCount(0)
          await expect(noteCard(page, NOTE.title)).toBeVisible({ timeout: 15_000 })
          await settle(page)
        },
      },
    ],
    cleanup: page => deleteNote(page, NOTE.title),
  },
  'shared-links': {
    guide: guide('shared-links'),
    start,
    steps: [
      {
        target: page => linksPanel(page).getByRole('button', { name: 'Add link' }),
        act: async page => {
          await linksPanel(page).getByRole('button', { name: 'Add link' }).click()
          await expect(linkForm(page)).toBeVisible()
          await settle(page)
        },
      },
      {
        prepare: async page => {
          await typeInto(page, linkForm(page).locator('#collab-link-title'), LINK.title)
          await typeInto(page, linkForm(page).locator('#collab-link-url'), LINK.url)
          await beat(page, 300)
        },
        target: linkForm,
        act: async page => {
          await linkForm(page).getByRole('button', { name: 'Save link' }).click()
          await expect(linkForm(page)).toHaveCount(0)
          await expect(linkChip(page, LINK.title)).toBeVisible({ timeout: 15_000 })
          await settle(page)
        },
      },
      {
        prepare: async page => { await linkChip(page, LINK.title).hover() },
        target: page => linkChip(page, LINK.title).locator('.collab-link-chip__main'),
      },
      {
        target: page => linkChip(page, LINK.title).locator('.collab-link-chip__actions'),
        act: async page => {
          // Exact: an accessible name is matched as a substring, and "Unpin link"
          // holds "Pin link", so the loose form would find both buttons.
          await linkChip(page, LINK.title).getByRole('button', { name: 'Pin link', exact: true }).click()
          await expect(linkChip(page, LINK.title)).toHaveClass(/collab-link-chip--pinned/)
          await expect(page.locator('.collab-link-grid__cells > div').first()).toContainText(LINK.title)
          await settle(page)
        },
      },
    ],
    cleanup: page => deleteLink(page, LINK.title),
  },
  'create-poll': {
    guide: guide('create-poll'),
    start,
    steps: [
      {
        target: page => pollsPanel(page).getByRole('button', { name: 'New Poll' }),
        act: async page => {
          await pollsPanel(page).getByRole('button', { name: 'New Poll' }).click()
          await expect(pollForm(page)).toBeVisible()
          await settle(page)
        },
      },
      {
        prepare: page => typeInto(page, pollForm(page).getByPlaceholder('What should we do?'), POLL.question),
        // The label, the box and the Markdown supported hint under it.
        target: page => pollForm(page).getByPlaceholder('What should we do?').locator('xpath=..'),
      },
      {
        prepare: async page => {
          await typeInto(page, pollForm(page).getByPlaceholder('Option 1'), POLL.options[0])
          await typeInto(page, pollForm(page).getByPlaceholder('Option 2'), POLL.options[1])
        },
        target: page => pollForm(page).getByPlaceholder('Option 1').locator('xpath=ancestor::div[2]'),
      },
      {
        target: page => pollForm(page).getByRole('button', { name: '+ Add option' }),
        act: async page => {
          await pollForm(page).getByRole('button', { name: '+ Add option' }).click()
          await typeInto(page, pollForm(page).getByPlaceholder('Option 3'), POLL.options[2])
          await beat(page, 300)
        },
      },
      // The switch alone is 36 px wide; ring the label it sits in.
      only(page => pollForm(page).getByRole('switch', { name: 'Multiple choice' }).locator('xpath=..')),
      {
        target: page => pollForm(page).getByRole('button', { name: 'Create Poll' }),
        act: async page => {
          await pollForm(page).getByRole('button', { name: 'Create Poll' }).click()
          await expect(pollForm(page)).toHaveCount(0)
          await expect(pollCard(page, POLL.question)).toBeVisible({ timeout: 15_000 })
          await settle(page)
        },
      },
    ],
    cleanup: page => deletePoll(page, POLL.question),
  },
  'vote-poll': {
    guide: guide('vote-poll'),
    start,
    steps: [
      {
        target: page => pollCard(page, SEEDED_POLL).getByRole('button', { name: 'City hotel' }),
        act: async page => {
          await pollCard(page, SEEDED_POLL).getByRole('button', { name: 'City hotel' }).click()
          await expect(pollCard(page, SEEDED_POLL).getByRole('button', { name: /City hotel.*100%/ })).toBeVisible({ timeout: 15_000 })
          await settle(page)
        },
      },
      // Both bars and both percentages, so the step about reading them has them.
      only(page => pollCard(page, SEEDED_POLL).locator('> div').last()),
      {
        target: page => pollCard(page, SEEDED_POLL).getByRole('button', { name: /^Ryokan with onsen/ }),
        act: async page => {
          await pollCard(page, SEEDED_POLL).getByRole('button', { name: /^Ryokan with onsen/ }).click()
          await expect(pollCard(page, SEEDED_POLL).getByRole('button', { name: /Ryokan with onsen.*100%/ })).toBeVisible({ timeout: 15_000 })
          await expect(pollCard(page, SEEDED_POLL).getByRole('button', { name: /City hotel.*0%/ })).toBeVisible()
          await settle(page)
        },
      },
      // The counter is hardcoded English in the component: "1 vote" / "3 votes".
      only(page => pollCard(page, SEEDED_POLL).getByText(/^\d+ votes?$/)),
    ],
    cleanup: page => resetVote(page, SEEDED_POLL, 0),
  },
  'close-poll': {
    guide: guide('close-poll'),
    start,
    steps: [
      {
        target: page => pollCard(page, COLLAB_SPARE_POLL.question).locator('button:has(svg.lucide-lock)'),
        act: async page => {
          await pollCard(page, COLLAB_SPARE_POLL.question).locator('button:has(svg.lucide-lock)').click()
          await expect(pollCard(page, COLLAB_SPARE_POLL.question).getByText('Closed', { exact: true })).toBeVisible({ timeout: 15_000 })
          await settle(page)
        },
      },
      only(page => pollCard(page, COLLAB_SPARE_POLL.question)),
      {
        target: page => pollCard(page, COLLAB_SPARE_POLL.question).locator('button:has(svg.lucide-trash2)'),
        act: async page => {
          await pollCard(page, COLLAB_SPARE_POLL.question).locator('button:has(svg.lucide-trash2)').click()
          await expect(pollsPanel(page).getByText(COLLAB_SPARE_POLL.question)).toHaveCount(0, { timeout: 15_000 })
          await settle(page)
        },
      },
    ],
    // The last step normally already removed it; this is for a run that stopped short.
    cleanup: page => deletePoll(page, COLLAB_SPARE_POLL.question),
  },
  'whats-next': {
    guide: guide('whats-next'),
    start,
    steps: [
      only(nextPanel),
      // The time column is the first child of a row, the chips the last of its details.
      only(page => nextRow(page, WHATS_NEXT_STOPS.timed).locator('> div').first()),
      only(page => nextRow(page, WHATS_NEXT_STOPS.timed).locator('> div').last().locator('> div').last()),
    ],
    // Read-only panel: the guide writes nothing.
  },
  'trip-chat': {
    guide: guide('trip-chat'),
    start,
    steps: [
      {
        prepare: page => typeInto(page, chatBox(page), CHAT.mine),
        target: composer,
        act: async page => {
          await chatBox(page).press('Enter')
          await expect(page.getByText(CHAT.mine)).toBeVisible({ timeout: 15_000 })
          await settle(page)
        },
      },
      {
        prepare: async page => {
          await typeInto(page, chatBox(page), CHAT.emoji)
          await emojiButton(page).click()
          await expect(emojiPicker(page)).toBeVisible()
          await beat(page, 300)
        },
        target: emojiPicker,
        act: async page => {
          await emojiPicker(page).getByRole('button', { name: 'Travel', exact: true }).click()
          await emojiPicker(page).getByRole('button', { name: CHAT.flag }).click()
          await expect(chatBox(page)).toHaveValue(`${CHAT.emoji}${CHAT.flag}`)
          await sendButton(page).click()
          await expect(page.getByText(`${CHAT.emoji}${CHAT.flag}`)).toBeVisible({ timeout: 15_000 })
          await settle(page)
        },
      },
      {
        // The hover row is pointer-events:none until the bubble under it is hovered,
        // so the bubble has to be hovered before the button can be reached at all.
        prepare: async page => {
          await page.getByText(CHAT.theirs).first().hover()
          await beat(page, 300)
        },
        target: page => bubble(page, CHAT.theirs).getByRole('button', { name: 'Reply' }),
        hover: hoverMessageAction(CHAT.theirs, 'Reply'),
        act: async page => {
          await bubble(page, CHAT.theirs).getByRole('button', { name: 'Reply' }).click()
          await expect(replyQuote(page)).toContainText(CHAT.theirs)
          await settle(page)
        },
      },
      {
        prepare: page => typeInto(page, chatBox(page), CHAT.answer),
        target: replyQuote,
        act: async page => {
          await chatBox(page).press('Enter')
          await expect(page.getByText(CHAT.answer)).toBeVisible({ timeout: 15_000 })
          await expect(replyQuote(page)).not.toContainText(CHAT.theirs)
          await settle(page)
        },
      },
      {
        prepare: async page => {
          await page.getByText(CHAT.reactTo).first().click({ button: 'right' })
          await expect(reactionMenu(page)).toBeVisible()
          await beat(page, 300)
        },
        target: reactionMenu,
        act: async page => {
          await reactionMenu(page).getByRole('button', { name: CHAT.reaction }).click()
          await expect(
            bubble(page, CHAT.reactTo).locator('xpath=..').getByRole('button', { name: CHAT.reaction }),
          ).toBeVisible({ timeout: 15_000 })
          await settle(page)
        },
      },
      {
        prepare: async page => {
          await page.getByText(CHAT.mine).first().hover()
          await beat(page, 300)
        },
        target: page => bubble(page, CHAT.mine).getByRole('button', { name: 'Delete' }),
        hover: hoverMessageAction(CHAT.mine, 'Delete'),
        act: async page => {
          await bubble(page, CHAT.mine).getByRole('button', { name: 'Delete' }).click()
          // The bubble shrinks for 400 ms before the request goes out.
          await page.waitForTimeout(1200)
          await expect(page.getByText(/deleted a message/)).toBeVisible({ timeout: 15_000 })
          await settle(page)
        },
      },
    ],
    // No cleanup, deliberately: deleting a message is a soft delete and there is
    // no undelete over the API, so undoing anything here would only add more
    // tombstones. This is why trip-chat is the last guide of the screen.
  },
}

// ── Run ───────────────────────────────────────────────────────────────────────

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ request }) => {
  await ensureCollabFixtures(request)
})

test('every registered collab guide has a script, and only those', async () => {
  expect(Object.keys(SCRIPTS).sort()).toEqual([...tripCollabContext.guides].sort())
})

test('hero: trip-collab', async ({ page }) => {
  await page.setViewportSize(VIEWPORT)
  await captureHero(page, tripCollabContext.id, start)
})

for (const id of tripCollabContext.guides) {
  test(`pictures: ${id}`, async ({ page }) => {
    await page.setViewportSize(VIEWPORT)
    await captureGuide(page, SCRIPTS[id])
  })
}
