import type { AssistantMessage, CollabNoteCard, CollabNotesCard as NotesCard } from '@trek/shared';
import { Link2, Paperclip, Pin, PinOff, StickyNote, Tag, Type } from 'lucide-react';
import type { ReactNode } from 'react';
import Markdown, { type Components } from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

import { useTranslation } from '../../../../i18n';
import { safeHexColor } from '../../../../utils/safeColor';
import { NoteHeadBand } from '../../../Collab/CollabNoteHead';
import { SoftPill, tintOf } from '../../../Planner/planParts';
import { sanitizedMarkdownComponents, sanitizedMarkdownPlugins } from '../../../shared/markdownSanitize';
import type { ChangeItem, ChangeState } from '../../assistantParts';
import { useAssistantView } from '../../assistantViewContext';
import type { CardEntry } from '../cardTypes';
import { Fact, FactChange } from '../parts/CardFacts';
import CardFrame from '../parts/CardFrame';
import CardHeader from '../parts/CardHeader';
import { CardOpenButton } from '../parts/CardOpen';
import { PersonFace } from '../parts/CardPeople';
import { CardMore } from '../parts/CardRows';
import { isChanged, isOpen } from './collabCardModel';
import { NOTES_TARGET } from './collabLook';

/**
 * Shared notes of the trip in the assistant chat, drawn like the Collab
 * tab's note cards: a head band tinted by the category's colour with its
 * title and pin, the start of the text in three lines, and the facts (the
 * link's host, the files, the category) as badges. A link in a note reads as
 * a word here, since the text may be cut. A held new note has a dashed
 * frame, a held change marks what it changes, a note about to go is struck.
 */

const ICON = { size: 10, strokeWidth: 2.2, 'aria-hidden': true } as const;

/** The note's markdown as the note card renders it, its links as words. */
const NOTE_MARKDOWN: Components = {
  ...sanitizedMarkdownComponents,
  a: ({ children }) => <span className="underline underline-offset-2">{children}</span>,
};

/** A small accent dot before what a held change sets anew. */
function ChangedDot({ on }: { on: boolean }) {
  if (!on) return null;
  return <span aria-hidden="true" className="me-1 inline-block h-1.5 w-1.5 rounded-full bg-accent align-middle" />;
}

function NoteView({ note, state }: { note: CollabNoteCard; state: ChangeState | null }) {
  const { t } = useTranslation();
  const color = safeHexColor(note.color, 'var(--accent)');
  const removing = note.change === 'remove';
  const dashed = note.change === 'create' && isOpen(state);
  const facts: ReactNode[] = [];
  if (note.websiteHost) {
    facts.push(
      <SoftPill key="link" icon={<Link2 {...ICON} />} className="max-w-full">
        <ChangedDot on={isChanged(note, 'website')} />
        <bdi className="truncate">{note.websiteHost}</bdi>
      </SoftPill>
    );
  }
  if (note.files > 0) {
    facts.push(
      <SoftPill key="files" icon={<Paperclip {...ICON} />}>
        {t('assistant.card.collab.files', { count: note.files })}
      </SoftPill>
    );
  }
  if (note.category) {
    facts.push(
      <SoftPill key="category" icon={<Tag {...ICON} />} className="max-w-full">
        <ChangedDot on={isChanged(note, 'category')} />
        <bdi className="truncate">{note.category}</bdi>
      </SoftPill>
    );
  }
  const hasBody = !!note.body || facts.length > 0;
  return (
    <article
      aria-label={note.title}
      className={`flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-surface-card ${dashed ? 'border-dashed' : ''} ${removing ? 'opacity-60' : ''}`}
      // A pinned note keeps its category colour on the frame, as on the Collab tab.
      style={{
        borderColor: note.pinned ? tintOf(color, 45) : dashed ? 'var(--border-primary)' : 'var(--border-faint)',
      }}
    >
      <NoteHeadBand
        title={
          <>
            <ChangedDot on={isChanged(note, 'title')} />
            {note.title}
          </>
        }
        color={color}
        category={note.category}
        pinned={note.pinned}
        bordered={hasBody}
        titleClassName={removing ? 'line-through' : ''}
        trailing={note.author && <PersonFace person={note.author} size={20} />}
      />
      {hasBody && (
        <div className="flex flex-1 flex-col gap-2 px-3 pb-2.5 pt-2">
          {note.body && (
            <div className="collab-note-md line-clamp-3 break-words text-caption text-content-muted">
              <Markdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                rehypePlugins={sanitizedMarkdownPlugins}
                components={NOTE_MARKDOWN}
              >
                {note.body}
              </Markdown>
            </div>
          )}
          {facts.length > 0 && <span className="flex flex-wrap items-center gap-1">{facts}</span>}
        </div>
      )}
    </article>
  );
}

/** The notes of an answer's reads, each once; side by side where the chat has room, the rest counted. */
export default function CollabNotesBlock({ cards }: { cards: readonly CardEntry[]; message: AssistantMessage }) {
  const { t } = useTranslation();
  const { density } = useAssistantView();
  const seen = new Set<number>();
  const notes: CollabNoteCard[] = [];
  let more = 0;
  for (const { card } of cards) {
    if (card.kind !== 'collabNotes') continue;
    more = Math.max(more, card.more);
    for (const note of card.notes) {
      if (note.noteId !== null && seen.has(note.noteId)) continue;
      if (note.noteId !== null) seen.add(note.noteId);
      notes.push(note);
    }
  }
  if (notes.length === 0) return null;
  const title = t('collab.tabs.notes');
  return (
    <CardFrame label={title}>
      <CardHeader
        icon={StickyNote}
        tone="info"
        title={title}
        count={notes.length + more}
        actions={<CardOpenButton target={NOTES_TARGET} labelKey="assistant.card.collab.openNotes" />}
      />
      <div className={`mt-2 gap-2 ${density === 'roomy' ? 'grid grid-cols-2' : 'flex flex-col'}`}>
        {notes.map((note, index) => (
          <NoteView key={note.noteId ?? `new-${index}`} note={note} state={null} />
        ))}
      </div>
      <CardMore count={more} labelKey="assistant.card.collab.moreNotes" target={NOTES_TARGET} />
    </CardFrame>
  );
}

/** A change row's note, after the change, marked by how it stands. */
export function CollabNotesBody({ card, item }: { card: NotesCard; item: ChangeItem }) {
  return (
    <div className="flex flex-col gap-2">
      {card.notes.map((note, index) => (
        <NoteView key={note.noteId ?? `new-${index}`} note={note} state={item.state} />
      ))}
    </div>
  );
}

/**
 * The faint line of a note change: its title and category before and after
 * from the change's own rows, and whether it gets pinned or unpinned, read
 * from the note the change leaves.
 */
export function CollabNoteFacts({ card, item }: { card: NotesCard; item: ChangeItem }) {
  const { t } = useTranslation();
  const rows = item.preview?.rows ?? [];
  // The pin reads from the note as the change leaves it, not from the row's check glyph.
  const pinned = card.notes[0]?.pinned === true;
  return (
    <>
      {rows.map((row, index) => {
        if (row.labelKey === 'name') {
          const key = `${row.labelKey}-${index}`;
          return <FactChange key={key} icon={Type} before={row.before} after={row.after} tone="info" />;
        }
        if (row.labelKey === 'category') {
          return <FactChange key={`${row.labelKey}-${index}`} icon={Tag} before={row.before} after={row.after} />;
        }
        if (row.labelKey === 'field' && row.field === 'pinned') {
          return (
            <Fact
              key={`${row.labelKey}-${index}`}
              icon={pinned ? Pin : PinOff}
              label={t(pinned ? 'assistant.card.collab.pinned' : 'assistant.card.collab.unpinned')}
            />
          );
        }
        return null;
      })}
    </>
  );
}
