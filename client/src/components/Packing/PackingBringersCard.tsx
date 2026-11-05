import type { CSSProperties } from 'react';
import { useTranslation } from '../../i18n';
import type { TripMember } from './usePackingListPanel';

/** One person bringing a common item: the name, and the picture when the trip knows one. */
export interface Bringer {
  name: string;
  avatar: string | null;
}

/** The item's bringer first, then whoever also brings it, each once, with their picture from the trip's members. */
export function bringersOf(
  item: {
    owner_id?: number | null;
    owner_username?: string | null;
    contributors?: { user_id: number; username: string }[] | null;
  },
  members: readonly TripMember[]
): Bringer[] {
  const avatarOf = (id: number | null | undefined) => {
    const member = id == null ? undefined : members.find((m) => m.id === id);
    return member?.avatar_url ?? member?.avatar ?? null;
  };
  const all = [
    ...(item.owner_username ? [{ id: item.owner_id ?? null, name: item.owner_username }] : []),
    ...(item.contributors ?? []).map((c) => ({ id: c.user_id, name: c.username })),
  ];
  const bringers: Bringer[] = [];
  for (const person of all) {
    if (bringers.some((b) => b.name === person.name)) continue;
    bringers.push({ name: person.name, avatar: avatarOf(person.id) });
  }
  return bringers;
}

const CIRCLE: CSSProperties = {
  width: 20,
  height: 20,
  borderRadius: '50%',
  flexShrink: 0,
  display: 'grid',
  placeItems: 'center',
  fontSize: 'calc(9px * var(--fs-scale-caption, 1))',
  fontWeight: 700,
};

/** A bringer's picture, or the first letter of the name on a colour taken from it. */
export function BringerAvatar({ bringer }: { bringer: Bringer }) {
  if (bringer.avatar) {
    return <img src={bringer.avatar} alt="" style={{ ...CIRCLE, objectFit: 'cover', display: 'block' }} />;
  }
  return (
    <span
      aria-hidden
      style={{
        ...CIRCLE,
        background: `hsl(${((bringer.name.codePointAt(0) ?? 0) * 37) % 360}, 55%, 55%)`, // theme-lint-disable: the colour comes from the bringer's name
        color: 'white', // theme-lint-disable: the letter sits on the name's own colour
        textTransform: 'uppercase',
      }}
    >
      {bringer.name[0]}
    </span>
  );
}

/** The "+N" of the others bringing it, as a circle tucked under the first bringer's picture. */
export function MoreBringers({ count }: { count: number }) {
  return (
    <span
      aria-hidden
      style={{
        ...CIRCLE,
        marginInlineStart: -6,
        color: 'var(--text-muted)',
        background: 'var(--bg-tertiary)',
        boxShadow: '0 0 0 2px var(--bg-card)',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      +{count}
    </span>
  );
}

/** What the row's tooltip shows: everyone bringing the item, one per line with their picture. */
export function BringersCard({ bringers }: { bringers: readonly Bringer[] }) {
  const { t } = useTranslation();
  return (
    <div style={{ minWidth: 150 }}>
      <div
        className="text-content-faint"
        style={{
          fontSize: 'calc(9.5px * var(--fs-scale-caption, 1))',
          fontWeight: 700,
          letterSpacing: '.06em',
          textTransform: 'uppercase',
          paddingBottom: 6,
        }}
      >
        {t('packing.bringersTitle')}
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {bringers.map((b, i) => (
          <li
            key={b.name}
            className={i > 0 ? 'border-t border-edge-faint' : undefined}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}
          >
            <BringerAvatar bringer={b} />
            <span
              className="text-content"
              style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 600 }}
            >
              {b.name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
