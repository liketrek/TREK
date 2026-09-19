import type { TranslationStrings } from '../types';

const system_notice: TranslationStrings = {
  'system_notice.welcome_v1.title': 'Vítejte v TREK',
  'system_notice.welcome_v1.body':
    'Váš kompletní plánovač cest. Vytvářejte itineráře, sdílejte výlety s přáteli a zůstaňte organizovaní — online i offline.',
  'system_notice.welcome_v1.cta_label': 'Naplánovat cestu',
  'system_notice.welcome_v1.hero_alt': 'Malebné cestovní místo s rozhraním TREK',
  'system_notice.welcome_v1.highlight_plan': 'Denní itineráře pro každou cestu',
  'system_notice.welcome_v1.highlight_share': 'Spolupráce s cestovními partnery',
  'system_notice.welcome_v1.highlight_offline': 'Funguje offline na mobilu',
  'system_notice.dev_test_modal.title': '[Dev] Test notice',
  'system_notice.dev_test_modal.body': 'This is a dev-only test notice.',
  'system_notice.thank_you_support.title': 'Děkuji, že používáte TREK',
  'system_notice.thank_you_support.body':
    'Rychlé poděkování za to, že jste si nainstalovali TREK — upřímně, znamená to pro mě hodně.\n\nJsem jediný vývojář a TREK tvořím ve svém volném čase. Začalo to jako malý nástroj jen pro mé vlastní cesty a od té doby mě podpora a zájem komunity naprosto dostávají. TREK dělám s velkým srdcem — ale také díky mnoha úžasným externím přispěvatelům, kteří ho pomohli utvářet.\n\n**TREK je open source a zcela zdarma — a tak to navždy zůstane. Žádné placené verze, žádná předplatná, žádné háčky. Slibuji.**\n\nPokud je pro vás TREK užitečný a chtěli byste podpořit jeho vývoj, malá káva mi opravdu pomáhá pokračovat ve tvoření — žádný tlak, ale každý šálek mi pomáhá přečkat pozdní noci.\n\nDěkuji, že jste tady.\n\n— Maurice',
  'system_notice.thank_you_support.highlight_opensource': '100% open source na GitHubu',
  'system_notice.thank_you_support.highlight_free': 'Navždy zdarma — nikdy žádné placené verze',
  'system_notice.thank_you_support.highlight_community': 'Tvořeno společně s komunitou',
  'system_notice.thank_you_support.cta_bmc': 'Buy Me a Coffee',
  'system_notice.thank_you_support.cta_kofi': 'Podpořit na Ko-fi',
  'system_notice.pager.prev': 'Předchozí oznámení',
  'system_notice.pager.next': 'Další oznámení',
  'system_notice.pager.counter': '{current} / {total}',
  'system_notice.pager.goto': 'Přejít na oznámení {n}',
  'system_notice.pager.position': 'Oznámení {current} z {total}',
  'system_notice.v3_photos.title': 'Fotografie přesunuty ve verzi 3.0',
  'system_notice.v3_photos.body':
    '**Fotografie** v Plánovacím nástroji byly odebrány. Vaše fotografie jsou v bezpečí — TREK nikdy neupravoval vaši knihovnu Immich nebo Synology.\n\nFotografie jsou nyní dostupné v doplňku **Journey**. Journey je volitelný — pokud ještě není k dispozici, požádejte svého správce, aby ho aktivoval v Admin → Doplňky.',
  'system_notice.v3_journey.title': 'Poznejte Journey — cest. denník',
  'system_notice.v3_journey.body':
    'Dokumentujte své cesty jako bohaté příběhy s časovnicemi, galeriemi fotek a interaktivními mapami.',
  'system_notice.v3_journey.cta_label': 'Otevřít Journey',
  'system_notice.v3_journey.highlight_timeline': 'Denní časovnice a galerie',
  'system_notice.v3_journey.highlight_photos': 'Import z Immich nebo Synology',
  'system_notice.v3_journey.highlight_share': 'Sdílet veřejně — bez přihlašování',
  'system_notice.v3_journey.highlight_export': 'Export jako PDF fotokniha',
  'system_notice.v3_features.title': 'Další novinky ve verzi 3.0',
  'system_notice.v3_features.body': 'Několik dalších změn, které stojí za pozornost.',
  'system_notice.v3_features.highlight_dashboard': 'Předesign dashboardu mobile-first',
  'system_notice.v3_features.highlight_offline': 'Plný offline režim jako PWA',
  'system_notice.v3_features.highlight_search': 'Autodoplňování vyhledávání míst',
  'system_notice.v3_features.highlight_import': 'Import míst ze souborů KMZ/KML',
  'system_notice.v3_mcp.title': 'MCP: aktualizace OAuth 2.1',
  'system_notice.v3_mcp.body':
    'Integrace MCP byla kompletně přepracována. OAuth 2.1 je nyní doporučenou metodou ověřování. Statické tokeny (trek_…) jsou zastaralé a budou v budoucí verzi odstraněny.',
  'system_notice.v3_mcp.highlight_oauth': 'OAuth 2.1 doporučeno (mcp-remote)',
  'system_notice.v3_mcp.highlight_scopes': '24 jemnozrnných oprávnění',
  'system_notice.v3_mcp.highlight_deprecated': 'Statické tokeny trek_ zastaralé',
  'system_notice.v3_mcp.highlight_tools': 'Rozšířená sada nástrojů a promptů',
  'system_notice.v3_thankyou.title': 'Osobní slovo ode mě',
  'system_notice.v3_thankyou.body':
    'Než budete pokračovat — chci se na chvíli zastavit.\n\nTREK začal jako vedlejší projekt, který jsem vytvořil pro své vlastní cesty. Nikdy jsem si nepředstavoval, že vyroste v něco, čemu 4 000 z vás důvěřuje při plánování svých dobrodružství. Každou hvězdičku, každý issue, každý požadavek na funkci — všechny čtu a právě ony mě drží při životě během pozdních nocí mezi prací na plný úvazek a univerzitou.\n\nChci, abyste věděli: TREK bude vždy open source, vždy self-hosted, vždy váš. Žádné sledování, žádná předplatná, žádné háčky. Jen nástroj vytvořený někým, kdo miluje cestování stejně jako vy.\n\nZvláštní poděkování patří [jubnl](https://github.com/jubnl) — stal ses neuvěřitelným spolupracovníkem. Tolik z toho, co dělá verzi 3.0 skvělou, nese tvůj rukopis. Děkuji, že jsi věřil tomuto projektu, když byl ještě v plenkách.\n\nA každému z vás, kdo nahlásil chybu, přeložil řetězec, sdílel TREK s přítelem nebo ho jednoduše použil k plánování cesty — **děkuji**. Vy jste důvod, proč tohle existuje.\n\nNa mnoho dalších dobrodružství společně.\n\n— Maurice\n\n---\n\n[Přidej se ke komunitě na Discordu](https://discord.gg/7Q6M6jDwzf)\n\nPokud ti TREK zlepšuje cestování, [malá káva](https://ko-fi.com/mauriceboe) vždy pomůže udržet světla rozsvícená.',
  'system_notice.v3014_whitespace_collision.title': 'Vyžadována akce: konflikt uživatelského účtu',
  'system_notice.v3014_whitespace_collision.body':
    'Aktualizace 3.0.14 zjistila jeden nebo více konfliktů uživatelského jména nebo e-mailu způsobených mezerami na začátku nebo konci uložených hodnot. Dotčené účty byly automaticky přejmenovány. Zkontrolujte protokoly serveru na řádky začínající **[migration] WHITESPACE COLLISION** a zjistěte, které účty vyžadují kontrolu.',
  // The release modal. One stable set of keys: each big release swaps the copy in place.
  'system_notice.release_notes.eyebrow': 'Aktualizace nainstalována',
  'system_notice.release_notes.headline': 'Tři věci, které TREK teď zvládne sám.',
  'system_notice.release_notes.intro':
    'Vlastní API pro místa, cesty autem naplánované od začátku do konce a vaše historie polohy opět ve vašich rukou.',
  'system_notice.release_notes.features_label': 'Hlavní novinky',
  'system_notice.release_notes.features_aside': 'Zdaleka ne všechno',
  'system_notice.release_notes.feature_places_title': 'TREK Places API',
  'system_notice.release_notes.feature_places_body':
    'První open source plánovač cest, který provozuje vlastní API pro místa. 73,6 milionu míst, každý měsíc nově sestavených. Žádný klíč, žádná kvóta.',
  'system_notice.release_notes.feature_roadtrip_title': 'Doplněk Cesta autem',
  'system_notice.release_notes.feature_roadtrip_body':
    'Režim Cesta autem naplánuje i samotnou jízdu: trasu, vzdálenost, hodiny za volantem i zastávky. Jde o doplněk, který zůstává vypnutý, dokud ho nezapne správce.',
  'system_notice.release_notes.feature_dawarich_title': 'Integrace Dawarich',
  'system_notice.release_notes.feature_dawarich_body':
    'Self-hosted odpověď na Google Timeline, teď čitelná přímo v TREK. TREK čte, a jen čte. Nic se nikdy nezapisuje zpět.',
  'system_notice.release_notes.footnote': 'A k tomu dlouhý seznam menších změn napříč zbytkem TREK.',
  'system_notice.release_notes.notes_label': 'Poznámky k vydání',
  'system_notice.release_notes.note_eyebrow': 'Slovo od autora',
  'system_notice.release_notes.note_title': 'Vy jste důvod, proč na TREK pořád pracuji.',
  'system_notice.release_notes.note_body':
    'TREK začal jako malý nástroj pro mé vlastní cesty, psaný po práci, protože jsem je chtěl plánovat lépe. Vlastně nikdy nepřestal růst. Skoro všechno, co používáte, vzniklo pozdě v noci, o víkendech, ve vlacích, vedle práce na plný úvazek, a bylo spoustu večerů, kdy jsem se potichu ptal, jestli ho tam venku vůbec někdy někdo otevře.',
  'system_notice.release_notes.promise_label': 'Slib',
  'system_notice.release_notes.promise_lead': 'TREK zůstane zdarma, navždy.',
  'system_notice.release_notes.promise_text':
    'Každá funkce, každá aktualizace, pro všechny. Žádné placené verze, žádná předplatná, žádné háčky.',
  'system_notice.release_notes.note_body_after':
    'A pak jste ho otevřeli. Během pár měsíců vás byly tisíce: hvězdičky, hlášení chyb, překlady do jazyků, kterými nemluvím, pull requesty od lidí, které jsem nikdy nepotkal. Každé ráno se pořád nejdřív podívám do repozitáře a pořád mi to nepřijde úplně skutečné.',
  'system_notice.release_notes.note_closing': 'Děkuji, že jste tady. Váš Maurice',
  'system_notice.release_notes.support_lead':
    'TREK je a vždycky bude zdarma, ale servery, domény a spousta pozdních nocí zdarma nejsou.',
  'system_notice.release_notes.support_text':
    'Pokud si TREK získal místo na vašich cestách, kupte mi kávu a pomozte, aby přišlo i další vydání.',
  'system_notice.release_notes.cta_bmc': 'Buy me a coffee',
  'system_notice.release_notes.cta_kofi': 'Podpořit na Ko-fi',
};
export default system_notice;
