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
  // 4.0.0 release modal — the release on the left, the note from the maintainer on the right
  'system_notice.release_400.eyebrow': 'Aktualizace nainstalována',
  'system_notice.release_400.tag': 'Vydání',
  'system_notice.release_400.headline': 'Největší vydání, jaké kdy TREK měl.',
  'system_notice.release_400.intro':
    'TREK dostává telefon a knihu. Tohle vydání psalo devatenáct lidí — a šlo s ním asi sto padesát nahlášených chyb.',
  'system_notice.release_400.feature_mobile_title': 'TREK jde do mobilu',
  'system_notice.release_400.feature_mobile_body':
    'Všechno pod 768px je teď vlastní rozhraní — skleněný dok, vlastní panely, vlastní plánovač cesty. Otevřete TREK v telefonu.',
  'system_notice.release_400.feature_studio_title': 'TREK Studio',
  'system_notice.release_400.feature_studio_badge': 'Beta',
  'system_notice.release_400.feature_studio_body':
    'Z PDF v Journey se stal návrhář fotoknihy. Rozvrhne knihu, když si řeknete, a pak jde stranou.',
  'system_notice.release_400.feature_vacay_title': 'Vacay umí i zbytek',
  'system_notice.release_400.feature_vacay_body':
    'Půldny, náhradní volno a flexi dny, školní prázdniny v mřížce — a rok dovolené, který nemusí začínat v lednu.',
  'system_notice.release_400.feature_places_title': 'Místa se ukážou, soubory se odstěhují',
  'system_notice.release_400.feature_places_body':
    'Obrázky a popis se doplní samy, ještě než místo uložíte. A nahrané soubory už nemusí ležet na disku, kde běží TREK.',
  'system_notice.release_400.footnote':
    'A tohle jsou čtyři z nich. 4.0.0 nese několik stovek dalších změn, od Collections a Atlas až po celý server pod nimi.',
  'system_notice.release_400.note_eyebrow': 'Slovo od autora',
  'system_notice.release_400.note_title': 'Děkuji, že používáte TREK.',
  'system_notice.release_400.note_body':
    'TREK začal jako malý nástroj pro mé vlastní cesty, psaný ve volném čase. Pořád jím je: večery, víkendy, hodiny vedle práce na plný úvazek.\n\nChvíli jsem na to byl sám. Už ne — tohle vydání dotáhlo devatenáct lidí a tisíce z vás přišly s hvězdičkami, issues, překlady a pull requesty. Jsem vděčný za každý kousek.',
  'system_notice.release_400.promise_label': 'Slib',
  'system_notice.release_400.promise_text':
    'Open source část TREK zůstane zdarma, navždy. Žádné placené verze, žádná předplatná, žádné háčky. Slibuji.',
  'system_notice.release_400.note_body_after':
    '4.0.0 stálo týdny pozdních nocí — aplikace do telefonu, návrhář knih, migrace serveru, většina psaná mezi půlnocí a druhou. Není to stížnost: baví mě to stavět. Je to jen upřímná odpověď na to, jak z projektu ve volném čase vznikne takhle velké vydání.',
  'system_notice.release_400.note_closing': 'Děkuji, že jste tady.',
  'system_notice.release_400.note_signature': '— Maurice',
  'system_notice.release_400.support_text':
    'Podpora je to, co tohle drží v chodu — servery, domény a pozdní noci, ze kterých vznikají vydání jako tohle. Pokud pro vás TREK něco znamená, káva je nejpřímější způsob, jak ho udržet v běhu.',
  'system_notice.release_400.cta_bmc': 'Buy me a coffee',
  'system_notice.release_400.cta_kofi': 'Podpořit na Ko-fi',
};
export default system_notice;
