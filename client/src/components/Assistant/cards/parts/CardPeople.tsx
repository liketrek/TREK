import type { CardPerson } from '@trek/shared';

import { useTranslation } from '../../../../i18n';
import { avatarSrc } from '../../../../utils/avatarSrc';
import { TravelerAvatar } from '../../../Planner/bookings/bookingParts';
import { Tooltip } from '../../../shared/Tooltip';
import { useViewerId } from './useViewerId';

/**
 * People on a card, as the bookings show travellers: a round face with the
 * picture TREK stores for them, else the first letter. A card carries a
 * stored file name only, never an address, so a picture from a sign-in
 * provider shows the letter. The signed-in user reads as "You".
 */

const FACE = { 14: 'h-3.5 w-3.5', 20: 'h-5 w-5', 24: 'h-6 w-6' } as const;

/** A person's name as the card says it: "You" for the signed-in user. */
function useNameOf(): (person: CardPerson) => string {
  const { t } = useTranslation();
  const viewerId = useViewerId();
  const you = t('assistant.card.common.you');
  return (person) => (person.id === viewerId ? you : person.name);
}

export function PersonFace({ person, size = 20 }: { person: CardPerson; size?: keyof typeof FACE }) {
  const nameOf = useNameOf();
  const name = nameOf(person);
  return (
    <span role="img" aria-label={name} title={name} className="inline-flex flex-none">
      <TravelerAvatar src={avatarSrc(person.avatarKey)} name={person.name} className={FACE[size]} />
    </span>
  );
}

/** A few faces stacked, the rest counted, every name in the tooltip and for screen readers. */
export function PeopleStack({ people, max = 3 }: { people: readonly CardPerson[]; max?: number }) {
  const nameOf = useNameOf();
  if (people.length === 0) return null;
  const names = people.map(nameOf).join(', ');
  return (
    <Tooltip label={names}>
      <span role="img" aria-label={names} className="flex items-center">
        {people.slice(0, max).map((person, i) => (
          <TravelerAvatar
            key={person.id}
            src={avatarSrc(person.avatarKey)}
            name={person.name}
            className="h-5 w-5 border-2 border-surface-card"
            style={{ marginInlineStart: i ? -6 : 0 }}
          />
        ))}
        {people.length > max && (
          <span className="ms-1 text-caption font-semibold tabular-nums text-content-faint">
            +{people.length - max}
          </span>
        )}
      </span>
    </Tooltip>
  );
}
