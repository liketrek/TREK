import type { TranslationStrings } from '../types';

// English fallback until 'pl' is translated.
const help: TranslationStrings = {
  'help.title': 'Pomoc i dokumentacja',
  'help.search': 'Szukaj w dokumentacji…',
  'help.contents': 'Spis treści',
  'help.noResults': 'Brak pasujących stron.',
  'help.errorTitle': 'Nie udało się wczytać tej strony',
  'help.errorBody': 'Treści pomocy są pobierane z wiki TREK. Sprawdź połączenie i spróbuj ponownie.',

  // center
  'help.center.button': 'Pomoc do tego ekranu',
  'help.center.title': 'Pomoc',
  'help.center.onThisScreen': 'Na tym ekranie',
  'help.center.screens': 'Ekrany',
  'help.center.thisScreen': 'Bieżący',
  'help.center.subScreens': 'Podekrany: {count}',
  'help.center.subScreens.one': '{count} podekran',
  'help.center.subScreens.few': '{count} podekrany',
  'help.center.subScreens.many': '{count} podekranów',
  'help.center.subScreensLabel': 'Podekrany',
  'help.center.guidesCount': 'Poradniki: {count}',
  'help.center.guidesCount.one': '{count} poradnik',
  'help.center.guidesCount.few': '{count} poradniki',
  'help.center.guidesCount.many': '{count} poradników',
  'help.center.goToScreen': 'Przejdź do: {screen}',
  'help.center.overview': 'Przegląd',
  'help.center.howTo': 'Jak…',
  'help.center.searchPlaceholder': 'Szukaj w poradnikach i dokumentacji…',
  'help.center.searchEmpty': 'Brak wyników dla „{query}”.',
  'help.center.searchGuides': 'Poradniki',
  'help.center.searchDocs': 'Dokumentacja',
  'help.center.searchError': 'Wyszukiwanie jest chwilowo niedostępne.',
  'help.center.back': 'Wstecz',
  'help.center.close': 'Zamknij pomoc',
  'help.center.steps': '{count} kroku',
  'help.center.steps.one': '{count} krok',
  'help.center.steps.few': '{count} kroki',
  'help.center.steps.many': '{count} kroków',
  'help.center.step': 'Krok {n}',
  'help.center.stepsLabel': 'Kroki',
  'help.center.stepOf': 'Krok {n} z {total}',
  'help.center.screenshot': 'Zrzut ekranu',
  'help.center.result': 'Efekt',
  'help.center.tips': 'Warto wiedzieć',
  'help.center.related': 'Powiązane',
  'help.center.openDocs': 'Otwórz w Pomocy i dokumentacji',
  'help.center.docsSection': 'W dokumentacji',
  'help.center.noContext': 'Dla tego ekranu nie ma jeszcze poradnika.',
  'help.center.noContextHint': 'Przeszukaj dokumentację albo napisz nam, czego szukasz.',
  'help.center.feedback': 'Czegoś brakuje?',
  'help.center.feedbackLink': 'Napisz do nas na GitHubie',
  'help.center.discord': 'Zapytaj na Discordzie',
  'help.center.quick': 'Na skróty',
  'help.center.guide': 'Poradnik',
  'help.center.tour': 'Przewodnik krok po kroku',
  'help.center.imageAlt': 'Krok {n} z „{title}”',

  // ctx
  'help.ctx.dashboard.title': 'Panel',
  'help.ctx.dashboard.summary':
    'Panel pokazuje wszystkie Twoje podróże. Karta u góry, wystylizowana na kartę pokładową, przedstawia podróż, która właśnie trwa lub jest najbliższa. Wiersz pod nią podsumowuje, ile już podróżowałeś, a karty niżej to wszystkie podróże, które planujesz, zarchiwizowałeś lub już zakończyłeś.',
  'help.ctx.dashboard.bullet.1':
    'Karta pokładowa: trwająca lub najbliższa podróż z datami, uczestnikami, miejscami i odliczaniem. Kliknij ją, żeby otworzyć podróż. Cztery przyciski w prawym górnym rogu służą do edycji, duplikowania, archiwizowania i usuwania.',
  'help.ctx.dashboard.bullet.2':
    'Statystyki podróży: odwiedzone kraje, podróże, dni w drodze i przebyty samolotem dystans, ze wszystkich Twoich podróży.',
  'help.ctx.dashboard.bullet.3':
    'Karty podróży z filtrami „Zaplanowane”, „Zarchiwizowana” i „Zakończone”, w widoku siatki lub listy. Pole wyszukiwania nad nimi przeszukuje wszystkie twoje podróże naraz, według nazwy, daty lub miejsca w podróży. Przyciski do edycji, duplikowania, archiwizowania i usuwania podróży są w prawym górnym rogu zdjęcia na każdej karcie.',
  'help.ctx.dashboard.bullet.4':
    'Widżety po prawej: przelicznik walut, „Kolekcje” (gdy włączony jest dodatek „Kolekcje”), zegary światowe, nadchodzące rezerwacje i widżety z wtyczek. Wbudowane widżety możesz wyłączyć w „Ustawieniach”, w sekcji „Wygląd”.',
  'help.ctx.dashboard.bullet.5': 'Nową podróż założysz kartą „Nowa podróż” albo przyciskiem w prawym dolnym rogu.',

  // create-trip
  'help.guide.create-trip.title': 'Utwórz podróż',
  'help.guide.create-trip.goal': 'Załóż nową podróż z nazwą, datami i zdjęciem na okładkę.',
  'help.guide.create-trip.step.1':
    'Kliknij „Nowa podróż”. Karta na końcu listy podróży i przycisk w prawym dolnym rogu działają tak samo.',
  'help.guide.create-trip.step.2': 'Nadaj podróży nazwę. To jedyne wymagane pole, resztę możesz dodać później.',
  'help.guide.create-trip.step.3':
    'Wybierz datę rozpoczęcia i zakończenia. TREK utworzy po jednym dniu na każdą datę, więc od razu możesz planować. Nie znasz jeszcze dat? Zostaw oba pola puste i wpisz zamiast tego „Liczbę dni”.',
  'help.guide.create-trip.step.4':
    'Opcjonalnie dodaj zdjęcie na okładkę. Prześlij własne, przeciągnij je lub wklej albo poszukaj celu podróży w Unsplash.',
  'help.guide.create-trip.step.5': 'Kliknij „Utwórz nową podróż”.',
  'help.guide.create-trip.result':
    'Podróż pojawia się na pulpicie. Jeśli to Twoja najbliższa podróż, zobaczysz ją na karcie pokładowej u góry.',
  'help.guide.create-trip.tip.1':
    'Daty możesz zmienić później. Jeśli masz już rezerwacje, TREK zapyta, czy przesunąć je razem z dniami.',
  'help.guide.create-trip.tip.2':
    'Na walutę podróży wybraną tutaj przeliczane są wszystkie koszty. Wybierz walutę kraju, do którego jedziesz.',

  // edit-trip
  'help.guide.edit-trip.title': 'Edytuj podróż',
  'help.guide.edit-trip.goal': 'Zmień nazwę podróży, jej daty lub ustawienia.',
  'help.guide.edit-trip.step.1': 'Kliknij ołówek w prawym górnym rogu karty podróży (lub karty pokładowej).',
  'help.guide.edit-trip.step.2':
    'Zmień, co trzeba: nazwę, opis, daty, okładkę, walutę, przypomnienie lub towarzyszy podróży.',
  'help.guide.edit-trip.step.3': 'Kliknij „Aktualizuj”.',
  'help.guide.edit-trip.result': 'Karta od razu się aktualizuje u wszystkich uczestników podróży.',
  'help.guide.edit-trip.tip.1':
    'Gdy przesuwasz początek podróży z rezerwacjami, TREK pyta, czy rezerwacje też mają się przesunąć. Przy skracaniu podróży zobaczysz listę dni, które znikną, wraz z tym, co w nich zaplanowano. Zmiany zapisują się dopiero po kliknięciu Usuń dni i zapisz.',

  // cover-image
  'help.guide.cover-image.title': 'Ustaw zdjęcie okładki',
  'help.guide.cover-image.goal': 'Dodaj do podróży zdjęcie, które pojawi się na jej karcie i na karcie pokładowej.',
  'help.guide.cover-image.step.1': 'Otwórz formularz edycji podróży ołówkiem na jej karcie.',
  'help.guide.cover-image.step.2':
    'W sekcji „Okładka” upuść lub wklej zdjęcie, kliknij, żeby je przesłać, albo wpisz cel podróży i kliknij „Szukaj w Unsplash”.',
  'help.guide.cover-image.step.3': 'Wybierz zdjęcie i kliknij „Aktualizuj”.',
  'help.guide.cover-image.result':
    'Zdjęcie zostaje zapisane w podróży i jest widoczne wszędzie, gdzie ta podróż się pojawia.',
  'help.guide.cover-image.tip.1':
    'Zdjęcia z wyszukiwarki Unsplash dostają automatycznie podpis autora, a Twoje własne pliki zostają na Twoim serwerze.',

  // duplicate-trip
  'help.guide.duplicate-trip.title': 'Duplikowanie podróży',
  'help.guide.duplicate-trip.goal': 'Użyj podróży jako szablonu nowej podróży.',
  'help.guide.duplicate-trip.step.1': 'Kliknij ikonę duplikowania w prawym górnym rogu karty.',
  'help.guide.duplicate-trip.step.2': 'Sprawdź, co zostanie skopiowane, a co nie, i kliknij „Kopiuj podróż”.',
  'help.guide.duplicate-trip.result':
    'Na panelu pojawia się kopia z nazwą oryginału i dopiskiem (kopia). Możesz zmienić jej nazwę i daty.',
  'help.guide.duplicate-trip.tip.1':
    'Kopiowane są dni, miejsca, wycieczki i trasy road tripów, rezerwacje, pozycje budżetu, listy pakowania, zadania i notatki do dni. Listy pakowania i zadania trafiają do kopii jako niezaznaczone. Nie kopiują się członkowie, czat, ankiety, pliki ani linki udostępniania.',

  // archive-trip
  'help.guide.archive-trip.title': 'Zarchiwizuj i przywróć podróż',
  'help.guide.archive-trip.goal': 'Usuń podróż z listy podróży bez kasowania jej i przywróć ją, kiedy zechcesz.',
  'help.guide.archive-trip.step.1': 'Kliknij ikonę archiwum w prawym górnym rogu karty.',
  'help.guide.archive-trip.step.2': 'Aby znów ją zobaczyć, przełącz filtr nad kartami na „Zarchiwizowana”.',
  'help.guide.archive-trip.step.3':
    'Kliknij „Przywróć” na karcie, a podróż wróci do „Zaplanowane” albo, jeśli jej daty już minęły, do „Zakończone”.',
  'help.guide.archive-trip.result':
    'Zarchiwizowane podróże zachowują wszystkie dane. Nie są już widoczne na pulpicie ani w kalendarzu ze wszystkimi podróżami.',

  // delete-trip
  'help.guide.delete-trip.title': 'Usuwanie podróży',
  'help.guide.delete-trip.goal': 'Usuń podróż na stałe.',
  'help.guide.delete-trip.step.1': 'Kliknij ikonę kosza w prawym górnym rogu karty.',
  'help.guide.delete-trip.step.2':
    'Potwierdź przyciskiem „Usuń”. Okno podaje nazwę podróży, więc masz pewność, że usuwasz właściwą.',
  'help.guide.delete-trip.result':
    'Podróż, jej dni, miejsca, rezerwacje i pliki zostają usunięte. Tego nie da się cofnąć, więc jeśli nie masz pewności, lepiej zarchiwizuj podróż.',

  // filter-and-view
  'help.guide.filter-and-view.title': 'Znajdź zakończone podróże i przełącz siatkę na listę',
  'help.guide.filter-and-view.goal':
    'Wyświetl zakończone lub zarchiwizowane podróże i wybierz układ, który Ci odpowiada.',
  'help.guide.filter-and-view.step.1':
    'Użyj przełączników „Zaplanowane”, „Zarchiwizowana” i „Zakończone” nad kartami. „Zakończone” to wszystkie podróże, których data końcowa już minęła.',
  'help.guide.filter-and-view.step.2':
    'Kliknij ikonę listy, aby przełączyć się na zwartą listę; kliknij ją ponownie, aby wrócić do siatki.',
  'help.guide.filter-and-view.result': 'Pulpit zapamiętuje Twój układ na tym urządzeniu.',

  // calendar-feed
  'help.guide.calendar-feed.title': 'Subskrypcja wszystkich podróży w kalendarzu',
  'help.guide.calendar-feed.goal':
    'Zobacz dni i rezerwacje wszystkich aktywnych podróży w aplikacji kalendarza, zawsze zsynchronizowane.',
  'help.guide.calendar-feed.step.1': 'Kliknij ikonę kalendarza obok przełącznika widoku.',
  'help.guide.calendar-feed.step.2':
    'Kliknij „Włącz subskrypcję kalendarza”. TREK utworzy prywatny link do kalendarza.',
  'help.guide.calendar-feed.step.3':
    'Kliknij „Dodaj do Kalendarza Google” lub „Dodaj do Kalendarza Apple / Outlook”. W przypadku innej aplikacji kalendarza rozwiń „Lub skopiuj link ręcznie” i skopiuj stamtąd link.',
  'help.guide.calendar-feed.result':
    'Każda aktywna podróż pojawia się w Twoim kalendarzu i aktualizuje się automatycznie. Podróże zarchiwizowane i zakończone ponad 90 dni temu nie są uwzględniane.',
  'help.guide.calendar-feed.tip.1':
    'Nie udostępniaj tego linku: każdy, kto go ma, może odczytać kalendarz. Jeśli trafił do innych osób, „Wygeneruj ponownie” utworzy nowy link, a stary przestanie działać. „Wyłącz” całkowicie usuwa link.',

  // widgets
  'help.guide.widgets.title': 'Wybierz widżety pulpitu',
  'help.guide.widgets.goal': 'Pokaż lub ukryj wiersz statystyk i widżety po prawej.',
  'help.guide.widgets.step.1': 'Otwórz menu pod awatarem w prawym górnym rogu i wybierz „Ustawienia”.',
  'help.guide.widgets.step.2': 'Przejdź na kartę „Wygląd”.',
  'help.guide.widgets.step.3':
    'W sekcji widgetów panelu włączaj lub wyłączaj każdy widget osobno dla komputera i telefonu. Opcja prawego paska bocznego wyłącza od razu całą prawą kolumnę.',
  'help.guide.widgets.step.4': 'Wróć na panel. Zmiana jest widoczna od razu.',
  'help.guide.widgets.result':
    'Gdy ukryjesz widżety, podróże zyskają więcej miejsca. Wyłącz całą prawą kolumnę, aby wyśrodkować układ.',
  'help.guide.widgets.link': 'Otwórz ustawienia wyglądu',

  // currency-widget
  'help.guide.currency-widget.title': 'Przeliczaj waluty',
  'help.guide.currency-widget.goal': 'Przelicz kwotę między dwiema walutami po aktualnych kursach.',
  'help.guide.currency-widget.step.1': 'Wpisz kwotę i wybierz dwie waluty.',
  'help.guide.currency-widget.step.2':
    'Strzałka między walutami zamienia je miejscami, a okrągła strzałka odświeża kurs.',
  'help.guide.currency-widget.result':
    'Twoja para walut jest zapisana na koncie, więc jest taka sama na każdym urządzeniu.',
  'help.guide.currency-widget.tip.1':
    'Kursy pochodzą z bezpłatnej usługi Frankfurter. Okrągła strzałka w rogu widżetu pobiera najnowsze.',

  // timezones-widget
  'help.guide.timezones-widget.title': 'Dodaj zegary świata',
  'help.guide.timezones-widget.goal': 'Sprawdzaj czas lokalny w miejscach docelowych.',
  'help.guide.timezones-widget.step.1':
    'Kliknij + w widżecie Strefy czasowe, wyszukaj miasto, na przykład Lizbonę, i wybierz je z listy.',
  'help.guide.timezones-widget.step.2': 'Żeby usunąć zegar, najedź na niego kursorem i kliknij × po prawej stronie.',
  'help.guide.timezones-widget.result': 'Zegary są zapisywane na Twoim koncie.',
  'help.guide.search-trips.title': 'Wyszukaj podróże',
  'help.guide.search-trips.goal':
    'Znajdź podróż po nazwie, dacie lub zaplanowanym w niej miejscu, także wśród zarchiwizowanych.',
  'help.guide.search-trips.step.1':
    'Zacznij pisać w polu „Szukaj podróży lub miejsc” nad kartami. Lista filtruje się na bieżąco i obejmuje jednocześnie podróże zaplanowane, zarchiwizowane i zakończone.',
  'help.guide.search-trips.step.2':
    'Jeśli podróż pasuje ze względu na jedno z jej miejsc, to miejsce jest widoczne pod tytułem podróży. Kliknij x w polu lub naciśnij Escape, aby znów zobaczyć wszystkie podróże.',
  'help.guide.search-trips.result':
    'Na pulpicie zostają tylko pasujące podróże. Wyczyść pole wyszukiwania, aby znów zobaczyć wszystkie.',
  'help.guide.search-trips.tip.1':
    'Możesz też szukać po dacie: wpisz miesiąc i rok, na przykład maj 2027 albo 2027-05, a zobaczysz podróże z tego miesiąca.',
  'help.guide.search-trips.tip.2':
    'Gdy wyszukiwanie jest aktywne, przełącznik „Zaplanowane”, „Zarchiwizowana” i „Zakończone” nie działa, więc żadnej podróży nie ukryje niewłaściwy filtr.',

  // ── Screen: vacay ──────────────────────────────────────────────────────────
  'help.ctx.vacay.title': 'Urlopy',
  'help.ctx.vacay.summary':
    'Urlopy to Twój osobisty planer urlopowy: ile dni urlopu masz w roku, które już wpisałeś i ile Ci zostało. Siatka pokazuje cały rok. Na pasku bocznym znajdziesz wybór roku, osoby, z którymi planujesz, udostępnione Ci kalendarze, legendę i Twój wymiar urlopu.',
  'help.ctx.vacay.bullet.1':
    'Siatka roku: dwanaście kart miesięcy, po jednej komórce na dzień. Kliknij dzień, aby go wpisać lub wyczyścić. Mała niebieska kropka oznacza dni, które obejmuje już jakaś podróż.',
  'help.ctx.vacay.bullet.2':
    'Pasek narzędzi na dole: pierwszy przycisk, z twoim imieniem i kolorem, służy do zapisywania urlopu, a „Urlop firmowy” oznacza dni wolne dla całej firmy. „Pół dnia” i „Odbiór” zmieniają to, co zapisuje kliknięcie; „Pół dnia” działa też przy urlopie firmowym.',
  'help.ctx.vacay.bullet.3':
    '„Wymiar”: „Dni”, „Użyto” i „Pozostało” dla wybranego roku, a obok dni przeniesione i dni odbioru. Kliknij nagłówek karty, żeby ją zwinąć.',
  'help.ctx.vacay.bullet.4':
    '„Osoby” to ludzie, z którymi dzielisz plan, każdy w swoim kolorze. „Udostępnione kalendarze” pokazują dni wolne innych osób jako kolorowe obwódki. Nie możesz ich edytować.',
  'help.ctx.vacay.bullet.5':
    'W ustawieniach określisz weekendy, początek tygodnia, przenoszenie urlopu, swój rok urlopowy, urlopy firmowe, kalendarze świąt i ferii szkolnych, a przy wspólnym planowaniu znajdziesz tam też „Rozłącz kalendarze”.',
  // log-day
  'help.guide.log-day.title': 'Zapisz dzień urlopu',
  'help.guide.log-day.goal': 'Zaznacz dzień wolny w siatce roku i zobacz, jak zmienia się saldo.',
  'help.guide.log-day.step.1':
    'Sprawdź pierwszy przycisk na pasku narzędzi na dole. Gdy widać na nim Twoje imię i kolor, kliknięcie dnia zapisuje Ci dzień urlopu.',
  'help.guide.log-day.step.2':
    'Kliknij dzień na dowolnej karcie miesiąca. Dzień wypełni się Twoim kolorem, a „Użyto” wzrośnie o jeden dzień.',
  'help.guide.log-day.step.3': 'Kliknij ten sam dzień ponownie, aby usunąć oznaczenie.',
  'help.guide.log-day.result':
    'Dzień jest wpisany. „Dni”, „Użyto” i „Pozostało” od razu się aktualizują, a każdy, kto jest połączony z Twoim planem, natychmiast widzi zmianę.',
  'help.guide.log-day.tip.1':
    'Gdy w Ustawieniach włączono Blokuj weekendy, nie da się zapisać weekendu. Weekend zapisany wcześniej nadal można wyczyścić.',
  'help.guide.log-day.tip.2':
    'Niebieska kropka w komórce oznacza, że ten dzień obejmuje jedna z Twoich podróży, więc od razu widzisz, gdzie urlop pokrywa się z wyjazdem.',
  // half-day
  'help.guide.half-day.title': 'Wpisywanie pół dnia',
  'help.guide.half-day.goal': 'Weź wolne popołudnie i wykorzystaj tylko pół dnia z puli urlopowej.',
  'help.guide.half-day.step.1':
    'Włącz „Pół dnia” na pasku narzędzi. Pomarańczowa kropka oznacza w siatce pół dnia wolnego.',
  'help.guide.half-day.step.2': 'Kliknij dzień. Zostanie zapisany jako 0,5 i dostanie pomarańczową kropkę w rogu.',
  'help.guide.half-day.step.3':
    'Gdy skończysz, wyłącz „Pół dnia”. Jeśli klikniesz pół dnia z innymi ustawieniami, zmieni się on na bieżące ustawienia.',
  'help.guide.half-day.result':
    '„Użyto” rośnie o 0,5. „Pół dnia” i „Odbiór” działają niezależnie, więc możesz też wpisać pół dnia odbioru.',
  'help.guide.half-day.tip.1':
    'Pasek narzędzi zawsze pokazuje znacznik, który postawi Twoje następne kliknięcie, więc możesz to sprawdzić przed wpisaniem.',
  // comp-day
  'help.guide.comp-day.title': 'Wpisywanie odbioru godzin',
  'help.guide.comp-day.goal': 'Weź dzień wolny za nadgodziny, bez zużywania dni urlopu.',
  'help.guide.comp-day.step.1': 'Włącz „Odbiór” na pasku narzędzi. Zakreskowane kółko oznacza w siatce dzień odbioru.',
  'help.guide.comp-day.step.2': 'Kliknij dzień. Zamiast jednolitego koloru wypełnią go ukośne linie w Twoim kolorze.',
  'help.guide.comp-day.result':
    'Dni odbioru są liczone obok kafelków wymiaru urlopu i nigdy nie zmniejszają wartości „Pozostało”.',
  'help.guide.comp-day.tip.1':
    'Używaj tego przy odbiorze nadgodzin, w ruchomym czasie pracy albo za dzień wolny w zamian: przy każdym wolnym, które nie jest urlopem.',
  // entitlement
  'help.guide.entitlement.title': 'Ustawianie wymiaru urlopu',
  'help.guide.entitlement.goal': 'Ustaw w Urlopach, ile dni urlopu przysługuje Ci w roku.',
  'help.guide.entitlement.step.1':
    'Na karcie „Wymiar” na pasku bocznym kliknij kafelek „Dni” w swoim wierszu. Jeśli karta jest zwinięta, rozwiń ją kliknięciem w nagłówek.',
  'help.guide.entitlement.step.2': 'Wpisz liczbę dni i naciśnij Enter. Naciśnij Escape, żeby zachować starą wartość.',
  'help.guide.entitlement.result':
    'Pozostało jest przeliczane na podstawie Twojego wymiaru urlopu, ewentualnego przeniesienia i wykorzystanych dni.',
  'help.guide.entitlement.tip.1': 'Każdy rok ma własny wymiar urlopu, więc zmiana tutaj dotyczy tylko wybranego roku.',
  // years
  'help.guide.years.title': 'Dodawaj lata i przełączaj się między nimi',
  'help.guide.years.goal': 'Zaplanuj już przyszły rok albo przejrzyj poprzedni.',
  'help.guide.years.step.1':
    'Kliknij + po prawej stronie roku, aby dodać następny rok, albo + po lewej, aby dodać poprzedni.',
  'help.guide.years.step.2': 'Między latami przełączasz się strzałkami lub plakietkami lat pod spodem.',
  'help.guide.years.step.3':
    'Aby usunąć rok, najedź na jego plakietkę i kliknij mały minus. Spowoduje to też usunięcie wszystkich wpisów z tego roku, więc potwierdzaj z rozwagą.',
  'help.guide.years.result':
    'Każdy rok ma własny wymiar urlopu i własne wpisy. Przeniesienie łączy jeden rok z następnym.',
  // company-holidays
  'help.guide.company-holidays.title': 'Oznacz przerwy firmowe',
  'help.guide.company-holidays.goal':
    'Zablokuj dni, w które cała firma ma wolne, nie odejmując ich nikomu z wymiaru urlopu.',
  'help.guide.company-holidays.step.1':
    'Otwórz Ustawienia i sprawdź, czy „Urlopy firmowe” są włączone. Domyślnie są. Pasek narzędzi pokazuje ten tryb tylko wtedy, gdy opcja jest włączona.',
  'help.guide.company-holidays.step.2': 'W siatce przełącz pasek narzędzi na „Urlop firmowy”.',
  'help.guide.company-holidays.step.3':
    'Klikaj dni. Zmieniają kolor na bursztynowy i pojawiają się w legendzie. Kliknij dzień jeszcze raz, aby go odznaczyć.',
  'help.guide.company-holidays.result':
    'Dni wolne w firmie widzi każdy, kto jest połączony z planem, i nigdy nie zmniejszają one wartości „Pozostało”.',
  'help.guide.company-holidays.tip.1':
    'Dni wolne w firmie może edytować każda połączona osoba, więc ustalcie, kto się nimi zajmuje.',
  // public-holidays
  'help.guide.public-holidays.title': 'Wyświetlanie świąt',
  'help.guide.public-holidays.goal': 'Umieść w siatce święta swojego kraju lub regionu.',
  'help.guide.public-holidays.step.1': 'Otwórz Ustawienia i włącz „Święta państwowe”.',
  'help.guide.public-holidays.step.2':
    'Kliknij Dodaj kalendarz, wybierz kraj i w razie potrzeby region. Możesz też nadać kalendarzowi kolor i etykietę. Na koniec kliknij Dodaj.',
  'help.guide.public-holidays.step.3': 'Zamknij Ustawienia. Święta pojawią się w siatce i w legendzie.',
  'help.guide.public-holidays.result':
    'Święta państwowe są zaznaczone w kalendarzu jego kolorem i nigdy nie są odliczane od wymiaru urlopu.',
  'help.guide.public-holidays.tip.1':
    'Możesz dodać kilka kalendarzy, na przykład dla swojego regionu i dla regionu połączonego współpracownika.',
  // school-holidays
  'help.guide.school-holidays.title': 'Wyświetlanie ferii i wakacji szkolnych',
  'help.guide.school-holidays.goal': 'Zobacz ferie i wakacje szkolne w swoim regionie obok własnych dni wolnych.',
  'help.guide.school-holidays.step.1': 'Otwórz Ustawienia i włącz „School Holidays”.',
  'help.guide.school-holidays.step.2':
    'Kliknij „Dodaj kalendarz” i wybierz kraj. Jeśli kraj ma kilka kalendarzy, wybierz też region lub grupę, a potem kliknij „Dodaj”.',
  'help.guide.school-holidays.step.3':
    'Zamknij „Ustawienia”. Ferie szkolne są zacieniowane kolorem kalendarza, a u dołu ich dni widać kolorowy pasek.',
  'help.guide.school-holidays.result':
    'Ferie szkolne są tylko widoczne w kalendarzu: nigdy nie zmniejszają niczyjego wymiaru urlopu.',
  'help.guide.school-holidays.tip.1':
    'Brakuje Twojego regionu? Administrator może ręcznie wprowadzić ferie szkolne w sekcji Administrator, Personalizacja, Ferie szkolne.',
  // weekends
  'help.guide.weekends.title': 'Zablokuj weekendy i ustaw pierwszy dzień tygodnia',
  'help.guide.weekends.goal': 'Nie wliczaj weekendów i zaczynaj tydzień od wybranego dnia.',
  'help.guide.weekends.step.1': 'Otwórz „Ustawienia”.',
  'help.guide.weekends.step.2':
    'Włącz „Blokuj weekendy”, a potem w sekcji „Dni weekendowe” wybierz dni, które są twoim weekendem.',
  'help.guide.weekends.step.3': 'W sekcji „Tydzień zaczyna się w” wybierz „Pon” lub „Nd”.',
  'help.guide.weekends.result': 'Zablokowane dni są wyszarzone w siatce i nie da się ich wpisać przez pomyłkę.',
  // leave-year
  'help.guide.leave-year.title': 'Ustaw rok urlopowy',
  'help.guide.leave-year.goal':
    'Licz wymiar urlopu w roku obrotowym albo od daty zatrudnienia, a nie od stycznia do grudnia.',
  'help.guide.leave-year.step.1': 'Otwórz Ustawienia i znajdź „Rok urlopowy”.',
  'help.guide.leave-year.step.2':
    'Wybierz „Kalendarz”, „Obrotowy” (z miesiącem i dniem rozpoczęcia) lub „Data zatrudnienia” (z datą, od której jesteś zatrudniony).',
  'help.guide.leave-year.result':
    'Wymiar, wykorzystane dni i przeniesienie są liczone dla tego okresu, a siatka zaczyna się od jego pierwszego miesiąca.',
  'help.guide.leave-year.tip.1':
    'To ustawienie jest osobiste: we wspólnym planie każdy zachowuje własny rok urlopowy i własne liczby.',
  // carry-over
  'help.guide.carry-over.title': 'Przenoszenie niewykorzystanych dni',
  'help.guide.carry-over.goal': 'Dodaj to, co zostało na koniec okresu, do następnego okresu.',
  'help.guide.carry-over.step.1': 'Otwórz Ustawienia.',
  'help.guide.carry-over.step.2': 'Włącz „Przeniesienie na kolejny rok”.',
  'help.guide.carry-over.result':
    'Przeniesiona liczba dni jest przeliczana dla wszystkich Twoich lat i wyświetlana pod wymiarem urlopu.',
  'help.guide.carry-over.tip.1': 'Wyłączenie tej opcji zeruje wszystkie przeniesione salda.',
  // invite
  'help.guide.invite.title': 'Wspólne planowanie z kimś',
  'help.guide.invite.goal':
    'Połącz swój plan z planem innego użytkownika TREK, aby oboje widzieli swoje dni wolne w jednej siatce.',
  'help.guide.invite.step.1': 'Kliknij ikonę osoby na karcie „Osoby”.',
  'help.guide.invite.step.2': 'Wybierz użytkownika i kliknij „Wyślij zaproszenie”.',
  'help.guide.invite.step.3':
    'Zaproszona osoba dostanie powiadomienie i „Zaproszenie do połączenia”, gdy następnym razem otworzy „Urlopy”. Do tego czasu zaproszenie ma status oczekującego. Najedź na nie kursorem, aby je anulować.',
  'help.guide.invite.result':
    'Oba plany łączą się w jeden: każda osoba ma swój kolor, możecie zapisywać sobie nawzajem dni, a wszystko synchronizuje się na żywo.',
  'help.guide.invite.tip.1':
    'Aby cofnąć połączenie, kliknij „Rozłącz” w „Ustawieniach”. Wpisy każdej osoby wrócą do jej własnego planu.',
  'help.guide.invite.tip.2':
    'Jeśli druga osoba ma tylko widzieć Twoje dni, zamiast łączyć kalendarze, udostępnij jej swój.',
  // share-calendar
  'help.guide.share-calendar.title': 'Udostępnij kalendarz tylko do odczytu',
  'help.guide.share-calendar.goal': 'Pokaż komuś, kiedy masz wolne, bez możliwości zmiany Twojego planu.',
  'help.guide.share-calendar.step.1': 'Kliknij ikonę udostępniania na karcie „Udostępnione kalendarze”.',
  'help.guide.share-calendar.step.2': 'Wybierz użytkownika i kliknij „Udostępnij”. Akceptacja nie jest potrzebna.',
  'help.guide.share-calendar.step.3':
    'Kalendarze udostępnione Tobie widać na górze karty. Kliknij kalendarz, aby go ukryć lub pokazać, albo najedź na niego i kliknij x, aby go usunąć. W sekcji Udostępniasz dla najedź na imię i kliknij Przestań udostępniać.',
  'help.guide.share-calendar.result':
    'Twoje dni wolne pojawiają się w jego siatce jako kolorowa obwódka. Nie może niczego zmienić w tym, co udostępniasz.',
  'help.guide.share-calendar.tip.1':
    'Udostępnianie i łączenie planów są od siebie niezależne: możesz mieć połączony plan z jedną osobą i udostępniać kalendarz innym.',
  'help.guide.share-calendar.tip.2': 'Najedź kursorem na dzień z obwódką, aby zobaczyć, kto ma wolne i na jak długo.',

  // ── Screen: atlas ─────────────────────────────────────────────────────────────────────
  'help.ctx.atlas.title': 'Atlas',
  'help.ctx.atlas.summary':
    'Atlas pokazuje na mapie świata, gdzie już byłeś: każdy kraj, do którego zabrała Cię podróż, jest pokolorowany, a kraje odwiedzone, zanim zacząłeś korzystać z TREK, możesz dodać ręcznie. Przybliż mapę, aby zobaczyć regiony, prowadź listę marzeń z miejscami, które chcesz jeszcze zobaczyć, i sprawdzaj swoje statystyki w przezroczystym panelu na dole.',
  'help.ctx.atlas.bullet.1':
    'Mapa: każdy odwiedzony kraj ma swój stały kolor, planowane kraje mają przerywany obrys, kraje z listy marzeń są ukośnie zakreskowane, a wszystkie pozostałe są szare. Najedź na kraj, aby zobaczyć jego podróże, miejsca oraz pierwszą i ostatnią wizytę.',
  'help.ctx.atlas.bullet.2':
    'Wyszukiwarka na górze: wpisz kraj lub miejsce. Kraj, w którym nie byłeś, otwiera swoje okienko. Dla kraju, w którym byłeś, w panelu pojawia się jego karta. Jeśli wybierzesz miejsce, mapa otworzy jego region, żebyś mógł go oznaczyć.',
  'help.ctx.atlas.bullet.3':
    '„Pokaż zaplanowane kraje” w prawym górnym rogu: pokazuje kraje Twoich nadchodzących podróży. Przełącznik jest widoczny tylko wtedy, gdy masz takie podróże.',
  'help.ctx.atlas.bullet.4':
    'Panel na dole: karta „Statystyki” z krajami (obok nich zaplanowane), regionami, podróżami, miejscami, miastami, dniami, kontynentami, twoją serią i podróżami z tego roku; karta „Lista marzeń” z miejscami, które chcesz jeszcze odwiedzić; z dodatkiem „Wycieczki” także karta „Wycieczki” z dystansem i przewyższeniem odbytych wycieczek.',
  'help.ctx.atlas.bullet.5':
    'Regiony: po mocnym przybliżeniu mapa pokazuje stany i prowincje. Kliknij jeden z nich, żeby go zaznaczyć, odznaczyć lub dodać do listy marzeń.',
  'help.ctx.atlas.bullet.6':
    'Dawarich: gdy dodatek jest połączony, panel na lewo od statystyk oznacza marzenia jako spełnione i dodaje kraje na podstawie Twoich nagrań. Robi to dopiero po Twoim potwierdzeniu.',
  // mark-country
  'help.guide.mark-country.title': 'Oznacz kraj jako odwiedzony',
  'help.guide.mark-country.goal':
    'Dodaj kraj, w którym byłeś, zanim zacząłeś korzystać z TREK, żeby uwzględniały go mapa i licznik.',
  'help.guide.mark-country.step.1': 'Wpisz nazwę kraju w pole wyszukiwania u góry mapy.',
  'help.guide.mark-country.step.2':
    'Wybierz go z listy. Mapa przesunie się do tego kraju i otworzy się dla niego okienko.',
  'help.guide.mark-country.step.3': 'Wybierz „Oznacz jako odwiedzony”.',
  'help.guide.mark-country.result':
    'Kraj dostaje kolor na mapie, a licznik „Kraje” rośnie o jeden. Ten kolor jest stały: gdy oznaczasz kolejne kraje, kolory pozostałych się nie zmieniają.',
  'help.guide.mark-country.tip.1':
    'Kliknięcie szarego kraju na mapie otwiera to samo okienko. W przypadku małych krajów wyszukiwanie jest pewniejsze.',
  'help.guide.mark-country.tip.2':
    'Kraj oznaczony ręcznie zawsze liczy się jako odwiedzony, niezależnie od dat podróży, które tam prowadzą.',
  // unmark-country
  'help.guide.unmark-country.title': 'Usuń oznaczony kraj',
  'help.guide.unmark-country.goal': 'Usuń z mapy kraj, który oznaczyłeś ręcznie.',
  'help.guide.unmark-country.step.1':
    'Wyszukaj kraj i go wybierz albo kliknij go na mapie. Jeśli oznaczyłeś go sam, okienko zapyta, czy go usunąć.',
  'help.guide.unmark-country.step.2': 'Potwierdź przyciskiem „Usuń”.',
  'help.guide.unmark-country.result': 'Kraj znów jest szary i przestaje być liczony.',
  'help.guide.unmark-country.tip.1':
    'W ten sposób możesz usunąć tylko kraje oznaczone ręcznie. Kraj z podróżami lub miejscami pozostaje oznaczony, dopóki nie zostaną usunięte. Przy kraju oznaczonym ręcznie opcja „Usuń” jest też na jego karcie szczegółów w panelu.',
  // country-details
  'help.guide.country-details.title': 'Zobacz, co robiłeś w danym kraju',
  'help.guide.country-details.goal': 'Otwórz odwiedzony kraj i przejdź do podróży, podczas których tam byłeś.',
  'help.guide.country-details.step.1': 'Wpisz odwiedzony kraj w polu wyszukiwania u góry mapy.',
  'help.guide.country-details.step.2':
    'Wybierz go. Mapa przesunie się w to miejsce, a w panelu na dole pojawi się karta. Widać na niej flagę kraju, plakietki z jego miejscami, podróżami i odwiedzonymi regionami oraz znacznik dla każdej z trzech pierwszych podróży.',
  'help.guide.country-details.result': 'Kliknij chip podróży, aby otworzyć ją w planerze.',
  'help.guide.country-details.tip.1':
    'Po najechaniu na kraj na mapie zobaczysz te same liczby oraz datę pierwszej i ostatniej wizyty.',
  // planned-countries
  'help.guide.planned-countries.title': 'Kraje, do których się wybierasz',
  'help.guide.planned-countries.goal': 'Pokaż na mapie kraje nadchodzących podróży bez liczenia ich jako odwiedzonych.',
  'help.guide.planned-countries.step.1':
    'Włącz „Pokaż zaplanowane kraje” w prawym górnym rogu. Liczba obok pokazuje, ile jest zaplanowanych krajów.',
  'help.guide.planned-countries.step.2':
    'Wyszukaj planowany kraj i wybierz go: panel pokaże Zaplanowane, a podpowiedź na mapie poda, kiedy tam jedziesz.',
  'help.guide.planned-countries.result':
    'Planowane kraje mają przerywany obrys, więc nie da się ich pomylić z krajami, które już odwiedziłeś. Przełącznik zapamiętuje Twój wybór.',
  'help.guide.planned-countries.tip.1':
    'Kraj liczy się jako odwiedzony, gdy podróż do niego się rozpocznie. Trwająca podróż też się liczy. Podróże bez dat w ogóle nie są uwzględniane w statystykach.',
  'help.guide.planned-countries.tip.2': 'Przełącznik jest widoczny tylko wtedy, gdy masz nadchodzące podróże.',
  // regions
  'help.guide.regions.title': 'Oznaczanie regionu',
  'help.guide.regions.goal': 'Oznaczaj nie tylko kraje, ale też stany, prowincje lub prefektury, w których byłeś.',
  'help.guide.regions.step.1':
    'Przybliżaj kraj, aż pojawią się granice jego województw, stanów lub prowincji. Jeśli wyszukasz kraj i go wybierzesz, mapa przybliży się wystarczająco.',
  'help.guide.regions.step.2':
    'Kliknij region. Po najechaniu na region widać jego nazwę. Okienko pokazuje region i jego kraj.',
  'help.guide.regions.step.3': 'Wybierz Oznacz jako odwiedzony.',
  'help.guide.regions.result':
    'Region wypełnia się kolorem kraju. Oznaczenie regionu sprawia też, że kraj liczy się jako odwiedzony, jeśli nie był jeszcze oznaczony.',
  'help.guide.regions.tip.1':
    'Po kliknięciu odwiedzonego regionu zobaczysz opcję „Usuń”, niezależnie od tego, czy oznaczyłeś go sam, czy został dodany z powodu jakiegoś miejsca.',
  'help.guide.regions.tip.2':
    'Regiony, w których masz zapisane miejsca, są oznaczane automatycznie. Nie musisz nic robić.',
  // search-place
  'help.guide.search-place.title': 'Wyszukiwanie miejsca i oznaczanie jego regionu',
  'help.guide.search-place.goal': 'Oznacz Bawarię, wyszukując Monachium, bez szukania, w którym regionie leży miasto.',
  'help.guide.search-place.step.1':
    'Wpisz w pole wyszukiwania miasto, atrakcję lub adres. Najpierw pojawiają się kraje, a pod nimi pasujące miejsca w sekcji „Miejsca”.',
  'help.guide.search-place.step.2':
    'Wybierz miejsce. Mapa przesunie się do niego i ustali, w jakim regionie leży ten punkt.',
  'help.guide.search-place.step.3':
    'Wybierz Oznacz jako odwiedzony dla tego regionu albo Dodaj do listy marzeń, jeśli jeszcze tam nie byłeś.',
  'help.guide.search-place.result':
    'Region zostaje oznaczony, a razem z nim kraj. W przypadku krajów, dla których pakiet map nie ma danych o regionach, oznaczany jest sam kraj.',
  'help.guide.search-place.tip.1':
    'Miejsca pochodzą z tej samej wyszukiwarki co w całym TREK, więc korzystają z dostawcy ustawionego przez administratora.',
  // bucket-country
  'help.guide.bucket-country.title': 'Dodaj kraj do listy marzeń',
  'help.guide.bucket-country.goal':
    'Prowadź na mapie listę wymarzonych krajów, oddzielnie od tych, które już odwiedziłeś.',
  'help.guide.bucket-country.step.1': 'Wyszukaj kraj i wybierz go albo kliknij go na mapie.',
  'help.guide.bucket-country.step.2': 'Wybierz „Dodaj do listy marzeń”.',
  'help.guide.bucket-country.step.3':
    'Jeśli już wiesz kiedy, wybierz miesiąc i rok, a potem potwierdź przyciskiem Dodaj do listy marzeń.',
  'help.guide.bucket-country.result':
    'Kraj jest pokryty ukośnymi liniami w kolorze, który otrzyma po odwiedzeniu, i pojawia się w zakładce „Lista marzeń” w panelu.',
  'help.guide.bucket-country.tip.1':
    'Gdy kraj jest już na liście, w tym samym okienku pojawia się opcja „Usuń z listy marzeń”.',
  'help.guide.bucket-country.tip.2':
    'Jeden wpis na każdą docelową datę: ten sam kraj może być na liście na dwa różne miesiące, ale nie dwa razy na ten sam.',
  // bucket-place
  'help.guide.bucket-place.title': 'Dodawanie miejsca do listy marzeń',
  'help.guide.bucket-place.goal':
    'Zapisz miasto, atrakcję lub adres, które chcesz odwiedzić, ze współrzędnymi i docelową datą.',
  'help.guide.bucket-place.step.1': 'Otwórz kartę „Lista marzeń” w panelu na dole.',
  'help.guide.bucket-place.step.2': 'Kliknij Dodaj miejsce.',
  'help.guide.bucket-place.step.3':
    'Wpisz nazwę i naciśnij przycisk wyszukiwania, a potem wybierz wynik, aby miejsce dostało współrzędne. Możesz też tylko wpisać nazwę i pominąć wyszukiwanie.',
  'help.guide.bucket-place.step.4': 'Jeśli chcesz, wybierz miesiąc i rok, a potem kliknij „Dodaj”.',
  'help.guide.bucket-place.result':
    'Miejsce pojawia się na górze twojej listy marzeń z docelową datą. Najedź na nie, żeby zobaczyć ×, którym je usuniesz.',
  'help.guide.bucket-place.tip.1':
    'Dawarich może później oznaczyć marzenie jako spełnione tylko wtedy, gdy ma ono współrzędne. Zrobi to, gdy Twoje zapisy pokażą, że tam byłeś.',
  // stats
  'help.guide.stats.title': 'Twoje statystyki',
  'help.guide.stats.goal': 'Dowiedz się, co liczą liczby w panelu, a czego nie.',
  'help.guide.stats.step.1':
    '„Kraje” to liczba różnych krajów, w których naprawdę byłeś. Zaplanowane kraje są pokazane pod tą liczbą i nie są do niej wliczane. „Regiony” liczą stany i prowincje, w których byłeś. „Podróże”, „Miejsca” i „Dni” to sumy ze wszystkich twoich podróży. „Miasta” są wyliczane z adresów twoich miejsc, więc to wartość szacunkowa.',
  'help.guide.stats.step.2':
    'Kontynenty pokazują liczbę odwiedzonych krajów na każdym kontynencie. Antarktyda pojawia się w rzędzie dopiero po jej odwiedzeniu. Dalej jest Twoja seria (kolejne lata z co najmniej jedną podróżą) i liczba podróży w tym roku.',
  'help.guide.stats.result': 'Liczby aktualizują się same, gdy planujesz podróże. Nie musisz tu niczego uzupełniać.',
  'help.guide.stats.tip.1':
    'Miasta są odczytywane z tekstu adresu, a nie wyszukiwane. Dlatego krótki adres, np. „Osteria Francescana, Italy”, albo adres kończący się prefekturą może zostać policzony jako region, a nie miasto.',
  'help.guide.stats.tip.2':
    'Kraje oznaczone ręcznie liczą się do „Kraje” i do kontynentów, ale nie dodają podróży, miejsc ani dni.',
  // dawarich-countries
  'help.guide.dawarich-countries.title': 'Dodaj kraje ze swoich zapisów',
  'help.guide.dawarich-countries.goal':
    'Sprawdź w Dawarich, w których krajach byłeś w ciągu ostatniego roku, i dodaj potwierdzone kraje do mapy.',
  'help.guide.dawarich-countries.step.1':
    'Gdy dodatek Dawarich jest połączony, na dole mapy, na lewo od statystyk, pojawia się panel Dawarich z dwoma kafelkami. Kliknij „Kraje”.',
  'help.guide.dawarich-countries.step.2':
    'Okno otwiera się na karcie „Kraje”. Kliknij „Szukaj krajów”: TREK odczytuje kraje i miasta z Twoich nagrań z ostatnich 12 miesięcy, miesiąc po miesiącu, więc może to chwilę potrwać. Każdy kraj, którego nie ma jeszcze w Atlasie, jest wyświetlany z flagą, liczbą miast i nazwą pierwszego miasta. Domyślnie wszystkie kraje są zaznaczone. Kliknij wiersz, aby pominąć dany kraj.',
  'help.guide.dawarich-countries.step.3':
    'Potwierdź przyciskiem na dole po prawej, na którym widać Dodaj kraje: 5, gdy zaznaczonych jest pięć wierszy. Okno poda, ile krajów dodano. Gdy je zamkniesz, mapa jest już zaktualizowana.',
  'help.guide.dawarich-countries.result':
    'Potwierdzone kraje zostają pokolorowane na mapie i wliczone do „Kraje” jako pochodzące z Dawarich. Kraje oznaczone przez Ciebie ręcznie się nie zmieniają.',
  'help.guide.dawarich-countries.tip.1':
    'Kraje, które Atlas już pokazuje jako odwiedzone, czy to oznaczone ręcznie, z podróży, czy z wcześniejszego sprawdzenia, są pomijane, więc Twoje własne oznaczenia nigdy się nie zmieniają. Kraj, który wcześniej usunąłeś z Atlasu, zostanie dodany ponownie, gdy go tu potwierdzisz.',
  'help.guide.dawarich-countries.tip.2':
    'Jeśli TREK nie dopasuje nazwy kraju, nazwa pojawi się pod wierszami i nie zostanie pominięta. „Sprawdź ponownie” jeszcze raz odpytuje Dawarich. Notatka pod listą informuje, że sprawdzono ostatnie 12 miesięcy. Tego okresu nie można zmienić.',
  // dawarich-wishes
  'help.guide.dawarich-wishes.title': 'Odhaczanie marzeń na podstawie nagrań',
  'help.guide.dawarich-wishes.goal':
    'Sprawdź, do których miejsc z listy marzeń naprawdę dotarłeś, i oznacz je jako osiągnięte z datą dotarcia.',
  'help.guide.dawarich-wishes.step.1': 'W panelu Dawarich na dole mapy, na lewo od statystyk, kliknij „Lista marzeń”.',
  'help.guide.dawarich-wishes.step.2':
    'Okno otworzy się na zakładce Lista marzeń. Kliknij Sprawdź listę marzeń: TREK przejrzy Twoje zapisy pod kątem każdej pozycji ze współrzędnymi. Marzenie, do którego dotarłeś, jest wypisane z informacją, jak blisko podszedłeś, jak długo tam byłeś i którego dnia, i domyślnie jest zaznaczone. Przy marzeniu, które już odhaczyłeś, widać Już odhaczone. Pod listą notatka podaje liczbę pozycji bez współrzędnych oraz regułę: marzenie uznaje się za spełnione w promieniu 250 m po 20 minutach na miejscu.',
  'help.guide.dawarich-wishes.step.3':
    'Potwierdź przyciskiem w prawym dolnym rogu; przy dwóch zaznaczonych wierszach ma on napis „Odhacz 2”. Następnie zamknij okno i otwórz zakładkę „Lista marzeń” w panelu obok.',
  'help.guide.dawarich-wishes.result':
    'Każde marzenie dostaje zielony znaczek z datą pobytu, a nie dzisiejszą. Podpowiedź po najechaniu brzmi „Odhaczone na podstawie Twoich zapisów z Dawarich”. Kliknij datę, aby to cofnąć.',
  'help.guide.dawarich-wishes.tip.1':
    'Przejazd obok się nie liczy: musisz być blisko miejsca i zostać tam przez jakiś czas. Jeśli kwalifikuje się kilka pobytów, brany jest pod uwagę najdłuższy. Marzenia bez współrzędnych nie da się sprawdzić, dlatego dodawaj miejsca przez wyszukiwanie w „Dodaj miejsce”, a nie samą nazwą.',
  'help.guide.dawarich-wishes.tip.2':
    'Jedno sprawdzenie obejmuje do 50 pozycji, zaczynając od jeszcze nieodhaczonych. Jeśli jest ich więcej, TREK Cię o tym poinformuje. Marzenie, które było już odhaczone, zachowuje swoją datę.',

  // ── Screen: collections ───────────────────────────────────────────────────────────────
  'help.ctx.collections.title': 'Kolekcje',
  'help.ctx.collections.summary':
    'Kolekcje to Twoja biblioteka poza podróżami: nazwane listy miejsc, które znalazłeś i chcesz zachować, każde ze statusem Pomysł, Chcę odwiedzić lub Odwiedzone. Przy włączonych Wycieczkach trzymasz tu też całe wycieczki zachowane z podróży. Miejsca i wycieczki są kopiowane do podróży i z nich, a nie powiązane, więc lista i podróż nigdy nie zmieniają się nawzajem.',
  'help.ctx.collections.bullet.1':
    'Kolumna list po lewej pokazuje Twoje listy, listy udostępnione Ci, zaproszenia, na które jeszcze nie odpowiedziałeś, oraz „Wszystkie zapisane”, czyli wszystko z Twoich list w jednym miejscu. Na górze są „Nowa lista” i import z pliku.',
  'help.ctx.collections.bullet.2':
    'W nagłówku otwartej listy widać jej kolor, okładkę, opis i linki, członków, a po prawej „Edytuj” (tylko dla właściciela), „Eksportuj” i „Udostępnij”. Na liście udostępnionej tobie przycisk „Udostępnij” ma napis „Udostępniona”.',
  'help.ctx.collections.bullet.3':
    'Wiersz filtrów nad miejscami: + do dodawania miejsca, listy rozwijane „Status”, „Kategoria”, „Ocena” i „Sortuj”, ikona pola wyboru dla „Zaznacz” i ikona chmury dla „Importuj z podróży”. Filtr etykiet pojawia się w tym wierszu tylko wtedy, gdy mapa nie jest wyświetlana.',
  'help.ctx.collections.bullet.4':
    'Wiersze miejsc: zdjęcie, nazwa i adres, etykiety i kategoria, a po prawej pigułka statusu. Jedno kliknięcie w pigułkę zmienia status na następny.',
  'help.ctx.collections.bullet.5':
    'Mapa po prawej: pinezka dla każdego miejsca ze współrzędnymi. Na górnym pasku jest „Powiększ mapę” („Pokaż listę”, gdy mapa zajmuje cały widok), filtr etykiet z przyciskiem do zarządzania etykietami i pole „Szukaj miejsc”. Kliknij pinezkę, żeby otworzyć miejsce.',
  'help.ctx.collections.bullet.6':
    'Karta szczegółów: kliknij wiersz, aby zobaczyć okładkę, kategorię, status, ocenę w gwiazdkach, etykiety, opis i linki. Ikoną aparatu na okładce zmienisz zdjęcie. Na dole są „Edytuj”, „Kopiuj do podróży”, przycisk nawigacji i „Usuń z listy”.',
  // create-list
  'help.guide.create-list.title': 'Utwórz listę',
  'help.guide.create-list.goal': 'Utwórz nową listę z nazwą, kolorem i okładką, gotową na miejsca.',
  'help.guide.create-list.step.1': 'Kliknij „Nowa lista” u góry paska bocznego z listami.',
  'help.guide.create-list.step.2':
    'Nadaj liście nazwę i wybierz kolor. Okładka, opis i linki są opcjonalne; możesz je dodać później przez „Edytuj”.',
  'help.guide.create-list.step.3': 'Kliknij „Utwórz”.',
  'help.guide.create-list.result':
    'Lista otwiera się pusta, a wypełnić ją możesz na dwa sposoby: „Dodaj miejsce” lub „Importuj z podróży”.',
  'help.guide.create-list.tip.1':
    'Okładką może być Twój własny plik albo zdjęcie znalezione w wyszukiwarce Unsplash w tym samym oknie.',
  // add-place
  'help.guide.add-place.title': 'Dodaj miejsce',
  'help.guide.add-place.goal':
    'Znajdź miejsce i za jednym razem zapisz je na otwartej liście z nazwą, kategorią, statusem i notatkami.',
  'help.guide.add-place.step.1':
    'Kliknij + na początku rzędu filtrów nad miejscami. Na jeszcze pustej liście kliknij Dodaj miejsce na środku strony.',
  'help.guide.add-place.step.2':
    'Wpisz nazwę miejsca w pole wyszukiwania i wybierz wynik. Nazwa, adres i współrzędne zostaną uzupełnione na jego podstawie.',
  'help.guide.add-place.step.3':
    'Ustaw status i, jeśli chcesz, kategorię, opis i linki, a potem kliknij „Dodaj”. Okno pozostaje otwarte, żebyś mógł dodać kolejne miejsce; „Anuluj” je zamyka.',
  'help.guide.add-place.result': 'Miejsce pojawia się na liście, a jeśli ma współrzędne, także jako pinezka na mapie.',
  'help.guide.add-place.tip.1':
    'Z poziomu podróży Zapisz w kolekcji w inspektorze miejsca lub w menu miejsca dodaje miejsce z podróży do listy bez opuszczania podróży.',
  'help.guide.add-place.tip.2':
    'Lista musi należeć do Ciebie albo musisz być na niej edytorem lub administratorem. Przycisku + nie ma w widoku „Wszystkie zapisane” ani na liście, którą możesz tylko przeglądać.',
  // import-from-trip
  'help.guide.import-from-trip.title': 'Importowanie miejsc z podróży',
  'help.guide.import-from-trip.goal':
    'Przenieś na listę od razu wszystkie miejsca z podróży, zamiast zapisywać je jedno po drugim.',
  'help.guide.import-from-trip.step.1':
    'Kliknij przycisk importu ze strzałką i chmurką w wierszu filtrów. Na pustej liście ten sam przycisk znajdziesz obok „Dodaj miejsce”.',
  'help.guide.import-from-trip.step.2': 'Wybierz jedną ze swoich podróży.',
  'help.guide.import-from-trip.step.3':
    'Zaznacz miejsca, które chcesz dodać. Te, które już są na liście, są wyszarzone. Na starcie zaznaczone są miejsca, których nie ma w żadnym dniu podróży. Jeśli wszystkie miejsca są już przypisane do dni, zaznaczone są wszystkie nowe. „Tylko nowe” ukrywa miejsca, które lista już zawiera.',
  'help.guide.import-from-trip.step.4': 'Kliknij „Importuj”. Przycisk zawsze pokazuje, ile miejsc zostanie dodanych.',
  'help.guide.import-from-trip.result':
    'Miejsca zostają skopiowane na listę z nazwą, adresem, współrzędnymi, opisem i kategorią. Podróż się nie zmienia.',
  'help.guide.import-from-trip.tip.1':
    'TREK automatycznie pomija duplikaty o tej samej nazwie lub współrzędnych, więc możesz bez obaw zaimportować listę dwa razy.',
  'help.guide.import-from-trip.tip.2':
    'Na liście miejsc w podróży tryb zaznaczania oferuje zamiast tego „Zapisz w kolekcji” dla ręcznie wybranych miejsc.',
  // place-status
  'help.guide.place-status.title': 'Ustawianie statusu miejsca',
  'help.guide.place-status.goal': 'Pilnuj, co jest pomysłem, co jest na krótkiej liście i gdzie już byłeś.',
  'help.guide.place-status.step.1':
    'Kliknij plakietkę statusu na prawym końcu wiersza miejsca. „Pomysł” zmieni się w „Chcę odwiedzić”.',
  'help.guide.place-status.step.2':
    'Kliknij ją ponownie, aby ustawić „Odwiedzone”, i jeszcze raz, aby wrócić do „Pomysł”.',
  'help.guide.place-status.result':
    'Plakietka i jej kolor zmieniają się od razu, a liczniki w filtrze statusu nad listą się aktualizują.',
  'help.guide.place-status.tip.1':
    'Status istnieje tylko w Kolekcjach. Gdy kopiujesz miejsce do podróży, jego status nie jest kopiowany.',
  'help.guide.place-status.tip.2':
    'W podróży „Zapisz w kolekcji” otwiera „Zapisz na liście” z pigułką statusu dla każdej listy, na której jest miejsce, a pasek zaznaczenia w panelu miejsc ma opcję „Oznacz jako odwiedzone na listach”.',
  // place-detail
  'help.guide.place-detail.title': 'Otwieranie zapisanego miejsca',
  'help.guide.place-detail.goal':
    'Zobacz wszystkie informacje o miejscu i to, co możesz z nim zrobić: edytować, skopiować do podróży, wyznaczyć dojazd, usunąć.',
  'help.guide.place-detail.step.1':
    'Kliknij wiersz miejsca. Obok listy otworzy się panel szczegółów, a mapa przesunie się do tego miejsca.',
  'help.guide.place-detail.step.2':
    'Na dole są „Edytuj”, „Kopiuj do podróży”, przycisk nawigacji, który otwiera miejsce w aplikacji z mapami, oraz „Usuń z listy”. Ikoną aparatu na okładce zastąpisz automatyczne zdjęcie własnym.',
  'help.guide.place-detail.result':
    'Dzięki Edytuj możesz zmieniać nazwę, kategorię, etykiety, adres, współrzędne, opis i linki bezpośrednio w panelu.',
  'help.guide.place-detail.tip.1':
    'Okładka jest pobierana automatycznie, gdy miejsce nie ma własnego zdjęcia. Własne zdjęcie może mieć format JPG, PNG, GIF, WebP lub HEIC i rozmiar do 20 MB. Ikona kosza obok aparatu przywraca automatyczne zdjęcie.',
  'help.guide.place-detail.tip.2':
    'Każdy członek, Ty też, może wystawić ocenę w gwiazdkach pod statusem. Filtr Ocena w rzędzie filtrów korzysta ze średniej.',
  // labels
  'help.guide.labels.title': 'Grupuj miejsca etykietami',
  'help.guide.labels.goal':
    'Dodaj do listy własne etykiety, na przykład dzielnice lub dni, oprócz wspólnych kategorii.',
  'help.guide.labels.step.1':
    'Kliknij Dodaj etykietę obok etykiet nad mapą (Zarządzaj etykietami, gdy lista ma już jakieś). Gdy mapy nie widać, przycisk jest na końcu rzędu filtrów.',
  'help.guide.labels.step.2':
    'Wpisz nazwę, wybierz kolor i kliknij „Dodaj etykietę”. W tym samym oknie możesz zmieniać nazwy, kolory i usuwać istniejące etykiety.',
  'help.guide.labels.step.3':
    'Włącz „Zaznacz”, zaznacz miejsca i kliknij „Przypisz etykietę” na pasku zaznaczenia, a potem wybierz etykiety i potwierdź przyciskiem „Przypisz etykietę”. Pojedynczemu miejscu możesz też dodać etykiety przez „Edytuj” w jego szczegółach.',
  'help.guide.labels.step.4':
    'Kliknij jedną lub kilka etykiet nad mapą, żeby na liście i na mapie zostały tylko miejsca z którąkolwiek z nich. Kliknij etykietę ponownie, żeby usunąć ją z filtra.',
  'help.guide.labels.result':
    'Miejsca z etykietami pokazują je w swoim wierszu. Filtr etykiet jest dostępny dla wszystkich uczestników, także tych z dostępem tylko do odczytu.',
  'help.guide.labels.tip.1':
    'Etykiety należą do listy, na której je utworzono. Gdy przeniesiesz miejsce na inną listę, jego etykiety zostaną usunięte.',
  'help.guide.labels.tip.2': 'Do zarządzania etykietami i ich przypisywania potrzebujesz uprawnień do edycji listy.',
  // filter-select
  'help.guide.filter-select.title': 'Filtruj i zaznaczaj miejsca',
  'help.guide.filter-select.goal': 'Przefiltruj listę i zmieniaj wiele miejsc naraz.',
  'help.guide.filter-select.step.1':
    'Skorzystaj z list rozwijanych w wierszu filtrów: status, kategoria, minimalna ocena i kolejność sortowania. Przy statusie i kategorii widać, ile miejsc pasuje do każdej opcji.',
  'help.guide.filter-select.step.2':
    'Kliknij ikonę pola wyboru, „Zaznacz”, za listami rozwijanymi. Przy każdym wierszu pojawi się pole wyboru, a u góry pasek zaznaczenia.',
  'help.guide.filter-select.step.3':
    'Zaznacz miejsca lub użyj „Zaznacz wszystko”, aby wybrać wszystkie miejsca widoczne po filtrowaniu, a potem wybierz „Przypisz etykietę”, „Przenieś do listy”, „Duplikuj do listy”, „Kopiuj do podróży” lub „Usuń”. Przenosić i usuwać może tylko właściciel lub administrator listy.',
  'help.guide.filter-select.result':
    'Akcje dotyczą od razu całego zaznaczenia. Krzyżyk × po prawej zamyka tryb zaznaczania.',
  'help.guide.filter-select.tip.1':
    '„Zaznacz wszystko” zaznacza tylko miejsca pasujące do filtra. Aby zmienić wszystkie miejsca ze statusem „Chcę odwiedzić”, przefiltruj listę po „Chcę odwiedzić” i kliknij „Zaznacz wszystko”.',
  // copy-to-trip
  'help.guide.copy-to-trip.title': 'Kopiowanie miejsc do podróży',
  'help.guide.copy-to-trip.goal': 'Dodaj zapisane miejsca jako przystanki do jednej ze swoich podróży.',
  'help.guide.copy-to-trip.step.1':
    'Włącz „Zaznacz” i zaznacz miejsca albo otwórz jedno miejsce i użyj opcji „Kopiuj do podróży” w panelu szczegółów.',
  'help.guide.copy-to-trip.step.2': 'Kliknij Kopiuj do podróży na pasku zaznaczenia.',
  'help.guide.copy-to-trip.step.3': 'Wybierz podróż. Długą listę zawęzisz polem wyszukiwania.',
  'help.guide.copy-to-trip.result':
    'Miejsca zostają dodane do listy miejsc tej podróży z nazwą, opisem, kategorią, notatkami, ceną, współrzędnymi, zdjęciem i tagami. W kolekcji nic się nie zmienia.',
  'help.guide.copy-to-trip.tip.1':
    'Mogą to zrobić także osoby z rolą widza na udostępnionej liście. Miejsca zostają skopiowane, a sama lista się nie zmienia.',
  // share-list
  'help.guide.share-list.title': 'Udostępnianie listy',
  'help.guide.share-list.goal': 'Planuj listę na żywo razem z innymi osobami z tego serwera TREK.',
  'help.guide.share-list.step.1': 'Kliknij „Udostępnij” w nagłówku swojej listy.',
  'help.guide.share-list.step.2': 'Wybierz użytkownika i rolę: Widz, Edytor lub Administrator.',
  'help.guide.share-list.step.3':
    'Kliknij Wyślij zaproszenie. Osoba widnieje jako oczekująca, dopóki nie przyjmie zaproszenia na swoim pasku list albo z powiadomienia.',
  'help.guide.share-list.result':
    'Gdy zaproszona osoba je przyjmie, lista pojawi się u niej w sekcji „Udostępniona”, a wszystkie zmiany będą synchronizowane na bieżąco. W tym samym oknie nadal możesz edytować członków i ich role.',
  'help.guide.share-list.tip.1':
    'Widzowie mogą przeglądać miejsca, oceniać je i kopiować do własnych podróży. Edytorzy dodają i edytują miejsca oraz etykiety. Administratorzy mogą dodatkowo przenosić i usuwać.',
  'help.guide.share-list.tip.2':
    'Tylko właściciel może zapraszać i usuwać osoby; członek może sam opuścić udostępnioną listę.',
  // export-list
  'help.guide.export-list.title': 'Wyeksportuj listę do pliku',
  'help.guide.export-list.goal': 'Przekaż listę komuś na innym serwerze TREK albo otwórz ją w aplikacji z mapami.',
  'help.guide.export-list.step.1': 'Kliknij „Eksportuj” w nagłówku listy.',
  'help.guide.export-list.step.2':
    'Wybierz „Lista TREK”, aby użyć listy na innym serwerze TREK razem z etykietami i statusem, albo GPX dla OsmAnd, Organic Maps, urządzeń Garmin i innych aplikacji obsługujących punkty trasy.',
  'help.guide.export-list.result': 'Plik zostanie pobrany. Udostępnioną listę może wyeksportować każdy jej członek.',
  'help.guide.export-list.tip.1':
    'Miejsce bez współrzędnych nie może być punktem trasy GPX, więc jest pomijane, a TREK informuje, ile ich było.',
  'help.guide.export-list.tip.2':
    'Oceny, członkowie i przesłane zdjęcia celowo nie są eksportowane: należą do tej instancji TREK, a nie do listy.',
  // import-file
  'help.guide.import-file.title': 'Zaimportuj listę z pliku',
  'help.guide.import-file.goal': 'Zaimportuj plik listy TREK lub plik GPX jako nową listę albo do istniejącej listy.',
  'help.guide.import-file.step.1': 'Kliknij przycisk importu ze strzałką przesyłania obok „Nowa lista” na pasku list.',
  'help.guide.import-file.step.2':
    'Wybierz plik. Zanim TREK cokolwiek zaimportuje, pokaże zawartość pliku: nazwę, liczbę miejsc i liczbę etykiet.',
  'help.guide.import-file.step.3':
    'Zostaw Nowa lista i w razie potrzeby zmień nazwę, a potem kliknij Importuj. Możesz też wybrać Dodaj do listy, aby dodać miejsca do listy, którą możesz edytować, i kliknąć Dodaj do listy.',
  'help.guide.import-file.result':
    'Otworzy się lista z zaimportowanymi miejscami. Import do listy tylko dodaje miejsca. Miejsca, które już na niej są, zachowują status, notatki i etykiety.',
  'help.guide.import-file.tip.1':
    'Z pliku GPX każdy nazwany punkt trasy staje się miejscem. Ślady są liniami i są pomijane, a podgląd podaje, ile punktów to było.',
  'help.guide.import-file.tip.2':
    'Plik, który nie jest ani listą TREK, ani plikiem GPX, zostanie odrzucony, a TREK poda powód. Jeśli nie da się odczytać jednego miejsca, pominięte zostanie tylko ono, a nie cały plik.',
  // edit-list
  'help.guide.edit-list.title': 'Edytuj lub usuń listę',
  'help.guide.edit-list.goal': 'Zmień nazwę, kolor, okładkę, opis lub linki listy albo usuń listę.',
  'help.guide.edit-list.step.1': 'Kliknij „Edytuj” w nagłówku listy. Ten przycisk widzi tylko właściciel.',
  'help.guide.edit-list.step.2':
    'Zmień, co chcesz, i kliknij „Zapisz”. Ikona kosza w lewym dolnym rogu, „Usuń listę”, po potwierdzeniu usuwa listę razem ze wszystkimi miejscami.',
  'help.guide.edit-list.result': 'Nagłówek na górze od razu pokazuje nowy kolor, okładkę i opis.',
  'help.guide.edit-list.tip.1':
    'Usunięcia listy nie da się cofnąć. Jeśli chcesz zachować kopię, najpierw ją wyeksportuj.',
  // all-saved
  'help.guide.all-saved.title': 'Przeszukaj całą bibliotekę',
  'help.guide.all-saved.goal': 'Zobacz naraz miejsca ze wszystkich swoich list.',
  'help.guide.all-saved.step.1':
    'Kliknij „Wszystkie zapisane” na pasku list. W jednym widoku zobaczysz miejsca ze wszystkich list, których jesteś właścicielem lub współwłaścicielem.',
  'help.guide.all-saved.step.2':
    'Wpisz tekst w „Szukaj miejsc” nad mapą i korzystaj z filtrów jak na każdej liście. „Zaznacz” też tu działa: możesz przenosić, duplikować, kopiować do podróży i usuwać miejsca z różnych list.',
  'help.guide.all-saved.result':
    'W tym widoku zobaczysz wszystkie zapisane miejsca naraz. Nie można tu dodawać ani importować miejsc, bo nie ma jednej listy, do której by trafiły.',
  'help.guide.all-saved.tip.1':
    'Etykiety i zapisane wycieczki należą do konkretnej listy, więc w „Wszystkie zapisane” nie są dostępne.',

  // ── Screen: journey ───────────────────────────────────────────────────────────────────
  'help.ctx.journey.title': 'Dziennik podróży',
  'help.ctx.journey.summary':
    'Dziennik podróży to Twój dziennik z wyjazdów, w którym najważniejsze są zdjęcia. Każdy dziennik jest powiązany z jedną lub kilkoma podróżami, a Ty wypełniasz go dzień po dniu wpisami z opisem, zdjęciami, nastrojem i pogodą. Ten ekran pokazuje listę Twoich dzienników; otwórz jeden, aby pisać.',
  'help.ctx.journey.bullet.1':
    'Baner na górze pokazuje trwający dziennik albo Twój najnowszy, z liczbą wpisów, zdjęć i miejsc. Kontynuuj pisanie otwiera go na dzisiejszym dniu. Gdy podróż właśnie się zakończyła, nad nim pojawia się baner Podróż właśnie się zakończyła z propozycją zamiany tej podróży w dziennik.',
  'help.ctx.journey.bullet.2':
    'Pod „Wszystkie dzienniki podróży” każdy dziennik ma swoją kartę z okładką, statusem, datami i licznikami; dziennik pokazany w banerze nie pojawia się tam drugi raz. Kliknij kartę, żeby go otworzyć.',
  'help.ctx.journey.bullet.3':
    'Ostatnia karta w siatce, „Utwórz nowy dziennik podróży”, tworzy nowy dziennik na podstawie Twoich podróży.',
  // create-journey
  'help.guide.create-journey.title': 'Utwórz dziennik podróży',
  'help.guide.create-journey.goal': 'Załóż dziennik do podróży, w którym jej miejsca od razu czekają jako propozycje.',
  'help.guide.create-journey.step.1': 'Kliknij „Utwórz nowy dziennik podróży”, ostatnią kartę w siatce.',
  'help.guide.create-journey.step.2':
    'Nadaj dziennikowi nazwę i, jeśli chcesz, podtytuł, a potem zaznacz podróże, do których należy. Licznik pokazuje, ile miejsc zostanie dodanych.',
  'help.guide.create-journey.step.3': 'Kliknij „Utwórz dziennik podróży”.',
  'help.guide.create-journey.result':
    'Dziennik się otworzy. Każde miejsce z powiązanych podróży pojawi się na osi czasu jako propozycja, osobno dla każdego dnia, na który jest zaplanowane. Do każdej możesz napisać wpis.',
  'help.guide.create-journey.tip.1': 'Kolejne podróże możesz powiązać później w „Ustawieniach dziennika podróży”.',
  'help.guide.create-journey.tip.2': 'Dziennik bez podróży też działa, wtedy dodajesz wpisy ręcznie.',
  // open-journey
  'help.guide.open-journey.title': 'Otwórz dziennik podróży',
  'help.guide.open-journey.goal': 'Otwórz dziennik i sprawdź, w którym miejscu się otwiera.',
  'help.guide.open-journey.step.1':
    'Kliknij kartę. Każda pokazuje okładkę, daty oraz liczbę wpisów, zdjęć i miejsc w dzienniku.',
  'help.guide.open-journey.result':
    'Trwający dziennik otwiera się na dzisiejszym dniu, a jeśli na dziś nic jeszcze nie napisano, na ostatnim wcześniejszym wpisie. Zakończony dziennik otwiera się na początku.',
  'help.guide.open-journey.tip.1':
    'Okładką jest pierwsze zdjęcie dziennika, chyba że ustawisz inną w „Ustawieniach dziennika podróży”.',
  // continue-writing
  'help.guide.continue-writing.title': 'Kontynuowanie bieżącego dziennika',
  'help.guide.continue-writing.goal': 'Przejdź od razu do dzisiejszej strony dziennika, który właśnie prowadzisz.',
  'help.guide.continue-writing.step.1':
    'Kliknij „Kontynuuj pisanie” w banerze u góry. Baner pokazuje trwający dziennik, a jeśli żaden nie trwa, najnowszy.',
  'help.guide.continue-writing.result':
    'Dziennik otwiera się na dzisiejszym dniu, a jeśli nie ma jeszcze wpisu, na ostatnim wpisie sprzed dzisiaj.',
  'help.guide.continue-writing.tip.1':
    'Gdy podróż właśnie się skończyła, nad tym banerem pojawia się baner „Podróż właśnie się zakończyła”: „Utwórz dziennik podróży” zakłada dziennik z zaznaczoną tą podróżą, a „Odrzuć” ukrywa propozycję w tej przeglądarce.',

  // ── Screen: journey-detail ────────────────────────────────────────────────────────────
  'help.ctx.journey-detail.title': 'Dziennik',
  'help.ctx.journey-detail.summary':
    'Otwarty dziennik: po lewej oś czasu dzień po dniu, po prawej mapa z przełączanymi warstwami dla planu, nagranych tras, wpisów i zdjęć. W nagłówku są liczniki, „Studio”, przełącznik sugestii i ⋯ otwierające „Ustawienia dziennika podróży”. Wpisy dodajesz z paska narzędzi pod nagłówkiem.',
  'help.ctx.journey-detail.bullet.1':
    'Nagłówek: strzałka powrotu i plakietka statusu, okładka, tytuł i podtytuł, liczba dni, miejsc, wpisów i zdjęć, a po prawej Studio, ikona oka, która ukrywa lub pokazuje sugestie, oraz ⋯ otwierające „Ustawienia dziennika podróży”.',
  'help.ctx.journey-detail.bullet.2':
    'Pasek narzędzi: zakładki „Oś czasu” i „Galeria”, „Szukaj w tej podróży” oraz „Dodaj wpis”. W „Galerii” zamiast „Dodaj wpis” jest „Prześlij”.',
  'help.ctx.journey-detail.bullet.3':
    'Oś czasu: jedna sekcja na dzień, z jego numerem, liczbą miejsc i przyciskiem + do dodania wpisu w tym dniu. Niżej są karty wpisów ze zdjęciami, nastrojem, pogodą i opisem oraz karty sugestii z podróży, rysowane przerywaną linią, każda z × do odrzucenia.',
  'help.ctx.journey-detail.bullet.4':
    'Mapa: pasek warstw na górze przełącza Plan (puste pinezki i przerywane trasy GPX z podróży), Nagrane (ciągłe trasy zachowane z Dawarich), Wpisy (pinezki w kolorach dni, połączone w kolejności dat cienką przerywaną linią) i Zdjęcia. Przycisk (i) obok wyjaśnia każdy symbol.',
  'help.ctx.journey-detail.bullet.5':
    '„Ustawienia dziennika podróży” (⋯): okładka, nazwa i podtytuł, status, ślady GPX, zapisane dni, miejsca ze zdjęć, pola wpisów, odrzucone sugestie, zsynchronizowane podróże, współtwórcy i to, którzy uczestnicy podróży mają dostęp, publiczne udostępnianie, archiwizacja i usuwanie.',
  'help.ctx.journey-detail.bullet.6':
    'Na dole długiej osi czasu znajdziesz „Powrót na górę”, licznik dni, który przenosi do dowolnego dnia lub wpisu, oraz „Przejdź do ostatniego wpisu”.',
  // add-entry
  'help.guide.add-entry.title': 'Pisanie wpisu',
  'help.guide.add-entry.goal': 'Opisz dzień: dodaj tytuł, tekst, nastrój i pogodę.',
  'help.guide.add-entry.step.1':
    'Kliknij „Dodaj wpis” na pasku narzędzi albo + na prawym końcu nagłówka dnia, żeby zacząć wpis w tym dniu.',
  'help.guide.add-entry.step.2':
    'Nadaj wpisowi tytuł i napisz tekst. Pasek narzędzi nad tekstem pozwala dodać pogrubienie, kursywę, nagłówki, cytaty, linki i listy w Markdown.',
  'help.guide.add-entry.step.3':
    'W prawej kolumnie sprawdź datę i godzinę, wyszukaj lokalizację lub użyj swojej bieżącej pozycji, a potem wybierz nastrój i pogodę.',
  'help.guide.add-entry.step.4': 'Kliknij Zapisz.',
  'help.guide.add-entry.result':
    'Wpis pojawia się w swoim dniu na osi czasu i jako pinezka na mapie. Liczniki w nagłówku się aktualizują.',
  'help.guide.add-entry.tip.1':
    'Gdy piszesz w propozycji, korzystasz z tego samego edytora, a miejsce jest już ustawione.',
  'help.guide.add-entry.tip.2':
    'Wpis z miejscem ma opcję „Pomiń w trasie”: wpis zostaje w dzienniku, ale nie wlicza się do dystansu ani krajów i nie pojawia się na mapie w Studio.',
  // entry-photos
  'help.guide.entry-photos.title': 'Dodaj zdjęcia i filmy do wpisu',
  'help.guide.entry-photos.goal': 'Dodaj zdjęcia do dnia; pierwsze z nich zostanie okładką wpisu.',
  'help.guide.entry-photos.step.1': 'Otwórz menu wpisu przyciskiem ⋯ na jego karcie i wybierz „Edytuj”.',
  'help.guide.entry-photos.step.2':
    'Kliknij „Prześlij zdjęcia” i wybierz pliki. „Z galerii” pozwala wybrać zdjęcia, które już są w galerii dziennika, a „Zdjęcia zewnętrzne” przeszukują połączoną bibliotekę Immich lub Synology pod kątem tego dnia.',
  'help.guide.entry-photos.step.3':
    'Najedź na zdjęcie i kliknij Ustaw jako 1., aby wybrać okładkę, a potem kliknij Zapisz.',
  'help.guide.entry-photos.result':
    'Zdjęcia są widoczne na karcie i w galerii; pierwsze z nich wszędzie służy jako miniatura.',
  'help.guide.entry-photos.tip.1':
    'Filmy dodajesz do wpisu tak samo: mp4, m4v, webm lub mov do 500 MB. Są zapisywane bez zmian.',
  'help.guide.entry-photos.tip.2':
    'Pliki HEIC z iPhone’a są podczas przesyłania konwertowane do JPEG, przez co tracą dane GPS i metadane aparatu.',
  // suggestions
  'help.guide.suggestions.title': 'Korzystanie z propozycji lub ich odrzucanie',
  'help.guide.suggestions.goal': 'Zamień miejsca z podróży we wpisy, a te, o których nie będziesz pisać, odrzuć.',
  'help.guide.suggestions.step.1':
    'Sugestia to karta z przerywaną ramką i przyciskiem „Dodaj wpis”: miejsce z powiązanej podróży w dniu, na który je zaplanowano. Kliknij ją, aby otworzyć edytor z już ustawionym miejscem i dniem.',
  'help.guide.suggestions.step.2':
    'Kliknij × na prawym końcu karty, której nie użyjesz. Karta znika z osi czasu, ale nie zostaje usunięta, a synchronizacja podróży nie zaproponuje jej ponownie.',
  'help.guide.suggestions.step.3':
    'Zmieniłeś zdanie? Otwórz Ustawienia dziennika podróży przyciskiem ⋯ w nagłówku: Przywróć odrzucone propozycje pokazuje, ile ich jest, i przywraca wszystkie.',
  'help.guide.suggestions.result':
    'Na osi czasu zostają tylko wpisy, które chcesz napisać. Ikona oka w nagłówku ukrywa na czas czytania wszystkie sugestie naraz.',
  'help.guide.suggestions.tip.1': 'Miejsce zaplanowane na dwa dni daje propozycję w każdym z tych dni.',
  'help.guide.suggestions.tip.2': 'Propozycje nigdy nie liczą się do statystyk, tylko napisane wpisy.',
  // add-on-day
  'help.guide.add-on-day.title': 'Dodaj wpis z wcześniejszego dnia',
  'help.guide.add-on-day.goal': 'Opisz miniony dzień bez konieczności późniejszej zmiany daty.',
  'help.guide.add-on-day.step.1': 'Kliknij + na prawym końcu nagłówka tego dnia.',
  'help.guide.add-on-day.step.2': 'Edytor otworzy się z ustawioną tą datą. Pisz i zapisz jak zwykle.',
  'help.guide.add-on-day.result': 'Wpis od razu trafia do właściwego dnia.',
  'help.guide.add-on-day.tip.1':
    'Żeby zmienić kolejność w obrębie dnia, najedź na wpis: po lewej pojawią się „Przenieś w górę” i „Przenieś w dół”.',
  // pros-cons
  'help.guide.pros-cons.title': 'Dodawanie oceny',
  'help.guide.pros-cons.goal': 'Podsumuj dzień: co było świetne, a co nie.',
  'help.guide.pros-cons.step.1':
    'W edytorze znajdź Zalety i wady pod opisem. Wpisz punkt w Zalety lub Wady i użyj Dodaj kolejne, aby dodać następny.',
  'help.guide.pros-cons.step.2': 'Zapisz. Na karcie „Pokaż więcej” rozwija opis i werdykt jako dwie krótkie listy.',
  'help.guide.pros-cons.result': 'Kciuk w górę i kciuk w dół pojawiają się pod opowieścią, więc od razu je widać.',
  'help.guide.pros-cons.tip.1':
    'Jeśli dziennik nie korzysta z werdyktów, możesz wyłączyć tę sekcję w „Pola wpisu” w „Ustawieniach dziennika podróży”.',
  // search-journey
  'help.guide.search-journey.title': 'Znajdź coś w długim dzienniku',
  'help.guide.search-journey.goal': 'Znajdź wpis bez przewijania wpisów z wielu tygodni.',
  'help.guide.search-journey.step.1':
    'Wpisz frazę w polu „Szukaj w tej podróży” na pasku narzędzi. Oś czasu filtruje się na bieżąco po tytułach, opisach, miejscach i tagach. Znaki diakrytyczne i wielkość liter nie mają znaczenia.',
  'help.guide.search-journey.step.2':
    'Aby zamiast tego przejść do konkretnego dnia, kliknij licznik dni na dole osi czasu, między „Powrót na górę” a „Przejdź do ostatniego wpisu”.',
  'help.guide.search-journey.result':
    'Oś czasu przewija się do wybranego dnia lub wpisu, a mapa przesuwa się za nią. Do czasu wyczyszczenia pola wyszukiwania widać tylko pasujące wpisy.',
  'help.guide.search-journey.tip.1':
    'Trwający dziennik otwiera się na dzisiejszej stronie, więc bieżąca strona jest zwykle od razu widoczna.',
  'help.guide.search-journey.tip.2': 'Oko w nagłówku ukrywa sugestie, więc widzisz tylko wpisy, które sam napisałeś.',
  // gallery-map
  'help.guide.gallery-map.title': 'Przeglądaj galerię i mapę',
  'help.guide.gallery-map.goal': 'Zobacz cały dziennik jako zdjęcia i jako miejsca na mapie.',
  'help.guide.gallery-map.step.1':
    'Przełącz się na „Galeria” na pasku narzędzi. Zobaczysz wszystkie zdjęcia ze wszystkich wpisów oraz obrazy przesłane bezpośrednio do galerii. Kliknij zdjęcie, aby otworzyć je w podglądzie.',
  'help.guide.gallery-map.step.2':
    '„Prześlij” po prawej dodaje zdjęcia do galerii. Jeśli masz połączone Immich lub Synology, przycisk z nazwą biblioteki pozwala wybrać zdjęcia stamtąd.',
  'help.guide.gallery-map.result':
    'Pinezki mają kolor swojego dnia i są połączone w kolejności dat cienką przerywaną linią. Pasek warstw u góry mapy określa, co jest pokazywane.',
  'help.guide.gallery-map.tip.1':
    'Ślady GPX podróży są widoczne na warstwie „Plan” mapy jako linie przerywane. Wyłączysz je opcją „Pokaż wszystkie ślady GPX z podróży” w „Ustawieniach dziennika podróży”.',
  'help.guide.gallery-map.tip.2':
    'Zdjęcia z galerii z lokalizacją pojawiają się też na publicznej mapie, gdy udostępniona jest zarówno „Galeria”, jak i „Mapa”.',
  // entry-fields
  'help.guide.entry-fields.title': 'Wyłączanie pól wpisu',
  'help.guide.entry-fields.goal': 'Pokazuj w edytorze tylko pola, których używa ten dziennik.',
  'help.guide.entry-fields.step.1':
    'Kliknij ⋯ w prawym górnym rogu nagłówka, żeby otworzyć „Ustawienia dziennika podróży”.',
  'help.guide.entry-fields.step.2': 'W sekcji „Pola wpisu” wyłącz „Nastrój”, „Pogoda” lub „Za i przeciw”.',
  'help.guide.entry-fields.result':
    'Edytor przestaje pokazywać te pola. Nic, co napisałeś, nie przepada: gdy znów włączysz pole, zapisane wartości wrócą. Udostępniony dziennik ukrywa te same pola.',
  'help.guide.entry-fields.tip.1':
    'Przełączniki działają osobno dla każdego dziennika, więc wyjazd służbowy i wakacje mogą mieć różne ustawienia.',
  // link-trip
  'help.guide.link-trip.title': 'Powiąż kolejną podróż',
  'help.guide.link-trip.goal': 'Dodaj do dziennika miejsca z drugiej podróży jako propozycje.',
  'help.guide.link-trip.step.1':
    'Kliknij ⋯ w prawym górnym rogu nagłówka, aby otworzyć „Ustawienia dziennika podróży”.',
  'help.guide.link-trip.step.2': 'W sekcji „Zsynchronizowane podróże” kliknij „Dodaj podróż”.',
  'help.guide.link-trip.step.3': 'Wyszukaj podróż po nazwie lub miejscu docelowym i kliknij Podłącz obok niej.',
  'help.guide.link-trip.result':
    'Miejsca z podróży pojawiają się na osi czasu jako sugestie w swoich dniach, a na mapie trafiają do warstwy „Plan” razem ze śladami GPX.',
  'help.guide.link-trip.tip.1':
    'Kosz obok powiązanej podróży odłącza ją po potwierdzeniu. Napisane przez Ciebie wpisy zostają.',
  'help.guide.link-trip.tip.2':
    'Wpisy przypisane do dnia liczą się tylko raz, niezależnie od tego, ile podróży obejmuje ten dzień.',
  // share-public
  'help.guide.share-public.title': 'Udostępnij dziennik publicznie',
  'help.guide.share-public.goal': 'Daj osobom bez konta TREK link tylko do odczytu.',
  'help.guide.share-public.step.1':
    'Otwórz „Ustawienia dziennika podróży” przyciskiem ⋯ w nagłówku i przewiń do sekcji „Udostępnianie publiczne”.',
  'help.guide.share-public.step.2': 'Kliknij „Utwórz link udostępniania”.',
  'help.guide.share-public.step.3':
    'Wybierz, co zobaczą odwiedzający: „Oś czasu”, „Galeria” i „Mapa”. W sekcji „Mapa” opcja „Plan podróży” dodaje zaplanowane miejsca i trasy, a „Nagrane trasy” dodaje trasy z nagranych dni. „Kopiuj” kopiuje link do schowka.',
  'help.guide.share-public.result':
    'Każdy, kto ma link, widzi włączone sekcje i nic więcej. Pola wyłączone w Pola wpisu są tam również ukryte.',
  'help.guide.share-public.tip.1':
    'Zdjęcia pojawiają się na publicznej mapie tylko wtedy, gdy włączone są zarówno „Galeria”, jak i „Mapa”. Gdy „Mapa” jest wyłączona, serwer usuwa współrzędne zdjęć przed ich wysłaniem.',
  'help.guide.share-public.tip.2': 'Kliknij Usuń link obok Kopiuj, aby przestać udostępniać.',
  // contributors
  'help.guide.contributors.title': 'Piszcie razem',
  'help.guide.contributors.goal': 'Pozwól innemu podróżnemu dodawać własne wpisy i zdjęcia.',
  'help.guide.contributors.step.1':
    'Otwórz „Ustawienia dziennika podróży” przyciskiem ⋯ w nagłówku i znajdź „Współtwórcy”.',
  'help.guide.contributors.step.2': 'Kliknij „Zaproś współtwórcę” i wyszukaj użytkownika po nazwie lub adresie e-mail.',
  'help.guide.contributors.step.3': 'Wybierz „Widz” lub „Edytor” i kliknij „Zaproś”.',
  'help.guide.contributors.result':
    'Dziennik pojawia się na ich liście, a przy ich wpisach widać ich imię. Aby usunąć współtwórcę, kliknij × obok niego.',
  'help.guide.contributors.tip.1':
    'Współtwórcy to osoby z tego serwera TREK. Wszystkim innym możesz wysłać link publiczny.',
  // studio
  'help.guide.studio.title': 'Tworzenie fotoksiążki z dziennika',
  'help.guide.studio.goal': 'Zamień dziennik w strony do druku.',
  'help.guide.studio.step.1': 'Kliknij Studio w nagłówku. Nad dziennikiem otworzy się projektant.',
  'help.guide.studio.step.2': 'Aby wrócić, kliknij × na prawym końcu górnego paska. Wrócisz tam, gdzie byłeś.',
  'help.guide.studio.result':
    'Pasek boczny i jego panele są po lewej, rozkładówka na obszarze roboczym, a właściwości po prawej. Układ automatyczny buduje książkę z Twoich wpisów. Eksportuj tworzy plik PDF gotowy do druku.',
  'help.guide.studio.tip.1': 'Studio wymaga okna o szerokości co najmniej 1024 px i nie jest dostępne na telefonie.',
  'help.guide.studio.tip.2':
    'Książka ma te same uprawnienia co dziennik: kto może czytać dziennik, może otworzyć książkę, a kto może edytować dziennik, może ją zapisać.',
  // archive-journey
  'help.guide.archive-journey.title': 'Archiwizowanie lub usuwanie dziennika',
  'help.guide.archive-journey.goal': 'Zamknij zakończony dziennik albo usuń go na stałe.',
  'help.guide.archive-journey.step.1':
    'Kliknij ⋯ w prawym górnym rogu nagłówka, żeby otworzyć „Ustawienia dziennika podróży”.',
  'help.guide.archive-journey.step.2':
    'Na dole „Archiwizuj podróż” kończy dziennik i oznacza go jako zarchiwizowany, a „Przywróć podróż” go przywraca. „Usuń” po potwierdzeniu kasuje go razem ze wszystkimi wpisami i zdjęciami.',
  'help.guide.archive-journey.result':
    'Zarchiwizowany dziennik nadal można czytać i udostępniać, po prostu nie otwiera się już na dzisiejszym dniu.',
  'help.guide.archive-journey.tip.1':
    'Usunięcia nie można cofnąć, a podróże, z którymi dziennik był powiązany, się nie zmieniają.',
  'help.guide.archive-journey.tip.2': 'Okładkę, nazwę i podtytuł zmienisz w tym samym oknie, u góry.',
  'help.guide.journey-status.title': 'Ustawianie statusu dziennika',
  'help.guide.journey-status.goal':
    'Sam oznacz dziennik jako szkic, trwający lub zakończony, zamiast polegać na datach jego podróży.',
  'help.guide.journey-status.step.1':
    'Kliknij ⋯ w prawym górnym rogu nagłówka dziennika, żeby otworzyć „Ustawienia dziennika podróży”.',
  'help.guide.journey-status.step.2':
    'W polu Status wybierz Szkic, Na żywo lub Zakończone. Wybór zapisuje się od razu.',
  'help.guide.journey-status.result':
    'Dziennik ma wybrany status: „Szkic” i „Zakończone” są widoczne jako plakietka na jego karcie i w nagłówku, a dziennik „Na żywo” jest pokazywany w banerze na górze listy dzienników.',
  'help.guide.journey-status.tip.1':
    '„Automatycznie” znów korzysta z dat powiązanych podróży. Bez powiązanej podróży automatyczny dziennik pozostaje szkicem.',
  'help.guide.journey-status.tip.2':
    'Status ustawiony ręcznie obowiązuje, dopóki go nie zmienisz, nawet gdy zmienią się daty podróży.',

  // ── Screen: journey-studio ────────────────────────────────────────────────────────────
  'help.ctx.journey-studio.title': 'Studio', // same-as-en
  'help.ctx.journey-studio.summary':
    'TREK Studio układa dziennik w fotoksiążkę, którą można wydrukować. Otwiera się nad dziennikiem: pasek boczny i jego panele są po lewej, rozkładówka, nad którą pracujesz, pośrodku, a jej właściwości po prawej. Układ automatyczny buduje pierwszy szkic z Twoich wpisów, motyw nadaje książce kolory i kroje pisma, a asystent może projektować strony razem z Tobą. Potem możesz przesuwać, kadrować i zmieniać styl wszystkiego, a każdy krok da się cofnąć.',
  'help.ctx.journey-studio.bullet.1':
    'Górny pasek: po lewej okładka i nazwa dziennika. Po prawej kto jeszcze jest w książce i czy jest zapisana, format strony, cofnij, ponów i wklej, Układ automatyczny, asystent, pomoc, Eksportuj oraz przycisk zamykający Studio.',
  'help.ctx.journey-studio.bullet.2':
    'Pasek boczny po lewej: Strony, Treść (zdjęcia i wpisy z dziennika), Układy, Elementy (tekst, kształty, linie, ramki, ikony i naklejki), Podróż (liczby, mapy, kraje i znaczniki zbudowane z dziennika) oraz, osobno pod nimi, Motyw i Warstwy.',
  'help.ctx.journey-studio.bullet.3':
    'Obszar roboczy: bieżąca rozkładówka ze spadem i marginesami bezpieczeństwa, a pod nią pasek powiększenia z opcjami Dopasuj do widoku, Widok książki i Pobierz tę rozkładówkę.',
  'help.ctx.journey-studio.bullet.4':
    'Właściwości po prawej: wszystko o zaznaczonym elemencie, od położenia, rozmiaru i kadrowania po kolory, efekty, kolejność warstw i blokadę. Gdy nic nie jest zaznaczone, pokazują tło strony, motyw, numery stron i dokument.',
  'help.ctx.journey-studio.bullet.5':
    'Książka jest ułożona jak książka drukowana: okładka, pojedyncza pierwsza strona naprzeciw pustej wewnętrznej strony okładki, rozkładówki, pojedyncza ostatnia strona i tylna okładka. Numery stron liczą się od pierwszej strony i drukują się tak, jak je widać.',
  'help.ctx.journey-studio.bullet.6':
    'Kilka osób może projektować jednocześnie: każdy widzi kursory pozostałych z ich imionami. Jeśli zapiszesz wersję, którą ktoś inny w międzyczasie zmienił, TREK pokaże konflikt zamiast nadpisać jego pracę.',
  'help.ctx.journey-studio.bullet.7':
    'Motyw: jeden wygląd całej książki, jej papier, tusz i trzy kolory akcentowe, kroje pisma i motywy ozdobne. Elementy powiązane z motywem podążają za nim, gdy go zmienisz.',
  'help.ctx.journey-studio.bullet.8':
    'Asystent: tam, gdzie administrator skonfigurował AI, dymek na górnym pasku otwiera asystenta, który układa strony, pisze podpisy i zmienia styl książki razem z Tobą. Każda jego zmiana to krok do cofnięcia.',
  // studio-auto-layout
  'help.guide.studio-auto-layout.title': 'Automatyczne tworzenie książki',
  'help.guide.studio-auto-layout.goal':
    'Jednym kliknięciem uzyskaj kompletny pierwszy szkic z wpisów i zdjęć z dziennika.',
  'help.guide.studio-auto-layout.step.1': 'Kliknij „Auto layout” na górnym pasku.',
  'help.guide.studio-auto-layout.step.2':
    'Wybierz „Cała książka”: zastępuje wszystkie strony, zachowując tytuł i ustawienia strony. „Ta strona” przebudowuje tylko widoczną rozkładówkę. Ta opcja jest dostępna tylko na rozkładówce utworzonej z wpisu.',
  'help.guide.studio-auto-layout.step.3':
    'Przejrzyj pasek stron. Jeśli poprzednia wersja podobała Ci się bardziej, „Cofnij” cofa cały układ.',
  'help.guide.studio-auto-layout.result':
    'Każdy wpis dostaje osobną rozkładówkę, w kolejności, ze zdjęciami, tytułem i tekstem rozmieszczonymi za Ciebie. Każdy element pozostaje powiązany ze swoim wpisem i aktualizuje się razem z nim, dopóki go nie zmienisz.',
  'help.guide.studio-auto-layout.tip.1':
    'Obie opcje to zwykłe kroki, które można cofnąć, więc możesz je spokojnie wypróbować.',
  'help.guide.studio-auto-layout.tip.2':
    'Gdy automatyczny układ powiąże element z wpisem, element aktualizuje się przy każdej edycji tego wpisu. Gdy zmienisz element w panelu „Właściwości”, powiązanie zostaje usunięte.',
  // studio-pages
  'help.guide.studio-pages.title': 'Dodawaj, przenoś i usuwaj rozkładówki',
  'help.guide.studio-pages.goal': 'Edytuj książkę strona po stronie.',
  'help.guide.studio-pages.step.1':
    'Otwórz Strony na pasku bocznym. Miniatury pokazują książkę po kolei: okładka, pierwsza strona, rozkładówki, ostatnia strona i tylna okładka. Pierwsza i ostatnia strona są narysowane obok pustej wewnętrznej strony swojej okładki, tak jak otwiera się oprawiona książka.',
  'help.guide.studio-pages.step.2':
    '„Dodaj stronę” na dole dodaje nową rozkładówkę przed ostatnią stroną. Znak + między dwiema miniaturami wstawia ją w tym miejscu.',
  'help.guide.studio-pages.step.3':
    'Najedź na miniaturę, aby zobaczyć dostępne akcje: „Przenieś wcześniej”, „Przenieś później”, „Duplikuj stronę” i „Usuń stronę”. Kliknij miniaturę, aby otworzyć tę rozkładówkę na stole roboczym.',
  'help.guide.studio-pages.result':
    'Okładka, pierwsza i ostatnia strona oraz tył okładki zostają na swoich miejscach. Nowe rozkładówki zawsze trafiają między nie.',
  'help.guide.studio-pages.tip.1':
    '„Widok książki” na górnym pasku pokazuje całą książkę jako arkusze, tak jak zostanie oprawiona.',
  'help.guide.studio-pages.tip.2':
    'Numery stron włączysz w panelu „Właściwości”, w sekcji „Dokument”, gdy nic nie jest zaznaczone.',
  // studio-layouts
  'help.guide.studio-layouts.title': 'Zastosuj układ do rozkładówki',
  'help.guide.studio-layouts.goal': 'Nadaj rozkładówce gotowy układ ramek na zdjęcia i tekst.',
  'help.guide.studio-layouts.step.1':
    'Otwórz Układy na pasku bocznym. Najpierw są zaprojektowane strony: całe okładki i rozkładówki w motywie książki, które przyciski stylu zawężają do jednego wyglądu. Pod nimi, w tej samej siatce, są Moje układy i Wbudowane.',
  'help.guide.studio-layouts.step.2':
    'Kliknij jeden z układów. Rozkładówka na stole roboczym dostaje ramki tego układu, a Twoje dotychczasowe zdjęcia i teksty zostają w nich rozmieszczone.',
  'help.guide.studio-layouts.result':
    'Puste ramki to miejsca na treść: przeciągnij na nie zdjęcie z panelu „Treść” albo użyj „Dodaj do tej strony”.',
  'help.guide.studio-my-layouts.title': 'Zapisz stronę jako własny układ',
  'help.guide.studio-my-layouts.goal': 'Użyj ponownie układu, który zbudowałeś na innych stronach książki.',
  'help.guide.studio-my-layouts.step.1': 'Ułóż stronę tak, jak chcesz, a potem otwórz Układy na pasku bocznym.',
  'help.guide.studio-my-layouts.step.2':
    'Kliknij Zapisz tę stronę jako układ w sekcji Moje układy. Strona pojawi się na liście jako karta.',
  'help.guide.studio-my-layouts.tip.1':
    'Kliknij swój układ na innej stronie, aby ułożyć ją tak samo, z jej własnymi zdjęciami i tekstami.',
  'help.guide.studio-my-layouts.result':
    'Twoje układy zapisują się razem z książką i są proponowane na stronach tego samego rodzaju: układ okładki dla okładek, układ rozkładówki dla rozkładówek.',
  'help.guide.studio-layouts.tip.1': 'Zmianę układu można cofnąć jak każdy inny krok.',
  // studio-content
  'help.guide.studio-content.title': 'Umieść zdjęcia i wpisy na stronie',
  'help.guide.studio-content.goal': 'Dodaj do rozkładówki zdjęcia i wpisy z dziennika.',
  'help.guide.studio-content.step.1':
    'Otwórz Content na pasku bocznym. „Zdjęcia” zawiera wszystkie zdjęcia z dziennika, a „Wpisy” wszystkie wpisy z tekstem.',
  'help.guide.studio-content.step.2':
    'Przeciągnij zdjęcie na rozkładówkę lub do pustej ramki albo kliknij „Dodaj do tej strony” pod nim. „Prześlij zdjęcia” dodaje zdjęcia, których jeszcze nie ma w dzienniku, a „Z Immich” lub „Z Synology” pozwala wybrać je z połączonej biblioteki.',
  'help.guide.studio-content.step.3':
    'Pod wpisem opcje Title, Story i Place umieszczają dany tekst na stronie jako element tekstowy. Data i współrzędne są dodawane jako znaczniki, a pod wpisem są też jego zdjęcia.',
  'help.guide.studio-content.result':
    'Upuszczone zdjęcie staje się elementem zdjęcia. Tekst pozostaje powiązany z wpisem, dopóki go nie zmienisz.',
  'help.guide.studio-theme.title': 'Nadaj książce motyw',
  'help.guide.studio-theme.goal': 'Ustaw kolory i kroje pisma całej książki za jednym razem.',
  'help.guide.studio-theme.step.1':
    'Otwórz Motyw na pasku bocznym. Każda karta pokazuje motyw jako małą stronę: jego papier, krój pisma i trzy kolory akcentowe.',
  'help.guide.studio-theme.step.2':
    'Kliknij motyw, aby go wypróbować. Pod kartami możesz zmienić jego paletę, wybrać inne kroje pisma oraz motywy ozdobne i dekoracje.',
  'help.guide.studio-theme.step.3':
    'Kliknij Zastosuj do książki albo Zastosuj do tej strony, aby objąć rozkładówkę widoczną na ekranie.',
  'help.guide.studio-theme.tip.1':
    'Elementy powiązane z motywem przejmują jego kolory i kroje pisma i podążają za nim, gdy go zmienisz. Przestylizuj też to, co nie jest jeszcze powiązane, najpierw powiązuje resztę.',
  'help.guide.studio-theme.tip.2': 'Kolory ze zdjęć buduje paletę z obrazów z dziennika.',
  'help.guide.studio-theme.result':
    'Wszystkie powiązane kolory i kroje pisma w książce zmieniają się naraz, a zastosowanie motywu to jeden krok do cofnięcia.',
  'help.guide.studio-content.tip.1': 'Pole wyszukiwania u góry panelu „Treść” filtruje obie listy.',
  'help.guide.studio-content.tip.2':
    'Gdy przeciągniesz plik z pulpitu na stół roboczy, TREK od razu go prześle i umieści.',
  // studio-elements
  'help.guide.studio-elements.title': 'Dodawanie tekstu, kształtów, ikon i naklejek',
  'help.guide.studio-elements.goal': 'Ozdób rozkładówkę nie tylko zdjęciami i opowieściami.',
  'help.guide.studio-elements.step.1':
    'Otwórz Elementy na pasku bocznym. Sześć kart porządkuje to, co możesz dodać: Tekst, Kształty, Linie, Ramki, Ikony i Naklejki.',
  'help.guide.studio-elements.step.2':
    'Kliknij styl tekstu lub zaprojektowany tytuł, kształt, linię, pustą ramkę, ikonę albo naklejkę. Każdy z nich trafia na środek rozkładówki, a potem możesz go przesunąć.',
  'help.guide.studio-elements.result':
    'Kliknij dwukrotnie element tekstowy, aby w nim pisać. W panelu „Właściwości” ustawisz czcionkę, grubość, rozmiar, odstępy i wyrównanie.',
  'help.guide.studio-stickers.title': 'Ozdabianie naklejkami',
  'help.guide.studio-stickers.goal': 'Dodaj ilustracje, od zabytków i jedzenia po zwierzęta i strzałki.',
  'help.guide.studio-stickers.step.1': 'Otwórz Elementy na pasku bocznym i wybierz Naklejki.',
  'help.guide.studio-stickers.step.2':
    'Wyszukaj słowo lub przeglądaj półki, a potem kliknij naklejkę, aby umieścić ją na rozkładówce.',
  'help.guide.studio-stickers.tip.1':
    'Przy zaznaczonej naklejce Właściwości zmieniają kolory jej części i odbijają ją lustrzanie.',
  'help.guide.studio-stickers.result': 'Naklejka jest rysunkiem, więc pozostaje ostra w każdym rozmiarze.',
  'help.guide.studio-elements.tip.1': 'Ramki to puste miejsca na zdjęcia: obraz możesz wstawić później.',
  // studio-travel
  'help.guide.studio-travel.title': 'Dodawanie map, liczb, krajów i znaczników',
  'help.guide.studio-travel.goal': 'Zamień samą podróż w zaprojektowane elementy na stronie.',
  'help.guide.studio-travel.step.1':
    'Otwórz Podróż na pasku bocznym. Cztery karty porządkują to, co możesz dodać: Liczby, Mapy, Kraje i Znaczniki.',
  'help.guide.studio-travel.step.2':
    'Każda karta pokazuje element z liczbami z Twojego dziennika, w kolorach motywu: podsumowanie jako plakat, bilet, znak drogowy lub licznik kilometrów, mapę z ponumerowanymi przystankami albo przyciętą do jednego kraju, kraj jako stempel, pocztówkę lub pinezkę, datę albo odległość jako stempel, metkę lub wstęgę.',
  'help.guide.studio-travel.step.3':
    'Kliknij kartę. Element trafia na środek rozkładówki, a potem możesz go przesunąć i zmienić jego rozmiar.',
  'help.guide.studio-travel.result':
    'Element pojawia się na rozkładówce. Właściwości zmieniają jego wygląd, a każda liczba, mapa i kraj aktualizują się, gdy zmieni się dziennik.',
  'help.guide.studio-text-effects.title': 'Dodawanie efektów do tekstu',
  'help.guide.studio-text-effects.goal': 'Nadaj nagłówkowi obrys, cień, łuk albo litery wypełnione wzorem.',
  'help.guide.studio-text-effects.step.1': 'Kliknij element tekstowy na stronie, aby go zaznaczyć.',
  'help.guide.studio-text-effects.step.2':
    'We Właściwościach otwórz Efekty, aby dodać obrys, cień lub podświetlenie albo wypełnić litery gradientem lub wzorem. Wielkość liter i położenie wygina linię i dopasowuje ją do ramki.',
  'help.guide.studio-text-effects.tip.1':
    'Dopasuj do ramki zmniejsza tekst, aż zmieści się w ramce, więc długi tytuł nigdy się nie wylewa.',
  'help.guide.studio-text-effects.result': 'Efekt jest rysowany razem z tekstem, w druku tak samo jak na ekranie.',
  'help.guide.studio-background.title': 'Zmiana tła strony',
  'help.guide.studio-background.goal': 'Pomaluj stronę kolorem, gradientem lub wzorem albo połóż pod spodem zdjęcie.',
  'help.guide.studio-background.step.1':
    'Kliknij puste miejsce na stronie, aby nic nie było zaznaczone. Tło strony jest na górze Właściwości.',
  'help.guide.studio-background.step.2':
    'Wybierz Papier, Jednolite, Gradient lub Wzór i kolor albo kliknij zdjęcie w sekcji Zdjęcie jako tło.',
  'help.guide.studio-background.tip.1': 'Zastosuj do wszystkich stron daje każdej stronie książki to samo tło.',
  'help.guide.studio-background.result': 'Tło sięga w spad, więc drukuje się aż do krawędzi strony.',
  'help.guide.studio-layers.title': 'Porządkowanie, ukrywanie i blokowanie warstwami',
  'help.guide.studio-layers.goal': 'Zobacz wszystko na rozkładówce w kolejności warstw i pracuj na tym właśnie tam.',
  'help.guide.studio-layers.step.1': 'Otwórz Warstwy na pasku bocznym. Góra listy to przód strony.',
  'help.guide.studio-layers.step.2':
    'Przeciągnij wiersz, aby zmienić kolejność, użyj oka, aby ukryć element, i kłódki, aby zostawić go na miejscu. Zaznacz kilka i zgrupuj je, aby przesuwać razem.',
  'help.guide.studio-layers.tip.1': 'Kliknij wiersz dwukrotnie, aby nadać elementowi własną nazwę.',
  'help.guide.studio-layers.tip.2': 'Ukryte elementy nie trafiają do pliku PDF.',
  'help.guide.studio-layers.result':
    'Zapełnione strony nadal łatwo edytować, a gotowych części nie da się przypadkiem przesunąć.',
  'help.guide.studio-travel.tip.1':
    'W Mapach lista Przystanki zawiera każdy przystanek trasy. Wyłącz jeden, aby pominąć go na mapach i w liczbach, na przykład lotnisko w miejscu zamieszkania.',
  'help.guide.studio-travel.tip.2':
    'Mapa kraju pokazuje same przystanki tego kraju, więc kraj wypełnia stronę, nawet gdy podróż zaczęła się od długiego lotu.',
  // studio-properties
  'help.guide.studio-properties.title': 'Edycja zaznaczonego elementu',
  'help.guide.studio-properties.goal': 'Przesuwaj, kadruj, styluj i układaj warstwy elementu w inspektorze.',
  'help.guide.studio-properties.step.1':
    'Kliknij element na rozkładówce. Pojawią się uchwyty do zmiany rozmiaru i obrotu, a przeciągnięcie elementu go przesuwa.',
  'help.guide.studio-properties.step.2':
    'Panel Properties po prawej pokazuje ustawienia zaznaczonego elementu: pozycję i rozmiar, Crop z punktem ostrości, który decyduje, co zostanie w kadrze, wypełnienie lub dopasowanie, filtry Look, zaokrąglenie narożników, styl ramki, kolejność warstw i Lock.',
  'help.guide.studio-properties.step.3':
    '„Duplikuj” i „Usuń” są u góry inspektora. „Cofnij” na górnym pasku cofa każdą z tych zmian.',
  'help.guide.studio-properties.result':
    'Zablokowanego elementu nie można zaznaczyć ani przesunąć na stronie. Dzięki temu gotowy układ jest chroniony, gdy pracujesz nad innymi elementami.',
  'help.guide.studio-properties.tip.1':
    'Kliknięcie z wciśniętym Shift zaznacza kilka elementów; inspektor edytuje je wtedy razem.',
  'help.guide.studio-properties.tip.2':
    'Jeśli edytujesz element rozmieszczony przez automatyczny układ, przestaje on być powiązany z wpisem i nie uwzględnia późniejszych zmian tego wpisu.',
  // studio-format
  'help.guide.studio-format.title': 'Wybór formatu strony',
  'help.guide.studio-format.goal': 'Ustaw rozmiar druku książki, zanim zbudujesz układ.',
  'help.guide.studio-format.step.1':
    'Kliknij format strony na górnym pasku, obok narzędzi edycji. Pokazuje nazwę i kształt formatu.',
  'help.guide.studio-format.step.2':
    'Wybierz Square 21 × 21 cm, Square 30 × 30 cm, A4 lub A5 w orientacji landscape albo portrait albo wpisz własną szerokość i wysokość w milimetrach. Spad i margines bezpieczeństwa ustawisz poniżej.',
  'help.guide.studio-format.result':
    'Każda rozkładówka ma ten rozmiar, domyślnie ze spadem 3 mm i marginesem bezpieczeństwa 5 mm.',
  'help.guide.studio-format.tip.1':
    'Najpierw zmień format, a dopiero potem uruchom Auto layout. Auto layout korzysta z formatu ustawionego w chwili uruchomienia.',
  'help.guide.studio-format.tip.2': 'Zapytaj drukarnię o jej wartości spadu i marginesu bezpieczeństwa i wpisz je.',
  // studio-export
  'help.guide.studio-export.title': 'Eksportowanie książki do PDF',
  'help.guide.studio-export.goal': 'Uzyskaj plik gotowy do druku albo taki do czytania na ekranie.',
  'help.guide.studio-export.step.1': 'Kliknij Export na górnym pasku.',
  'help.guide.studio-export.step.2':
    'Wybierz „Pojedyncze strony”, czyli jedną stronę na arkusz w kolejności czytania, czego potrzebuje drukarnia, albo „Rozkładówki”, czyli po dwie strony, tak jak otwiera się książka. „Znaczniki cięcia” dodają spad na każdej krawędzi i pokazują, gdzie ciąć.',
  'help.guide.studio-export.step.3':
    'Kliknij „Podgląd wydruku”. Przeglądarka otworzy strony. Wybierz „Zapisz jako PDF”, aby utworzyć plik.',
  'help.guide.studio-export.result': 'Plik PDF z taką liczbą arkuszy, jaką podało okno, w ustawionym formacie strony.',
  'help.guide.studio-export.tip.1': 'PDF możesz utworzyć tylko na komputerze, tak jak całe Studio.',
  'help.guide.studio-export.tip.2':
    'Do wydruku próbnego eksportuj „Rozkładówki” bez znaczników cięcia, a dla drukarni „Pojedyncze strony” ze znacznikami.',
  // studio-spread-file
  'help.guide.studio-spread-file.title': 'Użyj rozkładówki w innej książce',
  'help.guide.studio-spread-file.goal': 'Skopiuj projekt, który Ci się podoba, z książki jednego dziennika do innego.',
  'help.guide.studio-spread-file.step.1':
    'Gdy rozkładówka jest w obszarze roboczym, kliknij „Pobierz tę rozkładówkę” na prawym końcu paska powiększenia. Plik zawiera projekt, ale nie zdjęcia.',
  'help.guide.studio-spread-file.step.2':
    'W drugiej książce otwórz Pages, kliknij „Importuj” obok „Dodaj stronę” i wybierz plik.',
  'help.guide.studio-spread-file.result':
    'Rozkładówka zostaje zaimportowana z ramkami i stylami tekstu. Przeciągnij do ramek zdjęcia z nowego dziennika.',
  'help.guide.studio-spread-file.tip.1': 'Jeśli plik nie jest projektem rozkładówki, TREK go odrzuci i poda powód.',

  // ── Screen: settings (all tabs) ───────────────────────────────────────────────────────
  'help.ctx.settings.title': 'Ustawienia',
  'help.ctx.settings.summary':
    'Twoje osobiste ustawienia, z osobną zakładką dla każdego tematu na pasku bocznym po lewej. Większość przełączników działa od razu po zmianie. Formularz z przyciskiem „Zapisz” zapisuje zmiany dopiero po jego kliknięciu. Nic tutaj nie zmienia TREK dla innych osób.',
  'help.ctx.settings.bullet.1':
    'Pasek boczny po lewej: Preferencje, Wygląd, Mapa, Powiadomienia, Integracje, Offline i Konto. Wtyczki pojawiają się, gdy aktywna jest jakaś wtyczka. O aplikacji widać, chyba że operator to ukrył. Na dole jest numer wersji.',
  'help.ctx.settings.bullet.2':
    'Najpierw otwierają się Preferencje. Znajdziesz tam język, język nazw miejsc, jednostki, format czasu, początek tygodnia i walutę wyświetlania, a także zachowanie mapy podróży. Wygląd obejmuje motyw, kolory, czytelność, wielkość tekstu i widżety panelu.',
  'help.ctx.settings.bullet.3':
    '„Mapa” ustawia silnik mapy i jej styl; „Powiadomienia” określają, które zdarzenia trafiają na który kanał; „Integracje” łączą biblioteki zdjęć, AirTrail, Dawarich i wanderer, a także zawierają klucze API i MCP; „Offline” określa, co przechowuje to urządzenie.',
  'help.ctx.settings.bullet.4':
    'Konto obejmuje Twój profil, hasło, uwierzytelnianie dwuskładnikowe, klucze dostępu i możliwość usunięcia konta.',
  'help.ctx.settings-display.title': 'Wygląd',
  'help.ctx.settings-display.summary':
    'Od czego TREK zaczyna, jakiego języka i jednostek używa oraz jak działają mapa podróży i rezerwacje. Każda zmiana działa od razu.',
  'help.ctx.settings-display.bullet.1':
    '„Uruchamianie”: „Strona startowa” otwiera „Panel” albo „Aktywną podróż”; przy „Aktywnej podróży” opcja „Karta startowa” wybiera kartę, na której otwiera się ta podróż.',
  'help.ctx.settings-display.bullet.2':
    'Język i region: „Waluta wyświetlania” (lub „Waluta wyjazdu”, jeśli nie chcesz przeliczać), „Język”, „Nazwy miejsc”, „Jednostka temperatury”, „Jednostka odległości”, „Format czasu” i „Tydzień zaczyna się w”.',
  'help.ctx.settings-display.bullet.3':
    'Podróże i mapa: „Otwieraj miejsca w”, „Data na początku nagłówków dni”, „Etykiety tras rezerwacji”, „Zawsze pokazuj trasy rezerwacji”, „Kompaktowe znaczniki dla niezaplanowanych miejsc”, „Odkrywaj miejsca na mapie”, „Rozmyj kody rezerwacji” i „Optymalizuj trasę od zakwaterowania”.',
  'help.ctx.settings-appearance.title': 'Wygląd',
  'help.ctx.settings-appearance.summary':
    'Jak wygląda TREK na tym koncie: tryb jasny lub ciemny, kolor akcentu, efekty szkła i animacje, rozmiar tekstu oraz widżety na pulpicie. Zmiany działają od razu na każdym urządzeniu, na którym się logujesz.',
  'help.ctx.settings-appearance.bullet.1':
    'Motyw: „Motyw” („Jasny”, „Ciemna” lub „Automatyczny”), schemat kolorów, a przy opcji „Własny” także własny kolor akcentu dla trybu jasnego i ciemnego wraz z kontrolą kontrastu.',
  'help.ctx.settings-appearance.bullet.2':
    'Czytelność, oznaczona jako Eksperymentalne: Przezroczystość, Ogranicz ruch, Gęstość i Wielkość tekstu, z jednym suwakiem dla Wszystko oraz po jednym dla Duży, Średni, Normalnie i Mały.',
  'help.ctx.settings-appearance.bullet.3':
    'Widżety panelu: osobne przełączniki dla Desktop (Pod hero, Prawy pasek boczny) i Mobile (Pod hero, Dół strony).',
  'help.ctx.settings-appearance.bullet.4': '„Przywróć domyślne” pod kartami przywraca domyślne wartości całej karty.',
  'help.ctx.settings-map.title': 'Mapa',
  'help.ctx.settings-map.summary':
    'Który silnik rysuje mapy w planerze podróży i dzienniku oraz w jakim stylu. Leaflet to klasyczna mapa rastrowa, Mapbox GL dodaje budynki 3D i ukształtowanie terenu, ale wymaga własnego tokena, a MapLibre GL rysuje wektorowe kafelki OpenFreeMap bez tokena. Atlas zawsze korzysta z Leaflet.',
  'help.ctx.settings-map.bullet.1':
    '„Dostawca mapy”: Leaflet, Mapbox GL („Eksperymentalne”) lub MapLibre GL, każda opcja z krótkim opisem.',
  'help.ctx.settings-map.bullet.2':
    '„Szablon mapy” i „Klucz API CARTO” dla Leaflet; „Styl mapy” dla obu silników GL, a dla Mapbox GL także „Token dostępu Mapbox”.',
  'help.ctx.settings-map.bullet.3':
    'Tylko dla Mapbox GL: „Budynki 3D i teren” oraz „Tryb wysokiej jakości”. Nad przyciskiem „Zapisz mapę” widać podgląd na żywo. „Zapisz mapę” zapisuje wybór.',
  'help.ctx.settings-notifications.title': 'Powiadomienia',
  'help.ctx.settings-notifications.summary':
    'Jak TREK kontaktuje się z Tobą poza aplikacją. U góry jest tabela z wierszem dla każdego zdarzenia i kolumną dla każdego kanału, która decyduje, co i gdzie jest wysyłane. Poniżej są karty webhooka, ntfy, powiadomień push na tym urządzeniu i kanałów wtyczek.',
  'help.ctx.settings-notifications.bullet.1':
    'Powiadomienia: włączaj i wyłączaj każde zdarzenie osobno dla każdego kanału. Kłódka oznacza, że administrator wyłączył je dla wszystkich.',
  'help.ctx.settings-notifications.bullet.2':
    'URL webhooka: webhook Discord, Slack lub własny, z przyciskami Testuj i Zapisz.',
  'help.ctx.settings-notifications.bullet.3':
    'Ntfy: „Temat Ntfy”, opcjonalnie „URL serwera Ntfy” i token dostępu, z przyciskami „Testuj” i „Zapisz”.',
  'help.ctx.settings-notifications.bullet.4':
    '„Powiadomienia push na tym urządzeniu”: „Włącz na tym urządzeniu” dotyczy tylko tej przeglądarki, a „Wyślij test” wysyła powiadomienie testowe. Kanał wtyczki pokazuje „Skonfiguruj”, dopóki nie zostanie skonfigurowany.',
  'help.ctx.settings-integrations.title': 'Integracje',
  'help.ctx.settings-integrations.summary':
    'Wszystko, co łączy TREK ze światem zewnętrznym: biblioteki zdjęć dla dziennika, AirTrail dla lotów, Dawarich dla miejsc, w których naprawdę byłeś, wanderer dla szlaków, klucze API tylko do odczytu dla innych programów i MCP dla klientów AI. Połączenie z inną usługą pojawia się dopiero wtedy, gdy administrator je włączy.',
  'help.ctx.settings-integrations.bullet.1':
    'Immich i Synology Photos, AirTrail, Dawarich i wanderer: każda karta ma pola na adres i klucz, przyciski „Zapisz” i „Testuj połączenie” oraz plakietkę „Połączono” lub „Nie połączono”.',
  'help.ctx.settings-integrations.bullet.2':
    'Klucze API: klucze tylko do odczytu dla publicznego API, każdy ograniczony do wybranych obszarów, wraz z adresem endpointu do skopiowania.',
  'help.ctx.settings-integrations.bullet.3':
    '„Konfiguracja MCP”: „Endpoint MCP”, a w sekcji „Klienci OAuth 2.1” Twoi zarejestrowani klienci, „Konfiguracja klienta” do skopiowania i „Aktywne sesje OAuth” z przyciskiem „Unieważnij”.',
  'help.ctx.settings-integrations.bullet.4':
    'Tokeny API: dawny sposób łączenia z MCP, oznaczony jako Przestarzałe. Zamiast tego użyj Klienci OAuth 2.1.',
  'help.ctx.settings-offline.title': 'Offline', // same-as-en
  'help.ctx.settings-offline.summary':
    'Co TREK przechowuje na tym urządzeniu, żeby podróż otwierała się także bez połączenia, i co się dzieje, gdy zmiana wprowadzona offline koliduje ze zmianą wprowadzoną gdzie indziej.',
  'help.ctx.settings-offline.bullet.1':
    'Tryb offline: „Wymuś tryb offline” najpierw pobiera wszystkie dane, potem korzysta wyłącznie z pamięci podręcznej, a Twoje zmiany ustawia w kolejce.',
  'help.ctx.settings-offline.bullet.2':
    '„Przygotuj do trybu offline”: „Pobierz do użytku offline” pobiera dane podróży, dokumenty i kafelki mapy, a „Synchronizuj ponownie” ręcznie uruchamia kolejną synchronizację.',
  'help.ctx.settings-offline.bullet.3':
    'Co przechowywać offline: Przechowuj kafelki mapy offline oraz przełącznik dla każdej podróży. Zakończona podróż jest zapisywana tylko wtedy, gdy ją włączysz.',
  'help.ctx.settings-offline.bullet.4':
    'Konflikty synchronizacji pojawiają się tylko wtedy, gdy dwie zmiany ze sobą kolidują, z opcjami Moją wersję, Zachowaj serwerową i Gdy wystąpi konflikt. Pamięć podręczna offline zlicza podróże oraz oczekujące i nieudane zmiany, z przyciskami Spróbuj ponownie, Odrzuć i Wyczyść pamięć podręczną.',
  'help.ctx.settings-account.title': 'Konto',
  'help.ctx.settings-account.summary':
    'Twoje konto w tym TREK i sposób logowania: zdjęcie profilowe, nazwa użytkownika i e-mail, hasło, uwierzytelnianie dwuskładnikowe i klucze dostępu. „Usuń konto” znajdziesz w stopce karty „Konto”.',
  'help.ctx.settings-account.bullet.1':
    'Konto: kliknij aparat na zdjęciu, żeby je przesłać, a czerwony kosz, żeby je usunąć. „Nazwę użytkownika” i „E-mail” zapisujesz przyciskiem „Zapisz profil”.',
  'help.ctx.settings-account.bullet.2':
    '„Zmień hasło”: obecne hasło, dwa razy nowe hasło, przy czym spełnione reguły są odhaczane w trakcie pisania, a potem „Zaktualizuj hasło”. Jeśli w tym TREK logujesz się wyłącznie przez SSO, ta karta jest niewidoczna.',
  'help.ctx.settings-account.bullet.3':
    'Uwierzytelnianie dwuskładnikowe (2FA) z aplikacją uwierzytelniającą i kodami zapasowymi; klucze dostępu do logowania bez hasła.',
  'help.ctx.settings-account.bullet.4':
    '„Usuń konto” jest po lewej stronie stopki karty „Konto” i wymaga potwierdzenia. Jedyny administrator nie może usunąć swojego konta.',
  // language-region
  'help.guide.language-region.title': 'Język, jednostki i waluta',
  'help.guide.language-region.goal': 'Korzystaj z TREK w swoim języku i z formatami typowymi dla Twojego regionu.',
  'help.guide.language-region.step.1':
    'W sekcji Język i region wybierz Język z rzędu znaczników. TREK przełącza się od razu, na każdym urządzeniu, na którym jesteś zalogowany.',
  'help.guide.language-region.step.2':
    'Nazwy miejsc ustawiają język, którego używają wyszukiwanie miejsc, podpowiedzi i adresy. Tak jak aplikacja podąża za językiem interfejsu.',
  'help.guide.language-region.result':
    'Daty, odległości i kwoty wyglądają tak, jak jesteś przyzwyczajony. W „Kosztach” kwoty są pokazywane w twojej walucie wyświetlania wyłącznie poglądowo; wpisane kwoty się nie zmieniają.',
  'help.guide.language-region.tip.1': '„Waluta wyjazdu” pokazuje każdą podróż w jej własnej walucie, bez przeliczania.',
  'help.guide.language-region.tip.2': 'Język określa też nazwy dni i miesięcy w Urlopach i w dzienniku.',
  // travel-map-prefs
  'help.guide.travel-map-prefs.title': 'Ustawienia mapy podróży i nagłówków dni',
  'help.guide.travel-map-prefs.goal':
    'Wybierz, co pokazuje mapa podróży i jak wyglądają nagłówki dni, we wszystkich podróżach.',
  'help.guide.travel-map-prefs.step.1':
    'W sekcji Podróże i mapa ustawienie Otwieraj miejsca w określa, którą aplikację z mapami od razu otwiera przycisk nawigacji. Pytaj za każdym razem pozwala wybierać aplikację za każdym razem. Data na początku nagłówków dni pokazuje w nagłówku każdego dnia najpierw datę z kalendarza.',
  'help.guide.travel-map-prefs.step.2':
    'Zawsze pokazuj trasy rezerwacji rysuje na mapie każdy lot, pociąg i inną rezerwację. Etykiety tras rezerwacji dodają nazwę stacji lub lotniska na każdym końcu. Kompaktowe znaczniki dla niezaplanowanych miejsc zmniejszają miejsca, które nie są jeszcze zaplanowane na żaden dzień, dzięki czemu łatwiej zobaczyć zaplanowane przystanki.',
  'help.guide.travel-map-prefs.result':
    'Mapa podróży korzysta z tych ustawień w każdej podróży, dopóki ich nie zmienisz.',
  'help.guide.travel-map-prefs.tip.1':
    'Te ustawienia dotyczą konta, a nie podróży. Każdy uczestnik wspólnej podróży widzi własne ustawienia.',
  'help.guide.travel-map-prefs.tip.2':
    'Administrator może ustawić wartości domyślne dla wszystkich; to, co zmienisz tutaj, dotyczy tylko ciebie.',
  // startup
  'help.guide.startup.title': 'Ekran startowy TREK',
  'help.guide.startup.goal':
    'Otwieraj TREK na stronie, z której korzystasz najczęściej, a nie za każdym razem na panelu.',
  'help.guide.startup.step.1':
    'U góry karty „Wygląd”, w sekcji „Uruchamianie”, ustaw „Strona startowa” na „Panel” lub „Aktywna podróż”.',
  'help.guide.startup.step.2':
    'Po wybraniu „Aktywna podróż” pojawi się „Karta startowa”: wybierz kartę, na której otwiera się ta podróż.',
  'help.guide.startup.result': 'Przy następnym uruchomieniu TREK od razu otworzy tę stronę.',
  'help.guide.startup.tip.1':
    'Aktywna podróż to podróż, która trwa dzisiaj, lub najbliższa nadchodząca. To ta sama podróż, którą panel pokazuje na górze.',
  // theme-scheme
  'help.guide.theme-scheme.title': 'Motyw i kolor akcentu',
  'help.guide.theme-scheme.goal': 'Ustaw TREK jako jasny, ciemny lub zgodny z urządzeniem, w ulubionym kolorze.',
  'help.guide.theme-scheme.step.1':
    'W sekcji „Motyw” ustaw „Motyw” na „Jasny”, „Ciemna” lub „Automatyczny”. „Automatyczny” dostosowuje się do ustawień urządzenia.',
  'help.guide.theme-scheme.step.2':
    'Wybierz schemat kolorów: „Domyślny”, „Wysoki kontrast”, „Indygo”, „Morski”, „Różany”, „Bursztynowy”, „Fioletowy” lub „Własny”.',
  'help.guide.theme-scheme.step.3':
    'Przy opcji „Własny” wybierz jedną z kolorowych kropek albo ustaw własny kolor akcentu osobno dla motywu „Jasny” i „Ciemna”. Pigułka obok pokazuje „Dobry kontrast” lub „Niski kontrast”.',
  'help.guide.theme-scheme.result':
    'Przyciski, linki i wyróżnienia używają koloru akcentu wszędzie, na każdym urządzeniu, na którym się logujesz.',
  'help.guide.theme-scheme.tip.1':
    'Na pasku nawigacji jest też szybki przełącznik trybu jasnego i ciemnego; ustawia ten sam motyw.',
  'help.guide.theme-scheme.tip.2': 'Wybierz schemat High contrast, jeśli domyślny jest dla Ciebie mało czytelny.',
  // readability
  'help.guide.readability.title': 'Dostosuj czytelność i rozmiar tekstu',
  'help.guide.readability.goal': 'Ogranicz efekt szkła i animacje, zwiększ odstępy lub tekst.',
  'help.guide.readability.step.1':
    'W sekcji „Czytelność” opcja „Przezroczystość” zamienia szklane panele na pełne tło, „Ogranicz animacje” ogranicza ruch do minimum, a „Gęstość” pozwala wybrać układ „Wygodny” lub „Kompaktowy”.',
  'help.guide.readability.step.2':
    'Wielkość tekstu: przesuń suwak „Wszystko”, aby przeskalować cały tekst naraz, albo ustaw osobno „Duży”, „Średni”, „Normalnie” i „Mały”. Przy każdym rozmiarze widać próbkę, więc efekt widzisz już podczas przesuwania.',
  'help.guide.readability.result': 'Zmiana od razu obejmuje całą aplikację, w tym panele mapy i dziennik.',
  'help.guide.readability.tip.1':
    'Niektóre części TREK już ograniczają animacje, gdy urządzenie ma ustawione ograniczenie ruchu. Opcja „Ogranicz ruch” ogranicza animacje w pozostałych częściach.',
  'help.guide.readability.tip.2':
    'Wielkość tekstu działa przez poziomy typografii, więc nic nie jest ucinane. Rozmiar, który się już nie mieści, zawija się do kolejnego wiersza.',
  // dashboard-widgets
  'help.guide.dashboard-widgets.title': 'Wybierz widżety pulpitu',
  'help.guide.dashboard-widgets.goal':
    'Pokazuj tylko widżety, z których korzystasz, osobno na komputerze i na telefonie.',
  'help.guide.dashboard-widgets.step.1':
    'W sekcji Widżety panelu karta Desktop wypisuje widżety Pod hero i Prawy pasek boczny. Wyłączenie opcji Prawy pasek boczny ukrywa całą kolumnę i wyśrodkowuje panel. Jej widżety są przygaszone, dopóki nie włączysz jej ponownie.',
  'help.guide.dashboard-widgets.step.2':
    'Wersja mobilna ma własne przełączniki, „Pod hero” i „Dół strony”, dla panelu na telefonie.',
  'help.guide.dashboard-widgets.result':
    'Pulpit zmienia się od razu. Gdy prawy pasek boczny jest wyłączony, pulpit jest wyśrodkowany.',
  'help.guide.dashboard-widgets.tip.1':
    'Widżety dodatku pojawiają się tylko wtedy, gdy administrator ma ten dodatek włączony.',
  'help.guide.dashboard-widgets.tip.2':
    'Sam panel zapamiętuje na każdym urządzeniu widok siatki lub listy i kolejność sortowania.',
  // map-provider
  'help.guide.map-provider.title': 'Wybór silnika i stylu mapy',
  'help.guide.map-provider.goal': 'Przełączaj się między klasyczną mapą, kafelkami wektorowymi i mapą 3D z Mapbox.',
  'help.guide.map-provider.step.1':
    'W sekcji „Dostawca mapy” wybierz Leaflet dla klasycznej mapy 2D z dowolnymi kafelkami rastrowymi, Mapbox GL dla kafelków wektorowych z budynkami 3D i ukształtowaniem terenu albo MapLibre GL dla kafelków wektorowych OpenFreeMap bez tokena.',
  'help.guide.map-provider.step.2':
    'Wybierz „Szablon mapy” dla Leaflet lub „Styl mapy” dla silnika GL albo wklej własny URL. Mapbox GL wymaga „Tokena dostępu Mapbox”, a szablony CARTO „Klucza API CARTO”; link pod każdym polem pokazuje, skąd go wziąć.',
  'help.guide.map-provider.step.3':
    'W Mapbox GL włącz „Budynki 3D i teren”, a jeśli Twoje urządzenie jest wystarczająco wydajne, także „Tryb wysokiej jakości”. Sprawdź podgląd i kliknij „Zapisz mapę”.',
  'help.guide.map-provider.result':
    'Planer podróży i mapy dziennika korzystają z wybranego silnika. Atlas zawsze korzysta z Leaflet.',
  'help.guide.map-provider.tip.1': 'Bez tokenu Mapbox GL przełącza się na Leaflet, zamiast pokazywać pustą mapę.',
  'help.guide.map-provider.tip.2':
    'Kafelki mapy zapisane offline pochodzą od dostawcy, który był aktywny w chwili pobierania.',
  // notification-channels
  'help.guide.notification-channels.title': 'Ustaw, gdzie dostajesz powiadomienia',
  'help.guide.notification-channels.goal':
    'Otrzymuj przypomnienia o podróżach i powiadomienia o współpracy na telefon lub w innym narzędziu.',
  'help.guide.notification-channels.step.1':
    'Dla webhooka wklej „URL webhooka” Discorda, Slacka lub własnego, kliknij „Testuj”, a potem „Zapisz”.',
  'help.guide.notification-channels.step.2':
    'Dla ntfy wpisz „Temat Ntfy”, a jeśli masz własny serwer, dodaj też „URL serwera Ntfy” i token dostępu. „Testuj” od razu wysyła wiadomość, a „Zapisz” zapisuje ustawienia.',
  'help.guide.notification-channels.step.3':
    'Na karcie „Powiadomienia” u góry włącz lub wyłącz każde zdarzenie dla każdego kanału. Kłódka oznacza, że administrator wyłączył je dla wszystkich. Kanał wtyczki pokazuje „Skonfiguruj”, dopóki nie zostanie skonfigurowany; „Wyślij test” pozwala go sprawdzić.',
  'help.guide.notification-channels.result':
    'Zdarzenia są wysyłane kanałami, które dla nich włączyłeś. Kolumna „W aplikacji” określa, co pokazuje dzwonek na pasku nawigacji.',
  'help.guide.notification-channels.tip.1':
    'Przypomnienie dla konkretnej podróży, czyli na ile dni przed wyjazdem ma przyjść, ustawisz w formularzu edycji podróży.',
  'help.guide.notification-channels.tip.2':
    'Administrator może ustawić dla wszystkich domyślny serwer ntfy, ale temat nadal wybierasz sam.',
  // photo-providers
  'help.guide.photo-providers.title': 'Łączenie biblioteki zdjęć',
  'help.guide.photo-providers.goal': 'Pozwól dziennikowi wczytywać zdjęcia z danego dnia z Immich lub Synology Photos.',
  'help.guide.photo-providers.step.1':
    'W sekcji „Integracje” znajdź kartę Immich lub Synology Photos i wpisz wymagane dane: „URL serwera” i „Klucz API” dla Immich albo „Nazwa użytkownika” i „Hasło” dla Synology Photos. Immich może też kopiować zdjęcia z dziennika do biblioteki Immich podczas ich przesyłania.',
  'help.guide.photo-providers.step.2': 'Kliknij Testuj połączenie, a potem Zapisz. Plakietka zmieni się na Połączono.',
  'help.guide.photo-providers.result':
    'Karta „External photos” w edytorze wpisu przeszukuje podłączoną bibliotekę pod kątem dnia wpisu, zaczynając od zdjęć najbliższych jego lokalizacji.',
  'help.guide.photo-providers.tip.1':
    'Połączenie dotyczy tylko Twojego konta: pozostali członkowie dziennika podłączają własne biblioteki.',
  'help.guide.photo-providers.tip.2':
    'Dostawca, którego zdjęcia nie mają danych GPS, też działa. Lista jest wtedy sortowana według czasu.',
  // api-keys
  'help.guide.api-keys.title': 'Utwórz klucz API',
  'help.guide.api-keys.goal': 'Pozwól innym programom odczytywać twoje podróże przez publiczne API.',
  'help.guide.api-keys.step.1':
    'W sekcji „Klucze API” kliknij „Utwórz klucz”, wpisz w polu „Nazwa”, gdzie będzie używany, a w sekcji „Co ten klucz może odczytywać” zostaw tylko potrzebne obszary. Kliknij „Utwórz”.',
  'help.guide.api-keys.step.2':
    'Skopiuj klucz z okna „Klucz API utworzony”: jest pokazywany tylko raz. Kliknij „Gotowe”. Endpoint do wywołań jest widoczny pod listą.',
  'help.guide.api-keys.result':
    'Program z tym kluczem może odczytywać wybrane obszary, ale nigdy niczego nie zmienia. Lista pokazuje, kiedy każdy klucz utworzono i kiedy ostatnio go użyto, a kosz go usuwa.',
  'help.guide.api-keys.tip.1':
    'Używaj osobnego klucza dla każdego narzędzia, aby móc unieważnić klucz bez wpływu na pozostałe narzędzia.',
  'help.guide.api-keys.tip.2':
    'Jeśli klient AI ma móc wprowadzać zmiany, użyj MCP z OAuth. Klucze API służą tylko do odczytu.',
  // mcp-oauth
  'help.guide.mcp-oauth.title': 'Łączenie asystenta AI przez MCP',
  'help.guide.mcp-oauth.goal': 'Daj Claude, środowisku IDE lub innemu klientowi MCP dostęp do swoich podróży.',
  'help.guide.mcp-oauth.step.1': 'W sekcji Konfiguracja MCP skopiuj Endpoint MCP dla swojego klienta.',
  'help.guide.mcp-oauth.step.2':
    'W sekcji Klienci OAuth 2.1 kliknij Nowy klient i wybierz gotowy szablon, na przykład Claude Desktop lub Cursor, albo samodzielnie wypełnij Nazwa aplikacji, URI przekierowania i Dozwolone uprawnienia. Dla serwera bez przeglądarki wybierz Machine client. Kliknij Zarejestruj klienta i skopiuj Sekret klienta: pokazuje się tylko raz.',
  'help.guide.mcp-oauth.step.3':
    'Każdy klient ma przyciski „Odnów sekret” i „Usuń klienta”. „Aktywne sesje OAuth” pokazuje zalogowanych klientów z przyciskiem „Unieważnij”. Po rozwinięciu „Konfiguracja klienta” zobaczysz gotowy fragment dla klientów korzystających z JSON.',
  'help.guide.mcp-oauth.result':
    'Klient może czytać i zmieniać to, na co pozwalają jego uprawnienia, w Twoim imieniu, a każda czynność pojawia się pod Twoim nazwiskiem.',
  'help.guide.mcp-oauth.tip.1':
    'Uprawnienia ograniczają, co może klient: dawaj mu tylko uprawnienie do odczytu, dopóki nie będzie potrzebował więcej.',
  'help.guide.mcp-oauth.tip.2': 'Administrator może wyłączyć MCP dla całej instancji. Wtedy ta sekcja się nie pojawia.',
  // offline-prepare
  'help.guide.offline-prepare.title': 'Korzystaj z podróży offline',
  'help.guide.offline-prepare.goal': 'Zapisz podróże i ich mapy na tym urządzeniu, zanim stracisz połączenie.',
  'help.guide.offline-prepare.step.1':
    'W sekcji „Co przechowywać offline” zostaw włączone „Przechowuj kafelki mapy offline” i włącz podróże, które chcesz mieć na tym urządzeniu. Zakończona podróż jest zapisywana tylko wtedy, gdy ją włączysz.',
  'help.guide.offline-prepare.step.2':
    'U góry, w sekcji „Przygotuj do trybu offline”, kliknij „Pobierz do użytku offline”. Pobierane są dane podróży, dokumenty i kafelki mapy, a na koniec zobaczysz, ile podróży zapisano.',
  'help.guide.offline-prepare.step.3':
    '„Wymuś tryb offline” jeszcze raz pobiera dane, a potem działa wyłącznie na danych z tego urządzenia, więc przed wyjazdem możesz sprawdzić, czy wszystko jest na miejscu.',
  'help.guide.offline-prepare.result':
    'Podróże otwierają się bez połączenia. Wprowadzone zmiany trafiają do kolejki i są wysyłane, gdy znów będziesz online.',
  'help.guide.offline-prepare.tip.1':
    'Najwięcej miejsca zajmują kafelki mapy. Wyłącz je, aby zachować tylko dane podróży i dokumenty.',
  'help.guide.offline-prepare.tip.2':
    'Aby TREK najlepiej uruchamiał się offline, zainstaluj go jako aplikację z przeglądarki.',
  // offline-conflicts
  'help.guide.offline-conflicts.title': 'Zdecyduj, która wersja zostaje przy konflikcie synchronizacji',
  'help.guide.offline-conflicts.goal':
    'Wybierz, jak TREK rozwiązuje konflikt między zmianą wprowadzoną offline a zmianą wprowadzoną gdzie indziej.',
  'help.guide.offline-conflicts.step.1':
    'Gdy zmiana wprowadzona offline koliduje z nowszą, u góry sekcji „Offline” pojawiają się „Konflikty synchronizacji”. Przy każdej zmianie kliknij „Moją wersję” lub „Zachowaj serwerową”.',
  'help.guide.offline-conflicts.step.2':
    'Na tej samej karcie ustawienie Gdy wystąpi konflikt rozstrzyga na przyszłość: Pytaj mnie za każdym razem, Zawsze zachowuj moją wersję albo Zawsze zachowuj wersję serwera.',
  'help.guide.offline-conflicts.result':
    'Przy opcji „Pytaj mnie za każdym razem” konflikt czeka w „Konflikty synchronizacji”, aż coś wybierzesz. Przy pozostałych dwóch opcjach TREK rozwiązuje go automatycznie.',
  'help.guide.offline-conflicts.tip.1':
    '„Wyczyść pamięć podręczną” usuwa tylko kopię na tym urządzeniu. Na serwerze nic się nie zmienia.',
  // profile
  'help.guide.profile.title': 'Zmień swój profil',
  'help.guide.profile.goal': 'Zaktualizuj swoje imię, adres e-mail i zdjęcie.',
  'help.guide.profile.step.1':
    'Na karcie „Konto” kliknij aparat na swoim zdjęciu, żeby przesłać nowe; czerwony kosz je usuwa i przywraca twój inicjał.',
  'help.guide.profile.step.2': 'Zmień „Nazwę użytkownika” i „E-mail” pod zdjęciem.',
  'help.guide.profile.result':
    'Twoje imię i zdjęcie aktualizują się od razu wszędzie, także w udostępnianych podróżach.',
  'help.guide.profile.tip.1': 'Konto połączone przez SSO ma plakietkę SSO i informację „Połączono z” z nazwą dostawcy.',
  // password
  'help.guide.password.title': 'Zmiana hasła',
  'help.guide.password.goal': 'Ustaw nowe hasło.',
  'help.guide.password.step.1':
    'W sekcji Zmień hasło wpisz Aktualne hasło, potem Nowe hasło i to samo jeszcze raz w polu Potwierdź nowe hasło. Lista poniżej odznacza każdą spełnioną zasadę w trakcie pisania.',
  'help.guide.password.step.2': 'Kliknij „Zaktualizuj hasło”.',
  'help.guide.password.result':
    'Nowe hasło obowiązuje od razu. Na wszystkich innych urządzeniach zostaniesz wylogowany, Twoje tokeny API MCP zostaną usunięte, a klienci OAuth będą musieli zalogować się ponownie. To urządzenie pozostaje zalogowane.',
  'help.guide.password.tip.1':
    'Jeśli w tym TREK logujesz się wyłącznie przez SSO, nie masz hasła TREK, a karty „Zmień hasło” nie ma.',
  // mfa
  'help.guide.mfa.title': 'Włącz uwierzytelnianie dwuskładnikowe',
  'help.guide.mfa.goal': 'Chroń konto kodem z aplikacji uwierzytelniającej.',
  'help.guide.mfa.step.1':
    'W sekcji „Uwierzytelnianie dwuskładnikowe (2FA)” kliknij „Skonfiguruj aplikację uwierzytelniającą”.',
  'help.guide.mfa.step.2':
    'Zeskanuj kod QR w aplikacji lub wpisz klucz ręcznie, a potem wpisz wyświetlony sześciocyfrowy kod i kliknij „Włącz 2FA”.',
  'help.guide.mfa.step.3':
    'Zapisz kody zapasowe przyciskiem „Kopiuj kody”, „Pobierz TXT” lub „Drukuj / PDF”, a potem kliknij OK. Każdy kod działa tylko raz. Użyj kodu, gdy nie masz przy sobie telefonu.',
  'help.guide.mfa.result': 'Przy każdym logowaniu po haśle trzeba podać kod.',
  'help.guide.mfa.tip.1': '„Wyłącz 2FA” wymaga hasła oraz aktualnego kodu lub niewykorzystanego kodu zapasowego.',
  'help.guide.mfa.tip.2': 'Administrator może wymagać 2FA od wszystkich. Wtedy nie da się go tu wyłączyć.',
  // passkeys
  'help.guide.passkeys.title': 'Zaloguj się kluczem dostępu',
  'help.guide.passkeys.goal': 'Loguj się odciskiem palca, twarzą lub kodem PIN urządzenia zamiast hasłem.',
  'help.guide.passkeys.step.1':
    'W sekcji „Klucze dostępu” kliknij „Dodaj klucz dostępu”, potwierdź obecne hasło i nadaj kluczowi nazwę wskazującą urządzenie, a potem postępuj zgodnie z instrukcjami urządzenia.',
  'help.guide.passkeys.step.2':
    'Przy każdym kluczu dostępu widać, czy jest „Zsynchronizowany”, czy przypisany do „To urządzenie”, oraz kiedy był ostatnio użyty. „Zmień nazwę” zmienia jego nazwę, a przycisk usuwania usuwa go po podaniu hasła.',
  'help.guide.passkeys.result':
    'Na stronie logowania pojawia się opcja klucza dostępu. Nadal możesz logować się hasłem.',
  'help.guide.passkeys.tip.1':
    'Klucz dostępu jest przechowywany na urządzeniu lub w jego menedżerze haseł, więc dodaj osobny klucz dla każdego urządzenia.',
  'help.guide.passkeys.tip.2':
    'Klucze dostępu są widoczne dopiero wtedy, gdy administrator je włączy. Dopóki serwer nie ma ustawionej domeny WebAuthn, karta informuje o tym zamiast oferować „Dodaj klucz dostępu”.',
  // delete-account
  'help.guide.delete-account.title': 'Usuwanie konta',
  'help.guide.delete-account.goal': 'Usuń swoje konto i dane, które należą tylko do Ciebie.',
  'help.guide.delete-account.step.1':
    'Na karcie Konto kliknij Usuń konto po lewej stronie jej stopki, a potem Usuń na zawsze.',
  'help.guide.delete-account.result':
    'Twoje konto zostaje usunięte razem z podróżami, miejscami i plikami, których jesteś właścicielem. Podróże należące do innych osób zostają.',
  'help.guide.delete-account.tip.1':
    'Jeśli jesteś jedynym administratorem, TREK pokaże „Nie można usunąć konta”: najpierw nadaj uprawnienia administratora innemu użytkownikowi.',
  'help.guide.delete-account.tip.2': 'Tego nie można cofnąć. Zanim potwierdzisz, wyeksportuj to, co chcesz zachować.',

  // ── Screen: admin (all tabs) ──────────────────────────────────────────────────────────
  'help.ctx.admin.title': 'Administrator',
  'help.ctx.admin.summary':
    'Ustawienia całej instancji TREK, wspólne dla wszystkich użytkowników: kto i jak może się logować, co jest włączone, gdzie są przechowywane pliki, jak serwer kontaktuje się z ludźmi i jak tworzone są kopie zapasowe. Tę stronę widzą tylko administratorzy. Pasek boczny dzieli karty na grupy „Użytkownicy”, „Konfiguracja”, „Integracje” i „Konserwacja”, a każda karta to osobny ekran.',
  'help.ctx.admin.bullet.1':
    'Po prawej stronie nagłówka widać liczbę użytkowników, podróży, miejsc i plików. Pod nim pojawia się baner „Dostępna aktualizacja”, gdy jest dostępne nowsze wydanie TREK.',
  'help.ctx.admin.bullet.2':
    '„Użytkownicy” i „Domyślne ustawienia”: konta, linki zaproszeń i uprawnienia oraz ustawienia i mapa, z którymi startuje nowe konto.',
  'help.ctx.admin.bullet.3':
    'Personalizacja, Ustawienia, Dodatki, Wtyczki i Magazyn: szablony pakowania, kategorie i ferie szkolne; logowanie, klucze dostępu, 2FA, klucze API i dostawcy wyszukiwania; moduły funkcji; wtyczki zewnętrzne; miejsce zapisu przesłanych plików.',
  'help.ctx.admin.bullet.4':
    'Powiadomienia, Dostęp MCP i GitHub: kanały dostępne dla użytkowników i ich ustawienia początkowe, tokeny i sesje klientów AI oraz historia wydań.',
  'help.ctx.admin.bullet.5':
    'Backupy i Audit: kopie zapasowe na żądanie i według harmonogramu oraz dziennik zdarzeń związanych z bezpieczeństwem.',
  'help.ctx.admin-users.title': 'Użytkownicy',
  'help.ctx.admin-users.summary':
    'Wszystkie konta w tym TREK, z rolą, adresem e-mail i czasem ostatniej aktywności, linki zaproszeń, dzięki którym można rejestrować się w zamkniętej instancji, oraz uprawnienia w podróżach.',
  'help.ctx.admin-users.bullet.1':
    'Tabela: użytkownik, e-mail, rola, data utworzenia i Ostatnia aktywność, z przyciskami Edytuj użytkownika i Usuń użytkownika w każdym wierszu. Zielona kropka na awatarze oznacza, że osoba jest teraz online. Twój wiersz jest oznaczony (Ty).',
  'help.ctx.admin-users.bullet.2':
    '„Utwórz użytkownika” w prawym górnym rogu karty „Użytkownicy” ręcznie dodaje konto z hasłem, które przekazujesz użytkownikowi.',
  'help.ctx.admin-users.bullet.3':
    'Poniżej „Linki zaproszeń”: linki rejestracyjne z limitem użyć, terminem ważności i opcjonalnie podróżą, do której nowy użytkownik dołączy po rejestracji.',
  'help.ctx.admin-users.bullet.4':
    'Na dole „Ustawienia uprawnień”: dla każdej akcji określasz, kto może ją wykonywać („Wszyscy”, „Członkowie podróży”, „Właściciel podróży” lub „Tylko admin”). Zmiany zapisujesz przyciskiem „Zapisz” u góry karty.',
  'help.ctx.admin-defaults.title': 'Domyślne ustawienia',
  'help.ctx.admin-defaults.summary':
    'Ustawienia, z którymi startuje nowe konto, żeby nikt nie musiał ich najpierw konfigurować: motyw, jednostki, format czasu, pierwszy dzień tygodnia, waluta wyświetlania i rozmywanie kodów rezerwacji, a także mapa, jej klucze i serwery wyznaczania tras.',
  'help.ctx.admin-defaults.bullet.1':
    '„Domyślne ustawienia użytkownika” po lewej: „Motyw”, „Jednostka temperatury”, „Jednostka odległości”, „Format czasu”, „Tydzień zaczyna się w”, „Waluta wyświetlania” i „Rozmyj kody rezerwacji”.',
  'help.ctx.admin-defaults.bullet.2':
    'Mapa po prawej: „Szablon mapy”, „Współdzielony klucz CARTO”, „Własny silnik tras” i „Własna instancja Valhalli”, podgląd, a dalej „Silnik map” ze „Styl mapy”, „Współdzielony token Mapbox”, „Budynki i teren 3D” oraz „Tryb wysokiej jakości”.',
  'help.ctx.admin-config.title': 'Personalizacja',
  'help.ctx.admin-config.summary':
    'Ustawienia wspólne dla wszystkich podróży na serwerze: szablony pakowania, zestaw kategorii dla miejsc i kolekcji oraz katalog ferii szkolnych używany przez Urlopy.',
  'help.ctx.admin-config.bullet.1':
    'Szablony pakowania: nazwane listy kategorii i przedmiotów, od których może zacząć się lista pakowania podróży.',
  'help.ctx.admin-config.bullet.2':
    'Kategorie: nazwa, ikona i kolor kategorii używanych w całym TREK, od inspektora miejsca po Kolekcje. Każdą edytujesz w oknie z podglądem.',
  'help.ctx.admin-config.bullet.3':
    '„Ferie szkolne”: katalog krajów i regionów z terminami ferii, które każdy może wybrać w „Urlopy”.',
  'help.ctx.admin-settings.title': 'Ustawienia',
  'help.ctx.admin-settings.summary':
    'Jak użytkownicy się logują i z jakich usług zewnętrznych może korzystać serwer. Po lewej: metody uwierzytelniania, „Logowanie kluczem dostępu”, „Wymagaj uwierzytelniania dwuskładnikowego (2FA)” i „Logowanie jednokrotne (OIDC)”. Po prawej: „Dozwolone typy plików” i „Klucze API” z dostawcami wyszukiwania i transportu publicznego. Na dole jest „Strefa zagrożenia”.',
  'help.ctx.admin-settings.bullet.1':
    'Metody uwierzytelniania: Password Login, Password Registration oraz, po skonfigurowaniu OIDC, SSO Login i SSO Auto-Provisioning. „Wymagaj uwierzytelniania dwuskładnikowego (2FA)” ma osobną kartę.',
  'help.ctx.admin-settings.bullet.2':
    '„Logowanie kluczem dostępu”: „Włącz logowanie kluczem dostępu”, „Relying Party ID (domena)” i „Dozwolone origins”. „Logowanie jednokrotne (OIDC)”: „Wyświetlana nazwa”, „URL wystawcy”, opcjonalny adres URL discovery, „ID klienta” i „Sekret klienta”.',
  'help.ctx.admin-settings.bullet.3':
    'Klucze API: na początku jest TREK Places API, które nie wymaga klucza. Pod nim znajdziesz „Klucz Google Maps API” (z przyciskami „Testuj” i „Do czego służy klucz”), klucz Unsplash i klucz Amap, a na dole karty jeden wspólny przycisk „Zapisz”.',
  'help.ctx.admin-settings.bullet.4':
    '„Dostawca transportu publicznego” i „Dostawca wyszukiwania miejsc” określają, kto obsługuje wyszukiwanie połączeń i miejsc. „Dziennik wyszukiwania miejsc” zapisuje, który wynik wybrano, a „Dozwolone typy plików” ogranicza przesyłane pliki.',
  'help.ctx.admin-addons.title': 'Dodatki',
  'help.ctx.admin-addons.summary':
    'Moduły funkcji TREK, każdy z własnym przełącznikiem: Pakowanie, Budżet, Dokumenty, Urlopy, Atlas, Współpraca, Dziennik podróży, Kolekcje, Podróż samochodowa, MCP, AirTrail, Dawarich i Analiza AI. Wyłączenie modułu usuwa dla wszystkich jego pozycję w nawigacji, ścieżki i API.',
  'help.ctx.admin-addons.bullet.1':
    'Każdy dodatek ma swój kafelek z przełącznikiem oraz, jeśli ma jakieś opcje, wierszami z tymi opcjami.',
  'help.ctx.admin-addons.bullet.2':
    'Dostawcy zdjęć i dokumentów też mają tu swoje kafelki, więc możesz udostępnić użytkownikom na przykład Immich lub Synology.',
  'help.ctx.admin-addons.bullet.3': '„Kontrola bagażu” ma własny przełącznik pod kafelkami.',
  'help.ctx.admin-plugins.title': 'Wtyczki',
  'help.ctx.admin-plugins.summary':
    'Wtyczki innych firm, które działają we własnym procesie obok TREK, każda z uprawnieniami, o które poprosiła podczas instalacji. Zainstaluj je z katalogu, prześlij pakiet albo podłącz folder, gdy tworzysz własną wtyczkę.',
  'help.ctx.admin-plugins.bullet.1':
    'Zainstalowane i Odkrywaj, z polem Szukaj wtyczek… oraz filtrami Typ, Status i Sortuj. Każdy wiersz pokazuje wersję, czy wtyczka jest Zweryfikowana, Podpisana lub Niepodpisana, do czego ma dostęp, przełącznik i menu ⋯.',
  'help.ctx.admin-plugins.bullet.2':
    'Dwie ikony w nagłówku karty: „Prześlij wtyczkę” przyjmuje plik .zip, .tgz lub .tar.gz (możesz też upuścić .zip na stronę); „Skanuj ponownie” wykrywa folder wtyczki podlinkowany na potrzeby programowania.',
  'help.ctx.admin-plugins.bullet.3':
    'Dozwolone hosty dla każdej wtyczki: adresy, z którymi wtyczka może się łączyć, bo połączenia wychodzące są domyślnie blokowane.',
  'help.ctx.admin-storage.title': 'Magazyn',
  'help.ctx.admin-storage.summary':
    'Gdzie są przechowywane przesłane pliki: na dysku lokalnym lub w buckecie S3, opcjonalnie z kopią w kolejnych backendach. Każda kategoria plików może trafiać do innego backendu, a nic się nie zmienia, dopóki nie klikniesz „Zapisz zmiany”.',
  'help.ctx.admin-storage.bullet.1':
    '„Zdrowie” u góry: nieudane zapisy do celu replikacji albo komunikat „Nie odnotowano żadnych błędów replik.”.',
  'help.ctx.admin-storage.bullet.2':
    '„Backendy”: nazwa, typ, zajętość i Mirrored to, z przyciskami „Testuj”, „Edytuj” i „Usuń”. „Oblicz teraz” liczy, ile danych jest przechowywanych; backend zdefiniowany zmienną środowiskową jest tylko do odczytu.',
  'help.ctx.admin-storage.bullet.3':
    'Kategorie: dokumenty podróży, zdjęcia z dziennika, okładki, zdjęcia profilowe, obrazy miejsc, pamięć podręczna zdjęć i kopie zapasowe, każda przypisana do jakiegoś backendu.',
  'help.ctx.admin-notifications.title': 'Powiadomienia',
  'help.ctx.admin-notifications.summary':
    'Kanały, które serwer udostępnia użytkownikom, oraz te, na które Ty jako administrator dostajesz powiadomienia. Użytkownicy wybierają własne tematy i adresy URL w „Ustawieniach”, a Ty decydujesz, co jest dostępne, i konfigurujesz e-mail.',
  'help.ctx.admin-notifications.bullet.1':
    '„E-mail (SMTP)”, Webhook, Ntfy i Web Push mają osobne przełączniki, które udostępniają kanał użytkownikom. E-mail wymaga też ustawień serwera. Powiadomienia w aplikacji są zawsze włączone.',
  'help.ctx.admin-notifications.bullet.2':
    '„Przypomnienia o podróżach”: czy serwer wysyła przypomnienie przed rozpoczęciem podróży.',
  'help.ctx.admin-notifications.bullet.3':
    'Webhook admina, Admin Ntfy i karta Powiadomienia: tu trafiają zdarzenia administracyjne (Nowa wersja dostępna, Awaria repliki magazynu, Prośba o region wodny), każdy kanał z przyciskiem testu.',
  'help.ctx.admin-mcp-tokens.title': 'Dostęp MCP',
  'help.ctx.admin-mcp-tokens.summary':
    'Wszystkie tokeny i sesje OAuth, które klienci AI mają w tej instancji TREK, u wszystkich użytkowników. Każdy z nich możesz unieważnić.',
  'help.ctx.admin-mcp-tokens.bullet.1':
    '„Sesje OAuth”: klient, przyznane mu zakresy, jego właściciel i data, z ikoną kosza, która unieważnia sesję.',
  'help.ctx.admin-mcp-tokens.bullet.2':
    '„Tokeny API”: nazwa, właściciel, „Utworzono” i „Ostatnio użyto”, z ikoną kosza, która usuwa token.',
  'help.ctx.admin-github.title': 'GitHub',
  'help.ctx.admin-github.summary':
    'Co nowego w TREK: historia wydań z GitHuba i informacja, czy jest dostępna nowsza wersja niż twoja. Sama aktualizacja odbywa się poza aplikacją, na serwerze.',
  'help.ctx.admin-github.bullet.1':
    '„Historia wydań” pokazuje wydania na osi czasu z ich opisami. Najnowsze ma etykietę „Najnowsze”, wersje przedpremierowe oznaczenie „Wersja testowa”, a GitHub otwiera stronę wydań.',
  'help.ctx.admin-github.bullet.2':
    'Gdy pojawi się nowsze wydanie, pod nagłówkiem strony wyświetla się „Dostępna aktualizacja”. „Jak zaktualizować” pokazuje polecenia dla Dockera lub przewodnik aktualizacji dla innych instalacji.',
  'help.ctx.admin-backup.title': 'Backupy',
  'help.ctx.admin-backup.summary':
    'Pełne kopie zapasowe bazy danych i przesłanych plików, tworzone ręcznie lub według harmonogramu, przechowywane na serwerze i do pobrania jako jeden plik. Przyciskiem „Przywróć” odtworzysz kopię zapasową.',
  'help.ctx.admin-backup.bullet.1':
    'Kopia zapasowa danych: u góry karty Utwórz kopię zapasową i Prześlij kopię zapasową, a pod nimi lista kopii z przyciskami Pobierz, Przywróć i ikoną kosza do usuwania.',
  'help.ctx.admin-backup.bullet.2':
    'Prześlij kopię zapasową przywraca dane z pliku wykonanego w innej instancji albo wcześniejszego dnia, po tym samym pytaniu co Przywróć.',
  'help.ctx.admin-backup.bullet.3':
    '„Automatyczna kopia zapasowa”: włączona lub wyłączona, „Częstotliwość”, „Uruchom o godzinie” i dzień oraz „Usuń stare kopie zapasowe po” (od „1 dzień” do „Przechowuj na zawsze”); zmiany zatwierdzasz przyciskiem „Zapisz”.',
  'help.ctx.admin-audit.title': 'Audyt',
  'help.ctx.admin-audit.summary':
    'Dziennik zdarzeń administracyjnych i ważnych dla bezpieczeństwa: logowania i nieudane próby, zmiany MFA, zmiany użytkowników i ustawień, kopie zapasowe i przywracanie. Tylko do odczytu, najnowsze na górze.',
  'help.ctx.admin-audit.bullet.1':
    'Jeden wiersz na zdarzenie, z czasem, użytkownikiem, akcją, zasobem, adresem IP i szczegółami.',
  'help.ctx.admin-audit.bullet.2':
    '„Odśwież” w nagłówku karty ponownie wczytuje listę. Plakietka obok tytułu pokazuje, ile wpisów wczytano z ogólnej liczby, a „Załaduj więcej” wczytuje starsze wpisy.',
  // create-user
  'help.guide.create-user.title': 'Utwórz użytkownika',
  'help.guide.create-user.goal': 'Dodaj konto ręcznie, bez zaproszenia.',
  'help.guide.create-user.step.1': 'Kliknij „Utwórz użytkownika” w prawym górnym rogu karty „Użytkownicy”.',
  'help.guide.create-user.step.2':
    'Wpisz „Nazwę użytkownika”, „E-mail” i „Hasło”; lista pod hasłem pokazuje, które reguły hasło spełnia. Wybierz „Rolę”: „Użytkownik” lub „Administrator”.',
  'help.guide.create-user.step.3': 'Kliknij „Utwórz użytkownika”.',
  'help.guide.create-user.result':
    'Konto pojawia się w tabeli i od razu można się na nie zalogować. Przekaż hasło tej osobie zaufanym kanałem.',
  'help.guide.create-user.tip.1': 'Jeśli ktoś ma sam wybrać hasło, lepiej wyślij mu link z zaproszeniem.',
  'help.guide.create-user.tip.2':
    'Administrator widzi tę stronę i może wszystko. Co może robić w podróżach Użytkownik, ustawisz poniżej w sekcji „Ustawienia uprawnień”.',
  // edit-user
  'help.guide.edit-user.title': 'Zmiana danych lub hasła użytkownika',
  'help.guide.edit-user.goal':
    'Zmień komuś nazwę, nadaj lub odbierz uprawnienia administratora albo pomóż się ponownie zalogować po utracie hasła.',
  'help.guide.edit-user.step.1':
    'Kliknij ołówek (Edytuj użytkownika) w wierszu użytkownika. Na górze okna widać adres e-mail konta.',
  'help.guide.edit-user.step.2':
    'Zmień „Nazwa użytkownika”, „E-mail” lub „Rola” albo wpisz „Nowe hasło” (zostaw puste, żeby zachować obecne) i kliknij „Zapisz”. „Zresetuj klucze dostępu” na dole po potwierdzeniu usuwa wszystkie klucze dostępu konta.',
  'help.guide.edit-user.result':
    'Zmiana działa od razu. Nowe hasło wylogowuje też użytkownika na wszystkich urządzeniach, więc stara sesja przestaje działać.',
  'help.guide.edit-user.tip.1': 'Nie możesz odebrać sobie roli administratora, jeśli jesteś ostatnim administratorem.',
  'help.guide.edit-user.tip.2':
    'Reset kluczy dostępu zachowuje hasło. Użytkownik dodaje nowe klucze w Ustawienia, Konto.',
  // invite-links
  'help.guide.invite-links.title': 'Zaproś kogoś przez link',
  'help.guide.invite-links.goal':
    'Pozwól komuś zarejestrować się w zamkniętej instancji i, jeśli chcesz, dodaj go do podróży.',
  'help.guide.invite-links.step.1': 'Kliknij „Utwórz link” w prawym górnym rogu karty „Linki zaproszeń”.',
  'help.guide.invite-links.step.2':
    'Wybierz „Maksymalna liczba użyć” (od 1× do 5× lub ∞) i „Wygasa po” (od 1d do 14d lub ∞), opcjonalnie podróż w polu „Dodaj do podróży (opcjonalnie)”, i kliknij „Utwórz i skopiuj”.',
  'help.guide.invite-links.step.3':
    'Wyślij link. W każdym wierszu widać, ile razy go użyto, kiedy wygasa, do jakiej podróży dodaje i kto go utworzył, a obok status: „Aktywny”, „Wygasł” lub „Wykorzystany”. „Skopiuj link” kopiuje go ponownie, a ikona kosza go usuwa.',
  'help.guide.invite-links.result':
    'Osoba, która otworzy link, rejestruje się z własnym hasłem. Jeśli wybrano podróż, od razu do niej dołącza.',
  'help.guide.invite-links.tip.1':
    'Linki z zaproszeniem działają nawet wtedy, gdy w „Ustawieniach” wyłączona jest rejestracja z hasłem.',
  'help.guide.invite-links.tip.2':
    'Dla pojedynczej osoby najbezpieczniejszy jest link jednorazowy z krótkim terminem ważności.',
  // delete-user
  'help.guide.delete-user.title': 'Usuwanie użytkownika',
  'help.guide.delete-user.goal': 'Usuń konto wraz ze wszystkim, co do niego należy.',
  'help.guide.delete-user.step.1':
    'Kliknij kosz (Usuń użytkownika) w wierszu użytkownika i potwierdź przyciskiem Usuń.',
  'help.guide.delete-user.result':
    'Konto zostaje usunięte razem ze wszystkimi podróżami i dziennikami, których jest właścicielem, także z podróżami udostępnionymi innym. Podróże, w których użytkownik był tylko członkiem, zostają u swoich właścicieli.',
  'help.guide.delete-user.tip.1': 'Tego nie można cofnąć. Jeśli nie masz pewności, najpierw zrób kopię zapasową.',
  'help.guide.delete-user.tip.2':
    'Ikona kosza w twoim własnym wierszu nie działa: nie możesz usunąć samego siebie. Musi to zrobić inny administrator.',
  // permissions
  'help.guide.permissions.title': 'Ustal, kto może co robić',
  'help.guide.permissions.goal': 'Ustal dla każdej czynności, która rola może ją wykonywać w tej instancji TREK.',
  'help.guide.permissions.step.1':
    'W „Ustawieniach uprawnień” znajdź akcję w jej grupie, np. „Usuń podróże” w „Zarządzanie podróżami”, i wybierz, kto może ją wykonywać: „Wszyscy”, „Członkowie podróży”, „Właściciel podróży” lub „Tylko admin”. Zmieniony wiersz jest oznaczony jako „dostosowane”.',
  'help.guide.permissions.step.2':
    'Kliknij „Zapisz” w prawym górnym rogu karty. „Przywróć domyślne” przywraca każdemu wierszowi wbudowany poziom; potem też kliknij „Zapisz”.',
  'help.guide.permissions.result':
    'Reguła obowiązuje od razu we wszystkich podróżach. Osoby poniżej wymaganego poziomu nie widzą już powiązanych z nią przycisków i menu.',
  'help.guide.permissions.tip.1':
    'Właściciel podróży to osoba, która ją utworzyła. Administratorzy zawsze mogą wszystko.',
  'help.guide.permissions.tip.2':
    'Każda akcja ma osobny wiersz, więc możesz np. pozwolić uczestnikom planować miejsca i dni, a usuwanie podróży zostawić jej właścicielowi.',
  // default-map
  'help.guide.default-map.title': 'Domyślne ustawienia mapy dla nowych użytkowników',
  'help.guide.default-map.goal': 'Zapewnij każdemu nowemu kontu działającą mapę bez osobistego tokenu.',
  'help.guide.default-map.step.1':
    'W sekcji „Mapa” wybierz „Szablon mapy” lub wklej URL kafelków, a jeśli korzystasz z kafelków CARTO, wpisz „Współdzielony klucz CARTO”. Podgląd poniżej pokazuje efekt.',
  'help.guide.default-map.step.2':
    'Niżej wybierz „Silnik map”: „Standardowa (bezpłatna)”, Mapbox (3D) lub MapLibre (OpenFreeMap). Dla Mapbox i MapLibre wybierz „Styl mapy”, a dla Mapbox dodaj „Współdzielony token Mapbox” i zdecyduj o opcjach „Budynki i teren 3D” oraz „Tryb wysokiej jakości”.',
  'help.guide.default-map.result':
    'Nowe konta zaczynają z tymi ustawieniami. Kto ustawił własną mapę w Ustawienia, zachowuje swoją.',
  'help.guide.default-map.tip.1':
    'Token lub klucz wpisany tutaj jest wspólny dla wszystkich, którzy nie mają własnego, więc pilnuj jego limitu.',
  'help.guide.default-map.tip.2':
    'Z tych ustawień domyślnych korzystają też istniejące konta, w których nikt nic nie zmienił w zakładce mapy.',
  // packing-templates
  'help.guide.packing-templates.title': 'Utwórz szablon pakowania',
  'help.guide.packing-templates.goal': 'Daj podróżom gotową listę do spakowania na początek zamiast pustej.',
  'help.guide.packing-templates.step.1': 'Kliknij „Nowy szablon”, wpisz nazwę i potwierdź znaczkiem wyboru.',
  'help.guide.packing-templates.step.2':
    'Kliknij nazwę szablonu, aby go otworzyć, a potem Dodaj kategorię. Przycisk + na górze kategorii dodaje przedmioty, a przedmiot wymaga tylko nazwy.',
  'help.guide.packing-templates.step.3':
    'Wszystko zapisuje się na bieżąco. Ołówek zmienia nazwę szablonu, kategorii lub przedmiotu. Kosz od razu usuwa przedmiot. Przy szablonie lub kategorii najpierw pyta, bo razem z nimi usuwa się wszystko, co zawierają.',
  'help.guide.packing-templates.result':
    'Szablon jest dostępny na liście pakowania każdej podróży. Zastosowanie go kopiuje pozycje, więc w podróży można je dowolnie zmieniać.',
  'help.guide.packing-templates.tip.1':
    'Osobny szablon dla każdego rodzaju podróży (plaża, miasto, góry) sprawdza się lepiej niż jedna bardzo długa lista.',
  'help.guide.packing-templates.tip.2': 'Usunięcie szablonu nie zmienia podróży, które już go zastosowały.',
  'help.guide.packing-templates.tip.3':
    '„Zapisz jako szablon” na liście pakowania podróży tworzy szablon z wagą, ilością i torbą każdego przedmiotu. Widać je tutaj obok przedmiotu, a po zastosowaniu szablonu przedmioty trafiają do tych samych toreb.',
  // categories
  'help.guide.categories.title': 'Zarządzaj zestawem kategorii',
  'help.guide.categories.goal': 'Zdecyduj, jakie kategorie mogą mieć miejsca i kolekcje oraz jak wyglądają.',
  'help.guide.categories.step.1':
    'Kliknij „Nowa kategoria”, wpisz nazwę w wierszu tytułu okna, wybierz „Ikona” i „Kolor”, a potem sprawdź „Podgląd”. Kliknij „Utwórz”.',
  'help.guide.categories.step.2':
    'Na liście ołówek („Edytuj”) otwiera kategorię, a „Aktualizuj” ją zapisuje. Kosz („Usuń”) usuwa ją po potwierdzeniu.',
  'help.guide.categories.result':
    'Zestaw obowiązuje od razu wszędzie: w inspektorze miejsc, na pinezkach na mapie, w Kolekcjach i w filtrach.',
  'help.guide.categories.tip.1':
    'Miejsca zachowują identyfikator kategorii, więc zmiana nazwy kategorii zmienia ją we wszystkich miejscach.',
  'help.guide.categories.tip.2':
    'Po usunięciu kategorii jej miejsca nie mają kategorii. Jeśli to ważne, najpierw przypisz je do innej kategorii.',
  // school-holiday-catalog
  'help.guide.school-holiday-catalog.title': 'Ręczne zarządzanie feriami szkolnymi',
  'help.guide.school-holiday-catalog.goal':
    'Prowadź listę ferii szkolnych kraju lub regionu, którą każdy może wybrać w „Urlopach”.',
  'help.guide.school-holiday-catalog.step.1':
    'W sekcji „Ferie szkolne” wybierz kraj albo kliknij + („Dodaj kraj”), wpisz kraj i jego „Kod kraju (np. US)”, a potem „Zapisz”. „Dodaj region” dodaje każdą część kraju, która ma własne terminy.',
  'help.guide.school-holiday-catalog.step.2':
    'Kliknij region, aby otworzyć „Region lub okręg szkolny”: kliknij „Dodaj okres”, podaj dla każdego okresu „Nazwa ferii”, „Data rozpoczęcia” i „Data końca”, a potem „Zapisz”. Ikona kosza usuwa okres lub region. Kraj można usunąć, gdy nie ma już żadnych regionów.',
  'help.guide.school-holiday-catalog.result':
    'Użytkownicy znajdą kraj i region w Ustawienia w Vacay i zobaczą te okresy na swojej siatce roku.',
  'help.guide.school-holiday-catalog.tip.1':
    'Nie można usunąć regionu, który ktoś już wybrał w swoim kalendarzu Urlopy.',
  // auth-methods
  'help.guide.auth-methods.title': 'Ustal, jak użytkownicy się logują',
  'help.guide.auth-methods.goal': 'Włączaj i wyłączaj logowanie hasłem, SSO i rejestrację oraz wymagaj 2FA.',
  'help.guide.auth-methods.step.1':
    'W sekcji Metody uwierzytelniania włącz lub wyłącz Password Login i Password Registration. Każdy przełącznik działa od razu. Przy wyłączonej rejestracji nowe konta powstają tylko z linków zaproszeń, przez SSO lub przyciskiem Utwórz użytkownika.',
  'help.guide.auth-methods.step.2':
    'SSO Login i SSO Auto-Provisioning wymagają skonfigurowania „Logowania jednokrotnego (OIDC)” poniżej; automatyczne zakładanie kont tworzy konto, gdy ktoś po raz pierwszy zaloguje się przez SSO.',
  'help.guide.auth-methods.step.3':
    'Włącz „Wymagaj uwierzytelniania dwuskładnikowego (2FA)”, żeby każdy, kto nie ma 2FA, musiał je skonfigurować w „Ustawieniach”, zanim zacznie korzystać z TREK.',
  'help.guide.auth-methods.result': 'Strona logowania oferuje dokładnie te metody, które zostawiłeś włączone.',
  'help.guide.auth-methods.tip.1':
    'TREK nie pozwoli wyłączyć ostatniej metody logowania: jej przełącznik robi się szary, a podpowiedź informuje, że co najmniej jedna metoda logowania musi pozostać włączona.',
  'help.guide.auth-methods.tip.2':
    'Jeśli na serwerze ustawiono OIDC_ONLY, przełączniki logowania hasłem są zablokowane, a informuje o tym uwaga.',
  // oidc
  'help.guide.oidc.title': 'Łączenie logowania jednokrotnego (SSO)',
  'help.guide.oidc.goal': 'Pozwól użytkownikom logować się przez Twojego dostawcę tożsamości.',
  'help.guide.oidc.step.1':
    'W sekcji „Logowanie jednokrotne (OIDC)” wpisz „Wyświetlaną nazwę” przycisku, „URL wystawcy”, „ID klienta” i „Sekret klienta” od swojego dostawcy. „Adres URL discovery (opcjonalnie)” wypełnij tylko wtedy, gdy dostawca nie publikuje go pod standardowym adresem, jak w przypadku Authentik. Kliknij „Zapisz”.',
  'help.guide.oidc.step.2': 'Włącz „SSO Login” w sekcji „Authentication Methods”.',
  'help.guide.oidc.result':
    'Na stronie logowania pojawia się przycisk SSO; gdy włączona jest opcja SSO Auto-Provisioning, nowi użytkownicy dostają konto automatycznie.',
  'help.guide.oidc.tip.1':
    'Redirect URI, którego wymaga dostawca, to adres Twojej instancji TREK z dopisaną ścieżką callbacku OIDC podaną w dokumentacji.',
  'help.guide.oidc.tip.2':
    'Mapowanie claimów decyduje, które grupy SSO otrzymują uprawnienia administratora; szczegóły znajdziesz na stronie OIDC w dokumentacji.',
  // instance-keys
  'help.guide.instance-keys.title': 'Wpisywanie kluczy API',
  'help.guide.instance-keys.goal':
    'Dodaj zdjęcia i oceny z Google, okładki z Unsplash i wyszukiwanie Amap dla całej instancji.',
  'help.guide.instance-keys.step.1':
    'W sekcji „Klucze API” na górze jest TREK Places API, które obsługuje wyszukiwanie miejsc bez klucza. „Co w tym jest” pokazuje, co obejmuje, a czego nie.',
  'help.guide.instance-keys.step.2':
    'Dla zdjęć, ocen i godzin otwarcia wklej Klucz Google Maps API i kliknij Testuj. Pojawi się Połączono albo Niepoprawny. Otwórz Do czego służy klucz i włącz tylko to, za co chcesz płacić: Zdjęcia miejsc, Autouzupełnianie miejsc, Szczegóły miejsca, Wzbogacanie miejsc oraz Szukaj tylko przez Google, a także Dzienny limit wywołań Google.',
  'help.guide.instance-keys.step.3':
    'Wklej Klucz API Unsplash do wyszukiwania okładek i Klucz API Amap (高德地图) do wyszukiwania miejsc w Chinach kontynentalnych, a potem kliknij Zapisz na dole karty.',
  'help.guide.instance-keys.result':
    'Użytkownicy mogą korzystać z tych funkcji bez własnych kluczy. Bez klucza Google wyszukiwanie działa w oparciu o TREK Places API i OpenStreetMap.',
  'help.guide.instance-keys.tip.1':
    'Jeśli użytkownik ma w „Ustawieniach” własny klucz, TREK używa dla niego tego klucza zamiast klucza serwera.',
  'help.guide.instance-keys.tip.2':
    'Klucze mogą też pochodzić ze zmiennych środowiskowych; takie klucze są tu widoczne tylko do odczytu.',
  'help.guide.instance-keys.tip.3':
    'Dzienny limit wywołań Google ogranicza, ile TREK może dziennie wydać na ten klucz, a plakietka obok tytułu liczy dzisiejsze wywołania. Po osiągnięciu limitu wyszukiwania korzystają z OpenStreetMap do następnego dnia (UTC).',
  // places-transit
  'help.guide.places-transit.title': 'Wybierz dostawców wyszukiwania i komunikacji',
  'help.guide.places-transit.goal':
    'Wybierz usługę, która obsługuje wyszukiwanie miejsc i wyznaczanie tras komunikacją publiczną.',
  'help.guide.places-transit.step.1':
    'W sekcji „Dostawca transportu publicznego” wybierz „Transitous (bezpłatnie)”, który nie wymaga klucza i najlepiej sprawdza się w Europie, albo Google, który korzysta z klucza Google. Wybór zapisuje się od razu.',
  'help.guide.places-transit.step.2':
    'W sekcji „Dostawca wyszukiwania miejsc” wybierz usługę, o którą TREK pyta, gdy indeks TREK i OpenStreetMap nic nie znajdą: „Automatycznie” (Google, jeśli jest klucz, potem Amap), Google Places, Amap (高德地图) lub OpenStreetMap.',
  'help.guide.places-transit.result':
    'Ten wybór obowiązuje we wszystkich polach wyszukiwania i trasach komunikacji publicznej w TREK.',
  'help.guide.places-transit.tip.1':
    'Przy opcji bez wymaganego klucza pojawia się tu ostrzeżenie. Wyszukiwanie miejsc korzysta wtedy tylko z indeksu TREK i OpenStreetMap, a komunikacja publiczna tylko z Transitous.',
  'help.guide.places-transit.tip.2':
    'Trasy komunikacji publicznej z Google są płatne za każde zapytanie, a Transitous nie.',
  // file-types
  'help.guide.file-types.title': 'Ograniczanie typów plików',
  'help.guide.file-types.goal': 'Zdecyduj, jakie rozszerzenia mogą mieć przesyłane pliki.',
  'help.guide.file-types.step.1':
    'W sekcji „Dozwolone typy plików” zmień listę rozszerzeń oddzielonych przecinkami lub wpisz *, aby zezwolić na wszystkie typy, i kliknij „Zapisz”.',
  'help.guide.file-types.result':
    'Pliki każdego innego typu są odrzucane z czytelnym komunikatem, w dokumentach, w dzienniku i przy okładkach.',
  'help.guide.file-types.tip.1':
    'Nie usuwaj typów obrazów z listy: okładki i zdjęcia w dziennikach są sprawdzane według tej samej listy.',
  // toggle-addon
  'help.guide.toggle-addon.title': 'Włącz lub wyłącz dodatek',
  'help.guide.toggle-addon.goal': 'Udostępnij moduł funkcji wszystkim albo go wyłącz.',
  'help.guide.toggle-addon.step.1':
    'Kliknij przełącznik na kafelku dodatku. Pozycja w nawigacji od razu pojawia się lub znika u wszystkich.',
  'help.guide.toggle-addon.step.2':
    'Niektóre kafelki mają wiersze z opcjami, na przykład „Kontrola bagażu” pod „Listy” albo dostawców zdjęć pod „Dziennik podróży”. Są widoczne tylko wtedy, gdy dodatek jest włączony.',
  'help.guide.toggle-addon.result':
    'Gdy wyłączysz dodatek, jego dane zostają zachowane. Po ponownym włączeniu znów są widoczne.',
  'help.guide.toggle-addon.tip.1': 'Wyłączenie MCP usuwa endpoint i te sekcje Integracje, które od niego zależą.',
  'help.guide.toggle-addon.tip.2':
    'Urlopy, Atlas i Dziennik podróży to dodatki, o które użytkownicy proszą najczęściej; Dokumenty wymagają miejsca na przesyłane pliki.',
  // install-plugin
  'help.guide.install-plugin.title': 'Zainstaluj wtyczkę',
  'help.guide.install-plugin.goal': 'Dodaj wtyczkę innej firmy i nadaj jej dokładnie te uprawnienia, o które prosi.',
  'help.guide.install-plugin.step.1':
    'Otwórz „Odkrywaj”, znajdź wtyczkę za pomocą „Szukaj wtyczek…” lub filtra „Typ” i kliknij „Zainstaluj”. W przypadku pliku pakietu kliknij „Prześlij wtyczkę” (ikona chmury w prawym górnym rogu karty) albo upuść plik .zip na stronę.',
  'help.guide.install-plugin.step.2':
    'W sekcji Zainstalowane przeczytaj wiersz: do czego wtyczka ma dostęp, z jakimi hostami się łączy i czy jest Zweryfikowana i Podpisana. Potem włącz Włącz wtyczkę. Wiersz pokaże Aktywny.',
  'help.guide.install-plugin.step.3':
    'Menu ⋯ w wierszu oferuje Uruchom ponownie, Pokaż dziennik błędów, Dozwolone hosty i Zmień wersję…, a także linki do źródła. Usuń odinstalowuje wtyczkę razem z jej danymi. Nowsza wersja pojawia się w wierszu jako aktualizacja, a wersja wymagająca nowych uprawnień pozostaje wyłączona, dopóki ich nie zatwierdzisz.',
  'help.guide.install-plugin.result':
    'Wtyczka działa we własnym procesie. Wszystko, co dodaje, na przykład widżety, warstwy mapy czy narzędzia, pojawia się tam, gdzie określa to wtyczka.',
  'help.guide.install-plugin.tip.1':
    '„Skanuj ponownie” wykrywa folder wtyczki podlinkowany na potrzeby programowania, bez pakietu.',
  'help.guide.install-plugin.tip.2':
    'Niepodpisana wtyczka jest odpowiednio oznaczona. Instaluj ją tylko wtedy, gdy ufasz jej źródłu.',
  // storage-backends
  'help.guide.storage-backends.title': 'Przenoszenie plików do S3 lub ich replikacja',
  'help.guide.storage-backends.goal':
    'Przechowuj pliki w magazynie obiektowym albo kopiuj każdy przesłany plik do drugiego backendu.',
  'help.guide.storage-backends.step.1':
    'W sekcji „Backendy” kliknij „Dodaj backend”, wpisz „Nazwę”, wybierz „Typ” (Local lub S3) i wypełnij pola. Żeby przechowywać kopię w innym miejscu, zaznacz „Cele mirrora”. Kliknij „Zastosuj”, a potem „Testuj” w nowym wierszu, żeby sprawdzić połączenie.',
  'help.guide.storage-backends.step.2':
    'W sekcji „Kategorie” przypisz każdy rodzaj przesyłanych plików, np. „Dokumenty podróży”, „Zdjęcia z dziennika podróży” lub „Kopie zapasowe”, do backendu.',
  'help.guide.storage-backends.step.3':
    'Kliknij „Zapisz zmiany” na dole. Jeśli kategoria wskazuje teraz inne miejsce, TREK zapyta, czy wybrać „Przenieś istniejące obiekty”, czy „Przekieruj tylko nowe zapisy”.',
  'help.guide.storage-backends.result':
    'Nowe pliki trafiają do przypisanego backendu. Przeniesione pliki są serwowane stamtąd, a te, których nie wybrano do przeniesienia, zostają tam, gdzie były.',
  'help.guide.storage-backends.tip.1':
    'Backend skonfigurowany przez zmienne środowiskowe jest widoczny, ale nie można go tu edytować.',
  'help.guide.storage-backends.tip.2':
    'Cel kopii lustrzanej dostaje kopię każdego nowego zapisu, a Synchronizuj teraz w wierszu kopiuje to, co zapisano wcześniej. Wolny cel spowalnia każde przesyłanie plików do tego backendu.',
  // channels-instance
  'help.guide.channels-instance.title': 'Skonfiguruj kanały powiadomień',
  'help.guide.channels-instance.goal': 'Zdecyduj, które kanały mogą wybierać użytkownicy, i skonfiguruj e-mail.',
  'help.guide.channels-instance.step.1':
    'Włącz „E-mail (SMTP)” w nagłówku karty, wpisz SMTP Host, SMTP Port, SMTP User, SMTP Password i From Address, a potem kliknij „Zapisz”. „Wyślij testowego e-maila” wysyła wiadomość do ciebie. „Pomiń sprawdzanie certyfikatu TLS” jest przeznaczone wyłącznie dla lokalnego serwera poczty z własnym certyfikatem.',
  'help.guide.channels-instance.step.2':
    'Włącz Webhook, Ntfy i Web Push, żeby udostępnić je użytkownikom. Użytkownicy wpisują wtedy własny URL lub temat albo włączają push na każdym urządzeniu w „Ustawieniach”, w sekcji „Powiadomienia”.',
  'help.guide.channels-instance.step.3':
    '„Przypomnienia o podróżach” włącza lub wyłącza przypomnienie przed rozpoczęciem podróży; „W aplikacji” jest zawsze włączone.',
  'help.guide.channels-instance.result':
    'W zakładce „Powiadomienia” każdego użytkownika widać kanały, które włączyłeś.',
  'help.guide.channels-instance.tip.1':
    '„URL serwera Ntfy” na karcie Ntfy w panelu administratora jest też domyślnym serwerem dla użytkowników. Mimo to każdy może ustawić własny serwer.',
  'help.guide.channels-instance.tip.2':
    'Kanały wtyczek pojawiają się automatycznie, gdy tylko aktywna jest wtyczka z taką funkcją.',
  // admin-channels
  'help.guide.admin-channels.title': 'Zdarzenia administracyjne na telefonie',
  'help.guide.admin-channels.goal':
    'Dostawaj powiadomienia o nowych wersjach, awariach replik magazynu i prośbach o region wodny.',
  'help.guide.admin-channels.step.1':
    'W sekcji Admin Ntfy wpisz Temat admina oraz w razie potrzeby URL serwera Ntfy i Token dostępu (opcjonalne). W sekcji Webhook admina wpisz adres URL. Na każdej karcie kliknij Zapisz.',
  'help.guide.admin-channels.step.2':
    'Kliknij „Wyślij testowe Ntfy” lub „Wyślij testowy webhook”, aby sprawdzić, czy wiadomość dociera.',
  'help.guide.admin-channels.result':
    'Zdarzenia administracyjne trafiają do każdego administratora w aplikacji, a tam, gdzie je włączyłeś, także na administracyjny temat ntfy i webhook.',
  'help.guide.admin-channels.tip.1':
    'Trzymaj temat administracyjny osobno od osobistego, żeby komunikaty o awariach nie ginęły wśród wiadomości o podróżach.',
  'help.guide.admin-channels.tip.2':
    'Administracyjny webhook i temat są niezależne od twoich własnych kanałów w „Ustawieniach”, w sekcji „Powiadomienia”.',
  // mcp-tokens-admin
  'help.guide.mcp-tokens-admin.title': 'Unieważnij dostęp AI',
  'help.guide.mcp-tokens-admin.goal':
    'Przeglądaj i unieważniaj wszystkie tokeny i sesje klientów AI, u dowolnego użytkownika.',
  'help.guide.mcp-tokens-admin.step.1':
    'W sekcji „Sesje OAuth” znajdź klienta po nazwie i właścicielu; znaczniki pokazują przyznane mu zakresy. Kosz po potwierdzeniu unieważnia sesję.',
  'help.guide.mcp-tokens-admin.step.2':
    'W sekcji „Tokeny API” to samo dla tokenów: nazwa, właściciel, „Utworzono” i „Ostatnio użyto”. Kosz usuwa token, a klient od razu przestaje działać.',
  'help.guide.mcp-tokens-admin.result': 'Użytkownik klienta musi połączyć go ponownie. Nic innego się nie zmienia.',
  'help.guide.mcp-tokens-admin.tip.1':
    'Uprawnienia pokazują, co klient może robić. Uprawnienie tylko do odczytu można bezpiecznie zostawić.',
  'help.guide.mcp-tokens-admin.tip.2':
    'Wyłączenie dodatku MCP od razu zatrzymuje wszystkich klientów i ukrywa tę zakładkę, ale niczego nie usuwa: po ponownym włączeniu tokeny znów działają.',
  // release-history
  'help.guide.release-history.title': 'Sprawdzanie nowej wersji',
  'help.guide.release-history.goal': 'Sprawdź, czy Twój TREK jest aktualny i co przyniesie następna wersja.',
  'help.guide.release-history.step.1':
    'Gdy jest dostępne nowsze wydanie, pod nagłówkiem strony pojawia się „Dostępna aktualizacja” z informacją o używanej wersji. „Zobacz na GitHubie” otwiera wydanie, a „Jak zaktualizować” pokazuje polecenia dla Dockera lub przewodnik aktualizacji dla innych instalacji.',
  'help.guide.release-history.step.2':
    'Historia wydań wypisuje każde wydanie wraz z opisem zmian. Pokaż szczegóły je rozwija, najnowsze wydanie ma etykietę Najnowsze, a Załaduj więcej pokazuje starsze wydania.',
  'help.guide.release-history.result':
    'Aktualizację przeprowadzasz na hoście, pobierając nowy obraz albo budując nowy tag; katalog danych zostaje zachowany.',
  'help.guide.release-history.tip.1': 'Przed aktualizacją zrób kopię zapasową. Zakładka „Backupy” jest obok tej.',
  'help.guide.release-history.tip.2':
    'Wersje testowe są wyświetlane, ale nie są zgłaszane jako aktualizacje, chyba że sam korzystasz z wersji testowej.',
  // create-backup
  'help.guide.create-backup.title': 'Tworzenie i przywracanie kopii zapasowej',
  'help.guide.create-backup.goal':
    'Utwórz kopię zapasową całego serwera, przechowuj ją w innym miejscu i miej możliwość jej przywrócenia.',
  'help.guide.create-backup.step.1':
    'W sekcji Kopia zapasowa danych kliknij Utwórz kopię zapasową w prawym górnym rogu. Baza danych i przesłane pliki zostaną zapisane w jednym pliku na serwerze.',
  'help.guide.create-backup.step.2': 'Pobierz zapisuje kopię poza serwerem, a kosz po potwierdzeniu usuwa stare kopie.',
  'help.guide.create-backup.step.3':
    '„Przywróć” przy kopii zapasowej lub „Prześlij kopię zapasową” z plikiem zastępuje wszystkie obecne dane, gdy w oknie „Przywrócić kopię zapasową?” klikniesz „Tak, przywróć”.',
  'help.guide.create-backup.result':
    'Przywrócenie odtwarza użytkowników, podróże, pliki i ustawienia dokładnie w takim stanie, w jakim były w tej kopii zapasowej.',
  'help.guide.create-backup.tip.1':
    'Przywracanie to jedyna operacja w tym miejscu, której nie da się cofnąć. Najpierw zrób nową kopię zapasową.',
  'help.guide.create-backup.tip.2':
    'Kopie zapasowe są zapisywane w katalogu danych. Skopiuj je na inny komputer, żeby były bezpieczne, jeśli ten ulegnie awarii.',
  // auto-backup
  'help.guide.auto-backup.title': 'Zaplanuj kopie zapasowe',
  'help.guide.auto-backup.goal': 'Niech serwer sam tworzy kopie zapasowe i usuwa stare.',
  'help.guide.auto-backup.step.1':
    'W sekcji „Automatyczna kopia zapasowa” włącz „Włącz automatyczną kopię zapasową” i wybierz „Częstotliwość” („Co godzinę”, „Co dzień”, „Co tydzień” lub „Co miesiąc”), „Uruchom o godzinie”, a przy kopii tygodniowej lub miesięcznej także „Dzień tygodnia” lub „Dzień miesiąca”.',
  'help.guide.auto-backup.step.2':
    'W polu „Usuń stare kopie zapasowe po” wybierz, jak długo przechowywać kopię, od „1 dzień” do „Przechowuj na zawsze”, i kliknij „Zapisz”.',
  'help.guide.auto-backup.result':
    'Kopie zapasowe pojawiają się na liście zgodnie z harmonogramem. Kopie starsze niż wybrany okres są usuwane.',
  'help.guide.auto-backup.tip.1':
    'Uruchom o godzinie liczy się według czasu serwera, a podpowiedź pod polem podaje strefę czasową serwera.',
  'help.guide.auto-backup.tip.2':
    'Miejsce na serwerze jest ograniczone: zwykle wystarczy 7 lub 14 dni, a pobraną kopię trzymaj w innym miejscu.',
  // audit-log
  'help.guide.audit-log.title': 'Przeglądaj dziennik audytu',
  'help.guide.audit-log.goal': 'Sprawdź, kto co zrobił i kiedy.',
  'help.guide.audit-log.step.1':
    'Wiersze są ułożone od najnowszych: „Czas”, „Użytkownik”, „Akcja”, „Zasób”, IP i „Szczegóły”. Nazwa akcji mówi, co się stało, np. nieudane logowanie, zmiana MFA lub przywrócenie.',
  'help.guide.audit-log.step.2':
    '„Odśwież” w prawym górnym rogu ponownie wczytuje listę. Plakietka obok tytułu pokazuje, ile wpisów wczytano z ogólnej liczby, a „Załaduj więcej” wczytuje starsze wpisy.',
  'help.guide.audit-log.result': 'Masz zapis, który możesz pokazać każdemu, kto pyta, dlaczego coś się zmieniło.',
  'help.guide.audit-log.tip.1': 'Godziny są pokazywane w strefie czasowej serwera.',
  'help.guide.audit-log.tip.2':
    'Do dziennika można tylko dopisywać wpisy; w aplikacji nie da się niczego w nim edytować ani usunąć.',
  // document-providers
  'help.guide.document-providers.title': 'Udostępnij magazyn dokumentów',
  'help.guide.document-providers.goal': 'Zdecyduj, z którymi magazynami podróże mogą synchronizować dokumenty.',
  'help.guide.document-providers.step.1':
    'Na kafelku „Dokumenty” magazyny są wymienione w wierszach: Paperless-ngx, Papra, Nextcloud, OpenCloud i Synology Drive. Na początku wszystkie pięć jest wyłączonych, a wiersze widać tylko wtedy, gdy włączony jest sam dodatek „Dokumenty”.',
  'help.guide.document-providers.step.2':
    'Włącz przełącznik w wierszu Nextcloud. Pojawi się komunikat „Dodatek został zaktualizowany” i od teraz właściciele podróży znajdą „Synchronizację dokumentów” na karcie „Pliki” swoich podróży, z Nextcloud w sekcji „Połącz dostawcę”.',
  'help.guide.document-providers.result':
    'Magazyn jest dostępny we wszystkich podróżach na tym serwerze TREK. Nic nie zostanie połączone, dopóki nie zrobi tego właściciel podróży.',
  'help.guide.document-providers.tip.1':
    'Tutaj rozstrzyga się tylko, czy dany magazyn może być oferowany. Adres i dane logowania należą do podróży i wpisuje je w jej zakładce Pliki właściciel podróży, nigdy w panelu administracyjnym.',
  'help.guide.document-providers.tip.2':
    'Wyłączenie Dokumentów wyłącza też wszystkie magazyny, a gdy Dokumenty są wyłączone, nie włączysz żadnego magazynu: serwer odpowie komunikatem „Enable the Documents addon first”. Magazyn w Twojej sieci lokalnej wymaga też ustawienia ALLOW_INTERNAL_NETWORK=true na serwerze.',

  // ── Screen: trip ──────────────────────────────────────────────────────────────────────
  'help.ctx.trip.title': 'Podróż',
  'help.ctx.trip.summary':
    'Wszystko o jednej podróży: plan z dniami, mapą i miejscami oraz karty wycieczek, transportów, rezerwacji, list, kosztów, plików, współpracy i powiązanego dziennika. Każda z nich ma własny ekran pomocy poniżej tego.',
  'help.ctx.trip.bullet.1':
    'Pasek kart pod górnym paskiem: „Plan”, „Wycieczki”, „Transport”, „Rezerwacje”, „Listy”, „Koszty”, „Pliki”, „Współpraca” oraz, po powiązaniu dziennika, „Dziennik”. To, które karty są dostępne w twoim TREK, zależy od dodatków i wtyczek.',
  'help.ctx.trip.bullet.2':
    '„Plan” ma trzy kolumny: dni po lewej, mapę pośrodku i miejsca po prawej. Z dodatkiem „Podróż samochodowa” kolumna dni zaczyna się przełącznikiem „Dni” i „Podróż samochodowa”, a z dodatkiem „Wycieczki” kolumna miejsc zaczyna się od „Miejsca” i „Wycieczki”. Rezerwacje i transport są częścią planu, przy przystanku i między przystankami; na kartach znajdziesz ich zestawienie.',
  'help.ctx.trip.bullet.3':
    '„Ustawienia podróży”, pigułka obok nazwy podróży w lewym górnym rogu, otwierają ustawienia podróży: „Osoby” (uczestnicy i goście), „Udostępnianie” (publiczny link tylko do odczytu i link zaproszenia) oraz „Dziennik”.',
  'help.ctx.trip.bullet.4':
    'Nazwę, daty, okładkę i walutę edytujesz w „Moich podróżach”, ołówkiem na karcie podróży. Nazwa podróży w lewym górnym rogu przenosi cię z powrotem do tej listy.',
  'help.ctx.trip.bullet.5':
    'Uchwyt na wewnętrznej krawędzi kolumny zwija ją, a mapa zajmuje zwolnione miejsce. Zwinięta kolumna jest widoczna jako mały kafelek w górnym rogu mapy: kliknij go, aby znów ją pokazać. Przeciągnij cienki separator obok kolumny, aby zmienić jej szerokość.',
  'help.ctx.trip.bullet.6': 'Strzałka cofania na pasku narzędzi dni cofa ostatnie zmiany w planie, jedną po drugiej.',
  // add-member
  'help.guide.add-member.title': 'Dodaj członka',
  'help.guide.add-member.goal': 'Daj osobie z kontem TREK dostęp do tej podróży.',
  'help.guide.add-member.step.1':
    'Kliknij Ustawienia podróży, czyli przycisk obok nazwy podróży w lewym górnym rogu. Otworzy się na karcie Osoby.',
  'help.guide.add-member.step.2':
    'W sekcji Zaproś użytkownika wybierz osobę z listy Wybierz użytkownika... i kliknij Zaproś.',
  'help.guide.add-member.step.3':
    'Osoba pojawia się teraz w sekcji „Dostęp”. Plakietka „Właściciel” oznacza właściciela. „Usuń dostęp” na końcu wiersza po potwierdzeniu usuwa osobę.',
  'help.guide.add-member.result':
    'Członek może przeglądać i edytować podróż tak jak Ty, w granicach poziomów ustawionych przez administratora w „Ustawieniach uprawnień”.',
  'help.guide.add-member.tip.1':
    'Jeśli kogoś nie ma na liście, nie ma jeszcze konta TREK: dodaj go jako gościa albo pozwól mu zarejestrować się przez link z zaproszeniem.',
  'help.guide.add-member.tip.2': 'Liczba obok „Dostęp” to liczba osób w podróży. Goście są wymienieni osobno poniżej.',
  // trip-invite-link
  'help.guide.trip-invite-link.title': 'Zapraszanie przez link',
  'help.guide.trip-invite-link.goal': 'Pozwól innym samodzielnie dołączyć do podróży.',
  'help.guide.trip-invite-link.step.1':
    'Kliknij „Ustawienia podróży” obok nazwy podróży i wybierz po lewej „Udostępnianie”. W sekcji „Link zaproszenia do podróży” kliknij „Utwórz link zaproszenia”.',
  'help.guide.trip-invite-link.step.2':
    'Kliknij Kopiuj i wyślij link. Każdy, kto ma konto TREK i go otworzy, dołączy jako członek.',
  'help.guide.trip-invite-link.step.3':
    '„Wygeneruj ponownie” tworzy nowy link, a stary przestaje działać; „Wyłącz” dezaktywuje link.',
  'help.guide.trip-invite-link.result': 'Każdy, kto otworzy link, dołącza do podróży i pojawia się w sekcji „Dostęp”.',
  'help.guide.trip-invite-link.tip.1':
    'Osoba bez konta nie może z niego skorzystać. Administrator tworzy linki rejestracyjne w sekcji Administrator, Użytkownicy i może powiązać jeden z nich z tą podróżą.',
  'help.guide.trip-invite-link.tip.2':
    'Jeśli wysłałeś link na niewłaściwy czat, wygeneruj go ponownie: stary link natychmiast przestanie działać.',
  // add-guest
  'help.guide.add-guest.title': 'Dodawanie gościa bez konta',
  'help.guide.add-guest.goal': 'Dodaj do podróży osobę, która nie korzysta z TREK.',
  'help.guide.add-guest.step.1':
    'Kliknij „Ustawienia podróży” obok nazwy podróży. W sekcji „Osoby” na samym dole, pod „Dostępem”, są „Goście”.',
  'help.guide.add-guest.step.2': 'Wpisz imię w polu Imię gościa i kliknij Dodaj gościa.',
  'help.guide.add-guest.result':
    'Gościa można przypisać do kosztów, rzeczy do spakowania i zadań, ale nie może się on zalogować.',
  'help.guide.add-guest.tip.1':
    '„Zmień nazwę” (ołówek) zmienia imię gościa. „Usuń dostęp” (kosz) po potwierdzeniu usuwa gościa: jego przypisania zostają usunięte, a jego udział w każdym wydatku jest dzielony między pozostałe osoby z podziału.',
  'help.guide.add-guest.tip.2': 'Jeśli ta osoba założy później konto, zaproś ją jako członka i usuń gościa.',
  // public-link
  'help.guide.public-link.title': 'Opublikuj link tylko do odczytu',
  'help.guide.public-link.goal': 'Pokaż podróż osobom, które nie powinny jej edytować.',
  'help.guide.public-link.step.1':
    'Kliknij „Ustawienia podróży” obok nazwy podróży i wybierz „Udostępnianie” po lewej.',
  'help.guide.public-link.step.2':
    'Na karcie Publiczny link włącz to, co link ma pokazywać. Mapa i plan są zawsze włączone, a Rezerwacje, Pakowanie, Koszty i Czat wybierasz sam.',
  'help.guide.public-link.step.3':
    'W sekcji Opcje Tylko podróż i noclegi pomija atrakcje, notatki do dni i puste dni. Bez zdjęć pomija zdjęcia miejsc.',
  'help.guide.public-link.result':
    'Każdy, kto ma link, widzi wybrane elementy bez logowania i nie może niczego zmienić.',
  'help.guide.public-link.tip.1':
    'Link nie jest nigdzie publikowany, ale każdy, kto go ma, może go otworzyć. Chroń go jak hasło.',
  'help.guide.public-link.tip.2': 'Aby ktoś mógł edytować, dodaj go jako członka.',
  // transfer-ownership
  'help.guide.transfer-ownership.title': 'Przekaż podróż albo ją opuść',
  'help.guide.transfer-ownership.goal': 'Przekaż własność komuś innemu albo opuść podróż, która nie jest Twoja.',
  'help.guide.transfer-ownership.step.1':
    'Kliknij „Ustawienia podróży” obok nazwy podróży. W sekcji „Dostęp” kliknij „Ustaw jako właściciela” (korona) w wierszu uczestnika i potwierdź.',
  'help.guide.transfer-ownership.step.2':
    '„Opuść podróż” w Twoim wierszu usuwa Cię z podróży po potwierdzeniu. Jeśli jesteś właścicielem, najpierw przekaż własność.',
  'help.guide.transfer-ownership.result':
    'Nowy właściciel zarządza członkami i może usunąć podróż; Ty pozostajesz zwykłym członkiem.',
  'help.guide.transfer-ownership.tip.1':
    'Właścicielem jest osoba, która utworzyła podróż, dopóki nie przekaże jej własności. Tylko właściciel może usunąć podróż.',
  'help.guide.transfer-ownership.tip.2':
    '„Usuń dostęp” w wierszu innego uczestnika działa odwrotnie: właściciel usuwa tę osobę z podróży.',
  // collapse-columns
  'help.guide.collapse-columns.title': 'Więcej miejsca na mapę',
  'help.guide.collapse-columns.goal': 'Zwiń kolumnę albo ją poszerz.',
  'help.guide.collapse-columns.step.1':
    'Kliknij uchwyt z ikoną panelu przy wewnętrznej krawędzi kolumny dni, aby ją zwinąć; mapa zajmie wolne miejsce. Kolumna miejsc ma taki sam uchwyt.',
  'help.guide.collapse-columns.step.2':
    'Gdy kolumna jest zwinięta, w górnym rogu mapy pojawia się mały kafelek z ikoną panelu, a jego podpowiedź brzmi Plan lub Miejsca. Kliknij go, aby znów pokazać kolumnę.',
  'help.guide.collapse-columns.step.3':
    'Przeciągnij cienki separator między kolumną a mapą, aby zmienić szerokość kolumny.',
  'help.guide.collapse-columns.result':
    'Szerokości są zapamiętywane. Przy następnej wizycie kolumny będą znów rozwinięte.',
  'help.guide.collapse-columns.tip.1': 'Możesz zwinąć obie kolumny jednocześnie, aby widzieć tylko mapę.',
  'help.guide.collapse-columns.tip.2':
    'W wąskim oknie mieści się tylko jedna kolumna: otwarcie jednej zwija drugą. Na telefonie nie ma kolumn; między widokami przełączasz się przyciskami „Podróż”, „Plan” i „Miejsca” u góry.',
  // undo-change
  'help.guide.undo-change.title': 'Cofanie ostatniej zmiany',
  'help.guide.undo-change.goal': 'Cofnij ostatnią zmianę w planie.',
  'help.guide.undo-change.step.1':
    'Kliknij strzałkę cofania na pasku narzędzi nad dniami. Jej podpowiedź podaje, jaką zmianę cofnie.',
  'help.guide.undo-change.result':
    'Plan wraca do poprzedniego stanu, a krótki komunikat informuje, co zostało cofnięte.',
  'help.guide.undo-change.tip.1':
    '„Cofnij” dotyczy planu: dodawania, przypisywania, usuwania, zmiany kolejności, przenoszenia i blokowania miejsc, czyszczenia dnia, optymalizacji trasy, usuwania miejsc, zmian kategorii i importów.',
  'help.guide.undo-change.tip.2':
    'Klikaj dalej, aby cofać się dalej: TREK pamięta Twoje ostatnie 30 zmian w tej podróży, od najnowszej, dopóki z niej nie wyjdziesz.',
  'help.guide.clear-day.title': 'Wyczyść dzień',
  'help.guide.clear-day.goal': 'Usuń naraz wszystkie miejsca z dnia, na przykład aby zaplanować go od nowa.',
  'help.guide.clear-day.step.1': 'Kliknij prawym przyciskiem myszy nagłówek dnia w planie.',
  'help.guide.clear-day.step.2': 'Wybierz „Wyczyść dzień” i potwierdź.',
  'help.guide.clear-day.result':
    'Dzień jest pusty, a jego miejsca wracają na listę jako niezaplanowane. Strzałka cofania nad dniami przywraca je.',
  'help.guide.clear-day.tip.1': 'Usuwane są tylko miejsca. Notatki i rezerwacje dnia zostają.',

  // ── Screen: trip-places ───────────────────────────────────────────────────────────────
  'help.ctx.trip-places.title': 'Miejsca',
  'help.ctx.trip-places.summary':
    'Prawa kolumna planu: wszystkie miejsca podróży, zaplanowane lub nie, z wyszukiwaniem, filtrami i sortowaniem, oraz sposoby dodawania miejsc: przez wyszukiwanie, ręcznie lub z udostępnionej listy. „Miejsca” i „Wycieczki” u góry przełączają między miejscami a wycieczkami podróży.',
  'help.ctx.trip-places.bullet.1':
    'Przyciski Miejsca i Wycieczki u góry kolumny przełączają listę. Po wejściu otwarte są Miejsca. Wycieczki pokazują wycieczki podróży i pozwalają importować pliki GPX, KML i KMZ przez Importuj GPX lub KML. Wycieczki nie pojawiają się na liście miejsc.',
  'help.ctx.trip-places.bullet.2':
    'Dodaj miejsce/atrakcję otwiera formularz dla miejsca, które wyszukujesz lub wpisujesz. Gdy otwarty jest jakiś dzień, przycisk nazywa się Nowe miejsce, a Do dnia obok niego tworzy miejsce od razu w tym dniu.',
  'help.ctx.trip-places.bullet.3':
    '„Importuj miejsca”, przycisk z ikoną obok, oferuje „Import listy” dla listy udostępnionej z Google Maps lub Naver Maps. Jeśli administrator wyłączył dodatek „Wycieczki”, jest tam też „Importuj plik” dla plików .gpx, .kml i .kmz, a plik można upuścić na kolumnę.',
  'help.ctx.trip-places.bullet.4':
    'Pod nimi pole „Szukaj”, które przeszukuje też opisy i notatki, a obok pole wyboru „Zaznacz”. W wierszu pod spodem są filtry: „Pokaż” przełącza między „Wszystkie”, „Niezaplanowane” i „Zaplanowane”, każda opcja z liczbą. Przycisk z etykietą filtruje według kategorii, gwiazdka według minimalnej oceny, globus (gdy podróż obejmuje więcej niż jeden kraj lub region) według kraju lub regionu, a „Sortuj według” ustala kolejność listy.',
  'help.ctx.trip-places.bullet.5':
    'Wiersz pokazuje zdjęcie, nazwę oraz opis lub adres, a gdy ktoś oceni miejsce, także gwiazdkę ze średnią oceną. Kliknij wiersz, żeby zobaczyć szczegóły miejsca, przeciągnij go na dzień albo kliknij prawym przyciskiem myszy (lub kliknij „Więcej opcji”, czyli trzy kropki), żeby wybrać „Edytuj”, „+ Dzień”, „Otwórz stronę internetową”, Google Maps, „Zapisz w kolekcji” lub „Usuń”.',
  'help.ctx.trip-places.bullet.6':
    'Gdy dzień jest otwarty, okrągły + na końcu wiersza („+ Dzień”) dodaje miejsce do tego dnia. Jest widoczny przy każdym miejscu, którego jeszcze nie ma w tym dniu. „Zaplanowane” pokazuje wtedy tylko ten dzień, o czym informuje znacznik „Widoczny tylko otwarty dzień”. Jego x, „Pokaż całą podróż”, zamyka dzień.',
  // create-place
  'help.guide.create-place.title': 'Utwórz miejsce',
  'help.guide.create-place.goal': 'Dodaj ręcznie miejsce lub atrakcję ze wszystkimi szczegółami potrzebnymi w planie.',
  'help.guide.create-place.step.1':
    'Kliknij Dodaj miejsce/atrakcję na górze kolumny miejsc (Nowe miejsce, gdy otwarty jest jakiś dzień). Formularz otworzy się z kursorem w polu wyszukiwania.',
  'help.guide.create-place.step.2':
    'Wpisz miejsce w polu Szukaj miejsc… i wybierz wynik. Nazwa na górze okna, Adres, Szerokość, Długość i Strona internetowa wypełnią się same, a Szczegóły miejsca po lewej pokażą zdjęcia, godziny otwarcia i opis. W TREK z kluczem Google link Nie to miejsce? Szukaj zamiast tego w Google pod wynikami uruchamia to samo wyszukiwanie przez Google. Przy włączonych Kolekcjach Zapisane miejsca po prawej proponują miejsca z Twoich list w ten sam sposób.',
  'help.guide.create-place.step.3':
    'W „Szczegółach miejsca” kliknij zdjęcie w sekcji „Wybierz zdjęcie”, żeby ustawić je jako obraz miejsca. „Użyj tego tekstu” kopiuje opis do formularza.',
  'help.guide.create-place.step.4':
    'Sprawdź pola formularza. Nazwa u góry okna to jedyne wymagane pole. Pigułka „Kategoria” pod nią wybiera jedną z kategorii podróży, a + obok tworzy nową. „Adres”, „Szerokość” i „Długość” pochodzą z wyszukiwania albo wpisujesz je sam. „Opis” i „Notatki” są na twoje własne teksty. W pole „Strona internetowa” wpisz link, „Załącz” w sekcji „Pliki” dodaje dokument, a „Telefon”, „E-mail” i „Dodaj godziny otwarcia” służą do danych, których wyszukiwanie nie znalazło.',
  'help.guide.create-place.step.5':
    'Kliknij „Dodaj”. Jeśli w podróży jest już miejsce o tej samej nazwie lub w tym samym punkcie, TREK wyświetli ostrzeżenie, a przycisk zmieni się na „Dodaj mimo to”.',
  'help.guide.create-place.result':
    'Miejsce jest na liście i na mapie, w grupie „Niezaplanowane”, dopóki nie dodasz go do dnia.',
  'help.guide.create-place.tip.1':
    '„Koszty” na dole formularza, przy włączonym dodatku „Budżet”, otwierają zaraz po zapisaniu edytor „Kosztów” dla wydatku związanego z miejscem. Obraz lub PDF wklejony do okna zostaje załączony jako plik w sekcji „Pliki”.',
  'help.guide.create-place.tip.2':
    'Na każdym serwerze TREK wyniki wyszukiwania pochodzą z indeksu TREK i OpenStreetMap, a „Szczegóły miejsca” uzupełniają się automatycznie z Wikipedii, Wikivoyage i Wikimedia. TREK pyta Google tylko wtedy, gdy oba źródła niczego nie znajdą, i tylko Google dostarcza oceny.',
  'help.guide.create-place.tip.3':
    'Miejsce możesz też utworzyć na mapie: kliknij dany punkt prawym przyciskiem, a formularz otworzy się z wypełnionymi współrzędnymi i adresem.',
  // place-to-open-day
  'help.guide.place-to-open-day.title': 'Dodaj miejsce bezpośrednio do otwartego dnia',
  'help.guide.place-to-open-day.goal': 'Utwórz lub wybierz miejsce i za jednym razem dodaj je do dnia.',
  'help.guide.place-to-open-day.step.1':
    'Kliknij nagłówek dnia w kolumnie dni. Dzień się otwiera: jego karta jest podświetlona, a w kolumnie miejsc obok przycisku „Nowe miejsce” pojawia się przycisk „Do dnia”.',
  'help.guide.place-to-open-day.step.2':
    '„Do dnia” otwiera ten sam formularz co „Nowe miejsce”, ale po kliknięciu „Dodaj” miejsce od razu trafia do otwartego dnia.',
  'help.guide.place-to-open-day.step.3':
    'Aby dodać istniejące miejsce do otwartego dnia, kliknij okrągły przycisk + na końcu jego wiersza (+ Dzień) albo kliknij je prawym przyciskiem i wybierz + Dzień. Przycisk + widać przy każdym miejscu, którego nie ma jeszcze w tym dniu.',
  'help.guide.place-to-open-day.step.4':
    'Działa to także w drugą stronę, bez otwierania dnia: przeciągnij wiersz miejsca z kolumny i upuść go na karcie dnia. Jeśli upuścisz go między dwoma przystankami, trafi dokładnie w to miejsce.',
  'help.guide.place-to-open-day.result':
    'Miejsce pojawia się na końcu dnia; przeciągnij je w górę lub w dół na właściwe miejsce.',
  'help.guide.place-to-open-day.tip.1':
    'Otwarty dzień wpływa też na wyszukiwanie: gdy dzień jest otwarty, mapa i wyszukiwanie w pobliżu zaczynają od miejsc, które już są w tym dniu.',
  'help.guide.place-to-open-day.tip.2': 'Przycisk „Cofnij” na pasku narzędzi nad dniami cofa przypisanie.',
  // filter-places
  'help.guide.filter-places.title': 'Wyszukiwanie miejsca na liście',
  'help.guide.filter-places.goal': 'Pokaż w kolumnie tylko te miejsca, których szukasz.',
  'help.guide.filter-places.step.1':
    '„Pokaż”, lista rozwijana pod wyszukiwarką, przełącza między „Wszystkie”, „Niezaplanowane” (jeszcze bez dnia) i „Zaplanowane” (przypisane do dnia), każda opcja z liczbą. Jeśli dodatek „Wycieczki” jest wyłączony, a zaimportowano ślad GPX, dostępne są też „Ślady”.',
  'help.guide.filter-places.step.2':
    'Wpisz tekst w polu „Szukaj” u góry. Lista zawęża się w trakcie pisania, według nazwy, adresu, opisu i notatek; x w polu je czyści.',
  'help.guide.filter-places.step.3':
    'Przycisk z etykietą obok „Pokaż” wyświetla kategorie: zaznacz jedną lub kilka, w tym „Brak kategorii”. Przycisk pokazuje, ile kategorii jest zaznaczonych, a „Wyczyść filtr” na dole listy usuwa wszystkie.',
  'help.guide.filter-places.step.4':
    'Gwiazdka obok ustawia minimalną ocenę: 5+, 4+ itd. pokazuje tylko miejsca ze średnią oceną co najmniej na tym poziomie. Miejsca bez oceny są ukrywane.',
  'help.guide.filter-places.result': 'Liczba przy „Pokaż” mówi, ile miejsc pasuje. Filtry działają łącznie.',
  'help.guide.filter-places.tip.1':
    'Gdy dzień jest otwarty, „Zaplanowane” pokazuje tylko ten dzień i informuje o tym komunikatem „Widoczny tylko otwarty dzień” z opcją „Pokaż całą podróż” obok.',
  'help.guide.filter-places.tip.2':
    'Mapa uwzględnia też Pokaż, kategorie i ocenę, a przy otwartym dniu Zaplanowane na mapie pokazuje tylko ten dzień. Wyszukiwanie i glob filtrują tylko listę.',
  // edit-place
  'help.guide.edit-place.title': 'Zmień miejsce',
  'help.guide.edit-place.goal': 'Popraw nazwę, przesuń pinezkę, dodaj stronę internetową lub zmień kategorię.',
  'help.guide.edit-place.step.1':
    'Kliknij wiersz prawym przyciskiem i wybierz Edytuj, kliknij Więcej opcji na końcu wiersza albo otwórz miejsce i kliknij Edytuj w jego szczegółach.',
  'help.guide.edit-place.step.2':
    'W oknie „Edytuj miejsce” zmień, co trzeba: nazwę i pigułkę „Kategoria” u góry okna, „Adres”, „Szerokość” i „Długość”, „Opis”, „Notatki”, „Strona internetowa”, „Telefon”, „E-mail” i godziny otwarcia. Jeśli miejsce jest przypisane do dokładnie jednego dnia albo otworzyłeś je z dnia, formularz ma też pola „Początek”, „Koniec” i „Notatki na ten dzień”.',
  'help.guide.edit-place.step.3': 'Kliknij „Aktualizuj”.',
  'help.guide.edit-place.result':
    'Zmiana obowiązuje wszędzie, gdzie widać to miejsce: na liście, na mapie i we wszystkich dniach, w których się znajduje.',
  'help.guide.edit-place.tip.1':
    '„Notatki na ten dzień” dotyczą miejsca tylko w tym jednym dniu, a „Notatki” dotyczą samego miejsca.',
  'help.guide.edit-place.tip.2':
    'Koniec wcześniejszy niż Początek blokuje Aktualizuj. Nakładanie się godzin z: tylko ostrzega, że inny przystanek tego dnia ma tę samą godzinę.',
  // delete-place
  'help.guide.delete-place.title': 'Usuń miejsce',
  'help.guide.delete-place.goal': 'Trwale usuń miejsce z podróży.',
  'help.guide.delete-place.step.1':
    'Kliknij wiersz prawym przyciskiem myszy i wybierz „Usuń” (ta opcja jest też w „Więcej opcji” na końcu wiersza) albo kliknij „Usuń” w szczegółach miejsca.',
  'help.guide.delete-place.step.2':
    'Kliknij „Usuń” w oknie potwierdzenia. Jeśli w tym miejscu jest zarezerwowany nocleg albo jest z nim powiązana rezerwacja, okno informuje, co zostanie usunięte razem z nim.',
  'help.guide.delete-place.result':
    'Miejsce znika z listy, z mapy i ze wszystkich dni. Przycisk cofania na pasku narzędzi nad dniami je przywraca.',
  'help.guide.delete-place.tip.1':
    'Aby usunąć miejsce tylko z jednego dnia, użyj na tym przystanku opcji „Usuń z dnia”.',
  'help.guide.delete-place.tip.2':
    'Aby usunąć kilka miejsc naraz, kliknij znaczek wyboru obok wyszukiwania i zacznij zaznaczać.',
  // select-places
  'help.guide.select-places.title': 'Zmień lub usuń kilka miejsc naraz',
  'help.guide.select-places.goal': 'Zmieniaj wiele miejsc naraz zamiast każde osobno.',
  'help.guide.select-places.step.1':
    'Kliknij znaczek obok pola wyszukiwania. Przy wierszach pojawią się okrągłe pola wyboru, a na dole kolumny pasek z akcjami.',
  'help.guide.select-places.step.2':
    'Klikaj wiersze, aby je zaznaczyć. „Zaznacz wszystko”, czyli podwójny znaczek na pasku, zaznacza wszystkie wiersze widoczne po filtrowaniu.',
  'help.guide.select-places.step.3':
    'Pasek pokazuje liczbę zaznaczonych miejsc. „Zmień kategorię” przypisuje im wszystkim jedną kategorię; „Zapisz w kolekcji” (przy włączonych „Kolekcjach”) kopiuje je do jednej z twoich kolekcji; „Usuń wybrane” usuwa je po potwierdzeniu.',
  'help.guide.select-places.step.4': 'Kliknij „Gotowe”, czyli X na końcu paska, aby zakończyć zaznaczanie.',
  'help.guide.select-places.result':
    'Zmiana dotyczy wszystkich zaznaczonych miejsc. Usunięcie możesz cofnąć na pasku narzędzi nad dniami.',
  'help.guide.select-places.tip.1':
    'Filtry działają też podczas zaznaczania: najpierw przefiltruj na „Niezaplanowane”, a wtedy „Zaznacz wszystko” zaznaczy tylko te miejsca.',
  'help.guide.select-places.tip.2':
    'Oznacz jako odwiedzone na listach pojawia się na pasku, gdy dodatek Kolekcje jest włączony. Oznacza miejsca jako odwiedzone w kolekcjach, w których są zapisane.',
  // import-places-file
  'help.guide.import-places-file.title': 'Zaimportuj miejsca z pliku GPX, KML lub KMZ',
  'help.guide.import-places-file.goal':
    'Gdy dodatek Wycieczki jest wyłączony, zaimportuj jako miejsca pinezki i ścieżki wyeksportowane z Google My Maps, Google Earth lub lokalizatora GPS.',
  'help.guide.import-places-file.step.1':
    'Kliknij Importuj miejsca, przycisk z ikoną obok przycisku dodawania, i wybierz Importuj plik albo upuść plik w dowolnym miejscu kolumny miejsc. Obie możliwości są dostępne tylko wtedy, gdy administrator wyłączył dodatek Wycieczki.',
  'help.guide.import-places-file.step.2':
    'Wybierz plik lub przeciągnij go do pola. Dla GPX zaznacz, co zaimportować: „Punkty trasy”, „Trasy”, „Trasy GPS (ze śladem)”. Dla KML i KMZ zaznacz „Punkty (Placemarks)” i „Ścieżki (LineStrings)”.',
  'help.guide.import-places-file.step.3':
    'Pole przyjmuje kilka plików naraz, ale tylko .gpx, .kml i .kmz. Plik innego rodzaju albo większy niż 10 MB zostanie odrzucony w oknie i nie będzie zaimportowany.',
  'help.guide.import-places-file.step.4':
    'Kliknij „Importuj”. Komunikat pokaże, ile miejsc zaimportowano. Przy pliku KML lub KMZ okno pozostaje otwarte z podsumowaniem tego, co utworzono, a co pominięto.',
  'help.guide.import-places-file.result':
    'Miejsca są na liście. Ślad ma w swoim wierszu kolorową linię, jest widoczny na mapie i ma własny filtr „Ślady”.',
  'help.guide.import-places-file.tip.1':
    'Za duży plik zostanie odrzucony, a TREK poda limit rozmiaru; wyeksportuj go ponownie bez zdjęć albo podziel na części.',
  'help.guide.import-places-file.tip.2': 'Cały import możesz cofnąć z paska narzędzi nad dniami.',
  // import-places-list
  'help.guide.import-places-list.title': 'Zaimportuj udostępnioną listę z Google Maps lub Naver Maps',
  'help.guide.import-places-list.goal': 'Zaimportuj miejsca z linku do udostępnionej listy.',
  'help.guide.import-places-list.step.1':
    'Kliknij „Importuj miejsca”, czyli ikonę obok przycisku dodawania, i wybierz „Import listy”.',
  'help.guide.import-places-list.step.2':
    'W polu „Dostawca” wybierz „Lista Google” lub „Lista Naver”, a potem wklej link udostępnionej listy w polu „Link”. Działa też link do wskazówek dojazdu z Google Maps: jego przystanki staną się miejscami, w kolejności jazdy.',
  'help.guide.import-places-list.step.3': 'Kliknij „Importuj”.',
  'help.guide.import-places-list.result':
    'Wszystkie miejsca z listy są w podróży, z nazwami takimi jak na liście. Miejsca, które już były w podróży, zostają pominięte.',
  'help.guide.import-places-list.tip.1':
    'Lista musi być udostępniona publicznie. Link do prywatnej listy niczego nie zaimportuje.',
  'help.guide.import-places-list.tip.2':
    'Gdy Twój TREK ma klucz Google, w oknie pojawia się opcja „Wzbogać miejsca przez Google”: wyszukuje ona każde zaimportowane miejsce i uzupełnia zdjęcia, adres i szczegóły.',
  'help.guide.sort-places.title': 'Sortuj listę miejsc',
  'help.guide.sort-places.goal': 'Posortuj listę według nazwy, oceny lub tego, co ostatnio dodano lub zmieniono.',
  'help.guide.sort-places.step.1':
    'Kliknij „Sortuj według”, czyli przycisk ze strzałkami na końcu wiersza filtrów. Ptaszek oznacza bieżącą kolejność, a podpowiedź przycisku pokazuje jej nazwę.',
  'help.guide.sort-places.step.2':
    'Wybierz kolejność, na przykład Najwyżej oceniane, albo posortuj według nazwy. Lista od razu się zmieni.',
  'help.guide.sort-places.result': 'Lista pokazuje miejsca w wybranej kolejności, dopóki nie wybierzesz innej.',
  'help.guide.sort-places.tip.1':
    'Przy każdym sortowaniu innym niż „Ostatnio dodane” przycisk jest wyróżniony, więc od razu widać, że lista jest posortowana inaczej.',
  'help.guide.sort-places.tip.2':
    'Sortowanie zmienia tylko listę. Dni zachowują własną kolejność, a przeglądarka pamięta wybraną kolejność.',
  'help.guide.place-by-hand.title': 'Dodaj miejsce, którego wyszukiwarka nie zna',
  'help.guide.place-by-hand.goal':
    'Gdy wyszukiwarka niczego nie znajdzie, wpisz miejsce samodzielnie, z telefonem, e-mailem i godzinami otwarcia.',
  'help.guide.place-by-hand.step.1':
    'W oknie miejsca wpisz nazwę w wyszukiwarkę i naciśnij Enter. Jeśli nic nie zostanie znalezione, okno Cię o tym poinformuje i zaproponuje „Dodaj ręcznie”.',
  'help.guide.place-by-hand.step.2':
    'Kliknij „Dodaj ręcznie”. Wyszukiwany tekst stanie się nazwą, a okno przewinie się do pól kontaktowych.',
  'help.guide.place-by-hand.step.3': 'Jeśli znasz telefon i e-mail, wpisz je w polach „Telefon” i „E-mail”.',
  'help.guide.place-by-hand.step.4':
    'Kliknij „Dodaj godziny otwarcia” i ustaw, kiedy miejsce jest otwierane i zamykane w poszczególne dni. Przycisk kopiowania ustawia wszystkim dniom godziny pierwszego dnia, a przełącznik dnia oznacza go jako „Zamknięta”.',
  'help.guide.place-by-hand.step.5': 'Kliknij „Dodaj”.',
  'help.guide.place-by-hand.result':
    'Miejsce zostaje dodane do listy. W jego szczegółach widać wpisany telefon, e-mail i godziny otwarcia, tak samo jak przy miejscu znalezionym przez wyszukiwarkę.',
  'help.guide.place-by-hand.tip.1':
    'Gdy edytujesz miejsce bez własnych godzin, automatycznie przejmuje ono godziny otwarcia ze „Szczegółów miejsca” po lewej. Jeśli ma już godziny, obok nich pojawia się przycisk, który kopiuje wyszukane godziny.',
  'help.guide.place-by-hand.tip.2':
    'Wpisane przez Ciebie godziny zastępują wyszukane, więc kawiarnia z sezonowymi godzinami pokazuje te, które znasz.',

  // ── Screen: trip-days ─────────────────────────────────────────────────────────────────
  'help.ctx.trip-days.title': 'Dni',
  'help.ctx.trip-days.summary':
    'Lewa kolumna planu: osobna karta dla każdego dnia, a w niej przystanki w kolejności, notatki, rezerwacje i transport tego dnia oraz trasa między przystankami. To tutaj naprawdę planujesz podróż.',
  'help.ctx.trip-days.bullet.1':
    'Nagłówek u góry: po lewej „Eksportuj” (PDF, kalendarz, GPX); po prawej strzałka cofania, „Rozwiń wszystkie dni” / „Zwiń wszystkie dni”, „Zmień kolejność dni” oraz „Pokaż wszystkie trasy rezerwacji”, gdy któraś rezerwacja ma trasę do narysowania.',
  'help.ctx.trip-days.bullet.2':
    'Karta dnia: kafelek z numerem dnia i prognozą pogody, tytuł („Dzień 1”, dopóki nie nadasz nazwy) i data, a pod nimi pigułki noclegu (zielona w dniu zameldowania, czerwona w dniu wymeldowania, przerywana, dopóki rezerwacja nie jest potwierdzona; ikona biletu otwiera rezerwację) i wynajętego samochodu. Kliknij nagłówek, żeby otworzyć dzień, strzałka go zwija, a + („Dodaj do dnia”) otwiera menu: „Dodaj miejsce do tego dnia”, „Dodaj zakwaterowanie”, „Dodaj transport”, „Transport publiczny” i „Dodaj notatkę”. Kliknięcie nagłówka prawym przyciskiem myszy daje te same opcje, a dodatkowo „Wyczyść dzień”.',
  'help.ctx.trip-days.bullet.3':
    'W środku dnia: przystanki w kolejności, każdy ze zdjęciem, ikoną kategorii, nazwą, godziną i opisem, powiązanymi rezerwacjami i informacją, kto jedzie; notatki; rezerwacje i transport z danego dnia w kolorach swojego typu. Najedź na przystanek, żeby zobaczyć uchwyt do przeciągania, kłódkę na zdjęciu, strzałki, „Dodaj rezerwację” i trzy kropki („Więcej opcji”). Menu przystanków i notatek otworzysz też prawym przyciskiem myszy.',
  'help.ctx.trip-days.bullet.4':
    'Gdy otwarty dzień ma co najmniej dwa przystanki, pod nimi pojawia się pasek trasy: „Trasa” pokazuje dzień na mapie wraz z czasem przejazdu każdego odcinka między przystankami, trzy ikony ustawiają dla dnia „Samochód”, „Pieszo” lub „Rower”, a dalej są „Optymalizuj”, „Otwórz w Google Maps” i „Otwórz w CoMaps”.',
  'help.ctx.trip-days.bullet.5':
    'Miejsca możesz dodać do dnia na kilka sposobów: przeciągnij wiersz z kolumny miejsc, użyj „+ Dzień” w tym wierszu, wybierz „Dodaj miejsce do tego dnia” z menu + dnia lub w pustym dniu albo skorzystaj ze szczegółów miejsca.',
  'help.ctx.trip-days.bullet.6':
    '„Łączny koszt” na dole sumuje wydatki z „Kosztów” przypisane do przystanków i rezerwacji danego dnia, każdy tylko raz, w Twojej walucie wyświetlania.',
  // read-day-plan
  'help.guide.read-day-plan.title': 'Jak czytać dzień',
  'help.guide.read-day-plan.goal': 'Dowiedz się, co mówi każda część karty dnia, zanim cokolwiek zmienisz.',
  'help.guide.read-day-plan.step.1':
    'Nagłówek: kafelek z numerem dnia i prognozą, a obok Dzień 1 albo nadany przez Ciebie tytuł i data. Pod nimi są przyciski noclegu (zielony przy zameldowaniu, czerwony przy wymeldowaniu, przerywany, dopóki nocleg nie jest potwierdzony; bilet na nim otwiera rezerwację) oraz wynajętego samochodu. Kliknij nagłówek, aby otworzyć dzień (panel ze szczegółami otworzy się nad mapą). Przycisk + po prawej (Dodaj do dnia) dodaje miejsce, pobyt, transport, połączenie transportem publicznym lub notatkę, a strzałka zwija kartę.',
  'help.guide.read-day-plan.step.2':
    'Przystanek pokazuje zdjęcie, ikonę kategorii i nazwę, potem godzinę, jeśli ma ustawiony „Początek”, oraz opis. Pod nim widać „Notatki na ten dzień”. Po najechaniu na wiersz pojawiają się przyciski: uchwyt po lewej służy do przeciągania, zdjęcie zmienia się w kłódkę do optymalizacji trasy, a na prawym końcu są strzałki („Przenieś w górę”, „Przenieś w dół”), „Dodaj rezerwację” i trzy kropki („Więcej opcji”).',
  'help.guide.read-day-plan.step.3':
    'Rezerwacja przy przystanku jest na nim widoczna jako plakietka „Rezerwacja”, zielona po potwierdzeniu i bursztynowa, dopóki oczekuje, z godziną i przewoźnikiem. Kliknij plakietkę, żeby otworzyć rezerwację; przycisk trasy obok rysuje jej trasę. Transport ma własny wiersz w kolorze swojego typu, z godziną i informacją „Wylot” lub „Przylot”. Kliknij rezerwację, żeby otworzyć szczegóły; przyciskiem „Edytuj” możesz ją tam zmienić.',
  'help.guide.read-day-plan.step.4':
    'Gdy włączona jest „Trasa”, łącznik między dwoma przystankami pokazuje czas i długość odcinka w środku transportu wybranym dla dnia; kliknij go, żeby zmienić środek transportu tylko dla tego odcinka.',
  'help.guide.read-day-plan.step.5':
    'Pasek trasy pod przystankami otwartego dnia: „Trasa” rysuje drogę dnia na mapie, trzy ikony wybierają „Samochód”, „Pieszo” lub „Rower”, „Optymalizuj” zmienia kolejność przystanków, a „Otwórz w Google Maps” i „Otwórz w CoMaps” otwierają tam cały dzień.',
  'help.guide.read-day-plan.result':
    'Każdy symbol na karcie coś oznacza; z poniższych poradników dowiesz się, jak zmienić każdy z nich.',
  'help.guide.read-day-plan.tip.1':
    'Kliknij przystanek prawym przyciskiem myszy lub kliknij jego trzy kropki, aby otworzyć menu: „Edytuj”, „Usuń z dnia”, „Pomiń w trasie”, „Otwórz stronę internetową”, „Zapisz w kolekcji”, „Usuń”. Aplikacje nawigacyjne znajdziesz w szczegółach miejsca, w sekcji „Nawigacja”.',
  'help.guide.read-day-plan.tip.2':
    'Najedź na przystanek, a na końcu wiersza pojawi się „Dodaj rezerwację”. Rezerwacja utworzona w ten sposób jest powiązana z tym przystankiem w tym dniu.',
  // place-onto-day
  'help.guide.place-onto-day.title': 'Dodaj miejsce do dnia',
  'help.guide.place-onto-day.goal': 'Zrób z miejsca z listy przystanek w danym dniu, we właściwym miejscu kolejności.',
  'help.guide.place-onto-day.step.1':
    'Przeciągnij wiersz z kolumny miejsc na kartę dnia. Upuść go między dwoma przystankami, aby umieścić go dokładnie tam, albo na nagłówku dnia, aby dodać go na końcu.',
  'help.guide.place-onto-day.step.2':
    'Bez przeciągania: otwórz dzień, klikając jego nagłówek, a potem kliknij okrągły przycisk + na końcu wiersza miejsca (+ Dzień) albo kliknij wiersz prawym przyciskiem i wybierz + Dzień.',
  'help.guide.place-onto-day.step.3':
    '„Dodaj miejsce do tego dnia” w menu + dnia lub w pustym dniu otwiera formularz miejsca, a nowe miejsce od razu trafia do dnia.',
  'help.guide.place-onto-day.step.4':
    'Gdy dzień jest otwarty, Dodaj do dnia w szczegółach miejsca dodaje je do tego dnia, a Do dnia w nagłówku kolumny miejsc tworzy nowe miejsce od razu w otwartym dniu.',
  'help.guide.place-onto-day.result':
    'Miejsce jest teraz przystankiem w tym dniu. Pojawia się na mapie z numerem dnia, a kolumna miejsc liczy je w grupie „Zaplanowane”.',
  'help.guide.place-onto-day.tip.1':
    'Miejsce może być w kilku dniach: aby dodać je do drugiego dnia, przeciągnij je z kolumny miejsc. Przeciągnięcie przystanku z jednej karty dnia na drugą przenosi go.',
  'help.guide.place-onto-day.tip.2': 'Strzałka cofania w nagłówku cofa przypisanie.',
  'help.guide.place-onto-day.tip.3':
    'Nie możesz upuścić przystanku między dwa wpisy z ustaloną godziną ani przed rezerwacją, która ma już godzinę; plan zawsze zachowuje kolejność czasową.',
  // reorder-stops
  'help.guide.reorder-stops.title': 'Zmień kolejność w dniu',
  'help.guide.reorder-stops.goal': 'Przesuń przystanek w górę, w dół lub na inny dzień.',
  'help.guide.reorder-stops.step.1': 'Najedź na przystanek i przeciągnij go za uchwyt w nowe miejsce na karcie.',
  'help.guide.reorder-stops.step.2':
    'Możesz też użyć strzałek na prawym końcu przystanku, na który najechałeś („Przenieś w górę”, „Przenieś w dół”): jedno kliknięcie to jedna pozycja.',
  'help.guide.reorder-stops.step.3':
    'Przeciągnij przystanek na kartę innego dnia, aby go tam przenieść. Zniknie wtedy z poprzedniego dnia.',
  'help.guide.reorder-stops.step.4':
    'Jeśli przystanek ma ustaloną godzinę, a przeniesienie zaburzyłoby kolejność dnia, TREK zapyta „Usunąć godzinę?”, bo to godzina wyznacza pozycję przystanku. „Potwierdź” usuwa godzinę, więc przystanek można przenieść w dowolne miejsce. „Anuluj” zostawia dzień bez zmian.',
  'help.guide.reorder-stops.result': 'Trasa i czasy przejazdu od razu dostosowują się do nowej kolejności.',
  'help.guide.reorder-stops.tip.1':
    'Rezerwacja o stałej godzinie zostaje w miejscu wynikającym z tej godziny. Jeśli upuścisz ją gdzie indziej w tym samym dniu, wróci na swoje miejsce. Jeśli przeciągniesz ją na kartę innego dnia, przeniesie się do tego dnia.',
  'help.guide.reorder-stops.tip.2':
    'Gdy dzień ma co najmniej trzy przystanki, „Optymalizuj” na pasku trasy układa cały dzień według najkrótszej drogi. Aby przystanek został na swoim miejscu, najpierw go zablokuj.',
  // set-stop-times
  'help.guide.set-stop-times.title': 'Ustawianie godziny przystanku',
  'help.guide.set-stop-times.goal': 'Ustaw, kiedy przystanek się zaczyna i kończy, żeby dzień działał jak rozkład.',
  'help.guide.set-stop-times.step.1':
    'Kliknij przystanek prawym przyciskiem myszy albo kliknij jego trzy kropki i wybierz „Edytuj”. Gdy otworzysz formularz z poziomu dnia, tuż pod lokalizacją znajdziesz pola „Początek” i „Koniec” dla tego dnia.',
  'help.guide.set-stop-times.step.2':
    'Wpisz „Początek” i, jeśli chcesz, „Koniec”. Komunikat „Nakładanie się godzin z:” ostrzega, że nakłada się inny przystanek z godziną w tym dniu. Gdy „Koniec” jest wcześniej niż „Początek”, przycisk „Aktualizuj” jest zablokowany.',
  'help.guide.set-stop-times.step.3':
    'Kliknij „Aktualizuj”. Przystanek dostanie plakietkę z godziną i przesunie się w dniu na miejsce odpowiadające tej godzinie.',
  'help.guide.set-stop-times.result':
    'Przystanki z godziną zachowują swoje miejsce w kolejności, a przystanki bez godziny są układane wokół nich.',
  'help.guide.set-stop-times.tip.1':
    'Godzina należy do przystanku w danym dniu; to samo miejsce w innym dniu może mieć inną godzinę.',
  'help.guide.set-stop-times.tip.2':
    'Aby ręcznie przesunąć przystanek z godziną, przeciągnij go. TREK zapyta „Usunąć godzinę?”, a po kliknięciu „Potwierdź” godzina zostanie usunięta.',
  'help.guide.set-stop-times.tip.3':
    'Notatki na ten dzień w tym samym formularzu służą do informacji, które dotyczą tylko tego dnia, na przykład rezerwacji stolika albo numeru biletu.',
  // remove-from-day
  'help.guide.remove-from-day.title': 'Usuń przystanek z dnia',
  'help.guide.remove-from-day.goal': 'Usuń miejsce z dnia, nie usuwając go z podróży.',
  'help.guide.remove-from-day.step.1':
    'Kliknij przystanek prawym przyciskiem albo kliknij jego trzy kropki i wybierz Usuń z dnia.',
  'help.guide.remove-from-day.step.2':
    'Przystanek zostanie usunięty z dnia. Miejsce pozostaje w kolumnie miejsc, w sekcji „Niezaplanowane”, jeśli nie ma go w żadnym innym dniu.',
  'help.guide.remove-from-day.result':
    'Dzień, jego trasa i koszt się aktualizują. Strzałka cofania przywraca przystanek.',
  'help.guide.remove-from-day.tip.1': '„Usuń” w tym samym menu usuwa miejsce z całej podróży, ze wszystkich dni.',
  'help.guide.remove-from-day.tip.2': '„Usuń z dnia” jest też w panelu szczegółów miejsca, obok „Dodaj do dnia”.',
  // lock-stop
  'help.guide.lock-stop.title': 'Zablokuj przystanek w miejscu',
  'help.guide.lock-stop.goal': 'Zablokuj przystanek, żeby optymalizacja trasy nie zmieniła jego pozycji.',
  'help.guide.lock-stop.step.1':
    'Najedź na zdjęcie przystanku i kliknij kłódkę „Zachowaj pozycję podczas optymalizacji trasy”.',
  'help.guide.lock-stop.step.2':
    '„Optymalizuj” układa teraz pozostałe przystanki wokół niego. Aby go odblokować, kliknij kłódkę jeszcze raz („Kliknij, aby odblokować”).',
  'help.guide.lock-stop.result':
    'Na zdjęciu pojawia się kłódka, a przystanek zachowuje swoje miejsce, dopóki go nie odblokujesz.',
  'help.guide.lock-stop.tip.1':
    'Przystanek z ustaloną godziną jest zablokowany przez tę godzinę i nigdy nie zmienia miejsca podczas optymalizacji.',
  'help.guide.lock-stop.tip.2':
    'Blokada działa tylko do ponownego wczytania strony. Potem wszystkie przystanki są znów odblokowane; na stałe pozostają tylko przystanki z godziną.',
  // day-note
  'help.guide.day-note.title': 'Dodaj notatkę do dnia',
  'help.guide.day-note.goal': 'Zapisz w dniu przypomnienie, numer biletu albo plan B.',
  'help.guide.day-note.step.1': 'Kliknij + w nagłówku dnia (Dodaj do dnia) i wybierz Dodaj notatkę.',
  'help.guide.day-note.step.2':
    'Wpisz nazwę notatki u góry okna, w polu „Notatka”. Ta nazwa pojawi się na karcie dnia. Resztę napisz w polu „Notatka dnia”: pasek narzędzi nad nim formatuje tekst (pogrubienie, listy, linki, cytaty), a „Podgląd” po lewej pokazuje, jak będzie wyglądał wiersz.',
  'help.guide.day-note.step.3':
    'Wybierz „Ikonę” i „Kolor”, żeby notatka łatwo odróżniała się od przystanków, a potem kliknij „Dodaj”.',
  'help.guide.day-note.step.4':
    'Notatka pojawia się w dniu jak przystanek: przeciągnij ją w odpowiednie miejsce lub użyj jej strzałek. Kliknij ją, żeby ją edytować. „Usuń” znajdziesz w oknie, w menu trzech kropek i w menu prawego przycisku myszy; przed usunięciem pojawi się pytanie „Usunąć notatkę?”.',
  'help.guide.day-note.result': 'Notatka jest częścią dnia i pliku PDF, w miejscu, w które ją przeciągnąłeś.',
  'help.guide.day-note.tip.1':
    'Linki w notatce otwierają się w nowej karcie, a pojedynczy znak nowego wiersza pozostaje nowym wierszem.',
  'help.guide.day-note.tip.2': 'Notatki są przypisane do dni. Notatkę dla całej podróży dodaj we „Współpracy”.',
  // day-route
  'help.guide.day-route.title': 'Wyświetlanie i optymalizacja trasy dnia',
  'help.guide.day-route.goal':
    'Zobacz trasę między przystankami, wybierz sposób podróżowania i pozwól TREK ułożyć kolejność.',
  'help.guide.day-route.step.1':
    'Otwórz dzień i kliknij „Trasa” na pasku trasy pod przystankami: trasa między przystankami pojawi się na mapie, a łączniki między przystankami pokażą czas i dystans każdego odcinka.',
  'help.guide.day-route.step.2':
    'Trzy ikony obok ustawiają sposób podróżowania w danym dniu: „Samochód”, „Pieszo” lub „Rower”. Odcinki zostaną przeliczone. Wtyczki mogą dodawać własne sposoby.',
  'help.guide.day-route.step.3':
    'Kliknij łącznik, aby zmienić sposób podróżowania na tym jednym odcinku: wybierz sposób, „Transport publiczny”, aby wyszukać połączenie tam, gdzie jest to dostępne, lub „Użyj domyślnego dnia”, aby wrócić do ustawienia dnia.',
  'help.guide.day-route.step.4':
    'Optymalizuj (okrągła strzałka) ustawia przystanki w kolejności najkrótszej drogi, od trzech przystanków wzwyż. Przystanki z kłódką lub stałą godziną zostają na miejscu. Jeśli dnia dotyczy nocleg, trasa zaczyna się od niego.',
  'help.guide.day-route.step.5':
    'Otwórz w Google Maps lub Otwórz w CoMaps otwiera cały dzień jako trasę w tej aplikacji, do nawigowania w drodze. CoMaps uwzględnia też sposób podróży ustawiony dla dnia.',
  'help.guide.day-route.result':
    'Dzień jest trasą z godzinami. Łączny koszt i odcinki aktualizują się wraz ze zmianą kolejności.',
  'help.guide.day-route.tip.1':
    'Domyślnie trasy wyznacza OSRM; administrator może ustawić w TREK inny silnik tras w „Domyślnych ustawieniach”.',
  'help.guide.day-route.tip.2':
    'Odcinek, dla którego nie udało się wyznaczyć trasy, nie pokazuje czasu. Sprawdź, czy oba przystanki mają współrzędne.',
  'help.guide.day-route.tip.3': 'Strzałka cofania cofa optymalizację.',
  // manage-days
  'help.guide.manage-days.title': 'Dodawanie dni, zmiana ich kolejności i nazw',
  'help.guide.manage-days.goal': 'Zmieniaj same dni, a nie tylko miejsca, które w nich są.',
  'help.guide.manage-days.step.1':
    'Dni wynikają z dat podróży. Zmień daty w formularzu edycji podróży w „Panelu”, a dni zostaną dodane lub usunięte na początku lub na końcu. Zanim zostanie usunięty dzień z zawartością, zobaczysz listę usuwanych dni i tego, co w nich jest.',
  'help.guide.manage-days.step.2':
    '„Zmień kolejność dni” w nagłówku otwiera listę: przeciągnij dzień za uchwyt albo użyj „Przenieś w górę” i „Przenieś w dół”, a dzień przeniesie się razem z miejscami, notatkami i rezerwacjami. Pod listą opcja „Dodaj” z kolejną datą dodaje dzień po ostatnim dniu z datą i wydłuża podróż o jeden dzień, a „Bez daty” dodaje na końcu dzień bez daty. Podróż bez dat ma tylko „Dodaj dzień”.',
  'help.guide.manage-days.step.3':
    '„Usuń dzień”, kosz na końcu wiersza, najpierw pyta o potwierdzenie. Pokazuje, co zostanie usunięte razem z dniem: miejsca, notatki i rezerwacje, nocleg z zameldowaniem lub wymeldowaniem w tym dniu, oraz dni, których data przesunie się o jeden wcześniej. „Usuń dzień” usuwa go, „Anuluj” zostawia; ostatniego dnia nie można usunąć.',
  'help.guide.manage-days.step.4':
    'Aby zmienić nazwę dnia, otwórz go i kliknij ołówek obok tytułu w panelu szczegółów nad mapą. Nazwa zastąpi „Dzień 1” na karcie i w pliku PDF.',
  'help.guide.manage-days.step.5':
    '„Rozwiń wszystkie dni” i „Zwiń wszystkie dni” w nagłówku rozwijają lub zwijają wszystkie karty naraz. Aby zwinąć jedną kartę, kliknij jej strzałkę.',
  'help.guide.manage-days.result':
    'Daty zostają przy swojej pozycji: gdy przesuniesz dzień w górę, dostaje wcześniejszą datę, a jego przystanki, notatki i rezerwacje przesuwają się razem z nim.',
  'help.guide.manage-days.tip.1': 'Przeniesienie dni można cofnąć strzałką cofania, usunięcia dnia już nie.',
  'help.guide.manage-days.tip.2': 'Łączny koszt na dole planu sumuje całą podróż, a karta Koszty pokazuje podział.',
  // bookings-in-plan
  'help.guide.bookings-in-plan.title': 'Rezerwacje i transport w planie',
  'help.guide.bookings-in-plan.goal':
    'Sprawdź, gdzie pojawia się utworzona rezerwacja i na którym ekranie się ją tworzy.',
  'help.guide.bookings-in-plan.step.1':
    'Transport (lot, pociąg, prom, autobus, samochód) to wiersz w kolorze zależnym od typu, z godziną oraz oznaczeniem Wylot w dniu odjazdu lub Przylot w dniu przybycia. Glob obok podaje strefę czasową, a lot z przesiadką ma po jednym wierszu na odcinek. Przy połączeniu transportem publicznym kliknij strzałkę, aby zobaczyć jego linie. Kliknij wiersz, a otworzy się rezerwacja, w której Edytuj pozwala ją zmienić.',
  'help.guide.bookings-in-plan.step.2':
    'Rezerwacja powiązana z przystankiem (restauracja, wycieczka) jest widoczna przy nim jako plakietka „Rezerwacja” z godziną. Plakietka jest zielona po potwierdzeniu i bursztynowa, dopóki rezerwacja oczekuje. Rezerwacja przypisana do dnia, ale nie do przystanku, ma w tym dniu własny wiersz.',
  'help.guide.bookings-in-plan.step.3':
    'Noc w hotelu to nocleg: jego pigułka w nagłówku dnia jest zielona w dniu zameldowania i czerwona w dniu wymeldowania, a ikona biletu otwiera rezerwację. Panel szczegółów dnia pokazuje go w sekcji „Nocleg”, a trasa każdego z tych dni zaczyna się właśnie tam.',
  'help.guide.bookings-in-plan.step.4':
    'Przycisk trasy w wierszu rezerwacji rysuje jej trasę na mapie; „Pokaż wszystkie trasy rezerwacji” w nagłówku rysuje wszystkie.',
  'help.guide.bookings-in-plan.step.5':
    'Tworzenie: „Dodaj rezerwację” po najechaniu na przystanek, „Dodaj transport” i „Transport publiczny” w menu + dnia oraz karty „Rezerwacje” i „Transport” z pełną listą, importem i plikami.',
  'help.guide.bookings-in-plan.result':
    'Każda rezerwacja pojawia się w planie raz. Zakładki pokazują te same rezerwacje w formie listy.',
  'help.guide.bookings-in-plan.tip.1':
    '„Potwierdzono” i „Oczekujące” to status, który ustawiasz w rezerwacji; plan pokazuje go przy przystanku, a karta „Rezerwacje” liczy oba.',
  'help.guide.bookings-in-plan.tip.2':
    'Jeśli upuścisz rezerwację z godziną gdzie indziej w tym samym dniu, wróci w miejsce wynikające z jej godziny. Jeśli przeciągniesz ją na kartę innego dnia, przeniesie się do tego dnia. Aby zmienić godzinę, edytuj rezerwację.',
  // export-plan
  'help.guide.export-plan.title': 'Eksportowanie planu',
  'help.guide.export-plan.goal': 'Wyeksportuj plan jako dokument, do kalendarza lub na urządzenie GPS.',
  'help.guide.export-plan.step.1': 'Kliknij „Eksportuj” po lewej stronie paska nad dniami.',
  'help.guide.export-plan.step.2':
    'Dokument: PDF otwiera widok wydruku każdego dnia z przystankami, notatkami i rezerwacjami, zaczynając od mapy z przeglądem trasy. Mój plan jako PDF zostawia tylko to, w czym bierzesz udział. W tym widoku Podział strony dla każdego dnia zaczyna każdy dzień na nowej stronie, Notatki do transportu dodaje notatki do Twoich transportów, a Zapisz jako PDF pobiera plik.',
  'help.guide.export-plan.step.3':
    'Kalendarz: Pobierz .ics zapisuje rezerwacje jako plik kalendarza, a Subskrybuj kalendarz daje link, który Twoja aplikacja kalendarza odświeża automatycznie.',
  'help.guide.export-plan.step.4':
    'Mapy i GPS (GPX): Cała podróż eksportuje miejsca, trasy dni i ślady. Tylko miejsca eksportuje same pinezki. Dni jako trasy eksportuje po jednej trasie na dzień, do map offline i urządzeń GPS.',
  'help.guide.export-plan.result': 'Plik zostanie pobrany; w podróży nic się nie zmieni.',
  'help.guide.export-plan.tip.1':
    'Aby otworzyć pojedynczy dzień w aplikacji z mapami, użyj jego paska trasy: „Otwórz w Google Maps” albo „Otwórz w CoMaps”.',
  'help.guide.export-plan.tip.2':
    '„Subskrybuj kalendarz” wymaga włączonych w ustawieniach kanałów kalendarza i prawa do udostępniania podróży; w „Panelu” jest o tym osobny przewodnik.',
  'help.guide.export-plan.tip.3':
    'Do eksportu wystarczy dostęp do odczytu: każdy uczestnik podróży może wyeksportować PDF, plik .ics i GPX.',

  // ── Screen: trip-place ────────────────────────────────────────────────────────────────
  'help.ctx.trip-place.title': 'Szczegóły miejsca',
  'help.ctx.trip-place.summary':
    'Karta, która otwiera się nad mapą po wybraniu miejsca: wszystko, co podróż o nim wie, oceny wystawione przez uczestników, zdjęcie i pliki oraz przyciski do dodania miejsca do otwartego dnia, otwarcia w aplikacji z mapami lub zapisania na liście.',
  'help.ctx.trip-place.bullet.1':
    'Kliknij wiersz w kolumnie miejsc, przystanek w dniu lub znacznik na mapie, a nad mapą otworzy się karta. Jeśli otworzysz ją z dnia, karta wie, o który przystanek chodzi, i pokazuje też jego uczestników oraz rezerwację. Wycieczka (wędrówka, przejażdżka lub spacer z zakładki „Wycieczki”) otwiera zamiast tego własną kartę wycieczki.',
  'help.ctx.trip-place.bullet.2':
    'W nagłówku jest okrągłe zdjęcie, nazwa, adres w jednym wierszu i etykiety ze znanymi informacjami: otwarte lub zamknięte, kategoria, godzina, cena, numer telefonu, e-mail i współrzędne. Kliknij zdjęcie, aby użyć własnego lub zdjęcia z plików miejsca. Kliknij dwukrotnie nazwę, aby ją zmienić. Krzyżyk po prawej zamyka kartę. Zmiana zdjęcia i nazwy, „Edytuj” oraz „Usuń” są dostępne tylko dla uczestników, którzy mogą edytować miejsca.',
  'help.ctx.trip-place.bullet.3':
    'Poniżej: gwiazdki od każdego podróżnego, opis i notatki, a także „Notatki na ten dzień”, jeśli przystanek je ma.',
  'help.ctx.trip-place.bullet.4':
    'Dalej, o ile mają zastosowanie, są Godziny otwarcia, Kolor trasy, Statystyki trasy i Pliki. Prześlij w nagłówku Pliki dodaje pliki z komputera, a lista pokazuje też pliki przypięte do tego przystanku i do jego rezerwacji, także potwierdzenie hotelu. Wtyczki mogą dodać poniżej własne wiersze.',
  'help.ctx.trip-place.bullet.5':
    'Dolny rząd: Dodaj do dnia lub Usuń z dnia, gdy dzień jest otwarty, potem Nawigacja (albo nazwa Twojej aplikacji z mapami, gdy wybierzesz ją w Ustawieniach), Otwórz stronę internetową i Zapisz w kolekcji. Po prawej czerwony kosz usuwa miejsce, a Edytuj otwiera jego formularz.',
  'help.ctx.trip-place.bullet.6':
    'Przy miejscu wybranym z wyszukiwania widać, co wiedzą o nim indeks TREK lub OpenStreetMap: „Otwarte” lub „Zamknięta” wśród pigułek u góry, z zieloną lub czerwoną obwódką wokół zdjęcia, według czasu lokalnego miejsca; numer telefonu, również jako pigułka; niżej „Godziny otwarcia” z dzisiejszymi godzinami w wierszu i całym tygodniem po kliknięciu; oraz stronę internetową pod „Otwórz stronę internetową”. Ocena Google jest widoczna tylko przy miejscu znalezionym przez Google, w TREK z kluczem Google. Godziny otwarcia, numer telefonu i e-mail wpisane przez ciebie w formularzu miejsca zastępują pobrane dane i decydują też o kolorze obwódki.',
  // read-place
  'help.guide.read-place.title': 'Co mówi Ci karta miejsca',
  'help.guide.read-place.goal': 'Zobacz na jednej karcie wszystko, co podróż wie o danym miejscu.',
  'help.guide.read-place.step.1':
    'W kolumnie dni kliknij przystanek, o którym chcesz się czegoś dowiedzieć. Nad mapą otworzy się karta, a przystanek pozostanie zaznaczony w swoim dniu.',
  'help.guide.read-place.step.2':
    'U góry: okrągłe zdjęcie, nazwa i adres w jednym wierszu; podpowiedź pokazuje pełny adres. Pigułki pod spodem informują, czy miejsce jest teraz „Otwarte” czy „Zamknięta”, według czasu lokalnego miejsca, a zdjęcie ma odpowiednio zieloną lub czerwoną obwódkę. Pokazują też kategorię, godzinę, numer telefonu i e-mail (kliknij, żeby otworzyć aplikację telefonu lub poczty), a na szerokim ekranie także dokładne współrzędne. X po prawej zamyka kartę.',
  'help.guide.read-place.step.3':
    'Ocena to pierwsza sekcja pod nagłówkiem: gwiazdki, które miejscu przyznał każdy uczestnik, ze średnią i liczbą głosów. Dopóki nikt nie zagłosował, widać Jeszcze nie oceniono.',
  'help.guide.read-place.step.4':
    'Dalej jest opis, a pod nim notatki. Oba pochodzą z formularza miejsca i zachowują formatowanie: działają listy, linki i pogrubienie.',
  'help.guide.read-place.step.5':
    '„Uczestnicy” pokazuje, kto wybiera się na ten przystanek. Uwzględnieni są wszyscy, dopóki kogoś nie usuniesz.',
  'help.guide.read-place.step.6':
    'Niżej są „Godziny otwarcia”: wiersz pokazuje godziny w oglądanym dniu. Kliknij go, aby zobaczyć cały tydzień z tym dniem wyróżnionym pogrubieniem. Obok są „Pliki”.',
  'help.guide.read-place.result':
    'Karta pozostaje otwarta, dopóki nie zamkniesz jej krzyżykiem lub nie wybierzesz innego miejsca. Godziny otwarcia na cały tydzień pozostają rozwinięte, a przystanek, do którego należy karta, pozostaje zaznaczony w kolumnie dni.',
  'help.guide.read-place.tip.1':
    'Gdy wybierzesz miejsce w kolumnie miejsc, karta pokazuje samo miejsce, a nie przystanek. Nie ma więc na niej uczestników, a widać tylko rezerwacje należące do samego miejsca, np. pobyt w hotelu. Żeby zobaczyć wszystko, wybierz przystanek w dniu.',
  'help.guide.read-place.tip.2':
    'Jeśli możesz edytować miejsca, kliknij dwukrotnie nazwę, aby zmienić ją bez otwierania formularza. Enter zapisuje zmianę, a Escape ją anuluje.',
  'help.guide.read-place.tip.3':
    'Miejsce wpisane ręcznie ma tylko dane podane w jego formularzu. Kliknij „Edytuj” i sam uzupełnij „Telefon”, „E-mail” i godziny otwarcia albo wybierz miejsce z podpowiedzi pod „Szukaj miejsc…” i kliknij „Aktualizuj”, aby wyszukać te dane. Ocena Google wymaga klucza Google.',
  // rate-place
  'help.guide.rate-place.title': 'Ocenianie miejsca',
  'help.guide.rate-place.goal': 'Oceń miejsce w gwiazdkach i zobacz, jak ocenili je inni.',
  'help.guide.rate-place.step.1':
    'Otwórz miejsce. Rząd gwiazdek jest tuż pod nagłówkiem i pokazuje średnią dotychczasowych głosów, a w nawiasie liczbę głosów.',
  'help.guide.rate-place.step.2':
    'Kliknij wybraną gwiazdkę. Gwiazdki wypełniają się, gdy najeżdżasz na nie kursorem, więc od razu widzisz, jaką ocenę wystawisz.',
  'help.guide.rate-place.step.3':
    'Twój głos od razu wlicza się do średniej, a twarze obok pokazują, kto głosował. Najedź na wiersz, aby zobaczyć gwiazdki wszystkich.',
  'help.guide.rate-place.step.4':
    'Ta sama średnia jest widoczna w wierszu miejsca w kolumnie miejsc, więc łatwo znajdziesz najlepsze miejsca na liście.',
  'help.guide.rate-place.result':
    'Wszyscy uczestnicy podróży widzą Twoje gwiazdki przy miejscu. Gwiazdka w wierszu filtrów nad listą pozwala teraz pokazać tylko miejsca z co najmniej określoną oceną.',
  'help.guide.rate-place.tip.1':
    'Oceniać może każdy uczestnik, nawet w podróży, w której tylko część osób może zmieniać miejsca.',
  'help.guide.rate-place.tip.2':
    'Kliknij gwiazdkę, którą już przyznałeś, aby usunąć swoją ocenę. Gdy nikt nie ocenił miejsca, znów widać „Jeszcze nie oceniono”.',
  'help.guide.rate-place.tip.3':
    'Obok gwiazdek widać twarze maksymalnie sześciu głosujących. Podpowiedź wymienia wszystkich i zaznacza Ciebie.',
  // place-image
  'help.guide.place-image.title': 'Dodaj własne zdjęcie miejsca',
  'help.guide.place-image.goal': 'Zastąp automatyczną miniaturę własnym zdjęciem.',
  'help.guide.place-image.step.1': 'Otwórz miejsce z kolumny miejsc.',
  'help.guide.place-image.step.2':
    'Najedź na okrągłe zdjęcie w nagłówku: pojawi się aparat, a podpowiedź brzmi Prześlij zdjęcie. Kliknij go i wybierz plik. Jeśli miejsce ma już zdjęcia wśród swoich plików, TREK najpierw zapyta, co wybrać: Prześlij z urządzenia albo jedno ze zdjęć w sekcji Z załączonych plików.',
  'help.guide.place-image.step.3': 'U góry karty widać teraz Twoje zdjęcie z małym czerwonym X w rogu.',
  'help.guide.place-image.step.4':
    'To samo zdjęcie pojawia się też w wierszu miejsca w kolumnie miejsc i na jego znaczniku na mapie.',
  'help.guide.place-image.result':
    'Twoje zdjęcie jest używane dla miejsca wszędzie: na karcie, w kolumnie miejsc, przy przystanku w dniu, na znaczniku na mapie i w udostępnionej podróży.',
  'help.guide.place-image.tip.1':
    "Akceptowane są pliki JPG, PNG, GIF i WebP, a plik HEIC z iPhone'a jest konwertowany podczas przesyłania.",
  'help.guide.place-image.tip.2':
    'Krzyżyk w rogu usuwa Twoje zdjęcie i przywraca automatyczne. Samo miejsce się nie zmienia.',
  'help.guide.place-image.tip.3':
    'Jeśli nie dodasz zdjęcia, TREK wyszuka je na podstawie współrzędnych miejsca. Gdy nic nie znajdzie, pokaże ikonę kategorii. Zdjęcie mogą ustawić tylko uczestnicy, którzy mogą zmieniać miejsca.',
  // place-day-assign
  'help.guide.place-day-assign.title': 'Dodaj miejsce do otwartego dnia lub je z niego usuń',
  'help.guide.place-day-assign.goal': 'Użyj przycisku na karcie zamiast przeciągać wiersz przez planer.',
  'help.guide.place-day-assign.step.1':
    'Kliknij nagłówek dnia w kolumnie dni. Ten dzień staje się otwartym dniem i karta dotyczy właśnie jego.',
  'help.guide.place-day-assign.step.2':
    'W kolumnie miejsc kliknij miejsce, którego nie ma w tym dniu. Otworzy się jego karta, a w dolnym wierszu pojawi się „Dodaj do dnia”.',
  'help.guide.place-day-assign.step.3':
    'Kliknij „Dodaj do dnia”. Przystanek zostanie dodany na końcu dnia, a przycisk zmieni się na „Usuń z dnia”.',
  'help.guide.place-day-assign.step.4':
    'Przystanek jest teraz w dniu, na końcu listy. Przeciągnij go w górę, na właściwe miejsce.',
  'help.guide.place-day-assign.step.5':
    '„Usuń z dnia” znów usuwa przystanek z dnia, a na karcie ponownie pojawia się „Dodaj do dnia”.',
  'help.guide.place-day-assign.result':
    'Przystanek zostaje dodany do dnia lub z niego usunięty. Samo miejsce się nie zmienia.',
  'help.guide.place-day-assign.tip.1':
    'Przycisk jest dostępny tylko wtedy, gdy dzień jest otwarty. Bez otwartego dnia nie ma dnia, do którego można dodać miejsce.',
  'help.guide.place-day-assign.tip.2':
    'Gdy usuniesz przystanek z dnia, miejsce zostaje w podróży i w kolumnie miejsc. Opcja „Usuń” usuwa je wszędzie.',
  'help.guide.place-day-assign.tip.3':
    'Przystanek dodany do dnia przez rezerwację noclegu nie ma żadnego z tych przycisków. Taki nocleg dodajesz i usuwasz w bloku noclegów danego dnia.',
  // place-participants
  'help.guide.place-participants.title': 'Kto idzie na ten przystanek',
  'help.guide.place-participants.goal': 'Wybierz, kto idzie na jeden przystanek, bez zmieniania składu całej podróży.',
  'help.guide.place-participants.step.1':
    'Kliknij przystanek w dniu. Otworzy się karta, a w sekcji „Uczestnicy” zobaczysz wszystkich uczestników podróży.',
  'help.guide.place-participants.step.2':
    'Kliknij chip podróżnego, aby usunąć go z tego przystanku. Gdy najedziesz na chip, imię zostanie przekreślone.',
  'help.guide.place-participants.step.3':
    'Gdy tylko kogoś brakuje, pojawia się przerywany znak +. Kliknij go, aby zobaczyć, kogo nie ma na przystanku.',
  'help.guide.place-participants.step.4':
    'Kliknij imię, aby ponownie dodać tę osobę. Gdy wszyscy zostaną dodani z powrotem, przystanek znów należy do całej grupy.',
  'help.guide.place-participants.result':
    'Przy przystanku widać tylko wybranych uczestników. Reszta grupy ma w tym czasie wolne.',
  'help.guide.place-participants.tip.1':
    'Sekcja „Uczestnicy” pojawia się tylko wtedy, gdy wybrany jest przystanek, więc wybierz miejsce w dniu, a nie w kolumnie miejsc. Jest też widoczna tylko w podróży z więcej niż jednym uczestnikiem.',
  'help.guide.place-participants.tip.2':
    'Jeśli nikt nie jest wybrany, idą wszyscy. Dlatego nie można usunąć z przystanku ostatniego uczestnika.',
  'help.guide.place-participants.tip.3': 'Gość, który nie ma własnego konta, może być uczestnikiem tak jak każdy inny.',
  // place-booking
  'help.guide.place-booking.title': 'Rezerwacja przy przystanku',
  'help.guide.place-booking.goal': 'Zobacz rezerwację powiązaną z przystankiem, otwórz ją i powiąż z nim nową.',
  'help.guide.place-booking.step.1':
    'Otwórz przystanek, do którego należy rezerwacja. Karta pokazuje ją w sekcji „Rezerwacje” jako osobną małą kartę z nazwą rezerwacji i statusem „Potwierdzono” lub „Oczekujące”.',
  'help.guide.place-booking.step.2':
    'Karta rezerwacji pokazuje datę, godzinę i „Kod rezerwacji”, etykiety z innymi danymi rezerwacji (numer lotu, peron, zameldowanie) oraz ewentualne notatki.',
  'help.guide.place-booking.step.3': 'Kliknij kartę rezerwacji. Rezerwacja otworzy się nad mapą.',
  'help.guide.place-booking.step.4':
    'Przycisk „Edytuj” na dole rezerwacji otwiera jej własny formularz. W tym formularzu pole „Przypisz do miejsca” łączy rezerwację z przystankiem i już wskazuje ten przystanek. Zamknij formularz.',
  'help.guide.place-booking.step.5':
    'Nową rezerwację dla przystanku zaczynasz w kolumnie dni: najedź na przystanek i kliknij Dodaj rezerwację, czyli ikonę biletu na jego końcu. Formularz otworzy się jako Nowa rezerwacja, już powiązany z przystankiem.',
  'help.guide.place-booking.result':
    'Rezerwacja jest powiązana z przystankiem: widać ją na karcie i w dniu, a jej pliki są też wymienione tutaj, w sekcji „Pliki”.',
  'help.guide.place-booking.tip.1':
    'Rezerwacja jest widoczna przy przystanku, do którego jest przypięta, a rezerwację hotelu widać także przy hotelu, gdziekolwiek go otworzysz. Rezerwacja bez przystanku jest na karcie Rezerwacje.',
  'help.guide.place-booking.tip.2':
    'Kilka rezerwacji może dotyczyć jednego przystanku, na przykład obiad i wycieczka, które zaczynają się w tym samym miejscu.',
  'help.guide.place-booking.tip.3':
    'Przy pociągu, locie lub promie Edytuj otwiera zamiast tego formularz transportu, ten sam, którego używa karta Transport.',
  // place-files
  'help.guide.place-files.title': 'Przechowuj bilety razem z miejscem',
  'help.guide.place-files.goal': 'Dołącz bilet, voucher lub mapę do miejsca, którego dotyczą.',
  'help.guide.place-files.step.1':
    'Otwórz miejsce. Sekcja „Pliki” jest pod jego szczegółami, obok „Godzin otwarcia”, jeśli miejsce je ma; dopóki miejsce nie ma plików, widnieje tam napis „Pliki”.',
  'help.guide.place-files.step.2': 'Kliknij „Prześlij” po prawej stronie nagłówka „Pliki” i wybierz plik.',
  'help.guide.place-files.step.3': 'Przycisk pokazuje, ile plików ma miejsce, a lista otwiera się automatycznie.',
  'help.guide.place-files.step.4': 'W każdym wierszu widać nazwę i rozmiar pliku. Kliknij wiersz, aby otworzyć plik.',
  'help.guide.place-files.result':
    'Plik jest dołączony do miejsca i policzony na karcie. Widać go też w zakładce Pliki podróży.',
  'help.guide.place-files.tip.1':
    '„Pliki” pokazują też to, co jest przypięte do tego przystanku i załączone do jego rezerwacji, więc potwierdzenie z hotelu widać przy hotelu.',
  'help.guide.place-files.tip.2':
    '„Prześlij” przyjmuje kilka plików naraz, a jedno z przesłanych zdjęć może stać się obrazem miejsca.',
  'help.guide.place-files.tip.3':
    'Jeśli nie masz uprawnień do przesyłania plików, przycisk „Prześlij” się nie pojawia; pliki dodane już do miejsca nadal są widoczne.',
  // place-navigation
  'help.guide.place-navigation.title': 'Otwórz miejsce w aplikacji z mapami lub na jego stronie',
  'help.guide.place-navigation.goal': 'Otwórz miejsce w aplikacji do nawigacji, której używasz, aby tam dotrzeć.',
  'help.guide.place-navigation.step.1': 'Otwórz miejsce i kliknij „Nawigacja” w dolnym wierszu.',
  'help.guide.place-navigation.step.2':
    'Na liście są aplikacje z mapami odpowiednie dla tego miejsca: Google Maps, Waze, Apple Maps, OpenStreetMap i CoMaps, a na Androidzie także „Inna aplikacja z mapami”.',
  'help.guide.place-navigation.step.3':
    'Kliknij aplikację, której używasz. Jeśli to możliwe, TREK przekazuje do aplikacji samo miejsce, a nie tylko jego współrzędne, więc trafisz pod właściwe wejście.',
  'help.guide.place-navigation.step.4':
    '„Otwórz stronę internetową” obok otwiera w nowej karcie stronę miejsca z godzinami otwarcia i biletami.',
  'help.guide.place-navigation.result':
    'Aplikacja z mapami otwiera się na tym miejscu, strona internetowa w nowej karcie, a w podróży nic się nie zmienia. Jeśli TREK jest zainstalowany jako aplikacja, zamiast nowej karty otworzy się aplikacja z mapami.',
  'help.guide.place-navigation.tip.1':
    'Waze od razu zaczyna nawigację. Pozostałe aplikacje otwierają miejsce, a aby zacząć nawigację, trzeba jeszcze raz stuknąć.',
  'help.guide.place-navigation.tip.2':
    'To, które aplikacje są dostępne, zależy od miejsca i urządzenia. Apple Maps nie ma na Androidzie, 高德地图 jest tylko dla miejsc w Chinach, a Waze, Apple Maps i CoMaps potrzebują współrzędnych miejsca. Inna aplikacja z mapami otwiera miejsce w dowolnej aplikacji z mapami na telefonie z Androidem.',
  'help.guide.place-navigation.tip.3':
    'Wybierz swoją aplikację z mapami raz, w Ustawieniach, w sekcji Otwieraj miejsca w. Przycisk pokaże wtedy jej nazwę i od razu ją otworzy. To samo dzieje się, gdy do miejsca pasuje tylko jedna aplikacja.',
  // place-to-collection
  'help.guide.place-to-collection.title': 'Zapisz miejsce na jednej ze swoich list',
  'help.guide.place-to-collection.goal': 'Zapisz miejsce znalezione w tej podróży na następną.',
  'help.guide.place-to-collection.step.1': 'Otwórz miejsce i kliknij „Zapisz w kolekcji” w dolnym wierszu karty.',
  'help.guide.place-to-collection.step.2':
    '„Zapisz na liście” pokazuje wszystkie twoje i udostępnione ci listy. Wypełniona zakładka po prawej oznacza listy, które już zawierają to miejsce.',
  'help.guide.place-to-collection.step.3': 'Kliknij listę. Miejsce zostanie do niej od razu dodane.',
  'help.guide.place-to-collection.step.4': 'Zamknij okno przyciskiem X, a przycisk na karcie zmieni się na „Zapisano”.',
  'help.guide.place-to-collection.result':
    'Miejsce jest na Twojej liście razem ze zdjęciem, notatkami i adresem, gotowe na następną podróż.',
  'help.guide.place-to-collection.tip.1':
    'Przycisk jest widoczny tylko wtedy, gdy włączony jest dodatek „Kolekcje”, który administrator włącza w „Dodatkach”.',
  'help.guide.place-to-collection.tip.2':
    'Miejsce może być jednocześnie na kilku listach, na każdej z innym statusem: na jednej jako pomysł, na innej jako odwiedzone.',
  'help.guide.place-to-collection.tip.3':
    '„Oznacz jako odwiedzone” pod nazwą miejsca u góry okna wyboru oznacza miejsce na liście jako odwiedzone. Jeśli miejsce jest na kilku twoich listach, przycisk ma napis „Odwiedzone wszędzie” i oznacza je na wszystkich naraz. „Widok” otwiera twoje listy w „Kolekcjach”.',
  // place-track
  'help.guide.place-track.title': 'Odczytaj ślad i nadaj mu własny kolor',
  'help.guide.place-track.goal':
    'Sprawdź długość zaimportowanego spaceru i zobacz, która linia na mapie to właśnie on.',
  'help.guide.place-track.step.1':
    'Wiersz śladu w kolumnie miejsc ma krótką kreskę w kolorze, w jakim ślad jest widoczny na mapie. Kliknij go.',
  'help.guide.place-track.step.2': '„Statystyki trasy” podają długość ścieżki w ustawionych przez Ciebie jednostkach.',
  'help.guide.place-track.step.3':
    'Pozycja „Kolor trasy” nad nim pokazuje używany kolor. Kliknij ten wiersz, aby otworzyć próbki kolorów.',
  'help.guide.place-track.step.4': 'Wybierz kolor. Linia na mapie i pasek w wierszu zmienią się razem z nim.',
  'help.guide.place-track.step.5':
    'Przerywane pole po lewej, „Kolor automatyczny”, przywraca śladowi domyślny kolor. Pipeta po prawej otwiera systemowy próbnik kolorów, w którym wybierzesz dowolny inny kolor.',
  'help.guide.place-track.result':
    'Ślad jest rysowany w wybranym kolorze, na karcie, w swoim wierszu w kolumnie miejsc i na mapie.',
  'help.guide.place-track.tip.1':
    'Te dwa bloki ma tylko miejsce ze ścieżką: zaimportowane z pliku GPX, KML lub KMZ, zanim pojawiły się „Wycieczki”, albo w instancji TREK z wyłączonymi „Wycieczkami”. Gdy „Wycieczki” są włączone, nowy plik GPX staje się wycieczką z własną kartą.',
  'help.guide.place-track.tip.2':
    'Ślad nagrany z wysokością pokazuje też najwyższy i najniższy punkt, sumę podejść i zejść w metrach oraz profil spaceru.',
  'help.guide.place-track.tip.3':
    'Każdy ślad dodany podczas importu dostaje własny kolor, więc dwa spacery nigdy nie mają tego samego koloru.',
  // read-place
  'help.guide.read-place.step.7':
    'Dolny wiersz zawiera dostępne działania: dodanie miejsca do otwartego dnia lub usunięcie z niego, otwarcie go w aplikacji z mapami lub na jego stronie, zapisanie na liście, a po prawej usunięcie (czerwony kosz) lub edycję.',

  // ── Screen: trip-files ────────────────────────────────────────────────────────────────
  'help.ctx.trip-files.title': 'Pliki',
  'help.ctx.trip-files.summary':
    'Wszystkie dokumenty podróży na jednej liście: bilety, potwierdzenia, karty pokładowe i zdjęcia. Każdy ma notatkę, powiązanie z miejscem lub rezerwacją, do której należy, oraz kosz, z którego można go przywrócić.',
  'help.ctx.trip-files.bullet.1':
    '„Przeciągnij pliki tutaj”, czyli pole z przerywaną ramką pod paskiem, przyjmuje upuszczone pliki. Kliknięcie go otwiera wybór plików. W polu widać typy plików akceptowane przez ten TREK i limit na plik (maks. 50 MB, chyba że administrator ustawił inny).',
  'help.ctx.trip-files.bullet.2':
    'Na pasku u góry są „Pliki” i zakładki filtrów „Wszystkie”, „PDF”, „Obrazki” i „Dokumenty”, każda z liczbą plików. Gdy oznaczysz plik gwiazdką, za „Wszystkie” pojawia się zakładka z gwiazdką, a gdy notatka ma załącznik, na końcu pojawia się zakładka „Wspólne notatki”.',
  'help.ctx.trip-files.bullet.3':
    'W wierszu widać miniaturę lub typ pliku, osobę, która go przesłała, nazwę, notatkę pod nią, rozmiar i datę oraz po jednej plakietce na każde powiązanie: miejsce, rezerwację lub transport z nazwą (po najechaniu widać „Plan dni”, „Rezerwacje” lub „Transport”) oraz „Z wspólnych notatek”.',
  'help.ctx.trip-files.bullet.4':
    'Na końcu wiersza jest do pięciu ikon, każda z podpowiedzią po najechaniu: Oznacz, Przypisz (ołówek), Otwórz, Pobierz i Usuń. Usuń nie pyta o potwierdzenie: plik trafia do kosza, skąd możesz go przywrócić. Offline nadal działają notatka, link, gwiazdka i kosz, a zmiany wysyłają się, gdy TREK znów jest online. Połączenia wymaga tylko przesyłanie i usuwanie kolejnego linku.',
  'help.ctx.trip-files.bullet.5':
    'Zdjęcie lub film otwiera się na pełnym ekranie, z obsługą klawiszy strzałek i rzędem miniatur. Każdy inny dokument otwiera się w oknie z nazwą u góry i przyciskami „Otwórz w nowej karcie” i „Pobierz” pod nią. Karta do portfela jest od razu pobierana.',
  'help.ctx.trip-files.bullet.6':
    'Ikona kosza na prawym końcu paska (Kosz) przełącza listę na usunięte pliki. Możesz tam przywrócić każdy z nich albo usunąć go na stałe, a Opróżnij kosz na pasku usuwa wszystkie. Synchronizacja dokumentów jest na lewo od ikony kosza, gdy podróż jest połączona z magazynem dokumentów, a dla właściciela podróży lub administratora od chwili włączenia jakiegokolwiek magazynu.',
  // files-upload
  'help.guide.files-upload.title': 'Dodaj dokument do podróży',
  'help.guide.files-upload.goal':
    'Prześlij do podróży bilet, potwierdzenie lub zdjęcie z folderu pobranych plików, aby każdy uczestnik podróży mógł je otworzyć.',
  'help.guide.files-upload.step.1':
    'Otwórz podróż i kliknij „Pliki” na pasku zakładek. Znajdziesz tam dokumenty podróży, a nad nimi pole do przesyłania.',
  'help.guide.files-upload.step.2':
    'Kliknij Przeciągnij pliki tutaj i wybierz jeden plik lub kilka. Przesyłają się jeden po drugim, a pole pokazuje Przesyłanie..., dopóki trwa przesyłanie. W polu, pod lub kliknij, aby przeglądać, widać typy plików, które przyjmuje ten TREK, i maksymalny rozmiar pliku.',
  'help.guide.files-upload.step.3':
    'Gdy ostatni plik zostanie przesłany, automatycznie otwiera się dla niego okno „Przypisz plik” (jeśli podróż ma jakieś miejsca lub rezerwacje), z nazwą pliku u góry. Pole „Dodaj notatkę...” w sekcji „Notatka” dodaje do pliku notatkę, a listy pod spodem łączą go z miejscem lub rezerwacją. Zamknij okno przyciskiem × w prawym górnym rogu; zamknięcie niczego nie usuwa.',
  'help.guide.files-upload.step.4':
    'Nowe pliki pojawiają się na górze listy; wyżej są tylko pliki oznaczone gwiazdką. W wierszu widać, kto przesłał plik, a także nazwę, rozmiar i datę. Obrazy mają miniaturę, a pozostałe pliki pokazują swój typ.',
  'help.guide.files-upload.result': 'Dokumenty są w podróży, a każdy, kto widzi podróż, może je otworzyć i pobrać.',
  'help.guide.files-upload.tip.1':
    'Możesz też przeciągnąć plik z pulpitu prosto na pole. Gdy plik jest nad nim, pole jest podświetlone.',
  'help.guide.files-upload.tip.2':
    'Naciśnij Ctrl+V, aby dodać do listy obraz ze schowka; nie musisz najpierw zapisywać zrzutu ekranu z rezerwacją.',
  'help.guide.files-upload.tip.3':
    'Przesyłanie wymaga uprawnienia do przesyłania plików; bez niego pola w ogóle nie ma. Plik typu spoza listy jest odrzucany z komunikatem i nic nie zostaje przesłane. Plik większy niż limit (50 MB, chyba że administrator ustawił inny) jest odrzucany, zanim cokolwiek zostanie wysłane, a komunikat podaje limit. Przesyłanie wymaga też połączenia z internetem: offline TREK o tym informuje i niczego nie przesyła.',
  // files-link
  'help.guide.files-link.title': 'Powiąż dokument z miejscem lub rezerwacją',
  'help.guide.files-link.goal':
    'Spraw, żeby bilet dało się łatwo znaleźć w dniu, do którego należy, a nie tylko na tej liście.',
  'help.guide.files-link.step.1':
    'Kliknij ołówek na końcu wiersza („Przypisz”). Otworzy się okno „Przypisz plik” z nazwą pliku u góry.',
  'help.guide.files-link.step.2':
    'W sekcji „Notatka” pole „Dodaj notatkę...” przyjmuje jeden wiersz, który potem widać pod nazwą pliku na liście. Notatka zapisuje się po naciśnięciu Enter lub opuszczeniu pola.',
  'help.guide.files-link.step.3':
    'W sekcji „Miejsce” po lewej widać miejsca podróży, pogrupowane według dni z datami, a na końcu „Nieprzypisane” dla miejsc, które nie są w żadnym dniu. Kliknij miejsce, aby je zaznaczyć.',
  'help.guide.files-link.step.4':
    'Pod Rezerwacja i Transport, po prawej, są rezerwacje podróży. Kliknij tę, do której należy dokument. Ona również dostanie ptaszek.',
  'help.guide.files-link.step.5':
    'Zamknij okno krzyżykiem × w prawym górnym rogu. Nie ma tu przycisku zapisu: każde kliknięcie zostało zapisane od razu.',
  'help.guide.files-link.result':
    'Wiersz pokazuje notatkę i po jednej plakietce na każde powiązanie: jedną z nazwą miejsca i jedną z nazwą lotu. Po najechaniu na plakietkę widać „Plan dni” lub „Transport”. Dokument jest też dołączony do miejsca i do lotu.',
  'help.guide.files-link.tip.1':
    'Plik może mieć kilka powiązań jednocześnie, więc to samo potwierdzenie może należeć zarówno do rezerwacji hotelu, jak i do miejsca hotelu.',
  'help.guide.files-link.tip.2':
    'Kliknij ponownie zaznaczony wpis, żeby usunąć to powiązanie; sam plik zostaje. Offline notatka i nowe zaznaczenia są zapisywane i wysyłane, gdy TREK znów będzie online; połączenia wymaga tylko usunięcie innego powiązania.',
  'help.guide.files-link.tip.3':
    'Działa to też w drugą stronę: dokument dołączony do miejsca lub rezerwacji również jest na tej liście, z taką samą plakietką w wierszu.',
  // files-star
  'help.guide.files-star.title': 'Ważne dokumenty zawsze na górze',
  'help.guide.files-star.goal':
    'Oznacz kilka dokumentów, których naprawdę będziesz potrzebować, aby szybko je znaleźć na długiej liście.',
  'help.guide.files-star.step.1':
    'Kliknij gwiazdkę na końcu wiersza (Oznacz). Zmieni kolor na złoty, przed nazwą pliku pojawi się druga gwiazdka, a po najechaniu na przycisk zobaczysz teraz Usuń oznaczenie.',
  'help.guide.files-star.step.2':
    'Lista sortuje się na nowo: oznaczone pliki są nad wszystkimi pozostałymi, a w każdej grupie najnowsze są na górze.',
  'help.guide.files-star.step.3':
    'W zakładkach filtrów na pasku, zaraz po „Wszystkie”, pojawia się gwiazdka z liczbą oznaczonych plików. Kliknij ją, aby zobaczyć tylko te pliki.',
  'help.guide.files-star.result': 'Oznaczone pliki są wyświetlane na górze listy, a jedna zakładka pokazuje tylko je.',
  'help.guide.files-star.tip.1':
    'Zakładka z gwiazdką istnieje tylko wtedy, gdy jakiś plik jest oznaczony gwiazdką. Gdy usuniesz gwiazdkę z ostatniego pliku, zakładka zniknie.',
  'help.guide.files-star.tip.2':
    'Oznaczanie gwiazdką wymaga tego samego uprawnienia co „Przypisz”, czyli „Edytowanie plików”. Uczestnik bez niego widzi gwiazdki, ale kliknięcie „Oznacz” niczego nie zmienia.',
  // files-filter
  'help.guide.files-filter.title': 'Wyszukiwanie dokumentu na liście',
  'help.guide.files-filter.goal': 'Pokaż tylko ten rodzaj dokumentów, którego szukasz.',
  'help.guide.files-filter.step.1':
    'Zakładki filtrów są na pasku u góry, obok „Pliki”: Wszystkie, PDF, Obrazki i Dokumenty, każda z liczbą plików.',
  'help.guide.files-filter.step.2': 'Kliknij „PDF”: lista pokaże tylko pliki PDF.',
  'help.guide.files-filter.step.3':
    'Dwie dodatkowe zakładki pojawiają się tylko wtedy, gdy podróż ma pasujące pliki. Kliknij „Wspólne notatki”, która pojawia się, gdy tylko notatka w zakładce „Współpraca” ma załącznik: lista pokaże wtedy tylko te pliki. Zakładka z gwiazdką pojawia się w ten sam sposób, gdy tylko jakiś plik zostanie oznaczony.',
  'help.guide.files-filter.step.4': '„Wszystkie” przywraca pełną listę.',
  'help.guide.files-filter.result':
    'Lista pokazuje tylko pliki z wybranej zakładki, a liczba na każdej zakładce mówi, ile ich jest.',
  'help.guide.files-filter.tip.1':
    'Nie ma tu folderów i nie można zmieniać nazw plików. Aby odróżniać dokumenty, korzystaj z notatki w oknie „Przypisz plik”, powiązań z miejscami i rezerwacjami oraz gwiazdki.',
  'help.guide.files-filter.tip.2':
    'Lista jest zawsze posortowana tak, że najpierw są pliki z gwiazdką, a potem najnowsze, więc dokument przesłany dziś jest nad tym z zeszłego miesiąca.',
  // files-preview
  'help.guide.files-preview.title': 'Czytaj dokument bez wychodzenia z TREK',
  'help.guide.files-preview.goal':
    'Od razu obejrzyj bilet lub zdjęcie i pobierz je na urządzenie, gdy będzie Ci tam potrzebne.',
  'help.guide.files-preview.step.1':
    'Kliknij nazwę lub miniaturę obrazu. Otworzy się na pełnym ekranie, a w lewym górnym rogu zobaczysz nazwę pliku i jego numer wśród obrazów. Wideo otwiera się tak samo i jest tam odtwarzane.',
  'help.guide.files-preview.step.2':
    'Używaj okrągłych strzałek po bokach, klawiszy strzałek w lewo i w prawo albo paska miniatur na dole, aby przeglądać wszystkie obrazy widoczne obecnie na liście.',
  'help.guide.files-preview.step.3':
    '„Otwórz w nowej karcie” i „Pobierz” to okrągłe przyciski w prawym górnym rogu, obok ×. Aby zamknąć obraz, kliknij ×, naciśnij Escape lub kliknij ciemne tło.',
  'help.guide.files-preview.step.4':
    'Dokument, który nie jest obrazem, otwiera się w oknie: u góry jest jego nazwa, pod nią plakietki „Otwórz w nowej karcie” i „Pobierz”, a w przypadku PDF poniżej sama strona. Okno zamkniesz przyciskiem × w prawym górnym rogu, klawiszem Escape lub kliknięciem obok okna.',
  'help.guide.files-preview.step.5':
    'Strzałka na końcu wiersza („Pobierz”) zapisuje plik bezpośrednio na urządzeniu, bez wcześniejszego otwierania.',
  'help.guide.files-preview.result':
    'Dokument jest widoczny na ekranie, a te same dwa przyciski otwierają go w karcie przeglądarki albo zapisują na dysku.',
  'help.guide.files-preview.tip.1': 'Na ekranie dotykowym przesuwaj obrazki palcem zamiast klikać strzałki.',
  'help.guide.files-preview.tip.2':
    'Karta do portfela nigdy nie otwiera podglądu. Jest od razu pobierana, aby telefon mógł otworzyć ją w aplikacji portfela.',
  'help.guide.files-preview.tip.3':
    '„Otwórz w nowej karcie” i „Pobierz” wczytują plik w ramach Twojej sesji, więc link skopiowany z paska adresu nie zadziała u nikogo innego.',
  // files-trash
  'help.guide.files-trash.title': 'Usuwanie i przywracanie dokumentu',
  'help.guide.files-trash.goal':
    'Usuń to, czego podróż już nie potrzebuje, i przywróć pliki, które jednak są potrzebne.',
  'help.guide.files-trash.step.1':
    'Kliknij kosz na końcu wiersza („Usuń”). Plik od razu znika z listy i pojawia się komunikat „Przeniesiono do kosza”. Nie ma pytania o potwierdzenie.',
  'help.guide.files-trash.step.2':
    'Ikona kosza na prawym końcu paska (Kosz) przełącza listę na usunięte pliki. Tytuł paska zmienia się na Kosz, a zakładki filtrów i pole przesyłania są ukryte.',
  'help.guide.files-trash.step.3':
    'Wiersz w koszu jest wyszarzony i ma dwie ikony: „Przywróć”, która przywraca plik, i „Usuń”, która po potwierdzeniu usuwa go na stałe.',
  'help.guide.files-trash.step.4':
    'Kliknij „Przywróć”. Pojawi się komunikat „Plik został przywrócony”, a plik zniknie z kosza. Notatka i powiązania zostają zachowane.',
  'help.guide.files-trash.step.5':
    '„Opróżnij kosz” na pasku obok ikony kosza trwale usuwa wszystko, co jest jeszcze w koszu. Przeglądarka raz prosi o potwierdzenie. Ikona kosza przełącza z powrotem na pliki.',
  'help.guide.files-trash.result': 'Plik wraca na listę, w to samo miejsce co wcześniej.',
  'help.guide.files-trash.tip.1':
    '„Usuń” w wierszu nie pyta o potwierdzenie. Właśnie dlatego jest kosz: nic nie znika z TREK, dopóki nie usuniesz tego tutaj. Wszystko to działa też offline i zostaje wysłane, gdy TREK znów będzie online.',
  'help.guide.files-trash.tip.2':
    'Usuwanie i przywracanie plików wymaga uprawnienia do usuwania plików. Uczestnik bez niego nie widzi ani opcji „Usuń” w wierszu, ani przycisków w koszu.',
  'help.guide.files-trash.tip.3': 'Pliku usuniętego z kosza na stałe nie da się przywrócić.',
  // files-sync
  'help.guide.files-sync.title': 'Synchronizuj dokumenty ze swoim magazynem dokumentów',
  'help.guide.files-sync.goal':
    'Połącz podróż z własnym magazynem dokumentów, aby pliki przesłane tutaj zapisywały się tam, a pliki zapisane tam pojawiały się tutaj.',
  'help.guide.files-sync.step.1':
    'Kliknij „Synchronizacja dokumentów” obok ikony kosza na prawym końcu paska. Otworzy się okno z nazwą podróży pod tytułem. Po lewej, w sekcji „Połącz dostawcę”, są magazyny włączone przez administratora, każdy z opisem, jak przechowuje pliki: Paperless-ngx i Papra za pomocą tagów, Nextcloud i Synology Drive w folderze, OpenCloud w przestrzeni. Po prawej widnieje „Nic jeszcze nie połączono”.',
  'help.guide.files-sync.step.2':
    'Kliknij swój magazyn, tutaj Nextcloud. Otworzy się mniejsze okno połączenia z nazwą magazynu i prośbą o dane logowania, których on wymaga.',
  'help.guide.files-sync.step.3':
    'Wypełnij pole „Adres” i dane logowania do magazynu: „Token API” dla Paperless-ngx, „Klucz API” i „Identyfikator organizacji” dla Papra, „Nazwa użytkownika” i „Hasło aplikacji” dla Nextcloud, „Nazwa użytkownika” i „Token aplikacji” dla OpenCloud, a dla Synology Drive „Nazwa użytkownika”, „Hasło” i, jeśli konto tego wymaga, „Kod dwuskładnikowy”. Wszędzie, gdzie magazyn to umożliwia, używaj hasła lub tokenu aplikacji, nigdy hasła do konta. Nextcloud i Synology Drive przyjmują też opcjonalny „Folder bazowy”, w którym TREK szuka folderów podróży, tutaj /Reisen. Opcja „Zezwalaj na certyfikat z własnym podpisem” na dole jest przeznaczona wyłącznie dla magazynu w Twojej sieci lokalnej, który używa takiego certyfikatu.',
  'help.guide.files-sync.step.4':
    'Kliknij „Testuj połączenie”. TREK łączy się z magazynem za pomocą wpisanych danych, a w stopce pojawia się „Połączono, zalogowano jako” i nazwa konta. Jeśli dane logowania zostaną odrzucone lub adres jest nieosiągalny, stopka to pokaże. W obu przypadkach nic nie jest zapisywane.',
  'help.guide.files-sync.step.5':
    'Kliknij „Połącz”. Połączenie zostaje zapisane w podróży, a TREK pyta, gdzie w magazynie mają być dokumenty podróży: w którym tagu, folderze lub przestrzeni. Synchronizowana jest tylko ich zawartość. „Utwórz nowe miejsce” tworzy nowe po kliknięciu „Utwórz”, z nazwą wziętą z tytułu podróży. W sekcji „Albo użyj istniejącego” widać istniejące. Kliknij jedno z nich, tutaj folder Autumn in Japan.',
  'help.guide.files-sync.step.6':
    'Okno otworzy się ponownie: Twój magazyn jest na liście pod Ta podróż po lewej, a jego karta po prawej pokazuje, dokąd synchronizuje, kiedy ostatnio działał, i przycisk Synchronizuj teraz. Pierwsza synchronizacja startuje automatycznie, a Synchronizuj teraz uruchamia ją w dowolnej chwili. Po synchronizacji plakietka Jeszcze nie synchronizowano obok nazwy zmienia się w zieloną kropkę, która po najechaniu pokazuje Aktualne. Pasek przepływu pokazuje, ile dokumentów ma TREK, a ile magazyn, z pasmami Do repozytorium i Z repozytorium pomiędzy nimi. Zamknij okno krzyżykiem × w prawym górnym rogu.',
  'help.guide.files-sync.result':
    'Dokumenty, które już były w magazynie, pojawiają się na górze listy jako przesłane przez Ciebie, a każdy dokument podróży trafia też do magazynu, z wyjątkiem dokumentów ze „Wspólnych notatek”. Od teraz TREK sprawdza magazyn w tle, a zmiany na liście są kopiowane do magazynu.',
  'help.guide.files-sync.tip.1':
    'Połączyć podróż może tylko jej właściciel albo administrator instancji, bo dane logowania dają dostęp do całego konta w magazynie. Po połączeniu każdy członek widzi „Synchronizacja dokumentów” i może ją otworzyć, przejrzeć kartę i nacisnąć „Synchronizuj teraz”.',
  'help.guide.files-sync.tip.2':
    'Magazyn w Twojej sieci lokalnej wymaga ustawienia ALLOW_INTERNAL_NETWORK=true na serwerze TREK, a jego adres musi być adresem komputera w sieci, nigdy localhost. W przeciwnym razie „Testuj połączenie” zwróci komunikat „Ten adres jest niedozwolony.”',
  'help.guide.files-sync.tip.3':
    '„Rozłącz”, ikona obok „Synchronizuj teraz”, raz prosi o potwierdzenie. Potem kończy połączenie i zachowuje wszystkie dokumenty po obu stronach. Jeśli drugi raz połączysz ten sam tag, folder lub przestrzeń, TREK potraktuje je jako nowe i ponownie zaimportuje całą zawartość. Dlatego po rozłączeniu połącz pusty tag, folder lub przestrzeń, a nie poprzednie.',

  // ── Screen: trip-day-detail ───────────────────────────────────────────────────────────
  'help.ctx.trip-day-detail.title': 'Szczegóły dnia',
  'help.ctx.trip-day-detail.summary':
    'Panel, który otwiera się nad mapą po kliknięciu nagłówka dnia. Pokazuje cały dzień: jego nazwę i datę, pogodę w miejscu, w którym będziesz, rezerwacje na ten dzień oraz zarezerwowane na niego noclegi.',
  'help.ctx.trip-day-detail.bullet.1':
    'Kliknij nagłówek dnia w kolumnie dni, a nad środkiem mapy otworzy się panel. Kliknij ten sam nagłówek ponownie lub krzyżyk po jego prawej stronie, aby zamknąć panel i odznaczyć dzień. Otwarcie miejsca z kolumny miejsc lub z mapy zamyka panel i pokazuje to miejsce.',
  'help.ctx.trip-day-detail.bullet.2':
    'W nagłówku widać nazwę dnia i jego datę. Ołówek obok nazwy pozwala zmienić nazwę dnia. Podwójna strzałka zwija panel do wąskiego paska, aby znów było widać mapę.',
  'help.ctx.trip-day-detail.bullet.3':
    'Na górze jest pogoda na dany dzień. „Prognoza dla” pokazuje, którego miejsca dotyczy prognoza: pierwszego przystanku dnia lub hotelu, w którym się budzisz.',
  'help.ctx.trip-day-detail.bullet.4':
    'Rezerwacje pokazują rezerwacje tego dnia, każdą z rodzajem, przystankiem, do którego należy, i godzinami. Zielony oznacza potwierdzoną, bursztynowy wciąż oczekującą, a przejazd transportem publicznym jest niebieski i nie ma statusu. Kliknięcie wiersza otwiera rezerwację.',
  'help.ctx.trip-day-detail.bullet.5':
    'Nocleg pokazuje każdą noc zarezerwowaną na ten dzień, z oznaczeniami Zameldowanie i Wymeldowanie w dniach, w których się odbywają, oknem zameldowania, godziną wymeldowania i numerem potwierdzenia. Jeśli pobyt ma rezerwację, pod nim widać pole Rezerwacja z jej nazwą oraz statusem Oczekujące lub Potwierdzono. Kliknij je, aby otworzyć rezerwację.',
  'help.ctx.trip-day-detail.bullet.6':
    '„Dodaj zakwaterowanie” dodaje nocleg w tym dniu: wybierz obiekt spośród miejsc podróży, wskaż dni, które obejmuje, i dodaj godziny oraz kod. Plus w nagłówku dnia, z podpowiedzią „Dodaj do dnia”, też ma „Dodaj zakwaterowanie”: otwiera ten panel z od razu otwartym formularzem.',
  // day-panel
  'help.guide.day-panel.title': 'Otwórz dzień i przeczytaj jego szczegóły',
  'help.guide.day-panel.goal': 'Zobacz cały dzień, z pogodą, rezerwacjami i noclegiem, bez opuszczania mapy.',
  'help.guide.day-panel.step.1':
    'Kliknij nagłówek dnia w kolumnie dni. Dzień zostanie wybrany, a jego szczegóły otworzą się na środku mapy.',
  'help.guide.day-panel.step.2':
    'Nagłówek pokazuje nazwę dnia, „Dzień 1”, dopóki nie nadasz mu własnej, a pod nią datę.',
  'help.guide.day-panel.step.3':
    'Na górze jest pogoda na ten dzień. Pozycja „Prognoza dla” pokazuje, którego miejsca dotyczy: pierwszego przystanku dnia lub hotelu, w którym spędziłeś poprzednią noc.',
  'help.guide.day-panel.step.4':
    'Pod nią sekcja „Rezerwacje” pokazuje rezerwacje przypadające na ten dzień, z godzinami.',
  'help.guide.day-panel.step.5':
    'Sekcja „Nocleg” pokazuje noce zarezerwowane w tym dniu, z pozycjami „Zameldowanie” i „Wymeldowanie” w dniach, w których przypadają.',
  'help.guide.day-panel.step.6':
    'Podwójna strzałka w nagłówku zwija panel do wąskiego paska. X obok niej zamyka panel i odznacza dzień.',
  'help.guide.day-panel.result':
    'Gdy zwiniesz panel do paska, mapa jest odsłonięta, a dzień pozostaje wybrany. Gdy go zamkniesz, zaznaczenie dnia znika, a plan pozostaje bez zmian.',
  'help.guide.day-panel.tip.1':
    'Panel zwiniesz też kliknięciem w dowolnym miejscu jego nagłówka. Strzałka to tylko jeden ze sposobów.',
  'help.guide.day-panel.tip.2':
    'Gdy otworzysz miejsce z kolumny miejsc lub z mapy, panel dnia się zamyka, a w jego miejscu pojawiają się szczegóły miejsca. Kliknij ponownie nagłówek dnia, żeby wrócić do dnia.',
  // day-weather
  'help.guide.day-weather.title': 'Sprawdź pogodę na dany dzień',
  'help.guide.day-weather.goal': 'Sprawdź pogodę w miejscu, w którym naprawdę jesteś danego dnia.',
  'help.guide.day-weather.step.1':
    '„Prognoza dla” pokazuje, którego miejsca dotyczą dane: pierwszego przystanku dnia, a w dniu bez przystanków hotelu, w którym spędzasz poprzednią noc.',
  'help.guide.day-weather.step.2':
    'Duża liczba to temperatura w ciągu dnia. Obok widać temperaturę minimalną i maksymalną oraz opis pogody.',
  'help.guide.day-weather.step.3':
    'Przyciski po jej prawej: szansa na deszcz, jego ilość, najsilniejszy wiatr oraz wschód i zachód słońca.',
  'help.guide.day-weather.step.4':
    'Na dole widać dzień godzina po godzinie, co dwie godziny: godzinę, ikonę, temperaturę i prawdopodobieństwo opadów. Godziny z prawdopodobieństwem powyżej 50 procent są zacieniowane na niebiesko.',
  'help.guide.day-weather.result':
    'Karta dnia w kolumnie dni też pokazuje pogodę, małym tekstem pod numerem, więc szybko sprawdzisz pogodę na całą podróż.',
  'help.guide.day-weather.tip.1':
    'Stopnie i wiatr są podawane w jednostkach z opcji „Jednostka temperatury” w sekcji „Wygląd” w Ustawieniach: jeśli wybierzesz °F Fahrenheit, ta sama prognoza będzie pokazywana w °F i mph.',
  'help.guide.day-weather.tip.2':
    'Dzień bez przystanku z lokalizacją i bez hotelu z poprzedniej nocy nie pokazuje pogody: prognoza dotyczy zawsze miejsca, nigdy całej podróży.',
  'help.guide.day-weather.tip.3':
    'Na więcej niż 16 dni naprzód prognoza nie jest dostępna. Wtedy dane są średnimi z poprzednich lat dla tej daty. Są oznaczone symbolem Ø, a pod spodem jest o tym informacja.',
  // rename-day
  'help.guide.rename-day.title': 'Nadawanie dniowi nazwy',
  'help.guide.rename-day.goal':
    'Nadaj dniowi nazwę, na przykład Przyjazd do Kioto albo Dzień odpoczynku, zamiast Dzień 5.',
  'help.guide.rename-day.step.1': 'Otwórz dzień. W nagłówku widnieje „Dzień 5”, a pod spodem data.',
  'help.guide.rename-day.step.2': 'Kliknij ołówek obok nazwy.',
  'help.guide.rename-day.step.3': 'Nazwa zamieni się w pole tekstowe. Wpisz wybraną nazwę.',
  'help.guide.rename-day.step.4':
    'Naciśnij Enter lub kliknij w innym miejscu. Klawisz Escape anuluje zmianę. Nazwę widać też na karcie dnia w kolumnie dni.',
  'help.guide.rename-day.result':
    'Nazwa zastępuje „Dzień 5” w panelu i na karcie dnia w kolumnie dni; data się nie zmienia.',
  'help.guide.rename-day.tip.1':
    'Jeśli wyczyścisz pole i zapiszesz, dzień znów będzie się nazywał „Dzień 5”: numer jest widoczny, gdy nie ma nazwy.',
  'help.guide.rename-day.tip.2':
    'Nazwa należy do dnia, a nie do jego daty. Jeśli zmienisz kolejność dni, nazwa przesunie się razem z całą resztą z tego dnia.',
  // add-accommodation
  'help.guide.add-accommodation.title': 'Zarezerwuj nocleg w danym dniu',
  'help.guide.add-accommodation.goal':
    'Dodaj hotel do planu jeden raz, z dniami pobytu, godzinami i numerem potwierdzenia.',
  'help.guide.add-accommodation.step.1':
    'Obiekt musi najpierw być miejscem w podróży. Utwórz go w kolumnie miejsc jak każde inne miejsce: wybór pokazuje tylko istniejące miejsca.',
  'help.guide.add-accommodation.step.2': 'Otwórz dzień przyjazdu i kliknij „Dodaj zakwaterowanie” w sekcji „Nocleg”.',
  'help.guide.add-accommodation.step.3':
    '„Zastosuj do dni” określa, które noce obejmuje pobyt: „Początek” to dzień zameldowania, „Koniec” dzień wymeldowania, a „Wszystkie” obejmuje całą podróż. U góry okna widać zakres i liczbę nocy.',
  'help.guide.add-accommodation.step.4':
    'Wypełnij pola „Zameldowanie”, „Do” i „Wymeldowanie”, a numer rezerwacji wpisz w polu „Potwierdzenie”. Wszystkie cztery pola mogą zostać puste.',
  'help.guide.add-accommodation.step.5':
    'Wybierz obiekt w polu „Wybierz zakwaterowanie”. „Kategoria” nad listą zawęża ją do jednej kategorii.',
  'help.guide.add-accommodation.step.6': 'Kliknij Zapisz.',
  'help.guide.add-accommodation.result':
    'Nocleg widać w każdym dniu, który obejmuje: „Zameldowanie” w pierwszym, „Wymeldowanie” w ostatnim. Obiekt staje się przystankiem w dniu zameldowania, więc mapa pokazuje dojazd do niego, a w zakładce „Rezerwacje” pojawia się rezerwacja hotelu.',
  'help.guide.add-accommodation.tip.1':
    'Wybór otwiera się na dniu, z którego przechodzisz, z wymeldowaniem następnego dnia; przed zapisaniem możesz zmienić obie daty.',
  'help.guide.add-accommodation.tip.2':
    'Przy tworzeniu hotelu nadaj mu kategorię „Hotel”. Wtedy filtr „Kategoria” nad listą jednym kliknięciem pokaże tylko Twoje hotele.',
  'help.guide.add-accommodation.tip.3':
    'Wszystkie godziny są opcjonalne: pobyt bez zameldowania i bez kodu nadal obejmuje swoje noce, a jego trasa jest nadal rysowana.',
  // edit-accommodation
  'help.guide.edit-accommodation.title': 'Zmiana lub odwołanie zarezerwowanego noclegu',
  'help.guide.edit-accommodation.goal': 'Przesuń pobyt, popraw jego godziny lub usuń go z planu.',
  'help.guide.edit-accommodation.step.1':
    'Karta pokazuje obiekt i jego adres, Zameldowanie lub Wymeldowanie w dniach, w których się odbywają, wraz z godzinami, numer potwierdzenia, a w sekcji Rezerwacja rezerwację powiązaną z noclegiem.',
  'help.guide.edit-accommodation.step.2':
    'Ołówek po prawej, „Edytuj zakwaterowanie”, otwiera nocleg do edycji. Okienko ma teraz tytuł „Edytuj zakwaterowanie”.',
  'help.guide.edit-accommodation.step.3':
    'Popraw pola „Zameldowanie”, „Do”, „Wymeldowanie” i „Potwierdzenie”. Możesz tu też zmienić dni powyżej i obiekt poniżej.',
  'help.guide.edit-accommodation.step.4': 'Kliknij Zapisz.',
  'help.guide.edit-accommodation.step.5':
    'X obok ołówka, „Usuń”, usuwa nocleg. Nie pyta o potwierdzenie, a powiązana z noclegiem rezerwacja hotelu też zostaje usunięta.',
  'help.guide.edit-accommodation.result':
    'Zmiana od razu obejmuje wszystkie dni noclegu oraz rezerwację hotelu na karcie „Rezerwacje”.',
  'help.guide.edit-accommodation.tip.1':
    'Noc w środku pobytu nie ma etykiety „Zameldowanie” ani „Wymeldowanie”: mają ją tylko pierwszy i ostatni dzień zakresu.',
  'help.guide.edit-accommodation.tip.2':
    'Anulowanie pobytu usuwa też przystanek dodany w dniu zameldowania i wszystkie koszty powiązane z rezerwacją. Jeśli to była pomyłka, zarezerwuj nocleg jeszcze raz.',
  // day-bookings
  'help.guide.day-bookings.title': 'Rezerwacje dnia w skrócie',
  'help.guide.day-bookings.goal':
    'Zobacz w jednym miejscu, co już jest zarezerwowane na ten dzień i czy zostało potwierdzone.',
  'help.guide.day-bookings.step.1':
    '„Rezerwacje” pokazują rezerwacje danego dnia: te z jego datą oraz te przypięte do któregoś z jego przystanków. Rezerwacja przypięta do przystanku w innym dniu jest widoczna tylko przy tym przystanku.',
  'help.guide.day-bookings.step.2':
    'Wiersz pokazuje rodzaj rezerwacji, jej nazwę oraz, jeśli należy do przystanku, nazwę tego przystanku na szaro. Godziny są na prawym końcu, przed kropką statusu.',
  'help.guide.day-bookings.step.3':
    'Kolor pokazuje status rezerwacji: zielony to potwierdzona, bursztynowy wciąż oczekująca, a przejazd transportem publicznym jest niebieski i nie ma statusu. Hoteli nie ma na tej liście, mają własną sekcję poniżej.',
  'help.guide.day-bookings.step.4':
    'Kliknij wiersz, a otworzy się rezerwacja. Przycisk w jej nagłówku przełącza ją między Oczekujące i Potwierdzono, a Edytuj na dole pozwala zmienić resztę. Nowe rezerwacje tworzysz na karcie Rezerwacje, a transporty na karcie Transport.',
  'help.guide.day-bookings.result':
    'Na tej liście jest wszystko, co ma datę z tego dnia, oraz wszystko, co jest powiązane z którymś z jego przystanków.',
  'help.guide.day-bookings.tip.1':
    'Rezerwacja pojawia się w dniu, na który przypada jej data. Jeśli zmienisz datę na karcie „Rezerwacje” lub „Transport”, rezerwacja sama przeniesie się na inny dzień.',
  'help.guide.day-bookings.tip.2':
    'Brak bloku Rezerwacje oznacza, że dzień nie ma rezerwacji: blok jest wtedy ukryty, a nie pokazany pusty.',
  'help.guide.map-lock.title': 'Zablokuj mapę',
  'help.guide.map-lock.goal': 'Zatrzymaj mapę w miejscu, gdy przeglądasz kolejne dni i miejsca.',
  'help.guide.map-lock.step.1':
    'Kłódka to górny z dwóch okrągłych przycisków w lewym dolnym rogu mapy; po najechaniu pojawia się podpowiedź „Zablokuj widok mapy”. Kliknij ją. Dopóki jest zamknięta, otwarcie dnia lub wybranie miejsca nie przybliża ani nie przesuwa mapy, a przycisk ma teraz podpowiedź „Pozwól mapie podążać za zaznaczeniem”.',
  'help.guide.map-lock.result': 'Mapa zostaje tam, gdzie ją zostawiłeś, gdy pracujesz nad planem.',
  'help.guide.map-lock.tip.1':
    'Kliknij kłódkę ponownie, teraz z podpowiedzią „Pozwól mapie podążać za zaznaczeniem”, a mapa znów będzie podążać za tym, co wybierasz. Kłódka jest dostępna tylko na komputerze; na telefonie mapa zawsze podąża za wyborem.',

  // ── Screen: trip-map ──────────────────────────────────────────────────────────────────
  'help.ctx.trip-map.title': 'Mapa',
  'help.ctx.trip-map.summary':
    'Środek planu: każde miejsce podróży jako pinezka, każda wycieczka jako linia, trasy między nimi oraz przyciski wzdłuż krawędzi mapy do blokowania widoku, przełączania na widok satelitarny, pokazywania całej podróży naraz i pokazywania miejsc w oglądanym obszarze.',
  'help.ctx.trip-map.bullet.1':
    'Pinezka to miejsce: pokazuje zdjęcie miejsca, jeśli je ma, a w przeciwnym razie kolor i ikonę kategorii. Po najechaniu na pinezkę zobaczysz kartę ze zdjęciem, nazwą i adresem, a także oceną i kategorią, jeśli miejsce je ma. Przeciągnij pinezkę na kartę dnia, żeby zaplanować tam miejsce. Nocleg, którego rezerwacja wciąż oczekuje, jest wyblakły i ma przerywaną obwódkę.',
  'help.ctx.trip-map.bullet.2':
    'Pinezki położone zbyt blisko siebie łączą się w jedno ciemne kółko z liczbą. Kliknij je, a mapa przybliży się do pinezek w środku. Gdy włączone są „Kompaktowe znaczniki dla niezaplanowanych miejsc” (w „Ustawienia” > „Wygląd”, w sekcji „Podróże i mapa”), miejsca bez przypisanego dnia są małymi kropkami bez zdjęcia, dzięki czemu zaplanowane przystanki są lepiej widoczne.',
  'help.ctx.trip-map.bullet.3':
    'Kliknij pinezkę, aby otworzyć miejsce na karcie u dołu mapy, z oceną, plikami i dalszymi akcjami. Kliknij puste miejsce na mapie, aby zamknąć kartę.',
  'help.ctx.trip-map.bullet.4':
    'Gdy w kolumnie dni otwarty jest dzień, jego przystanki mają małą białą plakietkę z numerem w tym dniu. Miejsce, które występuje w dniu dwa razy, ma oba numery. Filtry nad listą miejsc („Pokaż”, kategorie i gwiazdka z minimalną oceną) filtrują też pinezki na mapie.',
  'help.ctx.trip-map.bullet.5':
    'Rząd ikon u góry przeszukuje widoczny fragment mapy: „Restauracje”, „Kawiarnie”, „Bary i życie nocne”, „Nocleg”, „Atrakcje”, „Muzea i kultura”, „Przyroda i parki” oraz „Atrakcje”. Kategorie dodane przez wtyczki są za cienką linią oddzielającą. Gdy rząd jest szerszy niż mapa, przewiniesz go w bok kółkiem myszy. „Szukaj w tym obszarze” ponawia wyszukiwanie po przesunięciu mapy.',
  'help.ctx.trip-map.bullet.6':
    'Kliknij prawym przyciskiem w dowolnym miejscu mapy, aby otworzyć formularz miejsca w tym punkcie, z już wyszukanym adresem. W lewym dolnym rogu są dwa okrągłe przyciski: kłódka, Zablokuj widok mapy, zatrzymuje widok mapy w miejscu, gdy klikasz dni i miejsca, a przycisk pod nią, Przełącz na widok satelitarny, zamienia narysowaną mapę na zdjęcia satelitarne.',
  'help.ctx.trip-map.bullet.7':
    '„Pokaż całą podróż” w prawym dolnym rogu rysuje naraz wszystkie dni podróży i wymienia, co obejmuje każdy dzień. Ikona trasy w wierszu rezerwacji rysuje tę rezerwację, a ikona trasy na pasku narzędzi nad dniami rysuje wszystkie rezerwacje. Kliknij koniec narysowanej rezerwacji, aby otworzyć jej szczegóły.',
  'help.ctx.trip-map.bullet.8':
    'Gdy dodatek Dawarich jest włączony, okrągły przycisk Dawarich pod „Pokaż całą podróż” pokazuje trasę, którą faktycznie zapisał Twój telefon. „Pokaż zapisaną trasę” rysuje ją przerywaną linią pod zaplanowaną trasą, w osobnym kolorze dla każdego dnia. Gdy linii nie ma, etykieta przycisku wyjaśnia dlaczego.',
  // map-markers
  'help.guide.map-markers.title': 'Jak czytać mapę',
  'help.guide.map-markers.goal': 'Dowiedz się, co oznacza każda pinezka, plakietka i dymek na mapie.',
  'help.guide.map-markers.step.1':
    'Mapa pokazuje wszystkie miejsca z podróży. Pinezki leżące zbyt blisko siebie, by dało się je rozróżnić, są zgrupowane w jedno ciemne kółko z liczbą pinezek w środku. Kliknij kółko, a mapa przybliży się do tych pinezek albo, przy największym przybliżeniu, rozsunie je.',
  'help.guide.map-markers.step.2':
    'Pinezka pokazuje zdjęcie miejsca, jeśli je ma, a w przeciwnym razie kolor i ikonę kategorii. Nocleg, którego rezerwacja wciąż oczekuje, jest wyblakły i ma przerywaną obwódkę. Po najechaniu na pinezkę obok otwiera się karta: to samo zdjęcie w większym rozmiarze, nazwa i adres, a także ocena i kategoria, jeśli miejsce je ma.',
  'help.guide.map-markers.step.3':
    'Kliknij pinezkę, a miejsce otworzy się w karcie w dolnej części mapy: u góry zdjęcie, nazwa i adres, potem gwiazdki, opis i pliki, także te z rezerwacji. Na dole są działania: „Dodaj do dnia”, gdy dzień jest otwarty („Usuń z dnia”, jeśli miejsce już w nim jest), „Nawigacja”, „Otwórz stronę internetową”, „Zapisz w kolekcji” („Zapisano”, gdy miejsce jest już w kolekcji), a po prawej kosz i „Edytuj”. Kartę zamkniesz przyciskiem X u góry albo kliknięciem w pusty fragment mapy.',
  'help.guide.map-markers.step.4':
    'Otwórz dzień w kolumnie dni, a jego przystanki dostaną numery: mała biała plakietka w rogu pinezki pokazuje kolejność przystanku w dniu. Miejsce, które występuje w dniu dwa razy, ma oba numery. Gdy żaden dzień nie jest otwarty, numerów nie ma, a w rogu widać ocenę miejsca, jeśli ją ma.',
  'help.guide.map-markers.step.5':
    'Przeciągnij pinezkę z mapy na kartę dnia w kolumnie dni, a miejsce zostanie zaplanowane na ten dzień, tak samo jak po przeciągnięciu jego wiersza z listy miejsc.',
  'help.guide.map-markers.result':
    'W podróży nic się nie zmieniło: mapa tylko ją pokazuje. Każda pinezka informuje, jakie to miejsce, w którym dniu jest i w jakiej kolejności.',
  'help.guide.map-markers.tip.1':
    'Gdy zwiniesz dzień w kolumnie dni, jego przystanki znikają z mapy. Rozwiń dzień ponownie, aby je pokazać.',
  'help.guide.map-markers.tip.2':
    'Filtry nad listą miejsc decydują też o tym, co pokazuje mapa: „Pokaż” („Niezaplanowane”, „Zaplanowane”), kategorie pod przyciskiem z etykietą i minimalna ocena pod gwiazdką zmniejszają liczbę pinezek. Filtr kraju zawęża tylko listę.',
  'help.guide.map-markers.tip.3':
    'Ta mapa nie ma przycisków powiększania: kółko myszy zmienia powiększenie, dwukrotne kliknięcie przybliża o jeden poziom, a przeciąganie przesuwa mapę.',
  // map-nearby-places
  'help.guide.map-nearby-places.title': 'Wyszukiwanie miejsc w pobliżu na mapie',
  'help.guide.map-nearby-places.goal':
    'Wyszukaj restauracje, atrakcje lub hotel w tej części miasta, którą widać na mapie, i dodaj jedno z nich do podróży.',
  'help.guide.map-nearby-places.step.1':
    'Rząd ikon u góry mapy to wyszukiwanie według kategorii: „Restauracje”, „Kawiarnie”, „Bary i życie nocne”, „Nocleg”, „Atrakcje”, „Muzea i kultura”, „Przyroda i parki” oraz „Atrakcje”. Kategorie dodane przez wtyczki są za cienkim separatorem. Najedź kursorem na ikonę, aby zobaczyć jej nazwę.',
  'help.guide.map-nearby-places.step.2':
    'Kliknij kategorię. TREK wyszuka miejsca tego rodzaju w widocznej części mapy i dla każdego wyniku postawi pinezkę w kolorze kategorii. Naraz działa tylko jedna kategoria: kliknięcie innej ją zastępuje, a kliknięcie aktywnej ją wyłącza.',
  'help.guide.map-nearby-places.step.3':
    'Gdy przesuniesz mapę, pod rzędem pojawi się drugi przycisk: „Szukaj w tym obszarze” powtarza wyszukiwanie dla nowego widoku. Samo przesunięcie mapy nie uruchamia nowego wyszukiwania. Dzięki temu zapytań jest mniej.',
  'help.guide.map-nearby-places.step.4':
    'Najedź kursorem na pinezkę, aby zobaczyć nazwę znalezionego miejsca. Kliknij pinezkę, a otworzy się formularz miejsca z już uzupełnionymi danymi: nazwą u góry okna, polami „Adres”, „Szerokość” i „Długość”, a także stroną internetową i numerem telefonu, jeśli wyszukiwanie je znalazło.',
  'help.guide.map-nearby-places.step.5':
    'Sprawdź, co zostało wypełnione, i dodaj to, czego wyszukiwarka nie mogła wiedzieć. Kategoria pod nazwą jest już ustawiona, jeśli podróż ma pasującą kategorię, na przykład restauracja dla restauracji. W przeciwnym razie widać Brak kategorii, dopóki jej nie wybierzesz. Dodaj Opis i własne notatki.',
  'help.guide.map-nearby-places.step.6':
    'Kliknij „Dodaj”. Jeśli miejsce o tej samej nazwie lub w tym samym punkcie jest już w podróży, TREK Cię o tym poinformuje, a przycisk zmieni się na „Dodaj mimo to”.',
  'help.guide.map-nearby-places.result':
    'Miejsce jest na liście miejsc i na mapie jako jedna z pinezek podróży, w grupie „Niezaplanowane”, dopóki nie dodasz go do dnia. Pinezki wyszukiwania zostają, dopóki nie wyłączysz kategorii.',
  'help.guide.map-nearby-places.tip.1':
    'Rzędu nie ma, gdy Odkrywaj miejsca na mapie jest wyłączone w Ustawienia > Preferencje, w sekcji Podróże i mapa.',
  'help.guide.map-nearby-places.tip.2':
    'Wyniki pochodzą z indeksu TREK Places i z OpenStreetMap, więc to jedna z niewielu funkcji planu, które wymagają połączenia z internetem.',
  'help.guide.map-nearby-places.tip.3':
    'Wyszukiwanie obejmuje tylko obszar widoczny na ekranie, więc przybliż mapę do interesującej Cię ulicy. Wyszukiwanie w całym mieście zwraca tylko pierwsze sześćdziesiąt wyników, bez wyraźnej kolejności.',
  // map-add-place
  'help.guide.map-add-place.title': 'Utwórz miejsce, klikając mapę prawym przyciskiem',
  'help.guide.map-add-place.goal': 'Umieść miejsce dokładnie tam, gdzie chcesz, bez wcześniejszego wyszukiwania.',
  'help.guide.map-add-place.step.1':
    'Kliknij prawym przyciskiem myszy wybrany punkt na mapie. Otworzy się formularz miejsca z nagłówkiem „Dodaj miejsce/atrakcję”.',
  'help.guide.map-add-place.step.2':
    'Pola „Szerokość” i „Długość” są już ustawione na ten punkt. TREK wyszukuje współrzędne i wypełnia pole „Adres” znalezionymi danymi. Jeśli wyszukiwanie znajdzie nazwę, TREK wpisze ją też u góry okna. Nic nie jest jeszcze zapisane, więc popraw wszystko, co się nie zgadza.',
  'help.guide.map-add-place.step.3':
    'W polu u góry okna wpisz nazwę, po której rozpoznasz miejsce. Wybierz kategorię z plakietki pod spodem; dopóki jej nie wybierzesz, widnieje na niej „Brak kategorii”. Następnie dodaj inne szczegóły do planu: „Opis”, „Notatki”, „Strona internetowa”.',
  'help.guide.map-add-place.step.4':
    'Kliknij „Dodaj”. Miejsce trafia na listę jako niezaplanowane, nawet jeśli jakiś dzień jest otwarty: kliknięcie prawym przyciskiem na mapie ustala lokalizację, a nie dzień.',
  'help.guide.map-add-place.result':
    'Miejsce jest na liście i na mapie, w grupie „Niezaplanowane”, dopóki nie dodasz go do dnia.',
  'help.guide.map-add-place.tip.1':
    'Adres jest wyszukiwany na podstawie współrzędnych, więc może to być raczej ulica niż nazwa, a poza zabudową pole może zostać puste. Oba pola możesz nadpisać.',
  'help.guide.map-add-place.tip.2':
    'Na mapach MapLibre GL i Mapbox GL to samo zrobisz środkowym przyciskiem myszy, a na ekranie dotykowym długim przytrzymaniem.',
  // map-satellite
  'help.guide.map-satellite.title': 'Przełącz na widok satelitarny',
  'help.guide.map-satellite.goal': 'Przełączaj między zwykłą mapą a zdjęciami lotniczymi.',
  'help.guide.map-satellite.step.1':
    'Przełącznik warstwy bazowej to dolny z dwóch okrągłych przycisków w lewym dolnym rogu mapy, pod kłódką. Jego ikona zawsze pokazuje warstwę, na którą przełącza, a podpowiedź mówi, jaka to warstwa: „Przełącz na widok satelitarny”. Kliknij go.',
  'help.guide.map-satellite.step.2':
    'Mapa pokazuje teraz zdjęcia lotnicze. Są na tyle szczegółowe, że widać pojedyncze budynki, i nie potrzebujesz do nich własnego klucza. Wszystko, co rysuje TREK, pozostaje na wierzchu: pinezki, trasa dnia, ślady i trasy rezerwacji.',
  'help.guide.map-satellite.step.3':
    'Na przycisku widnieje teraz „Przełącz na widok mapy”. Kliknij go, aby wrócić do widoku mapy.',
  'help.guide.map-satellite.result':
    'Mapa zostaje narysowana na nowo, a wybrana warstwa jest zapamiętana na Twoim koncie.',
  'help.guide.map-satellite.tip.1':
    'Wybór jest zapisany na Twoim koncie, a nie w podróży, więc każda podróż otwiera się tak, jak ją zostawiłeś, niezależnie od używanego silnika renderowania mapy.',
  'help.guide.map-satellite.tip.2':
    'Zdjęcia satelitarne nie mają podpisów: nazwy ulic, dzielnice i numery domów są tylko na zwykłej mapie, więc przełącz się z powrotem, gdy szukasz adresu.',
  // map-whole-trip
  'help.guide.map-whole-trip.title': 'Cała podróż i jej odległości',
  'help.guide.map-whole-trip.goal':
    'Pokaż wszystkie dni podróży zamiast tylko otwartego dnia i zobacz, ile przejeżdżasz każdego dnia.',
  'help.guide.map-whole-trip.step.1':
    'Okrągły przycisk Pokaż całą podróż jest w prawym dolnym rogu mapy. Kliknij go, a wszystkie dni podróży zostaną narysowane naraz, każdy w swoim kolorze, żeby sąsiednie dni dało się odróżnić.',
  'help.guide.map-whole-trip.step.2':
    'Karta nad przyciskiem wymienia te dni: kolorową kropkę, nazwę dnia, ikonę każdego środka transportu, którym się wtedy poruszasz, i przebyty dystans. Na górze widać „Łączny dystans”.',
  'help.guide.map-whole-trip.step.3':
    'Kliknij dzień na karcie, aby go wybrać: jego wiersz zostanie zacieniowany, a dzień otworzy się w kolumnie dni. Przewiń kółkiem myszy nad miastem, aby je przybliżyć. Dni, które przez nie przebiegają, są widoczne obok siebie, każdy w swoim kolorze.',
  'help.guide.map-whole-trip.step.4':
    'Przycisk ma teraz napis „Ukryj całą podróż”. Kliknij go, aby znów widzieć tylko otwarty dzień.',
  'help.guide.map-whole-trip.result':
    'Każdy dzień podróży ma własny kolor, a karta pokazuje, ile obejmuje każdy dzień i ile wynosi suma dla całej podróży.',
  'help.guide.map-whole-trip.tip.1':
    'Suma jest liczona po kilka odcinków naraz. Dopóki obok niej widać …, liczba jest tylko sumą częściową. Staje się ostateczna, gdy zostaną przeliczone wszystkie odcinki.',
  'help.guide.map-whole-trip.tip.2':
    'Jeśli planer tras nie może wyznaczyć odcinka, odcinek pozostaje linią prostą i nie jest liczony. Karta o tym informuje, więc suma nie jest zaniżona bez ostrzeżenia.',
  'help.guide.map-whole-trip.tip.3':
    'Dzień z mniej niż dwoma przystankami ze współrzędnymi i bez dojazdu do hotelu lub z hotelu nie ma trasy do narysowania, więc w ogóle nie pojawia się na karcie.',
  // map-booking-routes
  'help.guide.map-booking-routes.title': 'Pokaż trasę rezerwacji na mapie',
  'help.guide.map-booking-routes.goal':
    'Pokaż na mapie zarezerwowane loty, pociągi i przejazdy samochodem, a potem je ukryj.',
  'help.guide.map-booking-routes.step.1':
    'Trasy rezerwacji są wyłączone, dopóki którejś nie włączysz. Na prawym końcu wiersza transportu w kolumnie dni jest mała ikona trasy: „Pokaż trasy rezerwacji”.',
  'help.guide.map-booking-routes.step.2':
    'Kliknij ją, a rezerwacja pojawi się na mapie: lot jako łuk po kole wielkim, przejazd samochodem po prawdziwych drogach, pociąg jako ciąg jego stacji. Rezerwacje „Potwierdzono” są rysowane linią ciągłą, „Oczekujące” przerywaną, a końce trasy to niebieskie plakietki z ikoną środka transportu.',
  'help.guide.map-booking-routes.step.3':
    'Kliknij przycisk na końcu trasy, a otworzą się szczegóły rezerwacji: status, typ i dni w kolorowym nagłówku, godziny na obu końcach, pozostałe szczegóły niżej, a na dole Na mapie, które ponownie wyłącza tę trasę, Zmień trasę przy połączeniu transportem publicznym, kosz usuwający rezerwację i Edytuj. X w nagłówku zamyka szczegóły.',
  'help.guide.map-booking-routes.step.4':
    'Ikona trasy na pasku narzędzi nad dniami działa dla całej podróży naraz: „Pokaż wszystkie trasy rezerwacji” rysuje każdą rezerwację, która ma trasę.',
  'help.guide.map-booking-routes.step.5':
    'To zastępuje Twoje wcześniejsze wybory, więc trasy włączone osobno dla poszczególnych rezerwacji zostają zresetowane. Kliknij przycisk ponownie, teraz z napisem „Ukryj wszystkie trasy rezerwacji”, aby ukryć wszystkie trasy rezerwacji.',
  'help.guide.map-booking-routes.result':
    'Wybrane rezerwacje są narysowane na mapie, a wybór jest zapamiętany dla tej podróży w tej przeglądarce, dopóki go nie zmienisz.',
  'help.guide.map-booking-routes.tip.1':
    'Końce pokazują kod lotniska albo samą nazwę stacji tylko wtedy, gdy Etykiety tras rezerwacji jest włączone w Ustawienia > Preferencje, w sekcji Podróże i mapa. W przeciwnym razie widać samą ikonę.',
  'help.guide.map-booking-routes.tip.2':
    '„Zawsze pokazuj trasy rezerwacji” w tej samej sekcji pokazuje je od początku w każdej podróży, w której nie zmieniłeś jeszcze tego ustawienia.',
  'help.guide.map-booking-routes.tip.3':
    'Żeby narysować rezerwację, potrzebne są punkt początkowy i końcowy ze współrzędnymi, dlatego hotel czy restauracja nie mają ikony trasy.',
  // map-dawarich-trail
  'help.guide.map-dawarich-trail.title': 'Pokaż trasę, którą naprawdę przebyłeś',
  'help.guide.map-dawarich-trail.goal':
    'Pokaż na mapie trasę zapisaną przez Dawarich na Twoim telefonie jako przerywaną linię obok zaplanowanej trasy i zobacz dzień po dniu, jak naprawdę przebiegła podróż.',
  'help.guide.map-dawarich-trail.step.1':
    'Okrągły przycisk Dawarich znajduje się w prawym dolnym rogu mapy, pod „Pokaż całą podróż”. Po najechaniu na niego widać „Pokaż zapisaną trasę”. Kliknij go. TREK pobiera z Twojego Dawarich dane z dat podróży, a w czasie oczekiwania na odpowiedź wokół przycisku kręci się pierścień.',
  'help.guide.map-dawarich-trail.step.2':
    'Zapisana trasa pojawia się jako przerywana linia, w osobnym kolorze dla każdego dnia, narysowana pod zaplanowaną trasą, aby plan pozostał czytelny. Na przycisku widnieje teraz „Ukryj zapisaną trasę”. Każdy dzień kończy się o północy czasu lokalnego. Gdy zwiniesz dzień w kolumnie dni, jego przerywana linia i przystanki znikają z mapy.',
  'help.guide.map-dawarich-trail.step.3':
    'Kliknij też „Pokaż całą podróż”, a każdy zaplanowany dzień zostanie narysowany ciągłą linią obok przerywanego nagrania. Tam, gdzie obie linie się pokrywają, dzień przebiegł zgodnie z planem. Tam, gdzie przerywana linia odbiega od zaplanowanej trasy, było inaczej.',
  'help.guide.map-dawarich-trail.result':
    'To, co zaplanowałeś, i to, co faktycznie zrobiłeś, widać razem na mapie: pierwsze jako linie przerywane, drugie jako ciągłe. Karta nad przyciskami nadal wypisuje zaplanowane dni i ich dystanse.',
  'help.guide.map-dawarich-trail.tip.1':
    'Włączenie lub wyłączenie zapisuje się dla każdej podróży na Twoim koncie, więc obowiązuje w każdej przeglądarce i na każdym urządzeniu. Gdy trasa jest włączona, TREK co dwie minuty ponownie odpytuje Dawarich, więc trwająca podróż aktualizuje się bez przeładowania strony. Sama trasa nigdy nie jest zapisywana, więc nie ma jej w bazie danych TREK, w kopiach zapasowych ani w trybie offline.',
  'help.guide.map-dawarich-trail.tip.2':
    'Etykieta przycisku podpowiada, dlaczego mapa jest pusta: „Wczytywanie zapisanej trasy…” w trakcie wczytywania, „W tych dniach nic nie zostało zapisane”, „Nie udało się wczytać zapisanej trasy” albo „Zapisana trasa wymaga połączenia”, gdy TREK jest offline.',
  // map-compass
  'help.guide.map-compass.title': 'Obróć mapę i znajdź północ',
  'help.guide.map-compass.goal':
    'Obróć mapę w kierunku, w którym zmierzasz, i jednym kliknięciem przywróć północ u góry.',
  'help.guide.map-compass.step.1':
    'Obróć mapę, przeciągając ją prawym przyciskiem myszy lub przytrzymując Ctrl i przeciągając lewym; na ekranie dotykowym obróć ją dwoma palcami. Okrągły kompas obok rzędu ikon kategorii u góry mapy obraca się razem z nią: jego strzałka zawsze wskazuje północ, więc przechyla się o ten sam kąt co mapa.',
  'help.guide.map-compass.step.2':
    'Kliknij kompas. Przycisk „Przywróć północ” obraca mapę tak, aby północ była u góry, przywraca płaski widok, a strzałka znów wskazuje w górę.',
  'help.guide.map-compass.result':
    'Mapa znów jest skierowana na północ i wypoziomowana. W podróży nic się nie zmieniło: kompas zmienia tylko widok.',
  'help.guide.map-compass.tip.1':
    'Kompas jest dostępny tylko na mapach MapLibre GL i Mapbox GL; mapy Leaflet nie da się obracać, więc nie ma na niej kompasu. To, której mapy używasz, ustawiasz w opcji „Dostawca mapy” w Ustawieniach, w sekcji „Mapa”, a „Zapisz mapę” zapisuje wybór.',
  'help.guide.map-compass.tip.2':
    'Kliknięcie usuwa też pochylenie. Przeciągnij prawym przyciskiem myszy w górę lub w dół, aby pochylić widok; „Reset north” go poziomuje i zeruje obrót. Na Mapbox GL z włączonymi „Budynkami 3D i terenem” spłaszcza to też widok 3D, dopóki znów go nie pochylisz.',

  // ── Screen: trip-collab ───────────────────────────────────────────────────────────────
  'help.ctx.trip-collab.title': 'Współpraca',
  'help.ctx.trip-collab.summary':
    'Zakładka, w której grupa planuje razem. Ma pięć kart: czat po lewej, obok niego „Notatki” i „Linki”, a pod nimi „Ankiety” i „Co dalej”. Wszystko, co tu napiszesz, od razu pojawia się na ekranach pozostałych uczestników, bez odświeżania.',
  'help.ctx.trip-collab.bullet.1':
    'Czat to karta po lewej. Pisz w polu Napisz wiadomość... i naciśnij Enter. Shift i Enter wstawiają nowy wiersz. Buźka dodaje emoji, a Dołącz obrazy dodaje do wiadomości do czterech zdjęć.',
  'help.ctx.trip-collab.bullet.2':
    'Najedź na wiadomość, aby zobaczyć „Odpowiedz”, a przy własnych wiadomościach także „Usuń”; kliknij ją prawym przyciskiem, aby wybrać jedną z ośmiu szybkich reakcji. W miejscu usuniętej wiadomości pojawia się informacja, kto ją usunął.',
  'help.ctx.trip-collab.bullet.3':
    '„Notatki” to wspólne miejsce na notatki: „Nowa notatka” w nagłówku tworzy notatkę, a koło zębate obok otwiera „Zarządzaj kategoriami”, gdzie ustawisz ich nazwy i kolory. Gdy kategorie już istnieją, rząd pigułek pod nagłówkiem filtruje karty: „Wszystkie” albo jedna kategoria. Karta notatki pokazuje kategorię jako kolorową kropkę, a link jako okrągły przycisk; w jej menu trzech kropek („Więcej opcji”) są „Rozwiń”, „Przypnij”, „Edytuj” i „Usuń”.',
  'help.ctx.trip-collab.bullet.4':
    '„Linki” zbierają adresy stron związanych z podróżą. „Dodaj link” przyjmuje tytuł i adres http lub https. „Edytuj link”, „Przypnij link” i „Usuń link” są na końcu plakietki, a przypięte linki zostają na początku.',
  'help.ctx.trip-collab.bullet.5':
    'Ankiety pomagają podejmować decyzje. „Nowa ankieta” zadaje pytanie z co najmniej dwiema opcjami. Kliknij opcję, aby na nią zagłosować. Kłódka („Zamknij”) i kosz („Usuń”) po prawej stronie nagłówka ankiety kończą głosowanie lub usuwają ankietę.',
  'help.ctx.trip-collab.bullet.6':
    '„Co dalej” pokazuje przystanki podróży, które są jeszcze przed Tobą, maksymalnie osiem, z godzinami i przypisanymi osobami. Dane pochodzą wyłącznie z planu dnia i tam ustawia się godziny.',
  // write-note
  'help.guide.write-note.title': 'Pisanie wspólnej notatki',
  'help.guide.write-note.goal':
    'Zapisz to, czego potrzebuje cała grupa, na przykład zasadę, adres lub przypomnienie, tam, gdzie każdy to znajdzie.',
  'help.guide.write-note.step.1':
    'Kliknij Nowa notatka w nagłówku karty Notatki. Otworzy się okno notatki z kursorem już w polu tytułu.',
  'help.guide.write-note.step.2':
    'Wpisz tytuł w polu „Tytuł notatki” u góry okna. To jedyne wymagane pole: przycisk „Utwórz” pozostaje wyszarzony, dopóki tytuł jest pusty, a Enter w polu tytułu od razu tworzy notatkę.',
  'help.guide.write-note.step.3':
    '„Treść” zawiera tekst i obsługuje Markdown: pogrubienie, listę, nagłówek. Karta pokazuje pierwsze trzy wiersze, a „Rozwiń” w jej menu otwiera całą notatkę.',
  'help.guide.write-note.step.4':
    'W sekcji „Kategoria” wybierz kategorię notatki. Jej kolorem będzie teraz nagłówek okna, a później nagłówek karty. Pierwsza kategoria jest już wybrana. Pigułki to istniejące kategorie, a nową utworzysz w „Zarządzaj kategoriami”. Dopóki podróż nie ma kategorii, tego wiersza nie ma.',
  'help.guide.write-note.step.5':
    'W polu „Strona internetowa” wpisz link związany z notatką. Na karcie pojawi się wtedy u góry okrągły przycisk, który go otwiera.',
  'help.guide.write-note.step.6':
    'Kliknij „Utwórz”. Okno zamykają tylko „Anuluj” i krzyżyk, więc kliknięcie poza oknem lub klawisz Esc nie skasuje tego, co napisałeś.',
  'help.guide.write-note.result':
    'Notatka jest kartą w panelu „Notatki”, z górą w kolorze kategorii, a wszyscy pozostali uczestnicy od razu ją widzą.',
  'help.guide.write-note.tip.1':
    'Trzy kropki na karcie („Więcej opcji”) otwierają „Rozwiń”, „Przypnij”, „Edytuj” i „Usuń”. „Przypnij” trzyma notatkę na górze panelu, w ramce w jej kolorze. Pozostałe notatki są uporządkowane według daty ostatniej zmiany.',
  'help.guide.write-note.tip.2':
    'Koło zębate obok Nowa notatka otwiera Zarządzaj kategoriami. Tam możesz nadać kategorii kolor, zmienić jej nazwę wszędzie naraz albo dodać ją, zanim użyje jej jakakolwiek notatka. Nic się nie zmienia, dopóki nie klikniesz Zapisz.',
  'help.guide.write-note.tip.3':
    '„Załącz pliki” dodaje dokument do notatki, jeśli możesz przesyłać pliki do podróży. „Załącz” otwiera wybór plików. Możesz też wkleić do okna obraz lub PDF.',
  'help.guide.write-note.tip.4':
    'Notatki mają własny przełącznik w „Dodatki”, pod „Współpraca”: administrator może je wyłączyć, zostawiając czat, linki, ankiety i „Co dalej”.',
  // shared-links
  'help.guide.shared-links.title': 'Zbieraj linki do podróży',
  'help.guide.shared-links.goal':
    'Trzymaj portal rezerwacji, wspólny album i rozkład jazdy w jednym miejscu, żeby nie szukać ich na czacie.',
  'help.guide.shared-links.step.1':
    'Kliknij „Dodaj link” w nagłówku karty „Linki”. Otworzy się okno z kursorem w polu u góry.',
  'help.guide.shared-links.step.2':
    'Wpisz nazwę w polu „Tytuł linku”, wklej adres w polu „Podłącz” pod nim i kliknij „Zapisz link”.',
  'help.guide.shared-links.step.3':
    'Plakietka pokazuje nazwę i stronę, do której prowadzi link. Kliknij ją, aby otworzyć stronę w nowej karcie.',
  'help.guide.shared-links.step.4':
    'Trzy okrągłe przyciski na jego końcu to Edytuj link, Przypnij link i Usuń link. Przypnij link przesuwa plakietkę na początek panelu i pokazuje ją w kolorze akcentu. Usuń link najpierw prosi o potwierdzenie, bo link znika dla wszystkich członków.',
  'help.guide.shared-links.result':
    'Link pojawia się jako plakietka w panelu „Linki”, przypięta na początku, i od razu widzi go każdy uczestnik.',
  'help.guide.shared-links.tip.1':
    'Akceptowany jest tylko adres http lub https. Inne są odrzucane, a okno pozostaje otwarte z wpisanym tekstem.',
  'help.guide.shared-links.tip.2':
    'Najpierw są przypięte linki, potem najnowsze. Mała ikona obok tytułu to favicon strony, pobierany z niej samej, więc bez internetu plakietka pokazuje zwykłą ikonę linku.',
  'help.guide.shared-links.tip.3':
    '„Linki” mają własny przełącznik w „Dodatkach”, pod „Współpracą”, więc administrator może wyłączyć ten panel bez zmieniania reszty zakładki.',
  // create-poll
  'help.guide.create-poll.title': 'Zapytaj grupę',
  'help.guide.create-poll.goal':
    'Zamień pytanie, na które nikt nie odpowiada na czacie, w ankietę, w której każdy może zagłosować.',
  'help.guide.create-poll.step.1': 'Kliknij Nowa ankieta w nagłówku karty Ankiety. Otworzy się okno.',
  'help.guide.create-poll.step.2':
    'Wpisz pytanie w polu „Pytanie”. Napis „Obsługuje Markdown” pod polem oznacza, że możesz użyć pogrubienia, nowego wiersza albo krótkiej listy.',
  'help.guide.create-poll.step.3':
    'Wypełnij „Opcja 1” i „Opcja 2” w sekcji „Opcje”. Potrzebujesz co najmniej dwóch niepustych opcji, a opcja może mieć kilka wierszy.',
  'help.guide.create-poll.step.4':
    '„Dodaj opcję” pod nimi dodaje trzecią, czwartą i tyle, ile potrzebujesz. Mały krzyżyk obok wiersza, widoczny przy więcej niż dwóch opcjach, usuwa daną opcję.',
  'help.guide.create-poll.step.5':
    '„Wielokrotny wybór” pozwala każdemu zaznaczyć więcej niż jedną opcję. Gdy jest wyłączony, głos danej osoby przechodzi na nową opcję, kiedy wybierze inną.',
  'help.guide.create-poll.step.6': 'Kliknij „Utwórz ankietę”.',
  'help.guide.create-poll.result': 'Ankieta pojawia się na górze panelu „Ankiety”, otwarta, z 0 głosów w nagłówku.',
  'help.guide.create-poll.tip.1': 'Pytanie jest wyświetlane jako Markdown, a opcje pozostają zwykłym tekstem.',
  'help.guide.create-poll.tip.2':
    'Przycisk „Utwórz ankietę” pozostaje wyszarzony, dopóki nie wpiszesz pytania i co najmniej dwóch opcji.',
  'help.guide.create-poll.tip.3':
    'Termin zakończenia można ustawić tylko w aplikacji na telefon. Ankieta z terminem pokazuje pozostały czas w bursztynowej plakietce w nagłówku i zamyka się, gdy czas minie.',
  'help.guide.create-poll.tip.4':
    'Ankiety mają własny przełącznik w „Dodatki”, pod „Współpraca”: administrator może je wyłączyć, zostawiając pozostałe cztery panele.',
  // vote-poll
  'help.guide.vote-poll.title': 'Głosowanie i odczytywanie wyników',
  'help.guide.vote-poll.goal': 'Zagłosuj, zobacz wyniki grupy i zmień swój głos.',
  'help.guide.vote-poll.step.1':
    'Kliknij wybraną opcję. W jej kółku pojawi się znaczek wyboru, opcja dostanie ramkę w kolorze akcentu, a pasek za nią się wydłuży.',
  'help.guide.vote-poll.step.2':
    'Teraz widzisz cały wynik: pasek pokazuje udział, procent jest po prawej, a małe kółka to osoby, które wybrały daną opcję, do trzech.',
  'help.guide.vote-poll.step.3':
    'Zmieniłeś zdanie? Kliknij inną opcję. W ankiecie bez „Wielokrotnego wyboru” Twój głos przeniesie się na nową opcję, zamiast dodać drugi.',
  'help.guide.vote-poll.step.4':
    'Liczba głosów jest widoczna w plakietce pod pytaniem. Kliknięcie wybranej już opcji wycofuje Twój głos, a licznik spada.',
  'help.guide.vote-poll.result':
    'Twoja opcja jest zaznaczona, paski pokazują, jak głosowała grupa, a kółka, kto wybrał którą opcję.',
  'help.guide.vote-poll.tip.1':
    'Procenty i informacja, kto na co głosował, pojawiają się dopiero po oddaniu Twojego głosu lub po zamknięciu ankiety. Liczbę głosów w nagłówku widzą wszyscy.',
  'help.guide.vote-poll.tip.2':
    'Głosowanie nigdy nie jest anonimowe: najedź na jedno z kółek przy opcji, aby zobaczyć imię osoby, która zagłosowała.',
  // close-poll
  'help.guide.close-poll.title': 'Zamykanie lub usuwanie ankiety',
  'help.guide.close-poll.goal':
    'Zakończ głosowanie, gdy grupa już zdecydowała, i usuń ankietę, której nikt już nie potrzebuje.',
  'help.guide.close-poll.step.1':
    '„Zamknij”, czyli kłódka po prawej stronie nagłówka ankiety, kończy głosowanie. Opcji nie da się już klikać.',
  'help.guide.close-poll.step.2':
    'Zamknięta ankieta przenosi się na dół panelu, pod nagłówek „Zamknięta”, jeśli powyżej są otwarte ankiety. Ma znacznik „Zamknięta” i pokazuje wynik wszystkim, niezależnie od tego, czy głosowali. Zwycięska opcja jest pogrubiona na zielonym pasku; jeśli to ta, na którą głosowałeś, pasek ma zamiast tego twój kolor akcentu.',
  'help.guide.close-poll.step.3':
    '„Usuń”, czyli kosz po prawej stronie nagłówka, usuwa ankietę. W zamkniętej ankiecie to jedyny przycisk, bo kłódki już nie ma. Nie ma potwierdzenia, a głosy też zostają usunięte.',
  'help.guide.close-poll.result':
    'Usunięta ankieta znika z panelu każdego uczestnika. Ankieta, którą tylko zamknąłeś, pozostaje widoczna na dole razem z wynikiem.',
  'help.guide.close-poll.tip.1':
    'Zamknięcia nie da się cofnąć: ankiety nie można ponownie otworzyć. Ankietę zamkniętą przez pomyłkę trzeba utworzyć jeszcze raz.',
  'help.guide.close-poll.tip.2': '„Usuń” od razu i bez potwierdzenia usuwa ankietę i wszystkie głosy dla wszystkich.',
  // whats-next
  'help.guide.whats-next.title': 'Panel „Co dalej”',
  'help.guide.whats-next.goal': 'Zobacz, co grupa robi dalej, bez otwierania planu.',
  'help.guide.whats-next.step.1':
    'Karta pokazuje nadchodzące przystanki podróży, maksymalnie osiem, w kolejności czasowej, pogrupowane pod nagłówkami dni: „Dzisiaj”, „Jutro” albo data, a obok tytuł dnia, jeśli go ma. W nagłówku karty widać ich liczbę.',
  'help.guide.whats-next.step.2':
    'Po lewej stronie każdego przystanku widać jego godzinę: początek, „do” i koniec, jeśli przystanek go ma, albo TBD, jeśli godzina nie jest jeszcze ustawiona.',
  'help.guide.whats-next.step.3':
    'Obok są nazwa, adres i, w formie chipów, osoby przypisane do przystanku. Jeśli nikt nie jest przypisany, widać wszystkich uczestników podróży.',
  'help.guide.whats-next.result':
    'Lista nadchodzących punktów tylko do odczytu: odzwierciedla plan i nic tutaj go nie zmienia.',
  'help.guide.whats-next.tip.1':
    'Tutaj niczego nie ustawiasz. Godziny pochodzą z planu dnia; gdy je tam zmienisz, ta lista od razu się zaktualizuje.',
  'help.guide.whats-next.tip.2':
    'Lista pokazuje tylko to, co jeszcze przed Tobą: przystanek znika, gdy minie jego godzina rozpoczęcia, dzisiejszy przystanek bez godziny zostaje do końca dnia, a po zakończeniu podróży panel jest pusty.',
  'help.guide.whats-next.tip.3':
    '„Co dalej” ma własny przełącznik w „Dodatkach”, pod „Współpracą”. To panel tylko na komputer: zakładka „Współpraca” w aplikacji na telefon go nie pokazuje.',
  // trip-chat
  'help.guide.trip-chat.title': 'Rozmawiaj z grupą',
  'help.guide.trip-chat.goal': 'Wyślij wiadomość, odpowiedz na konkretną wiadomość, zareaguj na inną i usuń własną.',
  'help.guide.trip-chat.step.1':
    'Wpisz tekst w polu „Napisz wiadomość...” i naciśnij Enter. Okrągła strzałka obok pola działa tak samo. Shift i Enter wstawiają nowy wiersz.',
  'help.guide.trip-chat.step.2':
    'Buźka otwiera wybór emoji z kategoriami Smileys, Reactions i Travel. Wybrane emoji zostaje dodane do pisanego tekstu. Nie jest wysyłane samo.',
  'help.guide.trip-chat.step.3':
    'Najedź na wiadomość innej osoby: w jej rogu pojawi się mały okrągły przycisk. To „Odpowiedz”.',
  'help.guide.trip-chat.step.4':
    'Wiadomość, na którą odpowiadasz, jest cytowana nad polem tekstowym. Napisz i wyślij wiadomość, a cytat zostanie wysłany razem z nią. Aby usunąć cytat, kliknij na nim krzyżyk.',
  'help.guide.trip-chat.step.5':
    'Kliknij wiadomość prawym przyciskiem, aby zobaczyć osiem szybkich reakcji. Twoja reakcja pojawi się pod wiadomością. Kliknij tę samą reakcję ponownie, aby ją usunąć.',
  'help.guide.trip-chat.step.6':
    'Przy własnych wiadomościach obok Odpowiedz jest Usuń, czyli ikona kosza. Usuwa wiadomość od razu, a w jej miejscu zostaje informacja, że ją usunąłeś. Tego nie można cofnąć.',
  'help.guide.trip-chat.result':
    'Twoja odpowiedź jest najnowszą wiadomością, a cytowana wiadomość widnieje na jej górze. Twoja reakcja pojawia się pod drugą wiadomością. W miejscu usuniętej wiadomości widać informację, że ją usunąłeś.',
  'help.guide.trip-chat.tip.1':
    'Enter wysyła wiadomość, Shift i Enter wstawiają nowy wiersz. Wiadomość zawierająca tylko od jednego do trzech emoji jest wyświetlana w dużym rozmiarze.',
  'help.guide.trip-chat.tip.2':
    'Za pomocą „Dołącz obrazy” dodasz do jednej wiadomości maksymalnie cztery zdjęcia. Możesz je też wkleić lub upuścić na pole tekstowe.',
  'help.guide.trip-chat.tip.3':
    'Pod wiadomością z linkiem pojawia się karta podglądu pobrana przez Twój własny serwer TREK, więc link do zasobu dostępnego tylko dla Ciebie pozostaje zwykłym linkiem.',
  'help.guide.trip-chat.tip.4':
    '„Czat” ma własny przełącznik w „Dodatkach”, pod „Współpracą”: administrator może go wyłączyć, zostawiając włączone notatki, linki, ankiety i „Co dalej”.',

  // ── Screen: trip-lists ────────────────────────────────────────────────────────────────
  'help.ctx.trip-lists.title': 'Listy',
  'help.ctx.trip-lists.summary':
    'Dwie listy do jednej podróży: lista rzeczy do spakowania, z informacją, kto co zabiera i ile to waży, oraz lista zadań ze wszystkim, co trzeba zrobić przed podróżą i w jej trakcie. Zakładka jest widoczna, gdy włączony jest dodatek „Listy”.',
  'help.ctx.trip-lists.bullet.1':
    'Przyciski „Lista pakowania” i „Do zrobienia” na pasku u góry przełączają między obiema listami i pokazują liczbę pozycji na każdej. Przyciski na prawym końcu paska dotyczą listy, która jest otwarta.',
  'help.ctx.trip-lists.bullet.2':
    'Lista pakowania dzieli się na listy o dowolnych nazwach, np. „Dokumenty” albo „Ubrania”. Każda lista to osobna karta. W jej nagłówku jest uchwyt do przeciągania całej listy w inne miejsce, kolorowa kropka, plakietka ze spakowanymi przedmiotami z ogólnej liczby, trzy kropki z opcjami „Zmień nazwę”, „Zaznacz wszystko”, „Odznacz wszystko” i „Usuń listę” oraz strzałka zwijająca kartę. „Dodaj listę” na pasku powyżej tworzy nową listę.',
  'help.ctx.trip-lists.bullet.3':
    'Wiersz zawiera uchwyt do przeciągania, pole wyboru i nazwę, a potem mały awatar osoby, która zabiera przedmiot. Przedmiot o ilości większej niż jeden ma też licznik spakowanych sztuk, np. 3/10, z minusem i plusem. Dalej jest ilość jako mała plakietka, a przy włączonej „Kontroli bagażu” także waga w gramach i kółko torby, potem kosz i menu trzech kropek z opcjami „Przenieś do listy”, „Udostępnianie”, „Zmień nazwę” i „Usuń”. Nieużywane w danym wierszu przyciski są przygaszone, dopóki na nie nie najedziesz.',
  'help.ctx.trip-lists.bullet.4':
    '„Udostępnione” i „Moja lista” dzielą listę pakowania na dwie części: listę widoczną dla wszystkich i twoją własną. „Wszystkie”, „Otwarte” i „Gotowe” obok zawężają tę, która jest otwarta. „Od A do Z” na końcu wiersza sortuje przedmioty każdej listy alfabetycznie, a ponowne kliknięcie przywraca twoją kolejność. Karta postępu powyżej pokazuje, ile jest spakowane.',
  'help.ctx.trip-lists.bullet.5':
    '„Zastosuj szablon” i „Zapisz jako szablon” wypełniają listę lub ją zapisują, żebyś nie musiał jej wpisywać. Dwie ikony za nimi, „Eksportuj” i „Importuj”, eksportują listę jako wydruk, PDF lub plik oraz importują listę. Czerwony przycisk na prawym końcu karty postępu pokazuje, ile przedmiotów jest odhaczonych, i je usuwa.',
  'help.ctx.trip-lists.bullet.6':
    '„Do zrobienia” ma własny pasek boczny: kartę postępu, filtry „Wszystkie”, „Moje zadania”, „Przeterminowane” i „Gotowe”, po jednym wierszu na każdą listę i pod nimi „Dodaj listę”. Zadania są na karcie, której nagłówek pokazuje nazwę filtru i sortowanie: „Priorytet” lub „Termin”. Kliknij zadanie, aby otworzyć je w panelu po prawej. „Nowe zadanie” na pasku otwiera okno „Nowe zadanie”.',
  // packing-categories
  'help.guide.packing-categories.title': 'Zbuduj listę pakowania',
  'help.guide.packing-categories.goal':
    'Pogrupuj rzeczy, które zabierasz, w listy, dodaj do nich przedmioty i wybierz, kto odpowiada za każdą listę.',
  'help.guide.packing-categories.step.1':
    'Kliknij „Dodaj listę” na pasku nad listami. Otworzy się małe okno. Wpisz nazwę w górnym pasku, w polu „Nazwa listy (np. Odzież)”, i kliknij „Dodaj”.',
  'help.guide.packing-categories.step.2':
    'Nowa lista zaczyna się od wiersza zastępczego, w którym widać tylko trzy blade kropki. Kliknij „Dodaj pozycję” na dole wiersza, wpisz przedmiot w polu „Nazwa przedmiotu...” i naciśnij Enter: pierwszy przedmiot zastąpi wiersz zastępczy, a pole pozostanie otwarte na kolejny.',
  'help.guide.packing-categories.step.3':
    'Aby zmienić nazwę wiersza, kliknij ją albo wybierz „Zmień nazwę” w menu z trzema kropkami na prawym końcu wiersza.',
  'help.guide.packing-categories.step.4':
    'Przerywane kółko z sylwetką w górnym pasku listy przypisuje do niej uczestników podróży. Wybierz imię. Aby usunąć tę osobę, kliknij plakietkę, która się pojawi.',
  'help.guide.packing-categories.step.5':
    'Trzy kropki obok licznika otwierają więcej opcji: „Zmień nazwę”, „Zaznacz wszystko”, „Odznacz wszystko” i „Usuń listę”. „Usuń listę” usuwa listę i wszystkie jej przedmioty bez dodatkowego pytania. Strzałka na samym prawym końcu zwija listę.',
  'help.guide.packing-categories.result':
    'Nowa lista pojawia się w siatce razem z przedmiotami pod nią i kolorową kropką, a jej plakietka liczy, ile jest już spakowane.',
  'help.guide.packing-categories.tip.1':
    'Lista istnieje tylko dzięki swoim przedmiotom. Gdy usuniesz ostatni, wiersz zmieni się w zastępczy, żeby lista zachowała swoje miejsce i kolor; gdy usuniesz i ten wiersz, lista zniknie.',
  'help.guide.packing-categories.tip.2':
    'Gdy przypiszesz kogoś do listy, dostanie powiadomienie o pakowaniu. Nie zmienia to tego, kto widzi przedmioty. To ustawiasz w „Udostępnianie”, w menu trzech kropek wiersza.',
  'help.guide.packing-categories.tip.3':
    'Dwie listy mogą mieć tę samą nazwę. TREK rozróżnia je wewnętrznie, więc nazwy pozostają takie, jak je wpisałeś.',
  // check-off-packing
  'help.guide.check-off-packing.title': 'Odhaczanie rzeczy podczas pakowania',
  'help.guide.check-off-packing.goal':
    'Odhaczaj, co jest już w torbie, śledź pasek postępu i usuwaj spakowane przedmioty.',
  'help.guide.check-off-packing.step.1':
    'Kliknij pole po lewej stronie wiersza. Nazwa zostanie przekreślona, a pasek postępu się zaktualizuje.',
  'help.guide.check-off-packing.step.2':
    'Karta postępu nad listami pokazuje, ile przedmiotów jest spakowanych z wszystkich na liście: jako liczbę, jako procent i jako pasek.',
  'help.guide.check-off-packing.step.3':
    'Aby odhaczyć całą listę naraz, użyj trzech kropek w jej nagłówku: znajdziesz tam „Zaznacz wszystko” i „Odznacz wszystko”.',
  'help.guide.check-off-packing.step.4':
    '„Wszystkie”, „Otwarte” i „Gotowe” obok „Udostępniona” i „Moja lista” filtrują siatkę. „Otwarte” pokazuje tylko to, czego jeszcze brakuje, więc w pełni spakowana lista znika z widoku.',
  'help.guide.check-off-packing.step.5':
    'Czerwony przycisk „Usuń … zaznaczone” na prawym końcu karty postępu, z liczbą zaznaczonych przedmiotów, usuwa je wszystkie naraz po jednym potwierdzeniu w przeglądarce.',
  'help.guide.check-off-packing.result':
    'Widać tylko otwarte przedmioty, a pasek u góry pokazuje, jaka część pakowania jest już gotowa.',
  'help.guide.check-off-packing.tip.1': 'Nazwę odhaczonego przedmiotu nadal możesz zmienić: kliknij ją.',
  'help.guide.check-off-packing.tip.2':
    '„Zaznacz wszystko” i „Odznacz wszystko” działają na jedną listę naraz, z menu trzech kropek tej listy.',
  'help.guide.check-off-packing.tip.3':
    'Gdy wszystkie przedmioty są odhaczone, zamiast licznika pojawia się „Wszystko spakowane!”, a pasek robi się zielony.',
  // apply-packing-template
  'help.guide.apply-packing-template.title': 'Zastosuj szablon pakowania',
  'help.guide.apply-packing-template.goal': 'Dodaj do podróży gotową listę i zapisz listę z tej podróży na następną.',
  'help.guide.apply-packing-template.step.1': 'Kliknij „Zastosuj szablon” na pasku nad listą.',
  'help.guide.apply-packing-template.step.2': 'Wybierz szablon. Każdy wiersz pokazuje jego nazwę i liczbę przedmiotów.',
  'help.guide.apply-packing-template.step.3':
    'Przedmioty są dodawane do widoku, w którym jesteś: „Udostępniona” dodaje je do wspólnej listy, którą widzą wszyscy, a „Moja lista” do Twojej własnej listy.',
  'help.guide.apply-packing-template.step.4':
    'Aby zachować listę z tej podróży na następną, kliknij „Zapisz jako szablon”. Otworzy się małe okno. Wpisz nazwę w polu u góry, w którym widnieje „Nazwa szablonu”, i kliknij „Zapisz”.',
  'help.guide.apply-packing-template.result':
    'Listy i przedmioty z szablonu zostają dodane do podróży, obok tego, co już w niej było.',
  'help.guide.apply-packing-template.tip.1':
    'Szablon kopiuje listę, ilość, wagę i torbę każdego przedmiotu oraz tworzy torbę, której podróż jeszcze nie ma. Zaznaczenia nie są kopiowane, a nic z tego, co już jest na liście, nie jest usuwane.',
  'help.guide.apply-packing-template.tip.2':
    'Zastosuj szablon jest dostępne dopiero wtedy, gdy istnieje jakiś szablon. Bez niego przycisk w ogóle się nie pojawia.',
  'help.guide.apply-packing-template.tip.3':
    '„Zapisz jako szablon” widzi tylko administrator instancji i tylko wtedy, gdy lista ma przedmioty. Zapisywane są wspólne przedmioty i Twoje własne, nigdy prywatne przedmioty innych członków.',
  // import-packing-list
  'help.guide.import-packing-list.title': 'Wklej całą listę rzeczy do spakowania',
  'help.guide.import-packing-list.goal':
    'Zamień listę, którą masz już gdzie indziej, w przedmioty do spakowania za jednym razem.',
  'help.guide.import-packing-list.step.1':
    'Kliknij „Importuj”, czyli ikonę ze strzałką w dół na prawym końcu paska nad listą.',
  'help.guide.import-packing-list.step.2':
    'Jedna pozycja w wierszu: kategoria, nazwa, waga w g (opcjonalnie), torba (opcjonalnie), checked/unchecked (opcjonalnie). Szary przykład w polu pokazuje wszystkie cztery formaty, a numery przy lewej krawędzi liczą wpisane wiersze. Działa też lista w Markdown: nagłówek nadaje nazwę liście, a "- [ ]" i "- [x]" stają się pozycjami.',
  'help.guide.import-packing-list.step.3':
    'Możesz też wczytać wiersze z pliku przyciskiem „Załaduj CSV/TXT/MD” w lewym dolnym rogu okna. Obsługuje pliki .csv, .txt i .md i zastępuje zawartość pola.',
  'help.guide.import-packing-list.step.4':
    'Kliknij Importuj 3 w prawym dolnym rogu. Liczba na przycisku to liczba wierszy, które TREK zrozumiał.',
  'help.guide.import-packing-list.result':
    'Każdy wiersz staje się pozycją na liście wskazanej w jego pierwszym polu. Przedmioty, które już tam były, się nie zmieniają.',
  'help.guide.import-packing-list.tip.1':
    'Pola rozdzielają przecinki, średniki i tabulatory, a cudzysłów proste trzymają pole w całości, więc "Koszula, niebieska" pozostaje jedną nazwą. Wiersz z jedną wartością to po prostu nazwa. Wiersz bez własnej listy trafia do „Inne”. "3x" przed nazwą ustawia ilość.',
  'help.guide.import-packing-list.tip.2':
    'Jeśli torby podanej w czwartym polu nie ma jeszcze w podróży, TREK ją utworzy. „Importuj” i „Zastosuj szablon” to dwa sposoby na dodanie wag i toreb do wielu przedmiotów naraz.',
  // export-packing-list
  'help.guide.export-packing-list.title': 'Wydrukuj lub wyeksportuj listę rzeczy do spakowania',
  'help.guide.export-packing-list.goal':
    'Wydrukuj listę, zapisz ją jako PDF albo wyeksportuj do pliku dla innej aplikacji lub na następną podróż.',
  'help.guide.export-packing-list.step.1':
    'Kliknij „Eksportuj”, czyli ikonę ze strzałką w górę na pasku nad listą, tuż przed „Importuj”.',
  'help.guide.export-packing-list.step.2':
    '„Lista kontrolna w Markdown (.md)” i „CSV do importu (.csv)” od razu zapisują listę jako plik.',
  'help.guide.export-packing-list.step.3':
    'Kliknij Drukuj lub zapisz jako PDF. Podgląd pokazuje listę jako stronę: na górze podróż, jej daty i ile jest spakowane, a niżej każdą listę jako kartę, a każdy przedmiot z polem do zaznaczenia.',
  'help.guide.export-packing-list.step.4':
    'Kliknij „Drukuj lub zapisz jako PDF” pod podglądem. Przeglądarka otworzy okno drukowania: wybierz drukarkę albo „Zapisz jako PDF”, aby zapisać plik.',
  'help.guide.export-packing-list.result':
    'Wydruk i pliki zawierają otwarty widok, „Udostępniona” albo „Moja lista”, z ilościami, wagami i zaznaczeniami.',
  'help.guide.export-packing-list.tip.1':
    'Plik CSV ma format, który odczytuje „Importuj”, razem z bagażami, więc możesz go używać jako własnego szablonu: zaimportuj go do następnej podróży.',
  'help.guide.export-packing-list.tip.2':
    'Plik Markdown otwiera się jako lista kontrolna w Obsidianie, Notion lub na GitHubie i możesz go ponownie zaimportować przyciskiem „Importuj”.',
  // share-packing-item
  'help.guide.share-packing-item.title': 'Kto widzi przedmiot i kto go zabiera',
  'help.guide.share-packing-item.goal':
    'Przenoś przedmiot między wspólną pulą grupy, swoją listą i osobami, dla których go zabierasz.',
  'help.guide.share-packing-item.step.1':
    'Nad listami Udostępniona to lista, którą widzą wszyscy, a Moja lista to Twoja własna. Każda pokazuje liczbę swoich przedmiotów. Kliknij Moja lista, aby zobaczyć swoją.',
  'help.guide.share-packing-item.step.2':
    'W sekcji „Udostępniona” otwórz trzy kropki na końcu wiersza i kliknij „Udostępnianie”.',
  'help.guide.share-packing-item.step.3':
    'Do wyboru są trzy poziomy: „Udostępniona”, widoczny dla wszystkich w grupie; „Osobiste”, widoczny tylko dla Ciebie; oraz „Udostępnij osobom…”, w którym wybierasz osoby, których dotyczy przedmiot.',
  'help.guide.share-packing-item.step.4':
    'Przedmiot „Osobiste” jest tylko na „Moja lista”. Przełącz się na „Moja lista”, aby go znaleźć.',
  'help.guide.share-packing-item.step.5':
    'Ponownie otwórz „Udostępnianie” i zaznacz imię w sekcji „Udostępnij osobom…”. Przedmiot pojawi się też na liście tej osoby, a przy wierszu pojawi się mała plakietka z liczbą osób, którym go udostępniono.',
  'help.guide.share-packing-item.result': 'Przedmiot jest na wybranym poziomie, a wiersz pokazuje, kto go zabiera.',
  'help.guide.share-packing-item.tip.1':
    'Udostępnianie przedmiotu może zmienić tylko osoba, która go zabiera. Osoba, której go udostępniłeś, widzi go na swojej „Mojej liście” z małą plakietką z dłonią, która po najechaniu pokazuje Twoje imię. Może go odhaczyć.',
  'help.guide.share-packing-item.tip.2':
    'Przy wspólnym przedmiocie, który przynosi ktoś inny, menu z trzema kropkami zamiast Udostępnianie pokazuje dwie inne pozycje: Ja też mogę to wziąć, która dopisuje Cię obok tej osoby, i Kopiuj do mojej listy, która tworzy prywatną kopię dla Ciebie.',
  'help.guide.share-packing-item.tip.3':
    'Udostępnianie nowych przedmiotów zależy od widoku, w którym je dodajesz. Przedmioty dodane w „Udostępnione” są udostępnione wszystkim. Przedmioty dodane w „Moja lista” są „Osobiste”, chyba że każdy przedmiot tej listy jest udostępniony tym samym osobom: wtedy nowy przedmiot też jest im udostępniony.',
  // packing-bags
  'help.guide.packing-bags.title': 'Zważ bagaże',
  'help.guide.packing-bags.goal':
    'Przypisz wagę każdemu przedmiotowi, rozłóż przedmioty do bagaży i pilnuj, żeby każdy bagaż mieścił się w limicie linii lotniczej.',
  'help.guide.packing-bags.step.1': 'Kliknij plakietkę wagi przed kółkiem i wpisz wagę przedmiotu w gramach.',
  'help.guide.packing-bags.step.2': 'Kółko za wagą oznacza torbę, do której należy przedmiot. Kliknij je.',
  'help.guide.packing-bags.step.3':
    'Jeśli nie masz jeszcze torby, kliknij „Dodaj torbę”, wpisz nazwę i naciśnij Enter. Torba zostanie utworzona, a przedmiot od razu do niej trafi.',
  'help.guide.packing-bags.step.4':
    'Karta „Torby” pojawia się po prawej stronie list, gdy tylko istnieje jakaś torba. Każda torba pokazuje nazwę, osobę, która ją niesie, pasek zapełnienia, liczbę przedmiotów i wagę. Pod torbami są „Nieprzypisane” i „Waga całkowita”, a niżej „Spakowane”: waga już spakowanych rzeczy i cienki pasek pokazujący jej udział.',
  'help.guide.packing-bags.step.5':
    'Kliknij „Ustaw limit” obok wagi torby i wpisz limit w kilogramach, tak jak podają go linie lotnicze.',
  'help.guide.packing-bags.step.6':
    'Przerywany plus na końcu wiersza z nazwą torby, tuż przed krzyżykiem, otwiera „Przypisz członków”. Zaznacz osoby, które niosą torbę: pojawią się obok plusa, a sekcja „Na osobę” na dole karty pokaże, co niesie każda z nich.',
  'help.guide.packing-bags.result':
    'Karta „Torby” po prawej pokazuje wagę każdej torby w stosunku do jej limitu, rzeczy spoza toreb, to, co niesie każda osoba, oraz łączną wagę z informacją, ile z niej jest już spakowane.',
  'help.guide.packing-bags.tip.1':
    'Pole wagi, kółko torby i karta Torby istnieją tylko wtedy, gdy administrator włączył Kontrola bagażu w dodatku Listy. W węższym oknie torby otwierają się zamiast tego z przycisku Torby nad kartą postępu.',
  'help.guide.packing-bags.tip.2':
    'Serwer oblicza wagę bagażu na podstawie przedmiotów wszystkich członków, także tych, których nie widzisz, więc liczba pokazuje rzeczywistą wagę bagażu.',
  'help.guide.packing-bags.tip.3':
    'Bagaż bez limitu jest porównywany z najcięższym bagażem, dzięki czemu paski da się porównać. Jeśli ustawisz limit, pasek bagażu będzie mierzony względem tego limitu.',
  // create-todo
  'help.guide.create-todo.title': 'Dodaj zadanie',
  'help.guide.create-todo.goal': 'Zapisz zadanie z listą, priorytetem, datą i przypisaną osobą.',
  'help.guide.create-todo.step.1': 'Kliknij „Nowe zadanie” na prawym końcu paska.',
  'help.guide.create-todo.step.2':
    'Otworzy się okno „Nowe zadanie” z kursorem w nagłówku. Wpisz nazwę w polu „Nazwa zadania”, a wszystko, o czym chcesz pamiętać, dodaj w polu „Opis”.',
  'help.guide.create-todo.step.3':
    'Lista grupuje zadania. Wybierz jedną albo użyj plusa obok, aby w małym oknie nazwać nową.',
  'help.guide.create-todo.step.4': '„Priorytet” ma cztery przyciski: Brak, P1, P2 i P3, od czerwonego do niebieskiego.',
  'help.guide.create-todo.step.5':
    '„Termin” obok „Lista” otwiera kalendarz, a „Przypisano do” przypisuje zadanie konkretnej osobie.',
  'help.guide.create-todo.step.6': 'Kliknij „Utwórz zadanie”.',
  'help.guide.create-todo.result':
    'Zadanie jest na liście, z priorytetem, terminem i listą w formie plakietek oraz awatarem przypisanej osoby na końcu wiersza, i otwiera się w panelu po prawej.',
  'help.guide.create-todo.tip.1': 'Wymagana jest tylko nazwa. Resztę możesz uzupełnić później w panelu po prawej.',
  'help.guide.create-todo.tip.2': 'Gdy na pasku bocznym wybrana jest lista, nowe zadanie trafia do tej listy.',
  'help.guide.create-todo.tip.3': 'Enter w polu nazwy od razu tworzy zadanie, bez ruszania pozostałych pól.',
  // todo-filters
  'help.guide.todo-filters.title': 'Znajdź i zmień zadanie',
  'help.guide.todo-filters.goal': 'Pokaż tylko zadania, które są teraz ważne, a potem edytuj znalezione zadanie.',
  'help.guide.todo-filters.step.1':
    '„Zadania” na pasku bocznym: „Wszystkie” pokazuje wszystko, co jest jeszcze otwarte, „Moje zadania” to, co przypisano Tobie, „Przeterminowane” zadania z datą w przeszłości, a „Gotowe” ukończone zadania. Przy każdej pozycji widać liczbę zadań. Kliknij „Przeterminowane”.',
  'help.guide.todo-filters.step.2':
    'W sekcji „Listy” każda lista ma swój wiersz. Wybierz jedną, aby ją wyświetlić, razem z ukończonymi zadaniami.',
  'help.guide.todo-filters.step.3':
    'Sortowanie u góry listy zmienia kolejność wyświetlanych zadań: „Priorytet” stawia na początku P1, a „Termin” zadanie z najbliższym terminem. Naraz możesz użyć tylko jednej z tych opcji, a drugie kliknięcie przywraca Twoją własną kolejność.',
  'help.guide.todo-filters.step.4': 'Kliknij zadanie, aby otworzyć je w panelu po prawej.',
  'help.guide.todo-filters.step.5':
    'Zmień, co trzeba: nazwę, Priorytet, Lista, Termin lub Przypisano do. Opis pokazuje tekst z działającymi linkami, a kliknięcie w niego pozwala go edytować. Potem kliknij Zapisz zmiany na dole panelu. Pole w nagłówku panelu oznacza zadanie jako wykonane, a Usuń obok Zapisz zmiany usuwa je od razu.',
  'help.guide.todo-filters.result':
    'Lista pokazuje tylko wybrane zadania, a panel po prawej edytuje to zadanie, które wybrałeś.',
  'help.guide.todo-filters.tip.1':
    'Wiersz listy liczy tylko otwarte zadania, ale gdy go wybierzesz, zobaczysz też ukończone. „Wszystkie”, „Moje zadania” i „Przeterminowane” ukrywają ukończone zadania, a „Gotowe” pokazuje tylko ukończone.',
  'help.guide.todo-filters.tip.2':
    'W sortowaniu nie można jednocześnie użyć „Priorytet” i „Termin”. Gdy którekolwiek z nich jest włączone, nie da się przeciągać wierszy, by ustawić własną kolejność.',

  // ── Screen: trip-bookings ─────────────────────────────────────────────────────────────
  'help.ctx.trip-bookings.title': 'Rezerwacje',
  'help.ctx.trip-bookings.summary':
    'Na tej karcie jest wszystko, co zarezerwowano na podróż, oprócz transportu: noclegi, stoliki, bilety, wycieczki i parkingi. Każda rezerwacja to karta, wiersz listy lub pasek na osi czasu, z kodem, dokumentami, podróżnymi i kosztem. Kliknij rezerwację, aby otworzyć szczegóły.',
  'help.ctx.trip-bookings.bullet.1':
    '„Rezerwacja ręczna” na prawym końcu paska otwiera „Nowa rezerwacja”. Można w ten sposób utworzyć sześć rodzajów rezerwacji: „Nocleg”, „Restauracja”, „Wydarzenie”, „Wycieczka”, parking i „Inne”. Loty, pociągi i inny transport są w zakładce „Transport” i nigdy się tu nie pojawiają.',
  'help.ctx.trip-bookings.bullet.2':
    'Ikona pobierania przed „Rezerwacja ręczna”, czyli „Importuj potwierdzenia rezerwacji”, przesyła potwierdzenia, żeby TREK mógł je automatycznie odczytać: EML, PDF, PKPass, HTML lub TXT, maksymalnie pięć plików po 10 MB, a także zdjęcia, jeśli model AI odczytuje obrazy. Ikona jest widoczna tylko wtedy, gdy serwer potrafi je odczytać.',
  'help.ctx.trip-bookings.bullet.3':
    'Szukaj przeszukuje tytuły, rodzaje, miejsca, notatki, kody rezerwacji i uczestników. Filtruj, czyli lejek obok, zawęża zakładkę według Status, według Typ (z liczbą przy każdym) i według Podróżni, gdy rezerwacja wymienia osoby. Liczba na lejku pokazuje, ile filtrów jest aktywnych.',
  'help.ctx.trip-bookings.bullet.4':
    'Trzy ikony za „Filtruj” przełączają widok: „Karty”, „Lista” i „Oś czasu”. „Opcje widoku”, czyli suwaki obok, grupują i sortują karty oraz listę albo ustawiają pasy osi czasu, a ikona arkusza za nimi, „Eksportuj jako arkusz kalkulacyjny (CSV)”, pobiera zawartość karty jako plik. Domyślnie karty są pogrupowane na „Potwierdzono” i „Oczekujące”, a lista według dni. Kliknij nagłówek sekcji, żeby ją zwinąć.',
  'help.ctx.trip-bookings.bullet.5':
    'Karta ma nagłówek w kolorze statusu, a w nim kropkę statusu (kliknięcie przełącza między „Oczekujące” i „Potwierdzono”), typ, tytuł, ołówek i kosz. Poniżej są szczegóły, które ma rezerwacja: Data, Czas, Kod rezerwacji, Zameldowanie i Wymeldowanie, Lokalizacja / Adres, Nocleg, Powiązano z (przystanek w planie), Link, Notatki, Podróżni, Pliki i powiązane koszty.',
  'help.ctx.trip-bookings.bullet.6':
    'Kliknięcie karty, wiersza lub paska otwiera szczegóły rezerwacji, a na dole „Na mapie” (jeśli rezerwacja ma miejsce), kosz i „Edytuj”. Przed usunięciem pojawia się jedno pytanie („Usunąć rezerwację?”, z informacją, czy razem z nią zostaną usunięte koszty). Potem rezerwacja i powiązane z nią wydatki zostają usunięte, a w przypadku noclegu jego noce znikają z planu dnia.',
  // booking-views
  'help.guide.booking-views.title': 'Przełącz widok i otwórz rezerwację',
  'help.guide.booking-views.goal':
    'Wyświetlaj rezerwacje jako karty, listę lub na osi czasu i otwórz jedną, aby zobaczyć wszystkie jej szczegóły.',
  'help.guide.booking-views.step.1':
    'Trzy ikony za „Filtruj” na pasku to widoki. Każda pokazuje swoją nazwę po najechaniu: „Karty”, „Lista” i „Oś czasu”. Zakładka otwiera się w widoku „Karty”, z osobną kartą dla każdej rezerwacji w sekcjach „Potwierdzono” i „Oczekujące”. Kliknij środkową ikonę, „Lista”.',
  'help.guide.booking-views.step.2':
    'Widok „Lista” pokazuje każdą rezerwację w osobnym wierszu pod nagłówkiem dnia, z dniem i godziną po prawej; klawiszami strzałek przechodzisz między wierszami. Kliknij „Oś czasu”, ostatnią z trzech ikon.',
  'help.guide.booking-views.step.3':
    '„Oś czasu” pokazuje rezerwacje na tle dni podróży: każdy typ ma swój pas, a każda rezerwacja to pasek od początku do końca. Oczekująca rezerwacja ma przerywany obrys. „Podróż” dopasowuje całą podróż do szerokości ekranu; kliknij nagłówek dnia, aby zobaczyć ten dzień godzina po godzinie.',
  'help.guide.booking-views.step.4':
    'Widok „Dzień” pokazuje jeden dzień na osi godzin, a długość każdego paska odpowiada czasowi trwania. Strzałki obok nazwy dnia przenoszą do poprzedniego i następnego dnia. W trakcie podróży „Dzisiaj” przechodzi do bieżącego dnia, a przełącznik „Podróż” i „Dzień” po prawej wraca do widoku całej podróży.',
  'help.guide.booking-views.step.5':
    'Najedź na pasek, aby zobaczyć jego dzień, godziny i miejsce, a potem kliknij go, aby otworzyć szczegóły rezerwacji. Karta w widoku Karty i wiersz w widoku Lista otwierają to samo okno.',
  'help.guide.booking-views.step.6':
    'W nagłówku widoku szczegółów są tytuł i plakietki statusu (kliknięcie go zmienia), typu, dnia i kodu rezerwacji, z przyciskiem do kopiowania kodu. Niżej są godziny w kafelkach, potem miejsce, podróżni, notatki, koszty i pliki, jeśli rezerwacja je ma, a na samym dole „Na mapie”, kosz i „Edytuj”.',
  'help.guide.booking-views.result':
    'Rezerwacja otwiera się w widoku szczegółów: „Edytuj” otwiera jej formularz, „Na mapie” pokazuje ją w planie, a „Zamknij” lub Escape przenosi Cię z powrotem do poprzedniego widoku.',
  'help.guide.booking-views.tip.1':
    '„Opcje widoku”, czyli ikona suwaków za ikonami widoków, pozwalają grupować i sortować widoki „Karty” i „Lista” za pomocą „Grupuj według” i „Sortuj według”. W widoku „Oś czasu” są tam opcje „Osobny pas dla każdego rodzaju” i „Pokaż drugą zakładkę”. „Pokaż drugą zakładkę” wyświetla wpisy z zakładki „Transport”, przygaszone, w wąskim pasie u góry. „Resetuj widok” przywraca ustawienia domyślne, a każda zakładka zapamiętuje swój widok w tej przeglądarce.',
  'help.guide.booking-views.tip.2':
    'Rezerwacja sprzed podróży, po podróży lub bez daty nie może pojawić się na osi czasu. Jest wyświetlana pod wykresem jako mała karta w sekcji „Przed podróżą”, „Po podróży” lub „Brak daty”.',
  'help.guide.booking-views.tip.3':
    'Te same szczegóły otwierają się wszędzie, gdzie pojawia się rezerwacja: w zakładce „Transport”, w planie dnia, w szczegółach dnia i w szczegółach miejsca. Kliknij tytuł, aby zmienić nazwę rezerwacji.',
  // create-booking
  'help.guide.create-booking.title': 'Tworzenie rezerwacji',
  'help.guide.create-booking.goal':
    'Dodaj do podróży ręcznie restaurację, wydarzenie, wycieczkę, miejsce parkingowe albo cokolwiek innego.',
  'help.guide.create-booking.step.1':
    'Kliknij „Rezerwacja ręczna” na prawym końcu paska. Otworzy się „Nowa rezerwacja” z tytułem i dwiema plakietkami w nagłówku u góry.',
  'help.guide.create-booking.step.2':
    'Kliknij etykietę typu w górnym pasku, która przy nowej rezerwacji ma napis „Inne”, i wybierz „Rodzaj rezerwacji”. W tej zakładce utworzysz sześć typów: Nocleg, Restauracja, Wydarzenie, Wycieczka, Parking i Inne. Formularz zmienia się zależnie od wyboru: tylko „Nocleg” zamiast dat używa zakresu dni.',
  'help.guide.create-booking.step.3':
    'Wpisz tytuł w górnym pasku, w polu nad plakietkami. To jedyne wymagane pole, a przycisk „Dodaj” pozostaje wyszarzony, dopóki czegoś nie wpiszesz.',
  'help.guide.create-booking.step.4':
    'Ustaw Data i Godzina rozpoczęcia, a jeśli rezerwacja ma koniec, także Data końca i Godzina zakończenia. Kalendarze pokazują tylko dni z zakresu podróży. Data i godzina końca nie późniejsze niż początek są zaznaczone na czerwono i blokują Dodaj. Godzina końca wcześniejsza niż początku, bez daty końca, tylko ostrzega: jeśli rezerwacja kończy się następnego dnia, ustaw datę końca.',
  'help.guide.create-booking.step.5':
    'Wpisz kod rezerwacji z potwierdzenia w polu „Kod rezerwacji”, a potem kliknij plakietkę statusu w nagłówku, obok typu. W nowej rezerwacji widnieje na niej „Oczekujące”, a po kliknięciu zmienia się na „Potwierdzono”. Od statusu zależy, w której sekcji pojawi się karta.',
  'help.guide.create-booking.step.6': 'Kliknij „Dodaj” na dole formularza.',
  'help.guide.create-booking.result':
    'Rezerwacja pojawia się jako karta w swojej sekcji. Kolor nagłówka pokazuje status, a karta pokazuje typ, datę i godziny oraz kod. Wszyscy pozostali uczestnicy podróży od razu ją widzą.',
  'help.guide.create-booking.tip.1':
    'Lokalizacja / Adres podpowiada prawdziwe adresy podczas pisania. Wybranie jednego zastępuje to, co wpisałeś, a adres wpisany samodzielnie zostaje bez zmian.',
  'help.guide.create-booking.tip.2':
    'W polu „Link” wpisz adres strony rezerwacji u dostawcy. Na karcie i w widoku szczegółów pojawi się on jako link otwierany w nowej karcie.',
  'help.guide.create-booking.tip.3':
    'Notatki obsługują Markdown, więc lista lub pogrubiony wiersz są wyświetlane na karcie i w widoku szczegółów jako lista lub pogrubiony tekst.',
  // booking-hotel
  'help.guide.booking-hotel.title': 'Zarezerwuj nocleg',
  'help.guide.booking-hotel.goal':
    'Wpisz zakwaterowanie tak, aby od razu liczyło się jako rezerwacja i jako noclegi w planie dnia.',
  'help.guide.booking-hotel.step.1':
    'Kliknij „Rezerwacja ręczna” i wybierz „Nocleg” na plakietce typu w górnym pasku. Zamiast pól daty pojawi się blok pól hotelowych.',
  'help.guide.booking-hotel.step.2':
    'Wybierz hotel w polu „Nocleg”. Lista zawiera miejsca podróży, bez zaimportowanych śladów i wycieczek. Po wybraniu hotelu jego nazwa trafia do pustego pola tytułu, a adres do pola „Lokalizacja / Adres”.',
  'help.guide.booking-hotel.step.3':
    'Ustaw pola „Od” i „Do”: pierwszą noc i poranek wyjazdu. Oba pola proponują dni podróży z datami, a TREK pilnuje, żeby „Do” było po „Od”.',
  'help.guide.booking-hotel.step.4':
    'Wypełnij Zameldowanie, Check-in do i Wymeldowanie oraz Kod rezerwacji z potwierdzenia.',
  'help.guide.booking-hotel.step.5': 'Kliknij „Dodaj”.',
  'help.guide.booking-hotel.result':
    'Karta pokazuje zakres dni w polu „Data”, godziny zameldowania i wymeldowania oraz adres. Pobyt widać teraz także w tych dniach planu.',
  'help.guide.booking-hotel.tip.1':
    '„Nocleg” to jedyny typ bez pól „Data” i „Godzina rozpoczęcia”. Jego daty to „Od” i „Do”, a wybierasz w nich dni podróży, a nie daty z kalendarza.',
  'help.guide.booking-hotel.tip.2':
    'Zostaw pole „Nocleg” puste i wpisz zamiast tego adres: miejsce zostanie wyszukane, utworzone i przypięte na mapie automatycznie.',
  'help.guide.booking-hotel.tip.3': 'Gdy usuniesz rezerwację, jej noce również znikną z planu dnia.',
  // link-booking
  'help.guide.link-booking.title': 'Łączenie rezerwacji z planem',
  'help.guide.link-booking.goal':
    'Powiąż rezerwację z przystankiem i miejscem, żeby pojawiała się tam, gdzie jej potrzebujesz.',
  'help.guide.link-booking.step.1':
    'Najedź na kartę, którą chcesz powiązać, i kliknij ołówek w jej nagłówku. Otworzy się „Edytuj rezerwację”.',
  'help.guide.link-booking.step.2':
    'Otwórz „Przypisz do miejsca”. Lista pokazuje Twój plan: nagłówek dla każdego dnia, a pod nim przystanki z tego dnia, ponumerowane i z godzinami. Wybierz przystanek, do którego należy rezerwacja.',
  'help.guide.link-booking.step.3':
    '„Miejsce / Aktywność” wiąże samo miejsce. Wybierz je tam, a tytuł oraz „Lokalizacja / Adres” zostaną uzupełnione, jeśli są puste.',
  'help.guide.link-booking.step.4': 'Kliknij „Aktualizuj”.',
  'help.guide.link-booking.result':
    'Karta pokazuje dzień i przystanek w sekcji „Powiązano z”, a rezerwacja pojawia się przy tym przystanku w planie dnia.',
  'help.guide.link-booking.tip.1':
    '„Brak przypisania (samodzielna)” na górze listy usuwa powiązanie. Nocleg nie ma wyboru przystanku: jest powiązany przez swoje noce.',
  'help.guide.link-booking.tip.2':
    'Wybranie przystanku w dniu z datą wypełnia pustą Datę. Data, którą już ustawiłeś, nie zmienia się.',
  // booking-travelers
  'help.guide.booking-travelers.title': 'Wskaż, dla kogo jest rezerwacja',
  'help.guide.booking-travelers.goal':
    'Zaznacz, których podróżnych dotyczy rezerwacja, i wyświetlaj tylko ich rezerwacje.',
  'help.guide.booking-travelers.step.1':
    'Otwórz rezerwację ołówkiem na jej karcie. Pole „Podróżni” jest obok „Kodu rezerwacji”. Dopóki nikt nie jest przypisany do rezerwacji, widnieje w nim „Przypisz podróżnych”.',
  'help.guide.booking-travelers.step.2':
    'Kliknij je i wybierz osoby, których dotyczy rezerwacja; na liście są też goście z imienia. Przy wybranej osobie pojawia się znaczek wyboru, a jej awatar widać w polu. Kliknij imię ponownie, aby usunąć osobę.',
  'help.guide.booking-travelers.step.3': 'Kliknij „Aktualizuj”.',
  'help.guide.booking-travelers.step.4':
    'Kliknij „Filtruj” na pasku: w sekcji „Podróżni” kliknij osobę, aby zobaczyć tylko jej rezerwacje. Możesz wybrać kilka osób naraz.',
  'help.guide.booking-travelers.result':
    'Karta wypisuje osoby, których dotyczy rezerwacja, a Filtruj zawęża zakładkę do rezerwacji wybranych osób.',
  'help.guide.booking-travelers.tip.1':
    'Na karcie i w widoku szczegółów podróżni są tylko wyświetlani; nie da się ich tam zmienić. Ustawiasz ich tutaj, w formularzu.',
  'help.guide.booking-travelers.tip.2':
    '„Podróżni” pojawia się w „Filtruj”, gdy podróż ma więcej niż jednego członka, a co najmniej jedna rezerwacja ma przypisaną osobę. Twój wybór obowiązuje do zamknięcia karty przeglądarki.',
  // booking-files
  'help.guide.booking-files.title': 'Przechowuj voucher razem z rezerwacją',
  'help.guide.booking-files.goal': 'Dołącz potwierdzenie, bilet lub karnet do rezerwacji, której dotyczą.',
  'help.guide.booking-files.step.1':
    'Otwórz rezerwację ołówkiem na jej karcie. Sekcja „Pliki” jest obok „Podłącz”; kliknij tam „Załącz plik”. W istniejącej już rezerwacji dokument jest przesyłany od razu, a TREK wyświetla komunikat „Plik został przesłany”.',
  'help.guide.booking-files.step.2': 'Dokument jest wyświetlany z nazwą, przyciskiem do otwarcia i znakiem X obok.',
  'help.guide.booking-files.step.3':
    'Podlinkuj przesłany plik pokazuje dokumenty podróży, których nie ma jeszcze przy tej rezerwacji. Wybierz jeden, a zostanie dołączony bez ponownego przesyłania.',
  'help.guide.booking-files.step.4': 'Kliknij „Aktualizuj”.',
  'help.guide.booking-files.result':
    'Karta i widok szczegółów pokazują dokumenty w sekcji „Pliki”. Kliknij dokument, żeby go otworzyć. „Pokaż w plikach” nad listą w widoku szczegółów przenosi cię na kartę „Pliki”.',
  'help.guide.booking-files.tip.1':
    'Przy rezerwacji, którą dopiero tworzysz, dokument zostanie przesłany po kliknięciu „Dodaj”. Przesyłanie wymaga połączenia z internetem.',
  'help.guide.booking-files.tip.2':
    'Krzyżyk obok dokumentu usuwa powiązanie, a nie dokument. Dokument zostaje w zakładce „Pliki” podróży.',
  'help.guide.booking-files.tip.3':
    'Administrator ustala, jakie typy plików można załączać, w sekcji „Dozwolone typy plików”. Domyślnie dozwolone są dokumenty, pliki tekstowe i obrazy.',
  // booking-cost
  'help.guide.booking-cost.title': 'Zamiana ceny rezerwacji na wydatek',
  'help.guide.booking-cost.goal': 'Dodaj koszt rezerwacji do „Kosztów” i podziel go między osoby, które za nią płacą.',
  'help.guide.booking-cost.step.1':
    'Otwórz rezerwację ołówkiem na jej karcie i przewiń na dół formularza. W sekcji „Koszty” znajdziesz „Utwórz wydatek” i „Powiąż istniejący wydatek” z uwagą „Zapisuje rezerwację i otwiera edytor kosztów”.',
  'help.guide.booking-cost.step.2':
    'Kliknij Utwórz wydatek. Rezerwacja zostanie zapisana, jej formularz się zamknie, a edytor kosztów otworzy się jako Dodaj wydatek.',
  'help.guide.booking-cost.step.3':
    'Nazwa w nagłówku to już tytuł rezerwacji, a „Dzień” to już dzień rezerwacji. Wpisz „Łączna kwota” i sprawdź „Walutę” obok.',
  'help.guide.booking-cost.step.4':
    'Plakietka w nagłówku to „Kategoria”, ustawiona już zgodnie z typem rezerwacji. W „Kto zapłacił?” wybierz, kto zapłacił, a w „Podział” zdecyduj, jak podzielić kwotę.',
  'help.guide.booking-cost.step.5': 'Kliknij „Dodaj wydatek”.',
  'help.guide.booking-cost.result':
    'Karta pokazuje kwotę na dole, formularz rezerwacji wymienia wydatek w sekcji „Powiązane wydatki”, a ten sam wydatek pojawia się w zakładce „Koszty”, powiązany z tą rezerwacją.',
  'help.guide.booking-cost.tip.1':
    'Kategoria zależy od typu: „Restauracja” trafia do „Jedzenie i napoje”, „Nocleg” do „Nocleg”, parking do kategorii parkingu, a „Wydarzenie” i „Wycieczka” do „Inne”.',
  'help.guide.booking-cost.tip.2':
    'Rezerwacja może mieć kilka wydatków. „Powiąż istniejący wydatek” proponuje wydatki z „Kosztów”, które nie są jeszcze z niczym powiązane. Przy powiązanym wydatku „Odłącz, zachowaj wydatek” usuwa powiązanie i zostawia wydatek w „Kosztach”, a kosz go usuwa.',
  'help.guide.booking-cost.tip.3':
    'Sekcja „Koszty” jest w formularzu tylko wtedy, gdy włączony jest dodatek „Koszty”, który administrator włącza w „Dodatkach”.',
  // filter-bookings
  'help.guide.filter-bookings.title': 'Znajdź rezerwację',
  'help.guide.filter-bookings.goal': 'Filtruj długą zakładkę po słowie, statusie, typie lub osobie.',
  'help.guide.filter-bookings.step.1':
    'Wpisz tekst w polu „Szukaj” na pasku. Przeszukiwane są tytuły, typy, miejsca i adresy, notatki, kody rezerwacji i imiona podróżnych, a wyników ubywa w miarę pisania. Escape czyści pole.',
  'help.guide.filter-bookings.step.2':
    'Kliknij „Filtruj”, czyli lejek obok wyszukiwarki. Panel zawiera „Status”, „Typ” oraz, gdy jakaś rezerwacja ma przypisane osoby, „Podróżni”.',
  'help.guide.filter-bookings.step.3':
    'W sekcji „Status” wybierz „Potwierdzono” lub „Oczekujące”, aby zobaczyć tylko te rezerwacje; „Wszystkie” pokazuje obie grupy.',
  'help.guide.filter-bookings.step.4':
    'W sekcji „Typ” kliknij jeden lub kilka typów, aby zostawić tylko je. Przy każdym typie widać liczbę rezerwacji, a wybrane są oznaczone znaczkiem wyboru.',
  'help.guide.filter-bookings.step.5':
    'Liczba na przycisku „Filtruj” pokazuje, ile filtrów jest włączonych, a plakietka obok wyszukiwania pokazuje, ile rezerwacji zostało ze wszystkich. Kliknij plakietkę lub „Wyczyść filtry” na dole panelu, aby znów zobaczyć wszystko.',
  'help.guide.filter-bookings.result':
    'Zakładka pokazuje tylko to, co wybrałeś, tak samo w widokach Karty, Lista i Oś czasu. Filtry zostają dla tej podróży, dopóki nie zamkniesz karty przeglądarki.',
  'help.guide.filter-bookings.tip.1':
    'Filtr „Typ” pojawia się tylko wtedy, gdy zakładka zawiera więcej niż jeden typ, i wymienia tylko typy z tej zakładki. Jeśli więc nie ma w niej wycieczki, w filtrze „Typ” nie będzie opcji „Wycieczka”.',
  'help.guide.filter-bookings.tip.2':
    'Jeśli nic nie pasuje do filtra, w zakładce pojawia się komunikat „Nic nie pasuje do tych filtrów”, a tuż pod nim „Wyczyść filtry”.',
  // import-booking-file
  'help.guide.import-booking-file.title': 'Zaimportuj rezerwację z potwierdzenia',
  'help.guide.import-booking-file.goal':
    'Niech TREK odczyta rezerwację z e-maila lub pliku PDF od usługodawcy, żebyś nie musiał wpisywać jej ponownie.',
  'help.guide.import-booking-file.step.1':
    'Kliknij ikonę pobierania na pasku, „Importuj potwierdzenia rezerwacji”; nazwa pojawia się po najechaniu. Otworzy się okno o tej samej nazwie.',
  'help.guide.import-booking-file.step.2':
    'Upuść potwierdzenia na pole lub kliknij je i wybierz pliki: EML, PDF, PKPass, HTML i TXT, maksymalnie pięć plików po 10 MB, a także zdjęcia (JPG, PNG, WEBP), jeśli model AI obsługuje obrazy. Nazwy wybranych plików pojawią się w polu.',
  'help.guide.import-booking-file.step.3':
    'Kliknij „Importuj”. Okno od razu się zamyka, ponieważ odczyt odbywa się w tle.',
  'help.guide.import-booking-file.step.4':
    'Karta w prawym dolnym rogu pokazuje postęp pod nazwą pliku. Zostaje widoczna, gdy poruszasz się po aplikacji, i po przeładowaniu strony. Przetwarzanie plików… zmienia się w haczyk, gdy odczyt się zakończy, a karta oferuje Importuj. Kliknij go.',
  'help.guide.import-booking-file.step.5':
    'Każda znaleziona rezerwacja otwiera się po kolei w oknie „Nowa rezerwacja”, już wypełniona. W przypadku hotelu tytułem jest jego nazwa, a jeśli podróż zawiera to miejsce, wypełnione są też: „Nocleg”, „Lokalizacja / Adres”, „Od” i „Do” dla jego nocy, „Zameldowanie” i „Wymeldowanie”, „Kod rezerwacji”, potwierdzenie w sekcji „Pliki”, a przy włączonych Kosztach cena jako „Powiązany wydatek”. Sprawdź dane i kliknij „Dodaj”.',
  'help.guide.import-booking-file.result':
    'Rezerwacja pojawia się jako karta w sekcji „Oczekujące”, z nocami, kodem i potwierdzeniem w sekcji „Pliki”. Pobyt widać w tych dniach planu. Gdy Koszty są włączone, cena zostaje dodana jako wydatek powiązany z rezerwacją.',
  'help.guide.import-booking-file.tip.1':
    'Ikona importu jest widoczna tylko wtedy, gdy serwer potrafi odczytywać potwierdzenia. Wymaga to ekstraktora albo dodatku „Analiza AI”, który administrator włącza w sekcji „Dodatki”. W zakładce bez rezerwacji import jest też dostępny jako przycisk „Importuj z pliku”.',
  'help.guide.import-booking-file.tip.2':
    'Jeśli nie udało się nic odczytać, karta Cię o tym poinformuje. Gdy „Analiza AI” jest włączona, pojawi się opcja „Spróbuj odczytać przez AI”, która wysyła te same pliki bezpośrednio do modelu. Wynik odczytu jest przechowywany przez dziesięć minut, więc w tym czasie rozpocznij jego sprawdzanie.',
  'help.guide.import-booking-file.tip.3':
    'Potwierdzenie jest załączane tylko wtedy, gdy jego typ jest na liście „Dozwolone typy plików” w ustawieniach administratora. PDF jest dozwolony domyślnie, a e-mail (EML) trzeba najpierw dodać, w przeciwnym razie rezerwacja zostanie zapisana bez niego.',
  // edit-booking
  'help.guide.edit-booking.title': 'Zmiana rezerwacji',
  'help.guide.edit-booking.goal':
    'Popraw godzinę, dopisz kod, który przyszedł później, albo zmień status rezerwacji z Oczekujące na Potwierdzono.',
  'help.guide.edit-booking.step.1':
    'Najedź na kartę i kliknij ołówek w jej nagłówku. Otworzy się „Edytuj rezerwację” ze wszystkimi szczegółami rezerwacji.',
  'help.guide.edit-booking.step.2':
    'Zmień, co trzeba, na przykład „Kod rezerwacji”, który przewoźnik przysłał później.',
  'help.guide.edit-booking.step.3':
    'Kliknij plakietkę „Oczekujące” w górnym pasku. Zmieni się na „Potwierdzono”, a pasek stanie się zielony.',
  'help.guide.edit-booking.step.4': 'Kliknij „Aktualizuj”.',
  'help.guide.edit-booking.result':
    'Karta się przesuwa: potwierdzona rezerwacja trafia do sekcji „Potwierdzono” z zieloną kropką i zielonym górnym paskiem, a wszyscy uczestnicy podróży widzą tę zmianę.',
  'help.guide.edit-booking.tip.1':
    'Jeśli nie możesz odczytać kodu rezerwacji, w „Ustawieniach”, w sekcji „Wygląd”, włączona jest opcja „Rozmyj kody rezerwacji”. Najedź na kod lub go kliknij, aby go odczytać.',
  'help.guide.edit-booking.tip.2':
    'Jeśli zmienisz rodzaj, kategoria powiązanego wydatku zmieni się razem z nim, chyba że wybrałeś kategorię ręcznie w edytorze kosztów.',
  'help.guide.edit-booking.tip.3':
    'Przycisk „Edytuj” na dole widoku szczegółów rezerwacji otwiera ten sam formularz. Status zmienisz też bez formularza: kliknij kropkę na karcie lub w wierszu albo plakietkę statusu w widoku szczegółów.',
  // delete-booking
  'help.guide.delete-booking.title': 'Usuń rezerwację',
  'help.guide.delete-booking.goal': 'Usuń z podróży anulowaną rezerwację.',
  'help.guide.delete-booking.step.1':
    'Najedź na kartę i kliknij ikonę kosza w jej nagłówku. Kosz na dole szczegółów rezerwacji działa tak samo.',
  'help.guide.delete-booking.step.2':
    'Usunąć rezerwację? podaje nazwę wybranej rezerwacji i informuje, że zostanie trwale usunięta. Jeśli są z nią powiązane koszty, informuje też, że również zostaną usunięte.',
  'help.guide.delete-booking.step.3': 'Kliknij „Usuń”.',
  'help.guide.delete-booking.result':
    'Karta zostaje usunięta u wszystkich uczestników podróży. Usunięcia rezerwacji nie da się cofnąć, więc pytanie o potwierdzenie to ostatnia szansa na rezygnację.',
  'help.guide.delete-booking.tip.1':
    'Usunięcie rezerwacji usuwa też powiązane z nią wydatki. Usunięcie noclegu usuwa także jego noce z planu dnia.',
  'help.guide.delete-booking.tip.2':
    'Załączone dokumenty zostają w zakładce „Pliki” podróży; usuwane jest tylko ich powiązanie z rezerwacją.',

  // ── Screen: trip-costs ────────────────────────────────────────────────────────────────
  'help.ctx.trip-costs.title': 'Koszty',
  'help.ctx.trip-costs.summary':
    'Finanse podróży: wszystkie wydatki w rejestrze z datami lub w tabeli, z informacją, kto je wpisał i kto jest za nie winien, w walucie z paragonu. Prawa kolumna pokazuje, kto komu musi zapłacić, aby wyrównać rachunki.',
  'help.ctx.trip-costs.bullet.1':
    'Pasek u góry pokazuje daty podróży i podróżnych, między których dzielone są koszty. Są na nim też „Szukaj wydatków…”, „Filtruj” (lejek), „Eksportuj CSV” (ikona pobierania) i przełącznik „Lista” / „Tabela”.',
  'help.ctx.trip-costs.bullet.2':
    'Na prawym końcu paska „Rozlicz” zapisuje naraz wszystkie otwarte przelewy, „Zeskanuj paragon” wypełnia wydatek na podstawie zdjęcia, gdy dodatek „Analiza AI” potrafi odczytywać obrazy, a „Dodaj wydatek” otwiera edytor.',
  'help.ctx.trip-costs.bullet.3':
    'Cztery karty pod paskiem: Jesteś winien i Należy ci się to Twoja własna strona rozliczenia, Kwota nierozliczona to kwota zapisana, ale jeszcze bez płatnika, a Łączne wydatki na podróż sumują wszystko, a pod spodem widać Twój udział i Zapłaciłeś.',
  'help.ctx.trip-costs.bullet.4':
    'Księga jest pogrupowana według dni, od najnowszych, a nagłówek każdego dnia podaje liczbę wpisów i kwotę wydaną tego dnia. Wiersz pokazuje kategorię jako kolorową zakładkę, nazwę, znaczniki płacących z kwotami, które każdy zapłacił, pod nimi Podział z częścią każdego uczestnika (ptaszek oznacza, kto już zapłacił swoją), a dalej notatkę i kwotę. Gdy podział oznacza, że inni są Ci winni pieniądze albo Ty komuś, pojawia się też informacja o pożyczce.',
  'help.ctx.trip-costs.bullet.5':
    'W prawej kolumnie są wyniki: „Rozlicz” pokazuje, kto komu ma zapłacić, „Salda” nadwyżkę lub niedobór każdego podróżnego, „Budżet końcowy” to, ile podróż kosztuje każdego z nich, a „Według kategorii” to, na co poszły pieniądze.',
  'help.ctx.trip-costs.bullet.6':
    'Zarejestrowana płatność pojawia się w tym samym zestawieniu jako osobny wiersz, z ołówkiem i przyciskiem „Cofnij” obok. Wydatek ma ołówek i kosz, a kosz pyta o potwierdzenie przed usunięciem wydatku. Wydatek z paragonami ma obok nazwy znacznik „Paragon”, który je otwiera.',
  'help.ctx.trip-costs.bullet.7':
    '„Tabela” na pasku pokazuje te same wydatki jako arkusz pogrupowany według kategorii, z kolumnami „Osoby” i „Dni” oraz kwotą na osobę i na dzień. „Podsumowanie” zastępuje wtedy „Według kategorii”. Koszty zapamiętują wybrany widok.',
  // add-expense
  'help.guide.add-expense.title': 'Dodaj wydatek',
  'help.guide.add-expense.goal': 'Zapisz, ile coś kosztowało, kto zapłacił i z kim dzielicie ten koszt.',
  'help.guide.add-expense.step.1':
    'Kliknij „Dodaj wydatek” na prawym końcu paska. Otworzy się edytor z dzisiejszą datą, z Tobą jako płacącym i ze wszystkimi uwzględnionymi w podziale.',
  'help.guide.add-expense.step.2':
    'W polu u góry okna wpisz, za co był wydatek. Puste pole pokazuje „np. kolacja, pamiątki, paliwo…”. To nazwa wydatku i bez niej nie da się go zapisać.',
  'help.guide.add-expense.step.3':
    'Przycisk pod nazwą to Kategoria, domyślnie Jedzenie i napoje, dopóki nie wybierzesz innej. Jest ich czternaście i nie można ich zmieniać. Nagłówek przyjmuje kolor wybranej kategorii, podobnie jak zakładka w wierszu i jej słupek w Według kategorii.',
  'help.guide.add-expense.step.4':
    'Wpisz kwotę z paragonu w polu „Łączna kwota”. Waluta obok jest początkowo ustawiona na walutę, w której wyświetlane są Koszty; jeśli ją zmienisz, edytor pokaże przeliczoną kwotę. Dzień jest początkowo ustawiony na dzisiaj i pod tym dniem wydatek pojawi się na liście.',
  'help.guide.add-expense.step.5':
    'W „Kto zapłacił?” kliknij osobę, która faktycznie zapłaciła. Domyślnie zaznaczone jest „Ty”. „Nikt jeszcze nie zapłacił” zapisuje kwotę, ale nikt nie jest z jej tytułu nic winien, a „Zapłaciło kilka osób” w przełączniku obok nagłówka dzieli rachunek między kilku płacących.',
  'help.guide.add-expense.step.6':
    '„Podział” poniżej jest początkowo ustawiony na „Po równo”: wszyscy są zaznaczeni, a obok imion widać udziały. Zostaw to lub zmień. Kliknij „Dodaj wydatek” na dole okna, aby zapisać.',
  'help.guide.add-expense.result':
    'Wydatek jest w rejestrze pod swoim dniem, wliczony do „Łączne wydatki na podróż”, a kolumna rozliczeń na nowo przeliczyła, kto komu jest winien.',
  'help.guide.add-expense.tip.1':
    'Jeśli nie zmienisz ustawień domyślnych, wydatek ma dzisiejszą datę, płacisz Ty, a koszt jest dzielony po równo między wszystkich: wystarczy wpisać nazwę i kwotę.',
  'help.guide.add-expense.tip.2':
    'Przycisk ± obok kwoty zamienia wydatek w zwrot. Ujemna kwota oznacza, że pieniądze są zwracane, a podział działa odwrotnie.',
  'help.guide.add-expense.tip.3':
    '„Załącz” obok „Paragony i faktury” na dole okna przyjmuje obrazy i pliki PDF. Są przesyłane przy zapisie i trafiają do „Plików” podróży, a obok nazwy na liście pojawia się znacznik „Paragon”.',
  // expense-payers
  'help.guide.expense-payers.title': 'Ustaw, kto zapłacił',
  'help.guide.expense-payers.goal': 'Zapisz, kto zapłacił za wydatek. To druga połowa obliczeń rozliczenia.',
  'help.guide.expense-payers.step.1':
    'Otwórz wydatek ołówkiem obok jego wiersza i spójrz na „Kto zapłacił?”. Domyślnie przełącznik obok nagłówka jest ustawiony na „Zapłaciła jedna osoba”: każdy podróżny ma swój chip, a obramowany chip oznacza osobę, która zapłaciła. Kliknij inny chip, aby to zmienić.',
  'help.guide.expense-payers.step.2':
    '„Nikt jeszcze nie zapłacił”, czyli przerywany chip za podróżnymi, zapisuje kwotę, ale nikt nie staje się z jej tytułu dłużnikiem. Wydatek nadal wlicza się do „Łączne wydatki na podróż”.',
  'help.guide.expense-payers.step.3':
    'Druga opcja tego przełącznika, „Zapłaciło kilka osób”, pokazuje wszystkich podróżnych z polami wyboru, a przy każdej zaznaczonej osobie pojawia się pole kwoty. Zaznacz osoby, które zapłaciły, i wpisz, ile zapłaciła każda z nich. Kwoty muszą sumować się do łącznej kwoty.',
  'help.guide.expense-payers.step.4':
    'Wydatek, za który nikt nie zapłacił, jest oznaczony w swoim wierszu jako „Niezakończone” i wliczany do karty „Kwota nierozliczona”, która sumuje wydatki bez płacącego.',
  'help.guide.expense-payers.result':
    'To, kto zapłacił, decyduje, komu należy się zwrot, podział decyduje, kto płaci, a „Salda” to różnica między nimi.',
  'help.guide.expense-payers.tip.1':
    'Kto zapłacił? i Podział są niezależne: możesz zapłacić za kolację, na której Cię nie było, i być wliczony w podział kolacji, za którą nie płaciłeś.',
  'help.guide.expense-payers.tip.2':
    'Przy kilku płacących kwoty muszą sumować się do łącznej kwoty. Gdy zaznaczysz kolejną osobę, reszta zostanie ponownie rozdzielona między kwoty, których nie wpisałeś ręcznie. Dopóki kwoty się nie zgadzają, edytor pokazuje, ile mają dawać łącznie, i nie pozwala zapisać.',
  'help.guide.expense-payers.tip.3':
    'Przestawienie wydatku z powrotem na „Nikt jeszcze nie zapłacił” nie usuwa go: kwota nadal wlicza się do „Łączne wydatki na podróż”, a wiersz zostaje oznaczony jako „Niezakończone”.',
  // split-expense
  'help.guide.split-expense.title': 'Podziel rachunek między podróżnych',
  'help.guide.split-expense.goal':
    'Zdecyduj, kto jest winien za wydatek: wszyscy po równo, według kwot czy pozycja po pozycji z paragonu.',
  'help.guide.split-expense.step.1':
    'W edytorze wydatku sekcja „Podział” pokazuje wszystkich podróżnych z polami wyboru. Odznacz osobę, aby wyłączyć ją z tego wydatku: jej imię robi się szare, traci udział i nic za ten wydatek nie jest winna.',
  'help.guide.split-expense.step.2':
    'Domyślnie w przełączniku obok nagłówka wybrane jest „Po równo”: każdy zaznaczony podróżny dostaje taki sam udział, widoczny obok imienia. Plakietki pod listą pokazują, ile osób dzieli wydatek i ile wynosi każdy udział.',
  'help.guide.split-expense.step.3':
    'Własny zamienia udziały na pola z kwotami. Wpisz, ile jest winien każdy uczestnik. Plakietka poniżej aktualizuje się w trakcie pisania i robi się zielona z napisem Podział zgadza się z sumą. Dopóki kwoty nie zgadzają się z sumą, nie da się zapisać.',
  'help.guide.split-expense.step.4':
    '„Paragon” dzieli rachunek pozycja po pozycji: kliknij „Dodaj pozycję”, wpisz nazwę i cenę w każdym wierszu, a obok „Dzielone między:” wybierz podróżnych, którzy dzielą tę pozycję.',
  'help.guide.split-expense.step.5':
    '„Udział każdej osoby” pod pozycjami pokazuje, ile każdy podróżny ostatecznie jest winien, a „Łączna kwota” u góry to suma pozycji. Kliknij „Zapisz” na dole okna.',
  'help.guide.split-expense.result':
    'Wszystkie salda są wyliczane z podziału. Podział jest zapisany razem z wydatkiem, widoczny w jego wierszu jako „Podział” z częścią każdego podróżnego i można go później zmienić bez zmieniania czegokolwiek innego.',
  'help.guide.split-expense.tip.1':
    'Podróżny, którego odznaczysz, nie płaci nic za ten jeden wydatek; pozostali płacą swoją część.',
  'help.guide.split-expense.tip.2':
    'Opcja „Po równo” dzieli co do grosza: dodatkowy grosz przy każdym wydatku trafia do innej osoby, więc nie płaci go zawsze ta sama.',
  'help.guide.split-expense.tip.3':
    'Tryb „Paragon” sam oblicza „Łączną kwotę” i wyszarza to pole: suma to suma pozycji z paragonu.',
  'help.guide.split-expense.tip.4':
    'Własny podział możesz też wpisać w procentach: ustaw „Wpisuj udziały jako” na %, a udziały muszą razem dawać 100 %, zanim wydatek się zapisze.',
  // expense-currency
  'help.guide.expense-currency.title': 'Wprowadź wydatek w innej walucie',
  'help.guide.expense-currency.goal': 'Wpisz kwotę z paragonu, a TREK zapisze kurs wymiany.',
  'help.guide.expense-currency.step.1':
    'Otwórz „Dodaj wydatek”. Wpisz nazwę u góry okna, a w polu „Łączna kwota” wpisz kwotę dokładnie taką jak na paragonie, bez przeliczania.',
  'help.guide.expense-currency.step.2':
    'Otwórz „Waluta” obok kwoty i wybierz walutę z paragonu. Lista zawiera wszystkie kody znane TREK i można ją przeszukiwać: wpisz trzy litery kodu.',
  'help.guide.expense-currency.step.3':
    'Pod polami pojawia się rząd plakietek: wpisana kwota i jej bieżąca wartość z oznaczeniem „kurs na żywo”. To tylko podgląd, a nie wartość, która zostanie zapisana.',
  'help.guide.expense-currency.step.4':
    'Kliknij „Dodaj wydatek” na dole okna. Kurs zostaje wtedy ustalony: wydatek zachowuje wartość z dnia, w którym go wpisałeś.',
  'help.guide.expense-currency.step.5':
    'W rejestrze wiersz pokazuje pod nazwą obie kwoty: wpisaną, strzałkę i kwotę w walucie podróży. Wszystkie sumy, salda i rozliczenia w zakładce „Koszty” korzystają z tej drugiej kwoty.',
  'help.guide.expense-currency.result':
    'Wydatek zachowuje kwotę i walutę, które wpisałeś. Rejestr pokazuje obie, a sumy i salda podróży są liczone w walucie podróży.',
  'help.guide.expense-currency.tip.1':
    'Kurs jest ustalany w chwili zapisu, więc rozliczony dług nie zmieni się, gdy tydzień później zmieni się kurs. Nowy kurs zostanie zapisany tylko wtedy, gdy zmienisz walutę wydatku.',
  'help.guide.expense-currency.tip.2':
    '„Waluta wyświetlania” w Ustawieniach zmienia tylko sposób pokazywania kwot. Zapisane kwoty nigdy się nie zmieniają. Jeśli pole jest puste, każda podróż jest pokazywana we własnej walucie.',
  'help.guide.expense-currency.tip.3':
    'Walutę podróży ustawia się w samej podróży, w „Edytuj podróż”, i wymaga to uprawnienia „Edytowanie podróży”. Gdy ją zmienisz, wszystkie zapisane kursy zostaną przeliczone dla nowej waluty. Same kwoty nie są przeliczane.',
  // filter-costs
  'help.guide.filter-costs.title': 'Wyszukiwanie wydatku lub wydatków z jednego dnia',
  'help.guide.filter-costs.goal': 'Przefiltruj długą listę wydatków, aby zobaczyć tylko to, czego szukasz.',
  'help.guide.filter-costs.step.1':
    'Wpisz frazę w polu „Szukaj wydatków…” na pasku. Wyszukiwanie dopasowuje nazwy wydatków na bieżąco, a Esc czyści pole.',
  'help.guide.filter-costs.step.2':
    'Filtruj, czyli lejek obok wyszukiwarki, otwiera filtry. Przełącznik na górze to Twój własny widok rejestru: Wszystkie, Opłacone przeze mnie dla wydatków, które pokryłeś, i Należy mi się dla wydatków, w których zapłaciłeś więcej niż swój udział.',
  'help.guide.filter-costs.step.3':
    'W „Kategoria” wybierz jedną z czternastu kategorii, a zobaczysz tylko wydatki z tej kategorii. Lejek pokazuje, ile filtrów jest włączonych.',
  'help.guide.filter-costs.step.4':
    'W „Dzień” wybierz jeden z dni, w których są wydatki. Nagłówki dni zastąpi baner, który pokazuje pełną datę tego dnia, liczbę wydatków i ich sumę.',
  'help.guide.filter-costs.step.5':
    '„Eksportuj CSV”, czyli ikona pobierania obok lejka, zapisuje wszystkie wydatki do pliku, z pierwotną kwotą, jej walutą i kwotą po przeliczeniu.',
  'help.guide.filter-costs.result':
    'Filtry możesz łączyć, a grupy dni aktualizują się z własnymi sumami dla pozostałych wydatków.',
  'help.guide.filter-costs.tip.1':
    'Zapisane płatności nie mają nazwy ani kategorii, więc ukrywa je wyszukiwanie lub filtr kategorii, a także Należy mi się. Filtr dnia je zachowuje, pod dniem, w którym płatność miała miejsce.',
  'help.guide.filter-costs.tip.2':
    '„Eksportuj CSV” zawsze eksportuje wszystkie wydatki, niezależnie od filtrów na ekranie, po jednym wierszu na wydatek.',
  'help.guide.filter-costs.tip.3':
    '„Wyczyść filtry” na dole menu filtrów, widoczne po włączeniu dowolnego filtra, wyłącza wszystkie filtry naraz.',
  // settle-up
  'help.guide.settle-up.title': 'Zobacz, kto komu jest winien, i rozlicz długi',
  'help.guide.settle-up.goal':
    'Zamień wiele wspólnych wydatków w jak najmniejszą liczbę przelewów, które wyrównają wszystkie długi, i odnotowuj przelewy, gdy zostaną wykonane.',
  'help.guide.settle-up.step.1':
    'Karta „Rozlicz” w prawej kolumnie pokazuje przelewy, które wyrównałyby wszystkie długi: kto komu płaci, jako dwa awatary z imionami w podpowiedzi, i ile. Liczba w nagłówku karty pokazuje, ile przelewów jest jeszcze otwartych.',
  'help.guide.settle-up.step.2':
    '„Rozlicz” obok przelewu oznacza go jako wykonany. Przelew znika z karty, a salda się aktualizują.',
  'help.guide.settle-up.step.3':
    'Zapisany przelew jest wierszem w rejestrze, pod dniem, w którym go wykonano, oznaczonym jako „Płatność”, z dwojgiem podróżnych i kwotą.',
  'help.guide.settle-up.step.4':
    'Obok tego wiersza ołówek pozwala poprawić płatność, a „Cofnij” ją anuluje i przelew wraca na kartę „Rozlicz”.',
  'help.guide.settle-up.step.5':
    'Dodaj płatność w nagłówku karty zapisuje przelew, który nie wynikał z żadnej propozycji. Wybierz Od i Do, kwotę, jej walutę i dzień, w którym przelew nastąpił, w razie potrzeby dodaj Notatka, na przykład o sposobie płatności, a potem kliknij Dodaj płatność na dole okna.',
  'help.guide.settle-up.step.6':
    '„Rozlicz” na pasku u góry zapisuje naraz wszystkie otwarte przelewy bez pytania, na przykład gdy grupa rozlicza wszystkie długi na koniec podróży.',
  'help.guide.settle-up.result':
    'Każdy zapisany przelew jest wierszem w rejestrze i usuwa jedną pozycję z karty Rozlicz. Gdy karta pokazuje Wszyscy rozliczeni, podróż jest w pełni spłacona.',
  'help.guide.settle-up.tip.1':
    'Karta pokazuje najmniejszą liczbę przelewów, a nie każdy dług: jeśli trzy osoby są sobie winne po kolei, wystarczą jedna lub dwie płatności.',
  'help.guide.settle-up.tip.2':
    '„Rozlicz” tylko odnotowuje przelew. Nie wysyła pieniędzy. Zapłać tak jak zwykle, a potem kliknij „Rozlicz”.',
  'help.guide.settle-up.tip.3':
    'Płatność może być w dowolnej walucie, więc spłata długu w jenach w euro to nic dziwnego: okno ma własny wybór waluty i też zapisuje ten kurs na stałe.',
  // final-budget
  'help.guide.final-budget.title': 'Ile podróż kosztowała każdego podróżnego',
  'help.guide.final-budget.goal': 'Zobacz dane dla każdej osoby: dzisiejsze saldo i rzeczywisty koszt na osobę.',
  'help.guide.final-budget.step.1':
    '„Salda” pokazują sytuację każdego podróżnego: zielony pasek w prawo, jeśli grupa jest mu winna pieniądze, czerwony pasek w lewo, jeśli to on jest winien, oraz kwotę obok imienia.',
  'help.guide.final-budget.step.2':
    'Budżet końcowy poniżej odpowiada na inne pytanie: nie na to, kto ile jest teraz winien, ale ile podróż kosztuje każdego uczestnika po zwróceniu wszystkich długów.',
  'help.guide.final-budget.step.3':
    'Kliknij imię, aby zobaczyć obliczenia: „Zapłacone wydatki”, a pod nimi „Zwroty netto” i „Oczekujące zwroty”.',
  'help.guide.final-budget.step.4':
    'Pod trzema wierszami, pod imieniem każdego podróżnego, jest lista pozycji, które składają się na dany wiersz: wydatki opłacone przez tego podróżnego, przelewy już odnotowane i przelewy jeszcze otwarte. Każda lista sumuje się dokładnie do wiersza o tej samej nazwie.',
  'help.guide.final-budget.result':
    '„Salda” pokazują, komu kto jest dziś winien pieniądze. „Budżet końcowy” pokazuje, ile podróż kosztuje każdego z was, gdy wszystko zostanie zwrócone.',
  'help.guide.final-budget.tip.1':
    'Zapisanie płatności nie zmienia niczyjego budżetu końcowego. Przenosi jedynie kwotę z oczekujących zwrotów do zwrotów netto.',
  'help.guide.final-budget.tip.2':
    'Wydatek bez płacącego nie jest uwzględniany w żadnej z tych kart, tak samo jak w propozycjach rozliczeń.',
  // expense-from-booking
  'help.guide.expense-from-booking.title': 'Zamiana rezerwacji na wydatek',
  'help.guide.expense-from-booking.goal':
    'Dołącz to, ile naprawdę kosztował lot, hotel lub miejsce, do wpisu, do którego należą.',
  'help.guide.expense-from-booking.step.1':
    'Znajdź rezerwację na karcie „Transport” lub „Rezerwacje” i kliknij ołówek u góry jej karty.',
  'help.guide.expense-from-booking.step.2':
    'Przewiń do sekcji „Koszty” pod koniec formularza. Znajdziesz tam „Utwórz wydatek”, który najpierw zapisuje rezerwację, oraz „Powiąż istniejący wydatek” dla wydatku, który już jest w Kosztach.',
  'help.guide.expense-from-booking.step.3':
    'Kliknij „Utwórz wydatek”. Rezerwacja zostaje zapisana, formularz się zamyka, a otwiera się edytor „Kosztów” z tytułem rezerwacji jako nazwą, kategorią dopasowaną do typu rezerwacji i dniem rezerwacji jako dniem wydatku.',
  'help.guide.expense-from-booking.step.4':
    'Wpisz kwotę i walutę, wskaż, kto zapłacił, i ustaw podział jak przy każdym wydatku, a potem kliknij „Dodaj wydatek”. Gdy ponownie otworzysz rezerwację, wydatek będzie widoczny w sekcji „Powiązane wydatki”, z ołówkiem do edycji, opcją „Odłącz, zachowaj wydatek”, która usuwa powiązanie, ale zachowuje wydatek, oraz koszem do usunięcia.',
  'help.guide.expense-from-booking.result':
    'Rezerwacja pokazuje swój koszt, a wydatek jest zwykłym wierszem w zakładce „Koszty”, z płacącym, podziałem i walutą jak każdy inny.',
  'help.guide.expense-from-booking.tip.1':
    'Usunięcie rezerwacji usuwa też powiązane z nią wydatki, o czym informuje pytanie przed usunięciem. „Usuń wydatek” w sekcji „Koszty” rezerwacji działa odwrotnie: usuwa wydatek i zostawia rezerwację. „Odłącz, zachowaj wydatek” zachowuje jedno i drugie.',
  'help.guide.expense-from-booking.tip.2':
    'Formularz miejsca ma taki sam blok, a „Utwórz wydatek” najpierw zapisuje miejsce.',
  // costs-table
  'help.guide.costs-table.title': 'Planowanie kosztów w tabeli',
  'help.guide.costs-table.goal':
    'Przeglądaj i zmieniaj wydatki w tabeli, posortowane według kategorii i przeliczone na osobę i na dzień.',
  'help.guide.costs-table.step.1':
    'Kliknij Tabela, czyli drugą ikonę przełącznika Lista / Tabela na pasku. Tabela z tymi samymi wydatkami zastępuje rejestr, a wyszukiwanie i filtry działają również na niej.',
  'help.guide.costs-table.step.2':
    'Tabela jest pogrupowana według kategorii. Nagłówek każdej grupy pokazuje jej nazwę, liczbę wydatków i sumę częściową. Kliknij nagłówek, aby zwinąć grupę. Kolumny to „Nazwa”, „Data”, „Łącznie”, „Osoby” i „Dnia”, a dalej wyliczane z nich na szarym tle „Za osobę”, „Za dzień” i „Za osobę/dzień”. Wiersz „Łącznie” na dole sumuje wszystko.',
  'help.guide.costs-table.step.3':
    'Kliknij komórkę, aby ją od razu zmienić: nazwę, sumę, „Osoby” lub „Dni”. Wpisz wartość i naciśnij Enter albo kliknij gdzie indziej, aby ją zapisać, lub naciśnij Esc, aby anulować; data otwiera kalendarz. „Za osobę” i pozostałe wyliczane kolumny aktualizują się natychmiast.',
  'help.guide.costs-table.step.4':
    'Sumy z kłódką nie da się tu zmienić: ktoś ją zapłacił albo została wpisana w innej walucie, a podpowiedź mówi, który to przypadek. Kliknięcie otwiera wtedy wydatek, dzięki czemu salda i ustalony kurs wymiany pozostają poprawne.',
  'help.guide.costs-table.step.5':
    '„Dodaj wydatek” na końcu kategorii dodaje do niej wiersz o nazwie „Nowy wpis” z datą najnowszego wpisu w tej kategorii. Pole nazwy jest od razu otwarte, więc możesz ją zmienić. Kwotę wpisz w ten sam sposób.',
  'help.guide.costs-table.step.6':
    'W tym widoku prawa kolumna pokazuje „Podsumowanie” zamiast „Według kategorii”. Sumuje wydatki na cztery sposoby: „Kategoria”, „Dzień”, „Płacący” (z pozycją „Jeszcze bez płacącego” dla niezapłaconych) oraz „Status”, czyli „Zapłacone” i „Otwarte”.',
  'help.guide.costs-table.result':
    'Każdy wydatek jest w swojej kategorii z kwotą na osobę i na dzień. Gdy zmienisz sumę w komórce, karty powyżej i „Podsumowanie” od razu się aktualizują.',
  'help.guide.costs-table.tip.1':
    '„Koszty” zapamiętują widok w tej przeglądarce: zakładka otwiera się w tabeli, dopóki znów nie klikniesz „Lista”.',
  'help.guide.costs-table.tip.2':
    'Wydatek z podziałem Własny albo Paragon nie ma jednego udziału na osobę, więc jego pola Za osobę i Za osobę/dzień pozostają puste.',
  'help.guide.costs-table.tip.3':
    'Płacących, podział, notatkę i paragony edytujesz w samym wydatku: w „Więcej opcji” na końcu wiersza znajdziesz „Edytuj” oraz „Usuń”, które usuwa wiersz.',

  // ── Screen: trip-transports ───────────────────────────────────────────────────────────
  'help.ctx.trip-transports.title': 'Transport',
  'help.ctx.trip-transports.summary':
    'Wszystkie sposoby przemieszczania się między przystankami: loty, pociągi, autobusy, samochody, taksówki, rowery, rejsy, promy, kolejki linowe i połączenia transportu publicznego, które TREK wyszukuje za ciebie. Karta wyświetla je na liście. Możesz je też tworzyć i przeglądać w planie, a na mapie są widoczne ich trasy.',
  'help.ctx.trip-transports.bullet.1':
    'Ta zakładka pokazuje tylko przejazdy. Noclegi, restauracje, wydarzenia i bilety są w zakładce „Rezerwacje”, więc żaden wpis nie pojawia się dwa razy.',
  'help.ctx.trip-transports.bullet.2':
    'Na pasku u góry są „Szukaj”, „Filtruj” (status, rodzaje i podróżni), trzy widoki: „Karty”, „Lista” i „Oś czasu”, „Opcje widoku” oraz „Eksportuj jako arkusz kalkulacyjny (CSV)”, który pobiera to, co jest widoczne. „Transport” po prawej dodaje przejazd ręcznie. Ikony przed nim, „Importuj potwierdzenia rezerwacji” i „Importuj z AirTrail”, pojawiają się, gdy serwer potrafi odczytywać potwierdzenia lub gdy AirTrail jest połączony. Na pustej zakładce te same akcje są widoczne pośrodku jako „Transport”, „Importuj z pliku” i AirTrail.',
  'help.ctx.trip-transports.bullet.3':
    'Zakładka otwiera się w widoku „Karty”: najpierw „Potwierdzono”, potem „Oczekujące”. Każdą sekcję możesz zwinąć, klikając jej nagłówek. Zaplanowane połączenia komunikacji publicznej nie mają statusu i są wyświetlane wśród potwierdzonych przejazdów według czasu, chyba że w „Opcjach widoku” dostaną własną sekcję „Automatyczny transport publiczny”. Widok „Lista” grupuje przejazdy według dni, a „Oś czasu” pokazuje wszystkie przejazdy na tle dni podróży.',
  'help.ctx.trip-transports.bullet.4':
    'Górny pasek karty ma kolor zależny od statusu: zielony dla potwierdzonych, bursztynowy dla oczekujących, niebieski dla zaplanowanego połączenia. Widać na nim kropkę statusu, typ, tytuł, ołówek i kosz. Pod nim są: data, godzina, kod rezerwacji, trasa oraz linia lotnicza i numer lotu albo numer pociągu, peron i miejsce. Kliknij kartę, aby otworzyć szczegóły.',
  'help.ctx.trip-transports.bullet.5':
    'Transporty możesz też tworzyć w planie: przycisk + w nagłówku dnia (podpowiedź brzmi Dodaj do dnia) albo kliknięcie prawym przyciskiem nagłówka daje opcje Dodaj transport i Transport publiczny. Łącznik z czasem przejazdu między dwoma przystankami otwiera to samo wyszukiwanie dla tego jednego odcinka.',
  'help.ctx.trip-transports.bullet.6':
    'Transport z ustawionymi oboma końcami rysuje linię na mapie. Ikona trasy w jego wierszu w planie dnia i opcja „Na mapie” w szczegółach włączają tę linię. „Pokaż wszystkie trasy rezerwacji” na pasku narzędzi nad dniami włącza lub wyłącza linie dla całej podróży.',
  // transports-list
  'help.guide.transports-list.title': 'Poznaj zakładkę Transport',
  'help.guide.transports-list.goal': 'Dowiedz się, co pokazuje lista, zanim cokolwiek na niej zmienisz.',
  'help.guide.transports-list.step.1':
    'Transport to karta podróży, po Plan (i po Wycieczki, gdy ten dodatek jest włączony). Zawiera tylko przejazdy: hotele, restauracje, wydarzenia i bilety są na karcie Rezerwacje.',
  'help.guide.transports-list.step.2':
    '„Szukaj” po lewej stronie paska filtruje przejazdy w trakcie pisania. „Filtruj”, lejek obok, otwiera opcje: „Status” z „Wszystkie”, „Potwierdzono” i „Oczekujące”, a potem każdy używany typ z liczbą. Zaznacz jeden lub kilka typów, żeby pokazać tylko je. Liczba na lejku pokazuje, ile filtrów jest aktywnych, a pasek, ile przejazdów jest widocznych, np. 1 z 4. „Wyczyść filtry” na dole menu znów pokazuje wszystkie przejazdy.',
  'help.guide.transports-list.step.3':
    '„Karty”, „Lista” i „Oś czasu” obok pokazują transport jako karty, jako wiersze pogrupowane według dni albo jako paski na osi dni podróży. „Opcje widoku”, ikona suwaków, ustawiają „Grupuj według” i „Sortuj według” dla kart i listy oraz tory dla osi czasu. „Resetuj widok” przywraca ustawienia domyślne. W widoku kart opcja „Transport publiczny jako osobna sekcja” pokazuje zaplanowane połączenia w sekcji „Automatyczny transport publiczny”.',
  'help.guide.transports-list.step.4':
    'Każda karta pokazuje wszystkie szczegóły. Górny pasek jest zielony dla statusu „Potwierdzono” i bursztynowy dla „Oczekujące” i zawiera kropkę statusu, typ i tytuł. Pod nim „Data” pokazuje dni, które obejmuje transport, z ich datami. Dalej są „Czas”, „Kod rezerwacji”, „Trasa” z ikoną typu między przystankami oraz linia lotnicza i numer lotu albo numer pociągu, peron i miejsce. Kliknij kartę, aby otworzyć jej szczegóły.',
  'help.guide.transports-list.step.5':
    'Kliknij kropkę statusu, żeby przełączyć przejazd między „Oczekujące” a „Potwierdzono”; podpowiedź pokazuje kierunek zmiany, np. „Ustaw na Oczekujące”. Ołówek w nagłówku otwiera formularz transportu, a kosz usuwa go po pytaniu „Usunąć rezerwację?”, które wymienia, co zostanie usunięte, łącznie z powiązanymi kosztami.',
  'help.guide.transports-list.result':
    'Każda karta pokazuje, czy przejazd jest zarezerwowany, a pasek pozwala w każdej chwili przefiltrować lub posortować listę.',
  'help.guide.transports-list.tip.1':
    'Karta zapamiętuje Twoje ustawienia: widok, grupowanie i sortowanie w tej przeglądarce, zwinięte sekcje osobno dla każdej podróży, a filtry do zamknięcia karty przeglądarki.',
  'help.guide.transports-list.tip.2':
    '„Importuj potwierdzenia rezerwacji” i „Importuj z AirTrail”, dwie ikony przed „Transport”, pojawiają się tylko wtedy, gdy serwer potrafi odczytywać potwierdzenia i gdy połączony jest serwer AirTrail. Bez nich wypełniasz listę ręcznie lub przez wyszukiwanie połączeń komunikacji publicznej.',
  // add-transport
  'help.guide.add-transport.title': 'Dodaj transport do dnia',
  'help.guide.add-transport.goal': 'Dodaj przejazd z jednego przystanku do następnego do dnia, w którym się odbywa.',
  'help.guide.add-transport.step.1':
    'W nagłówku dnia przejazdu kliknij + z podpowiedzią „Dodaj do dnia” i wybierz „Dodaj transport”. To samo menu otworzysz, klikając nagłówek dnia prawym przyciskiem myszy. Formularz otwiera się z już ustawionym tym dniem.',
  'help.guide.add-transport.step.2':
    'Pigułka typu w nagłówku pokazuje rodzaj transportu, domyślnie „Lot”. Kliknij ją, żeby wybrać „Lot”, „Pociąg”, „Autobus”, „Samochód”, „Taksówka”, „Rower”, „Rejs”, „Prom”, „Kolejka linowa” lub „Inne”, a formularz się dopasuje: lot ma lotnisko przy każdym przystanku, pociąg ciąg stacji, rejs „Zaokrętowanie”, „Port postoju” i „Wyokrętowanie”, a samochód „Odbiór”, „Zwrot” i „Przystanki po drodze”.',
  'help.guide.add-transport.step.3':
    'Wpisz tytuł bezpośrednio w górnym pasku, w miejscu szarego przykładowego tekstu. To jedyne wymagane pole: dopóki go nie wypełnisz, wiersz pod nim pokazuje „Tytuł *”, a przycisk „Dodaj” pozostaje szary. Wybierz tytuł, który rozpoznałbyś na tablicy odjazdów.',
  'help.guide.add-transport.step.4':
    'W sekcji „Trasa” pola „Od” i „Do” przyjmują stację, port lub adres. Zanim zaczniesz pisać, podpowiadane są miejsca z podróży. Wpisz co najmniej trzy litery, aby wyszukać, i wybierz wynik. Nazwa, którą tylko wpiszesz, ale nie wybierzesz z wyników, nie zostanie zapisana i nie pojawi się na mapie.',
  'help.guide.add-transport.step.5':
    'Pola „Data” i „Godzina rozpoczęcia” określają początek, a „Data końca” i „Godzina zakończenia” koniec przejazdu. Jeśli przyjazd jest następnego dnia, ustaw tam następny dzień. Pola „Kod rezerwacji” i „Notatki” niżej są opcjonalne. Kliknij plakietkę „Oczekujące” w nagłówku, aby zmienić ją na „Potwierdzono”.',
  'help.guide.add-transport.step.6': 'Kliknij „Dodaj”.',
  'help.guide.add-transport.result':
    'Transport jest wierszem w dniu, umieszczonym według godziny między przystankami, i kartą w zakładce „Transport” w sekcji „Oczekujące” lub „Potwierdzono”.',
  'help.guide.add-transport.tip.1':
    'Wiersz trafia na miejsce wynikające z godziny rozpoczęcia, za ostatni przystanek, który zaczyna się wcześniej. Przeciągnij go za uchwyt w inne miejsce dnia albo na inny dzień.',
  'help.guide.add-transport.tip.2':
    'Bilet dodasz przez „Załącz plik” w sekcji „Pliki”. „Utwórz wydatek” w sekcji „Koszty” zapisuje rezerwację i otwiera edytor kosztów, w którym wpiszesz cenę biletu.',
  'help.guide.add-transport.tip.3':
    '„Podróżni”, pierwszy blok formularza, określa, kto jedzie tym transportem. Gdy podróż ma więcej niż jednego członka, a któryś transport ma przypisaną osobę, w „Filtruj” w zakładce pojawia się też „Podróżni”, który pokazuje transport tylko jednej osoby.',
  // import-transport-file
  'help.guide.import-transport-file.title': 'Zaimportuj lot z e-biletu',
  'help.guide.import-transport-file.goal':
    'Niech TREK odczyta lot, pociąg lub prom z biletu od przewoźnika, a Ty sprawdź dane przed zapisaniem.',
  'help.guide.import-transport-file.step.1':
    'Na pasku karty Transport kliknij ikonę pobierania przed przyciskiem Transport, której podpowiedź brzmi Importuj potwierdzenia rezerwacji. Otworzy się okno o tej nazwie, to samo, które ma karta Rezerwacje. Na pustej karcie to samo robi Importuj z pliku na środku.',
  'help.guide.import-transport-file.step.2':
    'Upuść bilet na pole albo kliknij pole i wybierz plik: EML, PDF, PKPass, HTML i TXT, maksymalnie pięć plików po 10 MB, a także zdjęcia biletu (JPG, PNG, WEBP), jeśli twój serwer ma model AI, który je odczyta. W polu widać nazwy wybranych plików.',
  'help.guide.import-transport-file.step.3':
    'Kliknij „Importuj”. Okno od razu się zamyka, a plik jest odczytywany w tle.',
  'help.guide.import-transport-file.step.4':
    'Karta w prawym dolnym rogu pokazuje postęp pod nazwą pliku. Gdy odczyt się zakończy, „Przetwarzanie plików…” zmienia się w znaczek wyboru, a karta proponuje „Importuj”. Kliknij tę opcję.',
  'help.guide.import-transport-file.step.5':
    'Lot otworzy się w oknie Dodaj transport, już wypełniony: przycisk rodzaju ustawiony na Lot, linia lotnicza i numer lotu jako tytuł w nagłówku, oba lotniska w sekcji Trasa z Wylot i Przylot, ich godziny i strefy czasowe, Linia lotnicza i Numer lotu, Kod rezerwacji oraz bilet w sekcji Pliki. Sprawdź to i kliknij Dodaj.',
  'help.guide.import-transport-file.result':
    'Lot pojawia się jako karta w sekcji „Oczekujące” w zakładce „Transport” i jako wiersz w dniu wylotu, z biletem w sekcji „Pliki”. Gdy znane są oba lotniska, lot jest widoczny na mapie jako łuk.',
  'help.guide.import-transport-file.tip.1':
    'Obie zakładki korzystają z tego samego importu. Plik z lotem i hotelem otwiera najpierw lot w „Dodaj transport”, a potem hotel w „Nowa rezerwacja”, niezależnie od zakładki, w której zacząłeś.',
  'help.guide.import-transport-file.tip.2':
    'Lotniska są lokalizowane na podstawie kodu. Jeśli nie udało się zlokalizować stacji lub portu, jego nazwa jest wyróżniona na bursztynowo na karcie importu w prawym dolnym rogu. Wybierz go ręcznie w sekcji „Trasa”, zanim klikniesz „Dodaj”, w przeciwnym razie transport nie pojawi się na mapie.',
  // plan-transit
  'help.guide.plan-transit.title': 'Planowanie połączenia komunikacją publiczną',
  'help.guide.plan-transit.goal':
    'Niech TREK wyszuka prawdziwe pociągi i autobusy między dwoma punktami dnia, a wybrane połączenie doda do planu.',
  'help.guide.plan-transit.step.1':
    'Kliknij + w nagłówku dnia i wybierz „Transport publiczny”. Wyszukiwanie otworzy się dla tego dnia: dzień jest widoczny jako plakietka w nagłówku, a „Ręcznie” i „Automatycznie” obok niej przełączają między wyszukiwaniem a zwykłym formularzem.',
  'help.guide.plan-transit.step.2':
    'W polach „Od” i „Do” podajesz przystanek lub stację. Dopóki pole jest puste, TREK podpowiada nocleg z danego dnia, stacje i lotniska z rezerwacji tego dnia oraz jego przystanki. Gdy wpiszesz dwie litery, wyszukuje zamiast tego stacje z rozkładu jazdy. „Zamień” między polami zamienia „Od” i „Do” miejscami.',
  'help.guide.plan-transit.step.3':
    'Odjazd lub Przyjazd z godziną określa, kiedy chcesz jechać, a Najlepsza trasa, Mniej przesiadek lub Mniej pieszo określa, jak mają być uporządkowane wyniki.',
  'help.guide.plan-transit.step.4':
    'Chipy poniżej pokazują dozwolone środki transportu: Pociąg, Metro, Tramwaj, Autobus, Prom i Kolejka linowa. Wyłącz któryś, aby go wykluczyć; co najmniej jeden zostaje włączony. Potem kliknij „Szukaj”.',
  'help.guide.plan-transit.step.5':
    'Każdy wynik pokazuje odjazd i przyjazd, czas podróży, liczbę przesiadek i długość odcinków pieszych, a także linie jako plakietki, w ich kolorach, jeśli rozkład je podaje. Kliknij wynik, aby go rozwinąć i zobaczyć każdy odcinek: przystanki, na których wsiadasz i się przesiadasz, perony i przejścia piesze między liniami.',
  'help.guide.plan-transit.step.6': 'Kliknij „Dodaj do dnia”.',
  'help.guide.plan-transit.result':
    'Połączenie jest wierszem w dniu z plakietkami linii. Kliknij jego strzałkę, aby zobaczyć poszczególne odcinki. Jest też niebieską kartą w zakładce „Transport” wśród potwierdzonych przejazdów.',
  'help.guide.plan-transit.tip.1':
    'Połączenia pochodzą z Transitous, bezpłatnej usługi społecznościowej korzystającej z publicznych rozkładów jazdy: bez klucza i bez konta. Administrator może ustawić wyszukiwanie przez Google.',
  'help.guide.plan-transit.tip.2':
    'Nic nie znaleziono? Dane z rozkładów obejmują określony region i okres. Spróbuj innej godziny, włącz więcej środków transportu albo wybierz stację zamiast samego miejsca. Komunikat podaje nazwę usługi, która odpowiedziała. Podróż bez dat nie ma dnia, dla którego można szukać, więc oferuje tylko zwykły formularz.',
  'help.guide.plan-transit.tip.3':
    'To samo wyszukiwanie otwiera się dla pojedynczego odcinka: kliknij łącznik z czasem przejazdu między dwoma przystankami i wybierz „Transport publiczny”. Punkt początkowy, docelowy i godzina odjazdu są już wpisane.',
  // change-transit-route
  'help.guide.change-transit-route.title': 'Otwórz i zmień zaplanowane połączenie',
  'help.guide.change-transit-route.goal':
    'Przejrzyj połączenie linia po linii, zmień jego nazwę albo wyszukaj trasę od nowa.',
  'help.guide.change-transit-route.step.1':
    'W zakładce „Transport” zaplanowane połączenie to karta z niebieskim górnym paskiem, wyświetlana w kolejności czasowej razem z potwierdzonymi przejazdami. Gdy w „Opcjach widoku” włączona jest opcja „Transport publiczny jako osobna sekcja”, pojawia się ono w sekcji „Automatyczny transport publiczny”. Kliknij kartę. Połączenie otworzy się jako rezerwacja.',
  'help.guide.change-transit-route.step.2':
    'Kafelki u góry pokazują odjazd i przyjazd z przystankami, „Czas trwania”, „Przesiadki” i „Pieszo”. Pod nimi „Plan podróży” pokazuje połączenie linia po linii, z godzinami, peronami i odcinkami pieszymi między liniami.',
  'help.guide.change-transit-route.step.3':
    'Przycisk „Zmień trasę” na dole rezerwacji ponownie otwiera wyszukiwanie, od razu z wpisanymi oboma końcami połączenia i jego dniem.',
  'help.guide.change-transit-route.step.4':
    'Kliknij „Szukaj”, rozwiń inne połączenie i kliknij „Dodaj do dnia”; zastąpi ono poprzednie. „Edytuj” na samym prawym końcu dolnej części rezerwacji otwiera natomiast zwykły formularz transportu, w którym możesz zmienić kod rezerwacji, podróżnych, notatki i pliki.',
  'help.guide.change-transit-route.result':
    'Przejazd korzysta teraz z nowego planu połączenia, a jego karta w zakładce „Transport” pokazuje nowe linie i godziny.',
  'help.guide.change-transit-route.tip.1':
    'Kliknij tytuł w nagłówku rezerwacji, aby zmienić nazwę połączenia bez zmiany trasy. Notatki do niego piszesz w formularzu transportu, który otwiera się przyciskiem Edytuj.',
  'help.guide.change-transit-route.tip.2':
    'Kosz na dole rezerwacji po potwierdzeniu usuwa połączenie; przystanki dnia zostają.',
  // leg-travel-mode
  'help.guide.leg-travel-mode.title': 'Zmień sposób pokonania odcinka',
  'help.guide.leg-travel-mode.goal':
    'Ustaw jeden odcinek dnia jazdy samochodem jako pieszy albo zaplanuj go wyszukiwarką komunikacji publicznej.',
  'help.guide.leg-travel-mode.step.1':
    'Łączniki między przystankami pojawiają się dopiero po włączeniu trasy dnia. Kliknij nagłówek dnia, aby go otworzyć, a potem kliknij „Trasa” na pasku pod jego przystankami.',
  'help.guide.leg-travel-mode.step.2':
    'Każdy łącznik pokazuje czas przejazdu i dystans odcinka oraz ikonę środka transportu, dla którego go wyznaczono: samochód dla jazdy autem, stopę dla marszu, rower dla jazdy rowerem.',
  'help.guide.leg-travel-mode.step.3':
    'Kliknij łącznik. W menu są „Samochód”, „Pieszo” i „Rower”, „Transport publiczny” dla tego jednego odcinka oraz „Użyj domyślnego dnia”.',
  'help.guide.leg-travel-mode.step.4':
    'Wybierz „Pieszo”. Zmienia się tylko ten odcinek, a reszta dnia zachowuje swój sposób podróżowania.',
  'help.guide.leg-travel-mode.result':
    'Odcinek pokazuje ikonę pieszego i czas przejścia, a pozostałe odcinki dnia zachowują sposób podróżowania ustawiony dla dnia.',
  'help.guide.leg-travel-mode.tip.1':
    'Sposób podróżowania należy do odcinka, a nie do dnia: przyciski „Samochód”, „Pieszo” i „Rower” dla całego dnia nigdy nie nadpisują odcinka ustawionego ręcznie. „Użyj domyślnego dnia” sprawia, że odcinek znów się do nich stosuje.',
  'help.guide.leg-travel-mode.tip.2':
    'Transport publiczny w tym samym menu otwiera wyszukiwarkę połączeń dokładnie dla tego odcinka, z już wypełnionymi obiema końcami i godziną odjazdu.',
  'help.guide.leg-travel-mode.tip.3':
    'Czasy pochodzą z publicznego wyznaczania tras po rzeczywistych drogach i ścieżkach. Jeśli dla odcinka nie da się wyznaczyć trasy, zostaje on linią prostą i nie pokazuje czasu.',
  // edit-transport
  'help.guide.edit-transport.title': 'Zmień lub usuń transport',
  'help.guide.edit-transport.goal': 'Popraw godzinę, peron lub kod rezerwacji albo usuń transport z podróży.',
  'help.guide.edit-transport.step.1':
    'W planie dnia transport to wiersz między przystankami, w kolorze swojego typu. Kliknij go, żeby otworzyć rezerwację: u góry jako pigułki status, typ, dni i „Kod rezerwacji” (z przyciskiem kopiowania), a poniżej godziny odjazdu i przyjazdu z lotniskami lub stacjami.',
  'help.guide.edit-transport.step.2':
    'Przycisk „Edytuj” na dole rezerwacji otwiera formularz, w którym ją utworzono, z napisem „Edytuj transport” nad tytułem w nagłówku. Możesz tam zmienić wszystko: tytuł, plakietki statusu i typu, trasę, dni i godziny oraz kod rezerwacji.',
  'help.guide.edit-transport.step.3':
    'Trasa lotu to ciąg lotnisk, pociągu ciąg stacji, a rejsu ciąg portów. „Dodaj przystanek” („Dodaj port” przy rejsie) wstawia kolejny punkt pośredni, a każdy odcinek ma własne godziny i własny numer lotu lub pociągu.',
  'help.guide.edit-transport.step.4':
    'Kliknij „Aktualizuj”. Aby całkowicie usunąć transport, użyj kosza po lewej stronie tego samego paska, kosza na dole rezerwacji lub kosza na jej karcie w zakładce „Transport” i potwierdź.',
  'help.guide.edit-transport.result':
    'Zmiana jest widoczna wszędzie, gdzie pojawia się transport: w zakładce „Transport”, w dniu przejazdu i na jego linii na mapie.',
  'help.guide.edit-transport.tip.1':
    'Ten sam formularz otwiera się z dwóch miejsc: przez Edytuj w rezerwacji, którą otwiera wiersz planu dnia, i przez ołówek na karcie w zakładce Transport. Zaplanowane połączenie transportem publicznym też otwiera się jako rezerwacja. Zmień trasę ponownie otwiera tam wyszukiwarkę, a Edytuj otwiera ten formularz.',
  'help.guide.edit-transport.tip.2':
    'Aby przenieść transport na inny dzień, nie potrzebujesz formularza: przeciągnij jego wiersz z jednej karty dnia na drugą.',
  // transport-on-map
  'help.guide.transport-on-map.title': 'Pokaż transport na mapie',
  'help.guide.transport-on-map.goal': 'Zobacz rzeczywistą trasę lotu, przejazdu samochodem lub połączenia.',
  'help.guide.transport-on-map.step.1':
    'Transport z ustawionymi oboma końcami ma w swoim wierszu w planie dnia małą ikonę trasy. Kliknij ją; jej podpowiedź zmieni się na „Ukryj trasy rezerwacji”.',
  'help.guide.transport-on-map.step.2':
    'Trasa pojawia się na mapie, a na obu jej końcach są podłużne znaczniki z ikoną środka transportu.',
  'help.guide.transport-on-map.step.3':
    'Kliknij znacznik końcowy, a nad mapą otworzy się rezerwacja. W nagłówku widać status, typ, dni i kod rezerwacji. Poniżej są godziny z lotniskami lub stacjami, linia lotnicza i numer lotu. Kliknij „Zamknij” w nagłówku, aby ją zamknąć.',
  'help.guide.transport-on-map.step.4':
    'Ikona trasy na pasku narzędzi nad dniami działa na całą podróż naraz: Pokaż wszystkie trasy rezerwacji i Ukryj wszystkie trasy rezerwacji, aby je znów ukryć.',
  'help.guide.transport-on-map.step.5':
    'Zaplanowane połączenie komunikacją publiczną nie ma własnej ikony trasy. Rysuje je przełącznik „Trasa” danego dnia, więc „Ukryj wszystkie trasy rezerwacji” go nie ukrywa, dopóki trasa tego dnia jest włączona.',
  'help.guide.transport-on-map.result':
    'Trasy są widoczne na mapie ze znacznikiem na każdym końcu i pozostają tam, dopóki ich nie wyłączysz.',
  'help.guide.transport-on-map.tip.1':
    'Lot, rejs i prom są rysowane jako łuk. Samochód, autobus, taksówka i rower jadą po rzeczywistych drogach. Pociąg lub zaplanowane połączenie biegnie przez stacje, na których się zatrzymuje.',
  'help.guide.transport-on-map.tip.2':
    'Potwierdzona rezerwacja to linia ciągła, oczekująca to linia przerywana. Ustawienie „Etykiety tras rezerwacji” pokazuje w znacznikach końcowych kod lotniska lub nazwę stacji.',
  'help.guide.transport-on-map.tip.3':
    '„Pokaż wszystkie trasy rezerwacji” nie dokłada tras do tych, które już wyświetlasz, tylko zastępuje to, co ustawiłeś pojedynczymi ikonami. Po kliknięciu wszystkie trasy są albo widoczne, albo ukryte.',
  // airtrail-import
  'help.guide.airtrail-import.title': 'Importowanie lotów z AirTrail',
  'help.guide.airtrail-import.goal':
    'Zaimportuj do podróży od razu loty, które masz już w AirTrail, i od tej pory aktualizuj je z AirTrail.',
  'help.guide.airtrail-import.step.1':
    'Gdy dodatek AirTrail jest włączony, a Twoja instancja połączona w sekcji „Integracje” w Ustawieniach, na pasku zakładki „Transport” przed przyciskiem „Transport” pojawia się ikona samolotu „Importuj z AirTrail”. Kliknij ją.',
  'help.guide.airtrail-import.step.2':
    '„Importuj z AirTrail” pokazuje loty z Twojego konta w dwóch grupach. „Podczas tej wyprawy” zawiera loty z datami w trakcie podróży, już zaznaczone. „Inne loty” zawiera pozostałe, niezaznaczone. Lot, który już jest w podróży, jest wyszarzony i oznaczony jako „Zaimportowano”.',
  'help.guide.airtrail-import.step.3':
    'Każdy wiersz to pole wyboru z linią lotniczą i numerem lotu, dwoma lotniskami i datą. Kliknij wiersz, aby uwzględnić lub pominąć lot. Loty z grupy „Inne loty” są importowane tylko wtedy, gdy je zaznaczysz.',
  'help.guide.airtrail-import.step.4':
    'Loty z przesiadką są zgrupowane: każdy z nich startuje z lotniska, na którym w ciągu doby wylądował poprzedni. Pole wyboru pod spodem, „Importuj jako jeden lot z przesiadką na tym lotnisku”, jest już zaznaczone. Zostaw je zaznaczone, aby utworzyć jedną rezerwację z przesiadką, albo odznacz, aby zaimportować odcinki jako osobne loty.',
  'help.guide.airtrail-import.step.5':
    'Kliknij przycisk w prawym dolnym rogu, który pokazuje liczbę zaznaczonych lotów, na przykład „Importuj 2”. Komunikat poinformuje Cię, ile lotów zaimportowano.',
  'help.guide.airtrail-import.step.6':
    'Loty pojawiają się jako karty w sekcji „Potwierdzono”, każda z niebieską plakietką AirTrail obok tytułu, oraz jako wiersze w dniach lotów. Lot z przesiadką to jedna karta, a jego trasa prowadzi przez lotnisko przesiadkowe.',
  'help.guide.airtrail-import.result':
    'Loty z AirTrail są kartami w zakładce Transport i wierszami w swoich dniach, każdy z plakietką AirTrail, która pokazuje, skąd pochodzi.',
  'help.guide.airtrail-import.tip.1':
    'Lot, który jest już w podróży z tym samym numerem i datą, zostaje pominięty, a komunikat podaje liczbę pominiętych lotów. Strzałka cofania na pasku narzędzi nad dniami cofa cały import.',
  'help.guide.airtrail-import.tip.2':
    'Głównym źródłem danych pozostaje AirTrail. TREK pobiera z niego zmiany, gdy otwierasz podróż, oraz co kilka minut w tle. Lot usunięty w AirTrail zachowuje kartę w TREK, a jego etykieta zmienia się na „Niezsynchronizowane”. Zmiany wprowadzone w TREK trafiają do AirTrail tylko wtedy, gdy w sekcji „Integracje” włączona jest opcja „Zapisuj zmiany z powrotem w AirTrail”.',
  'help.guide.airtrail-import.tip.3':
    'Połączony lot z przesiadką nie jest pojedynczym lotem AirTrail, który można synchronizować, więc jest importowany jednorazowo: zachowuje niebieską plakietkę, a po najechaniu na nią zobaczysz tę informację. To samo dzieje się z synchronizowanym lotem, gdy ręcznie dodasz do niego przystanek.',

  // ── Screen: trip-roadtrip ─────────────────────────────────────────────────────────────
  'help.ctx.trip-roadtrip.title': 'Podróż samochodowa',
  'help.ctx.trip-roadtrip.summary':
    'Plan pokazany jako jedna jazda: te same dni i te same miejsca, połączone jako przystanki z przejazdami między nimi, na pasku w lewej kolumnie i na mapie. Widać dystans i czas jazdy, gdzie trzeba zatankować i co jest przy drodze.',
  'help.ctx.trip-roadtrip.bullet.1':
    '„Dni” i „Podróż samochodowa” u góry lewej kolumny przełączają między planem dni a trasą przejazdu. Nic nie jest kopiowane ani zmieniane: „Dni” pokazuje plan dokładnie taki, jaki był.',
  'help.ctx.trip-roadtrip.bullet.2':
    'Na górze paska widać podsumowanie podróży: Dystans, Czas jazdy i Przystanki. Niżej jest karta dla każdego dnia z przejazdem: numer i data dnia na kafelku, potem przyciski z liczbą kilometrów i czasem jazdy, liczbą przystanków, tym, co trasa mija, oraz plakietka Ślad. Zarezerwowany lot, pociąg lub prom pojawia się w ciągu jako osobna karta.',
  'help.ctx.trip-roadtrip.bullet.3':
    'Ponumerowany przystanek to miejsce, któremu poświęcony jest dzień. Przystanek po drodze, taki jak stacja paliw, ładowarka czy parking, ma zamiast numeru ikonę swojego rodzaju i nie jest liczony. Kliknij numer, aby zmienić rodzaj przystanku, kliknij plakietkę Postój, aby ustawić czas postoju, a przeciągnij przystanek, aby przesunąć go w obrębie dnia albo na inny dzień.',
  'help.ctx.trip-roadtrip.bullet.4':
    'Między dwoma przystankami pasek przejazdu pokazuje dystans i czas odcinka. Kliknij go, aby otworzyć „Trasy tego odcinka”, albo kliknij trasę na mapie, aby poprowadzić odcinek przez punkt pośredni.',
  'help.ctx.trip-roadtrip.bullet.5':
    'Prawa kolumna zmienia się w „Na trasie”: w jednym wierszu wybierz, czego szukasz, i dzień, ustaw szerokość korytarza, a potem kliknij „Szukaj”. Plus przy wyniku, „Dodaj”, dodaje go do przejazdu w miejscu, w którym rzeczywiście go mijasz, a ikona łóżka przy hotelu dodaje nocleg. „Ręcznie” dodaje miejsce, którego wyszukiwanie nie znalazło, a trzy kropki obok tytułu importują trasę z Google Maps.',
  'help.ctx.trip-roadtrip.bullet.6':
    '„Ustawienia jazdy” pod spodem zawierają limity, samochód i jego zasięg, dzienne godziny jazdy, czego unikać, jak rysowana jest linia i czy na mapie są widoczne bieżące ostrzeżenia. Należą do podróży, więc wszyscy planują z tym samym samochodem.',
  // roadtrip-mode
  'help.guide.roadtrip-mode.title': 'Zobacz podróż jako jeden przejazd',
  'help.guide.roadtrip-mode.goal': 'Przełącz plan w tryb podróży samochodowej i dowiedz się, co pokazuje pasek trasy.',
  'help.guide.roadtrip-mode.step.1':
    'Kliknij „Podróż samochodowa” w przełączniku „Dni” / „Podróż samochodowa” u góry lewej kolumny. Plan dni zastępuje widok jazdy, a mapa pokazuje wszystkie dni, które mają trasę.',
  'help.guide.roadtrip-mode.step.2':
    'Karta na górze osi podsumowuje całą podróż: „Dystans”, „Czas jazdy” i „Przystanki”. Zostaje na miejscu, gdy przewijasz dni.',
  'help.guide.roadtrip-mode.step.3':
    'Poniżej jest karta dla każdego dnia z przejazdem; dni bez przejazdu są pomijane. Nagłówek karty pokazuje numer dnia z datą pod spodem, a dalej pigułki z dystansem i czasem przejazdu oraz liczbą przystanków w tym dniu.',
  'help.guide.roadtrip-mode.step.4':
    'Na karcie dzień jest pokazany jako sekwencja: numerowany przystanek dla każdego miejsca, odcinek jazdy między każdą parą przystanków i godzina przyjazdu przy prawej krawędzi. Zarezerwowany lot, pociąg lub prom pojawia się w sekwencji jako osobna karta.',
  'help.guide.roadtrip-mode.step.5':
    'Kliknij nagłówek dnia, aby go zwinąć. Strzałka na jego końcu się obraca. Zwinięty dzień jest też ukryty na mapie. Kliknij nagłówek ponownie, aby go pokazać.',
  'help.guide.roadtrip-mode.result':
    'Lewa kolumna pokazuje jazdę, a mapa wszystkie jej dni. „Dni” od razu przełącza z powrotem na niezmieniony plan.',
  'help.guide.roadtrip-mode.tip.1':
    'Wybór jest zapisany dla każdej podróży na Twoim koncie, więc po przeładowaniu, w innej przeglądarce lub na innym urządzeniu podróż znów otwiera się w widoku podróży samochodowej.',
  'help.guide.roadtrip-mode.tip.2':
    'Przełącznik pojawia się dopiero wtedy, gdy administrator włączy dodatek „Podróż samochodowa” w sekcji „Dodatki” panelu administratora.',
  'help.guide.roadtrip-mode.tip.3':
    'Na telefonie nie ma przełącznika: dodatek dodaje własną zakładkę „Podróż samochodowa” obok zakładki „Plan”.',
  // roadtrip-stops
  'help.guide.roadtrip-stops.title': 'Postoje po drodze i ich długość',
  'help.guide.roadtrip-stops.goal': 'Zrób z miejsca na trasie przystanek po drodze i ustaw, ile trwa każdy postój.',
  'help.guide.roadtrip-stops.step.1':
    'Kliknij numer przed przystankiem na pasku trasy. Ma on etykietę „Zamień w postój po drodze” i otwiera pod sobą rodzaje postojów jako rząd kolorowych kółek.',
  'help.guide.roadtrip-stops.step.2':
    'Wybierz rodzaj. Najedź na kółko, aby zobaczyć jego nazwę: „Nocleg”, „Paliwo”, „Ładowanie”, „Miejsce odpoczynku”, „Kemping”, „Jedzenie” lub „Atrakcje”. Numer zmienia się w ikonę tego rodzaju, a przystanki poniżej zostają ponumerowane od nowa.',
  'help.guide.roadtrip-stops.step.3':
    'Postój po drodze nie jest celem, więc nagłówek dnia liczy o jeden przystanek mniej.',
  'help.guide.roadtrip-stops.step.4':
    'Kliknij ikonę „Zmień rodzaj postoju” jeszcze raz i wybierz „Z powrotem cel podróży”, aby przystanek odzyskał swój numer.',
  'help.guide.roadtrip-stops.step.5':
    'Każdy przystanek ma plakietkę Postój, z plusem, dopóki nic nie jest zaplanowane. Kliknij ją, aby otworzyć Czas na tym przystanku.',
  'help.guide.roadtrip-stops.step.6':
    'Ustaw długość suwakiem, przyciskami minus i plus albo jedną z gotowych wartości. „Odjazd” się zmienia, a „Przyjazd” zostaje na godzinie dojazdu. Potem kliknij „Zapisz”.',
  'help.guide.roadtrip-stops.result':
    'Plakietka „Postój” zmienionego przystanku pokazuje nową długość, a wszystkie późniejsze godziny przyjazdu przesuwają się odpowiednio. Przystanek, którego rodzaj zmieniłeś i przywróciłeś, znów jest ponumerowanym celem podróży.',
  'help.guide.roadtrip-stops.tip.1':
    'Czas postoju należy do miejsca, a nie do jednej wizyty: miejsce zaplanowane na dwa dni ma ten sam czas postoju w obu dniach.',
  'help.guide.roadtrip-stops.tip.2':
    'Postoje po drodze są widoczne także w „Dniach”. Jeśli w „Ustawieniach jazdy”, w sekcji „Postoje serwisowe”, wyłączysz „Pokaż także w Dniach”, będą widoczne tylko w „Podróży samochodowej”.',
  'help.guide.roadtrip-stops.tip.3': '„Bez postoju” w tym samym oknie usuwa ustawiony czas.',
  'help.guide.roadtrip-stops.tip.4':
    'Kliknij postój po drodze albo zarezerwowaną noc, aby otworzyć jego kartę nad mapą. Przy włączonej Podróż samochodowa Edytuj otwiera tam zamiast formularza miejsca kompaktowe okno, którego używa wyszukiwarka, a Więcej szczegółów w tym oknie otwiera pełny formularz.',
  // roadtrip-corridor
  'help.guide.roadtrip-corridor.title': 'Znajdź paliwo, jedzenie i nocleg wzdłuż trasy',
  'help.guide.roadtrip-corridor.goal':
    'Szukaj wzdłuż drogi, którą faktycznie jedziesz, i dodawaj znalezione miejsca do właściwego odcinka.',
  'help.guide.roadtrip-corridor.step.1':
    'W „Szukam” otwórz listę i zaznacz, czego potrzebujesz. Możesz łączyć „Paliwo”, „Ładowanie”, „Miejsce odpoczynku”, „Kemping”, „Nocleg”, „Jedzenie” i „Atrakcje”: lista pozostaje otwarta na kolejny wybór, a pole pokazuje potem ikonę każdego rodzaju.',
  'help.guide.roadtrip-corridor.step.2':
    'Wybierz dzień z listy rozwijanej na końcu tego samego wiersza. Lista zawiera dni, które mają kartę na pasku trasy, a „Szukaj” czeka, aż trasa wybranego dnia zostanie wyznaczona.',
  'help.guide.roadtrip-corridor.step.3':
    'W sekcji „W promieniu” wybierz, jak daleko od drogi szukać po obu stronach: 2 km, 5 km lub 10 km, a potem kliknij „Szukaj”.',
  'help.guide.roadtrip-corridor.step.4':
    'Wyniki są pogrupowane według rodzaju, w kolejności, w jakiej je mijasz. Przy każdym widać, jak daleko jest od trasy i w którym miejscu dziennego przejazdu się znajduje.',
  'help.guide.roadtrip-corridor.step.5':
    'Kliknij „Dodaj”, czyli plus przy wyniku. „Dodaj jako przystanek” pokazuje, do którego dnia i na które miejsce trafi, i pyta o „Rodzaj przystanku” oraz „Czas na tym przystanku”; przy ładowarce widać też „Dostępność i taryfy”. „Dodaj” dodaje go do przejazdu, a „Więcej szczegółów” otwiera zamiast tego pełny formularz miejsca.',
  'help.guide.roadtrip-corridor.result':
    'Dodany przystanek pojawia się na trasie w miejscu, przez które przejeżdżasz, z ikoną swojego rodzaju. Trasa dnia zostaje wyznaczona na nowo przez ten przystanek, co czyści listę: wyszukaj ponownie, aby znaleźć kolejny przystanek.',
  'help.guide.roadtrip-corridor.tip.1':
    'Nic nie jest wyszukiwane, dopóki nie naciśniesz Szukaj: jedno wyszukiwanie wysyła wiele zapytań do wspólnej usługi.',
  'help.guide.roadtrip-corridor.tip.2':
    '„Filtruj według nazwy” zawęża wyniki bez ponownego wyszukiwania, a „Wyczyść wyniki” opróżnia listę i usuwa jej pinezki. Kliknij wynik, aby zobaczyć go na mapie.',
  'help.guide.roadtrip-corridor.tip.3':
    'Możesz też przeciągnąć wynik z mapy na trasę. Dzięki temu sam wybierasz odcinek, gdy tą samą drogą jedziesz dwa razy. „Ręcznie” obok „Szukaj” dodaje miejsce, którego wyszukiwanie nie znalazło, wyszukując je po nazwie.',
  // roadtrip-via
  'help.guide.roadtrip-via.title': 'Poprowadź odcinek przez punkt pośredni',
  'help.guide.roadtrip-via.goal': 'Poprowadź odcinek wybraną drogą bez dodawania przystanku.',
  'help.guide.roadtrip-via.step.1':
    'Pokaż na mapie wybrany odcinek: kliknij przystanek na pasku trasy, a potem zamknij kartę, która otworzy się nad mapą.',
  'help.guide.roadtrip-via.step.2':
    'Kliknij narysowaną trasę. Na klikniętym odcinku pojawi się punkt pośredni, a odcinek zostanie wyznaczony na nowo przez ten punkt.',
  'help.guide.roadtrip-via.step.3':
    'Pasek się zaktualizuje: nagłówek dnia pokaże nowy dystans i czas jazdy, a każdy przyjazd po punkcie pośrednim zmieni się razem z nimi.',
  'help.guide.roadtrip-via.step.4':
    'Najedź na uchwyt, aby zobaczyć podpowiedź: „Przeciągnij, aby zmienić trasę, kliknij prawym przyciskiem, aby usunąć”. Przeciągnij go w inne miejsce, a odcinek zostanie wyznaczony na nowo przez nowy punkt.',
  'help.guide.roadtrip-via.step.5':
    'Kliknij uchwyt prawym przyciskiem myszy, aby go usunąć. Odcinek znów biegnie bezpośrednią trasą.',
  'help.guide.roadtrip-via.result':
    'Odcinek biegnie wybraną drogą, a dystans, czas jazdy i godziny przyjazdu w tym dniu są liczone od nowa.',
  'help.guide.roadtrip-via.tip.1':
    'Punkt pośredni nie jest przystankiem: nie ma numeru, czasu postoju ani godziny przyjazdu i nie wlicza się do przystanków dnia.',
  'help.guide.roadtrip-via.tip.2':
    'Uchwyty są widoczne dopiero od poziomu powiększenia 9, więc na mapie z całą podróżą widać linię bez nich.',
  'help.guide.roadtrip-via.tip.3':
    'Kliknięcie dalej niż dwa kilometry od narysowanego odcinka jest ignorowane, podobnie jak kliknięcie lotu, pociągu lub promu.',
  // roadtrip-alternatives
  'help.guide.roadtrip-alternatives.title': 'Wypróbuj inną drogę na jednym odcinku',
  'help.guide.roadtrip-alternatives.goal':
    'Zobacz inne trasy proponowane dla jednego odcinka przejazdu i wybierz jedną z nich.',
  'help.guide.roadtrip-alternatives.step.1':
    'Kliknij pasek przejazdu na pasku bocznym, czyli wiersz między dwoma przystankami z dystansem i czasem odcinka. Jego etykieta to „Inne trasy”.',
  'help.guide.roadtrip-alternatives.step.2':
    'Nad mapą otworzy się okno „Trasy tego odcinka” z osobną pozycją dla każdej drogi i jej długością. Mapa rysuje każdą drogę z czasem jazdy: obecną pełnym niebieskim kolorem, pozostałe jaśniejszym niebieskim.',
  'help.guide.roadtrip-alternatives.step.3':
    'Najedź na pozycję, aby podświetlić tę drogę. „Obecna” to droga, z której korzystasz, a „Najszybsza” to najszybsza z nich. Przy pozostałych widać, o ile są wolniejsze lub jakiej klasy dróg unikają.',
  'help.guide.roadtrip-alternatives.step.4':
    'Kliknij pozycję, aby wybrać tę trasę, albo „Zamknij”, aby zostać przy obecnej.',
  'help.guide.roadtrip-alternatives.result':
    'Odcinek prowadzi teraz wybraną drogą, a odległość w kolumnie bocznej i późniejsze godziny przyjazdu również się zmieniają.',
  'help.guide.roadtrip-alternatives.tip.1':
    'Gdy wybierzesz inną drogę, TREK najpierw sprawdza ją routerem podróży samochodowej. Potem utrzymuje odcinek na tej drodze, używając jak najmniejszej liczby punktów pośrednich, i zastępuje punkty pośrednie, które odcinek już miał. Droga, której router nie potrafi pokonać, nie jest zapisywana. Wybranie własnej drogi routera ponownie usuwa punkty pośrednie.',
  'help.guide.roadtrip-alternatives.tip.2':
    '„Bez autostrady”, „Bez opłat” i „Bez promu” pochodzą z drugiego silnika z własnym modelem prędkości, więc ich czasów nie da się porównać z pozostałymi.',
  // roadtrip-limits
  'help.guide.roadtrip-limits.title': 'Ustaw samochód i limity jazdy',
  'help.guide.roadtrip-limits.goal': 'Powiedz TREK, jakim pojazdem jeździsz i jak długo chcesz jechać bez przerwy.',
  'help.guide.roadtrip-limits.step.1':
    '„Ustawienia jazdy” znajdziesz pod wyszukiwaniem w prawej kolumnie. Plakietki pokazują, co jest ustawione; kliknij, aby otworzyć.',
  'help.guide.roadtrip-limits.step.2':
    'W sekcji „Samochód” wartości „Najdłuższa jazda bez przerwy” i „Jazda dziennie” podaje się w minutach. Puste pole oznacza, że limit jest wyłączony i nic nie jest oznaczane.',
  'help.guide.roadtrip-limits.step.3':
    'W sekcji „Pojazd” wybierz, czym jedziesz. „Paliwo” tankuje tylko na stacjach paliw, „Elektryk” ładuje się tylko na stacjach ładowania, a „Oba” korzysta z obu.',
  'help.guide.roadtrip-limits.step.4':
    'Wpisz samodzielnie Zasięg na jednym baku lub Zasięg na ładowaniu. Możesz też otworzyć Policz z danych auta, pod Tankuj do: TREK weźmie Pojemność baku i Zużycie albo Akumulator, Zużycie i Zużycie akumulatora i obliczy zasięg.',
  'help.guide.roadtrip-limits.step.5':
    '„Omijaj, jeśli się da” w lewej kolumnie to preferencja, a nie zakaz: jeśli w danym dniu nie ma innej drogi, trasa i tak z niej korzysta, a w nagłówku dnia pojawia się uwaga.',
  'help.guide.roadtrip-limits.step.6':
    'Kliknij „Zamknij”. Plakietki na karcie pokazują, co jest ustawione, a oś oznacza każdy odcinek i każdy dzień, który przekracza limit.',
  'help.guide.roadtrip-limits.result':
    'Plakietki na karcie pokazują, co jest ustawione, a każdy odcinek i dzień przekraczający limit ma plakietkę na pasku.',
  'help.guide.roadtrip-limits.tip.1':
    'Ustawienia należą do podróży, więc wszyscy uczestnicy planują z tym samym autem i tymi samymi limitami.',
  'help.guide.roadtrip-limits.tip.2':
    '„Tankuj do” określa, do jakiego poziomu napełniasz bak lub baterię na przystanku, bo w trasie nikt nie ładuje do 100 %. Przystanek na tankowanie lub ładowanie może mieć własną wartość ustawioną plakietką z baterią w jego wierszu.',
  'help.guide.roadtrip-limits.tip.3':
    'W sekcji „Linia trasy” opcja „Połącz dni” wyznacza też trasę od ostatniego przystanku jednego dnia do pierwszego przystanku następnego. „Zaczynaj i kończ każdy dzień w noclegu” rozpoczyna i kończy każdy dzień w noclegu zarezerwowanym na te noce. „Kolor na dzień” pokazuje każdy dzień w osobnym kolorze.',
  // roadtrip-day-window
  'help.guide.roadtrip-day-window.title': 'Ustal początek i koniec dnia jazdy',
  'help.guide.roadtrip-day-window.goal': 'Kończ jazdę o wybranej godzinie i ustaw, gdzie ma się skończyć dzień.',
  'help.guide.roadtrip-day-window.step.1':
    'Otwórz „Ustawienia jazdy” w prawej kolumnie i znajdź „Dzienne godziny podróży” w lewej kolumnie okna.',
  'help.guide.roadtrip-day-window.step.2':
    'Ustaw „Początek dnia”. Samo to ustawienie nic nie zmienia: potrzebne są obie godziny, o czym przypomina uwaga pod nimi.',
  'help.guide.roadtrip-day-window.step.3':
    'Ustaw „Koniec dnia”. Jazda kończy się teraz o tej godzinie i jest kontynuowana następnego ranka, co w kolumnie bocznej widać jako wiersze „Koniec dnia” i „Kontynuuj podróż”.',
  'help.guide.roadtrip-day-window.step.4':
    'W sekcji Koniec dnia wybierz Na trasie, aby zatrzymać się na drodze o godzinie zakończenia, albo W ostatnim miejscu, aby zatrzymać się, zanim następny przejazd by je minął.',
  'help.guide.roadtrip-day-window.step.5':
    'Kliknij „Zamknij”. Karta „Ustawienia jazdy” pokazuje obie godziny na plakietce.',
  'help.guide.roadtrip-day-window.result':
    'Przejazd zostaje podzielony na dni podróży o ustawionej długości, a to, co się nie zmieści, przechodzi na wyliczone dni po ostatnim dniu. Twoje dni i ich miejsca się nie zmieniają.',
  'help.guide.roadtrip-day-window.tip.1':
    'Jeśli wyczyścisz którąkolwiek z godzin, funkcja znów się wyłączy. Godziny, które sam ustawisz przy przystanku, zawsze mają pierwszeństwo.',
  'help.guide.roadtrip-day-window.tip.2':
    'Gdy ustawisz dzienne godziny podróży, dni są zawsze połączone: przejazd od ostatniego przystanku jednego dnia do pierwszego przystanku następnego jest wyznaczany i liczony.',
  'help.guide.roadtrip-day-window.tip.3':
    'Koniec każdego dnia jest też znacznikiem na mapie: księżycem z numerem dnia. Przeciągnij go wzdłuż trasy lub na miejsce, aby zakończyć dzień gdzie indziej. Kliknij go prawym przyciskiem myszy, aby przywrócić automatyczny koniec. „Przywróć automatyczne końce dni” w tym oknie cofa wszystkie takie zmiany. Aby zakończyć dzień na konkretnym przystanku, kliknij go i włącz „Zakończ dzień tutaj” na jego karcie.',
  // roadtrip-refuel
  'help.guide.roadtrip-refuel.title': 'Tankowanie, zanim zabraknie paliwa',
  'help.guide.roadtrip-refuel.goal':
    'Znajdź stację na odcinku, na który samochód jeszcze dojedzie, i dodaj ją do trasy.',
  'help.guide.roadtrip-refuel.step.1':
    'Gdy zasięg jest ustawiony, kolumna boczna pokazuje na odcinku pasek w miejscu, w którym kończy się paliwo lub energia: „Tu kończy się paliwo” albo, w samochodzie elektrycznym, „Tu kończy się bateria”. Pod nim widać, w którym miejscu odcinka to nastąpi.',
  'help.guide.roadtrip-refuel.step.2':
    'Ikona lampki na pasku to przycisk: Znajdź paliwo albo Znajdź ładowarkę w samochodzie elektrycznym. Szuka wzdłuż drogi przed tym punktem i w trakcie wyszukiwania pokazuje Szukam wzdłuż trasy…',
  'help.guide.roadtrip-refuel.step.3':
    'Wyświetlane są maksymalnie trzy stacje, każda z odległością od trasy i zasięgiem, jaki by Ci pozostał.',
  'help.guide.roadtrip-refuel.step.4':
    'Plus przy propozycji dodaje ją jako postój na tankowanie. „Dodaj jako przystanek” otwiera się z wypełnionym już typem i czasem, a „Dodaj” umieszcza postój na odcinku w miejscu, przez które faktycznie przebiega trasa.',
  'help.guide.roadtrip-refuel.result':
    'Postój pojawia się na właściwym odcinku z własną ikoną, a zasięg jest liczony od niego na nowo. Pasek przesuwa się do miejsca, w którym bak będzie teraz pusty, albo znika, jeśli dojedziesz do końca bez kolejnego postoju.',
  'help.guide.roadtrip-refuel.tip.1':
    'Zasięg liczy się od ostatniego tankowania lub ładowania, także między dniami. Typ pojazdu decyduje, które postoje się liczą: przy „Paliwo” tylko tankowania, przy „Elektryk” tylko ładowania.',
  'help.guide.roadtrip-refuel.tip.2':
    'Wyszukiwanie sprawdza drogę przed punktem, w którym kończy się paliwo, uwzględnia rezerwę i liczy objazd podwójnie, więc każde proponowane miejsce jest naprawdę osiągalne.',
  'help.guide.roadtrip-refuel.tip.3':
    'Jeśli nie ma wyników, możesz wyszukać ponownie: lampka zmienia się na „Spróbuj ponownie”, ponieważ wyszukiwanie miejsc to wspólna usługa, która czasem nie odpowiada na czas.',
  // roadtrip-track
  'help.guide.roadtrip-track.title': 'Ustaw, aby dzień prowadził zaimportowanym śladem',
  'help.guide.roadtrip-track.goal':
    'Użyj widokowej trasy zaimportowanej jako ślad GPX lub KML do przejazdu w danym dniu.',
  'help.guide.roadtrip-track.step.1': 'Kliknij plakietkę „Ślad” w nagłówku dnia. Okno otworzy się na tym dniu.',
  'help.guide.roadtrip-track.step.2':
    'Wybierz ślad. Każdy pokazuje swoją długość i informację, czy biegnie wzdłuż trasy tego dnia, a jeśli nie, jak daleko od niej leży. Najbliższy ślad jest na początku.',
  'help.guide.roadtrip-track.step.3':
    'Kliknij „Podążaj za tym śladem”. TREK dodaje punkty pośrednie tam, gdzie trasa najbardziej odbiega od śladu, ponownie wyznacza trasę i powtarza to kilka razy.',
  'help.guide.roadtrip-track.step.4':
    'Okno pokazuje, ile punktów pośrednich dodano i jak blisko śladu prowadzi teraz trasa, albo informuje, że trasa już pokrywała się ze śladem. „Usuń punkty pośrednie” w lewym dolnym rogu usuwa je, a router planuje dzień od nowa. Po zamknięciu okna ślad zostaje.',
  'help.guide.roadtrip-track.result':
    'Trasa dnia podąża za śladem zamiast za drogą, którą wybrałby planer tras. Najedź na plakietkę „Ślad”, aby zobaczyć nazwę śladu. Gdy punkty pośrednie utrzymują trasę na śladzie, plakietka jest dodatkowo podświetlona.',
  'help.guide.roadtrip-track.tip.1':
    'Okno wymienia miejsca podróży, które mają ścieżkę: plik GPX lub KML zaimportowany przez „Importuj plik” w kolumnie miejsc pod „Dniami”, z zaznaczonymi „Trasy” lub „Trasy GPS (ze śladem)” dla GPX albo „Ścieżki (LineStrings)” dla KML. „Importuj plik” jest dostępne tylko przy wyłączonym dodatku „Wycieczki”; gdy „Wycieczki” są włączone, GPX staje się wycieczką, której to okno nie wymienia. Dopóki podróż nie ma śladu, żaden dzień nie pokazuje plakietki.',
  'help.guide.roadtrip-track.tip.2':
    'Podążanie za śladem zastępuje punkty pośrednie, które odcinki dnia już miały, więc ręcznie kształtuj odcinek po dopasowaniu do śladu, a nie przed.',
  'help.guide.dateless-trip.step.1': 'Kliknij „Nowa podróż” i nadaj jej nazwę.',
  'help.guide.edit-trip.tip.2':
    'Dodani lub usunięci tutaj uczestnicy podróży zmieniają się od razu, bez klikania „Aktualizuj”.',
  'help.guide.trip-reminder.result':
    'Przypomnienie dostaniesz wybraną liczbę dni przed rozpoczęciem podróży, na tych kanałach, na które odbierasz powiadomienia.',
  'help.guide.upcoming-reservations.step.1':
    'W prawej kolumnie znajdź „Nadchodzące rezerwacje”. Widać tam sześć najbliższych rezerwacji ze wszystkich twoich podróży, od najwcześniejszej, z datą, godziną i typem.',
  'help.guide.half-company-holiday.step.1': 'Przełącz pasek narzędzi na „Urlop firmowy”.',
  'help.guide.edit-holiday-calendar.result': 'Siatka i legenda aktualizują się od razu po każdej zmianie.',
  'help.guide.person-color.result': 'Wszystkie dni zapisane przez tę osobę mają teraz nowy kolor.',
  'help.guide.answer-fusion-request.step.1':
    'Gdy ktoś cię zaprosi, otwórz „Urlopy”. Okno „Zaproszenie do połączenia” pojawi się samo.',
  'help.guide.log-for-partner.step.1':
    'Na karcie „Osoby” kliknij imię osoby. Znacznik wyboru oznacza, że jest zaznaczona.',
  'help.guide.dissolve-fusion.step.1': 'Otwórz „Ustawienia”.',
  'help.guide.country-places.step.2': 'Kliknij na karcie plakietkę „Miejsca”, tę z pinezką.',
  'help.guide.search-place.tip.2': 'Jeśli region jest już zaznaczony, okienko zapyta, czy chcesz go usunąć.',
  'help.guide.tour-activity-stats.step.4':
    'Plakietki po prawej pokazują, z czego wynikają sumy: „Zaplanowano na” dla wycieczek liczonych według planu podróży, „Nagrane” dla wycieczek z podłączonym rzeczywistym śladem. „Jeszcze przed tobą”, „Bez dnia” i „Brak daty” liczą wycieczki, które nie są jeszcze wliczone. Ikona „i” wyjaśnia zasadę.',
  'help.guide.move-to-list.step.2':
    'Kliknij „Duplikuj do listy”, żeby zostawić je także tutaj, albo „Przenieś do listy”, żeby usunąć je z tej listy.',
  'help.guide.accept-list-invite.title': 'Przyjmowanie zaproszenia do listy',
  'help.guide.tour-collection-add-to-trip.step.3':
    'W sekcji „Punkty trasy” wybierz kafelek z punktami, żeby dodać start, przystanki i koniec w ich kolejności, albo „Tylko linia”, żeby dodać samą zapisaną linię.',
  'help.guide.tour-collection-manage.step.1':
    'Otwórz listę. Przy każdej zapisanej wycieczce widać stopień trudności, typ, podróż, z której ją zapisano, dystans, przewyższenie i liczbę punktów trasy. Najedź na nazwę podróży, żeby sprawdzić, kto ją zapisał.',
  'help.guide.entry-draft.step.1': 'W edytorze włącz „Szkic” w prawej kolumnie.',
  'help.guide.journey-map-layers.step.3':
    'Kliknij pustą pinezkę albo małą kropkę na mapie. Karta pokaże, co to jest: zaplanowane miejsce i jego dzień albo pobyt z przyciskiem „Otwórz wpis”, który prowadzi do relacji dnia, do której należy.',
  'help.guide.journey-keep-route.step.3': 'Kliknij „Zapisz trasę”.',
  'help.guide.journey-day-stays.step.3':
    'Przy pobycie, którego nie chcesz, kliknij „To nie jest miejsce, w którym byłem”. Pobyt zniknie z listy.',
  'help.guide.journey-take-over-day.step.3':
    'Jeśli wolisz jeden wpis na cały dzień, przełącz „Wpisy” na „Relacja dnia”: jeden wpis wymieni wtedy wszystkie wybrane pobyty z godzinami.',
  'help.guide.journey-auto-prepare.step.2':
    'W sekcji „Zapisane dni” włącz „Automatycznie przygotowuj zarejestrowane dni”.',
  'help.guide.photo-location.step.2': 'W sekcji „Zdjęcia” włącz „Ustalaj miejsce wpisów z ich zdjęć”.',
  'help.guide.link-trip.tip.3':
    'Gdy piszesz wpis w dniu podróży, która nie jest jeszcze powiązana, edytor proponuje „Powiąż podróż” bezpośrednio we wpisie.',
  'help.ctx.settings-plugins.summary':
    'Twoje własne ustawienia wtyczek zainstalowanych przez administratora: klucze i preferencje, o które prosi każda wtyczka, oraz dziennik tego, co wtyczki zrobiły w twoim imieniu. Karta jest widoczna tylko wtedy, gdy jakaś wtyczka jest aktywna.',
  'help.ctx.settings-about.bullet.3':
    'Przez Ko-fi, Buy Me a Coffee i Discord możesz wesprzeć TREK albo porozmawiać z jego twórcami.',
  'help.guide.language-region.step.3':
    'Ustaw „Waluta wyświetlania” albo zostaw „Waluta wyjazdu”, żeby każda podróż była pokazywana we własnej walucie. Potem wybierz „Jednostka temperatury”, „Jednostka odległości”, „Format czasu” i dzień, od którego zaczyna się tydzień („Tydzień zaczyna się w”).',
  'help.guide.travel-map-prefs.step.3':
    '„Odkrywaj miejsca na mapie” pokazuje pigułkę kategorii do wyszukiwania miejsc w pobliżu. „Rozmyj kody rezerwacji” ukrywa numery potwierdzeń, dopóki ich nie najedziesz lub nie dotkniesz. „Optymalizuj trasę od zakwaterowania” zaczyna i kończy dzień w twoim hotelu.',
  'help.guide.web-push-device.step.2':
    'Na karcie „Powiadomienia” u góry kolumna „Push” określa, które zdarzenia są wysyłane na twoje urządzenia.',
  'help.guide.connect-airtrail.goal': 'Pozwól TREK importować i synchronizować loty z twojego AirTrail.',
  'help.guide.connect-dawarich.goal': 'Pozwól TREK odczytywać z twojego Dawarich, gdzie naprawdę byłeś.',
  'help.guide.tour-connect-wanderer.goal':
    'Pozwól TREK odczytywać szlaki z twojego wanderer, żeby importować je jako wycieczki.',
  'help.guide.tour-wanderer-watch.title': 'Powiadomienia o zmianach szlaków w wanderer',
  'help.guide.plugin-settings.tip.2':
    'Kanał wtyczki w sekcji „Powiadomienia” ma przycisk „Skonfiguruj”, który otwiera tę stronę.',
  'help.guide.default-user-settings.result':
    'Twoje ustawienia zobaczą nowe konta i wszyscy, którzy nigdy ich nie zmieniali.',
  'help.guide.own-routing-engine.goal':
    'Wyznaczaj trasy dni i road tripów przez własny serwer OSRM lub Valhalla zamiast publicznych.',
  'help.guide.admin-passkeys.tip.1':
    'Jeśli TREK nie może jeszcze ustalić domeny, wyświetla ostrzeżenie, a klucze dostępu pozostają ukryte, dopóki nie ustawisz APP_URL lub Relying Party ID.',
  'help.guide.rotate-jwt-secret.step.1':
    'Na dole karty „Ustawienia”, w sekcji „Strefa zagrożenia”, kliknij „Odnów” obok „Zmień sekret JWT”.',
  'help.guide.storage-backends.tip.3':
    'TREK może ponownie pobrać pamięć podręczną zdjęć, więc jej replikowanie zwykle tylko zajmuje miejsce.',
  'help.guide.admin-channels.step.3':
    'Na karcie „Powiadomienia” poniżej wybierz dla każdego zdarzenia kanały, którymi ma być wysyłane: „Nowa wersja dostępna”, „Awaria repliki magazynu” i „Prośba o region wodny”. Każdy przełącznik zapisuje się od razu.',
  'help.guide.notification-defaults.tip.1':
    '„Wył.” to ustawienie domyślne, które każdy użytkownik może sam włączyć; „Zablokowane” wyłącza powiadomienie dla wszystkich.',
  'help.ctx.notifications.bullet.4':
    'Obok godziny każdego powiadomienia „Oznacz jako przeczytane” (podwójny ptaszek) i „Usuń” (kosz) dotyczą tylko tego jednego. „Oznacz wszystkie jako przeczytane” i „Usuń wszystkie” u góry dotyczą całej listy.',
  'help.guide.read-notifications.tip.2':
    'Powiadomienie bez przycisku ma tylko charakter informacyjny. Przeczytaj je w panelu i tam oznacz jako przeczytane.',
  'help.guide.filter-notifications.result': 'Na liście zostają tylko nieprzeczytane powiadomienia, od najnowszych.',
  'help.guide.delete-notifications.title': 'Usuwanie powiadomień',
  'help.guide.notification-settings.goal':
    'Zdecyduj, które zdarzenia pojawiają się pod ikoną dzwonka, a które dostajesz też e-mailem, webhookiem, przez ntfy lub push.',
  'help.guide.public-link.step.4': 'Kliknij „Utwórz link”, potem „Kopiuj” i wyślij link.',
  'help.guide.link-journal.step.2':
    'Kliknij „Połącz dziennik” i wybierz jeden ze swoich dzienników w oknie „Wybierz dziennik”.',
  'help.guide.dawarich-stays.title': 'Zamiana zapisanego pobytu w miejsce',
  'help.guide.dawarich-stays.tip.2': 'Jeśli usuniesz miejsce utworzone z pobytu, pobyt wróci na listę jako oczekujący.',
  'help.guide.leave-stop-off-route.goal':
    'Zostaw przystanek w dniu, ale bez prowadzenia do niego trasy, np. dla miejsca, które mijasz pieszo albo chcesz mieć tylko na mapie.',
  'help.guide.day-route.tip.4':
    'Jeśli chcesz mieć przystanek w dniu, ale nie na trasie, wybierz w jego menu „Pomiń w trasie”.',
  'help.guide.move-booking-day.step.2':
    'Przeciągnij wiersz na nagłówek karty innego dnia. Rezerwacja jednodniowa przenosi się na ten dzień w całości. Przy rezerwacji na kilka dni wiersz „Wylot” zmienia dzień rozpoczęcia, a wiersz „Przylot” dzień zakończenia.',
  'help.guide.place-image-from-file.title': 'Załączone zdjęcie jako obraz miejsca',
  'help.guide.place-image-from-file.tip.2':
    'Do wyboru jest też zdjęcie przypięte do przystanku lub załączone do jego rezerwacji.',
  'help.guide.place-own-hours.step.5':
    'Kliknij „Aktualizuj”. Karta pokazuje teraz twoje godziny w sekcji „Godziny otwarcia”, a status „Otwarte” lub „Zamknięta” u góry wynika z nich.',
  'help.guide.confirm-stay-booking.step.3':
    'Kliknij „Oczekujące” u góry. Podpowiedź pokazuje „Ustaw na Potwierdzono”, a kropka zmienia kolor na zielony.',
  'help.guide.map-nearby-places.tip.4':
    'Kategoria, której wyszukiwanie się nie powiodło, dostaje czerwoną kropkę, a przycisk „Szukaj w tym obszarze” robi się czerwony z ikoną ostrzeżenia: kliknij go, żeby spróbować ponownie.',
  'help.guide.tour-map-lines.tip.1': 'Gdy zwiniesz dzień w kolumnie dni, jego wycieczki i przystanki znikają z mapy.',
  'help.guide.car-stops.step.3':
    'Wpisz tytuł w nagłówku. W sekcji „Trasa” wybierz w polu „Od”, gdzie odbierasz samochód, a w polu „Do”, gdzie go zwracasz; miejsca podróży są podpowiadane, zanim zaczniesz pisać. „Odbiór” i „Godz. odbioru” określają, kiedy odbierasz auto, a „Zwrot” i „Godz. zwrotu”, kiedy je oddajesz.',
  'help.guide.transport-details.step.1':
    'Na karcie „Transport” kliknij kartę przejazdu. Szczegóły otwierają się nad kartą, z nagłówkiem w tym samym kolorze co karta przejazdu. Te same szczegóły otwiera wiersz transportu w planie dnia.',
  'help.guide.export-transports-csv.tip.2':
    'Karta „Rezerwacje” ma tę samą ikonę i zapisuje osobny plik z końcówką bookings.csv.',
  'help.guide.group-sort-bookings.step.2':
    'W sekcji „Grupuj według” wybierz „Status”, „Dzień”, „Typ” lub „Bez grupowania”. Karta od razu dzieli się na odpowiednie sekcje.',
  'help.guide.export-bookings-csv.result':
    'Przeglądarka pobiera plik nazwany od podróży i karty, np. autumn-in-japan-bookings.csv, z jednym wierszem dla każdej rezerwacji widocznej na karcie.',
  'help.guide.arrange-packing-list.result':
    'Listy są w kolejności, w jakiej je przeciągnąłeś, a przedmioty są posortowane „Od A do Z”, dopóki tego nie wyłączysz. TREK nadal pamięta twoją własną kolejność.',
  'help.guide.count-packed-pieces.step.2':
    'Przed ilością pojawia się licznik 0/5 z minusem i plusem. Kliknij plus za każdą sztukę, którą wkładasz do torby.',
  'help.guide.expense-receipts.step.4':
    'W zestawieniu wiersz ma teraz obok nazwy znacznik „Paragon”, a jeśli paragonów jest kilka, w nawiasie widać ich liczbę. Kliknij go, żeby otworzyć paragon.',
  'help.guide.final-budget.tip.3':
    'Osoba, która opuściła podróż, zostaje w „Saldach” i „Budżecie końcowym”, dopóki ktoś jest jej winien pieniądze albo ona komuś.',
  'help.guide.files-sync-settings.step.2':
    'Pasek przepływu pokazuje TREK i twój magazyn z dokumentami, które każde z nich przechowuje, a między nimi dwa pasy: „Do repozytorium” i „Z repozytorium”. Kliknij „Do repozytorium”, żeby go wyłączyć. Pas zostaje wyszarzony, a pod pasami pojawia się napis „Tylko przychodzące”. Kliknij ponownie, żeby go włączyć.',
  'help.guide.files-sync-settings.tip.4':
    'Zmieniać te ustawienia może tylko właściciel podróży lub administrator. Pozostali uczestnicy widzą pasek przepływu z napisem w rodzaju „Dokumenty przesyłane w obie strony”, ale bez „Ustawień”.',
  'help.guide.manage-notes.step.2':
    '„Rozwiń” otwiera całą notatkę: pełny tekst, jej stronę internetową i pliki. Kliknij plik, żeby zobaczyć podgląd. „Edytuj” na dole przełącza od razu do edytora, a krzyżyk w prawym górnym rogu zamyka notatkę.',
  'help.guide.note-categories.goal':
    'Nadaj notatkom grupy nazwane, kolorowe kategorie i wyświetlaj jedną kategorię naraz.',
  'help.guide.note-categories.tip.1':
    'Kosz usuwa tylko kategorię, której nie używa żadna notatka. Kategoria, z której korzystają notatki, zostaje na liście, dopóki nie przeniesiesz ich do innej kategorii.',
  'help.guide.roadtrip-reorder.title': 'Zmiana kolejności przystanku lub przeniesienie na inny dzień',
  'help.guide.roadtrip-reorder.tip.3':
    'TREK nie pyta o przypiętą godzinę: oś od razu przelicza dzień i oznacza przystanki, do których nie da się już dotrzeć na czas.',
  'help.guide.roadtrip-overnight.step.3':
    'U góry okna „Nocleg” dodaje nocleg, a „Postój” zamienia miejsce w przystanek na jakiś czas. Hotel otwiera się z opcją „Nocleg”, kemping z opcją „Postój”. Przy noclegu podajesz tylko „Zameldowanie”, które możesz zostawić puste.',
  'help.guide.roadtrip-stop-fill.step.1':
    'Przy przystanku na tankowanie lub ładowanie na osi kliknij plakietkę z baterią. Pokazuje poziom, do którego tankujesz na przystanku: jest wyblakła, dopóki korzysta z twojej wartości „Tankuj do”, a pełna, gdy ma własną wartość.',
  'help.guide.roadtrip-bookings.step.1':
    'Zarezerwuj przejazd jako „Lot”, „Pociąg”, „Prom”, „Rejs” lub „Autobus” w odpowiednim dniu, z określonymi oboma końcami. Trasa samochodowa uwzględnia go automatycznie: droga kończy się na terminalu, z którego odjeżdżasz, i zaczyna się ponownie tam, gdzie przejazd się kończy.',
  'help.guide.roadtrip-google-import.result':
    'Przystanki z trasy są dodawane po ostatnim przystanku tego dnia, a trasa na osi i na mapie prowadzi przez nie.',
  'help.guide.roadtrip-hazards.step.3':
    'Ostrzeżenia są zaznaczone na mapie jako obszary. Kliknij jedno z nich, żeby zobaczyć, czego dotyczy, która usługa je zgłosiła i kiedy zostało ostatnio zaktualizowane.',
  'help.ctx.trip-tours.bullet.2':
    'U góry „Importuj GPX lub KML” dodaje pliki jako wycieczki. Przycisk filtra pod nim (na początku „Wszystkie” z liczbą wycieczek) zawęża listę według statusu, źródła, limitu trudności i typu.',
  'help.guide.tour-show-list.step.2':
    'Każdy wiersz to jedna wycieczka. Kolorowy pasek to jej linia na mapie, a okrągły kafelek pokazuje limit trudności (T1 do T6) wędrówki zaplanowanej w TREK albo ikonę jej typu. Plakietki pod nazwą pokazują dni, do których jest przypisana, czas, dystans i podejście. Przy wycieczce wielodniowej księżyc z liczbą pokazuje, ile ma etapów.',
  'help.guide.tour-add-to-day.title': 'Przypisywanie wycieczki do dnia',
  'help.guide.tour-add-to-day.tip.2':
    'Jeśli podróż kończy się przed ostatnim etapem, opcja pokazuje ostatni etap, który się mieści, a kolejne etapy zostają bez dnia.',
  'help.guide.tour-day-times.step.3':
    'Kliknij „Aktualizuj”. W wierszu widać teraz początek → koniec. Wyliczona godzina zakończenia jest jaśniejsza: ≈ oznacza szacunek, ≥ pobyt bez ustalonej jeszcze godziny, a +1 godzinę po północy. Najedź na nią, żeby zobaczyć, jak została wyliczona.',
  'help.guide.tour-remove-from-day.goal': 'Usuń wycieczkę z planu, nie kasując jej.',
  'help.guide.tour-filter-list.goal':
    'Zawęź długą listę do wycieczek, których szukasz: jeszcze niezaplanowanych, z pliku albo jednego typu.',
  'help.guide.tour-filter-list.result':
    'Na liście są tylko wycieczki pasujące do filtra; pozostałe nadal należą do podróży.',
  'help.guide.tour-hide-on-map.result': 'Na mapie są tylko wybrane wycieczki, a ukryte zostają na liście, przygaszone.',
  'help.guide.tour-import-plan-tab.result':
    'Ślad jest teraz wycieczką w podróży: wierszem na liście z plakietką GPX i linią na mapie.',
  'help.guide.tour-detail-read.title': 'Otwieranie wycieczki i jej karta',
  'help.guide.tour-detail-read.step.7': 'Zamknij kartę przyciskiem X u góry albo naciśnij Escape.',
  'help.guide.tour-rename-colour.goal':
    'Nadaj wycieczce nazwę, którą łatwo rozpoznasz, i kolor linii dobrze widoczny na mapie.',
  'help.guide.tour-take-along.title': 'Pobieranie wycieczki na telefon lub GPS',
  'help.guide.tour-take-along.tip.4':
    'Na karcie „Wycieczki” to samo pobieranie jest u góry lewej kolumny. Jeśli wycieczka ma niezapisane zmiany, przed pobraniem pojawi się prośba o zapisanie.',
  'help.guide.tour-copy-keep.tip.1':
    'W obu przypadkach to kopie: późniejsze zmiany wycieczki nie wpływają ani na kopię, ani na wersję zapisaną w kolekcji.',
  'help.guide.tour-packing-link.step.2':
    'W sekcji „Połącz z” wybierz „Cała lista pakowania” albo jedną z jej list. Przy każdym wierszu widać liczbę przedmiotów.',
  'help.guide.tour-files.title': 'Dołączanie plików do wycieczki',
  'help.guide.tour-activity-link.title': 'Powiązanie rzeczywistego śladu',
  'help.guide.tour-activity-link.tip.2':
    'Powiązać możesz tylko zaimportowany ślad, którego nie użyto do zaplanowania wycieczki, a każdy ślad tylko z jedną wycieczką.',
  'help.guide.tour-activity-compare.step.4':
    '„Zmień” pod śladem wybiera inne nagranie. „Odłącz” usuwa je z wycieczki, a ślad zostaje w podróży jako import.',
  'help.guide.tour-origin-check.step.3':
    'Wycieczka narysowana na karcie „Wycieczki” ma oznaczenie „zaplanowano w TREK” z datą w polu „Utworzono”.',
  'help.ctx.trip-tour-planner.bullet.2':
    'Lewy panel to edytor. Gdy nic nie jest otwarte, proponuje „Zaplanuj nową wycieczkę”. Otwarta wycieczka pokazuje nazwę, typ, punkty trasy, karty właściwe dla swojego typu i szczegóły, a na dole przyciski „Odrzuć” i „Zapisz”.',
  'help.guide.tour-open-workspace.step.2':
    'Lewy panel to edytor. Gdy żadna wycieczka nie jest otwarta, proponuje „Zaplanuj nową wycieczkę”, co rozpoczyna nową wycieczkę na mapie.',
  'help.guide.tour-open-workspace.tip.3':
    'Jeśli w edytorze są niezapisane zmiany, przed otwarciem innej wycieczki TREK zapyta, czy wybierasz „Odrzuć zmiany”, czy wolisz dalej edytować.',
  'help.guide.tour-draw-route.step.5':
    'Klikaj kolejne punkty w takiej kolejności, w jakiej je pokonujesz. Każde kliknięcie dodaje nowy punkt końcowy, a od dwóch punktów TREK wyznacza trasę po ścieżkach.',
  'help.guide.tour-type-profile.goal':
    'Wybierz rodzaj wycieczki, a dla roweru także profil, żeby trasa prowadziła właściwymi drogami.',
  'help.guide.tour-edit-points.title': 'Przesuwanie, zmiana kolejności i usuwanie punktów',
  'help.guide.tour-edit-points.tip.1':
    'Pierwszy punkt ma plakietkę „Początek”, a ostatni „Koniec”. Przeniesienie punktu na samą górę lub na sam dół czyni go początkiem lub końcem.',
  'help.guide.tour-shaping-points.step.4':
    'Żeby zamienić przystanek w punkt kształtujący lub odwrotnie, otwórz „Więcej działań” w jego wierszu i wybierz „Zrób z niego punkt kształtujący” albo „Zrób z niego przystanek”.',
  'help.guide.tour-loop-reverse.step.2':
    'Ostatni wiersz pokazuje teraz „Powrót do startu”, a trasa na mapie kończy się tam, gdzie się zaczęła.',
  'help.guide.tour-leg-by-hand.step.1':
    'Otwórz „Więcej działań” przy punkcie, od którego zaczyna się odcinek, i wybierz „Narysuj następny odcinek ręcznie”.',
  'help.guide.tour-trip-places.goal': 'Dodaj miejsce zaplanowane już w podróży jako przystanek wycieczki.',
  'help.guide.tour-trip-places.result':
    'Wycieczka ma nowy przystanek odpowiadający miejscu z podróży, o tej samej nazwie.',
  'help.guide.tour-details-times.tip.2':
    'Przy wędrówce w „Szczegółach” są też „Maksymalna trudność szlaku” i „Wybór trasy”, opisane w przewodnikach o wędrówkach. Spacer po mieście nie ma pola „Przerwy”: zamiast tego liczy się czas spędzony na przystankach.',
  'help.guide.tour-save.step.4':
    'Wycieczka jest teraz na liście „Wycieczki w tej podróży”, jeszcze bez przypisanego dnia.',
  'help.guide.tour-edit-saved.step.2':
    'Zmień, co trzeba, tak jak przy nowej wycieczce: przesuń lub dodaj punkty, zmień rodzaj albo edytuj szczegóły, tutaj „Opis”.',
  'help.guide.tour-summary-profile.goal':
    'Sprawdź, jak długa i stroma jest wycieczka i na jakiej wysokości jesteś w każdym miejscu trasy.',
  'help.guide.tour-summary-profile.result':
    'Wiesz, jak długa jest wycieczka, ile ma podejść, ile trwa i gdzie robi się stromo.',
  'help.guide.tour-list-manage.tip.1':
    'Każda wycieczka liczy się w sumach raz, nawet jeśli jest przypisana do kilku dni. Suma ze znakiem ≥ nie obejmuje niektórych wycieczek. Najedź na nią, żeby zobaczyć, ilu.',
  'help.guide.tour-delete.tip.1': 'Tej operacji nie można cofnąć, a przycisk „Cofnij” nie przywraca wycieczki.',
  'help.guide.tour-saved-elsewhere.step.3':
    'Jeśli mimo to klikniesz „Zapisz”, otworzy się okno „Zmieniono w międzyczasie” i nic nie zostanie nadpisane.',
  'help.ctx.trip-tour-import.bullet.2':
    '„Podgląd importu” pokazuje każdy ślad z plików na mapie, z dystansem, podejściem, zejściem i liczbą punktów, zanim cokolwiek zostanie zapisane. W sekcji „Importuj jako” określasz, czym są ślady.',
  'help.guide.tour-import-gpx.step.3':
    'Otwiera się „Podgląd importu”; nic nie jest jeszcze zapisane. Mapa pokazuje cały przebieg, a każdy ślad z plików to ponumerowany wiersz z dystansem, podejściem, zejściem i liczbą punktów. Przy nagranym śladzie widać też, kiedy powstał i ile trwał.',
  'help.guide.tour-import-gpx.result':
    'Wycieczka jest na liście „Wycieczki w tej podróży”, jeszcze bez dnia. Pojedyncza wycieczka od razu otwiera się na mapie jako „Wycieczka GPX”.',
  'help.guide.tour-view-import.tip.3': 'Szlak z wanderer otwiera się tak samo, jako „Wycieczka z wanderer”.',
  'help.guide.tour-plan-from-import.tip.1':
    '„Odrzuć” usuwa propozycję. Nic nie zostaje zapisane, dopóki nie zapiszesz.',
  'help.guide.tour-restore-recorded.step.2': 'Kliknij „Przywróć zarejestrowany ślad”.',
  'help.guide.tour-take-over.step.2': 'Wybierz „Przejmij trasę z innej podróży”.',
  'help.guide.tour-take-over.result':
    'Komunikat potwierdza przejęcie, a wycieczka otwiera się w edytorze, gotowa do przypisania do dnia.',
  'help.guide.tour-import-wanderer.tip.2':
    'Import to kopia: późniejsze zmiany w wanderer nie wpływają na wycieczkę. „Sprawdź źródło” w sekcji „Pochodzenie” wycieczki pokaże, kiedy szlak się zmienił.',
  'help.ctx.trip-tour-map.bullet.3':
    '„Szukaj miejsca lub adresu” u góry mapy przenosi widok do miejscowości, schroniska lub szczytu, niczego nie dodając do wycieczki.',
  'help.guide.tour-map-layers.result':
    'Wycieczka jest pokazana na odpowiedniej dla niej mapie, a pigułka informuje, która mapa jest włączona.',
  'help.guide.tour-along-search.step.3':
    'W sekcji „W tej odległości od trasy” wybierz, jak daleko od linii szukać: 250 m, 500 m, 1 km lub 2 km.',
  'help.guide.tour-along-add-stop.goal':
    'Poprowadź wycieczkę przez punkt widokowy, schronisko lub źródło, które znalazłeś po drodze.',
  'help.guide.tour-along-add-stop.tip.3':
    'Odcinek, na którym nie można dodać przystanku (ferrata lub przenoska dodana jako stała linia albo odcinek narysowany ręcznie), jest na liście przygaszony, a obok widać powód.',
  'help.guide.tour-3d-terrain.result':
    'Zobaczyłeś wycieczkę na terenie 3D z kolorowo zaznaczonymi stromymi odcinkami, a do planowania wróciła płaska mapa.',
  'help.guide.tour-3d-flyover.step.3':
    '„Postój” zatrzymuje przelot w bieżącym miejscu, a „Odtwórz przelot” wznawia go od tego miejsca. „Od początku” wraca na start i rozpoczyna przelot od nowa.',
  'help.guide.tour-map-overlays.step.1':
    'Otwórz wycieczkę narciarską na karcie „Wycieczki”. Trasy narciarskie są włączone od początku: ich przełącznik to ośnieżona góra w pigułce w lewym dolnym rogu, „Trasy zjazdowe, biegowe i wyciągi”. Kliknij go, żeby ukryć je na mapie, i jeszcze raz, żeby je pokazać.',
  'help.ctx.trip-tour-stages.title': 'Wycieczki wielodniowe',
  'help.guide.tour-multi-day.goal': 'Podziel jedną trasę na etapy, po jednym na każdy dzień w drodze.',
  'help.guide.tour-multi-day.tip.2':
    'Żeby z powrotem połączyć dwa etapy, wybierz „Usuń koniec etapu” w menu przystanku z księżycem. Usunięcie tego przystanku też je łączy, a komunikat proponuje „Cofnij”.',
  'help.guide.tour-stages-on-days.step.3':
    'Wybierz „Etapy od tego dnia”: etap 1 trafia na ten dzień, a każdy kolejny na następny dzień. „Cała trasa w tym dniu” umieszcza zamiast tego całą trasę w jednym dniu.',
  'help.guide.tour-stages-on-days.result':
    'Każdy etap jest przypisany do swojego dnia podróży, a otwarty etap jest w edytorze.',
  'help.ctx.trip-tour-hike.bullet.6':
    '„Podsumowanie wycieczki” po prawej podaje dystans, podejście, szacowany czas marszu lub biegu, przerwy i łączny planowany czas, a pod nimi profil wysokości. „Zapisz” na dole edytora zapisuje wycieczkę.',
  'help.guide.tour-hike-plan.step.6': 'Kliknij „Zapisz” na dole lewej kolumny.',
  'help.guide.tour-hike-trail-details.step.1':
    'Otwórz wędrówkę z listy „Wycieczki w tej podróży” i znajdź „Szczegóły szlaku” pod kartą „Punkty trasy”. Włącz „Pokaż wzdłuż trasy”.',
  'help.guide.tour-hike-trail-details.tip.3':
    'Nic na tej karcie nie zmienia wycieczki, a do działania potrzebne jest połączenie z internetem. Zaimportowana wędrówka pokazuje tę samą kartę w swoim widoku, bez limitu trudności.',
  'help.guide.tour-hike-round.result':
    'Wędrówka prowadzi wybraną pętlą z powrotem do startu. „Pętla przyjęta” na dole mapy ma przycisk „Cofnij”, a „Zapisz” utrwala zmianę.',
  'help.guide.tour-hike-compare-ways.step.3':
    'Plakietki w wierszu pokazują, o ile dana droga jest dłuższa, wyżej prowadzi lub zajmuje więcej czasu niż obecna. Kliknij tę, którą wybierasz.',
  'help.guide.tour-ferrata-add.step.1':
    'Przy otwartej wędrówce kliknij „Ferraty” w rzędzie przycisków mapy w lewym dolnym rogu. Plakietka pokazuje liczbę ferrat w widoku; przybliż mapę, jeśli pojawi się taka prośba.',
  'help.guide.tour-ferrata-add.tip.3':
    'Odcinek ferraty jest wyróżniony na profilu wysokości, więc widzisz, w którym momencie dnia do niego dotrzesz.',
  'help.guide.tour-run-plan.step.5': 'Nadaj biegowi nazwę w polu „Nazwa wycieczki” i kliknij „Zapisz”.',
  'help.guide.tour-run-ways.step.1':
    'Otwórz bieg z listy „Wycieczki w tej podróży” i włącz „Pokaż wzdłuż trasy” w „Szczegółach szlaku”, pod kartą „Punkty trasy”.',
  'help.ctx.trip-tour-walk.bullet.1':
    'Rodzaj wycieczki „Spacer po mieście / zwiedzanie” zamienia wycieczkę w spacer. Jego punkty to przystanki z etykietą, czasem pobytu i ważnością. Spacer nie ma limitu trudności ani pola „Przerwy”: zamiast tego liczą się pobyty.',
  'help.guide.tour-walk-plan.step.2':
    'Dodaj przystanki: sprawdź, czy „Dodaj punkt” jest włączone, i kliknij mapę w miejscu każdego z nich albo kliknij „Miejsca podróży”, żeby wybrać miejsce, które już jest w podróży.',
  'help.guide.tour-walk-plan.result':
    'Spacer pokazuje przystanki z czasem pobytu, a „Podsumowanie wycieczki” je sumuje. Przypisz go do dnia, żeby zobaczyć, o której dotrzesz do każdego przystanku.',
  'help.guide.tour-walk-sights.tip.1': 'Miejsce staje się przystankiem spaceru, a nie miejscem podróży.',
  'help.guide.tour-walk-day-times.step.3':
    'Otwórz spacer ponownie na karcie „Wycieczki”. U góry sekcji „Punkty trasy” pole „Godziny dla” pokazuje dzień i godzinę startu. Jeśli spacer jest zaplanowany na kilka dni, kliknij je, żeby wybrać inny dzień.',
  'help.guide.tour-walk-google-import.goal':
    'Wklej trasę pieszą udostępnioną z Google Maps i wczytaj jej przystanki jako spacer.',
  'help.guide.tour-walk-google-import.result':
    'W edytorze otwiera się nowy spacer po mieście z przystankami z Google Maps, gotowy do zapisania.',
  'help.guide.tour-walk-check-off.tip.2': 'Wiersz spaceru w planie dnia też pokazuje licznik, np. 3/7.',
  'help.ctx.trip-tour-bike.bullet.4':
    'W profilu MTB ta sama karta pokazuje stopnie trudności szlaków (mtb:scale) tam, gdzie dodali je mapujący. Droga bez stopnia ma nieznaną trudność, co nie znaczy, że jest łatwa.',
  'help.guide.tour-bike-profile.step.6':
    'Wpisz nazwę w polu „Nazwa wycieczki”, a potem kliknij „Zapisz” na dole lewego panelu.',
  'help.guide.tour-bike-surfaces.goal':
    'Sprawdź, jaka część trasy to asfalt, szuter lub nawierzchnia nieznana i jakimi rodzajami dróg prowadzi.',
  'help.guide.tour-bike-surfaces.tip.3':
    'Karta korzysta z trasy wyznaczonej przez router i niczego w wycieczce nie zmienia. Wymaga połączenia z internetem; offline wyświetla odpowiedni komunikat, a trasa pozostaje bez zmian.',
  'help.guide.tour-bike-mtb-grades.tip.1':
    'Brak stopnia w danych oznacza nieznaną trudność, a nie łatwy szlak. Stopień nie mówi nic o tym, czy szlak jest dla ciebie odpowiedni.',
  'help.ctx.trip-tour-ski.bullet.3':
    'Każdy punkt kliknięty na mapie jest łączony z poprzednim po trasach zjazdowych, wyciągach i szlakach. Pod każdym punktem jego odcinek jest rozpisany na znaczniki: trasy w kolorze stopnia trudności, z liczbą minut. Odcinek, którego nie da się zaplanować, robi się czerwony, pokazuje przyczynę i proponuje poprawkę albo „Rysuj prosto”.',
  'help.guide.tour-ski-plan.step.4':
    'Sprawdź, czy „Dodaj punkt” jest włączone, a potem kliknij na mapie miejsce startu i kolejno każde miejsce, do którego chcesz dotrzeć. Router tras narciarskich łączy każdy punkt z poprzednim po trasach zjazdowych, wyciągach i szlakach.',
  'help.guide.tour-ski-options.title': 'Ustawienia jazdy dla routera tras narciarskich',
  'help.guide.tour-ski-options.tip.2':
    '„Korzystaj z wyciągów” jest domyślnie włączone dla „Zjazdowe” i snowboardu, a wyłączone dla pozostałych dyscyplin. „Pomiń” i „W razie potrzeby zjedź wyciągiem” są widoczne tylko wtedy, gdy korzystasz z wyciągów.',
  'help.guide.tour-ski-fix-leg.tip.1':
    'Możesz też przeciągnąć punkt na mapie bliżej trasy zjazdowej, szlaku lub wyciągu. Gdy go puścisz, odcinek zostanie zaplanowany od nowa.',
  'help.guide.tour-ski-summary.step.2':
    '„Jazda”, „Na wyciągach”, „Oczekiwanie” i „Pieszo” podają czas każdej z tych części. „Trasy”, „Zjazd po trasach” i „Przejazdy wyciągiem” podają długość tras, wysokość, jaką na nich zjeżdżasz, i liczbę wyciągów, z których korzystasz.',
  'help.guide.tour-ski-pistes-layer.goal':
    'Zobacz trasy zjazdowe, biegowe i wyciągi wokół swojej wycieczki narciarskiej i sprawdź, co oznaczają ich kolory.',
  'help.guide.tour-ski-import.title': 'Import śladu narciarskiego z określeniem rodzaju',
  'help.guide.tour-ski-import.tip.1':
    'Zaimportowany ślad zostaje w takiej postaci, w jakiej go nagrano: TREK nie dopasowuje go do tras, a jego karta pokazuje „Czas na nartach” jako „Nie wyliczono”.',
  'help.ctx.trip-tour-paddle.bullet.3':
    '„Więcej działań” przy punkcie zawiera narzędzia do wiosłowania: zaplanowanie następnego odcinka po wodzie lub narysowanie go ręcznie, „Przenieś łódź od tego miejsca” i „Śluza w tym punkcie”.',
  'help.guide.tour-paddle-setup.step.3':
    'W sekcji „Łódź” wybierz „Kajak”, „Kanadyjka”, SUP lub „Inne”. Od rodzaju łodzi zależy prędkość, którą proponuje TREK.',
  'help.guide.tour-paddle-setup.tip.4':
    'Wiersz „Wiosłowanie niesie ryzyko” na dole kolumny otwiera „Bezpieczeństwo na wodzie”. Przeczytaj to przed pierwszą wycieczką.',
  'help.guide.tour-paddle-water-route.step.5':
    'Żeby naraz zaplanować wszystkie odcinki narysowane ręcznie, kliknij „Zaplanuj po wodzie odcinki narysowane ręcznie”, czyli ikonę fal w nagłówku „Punkty trasy”.',
  'help.guide.tour-paddle-portage.step.1':
    'Najedź na przystanek, na którym wychodzisz z łodzi, i kliknij „Więcej działań”, czyli trzy kropki.',
  'help.guide.tour-paddle-portage.result':
    'Odcinek jest przenoską na mapie i w punktach trasy, a „Szacowany czas” liczy go jako przenoszenie.',
  'help.guide.tour-paddle-lock.tip.2':
    'Jeśli przenoska omija śluzę, śluza jest przygaszona i oznaczona „Obnoszona”. Liczy się wtedy czas przenoski, a minuty śluzy nie są wliczane.',
  'help.guide.tour-paddle-time.step.4':
    'Jeśli wycieczka ma przenoskę, wiersz „Przenoszenie” uwzględnia jej czas. Kliknij prędkość i wpisz, jak szybko niesiesz łódź. „Wyjście i ponowne wodowanie” dodaje minuty przy każdej przenosce.',
  'help.guide.tour-paddle-wind.step.1':
    'Przypisz wycieczkę wioślarską do dnia podróży. Karta „Wiatr” w lewej kolumnie pokaże wtedy prognozę na ten dzień w miejscu startu wycieczki.',
  'help.guide.tour-paddle-wind.result': 'Znasz godzinową prognozę wiatru na ten dzień w miejscu wodowania.',
  'help.guide.tour-paddle-checklist.tip.1':
    'Przy każdej przeszkodzie wybierz, co zrobisz: „Przepłynąć”, „Przenieść”, „Opłynąć” lub „Nie dotyczy”. „Dalej” przenosi do następnej nierozstrzygniętej pozycji.',
  'help.guide.tour-paddle-track-marks.step.1':
    'Na karcie „Wycieczki” kliknij „Dodaj trasę” w prawej kolumnie, wybierz „Importuj GPX lub KML” i wskaż plik.',
  'help.guide.tour-paddle-track-marks.tip.2':
    '„Odrzuć” usuwa niezapisane oznaczenia. Sam nagrany ślad nigdy nie jest rysowany od nowa.',
  'help.ctx.trip-tour-horse.bullet.4':
    'TREK nie wylicza czasu jazdy konnej. Jeśli chcesz go mieć w dniu, wpisz czas w polu „Zaplanowane” w „Szczegółach”.',
  'help.guide.tour-horse-plan.step.5':
    'Wybierz odcinek w sekcji „Odcinki”. Sprawdź, w jakim kierunku nim jedziesz („Kierunek”) i co pokazuje „Dostęp dla koni” na jego długości.',
  'help.guide.tour-horse-plan.tip.5':
    'Na przejażdżce nic nie jest wyznaczane przez router: kliknięcie narysowanej linii nie dodaje punktu kształtującego, a punkty na końcach odcinka zostają tam, gdzie ma je trasa.',
  'help.guide.tour-horse-gap.tip.1':
    'Odcinka ręcznego nie sprawdził ani router, ani żaden szlak konny. Zobacz na mapie, którędy naprawdę biegnie.',
  'help.guide.tour-horse-recorded.step.4':
    'Przejażdżka otwiera się w lewej kolumnie. Karta „Nagrana przejażdżka” pokazuje „Tak jak nagrano”, „Bez czasu jazdy” i „Dostęp niesprawdzony”. Najedź na plakietkę, żeby dowiedzieć się dlaczego.',
  'help.guide.dateless-trip.step.2':
    'Zostaw puste pola „Data rozpoczęcia” i „Data zakończenia”. Pod nimi pojawi się pole „Liczba dni”: wpisz, na ile dni chcesz planować.',
  'help.guide.trip-reminder.tip.1':
    'Sekcję „Przypomnienie” widzi tylko właściciel podróży (lub administrator). Jeśli jest wyszarzona, administrator musi najpierw włączyć przypomnienia o podróżach w „Administrator”, „Powiadomienia”.',
  'help.guide.upcoming-reservations.step.2': 'Kliknij rezerwację, żeby otworzyć podróż, do której należy.',
  'help.guide.timezones-widget.tip.1':
    'Lista używa oficjalnych nazw stref czasowych, np. Europe/Lisbon albo America/New_York, więc szukaj miasta, które występuje w nazwie.',
  'help.guide.half-company-holiday.step.2': 'Na tym samym pasku narzędzi włącz „Pół dnia”.',
  'help.guide.edit-holiday-calendar.tip.1': 'Każda zmiana zapisuje się od razu. Nie ma przycisku „Zapisz”.',
  'help.guide.person-color.tip.1': 'Tym samym kolorem osoba jest oznaczona na pasku narzędzi i na karcie „Wymiar”.',
  'help.guide.answer-fusion-request.step.2':
    'Przeczytaj, co oznacza połączenie: jeden wspólny kalendarz, wpisy, które możecie edytować za siebie nawzajem, i wspólne ustawienia urlopów.',
  'help.guide.log-for-partner.step.2':
    'Spójrz na pasek narzędzi: pierwszy przycisk pokazuje teraz imię i kolor tej osoby.',
  'help.guide.dissolve-fusion.step.2': 'Na dole, w sekcji „Rozłącz kalendarze”, kliknij „Rozłącz”.',
  'help.guide.country-places.step.3':
    'Okno pokazuje wszystkie miejsca wliczone do danego kraju, pogrupowane według podróży; jeśli jest ich więcej niż sześć, „Szukaj miejsc” u góry zawęża listę. Kliknij miejsce lub nagłówek podróży, żeby otworzyć tę podróż w planerze.',
  'help.guide.tour-activity-stats.step.5':
    'Kliknij „Pokaż wycieczki”. Otworzy się „Moje odbyte wycieczki” z sumami, podziałem „Według rodzaju” i wszystkimi wycieczkami z danego okresu, z dniem, podróżą, dystansem i przewyższeniem. Pigułkami w nagłówku możesz tu również zmienić okres i rodzaj.',
  'help.guide.move-to-list.step.3':
    'Wybierz listę docelową. Jeśli list jest więcej niż trzy, możesz je zawęzić polem wyszukiwania u góry.',
  'help.guide.accept-list-invite.goal': 'Dołącz do listy, którą ktoś ci udostępnił, albo odrzuć zaproszenie.',
  'help.guide.tour-collection-add-to-trip.step.4':
    'Jeśli chcesz, zmień „Nazwa w podróży”, a potem kliknij „Dodaj do podróży”.',
  'help.guide.tour-collection-manage.step.2':
    'Wpisz tekst w „Szukaj miejsc”. Wyszukiwanie zawęża według nazwy zarówno wycieczki, jak i miejsca.',
  'help.guide.create-journey.tip.3':
    'Gdy podróż właśnie się skończyła, przycisk „Utwórz dziennik podróży” w banerze „Podróż właśnie się zakończyła” u góry zakłada dziennik z tą podróżą już wybraną.',
  'help.guide.entry-draft.step.2': 'Kliknij „Zapisz”. Karta ma teraz plakietkę „Szkic”.',
  'help.guide.gallery-map.step.3':
    'Na „Osi czasu” mapa po prawej podąża za przewijaniem: widoczny wpis ma obwódkę w kolorze swojego dnia. Kliknij pinezkę, żeby przewinąć oś czasu do jej wpisu.',
  'help.guide.journey-map-layers.tip.1':
    'Przerywana kolorowa linia to trasa GPX podróży, czyli część planu; ciągła linia to trasa nagrana w danym dniu.',
  'help.guide.journey-keep-route.tip.1':
    'Tam, gdzie kończy się nagranie, kończy się też linia. TREK rysuje tylko to, co zostało nagrane.',
  'help.guide.journey-day-stays.tip.1':
    'Ten wiersz widzą tylko osoby, które mogą edytować dziennik i mają podłączone własne Dawarich, i tylko w dniach, w których zostało coś do rozstrzygnięcia.',
  'help.guide.journey-take-over-day.step.4':
    'Zostaw włączone „Zapisz też trasę dnia”, żeby zachować również trasę, a potem kliknij przycisk „Przejmij”. Przycisk pokazuje, ile szkiców utworzy.',
  'help.guide.journey-auto-prepare.step.3':
    'Wiersz poniżej informuje, kiedy ostatnio pobrano twoje pobyty, albo dlaczego się to nie udało. Kliknij „Pobierz teraz”, żeby od razu odpytać Dawarich.',
  'help.guide.photo-location.tip.1': 'Miejsca ustawione przez ciebie nigdy nie są przesuwane.',
  'help.ctx.settings-plugins.bullet.1':
    '„Ustawienia wtyczek”: poniżej osobna karta dla każdej wtyczki, która potrzebuje od ciebie danych, z jej polami i przyciskiem „Zapisz”. Po zapisaniu pole z sekretem nie jest już nigdy pokazywane.',
  'help.guide.dashboard-widgets.step.3':
    '„Przywróć domyślne” pod kartami przywraca całą kartę „Wygląd” do ustawień początkowych.',
  'help.guide.web-push-device.result':
    'Karta pokazuje „Włączone na tym urządzeniu”, a zdarzenia włączone w kolumnie „Push” docierają do ciebie nawet wtedy, gdy TREK jest zamknięty.',
  'help.guide.connect-airtrail.step.1':
    'W „Integracjach” znajdź AirTrail i wpisz „Adres URL instancji” oraz klucz API. Klucz utworzysz w AirTrail w „Settings”, „Security”.',
  'help.guide.connect-dawarich.step.1':
    'W „Integracjach” znajdź Dawarich i wpisz „Adres instancji” oraz klucz API z Dawarich (w „Account”, „API key”).',
  'help.guide.tour-connect-wanderer.step.1':
    'W „Integracjach” znajdź wanderer i wpisz „Adres URL instancji” oraz token API. Token utworzysz w wanderer w „Settings”, „Account”, „API tokens”; zaczyna się od wanderer_key_.',
  'help.guide.tour-wanderer-watch.goal': 'Niech TREK w tle sprawdza, czy zaimportowane szlaki się zmieniły.',
  'help.guide.mcp-oauth.tip.3':
    'Tokeny API nadal działają, ale są oznaczone jako „Przestarzałe”; przejdź na klienta OAuth.',
  'help.guide.offline-conflicts.tip.2': 'Ten wybór dotyczy tylko tego urządzenia.',
  'help.guide.default-user-settings.tip.1':
    'Własny wybór użytkownika w „Ustawieniach” zawsze ma pierwszeństwo; te wartości obowiązują wszystkich, którzy danego ustawienia nie zmienili.',
  'help.guide.own-routing-engine.step.1':
    'W sekcji „Mapa” na karcie „Domyślne ustawienia” wpisz adres swojego serwera OSRM w polu „Własny silnik tras”.',
  'help.guide.admin-passkeys.tip.2':
    'Jeśli później zmienisz domenę, wszystkie dodane już przez użytkowników klucze dostępu przestaną działać.',
  'help.guide.instance-keys.tip.4': 'Klucz Amap musi być kluczem typu Web 服务 (usługa webowa), a nie kluczem JS API.',
  'help.guide.rotate-jwt-secret.step.2': 'Przeczytaj ostrzeżenie i kliknij „Zmień i wyloguj”.',
  'help.guide.notification-defaults.tip.2':
    'Wartość domyślna dotyczy tylko osób, które same nie zmieniły danej komórki.',
  'help.ctx.notifications.bullet.5':
    'W „Ustawieniach”, w sekcji „Powiadomienia”, wybierasz, które zdarzenia dostajesz tutaj, a które e-mailem, webhookiem, przez ntfy lub push.',
  'help.guide.read-notifications.result':
    'Jesteś na ekranie, którego dotyczyło powiadomienie, a liczba przy dzwonku zmniejsza się o jeden.',
  'help.guide.mark-notifications-read.title': 'Oznaczanie powiadomień jako przeczytanych',
  'help.guide.delete-notifications.goal': 'Usuwaj niepotrzebne już powiadomienia, żeby lista była krótka.',
  'help.guide.notification-settings.step.1': 'Kliknij swoje imię w prawym górnym rogu.',
  'help.guide.public-link.step.5': 'Dopóki link istnieje, możesz zmieniać ustawienia. „Usuń link” wyłącza link.',
  'help.guide.link-journal.step.3':
    'Dla każdej osoby z podróży wybierz „Brak dostępu”, „Odczyt” lub „Edytuj”. „Wszyscy czytają” i „Nikt” ustawiają wszystkich naraz.',
  'help.guide.collapse-columns.tip.3': 'Gdy separator jest aktywny, możesz go też przesuwać klawiszami strzałek.',
  'help.guide.edit-place.tip.3':
    'Jeśli klikniesz poza oknem, zmiany nie przepadną: TREK najpierw zapyta „Odrzucić zmiany?”, a „Kontynuuj edycję” przeniesie cię z powrotem do formularza.',
  'help.guide.dawarich-stays.goal':
    'Dodaj miejsca, w których według Dawarich zatrzymałeś się podczas podróży, po sprawdzeniu każdego z nich.',
  'help.guide.leave-stop-off-route.step.1':
    'Kliknij przystanek prawym przyciskiem myszy albo kliknij jego trzy kropki i wybierz „Pomiń w trasie”.',
  'help.guide.move-booking-day.step.3':
    'Wiersz jest teraz w nowym dniu, o swojej godzinie. Jeśli chcesz też zmienić godzinę, otwórz rezerwację.',
  'help.guide.place-image-from-file.goal':
    'Ustaw jako obraz miejsca zdjęcie, które już jest w jego plikach, bez ponownego przesyłania.',
  'help.guide.place-image-from-file.tip.3': 'Obraz mogą zmieniać tylko uczestnicy, którzy mają prawo do zmiany miejsc.',
  'help.guide.place-own-hours.result':
    'Karta pokazuje twój numer telefonu, e-mail i godziny otwarcia, a obwódka zdjęcia jest zielona lub czerwona zgodnie z twoimi godzinami.',
  'help.guide.confirm-stay-booking.step.4':
    'Zamknij rezerwację przyciskiem X w prawym górnym rogu. W sekcji „Rezerwacja” karta noclegu pokazuje teraz „Potwierdzono”.',
  'help.guide.tour-map-lines.title': 'Wycieczki na mapie',
  'help.guide.tour-map-lines.tip.2':
    'Ukrycie wycieczki dotyczy tylko ciebie i jest zapamiętywane w tej przeglądarce dla tej podróży: wycieczka, jej dni i kolor pozostają bez zmian dla wszystkich. „Pokaż wszystkie” nad listą „Wycieczki” znów pokazuje wszystkie ukryte wycieczki, a mapa na telefonie zawsze pokazuje wszystkie wycieczki.',
  'help.guide.car-stops.step.4':
    'W sekcji „Przystanki po drodze” kliknij „Dodaj przystanek” dla każdego miejsca, przez które prowadzi trasa, i wybierz je, jeśli chcesz, z godziną obok. Przystanek bez wybranego miejsca zostanie usunięty przy zapisie.',
  'help.guide.transport-details.step.2':
    'Pigułki w nagłówku pokazują status, typ, dzień i „Kod rezerwacji”. Kliknij pigułkę statusu, żeby przełączyć między „Oczekujące” a „Potwierdzono”. Mała ikona kopiowania w pigułce kodu, „Kopiuj kod rezerwacji”, kopiuje kod do schowka.',
  'help.guide.group-sort-bookings.step.3':
    'W sekcji „Sortuj według” wybierz „Data”, „Nazwa”, „Typ” lub „Status”. Wiersz pod spodem odwraca kolejność: „Od najwcześniejszych” lub „Od najpóźniejszych” dla dat, „Od A do Z” lub „Od Z do A” dla pozostałych.',
  'help.guide.booking-on-map.title': 'Rezerwacja na mapie',
  'help.guide.export-bookings-csv.tip.1':
    'Kolumny to Type, Title, Status, Start, End, From, To, Location, Confirmation i Notes.',
  'help.guide.arrange-packing-list.tip.1':
    'Gdy włączone jest „Od A do Z”, nie możesz przeciągać przedmiotów, ale całe listy nadal tak.',
  'help.guide.count-packed-pieces.step.3':
    'Dopóki spakowana jest tylko część sztuk, licznik ma twój kolor akcentu, a pole wyboru obwódkę w tym kolorze. Kliknij minus, żeby odjąć sztukę z licznika.',
  'help.guide.expense-receipts.step.5':
    'Podgląd pokazuje paragon, a u góry przyciski „Otwórz w nowej karcie” i „Pobierz”. Przy kilku paragonach przełączasz się między nimi klawiszami strzałek, a Esc zamyka podgląd.',
  'help.guide.files-sync-settings.step.3': 'Kliknij „Ustawienia” pod paskiem przepływu, żeby zobaczyć pozostałe opcje.',
  'help.guide.manage-notes.step.3':
    '„Przypnij” w tym samym menu utrzymuje notatkę na górze panelu, w ramce w kolorze jej kategorii i z pinezką obok tytułu. „Odepnij” w tym samym menu przywraca notatkę na zwykłe miejsce.',
  'help.guide.note-categories.step.1':
    'Kliknij koło zębate obok „Nowa notatka” w nagłówku karty „Notatki”. Otworzy się „Zarządzaj kategoriami” z wierszem dla każdej kategorii: kolor, nazwa, sześć kolorowych kropek i kosz.',
  'help.guide.note-categories.tip.2':
    'Kategoria bez notatek jest przechowywana tylko w twojej przeglądarce. Pozostali uczestnicy zobaczą ją, gdy zostanie do niej przypisana jakaś notatka.',
  'help.guide.roadtrip-reorder.goal':
    'Zmień kolejność trasy lub przenieś przystanek na inny dzień bezpośrednio na osi.',
  'help.guide.roadtrip-overnight.step.4':
    '„Znajdź nocleg” obok pokazuje nazwę do skopiowania i linki do serwisów rezerwacyjnych: trivago lub CHECK24 dla hotelu, PiNCAMP lub Pitchup dla kempingu. Sprawdź na stronie miejsce, daty i liczbę gości.',
  'help.guide.roadtrip-stop-fill.step.2':
    'W sekcji „Tankuje do” wybierz wartość od 50 do 100. Wiersz pod przyciskami pokazuje, jak daleko stąd dojedziesz z takim poziomem.',
  'help.guide.roadtrip-bookings.step.2':
    'Na osi przejazd to karta w kolorze swojego typu, z rozkładem w kolumnie przyjazdu i punktem początkowym oraz końcowym pod tytułem.',
  'help.guide.roadtrip-google-import.tip.1':
    'TREK wyznacza własną trasę między przystankami; nie kopiuje drogi z Google.',
  'help.guide.roadtrip-hazards.result':
    'Mapa pokazuje bieżące ostrzeżenia w okolicy twojej podróży, a trasa się nie zmienia.',
  'help.ctx.trip-tours.bullet.3':
    'Wiersz: kolorowy pasek to linia wycieczki na mapie, okrągły kafelek pokazuje limit trudności (T1 do T6) lub typ, mała plakietka GPX lub wanderer oznacza import, a plakietki podają dni, czas, dystans i podejście. Księżyc z liczbą pokazuje liczbę etapów wycieczki wielodniowej.',
  'help.guide.tour-show-list.step.3': 'Kliknij wiersz. Karta wycieczki otworzy się nad mapą.',
  'help.guide.tour-add-to-day.goal':
    'Zaplanuj, kiedy idziesz na wycieczkę, żeby była widoczna w dniu, a jej linia na mapie.',
  'help.guide.tour-add-to-day.tip.3':
    'Wycieczkę możesz dodać do danego dnia tylko raz. Jeśli upuścisz ją na dzień, w którym już jest, TREK pokaże tylko komunikat „Ta wycieczka jest już przypisana do tego dnia.”.',
  'help.guide.tour-day-times.step.4':
    'Jeśli wycieczka kończy się po rozpoczęciu następnego punktu dnia, informuje o tym uwaga pod wierszem, np. „Kończy się o 13:30, a Obiad w Gostner Schwaige zaczyna się o 12:30”. Nic nie jest przesuwane.',
  'help.guide.tour-remove-from-day.step.1':
    'W kolumnie dni najedź na wiersz wycieczki, kliknij „Więcej opcji” i wybierz „Usuń z dnia”.',
  'help.guide.tour-filter-list.step.1':
    'Kliknij przycisk filtra pod „Importuj GPX lub KML”. Pokazuje on bieżący filtr statusu, na początku „Wszystkie”, a obok liczbę wycieczek.',
  'help.guide.tour-hide-on-map.title': 'Ukrywanie linii wycieczki na mapie',
  'help.guide.tour-import-plan-tab.title': 'Import śladu z karty „Plan”',
  'help.ctx.trip-tour-detail.title': 'Szczegóły wycieczki',
  'help.guide.tour-detail-read.goal':
    'Zobacz wszystkie informacje o wycieczce zapisane w podróży: dni, dystans i wysokości, profil oraz źródło.',
  'help.guide.tour-detail-read.tip.1':
    'Bursztynowa pigułka „używaj ostrożnie” oznacza, że import ma niepełne dane o wysokościach lub pomiarach. Weź to pod uwagę, patrząc na podejście i profil.',
  'help.guide.tour-rename-colour.step.1':
    'Otwórz kartę wycieczki i kliknij ołówek obok nazwy. Nazwa zmieni się w pole edycji.',
  'help.guide.tour-take-along.goal':
    'Wyznacz dojazd na start wycieczki, otwórz jej stronę w internecie albo pobierz trasę jako plik GPX.',
  'help.guide.tour-take-along.result': 'Masz dojazd na start w aplikacji z mapami i całą trasę w pliku GPX.',
  'help.guide.tour-copy-keep.tip.2':
    '„Zapisz w kolekcji” w menu wycieczki w planie dnia otwiera to samo okno, więc trasa też zostanie tam zapisana.',
  'help.guide.tour-packing-link.step.3': 'Kliknij „Podłącz”.',
  'help.guide.tour-files.goal':
    'Dodaj do wycieczki rezerwację, mapę lub opis trasy i otwieraj je potem z karty wycieczki.',
  'help.guide.tour-activity-link.goal': 'Powiąż nagrany ślad GPX z zaplanowaną wycieczką bez zmieniania planu.',
  'help.guide.tour-activity-link.tip.3':
    '„Czas przejścia” liczy się od pierwszego do ostatniego znacznika czasu w śladzie, łącznie z przerwami.',
  'help.guide.tour-activity-compare.tip.1':
    '„Porównaj na mapie” jest dostępne tylko wtedy, gdy karta jest wyświetlana obok mapy, a nie na telefonie.',
  'help.guide.tour-origin-check.tip.1':
    'Wycieczka przejęta z innej podróży pokazuje w polu „Przejęto z” tamtą podróż i wycieczkę.',
  'help.ctx.trip-tour-planner.bullet.3':
    '„Wycieczki w tej podróży”, czyli prawy panel, wymienia wszystkie wycieczki, a nad listą są filtr i „Podsumowanie podróży”. Gdy wycieczka jest otwarta, „Podsumowanie wycieczki” u góry pokazuje jej dystans, podejście, czas i profil wysokości. Plus u góry, „Dodaj trasę”, pozwala zaplanować, zaimportować lub przejąć wycieczkę.',
  'help.guide.tour-open-workspace.step.3':
    'Prawy panel, „Wycieczki w tej podróży”, wymienia wszystkie wycieczki podróży, a nad listą są filtr i „Podsumowanie podróży”.',
  'help.guide.tour-open-workspace.result':
    'Karta „Wycieczki”: edytor po lewej, wycieczki podróży po prawej, a pośrodku mapa.',
  'help.guide.tour-draw-route.step.6':
    'W sekcji „Punkty trasy” każdy punkt dostaje wiersz z numerem, a po wczytaniu nazwy także nazwę miejsca. Gdy TREK pracuje, mała kropka obok „Nowa wycieczka” pokazuje jego stan.',
  'help.guide.tour-type-profile.step.1':
    'Kliknij „Rodzaj wycieczki” pod „Nazwa wycieczki”. Widać tam obecny rodzaj z krótkim opisem, jak jest planowany.',
  'help.guide.tour-edit-points.goal': 'Zmień przebieg wycieczki, przesuwając jej punkty na mapie lub na liście.',
  'help.guide.tour-edit-points.tip.2':
    'Dopóki nazwa miejsca się nie wczyta, wiersz pokazuje współrzędne. „Cofnij” i „Ponów” nie mają skrótów klawiszowych.',
  'help.guide.tour-shaping-points.tip.1': 'Początek i koniec są zawsze przystankami.',
  'help.guide.tour-loop-reverse.step.3':
    'Kliknij obok „Odwróć kierunek”, żeby przejść całą wycieczkę w przeciwną stronę.',
  'help.guide.tour-leg-by-hand.step.2':
    'Odcinek zmienia się w przerywaną linię prostą, a pod wierszem lista pokazuje „Narysowane ręcznie, nie wyznaczone” z jego długością.',
  'help.guide.tour-trip-places.step.1':
    'W sekcji „Punkty trasy” kliknij „Miejsca podróży” obok „Dodaj punkt”. Pod spodem pojawią się miejsca podróży.',
  'help.guide.tour-details-times.title': 'Nazwa wycieczki i planowanie czasu',
  'help.guide.tour-details-times.tip.3':
    'Kliknij strzałkę obok „Szczegóły”, żeby zwinąć sekcję. Otworzy się ona automatycznie, jeśli któreś pole ma wartość, której „Zapisz” nie przyjmuje.',
  'help.guide.tour-save.tip.1':
    '„Odrzuć” obok „Zapisz” po potwierdzeniu odrzuca niezapisane zmiany. Zapisana wycieczka pozostaje bez zmian.',
  'help.guide.tour-edit-saved.step.3':
    'Kliknij „Zapisz”. Pojawi się komunikat „Wycieczka zapisana”, a wycieczka zachowa swoje dni, pliki i notatki.',
  'help.guide.tour-summary-profile.step.1':
    '„Podsumowanie wycieczki” u góry „Wycieczek w tej podróży” podaje „Dystans”, „Suma podejść” i „Suma zejść” wycieczki otwartej w edytorze, jej szacowany czas, przerwy i łączny planowany czas.',
  'help.guide.tour-list-manage.title': 'Zarządzanie wycieczkami w podróży',
  'help.guide.tour-list-manage.tip.2':
    'Dzień, który już ma tę wycieczkę, jest wyszarzony w menu dni. Przy wycieczce wielodniowej TREK zapyta, czy etapy mają zaczynać się od tego dnia, czy cała wycieczka ma trafić na ten dzień.',
  'help.guide.tour-delete.tip.2': 'Jeśli chcesz ją tylko usunąć z dnia, użyj zamiast tego „Usuń z dnia” w menu dnia.',
  'help.guide.tour-saved-elsewhere.step.4':
    'Wybierz „Zapisz jako nową trasę”, żeby zachować obie wersje, „Wczytaj nowszą”, żeby wczytać drugą wersję, albo „Nadpisz”, żeby zastąpić drugą wersję swoją.',
  'help.ctx.trip-tour-import.bullet.3':
    'Import otwiera się jako „Wycieczka GPX” lub „Wycieczka z wanderer”: linia, „Podsumowanie wycieczki” i profil wysokości dokładnie w takiej postaci, w jakiej zostały zaimportowane. Jej wiersz na liście ma plakietkę „Import GPX”.',
  'help.guide.tour-import-gpx.step.4':
    'W sekcji „Importuj jako” określ, czym są ślady. Domyślnie ustawiona jest „Wędrówka piesza”. „Wycieczka rowerowa” lub „Bieg” wymaga wybrania profilu, „Spływ” łodzi i rodzaju wody, a „Narty i zima” dyscypliny.',
  'help.guide.tour-view-import.title': 'Podgląd zaimportowanego śladu',
  'help.guide.tour-view-import.result':
    'Widzisz nagrany ślad dokładnie w takiej postaci, w jakiej go zaimportowano, bez żadnych przeliczeń.',
  'help.guide.tour-plan-from-import.tip.2':
    'Jeśli karta informuje, że propozycja na dłuższych odcinkach odbiega od śladu, sprawdź te fragmenty na mapie, zanim zaczniesz według niej planować.',
  'help.guide.tour-restore-recorded.step.3':
    'Potwierdź przyciskiem „Przywróć zarejestrowany ślad”. Punkty trasy i wyznaczona linia zostaną usunięte, a dni i notatki zostaną.',
  'help.guide.tour-take-over.step.3':
    'Znajdź wycieczkę: wpisz nazwę w „Szukaj po nazwie” albo zawęź listę filtrami „Podróż” i „Typ”.',
  'help.guide.tour-import-wanderer.title': 'Import szlaku z wanderer',
  'help.guide.tour-import-wanderer.tip.3':
    'Szlak, który już jest w podróży, ma oznaczenie „W tej podróży” i przycisk „Otwórz wycieczkę”. Szlak, który zmienił się od czasu importu, oferuje „Importuj jako nową wersję” obok starej.',
  'help.ctx.trip-tour-map.bullet.4':
    '„Wzdłuż trasy”, karta w lewym panelu, wyszukuje punkty widokowe, wodę, schroniska, jedzenie i inne miejsca w pobliżu trasy i pokazuje wyniki na liście. Miejsce z listy możesz dodać do wycieczki jako przystanek.',
  'help.guide.tour-map-layers.tip.1':
    'Wybrana mapa zostaje dla każdej otwieranej wycieczki, dopóki nie odświeżysz strony. Wycieczka, której rodzaj nie obsługuje tej mapy, otwiera się na mapie „Mapa”, a mapa na karcie „Plan” i ustawienie w „Ustawieniach” się nie zmieniają.',
  'help.guide.tour-along-search.step.4':
    'Kliknij „Szukaj wzdłuż trasy”. TREK tylko wyszukuje: wycieczka się nie zmienia.',
  'help.guide.tour-along-add-stop.step.1':
    'Kliknij miejsce na liście „Wzdłuż trasy” albo jego pinezkę na mapie. Nad mapą otworzy się jego karta: co to jest, jak daleko jest od trasy i w którym miejscu wycieczki się znajduje.',
  'help.guide.tour-3d-terrain.title': 'Wycieczka w 3D',
  'help.guide.tour-3d-terrain.tip.1': '„Przegląd” w tym samym wierszu znów pokazuje całą trasę po przesunięciu widoku.',
  'help.guide.tour-3d-flyover.step.4': 'Kliknij „Przegląd”, żeby znów zobaczyć całą wycieczkę.',
  'help.guide.tour-map-overlays.step.2': 'Kliknij „Legenda tras”, mały kwadrat z kolorowych kropek obok przełącznika.',
  'help.ctx.trip-tour-stages.summary':
    'Wycieczka wielodniowa to jedna trasa podzielona na etapy, po jednym na każdy dzień w drodze. Tutaj ustalasz, gdzie kończy się każdy dzień, sprawdzasz parametry każdego etapu i przypisujesz etapy do dni podróży.',
  'help.guide.tour-multi-day.step.1': 'W „Wycieczkach w tej podróży” kliknij wycieczkę, żeby otworzyć ją w edytorze.',
  'help.guide.tour-multi-day.tip.3':
    'Czas etapu nie obejmuje przerw. Czas w kolorze ostrzegawczym, „Ponad dzień w ruchu”, jest dłuższy niż jeden dzień.',
  'help.guide.tour-stages-on-days.step.4':
    'Kliknij przycisk z księżycem i liczbą etapów, „Pokaż etapy”, żeby je wyświetlić.',
  'help.ctx.trip-tour-hike.title': 'Wędrówki i biegi',
  'help.guide.tour-hike-plan.title': 'Planowanie wędrówki w wybranym stopniu trudności',
  'help.guide.tour-hike-plan.result':
    'Wędrówka jest na liście „Wycieczki w tej podróży” z dystansem, podejściem i czasem marszu, gotowa do przypisania do dnia.',
  'help.guide.tour-hike-trail-details.step.2':
    'Wybierz, co pokazać: SAC dla skali trudności szlaku, „Nawierzchnia” lub „Rodzaj drogi”. Trasa na mapie ma te same kolory co lista.',
  'help.guide.tour-hike-round.title': 'Pętla wędrówkowa o zadanej długości',
  'help.guide.tour-hike-round.tip.1':
    'Pętle nie przekraczają „Maksymalnej trudności szlaku” wędrówki; pigułka T na karcie pokazuje, jaka to trudność.',
  'help.guide.tour-hike-compare-ways.step.4':
    'Kliknij „Wybierz tę drogę”. TREK sprawdza za pomocą routera, czy trasa rzeczywiście nią prowadzi.',
  'help.guide.tour-ferrata-add.step.2':
    'Kliknij ferratę na mapie, jej przerywaną linię lub znak. Jej karta pokazuje nazwę, stopień trudności i długość.',
  'help.guide.tour-ferrata-add.tip.4':
    '„Pokaż w OpenStreetMap” na karcie otwiera dane samej ferraty. Gdy nie da się nic wczytać, plakietka robi się bursztynowa, a przyczynę pokazuje podpowiedź.',
  'help.guide.tour-run-plan.result':
    'Bieg jest na liście „Wycieczki w tej podróży” z polem „Czas biegu (planowany)”, a jego profil i tempo są zapisane razem z nim.',
  'help.guide.tour-run-ways.step.2':
    'U góry karty widać teraz, jaka część biegu prowadzi po nawierzchni nieutwardzonej, i najtrudniejszą sklasyfikowaną ścieżkę na trasie.',
  'help.ctx.trip-tour-walk.bullet.2':
    '„Punkty trasy” wymieniają przystanki po kolei. Obwódka wokół numeru przystanku oznacza „Koniecznie” (ciągła) lub „Opcjonalne” (przerywana), mała tarcza oznacza „Chroniony”, a pigułka pod nazwą pokazuje czas pobytu.',
  'help.guide.tour-walk-plan.step.3':
    'Najedź na przystanek w „Punktach trasy”, kliknij „Więcej działań” obok niego i wybierz „Edytuj przystanek”.',
  'help.guide.tour-walk-sights.title': 'Dodawanie atrakcji wzdłuż spaceru po mieście',
  'help.guide.tour-walk-sights.tip.2':
    'Po zmianie trasy przycisk pokazuje „Szukaj ponownie”, bo znalezione miejsca dotyczą poprzedniej trasy.',
  'help.guide.tour-walk-day-times.step.4':
    'Pod każdym przystankiem widać, o której docierasz i jak długo zostajesz. Ostrzeżenie pojawia się tam, gdzie miejsce jest o tej porze zamknięte albo zamyka się w trakcie pobytu.',
  'help.guide.tour-walk-google-import.step.1':
    'W „Wycieczkach w tej podróży” kliknij „Dodaj trasę” (+ u góry) i wybierz „Importuj spacer z Google Maps”.',
  'help.guide.tour-walk-check-off.title': 'Odhaczanie przystanków spaceru w danym dniu',
  'help.guide.tour-walk-check-off.tip.3':
    'Jeśli przypiszesz spacer do dnia offline, odhaczać przystanki możesz po synchronizacji.',
  'help.guide.tour-bike-profile.title': 'Wycieczka rowerowa dopasowana do stylu jazdy',
  'help.guide.tour-bike-profile.result':
    'Wycieczka rowerowa jest zapisana i widoczna na liście „Wycieczki w tej podróży”, wyznaczona według swojego profilu, a czas jazdy widać w „Podsumowaniu wycieczki”.',
  'help.guide.tour-bike-surfaces.step.1':
    'W „Wycieczkach w tej podróży” po prawej kliknij wycieczkę rowerową, żeby ją otworzyć. Gdy trasa zostanie wyznaczona, pod „Punktami trasy” pojawi się karta „Nawierzchnia i drogi”.',
  'help.guide.tour-bike-surfaces.tip.4':
    'Kliknij tytuł karty, żeby ją zwinąć. W tej przeglądarce pozostanie zwinięta także po odświeżeniu strony.',
  'help.guide.tour-bike-mtb-grades.tip.2':
    'Tam, gdzie mapujący ocenili podjazdy, poniżej pojawia się „Trudność podjazdu (mtb:scale:uphill)” z osobnymi wierszami.',
  'help.ctx.trip-tour-ski.bullet.4':
    'Karta „Trasa narciarska” pod punktami trasy dzieli dzień na „Jazda”, „Na wyciągach”, „Oczekiwanie” i „Pieszo”, z długością tras, wysokością zjazdu po nich i przejazdami wyciągami. „Czas na nartach” w „Podsumowaniu wycieczki” po prawej sumuje to wszystko, gdy każdy odcinek jest zaplanowany.',
  'help.guide.tour-ski-plan.step.5':
    'Pod każdym punktem jego odcinek jest rozpisany na znaczniki: każda trasa, wyciąg i odcinek pieszy z nazwą lub rodzajem, trasy z kropką w kolorze stopnia trudności, a przy każdym liczba minut.',
  'help.guide.tour-ski-options.goal':
    'Ustaw najtrudniejsze dopuszczalne trasy, preferencje, tempo i wyciągi, z których korzystasz, żeby odcinki były dopasowane do ciebie.',
  'help.guide.tour-ski-options.tip.3':
    '„Unikaj domniemanych połączeń” nie prowadzi trasy po połączeniach, które dane mapy tylko zakładają, np. przez niezmapowany odcinek między dwiema trasami.',
  'help.guide.tour-ski-fix-leg.tip.2':
    'Dopóki dane tras dla danego obszaru są pobierane, planer czeka i automatycznie próbuje ponownie.',
  'help.guide.tour-ski-summary.step.3':
    'W „Podsumowaniu wycieczki” po prawej „Czas na nartach” sumuje to wszystko. Kropka informacyjna obok wyjaśnia, jak jest wyliczany.',
  'help.guide.tour-ski-pistes-layer.step.1':
    'Gdy otwarta jest wycieczka typu „Narty i zima”, mapa automatycznie pokazuje trasy. Przełącznik z ośnieżoną górą w rzędzie w lewym dolnym rogu mapy je wyłącza i włącza; jego podpowiedź to „Trasy zjazdowe, biegowe i wyciągi”.',
  'help.guide.tour-ski-import.goal':
    'Zaimportuj nagrany ślad narciarski, biegowy lub z wędrówki w rakietach śnieżnych i przypisz mu właściwą dyscyplinę.',
  'help.guide.tour-ski-import.tip.2':
    'Żeby edytować go jak zaplanowaną wycieczkę, użyj „Zaplanuj wersję do edycji” na karcie „Wersja do edycji”. Jego punkty są połączone liniami prostymi.',
  'help.ctx.trip-tour-paddle.bullet.4':
    '„Szacowany czas” sumuje czas na wodzie, przenoszenie łodzi, wychodzenie i wodowanie, śluzy i przerwy, na podstawie prędkości i minut, które możesz zmienić.',
  'help.guide.tour-paddle-setup.step.4':
    'W sekcji „Woda” wybierz „Rzeka” lub „Jezioro”. Wycieczki nie da się zapisać, dopóki nie wybierzesz zarówno łodzi, jak i rodzaju wody.',
  'help.guide.tour-paddle-setup.result':
    'Nowa wycieczka wioślarska z wybraną łodzią, wodą i prędkością, gotowa na pierwszy punkt na mapie.',
  'help.guide.tour-paddle-water-route.tip.1':
    'Jeśli brakuje danych o wodach, TREK, zależnie od konfiguracji instancji, pobiera je dla regionu automatycznie albo prosi o nie administratora. Odcinek pokazuje wtedy „Wczytywanie danych o wodzie” i jest planowany automatycznie, gdy dane będą dostępne, zwykle w ciągu jednej do trzech minut.',
  'help.guide.tour-paddle-portage.step.2':
    'Wybierz „Przenieś łódź od tego miejsca”. Odcinek do następnego punktu staje się przenoską, rysowaną po lądzie.',
  'help.guide.tour-paddle-lock.title': 'Dodawanie śluzy i czasu oczekiwania',
  'help.guide.tour-paddle-lock.tip.3': '„Usuń śluzę” znajdziesz na dole otwartej karty i w „Więcej działań”.',
  'help.guide.tour-paddle-time.step.5':
    'Dopóki każda śluza nie ma swoich czasów, szacunek pokazuje „Niepełne”, a uwaga pod wierszami wymienia, czego brakuje.',
  'help.guide.tour-paddle-wind.step.2':
    'Sprawdź kierunek wiatru, „Średni” i „Porywy”. „Średni” to najwyższa średnia godzinowa w ciągu dnia, a „Porywy” to najsilniejszy poryw.',
  'help.guide.tour-paddle-checklist.title': 'Lista kontrolna przeszkód',
  'help.guide.tour-paddle-checklist.tip.2':
    '„Przenieść” nie planuje przenoski automatycznie. Kliknij „Zaplanuj przenoskę”, żeby wyznaczyć ją na mapie.',
  'help.guide.tour-paddle-track-marks.step.2':
    'W „Podglądzie importu” ustaw „Importuj jako” na „Spływ”, a potem wybierz „Łódź” i „Woda”. Import nie przejdzie dalej, dopóki nie wybierzesz obu.',
  'help.guide.tour-paddle-track-marks.tip.3':
    'Przy nagranym śladzie wiersz „Woda” w „Szacowanym czasie” ma własną prędkość: kliknij ją i wpisz, jak szybko płynąłeś.',
  'help.ctx.trip-tour-horse.bullet.5':
    'Przejażdżka zaimportowana z pliku GPX pozostaje dokładnie taka, jak ją nagrano, a karta „Nagrana przejażdżka” informuje, czego import nie mógł wyliczyć.',
  'help.guide.tour-horse-plan.step.6':
    'Kliknij „Przejmij odcinek”. Odcinek zostaje dodany do przejażdżki jako plakietka z nazwą trasy na karcie „Punkty trasy”. W ten sam sposób dodaj kolejne odcinki.',
  'help.guide.tour-horse-gap.title': 'Łączenie luki między trasami konnymi',
  'help.guide.tour-horse-gap.tip.2':
    'Punkty kliknięte na mapie są dodawane do przejażdżki tak samo, jako proste, niesprawdzone odcinki.',
  'help.guide.tour-horse-recorded.result':
    'Przejażdżka jest w podróży dokładnie taka, jak ją przejechałeś, z dystansem i wysokościami z pliku.',
  'help.guide.dateless-trip.step.3': 'Kliknij „Utwórz nową podróż”.',
  'help.guide.trip-reminder.tip.2':
    'Nowa podróż ma domyślnie przypomnienie 3 dni przed wyjazdem. Kanały, którymi ma przyjść, wybierasz w „Ustawieniach”, w sekcji „Powiadomienia”.',
  'help.guide.upcoming-reservations.result':
    'Podróż się otwiera. Po powrocie do panelu widżet nadal pokazuje, co czeka cię w najbliższym czasie.',
  'help.guide.entitlement.tip.2':
    'W połączonym planie każdy ma własny wiersz i możesz ustawiać wymiar urlopu także innym osobom.',
  'help.guide.half-company-holiday.step.3': 'Kliknij dzień. Połowa komórki zmienia kolor na bursztynowy.',
  'help.guide.school-holidays.tip.2':
    'Najedź na dzień w trakcie ferii, żeby zobaczyć ich nazwę w sekcji „Ferie szkolne”.',
  'help.guide.answer-fusion-request.step.3':
    'Kliknij „Akceptuj i połącz”, żeby scalić plany, albo „Odrzuć”, żeby zostawić swój plan osobno.',
  'help.guide.log-for-partner.step.3':
    'Kliknij dni, które chcesz zapisać, a potem ponownie kliknij swoje imię w „Osobach”.',
  'help.guide.dissolve-fusion.result':
    'Każdy wraca do własnego planu z własnymi wpisami, a w „Osobach” jesteś już tylko ty.',
  'help.guide.country-places.result': 'Planer otwiera się na podróży, do której należy miejsce.',
  'help.guide.tour-activity-stats.step.6':
    'Jeśli wycieczka się nie odbyła, kliknij „Pomiń”, okrągły przycisk na końcu jej wiersza. Wycieczka zostaje na liście, przygaszona i oznaczona jako „Pominięty”. Ten sam przycisk, teraz „Licz ponownie”, znów ją wlicza.',
  'help.guide.move-to-list.tip.1':
    'Etykiety należą do jednej listy, więc przeniesione lub zduplikowane miejsce nie ma etykiet na nowej liście.',
  'help.guide.accept-list-invite.step.1':
    'Zaproszenie znajdziesz w sekcji „Zaproszenia” na pasku list. Jeśli przyszedłeś z powiadomienia o zaproszeniu, karta jest na górze strony. Widać na niej nazwę listy i nadawcę.',
  'help.guide.tour-collection-add-to-trip.tip.1':
    'Nowa wycieczka nie jest jeszcze przypisana do żadnego dnia i nie dodaje miejsc. Ani lista, ani oryginalna wycieczka się nie zmieniają.',
  'help.guide.tour-collection-manage.step.3':
    'Kliknij kosz na końcu wiersza wycieczki i potwierdź przyciskiem „Usuń z kolekcji”.',
  'help.ctx.journey-detail.bullet.7':
    'Po połączeniu z Dawarich nagłówek dnia pokazuje też „Przejmij nagranie” (albo dystans trasy zapisanej dla tego dnia) i „Przejmij dzień”. W dniu z oczekującymi pobytami są one zebrane w jednym wierszu na końcu dnia.',
  'help.guide.entry-draft.tip.1':
    'Współtwórcy nadal widzą szkic. Ukrywa go tylko link publiczny, dopóki nie wyłączysz „Szkicu”.',
  'help.guide.journey-map-layers.tip.2':
    'Przygaszony przełącznik nie ma jeszcze nic do pokazania, a podpowiedź wyjaśnia dlaczego. Twój wybór jest zapamiętywany osobno dla każdego dziennika w tej przeglądarce.',
  'help.guide.journey-keep-route.tip.2':
    'Później możesz kliknąć dystans w nagłówku dnia, żeby ponownie porównać trasę z Dawarich: „Zastąp” przyjmuje nową wersję, a „Usuń trasę” usuwa trasę tego dnia z dziennika.',
  'help.guide.journey-day-stays.tip.2':
    'Przy intensywnym dniu „Przejmij dzień” na końcu wiersza obsługuje wszystkie pobyty naraz.',
  'help.guide.journey-take-over-day.tip.1':
    'Nic nie zostaje zapisane, zanim klikniesz ten przycisk, i nic nie zostaje zapisane dwa razy: pobyt, który już jest w dzienniku, jest oznaczony i nie można go wybrać ponownie.',
  'help.guide.journey-auto-prepare.tip.1':
    'Przygotowywane są tylko dni powiązanych podróży, które mają daty, a do dziennika nic nie jest dodawane automatycznie.',
  'help.guide.photo-location.result':
    'Wpis bez miejsca dostaje lokalizację, w której zrobiono jego pierwsze zdjęcie z danymi GPS, i pojawia się na mapie.',
  'help.guide.contributors.tip.2':
    '„Przez podróże” wymienia osoby, które mają dostęp dzięki powiązanej podróży. Ich dostęp zmieniasz w ustawieniach tamtej podróży, a nie tutaj.',
  'help.ctx.settings-plugins.bullet.2':
    'Wtyczka może dodać do swojej karty „Akcje”, które uruchamiają się po potwierdzeniu, oraz „Połącz” lub „Rozłącz”, gdy loguje się w twoim imieniu do innej usługi.',
  'help.guide.web-push-device.tip.1':
    'Push działa osobno w każdej przeglądarce: powtórz to na każdym telefonie i komputerze, na którym chcesz dostawać powiadomienia. „Wyłącz na tym urządzeniu” wyłącza je tylko na tym urządzeniu.',
  'help.guide.connect-airtrail.step.2':
    '„Zezwalaj na certyfikaty samopodpisane” włączaj tylko dla zaufanej instancji we własnej sieci. „Zapisuj zmiany z powrotem w AirTrail” jest domyślnie wyłączone, więc TREK tylko odczytuje dane; włącz tę opcję, żeby wysyłać swoje zmiany z powrotem.',
  'help.guide.connect-dawarich.step.2':
    '„Sprawdzaj nowe pobyty automatycznie” pozwala TREK samodzielnie sprawdzać nowe dane. Gdy ta opcja jest wyłączona, TREK odczytuje Dawarich tylko na twoje żądanie. „Zezwalaj na certyfikat z własnym podpisem” jest przeznaczone tylko dla instancji, której twój serwer nie ufa.',
  'help.guide.tour-connect-wanderer.step.2':
    'Włącz „Zezwól na certyfikat z podpisem własnym” tylko dla instancji we własnej sieci.',
  'help.guide.tour-wanderer-watch.step.1':
    'Na karcie wanderer włącz „Sprawdzaj zmiany moich szlaków”. Wymaga to wcześniej zapisanego połączenia.',
  'help.guide.plugin-settings.title': 'Konfiguracja wtyczki na własne potrzeby',
  'help.guide.default-user-settings.tip.2':
    '„Waluta wyświetlania” przelicza kwoty tylko do wyświetlania. Kwoty wpisane w „Kosztach” się nie zmieniają.',
  'help.guide.own-routing-engine.step.2':
    'Jeśli chcesz tras omijających płatne drogi, autostrady lub promy, wpisz adres swojej Valhalli w polu „Własna instancja Valhalli”. Każde pole zapisuje się po jego opuszczeniu; potem zrestartuj serwer TREK i odśwież stronę.',
  'help.guide.admin-passkeys.tip.3':
    'Jeśli użytkownik zgubił urządzenie ze swoimi kluczami dostępu, usuń je przyciskiem „Zresetuj klucze dostępu” w oknie „Edytuj użytkownika”.',
  'help.guide.rotate-jwt-secret.result':
    'Obowiązuje nowy sekret podpisywania, a wszyscy użytkownicy, łącznie z tobą, muszą zalogować się ponownie.',
  'help.guide.read-notifications.title': 'Czytanie powiadomień',
  'help.guide.filter-notifications.title': 'Wszystkie powiadomienia lub tylko nieprzeczytane',
  'help.guide.mark-notifications-read.goal': 'Usuń wyróżnienie i liczbę przy dzwonku, gdy już zobaczysz nowości.',
  'help.guide.delete-notifications.step.1':
    'Kliknij „Usuń”, czyli kosz obok godziny powiadomienia, żeby usunąć tylko to jedno.',
  'help.guide.notification-settings.step.2': 'Kliknij „Ustawienia” w menu.',
  'help.guide.public-link.tip.3': 'Najedź na opcję, żeby sprawdzić, co ukrywa.',
  'help.guide.link-journal.step.4':
    'Przeczytaj żółtą uwagę: wymienia osoby, które dostaną dziennik po raz pierwszy. Potem kliknij „Połącz dziennik”.',
  'help.guide.dawarich-stays.step.1':
    'Gdy Dawarich jest połączony w „Ustawieniach”, w sekcji „Integracje”, nad listą miejsc widać „Z Dawarich”. W nagłówku widać, kiedy TREK ostatnio sprawdzał dane i ile pobytów czeka. Kliknij go, żeby otworzyć listę.',
  'help.guide.leave-stop-off-route.step.2':
    'Obok nazwy pojawia się plakietka „Poza trasą”. Przystanek zostaje w dniu i na mapie, ale trasa dnia i czasy jej odcinków go pomijają.',
  'help.guide.move-booking-day.result': 'Rezerwacja należy w planie do nowego dnia, a jej godzina się nie zmienia.',
  'help.guide.clear-day.tip.2': 'Ta pozycja menu jest widoczna tylko w dniu, który ma przypisane miejsca.',
  'help.guide.place-image-from-file.step.1':
    'Otwórz miejsce, które ma zdjęcie w „Plikach”. Sekcja „Pliki” u dołu karty pokazuje, ile plików ma miejsce.',
  'help.guide.place-own-hours.title': 'Poprawianie godzin otwarcia, telefonu lub e-maila miejsca',
  'help.guide.place-own-hours.tip.1':
    'Wpisane przez ciebie godziny zastępują te pobrane przez TREK, więc kawiarnia z sezonowymi godzinami pokazuje to, co wiesz.',
  'help.guide.day-panel.tip.3':
    'Planujesz według kalendarza? Włącz „Data na początku nagłówków dni” w „Ustawieniach”, w sekcji „Wygląd”, a w nagłówku najpierw pojawi się data, a pod nią „Dzień 1” lub nazwa dnia.',
  'help.guide.confirm-stay-booking.result':
    'Rezerwacja hotelu jest potwierdzona, zarówno na karcie noclegu, jak i na karcie „Rezerwacje”.',
  'help.guide.tour-map-lines.goal':
    'Rozróżniaj wycieczki podróży na mapie, otwieraj je kliknięciem w linię i ukrywaj te, których teraz nie potrzebujesz.',
  'help.guide.tour-map-lines.tip.3':
    '„Pomiń w trasie” w menu wiersza wycieczki w planie dnia sprawia, że trasa dnia nie prowadzi już do początku i końca wycieczki. „Przywróć do trasy” znów je łączy.',
  'help.guide.car-stops.step.5':
    'Kolejność przystanków wyznacza trasę. Zmieniasz ją przyciskami „Przenieś w górę” i „Przenieś w dół” po lewej stronie przystanku, a „Usuń przystanek”, krzyżyk po prawej, usuwa go.',
  'help.guide.transport-details.step.3':
    'Kafelki poniżej pokazują odjazd i przyjazd ze stacjami lub lotniskami, a potem peron i miejsce, jeśli są podane. Przejazd z przystankami pośrednimi wymienia je w sekcji „Trasa”, a przejazd rezerwowany odcinkami pokazuje kod każdego odcinka w sekcji „Kody odcinków”. Dalej są „Podróżni”, „Notatki”, „Koszty” i „Pliki”; „Pokaż w plikach” otwiera bilet na karcie „Pliki”.',
  'help.guide.export-transports-csv.title': 'Eksport transportu do arkusza kalkulacyjnego',
  'help.guide.group-sort-bookings.step.4':
    'Kliknij nagłówek sekcji, żeby ją zwinąć. Liczba obok pokazuje, ile rezerwacji zawiera, a ponowne kliknięcie znów ją rozwija.',
  'help.guide.booking-on-map.goal': 'Przejdź od rezerwacji do jej miejsca w planie i na mapie.',
  'help.guide.export-bookings-csv.tip.2':
    'Kolumny są rozdzielone średnikami, a Excel otwiera plik z poprawnymi znakami diakrytycznymi.',
  'help.guide.arrange-packing-list.tip.2':
    'TREK zapamiętuje „Od A do Z” w tej przeglądarce, więc następnym razem lista też otworzy się posortowana. Zmienia to tylko twój widok, nigdy kolejność widzianą przez innych.',
  'help.guide.count-packed-pieces.step.4':
    'Gdy licznik osiągnie ilość, przedmiot zostaje automatycznie odhaczony i liczy się jako spakowany.',
  'help.guide.expense-receipts.result':
    'Paragon jest zapisany razem z wydatkiem: otwiera go znacznik w wierszu, a plik jest też w „Plikach” podróży.',
  'help.guide.files-sync-settings.step.4':
    'W sekcji „Gdy dokument zostanie usunięty” wybierz, co ma się stać z kopią po drugiej stronie. „Zachowaj obie kopie” zostawia kopię w magazynie. „Przenieś do kosza” przenosi ją do kosza w magazynie, gdy dokument zostanie usunięty w TREK.',
  'help.ctx.trip-collab.bullet.7':
    'Wszystko tutaj wymaga połączenia z internetem. Offline wiadomość, notatka, link, ankieta ani głos nie zostaną zapisane, a TREK poinformuje, że potrzebne jest połączenie. Spróbuj ponownie, gdy TREK znów będzie online. Uczestnicy bez prawa do edycji „Współpracy” mogą wszystko czytać, ale nie widzą przycisków „Nowa notatka”, „Dodaj link” i „Nowa ankieta”, a pole wiadomości jest dla nich wyszarzone.',
  'help.guide.manage-notes.step.4':
    '„Edytuj” otwiera okno notatki z wypełnionymi polami. Zmień, co trzeba, tutaj jeszcze jeden wiersz w „Treści”, i kliknij „Zapisz”.',
  'help.guide.note-categories.step.2':
    'Wpisz nazwę w polu „Nowa kategoria...” na dole i naciśnij Enter albo kliknij plus obok. Nowa kategoria dostaje kolejny kolor i własny wiersz.',
  'help.guide.note-categories.tip.3':
    'Na karcie kategorię oznacza tylko kolorowa kropka w nagłówku. Najedź na nią, żeby zobaczyć nazwę.',
  'help.guide.roadtrip-reorder.step.1':
    'Przeciągnij przystanek za jego wiersz i upuść na innym przystanku tego samego dnia. Zajmie miejsce tamtego przystanku, a trasa dnia zostanie wyznaczona ponownie w nowej kolejności.',
  'help.guide.roadtrip-overnight.step.5':
    'Kliknij „Dodaj”. Nocleg zostaje zapisany od tego dnia do następnego, a miejsce trafia do trasy jako nocleg tego dnia.',
  'help.guide.roadtrip-stop-fill.step.3':
    'Żeby przystanek znów korzystał z twojego ustawienia, otwórz ponownie plakietkę i kliknij „Użyj mojej wartości domyślnej”.',
  'help.guide.roadtrip-bookings.step.3':
    'Pigułka „Zameldowanie” lub „Wsiadanie” określa, na kiedy musisz dotrzeć do terminalu: wyjazd jest ustawiony o tyle wcześniej niż godzina z rozkładu.',
  'help.guide.roadtrip-google-import.title': 'Import trasy z Google Maps',
  'help.guide.roadtrip-google-import.tip.2':
    'Link musi zawierać co najmniej dwa przystanki, które TREK potrafi zlokalizować, i maksymalnie 30.',
  'help.guide.roadtrip-hazards.tip.1':
    'Ostrzeżenia to nie zamknięcia dróg: trasa nigdy się przez nie nie zmienia, a są to bieżące komunikaty, a nie prognoza na twoje daty.',
  'help.ctx.trip-tours.bullet.4':
    'Najedź na wiersz, żeby zobaczyć ikonę oka („Ukryj na mapie”) i okrągły + („Dodaj do dnia”). Przeciągnij wiersz na dzień w lewej kolumnie, żeby go tam zaplanować, albo kliknij go, żeby otworzyć kartę wycieczki nad mapą.',
  'help.guide.tour-show-list.step.4':
    'Karta pokazuje parametry wycieczki, a w sekcji „Dni podróży” dni, do których jest przypisana. Żeby zmienić samą trasę, otwórz kartę „Wycieczki” i kliknij wycieczkę w „Wycieczkach w tej podróży”.',
  'help.guide.tour-add-to-day.step.1':
    'Najedź na wycieczkę na liście i kliknij okrągły + po prawej stronie jej wiersza („Dodaj do dnia”).',
  'help.guide.tour-add-to-day.tip.4':
    'Gdy dzień jest otwarty (kliknij jego nagłówek), karta wycieczki też oferuje „Dodaj do dnia” dla tego dnia. Strzałka cofania nad dniami cofa przypisanie.',
  'help.guide.tour-day-times.tip.1': 'Wpisana przez ciebie godzina zakończenia zastępuje wyliczoną.',
  'help.guide.tour-remove-from-day.step.2':
    'Wycieczka zostaje na liście po prawej. Jej plakietka z dniem znika, a filtr znów liczy ją jako „Niezaplanowane”.',
  'help.guide.tour-filter-list.step.2':
    'W sekcji „Status” wybierz „Niezaplanowane”, żeby zobaczyć wycieczki bez dnia, albo „Zaplanowane”, żeby zobaczyć te już przypisane do dnia. Przy każdej opcji widać liczbę pasujących wycieczek.',
  'help.guide.tour-hide-on-map.goal':
    'Ukryj na mapie niepotrzebne teraz wycieczki, nie zmieniając ich dla nikogo innego.',
  'help.guide.tour-import-plan-tab.goal': 'Zaimportuj ślad GPX lub KML jako wycieczkę podczas planowania dni.',
  'help.ctx.trip-tour-detail.summary':
    'Karta, która otwiera się nad mapą po wybraniu wycieczki na karcie „Plan”: dni, parametry i profil, pochodzenie oraz przyciski do wysłania wycieczki na telefon, skopiowania, zapisania w kolekcji lub połączenia z listą pakowania.',
  'help.guide.tour-detail-read.step.1':
    'U góry prawej kolumny przełącz z „Miejsca” na „Wycieczki” i kliknij wycieczkę. Jej karta otworzy się nad mapą. Tę samą kartę otwiera wiersz wycieczki w dniu albo jej linia na mapie.',
  'help.guide.tour-detail-read.tip.2':
    'Spływ nie pokazuje wysokości ani profilu: jego punkty leżą na brzegach, więc wysokości byłyby błędne.',
  'help.guide.tour-rename-colour.step.2':
    'Wpisz nową nazwę i kliknij okrągły przycisk z ptaszkiem albo naciśnij Enter. Escape zachowuje starą nazwę.',
  'help.guide.tour-take-along.step.1':
    'Otwórz kartę wycieczki. „Nawigacja” na dole karty otwiera punkt startowy wycieczki w aplikacji z mapami, a jeśli masz ich kilka, najpierw je wyświetla. Prowadzi do startu, a nie wzdłuż trasy.',
  'help.guide.tour-copy-keep.title': 'Kopiowanie wycieczki lub zapisanie jej w kolekcji',
  'help.guide.tour-copy-keep.tip.3':
    'Na karcie „Wycieczki” to samo dla otwartej wycieczki robi zakładka u góry lewej kolumny. Jeśli wycieczka ma niezapisane zmiany, pojawi się prośba o jej zapisanie.',
  'help.guide.tour-packing-link.step.4':
    'Karta pokazuje teraz listę, liczbę spakowanych przedmiotów, pasek postępu i pierwsze przedmioty. Spakowane są przekreślone.',
  'help.guide.tour-files.step.1':
    'Otwórz kartę wycieczki i przewiń do sekcji „Pliki” na jej końcu. Kliknij „Prześlij” w nagłówku sekcji i wybierz jeden lub kilka plików.',
  'help.guide.tour-activity-link.step.1':
    'Otwórz kartę zaplanowanej wycieczki i przewiń do „Rzeczywista trasa”. Kliknij „Dodaj rzeczywistą trasę”.',
  'help.guide.tour-activity-link.result':
    'Ślad jest powiązany z wycieczką, a karta pokazuje obok siebie plan i to, co faktycznie przeszedłeś.',
  'help.guide.tour-activity-compare.tip.2':
    'Odbyte wycieczki w „Atlasie” liczą powiązany ślad zamiast wartości z planu.',
  'help.guide.tour-origin-check.tip.2':
    'Wycieczka z wanderer ma obok źródła strzałkę „Otwórz w wanderer”, a w nagłówku sekcji przycisk „Sprawdź źródło”. Sprawdzenie pyta wanderer, czy szlak zmienił się od importu. „Importuj jako nową migawkę” importuje wtedy nową wersję jako osobną wycieczkę. Ta wycieczka zachowuje swoje dni i notatki.',
  'help.ctx.trip-tour-planner.bullet.4':
    'Gdy włączone jest „Dodaj punkt” („Ustawiaj punkty” w pigułce mapy), kliknięcie w mapę dodaje punkt. Przeciągnij pinezkę, żeby ją przesunąć, kliknij narysowaną trasę, żeby dodać w tym miejscu punkt kształtujący, a miejsce z podróży wybierzesz przez „Miejsca podróży”.',
  'help.guide.tour-open-workspace.step.4':
    'Plus u góry prawego panelu, „Dodaj trasę”, oferuje „Importuj GPX lub KML”, „Importuj spacer z Google Maps” i „Przejmij trasę z innej podróży”. Gdy wycieczka jest otwarta, jest tam też „Zaplanuj nową wycieczkę”.',
  'help.guide.tour-draw-route.title': 'Rysowanie nowej wycieczki',
  'help.guide.tour-draw-route.tip.1':
    'Gdy włączone jest „Ustawiaj punkty”, kursor ma postać celownika. Wyłącz tę opcję, żeby przesuwać mapę bez dodawania punktów. W 3D jest na początku wyłączona, bo tam przeciągasz mapę, żeby się rozejrzeć.',
  'help.guide.tour-type-profile.step.2':
    'Wybierz rodzaj z listy: „Wędrówka piesza”, „Spacer po mieście / zwiedzanie”, „Bieg”, „Wycieczka rowerowa”, „Spływ”, „Przejażdżka konna” lub „Narty i zima”. Przy każdym rodzaju widać, co planuje, a zmiana rodzaju wyznacza trasę od nowa.',
  'help.guide.tour-edit-points.step.1':
    'Przeciągnij ponumerowaną pinezkę na mapie tam, gdzie ma być punkt. Trasa zostanie wyznaczona od nowa przez nowe miejsce.',
  'help.guide.tour-edit-points.result':
    'Punkty są tam, gdzie chcesz, i w wybranej kolejności, a trasa została wyznaczona od nowa.',
  'help.guide.tour-shaping-points.tip.2': 'Punkt kształtujący nie może być końcem etapu wycieczki wielodniowej.',
  'help.guide.tour-loop-reverse.tip.1':
    'Gdy wycieczka jest już pętlą, „Powrót do startu” pokazuje „Wycieczka już wraca do startu”.',
  'help.guide.tour-leg-by-hand.step.3':
    'Żeby router znów wyznaczył odcinek, otwórz to samo menu i wybierz „Wyznacz następny odcinek ponownie”.',
  'help.guide.tour-trip-places.step.2':
    'Przeszukaj miejsca podróży albo zajrzyj do sekcji „W pobliżu trasy”: miejsca w promieniu dwóch kilometrów od trasy, od najbliższych, każde z odległością.',
  'help.guide.tour-details-times.goal': 'Nadaj wycieczce nazwę, opis i link oraz uwzględnij przerwy w jej czasie.',
  'help.guide.tour-details-times.result': 'Wycieczka ma teraz nazwę, notatki i zaplanowany czas.',
  'help.guide.tour-save.tip.2':
    '„Wróć do wycieczek” u góry panelu zamyka edytor, a jeśli są niezapisane zmiany, najpierw pyta o potwierdzenie.',
  'help.guide.tour-edit-saved.step.4':
    'Kliknij „Wróć do wycieczek”, żeby zamknąć edytor. Przy niezapisanych zmianach najpierw pojawi się pytanie „Odrzucić niezapisane zmiany wycieczki?”.',
  'help.guide.tour-summary-profile.step.2': 'Kropka informacyjna obok szacowanego czasu wyjaśnia, jak jest wyliczany.',
  'help.guide.tour-list-manage.goal':
    'Sprawdź sumy dla wycieczek w podróży, przypisz wycieczkę do dnia i zawęź listę do tego, czego potrzebujesz.',
  'help.guide.tour-list-manage.tip.3':
    'Kosz w wierszu usuwa wycieczkę. Karta „Plan” pokazuje te same wycieczki, gdy jej prawa kolumna jest przełączona na „Wycieczki”.',
  'help.guide.tour-delete.tip.3':
    'Wycieczkę usuwasz tutaj, na karcie „Wycieczki”. Kosz widzą tylko uczestnicy, którzy mogą edytować miejsca podróży.',
  'help.guide.tour-saved-elsewhere.tip.1':
    '„Zapisz jako nową trasę” nadaje twojej kopii nazwę wycieczki z dopiskiem „(moja wersja)”.',
  'help.ctx.trip-tour-import.bullet.4':
    '„Wersja do edycji” zamienia import w wycieczkę z punktami trasy, które możesz przesuwać. „Zastąp import” zachowuje nagrany ślad, a karta „Zarejestrowany ślad” w edytorze pozwala do niego wrócić.',
  'help.guide.tour-import-gpx.step.5':
    'Kliknij „Importuj 1 wycieczkę” (albo „Importuj 3 wycieczki” przy pliku z trzema śladami).',
  'help.guide.tour-view-import.goal':
    'Zobacz przebieg, parametry i profil wysokości zaimportowanej wycieczki w takiej postaci, w jakiej ją zaimportowano.',
  'help.guide.tour-plan-from-import.title': 'Planowanie edytowalnej wycieczki na podstawie importu',
  'help.guide.tour-plan-from-import.tip.3':
    'Import spływu lub trasy narciarskiej nie jest wyznaczany przez router: jego punkty łączą się liniami prostymi.',
  'help.guide.tour-restore-recorded.tip.1':
    'Ta karta jest widoczna tylko przy wycieczce, która została zastąpiona przez „Zastąp import”, a potem zapisana.',
  'help.guide.tour-take-over.step.4':
    'Kliknij wycieczkę. Po prawej stronie widać jej linię, parametry i podróż, z której pochodzi.',
  'help.guide.tour-import-wanderer.goal': 'Zaimportuj do podróży jeden ze szlaków ze swojego wanderer jako wycieczkę.',
  'help.guide.tour-import-wanderer.tip.4': '„Otwórz w wanderer” otwiera szlak na twojej instancji.',
  'help.ctx.trip-tour-map.bullet.5':
    'W 3D trasa jest pokazana na ukształtowaniu terenu, w kolorach zależnych od nachylenia, z legendą podsumowującą nachylenia i przelotem od startu do mety.',
  'help.guide.tour-map-layers.tip.2':
    'Mapy „Turystyka” i „Rower” pochodzą z serwerów wolontariuszy i są dostępne tylko wtedy, gdy zezwala na to administrator. Gdy któryś serwer przestaje odpowiadać, przy jego opcji pojawia się !, a ty możesz przełączyć się na inną mapę; twoja wycieczka się nie zmienia.',
  'help.guide.tour-along-search.step.5':
    'Znalezione miejsca są wymienione z odległością od trasy i zaznaczone na mapie swoim kolorem. Gwiazdka oznacza najbardziej znane, a „W trasie” te, które już są przystankiem. Przycisk zmienia się na „Szukaj ponownie”.',
  'help.guide.tour-along-add-stop.step.2':
    '„Gdzie wstawić” podpowiada odcinek, do którego miejsce pasuje najlepiej. Kliknij, żeby wybrać zamiast tego, między którymi przystankami ma się znaleźć, albo „Jako nowy cel”. Zanim cokolwiek się zmieni, mapa pokazuje nową trasę linią przerywaną.',
  'help.guide.tour-3d-terrain.goal':
    'Zobacz wycieczkę na prawdziwym ukształtowaniu terenu, w kolorach zależnych od nachylenia.',
  'help.guide.tour-3d-terrain.tip.2':
    'Wybrana mapa działa też w 3D, podobnie jak ferraty, trasy narciarskie i znaki nawigacyjne na wodzie. Podczas edycji wycieczki możesz przeciągać jej punkty po terenie, a przy włączonym „Ustawiaj punkty” kliknięcie dodaje punkt.',
  'help.guide.tour-3d-flyover.result': 'Zobaczyłeś wycieczkę z lotu ptaka, od startu do mety, w wybranym tempie.',
  'help.guide.tour-map-overlays.step.3':
    'Legenda wyjaśnia kolory: trasy zjazdowe od „Początkujący” do Freeride, „Trasy biegowe”, „Szlaki zimowe i rakietowe”, „Tory saneczkowe” oraz „Wyciągi i kolejki”. „Pełna legenda w OpenSnowMap” pokazuje wszystkie symbole. Naciśnij Escape, żeby ją zamknąć.',
  'help.ctx.trip-tour-stages.bullet.1':
    '„Dni” w edytorze ustawiają otwartą wycieczkę jako „Jednodniowa” lub „Wielodniowa”. Gdy przełączysz z powrotem na jednodniową, po potwierdzeniu wszystkie końce etapów zostaną usunięte, a trasa pozostanie bez zmian.',
  'help.guide.tour-multi-day.step.2':
    'W sekcji „Dni” kliknij „Wielodniowa”. Uwaga pokaże, gdzie umieszczono koniec pierwszego etapu.',
  'help.guide.tour-multi-day.tip.4':
    'Etapy są zapisywane po kliknięciu „Zapisz”. Jeśli zmiana usuwa etap przypisany do dnia podróży, komunikat poinformuje, że zapisanie usunie go z tego dnia.',
  'help.guide.tour-stages-on-days.step.5':
    'Przy każdym etapie widać dzień, do którego jest przypisany. Kliknij dzień, żeby przenieść etap na inny, albo wybierz „Bez dnia”, żeby go usunąć z planu.',
  'help.ctx.trip-tour-hike.summary':
    'Wędrówka lub bieg otwarte na karcie „Wycieczki”: edytor po lewej, mapa pośrodku, a po prawej podsumowanie wycieczki i inne wycieczki podróży. Wędrówka nie przekracza dozwolonej trudności szlaku, czas biegu wynika z twojego tempa, a obie pokazują to, co OpenStreetMap zapisuje wzdłuż trasy.',
  'help.guide.tour-hike-plan.goal':
    'Rozpocznij wędrówkę, ustaw przystanki, wybierz najwyższy dopuszczalny stopień trudności szlaku i zapisz ją.',
  'help.guide.tour-hike-plan.tip.1':
    'Nowa wędrówka zaczyna się od T2 („Turystyka górska”). Przy T3 pojawia się ostrzeżenie, że takie ścieżki mogą być eksponowane i wymagają pewnego kroku oraz odporności na lęk wysokości.',
  'help.guide.tour-hike-trail-details.step.3':
    'Plakietki to podsumowują: jaka część trasy ma dane („Znane”), „Najwyższy znany” stopień, a osobno „Limit trasy”, z którym zaplanowano wędrówkę.',
  'help.guide.tour-hike-round.goal':
    'Niech TREK zaproponuje pętle o wybranej długości, zaczynające się od jednego z przystanków wędrówki.',
  'help.guide.tour-hike-round.tip.2':
    'Możesz podać dystans od 1 do 60 km, a TREK zaproponuje pętle różniące się od niego najwyżej o 20 %.',
  'help.guide.tour-hike-compare-ways.result':
    'Ten jeden odcinek prowadzi wybraną drogą, a reszta wędrówki pozostaje bez zmian. „Droga przyjęta” na dole mapy ma przycisk „Cofnij”.',
  'help.guide.tour-ferrata-add.step.3':
    'Kliknij „Dodaj do wycieczki”. Ferrata zostanie dodana na końcu trasy jako osobny odcinek, z punktem na każdym końcu.',
  'help.guide.tour-run-plan.title': 'Planowanie biegu we własnym tempie',
  'help.guide.tour-run-plan.tip.1': 'Bez podania tempa biegu nie da się zapisać.',
  'help.guide.tour-run-ways.step.3':
    'Kliknij „Nawierzchnia”, a potem nawierzchnię na liście, żeby na mapie zostały tylko odcinki o tej nawierzchni.',
  'help.ctx.trip-tour-walk.bullet.3':
    'Gdy spacer jest przypisany do dnia z godziną startu, „Godziny dla” u góry „Punktów trasy” pokazuje ten dzień, a przy każdym przystanku widać godzinę dotarcia, czas pobytu i informację o godzinach otwarcia.',
  'help.guide.tour-walk-plan.step.4':
    'Nadaj przystankowi „Etykietę” i ustaw „Pobyt w minutach”. Zostaw pobyt pusty, jeśli jeszcze go nie znasz, a dla punktu, który tylko mijasz, wpisz 0.',
  'help.guide.tour-walk-sights.goal':
    'Wybierz temat, wyszukaj miejsca wzdłuż spaceru i dodaj jedno z nich jako przystanek.',
  'help.guide.tour-walk-sights.tip.3':
    'Godziny otwarcia i strony internetowe pochodzą ze źródła, głównie z OpenStreetMap. Sprawdź je przed wyjściem.',
  'help.guide.tour-walk-day-times.tip.1':
    'Bez godziny startu wiersz informuje: „Podaj godzinę spaceru w tym dniu, aby zobaczyć przyjazdy i godziny otwarcia”.',
  'help.guide.tour-walk-google-import.step.2': 'Wklej link w polu „Link do trasy pieszej” i kliknij „Odczytaj link”.',
  'help.guide.tour-walk-check-off.goal':
    'Oznaczaj w danym dniu przystanki jako odwiedzone lub pominięte i sprawdzaj, ile marszu zostało.',
  'help.guide.tour-walk-check-off.result':
    'Odwiedzone przystanki są odhaczone, pominięte przekreślone, a pozostały czas obejmuje tylko to, co jeszcze przed tobą.',
  'help.guide.tour-bike-profile.goal':
    'Rozpocznij wycieczkę rowerową i pozwól TREK wyznaczyć trasę pod rower turystyczny, szosowy, gravelowy lub MTB.',
  'help.guide.tour-bike-profile.tip.1': 'Późniejsza zmiana profilu wyznacza całą trasę od nowa pod nowy profil.',
  'help.guide.tour-bike-surfaces.step.2':
    'Plakietka w nagłówku karty pokazuje, jaka część trasy na pewno jest nieutwardzona.',
  'help.guide.tour-bike-mtb-grades.title': 'Stopnie trudności szlaków na wycieczce MTB',
  'help.guide.tour-bike-mtb-grades.tip.3':
    'Jeśli stopni nie udało się odczytać, karta o tym informuje. Kliknij „Spróbuj ponownie”.',
  'help.ctx.trip-tour-ski.bullet.5':
    'Gdy otwarta jest wycieczka typu „Narty i zima”, mapa pokazuje trasy z OpenSnowMap, a obok ich przełącznika jest „Legenda tras”. To wyłącznie dane z mapy: nic tu nie mówi, czy trasa lub wyciąg są czynne, jakie są warunki śniegowe ani jakie jest zagrożenie lawinowe.',
  'help.guide.tour-ski-plan.step.6': 'Nadaj wycieczce nazwę w polu „Nazwa wycieczki” i kliknij „Zapisz”.',
  'help.guide.tour-ski-options.step.1':
    'W wycieczce typu „Narty i zima” opcje routera są pod „Dyscypliną”. Widzisz tylko te, z których korzysta twoja dyscyplina: na przykład „Biegowe” nie mają opcji „Najtrudniejsze trasy”.',
  'help.guide.tour-ski-options.result':
    'Wycieczka zostaje wyznaczona od nowa w twoich granicach, a karta „Trasa narciarska” wymienia trudniejsze trasy, które ominięto.',
  'help.guide.tour-ski-fix-leg.tip.3':
    'Offline odcinki są na razie rysowane jako linie proste. Szary wiersz o ścieżkach letnich to informacja, a nie błąd.',
  'help.guide.tour-ski-summary.tip.1':
    '„Ominięto” wymienia trudniejsze trasy, których router unikał ze względu na twój limit „Najtrudniejsze trasy”.',
  'help.guide.tour-ski-pistes-layer.step.2':
    'Kliknij „Legenda tras”, przycisk z czterema kolorowymi kropkami obok przełącznika.',
  'help.guide.tour-ski-import.step.1':
    'Na karcie „Wycieczki” kliknij „Dodaj trasę” (plus nad „Wycieczkami w tej podróży”), wybierz „Importuj GPX lub KML” i wskaż plik.',
  'help.guide.tour-ski-import.tip.3':
    'Możesz też upuścić pliki GPX, KML lub KMZ w dowolnym miejscu karty „Wycieczki”, żeby otworzyć ten sam podgląd.',
  'help.ctx.trip-tour-paddle.bullet.5':
    '„Wiatr” pokazuje prognozę w miejscu startu wycieczki na dzień, na który jest zaplanowana. „Lista kontrolna” wymienia przeszkody na zapisanej trasie i to, co postanowiłeś przy każdej z nich.',
  'help.guide.tour-paddle-setup.step.5':
    'Na jeziorze opcja „Przez jeziora” określa trasę: „Na wprost” jest najkrótsza, a „Blisko brzegu” prowadzi przy brzegu, co przydaje się w wietrzne dni.',
  'help.guide.tour-paddle-water-route.title': 'Planowanie odcinków na wodzie',
  'help.guide.tour-paddle-water-route.tip.2':
    'Tam, gdzie trasa wymaga obniesienia łodzi wokół jazu lub prowadzi przez śluzę, TREK ustawia własny punkt oznaczony jako „Wykryty”. Jeśli go przesuniesz lub zmienisz, stanie się twoim punktem.',
  'help.guide.tour-paddle-portage.step.3':
    'Pod punktem pojawia się karta „Przenoska” z długością i dodatkowymi minutami. Kliknij ją, żeby ją otworzyć.',
  'help.guide.tour-paddle-lock.goal': 'Dodaj śluzę do wycieczki i uwzględnij w jej czasie oczekiwanie i śluzowanie.',
  'help.guide.tour-paddle-lock.result':
    'Śluza jest na wycieczce wraz ze swoimi minutami, a „Szacowany czas” je uwzględnia.',
  'help.guide.tour-paddle-time.tip.1':
    'TREK przyjmuje na początek 4 km/h na wodzie, 2 km/h przy przenoszeniu i 10 minut na każdą przenoskę. To wartości wyjściowe do dostosowania, a nie pomiary.',
  'help.guide.tour-paddle-wind.step.3':
    'Słupki pokazują kolejne godziny dnia, a porywy są widoczne za średnim wiatrem. Najedź na słupek, żeby zobaczyć wartości i kierunek dla danej godziny.',
  'help.guide.tour-paddle-checklist.goal':
    'Sprawdź, co wiadomo o jazach, śluzach i zasadach dostępu na zapisanej trasie, i zdecyduj, co robisz w każdym z tych miejsc.',
  'help.guide.tour-paddle-checklist.tip.3':
    'Pozycja oznaczona „Sprawdź ponownie” została rozstrzygnięta, zanim zmieniła się trasa lub dane. Zdecyduj jeszcze raz albo wybierz „Zachowaj decyzję” lub „Usuń decyzję”. Decyzje, które już nie mają zastosowania, są w sekcji „Wcześniejsze decyzje”.',
  'help.guide.tour-paddle-track-marks.step.3': 'Kliknij „Importuj 1 wycieczkę”.',
  'help.guide.tour-paddle-track-marks.result':
    'Nagrany ślad zawiera przenoski i śluzy, a jego „Szacowany czas” je uwzględnia.',
  'help.guide.tour-horse-plan.title': 'Planowanie przejażdżki po trasach konnych',
  'help.guide.tour-horse-plan.step.7':
    'Nadaj przejażdżce nazwę w polu „Nazwa wycieczki”, a potem kliknij „Zapisz” na dole lewej kolumny.',
  'help.guide.tour-horse-gap.goal':
    'Kontynuuj przejażdżkę odcinkiem, który zaczyna się w pewnej odległości od jej końca.',
  'help.guide.tour-horse-gap.tip.3':
    'Odcinek, który zaczyna się w promieniu 25 m od końca przejażdżki, bezpośrednio ją kontynuuje, a „Połączenie z przejażdżką” pokazuje „Łączy się z końcem przejażdżki”.',
  'help.guide.tour-horse-recorded.tip.1':
    'Linia pozostaje dokładnie taka, jak zapisano ją w pliku. Nic nie jest wyznaczane od nowa, a nagrana przejażdżka nie ma wersji do edycji.',
  'help.guide.dateless-trip.result':
    'Karta pokazuje „Pomysł” i „Brak ustawionych dat”, a podróż ma tyle pustych dni, ile podałeś.',
  'help.guide.trip-reminder.title': 'Przypomnienie przed podróżą',
  'help.guide.upcoming-reservations.tip.1':
    'Pobyt w hotelu pojawia się dwa razy: raz przy zameldowaniu i raz przy wymeldowaniu.',
  'help.guide.half-company-holiday.result':
    'Firma ma wolne pół dnia, a zapisany na ten dzień urlop liczy się tylko jako pół dnia.',
  'help.guide.edit-holiday-calendar.title': 'Zmiana lub usuwanie kalendarza świąt',
  'help.guide.answer-fusion-request.result':
    'Po kliknięciu „Akceptuj i połącz” oba plany są widoczne w jednej siatce, a każda osoba ma własny kolor.',
  'help.guide.log-for-partner.result':
    'Dni mają kolor tej drugiej osoby i są odliczane od jej wymiaru urlopu, a nie od twojego.',
  'help.guide.dissolve-fusion.tip.1':
    '„Anuluj” w tym oknie zostawia plan bez zmian; twoje wpisy zostają w obu przypadkach.',
  'help.guide.country-places.tip.1':
    'Miejsce przypisane do złego kraju ma zwykle błędny adres lub błędne współrzędne. Otwórz stąd jego podróż i popraw tam miejsce.',
  'help.guide.tour-activity-stats.title': 'Podsumowanie odbytych wycieczek',
  'help.guide.tour-activity-stats.result':
    'Sumy w oknie i na karcie „Wycieczki” nie obejmują już pominiętej wycieczki. Jej trasa, dni i podróż pozostają bez zmian.',
  'help.guide.move-to-list.tip.2':
    'Przenoszenie usuwa miejsca z listy, dlatego „Przenieś do listy” widzi tylko jej właściciel lub administrator. „Duplikuj do listy” działa na każdej liście, którą możesz otworzyć.',
  'help.guide.accept-list-invite.step.2':
    'Kliknij „Akceptuj”, żeby dołączyć, albo „Odrzuć”, żeby odrzucić zaproszenie.',
  'help.guide.tour-collection-add-to-trip.tip.2':
    'Jeśli wycieczkę zapisano bez linii, trzeba dodać ją razem z punktami trasy. Okno o tym informuje i samo zaznacza tę opcję.',
  'help.guide.tour-collection-manage.tip.1':
    'Usunięcie wycieczki z listy nie zmienia wycieczek, które już na jej podstawie utworzono w twoich podróżach.',
  'help.guide.entry-draft.tip.2':
    'Wpisy z dnia przejętego z Dawarich są szkicami. Zanim udostępnisz dziennik, sprawdź, czy nie mają tej plakietki.',
  'help.guide.journey-map-layers.result':
    'Mapa pokazuje tylko wybrane warstwy, a znaczenie każdej pinezki, kropki i linii wyjaśnia legenda.',
  'help.guide.journey-keep-route.result':
    'Nagłówek dnia pokazuje dystans, a trasa jest rysowana ciągłą linią na warstwie „Nagrane” mapy, widocznej dla wszystkich uczestników dziennika. Udostępniony link pokazuje ją tylko wtedy, gdy włączone są „Nagrane trasy”.',
  'help.guide.journey-day-stays.result':
    'Rozstrzygnięte pobyty znikają z wiersza. Napisane wpisy pojawiają się w swoim dniu jak każdy inny wpis i jak zwykle możesz dodawać do nich zdjęcia i tekst.',
  'help.guide.journey-take-over-day.tip.2':
    'Szkice nie są widoczne w udostępnionych linkach. Dodaj zdjęcia i tekst, a potem wyłącz „Szkic” w każdym wpisie.',
  'help.guide.journey-auto-prepare.tip.2':
    'Kropka na przycisku listy dnia oznacza, że dzień nie jest jeszcze ostateczny; podpowiedź wyjaśnia dlaczego.',
  'help.ctx.settings-plugins.bullet.3':
    '„Aktywność wtyczek” na dole wymienia wszystkie działania, które wtyczki wykonały w twoim imieniu, od najnowszych, z przyciskiem „Odśwież”.',
  'help.guide.language-region.tip.3':
    '„Tydzień zaczyna się w” ustala pierwszą kolumnę w każdym kalendarzu wyboru dat; „Urlopy” mają własne ustawienie.',
  'help.guide.web-push-device.tip.2':
    'Na iPhonie i iPadzie najpierw dodaj TREK do ekranu początkowego i otwieraj go stamtąd.',
  'help.guide.connect-airtrail.step.3':
    'Kliknij „Zapisz”, a potem „Testuj połączenie”. Zobaczysz, ile lotów znaleziono, a plakietka zmieni się na „Połączono”.',
  'help.guide.connect-dawarich.step.3':
    'Kliknij „Zapisz”, a potem „Testuj połączenie”: test policzy pobyty z ostatnich 30 dni. Po połączeniu „Sprawdź teraz” od razu sprawdza nowe dane, a „Rozłącz” po prawej kończy połączenie.',
  'help.guide.tour-connect-wanderer.step.3':
    'Kliknij „Zapisz”, a potem „Testuj połączenie”. Zobaczysz, ile szlaków możesz zaimportować, a plakietka zmieni się na „Połączono”.',
  'help.guide.tour-wanderer-watch.step.2':
    'Najwyżej raz dziennie TREK odczytuje krótki opis każdego zaimportowanego szlaku, a wiersz pokazuje, kiedy ostatnio sprawdzał. Gdy szlak mógł się zmienić, dostajesz powiadomienie, a licznik „Wskazówki” go uwzględnia: kliknij „Wskazówki”, żeby zobaczyć każdą wycieczkę ze statusem „Mogło się zmienić”, „Zmieniono” lub „Nie do sprawdzenia”, i otwórz ją stamtąd.',
  'help.guide.plugin-settings.goal':
    'Przekaż wtyczce własne klucze i preferencje oraz sprawdź, co zrobiła w twoim imieniu.',
  'help.guide.own-routing-engine.result': 'Trasy we wszystkich podróżach są wyznaczane na twoich serwerach.',
  'help.guide.admin-passkeys.title': 'Logowanie kluczem dostępu',
  'help.guide.rotate-jwt-secret.tip.1': 'Ty też zostaniesz wylogowany, więc od razu zaloguj się ponownie.',
  'help.guide.notification-defaults.title': 'Domyślne ustawienia powiadomień użytkowników',
  'help.ctx.notifications.title': 'Powiadomienia',
  'help.guide.read-notifications.goal':
    'Zobacz, co działo się w twoich podróżach pod twoją nieobecność, i od razu przejdź do szczegółów.',
  'help.guide.filter-notifications.goal':
    'Przejrzyj wszystkie powiadomienia albo tylko te, których jeszcze nie przeczytałeś.',
  'help.guide.mark-notifications-read.step.1':
    'Kliknij „Oznacz jako przeczytane”, czyli podwójny ptaszek obok godziny powiadomienia, żeby oznaczyć tylko to jedno.',
  'help.guide.delete-notifications.step.2':
    '„Usuń wszystkie” u góry usuwa całą listę naraz, po potwierdzeniu w oknie dialogowym.',
  'help.guide.notification-settings.step.3':
    'Kliknij „Powiadomienia” na pasku bocznym „Ustawień”. Pierwsza karta ma osobny wiersz dla każdego zdarzenia, a kolumna „W aplikacji” określa, co pokazuje dzwonek.',
  'help.guide.link-journal.result':
    'Na pasku kart podróży pojawia się karta „Dziennik”. Każdy, komu przyznałeś „Odczyt” lub „Edytuj”, może tam otworzyć dziennik, z aktualizacjami na żywo.',
  'help.guide.create-place.tip.4':
    'W wyszukiwarce działa też link skopiowany z Google Maps: wklej go, naciśnij Enter, a TREK odczyta z niego miejsce. Gdy formularz ma już lokalizację, „Miejsca w pobliżu tej pinezki”, czyli celownik obok wyszukiwarki, pokazuje, co jest w okolicy.',
  'help.guide.dawarich-stays.step.2':
    'Pobyty są pogrupowane według dni, każdy z godziną przyjazdu i wyjazdu; ikona wskaźnika oznacza pobyt, co do którego Dawarich nie miał pewności. Kliknij „Dodaj jako miejsce”, czyli pinezkę obok pobytu.',
  'help.guide.leave-stop-off-route.step.3':
    'Żeby znów uwzględnić przystanek w trasie, otwórz to samo menu i wybierz „Przywróć do trasy”.',
  'help.guide.move-booking-day.tip.1':
    'Wyblakłych wierszy w dniach pośrednich rezerwacji wielodniowej nie można przeciągać, podobnie jak pojedynczego odcinka lotu z przesiadkami.',
  'help.guide.place-image-from-file.step.2':
    'Kliknij okrągłe zdjęcie w nagłówku. Ponieważ miejsce ma zdjęcia, małe okno zapyta, skąd wziąć obraz.',
  'help.guide.place-own-hours.goal':
    'Wpisz na kartę sprawdzone przez siebie godziny, gdy pobrane są błędne lub ich brakuje.',
  'help.guide.place-own-hours.tip.2':
    'Numer telefonu i e-mail są widoczne jako pigułki w nagłówku karty. Kliknij jedną z nich, żeby otworzyć ją w aplikacji telefonu lub poczty.',
  'help.guide.edit-accommodation.tip.3':
    'Gdy w „Ustawieniach”, w sekcji „Wygląd”, włączone jest „Rozmyj kody rezerwacji”, numer potwierdzenia pozostaje rozmyty. Najedź na niego lub go kliknij, żeby go odczytać.',
  'help.guide.confirm-stay-booking.tip.1': 'Kliknij pigułkę ponownie, a rezerwacja wróci do stanu „Oczekujące”.',
  'help.guide.map-markers.tip.4':
    'Gdy włączone są „Kompaktowe znaczniki dla niezaplanowanych miejsc” (w „Ustawienia” > „Wygląd”, w sekcji „Podróże i mapa”), miejsca bez przypisanego dnia są małymi kropkami bez zdjęcia i oceny. Wybrane miejsce jest zawsze pokazywane w pełnej postaci.',
  'help.guide.tour-map-lines.step.1':
    'Każda wycieczka podróży jest na mapie linią w swoim kolorze, z pinezką w miejscu startu. Jeśli wybrałeś dla wycieczki kolor, linia go używa. W przeciwnym razie ma kolor swojej kategorii.',
  'help.guide.car-stops.step.6': 'Kliknij „Dodaj”.',
  'help.guide.transport-details.step.4':
    'Kliknij tytuł, żeby zmienić nazwę przejazdu bez otwierania formularza. Otworzy się „Zmień nazwę” z obecną nazwą: wpisz nową i kliknij „Zapisz”.',
  'help.guide.export-transports-csv.goal':
    'Wyeksportuj przejazdy z podróży w TREK do pliku CSV, np. do arkusza kalkulacyjnego, dla biura podróży albo do wydruku.',
  'help.guide.group-sort-bookings.result':
    'Rezerwacje są ułożone w wybranych sekcjach i kolejności, a ta przeglądarka zapamięta wybór na następny raz.',
  'help.guide.booking-on-map.step.1':
    'Kliknij kartę rezerwacji, która ma miejsce powiązane w polu „Miejsce / Aktywność” albo, przy noclegu, w polu „Nocleg”. Otworzą się jej szczegóły.',
  'help.guide.export-bookings-csv.title': 'Eksport rezerwacji do arkusza kalkulacyjnego',
  'help.guide.export-bookings-csv.tip.3':
    'Przycisk jest dostępny, gdy tylko na karcie pojawi się rezerwacja. Karta „Transport” eksportuje swoje wpisy w ten sam sposób.',
  'help.guide.arrange-packing-list.title': 'Własna kolejność na liście pakowania',
  'help.guide.count-packed-pieces.result':
    'Wiersz pokazuje, ile sztuk jest spakowanych, a gdy spakujesz ostatnią, przedmiot zostaje odhaczony.',
  'help.guide.expense-receipts.title': 'Dołączanie paragonu do wydatku',
  'help.guide.expense-receipts.tip.1':
    'W edytorze kliknięcie nazwy pliku na liście otwiera ten sam podgląd. Esc zamyka wtedy tylko podgląd, a nie wydatek.',
  'help.guide.files-sync-settings.step.5':
    '„Gdy zmieniły się obie strony” określa, która kopia zostaje, gdy dokument zmieniono w obu miejscach: „Zapytaj mnie”, „Zachowaj kopię z TREK-a” lub „Zachowaj kopię z magazynu”. „Synchronizuj automatycznie” pozwala TREK sprawdzać zmiany w tle; gdy ta opcja jest wyłączona, karta pokazuje „Wstrzymane”, a synchronizację uruchamia tylko „Synchronizuj teraz”. Każda zmiana zapisuje się od razu.',
  'help.guide.manage-notes.step.5':
    '„Usuń” najpierw pyta „Usunąć notatkę?”, bo notatka zostanie usunięta dla wszystkich uczestników, razem z plikami. Kliknij „Usuń”, żeby potwierdzić.',
  'help.guide.note-categories.step.3':
    'Kliknij nazwę kategorii, żeby ją zmienić. Wpisz nową nazwę i naciśnij Enter; Esc zachowuje starą.',
  'help.guide.roadtrip-reorder.step.2':
    'Żeby przenieść przystanek na inny dzień, upuść go na przystanku w karcie tego dnia. Podczas przeciągania dni z mniej niż dwoma przystankami pojawiają się na końcu osi jako przerywane karty, na które też możesz go upuścić.',
  'help.guide.roadtrip-corridor.tip.4':
    'Pod filtrem wybierz jeden przystanek dnia albo „Pośrodku między dwoma”, żeby zostawić tylko to, co leży w promieniu 25, 50 lub 100 km od tego punktu. Gdy na liście są ładowarki, „Dowolna wtyczka” i „Dowolna moc” zawężają je według złącza i mocy.',
  'help.guide.roadtrip-overnight.result':
    'Miejsce pojawia się na trasie jako nocleg tego dnia, a pobyt jest zarezerwowany w podróży jak każdy inny.',
  'help.guide.roadtrip-stop-fill.result':
    'Na tym przystanku bak jest napełniany do wybranego poziomu. Na tej podstawie wyliczany jest dalszy zasięg, łącznie z ewentualnym paskiem „Tu kończy się paliwo”.',
  'help.guide.roadtrip-bookings.step.4': 'Kliknij kartę, żeby otworzyć rezerwację.',
  'help.guide.roadtrip-google-import.goal':
    'Zamień trasę zaplanowaną w Google Maps w przystanki w jednym ze swoich dni.',
  'help.guide.roadtrip-google-import.tip.3':
    'Import wymaga połączenia z internetem i uprawnień do edycji zarówno miejsc, jak i dni.',
  'help.guide.roadtrip-hazards.tip.2':
    'DWD obejmuje Niemcy, a GDACS zgłasza katastrofy na całym świecie. Ostrzeżenie podane tylko jako punkt oznacza, że obszar zagrożenia jest nieznany.',
  'help.ctx.trip-tours.bullet.5':
    'W kolumnie dni wycieczka to wiersz, tak jak przystanek. Jeśli ma ustawiony „Początek”, pokazuje początek → koniec, przy czym koniec jest wyliczany z czasu wycieczki, a „Więcej opcji” zawiera „Edytuj”, „Usuń z dnia”, „Pomiń w trasie” i „Zapisz w kolekcji”.',
  'help.guide.tour-show-list.step.5': 'Kliknij „Miejsca” w tym samym przełączniku, żeby wrócić do listy miejsc.',
  'help.guide.tour-add-to-day.step.2':
    'Wybierz dzień. Menu wymienia wszystkie dni podróży z datą i tytułem; dzień, który już ma tę wycieczkę, jest wyszarzony.',
  'help.guide.tour-add-to-day.result':
    'Wycieczka jest widoczna pod swoim dniem, a jej linia jest na mapie częścią tego dnia.',
  'help.guide.tour-day-times.tip.2':
    'Dzień z jednym etapem wycieczki wielodniowej nie ma wyliczanej godziny zakończenia, bo czas wycieczki dotyczy całej trasy.',
  'help.guide.tour-remove-from-day.step.3':
    'Możesz też kliknąć nagłówek dnia, żeby go otworzyć, kliknąć wycieczkę na liście i kliknąć „Usuń z dnia” na dole jej karty.',
  'help.guide.tour-filter-list.step.3':
    'Jeśli lista zawiera różne wycieczki, możesz ją dalej zawęzić filtrami „Źródło” (TREK, „Import GPX”, wanderer), „Limit trasy” (T1 do T6) i „Typ” („Wędrówka piesza”, „Wycieczka rowerowa” itd.). Kliknij zaznaczoną wartość ponownie, żeby ją odznaczyć.',
  'help.guide.tour-hide-on-map.step.1':
    'Najedź na wycieczkę na liście i kliknij ikonę oka, która pojawi się po prawej stronie wiersza („Ukryj na mapie”).',
  'help.guide.tour-import-plan-tab.step.1':
    'Na karcie „Plan” kliknij „Wycieczki” w przełączniku u góry prawej kolumny.',
  'help.ctx.trip-tour-detail.bullet.1':
    'Kliknij wycieczkę na liście „Wycieczki” (najpierw przełącz prawą kolumnę z „Miejsca” na „Wycieczki”), jej wiersz w dniu albo jej linię na mapie, a nad mapą otworzy się jej karta. Gdy karta jest otwarta, nadal możesz korzystać z mapy.',
  'help.guide.tour-detail-read.step.2':
    'Nagłówek pokazuje nazwę wycieczki i jej podsumowanie w pigułkach: rodzaj wycieczki, źródło (jeśli została zaimportowana), planowany czas, dystans, podejście i zejście.',
  'help.guide.tour-detail-read.tip.3':
    'Niektóre wycieczki pokazują więcej: spacer po mieście swoje przystanki, spływ kontrole i wiatr, odbyta wycieczka „Rzeczywistą trasę”, a wycieczka powiązana z listą „Listę pakowania”.',
  'help.guide.tour-rename-colour.step.3':
    'Kliknij kolorową kropkę w rogu okrągłego kafelka wycieczki, „Kolor śladu”. Pod nagłówkiem otworzy się sekcja „Kolor śladu”.',
  'help.guide.tour-take-along.step.2':
    'Jeśli wycieczka ma stronę internetową, przycisk obok pokazuje nazwę serwisu (Komoot, AllTrails, Outdooractive lub Wanderer) albo „Strona internetowa” dla każdej innej. Otwiera stronę w nowej karcie.',
  'help.guide.tour-copy-keep.goal':
    'Utwórz wariant wycieczki w tej podróży albo zapisz ją na przyszłe podróże w jednej ze swoich kolekcji.',
  'help.guide.tour-copy-keep.tip.4':
    '„Kolekcja” jest dostępna tylko wtedy, gdy włączony jest dodatek „Kolekcje”. Listy, do której masz tylko dostęp do odczytu, nie można wybrać, a jeśli nie masz jeszcze żadnej listy, okno proponuje „Otwórz kolekcje”.',
  'help.guide.tour-packing-link.step.5':
    'Kliknij „Otwórz listę pakowania”, żeby odhaczać rzeczy. TREK przełączy się na kartę „Listy”, na listę pakowania.',
  'help.guide.tour-files.step.2': 'Wiersz pod spodem pokazuje teraz ich liczbę, a lista się rozwija.',
  'help.guide.tour-activity-link.step.2':
    'W polu „Odbyta dnia” sprawdź dzień, w którym przeszedłeś trasę. Wybierz „Bez dnia”, jeśli nie należy do żadnego dnia.',
  'help.guide.tour-activity-compare.title': 'Porównanie planu z rzeczywistością',
  'help.guide.tour-activity-compare.result': 'Na karcie i na mapie szybko porównasz przebieg dnia z planem.',
  'help.guide.tour-origin-check.tip.3':
    '„Brak połączenia z wanderer” oznacza, że twoje konto nie jest jeszcze połączone. Połącz je w „Ustawieniach”, w sekcji „Integracje”.',
  'help.ctx.trip-tour-planner.bullet.5':
    '„Szukaj miejsca lub adresu” u góry mapy przesuwa widok. Pigułka w lewym dolnym rogu przełącza mapy dostępne dla rodzaju wycieczki, np. Topo lub „Satelita”, i zawiera przełączniki otwartej wycieczki, np. „Ustawiaj punkty” i 3D.',
  'help.guide.tour-open-workspace.step.5':
    '„Szukaj miejsca lub adresu” u góry mapy przenosi widok do wybranego miejsca, żebyś mógł zacząć tam, gdzie ma być wycieczka.',
  'help.guide.tour-draw-route.goal': 'Ustaw punkty nowej wycieczki na mapie i pozwól TREK wyznaczyć trasę między nimi.',
  'help.guide.tour-draw-route.tip.2':
    'Mapa Topo lub „Turystyka” w pigułce mapy pokazuje ścieżki, więc łatwiej w nie trafić. Punkt zbyt daleko od drogi dostępnej dla danego rodzaju wycieczki dostaje komunikat zamiast trasy.',
  'help.guide.tour-type-profile.step.3':
    'Przy wycieczce rowerowej pod rodzajem trzeba wybrać „Profil”: „Turystyka”, „Szosa”, Gravel lub MTB. Wiersz pod spodem opisuje, jakie drogi profil preferuje.',
  'help.guide.tour-edit-points.step.2':
    'Kliknij wiersz w „Punktach trasy”, żeby zaznaczyć punkt. Jego pinezka zostanie wyróżniona na mapie.',
  'help.guide.tour-shaping-points.title': 'Zmiana trasy punktem kształtującym',
  'help.guide.tour-shaping-points.tip.3':
    'Na przejażdżce konnej kliknięcie linii nic nie dodaje, bo trasy nie wyznacza żaden router.',
  'help.guide.tour-loop-reverse.tip.2':
    'Usuń wiersz „Powrót do startu”, żeby znów była to wycieczka w jedną stronę. Odcinek narysowany ręcznie pozostaje taki również po odwróceniu kierunku.',
  'help.guide.tour-leg-by-hand.step.4':
    '„Przelicz ponownie następny odcinek” prosi router o ponowne wyznaczenie tylko tego jednego odcinka, bez zmiany pozostałych.',
  'help.guide.tour-trip-places.step.3':
    'Kliknij miejsce. Zostanie dodane jako nowy koniec wycieczki, a lista pozostanie otwarta, żebyś mógł wybrać kolejne.',
  'help.guide.tour-details-times.step.1':
    'Pole „Nazwa wycieczki” u góry lewego panelu zawiera nazwę. Przy nowej wycieczce szary tekst, np. „Wędrówka bez nazwy”, to tylko podpowiedź: wpisz własną nazwę.',
  'help.guide.tour-save.title': 'Zapisywanie wycieczki',
  'help.guide.tour-save.tip.3':
    '„Zapisz” nie działa też wtedy, gdy któreś pole ma nieprawidłową wartość, np. strona internetowa nie jest adresem. Sekcja „Szczegóły” otworzy się wtedy automatycznie i pokaże błąd.',
  'help.guide.tour-edit-saved.tip.1': '„Zapisz” pozostaje wyszarzone, dopóki nie zmienisz czegoś w wycieczce.',
  'help.guide.tour-summary-profile.step.3':
    'Przesuwaj kursor po „Profilu wysokościowym”. Zobaczysz dystans i wysokość w danym punkcie, a kropka zaznaczy to samo miejsce na mapie.',
  'help.guide.tour-list-manage.step.1':
    '„Podsumowanie podróży” jest nad listą. Po zwinięciu pokazuje liczbę wycieczek oraz ile z nich jest „Zaplanowane”, a ile „Niezaplanowane”. Strzałka po prawej rozwija wiersze dla każdego rodzaju z łącznym dystansem, podejściem, zejściem i czasem.',
  'help.guide.tour-list-manage.result':
    'Widzisz sumy dla wycieczek pokazanych przez filtr, a każda wycieczka jest przypisana do wybranego dnia.',
  'help.guide.tour-delete.result': 'Wycieczka znika z listy, z mapy i ze wszystkich dni.',
  'help.guide.tour-saved-elsewhere.tip.2':
    'Tak samo jest, gdy zmienisz wycieczkę na innym urządzeniu. Wycieczka, której nie zmieniałeś, po prostu wczytuje się ponownie, a informuje o tym uwaga.',
  'help.ctx.trip-tour-import.bullet.5':
    'Gdy wanderer jest połączony w „Ustawieniach”, w sekcji „Integracje”, obok „Zaplanuj nową wycieczkę” pojawia się przycisk wanderer, dopóki żadna wycieczka nie jest otwarta. Pokazuje twoje szlaki do zaimportowania.',
  'help.guide.tour-import-gpx.tip.1':
    'Możesz też przeciągnąć pliki z komputera na kartę „Wycieczki” i tam je upuścić. Otworzy się ten sam podgląd.',
  'help.guide.tour-view-import.step.1':
    'Na karcie „Wycieczki” kliknij w „Wycieczkach w tej podróży” wycieczkę z plakietką „Import GPX”.',
  'help.guide.tour-plan-from-import.goal':
    'Uzyskaj z nagranego śladu punkty trasy, które możesz przesuwać, i sprawdź, jak blisko śladu prowadzi nowa trasa.',
  'help.guide.tour-plan-from-import.tip.4':
    '„Przejażdżka konna” nie ma wersji do edycji: zostaje w takiej postaci, w jakiej ją przejechano.',
  'help.guide.tour-restore-recorded.tip.2':
    'Wycieczka utworzona przez „Zaplanuj jako nową wycieczkę” nie ma własnego nagranego śladu. Import, z którego powstała, nadal jest na liście.',
  'help.guide.tour-take-over.step.5': 'Jeśli chcesz, nadaj jej inną nazwę w polu „Nazwa w tej podróży”.',
  'help.guide.tour-import-wanderer.step.1':
    'Na karcie „Wycieczki”, gdy żadna wycieczka nie jest otwarta, kliknij wanderer obok „Zaplanuj nową wycieczkę”.',
  'help.guide.tour-import-wanderer.result':
    'Szlak jest teraz wycieczką w podróży i otwiera się na mapie jako „Wycieczka z wanderer”.',
  'help.guide.tour-map-layers.title': 'Wybór mapy dla wycieczki',
  'help.guide.tour-map-layers.tip.3':
    'Spływ i spacer po mieście mają do wyboru tylko „Mapa” i „Satelita”; bieg, wycieczka narciarska i przejażdżka konna mają „Mapa”, Topo i „Satelita”.',
  'help.guide.tour-along-search.result': 'Miejsca wzdłuż trasy są na liście i na mapie, gotowe do przejrzenia.',
  'help.guide.tour-along-add-stop.step.3':
    'Kliknij „Dodaj jako przystanek”. Plakietka obok to przybliżona długość objazdu, mierzona w linii prostej.',
  'help.guide.tour-3d-terrain.step.1':
    'Otwórz wycieczkę na karcie „Wycieczki” i kliknij 3D na końcu pigułki w lewym dolnym rogu. Mapa się przechyli i pokaże teren w 3D z narysowaną na nim trasą.',
  'help.guide.tour-3d-terrain.tip.3':
    'Ukształtowanie terenu wymaga połączenia z internetem: wysokości pochodzą z otwartych kafelków terenu Mapzen. Spływ jest rysowany własnym kolorem, bez nachyleń, bo woda jest płaska.',
  'help.guide.tour-3d-flyover.tip.1':
    'Podczas przelotu kręć kółkiem myszy, żeby przybliżyć lub oddalić widok; kamera pozostaje przy kropce. Mapy nie da się przeciągać, dopóki nie wstrzymasz przelotu.',
  'help.guide.tour-map-overlays.step.4':
    'Przy spływie pigułka oferuje zamiast tego „Znaki nawigacyjne”. Kliknij, żeby pokazać na wodzie boje, stawy i znaki portowe.',
  'help.ctx.trip-tour-stages.bullet.2':
    '„Zakończ etap tutaj” w menu „Więcej działań” przystanku kończy etap na tym przystanku. „Punkty trasy” pokazują wtedy nagłówek „Etap N” dla każdego etapu z jego dystansem i czasem, a przystanek kończący etap ma ikonę księżyca.',
  'help.guide.tour-multi-day.step.3':
    'Najedź na przystanek, na którym kończy się pierwszy dzień, kliknij „Więcej działań” i wybierz „Zakończ etap tutaj”.',
  'help.guide.tour-multi-day.result':
    'Jedna trasa podzielona na etapy, każdy z osobnymi parametrami. Kliknij „Zapisz”, żeby je zachować.',
  'help.guide.tour-stages-on-days.step.6':
    'Strzałka obok, „Otwórz ten etap w planerze”, otwiera wycieczkę w edytorze na tym etapie.',
  'help.ctx.trip-tour-hike.bullet.1':
    '„Rodzaj wycieczki” u góry edytora określa, jak wyznaczana jest trasa. „Wędrówka piesza” korzysta ze ścieżek do poziomu „Maksymalna trudność szlaku” ustawionego w „Szczegółach”; „Bieg” korzysta z dróg nadających się do biegania i wymaga podania „Planowanego tempa”.',
  'help.guide.tour-hike-plan.step.1':
    'Kliknij „Zaplanuj nową wycieczkę” u góry lewej kolumny. Edytor otworzy się jako „Nowa wycieczka”.',
  'help.guide.tour-hike-plan.tip.2':
    'Przy T4 i wyżej TREK najpierw zapyta „Włączyć trasy wysokogórskie?”. Potwierdź tylko wtedy, gdy trasa może prowadzić przez teren eksponowany lub nieoznakowany; pytanie pojawia się raz na sesję edycji.',
  'help.guide.tour-hike-trail-details.step.4':
    'Kliknij stopień trudności na liście, żeby na mapie zostały tylko odcinki o tym stopniu. Kliknij ponownie, żeby pokazać całą trasę.',
  'help.guide.tour-hike-round.step.1':
    'Przy otwartej wędrówce kliknij „Pętla od startu” w nagłówku karty „Punkty trasy”. Żeby zacząć od innego przystanku, otwórz jego „Więcej działań” i wybierz „Pętla stąd”.',
  'help.guide.tour-hike-round.tip.3':
    '„Szukaj ponownie” wraca do wyboru dystansu, a „Anuluj” zamyka kartę bez żadnych zmian.',
  'help.guide.tour-hike-compare-ways.tip.1':
    'Ta funkcja jest dostępna tylko dla wędrówek i tylko dla odcinka wyznaczonego przez router, a nie narysowanego ręcznie.',
  'help.guide.tour-ferrata-add.step.4':
    'W „Punktach trasy” odcinek między tymi dwoma punktami pokazuje nazwę, stopień trudności i długość ferraty.',
  'help.guide.tour-run-plan.goal':
    'Zaplanuj bieg po drogach nadających się do biegania i oblicz jego czas na podstawie swojego tempa.',
  'help.guide.tour-run-plan.tip.2':
    'Czas nie uwzględnia podbiegów, zbiegów ani trudności technicznej drogi: to wyłącznie dystans pomnożony przez tempo.',
  'help.guide.tour-run-ways.result': 'Jeszcze przed wyjściem wiesz, które fragmenty biegu nie prowadzą po asfalcie.',
  'help.ctx.trip-tour-walk.bullet.4':
    '„Wzdłuż trasy” wyszukuje atrakcje według „Motywu trasy” w określonej odległości od trasy, a „Dodaj jako przystanek” wstawia wybraną atrakcję do spaceru w wybranym miejscu.',
  'help.guide.tour-walk-plan.step.5':
    'Ustaw „Ważność” na „Zwykły”, „Opcjonalne” lub „Koniecznie”. Włącz „Chroniony” dla przystanku, który ma zostać na swoim miejscu, gdy później zostanie zaproponowana zmiana, a potem kliknij „Zapisz”.',
  'help.guide.tour-walk-sights.step.1':
    'Przy otwartym spacerze po mieście znajdź „Wzdłuż trasy” w lewej kolumnie i wybierz „Motyw trasy”: „Kultura i historia”, „Parki i widoki”, „Jedzenie i lokalne życie” lub „Po trochu wszystkiego”.',
  'help.guide.tour-walk-sights.result':
    'Atrakcja jest przystankiem spaceru, wstawionym do trasy między wybranymi przystankami.',
  'help.guide.tour-walk-day-times.tip.2':
    'Jeśli przystanek nie ma jeszcze czasu pobytu, godziny dotarcia do kolejnych przystanków są podawane jako najwcześniejsze możliwe.',
  'help.guide.tour-walk-google-import.step.3':
    'Sprawdź „Przystanki w linku”. Przystanek bez lokalizacji w linku jest oznaczony i pominięty.',
  'help.guide.tour-walk-check-off.step.1':
    'Na karcie „Plan” kliknij spacer po mieście w jego dniu. Jego karta otworzy się obok mapy.',
  'help.ctx.trip-tour-bike.title': 'Wycieczki rowerowe',
  'help.guide.tour-bike-profile.step.1':
    'Na karcie „Wycieczki” kliknij „Zaplanuj nową wycieczkę” u góry lewego panelu.',
  'help.guide.tour-bike-profile.tip.2':
    'Profil jest tylko wskazówką dla routera. Nie mówi, czy daną drogą da się przejechać: to, po czym prowadzi trasa, pokazuje karta „Nawierzchnia i drogi”.',
  'help.guide.tour-bike-surfaces.step.3':
    'W sekcji „Nawierzchnia” kliknij wiersz, np. „Szuter” albo „Grunt naturalny”. Jego odcinki zostaną wyróżnione na mapie. Kliknij wiersz ponownie, żeby usunąć wyróżnienie.',
  'help.guide.tour-bike-mtb-grades.goal': 'Sprawdź, jak trudne są szlaki na wycieczce MTB, zanim na nie wyruszysz.',
  'help.guide.tour-bike-mtb-grades.tip.4':
    'Jeśli zmienisz „Profil” z MTB na inny, sekcje ze stopniami trudności znikną. Trasa zostanie wtedy wyznaczona od nowa dla nowego profilu.',
  'help.guide.tour-ski-plan.title': 'Planowanie wycieczki narciarskiej i zimowej',
  'help.guide.tour-ski-plan.tip.1':
    'Dla „Biegowe” wybierz też „Technikę”: „Klasyczna”, „Łyżwowa” lub „Nieznana”. Komunikat pod polami informuje, czego jeszcze brakuje.',
  'help.guide.tour-ski-options.step.2':
    'Otwórz „Najtrudniejsze trasy” i wybierz najwyższy stopień trudności, po jakim chcesz jeździć, od „Początkujący” do „Ekspercka”. Domyślnie ustawiona jest „Średnia”.',
  'help.guide.tour-ski-fix-leg.title': 'Poprawianie odcinka narciarskiego, którego nie udało się zaplanować',
  'help.guide.tour-ski-fix-leg.tip.4':
    'Dopóki nie są zaplanowane wszystkie odcinki, karta „Trasa narciarska” informuje, że czasu na nartach jeszcze nie ma.',
  'help.guide.tour-ski-summary.tip.2':
    '„Czas na nartach” pozostaje „Nie wyliczono”, dopóki nie są zaplanowane wszystkie odcinki. Jeśli mimo to chcesz nadać wycieczce czas, wpisz łączny planowany czas w jej szczegółach.',
  'help.guide.tour-ski-pistes-layer.step.3':
    'Legenda pokazuje trasy zjazdowe według trudności, trasy biegowe, szlaki zimowe i rakietowe, tory saneczkowe oraz wyciągi. „Pełna legenda w OpenSnowMap” otwiera kompletną legendę.',
  'help.guide.tour-ski-import.step.2': 'W „Podglądzie importu” otwórz „Importuj jako” i wybierz „Narty i zima”.',
  'help.guide.tour-ski-import.result':
    'Ślad jest na liście „Wycieczki w tej podróży”, a dyscyplinę i technikę widać na jego karcie „Ślad narciarski”.',
  'help.ctx.trip-tour-paddle.bullet.6':
    'Wiersz „Wiosłowanie niesie ryzyko” na dole lewej kolumny otwiera „Bezpieczeństwo na wodzie”. Do wyboru są mapy „Mapa” i „Satelita”, a jako nakładka „Znaki nawigacyjne”.',
  'help.guide.tour-paddle-setup.step.6':
    '„Tempo wiosłowania” pokazuje na szaro prędkość proponowaną dla łodzi. Jeśli wpiszesz własną, pole pokaże „Własne tempo”; link pod nim, „Użyj sugerowanego”, przywraca prędkość łodzi.',
  'help.guide.tour-paddle-water-route.goal':
    'Niech TREK zaplanuje odcinek wzdłuż rzeki lub jeziora, a ty sprawdź, co oznaczają uwagi przy odcinku, którego nie udało się zaplanować.',
  'help.guide.tour-paddle-water-route.tip.3':
    'Uwagi pod zaplanowanym odcinkiem oznaczają bystrza ze stopniem trudności, „Przepust kajakowy” albo „Luka w danych mapy” połączoną linią prostą.',
  'help.guide.tour-paddle-portage.step.4':
    'W sekcji „Trasa” opcja „Podążaj ścieżką” prowadzi zmapowaną drogą, a „Linia prosta” wprost na przełaj. TREK sam szuka ścieżki i informuje, gdy nie ma takiej bez długiego objazdu.',
  'help.guide.tour-paddle-lock.step.1':
    'Najedź na przystanek przy śluzie i kliknij „Więcej działań”, czyli trzy kropki.',
  'help.guide.tour-paddle-time.title': 'Czas spływu: odczyt i korekta',
  'help.guide.tour-paddle-time.tip.2': 'Szacunek nie uwzględnia prądu ani wiatru.',
  'help.guide.tour-paddle-wind.step.4':
    'Otwórz „Co wiatr oznacza przy wiosłowaniu”, żeby dowiedzieć się, jak na łódź działają wiatr przeciwny, boczny, otwarte przeprawy i porywy.',
  'help.guide.tour-paddle-checklist.step.1':
    'Zapisz spływ, a potem znajdź „Listę kontrolną” w lewej kolumnie. Plakietka w jej nagłówku podsumowuje stan listy.',
  'help.guide.tour-paddle-checklist.tip.4':
    'Przeszkody pochodzą z danych OpenStreetMap dla regionów, które ma TREK. Tam, gdzie ich brakuje, karta o tym informuje, a jazy, śluzy i przenoski musisz sprawdzić sam.',
  'help.guide.tour-paddle-track-marks.step.4':
    'Kliknij ślad w „Wycieczkach w tej podróży”. Lewa kolumna pokaże go w takiej postaci, w jakiej go nagrano, z kartą „Przenoski i śluzy”.',
  'help.ctx.trip-tour-horse.title': 'Przejażdżki konne',
  'help.guide.tour-horse-plan.goal': 'Złóż przejażdżkę konną z odcinków oznakowanych tras konnych w widoku mapy.',
  'help.guide.tour-horse-plan.result':
    'Przejażdżka prowadzi wybranymi odcinkami, każdy z nazwą trasy, kropką dostępu i długością, a wycieczka jest widoczna na liście „Wycieczki w tej podróży”.',
  'help.guide.tour-horse-gap.step.1':
    'Gdy przejażdżka ma już odcinek, otwórz inną trasę i wybierz odcinek, który nie styka się z końcem przejażdżki. W sekcji „Połączenie z przejażdżką” komunikat pokaże, jak daleko od siebie leżą.',
  'help.guide.tour-horse-recorded.title': 'Zachowanie nagranej przejażdżki z pliku GPX',
  'help.guide.tour-horse-recorded.tip.2':
    'Plik bez danych o wysokości pokazuje „Brak wysokości w pliku” zamiast podejścia równego zero.',
  'help.guide.dateless-trip.tip.1':
    'Gdy już wiesz, kiedy jedziesz, otwórz formularz ołówkiem na karcie i wybierz daty. Zaplanowane dni zachowają swoją kolejność i dostaną daty po kolei.',
  'help.guide.trip-reminder.goal': 'Otrzymaj przypomnienie kilka dni przed wyjazdem.',
  'help.guide.upcoming-reservations.tip.2':
    '„Oczekujące” oznacza rezerwację, która nie została jeszcze potwierdzona. Anulowane rezerwacje i zarchiwizowane podróże nie są tu uwzględniane.',
  'help.guide.half-company-holiday.tip.1':
    'Urlop wpisany już na ten dzień zostaje skrócony do pół dnia. Kto wpisze ten dzień później, wykorzysta tylko 0,5 dnia.',
  'help.guide.edit-holiday-calendar.goal':
    'Zmień nazwę, kolor lub położenie dodanego kalendarza świąt albo ferii szkolnych lub go usuń.',
  'help.guide.person-color.title': 'Zmiana koloru osoby',
  'help.guide.answer-fusion-request.tip.1':
    'Zaproszenie czeka, dopóki na nie nie odpowiesz. Jeśli jest ich kilka, zobaczysz je po kolei.',
  'help.guide.log-for-partner.tip.1': '„Pół dnia” i „Odbiór” działają również dla wybranej osoby.',
  'help.guide.dissolve-fusion.tip.2': 'Jeśli chcesz tylko pokazać komuś swoje dni, udostępnij mu swój kalendarz.',
  'help.guide.country-details.tip.2':
    'Kliknij plakietkę „Miejsca”, aby zobaczyć wszystkie miejsca zaliczone do danego kraju, pogrupowane według podróży.',
  'help.guide.country-places.tip.2':
    'Plakietka pojawia się tylko wtedy, gdy kraj ma własne miejsca. Kraj zaznaczony wyłącznie ręcznie ich nie ma.',
  'help.guide.tour-activity-stats.goal':
    'Sprawdź dystans, przewyższenie i liczbę wycieczek ze wszystkich podróży w wybranym okresie i dla wybranego rodzaju, a wycieczkę, która się nie odbyła, wyłącz ze statystyk.',
  'help.guide.tour-activity-stats.tip.1':
    'Wycieczka jest liczona po zakończeniu jej ostatniego dnia. Wycieczka bez dnia lub tylko w dniach bez daty nigdy nie jest liczona. Aby się liczyła, przypisz ją do dnia z datą w jej podróży.',
  'help.guide.move-to-list.result':
    'Miejsca trafiają na drugą listę, a krótki komunikat informuje, ile z nich przeniesiono lub zduplikowano.',
  'help.guide.accept-list-invite.tip.1':
    'To, co możesz robić na liście, zależy od roli nadanej przez właściciela: Widz, Edytor lub Administrator.',
  'help.guide.tour-collection-add-to-trip.title': 'Dodawanie wycieczki z listy do podróży',
  'help.guide.tour-collection-add-to-trip.tip.3':
    'Aby zachować wycieczkę na liście, otwórz zapisaną wycieczkę w podróży i kliknij „Kolekcja” w jej stopce.',
  'help.guide.tour-collection-manage.tip.2': 'Ikonę kosza widzą tylko właściciel i administratorzy listy.',
  'help.guide.entry-draft.result':
    'Wpis zostaje na osi czasu z oznaczeniem „Szkic” i nie jest widoczny pod udostępnionym linkiem.',
  'help.guide.journey-map-layers.title': 'Wybór zawartości mapy dziennika',
  'help.guide.journey-keep-route.title': 'Zachowanie trasy nagranej danego dnia',
  'help.guide.journey-day-stays.title': 'Wpisy z postojów zapisanych przez Dawarich',
  'help.guide.journey-take-over-day.title': 'Przejęcie całego nagranego dnia',
  'help.guide.journey-take-over-day.result':
    'Dzień ma teraz po jednym szkicu na każdy postój lub połączoną grupę albo jedną relację z całego dnia, a jego postoje nie figurują już jako otwarte.',
  'help.guide.journey-auto-prepare.result':
    'W trakcie powiązanej podróży postoje z każdego dnia pojawiają się przy tym dniu, gotowe do użycia z „Przejmij dzień”.',
  'help.ctx.settings-about.title': 'O aplikacji',
  'help.guide.web-push-device.tip.3':
    'Powiadomienia push wymagają otwarcia TREK przez HTTPS. Jeśli powiadomienia są zablokowane, zezwól na nie w ustawieniach przeglądarki i spróbuj ponownie.',
  'help.guide.connect-airtrail.result':
    'Plakietka pokazuje „Połączono”, a zakładka „Transport” w podróży oferuje „Importuj z AirTrail”.',
  'help.guide.connect-dawarich.result':
    'Plakietka pokazuje „Połączono”, a planer podróży, dziennik i Atlas mogą korzystać z danych zapisanych przez Dawarich.',
  'help.guide.tour-connect-wanderer.result':
    'Plakietka pokazuje „Połączono”, a w zakładce „Wycieczki” możesz przeszukiwać swojego wanderer i importować z niego szlaki.',
  'help.guide.tour-wanderer-watch.result':
    'TREK sprawdza zaimportowane szlaki i informuje Cię, gdy któryś mógł się zmienić. Wycieczka zmienia się dopiero wtedy, gdy zaakceptujesz zmianę.',
  'help.guide.plugin-settings.step.1':
    'Otwórz „Wtyczki” na pasku bocznym ustawień. Pod nagłówkiem „Ustawienia wtyczek” każda wtyczka, która wymaga konfiguracji, ma kartę z polami: wypełnij je i kliknij „Zapisz”. Akcje na karcie uruchamiają się po potwierdzeniu.',
  'help.guide.profile.step.3': 'Kliknij „Zapisz profil” po prawej stronie stopki karty.',
  'help.guide.default-user-settings.title': 'Ustawienia startowe dla nowych użytkowników',
  'help.guide.own-routing-engine.tip.1':
    'Publiczne serwery OSRM przyjmują mniej więcej jedno zapytanie na sekundę. Na jeden dzień to wystarczy, ale przy podróży samochodem może działać zbyt wolno.',
  'help.guide.admin-passkeys.goal':
    'Umożliw logowanie odciskiem palca, rozpoznawaniem twarzy lub kodem PIN urządzenia.',
  'help.guide.rotate-jwt-secret.tip.2':
    'Aby wylogować tylko jedną osobę, nadaj jej „Nowe hasło” w „Edytuj użytkownika”. Zakończy to wyłącznie jej sesje.',
  'help.guide.notification-defaults.goal':
    'Ustal początkowe ustawienia powiadomień dla wszystkich użytkowników i całkowicie zablokuj wybrany kanał dla danego zdarzenia.',
  'help.ctx.notifications.summary':
    'Wszystkie powiadomienia, które TREK wyświetlił Ci w aplikacji, od najnowszych: ktoś zmienił rezerwację, w czacie podróży jest nowa wiadomość, ktoś udostępnił Ci kalendarz. Dzwonek w prawym górnym rogu pokazuje dziesięć najnowszych, a ta strona wszystkie.',
  'help.guide.read-notifications.step.1':
    'Kliknij dzwonek w prawym górnym rogu. Czerwona liczba na nim to liczba nieprzeczytanych powiadomień.',
  'help.guide.filter-notifications.step.1': 'Kliknij dzwonek w prawym górnym rogu.',
  'help.guide.mark-notifications-read.step.2':
    'Kliknij „Oznacz wszystkie jako przeczytane” u góry, aby oznaczyć wszystkie powiadomienia naraz.',
  'help.guide.delete-notifications.tip.1':
    'Usunięte powiadomienie znika tylko u Ciebie. Rezerwacja, wiadomość czy udostępnienie, którego dotyczyło, pozostaje bez zmian.',
  'help.guide.notification-settings.tip.1':
    'Kłódka w komórce oznacza, że administrator wyłączył to zdarzenie dla wszystkich.',
  'help.guide.add-guest.tip.3':
    'Tylko właściciel podróży może dodawać gości, zmieniać ich nazwy i ich usuwać. Gościa, który za coś zapłacił, nie da się usunąć, dopóki nie zmienisz płacącego lub nie usuniesz płatności.',
  'help.guide.link-journal.tip.1':
    'Możesz powiązać tylko dzienniki, których jesteś właścicielem. Dziennika, w którym możesz tylko pisać, nie powiążesz.',
  'help.ctx.trip-places.bullet.7':
    'Ikona zaznaczenia obok wyszukiwarki włącza tryb zaznaczania. Paskiem na dole kolumny możesz kilku wierszom naraz nadać nową kategorię, dodać je do kolekcji, oznaczyć jako odwiedzone lub je usunąć.',
  'help.guide.filter-places.step.5':
    'Gdy podróż obejmuje więcej niż jeden kraj lub region, ikona globusa zawęża listę do jednego kraju lub do jednego regionu w nim, a przy każdym widać liczbę miejsc. „Wyczyść filtr” przywraca „Wszystkie kraje”.',
  'help.guide.import-places-file.tip.3':
    'Gdy „Wycieczki” są włączone, co jest ustawieniem domyślnym, plik importujesz przez „Wycieczki” u góry kolumny, przyciskiem „Importuj GPX lub KML”, a jego linie stają się wycieczkami. Pinezek z pliku nie importuje się w ten sposób, bo wycieczki składają się tylko z linii.',
  'help.guide.dawarich-stays.step.3':
    'Sprawdź pola „Nazwa”, „Przyjazd” i „Wyjazd”, wybierz „Dzień” lub zostaw „Jeszcze bez przypisanego dnia”, w razie potrzeby dodaj „Notatki” i kliknij „Dodaj miejsce”.',
  'help.guide.leave-stop-off-route.result':
    'Przystanek nadal należy do dnia i jest w PDF. Dopóki jest oznaczony jako „Poza trasą”, trasa biegnie prosto od poprzedniego przystanku do następnego.',
  'help.guide.move-booking-day.tip.2':
    'W obrębie swojego dnia rezerwacja z godziną zawsze wraca w miejsce wynikające z tej godziny.',
  'help.guide.place-image-from-file.step.3':
    'W sekcji „Z załączonych plików” kliknij wybrane zdjęcie. Przycisk „Prześlij z urządzenia” nad nią pozwala zamiast tego wybrać nowe zdjęcie z komputera.',
  'help.guide.place-own-hours.step.1':
    'Otwórz miejsce i kliknij „Edytuj” w prawym dolnym rogu karty. Otworzy się formularz miejsca.',
  'help.guide.place-own-hours.tip.3':
    'Kliknij „Usuń godziny otwarcia”, a potem „Aktualizuj”, aby na karcie znów wyświetlały się automatycznie znalezione godziny.',
  'help.guide.confirm-stay-booking.title': 'Potwierdzanie rezerwacji noclegu',
  'help.guide.confirm-stay-booking.tip.2':
    'Ta sama pigułka działa w każdej rezerwacji, również w rezerwacjach w sekcji „Rezerwacje” danego dnia.',
  'help.guide.map-lock.tip.2':
    'Ta przeglądarka zapamiętuje blokadę osobno dla każdej podróży. Po otwarciu podróży mapa i tak raz przybliża się do jej obszaru, więc nigdy nie otworzy się na pustym fragmencie.',
  'help.guide.tour-map-lines.step.2':
    'Kliknij linię lub pinezkę na jej początku. Karta wycieczki otworzy się w dolnej części mapy, a jej linia zostanie pogrubiona i obwiedziona na biało, dzięki czemu wyróżni się spośród innych. Karta zamyka się krzyżykiem w jej nagłówku.',
  'help.guide.car-stops.title': 'Planowanie przejazdu z przystankami po drodze',
  'help.guide.car-stops.result':
    'Przejazd jest kartą w zakładce „Transport” i wierszem w swoim dniu, a jego linia na mapie biegnie od miejsca odbioru przez wszystkie przystanki po kolei aż do miejsca zwrotu.',
  'help.guide.transport-details.step.5':
    '„Na mapie” na dole szczegółów pokazuje linię przejazdu i otwiera plan w jego dniu. „Edytuj” po prawej otwiera pełny formularz, a ikona kosza obok usuwa przejazd po potwierdzeniu.',
  'help.guide.export-transports-csv.step.1':
    'Jeśli potrzebujesz tylko części listy, najpierw ją zawęź. Liczą się wyszukiwanie, „Filtruj” i sortowanie w „Opcje widoku”: plik zawiera to, co widać w zakładce, w tej samej kolejności.',
  'help.guide.group-sort-bookings.tip.1':
    '„Karty” i „Lista” mają osobne grupowanie: „Karty” zaczynają od statusu, „Lista” od dnia. Kropka przy „Opcje widoku” oznacza, że coś różni się od ustawień domyślnych, a „Resetuj widok” na dole panelu je przywraca.',
  'help.guide.booking-on-map.step.2': 'Kliknij „Na mapie” na dole szczegółów.',
  'help.guide.export-bookings-csv.goal':
    'Wyeksportuj rezerwacje podróży do pliku CSV, który otworzysz w Excelu, Numbers lub innym arkuszu kalkulacyjnym.',
  'help.guide.arrange-packing-list.goal':
    'Przestawiaj całe listy i pojedyncze przedmioty albo wyświetl każdą listę alfabetycznie.',
  'help.guide.check-off-packing.tip.4':
    'Jeśli przedmiot ma ilość większą niż jeden, możesz też odhaczać spakowane sztuki pojedynczo. Zobacz „Pakowanie kilku sztuk jednej rzeczy”.',
  'help.guide.count-packed-pieces.tip.1':
    'Zaznaczenie pola oznacza wszystkie sztuki jako spakowane, a odznaczenie cofa to dla wszystkich.',
  'help.guide.expense-receipts.goal':
    'Przechowuj paragon lub fakturę razem z wydatkiem, którego dotyczy, i otwieraj ją z poziomu zestawienia.',
  'help.guide.expense-receipts.tip.2':
    'Ikona kosza obok paragonu odłącza go od wydatku po zapisaniu. Sam plik zostaje w zakładce „Pliku”. Aby usunąć go całkowicie, usuń go tam.',
  'help.guide.files-sync.tip.4':
    'Jeśli na karcie widać żółty komunikat z przyciskiem „Połącz ponownie”, magazyn nie akceptuje już zapisanych danych logowania. Kliknij „Połącz ponownie”, podaj nowe hasło aplikacji lub token, a synchronizacja zostanie wznowiona.',
  'help.guide.files-sync-settings.result':
    'Od następnego uruchomienia podróż synchronizuje się tylko w wybranym kierunku, a usunięcia i sprzeczne zmiany są obsługiwane według ustawionych reguł.',
  'help.guide.manage-notes.result':
    'Notatka znika z karty „Notatki” u wszystkich członków jednocześnie. Notatka, którą tylko przypięto lub zmieniono, zostaje, a inni widzą ją w takiej postaci, w jakiej ją zostawiono.',
  'help.guide.note-categories.step.4':
    'Kolorowe kropki w wierszu ustawiają kolor kategorii: indygo, czerwony, bursztynowy, szmaragdowy, niebieski lub fioletowy. Tutaj „Nocleg” zmienia kolor na bursztynowy.',
  'help.guide.roadtrip-reorder.step.3':
    'Na klawiaturze ustaw fokus na przystanku i naciśnij Alt ze strzałką w górę lub w dół, aby przesunąć go o jedną pozycję w obrębie dnia.',
  'help.guide.roadtrip-overnight.title': 'Nocleg na trasie',
  'help.guide.roadtrip-overnight.tip.1':
    'Nocleg trwa do następnego dnia. Aby ustawić inne daty, zmień rezerwację: daty zmienisz w sekcji „Dnia”, razem z resztą pobytu.',
  'help.guide.roadtrip-stop-fill.tip.1':
    'Plakietkę mają tylko przystanki, na których Twój samochód może uzupełnić energię: stacje paliw przy „Paliwo”, stacje ładowania przy „Elektryk”, a jedne i drugie przy „Oba”.',
  'help.guide.roadtrip-bookings.result':
    'Każdy zarezerwowany przejazd pojawia się w trasie w miejscu, w którym się odbywa, a trasa przed nim i po nim prowadzi do jego terminali i z nich.',
  'help.guide.roadtrip-google-import.step.1':
    'Kliknij trzy kropki u góry sekcji „Na trasie” i wybierz „Importuj trasę z Google Maps”.',
  'help.guide.roadtrip-hazards.title': 'Bieżące ostrzeżenia na mapie',
  'help.guide.roadtrip-hazards.tip.3':
    'Dane są odświeżane co dziesięć minut i wymagają połączenia z internetem. Podobnie jak pozostałe ustawienia jazdy, przełącznik jest zapisywany dla podróży.',
  'help.ctx.trip-tours.bullet.6':
    'Trasę zmienisz i wycieczkę usuniesz w zakładce „Wycieczki”, w sekcji „Wycieczki w tej podróży”.',
  'help.guide.tour-show-list.tip.1':
    'Kliknij linię wycieczki na mapie, a lista zaznaczy tę wycieczkę i przewinie się do niej.',
  'help.guide.tour-add-to-day.step.3':
    'Komunikat „Dodano do dnia 10” potwierdza operację, wiersz dostaje plakietkę dnia, a dzień w lewej kolumnie pokazuje wycieczkę z jej czasem, dystansem i przewyższeniem.',
  'help.guide.tour-day-times.title': 'Godzina startu wycieczki w danym dniu',
  'help.guide.tour-day-times.tip.3':
    '„Pomiń w trasie” w tym samym menu zostawia wycieczkę w dniu, ale nie uwzględnia jej w trasie dnia na mapie. „Przywróć do trasy” cofa tę zmianę.',
  'help.guide.tour-remove-from-day.tip.1':
    'Wycieczkę wielodniową usuwasz z dni pojedynczo, bo każdy dzień ma własny etap.',
  'help.guide.tour-filter-list.step.4':
    'Zamknij menu. Na przycisku widać teraz status, liczbę pozostałych wycieczek i +1 za każdy kolejny ustawiony filtr.',
  'help.guide.tour-hide-on-map.step.2':
    'Linia wycieczki znika z mapy. Jej wiersz zostaje na liście, przygaszony, z przekreślonym okiem („Pokaż na mapie”). Kliknij je, aby znów pokazać linię.',
  'help.guide.tour-import-plan-tab.step.2':
    'Kliknij „Importuj GPX lub KML” u góry listy i wybierz pliki (GPX, KML lub KMZ).',
  'help.ctx.trip-tour-detail.bullet.2':
    'W nagłówku jest okrągły kafelek wycieczki, jej nazwa z ołówkiem do zmiany nazwy, kolorowa kropka w kolorze linii oraz pigułki z rodzajem, źródłem, planowanym czasem, dystansem, przewyższeniem w górę i w dół. Krzyżyk po prawej zamyka kartę, tak samo jak klawisz Escape.',
  'help.guide.tour-detail-read.step.3':
    'Najedź kursorem na czas, aby zobaczyć, z czego się składa: czas w ruchu, przerwy i planowany czas łączny.',
  'help.guide.tour-detail-read.tip.4':
    'Karta nie zmienia trasy. Aby przesunąć punkt lub wyznaczyć odcinek na nowo, otwórz zakładkę „Wycieczki” i kliknij wycieczkę w sekcji „Wycieczki w tej podróży”.',
  'help.guide.tour-rename-colour.step.4':
    'Wybierz kolor. „Kolor automatyczny”, pierwsze pole, przywraca domyślny kolor linii, a „Wybierz własny kolor”, ostatnie pole, pozwala wybrać dowolny kolor. Linia na mapie i pasek na liście „Wycieczki” zmieniają się od razu.',
  'help.guide.tour-take-along.step.3':
    'Kliknij GPX, aby pobrać zapisaną wycieczkę jako plik GPX: całą trasę z dostępnymi danymi o wysokości, gotową do aplikacji nawigacyjnej lub urządzenia GPS.',
  'help.guide.tour-copy-keep.step.1':
    'Otwórz kartę wycieczki i kliknij „Kopiuj” na dole. TREK utworzy nową, niezależną wycieczkę bez przypisanych dni, a oryginał pozostanie bez zmian.',
  'help.guide.tour-copy-keep.result':
    'Podróż ma drugą wycieczkę, którą możesz dowolnie zmieniać, a w kolekcji jest osobna kopia, gotowa do dodania do innej podróży.',
  'help.guide.tour-packing-link.tip.1':
    'To tylko powiązanie. Nic nie jest kopiowane ani przenoszone, a przedmioty zostają w „Listy”. Odhacz tam przedmiot, a wycieczka od razu to pokaże.',
  'help.guide.tour-files.step.3': 'Kliknij plik, aby go otworzyć.',
  'help.guide.tour-activity-link.step.3':
    'Wybierz nagranie w polu „Ślad” lub kliknij „Importuj GPX”, aby dodać nowy plik.',
  'help.guide.tour-activity-compare.goal':
    'Sprawdź, gdzie rzeczywisty ślad odbiega od planu, i zmień lub odłącz nagranie.',
  'help.guide.tour-origin-check.title': 'Skąd pochodzi wycieczka',
  'help.guide.tour-origin-check.result': 'Wiesz, skąd i kiedy pochodzi wycieczka oraz czy od tego czasu się zmieniła.',
  'help.ctx.trip-tour-planner.bullet.6':
    'Niezapisany szkic nie przepada: po ponownym otwarciu zakładki „Wycieczki” zostaje przywrócony z oznaczeniem „Przywrócono niezapisany szkic”. „Wróć do wycieczek” i „Odrzuć” pytają o potwierdzenie, zanim odrzucą zmiany.',
  'help.guide.tour-open-workspace.step.6':
    'Pigułka w lewym dolnym rogu przełącza mapę, początkowo między „Mapa” a „Satelita”. Przy otwartej wycieczce oferuje mapy dla jej rodzaju, np. Topo lub „Turystyka”, oraz przełączniki, np. „Ustawiaj punkty” i 3D.',
  'help.guide.tour-draw-route.step.1':
    'Kliknij „Zaplanuj nową wycieczkę” u góry lewego panelu. Panel zmienia się w „Nowa wycieczka”, domyślnie wędrówkę pieszą, chyba że wybierzesz inny rodzaj.',
  'help.guide.tour-draw-route.tip.3':
    'Jeśli szkic ma niezapisane zmiany, „Zaplanuj nową wycieczkę” w menu „Dodaj trasę” najpierw zapyta: „Rozpocząć nową wycieczkę?”, z opcją „Odrzuć i zacznij”.',
  'help.guide.tour-type-profile.step.4':
    'Trasa zostaje wyznaczona na nowo dla wybranego profilu, a „Podsumowanie wycieczki” po prawej pokazuje jej dystans i czas.',
  'help.guide.tour-edit-points.step.3':
    'Aby zmienić kolejność, najedź kursorem na wiersz i przeciągnij go za uchwyt, który pojawi się przy jego lewej krawędzi.',
  'help.guide.tour-shaping-points.goal': 'Przesuń trasę na inną ścieżkę bez dodawania przystanku.',
  'help.guide.tour-shaping-points.result':
    'Trasa biegnie tam, dokąd ją przeciągnięto, a numeracja przystanków się nie zmienia.',
  'help.guide.tour-loop-reverse.tip.3':
    'Przy wędrówce pieszej obok znajdziesz „Pętla od startu”, która wyszukuje pętle o wybranej długości.',
  'help.guide.tour-leg-by-hand.tip.1':
    'Odcinka narysowanego ręcznie nie sprawdził żaden algorytm wyznaczania tras: może przecinać wodę, teren prywatny lub urwisko.',
  'help.guide.tour-trip-places.step.4':
    'Pod nazwą w jego wierszu widać „Miejsce podróży”. „Odłącz od miejsca” w „Więcej działań” zachowuje punkt, ale usuwa powiązanie.',
  'help.guide.tour-details-times.step.2':
    'W sekcji „Szczegóły” wpisz „Opis” i, jeśli jest, dodaj „Strona internetowa”.',
  'help.guide.tour-save.goal': 'Zapisz narysowaną wycieczkę w podróży.',
  'help.guide.tour-save.result': 'Wycieczka jest zapisana w podróży i gotowa do przypisania do dnia.',
  'help.guide.tour-edit-saved.tip.2':
    'Zaimportowany ślad GPX lub KML otwiera się jako „Wycieczka GPX” tylko do podglądu. „Zaplanuj wersję do edycji” tworzy z niego wycieczkę, którą możesz zmieniać.',
  'help.guide.tour-summary-profile.step.4':
    '„Zwiń profil wysokościowy”, czyli strzałka obok tytułu, ukrywa profil. Kliknij ją ponownie, aby go pokazać.',
  'help.guide.tour-list-manage.step.2':
    'Najedź kursorem na wycieczkę i kliknij okrągły plus w jej wierszu („Dodaj do dnia”), aby zobaczyć dni podróży.',
  'help.guide.tour-delete.title': 'Usuwanie wycieczki',
  'help.guide.tour-saved-elsewhere.title': 'Gdy wycieczkę zapisano w innym miejscu',
  'help.guide.tour-saved-elsewhere.result': 'Żadne zmiany nie przepadną, chyba że ktoś sam zdecyduje się je odrzucić.',
  'help.guide.tour-import-gpx.title': 'Import pliku GPX, KML lub KMZ jako wycieczki',
  'help.guide.tour-import-gpx.tip.2':
    'Każdy ślad lub trasa w pliku staje się osobną wycieczką. Ślady nigdy nie są łączone.',
  'help.guide.tour-view-import.step.2':
    'Lewa kolumna pokazuje ją jako „Wycieczka GPX”: „Podsumowanie wycieczki” z dystansem, wysokościami i nagranym czasem, a pod nim profil wysokościowy. Na mapie widać jej linię.',
  'help.guide.tour-plan-from-import.step.1':
    'Otwórz zaimportowaną wycieczkę w zakładce „Wycieczki”. Na karcie „Wersja do edycji” po lewej kliknij „Zaplanuj wersję do edycji”.',
  'help.guide.tour-plan-from-import.result':
    'Wycieczka ma teraz punkty trasy, które możesz przeciągać, a w polu „Pochodzenie” widnieje „Przeplanowano, nagrany ślad zachowany”.',
  'help.guide.tour-restore-recorded.result': 'Wycieczka znów jest „Wycieczka GPX” i pokazuje nagraną linię.',
  'help.guide.tour-take-over.step.6': 'Kliknij „Przejmij”.',
  'help.guide.tour-import-wanderer.step.2':
    'Wpisz frazę w polu „Szukaj szlaków”. „Szukaj w tym obszarze mapy” pokazuje tylko szlaki w widocznej części mapy.',
  'help.ctx.trip-tour-map.title': 'Mapa wycieczki',
  'help.guide.tour-map-layers.goal':
    'Planuj na mapie najlepiej dopasowanej do rodzaju wycieczki: z poziomicami do oceny podejść, z oznakowanymi szlakami lub trasami rowerowymi albo na zdjęciach lotniczych.',
  'help.guide.tour-along-search.title': 'Wyszukiwanie miejsc wzdłuż wycieczki',
  'help.guide.tour-along-search.tip.1':
    'Po zmianie trasy, rodzajów miejsc lub odległości przycisk „Szukaj ponownie” zostaje wyróżniony z informacją, że lista dotyczy trasy sprzed zmiany. Kliknij go, aby odświeżyć listę.',
  'help.guide.tour-along-add-stop.step.4':
    'Trasa zostaje wyznaczona na nowo przez to miejsce, a „Wzdłuż trasy” pokazuje, o ile wzrósł dystans i czas wycieczki. „Cofnij” w tym samym wierszu usuwa przystanek.',
  'help.guide.tour-3d-terrain.step.2':
    'Trasa jest pokolorowana według nachylenia. Kliknij „Nachylenie” w dolnym rzędzie, aby pokazać ją w kolorze wycieczki, i kliknij ponownie, aby wrócić do nachylenia.',
  'help.guide.tour-3d-flyover.title': 'Przelot nad wycieczką',
  'help.guide.tour-3d-flyover.tip.2':
    'Przelot rusza dopiero wtedy, gdy wczyta się teren wzdłuż całej trasy, więc nie zatrzymuje się w połowie, by doczytać dane mapy. Najedź kursorem na pierścień, aby zobaczyć postęp wczytywania.',
  'help.guide.tour-map-overlays.result':
    'Na mapie widać trasy narciarskie lub znaki nawigacyjne, a legenda je objaśnia.',
  'help.ctx.trip-tour-stages.bullet.3':
    '„Podsumowanie wycieczki” wymienia w sekcji „Etapy” każdy etap, od przystanku początkowego do końcowego. Kliknięcie etapu zaznacza jego ostatni przystanek i to miejsce na profilu wysokościowym.',
  'help.guide.tour-multi-day.step.4':
    '„Punkty trasy” dzielą się teraz na etap 1 i etap 2, każdy z własnym dystansem i czasem. Przystanek kończący etap ma ikonę księżyca.',
  'help.guide.tour-stages-on-days.title': 'Rozkładanie wycieczki wielodniowej na dni podróży',
  'help.guide.tour-stages-on-days.tip.1':
    'Jeśli podróż kończy się przed ostatnim etapem, opcja informuje, który etap jako ostatni mieści się w podróży. Kolejne etapy nie dostają dnia.',
  'help.ctx.trip-tour-hike.bullet.2':
    '„Punkty trasy” wymieniają przystanki po kolei. „Dodaj punkt” jest włączone od początku, więc kliknięcie mapy ustawia kolejny punkt. „Miejsca podróży” obok pozwalają zrobić przystanek ze schroniska lub hotelu z podróży.',
  'help.guide.tour-hike-plan.step.2':
    'Otwórz „Rodzaj wycieczki” i wybierz „Wędrówka piesza”: pieszo, w ramach ustawionego poziomu trudności.',
  'help.guide.tour-hike-plan.tip.3':
    '„Wybór trasy” pod poziomem trudności ustala preferencje: „Unikaj stromych podejść”, „Unikaj schodów” i „Unikaj promów”. Jeśli nie ma innej drogi, trasa i tak tamtędy poprowadzi.',
  'help.guide.tour-hike-trail-details.step.5':
    'Kliknij „Nawierzchnia”, aby zobaczyć tę samą trasę według podłoża, od asfaltu po grunt naturalny i skałę.',
  'help.guide.tour-hike-round.step.2':
    'Nad mapą otwiera się karta „Wędrówka w pętli”. Sprawdź punkt startowy w polu „Od” i wpisz żądany „Dystans”. Pigułka obok pokazuje możliwy zakres długości pętli.',
  'help.guide.tour-hike-compare-ways.title': 'Porównanie wariantów jednego odcinka wędrówki',
  'help.guide.tour-hike-compare-ways.tip.2':
    'Jeśli algorytm nie zna innej drogi, karta o tym informuje. Jeśli nie może poprowadzić trasy wybraną drogą, odcinek pozostaje bez zmian, a karta Ci to zgłasza.',
  'help.guide.tour-ferrata-add.step.5':
    '„Podsumowanie wycieczki” po prawej pokazuje plakietkę „Ferrata” z jej stopniem trudności, a w nagłówku edytora pojawia się ostrzeżenie „Trasa prowadzi przez via ferratę”.',
  'help.guide.tour-run-plan.step.1': 'Kliknij „Zaplanuj nową wycieczkę”, otwórz „Rodzaj wycieczki” i wybierz „Bieg”.',
  'help.guide.tour-run-plan.tip.3': 'Jeśli dystanse są w milach, tempo też jest podawane na milę.',
  'help.guide.tour-run-ways.tip.1': 'Nic tutaj nie zmienia trasy biegu ani jego czasu.',
  'help.ctx.trip-tour-walk.bullet.5':
    '„Dodaj trasę” w sekcji „Wycieczki w tej podróży” importuje trasę pieszą udostępnioną z Google Maps. Na zakładce „Plan” spacer otwarty ze swojego dnia pozwala odhaczać przystanki w tym dniu.',
  'help.guide.tour-walk-plan.step.6':
    '„Podsumowanie wycieczki” po prawej pokazuje „Szac. czas marszu”, „Postoje” i „Zaplanowane”, czyli sumę obu. Kliknij „Zapisz” na dole lewej kolumny, aby zachować spacer.',
  'help.guide.tour-walk-sights.step.2':
    'Motyw wypełnia sekcję „Czego szukać”. Rozwiń ją, aby włączać lub wyłączać rodzaje miejsc, i w polu „W tej odległości od trasy” wybierz zasięg wyszukiwania.',
  'help.guide.tour-walk-day-times.title': 'Godziny dotarcia i otwarcia w danym dniu',
  'help.guide.tour-walk-day-times.tip.3':
    'Godziny otwarcia pochodzą z OpenStreetMap lub z miejsca podróży, do którego należy przystanek, a pigułka obok wskazuje źródło. Sprawdź je przed wyjściem.',
  'help.guide.tour-walk-google-import.step.4':
    'Kliknij „Wczytaj jako spacer”. TREK sam wyznaczy drogę pieszą między przystankami. Kliknij „Zapisz”, aby zachować spacer.',
  'help.guide.tour-walk-check-off.step.2':
    'Przewiń do sekcji „Przystanki trasy”. Przy każdym przystanku widać, jak długo tam zostajesz, a jeśli spacer ma godzinę startu, także o której dotrzesz.',
  'help.ctx.trip-tour-bike.summary':
    'Wycieczka rowerowa otwarta w edytorze w zakładce „Wycieczki”: profil, dla którego wyznaczono trasę, czas jazdy, nawierzchnie na trasie, a przy wycieczce MTB także skala trudności szlaków.',
  'help.guide.tour-bike-profile.step.2': 'Otwórz pole „Rodzaj wycieczki” i wybierz „Wycieczka rowerowa”.',
  'help.guide.tour-bike-profile.tip.3':
    'Jeśli w pobliżu punktu nie ma drogi dla rowerów, panel pokazuje komunikat „Żadna droga dla rowerów nie dociera do punktu N”. Przesuń punkt albo otwórz „Więcej działań” przy poprzednim punkcie i wybierz „Narysuj następny odcinek ręcznie”.',
  'help.guide.tour-bike-surfaces.step.4':
    'W sekcji „Rodzaj drogi” kliknij wiersz, np. „Droga polna lub leśna” albo „Droga z ruchem”, aby zobaczyć, gdzie trasa nią biegnie.',
  'help.guide.tour-bike-mtb-grades.step.1':
    'Otwórz wycieczkę rowerową w edytorze i sprawdź, czy „Profil” jest ustawiony na MTB. Skala trudności szlaków jest odczytywana tylko w tym profilu.',
  'help.ctx.trip-tour-ski.title': 'Wycieczki narciarskie i zimowe',
  'help.guide.tour-ski-plan.goal':
    'Zaplanuj dzień na stoku, pętlę biegową, skitour lub wędrówkę w rakietach śnieżnych po zmapowanych trasach, wyciągach i szlakach.',
  'help.guide.tour-ski-plan.tip.2':
    'Ikona informacji obok „Dyscyplina” wyjaśnia, co TREK robi ze skiturami. Ani tam, ani nigdzie indziej w tym miejscu nie ma informacji o śniegu, lawinach ani o tym, czy trasy, wyciągi i szlaki są otwarte.',
  'help.guide.tour-ski-options.step.3':
    'W sekcji „Preferuj” wybierz „Najszybsza”, „Najwięcej jazdy” lub „Najłatwiej”. W sekcji „Tempo” wybierz „Spokojne”, „Normalnie” lub „Sportowe”: od tego zależy czas, jaki algorytm przypisuje każdemu zjazdowi.',
  'help.guide.tour-ski-fix-leg.goal': 'Wyznacz czerwony odcinek jednym kliknięciem albo poprowadź go w linii prostej.',
  'help.guide.tour-ski-fix-leg.result':
    'Żaden odcinek nie jest już czerwony: każdy biegnie trasami narciarskimi lub prosto między swoimi punktami.',
  'help.guide.tour-ski-summary.tip.3':
    'Zapisana wycieczka otwiera się w zapisanej postaci. Przesuń punkt lub zmień opcję, aby wyznaczyć ją ponownie na aktualnych danych o trasach.',
  'help.guide.tour-ski-pistes-layer.tip.1':
    'Jeśli przełącznik pozostaje wyszarzony z napisem „Przybliż mapę, aby zobaczyć trasy narciarskie”, przybliż mapę na ośrodek narciarski.',
  'help.guide.tour-ski-import.step.3':
    'Wybierz „Dyscyplina”, a przy „Biegowe” także „Technika”. Dopóki tego nie zrobisz, okno pokazuje komunikat „Wybierz dyscyplinę, aby zaimportować ślad jako narciarski”.',
  'help.ctx.trip-tour-paddle.title': 'Spływy',
  'help.guide.tour-paddle-setup.title': 'Planowanie spływu',
  'help.guide.tour-paddle-setup.step.7':
    'Sprawdź, czy „Dodaj punkt” jest włączone, i klikaj mapę: najpierw miejsce wodowania, potem punkty po drodze i miejsce wyjścia z wody.',
  'help.guide.tour-paddle-water-route.step.1':
    'Odcinek narysowany ręcznie ma pod swoim punktem oznaczenie „Narysowane ręcznie, nie wyznaczone” i swoją długość. TREK zachowuje linię dokładnie tak, jak ją narysowano.',
  'help.guide.tour-paddle-water-route.tip.4':
    'Nie można zapisać wycieczki, dopóki któryś odcinek nie jest wyznaczony. Najpierw wyznacz go po wodzie lub narysuj ręcznie.',
  'help.guide.tour-paddle-portage.step.5':
    'W polu „Wyjście i wodowanie” wpisz, ile minut potrzebujesz na wyjście z wody, rozładunek i ponowne wodowanie. Jeśli zostawisz pole puste, TREK przyjmie 10 minut.',
  'help.guide.tour-paddle-lock.step.2':
    'Wybierz „Śluza w tym punkcie”. Pod punktem pojawi się karta śluzy z oznaczeniem „Nie podano czasu”.',
  'help.guide.tour-paddle-time.goal':
    'Zobacz, jak sumują się czas na wodzie, przenoski, śluzy i przerwy, i ustaw własne wartości.',
  'help.guide.tour-paddle-time.tip.3':
    'Przerwy i własny planowany czas łączny ustawisz w sekcji „Szczegóły”. Jeśli go podasz, karta pokaże „Twój planowany czas łączny” obok szacunku.',
  'help.guide.tour-paddle-wind.tip.1':
    'Prognoza jest dostępna tylko na najbliższe 16 dni. Dla dalszego dnia widać, od kiedy pojawi się prognoza, a dla dnia, który już minął, informację, że minął.',
  'help.guide.tour-paddle-checklist.step.2':
    'Wiersz poniżej informuje, jak aktualne są dane: „Stan OSM” dotyczy OpenStreetMap, „Pobrano” to moment odczytu przez TREK, a „Dane o przeszkodach” pojawia się tam, gdzie dane nie obejmują całej trasy.',
  'help.guide.tour-paddle-checklist.tip.5':
    'Lista kontrolna nie jest zatwierdzeniem pod względem bezpieczeństwa ani prawnym. Twoja decyzja nie znosi zakazu ani terenu prywatnego zapisanego w OpenStreetMap.',
  'help.guide.tour-paddle-track-marks.step.5':
    'Kliknij „Przenoska”, a potem kliknij na linii miejsce wyjścia z wody i miejsce ponownego wodowania.',
  'help.ctx.trip-tour-horse.summary':
    'Trasa konna nigdy nie jest wyznaczana automatycznie. Składa się z odcinków oznakowanych szlaków konnych znanych OpenStreetMap, połączonych fragmentami narysowanymi ręcznie, albo zostaje zachowana dokładnie tak, jak ją nagrano.',
  'help.guide.tour-horse-plan.step.1':
    'Ustaw mapę tak, aby był widoczny obszar, po którym chcesz jeździć, a potem kliknij „Zaplanuj nową wycieczkę” u góry lewej kolumny.',
  'help.guide.tour-horse-plan.tip.1':
    'Szlak konny nie oznacza zgody na jazdę nim. „Dostęp dla koni” pokazuje tylko to, co oznaczono w OpenStreetMap. Zawsze stosuj się do oznakowania w terenie.',
  'help.guide.tour-horse-gap.step.2':
    'Włącz „Połącz odcinkiem ręcznym”. Luka zostaje połączona linią prostą bez sprawdzania.',
  'help.guide.tour-horse-recorded.goal':
    'Zaimportuj przejażdżkę nagraną urządzeniem GPS lub w aplikacji i zachowaj ją dokładnie w takiej postaci.',
  'help.guide.tour-horse-recorded.tip.3':
    'Możesz też upuścić plik w dowolnym miejscu zakładki „Wycieczki”, aby otworzyć ten sam podgląd.',
  'help.guide.create-trip.tip.3':
    'W sekcji „Uczestnicy podróży” możesz dodać osoby, które mają już tu konto. Zostaną członkami podróży od razu po jej utworzeniu.',
  'help.guide.trip-reminder.step.1':
    'Kliknij ołówek na karcie podróży. Przy nowej podróży ta sama sekcja jest w formularzu „Nowa podróż”.',
  'help.guide.company-holidays.tip.2':
    'Całodniowy urlop firmowy usuwa urlop wpisany już na ten dzień, więc nikt nie wykorzystuje na niego swojego wymiaru.',
  'help.guide.half-company-holiday.tip.2':
    'Kliknij dzień ponownie z tymi samymi ustawieniami, aby go odznaczyć, albo z wyłączonym „Pół dnia”, aby zmienić go w całodniowy urlop firmowy.',
  'help.guide.edit-holiday-calendar.step.1':
    'Otwórz „Ustawienia” i znajdź kalendarz w sekcji „Święta państwowe” lub „Ferie szkolne”.',
  'help.guide.person-color.goal': 'Nadaj sobie lub osobie, z którą planujesz, kolor łatwiejszy do odróżnienia.',
  'help.guide.answer-fusion-request.tip.2':
    'Każde z Was może później rozłączyć kalendarze, a Wasze wpisy zostaną zachowane.',
  'help.guide.log-for-partner.tip.2':
    'Ta osoba od razu widzi zmianę, a jej wiersz „Wymiar” natychmiast się aktualizuje.',
  'help.guide.country-places.title': 'Wszystkie miejsca w danym kraju',
  'help.guide.tour-activity-stats.step.1':
    'W panelu na dole mapy otwórz zakładkę „Wycieczki” obok „Statystyki” i „Lista marzeń”.',
  'help.guide.tour-activity-stats.tip.2':
    'Powiąż ślad, którym faktycznie przeszedłeś trasę, za pomocą „Dodaj rzeczywistą trasę” w szczegółach wycieczki, a jego nagrane wartości zastąpią tu planowane. Wycieczka zaplanowana na kilka dni liczy się raz.',
  'help.ctx.collections.bullet.7':
    'Zachowane wycieczki: wycieczki zachowane z podróży są pierwszymi wierszami listy, z poziomem trudności, rodzajem, podróżą, z której pochodzą, i parametrami. „Dodaj do podróży” tworzy z wybranej nową wycieczkę, a ikona kosza usuwa ją z listy.',
  'help.guide.move-to-list.title': 'Przenoszenie lub duplikowanie miejsc na inną listę',
  'help.guide.copy-to-trip.tip.2':
    'Miejsca, które już są w podróży, zostaną pominięte, a TREK pokaże, ile ich pominięto.',
  'help.guide.accept-list-invite.tip.2':
    'Kliknij „Udostępniona” u góry listy, aby zobaczyć jej członków. Tam też kliknij „Opuść listę”, jeśli chcesz z niej wyjść.',
  'help.guide.tour-collection-add-to-trip.goal':
    'Utwórz w jednej ze swoich podróży nową wycieczkę na podstawie wycieczki zapisanej na liście, z punktami trasy lub bez nich.',
  'help.guide.tour-collection-add-to-trip.result':
    'Okno potwierdza, że wycieczka należy teraz do tej podróży. „Otwórz podróż” przenosi Cię do niej, a „Zamknij” zostawia Cię w „Kolekcjach”.',
  'help.guide.tour-collection-manage.tip.3':
    'Zachowane wycieczki są widoczne tylko na swojej liście, a nie w „Wszystkie zapisane”.',
  'help.guide.search-journey.step.3':
    'Kliknij dzień, aby do niego przewinąć, albo jego strzałkę, aby zobaczyć listę wpisów z tego dnia i wybrać jeden.',
  'help.guide.journey-map-layers.goal':
    'Zobacz różnicę między planem a tym, co wydarzyło się naprawdę, i włączaj lub wyłączaj warstwy.',
  'help.guide.journey-keep-route.goal':
    'Dodaj rzeczywistą trasę danego dnia z Dawarich do mapy dziennika i zachowaj ją tam.',
  'help.guide.journey-day-stays.goal': 'Zamieniaj postoje zapisane przez Dawarich we wpisy, jeden po drugim.',
  'help.guide.journey-take-over-day.goal':
    'Zamień postoje z danego dnia w szkice wpisów lub jedną relację z dnia za jednym razem.',
  'help.guide.journey-auto-prepare.title': 'Automatyczne przygotowanie nagranych dni',
  'help.guide.photo-location.title': 'Lokalizacja wpisów według miejsca zrobienia zdjęć',
  'help.ctx.settings-about.summary':
    'Czym jest TREK, jaką wersję ma ten serwer i gdzie znaleźć projekt: dokumentację, miejsce zgłaszania błędów i sposoby wsparcia projektu.',
  'help.guide.startup.tip.2': 'Jeśli zakładka startowa należy do wyłączonego dodatku, zamiast niej otworzy się plan.',
  'help.guide.web-push-device.title': 'Powiadomienia push na tym urządzeniu',
  'help.guide.connect-airtrail.tip.1':
    'Karta jest widoczna tylko wtedy, gdy administrator ma włączony dodatek AirTrail.',
  'help.guide.connect-dawarich.tip.1':
    'TREK tylko proponuje wpisy, miejsca i kraje. Nic nie jest dodawane bez Twojego potwierdzenia i nic nie jest zapisywane z powrotem w Dawarich.',
  'help.guide.tour-connect-wanderer.tip.1':
    'Karta jest widoczna tylko wtedy, gdy administrator zezwala na wanderer w ustawieniach „Wycieczek”.',
  'help.guide.tour-wanderer-watch.tip.1':
    'Podpowiedź nigdy nie zmienia wycieczki. Co faktycznie się zmieniło, pokazuje sprawdzenie źródła wycieczki.',
  'help.guide.api-keys.tip.3':
    'Przesyłaj klucz w nagłówku Authorization: Bearer lub X-API-Key do /api/v1. Jedno konto może mieć maksymalnie 10 kluczy.',
  'help.guide.plugin-settings.step.2':
    '„Aktywność wtyczek” pokazuje wszystkie działania wykonane przez wtyczki w Twoim imieniu, od najnowszych. „Odśwież” wczytuje najnowsze.',
  'help.ctx.admin-github.bullet.3':
    'O aplikacji: Ko-fi, Buy Me a Coffee, Discord, „Zgłoś błąd”, „Zaproponuj funkcję” i Wiki.',
  'help.guide.default-user-settings.goal':
    'Zapewnij każdemu kontu sensowne jednostki, motyw i walutę, bez konieczności otwierania ustawień.',
  'help.guide.default-map.step.3':
    'Każde pole zapisuje się, gdy je opuścisz. Link „przywróć” obok nazwy pola przywraca domyślną wartość TREK.',
  'help.guide.own-routing-engine.tip.2':
    'Jeśli ustawisz tylko własny silnik tras, publiczna Valhalla również nie będzie używana. Link „przywróć” obok pola znów je czyści.',
  'help.guide.admin-passkeys.step.1':
    'W zakładce „Ustawienia”, w sekcji „Logowanie kluczem dostępu”, włącz „Włącz logowanie kluczem dostępu”.',
  'help.guide.storage-backends.step.4':
    'Sekcja „Zdrowie” u góry pokazuje nieudane zapisy do celu kopii lustrzanej. Komunikat „Nie odnotowano żadnych błędów replik” oznacza, że wszystko działa.',
  'help.guide.channels-instance.tip.3':
    'Web Push wymaga HTTPS. Na iPhonie i iPadzie trzeba najpierw dodać TREK do ekranu początkowego.',
  'help.guide.notification-defaults.step.1':
    'W zakładce „Powiadomienia” przewiń na dół do sekcji „Ustawienia domyślne dla użytkowników”. Każdy wiersz to zdarzenie, a każda kolumna to kanał.',
  'help.ctx.notifications.bullet.1':
    'Dzwonek w prawym górnym rogu pokazuje liczbę nieprzeczytanych powiadomień. Kliknij go, aby zobaczyć dziesięć najnowszych, a przyciskiem „Pokaż wszystkie” na dole przejdziesz na tę stronę.',
  'help.guide.read-notifications.step.2':
    'Panel pokazuje dziesięć najnowszych powiadomień. Każde mówi, kto, co i gdzie zrobił, a nieprzeczytane mają podświetlone tło.',
  'help.guide.filter-notifications.step.2': 'Na dole panelu kliknij „Pokaż wszystkie”.',
  'help.guide.mark-notifications-read.tip.1':
    'Otwarcie powiadomienia jego przyciskiem również oznacza je jako przeczytane.',
  'help.guide.delete-notifications.tip.2':
    'Usuniętego powiadomienia nie da się przywrócić. Jeśli chcesz ukryć powiadomienie, ale je zachować, oznacz je jako przeczytane i użyj filtra „Nieprzeczytane”.',
  'help.guide.notification-settings.tip.2':
    'Nie ma ustawień dla poszczególnych podróży: jeden przełącznik działa we wszystkich Twoich podróżach.',
  'help.guide.link-journal.title': 'Powiązanie dziennika z podróżą',
  'help.guide.link-journal.tip.2':
    'Od tej chwili osoby, którym dasz dostęp, zobaczą dziennik także na swojej liście w „Dzienniku podróży”.',
  'help.ctx.trip-places.bullet.8':
    'Gdy Dawarich jest połączony, „Z Dawarich” u góry listy pokazuje postoje zapisane przez Dawarich w trakcie podróży. „Dodaj jako miejsce” zamienia postój w miejsce, a „To nie jest miejsce, w którym byłem” usuwa go z listy.',
  'help.guide.dawarich-stays.step.4':
    'Jeśli postój nie był prawdziwą wizytą, kliknij „To nie jest miejsce, w którym byłem”, czyli x obok niego, aby go usunąć. „Pokaż … już załatwione” na dole listy pokazuje dodane lub usunięte postoje. „Przywróć” wraca usunięty postój na listę.',
  'help.guide.leave-stop-off-route.tip.1':
    'Tę opcję ma tylko przystanek ze współrzędnymi, a ustawienie dotyczy wyłącznie tego dnia: to samo miejsce w innym dniu nadal jest uwzględniane w trasie.',
  'help.guide.move-booking-day.title': 'Przenoszenie rezerwacji na inny dzień',
  'help.guide.place-image-from-file.step.4':
    'Zdjęcie jest teraz obrazem miejsca. Kliknij mały czerwony krzyżyk w jego rogu, aby je usunąć.',
  'help.guide.place-own-hours.step.2': 'Pod polem „Strona internetowa” uzupełnij „Telefon” i „E-mail”, jeśli je znasz.',
  'help.guide.add-accommodation.tip.4':
    'Szybszy sposób: plus w nagłówku dnia z podpowiedzią „Dodaj do dnia” ma opcję „Dodaj zakwaterowanie”. Otwiera dzień z już otwartym tym formularzem.',
  'help.guide.confirm-stay-booking.goal':
    'Oznacz rezerwację hotelu powiązaną z noclegiem jako potwierdzoną, bezpośrednio z poziomu dnia.',
  'help.guide.map-whole-trip.tip.4':
    'To, czy widać całą podróż, jest zapisywane osobno dla każdej podróży na Twoim koncie, więc w innej przeglądarce podróż otworzy się tak samo.',
  'help.guide.tour-map-lines.step.3':
    'Otwórz w kolumnie dni dzień, do którego przypisana jest wycieczka, a stanie się ona częścią trasy dnia: trasa prowadzi do jej początku i biegnie dalej od jej końca.',
  'help.guide.car-stops.goal':
    'Ustal dla wynajętego lub własnego samochodu miejsce odbioru, zwrotu i postoje po drodze.',
  'help.guide.car-stops.tip.1':
    'Nie ma osobnego rodzaju dla wynajmu: zarówno wynajęty, jak i własny samochód to „Samochód”.',
  'help.guide.transport-details.result':
    'Plan jest otwarty na dniu przejazdu, jego linia jest widoczna na mapie, a ikona trasy w jego wierszu jest włączona.',
  'help.guide.export-transports-csv.step.2':
    'Kliknij ikonę arkusza za „Opcje widoku”, z podpowiedzią „Eksportuj jako arkusz kalkulacyjny (CSV)”.',
  'help.guide.group-sort-bookings.title': 'Grupowanie i sortowanie rezerwacji',
  'help.guide.group-sort-bookings.tip.2':
    'W widoku „Oś czasu” ten sam przycisk zawiera opcje „Osobny pas dla każdego rodzaju” i „Pokaż drugą zakładkę”.',
  'help.guide.booking-on-map.result':
    'Szczegóły się zamykają, a zakładka „Plan” otwiera się na dniu rezerwacji z jej miejscem zaznaczonym na mapie.',
  'help.guide.export-bookings-csv.step.1':
    'Aby wyeksportować tylko część zakładki, najpierw zawęź ją za pomocą „Szukaj” lub „Filtruj”. Plik zawiera dokładnie to, co widać w zakładce.',
  'help.guide.import-booking-file.tip.4':
    'Odczytanie potwierdzenia wymaga połączenia z internetem. W trybie offline „Importuj” o tym informuje. Spróbuj ponownie, gdy TREK znów będzie online.',
  'help.guide.arrange-packing-list.step.1':
    'Chwyć uchwyt na lewym końcu nagłówka listy, przed kolorową kropką, i upuść listę na inną kartę. Obramowanie w kolorze akcentu wskazuje kartę docelową, a lista zajmuje jej miejsce u wszystkich uczestników podróży.',
  'help.guide.count-packed-pieces.title': 'Pakowanie kilku sztuk jednej rzeczy',
  'help.guide.count-packed-pieces.tip.2':
    'Gdy włączona jest „Kontrola bagażu”, „Spakowane” na karcie „Torby” liczy tylko sztuki już odliczone.',
  'help.guide.packing-bags.tip.4':
    'Waga torby niesionej przez kilka osób jest dzielona po równo między nie w sekcji „Na osobę”. Taka waga jest podkreślona kropkami, a po najechaniu na nią kursorem pojawia się wyjaśnienie.',
  'help.guide.expense-receipts.step.1':
    'Kliknij ołówek obok wiersza wydatku. Otworzy się edytor wydatku z sekcją „Paragony i faktury” u dołu.',
  'help.guide.expense-receipts.tip.3':
    'Załączanie wymaga połączenia z internetem i uprawnień do przesyłania plików, bo paragon jest zapisywany jako jeden z plików podróży.',
  'help.guide.files-sync-settings.title': 'Kierunek synchronizacji dokumentów',
  'help.guide.files-sync-settings.tip.1':
    'Jeden kierunek zawsze zostaje włączony: kliknięcie jedynego włączonego kierunku nic nie zmienia.',
  'help.guide.manage-notes.title': 'Czytanie, przypinanie i edytowanie notatek',
  'help.guide.manage-notes.tip.1':
    '„Rozwiń” jest w menu tylko wtedy, gdy notatka zawiera tekst. Członek, który nie może edytować w „Współpracy”, widzi tylko „Rozwiń”.',
  'help.guide.note-categories.step.5':
    'Kliknij „Zapisz”. Wszystkie notatki w kategorii, której zmieniono nazwę lub kolor, zmieniają się od razu u wszystkich członków. „Anuluj” odrzuca zmiany.',
  'help.guide.trip-chat.tip.5':
    'Czat najpierw pokazuje najnowsze wiadomości. „Załaduj starsze wiadomości” u góry czatu wczytuje wcześniejsze.',
  'help.guide.roadtrip-reorder.result':
    'Przystanki są w ustalonej kolejności, a dystans, czas jazdy i godziny przyjazdu w każdym zmienionym dniu zostają przeliczone.',
  'help.guide.roadtrip-overnight.goal': 'Znajdź nocleg po drodze i dodaj go do przejazdu jako rezerwację.',
  'help.guide.roadtrip-overnight.tip.2':
    'Gdy przełączasz zarezerwowany nocleg z powrotem na „Postój” przez „Edytuj” na jego karcie, najpierw pojawi się pytanie „Usunąć nocleg?”. „Zamień na postój” usuwa nocleg wraz z rezerwacją i powiązanymi wydatkami, ale zostawia przystanek na trasie.',
  'help.guide.roadtrip-stop-fill.tip.2':
    'Jeśli wybierzesz wartość, którą przystanek już ma, przystanek wróci do Twojej wartości domyślnej.',
  'help.guide.roadtrip-bookings.tip.1':
    'Czas na terminalu jest ustawiany wcześniej niż w rozkładzie, z zapasem na odprawę: godzinę przy locie lub rejsie, pół godziny przy promie, dziesięć minut przy pociągu lub autobusie.',
  'help.guide.roadtrip-google-import.step.2': 'Wklej link do trasy udostępnionej z Google Maps i kliknij „Podgląd”.',
  'help.guide.roadtrip-hazards.goal':
    'Zobacz na mapie ostrzeżenia pogodowe i alerty o klęskach żywiołowych w pobliżu trasy przejazdu.',
  'help.ctx.trip-tours.title': 'Wycieczki w planie',
  'help.guide.tour-show-list.title': 'Wyświetlanie wycieczek podróży w planie',
  'help.guide.tour-show-list.tip.2':
    'Nie ma jeszcze wycieczek? „Importuj GPX lub KML” u góry listy importuje plik, a „Zaplanuj nową wycieczkę” w zakładce „Wycieczki” tworzy nową.',
  'help.guide.tour-add-to-day.step.4':
    'Możesz też przeciągnąć wiersz z listy i upuścić go na dzień w lewej kolumnie. Jeśli upuścisz go między dwoma przystankami, trafi właśnie tam.',
  'help.guide.tour-day-times.goal': 'Sprawdź, kiedy kończy się wycieczka i czy nie nakłada się na kolejne punkty dnia.',
  'help.guide.tour-day-times.tip.4':
    '„Zapisz w kolekcji” w tym samym menu zachowuje wycieczkę wraz z trasą w kolekcji, tak jak przycisk „Kolekcja” na karcie.',
  'help.guide.tour-remove-from-day.tip.2':
    'W tych menu ani na karcie nie ma opcji „Usuń”. Wycieczkę usuwa się w zakładce „Wycieczki” ikoną kosza w jej wierszu w sekcji „Wycieczki w tej podróży”.',
  'help.guide.tour-filter-list.tip.1':
    '„Limit trasy” to najwyższy poziom trudności dopuszczony przy planowaniu trasy, a nie trudność zmierzona na szlaku.',
  'help.guide.tour-hide-on-map.step.3':
    'Gdy jakaś wycieczka jest ukryta, nad listą widać komunikat „Ukryte na mapie” z ich liczbą. „Pokaż wszystkie” przywraca naraz wszystkie wycieczki.',
  'help.guide.tour-import-plan-tab.step.3':
    '„Podgląd importu” pokazuje każdy ślad, zanim cokolwiek zostanie zapisane. W polu „Importuj jako” wybierz rodzaj („Wędrówka piesza”, „Wycieczka rowerowa” itd.) i kliknij „Importuj 1 wycieczkę”.',
  'help.ctx.trip-tour-detail.bullet.3':
    'Niżej są „Dni podróży” z kafelkiem dla każdego dnia, do którego przypisano wycieczkę, parametry z profilem wysokościowym, a dalej, jeśli dotyczą: przystanki spaceru po mieście, kontrole i wiatr przy spływie, „Rzeczywista trasa”, „Lista pakowania”, „Opis”, „Notatki”, „Pochodzenie” i „Pliku”.',
  'help.guide.tour-detail-read.step.4':
    '„Dni podróży” pokazują kafelek z datą dla każdego dnia, do którego przypisano wycieczkę. Komunikat, że wycieczka nie jest jeszcze w żadnym dniu podróży, oznacza, że jest wciąż niezaplanowana.',
  'help.guide.tour-detail-read.tip.5':
    'Na telefonie karta otwiera się jako panel wysuwany od dołu, do przeglądania i zabrania wycieczki ze sobą.',
  'help.guide.tour-rename-colour.tip.1':
    'Nazwa i kolor należą do podróży, więc widzą je wszyscy uczestnicy. Aby ukryć wycieczkę tylko na swojej mapie, bez zmian u innych, użyj ikony oka na liście „Wycieczki”.',
  'help.guide.tour-take-along.tip.1':
    'Na urządzeniu, które obsługuje udostępnianie plików, obok GPX pojawia się „Udostępnij”, który wysyła ten sam plik bezpośrednio do innej aplikacji.',
  'help.guide.tour-copy-keep.step.2':
    'Kopia otwiera się od razu, z nazwą oryginału i dopiskiem (kopia). Kliknij ołówek, aby nadać jej własną nazwę.',
  'help.guide.tour-packing-link.title': 'Powiązanie wycieczki z listą pakowania',
  'help.guide.tour-packing-link.tip.2':
    '„Zmień” w nagłówku sekcji wiąże wycieczkę z inną listą. „Usuń link” w tym oknie usuwa powiązanie, a lista pozostaje bez zmian.',
  'help.guide.tour-files.tip.1': 'Te pliki są też plikami podróży, więc widać je również w zakładce „Pliku”.',
  'help.guide.tour-activity-link.step.4': 'Sprawdź zmierzone wartości w sekcji „Rzeczywiste” i kliknij „Podłącz”.',
  'help.guide.tour-activity-compare.step.1':
    'Otwórz kartę wycieczki. „Plan i rzeczywistość” zestawia „Dystans”, „Suma podejść”, „Suma zejść” i „Czas z przerwami” z planu z wartościami ze śladu, wraz z kolumną „Różnica”.',
  'help.guide.tour-origin-check.goal':
    'Sprawdź, czy wycieczkę narysowano w TREK, czy zaimportowano, z jakiego pliku i czy od tego czasu się zmieniła.',
  'help.ctx.trip-tour-planner.title': 'Wycieczki',
  'help.guide.tour-open-workspace.title': 'Jak poruszać się po zakładce „Wycieczki”',
  'help.guide.tour-open-workspace.step.7':
    'Kliknij wycieczkę w prawym panelu. Wycieczka zaplanowana w TREK otwiera się w edytorze. Zaimportowany ślad otwiera się bez zmian jako „Wycieczka GPX”, tylko do podglądu.',
  'help.guide.tour-draw-route.step.2':
    'Wpisz miejsce startu w polu „Szukaj miejsca lub adresu” i wybierz wynik. Mapa przesunie się w to miejsce.',
  'help.guide.tour-draw-route.tip.4':
    'Niezapisany szkic nie przepada. Po ponownym otwarciu zakładki „Wycieczki” w podróży zostanie przywrócony z oznaczeniem „Przywrócono niezapisany szkic”.',
  'help.guide.tour-type-profile.tip.1':
    'Zmiana rodzaju to jeden krok w historii: „Cofnij zmianę punktu” w nagłówku panelu przywraca poprzedni rodzaj i jego trasę.',
  'help.guide.tour-edit-points.step.4':
    'Możesz też otworzyć „Więcej działań” (trzy kropki) w wierszu i wybrać „Przesuń punkt w górę” lub „Przesuń punkt w dół”.',
  'help.guide.tour-shaping-points.step.1':
    'Kliknij narysowaną trasę na mapie w miejscu, w którym ma biec inaczej. Pojawi się tam mała kropka: punkt kształtujący.',
  'help.guide.tour-loop-reverse.title': 'Pętla lub odwrócenie kierunku wycieczki',
  'help.guide.tour-loop-reverse.result':
    'Pętla kończąca się w punkcie startu albo ta sama wycieczka w przeciwnym kierunku.',
  'help.guide.tour-leg-by-hand.tip.2':
    'Przy punkcie, do którego nie prowadzi żadna ścieżka, pojawia się komunikat z „Pokaż punkt” i jego numerem. Przesuń punkt na ścieżkę lub narysuj odcinek do niego ręcznie.',
  'help.guide.tour-trip-places.tip.1':
    'Miejsce, które już jest w wycieczce, ma oznaczenie „W trasie” i nie można go wybrać drugi raz.',
  'help.guide.tour-details-times.step.3': 'Wpisz „Przerwy”, np. 0:45. Zostaną doliczone do szacowanego czasu.',
  'help.guide.tour-save.step.1':
    'Wpisz nazwę w polu „Nazwa wycieczki”. Bez niej przycisk „Zapisz” pozostaje nieaktywny.',
  'help.guide.tour-edit-saved.title': 'Zmiana zapisanej wycieczki',
  'help.guide.tour-edit-saved.tip.3':
    '„Pobierz GPX” i „Zachowaj w kolekcji” w nagłówku panelu działają po zapisaniu zmian.',
  'help.guide.tour-summary-profile.tip.1': 'Kliknij tytuł karty, aby zwinąć całe podsumowanie.',
  'help.guide.tour-list-manage.step.3':
    'Wybierz dzień. Wycieczka zostanie dodana do tego dnia, a jej wiersz pokaże ten dzień.',
  'help.guide.tour-delete.goal': 'Trwale usuń wycieczkę z podróży.',
  'help.guide.tour-saved-elsewhere.goal':
    'Zdecyduj, co zrobić, gdy ktoś inny zapisał wycieczkę w trakcie Twoich zmian.',
  'help.ctx.trip-tour-import.title': 'Import wycieczek',
  'help.guide.tour-import-gpx.goal':
    'Zamień ślad z zegarka GPS, aplikacji lub Google Earth w wycieczkę podróży i sprawdź go, zanim cokolwiek zostanie zapisane.',
  'help.guide.tour-import-gpx.tip.3':
    'Ślad, który już jest w podróży, jest wyszarzony z oznaczeniem „Już jest w podróży” i zostanie pominięty.',
  'help.guide.tour-view-import.step.3': '„Wróć do wycieczek”, czyli strzałka w lewym górnym rogu, znów go zamyka.',
  'help.guide.tour-plan-from-import.step.2':
    'TREK pobiera ze śladu punkty kontrolne i ponownie wyznacza między nimi trasę. Na mapie import jest pokazany linią kropkowaną, a propozycja ciągłą, a karta porównuje ich długości, odsetek trasy w promieniu 50 m od śladu oraz „Największe odchylenie”.',
  'help.guide.tour-restore-recorded.title': 'Powrót do nagranego śladu',
  'help.guide.tour-take-over.title': 'Przejmowanie wycieczki z innej podróży',
  'help.guide.tour-take-over.tip.1':
    'Kopia jest osobną wycieczką. Nie jest jeszcze przypisana do żadnego dnia, a późniejsze zmiany oryginału nie wpływają na kopię i na odwrót. Jej „Pochodzenie” wskazuje podróż, z której ją przejęto.',
  'help.guide.tour-import-wanderer.step.3':
    'Kliknij szlak. Pojawi się na mapie, a kolumna pokaże parametry z jego pliku GPX, opis oraz to, czy w wanderer jest publiczny, czy prywatny.',
  'help.ctx.trip-tour-map.summary':
    'Mapa pośrodku zakładki „Wycieczki” dla otwartej wycieczki: mapy dopasowane do jej rodzaju, nałożone na nie trasy narciarskie lub znaki nawigacyjne, miejsca wzdłuż trasy i ta sama wycieczka w 3D na prawdziwym terenie.',
  'help.guide.tour-map-layers.step.1':
    'Otwórz zakładkę „Wycieczki” i kliknij wycieczkę w sekcji „Wycieczki w tej podróży” po prawej. Otworzy się w planerze, a pigułka w lewym dolnym rogu mapy pokaże mapy dostępne dla tego rodzaju wycieczki.',
  'help.guide.tour-along-search.goal':
    'Znajdź punkty widokowe, wodę, schroniska lub miejsce na posiłek w pobliżu trasy planowanej wycieczki.',
  'help.guide.tour-along-search.tip.2':
    'Przy spacerze po mieście cztery motywy nad listą same wybierają odpowiednie rodzaje miejsc.',
  'help.guide.tour-along-add-stop.result':
    'Wycieczka prowadzi teraz przez to miejsce, a nowy dystans i czas widać w „Podsumowaniu wycieczki”. Zapisz wycieczkę, aby zachować zmianę.',
  'help.guide.tour-3d-terrain.step.3':
    'Kliknij pigułkę „Rozkład nachylenia” po prawej. Po rozwinięciu pokazuje, jaka część wycieczki ma nachylenie „poniżej 5%”, „od 5 do 10%”, „od 10 do 18%”, „od 18 do 27%” oraz „27% i więcej”. Zwinięta pokazuje najwyższy punkt i najbardziej stromy odcinek.',
  'help.guide.tour-3d-flyover.goal':
    'Obejrzyj całą wycieczkę od startu do mety, zanim przejdziesz, przejedziesz lub zjedziesz ją na nartach.',
  'help.guide.tour-3d-flyover.tip.3':
    'Gdy przelot jest wstrzymany, przesuwaj kursor po profilu wysokościowym, aby przenieść kropkę w dany punkt. „Odtwórz przelot” wznawia przelot od tego miejsca.',
  'help.guide.tour-map-overlays.tip.1':
    'Trasy narciarskie to dane z mapy, a nie bieżący raport: nie mówią nic o tym, co jest otwarte lub przygotowane, ani o śniegu czy lawinach. Gdy oddalisz mapę poza ośrodek narciarski, przełącznik pokaże „Przybliż mapę, aby zobaczyć trasy narciarskie”.',
  'help.ctx.trip-tour-stages.bullet.4':
    'W sekcji „Wycieczki w tej podróży” wycieczka wielodniowa ma ikonę księżyca z liczbą etapów. Ten przycisk, „Pokaż etapy”, rozwija listę etapów z dniem przypisanym do każdego oraz sumami dla pozycji „Cała trasa”.',
  'help.guide.tour-multi-day.step.5':
    '„Podsumowanie wycieczki” wymienia każdy etap w sekcji „Etapy”. Kliknij etap, aby zobaczyć, gdzie się kończy: jego ostatni przystanek zostanie zaznaczony, a profil wysokościowy wskaże to miejsce.',
  'help.guide.tour-stages-on-days.goal': 'Przypisz każdy etap do osobnego dnia albo całą wycieczkę do jednego dnia.',
  'help.guide.tour-stages-on-days.tip.2':
    '„Cała trasa w tym dniu” jest nieaktywna w dniu, do którego wycieczka jest już przypisana. „Etapy od tego dnia” nadal tam działa i zastępuje całą wycieczkę w tym dniu.',
  'help.ctx.trip-tour-hike.bullet.3':
    'W nagłówku karty „Punkty trasy” są narzędzia trasy: „Odwróć kierunek”, „Powrót do startu”, a przy wędrówce pieszej także „Pętla od startu”. „Więcej działań” przy przystanku zawiera „Porównaj drogi dla następnego odcinka”.',
  'help.guide.tour-hike-plan.step.3': 'Wpisz nazwę w polu „Nazwa wycieczki”.',
  'help.guide.tour-hike-plan.tip.4':
    'Czas marszu jest liczony według zasady drogowskazów turystycznych (DIN 33466) i nie uwzględnia przerw. Dodaj je w polu „Przerwy” w sekcji „Szczegóły”, a zostaną doliczone do planowanego czasu łącznego.',
  'help.guide.tour-hike-trail-details.result':
    'Wiesz, jaki poziom trudności mają poszczególne części wędrówki, jaką mają nawierzchnię i gdzie leżą na mapie.',
  'help.guide.tour-hike-round.step.3':
    'Kliknij „Szukaj pętli”. Pętle A, B i kolejne pojawią się na liście i na mapie, każda w innym kolorze.',
  'help.guide.tour-hike-compare-ways.goal':
    'Zobacz, jakimi innymi ścieżkami może prowadzić wędrówka między dwoma przystankami, i wybierz jedną z nich.',
  'help.guide.tour-hike-compare-ways.tip.3': '„Anuluj” zamyka kartę bez zmiany trasy.',
  'help.guide.tour-ferrata-add.result':
    'Wędrówka prowadzi via ferratą po jej własnej linii z OpenStreetMap. Kliknij mapę, aby kontynuować od jej górnego końca. Algorytm wyznacza tylko dojście do via ferraty i drogę za nią.',
  'help.guide.tour-run-plan.step.2':
    'Wybierz „Profil”: „Bieg” dla głównie utwardzonych dróg w mieście, w parkach i nad rzekami albo „Bieganie terenowe” dla dróg leśnych i naturalnych ścieżek.',
  'help.guide.tour-run-plan.tip.4':
    '„Bieganie terenowe” prowadzi ścieżkami do poziomu ścieżek górskich (T2), nigdy trudniejszymi.',
  'help.guide.tour-run-ways.tip.2':
    'Przełącz „Profil” na „Bieganie terenowe”, aby trasa częściej prowadziła naturalnymi ścieżkami, lub na „Bieg”, aby trzymała się utwardzonego podłoża.',
  'help.guide.tour-walk-plan.title': 'Planowanie spaceru po mieście od przystanku do przystanku',
  'help.guide.tour-walk-plan.tip.1':
    'Pierścień wokół numeru przystanku pokazuje jego znaczenie: pełny oznacza „Koniecznie”, przerywany „Opcjonalne”. Mała tarcza oznacza przystanek „Chroniony”.',
  'help.guide.tour-walk-sights.step.3':
    'Kliknij „Szukaj wzdłuż trasy”. Gwiazdka przed nazwą oznacza „Perełkę”, czyli jedno z najbardziej znanych miejsc w okolicy.',
  'help.guide.tour-walk-day-times.goal':
    'Sprawdź, o której dotrzesz do każdego przystanku w dniu spaceru i które miejsca będą wtedy zamknięte.',
  'help.guide.tour-walk-day-times.tip.4':
    'Dwa spacery jednego dnia: w zakładce „Plan” kliknij odcinek między nimi („Zmień środek transportu”) i wybierz „Transport publiczny”. Wyszukiwanie zaczyna się tam i wtedy, gdzie i kiedy kończy się pierwszy spacer, i ostrzega, jeśli połączenie dociera po rozpoczęciu następnego spaceru.',
  'help.guide.tour-walk-google-import.tip.1':
    'Odczytywana jest tylko trasa zaplanowana pieszo. Przed udostępnieniem przełącz Google Maps na trasę pieszą.',
  'help.guide.tour-walk-check-off.step.3':
    'Kliknij „Oznacz jako odwiedzone” przy przystanku, który już zwiedzono, lub „Pomiń” przy tym, który pomijasz.',
  'help.ctx.trip-tour-bike.bullet.1':
    '„Profil” pod „Rodzaj wycieczki” określa, pod jaki rodzaj jazdy algorytm wyznacza trasę: „Turystyka”, „Szosa”, szuter lub MTB. Wiersz poniżej mówi, czego szuka algorytm, a zmiana profilu wyznacza całą trasę od nowa.',
  'help.guide.tour-bike-profile.step.3':
    'W polu „Profil” wybierz „Turystyka”, „Szosa”, szuter lub MTB. Wiersz poniżej mówi, czego algorytm szuka przy tym profilu.',
  'help.guide.tour-bike-profile.tip.4':
    'Przycisk „Zapisz” pozostaje nieaktywny, dopóki wycieczka nie ma nazwy, a trasa i jej wysokości nie zostaną wyliczone.',
  'help.guide.tour-bike-surfaces.result':
    'Mapa zaznacza odcinki wybranego wiersza, a Ty wiesz, po jakich nawierzchniach prowadzi trasa. Sama wycieczka się nie zmienia.',
  'help.guide.tour-bike-mtb-grades.step.2':
    'Na karcie „Nawierzchnia i drogi” sprawdź „Stopień trudności (mtb:scale)”: udział trasy od „S0, bez szczególnych trudności” do „S4 i więcej, teren dla ekspertów”.',
  'help.ctx.trip-tour-ski.summary':
    'Wycieczka rodzaju „Narty i zima” w zakładce „Wycieczki”: dzień na stoku, pętla biegowa, skitour, wędrówka w rakietach śnieżnych lub zimowy spacer. Jej odcinki prowadzą po trasach, wyciągach i szlakach zmapowanych w OpenStreetMap, wyznaczonych przez algorytm tras narciarskich zgodnie z Twoją dyscypliną i ograniczeniami. Nagrany ślad narciarski jest importowany razem z dyscypliną.',
  'help.guide.tour-ski-plan.step.1': 'W zakładce „Wycieczki” kliknij „Zaplanuj nową wycieczkę” u góry lewego panelu.',
  'help.guide.tour-ski-plan.tip.3':
    'Późniejsza zmiana dyscypliny zachowuje Twoje punkty i wyznacza odcinki na nowo z opcjami tej dyscypliny.',
  'help.guide.tour-ski-options.step.4':
    'Użyj przełączników: „Korzystaj z wyciągów”, „Zezwól na trasy freeride”, „W razie potrzeby zjedź wyciągiem” i „Unikaj domniemanych połączeń”. Przy „Biegowe” dochodzą „Tylko przygotowane trasy” i „Tylko oświetlone trasy”, a przy „Skitury” opcja „Podchodź skrajem trasy”.',
  'help.guide.tour-ski-fix-leg.step.1':
    'Odcinek, którego algorytm nie zdołał wyznaczyć, ma pod swoim punktem czerwony wiersz z przyczyną, np. „Te punkty łączy tylko wyciąg, który pominięto”, oraz nazwą trasy lub wyciągu, którego dotyczy.',
  'help.guide.tour-ski-summary.title': 'Odczytywanie trasy narciarskiej wycieczki',
  'help.guide.tour-ski-summary.tip.4':
    'Na dole karty są nazwy ośrodków narciarskich i data danych mapy, na których zaplanowano wycieczkę.',
  'help.guide.tour-ski-pistes-layer.tip.2':
    'Jeśli trasy narciarskie przestaną się wczytywać, przełącznik pokaże znak ostrzeżenia. Mapa i Twoja trasa nadal działają.',
  'help.guide.tour-ski-import.step.4': 'Kliknij „Importuj 1 wycieczkę”.',
  'help.ctx.trip-tour-paddle.summary':
    'Spływ kajakiem, kanadyjką lub na SUP po rzece albo jeziorze. Określa łódź i akwen, prowadzi po wodzie tam, gdzie TREK ma dane, wlicza przenoski i śluzy do czasu oraz pokazuje wiatr w dniu spływu i znane informacje o przeszkodach na trasie.',
  'help.guide.tour-paddle-setup.goal':
    'Zacznij spływ kajakiem, kanadyjką lub na SUP i określ, czym płyniesz, po jakiej wodzie i jak szybko.',
  'help.guide.tour-paddle-setup.tip.1':
    'Gdy „Łódź” jest ustawiona na „Inne”, nie ma sugerowanej prędkości. Wpisz ją sam, w przeciwnym razie czas na wodzie pozostanie pusty.',
  'help.guide.tour-paddle-water-route.step.2':
    'Aby wyznaczyć jeden odcinek po wodzie, najedź kursorem na przystanek przed nim i kliknij „Więcej działań”, czyli trzy kropki.',
  'help.guide.tour-paddle-water-route.result':
    'Każdy odcinek prowadzi po wodzie lub jest celowo narysowany ręcznie, a odcinek, którego TREK nie zdołał wyznaczyć, podaje przyczynę.',
  'help.guide.tour-paddle-portage.tip.1':
    'Jeśli jednak chcesz przepłynąć ten odcinek, otwórz ponownie „Więcej działań” przy punkcie i wybierz „Znów płyń tym odcinkiem”. Stanie się z powrotem odcinkiem narysowanym ręcznie.',
  'help.guide.tour-paddle-lock.step.3': 'Kliknij kartę śluzy, aby ją otworzyć.',
  'help.guide.tour-paddle-time.step.1':
    '„Szacowany czas” jest w lewej kolumnie pod punktami trasy. Plakietka w nagłówku pokazuje sumę razem z przerwami.',
  'help.guide.tour-paddle-time.result': 'Szacunek uwzględnia wpisane dane i wskazuje, czego jeszcze brakuje.',
  'help.guide.tour-paddle-wind.tip.2':
    'Spływ wielodniowy ma w nagłówku karty plakietkę „Dzień” dla każdego dnia. Kliknij ją, aby zobaczyć dany dzień.',
  'help.guide.tour-paddle-checklist.step.3':
    'Pozycje są ułożone wzdłuż trasy: jazy, śluzy, bystrza, miejsca wodowania i zasady dostępu z OpenStreetMap oraz Twoje własne przenoski i śluzy, oznaczone jako „Własne”.',
  'help.guide.tour-paddle-checklist.result':
    'Każda pozycja na trasie ma decyzję, a uwagi dotyczące bezpieczeństwa zostały przeczytane.',
  'help.guide.tour-paddle-track-marks.step.6':
    'Kliknij „Śluza”, a potem kliknij na linii miejsce, w którym jest śluza.',
  'help.ctx.trip-tour-horse.bullet.1':
    'Ustaw w edytorze „Rodzaj wycieczki” na „Przejażdżka konna”, a w lewej kolumnie pojawi się karta „Szlaki konne”. „Szukaj w widoku mapy” pokazuje szlaki w widocznym obszarze mapy.',
  'help.guide.tour-horse-plan.step.2':
    'Kliknij pole „Rodzaj wycieczki” pod „Nazwa wycieczki” i wybierz „Przejażdżka konna”. Pod „Punkty trasy” pojawi się karta „Szlaki konne”.',
  'help.guide.tour-horse-plan.tip.2':
    'TREK nie wylicza czasu przejażdżki. Jeśli chcesz mieć czas w planie dnia, wpisz go w polu „Zaplanowane” w sekcji „Szczegóły”.',
  'help.guide.tour-horse-gap.step.3':
    'Kliknij „Przejmij odcinek”. Dopóki przełącznik nie jest włączony, przycisk pozostaje nieaktywny.',
  'help.guide.tour-horse-recorded.step.1':
    'W sekcji „Wycieczki w tej podróży” kliknij „Dodaj trasę” (+), wybierz „Importuj GPX lub KML” i wskaż plik z przejażdżką.',
  'help.guide.dateless-trip.title': 'Zaplanuj podróż bez dat',
  'help.guide.trip-reminder.step.2':
    'W sekcji Przypomnienie wybierz 1, 3 lub 9 dni. Chcesz inny termin? Kliknij Własny i wpisz liczbę dni od 1 do 30.',
  'help.guide.upcoming-reservations.title': 'Przejdź do najbliższych rezerwacji',
  'help.guide.half-company-holiday.title': 'Oznacz pół dnia urlopu firmowego',
  'help.guide.edit-holiday-calendar.step.2':
    'Kliknij kwadracik z kolorem, aby wybrać nowy kolor, albo wpisz nową etykietę i naciśnij Enter.',
  'help.guide.person-color.step.1': 'Na karcie Osoby kliknij kolorową kropkę przed imieniem.',
  'help.guide.answer-fusion-request.title': 'Odpowiedz na prośbę o wspólne planowanie',
  'help.guide.log-for-partner.title': 'Zapisuj dni za osobę, z którą planujesz',
  'help.guide.dissolve-fusion.title': 'Zakończ wspólne planowanie',
  'help.guide.country-places.goal':
    'Zobacz miejsca, które TREK zalicza do danego kraju, żeby sprawdzić, co tam zrobiłeś, albo znaleźć miejsce przypisane do złego kraju.',
  'help.guide.regions.tip.3':
    'Dodaj do listy marzeń działa też dla regionu. Region jest wtedy pokazany z takim samym kreskowaniem jak kraj z Twojej listy marzeń.',
  'help.guide.tour-activity-stats.step.2':
    'Wybierz okres i typ za pomocą dwóch przycisków po lewej. Okres daje do wyboru Od początku, Ten rok, Ostatnie 12 miesięcy i każdy wcześniejszy rok, w którym masz wycieczki. Typ zawęża liczby do jednego rodzaju wycieczki albo pokazuje Wszystkie typy.',
  'help.guide.tour-activity-stats.tip.3':
    'Dzień z wymienionymi uczestnikami liczy się tylko im, a dzień bez uczestników liczy się wszystkim w podróży. Karta pobiera dane na żywo, więc potrzebuje internetu.',
  'help.guide.move-to-list.goal':
    'Uporządkuj swoje listy, przenosząc miejsca między nimi albo kopiując je na drugą listę.',
  'help.guide.accept-list-invite.result':
    'Lista pojawia się w sekcji Udostępniona na pasku i otwiera się razem z miejscami. Zmiany wprowadzane przez jej członków widać na żywo.',
  'help.guide.tour-collection-add-to-trip.step.1':
    'Otwórz listę. Zachowane wycieczki są w pierwszych wierszach, nad miejscami. Kliknij Dodaj do podróży przy wycieczce albo sam wiersz.',
  'help.guide.tour-collection-manage.title': 'Znajdź i usuń zachowane wycieczki',
  'help.guide.tour-collection-manage.result': 'Wycieczka znika z listy, a krótki komunikat to potwierdza.',
  'help.guide.entry-draft.title': 'Zachowaj wpis jako szkic',
  'help.guide.journey-map-layers.step.1':
    'Na górze mapy pasek warstw zawiera Plan, Nagrane, Wpisy i Zdjęcia, każdą z liczbą. Kliknij warstwę, aby ją ukryć lub pokazać.',
  'help.guide.journey-keep-route.step.1': 'W nagłówku dnia kliknij przycisk Dawarich, Przejmij nagranie.',
  'help.guide.journey-day-stays.step.1':
    'Dzień z pobytami do przejrzenia kończy się wierszem w stylu 4 pobyty z Dawarich oraz przedziałem czasu. Kliknij go, aby pokazać pobyty.',
  'help.guide.journey-take-over-day.step.1':
    'Kliknij Przejmij dzień na końcu wiersza z pobytami albo przycisk listy w nagłówku dnia, który pokazuje, ile pobytów czeka.',
  'help.guide.journey-auto-prepare.goal':
    'Niech pobyty z każdego dnia podróży same przygotowują się do przejrzenia, gdy podróż trwa.',
  'help.guide.photo-location.goal': 'Umieść wpisy na mapie bez szukania miejsca dla każdego z nich.',
  'help.ctx.settings-about.bullet.1': 'Wersja, na której działa ten serwer, widnieje obok tytułu.',
  'help.guide.readability.tip.3':
    'Czytelność jest oznaczona jako Eksperymentalne. Jeśli coś wygląda nie tak, kliknij Przywróć domyślne na dole karty, aby wrócić do ustawień domyślnych.',
  'help.guide.web-push-device.goal':
    'Widuj powiadomienia TREK na telefonie lub komputerze, nawet gdy TREK jest zamknięty.',
  'help.guide.connect-airtrail.tip.2':
    'Klucz jest przechowywany w postaci zaszyfrowanej i nigdy nie jest pokazywany ponownie. Kropki w polu oznaczają, że klucz jest zapisany.',
  'help.guide.connect-dawarich.tip.2':
    'Pod przyciskami karta podaje, kiedy TREK ostatnio sprawdzał, i czego Twoja wersja Dawarich nie obsługuje.',
  'help.guide.tour-connect-wanderer.tip.2':
    'Instancja pod prywatnym adresem może wymagać, aby administrator zezwolił na sieci wewnętrzne.',
  'help.guide.tour-wanderer-watch.tip.2':
    'Wstrzymane do oznacza, że wanderer nie odpowiedział. Token odrzucony oznacza, że token wymaga udanego testu połączenia albo trzeba podać nowy.',
  'help.guide.plugin-settings.result':
    'Wtyczka działa zgodnie z Twoimi ustawieniami, a każda czynność wykonana przez nią w Twoim imieniu jest widoczna w Aktywność wtyczek.',
  'help.ctx.admin-defaults.bullet.3':
    'Link przywróć obok ustawionego pola przywraca domyślną wartość TREK. Własne ustawienie użytkownika zawsze ma pierwszeństwo przed tymi.',
  'help.ctx.admin-settings.bullet.5':
    'Strefa zagrożenia: Zmień sekret JWT wylogowuje wszystkich użytkowników, Ciebie też.',
  'help.guide.default-user-settings.step.1':
    'W sekcji Domyślne ustawienia użytkownika wybierz Motyw (Jasny, Ciemna lub Automatyczny), Jednostka temperatury, Jednostka odległości, Format czasu, Tydzień zaczyna się w, Waluta wyświetlania oraz to, czy Rozmyj kody rezerwacji jest włączone, czy wyłączone. Każdy wybór zapisuje się od razu.',
  'help.guide.admin-passkeys.step.2':
    'Wpisz Relying Party ID (domena), na przykład trek.example.org, oraz Dozwolone origins, pod którymi TREK jest dostępny, a potem kliknij Zapisz. Zostaw oba pola puste, aby użyć APP_URL.',
  'help.guide.rotate-jwt-secret.title': 'Wyloguj wszystkich naraz',
  'help.guide.notification-defaults.step.2':
    'Kliknij komórkę, aby przełączyć ją na kolejny stan: Włączone, Wył., Zablokowane. Podpowiedź podaje następny stan, a każde kliknięcie zapisuje się od razu.',
  'help.ctx.notifications.bullet.2':
    'Przyciski Wszystkie i Nieprzeczytane u góry przełączają widok między wszystkimi powiadomieniami a tylko tymi, których jeszcze nie przeczytałeś. Kolejne wczytują się podczas przewijania.',
  'help.guide.read-notifications.step.3':
    'Kliknij przycisk pod powiadomieniem, Zobacz Vacay tutaj, aby otworzyć to, czego dotyczy. Powiadomienie zostanie też oznaczone jako przeczytane.',
  'help.guide.filter-notifications.step.3':
    'Kliknij Nieprzeczytane, aby zobaczyć tylko powiadomienia, których jeszcze nie przeczytałeś. Wszystkie znów pokazuje wszystkie.',
  'help.guide.mark-notifications-read.tip.2':
    'Oznaczenie jako przeczytane zmienia tylko kolor tła i licznik. Powiadomienie zostaje na liście, dopóki go nie usuniesz.',
  'help.guide.delete-notifications.result': 'Powiadomienie znika z listy i z dzwonka.',
  'help.guide.notification-settings.result':
    'Otwierają się Ustawienia na karcie Powiadomienia, z przełącznikiem dla każdego zdarzenia i kanału.',
  'help.guide.link-journal.goal': 'Pokaż jeden ze swoich dzienników z Journey wewnątrz podróży, wybranym osobom.',
  'help.guide.link-journal.tip.3':
    'Później Dziennik w Ustawieniach podróży udostępnia Edytuj dostęp, Zmień dziennik i Odłącz. Odłączenie usuwa kartę, a osoby dodane w samym dzienniku zachowują dostęp.',
  'help.guide.dawarich-stays.result':
    'Pobyt staje się miejscem podróży, w wybranym dniu albo w sekcji Niezaplanowane, a panel oznacza go jako załatwiony.',
  'help.ctx.trip-days.bullet.7': 'Gdy podróż trwa, plan otwiera się na dzisiejszym dniu i przewija się do niego.',
  'help.guide.leave-stop-off-route.tip.2':
    'Usuń z dnia zdejmuje przystanek z dnia, a Pomiń w trasie zostawia go w planie.',
  'help.guide.move-booking-day.goal':
    'Przenieś transport lub rezerwację na inny dzień prosto z planu, bez otwierania jej formularza.',
  'help.guide.place-image-from-file.result':
    'Zdjęcie staje się obrazem miejsca na karcie, w kolumnie miejsc, w dniu i na mapie.',
  'help.guide.place-own-hours.step.3':
    'Godziny otwarcia poniżej pokazują cały tydzień, jeden wiersz na dzień. Jeśli TREK znalazł godziny dla tego miejsca, są już wpisane. W przeciwnym razie najpierw kliknij Dodaj godziny otwarcia. Wpisz, o której każdego dnia miejsce się otwiera i zamyka, a przy dniu, w którym jest nieczynne, kliknij Zamknięta.',
  'help.guide.add-accommodation.tip.5':
    'Ślady GPX i miejsca z wycieczek nigdy nie są proponowane jako nocleg, tylko zwykłe miejsca podróży.',
  'help.guide.confirm-stay-booking.step.1':
    'Otwórz dzień zameldowania. Na karcie pobytu, w sekcji Rezerwacja, widać rezerwację hotelu na tę noc ze statusem Oczekujące lub Potwierdzono. Kliknij to pole.',
  'help.guide.tour-map-lines.step.4':
    'Aby usunąć wycieczkę z mapy, przełącz prawą kolumnę na Wycieczki, najedź na wycieczkę i kliknij oko, Ukryj na mapie. Jej linia i pinezka znikną z mapy, a wiersz zostanie na liście, przygaszony, z przekreślonym okiem, Pokaż na mapie, które przywraca wycieczkę.',
  'help.guide.car-stops.step.1':
    'W nagłówku dnia, w którym odbierasz samochód, kliknij + z podpowiedzią Dodaj do dnia i wybierz Dodaj transport.',
  'help.guide.car-stops.tip.2':
    'Przenieś w górę i Przenieś w dół pojawiają się dopiero wtedy, gdy przejazd ma co najmniej dwa przystanki.',
  'help.guide.transport-details.title': 'Otwórz transport i korzystaj z jego szczegółów',
  'help.guide.transport-details.tip.1':
    'Na mapie, kliknięte ponownie przy przejeździe z narysowaną linią, wyłącza tę linię.',
  'help.guide.export-transports-csv.result':
    'Przeglądarka zapisze plik nazwany od podróży, na przykład autumn-in-japan-transports.csv, z jednym wierszem na przejazd: Type, Title, Status, Start, End, From, To, Location, Confirmation i Notes.',
  'help.guide.group-sort-bookings.goal': 'Ułóż karty lub listę według statusu, dnia albo typu, w wybranej kolejności.',
  'help.guide.booking-on-map.tip.1':
    'Na mapie jest tylko przy rezerwacji z miejscem. Wybierz miejsce w polu Miejsce / Aktywność w formularzu, a przycisk się pojawi.',
  'help.guide.export-bookings-csv.step.2':
    'Otwórz Opcje widoku, czyli suwaki za ikonami widoków, i wybierz kolejność w Sortuj według. Wiersze ułożą się według niej, po jednym na rezerwację, bez sekcji.',
  'help.guide.edit-booking.tip.4':
    'Jeśli coś zmieniłeś, kliknięcie poza formularzem albo Escape wyświetli pytanie Odrzucić zmiany? Kontynuuj edycję wraca do formularza.',
  'help.guide.arrange-packing-list.step.2':
    'Wewnątrz listy uchwyt po lewej stronie wiersza przeciąga ten przedmiot w górę lub w dół. Linia w kolorze akcentu przy lewej krawędzi wiersza pokazuje, gdzie przedmiot wyląduje.',
  'help.guide.count-packed-pieces.goal': 'Ustaw przedmiotowi ilość i odhaczaj spakowane sztuki jedna po drugiej.',
  'help.guide.count-packed-pieces.tip.3': 'Przy ilości równej jeden licznika nie ma, jest tylko pole wyboru.',
  'help.guide.expense-receipts.step.2':
    'Kliknij Załącz obok Paragony i faktury i wybierz zdjęcie albo PDF. Możesz wybrać kilka plików naraz. Każdy plik jest wypisany pod nagłówkiem, z koszem do usunięcia.',
  'help.guide.files-sync-settings.goal':
    'Zdecyduj, czy dokumenty są tylko importowane z Twojego magazynu, tylko do niego eksportowane, czy w obie strony, i co dzieje się, gdy dokument zostanie usunięty lub zmieniony w obu miejscach.',
  'help.guide.files-sync-settings.tip.2':
    'Przy ustawieniu Zapytaj mnie dokument edytowany w obu miejscach czeka w sekcji Wymaga uwagi, pod kartą. Kliknij Rozwiąż i wybierz Zachowaj wersję z TREK, Zachowaj wersję dostawcy albo Zachowaj obie.',
  'help.guide.manage-notes.goal':
    'Otwórz notatkę w całości, trzymaj ważną na górze i poprawiaj lub usuwaj to, co nieaktualne.',
  'help.guide.manage-notes.tip.2':
    'Podczas edycji czerwony krzyżyk przy już załączonym pliku usuwa go od razu, jeszcze przed kliknięciem Zapisz, i plik nie trafia do kosza. Każdy plik notatki widać też na karcie Pliki podróży.',
  'help.guide.note-categories.step.6':
    'Po powrocie na kartę Notatki przyciski pod nagłówkiem filtrują karty. Kliknij kategorię, aby zobaczyć tylko jej notatki. Wszystkie albo ponowne kliknięcie tego samego przycisku pokazuje wszystkie.',
  'help.guide.roadtrip-reorder.tip.1':
    'Przesunięcie przystanku tutaj przesuwa go też w planie dnia: karta Dni pokazuje tę samą kolejność.',
  'help.guide.roadtrip-overnight.step.1':
    'W Na trasie zaznacz Nocleg w sekcji Szukam albo Kemping, jeśli szukasz miejsca na namiot, wybierz dzień, w którym chcesz się zatrzymać, i kliknij Szukaj.',
  'help.guide.roadtrip-overnight.tip.3':
    'Gdy w sekcji Linia trasy w Ustawieniach jazdy włączone jest Zaczynaj i kończ każdy dzień w noclegu, przejazd następnego dnia rusza stamtąd, gdzie spałeś.',
  'help.guide.roadtrip-stop-fill.title': 'Ustaw, jak bardzo wypełniony jest jeden przystanek',
  'help.guide.roadtrip-bookings.title': 'Uwzględnij w przejeździe lot, pociąg lub prom',
  'help.guide.roadtrip-bookings.tip.2':
    'Stolik lub bilet zarezerwowany na przystanku widać jako przycisk przy tym przystanku. Wszystko, co nie należy do żadnego przystanku, jest wypisane w sekcji Zarezerwowane też tego dnia.',
  'help.guide.roadtrip-google-import.step.3':
    'Sprawdź znalezione przystanki. Każdy pokazuje, gdzie leży. Przystanek oznaczony Location unresolved jest pomijany.',
  'help.guide.roadtrip-hazards.step.1': 'Otwórz Ustawienia jazdy w prawej kolumnie.',
  'help.ctx.trip-tours.summary':
    'Prawa kolumna karty Plan w trybie Wycieczki: wszystkie wycieczki podróży na jednej liście, obok dni. Stąd przypisujesz wycieczki do dni, filtrujesz listę, ukrywasz linie na mapie i importujesz pliki GPX lub KML. Trasy rysuje się i zmienia na karcie Wycieczki.',
  'help.guide.tour-show-list.goal': 'Zastąp kolumnę miejsc wycieczkami podróży, aby widzieć je i wybierać obok dni.',
  'help.guide.tour-show-list.tip.3':
    'Gdy dodatek Wycieczki jest włączony, ślady nigdy nie pojawiają się na liście Miejsca: każdy zaimportowany ślad jest wycieczką i znajdziesz go tutaj.',
  'help.guide.tour-add-to-day.step.5':
    'Wycieczka z etapami pyta o nie dalej, w tym samym menu. Etapy od tego dnia ustawia etap 1 na tym dniu, a każdy kolejny na następnym dniu. Cała trasa w tym dniu umieszcza całość w tym jednym dniu.',
  'help.guide.tour-day-times.step.1':
    'W kolumnie dni najedź na wiersz wycieczki, kliknij Więcej opcji (trzy kropki) i wybierz Edytuj.',
  'help.guide.tour-day-times.result':
    'Wycieczka pojawia się na osi czasu dnia z początkiem i końcem, jak każdy przystanek z godziną.',
  'help.guide.tour-remove-from-day.result':
    'Dzień nie zawiera już wycieczki, a jej wiersz na liście nie ma plakietki Dzień.',
  'help.guide.tour-filter-list.tip.2':
    'Sekcja pojawia się tylko wtedy, gdy wycieczki się w niej różnią, więc krótka lista może oferować tylko Status.',
  'help.guide.tour-hide-on-map.tip.1':
    'Ukrycie dotyczy tylko Ciebie i jest zapamiętane w tej przeglądarce dla tej podróży. Wycieczka, jej dni i kolor się nie zmieniają, a na mapach innych osób wycieczka nadal jest widoczna.',
  'help.guide.tour-import-plan-tab.tip.1':
    'Ślad, który już jest w podróży, ma oznaczenie Już jest w podróży i nie zostanie zaimportowany drugi raz.',
  'help.ctx.trip-tour-detail.bullet.4':
    'Dolny rząd: Dodaj do dnia lub Usuń z dnia, gdy otwarty jest dzień, Nawigacja do startu, strona internetowa wycieczki, GPX, Udostępnij tam, gdzie urządzenie potrafi udostępniać pliki, Kolekcja i Kopiuj.',
  'help.guide.tour-detail-read.step.5':
    'Niżej są wartości: Dystans, Minimalna wysokość n.p.m., Maksymalna wysokość n.p.m., Suma podejść i Suma zejść, pod nimi czasy, a na końcu profil wysokościowy w kolorze linii wycieczki.',
  'help.guide.tour-detail-read.result':
    'Karta wycieczki jest otwarta obok planu i wiesz, w których dniach jest ta wycieczka, jak jest długa i stroma oraz skąd pochodzi.',
  'help.guide.tour-rename-colour.tip.2': 'Ołówek i kropka działają tylko dla członków, którzy mogą edytować miejsca.',
  'help.guide.tour-take-along.tip.2':
    'Wybierz preferowaną aplikację z mapami w Ustawieniach, a Nawigacja od razu otworzy tę aplikację zamiast pokazywać listę.',
  'help.guide.tour-copy-keep.step.3':
    'Aby zachować wycieczkę dla innych podróży, otwórz ją i kliknij Kolekcja na dole jej karty.',
  'help.guide.tour-packing-link.goal':
    'Pokaż, co spakować na wycieczkę, prosto na jej karcie, z listy pakowania podróży albo jednej z jej list.',
  'help.guide.tour-packing-link.tip.3':
    'Powiązanie wymaga prawa do edycji miejsc. Pozostałe osoby widzą powiązaną listę, ale nie mogą zmienić powiązania.',
  'help.guide.tour-files.tip.2': 'Prześlij widzą tylko członkowie, którzy mogą zmieniać wycieczkę i dodawać pliki.',
  'help.guide.tour-activity-link.step.5':
    'Ślad pojawi się teraz w sekcji Rzeczywista trasa, z własnymi wartościami i własnym profilem obok planu.',
  'help.guide.tour-activity-compare.step.2':
    'Największa odległość od planu pokazuje największy dystans między śladem a zaplanowaną linią, a Poza planem pokazuje, jaka część śladu biegła poza tą linią.',
  'help.guide.tour-origin-check.step.1':
    'Otwórz kartę wycieczki i przewiń do sekcji Pochodzenie. Źródło podaje, skąd pochodzi wycieczka: Import GPX z nazwą pliku, import KML lub KMZ albo wanderer z jego adresem.',
  'help.ctx.trip-tour-planner.summary':
    'Planer wycieczek podróży: edytor po lewej, wszystkie wycieczki podróży po prawej i mapa pośrodku. Tutaj rysujesz wycieczkę punkt po punkcie, wyznaczasz ją prawdziwymi ścieżkami i drogami, dodajesz szczegóły i zapisujesz w podróży.',
  'help.guide.tour-open-workspace.goal': 'Otwórz planer wycieczek i dowiedz się, do czego służy każda jego część.',
  'help.guide.tour-open-workspace.tip.1':
    'Zwiń na zakładce przy wewnętrznej krawędzi każdego paska chowa pasek, dając mapie więcej miejsca. Plan i Wycieczki w tej podróży znów go pokazują. Przeciągnij krawędź paska, aby go poszerzyć lub zwęzić.',
  'help.guide.tour-draw-route.step.3':
    'Upewnij się, że Dodaj punkt w sekcji Punkty trasy jest włączone (to ten sam przełącznik co Ustawiaj punkty na pasku mapy), a potem kliknij na mapie miejsce, w którym zaczyna się wycieczka.',
  'help.guide.tour-draw-route.result':
    'Ponumerowana trasa na mapie i jej punkty w sekcji Punkty trasy, gotowe do nazwania i zapisania.',
  'help.guide.tour-type-profile.tip.2':
    'Niektóre rodzaje wymagają czegoś więcej, zanim da się je zapisać: Bieg wymaga Planowane tempo, Spływ łodzi i wody, a Narty i zima dyscypliny.',
  'help.guide.tour-edit-points.step.5': 'Usuń punkt, czyli kosz obok niego, usuwa punkt z wycieczki.',
  'help.guide.tour-shaping-points.step.2':
    'Przeciągnij kropkę na ścieżkę, którą ma prowadzić trasa. Trasa zostanie wyznaczona ponownie przez ten punkt.',
  'help.guide.tour-loop-reverse.goal': 'Zakończ wycieczkę w miejscu startu albo odwróć jej kierunek.',
  'help.guide.tour-leg-by-hand.title': 'Narysuj odcinek ręcznie albo wyznacz go ponownie',
  'help.guide.tour-leg-by-hand.result':
    'Odcinek jest linią prostą tam, gdzie ją poprowadzisz, oznaczoną jako narysowana ręcznie, albo zostaje wyznaczony ponownie.',
  'help.guide.tour-trip-places.tip.2':
    'Usunięcie przystanku lub odłączenie go zostawia miejsce w podróży bez zmian, razem z jego dniami.',
  'help.guide.tour-details-times.step.4':
    'Zaplanowane pokazuje sumę. Wpisz własną wartość, aby ją zastąpić. Zostanie wtedy oznaczona jako Wartość ręczna.',
  'help.guide.tour-save.step.2':
    'Poczekaj, aż kropka obok Nowa wycieczka zniknie. Zapisz wymaga trasy i wszystkich jej wysokości.',
  'help.guide.tour-edit-saved.goal': 'Otwórz wcześniej zaplanowaną wycieczkę, zmień ją i zapisz ponownie.',
  'help.guide.tour-edit-saved.result': 'Zapisana wycieczka zawiera teraz Twoje zmiany.',
  'help.guide.tour-summary-profile.tip.2':
    'Trasa prowadząca ferratą dostaje nad liczbami plakietkę ostrzegawczą ze stopniem trudności.',
  'help.guide.tour-list-manage.step.4':
    'Przycisk nad Podsumowanie podróży to filtr. Pokazuje nazwę wybranego statusu, na początku Wszystkie, wraz z liczbą wycieczek.',
  'help.guide.tour-delete.step.1':
    'Najedź na wycieczkę w Wycieczki w tej podróży i kliknij kosz po prawej stronie jej wiersza, Usuń z nazwą wycieczki.',
  'help.guide.tour-saved-elsewhere.step.1':
    'Podczas edycji na górze paska pojawia się Ta trasa została zapisana gdzie indziej. Twoje zmiany zostają, dopóki nie zdecydujesz.',
  'help.ctx.trip-tour-import.summary':
    'Tutaj importujesz do podróży wycieczki, które już gdzieś istnieją: plik GPX, KML lub KMZ z zegarka albo aplikacji, wycieczkę z innej Twojej podróży albo szlak z własnego wanderer. Import zostaje zachowany dokładnie tak, jak go nagrano, a na jego podstawie możesz zaplanować wersję do edycji.',
  'help.guide.tour-import-gpx.step.1':
    'Otwórz kartę Wycieczki podróży. U góry sekcji Wycieczki w tej podróży po prawej kliknij + (Dodaj trasę).',
  'help.guide.tour-import-gpx.tip.4':
    'Przy pliku KML lub KMZ w sekcji Nie zaimportowano zobaczysz też, co poza liniami zawierał: pinezki, obszary i inne elementy.',
  'help.guide.tour-view-import.tip.1':
    'Importu nie da się edytować punkt po punkcie. Zaplanuj wersję do edycji, na karcie Wersja do edycji powyżej, tworzy z niego wycieczkę, którą możesz zmieniać.',
  'help.guide.tour-plan-from-import.step.3':
    'Kliknij Zastąp import, aby zaplanować tę wycieczkę od nowa w tym samym miejscu: jej dni i notatki zostają, a nagrany ślad jest zachowany, żeby można go było przywrócić. Zaplanuj jako nową wycieczkę nie zmienia importu i tworzy obok drugą wycieczkę.',
  'help.guide.tour-restore-recorded.goal':
    'Cofnij ponowne zaplanowanie importu i odzyskaj oryginalny ślad, nawet po dłuższym czasie.',
  'help.guide.tour-take-over.goal':
    'Wykorzystaj ponownie wycieczkę, którą zaplanowałeś lub zaimportowałeś w innej ze swoich podróży, bez ponownego rysowania.',
  'help.guide.tour-take-over.tip.2':
    'Na liście są tylko Twoje inne podróże i tylko pierwsze 100 wycieczek. Użyj wyszukiwania lub filtrów, aby znaleźć resztę.',
  'help.guide.tour-import-wanderer.step.4': 'Kliknij Importuj do podróży.',
  'help.ctx.trip-tour-map.bullet.1':
    'Pasek w lewym dolnym rogu mapy zawiera mapy bazowe dostępne dla rodzaju otwartej wycieczki: Mapa, Topo, Turystyka przy wędrówce, Rower przy wycieczce rowerowej i Satelita. Wybór dotyczy tylko planera i nigdy nie zmienia ustawienia mapy w Ustawieniach.',
  'help.guide.tour-map-layers.step.2':
    'Kliknij Topo, aby zobaczyć poziomice i cieniowaną rzeźbę terenu, czyli mapę pokazującą, jak stromy jest teren. Wybrana mapa pozostaje podświetlona na pasku.',
  'help.guide.tour-along-search.step.1':
    'Otwórz wycieczkę na karcie Wycieczki i przewiń lewy panel w dół do sekcji Wzdłuż trasy, pod przystankami wycieczki. Karta pojawia się, gdy wycieczka ma trasę.',
  'help.guide.tour-along-search.tip.3':
    'Wyniki pochodzą z OpenStreetMap i indeksu miejsc TREK, więc wyszukiwanie wymaga połączenia z internetem. Gdy nic nie znaleziono, Poszerz do próbuje z następną odległością. Gdy serwer jest zajęty, Spróbuj ponownie pokazuje odliczanie do czasu, gdy można spróbować jeszcze raz.',
  'help.guide.tour-along-add-stop.tip.1':
    'Miejsce staje się przystankiem wycieczki, a nie miejscem podróży, więc nie pojawia się na liście miejsc.',
  'help.guide.tour-3d-terrain.step.4':
    'Przeciągnij suwak Rzeźba, aby wzgórza były nawet trzy razy wyższe, co pomaga na łagodnym terenie.',
  'help.guide.tour-3d-flyover.step.1':
    'Przełącz wycieczkę na 3D. Gdy wczytuje się krajobraz wzdłuż trasy, w miejscu przycisku odtwarzania wypełnia się pierścień. Gdy będzie pełny, kliknij Odtwórz przelot. Kamera podąża za kropką wzdłuż trasy, a kursor na profilu wysokościowym w Podsumowanie wycieczki porusza się razem z nią.',
  'help.guide.tour-map-overlays.title': 'Pokaż trasy narciarskie lub znaki nawigacyjne na mapie',
  'help.guide.tour-map-overlays.tip.2':
    'Przełącznik tras jest dostępny także bez otwartej wycieczki, więc możesz obejrzeć ośrodek narciarski, zanim cokolwiek zaplanujesz. Przy wędrówce pasek oferuje zamiast niego Ferraty, z liczbą tras w widoku.',
  'help.ctx.trip-tour-stages.bullet.5':
    'Plus w wierszu wycieczki, Dodaj do dnia, układa etapy w podróży po jednym na dzień, od wybranego dnia, albo całą wycieczkę w tym jednym dniu.',
  'help.guide.tour-multi-day.step.6':
    'Aby znów zrobić z niej wycieczkę jednodniową, kliknij Jednodniowa i potwierdź pytanie Zmienić na wycieczkę jednodniową? przyciskiem Usuń końce etapów. Trasa pozostaje bez zmian.',
  'help.guide.tour-stages-on-days.step.1':
    'W sekcji Wycieczki w tej podróży najedź na wycieczkę wielodniową i kliknij plus, Dodaj do dnia.',
  'help.guide.tour-stages-on-days.tip.3':
    'Przeciągnięcie wycieczki wielodniowej na dzień na karcie Plan wyświetla w oknie to samo pytanie, podobnie jak Dodaj do dnia na karcie wycieczki.',
  'help.ctx.trip-tour-hike.bullet.4':
    'Szczegóły szlaku, pod punktami trasy, pokazują stopień SAC, nawierzchnię i rodzaj drogi dla każdego odcinka, z OpenStreetMap, i według nich kolorują trasę na mapie. Nic w tej sekcji nie zmienia wycieczki.',
  'help.guide.tour-hike-plan.step.4':
    'Dodaj punkt jest włączone od początku: kliknij na mapie miejsce, w którym zaczyna się wędrówka, i miejsce, w którym się kończy. Miejsca podróży obok pozwala zamiast tego wybrać schronisko lub hotel z podróży. Od dwóch punktów TREK wyznacza trasę pieszą.',
  'help.guide.tour-hike-trail-details.title':
    'Sprawdź stopnie trudności, nawierzchnie i rodzaje dróg na trasie wędrówki',
  'help.guide.tour-hike-trail-details.tip.1':
    'Drogi, dla których OpenStreetMap nie podaje wartości, trafiają do sekcji Nieznana, a nieznana nie oznacza łatwa. Jeśli przy niektórych widać Tym razem nie udało się sprawdzić, kliknij Spróbuj ponownie.',
  'help.guide.tour-hike-round.step.4':
    'Kliknij pętlę, aby ją wybrać. Jej wiersz pokazuje dystans, podejście i czas oraz to, jak bardzo różni się od dystansu, o który prosiłeś.',
  'help.guide.tour-hike-compare-ways.step.1':
    'Najedź na przystanek, w którym zaczyna się odcinek, kliknij Więcej działań w jego wierszu i wybierz Porównaj drogi dla następnego odcinka.',
  'help.guide.tour-ferrata-add.title': 'Dodaj ferratę do wędrówki',
  'help.guide.tour-ferrata-add.tip.1':
    'Ferrata wymaga sprzętu i doświadczenia. Podpowiedź przy plakietce mówi, jak duża część trasy prowadzi ferratą.',
  'help.guide.tour-run-plan.step.3': 'Wpisz swoje Planowane tempo jako minuty i sekundy na kilometr, na przykład 7:30.',
  'help.guide.tour-run-ways.title': 'Zobacz, którymi drogami biegnie trasa biegowa',
  'help.ctx.trip-tour-walk.title': 'Spacer po mieście',
  'help.guide.tour-walk-plan.goal':
    'Zbuduj spacer zwiedzający z przystanków, wraz z czasem pobytu przy każdym z nich i oznaczeniem tych, które są najważniejsze.',
  'help.guide.tour-walk-plan.tip.2':
    'Spacer po mieście nie ma limitu dla wędrówek ani pola Przerwy: zamiast tego liczą się czasy pobytu.',
  'help.guide.tour-walk-sights.step.4':
    'Kliknij miejsce na liście. Jego karta otworzy się nad mapą: w sekcji Gdzie wstawić wybierz dwa przystanki, między które trafi.',
  'help.guide.tour-walk-day-times.step.1':
    'Przypisz spacer do dnia: w sekcji Wycieczki w tej podróży kliknij okrągły przycisk + w jego wierszu (Dodaj do dnia) i wybierz dzień.',
  'help.guide.tour-walk-day-times.result':
    'Możesz zmieniać kolejność przystanków lub czasy pobytów, aż każde miejsce będzie otwarte, gdy do niego dotrzesz.',
  'help.guide.tour-walk-google-import.tip.2':
    'Użyj innego linku wraca do pola z linkiem. Wczytanie zastępuje niezapisane zmiany w planerze, a okno wcześniej o tym ostrzega.',
  'help.guide.tour-walk-check-off.step.4':
    'Na górze listy widać liczbę odwiedzonych przystanków i pozostały czas marszu. Cofnij przy przystanku usuwa jego oznaczenie.',
  'help.ctx.trip-tour-bike.bullet.2':
    'Podsumowanie wycieczki po prawej pokazuje Czas jazdy (szacowany), czyli czas obliczony przez router dla danego profilu, wraz z podjazdami. Przerwy nie są wliczone.',
  'help.guide.tour-bike-profile.step.4':
    'W sekcji Punkty trasy kliknij Miejsca podróży i wybierz start oraz koniec, tutaj Hotel Alpenroyal, a potem Hotel Greif. Możesz też sprawdzić, czy Dodaj punkt jest włączone, i klikać na mapie. Od dwóch punktów TREK wyznacza trasę.',
  'help.guide.tour-bike-profile.tip.5':
    'Jeśli administrator zezwoli na mapę CyclOSM, pasek warstw na mapie oferuje też Rower, gdy otwarta jest wycieczka rowerowa. Jeśli przestanie się wczytywać, przełącz na Mapa. Wycieczka się nie zmienia.',
  'help.guide.tour-bike-surfaces.tip.1':
    'Brak w danych oznacza, że OpenStreetMap nie ma tam zapisanej nawierzchni. Nawierzchnia jest nieznana, a niekoniecznie dobra.',
  'help.guide.tour-bike-mtb-grades.step.3': 'Kliknij wiersz stopnia, aby podświetlić te szlaki na mapie.',
  'help.ctx.trip-tour-ski.bullet.1':
    'Pierwsza jest Dyscyplina i nic nie jest wybrane z góry: Zjazdowe, Snowboard, Biegowe, Skitury, Rakiety śnieżne lub Wędrówka zimowa. Przy Biegowe trzeba też podać Technika: Klasyczna, Łyżwowa lub Nieznana. Bez dyscypliny wycieczki nie da się zapisać.',
  'help.guide.tour-ski-plan.step.2': 'Otwórz Rodzaj wycieczki i wybierz Narty i zima.',
  'help.guide.tour-ski-plan.tip.4':
    'Tam, gdzie brakuje danych o trasach, odcinek jest linią prostą między swoimi punktami. Dla rakiet śnieżnych i wędrówki zimowej może prowadzić letnimi ścieżkami, o czym informuje szara notatka przy odcinku.',
  'help.guide.tour-ski-options.step.5':
    'W sekcji Pomiń wciśnij każdy rodzaj wyciągu, z którego nie chcesz korzystać: Wyciągi orczykowe, Otwarte kolejki krzesełkowe, Gondole, Koleje linowe lub Koleje szynowo-linowe i pociągi. Wciśnięty rodzaj jest przekreślony.',
  'help.guide.tour-ski-fix-leg.step.2':
    'Kliknij poprawkę, którą proponuje wiersz: Zezwól na trudniejsze trasy, Zezwól na ten wyciąg, Zjedź wyciągiem, Zmień technikę lub Zmień dyscyplinę. Opcja się zmieni, a odcinek zostanie wyznaczony ponownie.',
  'help.guide.tour-ski-summary.goal': 'Zobacz, jak dzień dzieli się na jazdę, wyciągi, oczekiwanie i marsz.',
  'help.guide.tour-ski-summary.result': 'Wiesz, ile dzień trwa na trasach, na wyciągach i w kolejkach do nich.',
  'help.guide.tour-ski-pistes-layer.tip.3':
    'Warstwa to dane z mapy, a nie raport na żywo: nic nie mówi o tym, co jest otwarte lub przygotowane, ani o śniegu czy lawinach. Przełącznik jest dostępny także bez otwartej wycieczki, więc możesz obejrzeć ośrodek narciarski przed planowaniem.',
  'help.guide.tour-ski-import.step.5':
    'Kliknij ślad w sekcji Wycieczki w tej podróży, aby go otworzyć. Aby później poprawić jego dyscyplinę, kliknij Zmień na jego karcie Ślad narciarski.',
  'help.ctx.trip-tour-paddle.bullet.1':
    'W sekcji Rodzaj wycieczki Spływ wymaga wyboru Łódź (Kajak, Kanadyjka, SUP lub Inne) i Woda (Rzeka lub Jezioro). Wycieczki nie da się zapisać, dopóki oba pola nie są wybrane.',
  'help.guide.tour-paddle-setup.step.1': 'Na karcie Wycieczki kliknij Zaplanuj nową wycieczkę na górze lewej kolumny.',
  'help.guide.tour-paddle-setup.tip.2':
    'Mapa spływu oferuje Mapa i Satelita oraz Znaki nawigacyjne z OpenSeaMap jako nakładkę.',
  'help.guide.tour-paddle-water-route.step.3':
    'Wybierz Zaplanuj następny odcinek po wodzie. TREK wyznaczy odcinek wzdłuż rzeki lub jeziora od tego punktu do następnego.',
  'help.guide.tour-paddle-portage.title': 'Przenieś łódź wokół przeszkody',
  'help.guide.tour-paddle-portage.tip.2':
    'Na ostatnim punkcie Przenieś łódź od tego miejsca zacznie działać, gdy ustawisz następny punkt. Wiersz pokaże Przenoszenie od tego miejsca, a jego krzyżyk, Jednak nie przenosić, to cofa.',
  'help.guide.tour-paddle-lock.step.4':
    'Wpisz minuty dla Oczekiwanie i dla Śluzowanie. Gdy oba pola są wypełnione, karta pokazuje ich sumę.',
  'help.guide.tour-paddle-time.step.2':
    'Pasek pokazuje trasę od początku do końca: wodę, przenoski na brązowo i śluzy jako kreski. Przeszkody na trasie to znaczniki, które możesz kliknąć, aby znaleźć je na mapie.',
  'help.guide.tour-paddle-wind.title': 'Sprawdź wiatr w dniu spływu',
  'help.guide.tour-paddle-wind.tip.3':
    'W wietrzny dzień, gdy trasa prowadzi przez jezioro, karta oferuje Zaplanuj blisko brzegu, co wyznacza trasę przez jeziora wzdłuż brzegu.',
  'help.guide.tour-paddle-checklist.step.4':
    'Kliknij pozycję. Mapa przesunie się do niej: przy przeszkodzie otworzy się jej karta z Twoją decyzją, a przy własnej przenosce lub śluzie zostanie zaznaczony jej punkt.',
  'help.guide.tour-paddle-track-marks.title': 'Oznacz przenoski i śluzy na nagranym śladzie spływu',
  'help.guide.tour-paddle-track-marks.step.7': 'Otwórz karty, wpisz minuty i kliknij Zapisz.',
  'help.ctx.trip-tour-horse.bullet.2':
    'Trasa otwiera się we własnym oknie: wybierz odcinek i Kierunek, w którym nim jedziesz, sprawdź Dostęp dla koni, a potem kliknij Przejmij odcinek.',
  'help.guide.tour-horse-plan.step.3':
    'Na karcie Szlaki konne kliknij Szukaj w widoku mapy. Wszystkie oznakowane szlaki konne w widoku zostaną tam wypisane wraz z długością.',
  'help.guide.tour-horse-plan.tip.3':
    'Przesunąłeś mapę po wyszukiwaniu? Przycisk zmieni się na Przeszukaj ten widok. Jeśli widok jest zbyt duży, TREK najpierw poprosi o przybliżenie.',
  'help.guide.tour-horse-gap.step.4':
    'Na karcie Punkty trasy most jest oznaczony Ręczny, niesprawdzony, wraz z długością. Najedź na niego, aby przeczytać dlaczego.',
  'help.guide.tour-horse-recorded.step.2':
    'Otworzy się Podgląd importu i nic nie jest jeszcze zapisane. W sekcji Importuj jako ustaw Rodzaj wycieczki na Przejażdżka konna. Trzy plakietki informują, co import zachowuje, a czego nie wylicza.',
  'help.guide.dateless-trip.goal': 'Zacznij planować, zanim wiesz, kiedy jedziesz.',
  'help.guide.trip-reminder.step.3': 'Kliknij Aktualizuj.',
  'help.guide.upcoming-reservations.goal':
    'Zobacz, co masz zarezerwowane w najbliższym czasie we wszystkich podróżach, i otwórz podróż, do której rezerwacja należy.',
  'help.guide.log-day.tip.3':
    'Dnia oznaczonego jako cały dzień wolny w firmie nie można zapisać. W połowie dnia wolnego w firmie dzień urlopu kosztuje tylko 0,5.',
  'help.guide.half-company-holiday.goal':
    'Daj wszystkim wolne popołudnie, na przykład w Wigilię, bez zamykania całego dnia.',
  'help.guide.public-holidays.tip.2': 'Najedź na święto w siatce, aby zobaczyć jego nazwę.',
  'help.guide.edit-holiday-calendar.step.3':
    'Zmień kraj lub region na jego listach albo kliknij kosz, aby usunąć kalendarz.',
  'help.guide.person-color.step.2': 'Wybierz kolor. Zapisze się od razu, a okno się zamknie.',
  'help.guide.answer-fusion-request.goal':
    'Zdecyduj, czy połączyć swój plan urlopów z planem osoby, która Cię zaprosiła.',
  'help.guide.log-for-partner.goal':
    'Wpisz dzień wolny osobie połączonej z Twoim planem, na przykład gdy sama Cię o to poprosi.',
  'help.guide.dissolve-fusion.goal': 'Rozdziel połączony plan z powrotem na osobne plany.',
  'help.guide.country-places.step.1': 'Wyszukaj odwiedzony kraj i wybierz go. Jego karta pojawi się w panelu na dole.',
  'help.guide.tour-activity-stats.step.3':
    'Odczytaj liczby: dystans, z liczbą wycieczek w rogu, a potem Suma podejść i Suma zejść. Przy Wszystkie typy poniżej widać trzy rodzaje wycieczek, które robiłeś najczęściej, każdy z liczbą i dystansem.',
  'help.guide.move-to-list.step.1': 'Kliknij ikonę pola wyboru, Zaznacz, w rzędzie filtrów i zaznacz miejsca.',
  'help.guide.tour-collection-add-to-trip.step.2':
    'W sekcji Do podróży wybierz podróż. Podróż, do której nie możesz dodawać wycieczek, jest przygaszona.',
  'help.guide.tour-collection-manage.goal':
    'Zobacz, jakie wycieczki zawiera lista i skąd pochodzą, i usuń te, których już nie potrzebujesz.',
  'help.guide.entry-draft.goal': 'Napisz wpis teraz i ukryj go we wspólnym dzienniku, dopóki nie będzie gotowy.',
  'help.guide.journey-map-layers.step.2':
    'Kliknij (i) na końcu paska, aby zobaczyć legendę mapy: wyjaśnia każdą pinezkę, kropkę i linię.',
  'help.guide.journey-keep-route.step.2':
    'Sprawdź Strefa czasowa dnia, która decyduje, gdzie dzień się zaczyna i kończy, oraz nagranie: dystans, przedział czasu, fragmenty i luki.',
  'help.guide.journey-day-stays.step.2':
    'Kliknij Napisz wpis w dzienniku przy pobycie. Wpis zostanie dodany do tego dnia o godzinie przyjazdu, z nazwą i położeniem pobytu.',
  'help.guide.journey-take-over-day.step.2':
    'Zaznacz pobyty do zachowania i popraw ich nazwy. Połącz w jeden wpis między dwoma zaznaczonymi pobytami scala je, a Zostaw osobno ponownie je rozdziela.',
  'help.guide.journey-auto-prepare.step.1':
    'Kliknij ⋯ w prawym górnym rogu nagłówka, aby otworzyć Ustawienia dziennika podróży.',
  'help.guide.photo-location.step.1':
    'Kliknij ⋯ w prawym górnym rogu nagłówka, aby otworzyć Ustawienia dziennika podróży.',
  'help.guide.share-public.tip.3':
    'Szkice nigdy nie pojawiają się pod linkiem, a nagrane trasy są widoczne tylko w dniach z opublikowanym wpisem.',
  'help.ctx.settings-plugins.title': 'Wtyczki',
  'help.ctx.settings-about.bullet.2':
    'Zgłoś błąd i Zaproponuj funkcję otwierają projekt na GitHubie, a Wiki otwiera dokumentację.',
  'help.guide.map-provider.tip.3':
    'Na mapie GL kliknij prawym przyciskiem i przeciągnij, aby ją obracać i przechylać. Środkowy przycisk myszy dodaje miejsce.',
  'help.guide.web-push-device.step.1':
    'W sekcji Powiadomienia push na tym urządzeniu kliknij Włącz na tym urządzeniu i zezwól na powiadomienia, gdy przeglądarka o to zapyta. Wyślij test sprawdza, czy powiadomienie dociera.',
  'help.guide.connect-airtrail.title': 'Połącz swój AirTrail',
  'help.guide.connect-dawarich.title': 'Połącz swój Dawarich',
  'help.guide.tour-connect-wanderer.title': 'Połącz swój wanderer',
  'help.guide.tour-connect-wanderer.tip.3': 'Rozłącz po prawej stronie ponownie usuwa token.',
  'help.guide.tour-wanderer-watch.tip.3':
    'Kanały dla tych wskazówek wybierasz w Powiadomienia, w wierszu wanderer: wskazówki dotyczące twoich szlaków.',
  'help.guide.plugin-settings.tip.1':
    'Te ustawienia dotyczą tylko Ciebie. Inni członkowie konfigurują wtyczkę dla siebie.',
  'help.guide.offline-conflicts.step.3':
    'Zmiany, które serwer wciąż odrzuca, pojawiają się w Pamięć podręczna offline jako Nieudane zmiany: Spróbuj ponownie wysyła je jeszcze raz, a Odrzuć zachowuje wersję serwera.',
  'help.ctx.admin-notifications.bullet.4':
    'Ustawienia domyślne dla użytkowników, na dole: dla każdego zdarzenia i kanału Włączone, Wył. lub Zablokowane dla wszystkich, którzy nic tu nie zmienili.',
  'help.guide.default-user-settings.step.2':
    'Przy polu, które ustawisz, pojawia się obok nazwy link przywróć. Przywraca on wbudowaną wartość domyślną TREK.',
  'help.guide.own-routing-engine.title': 'Używaj własnych serwerów tras',
  'help.guide.admin-passkeys.result':
    'Strona logowania oferuje Zaloguj się kluczem dostępu, a użytkownicy mogą dodawać klucze dostępu w swoich ustawieniach.',
  'help.guide.rotate-jwt-secret.goal': 'Zakończ wszystkie sesje po podejrzeniu wycieku.',
  'help.guide.notification-defaults.result':
    'Każdy, kto nie zmienił danej komórki, zaczyna od Twojego wyboru, a zablokowane komórki są w jego ustawieniach pokazane jako zamknięte.',
  'help.ctx.notifications.bullet.3':
    'Każde powiadomienie mówi, kto co zrobił i gdzie. Nieprzeczytane mają zabarwione tło. Przycisk pod powiadomieniem, na przykład Zobacz podróż lub Zobacz Vacay, przenosi Cię we właściwe miejsce i oznacza je jako przeczytane.',
  'help.guide.read-notifications.tip.1':
    'Dzwonek jest na każdym ekranie z paskiem nawigacji, a jego licznik odświeża się sam, gdy pojawia się coś nowego.',
  'help.guide.filter-notifications.tip.1':
    'Strona wczytuje starsze powiadomienia podczas przewijania w dół, więc po pierwszym ekranie nic nie jest ucięte.',
  'help.guide.mark-notifications-read.result':
    'Żadne powiadomienie nie ma już zabarwionego tła, a czerwony licznik na dzwonku znika.',
  'help.guide.notification-settings.title': 'Wybierz, o czym chcesz być powiadamiany',
  'help.guide.link-journal.step.1': 'Kliknij Ustawienia podróży obok nazwy podróży i wybierz Dziennik po lewej.',
  'help.guide.dawarich-stays.tip.1':
    'Nic nie trafia do podróży, dopóki nie klikniesz Dodaj miejsce. Miejsce dodane z pobytu ma w szczegółach adnotację: Dodane z Twoich zapisów Dawarich.',
  'help.guide.leave-stop-off-route.title': 'Pomiń przystanek w trasie',
  'help.guide.move-booking-day.step.1':
    'Najedź na wiersz rezerwacji w dniu: uchwyt po jego lewej stronie pokazuje, że można go przeciągać.',
  'help.guide.place-image-from-file.tip.1':
    'Dostępne są tylko pliki JPG, PNG, GIF i WebP. Bilet w formacie PDF się nie pojawi.',
  'help.guide.place-own-hours.step.4':
    'Przyciski po prawej stronie Godziny otwarcia: przycisk kopiowania wpisuje godziny z poniedziałku we wszystkie dni, a X ponownie usuwa Twoje godziny. Tam, gdzie TREK znalazł własne godziny, Przejmij ze szczegółów miejsca przywraca je.',
  'help.guide.confirm-stay-booking.step.2':
    'Rezerwacja otworzy się nad planem. Pierwszy przycisk w jej nagłówku pokazuje status.',
  'help.ctx.trip-map.bullet.9':
    'Każda wycieczka z podróży to linia w jej kolorze, z pinezką w miejscu startu. Kliknij linię, aby otworzyć kartę wycieczki. W dniu z wycieczką trasa dnia prowadzi do miejsca startu wycieczki i biegnie dalej od jej końca. Oko obok wycieczki na liście Wycieczki, Ukryj na mapie, usuwa jej linię z Twojej mapy.',
  'help.guide.tour-map-lines.result':
    'Wycieczki, które chcesz widzieć, są na mapie, każda w swoim kolorze, a ukryta jest na liście Wycieczki przygaszona.',
  'help.guide.car-stops.step.2':
    'Kliknij przycisk typu w nagłówku i wybierz Samochód. Formularz się zmieni: Data i Godzina rozpoczęcia zamienią się w Odbiór i Godz. odbioru, Data końca i Godzina zakończenia w Zwrot i Godz. zwrotu, a pod Od i Do pojawi się Przystanki po drodze.',
  'help.guide.transport-details.goal':
    'Zobacz wszystkie szczegóły przejazdu w jednym miejscu, skopiuj jego kod rezerwacji, zmień mu nazwę albo przejdź do niego na mapie.',
  'help.guide.transport-details.tip.2':
    'Escape lub kliknięcie poza szczegółami zamyka je. Jeśli otwarte jest Zmień nazwę albo pytanie o usunięcie, najpierw zamyka się ono.',
  'help.guide.export-transports-csv.tip.1':
    'Ikona jest na pasku tylko wtedy, gdy na karcie jest co najmniej jeden przejazd.',
  'help.guide.group-sort-bookings.step.1':
    'W widoku Karty lub Lista kliknij Opcje widoku, czyli suwaki za trzema ikonami widoków.',
  'help.guide.create-booking.tip.4':
    'Offline rezerwacja zapisuje się na tym urządzeniu i synchronizuje po powrocie online. Nowe pliki wymagają połączenia, więc usuń je albo zapisz później. Jeśli przez pomyłkę klikniesz poza formularzem lub naciśniesz Escape, TREK zapyta Odrzucić zmiany?, zanim cokolwiek z tego, co wpisałeś, przepadnie.',
  'help.guide.booking-on-map.tip.2': 'Pobyt otwiera się na swojej pierwszej nocy.',
  'help.guide.export-bookings-csv.step.3':
    'Kliknij Eksportuj jako arkusz kalkulacyjny (CSV), czyli ikonę arkusza za Opcje widoku.',
  'help.guide.arrange-packing-list.step.3':
    'Od A do Z na samym prawym końcu rzędu z Udostępnione i Moja lista pokazuje przedmioty z każdej listy w kolejności alfabetycznej, więc od razu widać, czy coś już na niej jest. Kliknij ponownie, aby wrócić do własnej kolejności.',
  'help.guide.count-packed-pieces.step.1':
    'Kliknij plakietkę z ilością w wierszu, czyli małą liczbę z x za nią, wpisz, ile bierzesz, na przykład 5, i naciśnij Enter.',
  'help.guide.expense-receipts.step.3':
    'Kliknij Zapisz na dole okna. Pliki zostaną przesłane razem z wydatkiem i pojawią się także w Pliki podróży.',
  'help.guide.files-sync-settings.step.1':
    'Kliknij Synchronizacja dokumentów na prawym końcu paska. Jeśli podróż jest powiązana, po prawej otworzy się karta Twojego magazynu. Gdy magazynów jest więcej, kliknij ten, który chcesz, w sekcji Ta podróż po lewej.',
  'help.guide.files-sync-settings.tip.3':
    'Natychmiastowe aktualizacje, czyli link z przyciskiem Kopiuj obok, są tylko dla magazynów, w których TREK nie może sam subskrybować zmian. Wklej link w magazynie, a zmiany będą docierać od razu, a nie przy następnym sprawdzeniu.',
  'help.guide.manage-notes.step.1':
    'Kliknij trzy kropki w nagłówku karty notatki (Więcej opcji). W menu są Rozwiń, Przypnij, Edytuj i Usuń.',
  'help.guide.note-categories.title': 'Posortuj notatki według kategorii',
  'help.guide.note-categories.result':
    'Notatki mają nowe nazwy i kolory, a karta Notatki pokazuje tylko wybraną kategorię.',
  'help.guide.roadtrip-stops.tip.5':
    'Przystanek z godziną zakończenia w planie dnia trwa do tej godziny. Jego okno podaje, kiedy przejazd rusza dalej, a Usuń godzinę zakończenia pozwala znów ustawić długość samodzielnie.',
  'help.guide.roadtrip-reorder.tip.2':
    'Zarezerwowane przejazdy i ich terminale zostają tam, gdzie umieszcza je rezerwacja. Przeciągać można tylko miejsca.',
  'help.guide.roadtrip-overnight.step.2':
    'Przy hotelu zamiast plusa widać ikonę łóżka. Kliknij ją, Dodaj jako nocleg, aby otworzyć okno Dodaj jako przystanek na noc. Kemping ma zwykły przycisk Dodaj.',
  'help.guide.roadtrip-stop-fill.goal':
    'Ustaw jednemu przystankowi z tankowaniem lub ładowaniem własny poziom napełnienia, na przykład 80 % na szybkiej ładowarce albo 100 % na noc.',
  'help.guide.roadtrip-bookings.goal':
    'Zobacz, w którym miejscu przejazdu mieści się zarezerwowany przejazd i na kiedy musisz tam dotrzeć.',
  'help.guide.roadtrip-bookings.tip.3':
    'Przejazd, który nie wypada w żadnym dniu podróży, nie należy do trasy samochodowej. Notatka na górze paska go wskazuje, a Otwórz rezerwację pozwala nadać mu datę.',
  'help.guide.roadtrip-google-import.step.4':
    'W sekcji Dzień wybierz dzień, do którego trafią przystanki, i kliknij Importuj.',
  'help.guide.roadtrip-hazards.step.2':
    'W sekcji Aktualne ostrzeżenia, na dole prawej kolumny okna, włącz Pokaż obszary zagrożeń, a potem kliknij Zamknij.',
  'help.ctx.trip-tours.bullet.1':
    'Przełącznik Miejsca i Wycieczki na górze prawej kolumny zamienia listę miejsc na listę wycieczek. Jest tylko wtedy, gdy dodatek Wycieczki jest włączony, a wycieczki wtedy nigdy nie pojawiają się na liście Miejsca.',
  'help.guide.tour-show-list.step.1':
    'Na karcie Plan kliknij Wycieczki w przełączniku na górze prawej kolumny. Kolumna pokaże teraz wycieczki zamiast miejsc.',
  'help.guide.tour-show-list.result':
    'Prawa kolumna pokazuje wycieczki podróży, a ta, którą kliknąłeś, jest otwarta na swojej karcie.',
  'help.guide.tour-add-to-day.tip.1':
    'Przeciągnięcie wycieczki z etapami na dzień wyświetla to samo pytanie w małym oknie. Anuluj zostawia plan bez zmian.',
  'help.guide.tour-day-times.step.2':
    'Ustaw Początek i zostaw Koniec puste. Linia pod polami podaje koniec wyliczony przez TREK: początek plus czas wycieczki.',
  'help.guide.tour-remove-from-day.title': 'Usuń wycieczkę z dnia',
  'help.guide.tour-filter-list.title': 'Filtruj listę wycieczek',
  'help.guide.tour-filter-list.tip.3':
    'Jeśli nic nie zostanie, lista pokazuje Żadna wycieczka nie pasuje do tych filtrów, a Wyczyść filtry czyści je wszystkie. Filtry zmieniają tylko to, co widać na liście, nigdy samą wycieczkę ani dzień.',
  'help.guide.tour-hide-on-map.tip.2':
    'Mapa w telefonie zawsze pokazuje wszystkie wycieczki, a karta Wycieczki nie ma oka: ukrywanie działa tutaj, na karcie Plan.',
  'help.guide.tour-import-plan-tab.tip.2':
    'Import zostaje na liście i nie otwiera się w planerze. Dodaj go do dnia okrągłym +, albo otwórz kartę Wycieczki, aby obejrzeć go tam.',
  'help.ctx.trip-tour-detail.bullet.5':
    'Karta służy do czytania i do tego, co towarzyszy wycieczce. Samą trasę zmienia się na karcie Wycieczki: otwórz ją i kliknij wycieczkę w sekcji Wycieczki w tej podróży. Tam też usuwa się wycieczkę, nie tutaj.',
  'help.guide.tour-detail-read.step.6':
    'Przewiń dalej do Opis i Notatki, a potem do Pochodzenie: zaplanowano w TREK, plik, z którego zaimportowano, albo szlak wanderer, z którego pochodzi, z datą.',
  'help.guide.tour-rename-colour.title': 'Zmień nazwę wycieczki i jej kolor',
  'help.guide.tour-rename-colour.result':
    'Wycieczka ma nową nazwę w całej podróży, a jej linia jest rysowana wybranym kolorem.',
  'help.guide.tour-take-along.tip.3':
    'Plik pochodzi z serwera, więc potrzebne jest połączenie. Wycieczkę utworzoną offline można pobrać po jej synchronizacji.',
  'help.guide.tour-copy-keep.step.4': 'Wybierz listę w sekcji Kolekcja, sprawdź Nazwa w kolekcji i kliknij Zachowaj.',
  'help.guide.tour-packing-link.step.1':
    'Otwórz kartę wycieczki i przewiń do sekcji Lista pakowania. Kliknij Połącz listę pakowania.',
  'help.guide.tour-packing-link.result':
    'Jesteś na liście pakowania na karcie Listy, a karta wycieczki pokazuje każdy przedmiot, który zaznaczysz.',
  'help.guide.tour-files.result': 'Pliki są dołączone do wycieczki i otwierają się z jej karty.',
  'help.guide.tour-activity-link.tip.1':
    'Plan zostaje bez zmian. Ślad jest tylko powiązany, a Odłącz ponownie usuwa to powiązanie.',
  'help.guide.tour-activity-compare.step.3':
    'Kliknij Porównaj na mapie, aby narysować rzeczywisty ślad linią kropkowaną obok planu. Zakończ porównanie ponownie go usuwa.',
  'help.guide.tour-origin-check.step.2':
    'Zaimportowano podaje dzień importu. Tutaj pokazuje aktualny stan: Jak zaimportowano, Edytowano w TREK albo Przeplanowano, nagrany ślad zachowany.',
  'help.ctx.trip-tour-planner.bullet.1':
    'Karta Wycieczki znajduje się na pasku kart podróży zaraz po Plan, gdy dodatek Wycieczki jest włączony. Jest dostępna na komputerze i tablecie. Na telefonie wycieczki można oglądać i dodawać do dni z karty Plan, ale nie można ich rysować.',
  'help.guide.tour-open-workspace.step.1':
    'Kliknij Wycieczki na pasku kart podróży, zaraz po Plan. Mapa wypełni ekran, a po obu stronach będzie pasek.',
  'help.guide.tour-open-workspace.tip.2':
    'Upuść pliki GPX, KML lub KMZ w dowolnym miejscu tej karty, aby zaimportować je jako wycieczki podróży.',
  'help.guide.tour-draw-route.step.4':
    'Na dole mapy pojawi się Punkt ustawiony. Cofnij obok niego ponownie usuwa punkt.',
  'help.guide.tour-type-profile.title': 'Wybierz rodzaj wycieczki',
  'help.guide.tour-type-profile.result': 'Trasa wycieczki jest wyznaczana pod wybrany rodzaj i profil.',
  'help.guide.tour-edit-points.step.6':
    'Cofnij zmianę punktu i Ponów zmianę punktu w nagłówku paska cofają lub ponawiają zmiany, jedna po drugiej.',
  'help.guide.tour-shaping-points.step.3':
    'W sekcji Punkty trasy jest wypisany z plakietką Punkt kształtujący i bez numeru, więc przystanki zachowują swoje numery.',
  'help.guide.tour-loop-reverse.step.1':
    'Kliknij Powrót do startu w nagłówku karty Punkty trasy. Wycieczka dostanie ostatni odcinek z powrotem do pierwszego punktu.',
  'help.guide.tour-leg-by-hand.goal':
    'Połącz dwa punkty linią prostą tam, gdzie program nie znajduje drogi, albo wyznacz odcinek od nowa.',
  'help.guide.tour-trip-places.title': 'Użyj miejsca z podróży jako przystanku',
  'help.guide.tour-trip-places.tip.3': 'Inne wycieczki z podróży nigdy nie są proponowane jako przystanek.',
  'help.guide.tour-details-times.tip.1': 'Czasy możesz wpisywać jako 2:56, 2 h 56 lub 176 minut.',
  'help.guide.tour-save.step.3':
    'Kliknij Zapisz na dole lewego paska. Pojawi się Wycieczka zapisana, a tytuł paska zmieni się na Edytuj wycieczkę.',
  'help.guide.tour-edit-saved.step.1':
    'Kliknij wycieczkę w sekcji Wycieczki w tej podróży. Otworzy się w lewym pasku jako Edytuj wycieczkę, a mapa pokaże jej trasę.',
  'help.guide.tour-summary-profile.title': 'Odczytaj podsumowanie wycieczki i profil wysokościowy',
  'help.guide.tour-summary-profile.tip.3':
    'Spływ nie pokazuje wysokości, bo na wodzie dostępne byłyby tylko wysokości brzegów.',
  'help.guide.tour-list-manage.step.5':
    'Wybierz Niezaplanowane dla wycieczek, które nie są jeszcze w żadnym dniu, albo zawęź według Źródło, Limit trasy lub Typ. Każda linia pokazuje, ile wycieczek do niej pasuje, a podsumowania zmieniają się razem z filtrem.',
  'help.guide.tour-delete.step.2':
    'Przeczytaj, co zostanie usunięte razem z wycieczką: trasa, edytowalne punkty trasy i przypisania do dni. Kliknij Usuń na zawsze.',
  'help.guide.tour-saved-elsewhere.step.2': 'Wczytaj nowszą zastępuje Twoje zmiany nowszą wersją, po potwierdzeniu.',
  'help.ctx.trip-tour-import.bullet.1':
    'Przycisk + na górze sekcji Wycieczki w tej podróży to Dodaj trasę. Oferuje Importuj GPX lub KML, Importuj spacer z Google Maps i Przejmij trasę z innej podróży. Pliki można też upuścić w dowolnym miejscu karty Wycieczki.',
  'help.guide.tour-import-gpx.step.2':
    'Wybierz Importuj GPX lub KML i wskaż jeden lub więcej plików .gpx, .kml lub .kmz, do 10 MB każdy.',
  'help.guide.tour-import-gpx.tip.5':
    'Plik bez wysokości pokazuje Brak wysokości w pliku. Linia i dystans są nadal poprawne, ale suma podejść i zejść pozostaje nieznana.',
  'help.guide.tour-view-import.tip.2':
    'Ikona pobierania w nagłówku ponownie zapisuje import jako plik GPX, a zakładka zapisuje go w kolekcji.',
  'help.guide.tour-plan-from-import.step.4':
    'Wycieczka otworzy się w edytorze razem z punktami trasy. Zmień ją, jeśli chcesz, i kliknij Zapisz na dole kolumny.',
  'help.guide.tour-restore-recorded.step.1':
    'W sekcji Wycieczki w tej podróży kliknij wycieczkę, którą zaplanowałeś od nowa. Karta Zarejestrowany ślad w edytorze informuje, że zachowano ślad, z którym została nagrana.',
  'help.guide.tour-take-over.step.1':
    'Otwórz kartę Wycieczki w podróży, do której ma trafić wycieczka. Na górze sekcji Wycieczki w tej podróży kliknij + (Dodaj trasę).',
  'help.guide.tour-take-over.tip.3':
    'Przejęcie wycieczki wymaga połączenia. Jeśli w edytorze są niezapisane zmiany, kopia i tak trafi na listę, ale się nie otworzy, żeby nie przeszkadzać w Twojej pracy.',
  'help.guide.tour-import-wanderer.tip.1':
    'Przycisk pojawia się, gdy wanderer jest połączony w Ustawienia, Integracje. Wcześniej lista oferuje Połącz w ustawieniach.',
  'help.ctx.trip-tour-map.bullet.2':
    'Za separatorem na pasku są przełączniki zależne od rodzaju wycieczki: Ustawiaj punkty podczas edycji wycieczki, Ferraty na wędrówce, Znaki nawigacyjne na spływie i trasy narciarskie na wycieczce narciarskiej. 3D na końcu pokazuje wycieczkę na trójwymiarowym krajobrazie.',
  'help.guide.tour-map-layers.step.3':
    'Na wędrówce kliknij Turystyka, aby zobaczyć oznakowane szlaki i ich numery. Przy wycieczce rowerowej zamiast tego jest Rower z trasami rowerowymi. Satelita pokazuje zdjęcia lotnicze, a Mapa wraca do mapy standardowej.',
  'help.guide.tour-along-search.step.2':
    'Kliknij Czego szukać i zaznacz rodzaje, które chcesz, do sześciu naraz: Punkty widokowe, Szczyty, Schroniska i wiaty, Woda pitna, Jedzenie i inne. Lista proponuje to, co pasuje do rodzaju wycieczki, a nowa wycieczka zaczyna z trzema zaznaczonymi.',
  'help.guide.tour-along-add-stop.title': 'Dodaj miejsce wzdłuż wycieczki jako przystanek',
  'help.guide.tour-along-add-stop.tip.2':
    'Miejsce, które staje się nowym końcem, jest oznaczone Wydłuża trasę: dotychczasowy koniec przestaje nim być, a wycieczka prowadzi dalej do tego miejsca.',
  'help.guide.tour-3d-terrain.step.5': 'Kliknij 3D ponownie, aby wrócić do płaskiej mapy i planować dalej.',
  'help.guide.tour-3d-flyover.step.2':
    'W sekcji Prędkość wybierz 1×, 2× lub 4×. Przy 1× większość wycieczek trwa od początku do końca około 45 sekund.',
  'help.guide.tour-map-overlays.goal':
    'Pokaż na mapie trasy narciarskie i wyciągi albo boje i znaki portowe, gdy planujesz wycieczkę narciarską lub spływ.',
  'help.guide.tour-map-overlays.tip.3':
    'Gdy warstwa przestaje się wczytywać, jej przełącznik pokazuje ! i wyjaśnienie. Mapa i Twoja trasa działają dalej bez niej.',
  'help.guide.tour-multi-day.title': 'Zaplanuj wycieczkę na kilka dni',
  'help.guide.tour-multi-day.tip.1':
    'Zakończ etap tutaj działa także na wycieczce jednodniowej: wtedy wycieczka automatycznie staje się wielodniowa. Pierwszy i ostatni przystanek ani punkt kształtujący nie mogą kończyć etapu.',
  'help.guide.tour-stages-on-days.step.2': 'Wybierz dzień, w którym zaczynasz pierwszy etap.',
  'help.guide.tour-stages-on-days.tip.4':
    'W planie dnia każdy etap widać jako Etap N z własnym dystansem i czasem. Cofnij nad dniami na karcie Plan cofa całe rozłożenie jednym krokiem.',
  'help.ctx.trip-tour-hike.bullet.5':
    'Na wędrówce Ferraty w rzędzie przycisków mapy w lewym dolnym rogu pokazuje pobliskie ferraty. Karta ferraty dodaje ją do trasy jako osobny odcinek.',
  'help.guide.tour-hike-plan.step.5':
    'W sekcji Szczegóły otwórz Maksymalna trudność szlaku i wybierz, jak trudne mogą być szlaki, od T1 (Turystyka) do T6 (Trudna turystyka wysokogórska). Trasa zostanie zaplanowana ponownie w tych granicach.',
  'help.guide.tour-hike-trail-details.goal':
    'Przeczytaj, co OpenStreetMap zapisuje o drogach, którymi prowadzi wędrówka, i znajdź te odcinki na mapie.',
  'help.guide.tour-hike-trail-details.tip.2':
    'Stopień trudności wyższy niż limit wędrówki ma w swoim wierszu plakietkę Powyżej limitu.',
  'help.guide.tour-hike-round.step.5':
    'Kliknij Wybierz tę pętlę, a gdy TREK zapyta, czy zastąpić zaplanowaną trasę, kliknij Zastąp.',
  'help.guide.tour-hike-compare-ways.step.2':
    'Inne drogi dla tego odcinka otworzą się nad mapą jako Obecna droga i Droga A, Droga B i tak dalej. Każda jest narysowana na mapie w swoim kolorze, a najechanie na wiersz podświetla jego linię.',
  'help.guide.tour-ferrata-add.goal': 'Znajdź ferraty w okolicy swojej wędrówki i włącz jedną z nich do trasy.',
  'help.guide.tour-ferrata-add.tip.2':
    'Ferraty są dostępne tylko przy wędrówkach. Ferrata, którą trasa już pokonuje, ma na swojej karcie Część wycieczki zamiast Dodaj do wycieczki.',
  'help.guide.tour-run-plan.step.4':
    'Ustaw start i koniec na mapie albo wybierz je przez Miejsca podróży. Pod tempem widać czas biegu: dystans razy tempo.',
  'help.guide.tour-run-ways.goal': 'Sprawdź, jaka część trasy biegowej jest nieutwardzona i jak trudne są jej ścieżki.',
  'help.ctx.trip-tour-walk.summary':
    'Piesza wycieczka od przystanku do przystanku, planowana na karcie Wycieczki: jak długo zostajesz przy każdym przystanku, które z nich są ważne, zabytki po drodze oraz kiedy dotrzesz do każdego w dniu spaceru, sprawdzone względem godzin otwarcia.',
  'help.guide.tour-walk-plan.step.1':
    'Kliknij Zaplanuj nową wycieczkę na górze lewej kolumny, potem otwórz Rodzaj wycieczki i wybierz Spacer po mieście / zwiedzanie.',
  'help.guide.tour-walk-plan.tip.3':
    'Odłącz od miejsca, w menu Więcej działań przystanku, usuwa tylko powiązanie z miejscem z podróży. Samo miejsce zostaje w podróży.',
  'help.guide.tour-walk-sights.step.5':
    'Kliknij Dodaj jako przystanek. Komunikat poda, o ile dłuższy będzie spacer, a obok będzie przycisk Cofnij.',
  'help.guide.tour-walk-day-times.step.2':
    'Ustaw godzinę startu w tym dniu: na karcie Plan kliknij prawym przyciskiem spacer w dniu, wybierz Edytuj i wpisz Początek.',
  'help.guide.tour-walk-google-import.title': 'Zamień trasę pieszą z Google Maps w spacer po mieście',
  'help.guide.tour-walk-google-import.tip.3':
    'Przejmowane są tylko przystanki, bez linii narysowanej w Google Maps. Rozwinięcie krótkiego linku maps.app.goo.gl wymaga połączenia.',
  'help.guide.tour-walk-check-off.tip.1':
    'Oznaczenia zapisują się osobno dla każdego dnia: otwórz spacer z jego dnia w planie, a nie z listy wycieczek.',
  'help.ctx.trip-tour-bike.bullet.3':
    'Karta Nawierzchnia i drogi pod Punkty trasy pokazuje, po czym prowadzi trasa: nawierzchnie, rodzaje dróg i znany udział odcinków nieutwardzonych. Kliknij wiersz, aby podświetlić jego odcinki na mapie.',
  'help.guide.tour-bike-profile.step.5':
    'Przeczytaj Czas jazdy (szacowany) w Podsumowanie wycieczki po prawej. Najedź na jego kropkę informacyjną, aby zobaczyć, jak jest obliczany.',
  'help.guide.tour-bike-surfaces.title': 'Zobacz nawierzchnie trasy rowerowej',
  'help.guide.tour-bike-surfaces.tip.2':
    'W profilu Szosa ostrzeżenie nad słupkami podaje, jaka część trasy jest nieutwardzona. Pokaż na mapie zaznacza te odcinki.',
  'help.guide.tour-bike-mtb-grades.result':
    'Mapa oznacza szlaki wybranego stopnia i wiesz, które odcinki wycieczki są trudne.',
  'help.ctx.trip-tour-ski.bullet.2':
    'Pod dyscypliną są opcje wyznaczania tras narciarskich, tylko te, z których korzysta Twoja dyscyplina: Najtrudniejsze trasy, Preferuj, Tempo, przełączniki takie jak Korzystaj z wyciągów oraz Pomiń dla rodzajów wyciągów, z których nie chcesz korzystać. Każda zmiana powoduje ponowne zaplanowanie wycieczki.',
  'help.guide.tour-ski-plan.step.3':
    'W sekcji Dyscyplina wybierz, co będziesz robić: Zjazdowe, Snowboard, Biegowe, Skitury, Rakiety śnieżne lub Wędrówka zimowa. Nic nie jest wybrane z góry, a bez wyboru wycieczki nie da się zapisać.',
  'help.guide.tour-ski-plan.result':
    'Zapisana wycieczka Narty i zima w sekcji Wycieczki w tej podróży, jej odcinki prowadzą wzdłuż zmapowanych tras, wyciągów i szlaków, a czas jest obliczony w Podsumowanie wycieczki.',
  'help.guide.tour-ski-options.tip.1': 'Każda zmiana powoduje ponowne zaplanowanie wycieczki, odcinek po odcinku.',
  'help.guide.tour-ski-fix-leg.step.3':
    'Jeśli żadna poprawka Ci nie odpowiada, kliknij Rysuj prosto. Odcinek stanie się linią prostą między swoimi dwoma punktami.',
  'help.guide.tour-ski-summary.step.1':
    'Pod punktami trasy znajdź kartę Trasa narciarska. Kliknij jej tytuł, aby ją zwinąć lub ponownie rozwinąć.',
  'help.guide.tour-ski-pistes-layer.title': 'Pokaż trasy narciarskie na mapie',
  'help.guide.tour-ski-pistes-layer.result': 'Trasy są narysowane pod wycieczką i możesz odczytać ich kolory.',
  'help.guide.tour-ski-import.step.6':
    'W oknie Sklasyfikuj ślad narciarski wybierz właściwą dyscyplinę lub technikę i kliknij Zapisz.',
  'help.ctx.trip-tour-paddle.bullet.2':
    'Rola każdego punktu jest pokazana na plakietce: Wodowanie, Wyjście z wody, Ponowne wodowanie lub Końcowe wyjście z wody. Pod punktem widać, co po nim następuje: odcinek narysowany ręcznie, przenoska, śluza albo powód, dla którego nie dało się zaplanować odcinka.',
  'help.guide.tour-paddle-setup.step.2':
    'Otwórz Rodzaj wycieczki i wybierz Spływ, Na wodzie, kajakiem, kanadyjką lub SUP-em.',
  'help.guide.tour-paddle-setup.tip.3':
    'Wzdłuż trasy na spływie szuka najpierw: Miejsca wodowania, Wypożyczalnia łodzi i Woda pitna.',
  'help.guide.tour-paddle-water-route.step.4':
    'Odcinek, którego TREK nie zdołał zaplanować, robi się czerwony i podaje powód, na przykład brak danych o wodzie dla tego obszaru. Kliknij Rysuj prosto, aby na razie narysować go ręcznie.',
  'help.guide.tour-paddle-portage.goal':
    'Oznacz odcinek, na którym niesiesz łódź, żeby liczył się jak ląd, z czasem na wysiadanie z łodzi i ponowne wsiadanie.',
  'help.guide.tour-paddle-portage.tip.3':
    'Przenoszenie liczy się przy 2 km/h, dopóki nie ustawisz własnego Tempo przenoszenia na karcie Szacowany czas.',
  'help.guide.tour-paddle-lock.tip.1':
    'TREK nie zna rozkładów pracy śluz. Czasy to tylko to, co wpiszesz, więc godziny pracy śluzy sprawdź sam.',
  'help.guide.tour-paddle-time.step.3':
    'Wiersz Woda to dystans na wodzie przy Twoim Tempo wiosłowania. Zmienisz je w polu Tempo wiosłowania na górze kolumny.',
  'help.guide.tour-paddle-wind.goal': 'Zobacz prognozowany wiatr na starcie wycieczki w dniu, w którym ją pokonujesz.',
  'help.guide.tour-paddle-wind.tip.4':
    'Brak prognozowanej wartości nie oznacza, że jest bezpiecznie. Sprawdź warunki na miejscu.',
  'help.guide.tour-paddle-checklist.step.5':
    'Na dole kolumny kliknij Wiosłowanie niesie ryzyko, aby przed wyruszeniem przeczytać Bezpieczeństwo na wodzie.',
  'help.guide.tour-paddle-track-marks.goal':
    'Zaimportuj ślad spływu z zegarka i dodaj miejsca, w których niosłeś łódź i w których przepływałeś przez śluzę.',
  'help.guide.tour-paddle-track-marks.tip.1':
    'Klikaj dokładnie w ślad: kliknięcie zbyt daleko od linii jest odrzucane, a karta o tym informuje.',
  'help.ctx.trip-tour-horse.bullet.3':
    'Każdy odcinek to plakietka na karcie Punkty trasy z nazwą szlaku, kropką dostępu i długością. Odcinek, którego nie obejmuje żaden szlak konny, ma opis Ręczny, niesprawdzony.',
  'help.guide.tour-horse-plan.step.4':
    'Kliknij szlak na liście. Otworzy się na własnej mapie, z ponumerowanymi odcinkami.',
  'help.guide.tour-horse-plan.tip.4': 'Cofnij zmianę punktu w nagłówku lewej kolumny cofa cały odcinek jednym krokiem.',
  'help.guide.tour-horse-gap.result':
    'Przejażdżka nie ma już luki, a zasypany odcinek jest oznaczony jako narysowany ręcznie.',
  'help.guide.tour-horse-recorded.step.3': 'Kliknij Importuj 1 wycieczkę.',
  'help.guide.dissolve-fusion.step.3': 'Potwierdź przyciskiem „Rozłącz” w oknie z pytaniem.',
};

export default help;
