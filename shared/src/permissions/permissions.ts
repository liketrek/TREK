/**
 * The catalog of configurable trip permissions and the one rule that decides
 * them. The server enforces it (`PermissionsService`, `@RequirePermission`);
 * the admin screen and the client's `can()` read the same keys and levels.
 *
 * Levels are hierarchical, higher includes lower:
 *   admin > trip_owner > trip_member > everybody
 *
 * "everybody" means any authenticated user with trip access; for
 * `trip_create`, which has no trip, any authenticated user.
 */
export const PERMISSION_LEVELS = ['admin', 'trip_owner', 'trip_member', 'everybody'] as const;

export type PermissionLevel = (typeof PERMISSION_LEVELS)[number];

export interface PermissionAction {
  readonly key: string;
  readonly defaultLevel: PermissionLevel;
  readonly allowedLevels: readonly PermissionLevel[];
}

/** Every configurable action with its default and the levels an admin may pick. */
export const PERMISSION_ACTIONS = [
  // Trip management
  { key: 'trip_create', defaultLevel: 'everybody', allowedLevels: ['admin', 'everybody'] },
  { key: 'trip_edit', defaultLevel: 'trip_owner', allowedLevels: ['trip_owner', 'trip_member'] },
  { key: 'trip_delete', defaultLevel: 'trip_owner', allowedLevels: ['admin', 'trip_owner'] },
  { key: 'trip_archive', defaultLevel: 'trip_owner', allowedLevels: ['trip_owner', 'trip_member'] },
  { key: 'trip_cover_upload', defaultLevel: 'trip_owner', allowedLevels: ['trip_owner', 'trip_member'] },

  // Member management
  { key: 'member_manage', defaultLevel: 'trip_owner', allowedLevels: ['admin', 'trip_owner', 'trip_member'] },

  // Files
  { key: 'file_upload', defaultLevel: 'trip_member', allowedLevels: ['admin', 'trip_owner', 'trip_member'] },
  { key: 'file_edit', defaultLevel: 'trip_member', allowedLevels: ['trip_owner', 'trip_member'] },
  { key: 'file_delete', defaultLevel: 'trip_member', allowedLevels: ['trip_owner', 'trip_member'] },

  // Places
  { key: 'place_edit', defaultLevel: 'trip_member', allowedLevels: ['trip_owner', 'trip_member'] },

  // Budget
  { key: 'budget_edit', defaultLevel: 'trip_member', allowedLevels: ['trip_owner', 'trip_member'] },

  // Packing
  { key: 'packing_edit', defaultLevel: 'trip_member', allowedLevels: ['trip_owner', 'trip_member'] },

  // Reservations
  { key: 'reservation_edit', defaultLevel: 'trip_member', allowedLevels: ['trip_owner', 'trip_member'] },

  // Day notes & schedule
  { key: 'day_edit', defaultLevel: 'trip_member', allowedLevels: ['trip_owner', 'trip_member'] },

  // Collaboration (notes, polls, messages)
  { key: 'collab_edit', defaultLevel: 'trip_member', allowedLevels: ['trip_owner', 'trip_member'] },

  // Share link management
  { key: 'share_manage', defaultLevel: 'trip_owner', allowedLevels: ['trip_owner', 'trip_member'] },
] as const satisfies readonly PermissionAction[];

/** The name of one configurable action, `'day_edit'`, `'budget_edit'`, … */
export type PermissionKey = (typeof PERMISSION_ACTIONS)[number]['key'];

const PERMISSION_KEYS: ReadonlySet<string> = new Set(PERMISSION_ACTIONS.map((a) => a.key));

/** Whether a string names a configurable action. */
export function isPermissionKey(value: string): value is PermissionKey {
  return PERMISSION_KEYS.has(value);
}

/** Who is asking, relative to the trip the action is on. */
export interface PermissionSubject {
  /** An instance admin passes every check. */
  isAdmin: boolean;
  /** Owns the trip. Always false for an action without a trip. */
  isOwner: boolean;
  /** A member of the trip who is not its owner. */
  isMember: boolean;
}

/**
 * Whether `subject` passes an action whose configured level is `level`. An
 * admin always passes; an `admin` level otherwise refuses everyone; an
 * unrecognised level refuses (fail closed).
 */
export function evaluatePermission(level: PermissionLevel, subject: PermissionSubject): boolean {
  if (subject.isAdmin) return true;
  switch (level) {
    case 'admin':
      return false;
    case 'trip_owner':
      return subject.isOwner;
    case 'trip_member':
      return subject.isOwner || subject.isMember;
    case 'everybody':
      return true;
    default:
      return false;
  }
}
