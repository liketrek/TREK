import type { TranslationStrings } from '../types';

// English fallback until 'cs' is translated.
const help: TranslationStrings = {
  'help.title': 'Help & Docs',
  'help.search': 'Search docs…',
  'help.contents': 'Contents',
  'help.noResults': 'No matching pages.',
  'help.errorTitle': "Couldn't load this page",
  'help.errorBody': 'The help content is fetched from the TREK wiki. Check your connection and try again.',

  // center
  'help.center.button': 'Nápověda k této obrazovce',
  'help.center.title': 'Nápověda',
  'help.center.onThisScreen': 'Na této obrazovce',
  'help.center.screens': 'Obrazovky',
  'help.center.thisScreen': 'Tato obrazovka',
  'help.center.subScreens': 'Podobrazovky: {count}',
  'help.center.subScreensLabel': 'Podobrazovky',
  'help.center.guidesCount': 'Návody: {count}',
  'help.center.goToScreen': 'Přejít na {screen}',
  'help.center.overview': 'Přehled',
  'help.center.howTo': 'Jak mohu…',
  'help.center.searchPlaceholder': 'Hledat v návodech a dokumentaci…',
  'help.center.searchEmpty': 'Pro „{query}“ nebylo nic nalezeno.',
  'help.center.searchGuides': 'Návody',
  'help.center.searchDocs': 'Dokumentace',
  'help.center.searchError': 'Hledání teď není k dispozici.',
  'help.center.back': 'Zpět',
  'help.center.close': 'Zavřít nápovědu',
  'help.center.steps': 'Kroků: {count}',
  'help.center.step': 'Krok {n}',
  'help.center.stepsLabel': 'Kroky',
  'help.center.stepOf': 'Krok {n} z {total}',
  'help.center.screenshot': 'Snímek',
  'help.center.result': 'Výsledek',
  'help.center.tips': 'Dobré vědět',
  'help.center.related': 'Související',
  'help.center.openDocs': 'Otevřít v Nápovědě a dokumentaci',
  'help.center.docsSection': 'V dokumentaci',
  'help.center.noContext': 'Pro tuto obrazovku zatím není návod.',
  'help.center.noContextHint': 'Prohledejte dokumentaci nebo nám napište, co jste hledali.',
  'help.center.feedback': 'Něco chybí?',
  'help.center.feedbackLink': 'Napište nám na GitHubu',
  'help.center.discord': 'Zeptejte se na Discordu',
  'help.center.quick': 'Rychlé',
  'help.center.guide': 'Návod',
  'help.center.tour': 'Ukázka',
  'help.center.imageAlt': 'Krok {n} návodu „{title}“',

  // ctx
  'help.ctx.dashboard.title': 'Přehled',
  'help.ctx.dashboard.summary':
    'Přehled je vstupní branou ke každé cestě. Palubní lístek nahoře zvýrazňuje cestu, která právě probíhá nebo je na řadě, řádek pod ním počítá, co jste už procestovali, a karty vypisují vše, co plánujete, archivovali jste nebo už máte za sebou.',
  'help.ctx.dashboard.bullet.1':
    'Palubní lístek: probíhající nebo příští cesta s daty, cestujícími, místy a odpočtem. Kliknutím cestu otevřete.',
  'help.ctx.dashboard.bullet.2':
    'Statistiky: navštívené země, cesty, dny na cestách a nalétaná vzdálenost napříč všemi cestami.',
  'help.ctx.dashboard.bullet.3':
    'Karty cest, filtrované na Plánované, Archivováno a Dokončeno, jako mřížka nebo seznam. Najeďte na kartu pro úpravu, duplikování, archivaci a smazání.',
  'help.ctx.dashboard.bullet.4':
    'Widgety vpravo: převodník měn, světové hodiny, nadcházející rezervace a sbírky. Každý z nich lze vypnout.',
  'help.ctx.dashboard.bullet.5': 'Karta „Nová cesta“ i tlačítko vpravo dole zakládají novou cestu.',

  // create-trip
  'help.guide.create-trip.title': 'Založit cestu',
  'help.guide.create-trip.goal': 'Začít novou cestu s názvem, daty a úvodní fotkou.',
  'help.guide.create-trip.step.1':
    'Klikněte na „Nová cesta“. Karta na konci vašich cest a tlačítko vpravo dole dělají totéž.',
  'help.guide.create-trip.step.2': 'Pojmenujte cestu. Je to jediné povinné pole; všechno ostatní lze doplnit později.',
  'help.guide.create-trip.step.3':
    'Vyberte datum začátku a konce. TREK založí jeden den na každé datum, takže je itinerář připravený k naplnění.',
  'help.guide.create-trip.step.4':
    'Volitelně: přidejte úvodní fotku. Nahrajte vlastní, přetáhněte ji sem, nebo vyhledejte destinaci na Unsplash.',
  'help.guide.create-trip.step.5': 'Klikněte na „Vytvořit novou cestu“.',
  'help.guide.create-trip.result':
    'Cesta se objeví v přehledu. Pokud je to vaše příští cesta, převezme palubní lístek nahoře.',
  'help.guide.create-trip.tip.1':
    'Data lze později změnit. Pokud už existují rezervace, TREK se zeptá, zda je posunout spolu se dny.',
  'help.guide.create-trip.tip.2':
    'Měna cesty, kterou tu zvolíte, je ta, na kterou se přepočítává každý výdaj. Zvolte měnu destinace.',

  // edit-trip
  'help.guide.edit-trip.title': 'Upravit cestu',
  'help.guide.edit-trip.goal': 'Přejmenovat cestu, změnit data nebo upravit nastavení.',
  'help.guide.edit-trip.step.1': 'Najeďte na kartu cesty (nebo palubní lístek) a klikněte na tužku.',
  'help.guide.edit-trip.step.2':
    'Změňte, co potřebujete: název, popis, data, úvodní fotku, měnu, připomínku nebo členy.',
  'help.guide.edit-trip.step.3': 'Klikněte na „Aktualizovat“.',
  'help.guide.edit-trip.result': 'Karta se ihned aktualizuje, pro každého člena cesty.',
  'help.guide.edit-trip.tip.1':
    'Posun dat u cesty, která už má rezervace, otevře druhý krok s otázkou, zda se mají posunout i rezervace.',

  // cover-image
  'help.guide.cover-image.title': 'Nastavit úvodní fotku',
  'help.guide.cover-image.goal': 'Dát cestě obrázek, který se ukáže na kartě i na palubním lístku.',
  'help.guide.cover-image.step.1': 'Otevřete formulář úprav cesty tužkou na její kartě.',
  'help.guide.cover-image.step.2':
    'V části „Úvodní obrázek“ přetáhněte fotku, klikněte pro nahrání, nebo napište destinaci do vyhledávání Unsplash.',
  'help.guide.cover-image.step.3': 'Vyberte fotku a klikněte na „Aktualizovat“.',
  'help.guide.cover-image.result': 'Fotka se uloží k cestě a zobrazí se všude, kde je cesta uvedená.',
  'help.guide.cover-image.tip.1':
    'Fotky z vyhledávání Unsplash mají automaticky uvedeného autora; vlastní nahrané soubory zůstávají na vašem serveru.',

  // duplicate-trip
  'help.guide.duplicate-trip.title': 'Duplikovat cestu',
  'help.guide.duplicate-trip.goal': 'Použít cestu jako šablonu pro novou.',
  'help.guide.duplicate-trip.step.1': 'Najeďte na kartu a klikněte na ikonu duplikování.',
  'help.guide.duplicate-trip.step.2': 'Přečtěte si, co se zkopíruje a co ne, a potvrďte.',
  'help.guide.duplicate-trip.result': 'Vedle originálu se objeví kopie, připravená k přejmenování a novým datům.',
  'help.guide.duplicate-trip.tip.1':
    'Dny, místa, rezervace, položky rozpočtu, balicí seznamy a poznámky ke dnům se zkopírují. Členové, chat, ankety, soubory a odkazy pro sdílení ne.',

  // archive-trip
  'help.guide.archive-trip.title': 'Archivovat a obnovit cestu',
  'help.guide.archive-trip.goal': 'Odložit cestu bez mazání a později ji vrátit.',
  'help.guide.archive-trip.step.1': 'Najeďte na kartu a klikněte na „Archivovat“.',
  'help.guide.archive-trip.step.2': 'Přepněte filtr nad kartami na „Archivováno“, abyste ji znovu viděli.',
  'help.guide.archive-trip.step.3': 'Klikněte na kartě na „Obnovit“ a cesta se vrátí mezi „Plánované“.',
  'help.guide.archive-trip.result':
    'Archivované cesty si zachovají vše. Jen už nezabírají místo v přehledu a v kalendářovém kanálu všech cest.',

  // delete-trip
  'help.guide.delete-trip.title': 'Smazat cestu',
  'help.guide.delete-trip.goal': 'Cestu nadobro odstranit.',
  'help.guide.delete-trip.step.1': 'Najeďte na kartu a klikněte na koš.',
  'help.guide.delete-trip.step.2': 'Potvrďte. Dialog uvádí název cesty, abyste věděli, že mažete tu správnou.',
  'help.guide.delete-trip.result':
    'Cesta, její dny, místa, rezervace a soubory jsou pryč. Nelze to vrátit; v pochybnostech raději archivujte.',

  // filter-and-view
  'help.guide.filter-and-view.title': 'Najít dokončené cesty, přepnout mřížku a seznam',
  'help.guide.filter-and-view.goal':
    'Zobrazit dokončené nebo archivované cesty a vybrat rozložení, které vám vyhovuje.',
  'help.guide.filter-and-view.step.1':
    'Použijte „Plánované“, „Archivováno“ a „Dokončeno“ nad kartami. Dokončená je každá cesta, jejíž datum konce už minulo.',
  'help.guide.filter-and-view.step.2':
    'Kliknutím na ikonu seznamu přepnete na kompaktní seznam; dalším kliknutím zpět na mřížku.',
  'help.guide.filter-and-view.result': 'Přehled si na tomto zařízení vaše rozložení pamatuje.',

  // calendar-feed
  'help.guide.calendar-feed.title': 'Odebírat všechny cesty v kalendáři',
  'help.guide.calendar-feed.goal':
    'Vidět dny a rezervace každé aktivní cesty ve své kalendářové aplikaci, stále synchronizované.',
  'help.guide.calendar-feed.step.1': 'Klikněte na ikonu kalendáře vedle přepínače zobrazení.',
  'help.guide.calendar-feed.step.2':
    'Klikněte na „Enable calendar subscription“. TREK vytvoří soukromý odkaz na kanál.',
  'help.guide.calendar-feed.step.3':
    'Přidejte kanál jedním z tlačítek (Google, Apple, Outlook) nebo zkopírujte odkaz do libovolné kalendářové aplikace, která umí odebírat URL.',
  'help.guide.calendar-feed.result':
    'Každá aktivní cesta se objeví ve vašem kalendáři a sama se aktualizuje. Archivované cesty a cesty skončené před více než 90 dny zůstanou stranou.',
  'help.guide.calendar-feed.tip.1':
    'Odkaz je tajný. Kdokoli ho má, může kanál číst; pokud unikne, zrušte ho ve stejném dialogu.',

  // widgets
  'help.guide.widgets.title': 'Vybrat widgety přehledu',
  'help.guide.widgets.goal': 'Zobrazit nebo skrýt řádek statistik a widgety vpravo.',
  'help.guide.widgets.step.1': 'Otevřete nabídku svého avatara vpravo nahoře a zvolte „Nastavení“.',
  'help.guide.widgets.step.2': 'Přepněte na kartu „Appearance“.',
  'help.guide.widgets.step.3':
    'V části „Dashboard widgets“ zapněte nebo vypněte jednotlivé widgety. Počítač a mobil se nastavují zvlášť.',
  'help.guide.widgets.step.4': 'Vraťte se do přehledu. Změna platí okamžitě.',
  'help.guide.widgets.result':
    'Skryté widgety uvolní místo vašim cestám; vypnutím celého pravého sloupce se rozložení vycentruje.',
  'help.guide.widgets.link': 'Otevřít nastavení vzhledu',

  // currency-widget
  'help.guide.currency-widget.title': 'Převádět měny',
  'help.guide.currency-widget.goal': 'Převést částku mezi dvěma měnami podle aktuálních kurzů.',
  'help.guide.currency-widget.step.1': 'Zadejte částku a vyberte obě měny.',
  'help.guide.currency-widget.step.2': 'Šipka mezi nimi dvojici prohodí; kruhová šipka načte kurz znovu.',
  'help.guide.currency-widget.result': 'Vaše dvojice měn se pamatuje u účtu, takže je stejná na každém zařízení.',
  'help.guide.currency-widget.tip.1': 'Kurzy pocházejí z Evropské centrální banky a aktualizují se jednou denně.',

  // timezones-widget
  'help.guide.timezones-widget.title': 'Přidat světové hodiny',
  'help.guide.timezones-widget.goal': 'Mít přehled o místním čase ve svých destinacích.',
  'help.guide.timezones-widget.step.1': 'Klikněte na + ve widgetu „Časová pásma“ a vyhledejte město.',
  'help.guide.timezones-widget.step.2': 'Hodiny odeberete křížkem × vedle nich.',
  'help.guide.timezones-widget.result': 'Vaše hodiny se ukládají k vašemu účtu.',

  // ── Screen: vacay ──────────────────────────────────────────────────────────
  'help.ctx.vacay.title': 'Vacay',
  'help.ctx.vacay.summary':
    'Vacay je váš osobní plánovač dovolené: kolik dní dovolené v roce máte, které jste si zapsali a kolik zbývá. Mřížka ukazuje celý rok na jeden pohled; v postranním panelu je výběr roku, lidé, se kterými plánujete, sdílené kalendáře, legenda a váš nárok.',
  'help.ctx.vacay.bullet.1':
    'Roční mřížka: dvanáct karet měsíců, jedna buňka na den. Kliknutím den zapíšete nebo smažete. Malá modrá tečka označuje dny, které už pokrývá cesta.',
  'help.ctx.vacay.bullet.2':
    'Lišta dole: režim Dovolená nebo Firemní volno, plus přepínače Půlden a Náhradní volno, které mění, co kliknutí zapíše.',
  'help.ctx.vacay.bullet.3':
    'Nárok: vaše dny na rok, kolik je vyčerpáno a kolik zbývá, včetně převodu z minulého období.',
  'help.ctx.vacay.bullet.4':
    'Osoby jsou lidé sloučení s vaším plánem, každý ve své barvě. Sdílené kalendáře jsou kroužky jen pro čtení s volnem ostatních.',
  'help.ctx.vacay.bullet.5':
    'Nastavení pokrývá víkendy, začátek týdne, převod, váš dovolenkový rok, firemní volno a kalendáře svátků nebo školních prázdnin.',
  // log-day
  'help.guide.log-day.title': 'Zapsat den dovolené',
  'help.guide.log-day.goal': 'Označit volný den v roční mřížce a sledovat, jak se zůstatek mění.',
  'help.guide.log-day.step.1':
    'Podívejte se na lištu dole: levé tlačítko ve vaší barvě znamená, že kliknutí zapíše den dovolené pro vás.',
  'help.guide.log-day.step.2':
    'Klikněte na den v kterékoli kartě měsíce. Vyplní se vaší barvou a Vyčerpáno napočítá o den víc.',
  'help.guide.log-day.step.3': 'Kliknutím na stejný den ho zase smažete.',
  'help.guide.log-day.result':
    'Den je zapsaný, Dní, Vyčerpáno a Zbývá se hned aktualizují a kdokoli sloučený s vaším plánem to vidí živě.',
  'help.guide.log-day.tip.1': 'Víkendy nelze zapsat, dokud je v Nastavení zapnuté Blokovat víkendy.',
  'help.guide.log-day.tip.2':
    'Modrá tečka v buňce znamená, že ten den pokrývá jedna z vašich cest, takže vidíte, kde se dovolená a cestování potkávají.',
  // half-day
  'help.guide.half-day.title': 'Zapsat půlden',
  'help.guide.half-day.goal': 'Vzít si odpoledne volno bez utracení celého dne nároku.',
  'help.guide.half-day.step.1':
    'Zapněte na liště Půlden. Jeho oranžová tečka je značka, kterou půlden dostane v mřížce.',
  'help.guide.half-day.step.2': 'Klikněte na den. Zapíše se jako 0,5 a nese oranžovou tečku v rohu.',
  'help.guide.half-day.step.3':
    'Až skončíte, Půlden zase vypněte; kliknutí na půlden s jiným nastavením ho na místě převede.',
  'help.guide.half-day.result':
    'Vyčerpáno vzroste o 0,5. Půlden a Náhradní volno jsou nezávislé, takže jde i půlden náhradního volna.',
  'help.guide.half-day.tip.1':
    'Lišta vždy ukazuje značku, kterou příští kliknutí umístí, takže si to můžete před zápisem ověřit.',
  // comp-day
  'help.guide.comp-day.title': 'Zapsat náhradní volno',
  'help.guide.comp-day.goal': 'Vybrat si náhradní volno, které nestojí dny dovolené.',
  'help.guide.comp-day.step.1':
    'Zapněte na liště Náhradní volno. Šrafovaný kotouč je podoba dne náhradního volna v mřížce.',
  'help.guide.comp-day.step.2': 'Klikněte na den. Vyplní se diagonálním šrafováním ve vaší barvě místo plné plochy.',
  'help.guide.comp-day.result': 'Dny náhradního volna se počítají vedle dlaždic nároku a nikdy nesnižují Zbývá.',
  'help.guide.comp-day.tip.1':
    'Vybrané přesčasy, pružná pracovní doba, den volna náhradou: vše, co je volno, ale ne dovolená, patří sem.',
  // entitlement
  'help.guide.entitlement.title': 'Nastavit nárok',
  'help.guide.entitlement.goal': 'Říct Vacay, kolik dní dovolené v roce máte.',
  'help.guide.entitlement.step.1': 'V postranním panelu klikněte na dlaždici Dní pod Nárokem.',
  'help.guide.entitlement.step.2': 'Napište počet dní a stiskněte Enter.',
  'help.guide.entitlement.result': 'Zbývá se přepočítá z vašeho nároku, případného převodu a vyčerpaných dní.',
  'help.guide.entitlement.tip.1': 'Každý rok má vlastní nárok, změna zde se týká jen vybraného roku.',
  // years
  'help.guide.years.title': 'Přidat roky a přepínat mezi nimi',
  'help.guide.years.goal': 'Naplánovat už příští rok nebo se podívat na ten minulý.',
  'help.guide.years.step.1': 'Kliknutím na + vpravo od letopočtu přidáte další rok, kliknutím na + vlevo předchozí.',
  'help.guide.years.step.2': 'Mezi roky přepínáte šipkami nebo štítky roků pod nimi.',
  'help.guide.years.step.3':
    'Rok odeberete tak, že najedete na jeho štítek a kliknete na malé mínus. Jeho záznamy zmizí s ním, potvrzujte s rozmyslem.',
  'help.guide.years.result': 'Každý rok si drží vlastní nárok a záznamy; převod je spojuje.',
  // company-holidays
  'help.guide.company-holidays.title': 'Označit firemní volno',
  'help.guide.company-holidays.goal': 'Zablokovat dny, kdy má volno celá firma, aniž by to stálo něčí nárok.',
  'help.guide.company-holidays.step.1':
    'Otevřete Nastavení a ověřte, že je Firemní volno zapnuté. Je to výchozí stav; lišta nabízí režim jen tehdy, když je zapnuté.',
  'help.guide.company-holidays.step.2': 'Zpět v mřížce přepněte lištu do režimu Firemní volno.',
  'help.guide.company-holidays.step.3': 'Klikněte na dny. Zbarví se jantarově a objeví se v legendě.',
  'help.guide.company-holidays.result': 'Firemní volno vidí všichni sloučení s plánem a nikdy nesnižuje Zbývá.',
  'help.guide.company-holidays.tip.1': 'Firemní volno může upravovat kdokoli sloučený, domluvte se, kdo ho spravuje.',
  // public-holidays
  'help.guide.public-holidays.title': 'Zobrazit státní svátky',
  'help.guide.public-holidays.goal': 'Dostat do mřížky svátky vaší země nebo regionu.',
  'help.guide.public-holidays.step.1': 'Otevřete Nastavení a zapněte Státní svátky.',
  'help.guide.public-holidays.step.2':
    'Klikněte na Přidat kalendář, vyberte zemi a tam, kde na tom záleží, i region. Dejte mu barvu a popisek, chcete-li.',
  'help.guide.public-holidays.step.3': 'Zavřete Nastavení. Svátky se objeví v mřížce a v legendě.',
  'help.guide.public-holidays.result':
    'Svátky jsou označené barvou kalendáře a nikdy se nepočítají proti vašemu nároku.',
  'help.guide.public-holidays.tip.1': 'Můžete přidat víc kalendářů, třeba svůj region a region sloučeného kolegy.',
  // school-holidays
  'help.guide.school-holidays.title': 'Zobrazit školní prázdniny',
  'help.guide.school-holidays.goal': 'Vidět školní prázdniny vašeho regionu vedle vlastního volna.',
  'help.guide.school-holidays.step.1': 'Otevřete Nastavení a zapněte School Holidays.',
  'help.guide.school-holidays.step.2':
    'Klikněte na Přidat kalendář a vyberte zemi. Kde země kalendář dělí, vyberte i region nebo skupinu.',
  'help.guide.school-holidays.step.3':
    'Zavřete Nastavení. Každé prázdniny dostanou barevný pruh u spodního okraje svých dnů.',
  'help.guide.school-holidays.result': 'Školní prázdniny jsou čistě vizuální: nikdy nikomu nesnižují nárok.',
  'help.guide.school-holidays.tip.1':
    'Chybí region? Správce může školní prázdniny spravovat ručně v části Administrace, Personalizace, Školní prázdniny.',
  // weekends
  'help.guide.weekends.title': 'Blokovat víkendy a nastavit začátek týdne',
  'help.guide.weekends.goal': 'Nechat víkendy mimo počítání a začínat týden dnem, na který jste zvyklí.',
  'help.guide.weekends.step.1': 'Otevřete Nastavení.',
  'help.guide.weekends.step.2': 'Zapněte Blokovat víkendy a vyberte, které dny se počítají jako váš víkend.',
  'help.guide.weekends.step.3': 'Pod Týden začíná zvolte pondělí nebo neděli.',
  'help.guide.weekends.result': 'Blokované dny jsou v mřížce zašedlé a nedají se omylem zapsat.',
  // leave-year
  'help.guide.leave-year.title': 'Nastavit dovolenkový rok',
  'help.guide.leave-year.goal': 'Počítat nárok přes fiskální rok nebo od data nástupu místo od ledna do prosince.',
  'help.guide.leave-year.step.1': 'Otevřete Nastavení a najděte Dovolenkový rok.',
  'help.guide.leave-year.step.2':
    'Zvolte Kalendářní, Fiskální (s měsícem a dnem začátku) nebo Datum nástupu (s datem, kdy jste nastoupili).',
  'help.guide.leave-year.result':
    'Nárok, vyčerpané dny a převod sledují toto období a mřížka začíná jeho prvním měsícem.',
  'help.guide.leave-year.tip.1':
    'Toto nastavení je osobní: ve sloučeném plánu si každý drží vlastní dovolenkový rok a čísla.',
  // carry-over
  'help.guide.carry-over.title': 'Převést nevyčerpané dny',
  'help.guide.carry-over.goal': 'Přičíst, co na konci období zbylo, k tomu dalšímu.',
  'help.guide.carry-over.step.1': 'Otevřete Nastavení.',
  'help.guide.carry-over.step.2': 'Zapněte Převod dovolené.',
  'help.guide.carry-over.result': 'Převedené množství se přepočítá přes všechny vaše roky a zobrazí pod nárokem.',
  'help.guide.carry-over.tip.1': 'Vypnutí vynuluje každý převedený zůstatek.',
  // invite
  'help.guide.invite.title': 'Plánovat společně s někým',
  'help.guide.invite.goal': 'Sloučit svůj plán s jiným uživatelem TREKu, abyste viděli volno obou v jedné mřížce.',
  'help.guide.invite.step.1': 'Klikněte na ikonu osoby v panelu Osoby.',
  'help.guide.invite.step.2': 'Vyberte uživatele a odešlete pozvánku.',
  'help.guide.invite.step.3': 'Dostane oznámení a přijme ji. Do té doby je pozvánka označená jako čekající.',
  'help.guide.invite.result':
    'Oba plány se sloučí: každý má svou barvu, můžete si navzájem zapisovat dny a vše se synchronizuje živě.',
  'help.guide.invite.tip.1':
    'Sloučení zrušíte přes Oddělit v Nastavení. Záznamy každého se vrátí do jeho vlastního plánu.',
  'help.guide.invite.tip.2': 'Pokud má druhá osoba vaše dny jen vidět, sdílejte kalendář místo slučování.',
  // share-calendar
  'help.guide.share-calendar.title': 'Sdílet kalendář jen pro čtení',
  'help.guide.share-calendar.goal': 'Nechat někoho vidět, kdy máte volno, aniž by mohl do vašeho plánu zasahovat.',
  'help.guide.share-calendar.step.1': 'Klikněte na ikonu sdílení v panelu Sdílené kalendáře.',
  'help.guide.share-calendar.step.2': 'Vyberte uživatele a klikněte na Sdílet. Není potřeba žádné přijetí.',
  'help.guide.share-calendar.step.3':
    'Kalendáře sdílené s vámi se objeví ve stejném panelu; oko jeden skryje, Ukončit sdílení odvolá ten váš.',
  'help.guide.share-calendar.result':
    'Vaše volno se v jeho mřížce objeví jako barevný kroužek. Nic, co sdílíte, tam nejde upravit.',
  'help.guide.share-calendar.tip.1':
    'Sdílení a sloučení jsou nezávislé: můžete být sloučeni s jedním člověkem a sdílet s dalšími.',
  'help.guide.share-calendar.tip.2': 'Najeďte na den s kroužkem a uvidíte, kdo má volno a jak dlouho.',

  // ── Screen: atlas ─────────────────────────────────────────────────────────────────────
  'help.ctx.atlas.title': 'Atlas',
  'help.ctx.atlas.summary':
    'Atlas je vaše cestovatelská stopa na mapě světa: každá země, kam vás zavedla cesta, je vybarvená, a ty, které jste navštívili před TREKem, doplníte ručně. Přiblížením uvidíte regiony, vedete si bucket list míst, která ještě chcete vidět, a svoje čísla čtete ve skleněném panelu dole.',
  'help.ctx.atlas.bullet.1':
    'Mapa: navštívené země mají barvu, která jim zůstává, plánované země mají čárkovaný obrys, země z bucket listu diagonální šrafování, všechno ostatní je šedé. Najeďte na zemi a uvidíte její cesty, místa a první i poslední návštěvu.',
  'help.ctx.atlas.bullet.2':
    'Hledání nahoře: napište zemi nebo místo. Výběr země tam mapu přenese a otevře její okno; výběr místa přistane v jeho regionu, abyste ho mohli označit.',
  'help.ctx.atlas.bullet.3':
    'Zobrazit plánované země, vpravo nahoře: odhalí země vašich nadcházejících cest. Přepínač se objeví jen, dokud nějaké máte.',
  'help.ctx.atlas.bullet.4':
    'Panel dole: karta Statistiky se zeměmi, cestami, místy, městy, dny, kontinenty a vaší sérií; karta Bucket List s tím, co vás ještě čeká.',
  'help.ctx.atlas.bullet.5':
    'Regiony: od úrovně přiblížení 5 mapa přepne na státy a provincie, každý lze kliknutím označit nebo odebrat.',
  'help.ctx.atlas.bullet.6':
    'Dawarich: s připojeným doplňkem panel vlevo od statistik odškrtává přání a přidává země z vašich záznamů, nikdy bez vašeho potvrzení.',
  // mark-country
  'help.guide.mark-country.title': 'Označit zemi jako navštívenou',
  'help.guide.mark-country.goal': 'Doplňte zemi, kde jste byli před TREKem, aby ji mapa i počítadlo zahrnuly.',
  'help.guide.mark-country.step.1': 'Napište zemi do vyhledávacího pole nahoře na mapě.',
  'help.guide.mark-country.step.2': 'Vyberte ji ze seznamu. Mapa tam přeletí a otevře se okno pro tuto zemi.',
  'help.guide.mark-country.step.3': 'Zvolte Označit jako navštívené.',
  'help.guide.mark-country.result':
    'Země dostane na mapě svou barvu a Země napočítá o jednu víc. Barva je trvalá: označení dalších zemí ostatní nikdy nepřemíchá.',
  'help.guide.mark-country.tip.1':
    'Kliknutí na šedou zemi na mapě otevře stejné okno; u malých zemí je hledání jistá cesta.',
  'help.guide.mark-country.tip.2': 'Ručně označená země se vždy počítá jako navštívená, ať má cesta tam jakákoli data.',
  // unmark-country
  'help.guide.unmark-country.title': 'Odebrat označenou zemi',
  'help.guide.unmark-country.goal': 'Sundejte ručně označenou zemi zase z mapy.',
  'help.guide.unmark-country.step.1':
    'Vyhledejte zemi a vyberte ji, nebo na ni klikněte na mapě. U země, kterou jste označili sami, se okno zeptá, zda ji odebrat.',
  'help.guide.unmark-country.step.2': 'Potvrďte tlačítkem Odebrat.',
  'help.guide.unmark-country.result': 'Země zase zešedne a opustí vaše počítadlo.',
  'help.guide.unmark-country.tip.1':
    'Takhle jdou odebrat jen ručně označené země. Země s cestami nebo místy zůstává, dokud je má; Odebrat je i v její kartě detailu v panelu, když byla označena ručně.',
  // country-details
  'help.guide.country-details.title': 'Podívat se, co jste v zemi dělali',
  'help.guide.country-details.goal': 'Otevřete navštívenou zemi a skočte na cesty, které vás tam zavedly.',
  'help.guide.country-details.step.1': 'Vyhledejte zemi, kterou jste navštívili.',
  'help.guide.country-details.step.2':
    'Vyberte ji. Mapa tam přeletí a panelu dole přibude karta s vlajkou, místy, cestami a čipem pro každou cestu.',
  'help.guide.country-details.result': 'Klikněte na čip cesty a otevřete ji v plánovači.',
  'help.guide.country-details.tip.1': 'Najetí na zemi na mapě ukáže stejná čísla plus první a poslední návštěvu.',
  // planned-countries
  'help.guide.planned-countries.title': 'Zobrazit země, kam se chystáte',
  'help.guide.planned-countries.goal':
    'Dostaňte země svých nadcházejících cest na mapu, aniž by se počítaly jako navštívené.',
  'help.guide.planned-countries.step.1':
    'Zapněte Zobrazit plánované země vpravo nahoře. Číslo vedle říká, kolik jich čeká.',
  'help.guide.planned-countries.step.2':
    'Vyhledejte plánovanou zemi a vyberte ji: panel říká Plánováno a popisek na mapě ukazuje, kdy jedete.',
  'help.guide.planned-countries.result':
    'Plánované země se objeví s čárkovaným obrysem, takže nikdy nevypadají jako místo, kde už jste byli. Přepínač si vaši volbu pamatuje.',
  'help.guide.planned-countries.tip.1':
    'Země se počítá jako navštívená, jakmile cesta tam začala; probíhající cesta se počítá také. Cesty bez dat zůstávají ze statistik úplně venku.',
  'help.guide.planned-countries.tip.2': 'Přepínač existuje jen, dokud máte nadcházející cesty.',
  // regions
  'help.guide.regions.title': 'Označit region',
  'help.guide.regions.goal': 'Jemněji než země: označte státy, provincie nebo prefektury, kde jste byli.',
  'help.guide.regions.step.1':
    'Přibližte zemi, dokud se neobjeví její regiony, od úrovně přiblížení 5. Vyhledání země a její výběr vás přenese dost blízko.',
  'help.guide.regions.step.2': 'Klikněte na region. Při najetí se ukáže jeho název; okno zobrazí region a jeho zemi.',
  'help.guide.regions.step.3': 'Zvolte Označit jako navštívené.',
  'help.guide.regions.result':
    'Region se vyplní barvou země. Označení regionu započítá i zemi jako navštívenou, pokud ještě nebyla.',
  'help.guide.regions.tip.1':
    'Kliknutí na navštívený region nabídne Odebrat, ať jste ho označili vy, nebo ho tam dalo nějaké místo.',
  'help.guide.regions.tip.2': 'Regiony, kde máte skutečná místa, se označí samy; tam není co dělat.',
  // search-place
  'help.guide.search-place.title': 'Najít místo a označit jeho region',
  'help.guide.search-place.goal':
    'Označte Bavorsko hledáním Mnichova, aniž byste věděli, ve kterém regionu město leží.',
  'help.guide.search-place.step.1':
    'Napište do vyhledávacího pole město, památku nebo adresu. Země jsou první; odpovídající místa se objeví pod nimi pod nadpisem Místa.',
  'help.guide.search-place.step.2': 'Vyberte místo. Mapa tam přeletí a zjistí, ve kterém regionu bod leží.',
  'help.guide.search-place.step.3':
    'Zvolte Označit jako navštívené pro ten region, nebo Přidat do seznamu přání (Bucket list), pokud vás teprve čeká.',
  'help.guide.search-place.result':
    'Region je označený a s ním i země. Země bez regionálních dat v mapovém balíku spadnou na zemi samotnou.',
  'help.guide.search-place.tip.1':
    'Místa pocházejí ze stejného hledání jako všude v TREKu, takže sledují poskytovatele, kterého nastavil váš admin.',
  // bucket-country
  'help.guide.bucket-country.title': 'Dát zemi na bucket list',
  'help.guide.bucket-country.goal': 'Veďte si seznam přání zemí přímo na mapě, odděleně od těch, kde jste byli.',
  'help.guide.bucket-country.step.1': 'Vyhledejte zemi a vyberte ji, nebo na ni klikněte na mapě.',
  'help.guide.bucket-country.step.2': 'Zvolte Přidat do seznamu přání (Bucket list).',
  'help.guide.bucket-country.step.3':
    'Vyberte měsíc a rok, pokud už víte kdy, a potvrďte tlačítkem Přidat do seznamu přání (Bucket list).',
  'help.guide.bucket-country.result':
    'Země se vykreslí s diagonálním šrafováním v barvě, kterou ponese, až tam dorazíte, a objeví se na kartě Bucket List v panelu.',
  'help.guide.bucket-country.tip.1': 'Stejné okno nabídne Odebrat ze seznamu přání, jakmile je země na seznamu.',
  'help.guide.bucket-country.tip.2':
    'Jeden záznam na cílové datum: stejná země může být na seznamu pro dva různé měsíce, ale ne dvakrát pro stejný.',
  // bucket-place
  'help.guide.bucket-place.title': 'Přidat místo na bucket list',
  'help.guide.bucket-place.goal':
    'Uložte si město, památku nebo adresu, o které sníte, se souřadnicemi a cílovým datem.',
  'help.guide.bucket-place.step.1': 'Otevřete kartu Bucket List v panelu dole.',
  'help.guide.bucket-place.step.2': 'Klikněte na Přidat místo.',
  'help.guide.bucket-place.step.3':
    'Napište název a stiskněte tlačítko hledání; vyberte shodu, aby místo mělo souřadnice. Napsat jen název a hledání přeskočit jde také.',
  'help.guide.bucket-place.step.4': 'Případně vyberte měsíc a rok a klikněte na Přidat.',
  'help.guide.bucket-place.result':
    'Místo je nahoře na vašem bucket listu s cílovým datem; × vedle něj ho zase odebere.',
  'help.guide.bucket-place.tip.1':
    'Přání se souřadnicemi je to, co vám Dawarich může později odškrtnout, jakmile vaše záznamy ukážou, že jste tam byli.',
  // stats
  'help.guide.stats.title': 'Číst svoje statistiky',
  'help.guide.stats.goal': 'Vědět, co čísla v panelu počítají a co ne.',
  'help.guide.stats.step.1':
    'Země je počet různých zemí, kde jste skutečně byli; plánované se ukazují vedle, ne v něm. Cesty, Místa a Dní jsou součty přes všechny vaše cesty. Města se odvozují z adres vašich míst, takže jde o odhad.',
  'help.guide.stats.step.2':
    'Kontinenty ukazují navštívené země podle kontinentu; Antarktida se do řady přidá, jakmile tam budete. Pak vaše série, po sobě jdoucí roky s aspoň jednou cestou, a kolik cest jste letos podnikli.',
  'help.guide.stats.result': 'Čísla sledují vaše cesty, jak je plánujete; tady není co udržovat.',
  'help.guide.stats.tip.1':
    'Města se čtou z textu adresy, nevyhledávají se, takže krátká adresa jako „Osteria Francescana, Italy“ nebo taková, která končí prefekturou, může dát region místo města.',
  'help.guide.stats.tip.2':
    'Ručně označené země se počítají v Zemích a kontinentech, ale nepřinášejí žádné cesty, místa ani dny.',
  // dawarich-countries
  'help.guide.dawarich-countries.title': 'Přidat země z vašich záznamů',
  'help.guide.dawarich-countries.goal':
    'Nechte Dawarich říct, ve kterých zemích jste za poslední rok byli, a ty, které potvrdíte, dejte na mapu.',
  'help.guide.dawarich-countries.step.1':
    'S připojeným doplňkem Dawarich sedí dole na mapě, vlevo od statistik, panel Dawarich se dvěma dlaždicemi. Klikněte na Země.',
  'help.guide.dawarich-countries.step.2':
    'Dialog se otevře na kartě Země. Klikněte na Vyhledat země: TREK čte země a města, která vaše záznamy za posledních 12 měsíců pokrývají, měsíc po měsíci, takže mu dejte chvilku. Každá země, kterou váš Atlas ještě nemá, je vypsaná s vlajkou, počtem měst a prvním z nich jménem, a začíná zaškrtnutá; kliknutím na řádek ji vynecháte.',
  'help.guide.dawarich-countries.step.3':
    'Potvrďte tlačítkem vpravo dole, na kterém stojí Přidat země: 5, když je zaškrtnuto pět řádků. Dialog řekne, kolik jich bylo přidáno; zavřete ho a mapa se mezitím znovu načetla.',
  'help.guide.dawarich-countries.result':
    'Potvrzené země nesou na mapě barvu a počítají se do Země, zaznamenané jako pocházející z Dawarichu. To, co jste označili ručně, zůstává netknuté.',
  'help.guide.dawarich-countries.tip.1':
    'Země, které Atlas už ukazuje jako navštívené, ručně, z cesty nebo z dřívější kontroly, jsou vynechané, takže vaše vlastní značky se nikdy nepřepíší. Země, kterou jste dříve z Atlasu odebrali, se vrátí, když ji tady potvrdíte.',
  'help.guide.dawarich-countries.tip.2':
    'Název země, který TREK nedokáže přiřadit, je vypsaný pod řádky, ne zahozený, a Zkontrolovat znovu se zeptá Dawarichu ještě jednou. Poznámka pod seznamem říká Prohledáno bylo posledních 12 měsíců; to okno je pevně dané.',
  // dawarich-wishes
  'help.guide.dawarich-wishes.title': 'Odškrtnout přání podle vašich záznamů',
  'help.guide.dawarich-wishes.goal':
    'Zjistěte, kterých míst ze svého bucket listu jste opravdu dosáhli, a odškrtněte je ke dni, kdy se to stalo.',
  'help.guide.dawarich-wishes.step.1': 'V panelu Dawarich dole na mapě, vlevo od statistik, klikněte na Seznam přání.',
  'help.guide.dawarich-wishes.step.2':
    'Dialog se otevře na kartě Seznam přání. Klikněte na Zkontrolovat seznam přání: TREK projde vaše záznamy pro každou položku, která má souřadnice. Přání, kterého jste dosáhli, je vypsané s tím, jak blízko jste se dostali, jak dlouho jste zůstali a který den, a začíná zaškrtnuté; u toho, které jste už odškrtli, stojí Již odškrtnuto. Pod seznamem počítá poznámka položky bez souřadnic a stojí tam i pravidlo: Přání se počítá jako splněné do 250 m a po 20 minutách na místě.',
  'help.guide.dawarich-wishes.step.3':
    'Potvrďte tlačítkem vpravo dole, na kterém stojí Odškrtnout 2, když jsou zaškrtnuté dva řádky. Pak dialog zavřete a otevřete kartu Bucket List v panelu vedle.',
  'help.guide.dawarich-wishes.result':
    'Každé přání nese zelené zaškrtnutí s datem pobytu, ne dneška; jeho popisek říká Odškrtnuto podle vašich záznamů v Dawarichu a kliknutí na datum to vrátí zpět.',
  'help.guide.dawarich-wishes.tip.1':
    'Projet kolem se nepočítá: pravidlo potřebuje blízkost i čas, a z několika pobytů, které vyhovují, vyhrává nejdelší. Přání bez souřadnic se zkontrolovat nedá, proto přidávejte místa přes hledání v Přidat místo, ne jen jménem.',
  'help.guide.dawarich-wishes.tip.2':
    'Jedna kontrola se podívá až na 50 položek, nejdřív na ty ještě neodškrtnuté, a řekne, když jich bylo víc. Přání, které už bylo odškrtnuté, si nechá své vlastní datum.',

  // ── Screen: collections ───────────────────────────────────────────────────────────────
  'help.ctx.collections.title': 'Sbírky',
  'help.ctx.collections.summary':
    'Collections jsou vaše knihovna míst mimo jakoukoli cestu: pojmenované seznamy míst, která jste našli a chcete si je nechat, každé místo se stavem Nápad, Chci navštívit nebo Navštíveno. Místa se do cest a z cest kopírují, nikdy nepropojují, takže seznam a cesta se navzájem nikdy nemění.',
  'help.ctx.collections.bullet.1':
    'Lišta seznamů vlevo: vaše vlastní seznamy, ty sdílené s vámi, pozvánky čekající na přijetí, Vše uložené jako sjednocení všeho, co vlastníte, a nahoře Nový seznam plus import ze souboru.',
  'help.ctx.collections.bullet.2':
    'Záhlaví otevřeného seznamu: jeho barva, obálka, popis a odkazy, členové a vpravo akce Upravit, Exportovat a Sdílet.',
  'help.ctx.collections.bullet.3':
    'Řádek filtrů nad místy: stav, kategorie, hodnocení a řazení, filtr štítků, + pro přidání místa, import z cesty a Vybrat pro hromadné akce.',
  'help.ctx.collections.bullet.4':
    'Řádky míst: avatar, název a adresa, štítky a kategorie a vpravo odznak stavu, který se jedním kliknutím přepíná.',
  'help.ctx.collections.bullet.5':
    'Mapa vpravo: špendlík pro každé místo se souřadnicemi, přepínač seznamu a mapy, vyhledávací pole a filtr štítků. Kliknutí na špendlík otevře dané místo.',
  'help.ctx.collections.bullet.6':
    'Panel detailu: klikněte na řádek a uvidíte obálku, kategorii, štítky, stav, popis a odkazy, s akcemi Upravit, Kopírovat do výletu a Odebrat ze seznamu.',
  // create-list
  'help.guide.create-list.title': 'Vytvořit seznam',
  'help.guide.create-list.goal': 'Založte nový pojmenovaný seznam s barvou a obálkou, připravený na místa.',
  'help.guide.create-list.step.1': 'Klikněte na Nový seznam nahoře v liště seznamů.',
  'help.guide.create-list.step.2':
    'Dejte seznamu název a vyberte barvu. Obálka, popis a odkazy jsou volitelné; můžete je doplnit později přes Upravit.',
  'help.guide.create-list.step.3': 'Klikněte na Vytvořit.',
  'help.guide.create-list.result':
    'Seznam se otevře prázdný, s Přidat místo a Importovat z cesty jako dvěma způsoby, jak ho naplnit.',
  'help.guide.create-list.tip.1':
    'Obálkou může být vlastní nahraný obrázek nebo fotka nalezená přes hledání Unsplash ve stejném dialogu.',
  // add-place
  'help.guide.add-place.title': 'Přidat místo',
  'help.guide.add-place.goal':
    'Najděte místo a uložte ho do otevřeného seznamu s názvem, kategorií, stavem a poznámkami najednou.',
  'help.guide.add-place.step.1': 'Klikněte na + v řádku filtrů nad místy.',
  'help.guide.add-place.step.2':
    'Napište místo do vyhledávacího pole a vyberte výsledek. Název, adresa a souřadnice se z něj doplní.',
  'help.guide.add-place.step.3':
    'Nastavte stav a případně kategorii, popis a odkazy, pak klikněte na Přidat. Dialog zůstane otevřený pro další místo; Zrušit ho zavře.',
  'help.guide.add-place.result': 'Místo se objeví v seznamu a, pokud má souřadnice, jako špendlík na mapě.',
  'help.guide.add-place.tip.1':
    'Uvnitř cesty přidá Uložit do sbírky v inspektoru místa nebo v nabídce místa dané místo z cesty do seznamu, aniž byste cestu opustili.',
  'help.guide.add-place.tip.2':
    'Seznam musí být váš nebo takový, kde jste editor či správce; na Vše uložené ani na seznamu, který jen prohlížíte, + není.',
  // import-from-trip
  'help.guide.import-from-trip.title': 'Importovat místa z cesty',
  'help.guide.import-from-trip.goal':
    'Přeneste místa celé cesty do seznamu najednou, místo abyste je ukládali jedno po druhém.',
  'help.guide.import-from-trip.step.1':
    'Klikněte na tlačítko importu se šipkou v oblaku v řádku filtrů. U prázdného seznamu je stejná akce vedle Přidat místo.',
  'help.guide.import-from-trip.step.2': 'Vyberte jednu ze svých cest.',
  'help.guide.import-from-trip.step.3':
    'Zaškrtněte místa, která chcete. Místa, která už na seznamu jsou, jsou zašedlá; ta, která nemá žádný den cesty, jsou na začátku vybraná. Jen nová skryje to, co už máte.',
  'help.guide.import-from-trip.step.4': 'Klikněte na Importovat. Tlačítko vždy říká, kolik míst se chystá přidat.',
  'help.guide.import-from-trip.result':
    'Místa se zkopírují do seznamu s názvem, adresou, souřadnicemi, popisem a kategorií. Cesta zůstane, jaká byla.',
  'help.guide.import-from-trip.tip.1':
    'Duplicity podle názvu nebo souřadnic se automaticky přeskočí, takže dvojí import nic nepokazí.',
  'help.guide.import-from-trip.tip.2':
    'V seznamu míst uvnitř cesty nabízí režim výběru jako alternativu Uložit do sbírky pro ručně vybranou sadu míst.',
  // place-status
  'help.guide.place-status.title': 'Nastavit stav místa',
  'help.guide.place-status.goal': 'Mějte přehled, co je nápad, co je v užším výběru a kde jste už byli.',
  'help.guide.place-status.step.1':
    'Klikněte na odznak stavu na pravém konci řádku místa. Z Nápad se stane Chci navštívit.',
  'help.guide.place-status.step.2': 'Klikněte znovu pro Navštíveno a ještě jednou pro návrat na Nápad.',
  'help.guide.place-status.result': 'Odznak i jeho barva se hned změní; filtr stavu nad seznamem počítá s ním.',
  'help.guide.place-status.tip.1': 'Stav je věc Collections: kopírování místa do cesty ho nepřenáší.',
  'help.guide.place-status.tip.2':
    'Z cesty ukazuje Uložit do seznamu odznak stavu pro každý seznam, kde místo je, a panel míst má pro výběr akci Označit jako navštívené.',
  // place-detail
  'help.guide.place-detail.title': 'Otevřít uložené místo',
  'help.guide.place-detail.goal':
    'Podívejte se na vše o místě a pracujte s ním: upravte ho, zkopírujte do cesty, odeberte.',
  'help.guide.place-detail.step.1':
    'Klikněte na řádek místa. Vedle seznamu se otevře panel detailu a mapa se posune k místu.',
  'help.guide.place-detail.step.2':
    'Dole jsou Upravit, Kopírovat do výletu a Odebrat ze seznamu; fotoaparát na obálce vymění automatickou fotku za vaši vlastní.',
  'help.guide.place-detail.result':
    'Upravit odemkne název, kategorii, štítky, adresu, souřadnice, popis a odkazy přímo v panelu.',
  'help.guide.place-detail.tip.1':
    'Obálka se stáhne automaticky, když místo nemá vlastní obrázek. Vlastní nahraný soubor může být JPG, PNG, GIF nebo WebP do 20 MB.',
  'help.guide.place-detail.tip.2':
    'Členové sdíleného seznamu tu mohou také nechat hvězdičkové hodnocení a filtr hodnocení v řádku filtrů používá průměr.',
  // labels
  'help.guide.labels.title': 'Seskupit místa štítky',
  'help.guide.labels.goal': 'Dejte seznamu vlastní štítky, třeba čtvrti nebo dny, nad rámec společných kategorií.',
  'help.guide.labels.step.1': 'Otevřete správu štítků z ovládacího prvku štítků v řádku filtrů.',
  'help.guide.labels.step.2':
    'Napište název, vyberte barvu a klikněte na Přidat štítek. Existující štítky ve stejném dialogu přejmenujete, přebarvíte nebo smažete.',
  'help.guide.labels.step.3':
    'Zapněte Vybrat, zaškrtněte místa a klikněte na Přiřadit štítek v liště výběru. Jednotlivé místo dostane štítky také přes Upravit v panelu detailu.',
  'help.guide.labels.step.4':
    'Vyberte v řádku filtrů jeden nebo více štítků a seznam i mapa se zúží na místa, která nesou kterýkoli z nich.',
  'help.guide.labels.result':
    'Označená místa ukazují své štítky na řádku; filtr štítků je tu pro každého člena, včetně diváků.',
  'help.guide.labels.tip.1':
    'Štítky patří k tomu jednomu seznamu, kde vznikly. Přesun místa do jiného seznamu je zahodí.',
  'help.guide.labels.tip.2': 'Správa a přiřazování štítků vyžaduje právo úprav k seznamu.',
  // filter-select
  'help.guide.filter-select.title': 'Filtrovat a vybírat místa',
  'help.guide.filter-select.goal': 'Zúžte seznam a pracujte s mnoha místy najednou.',
  'help.guide.filter-select.step.1':
    'Použijte rozbalovací nabídky v řádku filtrů: stav, kategorie, minimální hodnocení a pořadí řazení. Každá ukazuje, kolik míst by zůstalo.',
  'help.guide.filter-select.step.2':
    'Klikněte na Vybrat. Každý řádek dostane zaškrtávací políčko a objeví se lišta výběru.',
  'help.guide.filter-select.step.3':
    'Zaškrtněte místa nebo použijte Vybrat vše pro vše aktuálně vyfiltrované, pak zvolte Přiřadit štítek, Přesunout do seznamu, Duplikovat do seznamu, Kopírovat do výletu nebo Smazat.',
  'help.guide.filter-select.result': 'Akce se použijí na celý výběr najednou. × vpravo režim výběru ukončí.',
  'help.guide.filter-select.tip.1':
    'Vybrat vše se řídí filtrem, takže vyfiltrovat Chci navštívit a vybrat vše je rychlá cesta, jak pracovat s užším výběrem.',
  // copy-to-trip
  'help.guide.copy-to-trip.title': 'Kopírovat místa do cesty',
  'help.guide.copy-to-trip.goal': 'Udělejte z uložených míst zastávky na jedné ze svých cest.',
  'help.guide.copy-to-trip.step.1':
    'Zapněte Vybrat a zaškrtněte místa, nebo otevřete jedno místo a použijte Kopírovat do výletu v jeho panelu detailu.',
  'help.guide.copy-to-trip.step.2': 'Klikněte na Kopírovat do výletu v liště výběru.',
  'help.guide.copy-to-trip.step.3': 'Vyberte cestu. Vyhledávací pole zúží dlouhý seznam.',
  'help.guide.copy-to-trip.result':
    'Místa přistanou v seznamu míst dané cesty s názvem, popisem, kategorií, poznámkami, cenou, souřadnicemi, fotkou a štítky. Ve sbírce se nic nemění.',
  'help.guide.copy-to-trip.tip.1':
    'Mohou to i diváci sdíleného seznamu; kopíruje se ze seznamu ven, seznam se tím nemění.',
  // share-list
  'help.guide.share-list.title': 'Sdílet seznam s někým',
  'help.guide.share-list.goal': 'Plánujte seznam společně s dalšími lidmi na tomto TREKu, živě.',
  'help.guide.share-list.step.1': 'Klikněte na Sdílet v záhlaví svého seznamu.',
  'help.guide.share-list.step.2': 'Vyberte uživatele a roli: Divák, Editor nebo Správce.',
  'help.guide.share-list.step.3':
    'Klikněte na Odeslat pozvánku. Dotyčný se zobrazuje jako čekající pozvánka, dokud pozvánku nepřijme ve své liště seznamů.',
  'help.guide.share-list.result':
    'Po přijetí se mu seznam objeví pod Sdílené a každá změna se synchronizuje živě. Členové a jejich role zůstávají upravitelní ve stejném dialogu.',
  'help.guide.share-list.tip.1':
    'Diváci se mohou dívat, hodnotit a kopírovat místa do svých vlastních cest. Editoři přidávají a upravují místa a štítky. Správci mohou navíc mazat.',
  'help.guide.share-list.tip.2': 'Zvát a odebírat lidi může jen vlastník; člen může sdílený seznam sám opustit.',
  // export-list
  'help.guide.export-list.title': 'Exportovat seznam jako soubor',
  'help.guide.export-list.goal': 'Předejte seznam někomu na jiném TREKu nebo si ho vezměte do mapové aplikace.',
  'help.guide.export-list.step.1': 'Klikněte na Exportovat v záhlaví seznamu.',
  'help.guide.export-list.step.2':
    'Vyberte Seznam TREK pro jiný TREK, se štítky a stavem, nebo GPX pro OsmAnd, Organic Maps, Garmin a další aplikace, které čtou trasové body.',
  'help.guide.export-list.result': 'Soubor se stáhne. Exportovat ho může kterýkoli člen sdíleného seznamu.',
  'help.guide.export-list.tip.1':
    'Místo bez souřadnic nemůže být trasovým bodem GPX; vynechá se a TREK vám řekne, kolika se to týkalo.',
  'help.guide.export-list.tip.2':
    'Hodnocení, členové a nahrané fotky záměrně zůstávají tady; patří k tomuto TREKu, ne k seznamu.',
  // import-file
  'help.guide.import-file.title': 'Importovat seznam ze souboru',
  'help.guide.import-file.goal':
    'Načtěte soubor se seznamem TREK nebo soubor GPX, jako nový seznam nebo do některého, který máte.',
  'help.guide.import-file.step.1': 'Klikněte na tlačítko importu se šipkou nahoru vedle Nový seznam v liště seznamů.',
  'help.guide.import-file.step.2':
    'Vyberte soubor. TREK ukáže, co v něm je, ještě než se cokoli stane: název, kolik míst a štítků.',
  'help.guide.import-file.step.3':
    'Ponechte Nový seznam a případně změňte název, nebo vyberte Přidat do seznamu a vložte místa do seznamu, který můžete upravovat, pak klikněte na Importovat.',
  'help.guide.import-file.result':
    'Přistanete na seznamu s importovanými místy. Přidání do seznamu vždy jen přidává; místa, která už tam jsou, si ponechají stav, poznámky a štítky.',
  'help.guide.import-file.tip.1':
    'Z GPX se každý pojmenovaný trasový bod stane místem; stopy jsou čáry a vynechají se, náhled říká, kolik bodů to bylo.',
  'help.guide.import-file.tip.2':
    'Soubor, který není ani seznam TREK, ani GPX, se odmítne s důvodem; jediné nečitelné místo se přeskočí, ne celý soubor.',
  // edit-list
  'help.guide.edit-list.title': 'Upravit nebo smazat seznam',
  'help.guide.edit-list.goal': 'Změňte název, barvu, obálku, popis nebo odkazy seznamu, nebo seznam odstraňte.',
  'help.guide.edit-list.step.1': 'Klikněte na Upravit v záhlaví seznamu. Vidí ho jen vlastník.',
  'help.guide.edit-list.step.2':
    'Změňte, co chcete, a klikněte na Uložit. Smazat seznam vlevo dole odstraní seznam se všemi jeho místy, po potvrzení.',
  'help.guide.edit-list.result': 'Záhlaví hned převezme novou barvu, obálku a popis.',
  'help.guide.edit-list.tip.1':
    'Smazání seznamu nelze vrátit zpět. Pokud si chcete nechat kopii, nejdřív ho exportujte.',
  // all-saved
  'help.guide.all-saved.title': 'Prohledat celou knihovnu',
  'help.guide.all-saved.goal': 'Podívejte se najednou napříč všemi seznamy, které vlastníte.',
  'help.guide.all-saved.step.1':
    'Klikněte na Vše uložené v liště seznamů. Sjednocuje místa všech seznamů, které vlastníte nebo spoluvlastníte.',
  'help.guide.all-saved.step.2':
    'Použijte vyhledávací pole a filtry jako na kterémkoli seznamu; Vybrat tu funguje také, pro kopírování do cesty.',
  'help.guide.all-saved.result':
    'Jeden pohled na všechna vaše uložená místa, bez přidávání nebo importu, protože tu není jeden konkrétní seznam, kam by se dala.',
  'help.guide.all-saved.tip.1': 'Štítky jsou na seznam, takže filtr štítků se na Vše uložené nenabízí.',

  // ── Screen: journey ───────────────────────────────────────────────────────────────────
  'help.ctx.journey.title': 'Cestovní deník',
  'help.ctx.journey.summary':
    'Cestovní deník je váš deník z cest, ve kterém jsou fotky na prvním místě. Každý deník je svázaný s jednou nebo více cestami a roste den po dni ze záznamů s příběhem, fotkami, náladou a počasím. Tato obrazovka vypisuje vaše deníky; otevřete některý a pište.',
  'help.ctx.journey.bullet.1':
    'Banner nahoře ukazuje probíhající deník, nebo váš nejnovější, s počty záznamů, fotek a míst. Pokračovat v psaní ho otevře na dnešním dni.',
  'help.ctx.journey.bullet.2':
    'Pod ním jedna karta pro každý deník s obálkou, podtitulem, daty a počty. Kliknutím na kartu deník otevřete.',
  'help.ctx.journey.bullet.3': 'Poslední karta v mřížce, Vytvořit nový cestovní deník, založí nový z vašich cest.',
  // create-journey
  'help.guide.create-journey.title': 'Vytvořit cestovní deník',
  'help.guide.create-journey.goal': 'Založte deník k cestě, ve kterém už místa z cesty čekají jako návrhy.',
  'help.guide.create-journey.step.1': 'Klikněte na Vytvořit nový cestovní deník, poslední kartu v mřížce.',
  'help.guide.create-journey.step.2':
    'Dejte mu název a případně podtitul, pak zaškrtněte cesty, ke kterým patří. Počítadlo říká, kolik míst se přenese.',
  'help.guide.create-journey.step.3': 'Klikněte na Vytvořit cestovní deník.',
  'help.guide.create-journey.result':
    'Deník se otevře. Každé místo z propojených cest sedí v časové ose jako návrh, jeden pro každý den, na kterém stojí, připravený k sepsání.',
  'help.guide.create-journey.tip.1': 'Další cesty lze propojit později v Nastavení cestovního deníku.',
  'help.guide.create-journey.tip.2': 'Deník bez cest funguje také; záznamy pak přidáváte ručně.',
  // open-journey
  'help.guide.open-journey.title': 'Otevřít cestovní deník',
  'help.guide.open-journey.goal': 'Dostaňte se do deníku a vězte, kde se otevře.',
  'help.guide.open-journey.step.1':
    'Klikněte na kartu. Každá ukazuje obálku, data a kolik záznamů, fotek a míst deník obsahuje.',
  'help.guide.open-journey.result':
    'Probíhající deník se otevře na dnešním dni, nebo na posledním záznamu před dneškem, když ještě nic napsáno není; dokončený se otevře na začátku.',
  'help.guide.open-journey.tip.1':
    'Obálkou je první fotka deníku, pokud nějakou nenastavíte v Nastavení cestovního deníku.',
  // continue-writing
  'help.guide.continue-writing.title': 'Pokračovat v probíhajícím deníku',
  'help.guide.continue-writing.goal': 'Skočte rovnou na dnešní stránku deníku, na kterém právě jste.',
  'help.guide.continue-writing.step.1':
    'Klikněte na Pokračovat v psaní v banneru nahoře. Ukazuje probíhající deník, nebo nejnovější, když žádný neprobíhá.',
  'help.guide.continue-writing.result':
    'Deník se otevře na dnešním dni, nebo na posledním záznamu před dneškem, když ještě nic napsáno není.',
  'help.guide.continue-writing.tip.1':
    'Banner také nabízí návrh pro cestu, která ještě deník nemá; Zavřít tento návrh skryje.',

  // ── Screen: journey-detail ────────────────────────────────────────────────────────────
  'help.ctx.journey-detail.title': 'Deník',
  'help.ctx.journey-detail.summary':
    'Jeden otevřený deník: vlevo časová osa, den po dni, a vpravo mapa s každým záznamem a místy propojených cest. Všechno, co do deníku něco přidává, je nahoře; záhlaví drží počty, Studio, přepínač návrhů a Nastavení cestovního deníku.',
  'help.ctx.journey-detail.bullet.1':
    'Záhlaví: obálka, název a podtitul, počty dnů, míst, záznamů a fotek a vpravo Studio, přepínač návrhů a Nastavení cestovního deníku.',
  'help.ctx.journey-detail.bullet.2':
    'Lišta nástrojů: karty Časová osa a Galerie, Hledat v této cestě a Přidat záznam.',
  'help.ctx.journey-detail.bullet.3':
    'Časová osa: jedna sekce pro každý den s + pro přidání záznamu k tomu dni; karty záznamů s fotkami, náladou, počasím a příběhem; návrhy z cest ve světlejším stylu se Zahodit tento návrh.',
  'help.ctx.journey-detail.bullet.4':
    'Mapa: záznamy jako špendlíky spojené čárkovanou čarou v pořadí podle data, místa cest a případné GPX trasy importované do těchto cest.',
  'help.ctx.journey-detail.bullet.5':
    'Nastavení cestovního deníku: obálka, název a podtitul, trasy na mapě, pole záznamu, zahozené návrhy, propojené cesty, přispěvatelé, veřejné sdílení, archivace a smazání.',
  'help.ctx.journey-detail.bullet.6':
    'Nad dlouhou časovou osou plují dvě kulatá tlačítka: zpět nahoru a skok na poslední záznam.',
  // add-entry
  'help.guide.add-entry.title': 'Napsat záznam',
  'help.guide.add-entry.goal': 'Přidejte příběh dne s názvem, textem, náladou a počasím.',
  'help.guide.add-entry.step.1':
    'Klikněte na Přidat záznam v liště nástrojů, nebo na + v záhlaví dne, abyste začali na tom dni.',
  'help.guide.add-entry.step.2':
    'Pojmenujte ten okamžik a napište příběh. Lišta nad textem přidává tučné písmo, kurzívu, nadpisy, citace, odkazy a seznamy v Markdownu.',
  'help.guide.add-entry.step.3':
    'Vyberte náladu a počasí, zkontrolujte datum a případně připněte polohu: vyhledejte místo nebo použijte svou aktuální pozici.',
  'help.guide.add-entry.step.4': 'Klikněte na Uložit.',
  'help.guide.add-entry.result':
    'Záznam se objeví na svém dni v časové ose a jako špendlík na mapě. Jeho počty se v záhlaví aktualizují.',
  'help.guide.add-entry.tip.1': 'Psaní do návrhu je stejný editor, jen s už nastaveným místem.',
  'help.guide.add-entry.tip.2':
    'Štítky dole jsou volný text, třeba skrytý poklad nebo nejlepší jídlo, a hledání je najde.',
  // entry-photos
  'help.guide.entry-photos.title': 'Přidat k záznamu fotky a videa',
  'help.guide.entry-photos.goal': 'Dejte na den obrázky; první se stane obálkou záznamu.',
  'help.guide.entry-photos.step.1': 'Otevřete nabídku záznamu přes ⋯ na jeho kartě a zvolte Upravit.',
  'help.guide.entry-photos.step.2':
    'Klikněte na Nahrát fotky a vyberte soubory. Z galerie bere obrázky, které už v galerii deníku jsou; External photos prohledá připojenou knihovnu Immich nebo Synology pro ten den.',
  'help.guide.entry-photos.step.3': 'Najeďte na obrázek pro Nastavit jako 1. a zvolte obálku, pak klikněte na Uložit.',
  'help.guide.entry-photos.result': 'Fotky se ukážou na kartě i v galerii; první je všude náhledem.',
  'help.guide.entry-photos.tip.1':
    'Videa jdou k záznamu stejně: mp4, m4v, webm nebo mov do 500 MB, uložená tak, jak byla nahrána.',
  'help.guide.entry-photos.tip.2':
    'Soubory HEIC z iPhonu se při nahrání převedou na JPEG, čímž přijdou o GPS a metadata fotoaparátu.',
  // suggestions
  'help.guide.suggestions.title': 'Použít nebo zahodit návrhy',
  'help.guide.suggestions.goal': 'Proměňte místa svých cest v záznamy a odkliďte ta, o kterých psát nebudete.',
  'help.guide.suggestions.step.1':
    'Návrh je světlejší karta s názvem místa kurzívou. Klikněte na ni a otevře se editor s už nastaveným místem a dnem.',
  'help.guide.suggestions.step.2':
    'Klikněte na Zahodit tento návrh na kartě, kterou nepoužijete. Opustí časovou osu, aniž by se smazala, a synchronizace cesty ji už znovu nenabídne.',
  'help.guide.suggestions.step.3':
    'Rozmysleli jste si to? Nastavení cestovního deníku ukazuje, kolik jich je zahozených, a Vrátit zahozené návrhy je všechny vrátí.',
  'help.guide.suggestions.result':
    'Časová osa drží jen to, co opravdu chcete psát; přepínač v záhlaví skryje při čtení všechny návrhy najednou.',
  'help.guide.suggestions.tip.1': 'Místo, které trvá přes dva dny, dá návrh na každém z nich.',
  'help.guide.suggestions.tip.2': 'Návrhy se nikdy nepočítají do statistik; jen napsané záznamy.',
  // add-on-day
  'help.guide.add-on-day.title': 'Přidat záznam k dřívějšímu dni',
  'help.guide.add-on-day.goal': 'Pište o dni, který už uplynul, bez následného opravování data.',
  'help.guide.add-on-day.step.1': 'Klikněte na + v záhlaví toho dne.',
  'help.guide.add-on-day.step.2': 'Editor se otevře s nastaveným datem. Pište a Uložit jako obvykle.',
  'help.guide.add-on-day.result': 'Záznam přistane rovnou na správném dni.',
  'help.guide.add-on-day.tip.1': 'V rámci dne ho šipky v nabídce záznamu posunou dřív nebo později.',
  // pros-cons
  'help.guide.pros-cons.title': 'Přidat hodnocení',
  'help.guide.pros-cons.goal': 'Shrňte den tím, co bylo skvělé a co ne.',
  'help.guide.pros-cons.step.1':
    'V editoru najděte Klady a zápory pod příběhem. Napište bod do Klady nebo Zápory a použijte Přidat další pro ten následující.',
  'help.guide.pros-cons.step.2': 'Uložit. Hodnocení se na kartě ukáže jako dva krátké seznamy.',
  'help.guide.pros-cons.result': 'Palec nahoru a palec dolů na první pohled, pod příběhem.',
  'help.guide.pros-cons.tip.1':
    'Deník, který hodnocení nepoužívá, může sekci vypnout pod Pole záznamu v Nastavení cestovního deníku.',
  // search-journey
  'help.guide.search-journey.title': 'Najít něco v dlouhém deníku',
  'help.guide.search-journey.goal': 'Dostaňte se k záznamu, který máte na mysli, bez rolování přes týdny.',
  'help.guide.search-journey.step.1':
    'Pište do Hledat v této cestě v liště nástrojů. Časová osa se filtruje během psaní, napříč názvy, příběhy, místy a štítky. Na diakritice a velikosti písmen nezáleží.',
  'help.guide.search-journey.step.2':
    'Přepínač návrhů v záhlaví při čtení skryje nenapsané karty. Jakmile je časová osa dlouhá, nad jejím spodním okrajem plují dvě kulatá tlačítka: zpět nahoru a skok na poslední záznam.',
  'help.guide.search-journey.result': 'Zůstanou jen odpovídající záznamy; vymažte pole a uvidíte zase všechno.',
  'help.guide.search-journey.tip.1':
    'Probíhající deník se otevře na dnešním dni, takže aktuální stránka je obvykle už v zobrazení.',
  'help.guide.search-journey.tip.2': 'Štítky se počítají také: hledání skrytý poklad najde každý záznam, který ho má.',
  // gallery-map
  'help.guide.gallery-map.title': 'Procházet galerii a mapu',
  'help.guide.gallery-map.goal': 'Podívejte se na celý deník jako na obrázky a jako na místa na mapě.',
  'help.guide.gallery-map.step.1':
    'Přepněte na Galerie v liště nástrojů: každá fotka každého záznamu plus obrázky nahrané rovnou do galerie. Kliknutím na některý otevřete lightbox.',
  'help.guide.gallery-map.step.2':
    'Mapa vpravo ukazuje záznamy jako špendlíky v pořadí podle data, místa propojených cest a případnou GPX trasu importovanou do těchto cest, v barvě, kterou má v plánovači.',
  'help.guide.gallery-map.result':
    'Najeďte na trasu pro její název. Čárkovanou čáru mezi záznamy kreslí TREK; trasa je cesta, kterou jste skutečně zaznamenali.',
  'help.guide.gallery-map.tip.1': 'Trasy lze pro deník vypnout v Nastavení cestovního deníku.',
  'help.guide.gallery-map.tip.2':
    'Fotky z galerie s polohou se ukážou i na veřejné mapě, když jsou sdíleny Galerie i Mapa.',
  // entry-fields
  'help.guide.entry-fields.title': 'Vypnout pole záznamu',
  'help.guide.entry-fields.goal': 'Omezte editor na to, co tento deník používá.',
  'help.guide.entry-fields.step.1': 'Otevřete Nastavení cestovního deníku ze záhlaví.',
  'help.guide.entry-fields.step.2': 'Pod Pole záznamu vypněte Nálada, Počasí nebo Pro a proti.',
  'help.guide.entry-fields.result':
    'Editor se na ně přestane ptát. Nic napsaného se neztratí: zapnutí pole zpět vrátí uložené hodnoty do zobrazení a sdílený deník skryje stejná pole.',
  'help.guide.entry-fields.tip.1':
    'Přepínače platí pro každý deník zvlášť, takže pracovní cesta a dovolená se mohou lišit.',
  // link-trip
  'help.guide.link-trip.title': 'Propojit další cestu',
  'help.guide.link-trip.goal': 'Přineste do deníku místa druhé cesty jako návrhy.',
  'help.guide.link-trip.step.1': 'Otevřete Nastavení cestovního deníku ze záhlaví.',
  'help.guide.link-trip.step.2': 'Pod propojenými cestami klikněte na Přidat cestu.',
  'help.guide.link-trip.step.3': 'Vyberte cestu.',
  'help.guide.link-trip.result':
    'Její místa dorazí do časové osy jako návrhy na svých dnech a její GPX trasy se přidají na mapu.',
  'help.guide.link-trip.tip.1': '× vedle propojené cesty ji zase odpojí; záznamy, které jste napsali, zůstanou.',
  'help.guide.link-trip.tip.2': 'Záznamy s dnem se počítají jen jednou, ať ten den pokrývá kolik chce cest.',
  // share-public
  'help.guide.share-public.title': 'Sdílet deník veřejně',
  'help.guide.share-public.goal': 'Dejte lidem bez účtu na TREKu odkaz jen ke čtení.',
  'help.guide.share-public.step.1': 'Otevřete Nastavení cestovního deníku a najděte Veřejné sdílení.',
  'help.guide.share-public.step.2': 'Klikněte na Vytvořit odkaz ke sdílení.',
  'help.guide.share-public.step.3':
    'Zvolte, co návštěvníci uvidí: Časová osa, Galerie a Mapa jsou samostatné přepínače. Kopírovat dá odkaz do schránky.',
  'help.guide.share-public.result':
    'Kdokoli s odkazem vidí zapnuté sekce a nic jiného; pole, která jste vypnuli v Pole záznamu, zůstanou skrytá i tam.',
  'help.guide.share-public.tip.1':
    'Fotky se na veřejné mapě objeví jen tehdy, když jsou zapnuté Galerie i Mapa; s vypnutou Mapou se jejich souřadnice odstraní, než opustí server.',
  'help.guide.share-public.tip.2': 'Odkaz na stejném místě smažte a sdílení skončí.',
  // contributors
  'help.guide.contributors.title': 'Psát společně',
  'help.guide.contributors.goal': 'Nechte spolucestujícího přidávat vlastní záznamy a fotky.',
  'help.guide.contributors.step.1': 'Otevřete Nastavení cestovního deníku a přejděte k přispěvatelům.',
  'help.guide.contributors.step.2': 'Klikněte na Pozvat přispěvatele a vyhledejte uživatele podle jména nebo e-mailu.',
  'help.guide.contributors.step.3': 'Vyberte roli a potvrďte.',
  'help.guide.contributors.result':
    'Deník se objeví v jejich seznamu a jejich záznamy nesou jejich jméno. Přispěvatele odeberete přes × vedle něj.',
  'help.guide.contributors.tip.1':
    'Přispěvatelé jsou pro lidi na tomto TREKu. Pro všechny ostatní je tu veřejný odkaz.',
  // studio
  'help.guide.studio.title': 'Rozvrhnout deník jako fotoknihu',
  'help.guide.studio.goal': 'Proměňte deník v tisknutelné stránky.',
  'help.guide.studio.step.1': 'Klikněte na Studio v záhlaví. Návrhář se otevře nad deníkem.',
  'help.guide.studio.step.2': 'Název deníku vlevo v horní liště je cesta zpět; vrátí vás tam, kde jste byli.',
  'help.guide.studio.result':
    'Lišta stránek vlevo, dvoustrana na pracovní ploše, vlastnosti vpravo. Auto layout postaví knihu z vašich záznamů; Export vytvoří PDF připravené k tisku.',
  'help.guide.studio.tip.1': 'Studio potřebuje okno široké alespoň 1024 px a na telefonu se nenabízí.',
  'help.guide.studio.tip.2':
    'Kniha dědí přístup deníku: kdo smí deník číst, smí ji otevřít, kdo smí upravovat, smí ukládat.',
  // archive-journey
  'help.guide.archive-journey.title': 'Archivovat nebo smazat deník',
  'help.guide.archive-journey.goal': 'Uzavřete dokončený deník, nebo ho nadobro odstraňte.',
  'help.guide.archive-journey.step.1': 'Otevřete Nastavení cestovního deníku.',
  'help.guide.archive-journey.step.2':
    'Dole ho Archivovat cestu ukončí a označí jako archivovaný; Obnovit cestu ho vrátí. Smazat ho po potvrzení odstraní se všemi záznamy a fotkami.',
  'help.guide.archive-journey.result':
    'Archivovaný deník zůstává ke čtení i ke sdílení; jen se už neotvírá na dnešním dni.',
  'help.guide.archive-journey.tip.1': 'Smazání nelze vrátit a nedotkne se cest, se kterými byl deník propojený.',
  'help.guide.archive-journey.tip.2': 'Obálka, název a podtitul jsou ve stejném dialogu, nahoře.',

  // ── Screen: journey-studio ────────────────────────────────────────────────────────────
  'help.ctx.journey-studio.title': 'Studio',
  'help.ctx.journey-studio.summary':
    'TREK Studio rozloží cestovní deník do tisknutelné fotoknihy. Otevírá se nad deníkem: vlevo lišta se stranami a obsahem, uprostřed dvoustrana, na které pracujete, vpravo její vlastnosti. Auto layout sestaví z vašich záznamů první návrh; všechno další je na vás: posouvat, ořezávat a měnit styl, s možností vrátit každý krok zpět.',
  'help.ctx.journey-studio.bullet.1':
    'Horní lišta: Back to the journey, Book view, Undo a Redo, Page format, Auto layout a Export. Značka Uloženo vedle názvu říká, kdy je kniha uložená.',
  'help.ctx.journey-studio.bullet.2':
    'Lišta vlevo s pěti sekcemi: Pages, Content (fotografie a záznamy deníku), Elements (text, tvary, čáry, mřížky, rámečky, ikony), Cesta (mapy, země, vlajky a značky sestavené z deníku) a Layouts.',
  'help.ctx.journey-studio.bullet.3':
    'Pracovní plocha: aktuální dvoustrana se spadávkou a bezpečnými okraji, pod ní lišta přiblížení, Fit to view a vpravo Stáhnout tuto dvoustranu.',
  'help.ctx.journey-studio.bullet.4':
    'Properties vpravo: poloha a velikost, ořez a ohnisko, výplň nebo přizpůsobení, vzhled, rohy, rámeček, pořadí vrstev a zámek toho, co je vybrané; čísla stran a dokument, když není vybrané nic.',
  'help.ctx.journey-studio.bullet.5':
    'Kniha má tvar vázané knihy: obálka, samostatná první strana, dvoustrany, samostatná poslední strana a zadní obálka. Čísla stran se počítají od první strany a tisknou se tak, jak je vidíte.',
  'help.ctx.journey-studio.bullet.6':
    'Navrhovat může víc lidí najednou: každý vidí kurzory ostatních s jejich jmény a uložení verze, kterou mezitím změnil někdo jiný, se vrátí jako konflikt místo přepsání jeho práce.',
  // studio-auto-layout
  'help.guide.studio-auto-layout.title': 'Sestavit knihu automaticky',
  'help.guide.studio-auto-layout.goal':
    'Získejte jedním kliknutím kompletní první návrh ze záznamů a fotografií deníku.',
  'help.guide.studio-auto-layout.step.1': 'Klikněte na Auto layout v horní liště.',
  'help.guide.studio-auto-layout.step.2':
    'Zvolte Celá kniha: nahradí každou stranu, ale zachová váš název a nastavení stran. Tato strana přestaví jen tu, která je na obrazovce, a nabízí se u dvoustrany, která vznikla ze záznamu.',
  'help.guide.studio-auto-layout.step.3':
    'Projděte si lištu se stranami. Undo vrátí celé rozložení zpět, pokud se vám víc líbilo to původní.',
  'help.guide.studio-auto-layout.result':
    'Jedna dvoustrana na každý záznam, v pořadí, s jeho fotografiemi, názvem a příběhem rozmístěnými za vás. Každý prvek dál sleduje svůj záznam, dokud ho neupravíte.',
  'help.guide.studio-auto-layout.tip.1': 'Obě položky jsou obyčejné kroky zpět, takže je klidně zkoušejte.',
  'help.guide.studio-auto-layout.tip.2':
    'Prvek, který Auto layout navázal na záznam, drží krok s úpravami toho záznamu, dokud na něj nesáhnete v Properties; tím se vazba přeruší.',
  // studio-pages
  'help.guide.studio-pages.title': 'Přidat, přesunout a odebrat dvoustrany',
  'help.guide.studio-pages.goal': 'Tvarujte knihu stranu po straně.',
  'help.guide.studio-pages.step.1':
    'Otevřete Pages v liště. Miniatury jsou kniha v pořadí: obálka, první strana, dvoustrany, poslední strana, zadní obálka.',
  'help.guide.studio-pages.step.2':
    'Přidat stranu dole vloží novou před poslední stranu; + mezi dvěma miniaturami ji vloží přesně tam.',
  'help.guide.studio-pages.step.3':
    'Najeďte na miniaturu a uvidíte její akce: Posunout dopředu, Posunout dozadu, Duplikovat stranu a Smazat stranu. Kliknutím na miniaturu otevřete tu dvoustranu na pracovní ploše.',
  'help.guide.studio-pages.result':
    'Obálka, první a poslední strana a zadní obálka zůstávají, kde jsou; nové dvoustrany vždy přistanou mezi nimi.',
  'help.guide.studio-pages.tip.1': 'Book view v horní liště ukáže celou knihu jako archy, tak jak bude svázaná.',
  'help.guide.studio-pages.tip.2': 'Čísla stran zapnete pod Dokument v Properties, když není vybrané nic.',
  // studio-layouts
  'help.guide.studio-layouts.title': 'Použít rozložení na dvoustranu',
  'help.guide.studio-layouts.goal': 'Dejte dvoustraně hotové uspořádání rámečků pro fotografie a text.',
  'help.guide.studio-layouts.step.1':
    'Otevřete Layouts v liště. Třináct rozložení pro dvoustrany a zvláštní sada pro obálku, zadní stranu a samostatné strany.',
  'help.guide.studio-layouts.step.2':
    'Klikněte na jedno. Dvoustrana na pracovní ploše převezme jeho rámečky; fotografie a text, které už jste měli, se do nich nalijí.',
  'help.guide.studio-layouts.result':
    'Prázdné rámečky čekají na obsah: přetáhněte na některý fotografii z Content, nebo použijte Add to this page.',
  'help.guide.studio-layouts.tip.1': 'Rozložení je krok zpět jako každý jiný.',
  // studio-content
  'help.guide.studio-content.title': 'Umístit fotografie a záznamy na stranu',
  'help.guide.studio-content.goal': 'Dostaňte na dvoustranu vlastní materiál deníku.',
  'help.guide.studio-content.step.1':
    'Otevřete Content v liště. Photos vypisuje každý snímek deníku; Entries vypisuje záznamy s jejich textem.',
  'help.guide.studio-content.step.2':
    'Přetáhněte fotografii na dvoustranu nebo do prázdného rámečku, nebo pod ní klikněte na Add to this page. Nahrát fotografie přidá snímky, které v deníku ještě nejsou.',
  'help.guide.studio-content.step.3':
    'Pod záznamem vloží Title, Story a Place daný text na stranu jako textový prvek; Datum a souřadnice přijdou jako značky a fotografie záznamu jsou vypsané přímo tam.',
  'help.guide.studio-content.result':
    'Přetažená fotografie se stane fotografickým prvkem; text dál sleduje záznam, dokud ho neupravíte.',
  'help.guide.studio-content.tip.1': 'Vyhledávací pole nahoře v Content filtruje oba seznamy.',
  'help.guide.studio-content.tip.2':
    'Přetažení souboru z plochy počítače na pracovní plochu ho nahraje a rovnou umístí.',
  // studio-elements
  'help.guide.studio-elements.title': 'Přidat text, tvary a ikony',
  'help.guide.studio-elements.goal': 'Ozdobte dvoustranu něčím navíc kromě fotografií a příběhů.',
  'help.guide.studio-elements.step.1': 'Otevřete Elements v liště.',
  'help.guide.studio-elements.step.2':
    'Klikněte na textový styl pro nadpis nebo popisek, na tvar, čáru, mřížku, prázdný rámeček se stylem rámečku, nebo na ikonu z prohledávatelné knihovny. Každý přistane uprostřed dvoustrany, připravený k přesunu.',
  'help.guide.studio-elements.result':
    'Dvojklikem na textový prvek do něj píšete; Properties drží písmo, řez, velikost, proklad a zarovnání.',
  'help.guide.studio-elements.tip.1': 'Rámečky jsou prázdná místa pro fotografie: snímek do nich vložíte později.',
  // studio-travel
  'help.guide.studio-travel.title': 'Přidat mapu, vlajky a údaje',
  'help.guide.studio-travel.goal': 'Proměňte samotnou cestu v údaje na straně.',
  'help.guide.studio-travel.step.1': 'Otevřete Cesta v liště.',
  'help.guide.studio-travel.step.2':
    'Vyberte, co přidat: mapu trasy záznamů, obrysy zemí, seznam nebo mřížku zemí, vlajky, značku data, dne nebo vzdálenosti, nebo přehled celé cesty. Každý prvek se sestaví z dat deníku a obnovuje se s nimi.',
  'help.guide.studio-travel.result': 'Prvek se objeví na dvoustraně; Properties upraví jeho styl a u mapy její výřez.',
  'help.guide.studio-travel.tip.1':
    'Značky sledují záznam, ze kterého dvoustrana vznikla, takže značka data na automaticky rozložené dvoustraně už ukazuje ten den.',
  // studio-properties
  'help.guide.studio-properties.title': 'Upravit, co jste vybrali',
  'help.guide.studio-properties.goal': 'Posouvejte, ořezávejte, stylujte a vrstvěte prvek pomocí inspektoru.',
  'help.guide.studio-properties.step.1':
    'Klikněte na prvek na dvoustraně. Objeví se úchyty pro velikost a otočení; přetažením ho přesunete.',
  'help.guide.studio-properties.step.2':
    'Properties vpravo sleduje výběr: poloha a velikost, Crop s ohniskem, které rozhoduje, co zůstane v rámečku, Výplň nebo přizpůsobení, filtry Look, poloměr Corner, Rámeček, pořadí vrstev a Lock.',
  'help.guide.studio-properties.step.3':
    'Duplikovat a Delete jsou nahoře v inspektoru; Undo v horní liště vrátí cokoli z toho zpět.',
  'help.guide.studio-properties.result':
    'Zamčený prvek už na straně nejde uchopit, což chrání hotové rozložení, zatímco pracujete kolem něj.',
  'help.guide.studio-properties.tip.1': 'Kliknutí se Shiftem vybere víc prvků; inspektor je pak upravuje společně.',
  'help.guide.studio-properties.tip.2':
    'Úprava prvku, který umístil Auto layout, přeruší jeho vazbu na záznam; přestane sledovat další změny toho záznamu.',
  // studio-format
  'help.guide.studio-format.title': 'Zvolit formát strany',
  'help.guide.studio-format.goal':
    'Nastavte velikost, ve které se bude kniha tisknout, dřív než na ní bude záviset rozložení.',
  'help.guide.studio-format.step.1': 'Klikněte na Page format v horní liště.',
  'help.guide.studio-format.step.2':
    'Vyberte Square 21 × 21 cm, Square 30 × 30 cm, A4 nebo A5 landscape či portrait, nebo zadejte vlastní šířku a výšku v milimetrech. Spadávka a Bezpečná jsou pod tím.',
  'help.guide.studio-format.result':
    'Každá dvoustrana se kreslí v této velikosti, ve výchozím nastavení se spadávkou 3 mm a bezpečným okrajem 5 mm.',
  'help.guide.studio-format.tip.1':
    'Nejdřív změňte formát, pak spusťte Auto layout; rozložení se staví pro velikost, kterou najde.',
  'help.guide.studio-format.tip.2':
    'Zeptejte se ve své tiskárně na jejich hodnoty spadávky a bezpečného okraje a zadejte je.',
  // studio-export
  'help.guide.studio-export.title': 'Exportovat knihu jako PDF',
  'help.guide.studio-export.goal': 'Získejte soubor připravený k tisku, nebo takový, který se čte na obrazovce.',
  'help.guide.studio-export.step.1': 'Klikněte na Export v horní liště.',
  'help.guide.studio-export.step.2':
    'Zvolte Jednotlivé stránky, jeden list na arch v pořadí čtení, což tiskárna vyžaduje, nebo Dvojstrany, dvě strany najednou tak, jak se kniha otevírá. Ořezové značky přidají spadávku na každou hranu a označí, kde řezat.',
  'help.guide.studio-export.step.3':
    'Klikněte na Náhled tisku. Prohlížeč otevře strany a Uložit jako PDF z nich udělá soubor.',
  'help.guide.studio-export.result':
    'PDF s tolika archy, kolik dialog ohlásil, ve formátu strany, který jste nastavili.',
  'help.guide.studio-export.tip.1': 'Vytvoření PDF funguje jen na počítači, stejně jako Studio samo.',
  'help.guide.studio-export.tip.2':
    'Pro korekturu exportujte Dvojstrany bez ořezových značek; pro tiskárnu Jednotlivé stránky s nimi.',
  // studio-spread-file
  'help.guide.studio-spread-file.title': 'Použít dvoustranu znovu v jiné knize',
  'help.guide.studio-spread-file.goal': 'Přeneste návrh, který se vám líbí, z knihy jednoho deníku do jiné.',
  'help.guide.studio-spread-file.step.1':
    'S dvoustranou na pracovní ploše klikněte na Stáhnout tuto dvoustranu na pravém konci lišty přiblížení. Soubor obsahuje návrh, ne fotografie.',
  'help.guide.studio-spread-file.step.2':
    'V druhé knize otevřete Pages, klikněte na Importovat vedle Přidat stranu a vyberte soubor.',
  'help.guide.studio-spread-file.result':
    'Dvoustrana dorazí se svými rámečky a textovými styly; vložte do rámečků fotografie nového deníku.',
  'help.guide.studio-spread-file.tip.1': 'Soubor, který není návrh dvoustrany, je odmítnut s uvedením důvodu.',

  // ── Screen: settings (all tabs) ───────────────────────────────────────────────────────
  'help.ctx.settings.title': 'Nastavení',
  'help.ctx.settings.summary':
    'Vaše osobní nastavení, v postranním panelu vlevo jedna karta na téma. Většina přepínačů se projeví hned, jakmile je přepnete; formulář s tlačítkem Uložit dole na něj čeká. Nic tady nemění TREK nikomu jinému.',
  'help.ctx.settings.bullet.1':
    'Postranní panel vlevo: Zobrazení, Appearance, Mapa, Oznámení, Integrace, Offline a Účet. Doplňky se objeví, jakmile je nějaký nainstalovaný, O aplikaci všude tam, kde ji správce neodebral.',
  'help.ctx.settings.bullet.2':
    'Zobrazení je jazyk, jednotky, měna a to, s čím se aplikace otevře; Appearance je motiv, barvy, velikost textu a widgety přehledu.',
  'help.ctx.settings.bullet.3':
    'Mapa vybírá vykreslovač a jeho styl; Oznámení kanály, kterými vás zastihne; Integrace fotoknihovny, klíče API a MCP; Offline to, co si aplikace nechává na tomto zařízení.',
  'help.ctx.settings.bullet.4':
    'Účet drží váš profil, heslo, dvoufaktorové ověření, přístupové klíče a smazání vašeho účtu.',
  'help.ctx.settings-display.title': 'Zobrazení',
  'help.ctx.settings-display.summary':
    'Jazyk, jednotky a měna, jak se chová mapa a rezervace a s čím se TREK otevře. Každá změna tady se projeví hned.',
  'help.ctx.settings-display.bullet.1':
    'Language & region: jazyk rozhraní, formát času, první den týdne, zobrazovaná měna a jednotky vzdálenosti a teploty.',
  'help.ctx.settings-display.bullet.2':
    'Travel & map: trasy rezervací vždy na mapě, pilulka Objevovat místa, optimalizace trasy od ubytování, skryté rezervační kódy a popisky tras rezervací.',
  'help.ctx.settings-display.bullet.3':
    'Spuštění: zda se TREK otevře na přehledu, nebo na aktivní cestě, a která karta cesty se ukáže první.',
  'help.ctx.settings-appearance.title': 'Appearance',
  'help.ctx.settings-appearance.summary':
    'Jak TREK vypadá na tomto účtu: světlý nebo tmavý, barva zvýraznění, sklo a pohyb, velikost textu a které widgety přehled ukazuje. Všechno se projeví živě, na každém zařízení, kde se přihlásíte.',
  'help.ctx.settings-appearance.bullet.1':
    'Theme: Světlé, Tmavé nebo Automatické a Color scheme s vlastním Custom accent.',
  'help.ctx.settings-appearance.bullet.2':
    'Readability: Transparency, Reduce motion, Density a Text size, s pokročilými velikostmi pro každou úroveň.',
  'help.ctx.settings-appearance.bullet.3': 'Dashboard widgets: jeden přepínač na widget, zvlášť pro Desktop a Mobile.',
  'help.ctx.settings-appearance.bullet.4': 'Reset to defaults dole vrátí všechno zpátky.',
  'help.ctx.settings-map.title': 'Mapa',
  'help.ctx.settings-map.summary':
    'Který engine mapy kreslí a v jakém stylu. Leaflet je klasická rastrová mapa, MapLibre kreslí vektorové dlaždice bez jakéhokoli tokenu, Mapbox přidává 3D budovy a terén s vaším vlastním tokenem.',
  'help.ctx.settings-map.bullet.1':
    'Poskytovatel mapy: Leaflet, MapLibre nebo Mapbox, každý s řádkem o tom, co potřebuje.',
  'help.ctx.settings-map.bullet.2':
    'Styl mapy a Šablona mapy: vzhled dlaždic plus token nebo klíč, který poskytovatel vyžaduje.',
  'help.ctx.settings-map.bullet.3':
    'Režim vysoké kvality pro vyhlazování a projekci glóbu; Uložit nastavení mapy volbu zapíše.',
  'help.ctx.settings-notifications.title': 'Oznámení',
  'help.ctx.settings-notifications.summary':
    'Kde vás TREK zastihne mimo aplikaci: push notifikace na tomto zařízení, téma ntfy, webhook nebo kanál, který poskytuje doplněk. Pod kanály rozhoduje jeden řádek na událost, co kam půjde.',
  'help.ctx.settings-notifications.bullet.1':
    'ntfy: téma, volitelně vlastní server a volitelný přístupový token, s tlačítkem Otestovat, které hned jedno odešle.',
  'help.ctx.settings-notifications.bullet.2':
    'Webhook: jedna URL, která dostává každou událost jako JSON, s tlačítkem Otestovat.',
  'help.ctx.settings-notifications.bullet.3':
    'Push notifikace na tomto zařízení: Zapnout pro toto zařízení platí jen pro prohlížeč, který právě používáte, takže to zopakujte na každém telefonu nebo počítači. Odeslat test dorazí na všechny.',
  'help.ctx.settings-notifications.bullet.4':
    'Řádky předvoleb: pro každou událost, který kanál je zapnutý. Kanály doplňků ukazují Nastavit, dokud nejsou nastavené.',
  'help.ctx.settings-integrations.title': 'Integrace',
  'help.ctx.settings-integrations.summary':
    'Všechno, co se k TREKu připojuje zvenčí: fotoknihovny pro deník, klíče API pro skripty a MCP endpoint s jeho tokeny a klienty OAuth pro AI asistenty.',
  'help.ctx.settings-integrations.bullet.1':
    'Poskytovatelé fotek: Immich a Synology Photos, každý se svou URL a klíčem, Otestovat připojení a Uložit.',
  'help.ctx.settings-integrations.bullet.2':
    'Klíče API: osobní klíče pro skripty a jiné nástroje, které volají TREK API vaším jménem.',
  'help.ctx.settings-integrations.bullet.3':
    'Konfigurace MCP: endpoint, hotová konfigurace klienta ke zkopírování a API tokeny.',
  'help.ctx.settings-integrations.bullet.4':
    'Klienti OAuth 2.1: aplikace, které se přihlašují přes TREK, s přesměrovacími URI, povolenými oprávněními, strojovými klienty a aktivními relacemi.',
  'help.ctx.settings-offline.title': 'Offline',
  'help.ctx.settings-offline.summary':
    'Co si TREK nechává na tomto zařízení, aby se cesta otevřela i bez připojení, a co se stane, když se změna provedená offline střetne se změnou provedenou jinde.',
  'help.ctx.settings-offline.bullet.1':
    'Offline režim: Vynutit offline režim přiměje aplikaci chovat se, jako by síť zmizela, pro testování nebo pro měřené připojení.',
  'help.ctx.settings-offline.bullet.2':
    'Příprava na offline: Stáhnout pro offline použití stáhne teď vaše cesty a jejich mapové dlaždice.',
  'help.ctx.settings-offline.bullet.3':
    'Co ukládat offline: mapové dlaždice zapnuté nebo vypnuté a přepínač pro každou cestu.',
  'help.ctx.settings-offline.bullet.4':
    'Konflikty synchronizace a Offline mezipaměť: strategie pro střety, počty čekajících a neúspěšných změn, Synchronizovat znovu a Vymazat mezipaměť.',
  'help.ctx.settings-account.title': 'Účet',
  'help.ctx.settings-account.summary':
    'Kdo na tomto TREKu jste a jak se přihlašujete: profil a avatar, heslo, dvoufaktorové ověření, přístupové klíče a úplně dole smazání účtu.',
  'help.ctx.settings-account.bullet.1': 'Profil: uživatelské jméno, e-mail a avatar, uložené tlačítkem Uložit profil.',
  'help.ctx.settings-account.bullet.2': 'Změnit heslo: současné heslo, nové heslo dvakrát, Aktualizovat heslo.',
  'help.ctx.settings-account.bullet.3':
    'Dvoufaktorové ověření (2FA) s autentizační aplikací a záložními kódy; Přístupové klíče pro přihlášení bez hesla.',
  'help.ctx.settings-account.bullet.4': 'Smazat účet dole, za potvrzením. Poslední správce sám sebe smazat nemůže.',
  // language-region
  'help.guide.language-region.title': 'Nastavit jazyk, jednotky a měnu',
  'help.guide.language-region.goal': 'Ať TREK mluví vaším jazykem a počítá tak, jak jste zvyklí.',
  'help.guide.language-region.step.1':
    'Vyberte jazyk rozhraní v Language & region. TREK se přepne hned, na každém zařízení, kde se přihlásíte.',
  'help.guide.language-region.step.2':
    'Pod ním zvolte formát času, den, kterým začíná týden ve všech výběrech data, zobrazovanou měnu a jednotky vzdálenosti a teploty.',
  'help.guide.language-region.result':
    'Data, vzdálenosti a peníze se čtou tak, jak čekáte; vlastní měna cesty se dál ukazuje vedle přepočtených částek.',
  'help.guide.language-region.tip.1':
    'Zobrazovaná měna slouží pro součty napříč cestami; každá cesta si nechává měnu, kterou jste jí dali.',
  'help.guide.language-region.tip.2': 'Jazyk určuje i názvy dnů a měsíců ve Vacay a v deníku.',
  // travel-map-prefs
  'help.guide.travel-map-prefs.title': 'Naladit, jak se chová mapa a rezervace',
  'help.guide.travel-map-prefs.goal': 'Rozhodněte, co mapa cesty ukazuje ve výchozím stavu.',
  'help.guide.travel-map-prefs.step.1':
    'V Travel & map drží Vždy zobrazovat trasy rezervací lety a vlaky na mapě, i když jejich den není otevřený; Objevovat místa na mapě ukazuje pilulku pro hledání míst; Optimalizovat trasu od ubytování začíná trasu tam, kde spíte.',
  'help.guide.travel-map-prefs.step.2':
    'Skrýt rezervační kódy schová potvrzovací čísla, dokud na ně nenajedete; Popisky tras rezervací napíše název rezervace podél její trasy.',
  'help.guide.travel-map-prefs.result': 'Mapa cesty se tím řídí na každé cestě, dokud to nepřepnete zpátky.',
  'help.guide.travel-map-prefs.tip.1':
    'Platí pro účet, ne pro cestu. Členové sdílené cesty vidí každý svoje vlastní volby.',
  // startup
  'help.guide.startup.title': 'Zvolit, s čím se TREK otevře',
  'help.guide.startup.goal': 'Přistaňte tam, kde pracujete nejvíc, ne pokaždé na přehledu.',
  'help.guide.startup.step.1': 'Pod Spuštění nastavte Úvodní stránka na Přehled nebo Aktivní cesta.',
  'help.guide.startup.step.2': 'Úvodní karta vybírá, která karta cesty se ukáže první, když nějakou otevřete.',
  'help.guide.startup.result': 'Příští přihlášení a příští klepnutí na logo vedou rovnou tam.',
  'help.guide.startup.tip.1':
    'Aktivní cesta znamená cestu, která dnes probíhá, nebo tu následující, když žádná neprobíhá.',
  // theme-scheme
  'help.guide.theme-scheme.title': 'Nastavit motiv a barvu zvýraznění',
  'help.guide.theme-scheme.goal': 'Ať je TREK světlý, tmavý nebo podle vašeho zařízení, v barvě, která se vám líbí.',
  'help.guide.theme-scheme.step.1':
    'Pod Theme vyberte Světlé, Tmavé nebo Automatické. Automatické se řídí vaším zařízením.',
  'help.guide.theme-scheme.step.2':
    'Zvolte Color scheme: Default, High contrast, Indigo, Teal, Rose, Amber, Violet nebo Custom.',
  'help.guide.theme-scheme.step.3':
    'S Custom vyberte zvýraznění z předvoleb, nebo zadejte vlastní. Kontrola kontrastu vedle říká, zda na něm text zůstane čitelný.',
  'help.guide.theme-scheme.result':
    'Tlačítka, odkazy a zvýraznění převezmou tuto barvu všude, na každém zařízení, kde se přihlásíte.',
  'help.guide.theme-scheme.tip.1': 'Rychlý přepínač světlého a tmavého je i v navigační liště; nastavuje stejný motiv.',
  'help.guide.theme-scheme.tip.2': 'High contrast je schéma, které zvolte, když se výchozí čte příliš měkce.',
  // readability
  'help.guide.readability.title': 'Upravit čitelnost a velikost textu',
  'help.guide.readability.goal': 'Méně skla, méně pohybu, více místa nebo větší písmo.',
  'help.guide.readability.step.1':
    'Pod Readability přepne Transparency skleněné panely na plné plochy, Reduce motion omezí animace na minimum a Density volí Comfortable nebo Compact.',
  'help.guide.readability.step.2':
    'Text size zvětšuje Everything naráz; Advanced text sizes umožní, aby se nadpisy, podnadpisy, text a popisky lišily.',
  'help.guide.readability.result': 'Celá aplikace se přizpůsobí hned, včetně panelů mapy a deníku.',
  'help.guide.readability.tip.1': 'Reduce motion se řídí i nastavením vašeho systému, když ho necháte být.',
  'help.guide.readability.tip.2':
    'Velikost textu se uplatňuje přes typografické úrovně, takže se nic neusekne; velikost, která se už nevejde, se zalomí.',
  // dashboard-widgets
  'help.guide.dashboard-widgets.title': 'Vybrat widgety přehledu',
  'help.guide.dashboard-widgets.goal': 'Ukazujte jen widgety, které používáte, zvlášť na počítači a na telefonu.',
  'help.guide.dashboard-widgets.step.1':
    'Pod Dashboard widgets zapněte nebo vypněte každý widget pro Desktop a pro Mobile: pravý postranní panel jako celek, měnu, sbírky, časová pásma, nadcházející rezervace, země v Atlasu a cestovní čísla.',
  'help.guide.dashboard-widgets.step.2': 'Reset to defaults dole vrátí celou kartu do stavu, v jakém byla dodána.',
  'help.guide.dashboard-widgets.result': 'Přehled se hned přeskládá; s vypnutým pravým panelem se vycentruje.',
  'help.guide.dashboard-widgets.tip.1': 'Widgety doplňku se objeví, jen dokud má správce ten doplněk zapnutý.',
  'help.guide.dashboard-widgets.tip.2':
    'Samotný přehled si pamatuje vaše zobrazení v mřížce nebo seznamu a pořadí řazení pro každé zařízení.',
  // map-provider
  'help.guide.map-provider.title': 'Vybrat engine a styl mapy',
  'help.guide.map-provider.goal': 'Přepínejte mezi klasickou mapou, vektorovými dlaždicemi a 3D mapou od Mapboxu.',
  'help.guide.map-provider.step.1':
    'Pod Poskytovatel mapy zvolte Leaflet pro klasickou 2D mapu s libovolnými rastrovými dlaždicemi, MapLibre pro vektorové dlaždice OpenFreeMap bez tokenu, nebo Mapbox pro vektorové dlaždice s 3D budovami a terénem.',
  'help.guide.map-provider.step.2':
    'Vyberte Styl mapy nebo Šablona mapy pro vzhled. Mapbox potřebuje Mapbox přístupový token, některé rastrové styly CARTO API klíč; odkaz vedle pole vede tam, kde ho získáte.',
  'help.guide.map-provider.step.3':
    'Režim vysoké kvality přidá vyhlazování a projekci glóbu. Klikněte na Uložit nastavení mapy.',
  'help.guide.map-provider.result':
    'Každou mapu v TREKu, cesty, Atlas, Sbírky i deník, kreslí engine, který jste vybrali.',
  'help.guide.map-provider.tip.1': 'Bez tokenu se Mapbox vrátí k výchozí mapě, místo aby neukázal nic.',
  'help.guide.map-provider.tip.2':
    'Mapové dlaždice, které ukládáte offline, pocházejí od poskytovatele, který je aktivní, když je stahujete.',
  // notification-channels
  'help.guide.notification-channels.title': 'Nastavit, kde vás oznámení zastihnou',
  'help.guide.notification-channels.goal':
    'Dostávejte připomínky cest a události spolupráce na telefon nebo do jiného nástroje.',
  'help.guide.notification-channels.step.1':
    'Pod Oznámení vyplňte Téma Ntfy; přidejte vlastní URL serveru Ntfy a Přístupový token, pokud nějaký provozujete. Otestovat pošle zprávu hned.',
  'help.guide.notification-channels.step.2':
    'Nebo zadejte URL webhooku, která dostává každou událost jako JSON, a stejně ji Otestovat.',
  'help.guide.notification-channels.step.3':
    'V řádcích níže zapněte nebo vypněte každou událost pro každý kanál. Kanál doplňku říká Nastavit, dokud není nastavený v nastavení doplňku; Odeslat test jeden zkusí.',
  'help.guide.notification-channels.result':
    'Události odcházejí kanály, které jsou zapnuté. Zvonek v navigační liště je v aplikaci ukazuje dál bez ohledu na to.',
  'help.guide.notification-channels.tip.1':
    'Předvolby pro jednotlivou cestu jsou na cestě samotné, v jejím nastavení oznámení.',
  'help.guide.notification-channels.tip.2':
    'Správce může všem předvyplnit výchozí server ntfy; téma si dál volíte sami.',
  // photo-providers
  'help.guide.photo-providers.title': 'Připojit fotoknihovnu',
  'help.guide.photo-providers.goal': 'Ať si deník stáhne fotky dne z Immich nebo Synology Photos.',
  'help.guide.photo-providers.step.1':
    'Pod Integrace najděte sekci poskytovatele a zadejte jeho URL a klíč API. Immich navíc nabízí zrcadlit nahrané fotky z deníku zpět do knihovny.',
  'help.guide.photo-providers.step.2': 'Klikněte na Otestovat připojení, potom na Uložit.',
  'help.guide.photo-providers.result':
    'Karta External photos v editoru záznamu prohledá připojenou knihovnu pro den záznamu, nejblíž k místu záznamu napřed.',
  'help.guide.photo-providers.tip.1': 'Připojení je vaše: ostatní členové deníku si připojují svoje vlastní knihovny.',
  'help.guide.photo-providers.tip.2':
    'Poskytovatel bez GPS dat ve fotkách funguje také; seznam je pak seřazený podle času.',
  // api-keys
  'help.guide.api-keys.title': 'Vytvořit klíč API',
  'help.guide.api-keys.goal': 'Ať skript nebo jiný nástroj volá TREK API jako vy.',
  'help.guide.api-keys.step.1':
    'Pod Klíče API klikněte na Vytvořit klíč a dejte mu název, který říká, kde se bude používat.',
  'help.guide.api-keys.step.2':
    'Zkopírujte klíč z dialogu: ukáže se jen jednou. Klíč ze seznamu smažte, když ho nástroj už nepotřebuje.',
  'help.guide.api-keys.result':
    'Požadavky s tímto klíčem jednají s vašimi oprávněními; seznam ukazuje, kdy byl každý klíč vytvořen a naposledy použit.',
  'help.guide.api-keys.tip.1': 'Jeden klíč na nástroj dělá odvolání bezbolestným.',
  'help.guide.api-keys.tip.2':
    'Pro AI asistenta použijte místo toho MCP s OAuth; klíče API jsou pro prosté HTTP klienty.',
  // mcp-oauth
  'help.guide.mcp-oauth.title': 'Připojit AI asistenta přes MCP',
  'help.guide.mcp-oauth.goal': 'Dejte Claude, IDE nebo jinému klientovi MCP přístup ke svým cestám.',
  'help.guide.mcp-oauth.step.1':
    'Pod Konfigurace MCP zkopírujte MCP endpoint, nebo celý blok Konfigurace klienta pro klienta, který bere JSON úryvek.',
  'help.guide.mcp-oauth.step.2':
    'Klienti, kteří se přihlašují přes prohlížeč, používají OAuth 2.1: Nový klient pod Klienti OAuth 2.1, s jeho Přesměrovací URI, Povolená oprávnění a pro server bez prohlížeče Strojový klient.',
  'help.guide.mcp-oauth.step.3':
    'Obnovit tajný klíč a Smazat klienta jsou u každého klienta; Aktivní relace OAuth vypisují, co je přihlášené, a nechají vás to odvolat. API tokeny s Vytvořit nový token jsou starší cesta dovnitř.',
  'help.guide.mcp-oauth.result':
    'Klient může číst a měnit to, co jeho oprávnění dovolují, jako vy, a každá akce se ukáže pod vaším jménem.',
  'help.guide.mcp-oauth.tip.1':
    'Oprávnění jsou záchranná síť: dejte klientovi jen oprávnění ke čtení, dokud nepotřebuje víc.',
  'help.guide.mcp-oauth.tip.2': 'Správce může MCP vypnout pro celou instanci; pak tahle sekce chybí.',
  // offline-prepare
  'help.guide.offline-prepare.title': 'Vzít cesty offline',
  'help.guide.offline-prepare.goal': 'Mějte své cesty a jejich mapy na tomto zařízení, než připojení vypadne.',
  'help.guide.offline-prepare.step.1':
    'Pod Co ukládat offline nechte Ukládat mapové dlaždice offline zapnuté a zapněte cesty, které chcete mít na tomto zařízení.',
  'help.guide.offline-prepare.step.2':
    'Klikněte na Stáhnout pro offline použití pod Příprava na offline. Stáhne cesty a dlaždice kolem jejich míst.',
  'help.guide.offline-prepare.step.3':
    'Vynutit offline režim pod Offline režim vám dovolí ověřit, že je všechno na místě, než vyrazíte.',
  'help.guide.offline-prepare.result':
    'Cesty se otevřou bez připojení; změny, které uděláte, čekají ve frontě a odejdou po opětovném připojení.',
  'help.guide.offline-prepare.tip.1':
    'Nejvíc místa zaberou dlaždice: sekce Offline mezipaměť ukazuje, co je uložené, pro každou cestu.',
  'help.guide.offline-prepare.tip.2':
    'Nainstalujte si TREK z prohlížeče jako aplikaci, offline start je pak nejhladší.',
  // offline-conflicts
  'help.guide.offline-conflicts.title': 'Rozhodnout, co vyhraje při konfliktu synchronizace',
  'help.guide.offline-conflicts.goal': 'Zvolte, jak TREK urovná změnu provedenou offline proti změně provedené jinde.',
  'help.guide.offline-conflicts.step.1':
    'Pod Konflikty synchronizace vyberte Vždy se mě zeptat, Vždy zachovat moji verzi nebo Vždy zachovat verzi ze serveru.',
  'help.guide.offline-conflicts.step.2':
    'Offline mezipaměť ukazuje cesty, čekající a neúspěšné změny a konflikty; Synchronizovat znovu odešle frontu, Vymazat mezipaměť vyprázdní zařízení.',
  'help.guide.offline-conflicts.result':
    'S dotazem konflikt ukáže obě verze a nechá vás vybrat; s ostatními dvěma se urovná potichu.',
  'help.guide.offline-conflicts.tip.1':
    'Vymazat mezipaměť odstraní jen kopii na tomto zařízení; na serveru se ničeho nedotkne.',
  // profile
  'help.guide.profile.title': 'Změnit profil',
  'help.guide.profile.goal': 'Aktualizujte své jméno, e-mail a obrázek.',
  'help.guide.profile.step.1':
    'Pod Účet upravte Uživatelské jméno a E-mail. Avatar přijme vaše vlastní nahrání; odstraňte ho a vrátíte se k iniciálám.',
  'help.guide.profile.step.2': 'Klikněte na Uložit profil.',
  'help.guide.profile.result': 'Vaše jméno a obrázek se aktualizují všude naráz, včetně cest, které sdílíte.',
  'help.guide.profile.tip.1':
    'Účet, který se přihlašuje přes OIDC, to tady ukazuje; e-mail pak přichází od poskytovatele.',
  // password
  'help.guide.password.title': 'Změnit heslo',
  'help.guide.password.goal': 'Nastavte nové heslo.',
  'help.guide.password.step.1': 'Pod Změnit heslo zadejte současné heslo a potom dvakrát nové.',
  'help.guide.password.step.2': 'Klikněte na Aktualizovat heslo.',
  'help.guide.password.result': 'Nové heslo platí od příštího přihlášení; ostatní relace zůstávají přihlášené.',
  'help.guide.password.tip.1': 'Účet, který se přihlašuje přes OIDC, nemá žádné heslo TREKu, které by šlo změnit.',
  // mfa
  'help.guide.mfa.title': 'Zapnout dvoufaktorové ověření',
  'help.guide.mfa.goal': 'Chraňte účet kódem z autentizační aplikace.',
  'help.guide.mfa.step.1': 'Pod Dvoufaktorové ověření (2FA) klikněte na Nastavit autentizační aplikaci.',
  'help.guide.mfa.step.2':
    'Naskenujte QR kód svou aplikací, nebo zadejte tajný klíč ručně, potom napište šestimístný kód, který ukazuje, a klikněte na Zapnout 2FA.',
  'help.guide.mfa.step.3':
    'Uložte si záložní kódy: zkopírujte je, stáhněte nebo vytiskněte. Každý funguje jednou, když nemáte telefon po ruce.',
  'help.guide.mfa.result': 'Každé přihlášení se po hesle zeptá na kód.',
  'help.guide.mfa.tip.1': 'Vypnout 2FA vyžaduje vaše heslo a aktuální kód.',
  'help.guide.mfa.tip.2': 'Správce může 2FA vyžadovat od všech; pak ho tady vypnout nejde.',
  // passkeys
  'help.guide.passkeys.title': 'Přihlásit se přístupovým klíčem',
  'help.guide.passkeys.goal': 'Použijte otisk prstu, obličej nebo PIN svého zařízení místo hesla.',
  'help.guide.passkeys.step.1':
    'Pod Přístupové klíče klikněte na Přidat přístupový klíč a potvrďte na svém zařízení. Dejte mu název, který říká, o jaké zařízení jde.',
  'help.guide.passkeys.step.2':
    'Seznam ukazuje každý přístupový klíč s názvem a časem posledního použití; tlačítko smazání jeden odstraní.',
  'help.guide.passkeys.result': 'Přihlašovací stránka nabídne přístupový klíč; heslo zůstává jako záloha.',
  'help.guide.passkeys.tip.1':
    'Přístupový klíč žije na zařízení nebo v jeho správci hesel, přidejte proto jeden na každé zařízení.',
  'help.guide.passkeys.tip.2':
    'Přístupové klíče potřebují HTTPS; na instanci s prostým HTTP sekce vysvětlí, proč nejsou k dispozici.',
  // delete-account
  'help.guide.delete-account.title': 'Smazat účet',
  'help.guide.delete-account.goal': 'Odstraňte svůj účet a data, která jsou jen vaše.',
  'help.guide.delete-account.step.1': 'Úplně dole v Účet klikněte na Smazat účet a potvrďte.',
  'help.guide.delete-account.result':
    'Váš účet, vaše vlastní cesty a vaše deníky jsou pryč; cesty, které sdílíte s ostatními, zůstanou jim.',
  'help.guide.delete-account.tip.1':
    'Poslední správce instance sám sebe smazat nemůže; nejdřív udělejte správcem někoho jiného.',
  'help.guide.delete-account.tip.2': 'Není cesty zpět. Než potvrdíte, exportujte, co si chcete nechat.',

  // ── Screen: admin (all tabs) ──────────────────────────────────────────────────────────
  'help.ctx.admin.title': 'Administrace',
  'help.ctx.admin.summary':
    'Instance, která stojí za TREKem všech: kdo se smí přihlásit a jak, co je zapnuté, kde leží soubory, jak server lidi zastihne a jak se zálohuje. Tuto stránku vidí jen administrátoři; každá karta je v postranním panelu samostatná obrazovka.',
  'help.ctx.admin.bullet.1':
    'Čtyři karty nahoře počítají uživatele, cesty, místa a soubory; banner nad nimi ohlašuje novější vydání TREKu.',
  'help.ctx.admin.bullet.2':
    'Uživatelé a Výchozí nastavení uživatele: účty, pozvánky a nastavení mapy, se kterým nový účet začíná.',
  'help.ctx.admin.bullet.3':
    'Personalizace, Nastavení, Doplňky a Pluginy: šablony pro balení, kategorie a školní prázdniny; způsoby přihlášení a API klíče; funkční moduly; pluginy třetích stran.',
  'help.ctx.admin.bullet.4':
    'Úložiště, Oznámení, MCP přístup a GitHub: kam jdou nahrané soubory, kanály pro celou instanci, tokeny a relace AI klientů a historie vydání.',
  'help.ctx.admin.bullet.5':
    'Zálohování a Audit: zálohy na vyžádání i podle plánu a protokol bezpečnostně relevantních událostí.',
  'help.ctx.admin-users.title': 'Uživatelé',
  'help.ctx.admin-users.summary':
    'Každý účet na tomto TREKu, s rolí, e-mailem a posledním přihlášením, a pozvánky, díky kterým se lidé mohou registrovat na uzavřené instanci.',
  'help.ctx.admin-users.bullet.1':
    'Tabulka: uživatelské jméno, e-mail, role, datum vytvoření, poslední přihlášení a akce v každém řádku. Vy jste označeni jako vy.',
  'help.ctx.admin-users.bullet.2': 'Vytvořit uživatele nahoře přidá účet ručně, s heslem, které předáte.',
  'help.ctx.admin-users.bullet.3':
    'Pozvánky níže: jednorázové registrační odkazy s limitem použití, platností a, pokud chcete, cestou, ke které se nový uživatel po příchodu připojí.',
  'help.ctx.admin-users.bullet.4':
    'Nastavení oprávnění dole: pro každou akci, kdo ji smí provést, Všichni, Členové výletu, Vlastník výletu nebo Pouze administrátor.',
  'help.ctx.admin-defaults.title': 'Výchozí nastavení uživatele',
  'help.ctx.admin-defaults.summary':
    'Nastavení, se kterým nový účet začíná, aby nikdo nemusel nejdřív hledat kartu mapy: poskytovatel mapy, styl, tokeny a kvalita.',
  'help.ctx.admin-defaults.bullet.1':
    'Poskytovatel mapy, styl a token Mapbox, klíč CARTO a kvalita Mapbox, přesně tak, jak by si je uživatel nastavil pod Nastavení, Mapy.',
  'help.ctx.admin-defaults.bullet.2':
    'Obnovení na vestavěnou výchozí hodnotu u každého pole vrátí vlastní volbu TREKu; vlastní nastavení uživatele má před těmito vždy přednost.',
  'help.ctx.admin-config.title': 'Personalizace',
  'help.ctx.admin-config.summary':
    'Co sdílí každá cesta na instanci: šablony pro balení, sada kategorií pro místa a sbírky a katalog školních prázdnin, ze kterého čerpá Vacay.',
  'help.ctx.admin-config.bullet.1':
    'Šablony pro balení: pojmenované seznamy kategorií a položek, ze kterých může seznam na balení cesty vyjít.',
  'help.ctx.admin-config.bullet.2':
    'Kategorie: název, ikona a barva kategorií používaných napříč TREKem, od inspektoru míst po Sbírky.',
  'help.ctx.admin-config.bullet.3':
    'Školní prázdniny: katalog zemí a regionů pro místa, která vestavěné zdroje nepokrývají.',
  'help.ctx.admin-settings.title': 'Nastavení',
  'help.ctx.admin-settings.summary':
    'Jak se lidé dostanou dovnitř a s čím smí server mluvit: způsoby přihlášení a registrace, SSO, přístupové klíče, politika dvoufázového ověření, API klíče pro mapy, místa a obrázky, poskytovatelé hledání a veřejné dopravy a typy souborů, které smí nahrané soubory mít.',
  'help.ctx.admin-settings.bullet.1':
    'Authentication Methods: Password Login, Password Registration, SSO Login, SSO Auto-Provisioning a Vyžadovat dvoufázové ověření (2FA).',
  'help.ctx.admin-settings.bullet.2':
    'Jednotné přihlášení (OIDC) s vydavatelem, klientem a zobrazovaným jménem; Přihlášení přístupovým klíčem s Relying Party ID (doména) a Povolené origins.',
  'help.ctx.admin-settings.bullet.3':
    'API klíče: Google Maps, Unsplash a Amap, každý s tlačítkem Testovat; K čemu se klíč používá zúží klíč Google na funkce, za které chcete platit.',
  'help.ctx.admin-settings.bullet.4':
    'Poskytovatel hledání míst a Poskytovatel veřejné dopravy určují, kdo odpovídá na hledání a trasy; Povolené typy souborů omezují nahrávání.',
  'help.ctx.admin-addons.title': 'Doplňky',
  'help.ctx.admin-addons.summary':
    'Funkční moduly TREKu, každý s přepínačem: Seznamy, Náklady, Dokumenty, Vacay, Atlas, Spolupráce, Cestovní deník, Sbírky, Cesta autem, MCP, AirTrail, Dawarich a AI parsování. Vypnuto znamená, že položka v navigaci, cesty i API zmizí všem.',
  'help.ctx.admin-addons.bullet.1':
    'Jedna dlaždice na doplněk s jeho přepínačem a, pokud nějaké má, podřádky s jeho možnostmi.',
  'help.ctx.admin-addons.bullet.2':
    'Poskytovatelé fotek a poskytovatelé dokumentů se tu objevují také jako dlaždice, takže uživatelům lze nabídnout Immich nebo Synology.',
  'help.ctx.admin-addons.bullet.3': 'Sledování zavazadel má vlastní přepínač pod dlaždicemi.',
  'help.ctx.admin-plugins.title': 'Pluginy',
  'help.ctx.admin-plugins.summary':
    'Pluginy třetích stran, které běží ve vlastním procesu vedle TREKu, každý s oprávněními, o která požádal při instalaci. Instalujte z katalogu, nahrajte balíček nebo při vývoji propojte složku.',
  'help.ctx.admin-plugins.bullet.1':
    'Seznam: každý nainstalovaný plugin s verzí, stavem, podpisem a oprávněními, která drží; v každém řádku aktivovat, deaktivovat, aktualizovat nebo odinstalovat.',
  'help.ctx.admin-plugins.bullet.2':
    'Nahrát plugin přijme soubor balíčku; Znovu prohledat najde složku pluginu propojenou pro vývoj.',
  'help.ctx.admin-plugins.bullet.3':
    'Povolení hostitelé u každého pluginu: adresy, které plugin smí volat, protože odchozí provoz je ve výchozím stavu zakázaný.',
  'help.ctx.admin-storage.title': 'Úložiště',
  'help.ctx.admin-storage.summary':
    'Kde leží nahrané soubory: místní disk, bucket S3 nebo zrcadlo, které zapisuje do obou. Každá kategorie nahrávání může jít do jiného backendu a Stav říká, zda každý backend odpovídá.',
  'help.ctx.admin-storage.bullet.1':
    'Backendy: název a typ každého z nich, s Test, Upravit a Odebrat; backend nastavený prostředím je tady jen pro čtení.',
  'help.ctx.admin-storage.bullet.2':
    'Kategorie: obálky, dokumenty, fotky deníku a ostatní, každá přiřazená backendu; změna jedné nabídne přesun stávajících souborů.',
  'help.ctx.admin-storage.bullet.3':
    'Stav: kontrola každého backendu a kontrolní soubor, který dokládá, že konfigurace je ta, kterou server vidí.',
  'help.ctx.admin-notifications.title': 'Oznámení',
  'help.ctx.admin-notifications.summary':
    'Kanály, které instance nabízí svým uživatelům, a ty, které zastihnou vás jako administrátora. Uživatelé si vybírají vlastní témata a URL pod Nastavení; vy rozhodujete, co existuje, a nastavujete e-mail.',
  'help.ctx.admin-notifications.bullet.1':
    'In-App, Email (SMTP), Ntfy, Webhook a Web Push: jeden panel pro každý, s přepínačem, který kanál nabídne uživatelům, a konfigurací na straně serveru, kterou potřebuje.',
  'help.ctx.admin-notifications.bullet.2': 'Připomínky výletů: zda server posílá připomínku před začátkem cesty.',
  'help.ctx.admin-notifications.bullet.3':
    'Admin Ntfy a Admin webhook: kam jdou události pro administrátory, jako neúspěšná záloha nebo nové vydání, s tlačítkem pro test.',
  'help.ctx.admin-mcp-tokens.title': 'MCP přístup',
  'help.ctx.admin-mcp-tokens.summary':
    'Každý token a každá relace OAuth, které AI klienti drží vůči tomuto TREKu, napříč všemi uživateli, s možností kterýkoli z nich odvolat.',
  'help.ctx.admin-mcp-tokens.bullet.1': 'API tokeny: kdo ho vytvořil, kdy byl naposledy použit, a Smazat.',
  'help.ctx.admin-mcp-tokens.bullet.2': 'OAuth relace: klient, uživatel a udělená oprávnění, a Odvolat.',
  'help.ctx.admin-github.title': 'GitHub',
  'help.ctx.admin-github.summary':
    'Co je v TREKu nového: historie vydání z GitHubu, verze, kterou provozujete, a zda vyšla novější. Samotná aktualizace probíhá mimo aplikaci, na hostiteli.',
  'help.ctx.admin-github.bullet.1':
    'Historie verzí vypisuje vydání s jejich poznámkami; nejnovější nese Nejnovější a vaše verze je označená.',
  'help.ctx.admin-github.bullet.2':
    'Dostupná aktualizace se objeví v hlavičce, jakmile existuje novější vydání, s postupem aktualizace pro Docker a jiné instalace.',
  'help.ctx.admin-backup.title': 'Zálohování',
  'help.ctx.admin-backup.summary':
    'Úplné zálohy databáze a nahraných souborů, vytvořené ručně nebo podle plánu, uložené na serveru a ke stažení jako jeden soubor. Obnovit jednu z nich vrátí zpět.',
  'help.ctx.admin-backup.bullet.1':
    'Záloha dat: Vytvořit zálohu a seznam existujících záloh se Stáhnout, Obnovit a smazáním.',
  'help.ctx.admin-backup.bullet.2': 'Nahrát zálohu přinese soubor vytvořený na jiné instanci nebo v dřívější den.',
  'help.ctx.admin-backup.bullet.3':
    'Automatické zálohování: zapnuto nebo vypnuto, interval, hodina a den a kolik záloh uchovat.',
  'help.ctx.admin-audit.title': 'Audit',
  'help.ctx.admin-audit.summary':
    'Protokol bezpečnostně relevantních a administrativních událostí: přihlášení a neúspěšné pokusy, změny MFA, změny uživatelů a nastavení, zálohy a obnovení. Jen pro čtení, nejnovější první.',
  'help.ctx.admin-audit.bullet.1': 'Jeden řádek na událost s časem, uživatelem, akcí, zdrojem, IP a podrobnostmi.',
  'help.ctx.admin-audit.bullet.2': 'Obnovit znovu načte; Načíst další jde dál do minulosti.',
  // create-user
  'help.guide.create-user.title': 'Vytvořit uživatele',
  'help.guide.create-user.goal': 'Přidejte účet ručně, bez pozvánky.',
  'help.guide.create-user.step.1': 'Klikněte na Vytvořit uživatele nahoře na kartě Uživatelé.',
  'help.guide.create-user.step.2':
    'Zadejte Uživatelské jméno, E-mail a Heslo a zvolte Role: Uživatel nebo Administrátor.',
  'help.guide.create-user.step.3': 'Klikněte na Vytvořit uživatele.',
  'help.guide.create-user.result':
    'Účet se objeví v tabulce a může se hned přihlásit; heslo předejte kanálem, kterému důvěřujete.',
  'help.guide.create-user.tip.1': 'Pro člověka, který si má zvolit vlastní heslo, je lepší cestou pozvánka.',
  'help.guide.create-user.tip.2':
    'Administrátoři vidí tuto stránku a protokol auditu; všechno ostatní je pro obě role stejné.',
  // edit-user
  'help.guide.edit-user.title': 'Změnit roli nebo heslo uživatele',
  'help.guide.edit-user.goal': 'Někoho povyšte, degradujte nebo mu po ztraceném hesle vraťte přístup.',
  'help.guide.edit-user.step.1': 'Klikněte na tužku v řádku uživatele. Otevře se Upravit uživatele s údaji účtu.',
  'help.guide.edit-user.step.2':
    'Změňte Role, nastavte Nové heslo nebo klikněte na Resetovat přístupové klíče, když dotyčný přišel o zařízení, na kterém je měl, a pak Uložit.',
  'help.guide.edit-user.result': 'Změna platí od dalšího požadavku; nové heslo funguje od dalšího přihlášení.',
  'help.guide.edit-user.tip.1': 'Sami sobě roli administrátora odebrat nemůžete, dokud jste poslední administrátor.',
  'help.guide.edit-user.tip.2':
    'Reset přístupových klíčů zachová heslo; nové přístupové klíče si dotyčný přidá pod Nastavení, Účet.',
  // invite-links
  'help.guide.invite-links.title': 'Pozvat někoho odkazem',
  'help.guide.invite-links.goal':
    'Umožněte člověku registraci na uzavřené instanci a, pokud chcete, rovnou ho přiveďte do cesty.',
  'help.guide.invite-links.step.1': 'Pod Pozvánky klikněte na Vytvořit odkaz.',
  'help.guide.invite-links.step.2':
    'Nastavte Max. použití a Vyprší za, volitelně Přidat k cestě (volitelné), a klikněte na Vytvořit a zkopírovat.',
  'help.guide.invite-links.step.3':
    'Odkaz pošlete. Každý řádek ukazuje, kolikrát byl použit a kdo ho vytvořil; Kopírovat odkaz ho zkopíruje znovu a vyčerpané či prošlé odkazy nesou označení Využito nebo Expirované.',
  'help.guide.invite-links.result':
    'Kdo odkaz otevře, zaregistruje se s vlastním heslem a se zvolenou cestou se k ní hned připojí.',
  'help.guide.invite-links.tip.1': 'Pozvánky fungují, i když je Password Registration pod Nastavení vypnutá.',
  'help.guide.invite-links.tip.2':
    'Odkaz s jedním použitím a krátkou platností je pro jednoho člověka nejbezpečnější volba.',
  // delete-user
  'help.guide.delete-user.title': 'Smazat uživatele',
  'help.guide.delete-user.goal': 'Odstraňte účet a všechno, co vlastní jen on.',
  'help.guide.delete-user.step.1': 'Klikněte na ikonu koše v řádku uživatele a potvrďte Smazat uživatele.',
  'help.guide.delete-user.result':
    'Účet, jeho vlastní cesty a jeho deníky jsou pryč; cesty sdílené s ostatními zůstávají zbývajícím členům.',
  'help.guide.delete-user.tip.1': 'Nejde to vrátit zpět. Pokud si nejste jistí, udělejte nejdřív zálohu.',
  'help.guide.delete-user.tip.2':
    'Posledního administrátora smazat nelze; nejdřív udělejte administrátorem někoho jiného.',
  // permissions
  'help.guide.permissions.title': 'Rozhodněte, kdo smí co',
  'help.guide.permissions.goal': 'Nastavte pro každou akci, která role ji na tomto TREKu smí provést.',
  'help.guide.permissions.step.1':
    'Pod Nastavení oprávnění najděte akci v její skupině, například Smazat výlety pod Správa výletů, a zvolte úroveň: Všichni, Členové výletu, Vlastník výletu nebo Pouze administrátor. Změněný řádek je označen jako upraveno.',
  'help.guide.permissions.step.2': 'Klikněte na Uložit. Obnovit výchozí vrátí každý řádek na vestavěnou úroveň.',
  'help.guide.permissions.result':
    'Pravidlo platí pro všechny výlety najednou; tlačítka a nabídky lidí pod danou úrovní zmizí.',
  'help.guide.permissions.tip.1': 'Vlastník výletu je ten, kdo výlet vytvořil; administrátoři smějí vždy všechno.',
  'help.guide.permissions.tip.2':
    'Raději snižte úroveň, než abyste člena mazali: člen, který nesmí upravovat, může stále číst a komentovat.',
  // default-map
  'help.guide.default-map.title': 'Nastavit výchozí mapu pro nové uživatele',
  'help.guide.default-map.goal': 'Dejte každému novému účtu funkční mapu bez osobního tokenu.',
  'help.guide.default-map.step.1':
    'Pod Mapy zvolte Mapový engine a pro Mapbox nebo MapLibre Styl mapy, Sdílený token Mapbox a Režim vysoké kvality; pro rastrovou mapu Šablona mapy a Sdílený klíč CARTO.',
  'help.guide.default-map.step.2':
    'Vedle každého pole, které jste změnili, vrátí obnovit vlastní volbu TREKu. Výchozí nastavení uživatele vlevo dělá totéž pro Barevné schéma, jednotky a měnu.',
  'help.guide.default-map.result':
    'Nové účty s tímto začínají; kdo si pod Nastavení nastavil vlastní mapu, tu svou si ponechá.',
  'help.guide.default-map.tip.1':
    'Token zadaný tady sdílí všichni, kdo žádný vlastní nemají, takže hlídejte jeho kvótu.',
  'help.guide.default-map.tip.2': 'Tyto výchozí hodnoty sledují i stávající účty, které se karty mapy nikdy nedotkly.',
  // packing-templates
  'help.guide.packing-templates.title': 'Sestavit šablonu pro balení',
  'help.guide.packing-templates.goal': 'Dejte cestám seznam na balení, ze kterého mohou vyjít, místo prázdného.',
  'help.guide.packing-templates.step.1': 'Klikněte na Nová šablona, napište název a potvrďte fajfkou.',
  'help.guide.packing-templates.step.2':
    'Otevřete šablonu a klikněte na Přidat kategorii; pod každou kategorií přidává + položky a položka potřebuje jen název.',
  'help.guide.packing-templates.step.3':
    'Všechno se ukládá průběžně. Tužka přejmenuje šablonu, kategorii nebo položku, koš ji smaže.',
  'help.guide.packing-templates.result':
    'Šablona se nabízí v seznamu na balení každé cesty; její použití položky zkopíruje, takže je cesta může volně měnit.',
  'help.guide.packing-templates.tip.1':
    'Jedna šablona na druh cesty, pláž, město, turistika, je lepší než jeden obří seznam.',
  'help.guide.packing-templates.tip.2': 'Smazání šablony se nedotkne cest, které ji už použily.',
  // categories
  'help.guide.categories.title': 'Spravovat sadu kategorií',
  'help.guide.categories.goal': 'Rozhodněte, které kategorie mohou místa a sbírky nést a jak vypadají.',
  'help.guide.categories.step.1':
    'Klikněte na Nová kategorie, zadejte název, zvolte ikonu a barvu; Náhled ukáže výsledek. Klikněte na Vytvořit.',
  'help.guide.categories.step.2':
    'Najeďte na kategorii v seznamu, abyste ji upravili nebo smazali. Smazání žádá potvrzení.',
  'help.guide.categories.result':
    'Sada platí všude najednou: v inspektoru míst, špendlících na mapě, Sbírkách a filtrech.',
  'help.guide.categories.tip.1':
    'Místa si drží id kategorie, takže přejmenování kategorie ji přejmenuje na každém místě.',
  'help.guide.categories.tip.2':
    'Smazaná kategorie nechá svá místa bez kategorie; pokud na tom záleží, nejdřív je přeřaďte.',
  // school-holiday-catalog
  'help.guide.school-holiday-catalog.title': 'Ručně spravovat školní prázdniny',
  'help.guide.school-holiday-catalog.goal': 'Pokryjte zemi nebo region, které vestavěné zdroje prázdnin nepokrývají.',
  'help.guide.school-holiday-catalog.step.1':
    'Pod Školní prázdniny klikněte na Přidat zemi, zadejte Země a její Kód země (např. US) a Uložit; pak Přidat region pro každou její část, která se liší.',
  'help.guide.school-holiday-catalog.step.2':
    'Kliknutím na region otevřete Region nebo školní obvod: Přidat období, každému dejte Název prázdnin, Datum začátku a Datum konce, a Uložit. Koš odstraní období, region nebo, jakmile nemá žádné regiony, zemi.',
  'help.guide.school-holiday-catalog.result':
    'Uživatelé najdou zemi a region pod Nastavení ve Vacay a vidí období ve své roční mřížce.',
  'help.guide.school-holiday-catalog.tip.1':
    'Regiony z vestavěných zdrojů tady upravit nelze; pokud je nějaké datum špatně, přidejte vedle nich ruční region.',
  // auth-methods
  'help.guide.auth-methods.title': 'Rozhodnout, jak se lidé přihlašují',
  'help.guide.auth-methods.goal': 'Otevřete nebo zavřete přihlášení heslem, SSO a registraci a vyžadujte 2FA.',
  'help.guide.auth-methods.step.1':
    'Pod Authentication Methods zapněte nebo vypněte Password Login a Password Registration. Vypnutá registrace znamená nové účty jen přes pozvánky, SSO nebo ručně.',
  'help.guide.auth-methods.step.2':
    'SSO Login a SSO Auto-Provisioning potřebují níže nastavené Jednotné přihlášení (OIDC); auto-provisioning vytvoří účet při prvním přihlášení někoho přes SSO.',
  'help.guide.auth-methods.step.3':
    'Vyžadovat dvoufázové ověření (2FA) přiměje každé přihlášení heslem nastavit při dalším přihlášení autentikátor. Přihlášení přístupovým klíčem potřebuje Relying Party ID (doména) a Povolené origins, na kterých je váš TREK dostupný.',
  'help.guide.auth-methods.result': 'Přihlašovací stránka nabízí přesně ty způsoby, které jste nechali zapnuté.',
  'help.guide.auth-methods.tip.1':
    'Než se zamknete venku, objeví se varování: aspoň jedna cesta dovnitř pro administrátory zůstane zapnutá.',
  'help.guide.auth-methods.tip.2': 'Hodnoty nastavené proměnnými prostředí se tady zobrazují jen pro čtení.',
  // oidc
  'help.guide.oidc.title': 'Připojit jednotné přihlášení',
  'help.guide.oidc.goal': 'Nechte lidi přihlašovat se přes vašeho poskytovatele identity.',
  'help.guide.oidc.step.1':
    'Pod Jednotné přihlášení (OIDC) zadejte Zobrazované jméno pro tlačítko a URL vydavatele (Issuer), Client ID a Client Secret od svého poskytovatele, pak Uložit.',
  'help.guide.oidc.step.2': 'Pod Authentication Methods zapněte SSO Login.',
  'help.guide.oidc.result':
    'Přihlašovací stránka ukáže tlačítko SSO; se zapnutým SSO Auto-Provisioning dostanou noví uživatelé účet automaticky.',
  'help.guide.oidc.tip.1':
    'Redirect URI, kterou váš poskytovatel potřebuje, je adresa vašeho TREKu plus cesta OIDC callbacku z dokumentace.',
  'help.guide.oidc.tip.2':
    'Mapování claimů rozhoduje, které skupiny SSO se stanou administrátory; viz stránka OIDC v dokumentaci.',
  // instance-keys
  'help.guide.instance-keys.title': 'Zadat API klíče',
  'help.guide.instance-keys.goal': 'Odemkněte hledání míst Google, obálky z Unsplash a Amap pro celou instanci.',
  'help.guide.instance-keys.step.1':
    'Pod API klíče vložte Google Maps API klíč a klikněte na Testovat; pole řekne, zda klíč odpovídá.',
  'help.guide.instance-keys.step.2':
    'Pod K čemu se klíč používá zapněte jen funkce, které chcete tomuto klíči účtovat: Automatické doplňování míst, Podrobnosti o místě, Fotografie míst, Obohacení míst, Záznam vyhledávání míst.',
  'help.guide.instance-keys.step.3':
    'Klíč API Unsplash pohání hledání obálek; API klíč Amap (高德地图) hledání míst v Číně. Každý otestujte stejně.',
  'help.guide.instance-keys.result':
    'Uživatelé dostanou funkce bez vlastních klíčů; bez klíče Google hledá TREK přes bezplatný stack OpenStreetMap a TREK Places API.',
  'help.guide.instance-keys.tip.1':
    'Osobní klíč uživatele pod Nastavení má pro tohoto uživatele přednost před klíčem instance.',
  'help.guide.instance-keys.tip.2': 'Klíče mohou přijít i z proměnných prostředí; ty se tady zobrazují jen pro čtení.',
  // places-transit
  'help.guide.places-transit.title': 'Zvolit poskytovatele hledání a dopravy',
  'help.guide.places-transit.goal': 'Rozhodněte, kdo odpovídá na hledání míst a trasy veřejnou dopravou.',
  'help.guide.places-transit.step.1':
    'Pod Poskytovatel hledání míst zvolte Automaticky, Google Places, Amap (高德地图) nebo OpenStreetMap. Automaticky použije nejlepší klíč, který existuje.',
  'help.guide.places-transit.step.2':
    'Pod Poskytovatel veřejné dopravy zvolte Transitous (zdarma), celosvětově a bez klíče, nebo Google, který potřebuje klíč Google.',
  'help.guide.places-transit.result':
    'Každé vyhledávací pole a každá trasa veřejnou dopravou v TREKu se řídí touto volbou.',
  'help.guide.places-transit.tip.1': 'Poskytovatel bez svého klíče tady ukáže varování a spadne zpět na OpenStreetMap.',
  'help.guide.places-transit.tip.2': 'Trasy veřejnou dopravou od Google se účtují za požadavek; Transitous ne.',
  // file-types
  'help.guide.file-types.title': 'Omezit typy souborů',
  'help.guide.file-types.goal': 'Rozhodněte, jaké přípony souborů smí nahrané soubory mít.',
  'help.guide.file-types.step.1': 'Pod Povolené typy souborů upravte seznam přípon oddělených čárkami a uložte.',
  'help.guide.file-types.result':
    'Nahrávání jakéhokoli jiného typu je odmítnuto s jasnou zprávou, v dokumentech, deníku i obálkách.',
  'help.guide.file-types.tip.1': 'Nechte v seznamu typy obrázků; obálky a fotky deníku procházejí stejnou kontrolou.',
  // toggle-addon
  'help.guide.toggle-addon.title': 'Zapnout nebo vypnout doplněk',
  'help.guide.toggle-addon.goal': 'Nabídněte funkční modul všem, nebo ho odeberte.',
  'help.guide.toggle-addon.step.1':
    'Přepněte přepínač na dlaždici doplňku. Položka v navigaci se všem najednou objeví nebo zmizí.',
  'help.guide.toggle-addon.step.2':
    'Některé dlaždice nesou podřádky s možnostmi, třeba Sledování zavazadel pod Seznamy nebo poskytovatele fotek pod Cestovní deník; zobrazují se, jen dokud je doplněk zapnutý.',
  'help.guide.toggle-addon.result': 'Data vypnutého doplňku zůstávají zachována; jeho opětovné zapnutí je zase ukáže.',
  'help.guide.toggle-addon.tip.1': 'Vypnuté MCP odstraní endpoint a sekce Integrace, které na něm závisí.',
  'help.guide.toggle-addon.tip.2':
    'Vacay, Atlas a Cestovní deník jsou doplňky, které uživatelé chtějí nejčastěji; Dokumenty potřebují úložiště pro nahrané soubory.',
  // install-plugin
  'help.guide.install-plugin.title': 'Nainstalovat plugin',
  'help.guide.install-plugin.goal': 'Přidejte plugin třetí strany a dejte mu přesně ta oprávnění, o která žádá.',
  'help.guide.install-plugin.step.1':
    'Otevřete Objevit, vyberte plugin a klikněte na Instalovat; nebo klikněte na Nahrát plugin a zvolte balíček .zip nebo .tar.gz.',
  'help.guide.install-plugin.step.2':
    'Zpět pod Nainstalováno si přečtěte řádek: co plugin smí číst nebo zapisovat, které hostitele volá a zda je podepsaný. Zapněte Povolit plugin.',
  'help.guide.install-plugin.step.3':
    'Nabídka řádku nabízí Restartovat, Zobrazit protokol chyb, Povolení hostitelé a Změnit verzi…; Smazat ho odinstaluje. Aktualizace se nabídne v řádku, jakmile existuje novější verze, a ta, která žádá o nová práva, zůstane vypnutá, dokud je neschválíte.',
  'help.guide.install-plugin.result':
    'Plugin běží ve vlastním procesu; to, co přidává, widgety, vrstvy mapy, nástroje, se objeví tam, kde to plugin deklaruje.',
  'help.guide.install-plugin.tip.1': 'Znovu prohledat najde složku pluginu propojenou pro vývoj bez balíčku.',
  'help.guide.install-plugin.tip.2':
    'Nepodepsaný plugin je jako takový označený; instalujte ho, jen když jeho zdroji důvěřujete.',
  // storage-backends
  'help.guide.storage-backends.title': 'Přesunout nahrané soubory na S3 nebo zrcadlo',
  'help.guide.storage-backends.goal': 'Držte soubory v objektovém úložišti, nebo na disku i v bucketu zároveň.',
  'help.guide.storage-backends.step.1':
    'Pod Backendy klikněte na Přidat backend, dejte mu Název, zvolte Typ, Místní, S3 nebo Zrcadlo, vyplňte pole a Použít. Test ověří připojení, Uložit změny ho zapíše.',
  'help.guide.storage-backends.step.2':
    'Pod Kategorie přiřaďte každou kategorii nahrávání backendu. Změna jedné se zeptá, zda Přesunout stávající objekty nebo Pouze směrovat nové zápisy.',
  'help.guide.storage-backends.step.3': 'Stav nahoře zkontroluje každý backend; červená položka pojmenuje, co selhalo.',
  'help.guide.storage-backends.result':
    'Nové nahrané soubory jdou do přiřazeného backendu; přesunuté soubory se servírují odtud.',
  'help.guide.storage-backends.tip.1': 'Backend nastavený proměnnými prostředí se zobrazí, ale tady ho upravit nelze.',
  'help.guide.storage-backends.tip.2':
    'Zrcadlo zapisuje do obou cílů a čte z prvního; použijte ho k migraci bez výpadku.',
  // channels-instance
  'help.guide.channels-instance.title': 'Nastavit kanály oznámení',
  'help.guide.channels-instance.goal': 'Rozhodněte, které kanály si uživatelé mohou vybrat, a nastavte e-mail.',
  'help.guide.channels-instance.step.1':
    'Pod Email (SMTP) zadejte SMTP Host, SMTP Port, SMTP User, SMTP Password a From Address; Odeslat testovací e-mail vám pošle zprávu.',
  'help.guide.channels-instance.step.2':
    'Zapněte Web Push, Ntfy a Webhook, abyste je nabídli; uživatelé pak pod Nastavení, Oznámení zapnou push pro každé zařízení, nebo zadají vlastní téma či URL.',
  'help.guide.channels-instance.step.3':
    'Připomínky výletů přepínají připomínku před začátkem cesty; In-App je vždy zapnuté a tady je jen vysvětlené.',
  'help.guide.channels-instance.result': 'Karta Oznámení každého uživatele ukazuje kanály, které jste zapnuli.',
  'help.guide.channels-instance.tip.1':
    'Výchozí server ntfy zadaný tady se uživatelům předvyplní; stále mohou uvést vlastní.',
  'help.guide.channels-instance.tip.2': 'Kanály pluginů se objeví samy, jakmile je aktivní plugin s touto schopností.',
  // admin-channels
  'help.guide.admin-channels.title': 'Dostávat události administrátora na telefon',
  'help.guide.admin-channels.goal': 'Dozvíte se o neúspěšných zálohách, nových vydáních a dalších událostech instance.',
  'help.guide.admin-channels.step.1':
    'Pod Admin Ntfy zadejte téma a v případě potřeby server a token; pod Admin webhook URL.',
  'help.guide.admin-channels.step.2':
    'Klikněte na Odeslat testovací Ntfy nebo Odeslat testovací webhook a sledujte, jak zpráva dorazí.',
  'help.guide.admin-channels.result':
    'Události administrátora jdou tam navíc ke zvonku v aplikaci každého administrátora.',
  'help.guide.admin-channels.tip.1':
    'Držte téma pro administrátory odděleně od osobního, aby výpadek nezapadl mezi zprávami o cestách.',
  // mcp-tokens-admin
  'help.guide.mcp-tokens-admin.title': 'Odvolat přístup AI',
  'help.guide.mcp-tokens-admin.goal':
    'Prohlédněte a přerušte každý token a relaci, které AI klient drží, pro kteréhokoli uživatele.',
  'help.guide.mcp-tokens-admin.step.1':
    'Pod API tokeny najděte token podle uživatele a názvu; koš ho smaže a klient se okamžitě zastaví.',
  'help.guide.mcp-tokens-admin.step.2':
    'Pod OAuth relace totéž pro klienty v prohlížeči: klient, uživatel a datum, a koš relaci odvolá.',
  'help.guide.mcp-tokens-admin.result': 'Klienta musí jeho uživatel znovu připojit; nic jiného se nemění.',
  'help.guide.mcp-tokens-admin.tip.1':
    'Oprávnění říkají, co klient mohl dělat; oprávnění jen pro čtení je neškodné nechat.',
  'help.guide.mcp-tokens-admin.tip.2': 'Vypnutí doplňku MCP odvolá všechno najednou.',
  // release-history
  'help.guide.release-history.title': 'Zkontrolovat nové vydání',
  'help.guide.release-history.goal': 'Vězte, zda je váš TREK aktuální a co přinese další verze.',
  'help.guide.release-history.step.1':
    'Když existuje novější vydání, nahoře na stránce administrace se ukáže Dostupná aktualizace; Zobrazit na GitHubu ho otevře a Jak aktualizovat vysvětlí aktualizaci pro Docker i jiné instalace.',
  'help.guide.release-history.step.2':
    'Historie verzí vypisuje každé vydání s poznámkami; Zobrazit podrobnosti je rozbalí, nejnovější nese Nejnovější a Načíst další jde dál do minulosti.',
  'help.guide.release-history.result':
    'Aktualizace probíhá na hostiteli, stažením nového image nebo sestavením nového tagu; datový adresář zůstává.',
  'help.guide.release-history.tip.1': 'Před aktualizací udělejte zálohu; karta Zálohování je hned vedle.',
  'help.guide.release-history.tip.2':
    'Předběžná vydání se zobrazují, ale neohlašují se jako aktualizace, pokud některé neprovozujete.',
  // create-backup
  'help.guide.create-backup.title': 'Vytvořit a obnovit zálohu',
  'help.guide.create-backup.goal': 'Pořiďte snímek celé instance, uchovejte kopii jinde a mějte možnost ji vrátit.',
  'help.guide.create-backup.step.1':
    'Pod Záloha dat klikněte na Vytvořit zálohu. Zabalí databázi a nahrané soubory do jednoho souboru na serveru.',
  'help.guide.create-backup.step.2': 'Stáhnout uchová kopii mimo tento stroj; koš maže staré zálohy a uvolní místo.',
  'help.guide.create-backup.step.3':
    'Obnovit u zálohy, nebo Nahrát zálohu se souborem, nahradí aktuální data, jakmile se Obnovit zálohu? jednou zeptá.',
  'help.guide.create-backup.result':
    'Obnovení vrátí uživatele, cesty, soubory a nastavení do stavu té zálohy; všichni jsou odhlášeni.',
  'help.guide.create-backup.tip.1':
    'Obnovení je tady jediná akce, kterou nejde vrátit zpět. Nejdřív udělejte čerstvou zálohu.',
  'help.guide.create-backup.tip.2': 'Zálohy leží v datovém adresáři; teprve kopie na jiném stroji z nich dělá zálohu.',
  // auto-backup
  'help.guide.auto-backup.title': 'Naplánovat zálohy',
  'help.guide.auto-backup.goal': 'Nechte server zálohovat sám sebe a uchovávat jen posledních pár záloh.',
  'help.guide.auto-backup.step.1':
    'Pod Automatické zálohování zapněte Povolit automatické zálohování a zvolte Interval, Spustit v hodinu a pro týdenní nebo měsíční Den v týdnu nebo Den v měsíci.',
  'help.guide.auto-backup.step.2':
    'Smazat staré zálohy po určuje, jak dlouho se záloha uchovává; starší odejdou, když vznikne nová.',
  'help.guide.auto-backup.result': 'Zálohy se v seznamu objevují podle plánu; selhání dorazí do kanálů administrátora.',
  'help.guide.auto-backup.tip.1': 'Časy se řídí časovým pásmem serveru, zobrazeným na kartě Audit.',
  'help.guide.auto-backup.tip.2': 'Místo na serveru není nekonečné; tři až pět záloh obvykle stačí.',
  // audit-log
  'help.guide.audit-log.title': 'Číst protokol auditu',
  'help.guide.audit-log.goal': 'Zjistěte, kdo co udělal a kdy.',
  'help.guide.audit-log.step.1':
    'Čtěte řádky: čas, uživatel, akce, zdroj, IP a podrobnosti, nejnovější první. Akce jsou pojmenované podle toho, co se stalo, třeba neúspěšné přihlášení, změna MFA nebo obnovení.',
  'help.guide.audit-log.step.2': 'Obnovit znovu načte začátek; Načíst další jde dál do minulosti.',
  'help.guide.audit-log.result': 'Stopa, kterou můžete předat komukoli, kdo se ptá, proč se něco změnilo.',
  'help.guide.audit-log.tip.1': 'Časy se zobrazují v časovém pásmu serveru, uvedeném nad tabulkou.',
  'help.guide.audit-log.tip.2': 'Protokol je jen pro přidávání; nic tady nelze z aplikace upravit ani smazat.',
  // document-providers
  'help.guide.document-providers.title': 'Nabídnout úložiště dokumentů',
  'help.guide.document-providers.goal': 'Rozhodněte, se kterými úložišti smí cesta své dokumenty synchronizovat.',
  'help.guide.document-providers.step.1':
    'Dlaždice Dokumenty nese úložiště jako řádky na své poličce: Paperless-ngx, Papra, Nextcloud, OpenCloud a Synology Drive. Všech pět začíná vypnutých a polička je tam jen tehdy, dokud jsou zapnuté samotné Dokumenty.',
  'help.guide.document-providers.step.2':
    'Přepněte přepínač na řádku Nextcloud. Zpráva zní Doplněk byl aktualizován a od té chvíle najdou vlastníci cest v kartě Soubory svých cest Synchronizace dokumentů, s Nextcloud pod Připojit poskytovatele.',
  'help.guide.document-providers.result':
    'Úložiště je v nabídce na každé cestě tohoto TREKu; nic není připojené, dokud to neudělá vlastník cesty.',
  'help.guide.document-providers.tip.1':
    'Tady se rozhoduje jen o tom, zda se úložiště smí nabízet. Adresa a přihlašovací údaje patří k cestě a zadává je v její kartě Soubory vlastník cesty, nikdy v administraci.',
  'help.guide.document-providers.tip.2':
    'Vypnutí Dokumentů vypne s nimi každé úložiště a úložiště nejde zapnout, dokud jsou Dokumenty vypnuté: server odpoví Enable the Documents addon first. Úložiště ve vaší vlastní síti potřebuje na serveru navíc ALLOW_INTERNAL_NETWORK=true.',

  // ── Screen: trip ──────────────────────────────────────────────────────────────────────
  'help.ctx.trip.title': 'Cesta',
  'help.ctx.trip.summary':
    'Jedna cesta, celá: plán s jeho dny, mapou a místy a karty pro dopravu, rezervace, seznamy, náklady, soubory a spolupráci. Každá z nich má vlastní obrazovku nápovědy pod touto.',
  'help.ctx.trip.bullet.1':
    'Lišta karet: Plán, Doprava, Rezervace, Seznamy, Náklady, Soubory a Spolupráce. Které karty na vašem TREKu existují, určují doplňky a pluginy.',
  'help.ctx.trip.bullet.2':
    'Plán má tři sloupce: vlevo dny, uprostřed mapu, vpravo místa. Rezervace a doprava žijí uvnitř plánu, u zastávky a mezi zastávkami; karty je vypisují.',
  'help.ctx.trip.bullet.3':
    'Sdílet vpravo nahoře otevře lidi cesty: členy, hosty, odkaz pro pozvání a veřejný odkaz jen pro čtení.',
  'help.ctx.trip.bullet.4': 'Název, data, úvodní fotku a měnu upravíte z Moje cesty, tužkou na kartě cesty.',
  'help.ctx.trip.bullet.5':
    'Šipky na vnitřním okraji sloupce ho složí a místo zabere mapa; tenký oddělovač vedle sloupce mění jeho šířku.',
  'help.ctx.trip.bullet.6': 'Šipka zpět v liště nástrojů dnů vrátí poslední změnu plánu.',
  // add-member
  'help.guide.add-member.title': 'Přidat člena',
  'help.guide.add-member.goal': 'Dejte někomu s účtem TREK přístup k této cestě.',
  'help.guide.add-member.step.1': 'Klikněte na Sdílet vpravo nahoře.',
  'help.guide.add-member.step.2': 'Pod Pozvat uživatele vyberte osobu ze seznamu a klikněte na Pozvat.',
  'help.guide.add-member.step.3':
    'Osoba se teď objeví pod Přístup. Korunka označuje vlastníka; ikona na konci řádku přístup zase odebere.',
  'help.guide.add-member.result':
    'Člen vidí a upravuje cestu jako vy, v mezích úrovní, které správce nastavil pod Nastavení oprávnění.',
  'help.guide.add-member.tip.1':
    'Kdo v seznamu chybí, nemá ještě účet TREK: přidejte ho jako hosta, nebo ho nechte zaregistrovat přes odkaz pro pozvání.',
  'help.guide.add-member.tip.2': 'Číslo vedle Přístup počítá lidi v cestě; hosté jsou vypsaní zvlášť níže.',
  // trip-invite-link
  'help.guide.trip-invite-link.title': 'Pozvat odkazem',
  'help.guide.trip-invite-link.goal': 'Nechte lidi, ať se k cestě připojí sami.',
  'help.guide.trip-invite-link.step.1':
    'Klikněte na Sdílet a pak pod Odkaz pro pozvání na cestu klikněte na Vytvořit odkaz pro pozvání.',
  'help.guide.trip-invite-link.step.2':
    'Klikněte na Kopírovat a odkaz pošlete. Kdokoli s účtem TREK, kdo ho otevře, se připojí jako člen.',
  'help.guide.trip-invite-link.step.3': 'Vygenerovat znovu odkaz nahradí a ten starý znehodnotí; Deaktivovat ho vypne.',
  'help.guide.trip-invite-link.result': 'Kdo odkaz otevře, je v cestě a objeví se pod Přístup.',
  'help.guide.trip-invite-link.tip.1':
    'Kdo nemá účet, ho nemůže použít. Registrační odkazy rozdává správce pod Administrace, Uživatelé, a může jeden navázat na tuto cestu.',
  'help.guide.trip-invite-link.tip.2':
    'Použijte Vygenerovat znovu, když odkaz skončil ve špatném chatu: ten starý přestane fungovat okamžitě.',
  // add-guest
  'help.guide.add-guest.title': 'Přidat hosta bez účtu',
  'help.guide.add-guest.goal': 'Započítejte někoho, kdo TREK nepoužívá.',
  'help.guide.add-guest.step.1': 'Klikněte na Sdílet a sjeďte k Hosté.',
  'help.guide.add-guest.step.2': 'Napište jméno do Jméno hosta a klikněte na Přidat hosta.',
  'help.guide.add-guest.result': 'Hosta lze přiřadit k nákladům, položkám balení a úkolům, ale nemůže se přihlásit.',
  'help.guide.add-guest.tip.1':
    'Tužka hosta přejmenuje; ikona na konci řádku ho odebere i s jeho podíly a přiřazeními.',
  'help.guide.add-guest.tip.2': 'Pokud si ta osoba později založí účet, pozvěte ji jako člena a hosta odeberte.',
  // public-link
  'help.guide.public-link.title': 'Zveřejnit odkaz jen pro čtení',
  'help.guide.public-link.goal': 'Ukažte cestu lidem, kteří ji nemají upravovat.',
  'help.guide.public-link.step.1':
    'Klikněte na Sdílet; vpravo pod Veřejný odkaz zaškrtněte, co smí odkaz ukázat. Mapa a plán je vždy zapnuté; Rezervace, Balení, Náklady a Chat jsou na vás.',
  'help.guide.public-link.step.2': 'Klikněte na Vytvořit odkaz a pak na Kopírovat.',
  'help.guide.public-link.step.3': 'Zaškrtnutí lze měnit, dokud odkaz existuje; Smazat odkaz ho ukončí.',
  'help.guide.public-link.result': 'Kdokoli s odkazem vidí zvolené části bez přihlášení a nemůže nic změnit.',
  'help.guide.public-link.tip.1':
    'Odkaz není nikde vypsaný; kdo ho má, může ho otevřít, tak s ním zacházejte jako s heslem.',
  'help.guide.public-link.tip.2': 'Pro práva k úpravám přidejte osobu raději jako člena.',
  // transfer-ownership
  'help.guide.transfer-ownership.title': 'Předat cestu nebo ji opustit',
  'help.guide.transfer-ownership.goal': 'Udělejte vlastníkem někoho jiného, nebo vystupte z cesty, která není vaše.',
  'help.guide.transfer-ownership.step.1':
    'Klikněte na Sdílet. Pod Přístup udělá korunka na řádku člena z této osoby vlastníka; potvrďte dotaz.',
  'help.guide.transfer-ownership.step.2':
    'Opustit cestu na vašem řádku vás z cesty odebere; jako vlastník ji nejdřív předejte.',
  'help.guide.transfer-ownership.result':
    'Nový vlastník spravuje členy a může cestu smazat; vy zůstáváte běžným členem.',
  'help.guide.transfer-ownership.tip.1':
    'Vlastníkem je ten, kdo cestu založil, dokud ji nepředá; smazat cestu může jen on.',
  'help.guide.transfer-ownership.tip.2':
    'Odebrat přístup na cizím řádku je totéž tlačítko obráceně: vlastník člena odebere.',
  // collapse-columns
  'help.guide.collapse-columns.title': 'Udělat místo mapě',
  'help.guide.collapse-columns.goal': 'Složte sloupec, nebo mu dejte větší šířku.',
  'help.guide.collapse-columns.step.1':
    'Klikněte na šipku na vnitřním okraji sloupce dnů a sloupec se složí; místo zabere mapa. Sloupec míst má stejnou šipku.',
  'help.guide.collapse-columns.step.2': 'Kliknutím na šipku znovu sloupec vrátíte.',
  'help.guide.collapse-columns.step.3': 'Tažením tenkého oddělovače mezi sloupcem a mapou změníte šířku sloupce.',
  'help.guide.collapse-columns.result': 'Šířky si aplikace pamatuje; sloupce se při příští návštěvě vrátí otevřené.',
  'help.guide.collapse-columns.tip.1': 'Oba sloupce lze složit najednou pro zobrazení jen s mapou.',
  'help.guide.collapse-columns.tip.2': 'Na telefonu sloupce nejsou: Plán a Místa jsou dvě tlačítka dole na mapě.',
  // undo-change
  'help.guide.undo-change.title': 'Vrátit poslední změnu',
  'help.guide.undo-change.goal': 'Vezměte zpět, co jste právě v plánu udělali.',
  'help.guide.undo-change.step.1':
    'Klikněte na šipku zpět v liště nástrojů nad dny; její popisek pojmenuje změnu, kterou vrátí.',
  'help.guide.undo-change.result': 'Plán je zase takový, jaký byl, a šipka zešedne až do další změny.',
  'help.guide.undo-change.tip.1':
    'Zpět pokrývá plán: přiřazení, odebrání, přeřazení a přesun míst, optimalizaci trasy, mazání míst, změny kategorií a importy.',
  'help.guide.undo-change.tip.2': 'Má jen jeden krok: vrátit lze pouze poslední změnu a nová změna ji nahradí.',

  // ── Screen: trip-places ───────────────────────────────────────────────────────────────
  'help.ctx.trip-places.title': 'Místa',
  'help.ctx.trip-places.summary':
    'Pravý sloupec plánu: každé místo cesty, naplánované i ne, s hledáním a filtry, a způsoby, jak místa dostat dovnitř, ručně, ze souboru nebo ze sdíleného seznamu.',
  'help.ctx.trip-places.bullet.1':
    'Přidat místo/aktivitu nahoře otevře formulář pro místo, které napíšete nebo vyhledáte. Když je otevřený den, tlačítko říká Nové místo a Ke dni vedle něj vytvoří místo rovnou na tom dni.',
  'help.ctx.trip-places.bullet.2':
    'Importovat soubor bere soubory .gpx, .kml a .kmz; Import seznamu bere sdílený seznam z Google Maps nebo Naver Maps. Soubor lze také jen pustit na sloupec.',
  'help.ctx.trip-places.bullet.3':
    'Rozbalovací nabídka přepíná mezi Vše, Nezařazené, Naplánované a, jakmile je importovaná trasa, Trasy; pod ní sedí hledání, filtr kategorií a hvězda pro minimální hodnocení.',
  'help.ctx.trip-places.bullet.4':
    'Řádek ukazuje obrázek, název a popis nebo adresu. Kliknutím otevřete podrobnosti místa, přetažením ho položíte na den, pravým tlačítkem dostanete Upravit, + Den, Otevřít webové stránky, Google Maps, Uložit do sbírky a Smazat.',
  'help.ctx.trip-places.bullet.5':
    'Když je otevřený den, + na konci nezařazeného řádku položí místo na ten den a Naplánované vypíší jen ten den, se Zobrazit celou cestu pro návrat k celku.',
  'help.ctx.trip-places.bullet.6':
    'Ikona zaškrtnutí na pravém konci řádku s filtry spustí výběr: několik řádků naráz dostane novou kategorii, jde do sbírky nebo se smaže.',
  // create-place
  'help.guide.create-place.title': 'Vytvořit místo',
  'help.guide.create-place.goal': 'Přidejte místo nebo aktivitu ručně, se vším, co o něm plán potřebuje vědět.',
  'help.guide.create-place.step.1':
    'Klikněte nahoře ve sloupci míst na Přidat místo/aktivitu (Nové místo, když je otevřený den). Otevře se formulář.',
  'help.guide.create-place.step.2':
    'Napište místo nahoře do Hledat místa... a vyberte výsledek. Název, Adresa, Zeměpisná šířka, Zeměpisná délka a Webové stránky se vyplní a Podrobnosti místa vlevo ukážou obrázky, otevírací dobu a popis k němu. Na TREKu s klíčem Google sedí pod seznamem Není to správné místo? Hledat na Googlu a spustí stejné hledání přes Google.',
  'help.guide.create-place.step.3':
    'V Podrobnostech místa se kliknutím na obrázek pod Vybrat obrázek stane tento obrázek obrázkem místa; Použít tento text převezme popis do formuláře.',
  'help.guide.create-place.step.4':
    'Zkontrolujte pole: Název je povinný; Popis a Poznámky jsou vaše; Adresa, Zeměpisná šířka a Zeměpisná délka pocházejí z hledání nebo se napíší; Kategorie vybírá jednu z kategorií cesty a + vedle ní vytvoří na místě novou; Webové stránky berou odkaz.',
  'help.guide.create-place.step.5':
    'Klikněte na Přidat. Pokud už v cestě je místo stejného názvu, formulář to řekne a tlačítko se změní na Přesto přidat.',
  'help.guide.create-place.result': 'Místo je v seznamu a na mapě, pod Nezařazené, dokud ho nepoložíte na den.',
  'help.guide.create-place.tip.1':
    'Soubory a Náklady dole ve formuláři připojí k místu dokument nebo hned po uložení otevřou editor Náklady pro jeho výdaj.',
  'help.guide.create-place.tip.2':
    'Hledání na každém TREKu zodpoví index TREK a OpenStreetMap a Podrobnosti místa se plní z Wikipedie, Wikivoyage a Wikimedia. Google přijde na řadu jen tam, kde oba zůstanou prázdné, a jen on přináší hodnocení.',
  'help.guide.create-place.tip.3':
    'Místo může začít i na mapě: klikněte na bod pravým tlačítkem a formulář se otevře s vyplněnými souřadnicemi a adresou.',
  // place-to-open-day
  'help.guide.place-to-open-day.title': 'Přidat místo rovnou na otevřený den',
  'help.guide.place-to-open-day.goal': 'Vynechte druhý krok: vytvořte nebo vyberte místo a mějte ho rovnou na dni.',
  'help.guide.place-to-open-day.step.1':
    'Klikněte ve sloupci dnů na záhlaví dne. Den je otevřený: jeho karta je zvýrazněná a sloupec míst dostane tlačítko Ke dni.',
  'help.guide.place-to-open-day.step.2':
    'Ke dni otevře stejný formulář jako Nové místo, jen místo přistane na otevřeném dni ve chvíli, kdy kliknete na Přidat.',
  'help.guide.place-to-open-day.step.3':
    'Místo, které už existuje, jde na otevřený den přes + na konci svého řádku nebo pravým tlačítkem, + Den.',
  'help.guide.place-to-open-day.step.4':
    'Funguje to i obráceně, a bez toho, abys nejdřív otevřel den: přetáhni řádek místa ze sloupce a pusť ho na kartu dne. Když ho pustíš mezi dvě zastávky, přistane přesně tam.',
  'help.guide.place-to-open-day.result':
    'Místo je vypsané pod dnem, na konci; přetažením nahoru nebo dolů ho dáte tam, kam patří.',
  'help.guide.place-to-open-day.tip.1':
    'Otevřený den řídí i hledání: když je den otevřený, mapa i hledání v okolí začínají tam, kam ten den stejně vede.',
  'help.guide.place-to-open-day.tip.2': 'Zpět v liště nástrojů nad dny přiřazení vrátí.',
  // filter-places
  'help.guide.filter-places.title': 'Najít místo v seznamu',
  'help.guide.filter-places.goal': 'Zužte sloupec na místa, která hledáte.',
  'help.guide.filter-places.step.1':
    'Rozbalovací nabídka nahoře přepíná mezi Vše, Nezařazené (ještě na žádném dni), Naplánované (na dni) a Trasy (importované trasy GPX), každé se svým počtem.',
  'help.guide.filter-places.step.2': 'Pište do Hledat místa...; seznam se zužuje, jak píšete.',
  'help.guide.filter-places.step.3':
    'Všechny kategorie otevřou seznam, kde zaškrtnete jednu nebo víc kategorií, mezi nimi Bez kategorie; Vymazat filtr dole ho zruší.',
  'help.guide.filter-places.step.4':
    'Hvězda vedle nastaví minimální hodnocení: 5+, 4+ a tak dál ukážou jen místa, která jste ohodnotili aspoň tak vysoko.',
  'help.guide.filter-places.result': 'Počet nad řádky říká, kolik míst odpovídá; filtry se kombinují.',
  'help.guide.filter-places.tip.1':
    'Když je otevřený den, Naplánované vypíší jen ten den a říkají to: Zobrazuje se jen otevřený den, se Zobrazit celou cestu vedle.',
  'help.guide.filter-places.tip.2': 'Mapa se zúží na otevřený den také; Vše v seznamu stále ukazuje každé místo cesty.',
  // edit-place
  'help.guide.edit-place.title': 'Změnit místo',
  'help.guide.edit-place.goal': 'Opravte název, posuňte špendlík, přidejte web nebo změňte kategorii.',
  'help.guide.edit-place.step.1':
    'Klikněte na řádek pravým tlačítkem a zvolte Upravit, nebo místo otevřete a klikněte na Upravit v jeho podrobnostech.',
  'help.guide.edit-place.step.2':
    'Změňte, co potřebujete: Název, Popis, Poznámky, Adresa, Zeměpisná šířka a Zeměpisná délka, Kategorie, Webové stránky. Otevřený ze dne má formulář navíc Poznámky pro tento den a Od a Do pro ten den.',
  'help.guide.edit-place.step.3': 'Klikněte na Aktualizovat.',
  'help.guide.edit-place.result':
    'Změna platí všude, kde se místo objevuje: v seznamu, na mapě a na každém dni, na kterém je.',
  'help.guide.edit-place.tip.1':
    'Poznámky pro tento den patří místu na tom jednom dni; Poznámky patří samotnému místu.',
  'help.guide.edit-place.tip.2':
    'Do před Od zablokuje Aktualizovat; Časový překryv s: jen upozorní, že jiná zastávka dne má stejný čas.',
  // delete-place
  'help.guide.delete-place.title': 'Smazat místo',
  'help.guide.delete-place.goal': 'Odeberte místo z cesty natrvalo.',
  'help.guide.delete-place.step.1':
    'Klikněte na řádek pravým tlačítkem a zvolte Smazat, nebo klikněte na Smazat v podrobnostech místa.',
  'help.guide.delete-place.step.2':
    'Potvrďte. Pokud byla na místě zamluvená noc nebo je k němu navázaná rezervace, otázka řekne, co jde s ním.',
  'help.guide.delete-place.result':
    'Místo zmizí ze seznamu, z mapy i ze všech dnů; Zpět v liště nástrojů nad dny ho vrátí.',
  'help.guide.delete-place.tip.1':
    'Chcete-li místo sundat jen z jednoho dne, použijte na té zastávce raději Odebrat ze dne.',
  'help.guide.delete-place.tip.2': 'Několik míst naráz: ikona zaškrtnutí vedle filtrů spustí výběr.',
  // select-places
  'help.guide.select-places.title': 'Změnit nebo smazat několik míst naráz',
  'help.guide.select-places.goal': 'Ukliďte seznam jedním tahem, ne místo po místu.',
  'help.guide.select-places.step.1':
    'Klikněte na ikonu zaškrtnutí na pravém konci řádku s filtry. Řádky dostanou zaškrtávací políčka a objeví se lišta s akcemi.',
  'help.guide.select-places.step.2': 'Zaškrtněte řádky, nebo v liště Vybrat vše; lišta počítá, co je vybrané.',
  'help.guide.select-places.step.3':
    'Change category dá všem jednu kategorii; Uložit do sbírky je zkopíruje do některé z vašich sbírek; Smazat vybrané je po potvrzení odstraní.',
  'help.guide.select-places.step.4': 'Dalším kliknutím na ikonu zaškrtnutí výběr opustíte.',
  'help.guide.select-places.result':
    'Změna platí pro každé vybrané místo; smazání lze vrátit z lišty nástrojů nad dny.',
  'help.guide.select-places.tip.1':
    'Filtry při výběru dál fungují: nejdřív filtrujte na Nezařazené, pak Vybrat vše chytí přesně je.',
  'help.guide.select-places.tip.2':
    'Označit jako navštívené v seznamech se v liště objeví, když je zapnutý doplněk Sbírky: odškrtne místa ve sbírkách, ve kterých jsou uložená.',
  // import-places-file
  'help.guide.import-places-file.title': 'Importovat místa ze souboru GPX, KML nebo KMZ',
  'help.guide.import-places-file.goal':
    'Dostaňte dovnitř to, co vyexportovaly Google My Maps, Google Earth nebo GPS tracker.',
  'help.guide.import-places-file.step.1': 'Klikněte na Importovat soubor, nebo pusťte soubor kamkoli na sloupec míst.',
  'help.guide.import-places-file.step.2':
    'Vyberte soubor nebo ho přetáhněte do rámečku. U GPX zaškrtněte, co se má importovat: Trasové body, Trasy, Trasy GPS (s geometrií); u KML a KMZ Body (Placemarks) a Trasy (LineStrings).',
  'help.guide.import-places-file.step.3':
    'Rámeček bere několik souborů najednou a jen .gpx, .kml a .kmz. Jiný typ souboru nebo soubor přes 10 MB dialog odmítne a neimportuje.',
  'help.guide.import-places-file.step.4':
    'Klikněte na Importovat. Zpráva řekne, kolik míst přišlo; u souboru KML nebo KMZ zůstane dialog otevřený se souhrnem toho, co vzniklo a co se přeskočilo.',
  'help.guide.import-places-file.result':
    'Místa jsou v seznamu; trasa nese na svém řádku značku trasy, kreslí se na mapě a dostane vlastní filtr Trasy.',
  'help.guide.import-places-file.tip.1':
    'Příliš velký soubor je odmítnut s limitem velikosti; vyexportujte ho znovu bez fotek, nebo ho rozdělte.',
  'help.guide.import-places-file.tip.2': 'Import lze vrátit jako celek z lišty nástrojů nad dny.',
  // import-places-list
  'help.guide.import-places-list.title': 'Importovat sdílený seznam z Google Maps nebo Naver Maps',
  'help.guide.import-places-list.goal': 'Proměňte odkaz na sdílený seznam v místa.',
  'help.guide.import-places-list.step.1': 'Klikněte na Import seznamu a zvolte Google Seznam nebo Naver Seznam.',
  'help.guide.import-places-list.step.2':
    'Vložte sdílený odkaz seznamu. Funguje i odkaz na trasu v Google Maps: jeho zastávky se stanou místy, v pořadí jízdy.',
  'help.guide.import-places-list.step.3': 'Klikněte na Importovat.',
  'help.guide.import-places-list.result':
    'Každé místo seznamu je v cestě, pojmenované jako v seznamu; místa, která už v cestě jsou, se přeskočí.',
  'help.guide.import-places-list.tip.1': 'Seznam musí být sdílený veřejně; odkaz na soukromý seznam neimportuje nic.',
  'help.guide.import-places-list.tip.2':
    'Obohatit místa přes Google se v dialogu objeví, když má váš TREK klíč Google: vyhledá každé importované místo a doplní fotky, adresu a podrobnosti.',

  // ── Screen: trip-days ─────────────────────────────────────────────────────────────────
  'help.ctx.trip-days.title': 'Dny',
  'help.ctx.trip-days.summary':
    'Levý sloupec plánu: jedna karta na den se zastávkami v pořadí, s poznámkami, s rezervacemi a dopravou toho dne a s trasou mezi zastávkami. Tady se cesta doopravdy plánuje.',
  'help.ctx.trip-days.bullet.1':
    'Lišta nástrojů nahoře: Exportovat (PDF, kalendář, GPX), Expand all days / Collapse all days, šipka zpět, Změnit pořadí dnů a Zobrazit všechny trasy rezervací.',
  'help.ctx.trip-days.bullet.2':
    'Karta dne: číslo, počasí, název, datum a náklady dne v záhlaví; kliknutím na záhlaví den otevřete, šipka vpravo kartu sbalí. Veřejná doprava, Přidat dopravu a Přidat poznámku sedí v záhlaví také.',
  'help.ctx.trip-days.bullet.3':
    'Uvnitř dne: zastávky v pořadí, každá s obrázkem, názvem, časem a zámkem na obrázku; poznámky; rezervace, které ke dni patří; a mezi zastávkami čas jízdy každého úseku.',
  'help.ctx.trip-days.bullet.4':
    'Pod zastávkami lišta trasy: Trasa vykreslí den na mapě, Optimalizovat seřadí zastávky, Autem / Pěšky nastaví způsob dopravy dne, Otevřít v Google Mapách a Otevřít v CoMaps den předají dál.',
  'help.ctx.trip-days.bullet.5':
    'Místa se na den dostanou přetažením řádku ze sloupce míst, přes + na tom řádku, přes Přidat místo k tomuto dni na prázdném dni nebo z podrobností místa.',
  'help.ctx.trip-days.bullet.6': 'Celkové náklady dole sečtou každou zastávku a rezervaci s cenou, v měně cesty.',
  // read-day-plan
  'help.guide.read-day-plan.title': 'Přečíst den',
  'help.guide.read-day-plan.goal': 'Poznejte, co vám každá část karty dne říká, dřív než cokoli změníte.',
  'help.guide.read-day-plan.step.1':
    'Záhlaví: číslo dne, předpověď na ten den, Den 1 nebo název, který jste dni dali, datum a náklady dne. Kliknutím na záhlaví den otevřete (nad mapou se otevřou jeho podrobnosti); šipka vpravo kartu sbalí a rozbalí.',
  'help.guide.read-day-plan.step.2':
    'Zastávka: úchyt vlevo ji táhne, obrázek nese zámek pro optimalizaci trasy, pak jde název, popis a, pokud jsou nastavené, Poznámky pro tento den. Časový štítek ukazuje Od a Do, když je zastávka má; šipky, které se objeví na jejím pravém konci, s ní posunou nahoru nebo dolů.',
  'help.guide.read-day-plan.step.3':
    'Rezervace na dni: rezervace u zastávky označí zastávku Rezervace potvrzena nebo Rezervace čeká a doprava se ukáže jako Odlet nebo Přílet se svým časem a trasou, s malým přepínačem, který tu trasu vykreslí na mapě.',
  'help.guide.read-day-plan.step.4':
    'Mezi dvěma zastávkami říká spojnice, jak dlouho úsek trvá a jak je dlouhý, ve způsobu dopravy dne; kliknutím na ni změníte způsob pro ten jeden úsek.',
  'help.guide.read-day-plan.step.5':
    'Lišta trasy na konci: Trasa vykreslí cestu dne na mapě, Optimalizovat přeuspořádá zastávky, tlačítka způsobu vyberou Autem nebo Pěšky, Otevřít v Google Mapách a Otevřít v CoMaps den otevřou tam.',
  'help.guide.read-day-plan.result': 'Každý symbol na kartě něco znamená; návody níže každý z nich mění.',
  'help.guide.read-day-plan.tip.1':
    'Klikněte na zastávku pravým tlačítkem a dostanete její nabídku: Upravit, Odebrat ze dne, Otevřít webové stránky, navigační aplikace (Google Maps, Waze, Apple Maps, OpenStreetMap, CoMaps), Uložit do sbírky, Smazat.',
  'help.guide.read-day-plan.tip.2':
    'Najeďte na zastávku a na jejím konci se objeví Přidat rezervaci: rezervace vytvořená tam patří k této zastávce na tomto dni.',
  // place-onto-day
  'help.guide.place-onto-day.title': 'Položit místo na den',
  'help.guide.place-onto-day.goal': 'Udělejte z místa ze seznamu zastávku dne, tam, kam v pořadí patří.',
  'help.guide.place-onto-day.step.1':
    'Přetáhněte řádek ze sloupce míst na kartu dne. Pusťte ho mezi dvě zastávky, aby skončil přesně tam, nebo kamkoli na kartu, aby se připojil na konec.',
  'help.guide.place-onto-day.step.2':
    'Bez přetahování: otevřete den kliknutím na jeho záhlaví, pak klikněte na + na konci řádku místa, nebo klikněte na řádek pravým tlačítkem a zvolte + Den.',
  'help.guide.place-onto-day.step.3':
    'Na prázdném dni otevře Přidat místo k tomuto dni formulář místa a nové místo přistane na dni hned.',
  'help.guide.place-onto-day.step.4':
    'Z podrobností místa se Přidat ke dni zeptá, na který den; s dnem otevřeným z jeho záhlaví vytvoří Ke dni ve sloupci míst nové místo rovnou na otevřeném dni.',
  'help.guide.place-onto-day.result':
    'Místo je zastávkou dne, na mapě s číslem dne, a sloupec míst ho počítá pod Naplánované.',
  'help.guide.place-onto-day.tip.1':
    'Místo může být na několika dnech: na druhý den ho položte ze sloupce míst. Přetažení zastávky z jedné karty dne na druhou ji naopak přesune.',
  'help.guide.place-onto-day.tip.2': 'Šipka zpět v liště nástrojů přiřazení vrátí.',
  'help.guide.place-onto-day.tip.3':
    'Zastávku nelze pustit mezi dva záznamy s pevným časem ani před rezervaci, která už čas má; plán si drží chronologii.',
  // reorder-stops
  'help.guide.reorder-stops.title': 'Změnit pořadí dne',
  'help.guide.reorder-stops.goal': 'Posuňte zastávku nahoru nebo dolů, nebo na jiný den.',
  'help.guide.reorder-stops.step.1': 'Táhněte zastávku za úchyt na nové místo v kartě.',
  'help.guide.reorder-stops.step.2':
    'Nebo použijte šipky na pravém konci zastávky: jeden krok nahoru nebo dolů na kliknutí.',
  'help.guide.reorder-stops.step.3': 'Přetáhněte zastávku na kartu jiného dne a přesune se tam; ze starého dne zmizí.',
  'help.guide.reorder-stops.step.4':
    'Zastávka s pevným časem se zeptá Odebrat čas?, když by přesun narušil pořadí dne, protože o jejím místě rozhodl čas: Potvrdit čas zahodí a pustí ji kamkoli.',
  'help.guide.reorder-stops.result': 'Trasa a časy jízdy nové pořadí hned převezmou.',
  'help.guide.reorder-stops.tip.1': 'Rezervace s pevným časem nelze přeuspořádat; sedí tam, kam je jejich čas dá.',
  'help.guide.reorder-stops.tip.2':
    'Optimalizovat v liště trasy seřadí celý den podle nejkratší cesty; zastávku, která má zůstat na svém, nejdřív zamkněte.',
  // set-stop-times
  'help.guide.set-stop-times.title': 'Dát zastávce čas',
  'help.guide.set-stop-times.goal': 'Určete, kdy zastávka začíná a končí, aby se den četl jako rozvrh.',
  'help.guide.set-stop-times.step.1':
    'Klikněte na zastávku pravým tlačítkem a zvolte Upravit. Otevřený ze dne má formulář dole Od a Do.',
  'help.guide.set-stop-times.step.2':
    'Zadejte Od a, chcete-li, Do. Časový překryv s: upozorní, že se s ní překrývá jiná zastávka dne, která má čas; Do dřív než Od zablokuje Aktualizovat.',
  'help.guide.set-stop-times.step.3':
    'Klikněte na Aktualizovat. Zastávka dostane časový štítek a přesune se tam, kam její čas ve dni patří.',
  'help.guide.set-stop-times.result':
    'Zastávky s časem si drží své místo v pořadí; zastávky bez času se řadí kolem nich.',
  'help.guide.set-stop-times.tip.1': 'Čas patří zastávce na tom dni; stejné místo může mít na jiném dni jiný čas.',
  'help.guide.set-stop-times.tip.2':
    'Zastávku s časem přesunete ručně přetažením: otázka Odebrat čas? cestou čas zahodí, jakmile kliknete na Potvrdit.',
  'help.guide.set-stop-times.tip.3':
    'Poznámky pro tento den v témže formuláři drží to, co platí jen na tomto dni, rezervovaný stůl, číslo vstupenky.',
  // remove-from-day
  'help.guide.remove-from-day.title': 'Sundat zastávku ze dne',
  'help.guide.remove-from-day.goal': 'Odplánujte místo, aniž byste ho smazali z cesty.',
  'help.guide.remove-from-day.step.1': 'Klikněte na zastávku pravým tlačítkem a zvolte Odebrat ze dne.',
  'help.guide.remove-from-day.step.2':
    'Zastávka je ze dne pryč; místo zůstává ve sloupci míst, pod Nezařazené, pokud není na žádném jiném dni.',
  'help.guide.remove-from-day.result': 'Den, jeho trasa a jeho náklady se přepočítají; šipka zpět zastávku vrátí.',
  'help.guide.remove-from-day.tip.1': 'Smazat ve stejné nabídce odstraní místo z celé cesty, včetně každého dne.',
  'help.guide.remove-from-day.tip.2': 'Odebrat ze dne sedí i v podrobnostech místa, vedle Přidat ke dni.',
  // lock-stop
  'help.guide.lock-stop.title': 'Zamknout zastávku na místě',
  'help.guide.lock-stop.goal': 'Nechte zastávku tam, kde je, když se trasa optimalizuje.',
  'help.guide.lock-stop.step.1':
    'Najeďte na obrázek zastávky a klikněte na zámek: Zachovat pozici při optimalizaci trasy.',
  'help.guide.lock-stop.step.2':
    'Optimalizovat teď seřadí ostatní zastávky kolem ní; dalším kliknutím na zámek (Klikněte pro odemčení) ji uvolníte.',
  'help.guide.lock-stop.result': 'Zámek je vidět na obrázku; zastávka si drží svou pozici, dokud ji neodemknete.',
  'help.guide.lock-stop.tip.1': 'Zastávku s pevným časem zamyká její čas; při optimalizaci se nikdy nehne.',
  'help.guide.lock-stop.tip.2':
    'Zámek platí pro tuto návštěvu: po načtení stránky je každá zastávka zase volná, pevné zůstanou jen zastávky s časem.',
  // day-note
  'help.guide.day-note.title': 'Přidat ke dni poznámku',
  'help.guide.day-note.goal': 'Mějte připomínku, číslo vstupenky nebo plán B rovnou ve dni.',
  'help.guide.day-note.step.1': 'Klikněte v záhlaví dne na Přidat poznámku.',
  'help.guide.day-note.step.2':
    'Pojmenujte ji v poli Poznámka, to karta dne ukáže, a zbytek napište pod Poznámka ke dni. Lišta nad textem ho formátuje (Tučné, seznamy, odkazy, citace) a Náhled vlevo ukáže kartu, která z něj vznikne.',
  'help.guide.day-note.step.3':
    'Vyberte Ikonu a Barvu, aby se poznámka od zastávek odlišila, a pak klikněte na Přidat.',
  'help.guide.day-note.step.4':
    'Poznámka sedí ve dni jako zastávka: přetažením ji dáte na místo, pravým tlačítkem dostanete Upravit a Smazat.',
  'help.guide.day-note.result': 'Poznámka je součástí dne, i v PDF; poznámka s časem se řadí mezi zastávky s časem.',
  'help.guide.day-note.tip.1':
    'Poznámka s časem může zastoupit dopravu, na kterou nemáte rezervaci: „08:15 S3 z hlavního nádraží“.',
  'help.guide.day-note.tip.2': 'Poznámky jsou na den; poznámka pro celou cestu patří do Spolupráce.',
  // day-route
  'help.guide.day-route.title': 'Ukázat a optimalizovat trasu dne',
  'help.guide.day-route.goal':
    'Podívejte se na cestu mezi zastávkami, vyberte, jak cestujete, a nechte TREK seřadit pořadí.',
  'help.guide.day-route.step.1':
    'Otevřete den a klikněte v liště trasy na Trasa: cesta mezi zastávkami se vykreslí na mapě a spojnice mezi zastávkami ukážou čas a vzdálenost každého úseku.',
  'help.guide.day-route.step.2':
    'Autem a Pěšky vedle toho nastaví způsob dopravy dne; úseky se přepočítají. Pluginy mohou přidat vlastní způsoby.',
  'help.guide.day-route.step.3':
    'Kliknutím na spojnici změníte způsob toho jednoho úseku: vyberte způsob, nebo Použít výchozí dne, aby se vrátil k dennímu.',
  'help.guide.day-route.step.4':
    'Optimalizovat přeuspořádá zastávky podle nejkratší cesty. Zastávky se zámkem nebo s pevným časem si své místo drží; když je na dni ubytování, trasa začíná tam.',
  'help.guide.day-route.step.5':
    'Otevřít v Google Mapách nebo Otevřít v CoMaps otevře celý den jako trasu v té aplikaci, pro navigaci na cestě.',
  'help.guide.day-route.result': 'Den je trasa s časy; Celkové náklady a úseky se s pořadím mění.',
  'help.guide.day-route.tip.1':
    'Trasy počítá ve výchozím stavu OSRM; správce může TREK nasměrovat na jiný směrovací engine pod Výchozí nastavení uživatele.',
  'help.guide.day-route.tip.2':
    'Úsek, který nešlo spočítat, čas neukáže; zkontrolujte, že obě zastávky mají souřadnice.',
  'help.guide.day-route.tip.3': 'Šipka zpět optimalizaci vrátí.',
  // manage-days
  'help.guide.manage-days.title': 'Přidávat, přeuspořádat a přejmenovat dny',
  'help.guide.manage-days.goal': 'Utvářejte samotné dny, nejen to, co na nich je.',
  'help.guide.manage-days.step.1':
    'Dny pocházejí z dat cesty; změňte data na kartě cesty pod Přehled a dny na koncích přibydou nebo ubydou. Než odpadne den s obsahem, seznam ukáže, které dny odejdou a co na nich je.',
  'help.guide.manage-days.step.2':
    'Změnit pořadí dnů v liště nástrojů otevře seznam: Posunout nahoru a Posunout dolů posunou den se vším, co na něm je, a Smazat den, koš vedle nich, ho odstraní. Pod seznamem tlačítko s dalším datem přidá den hned za poslední den s datem a prodlouží cestu o den; Bez data připojí na konec den bez data.',
  'help.guide.manage-days.step.3':
    'Smazat den se nejdřív zeptá: seznam ukáže, co s dnem odejde, jeho místa, poznámky a rezervace, ubytování s příjezdem nebo odjezdem v ten den a dny, které se posunou o datum dopředu. Smazat den ho odstraní, Zrušit ho ponechá; poslední den smazat nelze.',
  'help.guide.manage-days.step.4':
    'Den přejmenujete tak, že ho otevřete a kliknete na tužku vedle jeho názvu v podrobnostech nad mapou; název nahradí Den 1 na kartě i v PDF.',
  'help.guide.manage-days.step.5':
    'Expand all days a Collapse all days v liště nástrojů složí všechny karty najednou; jedna karta se složí svou šipkou.',
  'help.guide.manage-days.result':
    'Data zůstávají u pozice: den posunutý nahoru dostane dřívější datum a jeho zastávky, poznámky a rezervace cestují s ním.',
  'help.guide.manage-days.tip.1': 'Přesouvání dnů jde z lišty nástrojů vrátit, smazání dne ne.',
  'help.guide.manage-days.tip.2': 'Náklady v záhlaví dne sečtou zastávky a rezervace toho dne, které nesou cenu.',
  // bookings-in-plan
  'help.guide.bookings-in-plan.title': 'Přečíst rezervace a dopravu v plánu',
  'help.guide.bookings-in-plan.goal':
    'Poznejte, kde se rezervace ukáže, jakmile existuje, a která obrazovka ji zakládá.',
  'help.guide.bookings-in-plan.step.1':
    'Doprava (Let, Vlak, Trajekt, Autobus, Auto) se ukáže ve dni odjezdu jako Odlet a ve dni příjezdu jako Přílet, s časem a trasou; vícedenní se táhne přes dny mezi tím.',
  'help.guide.bookings-in-plan.step.2':
    'Rezervace navázaná na zastávku (Restaurace, Prohlídka) označí tu zastávku Rezervace potvrzena nebo Rezervace čeká; rezervace, která má den, ale ne zastávku, má ve dni vlastní řádek.',
  'help.guide.bookings-in-plan.step.3':
    'Noc v hotelu je ubytování: sedí v podrobnostech dne pod Ubytování, od Check-in po Check-out, a trasa každého z těch dnů tam začíná.',
  'help.guide.bookings-in-plan.step.4':
    'Na mapě vykreslí přepínač na řádku dopravy její trasu; Zobrazit všechny trasy rezervací v liště nástrojů vykreslí všechny.',
  'help.guide.bookings-in-plan.step.5':
    'Zakládání: Přidat rezervaci na zastávce pod kurzorem, Přidat dopravu a Veřejná doprava v záhlaví dne a karty Rezervace a Doprava pro celý seznam s importem a soubory.',
  'help.guide.bookings-in-plan.result':
    'Jedna rezervace, jedno místo v plánu; karty jsou ty samé rezervace jako seznam.',
  'help.guide.bookings-in-plan.tip.1':
    'Potvrzeno a Čeká na potvrzení je stav, který rezervaci nastavíte; plán ho ukazuje na zastávce, karta Rezervace počítá obojí.',
  'help.guide.bookings-in-plan.tip.2': 'Dopravu s pevným časem nelze táhnout; změňte místo toho její čas v rezervaci.',
  // export-plan
  'help.guide.export-plan.title': 'Exportovat plán',
  'help.guide.export-plan.goal': 'Vezměte si plán s sebou jako dokument, do kalendáře nebo do GPS.',
  'help.guide.export-plan.step.1': 'Klikněte na Exportovat v liště nástrojů nad dny.',
  'help.guide.export-plan.step.2':
    'Dokument: PDF otevře tiskový náhled každého dne s jeho zastávkami, poznámkami a rezervacemi; Zalomení stránky pro každý den začne každý den na nové stránce, Uložit jako PDF ho stáhne.',
  'help.guide.export-plan.step.3':
    'Kalendář: Stáhnout .ics uloží rezervace jako soubor kalendáře; Přihlásit se k odběru kalendáře dá odkaz, který si vaše kalendářová aplikace obnovuje sama.',
  'help.guide.export-plan.step.4':
    'Mapy a GPS · GPX: Celá cesta vyexportuje místa, denní trasy a stopy; Jen místa jen špendlíky; Dny jako trasy jednu trasu na den, pro offline mapy a zařízení GPS.',
  'help.guide.export-plan.result': 'Soubor se stáhne; na cestě se nic nezmění.',
  'help.guide.export-plan.tip.1':
    'Jeden den odejde do mapové aplikace ze své lišty trasy: Otevřít v Google Mapách nebo Otevřít v CoMaps.',
  'help.guide.export-plan.tip.2':
    'Přihlásit se k odběru kalendáře potřebuje zapnuté odebírání kalendáře ve vašem nastavení; Přehled na to má návod.',
  'help.guide.export-plan.tip.3': 'Exportovat znamená číst: může to každý člen cesty.',

  // ── Screen: trip-place ────────────────────────────────────────────────────────────────
  'help.ctx.trip-place.title': 'Podrobnosti místa',
  'help.ctx.trip-place.summary':
    'Karta, která se otevře přes mapu, když vyberete místo: všechno, co o něm cesta ví, hvězdy, které mu všichni dali, jeho obrázek a jeho soubory, a tlačítka, která ho položí na otevřený den, do seznamu nebo do mapové aplikace.',
  'help.ctx.trip-place.bullet.1':
    'Klikněte na řádek ve sloupci míst, na zastávku uvnitř dne nebo na značku na mapě a karta se otevře přes mapu. Výběr uvnitř dne kartě řekne, kterou zastávku myslíte, a právě to s sebou přinese účastníky zastávky a její rezervaci.',
  'help.ctx.trip-place.bullet.2':
    'Hlavička nese kulatý obrázek, název, kategorii, adresu a souřadnice. Kliknutím na obrázek použijete vlastní, dvojklikem na název místo na místě přejmenujete a X vpravo kartu zavře.',
  'help.ctx.trip-place.bullet.3':
    'Pod tím: cena, pokud ji má, hvězdy, které místu dal každý cestující, popis a poznámky, a Poznámky pro tento den, když je zastávka nese.',
  'help.ctx.trip-place.bullet.4':
    'Následují Otevírací doba, Barva trasy, Data trasy a Soubory, pokud se na místo hodí. Soubory berou cokoli z vašich složek a vypisují také to, co visí na rezervaci této zastávky.',
  'help.ctx.trip-place.bullet.5':
    'Řádek dole: Přidat ke dni nebo Odebrat ze dne, dokud je otevřený den, pak Uložit do sbírky, Navigace, Otevřít webové stránky, Upravit a Smazat.',
  'help.ctx.trip-place.bullet.6':
    'Místo vybrané z hledání nese to, co o něm ví index TREKu nebo OpenStreetMap: zelený prstenec Otevřeno nebo červený Zavřeno kolem obrázku, posouzený podle hodin samotného místa, telefonní číslo pod hvězdami, Otevírací doba níže s hodinami toho dne na řádku a celým týdnem za kliknutím, a jeho web za Otevřít webové stránky. Hodnocení od Googlu se ukáže jen u místa nalezeného přes Google, na TREKu s klíčem Google.',
  // read-place
  'help.guide.read-place.title': 'Co vám karta o místě řekne',
  'help.guide.read-place.goal': 'Přečtěte si vše, co cesta o jednom místě ví, v jediné kartě.',
  'help.guide.read-place.step.1':
    'Klikněte ve sloupci dnů na zastávku, kterou si chcete přečíst. Karta se otevře přes mapu a zastávka zůstane ve svém dni zvýrazněná.',
  'help.guide.read-place.step.2':
    'Hlavička: kulatý obrázek, název, adresa a přesné souřadnice. Zelený prstenec s Otevřeno nebo červený se Zavřeno kolem obrázku říká, zda má místo právě teď otevřeno, podle jeho vlastních hodin, jakmile TREK zná jeho otevírací dobu. X vpravo kartu zase zavře.',
  'help.guide.read-place.step.3':
    'Pod tím hvězdy, které místu dal každý cestující, s průměrem a počtem hlasů. Zatím bez hodnocení, dokud nehlasoval nikdo. Hned pod tím telefonní číslo tam, kde ho místo má: kliknutím na něj číslo předáte své telefonní aplikaci.',
  'help.guide.read-place.step.4':
    'Pak popis a pod ním poznámky. Obojí je text z formuláře místa, vykreslený: seznamy, odkazy i tučné písmo fungují.',
  'help.guide.read-place.step.5':
    'Účastníci říkají, kdo na tuto zastávku jde. Dokud někoho neodeberete, jsou uvnitř všichni.',
  'help.guide.read-place.step.6':
    'Otevírací doba, níže: řádek nese hodiny dne, na který se díváte, a kliknutí na něj rozbalí celý týden s tím dnem tučně. Vedle stojí Soubory.',
  'help.guide.read-place.result':
    'Karta zůstane otevřená, dokud ji nezavřete křížkem nebo nevyberete jiné místo, hodiny týdne zůstanou rozbalené a zastávka, ke které patří, zůstane ve sloupci dnů zvýrazněná.',
  'help.guide.read-place.tip.1':
    'Vybraná ze sloupce míst zná karta místo, ale ne zastávku, takže neukáže žádné účastníky ani rezervaci. Vyberte raději zastávku uvnitř dne a obojí tam je.',
  'help.guide.read-place.tip.2':
    'Dvojklikem na název místo přejmenujete bez otevírání formuláře. Enter uloží, Escape změnu zahodí.',
  'help.guide.read-place.tip.3':
    'Místo zadané ručně nic z toho neukáže: karta zná jen to, co má jeho formulář. Otevřete ho tlačítkem Upravit, vyberte ho z návrhů pod Hledat místa... a klikněte na Aktualizovat, a otevírací doba, telefonní číslo i web přijdou s ním. Hodnocení od Googlu potřebuje klíč Google.',
  // rate-place
  'help.guide.rate-place.title': 'Ohodnotit místo',
  'help.guide.rate-place.goal': 'Dejte místu vlastní hvězdy a podívejte se, co mu dali ostatní.',
  'help.guide.rate-place.step.1':
    'Otevřete místo. Řádek s hvězdami sedí hned pod hlavičkou a nese průměr dosavadních hlasů, s jejich počtem v závorce.',
  'help.guide.rate-place.step.2':
    'Klikněte na hvězdu, kterou myslíte. Hvězdy se plní, jak po nich přejíždíte, takže vidíte, co se chystáte dát.',
  'help.guide.rate-place.step.3':
    'Váš hlas se do průměru započítá hned a tváře vedle něj jsou ti, kdo hlasovali. Podržte ukazatel na řádku a uvidíte hvězdy všech.',
  'help.guide.rate-place.step.4':
    'Stejný průměr sedí na řádku místa ve sloupci míst, takže ta dobrá v seznamu vyniknou.',
  'help.guide.rate-place.result':
    'Vaše hvězdy jsou na místě k vidění pro celou cestu a hvězda Filtrovat podle hodnocení v řádku filtrů nad seznamem teď umí nechat jen místa, která dosáhnou na spodní hranici.',
  'help.guide.rate-place.tip.1':
    'Hodnotit smí každý cestující, i na cestě, kde právo Přidat / upravit / smazat místa má jen část z vás.',
  'help.guide.rate-place.tip.2':
    'Kliknutím na hvězdu, kterou jste už dali, hlas vezmete zpět. Když nezbude nikdo, kdo hlasoval, místo zase hlásí Zatím bez hodnocení.',
  'help.guide.rate-place.tip.3':
    'Vedle hvězd se jako tváře vejde až šest hlasujících; bublina vyjmenuje všechny a ten váš označí.',
  // place-image
  'help.guide.place-image.title': 'Dát místu vlastní obrázek',
  'help.guide.place-image.goal': 'Nahraďte automatický náhled vlastní fotkou.',
  'help.guide.place-image.step.1': 'Otevřete místo ze sloupce míst.',
  'help.guide.place-image.step.2':
    'Podržte ukazatel na kulatém obrázku v hlavičce: objeví se fotoaparát a bublina hlásí Nahrát obrázek. Klikněte na něj a vyberte svůj soubor.',
  'help.guide.place-image.step.3': 'Hlavička teď ukazuje váš obrázek, s malým červeným křížkem v rohu.',
  'help.guide.place-image.step.4': 'Stejný obrázek je na řádku místa ve sloupci míst a na jeho značce na mapě.',
  'help.guide.place-image.result':
    'Váš obrázek je obrázkem místa všude: na kartě, ve sloupci míst, na zastávce ve dni, na značce na mapě i ve sdílené cestě.',
  'help.guide.place-image.tip.1': 'Bere JPG, PNG, GIF a WebP, a HEIC z iPhonu se cestou dovnitř převede.',
  'help.guide.place-image.tip.2':
    'Křížek v rohu váš obrázek zase odebere a vrátí se ten automatický. Samotného místa se to nedotkne.',
  'help.guide.place-image.tip.3':
    'Bez vlastního obrázku si TREK nějaký vyhledá podle souřadnic místa a jinak sáhne po ikoně kategorie.',
  // place-day-assign
  'help.guide.place-day-assign.title': 'Položit místo na otevřený den, nebo ho sundat',
  'help.guide.place-day-assign.goal': 'Použijte vlastní tlačítko karty místo přetahování řádku přes plánovač.',
  'help.guide.place-day-assign.step.1':
    'Klikněte ve sloupci dnů na záhlaví dne. Ten den je teď otevřený a karta se vztahuje k němu.',
  'help.guide.place-day-assign.step.2':
    'Klikněte ve sloupci míst na místo, které na tom dni není. Jeho karta se otevře a řádek dole nabídne Přidat ke dni.',
  'help.guide.place-day-assign.step.3':
    'Klikněte na Přidat ke dni. Zastávka přistane na konci dne a tlačítko se změní na Odebrat ze dne.',
  'help.guide.place-day-assign.step.4':
    'Zastávka je teď ve dni, poslední v seznamu. Přetáhněte ji nahoru tam, kam patří.',
  'help.guide.place-day-assign.step.5':
    'Odebrat ze dne tu zastávku ze dne zase sundá a karta znovu nabídne Přidat ke dni.',
  'help.guide.place-day-assign.result':
    'Den zastávku nese, nebo už ji nenese, a samotného místa se to tak i tak nedotkne.',
  'help.guide.place-day-assign.tip.1':
    'Tlačítko existuje jen tehdy, když je otevřený den. Bez něj nemá karta místo kam přidat.',
  'help.guide.place-day-assign.tip.2':
    'Sundání zastávky ze dne nechá místo v cestě i ve sloupci míst. Odevšad ho odstraní až Smazat.',
  'help.guide.place-day-assign.tip.3':
    'Zastávka, kterou na den položila rezervace ubytování, nenabízí ani jedno tlačítko: ta noc se přidává a odebírá v bloku Ubytování toho dne.',
  // place-participants
  'help.guide.place-participants.title': 'Říct, kdo jde na tuto zastávku',
  'help.guide.place-participants.goal': 'Rozdělte skupinu na jednu zastávku, aniž byste dělili cestu.',
  'help.guide.place-participants.step.1':
    'Klikněte na zastávku uvnitř dne. Karta se otevře a Účastníci vypíší všechny v cestě.',
  'help.guide.place-participants.step.2':
    'Kliknutím na štítek cestujícího ho z této zastávky odeberete. Jméno se při najetí ukazatelem přeškrtne.',
  'help.guide.place-participants.step.3':
    'Jakmile někdo chybí, objeví se čárkované +. Kliknutím na ně uvidíte, kdo na zastávce není.',
  'help.guide.place-participants.step.4':
    'Kliknutím na jméno ho vrátíte zpět. Když jsou všichni zase uvnitř, patří zastávka opět celé skupině.',
  'help.guide.place-participants.result':
    'Zastávka nese cestující, které jste vybrali, a zbytek skupiny má to odpoledne pro sebe.',
  'help.guide.place-participants.tip.1':
    'Účastníci se objeví jen s vybranou zastávkou, takže vyberte místo uvnitř dne, ne ve sloupci míst, a jen na cestě s více než jedním cestujícím.',
  'help.guide.place-participants.tip.2':
    'Nikdo vybraný znamená, že jdou všichni, a proto posledního cestujícího, který na zastávce zbyl, nelze odebrat.',
  'help.guide.place-participants.tip.3': 'Host, který nemá vlastní účet, může být účastníkem jako kdokoli jiný.',
  // place-booking
  'help.guide.place-booking.title': 'Rezervace na zastávce',
  'help.guide.place-booking.goal': 'Přečtěte si rezervaci, která patří k zastávce, otevřete ji a připněte k ní novou.',
  'help.guide.place-booking.step.1':
    'Otevřete zastávku, ke které rezervace patří. Karta ukáže proužek s Potvrzeno nebo Čeká na potvrzení a s názvem rezervace.',
  'help.guide.place-booking.step.2':
    'Proužek nese Datum, Čas a Rezervační kód, a jakékoli poznámky, které rezervace má.',
  'help.guide.place-booking.step.3': 'Klikněte na proužek. Otevře se na něm vlastní formulář rezervace.',
  'help.guide.place-booking.step.4':
    'Rezervaci k zastávce připíná Propojit s přiřazením dne a tady už tuhle zastávku jmenuje. Formulář zase zavřete.',
  'help.guide.place-booking.step.5':
    'Nová rezervace pro zastávku začíná ve sloupci dnů: najeďte na zastávku a klikněte na + na jejím konci. Formulář se otevře jako Nová rezervace, už s ní propojený.',
  'help.guide.place-booking.result':
    'Rezervace visí na zastávce: je na kartě, je ve dni a její soubory jsou vypsané i tady pod Soubory.',
  'help.guide.place-booking.tip.1':
    'Proužek se ukáže jen u zastávky, ke které je rezervace připnutá. Rezervace bez zastávky žije na kartě Rezervace.',
  'help.guide.place-booking.tip.2':
    'Jednu zastávku může sdílet několik rezervací: oběd a prohlídka, která vychází ze stejných dveří.',
  'help.guide.place-booking.tip.3':
    'Vlak, let nebo trajekt otevřou místo toho formulář dopravy, ten, který používá karta Doprava.',
  // place-files
  'help.guide.place-files.title': 'Držet vstupenky místa u místa',
  'help.guide.place-files.goal': 'Dejte vstupenku, voucher nebo mapu k místu tam, kde je budete hledat.',
  'help.guide.place-files.step.1':
    'Otevřete místo. Soubory sedí na patě karty a dokud místo žádné nemá, hlásí Soubory.',
  'help.guide.place-files.step.2': 'Klikněte vedle na Nahrát a vyberte soubor.',
  'help.guide.place-files.step.3': 'Tlačítko počítá, co místo drží, a seznam se otevře sám.',
  'help.guide.place-files.step.4': 'Každý řádek je název souboru s jeho velikostí. Kliknutím soubor otevřete.',
  'help.guide.place-files.result': 'Soubor sedí na místě, započítaný v kartě, a je také na kartě Soubory celé cesty.',
  'help.guide.place-files.tip.1':
    'Soubory vypisují také to, co visí na rezervaci této zastávky, takže potvrzení hotelu se ukáže u hotelu.',
  'help.guide.place-files.tip.2': 'Nahrát bere několik souborů naráz.',
  'help.guide.place-files.tip.3':
    'Bez práva Nahrát soubory tlačítko Nahrát není; soubory, které na místě už jsou, tam zůstávají.',
  // place-navigation
  'help.guide.place-navigation.title': 'Otevřít místo v mapové aplikaci nebo na jeho webu',
  'help.guide.place-navigation.goal': 'Předejte místo aplikaci, která vás tam opravdu dovede.',
  'help.guide.place-navigation.step.1': 'Otevřete místo a klikněte v řádku dole na Navigace.',
  'help.guide.place-navigation.step.2':
    'Seznam jsou mapové aplikace, které se k tomuto místu hodí: Google Maps, Waze, Apple Maps, OpenStreetMap a CoMaps.',
  'help.guide.place-navigation.step.3':
    'Klikněte na tu, kterou používáte. TREK jí kde může předá samotné místo, ne jen dvojici souřadnic, takže přistanete u správného vchodu.',
  'help.guide.place-navigation.step.4':
    'Otevřít webové stránky vedle otevře na nové kartě vlastní stránku místa, jeho časy a jeho vstupenky.',
  'help.guide.place-navigation.result':
    'Mapová aplikace se otevře na místě, web ve vlastní kartě, a v cestě se nezmění nic.',
  'help.guide.place-navigation.tip.1':
    'Waze začne navigovat hned. Ostatní místo otevřou a spuštění odtud je jedno klepnutí navíc.',
  'help.guide.place-navigation.tip.2':
    'Které aplikace se nabídnou, závisí na místě a na vašem zařízení: Apple Maps na Androidu chybí, 高德地图 přijde na řadu jen u místa v Číně a Waze, Apple Maps a CoMaps potřebují souřadnice místa.',
  'help.guide.place-navigation.tip.3': 'Když se hodí jen jedna aplikace, tlačítko nese její název a otevře ji rovnou.',
  // place-to-collection
  'help.guide.place-to-collection.title': 'Uložit místo do jednoho ze svých seznamů',
  'help.guide.place-to-collection.goal': 'Nechte si místo, které jste našli na této cestě, pro tu příští.',
  'help.guide.place-to-collection.step.1': 'Otevřete místo a klikněte dole na kartě na Uložit do sbírky.',
  'help.guide.place-to-collection.step.2':
    'Uložit do seznamu ukáže každý seznam, který vlastníte nebo sdílíte. Zaškrtnutí označuje ty, které toto místo už drží.',
  'help.guide.place-to-collection.step.3': 'Klikněte na seznam. Místo je v něm hned.',
  'help.guide.place-to-collection.step.4': 'Zavřete a tlačítko v kartě hlásí Uloženo.',
  'help.guide.place-to-collection.result':
    'Místo je ve vašem seznamu se svým obrázkem, svými poznámkami a svou adresou, připravené na příští cestu.',
  'help.guide.place-to-collection.tip.1':
    'Tlačítko tam je jen tehdy, když je zapnutý doplněk Sbírky, který správce zapíná pod Doplňky.',
  'help.guide.place-to-collection.tip.2':
    'Místo může sedět v několika seznamech naráz, v každém s vlastním stavem: v jednom Nápad, v druhém Navštíveno.',
  'help.guide.place-to-collection.tip.3':
    'Označit jako navštívené vedle názvu místa ve výběru ho v seznamu odškrtne; když je místo ve více vašich seznamech, štítek hlásí Navštíveno všude a odbaví je všechny naráz.',
  // place-track
  'help.guide.place-track.title': 'Přečíst trasu a dát jí vlastní barvu',
  'help.guide.place-track.goal':
    'Podívejte se, jak dlouhá je importovaná trasa, a odlište její čáru od ostatních na mapě.',
  'help.guide.place-track.step.1':
    'Řádek trasy ve sloupci míst nese krátkou čárku v barvě, kterou je její čára vykreslená. Klikněte na něj.',
  'help.guide.place-track.step.2': 'Data trasy udávají délku cesty, v jednotkách vzdálenosti, které jste nastavili.',
  'help.guide.place-track.step.3':
    'Barva trasy nad tím ukazuje barvu, která je v užívání. Kliknutím na řádek otevřete vzorník.',
  'help.guide.place-track.step.4': 'Vyberte barvu. Čára na mapě i čárka na řádku se s ní změní.',
  'help.guide.place-track.step.5':
    'Čárkované políčko vlevo, Automatická barva, vrátí trase barvu, kterou dědí; pipeta vpravo, Vybrat vlastní barvu, otevře pro cokoli jiného výběr barev vašeho systému.',
  'help.guide.place-track.result':
    'Trasa je vykreslená v barvě, kterou jste vybrali, v kartě, na svém řádku ve sloupci míst i na mapě.',
  'help.guide.place-track.tip.1':
    'Tyto dva bloky má jen místo, které nese cestu, importovanou ze souboru GPX, KML nebo KMZ.',
  'help.guide.place-track.tip.2':
    'Trasa zaznamenaná s výškami ukáže i svůj nejvyšší a nejnižší bod, metry nahoru a dolů, a profil cesty.',
  'help.guide.place-track.tip.3':
    'Import dá každé trase, kterou přinese, vlastní barvu, takže dvě trasy nikdy nepřijdou ve stejné.',
  // read-place
  'help.guide.read-place.step.7':
    'Řádek dole je to, co odsud můžete udělat: sundat místo z otevřeného dne nebo ho na něj položit, uložit ho do seznamu, otevřít ho v mapové aplikaci, upravit ho nebo smazat.',

  // ── Screen: trip-files ────────────────────────────────────────────────────────────────
  'help.ctx.trip-files.title': 'Soubory',
  'help.ctx.trip-files.summary':
    'Každý dokument cesty v jednom seznamu: jízdenky, potvrzení, karty do peněženky a obrázky, každý s poznámkou, s propojením na místo nebo rezervaci, ke které patří, a s košem, ze kterého se dá vrátit zpět.',
  'help.ctx.trip-files.bullet.1':
    'Přetáhněte soubory sem nahoře soubory převezme; kliknutím na pole se otevře výběr souborů. Řádek pod ním vypisuje typy souborů, které tento TREK přijímá, a limit 50 MB na soubor.',
  'help.ctx.trip-files.bullet.2':
    'Karty říkají, co seznam ukazuje: Vše, PDF, Obrázky a Dokumenty, každá se svým počtem. Hvězda se k nim přidá, jakmile je nějaký soubor označený hvězdičkou, Poznámky spolupráce, jakmile nějaká poznámka nese přílohu.',
  'help.ctx.trip-files.bullet.3':
    'Řádek nese, kdo soubor nahrál, název, poznámku pod ním, velikost a datum, a jeden odznak na každé propojení: Denní plán a místo, Rezervace nebo Doprava a rezervaci, Z poznámek spolupráce.',
  'help.ctx.trip-files.bullet.4':
    'Na konci řádku sedí Označit hvězdičkou, Přiřadit, Otevřít, Stáhnout a Smazat. Smazat se neptá: soubor jde do koše, odkud se dá vrátit.',
  'help.ctx.trip-files.bullet.5':
    'Obrázek nebo video se otevře na celou obrazovku, se šipkami na klávesnici a pruhem náhledů; každý jiný dokument se otevře v náhledu přes stránku, s Otevřít v nové kartě a Stáhnout. Karta do peněženky se stáhne rovnou.',
  'help.ctx.trip-files.bullet.6':
    'Koš na pravém konci přepne seznam na smazané soubory, kde se každý obnoví nebo smaže natrvalo a Vysypat koš je smaže všechny. Tam, kde správce připojil úložiště dokumentů, sedí vedle něj Synchronizace dokumentů.',
  // files-upload
  'help.guide.files-upload.title': 'Vložit dokument do cesty',
  'help.guide.files-upload.goal':
    'Dostaňte jízdenku, potvrzení nebo fotku ze složky stažených souborů do cesty, kde se k nim dostanou všichni, kdo v ní jsou.',
  'help.guide.files-upload.step.1':
    'Otevřete cestu a klikněte v liště karet na Soubory. Jsou tam vypsané dokumenty cesty a nad nimi pole pro nahrání.',
  'help.guide.files-upload.step.2':
    'Klikněte na Přetáhněte soubory sem a vyberte jeden nebo několik souborů. Nahrávají se jeden po druhém a pole mezitím hlásí Nahrávání... Řádek pod polem říká, které typy tento TREK bere a že soubor smí mít nejvýš 50 MB.',
  'help.guide.files-upload.step.3':
    'Jakmile je poslední soubor nahoře, samo se pro něj otevře Přiřadit soubor. Přidat poznámku... dá souboru vlastní řádek a seznamy pod ním ho svážou s místem nebo rezervací. Zavřete ho ×; zavřením se nic neztratí.',
  'help.guide.files-upload.step.4':
    'Nové soubory stojí nahoře v seznamu. Řádek ukazuje, kdo soubor nahrál, název, velikost a datum; obrázek dostane náhled, každý jiný soubor svůj typ.',
  'help.guide.files-upload.result': 'Dokumenty jsou v cestě a každý, kdo cestu vidí, je může otevřít a stáhnout.',
  'help.guide.files-upload.tip.1':
    'Soubor se dá také přetáhnout z plochy rovnou na pole, které se rozsvítí, dokud je soubor nad ním.',
  'help.guide.files-upload.tip.2':
    'Obrázek ve schránce jde do seznamu přes Ctrl+V, takže snímek obrazovky s rezervací není nutné nejdřív ukládat.',
  'help.guide.files-upload.tip.3':
    'Nahrávání vyžaduje právo Nahrát soubory; bez něj tam pole vůbec není. Typ, který není na seznamu, je odmítnut se zprávou a nic se nenahraje. Soubor nad 50 MB zahodí samo pole, ještě než se cokoli odešle.',
  // files-link
  'help.guide.files-link.title': 'Svázat dokument s místem nebo rezervací',
  'help.guide.files-link.goal': 'Ať je jízdenka k nalezení ze dne, ke kterému patří, ne jen z tohoto seznamu.',
  'help.guide.files-link.step.1':
    'Klikněte na Přiřadit, tužku na konci řádku. Otevře se Přiřadit soubor, pojmenované podle souboru.',
  'help.guide.files-link.step.2':
    'Pod Poznámka bere Přidat poznámku... jeden řádek, který pak stojí pod názvem souboru v seznamu. Uloží se ve chvíli, kdy pole opustíte.',
  'help.guide.files-link.step.3':
    'Pod Místo stojí místa cesty, seskupená podle dne, na kterém jsou, a na konci Nepřiřazeno pro ta, která nejsou na žádném dni. Klikněte na jedno a dostane zaškrtnutí.',
  'help.guide.files-link.step.4':
    'Pod Rezervace a Doprava stojí rezervace cesty. Klikněte na tu, ke které dokument patří; dostane své zaškrtnutí také.',
  'help.guide.files-link.step.5':
    'Zavřete ×. Tlačítko pro uložení tu není: každé kliknutí bylo zapsáno ve chvíli, kdy jste ho udělali.',
  'help.guide.files-link.result':
    'Řádek nese poznámku a jeden odznak na každé propojení, Denní plán a název místa, Doprava a název letu, a dokument visí i na místě a na letu.',
  'help.guide.files-link.tip.1':
    'Soubor může držet několik propojení naráz, takže totéž potvrzení patří hotelu i noci, kterou pokrývá.',
  'help.guide.files-link.tip.2':
    'Dalším kliknutím na zaškrtnutou položku se propojení zase odebere; soubor sám zůstává.',
  'help.guide.files-link.tip.3':
    'Funguje to i obráceně: dokument připojený k místu nebo k rezervaci je i v tomto seznamu, se stejným odznakem na řádku.',
  // files-star
  'help.guide.files-star.title': 'Držet důležité dokumenty nahoře',
  'help.guide.files-star.goal':
    'Vytáhněte ty dva tři papíry, které opravdu budete potřebovat, ze seznamu, který roste po celou cestu.',
  'help.guide.files-star.step.1':
    'Klikněte na Označit hvězdičkou na konci řádku. Vyplní se žlutě, před názvem souboru se objeví druhá hvězdička a tlačítko teď říká Odebrat hvězdičku.',
  'help.guide.files-star.step.2':
    'Seznam se znovu seřadí: soubory s hvězdičkou stojí nad všemi ostatními, uvnitř každé skupiny nejnovější první.',
  'help.guide.files-star.step.3':
    'Ke kartám nahoře se přidala hvězda, s počtem označených souborů za ní. Klikněte na ni a uvidíte jen je.',
  'help.guide.files-star.result':
    'Papíry, které potřebujete u přepážky, stojí nahoře v seznamu a jedna karta neukazuje nic jiného.',
  'help.guide.files-star.tip.1':
    'Karta s hvězdou existuje, jen dokud je něco označené. Odeberte hvězdičku poslednímu souboru a karta zmizí s ním.',
  'help.guide.files-star.tip.2':
    'Označení hvězdičkou se počítá jako úprava: člen, který smí soubory cesty jen číst, hvězdičky vidí, ale nastavit je nemůže.',
  // files-filter
  'help.guide.files-filter.title': 'Najít dokument v seznamu',
  'help.guide.files-filter.goal': 'Zužte seznam všeho na jeden druh papíru, který hledáte.',
  'help.guide.files-filter.step.1':
    'Karty nad seznamem jsou Vše, PDF, Obrázky a Dokumenty, každá s počtem souborů za sebou.',
  'help.guide.files-filter.step.2': 'Klikněte na PDF: seznam si nechá soubory PDF a nic jiného.',
  'help.guide.files-filter.step.3':
    'Další dvě karty přicházejí a odcházejí s tím, co v cestě je. Klikněte na Poznámky spolupráce, která tam je, jakmile nějaká poznámka na kartě Spolupráce nese přílohu: seznam si nechá ty soubory a nic jiného. Stejným způsobem se do řady přidá hvězda, jakmile je nějaký soubor označený.',
  'help.guide.files-filter.step.4': 'Vše vrátí celý seznam zpět.',
  'help.guide.files-filter.result':
    'Seznam ukazuje jen to, co karta pojmenovává, a počet na každé kartě říká, kolik toho je.',
  'help.guide.files-filter.tip.1':
    'Složky tu nejsou a přejmenovat se nedá nic: dokument se třídí podle poznámky v Přiřadit soubor, podle propojení na místa a rezervace a podle hvězdičky.',
  'help.guide.files-filter.tip.2':
    'Seznam sám je vždy nejdřív podle hvězdičky, pak podle nejnovějších, takže dokument nahraný dnes stojí nad dokumentem z minulého měsíce.',
  // files-preview
  'help.guide.files-preview.title': 'Přečíst dokument bez opuštění TREKu',
  'help.guide.files-preview.goal':
    'Podívejte se na jízdenku nebo obrázek na místě a dostaňte je na svůj počítač, když je tam potřebujete.',
  'help.guide.files-preview.step.1':
    'Klikněte na název obrázku nebo na jeho náhled. Otevře se na celou obrazovku, s názvem souboru a jeho pořadím mezi obrázky v záhlaví.',
  'help.guide.files-preview.step.2':
    'Kulaté šipky po stranách, šipky vlevo a vpravo na klávesnici a pruh náhledů dole procházejí každý obrázek, který seznam právě ukazuje.',
  'help.guide.files-preview.step.3':
    'Otevřít v nové kartě a Stáhnout sedí v záhlaví; × nebo Escape obrázek zase zavře.',
  'help.guide.files-preview.step.4':
    'Dokument, který není obrázek, se místo toho otevře v náhledu přes stránku, se stejnými dvěma tlačítky v záhlaví. Ten se zavírá ×, nebo kliknutím vedle něj.',
  'help.guide.files-preview.step.5':
    'Stáhnout na konci řádku uloží soubor rovnou na váš počítač, aniž by se cokoli předtím otevřelo.',
  'help.guide.files-preview.result':
    'Dokument je na obrazovce a tatáž dvě tlačítka ho dají do karty prohlížeče nebo na váš disk.',
  'help.guide.files-preview.tip.1':
    'Na dotykové obrazovce mezi obrázky přejíždíte prstem, místo abyste klikali na šipky.',
  'help.guide.files-preview.tip.2':
    'Karta do peněženky nikdy náhled neotevře: stáhne se hned, aby ji telefon mohl předat aplikaci peněženky.',
  'help.guide.files-preview.tip.3':
    'Otevřít v nové kartě i Stáhnout načítají soubor s vaší relací, takže odkaz zkopírovaný z adresního řádku je nikomu jinému k ničemu.',
  // files-trash
  'help.guide.files-trash.title': 'Zahodit dokument a dostat ho zpět',
  'help.guide.files-trash.goal':
    'Ukliďte, co cesta už nepotřebuje, aniž byste přišli o něco, co jste přece jen potřebovali.',
  'help.guide.files-trash.step.1':
    'Klikněte na Smazat na konci řádku. Soubor hned opustí seznam a zpráva hlásí Přesunuto do koše. Nic se předtím neptá.',
  'help.guide.files-trash.step.2':
    'Koš na pravém konci lišty nástrojů přepne seznam na to, co bylo zahozeno. Nadpis říká Koš a karty filtrů jsou pryč.',
  'help.guide.files-trash.step.3':
    'Zahozený řádek je zašedlý a zbyla mu dvě tlačítka: Obnovit, které soubor vrátí, a Smazat, které ho po otázce odstraní natrvalo.',
  'help.guide.files-trash.step.4':
    'Klikněte na Obnovit. Zpráva hlásí Soubor byl obnoven a řádek opustí koš, i s poznámkou a propojeními.',
  'help.guide.files-trash.step.5':
    'Vysypat koš nahoře natrvalo smaže všechno, co tu ještě je, a prohlížeč se jednou zeptá, než to udělá. Koš přepne zpět na soubory.',
  'help.guide.files-trash.result': 'Soubor je zpátky v seznamu tam, kde byl, jako by se nic nestalo.',
  'help.guide.files-trash.tip.1':
    'Smazat na řádku se předtím neptá a od toho tu koš je: z TREKu nic neodejde, dokud to tady neřeknete.',
  'help.guide.files-trash.tip.2':
    'Zahodit soubor a dostat ho zpět vyžaduje právo Smazat soubory. Člen, který ho nemá, nevidí ani Smazat na řádku, ani tlačítka v koši.',
  'help.guide.files-trash.tip.3': 'Soubor natrvalo smazaný v koši se už vrátit nedá.',
  // files-sync
  'help.guide.files-sync.title': 'Držet dokumenty v souladu s vaším úložištěm dokumentů',
  'help.guide.files-sync.goal':
    'Svažte cestu s vaším vlastním úložištěm dokumentů, aby to, co nahrajete sem, přistálo tam, a co založíte tam, se objevilo tady.',
  'help.guide.files-sync.step.1':
    'Klikněte na Synchronizace dokumentů, vedle Koš na pravém konci lišty nástrojů. Dialog se otevře s názvem cesty pod svým titulkem. Vlevo, pod Připojit poskytovatele, stojí úložiště, která správce zapnul, každé s řádkem o tom, jak ukládá: Paperless-ngx a Papra podle štítků, Nextcloud a Synology Drive do složky, OpenCloud do prostoru. Vpravo stojí Zatím nic nepřipojeno.',
  'help.guide.files-sync.step.2':
    'Klikněte na své úložiště, tady Nextcloud. Otevře se menší dialog pro připojení, pojmenovaný podle úložiště, který se ptá na údaje, kterými se do tohoto úložiště přihlašujete.',
  'help.guide.files-sync.step.3':
    'Vyplňte Adresa a přihlášení samotného úložiště: API token u Paperless-ngx, API klíč a ID organizace u Papra, Uživatelské jméno a Heslo aplikace u Nextcloud, Uživatelské jméno a Token aplikace u OpenCloud a u Synology Drive Uživatelské jméno, Heslo a, pokud o něj účet žádá, Dvoufaktorový kód. Kdekoli úložiště nabízí heslo nebo token aplikace, použijte ho, nikdy ne heslo ke svému účtu. U Nextcloud a Synology Drive je navíc nepovinná Základní složka, místo, kde TREK hledá složky cest, tady /Reisen. Přijmout vlastnoručně podepsaný certifikát dole je jen pro úložiště ve vaší vlastní síti s takovým certifikátem.',
  'help.guide.files-sync.step.4':
    'Klikněte na Otestovat připojení. TREK se s tím, co jste zadali, spojí s úložištěm a v patičce stojí Spojení navázáno, přihlášeno jako a za tím jméno účtu. Odmítnuté přihlašovací údaje nebo nedostupná adresa se tam pojmenují místo toho a ani v jednom případě se nic neuloží.',
  'help.guide.files-sync.step.5':
    'Klikněte na Připojit. Připojení se uloží s cestou a TREK se zeptá, kam v úložišti cestu uložit: štítek, složka nebo prostor, který drží její dokumenty. Synchronizuje se jen to, co je uvnitř. Vytvořit nové jej po kliknutí na Vytvořit založí, s názvem předvyplněným z titulku cesty; pod Nebo použijte existující stojí ty, které tam už jsou. Klikněte na jeden, tady na složku Autumn in Japan.',
  'help.guide.files-sync.step.6':
    'Dialog je zpátky: vaše úložiště stojí vlevo pod Tato cesta a jeho karta vpravo nese, kam se synchronizuje, kdy naposledy běželo, a Synchronizovat teď. První běh se spustí sám; Synchronizovat teď spustí jeden, kdykoli chcete. Jakmile je běh hotový, odznak Zatím nesynchronizováno vedle názvu ustoupí zelené tečce, Aktuální, když na ni najedete, a pruh toku počítá dokumenty, které TREK a úložiště každý drží, s drahami Do úložiště a Z úložiště mezi nimi. Zavřete dialog křížkem ×.',
  'help.guide.files-sync.result':
    'Dokumenty, které tam už byly, stojí nahoře v seznamu, nahrané vaším jménem, a každý dokument cesty je také v úložišti. Od té chvíle TREK úložiště kontroluje na pozadí a úložiště sleduje seznam.',
  'help.guide.files-sync.tip.1':
    'Cestu smí svázat jen její vlastník nebo správce instance, protože přihlašovací údaje dosáhnou na celý ten účet v úložišti. Každý člen může Synchronizace dokumentů otevřít, kartu si přečíst a stisknout Synchronizovat teď.',
  'help.guide.files-sync.tip.2':
    'Úložiště ve vaší vlastní síti potřebuje na serveru TREKu ALLOW_INTERNAL_NETWORK=true a jeho adresa musí být adresa stroje v síti, nikdy localhost. Bez toho Otestovat připojení odpoví Tato adresa není povolena.',
  'help.guide.files-sync.tip.3':
    'Odpojit na kartě ukončí párování a nechá každý dokument na obou stranách. Štítek, složka nebo prostor svázaný podruhé se bere jako nový a všechno v něm přijde znovu, takže po Odpojit svažte raději nějaký prázdný než ten starý.',

  // ── Screen: trip-day-detail ───────────────────────────────────────────────────────────
  'help.ctx.trip-day-detail.title': 'Podrobnosti dne',
  'help.ctx.trip-day-detail.summary':
    'Panel, který záhlaví dne otevře nad mapou: den jako celek, jeho název a datum, počasí tam, kde budete, rezervace, které na něj padnou, a noci na něj rezervované.',
  'help.ctx.trip-day-detail.bullet.1':
    'Klikněte ve sloupci dnů na záhlaví dne a panel se otevře nad středem mapy. Stejné záhlaví znovu, nebo X vpravo od něj, ho zavře a den pustí.',
  'help.ctx.trip-day-detail.bullet.2':
    'Záhlaví nese název dne a jeho datum. Tužka vedle názvu den přejmenuje, dvojitá šipka panel složí do úzkého pruhu, takže je mapa zase volná.',
  'help.ctx.trip-day-detail.bullet.3':
    'Nahoře počasí dne. Předpověď pro pojmenuje místo, kterého se týká: první zastávku dne, nebo hotel, ve kterém se probudíte.',
  'help.ctx.trip-day-detail.bullet.4':
    'Rezervace vypisují rezervace toho dne, každou s jejím druhem, zastávkou, ke které patří, a časy. Zelená znamená potvrzeno, jantarová ještě čeká na potvrzení; je to jen výpis, rezervace se mění na kartě Rezervace.',
  'help.ctx.trip-day-detail.bullet.5':
    'Ubytování ukazuje každou noc rezervovanou přes tento den, s Check-in a Check-out ve dnech, kdy nastanou, s časovým oknem check-inu, časem check-outu a číslem potvrzení.',
  'help.ctx.trip-day-detail.bullet.6':
    'Přidat ubytování rezervuje noc na tomto dni: vyberte objekt z míst cesty, řekněte, které dny pokrývá, a doplňte časy a kód.',
  // day-panel
  'help.guide.day-panel.title': 'Otevřít den a přečíst si jeho podrobnosti',
  'help.guide.day-panel.goal': 'Vidět jeden den celý, jeho počasí, jeho rezervace a kde spíte, bez opuštění mapy.',
  'help.guide.day-panel.step.1':
    'Klikněte ve sloupci dnů na záhlaví dne. Den je vybraný a jeho podrobnosti se otevřou nad středem mapy.',
  'help.guide.day-panel.step.2': 'Záhlaví den pojmenuje, Den 1, dokud mu název nedáte, s datem pod ním.',
  'help.guide.day-panel.step.3':
    'Nahoře počasí dne. Předpověď pro říká, kterého místa se týká: první zastávky dne, nebo hotelu, ve kterém se probudíte.',
  'help.guide.day-panel.step.4': 'Rezervace pod ním vypisují rezervace, které padnou na tento den, s jejich časy.',
  'help.guide.day-panel.step.5':
    'Ubytování ukazuje noci rezervované přes tento den, s Check-in a Check-out ve dnech, kdy nastanou.',
  'help.guide.day-panel.step.6':
    'Dvojitá šipka v záhlaví složí panel do úzkého pruhu. X vedle ní panel zavře a den pustí.',
  'help.guide.day-panel.result':
    'Složený do pruhu nechává panel mapu volnou a den zůstává vybraný; zavřený panel den odznačí a plán je jako předtím.',
  'help.guide.day-panel.tip.1': 'Kliknutí kamkoli na pruh záhlaví panelu ho také složí. Šipka je jen tlačítko pro to.',
  'help.guide.day-panel.tip.2':
    'Otevření místa ze sloupce míst dá podrobnosti místa na místo panelu. Zavřete je a den se vrátí.',
  // day-weather
  'help.guide.day-weather.title': 'Přečíst počasí dne',
  'help.guide.day-weather.goal': 'Vědět, jaký bude den tam, kde ten den opravdu jste.',
  'help.guide.day-weather.step.1':
    'Předpověď pro pojmenuje místo, kterého se čísla týkají: první zastávku dne, nebo, ve dni bez ní, hotel, ve kterém se probudíte.',
  'help.guide.day-weather.step.2': 'Velké číslo je teplota dne, vedle něj minimum a maximum a stav počasí slovy.',
  'help.guide.day-weather.step.3':
    'Štítky pod ním: pravděpodobnost srážek, kolik jich bude, nejsilnější vítr a východ a západ slunce.',
  'help.guide.day-weather.step.4':
    'Dole den hodinu po hodině, každou druhou hodinu: čas, ikona, teplota a pravděpodobnost srážek. Hodina nad 50 procent je podbarvená modře.',
  'help.guide.day-weather.result':
    'Karta dne ve sloupci dnů nese stejné počasí v malém pod svým číslem, takže celou cestu lze přečíst na jeden pohled.',
  'help.guide.day-weather.tip.1':
    'Stupně a vítr se řídí volbou Jednotky teploty pod Zobrazení v Nastavení: zvolte °F Fahrenheit a stejná předpověď se vypíše v °F a mph.',
  'help.guide.day-weather.tip.2':
    'Den bez umístěné zastávky a bez hotelu, ve kterém se probudit, neukáže počasí vůbec: předpověď je vždy pro místo, nikdy pro cestu.',
  'help.guide.day-weather.tip.3':
    'Dál než 16 dnů dopředu žádná předpověď není. Čísla jsou pak průměry dřívějších let pro to datum, označené Ø, a je to pod nimi napsané.',
  // rename-day
  'help.guide.rename-day.title': 'Dát dni název',
  'help.guide.rename-day.goal': 'Pojmenovat den tím, čím je, Příjezd do Kyoto nebo Den odpočinku, místo Den 5.',
  'help.guide.rename-day.step.1': 'Otevřete den. Jeho záhlaví hlásí Den 5, s datem pod ním.',
  'help.guide.rename-day.step.2': 'Klikněte na tužku vedle názvu.',
  'help.guide.rename-day.step.3': 'Název se změní v pole. Napište název, který chcete.',
  'help.guide.rename-day.step.4':
    'Stiskněte Enter, nebo jen klikněte jinam; Escape změnu zahodí. Karta dne ve sloupci dnů nese název také.',
  'help.guide.rename-day.result':
    'Název nahradí Den 5 v panelu i na kartě dne ve sloupci dnů; datum zůstane, kde bylo.',
  'help.guide.rename-day.tip.1':
    'Vymažte pole a uložte a den je zase Den 5: číslo je to, co se ukazuje, když není název.',
  'help.guide.rename-day.tip.2':
    'Název patří dni, ne jeho datu. Přeuspořádejte dny a putuje se vším ostatním na tom dni.',
  // add-accommodation
  'help.guide.add-accommodation.title': 'Rezervovat noc na dni',
  'help.guide.add-accommodation.goal':
    'Dostat hotel do plánu jednou, se dny, které pokrývá, jeho časy a jeho číslem potvrzení.',
  'help.guide.add-accommodation.step.1':
    'Objekt musí být nejprve místem cesty. Vytvořte ho ve sloupci míst jako kterékoli jiné místo: výběr nabízí jen to, co už tam je.',
  'help.guide.add-accommodation.step.2': 'Otevřete den, kdy přijíždíte, a klikněte na Přidat ubytování pod Ubytování.',
  'help.guide.add-accommodation.step.3':
    'Použít na dny říká, které noci pobyt pokrývá: den check-inu vlevo, den check-outu vpravo. Vše pokrývá celou cestu.',
  'help.guide.add-accommodation.step.4':
    'Vyplňte Check-in, Do a Check-out a číslo rezervace dejte pod Potvrzení. Všechna čtyři mohou zůstat prázdná.',
  'help.guide.add-accommodation.step.5': 'Vyberte objekt z míst cesty. Štítky nad seznamem ho zúží na jednu kategorii.',
  'help.guide.add-accommodation.step.6': 'Klikněte na Uložit.',
  'help.guide.add-accommodation.result':
    'Pobyt se ukáže na každém dni, který pokrývá, Check-in na prvním a Check-out na posledním. Objekt se stane zastávkou na dni check-inu, takže mapa nakreslí cestu tam, a na kartě Rezervace se objeví rezervace typu Ubytování.',
  'help.guide.add-accommodation.tip.1':
    'Výběr se otevře na dni, ze kterého jste přišli, s check-outem den poté; obojí lze před uložením posunout.',
  'help.guide.add-accommodation.tip.2':
    'Dejte hotelu při vytváření kategorii cesty Hotel a štítky nad seznamem ho jedním kliknutím zúží na vaše hotely.',
  'help.guide.add-accommodation.tip.3':
    'Časy jsou všechny nepovinné: pobyt bez check-inu a bez kódu stále pokrývá své noci a stále kreslí svou trasu.',
  // edit-accommodation
  'help.guide.edit-accommodation.title': 'Změnit nebo zrušit rezervovanou noc',
  'help.guide.edit-accommodation.goal': 'Přesunout pobyt, opravit jeho časy, nebo ho zase vzít z plánu.',
  'help.guide.edit-accommodation.step.1':
    'Na každém dni pobytu ukazuje karta objekt, okno check-inu, čas check-outu a číslo potvrzení.',
  'help.guide.edit-accommodation.step.2': 'Tužka vpravo od ní pobyt zase otevře. Okno teď hlásí Upravit ubytování.',
  'help.guide.edit-accommodation.step.3':
    'Opravte řádek polí: Check-in, Do, Check-out a Potvrzení. Dny nad ním a objekt pod ním se dají změnit také tady.',
  'help.guide.edit-accommodation.step.4': 'Klikněte na Uložit.',
  'help.guide.edit-accommodation.step.5':
    'X vedle tužky pobyt ukončí. Na nic se neptá a rezervace typu Ubytování, která k němu patří, jde s ním.',
  'help.guide.edit-accommodation.result':
    'Změna dorazí na každý den, který pobyt pokrývá, najednou, a s ní i rezervace typu Ubytování na kartě Rezervace.',
  'help.guide.edit-accommodation.tip.1':
    'Noc uprostřed pobytu nenese ani Check-in, ani Check-out: mají je jen první a poslední den rozsahu.',
  'help.guide.edit-accommodation.tip.2':
    'Zrušení pobytu vezme i zastávku, kterou dal na den check-inu, a všechny náklady připojené k jeho rezervaci. Pokud to byl omyl, rezervujte noc znovu.',
  // day-bookings
  'help.guide.day-bookings.title': 'Rezervace dne na jeden pohled',
  'help.guide.day-bookings.goal': 'Vidět na jednom místě, co je na tento den už rezervované a zda je to potvrzené.',
  'help.guide.day-bookings.step.1':
    'Rezervace vypisují rezervace dne: ty datované na něj a ty, které visí na některé z jeho zastávek.',
  'help.guide.day-bookings.step.2':
    'Řádek ukazuje, jaký druh rezervace to je, její název a, když patří k zastávce, tu zastávku za tečkou. Její časy sedí na pravém konci.',
  'help.guide.day-bookings.step.3':
    'Barva říká, jak rezervace stojí: zelený řádek je potvrzený, jantarový ještě čeká na potvrzení. Hotely v tomto seznamu nejsou, mají vlastní blok níže.',
  'help.guide.day-bookings.step.4': 'Seznam rezervace jen vypisuje. Rezervace se vytváří a mění na kartě Rezervace.',
  'help.guide.day-bookings.result':
    'Všechno datované na ten den a všechno, co visí na některé z jeho zastávek, je v tomto jednom seznamu.',
  'help.guide.day-bookings.tip.1':
    'Rezervace přistane na dni podle svého vlastního data. Změňte datum na kartě Rezervace a přesune se na jiný den sama.',
  'help.guide.day-bookings.tip.2':
    'Žádný blok Rezervace znamená, že den nemá rezervace: je skrytý, ne ukázaný prázdný.',

  // ── Screen: trip-map ──────────────────────────────────────────────────────────────────
  'help.ctx.trip-map.title': 'Mapa',
  'help.ctx.trip-map.summary':
    'Střed plánu: každé místo cesty jako špendlík, trasy, které je spojují, a přepínače po okrajích mapy pro satelit, pro celou cestu najednou a pro místa v té části města, na kterou se díváte.',
  'help.ctx.trip-map.bullet.1':
    'Špendlík je místo: vlastní fotka, pokud ji má, jinak barva jeho kategorie s ikonou kategorie. Najeďte na něj a dostanete kartu s jeho názvem a adresou, a k tomu s kategorií a hodnocením tam, kde je místo nese. Přetažením špendlíku na kartu dne místo naplánujete na ten den.',
  'help.ctx.trip-map.bullet.2':
    'Špendlíky, které jsou příliš blízko u sebe, než aby se daly rozeznat, se složí do jedné tmavé bubliny s počtem. Klikněte na bublinu a mapa přiblíží to, co je uvnitř.',
  'help.ctx.trip-map.bullet.3':
    'Kliknutím na špendlík otevřete místo pod mapou, s jeho hodnocením, soubory a tím, co s ním dál; kliknutím na prázdný kus mapy ho zase pustíte.',
  'help.ctx.trip-map.bullet.4':
    'Když je ve sloupci dnů otevřený den, jeho zastávky nesou malý bílý odznak s pořadím v tom dni, a místo naplánované na dva dny nese obě čísla spojená znakem ·.',
  'help.ctx.trip-map.bullet.5':
    'Řada ikon nahoře prohledá tu část mapy, kterou vidíte: Restaurace, Kavárny, Bary a noční život, Ubytování, Památky, Muzea a kultura, Příroda a parky a Aktivity. Hledat v této oblasti spustí hledání znovu, když mapou pohnete.',
  'help.ctx.trip-map.bullet.6':
    'Kliknutím pravým tlačítkem kamkoli na mapu otevřete formulář místa v tom bodě, s už dohledanou adresou. Kulaté tlačítko vlevo dole vymění kreslenou mapu za letecké snímky.',
  'help.ctx.trip-map.bullet.7':
    'Zobrazit celou cestu vpravo dole nakreslí všechny cestovní dny najednou a vypíše, co každý z nich pokrývá; ikona trasy na řádku rezervace nakreslí tu rezervaci a ta v liště nástrojů nad dny nakreslí všechny.',
  // map-markers
  'help.guide.map-markers.title': 'Číst mapu',
  'help.guide.map-markers.goal': 'Vědět, co vám každý špendlík, odznak a bublina na mapě říká.',
  'help.guide.map-markers.step.1':
    'Mapa drží každé místo cesty. Tam, kde špendlíky sedí příliš blízko u sebe, než aby se daly rozeznat, se složí do jedné tmavé bubliny, která nese jejich počet; klikněte na bublinu a mapa přiblíží to, co v ní bylo, nebo při nejhlubším přiblížení špendlíky rozprostře do vějíře.',
  'help.guide.map-markers.step.2':
    'Špendlík je vlastní fotka místa, pokud ji má, jinak barva jeho kategorie s ikonou kategorie. Najeďte na něj a karta uvede jeho název a adresu, s kategorií a hodnocením tam, kde je místo nese.',
  'help.guide.map-markers.step.3':
    'Klikněte na špendlík a místo se otevře v kartě pod mapou: jeho souřadnice, hodnocení, Soubory a podél spodního okraje to, co s ním dál, mezi tím Navigace, Upravit a Smazat, a Přidat ke dni, dokud je otevřený den. Kliknutím na prázdný kus mapy ho zase pustíte.',
  'help.guide.map-markers.step.4':
    'Otevřete den ve sloupci dnů a jeho zastávky dostanou čísla: malý bílý odznak v rohu špendlíku je pořadí té zastávky ve dni. Místo naplánované na dva dny nese obě čísla spojená znakem ·. Bez otevřeného dne čísla nejsou a roh nese místo nich hodnocení.',
  'help.guide.map-markers.step.5':
    'Přetáhněte špendlík z mapy na kartu dne ve sloupci dnů a místo je naplánované na ten den, přesně tak, jako byste jeho řádek vytáhli ze seznamu míst.',
  'help.guide.map-markers.result':
    'Na cestě se nic nezměnilo: mapa je pohled na ni a každý špendlík říká, které místo, který den a v jakém pořadí.',
  'help.guide.map-markers.tip.1':
    'Den složený ve sloupci dnů si své zastávky odnese z mapy s sebou; otevřete den znovu a jsou zpátky.',
  'help.guide.map-markers.tip.2':
    'Filtr nad seznamem míst rozhoduje i o tom, co mapa kreslí: zvolte Nezařazené a zůstanou na ní jen místa, která ještě nemají den.',
  'help.guide.map-markers.tip.3':
    'Na této mapě nejsou tlačítka přiblížení: kolečko přibližuje, dvojklik přiblíží o krok a tažením samotné mapy s ní pohnete.',
  // map-nearby-places
  'help.guide.map-nearby-places.title': 'Najít místa kolem sebe na mapě',
  'help.guide.map-nearby-places.goal':
    'Nechat mapu hledat restaurace, památky nebo hotel v té části města, na kterou se díváte, a jedno z nich vzít do cesty.',
  'help.guide.map-nearby-places.step.1':
    'Řada ikon nahoře na mapě je hledání podle kategorií: Restaurace, Kavárny, Bary a noční život, Ubytování, Památky, Muzea a kultura, Příroda a parky a Aktivity.',
  'help.guide.map-nearby-places.step.2':
    'Klikněte na kategorii. TREK hledá takový druh místa v té části mapy, kterou vidíte, a pro každý nález položí špendlík v barvě kategorie. Vždy jen jedna kategorie: kliknutím na jinou ji vyměníte a kliknutím na tu zapnutou ji vypnete.',
  'help.guide.map-nearby-places.step.3':
    'Pohněte mapou a pod řadou se objeví druhé tlačítko: Hledat v této oblasti spustí stejné hledání pro nový výřez. Samotný pohyb nikdy nehledá znovu, což drží počet dotazů dole.',
  'help.guide.map-nearby-places.step.4':
    'Špendlíky nesou název toho, co našly. Klikněte na jeden a formulář místa se otevře už z něj vyplněný: Název, Adresa, Zeměpisná šířka a Zeměpisná délka a web i telefon tam, kde je OpenStreetMap má.',
  'help.guide.map-nearby-places.step.5':
    'Zkontrolujte, co vyplnil, a doplňte, co hledání vědět nemohlo: Popis, Kategorii, vlastní poznámky.',
  'help.guide.map-nearby-places.step.6':
    'Klikněte na Přidat. Pokud už v cestě je místo stejného názvu, formulář to řekne a tlačítko se změní na Přesto přidat.',
  'help.guide.map-nearby-places.result':
    'Místo je v seznamu míst a na mapě jako jeden z vlastních špendlíků cesty, pod Nezařazené, dokud ho nepoložíte na den. Špendlíky hledání zůstanou, dokud kategorii nevypnete.',
  'help.guide.map-nearby-places.tip.1':
    'Řada zmizí, když je v Nastavení pod Travel & map vypnuté Objevovat místa na mapě.',
  'help.guide.map-nearby-places.tip.2':
    'Odpovědi přicházejí z indexu TREK Places a z OpenStreetMap, takže je to jedna z mála věcí v plánu, která potřebuje připojení.',
  'help.guide.map-nearby-places.tip.3':
    'Hledání pokrývá to, co je na obrazovce, takže si přibližte ulici, na kterou se ptáte: celé město odpoví prvními šedesáti nálezy a malým pořádkem v nich.',
  // map-add-place
  'help.guide.map-add-place.title': 'Vytvořit místo pravým kliknutím do mapy',
  'help.guide.map-add-place.goal': 'Položit místo přesně tam, kam chcete, bez toho, abyste ho nejdřív hledali.',
  'help.guide.map-add-place.step.1':
    'Klikněte pravým tlačítkem na bod na mapě, který myslíte. Otevře se formulář místa s názvem Přidat místo/aktivitu.',
  'help.guide.map-add-place.step.2':
    'Zeměpisná šířka a Zeměpisná délka už jsou v tom bodě a TREK souřadnice dohledá a z toho, co tam najde, vyplní Adresu, a také Název tam, kde má dohledání co nabídnout. Nic ještě není uložené, takže přepište, co je špatně.',
  'help.guide.map-add-place.step.3':
    'Dejte mu Název, který poznáte, a zbytek toho, co má plán vědět: Popis, Poznámky, Kategorie, Webové stránky.',
  'help.guide.map-add-place.step.4':
    'Klikněte na Přidat. Místo přistane v seznamu jako nezařazené i s otevřeným dnem: pravé kliknutí do mapy říká kde, ne kdy.',
  'help.guide.map-add-place.result': 'Místo je v seznamu a na mapě, pod Nezařazené, dokud ho nepoložíte na den.',
  'help.guide.map-add-place.tip.1':
    'Adresa pochází z dohledání souřadnic, takže může znít spíš jako ulice než jako název a nad volnou krajinou se může vrátit prázdná. Obě pole jsou vaše, přepište je.',
  'help.guide.map-add-place.tip.2':
    'Na mapách MapLibre GL a Mapbox GL udělá totéž kliknutí prostředním tlačítkem a na dotykové obrazovce dlouhý stisk.',
  // map-satellite
  'help.guide.map-satellite.title': 'Přepnout na satelit',
  'help.guide.map-satellite.goal': 'Vyměnit kreslenou mapu za letecké snímky a zpátky.',
  'help.guide.map-satellite.step.1':
    'Kulaté tlačítko vlevo dole na mapě je přepínač podkladové vrstvy. Jeho ikona vždy ukazuje vrstvu, na kterou by přešlo, a při najetí řekne kterou: Přepnout na satelitní zobrazení. Klikněte na něj.',
  'help.guide.map-satellite.step.2':
    'Mapa je teď letecké snímky, dost hluboké na rozeznání jednotlivé budovy a bez vlastního klíče. Všechno, co TREK kreslí, zůstane navrchu: špendlíky, trasa dne, stopy a trasy rezervací.',
  'help.guide.map-satellite.step.3':
    'Tlačítko teď hlásí Přepnout na mapové zobrazení. Kliknutím na něj se vrátíte ke kreslené mapě.',
  'help.guide.map-satellite.result':
    'Mapa je zase kreslená a vrstva, na které jste ji nechali, se pamatuje na vašem účtu.',
  'help.guide.map-satellite.tip.1':
    'Volba se drží na vašem účtu, ne na cestě, takže každá cesta se otevře tak, jak jste ji nechali, ať používáte kterýkoli vykreslovač mapy.',
  'help.guide.map-satellite.tip.2':
    'Snímky nenesou žádný text: názvy ulic, čtvrti a čísla domů jsou na kreslené mapě, takže když hledáte adresu, přepněte zpátky.',
  // map-whole-trip
  'help.guide.map-whole-trip.title': 'Vidět celou cestu a její vzdálenosti',
  'help.guide.map-whole-trip.goal':
    'Vyměnit jeden otevřený den za všechny cestovní dny cesty a přečíst, jak daleko každý z nich vede.',
  'help.guide.map-whole-trip.step.1':
    'Kulaté tlačítko Zobrazit celou cestu sedí vpravo dole na mapě. Klikněte na něj a všechny cestovní dny cesty se nakreslí najednou, každý ve své barvě přes bílý obal, takže sousední dny zůstanou rozeznatelné.',
  'help.guide.map-whole-trip.step.2':
    'Karta nad tlačítkem ty dny vypíše: barevná tečka, název dne, ikona pro každý způsob, jakým ho cestujete, a vzdálenost, kterou pokrývá. Nahoře je Celková vzdálenost.',
  'help.guide.map-whole-trip.step.3':
    'Kliknutím na den v kartě ho vyberete, stejně jako když ho zvolíte ve sloupci dnů: mapa ten den orámuje a jeho zastávky dostanou čísla zpátky.',
  'help.guide.map-whole-trip.step.4':
    'Tlačítko teď hlásí Skrýt celou cestu. Stiskněte ho a vrátíte se k jedinému otevřenému dni.',
  'help.guide.map-whole-trip.result':
    'Každý cestovní den je nakreslený ve své barvě a karta říká, co každý z nich pokrývá a kolik cesta dává dohromady.',
  'help.guide.map-whole-trip.tip.1':
    'Součet přichází po několika úsecích. Dokud za ním stojí …, je číslo ještě dílčí součet; ustálí se, jakmile odpoví každý úsek.',
  'help.guide.map-whole-trip.tip.2':
    'Úsek, který směrovací engine odmítne, zůstane rovnou čárou a nepočítá se, a karta to řekne, místo aby tiše ukazovala méně.',
  'help.guide.map-whole-trip.tip.3':
    'Den s méně než dvěma zastávkami se souřadnicemi nemá co kreslit, takže z karty vypadne úplně.',
  // map-booking-routes
  'help.guide.map-booking-routes.title': 'Zobrazit trasu rezervace na mapě',
  'help.guide.map-booking-routes.goal':
    'Nakreslit na mapu lety, vlaky a jízdy, které máte zarezervované, a zase je z ní dostat.',
  'help.guide.map-booking-routes.step.1':
    'Trasy rezervací jsou vypnuté, dokud o nějakou nepožádáte. Na řádku rezervace ve sloupci dnů sedí malá ikona trasy: Zobrazit trasy rezervací.',
  'help.guide.map-booking-routes.step.2':
    'Klikněte na ni a rezervace se objeví na mapě: let jako oblouk po ortodromě, jízda po skutečných silnicích, vlak jako řetěz svých stanic. Potvrzeno se kreslí plně, Čeká na potvrzení čárkovaně, a konce trasy jsou modré pilulky s ikonou dopravy.',
  'help.guide.map-booking-routes.step.3':
    'Klikněte na koncovou pilulku a otevře se rezervace za ní, s jejími časy, Rezervačním kódem a Místem / Adresou, kde začíná. Zavřít ji zase uklidí.',
  'help.guide.map-booking-routes.step.4':
    'Ikona trasy v liště nástrojů nad dny udělá celou cestu najednou: Zobrazit všechny trasy rezervací nakreslí každou rezervaci, která nějakou má.',
  'help.guide.map-booking-routes.step.5':
    'Je to čistý štít, ne vrstva navrch, takže co jste vybrali rezervaci po rezervaci, padá. Stiskněte ji znovu, teď s popiskem Skrýt všechny trasy rezervací, a mapa je prázdná.',
  'help.guide.map-booking-routes.result':
    'Rezervace, o které jste požádali, jsou nakreslené na mapě a volba se drží pro tuto cestu v tomto prohlížeči, dokud ji nezměníte.',
  'help.guide.map-booking-routes.tip.1':
    'Konce nesou kód letiště nebo název stanice, jen když je v Nastavení pod Travel & map zapnuté Popisky tras rezervací; jinak ukazují jen ikonu.',
  'help.guide.map-booking-routes.tip.2':
    'Vždy zobrazovat trasy rezervací, ve stejném nastavení, je kreslí od začátku na každé cestě, o které jste ještě nerozhodli.',
  'help.guide.map-booking-routes.tip.3':
    'Rezervace potřebuje dva konce se souřadnicemi, než se dá nakreslit, takže hotel nebo restaurace ikonu trasy nenese.',
  'help.ctx.trip-map.bullet.8':
    'Se zapnutým doplňkem Dawarich kreslí kulaté tlačítko Dawarich pod Zobrazit celou cestu trasu, kterou váš telefon opravdu zaznamenal: Zobrazit zaznamenanou trasu ji položí čárkovaně pod plánovanou trasu, jednu barvu na den, a popisek tlačítka říká, proč žádná čára není, když žádná není.',
  // map-dawarich-trail
  'help.guide.map-dawarich-trail.title': 'Zobrazit trasu, kterou jste opravdu urazili',
  'help.guide.map-dawarich-trail.goal':
    'Položte na mapu trasu, kterou Dawarich zaznamenal na vašem telefonu, čárkovaně vedle té, kterou jste naplánovali, a čtěte cestu den po dni tak, jak opravdu proběhla.',
  'help.guide.map-dawarich-trail.step.1':
    'Kulaté tlačítko Dawarich sedí vpravo dole na mapě, pod Zobrazit celou cestu; při najetí říká Zobrazit zaznamenanou trasu. Klikněte na něj. TREK se zeptá vašeho Dawarichu na data cesty a kolem tlačítka se točí prstenec, dokud je odpověď na cestě.',
  'help.guide.map-dawarich-trail.step.2':
    'Zaznamenaná trasa přistane jako čárkovaná čára, jedna barva na den, nakreslená pod plánovanou trasou, aby plán zůstal čitelný. Na tlačítku teď stojí Skrýt zaznamenanou trasu. Dny se dělí o místní půlnoci a den složený ve sloupci dnů si svou čárkovanou čáru odnese z mapy spolu se svými zastávkami.',
  'help.guide.map-dawarich-trail.step.3':
    'Klikněte i na Zobrazit celou cestu a každý plánovaný den se nakreslí plnou čarou vedle čárkovaného záznamu. Kde obě běží spolu, šel den podle plánu; kde čárkovaná čára odbočuje, je místo, kde nešel.',
  'help.guide.map-dawarich-trail.result':
    'Co jste naplánovali a co jste opravdu udělali, je na mapě pohromadě, čárkované proti plnému, a karta nad tlačítky pořád vypisuje plánované dny a jejich vzdálenosti.',
  'help.guide.map-dawarich-trail.tip.1':
    'Zapnuto nebo vypnuto se pamatuje pro každou cestu po dobu této relace prohlížeče. Dokud je trasa zapnutá, ptá se TREK Dawarichu každé dvě minuty znovu, takže cesta, která právě probíhá, se dotáhne bez znovunačtení; trasa samotná se nikdy neukládá, takže není v databázi TREKu, není v zálohách a není k dispozici offline.',
  'help.guide.map-dawarich-trail.tip.2':
    'Popisek tlačítka vysvětlí prázdnou mapu: Načítá se zaznamenaná trasa…, dokud je na cestě, V těchto dnech nebylo nic zaznamenáno, Zaznamenanou trasu se nepodařilo načíst, nebo Zaznamenaná trasa vyžaduje připojení, když je TREK offline.',
  // map-compass
  'help.guide.map-compass.title': 'Otočit mapu a znovu najít sever',
  'help.guide.map-compass.goal': 'Otočte mapu směrem, kterým jdete, a jedním kliknutím ji vraťte k severu.',
  'help.guide.map-compass.step.1':
    'Mapu otočíte tažením pravým tlačítkem, nebo podržte Ctrl a táhněte levým tlačítkem; na dotykové obrazovce otáčejte dvěma prsty. Kulatý kompas vedle řady ikon kategorií nahoře na mapě se otáčí s ní: jeho šipka ukazuje vždy na sever, takže se naklání tak daleko, jak jste otočili.',
  'help.guide.map-compass.step.2':
    'Klikněte na kompas. Reset north, jak se tlačítko jmenuje, vrátí mapu plynule k severu nahoře a k plochému pohledu a šipka zase stojí rovně.',
  'help.guide.map-compass.result':
    'Mapa je zase severem nahoru a rovná a na cestě se nic nezměnilo: kompas hýbe jen kamerou.',
  'help.guide.map-compass.tip.1':
    'Kompas existuje jen na mapách MapLibre GL a Mapbox GL; mapa Leaflet se otočit nedá, takže žádný nemá. Poskytovatel mapy v Nastavení, pod Mapa, rozhoduje, kterou používáte, a Uložit nastavení mapy volbu uchová.',
  'help.guide.map-compass.tip.2':
    'Kliknutí odstraní i náklon: tažení pravým tlačítkem nahoru nebo dolů pohled naklopí a Reset north ho srovná spolu s otočením. Na Mapbox GL se zapnutými 3D budovy a terén to zploští i 3D pohled, dokud ho znovu nenakloníte.',

  // ── Screen: trip-collab ───────────────────────────────────────────────────────────────
  'help.ctx.trip-collab.title': 'Spolupráce',
  'help.ctx.trip-collab.summary':
    'Karta, kde skupina plánuje společně: chat vlevo, sdílené poznámky a odkazy vedle něj, hlasování pod nimi a Co následuje na konci. Všechno, co se sem napíše, stojí naráz na obrazovce každého dalšího člena, bez znovunačtení.',
  'help.ctx.trip-collab.bullet.1':
    'Chat je sloupec vlevo. Pište do Napište zprávu... a stiskněte Enter; Shift a Enter udělají nový řádek. Smajlík přidá emoji, Připojit obrázky pověsí na zprávu až čtyři obrázky.',
  'help.ctx.trip-collab.bullet.2':
    'Najeďte na zprávu pro Odpovědět a u vlastní i pro Smazat; pravým tlačítkem na ni dostanete osm rychlých reakcí. Po smazané zprávě zůstane jediný řádek, že jste zprávu smazali.',
  'help.ctx.trip-collab.bullet.3':
    'Poznámky jsou sdílený blok: Nová poznámka jednu napíše a ozubené kolečko vedle otevře Spravovat kategorie pro jejich názvy a barvy. Karta nese Rozbalit, Připnout, Upravit a Smazat.',
  'help.ctx.trip-collab.bullet.4':
    'Odkazy sbírají adresy, na kterých cesta stojí. Přidat odkaz vezme název a adresu http nebo https; Upravit odkaz, Připnout odkaz a Smazat odkaz sedí na konci štítku a připnuté odkazy zůstávají vepředu.',
  'help.ctx.trip-collab.bullet.5':
    'Hlasování rozhoduje. Nové hlasování položí otázku s nejméně dvěma možnostmi; kliknutí na možnost je váš hlas, Uzavřít ukončí hlasování a Smazat hlasování odstraní.',
  'help.ctx.trip-collab.bullet.6':
    'Co následuje vypisuje zastávky cesty, které jsou ještě před vámi, nejvýš osm z nich, s jejich časy a lidmi na nich. Čte jen denní plán; časy se nastavují tam.',
  // write-note
  'help.guide.write-note.title': 'Napsat sdílenou poznámku',
  'help.guide.write-note.goal':
    'Dejte to, co potřebuje celá skupina, pravidlo, adresu, připomínku, tam, kde to každý zase najde.',
  'help.guide.write-note.step.1': 'Klikněte nahoře v panelu Poznámky na Nová poznámka. Otevře se formulář.',
  'help.guide.write-note.step.2':
    'Poznámka... je název, který karta nese. Je to jediné, na čem formulář trvá: Vytvořit zůstane šedé, dokud v něm něco nebude.',
  'help.guide.write-note.step.3':
    'Velké pole pod ním drží text a bere Markdown: tučné slovo, seznam, nadpis. Karta ukáže prvních pár řádků a Rozbalit na ní otevře celou poznámku.',
  'help.guide.write-note.step.4':
    'Pod Kategorie vyberte tu, do které poznámka patří; její barva se stane barvou karty. Pilulky jsou kategorie, které už existují, a nová se dělá ve Spravovat kategorie.',
  'help.guide.write-note.step.5':
    'Webové stránky berou odkaz, který k poznámce patří. Karta pak nese dlaždici Link, která ho otevře.',
  'help.guide.write-note.step.6': 'Klikněte na Vytvořit.',
  'help.guide.write-note.result':
    'Poznámka je karta v panelu Poznámky, v barvě své kategorie, a je už na obrazovce každého dalšího člena.',
  'help.guide.write-note.tip.1':
    'Připnout na kartě ji drží nahoře v panelu; všechno pod ní je řazené podle toho, kdy se naposledy změnilo.',
  'help.guide.write-note.tip.2':
    'Ozubené kolečko vedle Nová poznámka otevře Spravovat kategorie: tam kategorie dostane barvu, přejmenuje se naráz všude nebo se přidá dřív, než ji nějaká poznámka použije.',
  'help.guide.write-note.tip.3':
    'Přiložit soubory pověsí na poznámku dokument. Přiložit otevře výběr souborů a obrázek nebo PDF se dá také jen vložit do formuláře.',
  'help.guide.write-note.tip.4':
    'Poznámky jsou vlastní přepínač pod Doplňky, pod Spolupráce: administrátor je může vypnout a nechat běžet chat, odkazy, hlasování a Co následuje.',
  // shared-links
  'help.guide.shared-links.title': 'Sesbírat odkazy cesty',
  'help.guide.shared-links.goal':
    'Mějte rezervační portál, sdílené album a jízdní řád na jednom místě, místo abyste je hledali rolováním v chatu.',
  'help.guide.shared-links.step.1': 'Klikněte nahoře v panelu Odkazy na Přidat odkaz.',
  'help.guide.shared-links.step.2':
    'Dejte odkazu jméno v Název odkazu, vložte adresu do pole pod ním a pak klikněte na Uložit odkaz.',
  'help.guide.shared-links.step.3':
    'Štítek ukazuje jméno a web, na který míří. Kliknutí na něj otevře stránku v nové kartě.',
  'help.guide.shared-links.step.4':
    'Tři malá tlačítka na jeho konci jsou Upravit odkaz, Připnout odkaz a Smazat odkaz. Připnout odkaz posune štítek dopředu v panelu; Smazat odkaz se na nic neptá.',
  'help.guide.shared-links.result':
    'Odkaz je štítek v panelu Odkazy, připnutý dopředu, a naráz na obrazovce každého člena.',
  'help.guide.shared-links.tip.1': 'Berou se jen adresy http a https; pole cokoli jiného odmítne ještě před uložením.',
  'help.guide.shared-links.tip.2':
    'Připnuté odkazy jdou první, pak ty nejnovější. Malá ikona vedle názvu je vlastní favicona webu, stažená přímo z něj, takže bez internetu ukáže štítek místo ní prostý symbol odkazu.',
  'help.guide.shared-links.tip.3':
    'Odkazy jsou vlastní přepínač pod Doplňky, pod Spolupráce, takže administrátor může panel vypnout, aniž by sáhl na zbytek karty.',
  // create-poll
  'help.guide.create-poll.title': 'Zeptat se skupiny',
  'help.guide.create-poll.goal':
    'Udělejte z otázky, kterou v chatu nikdo nezodpoví, hlasování, které může každý odškrtnout.',
  'help.guide.create-poll.step.1': 'Klikněte nahoře v panelu Hlasování na Nové hlasování.',
  'help.guide.create-poll.step.2':
    'Napište otázku. Podporuje Markdown pod polem znamená, že tučné slovo, zalomení řádku nebo krátký seznam tu fungují.',
  'help.guide.create-poll.step.3': 'Vyplňte Možnost 1 a Možnost 2. Dvě možnosti s něčím v nich jsou minimum.',
  'help.guide.create-poll.step.4':
    '+ Přidat možnost přidá třetí, čtvrtou, kolik jich potřebujete; malý křížek vedle řádku jednu zase odebere.',
  'help.guide.create-poll.step.5':
    'Více možností nechá každého odškrtnout víc než jednu možnost. Když zůstane vypnuté, hlas se přesune, jakmile někdo vybere něco jiného.',
  'help.guide.create-poll.step.6': 'Klikněte na Vytvořit hlasování.',
  'help.guide.create-poll.result': 'Hlasování stojí nahoře v panelu Hlasování, otevřené a zatím bez jediného hlasu.',
  'help.guide.create-poll.tip.1': 'Otázka se vykresluje jako Markdown; možnosti zůstávají prostým textem.',
  'help.guide.create-poll.tip.2':
    'Vytvořit hlasování zůstane šedé, dokud tam nebude otázka a aspoň dvě možnosti s něčím v nich.',
  'help.guide.create-poll.tip.3':
    'Termín se dá nastavit jen v telefonní aplikaci. Hlasování, které ho má, tu ukazuje zbývající čas v jantarovém štítku a jakmile čas vyprší, počítá se za uzavřené.',
  'help.guide.create-poll.tip.4':
    'Hlasování má pod Doplňky, pod Spolupráce, vlastní přepínač Ankety: administrátor je může vypnout a nechat běžet ostatní čtyři panely.',
  // vote-poll
  'help.guide.vote-poll.title': 'Hlasovat a přečíst výsledek',
  'help.guide.vote-poll.goal': 'Odevzdejte svůj hlas, podívejte se, kde skupina stojí, a změňte názor.',
  'help.guide.vote-poll.step.1': 'Klikněte na možnost, kterou chcete. Její kolečko se vyplní a pruh za ní povyroste.',
  'help.guide.vote-poll.step.2':
    'Teď je čitelný celý výsledek: pruh je podíl, procento stojí vpravo a malá kolečka jsou lidé, kteří tu možnost vybrali.',
  'help.guide.vote-poll.step.3':
    'Změnili jste názor? Klikněte na jinou možnost. U hlasování bez Více možností se váš hlas přesune, místo aby přibyl druhý.',
  'help.guide.vote-poll.step.4':
    'Pod otázkou stojí, kolik má hlasování hlasů. Kliknutí na možnost, kterou jste už vybrali, váš hlas zase stáhne a počitadlo zase klesne.',
  'help.guide.vote-poll.result':
    'Vaše odškrtnutí je na jedné možnosti, pruhy ukazují, jak je skupina rozdělená, a kolečka říkají, kdo co vybral.',
  'help.guide.vote-poll.tip.1':
    'Pruhy a procenta se objeví, až když jste sami hlasovali, nebo až je hlasování uzavřené, aby průběžný stav nikoho neovlivnil.',
  'help.guide.vote-poll.tip.2':
    'Hlas není nikdy anonymní: najeďte na jedno z koleček u možnosti a dostanete jméno za ním.',
  // close-poll
  'help.guide.close-poll.title': 'Uzavřít hlasování, nebo ho odstranit',
  'help.guide.close-poll.goal':
    'Zastavte hlasování, jakmile se skupina rozhodla, a ukliďte hlasování, které už nikdo nepotřebuje.',
  'help.guide.close-poll.step.1':
    'Uzavřít, zámek v rohu hlasování, hlasování ukončí. Možnosti přestanou brát kliknutí.',
  'help.guide.close-poll.step.2':
    'Uzavřené hlasování klesne pod nadpis Uzavřené dole v panelu, nese odznak Uzavřeno a ukazuje výsledek všem, ať hlasovali, nebo ne. Vítězná možnost je zabarvená zeleně.',
  'help.guide.close-poll.step.3':
    'Smazat, koš ve stejném rohu, hlasování odstraní. Nic se neptá dvakrát a hlasy jdou s ním.',
  'help.guide.close-poll.result':
    'Hlasování je pryč z panelu každého člena. To, které jste jen uzavřeli, zůstane dole čitelné, se svým výsledkem.',
  'help.guide.close-poll.tip.1':
    'Uzavření se nedá vrátit: znovu otevřít nejde. Hlasování uzavřené omylem se musí položit znovu.',
  'help.guide.close-poll.tip.2': 'Smazat vezme hlasování a každý hlas na něm pryč všem, hned a bez otázky.',
  // whats-next
  'help.guide.whats-next.title': 'Číst Co následuje',
  'help.guide.whats-next.goal': 'Podívejte se, co skupina dělá dál, bez otevírání plánu.',
  'help.guide.whats-next.step.1':
    'Panel vypisuje zastávky cesty, které jsou ještě před vámi, nejvýš osm z nich, v pořadí podle času, pod nadpisem na každý den: Dnes, Zítra nebo datum.',
  'help.guide.whats-next.step.2':
    'Vlevo u řádku stojí jeho čas: začátek, do, a konec, když ho zastávka má, nebo TBD, když na ní ještě žádný čas nastavený není.',
  'help.guide.whats-next.step.3':
    'Štítky pod názvem jsou lidé na té zastávce. Když pro ni není vybraný nikdo, vypíšou se všichni na cestě.',
  'help.guide.whats-next.result': 'Seznam toho, co přijde, jen ke čtení: řídí se plánem a nic tady ho nemění.',
  'help.guide.whats-next.tip.1':
    'Tady se nic nenastavuje. Časy přicházejí z denního plánu; změňte je tam a tenhle seznam je hned následuje.',
  'help.guide.whats-next.tip.2':
    'Vypisuje se jen to, co ještě leží před vámi: zastávka, jejíž čas uplynul, vypadne a na konci cesty je panel prázdný.',
  'help.guide.whats-next.tip.3':
    'Co následuje má pod Doplňky, pod Spolupráce, vlastní přepínač Co dál, a je to panel pro počítač: karta Spolupráce v telefonní aplikaci ho nenabízí.',
  // trip-chat
  'help.guide.trip-chat.title': 'Mluvit se skupinou',
  'help.guide.trip-chat.goal':
    'Řekněte něco, odpovězte na jednu konkrétní zprávu, zareagujte na jinou a svou vlastní vezměte zpátky.',
  'help.guide.trip-chat.step.1':
    'Pište do Napište zprávu... a stiskněte Enter. Modrá šipka vedle pole dělá totéž; Shift a Enter místo toho udělají nový řádek.',
  'help.guide.trip-chat.step.2':
    'Smajlík otevře výběr emoji, se Smileys, Reactions a Travel v něm. To, co vyberete, se přidá k tomu, co píšete, samo se to neodešle.',
  'help.guide.trip-chat.step.3':
    'Najeďte na zprávu někoho jiného: v jejím rohu se objeví malé kulaté tlačítko. To je Odpovědět.',
  'help.guide.trip-chat.step.4':
    'Zpráva, na kterou odpovídáte, je citovaná nad polem. Napište a odešlete, a citace jede s sebou ve vaší bublině; křížek na citaci ji zase zahodí.',
  'help.guide.trip-chat.step.5':
    'Pravým tlačítkem na zprávu dostanete osm rychlých reakcí. Vaše sedí pod bublinou a druhé kliknutí na tu samou ji vezme zpátky.',
  'help.guide.trip-chat.step.6':
    'Vaše vlastní zprávy nesou vedle Odpovědět i Smazat. Vezme zprávu pryč a nechá jediný řádek, že jste zprávu smazali: cesta zpátky není.',
  'help.guide.trip-chat.result':
    'Vaše odpověď sedí pod zprávou, kterou cituje, reakce visí na třetí a ta, kterou jste vzali zpátky, nechává jediný řádek, který to říká.',
  'help.guide.trip-chat.tip.1':
    'Enter odesílá, Shift a Enter udělají nový řádek. Zpráva, která není nic než emoji, se ukazuje velká.',
  'help.guide.trip-chat.tip.2':
    'Připojit obrázky bere na jednu zprávu až čtyři obrázky; dají se také jen vložit nebo pustit na pole.',
  'help.guide.trip-chat.tip.3':
    'Zpráva s odkazem dostane pod sebou kartu s náhledem, staženou vaším vlastním TREKem, takže odkaz na něco, kam se dostanete jen vy, zůstane prostým odkazem.',
  'help.guide.trip-chat.tip.4':
    'Chat je vlastní přepínač pod Doplňky, pod Spolupráce: administrátor ho může vypnout a nechat běžet poznámky, odkazy, hlasování a Co následuje.',

  // ── Screen: trip-lists ────────────────────────────────────────────────────────────────
  'help.ctx.trip-lists.title': 'Seznamy',
  'help.ctx.trip-lists.summary':
    'Dva seznamy pro jednu cestu: seznam věcí, s tím, kdo co přináší a kolik to váží, a seznam úkolů se vším, co se musí stát před cestou a během ní. Záložka je tu, dokud je zapnutý doplněk Seznamy.',
  'help.ctx.trip-lists.bullet.1':
    'Balicí seznam a Úkoly nahoře přepínají mezi oběma a počítají, co v kterém je; tlačítka vpravo patří tomu, který je otevřený.',
  'help.ctx.trip-lists.bullet.2':
    'Seznam věcí je rozdělený do seznamů, Dokumenty, Oblečení, jak si je pojmenujete, každý s barevnou tečkou, odznakem zabaleno z celku a třemi tečkami, pod kterými jsou Přejmenovat, Označit vše, Odznačit vše a Smazat seznam. Přidat seznam v liště nahoře vytvoří nový.',
  'help.ctx.trip-lists.bullet.3':
    'Řádek je zaškrtávací políčko a název, pak jako malé odznaky, kdo položku přináší, počet a hmotnost v gramech, a kolečko zavazadla, dokud je zapnuté Sledování zavazadel, a pak koš a tři tečky, pod kterými jsou Přesunout do seznamu, Sdílení, Přejmenovat a Smazat. Co řádek nepoužívá, zůstává ztlumené, dokud na to nenajedete myší, a úchyt vlevo ho táhne nahoru nebo dolů uvnitř jeho seznamu.',
  'help.ctx.trip-lists.bullet.4':
    'Sdílené a Můj seznam dělí seznam věcí na dvě části: fond, který vidí všichni, a ten váš. Vše, K zabalení a Hotovo zužují ten, který je otevřený, a pruh nahoře počítá, co je zabaleno.',
  'help.ctx.trip-lists.bullet.5':
    'Použít šablonu a Uložit jako šablonu naplní nebo zachovají seznam bez psaní a dvě ikony vedle nich seznam exportují, jako výtisk, PDF nebo soubor, nebo nějaký importují. Červené tlačítko u pruhu postupu říká, kolik položek je zaškrtnutých, a odklidí je.',
  'help.ctx.trip-lists.bullet.6':
    'Úkoly mají vlastní postranní panel: kartu postupu, filtry Vše, Moje úkoly, Po termínu a Hotové, jeden řádek na seznam a pod nimi Přidat seznam. Úkoly leží v kartě, jejíž záhlaví jmenuje filtr a nese řazení, Priorita nebo Termín splnění. Kliknutí na úkol ho otevře v panelu vpravo a Přidat nový úkol otevře uprostřed obrazovky formulář Nový úkol.',
  // packing-categories
  'help.guide.packing-categories.title': 'Sestavit seznam věcí',
  'help.guide.packing-categories.goal':
    'Rozdělte to, co si berete, do seznamů, naplňte je položkami a řekněte, kdo se o který seznam stará.',
  'help.guide.packing-categories.step.1':
    'Klikněte v liště nad seznamy na Přidat seznam, napište název do Název seznamu (např. Oblečení) a klikněte na Přidat.',
  'help.guide.packing-categories.step.2':
    'Nový seznam začíná jedním prázdným řádkem. Klikněte na Přidat položku, napište položku do Název položky... a stiskněte Enter; pole zůstane otevřené pro další.',
  'help.guide.packing-categories.step.3':
    'Řádek přejmenujete kliknutím na jeho název nebo přes Přejmenovat ve třech tečkách na jeho pravém konci.',
  'help.guide.packing-categories.step.4':
    'Čárkované kolečko v záhlaví seznamu přiřazuje k seznamu členy cesty. Vyberte jméno; štítek, který se objeví, tu osobu kliknutím zase odebere.',
  'help.guide.packing-categories.step.5':
    'Tři tečky na konci záhlaví drží zbytek: Přejmenovat, Označit vše, Odznačit vše a Smazat seznam, které vezme seznam i všechno v něm, aniž by se znovu ptalo.',
  'help.guide.packing-categories.result':
    'Nový seznam sedí v mřížce se svými položkami pod sebou a se svou barevnou tečkou a jeho odznak počítá, co je už zabaleno.',
  'help.guide.packing-categories.tip.1':
    'Seznam jsou jen jeho položky. Smažte poslední a řádek se změní na zástupce, aby si seznam udržel své místo a svou barvu; smažte i ten řádek a seznam je pryč.',
  'help.guide.packing-categories.tip.2':
    'Přiřazení někoho k seznamu mu pošle oznámení o balení. Nemění to, kdo položky vidí, to je Sdílení, ve třech tečkách řádku.',
  'help.guide.packing-categories.tip.3':
    'Dva seznamy mohou nést stejný název. TREK je uvnitř rozlišuje, takže názvy zůstanou tak, jak jste je napsali.',
  // check-off-packing
  'help.guide.check-off-packing.title': 'Odškrtávat při balení',
  'help.guide.check-off-packing.goal': 'Označte, co je v tašce, sledujte pruh a odkliďte zabalené položky.',
  'help.guide.check-off-packing.step.1': 'Klikněte na políčko vlevo u řádku. Název se přeškrtne a pruh se pohne.',
  'help.guide.check-off-packing.step.2':
    'Pruh nahoře počítá, co je zabaleno, proti všemu na seznamu, číslem i procentem.',
  'help.guide.check-off-packing.step.3': 'Celý seznam naráz: tři tečky v jeho záhlaví drží Označit vše a Odznačit vše.',
  'help.guide.check-off-packing.step.4':
    'Vše, K zabalení a Hotovo zužují mřížku. K zabalení nechá jen to, co ještě chybí, takže seznam, který je celý zabalený, z ní vypadne.',
  'help.guide.check-off-packing.step.5':
    'Odstranit 3 hotových vedle pruhu postupu smaže všechny zaškrtnuté položky naráz, po jednom potvrzení od prohlížeče.',
  'help.guide.check-off-packing.result':
    'Vypsané je jen to, co je ještě otevřené, a pruh nahoře říká, jak daleko balení je.',
  'help.guide.check-off-packing.tip.1': 'Zaškrtnutou položku lze i tak přejmenovat: klikněte na její název.',
  'help.guide.check-off-packing.tip.2':
    'Označit vše a Odznačit vše pracují vždy jen s jedním seznamem, z jeho vlastních tří teček.',
  'help.guide.check-off-packing.tip.3':
    'Když jsou zaškrtnuté všechny položky, počitadlo nahradí Vše je zabaleno! a pruh zezelená.',
  // apply-packing-template
  'help.guide.apply-packing-template.title': 'Použít šablonu balení',
  'help.guide.apply-packing-template.goal': 'Přineste do cesty hotový seznam a uchovejte seznam této cesty pro další.',
  'help.guide.apply-packing-template.step.1': 'Klikněte v pruhu nad seznamem na Použít šablonu.',
  'help.guide.apply-packing-template.step.2':
    'Vyberte šablonu. Každý řádek ji pojmenuje a říká, kolik položek obsahuje.',
  'help.guide.apply-packing-template.step.3':
    'Položky přistanou v pohledu, ve kterém jste: Sdílené je dá do fondu, který vidí všichni, Můj seznam je udělá vašimi.',
  'help.guide.apply-packing-template.step.4':
    'Uchovejte seznam této cesty pro další cestu: Uložit jako šablonu otevře dialog, napište název a klikněte na Uložit.',
  'help.guide.apply-packing-template.result': 'Seznamy a položky šablony jsou v cestě, vedle toho, co tam už bylo.',
  'help.guide.apply-packing-template.tip.1':
    'Šablona nese jen názvy a seznamy. Počty, hmotnosti, zavazadla a to, co je už zaškrtnuté, zůstanou za ní.',
  'help.guide.apply-packing-template.tip.2':
    'Použít šablonu je tu, až když nějaká šablona existuje. Bez ní se tlačítko vůbec neobjeví.',
  'help.guide.apply-packing-template.tip.3':
    'Uložit jako šablonu se objeví jen správci instance a jen dokud má seznam položky. Uloží sdílený fond plus vaše vlastní položky, nikdy soukromé položky jiného člena.',
  // import-packing-list
  'help.guide.import-packing-list.title': 'Vložit celý seznam věcí',
  'help.guide.import-packing-list.goal': 'Proměňte seznam, který už máte jinde, naráz v položky k zabalení.',
  'help.guide.import-packing-list.step.1': 'Klikněte v pruhu nad seznamem na tlačítko importu se šipkou dolů.',
  'help.guide.import-packing-list.step.2':
    'Jedna položka na řádek: Kategorie, Název, Váha v g (volitelné), Zavazadlo (volitelné), checked/unchecked (volitelné). Šedá ukázka v poli ukazuje všechny čtyři podoby. Funguje i seznam v Markdownu: nadpis pojmenuje seznam a z "- [ ]" a "- [x]" se stanou položky.',
  'help.guide.import-packing-list.step.3':
    'Nebo načtěte řádky ze souboru přes Načíst CSV/TXT/MD. Bere .csv, .txt nebo .md a nahradí to, co je v poli.',
  'help.guide.import-packing-list.step.4': 'Klikněte na Importovat. Tlačítko počítá řádky, kterým rozumělo.',
  'help.guide.import-packing-list.result':
    'Každý řádek je jedna položka, v seznamu, který pojmenuje jeho první pole, a ničeho, co tam už bylo, se to nedotkne.',
  'help.guide.import-packing-list.tip.1':
    'Pole oddělují čárky, středníky i tabulátory a uvozovky drží pole pohromadě, takže „Košile, modrá“ zůstane jedním názvem. Řádek s jedinou hodnotou je jen název, řádek bez vlastního seznamu přistane v Ostatní a "3x" před názvem nastaví počet.',
  'help.guide.import-packing-list.tip.2':
    'Zavazadlo pojmenované ve čtvrtém poli se vytvoří, pokud ho cesta ještě nemá. Tohle je jediné místo, které hromadně načítá hmotnosti a zavazadla; šablona přináší jen názvy a seznamy.',
  // export-packing-list
  'help.guide.export-packing-list.title': 'Vytisknout nebo exportovat seznam věcí',
  'help.guide.export-packing-list.goal':
    'Vezměte si seznam s sebou na papíře, jako PDF nebo jako soubor pro jinou aplikaci či další cestu.',
  'help.guide.export-packing-list.step.1': 'Klikněte v pruhu nad seznamem na tlačítko exportu se šipkou nahoru.',
  'help.guide.export-packing-list.step.2':
    'Kontrolní seznam v Markdownu (.md) a CSV pro import (.csv) uloží seznam rovnou jako soubor.',
  'help.guide.export-packing-list.step.3':
    'Klikněte na Vytisknout nebo uložit jako PDF. Náhled ukáže seznam jako stránku: nahoře cestu a její termín, pod ní každý seznam jako kartu s políčkem k zaškrtnutí.',
  'help.guide.export-packing-list.step.4':
    'Pod náhledem klikněte na Vytisknout nebo uložit jako PDF. Prohlížeč otevře svůj dialog tisku: vyberte tiskárnu, nebo Uložit jako PDF, chcete-li si ponechat soubor.',
  'help.guide.export-packing-list.result':
    'Výtisk i soubory obsahují otevřený pohled, Sdílené nebo Můj seznam, s počty, hmotnostmi a zaškrtnutím.',
  'help.guide.export-packing-list.tip.1':
    'CSV je formát, který čte Importovat, včetně zavazadel, takže poslouží jako vaše vlastní šablona balení: importujte ho do další cesty.',
  'help.guide.export-packing-list.tip.2':
    'Soubor Markdown se v Obsidian, Notion nebo GitHub otevře jako kontrolní seznam a přes Importovat se stejně tak vrátí zpět.',
  // share-packing-item
  'help.guide.share-packing-item.title': 'Určit, kdo položku vidí a kdo ji přináší',
  'help.guide.share-packing-item.goal':
    'Přesouvejte položku mezi skupinovým fondem, vaším vlastním seznamem a lidmi, pro které ji berete.',
  'help.guide.share-packing-item.step.1':
    'Sdílené nad seznamy je fond, který vidí všichni, Můj seznam je ten váš a každý počítá, co v něm je. Klikněte na Můj seznam, abyste se podívali na ten svůj.',
  'help.guide.share-packing-item.step.2': 'Zpět ve Sdílené otevřete tři tečky na konci řádku a klikněte na Sdílení.',
  'help.guide.share-packing-item.step.3':
    'Tři úrovně: Sdílené, ve společném fondu a viditelné pro všechny; Osobní, které vidíte jen vy; a Sdílet s…, kde vyberete lidi, na které se položka vztahuje.',
  'help.guide.share-packing-item.step.4': 'Osobní položka je jen na Můj seznam. Přepněte, abyste ji našli.',
  'help.guide.share-packing-item.step.5':
    'Otevřete znovu Sdílení a zaškrtněte jméno pod Sdílet s…. Položka se ukáže i na seznamu té osoby a řádek dostane malý odznak s počtem lidí, se kterými je sdílená.',
  'help.guide.share-packing-item.result': 'Položka sedí v úrovni, kterou jste vybrali, a řádek říká, kdo ji přináší.',
  'help.guide.share-packing-item.tip.1':
    'Sdílení mění jen ten, kdo položku přináší. Ten, s kým jste ji sdíleli, ji vidí na svém Můj seznam, označenou vaším jménem, a může ji odškrtnout.',
  'help.guide.share-packing-item.tip.2':
    'U položky, kterou přináší někdo jiný, dostanete místo toho dvě jiná tlačítka: Můžu to vzít taky, které vás přidá vedle něj, a Kopírovat do mého seznamu, které udělá soukromou kopii pro vás.',
  'help.guide.share-packing-item.tip.3':
    'Nové položky dědí pohled, ve kterém je přidáte. Přidané v Můj seznam jsou Osobní, přidané ve Sdílené jdou do fondu.',
  // packing-bags
  'help.guide.packing-bags.title': 'Zvážit zavazadla',
  'help.guide.packing-bags.goal':
    'Dejte každé položce hmotnost, roztřiďte položky do zavazadel a udržte každé zavazadlo pod limitem aerolinky.',
  'help.guide.packing-bags.step.1': 'Klikněte na odznak hmotnosti před kolečkem a napište hmotnost položky v gramech.',
  'help.guide.packing-bags.step.2': 'Kolečko na konci řádku je její zavazadlo. Klikněte na ně.',
  'help.guide.packing-bags.step.3':
    'Zatím žádné zavazadlo: Přidat zavazadlo, název, Enter. Zavazadlo se vytvoří a položka jde rovnou do něj.',
  'help.guide.packing-bags.step.4':
    'Panel Zavazadla se objeví vpravo, jakmile existuje jedno zavazadlo: název, hmotnost, pruh naplnění, kdo ho nese a kolik položek v něm je, pak Nepřiřazeno a Celková váha.',
  'help.guide.packing-bags.step.5':
    'Klikněte na Nastavit limit a napište limit v kilogramech, tak, jak ho uvádějí aerolinky.',
  'help.guide.packing-bags.step.6': 'Čárkované plus vedle názvu zavazadla říká, kdo ho nese.',
  'help.guide.packing-bags.result':
    'Panel Zavazadla vpravo ukazuje hmotnost každého zavazadla proti jeho limitu, co není v žádném zavazadle, a součet.',
  'help.guide.packing-bags.tip.1':
    'Pole hmotnosti, kolečko zavazadla a panel Zavazadla existují jen tehdy, když má správce zapnuté Sledování zavazadel pod doplňkem Seznamy.',
  'help.guide.packing-bags.tip.2':
    'Hmotnost zavazadla se sčítá na serveru přes položky všech členů, včetně těch, které nevidíte, takže to číslo je opravdu to, co zavazadlo váží.',
  'help.guide.packing-bags.tip.3':
    'Zavazadlo bez limitu se kreslí proti nejtěžšímu zavazadlu, aby pruhy zůstaly porovnatelné. Dejte mu limit a pruh se místo toho čte proti němu.',
  // create-todo
  'help.guide.create-todo.title': 'Přidat úkol',
  'help.guide.create-todo.goal': 'Zapište něco, co se musí stát, se seznamem, prioritou, datem a jménem u toho.',
  'help.guide.create-todo.step.1': 'Klikněte vpravo nahoře na Přidat nový úkol.',
  'help.guide.create-todo.step.2': 'Pojmenujte ho v Název úkolu a dejte všechno, co stojí za zapamatování, pod Popis.',
  'help.guide.create-todo.step.3':
    'Seznam úkol zařazuje. Vyberte jeden, nebo použijte plus vedle něj a v malém dialogu pojmenujte nový.',
  'help.guide.create-todo.step.4': 'Priorita jsou čtyři tlačítka: Žádná, P1, P2 a P3, od červené po modrou.',
  'help.guide.create-todo.step.5': 'Termín splnění otevře kalendář a Přiřazeno dá na úkol jméno.',
  'help.guide.create-todo.step.6': 'Klikněte na Vytvořit úkol.',
  'help.guide.create-todo.result':
    'Úkol je v seznamu se svými odznaky, prioritou, termínem, seznamem a osobou, které je přiřazen, a otevře se v panelu vpravo.',
  'help.guide.create-todo.tip.1': 'Povinný je jen název. Všechno ostatní jde doplnit později z panelu vpravo.',
  'help.guide.create-todo.tip.2': 'Když je v postranním panelu vybraný seznam, nový úkol začíná v tom seznamu.',
  'help.guide.create-todo.tip.3': 'Enter v poli názvu vytvoří úkol rovnou, bez dotýkání se ostatních polí.',
  // todo-filters
  'help.guide.todo-filters.title': 'Najít a změnit úkol',
  'help.guide.todo-filters.goal':
    'Zkraťte seznam úkolů na to, co je teď důležité, a pak upravte úkol, na kterém jste skončili.',
  'help.guide.todo-filters.step.1':
    'Úkoly v postranním panelu: Vše je všechno, co je ještě otevřené, Moje úkoly to, co je na vás, Po termínu to, co má datum v minulosti, Hotové to, co je dokončené. Každý nese svůj počet; klikněte na Po termínu.',
  'help.guide.todo-filters.step.2':
    'Pod Seznamy sedí jeden řádek na seznam. Když jeden vyberete, ukáže se ten seznam, včetně dokončených úkolů.',
  'help.guide.todo-filters.step.3':
    'Řazení v záhlaví seznamu mění pořadí toho, co je na obrazovce: Priorita dává dopředu P1, Termín splnění dává dopředu nejbližší termín. Vždy jen jedno z těch dvou a druhé kliknutí vrátí vaše vlastní pořadí.',
  'help.guide.todo-filters.step.4': 'Klikněte na úkol, abyste ho otevřeli v panelu vpravo.',
  'help.guide.todo-filters.step.5':
    'Změňte, co potřebujete, Popis, Priorita, Seznam, Termín splnění nebo Přiřazeno, a pak Uložit změny. Zaškrtávací políčko v záhlaví panelu označí úkol jako hotový a Smazat ho odstraní hned.',
  'help.guide.todo-filters.result':
    'Seznam ukazuje jen úkoly, na které jste se ptali, a panel vpravo upravuje ten, který jste vybrali.',
  'help.guide.todo-filters.tip.1':
    'Řádek seznamu počítá jen to, co je ještě otevřené, ale když ho vyberete, ukáže i dokončené úkoly. Vše, Moje úkoly a Po termínu skrývají to, co je hotové; Hotové neukazují nic jiného.',
  'help.guide.todo-filters.tip.2':
    'Priorita a Termín splnění v řazení se navzájem vylučují a dokud je jedno z nich zapnuté, řádky už nejde přetáhnout do vlastního pořadí.',

  // ── Screen: trip-bookings ─────────────────────────────────────────────────────────────
  'help.ctx.trip-bookings.title': 'Rezervace',
  'help.ctx.trip-bookings.summary':
    'Karta, která drží všechno rezervované pro cestu, co není způsob přepravy: ubytování, stoly, vstupenky, prohlídky, parkování. Každá rezervace je karta v sekci Čeká na potvrzení nebo v sekci Potvrzeno a nese svůj kód, svůj dokument, své cestující a svou cenu.',
  'help.ctx.trip-bookings.bullet.1':
    'Ruční rezervace vpravo nahoře otevře formulář. Šest druhů, které dělá, je Ubytování, Restaurace, Událost, Prohlídka, Parkování a Jiné; lety, vlaky a zbytek žijí na kartě Doprava a tady se nikdy neobjeví.',
  'help.ctx.trip-bookings.bullet.2':
    'Importovat ze souboru předá potvrzení parseru: EML, PDF, PKPass, HTML nebo TXT, nejvýše pět souborů po 10 MB. Tlačítko je tam jen tehdy, když je server umí přečíst.',
  'help.ctx.trip-bookings.bullet.3':
    'Štítky vedle nadpisu filtrují podle typu, každý se svým vlastním počtem, a Vše vrátí zpátky všechno. Jakmile nějaká rezervace jmenuje lidi, řádek avatarů vedle štítků zúží kartu na jednoho z nich.',
  'help.ctx.trip-bookings.bullet.4':
    'Karty stojí ve dvou sekcích, Čeká na potvrzení a Potvrzeno, každá se svým počtem. Kliknutí na nadpis sekce ji složí, a jestli je otevřená, si TREK pro tuto cestu pamatuje.',
  'help.ctx.trip-bookings.bullet.5':
    'Karta nese stavovou tečku, typ, název, data a časy, Rezervační kód, Místo / Adresu, to, s čím je rezervace propojená, její Odkaz, Poznámky, Soubory a Cestující.',
  'help.ctx.trip-bookings.bullet.6':
    'Tužka na kartě otevře znovu tentýž formulář; koš se zeptá jednou a pak je rezervace pryč. U ubytování s ní jdou i jeho noci v denním plánu a jeho propojený výdaj.',
  // create-booking
  'help.guide.create-booking.title': 'Vytvořit rezervaci',
  'help.guide.create-booking.goal':
    'Vložte do cesty ručně restauraci, událost, prohlídku, parkovací místo nebo cokoli jiného.',
  'help.guide.create-booking.step.1': 'Klikněte vpravo nahoře na kartě na Ruční rezervace. Otevře se Nová rezervace.',
  'help.guide.create-booking.step.2':
    'Vyberte Typ rezervace ze seznamu nahoře ve formuláři, vedle pole Cestující. Ubytování, Restaurace, Událost, Prohlídka, Parkování a Jiné je těch šest, které tato karta dělá, a formulář se s volbou mění: jen Ubytování vymění svá data za rozsah dnů.',
  'help.guide.create-booking.step.3':
    'Napište Název. Je to jediné pole, na kterém formulář trvá, a Přidat zůstane mrtvé, dokud v něm něco není.',
  'help.guide.create-booking.step.4':
    'Nastavte Datum a Čas začátku, a Datum konce a Čas konce, pokud má rezervace konec. Kalendáře nabízejí jen dny uvnitř cesty, a konec, který není po začátku, to řekne červeně a zablokuje Přidat.',
  'help.guide.create-booking.step.5':
    'Vložte Rezervační kód z potvrzení a nastavte Stav. Čeká na potvrzení nebo Potvrzeno rozhodne, do které ze dvou sekcí karta padne.',
  'help.guide.create-booking.step.6': 'Klikněte na Přidat.',
  'help.guide.create-booking.result':
    'Rezervace je karta ve své sekci se svým štítkem typu, svými daty a svým kódem, a všichni ostatní v cestě ji vidí přibýt.',
  'help.guide.create-booking.tip.1':
    'Místo / Adresa nabízí při psaní skutečné adresy; výběr jedné přepíše to, co jste napsali, a adresa, kterou jste napsali sami, zůstane tak, jak je.',
  'help.guide.create-booking.tip.2':
    'Odkaz vede na vlastní stránku rezervace u poskytovatele. Karta z něj udělá odkaz, který se otevře v nové záložce.',
  'help.guide.create-booking.tip.3':
    'Poznámky jsou Markdown, takže seznam nebo tučný řádek se na kartě vykreslí jako seznam nebo tučný řádek.',
  // booking-hotel
  'help.guide.booking-hotel.title': 'Rezervovat ubytování',
  'help.guide.booking-hotel.goal':
    'Zadejte ubytování tak, aby se najednou počítalo jako rezervace i jako noci v denním plánu.',
  'help.guide.booking-hotel.step.1':
    'Klikněte na Ruční rezervace a zvolte Ubytování. Pole s daty zmizí a jejich místo zaujme blok hotelových polí.',
  'help.guide.booking-hotel.step.2':
    'Vyberte hotel pod Ubytování. Ten seznam jsou vlastní místa cesty, a výběr jednoho zapíše jeho název do pole Název a jeho adresu do Místo / Adresa.',
  'help.guide.booking-hotel.step.3':
    'Nastavte Od dne a Do dne: první noc a ráno, kdy odjíždíte. Obojí nabízí dny cesty s jejich daty, a ta dvě pole se navzájem drží v pořadí.',
  'help.guide.booking-hotel.step.4': 'Vyplňte Check-in, Check-in do a Check-out, a Rezervační kód z potvrzení.',
  'help.guide.booking-hotel.step.5': 'Klikněte na Přidat.',
  'help.guide.booking-hotel.result':
    'Karta nese místo data rozsah dnů, s časy příjezdu a odjezdu a s adresou, a tentýž pobyt teď sedí na těch dnech plánu.',
  'help.guide.booking-hotel.tip.1':
    'Ubytování je jediný typ bez pole Datum a Čas začátku. Jeho daty jsou Od dne a Do dne, a to jsou dny cesty, ne kalendář.',
  'help.guide.booking-hotel.tip.2':
    'Nechte Ubytování prázdné a napište místo toho adresu: místo se vyhledá, vytvoří a připne za vás na mapu.',
  'help.guide.booking-hotel.tip.3': 'Smazání rezervace s sebou vezme i noci z denního plánu.',
  // link-booking
  'help.guide.link-booking.title': 'Propojit rezervaci s plánem',
  'help.guide.link-booking.goal':
    'Pověste rezervaci na zastávku a místo, kam patří, aby se objevila tam, kde ji budete chtít.',
  'help.guide.link-booking.step.1': 'Klikněte na kartě, kterou chcete propojit, na tužku. Otevře se Upravit rezervaci.',
  'help.guide.link-booking.step.2':
    'Otevřete Propojit s přiřazením dne. Ten seznam je váš plán: nadpis na každý den, pak zastávky toho dne, očíslované a se svými časy. Vyberte tu, ke které rezervace patří.',
  'help.guide.link-booking.step.3':
    'Místo / Aktivita propojí samotné místo. Vyberte ho tam, a Název a Místo / Adresa se vyplní všude, kde jste je nechali prázdné.',
  'help.guide.link-booking.step.4': 'Klikněte na Aktualizovat.',
  'help.guide.link-booking.result':
    'Karta jmenuje den a zastávku pod Propojit s přiřazením dne, a rezervace jede s tou zastávkou v denním plánu.',
  'help.guide.link-booking.tip.1':
    'Bez propojení (samostatné) nahoře v seznamu propojení zase sundá. Ubytování žádný výběr zastávky nemá: propojuje se přes své noci.',
  'help.guide.link-booking.tip.2':
    'Výběr zastávky na dni s datem za vás vyplní prázdné Datum. Datum, které jste už nastavili, zůstane nedotčené.',
  // booking-travelers
  'help.guide.booking-travelers.title': 'Říct, pro koho rezervace je',
  'help.guide.booking-travelers.goal': 'Označte cestující, které rezervace pokrývá, a pak si nechte ukázat jen jejich.',
  'help.guide.booking-travelers.step.1':
    'Otevřete rezervaci tužkou. Pole Cestující je nahoře ve formuláři, vedle pole Typ rezervace, a dokud na rezervaci nikdo není, ukazuje Přiřadit cestující.',
  'help.guide.booking-travelers.step.2':
    'Klikněte na něj a vyberte lidi, pro které tato rezervace je; jmenovaní hosté jsou v seznamu také. Vybraný dostane fajfku a jeho avatar se objeví v poli. Dalším kliknutím na jméno ho zase sundáte.',
  'help.guide.booking-travelers.step.3': 'Klikněte na Aktualizovat.',
  'help.guide.booking-travelers.step.4':
    'Nahoře v liště, vedle štítků typů, klikněte na avatar cestujícího a uvidíte jen jeho rezervace.',
  'help.guide.booking-travelers.result':
    'Karta vypisuje lidi, pro které je, a řádek avatarů zúží kartu na jednoho z nich.',
  'help.guide.booking-travelers.tip.1':
    'Na kartě se cestující jen ukazují, nikdy nemění. Nastavují se tady, ve formuláři.',
  'help.guide.booking-travelers.tip.2':
    'Řádek avatarů se objeví, jakmile má cesta víc než jednoho člena a aspoň jedna rezervace někoho jmenuje. Co vyberete, vydrží pro tuto relaci prohlížeče.',
  // booking-files
  'help.guide.booking-files.title': 'Nechat voucher u rezervace',
  'help.guide.booking-files.goal': 'Přiložte potvrzení, vstupenku nebo průkaz k rezervaci, ke které patří.',
  'help.guide.booking-files.step.1':
    'Otevřete rezervaci tužkou, sjeďte dolů k Soubory a klikněte na Přiložit soubor. U rezervace, která už existuje, jde dokument nahoru rovnou a TREK řekne Soubor byl nahrán.',
  'help.guide.booking-files.step.2':
    'Dokument je vypsaný svým jménem, s tlačítkem, které ho otevře, a s křížkem vedle něj.',
  'help.guide.booking-files.step.3':
    'Propojit stávající soubor nabízí dokumenty cesty, které u této rezervace ještě nejsou. Vyberte jeden a přiloží se, aniž by se cokoli znovu nahrávalo.',
  'help.guide.booking-files.step.4': 'Klikněte na Aktualizovat.',
  'help.guide.booking-files.result': 'Karta vypisuje dokumenty pod Soubory, a kliknutí na jeden z nich ho otevře.',
  'help.guide.booking-files.tip.1':
    'U rezervace, kterou teprve vytváříte, dokument počká a jde nahoru ve chvíli, kdy kliknete na Přidat.',
  'help.guide.booking-files.tip.2':
    'Křížek vedle dokumentu odebere propojení, ne dokument. Ten zůstane na kartě Soubory dané cesty.',
  'help.guide.booking-files.tip.3':
    'Které druhy souborů se smějí přikládat, je seznam správce; dokumenty, text a obrázky jsou povolené rovnou.',
  // booking-cost
  'help.guide.booking-cost.title': 'Udělat z ceny rezervace náklad',
  'help.guide.booking-cost.goal': 'Dostaňte to, co rezervace stojí, do Nákladů, rozdělené mezi lidi, kteří ji platí.',
  'help.guide.booking-cost.step.1':
    'Otevřete rezervaci a sjeďte na konec formuláře. Pod Náklady stojí Vytvořit výdaj a Propojit stávající výdaj, s poznámkou Uloží rezervaci a poté otevře editor nákladů.',
  'help.guide.booking-cost.step.2':
    'Klikněte na Vytvořit výdaj. Rezervace se uloží, její formulář se zavře a otevře se editor nákladů.',
  'help.guide.booking-cost.step.3':
    'Za co to bylo? už je název rezervace. Vložte Celkovou částku a zkontrolujte Měnu a Den.',
  'help.guide.booking-cost.step.4':
    'Kategorie je ta, kterou typ rezervace napovídá. Nastavte Kdo zaplatil? a to, jak se částka dělí.',
  'help.guide.booking-cost.step.5': 'Klikněte na Přidat výdaj.',
  'help.guide.booking-cost.result':
    'Formulář rezervace teď uvádí výdaj pod Propojené výdaje s jeho částkou, a tentýž výdaj stojí na kartě Náklady, svázaný s touto rezervací.',
  'help.guide.booking-cost.tip.1':
    'Kategorie jde za typem: z Restaurace je Jídlo a pití, z Ubytování Ubytování, z Parkování Parkování, a Událost i Prohlídka obě padnou do Ostatní.',
  'help.guide.booking-cost.tip.2':
    'Rezervace může nést několik výdajů. Propojit stávající výdaj nabízí ty z Nákladů, které zatím nikam nepatří. U propojeného výdaje ho Odpojit, výdaj ponechat uvolní a nechá v Nákladech, kdežto koš ho odebere.',
  'help.guide.booking-cost.tip.3':
    'Blok Náklady je ve formuláři jen tehdy, když je zapnutý doplněk Náklady, který správce přepíná pod Doplňky.',
  // filter-bookings
  'help.guide.filter-bookings.title': 'Najít rezervaci',
  'help.guide.filter-bookings.goal': 'Zužte dlouhou kartu na typ, osobu nebo stav, který hledáte.',
  'help.guide.filter-bookings.step.1':
    'Štítky vedle nadpisu jsou typy, které tato cesta opravdu používá, každý s počtem, který drží. Vše je celá karta.',
  'help.guide.filter-bookings.step.2': 'Klikněte na štítek a zůstane jen ten typ. Klikněte na druhý a zůstanou oba.',
  'help.guide.filter-bookings.step.3': 'Vše vrátí všechno zpátky.',
  'help.guide.filter-bookings.step.4': 'Avatary vedle štítků filtrují podle cestujícího, jednoho nebo několika naráz.',
  'help.guide.filter-bookings.step.5':
    'Čeká na potvrzení a Potvrzeno jsou ty dvě sekce, každá se svým počtem. Kliknutím na nadpis jednu složíte; složená zůstane, i když se vrátíte.',
  'help.guide.filter-bookings.result':
    'Karta ukazuje jen to, co jste vybrali, a vybrané to zůstane, i když se na ni v této relaci prohlížeče vrátíte.',
  'help.guide.filter-bookings.tip.1':
    'Štítky nabízejí jen typy, které cesta má, takže cesta bez jediné prohlídky nemá štítek Prohlídka.',
  'help.guide.filter-bookings.tip.2':
    'Filtr, který nic nenajde, nechá kartu prázdnou se Žádná místa nebyla nalezena. To znění je ze seznamu míst; význam je stejný.',
  // import-booking-file
  'help.guide.import-booking-file.title': 'Přečíst rezervaci z jejího potvrzení',
  'help.guide.import-booking-file.goal':
    'Nechte TREK vytáhnout rezervaci z mailu nebo z PDF, které poskytovatel poslal, místo abyste ji psali znovu.',
  'help.guide.import-booking-file.step.1':
    'Klikněte v liště na Importovat ze souboru. Otevře se Importovat potvrzení rezervace.',
  'help.guide.import-booking-file.step.2':
    'Pusťte potvrzení na to pole, nebo na ně klikněte a vyberte je: EML, PDF, PKPass, HTML a TXT, až pět souborů po 10 MB. Ty, které jste vybrali, jsou na poli vypsané jménem.',
  'help.guide.import-booking-file.step.3':
    'Klikněte na Importovat. Dialog se hned zavře, protože čtení běží na pozadí.',
  'help.guide.import-booking-file.step.4':
    'Karta vpravo dole hlásí průběh pod názvem souboru a jde s vámi aplikací i přes znovunačtení. Zpracování souborů… se změní v zaškrtnutí, když je čtení hotové, a karta nabídne Importovat. Klikněte na to.',
  'help.guide.import-booking-file.result':
    'Rezervace je karta v Čeká na potvrzení se svými nocemi, svým kódem a potvrzením pod Soubory, pobyt sedí na těch dnech plánu a se zapnutými Náklady je cena výdaj k ní přivázaný.',
  'help.guide.import-booking-file.tip.1':
    'Importovat ze souboru je tam jen tehdy, když server umí potvrzení číst, což potřebuje buď extraktor, nebo doplněk Analýza pomocí AI. Ten správce přepíná pod Doplňky.',
  'help.guide.import-booking-file.tip.2':
    'Když se nepodařilo přečíst nic, karta to řekne a nabídne Try AI parsing, což pošle tytéž soubory rovnou modelu. Hotové zpracování se drží deset minut; kontrolu spusťte uvnitř tohoto okna.',
  'help.guide.import-booking-file.tip.3':
    'Potvrzení se přiloží jen tehdy, když je jeho typ v Povolené typy souborů v nastavení administrace. PDF tam je od začátku; mail, EML, se musí nejdřív přidat, jinak se rezervace uloží bez něj.',
  // edit-booking
  'help.guide.edit-booking.title': 'Změnit rezervaci',
  'help.guide.edit-booking.goal':
    'Opravte čas, doplňte kód, který přišel později, nebo přesuňte rezervaci z Čeká na potvrzení do Potvrzeno.',
  'help.guide.edit-booking.step.1':
    'Klikněte v hlavičce karty na tužku. Otevře se Upravit rezervaci se vším, co rezervace ví.',
  'help.guide.edit-booking.step.2':
    'Změňte, co je potřeba změnit, tady Rezervační kód, který provozovatel konečně poslal.',
  'help.guide.edit-booking.step.3': 'Dejte Stav na Potvrzeno.',
  'help.guide.edit-booking.step.4': 'Klikněte na Aktualizovat.',
  'help.guide.edit-booking.result':
    'Karta se přesune: potvrzená rezervace stojí v sekci Potvrzeno za zelenou tečkou, a všichni v cestě ji vidí se přesunout.',
  'help.guide.edit-booking.tip.1':
    'Rezervační kód, který nejde přečíst, je Skrýt rezervační kódy v Nastavení, pod Zobrazení. Najeďte na něj myší, nebo na něj klikněte, a je čitelný.',
  'help.guide.edit-booking.tip.2':
    'Změňte typ a kategorie propojeného výdaje jde za ním, ledaže jste kategorii vybrali ručně v editoru nákladů.',
  'help.guide.edit-booking.tip.3': 'Ubytování se upravuje taky tady: jeho dny Od dne a Do dne jsou v témže formuláři.',
  // delete-booking
  'help.guide.delete-booking.title': 'Smazat rezervaci',
  'help.guide.delete-booking.goal': 'Vezměte z cesty rezervaci, ze které sešlo.',
  'help.guide.delete-booking.step.1': 'Klikněte v hlavičce karty na koš.',
  'help.guide.delete-booking.step.2':
    'Smazat rezervaci? jmenuje tu, kterou jste vybrali, a říká, že bude trvale smazána.',
  'help.guide.delete-booking.step.3': 'Klikněte na Potvrdit.',
  'help.guide.delete-booking.result':
    'Karta je pryč, pro všechny v cestě. Rezervace nemá žádné zpět, takže ta otázka je poslední zastávka.',
  'help.guide.delete-booking.tip.1':
    'Smazání rezervace ubytování vezme také jeho noci z denního plánu a odebere výdaj, který k němu byl propojený.',
  'help.guide.delete-booking.tip.2':
    'Dokumenty, které byly přiložené, zůstanou na kartě Soubory dané cesty; jde jen jejich propojení s rezervací.',
  // import-booking-file
  'help.guide.import-booking-file.step.5':
    'Každá rezervace, která byla nalezena, se otevře v Nová rezervace, jedna po druhé, už vyplněná. U hotelu je to název v Název a, když cesta to místo má, pod Ubytování, jeho Místo / Adresa, Od dne a Do dne na jeho nocích, Check-in a Check-out, Rezervační kód, potvrzení pod Soubory a, se zapnutými Náklady, cena jako Propojený výdaj. Zkontrolujte to a klikněte na Přidat.',

  // ── Screen: trip-costs ────────────────────────────────────────────────────────────────
  'help.ctx.trip-costs.title': 'Náklady',
  'help.ctx.trip-costs.summary':
    'Peníze cesty: každý výdaj jako datovaná kniha, kdo ho zaplatil a kdo za něj dluží, v té měně, v jaké byla účtenka, a v pravém sloupci, kdo komu musí zaplatit, aby bylo zase vyrovnáno.',
  'help.ctx.trip-costs.bullet.1':
    'Čtyři karty nahoře: Dlužíte a Dluží vám jsou vaše vlastní strana vyrovnání, Nevyřízená částka je to, co je zapsáno, ale zatím nemá plátce, a Celkové výdaje na cestu sečtou všechno a pod tím ukážou Váš podíl a Zaplatili jste.',
  'help.ctx.trip-costs.bullet.2':
    'Přidat výdaj vpravo nahoře otevře editor; Vyrovnat vedle něj zapíše všechny otevřené převody najednou.',
  'help.ctx.trip-costs.bullet.3':
    'Kniha je seskupená po dnech, nejnovější první, s celkem toho dne vpravo. Řádek nese kategorii jako barevný štítek, název, žetony plátců, poznámku a částku, a k tomu půjčili jste nebo vypůjčili jste si, když vás rozdělení nechá v plusu nebo v mínusu.',
  'help.ctx.trip-costs.bullet.4':
    'Nad seznamem sedí Hledat výdaje…, filtr kategorií, filtr dnů, přepínač Vše / Zaplaceno mnou / Dluží mi a tlačítko Exportovat CSV.',
  'help.ctx.trip-costs.bullet.5':
    'Pravý sloupec je odpověď: Vyrovnat vypisuje, kdo komu platí, Zůstatky ukazují přebytek nebo schodek každého cestovatele, Konečný rozpočet to, co cesta stojí každého z nich, a Podle kategorie to, kam peníze šly.',
  'help.ctx.trip-costs.bullet.6':
    'Zapsaná platba sedí ve stejné knize jako vlastní řádek, s Upravit a Vrátit zpět vedle sebe; výdaj má tužku a koš a koš ho smaže bez ptaní.',
  // add-expense
  'help.guide.add-expense.title': 'Přidat výdaj',
  'help.guide.add-expense.goal': 'Zapište, co něco stálo, kdo to zaplatil a s kým se to dělí.',
  'help.guide.add-expense.step.1':
    'Klikněte na Přidat výdaj vpravo nahoře na kartě Náklady. Otevře se editor, datovaný dneškem, se všemi už v rozdělení.',
  'help.guide.add-expense.step.2':
    'Napište, za co to bylo, do pole Za co to bylo?, jediného, které musí být vyplněné, a částku z účtenky do Celková částka.',
  'help.guide.add-expense.step.3':
    'Měna a Den sedí pod částkou. Měna začíná na měně cesty; změňte ji a editor ukáže, jakou má částka hodnotu v měně cesty. Den začíná na dnešku a je to, pod co kniha výdaj zařadí.',
  'help.guide.add-expense.step.4':
    'Vyberte Kategorie. Je jich čtrnáct a nedají se měnit: ta, kterou vyberete, je barevný štítek na řádku a sloupec v Podle kategorie.',
  'help.guide.add-expense.step.5':
    'Pod Kdo zaplatil? vyberte člověka, který peníze skutečně dal. Vy je předvybráno; Zatím nikdo nezaplatil zapíše částku, aniž by za ni někdo dlužil, a Platilo více lidí rozdělí účet mezi několik plátců.',
  'help.guide.add-expense.step.6':
    'Split začíná na Equally se všemi zahrnutými a u každého jména je vidět podíl, který z toho vychází. Uložte kliknutím na Přidat výdaj.',
  'help.guide.add-expense.result':
    'Výdaj je v knize pod svým dnem, započítaný do Celkové výdaje na cestu, a sloupec vyrovnání přepočítal, kdo komu dluží.',
  'help.guide.add-expense.tip.1':
    'Když necháte editor tak, jak se otevře, je výdaj v měně cesty, datovaný dneškem a rozdělený rovným dílem mezi všechny: opravdu vyplnit musíte jen název a částku.',
  'help.guide.add-expense.tip.2':
    '± vedle částky změní výdaj na vratku. Záporný celek peníze vrací, místo aby je bral, a rozdělení běží opačně.',
  'help.guide.add-expense.tip.3':
    'Připojit účtenku / fakturu dole bere obrázky a PDF. Nahrají se při uložení, přistanou v Soubory cesty a vedle názvu v seznamu se objeví štítek Účtenky.',
  // expense-payers
  'help.guide.expense-payers.title': 'Říct, kdo účet zaplatil',
  'help.guide.expense-payers.goal': 'Zapište, kdo za výdaj zaplatil ze svého, druhá polovina počtů vyrovnání.',
  'help.guide.expense-payers.step.1':
    'Otevřete výdaj tužkou vedle jeho řádku a podívejte se na Kdo zaplatil?. Platil jeden člověk je výchozí: rozbalovací nabídka jmenuje jediného člověka, který peníze dal.',
  'help.guide.expense-payers.step.2':
    'Zatím nikdo nezaplatil, první položka té nabídky, zapíše částku, aniž by kdokoli cokoli dlužil. Výdaj se dál počítá do Celkové výdaje na cestu.',
  'help.guide.expense-payers.step.3':
    'Platilo více lidí, odkaz vedle popisku, otevře řádek pro každého cestovatele. Zahrňte ty, kdo platili, a napište, co každý z nich dal; částky musí dát dohromady celek.',
  'help.guide.expense-payers.step.4':
    'Výdaj, který nikdo nezaplatil, je na svém řádku označený Nedokončeno a počítá se do karty Nevyřízená částka, kde se sbírají zapsané, ale nevyrovnané útraty.',
  'help.guide.expense-payers.result':
    'Kdo zaplatil rozhoduje, komu se vrací, rozdělení rozhoduje, kdo platí, a Zůstatky jsou rozdíl mezi obojím.',
  'help.guide.expense-payers.tip.1':
    'Kdo zaplatil? a Split jsou nezávislé: můžete zaplatit večeři, na které jste nebyli, a být rozděleni do večeře, kterou jste neplatili.',
  'help.guide.expense-payers.tip.2':
    'Při několika plátcích musí částky dát dohromady celek. Zahrňte dalšího a ostatní se kolem něj přerovnají; dokud nesedí, editor říká, na kolik se mají sečíst, a odmítá uložit.',
  'help.guide.expense-payers.tip.3':
    'Odebrání plátce neodebere výdaj: částka zůstává v Celkové výdaje na cestu a řádek se stane Nedokončeno.',
  // split-expense
  'help.guide.split-expense.title': 'Rozdělit účet mezi cestovatele',
  'help.guide.split-expense.goal':
    'Rozhodněte, kdo za výdaj dluží: všichni rovným dílem, podle částky, nebo řádek po řádku z účtenky.',
  'help.guide.split-expense.step.1':
    'V editoru výdaje Split vypisuje každého cestovatele. Klikněte na jméno, abyste ho z tohoto výdaje vynechali; vynechaný cestovatel má u sebe Nezahrnuto a nedluží za něj nic.',
  'help.guide.split-expense.step.2':
    'Equally je výchozí: každý zahrnutý cestovatel dostane stejný podíl a řádek pod seznamem říká, na kolik dílů je to rozděleno a na kolik každý podíl vychází.',
  'help.guide.split-expense.step.3':
    'Custom vymění podíly za pole s částkami. Napište, co který cestovatel dluží; řádek pod tím průběžně počítá a zezelená na Rozdělení sedí s celkem. Dokud to nesedí, nejde uložit.',
  'help.guide.split-expense.step.4':
    'Ticket rozdělí účtenku řádek po řádku: Přidat položku, pak název a cena na každý řádek a pod Dělí se mezi: cestovatelé, kteří si ten řádek dělí.',
  'help.guide.split-expense.step.5':
    'Podíl každého pod řádky ukazuje, co každý cestovatel nakonec dluží, a Celková částka nahoře se sečte z řádků. Klikněte na Uložit.',
  'help.guide.split-expense.result':
    'Rozdělení je to, z čeho je postavený každý zůstatek. Ukládá se s výdajem a dá se později změnit, aniž byste sáhli na cokoli jiného.',
  'help.guide.split-expense.tip.1':
    'Cestovatel, kterého vynecháte, má u sebe Nezahrnuto a za tento jeden výdaj nedluží nic; ostatní jeho podíl převezmou.',
  'help.guide.split-expense.tip.2':
    'Equally je přesné na cent: zbylý cent se střídá od výdaje k výdaji, takže není nikdo, kdo by ho platil pořád.',
  'help.guide.split-expense.tip.3':
    'Režim Ticket si Celková částka sečte sám a pole zešedne: řádky účtenky jsou celek.',
  // expense-currency
  'help.guide.expense-currency.title': 'Zadat výdaj v jiné měně',
  'help.guide.expense-currency.goal': 'Zadejte to, co na účtence opravdu je, a nechte kurz na TREKu.',
  'help.guide.expense-currency.step.1':
    'Otevřete Přidat výdaj a vyplňte název a částku přesně tak, jak je na účtence, samotné číslo, ne jeho přepočet.',
  'help.guide.expense-currency.step.2':
    'Otevřete Měna a vyberte měnu účtenky. Seznam nese každý kód, který TREK zná, a dá se v něm hledat: napište ta tři písmena.',
  'help.guide.expense-currency.step.3':
    'Pod poli se objeví řádek s tím, jakou má částka hodnotu právě teď, označený aktuální kurz. Je to náhled, ne to, co se uloží.',
  'help.guide.expense-currency.step.4':
    'Klikněte na Přidat výdaj. Kurz se v tu chvíli zmrazí: od teď má tento výdaj hodnotu, jakou měl v den, kdy jste ho zadali.',
  'help.guide.expense-currency.step.5':
    'V knize nese řádek pod názvem obě čísla: to, co jste napsali, šipku a to, jak se počítá v měně cesty. Každý celek, zůstatek a vyrovnání výše používá to druhé.',
  'help.guide.expense-currency.result':
    'Výdaj si drží částku a měnu, které jste napsali. Kniha ukazuje obojí a celky a zůstatky cesty zůstávají v měně cesty.',
  'help.guide.expense-currency.tip.1':
    'Kurz se zmrazí ve chvíli, kdy uložíte, takže vyrovnaný dluh se neotevře znovu jen proto, že se trh týden nato pohnul. Nový kurz zmrazí jedině změna měny výdaje.',
  'help.guide.expense-currency.tip.2':
    'Zobrazovaná měna v Nastavení mění jen to, co čtete; uložené částky se nikdy nehnou. Když ji necháte prázdnou, každá cesta se ukazuje ve své vlastní měně.',
  'help.guide.expense-currency.tip.3':
    'Samotná měna cesty žije na cestě, pod Upravit cestu, a vyžaduje právo Upravit detaily výletu. Její změna znovu ukotví každý zmrazený kurz, místo aby částky přepočítala na jinou měnu.',
  // filter-costs
  'help.guide.filter-costs.title': 'Najít výdaj nebo útratu jednoho dne',
  'help.guide.filter-costs.goal': 'Zužte dlouhou knihu na to, co opravdu hledáte.',
  'help.guide.filter-costs.step.1': 'Pište do Hledat výdaje… nad seznamem. Hledá v názvu výdaje, jak píšete.',
  'help.guide.filter-costs.step.2':
    'Všechny kategorie otevřou těch čtrnáct kategorií. Vyberte jednu a zůstanou jen výdaje té kategorie.',
  'help.guide.filter-costs.step.3':
    'Všechny dny vypisují každý den, ve kterém se něco utratilo. Vyberte jeden a pruh nahradí hlavičky dnů tím dnem, tím, kolik výdajů drží, a jeho celkem.',
  'help.guide.filter-costs.step.4':
    'Přepínač Vše / Zaplaceno mnou / Dluží mi je váš vlastní pohled na knihu: za co jste dali peníze a na čem jste pořád ze svého.',
  'help.guide.filter-costs.step.5':
    'Exportovat CSV na konci řádku zapíše každý výdaj do souboru, s původní částkou, její měnou a přepočtenou částkou.',
  'help.guide.filter-costs.result':
    'Filtry se kombinují a skupiny dnů se překreslí s vlastními celky pro to, co zbude.',
  'help.guide.filter-costs.tip.1':
    'Zapsané platby nenesou název ani kategorii, takže je hledání nebo filtr kategorií skryje. Filtr dnů je nechá, pod dnem, kdy byla platba zapsána.',
  'help.guide.filter-costs.tip.2':
    'Exportovat CSV vždy vyexportuje každý výdaj, ať je na obrazovce filtrováno cokoli, jeden řádek na výdaj.',
  // settle-up
  'help.guide.settle-up.title': 'Spočítat, kdo komu dluží, a vyrovnat to',
  'help.guide.settle-up.goal':
    'Proměňte hromadu sdílených výdajů v nejmenší počet převodů, které všechny vyrovnají, a zapisujte je, jak se dějí.',
  'help.guide.settle-up.step.1':
    'Karta Vyrovnat v pravém sloupci vypisuje převody, které by všechny vyrovnaly: kdo komu platí a kolik. Číslo vedle názvu je to, kolik jich je ještě otevřených.',
  'help.guide.settle-up.step.2':
    'Vyrovnat vedle převodu ho zapíše jako hotový. Ten tok zmizí z karty a zůstatky se překreslí.',
  'help.guide.settle-up.step.3':
    'Zapsaný převod je řádek v knize, pod dnem, kdy se stal, označený Platba, se dvěma cestovateli a částkou.',
  'help.guide.settle-up.step.4':
    'Vedle toho řádku tužka platbu opraví a Vrátit zpět ji vezme zpátky, a převod se vrátí na kartu Vyrovnat.',
  'help.guide.settle-up.step.5':
    'Přidat platbu v hlavičce karty zapíše převod, který nešel podle návrhu. Vyberte Od a Komu, částku, její měnu a den, kdy se stal.',
  'help.guide.settle-up.step.6':
    'Vyrovnat v hlavičce nahoře na obrazovce zapíše všechny otevřené převody najednou, tak, jak se parta vyrovná na konci cesty.',
  'help.guide.settle-up.result':
    'Každý zapsaný převod je řádek v knize a o řádek méně na kartě Vyrovnat. Když na kartě stojí Všichni jsou vyrovnáni, je cesta zaplacená.',
  'help.guide.settle-up.tip.1':
    'Karta ukazuje nejmenší počet převodů, ne každý dluh: tři lidé, kteří si dluží dokola, se složí do jedné nebo dvou plateb.',
  'help.guide.settle-up.tip.2':
    'Vyrovnat zapíše převod, nepřesune peníze. Pošlete je tak, jak to děláte, a pak na to klikněte.',
  'help.guide.settle-up.tip.3':
    'Platba může být v jakékoli měně, takže zaplatit dluh v jenech eury je normální: dialog má vlastní výběr měny a i ten kurz zmrazí.',
  // final-budget
  'help.guide.final-budget.title': 'Zjistit, co cesta stála každého cestovatele',
  'help.guide.final-budget.goal': 'Přečtěte stranu knihy na osobu: dnešní zůstatek a skutečný náklad na osobu.',
  'help.guide.final-budget.step.1':
    'Zůstatky ukazují pozici každého cestovatele: zelený pruh doprava, když cesta dluží jemu, červený pruh doleva, když dluží on jí, a částku vedle jména.',
  'help.guide.final-budget.step.2':
    'Konečný rozpočet pod tím odpovídá na jinou otázku: ne kdo teď co dluží, ale co cesta stojí každého cestovatele, až bude všechno vráceno.',
  'help.guide.final-budget.step.3':
    'Klikněte na jméno a otevře se počet: Zaplacené výdaje, pak Náhrady netto a Nevyřízené náhrady pod tím.',
  'help.guide.final-budget.step.4':
    'Pod každým řádkem sedí řádky, ze kterých je složený: výdaje, které ten cestovatel zaplatil, už zapsané převody a ty, které jsou ještě otevřené. Dávají dohromady přesně řádek nad sebou.',
  'help.guide.final-budget.result':
    'Zůstatky jsou to, kdo je dnes v plusu nebo v mínusu; Konečný rozpočet je to, co cesta nakonec stojí každého z vás, až bude všechno vráceno.',
  'help.guide.final-budget.tip.1':
    'Zapsání platby nikomu nezmění konečný rozpočet. Jen přesune částku z nevyřízených náhrad do náhrad netto.',
  'help.guide.final-budget.tip.2':
    'Výdaj bez plátce zůstává mimo obě karty, stejně jako zůstává mimo návrhy vyrovnání.',
  // expense-from-booking
  'help.guide.expense-from-booking.title': 'Udělat z rezervace výdaj',
  'help.guide.expense-from-booking.goal':
    'Připojte to, co let, hotel nebo místo opravdu stálo, k záznamu, ke kterému to patří.',
  'help.guide.expense-from-booking.step.1':
    'Otevřete rezervaci na kartě Doprava nebo Rezervace a klikněte na její tužku.',
  'help.guide.expense-from-booking.step.2':
    'Sjeďte k bloku Náklady dole ve formuláři. Nabízí Vytvořit výdaj, který nejdřív uloží rezervaci, a Propojit stávající výdaj pro výdaj, který už v Nákladech je.',
  'help.guide.expense-from-booking.step.3':
    'Klikněte na Vytvořit výdaj. Rezervace se uloží, formulář se zavře a otevře se editor Náklady s názvem rezervace jako názvem a s jejím typem už přiřazeným ke kategorii.',
  'help.guide.expense-from-booking.step.4':
    'Vyplňte částku a její měnu, kdo zaplatil, a rozdělení jako u každého výdaje a uložte. Když teď rezervaci otevřete znovu, ukáže výdaj pod Propojené výdaje, s tužkou na úpravu, Odpojit, výdaj ponechat na uvolnění a košem na odebrání.',
  'help.guide.expense-from-booking.result':
    'Rezervace nese svůj náklad a výdaj je obyčejný řádek na kartě Náklady, s plátcem, rozdělením a měnou jako každý jiný.',
  'help.guide.expense-from-booking.tip.1':
    'Smazání rezervace smaže i její propojené výdaje. Odebrat výdaj v bloku Náklady rezervace dělá opak: výdaj zmizí, rezervace zůstane. Odpojit, výdaj ponechat zachová obojí.',
  'help.guide.expense-from-booking.tip.2':
    'Místo má ve svém formuláři stejný blok, kde Vytvořit výdaj nejdřív uloží místo.',

  // ── Screen: trip-transports ───────────────────────────────────────────────────────────
  'help.ctx.trip-transports.title': 'Doprava',
  'help.ctx.trip-transports.summary':
    'Vše, co vás veze mezi zastávkami: lety, vlaky, autobusy, auta, taxi, kola, plavby, trajekty a spojení veřejné dopravy, která pro vás TREK vyhledá. Karta je jejich seznamem; vznikají a čtou se také v plánu a kreslí se na mapě.',
  'help.ctx.trip-transports.bullet.1':
    'Karta obsahuje pouze přepravu. Ubytování, restaurace, akce a vstupenky patří na kartu Rezervace, takže se stejný záznam nikdy neobjeví dvakrát.',
  'help.ctx.trip-transports.bullet.2':
    'Lišta nástrojů je všechny počítá pod položkou Vše a každému použitému typu dává vlastní štítek s vlastním počtem: Let, Vlak, Auto, Veřejná doprava. Tlačítko Doprava vpravo přidá jednu ručně.',
  'help.ctx.trip-transports.bullet.3':
    'Karty přicházejí ve třech skupinách, z nichž každou lze složit jejím nadpisem: Automatické spojení MHD pro spojení naplánovaná vyhledáváním, poté Čeká na potvrzení a nakonec Potvrzeno.',
  'help.ctx.trip-transports.bullet.4':
    'Karta nese stav, typ, dny, přes které se táhne, časy, Rezervační kód, trasu a Leteckou společnost a Číslo letu nebo Číslo vlaku, Nástupiště a Sedadlo. Tužka ji otevře, koš ji po dotazu smaže.',
  'help.ctx.trip-transports.bullet.5':
    'Přeprava vzniká i v plánu: každá hlavička dne má plus pro Přidat dopravu a tlačítko tramvaje pro Veřejnou dopravu a spojnice s dobou cesty mezi dvěma zastávkami otevře stejné vyhledávání pro tento jeden úsek.',
  'help.ctx.trip-transports.bullet.6':
    'Přeprava s oběma nastavenými konci kreslí na mapě čáru. Ikona trasy v jejím řádku v plánu dne tuto čáru zapne a Zobrazit všechny trasy rezervací na liště nad dny přepne celou cestu.',
  // transports-list
  'help.guide.transports-list.title': 'Jak číst kartu Doprava',
  'help.guide.transports-list.goal': 'Vědět, co vám seznam říká, dříve než na něm něco změníte.',
  'help.guide.transports-list.step.1':
    'Doprava je druhá karta cesty. Obsahuje pouze přepravu: hotely, restaurace, akce a vstupenky jsou na kartě Rezervace.',
  'help.guide.transports-list.step.2':
    'Lišta nástrojů počítá veškerou přepravu pod položkou Vše a každému použitému typu dává vlastní štítek s vlastním počtem. Kliknutím na štítek ponecháte pouze tento typ, dalším kliknutím jej pustíte. Zapnuto může být několik štítků najednou a Vše je vymaže.',
  'help.guide.transports-list.step.3':
    'Automatické spojení MHD je vlastní skupina, spojení naplánovaná vyhledáváním veřejné dopravy. Čeká na potvrzení a Potvrzeno obsahují vše zadané ručně. Šipka vedle nadpisu skupinu složí.',
  'help.guide.transports-list.step.4':
    'Karta řekne vše: stavová tečka s Čeká na potvrzení nebo Potvrzeno, typ, dny, přes které se táhne, s jejich daty, časy, Rezervační kód, trasa a Letecká společnost a Číslo letu nebo Číslo vlaku, Nástupiště a Sedadlo.',
  'help.guide.transports-list.step.5':
    'Tužka otevře přepravu k úpravám, koš ji smaže, po dotazu, který pojmenuje, co zmizí.',
  'help.guide.transports-list.result':
    'Seznam je zúžený na to, co jste hledali, a každá karta na první pohled říká, zda je jízda rezervovaná.',
  'help.guide.transports-list.tip.1':
    'Štítky a složené skupiny se pamatují zvlášť pro každou cestu, takže se karta otevře tak, jak jste ji opustili.',
  'help.guide.transports-list.tip.2':
    'Importovat ze souboru a AirTrail se na liště připojí k tlačítku Doprava jen tehdy, když server umí číst potvrzení rezervací a když je připojena instance AirTrail. Bez nich se seznam plní ručně a vyhledáváním veřejné dopravy.',
  // add-transport
  'help.guide.add-transport.title': 'Přidat dopravu ke dni',
  'help.guide.add-transport.goal': 'Vložit jízdu, která vás dostane z jedné zastávky na další, do dne, kdy se koná.',
  'help.guide.add-transport.step.1':
    'Každá hlavička dne nese vpravo čtyři malá tlačítka. Klikněte na plus, jehož popisek zní Přidat dopravu. Formulář se otevře s Datem již nastaveným na tento den.',
  'help.guide.add-transport.step.2':
    'Typ rezervace vybírá, čím jedete: Let, Vlak, Autobus, Auto, Taxi, Kolo, Plavba, Trajekt nebo Ostatní. Formulář se přizpůsobí. Let dostane letiště na každém úseku, vlak řetězec stanic, auto názvy Vyzvednutí a Vrácení a Zastávky po cestě.',
  'help.guide.add-transport.step.3':
    'Název je jediné pole, které musí být vyplněno; bez něj zůstane Přidat šedé. Napište to, co byste poznali na tabuli na nástupišti.',
  'help.guide.add-transport.step.4':
    'Z a Do hledají stanici, přístav nebo adresu. Napište alespoň tři písmena a vyberte výsledek ze seznamu. Název, který byl jen napsán, nenese žádné souřadnice, takže na mapě nic nenakreslí.',
  'help.guide.add-transport.step.5':
    'Datum a Čas začátku říkají, kdy jede, Datum konce a Čas konce, kdy je po ní; jízda, která přistává následující den, tam má další den. Rezervační kód, Stav s hodnotou Čeká na potvrzení nebo Potvrzeno a Poznámky jsou nepovinné.',
  'help.guide.add-transport.step.6': 'Klikněte na Přidat.',
  'help.guide.add-transport.result':
    'Přeprava je řádkem ve dni, ve svém čase mezi zastávkami, a kartou na kartě Doprava pod Čeká na potvrzení nebo Potvrzeno.',
  'help.guide.add-transport.tip.1':
    'Řádek přistane tam, kam jej položí jeho čas začátku, za poslední zastávkou, která začíná dříve. Úchyt jej přetáhne kamkoli jinam ve dni nebo na jiný den.',
  'help.guide.add-transport.tip.2':
    'Přiložit soubor v sekci Soubory přijme jízdenku a Vytvořit výdaj v sekci Náklady uloží rezervaci a otevře editor Náklady pro jízdné.',
  'help.guide.add-transport.tip.3':
    'Cestující označuje, kdo jede. Jakmile má jedna přeprava cestující, liště karty narostou jejich avatary a filtruje podle nich seznam.',
  // plan-transit
  'help.guide.plan-transit.title': 'Naplánovat spojení veřejnou dopravou',
  'help.guide.plan-transit.goal':
    'Nechat TREK vyhledat skutečné vlaky a autobusy mezi dvěma body dne a vložit do plánu ten, který vyberete.',
  'help.guide.plan-transit.step.1':
    'V hlavičce dne klikněte na tlačítko tramvaje, Veřejná doprava. Vyhledávání se otevře pro tento den.',
  'help.guide.plan-transit.step.2':
    'Odkud a Kam přijímají zastávku nebo stanici. Dokud je pole prázdné, nabízejí se vlastní zastávky dne a ubytování cesty; napsáním dvou písmen se místo toho prohledají stanice jízdního řádu. Prohodit mezi oběma poli otočí spojení.',
  'help.guide.plan-transit.step.3':
    'Odjezd nebo Příjezd s časem říkají, kdy chcete cestovat, a Nejlepší spojení, Méně přestupů nebo Méně chůze říkají, jak mají být odpovědi seřazeny.',
  'help.guide.plan-transit.step.4':
    'Štítky níže říkají, které prostředky se smějí použít: Vlak, Metro, Tramvaj, Autobus, Trajekt a Lanovka. Vypnutím jeden vynecháte, alespoň jeden zůstane zapnutý. Potom klikněte na Hledat.',
  'help.guide.plan-transit.step.5':
    'Každý výsledek uvádí odjezd a příjezd, jak dlouho trvá, kolik je přestupů a kolik chůze, a linky v jejich vlastních barvách. Kliknutím jej rozbalíte zastávku po zastávce, s nástupišti a s úseky pěšky mezi linkami.',
  'help.guide.plan-transit.step.6': 'Klikněte na Přidat ke dni.',
  'help.guide.plan-transit.result':
    'Spojení je řádkem ve dni se svými linkami, přestupy a dobou chůze, a kartou na kartě Doprava pod Automatické spojení MHD.',
  'help.guide.plan-transit.tip.1':
    'Spojení pocházejí z Transitous, bezplatné komunitní služby nad veřejnými daty jízdních řádů: žádný klíč, žádný účet. Správce může vyhledávání místo toho nasměrovat na Google.',
  'help.guide.plan-transit.tip.2':
    'Nic nenalezeno? Zdroje pokrývají region a období. Zkuste jiný čas, zapněte více prostředků nebo vyberte stanici místo samotného místa. Zpráva pojmenuje službu, která odpověděla.',
  'help.guide.plan-transit.tip.3':
    'Stejné vyhledávání se otevře pro jediný úsek: klikněte na spojnici s dobou cesty mezi dvěma zastávkami a zvolte Veřejná doprava. Odkud, Kam a čas odjezdu se vyplní za vás.',
  // change-transit-route
  'help.guide.change-transit-route.title': 'Otevřít a změnit naplánované spojení',
  'help.guide.change-transit-route.goal':
    'Přečíst spojení zastávku po zastávce, přejmenovat je nebo trasu vyhledat znovu.',
  'help.guide.change-transit-route.step.1':
    'Na kartě Doprava sedí naplánovaná spojení pod Automatické spojení MHD. Klikněte na kartu.',
  'help.guide.change-transit-route.step.2':
    'Doba trvání, Přestupy a Chůze sedí nahoře. Itinerář pod nimi projde spojení zastávku po zastávce, s nástupišti a s úseky pěšky mezi linkami.',
  'help.guide.change-transit-route.step.3':
    'Změnit trasu spustí vyhledávání znovu, již vyplněné oběma konci tohoto spojení a jeho dnem.',
  'help.guide.change-transit-route.step.4':
    'Vyberte jiné spojení a klikněte na Přidat ke dni; zaujme místo toho starého. Upravit podrobnosti vedle Změnit trasu otevře místo toho běžný formulář dopravy, kde žijí Rezervační kód, Stav, cestující a soubory.',
  'help.guide.change-transit-route.result':
    'Okno Cesta veřejnou dopravou nese nový Itinerář a jeho karta na kartě Doprava ukazuje nové linky a časy.',
  'help.guide.change-transit-route.tip.1':
    'Název v okně Cesta veřejnou dopravou je jen text: tužka vedle něj jej přejmenuje, aniž by se dotkla trasy. Poznámky pod ním přijímají markdown a mají kartu Upravit a Náhled.',
  'help.guide.change-transit-route.tip.2':
    'Smazat na patě okna Cesta veřejnou dopravou vyjme spojení z cesty; den si ponechá své zastávky.',
  // leg-travel-mode
  'help.guide.leg-travel-mode.title': 'Změnit způsob cesty na jednom úseku',
  'help.guide.leg-travel-mode.goal':
    'Jít pěšky jeden úsek dne, který se jinak jede autem, nebo tento úsek předat vyhledávání veřejné dopravy.',
  'help.guide.leg-travel-mode.step.1':
    'Spojnice mezi zastávkami se objeví teprve tehdy, když je zapnutá Trasa dne. Kliknutím na den jej otevřete, potom klikněte na Trasa pod jeho zastávkami.',
  'help.guide.leg-travel-mode.step.2':
    'Každá spojnice pojmenuje dobu cesty a vzdálenost tohoto úseku s ikonou způsobu, kterým byla trasa spočítána: auto pro jízdu autem, chodidlo pro chůzi.',
  'help.guide.leg-travel-mode.step.3':
    'Klikněte na spojnici. Nabídka nabízí Autem a Pěšky, Veřejná doprava a Použít výchozí dne.',
  'help.guide.leg-travel-mode.step.4':
    'Zvolte Pěšky. Změní se pouze tento úsek; zbytek dne si ponechá svůj vlastní způsob.',
  'help.guide.leg-travel-mode.result':
    'Úsek ukazuje ikonu chodidla a svůj čas chůze a ostatní úseky dne si ponechají způsob dne.',
  'help.guide.leg-travel-mode.tip.1':
    'Způsob patří úseku, nikoli dni: tlačítka Autem a Pěšky celého dne nikdy nepřepíšou úsek, který jste nastavili ručně. Použít výchozí dne jim úsek vrátí.',
  'help.guide.leg-travel-mode.tip.2':
    'Veřejná doprava ve stejné nabídce otevře vyhledávání spojení přesně pro tento úsek, s oběma konci a časem odjezdu již vyplněnými.',
  'help.guide.leg-travel-mode.tip.3':
    'Časy pocházejí z veřejného plánovače tras nad skutečnými silnicemi a pěšinami. Úsek, na který neumí odpovědět, si ponechá svou přímou čáru a neukáže žádný čas.',
  // edit-transport
  'help.guide.edit-transport.title': 'Změnit nebo smazat dopravu',
  'help.guide.edit-transport.goal': 'Opravit čas, nástupiště nebo rezervační kód, nebo jízdu z cesty odebrat.',
  'help.guide.edit-transport.step.1': 'V plánu dne je doprava barevným řádkem mezi zastávkami. Klikněte na něj.',
  'help.guide.edit-transport.step.2':
    'Formulář je ten, který ji vytvořil, s nápisem Upravit dopravu v záhlaví. Změnit lze vše: typ, trasu, dny a časy, Rezervační kód, Stav.',
  'help.guide.edit-transport.step.3':
    'Trasa letu je řetězec letišť, trasa vlaku řetězec stanic. Přidat zastávku vloží mezi ně další a každý úsek si ponechá vlastní časy a vlastní číslo letu nebo vlaku.',
  'help.guide.edit-transport.step.4':
    'Klikněte na Aktualizovat. Chcete-li dopravu odstranit úplně, použijte koš na její kartě na kartě Doprava a potvrďte.',
  'help.guide.edit-transport.result':
    'Změna se projeví všude, kde se doprava objevuje: na kartě Doprava, ve dni, kdy jede, a na její čáře na mapě.',
  'help.guide.edit-transport.tip.1':
    'Stejný formulář se otevře z obou stran, tužkou na kartě na kartě Doprava i vlastním řádkem dopravy v plánu dne. Výjimkou je naplánované spojení veřejnou dopravou: jeho řádek otevře okno Cesta veřejnou dopravou a Upravit podrobnosti tam vede k tomuto formuláři.',
  'help.guide.edit-transport.tip.2':
    'Přesun dopravy na jiný den formulář vůbec nepotřebuje: přetáhněte její řádek z jedné karty dne na druhou.',
  // transport-on-map
  'help.guide.transport-on-map.title': 'Nakreslit dopravu na mapě',
  'help.guide.transport-on-map.goal': 'Podívat se, kudy let, jízda nebo spojení skutečně vede.',
  'help.guide.transport-on-map.step.1':
    'Doprava s oběma nastavenými konci nese ve svém řádku v plánu dne malou ikonu trasy. Klikněte na ni; její popisek se změní na Skrýt trasy rezervací.',
  'help.guide.transport-on-map.step.2':
    'Trasa se nakreslí na mapě a na každém konci je oválná značka nesoucí ikonu dopravy.',
  'help.guide.transport-on-map.step.3':
    'Kliknutím na koncovou značku si přečtete rezervaci, aniž byste opustili mapu: časy, Leteckou společnost a Číslo letu, Rezervační kód a adresu. Zavřít panel odloží.',
  'help.guide.transport-on-map.step.4':
    'Ikona trasy na liště nad dny zvládne celou cestu najednou: Zobrazit všechny trasy rezervací a Skrýt všechny trasy rezervací pro jejich opětovné vymazání.',
  'help.guide.transport-on-map.step.5':
    'Naplánované spojení veřejnou dopravou nemá vlastní ikonu. Kreslí se přepínačem Trasa daného dne, a proto je Skrýt všechny trasy rezervací nevymaže, dokud je trasa toho dne stále zapnutá.',
  'help.guide.transport-on-map.result':
    'Trasy jsou na mapě se značkou na každém konci a zůstanou tam, dokud je znovu nevypnete.',
  'help.guide.transport-on-map.tip.1':
    'Let, plavba a trajekt se kreslí jako oblouk, auto, autobus, taxi a kolo sledují skutečné silnice a vlak nebo naplánované spojení vede přes stanice, ve kterých zastavuje.',
  'help.guide.transport-on-map.tip.2':
    'Potvrzená rezervace je plná čára, ta čekající na potvrzení čárkovaná. Nastavení Popisky tras rezervací vytiskne do koncových značek kód letiště nebo název stanice.',
  'help.guide.transport-on-map.tip.3':
    'Zobrazit všechny trasy rezervací je čistý štít, nikoli vrstva: zahodí to, co nastavily jednotlivé ikony, takže dvojí stisknutí vám nechá vše zapnuté nebo vše vypnuté.',
  // import-transport-file
  'help.guide.import-transport-file.title': 'Přečíst let z jeho e-ticketu',
  'help.guide.import-transport-file.goal':
    'Nechte TREK vytáhnout let, vlak nebo trajekt z jízdenky, kterou dopravce poslal, a zkontrolujte ho, než se uloží.',
  'help.guide.import-transport-file.step.1':
    'Klikněte na Importovat ze souboru v liště nástrojů karty Doprava, vedle tlačítka Doprava. Otevře se Importovat potvrzení rezervace, stejný dialog, jaký má karta Rezervace.',
  'help.guide.import-transport-file.step.2':
    'Pusťte jízdenku na to pole, nebo na ně klikněte a vyberte ji: EML, PDF, PKPass, HTML a TXT, až pět souborů po 10 MB. Soubory, které jste vybrali, jsou na poli vypsané jménem.',
  'help.guide.import-transport-file.step.3': 'Klikněte na Importovat. Dialog se hned zavře; čtení běží na pozadí.',
  'help.guide.import-transport-file.step.4':
    'Karta vpravo dole hlásí průběh pod názvem souboru. Zpracování souborů… se změní v zaškrtnutí, když je čtení hotové, a karta nabídne Importovat. Klikněte na to.',
  'help.guide.import-transport-file.step.5':
    'Let se otevře v Přidat dopravu, už vyplněný: Typ rezervace na Let, letecká společnost a číslo letu v Název, obě letiště pod Trasa s Odlet a Přílet, jejich časy a jejich časová pásma, Letecká společnost a Číslo letu, Rezervační kód a jízdenka pod Soubory. Zkontrolujte to a klikněte na Přidat.',
  'help.guide.import-transport-file.result':
    'Let je karta v Čeká na potvrzení na kartě Doprava a řádek ve dni, kdy odlétá, s jízdenkou pod Soubory, a se dvěma známými letišti kreslí na mapě svůj oblouk.',
  'help.guide.import-transport-file.tip.1':
    'Obě karty sdílejí jeden import: soubor, který drží let i hotel, otevře let v Přidat dopravu a hotel v Nová rezervace, jeden po druhém, ať jste začali z kterékoli karty.',
  'help.guide.import-transport-file.tip.2':
    'Letiště se umisťují podle kódu. Nádraží nebo přístav, které čtení nedokázalo najít, je na kartě pojmenované oranžově; vyberte ho ručně pod Trasa, než kliknete na Přidat, jinak doprava na mapě nic nenakreslí.',
  // airtrail-import
  'help.guide.airtrail-import.title': 'Importovat lety z AirTrail',
  'help.guide.airtrail-import.goal':
    'Přeneste lety, které už vedete v AirTrail, do cesty naráz a nechte je od té chvíle sledovat AirTrail.',
  'help.guide.airtrail-import.step.1':
    'Se zapnutým doplňkem AirTrail a vaší instancí připojenou pod Integrace v Nastavení nese lišta nástrojů karty Doprava tlačítko AirTrail vedle tlačítka Doprava. Klikněte na něj.',
  'help.guide.airtrail-import.step.2':
    'Import z AirTrail vypíše lety vašeho účtu ve dvou skupinách. Během tohoto výletu drží ty s datem uvnitř cesty, už zaškrtnuté; Ostatní lety drží zbytek, nezaškrtnutý. Let, který už v cestě je, je zašedlý a označený Importováno.',
  'help.guide.airtrail-import.step.3':
    'Každý řádek je zaškrtávací políčko s leteckou společností a číslem letu, oběma letišti a datem. Kliknutím na řádek let vezmete, nebo ho vynecháte; ty pod Ostatní lety přijdou jen tehdy, když je zaškrtnete.',
  'help.guide.airtrail-import.step.4':
    'Lety, které na sebe navazují, každý odlétá z letiště, na kterém předchozí přistál, do jednoho dne, jsou orámované dohromady. Zaškrtnutí pod nimi, Importovat jako jeden let s přestupem v tom letišti, je už zapnuté: nechte ho zapnuté pro jednu rezervaci s mezipřistáním, nebo ho vypněte a importujte úseky jako samostatné lety.',
  'help.guide.airtrail-import.step.5':
    'Klikněte na Importovat. Tlačítko počítá zaškrtnuté lety a zpráva potom řekne, kolik jich přišlo.',
  'help.guide.airtrail-import.step.6':
    'Lety jsou karty pod Potvrzeno, každá s modrým odznakem AirTrail vedle svého stavu, a řádky ve dnech, kdy letí. Spojený přestup je jedna karta, s trasou vedoucí přes mezipřistání.',
  'help.guide.airtrail-import.result':
    'Lety z AirTrail jsou karty na kartě Doprava a řádky ve svých dnech, každý s odznakem AirTrail, který říká, odkud přišel.',
  'help.guide.airtrail-import.tip.1':
    'Let, který v cestě už je pod stejným číslem a datem, se přeskočí a zpráva řekne, kolik jich bylo. Zpět v liště nástrojů nad dny vezme celý import zpátky.',
  'help.guide.airtrail-import.tip.2':
    'AirTrail zůstává zdrojem pravdy. TREK čte jeho změny, když cestu otevřete, a každých pár minut na pozadí; let, který tam smažete, si nechá svou kartu, s odznakem změněným na Nesynchronizováno. Úpravy udělané v TREKu putují zpět jen se zapnutým Zapisovat změny zpět do AirTrail pod Integrace.',
  'help.guide.airtrail-import.tip.3':
    'Spojený přestup nemá žádný jediný let AirTrail, který by sledoval, takže je to jednorázový import: nechá si modrý odznak a najetí na odznak to řekne. Totéž se stane synchronizovanému letu, kterému ručně dáte mezipřistání.',

  // ── Screen: trip-roadtrip ─────────────────────────────────────────────────────────────
  'help.ctx.trip-roadtrip.title': 'Cesta autem',
  'help.ctx.trip-roadtrip.summary':
    'Plán čtený jako jedna jízda: stejné dny a stejná místa, spojená do zastávek s jízdou mezi nimi, v pásu v levém sloupci a na mapě. Říká, jak daleko a jak dlouho, kde dojde palivo a co je u cesty.',
  'help.ctx.trip-roadtrip.bullet.1':
    'Dny a Cesta autem nahoře v levém sloupci přepínají mezi plánem dnů a jízdou. Nic se nekopíruje a nic se nemění: Dny vrátí plán přesně takový, jaký byl.',
  'help.ctx.trip-roadtrip.bullet.2':
    'Hlava pásu sčítá celou cestu: Vzdálenost, Doba jízdy a Zastávky. Pod ní je jedna karta na den, s kilometry toho dne, s tím, pro kolik zastávek je, co překračuje, a s odznakem Stopa.',
  'help.ctx.trip-roadtrip.bullet.3':
    'Číslovaná zastávka je místo, pro které den je. Zastávka po cestě, palivo, nabíjení, odpočívadlo, nese místo čísla ikonu svého druhu a nepočítá se. Kliknutím na číslo změníte, čím je, a kliknutím na odznak Pobyt řeknete, jak dlouho trvá.',
  'help.ctx.trip-roadtrip.bullet.4':
    'Mezi dvěma zastávkami udává pruh jízdy úsek jako vzdálenost a čas. Kliknutím na něj otevřete Trasy tohoto úseku, nebo klikněte na vykreslenou trasu na mapě a ohněte úsek přes průjezdní bod.',
  'help.ctx.trip-roadtrip.bullet.5':
    'Pravý sloupec se změní na Podél trasy: vyberte den, co hledat a jak široký je koridor, a pak Hledat. Přidat položí nález na jízdu v místě, kudy se opravdu jede.',
  'help.ctx.trip-roadtrip.bullet.6':
    'Nastavení jízdy pod ním drží limity, auto a jeho dojezd, denní časy cestování, čemu se vyhnout a jak se kreslí čára. Patří k cestě, takže všichni plánují se stejným autem.',
  // roadtrip-mode
  'help.guide.roadtrip-mode.title': 'Přečíst cestu jako jednu jízdu',
  'help.guide.roadtrip-mode.goal': 'Přepněte plán do režimu cesty autem a přečtěte si, co vám pás říká.',
  'help.guide.roadtrip-mode.step.1':
    'Klikněte na Cesta autem v přepínači Dny a Cesta autem nahoře v levém sloupci. Plán dnů vystřídá jízda a mapa vykreslí každý den, který má trasu.',
  'help.guide.roadtrip-mode.step.2': 'Hlava pásu sčítá celou cestu: Vzdálenost, Doba jízdy a Zastávky.',
  'help.guide.roadtrip-mode.step.3':
    'Pod ní je jedna karta na den. Její záhlaví nese číslo a datum dne, jízdu jako vzdálenost a čas, a pro kolik zastávek den je.',
  'help.guide.roadtrip-mode.step.4':
    'Uvnitř karty je den řetězem: číslovaná zastávka na každé místo, pruh jízdy mezi každou dvojicí a čas příjezdu u pravého okraje.',
  'help.guide.roadtrip-mode.step.5':
    'Kliknutím na záhlaví dne den sbalíte. Sbalený den zmizí i z mapy; dalším kliknutím na záhlaví ho vrátíte.',
  'help.guide.roadtrip-mode.result':
    'Levý sloupec je jízda a mapa ukazuje každý její den. Dny přepnou rovnou zpět na plán, nezměněný.',
  'help.guide.roadtrip-mode.tip.1':
    'Volba se pamatuje pro každou cestu, dokud je karta prohlížeče otevřená, takže po načtení se vrátíte k jízdě.',
  'help.guide.roadtrip-mode.tip.2':
    'Přepínač existuje, až když správce zapne doplněk Cesta autem, pod Doplňky v Administraci.',
  'help.guide.roadtrip-mode.tip.3':
    'Na telefonu žádný přepínač není: doplněk přidá vlastní záložku Cesta autem vedle Plán.',
  // roadtrip-stops
  'help.guide.roadtrip-stops.title': 'Zastávky po cestě a jak dlouho stojíte',
  'help.guide.roadtrip-stops.goal':
    'Změňte místo na jízdě na zastávku po cestě a řekněte, jak dlouho každá zastávka trvá.',
  'help.guide.roadtrip-stops.step.1':
    'Klikněte v pásu na číslo před zastávkou. Jeho popisek je Změnit na zastávku po cestě a otevře Druh zastávky.',
  'help.guide.roadtrip-stops.step.2':
    'Vyberte druh: Ubytování, Palivo, Nabíjení, Odpočívadlo, Kemp, Jídlo nebo Zajímavosti. Z čísla se stane ikona toho druhu a zastávky pod ním se přečíslují.',
  'help.guide.roadtrip-stops.step.3': 'Zastávka po cestě není cíl, takže záhlaví dne počítá o jednu zastávku méně.',
  'help.guide.roadtrip-stops.step.4':
    'Klikněte na ikonu znovu, Změnit typ zastávky, a zvolte Zpět na cíl cesty, aby zastávka dostala číslo zpátky.',
  'help.guide.roadtrip-stops.step.5':
    'Každá zastávka nese odznak Pobyt. Kliknutím na něj otevřete Čas na této zastávce.',
  'help.guide.roadtrip-stops.step.6':
    'Nastavte délku posuvníkem, tlačítky minus a plus nebo jednou z přednastavených hodnot, sledujte, co dělají Prijezd a Odjezd, a klikněte na Uložit.',
  'help.guide.roadtrip-stops.result':
    'Zastávka, které jste dali čas, nese hodinu na svém odznaku Pobyt a každý příjezd po ní se s ním posunul, a ta, kterou jste poslali na druh a zpátky, je zase číslovaný cíl cesty.',
  'help.guide.roadtrip-stops.tip.1':
    'Pobyt patří k místu, ne k jedné návštěvě: u místa naplánovaného na dva dny se stojí stejně dlouho oba dny.',
  'help.guide.roadtrip-stops.tip.2':
    'Zastávky po cestě se ukazují i ve Dnech. Vypnutí Zobrazit také ve Dnech, pod Servisní zastávky v Nastavení jízdy, je nechá jen v Cestě autem.',
  'help.guide.roadtrip-stops.tip.3': 'Bez zastavky, ve stejném dialogu, čas zase odebere.',
  // roadtrip-corridor
  'help.guide.roadtrip-corridor.title': 'Najít palivo, jídlo a nocleh podél trasy',
  'help.guide.roadtrip-corridor.goal': 'Prohledejte silnici, po které opravdu jedete, a položte nález na správný úsek.',
  'help.guide.roadtrip-corridor.step.1': 'Vyberte den nahoře v Podél trasy. Nabízejí se jen dny, které mají trasu.',
  'help.guide.roadtrip-corridor.step.2':
    'Pod Hledá se zaškrtněte, co potřebujete. Palivo, Nabíjení, Odpočívadlo, Kemp, Ubytování, Jídlo a Zajímavosti lze kombinovat.',
  'help.guide.roadtrip-corridor.step.3':
    'Pod Do zvolte, jak daleko po obou stranách silnice hledat, 2 km, 5 km nebo 10 km, a pak klikněte na Hledat.',
  'help.guide.roadtrip-corridor.step.4':
    'Nálezy se vrátí seskupené podle druhu, v pořadí, v jakém je míjíte, každý s tím, jak daleko v dni leží a jak daleko je od trasy.',
  'help.guide.roadtrip-corridor.step.5':
    'Přidat u nálezu otevře Přidat jako zastávku. Říká, na který den a na kterou pozici zastávka padne, ptá se na druh a na čas na zastávce, a Přidat ji položí na jízdu.',
  'help.guide.roadtrip-corridor.result':
    'Nálezy jsou vypsané v pořadí, v jakém je míjíte, a vykreslené na mapě, a ten přidaný sedí na jízdě v místě, kudy se opravdu jede.',
  'help.guide.roadtrip-corridor.tip.1':
    'Nic se nehledá, dokud nestisknete Hledat: jeden běh je mnoho požadavků na sdílenou službu.',
  'help.guide.roadtrip-corridor.tip.2':
    'Filtrovat podle názvu zúží, co se vrátilo, bez dalšího dotazu, a Vymazat výsledky vyprázdní seznam i jeho špendlíky. Kliknutím na nález ho dostanete do zorného pole na mapě.',
  'help.guide.roadtrip-corridor.tip.3':
    'Nález lze také přetáhnout z mapy na vykreslenou trasu, čímž si sami vyberete úsek tam, kde se po stejné silnici jede dvakrát. Přidat ručně, vedle Hledat, místo toho vyhledá místo podle názvu.',
  // roadtrip-via
  'help.guide.roadtrip-via.title': 'Ohnout úsek přes průjezdní bod',
  'help.guide.roadtrip-via.goal': 'Pošlete úsek po silnici, kterou opravdu chcete, aniž byste k němu přidali zastávku.',
  'help.guide.roadtrip-via.step.1':
    'Dostaňte do zorného pole úsek, o který jde: klikněte v pásu na zastávku a pak zavřete kartu, která se otevře nad mapou.',
  'help.guide.roadtrip-via.step.2':
    'Klikněte na vykreslenou trasu. Na úsek, na který jste klikli, se položí průjezdní bod a úsek se přes něj naplánuje znovu.',
  'help.guide.roadtrip-via.step.3':
    'Pás jde za tím: záhlaví dne nese novou vzdálenost a dobu jízdy a každý příjezd po průjezdním bodu se s ním posune.',
  'help.guide.roadtrip-via.step.4':
    'Najeďte na úchyt a on řekne, co umí: Tažením změníte trasu, pravým tlačítkem odeberete. Přetáhněte ho jinam a úsek se překreslí přes nové místo.',
  'help.guide.roadtrip-via.step.5': 'Pravým tlačítkem na úchyt ho odeberete. Úsek zase jede přímou cestou.',
  'help.guide.roadtrip-via.result':
    'Úsek jde po silnici, kterou jste zvolili, a vzdálenost dne, doba jízdy i příjezdy se pro něj spočítají znovu.',
  'help.guide.roadtrip-via.tip.1':
    'Průjezdní bod není zastávka: nemá číslo, pobyt ani čas příjezdu a nepočítá se do zastávek dne.',
  'help.guide.roadtrip-via.tip.2':
    'Úchyty se kreslí od úrovně přiblížení 9, takže mapa přizpůsobená celé cestě ukazuje čáru bez nich.',
  'help.guide.roadtrip-via.tip.3':
    'Kliknutí dál než dva kilometry od jakéhokoli vykresleného úseku se ignoruje, stejně jako kliknutí na let, vlak nebo trajekt.',
  // roadtrip-alternatives
  'help.guide.roadtrip-alternatives.title': 'Zkusit jiný způsob, jak jet úsek',
  'help.guide.roadtrip-alternatives.goal': 'Podívejte se, co dalšího plánovač pro jeden úsek nabízí, a vezměte to.',
  'help.guide.roadtrip-alternatives.step.1':
    'Klikněte v pásu na pruh jízdy, řádek mezi dvěma zastávkami, který udává úsek jako vzdálenost a čas. Jeho popisek je Jiné trasy.',
  'help.guide.roadtrip-alternatives.step.2':
    'Nad mapou se otevřou Trasy tohoto úseku, jedna položka na silnici, každá vykreslená na mapě ve vlastní barvě.',
  'help.guide.roadtrip-alternatives.step.3':
    'Najetím na položku tu silnici rozsvítíte. Aktuální je silnice, po které se jede, a Nejrychlejší ta nejrychlejší; ostatní říkají, o kolik jsou pomalejší, nebo kterou třídu silnic vynechávají.',
  'help.guide.roadtrip-alternatives.step.4':
    'Kliknutím na položku pojedete tudy, nebo Zavřít ponechá silnici, na které jste.',
  'help.guide.roadtrip-alternatives.result':
    'Úsek jede po silnici, kterou jste zvolili, a vzdálenost v pásu i příjezdy po něm se s ní mění.',
  'help.guide.roadtrip-alternatives.tip.1':
    'Volba jiné silnice položí na úsek průjezdní bod a nahradí všechny, které už měl; volba vlastní silnice plánovače je zase odebere.',
  'help.guide.roadtrip-alternatives.tip.2':
    'Bez dalnice, Bez mytneho a Bez trajektu pocházejí z druhého motoru s vlastním modelem rychlosti, takže jejich časy nejsou srovnatelné s ostatními.',
  // roadtrip-limits
  'help.guide.roadtrip-limits.title': 'Nastavit auto a limity jízdy',
  'help.guide.roadtrip-limits.goal': 'Řekněte TREKu, čím jezdíte a jak daleko jste ochotni jet v kuse.',
  'help.guide.roadtrip-limits.step.1':
    'Nastavení jízdy sedí pod hledáním v pravém sloupci. Jeho odznaky říkají, co je nastaveno; kliknutím ho otevřete.',
  'help.guide.roadtrip-limits.step.2':
    'Pod Jízda jsou Nejdelší jízda v kuse a Jízda za den v minutách. Prázdné pole znamená vypnuto a nic se neoznačuje.',
  'help.guide.roadtrip-limits.step.3':
    'Pod Vozidlo řekněte, čím jezdíte. Palivo dotankuje jen u zastávek s palivem, Elektro jen u nabíjecích, Obojí u obou.',
  'help.guide.roadtrip-limits.step.4':
    'Dojezd na jednu nádrž, nebo Dojezd na nabití, napište sami. Spočítat z údajů auta pod tím vezme Objem nádrže a Spotřebu, nebo Baterii a Spotřebu, a spočítá to.',
  'help.guide.roadtrip-limits.step.5':
    'Vyhnout se, pokud to jde je preference, ne zákaz: den, který nemá kudy jinudy, silnici přesto použije a řekne to ve svém záhlaví.',
  'help.guide.roadtrip-limits.step.6':
    'Zavřete dialog. Karta říká, co je nastaveno, a pás označí každý úsek i každý den, který to překračuje.',
  'help.guide.roadtrip-limits.result':
    'Odznaky karty říkají, co je nastaveno, a každý úsek i den nad limitem nese v pásu odznak.',
  'help.guide.roadtrip-limits.tip.1':
    'Nastavení patří k cestě, takže všichni na ní plánují se stejným autem a stejnými limity.',
  'help.guide.roadtrip-limits.tip.2':
    'Natankovat na říká, na kolik se zastávka natankuje, protože na cestě nikdo nenabíjí na 100 %. Zastávka s palivem nebo nabíjením to pro sebe může přebít.',
  'help.guide.roadtrip-limits.tip.3':
    'Čára trasy rozhoduje, jak se jízda kreslí: Propojit dny naplánuje noc mezi dvěma dny a Barva na den dá každému dni vlastní.',
  // roadtrip-day-window
  'help.guide.roadtrip-day-window.title': 'Dát jízdnímu dni začátek a konec',
  'help.guide.roadtrip-day-window.goal': 'Přestaňte jezdit v hodinu, kterou zvolíte, a řekněte, kde má den skončit.',
  'help.guide.roadtrip-day-window.step.1': 'Otevřete Nastavení jízdy v pravém sloupci a najděte Denní časy cestování.',
  'help.guide.roadtrip-day-window.step.2':
    'Nastavte Začátek dne. Samo o sobě to nedělá nic: potřeba jsou oba časy, jak říká poznámka pod nimi.',
  'help.guide.roadtrip-day-window.step.3':
    'Nastavte Konec dne. Jízda se teď v tu hodinu zastaví a zbytek přenese na další ráno, jako řádek Konec dne a řádek Pokračovat v cestě v pásu.',
  'help.guide.roadtrip-day-window.step.4':
    'Pod Ukončení dne zvolte Na trase, aby se pauza udělala na silnici v čase konce, nebo Na posledním místě, aby se zastavilo dřív, než by ho další jízda minula.',
  'help.guide.roadtrip-day-window.step.5': 'Zavřete dialog. Karta Nastavení jízdy nese oba časy jako odznak.',
  'help.guide.roadtrip-day-window.result':
    'Jízda se rozřeže na cestovní dny té délky, kterou nastavíte, a co se nevejde, pokračuje na vypočtených dnech po tom posledním. Vaše dny a jejich místa se nemění.',
  'help.guide.roadtrip-day-window.tip.1':
    'Vymazání kteréhokoli z časů celou věc zase vypne. Časy, které jste na zastávce sami připnuli, mají vždy přednost.',
  'help.guide.roadtrip-day-window.tip.2':
    'S nastavenými denními časy cestování jsou dny vždy propojené: jízda z poslední zastávky jednoho dne k první zastávce dalšího se naplánuje a počítá.',
  'help.guide.roadtrip-day-window.tip.3':
    'Každý konec dne je i značka na mapě, měsíc s číslem dne. Přetáhněte ho po trase nebo na místo, aby den skončil jinde; pravým tlačítkem na něj vrátíte automatický konec a Obnovit automatické konce dnů v tomto dialogu vrátí všechny.',
  // roadtrip-refuel
  'help.guide.roadtrip-refuel.title': 'Natankovat dřív, než dojde palivo',
  'help.guide.roadtrip-refuel.goal': 'Najděte, kde natankovat na úseku, kam auto ještě dojede, a položte to na jízdu.',
  'help.guide.roadtrip-refuel.step.1':
    'S nastaveným dojezdem nakreslí pás přes úsek pruh tam, kde dojde: Tady dojde palivo, a pod ním, jak daleko v úseku to je.',
  'help.guide.roadtrip-refuel.step.2':
    'Lampa na pruhu je tlačítko. Najít palivo hledá podél silnice, kterou už máte za sebou, a mezitím svítí Hledám podél trasy…',
  'help.guide.roadtrip-refuel.step.3':
    'Vrátí se až tři stanice, každá s tím, jak daleko je od trasy a kolik dojezdu by zbylo.',
  'help.guide.roadtrip-refuel.step.4':
    'Plus u nabídky ji přidá jako zastávku s palivem. Přidat jako zastávku se otevře s vyplněným druhem i časem, a Přidat ji položí na úsek v místě, kudy se opravdu jede.',
  'help.guide.roadtrip-refuel.result':
    'Zastávka je na správném úseku s vlastní ikonou, dojezd se od ní počítá znovu a pruh je pryč.',
  'help.guide.roadtrip-refuel.tip.1':
    'Dojezd se počítá od poslední zastávky s palivem nebo nabíjením, napříč dny. To, čím jezdíte, rozhoduje, které zastávky se počítají: Palivo jen ty s palivem, Elektro jen nabíjecí.',
  'help.guide.roadtrip-refuel.tip.2':
    'Hledání se dívá na silnici před bodem, kde dojde, drží rezervu a zajížďku počítá dvakrát, takže všechno, co nabídne, je opravdu dosažitelné.',
  'help.guide.roadtrip-refuel.tip.3':
    'Prázdná odpověď není slepá ulička: z lampy se stane Zkusit znovu, protože hledání míst je sdílená služba, která občas neodpoví včas.',
  // roadtrip-track
  'help.guide.roadtrip-track.title': 'Nechat den sledovat importovanou stopu',
  'help.guide.roadtrip-track.goal':
    'Položte jízdu dne na vyhlídkovou trasu, kterou jste importovali jako stopu GPX nebo KML.',
  'help.guide.roadtrip-track.step.1': 'Klikněte na odznak Stopa v záhlaví dne. Dialog se otevře na tom dni.',
  'help.guide.roadtrip-track.step.2':
    'Vyberte stopu. Každá říká, jak je dlouhá a jestli vede podél tohoto dne, nebo jak daleko od něj leží, nejbližší první.',
  'help.guide.roadtrip-track.step.3':
    'Klikněte na Sledovat tuto stopu. TREK položí průjezdní body tam, kde se jízda od stopy nejvíc odchyluje, a naplánuje znovu, kolo za kolem.',
  'help.guide.roadtrip-track.step.4':
    'Řekne, kolik průjezdních bodů položil a jak blízko se jízda teď drží. Tlačítko pod tím tyto průjezdní body zase odebere a vrátí den plánovači; zavřením dialogu stopa zůstane.',
  'help.guide.roadtrip-track.result':
    'Jízda dne sleduje stopu místo silnice, kterou vybral plánovač, a její odznak Stopa svítí a při najetí pojmenuje tu stopu.',
  'help.guide.roadtrip-track.tip.1':
    'Soubor importujte pod Dny přes Importovat soubor, se zaškrtnutými Trasy nebo Trasy GPS. Dokud cesta žádnou nedrží, odznak nenese žádný den.',
  'help.guide.roadtrip-track.tip.2':
    'Sledování stopy nahradí průjezdní body, které úseky dne už měly, takže úsek tvarujte ručně až po stopě, ne před ní.',
};

export default help;
