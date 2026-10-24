import type { TranslationStrings } from '../types';

const wandererWatch: TranslationStrings = {
  'wanderer.watch.label': 'Meine Trails auf Änderungen prüfen',
  'wanderer.watch.hint': 'Eine Benachrichtigung, wenn sich ein importierter Trail geändert haben könnte.',
  'wanderer.watch.info':
    'Höchstens einmal am Tag liest TREK den kurzen Eintrag jedes importierten Trails, nie seine GPX-Datei. Es benachrichtigt dich nur: Ob eine Änderung übernommen wird, entscheidest du selbst über die Quellenprüfung der Tour.',
  'wanderer.watch.notConnected': 'Verbinde zuerst wanderer',
  'wanderer.watch.on': 'Hintergrundprüfung eingeschaltet',
  'wanderer.watch.off': 'Hintergrundprüfung ausgeschaltet',
  'wanderer.watch.failed': 'Die Hintergrundprüfung konnte nicht umgeschaltet werden',
  'wanderer.watch.lastRun': 'Zuletzt geprüft {date}',
  'wanderer.watch.neverRun': 'Noch nicht geprüft',
  'wanderer.watch.paused': 'Pausiert bis {time}',
  'wanderer.watch.pausedHint':
    'wanderer hat nicht geantwortet. Nach jedem Fehlschlag wartet TREK länger, bevor es wieder fragt.',
  'wanderer.watch.blocked': 'Token abgelehnt',
  'wanderer.watch.blockedHint':
    'wanderer hat das API-Token abgelehnt. Die Prüfung läuft weiter, sobald ein Verbindungstest gelingt oder ein neues Token gespeichert ist.',
  'wanderer.watch.hints': 'Hinweise',
  'wanderer.watch.hintsCount': '{count} offene Hinweise',
  'wanderer.watch.hintsCount.one': '{count} offener Hinweis',
  'wanderer.watch.empty': 'Keine offenen Hinweise',
  'wanderer.watch.dialogTitle': 'Hinweise zu deinen Trails',
  'wanderer.watch.openTour': 'Tour öffnen',
  'wanderer.watch.checkedAt': 'Geprüft {date}',
  'wanderer.watch.noticeLabel': 'Hintergrundprüfung',
  'wanderer.watch.state.possible_change': 'Möglicherweise geändert',
  'wanderer.watch.state.changed': 'Geändert',
  'wanderer.watch.state.unverifiable': 'Nicht prüfbar',
  'wanderer.watch.stateHint.possible_change':
    'wanderer hat den Zeitstempel des Trails geändert. Ob sich der Inhalt unterscheidet, zeigt erst die Quellenprüfung.',
  'wanderer.watch.stateHint.changed':
    'Der Eintrag in wanderer hat einen anderen Namen oder eine andere Beschreibung. Was sich alles geändert hat, zeigt die Quellenprüfung.',
  'wanderer.watch.stateHint.unverifiable':
    'TREK konnte diesen Trail nicht beurteilen. Ob er sich geändert hat, bleibt offen.',
  'wanderer.watch.reason.unavailable': 'Trail nicht erreichbar',
  'wanderer.watch.reason.no_change_time': 'Kein Zeitstempel',
};
export default wandererWatch;
