import type { TranslationStrings } from '../types';

const wandererWatch: TranslationStrings = {
  'wanderer.watch.label': 'Kontrolli minu radade muudatusi',
  'wanderer.watch.hint': 'Teavitus, kui imporditud rada võib olla muutunud.',
  'wanderer.watch.info':
    'Kõige rohkem kord päevas loeb TREK iga imporditud raja lühikirjet, mitte kunagi selle GPX-faili. See ainult teavitab: kas muudatus üle võtta, otsustad ise matka allika kontrolliga.',
  'wanderer.watch.notConnected': 'Ühenda esmalt wanderer',
  'wanderer.watch.on': 'Taustakontroll on sisse lülitatud',
  'wanderer.watch.off': 'Taustakontroll on välja lülitatud',
  'wanderer.watch.failed': 'Taustakontrolli ei õnnestunud ümber lülitada',
  'wanderer.watch.lastRun': 'Viimati kontrollitud {date}',
  'wanderer.watch.neverRun': 'Veel kontrollimata',
  'wanderer.watch.paused': 'Peatatud kuni {time}',
  'wanderer.watch.pausedHint':
    'wanderer ei vastanud. Pärast iga ebaõnnestumist ootab TREK kauem, enne kui uuesti küsib.',
  'wanderer.watch.blocked': 'Tõend tagasi lükatud',
  'wanderer.watch.blockedHint':
    'wanderer lükkas API-tõendi tagasi. Kontroll jätkub, kui ühenduse test õnnestub või uus tõend salvestatakse.',
  'wanderer.watch.hints': 'Vihjed',
  'wanderer.watch.hintsCount': '{count} avatud vihjet',
  'wanderer.watch.hintsCount.one': '{count} avatud vihje',
  'wanderer.watch.empty': 'Avatud vihjeid pole',
  'wanderer.watch.dialogTitle': 'Vihjed sinu radade kohta',
  'wanderer.watch.openTour': 'Ava matk',
  'wanderer.watch.checkedAt': 'Kontrollitud {date}',
  'wanderer.watch.noticeLabel': 'Taustakontroll',
  'wanderer.watch.state.possible_change': 'Võib olla muutunud',
  'wanderer.watch.state.changed': 'Muudetud',
  'wanderer.watch.state.unverifiable': 'Ei saa kontrollida',
  'wanderer.watch.stateHint.possible_change':
    'wanderer muutis raja ajatemplit. Ainult allika kontroll näitab, kas sisu erineb.',
  'wanderer.watch.stateHint.changed':
    'wanderer kirje näitab teist nime või kirjeldust. Allika kontroll näitab kõike, mis muutus.',
  'wanderer.watch.stateHint.unverifiable': 'TREK ei saanud seda rada hinnata, seega muudatuse kohta ei öelda midagi.',
  'wanderer.watch.reason.unavailable': 'Rada pole kättesaadav',
  'wanderer.watch.reason.no_change_time': 'Ajatempel puudub',
};
export default wandererWatch;
