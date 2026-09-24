import type { TranslationStrings } from '../types';

const native: TranslationStrings = {
  'native.connect.title': 'Anslut till TREK',
  'native.connect.hint': 'Ange adressen du öppnar TREK på i webbläsaren.',
  'native.connect.placeholder': 'trek.example.com',
  'native.connect.submit': 'Anslut',
  'native.connect.checking': 'Kontrollerar…',
  'native.connect.errorInvalid': 'Det ser inte ut som en webbadress.',
  'native.connect.errorUnreachable': 'Ingen server svarar på den här adressen. Kontrollera adressen och din anslutning.',
  'native.connect.errorNotTrek': 'Servern på den här adressen är inte TREK.',
  'native.connect.errorTooOld': 'Den här TREK-servern är för gammal för appen. Den behöver uppdateras först.',
  'native.offline.title': 'Servern går inte att nå',
  'native.offline.hint': 'TREK kunde inte nå {server}. Kontrollera din anslutning och försök igen.',
  'native.offline.retry': 'Försök igen',
  'native.changeServer': 'Byt server',
  'native.login.failed': 'Inloggningen misslyckades. Försök igen.',
  'native.handoff.title': 'Fortsätt i appen',
  'native.handoff.hint': 'Du är inloggad som {name}. Öppna TREK-appen för att slutföra inloggningen där.',
  'native.handoff.open': 'Öppna TREK-appen',
  'native.handoff.switchAccount': 'Använd ett annat konto',
  'native.settings.server': 'Server',
  'native.settings.serverHint': 'Den här appen är ansluten till {server}.',
};

export default native;
