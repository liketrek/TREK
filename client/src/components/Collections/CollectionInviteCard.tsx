import React from 'react';
import type { IncomingCollectionInvite } from '../../store/collectionStore';
import type { TranslationFn } from '../../types';

interface CollectionInviteCardProps {
  invite: IncomingCollectionInvite;
  onAccept: (id: number) => void | Promise<void>;
  onDecline: (id: number) => void | Promise<void>;
  t: TranslationFn;
}

/**
 * One pending list invite with Accept / Decline. Lives in the lists rail, and in
 * the page body where the rail is not on screen: no lists of one's own yet, or
 * the invite notification's link to a list that is still an invite (#2645).
 */
export default function CollectionInviteCard({
  invite,
  onAccept,
  onDecline,
  t,
}: CollectionInviteCardProps): React.ReactElement {
  return (
    <div className="col-invite">
      <div className="t">{invite.name}</div>
      <div className="s">
        {t('collections.invites.from')} {invite.from.username}
      </div>
      <div className="col-invite-actions">
        <button type="button" onClick={() => void onAccept(invite.collection_id)} className="col-invite-accept">
          {t('collections.invites.accept')}
        </button>
        <button type="button" onClick={() => void onDecline(invite.collection_id)} className="col-invite-decline">
          {t('collections.invites.decline')}
        </button>
      </div>
    </div>
  );
}
