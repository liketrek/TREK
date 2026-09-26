import type { TranslationStrings } from '../types';

// English fallback until 'pl' is translated.
const help: TranslationStrings = {
  'help.title': 'Help & Docs',
  'help.search': 'Search docs…',
  'help.contents': 'Contents',
  'help.noResults': 'No matching pages.',
  'help.errorTitle': "Couldn't load this page",
  'help.errorBody': 'The help content is fetched from the TREK wiki. Check your connection and try again.',

  // center
  'help.center.button': 'Pomoc do tego ekranu',
  'help.center.title': 'Pomoc',
  'help.center.onThisScreen': 'Na tym ekranie',
  'help.center.screens': 'Ekrany',
  'help.center.thisScreen': 'Ten ekran',
  'help.center.subScreens': 'Podekrany: {count}',
  'help.center.subScreensLabel': 'Podekrany',
  'help.center.guidesCount': 'Poradniki: {count}',
  'help.center.goToScreen': 'Przejdź do {screen}',
  'help.center.overview': 'Przegląd',
  'help.center.howTo': 'Jak mogę…',
  'help.center.searchPlaceholder': 'Szukaj w poradnikach i dokumentacji…',
  'help.center.searchEmpty': 'Brak wyników dla „{query}”.',
  'help.center.searchGuides': 'Poradniki',
  'help.center.searchDocs': 'Dokumentacja',
  'help.center.searchError': 'Wyszukiwanie jest chwilowo niedostępne.',
  'help.center.back': 'Wstecz',
  'help.center.close': 'Zamknij pomoc',
  'help.center.steps': 'Kroki: {count}',
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
  'help.center.noContextHint': 'Przeszukaj dokumentację albo napisz nam, czego szukałeś.',
  'help.center.feedback': 'Czegoś brakuje?',
  'help.center.feedbackLink': 'Napisz nam na GitHubie',
  'help.center.discord': 'Zapytaj na Discordzie',
  'help.center.quick': 'Szybkie',
  'help.center.guide': 'Poradnik',
  'help.center.tour': 'Prezentacja',
  'help.center.imageAlt': 'Krok {n} poradnika „{title}”',

  // ctx
  'help.ctx.dashboard.title': 'Panel',
  'help.ctx.dashboard.summary':
    'Pulpit to wejście do każdej podróży. Karta pokładowa u góry pokazuje podróż, która właśnie trwa albo jest następna, wiersz pod nią podlicza, ile już przemierzyłeś, a karty wypisują wszystko, co planujesz, zarchiwizowałeś albo masz już za sobą.',
  'help.ctx.dashboard.bullet.1':
    'Karta pokładowa: trwająca lub następna podróż z datami, podróżnymi, miejscami i odliczaniem. Kliknij, aby otworzyć podróż.',
  'help.ctx.dashboard.bullet.2':
    'Statystyki: odwiedzone kraje, podróże, dni w drodze i przeleciany dystans, ze wszystkich podróży.',
  'help.ctx.dashboard.bullet.3':
    'Karty podróży filtrowane po Zaplanowane, Zarchiwizowana i Zakończone, jako siatka lub lista. Najedź na kartę, aby edytować, duplikować, archiwizować i usuwać.',
  'help.ctx.dashboard.bullet.4':
    'Widżety po prawej: przelicznik walut, zegary świata, nadchodzące rezerwacje i kolekcje. Każdy można wyłączyć.',
  'help.ctx.dashboard.bullet.5':
    'Karta „Nowa podróż” i przycisk w prawym dolnym rogu robią to samo: zakładają nową podróż.',

  // create-trip
  'help.guide.create-trip.title': 'Utworzyć podróż',
  'help.guide.create-trip.goal': 'Zacząć nową podróż z nazwą, datami i zdjęciem okładki.',
  'help.guide.create-trip.step.1':
    'Kliknij „Nowa podróż”. Karta na końcu Twoich podróży i przycisk w prawym dolnym rogu robią to samo.',
  'help.guide.create-trip.step.2': 'Nadaj podróży nazwę. To jedyne wymagane pole; wszystko inne można dodać później.',
  'help.guide.create-trip.step.3':
    'Wybierz datę początku i końca. TREK tworzy jeden dzień na każdą datę, więc plan jest gotowy do wypełnienia.',
  'help.guide.create-trip.step.4':
    'Opcjonalnie: dodaj zdjęcie okładki. Wgraj własne, przeciągnij je tutaj albo wyszukaj cel podróży na Unsplash.',
  'help.guide.create-trip.step.5': 'Kliknij „Utwórz nową podróż”.',
  'help.guide.create-trip.result':
    'Podróż pojawia się na pulpicie. Jeśli jest Twoją następną, przejmuje kartę pokładową u góry.',
  'help.guide.create-trip.tip.1':
    'Daty można zmienić później. Jeśli istnieją już rezerwacje, TREK zapyta, czy przesunąć je razem z dniami.',
  'help.guide.create-trip.tip.2':
    'Waluta podróży wybrana tutaj to ta, na którą przeliczany jest każdy wydatek. Wybierz walutę celu podróży.',

  // edit-trip
  'help.guide.edit-trip.title': 'Edytować podróż',
  'help.guide.edit-trip.goal': 'Zmienić nazwę podróży, jej daty albo ustawienia.',
  'help.guide.edit-trip.step.1': 'Najedź na kartę podróży (lub kartę pokładową) i kliknij ołówek.',
  'help.guide.edit-trip.step.2': 'Zmień, co trzeba: nazwę, opis, daty, okładkę, walutę, przypomnienie lub członków.',
  'help.guide.edit-trip.step.3': 'Kliknij „Aktualizuj”.',
  'help.guide.edit-trip.result': 'Karta aktualizuje się od razu, u każdego członka podróży.',
  'help.guide.edit-trip.tip.1':
    'Przesunięcie dat podróży, która ma już rezerwacje, otwiera drugi krok z pytaniem, czy rezerwacje też mają się przesunąć.',

  // cover-image
  'help.guide.cover-image.title': 'Ustawić zdjęcie okładki',
  'help.guide.cover-image.goal': 'Nadać podróży obraz widoczny na jej karcie i na karcie pokładowej.',
  'help.guide.cover-image.step.1': 'Otwórz formularz edycji podróży ołówkiem na jej karcie.',
  'help.guide.cover-image.step.2':
    'W sekcji „Okładka” upuść zdjęcie, kliknij, aby je wgrać, albo wpisz cel podróży w wyszukiwarkę Unsplash.',
  'help.guide.cover-image.step.3': 'Wybierz zdjęcie i kliknij „Aktualizuj”.',
  'help.guide.cover-image.result':
    'Zdjęcie jest zapisane przy podróży i widoczne wszędzie, gdzie podróż jest wymieniona.',
  'help.guide.cover-image.tip.1':
    'Zdjęcia z wyszukiwarki Unsplash mają automatyczne podpisy autorów; własne pliki zostają na Twoim serwerze.',

  // duplicate-trip
  'help.guide.duplicate-trip.title': 'Zduplikować podróż',
  'help.guide.duplicate-trip.goal': 'Użyć podróży jako szablonu nowej.',
  'help.guide.duplicate-trip.step.1': 'Najedź na kartę i kliknij ikonę duplikowania.',
  'help.guide.duplicate-trip.step.2': 'Przeczytaj, co zostanie skopiowane, a co nie, i potwierdź.',
  'help.guide.duplicate-trip.result': 'Obok oryginału pojawia się kopia, gotowa do zmiany nazwy i dat.',
  'help.guide.duplicate-trip.tip.1':
    'Dni, miejsca, rezerwacje, pozycje budżetu, listy pakowania i notatki dni są kopiowane. Członkowie, czat, ankiety, pliki i linki udostępniania nie.',

  // archive-trip
  'help.guide.archive-trip.title': 'Zarchiwizować i przywrócić podróż',
  'help.guide.archive-trip.goal': 'Odłożyć podróż bez usuwania i wrócić do niej później.',
  'help.guide.archive-trip.step.1': 'Najedź na kartę i kliknij „Archiwizuj”.',
  'help.guide.archive-trip.step.2': 'Przełącz filtr nad kartami na „Zarchiwizowana”, aby znów ją zobaczyć.',
  'help.guide.archive-trip.step.3': 'Kliknij „Przywróć” na karcie, aby wróciła do „Zaplanowane”.',
  'help.guide.archive-trip.result':
    'Zarchiwizowane podróże zachowują wszystko. Po prostu nie zajmują już miejsca na pulpicie ani w kanale kalendarza wszystkich podróży.',

  // delete-trip
  'help.guide.delete-trip.title': 'Usunąć podróż',
  'help.guide.delete-trip.goal': 'Usunąć podróż na dobre.',
  'help.guide.delete-trip.step.1': 'Najedź na kartę i kliknij kosz.',
  'help.guide.delete-trip.step.2': 'Potwierdź. Okno podaje nazwę podróży, więc wiesz, że to właściwa.',
  'help.guide.delete-trip.result':
    'Podróż, jej dni, miejsca, rezerwacje i pliki znikają. Nie da się tego cofnąć; w razie wątpliwości archiwizuj.',

  // filter-and-view
  'help.guide.filter-and-view.title': 'Znaleźć zakończone podróże, przełączyć siatkę i listę',
  'help.guide.filter-and-view.goal':
    'Zobaczyć zakończone lub zarchiwizowane podróże i wybrać układ, który Ci odpowiada.',
  'help.guide.filter-and-view.step.1':
    'Użyj „Zaplanowane”, „Zarchiwizowana” i „Zakończone” nad kartami. Zakończona to każda podróż, której data końca minęła.',
  'help.guide.filter-and-view.step.2':
    'Kliknij ikonę listy, aby przejść do zwartej listy; kliknij ponownie, aby wrócić do siatki.',
  'help.guide.filter-and-view.result': 'Pulpit zapamiętuje Twój układ na tym urządzeniu.',

  // calendar-feed
  'help.guide.calendar-feed.title': 'Subskrybować wszystkie podróże w kalendarzu',
  'help.guide.calendar-feed.goal':
    'Widzieć dni i rezerwacje każdej aktywnej podróży w aplikacji kalendarza, zawsze zsynchronizowane.',
  'help.guide.calendar-feed.step.1': 'Kliknij ikonę kalendarza obok przełącznika widoku.',
  'help.guide.calendar-feed.step.2': 'Kliknij „Enable calendar subscription”. TREK wygeneruje prywatny link do kanału.',
  'help.guide.calendar-feed.step.3':
    'Dodaj kanał jednym z przycisków (Google, Apple, Outlook) albo skopiuj link do dowolnej aplikacji kalendarza, która subskrybuje adresy URL.',
  'help.guide.calendar-feed.result':
    'Każda aktywna podróż pojawia się w Twoim kalendarzu i sama się aktualizuje. Podróże zarchiwizowane i zakończone ponad 90 dni temu są pomijane.',
  'help.guide.calendar-feed.tip.1':
    'Link jest tajny. Każdy, kto go ma, może czytać kanał; jeśli wycieknie, unieważnij go w tym samym oknie.',

  // widgets
  'help.guide.widgets.title': 'Wybrać widżety pulpitu',
  'help.guide.widgets.goal': 'Pokazać lub ukryć wiersz statystyk i widżety po prawej.',
  'help.guide.widgets.step.1': 'Otwórz menu awatara w prawym górnym rogu i wybierz „Ustawienia”.',
  'help.guide.widgets.step.2': 'Przejdź do zakładki „Appearance”.',
  'help.guide.widgets.step.3':
    'W sekcji „Dashboard widgets” włącz lub wyłącz każdy widżet. Komputer i telefon ustawia się osobno.',
  'help.guide.widgets.step.4': 'Wróć na pulpit. Zmiana działa od razu.',
  'help.guide.widgets.result':
    'Ukryte widżety zwalniają miejsce dla podróży; wyłącz całą prawą kolumnę, aby wyśrodkować układ.',
  'help.guide.widgets.link': 'Otwórz ustawienia wyglądu',

  // currency-widget
  'help.guide.currency-widget.title': 'Przeliczać waluty',
  'help.guide.currency-widget.goal': 'Przeliczyć kwotę między dwiema walutami po aktualnych kursach.',
  'help.guide.currency-widget.step.1': 'Wpisz kwotę i wybierz obie waluty.',
  'help.guide.currency-widget.step.2': 'Strzałka między nimi zamienia parę; okrągła strzałka odświeża kurs.',
  'help.guide.currency-widget.result':
    'Twoja para walut jest zapamiętana na koncie, więc jest taka sama na każdym urządzeniu.',
  'help.guide.currency-widget.tip.1':
    'Kursy pochodzą z Europejskiego Banku Centralnego i są aktualizowane raz dziennie.',

  // timezones-widget
  'help.guide.timezones-widget.title': 'Dodać zegary świata',
  'help.guide.timezones-widget.goal': 'Mieć na oku czas lokalny w miejscach docelowych.',
  'help.guide.timezones-widget.step.1': 'Kliknij + w widżecie „Strefy czasowe” i wyszukaj miasto.',
  'help.guide.timezones-widget.step.2': 'Zegar usuniesz znakiem × obok niego.',
  'help.guide.timezones-widget.result': 'Zegary są zapisane na Twoim koncie.',

  // ── Screen: vacay ──────────────────────────────────────────────────────────
  'help.ctx.vacay.title': 'Vacay',
  'help.ctx.vacay.summary':
    'Vacay to Twój osobisty planer urlopu: ile dni masz w roku, które już zapisałeś i ile zostało. Siatka pokazuje cały rok na jeden rzut oka; w pasku bocznym są wybór roku, osoby, z którymi planujesz, udostępnione kalendarze, legenda i Twój wymiar urlopu.',
  'help.ctx.vacay.bullet.1':
    'Siatka roczna: dwanaście kart miesięcy, jedna komórka na dzień. Kliknij dzień, aby go zapisać lub usunąć. Mała niebieska kropka oznacza dni, które już obejmuje podróż.',
  'help.ctx.vacay.bullet.2':
    'Pasek na dole: tryb Urlop albo Urlop firmowy, plus przełączniki Pół dnia i Odbiór, które zmieniają, co zapisuje kliknięcie.',
  'help.ctx.vacay.bullet.3':
    'Wymiar: Twoje dni w roku, ile wykorzystano i ile zostało, z przeniesieniem z poprzedniego okresu.',
  'help.ctx.vacay.bullet.4':
    'Osoby to ludzie scaleni z Twoim planem, każdy w swoim kolorze. Udostępnione kalendarze to obrączki tylko do odczytu z dniami wolnymi innych.',
  'help.ctx.vacay.bullet.5':
    'Ustawienia obejmują weekendy, początek tygodnia, przeniesienie, Twój rok urlopowy, przerwy firmowe oraz kalendarze świąt i ferii szkolnych.',
  // log-day
  'help.guide.log-day.title': 'Zapisać dzień urlopu',
  'help.guide.log-day.goal': 'Oznaczyć dzień wolny w siatce roku i zobaczyć, jak zmienia się saldo.',
  'help.guide.log-day.step.1':
    'Spójrz na pasek na dole: lewy przycisk w Twoim kolorze oznacza, że kliknięcie zapisze dzień urlopu dla Ciebie.',
  'help.guide.log-day.step.2':
    'Kliknij dzień na dowolnej karcie miesiąca. Wypełni się Twoim kolorem, a Wykorzystane policzy jeden dzień więcej.',
  'help.guide.log-day.step.3': 'Kliknij ten sam dzień ponownie, aby go usunąć.',
  'help.guide.log-day.result':
    'Dzień jest zapisany, Dni, Wykorzystane i Pozostało aktualizują się od razu, a każdy scalony z Twoim planem widzi to na żywo.',
  'help.guide.log-day.tip.1': 'Weekendów nie da się zapisać, dopóki w Ustawieniach włączone jest Blokuj weekendy.',
  'help.guide.log-day.tip.2':
    'Niebieska kropka w komórce oznacza, że jedna z Twoich podróży obejmuje ten dzień, więc widzisz, gdzie urlop i podróż się pokrywają.',
  // half-day
  'help.guide.half-day.title': 'Zapisać pół dnia',
  'help.guide.half-day.goal': 'Wziąć wolne popołudnie bez wydawania całego dnia z puli.',
  'help.guide.half-day.step.1':
    'Włącz Pół dnia na pasku. Pomarańczowa kropka to znacznik, jaki pół dnia dostaje w siatce.',
  'help.guide.half-day.step.2': 'Kliknij dzień. Zostanie zapisany jako 0,5 i ma pomarańczową kropkę w rogu.',
  'help.guide.half-day.step.3':
    'Po skończeniu wyłącz Pół dnia; kliknięcie pół dnia z innymi ustawieniami przekształca go w miejscu.',
  'help.guide.half-day.result':
    'Wykorzystane rośnie o 0,5. Pół dnia i Odbiór są niezależne, więc pół dnia odbioru też jest możliwe.',
  'help.guide.half-day.tip.1':
    'Pasek zawsze pokazuje znacznik, który postawi następne kliknięcie, więc możesz sprawdzić przed zapisaniem.',
  // comp-day
  'help.guide.comp-day.title': 'Zapisać odbiór lub flex',
  'help.guide.comp-day.goal': 'Wziąć wolne w zamian, które nie kosztuje dni urlopu.',
  'help.guide.comp-day.step.1': 'Włącz Odbiór na pasku. Kreskowany krążek to wygląd dnia odbioru w siatce.',
  'help.guide.comp-day.step.2':
    'Kliknij dzień. Wypełni się ukośnym kreskowaniem w Twoim kolorze zamiast pełnym blokiem.',
  'help.guide.comp-day.result': 'Dni odbioru liczone są obok kafelków wymiaru i nigdy nie zmniejszają Pozostało.',
  'help.guide.comp-day.tip.1':
    'Odebrane nadgodziny, elastyczny czas pracy, dzień wolny w zamian: wszystko, co jest wolnym, ale nie urlopem, należy tutaj.',
  // entitlement
  'help.guide.entitlement.title': 'Ustawić wymiar urlopu',
  'help.guide.entitlement.goal': 'Powiedzieć Vacay, ile dni urlopu masz w roku.',
  'help.guide.entitlement.step.1': 'W pasku bocznym kliknij kafelek Dni w sekcji Wymiar.',
  'help.guide.entitlement.step.2': 'Wpisz liczbę dni i naciśnij Enter.',
  'help.guide.entitlement.result':
    'Pozostało jest przeliczane z Twojego wymiaru, ewentualnego przeniesienia i wykorzystanych dni.',
  'help.guide.entitlement.tip.1': 'Każdy rok ma własny wymiar, więc zmiana tutaj dotyczy tylko wybranego roku.',
  // years
  'help.guide.years.title': 'Dodać lata i przełączać między nimi',
  'help.guide.years.goal': 'Zaplanować już przyszły rok albo spojrzeć wstecz na poprzedni.',
  'help.guide.years.step.1': 'Kliknij + po prawej stronie roku, aby dodać następny, albo + po lewej dla poprzedniego.',
  'help.guide.years.step.2': 'Przełączaj lata strzałkami albo kafelkami lat poniżej.',
  'help.guide.years.step.3':
    'Aby usunąć rok, najedź na jego kafelek i kliknij mały minus. Jego wpisy znikną razem z nim, więc potwierdzaj ostrożnie.',
  'help.guide.years.result': 'Każdy rok zachowuje własny wymiar i wpisy; przeniesienie je łączy.',
  // company-holidays
  'help.guide.company-holidays.title': 'Oznaczyć przerwy firmowe',
  'help.guide.company-holidays.goal':
    'Zablokować dni, w które wolne ma cała firma, bez uszczuplania czyjegokolwiek wymiaru.',
  'help.guide.company-holidays.step.1':
    'Otwórz Ustawienia i sprawdź, czy Urlopy firmowe są włączone. Tak jest domyślnie; pasek oferuje ten tryb tylko wtedy.',
  'help.guide.company-holidays.step.2': 'Z powrotem w siatce przełącz pasek w tryb Urlop firmowy.',
  'help.guide.company-holidays.step.3': 'Kliknij dni. Robią się bursztynowe i pojawiają się w legendzie.',
  'help.guide.company-holidays.result':
    'Przerwy firmowe widzą wszyscy scaleni z planem i nigdy nie zmniejszają Pozostało.',
  'help.guide.company-holidays.tip.1':
    'Każda scalona osoba może edytować przerwy firmowe, więc ustalcie, kto je prowadzi.',
  // public-holidays
  'help.guide.public-holidays.title': 'Pokazać święta',
  'help.guide.public-holidays.goal': 'Umieścić w siatce święta Twojego kraju lub regionu.',
  'help.guide.public-holidays.step.1': 'Otwórz Ustawienia i włącz Święta państwowe.',
  'help.guide.public-holidays.step.2':
    'Kliknij Dodaj kalendarz, wybierz kraj i, gdzie to ma znaczenie, region. Nadaj kolor i etykietę, jeśli chcesz.',
  'help.guide.public-holidays.step.3': 'Zamknij Ustawienia. Święta pojawią się w siatce i w legendzie.',
  'help.guide.public-holidays.result':
    'Święta są oznaczone kolorem kalendarza i nigdy nie liczą się przeciw Twojemu wymiarowi.',
  'help.guide.public-holidays.tip.1':
    'Możesz dodać kilka kalendarzy, na przykład swój region i region scalonego współpracownika.',
  // school-holidays
  'help.guide.school-holidays.title': 'Pokazać ferie szkolne',
  'help.guide.school-holidays.goal': 'Widzieć ferie szkolne swojego regionu obok własnych dni wolnych.',
  'help.guide.school-holidays.step.1': 'Otwórz Ustawienia i włącz School Holidays.',
  'help.guide.school-holidays.step.2':
    'Kliknij Dodaj kalendarz i wybierz kraj. Tam, gdzie kraj dzieli kalendarz, wybierz też region lub grupę.',
  'help.guide.school-holidays.step.3': 'Zamknij Ustawienia. Każda przerwa dostaje kolorowy pasek u dołu swoich dni.',
  'help.guide.school-holidays.result': 'Ferie szkolne są czysto wizualne: nigdy nie zmniejszają niczyjego wymiaru.',
  'help.guide.school-holidays.tip.1':
    'Brakuje regionu? Administrator może prowadzić ferie szkolne ręcznie w Admin, Personalizacja, Ferie szkolne.',
  // weekends
  'help.guide.weekends.title': 'Zablokować weekendy i ustawić początek tygodnia',
  'help.guide.weekends.goal':
    'Trzymać weekendy poza liczeniem i zaczynać tydzień w dniu, do którego jesteś przyzwyczajony.',
  'help.guide.weekends.step.1': 'Otwórz Ustawienia.',
  'help.guide.weekends.step.2': 'Włącz Blokuj weekendy i wybierz, które dni liczą się jako Twój weekend.',
  'help.guide.weekends.step.3': 'W sekcji Tydzień zaczyna się w wybierz poniedziałek albo niedzielę.',
  'help.guide.weekends.result': 'Zablokowane dni są wyszarzone w siatce i nie da się ich zapisać przez pomyłkę.',
  // leave-year
  'help.guide.leave-year.title': 'Ustawić rok urlopowy',
  'help.guide.leave-year.goal':
    'Liczyć wymiar w roku podatkowym albo od daty zatrudnienia zamiast od stycznia do grudnia.',
  'help.guide.leave-year.step.1': 'Otwórz Ustawienia i znajdź Rok urlopowy.',
  'help.guide.leave-year.step.2':
    'Wybierz Kalendarzowy, Obrotowy (z miesiącem i dniem początku) albo Data zatrudnienia (z datą, kiedy Cię zatrudniono).',
  'help.guide.leave-year.result':
    'Wymiar, wykorzystane dni i przeniesienie podążają za tym okresem, a siatka zaczyna się od jego pierwszego miesiąca.',
  'help.guide.leave-year.tip.1':
    'To ustawienie jest osobiste: w scalonym planie każdy zachowuje własny rok urlopowy i własne liczby.',
  // carry-over
  'help.guide.carry-over.title': 'Przenieść niewykorzystane dni',
  'help.guide.carry-over.goal': 'Dodać to, co zostało na koniec okresu, do następnego.',
  'help.guide.carry-over.step.1': 'Otwórz Ustawienia.',
  'help.guide.carry-over.step.2': 'Włącz Przeniesienie na kolejny rok.',
  'help.guide.carry-over.result':
    'Przeniesiona liczba jest przeliczana dla wszystkich Twoich lat i pokazana pod wymiarem.',
  'help.guide.carry-over.tip.1': 'Wyłączenie zeruje każde saldo przeniesienia.',
  // invite
  'help.guide.invite.title': 'Planować razem z kimś',
  'help.guide.invite.goal': 'Scalić swój plan z innym użytkownikiem TREK, aby widzieć wasze dni wolne w jednej siatce.',
  'help.guide.invite.step.1': 'Kliknij ikonę osoby w panelu Osoby.',
  'help.guide.invite.step.2': 'Wybierz użytkownika i wyślij zaproszenie.',
  'help.guide.invite.step.3':
    'Dostanie powiadomienie i zaakceptuje. Do tego czasu zaproszenie widnieje jako oczekujące.',
  'help.guide.invite.result':
    'Oba plany się scalają: każda osoba ma kolor, możecie zapisywać dni sobie nawzajem, a wszystko synchronizuje się na żywo.',
  'help.guide.invite.tip.1':
    'Aby cofnąć scalenie, użyj Rozłącz w Ustawieniach. Wpisy każdego wracają do jego własnego planu.',
  'help.guide.invite.tip.2': 'Jeśli druga osoba ma tylko widzieć Twoje dni, udostępnij kalendarz zamiast scalać.',
  // share-calendar
  'help.guide.share-calendar.title': 'Udostępnić kalendarz tylko do odczytu',
  'help.guide.share-calendar.goal': 'Pozwolić komuś widzieć, kiedy masz wolne, bez wpływu na Twój plan.',
  'help.guide.share-calendar.step.1': 'Kliknij ikonę udostępniania w panelu Udostępnione kalendarze.',
  'help.guide.share-calendar.step.2': 'Wybierz użytkownika i kliknij Udostępnij. Akceptacja nie jest potrzebna.',
  'help.guide.share-calendar.step.3':
    'Kalendarze udostępnione Tobie pojawiają się w tym samym panelu; oko ukrywa jeden, Przestań udostępniać cofa Twój.',
  'help.guide.share-calendar.result':
    'Twoje dni wolne pojawiają się jako kolorowa obrączka w jego siatce. Niczego, co udostępniasz, nie da się tam edytować.',
  'help.guide.share-calendar.tip.1':
    'Udostępnianie i scalanie są niezależne: możesz być scalony z jedną osobą i udostępniać innym.',
  'help.guide.share-calendar.tip.2': 'Najedź na dzień z obrączką, aby zobaczyć, kto ma wolne i jak długo.',

  // ── Screen: atlas ─────────────────────────────────────────────────────────────────────
  'help.ctx.atlas.title': 'Atlas',
  'help.ctx.atlas.summary':
    'Atlas to Twój podróżniczy ślad na mapie świata: każdy kraj, do którego zaprowadziła Cię podróż, jest pokolorowany, a te odwiedzone przed TREK-iem dodajesz ręcznie. Przybliż, by zobaczyć regiony, prowadź listę marzeń z miejscami, które chcesz jeszcze zobaczyć, i odczytuj swoje liczby w szklanym panelu na dole.',
  'help.ctx.atlas.bullet.1':
    'Mapa: odwiedzone kraje mają kolor, który zostaje ich, planowane mają przerywany obrys, kraje z listy marzeń ukośne kreskowanie, cała reszta jest szara. Najedź na kraj, by zobaczyć jego podróże, miejsca oraz pierwszą i ostatnią wizytę.',
  'help.ctx.atlas.bullet.2':
    'Wyszukiwanie u góry: wpisz kraj lub miejsce. Wybór kraju przenosi tam mapę i otwiera jego okno; wybór miejsca ląduje w jego regionie, żebyś mógł go oznaczyć.',
  'help.ctx.atlas.bullet.3':
    'Pokaż zaplanowane kraje, u góry po prawej: odsłania kraje Twoich nadchodzących podróży. Przełącznik pojawia się tylko, dopóki jakieś masz.',
  'help.ctx.atlas.bullet.4':
    'Panel na dole: zakładka Statystyki z krajami, podróżami, miejscami, miastami, dniami, kontynentami i Twoją serią; zakładka Lista marzeń z tym, co jeszcze przed Tobą.',
  'help.ctx.atlas.bullet.5':
    'Regiony: od poziomu przybliżenia 5 mapa przełącza się na stany i prowincje, każdy klikalny, by go oznaczyć lub usunąć.',
  'help.ctx.atlas.bullet.6':
    'Dawarich: z podłączonym dodatkiem panel po lewej od statystyk odhacza marzenia i dodaje kraje z Twoich nagrań, nigdy bez Twojego potwierdzenia.',
  // mark-country
  'help.guide.mark-country.title': 'Oznaczyć kraj jako odwiedzony',
  'help.guide.mark-country.goal': 'Dodaj kraj, w którym byłeś przed TREK-iem, żeby mapa i licznik go uwzględniły.',
  'help.guide.mark-country.step.1': 'Wpisz kraj w pole wyszukiwania u góry mapy.',
  'help.guide.mark-country.step.2': 'Wybierz go z listy. Mapa tam przelatuje i otwiera się okno dla tego kraju.',
  'help.guide.mark-country.step.3': 'Wybierz Oznacz jako odwiedzony.',
  'help.guide.mark-country.result':
    'Kraj dostaje na mapie swój kolor, a Kraje liczy o jeden więcej. Ten kolor jest stały: oznaczanie kolejnych krajów nigdy nie przetasowuje reszty.',
  'help.guide.mark-country.tip.1':
    'Kliknięcie szarego kraju na mapie otwiera to samo okno; wyszukiwanie to pewna droga przy małych krajach.',
  'help.guide.mark-country.tip.2':
    'Kraj oznaczony ręcznie zawsze liczy się jako odwiedzony, niezależnie od dat jakiejkolwiek podróży tam.',
  // unmark-country
  'help.guide.unmark-country.title': 'Usunąć oznaczony kraj',
  'help.guide.unmark-country.goal': 'Zdejmij z mapy kraj oznaczony ręcznie.',
  'help.guide.unmark-country.step.1':
    'Wyszukaj kraj i wybierz go albo kliknij go na mapie. Przy kraju, który oznaczyłeś sam, okno pyta, czy go usunąć.',
  'help.guide.unmark-country.step.2': 'Potwierdź przyciskiem Usuń.',
  'help.guide.unmark-country.result': 'Kraj znów jest szary i znika z Twojego licznika.',
  'help.guide.unmark-country.tip.1':
    'Tak usuniesz tylko kraje oznaczone ręcznie. Kraj z podróżami lub miejscami zostaje, dopóki je ma; Usuń jest też na jego karcie szczegółów w panelu, gdy oznaczono go ręcznie.',
  // country-details
  'help.guide.country-details.title': 'Zobaczyć, co robiłeś w kraju',
  'help.guide.country-details.goal': 'Otwórz odwiedzony kraj i przejdź do podróży, które Cię tam zaprowadziły.',
  'help.guide.country-details.step.1': 'Wyszukaj kraj, który odwiedziłeś.',
  'help.guide.country-details.step.2':
    'Wybierz go. Mapa tam przelatuje, a panel na dole dostaje kartę z flagą, miejscami, podróżami i chipem na każdą podróż.',
  'help.guide.country-details.result': 'Kliknij chip podróży, by otworzyć ją w planerze.',
  'help.guide.country-details.tip.1':
    'Najechanie na kraj na mapie pokazuje te same liczby plus pierwszą i ostatnią wizytę.',
  // planned-countries
  'help.guide.planned-countries.title': 'Pokazać kraje, do których jedziesz',
  'help.guide.planned-countries.goal':
    'Wprowadź na mapę kraje nadchodzących podróży bez liczenia ich jako odwiedzonych.',
  'help.guide.planned-countries.step.1': 'Włącz Pokaż zaplanowane kraje u góry po prawej. Liczba obok mówi, ile czeka.',
  'help.guide.planned-countries.step.2':
    'Wyszukaj planowany kraj i wybierz go: panel mówi Zaplanowane, a podpowiedź na mapie pokazuje, kiedy jedziesz.',
  'help.guide.planned-countries.result':
    'Planowane kraje pojawiają się z przerywanym obrysem, więc nigdy nie wyglądają jak miejsce, w którym już byłeś. Przełącznik pamięta Twój wybór.',
  'help.guide.planned-countries.tip.1':
    'Kraj liczy się jako odwiedzony, gdy podróż tam się zaczęła; trwająca podróż też się liczy. Podróże bez dat pozostają całkiem poza statystykami.',
  'help.guide.planned-countries.tip.2': 'Przełącznik istnieje tylko, dopóki masz nadchodzące podróże.',
  // regions
  'help.guide.regions.title': 'Oznaczyć region',
  'help.guide.regions.goal': 'Dokładniej niż kraje: oznacz stany, prowincje lub prefektury, w których byłeś.',
  'help.guide.regions.step.1':
    'Przybliż kraj, aż pojawią się jego regiony, od poziomu przybliżenia 5. Wyszukanie kraju i wybranie go przenosi Cię wystarczająco blisko.',
  'help.guide.regions.step.2': 'Kliknij region. Po najechaniu widać jego nazwę; okno pokazuje region i jego kraj.',
  'help.guide.regions.step.3': 'Wybierz Oznacz jako odwiedzony.',
  'help.guide.regions.result':
    'Region wypełnia się kolorem kraju. Oznaczenie regionu liczy też kraj jako odwiedzony, jeśli jeszcze nie był.',
  'help.guide.regions.tip.1':
    'Kliknięcie odwiedzonego regionu proponuje Usuń, niezależnie od tego, czy oznaczyłeś go Ty, czy umieściło go tam miejsce.',
  'help.guide.regions.tip.2':
    'Regiony, w których masz prawdziwe miejsca, oznaczają się same; tam nie ma nic do zrobienia.',
  // search-place
  'help.guide.search-place.title': 'Znaleźć miejsce i oznaczyć jego region',
  'help.guide.search-place.goal': 'Oznacz Bawarię, szukając Monachium, bez wiedzy, w którym regionie leży miasto.',
  'help.guide.search-place.step.1':
    'Wpisz w pole wyszukiwania miasto, zabytek lub adres. Kraje idą pierwsze; pasujące miejsca pojawiają się pod nimi pod nagłówkiem Miejsca.',
  'help.guide.search-place.step.2': 'Wybierz miejsce. Mapa tam przelatuje i ustala, w którym regionie leży punkt.',
  'help.guide.search-place.step.3':
    'Wybierz Oznacz jako odwiedzony dla tego regionu albo Dodaj do listy marzeń, jeśli jeszcze przed Tobą.',
  'help.guide.search-place.result':
    'Region jest oznaczony, a z nim kraj. Kraje bez danych regionów w pakiecie map wracają do samego kraju.',
  'help.guide.search-place.tip.1':
    'Miejsca pochodzą z tego samego wyszukiwania co wszędzie w TREK-u, więc podążają za dostawcą ustawionym przez Twojego admina.',
  // bucket-country
  'help.guide.bucket-country.title': 'Dodać kraj do listy marzeń',
  'help.guide.bucket-country.goal': 'Prowadź listę marzeń z krajami prosto na mapie, osobno od tych, w których byłeś.',
  'help.guide.bucket-country.step.1': 'Wyszukaj kraj i wybierz go albo kliknij go na mapie.',
  'help.guide.bucket-country.step.2': 'Wybierz Dodaj do listy marzeń.',
  'help.guide.bucket-country.step.3':
    'Wybierz miesiąc i rok, jeśli już wiesz kiedy, i potwierdź przyciskiem Dodaj do listy marzeń.',
  'help.guide.bucket-country.result':
    'Kraj jest rysowany ukośnym kreskowaniem w kolorze, który będzie nosił, gdy tam dotrzesz, i pojawia się w zakładce Lista marzeń panelu.',
  'help.guide.bucket-country.tip.1': 'To samo okno oferuje Usuń z listy marzeń, gdy kraj jest już na liście.',
  'help.guide.bucket-country.tip.2':
    'Jeden wpis na datę docelową: ten sam kraj może być na liście na dwa różne miesiące, ale nie dwa razy na ten sam.',
  // bucket-place
  'help.guide.bucket-place.title': 'Dodać miejsce do listy marzeń',
  'help.guide.bucket-place.goal':
    'Zapisz miasto, zabytek lub adres, o którym marzysz, ze współrzędnymi i datą docelową.',
  'help.guide.bucket-place.step.1': 'Otwórz zakładkę Lista marzeń w panelu na dole.',
  'help.guide.bucket-place.step.2': 'Kliknij Dodaj miejsce.',
  'help.guide.bucket-place.step.3':
    'Wpisz nazwę i naciśnij przycisk wyszukiwania; wybierz trafienie, by miejsce miało współrzędne. Wpisanie samej nazwy i pominięcie wyszukiwania też działa.',
  'help.guide.bucket-place.step.4': 'Wybierz miesiąc i rok, jeśli chcesz, i kliknij Dodaj.',
  'help.guide.bucket-place.result':
    'Miejsce jest na górze Twojej listy marzeń z datą docelową; × obok usuwa je ponownie.',
  'help.guide.bucket-place.tip.1':
    'Marzenie ze współrzędnymi to coś, co Dawarich może później za Ciebie odhaczyć, gdy nagrania pokażą, że tam byłeś.',
  // stats
  'help.guide.stats.title': 'Czytać swoje statystyki',
  'help.guide.stats.goal': 'Wiedzieć, co liczą liczby w panelu, a czego nie.',
  'help.guide.stats.step.1':
    'Kraje to liczba różnych krajów, w których naprawdę byłeś; planowane są pokazane obok, nie w środku. Podróże, Miejsca i Dni to sumy ze wszystkich Twoich podróży. Miasta są wyliczane z adresów Twoich miejsc, więc to szacunek.',
  'help.guide.stats.step.2':
    'Kontynenty pokazują odwiedzone kraje według kontynentu; Antarktyda dołącza do rzędu, gdy tam byłeś. Potem Twoja seria, kolejne lata z co najmniej jedną podróżą, i ile podróży odbyłeś w tym roku.',
  'help.guide.stats.result': 'Liczby podążają za podróżami, gdy je planujesz; tu nie ma nic do utrzymywania.',
  'help.guide.stats.tip.1':
    'Miasta są czytane z tekstu adresu, nie wyszukiwane, więc krótki adres jak „Osteria Francescana, Italy” albo taki, który kończy się prefekturą, może dać region zamiast miasta.',
  'help.guide.stats.tip.2':
    'Kraje oznaczone ręcznie liczą się w Krajach i kontynentach, ale nie przynoszą podróży, miejsc ani dni.',
  // dawarich-countries
  'help.guide.dawarich-countries.title': 'Dodać kraje ze swoich zapisów',
  'help.guide.dawarich-countries.goal':
    'Pozwól, by Dawarich powiedział, w których krajach byłeś w ostatnim roku, i połóż na mapie te, które potwierdzisz.',
  'help.guide.dawarich-countries.step.1':
    'Z podłączonym dodatkiem Dawarich na dole mapy, po lewej od statystyk, siedzi panel Dawarich z dwoma kafelkami. Kliknij Kraje.',
  'help.guide.dawarich-countries.step.2':
    'Okno otwiera się na zakładce Kraje. Kliknij Szukaj krajów: TREK czyta kraje i miasta, które Twoje zapisy obejmują w ostatnich 12 miesiącach, miesiąc po miesiącu, więc daj mu chwilę. Każdy kraj, którego Twój Atlas jeszcze nie ma, jest wypisany z flagą, liczbą miast i pierwszym z nich po nazwie, i zaczyna zaznaczony; kliknij wiersz, by go pominąć.',
  'help.guide.dawarich-countries.step.3':
    'Potwierdź przyciskiem na dole po prawej, na którym stoi Dodaj kraje: 5, gdy zaznaczonych jest pięć wierszy. Okno mówi, ile zostało dodanych; zamknij je, a mapa już przeczytała się na nowo.',
  'help.guide.dawarich-countries.result':
    'Potwierdzone kraje niosą na mapie kolor i liczą się w Kraje, zapisane jako pochodzące z Dawarich. To, co oznaczyłeś ręcznie, jest nietknięte.',
  'help.guide.dawarich-countries.tip.1':
    'Kraje, które Atlas już pokazuje jako odwiedzone, ręcznie, z podróży albo z wcześniejszego sprawdzenia, są pominięte, więc Twoje własne oznaczenia nigdy nie są przepisywane. Kraj, który wcześniej usunąłeś z Atlasu, wraca, gdy potwierdzisz go tutaj.',
  'help.guide.dawarich-countries.tip.2':
    'Nazwa kraju, której TREK nie umie dopasować, jest wypisana pod wierszami, a nie odrzucona, a Sprawdź ponownie pyta Dawarich jeszcze raz. Notatka pod listą mówi Sprawdzono ostatnie 12 miesięcy; to okno jest stałe.',
  // dawarich-wishes
  'help.guide.dawarich-wishes.title': 'Odhaczyć marzenia ze swoich zapisów',
  'help.guide.dawarich-wishes.goal':
    'Dowiedz się, do których miejsc z listy marzeń naprawdę dotarłeś, i odhacz je w dniu, w którym to się stało.',
  'help.guide.dawarich-wishes.step.1': 'W panelu Dawarich na dole mapy, po lewej od statystyk, kliknij Lista marzeń.',
  'help.guide.dawarich-wishes.step.2':
    'Okno otwiera się na zakładce Lista marzeń. Kliknij Sprawdź listę marzeń: TREK przegląda Twoje zapisy dla każdej pozycji, która ma współrzędne. Marzenie, do którego dotarłeś, jest wypisane z tym, jak blisko podszedłeś, jak długo zostałeś i którego dnia, i zaczyna zaznaczone; przy tym, które już odhaczyłeś, stoi Już odhaczone. Pod listą notatka liczy pozycje bez współrzędnych, a stoi tam też reguła: Marzenie uznaje się za spełnione w promieniu 250 m i po 20 minutach na miejscu.',
  'help.guide.dawarich-wishes.step.3':
    'Potwierdź przyciskiem na dole po prawej, na którym stoi Odhacz 2, gdy zaznaczone są dwa wiersze. Potem zamknij okno i otwórz zakładkę Lista marzeń w panelu obok.',
  'help.guide.dawarich-wishes.result':
    'Każde marzenie niesie zielony haczyk z datą pobytu, nie dzisiejszą; jego podpowiedź mówi Odhaczone na podstawie Twoich zapisów z Dawarich, a kliknięcie daty to cofa.',
  'help.guide.dawarich-wishes.tip.1':
    'Przejazd obok się nie liczy: reguła wymaga i bliskości, i czasu, a z kilku pobytów, które się kwalifikują, wygrywa najdłuższy. Marzenia bez współrzędnych nie da się sprawdzić, więc dodawaj miejsca przez wyszukiwanie w Dodaj miejsce, a nie samą nazwą.',
  'help.guide.dawarich-wishes.tip.2':
    'Jedno sprawdzenie ogląda do 50 pozycji, najpierw te jeszcze nieodhaczone, i mówi, gdy było ich więcej. Marzenie, które już było odhaczone, zachowuje własną datę.',

  // ── Screen: collections ───────────────────────────────────────────────────────────────
  'help.ctx.collections.title': 'Kolekcje',
  'help.ctx.collections.summary':
    'Collections to Twoja biblioteka miejsc poza jakąkolwiek podróżą: nazwane listy miejsc, które znalazłeś i chcesz zachować, każde miejsce ze statusem Pomysł, Chcę odwiedzić lub Odwiedzone. Miejsca są kopiowane do podróży i z podróży, nigdy łączone, więc lista i podróż nigdy nie zmieniają się nawzajem.',
  'help.ctx.collections.bullet.1':
    'Pasek list po lewej: Twoje własne listy, te udostępnione Tobie, zaproszenia czekające na zgodę, Wszystkie zapisane jako suma wszystkiego, co posiadasz, oraz Nowa lista i import z pliku u góry.',
  'help.ctx.collections.bullet.2':
    'Nagłówek otwartej listy: jej kolor, okładka, opis i linki, członkowie oraz akcje Edytuj, Eksportuj i Udostępnij po prawej.',
  'help.ctx.collections.bullet.3':
    'Wiersz filtrów nad miejscami: status, kategoria, ocena i sortowanie, filtr etykiet, + do dodania miejsca, import z podróży i Zaznacz do akcji zbiorczych.',
  'help.ctx.collections.bullet.4':
    'Wiersze miejsc: awatar, nazwa i adres, etykiety i kategoria oraz plakietka statusu po prawej, która przełącza się jednym kliknięciem.',
  'help.ctx.collections.bullet.5':
    'Mapa po prawej: pinezka na każde miejsce ze współrzędnymi, przełącznik listy lub mapy, pole wyszukiwania i filtr etykiet. Kliknięcie pinezki otwiera to miejsce.',
  'help.ctx.collections.bullet.6':
    'Panel szczegółów: kliknij wiersz, by zobaczyć okładkę, kategorię, etykiety, status, opis i linki, z akcjami Edytuj, Kopiuj do podróży i Usuń z listy.',
  // create-list
  'help.guide.create-list.title': 'Utworzyć listę',
  'help.guide.create-list.goal': 'Załóż nową nazwaną listę, z kolorem i okładką, gotową na miejsca.',
  'help.guide.create-list.step.1': 'Kliknij Nowa lista u góry paska list.',
  'help.guide.create-list.step.2':
    'Nadaj liście nazwę i wybierz kolor. Okładka, opis i linki są opcjonalne; możesz je dodać później przez Edytuj.',
  'help.guide.create-list.step.3': 'Kliknij Utwórz.',
  'help.guide.create-list.result':
    'Lista otwiera się pusta, z Dodaj miejsce i Importuj z podróży jako dwoma sposobami jej wypełnienia.',
  'help.guide.create-list.tip.1':
    'Okładką może być Twój własny wgrany obraz albo zdjęcie znalezione przez wyszukiwanie Unsplash w tym samym oknie.',
  // add-place
  'help.guide.add-place.title': 'Dodać miejsce',
  'help.guide.add-place.goal':
    'Znajdź miejsce i zapisz je na otwartej liście z nazwą, kategorią, statusem i notatkami za jednym razem.',
  'help.guide.add-place.step.1': 'Kliknij + w wierszu filtrów nad miejscami.',
  'help.guide.add-place.step.2':
    'Wpisz miejsce w pole wyszukiwania i wybierz wynik. Nazwa, adres i współrzędne uzupełniają się z niego.',
  'help.guide.add-place.step.3':
    'Ustaw status i, jeśli chcesz, kategorię, opis i linki, a potem kliknij Dodaj. Okno zostaje otwarte na kolejne miejsce; Anuluj je zamyka.',
  'help.guide.add-place.result': 'Miejsce pojawia się na liście, a gdy ma współrzędne, także jako pinezka na mapie.',
  'help.guide.add-place.tip.1':
    'Z wnętrza podróży Zapisz w kolekcji w inspektorze miejsca lub w menu miejsca umieszcza miejsce z podróży na liście bez opuszczania podróży.',
  'help.guide.add-place.tip.2':
    'Lista musi być Twoja albo taka, na której jesteś edytorem lub administratorem; + nie ma na Wszystkie zapisane ani na liście, którą tylko oglądasz.',
  // import-from-trip
  'help.guide.import-from-trip.title': 'Zaimportować miejsca z podróży',
  'help.guide.import-from-trip.goal':
    'Przenieś miejsca całej podróży na listę za jednym razem, zamiast zapisywać je jedno po drugim.',
  'help.guide.import-from-trip.step.1':
    'Kliknij przycisk importu ze strzałką w chmurze w wierszu filtrów. Na pustej liście ta sama akcja jest obok Dodaj miejsce.',
  'help.guide.import-from-trip.step.2': 'Wybierz jedną ze swoich podróży.',
  'help.guide.import-from-trip.step.3':
    'Zaznacz miejsca, które chcesz. Miejsca już obecne na liście są wyszarzone; te, których nie ma żaden dzień podróży, są na starcie zaznaczone. Tylko nowe ukrywa to, co już masz.',
  'help.guide.import-from-trip.step.4': 'Kliknij Importuj. Przycisk zawsze mówi, ile miejsc zaraz zostanie dodanych.',
  'help.guide.import-from-trip.result':
    'Miejsca są kopiowane na listę z nazwą, adresem, współrzędnymi, opisem i kategorią. Podróż zostaje taka, jaka była.',
  'help.guide.import-from-trip.tip.1':
    'Duplikaty po nazwie lub współrzędnych są pomijane automatycznie, więc podwójny import nic nie psuje.',
  'help.guide.import-from-trip.tip.2':
    'Na liście miejsc w podróży tryb zaznaczania oferuje zamiast tego Zapisz w kolekcji dla ręcznie wybranego zestawu miejsc.',
  // place-status
  'help.guide.place-status.title': 'Ustawić status miejsca',
  'help.guide.place-status.goal': 'Miej pod kontrolą, co jest pomysłem, co jest na krótkiej liście, a gdzie już byłeś.',
  'help.guide.place-status.step.1':
    'Kliknij plakietkę statusu na prawym końcu wiersza miejsca. Pomysł zmienia się w Chcę odwiedzić.',
  'help.guide.place-status.step.2':
    'Kliknij ją ponownie, by ustawić Odwiedzone, i jeszcze raz, by zacząć od nowa od Pomysł.',
  'help.guide.place-status.result':
    'Plakietka i jej kolor zmieniają się od razu; filtr statusu nad listą liczy razem z nią.',
  'help.guide.place-status.tip.1':
    'Status to sprawa Collections: kopiowanie miejsca do podróży nie zabiera go ze sobą.',
  'help.guide.place-status.tip.2':
    'Z podróży Zapisz na liście pokazuje plakietkę statusu dla każdej listy, na której jest miejsce, a panel miejsc ma akcję Oznacz jako odwiedzone dla zaznaczenia.',
  // place-detail
  'help.guide.place-detail.title': 'Otworzyć zapisane miejsce',
  'help.guide.place-detail.goal': 'Zobacz wszystko o miejscu i działaj na nim: edytuj, kopiuj do podróży, usuń.',
  'help.guide.place-detail.step.1':
    'Kliknij wiersz miejsca. Panel szczegółów otwiera się obok listy, a mapa przesuwa się do miejsca.',
  'help.guide.place-detail.step.2':
    'Na dole są Edytuj, Kopiuj do podróży i Usuń z listy; aparat na okładce zamienia automatyczne zdjęcie na Twoje własne.',
  'help.guide.place-detail.result':
    'Edytuj odblokowuje nazwę, kategorię, etykiety, adres, współrzędne, opis i linki bezpośrednio w panelu.',
  'help.guide.place-detail.tip.1':
    'Okładka jest pobierana automatycznie, gdy miejsce nie ma własnego zdjęcia. Twój własny plik może być JPG, PNG, GIF lub WebP do 20 MB.',
  'help.guide.place-detail.tip.2':
    'Członkowie udostępnionej listy mogą tu też zostawić ocenę w gwiazdkach, a filtr oceny w wierszu filtrów używa średniej.',
  // labels
  'help.guide.labels.title': 'Grupować miejsca etykietami',
  'help.guide.labels.goal': 'Nadaj liście własne etykiety, na przykład dzielnice lub dni, poza wspólnymi kategoriami.',
  'help.guide.labels.step.1': 'Otwórz menedżera etykiet z kontrolki etykiet w wierszu filtrów.',
  'help.guide.labels.step.2':
    'Wpisz nazwę, wybierz kolor i kliknij Dodaj etykietę. Istniejące etykiety zmienisz, przekolorujesz lub usuniesz w tym samym oknie.',
  'help.guide.labels.step.3':
    'Włącz Zaznacz, zaznacz miejsca i kliknij Przypisz etykietę na pasku zaznaczenia. Pojedyncze miejsce przyjmuje etykiety także przez Edytuj w panelu szczegółów.',
  'help.guide.labels.step.4':
    'Wybierz jedną lub więcej etykiet w wierszu filtrów, by zawęzić listę i mapę do miejsc noszących którąkolwiek z nich.',
  'help.guide.labels.result':
    'Miejsca z etykietami pokazują je w wierszu; filtr etykiet jest dostępny dla każdego członka, także widzów.',
  'help.guide.labels.tip.1':
    'Etykiety należą do tej jednej listy, na której powstały. Przeniesienie miejsca na inną listę je odrzuca.',
  'help.guide.labels.tip.2': 'Zarządzanie etykietami i ich przypisywanie wymaga praw edycji do listy.',
  // filter-select
  'help.guide.filter-select.title': 'Filtrować i zaznaczać miejsca',
  'help.guide.filter-select.goal': 'Zawęź listę i działaj na wielu miejscach naraz.',
  'help.guide.filter-select.step.1':
    'Użyj list rozwijanych w wierszu filtrów: status, kategoria, minimalna ocena i kolejność sortowania. Każda pokazuje, ile miejsc by zostawiła.',
  'help.guide.filter-select.step.2':
    'Kliknij Zaznacz. Każdy wiersz dostaje pole wyboru i pojawia się pasek zaznaczenia.',
  'help.guide.filter-select.step.3':
    'Zaznacz miejsca albo użyj Zaznacz wszystko dla wszystkiego, co jest aktualnie przefiltrowane, a potem wybierz Przypisz etykietę, Przenieś do listy, Duplikuj do listy, Kopiuj do podróży lub Usuń.',
  'help.guide.filter-select.result':
    'Akcje działają na całe zaznaczenie naraz. × po prawej wychodzi z trybu zaznaczania.',
  'help.guide.filter-select.tip.1':
    'Zaznacz wszystko podąża za filtrem, więc przefiltrowanie do Chcę odwiedzić i zaznaczenie wszystkiego to szybki sposób na działanie na krótkiej liście.',
  // copy-to-trip
  'help.guide.copy-to-trip.title': 'Skopiować miejsca do podróży',
  'help.guide.copy-to-trip.goal': 'Zamień zapisane miejsca w przystanki jednej ze swoich podróży.',
  'help.guide.copy-to-trip.step.1':
    'Włącz Zaznacz i zaznacz miejsca albo otwórz jedno miejsce i użyj Kopiuj do podróży w jego panelu szczegółów.',
  'help.guide.copy-to-trip.step.2': 'Kliknij Kopiuj do podróży na pasku zaznaczenia.',
  'help.guide.copy-to-trip.step.3': 'Wybierz podróż. Pole wyszukiwania zawęża długą listę.',
  'help.guide.copy-to-trip.result':
    'Miejsca lądują na liście miejsc tej podróży z nazwą, opisem, kategorią, notatkami, ceną, współrzędnymi, zdjęciem i tagami. W kolekcji nic się nie zmienia.',
  'help.guide.copy-to-trip.tip.1':
    'Widzowie udostępnionej listy też mogą to zrobić; to kopiuje z listy, nie zmienia jej.',
  // share-list
  'help.guide.share-list.title': 'Udostępnić listę komuś',
  'help.guide.share-list.goal': 'Planuj listę razem z innymi osobami na tym TREK-u, na żywo.',
  'help.guide.share-list.step.1': 'Kliknij Udostępnij w nagłówku swojej listy.',
  'help.guide.share-list.step.2': 'Wybierz użytkownika i rolę: Widz, Edytor lub Administrator.',
  'help.guide.share-list.step.3':
    'Kliknij Wyślij zaproszenie. Osoba widnieje jako oczekujące zaproszenie, dopóki nie przyjmie zaproszenia w swoim pasku list.',
  'help.guide.share-list.result':
    'Po przyjęciu lista pojawia się u tej osoby pod Udostępniona, a każda zmiana synchronizuje się na żywo. Członkowie i ich role pozostają edytowalni w tym samym oknie.',
  'help.guide.share-list.tip.1':
    'Widzowie mogą oglądać, oceniać i kopiować miejsca do własnych podróży. Edytorzy dodają i edytują miejsca oraz etykiety. Administratorzy mogą także usuwać.',
  'help.guide.share-list.tip.2':
    'Tylko właściciel zaprasza i usuwa osoby; członek może sam opuścić udostępnioną listę.',
  // export-list
  'help.guide.export-list.title': 'Wyeksportować listę jako plik',
  'help.guide.export-list.goal': 'Przekaż listę komuś na innym TREK-u albo zabierz ją do aplikacji z mapami.',
  'help.guide.export-list.step.1': 'Kliknij Eksportuj w nagłówku listy.',
  'help.guide.export-list.step.2':
    'Wybierz Lista TREK dla innego TREK-a, z etykietami i statusem, albo GPX dla OsmAnd, Organic Maps, Garmina i innych aplikacji, które czytają punkty trasy.',
  'help.guide.export-list.result': 'Plik się pobiera. Każdy członek udostępnionej listy może ją wyeksportować.',
  'help.guide.export-list.tip.1':
    'Miejsce bez współrzędnych nie może być punktem trasy GPX; jest pomijane, a TREK mówi Ci, ilu to dotyczyło.',
  'help.guide.export-list.tip.2':
    'Oceny, członkowie i wgrane zdjęcia celowo zostają; należą do tego TREK-a, nie do listy.',
  // import-file
  'help.guide.import-file.title': 'Zaimportować listę z pliku',
  'help.guide.import-file.goal': 'Wczytaj plik listy TREK albo plik GPX, jako nową listę lub do jednej, którą masz.',
  'help.guide.import-file.step.1': 'Kliknij przycisk importu ze strzałką w górę obok Nowa lista na pasku list.',
  'help.guide.import-file.step.2':
    'Wybierz plik. TREK pokazuje, co w nim jest, zanim cokolwiek się stanie: nazwę, ile miejsc i etykiet.',
  'help.guide.import-file.step.3':
    'Zostaw Nowa lista i zmień nazwę, jeśli chcesz, albo wybierz Dodaj do listy, by umieścić miejsca na liście, którą możesz edytować, a potem kliknij Importuj.',
  'help.guide.import-file.result':
    'Lądujesz na liście z zaimportowanymi miejscami. Dodawanie do listy tylko dodaje; miejsca, które już tam są, zachowują status, notatki i etykiety.',
  'help.guide.import-file.tip.1':
    'Z GPX każdy nazwany punkt trasy staje się miejscem; ślady to linie i są pomijane, a podgląd mówi, ile punktów to było.',
  'help.guide.import-file.tip.2':
    'Plik, który nie jest ani listą TREK, ani GPX, jest odrzucany z podaniem powodu; pojedyncze nieczytelne miejsce jest pomijane, nie cały plik.',
  // edit-list
  'help.guide.edit-list.title': 'Edytować lub usunąć listę',
  'help.guide.edit-list.goal': 'Zmień nazwę, kolor, okładkę, opis lub linki listy albo usuń listę.',
  'help.guide.edit-list.step.1': 'Kliknij Edytuj w nagłówku listy. Widzi go tylko właściciel.',
  'help.guide.edit-list.step.2':
    'Zmień, co chcesz, i kliknij Zapisz. Usuń listę na dole po lewej usuwa listę ze wszystkimi jej miejscami, po potwierdzeniu.',
  'help.guide.edit-list.result': 'Nagłówek od razu przyjmuje nowy kolor, okładkę i opis.',
  'help.guide.edit-list.tip.1':
    'Usunięcia listy nie da się cofnąć. Najpierw ją wyeksportuj, jeśli chcesz zachować kopię.',
  // all-saved
  'help.guide.all-saved.title': 'Przeszukać całą bibliotekę',
  'help.guide.all-saved.goal': 'Spójrz naraz na każdą listę, którą posiadasz.',
  'help.guide.all-saved.step.1':
    'Kliknij Wszystkie zapisane na pasku list. Sumuje miejsca każdej listy, którą posiadasz lub współposiadasz.',
  'help.guide.all-saved.step.2':
    'Użyj pola wyszukiwania i filtrów jak na każdej liście; Zaznacz też tu działa, do kopiowania do podróży.',
  'help.guide.all-saved.result':
    'Jeden widok na wszystkie Twoje zapisane miejsca, bez dodawania i importowania, bo nie ma tu jednej listy, na którą można by je położyć.',
  'help.guide.all-saved.tip.1': 'Etykiety są per lista, więc filtr etykiet nie jest oferowany na Wszystkie zapisane.',

  // ── Screen: journey ───────────────────────────────────────────────────────────────────
  'help.ctx.journey.title': 'Dziennik podróży',
  'help.ctx.journey.summary':
    'Dziennik podróży to Twój dziennik z podróży, w którym zdjęcia są na pierwszym miejscu. Każdy dziennik jest związany z jedną lub kilkoma podróżami i rośnie dzień po dniu z wpisów z historią, zdjęciami, nastrojem i pogodą. Ten ekran wypisuje Twoje dzienniki; otwórz jeden, żeby pisać.',
  'help.ctx.journey.bullet.1':
    'Baner u góry pokazuje trwający dziennik albo Twój najnowszy, z liczbą wpisów, zdjęć i miejsc. Kontynuuj pisanie otwiera go na dzisiaj.',
  'help.ctx.journey.bullet.2':
    'Poniżej jedna karta na dziennik z okładką, podtytułem, datami i liczbami. Kliknij kartę, by go otworzyć.',
  'help.ctx.journey.bullet.3': 'Ostatnia karta w siatce, Utwórz nowy dziennik podróży, zakłada nowy z Twoich podróży.',
  // create-journey
  'help.guide.create-journey.title': 'Utworzyć dziennik podróży',
  'help.guide.create-journey.goal': 'Załóż dziennik do podróży, w którym jej miejsca czekają już jako propozycje.',
  'help.guide.create-journey.step.1': 'Kliknij Utwórz nowy dziennik podróży, ostatnią kartę w siatce.',
  'help.guide.create-journey.step.2':
    'Nadaj mu nazwę i, jeśli chcesz, podtytuł, potem zaznacz podróże, do których należy. Licznik mówi, ile miejsc zostanie wczytanych.',
  'help.guide.create-journey.step.3': 'Kliknij Utwórz dziennik podróży.',
  'help.guide.create-journey.result':
    'Dziennik się otwiera. Każde miejsce z powiązanych podróży siedzi na osi czasu jako propozycja, po jednej na każdy dzień, na którym stoi, gotowa do opisania.',
  'help.guide.create-journey.tip.1': 'Kolejne podróże możesz powiązać później w Ustawieniach dziennika podróży.',
  'help.guide.create-journey.tip.2': 'Dziennik bez podróży też działa; wpisy dodajesz wtedy ręcznie.',
  // open-journey
  'help.guide.open-journey.title': 'Otworzyć dziennik podróży',
  'help.guide.open-journey.goal': 'Wejdź do dziennika i wiedz, gdzie się otworzy.',
  'help.guide.open-journey.step.1':
    'Kliknij kartę. Każda pokazuje okładkę, daty oraz ile wpisów, zdjęć i miejsc zawiera dziennik.',
  'help.guide.open-journey.result':
    'Trwający dziennik otwiera się na dzisiaj albo na ostatnim wpisie przed dzisiaj, gdy nic jeszcze nie napisano; zakończony otwiera się na początku.',
  'help.guide.open-journey.tip.1':
    'Okładką jest pierwsze zdjęcie dziennika, chyba że ustawisz inną w Ustawieniach dziennika podróży.',
  // continue-writing
  'help.guide.continue-writing.title': 'Kontynuować trwający dziennik',
  'help.guide.continue-writing.goal': 'Wskocz od razu na dzisiejszą stronę dziennika, w którym właśnie jesteś.',
  'help.guide.continue-writing.step.1':
    'Kliknij Kontynuuj pisanie w banerze u góry. Pokazuje on trwający dziennik albo najnowszy, gdy żaden nie trwa.',
  'help.guide.continue-writing.result':
    'Dziennik otwiera się na dzisiaj albo na ostatnim wpisie przed dzisiaj, gdy nic jeszcze nie napisano.',
  'help.guide.continue-writing.tip.1':
    'Baner podsuwa też propozycję dla podróży, która nie ma jeszcze dziennika; Odrzuć ją chowa.',

  // ── Screen: journey-detail ────────────────────────────────────────────────────────────
  'help.ctx.journey-detail.title': 'Dziennik',
  'help.ctx.journey-detail.summary':
    'Jeden otwarty dziennik: oś czasu po lewej, dzień po dniu, i mapa po prawej z każdym wpisem i miejscami powiązanych podróży. Wszystko, co dodaje coś do dziennika, jest u góry; nagłówek mieści liczby, Studio, przełącznik sugestii i Ustawienia dziennika podróży.',
  'help.ctx.journey-detail.bullet.1':
    'Nagłówek: okładka, tytuł i podtytuł, liczba dni, miejsc, wpisów i zdjęć, a po prawej Studio, przełącznik sugestii i Ustawienia dziennika podróży.',
  'help.ctx.journey-detail.bullet.2':
    'Pasek narzędzi: zakładki Oś czasu i Galeria, Szukaj w tej podróży oraz Dodaj wpis.',
  'help.ctx.journey-detail.bullet.3':
    'Oś czasu: jedna sekcja na dzień z + do dodania wpisu w tym dniu; karty wpisów ze zdjęciami, nastrojem, pogodą i historią; propozycje z podróży w jaśniejszym stylu z Odrzuć tę propozycję.',
  'help.ctx.journey-detail.bullet.4':
    'Mapa: wpisy jako pinezki połączone przerywaną linią w kolejności dat, miejsca podróży oraz ślady GPX zaimportowane do tych podróży.',
  'help.ctx.journey-detail.bullet.5':
    'Ustawienia dziennika podróży: okładka, nazwa i podtytuł, ślady na mapie, pola wpisu, odrzucone propozycje, powiązane podróże, współtwórcy, udostępnianie publiczne, archiwizacja i usuwanie.',
  'help.ctx.journey-detail.bullet.6':
    'Nad długą osią czasu unoszą się dwa okrągłe przyciski: powrót na górę i skok do ostatniego wpisu.',
  // add-entry
  'help.guide.add-entry.title': 'Napisać wpis',
  'help.guide.add-entry.goal': 'Dodaj historię dnia z tytułem, tekstem, nastrojem i pogodą.',
  'help.guide.add-entry.step.1': 'Kliknij Dodaj wpis na pasku narzędzi albo + w nagłówku dnia, by zacząć od tego dnia.',
  'help.guide.add-entry.step.2':
    'Nazwij tę chwilę i napisz historię. Pasek nad tekstem dodaje pogrubienie, kursywę, nagłówki, cytaty, linki i listy w Markdownie.',
  'help.guide.add-entry.step.3':
    'Wybierz nastrój i pogodę, sprawdź datę i, jeśli chcesz, przypnij lokalizację: wyszukaj miejsce albo użyj swojej bieżącej pozycji.',
  'help.guide.add-entry.step.4': 'Kliknij Zapisz.',
  'help.guide.add-entry.result':
    'Wpis pojawia się w swoim dniu na osi czasu i jako pinezka na mapie. Jego liczby aktualizują się w nagłówku.',
  'help.guide.add-entry.tip.1': 'Pisanie w propozycji to ten sam edytor, z miejscem już ustawionym.',
  'help.guide.add-entry.tip.2':
    'Tagi na dole to wolny tekst, ukryta perełka albo najlepszy posiłek, a wyszukiwanie je znajduje.',
  // entry-photos
  'help.guide.entry-photos.title': 'Dodać zdjęcia i filmy do wpisu',
  'help.guide.entry-photos.goal': 'Umieść obrazy w danym dniu; pierwszy staje się okładką wpisu.',
  'help.guide.entry-photos.step.1': 'Otwórz menu wpisu przez ⋯ na jego karcie i wybierz Edytuj.',
  'help.guide.entry-photos.step.2':
    'Kliknij Prześlij zdjęcia i wskaż pliki. Z galerii bierze obrazy, które są już w galerii dziennika; External photos przeszukuje podłączoną bibliotekę Immich lub Synology pod kątem tego dnia.',
  'help.guide.entry-photos.step.3':
    'Najedź na obraz, by zobaczyć Ustaw jako 1. i wybrać okładkę, potem kliknij Zapisz.',
  'help.guide.entry-photos.result': 'Zdjęcia widać na karcie i w galerii; pierwsze jest wszędzie miniaturą.',
  'help.guide.entry-photos.tip.1':
    'Filmy trafiają do wpisu tak samo: mp4, m4v, webm lub mov do 500 MB, zapisywane tak, jak je przesłano.',
  'help.guide.entry-photos.tip.2':
    'Pliki HEIC z iPhone’a są przy przesyłaniu konwertowane do JPEG, co usuwa ich GPS i metadane aparatu.',
  // suggestions
  'help.guide.suggestions.title': 'Użyć lub odrzucić propozycje',
  'help.guide.suggestions.goal': 'Zamień miejsca swoich podróży we wpisy i uprzątnij te, o których nie będziesz pisać.',
  'help.guide.suggestions.step.1':
    'Propozycja to jaśniejsza karta z nazwą miejsca kursywą. Kliknij ją, by otworzyć edytor z miejscem i dniem już ustawionymi.',
  'help.guide.suggestions.step.2':
    'Kliknij Odrzuć tę propozycję na karcie, której nie użyjesz. Znika z osi czasu bez usuwania, a synchronizacja podróży nie zaproponuje jej ponownie.',
  'help.guide.suggestions.step.3':
    'Zmieniłeś zdanie? Ustawienia dziennika podróży pokazują, ile jest odrzuconych, a Przywróć odrzucone propozycje przywraca je wszystkie.',
  'help.guide.suggestions.result':
    'Oś czasu zawiera tylko to, co zamierzasz napisać; przełącznik w nagłówku chowa wszystkie propozycje naraz, gdy czytasz.',
  'help.guide.suggestions.tip.1': 'Miejsce trwające przez dwa dni daje propozycję na każdym z nich.',
  'help.guide.suggestions.tip.2': 'Propozycje nigdy nie liczą się w statystykach; tylko napisane wpisy.',
  // add-on-day
  'help.guide.add-on-day.title': 'Dodać wpis we wcześniejszym dniu',
  'help.guide.add-on-day.goal': 'Napisz o dniu, który już minął, bez poprawiania daty potem.',
  'help.guide.add-on-day.step.1': 'Kliknij + w nagłówku tego dnia.',
  'help.guide.add-on-day.step.2': 'Edytor otwiera się z ustawioną tą datą. Pisz i Zapisz jak zwykle.',
  'help.guide.add-on-day.result': 'Wpis od razu ląduje we właściwym dniu.',
  'help.guide.add-on-day.tip.1': 'W obrębie dnia strzałki w menu wpisu przesuwają go wcześniej lub później.',
  // pros-cons
  'help.guide.pros-cons.title': 'Dodać werdykt',
  'help.guide.pros-cons.goal': 'Podsumuj dzień tym, co było świetne, a co nie.',
  'help.guide.pros-cons.step.1':
    'W edytorze znajdź Zalety i wady pod historią. Wpisz punkt w Zalety lub Wady i użyj Dodaj kolejny dla następnego.',
  'help.guide.pros-cons.step.2': 'Zapisz. Werdykt widać na karcie jako dwie krótkie listy.',
  'help.guide.pros-cons.result': 'Kciuk w górę i kciuk w dół na pierwszy rzut oka, pod historią.',
  'help.guide.pros-cons.tip.1':
    'Dziennik, który nie używa werdyktów, może wyłączyć tę sekcję pod Pola wpisu w Ustawieniach dziennika podróży.',
  // search-journey
  'help.guide.search-journey.title': 'Znaleźć coś w długim dzienniku',
  'help.guide.search-journey.goal': 'Dotrzyj do wpisu, o który Ci chodzi, bez przewijania tygodni.',
  'help.guide.search-journey.step.1':
    'Wpisz coś w Szukaj w tej podróży na pasku narzędzi. Oś czasu filtruje się w trakcie pisania, po tytułach, historiach, miejscach i tagach. Znaki diakrytyczne i wielkość liter nie mają znaczenia.',
  'help.guide.search-journey.step.2':
    'Przełącznik sugestii w nagłówku chowa nienapisane karty, gdy czytasz. Gdy oś czasu jest długa, nad jej dolną krawędzią unoszą się dwa okrągłe przyciski: powrót na górę i skok do ostatniego wpisu.',
  'help.guide.search-journey.result': 'Zostają tylko pasujące wpisy; wyczyść pole, by znów zobaczyć wszystko.',
  'help.guide.search-journey.tip.1':
    'Trwający dziennik otwiera się na dzisiaj, więc bieżąca strona zwykle jest już w widoku.',
  'help.guide.search-journey.tip.2': 'Tagi też się liczą: szukanie ukryta perełka znajduje każdy wpis z tym tagiem.',
  // gallery-map
  'help.guide.gallery-map.title': 'Przeglądać galerię i mapę',
  'help.guide.gallery-map.goal': 'Zobacz cały dziennik jako obrazy i jako miejsca na mapie.',
  'help.guide.gallery-map.step.1':
    'Przełącz na Galeria na pasku narzędzi: każde zdjęcie każdego wpisu plus obrazy przesłane bezpośrednio do galerii. Kliknij jedno, by otworzyć lightbox.',
  'help.guide.gallery-map.step.2':
    'Mapa po prawej pokazuje wpisy jako pinezki w kolejności dat, miejsca powiązanych podróży oraz każdy ślad GPX zaimportowany do tych podróży, w kolorze, jaki ma w planerze.',
  'help.guide.gallery-map.result':
    'Najedź na ślad, by zobaczyć jego nazwę. Przerywaną linię między wpisami rysuje TREK; ślad to trasa, którą naprawdę nagrałeś.',
  'help.guide.gallery-map.tip.1': 'Ślady można wyłączyć dla dziennika w Ustawieniach dziennika podróży.',
  'help.guide.gallery-map.tip.2':
    'Zdjęcia z galerii z lokalizacją pojawiają się też na mapie publicznej, gdy udostępnione są zarówno Galeria, jak i Mapa.',
  // entry-fields
  'help.guide.entry-fields.title': 'Wyłączyć pola wpisu',
  'help.guide.entry-fields.goal': 'Ogranicz edytor do tego, czego używa ten dziennik.',
  'help.guide.entry-fields.step.1': 'Otwórz Ustawienia dziennika podróży z nagłówka.',
  'help.guide.entry-fields.step.2': 'Pod Pola wpisu wyłącz Nastrój, Pogoda lub Za i przeciw.',
  'help.guide.entry-fields.result':
    'Edytor przestaje o nie pytać. Nic napisanego nie ginie: ponowne włączenie pola przywraca zapisane wartości do widoku, a udostępniony dziennik chowa te same pola.',
  'help.guide.entry-fields.tip.1':
    'Przełączniki działają osobno dla każdego dziennika, więc wyjazd służbowy i wakacje mogą się różnić.',
  // link-trip
  'help.guide.link-trip.title': 'Powiązać kolejną podróż',
  'help.guide.link-trip.goal': 'Wprowadź miejsca drugiej podróży do dziennika jako propozycje.',
  'help.guide.link-trip.step.1': 'Otwórz Ustawienia dziennika podróży z nagłówka.',
  'help.guide.link-trip.step.2': 'Pod powiązanymi podróżami kliknij Dodaj podróż.',
  'help.guide.link-trip.step.3': 'Wybierz podróż.',
  'help.guide.link-trip.result':
    'Jej miejsca trafiają na oś czasu jako propozycje w swoich dniach, a jej ślady GPX dołączają do mapy.',
  'help.guide.link-trip.tip.1': '× obok powiązanej podróży odłącza ją z powrotem; wpisy, które napisałeś, zostają.',
  'help.guide.link-trip.tip.2':
    'Wpisy z dniem liczą się tylko raz, niezależnie od tego, ile podróży obejmuje ten dzień.',
  // share-public
  'help.guide.share-public.title': 'Udostępnić dziennik publicznie',
  'help.guide.share-public.goal': 'Daj osobom bez konta TREK link tylko do odczytu.',
  'help.guide.share-public.step.1': 'Otwórz Ustawienia dziennika podróży i znajdź Udostępnianie publiczne.',
  'help.guide.share-public.step.2': 'Kliknij Utwórz link udostępniania.',
  'help.guide.share-public.step.3':
    'Wybierz, co widzą odwiedzający: Oś czasu, Galeria i Mapa to osobne przełączniki. Kopiuj umieszcza link w schowku.',
  'help.guide.share-public.result':
    'Każdy z linkiem widzi włączone sekcje i nic więcej; pola wyłączone w Pola wpisu pozostają tam też ukryte.',
  'help.guide.share-public.tip.1':
    'Zdjęcia pojawiają się na mapie publicznej tylko wtedy, gdy Galeria i Mapa są obie włączone; przy wyłączonej Mapie ich współrzędne są usuwane, zanim opuszczą serwer.',
  'help.guide.share-public.tip.2': 'Usuń link w tym samym miejscu, by zakończyć udostępnianie.',
  // contributors
  'help.guide.contributors.title': 'Pisać razem',
  'help.guide.contributors.goal': 'Pozwól towarzyszowi podróży dodawać własne wpisy i zdjęcia.',
  'help.guide.contributors.step.1': 'Otwórz Ustawienia dziennika podróży i przewiń do współtwórców.',
  'help.guide.contributors.step.2': 'Kliknij Zaproś współtwórcę i wyszukaj użytkownika po nazwie lub e-mailu.',
  'help.guide.contributors.step.3': 'Wybierz rolę i potwierdź.',
  'help.guide.contributors.result':
    'Dziennik pojawia się na ich liście, a ich wpisy noszą ich nazwisko. Współtwórcę usuniesz przez × obok niego.',
  'help.guide.contributors.tip.1': 'Współtwórcy są dla osób na tym TREK-u. Dla wszystkich innych jest link publiczny.',
  // studio
  'help.guide.studio.title': 'Ułożyć dziennik jako fotoksiążkę',
  'help.guide.studio.goal': 'Zamień dziennik w strony do druku.',
  'help.guide.studio.step.1': 'Kliknij Studio w nagłówku. Projektant otwiera się nad dziennikiem.',
  'help.guide.studio.step.2':
    'Nazwa dziennika po lewej stronie górnego paska to droga powrotna; przenosi Cię tam, gdzie byłeś.',
  'help.guide.studio.result':
    'Listwa stron po lewej, rozkładówka na warsztacie, właściwości po prawej. Auto layout buduje książkę z Twoich wpisów; Export tworzy PDF gotowy do druku.',
  'help.guide.studio.tip.1': 'Studio wymaga okna o szerokości co najmniej 1024 px i nie jest oferowane na telefonie.',
  'help.guide.studio.tip.2':
    'Książka dziedziczy dostęp dziennika: kto może czytać dziennik, może ją otworzyć, kto może edytować, może zapisywać.',
  // archive-journey
  'help.guide.archive-journey.title': 'Zarchiwizować lub usunąć dziennik',
  'help.guide.archive-journey.goal': 'Zamknij zakończony dziennik albo usuń go na dobre.',
  'help.guide.archive-journey.step.1': 'Otwórz Ustawienia dziennika podróży.',
  'help.guide.archive-journey.step.2':
    'Na dole Archiwizuj podróż kończy go i oznacza jako zarchiwizowany; Przywróć podróż przywraca go. Usuń usuwa go ze wszystkimi wpisami i zdjęciami, po potwierdzeniu.',
  'help.guide.archive-journey.result':
    'Zarchiwizowany dziennik pozostaje do czytania i udostępniania; po prostu nie otwiera się już na dzisiaj.',
  'help.guide.archive-journey.tip.1':
    'Usunięcia nie da się cofnąć i nie dotyka ono podróży, z którymi dziennik był powiązany.',
  'help.guide.archive-journey.tip.2': 'Okładka, nazwa i podtytuł są w tym samym oknie, u góry.',

  // ── Screen: journey-studio ────────────────────────────────────────────────────────────
  'help.ctx.journey-studio.title': 'Studio',
  'help.ctx.journey-studio.summary':
    'TREK Studio układa dziennik podróży w fotoksiążkę do druku. Otwiera się nad dziennikiem: po lewej pasek ze stronami i zawartością, pośrodku rozkładówka, nad którą pracujesz, po prawej jej właściwości. Auto layout buduje pierwszy szkic z Twoich wpisów; wszystko dalej należy do Ciebie: przesuwanie, kadrowanie i zmiana stylu, z cofaniem każdego kroku.',
  'help.ctx.journey-studio.bullet.1':
    'Górny pasek: Back to the journey, Book view, Undo i Redo, Page format, Auto layout oraz Export. Znacznik Zapisano obok tytułu mówi, kiedy książka jest zapisana.',
  'help.ctx.journey-studio.bullet.2':
    'Pasek po lewej z pięcioma sekcjami: Pages, Content (zdjęcia i wpisy dziennika), Elements (tekst, kształty, linie, siatki, ramki, ikony), Podróż (mapy, kraje, flagi i znaczniki zbudowane z dziennika) oraz Layouts.',
  'help.ctx.journey-studio.bullet.3':
    'Obszar roboczy: bieżąca rozkładówka ze spadem i marginesami bezpieczeństwa, pod nią pasek powiększenia, Fit to view i po prawej Pobierz tę rozkładówkę.',
  'help.ctx.journey-studio.bullet.4':
    'Properties po prawej: pozycja i rozmiar, kadrowanie i punkt ogniskowy, wypełnienie lub dopasowanie, wygląd, narożniki, ramka, kolejność warstw i blokada tego, co zaznaczone; numery stron i dokument, gdy nic nie jest zaznaczone.',
  'help.ctx.journey-studio.bullet.5':
    'Książka ma kształt oprawionej: okładka, pojedyncza pierwsza strona, rozkładówki, pojedyncza ostatnia strona i tylna okładka. Numery stron liczą się od pierwszej strony i drukują się tak, jak je widzisz.',
  'help.ctx.journey-studio.bullet.6':
    'Kilka osób może projektować naraz: każdy widzi kursory pozostałych z ich imionami, a zapis wersji, którą ktoś inny w międzyczasie zmienił, wraca jako konflikt zamiast nadpisać jego pracę.',
  // studio-auto-layout
  'help.guide.studio-auto-layout.title': 'Zbudować książkę automatycznie',
  'help.guide.studio-auto-layout.goal':
    'Uzyskaj jednym kliknięciem kompletny pierwszy szkic z wpisów i zdjęć dziennika.',
  'help.guide.studio-auto-layout.step.1': 'Kliknij Auto layout na górnym pasku.',
  'help.guide.studio-auto-layout.step.2':
    'Wybierz Cała książka: zastępuje każdą stronę, zachowując Twój tytuł i ustawienia strony. Ta strona przebudowuje tylko tę na ekranie i jest dostępna na rozkładówce, która powstała z wpisu.',
  'help.guide.studio-auto-layout.step.3': 'Przejrzyj pasek stron. Undo cofa cały układ, jeśli wolałeś to, co miałeś.',
  'help.guide.studio-auto-layout.result':
    'Jedna rozkładówka na wpis, po kolei, z jego zdjęciami, tytułem i historią rozmieszczonymi za Ciebie. Każdy element nadal podąża za swoim wpisem, dopóki go nie edytujesz.',
  'help.guide.studio-auto-layout.tip.1': 'Obie pozycje to zwykłe kroki cofania, więc próbuj ich śmiało.',
  'help.guide.studio-auto-layout.tip.2':
    'Element, który Auto layout powiązał z wpisem, nadąża za zmianami tego wpisu, dopóki nie ruszysz go w Properties; to zrywa powiązanie.',
  // studio-pages
  'help.guide.studio-pages.title': 'Dodać, przenieść i usunąć rozkładówki',
  'help.guide.studio-pages.goal': 'Kształtuj książkę strona po stronie.',
  'help.guide.studio-pages.step.1':
    'Otwórz Pages na pasku. Miniatury to książka po kolei: okładka, pierwsza strona, rozkładówki, ostatnia strona, tylna okładka.',
  'help.guide.studio-pages.step.2':
    'Dodaj stronę na dole wstawia nową przed ostatnią stroną; + między dwiema miniaturami wstawia ją dokładnie tam.',
  'help.guide.studio-pages.step.3':
    'Najedź na miniaturę, by zobaczyć jej akcje: Przenieś wcześniej, Przenieś później, Duplikuj stronę i Usuń stronę. Kliknij miniaturę, by otworzyć tę rozkładówkę w obszarze roboczym.',
  'help.guide.studio-pages.result':
    'Okładka, pierwsza i ostatnia strona oraz tylna okładka zostają na miejscu; nowe rozkładówki zawsze lądują między nimi.',
  'help.guide.studio-pages.tip.1':
    'Book view na górnym pasku pokazuje całą książkę jako arkusze, tak jak zostanie oprawiona.',
  'help.guide.studio-pages.tip.2': 'Numery stron włączasz pod Dokument w Properties, gdy nic nie jest zaznaczone.',
  // studio-layouts
  'help.guide.studio-layouts.title': 'Zastosować układ do rozkładówki',
  'help.guide.studio-layouts.goal': 'Nadaj rozkładówce gotowe rozmieszczenie ramek na zdjęcia i tekst.',
  'help.guide.studio-layouts.step.1':
    'Otwórz Layouts na pasku. Trzynaście układów rozkładówek i osobny zestaw dla okładki, tyłu i pojedynczych stron.',
  'help.guide.studio-layouts.step.2':
    'Kliknij jeden. Rozkładówka w obszarze roboczym przejmuje jego ramki; zdjęcia i tekst, które już miałeś, są do nich wlewane.',
  'help.guide.studio-layouts.result':
    'Puste ramki czekają na zawartość: przeciągnij na jedną zdjęcie z Content albo użyj Add to this page.',
  'help.guide.studio-layouts.tip.1': 'Układ to krok cofania jak każdy inny.',
  // studio-content
  'help.guide.studio-content.title': 'Umieścić zdjęcia i wpisy na stronie',
  'help.guide.studio-content.goal': 'Przenieś na rozkładówkę własny materiał dziennika.',
  'help.guide.studio-content.step.1':
    'Otwórz Content na pasku. Photos wymienia każde zdjęcie dziennika; Entries wymienia wpisy z ich tekstem.',
  'help.guide.studio-content.step.2':
    'Przeciągnij zdjęcie na rozkładówkę albo na pustą ramkę, albo kliknij pod nim Add to this page. Prześlij zdjęcia dodaje obrazy, których w dzienniku jeszcze nie ma.',
  'help.guide.studio-content.step.3':
    'Pod wpisem Title, Story i Place umieszczają ten tekst na stronie jako element tekstowy; Data i współrzędne trafiają jako znaczniki, a zdjęcia wpisu są wymienione tuż obok.',
  'help.guide.studio-content.result':
    'Upuszczone zdjęcie staje się elementem zdjęciowym; tekst nadal podąża za wpisem, dopóki go nie edytujesz.',
  'help.guide.studio-content.tip.1': 'Pole wyszukiwania u góry Content filtruje obie listy.',
  'help.guide.studio-content.tip.2':
    'Upuszczenie pliku z pulpitu na obszar roboczy przesyła go i umieszcza za jednym razem.',
  // studio-elements
  'help.guide.studio-elements.title': 'Dodać tekst, kształty i ikony',
  'help.guide.studio-elements.goal': 'Ozdób rozkładówkę czymś więcej niż zdjęciami i historiami.',
  'help.guide.studio-elements.step.1': 'Otwórz Elements na pasku.',
  'help.guide.studio-elements.step.2':
    'Kliknij styl tekstu na nagłówek lub podpis, kształt, linię, siatkę, pustą ramkę ze stylem ramki albo ikonę z przeszukiwalnej biblioteki. Każdy ląduje na środku rozkładówki, gotowy do przesunięcia.',
  'help.guide.studio-elements.result':
    'Kliknij dwukrotnie element tekstowy, by w nim pisać; Properties zawiera czcionkę, grubość, rozmiar, odstępy i wyrównanie.',
  'help.guide.studio-elements.tip.1': 'Ramki to puste miejsca na zdjęcia: wrzuć obraz później.',
  // studio-travel
  'help.guide.studio-travel.title': 'Dodać mapę, flagi i liczby',
  'help.guide.studio-travel.goal': 'Zamień samą podróż w liczby na stronie.',
  'help.guide.studio-travel.step.1': 'Otwórz Podróż na pasku.',
  'help.guide.studio-travel.step.2':
    'Wybierz, co dodać: mapę trasy wpisów, kontury krajów, listę lub siatkę krajów, flagi, znacznik daty, dnia lub dystansu, albo podsumowanie całej podróży. Każdy jest budowany z danych dziennika i odświeża się razem z nimi.',
  'help.guide.studio-travel.result':
    'Element pojawia się na rozkładówce; Properties dostosowuje jego styl, a mapie jej obszar.',
  'help.guide.studio-travel.tip.1':
    'Znaczniki podążają za wpisem, z którego powstała rozkładówka, więc znacznik daty na automatycznie ułożonej rozkładówce od razu pokazuje ten dzień.',
  // studio-properties
  'help.guide.studio-properties.title': 'Edytować to, co zaznaczyłeś',
  'help.guide.studio-properties.goal': 'Przesuwaj, kadruj, styluj i układaj warstwami element za pomocą inspektora.',
  'help.guide.studio-properties.step.1':
    'Kliknij element na rozkładówce. Pojawiają się uchwyty do rozmiaru i obrotu; przeciągnij go, by go przesunąć.',
  'help.guide.studio-properties.step.2':
    'Properties po prawej podąża za zaznaczeniem: pozycja i rozmiar, Crop z punktem ogniskowym, który decyduje, co zostaje w kadrze, Wypełnienie lub dopasowanie, filtry Look, promień Corner, Ramka, kolejność warstw i Lock.',
  'help.guide.studio-properties.step.3':
    'Duplikuj i Delete są u góry inspektora; Undo na górnym pasku cofa każdą z tych zmian.',
  'help.guide.studio-properties.result':
    'Zablokowanego elementu nie da się już chwycić na stronie, co chroni gotowy układ, gdy pracujesz wokół niego.',
  'help.guide.studio-properties.tip.1':
    'Kliknięcie z Shiftem zaznacza kilka elementów; inspektor edytuje je wtedy razem.',
  'help.guide.studio-properties.tip.2':
    'Edycja elementu, który umieścił Auto layout, zrywa jego powiązanie z wpisem; przestaje podążać za późniejszymi zmianami tego wpisu.',
  // studio-format
  'help.guide.studio-format.title': 'Wybrać format strony',
  'help.guide.studio-format.goal':
    'Ustaw rozmiar, w jakim książka zostanie wydrukowana, zanim układ zacznie od niego zależeć.',
  'help.guide.studio-format.step.1': 'Kliknij Page format na górnym pasku.',
  'help.guide.studio-format.step.2':
    'Wybierz Square 21 × 21 cm, Square 30 × 30 cm, A4 lub A5 landscape albo portrait, albo wpisz własną szerokość i wysokość w milimetrach. Spad i Strefa są poniżej.',
  'help.guide.studio-format.result':
    'Każda rozkładówka jest rysowana w tym rozmiarze, domyślnie ze spadem 3 mm i marginesem bezpieczeństwa 5 mm.',
  'help.guide.studio-format.tip.1':
    'Najpierw zmień format, potem uruchom Auto layout; układ jest budowany dla rozmiaru, jaki zastanie.',
  'help.guide.studio-format.tip.2': 'Zapytaj swoją drukarnię o jej wartości spadu i strefy bezpiecznej i wpisz je.',
  // studio-export
  'help.guide.studio-export.title': 'Wyeksportować książkę jako PDF',
  'help.guide.studio-export.goal': 'Uzyskaj plik gotowy do druku albo taki do czytania na ekranie.',
  'help.guide.studio-export.step.1': 'Kliknij Export na górnym pasku.',
  'help.guide.studio-export.step.2':
    'Wybierz Pojedyncze strony, jedna kartka na arkusz w kolejności czytania, czego oczekuje drukarnia, albo Rozkładówki, dwie strony naraz, tak jak otwiera się książka. Znaczniki cięcia dodają spad na każdej krawędzi i oznaczają, gdzie ciąć.',
  'help.guide.studio-export.step.3':
    'Kliknij Podgląd wydruku. Przeglądarka otwiera strony, a Zapisz jako PDF zamienia je w plik.',
  'help.guide.studio-export.result':
    'PDF z tyloma arkuszami, ile zapowiedziało okno dialogowe, w ustawionym przez Ciebie formacie strony.',
  'help.guide.studio-export.tip.1': 'Tworzenie PDF działa tylko na komputerze, tak jak samo Studio.',
  'help.guide.studio-export.tip.2':
    'Na próbny wydruk eksportuj Rozkładówki bez znaczników cięcia; dla drukarni Pojedyncze strony z nimi.',
  // studio-spread-file
  'help.guide.studio-spread-file.title': 'Użyć rozkładówki ponownie w innej książce',
  'help.guide.studio-spread-file.goal': 'Przenieś projekt, który Ci się podoba, z książki jednego dziennika do innej.',
  'help.guide.studio-spread-file.step.1':
    'Mając rozkładówkę w obszarze roboczym, kliknij Pobierz tę rozkładówkę na prawym końcu paska powiększenia. Plik zawiera projekt, nie fotografie.',
  'help.guide.studio-spread-file.step.2':
    'W drugiej książce otwórz Pages, kliknij Importuj obok Dodaj stronę i wybierz plik.',
  'help.guide.studio-spread-file.result':
    'Rozkładówka przychodzi ze swoimi ramkami i stylami tekstu; wrzuć do ramek zdjęcia nowego dziennika.',
  'help.guide.studio-spread-file.tip.1':
    'Plik, który nie jest projektem rozkładówki, zostaje odrzucony z podaniem powodu.',

  // ── Screen: settings (all tabs) ───────────────────────────────────────────────────────
  'help.ctx.settings.title': 'Ustawienia',
  'help.ctx.settings.summary':
    'Twoje osobiste ustawienia, w pasku bocznym po lewej jedna zakładka na temat. Większość przełączników działa od razu po przestawieniu; formularz z przyciskiem Zapisz na dole czeka na niego. Nic tutaj nie zmienia TREK-a nikomu innemu.',
  'help.ctx.settings.bullet.1':
    'Pasek boczny po lewej: Wygląd, Appearance, Mapa, Powiadomienia, Integracje, Offline i Konto. Wtyczki pojawiają się, gdy jakaś jest zainstalowana, O aplikacji wszędzie tam, gdzie administrator jej nie usunął.',
  'help.ctx.settings.bullet.2':
    'Wygląd to język, jednostki, waluta i to, z czym aplikacja się otwiera; Appearance to motyw, kolory, rozmiar tekstu i widżety pulpitu.',
  'help.ctx.settings.bullet.3':
    'Mapa wybiera silnik renderujący i jego styl; Powiadomienia kanały, którymi do Ciebie docierają; Integracje biblioteki zdjęć, klucze API i MCP; Offline to, co aplikacja trzyma na tym urządzeniu.',
  'help.ctx.settings.bullet.4':
    'Konto zawiera Twój profil, hasło, uwierzytelnianie dwuskładnikowe, klucze dostępu i usunięcie Twojego konta.',
  'help.ctx.settings-display.title': 'Wygląd',
  'help.ctx.settings-display.summary':
    'Język, jednostki i waluta, jak zachowują się mapa i rezerwacje oraz z czym TREK się otwiera. Każda zmiana tutaj działa od razu.',
  'help.ctx.settings-display.bullet.1':
    'Language & region: język interfejsu, format czasu, pierwszy dzień tygodnia, waluta wyświetlania oraz jednostki odległości i temperatury.',
  'help.ctx.settings-display.bullet.2':
    'Travel & map: trasy rezerwacji zawsze na mapie, pigułka Odkrywaj miejsca, optymalizacja trasy od zakwaterowania, rozmyte kody rezerwacji i etykiety tras rezerwacji.',
  'help.ctx.settings-display.bullet.3':
    'Uruchamianie: czy TREK otwiera się na pulpicie, czy na aktywnej podróży, i która karta podróży pojawia się pierwsza.',
  'help.ctx.settings-appearance.title': 'Appearance',
  'help.ctx.settings-appearance.summary':
    'Jak TREK wygląda na tym koncie: jasny lub ciemny, kolor akcentu, szkło i ruch, rozmiar tekstu oraz które widżety pokazuje pulpit. Wszystko działa na żywo, na każdym urządzeniu, na którym się logujesz.',
  'help.ctx.settings-appearance.bullet.1':
    'Theme: Jasny, Ciemny lub Automatyczny oraz Color scheme z własnym Custom accent.',
  'help.ctx.settings-appearance.bullet.2':
    'Readability: Transparency, Reduce motion, Density i Text size, z zaawansowanymi rozmiarami dla każdego poziomu.',
  'help.ctx.settings-appearance.bullet.3':
    'Dashboard widgets: jeden przełącznik na widżet, osobno dla Desktop i Mobile.',
  'help.ctx.settings-appearance.bullet.4': 'Reset to defaults na dole przywraca wszystko.',
  'help.ctx.settings-map.title': 'Mapa',
  'help.ctx.settings-map.summary':
    'Który silnik rysuje mapy i w jakim stylu. Leaflet to klasyczna mapa rastrowa, MapLibre rysuje kafelki wektorowe bez żadnego tokenu, Mapbox dodaje budynki 3D i teren z Twoim własnym tokenem.',
  'help.ctx.settings-map.bullet.1':
    'Dostawca mapy: Leaflet, MapLibre lub Mapbox, każdy z linijką o tym, czego potrzebuje.',
  'help.ctx.settings-map.bullet.2':
    'Styl mapy i Szablon mapy: wygląd kafelków plus token lub klucz, o który prosi dostawca.',
  'help.ctx.settings-map.bullet.3':
    'Tryb wysokiej jakości dla antyaliasingu i projekcji globusa; Zapisz mapę zapisuje wybór.',
  'help.ctx.settings-notifications.title': 'Powiadomienia',
  'help.ctx.settings-notifications.summary':
    'Gdzie TREK dociera do Ciebie poza aplikacją: powiadomienia push na tym urządzeniu, temat ntfy, webhook albo kanał dostarczany przez wtyczkę. Pod kanałami jeden wiersz na zdarzenie decyduje, co idzie dokąd.',
  'help.ctx.settings-notifications.bullet.1':
    'ntfy: temat, opcjonalnie własny serwer i opcjonalny token dostępu, z Testuj, by od razu wysłać wiadomość.',
  'help.ctx.settings-notifications.bullet.2': 'Webhook: jeden URL, który odbiera każde zdarzenie jako JSON, z Testuj.',
  'help.ctx.settings-notifications.bullet.3':
    'Powiadomienia push na tym urządzeniu: Włącz na tym urządzeniu dotyczy tylko przeglądarki, której używasz, więc powtórz to na każdym telefonie lub komputerze. Wyślij test trafia do nich wszystkich.',
  'help.ctx.settings-notifications.bullet.4':
    'Wiersze preferencji: dla każdego zdarzenia, który kanał jest włączony. Kanały wtyczek pokazują Skonfiguruj, dopóki nie są ustawione.',
  'help.ctx.settings-integrations.title': 'Integracje',
  'help.ctx.settings-integrations.summary':
    'Wszystko, co łączy się z TREK-iem z zewnątrz: biblioteki zdjęć dla dziennika, klucze API dla skryptów oraz endpoint MCP z jego tokenami i klientami OAuth dla asystentów AI.',
  'help.ctx.settings-integrations.bullet.1':
    'Dostawcy zdjęć: Immich i Synology Photos, każdy ze swoim URL i kluczem, Test i Zapisz.',
  'help.ctx.settings-integrations.bullet.2':
    'Klucze API: osobiste klucze dla skryptów i innych narzędzi, które wywołują API TREK-a w Twoim imieniu.',
  'help.ctx.settings-integrations.bullet.3':
    'Konfiguracja MCP: endpoint, gotowa konfiguracja klienta do skopiowania i tokeny API.',
  'help.ctx.settings-integrations.bullet.4':
    'Klienci OAuth 2.1: aplikacje logujące się przez TREK, z URI przekierowania, dozwolonymi uprawnieniami, klientami maszynowymi i aktywnymi sesjami.',
  'help.ctx.settings-offline.title': 'Offline',
  'help.ctx.settings-offline.summary':
    'Co TREK trzyma na tym urządzeniu, żeby podróż otwierała się także bez połączenia, i co się dzieje, gdy zmiana zrobiona offline zderza się ze zmianą zrobioną gdzie indziej.',
  'help.ctx.settings-offline.bullet.1':
    'Tryb offline: Wymuś tryb offline sprawia, że aplikacja zachowuje się, jakby sieci nie było, do testów albo przy połączeniu taryfowym.',
  'help.ctx.settings-offline.bullet.2':
    'Przygotuj do trybu offline: Pobierz do użytku offline pobiera teraz Twoje podróże i ich kafelki mapy.',
  'help.ctx.settings-offline.bullet.3':
    'Co przechowywać offline: kafelki mapy włączone lub wyłączone oraz przełącznik na każdą podróż.',
  'help.ctx.settings-offline.bullet.4':
    'Konflikty synchronizacji i Pamięć podręczna offline: strategia przy kolizjach, liczby oczekujących i nieudanych zmian, Synchronizuj ponownie i Wyczyść pamięć podręczną.',
  'help.ctx.settings-account.title': 'Konto',
  'help.ctx.settings-account.summary':
    'Kim jesteś w tym TREK-u i jak się logujesz: profil i awatar, hasło, uwierzytelnianie dwuskładnikowe, klucze dostępu, a na samym dole usunięcie konta.',
  'help.ctx.settings-account.bullet.1':
    'Profil: nazwa użytkownika, e-mail i awatar, zapisywane przyciskiem Zapisz profil.',
  'help.ctx.settings-account.bullet.2': 'Zmień hasło: obecne hasło, nowe hasło dwa razy, Zaktualizuj hasło.',
  'help.ctx.settings-account.bullet.3':
    'Uwierzytelnianie dwuskładnikowe (2FA) z aplikacją uwierzytelniającą i kodami zapasowymi; Klucze dostępu do logowania bez hasła.',
  'help.ctx.settings-account.bullet.4':
    'Usuń konto na dole, za potwierdzeniem. Ostatni administrator nie może usunąć samego siebie.',
  // language-region
  'help.guide.language-region.title': 'Ustawić język, jednostki i walutę',
  'help.guide.language-region.goal': 'Spraw, by TREK mówił Twoim językiem i liczył tak jak Ty.',
  'help.guide.language-region.step.1':
    'Wybierz język interfejsu w Language & region. TREK przełącza się od razu, na każdym urządzeniu, na którym się logujesz.',
  'help.guide.language-region.step.2':
    'Poniżej wybierz format czasu, dzień, od którego zaczyna się tydzień we wszystkich wyborach daty, walutę wyświetlania oraz jednostki odległości i temperatury.',
  'help.guide.language-region.result':
    'Daty, odległości i pieniądze czyta się tak, jak oczekujesz; własna waluta podróży nadal pokazuje się obok przeliczonych kwot.',
  'help.guide.language-region.tip.1':
    'Waluta wyświetlania służy do sum między podróżami; każda podróż zachowuje walutę, którą jej nadałeś.',
  'help.guide.language-region.tip.2': 'Język ustawia też nazwy dni i miesięcy w Vacay i w dzienniku.',
  // travel-map-prefs
  'help.guide.travel-map-prefs.title': 'Dostroić zachowanie mapy i rezerwacji',
  'help.guide.travel-map-prefs.goal': 'Zdecyduj, co mapa podróży pokazuje domyślnie.',
  'help.guide.travel-map-prefs.step.1':
    'W Travel & map, Zawsze pokazuj trasy rezerwacji trzyma loty i pociągi na mapie, nawet gdy ich dzień nie jest otwarty; Odkrywaj miejsca na mapie pokazuje pigułkę do szukania miejsc; Optymalizuj trasę od zakwaterowania zaczyna trasę tam, gdzie śpisz.',
  'help.guide.travel-map-prefs.step.2':
    'Rozmyj kody rezerwacji ukrywa numery potwierdzeń, dopóki nie najedziesz kursorem; Etykiety tras rezerwacji wypisuje nazwę rezerwacji wzdłuż jej trasy.',
  'help.guide.travel-map-prefs.result':
    'Mapa podróży stosuje się do tego w każdej podróży, dopóki nie przestawisz ich z powrotem.',
  'help.guide.travel-map-prefs.tip.1':
    'To ustawienia konta, nie podróży. Członkowie wspólnej podróży widzą każdy swoje własne wybory.',
  // startup
  'help.guide.startup.title': 'Wybrać, z czym TREK się otwiera',
  'help.guide.startup.goal': 'Ląduj tam, gdzie pracujesz najwięcej, a nie za każdym razem na pulpicie.',
  'help.guide.startup.step.1': 'W Uruchamianie ustaw Strona startowa na Panel lub Aktywna podróż.',
  'help.guide.startup.step.2': 'Karta startowa wybiera, która karta podróży pojawia się pierwsza, gdy jakąś otwierasz.',
  'help.guide.startup.result': 'Następne logowanie i następne stuknięcie w logo prowadzą prosto tam.',
  'help.guide.startup.tip.1': 'Aktywna podróż oznacza podróż trwającą dziś albo następną, gdy żadna nie trwa.',
  // theme-scheme
  'help.guide.theme-scheme.title': 'Ustawić motyw i kolor akcentu',
  'help.guide.theme-scheme.goal':
    'Zrób TREK-a jasnym, ciemnym albo podążającym za Twoim urządzeniem, w kolorze, który lubisz.',
  'help.guide.theme-scheme.step.1':
    'W Theme wybierz Jasny, Ciemny lub Automatyczny. Automatyczny podąża za Twoim urządzeniem.',
  'help.guide.theme-scheme.step.2':
    'Wybierz Color scheme: Default, High contrast, Indigo, Teal, Rose, Amber, Violet lub Custom.',
  'help.guide.theme-scheme.step.3':
    'Przy Custom wybierz akcent z gotowych albo wpisz własny. Kontrola kontrastu obok mówi, czy tekst pozostanie na nim czytelny.',
  'help.guide.theme-scheme.result':
    'Przyciski, linki i wyróżnienia przyjmują akcent wszędzie, na każdym urządzeniu, na którym się logujesz.',
  'help.guide.theme-scheme.tip.1': 'Pasek nawigacji ma też szybki przełącznik jasny lub ciemny; ustawia ten sam motyw.',
  'help.guide.theme-scheme.tip.2': 'High contrast to schemat do wyboru, gdy domyślny czyta się zbyt miękko.',
  // readability
  'help.guide.readability.title': 'Dostosować czytelność i rozmiar tekstu',
  'help.guide.readability.goal': 'Mniej szkła, mniej ruchu, więcej miejsca albo większa czcionka.',
  'help.guide.readability.step.1':
    'W Readability, Transparency przełącza szklane panele na jednolite powierzchnie, Reduce motion ogranicza animacje do minimum, a Density wybiera Comfortable lub Compact.',
  'help.guide.readability.step.2':
    'Text size skaluje Everything naraz; Advanced text sizes pozwala, by tytuły, podtytuły, tekst i podpisy się różniły.',
  'help.guide.readability.result': 'Cała aplikacja dostosowuje się od razu, łącznie z panelami mapy i dziennikiem.',
  'help.guide.readability.tip.1':
    'Reduce motion podąża też za ustawieniem Twojego systemu, gdy zostawisz je w spokoju.',
  'help.guide.readability.tip.2':
    'Rozmiar tekstu działa przez poziomy typografii, więc nic nie jest ucinane; rozmiar, który już się nie mieści, jest zawijany.',
  // dashboard-widgets
  'help.guide.dashboard-widgets.title': 'Wybrać widżety pulpitu',
  'help.guide.dashboard-widgets.goal': 'Pokazuj tylko widżety, których używasz, osobno na komputerze i na telefonie.',
  'help.guide.dashboard-widgets.step.1':
    'W Dashboard widgets włącz lub wyłącz każdy widżet dla Desktop i dla Mobile: prawy pasek boczny jako całość, walutę, kolekcje, strefy czasowe, nadchodzące rezerwacje, kraje Atlasu i liczby podróżnicze.',
  'help.guide.dashboard-widgets.step.2': 'Reset to defaults na dole przywraca całą zakładkę do stanu początkowego.',
  'help.guide.dashboard-widgets.result':
    'Pulpit układa się na nowo od razu; z wyłączonym prawym paskiem bocznym się centruje.',
  'help.guide.dashboard-widgets.tip.1':
    'Widżety dodatku pojawiają się tylko wtedy, gdy administrator ma ten dodatek włączony.',
  'help.guide.dashboard-widgets.tip.2':
    'Sam pulpit pamięta Twój widok siatki lub listy i kolejność sortowania na każdym urządzeniu.',
  // map-provider
  'help.guide.map-provider.title': 'Wybrać silnik i styl mapy',
  'help.guide.map-provider.goal': 'Przełączaj między klasyczną mapą, kafelkami wektorowymi i mapą 3D Mapboxa.',
  'help.guide.map-provider.step.1':
    'W Dostawca mapy wybierz Leaflet dla klasycznej mapy 2D z dowolnymi kafelkami rastrowymi, MapLibre dla kafelków wektorowych OpenFreeMap bez tokenu albo Mapbox dla kafelków wektorowych z budynkami 3D i terenem.',
  'help.guide.map-provider.step.2':
    'Wybierz Styl mapy lub Szablon mapy dla wyglądu. Mapbox potrzebuje Token dostępu Mapbox, niektóre style rastrowe Klucz API CARTO; link obok pola prowadzi tam, gdzie go dostaniesz.',
  'help.guide.map-provider.step.3':
    'Tryb wysokiej jakości dodaje antyaliasing i projekcję globusa. Kliknij Zapisz mapę.',
  'help.guide.map-provider.result':
    'Każda mapa w TREK-u, podróże, Atlas, Kolekcje i dziennik, jest rysowana przez wybrany przez Ciebie silnik.',
  'help.guide.map-provider.tip.1': 'Bez tokenu Mapbox wraca do domyślnej mapy, zamiast nie pokazywać nic.',
  'help.guide.map-provider.tip.2':
    'Kafelki mapy, które przechowujesz offline, pochodzą od dostawcy aktywnego w chwili pobierania.',
  // notification-channels
  'help.guide.notification-channels.title': 'Ustawić, gdzie docierają powiadomienia',
  'help.guide.notification-channels.goal':
    'Dostawaj przypomnienia o podróżach i zdarzenia współpracy na telefon albo do innego narzędzia.',
  'help.guide.notification-channels.step.1':
    'W Powiadomienia wpisz Temat Ntfy; dodaj własny URL serwera Ntfy i Token dostępu, jeśli taki prowadzisz. Testuj wysyła wiadomość od razu.',
  'help.guide.notification-channels.step.2':
    'Albo podaj URL webhooka, który odbiera każde zdarzenie jako JSON, i tak samo Testuj.',
  'help.guide.notification-channels.step.3':
    'W wierszach poniżej włącz lub wyłącz każde zdarzenie dla każdego kanału. Kanał wtyczki mówi Skonfiguruj, dopóki nie zostanie ustawiony w ustawieniach wtyczki; Wyślij test próbuje jednego.',
  'help.guide.notification-channels.result':
    'Zdarzenia wychodzą włączonymi kanałami. Dzwonek w pasku nawigacji i tak dalej pokazuje je w aplikacji.',
  'help.guide.notification-channels.tip.1':
    'Preferencje dla pojedynczej podróży są w samej podróży, w jej ustawieniach powiadomień.',
  'help.guide.notification-channels.tip.2':
    'Administrator może wstępnie wypełnić domyślny serwer ntfy dla wszystkich; temat wybierasz nadal sam.',
  // photo-providers
  'help.guide.photo-providers.title': 'Podłączyć bibliotekę zdjęć',
  'help.guide.photo-providers.goal': 'Pozwól dziennikowi pobierać zdjęcia z danego dnia z Immich lub Synology Photos.',
  'help.guide.photo-providers.step.1':
    'W Integracje znajdź sekcję dostawcy i wpisz jego URL i klucz API. Immich oferuje też odbijanie przesłanych zdjęć z dziennika z powrotem do biblioteki.',
  'help.guide.photo-providers.step.2': 'Kliknij Test, potem Zapisz.',
  'help.guide.photo-providers.result':
    'Karta External photos w edytorze wpisu przeszukuje podłączoną bibliotekę pod kątem dnia wpisu, najpierw najbliżej lokalizacji wpisu.',
  'help.guide.photo-providers.tip.1': 'Połączenie jest Twoje: inni członkowie dziennika podłączają własne biblioteki.',
  'help.guide.photo-providers.tip.2':
    'Dostawca bez danych GPS w zdjęciach też działa; lista jest wtedy w kolejności czasowej.',
  // api-keys
  'help.guide.api-keys.title': 'Utworzyć klucz API',
  'help.guide.api-keys.goal': 'Pozwól skryptowi lub innemu narzędziu wywoływać API TREK-a jako Ty.',
  'help.guide.api-keys.step.1': 'W Klucze API kliknij Utwórz klucz i nadaj mu nazwę mówiącą, gdzie będzie używany.',
  'help.guide.api-keys.step.2':
    'Skopiuj klucz z okna dialogowego: jest pokazywany raz. Usuń klucz z listy, gdy narzędzie już go nie potrzebuje.',
  'help.guide.api-keys.result':
    'Żądania z tym kluczem działają z Twoimi uprawnieniami; lista pokazuje, kiedy każdy klucz został utworzony i ostatnio użyty.',
  'help.guide.api-keys.tip.1': 'Jeden klucz na narzędzie sprawia, że odwołanie jest bezbolesne.',
  'help.guide.api-keys.tip.2':
    'Dla asystenta AI użyj zamiast tego MCP z OAuth; klucze API są dla zwykłych klientów HTTP.',
  // mcp-oauth
  'help.guide.mcp-oauth.title': 'Podłączyć asystenta AI przez MCP',
  'help.guide.mcp-oauth.goal': 'Daj Claude, IDE lub innemu klientowi MCP dostęp do swoich podróży.',
  'help.guide.mcp-oauth.step.1':
    'W Konfiguracja MCP skopiuj Endpoint MCP albo całą Konfiguracja klienta dla klienta, który przyjmuje fragment JSON.',
  'help.guide.mcp-oauth.step.2':
    'Klienci logujący się przez przeglądarkę używają OAuth 2.1: Nowy klient w Klienci OAuth 2.1, z jego URI przekierowania, Dozwolone uprawnienia oraz, dla serwera bez przeglądarki, Klient maszynowy.',
  'help.guide.mcp-oauth.step.3':
    'Odnów sekret i Usuń klienta są przy każdym kliencie; Aktywne sesje OAuth wypisuje, co jest zalogowane, i pozwala to odwołać. Tokeny API z Utwórz nowy token to starsza droga wejścia.',
  'help.guide.mcp-oauth.result':
    'Klient może czytać i zmieniać to, na co pozwalają jego uprawnienia, jako Ty, a każde działanie pojawia się pod Twoim nazwiskiem.',
  'help.guide.mcp-oauth.tip.1':
    'Uprawnienia to siatka bezpieczeństwa: daj klientowi tylko uprawnienie do odczytu, dopóki nie potrzebuje więcej.',
  'help.guide.mcp-oauth.tip.2': 'Administrator może wyłączyć MCP dla całej instancji; wtedy tej sekcji nie ma.',
  // offline-prepare
  'help.guide.offline-prepare.title': 'Zabrać podróże offline',
  'help.guide.offline-prepare.goal': 'Miej swoje podróże i ich mapy na tym urządzeniu, zanim połączenie zniknie.',
  'help.guide.offline-prepare.step.1':
    'W Co przechowywać offline zostaw Przechowuj kafelki mapy offline włączone i włącz podróże, które chcesz mieć na tym urządzeniu.',
  'help.guide.offline-prepare.step.2':
    'Kliknij Pobierz do użytku offline w Przygotuj do trybu offline. Pobiera to podróże i kafelki wokół ich miejsc.',
  'help.guide.offline-prepare.step.3':
    'Wymuś tryb offline w Tryb offline pozwala sprawdzić, czy wszystko jest na miejscu, zanim wyruszysz.',
  'help.guide.offline-prepare.result':
    'Podróże otwierają się bez połączenia; zmiany, które robisz, czekają w kolejce i wychodzą po ponownym połączeniu.',
  'help.guide.offline-prepare.tip.1':
    'Kafelki zajmują najwięcej miejsca: sekcja Pamięć podręczna offline pokazuje, co jest zapisane, dla każdej podróży.',
  'help.guide.offline-prepare.tip.2':
    'Zainstaluj TREK jako aplikację z przeglądarki, by start offline był najpłynniejszy.',
  // offline-conflicts
  'help.guide.offline-conflicts.title': 'Zdecydować, co wygrywa przy konflikcie synchronizacji',
  'help.guide.offline-conflicts.goal':
    'Wybierz, jak TREK rozstrzyga zmianę zrobioną offline wobec zmiany zrobionej gdzie indziej.',
  'help.guide.offline-conflicts.step.1':
    'W Konflikty synchronizacji wybierz Pytaj mnie za każdym razem, Zawsze zachowuj moją wersję lub Zawsze zachowuj wersję serwera.',
  'help.guide.offline-conflicts.step.2':
    'Pamięć podręczna offline pokazuje podróże, oczekujące i nieudane zmiany oraz konflikty; Synchronizuj ponownie wypycha kolejkę, Wyczyść pamięć podręczną opróżnia urządzenie.',
  'help.guide.offline-conflicts.result':
    'Przy pytaniu konflikt pokazuje obie wersje i pozwala wybrać; przy pozostałych dwóch jest rozstrzygany po cichu.',
  'help.guide.offline-conflicts.tip.1':
    'Wyczyść pamięć podręczną usuwa tylko kopię na tym urządzeniu; nic na serwerze nie jest ruszane.',
  // profile
  'help.guide.profile.title': 'Zmienić swój profil',
  'help.guide.profile.goal': 'Zaktualizuj swoją nazwę, e-mail i zdjęcie.',
  'help.guide.profile.step.1':
    'W Konto edytuj Nazwa użytkownika i E-mail. Awatar przyjmuje własny przesłany plik; usuń go, by wrócić do inicjałów.',
  'help.guide.profile.step.2': 'Kliknij Zapisz profil.',
  'help.guide.profile.result':
    'Twoja nazwa i zdjęcie aktualizują się wszędzie naraz, także w podróżach, które udostępniasz.',
  'help.guide.profile.tip.1': 'Konto logujące się przez OIDC pokazuje to tutaj; e-mail pochodzi wtedy od dostawcy.',
  // password
  'help.guide.password.title': 'Zmienić hasło',
  'help.guide.password.goal': 'Ustaw nowe hasło.',
  'help.guide.password.step.1': 'W Zmień hasło wpisz obecne hasło, potem dwa razy nowe.',
  'help.guide.password.step.2': 'Kliknij Zaktualizuj hasło.',
  'help.guide.password.result': 'Nowe hasło działa przy następnym logowaniu; inne sesje pozostają zalogowane.',
  'help.guide.password.tip.1': 'Konto logujące się przez OIDC nie ma hasła TREK-a do zmiany.',
  // mfa
  'help.guide.mfa.title': 'Włączyć uwierzytelnianie dwuskładnikowe',
  'help.guide.mfa.goal': 'Chroń konto kodem z aplikacji uwierzytelniającej.',
  'help.guide.mfa.step.1': 'W Uwierzytelnianie dwuskładnikowe (2FA) kliknij Skonfiguruj aplikację uwierzytelniającą.',
  'help.guide.mfa.step.2':
    'Zeskanuj kod QR swoją aplikacją albo wpisz sekret ręcznie, potem wpisz sześciocyfrowy kod, który pokazuje, i kliknij Włącz 2FA.',
  'help.guide.mfa.step.3':
    'Zapisz kody zapasowe: skopiuj je, pobierz lub wydrukuj. Każdy działa raz, gdy nie masz telefonu pod ręką.',
  'help.guide.mfa.result': 'Każde logowanie prosi o kod po haśle.',
  'help.guide.mfa.tip.1': 'Wyłącz 2FA wymaga Twojego hasła i aktualnego kodu.',
  'help.guide.mfa.tip.2': 'Administrator może wymagać 2FA od wszystkich; wtedy nie da się go tutaj wyłączyć.',
  // passkeys
  'help.guide.passkeys.title': 'Logować się kluczem dostępu',
  'help.guide.passkeys.goal': 'Używaj odcisku palca, twarzy lub PIN-u swojego urządzenia zamiast hasła.',
  'help.guide.passkeys.step.1':
    'W Klucze dostępu kliknij Dodaj klucz dostępu i potwierdź na swoim urządzeniu. Nadaj mu nazwę mówiącą, które to urządzenie.',
  'help.guide.passkeys.step.2':
    'Lista pokazuje każdy klucz dostępu z nazwą i datą ostatniego użycia; przycisk usuwania usuwa jeden.',
  'help.guide.passkeys.result': 'Strona logowania oferuje klucz dostępu; hasło zostaje jako rezerwa.',
  'help.guide.passkeys.tip.1':
    'Klucz dostępu żyje na urządzeniu albo w jego menedżerze haseł, więc dodaj po jednym na urządzenie.',
  'help.guide.passkeys.tip.2':
    'Klucze dostępu wymagają HTTPS; na instancji ze zwykłym HTTP sekcja wyjaśnia, czemu są niedostępne.',
  // delete-account
  'help.guide.delete-account.title': 'Usunąć swoje konto',
  'help.guide.delete-account.goal': 'Usuń swoje konto i dane, które są tylko Twoje.',
  'help.guide.delete-account.step.1': 'Na samym dole Konto kliknij Usuń konto i potwierdź.',
  'help.guide.delete-account.result':
    'Twoje konto, Twoje własne podróże i Twoje dzienniki znikają; podróże, które dzielisz z innymi, zostają u nich.',
  'help.guide.delete-account.tip.1':
    'Ostatni administrator instancji nie może usunąć samego siebie; najpierw zrób administratorem kogoś innego.',
  'help.guide.delete-account.tip.2': 'Nie ma cofnięcia. Wyeksportuj to, co chcesz zachować, zanim potwierdzisz.',

  // ── Screen: admin (all tabs) ──────────────────────────────────────────────────────────
  'help.ctx.admin.title': 'Administracja',
  'help.ctx.admin.summary':
    'Instancja stojąca za TREK-iem wszystkich: kto może się logować i jak, co jest włączone, gdzie leżą pliki, jak serwer dociera do ludzi i jak jest zabezpieczany kopią zapasową. Tę stronę widzą tylko administratorzy; każda zakładka to osobny ekran w pasku bocznym.',
  'help.ctx.admin.bullet.1':
    'Cztery karty u góry liczą użytkowników, podróże, miejsca i pliki; baner nad nimi ogłasza nowsze wydanie TREK-a.',
  'help.ctx.admin.bullet.2':
    'Użytkownicy i Domyślne ustawienia: konta, linki zaproszeń i ustawienia mapy, z którymi startuje nowe konto.',
  'help.ctx.admin.bullet.3':
    'Personalizacja, Ustawienia, Dodatki i Wtyczki: szablony pakowania, kategorie i ferie szkolne; metody logowania i klucze API; moduły funkcji; wtyczki firm trzecich.',
  'help.ctx.admin.bullet.4':
    'Magazyn, Powiadomienia, Dostęp MCP i GitHub: dokąd trafiają przesłane pliki, kanały dla całej instancji, tokeny i sesje klientów AI oraz historia wydań.',
  'help.ctx.admin.bullet.5':
    'Backupy i Audit: kopie zapasowe na żądanie i według harmonogramu oraz dziennik zdarzeń istotnych dla bezpieczeństwa.',
  'help.ctx.admin-users.title': 'Użytkownicy',
  'help.ctx.admin-users.summary':
    'Każde konto na tym TREK-u, z rolą, e-mailem i ostatnim logowaniem, oraz linki zaproszeń, które pozwalają ludziom rejestrować się na zamkniętej instancji.',
  'help.ctx.admin-users.bullet.1':
    'Tabela: nazwa użytkownika, e-mail, rola, data utworzenia, ostatnie logowanie i akcje w każdym wierszu. Ty jesteś oznaczony jako Ty.',
  'help.ctx.admin-users.bullet.2': 'Utwórz użytkownika u góry dodaje konto ręcznie, z hasłem, które przekazujesz.',
  'help.ctx.admin-users.bullet.3':
    'Linki zaproszeń poniżej: jednorazowe linki rejestracyjne z limitem użyć, terminem ważności i, jeśli chcesz, podróżą, do której nowy użytkownik dołącza od razu.',
  'help.ctx.admin-users.bullet.4':
    'Ustawienia uprawnień na dole: dla każdej akcji, kto może ją wykonać, Wszyscy, Członkowie podróży, Właściciel podróży albo Tylko admin.',
  'help.ctx.admin-defaults.title': 'Domyślne ustawienia',
  'help.ctx.admin-defaults.summary':
    'Ustawienia, z którymi startuje nowe konto, żeby nikt nie musiał najpierw szukać zakładki mapy: dostawca mapy, styl, tokeny i jakość.',
  'help.ctx.admin-defaults.bullet.1':
    'Dostawca mapy, styl i token Mapbox, klucz CARTO i jakość Mapbox, dokładnie tak, jak ustawiłby je użytkownik w Ustawienia, Mapa.',
  'help.ctx.admin-defaults.bullet.2':
    'Przywrócenie wbudowanej wartości domyślnej przy każdym polu wraca do własnego wyboru TREK-a; własne ustawienie użytkownika zawsze wygrywa z tymi.',
  'help.ctx.admin-config.title': 'Personalizacja',
  'help.ctx.admin-config.summary':
    'To, co dzielą wszystkie podróże na instancji: szablony pakowania, zestaw kategorii dla miejsc i kolekcji oraz katalog ferii szkolnych, z którego korzysta Vacay.',
  'help.ctx.admin-config.bullet.1':
    'Szablony pakowania: nazwane listy kategorii i pozycji, od których może zacząć lista pakowania podróży.',
  'help.ctx.admin-config.bullet.2':
    'Kategorie: nazwa, ikona i kolor kategorii używanych w całym TREK-u, od inspektora miejsc po Kolekcje.',
  'help.ctx.admin-config.bullet.3':
    'Ferie szkolne: katalog krajów i regionów dla miejsc, których nie obejmują wbudowane źródła.',
  'help.ctx.admin-settings.title': 'Ustawienia',
  'help.ctx.admin-settings.summary':
    'Jak ludzie wchodzą i z czym serwer może rozmawiać: metody logowania i rejestracji, SSO, klucze dostępu, polityka dwuskładnikowa, klucze API do map, miejsc i obrazów, dostawcy wyszukiwania i transportu oraz typy plików, jakie mogą mieć przesyłane pliki.',
  'help.ctx.admin-settings.bullet.1':
    'Authentication Methods: Password Login, Password Registration, SSO Login, SSO Auto-Provisioning oraz Wymagaj uwierzytelniania dwuskładnikowego (2FA).',
  'help.ctx.admin-settings.bullet.2':
    'Logowanie jednokrotne (OIDC) z wystawcą, klientem i wyświetlaną nazwą; Logowanie kluczem dostępu z Relying Party ID (domena) i Dozwolone origins.',
  'help.ctx.admin-settings.bullet.3':
    'Klucze API: Google Maps, Unsplash i Amap, każdy z Testuj; Do czego służy klucz zawęża klucz Google do funkcji, za które chcesz płacić.',
  'help.ctx.admin-settings.bullet.4':
    'Dostawca wyszukiwania miejsc i Dostawca transportu publicznego wybierają, kto odpowiada na wyszukiwania i trasy; Dozwolone typy plików ograniczają przesyłanie.',
  'help.ctx.admin-addons.title': 'Dodatki',
  'help.ctx.admin-addons.summary':
    'Moduły funkcji TREK-a, każdy z przełącznikiem: Listy, Koszty, Dokumenty, Vacay, Atlas, Współpraca, Dziennik podróży, Kolekcje, Podróż samochodowa, MCP, AirTrail, Dawarich i parsowanie AI. Wyłączony oznacza, że wpis w nawigacji, trasy i API znikają dla wszystkich.',
  'help.ctx.admin-addons.bullet.1':
    'Jeden kafelek na dodatek z jego przełącznikiem i, jeśli jakieś ma, podwierszami z jego opcjami.',
  'help.ctx.admin-addons.bullet.2':
    'Dostawcy zdjęć i dostawcy dokumentów też pojawiają się tu jako kafelki, więc użytkownikom można zaoferować Immich lub Synology.',
  'help.ctx.admin-addons.bullet.3': 'Kontrola bagażu ma własny przełącznik pod kafelkami.',
  'help.ctx.admin-plugins.title': 'Wtyczki',
  'help.ctx.admin-plugins.summary':
    'Wtyczki firm trzecich, które działają we własnym procesie obok TREK-a, każda z uprawnieniami, o które poprosiła przy instalacji. Instaluj z katalogu, prześlij pakiet albo podłącz folder podczas tworzenia wtyczki.',
  'help.ctx.admin-plugins.bullet.1':
    'Lista: każda zainstalowana wtyczka z wersją, stanem, podpisem i uprawnieniami, które posiada; w każdym wierszu aktywuj, dezaktywuj, aktualizuj lub odinstaluj.',
  'help.ctx.admin-plugins.bullet.2':
    'Prześlij wtyczkę przyjmuje plik pakietu; Skanuj ponownie wykrywa folder wtyczki podłączony do rozwoju.',
  'help.ctx.admin-plugins.bullet.3':
    'Dozwolone hosty dla każdej wtyczki: adresy, które wtyczka może wywoływać, bo ruch wychodzący jest domyślnie zablokowany.',
  'help.ctx.admin-storage.title': 'Magazyn',
  'help.ctx.admin-storage.summary':
    'Gdzie leżą przesłane pliki: lokalny dysk, bucket S3 albo mirror zapisujący w obu. Każda kategoria przesyłania może trafiać do innego backendu, a Stan mówi, czy każdy backend odpowiada.',
  'help.ctx.admin-storage.bullet.1':
    'Backendy: nazwa i typ każdego, z Testuj, Edytuj i Usuń; ten ustawiony przez środowisko jest tu tylko do odczytu.',
  'help.ctx.admin-storage.bullet.2':
    'Kategorie: okładki, dokumenty, zdjęcia z dziennika i reszta, każda przypisana do backendu; zmiana jednej proponuje przeniesienie istniejących plików.',
  'help.ctx.admin-storage.bullet.3':
    'Stan: sprawdzenie każdego backendu oraz plik kontrolny, który dowodzi, że konfiguracja jest tym, co widzi serwer.',
  'help.ctx.admin-notifications.title': 'Powiadomienia',
  'help.ctx.admin-notifications.summary':
    'Kanały, które instancja oferuje swoim użytkownikom, i te, które docierają do Ciebie jako administratora. Użytkownicy wybierają własne tematy i URL-e w Ustawienia; Ty decydujesz, co istnieje, i konfigurujesz e-mail.',
  'help.ctx.admin-notifications.bullet.1':
    'In-App, Email (SMTP), Ntfy, Webhook i Web Push: po jednym panelu, z przełącznikiem, który oferuje kanał użytkownikom, i konfiguracją po stronie serwera, której potrzebuje.',
  'help.ctx.admin-notifications.bullet.2':
    'Przypomnienia o podróżach: czy serwer wysyła przypomnienie przed rozpoczęciem podróży.',
  'help.ctx.admin-notifications.bullet.3':
    'Admin Ntfy i Webhook admina: dokąd trafiają zdarzenia administracyjne, takie jak nieudany backup czy nowe wydanie, z testem.',
  'help.ctx.admin-mcp-tokens.title': 'Dostęp MCP',
  'help.ctx.admin-mcp-tokens.summary':
    'Każdy token i każda sesja OAuth, jakie klienci AI trzymają wobec tego TREK-a, u wszystkich użytkowników, z możliwością cofnięcia dowolnej z nich.',
  'help.ctx.admin-mcp-tokens.bullet.1': 'Tokeny API: kto go utworzył, kiedy był ostatnio użyty, oraz Usuń.',
  'help.ctx.admin-mcp-tokens.bullet.2': 'Sesje OAuth: klient, użytkownik i przyznane uprawnienia, oraz Cofnij.',
  'help.ctx.admin-github.title': 'GitHub',
  'help.ctx.admin-github.summary':
    'Co nowego w TREK-u: historia wydań z GitHuba, wersja, którą uruchamiasz, i czy wyszła nowsza. Sama aktualizacja odbywa się poza aplikacją, na hoście.',
  'help.ctx.admin-github.bullet.1':
    'Historia wydań wypisuje wydania z ich notatkami; najnowsze nosi Najnowsze, a Twoja wersja jest oznaczona.',
  'help.ctx.admin-github.bullet.2':
    'Dostępna aktualizacja pojawia się w nagłówku, gdy tylko istnieje nowsze wydanie, z instrukcją aktualizacji dla Dockera i innych instalacji.',
  'help.ctx.admin-backup.title': 'Backupy',
  'help.ctx.admin-backup.summary':
    'Pełne kopie zapasowe bazy danych i przesłanych plików, robione ręcznie lub według harmonogramu, trzymane na serwerze i do pobrania jako jeden plik. Przywróć wgrywa jedną z nich z powrotem.',
  'help.ctx.admin-backup.bullet.1':
    'Kopia zapasowa danych: Utwórz kopię zapasową oraz lista istniejących z Pobierz, Przywróć i usuwaniem.',
  'help.ctx.admin-backup.bullet.2':
    'Prześlij kopię zapasową wnosi plik zrobiony na innej instancji albo wcześniejszego dnia.',
  'help.ctx.admin-backup.bullet.3':
    'Automatyczna kopia zapasowa: włączona lub wyłączona, częstotliwość, godzina i dzień oraz ile kopii zachować.',
  'help.ctx.admin-audit.title': 'Audit',
  'help.ctx.admin-audit.summary':
    'Dziennik zdarzeń istotnych dla bezpieczeństwa i administracyjnych: logowania i nieudane próby, zmiany MFA, zmiany użytkowników i ustawień, backupy i przywracania. Tylko do odczytu, najnowsze pierwsze.',
  'help.ctx.admin-audit.bullet.1':
    'Jeden wiersz na zdarzenie z czasem, użytkownikiem, akcją, zasobem, IP i szczegółami.',
  'help.ctx.admin-audit.bullet.2': 'Odśwież ładuje ponownie; Załaduj więcej cofa się dalej w przeszłość.',
  // create-user
  'help.guide.create-user.title': 'Utwórz użytkownika',
  'help.guide.create-user.goal': 'Dodaj konto ręcznie, bez zaproszenia.',
  'help.guide.create-user.step.1': 'Kliknij Utwórz użytkownika u góry zakładki Użytkownicy.',
  'help.guide.create-user.step.2':
    'Wpisz Nazwa użytkownika, E-mail i Hasło i wybierz Rola: Użytkownik lub Administrator.',
  'help.guide.create-user.step.3': 'Kliknij Utwórz użytkownika.',
  'help.guide.create-user.result':
    'Konto pojawia się w tabeli i może się od razu zalogować; przekaż hasło kanałem, któremu ufasz.',
  'help.guide.create-user.tip.1': 'Dla osoby, która ma sama wybrać hasło, lepszą drogą jest link zaproszenia.',
  'help.guide.create-user.tip.2':
    'Administratorzy widzą tę stronę i dziennik audytu; wszystko inne jest takie samo dla obu ról.',
  // edit-user
  'help.guide.edit-user.title': 'Zmień rolę lub hasło użytkownika',
  'help.guide.edit-user.goal': 'Awansuj kogoś, zdegraduj albo wpuść z powrotem po utraconym haśle.',
  'help.guide.edit-user.step.1': 'Kliknij ołówek w wierszu użytkownika. Otwiera się Edytuj użytkownika z danymi konta.',
  'help.guide.edit-user.step.2':
    'Zmień Rola, ustaw Nowe hasło albo kliknij Zresetuj klucze dostępu, gdy osoba straciła urządzenie, na którym były jej klucze, potem Zapisz.',
  'help.guide.edit-user.result': 'Zmiana działa od następnego żądania; nowe hasło działa od następnego logowania.',
  'help.guide.edit-user.tip.1': 'Nie możesz odebrać sobie roli administratora, dopóki jesteś ostatnim administratorem.',
  'help.guide.edit-user.tip.2':
    'Resetowanie kluczy dostępu zachowuje hasło; osoba dodaje nowe klucze w Ustawienia, Konto.',
  // invite-links
  'help.guide.invite-links.title': 'Zaproś kogoś linkiem',
  'help.guide.invite-links.goal':
    'Pozwól osobie zarejestrować się na zamkniętej instancji i, jeśli chcesz, od razu trafić do podróży.',
  'help.guide.invite-links.step.1': 'W Linki zaproszeń kliknij Utwórz link.',
  'help.guide.invite-links.step.2':
    'Ustaw Maksymalna liczba użyć i Wygasa po, opcjonalnie Dodaj do podróży (opcjonalnie), i kliknij Utwórz i skopiuj.',
  'help.guide.invite-links.step.3':
    'Wyślij link. Każdy wiersz pokazuje, ile razy został użyty i kto go utworzył; Skopiuj link kopiuje go ponownie, a wyczerpane lub przeterminowane linki noszą oznaczenie Wykorzystany lub Wygasł.',
  'help.guide.invite-links.result':
    'Kto otworzy link, rejestruje się z własnym hasłem i, przy wybranej podróży, od razu do niej dołącza.',
  'help.guide.invite-links.tip.1':
    'Linki zaproszeń działają nawet wtedy, gdy Password Registration jest wyłączona w Ustawienia.',
  'help.guide.invite-links.tip.2':
    'Link z jednym użyciem i krótkim terminem ważności to najbezpieczniejsze domyślne ustawienie dla jednej osoby.',
  // delete-user
  'help.guide.delete-user.title': 'Usuń użytkownika',
  'help.guide.delete-user.goal': 'Usuń konto i wszystko, co należy tylko do niego.',
  'help.guide.delete-user.step.1': 'Kliknij ikonę kosza w wierszu użytkownika i potwierdź Usuń użytkownika.',
  'help.guide.delete-user.result':
    'Konto, jego własne podróże i jego dzienniki znikają; podróże dzielone z innymi zostają u pozostałych członków.',
  'help.guide.delete-user.tip.1': 'Nie da się tego cofnąć. Jeśli nie masz pewności, zrób najpierw kopię zapasową.',
  'help.guide.delete-user.tip.2':
    'Ostatniego administratora nie da się usunąć; najpierw zrób administratorem kogoś innego.',
  // permissions
  'help.guide.permissions.title': 'Zdecyduj, kto może co robić',
  'help.guide.permissions.goal': 'Ustaw dla każdej akcji, która rola może ją wykonać na tym TREK-u.',
  'help.guide.permissions.step.1':
    'W Ustawienia uprawnień znajdź akcję w jej grupie, na przykład Usuwanie podróży w Zarządzanie podróżami, i wybierz poziom: Wszyscy, Członkowie podróży, Właściciel podróży albo Tylko admin. Zmieniony wiersz jest oznaczony jako dostosowane.',
  'help.guide.permissions.step.2': 'Kliknij Zapisz. Przywróć domyślne cofa każdy wiersz do wbudowanego poziomu.',
  'help.guide.permissions.result':
    'Reguła obowiązuje od razu we wszystkich podróżach; przyciski i menu osób poniżej poziomu znikają.',
  'help.guide.permissions.tip.1':
    'Właściciel podróży to osoba, która utworzyła podróż; administratorzy zawsze mogą wszystko.',
  'help.guide.permissions.tip.2':
    'Obniż poziom zamiast usuwać członka: członek, który nie może edytować, nadal może czytać i komentować.',
  // default-map
  'help.guide.default-map.title': 'Ustaw domyślną mapę dla nowych użytkowników',
  'help.guide.default-map.goal': 'Daj każdemu nowemu kontu działającą mapę bez osobistego tokenu.',
  'help.guide.default-map.step.1':
    'W Mapa wybierz Silnik map i, dla Mapbox lub MapLibre, Styl mapy, Współdzielony token Mapbox i Tryb wysokiej jakości; dla mapy rastrowej Szablon mapy i Współdzielony klucz CARTO.',
  'help.guide.default-map.step.2':
    'Obok każdego pola, które zmieniłeś, przywróć wraca do własnego wyboru TREK-a. Domyślne ustawienia użytkownika po lewej robią to samo dla Motyw, jednostek i waluty.',
  'help.guide.default-map.result':
    'Nowe konta startują z tymi ustawieniami; kto ustawił własną mapę w Ustawienia, zachowuje swoją.',
  'help.guide.default-map.tip.1':
    'Token wpisany tutaj dzielą wszyscy, którzy nie mają własnego, więc pilnuj jego limitu.',
  'help.guide.default-map.tip.2':
    'Istniejące konta, które nigdy nie tknęły zakładki mapy, też podążają za tymi ustawieniami domyślnymi.',
  // packing-templates
  'help.guide.packing-templates.title': 'Zbuduj szablon pakowania',
  'help.guide.packing-templates.goal': 'Daj podróżom listę pakowania na start zamiast pustej.',
  'help.guide.packing-templates.step.1': 'Kliknij Nowy szablon, wpisz nazwę i potwierdź ptaszkiem.',
  'help.guide.packing-templates.step.2':
    'Otwórz szablon i kliknij Dodaj kategorię; pod każdą kategorią + dodaje pozycje, a pozycja potrzebuje tylko nazwy.',
  'help.guide.packing-templates.step.3':
    'Wszystko zapisuje się na bieżąco. Ołówek zmienia nazwę szablonu, kategorii lub pozycji, kosz ją usuwa.',
  'help.guide.packing-templates.result':
    'Szablon jest oferowany na liście pakowania każdej podróży; zastosowanie go kopiuje pozycje, więc podróż może je dowolnie zmieniać.',
  'help.guide.packing-templates.tip.1':
    'Szablon na rodzaj podróży, plaża, miasto, wędrówka, bije jedną gigantyczną listę.',
  'help.guide.packing-templates.tip.2': 'Usunięcie szablonu nie rusza podróży, które już go zastosowały.',
  // categories
  'help.guide.categories.title': 'Zarządzaj zestawem kategorii',
  'help.guide.categories.goal': 'Zdecyduj, jakie kategorie mogą nosić miejsca i kolekcje, i jak wyglądają.',
  'help.guide.categories.step.1':
    'Kliknij Nowa kategoria, nadaj jej nazwę, wybierz ikonę i kolor; Podgląd pokazuje wynik. Kliknij Utwórz.',
  'help.guide.categories.step.2':
    'Najedź na kategorię na liście, by ją edytować lub usunąć. Usuwanie prosi o potwierdzenie.',
  'help.guide.categories.result':
    'Zestaw działa wszędzie naraz: w inspektorze miejsc, pinezkach na mapie, Kolekcjach i filtrach.',
  'help.guide.categories.tip.1':
    'Miejsca zachowują id kategorii, więc zmiana nazwy kategorii zmienia ją na każdym miejscu.',
  'help.guide.categories.tip.2':
    'Usunięta kategoria zostawia swoje miejsca bez kategorii; jeśli to ma znaczenie, najpierw je przepisz.',
  // school-holiday-catalog
  'help.guide.school-holiday-catalog.title': 'Prowadź ferie szkolne ręcznie',
  'help.guide.school-holiday-catalog.goal': 'Obejmij kraj lub region, którego nie pokrywają wbudowane źródła ferii.',
  'help.guide.school-holiday-catalog.step.1':
    'W Ferie szkolne kliknij Dodaj kraj, wpisz Kraj i jego Kod kraju (np. US), i Zapisz; potem Dodaj region dla każdej jego części, która się różni.',
  'help.guide.school-holiday-catalog.step.2':
    'Kliknij region, by otworzyć Region lub okręg szkolny: Dodaj okres, nadaj każdemu Nazwa ferii, Data rozpoczęcia i Data zakończenia, i Zapisz. Kosz usuwa okres, region albo, gdy nie ma już regionów, kraj.',
  'help.guide.school-holiday-catalog.result':
    'Użytkownicy znajdują kraj i region w Ustawienia w Vacay i widzą okresy na swojej siatce roku.',
  'help.guide.school-holiday-catalog.tip.1':
    'Regionów z wbudowanych źródeł nie da się tu edytować; jeśli data jest błędna, dodaj obok ręczny region.',
  // auth-methods
  'help.guide.auth-methods.title': 'Zdecyduj, jak ludzie się logują',
  'help.guide.auth-methods.goal': 'Otwórz lub zamknij logowanie hasłem, SSO i rejestrację, i wymagaj 2FA.',
  'help.guide.auth-methods.step.1':
    'W Authentication Methods włącz lub wyłącz Password Login i Password Registration. Rejestracja wyłączona oznacza nowe konta tylko przez linki zaproszeń, SSO albo ręcznie.',
  'help.guide.auth-methods.step.2':
    'SSO Login i SSO Auto-Provisioning wymagają skonfigurowanego poniżej Logowanie jednokrotne (OIDC); auto-provisioning tworzy konto, gdy ktoś loguje się przez SSO po raz pierwszy.',
  'help.guide.auth-methods.step.3':
    'Wymagaj uwierzytelniania dwuskładnikowego (2FA) sprawia, że każde logowanie hasłem ustawia aplikację uwierzytelniającą przy następnym logowaniu. Logowanie kluczem dostępu potrzebuje Relying Party ID (domena) i Dozwolone origins, pod którymi Twój TREK jest dostępny.',
  'help.guide.auth-methods.result': 'Strona logowania oferuje dokładnie te metody, które zostawiłeś włączone.',
  'help.guide.auth-methods.tip.1':
    'Ostrzeżenie pojawia się, zanim się zablokujesz: przynajmniej jedna droga wejścia dla administratorów zostaje włączona.',
  'help.guide.auth-methods.tip.2': 'Wartości ustawione przez zmienne środowiskowe są tu widoczne tylko do odczytu.',
  // oidc
  'help.guide.oidc.title': 'Podłącz logowanie jednokrotne',
  'help.guide.oidc.goal': 'Pozwól ludziom logować się przez Twojego dostawcę tożsamości.',
  'help.guide.oidc.step.1':
    'W Logowanie jednokrotne (OIDC) wpisz Wyświetlana nazwa dla przycisku oraz URL wystawcy, Client ID i Client Secret od swojego dostawcy, potem Zapisz.',
  'help.guide.oidc.step.2': 'Włącz SSO Login w Authentication Methods.',
  'help.guide.oidc.result':
    'Strona logowania pokazuje przycisk SSO; przy włączonym SSO Auto-Provisioning nowi użytkownicy dostają konto automatycznie.',
  'help.guide.oidc.tip.1':
    'Redirect URI, którego potrzebuje Twój dostawca, to adres Twojego TREK-a plus ścieżka callbacku OIDC z dokumentacji.',
  'help.guide.oidc.tip.2':
    'Mapowanie claimów decyduje, które grupy SSO zostają administratorami; zobacz stronę OIDC w dokumentacji.',
  // instance-keys
  'help.guide.instance-keys.title': 'Wpisz klucze API',
  'help.guide.instance-keys.goal':
    'Odblokuj wyszukiwanie miejsc Google, okładki z Unsplash i Amap dla całej instancji.',
  'help.guide.instance-keys.step.1':
    'W Klucze API wklej Klucz Google Maps API i kliknij Testuj; pole mówi, czy klucz odpowiada.',
  'help.guide.instance-keys.step.2':
    'W Do czego służy klucz włącz tylko funkcje, za które chcesz płacić tym kluczem: Autouzupełnianie miejsc, Szczegóły miejsca, Zdjęcia miejsc, Wzbogacanie miejsc, Dziennik wyszukiwania miejsc.',
  'help.guide.instance-keys.step.3':
    'Klucz API Unsplash napędza wyszukiwanie okładek; Klucz API Amap (高德地图) wyszukiwanie miejsc w Chinach. Każdy przetestuj tak samo.',
  'help.guide.instance-keys.result':
    'Użytkownicy dostają funkcje bez własnych kluczy; bez klucza Google TREK szuka przez darmowy stos OpenStreetMap i TREK Places API.',
  'help.guide.instance-keys.tip.1':
    'Osobisty klucz użytkownika w Ustawienia wygrywa z kluczem instancji dla tego użytkownika.',
  'help.guide.instance-keys.tip.2':
    'Klucze mogą też pochodzić ze zmiennych środowiskowych; te są tu widoczne tylko do odczytu.',
  // places-transit
  'help.guide.places-transit.title': 'Wybierz dostawców wyszukiwania i transportu',
  'help.guide.places-transit.goal': 'Zdecyduj, kto odpowiada na wyszukiwania miejsc i trasy transportu publicznego.',
  'help.guide.places-transit.step.1':
    'W Dostawca wyszukiwania miejsc wybierz Automatycznie, Google Places, Amap (高德地图) lub OpenStreetMap. Automatycznie używa najlepszego klucza, jaki istnieje.',
  'help.guide.places-transit.step.2':
    'W Dostawca transportu publicznego wybierz Transitous (bezpłatnie), na cały świat i bez klucza, albo Google, który wymaga klucza Google.',
  'help.guide.places-transit.result':
    'Każde pole wyszukiwania i każda trasa transportu publicznego w TREK-u podąża za tym wyborem.',
  'help.guide.places-transit.tip.1': 'Dostawca bez swojego klucza pokazuje tu ostrzeżenie i wraca do OpenStreetMap.',
  'help.guide.places-transit.tip.2': 'Trasy transportu Google są rozliczane za żądanie; Transitous nie.',
  // file-types
  'help.guide.file-types.title': 'Ogranicz typy plików',
  'help.guide.file-types.goal': 'Zdecyduj, jakie rozszerzenia plików mogą mieć przesyłane pliki.',
  'help.guide.file-types.step.1': 'W Dozwolone typy plików edytuj listę rozszerzeń rozdzielonych przecinkami i zapisz.',
  'help.guide.file-types.result':
    'Przesłanie jakiegokolwiek innego typu jest odrzucane z jasnym komunikatem, w dokumentach, dzienniku i okładkach.',
  'help.guide.file-types.tip.1':
    'Zostaw typy obrazów na liście; okładki i zdjęcia z dziennika przechodzą tę samą kontrolę.',
  // toggle-addon
  'help.guide.toggle-addon.title': 'Włącz lub wyłącz dodatek',
  'help.guide.toggle-addon.goal': 'Zaoferuj moduł funkcji wszystkim albo go zabierz.',
  'help.guide.toggle-addon.step.1':
    'Przestaw przełącznik na kafelku dodatku. Wpis w nawigacji pojawia się lub znika dla wszystkich naraz.',
  'help.guide.toggle-addon.step.2':
    'Niektóre kafelki mają podwiersze z opcjami, na przykład Kontrola bagażu pod Listy albo dostawcy zdjęć pod Dziennik podróży; pokazują się tylko, gdy dodatek jest włączony.',
  'help.guide.toggle-addon.result': 'Dane wyłączonego dodatku zostają; ponowne włączenie pokazuje je z powrotem.',
  'help.guide.toggle-addon.tip.1': 'Wyłączenie MCP usuwa endpoint i sekcje Integracje, które od niego zależą.',
  'help.guide.toggle-addon.tip.2':
    'Vacay, Atlas i Dziennik podróży to dodatki, o które użytkownicy proszą najczęściej; Dokumenty potrzebują magazynu na przesyłane pliki.',
  // install-plugin
  'help.guide.install-plugin.title': 'Zainstaluj wtyczkę',
  'help.guide.install-plugin.goal': 'Dodaj wtyczkę firmy trzeciej i daj jej dokładnie te uprawnienia, o które prosi.',
  'help.guide.install-plugin.step.1':
    'Otwórz Odkrywaj, wybierz wtyczkę i kliknij Zainstaluj; albo kliknij Prześlij wtyczkę i wybierz pakiet .zip lub .tar.gz.',
  'help.guide.install-plugin.step.2':
    'Z powrotem w Zainstalowane przeczytaj wiersz: co wtyczka może czytać lub zapisywać, jakie hosty wywołuje i czy jest podpisana. Włącz Włącz wtyczkę.',
  'help.guide.install-plugin.step.3':
    'Menu wiersza oferuje Uruchom ponownie, Pokaż dziennik błędów, Dozwolone hosty i Zmień wersję…; Usuń ją odinstalowuje. Aktualizacja jest oferowana w wierszu, gdy istnieje nowsza wersja, a taka, która prosi o nowe prawa, pozostaje wyłączona, dopóki ich nie zatwierdzisz.',
  'help.guide.install-plugin.result':
    'Wtyczka działa we własnym procesie; to, co dodaje, widżety, warstwy mapy, narzędzia, pojawia się tam, gdzie wtyczka to deklaruje.',
  'help.guide.install-plugin.tip.1': 'Skanuj ponownie wykrywa folder wtyczki podłączony do rozwoju bez pakietu.',
  'help.guide.install-plugin.tip.2':
    'Niepodpisana wtyczka jest tak oznaczona; instaluj ją tylko wtedy, gdy ufasz jej źródłu.',
  // storage-backends
  'help.guide.storage-backends.title': 'Przenieś przesłane pliki na S3 lub mirror',
  'help.guide.storage-backends.goal': 'Trzymaj pliki w magazynie obiektowym albo na dysku i w buckecie jednocześnie.',
  'help.guide.storage-backends.step.1':
    'W Backendy kliknij Dodaj backend, nadaj mu Nazwa, wybierz Typ, Lokalny, S3 lub Mirror, wypełnij pola i Zastosuj. Testuj sprawdza połączenie, Zapisz zmiany je zapisuje.',
  'help.guide.storage-backends.step.2':
    'W Kategorie przypisz każdą kategorię przesyłania do backendu. Zmiana jednej pyta, czy Przenieś istniejące obiekty, czy Przekieruj tylko nowe zapisy.',
  'help.guide.storage-backends.step.3': 'Stan u góry sprawdza każdy backend; czerwony wpis nazywa to, co zawiodło.',
  'help.guide.storage-backends.result':
    'Nowe przesłane pliki trafiają do przypisanego backendu; przeniesione pliki są serwowane stamtąd.',
  'help.guide.storage-backends.tip.1':
    'Backend skonfigurowany przez zmienne środowiskowe jest pokazany, ale nie da się go tu edytować.',
  'help.guide.storage-backends.tip.2':
    'Mirror zapisuje do obu celów i czyta z pierwszego; użyj go do migracji bez przestoju.',
  // channels-instance
  'help.guide.channels-instance.title': 'Skonfiguruj kanały powiadomień',
  'help.guide.channels-instance.goal': 'Zdecyduj, które kanały mogą wybrać użytkownicy, i skonfiguruj e-mail.',
  'help.guide.channels-instance.step.1':
    'W Email (SMTP) wpisz SMTP Host, SMTP Port, SMTP User, SMTP Password i From Address; Wyślij testowego e-maila wysyła wiadomość do Ciebie.',
  'help.guide.channels-instance.step.2':
    'Włącz Web Push, Ntfy i Webhook, by je zaoferować; użytkownicy włączają wtedy push na każdym urządzeniu albo wpisują własny temat lub URL w Ustawienia, Powiadomienia.',
  'help.guide.channels-instance.step.3':
    'Przypomnienia o podróżach przełącza przypomnienie przed rozpoczęciem podróży; In-App jest zawsze włączony i tylko tu opisany.',
  'help.guide.channels-instance.result': 'Zakładka Powiadomienia każdego użytkownika pokazuje kanały, które włączyłeś.',
  'help.guide.channels-instance.tip.1':
    'Domyślny serwer ntfy wpisany tutaj jest wstępnie wypełniony u użytkowników; nadal mogą podać własny.',
  'help.guide.channels-instance.tip.2':
    'Kanały wtyczek pojawiają się same, gdy aktywna jest wtyczka z taką możliwością.',
  // admin-channels
  'help.guide.admin-channels.title': 'Odbieraj zdarzenia administracyjne na telefonie',
  'help.guide.admin-channels.goal':
    'Dowiaduj się o nieudanych backupach, nowych wydaniach i innych zdarzeniach instancji.',
  'help.guide.admin-channels.step.1': 'W Admin Ntfy wpisz temat i, jeśli trzeba, serwer i token; w Webhook admina URL.',
  'help.guide.admin-channels.step.2':
    'Kliknij Wyślij testowe Ntfy lub Wyślij testowy webhook, by zobaczyć, jak wiadomość dociera.',
  'help.guide.admin-channels.result':
    'Zdarzenia administracyjne trafiają tam oprócz dzwonka w aplikacji każdego administratora.',
  'help.guide.admin-channels.tip.1':
    'Trzymaj temat administracyjny osobno od osobistego, żeby awaria nie utonęła w gadaninie o podróżach.',
  // mcp-tokens-admin
  'help.guide.mcp-tokens-admin.title': 'Cofnij dostęp AI',
  'help.guide.mcp-tokens-admin.goal':
    'Zobacz i odetnij każdy token i sesję, jakie trzyma klient AI, u dowolnego użytkownika.',
  'help.guide.mcp-tokens-admin.step.1':
    'W Tokeny API znajdź token po użytkowniku i nazwie; kosz go usuwa, a klient natychmiast się zatrzymuje.',
  'help.guide.mcp-tokens-admin.step.2':
    'W Sesje OAuth to samo dla klientów przeglądarkowych: klient, użytkownik i data, a kosz cofa sesję.',
  'help.guide.mcp-tokens-admin.result':
    'Klient musi zostać ponownie podłączony przez swojego użytkownika; nic innego się nie zmienia.',
  'help.guide.mcp-tokens-admin.tip.1':
    'Uprawnienia mówią, co klient mógł robić; uprawnienie tylko do odczytu można spokojnie zostawić.',
  'help.guide.mcp-tokens-admin.tip.2': 'Wyłączenie dodatku MCP cofa wszystko naraz.',
  // release-history
  'help.guide.release-history.title': 'Sprawdź, czy jest nowe wydanie',
  'help.guide.release-history.goal': 'Wiedz, czy Twój TREK jest aktualny i co przynosi następna wersja.',
  'help.guide.release-history.step.1':
    'Gdy istnieje nowsze wydanie, Dostępna aktualizacja pojawia się u góry strony administracji; Zobacz na GitHubie je otwiera, a Jak zaktualizować objaśnia aktualizację dla Dockera i innych instalacji.',
  'help.guide.release-history.step.2':
    'Historia wydań wypisuje każde wydanie z notatkami; Pokaż szczegóły je rozwija, najnowsze nosi Najnowsze, a Załaduj więcej cofa się dalej w przeszłość.',
  'help.guide.release-history.result':
    'Aktualizacja odbywa się na hoście, przez pobranie nowego obrazu albo zbudowanie nowego tagu; katalog danych zostaje.',
  'help.guide.release-history.tip.1': 'Zrób kopię zapasową przed aktualizacją; zakładka Backupy jest tuż obok.',
  'help.guide.release-history.tip.2':
    'Wydania wstępne są pokazywane, ale nie ogłaszane jako aktualizacje, chyba że takie uruchamiasz.',
  // create-backup
  'help.guide.create-backup.title': 'Zrób i przywróć kopię zapasową',
  'help.guide.create-backup.goal':
    'Zrób migawkę całej instancji, trzymaj kopię gdzie indziej i miej możliwość jej przywrócenia.',
  'help.guide.create-backup.step.1':
    'W Kopia zapasowa danych kliknij Utwórz kopię zapasową. Pakuje bazę danych i przesłane pliki do jednego pliku na serwerze.',
  'help.guide.create-backup.step.2': 'Pobierz trzyma kopię poza maszyną; kosz usuwa stare, by zwolnić miejsce.',
  'help.guide.create-backup.step.3':
    'Przywróć przy kopii albo Prześlij kopię zapasową z plikiem zastępuje bieżące dane, gdy Przywrócić kopię zapasową? raz zapyta.',
  'help.guide.create-backup.result':
    'Przywrócenie odtwarza użytkowników, podróże, pliki i ustawienia ze stanu tej kopii; wszyscy zostają wylogowani.',
  'help.guide.create-backup.tip.1':
    'Przywracanie to jedyna akcja tutaj, której nie da się cofnąć. Zrób najpierw świeżą kopię zapasową.',
  'help.guide.create-backup.tip.2':
    'Kopie zapasowe leżą w katalogu danych; dopiero kopia na innej maszynie czyni z nich kopię zapasową.',
  // auto-backup
  'help.guide.auto-backup.title': 'Zaplanuj kopie zapasowe',
  'help.guide.auto-backup.goal': 'Pozwól serwerowi samemu robić kopie zapasowe i trzymać tylko kilka ostatnich.',
  'help.guide.auto-backup.step.1':
    'W Automatyczna kopia zapasowa włącz Włącz automatyczną kopię zapasową i wybierz Częstotliwość, Uruchom o godzinie oraz, dla tygodniowej lub miesięcznej, Dzień tygodnia lub Dzień miesiąca.',
  'help.guide.auto-backup.step.2':
    'Usuń stare kopie zapasowe po ustala, jak długo kopia jest przechowywana; starsze znikają, gdy powstaje nowa.',
  'help.guide.auto-backup.result':
    'Kopie pojawiają się na liście według harmonogramu; niepowodzenie trafia do kanałów administracyjnych.',
  'help.guide.auto-backup.tip.1': 'Godziny podążają za strefą czasową serwera, pokazaną w zakładce Audit.',
  'help.guide.auto-backup.tip.2': 'Miejsce na serwerze jest skończone; trzymanie trzech do pięciu zwykle wystarcza.',
  // audit-log
  'help.guide.audit-log.title': 'Czytaj dziennik audytu',
  'help.guide.audit-log.goal': 'Dowiedz się, kto co zrobił i kiedy.',
  'help.guide.audit-log.step.1':
    'Czytaj wiersze: czas, użytkownik, akcja, zasób, IP i szczegóły, najnowsze pierwsze. Akcje są nazwane według tego, co się stało, jak nieudane logowanie, zmiana MFA albo przywrócenie.',
  'help.guide.audit-log.step.2': 'Odśwież ładuje ponownie górę; Załaduj więcej cofa się dalej w przeszłość.',
  'help.guide.audit-log.result': 'Ślad, który możesz przekazać każdemu, kto pyta, dlaczego coś się zmieniło.',
  'help.guide.audit-log.tip.1': 'Czasy są pokazane w strefie czasowej serwera, nazwanej nad tabelą.',
  'help.guide.audit-log.tip.2':
    'Dziennik jest tylko dopisywany; niczego tutaj nie da się edytować ani usunąć z aplikacji.',
  // document-providers
  'help.guide.document-providers.title': 'Zaoferować magazyn dokumentów',
  'help.guide.document-providers.goal': 'Zdecyduj, z którymi magazynami podróż może synchronizować swoje dokumenty.',
  'help.guide.document-providers.step.1':
    'Kafelek Dokumenty niesie magazyny jako wiersze na swojej półce: Paperless-ngx, Papra, Nextcloud, OpenCloud i Synology Drive. Wszystkie pięć zaczyna wyłączone, a półka jest tam tylko wtedy, gdy same Dokumenty są włączone.',
  'help.guide.document-providers.step.2':
    'Przełącz przełącznik w wierszu Nextcloud. Komunikat brzmi Dodatek został zaktualizowany, a od tej chwili właściciele podróży znajdują Synchronizacja dokumentów w zakładce Pliki swoich podróży, z Nextcloud pod Połącz dostawcę.',
  'help.guide.document-providers.result':
    'Magazyn jest w ofercie na każdej podróży tego TREK-a; nic nie jest połączone, dopóki nie zrobi tego właściciel podróży.',
  'help.guide.document-providers.tip.1':
    'Tutaj decyduje się tylko, czy magazyn może być oferowany. Adres i dane logowania należą do podróży i wpisuje je w jej zakładce Pliki właściciel podróży, nigdy w panelu administracyjnym.',
  'help.guide.document-providers.tip.2':
    'Wyłączenie Dokumentów wyłącza z nimi każdy magazyn, a magazynu nie da się włączyć, gdy Dokumenty są wyłączone: serwer odpowiada Enable the Documents addon first. Magazyn w Twojej własnej sieci potrzebuje też ALLOW_INTERNAL_NETWORK=true na serwerze.',

  // ── Screen: trip ──────────────────────────────────────────────────────────────────────
  'help.ctx.trip.title': 'Podróż',
  'help.ctx.trip.summary':
    'Jedna podróż, w całości: plan z jego dniami, mapą i miejscami oraz zakładki transportu, rezerwacji, list, kosztów, plików i współpracy. Każda z nich ma własny ekran pomocy poniżej tego.',
  'help.ctx.trip.bullet.1':
    'Pasek zakładek: Plan, Transport, Rezerwacje, Listy, Koszty, Pliki i Współpraca. O tym, które zakładki istnieją na Twoim TREK-u, decydują dodatki i wtyczki.',
  'help.ctx.trip.bullet.2':
    'Plan to trzy kolumny: dni po lewej, mapa pośrodku, miejsca po prawej. Rezerwacje i transport żyją wewnątrz planu, przy przystanku i między przystankami; zakładki je wypisują.',
  'help.ctx.trip.bullet.3':
    'Udostępnij u góry po prawej otwiera ludzi podróży: członków, gości, link zaproszenia i publiczny link tylko do odczytu.',
  'help.ctx.trip.bullet.4': 'Tytuł, daty, okładkę i walutę edytujesz z Moje podróże, ołówkiem na karcie podróży.',
  'help.ctx.trip.bullet.5':
    'Strzałki przy wewnętrznej krawędzi kolumny zwijają ją, a mapa zajmuje miejsce; cienki separator obok kolumny zmienia jej szerokość.',
  'help.ctx.trip.bullet.6': 'Strzałka cofania na pasku narzędzi dni cofa ostatnią zmianę w planie.',
  // add-member
  'help.guide.add-member.title': 'Dodać członka',
  'help.guide.add-member.goal': 'Daj komuś z kontem TREK dostęp do tej podróży.',
  'help.guide.add-member.step.1': 'Kliknij Udostępnij u góry po prawej.',
  'help.guide.add-member.step.2': 'Pod Zaproś użytkownika wybierz osobę z listy i kliknij Zaproś.',
  'help.guide.add-member.step.3':
    'Osoba pojawia się teraz pod Dostęp. Korona oznacza właściciela; ikona na końcu wiersza znów usuwa dostęp.',
  'help.guide.add-member.result':
    'Członek widzi i edytuje podróż tak jak Ty, w granicach poziomów, które administrator ustawił pod Ustawienia uprawnień.',
  'help.guide.add-member.tip.1':
    'Kto nie figuruje na liście, nie ma jeszcze konta TREK: dodaj go jako gościa albo pozwól mu zarejestrować się przez link zaproszenia.',
  'help.guide.add-member.tip.2': 'Liczba obok Dostęp zlicza osoby w podróży; goście są wypisani osobno poniżej.',
  // trip-invite-link
  'help.guide.trip-invite-link.title': 'Zaprosić linkiem',
  'help.guide.trip-invite-link.goal': 'Pozwól ludziom samodzielnie dołączyć do podróży.',
  'help.guide.trip-invite-link.step.1':
    'Kliknij Udostępnij, a potem pod Link zaproszenia do podróży kliknij Utwórz link zaproszenia.',
  'help.guide.trip-invite-link.step.2':
    'Kliknij Kopiuj i wyślij link. Każdy z kontem TREK, kto go otworzy, dołącza jako członek.',
  'help.guide.trip-invite-link.step.3': 'Wygeneruj ponownie zastępuje link i unieważnia stary; Wyłącz go wyłącza.',
  'help.guide.trip-invite-link.result': 'Kto otworzy link, jest w podróży i pojawia się pod Dostęp.',
  'help.guide.trip-invite-link.tip.1':
    'Ktoś bez konta nie może go użyć. Administrator rozdaje linki rejestracyjne pod Administracja, Użytkownicy, i może powiązać jeden z tą podróżą.',
  'help.guide.trip-invite-link.tip.2':
    'Użyj Wygeneruj ponownie, gdy link trafił na zły czat: stary od razu przestaje działać.',
  // add-guest
  'help.guide.add-guest.title': 'Dodać gościa bez konta',
  'help.guide.add-guest.goal': 'Uwzględnij kogoś, kto nie używa TREK-a.',
  'help.guide.add-guest.step.1': 'Kliknij Udostępnij i przewiń do Goście.',
  'help.guide.add-guest.step.2': 'Wpisz imię w Imię gościa i kliknij Dodaj gościa.',
  'help.guide.add-guest.result':
    'Gościa można przypisać do kosztów, rzeczy do spakowania i zadań, ale nie może się zalogować.',
  'help.guide.add-guest.tip.1':
    'Ołówek zmienia nazwę gościa; ikona na końcu wiersza usuwa go razem z jego udziałami i przypisaniami.',
  'help.guide.add-guest.tip.2': 'Jeśli ta osoba założy później konto, zaproś ją jako członka i usuń gościa.',
  // public-link
  'help.guide.public-link.title': 'Opublikować link tylko do odczytu',
  'help.guide.public-link.goal': 'Pokaż podróż osobom, które nie powinny jej edytować.',
  'help.guide.public-link.step.1':
    'Kliknij Udostępnij; po prawej, pod Publiczny link, zaznacz, co link może pokazywać. Mapa i plan jest zawsze włączone; Rezerwacje, Lista pakowania, Koszty i Czat zależą od Ciebie.',
  'help.guide.public-link.step.2': 'Kliknij Utwórz link, a potem Kopiuj.',
  'help.guide.public-link.step.3': 'Zaznaczenia można zmieniać, dopóki link istnieje; Usuń link go kończy.',
  'help.guide.public-link.result': 'Każdy z linkiem widzi wybrane części bez logowania i nie może niczego zmienić.',
  'help.guide.public-link.tip.1':
    'Link nie jest nigdzie wypisany; kto go ma, może go otworzyć, więc traktuj go jak hasło.',
  'help.guide.public-link.tip.2': 'Dla praw do edycji dodaj tę osobę zamiast tego jako członka.',
  // transfer-ownership
  'help.guide.transfer-ownership.title': 'Przekazać podróż albo ją opuścić',
  'help.guide.transfer-ownership.goal': 'Zrób kogoś innego właścicielem albo wyjdź z podróży, która nie jest Twoja.',
  'help.guide.transfer-ownership.step.1':
    'Kliknij Udostępnij. Pod Dostęp korona w wierszu członka czyni tę osobę właścicielem; potwierdź pytanie.',
  'help.guide.transfer-ownership.step.2':
    'Opuść podróż w Twoim własnym wierszu zabiera Cię z podróży; jako właściciel najpierw ją przekaż.',
  'help.guide.transfer-ownership.result':
    'Nowy właściciel zarządza członkami i może usunąć podróż; Ty zostajesz zwykłym członkiem.',
  'help.guide.transfer-ownership.tip.1':
    'Właścicielem jest ten, kto utworzył podróż, dopóki jej nie przekaże; usunięcie podróży należy tylko do niego.',
  'help.guide.transfer-ownership.tip.2':
    'Usuń dostęp w cudzym wierszu to ten sam przycisk w drugą stronę: właściciel usuwa członka.',
  // collapse-columns
  'help.guide.collapse-columns.title': 'Zrobić miejsce dla mapy',
  'help.guide.collapse-columns.goal': 'Zwiń kolumnę albo daj jej więcej szerokości.',
  'help.guide.collapse-columns.step.1':
    'Kliknij strzałkę przy wewnętrznej krawędzi kolumny dni, żeby ją zwinąć; mapa zajmuje miejsce. Kolumna miejsc ma taką samą strzałkę.',
  'help.guide.collapse-columns.step.2': 'Kliknij strzałkę ponownie, żeby przywrócić kolumnę.',
  'help.guide.collapse-columns.step.3':
    'Przeciągnij cienki separator między kolumną a mapą, żeby zmienić szerokość kolumny.',
  'help.guide.collapse-columns.result': 'Szerokości są zapamiętywane; kolumny wracają otwarte przy następnej wizycie.',
  'help.guide.collapse-columns.tip.1': 'Obie kolumny można zwinąć naraz, by widzieć samą mapę.',
  'help.guide.collapse-columns.tip.2': 'Na telefonie nie ma kolumn: Plan i Miejsca to dwa przyciski na dole mapy.',
  // undo-change
  'help.guide.undo-change.title': 'Cofnąć ostatnią zmianę',
  'help.guide.undo-change.goal': 'Cofnij to, co właśnie zrobiłeś w planie.',
  'help.guide.undo-change.step.1':
    'Kliknij strzałkę cofania na pasku narzędzi nad dniami; jej podpowiedź nazywa zmianę, którą cofnie.',
  'help.guide.undo-change.result': 'Plan jest znów taki, jaki był, a strzałka szarzeje do następnej zmiany.',
  'help.guide.undo-change.tip.1':
    'Cofanie obejmuje plan: przypisywanie, usuwanie, zmianę kolejności i przenoszenie miejsc, optymalizację trasy, kasowanie miejsc, zmiany kategorii i importy.',
  'help.guide.undo-change.tip.2':
    'Sięga jeden krok wstecz: cofnąć można tylko ostatnią zmianę, a nowa zmiana ją zastępuje.',

  // ── Screen: trip-places ───────────────────────────────────────────────────────────────
  'help.ctx.trip-places.title': 'Miejsca',
  'help.ctx.trip-places.summary':
    'Prawa kolumna planu: każde miejsce podróży, zaplanowane czy nie, z wyszukiwaniem i filtrami, oraz sposoby na wprowadzenie miejsc, ręcznie, z pliku albo z udostępnionej listy.',
  'help.ctx.trip-places.bullet.1':
    'Dodaj miejsce/atrakcję u góry otwiera formularz miejsca, które wpiszesz lub wyszukasz. Gdy dzień jest otwarty, przycisk brzmi Nowe miejsce, a Do dnia obok niego tworzy miejsce od razu w tym dniu.',
  'help.ctx.trip-places.bullet.2':
    'Importuj plik przyjmuje pliki .gpx, .kml i .kmz; Import listy przyjmuje udostępnioną listę z Google Maps lub Naver Maps. Plik można też po prostu upuścić na kolumnę.',
  'help.ctx.trip-places.bullet.3':
    'Lista rozwijana przełącza między Wszystkie, Niezaplanowane, Zaplanowane i, gdy trasa została zaimportowana, Trasy; poniżej siedzą wyszukiwanie, filtr kategorii i gwiazdka dla minimalnej oceny.',
  'help.ctx.trip-places.bullet.4':
    'Wiersz pokazuje zdjęcie, nazwę i opis albo adres. Kliknij go, by zobaczyć szczegóły miejsca, przeciągnij go na dzień albo kliknij prawym przyciskiem po Edytuj, + Dzień, Otwórz stronę internetową, Google Maps, Zapisz w kolekcji i Usuń.',
  'help.ctx.trip-places.bullet.5':
    'Gdy dzień jest otwarty, + na końcu niezaplanowanego wiersza umieszcza miejsce w tym dniu, a Zaplanowane wypisują tylko ten dzień, z Pokaż całą podróż, by znów poszerzyć.',
  'help.ctx.trip-places.bullet.6':
    'Ptaszek na prawym końcu wiersza filtrów uruchamia zaznaczanie: kilka wierszy naraz dostaje nową kategorię, trafia do kolekcji albo zostaje usuniętych.',
  // create-place
  'help.guide.create-place.title': 'Utworzyć miejsce',
  'help.guide.create-place.goal': 'Dodaj miejsce lub atrakcję ręcznie, ze wszystkim, co plan musi o nim wiedzieć.',
  'help.guide.create-place.step.1':
    'Kliknij Dodaj miejsce/atrakcję u góry kolumny miejsc (Nowe miejsce, gdy dzień jest otwarty). Otwiera się formularz.',
  'help.guide.create-place.step.2':
    'Wpisz miejsce u góry w Szukaj miejsc... i wybierz wynik. Nazwa, Adres, Szerokość, Długość i Strona internetowa wypełniają się, a Szczegóły miejsca po lewej pokazują zdjęcia, godziny otwarcia i opis. W TREK-u z kluczem Google pod listą siedzi To nie to miejsce? Poszukaj w Google i uruchamia to samo wyszukiwanie przez Google.',
  'help.guide.create-place.step.3':
    'W Szczegółach miejsca kliknięcie zdjęcia pod Wybierz zdjęcie ustawia obrazek miejsca; Użyj tego tekstu przenosi opis do formularza.',
  'help.guide.create-place.step.4':
    'Sprawdź pola: Nazwa jest wymagana; Opis i Notatki są Twoje; Adres, Szerokość i Długość pochodzą z wyszukiwania albo są wpisane; Kategoria wybiera jedną z kategorii podróży, a + obok niej tworzy nową na miejscu; Strona internetowa przyjmuje link.',
  'help.guide.create-place.step.5':
    'Kliknij Dodaj. Jeśli miejsce o tej samej nazwie już jest w podróży, formularz to mówi, a przycisk zmienia się w Dodaj mimo to.',
  'help.guide.create-place.result': 'Miejsce jest na liście i na mapie, pod Niezaplanowane, dopóki nie trafi do dnia.',
  'help.guide.create-place.tip.1':
    'Pliki i Koszty na dole formularza dołączają do miejsca dokument albo otwierają edytor Koszty dla jego wydatku zaraz po zapisaniu.',
  'help.guide.create-place.tip.2':
    'Wyszukiwanie na każdym TREK-u obsługują indeks TREK i OpenStreetMap, a Szczegóły miejsca uzupełniają się z Wikipedii, Wikivoyage i Wikimedia. Google jest pytany tylko tam, gdzie oba nic nie znajdą, i tylko on przynosi oceny.',
  'help.guide.create-place.tip.3':
    'Miejsce może zacząć się też na mapie: kliknij punkt prawym przyciskiem, a formularz otworzy się z wypełnionymi współrzędnymi i adresem.',
  // place-to-open-day
  'help.guide.place-to-open-day.title': 'Dodać miejsce prosto do otwartego dnia',
  'help.guide.place-to-open-day.goal':
    'Pomiń drugi krok: utwórz albo wybierz miejsce, a od razu znajdzie się ono w dniu.',
  'help.guide.place-to-open-day.step.1':
    'Kliknij nagłówek dnia w kolumnie dni. Dzień jest otwarty: jego karta jest podświetlona, a kolumna miejsc zyskuje przycisk Do dnia.',
  'help.guide.place-to-open-day.step.2':
    'Do dnia otwiera ten sam formularz co Nowe miejsce, tylko miejsce ląduje w otwartym dniu w chwili, gdy klikniesz Dodaj.',
  'help.guide.place-to-open-day.step.3':
    'Miejsce, które już istnieje, trafia do otwartego dnia przez + na końcu swojego wiersza albo prawym przyciskiem, + Dzień.',
  'help.guide.place-to-open-day.step.4':
    'Odwrotnie też działa, i to bez otwierania dnia: przeciągnij wiersz miejsca poza kolumnę i upuść go na kartę dnia. Upuszczone między dwa przystanki trafia dokładnie tam.',
  'help.guide.place-to-open-day.result':
    'Miejsce jest wypisane pod dniem, na końcu; przeciągnij je w górę lub w dół tam, gdzie pasuje.',
  'help.guide.place-to-open-day.tip.1':
    'Otwarty dzień steruje też wyszukiwaniem: gdy dzień jest otwarty, mapa i wyszukiwanie w pobliżu zaczynają tam, dokąd ten dzień i tak prowadzi.',
  'help.guide.place-to-open-day.tip.2': 'Cofnij na pasku narzędzi nad dniami cofa przypisanie.',
  // filter-places
  'help.guide.filter-places.title': 'Znaleźć miejsce na liście',
  'help.guide.filter-places.goal': 'Zawęź kolumnę do miejsc, których szukasz.',
  'help.guide.filter-places.step.1':
    'Lista rozwijana u góry przełącza między Wszystkie, Niezaplanowane (jeszcze w żadnym dniu), Zaplanowane (w dniu) i Trasy (zaimportowane trasy GPX), każde ze swoją liczbą.',
  'help.guide.filter-places.step.2': 'Pisz w Szukaj miejsc...; lista zawęża się, gdy piszesz.',
  'help.guide.filter-places.step.3':
    'Wszystkie kategorie otwierają listę, na której zaznaczasz jedną lub więcej kategorii, wśród nich Brak kategorii; Wyczyść filtr na jej dole resetuje to.',
  'help.guide.filter-places.step.4':
    'Gwiazdka obok ustawia minimalną ocenę: 5+, 4+ i tak dalej pokazują tylko miejsca, które oceniłeś co najmniej tak wysoko.',
  'help.guide.filter-places.result': 'Liczba nad wierszami mówi, ile miejsc pasuje; filtry się łączą.',
  'help.guide.filter-places.tip.1':
    'Gdy dzień jest otwarty, Zaplanowane wypisują tylko ten dzień i mówią to: Widoczny tylko otwarty dzień, z Pokaż całą podróż obok.',
  'help.guide.filter-places.tip.2':
    'Mapa też zawęża się do otwartego dnia; Wszystkie na liście nadal pokazują każde miejsce podróży.',
  // edit-place
  'help.guide.edit-place.title': 'Zmienić miejsce',
  'help.guide.edit-place.goal': 'Popraw nazwę, przesuń pinezkę, dodaj stronę albo zmień kategorię.',
  'help.guide.edit-place.step.1':
    'Kliknij wiersz prawym przyciskiem i wybierz Edytuj, albo otwórz miejsce i kliknij Edytuj w jego szczegółach.',
  'help.guide.edit-place.step.2':
    'Zmień, co trzeba: Nazwa, Opis, Notatki, Adres, Szerokość i Długość, Kategoria, Strona internetowa. Otwarty z dnia formularz ma dodatkowo Notatki na ten dzień oraz Początek i Koniec dla tego dnia.',
  'help.guide.edit-place.step.3': 'Kliknij Aktualizuj.',
  'help.guide.edit-place.result':
    'Zmiana obowiązuje wszędzie, gdzie miejsce się pojawia: na liście, na mapie i w każdym dniu, w którym jest.',
  'help.guide.edit-place.tip.1':
    'Notatki na ten dzień należą do miejsca w tym jednym dniu; Notatki należą do samego miejsca.',
  'help.guide.edit-place.tip.2':
    'Koniec przed Początkiem blokuje Aktualizuj; Nakładanie się godzin z: tylko ostrzega, że inny przystanek dnia ma tę samą godzinę.',
  // delete-place
  'help.guide.delete-place.title': 'Usunąć miejsce',
  'help.guide.delete-place.goal': 'Wyjmij miejsce z podróży na dobre.',
  'help.guide.delete-place.step.1':
    'Kliknij wiersz prawym przyciskiem i wybierz Usuń, albo kliknij Usuń w szczegółach miejsca.',
  'help.guide.delete-place.step.2':
    'Potwierdź. Jeśli w tym miejscu zarezerwowano nocleg albo powiązana jest z nim rezerwacja, pytanie mówi, co idzie razem z nim.',
  'help.guide.delete-place.result':
    'Miejsce znika z listy, z mapy i z każdego dnia; Cofnij na pasku narzędzi nad dniami przywraca je.',
  'help.guide.delete-place.tip.1': 'Aby zdjąć miejsce tylko z jednego dnia, użyj na tym przystanku Usuń z dnia.',
  'help.guide.delete-place.tip.2': 'Kilka miejsc naraz: ptaszek obok filtrów uruchamia zaznaczanie.',
  // select-places
  'help.guide.select-places.title': 'Zmienić lub usunąć kilka miejsc naraz',
  'help.guide.select-places.goal': 'Uporządkuj listę za jednym razem, zamiast miejsce po miejscu.',
  'help.guide.select-places.step.1':
    'Kliknij ptaszek na prawym końcu wiersza filtrów. Wiersze dostają pola wyboru i pojawia się pasek z akcjami.',
  'help.guide.select-places.step.2': 'Zaznacz wiersze albo Zaznacz wszystko na pasku; pasek liczy, co jest zaznaczone.',
  'help.guide.select-places.step.3':
    'Change category nadaje im wszystkim jedną kategorię; Zapisz w kolekcji kopiuje je do jednej z Twoich kolekcji; Usuń wybrane usuwa je po potwierdzeniu.',
  'help.guide.select-places.step.4': 'Kliknij ptaszek jeszcze raz, by wyjść z zaznaczania.',
  'help.guide.select-places.result':
    'Zmiana obowiązuje dla każdego zaznaczonego miejsca; usunięcie można cofnąć z paska narzędzi nad dniami.',
  'help.guide.select-places.tip.1':
    'Filtry działają dalej podczas zaznaczania: przefiltruj najpierw na Niezaplanowane, a wtedy Zaznacz wszystko łapie dokładnie te.',
  'help.guide.select-places.tip.2':
    'Oznacz jako odwiedzone na listach pojawia się na pasku, gdy dodatek Kolekcje jest włączony: odhacza miejsca w kolekcjach, w których są zapisane.',
  // import-places-file
  'help.guide.import-places-file.title': 'Zaimportować miejsca z pliku GPX, KML lub KMZ',
  'help.guide.import-places-file.goal': 'Wprowadź to, co wyeksportowały Google My Maps, Google Earth albo tracker GPS.',
  'help.guide.import-places-file.step.1': 'Kliknij Importuj plik albo upuść plik gdziekolwiek na kolumnie miejsc.',
  'help.guide.import-places-file.step.2':
    'Wybierz plik albo przeciągnij go do ramki. Przy GPX zaznacz, co zaimportować: Punkty trasy, Trasy, Trasy GPS (ze śladem); przy KML i KMZ Punkty (Placemarks) i Ścieżki (LineStrings).',
  'help.guide.import-places-file.step.3':
    'Ramka przyjmuje kilka plików naraz i tylko .gpx, .kml i .kmz. Inny rodzaj pliku albo plik powyżej 10 MB jest odrzucany w oknie i nie zostaje zaimportowany.',
  'help.guide.import-places-file.step.4':
    'Kliknij Importuj. Komunikat mówi, ile miejsc weszło; przy pliku KML lub KMZ okno zostaje otwarte z podsumowaniem tego, co powstało i co pominięto.',
  'help.guide.import-places-file.result':
    'Miejsca są na liście; trasa niesie na swoim wierszu znacznik trasy, rysuje się na mapie i dostaje własny filtr Trasy.',
  'help.guide.import-places-file.tip.1':
    'Za duży plik jest odrzucany z podaniem limitu rozmiaru; wyeksportuj go jeszcze raz bez zdjęć albo podziel go.',
  'help.guide.import-places-file.tip.2': 'Import można cofnąć w całości z paska narzędzi nad dniami.',
  // import-places-list
  'help.guide.import-places-list.title': 'Zaimportować udostępnioną listę Google Maps lub Naver Maps',
  'help.guide.import-places-list.goal': 'Zamień link udostępnionej listy w miejsca.',
  'help.guide.import-places-list.step.1': 'Kliknij Import listy i wybierz Lista Google albo Lista Naver.',
  'help.guide.import-places-list.step.2':
    'Wklej udostępniony link listy. Działa też link do trasy w Google Maps: jego przystanki stają się miejscami, w kolejności jazdy.',
  'help.guide.import-places-list.step.3': 'Kliknij Importuj.',
  'help.guide.import-places-list.result':
    'Każde miejsce z listy jest w podróży, nazwane jak na liście; miejsca już obecne w podróży są pomijane.',
  'help.guide.import-places-list.tip.1':
    'Lista musi być udostępniona publicznie; link prywatnej listy nie importuje niczego.',
  'help.guide.import-places-list.tip.2':
    'Wzbogać miejsca przez Google pojawia się w oknie, gdy Twój TREK ma klucz Google: wyszukuje każde zaimportowane miejsce i uzupełnia zdjęcia, adres i szczegóły.',

  // ── Screen: trip-days ─────────────────────────────────────────────────────────────────
  'help.ctx.trip-days.title': 'Dni',
  'help.ctx.trip-days.summary':
    'Lewa kolumna planu: jedna karta na dzień z przystankami w kolejności, z notatkami, z rezerwacjami i transportem tego dnia oraz z trasą między przystankami. Tu podróż jest naprawdę planowana.',
  'help.ctx.trip-days.bullet.1':
    'Pasek narzędzi u góry: Eksportuj (PDF, kalendarz, GPX), Expand all days / Collapse all days, strzałka cofania, Zmień kolejność dni i Pokaż wszystkie trasy rezerwacji.',
  'help.ctx.trip-days.bullet.2':
    'Karta dnia: numer, pogoda, tytuł, data i koszt dnia w nagłówku; kliknij nagłówek, by otworzyć dzień, strzałka po prawej zwija kartę. Transport publiczny, Dodaj transport i Dodaj notatkę też siedzą w nagłówku.',
  'help.ctx.trip-days.bullet.3':
    'Wewnątrz dnia: przystanki w kolejności, każdy ze zdjęciem, nazwą, godziną i kłódką na zdjęciu; notatki; rezerwacje, które należą do dnia; a między przystankami czas przejazdu każdego odcinka.',
  'help.ctx.trip-days.bullet.4':
    'Pod przystankami pasek trasy: Trasa rysuje dzień na mapie, Optymalizuj porządkuje przystanki, Samochodem / Pieszo ustawia środek transportu dnia, a Otwórz w Google Maps i Otwórz w CoMaps przekazują dzień dalej.',
  'help.ctx.trip-days.bullet.5':
    'Miejsca trafiają do dnia przez przeciągnięcie wiersza z kolumny miejsc, przez + na tym wierszu, przez Dodaj miejsce do tego dnia w pustym dniu albo ze szczegółów miejsca.',
  'help.ctx.trip-days.bullet.6':
    'Łączny koszt na dole sumuje każdy przystanek i każdą rezerwację z ceną, w walucie podróży.',
  // read-day-plan
  'help.guide.read-day-plan.title': 'Przeczytać dzień',
  'help.guide.read-day-plan.goal': 'Poznaj, co mówi ci każda część karty dnia, zanim cokolwiek zmienisz.',
  'help.guide.read-day-plan.step.1':
    'Nagłówek: numer dnia, prognoza na ten dzień, Dzień 1 albo tytuł, który mu nadałeś, data i koszt dnia. Kliknij nagłówek, by otworzyć dzień (nad mapą otwierają się jego szczegóły); strzałka po prawej zwija i rozwija kartę.',
  'help.guide.read-day-plan.step.2':
    'Przystanek: uchwyt po lewej go przeciąga, zdjęcie nosi kłódkę dla optymalizacji trasy, dalej idą nazwa, opis i, jeśli są ustawione, Notatki na ten dzień. Plakietka godziny pokazuje Początek i Koniec, gdy przystanek je ma; strzałki, które pojawiają się na jego prawym końcu, przesuwają go w górę lub w dół.',
  'help.guide.read-day-plan.step.3':
    'Rezerwacja w dniu: rezerwacja przy przystanku oznacza przystanek jako Rezerwacja potwierdzona albo Rezerwacja oczekująca, a transport pokazuje się jako Wylot albo Przylot ze swoją godziną i trasą, z małym przełącznikiem, który rysuje tę trasę na mapie.',
  'help.guide.read-day-plan.step.4':
    'Między dwoma przystankami łącznik mówi, ile odcinek trwa i jak jest długi, w środku transportu dnia; kliknij go, by zmienić środek dla tego jednego odcinka.',
  'help.guide.read-day-plan.step.5':
    'Pasek trasy na końcu: Trasa rysuje drogę dnia na mapie, Optymalizuj zmienia kolejność przystanków, przyciski środka transportu wybierają Samochodem albo Pieszo, a Otwórz w Google Maps i Otwórz w CoMaps otwierają tam dzień.',
  'help.guide.read-day-plan.result': 'Każdy symbol na karcie coś znaczy; poradniki poniżej zmieniają każdy z nich.',
  'help.guide.read-day-plan.tip.1':
    'Kliknij przystanek prawym przyciskiem po jego menu: Edytuj, Usuń z dnia, Otwórz stronę internetową, aplikacje nawigacyjne (Google Maps, Waze, Apple Maps, OpenStreetMap, CoMaps), Zapisz w kolekcji, Usuń.',
  'help.guide.read-day-plan.tip.2':
    'Najedź na przystanek, a na jego końcu pojawi się Dodaj rezerwację: rezerwacja utworzona tam jest przypisana do tego przystanku w tym dniu.',
  // place-onto-day
  'help.guide.place-onto-day.title': 'Umieścić miejsce w dniu',
  'help.guide.place-onto-day.goal': 'Zrób z miejsca z listy przystanek dnia, tam, gdzie pasuje w kolejności.',
  'help.guide.place-onto-day.step.1':
    'Przeciągnij wiersz z kolumny miejsc na kartę dnia. Upuść go między dwa przystanki, by trafił dokładnie tam, albo gdziekolwiek na karcie, by dopisał się na końcu.',
  'help.guide.place-onto-day.step.2':
    'Bez przeciągania: otwórz dzień, klikając jego nagłówek, potem kliknij + na końcu wiersza miejsca albo kliknij wiersz prawym przyciskiem i wybierz + Dzień.',
  'help.guide.place-onto-day.step.3':
    'W pustym dniu Dodaj miejsce do tego dnia otwiera formularz miejsca, a nowe miejsce ląduje w dniu od razu.',
  'help.guide.place-onto-day.step.4':
    'Ze szczegółów miejsca Dodaj do dnia pyta, do którego dnia; gdy dzień jest otwarty z nagłówka, Do dnia w kolumnie miejsc tworzy nowe miejsce prosto w otwartym dniu.',
  'help.guide.place-onto-day.result':
    'Miejsce jest przystankiem dnia, na mapie z numerem dnia, a kolumna miejsc liczy je pod Zaplanowane.',
  'help.guide.place-onto-day.tip.1':
    'Miejsce może być w kilku dniach: do drugiego dnia dodaj je z kolumny miejsc. Przeciągnięcie przystanku z jednej karty dnia na drugą przenosi go zamiast tego.',
  'help.guide.place-onto-day.tip.2': 'Strzałka cofania na pasku narzędzi cofa przypisanie.',
  'help.guide.place-onto-day.tip.3':
    'Przystanku nie można upuścić między dwa wpisy z określoną godziną ani przed rezerwację, która już ma godzinę; plan trzyma się chronologii.',
  // reorder-stops
  'help.guide.reorder-stops.title': 'Zmienić kolejność w dniu',
  'help.guide.reorder-stops.goal': 'Przesuń przystanek w górę albo w dół, albo do innego dnia.',
  'help.guide.reorder-stops.step.1': 'Przeciągnij przystanek za uchwyt na nowe miejsce w karcie.',
  'help.guide.reorder-stops.step.2':
    'Albo użyj strzałek na prawym końcu przystanku: jeden krok w górę lub w dół na kliknięcie.',
  'help.guide.reorder-stops.step.3':
    'Przeciągnij przystanek na kartę innego dnia, by go tam przenieść; ze starego dnia znika.',
  'help.guide.reorder-stops.step.4':
    'Przystanek z określoną godziną pyta Usunąć godzinę?, gdy przeniesienie zaburzyłoby kolejność dnia, bo to godzina zdecydowała o jego miejscu: Potwierdź porzuca godzinę i pozwala mu iść gdziekolwiek.',
  'help.guide.reorder-stops.result': 'Trasa i czasy przejazdu od razu idą za nową kolejnością.',
  'help.guide.reorder-stops.tip.1':
    'Nie można zmieniać kolejności dla rezerwacji z określoną godziną; siedzą tam, gdzie stawia je ich godzina.',
  'help.guide.reorder-stops.tip.2':
    'Optymalizuj na pasku trasy porządkuje cały dzień według najkrótszej drogi; przystanek, który ma zostać na swoim miejscu, najpierw zablokuj.',
  // set-stop-times
  'help.guide.set-stop-times.title': 'Nadać przystankowi godzinę',
  'help.guide.set-stop-times.goal': 'Ustal, kiedy przystanek się zaczyna i kończy, żeby dzień czytało się jak rozkład.',
  'help.guide.set-stop-times.step.1':
    'Kliknij przystanek prawym przyciskiem i wybierz Edytuj. Otwarty z dnia formularz ma na dole Początek i Koniec.',
  'help.guide.set-stop-times.step.2':
    'Wpisz Początek i, jeśli chcesz, Koniec. Nakładanie się godzin z: ostrzega, że inny przystanek dnia z godziną się nakłada; Koniec przed Początkiem blokuje Aktualizuj.',
  'help.guide.set-stop-times.step.3':
    'Kliknij Aktualizuj. Przystanek dostaje plakietkę godziny i przesuwa się tam, gdzie jego godzina należy w dniu.',
  'help.guide.set-stop-times.result':
    'Przystanki z godziną trzymają swoje miejsce w kolejności; przystanki bez godziny układają się wokół nich.',
  'help.guide.set-stop-times.tip.1':
    'Godzina należy do przystanku w tym dniu; to samo miejsce w innym dniu może mieć inną godzinę.',
  'help.guide.set-stop-times.tip.2':
    'Przystanek z godziną przenosisz ręcznie przeciągnięciem: pytanie Usunąć godzinę? porzuca po drodze godzinę, gdy klikniesz Potwierdź.',
  'help.guide.set-stop-times.tip.3':
    'Notatki na ten dzień w tym samym formularzu trzymają to, co dotyczy tylko tego dnia, zarezerwowany stolik, numer biletu.',
  // remove-from-day
  'help.guide.remove-from-day.title': 'Zdjąć przystanek z dnia',
  'help.guide.remove-from-day.goal': 'Wypisz miejsce z planu, nie usuwając go z podróży.',
  'help.guide.remove-from-day.step.1': 'Kliknij przystanek prawym przyciskiem i wybierz Usuń z dnia.',
  'help.guide.remove-from-day.step.2':
    'Przystanku nie ma już w dniu; miejsce zostaje w kolumnie miejsc, pod Niezaplanowane, jeśli nie jest w żadnym innym dniu.',
  'help.guide.remove-from-day.result':
    'Dzień, jego trasa i jego koszt się przeliczają; strzałka cofania przywraca przystanek.',
  'help.guide.remove-from-day.tip.1': 'Usuń w tym samym menu usuwa miejsce z całej podróży, ze wszystkimi dniami.',
  'help.guide.remove-from-day.tip.2': 'Usuń z dnia siedzi też w panelu szczegółów miejsca, obok Dodaj do dnia.',
  // lock-stop
  'help.guide.lock-stop.title': 'Zablokować przystanek w miejscu',
  'help.guide.lock-stop.goal': 'Zostaw przystanek tam, gdzie jest, gdy trasa jest optymalizowana.',
  'help.guide.lock-stop.step.1':
    'Najedź na zdjęcie przystanku i kliknij kłódkę: Zachowaj pozycję podczas optymalizacji trasy.',
  'help.guide.lock-stop.step.2':
    'Optymalizuj układa teraz pozostałe przystanki wokół niego; kliknij kłódkę jeszcze raz (Kliknij, aby odblokować), by go zwolnić.',
  'help.guide.lock-stop.result':
    'Kłódka widnieje na zdjęciu; przystanek trzyma swoją pozycję, dopóki go nie odblokujesz.',
  'help.guide.lock-stop.tip.1':
    'Przystanek z określoną godziną jest zablokowany przez swoją godzinę; podczas optymalizacji nigdy się nie rusza.',
  'help.guide.lock-stop.tip.2':
    'Blokada trwa tę wizytę: po przeładowaniu każdy przystanek znów jest wolny, na stałe zostają tylko przystanki z godziną.',
  // day-note
  'help.guide.day-note.title': 'Dodać notatkę do dnia',
  'help.guide.day-note.goal': 'Trzymaj przypomnienie, numer biletu albo plan B prosto w dniu.',
  'help.guide.day-note.step.1': 'Kliknij Dodaj notatkę w nagłówku dnia.',
  'help.guide.day-note.step.2':
    'Nadaj jej nazwę w polu Notatka, to właśnie pokazuje karta dnia, a resztę napisz pod Notatka dnia. Pasek nad tekstem go formatuje (Pogrubienie, listy, linki, cytaty), a Podgląd po lewej pokazuje kartę, która z niego powstanie.',
  'help.guide.day-note.step.3':
    'Wybierz Ikonę i Kolor, żeby notatka odcinała się od przystanków, a potem kliknij Dodaj.',
  'help.guide.day-note.step.4':
    'Notatka siedzi w dniu jak przystanek: przeciągnij ją na miejsce, kliknij ją prawym przyciskiem po Edytuj i Usuń.',
  'help.guide.day-note.result':
    'Notatka jest częścią dnia, także w PDF; notatka z godziną układa się razem z przystankami z godziną.',
  'help.guide.day-note.tip.1':
    'Notatka z godziną może zastąpić transport, na który nie masz rezerwacji: „08:15 S3 z dworca głównego”.',
  'help.guide.day-note.tip.2': 'Notatki są na dzień; notatka dla całej podróży należy do Współpracy.',
  // day-route
  'help.guide.day-route.title': 'Pokazać i zoptymalizować trasę dnia',
  'help.guide.day-route.goal':
    'Zobacz drogę między przystankami, wybierz, jak podróżujesz, i pozwól TREK-owi ułożyć kolejność.',
  'help.guide.day-route.step.1':
    'Otwórz dzień i kliknij Trasa na pasku trasy: droga między przystankami rysuje się na mapie, a łączniki między przystankami pokazują czas i odległość każdego odcinka.',
  'help.guide.day-route.step.2':
    'Samochodem i Pieszo obok ustawiają środek transportu dnia; odcinki przeliczają się na nowo. Wtyczki mogą dodać własne środki.',
  'help.guide.day-route.step.3':
    'Kliknij łącznik, by zmienić środek transportu tego jednego odcinka: wybierz środek albo Użyj domyślnego dnia, by wrócić do ustawienia dnia.',
  'help.guide.day-route.step.4':
    'Optymalizuj zmienia kolejność przystanków według najkrótszej drogi. Przystanki z kłódką albo z określoną godziną trzymają swoje miejsce; gdy w dniu jest zakwaterowanie, trasa zaczyna się tam.',
  'help.guide.day-route.step.5':
    'Otwórz w Google Maps albo Otwórz w CoMaps otwiera cały dzień jako trasę w tej aplikacji, do nawigacji w drodze.',
  'help.guide.day-route.result':
    'Dzień jest trasą z godzinami; Łączny koszt i odcinki zmieniają się wraz z kolejnością.',
  'help.guide.day-route.tip.1':
    'Trasy liczy domyślnie OSRM; administrator może skierować TREK-a na inny silnik tras w Domyślnych ustawieniach.',
  'help.guide.day-route.tip.2':
    'Odcinek, którego nie dało się wyznaczyć, nie pokazuje czasu; sprawdź, czy oba przystanki mają współrzędne.',
  'help.guide.day-route.tip.3': 'Strzałka cofania cofa optymalizację.',
  // manage-days
  'help.guide.manage-days.title': 'Dodawać, przestawiać i zmieniać nazwy dni',
  'help.guide.manage-days.goal': 'Kształtuj same dni, nie tylko to, co w nich jest.',
  'help.guide.manage-days.step.1':
    'Dni biorą się z dat podróży; zmień daty na karcie podróży w Panelu, a dni na końcach dojdą albo znikną. Zanim zniknie dzień z zawartością, lista pokazuje, które dni odejdą i co na nich jest.',
  'help.guide.manage-days.step.2':
    'Zmień kolejność dni na pasku narzędzi otwiera listę: Przenieś w górę i Przenieś w dół przesuwają dzień ze wszystkim, co w nim jest, a Usuń dzień, kosz obok, go usuwa. Pod listą przycisk z następną datą dodaje dzień tuż po ostatnim dniu z datą i wydłuża podróż o jeden dzień; Bez daty dopisuje na końcu dzień bez daty.',
  'help.guide.manage-days.step.3':
    'Usuń dzień najpierw pyta: lista pokazuje, co odejdzie razem z dniem, jego miejsca, notatki i rezerwacje, nocleg z zameldowaniem lub wymeldowaniem tego dnia oraz dni, które przesuną się o jedną datę wcześniej. Usuń dzień go usuwa, Anuluj zostawia; ostatniego dnia nie da się usunąć.',
  'help.guide.manage-days.step.4':
    'Żeby zmienić nazwę dnia, otwórz go i kliknij ołówek obok jego tytułu w panelu szczegółów nad mapą; nazwa zastępuje Dzień 1 na karcie i w PDF.',
  'help.guide.manage-days.step.5':
    'Expand all days i Collapse all days na pasku narzędzi zwijają wszystkie karty naraz; pojedyncza karta zwija się swoją strzałką.',
  'help.guide.manage-days.result':
    'Daty zostają przy pozycji: dzień przesunięty w górę dostaje wcześniejszą datę, a jego przystanki, notatki i rezerwacje jadą razem z nim.',
  'help.guide.manage-days.tip.1': 'Przesunięcie dni da się cofnąć z paska narzędzi, usunięcia dnia nie.',
  'help.guide.manage-days.tip.2':
    'Koszt w nagłówku dnia sumuje te przystanki i rezerwacje tego dnia, które niosą cenę.',
  // bookings-in-plan
  'help.guide.bookings-in-plan.title': 'Czytać rezerwacje i transport w planie',
  'help.guide.bookings-in-plan.goal':
    'Poznaj, gdzie rezerwacja się pokazuje, gdy już istnieje, i który ekran ją tworzy.',
  'help.guide.bookings-in-plan.step.1':
    'Transport (Lot, Pociąg, Prom, Autobus, Samochód) pokazuje się w dniu odjazdu jako Wylot, a w dniu przyjazdu jako Przylot, z godziną i trasą; wielodniowy rozciąga się na dni pomiędzy.',
  'help.guide.bookings-in-plan.step.2':
    'Rezerwacja przypisana do przystanku (Restauracja, Wycieczka) oznacza ten przystanek jako Rezerwacja potwierdzona albo Rezerwacja oczekująca; rezerwacja, która ma dzień, ale nie ma przystanku, jest własnym wierszem w dniu.',
  'help.guide.bookings-in-plan.step.3':
    'Noc w hotelu to zakwaterowanie: siedzi w panelu szczegółów dnia pod Zakwaterowanie, od Zameldowania do Wymeldowania, a trasa każdego z tych dni zaczyna się tam.',
  'help.guide.bookings-in-plan.step.4':
    'Na mapie przełącznik na wierszu transportu rysuje jego trasę; Pokaż wszystkie trasy rezerwacji na pasku narzędzi rysuje je wszystkie.',
  'help.guide.bookings-in-plan.step.5':
    'Tworzenie: Dodaj rezerwację na przystanku pod kursorem, Dodaj transport i Transport publiczny w nagłówku dnia oraz zakładki Rezerwacje i Transport po pełną listę z importem i plikami.',
  'help.guide.bookings-in-plan.result':
    'Jedna rezerwacja, jedno miejsce w planie; zakładki to te same rezerwacje jako lista.',
  'help.guide.bookings-in-plan.tip.1':
    'Potwierdzona i Oczekująca to status, który nadajesz rezerwacji; plan pokazuje go na przystanku, a zakładka Rezerwacje liczy oba.',
  'help.guide.bookings-in-plan.tip.2':
    'Transportu z określoną godziną nie da się przeciągnąć; zmień zamiast tego jego godzinę w rezerwacji.',
  // export-plan
  'help.guide.export-plan.title': 'Wyeksportować plan',
  'help.guide.export-plan.goal': 'Zabierz plan ze sobą jako dokument, do kalendarza albo na GPS.',
  'help.guide.export-plan.step.1': 'Kliknij Eksportuj na pasku narzędzi nad dniami.',
  'help.guide.export-plan.step.2':
    'Dokument: PDF otwiera widok wydruku każdego dnia z jego przystankami, notatkami i rezerwacjami; Podział strony dla każdego dnia zaczyna każdy dzień na nowej stronie, a Zapisz jako PDF pobiera go.',
  'help.guide.export-plan.step.3':
    'Kalendarz: Pobierz .ics zapisuje rezerwacje jako plik kalendarza; Subskrybuj kalendarz daje link, który twoja aplikacja kalendarza odświeża sama.',
  'help.guide.export-plan.step.4':
    'Mapy i GPS · GPX: Cała podróż eksportuje miejsca, trasy dni i ślady; Tylko miejsca same pinezki; Dni jako trasy jedną trasę na dzień, do map offline i urządzeń GPS.',
  'help.guide.export-plan.result': 'Plik się pobiera; w podróży nic się nie zmienia.',
  'help.guide.export-plan.tip.1':
    'Pojedynczy dzień idzie do aplikacji map ze swojego paska trasy: Otwórz w Google Maps albo Otwórz w CoMaps.',
  'help.guide.export-plan.tip.2':
    'Subskrybuj kalendarz wymaga włączonej subskrypcji kalendarza w twoich ustawieniach; Panel ma na to poradnik.',
  'help.guide.export-plan.tip.3': 'Eksport to czytanie: może go zrobić każdy członek podróży.',

  // ── Screen: trip-place ────────────────────────────────────────────────────────────────
  'help.ctx.trip-place.title': 'Szczegóły miejsca',
  'help.ctx.trip-place.summary':
    'Karta, która otwiera się nad mapą, gdy wybierzesz miejsce: wszystko, co podróż o nim wie, gwiazdki, które mu wszyscy dali, jego zdjęcie i jego pliki, oraz przyciski, które kładą je w otwartym dniu, na liście albo w aplikacji mapowej.',
  'help.ctx.trip-place.bullet.1':
    'Kliknij wiersz w kolumnie miejsc, przystanek w dniu albo znacznik na mapie, a karta otworzy się nad mapą. Wybór wewnątrz dnia mówi karcie, który przystanek masz na myśli, i właśnie to przynosi ze sobą uczestników przystanku i jego rezerwację.',
  'help.ctx.trip-place.bullet.2':
    'Nagłówek niesie okrągłe zdjęcie, nazwę, kategorię, adres i współrzędne. Kliknij zdjęcie, by użyć własnego, kliknij dwukrotnie nazwę, by zmienić nazwę miejsca od razu, a X po prawej zamyka kartę.',
  'help.ctx.trip-place.bullet.3':
    'Pod tym: cena, jeśli ją ma, gwiazdki, które miejscu dał każdy podróżnik, opis i notatki, oraz Notatki na ten dzień, gdy przystanek je niesie.',
  'help.ctx.trip-place.bullet.4':
    'Dalej idą Godziny otwarcia, Kolor trasy, Statystyki trasy i Pliki, o ile mają zastosowanie. Pliki przyjmują cokolwiek z Twoich folderów i wypisują też to, co wisi na rezerwacji tego przystanku.',
  'help.ctx.trip-place.bullet.5':
    'Wiersz na dole: Dodaj do dnia albo Usuń z dnia, gdy dzień jest otwarty, potem Zapisz w kolekcji, Nawigacja, Otwórz stronę internetową, Edytuj i Usuń.',
  'help.ctx.trip-place.bullet.6':
    'Miejsce wybrane z wyszukiwania niesie to, co wie o nim indeks TREK-a albo OpenStreetMap: zielony pierścień Otwarte albo czerwony Zamknięte wokół zdjęcia, oceniony według zegara samego miejsca, numer telefonu pod gwiazdkami, Godziny otwarcia niżej z godzinami tego dnia w wierszu i całym tygodniem za kliknięciem, oraz jego stronę za Otwórz stronę internetową. Ocena Google pokazuje się tylko przy miejscu znalezionym przez Google, na TREK-u z kluczem Google.',
  // read-place
  'help.guide.read-place.title': 'Co karta mówi Ci o miejscu',
  'help.guide.read-place.goal': 'Przeczytaj wszystko, co podróż wie o jednym miejscu, w jednej karcie.',
  'help.guide.read-place.step.1':
    'W kolumnie dni kliknij przystanek, który chcesz przeczytać. Karta otwiera się nad mapą, a przystanek zostaje zaznaczony w swoim dniu.',
  'help.guide.read-place.step.2':
    'Nagłówek: okrągłe zdjęcie, nazwa, adres i dokładne współrzędne. Zielony pierścień z Otwarte albo czerwony z Zamknięte wokół zdjęcia mówi, czy miejsce jest właśnie teraz otwarte, według jego własnego zegara, gdy tylko TREK zna jego godziny. X po prawej znów zamyka kartę.',
  'help.guide.read-place.step.3':
    'Pod tym gwiazdki, które miejscu dał każdy podróżnik, ze średnią i liczbą głosów. Jeszcze nie oceniono, dopóki nikt nie zagłosował. Zaraz poniżej numer telefonu tam, gdzie miejsce go ma: kliknięcie w niego przekazuje numer Twojej aplikacji telefonu.',
  'help.guide.read-place.step.4':
    'Potem opis, a poniżej notatki. Oba to tekst z formularza miejsca, wyrenderowany: listy, linki i pogrubienie działają.',
  'help.guide.read-place.step.5':
    'Uczestnicy mówią, kto idzie na ten przystanek. Wszyscy są w środku, dopóki kogoś nie wyjmiesz.',
  'help.guide.read-place.step.6':
    'Godziny otwarcia, niżej: wiersz niesie godziny dnia, na który patrzysz, a kliknięcie w niego rozwija cały tydzień z tym dniem pogrubionym. Obok stoją Pliki.',
  'help.guide.read-place.result':
    'Karta zostaje otwarta, dopóki nie zamkniesz jej krzyżykiem albo nie wybierzesz innego miejsca, godziny tygodnia zostają rozwinięte, a przystanek, do którego należy, zostaje zaznaczony w kolumnie dni.',
  'help.guide.read-place.tip.1':
    'Wybrana z kolumny miejsc karta zna miejsce, ale nie przystanek, więc nie pokazuje uczestników ani rezerwacji. Wybierz zamiast tego przystanek w dniu, a jedno i drugie tam jest.',
  'help.guide.read-place.tip.2':
    'Kliknij dwukrotnie nazwę, by zmienić nazwę miejsca bez otwierania formularza. Enter zapisuje, Escape porzuca zmianę.',
  'help.guide.read-place.tip.3':
    'Miejsce wpisane ręcznie nie pokazuje nic z tego: karta zna tylko to, co trzyma jego formularz. Otwórz je przez Edytuj, wybierz je z podpowiedzi pod Szukaj miejsc... i kliknij Aktualizuj, a godziny, numer telefonu i strona przyjdą razem z nim. Ocena Google potrzebuje klucza Google.',
  // rate-place
  'help.guide.rate-place.title': 'Ocenić miejsce',
  'help.guide.rate-place.goal': 'Daj miejscu własne gwiazdki i zobacz, co dali mu wszyscy inni.',
  'help.guide.rate-place.step.1':
    'Otwórz miejsce. Wiersz z gwiazdkami siedzi tuż pod nagłówkiem i niesie średnią dotychczasowych głosów, z ich liczbą w nawiasie.',
  'help.guide.rate-place.step.2':
    'Kliknij gwiazdkę, o którą Ci chodzi. Gwiazdki wypełniają się, gdy przesuwasz się po nich, więc widzisz, co zaraz dasz.',
  'help.guide.rate-place.step.3':
    'Twój głos liczy się do średniej od razu, a twarze obok to ci, którzy zagłosowali. Zatrzymaj wskaźnik na wierszu, by zobaczyć gwiazdki wszystkich.',
  'help.guide.rate-place.step.4':
    'Ta sama średnia siedzi w wierszu miejsca w kolumnie miejsc, więc te dobre wyróżniają się na liście.',
  'help.guide.rate-place.result':
    'Twoje gwiazdki są na miejscu na oczach całej podróży, a gwiazdka Filtruj według oceny w wierszu filtrów nad listą umie teraz zostawić tylko miejsca, które sięgają progu.',
  'help.guide.rate-place.tip.1':
    'Oceniać może każdy podróżnik, nawet w podróży, gdzie prawo Zarządzanie miejscami ma tylko część z Was.',
  'help.guide.rate-place.tip.2':
    'Kliknij gwiazdkę, którą już dałeś, by cofnąć swój głos. Gdy nie zostanie nikt głosujący, na miejscu znów widnieje Jeszcze nie oceniono.',
  'help.guide.rate-place.tip.3':
    'Obok gwiazdek mieści się jako twarze do sześciu głosujących; dymek wymienia ich wszystkich i zaznacza Twój głos.',
  // place-image
  'help.guide.place-image.title': 'Dać miejscu własne zdjęcie',
  'help.guide.place-image.goal': 'Zastąp automatyczną miniaturę własnym zdjęciem.',
  'help.guide.place-image.step.1': 'Otwórz miejsce z kolumny miejsc.',
  'help.guide.place-image.step.2':
    'Zatrzymaj wskaźnik na okrągłym zdjęciu w nagłówku: pojawia się aparat, a w dymku widnieje Prześlij zdjęcie. Kliknij go i wybierz swój plik.',
  'help.guide.place-image.step.3': 'Nagłówek pokazuje teraz Twoje zdjęcie, z małym czerwonym krzyżykiem w rogu.',
  'help.guide.place-image.step.4':
    'To samo zdjęcie jest w wierszu miejsca w kolumnie miejsc i na jego znaczniku na mapie.',
  'help.guide.place-image.result':
    'Twoje zdjęcie jest zdjęciem miejsca wszędzie: na karcie, w kolumnie miejsc, na przystanku w dniu, na znaczniku na mapie i w udostępnionej podróży.',
  'help.guide.place-image.tip.1':
    'Przyjmowane są JPG, PNG, GIF i WebP, a HEIC z iPhone’a konwertuje się po drodze do środka.',
  'help.guide.place-image.tip.2':
    'Krzyżyk w rogu znów usuwa Twoje zdjęcie i wraca to automatyczne. Samo miejsce zostaje nietknięte.',
  'help.guide.place-image.tip.3':
    'Bez własnego zdjęcia TREK wyszukuje jakieś po współrzędnych miejsca, a w ostateczności sięga po ikonę kategorii.',
  // place-day-assign
  'help.guide.place-day-assign.title': 'Położyć miejsce w otwartym dniu albo je stamtąd zdjąć',
  'help.guide.place-day-assign.goal': 'Użyj własnego przycisku karty zamiast przeciągać wiersz przez planer.',
  'help.guide.place-day-assign.step.1':
    'Kliknij nagłówek dnia w kolumnie dni. Ten dzień jest teraz otwarty i karta pracuje względem niego.',
  'help.guide.place-day-assign.step.2':
    'Kliknij w kolumnie miejsc miejsce, którego nie ma w tym dniu. Jego karta otwiera się, a wiersz na dole proponuje Dodaj do dnia.',
  'help.guide.place-day-assign.step.3':
    'Kliknij Dodaj do dnia. Przystanek ląduje na końcu dnia, a przycisk zmienia się w Usuń z dnia.',
  'help.guide.place-day-assign.step.4':
    'Przystanek jest teraz w dniu, ostatni na liście. Przeciągnij go w górę tam, gdzie pasuje.',
  'help.guide.place-day-assign.step.5':
    'Usuń z dnia znów zdejmuje ten przystanek z dnia, a karta jeszcze raz proponuje Dodaj do dnia.',
  'help.guide.place-day-assign.result':
    'Dzień niesie przystanek albo już go nie niesie, a samo miejsce tak czy inaczej zostaje nietknięte.',
  'help.guide.place-day-assign.tip.1':
    'Przycisk istnieje tylko wtedy, gdy dzień jest otwarty. Bez niego karta nie ma do czego dodać miejsca.',
  'help.guide.place-day-assign.tip.2':
    'Zdjęcie przystanku z dnia zostawia miejsce w podróży i w kolumnie miejsc. Wszędzie usuwa je dopiero Usuń.',
  'help.guide.place-day-assign.tip.3':
    'Przystanek, który położyła w dniu rezerwacja noclegu, nie proponuje żadnego z przycisków: tę noc dodaje się i usuwa w bloku Zakwaterowanie tego dnia.',
  // place-participants
  'help.guide.place-participants.title': 'Powiedzieć, kto idzie na ten przystanek',
  'help.guide.place-participants.goal': 'Podziel grupę na jeden przystanek, nie dzieląc podróży.',
  'help.guide.place-participants.step.1':
    'Kliknij przystanek w dniu. Karta otwiera się, a Uczestnicy wypisują wszystkich w podróży.',
  'help.guide.place-participants.step.2':
    'Kliknij plakietkę podróżnika, by wyjąć go z tego przystanku. Imię jest przekreślone, gdy najeżdżasz na nie wskaźnikiem.',
  'help.guide.place-participants.step.3':
    'Gdy tylko kogoś brakuje, pojawia się przerywany +. Kliknij go, by zobaczyć, kogo nie ma na przystanku.',
  'help.guide.place-participants.step.4':
    'Kliknij imię, by wstawić kogoś z powrotem. Gdy wszyscy są z powrotem w środku, przystanek znów należy do całej grupy.',
  'help.guide.place-participants.result':
    'Przystanek niesie podróżników, których wybrałeś, a reszta grupy ma to popołudnie dla siebie.',
  'help.guide.place-participants.tip.1':
    'Uczestnicy pojawiają się tylko z wybranym przystankiem, więc wybieraj miejsce w dniu, a nie w kolumnie miejsc, i tylko w podróży z więcej niż jednym podróżnikiem.',
  'help.guide.place-participants.tip.2':
    'Nikt wybrany znaczy, że idą wszyscy, i dlatego ostatniego podróżnika, który został na przystanku, nie da się wyjąć.',
  'help.guide.place-participants.tip.3': 'Gość, który nie ma własnego konta, może być uczestnikiem jak każdy inny.',
  // place-booking
  'help.guide.place-booking.title': 'Rezerwacja na przystanku',
  'help.guide.place-booking.goal':
    'Przeczytaj rezerwację, która należy do przystanku, otwórz ją i przypnij do niego nową.',
  'help.guide.place-booking.step.1':
    'Otwórz przystanek, do którego należy rezerwacja. Karta pokazuje pasek z Potwierdzona albo Oczekująca i z nazwą rezerwacji.',
  'help.guide.place-booking.step.2':
    'Na pasku są Data, Godzina i Kod rezerwacji oraz wszelkie notatki, które rezerwacja ma.',
  'help.guide.place-booking.step.3': 'Kliknij pasek. Otwiera się na nim własny formularz rezerwacji.',
  'help.guide.place-booking.step.4':
    'To Przypisz do miejsca przypina rezerwację do przystanku, a tutaj już wskazuje ten jeden. Zamknij formularz z powrotem.',
  'help.guide.place-booking.step.5':
    'Nowa rezerwacja dla przystanku zaczyna się w kolumnie dni: najedź na przystanek i kliknij + na jego końcu. Formularz otwiera się jako Nowa rezerwacja, już z nim powiązany.',
  'help.guide.place-booking.result':
    'Rezerwacja wisi na przystanku: jest na karcie, jest w dniu, a jej pliki są wypisane także tutaj pod Pliki.',
  'help.guide.place-booking.tip.1':
    'Pasek pokazuje się tylko przy przystanku, do którego rezerwacja jest przypięta. Rezerwacja bez przystanku żyje w zakładce Rezerwacje.',
  'help.guide.place-booking.tip.2':
    'Jeden przystanek może dzielić kilka rezerwacji: obiad i wycieczka, która rusza spod tych samych drzwi.',
  'help.guide.place-booking.tip.3':
    'Pociąg, lot albo prom otwierają zamiast tego formularz transportu, ten, którego używa zakładka Transport.',
  // place-files
  'help.guide.place-files.title': 'Trzymać bilety miejsca przy miejscu',
  'help.guide.place-files.goal': 'Połóż bilet, voucher albo mapę dla miejsca tam, gdzie będziesz ich szukać.',
  'help.guide.place-files.step.1':
    'Otwórz miejsce. Pliki siedzą u dołu karty i widnieje na nich napis Pliki, dopóki miejsce żadnych nie ma.',
  'help.guide.place-files.step.2': 'Kliknij obok Prześlij i wybierz plik.',
  'help.guide.place-files.step.3': 'Przycisk liczy, co miejsce trzyma, a lista otwiera się sama.',
  'help.guide.place-files.step.4': 'Każdy wiersz to nazwa pliku z jego rozmiarem. Kliknij go, by otworzyć plik.',
  'help.guide.place-files.result': 'Plik siedzi na miejscu, policzony w karcie, i jest też w zakładce Pliki podróży.',
  'help.guide.place-files.tip.1':
    'Pliki wypisują też to, co wisi na rezerwacji tego przystanku, więc potwierdzenie hotelu pokazuje się przy hotelu.',
  'help.guide.place-files.tip.2': 'Prześlij przyjmuje kilka plików naraz.',
  'help.guide.place-files.tip.3':
    'Bez prawa Przesyłanie plików przycisku Prześlij nie ma; pliki, które już są na miejscu, wciąż są.',
  // place-navigation
  'help.guide.place-navigation.title': 'Otworzyć miejsce w aplikacji mapowej albo na jego stronie',
  'help.guide.place-navigation.goal': 'Przekaż miejsce aplikacji, która naprawdę Cię tam zaprowadzi.',
  'help.guide.place-navigation.step.1': 'Otwórz miejsce i kliknij Nawigacja w wierszu na dole.',
  'help.guide.place-navigation.step.2':
    'Lista to aplikacje mapowe, które pasują do tego miejsca: Google Maps, Waze, Apple Maps, OpenStreetMap i CoMaps.',
  'help.guide.place-navigation.step.3':
    'Kliknij tę, której używasz. TREK przekazuje jej, gdzie może, samo miejsce, a nie tylko parę współrzędnych, więc lądujesz przy właściwym wejściu.',
  'help.guide.place-navigation.step.4':
    'Otwórz stronę internetową obok otwiera w nowej karcie własną stronę miejsca, jego godziny i jego bilety.',
  'help.guide.place-navigation.result':
    'Aplikacja mapowa otwiera się na miejscu, strona w osobnej karcie, a w podróży nic się nie zmienia.',
  'help.guide.place-navigation.tip.1':
    'Waze zaczyna nawigować od razu. Pozostałe otwierają miejsce, a start stamtąd to jedno dotknięcie więcej.',
  'help.guide.place-navigation.tip.2':
    'To, które aplikacje są proponowane, zależy od miejsca i od Twojego urządzenia: Apple Maps odpada na Androidzie, 高德地图 wychodzi tylko przy miejscu w Chinach, a Waze, Apple Maps i CoMaps potrzebują współrzędnych miejsca.',
  'help.guide.place-navigation.tip.3':
    'Gdy pasuje tylko jedna aplikacja, przycisk niesie jej nazwę i otwiera ją od razu.',
  // place-to-collection
  'help.guide.place-to-collection.title': 'Zapisać miejsce na jednej ze swoich list',
  'help.guide.place-to-collection.goal': 'Zachowaj miejsce, które znalazłeś w tej podróży, na następną.',
  'help.guide.place-to-collection.step.1': 'Otwórz miejsce i kliknij Zapisz w kolekcji na dole karty.',
  'help.guide.place-to-collection.step.2':
    'Zapisz na liście pokazuje każdą listę, którą masz albo współdzielisz. Ptaszek zaznacza te, które to miejsce już trzymają.',
  'help.guide.place-to-collection.step.3': 'Kliknij listę. Miejsce jest w niej od razu.',
  'help.guide.place-to-collection.step.4': 'Zamknij, a na przycisku w karcie widnieje Zapisano.',
  'help.guide.place-to-collection.result':
    'Miejsce jest na Twojej liście ze swoim zdjęciem, swoimi notatkami i swoim adresem, gotowe na następną podróż.',
  'help.guide.place-to-collection.tip.1':
    'Przycisk jest tam tylko wtedy, gdy dodatek Kolekcje jest włączony, co administrator włącza w Dodatki.',
  'help.guide.place-to-collection.tip.2':
    'Miejsce może siedzieć na kilku listach naraz, na każdej z własnym statusem: na jednej Pomysł, na drugiej Odwiedzone.',
  'help.guide.place-to-collection.tip.3':
    'Oznacz jako odwiedzone, obok nazwy miejsca w wyborze, odhacza je na liście; gdy miejsce jest na kilku Twoich listach, na etykiecie widnieje Odwiedzone wszędzie i załatwia je wszystkie naraz.',
  // place-track
  'help.guide.place-track.title': 'Odczytać trasę i dać jej własny kolor',
  'help.guide.place-track.goal':
    'Zobacz, jak długi jest zaimportowany spacer, i odróżnij jego linię od pozostałych na mapie.',
  'help.guide.place-track.step.1':
    'Wiersz trasy w kolumnie miejsc niesie krótką kreskę w kolorze, w którym rysowana jest jej linia. Kliknij go.',
  'help.guide.place-track.step.2': 'Statystyki trasy podają długość ścieżki, w jednostce odległości, którą ustawiłeś.',
  'help.guide.place-track.step.3': 'Kolor trasy nad tym pokazuje kolor w użyciu. Kliknij wiersz, by otworzyć próbki.',
  'help.guide.place-track.step.4': 'Wybierz kolor. Linia na mapie i kreska w wierszu zmieniają się razem z nim.',
  'help.guide.place-track.step.5':
    'Przerywana komórka po lewej, Kolor automatyczny, oddaje trasie kolor, który dziedziczy; pipeta po prawej, Wybierz własny kolor, otwiera dla czegokolwiek innego systemowy wybór kolorów.',
  'help.guide.place-track.result':
    'Trasa jest rysowana w kolorze, który wybrałeś, w karcie, w swoim wierszu w kolumnie miejsc i na mapie.',
  'help.guide.place-track.tip.1':
    'Tylko miejsce, które niesie ścieżkę, zaimportowaną z pliku GPX, KML albo KMZ, ma te dwa bloki.',
  'help.guide.place-track.tip.2':
    'Trasa nagrana z wysokościami pokazuje też swój najwyższy i najniższy punkt, metry w górę i w dół oraz profil spaceru.',
  'help.guide.place-track.tip.3':
    'Import daje każdej trasie, którą wnosi, własny kolor, więc dwa spacery nigdy nie przychodzą w tym samym.',
  // read-place
  'help.guide.read-place.step.7':
    'W wierszu na dole jest to, co możesz stąd zrobić: zdjąć miejsce z otwartego dnia albo je tam położyć, zapisać je na liście, otworzyć w aplikacji mapowej, edytować albo usunąć.',

  // ── Screen: trip-files ────────────────────────────────────────────────────────────────
  'help.ctx.trip-files.title': 'Pliki',
  'help.ctx.trip-files.summary':
    'Każdy dokument podróży na jednej liście: bilety, potwierdzenia, karty do portfela i zdjęcia, każdy z notatką, z powiązaniem do miejsca albo rezerwacji, do której należy, i z koszem, z którego może wrócić.',
  'help.ctx.trip-files.bullet.1':
    'Przeciągnij pliki tutaj u góry przyjmuje pliki; kliknięcie pola otwiera wybór plików. Wiersz pod nim wypisuje typy plików, które ten TREK przyjmuje, i limit 50 MB na plik.',
  'help.ctx.trip-files.bullet.2':
    'Zakładki mówią, co pokazuje lista: Wszystkie, PDF, Obrazki i Dokumenty, każda ze swoją liczbą. Gwiazdka dołącza do nich, gdy tylko jakiś plik zostanie oznaczony, a Wspólne notatki, gdy tylko notatka niesie załącznik.',
  'help.ctx.trip-files.bullet.3':
    'Wiersz niesie, kto go przesłał, nazwę, notatkę pod nią, rozmiar i datę, oraz po jednej plakietce na powiązanie: Plan dni i miejsce, Rezerwacje albo Transport i rezerwację, Z wspólnych notatek.',
  'help.ctx.trip-files.bullet.4':
    'Na końcu wiersza siedzą Oznacz, Przypisz, Otwórz, Pobierz i Usuń. Usuń nie pyta: plik trafia do kosza, skąd można go przywrócić.',
  'help.ctx.trip-files.bullet.5':
    'Obrazek albo wideo otwiera się na pełnym ekranie, ze strzałkami na klawiaturze i paskiem miniatur; każdy inny dokument otwiera się w podglądzie na stronie, z Otwórz w nowej karcie i Pobierz. Karta do portfela pobiera się od razu.',
  'help.ctx.trip-files.bullet.6':
    'Kosz na prawym końcu przełącza listę na usunięte pliki, gdzie każdy zostaje przywrócony albo usunięty na dobre, a Opróżnij kosz czyści je wszystkie. Tam, gdzie administrator podłączył magazyn dokumentów, obok siedzi Synchronizacja dokumentów.',
  // files-upload
  'help.guide.files-upload.title': 'Włożyć dokument do podróży',
  'help.guide.files-upload.goal':
    'Wyciągnij bilet, potwierdzenie albo zdjęcie z folderu pobranych i wstaw je do podróży, gdzie dosięgnie ich każdy, kto w niej jest.',
  'help.guide.files-upload.step.1':
    'Otwórz podróż i kliknij Pliki na pasku zakładek. Wypisane są tam dokumenty podróży, a nad nimi pole przesyłania.',
  'help.guide.files-upload.step.2':
    'Kliknij Przeciągnij pliki tutaj i wybierz jeden lub kilka plików. Przesyłają się jeden po drugim, a pole w tym czasie pokazuje Przesyłanie... Wiersz pod polem mówi, jakie typy przyjmuje ten TREK i że plik może mieć najwyżej 50 MB.',
  'help.guide.files-upload.step.3':
    'Gdy tylko ostatni plik jest na górze, sam otwiera się dla niego Przypisz plik. Dodaj notatkę... daje plikowi własny wiersz, a listy pod nim wiążą go z miejscem albo rezerwacją. Zamknij je ×; zamknięcie niczego nie traci.',
  'help.guide.files-upload.step.4':
    'Nowe pliki stoją na górze listy. Wiersz pokazuje, kto go przesłał, nazwę, rozmiar i datę; obrazek dostaje miniaturę, każdy inny plik swój typ.',
  'help.guide.files-upload.result': 'Dokumenty są w podróży, a każdy, kto widzi podróż, może je otworzyć i pobrać.',
  'help.guide.files-upload.tip.1':
    'Plik można też przeciągnąć z pulpitu prosto na pole, które podświetla się, póki plik jest nad nim.',
  'help.guide.files-upload.tip.2':
    'Obrazek ze schowka trafia na listę przez Ctrl+V, więc zrzutu ekranu z rezerwacją nie trzeba najpierw zapisywać.',
  'help.guide.files-upload.tip.3':
    'Przesyłanie wymaga prawa Przesyłanie plików; bez niego pola w ogóle nie ma. Typ, którego nie ma na liście, zostaje odrzucony z komunikatem i nic się nie przesyła. Plik powyżej 50 MB odrzuca samo pole, zanim cokolwiek zostanie wysłane.',
  // files-link
  'help.guide.files-link.title': 'Powiązać dokument z miejscem albo rezerwacją',
  'help.guide.files-link.goal': 'Spraw, by bilet dało się znaleźć z dnia, do którego należy, a nie tylko z tej listy.',
  'help.guide.files-link.step.1':
    'Kliknij Przypisz, ołówek na końcu wiersza. Otwiera się Przypisz plik, nazwany po pliku.',
  'help.guide.files-link.step.2':
    'Pod Notatka Dodaj notatkę... przyjmuje jeden wiersz, który potem stoi pod nazwą pliku na liście. Zapisuje się w chwili, gdy opuszczasz pole.',
  'help.guide.files-link.step.3':
    'Pod Miejsce stoją miejsca podróży, pogrupowane według dnia, w którym są, a na końcu Nieprzypisane dla tych, które nie są w żadnym dniu. Kliknij jedno, a dostanie ptaszka.',
  'help.guide.files-link.step.4':
    'Pod Rezerwacja i Transport stoją rezerwacje podróży. Kliknij tę, do której należy dokument; ona też dostaje swojego ptaszka.',
  'help.guide.files-link.step.5':
    'Zamknij ×. Nie ma tu przycisku zapisu: każde kliknięcie zostało zapisane w chwili, gdy je zrobiłeś.',
  'help.guide.files-link.result':
    'Wiersz niesie notatkę i po jednej plakietce na powiązanie, Plan dni i nazwę miejsca, Transport i nazwę lotu, a dokument wisi także na miejscu i na locie.',
  'help.guide.files-link.tip.1':
    'Plik może trzymać kilka powiązań naraz, więc to samo potwierdzenie należy do hotelu i do nocy, którą obejmuje.',
  'help.guide.files-link.tip.2': 'Ponowne kliknięcie zaznaczonej pozycji zabiera to powiązanie; sam plik zostaje.',
  'help.guide.files-link.tip.3':
    'Działa to też w drugą stronę: dokument dołączony do miejsca albo do rezerwacji jest też na tej liście, z tą samą plakietką w swoim wierszu.',
  // files-star
  'help.guide.files-star.title': 'Trzymać ważne dokumenty na górze',
  'help.guide.files-star.goal':
    'Wyciągnij te dwa czy trzy papiery, których naprawdę będziesz potrzebować, z listy rosnącej przez całą podróż.',
  'help.guide.files-star.step.1':
    'Kliknij Oznacz na końcu wiersza. Wypełnia się na żółto, przed nazwą pliku pojawia się druga gwiazdka, a przycisk brzmi teraz Usuń oznaczenie.',
  'help.guide.files-star.step.2':
    'Lista sortuje się na nowo: oznaczone pliki stoją nad wszystkimi innymi, a w każdej grupie najnowsze na początku.',
  'help.guide.files-star.step.3':
    'Do zakładek u góry dołączyła gwiazdka, z liczbą oznaczonych plików obok. Kliknij ją, by zobaczyć tylko je.',
  'help.guide.files-star.result':
    'Papiery, których potrzebujesz przy okienku, stoją na górze listy, a jedna zakładka nie pokazuje nic innego.',
  'help.guide.files-star.tip.1':
    'Zakładka z gwiazdką istnieje tylko wtedy, gdy coś jest oznaczone. Usuń oznaczenie ostatniego pliku, a zakładka zniknie razem z nim.',
  'help.guide.files-star.tip.2':
    'Oznaczanie liczy się jako edycja: członek, który może tylko czytać pliki podróży, widzi gwiazdki, ale nie może ich ustawiać.',
  // files-filter
  'help.guide.files-filter.title': 'Znaleźć dokument na liście',
  'help.guide.files-filter.goal': 'Zawęź listę wszystkiego do jednego rodzaju papieru, którego szukasz.',
  'help.guide.files-filter.step.1':
    'Zakładki nad listą to Wszystkie, PDF, Obrazki i Dokumenty, każda z liczbą plików obok.',
  'help.guide.files-filter.step.2': 'Kliknij PDF: lista zostawia pliki PDF i nic więcej.',
  'help.guide.files-filter.step.3':
    'Dwie kolejne zakładki przychodzą i odchodzą wraz z tym, co jest w podróży. Kliknij Wspólne notatki, która jest tam, gdy tylko notatka w zakładce Współpraca niesie załącznik: lista zostawia te pliki i nic więcej. Tak samo dołącza do rzędu gwiazdka, gdy tylko jakiś plik zostanie oznaczony.',
  'help.guide.files-filter.step.4': 'Wszystkie przywracają całą listę.',
  'help.guide.files-filter.result':
    'Lista pokazuje tylko to, co nazywa zakładka, a liczba na każdej zakładce mówi, ile tego jest.',
  'help.guide.files-filter.tip.1':
    'Nie ma tu folderów ani zmiany nazw: dokument porządkują notatka w Przypisz plik, powiązania z miejscami i rezerwacjami oraz gwiazdka.',
  'help.guide.files-filter.tip.2':
    'Sama lista zawsze idzie najpierw według gwiazdki, potem od najnowszych, więc dokument przesłany dziś stoi nad tym z zeszłego miesiąca.',
  // files-preview
  'help.guide.files-preview.title': 'Przeczytać dokument bez wychodzenia z TREK-a',
  'help.guide.files-preview.goal':
    'Obejrzyj bilet albo zdjęcie na miejscu i przenieś je na własny komputer, gdy są tam potrzebne.',
  'help.guide.files-preview.step.1':
    'Kliknij nazwę obrazka albo jego miniaturę. Otwiera się na pełnym ekranie, z nazwą pliku i jego miejscem wśród obrazków w nagłówku.',
  'help.guide.files-preview.step.2':
    'Okrągłe strzałki po bokach, strzałki w lewo i w prawo na klawiaturze oraz pasek miniatur na dole przechodzą przez każdy obrazek, który lista właśnie pokazuje.',
  'help.guide.files-preview.step.3':
    'Otwórz w nowej karcie i Pobierz siedzą w nagłówku; × albo Escape znów zamyka obrazek.',
  'help.guide.files-preview.step.4':
    'Dokument, który nie jest obrazkiem, otwiera się zamiast tego w podglądzie na stronie, z tymi samymi dwoma przyciskami w nagłówku. Ten zamyka się na × albo na kliknięcie obok niego.',
  'help.guide.files-preview.step.5':
    'Pobierz na końcu wiersza zapisuje plik prosto na Twój komputer, bez otwierania czegokolwiek wcześniej.',
  'help.guide.files-preview.result':
    'Dokument jest na ekranie, a te same dwa przyciski wkładają go do karty przeglądarki albo na Twój dysk.',
  'help.guide.files-preview.tip.1': 'Na ekranie dotykowym przesuwasz palcem przez obrazki, zamiast klikać strzałki.',
  'help.guide.files-preview.tip.2':
    'Karta do portfela nigdy nie otwiera podglądu: pobiera się od razu, żeby telefon mógł ją podać aplikacji portfela.',
  'help.guide.files-preview.tip.3':
    'Otwórz w nowej karcie i Pobierz pobierają plik z Twoją sesją, więc link skopiowany z paska adresu nie przyda się nikomu innemu.',
  // files-trash
  'help.guide.files-trash.title': 'Wyrzucić dokument i odzyskać go',
  'help.guide.files-trash.goal':
    'Uprzątnij to, czego podróż już nie potrzebuje, nie tracąc niczego, co jednak było potrzebne.',
  'help.guide.files-trash.step.1':
    'Kliknij Usuń na końcu wiersza. Plik od razu opuszcza listę, a komunikat brzmi Przeniesiono do kosza. Nic wcześniej nie pyta.',
  'help.guide.files-trash.step.2':
    'Kosz na prawym końcu paska narzędzi przełącza listę na to, co zostało wyrzucone. Nagłówek brzmi Kosz, a zakładek filtrów nie ma.',
  'help.guide.files-trash.step.3':
    'Wyrzucony wiersz jest wyszarzony i zostały mu dwa przyciski: Przywróć, który oddaje plik, i Usuń, który po pytaniu usuwa go na dobre.',
  'help.guide.files-trash.step.4':
    'Kliknij Przywróć. Komunikat brzmi Plik został przywrócony, a wiersz opuszcza kosz, wciąż ze swoją notatką i powiązaniami.',
  'help.guide.files-trash.step.5':
    'Opróżnij kosz u góry kasuje na dobre wszystko, co tu jeszcze jest, a przeglądarka pyta raz, zanim to zrobi. Kosz przełącza z powrotem na pliki.',
  'help.guide.files-trash.result': 'Plik jest z powrotem na liście tam, gdzie był, jak gdyby nic się nie stało.',
  'help.guide.files-trash.tip.1':
    'Usuń w wierszu wcześniej nie pyta i po to właśnie jest kosz: nic nie opuszcza TREK-a, dopóki nie powiesz tego tutaj.',
  'help.guide.files-trash.tip.2':
    'Wyrzucenie pliku i odzyskanie go wymaga prawa Usuwanie plików. Członek bez niego nie widzi ani Usuń w wierszu, ani przycisków w koszu.',
  'help.guide.files-trash.tip.3': 'Pliku usuniętego na dobre w koszu nie da się już przywrócić.',
  // files-sync
  'help.guide.files-sync.title': 'Trzymać dokumenty w zgodzie z Twoim magazynem dokumentów',
  'help.guide.files-sync.goal':
    'Zwiąż podróż z Twoim własnym magazynem dokumentów, tak by to, co przesłane tutaj, lądowało tam, a to, co odłożone tam, pojawiało się tutaj.',
  'help.guide.files-sync.step.1':
    'Kliknij Synchronizacja dokumentów, obok Kosz na prawym końcu paska narzędzi. Okno otwiera się z nazwą podróży pod swoim tytułem. Po lewej, pod Połącz dostawcę, stoją magazyny, które włączył administrator, każdy z wierszem o tym, jak przechowuje pliki: Paperless-ngx i Papra tagami, Nextcloud i Synology Drive w folderze, OpenCloud w przestrzeni. Po prawej stoi Nic jeszcze nie połączono.',
  'help.guide.files-sync.step.2':
    'Kliknij swój magazyn, tutaj Nextcloud. Otwiera się mniejsze okno dla połączenia, nazwane po magazynie, i prosi o dane, którymi logujesz się do tego magazynu.',
  'help.guide.files-sync.step.3':
    'Wypełnij Adres i dane logowania właściwe dla magazynu: Token API dla Paperless-ngx, Klucz API i Identyfikator organizacji dla Papra, Nazwa użytkownika i Hasło aplikacji dla Nextcloud, Nazwa użytkownika i Token aplikacji dla OpenCloud, a dla Synology Drive Nazwa użytkownika, Hasło i, jeśli konto tego wymaga, Kod dwuskładnikowy. Używaj hasła aplikacji lub tokenu wszędzie, gdzie magazyn je oferuje, nigdy hasła do konta. Nextcloud i Synology Drive przyjmują też opcjonalny Folder bazowy, w którym TREK szuka folderów podróży, tutaj /Reisen. Zezwalaj na certyfikat z własnym podpisem na dole jest tylko dla magazynu w Twojej własnej sieci z takim certyfikatem.',
  'help.guide.files-sync.step.4':
    'Kliknij Testuj połączenie. TREK dociera do magazynu z tym, co wpisałeś, a stopka brzmi Połączono, zalogowano jako i dalej nazwa konta. Odrzucone dane logowania albo nieosiągalny adres są tam nazwane zamiast tego, a w obu przypadkach nic nie jest zapisywane.',
  'help.guide.files-sync.step.5':
    'Kliknij Połącz. Połączenie jest zapisywane z podróżą, a TREK pyta, gdzie podróż ma się znaleźć w magazynie: tag, folder lub przestrzeń, które trzymają jej dokumenty. Synchronizowane jest tylko to, co jest w środku. Utwórz nowe miejsce tworzy je po kliknięciu Utwórz, z nazwą wstępnie wypełnioną z tytułu podróży; pod Albo użyj istniejącego stoją te, które już tam są. Kliknij jedno z nich, tutaj folder Autumn in Japan.',
  'help.guide.files-sync.step.6':
    'Okno jest z powrotem: Twój magazyn stoi pod Ta podróż po lewej, a jego karta po prawej niesie, dokąd synchronizuje, kiedy ostatnio działał, i Synchronizuj teraz. Pierwszy przebieg startuje sam; Synchronizuj teraz uruchamia jeden, kiedy chcesz. Gdy przebieg się skończy, plakietka Jeszcze nie synchronizowano obok nazwy ustępuje zielonej kropce, Aktualne, gdy na nią wskażesz, a pasek przepływu liczy dokumenty, które trzymają TREK i magazyn każdy z osobna, z pasami Do repozytorium i Z repozytorium między nimi. Zamknij okno krzyżykiem ×.',
  'help.guide.files-sync.result':
    'Dokumenty, które już tam były, stoją na górze listy, przesłane w Twoim imieniu, a każdy dokument podróży jest też w magazynie. Od tej chwili TREK sprawdza magazyn w tle, a magazyn podąża za listą.',
  'help.guide.files-sync.tip.1':
    'Tylko właściciel podróży albo administrator instancji może związać podróż, bo dane logowania sięgają całego tego konta w magazynie. Każdy członek może otworzyć Synchronizacja dokumentów, przeczytać kartę i nacisnąć Synchronizuj teraz.',
  'help.guide.files-sync.tip.2':
    'Magazyn w Twojej własnej sieci potrzebuje ALLOW_INTERNAL_NETWORK=true na serwerze TREK-a, a jego adres musi być adresem maszyny w sieci, nigdy localhost. Bez tego Testuj połączenie odpowiada Ten adres jest niedozwolony.',
  'help.guide.files-sync.tip.3':
    'Rozłącz na karcie kończy parowanie i zachowuje każdy dokument po obu stronach. Tag, folder lub przestrzeń związane drugi raz są traktowane jak nowe i wszystko w nich wchodzi ponownie, więc po Rozłącz zwiąż raczej puste miejsce niż stare.',

  // ── Screen: trip-day-detail ───────────────────────────────────────────────────────────
  'help.ctx.trip-day-detail.title': 'Szczegóły dnia',
  'help.ctx.trip-day-detail.summary':
    'Panel, który nagłówek dnia otwiera nad mapą: dzień jako całość, jego nazwa i data, pogoda tam, gdzie będziesz, rezerwacje, które na niego przypadają, i noce na niego zarezerwowane.',
  'help.ctx.trip-day-detail.bullet.1':
    'Kliknij nagłówek dnia w kolumnie dni, a panel otworzy się nad środkiem mapy. Ten sam nagłówek jeszcze raz albo X po jego prawej zamyka go i puszcza dzień.',
  'help.ctx.trip-day-detail.bullet.2':
    'Nagłówek niesie nazwę dnia i jego datę. Ołówek obok nazwy zmienia nazwę dnia, podwójna strzałka zwija panel do wąskiego paska, żeby mapa znowu była wolna.',
  'help.ctx.trip-day-detail.bullet.3':
    'Na górze pogoda dnia. Prognoza dla nazywa miejsce, którego dotyczy: pierwszy przystanek dnia albo hotel, w którym się budzisz.',
  'help.ctx.trip-day-detail.bullet.4':
    'Rezerwacje wypisują rezerwacje tego dnia, każdą z jej rodzajem, przystankiem, do którego należy, i godzinami. Zielony znaczy potwierdzona, bursztynowy jeszcze oczekująca; to tylko odczyt, rezerwacje zmienia się w zakładce Rezerwacje.',
  'help.ctx.trip-day-detail.bullet.5':
    'Zakwaterowanie pokazuje każdą noc zarezerwowaną na ten dzień, z Zameldowanie i Wymeldowanie w dniach, w których wypadają, z oknem zameldowania, godziną wymeldowania i numerem potwierdzenia.',
  'help.ctx.trip-day-detail.bullet.6':
    'Dodaj zakwaterowanie rezerwuje noc na tym dniu: wybierz obiekt z miejsc podróży, powiedz, które dni obejmuje, i dodaj godziny oraz kod.',
  // day-panel
  'help.guide.day-panel.title': 'Otworzyć dzień i przeczytać jego szczegóły',
  'help.guide.day-panel.goal':
    'Zobaczyć jeden dzień w całości, jego pogodę, jego rezerwacje i gdzie śpisz, bez opuszczania mapy.',
  'help.guide.day-panel.step.1':
    'Kliknij nagłówek dnia w kolumnie dni. Dzień jest wybrany, a jego szczegóły otwierają się nad środkiem mapy.',
  'help.guide.day-panel.step.2': 'Nagłówek nazywa dzień, Dzień 1, dopóki nie nadasz mu nazwy, z datą pod spodem.',
  'help.guide.day-panel.step.3':
    'Na górze pogoda dnia. Prognoza dla mówi, którego miejsca dotyczy: pierwszego przystanku dnia albo hotelu, w którym się budzisz.',
  'help.guide.day-panel.step.4':
    'Rezerwacje pod nią wypisują rezerwacje, które przypadają na ten dzień, z ich godzinami.',
  'help.guide.day-panel.step.5':
    'Zakwaterowanie pokazuje noce zarezerwowane na ten dzień, z Zameldowanie i Wymeldowanie w dniach, w których wypadają.',
  'help.guide.day-panel.step.6':
    'Podwójna strzałka w nagłówku zwija panel do wąskiego paska. X obok niej zamyka panel i puszcza dzień.',
  'help.guide.day-panel.result':
    'Zwinięty do paska panel zostawia mapę wolną i trzyma dzień wybrany; zamknięty, dzień jest odznaczony, a plan jest jak wcześniej.',
  'help.guide.day-panel.tip.1':
    'Kliknięcie gdziekolwiek na pasku nagłówka panelu też go zwija. Strzałka jest tylko przyciskiem do tego.',
  'help.guide.day-panel.tip.2':
    'Otwarcie miejsca z kolumny miejsc wstawia szczegóły miejsca w miejsce panelu. Zamknij je, a dzień wraca.',
  // day-weather
  'help.guide.day-weather.title': 'Odczytać pogodę dnia',
  'help.guide.day-weather.goal': 'Wiedzieć, jaki będzie dzień tam, gdzie tego dnia naprawdę jesteś.',
  'help.guide.day-weather.step.1':
    'Prognoza dla nazywa miejsce, którego dotyczą liczby: pierwszy przystanek dnia albo, w dniu bez niego, hotel, w którym się budzisz.',
  'help.guide.day-weather.step.2':
    'Duża liczba to temperatura dnia, obok niej minimum i maksimum, i stan pogody słowami.',
  'help.guide.day-weather.step.3':
    'Kafelki pod nią: prawdopodobieństwo opadów, ile ich będzie, najsilniejszy wiatr oraz wschód i zachód słońca.',
  'help.guide.day-weather.step.4':
    'Na dole dzień godzina po godzinie, co drugą godzinę: godzina, ikona, temperatura i prawdopodobieństwo opadów. Godzina powyżej 50 procent jest podświetlona na niebiesko.',
  'help.guide.day-weather.result':
    'Karta dnia w kolumnie dni niesie tę samą pogodę w małym pod swoim numerem, więc całą podróż da się przeczytać jednym spojrzeniem.',
  'help.guide.day-weather.tip.1':
    'Stopnie i wiatr idą za Jednostką temperatury w Wygląd w Ustawieniach: wybierz °F Fahrenheit, a ta sama prognoza zostanie wypisana w °F i mph.',
  'help.guide.day-weather.tip.2':
    'Dzień bez umiejscowionego przystanku i bez hotelu, w którym można się obudzić, nie pokazuje pogody wcale: prognoza jest zawsze dla miejsca, nigdy dla podróży.',
  'help.guide.day-weather.tip.3':
    'Dalej niż 16 dni naprzód nie ma żadnej prognozy. Liczby są wtedy średnimi wcześniejszych lat dla tej daty, oznaczonymi Ø, i jest to napisane pod spodem.',
  // rename-day
  'help.guide.rename-day.title': 'Nadać dniowi nazwę',
  'help.guide.rename-day.goal':
    'Nazwać dzień tym, czym jest, Przyjazd do Kyoto albo Dzień odpoczynku, zamiast Dzień 5.',
  'help.guide.rename-day.step.1': 'Otwórz dzień. Jego nagłówek brzmi Dzień 5, z datą pod spodem.',
  'help.guide.rename-day.step.2': 'Kliknij ołówek obok nazwy.',
  'help.guide.rename-day.step.3': 'Nazwa zamienia się w pole. Wpisz nazwę, którą chcesz.',
  'help.guide.rename-day.step.4':
    'Naciśnij Enter albo po prostu kliknij gdzie indziej; Escape wyrzuca zmianę. Karta dnia w kolumnie dni też niesie tę nazwę.',
  'help.guide.rename-day.result':
    'Nazwa zastępuje Dzień 5 w panelu i na karcie dnia w kolumnie dni; data zostaje tam, gdzie była.',
  'help.guide.rename-day.tip.1':
    'Wyczyść pole i zapisz, a dzień znowu jest Dzień 5: numer jest tym, co widać, gdy nie ma nazwy.',
  'help.guide.rename-day.tip.2':
    'Nazwa należy do dnia, nie do jego daty. Przestaw kolejność dni, a wędruje ze wszystkim innym z tego dnia.',
  // add-accommodation
  'help.guide.add-accommodation.title': 'Zarezerwować noc na dniu',
  'help.guide.add-accommodation.goal':
    'Wstawić hotel do planu raz, z dniami, które obejmuje, jego godzinami i jego numerem potwierdzenia.',
  'help.guide.add-accommodation.step.1':
    'Obiekt musi najpierw być miejscem podróży. Utwórz go w kolumnie miejsc tak jak każde inne miejsce: wybór oferuje tylko to, co już tam jest.',
  'help.guide.add-accommodation.step.2': 'Otwórz dzień przyjazdu i kliknij Dodaj zakwaterowanie pod Zakwaterowanie.',
  'help.guide.add-accommodation.step.3':
    'Zastosuj do dni mówi, które noce obejmuje pobyt: dzień zameldowania po lewej, dzień wymeldowania po prawej. Wszystkie obejmuje całą podróż.',
  'help.guide.add-accommodation.step.4':
    'Wypełnij Zameldowanie, Do i Wymeldowanie, a numer rezerwacji wpisz pod Potwierdzenie. Wszystkie cztery mogą zostać puste.',
  'help.guide.add-accommodation.step.5':
    'Wybierz obiekt z miejsc podróży. Kafelki nad listą zawężają ją do jednej kategorii.',
  'help.guide.add-accommodation.step.6': 'Kliknij Zapisz.',
  'help.guide.add-accommodation.result':
    'Pobyt pokazuje się w każdym dniu, który obejmuje, Zameldowanie w pierwszym i Wymeldowanie w ostatnim. Obiekt staje się przystankiem w dniu zameldowania, więc mapa rysuje drogę tam, a w zakładce Rezerwacje pojawia się rezerwacja typu Zakwaterowanie.',
  'help.guide.add-accommodation.tip.1':
    'Wybór otwiera się na dniu, z którego przyszedłeś, z wymeldowaniem dzień później; oba da się przesunąć przed zapisaniem.',
  'help.guide.add-accommodation.tip.2':
    'Nadaj hotelowi przy tworzeniu kategorię podróży Hotel, a kafelki nad listą zawężą ją do Twoich hoteli jednym kliknięciem.',
  'help.guide.add-accommodation.tip.3':
    'Godziny są wszystkie opcjonalne: pobyt bez zameldowania i bez kodu dalej obejmuje swoje noce i dalej rysuje swoją trasę.',
  // edit-accommodation
  'help.guide.edit-accommodation.title': 'Zmienić albo odwołać zarezerwowaną noc',
  'help.guide.edit-accommodation.goal': 'Przesunąć pobyt, poprawić jego godziny albo wyjąć go z planu z powrotem.',
  'help.guide.edit-accommodation.step.1':
    'W każdym dniu pobytu karta pokazuje obiekt, okno zameldowania, godzinę wymeldowania i numer potwierdzenia.',
  'help.guide.edit-accommodation.step.2':
    'Ołówek po jej prawej otwiera pobyt z powrotem. Okno brzmi teraz Edytuj zakwaterowanie.',
  'help.guide.edit-accommodation.step.3':
    'Popraw wiersz pól: Zameldowanie, Do, Wymeldowanie i Potwierdzenie. Dni nad nim i obiekt pod nim też można tu zmienić.',
  'help.guide.edit-accommodation.step.4': 'Kliknij Zapisz.',
  'help.guide.edit-accommodation.step.5':
    'X obok ołówka kończy pobyt. O nic nie pyta, a rezerwacja typu Zakwaterowanie, która do niego należy, idzie z nim.',
  'help.guide.edit-accommodation.result':
    'Zmiana dociera do każdego dnia, który pobyt obejmuje, naraz, a z nią rezerwacja typu Zakwaterowanie w zakładce Rezerwacje.',
  'help.guide.edit-accommodation.tip.1':
    'Noc w środku pobytu nie niesie ani Zameldowanie, ani Wymeldowanie: mają je tylko pierwszy i ostatni dzień zakresu.',
  'help.guide.edit-accommodation.tip.2':
    'Odwołanie pobytu zabiera też przystanek, który postawił w dniu zameldowania, i wszelkie koszty dopięte do jego rezerwacji. Zarezerwuj noc jeszcze raz, jeśli to była pomyłka.',
  // day-bookings
  'help.guide.day-bookings.title': 'Rezerwacje dnia jednym spojrzeniem',
  'help.guide.day-bookings.goal':
    'Zobaczyć w jednym miejscu, co jest już zarezerwowane na ten dzień i czy jest potwierdzone.',
  'help.guide.day-bookings.step.1':
    'Rezerwacje wypisują rezerwacje dnia: te datowane na niego i te wiszące na którymś z jego przystanków.',
  'help.guide.day-bookings.step.2':
    'Wiersz pokazuje, jaki to rodzaj rezerwacji, jej nazwę i, gdy należy do przystanku, ten przystanek po kropce. Jej godziny siedzą na prawym końcu.',
  'help.guide.day-bookings.step.3':
    'Kolor mówi, jak stoi rezerwacja: zielony wiersz jest potwierdzony, bursztynowy wciąż oczekuje. Hoteli nie ma na tej liście, mają własny blok niżej.',
  'help.guide.day-bookings.step.4':
    'Lista tylko odczytuje rezerwacje. Rezerwację tworzy się i zmienia w zakładce Rezerwacje.',
  'help.guide.day-bookings.result':
    'Wszystko datowane na ten dzień i wszystko wiszące na którymś z jego przystanków jest na tej jednej liście.',
  'help.guide.day-bookings.tip.1':
    'Rezerwacja ląduje na dniu według własnej daty. Zmień datę w zakładce Rezerwacje, a przeniesie się na inny dzień sama.',
  'help.guide.day-bookings.tip.2':
    'Brak bloku Rezerwacje znaczy, że dzień nie ma rezerwacji: jest ukryty, a nie pokazany pusty.',

  // ── Screen: trip-map ──────────────────────────────────────────────────────────────────
  'help.ctx.trip-map.title': 'Mapa',
  'help.ctx.trip-map.summary':
    'Środek planu: każde miejsce podróży jako pinezka, trasy, które je łączą, i przełączniki przy krawędziach mapy do satelity, do całej podróży naraz i do miejsc wokół tej części miasta, na którą patrzysz.',
  'help.ctx.trip-map.bullet.1':
    'Pinezka to miejsce: własne zdjęcie, gdy je ma, w przeciwnym razie kolor jego kategorii z ikoną kategorii. Najedź na nią, a dostaniesz kartę z nazwą i adresem, a do tego z kategorią i oceną tam, gdzie miejsce je niesie. Przeciągnij pinezkę na kartę dnia, żeby zaplanować tam miejsce.',
  'help.ctx.trip-map.bullet.2':
    'Pinezki zbyt blisko siebie, by je rozróżnić, zwijają się w jeden ciemny dymek z liczbą. Kliknij dymek, a mapa przybliży to, co jest w środku.',
  'help.ctx.trip-map.bullet.3':
    'Kliknij pinezkę, by otworzyć miejsce pod mapą, z jego oceną, plikami i tym, co z nim dalej; kliknij pusty kawałek mapy, by je znowu puścić.',
  'help.ctx.trip-map.bullet.4':
    'Gdy w kolumnie dni otwarty jest dzień, jego przystanki noszą małą białą plakietkę z numerem w tym dniu, a miejsce zaplanowane na dwa dni nosi oba numery połączone znakiem ·.',
  'help.ctx.trip-map.bullet.5':
    'Rząd ikon na górze przeszukuje tę część mapy, którą widzisz: Restauracje, Kawiarnie, Bary i życie nocne, Noclegi, Atrakcje, Muzea i kultura, Przyroda i parki oraz Aktywności. Szukaj w tym obszarze uruchamia to ponownie, gdy przesuniesz mapę.',
  'help.ctx.trip-map.bullet.6':
    'Kliknij prawym przyciskiem gdziekolwiek na mapie, by otworzyć formularz miejsca w tym punkcie, z już wyszukanym adresem. Okrągły przycisk na dole po lewej wymienia rysowaną mapę na zdjęcia lotnicze.',
  'help.ctx.trip-map.bullet.7':
    'Pokaż całą podróż na dole po prawej rysuje wszystkie dni podróży naraz i wypisuje, co każdy z nich obejmuje; ikona trasy w wierszu rezerwacji rysuje tę rezerwację, a ta na pasku narzędzi nad dniami rysuje je wszystkie.',
  // map-markers
  'help.guide.map-markers.title': 'Czytać mapę',
  'help.guide.map-markers.goal': 'Wiedzieć, co mówi Ci każda pinezka, plakietka i dymek na mapie.',
  'help.guide.map-markers.step.1':
    'Mapa trzyma każde miejsce podróży. Tam, gdzie pinezki siedzą zbyt blisko siebie, by je rozróżnić, zwijają się w jeden ciemny dymek niosący ich liczbę; kliknij dymek, a mapa przybliży to, co było w środku, albo przy najgłębszym przybliżeniu rozłoży pinezki w wachlarz.',
  'help.guide.map-markers.step.2':
    'Pinezka to własne zdjęcie miejsca, gdy je ma, w przeciwnym razie kolor jego kategorii z ikoną kategorii. Najedź na nią, a karta poda nazwę i adres, z kategorią i oceną tam, gdzie miejsce je niesie.',
  'help.guide.map-markers.step.3':
    'Kliknij pinezkę, a miejsce otworzy się w karcie pod mapą: jego współrzędne, ocena, Pliki i wzdłuż dolnej krawędzi to, co z nim dalej, wśród tego Nawigacja, Edytuj i Usuń, a Dodaj do dnia, dopóki dzień jest otwarty. Kliknij pusty kawałek mapy, by je znowu puścić.',
  'help.guide.map-markers.step.4':
    'Otwórz dzień w kolumnie dni, a jego przystanki dostaną numery: mała biała plakietka w rogu pinezki to miejsce tego przystanku w dniu. Miejsce zaplanowane na dwa dni nosi oba numery połączone znakiem ·. Bez otwartego dnia numerów nie ma, a róg niesie zamiast nich ocenę.',
  'help.guide.map-markers.step.5':
    'Przeciągnij pinezkę z mapy na kartę dnia w kolumnie dni, a miejsce jest zaplanowane na ten dzień, dokładnie tak, jak gdybyś wyciągnął jego wiersz z listy miejsc.',
  'help.guide.map-markers.result':
    'W podróży nic się nie zmieniło: mapa jest jej widokiem, a każda pinezka mówi, które miejsce, który dzień i w jakiej kolejności.',
  'help.guide.map-markers.tip.1':
    'Dzień zwinięty w kolumnie dni zabiera swoje przystanki z mapy ze sobą; otwórz dzień ponownie, a wracają.',
  'help.guide.map-markers.tip.2':
    'Filtr nad listą miejsc decyduje też o tym, co rysuje mapa: wybierz Niezaplanowane, a zostaną na niej tylko miejsca wciąż bez dnia.',
  'help.guide.map-markers.tip.3':
    'Na tej mapie nie ma przycisków przybliżania: kółko przybliża, podwójne kliknięcie przybliża o krok, a przeciąganie samej mapy ją przesuwa.',
  // map-nearby-places
  'help.guide.map-nearby-places.title': 'Znaleźć miejsca wokół siebie na mapie',
  'help.guide.map-nearby-places.goal':
    'Pozwolić mapie poszukać restauracji, atrakcji albo hotelu w tej części miasta, na którą patrzysz, i wziąć jedno do podróży.',
  'help.guide.map-nearby-places.step.1':
    'Rząd ikon na górze mapy to wyszukiwanie po kategoriach: Restauracje, Kawiarnie, Bary i życie nocne, Noclegi, Atrakcje, Muzea i kultura, Przyroda i parki oraz Aktywności.',
  'help.guide.map-nearby-places.step.2':
    'Kliknij kategorię. TREK szuka takiego rodzaju miejsca w tej części mapy, którą widzisz, i dla każdego trafienia stawia pinezkę w kolorze kategorii. Naraz tylko jedna kategoria: kliknięcie innej ją wymienia, a kliknięcie włączonej ją wyłącza.',
  'help.guide.map-nearby-places.step.3':
    'Przesuń mapę, a pod rzędem pojawi się drugi przycisk: Szukaj w tym obszarze uruchamia to samo wyszukiwanie dla nowego widoku. Samo przesuwanie nigdy nie szuka ponownie, co trzyma liczbę zapytań w ryzach.',
  'help.guide.map-nearby-places.step.4':
    'Pinezki noszą nazwę tego, co znalazły. Kliknij jedną, a formularz miejsca otworzy się już z niej wypełniony: Nazwa, Adres, Szerokość i Długość oraz strona internetowa i telefon tam, gdzie OpenStreetMap je ma.',
  'help.guide.map-nearby-places.step.5':
    'Sprawdź, co wypełnił, i dodaj to, czego wyszukiwanie wiedzieć nie mogło: Opis, Kategorię, własne notatki.',
  'help.guide.map-nearby-places.step.6':
    'Kliknij Dodaj. Jeśli miejsce o tej samej nazwie już jest w podróży, formularz to mówi, a przycisk zmienia się w Dodaj mimo to.',
  'help.guide.map-nearby-places.result':
    'Miejsce jest na liście miejsc i na mapie jako jedna z własnych pinezek podróży, pod Niezaplanowane, dopóki nie trafi do dnia. Pinezki wyszukiwania zostają, dopóki nie wyłączysz kategorii.',
  'help.guide.map-nearby-places.tip.1':
    'Rzędu nie ma, gdy w Ustawieniach, pod Travel & map, wyłączone jest Odkrywaj miejsca na mapie.',
  'help.guide.map-nearby-places.tip.2':
    'Odpowiedzi przychodzą z indeksu TREK Places i z OpenStreetMap, więc to jedna z niewielu rzeczy w planie, która potrzebuje połączenia.',
  'help.guide.map-nearby-places.tip.3':
    'Wyszukiwanie obejmuje to, co jest na ekranie, więc przybliż ulicę, o którą pytasz: całe miasto odpowiada pierwszymi sześćdziesięcioma trafieniami i niewielkim porządkiem w nich.',
  // map-add-place
  'help.guide.map-add-place.title': 'Utworzyć miejsce prawym kliknięciem na mapie',
  'help.guide.map-add-place.goal': 'Postawić miejsce dokładnie tam, gdzie chcesz, bez szukania go najpierw.',
  'help.guide.map-add-place.step.1':
    'Kliknij prawym przyciskiem punkt na mapie, o który Ci chodzi. Otworzy się formularz miejsca zatytułowany Dodaj miejsce/atrakcję.',
  'help.guide.map-add-place.step.2':
    'Szerokość i Długość są już w tym punkcie, a TREK wyszukuje współrzędne i wypełnia Adres tym, co tam znajdzie, a także Nazwę tam, gdzie wyszukiwanie ma co dać. Nic jeszcze nie jest zapisane, więc nadpisz, co jest nie tak.',
  'help.guide.map-add-place.step.3':
    'Nadaj mu Nazwę, którą rozpoznasz, i resztę tego, co plan ma wiedzieć: Opis, Notatki, Kategoria, Strona internetowa.',
  'help.guide.map-add-place.step.4':
    'Kliknij Dodaj. Miejsce ląduje na liście jako niezaplanowane nawet przy otwartym dniu: prawe kliknięcie na mapie mówi gdzie, nie kiedy.',
  'help.guide.map-add-place.result': 'Miejsce jest na liście i na mapie, pod Niezaplanowane, dopóki nie trafi do dnia.',
  'help.guide.map-add-place.tip.1':
    'Adres pochodzi z wyszukania współrzędnych, więc może brzmieć raczej jak ulica niż jak nazwa, a nad otwartym terenem może wrócić pusty. Oba pola są Twoje do nadpisania.',
  'help.guide.map-add-place.tip.2':
    'Na mapach MapLibre GL i Mapbox GL to samo robi kliknięcie środkowym przyciskiem, a na ekranie dotykowym długie przytrzymanie.',
  // map-satellite
  'help.guide.map-satellite.title': 'Przełączyć na satelitę',
  'help.guide.map-satellite.goal': 'Wymienić rysowaną mapę na zdjęcia lotnicze i z powrotem.',
  'help.guide.map-satellite.step.1':
    'Okrągły przycisk na dole po lewej stronie mapy to przełącznik warstwy podkładowej. Jego ikona zawsze pokazuje warstwę, na którą by przeszedł, a najechanie mówi którą: Przełącz na widok satelitarny. Kliknij go.',
  'help.guide.map-satellite.step.2':
    'Mapa to teraz zdjęcia lotnicze, dość głębokie, by rozpoznać pojedynczy budynek, i bez własnego klucza. Wszystko, co rysuje TREK, zostaje na wierzchu: pinezki, trasa dnia, ślady i trasy rezerwacji.',
  'help.guide.map-satellite.step.3':
    'Przycisk brzmi teraz Przełącz na widok mapy. Kliknij go, by wrócić do rysowanej mapy.',
  'help.guide.map-satellite.result':
    'Mapa znowu jest rysowana, a warstwa, na której ją zostawiłeś, jest pamiętana na Twoim koncie.',
  'help.guide.map-satellite.tip.1':
    'Wybór trzymany jest na Twoim koncie, a nie na podróży, więc każda podróż otwiera się tak, jak ją zostawiłeś, niezależnie od używanego silnika renderującego.',
  'help.guide.map-satellite.tip.2':
    'Zdjęcia nie niosą żadnych napisów: nazwy ulic, dzielnice i numery domów są na rysowanej mapie, więc przełącz z powrotem, gdy szukasz adresu.',
  // map-whole-trip
  'help.guide.map-whole-trip.title': 'Zobaczyć całą podróż i jej dystanse',
  'help.guide.map-whole-trip.goal':
    'Wymienić jeden otwarty dzień na wszystkie dni podróży i odczytać, jak daleko sięga każdy z nich.',
  'help.guide.map-whole-trip.step.1':
    'Okrągły przycisk Pokaż całą podróż siedzi na dole po prawej stronie mapy. Kliknij go, a wszystkie dni podróży zostaną narysowane naraz, każdy we własnym kolorze na białej otoczce, żeby sąsiednie dni się nie zlewały.',
  'help.guide.map-whole-trip.step.2':
    'Karta nad przyciskiem wypisuje te dni: kolorowa kropka, nazwa dnia, ikona dla każdego sposobu, jakim go pokonujesz, i dystans, który obejmuje. Na górze jest Łączny dystans.',
  'help.guide.map-whole-trip.step.3':
    'Kliknij dzień na karcie, by go wybrać, tak samo jak wybranie go w kolumnie dni: mapa kadruje ten dzień, a jego przystanki odzyskują numery.',
  'help.guide.map-whole-trip.step.4':
    'Przycisk brzmi teraz Ukryj całą podróż. Naciśnij go, by wrócić do jednego otwartego dnia.',
  'help.guide.map-whole-trip.result':
    'Każdy dzień podróży jest narysowany we własnym kolorze, a karta mówi, co obejmuje każdy z nich i ile wychodzi cała podróż.',
  'help.guide.map-whole-trip.tip.1':
    'Suma przychodzi po kilka odcinków naraz. Dopóki stoi za nią …, liczba jest jeszcze sumą częściową; ustala się, gdy odpowie każdy odcinek.',
  'help.guide.map-whole-trip.tip.2':
    'Odcinek, którego silnik tras odmawia, zostaje prostą linią i nic nie liczy, a karta to mówi, zamiast po cichu pokazywać mniej.',
  'help.guide.map-whole-trip.tip.3':
    'Dzień z mniej niż dwoma przystankami ze współrzędnymi nie ma trasy do narysowania, więc wypada z karty całkiem.',
  // map-booking-routes
  'help.guide.map-booking-routes.title': 'Pokazać trasę rezerwacji na mapie',
  'help.guide.map-booking-routes.goal':
    'Narysować na mapie loty, pociągi i przejazdy, które masz zarezerwowane, i zdjąć je z niej z powrotem.',
  'help.guide.map-booking-routes.step.1':
    'Trasy rezerwacji są wyłączone, dopóki o którąś nie poprosisz. W wierszu rezerwacji w kolumnie dni siedzi mała ikona trasy: Pokaż trasy rezerwacji.',
  'help.guide.map-booking-routes.step.2':
    'Kliknij ją, a rezerwacja pojawi się na mapie: lot jako łuk po ortodromie, przejazd po prawdziwych drogach, pociąg jako łańcuch swoich stacji. Potwierdzona rysowana jest ciągłą linią, Oczekująca przerywaną, a końce trasy to niebieskie pigułki z ikoną transportu.',
  'help.guide.map-booking-routes.step.3':
    'Kliknij końcową pigułkę, a otworzy się stojąca za nią rezerwacja, z jej godzinami, Kodem rezerwacji i Lokalizacją / Adresem, gdzie się zaczyna. Zamknij chowa ją znowu.',
  'help.guide.map-booking-routes.step.4':
    'Ikona trasy na pasku narzędzi nad dniami robi całą podróż naraz: Pokaż wszystkie trasy rezerwacji rysuje każdą rezerwację, która jakąś ma.',
  'help.guide.map-booking-routes.step.5':
    'To czysta karta, a nie warstwa na wierzchu, więc to, co wybrałeś rezerwacja po rezerwacji, przepada. Naciśnij ją ponownie, teraz z napisem Ukryj wszystkie trasy rezerwacji, a mapa jest czysta.',
  'help.guide.map-booking-routes.result':
    'Rezerwacje, o które poprosiłeś, są narysowane na mapie, a wybór trzymany jest dla tej podróży w tej przeglądarce, dopóki go nie zmienisz.',
  'help.guide.map-booking-routes.tip.1':
    'Końce niosą kod lotniska albo nazwę stacji tylko wtedy, gdy w Ustawieniach, pod Travel & map, włączone są Etykiety tras rezerwacji; w przeciwnym razie pokazują samą ikonę.',
  'help.guide.map-booking-routes.tip.2':
    'Zawsze pokazuj trasy rezerwacji, w tych samych ustawieniach, rysuje je od początku w każdej podróży, o której jeszcze nie zdecydowałeś.',
  'help.guide.map-booking-routes.tip.3':
    'Rezerwacja potrzebuje dwóch końców ze współrzędnymi, zanim da się ją narysować, więc hotel albo restauracja nie niesie ikony trasy.',
  'help.ctx.trip-map.bullet.8':
    'Z włączonym dodatkiem Dawarich okrągły przycisk Dawarich pod Pokaż całą podróż rysuje trasę, którą Twój telefon naprawdę zapisał: Pokaż zapisaną trasę kładzie ją przerywaną pod planowaną trasą, po jednym kolorze na dzień, a etykieta przycisku mówi, czemu nie ma linii, gdy jej nie ma.',
  // map-dawarich-trail
  'help.guide.map-dawarich-trail.title': 'Pokazać trasę, którą naprawdę przebyłeś',
  'help.guide.map-dawarich-trail.goal':
    'Połóż trasę, którą Dawarich zapisał na Twoim telefonie, na mapie, przerywaną obok tej, którą zaplanowałeś, i czytaj podróż dzień po dniu tak, jak naprawdę przebiegła.',
  'help.guide.map-dawarich-trail.step.1':
    'Okrągły przycisk Dawarich siedzi na dole mapy po prawej, pod Pokaż całą podróż; po najechaniu mówi Pokaż zapisaną trasę. Kliknij go. TREK pyta Twój Dawarich o daty podróży, a wokół przycisku kręci się pierścień, dopóki odpowiedź jest w drodze.',
  'help.guide.map-dawarich-trail.step.2':
    'Zapisana trasa ląduje jako przerywana linia, po jednym kolorze na dzień, narysowana pod planowaną trasą, żeby plan pozostał czytelny. Przycisk brzmi teraz Ukryj zapisaną trasę. Dni są cięte o lokalnej północy, a dzień zwinięty w kolumnie dni zabiera swoją przerywaną linię z mapy razem ze swoimi przystankami.',
  'help.guide.map-dawarich-trail.step.3':
    'Kliknij też Pokaż całą podróż, a każdy planowany dzień jest rysowany linią ciągłą obok przerywanego zapisu. Tam, gdzie obie biegną razem, dzień poszedł zgodnie z planem; tam, gdzie przerywana linia odchodzi, jest miejsce, w którym nie poszedł.',
  'help.guide.map-dawarich-trail.result':
    'To, co zaplanowałeś, i to, co naprawdę zrobiłeś, są na mapie razem, przerywane przeciw ciągłemu, a karta nad przyciskami wciąż wypisuje planowane dni i ich odległości.',
  'help.guide.map-dawarich-trail.tip.1':
    'Włączone albo wyłączone jest zapamiętywane dla każdej podróży na czas tej sesji przeglądarki. Dopóki trasa jest włączona, TREK pyta Dawarich ponownie co dwie minuty, więc podróż w toku nadrabia bez przeładowania; sama trasa nigdy nie jest zapisywana, więc nie ma jej w bazie TREK-a, w kopiach zapasowych ani offline.',
  'help.guide.map-dawarich-trail.tip.2':
    'Etykieta przycisku wyjaśnia pustą mapę: Wczytywanie zapisanej trasy…, dopóki jest w drodze, W tych dniach nic nie zostało zapisane, Nie udało się wczytać zapisanej trasy, albo Zapisana trasa wymaga połączenia, gdy TREK jest offline.',
  // map-compass
  'help.guide.map-compass.title': 'Obrócić mapę i znów znaleźć północ',
  'help.guide.map-compass.goal': 'Obróć mapę w stronę, w którą idziesz, i jednym kliknięciem przywróć ją do północy.',
  'help.guide.map-compass.step.1':
    'Obróć mapę przeciągnięciem prawym przyciskiem albo przytrzymaj Ctrl i przeciągnij lewym; na ekranie dotykowym obróć dwoma palcami. Okrągły kompas obok rzędu ikon kategorii u góry mapy obraca się z nią: jego strzałka zawsze wskazuje północ, więc przechyla się tak daleko, jak obróciłeś.',
  'help.guide.map-compass.step.2':
    'Kliknij kompas. Reset north, bo tak nazywa się przycisk, płynnie wraca mapą do północy u góry i do płaskiego widoku, a strzałka znów stoi prosto.',
  'help.guide.map-compass.result':
    'Mapa znów jest północą do góry i wypoziomowana, a w podróży nic się nie zmieniło: kompas rusza tylko kamerą.',
  'help.guide.map-compass.tip.1':
    'Kompas istnieje tylko na mapach MapLibre GL i Mapbox GL; mapy Leaflet nie da się obrócić, więc go nie ma. Dostawca mapy w Ustawienia, pod Mapa, decyduje, której używasz, a Zapisz mapę zachowuje wybór.',
  'help.guide.map-compass.tip.2':
    'Kliknięcie zdejmuje też pochylenie: przeciągnięcie prawym przyciskiem w górę albo w dół pochyla widok, a Reset north poziomuje go razem z obrotem. Na Mapbox GL z włączonym Budynki 3D i teren spłaszcza to też widok 3D, dopóki znów go nie pochylisz.',

  // ── Screen: trip-collab ───────────────────────────────────────────────────────────────
  'help.ctx.trip-collab.title': 'Współpraca',
  'help.ctx.trip-collab.summary':
    'Zakładka, w której grupa planuje razem: czat po lewej, obok niego wspólne notatki i linki, pod nimi ankiety, a na końcu Co dalej. Wszystko, co tu napiszesz, stoi od razu na ekranie każdego innego uczestnika, bez przeładowania.',
  'help.ctx.trip-collab.bullet.1':
    'Czat to kolumna po lewej. Pisz w Napisz wiadomość... i naciśnij Enter; Shift i Enter robią nowy wiersz. Uśmiech dodaje emoji, a Dołącz obrazy wiesza na wiadomości do czterech zdjęć.',
  'help.ctx.trip-collab.bullet.2':
    'Najedź na wiadomość po Odpowiedz, a na własnej także po Usuń; kliknij ją prawym przyciskiem po osiem szybkich reakcji. Po usuniętej wiadomości zostaje jeden wiersz mówiący, że usunięto wiadomość.',
  'help.ctx.trip-collab.bullet.3':
    'Notatki to wspólny brulion: Nowa notatka pisze jedną, a kółko zębate obok otwiera Zarządzaj kategoriami dla ich nazw i kolorów. Karta niesie Rozwiń, Przypnij, Edytuj i Usuń.',
  'help.ctx.trip-collab.bullet.4':
    'Linki zbierają adresy, na których stoi podróż. Dodaj link bierze tytuł i adres http albo https; Edytuj link, Przypnij link i Usuń link siedzą na ogonie plakietki, a przypięte linki zostają z przodu.',
  'help.ctx.trip-collab.bullet.5':
    'Ankiety rozstrzygają sprawy. Nowa ankieta zadaje pytanie z co najmniej dwiema opcjami; kliknięcie opcji to twój głos, Zamknij kończy głosowanie, a Usuń usuwa ankietę.',
  'help.ctx.trip-collab.bullet.6':
    'Co dalej wypisuje przystanki podróży, które są jeszcze przed tobą, najwyżej osiem z nich, z ich godzinami i osobami na nich. Czyta tylko plan dnia; godziny ustawia się tam.',
  // write-note
  'help.guide.write-note.title': 'Napisać wspólną notatkę',
  'help.guide.write-note.goal':
    'Umieść to, czego potrzebuje cała grupa, zasadę, adres, przypomnienie, tam, gdzie każdy znajdzie to znowu.',
  'help.guide.write-note.step.1': 'Kliknij Nowa notatka u góry panelu Notatki. Otwiera się formularz.',
  'help.guide.write-note.step.2':
    'Tytuł notatki to nazwa, którą niesie karta. To jedyne, przy czym formularz się upiera: Utwórz zostaje szare, dopóki nic w nim nie stoi.',
  'help.guide.write-note.step.3':
    'Duże pole pod nim trzyma tekst i bierze Markdown: pogrubione słowo, listę, nagłówek. Karta pokazuje kilka pierwszych wierszy, a Rozwiń na niej otwiera całą notatkę.',
  'help.guide.write-note.step.4':
    'Pod Kategoria wybierz tę, do której notatka należy; jej kolor staje się kolorem karty. Pigułki to kategorie, które już istnieją, a nową robi się w Zarządzaj kategoriami.',
  'help.guide.write-note.step.5':
    'Strona internetowa bierze link, który należy do notatki. Karta niesie wtedy kafelek Link, który go otwiera.',
  'help.guide.write-note.step.6': 'Kliknij Utwórz.',
  'help.guide.write-note.result':
    'Notatka jest kartą w panelu Notatki, w kolorze swojej kategorii, i stoi już na ekranie każdego innego uczestnika.',
  'help.guide.write-note.tip.1':
    'Przypnij na karcie trzyma ją na górze panelu; wszystko pod nią jest ułożone według tego, kiedy zmieniono to ostatnio.',
  'help.guide.write-note.tip.2':
    'Kółko zębate obok Nowa notatka otwiera Zarządzaj kategoriami: tam kategoria dostaje swój kolor, zostaje przemianowana wszędzie naraz albo zostaje dodana, zanim użyje jej jakakolwiek notatka.',
  'help.guide.write-note.tip.3':
    'Załącz pliki wiesza na notatce dokument. Załącz otwiera wybór plików, a obraz albo PDF można też po prostu wkleić do formularza.',
  'help.guide.write-note.tip.4':
    'Notatki to własny przełącznik pod Dodatki, pod Współpraca: administrator może go wyłączyć i zostawić działające czat, linki, ankiety i Co dalej.',
  // shared-links
  'help.guide.shared-links.title': 'Zebrać linki podróży',
  'help.guide.shared-links.goal':
    'Trzymaj portal rezerwacji, wspólny album i rozkład w jednym miejscu, zamiast szukać ich przewijaniem czatu.',
  'help.guide.shared-links.step.1': 'Kliknij Dodaj link u góry panelu Linki.',
  'help.guide.shared-links.step.2':
    'Nadaj linkowi nazwę w Tytuł linku, wklej adres w pole pod nim, a potem kliknij Zapisz link.',
  'help.guide.shared-links.step.3':
    'Plakietka pokazuje nazwę i stronę, na którą wskazuje. Kliknięcie jej otwiera stronę w nowej karcie.',
  'help.guide.shared-links.step.4':
    'Trzy małe przyciski na jej ogonie to Edytuj link, Przypnij link i Usuń link. Przypnij link przesuwa plakietkę na przód panelu; Usuń link o nic nie pyta.',
  'help.guide.shared-links.result':
    'Link jest plakietką w panelu Linki, przypiętą z przodu, i stoi od razu na ekranie każdego uczestnika.',
  'help.guide.shared-links.tip.1': 'Brane są tylko adresy http i https; pole odrzuca cokolwiek innego, zanim zapisze.',
  'help.guide.shared-links.tip.2':
    'Przypięte linki idą pierwsze, potem najnowsze. Mała ikona obok tytułu to własna favicona strony, pobrana z niej samej, więc bez internetu plakietka pokazuje zamiast niej zwykły znak linku.',
  'help.guide.shared-links.tip.3':
    'Linki to własny przełącznik pod Dodatki, pod Współpraca, więc administrator może wyłączyć panel, nie dotykając reszty zakładki.',
  // create-poll
  'help.guide.create-poll.title': 'Zapytać grupę',
  'help.guide.create-poll.goal':
    'Zamień pytanie, na które nikt nie odpowiada na czacie, w ankietę, którą każdy może odhaczyć.',
  'help.guide.create-poll.step.1': 'Kliknij Nowa ankieta u góry panelu Ankiety.',
  'help.guide.create-poll.step.2':
    'Napisz pytanie. Obsługuje Markdown pod polem znaczy, że pogrubione słowo, łamanie wiersza albo krótka lista tu działają.',
  'help.guide.create-poll.step.3': 'Wypełnij Opcja 1 i Opcja 2. Dwie opcje z czymś w środku to minimum.',
  'help.guide.create-poll.step.4':
    '+ Dodaj opcję dokłada trzecią, czwartą, tyle, ile potrzebujesz; mały krzyżyk obok wiersza zabiera jedną z powrotem.',
  'help.guide.create-poll.step.5':
    'Wielokrotny wybór pozwala każdemu odhaczyć więcej niż jedną opcję. Zostawiony wyłączony sprawia, że głos przenosi się, gdy ktoś wybierze coś innego.',
  'help.guide.create-poll.step.6': 'Kliknij Utwórz ankietę.',
  'help.guide.create-poll.result': 'Ankieta stoi na górze panelu Ankiety, otwarta, i nikt jeszcze nie zagłosował.',
  'help.guide.create-poll.tip.1': 'Pytanie jest renderowane jako Markdown; opcje zostają zwykłym tekstem.',
  'help.guide.create-poll.tip.2':
    'Utwórz ankietę zostaje szare, dopóki nie ma pytania i co najmniej dwóch opcji z czymś w środku.',
  'help.guide.create-poll.tip.3':
    'Koniec da się ustawić tylko w aplikacji na telefon. Ankieta, która go ma, pokazuje tu pozostały czas w bursztynowej plakietce i liczy się jako zamknięta, gdy czas minie.',
  'help.guide.create-poll.tip.4':
    'Ankiety to własny przełącznik pod Dodatki, pod Współpraca: administrator może go wyłączyć i zostawić działające pozostałe cztery panele.',
  // vote-poll
  'help.guide.vote-poll.title': 'Zagłosować i odczytać wynik',
  'help.guide.vote-poll.goal': 'Oddaj swój głos, zobacz, gdzie stoi grupa, i zmień zdanie.',
  'help.guide.vote-poll.step.1': 'Kliknij opcję, którą chcesz. Jej kółko wypełnia się, a pasek za nią rośnie.',
  'help.guide.vote-poll.step.2':
    'Teraz czytelny jest cały wynik: pasek to udział, procent stoi po prawej, a małe kółka to osoby, które wybrały tę opcję.',
  'help.guide.vote-poll.step.3':
    'Zmieniłeś zdanie? Kliknij inną opcję. W ankiecie, w której Wielokrotny wybór jest wyłączony, twój głos przenosi się, zamiast dokładać drugi.',
  'help.guide.vote-poll.step.4':
    'Pod pytaniem stoi, ile głosów ma ankieta. Kliknięcie opcji, którą już wybrałeś, zabiera twój głos z powrotem, a licznik znowu spada.',
  'help.guide.vote-poll.result':
    'Twój ptaszek stoi na jednej opcji, paski pokazują, jak grupa jest podzielona, a kółka mówią, kto co wybrał.',
  'help.guide.vote-poll.tip.1':
    'Paski i procenty pojawiają się dopiero, gdy sam zagłosujesz albo gdy ankieta jest zamknięta, żeby nikogo nie popychał bieżący wynik.',
  'help.guide.vote-poll.tip.2':
    'Głos nigdy nie jest anonimowy: najedź na jedno z kółek przy opcji, a dostaniesz stojące za nim imię.',
  // close-poll
  'help.guide.close-poll.title': 'Zamknąć ankietę albo ją usunąć',
  'help.guide.close-poll.goal':
    'Zatrzymaj głosowanie, gdy grupa już zdecydowała, i sprzątnij ankietę, której nikt już nie potrzebuje.',
  'help.guide.close-poll.step.1': 'Zamknij, kłódka w rogu ankiety, kończy głosowanie. Opcje przestają brać kliknięcia.',
  'help.guide.close-poll.step.2':
    'Zamknięta ankieta opada pod nagłówek Zamknięte na dole panelu, nosi plakietkę Zamknięta i pokazuje wynik wszystkim, czy głosowali, czy nie. Zwycięska opcja jest podbarwiona na zielono.',
  'help.guide.close-poll.step.3':
    'Usuń, kosz w tym samym rogu, usuwa ankietę. Nic nie pyta dwa razy, a głosy idą razem z nią.',
  'help.guide.close-poll.result':
    'Ankieta zniknęła z panelu każdego uczestnika. Ta, którą tylko zamknięto, zostaje czytelna na dole, ze swoim wynikiem.',
  'help.guide.close-poll.tip.1':
    'Zamknięcia nie da się cofnąć: nie ma otwarcia z powrotem. Ankietę zamkniętą przez pomyłkę trzeba zadać jeszcze raz.',
  'help.guide.close-poll.tip.2': 'Usuń zabiera ankietę i każdy oddany na nią głos wszystkim, od razu i bez pytania.',
  // whats-next
  'help.guide.whats-next.title': 'Czytać Co dalej',
  'help.guide.whats-next.goal': 'Zobacz, co grupa robi dalej, bez otwierania planu.',
  'help.guide.whats-next.step.1':
    'Panel wypisuje przystanki podróży, które są jeszcze przed tobą, najwyżej osiem z nich, w kolejności czasu, pod nagłówkiem na każdy dzień: Dzisiaj, Jutro albo data.',
  'help.guide.whats-next.step.2':
    'Po lewej stronie wiersza stoi jego godzina: początek, do, i koniec, gdy przystanek go ma, albo TBD, gdy nie ustawiono na nim jeszcze żadnej godziny.',
  'help.guide.whats-next.step.3':
    'Plakietki pod nazwą to osoby na tym przystanku. Gdy nikogo do niego nie wybrano, wypisani są wszyscy w podróży.',
  'help.guide.whats-next.result':
    'Lista tego, co nadchodzi, tylko do czytania: idzie za planem i nic tutaj go nie zmienia.',
  'help.guide.whats-next.tip.1':
    'Tutaj nic się nie ustawia. Godziny biorą się z planu dnia; zmień je tam, a ta lista od razu za nimi idzie.',
  'help.guide.whats-next.tip.2':
    'Wypisane jest tylko to, co jeszcze leży przed tobą: przystanek, którego godzina minęła, wypada, a na końcu podróży panel jest pusty.',
  'help.guide.whats-next.tip.3':
    'Co dalej to własny przełącznik pod Dodatki, pod Współpraca, i jest to panel na komputer: zakładka Współpraca w aplikacji na telefon go nie oferuje.',
  // trip-chat
  'help.guide.trip-chat.title': 'Rozmawiać z grupą',
  'help.guide.trip-chat.goal':
    'Powiedz coś, odpowiedz na jedną konkretną wiadomość, zareaguj na inną i zabierz własną z powrotem.',
  'help.guide.trip-chat.step.1':
    'Pisz w Napisz wiadomość... i naciśnij Enter. Niebieska strzałka obok pola robi to samo; Shift i Enter robią zamiast tego nowy wiersz.',
  'help.guide.trip-chat.step.2':
    'Uśmiech otwiera wybór emoji, ze Smileys, Reactions i Travel w środku. To, co wybierzesz, dokłada się do tego, co piszesz, samo się nie wysyła.',
  'help.guide.trip-chat.step.3':
    'Najedź na czyjąś wiadomość: w jej rogu pojawia się mały okrągły przycisk. To jest Odpowiedz.',
  'help.guide.trip-chat.step.4':
    'Wiadomość, na którą odpowiadasz, jest cytowana nad polem. Napisz i wyślij, a cytat jedzie razem w twoim dymku; krzyżyk na cytacie znowu go porzuca.',
  'help.guide.trip-chat.step.5':
    'Kliknij wiadomość prawym przyciskiem po osiem szybkich reakcji. Twoja siedzi pod dymkiem, a drugie kliknięcie tej samej zabiera ją z powrotem.',
  'help.guide.trip-chat.step.6':
    'Twoje własne wiadomości niosą Usuń obok Odpowiedz. Zabiera wiadomość i zostawia jeden wiersz mówiący, że usunięto wiadomość: drogi powrotnej nie ma.',
  'help.guide.trip-chat.result':
    'Twoja odpowiedź siedzi pod wiadomością, którą cytuje, reakcja wisi na trzeciej, a ta, którą zabrałeś z powrotem, zostawia jeden wiersz, który o tym mówi.',
  'help.guide.trip-chat.tip.1':
    'Enter wysyła, Shift i Enter robią nowy wiersz. Wiadomość, która jest niczym innym niż emoji, pokazuje się duża.',
  'help.guide.trip-chat.tip.2':
    'Dołącz obrazy bierze do czterech zdjęć na jedną wiadomość; można je też po prostu wkleić albo upuścić na pole.',
  'help.guide.trip-chat.tip.3':
    'Wiadomość z linkiem dostaje pod sobą kartę podglądu, pobraną przez twój własny TREK, więc link do czegoś, dokąd tylko ty masz dostęp, zostaje zwykłym linkiem.',
  'help.guide.trip-chat.tip.4':
    'Czat to własny przełącznik pod Dodatki, pod Współpraca: administrator może go wyłączyć i zostawić działające notatki, linki, ankiety i Co dalej.',

  // ── Screen: trip-lists ────────────────────────────────────────────────────────────────
  'help.ctx.trip-lists.title': 'Listy',
  'help.ctx.trip-lists.summary':
    'Dwie listy dla jednej podróży: lista pakowania, z tym, kto co przynosi i ile to waży, oraz lista zadań ze wszystkim, co musi się wydarzyć przed podróżą i w jej trakcie. Zakładka jest, dopóki dodatek Listy jest włączony.',
  'help.ctx.trip-lists.bullet.1':
    'Lista pakowania i Do zrobienia u góry przełączają między jednym a drugim i liczą, co jest w każdym; przyciski po prawej należą do tego, który jest otwarty.',
  'help.ctx.trip-lists.bullet.2':
    'Lista pakowania jest podzielona na listy, Dokumenty, Odzież, jak je nazwiesz, każda z kolorową kropką, odznaką spakowane z całości i trzema kropkami, pod którymi siedzą Zmień nazwę, Zaznacz wszystko, Odznacz wszystko i Usuń listę. Dodaj listę na pasku powyżej tworzy nową.',
  'help.ctx.trip-lists.bullet.3':
    'Wiersz to pole wyboru i nazwa, potem jako małe plakietki, kto przynosi przedmiot, ilość i waga w gramach, i kółko torby, dopóki Kontrola bagażu jest włączona, a potem kosz i trzy kropki, pod którymi siedzą Przenieś do listy, Udostępnianie, Zmień nazwę i Usuń. To, czego wiersz nie używa, pozostaje przygaszone, dopóki nie najedziesz na to kursorem, a uchwyt po lewej przeciąga go w górę lub w dół wewnątrz jego listy.',
  'help.ctx.trip-lists.bullet.4':
    'Wspólne i Moja lista dzielą listę pakowania na dwie części: pulę, którą widzą wszyscy, i Twoją własną. Wszystkie, Do spakowania i Spakowane zawężają tę, która jest otwarta, a pasek u góry liczy, co jest spakowane.',
  'help.ctx.trip-lists.bullet.5':
    'Zastosuj szablon i Zapisz jako szablon wypełniają albo zachowują listę bez pisania jej od nowa, a dwie ikony obok nich eksportują listę, jako wydruk, PDF albo plik, i importują listę. Czerwony przycisk przy pasku postępu mówi, ile przedmiotów jest zaznaczonych, i sprząta je.',
  'help.ctx.trip-lists.bullet.6':
    'Do zrobienia ma własny panel boczny: kartę postępu, filtry Wszystkie, Moje zadania, Przeterminowane i Gotowe, jeden wiersz na listę i pod nimi Dodaj listę. Zadania leżą w karcie, której nagłówek nazywa filtr i mieści sortowanie, Priorytet albo Termin. Kliknięcie zadania otwiera je w panelu po prawej, a Nowe zadanie otwiera na środku ekranu formularz Nowe zadanie.',
  // packing-categories
  'help.guide.packing-categories.title': 'Zbudować listę pakowania',
  'help.guide.packing-categories.goal':
    'Pogrupuj to, co bierzesz, w listy, wypełnij je przedmiotami i powiedz, kto zajmuje się którą listą.',
  'help.guide.packing-categories.step.1':
    'Kliknij Dodaj listę na pasku nad listami, wpisz nazwę w Nazwa listy (np. Odzież) i kliknij Dodaj.',
  'help.guide.packing-categories.step.2':
    'Nowa lista zaczyna od jednego pustego wiersza. Kliknij Dodaj przedmiot, wpisz przedmiot w Nazwa przedmiotu... i naciśnij Enter; pole zostaje otwarte na następny.',
  'help.guide.packing-categories.step.3':
    'Nazwę wiersza zmienisz, klikając ją, albo przez Zmień nazwę w trzech kropkach na jego prawym końcu.',
  'help.guide.packing-categories.step.4':
    'Przerywane kółko w nagłówku listy przypisuje do listy członków podróży. Wybierz imię; plakietka, która się pojawia, usuwa tę osobę z powrotem jednym kliknięciem.',
  'help.guide.packing-categories.step.5':
    'Trzy kropki na końcu nagłówka trzymają resztę: Zmień nazwę, Zaznacz wszystko, Odznacz wszystko i Usuń listę, które zabiera listę i wszystko w niej, nie pytając ponownie.',
  'help.guide.packing-categories.result':
    'Nowa lista siedzi w siatce ze swoimi przedmiotami pod nią i ze swoją kolorową kropką, a jej odznaka liczy, co jest już spakowane.',
  'help.guide.packing-categories.tip.1':
    'Lista to tylko jej przedmioty. Usuń ostatni, a wiersz zmieni się w symbol zastępczy, żeby lista zachowała swoje miejsce i swój kolor; usuń i ten wiersz, a listy nie ma.',
  'help.guide.packing-categories.tip.2':
    'Przypisanie kogoś do listy wysyła mu powiadomienie o pakowaniu. Nie zmienia to, kto widzi przedmioty, od tego jest Udostępnianie, w trzech kropkach wiersza.',
  'help.guide.packing-categories.tip.3':
    'Dwie listy mogą nosić tę samą nazwę. TREK rozróżnia je wewnętrznie, więc nazwy zostają takie, jak je wpisałeś.',
  // check-off-packing
  'help.guide.check-off-packing.title': 'Odhaczać w trakcie pakowania',
  'help.guide.check-off-packing.goal': 'Zaznacz, co jest w torbie, obserwuj pasek i sprzątnij spakowane przedmioty.',
  'help.guide.check-off-packing.step.1':
    'Kliknij pole po lewej stronie wiersza. Nazwa zostaje przekreślona, a pasek się przesuwa.',
  'help.guide.check-off-packing.step.2':
    'Pasek u góry liczy, co jest spakowane, wobec wszystkiego na liście, jako liczba i jako procent.',
  'help.guide.check-off-packing.step.3':
    'Cała lista naraz: trzy kropki w jej nagłówku trzymają Zaznacz wszystko i Odznacz wszystko.',
  'help.guide.check-off-packing.step.4':
    'Wszystkie, Do spakowania i Spakowane zawężają siatkę. Do spakowania zostawia tylko to, czego jeszcze brakuje, więc lista spakowana w całości z niej wypada.',
  'help.guide.check-off-packing.step.5':
    'Usuń 3 spakowanych obok paska postępu kasuje wszystkie zaznaczone przedmioty naraz, po jednym potwierdzeniu od przeglądarki.',
  'help.guide.check-off-packing.result':
    'Wypisane jest tylko to, co jeszcze otwarte, a pasek u góry mówi, jak daleko zaszło pakowanie.',
  'help.guide.check-off-packing.tip.1': 'Zaznaczony przedmiot wciąż można przemianować: kliknij jego nazwę.',
  'help.guide.check-off-packing.tip.2':
    'Zaznacz wszystko i Odznacz wszystko działają na jednej liście naraz, z jej własnych trzech kropek.',
  'help.guide.check-off-packing.tip.3':
    'Gdy wszystkie przedmioty są zaznaczone, licznik zastępuje Wszystko spakowane!, a pasek robi się zielony.',
  // apply-packing-template
  'help.guide.apply-packing-template.title': 'Zastosować szablon pakowania',
  'help.guide.apply-packing-template.goal':
    'Wprowadź do podróży gotową listę i zachowaj listę tej podróży na następną.',
  'help.guide.apply-packing-template.step.1': 'Kliknij Zastosuj szablon na pasku nad listą.',
  'help.guide.apply-packing-template.step.2':
    'Wybierz szablon. Każdy wiersz go nazywa i mówi, ile przedmiotów zawiera.',
  'help.guide.apply-packing-template.step.3':
    'Przedmioty lądują w widoku, w którym jesteś: Wspólne wkłada je do puli, którą widzą wszyscy, Moja lista robi je Twoimi.',
  'help.guide.apply-packing-template.step.4':
    'Zachowaj listę tej podróży na następną podróż: Zapisz jako szablon otwiera okno, wpisz nazwę i kliknij Zapisz.',
  'help.guide.apply-packing-template.result': 'Listy i przedmioty szablonu są w podróży, obok tego, co już tam było.',
  'help.guide.apply-packing-template.tip.1':
    'Szablon niesie tylko nazwy i listy. Ilości, wagi, torby i to, co już zaznaczone, zostają z tyłu.',
  'help.guide.apply-packing-template.tip.2':
    'Zastosuj szablon jest dopiero wtedy, gdy szablon istnieje. Bez niego przycisk w ogóle się nie pojawia.',
  'help.guide.apply-packing-template.tip.3':
    'Zapisz jako szablon pojawia się tylko administratorowi instancji i tylko dopóki lista ma przedmioty. Zapisuje wspólną pulę plus Twoje własne przedmioty, nigdy prywatnych przedmiotów innego członka.',
  // import-packing-list
  'help.guide.import-packing-list.title': 'Wkleić całą listę pakowania',
  'help.guide.import-packing-list.goal':
    'Zamień listę, którą masz już gdzie indziej, w przedmioty do spakowania za jednym razem.',
  'help.guide.import-packing-list.step.1': 'Kliknij przycisk importu ze strzałką w dół na pasku nad listą.',
  'help.guide.import-packing-list.step.2':
    'Jedna pozycja w wierszu: Kategoria, Nazwa, Waga w gramach (opcjonalnie), Torba (opcjonalnie), checked/unchecked (opcjonalnie). Szary przykład w polu pokazuje wszystkie cztery kształty. Działa też lista w Markdown: nagłówek nadaje nazwę liście, a "- [ ]" i "- [x]" stają się pozycjami.',
  'help.guide.import-packing-list.step.3':
    'Albo wczytaj wiersze z pliku przez Załaduj CSV/TXT/MD. Przyjmuje .csv, .txt albo .md i zastępuje to, co jest w polu.',
  'help.guide.import-packing-list.step.4': 'Kliknij Importuj. Przycisk liczy wiersze, które zrozumiał.',
  'help.guide.import-packing-list.result':
    'Każdy wiersz to jedna pozycja, na liście, którą nazywa jego pierwsze pole, i nic z tego, co już tam było, nie zostaje ruszone.',
  'help.guide.import-packing-list.tip.1':
    'Pola rozdzielają przecinki, średniki i tabulatory, a cudzysłowy trzymają pole razem, więc „Koszula, niebieska” zostaje jedną nazwą. Wiersz z jedną wartością to sama nazwa, wiersz bez własnej listy ląduje w Inne, a "3x" przed nazwą ustawia ilość.',
  'help.guide.import-packing-list.tip.2':
    'Torba nazwana w czwartym polu zostaje utworzona, jeśli podróż jeszcze jej nie ma. To jedyne miejsce, które wczytuje wagi i torby hurtowo; szablon przynosi tylko nazwy i listy.',
  // export-packing-list
  'help.guide.export-packing-list.title': 'Wydrukować albo wyeksportować listę pakowania',
  'help.guide.export-packing-list.goal':
    'Zabierz listę ze sobą na papierze, jako PDF albo jako plik dla innej aplikacji lub na następną podróż.',
  'help.guide.export-packing-list.step.1': 'Kliknij przycisk eksportu ze strzałką w górę na pasku nad listą.',
  'help.guide.export-packing-list.step.2':
    'Lista kontrolna w Markdown (.md) i CSV do importu (.csv) od razu zapisują listę jako plik.',
  'help.guide.export-packing-list.step.3':
    'Kliknij Drukuj lub zapisz jako PDF. Podgląd pokazuje listę jako stronę: u góry podróż i jej daty, potem każdą listę jako kartę z polem do zaznaczenia.',
  'help.guide.export-packing-list.step.4':
    'Kliknij Drukuj lub zapisz jako PDF pod podglądem. Przeglądarka otwiera swoje okno drukowania: wybierz drukarkę albo Zapisz jako PDF, żeby zachować plik.',
  'help.guide.export-packing-list.result':
    'Wydruk i pliki zawierają widok, który jest otwarty, Wspólne albo Moja lista, z ilościami, wagami i zaznaczeniami.',
  'help.guide.export-packing-list.tip.1':
    'CSV to format, który czyta Importuj, razem z torbami, więc działa jak Twój własny szablon pakowania: zaimportuj go do następnej podróży.',
  'help.guide.export-packing-list.tip.2':
    'Plik Markdown otwiera się jako lista kontrolna w Obsidian, Notion albo GitHub i tak samo wraca przez Importuj.',
  // share-packing-item
  'help.guide.share-packing-item.title': 'Zdecydować, kto widzi przedmiot i kto go przynosi',
  'help.guide.share-packing-item.goal':
    'Przesuwaj przedmiot między pulą grupy, własną listą i osobami, dla których go bierzesz.',
  'help.guide.share-packing-item.step.1':
    'Wspólne nad listami to pula, którą widzą wszyscy, Moja lista to Twoja własna, a każde liczy, co w nim jest. Kliknij Moja lista, żeby zajrzeć do swojej.',
  'help.guide.share-packing-item.step.2':
    'Z powrotem we Wspólne otwórz trzy kropki na końcu wiersza i kliknij Udostępnianie.',
  'help.guide.share-packing-item.step.3':
    'Trzy poziomy: Wspólne, w puli grupy i widoczne dla wszystkich; Osobiste, które widzisz tylko Ty; oraz Udostępnij osobom…, gdzie wybierasz osoby, których przedmiot dotyczy.',
  'help.guide.share-packing-item.step.4': 'Osobisty przedmiot jest tylko na Moja lista. Przełącz się, żeby go znaleźć.',
  'help.guide.share-packing-item.step.5':
    'Otwórz Udostępnianie ponownie i zaznacz imię pod Udostępnij osobom…. Przedmiot pokazuje się też na liście tej osoby, a wiersz dostaje małą plakietkę z liczbą osób, którym go udostępniono.',
  'help.guide.share-packing-item.result':
    'Przedmiot siedzi na poziomie, który wybrałeś, a wiersz mówi, kto go przynosi.',
  'help.guide.share-packing-item.tip.1':
    'Udostępnianie zmienia tylko osoba, która przedmiot przynosi. Ten, komu go udostępniłeś, widzi go na swojej Moja lista, oznaczony Twoim imieniem, i może go odhaczyć.',
  'help.guide.share-packing-item.tip.2':
    'Przy przedmiocie, który przynosi ktoś inny, dostajesz zamiast tego dwa inne przyciski: Ja też mogę to wziąć, który dopisuje Cię obok niego, i Kopiuj do mojej listy, który robi prywatną kopię dla Ciebie.',
  'help.guide.share-packing-item.tip.3':
    'Nowe przedmioty dziedziczą widok, w którym je dodajesz. Dodane w Moja lista są Osobiste, dodane we Wspólne idą do puli.',
  // packing-bags
  'help.guide.packing-bags.title': 'Zważyć torby',
  'help.guide.packing-bags.goal':
    'Nadaj każdemu przedmiotowi wagę, rozłóż przedmioty do toreb i utrzymaj każdą torbę poniżej limitu linii lotniczej.',
  'help.guide.packing-bags.step.1': 'Kliknij plakietkę wagi przed kółkiem i wpisz wagę przedmiotu w gramach.',
  'help.guide.packing-bags.step.2': 'Kółko na końcu wiersza to jego torba. Kliknij je.',
  'help.guide.packing-bags.step.3':
    'Nie ma jeszcze torby: Dodaj torbę, nazwa, Enter. Torba zostaje utworzona, a przedmiot idzie prosto do niej.',
  'help.guide.packing-bags.step.4':
    'Panel Torby pojawia się po prawej, gdy tylko istnieje jedna torba: nazwa, waga, pasek wypełnienia, kto ją niesie i ile przedmiotów w niej jest, potem Nieprzypisane i Waga całkowita.',
  'help.guide.packing-bags.step.5':
    'Kliknij Ustaw limit i wpisz limit w kilogramach, tak jak podają go linie lotnicze.',
  'help.guide.packing-bags.step.6': 'Przerywany plus obok nazwy torby mówi, kto ją niesie.',
  'help.guide.packing-bags.result':
    'Panel Torby po prawej pokazuje wagę każdej torby wobec jej limitu, to, co nie jest w żadnej torbie, i sumę.',
  'help.guide.packing-bags.tip.1':
    'Pole wagi, kółko torby i panel Torby istnieją tylko wtedy, gdy administrator ma włączoną Kontrolę bagażu w dodatku Listy.',
  'help.guide.packing-bags.tip.2':
    'Waga torby sumowana jest na serwerze po przedmiotach wszystkich członków, także tych, których nie widzisz, więc ta liczba naprawdę jest tym, ile torba waży.',
  'help.guide.packing-bags.tip.3':
    'Torba bez limitu rysowana jest wobec najcięższej torby, żeby paski pozostały porównywalne. Nadaj jej limit, a pasek będzie czytany wobec niego.',
  // create-todo
  'help.guide.create-todo.title': 'Dodać zadanie',
  'help.guide.create-todo.goal': 'Zapisz coś, co musi się wydarzyć, z listą, priorytetem, datą i imieniem przy tym.',
  'help.guide.create-todo.step.1': 'Kliknij Nowe zadanie u góry po prawej.',
  'help.guide.create-todo.step.2': 'Nazwij je w Nazwa zadania i wpisz wszystko, co warto zapamiętać, pod Opis.',
  'help.guide.create-todo.step.3':
    'Lista grupuje zadanie. Wybierz jedną albo użyj plusa obok, żeby w małym oknie nadać nazwę nowej.',
  'help.guide.create-todo.step.4': 'Priorytet to cztery przyciski: Brak, P1, P2 i P3, od czerwonego do niebieskiego.',
  'help.guide.create-todo.step.5': 'Termin otwiera kalendarz, a Przypisano do umieszcza na zadaniu imię.',
  'help.guide.create-todo.step.6': 'Kliknij Utwórz zadanie.',
  'help.guide.create-todo.result':
    'Zadanie jest na liście ze swoimi odznakami, priorytetem, terminem, listą i osobą, do której jest przypisane, i otwiera się w panelu po prawej.',
  'help.guide.create-todo.tip.1':
    'Wymagana jest tylko nazwa. Wszystko inne da się uzupełnić później z panelu po prawej.',
  'help.guide.create-todo.tip.2': 'Gdy w panelu bocznym wybrana jest lista, nowe zadanie zaczyna w tej liście.',
  'help.guide.create-todo.tip.3': 'Enter w polu nazwy tworzy zadanie od razu, bez dotykania pozostałych pól.',
  // todo-filters
  'help.guide.todo-filters.title': 'Znaleźć i zmienić zadanie',
  'help.guide.todo-filters.goal':
    'Zawęź listę zadań do tego, co teraz ważne, a potem edytuj zadanie, na którym stanąłeś.',
  'help.guide.todo-filters.step.1':
    'Zadania w panelu bocznym: Wszystkie to wszystko, co jeszcze otwarte, Moje zadania to, co na Tobie, Przeterminowane to, co ma datę w przeszłości, Gotowe to, co skończone. Każde niesie swoją liczbę; kliknij Przeterminowane.',
  'help.guide.todo-filters.step.2':
    'Pod Listy siedzi jeden wiersz na listę. Wybranie jednego pokazuje tę listę, razem z ukończonymi zadaniami.',
  'help.guide.todo-filters.step.3':
    'Sortowanie w nagłówku listy zmienia kolejność tego, co na ekranie: Priorytet daje na przód P1, Termin daje na przód najbliższy termin. Tylko jedno z dwóch naraz, a drugie kliknięcie wraca do twojej własnej kolejności.',
  'help.guide.todo-filters.step.4': 'Kliknij zadanie, żeby otworzyć je w panelu po prawej.',
  'help.guide.todo-filters.step.5':
    'Zmień, co trzeba, Opis, Priorytet, Lista, Termin albo Przypisano do, a potem Zapisz zmiany. Pole wyboru w nagłówku panelu odhacza zadanie, a Usuń zabiera je od razu.',
  'help.guide.todo-filters.result':
    'Lista pokazuje tylko zadania, o które prosiłeś, a panel po prawej edytuje to, które wybrałeś.',
  'help.guide.todo-filters.tip.1':
    'Wiersz listy liczy tylko to, co jeszcze otwarte, ale wybranie go pokazuje też ukończone zadania. Wszystkie, Moje zadania i Przeterminowane ukrywają to, co gotowe; Gotowe nie pokazują nic innego.',
  'help.guide.todo-filters.tip.2':
    'Priorytet i Termin w sortowaniu wykluczają się nawzajem, a dopóki któreś jest włączone, wierszy nie da się już przeciągać we własną kolejność.',

  // ── Screen: trip-bookings ─────────────────────────────────────────────────────────────
  'help.ctx.trip-bookings.title': 'Rezerwacje',
  'help.ctx.trip-bookings.summary':
    'Zakładka, która trzyma wszystko zarezerwowane na podróż, co nie jest sposobem przemieszczania się: noclegi, stoliki, bilety, wycieczki, parking. Każda rezerwacja jest kartą w sekcji Oczekująca albo Potwierdzona i niesie swój kod, swój dokument, swoich podróżnych i swój koszt.',
  'help.ctx.trip-bookings.bullet.1':
    'Rezerwacja ręczna u góry po prawej otwiera formularz. Sześć rodzajów, które tworzy, to Zakwaterowanie, Restauracja, Wydarzenie, Wycieczka, Parking i Inne; loty, pociągi i reszta mieszkają w zakładce Transport i nigdy się tu nie pojawiają.',
  'help.ctx.trip-bookings.bullet.2':
    'Importuj z pliku oddaje potwierdzenie parserowi: EML, PDF, PKPass, HTML albo TXT, najwyżej pięć plików po 10 MB. Przycisk jest tam tylko wtedy, gdy serwer potrafi je przeczytać.',
  'help.ctx.trip-bookings.bullet.3':
    'Plakietki obok nagłówka filtrują po rodzaju, każda z własną liczbą, a Wszystko przywraca całość. Gdy rezerwacja wymienia ludzi, rząd awatarów obok plakietek zawęża zakładkę do jednego z nich.',
  'help.ctx.trip-bookings.bullet.4':
    'Karty stoją w dwóch sekcjach, Oczekująca i Potwierdzona, każda ze swoją liczbą. Kliknięcie w nagłówek sekcji składa ją, a to, czy jest otwarta, TREK pamięta dla tej podróży.',
  'help.ctx.trip-bookings.bullet.5':
    'Karta niesie kropkę statusu, rodzaj, tytuł, daty i godziny, Kod rezerwacji, Lokalizację / Adres, to, z czym rezerwacja jest połączona, jej Link, Notatki, Pliki i Podróżnych.',
  'help.ctx.trip-bookings.bullet.6':
    'Ołówek na karcie otwiera ten sam formularz jeszcze raz; kosz pyta raz i rezerwacji już nie ma. Przy zakwaterowaniu odchodzą z nią też jego noce w planie dnia i powiązany wydatek.',
  // create-booking
  'help.guide.create-booking.title': 'Utworzyć rezerwację',
  'help.guide.create-booking.goal':
    'Wstaw do podróży ręcznie restaurację, wydarzenie, wycieczkę, miejsce parkingowe albo cokolwiek innego.',
  'help.guide.create-booking.step.1':
    'Kliknij Rezerwacja ręczna u góry po prawej stronie zakładki. Otwiera się Nowa rezerwacja.',
  'help.guide.create-booking.step.2':
    'Wybierz Rodzaj rezerwacji z listy u góry formularza, obok pola Podróżni. Zakwaterowanie, Restauracja, Wydarzenie, Wycieczka, Parking i Inne to te sześć, które ta zakładka tworzy, a formularz zmienia się razem z wyborem: tylko Zakwaterowanie wymienia swoje daty na zakres dni.',
  'help.guide.create-booking.step.3':
    'Wpisz Tytuł. To jedyne pole, przy którym formularz się upiera, a Dodaj pozostaje martwy, dopóki nic w nim nie ma.',
  'help.guide.create-booking.step.4':
    'Ustaw Datę i Godzinę rozpoczęcia, a także Datę końca i Godzinę zakończenia, jeśli rezerwacja ma koniec. Kalendarze oferują tylko dni wewnątrz podróży, a koniec, który nie jest po początku, mówi to na czerwono i blokuje Dodaj.',
  'help.guide.create-booking.step.5':
    'Wstaw Kod rezerwacji z potwierdzenia i ustaw Status. Oczekująca albo Potwierdzona decyduje, w której z dwóch sekcji wyląduje karta.',
  'help.guide.create-booking.step.6': 'Kliknij Dodaj.',
  'help.guide.create-booking.result':
    'Rezerwacja jest kartą w swojej sekcji, ze swoją plakietką rodzaju, swoimi datami i swoim kodem, a wszyscy pozostali w podróży widzą, jak się pojawia.',
  'help.guide.create-booking.tip.1':
    'Lokalizacja / Adres podpowiada prawdziwe adresy, kiedy piszesz; wybór jednego zastępuje to, co napisałeś, a adres wpisany przez ciebie samego zostaje taki, jaki jest.',
  'help.guide.create-booking.tip.2':
    'Link prowadzi na własną stronę rezerwacji u dostawcy. Karta robi z niego odnośnik, który otwiera się w nowej karcie.',
  'help.guide.create-booking.tip.3':
    'Notatki to Markdown, więc lista albo pogrubiony wiersz zostaną na karcie pokazane jako lista albo pogrubiony wiersz.',
  // booking-hotel
  'help.guide.booking-hotel.title': 'Zarezerwować nocleg',
  'help.guide.booking-hotel.goal':
    'Wprowadź zakwaterowanie tak, żeby liczyło się naraz jako rezerwacja i jako noce w planie dnia.',
  'help.guide.booking-hotel.step.1':
    'Kliknij Rezerwacja ręczna i wybierz Zakwaterowanie. Pola z datami znikają, a ich miejsce zajmuje blok pól hotelowych.',
  'help.guide.booking-hotel.step.2':
    'Wybierz hotel pod Zakwaterowanie. Ta lista to własne miejsca podróży, a wybór jednego wpisuje jego nazwę w Tytuł, a jego adres w Lokalizacja / Adres.',
  'help.guide.booking-hotel.step.3':
    'Ustaw Od i Do: pierwszą noc i poranek, w którym wyjeżdżasz. Oba oferują dni podróży z ich datami i oba trzymają się nawzajem w porządku.',
  'help.guide.booking-hotel.step.4':
    'Wypełnij Zameldowanie, Check-in do i Wymeldowanie, oraz Kod rezerwacji z potwierdzenia.',
  'help.guide.booking-hotel.step.5': 'Kliknij Dodaj.',
  'help.guide.booking-hotel.result':
    'Karta niesie zakres dni zamiast daty, z godzinami zameldowania i wymeldowania oraz z adresem, a ten sam pobyt siedzi teraz w tych dniach planu.',
  'help.guide.booking-hotel.tip.1':
    'Zakwaterowanie to jedyny rodzaj bez pola Data i Godzina rozpoczęcia. Jego datami są Od i Do, a to dni podróży, nie kalendarz.',
  'help.guide.booking-hotel.tip.2':
    'Zostaw Zakwaterowanie puste i wpisz zamiast tego adres: miejsce zostanie wyszukane, utworzone i przypięte na mapie za ciebie.',
  'help.guide.booking-hotel.tip.3': 'Usunięcie rezerwacji zabiera razem z nią noce z planu dnia.',
  // link-booking
  'help.guide.link-booking.title': 'Powiązać rezerwację z planem',
  'help.guide.link-booking.goal':
    'Zawieś rezerwację na przystanku i miejscu, do którego należy, żeby pojawiła się tam, gdzie będzie ci potrzebna.',
  'help.guide.link-booking.step.1': 'Kliknij ołówek na karcie, którą chcesz powiązać. Otwiera się Edytuj rezerwację.',
  'help.guide.link-booking.step.2':
    'Otwórz Przypisz do miejsca. Ta lista to twój plan: nagłówek na każdy dzień, a potem przystanki tego dnia, ponumerowane i ze swoimi godzinami. Wybierz ten, do którego rezerwacja należy.',
  'help.guide.link-booking.step.3':
    'Miejsce / Aktywność wiąże samo miejsce. Wybierz je tam, a Tytuł i Lokalizacja / Adres wypełnią się wszędzie tam, gdzie zostawiłeś je puste.',
  'help.guide.link-booking.step.4': 'Kliknij Aktualizuj.',
  'help.guide.link-booking.result':
    'Karta wymienia dzień i przystanek pod Przypisz do miejsca, a rezerwacja jedzie razem z tym przystankiem w planie dnia.',
  'help.guide.link-booking.tip.1':
    'Brak przypisania (samodzielna) na górze listy zdejmuje powiązanie z powrotem. Zakwaterowanie nie ma wyboru przystanku w ogóle: wiąże się przez swoje noce.',
  'help.guide.link-booking.tip.2':
    'Wybór przystanku w dniu z datą wypełnia za ciebie pustą Datę. Data, którą już ustawiłeś, zostaje nietknięta.',
  // booking-travelers
  'help.guide.booking-travelers.title': 'Powiedzieć, dla kogo jest rezerwacja',
  'help.guide.booking-travelers.goal':
    'Zaznacz podróżnych, których rezerwacja obejmuje, a potem oglądaj tylko ich rezerwacje.',
  'help.guide.booking-travelers.step.1':
    'Otwórz rezerwację ołówkiem. Pole Podróżni jest u góry formularza, obok pola Rodzaj rezerwacji, i dopóki nikogo nie ma w rezerwacji, pokazuje Przypisz podróżnych.',
  'help.guide.booking-travelers.step.2':
    'Kliknij je i wybierz ludzi, dla których ta rezerwacja jest; nazwani goście też są na liście. Wybrany dostaje ptaszka i swój awatar w polu. Kliknij imię jeszcze raz, żeby go zdjąć.',
  'help.guide.booking-travelers.step.3': 'Kliknij Aktualizuj.',
  'help.guide.booking-travelers.step.4':
    'Na górze, w pasku obok plakietek rodzajów, kliknij awatar podróżnego, żeby zobaczyć tylko jego rezerwacje.',
  'help.guide.booking-travelers.result':
    'Karta wypisuje ludzi, dla których jest, a rząd awatarów zawęża zakładkę do jednego z nich.',
  'help.guide.booking-travelers.tip.1':
    'Na karcie podróżni są tylko pokazywani, nigdy zmieniani. Ustawia się ich tutaj, w formularzu.',
  'help.guide.booking-travelers.tip.2':
    'Rząd awatarów pojawia się, gdy podróż ma więcej niż jednego uczestnika i przynajmniej jedna rezerwacja kogoś wymienia. To, co wybierzesz, trzyma się przez tę sesję przeglądarki.',
  // booking-files
  'help.guide.booking-files.title': 'Trzymać voucher przy rezerwacji',
  'help.guide.booking-files.goal': 'Dołącz potwierdzenie, bilet albo przepustkę do rezerwacji, do której należą.',
  'help.guide.booking-files.step.1':
    'Otwórz rezerwację ołówkiem, zjedź w dół do Pliki i kliknij Załącz plik. Przy rezerwacji, która już istnieje, dokument idzie w górę od razu, a TREK mówi Plik został przesłany.',
  'help.guide.booking-files.step.2':
    'Dokument jest wypisany swoją nazwą, z przyciskiem, który go otwiera, i z krzyżykiem obok.',
  'help.guide.booking-files.step.3':
    'Podlinkuj przesłany plik oferuje dokumenty podróży, których przy tej rezerwacji jeszcze nie ma. Wybierz jeden, a zostanie dołączony bez ponownego przesyłania czegokolwiek.',
  'help.guide.booking-files.step.4': 'Kliknij Aktualizuj.',
  'help.guide.booking-files.result': 'Karta wypisuje dokumenty pod Pliki, a kliknięcie w jeden z nich go otwiera.',
  'help.guide.booking-files.tip.1':
    'Przy rezerwacji, którą dopiero tworzysz, dokument czeka i idzie w górę w chwili, gdy klikniesz Dodaj.',
  'help.guide.booking-files.tip.2':
    'Krzyżyk obok dokumentu zabiera powiązanie, nie dokument. Ten zostaje w zakładce Pliki podróży.',
  'help.guide.booking-files.tip.3':
    'To, jakie rodzaje plików wolno dołączać, jest listą administratora; dokumenty, tekst i obrazy są dozwolone od razu.',
  // booking-cost
  'help.guide.booking-cost.title': 'Zamienić cenę rezerwacji w koszt',
  'help.guide.booking-cost.goal':
    'Przenieś to, ile rezerwacja kosztuje, do Kosztów, podzielone między ludzi, którzy za nią płacą.',
  'help.guide.booking-cost.step.1':
    'Otwórz rezerwację i zjedź na sam dół formularza. Pod Koszty stoją Utwórz wydatek i Powiąż istniejący wydatek, z notką Zapisuje rezerwację i otwiera edytor kosztów.',
  'help.guide.booking-cost.step.2':
    'Kliknij Utwórz wydatek. Rezerwacja zostaje zapisana, jej formularz się zamyka i otwiera się edytor kosztów.',
  'help.guide.booking-cost.step.3':
    'Na co to było? to już tytuł rezerwacji. Wstaw Łączną kwotę i sprawdź Walutę oraz Dzień.',
  'help.guide.booking-cost.step.4':
    'Kategoria jest tą, którą podpowiada rodzaj rezerwacji. Ustaw Kto zapłacił? i to, jak kwota się dzieli.',
  'help.guide.booking-cost.step.5': 'Kliknij Dodaj wydatek.',
  'help.guide.booking-cost.result':
    'Formularz rezerwacji pokazuje teraz wydatek pod Powiązane wydatki z jego kwotą, a ten sam wydatek stoi w zakładce Koszty, związany z tą rezerwacją.',
  'help.guide.booking-cost.tip.1':
    'Kategoria idzie za rodzajem: z Restauracji robi się Jedzenie i napoje, z Zakwaterowania Nocleg, z Parkingu Parking, a Wydarzenie i Wycieczka lądują oba w Inne.',
  'help.guide.booking-cost.tip.2':
    'Rezerwacja może nieść kilka wydatków. Powiąż istniejący wydatek proponuje te z Kosztów, które jeszcze do niczego nie należą. Przy powiązanym Odłącz, zachowaj wydatek go odpina i zostawia w Kosztach, a kosz go usuwa.',
  'help.guide.booking-cost.tip.3':
    'Blok Koszty jest w formularzu tylko wtedy, gdy dodatek Koszty jest włączony, a przełącza go administrator pod Dodatki.',
  // filter-bookings
  'help.guide.filter-bookings.title': 'Znaleźć rezerwację',
  'help.guide.filter-bookings.goal': 'Zawęź długą zakładkę do rodzaju, osoby albo stanu, którego szukasz.',
  'help.guide.filter-bookings.step.1':
    'Plakietki obok nagłówka to rodzaje, których ta podróż naprawdę używa, każda z liczbą, którą trzyma. Wszystko to cała zakładka.',
  'help.guide.filter-bookings.step.2':
    'Kliknij plakietkę, żeby zostawić tylko ten rodzaj. Kliknij drugą, a zostaną oba.',
  'help.guide.filter-bookings.step.3': 'Wszystko przywraca całość.',
  'help.guide.filter-bookings.step.4': 'Awatary obok plakietek filtrują po podróżnym, jednej osobie albo kilku naraz.',
  'help.guide.filter-bookings.step.5':
    'Oczekująca i Potwierdzona to te dwie sekcje, każda ze swoją liczbą. Kliknij nagłówek, żeby jedną złożyć; zostanie złożona, gdy wrócisz.',
  'help.guide.filter-bookings.result':
    'Zakładka pokazuje tylko to, co wybrałeś, i nadal jest to wybrane, gdy wrócisz do niej w tej sesji przeglądarki.',
  'help.guide.filter-bookings.tip.1':
    'Plakietki oferują tylko rodzaje, które podróż ma, więc podróż bez ani jednej wycieczki nie ma plakietki Wycieczka.',
  'help.guide.filter-bookings.tip.2':
    'Filtr, który nic nie znajduje, zostawia zakładkę pustą z Nie znaleziono miejsc. To brzmienie jest z listy miejsc; sens jest ten sam.',
  // import-booking-file
  'help.guide.import-booking-file.title': 'Odczytać rezerwację z jej potwierdzenia',
  'help.guide.import-booking-file.goal':
    'Pozwól TREK-owi wyciągnąć rezerwację z maila albo z PDF, który przysłał dostawca, zamiast wpisywać ją jeszcze raz.',
  'help.guide.import-booking-file.step.1':
    'Kliknij Importuj z pliku w pasku. Otwiera się Importuj potwierdzenia rezerwacji.',
  'help.guide.import-booking-file.step.2':
    'Upuść potwierdzenia na to pole albo kliknij je i wybierz je: EML, PDF, PKPass, HTML i TXT, do pięciu plików po 10 MB. Te, które wybrałeś, są wypisane na polu po nazwie.',
  'help.guide.import-booking-file.step.3': 'Kliknij Importuj. Okno zamyka się od razu, bo czytanie dzieje się w tle.',
  'help.guide.import-booking-file.step.4':
    'Karta na dole po prawej relacjonuje przebieg pod nazwą pliku i idzie z Tobą przez aplikację oraz przez przeładowanie. Przetwarzanie plików… zmienia się w haczyk, gdy czytanie jest skończone, a karta oferuje Importuj. Kliknij to.',
  'help.guide.import-booking-file.result':
    'Rezerwacja jest kartą w Oczekująca ze swoimi nocami, swoim kodem i potwierdzeniem pod Pliki, pobyt siedzi na tych dniach planu, a przy włączonych Kosztach cena jest wydatkiem z nią związanym.',
  'help.guide.import-booking-file.tip.1':
    'Importuj z pliku jest tam tylko wtedy, gdy serwer potrafi czytać potwierdzenia, a do tego potrzeba albo ekstraktora, albo dodatku Analiza AI. Ten administrator przełącza pod Dodatki.',
  'help.guide.import-booking-file.tip.2':
    'Jeśli nic nie dało się odczytać, karta to mówi i oferuje Try AI parsing, co wysyła te same pliki prosto do modelu. Gotowe przetworzenie trzyma się dziesięć minut; uruchom przegląd wewnątrz tego okna.',
  'help.guide.import-booking-file.tip.3':
    'Potwierdzenie jest załączane tylko wtedy, gdy jego typ jest w Dozwolone typy plików w ustawieniach administracyjnych. PDF jest tam od razu; mail, EML, trzeba najpierw dodać, inaczej rezerwacja jest zapisywana bez niego.',
  // edit-booking
  'help.guide.edit-booking.title': 'Zmienić rezerwację',
  'help.guide.edit-booking.goal':
    'Popraw godzinę, dopisz kod, który przyszedł później, albo przenieś rezerwację z Oczekująca do Potwierdzona.',
  'help.guide.edit-booking.step.1':
    'Kliknij ołówek w nagłówku karty. Otwiera się Edytuj rezerwację ze wszystkim, co rezerwacja wie.',
  'help.guide.edit-booking.step.2':
    'Zmień to, co trzeba zmienić, tutaj Kod rezerwacji, który operator w końcu przysłał.',
  'help.guide.edit-booking.step.3': 'Ustaw Status na Potwierdzona.',
  'help.guide.edit-booking.step.4': 'Kliknij Aktualizuj.',
  'help.guide.edit-booking.result':
    'Karta się przenosi: potwierdzona rezerwacja stoi w sekcji Potwierdzona za zieloną kropką, a wszyscy w podróży widzą, jak się przenosi.',
  'help.guide.edit-booking.tip.1':
    'Kod rezerwacji, którego nie da się odczytać, to Rozmyj kody rezerwacji w Ustawieniach, pod Wygląd. Najedź na niego albo kliknij go, a staje się czytelny.',
  'help.guide.edit-booking.tip.2':
    'Zmień rodzaj, a kategoria powiązanego wydatku idzie za nim, chyba że wybrałeś kategorię ręcznie w edytorze kosztów.',
  'help.guide.edit-booking.tip.3':
    'Zakwaterowanie edytuje się również tutaj: jego dni Od i Do są w tym samym formularzu.',
  // delete-booking
  'help.guide.delete-booking.title': 'Usunąć rezerwację',
  'help.guide.delete-booking.goal': 'Zabierz z podróży rezerwację, z której nic nie wyszło.',
  'help.guide.delete-booking.step.1': 'Kliknij kosz w nagłówku karty.',
  'help.guide.delete-booking.step.2':
    'Usunąć rezerwację? wymienia tę, którą wybrałeś, i mówi, że zostanie trwale usunięta.',
  'help.guide.delete-booking.step.3': 'Kliknij Potwierdź.',
  'help.guide.delete-booking.result':
    'Karty już nie ma, dla wszystkich w podróży. Rezerwacja nie ma cofnięcia, więc to pytanie jest ostatnim przystankiem.',
  'help.guide.delete-booking.tip.1':
    'Usunięcie rezerwacji zakwaterowania zabiera także jego noce z planu dnia i usuwa wydatek, który był z nim powiązany.',
  'help.guide.delete-booking.tip.2':
    'Dokumenty, które były dołączone, zostają w zakładce Pliki podróży; odchodzi tylko ich powiązanie z rezerwacją.',
  // import-booking-file
  'help.guide.import-booking-file.step.5':
    'Każda znaleziona rezerwacja otwiera się w Nowa rezerwacja, jedna po drugiej, już wypełniona. Dla hotelu to nazwa w Tytuł i, gdy podróż ma to miejsce, pod Zakwaterowanie, jego Lokalizacja / Adres, Od i Do na jego nocach, Zameldowanie i Wymeldowanie, Kod rezerwacji, potwierdzenie pod Pliki i, przy włączonych Kosztach, cena jako Powiązany wydatek. Sprawdź to i kliknij Dodaj.',

  // ── Screen: trip-costs ────────────────────────────────────────────────────────────────
  'help.ctx.trip-costs.title': 'Koszty',
  'help.ctx.trip-costs.summary':
    'Pieniądze podróży: każdy wydatek jako datowany rejestr, kto go wyłożył i kto jest za niego winien, w tej walucie, w której był paragon, a w prawej kolumnie, kto komu ma zapłacić, żeby znów było równo.',
  'help.ctx.trip-costs.bullet.1':
    'Cztery karty u góry: Jesteś winien i Należy ci się to twoja własna strona rozliczenia, Kwota nierozliczona to, co jest zapisane, ale nie ma jeszcze płatnika, a Łączne wydatki na podróż sumują wszystko i pokazują pod spodem Twój udział oraz Zapłaciłeś.',
  'help.ctx.trip-costs.bullet.2':
    'Dodaj wydatek u góry po prawej otwiera edytor; Rozlicz obok zapisuje wszystkie otwarte przelewy naraz.',
  'help.ctx.trip-costs.bullet.3':
    'Rejestr jest pogrupowany po dniach, najnowsze pierwsze, z sumą tego dnia po prawej. Wiersz niesie kategorię jako kolorową zakładkę, nazwę, żetony płacących, notatkę i kwotę, a do tego pożyczyłeś albo pożyczyłeś od innych, gdy podział zostawia cię na plusie lub na minusie.',
  'help.ctx.trip-costs.bullet.4':
    'Nad listą siedzą Szukaj wydatków…, filtr kategorii, filtr dni, przełącznik Wszystkie / Opłacone przeze mnie / Należy mi się i przycisk Eksportuj CSV.',
  'help.ctx.trip-costs.bullet.5':
    'Prawa kolumna to odpowiedź: Rozlicz wypisuje, kto komu płaci, Salda pokazują nadwyżkę lub niedobór każdego podróżnego, Budżet końcowy to, ile podróż kosztuje każdego z nich, a Według kategorii to, gdzie poszły pieniądze.',
  'help.ctx.trip-costs.bullet.6':
    'Zapisana płatność siedzi w tym samym rejestrze jako własny wiersz, z Edytuj i Cofnij obok; wydatek ma ołówek i kosz, a kosz usuwa go bez pytania.',
  // add-expense
  'help.guide.add-expense.title': 'Dodać wydatek',
  'help.guide.add-expense.goal': 'Zapisz, ile coś kosztowało, kto zapłacił i z kim jest to dzielone.',
  'help.guide.add-expense.step.1':
    'Kliknij Dodaj wydatek u góry po prawej na zakładce Koszty. Otwiera się edytor, z dzisiejszą datą i ze wszystkimi już w podziale.',
  'help.guide.add-expense.step.2':
    'Wpisz, na co to było, w pole Na co to było?, jedyne, które musi być wypełnione, a kwotę z paragonu w Łączna kwota.',
  'help.guide.add-expense.step.3':
    'Waluta i Dzień siedzą pod kwotą. Waluta zaczyna od waluty podróży; zmień ją, a edytor pokaże, ile kwota jest warta w walucie podróży. Dzień zaczyna od dzisiaj i to pod nim rejestr grupuje wydatek.',
  'help.guide.add-expense.step.4':
    'Wybierz Kategoria. Jest ich czternaście i nie da się ich zmienić: ta, którą wybierzesz, jest kolorową zakładką w wierszu i słupkiem w Według kategorii.',
  'help.guide.add-expense.step.5':
    'Pod Kto zapłacił? wybierz osobę, która naprawdę wyłożyła pieniądze. Ty jest wybrane z góry; Nikt jeszcze nie zapłacił zapisuje kwotę, nie czyniąc nikogo winnym za nią, a Zapłaciło kilka osób dzieli rachunek między kilku płacących.',
  'help.guide.add-expense.step.6':
    'Split zaczyna od Equally ze wszystkimi włączonymi, a przy każdym nazwisku widać udział, który z tego wychodzi. Kliknij Dodaj wydatek, żeby zapisać.',
  'help.guide.add-expense.result':
    'Wydatek jest w rejestrze pod swoim dniem, policzony do Łączne wydatki na podróż, a kolumna rozliczenia przeliczyła na nowo, kto komu jest winien.',
  'help.guide.add-expense.tip.1':
    'Zostawiony tak, jak się otwiera, wydatek jest w walucie podróży, z dzisiejszą datą i podzielony po równo między wszystkich: naprawdę wypełnić trzeba tylko nazwę i kwotę.',
  'help.guide.add-expense.tip.2':
    '± obok kwoty zamienia wydatek w zwrot. Ujemna suma oddaje pieniądze, zamiast je brać, a podział idzie w drugą stronę.',
  'help.guide.add-expense.tip.3':
    'Załącz paragon / fakturę na dole przyjmuje obrazy i pliki PDF. Wysyłają się przy zapisie, lądują w Pliki podróży, a obok nazwy na liście pojawia się plakietka Paragony.',
  // expense-payers
  'help.guide.expense-payers.title': 'Powiedzieć, kto zapłacił rachunek',
  'help.guide.expense-payers.goal': 'Zapisz, kto wyłożył pieniądze na wydatek, druga połowa matematyki rozliczenia.',
  'help.guide.expense-payers.step.1':
    'Otwórz wydatek ołówkiem obok jego wiersza i spójrz na Kto zapłacił?. Zapłaciła jedna osoba jest domyślne: lista rozwijana wskazuje jedną osobę, która wyłożyła pieniądze.',
  'help.guide.expense-payers.step.2':
    'Nikt jeszcze nie zapłacił, pierwsza pozycja tej listy, zapisuje kwotę, nie czyniąc nikogo nic winnym. Wydatek nadal liczy się do Łączne wydatki na podróż.',
  'help.guide.expense-payers.step.3':
    'Zapłaciło kilka osób, odnośnik obok etykiety, otwiera wiersz na każdego podróżnego. Dodaj tych, którzy zapłacili, i wpisz, ile każdy z nich włożył; kwoty muszą sumować się do łącznej kwoty.',
  'help.guide.expense-payers.step.4':
    'Wydatek, za który nikt nie zapłacił, jest oznaczony Niezakończone w swoim wierszu i liczony do karty Kwota nierozliczona, gdzie zbierają się zapisane, ale nierozliczone wydatki.',
  'help.guide.expense-payers.result':
    'Kto zapłacił decyduje, komu się oddaje, podział decyduje, kto płaci, a Salda to różnica między jednym a drugim.',
  'help.guide.expense-payers.tip.1':
    'Kto zapłacił? i Split są niezależne: możesz zapłacić za kolację, na której cię nie było, i trafić do podziału kolacji, za którą nie płaciłeś.',
  'help.guide.expense-payers.tip.2':
    'Przy kilku płacących kwoty muszą sumować się do łącznej kwoty. Dodaj jeszcze jedną osobę, a pozostałe przestawią się wokół niej; dopóki się nie zgadzają, edytor mówi, ile mają dać w sumie, i odmawia zapisu.',
  'help.guide.expense-payers.tip.3':
    'Usunięcie płacącego nie usuwa wydatku: kwota zostaje w Łączne wydatki na podróż, a wiersz staje się Niezakończone.',
  // split-expense
  'help.guide.split-expense.title': 'Podzielić rachunek między podróżnych',
  'help.guide.split-expense.goal':
    'Zdecyduj, kto jest winien za wydatek: wszyscy po równo, kwotowo albo linia po linii z paragonu.',
  'help.guide.split-expense.step.1':
    'W edytorze wydatku Split wypisuje każdego podróżnego. Kliknij nazwisko, żeby zostawić go poza tym wydatkiem; pominięty podróżny ma przy sobie Pominięty i nic za niego nie jest winien.',
  'help.guide.split-expense.step.2':
    'Equally jest domyślne: każdy włączony podróżny dostaje taki sam udział, a wiersz pod listą mówi, na ile części jest to podzielone i ile wychodzi każdy udział.',
  'help.guide.split-expense.step.3':
    'Custom zamienia udziały na pola z kwotami. Wpisz, ile każdy podróżny jest winien; wiersz pod spodem liczy na bieżąco i zielenieje na Podział zgadza się z sumą. Dopóki się nie zgadza, nie zapisze.',
  'help.guide.split-expense.step.4':
    'Ticket dzieli paragon linia po linii: Dodaj pozycję, potem nazwa i cena na każdą linię, a pod Dzielone między: podróżni, którzy dzielą tę linię.',
  'help.guide.split-expense.step.5':
    'Udział każdej osoby pod liniami pokazuje, ile każdy podróżny ostatecznie jest winien, a Łączna kwota u góry sumuje się z linii. Kliknij Zapisz.',
  'help.guide.split-expense.result':
    'Podział jest tym, z czego zbudowane jest każde saldo. Zapisuje się z wydatkiem i można go zmienić później, nie ruszając niczego innego.',
  'help.guide.split-expense.tip.1':
    'Podróżny, którego pominiesz, ma przy sobie Pominięty i nic za ten jeden wydatek nie jest winien; pozostali biorą jego udział.',
  'help.guide.split-expense.tip.2':
    'Equally jest dokładne co do centa: pozostały cent krąży od wydatku do wydatku, więc nie ma nikogo, kto zawsze go płaci.',
  'help.guide.split-expense.tip.3': 'Tryb Ticket sam sumuje Łączna kwota i wyszarza to pole: linie paragonu są sumą.',
  // expense-currency
  'help.guide.expense-currency.title': 'Wprowadzić wydatek w innej walucie',
  'help.guide.expense-currency.goal': 'Wpisz to, co naprawdę mówi paragon, i zostaw kurs TREK-owi.',
  'help.guide.expense-currency.step.1':
    'Otwórz Dodaj wydatek i wypełnij nazwę oraz kwotę dokładnie tak, jak mówi paragon, samą liczbę, a nie jej przeliczenie.',
  'help.guide.expense-currency.step.2':
    'Otwórz Waluta i wybierz walutę paragonu. Lista niesie każdy kod, który TREK zna, i da się w niej szukać: wpisz te trzy litery.',
  'help.guide.expense-currency.step.3':
    'Pod polami pojawia się wiersz z tym, ile kwota jest warta w tej chwili, oznaczony kurs na żywo. To podgląd, a nie to, co zostaje zapisane.',
  'help.guide.expense-currency.step.4':
    'Kliknij Dodaj wydatek. Kurs zostaje w tym momencie zamrożony: od teraz ten wydatek jest wart tyle, ile był wart w dniu, w którym go wprowadziłeś.',
  'help.guide.expense-currency.step.5':
    'W rejestrze wiersz niesie pod nazwą obie liczby: to, co wpisałeś, strzałkę i to, ile liczy się w walucie podróży. Każda suma, saldo i rozliczenie powyżej używa tej drugiej.',
  'help.guide.expense-currency.result':
    'Wydatek zachowuje kwotę i walutę, które wpisałeś. Rejestr pokazuje obie, a sumy i salda podróży zostają w walucie podróży.',
  'help.guide.expense-currency.tip.1':
    'Kurs zostaje zamrożony w chwili zapisu, więc rozliczony dług nie otwiera się na nowo dlatego, że rynek ruszył tydzień później. Nowy kurs zamraża jedynie zmiana waluty wydatku.',
  'help.guide.expense-currency.tip.2':
    'Waluta wyświetlania w Ustawieniach zmienia tylko to, co czytasz; zapisane kwoty nigdy się nie ruszają. Zostawiona pusta, każda podróż pokazuje się we własnej walucie.',
  'help.guide.expense-currency.tip.3':
    'Sama waluta podróży mieszka na podróży, pod Edytuj podróż, i wymaga prawa Edytowanie podróży. Jej zmiana zakotwicza na nowo każdy zamrożony kurs, zamiast przeliczać kwoty na inną walutę.',
  // filter-costs
  'help.guide.filter-costs.title': 'Znaleźć wydatek albo wydatki jednego dnia',
  'help.guide.filter-costs.goal': 'Zawęź długi rejestr do tego, czego naprawdę szukasz.',
  'help.guide.filter-costs.step.1': 'Pisz w Szukaj wydatków… nad listą. Dopasowuje nazwę wydatku, gdy piszesz.',
  'help.guide.filter-costs.step.2':
    'Wszystkie kategorie otwierają te czternaście kategorii. Wybierz jedną, a zostaną tylko wydatki tej kategorii.',
  'help.guide.filter-costs.step.3':
    'Wszystkie dni wypisują każdy dzień, w którym coś wydano. Wybierz jeden, a baner zastąpi nagłówki dni tym dniem, liczbą wydatków, które trzyma, i jego sumą.',
  'help.guide.filter-costs.step.4':
    'Przełącznik Wszystkie / Opłacone przeze mnie / Należy mi się to twój własny widok rejestru: za co wyłożyłeś pieniądze i za co nadal ci się należy.',
  'help.guide.filter-costs.step.5':
    'Eksportuj CSV na końcu wiersza zapisuje każdy wydatek do pliku, z oryginalną kwotą, jej walutą i kwotą przeliczoną.',
  'help.guide.filter-costs.result':
    'Filtry łączą się, a grupy dni rysują się na nowo z własnymi sumami dla tego, co zostanie.',
  'help.guide.filter-costs.tip.1':
    'Zapisane płatności nie niosą nazwy ani kategorii, więc wyszukiwanie albo filtr kategorii je ukrywa. Filtr dni je zostawia, pod dniem, w którym płatność została zapisana.',
  'help.guide.filter-costs.tip.2':
    'Eksportuj CSV zawsze eksportuje każdy wydatek, niezależnie od tego, co jest odfiltrowane na ekranie, jeden wiersz na wydatek.',
  // settle-up
  'help.guide.settle-up.title': 'Ustalić, kto komu jest winien, i rozliczyć to',
  'help.guide.settle-up.goal':
    'Zamień stos wspólnych wydatków w najmniejszą liczbę przelewów, które wyrównują wszystkich, i zapisuj je, gdy się dzieją.',
  'help.guide.settle-up.step.1':
    'Karta Rozlicz w prawej kolumnie wypisuje przelewy, które wyrównałyby wszystkich: kto komu płaci i ile. Liczba obok tytułu to tyle, ile jest jeszcze otwartych.',
  'help.guide.settle-up.step.2':
    'Rozlicz obok przelewu zapisuje go jako wykonany. Ten przepływ znika z karty, a salda rysują się na nowo.',
  'help.guide.settle-up.step.3':
    'Zapisany przelew jest wierszem w rejestrze, pod dniem, w którym się zdarzył, oznaczonym Płatność, z dwoma podróżnymi i kwotą.',
  'help.guide.settle-up.step.4':
    'Obok tego wiersza ołówek poprawia płatność, a Cofnij cofa ją, i przelew wraca na kartę Rozlicz.',
  'help.guide.settle-up.step.5':
    'Dodaj płatność w nagłówku karty zapisuje przelew, który nie poszedł za podpowiedzią. Wybierz Od i Do, kwotę, jej walutę i dzień, w którym się zdarzył.',
  'help.guide.settle-up.step.6':
    'Rozlicz w nagłówku u góry ekranu zapisuje wszystkie otwarte przelewy naraz, tak jak grupa rozlicza się na koniec podróży.',
  'help.guide.settle-up.result':
    'Każdy zapisany przelew jest wierszem w rejestrze i wierszem mniej na karcie Rozlicz. Gdy karta mówi Wszyscy rozliczeni, podróż jest spłacona.',
  'help.guide.settle-up.tip.1':
    'Karta pokazuje najmniejszą liczbę przelewów, a nie każdy dług: trzy osoby winne sobie w kółko zwijają się do jednej lub dwóch płatności.',
  'help.guide.settle-up.tip.2':
    'Rozlicz zapisuje przelew, nie przenosi pieniędzy. Wyślij je tak, jak zwykle to robisz, a potem kliknij.',
  'help.guide.settle-up.tip.3':
    'Płatność może być w dowolnej walucie, więc spłata długu w jenach w euro jest normalna: okno ma własny wybór waluty i też zamraża ten kurs.',
  // final-budget
  'help.guide.final-budget.title': 'Zobaczyć, ile podróż kosztowała każdego podróżnego',
  'help.guide.final-budget.goal':
    'Przeczytaj stronę rejestru liczoną na osobę: saldo na dziś i rzeczywisty koszt na osobę.',
  'help.guide.final-budget.step.1':
    'Salda pokazują pozycję każdego podróżnego: zielony pasek w prawo, jeśli podróż jest mu winna, czerwony pasek w lewo, jeśli to on jest jej winien, i kwotę obok nazwiska.',
  'help.guide.final-budget.step.2':
    'Budżet końcowy pod nimi odpowiada na inne pytanie: nie to, kto jest teraz komu winien, ale ile podróż kosztuje każdego podróżnego, gdy wszystko zostanie oddane.',
  'help.guide.final-budget.step.3':
    'Kliknij nazwisko, żeby otworzyć rachunek: Zapłacone wydatki, potem Zwroty netto i Oczekujące zwroty pod spodem.',
  'help.guide.final-budget.step.4':
    'Pod każdą linią siedzą wiersze, z których się składa: wydatki, za które ten podróżny zapłacił, przelewy już zapisane i te wciąż otwarte. Sumują się dokładnie do linii nad nimi.',
  'help.guide.final-budget.result':
    'Salda to, kto jest dziś na plusie lub na minusie; Budżet końcowy to, ile podróż ostatecznie kosztuje każdego z was, gdy wszystko zostanie oddane.',
  'help.guide.final-budget.tip.1':
    'Zapisanie płatności nie zmienia nikomu budżetu końcowego. Przenosi tylko kwotę z oczekujących zwrotów do zwrotów netto.',
  'help.guide.final-budget.tip.2':
    'Wydatek bez płatnika zostaje poza obiema kartami, tak samo jak zostaje poza podpowiedziami rozliczenia.',
  // expense-from-booking
  'help.guide.expense-from-booking.title': 'Zamienić rezerwację w wydatek',
  'help.guide.expense-from-booking.goal':
    'Dołącz to, ile lot, hotel albo miejsce naprawdę kosztowały, do wpisu, do którego należą.',
  'help.guide.expense-from-booking.step.1':
    'Otwórz rezerwację na zakładce Transport albo Rezerwacje i kliknij jej ołówek.',
  'help.guide.expense-from-booking.step.2':
    'Przewiń do bloku Koszty na dole formularza. Oferuje Utwórz wydatek, który najpierw zapisuje rezerwację, i Powiąż istniejący wydatek dla takiego, który już jest w Kosztach.',
  'help.guide.expense-from-booking.step.3':
    'Kliknij Utwórz wydatek. Rezerwacja zostaje zapisana, formularz się zamyka, a edytor Koszty otwiera się z tytułem rezerwacji jako nazwą i jej typem już dopasowanym do kategorii.',
  'help.guide.expense-from-booking.step.4':
    'Wypełnij kwotę i jej walutę, kto zapłacił i podział jak przy każdym wydatku, i zapisz. Ponowne otwarcie rezerwacji pokazuje go teraz pod Powiązane wydatki, z ołówkiem do edycji, Odłącz, zachowaj wydatek do odpięcia i koszem do usunięcia.',
  'help.guide.expense-from-booking.result':
    'Rezerwacja niesie swój koszt, a wydatek jest zwykłym wierszem na zakładce Koszty, z płacącym, podziałem i walutą jak każdy inny.',
  'help.guide.expense-from-booking.tip.1':
    'Usunięcie rezerwacji usuwa razem z nią powiązane wydatki. Usuń wydatek w bloku Koszty rezerwacji robi odwrotnie: wydatek znika, rezerwacja zostaje. Odłącz, zachowaj wydatek zachowuje jedno i drugie.',
  'help.guide.expense-from-booking.tip.2':
    'Miejsce ma ten sam blok w swoim formularzu, gdzie Utwórz wydatek najpierw zapisuje miejsce.',

  // ── Screen: trip-transports ───────────────────────────────────────────────────────────
  'help.ctx.trip-transports.title': 'Transport',
  'help.ctx.trip-transports.summary':
    'Wszystko, co wozi Cię między przystankami: loty, pociągi, autobusy, samochody, taksówki, rowery, rejsy, promy i połączenia transportu publicznego, które TREK wyszukuje za Ciebie. Zakładka jest ich listą; powstają i są czytane także w planie, a na mapie są rysowane.',
  'help.ctx.trip-transports.bullet.1':
    'Zakładka trzyma tylko przejazdy. Noclegi, restauracje, wydarzenia i bilety mieszkają w Rezerwacjach, więc ten sam wpis nigdy nie pojawia się dwa razy.',
  'help.ctx.trip-transports.bullet.2':
    'Pasek narzędzi liczy je wszystkie pod Wszystko i daje każdemu używanemu rodzajowi własny chip z własnym licznikiem: Lot, Pociąg, Samochód, Transport publiczny. Transport po prawej dodaje jeden ręcznie.',
  'help.ctx.trip-transports.bullet.3':
    'Karty przychodzą w trzech grupach, każdą można złożyć jej nagłówkiem: Automatyczny transport publiczny dla połączeń zaplanowanych przez wyszukiwarkę, potem Oczekująca, potem Potwierdzona.',
  'help.ctx.trip-transports.bullet.4':
    'Karta niesie status, rodzaj, dni, przez które się rozciąga, godziny, Kod rezerwacji, trasę oraz Linię lotniczą i Numer lotu albo Numer pociągu, Peron i Miejsce. Ołówek ją otwiera, kosz kasuje ją po pytaniu.',
  'help.ctx.trip-transports.bullet.5':
    'Transport powstaje też w planie: każdy nagłówek dnia ma plus dla Dodaj transport i przycisk tramwaju dla Transportu publicznego, a łącznik z czasem przejazdu między dwoma przystankami otwiera to samo wyszukiwanie dla tego jednego odcinka.',
  'help.ctx.trip-transports.bullet.6':
    'Transport z ustawionymi obydwoma końcami rysuje linię na mapie. Ikona trasy w jego wierszu w planie dnia włącza tę linię, a Pokaż wszystkie trasy rezerwacji na pasku nad dniami przełącza całą podróż.',
  // transports-list
  'help.guide.transports-list.title': 'Czytaj zakładkę Transport',
  'help.guide.transports-list.goal': 'Wiedz, co mówi lista, zanim cokolwiek na niej zmienisz.',
  'help.guide.transports-list.step.1':
    'Transport to druga zakładka podróży. Trzyma tylko przejazdy: hotele, restauracje, wydarzenia i bilety są w Rezerwacjach.',
  'help.guide.transports-list.step.2':
    'Pasek narzędzi liczy każdy transport pod Wszystko i daje każdemu używanemu rodzajowi własny chip z własnym licznikiem. Kliknij chip, by zostawić tylko ten rodzaj, kliknij ponownie, by go puścić. Kilka chipów może być włączonych naraz, a Wszystko je czyści.',
  'help.guide.transports-list.step.3':
    'Automatyczny transport publiczny to własna grupa, połączenia zaplanowane przez wyszukiwarkę transportu publicznego. Oczekująca i Potwierdzona trzymają wszystko wprowadzone ręcznie. Strzałka obok nagłówka składa grupę.',
  'help.guide.transports-list.step.4':
    'Karta mówi wszystko: kropka statusu z Oczekująca albo Potwierdzona, rodzaj, dni, przez które się rozciąga, z ich datami, godziny, Kod rezerwacji, trasa oraz Linia lotnicza i Numer lotu albo Numer pociągu, Peron i Miejsce.',
  'help.guide.transports-list.step.5':
    'Ołówek otwiera transport do edycji, kosz go kasuje, po pytaniu, które nazywa to, co znika.',
  'help.guide.transports-list.result':
    'Lista jest zawężona do tego, czego szukałeś, a każda karta na pierwszy rzut oka mówi, czy przejazd jest zarezerwowany.',
  'help.guide.transports-list.tip.1':
    'Chipy i złożone grupy są pamiętane dla każdej podróży z osobna, więc zakładka otwiera się znowu tak, jak ją zostawiłeś.',
  'help.guide.transports-list.tip.2':
    'Importuj z pliku i AirTrail dołączają do Transportu na pasku tylko wtedy, gdy serwer potrafi czytać potwierdzenia rezerwacji i gdy podłączona jest instancja AirTrail. Bez nich listę wypełnia się ręcznie i wyszukiwarką transportu publicznego.',
  // add-transport
  'help.guide.add-transport.title': 'Dodaj transport do dnia',
  'help.guide.add-transport.goal':
    'Wstaw przejazd, który wiezie Cię z jednego przystanku na następny, do dnia, w którym się odbywa.',
  'help.guide.add-transport.step.1':
    'Każdy nagłówek dnia niesie po prawej cztery małe przyciski. Kliknij plus, którego podpowiedź brzmi Dodaj transport. Formularz otwiera się z Datą już ustawioną na ten dzień.',
  'help.guide.add-transport.step.2':
    'Rodzaj rezerwacji wybiera, czym jedziesz: Lot, Pociąg, Autobus, Samochód, Taksówka, Rower, Rejs, Prom albo Inne. Formularz się dostosowuje. Lot dostaje lotnisko na każdym odcinku, pociąg łańcuch stacji, samochód nazwy Odbiór i Zwrot oraz Przystanki po drodze.',
  'help.guide.add-transport.step.3':
    'Tytuł to jedyne pole, które musi być wypełnione; bez niego Dodaj zostaje szary. Napisz to, co rozpoznałbyś na tablicy peronowej.',
  'help.guide.add-transport.step.4':
    'Skąd i Dokąd szukają stacji, portu albo adresu. Wpisz co najmniej trzy litery i wybierz wynik z listy. Nazwa, która została tylko wpisana, nie niesie współrzędnych, więc nic nie rysuje na mapie.',
  'help.guide.add-transport.step.5':
    'Data i Godzina rozpoczęcia mówią, kiedy przejazd się odbywa, Data końca i Godzina zakończenia, kiedy się kończy; przejazd, który ląduje następnego dnia, bierze tam następny dzień. Kod rezerwacji, Status z Oczekująca albo Potwierdzona oraz Notatki są opcjonalne.',
  'help.guide.add-transport.step.6': 'Kliknij Dodaj.',
  'help.guide.add-transport.result':
    'Transport jest wierszem w dniu, w swojej godzinie między przystankami, i kartą w zakładce Transport pod Oczekująca albo Potwierdzona.',
  'help.guide.add-transport.tip.1':
    'Wiersz ląduje tam, gdzie kładzie go jego godzina rozpoczęcia, za ostatnim przystankiem, który zaczyna się wcześniej. Jego uchwyt przeciąga go gdziekolwiek indziej w dniu albo na inny dzień.',
  'help.guide.add-transport.tip.2':
    'Załącz plik pod Pliki bierze bilet, a Utwórz wydatek pod Koszty zapisuje rezerwację i otwiera edytor Koszty dla ceny przejazdu.',
  'help.guide.add-transport.tip.3':
    'Podróżni zaznacza, kto jedzie. Gdy tylko jeden transport ma podróżnych, pasek narzędzi zakładki wypuszcza ich awatary i filtruje po nich listę.',
  // plan-transit
  'help.guide.plan-transit.title': 'Zaplanuj połączenie transportu publicznego',
  'help.guide.plan-transit.goal':
    'Pozwól TREK-owi wyszukać prawdziwe pociągi i autobusy między dwoma punktami dnia i wstaw do planu to, które wybierzesz.',
  'help.guide.plan-transit.step.1':
    'W nagłówku dnia kliknij przycisk tramwaju, Transport publiczny. Wyszukiwarka otwiera się dla tego dnia.',
  'help.guide.plan-transit.step.2':
    'Skąd i Dokąd przyjmują przystanek albo stację. Dopóki pole jest puste, oferowane są własne przystanki dnia i zakwaterowania podróży; wpisanie dwóch liter przeszukuje zamiast tego stacje rozkładu jazdy. Zamień między dwoma polami odwraca połączenie.',
  'help.guide.plan-transit.step.3':
    'Odjazd albo Przyjazd z godziną mówi, kiedy chcesz jechać, a Najlepsza trasa, Mniej przesiadek albo Mniej pieszo mówi, jak mają być uporządkowane odpowiedzi.',
  'help.guide.plan-transit.step.4':
    'Chipy poniżej mówią, jakich środków wolno użyć: Pociąg, Metro, Tramwaj, Autobus, Prom i Kolej linowa. Wyłącz jeden, by go pominąć, przynajmniej jeden zostaje włączony. Potem kliknij Szukaj.',
  'help.guide.plan-transit.step.5':
    'Każdy wynik podaje odjazd i przyjazd, jak długo trwa, ile jest przesiadek i ile pieszo, oraz linie w ich własnych kolorach. Kliknij jeden, by rozwinąć go przystanek po przystanku, z peronami i odcinkami pieszo między liniami.',
  'help.guide.plan-transit.step.6': 'Kliknij Dodaj do dnia.',
  'help.guide.plan-transit.result':
    'Połączenie jest wierszem w dniu ze swoimi liniami, przesiadkami i czasem pieszo, i kartą w zakładce Transport pod Automatyczny transport publiczny.',
  'help.guide.plan-transit.tip.1':
    'Połączenia pochodzą z Transitous, bezpłatnej usługi społecznościowej nad publicznymi danymi rozkładów: bez klucza, bez konta. Administrator może skierować wyszukiwarkę zamiast tego na Google.',
  'help.guide.plan-transit.tip.2':
    'Nic nie znaleziono? Źródła pokrywają region i okres. Spróbuj innej godziny, włącz więcej środków albo wybierz stację zamiast samego miejsca. Komunikat nazywa usługę, która odpowiedziała.',
  'help.guide.plan-transit.tip.3':
    'To samo wyszukiwanie otwiera się dla pojedynczego odcinka: kliknij łącznik z czasem przejazdu między dwoma przystankami i wybierz Transport publiczny. Skąd, Dokąd i godzina odjazdu są wypełnione za Ciebie.',
  // change-transit-route
  'help.guide.change-transit-route.title': 'Otwórz i zmień zaplanowane połączenie',
  'help.guide.change-transit-route.goal':
    'Przeczytaj połączenie przystanek po przystanku, zmień jego nazwę albo wyszukaj trasę jeszcze raz.',
  'help.guide.change-transit-route.step.1':
    'W zakładce Transport zaplanowane połączenia siedzą pod Automatyczny transport publiczny. Kliknij kartę.',
  'help.guide.change-transit-route.step.2':
    'Czas trwania, Przesiadki i Pieszo siedzą u góry. Plan podróży pod nimi przechodzi połączenie przystanek po przystanku, z peronami i odcinkami pieszo między liniami.',
  'help.guide.change-transit-route.step.3':
    'Zmień trasę uruchamia wyszukiwanie jeszcze raz, już wypełnione obydwoma końcami tego połączenia i jego dniem.',
  'help.guide.change-transit-route.step.4':
    'Wybierz inne połączenie i kliknij Dodaj do dnia; zajmuje miejsce starego. Edytuj szczegóły, obok Zmień trasę, otwiera zamiast tego zwykły formularz transportu, gdzie mieszkają Kod rezerwacji, Status, podróżni i pliki.',
  'help.guide.change-transit-route.result':
    'Widok Podróż transportem publicznym niesie nowy Plan podróży, a jego karta w zakładce Transport pokazuje nowe linie i godziny.',
  'help.guide.change-transit-route.tip.1':
    'Tytuł w widoku Podróż transportem publicznym to tylko tekst: ołówek obok niego zmienia nazwę, nie ruszając trasy. Notatki pod spodem przyjmują markdown i mają zakładkę Edytuj i Podgląd.',
  'help.guide.change-transit-route.tip.2':
    'Usuń u dołu widoku Podróż transportem publicznym wyjmuje połączenie z podróży; dzień zachowuje swoje przystanki.',
  // leg-travel-mode
  'help.guide.leg-travel-mode.title': 'Zmień, jak pokonujesz jeden odcinek',
  'help.guide.leg-travel-mode.goal':
    'Przejdź pieszo jeden odcinek dnia, który poza tym jedziesz samochodem, albo oddaj ten odcinek wyszukiwarce transportu publicznego.',
  'help.guide.leg-travel-mode.step.1':
    'Łączniki między przystankami pojawiają się dopiero, gdy Trasa dnia jest włączona. Kliknij dzień, by go otworzyć, potem Trasa pod jego przystankami.',
  'help.guide.leg-travel-mode.step.2':
    'Każdy łącznik nazywa czas przejazdu i długość tego odcinka, z ikoną środka, w którym wyznaczono trasę: samochód dla jazdy, stopa dla chodzenia.',
  'help.guide.leg-travel-mode.step.3':
    'Kliknij łącznik. Menu oferuje Samochodem i Pieszo, Transport publiczny oraz Użyj domyślnego dnia.',
  'help.guide.leg-travel-mode.step.4':
    'Wybierz Pieszo. Zmienia się tylko ten odcinek; reszta dnia zachowuje swój własny środek.',
  'help.guide.leg-travel-mode.result':
    'Odcinek pokazuje ikonę stopy i swój czas pieszo, a pozostałe odcinki dnia zachowują środek dnia.',
  'help.guide.leg-travel-mode.tip.1':
    'Środek należy do odcinka, nie do dnia: przyciski Samochodem i Pieszo całego dnia nigdy nie nadpisują odcinka ustawionego ręcznie. Użyj domyślnego dnia oddaje im odcinek z powrotem.',
  'help.guide.leg-travel-mode.tip.2':
    'Transport publiczny w tym samym menu otwiera wyszukiwarkę połączeń dokładnie dla tego odcinka, z obydwoma końcami i godziną odjazdu już wypełnionymi.',
  'help.guide.leg-travel-mode.tip.3':
    'Czasy pochodzą z publicznego planera tras po prawdziwych drogach i ścieżkach. Odcinek, na który nie potrafi odpowiedzieć, zachowuje swoją prostą linię i nie pokazuje czasu.',
  // edit-transport
  'help.guide.edit-transport.title': 'Zmień albo usuń transport',
  'help.guide.edit-transport.goal': 'Popraw godzinę, peron albo kod rezerwacji, albo wyjmij przejazd z podróży.',
  'help.guide.edit-transport.step.1': 'W planie dnia transport to kolorowy wiersz między przystankami. Kliknij go.',
  'help.guide.edit-transport.step.2':
    'Formularz jest ten sam, który go utworzył, z Edytuj transport na pasku tytułu. Zmienić można wszystko: rodzaj, trasę, dni i godziny, Kod rezerwacji, Status.',
  'help.guide.edit-transport.step.3':
    'Trasa lotu to łańcuch lotnisk, trasa pociągu łańcuch stacji. Dodaj przystanek wstawia kolejny pomiędzy, a każdy odcinek zachowuje własne godziny i własny numer lotu albo pociągu.',
  'help.guide.edit-transport.step.4':
    'Kliknij Aktualizuj. Aby usunąć transport całkiem, użyj kosza na jego karcie w zakładce Transport i potwierdź.',
  'help.guide.edit-transport.result':
    'Zmiana pokazuje się wszędzie, gdzie transport się pojawia: w zakładce Transport, w dniu, w którym jedzie, i na jego linii na mapie.',
  'help.guide.edit-transport.tip.1':
    'Ten sam formularz otwiera się z obu stron, ołówkiem na karcie w zakładce Transport i własnym wierszem transportu w planie dnia. Wyjątkiem jest zaplanowane połączenie transportu publicznego: jego wiersz otwiera widok Podróż transportem publicznym, a Edytuj szczegóły prowadzi stamtąd do tego formularza.',
  'help.guide.edit-transport.tip.2':
    'Przeniesienie transportu na inny dzień w ogóle nie potrzebuje formularza: przeciągnij jego wiersz z jednej karty dnia na następną.',
  // transport-on-map
  'help.guide.transport-on-map.title': 'Narysuj transport na mapie',
  'help.guide.transport-on-map.goal': 'Zobacz, którędy lot, jazda albo połączenie naprawdę biegnie.',
  'help.guide.transport-on-map.step.1':
    'Transport z ustawionymi obydwoma końcami niesie małą ikonę trasy w swoim wierszu w planie dnia. Kliknij ją; jej podpis zmienia się na Ukryj trasy rezerwacji.',
  'help.guide.transport-on-map.step.2':
    'Trasa zostaje narysowana na mapie, a na każdym końcu stoi podłużny znacznik z ikoną transportu.',
  'help.guide.transport-on-map.step.3':
    'Kliknij znacznik końcowy, by przeczytać rezerwację bez opuszczania mapy: godziny, Linię lotniczą i Numer lotu, Kod rezerwacji i adres. Zamknij chowa panel.',
  'help.guide.transport-on-map.step.4':
    'Ikona trasy na pasku nad dniami robi całą podróż naraz: Pokaż wszystkie trasy rezerwacji, a Ukryj wszystkie trasy rezerwacji, by je znowu wyczyścić.',
  'help.guide.transport-on-map.step.5':
    'Zaplanowane połączenie transportu publicznego nie ma własnej ikony. Rysuje je przełącznik Trasa danego dnia, dlatego Ukryj wszystkie trasy rezerwacji go nie czyści, dopóki trasa tego dnia jest włączona.',
  'help.guide.transport-on-map.result':
    'Trasy są na mapie ze znacznikiem na każdym końcu i zostają tam, dopóki znowu ich nie wyłączysz.',
  'help.guide.transport-on-map.tip.1':
    'Lot, rejs i prom rysują się jako łuk, samochód, autobus, taksówka i rower jadą prawdziwymi drogami, a pociąg albo zaplanowane połączenie biegnie przez stacje, na których się zatrzymuje.',
  'help.guide.transport-on-map.tip.2':
    'Potwierdzona rezerwacja to linia ciągła, oczekująca przerywana. Ustawienie Etykiety tras rezerwacji wypisuje kod lotniska albo nazwę stacji w znacznikach końcowych.',
  'help.guide.transport-on-map.tip.3':
    'Pokaż wszystkie trasy rezerwacji to czysta karta, nie warstwa: odrzuca to, co ustawiły pojedyncze ikony, więc dwukrotne naciśnięcie zostawia Cię ze wszystkim włączonym albo wszystkim wyłączonym.',
  // import-transport-file
  'help.guide.import-transport-file.title': 'Odczytać lot z jego e-biletu',
  'help.guide.import-transport-file.goal':
    'Pozwól TREK-owi wyciągnąć lot, pociąg albo prom z biletu, który przysłał przewoźnik, i sprawdź go, zanim zostanie zapisany.',
  'help.guide.import-transport-file.step.1':
    'Kliknij Importuj z pliku na pasku narzędzi zakładki Transport, obok Transport. Otwiera się Importuj potwierdzenia rezerwacji, to samo okno, które ma zakładka Rezerwacje.',
  'help.guide.import-transport-file.step.2':
    'Upuść bilet na to pole albo kliknij je i wybierz go: EML, PDF, PKPass, HTML i TXT, do pięciu plików po 10 MB. Pliki, które wybrałeś, są wypisane na polu po nazwie.',
  'help.guide.import-transport-file.step.3': 'Kliknij Importuj. Okno zamyka się od razu; czytanie dzieje się w tle.',
  'help.guide.import-transport-file.step.4':
    'Karta na dole po prawej relacjonuje przebieg pod nazwą pliku. Przetwarzanie plików… zmienia się w haczyk, gdy czytanie jest skończone, a karta oferuje Importuj. Kliknij to.',
  'help.guide.import-transport-file.step.5':
    'Lot otwiera się w Dodaj transport, już wypełniony: Rodzaj rezerwacji na Lot, linia lotnicza i numer lotu w Tytuł, oba lotniska pod Trasa z Wylot i Przylot, ich godziny i ich strefy czasowe, Linia lotnicza i Numer lotu, Kod rezerwacji oraz bilet pod Pliki. Sprawdź to i kliknij Dodaj.',
  'help.guide.import-transport-file.result':
    'Lot jest kartą w Oczekująca w zakładce Transport i wierszem w dniu, w którym odlatuje, z biletem pod Pliki, a przy obu znanych lotniskach rysuje swój łuk na mapie.',
  'help.guide.import-transport-file.tip.1':
    'Obie zakładki dzielą jeden import: plik, który trzyma lot i hotel, otwiera lot w Dodaj transport, a hotel w Nowa rezerwacja, jedno po drugim, niezależnie od tego, z której zakładki zacząłeś.',
  'help.guide.import-transport-file.tip.2':
    'Lotniska są umieszczane po kodzie. Dworzec albo port, którego czytanie nie umiało zlokalizować, jest na karcie nazwany na bursztynowo; wybierz go ręcznie pod Trasa, zanim klikniesz Dodaj, inaczej transport nie narysuje nic na mapie.',
  // airtrail-import
  'help.guide.airtrail-import.title': 'Zaimportować loty z AirTrail',
  'help.guide.airtrail-import.goal':
    'Wnieś loty, które już trzymasz w AirTrail, do podróży za jednym razem i pozwól im od tej chwili podążać za AirTrail.',
  'help.guide.airtrail-import.step.1':
    'Z włączonym dodatkiem AirTrail i Twoją instancją podłączoną pod Integracje w Ustawienia pasek narzędzi zakładki Transport niesie przycisk AirTrail obok Transport. Kliknij go.',
  'help.guide.airtrail-import.step.2':
    'Importuj z AirTrail wypisuje loty Twojego konta w dwóch grupach. Podczas tej wyprawy trzyma te datowane wewnątrz podróży, już zaznaczone; Inne loty trzyma resztę, niezaznaczoną. Lot, który już jest w podróży, jest wyszarzony i oznaczony Zaimportowano.',
  'help.guide.airtrail-import.step.3':
    'Każdy wiersz to pole wyboru z linią lotniczą i numerem lotu, dwoma lotniskami i datą. Kliknij wiersz, by wziąć lot albo go pominąć; te pod Inne loty wchodzą tylko wtedy, gdy je zaznaczysz.',
  'help.guide.airtrail-import.step.4':
    'Loty, które się łączą, każdy wylatujący z lotniska, na którym poprzedni wylądował, w ciągu jednego dnia, są ujęte w jedną ramkę. Zaznaczenie pod spodem, Importuj jako jeden lot z przesiadką w tym lotnisku, jest już włączone: zostaw je włączone dla jednej rezerwacji z przesiadką albo wyłącz, by zaimportować odcinki jako osobne loty.',
  'help.guide.airtrail-import.step.5':
    'Kliknij Importuj. Przycisk liczy zaznaczone loty, a komunikat potem mówi, ile weszło.',
  'help.guide.airtrail-import.step.6':
    'Loty są kartami pod Potwierdzona, każda z niebieską plakietką AirTrail obok swojego statusu, i wierszami w dniach, w których lecą. Połączona przesiadka to jedna karta, z trasą biegnącą przez przesiadkę.',
  'help.guide.airtrail-import.result':
    'Loty z AirTrail są kartami w zakładce Transport i wierszami w swoich dniach, każdy z plakietką AirTrail, która mówi, skąd przyszedł.',
  'help.guide.airtrail-import.tip.1':
    'Lot, który już jest w podróży pod tym samym numerem i datą, jest pomijany, a komunikat mówi, ile ich było. Cofnij na pasku narzędzi nad dniami cofa cały import.',
  'help.guide.airtrail-import.tip.2':
    'AirTrail pozostaje źródłem prawdy. TREK czyta jego zmiany, gdy otwierasz podróż, i co kilka minut w tle; lot usunięty tam zachowuje swoją kartę, z plakietką zmienioną na Niezsynchronizowane. Zmiany zrobione w TREK-u wracają tylko z włączonym Zapisuj zmiany z powrotem w AirTrail pod Integracje.',
  'help.guide.airtrail-import.tip.3':
    'Połączona przesiadka nie ma jednego lotu AirTrail, za którym mogłaby podążać, więc to import jednorazowy: zachowuje niebieską plakietkę, a najechanie na plakietkę to mówi. To samo dzieje się ze zsynchronizowanym lotem, któremu ręcznie dasz przesiadkę.',

  // ── Screen: trip-roadtrip ─────────────────────────────────────────────────────────────
  'help.ctx.trip-roadtrip.title': 'Podróż samochodowa',
  'help.ctx.trip-roadtrip.summary':
    'Plan czytany jako jedna jazda: te same dni i te same miejsca, złożone w przystanki z jazdą pomiędzy nimi, na szynie w lewej kolumnie i na mapie. Mówi, jak daleko i jak długo, gdzie kończy się paliwo i co jest przy drodze.',
  'help.ctx.trip-roadtrip.bullet.1':
    'Dni i Podróż samochodowa u góry lewej kolumny przełączają między planem dni a jazdą. Nic nie jest kopiowane i nic się nie zmienia: Dni oddają plan dokładnie taki, jaki był.',
  'help.ctx.trip-roadtrip.bullet.2':
    'Głowa szyny sumuje całą podróż: Dystans, Czas jazdy i Przystanki. Pod nią idzie jedna karta na dzień, z własnymi kilometrami dnia, z tym, na ile przystanków jest, co przekracza, i z plakietką Ślad.',
  'help.ctx.trip-roadtrip.bullet.3':
    'Numerowany przystanek to miejsce, dla którego dzień jest. Postój po drodze, paliwo, ładowanie, miejsce odpoczynku, nosi zamiast numeru ikonę swojego rodzaju i nie jest liczony. Kliknij numer, aby zmienić, czym jest, i plakietkę Postój, aby powiedzieć, ile trwa.',
  'help.ctx.trip-roadtrip.bullet.4':
    'Między dwoma przystankami pasek jazdy podaje odcinek jako dystans i czas. Kliknij go, aby otworzyć Trasy tego odcinka, albo kliknij narysowaną trasę na mapie, aby wygiąć odcinek przez punkt pośredni.',
  'help.ctx.trip-roadtrip.bullet.5':
    'Prawa kolumna staje się Wzdłuż trasy: wybierz dzień, czego szukać i jak szeroki jest korytarz, a potem Szukaj. Dodaj kładzie znalezisko na jeździe w miejscu, którym naprawdę przejeżdżasz.',
  'help.ctx.trip-roadtrip.bullet.6':
    'Ustawienia jazdy pod tym trzymają limity, auto i jego zasięg, dzienne godziny podróży, czego omijać i jak rysowana jest linia. Należą do podróży, więc wszyscy planują tym samym autem.',
  // roadtrip-mode
  'help.guide.roadtrip-mode.title': 'Przeczytać podróż jako jedną jazdę',
  'help.guide.roadtrip-mode.goal': 'Przełącz plan w tryb podróży samochodowej i przeczytaj, co mówi szyna.',
  'help.guide.roadtrip-mode.step.1':
    'Kliknij Podróż samochodowa w przełączniku Dni i Podróż samochodowa u góry lewej kolumny. Plan dni zastępuje jazda, a mapa rysuje każdy dzień, który ma trasę.',
  'help.guide.roadtrip-mode.step.2': 'Głowa szyny sumuje całą podróż: Dystans, Czas jazdy i Przystanki.',
  'help.guide.roadtrip-mode.step.3':
    'Pod nią idzie jedna karta na dzień. Jej nagłówek niesie numer i datę dnia, jazdę jako dystans i czas oraz to, na ile przystanków dzień jest.',
  'help.guide.roadtrip-mode.step.4':
    'Wewnątrz karty dzień jest łańcuchem: numerowany przystanek na każde miejsce, pasek jazdy między każdą parą i godzina przyjazdu przy prawej krawędzi.',
  'help.guide.roadtrip-mode.step.5':
    'Kliknij nagłówek dnia, aby go zwinąć. Zwinięty dzień znika też z mapy; kliknij nagłówek ponownie, aby go przywrócić.',
  'help.guide.roadtrip-mode.result':
    'Lewa kolumna jest jazdą, a mapa pokazuje każdy jej dzień. Dni przełączają prosto z powrotem na plan, niezmieniony.',
  'help.guide.roadtrip-mode.tip.1':
    'Wybór jest pamiętany dla każdej podróży, dopóki karta przeglądarki jest otwarta, więc po odświeżeniu wracasz do jazdy.',
  'help.guide.roadtrip-mode.tip.2':
    'Przełącznik istnieje dopiero wtedy, gdy administrator włączy dodatek Podróż samochodowa, w Dodatki w Administracji.',
  'help.guide.roadtrip-mode.tip.3':
    'Na telefonie nie ma przełącznika: dodatek dokłada własną zakładkę Podróż samochodowa obok Plan.',
  // roadtrip-stops
  'help.guide.roadtrip-stops.title': 'Postoje po drodze i jak długo stoisz',
  'help.guide.roadtrip-stops.goal':
    'Zamień miejsce na jeździe w postój po drodze i powiedz, ile trwa każdy przystanek.',
  'help.guide.roadtrip-stops.step.1':
    'Kliknij numer przed przystankiem na szynie. Jego etykieta brzmi Zamień w postój po drodze i otwiera Rodzaj przystanku.',
  'help.guide.roadtrip-stops.step.2':
    'Wybierz rodzaj: Noclegi, Paliwo, Ładowanie, Miejsce odpoczynku, Kemping, Jedzenie albo Atrakcje. Numer zmienia się w ikonę tego rodzaju, a przystanki poniżej dostają nowe numery.',
  'help.guide.roadtrip-stops.step.3':
    'Postój po drodze nie jest celem, więc nagłówek dnia liczy o jeden przystanek mniej.',
  'help.guide.roadtrip-stops.step.4':
    'Kliknij ikonę ponownie, Zmień rodzaj postoju, i wybierz Z powrotem cel podróży, aby przystanek odzyskał swój numer.',
  'help.guide.roadtrip-stops.step.5':
    'Każdy przystanek nosi plakietkę Postój. Kliknij ją, aby otworzyć Czas na tym przystanku.',
  'help.guide.roadtrip-stops.step.6':
    'Ustaw długość suwakiem, przyciskami minus i plus albo jedną z gotowych wartości, popatrz, co robią Przyjazd i Odjazd, i kliknij Zapisz.',
  'help.guide.roadtrip-stops.result':
    'Przystanek, któremu dałeś czas, niesie godzinę na swojej plakietce Postój, a każdy przyjazd po nim przesunął się razem z nim, ten zaś, który wysłałeś na rodzaj i z powrotem, jest znowu numerowanym celem podróży.',
  'help.guide.roadtrip-stops.tip.1':
    'Postój należy do miejsca, nie do jednej wizyty: w miejscu zaplanowanym na dwa dni stoi się tyle samo w oba dni.',
  'help.guide.roadtrip-stops.tip.2':
    'Postoje po drodze pokazują się też w Dniach. Wyłączenie Pokaż także w Dniach, w Postoje serwisowe w Ustawieniach jazdy, zostawia je tylko w Podróży samochodowej.',
  'help.guide.roadtrip-stops.tip.3': 'Bez postoju, w tym samym oknie, odbiera ten czas z powrotem.',
  // roadtrip-corridor
  'help.guide.roadtrip-corridor.title': 'Znaleźć paliwo, jedzenie i nocleg wzdłuż trasy',
  'help.guide.roadtrip-corridor.goal':
    'Przeszukaj drogę, którą naprawdę jedziesz, i połóż znalezisko na właściwym odcinku.',
  'help.guide.roadtrip-corridor.step.1': 'Wybierz dzień u góry Wzdłuż trasy. Oferowane są tylko dni, które mają trasę.',
  'help.guide.roadtrip-corridor.step.2':
    'W Szukam zaznacz, czego potrzebujesz. Paliwo, Ładowanie, Miejsce odpoczynku, Kemping, Noclegi, Jedzenie i Atrakcje można łączyć.',
  'help.guide.roadtrip-corridor.step.3':
    'W sekcji W promieniu wybierz, jak daleko po obu stronach drogi szukać, 2 km, 5 km albo 10 km, a potem kliknij Szukaj.',
  'help.guide.roadtrip-corridor.step.4':
    'Znaleziska wracają pogrupowane według rodzaju, w kolejności, w jakiej je mijasz, każde z tym, jak daleko w dniu leży i jak daleko jest od trasy.',
  'help.guide.roadtrip-corridor.step.5':
    'Dodaj przy znalezisku otwiera Dodaj jako przystanek. Mówi, na który dzień i na którą pozycję przystanek trafia, pyta o rodzaj i o czas na przystanku, a Dodaj kładzie go na jeździe.',
  'help.guide.roadtrip-corridor.result':
    'Znaleziska są wypisane w kolejności, w jakiej je mijasz, i narysowane na mapie, a to dodane siedzi na jeździe w miejscu, którym naprawdę przejeżdżasz.',
  'help.guide.roadtrip-corridor.tip.1':
    'Nic nie jest szukane, dopóki nie naciśniesz Szukaj: jeden przebieg to wiele zapytań do wspólnej usługi.',
  'help.guide.roadtrip-corridor.tip.2':
    'Filtruj wedug nazwy zawęża to, co wróciło, bez ponownego pytania, a Wyczyść wyniki opróżnia listę i jej pinezki. Kliknij znalezisko, aby zobaczyć je na mapie.',
  'help.guide.roadtrip-corridor.tip.3':
    'Znalezisko można też przeciągnąć z mapy na narysowaną trasę, czym sam wybierasz odcinek tam, gdzie ta sama droga jest przejechana dwa razy. Dodaj ręcznie, obok Szukaj, zamiast tego wyszukuje miejsce po nazwie.',
  // roadtrip-via
  'help.guide.roadtrip-via.title': 'Wygiąć odcinek przez punkt pośredni',
  'help.guide.roadtrip-via.goal': 'Poprowadź odcinek drogą, którą naprawdę chcesz, bez dokładania do niego przystanku.',
  'help.guide.roadtrip-via.step.1':
    'Sprowadź na ekran odcinek, o który chodzi: kliknij przystanek na szynie, a potem zamknij kartę, która otwiera się nad mapą.',
  'help.guide.roadtrip-via.step.2':
    'Kliknij narysowaną trasę. Na odcinku, który kliknąłeś, ląduje punkt pośredni, a odcinek jest wyznaczany na nowo przez niego.',
  'help.guide.roadtrip-via.step.3':
    'Szyna idzie za tym: nagłówek dnia niesie nowy dystans i czas jazdy, a każdy przyjazd po punkcie pośrednim przesuwa się razem z nim.',
  'help.guide.roadtrip-via.step.4':
    'Najedź na uchwyt, a powie, co potrafi: Przeciągnij, aby zmienić trasę, kliknij prawym, aby usunąć. Przeciągnij go gdzie indziej, a odcinek jest rysowany na nowo przez nowe miejsce.',
  'help.guide.roadtrip-via.step.5': 'Kliknij uchwyt prawym przyciskiem, aby go zabrać. Odcinek znów jedzie prosto.',
  'help.guide.roadtrip-via.result':
    'Odcinek idzie drogą, którą wybrałeś, a dystans dnia, czas jazdy i przyjazdy są dla niego liczone od nowa.',
  'help.guide.roadtrip-via.tip.1':
    'Punkt pośredni nie jest przystankiem: nie ma numeru, postoju ani godziny przyjazdu i nie liczy się do przystanków dnia.',
  'help.guide.roadtrip-via.tip.2':
    'Uchwyty są rysowane od poziomu przybliżenia 9, więc mapa dopasowana do całej podróży pokazuje linię bez nich.',
  'help.guide.roadtrip-via.tip.3':
    'Kliknięcie dalej niż dwa kilometry od jakiegokolwiek narysowanego odcinka jest pomijane, tak samo jak kliknięcie w lot, pociąg albo prom.',
  // roadtrip-alternatives
  'help.guide.roadtrip-alternatives.title': 'Spróbować innej drogi na jednym odcinku',
  'help.guide.roadtrip-alternatives.goal': 'Zobacz, co jeszcze planer oferuje na jeden odcinek, i weź to.',
  'help.guide.roadtrip-alternatives.step.1':
    'Kliknij pasek jazdy na szynie, wiersz między dwoma przystankami, który podaje odcinek jako dystans i czas. Jego etykieta brzmi Inne trasy.',
  'help.guide.roadtrip-alternatives.step.2':
    'Trasy tego odcinka otwierają się nad mapą, po jednej pozycji na drogę, każda narysowana na mapie własnym kolorem.',
  'help.guide.roadtrip-alternatives.step.3':
    'Najedź na pozycję, aby podświetlić tę drogę. Obecna to droga, którą jedziesz, a Najszybsza ta najszybsza; pozostałe mówią, o ile są wolniejsze, albo jaką klasę dróg omijają.',
  'help.guide.roadtrip-alternatives.step.4':
    'Kliknij pozycję, aby pojechać tamtędy, albo Zamknij, aby zostać przy drodze, którą jedziesz.',
  'help.guide.roadtrip-alternatives.result':
    'Odcinek jedzie drogą, którą wybrałeś, a dystans na szynie i przyjazdy po nim zmieniają się razem z nią.',
  'help.guide.roadtrip-alternatives.tip.1':
    'Wybór innej drogi kładzie na odcinku punkt pośredni i zastępuje te, które już miał; wybór własnej drogi planera zabiera je z powrotem.',
  'help.guide.roadtrip-alternatives.tip.2':
    'Bez autostrady, Bez oplat i Bez promu pochodzą z drugiego silnika z własnym modelem prędkości, więc ich czasy nie są porównywalne z pozostałymi.',
  // roadtrip-limits
  'help.guide.roadtrip-limits.title': 'Ustawić auto i limity jazdy',
  'help.guide.roadtrip-limits.goal': 'Powiedz TREK-owi, czym jeździsz i jak daleko chcesz jechać za jednym razem.',
  'help.guide.roadtrip-limits.step.1':
    'Ustawienia jazdy siedzą pod wyszukiwaniem w prawej kolumnie. Ich plakietki mówią, co jest ustawione; kliknij, aby otworzyć.',
  'help.guide.roadtrip-limits.step.2':
    'W Jazda Najdłuższa jazda bez przerwy i Jazda dziennie są w minutach. Puste pole znaczy wył. i nic nie jest oznaczane.',
  'help.guide.roadtrip-limits.step.3':
    'W Pojazd powiedz, czym jeździsz. Paliwo tankuje tylko na postojach paliwowych, Elektryk tylko na ładowaniu, Oba na obu.',
  'help.guide.roadtrip-limits.step.4':
    'Zasięg na jednym baku, albo Zasięg na ładowaniu, wpisz sam. Policz z danych auta pod spodem bierze Pojemność baku i Zużycie, albo Akumulator i Zużycie, i robi to wyliczenie.',
  'help.guide.roadtrip-limits.step.5':
    'Omijaj, jeśli się da jest preferencją, nie zakazem: dzień, który nie ma objazdu, i tak korzysta z drogi, i mówi o tym w swoim nagłówku.',
  'help.guide.roadtrip-limits.step.6':
    'Zamknij okno. Karta mówi, co jest ustawione, a szyna oznacza każdy odcinek i każdy dzień, który to przekracza.',
  'help.guide.roadtrip-limits.result':
    'Plakietki karty mówią, co jest ustawione, a każdy odcinek i dzień ponad limitem nosi na szynie plakietkę.',
  'help.guide.roadtrip-limits.tip.1':
    'Ustawienia należą do podróży, więc wszyscy w niej planują tym samym autem i tymi samymi limitami.',
  'help.guide.roadtrip-limits.tip.2':
    'Tankuj do mówi, do ile tankuje przystanek, bo nikt w drodze nie ładuje do 100 %. Postój paliwowy albo ładowania może to dla siebie nadpisać.',
  'help.guide.roadtrip-limits.tip.3':
    'Linia trasy decyduje, jak rysowana jest jazda: Połącz dni wyznacza noc między dwoma dniami, a Kolor na dzień daje każdemu dniu własny.',
  // roadtrip-day-window
  'help.guide.roadtrip-day-window.title': 'Dać dniowi jazdy początek i koniec',
  'help.guide.roadtrip-day-window.goal':
    'Przestań jechać o godzinie, którą wybierzesz, i powiedz, gdzie dzień ma się skończyć.',
  'help.guide.roadtrip-day-window.step.1':
    'Otwórz Ustawienia jazdy w prawej kolumnie i znajdź Dzienne godziny podróży.',
  'help.guide.roadtrip-day-window.step.2':
    'Ustaw Początek dnia. Sam z siebie nic nie robi: potrzebne są obie godziny, jak mówi notka pod nimi.',
  'help.guide.roadtrip-day-window.step.3':
    'Ustaw Koniec dnia. Jazda zatrzymuje się teraz o tej godzinie i przenosi resztę na następny ranek, jako wiersz Koniec dnia i wiersz Kontynuuj podróż na szynie.',
  'help.guide.roadtrip-day-window.step.4':
    'W Koniec dnia wybierz Na trasie, aby zatrzymać się na drodze o godzinie zakończenia, albo W ostatnim miejscu, aby stanąć, zanim następna jazda by je minęła.',
  'help.guide.roadtrip-day-window.step.5': 'Zamknij okno. Karta Ustawienia jazdy niesie obie godziny jako plakietkę.',
  'help.guide.roadtrip-day-window.result':
    'Jazda jest cięta na dni podróży o długości, którą ustawisz, a co się nie mieści, idzie dalej na wyliczonych dniach po tym ostatnim. Twoje dni i ich miejsca nie zmieniają się.',
  'help.guide.roadtrip-day-window.tip.1':
    'Wyczyszczenie którejkolwiek z godzin wyłącza całość z powrotem. Godziny, które sam przypiąłeś na przystanku, zawsze mają pierwszeństwo.',
  'help.guide.roadtrip-day-window.tip.2':
    'Z ustawionymi dziennymi godzinami podróży dni są zawsze połączone: jazda z ostatniego przystanku jednego dnia do pierwszego przystanku następnego jest wyznaczana i liczona.',
  'help.guide.roadtrip-day-window.tip.3':
    'Każdy koniec dnia jest też znacznikiem na mapie, księżycem z numerem dnia. Przeciągnij go wzdłuż trasy albo na miejsce, aby zakończyć dzień gdzie indziej; kliknij go prawym przyciskiem, aby wrócić do automatycznego końca, a Przywróć automatyczne końce dni w tym oknie cofa wszystko.',
  // roadtrip-refuel
  'help.guide.roadtrip-refuel.title': 'Zatankować, zanim skończy się paliwo',
  'help.guide.roadtrip-refuel.goal':
    'Znajdź, gdzie zatankować na odcinku, na który auto jeszcze dojedzie, i połóż to na jeździe.',
  'help.guide.roadtrip-refuel.step.1':
    'Przy ustawionym zasięgu szyna rysuje na odcinku pasek tam, gdzie paliwo się kończy: Tu kończy się paliwo, a pod nim, jak daleko w odcinku to jest.',
  'help.guide.roadtrip-refuel.step.2':
    'Lampka na pasku jest przyciskiem. Znajdź paliwo szuka wzdłuż drogi, którą już przejechałeś, a w tym czasie świeci Szukam wzdłuż trasy…',
  'help.guide.roadtrip-refuel.step.3':
    'Wracają najwyżej trzy stacje, każda z tym, jak daleko jest od trasy i ile zasięgu by zostało.',
  'help.guide.roadtrip-refuel.step.4':
    'Plus przy ofercie dodaje ją jako postój paliwowy. Dodaj jako przystanek otwiera się z wpisanym już rodzajem i czasem, a Dodaj kładzie ją na odcinku w miejscu, którym naprawdę przejeżdżasz.',
  'help.guide.roadtrip-refuel.result':
    'Przystanek jest na właściwym odcinku z własną ikoną, zasięg liczy się od niego na nowo, a paska już nie ma.',
  'help.guide.roadtrip-refuel.tip.1':
    'Zasięg liczy się od ostatniego postoju paliwowego albo ładowania, przez wszystkie dni. To, czym jeździsz, decyduje, które postoje się liczą: Paliwo tylko paliwowe, Elektryk tylko ładowania.',
  'help.guide.roadtrip-refuel.tip.2':
    'Wyszukiwanie patrzy na drogę przed punktem, w którym paliwo się kończy, trzyma rezerwę i liczy objazd podwójnie, więc wszystko, co oferuje, jest naprawdę osiągalne.',
  'help.guide.roadtrip-refuel.tip.3':
    'Pusta odpowiedź to nie ślepy zaułek: lampka zmienia się w Ponów, bo wyszukiwanie miejsc to wspólna usługa, która czasem nie zdąży odpowiedzieć.',
  // roadtrip-track
  'help.guide.roadtrip-track.title': 'Sprawić, by dzień podążał za zaimportowanym śladem',
  'help.guide.roadtrip-track.goal':
    'Połóż jazdę dnia na widokowej trasie, którą zaimportowałeś jako ślad GPX albo KML.',
  'help.guide.roadtrip-track.step.1': 'Kliknij plakietkę Ślad w nagłówku dnia. Okno otwiera się na tym dniu.',
  'help.guide.roadtrip-track.step.2':
    'Wybierz ślad. Każdy mówi, jak długi jest i czy biegnie wzdłuż tego dnia, czy jak daleko od niego leży, najbliższe pierwsze.',
  'help.guide.roadtrip-track.step.3':
    'Kliknij Podążaj za tym śladem. TREK rozrzuca punkty pośrednie tam, gdzie jazda najbardziej odbiega od śladu, i wyznacza trasę na nowo, runda po rundzie.',
  'help.guide.roadtrip-track.step.4':
    'Mówi, ile punktów pośrednich ustawił i jak blisko jazda teraz się trzyma. Przycisk pod nim zabiera te punkty pośrednie z powrotem i oddaje dzień planerowi; zamknięcie okna zachowuje ślad.',
  'help.guide.roadtrip-track.result':
    'Jazda dnia podąża za śladem zamiast za drogą, którą wybrał planer, a jej plakietka Ślad świeci i po najechaniu nazywa ten ślad.',
  'help.guide.roadtrip-track.tip.1':
    'Plik zaimportuj w Dniach przez Importuj plik, z zaznaczonymi Trasy albo Trasy GPS. Dopóki podróż żadnego nie trzyma, żaden dzień nie nosi plakietki.',
  'help.guide.roadtrip-track.tip.2':
    'Podążanie za śladem zastępuje punkty pośrednie, które odcinki dnia już miały, więc kształtuj odcinek ręcznie po śladzie, a nie przed nim.',
};

export default help;
