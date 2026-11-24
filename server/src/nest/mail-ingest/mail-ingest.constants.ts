/** The `external_source` of a booking the mail import wrote. */
export const MAIL_EXTERNAL_SOURCE = 'mail';

/** The sources whose keys say a booking is in a trip already: the file import's and the mail import's. */
export const IMPORT_SOURCES: readonly string[] = ['import', MAIL_EXTERNAL_SOURCE];

/** The limits of the import (plan section 11). */
export const MAIL_INGEST_LIMITS = {
  /** The largest mail a self-hosted install takes in, and the largest the TREK Cloud relay hands on. */
  selfHostedMailBytes: 10 * 1024 * 1024,
  cloudMailBytes: 25 * 1024 * 1024,
  /** Bookings stored per mail, and bookings added on their own per mail. */
  storedBookings: 10,
  autoBookings: 5,
  /** Mails one run of the pipeline reads. */
  mailsPerRun: 3,
  /** Mails one address takes in a day. */
  mailsPerAddressPerDay: 50,
  /** Entries waiting in one person's inbox before new mails stop being read. */
  pendingPerUser: 200,
  /** Tries before a mail that keeps failing is given up. */
  maxAttempts: 3,
} as const;

/** How long an added booking can be undone in one tap. */
export const UNDO_WINDOW_DAYS = 7;

/** Trips that ended longer ago than this are not offered for a new booking. */
export const TRIP_LOOKBACK_DAYS = 30;

/** The most trips a mail is weighed against. */
export const MAX_TRIP_CANDIDATES = 20;

/** Random base32 characters in a token: 24 of them are 120 bits. */
export const TOKEN_LENGTH = 24;

/** A booking whose destination lies within this of one of a trip's places belongs to that trip. */
export const NEAR_TRIP_KM = 150;

/** The in-app actions of the forwarder's notification. */
export const UNDO_ACTION = 'mail_ingest_undo';
export const KEEP_ACTION = 'mail_ingest_keep';
