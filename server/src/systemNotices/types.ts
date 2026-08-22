export type Display  = 'modal' | 'banner' | 'toast';
export type Severity = 'info'  | 'warn'   | 'critical';

export type NoticeCondition =
  | { kind: 'firstLogin' }
  | { kind: 'always' }
  | { kind: 'noTrips' }
  | { kind: 'existingUserBeforeVersion'; version: string }
  | { kind: 'dateWindow'; startsAt: string; endsAt?: string }
  | { kind: 'role'; roles: Array<'admin' | 'user'> }
  | { kind: 'addonEnabled'; addonId: string }
  // Whether the operator of this install owns its configuration. A notice that
  // asks the reader to update, to check a log or to fund the project assumes
  // they run it themselves.
  | { kind: 'managed'; is: boolean }
  | { kind: 'custom'; id: string };

export interface NoticeMedia {
  src: string;
  srcDark?: string;
  altKey: string;
  placement?: 'hero' | 'inline';
  aspectRatio?: string;
}

export type NoticeCta =
  | { kind: 'nav';    labelKey: string; href: string }
  | { kind: 'link';   labelKey: string; href: string }  // external URL, opens in a new tab
  | { kind: 'action'; labelKey: string; actionId: string; dismissOnAction?: boolean };

export interface NoticeReleaseFeature {
  iconName: string;
  titleKey: string;
  bodyKey: string;
  badgeKey?: string;
}

export interface NoticeReleaseStat {
  /** The figure itself ("~150") — shown as-is, never translated. */
  value: string;
  labelKey: string;
}

/**
 * The release layout: the release on the left, a note from the maintainer on
 * the right. A notice carrying this renders through the dedicated two-column
 * modal instead of the generic notice body.
 */
export interface NoticeRelease {
  version: string;
  eyebrowKey: string;
  tagKey: string;
  headlineKey: string;
  introKey: string;
  features: NoticeReleaseFeature[];
  stats?: NoticeReleaseStat[];
  notes?: { labelKey: string; href: string };
  footnoteKey?: string;
  note: {
    eyebrowKey: string;
    titleKey: string;
    bodyKey: string;
    promiseLabelKey: string;
    promiseTextKey: string;
    bodyAfterKey: string;
    closingKey: string;
    signatureKey: string;
  };
  supportTextKey: string;
}

export interface SystemNotice {
  id: string;
  display: Display;
  severity: Severity;
  titleKey: string;
  bodyKey: string;
  bodyParams?: Record<string, string>;
  icon?: string;
  media?: NoticeMedia;
  highlights?: Array<{ labelKey: string; iconName?: string }>;
  cta?: NoticeCta;
  secondaryCta?: NoticeCta;
  /** Set to render the two-column release modal rather than the generic body. */
  release?: NoticeRelease;
  // Hide this notice on small/mobile viewports (evaluated client-side).
  desktopOnly?: boolean;
  dismissible: boolean;
  conditions: NoticeCondition[];
  publishedAt: string;
  minVersion?: string;
  maxVersion?: string;
  priority?: number;
  // 'per-version': re-show on every app version bump (each install + upgrade) instead of
  // the default permanent one-time dismissal.
  recurring?: 'per-version';
}

// DTO sent to client (same shape minus the conditions — server evaluates those)
export type SystemNoticeDTO = Omit<SystemNotice, 'conditions' | 'publishedAt' | 'minVersion' | 'maxVersion' | 'priority' | 'recurring'>;
