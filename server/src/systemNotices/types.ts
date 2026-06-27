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
