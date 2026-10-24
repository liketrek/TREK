import type { CollectionListsCard, CollectionPlacesCard } from '@trek/shared';
import { Bookmark } from 'lucide-react';

import { useTranslation } from '../../../../i18n';
import { SoftPill, WhiteBadge } from '../../../Planner/planParts';
import { useAssistantView } from '../../assistantViewContext';
import type { CardEntry } from '../cardTypes';
import { CardFacts } from '../parts/CardFacts';
import CardFrame from '../parts/CardFrame';
import CardHeader from '../parts/CardHeader';
import { CardMore, CardRow, CardRows } from '../parts/CardRows';
import { labelsById, listTarget, mergeListRows, mergePlacesCards, rowsShown } from './collectionCardModel';
import { ListHead, ListLead, SavedPlaceRow, StatusPill } from './collectionCardParts';

/**
 * The answer cards of the collections: saved places under their list's head
 * (two lists read in one answer sit in one card, one head each), and the
 * user's lists with the invites waiting or the lists a place is saved in.
 * Window and phone draw the same; the phone has taller rows and no hover.
 */

function PlacesSection({ card, first }: { card: CollectionPlacesCard; first: boolean }) {
  const { density } = useAssistantView();
  const shown = card.places.slice(0, rowsShown(density));
  const labels = labelsById(card.labels);
  const more = card.more + card.places.length - shown.length;
  return (
    <div className={first ? '' : 'mt-2 border-t border-edge-faint pt-2.5'}>
      {card.list && <ListHead list={card.list} first={first} />}
      <CardRows>
        {shown.map((place, index) => (
          <SavedPlaceRow
            key={place.id ?? `new-${index}`}
            place={place}
            fallbackId={-(index + 1)}
            labels={place.labelIds.flatMap((id) => labels.get(id) ?? [])}
          />
        ))}
      </CardRows>
      <CardMore
        count={more}
        labelKey="assistant.card.collection.moreInList"
        target={listTarget(card.list?.id ?? null)}
      />
    </div>
  );
}

export function CollectionPlacesBlock({ cards }: { cards: readonly CardEntry[] }) {
  const { t } = useTranslation();
  const placesCards = mergePlacesCards(
    cards.flatMap((entry) => (entry.card.kind === 'collectionPlaces' ? [entry.card] : []))
  );
  const [only] = placesCards;
  if (!only) return null;
  const label =
    placesCards.length === 1 && only.list
      ? t('assistant.card.collection.places', { name: only.list.name })
      : t('assistant.card.collection.saved');
  return (
    <CardFrame label={label}>
      {placesCards.map((card, index) => (
        <PlacesSection key={card.list?.id ?? `places-${index}`} card={card} first={index === 0} />
      ))}
    </CardFrame>
  );
}

export function CollectionListsBlock({ cards }: { cards: readonly CardEntry[] }) {
  const { t } = useTranslation();
  const { onOpen } = useAssistantView();
  const listsCards = cards.flatMap((entry) => (entry.card.kind === 'collectionLists' ? [entry.card] : []));
  const { rows, more } = mergeListRows(listsCards);
  if (rows.length === 0) return null;
  const place = listsCards.reduce<CollectionListsCard['place']>((found, card) => card.place ?? found, null);
  const title = place ?? t('assistant.card.collection.lists');
  return (
    <CardFrame label={title}>
      <CardHeader
        icon={Bookmark}
        tone="info"
        title={title}
        count={place ? undefined : rows.length + more}
        meta={place ? t('assistant.card.collection.savedIn', { count: rows.length + more }) : undefined}
      />
      <CardRows>
        {rows.map((row, index) => (
          <CardRow
            key={row.id ?? `list-${index}`}
            lead={<ListLead color={row.color} />}
            title={
              <bdi title={row.name} className="block truncate">
                {row.name}
              </bdi>
            }
            aside={row.status ? <StatusPill status={row.status} /> : undefined}
            onActivate={row.id !== null && onOpen ? () => onOpen(listTarget(row.id)) : undefined}
            facts={
              <CardFacts>
                {row.invite && row.person && (
                  <SoftPill tone="info">{t('assistant.card.collection.invite', { name: row.person.name })}</SoftPill>
                )}
                {row.placeCount !== null && (
                  <WhiteBadge>{t('collections.placeCount', { count: row.placeCount })}</WhiteBadge>
                )}
                {row.memberCount > 0 && (
                  <WhiteBadge>{t('assistant.card.collection.members', { count: row.memberCount })}</WhiteBadge>
                )}
              </CardFacts>
            }
          />
        ))}
      </CardRows>
      <CardMore count={more} target={listTarget(null)} />
    </CardFrame>
  );
}
