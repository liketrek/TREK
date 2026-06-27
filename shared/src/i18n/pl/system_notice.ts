import type { TranslationStrings } from '../types';

const system_notice: TranslationStrings = {
  'system_notice.welcome_v1.title': 'Witaj w TREK',
  'system_notice.welcome_v1.body':
    'Twój kompleksowy planer podróży. Twórz trasy, dziel się wycieczkami ze znajomymi i bądź zorganizowany — online i offline.',
  'system_notice.welcome_v1.cta_label': 'Zaplanuj podróż',
  'system_notice.welcome_v1.hero_alt': 'Malownicze miejsce z interfejsem planowania TREK',
  'system_notice.welcome_v1.highlight_plan': 'Trasy dzień po dniu',
  'system_notice.welcome_v1.highlight_share': 'Współpraca z partnerami podróży',
  'system_notice.welcome_v1.highlight_offline': 'Działa offline na telefonie',
  'system_notice.dev_test_modal.title': '[Dev] Test notice',
  'system_notice.dev_test_modal.body': 'This is a dev-only test notice.',
  'system_notice.thank_you_support.title': 'Dziękuję, że korzystasz z TREK',
  'system_notice.thank_you_support.body':
    'Krótkie podziękowanie za zainstalowanie TREK — naprawdę wiele dla mnie znaczy.\n\nJestem samodzielnym programistą i tworzę TREK po godzinach. Wszystko zaczęło się jako małe narzędzie tylko na moje własne podróże, a wsparcie i zainteresowanie ze strony społeczności od tamtej pory szczerze mnie powaliły. TREK powstaje z wielkim sercem z mojej strony — ale także dzięki wielu wspaniałym zewnętrznym współtwórcom, którzy pomogli go ukształtować.\n\n**TREK jest open source i całkowicie darmowy — i tak już zostanie na zawsze. Bez płatnych wersji, bez subskrypcji, bez haczyków. Obiecuję.**\n\nJeśli TREK jest dla Ciebie przydatny i chciałbyś wesprzeć jego rozwój, mała kawa naprawdę pomaga mi tworzyć dalej — bez żadnej presji, ale każda filiżanka pozwala przetrwać kolejne nocne sesje przy kodzie.\n\nDziękuję, że tu jesteś.\n\n— Maurice',
  'system_notice.thank_you_support.highlight_opensource': '100% open source na GitHubie',
  'system_notice.thank_you_support.highlight_free': 'Darmowy na zawsze — nigdy żadnych płatnych wersji',
  'system_notice.thank_you_support.highlight_community': 'Tworzony wspólnie ze społecznością',
  'system_notice.thank_you_support.cta_bmc': 'Buy Me a Coffee',
  'system_notice.thank_you_support.cta_kofi': 'Wesprzyj na Ko-fi',
  'system_notice.pager.prev': 'Poprzednie powiadomienie',
  'system_notice.pager.next': 'Następne powiadomienie',
  'system_notice.pager.counter': '{current} / {total}',
  'system_notice.pager.goto': 'Przejdź do powiadomienia {n}',
  'system_notice.pager.position': 'Powiadomienie {current} z {total}',
  'system_notice.v3_photos.title': 'Zdjęcia zostały przeniesione w 3.0',
  'system_notice.v3_photos.body':
    '**Zdjęcia** w Planerze Podróży zostały usunięte. Twoje zdjęcia są bezpieczne — TREK nigdy nie modyfikował Twojej biblioteki Immich lub Synology.\n\nZdjęcia są teraz dostępne w dodatku **Journey**. Journey jest opcjonalny — jeśli jeszcze nie jest dostępny, poproś administratora o jego włączenie w Admin → Dodatki.',
  'system_notice.v3_journey.title': 'Poznaj Journey — dziennik podróży',
  'system_notice.v3_journey.body':
    'Dokumentuj swoje podróże jako bogatrze opowieści z osami czasu, galeriami i mapami interaktywnymi.',
  'system_notice.v3_journey.cta_label': 'Otwórz Journey',
  'system_notice.v3_journey.highlight_timeline': 'Dzienna oś czasu i galeria',
  'system_notice.v3_journey.highlight_photos': 'Import z Immich lub Synology',
  'system_notice.v3_journey.highlight_share': 'Udostępnij publicznie — bez logowania',
  'system_notice.v3_journey.highlight_export': 'Eksportuj jako książkę fotograficzną PDF',
  'system_notice.v3_features.title': 'Więcej nowości w 3.0',
  'system_notice.v3_features.body': 'Kilka innych rzeczy wartych uwagi w tym wydaniu.',
  'system_notice.v3_features.highlight_dashboard': 'Przeprojektowany pulpit mobile-first',
  'system_notice.v3_features.highlight_offline': 'Pełny tryb offline jako PWA',
  'system_notice.v3_features.highlight_search': 'Autouzupełnianie wyszukiwania miejsc',
  'system_notice.v3_features.highlight_import': 'Import miejsc z plików KMZ/KML',
  'system_notice.v3_mcp.title': 'MCP: aktualizacja OAuth 2.1',
  'system_notice.v3_mcp.body':
    'Integracja MCP została całkowicie przeprojektowana. OAuth 2.1 jest teraz zalecaną metodą uwierzytelniania. Statyczne tokeny (trek_…) są przestarzałe i zostaną usunięte w przyszłej wersji.',
  'system_notice.v3_mcp.highlight_oauth': 'OAuth 2.1 zalecany (mcp-remote)',
  'system_notice.v3_mcp.highlight_scopes': '24 szczegółowe zakresy uprawnień',
  'system_notice.v3_mcp.highlight_deprecated': 'Statyczne tokeny trek_ przestarzałe',
  'system_notice.v3_mcp.highlight_tools': 'Rozszerzony zestaw narzędzi i promptów',
  'system_notice.v3_thankyou.title': 'Osobiste słowo ode mnie',
  'system_notice.v3_thankyou.body':
    'Zanim pójdziesz dalej — chcę się na chwilę zatrzymać.\n\nTREK zaczął się jako poboczny projekt, który zbudowałem na własne podróże. Nigdy nie wyobrażałem sobie, że wyrośnie na coś, czemu 4000 z was ufa przy planowaniu swoich przygód. Każda gwiazdka, każdy issue, każda prośba o funkcję — czytam je wszystkie i to one trzymają mnie na nogach podczas późnych nocy między pracą na pełny etat a uczelnią.\n\nChcę, żebyście wiedzieli: TREK zawsze będzie open source, zawsze self-hosted, zawsze wasz. Bez śledzenia, bez subskrypcji, bez haczyków. Po prostu narzędzie zbudowane przez kogoś, kto kocha podróżowanie tak samo jak wy.\n\nSzczególne podziękowania dla [jubnl](https://github.com/jubnl) — stałeś się niesamowitym współpracownikiem. Tak wiele z tego, co czyni wersję 3.0 wspaniałą, nosi twój ślad. Dziękuję, że uwierzyłeś w ten projekt, gdy był jeszcze surowy.\n\nI każdemu z was, kto zgłosił błąd, przetłumaczył tekst, podzielił się TREK z przyjacielem lub po prostu użył go do zaplanowania podróży — **dziękuję**. To wy jesteście powodem, dla którego to istnieje.\n\nZa wiele kolejnych wspólnych przygód.\n\n— Maurice\n\n---\n\n[Dołącz do społeczności na Discordzie](https://discord.gg/7Q6M6jDwzf)\n\nJeśli TREK sprawia, że Twoje podróże są lepsze, [mała kawa](https://ko-fi.com/mauriceboe) zawsze pomaga utrzymać światła włączone.',
  'system_notice.v3014_whitespace_collision.title': 'Wymagane działanie: konflikt konta użytkownika',
  'system_notice.v3014_whitespace_collision.body':
    'Aktualizacja 3.0.14 wykryła jeden lub więcej konfliktów nazwy użytkownika lub adresu e-mail spowodowanych spacjami na początku lub końcu przechowywanych wartości. Dotknięte konta zostały automatycznie przemianowane. Sprawdź logi serwera pod kątem wierszy zaczynających się od **[migration] WHITESPACE COLLISION**, aby zidentyfikować konta wymagające przeglądu.',
};
export default system_notice;
