import type { TranslationStrings } from '../types';

const docsync: TranslationStrings = {
  'docsync.title': 'Synchronizacja dokumentów',
  'docsync.noProviders': 'Brak dostępnych dostawców dokumentów',
  'docsync.noProvidersHint': 'Administrator instancji włącza ich w sekcji Administracja → Dodatki → Dokumenty.',
  'docsync.addProvider': 'Połącz dostawcę',
  'docsync.test': 'Testuj połączenie',
  'docsync.connect.optional': 'Opcjonalne',
  'docsync.connected': 'Połączono',
  'docsync.chooseFolder': 'Wybierz folder',
  'docsync.noFolders': 'Na tej instancji nic jeszcze nie znaleziono.',
  'docsync.newFolderPlaceholder': 'Nazwa nowego folderu',
  'docsync.syncNow': 'Synchronizuj teraz',
  'docsync.unlink': 'Rozłącz',
  'docsync.confirmUnlink': 'Dokumenty zostają w TREK i w repozytorium. Znika tylko powiązanie między nimi.',
  'docsync.syncEnabled': 'Synchronizuj automatycznie',
  'docsync.deletePolicy': 'Gdy dokument zostanie usunięty',
  'docsync.deleteUnlink': 'Zachowaj obie kopie',
  'docsync.deleteTrash': 'Przenieś do kosza',
  'docsync.conflictPolicy': 'Gdy zmieniły się obie strony',
  'docsync.onConflict.manual': 'Zapytaj mnie',
  'docsync.onConflict.trek_wins': 'Zachowaj kopię z TREK-a',
  'docsync.onConflict.provider_wins': 'Zachowaj kopię z magazynu',
  'docsync.webhookHint':
    'Wklej ten adres URL u swojego dostawcy, aby zmiany docierały natychmiast. Bez tego TREK sprawdza je co jakiś czas.',

  // Pola formularza połączenia. Klucze odpowiadają kolumnie `label` w tabeli
  // document_provider_fields, która przechowuje sufiks klucza, a nie tekst.
  'docsync.providerUrl': 'Adres',
  'docsync.providerApiToken': 'Token API',
  'docsync.providerApiKey': 'Klucz API',
  'docsync.providerAppPassword': 'Hasło aplikacji',
  'docsync.providerAppToken': 'Token aplikacji',
  'docsync.providerUsername': 'Nazwa użytkownika',
  'docsync.providerPassword': 'Hasło',
  'docsync.providerOrganization': 'Identyfikator organizacji',
  'docsync.providerBasePath': 'Folder bazowy',
  'docsync.providerOTP': 'Kod dwuskładnikowy',
  'docsync.allowInsecureTls': 'Zezwalaj na certyfikat z własnym podpisem',

  'docsync.hintPaperlessToken': 'Utwórz go w Paperless-ngx w sekcji My Profile. Ma pełne uprawnienia tego konta.',
  'docsync.hintPapraKey':
    'Utwórz go w Papra w sekcji API keys. Klucze Papra zawsze obejmują wszystkie organizacje, do których należysz.',
  'docsync.hintPapraOrg': 'Identyfikator org_… z paska adresu Papra.',
  'docsync.hintNextcloudLogin': 'Twoja nazwa logowania w Nextcloud, nie adres e-mail.',
  'docsync.hintNextcloudAppPassword':
    'Ustawienia → Bezpieczeństwo → Utwórz nowe hasło aplikacji. Nigdy hasło do konta.',
  'docsync.hintOpenCloudToken': 'Tworzony w OpenCloud w sekcji tokenów aplikacji.',
  'docsync.hintBasePath': 'Miejsce, w którym TREK szuka folderów podróży. Domyślnie /TREK.',
  'docsync.hintSynologyUrl': 'Podaj również port, na przykład https://nas.example.com:5001',
  'docsync.hintSynologyUser': 'Najlepiej osobne konto DSM z dostępem tylko do tego folderu współdzielonego.',
  'docsync.hintSynologyOtp': 'Potrzebny tylko raz, jeśli konto używa uwierzytelniania dwuskładnikowego.',

  'docsync.linkState.never': 'Jeszcze nie synchronizowano',
  'docsync.linkState.ok': 'Aktualne',
  'docsync.linkState.partial': 'Częściowo zsynchronizowane',
  'docsync.linkState.failed': 'Niepowodzenie',
  'docsync.linkState.needs_reauth': 'Zaloguj się ponownie',
  'docsync.linkState.scope_lost': 'Folder zniknął',
  'docsync.linkState.orphaned': 'Właściciel opuścił podróż',

  'docsync.state.pending': 'Oczekuje',
  'docsync.state.synced': 'Zsynchronizowany',
  'docsync.state.conflict': 'Konflikt',
  'docsync.state.rejected_type': 'Typ niedozwolony',
  'docsync.state.too_large': 'Zbyt duży',
  'docsync.state.error': 'Błąd',
  'docsync.state.remote_missing': 'Brak u dostawcy',
  'docsync.state.local_deleted': 'Usunięty w TREK',
  'docsync.state.scope_drift': 'Przeniesiony poza folder',

  'docsync.conflict.resolve': "Rozwiąż {count}",

  'docsync.conflict.title': 'Obie kopie zostały zmienione',
  'docsync.conflict.keepTrek': 'Zachowaj wersję z TREK',
  'docsync.conflict.keepProvider': 'Zachowaj wersję dostawcy',
  'docsync.conflict.keepBoth': 'Zachowaj obie',

  // Przyczyny błędów przesyłane są jako kody, nigdy jako tekst od dostawcy:
  // ten odpowiada po angielsku albo stroną logowania proxy w HTML, a żadna z tych
  // rzeczy nie należy do interfejsu.
  'docsync.error.unreachable': 'Nie udało się połączyć z dostawcą.',
  'docsync.error.tls_untrusted':
    'Certyfikat został odrzucony. Zezwól na certyfikaty z własnym podpisem, jeśli ufasz tej instancji.',
  'docsync.error.unauthorized': 'Dane logowania zostały odrzucone.',
  'docsync.error.forbidden': 'To konto nie ma do tego uprawnień.',
  'docsync.error.not_found': 'Nie znaleziono u dostawcy.',
  'docsync.error.scope_missing': 'Połączony folder już nie istnieje.',
  'docsync.error.rate_limited': 'Dostawca ogranicza liczbę zapytań. TREK spróbuje ponownie później.',
  'docsync.error.too_large': 'Plik jest większy, niż akceptuje dostawca.',
  'docsync.error.unsupported_type': 'Dostawca nie przyjmuje tego typu pliku.',
  'docsync.error.quota_exceeded': 'U dostawcy zabrakło miejsca.',
  'docsync.error.conflict': 'Dokument zmienił się po obu stronach.',
  'docsync.error.checksum_mismatch': 'Transfer nie dotarł w całości.',
  'docsync.error.provider_error': 'Dostawca zgłosił błąd.',
  'docsync.error.timeout': 'Dostawca odpowiadał zbyt długo.',
  'docsync.error.ssrf_blocked': 'Ten adres jest niedozwolony.',
  'docsync.error.mass_delete_guard':
    'Naraz zniknęła większość dokumentów, więc nic nie zostało zmienione. Sprawdź, czy folder jest nadal podłączony.',
  'docsync.error.unknown': 'Coś poszło nie tak.',

  // ── Okno dialogowe ─────────────────────────────────────────────────────────
  'docsync.sidebar.connected': 'Ta podróż',
  'docsync.addAnother': 'Dodaj kolejne',
  'docsync.syncing': 'Synchronizowanie',
  'docsync.card.pickFolder': 'Połączono, wybierz folder',

  'docsync.empty.title': 'Nic jeszcze nie połączono',
  'docsync.empty.hintOwner':
    'Wybierz repozytorium po lewej. TREK trzyma własną kopię wszystkiego, więc nic nie przepadnie, jeśli ono zniknie.',
  'docsync.empty.hintMember': 'Konfiguruje to właściciel podróży. Tak czy inaczej dokumenty zostają w TREK.',

  // Jak każdy produkt porządkuje pliki. Pokazywane, zanim ktokolwiek się połączy,
  // bo o to zapyta następny ekran.
  'docsync.model.paperless': 'Porządkuje pliki tagami',
  'docsync.model.papra': 'Porządkuje pliki tagami, w obrębie organizacji',
  'docsync.model.nextcloud': 'Przechowuje pliki w folderze',
  'docsync.model.opencloud': 'Przechowuje pliki w przestrzeni',
  'docsync.model.synologydrive': 'Przechowuje pliki w folderze na NAS-ie',

  // ── Pasek przepływu ────────────────────────────────────────────────────────
  'docsync.flow.trek': 'TREK',
  'docsync.flow.toProvider': 'Do repozytorium',
  'docsync.flow.toTrek': 'Z repozytorium',
  'docsync.flow.documents': 'dokumentów',
  'docsync.flow.summary.both': 'Dokumenty krążą w obie strony.',
  'docsync.flow.summary.pull': 'Dokumenty tylko przychodzą.',
  'docsync.flow.summary.push': 'Dokumenty tylko wychodzą.',
  'docsync.flow.summaryEditable.both': 'W obie strony. Dotknij pasa, aby go zatrzymać.',
  'docsync.flow.summaryEditable.pull': 'Tylko przychodzą. Dotknij drugiego pasa, aby też wysyłać.',
  'docsync.flow.summaryEditable.push': 'Tylko wychodzą. Dotknij drugiego pasa, aby też pobierać.',

  // ── Jedno powiązanie ───────────────────────────────────────────────────────
  'docsync.binding.settings': 'Ustawienia',
  'docsync.binding.folder': 'Folder',
  'docsync.binding.lastRun': 'Ostatnie uruchomienie',
  'docsync.binding.autoOff': 'Wstrzymane',
  'docsync.binding.neverRun': 'jeszcze nie uruchomiono',
  'docsync.binding.deleteHint': 'Co dzieje się z kopią po drugiej stronie.',
  'docsync.binding.conflictHint': 'Która kopia zostaje, gdy dokument zmieniono w obu miejscach.',
  'docsync.binding.autoHint': 'Sprawdzaj zmiany w tle.',
  'docsync.binding.webhookTitle': 'Natychmiastowe aktualizacje',
  'docsync.binding.copy': 'Kopiuj',
  'docsync.binding.copied': 'Skopiowano',

  // ── Łączenie ───────────────────────────────────────────────────────────────
  'docsync.connect.submit': 'Połącz',
  'docsync.connect.testing': 'Próba połączenia',
  'docsync.connect.okAs': 'Połączono, zalogowano jako {account}',
  'docsync.connect.insecureHint': 'Dla instancji w Twojej sieci z certyfikatem z własnym podpisem.',
  'docsync.connect.about.paperless': 'TREK zapisuje tę podróż pod własnym tagiem i nie rusza reszty Twojego archiwum.',
  'docsync.connect.about.papra':
    'Wybierz organizację, do której należy ta podróż. TREK zapisze ją w niej pod własnym tagiem.',
  'docsync.connect.about.nextcloud':
    'Użyj hasła aplikacji, nie hasła do konta: działa mimo logowania dwuskładnikowego i możesz je unieważnić osobno.',
  'docsync.connect.about.opencloud': 'TREK dostaje własną przestrzeń dla tej podróży, oddzieloną od reszty.',
  'docsync.connect.about.synologydrive':
    'Najlepiej konto DSM sięgające tylko do folderu współdzielonego przeznaczonego dla tej podróży.',

  // ── Wybór miejsca ──────────────────────────────────────────────────────────
  'docsync.scope.title': 'Gdzie ta podróż ma się znaleźć w {provider}?',
  'docsync.scope.intro':
    'Synchronizowane jest tylko to, co jest w środku. Reszta Twojego repozytorium zostaje poza TREK.',
  'docsync.scope.createTitle': 'Utwórz nowe miejsce',
  'docsync.scope.createAction': 'Utwórz',
  'docsync.scope.pickTitle': 'Albo użyj istniejącego',
  'docsync.scope.search': 'Szukaj',
  'docsync.scope.noMatch': 'Nic nie pasuje.',

  // ── Rzeczy, o których musi zdecydować człowiek ─────────────────────────────
  'docsync.issues.title': 'Wymaga uwagi',
  'docsync.issues.conflict': 'Zmieniony w obu miejscach. Wybierz, którą wersję zachować.',
  'docsync.issues.remote_missing': 'Zniknął z repozytorium. Kopia w TREK nadal tu jest.',
  'docsync.issues.rejected_type': 'Ten typ pliku jest tu niedozwolony.',
  'docsync.issues.too_large': 'Większy niż limit.',
  'docsync.issues.error': 'Transfer się nie powiódł.',

  'docsync.error.unknown_provider': 'Ten dostawca nie jest dostępny na tej instancji.',
  'docsync.error.provider_disabled': 'Wstrzymane: administrator wyłączył tego dostawcę. Synchronizacja zostanie wznowiona, gdy znów go włączy.',
  'docsync.binding.reconnect': 'Połącz ponownie',
};

export default docsync;
