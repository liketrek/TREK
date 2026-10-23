import type { AssistantMessage, TrekCard, TrekCardKind } from '@trek/shared';

import { messageBlocks } from './assistantParts';
import { CARD_LOOKS } from './cards/cardLooks';
import type { CardEntry, CardFollowUp, CardLook } from './cards/cardTypes';

/**
 * The next questions an answer suggests, as one tap each. The model offers
 * them itself at the end of an answer, fitting the conversation; an answer
 * without them falls back to what it holds, which costs nothing and comes at
 * once. Cards ask what their kind offers, places found ask to narrow them, a
 * change asks what its own kind offers (a tour about the tour) and a change
 * to the day plan asks to go on with the plan, a forecast asks for the other
 * weather. Three at most; the first kind the answer holds wins.
 */

export interface FollowUp {
  id: string;
  /** What the chip says and sends, translated; a question the model wrote carries `text` instead. */
  labelKey: string;
  /** The model's own question, sent as it is. */
  text?: string;
  /** Asks for a change, so only someone who may edit the trip is offered it. */
  edits?: boolean;
}

const PLACES: readonly FollowUp[] = [
  { id: 'cheaper', labelKey: 'assistant.followUp.cheaper' },
  { id: 'closer', labelKey: 'assistant.followUp.closer' },
  { id: 'openNow', labelKey: 'assistant.followUp.openNow' },
];

const PLAN: readonly FollowUp[] = [
  { id: 'nextDay', labelKey: 'assistant.followUp.nextDay' },
  { id: 'relaxed', labelKey: 'assistant.followUp.relaxed' },
  { id: 'dinners', labelKey: 'assistant.followUp.dinners' },
];

const WEATHER: readonly FollowUp[] = [
  { id: 'rain', labelKey: 'assistant.followUp.rain' },
  { id: 'sun', labelKey: 'assistant.followUp.sun' },
];

const GENERAL: readonly FollowUp[] = [
  { id: 'more', labelKey: 'assistant.followUp.more' },
  { id: 'next', labelKey: 'assistant.followUp.next' },
];

/** What a change touches that the day plan's questions ("plan the next day the same way") are about. */
const PLAN_ENTITIES: ReadonlySet<string> = new Set(['place', 'assignment', 'day_note']);

/** What a kind offers to ask next, typed for any kind. */
function offeredBy(kind: TrekCardKind): readonly CardFollowUp<TrekCardKind>[] {
  return (CARD_LOOKS[kind] as CardLook<TrekCardKind>).followUps ?? [];
}

/**
 * The follow-ups of the cards an answer ends on (past its closing words): what
 * the first card's kind offers, laid out as the chat lays it out, without the
 * ones that ask for a change when the user may not make one, and without the
 * ones none of the answer's cards of that kind calls for.
 */
function cardFollowUps(message: AssistantMessage, canEdit: boolean): readonly FollowUp[] {
  const blocks = messageBlocks(message, false).filter((block) => block.kind !== 'text');
  const last = blocks[blocks.length - 1];
  const entries: readonly CardEntry[] = last?.kind === 'cards' ? last.entries : [];
  const kind = entries[0]?.card.kind;
  if (!kind) return [];
  const cards = entries.filter((entry) => entry.card.kind === kind).map((entry) => entry.card);
  return offeredBy(kind).filter(
    (followUp) => (canEdit || !followUp.edits) && (!followUp.when || cards.some((card) => followUp.when?.(card)))
  );
}

/**
 * The follow-ups of the changes an answer proposed or made: what the first
 * change card's kind offers (a tour's are about the tour), else the day
 * plan's questions when a change touched the day plan, else none, so a
 * budget entry or a packing list is not asked to plan the next day the same way.
 */
function changeFollowUps(message: AssistantMessage, canEdit: boolean): readonly FollowUp[] | null {
  const cards: TrekCard[] = [];
  const entities = new Set<string>();
  let changed = false;
  for (const part of message.parts) {
    if (part.type === 'data-trek-change') {
      changed = true;
      if (part.data.card) cards.push(part.data.card);
    } else if (part.type === 'data-trek-applied') {
      changed = true;
      entities.add(part.data.entity);
    }
  }
  if (!changed) return null;
  const kind = cards[0]?.kind;
  if (kind) {
    const offered = offeredBy(kind).filter(
      (followUp) =>
        (canEdit || !followUp.edits) &&
        (!followUp.when || cards.some((card) => card.kind === kind && followUp.when?.(card)))
    );
    if (offered.length > 0) return offered;
  }
  if (!canEdit) return null;
  const onPlan = entities.size === 0 ? !kind : [...entities].some((entity) => PLAN_ENTITIES.has(entity));
  return onPlan ? PLAN : [];
}

/** Whether the answer's last words ask the user something. */
function endsWithQuestion(message: AssistantMessage): boolean {
  const texts = message.parts.flatMap((part) => (part.type === 'text' ? [part.text] : []));
  return /[?？]\s*$/.test(texts[texts.length - 1] ?? '');
}

/** The questions the model offered at the end of the answer, the last offer's; none when it offered none. */
function modelFollowUps(message: AssistantMessage): readonly FollowUp[] {
  const offers = message.parts.flatMap((part) => (part.type === 'data-trek-follow-ups' ? [part.data] : []));
  const offer = offers[offers.length - 1];
  if (!offer) return [];
  return offer.questions.map((text, index) => ({ id: `model-${index}`, labelKey: '', text }));
}

/** What an answer offers to ask next; changes are offered only to someone who may make them. */
export function followUpsFor(message: AssistantMessage, canEdit: boolean): readonly FollowUp[] {
  const fromModel = modelFollowUps(message);
  if (fromModel.length > 0) return fromModel;
  const fromCards = cardFollowUps(message, canEdit);
  if (fromCards.length > 0) return fromCards;
  const fromChanges = changeFollowUps(message, canEdit);
  if (fromChanges !== null) return fromChanges.length > 0 ? fromChanges : GENERAL;
  const types = new Set(message.parts.map((part) => part.type));
  if (types.has('data-trek-places')) return PLACES;
  if (types.has('data-trek-weather')) return WEATHER;
  // An answer that asks the user something waits for their answer, not for "tell me more".
  return types.has('text') && !endsWithQuestion(message) ? GENERAL : [];
}
