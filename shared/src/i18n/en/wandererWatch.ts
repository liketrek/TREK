import type { TranslationStrings } from '../types';

const wandererWatch: TranslationStrings = {
  'wanderer.watch.label': 'Check my trails for changes',
  'wanderer.watch.hint': 'A notification when an imported trail may have changed.',
  'wanderer.watch.info':
    'At most once a day, TREK reads the short record of each trail you imported, never its GPX file. It only notifies you: whether a change comes in is up to you, through the source check of the tour.',
  'wanderer.watch.notConnected': 'Connect wanderer first',
  'wanderer.watch.on': 'Background check switched on',
  'wanderer.watch.off': 'Background check switched off',
  'wanderer.watch.failed': 'The background check could not be switched',
  'wanderer.watch.lastRun': 'Last looked {date}',
  'wanderer.watch.neverRun': 'Not looked yet',
  'wanderer.watch.paused': 'Paused until {time}',
  'wanderer.watch.pausedHint': 'wanderer did not answer. TREK waits longer after each failure before it asks again.',
  'wanderer.watch.blocked': 'Token refused',
  'wanderer.watch.blockedHint':
    'wanderer refused the API token. The check resumes once a connection test passes or a new token is saved.',
  'wanderer.watch.hints': 'Hints',
  'wanderer.watch.hintsCount': '{count} open hints',
  'wanderer.watch.hintsCount.one': '{count} open hint',
  'wanderer.watch.empty': 'No open hints',
  'wanderer.watch.dialogTitle': 'Hints on your trails',
  'wanderer.watch.openTour': 'Open the tour',
  'wanderer.watch.checkedAt': 'Looked {date}',
  'wanderer.watch.noticeLabel': 'Background check',
  'wanderer.watch.state.possible_change': 'May have changed',
  'wanderer.watch.state.changed': 'Changed',
  'wanderer.watch.state.unverifiable': 'Not checkable',
  'wanderer.watch.stateHint.possible_change':
    "wanderer changed the trail's time stamp. Only the source check shows whether its content differs.",
  'wanderer.watch.stateHint.changed':
    "wanderer's record shows another name or description. The source check shows everything that changed.",
  'wanderer.watch.stateHint.unverifiable':
    'TREK could not judge this trail, so nothing is said about whether it changed.',
  'wanderer.watch.reason.unavailable': 'Trail out of reach',
  'wanderer.watch.reason.no_change_time': 'No time stamp',
};
export default wandererWatch;
