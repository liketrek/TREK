/**
 * What the app's plan screens do while TREK Cloud's orders are closed, apart
 * from the screens themselves so it can be tested.
 *
 * On iOS only a test build (TestFlight, App Review) may buy then: the App Store
 * charges it nothing and the cloud serves it. On Android the button shows in
 * every build, so the licence testers of the internal test can buy from a
 * release build; their purchases are Play test purchases, which the cloud
 * serves. A real purchase made before the opening is refused at the cloud with
 * `ordering-closed` and never acknowledged, so Google Play refunds it after
 * three days, and the app says so instead of showing a general error.
 */

/** Whether the plans show without a way to buy: orders are closed and this build may not buy before the opening. */
export function opensSoon(opts: { available: boolean; closed: boolean; sandbox: boolean; onPlay: boolean }): boolean {
  return opts.available && opts.closed && !opts.sandbox && !opts.onPlay;
}

/**
 * Whether the cloud refused a purchase because it came before the opening, on
 * Android, where Google Play then refunds it: the app says so rather than
 * showing a general error. On iOS no real purchase gets this far.
 */
export function refundedBeforeOpening(code: string | undefined, onPlay: boolean): boolean {
  return onPlay && code === 'ordering-closed';
}
