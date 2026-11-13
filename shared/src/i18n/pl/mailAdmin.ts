import type { TranslationStrings } from '../types';

const mailAdmin: TranslationStrings = {
  'mailAdmin.title': 'Import wiadomości z rezerwacjami',
  'mailAdmin.hint': 'Przekazane potwierdzenia rezerwacji stają się rezerwacjami we właściwej podróży.',
  'mailAdmin.enabled': 'Importuj wiadomości z rezerwacjami',
  'mailAdmin.enabledHint':
    'Daje każdemu użytkownikowi tej instalacji adres do przekazywania. Po wyłączeniu żaden adres nie przyjmuje poczty.',
  'mailAdmin.transport.label': 'Jak docierają wiadomości',
  'mailAdmin.transport.off': 'Tylko wgrywanie',
  'mailAdmin.transport.imap': 'Skrzynka IMAP',
  'mailAdmin.transport.webhook': 'Webhook', // same-as-en
  'mailAdmin.aiDaily': 'Wiadomości z AI na osobę dziennie',
  'mailAdmin.aiDailyHint': 'Powyżej tego limitu odczytywane są tylko dane rezerwacji czytelne dla maszyn.',
  'mailAdmin.template': 'Szablon adresu',
  'mailAdmin.templateHint': 'Adres do przekazywania, w którym {token} zastępuje kod każdego użytkownika.',
  'mailAdmin.imap.host': 'Serwer',
  'mailAdmin.imap.port': 'Port', // same-as-en
  'mailAdmin.imap.tls': 'Szyfrowanie',
  'mailAdmin.imap.user': 'Użytkownik',
  'mailAdmin.imap.pass': 'Hasło',
  'mailAdmin.imap.mailbox': 'Folder', // same-as-en
  'mailAdmin.imap.mailboxHint': 'Odczytane wiadomości trafiają do TREK/processed.',
  'mailAdmin.webhook.secret': 'Klucz podpisu',
  'mailAdmin.webhook.secretHint':
    'Co najmniej 32 znaki; nadawca podpisuje nim każdą wiadomość. Pusty klucz wyłącza webhook.',
  'mailAdmin.inboundUrl': 'Adres webhooka',
  'mailAdmin.inboundUrlHint': 'Twoja usługa pocztowa wysyła tu każdą wiadomość, w postaci surowej i podpisanej.',
  'mailAdmin.copyUrl': 'Kopiuj adres',
  'mailAdmin.envHint': 'Zmienne środowiskowe (MAIL_INGEST_*) mają pierwszeństwo przed tymi polami.',
  'mailAdmin.loadError': 'Nie udało się wczytać ustawień importu wiadomości.',
  'mailAdmin.problem.secretShort': 'Klucz musi mieć co najmniej 32 znaki.',
  'mailAdmin.problem.portInvalid': 'Wpisz port od 1 do 65535.',
  'mailAdmin.problem.templateToken': 'Adres musi zawierać {token} dla kodu każdego użytkownika.',
  'mailAdmin.problem.dailyInvalid': 'Wpisz liczbę całkowitą od 0 do 1000.',
  'mailAdmin.status.title': 'Status', // same-as-en
  'mailAdmin.status.lastRead': 'Ostatni odczyt {time}',
  'mailAdmin.status.never': 'nigdy',
  'mailAdmin.status.mails': 'Wiadomości, 24 h',
  'mailAdmin.status.added': 'Dodane samodzielnie',
  'mailAdmin.status.waiting': 'Oczekujące',
  'mailAdmin.status.failed': 'Nieudane',
  'mailAdmin.test.run': 'Testuj połączenie',
  'mailAdmin.test.ok': 'Połączono',
  'mailAdmin.test.failed': 'Brak połączenia',
};
export default mailAdmin;
