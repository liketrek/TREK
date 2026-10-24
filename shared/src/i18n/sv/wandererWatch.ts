import type { TranslationStrings } from '../types';

const wandererWatch: TranslationStrings = {
  'wanderer.watch.label': 'Kontrollera ändringar i mina leder',
  'wanderer.watch.hint': 'En avisering när en importerad led kan ha ändrats.',
  'wanderer.watch.info':
    'Högst en gång om dagen läser TREK den korta posten för varje led du har importerat, aldrig dess GPX-fil. Den aviserar bara: om en ändring ska tas in bestämmer du själv via turens källkontroll.',
  'wanderer.watch.notConnected': 'Anslut wanderer först',
  'wanderer.watch.on': 'Bakgrundskontroll påslagen',
  'wanderer.watch.off': 'Bakgrundskontroll avstängd',
  'wanderer.watch.failed': 'Bakgrundskontrollen kunde inte ändras',
  'wanderer.watch.lastRun': 'Senast kontrollerad {date}',
  'wanderer.watch.neverRun': 'Inte kontrollerad än',
  'wanderer.watch.paused': 'Pausad till {time}',
  'wanderer.watch.pausedHint':
    'wanderer svarade inte. Efter varje misslyckande väntar TREK längre innan det frågar igen.',
  'wanderer.watch.blocked': 'Token nekad',
  'wanderer.watch.blockedHint':
    'wanderer nekade API-token. Kontrollen fortsätter när ett anslutningstest lyckas eller en ny token sparas.',
  'wanderer.watch.hints': 'Tips',
  'wanderer.watch.hintsCount': '{count} öppna tips',
  'wanderer.watch.hintsCount.one': '{count} öppet tips',
  'wanderer.watch.empty': 'Inga öppna tips',
  'wanderer.watch.dialogTitle': 'Tips om dina leder',
  'wanderer.watch.openTour': 'Öppna turen',
  'wanderer.watch.checkedAt': 'Kontrollerad {date}',
  'wanderer.watch.noticeLabel': 'Bakgrundskontroll',
  'wanderer.watch.state.possible_change': 'Kan ha ändrats',
  'wanderer.watch.state.changed': 'Ändrad',
  'wanderer.watch.state.unverifiable': 'Kan inte kontrolleras',
  'wanderer.watch.stateHint.possible_change':
    'wanderer ändrade ledens tidsstämpel. Bara källkontrollen visar om innehållet skiljer sig.',
  'wanderer.watch.stateHint.changed':
    'Posten i wanderer visar ett annat namn eller en annan beskrivning. Källkontrollen visar allt som ändrats.',
  'wanderer.watch.stateHint.unverifiable': 'TREK kunde inte bedöma leden, så inget sägs om huruvida den ändrats.',
  'wanderer.watch.reason.unavailable': 'Leden går inte att nå',
  'wanderer.watch.reason.no_change_time': 'Ingen tidsstämpel',
};
export default wandererWatch;
