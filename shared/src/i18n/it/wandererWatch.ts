import type { TranslationStrings } from '../types';

const wandererWatch: TranslationStrings = {
  'wanderer.watch.label': 'Controlla le modifiche ai miei sentieri',
  'wanderer.watch.hint': 'Una notifica quando un sentiero importato potrebbe essere cambiato.',
  'wanderer.watch.info':
    'Al massimo una volta al giorno TREK legge la breve scheda di ogni sentiero che hai importato, mai il suo file GPX. Ti avvisa soltanto: se accogliere una modifica lo decidi tu, con il controllo della fonte del percorso.',
  'wanderer.watch.notConnected': 'Collega prima wanderer',
  'wanderer.watch.on': 'Controllo in background attivato',
  'wanderer.watch.off': 'Controllo in background disattivato',
  'wanderer.watch.failed': 'Impossibile cambiare il controllo in background',
  'wanderer.watch.lastRun': 'Ultimo controllo {date}',
  'wanderer.watch.neverRun': 'Non ancora controllato',
  'wanderer.watch.paused': 'In pausa fino a {time}',
  'wanderer.watch.pausedHint':
    'wanderer non ha risposto. Dopo ogni errore TREK aspetta più a lungo prima di chiedere di nuovo.',
  'wanderer.watch.blocked': 'Token rifiutato',
  'wanderer.watch.blockedHint':
    'wanderer ha rifiutato il token API. Il controllo riprende quando un test di connessione riesce o viene salvato un nuovo token.',
  'wanderer.watch.hints': 'Segnalazioni',
  'wanderer.watch.hintsCount': '{count} segnalazioni aperte',
  'wanderer.watch.hintsCount.one': '{count} segnalazione aperta',
  'wanderer.watch.empty': 'Nessuna segnalazione aperta',
  'wanderer.watch.dialogTitle': 'Segnalazioni sui tuoi sentieri',
  'wanderer.watch.openTour': 'Apri il percorso',
  'wanderer.watch.checkedAt': 'Controllato {date}',
  'wanderer.watch.noticeLabel': 'Controllo in background',
  'wanderer.watch.state.possible_change': 'Forse cambiato',
  'wanderer.watch.state.changed': 'Cambiato',
  'wanderer.watch.state.unverifiable': 'Non verificabile',
  'wanderer.watch.stateHint.possible_change':
    "wanderer ha cambiato l'orario di modifica del sentiero. Solo il controllo della fonte mostra se il contenuto è diverso.",
  'wanderer.watch.stateHint.changed':
    "La scheda di wanderer mostra un altro nome o un'altra descrizione. Il controllo della fonte mostra tutto ciò che è cambiato.",
  'wanderer.watch.stateHint.unverifiable':
    'TREK non ha potuto valutare questo sentiero, quindi non si dice nulla su un eventuale cambiamento.',
  'wanderer.watch.reason.unavailable': 'Sentiero non raggiungibile',
  'wanderer.watch.reason.no_change_time': 'Nessun orario di modifica',
};
export default wandererWatch;
