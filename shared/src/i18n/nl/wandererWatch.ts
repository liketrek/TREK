import type { TranslationStrings } from '../types';

const wandererWatch: TranslationStrings = {
  'wanderer.watch.label': 'Mijn trails op wijzigingen controleren',
  'wanderer.watch.hint': 'Een melding wanneer een geïmporteerde trail mogelijk is gewijzigd.',
  'wanderer.watch.info':
    'Hooguit één keer per dag leest TREK de korte gegevens van elke trail die je hebt geïmporteerd, nooit het GPX-bestand. Het meldt alleen: of een wijziging wordt overgenomen, bepaal je zelf via de broncontrole van de tocht.',
  'wanderer.watch.notConnected': 'Koppel eerst wanderer',
  'wanderer.watch.on': 'Achtergrondcontrole ingeschakeld',
  'wanderer.watch.off': 'Achtergrondcontrole uitgeschakeld',
  'wanderer.watch.failed': 'De achtergrondcontrole kon niet worden omgezet',
  'wanderer.watch.lastRun': 'Laatst gecontroleerd {date}',
  'wanderer.watch.neverRun': 'Nog niet gecontroleerd',
  'wanderer.watch.paused': 'Gepauzeerd tot {time}',
  'wanderer.watch.pausedHint':
    'wanderer gaf geen antwoord. Na elke mislukking wacht TREK langer voordat het opnieuw vraagt.',
  'wanderer.watch.blocked': 'Token geweigerd',
  'wanderer.watch.blockedHint':
    'wanderer heeft het API-token geweigerd. De controle gaat verder zodra een verbindingstest slaagt of een nieuw token is opgeslagen.',
  'wanderer.watch.hints': 'Meldingen',
  'wanderer.watch.hintsCount': '{count} open meldingen',
  'wanderer.watch.hintsCount.one': '{count} open melding',
  'wanderer.watch.empty': 'Geen open meldingen',
  'wanderer.watch.dialogTitle': 'Meldingen over je trails',
  'wanderer.watch.openTour': 'Tocht openen',
  'wanderer.watch.checkedAt': 'Gecontroleerd {date}',
  'wanderer.watch.noticeLabel': 'Achtergrondcontrole',
  'wanderer.watch.state.possible_change': 'Mogelijk gewijzigd',
  'wanderer.watch.state.changed': 'Gewijzigd',
  'wanderer.watch.state.unverifiable': 'Niet te controleren',
  'wanderer.watch.stateHint.possible_change':
    'wanderer heeft het tijdstempel van de trail gewijzigd. Alleen de broncontrole laat zien of de inhoud verschilt.',
  'wanderer.watch.stateHint.changed':
    'De gegevens in wanderer tonen een andere naam of beschrijving. De broncontrole laat alles zien wat is gewijzigd.',
  'wanderer.watch.stateHint.unverifiable':
    'TREK kon deze trail niet beoordelen, dus er wordt niets gezegd over een wijziging.',
  'wanderer.watch.reason.unavailable': 'Trail niet bereikbaar',
  'wanderer.watch.reason.no_change_time': 'Geen tijdstempel',
};
export default wandererWatch;
