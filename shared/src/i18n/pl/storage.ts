import type { TranslationStrings } from '../types';

const storage: TranslationStrings = {
  'storage.field.root': 'Katalog główny',
  'storage.help.root': 'Bezwzględna ścieżka na serwerze, w której ten backend przechowuje swoje obiekty.',
  'storage.field.endpoint': 'Adres URL punktu końcowego',
  'storage.help.endpoint':
    'Podstawowy adres URL usługi zgodnej z S3, np. https://s3.example.com lub http://127.0.0.1:9000.',
  'storage.field.bucket': 'Bucket',
  'storage.field.accessKeyId': 'Identyfikator klucza dostępu',
  'storage.field.secretAccessKey': 'Tajny klucz dostępu',
  'storage.field.region': 'Region',
  'storage.help.region': 'Pozostaw wartość domyślną, chyba że twój dostawca wymaga konkretnego regionu.',
  'storage.field.keyPrefix': 'Prefiks klucza',
  'storage.help.keyPrefix': 'Opcjonalny prefiks dodawany do każdego klucza obiektu, np. trek/prod.',
  'storage.field.retries': 'Liczba ponowień',
  'storage.field.timeoutMs': 'Limit czasu (ms)',
  'storage.field.primary': 'Backend podstawowy',
  'storage.field.replicas': 'Repliki',
  'storage.title': 'Magazyn',
  'storage.description':
    'Gdzie TREK przechowuje przesłane pliki, zdjęcia i kopie zapasowe. Nic się nie zmienia, dopóki nie zapiszesz.',
  'storage.loading': 'Ładowanie…',
  'storage.saved': 'Zapisano konfigurację magazynu',
  'storage.save': 'Zapisz zmiany',
  'storage.unsaved': 'Niezapisane zmiany',
  'storage.saveConflict':
    'Konfiguracja magazynu zmieniła się od czasu jej wczytania, więc Twoje zmiany nie zostały zapisane. Odrzuć je i wczytaj zapisaną konfigurację ponownie, aby zacząć od nowa.',
  'storage.discardAndReload': 'Odrzuć moje zmiany i wczytaj ponownie',
  'storage.configError.banner': 'Nie udało się wczytać zapisanej konfiguracji magazynu — zapisanie ją zastąpi: {error}',
  'storage.backends.title': 'Backendy',
  'storage.backends.add': 'Dodaj backend',
  'storage.backends.usedBy': 'Używany przez: {categories}',
  'storage.backends.unused': 'Nieprzypisany do żadnej kategorii',
  'storage.backends.envReadOnly': 'Zdefiniowany przez zmienną środowiskową — tylko do odczytu',
  'storage.source.built-in': 'Wbudowany',
  'storage.source.env': 'Środowisko',
  'storage.source.settings': 'Ustawienia',
  'storage.type.local': 'Lokalny',
  'storage.type.s3': 'S3',
  'storage.type.mirror': 'Mirror',
  'storage.actions.test': 'Testuj',
  'storage.actions.edit': 'Edytuj',
  'storage.actions.remove': 'Usuń',
  'storage.test.running': 'Testowanie…',
  'storage.test.ok': 'Połączenie OK',
  'storage.test.failed': 'Test nieudany',
  'storage.remove.title': 'Usuń backend',
  'storage.remove.body': 'Usunąć {name} z konfiguracji? Serwer odrzuci zapis, jeśli coś nadal od niego zależy.',
  'storage.remove.stillAssigned': 'Nadal przypisany do: {categories}',
  'storage.form.addTitle': 'Dodaj backend',
  'storage.form.editTitle': 'Edytuj backend',
  'storage.form.name': 'Nazwa',
  'storage.form.type': 'Typ',
  'storage.form.apply': 'Zastosuj',
  'storage.form.cancel': 'Anuluj',
  'storage.form.duplicateName': 'Backend o nazwie {name} już istnieje',
  'storage.categories.title': 'Kategorie',
  'storage.categories.default': 'domyślna',
  'storage.categories.reassignWarning':
    'Istniejące obiekty nie są przenoszone: nowe obiekty trafiają do nowo przypisanego backendu, stare pozostają tam, gdzie są.',
  'storage.category.files': 'Dokumenty podróży',
  'storage.category.journey': 'Zdjęcia z dziennika podróży',
  'storage.category.covers': 'Zdjęcia okładek',
  'storage.category.avatars': 'Zdjęcia profilowe',
  'storage.category.places': 'Zdjęcia miejsc',
  'storage.category.photos-google': 'Pamięć podręczna zdjęć Google',
  'storage.category.photos-trek': 'Pamięć podręczna zdjęć TREK',
  'storage.category.backups': 'Kopie zapasowe',

  // What each category stores — rendered under the label in the category map.
  'storage.categoryDesc.files':
    'Załączniki plikowe przesłane do podróży — bilety, PDF-y, potwierdzenia rezerwacji i pliki udostępnione na czacie podróży.',
  'storage.categoryDesc.journey': 'Zdjęcia i miniatury dołączone do wpisów dziennika podróży.',
  'storage.categoryDesc.covers': 'Zdjęcia okładek podróży i kolekcji, w tym okładki pobrane z Unsplash.',
  'storage.categoryDesc.avatars': 'Zdjęcia profilowe kont użytkowników.',
  'storage.categoryDesc.places': 'Obrazy dołączone do miejsc i miejsc w kolekcjach — przesłane lub zaimportowane.',
  'storage.categoryDesc.photos-google':
    'Kopie zdjęć z Google Places przechowywane w pamięci podręcznej — można je pobrać ponownie, ich utrata jest bezpieczna.',
  'storage.categoryDesc.photos-trek':
    'Zdjęcia w pamięci podręcznej z usługi zdjęć TREK używanej przez funkcję Zdjęcia (Memories) — można je pobrać ponownie, ich utrata jest bezpieczna.',
  'storage.categoryDesc.backups':
    'Archiwa kopii zapasowych serwera tworzone przez panel Kopia zapasowa lub harmonogram.',
  'storage.health.title': 'Stan',
  'storage.health.allClear': 'Nie odnotowano żadnych błędów replik.',
  'storage.health.seedFile':
    'Plik startowy storage-config.json jest obecny, ale ignorowany — wiersze konfiguracji już istnieją. Zarządzaj magazynem tutaj.',
  'storage.health.failureLine': '{op} dla {key} na {backend} nie powiodło się: {error}',

  // Replicas-on-primary mirror UX (2026-08-20 spec)
  'storage.mirror.targets': 'Cele mirrora',
  'storage.mirror.targetsHelp': 'Każdy zapis do tego backendu jest również kopiowany do każdego wybranego celu.',
  'storage.mirror.latencyNote':
    'Repliki są zapisywane jedna po drugiej podczas każdego przesyłania — wolny lub niedostępny cel spowalnia każde przesyłanie każdej kategorii na tym backendzie.',
  'storage.mirror.mirroredTo': 'Lustrzane do: {targets}',
  'storage.mirror.replicaOf': 'Replika: {primaries}',
  'storage.mirror.cacheWarning':
    'Niezalecane: ta kategoria zawiera treści możliwe do ponownego pobrania — ich replikowanie jest zwykle marnotrawstwem.',
  'storage.mirror.degenerate.duplicate-mirror':
    'Drugi mirror otacza {primary} — panel zarządza tylko pierwszym; usuń ten, aby zarządzać mirrorowaniem z {primary}.',
  'storage.mirror.degenerate.env-primary':
    'Otacza backend zdefiniowany przez zmienną środowiskową — nieedytowalny tutaj.',
  'storage.mirror.degenerate.missing-primary': 'Odwołuje się do backendu, który już nie istnieje.',
  'storage.remove.usedAsReplicaBy': 'Używany jako replika przez: {primaries}',

  // Backfill + usage (backfill/stats/notifications spec)
  'storage.sync.now': 'Synchronizuj teraz',
  'storage.sync.running': 'Synchronizacja… {done}/{total}',
  'storage.sync.counts': '{copied} skopiowanych · {skipped} pominiętych · {failed} nieudanych',
  'storage.sync.cancel': 'Anuluj synchronizację',
  'storage.sync.done': 'Synchronizacja zakończona: {copied} skopiowanych, {deleted} usuniętych, {failed} nieudanych',
  'storage.sync.cancelled': 'Synchronizacja anulowana',
  'storage.sync.error': 'Synchronizacja nie powiodła się: {error}',
  'storage.sync.prompt': 'Istniejące obiekty nie zostały jeszcze zreplikowane — zsynchronizować teraz?',
  'storage.sync.dismiss': 'Odrzuć',
  'storage.usage.line': '{objects} obiektów · {size}',
  'storage.usage.computed': 'Wykorzystanie obliczone {age}',
  'storage.usage.never': 'Wykorzystanie nie zostało jeszcze obliczone',
  'storage.usage.refresh': 'Odśwież',
  'storage.usage.compute': 'Oblicz teraz',
  'storage.usage.legacyNote': 'obejmuje starą bibliotekę zdjęć',

  // Category migration (copy → flip → delta sweep)
  'storage.migrate.promptTitle': 'Przenieść istniejące obiekty do nowego backendu?',
  'storage.migrate.promptLine': '{category}: {objects} obiektów ({size}) z {from} do {to}',
  'storage.migrate.promptLineUnknown':
    '{category}: nieznany rozmiar (wykorzystanie jeszcze nie obliczone) z {from} do {to}',
  'storage.migrate.move': 'Przenieś istniejące obiekty',
  'storage.migrate.routeOnly': 'Przekieruj tylko nowe zapisy',
  'storage.migrate.running': 'Przenoszenie {category}… {done}/{total}',
  'storage.migrate.done': 'Przenoszenie zakończone: {copied} skopiowanych, {skipped} pominiętych',
  'storage.migrate.doneFailures': '{failed} nie powiodło się — te obiekty nie zostały skopiowane do nowego backendu',
  'storage.migrate.failed': 'Przenoszenie nie powiodło się: {error} — kategoria nie została przełączona',
  'storage.migrate.cancelled': 'Przenoszenie anulowane — nic nie zostało przełączone',
  'storage.migrate.reclaimable': '{objects} obiektów ({size}) pozostaje na {from} — odzyskaj ręcznie',
  'storage.migrate.cancel': 'Anuluj przenoszenie',
  'storage.migrate.promptCancel': 'Anuluj',
  'storage.migrate.queued': 'W kolejce: {categories}',
  'storage.migrate.queueDropped':
    'Nie udało się rozpocząć kolejnego przenoszenia — pozostała kolejka została wyczyszczona: {categories}',
};
export default storage;
