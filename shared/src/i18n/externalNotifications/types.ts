export interface EmailStrings {
  footer: string;
  manage: string;
  madeWith: string;
  openTrek: string;
}

export interface EventText {
  title: string;
  body: string;
}

export type EventTextFn = (params: Record<string, string>) => EventText;

export interface PasswordResetStrings {
  subject: string;
  greeting: string;
  body: string;
  ctaIntro: string;
  expiry: string;
  ignore: string;
}

export type NotificationEventKey =
  | 'trip_invite'
  | 'booking_change'
  | 'trip_reminder'
  | 'todo_due'
  | 'vacay_invite'
  | 'collection_invite'
  | 'photos_shared'
  | 'collab_message'
  | 'packing_tagged'
  | 'version_available'
  | 'synology_session_cleared'
  | 'plugin_notification';

export interface NotificationLocale {
  email: EmailStrings;
  events: Record<NotificationEventKey, EventTextFn>;
  passwordReset: PasswordResetStrings;
}
