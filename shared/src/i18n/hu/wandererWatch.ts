import type { TranslationStrings } from '../types';

const wandererWatch: TranslationStrings = {
  'wanderer.watch.label': 'Útvonalaim változásainak ellenőrzése',
  'wanderer.watch.hint': 'Értesítés, ha egy importált útvonal megváltozhatott.',
  'wanderer.watch.info':
    'Legfeljebb naponta egyszer a TREK beolvassa minden importált útvonal rövid rekordját, a GPX-fájlját soha. Csak értesít: hogy átveszel-e egy változást, te döntöd el a túra forrásának ellenőrzésével.',
  'wanderer.watch.notConnected': 'Előbb csatlakoztasd a wanderert',
  'wanderer.watch.on': 'Háttérellenőrzés bekapcsolva',
  'wanderer.watch.off': 'Háttérellenőrzés kikapcsolva',
  'wanderer.watch.failed': 'A háttérellenőrzést nem sikerült átkapcsolni',
  'wanderer.watch.lastRun': 'Utoljára ellenőrizve {date}',
  'wanderer.watch.neverRun': 'Még nincs ellenőrizve',
  'wanderer.watch.paused': 'Szüneteltetve eddig: {time}',
  'wanderer.watch.pausedHint': 'A wanderer nem válaszolt. Minden hiba után a TREK tovább vár, mielőtt újra kérdez.',
  'wanderer.watch.blocked': 'Token elutasítva',
  'wanderer.watch.blockedHint':
    'A wanderer elutasította az API-tokent. Az ellenőrzés folytatódik, amint egy kapcsolatteszt sikerül vagy új tokent mentesz.',
  'wanderer.watch.hints': 'Jelzések',
  'wanderer.watch.hintsCount': '{count} nyitott jelzés',
  'wanderer.watch.hintsCount.one': '{count} nyitott jelzés',
  'wanderer.watch.empty': 'Nincs nyitott jelzés',
  'wanderer.watch.dialogTitle': 'Jelzések az útvonalaidról',
  'wanderer.watch.openTour': 'Túra megnyitása',
  'wanderer.watch.checkedAt': 'Ellenőrizve {date}',
  'wanderer.watch.noticeLabel': 'Háttérellenőrzés',
  'wanderer.watch.state.possible_change': 'Változhatott',
  'wanderer.watch.state.changed': 'Megváltozott',
  'wanderer.watch.state.unverifiable': 'Nem ellenőrizhető',
  'wanderer.watch.stateHint.possible_change':
    'A wanderer megváltoztatta az útvonal időbélyegét. Csak a forrás ellenőrzése mutatja meg, hogy a tartalom eltér-e.',
  'wanderer.watch.stateHint.changed':
    'A wanderer rekordja más nevet vagy leírást mutat. A forrás ellenőrzése mindent megmutat, ami változott.',
  'wanderer.watch.stateHint.unverifiable':
    'A TREK nem tudta megítélni ezt az útvonalat, így a változásról semmit sem állít.',
  'wanderer.watch.reason.unavailable': 'Az útvonal nem érhető el',
  'wanderer.watch.reason.no_change_time': 'Nincs időbélyeg',
};
export default wandererWatch;
