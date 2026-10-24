import type { TranslationStrings } from '../types';

// English fallback until 'cs' is translated.
const help: TranslationStrings = {
  'help.title': 'Nápověda a dokumentace',
  'help.search': 'Hledat v dokumentaci…',
  'help.contents': 'Obsah',
  'help.noResults': 'Žádné odpovídající stránky.',
  'help.errorTitle': 'Tuto stránku se nepodařilo načíst',
  'help.errorBody': 'Obsah nápovědy se načítá z wiki TREK. Zkontrolujte připojení a zkuste to znovu.',

  // center
  'help.center.button': 'Nápověda k této obrazovce',
  'help.center.title': 'Nápověda',
  'help.center.onThisScreen': 'Na této obrazovce',
  'help.center.screens': 'Obrazovky',
  'help.center.thisScreen': 'Aktuální',
  'help.center.subScreens': 'Podobrazovky: {count}',
  'help.center.subScreens.one': '{count} podobrazovka',
  'help.center.subScreens.few': '{count} podobrazovky',
  'help.center.subScreensLabel': 'Dílčí obrazovky',
  'help.center.guidesCount': 'Návody: {count}',
  'help.center.guidesCount.one': '{count} návod',
  'help.center.guidesCount.few': '{count} návody',
  'help.center.goToScreen': 'Přejít na {screen}',
  'help.center.overview': 'Přehled',
  'help.center.howTo': 'Jak na to…',
  'help.center.searchPlaceholder': 'Hledat v návodech a dokumentaci…',
  'help.center.searchEmpty': 'Pro „{query}“ jsme nic nenašli.',
  'help.center.searchGuides': 'Návody',
  'help.center.searchDocs': 'Dokumentace',
  'help.center.searchError': 'Hledání teď není k dispozici.',
  'help.center.back': 'Zpět',
  'help.center.close': 'Zavřít nápovědu',
  'help.center.steps': '{count} kroků',
  'help.center.steps.one': '{count} krok',
  'help.center.steps.few': '{count} kroky',
  'help.center.step': 'Krok {n}',
  'help.center.stepsLabel': 'Kroky',
  'help.center.stepOf': 'Krok {n} z {total}',
  'help.center.screenshot': 'Snímek obrazovky',
  'help.center.result': 'Co získáte',
  'help.center.tips': 'Dobré vědět',
  'help.center.related': 'Související',
  'help.center.openDocs': 'Otevřít v Nápovědě a dokumentaci',
  'help.center.docsSection': 'V dokumentaci',
  'help.center.noContext': 'K této obrazovce zatím žádný návod není.',
  'help.center.noContextHint': 'Prohledejte dokumentaci, nebo nám napište, co jste hledali.',
  'help.center.feedback': 'Něco tu chybí?',
  'help.center.feedbackLink': 'Dejte nám vědět na GitHubu',
  'help.center.discord': 'Zeptejte se na Discordu',
  'help.center.quick': 'Rychlé',
  'help.center.guide': 'Návod',
  'help.center.tour': 'Průvodce',
  'help.center.imageAlt': 'Krok {n} návodu „{title}“',

  // ctx
  'help.ctx.dashboard.title': 'Přehled',
  'help.ctx.dashboard.summary':
    'Na přehledu najdete všechny své cesty. Karta nahoře ve stylu palubní vstupenky ukazuje cestu, která právě probíhá nebo vás čeká jako další. Řádek pod ní shrnuje, kolik už máte procestováno, a karty níže ukazují všechny cesty, které plánujete, máte archivované nebo už máte za sebou.',
  'help.ctx.dashboard.bullet.1':
    'Palubní vstupenka: právě probíhající nebo nejbližší cesta s daty, spolucestujícími, místy a odpočtem. Kliknutím cestu otevřete. Čtyřmi tlačítky v pravém horním rohu ji upravíte, zduplikujete, archivujete nebo smažete.',
  'help.ctx.dashboard.bullet.2':
    'Statistiky cestování: navštívené země, cesty, dny na cestách a nalétaná vzdálenost ze všech vašich cest.',
  'help.ctx.dashboard.bullet.3':
    'Karty cest, filtrované podle stavu „Plánováno“, „Archivováno“ a „Dokončeno“, v mřížce nebo v seznamu. Vyhledávací pole nad nimi prohledá všechny vaše cesty najednou, podle názvu, data nebo místa v cestě. Tlačítka pro úpravu, duplikaci, archivaci a smazání cesty jsou v pravém horním rohu fotky každé karty.',
  'help.ctx.dashboard.bullet.4':
    'Widgety vpravo: převodník měn, Sbírky (když je zapnutý doplněk Sbírky), světové hodiny, nadcházející rezervace a widgety z pluginů. Vestavěné widgety můžete vypnout v Nastavení, Vzhled.',
  'help.ctx.dashboard.bullet.5': 'Novou cestu založíte kartou „Nová cesta“ nebo tlačítkem vpravo dole.',

  // create-trip
  'help.guide.create-trip.title': 'Založení cesty',
  'help.guide.create-trip.goal': 'Založte novou cestu s názvem, termínem a úvodní fotkou.',
  'help.guide.create-trip.step.1':
    'Klikněte na „Nová cesta“. Stejně funguje karta na konci vašich cest i tlačítko v pravém dolním rohu.',
  'help.guide.create-trip.step.2': 'Pojmenujte cestu. Je to jediné povinné pole; vše ostatní můžete doplnit později.',
  'help.guide.create-trip.step.3':
    'Vyberte datum začátku a konce. TREK vytvoří pro každé datum jeden den, takže můžete rovnou začít plánovat program. Termín ještě nemáte? Nechte obě pole prázdná a místo toho zadejte „Počet dnů“.',
  'help.guide.create-trip.step.4':
    'Volitelně: přidejte úvodní fotku. Nahrajte vlastní, přetáhněte nebo vložte nějakou, nebo cíl cesty vyhledejte na Unsplash.',
  'help.guide.create-trip.step.5': 'Klikněte na „Vytvořit novou cestu“.',
  'help.guide.create-trip.result':
    'Cesta se objeví na přehledu. Pokud je to vaše nejbližší cesta, zobrazí se nahoře na palubní vstupence.',
  'help.guide.create-trip.tip.1':
    'Data můžete později změnit. Pokud už máte rezervace, TREK se zeptá, jestli je má posunout spolu se dny.',
  'help.guide.create-trip.tip.2':
    'Na měnu cesty, kterou tu zvolíte, se přepočítávají všechny náklady. Vyberte měnu cílové země.',

  // edit-trip
  'help.guide.edit-trip.title': 'Úprava cesty',
  'help.guide.edit-trip.goal': 'Přejmenujte cestu, změňte její termín nebo upravte nastavení.',
  'help.guide.edit-trip.step.1': 'Klikněte na tužku v pravém horním rohu karty cesty (nebo palubní vstupenky).',
  'help.guide.edit-trip.step.2':
    'Změňte, co potřebujete: název, popis, termín, obálku, měnu, připomínku nebo spolucestující.',
  'help.guide.edit-trip.step.3': 'Klikněte na „Aktualizovat“.',
  'help.guide.edit-trip.result': 'Karta se hned aktualizuje, a to všem členům cesty.',
  'help.guide.edit-trip.tip.1':
    'Když posunete začátek cesty s rezervacemi, TREK se zeptá, jestli se mají posunout i rezervace. Při zkrácení cesty se vypíšou dny, které by se odebraly, i to, co je na nich naplánované. Uloží se, až kliknete na „Odebrat dny a uložit“.',

  // cover-image
  'help.guide.cover-image.title': 'Nastavit titulní fotku',
  'help.guide.cover-image.goal': 'Dejte cestě obrázek, který se zobrazí na její kartě i na palubní vstupence.',
  'help.guide.cover-image.step.1': 'Tužkou na kartě cesty otevřete formulář pro její úpravu.',
  'help.guide.cover-image.step.2':
    'V části „Úvodní obrázek“ přetáhněte nebo vložte fotku, kliknutím nějakou nahrajte, nebo zadejte cíl a klikněte na „Hledat na Unsplash“.',
  'help.guide.cover-image.step.3': 'Vyberte fotku a klikněte na „Aktualizovat“.',
  'help.guide.cover-image.result': 'Fotka se uloží k cestě a zobrazí se všude, kde se cesta objevuje.',
  'help.guide.cover-image.tip.1':
    'U fotek z hledání na Unsplash se autor uvede automaticky; vámi nahrané fotky zůstávají na vašem serveru.',

  // duplicate-trip
  'help.guide.duplicate-trip.title': 'Duplikace cesty',
  'help.guide.duplicate-trip.goal': 'Použijte cestu jako šablonu pro novou.',
  'help.guide.duplicate-trip.step.1': 'Klikněte na ikonu duplikace v pravém horním rohu karty.',
  'help.guide.duplicate-trip.step.2': 'Přečtěte si, co se zkopíruje a co ne, a klikněte na „Kopírovat cestu“.',
  'help.guide.duplicate-trip.result':
    'Na přehledu se objeví kopie s názvem originálu a za ním (kopie). Můžete ji přejmenovat a změnit jí termín.',
  'help.guide.duplicate-trip.tip.1':
    'Zkopírují se dny, místa, výlety a trasy jízd autem, rezervace, položky rozpočtu, seznamy věcí, úkoly a poznámky ke dnům; seznamy věcí a úkoly se zkopírují neodškrtnuté. Členové, chat, hlasování, soubory a odkazy pro sdílení se nekopírují.',

  // archive-trip
  'help.guide.archive-trip.title': 'Archivovat a obnovit cestu',
  'help.guide.archive-trip.goal': 'Přesuňte cestu mimo seznam cest, aniž byste ji smazali, a později ji obnovte.',
  'help.guide.archive-trip.step.1': 'Klikněte na ikonu archivace v pravém horním rohu karty.',
  'help.guide.archive-trip.step.2': 'Chcete-li ji znovu vidět, přepněte filtr nad kartami na „Archivováno“.',
  'help.guide.archive-trip.step.3':
    'Kliknutím na „Obnovit“ na kartě cestu vrátíte mezi „Plánováno“, nebo mezi „Dokončeno“, pokud už její termín uplynul.',
  'help.guide.archive-trip.result':
    'Archivované cesty si ponechají všechna data. Jen se už nezobrazují na přehledu ani v kalendářovém kanálu všech cest.',

  // delete-trip
  'help.guide.delete-trip.title': 'Smazání cesty',
  'help.guide.delete-trip.goal': 'Odstraňte cestu natrvalo.',
  'help.guide.delete-trip.step.1': 'Klikněte na ikonu koše v pravém horním rohu karty.',
  'help.guide.delete-trip.step.2':
    'Potvrďte tlačítkem „Smazat“. Dialog uvádí název cesty, takže víte, že mažete tu správnou.',
  'help.guide.delete-trip.result':
    'Cesta se smaže i se svými dny, místy, rezervacemi a soubory. Tento krok nejde vrátit, takže pokud si nejste jistí, cestu raději archivujte.',

  // filter-and-view
  'help.guide.filter-and-view.title': 'Najít dokončené cesty a přepnout mřížku a seznam',
  'help.guide.filter-and-view.goal':
    'Zobrazte dokončené nebo archivované cesty a zvolte rozvržení, které vám vyhovuje.',
  'help.guide.filter-and-view.step.1':
    'Nad kartami použijte „Plánováno“, „Archivováno“ a „Dokončeno“. Mezi dokončené patří každá cesta, jejíž datum konce už uplynulo.',
  'help.guide.filter-and-view.step.2':
    'Kliknutím na ikonu seznamu přepnete na kompaktní seznam, dalším kliknutím se vrátíte k mřížce.',
  'help.guide.filter-and-view.result': 'Přehled si na tomto zařízení zapamatuje vaše rozložení.',

  // calendar-feed
  'help.guide.calendar-feed.title': 'Odběr všech cest v kalendáři',
  'help.guide.calendar-feed.goal':
    'Mějte dny a rezervace všech aktivních cest ve své kalendářové aplikaci, průběžně synchronizované.',
  'help.guide.calendar-feed.step.1': 'Klikněte na ikonu kalendáře vedle přepínače zobrazení.',
  'help.guide.calendar-feed.step.2': 'Klikněte na „Zapnout odběr kalendáře“. TREK vytvoří soukromý odkaz na kalendář.',
  'help.guide.calendar-feed.step.3':
    'Klikněte na „Přidat do Kalendáře Google“ nebo „Přidat do Kalendáře Apple / Outlooku“. U jiné kalendářové aplikace otevřete „Nebo odkaz zkopírujte ručně“ a odkaz zkopírujte odtamtud.',
  'help.guide.calendar-feed.result':
    'Každá aktivní cesta se zobrazí ve vašem kalendáři a automaticky se aktualizuje. Archivované cesty a cesty, které skončily před více než 90 dny, se nezahrnují.',
  'help.guide.calendar-feed.tip.1':
    'Odkaz nikomu nedávejte: kdo ho má, může kalendář číst. Pokud se dostane k dalším lidem, „Vygenerovat znovu“ vytvoří nový odkaz a starý přestane fungovat. „Vypnout“ odkaz úplně odstraní.',

  // widgets
  'help.guide.widgets.title': 'Výběr widgetů na přehledu',
  'help.guide.widgets.goal': 'Zobrazte nebo skryjte řádek se statistikami a widgety vpravo.',
  'help.guide.widgets.step.1': 'Vpravo nahoře otevřete nabídku svého avatara a zvolte „Nastavení“.',
  'help.guide.widgets.step.2': 'Přepněte na kartu „Vzhled“.',
  'help.guide.widgets.step.3':
    'V části „Widgety na přehledu“ zapněte nebo vypněte každý widget, zvlášť pro počítač a pro mobil. „Pravý postranní panel“ vypne celý pravý sloupec najednou.',
  'help.guide.widgets.step.4': 'Vraťte se na přehled. Změna se projeví okamžitě.',
  'help.guide.widgets.result':
    'Když widgety skryjete, získají vaše cesty víc místa. Vypnutím celého pravého postranního panelu rozložení vycentrujete.',
  'help.guide.widgets.link': 'Otevřít nastavení vzhledu',

  // currency-widget
  'help.guide.currency-widget.title': 'Převod měn',
  'help.guide.currency-widget.goal': 'Převeďte částku mezi dvěma měnami podle aktuálních kurzů.',
  'help.guide.currency-widget.step.1': 'Zadejte částku a vyberte obě měny.',
  'help.guide.currency-widget.step.2': 'Šipka mezi nimi měny prohodí; kruhová šipka načte aktuální kurz.',
  'help.guide.currency-widget.result':
    'Zvolený měnový pár se uloží k vašemu účtu, takže je stejný na všech zařízeních.',
  'help.guide.currency-widget.tip.1':
    'Kurzy pocházejí z bezplatné služby Frankfurter. Kruhová šipka v rohu widgetu načte nejnovější kurzy.',

  // timezones-widget
  'help.guide.timezones-widget.title': 'Přidat světové hodiny',
  'help.guide.timezones-widget.goal': 'Mějte přehled o místním čase v cílech svých cest.',
  'help.guide.timezones-widget.step.1':
    'Ve widgetu „Časová pásma“ klikněte na +, vyhledejte město, například Lisabon, a vyberte ho ze seznamu.',
  'help.guide.timezones-widget.step.2':
    'Hodiny odeberete tak, že na ně najedete myší a kliknete na ×, které se objeví vpravo.',
  'help.guide.timezones-widget.result': 'Vaše hodiny se uloží k vašemu účtu.',
  'help.guide.search-trips.title': 'Hledání v cestách',
  'help.guide.search-trips.goal':
    'Najděte cestu podle názvu, data nebo místa, které jste v ní naplánovali, včetně archivovaných cest.',
  'help.guide.search-trips.step.1':
    'Pište do pole „Hledat výlety nebo místa“ nad kartami. Seznam se filtruje už během psaní, a to napříč naplánovanými, archivovanými i dokončenými cestami najednou.',
  'help.guide.search-trips.step.2':
    'Pokud cesta odpovídá hledání kvůli některému ze svých míst, zobrazí se toto místo pod názvem cesty. Všechny cesty znovu uvidíte, když kliknete na x v poli nebo stisknete Escape.',
  'help.guide.search-trips.result':
    'Na přehledu zůstanou jen odpovídající cesty. Když vyhledávací pole vymažete, zobrazí se zase všechny.',
  'help.guide.search-trips.tip.1':
    'Hledat můžete i podle data: zadejte měsíc a rok, třeba květen 2027 nebo 2027-05, a najdete cesty v tomto měsíci.',
  'help.guide.search-trips.tip.2':
    'Během hledání se přepínač „Plánováno“, „Archivováno“ a „Dokončeno“ neuplatňuje, takže žádnou cestu neskryje špatně nastavený filtr.',

  // ── Screen: vacay ──────────────────────────────────────────────────────────
  'help.ctx.vacay.title': 'Dovolená (Vacay)',
  'help.ctx.vacay.summary':
    'Vacay je váš osobní plánovač dovolené: kolik dní dovolené máte v roce, které jste už zapsali a kolik vám zbývá. Mřížka ukazuje celý rok. V postranním panelu je výběr roku, lidé, se kterými plánujete, kalendáře sdílené s vámi, legenda a váš nárok.',
  'help.ctx.vacay.bullet.1':
    'Roční mřížka: dvanáct karet měsíců, jedna buňka na den. Kliknutím na den ho zapíšete nebo zrušíte. Malá modrá tečka označuje dny, které už pokrývá nějaká cesta.',
  'help.ctx.vacay.bullet.2':
    'Panel nástrojů dole: prvním tlačítkem s vaším jménem a barvou zapisujete dovolenou; „Firemní volno“ označuje dny, kdy má volno celá firma. „Půlden“ a „Náhradní volno“ mění, co se kliknutím zapíše, a „Půlden“ funguje i u firemního volna.',
  'help.ctx.vacay.bullet.3':
    '„Nárok“: „Dní“, „Použito“ a „Zbývá“ za vybraný rok, vedle toho převedené dny a náhradní volno. Kliknutím na nadpis karty ji sbalíte.',
  'help.ctx.vacay.bullet.4':
    '„Osoby“ jsou lidé, se kterými sdílíte plán, každý má svou barvu. „Sdílené kalendáře“ ukazují volno ostatních jako barevné kroužky. Upravovat je nemůžete.',
  'help.ctx.vacay.bullet.5':
    'Nastavení zahrnuje víkendy, začátek týdne, převod dovolené, váš dovolenkový rok, firemní volno, kalendáře státních svátků a školních prázdnin a „Zrušit propojení“, pokud plánujete společně s někým.',
  // log-day
  'help.guide.log-day.title': 'Zapsat den dovolené',
  'help.guide.log-day.goal': 'Označte volný den v roční mřížce a sledujte, jak se změní zůstatek.',
  'help.guide.log-day.step.1':
    'Zkontrolujte první tlačítko na panelu nástrojů dole. Když ukazuje vaše jméno a barvu, zapíšete kliknutím na den den dovolené pro sebe.',
  'help.guide.log-day.step.2':
    'Klikněte na den v kterékoli kartě měsíce. Den se vybarví vaší barvou a údaj „Použit“ vzroste o jeden den.',
  'help.guide.log-day.step.3': 'Dalším kliknutím na stejný den záznam zrušíte.',
  'help.guide.log-day.result':
    'Den je zapsaný. „Dní“, „Použito“ a „Zbývá“ se okamžitě aktualizují a všichni, kdo jsou propojení s vaším plánem, změnu hned vidí.',
  'help.guide.log-day.tip.1':
    'Když je v Nastavení zapnuté „Blokovat víkendy“, víkendy zapsat nelze. Víkendový den zapsaný dřív můžete i tak zrušit.',
  'help.guide.log-day.tip.2':
    'Modrá tečka v buňce znamená, že tento den pokrývá některá z vašich cest, takže vidíte, kde se dovolená a cestování překrývají.',
  // half-day
  'help.guide.half-day.title': 'Zapsat půl dne',
  'help.guide.half-day.goal': 'Vezměte si volné odpoledne a čerpejte z nároku jen půl dne.',
  'help.guide.half-day.step.1': 'Na liště nástrojů zapněte „Půlden“. Oranžová tečka označuje v mřížce půlden.',
  'help.guide.half-day.step.2': 'Klikněte na den. Zapíše se jako 0,5 a v rohu se mu objeví oranžová tečka.',
  'help.guide.half-day.step.3':
    'Až budete hotovi, „Půlden“ zase vypněte. Když kliknete na půlden s jiným nastavením, změní se na to aktuální.',
  'help.guide.half-day.result':
    '„Použito“ se zvýší o 0,5. „Půlden“ a „Náhradní volno“ jsou na sobě nezávislé, takže můžete zapsat i půlden náhradního volna.',
  'help.guide.half-day.tip.1':
    'Panel nástrojů vždy ukazuje značku, kterou zapíše vaše další kliknutí, takže si to před zápisem můžete ověřit.',
  // comp-day
  'help.guide.comp-day.title': 'Zapsat náhradní nebo pružné volno',
  'help.guide.comp-day.goal': 'Vyberte si náhradní volno, aniž byste čerpali dny dovolené.',
  'help.guide.comp-day.step.1':
    'Na liště nástrojů zapněte „Náhradní volno“. Šrafované kolečko označuje v mřížce den náhradního volna.',
  'help.guide.comp-day.step.2': 'Klikněte na den. Místo plné barvy se vyplní šikmými čarami ve vaší barvě.',
  'help.guide.comp-day.result':
    'Dny náhradního volna se počítají vedle dlaždic s nárokem a hodnotu „Zbývá“ nikdy nesnižují.',
  'help.guide.comp-day.tip.1':
    'Použijte ho pro přesčasy čerpané jako volno, pružnou pracovní dobu nebo náhradní den: pro jakékoli volno, které není dovolenou.',
  // entitlement
  'help.guide.entitlement.title': 'Nastavení nároku',
  'help.guide.entitlement.goal': 'Nastavte ve Vacay, kolik dní dovolené máte v daném roce.',
  'help.guide.entitlement.step.1':
    'Na kartě „Nárok“ v postranním panelu klikněte ve svém řádku na dlaždici „Dní“. Pokud je karta sbalená, rozbalte ji kliknutím na nadpis.',
  'help.guide.entitlement.step.2': 'Zadejte počet dní a stiskněte Enter. Klávesou Escape ponecháte původní hodnotu.',
  'help.guide.entitlement.result':
    '„Zbývá“ se přepočítá z vašeho nároku, případně převedených dní a dní, které jste už vyčerpali.',
  'help.guide.entitlement.tip.1': 'Každý rok má vlastní nárok, takže změna zde ovlivní jen vybraný rok.',
  // years
  'help.guide.years.title': 'Přidání a přepínání roků',
  'help.guide.years.goal': 'Naplánujte už příští rok, nebo se podívejte na loňský.',
  'help.guide.years.step.1': 'Kliknutím na + vpravo od roku přidáte následující rok, kliknutím na + vlevo předchozí.',
  'help.guide.years.step.2': 'Mezi roky přepínáte šipkami nebo čipy s roky pod nimi.',
  'help.guide.years.step.3':
    'Rok odeberete tak, že najedete myší na jeho štítek a kliknete na malé mínus. Smažou se tím i všechny jeho záznamy, proto potvrzujte opatrně.',
  'help.guide.years.result': 'Každý rok má vlastní nárok a záznamy. Převod dní propojuje jeden rok s dalším.',
  // company-holidays
  'help.guide.company-holidays.title': 'Označit celofiremní volno',
  'help.guide.company-holidays.goal': 'Zablokujte dny, kdy má volno celá firma, aniž by se komukoli odečetly z nároku.',
  'help.guide.company-holidays.step.1':
    'Otevřete Nastavení a zkontrolujte, že je zapnuté „Firemní volno“. Ve výchozím stavu zapnuté je. Panel nástrojů tento režim nabízí, jen když je zapnuté.',
  'help.guide.company-holidays.step.2': 'Zpátky v mřížce přepněte panel nástrojů na „Firemní volno“.',
  'help.guide.company-holidays.step.3':
    'Klikejte na dny. Zoranžoví a objeví se v legendě. Dalším kliknutím na den ho zrušíte.',
  'help.guide.company-holidays.result': 'Firemní volno vidí všichni propojení s plánem a nikdy nesnižuje „Zbývá“.',
  'help.guide.company-holidays.tip.1':
    'Firemní volno může upravovat kdokoli z propojených osob, proto se domluvte, kdo ho bude spravovat.',
  // public-holidays
  'help.guide.public-holidays.title': 'Zobrazit státní svátky',
  'help.guide.public-holidays.goal': 'Zobrazte v mřížce státní svátky své země nebo regionu.',
  'help.guide.public-holidays.step.1': 'Otevřete Nastavení a zapněte „Státní svátky“.',
  'help.guide.public-holidays.step.2':
    'Klikněte na „Přidat kalendář“ a vyberte zemi a případně region. Můžete mu také dát barvu a popisek. Pak klikněte na „Přidat“.',
  'help.guide.public-holidays.step.3': 'Zavřete Nastavení. Svátky se zobrazí v mřížce i v legendě.',
  'help.guide.public-holidays.result':
    'Státní svátky jsou v kalendáři vyznačené jeho barvou a z vašeho nároku se nikdy neodečítají.',
  'help.guide.public-holidays.tip.1':
    'Můžete přidat víc kalendářů, například svůj region a region kolegy, se kterým máte propojený plán.',
  // school-holidays
  'help.guide.school-holidays.title': 'Zobrazení školních prázdnin',
  'help.guide.school-holidays.goal': 'Mějte školní prázdniny ve svém regionu přehledně vedle vlastního volna.',
  'help.guide.school-holidays.step.1': 'Otevřete Nastavení a zapněte „School Holidays“.',
  'help.guide.school-holidays.step.2':
    'Klikněte na „Přidat kalendář“ a vyberte zemi. Pokud má země kalendář rozdělený, vyberte také region nebo skupinu a pak klikněte na „Přidat“.',
  'help.guide.school-holidays.step.3':
    'Zavřete „Nastavení“. Školní prázdniny jsou v kalendáři podbarvené barvou kalendáře a jejich dny mají dole barevný pruh.',
  'help.guide.school-holidays.result': 'Školní prázdniny se jen zobrazují v kalendáři: nikomu nesnižují nárok.',
  'help.guide.school-holidays.tip.1':
    'Chybí vám region? Správce může školní prázdniny zadat ručně v části Správce, Personalizace, Školní prázdniny.',
  // weekends
  'help.guide.weekends.title': 'Blokování víkendů a začátek týdne',
  'help.guide.weekends.goal': 'Nepočítejte víkendy a začínejte týden dnem, který vám vyhovuje.',
  'help.guide.weekends.step.1': 'Otevřete „Nastavení“.',
  'help.guide.weekends.step.2':
    'Zapněte „Blokovat víkendy“ a v části „Víkendové dny“ vyberte dny, které považujete za víkend.',
  'help.guide.weekends.step.3': 'V části „Týden začíná“ zvolte „Po“ nebo „Ne“.',
  'help.guide.weekends.result': 'Blokované dny jsou v mřížce šedé a nejde je omylem zapsat.',
  // leave-year
  'help.guide.leave-year.title': 'Nastavit dovolenkový rok',
  'help.guide.leave-year.goal': 'Počítejte nárok za fiskální rok nebo od data nástupu místo od ledna do prosince.',
  'help.guide.leave-year.step.1': 'Otevřete Nastavení a najděte „Dovolenkový rok“.',
  'help.guide.leave-year.step.2':
    'Zvolte „Kalendář“, „Fiskální“ (s měsícem a dnem, kdy začíná) nebo „Datum nástupu“ (s datem, kdy jste nastoupili).',
  'help.guide.leave-year.result':
    'Nárok, čerpané dny a převod se počítají za toto období a mřížka začíná jeho prvním měsícem.',
  'help.guide.leave-year.tip.1':
    'Toto nastavení je osobní: v propojeném plánu má každý svůj vlastní dovolenkový rok a vlastní čísla.',
  // carry-over
  'help.guide.carry-over.title': 'Převést nevyčerpané dny',
  'help.guide.carry-over.goal': 'Převeďte, co vám na konci období zbylo, do dalšího období.',
  'help.guide.carry-over.step.1': 'Otevřete Nastavení.',
  'help.guide.carry-over.step.2': 'Zapněte „Převod dovolené“.',
  'help.guide.carry-over.result': 'Převedené dny se přepočítají napříč všemi vašimi roky a zobrazí se pod nárokem.',
  'help.guide.carry-over.tip.1': 'Vypnutím se všechny převedené zůstatky vynulují.',
  // invite
  'help.guide.invite.title': 'Společné plánování s dalšími lidmi',
  'help.guide.invite.goal':
    'Propojte svůj plán s plánem jiného uživatele TREKu, abyste oba viděli své volno v jedné mřížce.',
  'help.guide.invite.step.1': 'Na kartě „Osoby“ klikněte na ikonu osoby.',
  'help.guide.invite.step.2': 'Vyberte uživatele a klikněte na „Odeslat pozvánku“.',
  'help.guide.invite.step.3':
    'Pozvaný dostane oznámení a při dalším otevření sekce Dovolená (Vacay) „Žádost o propojení“. Do té doby se pozvánka zobrazuje jako čekající; když na ni najedete myší, můžete ji zrušit.',
  'help.guide.invite.result':
    'Oba plány se spojí: každý má svou barvu, můžete si navzájem zapisovat dny a vše se synchronizuje v reálném čase.',
  'help.guide.invite.tip.1':
    'Propojení zrušíte kliknutím na „Oddělit“ v Nastavení. Záznamy každého se vrátí do jeho vlastního plánu.',
  'help.guide.invite.tip.2':
    'Pokud má druhá osoba vaše dny jen vidět, místo sloučení jí raději nasdílejte svůj kalendář.',
  // share-calendar
  'help.guide.share-calendar.title': 'Sdílení kalendáře jen pro čtení',
  'help.guide.share-calendar.goal': 'Umožněte někomu vidět, kdy máte volno, aniž by mohl měnit váš plán.',
  'help.guide.share-calendar.step.1': 'Na kartě „Sdílené kalendáře“ klikněte na ikonu sdílení.',
  'help.guide.share-calendar.step.2': 'Vyberte uživatele a klikněte na „Sdílet“. Druhá strana nemusí nic potvrzovat.',
  'help.guide.share-calendar.step.3':
    'Kalendáře, které s vámi někdo sdílí, jsou nahoře na kartě: kliknutím je skryjete nebo zobrazíte, a když na ně najedete myší a kliknete na křížek, odeberete je. V části „Sdílíte s“ najeďte na jméno a klikněte na „Zastavit sdílení“.',
  'help.guide.share-calendar.result':
    'Vaše volno se druhé osobě zobrazí v mřížce jako barevný kroužek. Nic z toho, co sdílíte, nemůže upravit.',
  'help.guide.share-calendar.tip.1':
    'Sdílení a sloučení na sobě nezávisí: můžete být sloučeni s jedním člověkem a sdílet s dalšími.',
  'help.guide.share-calendar.tip.2': 'Najeďte myší na den s kroužkem a uvidíte, kdo má volno a jak dlouho.',

  // ── Screen: atlas ─────────────────────────────────────────────────────────────────────
  'help.ctx.atlas.title': 'Atlas',
  'help.ctx.atlas.summary':
    'Atlas ukazuje na mapě světa, kde všude jste byli: každá země, kam vás zavedla některá cesta, je vybarvená, a země, které jste navštívili ještě před TREKem, můžete doplnit ručně. Po přiblížení uvidíte regiony, můžete si vést seznam míst, která ještě chcete navštívit, a svoje čísla najdete na skleněném panelu dole.',
  'help.ctx.atlas.bullet.1':
    'Mapa: každá navštívená země má svou pevnou barvu, plánované země mají čárkovaný obrys, země z bucket listu šikmé šrafování a všechny ostatní jsou šedé. Když na zemi najedete myší, uvidíte její cesty, místa a první a poslední návštěvu.',
  'help.ctx.atlas.bullet.2':
    'Hledání nahoře: zadejte zemi nebo místo. U země, kde jste nebyli, se otevře její okno. U země, kde jste byli, se v panelu zobrazí její karta. Když vyberete místo, mapa otevře jeho region, abyste ho mohli označit.',
  'help.ctx.atlas.bullet.3':
    '„Zobrazit plánované země“ vpravo nahoře: ukáže země vašich nadcházejících cest. Přepínač se zobrazí, jen když nějaké máte.',
  'help.ctx.atlas.bullet.4':
    'Panel dole: karta „Statistiky“ se zeměmi (vedle nich plánované), regiony, cestami, místy, městy, dny, kontinenty, vaší sérií a letošními cestami; karta „Bucket list“ s místy, která chcete ještě navštívit; s doplňkem Výlety také karta „Výlety“ se vzdáleností a převýšením absolvovaných výletů.',
  'help.ctx.atlas.bullet.5':
    'Regiony: když mapu hodně přiblížíte, zobrazí státy a provincie. Kliknutím na některou ji označíte, zrušíte označení nebo ji přidáte do bucket listu.',
  'help.ctx.atlas.bullet.6':
    'Dawarich: když je doplněk připojený, panel vlevo od statistik označí přání jako splněná a přidá země z vašich záznamů. Udělá to ale až po vašem potvrzení.',
  // mark-country
  'help.guide.mark-country.title': 'Označit zemi jako navštívenou',
  'help.guide.mark-country.goal':
    'Přidejte zemi, kterou jste navštívili ještě před TREKem, aby ji zahrnula mapa i počet zemí.',
  'help.guide.mark-country.step.1': 'Napište název země do vyhledávacího pole nahoře nad mapou.',
  'help.guide.mark-country.step.2': 'Vyberte ji ze seznamu. Mapa se na zemi přesune a otevře se k ní okno.',
  'help.guide.mark-country.step.3': 'Zvolte „Označit jako navštívené“.',
  'help.guide.mark-country.result':
    'Země dostane na mapě barvu a počet „Zemí“ se zvýší o jednu. Barva zůstává natrvalo: když označíte další země, barvy ostatních se nezmění.',
  'help.guide.mark-country.tip.1':
    'Stejné okno otevřete i kliknutím na šedou zemi na mapě. U malých zemí je spolehlivější hledání.',
  'help.guide.mark-country.tip.2':
    'Ručně označená země se vždy počítá jako navštívená, bez ohledu na data cest, které tam vedou.',
  // unmark-country
  'help.guide.unmark-country.title': 'Odebrat označenou zemi',
  'help.guide.unmark-country.goal': 'Odeberte z mapy zemi, kterou jste označili ručně.',
  'help.guide.unmark-country.step.1':
    'Vyhledejte zemi a vyberte ji, nebo na ni klikněte na mapě. U země, kterou jste označili sami, se okno zeptá, jestli ji chcete odebrat.',
  'help.guide.unmark-country.step.2': 'Potvrďte tlačítkem „Odebrat“.',
  'help.guide.unmark-country.result': 'Země zase zešedne a přestane se počítat.',
  'help.guide.unmark-country.tip.1':
    'Takto lze odebrat jen země, které jste označili ručně. Země s cestami nebo místy zůstane označená, dokud tyto cesty či místa neodeberete. U ručně označené země najdete „Odebrat“ také v její kartě s detailem v panelu.',
  // country-details
  'help.guide.country-details.title': 'Zobrazit, co jste v zemi dělali',
  'help.guide.country-details.goal': 'Otevřete navštívenou zemi a přejděte na cesty, které vás tam zavedly.',
  'help.guide.country-details.step.1': 'Do vyhledávacího pole nahoře na mapě zadejte zemi, kterou jste navštívili.',
  'help.guide.country-details.step.2':
    'Vyberte ji. Mapa se na ni přesune a v panelu dole se objeví karta. Ukazuje vlajku země, odznaky s jejími místy, cestami a navštívenými regiony a čip pro každou z prvních tří cest.',
  'help.guide.country-details.result': 'Kliknutím na štítek cesty ji otevřete v plánovači.',
  'help.guide.country-details.tip.1':
    'Když na mapě najedete na zemi, uvidíte stejná čísla a k tomu první a poslední návštěvu.',
  // planned-countries
  'help.guide.planned-countries.title': 'Země, kam se chystáte',
  'help.guide.planned-countries.goal':
    'Zobrazte na mapě země svých nadcházejících cest, aniž by se počítaly jako navštívené.',
  'help.guide.planned-countries.step.1':
    'Vpravo nahoře zapněte „Zobrazit plánované země“. Číslo vedle ukazuje, kolik plánovaných zemí máte.',
  'help.guide.planned-countries.step.2':
    'Vyhledejte plánovanou zemi a vyberte ji: v panelu stojí „Plánováno“ a popisek na mapě ukazuje, kdy tam jedete.',
  'help.guide.planned-countries.result':
    'Plánované země mají čárkovaný obrys, takže si je nikdy nespletete se zeměmi, které už jste navštívili. Přepínač si vaši volbu pamatuje.',
  'help.guide.planned-countries.tip.1':
    'Země se počítá jako navštívená, jakmile cesta do ní začne. Počítá se i probíhající cesta. Cesty bez dat se do statistik vůbec nezapočítávají.',
  'help.guide.planned-countries.tip.2': 'Přepínač je k dispozici, jen dokud máte nějaké nadcházející cesty.',
  // regions
  'help.guide.regions.title': 'Označení regionu',
  'help.guide.regions.goal': 'Označte nejen země, ale i státy, provincie nebo prefektury, kde jste byli.',
  'help.guide.regions.step.1':
    'Přibližujte zemi, dokud se neobjeví hranice jejích států a provincií. Když zemi vyhledáte a vyberete, mapa se přiblíží dostatečně.',
  'help.guide.regions.step.2':
    'Klikněte na region. Když na region najedete myší, zobrazí se jeho název. Okno ukáže region a zemi, do které patří.',
  'help.guide.regions.step.3': 'Zvolte „Označit jako navštívené“.',
  'help.guide.regions.result':
    'Region se vybarví barvou země. Označením regionu se zároveň započítá jako navštívená i země, pokud ještě nebyla.',
  'help.guide.regions.tip.1':
    'Po kliknutí na navštívený region se nabídne „Odebrat“, ať jste ho označili sami, nebo byl přidán kvůli nějakému místu.',
  'help.guide.regions.tip.2':
    'Regiony, ve kterých máte skutečná místa, se označí automaticky. Nemusíte kvůli nim nic dělat.',
  // search-place
  'help.guide.search-place.title': 'Vyhledání místa a označení jeho regionu',
  'help.guide.search-place.goal':
    'Označte Bavorsko tak, že vyhledáte Mnichov, aniž byste museli vědět, ve kterém regionu město leží.',
  'help.guide.search-place.step.1':
    'Do vyhledávacího pole napište město, památku nebo adresu. Nejdřív se zobrazí země, odpovídající místa jsou pod nimi v části „Místa“.',
  'help.guide.search-place.step.2': 'Vyberte místo. Mapa se na něj přesune a zjistí, ve kterém regionu leží.',
  'help.guide.search-place.step.3':
    'U daného regionu zvolte „Označit jako navštívené“, nebo „Přidat do seznamu přání (Bucket list)“, pokud jste tam ještě nebyli.',
  'help.guide.search-place.result':
    'Region je označený a s ním i země. U zemí, pro které mapový balík nemá data regionů, se místo toho označí přímo země.',
  'help.guide.search-place.tip.1':
    'Místa pocházejí ze stejného vyhledávání jako všude jinde v TREKu, takže používají poskytovatele, kterého nastavil váš správce.',
  // bucket-country
  'help.guide.bucket-country.title': 'Přidání země na seznam přání',
  'help.guide.bucket-country.goal':
    'Veďte si na mapě seznam zemí, kam se chcete podívat, odděleně od zemí, které jste už navštívili.',
  'help.guide.bucket-country.step.1': 'Vyhledejte zemi a vyberte ji, nebo na ni klikněte na mapě.',
  'help.guide.bucket-country.step.2': 'Zvolte „Přidat do seznamu přání (Bucket list)“.',
  'help.guide.bucket-country.step.3':
    'Pokud už víte kdy, vyberte měsíc a rok a potvrďte tlačítkem „Přidat do seznamu přání (Bucket list)“.',
  'help.guide.bucket-country.result':
    'Země se zobrazí s diagonálním šrafováním v barvě, kterou bude mít po vaší návštěvě, a objeví se na kartě „Bucket List“ v panelu.',
  'help.guide.bucket-country.tip.1': 'Jakmile je země na seznamu, nabídne stejné okno „Odebrat ze seznamu přání“.',
  'help.guide.bucket-country.tip.2':
    'Na jedno cílové datum připadá jeden záznam: stejná země může být na seznamu pro dva různé měsíce, ale ne dvakrát pro tentýž.',
  // bucket-place
  'help.guide.bucket-place.title': 'Přidání místa do bucket listu',
  'help.guide.bucket-place.goal':
    'Uložte si město, památku nebo adresu, kam se chcete podívat, i se souřadnicemi a cílovým datem.',
  'help.guide.bucket-place.step.1': 'V panelu dole otevřete kartu „Bucket List“.',
  'help.guide.bucket-place.step.2': 'Klikněte na „Přidat místo“.',
  'help.guide.bucket-place.step.3':
    'Zadejte název a stiskněte tlačítko hledání; vyberte odpovídající výsledek, aby místo získalo souřadnice. Můžete také jen zadat název a hledání vynechat.',
  'help.guide.bucket-place.step.4': 'Pokud chcete, vyberte měsíc a rok, a klikněte na „Přidat“.',
  'help.guide.bucket-place.result':
    'Místo se zobrazí nahoře ve vašem bucket listu i s cílovým datem. Když na něj najedete myší, objeví se ×, kterým ho odeberete.',
  'help.guide.bucket-place.tip.1':
    'Dawarich může přání později označit jako splněné, jen když má souřadnice. Udělá to, jakmile z vašich záznamů vyplyne, že jste tam byli.',
  // stats
  'help.guide.stats.title': 'Vaše statistiky',
  'help.guide.stats.goal': 'Zjistěte, co čísla v panelu počítají a co ne.',
  'help.guide.stats.step.1':
    '„Zemí“ je počet různých zemí, kde jste skutečně byli. Plánované země jsou uvedené pod číslem a nezapočítávají se do něj. „Regionů“ počítá státy a provincie, kde jste byli. „Cest“, „Míst“ a „Dní“ jsou součty za všechny vaše cesty. „Měst“ se počítá z adres vašich míst, jde tedy o odhad.',
  'help.guide.stats.step.2':
    'Kontinenty ukazují navštívené země podle kontinentů. Antarktida se v řádku objeví, až ji navštívíte. Následuje vaše série (po sobě jdoucí roky s alespoň jednou cestou) a počet cest, které jste podnikli letos.',
  'help.guide.stats.result': 'Čísla se při plánování cest aktualizují sama. Nemusíte tu nic udržovat.',
  'help.guide.stats.tip.1':
    'Města se berou z textu adresy, nevyhledávají se. Krátká adresa jako „Osteria Francescana, Italy“ nebo adresa končící prefekturou se proto může započítat jako region místo města.',
  'help.guide.stats.tip.2':
    'Ručně označené země se započítávají do Zemí a kontinentů, ale nepřidávají žádné cesty, místa ani dny.',
  // dawarich-countries
  'help.guide.dawarich-countries.title': 'Přidání zemí z vašich záznamů',
  'help.guide.dawarich-countries.goal':
    'Zjistěte přes Dawarich, ve kterých zemích jste za poslední rok byli, a ty, které potvrdíte, přidejte na mapu.',
  'help.guide.dawarich-countries.step.1':
    'Když je připojený doplněk Dawarich, objeví se dole na mapě, vlevo od statistik, panel Dawarich se dvěma dlaždicemi. Klikněte na „Zemí“.',
  'help.guide.dawarich-countries.step.2':
    'Dialog se otevře na kartě „Země“. Klikněte na „Vyhledat země“: TREK projde země a města, která pokrývají vaše záznamy za posledních 12 měsíců, a to měsíc po měsíci, takže to může chvíli trvat. Každá země, kterou ještě nemáte v Atlasu, se zobrazí s vlajkou, počtem měst a názvem prvního města. Všechny země jsou předem zaškrtnuté. Kliknutím na řádek zemi vynecháte.',
  'help.guide.dawarich-countries.step.3':
    'Potvrďte tlačítkem vpravo dole, na kterém při pěti zaškrtnutých řádcích stojí „Přidat země: 5“. Dialog oznámí, kolik zemí bylo přidáno. Až ho zavřete, mapa už bude aktualizovaná.',
  'help.guide.dawarich-countries.result':
    'Potvrzené země se vybarví na mapě a započítají do „Zemí“ se záznamem, že pocházejí z Dawarichu. Země, které jste označili ručně, se nemění.',
  'help.guide.dawarich-countries.tip.1':
    'Země, které Atlas už ukazuje jako navštívené, ať ručně, z cesty, nebo z dřívější kontroly, se vynechají, takže se vaše vlastní značky nikdy nezmění. Zemi, kterou jste dříve z Atlasu odebrali, sem přidáte znovu, když ji tady potvrdíte.',
  'help.guide.dawarich-countries.tip.2':
    'Když TREK nedokáže název země přiřadit, vypíše ho pod řádky a nezahodí ho. „Zkontrolovat znovu“ se Dawarichu zeptá ještě jednou. Poznámka pod seznamem uvádí, že se prohledalo posledních 12 měsíců. Toto období změnit nejde.',
  // dawarich-wishes
  'help.guide.dawarich-wishes.title': 'Odškrtnutí přání podle záznamů',
  'help.guide.dawarich-wishes.goal':
    'Zjistěte, která místa z bucket listu jste skutečně navštívili, a označte je jako splněná i s datem návštěvy.',
  'help.guide.dawarich-wishes.step.1': 'V panelu Dawarich dole na mapě klikněte vlevo od statistik na „Seznam přání“.',
  'help.guide.dawarich-wishes.step.2':
    'Dialog se otevře na kartě „Seznam přání“. Klikněte na „Zkontrolovat seznam přání“: TREK projde vaše záznamy u každé položky, která má souřadnice. Splněné přání se zobrazí s tím, jak blízko jste se dostali, jak dlouho jste tam zůstali a který den to bylo, a je předem zaškrtnuté. U přání, které jste už odškrtli, stojí „Již odškrtnuto“. Pod seznamem je poznámka s počtem položek bez souřadnic a také pravidlo: Přání se počítá jako splněné do 250 m a po 20 minutách na místě.',
  'help.guide.dawarich-wishes.step.3':
    'Potvrďte tlačítkem vpravo dole, na kterém při dvou zaškrtnutých řádcích stojí „Odškrtnout 2“. Pak dialog zavřete a otevřete kartu „Bucket List“ v panelu vedle.',
  'help.guide.dawarich-wishes.result':
    'Každé přání dostane zelenou fajfku s datem pobytu, ne s dnešním datem. Popisek u ní zní „Odškrtnuto podle vašich záznamů v Dawarichu“. Kliknutím na datum to vrátíte zpět.',
  'help.guide.dawarich-wishes.tip.1':
    'Projet kolem nestačí: musíte být blízko místa a nějakou dobu tam zůstat. Pokud podmínku splňuje víc pobytů, použije se ten nejdelší. Přání bez souřadnic ověřit nejde, proto místa přidávejte přes vyhledávání v „Přidat místo“, ne jen jménem.',
  'help.guide.dawarich-wishes.tip.2':
    'Jedna kontrola projde až 50 položek, nejdřív ty, které ještě nejsou odškrtnuté. Pokud jich je víc, TREK vás upozorní. Přání, které už bylo odškrtnuté, si ponechá své datum.',

  // ── Screen: collections ───────────────────────────────────────────────────────────────
  'help.ctx.collections.title': 'Sbírky',
  'help.ctx.collections.summary':
    'Sbírky jsou vaše knihovna mimo jednotlivé cesty: pojmenované seznamy míst, která jste našli a chcete si schovat, každé se stavem „Nápad“, „Chci navštívit“ nebo „Navštíveno“, a při zapnutých Výletech i celé výlety uložené z cesty. Místa a výlety se do cest a z nich kopírují, nikdy se nepropojují, takže seznam a cesta se navzájem nikdy neovlivňují.',
  'help.ctx.collections.bullet.1':
    'Ve sloupci seznamů vlevo najdete své vlastní seznamy, seznamy sdílené s vámi, pozvánky, na které jste ještě neodpověděli, a „Vše uložené“, které spojuje obsah všech vašich seznamů. Nahoře je „Nový seznam“ a import ze souboru.',
  'help.ctx.collections.bullet.2':
    'Záhlaví otevřeného seznamu ukazuje jeho barvu, obálku, popis a odkazy, členy a vpravo „Upravit“ (jen pro vlastníka), „Exportovat“ a „Sdílet“. U seznamu, který s vámi někdo sdílí, je na tlačítku „Sdílet“ nápis „Sdílené“.',
  'help.ctx.collections.bullet.3':
    'Řádek filtrů nad místy: + pro přidání místa, rozbalovací nabídky „Stav“, „Kategorie“, „Hodnocení“ a „Řadit“, ikona zaškrtávacího políčka pro „Vybrat“ a ikona mráčku pro „Importovat z cesty“. Filtr štítků se v tomto řádku zobrazí, jen když není zobrazená mapa.',
  'help.ctx.collections.bullet.4':
    'Řádky míst: fotka, název a adresa, štítky a kategorie a vpravo pilulka stavu. Jedním kliknutím na pilulku přepnete na další stav.',
  'help.ctx.collections.bullet.5':
    'Mapa vpravo: špendlík pro každé místo se souřadnicemi. Na její horní liště je „Zvětšit mapu“ („Zobrazit seznam“, když je mapa přes celou plochu), filtr štítků s tlačítkem pro správu štítků a pole „Hledat místa“. Kliknutím na špendlík místo otevřete.',
  'help.ctx.collections.bullet.6':
    'Panel podrobností: kliknutím na řádek zobrazíte obálku, kategorii, stav, hodnocení hvězdičkami, štítky, popis a odkazy. Fotoaparátem na obálce změníte fotku. Dole jsou „Upravit“, „Kopírovat do výletu“, tlačítko navigace a „Odebrat ze seznamu“.',
  // create-list
  'help.guide.create-list.title': 'Vytvořit seznam',
  'help.guide.create-list.goal': 'Vytvořte nový pojmenovaný seznam s barvou a obálkou, připravený na místa.',
  'help.guide.create-list.step.1': 'Klikněte na „Nový seznam“ nahoře v postranním panelu se seznamy.',
  'help.guide.create-list.step.2':
    'Pojmenujte seznam a vyberte barvu. Obrázek na obálku, popis a odkazy jsou volitelné, doplnit je můžete později přes „Upravit“.',
  'help.guide.create-list.step.3': 'Klikněte na „Vytvořit“.',
  'help.guide.create-list.result':
    'Seznam se otevře prázdný a naplnit ho můžete dvěma způsoby: „Přidat místo“ nebo „Importovat z cesty“.',
  'help.guide.create-list.tip.1':
    'Obálkou může být vlastní nahraný obrázek nebo obrázek nalezený přes hledání na Unsplash ve stejném dialogu.',
  // add-place
  'help.guide.add-place.title': 'Přidat místo',
  'help.guide.add-place.goal':
    'Najděte místo a uložte ho do otevřeného seznamu i s názvem, kategorií, stavem a poznámkami v jednom kroku.',
  'help.guide.add-place.step.1':
    'Klikněte na + na začátku řádku filtrů nad místy. U seznamu, který je ještě prázdný, klikněte na „Přidat místo“ uprostřed stránky.',
  'help.guide.add-place.step.2':
    'Napište místo do vyhledávacího pole a vyberte výsledek. Název, adresa a souřadnice se doplní z výsledku.',
  'help.guide.add-place.step.3':
    'Nastavte stav a podle potřeby kategorii, popis a odkazy, pak klikněte na „Přidat“. Dialog zůstane otevřený pro další místo, tlačítkem „Zrušit“ ho zavřete.',
  'help.guide.add-place.result': 'Místo se zobrazí v seznamu, a pokud má souřadnice, i jako špendlík na mapě.',
  'help.guide.add-place.tip.1':
    'Uvnitř cesty uložíte místo z cesty do seznamu přes „Uložit do sbírky“ v detailu místa nebo v jeho nabídce, aniž byste cestu opustili.',
  'help.guide.add-place.tip.2':
    'Seznam musí být váš, nebo v něm musíte být editor či správce; v „Vše uložené“ ani v seznamu, který jen prohlížíte, + není.',
  // import-from-trip
  'help.guide.import-from-trip.title': 'Importovat místa z cesty',
  'help.guide.import-from-trip.goal':
    'Přeneste do seznamu všechna místa z cesty najednou, místo abyste je ukládali jedno po druhém.',
  'help.guide.import-from-trip.step.1':
    'V řádku filtrů klikněte na tlačítko importu se šipkou a obláčkem. U prázdného seznamu najdete stejné tlačítko vedle „Přidat místo“.',
  'help.guide.import-from-trip.step.2': 'Vyberte jednu ze svých cest.',
  'help.guide.import-from-trip.step.3':
    'Zaškrtněte místa, která chcete. Místa, která už v seznamu jsou, jsou zašedlá. Na začátku jsou vybraná místa, která nejsou v žádném dni cesty. Pokud už je každé místo v některém dni, jsou vybraná všechna nová místa. „Jen nová“ skryje místa, která seznam už obsahuje.',
  'help.guide.import-from-trip.step.4': 'Klikněte na „Importovat“. Na tlačítku je vždy vidět, kolik míst se přidá.',
  'help.guide.import-from-trip.result':
    'Místa se zkopírují do seznamu i s názvem, adresou, souřadnicemi, popisem a kategorií. Cesta se nezmění.',
  'help.guide.import-from-trip.tip.1':
    'TREK automaticky přeskakuje duplicity podle názvu nebo souřadnic, takže dvojí import nevadí.',
  'help.guide.import-from-trip.tip.2':
    'V seznamu míst cesty nabízí režim výběru místo toho „Uložit do sbírky“ pro ručně vybraná místa.',
  // place-status
  'help.guide.place-status.title': 'Nastavit stav místa',
  'help.guide.place-status.goal': 'Mějte přehled, co je jen nápad, co je v užším výběru a kde už jste byli.',
  'help.guide.place-status.step.1':
    'Klikněte na štítek stavu na pravém konci řádku místa. Z „Nápad“ se stane „Chci navštívit“.',
  'help.guide.place-status.step.2': 'Dalším kliknutím nastavíte „Navštíveno“, a ještě jedním se vrátíte na „Nápad“.',
  'help.guide.place-status.result':
    'Pilulka i její barva se okamžitě změní a počty ve filtru stavu nad seznamem se aktualizují.',
  'help.guide.place-status.tip.1': 'Stav existuje jen ve Sbírkách. Když místo zkopírujete do cesty, stav se nepřenese.',
  'help.guide.place-status.tip.2':
    'V cestě otevře „Uložit do sbírky“ okno „Uložit do seznamu“ s pilulkou stavu u každého seznamu, ve kterém místo je, a lišta výběru v panelu míst nabízí „Označit jako navštívené v seznamech“.',
  // place-detail
  'help.guide.place-detail.title': 'Otevření uloženého místa',
  'help.guide.place-detail.goal':
    'Zobrazte si vše o místě a co s ním můžete dělat: upravit ho, zkopírovat do cesty, najít cestu k němu nebo ho odebrat.',
  'help.guide.place-detail.step.1':
    'Klikněte na řádek místa. Vedle seznamu se otevře panel s detailem a mapa se na místo přesune.',
  'help.guide.place-detail.step.2':
    'Dole jsou „Upravit“, „Kopírovat do výletu“, tlačítko navigace, které otevře místo v mapové aplikaci, a „Odebrat ze seznamu“. Fotoaparátem na obálce nahradíte automatickou fotku vlastní.',
  'help.guide.place-detail.result':
    'Přes „Upravit“ změníte název, kategorii, štítky, adresu, souřadnice, popis a odkazy přímo v panelu.',
  'help.guide.place-detail.tip.1':
    'Pokud místo nemá vlastní obrázek, obálka se načte automaticky. Vlastní obrázek může být JPG, PNG, GIF, WebP nebo HEIC do 20 MB. Ikona koše vedle fotoaparátu vrátí automatickou fotku.',
  'help.guide.place-detail.tip.2':
    'Každý člen včetně vás může pod stavem udělit hodnocení hvězdičkami; filtr „Hodnocení“ v řádku filtrů používá průměr.',
  // labels
  'help.guide.labels.title': 'Seskupit místa pomocí štítků',
  'help.guide.labels.goal': 'Dejte seznamu vlastní štítky, třeba čtvrti nebo dny, navíc ke společným kategoriím.',
  'help.guide.labels.step.1':
    'Klikněte na „Přidat štítek“ vedle štítků nad mapou („Spravovat štítky“, jakmile seznam nějaké má). Když není zobrazená mapa, je tlačítko na konci řádku filtrů.',
  'help.guide.labels.step.2':
    'Zadejte název, vyberte barvu a klikněte na „Přidat štítek“. Ve stejném dialogu můžete existující štítky přejmenovat, přebarvit nebo smazat.',
  'help.guide.labels.step.3':
    'Zapněte „Vybrat“, zaškrtněte místa, na liště výběru klikněte na „Přiřadit štítek“, vyberte štítky a potvrďte tlačítkem „Přiřadit štítek“. Jednomu místu můžete štítky přidat také přes „Upravit“ v jeho detailu.',
  'help.guide.labels.step.4':
    'Kliknutím na jeden nebo více štítků nad mapou zobrazíte v seznamu i na mapě jen místa, která mají některý z nich. Dalším kliknutím štítek z filtru odeberete.',
  'help.guide.labels.result':
    'Místa se štítky je ukazují přímo na řádku. Filtr podle štítků mají k dispozici všichni členové, včetně těch, kteří mohou jen prohlížet.',
  'help.guide.labels.tip.1':
    'Štítky patří k seznamu, ve kterém vznikly. Když místo přesunete do jiného seznamu, jeho štítky se odeberou.',
  'help.guide.labels.tip.2': 'Ke správě a přiřazování štítků potřebujete oprávnění seznam upravovat.',
  // filter-select
  'help.guide.filter-select.title': 'Filtrovat a vybírat místa',
  'help.guide.filter-select.goal': 'Vyfiltrujte seznam a změňte víc míst najednou.',
  'help.guide.filter-select.step.1':
    'Použijte rozbalovací nabídky v řádku filtrů: stav, kategorie, minimální hodnocení a řazení. U stavu a kategorie vidíte, kolik míst každé volbě odpovídá.',
  'help.guide.filter-select.step.2':
    'Klikněte na ikonu zaškrtávacího políčka, „Vybrat“, za rozbalovacími nabídkami. U každého řádku se objeví zaškrtávací políčko a zobrazí se lišta výběru.',
  'help.guide.filter-select.step.3':
    'Zaškrtněte místa nebo použijte „Vybrat vše“ pro všechna místa, která filtr zobrazuje, a pak zvolte „Přiřadit štítek“, „Přesunout do seznamu“, „Duplikovat do seznamu“, „Kopírovat do výletu“ nebo „Smazat“. Přesun a mazání může použít jen vlastník nebo správce seznamu.',
  'help.guide.filter-select.result': 'Akce se použijí na celý výběr najednou. Křížkem × vpravo režim výběru ukončíte.',
  'help.guide.filter-select.tip.1':
    '„Vybrat vše“ vybere jen místa, která odpovídají filtru. Chcete-li pracovat se všemi místy „Chci navštívit“, vyfiltrujte „Chci navštívit“ a klikněte na „Vybrat vše“.',
  // copy-to-trip
  'help.guide.copy-to-trip.title': 'Kopírování míst do cesty',
  'help.guide.copy-to-trip.goal': 'Přidejte uložená místa jako zastávky do některé ze svých cest.',
  'help.guide.copy-to-trip.step.1':
    'Zapněte „Vybrat“ a zaškrtněte místa, nebo otevřete jedno místo a v jeho panelu s detailem použijte „Kopírovat do výletu“.',
  'help.guide.copy-to-trip.step.2': 'Na liště výběru klikněte na „Kopírovat do výletu“.',
  'help.guide.copy-to-trip.step.3': 'Vyberte cestu. Dlouhý seznam zúžíte vyhledávacím polem.',
  'help.guide.copy-to-trip.result':
    'Místa se přidají do seznamu míst dané cesty i s názvem, popisem, kategorií, poznámkami, cenou, souřadnicemi, fotkou a štítky. Ve sbírce se nic nezmění.',
  'help.guide.copy-to-trip.tip.1':
    'Mohou to udělat i diváci sdíleného seznamu. Místa se ze seznamu zkopírují a seznam samotný se nezmění.',
  // share-list
  'help.guide.share-list.title': 'Sdílení seznamu s dalšími lidmi',
  'help.guide.share-list.goal': 'Plánujte seznam společně s dalšími lidmi v této instanci TREK, a to živě.',
  'help.guide.share-list.step.1': 'V záhlaví seznamu klikněte na „Sdílet“.',
  'help.guide.share-list.step.2': 'Vyberte uživatele a roli: Divák, Editor nebo Správce.',
  'help.guide.share-list.step.3':
    'Klikněte na „Odeslat pozvánku“. Osoba se zobrazuje jako čekající, dokud pozvánku nepřijme na své liště seznamů nebo z oznámení.',
  'help.guide.share-list.result':
    'Jakmile pozvání přijmou, objeví se jim seznam pod „Sdílené“ a každá změna se synchronizuje živě. Členy a jejich role můžete dál upravovat ve stejném dialogu.',
  'help.guide.share-list.tip.1':
    'Diváci si mohou místa prohlížet, hodnotit a kopírovat do svých cest. Editoři přidávají a upravují místa a štítky. Správci navíc mohou přesouvat a mazat.',
  'help.guide.share-list.tip.2': 'Zvát a odebírat lidi může jen vlastník; člen může sdílený seznam sám opustit.',
  // export-list
  'help.guide.export-list.title': 'Export seznamu do souboru',
  'help.guide.export-list.goal': 'Předejte seznam někomu na jiném serveru TREK, nebo ho otevřete v mapové aplikaci.',
  'help.guide.export-list.step.1': 'V záhlaví seznamu klikněte na „Exportovat“.',
  'help.guide.export-list.step.2':
    'Zvolte „Seznam TREK“, pokud chcete seznam použít v jiném TREKu i se štítky a stavy, nebo GPX pro OsmAnd, Organic Maps, Garmin a další aplikace, které umí načíst trasové body.',
  'help.guide.export-list.result': 'Soubor se stáhne. Sdílený seznam může exportovat kterýkoli jeho člen.',
  'help.guide.export-list.tip.1':
    'Místo bez souřadnic nemůže být trasovým bodem v GPX. Vynechá se a TREK vám řekne, kolik takových míst bylo.',
  'help.guide.export-list.tip.2':
    'Hodnocení, členové a nahrané fotky se záměrně neexportují; patří k tomuto TREKu, ne k seznamu.',
  // import-file
  'help.guide.import-file.title': 'Import seznamu ze souboru',
  'help.guide.import-file.goal':
    'Importujte soubor se seznamem TREK nebo soubor GPX jako nový seznam, nebo do existujícího seznamu.',
  'help.guide.import-file.step.1':
    'Na liště seznamů klikněte na tlačítko importu se šipkou nahoru vedle „Nový seznam“.',
  'help.guide.import-file.step.2':
    'Vyberte soubor. Než TREK cokoli naimportuje, ukáže vám, co soubor obsahuje: název, počet míst a počet štítků.',
  'help.guide.import-file.step.3':
    'Ponechte „Nový seznam“, případně změňte název, a klikněte na „Importovat“. Nebo vyberte „Přidat do seznamu“, pokud chcete místa vložit do seznamu, který můžete upravovat, a klikněte na „Přidat do seznamu“.',
  'help.guide.import-file.result':
    'Otevře se seznam s importovanými místy. Import do seznamu místa jen přidává. Místa, která v něm už jsou, si ponechají stav, poznámky i štítky.',
  'help.guide.import-file.tip.1':
    'Z GPX se každý pojmenovaný trasový bod stane místem. Stopy jsou čáry, proto se vynechají, a náhled ukáže, kolik bodů to bylo.',
  'help.guide.import-file.tip.2':
    'Soubor, který není seznam TREK ani GPX, se odmítne a TREK zobrazí důvod. Pokud nejde načíst jedno místo, přeskočí se jen to místo, ne celý soubor.',
  // edit-list
  'help.guide.edit-list.title': 'Úprava nebo smazání seznamu',
  'help.guide.edit-list.goal': 'Změňte název, barvu, obálku, popis nebo odkazy seznamu, nebo seznam odstraňte.',
  'help.guide.edit-list.step.1': 'V záhlaví seznamu klikněte na „Upravit“. Vidí ho jen vlastník.',
  'help.guide.edit-list.step.2':
    'Upravte, co potřebujete, a klikněte na „Uložit“. Ikona koše vlevo dole, „Smazat seznam“, po potvrzení smaže seznam i všechna jeho místa.',
  'help.guide.edit-list.result': 'Záhlaví nahoře hned ukáže novou barvu, obálku a popis.',
  'help.guide.edit-list.tip.1': 'Smazání seznamu nejde vrátit. Pokud si chcete nechat kopii, nejdřív ho exportujte.',
  // all-saved
  'help.guide.all-saved.title': 'Prohledat celou knihovnu',
  'help.guide.all-saved.goal': 'Prohlédněte si najednou místa ze všech seznamů, které vlastníte.',
  'help.guide.all-saved.step.1':
    'Na liště seznamů klikněte na „Vše uložené“. Zobrazí v jednom pohledu místa ze všech seznamů, které vlastníte nebo spoluvlastníte.',
  'help.guide.all-saved.step.2':
    'Pište do pole „Hledat místa“ nad mapou a používejte filtry jako u kteréhokoli seznamu. Funguje tu i „Vybrat“: přesun, duplikace, kopírování do cesty nebo mazání napříč seznamy.',
  'help.guide.all-saved.result':
    'Tady vidíte všechna uložená místa pohromadě. Přidávat ani importovat sem nejde, protože tu není jeden konkrétní seznam, do kterého by se místa uložila.',
  'help.guide.all-saved.tip.1':
    'Štítky a uložené výlety patří vždy k jednomu seznamu, proto se v „Vše uložené“ nenabízejí.',

  // ── Screen: journey ───────────────────────────────────────────────────────────────────
  'help.ctx.journey.title': 'Cestovní deník',
  'help.ctx.journey.summary':
    'Cestovní deník je váš cestovní zápisník postavený na fotkách. Každý deník je propojený s jednou nebo více cestami a plníte ho den po dni záznamy s příběhem, fotkami, náladou a počasím. Tato obrazovka vypisuje vaše deníky; pokud chcete psát, některý otevřete.',
  'help.ctx.journey.bullet.1':
    'Banner nahoře ukazuje právě probíhající deník, nebo váš poslední, s počtem záznamů, fotek a míst. „Pokračovat v psaní“ ho otevře na dnešním dni. Když cesta právě skončila, nabídne banner „Cesta právě skončila“ nad ním, že z ní udělá cestovní deník.',
  'help.ctx.journey.bullet.2':
    'Pod „Všechny cestovní deníky“ je pro každý deník karta s obálkou, stavem, daty a počty; deník zobrazený v banneru se tu znovu neobjevuje. Kliknutím na kartu deník otevřete.',
  'help.ctx.journey.bullet.3':
    'Poslední karta v mřížce, „Vytvořit nový cestovní deník“, založí nový deník z vašich cest.',
  // create-journey
  'help.guide.create-journey.title': 'Vytvořit cestovní deník',
  'help.guide.create-journey.goal': 'Založte k cestě deník, do kterého se místa z cesty rovnou přidají jako návrhy.',
  'help.guide.create-journey.step.1': 'Klikněte na „Vytvořit nový cestovní deník“, poslední kartu v mřížce.',
  'help.guide.create-journey.step.2':
    'Pojmenujte ho, případně doplňte podtitul, a zaškrtněte cesty, ke kterým patří. Počítadlo ukazuje, kolik míst se přidá.',
  'help.guide.create-journey.step.3': 'Klikněte na „Vytvořit cestovní deník“.',
  'help.guide.create-journey.result':
    'Otevře se deník. Každé místo z propojených cest se v časové ose zobrazí jako návrh, jednou za každý den, na který je naplánované. Ke každému můžete napsat záznam.',
  'help.guide.create-journey.tip.1': 'Další cesty můžete propojit později v „Nastavení cestovního deníku“.',
  'help.guide.create-journey.tip.2': 'Deník můžete mít i bez cest. Záznamy pak přidáváte ručně.',
  // open-journey
  'help.guide.open-journey.title': 'Otevřít cestovní deník',
  'help.guide.open-journey.goal': 'Otevřete deník a zjistěte, kde se otevře.',
  'help.guide.open-journey.step.1':
    'Klikněte na kartu. Na každé je obálka, termín a počet záznamů, fotek a míst, které deník obsahuje.',
  'help.guide.open-journey.result':
    'Probíhající deník se otevře na dnešním dni, a pokud pro dnešek zatím nic napsané není, na posledním záznamu před dneškem. Dokončený deník se otevře na začátku.',
  'help.guide.open-journey.tip.1':
    'Obálkou je první fotka deníku, pokud nějakou nenastavíte v „Nastavení cestovního deníku“.',
  // continue-writing
  'help.guide.continue-writing.title': 'Pokračovat v aktuálním deníku',
  'help.guide.continue-writing.goal': 'Otevřete rovnou dnešní stránku deníku cesty, na které právě jste.',
  'help.guide.continue-writing.step.1':
    'Klikněte na „Pokračovat v psaní“ v banneru nahoře. Zobrazuje se tam probíhající deník, a pokud žádný neprobíhá, ten nejnovější.',
  'help.guide.continue-writing.result':
    'Deník se otevře na dnešku, nebo na posledním záznamu před dneškem, pokud ještě nic napsáno není.',
  'help.guide.continue-writing.tip.1':
    'Když cesta právě skončila, zobrazí se nad tímto bannerem banner „Cesta právě skončila“: „Vytvořit cestovní deník“ založí deník s touto cestou už zaškrtnutou, „Zavřít“ nabídku v tomto prohlížeči skryje.',

  // ── Screen: journey-detail ────────────────────────────────────────────────────────────
  'help.ctx.journey-detail.title': 'Deník',
  'help.ctx.journey-detail.summary':
    'Otevřený cestovní deník: vlevo časová osa po dnech, vpravo mapa s přepínatelnými vrstvami pro plán, zaznamenané trasy, záznamy a fotky. Záhlaví ukazuje počty, Studio, přepínač návrhů a ⋯ pro „Nastavení cestovního deníku“. Záznamy přidáváte přes lištu pod ním.',
  'help.ctx.journey-detail.bullet.1':
    'Záhlaví: šipka zpět a odznak stavu, obálka, název a podtitul, počty dnů, míst, záznamů a fotek a vpravo Studio, oko, kterým skryjete nebo zobrazíte návrhy, a ⋯ pro „Nastavení cestovního deníku“.',
  'help.ctx.journey-detail.bullet.2':
    'Panel nástrojů: karty „Časová osa“ a „Galerie“, „Hledat v této cestě“ a „Přidat záznam“. V „Galerie“ je místo „Přidat záznam“ tlačítko „Nahrát“.',
  'help.ctx.journey-detail.bullet.3':
    'Časová osa: sekce pro každý den s jeho číslem, počtem míst a + pro přidání záznamu k tomuto dni. Pod ní karty záznamů s fotkami, náladou, počasím a příběhem a čárkované karty návrhů z cest, každá s × pro zamítnutí.',
  'help.ctx.journey-detail.bullet.4':
    'Mapa: lišta vrstev nahoře přepíná „Plán“ (prázdné špendlíky a čárkované trasy GPX z cest), „Zaznamenáno“ (plné trasy uložené z Dawarich), „Záznamy“ (špendlíky v barvách dnů spojené tenkou čárkovanou čarou v pořadí podle data) a „Fotky“. (i) vedle nich vysvětluje všechny symboly.',
  'help.ctx.journey-detail.bullet.5':
    '„Nastavení cestovního deníku“ (⋯): obálka, název a podtitul, stav, stopy GPX, zaznamenané dny, místa z fotek, pole záznamů, odmítnuté návrhy, synchronizované cesty, přispěvatelé a kteří členové cesty mají přístup, veřejné sdílení, archivace a smazání.',
  'help.ctx.journey-detail.bullet.6':
    'Na konci dlouhé časové osy najdete „Zpět nahoru“, počítadlo dnů, kterým skočíte na libovolný den nebo záznam, a „Přejít na poslední záznam“.',
  // add-entry
  'help.guide.add-entry.title': 'Psaní záznamu',
  'help.guide.add-entry.goal': 'Přidejte příběh dne s nadpisem, textem, náladou a počasím.',
  'help.guide.add-entry.step.1':
    'Klikněte na liště nástrojů na „Přidat záznam“, nebo na + na pravém konci záhlaví dne, pokud chcete začít u konkrétního dne.',
  'help.guide.add-entry.step.2':
    'Zadejte název záznamu a napište text. Panel nástrojů nad textem přidá v Markdownu tučné písmo, kurzívu, nadpisy, citace, odkazy a seznamy.',
  'help.guide.add-entry.step.3':
    'V pravém sloupci zkontrolujte datum a čas, vyhledejte místo nebo použijte svou aktuální polohu a vyberte náladu a počasí.',
  'help.guide.add-entry.step.4': 'Klikněte na „Uložit“.',
  'help.guide.add-entry.result':
    'Záznam se objeví u svého dne na časové ose a jako špendlík na mapě. Počty v záhlaví se aktualizují.',
  'help.guide.add-entry.tip.1': 'Když píšete do návrhu, používáte stejný editor, jen s už nastaveným místem.',
  'help.guide.add-entry.tip.2':
    'Záznam s místem má volbu „Vynechat z trasy“: záznam zůstane v deníku, ale nezapočítá se do vzdálenosti ani zemí a ve Studiu se nezobrazí na mapě.',
  // entry-photos
  'help.guide.entry-photos.title': 'Fotky a videa u záznamu',
  'help.guide.entry-photos.goal': 'Přidejte ke dni fotky; první z nich se stane obálkou záznamu.',
  'help.guide.entry-photos.step.1': 'Přes ⋯ na kartě záznamu otevřete jeho nabídku a zvolte „Upravit“.',
  'help.guide.entry-photos.step.2':
    'Klikněte na „Nahrát fotky“ a vyberte soubory. „Z galerie“ použije fotky, které už jsou v galerii deníku. „External photos“ vyhledá fotky z daného dne v připojené knihovně Immich nebo Synology.',
  'help.guide.entry-photos.step.3':
    'Najeďte na obrázek a kliknutím na „Nastavit jako 1.“ ho zvolte jako obálku. Pak klikněte na „Uložit“.',
  'help.guide.entry-photos.result': 'Fotky se zobrazí na kartě i v galerii. První z nich slouží všude jako náhled.',
  'help.guide.entry-photos.tip.1':
    'Videa přidáte k záznamu stejně: mp4, m4v, webm nebo mov do 500 MB. Ukládají se beze změn.',
  'help.guide.entry-photos.tip.2':
    'Soubory HEIC z iPhonu se při nahrání převedou na JPEG, čímž přijdou o GPS a metadata fotoaparátu.',
  // suggestions
  'help.guide.suggestions.title': 'Použití nebo zamítnutí návrhů',
  'help.guide.suggestions.goal': 'Převeďte místa ze svých cest na záznamy a zamítněte ta, o kterých psát nebudete.',
  'help.guide.suggestions.step.1':
    'Návrh je karta s čárkovaným okrajem a tlačítkem „Přidat záznam“: místo z propojené cesty v den, na který bylo naplánované. Kliknutím otevřete editor s místem a dnem už nastaveným.',
  'help.guide.suggestions.step.2':
    'U karty, kterou nepoužijete, klikněte na × na jejím pravém konci. Karta zmizí z časové osy, ale nesmaže se, a synchronizace cesty ji už znovu nenavrhne.',
  'help.guide.suggestions.step.3':
    'Rozmysleli jste si to? Přes ⋯ v záhlaví otevřete „Nastavení cestovního deníku“: „Vrátit zahozené návrhy“ ukazuje, kolik jich je, a vrátí je všechny.',
  'help.guide.suggestions.result':
    'Na časové ose jsou jen záznamy, které chcete napsat. Ikonou oka v záhlaví při čtení skryjete všechny návrhy najednou.',
  'help.guide.suggestions.tip.1': 'Místo naplánované na dva dny vytvoří návrh pro každý z nich.',
  'help.guide.suggestions.tip.2': 'Návrhy se do statistik nikdy nepočítají, počítají se jen napsané záznamy.',
  // add-on-day
  'help.guide.add-on-day.title': 'Přidat záznam k dřívějšímu dni',
  'help.guide.add-on-day.goal': 'Pište o dni v minulosti, aniž byste pak museli měnit datum.',
  'help.guide.add-on-day.step.1': 'Klikněte na + na pravém konci záhlaví daného dne.',
  'help.guide.add-on-day.step.2':
    'Otevře se editor s předvyplněným datem. Pište a ukládejte tlačítkem „Uložit“ jako obvykle.',
  'help.guide.add-on-day.result': 'Záznam se okamžitě přidá ke správnému dni.',
  'help.guide.add-on-day.tip.1':
    'Pořadí v rámci dne změníte tak, že najedete myší na záznam: vlevo od něj se objeví „Posunout nahoru“ a „Posunout dolů“.',
  // pros-cons
  'help.guide.pros-cons.title': 'Přidání verdiktu',
  'help.guide.pros-cons.goal': 'Shrňte den: co bylo skvělé a co ne.',
  'help.guide.pros-cons.step.1':
    'V editoru najdete pod příběhem sekci „Klady a zápory“. Napište bod do pole „Klady“ nebo „Zápory“ a další přidáte přes „Přidat další“.',
  'help.guide.pros-cons.step.2': 'Uložte. Na kartě „Zobrazit více“ otevře příběh a verdikt jako dva krátké seznamy.',
  'help.guide.pros-cons.result': 'Palec nahoru a palec dolů se zobrazí pod příběhem, kde je hned uvidíte.',
  'help.guide.pros-cons.tip.1':
    'Pokud deník hodnocení nepoužívá, můžete sekci vypnout v části „Pole záznamu“ v „Nastavení cestovního deníku“.',
  // search-journey
  'help.guide.search-journey.title': 'Hledání v dlouhém deníku',
  'help.guide.search-journey.goal': 'Najděte záznam, aniž byste museli procházet týdny záznamů.',
  'help.guide.search-journey.step.1':
    'Pište do pole „Hledat v této cestě“ na liště nástrojů. Časová osa se filtruje už během psaní, a to podle nadpisů, příběhů, míst a štítků. Na diakritice ani velikosti písmen nezáleží.',
  'help.guide.search-journey.step.2':
    'Pokud chcete místo toho skočit na konkrétní den, klikněte na počítadlo dnů dole na časové ose, mezi „Zpět nahoru“ a „Přejít na poslední záznam“.',
  'help.guide.search-journey.result':
    'Časová osa se posune ke dni nebo záznamu, který jste vybrali, a mapa se tam přesune. Dokud pole hledání nevymažete, zobrazují se jen odpovídající záznamy.',
  'help.guide.search-journey.tip.1':
    'Probíhající deník se otevře na dnešní stránce, takže aktuální stránku obvykle vidíte hned.',
  'help.guide.search-journey.tip.2': 'Oko v záhlaví skryje návrhy, takže uvidíte jen záznamy, které jste napsali.',
  // gallery-map
  'help.guide.gallery-map.title': 'Procházet galerii a mapu',
  'help.guide.gallery-map.goal': 'Prohlédněte si celý deník v obrázcích a jako místa na mapě.',
  'help.guide.gallery-map.step.1':
    'Na liště nástrojů přepněte na „Galerie“. Zobrazí se všechny fotky ze všech záznamů a k tomu obrázky nahrané přímo do galerie. Kliknutím kterýkoli otevřete v prohlížeči fotek.',
  'help.guide.gallery-map.step.2':
    'Tlačítkem „Nahrát“ vpravo přidáte obrázky do galerie. Pokud máte připojený Immich nebo Synology, můžete obrázky vybrat i odtamtud tlačítkem s názvem knihovny.',
  'help.guide.gallery-map.result':
    'Špendlíky mají barvu svého dne a tenká čárkovaná čára je spojuje v pořadí podle data. Lišta vrstev nahoře na mapě přepíná, co se zobrazuje.',
  'help.guide.gallery-map.tip.1':
    'Stopy GPX z cesty se zobrazují ve vrstvě „Plán“ na mapě jako čárkované linie. Vypnete je volbou „Zobrazit všechny GPX stopy z cest“ v „Nastavení cestovního deníku“.',
  'help.guide.gallery-map.tip.2':
    'Fotky z galerie s polohou se zobrazí i na veřejné mapě, pokud sdílíte Galerii i Mapu.',
  // entry-fields
  'help.guide.entry-fields.title': 'Vypnutí polí záznamu',
  'help.guide.entry-fields.goal': 'Zobrazte v editoru jen pole, která tento deník používá.',
  'help.guide.entry-fields.step.1': 'Kliknutím na ⋯ vpravo nahoře v záhlaví otevřete „Nastavení cestovního deníku“.',
  'help.guide.entry-fields.step.2': 'V části „Pole záznamu“ vypněte „Nálada“, „Počasí“ nebo „Pro a proti“.',
  'help.guide.entry-fields.result':
    'Editor tato pole přestane zobrazovat. Nic z toho, co jste napsali, se neztratí: když pole znovu zapnete, uložené hodnoty se opět zobrazí. Sdílený deník skrývá stejná pole.',
  'help.guide.entry-fields.tip.1':
    'Přepínače platí pro každý deník zvlášť, takže pracovní cesta a dovolená mohou mít různé nastavení.',
  // link-trip
  'help.guide.link-trip.title': 'Propojení další cesty',
  'help.guide.link-trip.goal': 'Přidejte do deníku místa z další cesty jako návrhy.',
  'help.guide.link-trip.step.1': 'Kliknutím na ⋯ vpravo nahoře v záhlaví otevřete „Nastavení cestovního deníku“.',
  'help.guide.link-trip.step.2': 'V části „Synchronizované cesty“ klikněte na „Přidat cestu“.',
  'help.guide.link-trip.step.3': 'Vyhledejte cestu podle názvu nebo cíle a klikněte vedle ní na „Připojit“.',
  'help.guide.link-trip.result':
    'Místa z cesty se na časové ose objeví jako návrhy ve svých dnech a přidají se do vrstvy „Plán“ na mapě spolu se stopami GPX.',
  'help.guide.link-trip.tip.1':
    'Košem vedle propojené cesty ji po potvrzení odpojíte; záznamy, které jste napsali, zůstanou.',
  'help.guide.link-trip.tip.2':
    'Záznamy s dnem se započítají jen jednou, bez ohledu na to, kolik cest daný den pokrývá.',
  // share-public
  'help.guide.share-public.title': 'Veřejné sdílení deníku',
  'help.guide.share-public.goal': 'Dejte lidem bez účtu v TREK odkaz jen pro čtení.',
  'help.guide.share-public.step.1':
    'Přes ⋯ v záhlaví otevřete „Nastavení cestovního deníku“ a posuňte se k části „Veřejné sdílení“.',
  'help.guide.share-public.step.2': 'Klikněte na „Vytvořit odkaz ke sdílení“.',
  'help.guide.share-public.step.3':
    'Vyberte, co návštěvníci uvidí: „Časová osa“, „Galerie“ a „Mapa“. V části „Mapa“ přidá „Plán cesty“ plánovaná místa a trasy a „Zaznamenané trasy“ trasy zaznamenaných dnů. „Kopírovat“ zkopíruje odkaz do schránky.',
  'help.guide.share-public.result':
    'Kdokoli s odkazem uvidí zapnuté sekce a nic dalšího. Pole, která jste vypnuli v „Pole záznamu“, zůstanou skrytá i tam.',
  'help.guide.share-public.tip.1':
    'Fotky se na veřejné mapě zobrazí, jen když je zapnutá „Galerie“ i „Mapa“. Když je „Mapa“ vypnutá, server před odesláním fotek odstraní jejich souřadnice.',
  'help.guide.share-public.tip.2': 'Sdílení ukončíte kliknutím na „Smazat odkaz“ vedle „Kopírovat“.',
  // contributors
  'help.guide.contributors.title': 'Psát společně',
  'help.guide.contributors.goal': 'Umožněte dalšímu cestovateli přidávat vlastní záznamy a fotky.',
  'help.guide.contributors.step.1':
    'Přes ⋯ v záhlaví otevřete „Nastavení cestovního deníku“ a najděte část „Přispěvatelé“.',
  'help.guide.contributors.step.2':
    'Klikněte na „Pozvat přispěvatele“ a vyhledejte uživatele podle jména nebo e-mailu.',
  'help.guide.contributors.step.3': 'Vyberte „Divák“ nebo „Editor“ a klikněte na „Pozvat“.',
  'help.guide.contributors.result':
    'Deník se objeví v jejich seznamu a u jejich záznamů je uvedené jejich jméno. Přispěvatele odeberete kliknutím na × vedle něj.',
  'help.guide.contributors.tip.1':
    'Přispěvatelé jsou lidé v této instanci TREK. Pro všechny ostatní je tu veřejný odkaz.',
  // studio
  'help.guide.studio.title': 'Uspořádat deník jako fotoknihu',
  'help.guide.studio.goal': 'Udělejte z deníku stránky připravené k tisku.',
  'help.guide.studio.step.1': 'V záhlaví klikněte na „Studio“. Návrhář se otevře přes deník.',
  'help.guide.studio.step.2':
    'Zpět se dostanete kliknutím na × na pravém konci horní lišty. Vrátíte se tam, kde jste byli.',
  'help.guide.studio.result':
    'Lišta a její panely jsou vlevo, dvoustrana na pracovní ploše a vlastnosti vpravo. Automatické rozvržení sestaví knihu z vašich záznamů. Exportovat vytvoří PDF připravené k tisku.',
  'help.guide.studio.tip.1': 'Studio potřebuje okno široké alespoň 1024 px a na telefonu není k dispozici.',
  'help.guide.studio.tip.2':
    'Kniha má stejná přístupová práva jako deník: kdo může deník číst, může knihu otevřít, a kdo může deník upravovat, může ji ukládat.',
  // archive-journey
  'help.guide.archive-journey.title': 'Archivovat nebo smazat deník',
  'help.guide.archive-journey.goal': 'Uzavřete dokončený deník, nebo ho trvale smažte.',
  'help.guide.archive-journey.step.1': 'Kliknutím na ⋯ vpravo nahoře v záhlaví otevřete „Nastavení cestovního deníku“.',
  'help.guide.archive-journey.step.2':
    'Dole deník tlačítkem „Archivovat cestu“ ukončíte a označíte jako archivovaný; „Obnovit cestu“ ho obnoví. „Smazat“ ho po potvrzení odstraní i se všemi záznamy a fotkami.',
  'help.guide.archive-journey.result':
    'Archivovaný deník zůstává ke čtení i ke sdílení; jen se už neotevírá na dnešním dni.',
  'help.guide.archive-journey.tip.1':
    'Smazání nelze vrátit zpět a cesty, se kterými byl deník propojený, se tím nezmění.',
  'help.guide.archive-journey.tip.2': 'Obálku, název a podtitul najdete ve stejném dialogu nahoře.',
  'help.guide.journey-status.title': 'Nastavení stavu cestovního deníku',
  'help.guide.journey-status.goal':
    'Označte deník ručně jako koncept, živý nebo dokončený, místo aby se řídil daty svých cest.',
  'help.guide.journey-status.step.1':
    'Kliknutím na ⋯ vpravo nahoře v záhlaví deníku otevřete „Nastavení cestovního deníku“.',
  'help.guide.journey-status.step.2':
    'V části „Stav“ zvolte „Koncept“, „Živě“ nebo „Dokončeno“. Volba se uloží okamžitě.',
  'help.guide.journey-status.result':
    'Deník si ponechá zvolený stav: „Koncept“ a „Dokončeno“ se zobrazí jako odznak na jeho kartě a v záhlaví a deník ve stavu „Živě“ se zobrazí v banneru nahoře v seznamu deníků.',
  'help.guide.journey-status.tip.1':
    '„Automaticky“ se znovu řídí daty propojených cest. Bez propojené cesty zůstane automatický deník konceptem.',
  'help.guide.journey-status.tip.2': 'Ručně nastavený stav platí, dokud ho nezměníte, i když se změní data cesty.',

  // ── Screen: journey-studio ────────────────────────────────────────────────────────────
  'help.ctx.journey-studio.title': 'Studio', // same-as-en
  'help.ctx.journey-studio.summary':
    'TREK Studio rozvrhne deník do fotoknihy, kterou můžete vytisknout. Otevře se přes deník: lišta a její panely jsou vlevo, dvoustrana, na které pracujete, uprostřed a její vlastnosti vpravo. Automatické rozvržení sestaví první návrh z vašich záznamů, motiv dá knize barvy a písma a asistent s vámi umí navrhovat stránky. Potom můžete vše přesouvat, ořezávat a přestylovat a každý krok lze vrátit.',
  'help.ctx.journey-studio.bullet.1':
    'Horní lišta: vlevo obálka a název deníku. Vpravo kdo další je v knize a zda je uložená, formát stránky, zpět, znovu a vložit, Automatické rozvržení, asistent, nápověda, Exportovat a tlačítko, které zavře Studio.',
  'help.ctx.journey-studio.bullet.2':
    'Lišta vlevo: Stránky, Obsah (fotky a záznamy deníku), Rozvržení, Prvky (text, tvary, čáry, rámečky, ikony a samolepky), Cesta (čísla, mapy, země a značky vytvořené z deníku) a odděleně pod nimi Motiv a Vrstvy.',
  'help.ctx.journey-studio.bullet.3':
    'Pracovní plocha: aktuální dvoustrana se spadávkou a bezpečnými okraji a pod ní lišta přiblížení s volbami Přizpůsobit zobrazení, Zobrazení knihy a Stáhnout tuto dvoustranu.',
  'help.ctx.journey-studio.bullet.4':
    'Vlastnosti vpravo: vše o vybraném prvku, od polohy, velikosti a ořezu po barvy, efekty, pořadí vrstev a zamčení. Když není nic vybrané, ukazují pozadí stránky, motiv, čísla stran a dokument.',
  'help.ctx.journey-studio.bullet.5':
    'Kniha je rozvržena jako tištěná kniha: obálka, jedna první strana naproti prázdné vnitřní straně obálky, dvoustrany, jedna poslední strana a zadní obálka. Čísla stran se počítají od první strany a tisknou se tak, jak je vidíte.',
  'help.ctx.journey-studio.bullet.6':
    'Navrhovat může víc lidí současně: každý vidí kurzory ostatních s jejich jmény. Pokud uložíte verzi, kterou mezitím změnil někdo jiný, TREK místo přepsání jeho práce zobrazí konflikt.',
  'help.ctx.journey-studio.bullet.7':
    'Motiv: jeden vzhled pro celou knihu, její papír, inkoust a tři akcentní barvy, písma a motivy. Prvky propojené s motivem ho následují, když ho změníte.',
  'help.ctx.journey-studio.bullet.8':
    'Asistent: tam, kde správce nastavil AI, otevře bublina v horní liště asistenta, který s vámi rozvrhuje stránky, píše popisky a mění styl knihy. Každá jeho změna je krok, který lze vrátit.',
  // studio-auto-layout
  'help.guide.studio-auto-layout.title': 'Sestavit knihu automaticky',
  'help.guide.studio-auto-layout.goal': 'Získejte jedním kliknutím kompletní první návrh ze záznamů a fotek deníku.',
  'help.guide.studio-auto-layout.step.1': 'V horní liště klikněte na „Auto layout“.',
  'help.guide.studio-auto-layout.step.2':
    'Vyberte „Celá kniha“: nahradí všechny strany a zachová váš název i nastavení stránek. „Tato strana“ přestaví jen dvoustranu na obrazovce. Nabízí se jen u dvoustrany, která vznikla ze záznamu.',
  'help.guide.studio-auto-layout.step.3':
    'Projděte si lištu se stranami. Pokud se vám předchozí verze líbila víc, „Vrátit zpět“ obnoví celé rozvržení.',
  'help.guide.studio-auto-layout.result':
    'Každý záznam dostane v pořadí vlastní dvoustranu a jeho fotky, název a text se rozmístí za vás. Každý prvek zůstává propojený se svým záznamem a mění se s ním, dokud ho neupravíte.',
  'help.guide.studio-auto-layout.tip.1':
    'Obě položky jsou běžné kroky, které lze vrátit, takže je klidně vyzkoušejte a případně vraťte.',
  'help.guide.studio-auto-layout.tip.2':
    'Když Auto layout propojí prvek se záznamem, prvek se po úpravě záznamu aktualizuje. Když prvek změníte v Properties, propojení se zruší.',
  // studio-pages
  'help.guide.studio-pages.title': 'Přidat, přesunout a odebrat dvoustrany',
  'help.guide.studio-pages.goal': 'Upravujte knihu stránku po stránce.',
  'help.guide.studio-pages.step.1':
    'V liště otevřete Stránky. Náhledy ukazují knihu popořadě: obálka, první strana, dvoustrany, poslední strana a zadní obálka. První a poslední strana jsou nakresleny vedle prázdné vnitřní strany své obálky, tak jak se vázaná kniha otevírá.',
  'help.guide.studio-pages.step.2':
    '„Přidat stranu“ dole vloží novou dvoustranu před poslední stranu. Tlačítkem + mezi dvěma náhledy ji vložíte přesně na to místo.',
  'help.guide.studio-pages.step.3':
    'Když najedete myší na miniaturu, zobrazí se její akce: „Posunout dopředu“, „Posunout dozadu“, „Duplikovat stranu“ a „Smazat stranu“. Kliknutím na miniaturu otevřete danou dvojstranu na pracovní ploše.',
  'help.guide.studio-pages.result':
    'Obálka, první a poslední strana a zadní obálka zůstávají na svém místě. Nové dvoustrany se vždy přidávají mezi ně.',
  'help.guide.studio-pages.tip.1': 'Book view v horní liště ukáže celou knihu jako archy, tak jak bude svázaná.',
  'help.guide.studio-pages.tip.2': '„Čísla stran“ zapnete v „Properties“ v části „Dokument“, když není nic vybrané.',
  // studio-layouts
  'help.guide.studio-layouts.title': 'Použít rozvržení na dvojstranu',
  'help.guide.studio-layouts.goal': 'Dejte dvoustraně hotové rozvržení rámečků pro fotky a text.',
  'help.guide.studio-layouts.step.1':
    'V liště otevřete Rozvržení. Nejdřív jsou navržené stránky: celé obálky a dvoustrany v motivu knihy, které tlačítka stylu zúží na jeden vzhled. Moje rozvržení a Vestavěná následují pod nimi ve stejné mřížce.',
  'help.guide.studio-layouts.step.2':
    'Klikněte na jedno z nich. Dvojstrana na pracovní ploše dostane rámečky tohoto rozvržení a vaše stávající fotky a text se do nich umístí.',
  'help.guide.studio-layouts.result':
    'Prázdné rámečky jsou zástupná místa pro obsah: přetáhněte do některého fotku z „Content“, nebo použijte „Add to this page“.',
  'help.guide.studio-my-layouts.title': 'Uložit stránku jako vlastní rozvržení',
  'help.guide.studio-my-layouts.goal': 'Použijte znovu uspořádání, které jste vytvořili na jiných stránkách knihy.',
  'help.guide.studio-my-layouts.step.1': 'Uspořádejte stránku podle sebe a pak v liště otevřete Rozvržení.',
  'help.guide.studio-my-layouts.step.2':
    'Klikněte na Uložit tuto stranu jako rozvržení v části Moje rozvržení. Stránka se v seznamu objeví jako karta.',
  'help.guide.studio-my-layouts.tip.1':
    'Kliknutím na své rozvržení na jiné stránce ji uspořádáte stejně, s jejími vlastními fotkami a texty.',
  'help.guide.studio-my-layouts.result':
    'Vaše rozvržení se ukládají s knihou a nabízejí se na stránkách stejného druhu: rozvržení obálky pro obálky, rozvržení dvoustrany pro dvoustrany.',
  'help.guide.studio-layouts.tip.1': 'Rozvržení je krok, který lze vrátit, jako každý jiný.',
  // studio-content
  'help.guide.studio-content.title': 'Umístit na stranu fotky a záznamy',
  'help.guide.studio-content.goal': 'Přidejte na dvojstranu fotky a záznamy přímo z deníku.',
  'help.guide.studio-content.step.1':
    'V postranním panelu otevřete „Content“. „Photos“ obsahuje všechny obrázky z deníku, „Entries“ záznamy s jejich textem.',
  'help.guide.studio-content.step.2':
    'Přetáhněte fotku na dvojstranu nebo do prázdného rámečku, nebo pod ní klikněte na „Přidat na tuto stránku“. „Nahrát fotky“ přidá obrázky, které ještě v deníku nejsou; „Z Immich“ nebo „Ze Synology“ je vybere z připojené knihovny.',
  'help.guide.studio-content.step.3':
    'Pod záznamem vloží „Title“, „Story“ a „Place“ příslušný text na stranu jako textový prvek. Datum a souřadnice se přidají jako značky a jsou tu vypsané i fotky záznamu.',
  'help.guide.studio-content.result':
    'Přetažená fotka se stane fotografickým prvkem. Text zůstává propojený se záznamem, dokud ho neupravíte.',
  'help.guide.studio-theme.title': 'Dát knize motiv',
  'help.guide.studio-theme.goal': 'Nastavte barvy a písma celé knihy najednou.',
  'help.guide.studio-theme.step.1':
    'V liště otevřete Motiv. Každá karta ukazuje motiv jako malou stránku: jeho papír, písmo a tři akcentní barvy.',
  'help.guide.studio-theme.step.2':
    'Kliknutím na motiv ho vyzkoušíte. Pod kartami můžete změnit jeho paletu, vybrat jiná písma a zvolit motivy a dekoraci.',
  'help.guide.studio-theme.step.3':
    'Klikněte na Použít na knihu, nebo na Použít na tuto stránku pro dvoustranu na obrazovce.',
  'help.guide.studio-theme.tip.1':
    'Prvky propojené s motivem přebírají jeho barvy a písma a následují ho, když ho změníte. Přestylovat i to, co ještě není propojené, nejdřív propojí zbytek.',
  'help.guide.studio-theme.tip.2': 'Barvy z fotek sestaví paletu z obrázků deníku.',
  'help.guide.studio-theme.result':
    'Všechny propojené barvy a písma v knize se změní naráz a použití motivu je jeden krok, který lze vrátit.',
  'help.guide.studio-content.tip.1': 'Vyhledávací pole nahoře v Content filtruje oba seznamy.',
  'help.guide.studio-content.tip.2':
    'Když přetáhnete soubor z počítače na pracovní plochu, TREK ho nahraje a umístí v jednom kroku.',
  // studio-elements
  'help.guide.studio-elements.title': 'Přidat text, tvary, ikony a samolepky',
  'help.guide.studio-elements.goal': 'Doplňte dvojstranu o ozdoby navíc k fotkám a příběhům.',
  'help.guide.studio-elements.step.1':
    'V liště otevřete Prvky. Šest karet třídí, co můžete přidat: Text, Tvary, Čáry, Rámečky, Ikony a Samolepky.',
  'help.guide.studio-elements.step.2':
    'Klikněte na styl textu nebo navržený titulek, tvar, čáru, prázdný rámeček, ikonu či samolepku. Každý prvek se umístí doprostřed dvoustrany a pak jím můžete pohybovat.',
  'help.guide.studio-elements.result':
    'Dvojklikem do textového prvku můžete psát; v Properties nastavíte písmo, řez, velikost, rozestupy a zarovnání.',
  'help.guide.studio-stickers.title': 'Ozdobit samolepkami',
  'help.guide.studio-stickers.goal': 'Přidejte ilustrace, od pamětihodností a jídla po zvířata a šipky.',
  'help.guide.studio-stickers.step.1': 'V liště otevřete Prvky a vyberte Samolepky.',
  'help.guide.studio-stickers.step.2':
    'Vyhledejte slovo nebo procházejte police a kliknutím na samolepku ji umístěte na dvoustranu.',
  'help.guide.studio-stickers.tip.1': 'Při vybrané samolepce ve Vlastnostech přebarvíte její části a zrcadlíte ji.',
  'help.guide.studio-stickers.result': 'Samolepka je kresba, takže zůstává ostrá v jakékoli velikosti.',
  'help.guide.studio-elements.tip.1': 'Rámečky jsou prázdná místa pro fotky: obrázek do nich vložíte později.',
  // studio-travel
  'help.guide.studio-travel.title': 'Přidat mapy, čísla, země a značky',
  'help.guide.studio-travel.goal': 'Přeměňte samotnou cestu na navržené prvky na stránce.',
  'help.guide.studio-travel.step.1':
    'V liště otevřete Cesta. Čtyři karty třídí, co můžete přidat: Čísla, Mapy, Země a Značky.',
  'help.guide.studio-travel.step.2':
    'Každá karta ukazuje prvek s čísly vašeho deníku v barvách motivu: souhrn jako plakát, jízdenku, dopravní značku nebo počítadlo kilometrů, mapu s číslovanými zastávkami nebo oříznutou na jednu zemi, zemi jako razítko, pohlednici nebo špendlík, datum či vzdálenost jako razítko, štítek nebo stuhu.',
  'help.guide.studio-travel.step.3':
    'Klikněte na kartu. Prvek se umístí doprostřed dvoustrany a pak ho můžete přesunout a změnit jeho velikost.',
  'help.guide.studio-travel.result':
    'Prvek se objeví na dvoustraně. Vlastnosti mění jeho vzhled a každé číslo, mapa i země se aktualizují, když se změní deník.',
  'help.guide.studio-text-effects.title': 'Přidat efekty k textu',
  'help.guide.studio-text-effects.goal': 'Dejte nadpisu obrys, stín, oblouk nebo písmena vyplněná vzorem.',
  'help.guide.studio-text-effects.step.1': 'Kliknutím na textový prvek na stránce ho vyberete.',
  'help.guide.studio-text-effects.step.2':
    'Ve Vlastnostech otevřete Efekty a přidejte obrys, stín nebo zvýraznění, nebo vyplňte písmena přechodem či vzorem. Velikost písmen a umístění zakřiví řádek a přizpůsobí ho rámečku.',
  'help.guide.studio-text-effects.tip.1':
    'Přizpůsobit rámečku zmenšuje text, dokud se do rámečku nevejde, takže dlouhý titulek nikdy nepřeteče.',
  'help.guide.studio-text-effects.result': 'Efekt se kreslí spolu s textem, v tisku stejně jako na obrazovce.',
  'help.guide.studio-background.title': 'Změnit pozadí stránky',
  'help.guide.studio-background.goal': 'Vybarvěte stránku barvou, přechodem nebo vzorem, nebo pod ni položte fotku.',
  'help.guide.studio-background.step.1':
    'Klikněte na prázdné místo stránky, aby nebylo nic vybráno. Pozadí stránky je nahoře ve Vlastnostech.',
  'help.guide.studio-background.step.2':
    'Vyberte Papír, Plná, Přechod nebo Vzor a barvu, nebo klikněte na fotku v části Fotka jako pozadí.',
  'help.guide.studio-background.tip.1': 'Použít na všechny stránky dá všem stránkám knihy stejné pozadí.',
  'help.guide.studio-background.result': 'Pozadí zasahuje do spadávky, takže se tiskne až k okraji stránky.',
  'help.guide.studio-layers.title': 'Řadit, skrývat a zamykat pomocí vrstev',
  'help.guide.studio-layers.goal': 'Podívejte se na vše na dvoustraně v pořadí vrstev a pracujte s tím přímo tam.',
  'help.guide.studio-layers.step.1': 'V liště otevřete Vrstvy. Horní část seznamu je přední strana stránky.',
  'help.guide.studio-layers.step.2':
    'Přetažením řádku změníte pořadí, okem prvek skryjete a zámkem ho udržíte na místě. Vyberte jich víc a seskupte je, aby se pohybovaly společně.',
  'help.guide.studio-layers.tip.1': 'Dvojitým kliknutím na řádek dáte prvku vlastní název.',
  'help.guide.studio-layers.tip.2': 'Skryté prvky se do PDF nedostanou.',
  'help.guide.studio-layers.result': 'Plné stránky se dál snadno upravují a hotové části se nedají posunout omylem.',
  'help.guide.studio-travel.tip.1':
    'V Mapách seznam Zastávky obsahuje každou zastávku trasy. Vypněte jednu, aby se vynechala z map a čísel, třeba domácí letiště.',
  'help.guide.studio-travel.tip.2':
    'Mapa země ukazuje jen zastávky této země, takže země vyplní stránku, i když cesta začala dlouhým letem.',
  // studio-properties
  'help.guide.studio-properties.title': 'Úprava vybraného prvku',
  'help.guide.studio-properties.goal': 'Upravte v inspektoru polohu, ořez, styl a vrstvu prvku.',
  'help.guide.studio-properties.step.1':
    'Klikněte na prvek na dvoustraně. Objeví se úchyty pro změnu velikosti a otočení, přetažením prvek přesunete.',
  'help.guide.studio-properties.step.2':
    'Panel „Properties“ vpravo ukazuje nastavení vybrané položky: polohu a velikost, „Crop“ s ohniskem, které určuje, co zůstane v rámečku, výplň nebo přizpůsobení, filtry „Look“, poloměr rohů „Corner“, styl rámečku, pořadí vrstev a „Lock“.',
  'help.guide.studio-properties.step.3':
    '„Duplikovat“ a „Delete“ najdete nahoře v inspektoru. „Undo“ v horní liště kteroukoli z těchto změn vrátí.',
  'help.guide.studio-properties.result':
    'Zamčený prvek na stránce nelze vybrat ani přesunout. Tím chráníte hotové rozvržení, zatímco pracujete s ostatními prvky.',
  'help.guide.studio-properties.tip.1': 'Kliknutím se Shiftem vyberete víc prvků a inspektor je pak upravuje společně.',
  'help.guide.studio-properties.tip.2':
    'Pokud upravíte prvek, který umístilo automatické rozvržení, přestane být propojený se záznamem a nebude sledovat jeho další změny.',
  // studio-format
  'help.guide.studio-format.title': 'Zvolit formát stránky',
  'help.guide.studio-format.goal': 'Než začnete tvořit rozvržení, nastavte tiskový formát knihy.',
  'help.guide.studio-format.step.1':
    'Klikněte na formát stránky v horní liště, vedle nástrojů pro úpravy. Ukazuje název a tvar formátu.',
  'help.guide.studio-format.step.2':
    'Vyberte „Square 21 × 21 cm“, „Square 30 × 30 cm“, A4 nebo A5 na šířku či na výšku, nebo zadejte vlastní šířku a výšku v milimetrech. Spadávka a bezpečný okraj jsou níže.',
  'help.guide.studio-format.result':
    'Každá dvojstrana se vykreslí v této velikosti, ve výchozím stavu se spadávkou 3 mm a bezpečným okrajem 5 mm.',
  'help.guide.studio-format.tip.1':
    'Nejdřív změňte formát a teprve pak spusťte „Auto layout“. Ten použije formát, který je nastavený v okamžiku spuštění.',
  'help.guide.studio-format.tip.2': 'Zeptejte se tiskárny na hodnoty spadávky a bezpečného okraje a zadejte je.',
  // studio-export
  'help.guide.studio-export.title': 'Exportovat knihu do PDF',
  'help.guide.studio-export.goal': 'Získejte soubor připravený k tisku, nebo ke čtení na obrazovce.',
  'help.guide.studio-export.step.1': 'V horní liště klikněte na „Exportovat“.',
  'help.guide.studio-export.step.2':
    'Zvolte „Jednotlivé stránky“, tedy jednu stránku na list v pořadí čtení, jak to potřebuje tiskárna, nebo „Dvojstrany“, vždy dvě stránky tak, jak se kniha otevírá. „Ořezové značky“ přidají spadávku na všechny okraje a ukážou, kde řezat.',
  'help.guide.studio-export.step.3':
    'Klikněte na „Náhled tisku“. Prohlížeč otevře strany. Soubor vytvoříte volbou „Uložit jako PDF“.',
  'help.guide.studio-export.result':
    'PDF s tolika listy, kolik dialog ohlásil, ve formátu stránky, který jste nastavili.',
  'help.guide.studio-export.tip.1': 'PDF vytvoříte jen na počítači, stejně jako celé Studio.',
  'help.guide.studio-export.tip.2':
    'Pro náhled exportujte „Dvojstrany“ bez ořezových značek, pro tiskárnu „Jednotlivé stránky“ s nimi.',
  // studio-spread-file
  'help.guide.studio-spread-file.title': 'Použít dvoustranu v jiné knize',
  'help.guide.studio-spread-file.goal': 'Přeneste návrh, který se vám líbí, z knihy jednoho deníku do jiné.',
  'help.guide.studio-spread-file.step.1':
    'Když máte dvoustranu na pracovní ploše, klikněte na „Stáhnout tuto dvoustranu“ na pravém konci lišty přiblížení. Soubor obsahuje návrh, ne fotky.',
  'help.guide.studio-spread-file.step.2':
    'V druhé knize otevřete „Pages“, klikněte na „Importovat“ vedle „Přidat stranu“ a vyberte soubor.',
  'help.guide.studio-spread-file.result':
    'Dvojstrana se importuje i s rámečky a styly textu. Do rámečků pak vložte fotky z nového deníku.',
  'help.guide.studio-spread-file.tip.1': 'Pokud soubor není návrhem dvojstrany, TREK ho odmítne a uvede důvod.',

  // ── Screen: settings (all tabs) ───────────────────────────────────────────────────────
  'help.ctx.settings.title': 'Nastavení',
  'help.ctx.settings.summary':
    'Vaše osobní nastavení, s kartou pro každé téma v postranním panelu vlevo. Většina přepínačů platí hned po přepnutí. Formulář s tlačítkem „Uložit“ se uloží, až na něj kliknete. Nic tady nemění TREK pro nikoho jiného.',
  'help.ctx.settings.bullet.1':
    'Postranní panel vlevo: „Zobrazení“, „Vzhled“, „Mapa“, „Oznámení“, „Integrace“, „Offline“ a „Účet“. „Pluginy“ se zobrazí, jakmile je aktivní nějaký plugin. „O aplikaci“ se zobrazí, pokud ho provozovatel neskryl. Verze je uvedená dole.',
  'help.ctx.settings.bullet.2':
    'Jako první se otevře „Zobrazení“. Obsahuje jazyk, jazyk názvů míst, jednotky, formát času, začátek týdne a zobrazovanou měnu a také chování mapy cesty. „Vzhled“ obsahuje motiv, barvy, čitelnost, velikost písma a widgety přehledu.',
  'help.ctx.settings.bullet.3':
    '„Mapa“ určuje, čím se mapa vykresluje, a její styl; „Oznámení“ určuje, které události chodí kterým kanálem; „Integrace“ propojuje knihovny fotek, AirTrail, Dawarich a wanderer a obsahuje API klíče a MCP; „Offline“ určuje, co si toto zařízení ukládá.',
  'help.ctx.settings.bullet.4':
    'V části „Účet“ najdete svůj profil, heslo, dvoufaktorové ověření, přístupové klíče a možnost smazat účet.',
  'help.ctx.settings-display.title': 'Zobrazení',
  'help.ctx.settings-display.summary':
    'Čím se TREK otevře, jaký jazyk a jednotky používá a jak se chová mapa cesty a rezervace. Každá změna platí okamžitě.',
  'help.ctx.settings-display.bullet.1':
    '„Spuštění“: „Úvodní stránka“ otevře „Přehled“ nebo „Aktivní cesta“; u „Aktivní cesta“ vyberete v „Úvodní karta“, na které kartě se cesta otevře.',
  'help.ctx.settings-display.bullet.2':
    'Jazyk a region: „Zobrazovaná měna“ (nebo „Měna cesty“ bez přepočtu), „Jazyk“, „Názvy míst“, „Jednotky teploty“, „Jednotky vzdálenosti“, „Formát času“ a „Týden začíná“.',
  'help.ctx.settings-display.bullet.3':
    'Cestování a mapa: „Otevírat místa v“, „Datum na začátku nadpisů dnů“, „Popisky tras rezervací“, „Vždy zobrazovat trasy rezervací“, „Kompaktní značky pro nenaplánovaná místa“, „Objevovat místa na mapě“, „Skrýt rezervační kódy“ a „Optimalizovat trasu od ubytování“.',
  'help.ctx.settings-appearance.title': 'Vzhled',
  'help.ctx.settings-appearance.summary':
    'Jak TREK na tomto účtu vypadá: světlý nebo tmavý režim, barva zvýraznění, sklo a animace, velikost písma a widgety na přehledu. Všechno se projeví hned, na každém zařízení, kde se přihlásíte.',
  'help.ctx.settings-appearance.bullet.1':
    '„Motiv“: „Barevné schéma“ („Světlé“, „Tmavá“ nebo „Automatické“), barevná paleta a s volbou „Vlastní“ vlastní barva zvýraznění pro světlý a tmavý režim s kontrolou kontrastu.',
  'help.ctx.settings-appearance.bullet.2':
    'Čitelnost, označená jako „Experimentální“: průhlednost, „Omezit pohyb“, hustota a „Velikost písma“ s jedním posuvníkem pro „Vše“ a po jednom pro Velké, Střední, „Normálně“ a Malé.',
  'help.ctx.settings-appearance.bullet.3':
    'Widgety na přehledu: samostatné přepínače pro počítač („Pod hlavním panelem“, „Pravý postranní panel“) a mobil („Pod hlavním panelem“, „Konec stránky“).',
  'help.ctx.settings-appearance.bullet.4':
    '„Obnovit výchozí“ pod kartami vrátí celou tuto kartu nastavení na výchozí hodnoty.',
  'help.ctx.settings-map.title': 'Mapa',
  'help.ctx.settings-map.summary':
    'Čím se vykreslují mapy plánovače cest a deníku a v jakém stylu. Leaflet je klasická rastrová mapa, Mapbox GL přidává 3D budovy a terén, pokud máte vlastní token, MapLibre GL vykresluje vektorové dlaždice OpenFreeMap bez tokenu. Atlas vždy používá Leaflet.',
  'help.ctx.settings-map.bullet.1':
    '„Poskytovatel mapy“: Leaflet, Mapbox GL („Experimentální“) nebo MapLibre GL, každá volba s krátkým popisem.',
  'help.ctx.settings-map.bullet.2':
    '„Šablona mapy“ a „CARTO API klíč“ pro Leaflet; „Styl mapy“ pro oba enginy GL a navíc „Mapbox přístupový token“ pro Mapbox GL.',
  'help.ctx.settings-map.bullet.3':
    'Jen pro Mapbox GL: „3D budovy a terén“ a „Režim vysoké kvality“. Nad tlačítkem „Uložit nastavení mapy“ je živý náhled. Tlačítkem „Uložit nastavení mapy“ volbu uložíte.',
  'help.ctx.settings-notifications.title': 'Oznámení',
  'help.ctx.settings-notifications.summary':
    'Jak vás TREK kontaktuje mimo aplikaci. Nahoře tabulka s řádkem pro každou událost a sloupcem pro každý kanál určuje, co se kam posílá. Pod ní jsou karty pro webhook, ntfy, push na tomto zařízení a případné kanály pluginů.',
  'help.ctx.settings-notifications.bullet.1':
    '„Oznámení“: zapněte nebo vypněte každou událost pro jednotlivé kanály. Zámek znamená, že ji správce vypnul všem.',
  'help.ctx.settings-notifications.bullet.2':
    '„URL webhooku“: webhook pro Discord, Slack nebo vlastní službu, s tlačítky „Testovat“ a „Uložit“.',
  'help.ctx.settings-notifications.bullet.3':
    'Ntfy: „Téma Ntfy“, volitelně „URL serveru Ntfy“ a přístupový token, s tlačítky „Testovat“ a „Uložit“.',
  'help.ctx.settings-notifications.bullet.4':
    '„Push notifikace na tomto zařízení“: „Zapnout pro toto zařízení“ platí jen pro tento prohlížeč; „Odeslat test“ pošle testovací oznámení. Kanál pluginu ukazuje „Nastavit“, dokud není nastavený.',
  'help.ctx.settings-integrations.title': 'Integrace',
  'help.ctx.settings-integrations.summary':
    'Vše, co se k TREK připojuje zvenčí: knihovny fotek pro deník, AirTrail pro lety, Dawarich pro místa, kde jste skutečně byli, wanderer pro trasy, API klíče jen pro čtení pro jiný software a MCP pro klienty AI. Připojení k další službě se zobrazí, až ho správce zapne.',
  'help.ctx.settings-integrations.bullet.1':
    'Immich a Synology Photos, AirTrail, Dawarich a wanderer: každá karta má adresu a klíč, tlačítka „Uložit“ a „Otestovat připojení“ a odznak „Připojeno“ nebo „Nepřipojeno“.',
  'help.ctx.settings-integrations.bullet.2':
    '„API klíče“: klíče jen pro čtení pro veřejné API, každý omezený na vybrané oblasti, s endpointem ke zkopírování.',
  'help.ctx.settings-integrations.bullet.3':
    '„Konfigurace MCP“: „MCP endpoint“ a v části „Klienti OAuth 2.1“ vaši registrovaní klienti, „Konfigurace klienta“ ke zkopírování a „Aktivní relace OAuth“ s tlačítkem „Odvolat“.',
  'help.ctx.settings-integrations.bullet.4':
    '„API tokeny“: starší způsob připojení k MCP, označený jako „Zastaralé“; používejte místo toho „Klienti OAuth 2.1“.',
  'help.ctx.settings-offline.title': 'Offline', // same-as-en
  'help.ctx.settings-offline.summary':
    'Co TREK ukládá na toto zařízení, aby se cesta otevřela i bez připojení, a co se stane, když se změna provedená offline dostane do konfliktu se změnou provedenou jinde.',
  'help.ctx.settings-offline.bullet.1':
    '„Offline režim“: „Vynutit offline režim“ nejdřív vše stáhne, pak pracuje jen z mezipaměti a vaše změny řadí do fronty.',
  'help.ctx.settings-offline.bullet.2':
    '„Příprava na offline“: „Stáhnout pro offline použití“ stáhne data cest, dokumenty a mapové dlaždice; „Synchronizovat znovu“ spustí synchronizaci ručně.',
  'help.ctx.settings-offline.bullet.3':
    '„Co ukládat offline“: „Ukládat mapové dlaždice offline“ a přepínač pro každou cestu. Dokončená cesta se uloží, jen když ji zapnete.',
  'help.ctx.settings-offline.bullet.4':
    '„Konflikty synchronizace“ se zobrazí, jen když jsou dvě změny v konfliktu, s volbami „Moji verzi“, „Zachovat serverovou“ a „Když dojde ke konfliktu“. „Offline mezipaměť“ počítá cesty a čekající nebo neúspěšné změny a nabízí „Zkusit znovu“, „Zahodit“ a „Vymazat mezipaměť“.',
  'help.ctx.settings-account.title': 'Účet',
  'help.ctx.settings-account.summary':
    'Váš účet v této instanci TREK a způsob přihlašování: profilový obrázek, uživatelské jméno a e-mail, heslo, dvoufázové ověření a přístupové klíče. „Smazat účet“ najdete v patičce karty „Účet“.',
  'help.ctx.settings-account.bullet.1':
    'Účet: kliknutím na fotoaparát u obrázku nahrajete nový a červeným košem ho odstraníte. „Uživatelské jméno“ a „E-mail“ uložíte tlačítkem „Uložit profil“.',
  'help.ctx.settings-account.bullet.2':
    '„Změnit heslo“: současné heslo, dvakrát nové heslo, u kterého se během psaní odškrtávají pravidla, a pak „Aktualizovat heslo“. Pokud se do této instance TREK přihlašuje jen přes SSO, karta se nezobrazuje.',
  'help.ctx.settings-account.bullet.3':
    'Dvoufaktorové ověření (2FA) přes ověřovací aplikaci a záložní kódy, Přístupové klíče pro přihlášení bez hesla.',
  'help.ctx.settings-account.bullet.4':
    '„Smazat účet“ je vlevo v patičce karty „Účet“ a vyžaduje potvrzení. Jediný správce sám sebe smazat nemůže.',
  // language-region
  'help.guide.language-region.title': 'Nastavit jazyk, jednotky a měnu',
  'help.guide.language-region.goal': 'Používejte TREK ve svém jazyce a s formáty svého regionu.',
  'help.guide.language-region.step.1':
    'V části „Jazyk a region“ vyberte „Jazyk“ z řady čipů. TREK se přepne okamžitě, a to na všech zařízeních, kde jste přihlášeni.',
  'help.guide.language-region.step.2':
    '„Názvy míst“ určují jazyk, který používá vyhledávání míst, návrhy a adresy; „Stejně jako aplikace“ se řídí jazykem rozhraní.',
  'help.guide.language-region.result':
    'Data, vzdálenosti a peníze se zobrazují ve formátu, na který jste zvyklí. V části „Náklady“ se částky jen zobrazují ve vaší zobrazované měně; zadané částky se nemění.',
  'help.guide.language-region.tip.1': '„Měna cesty“ zobrazuje každou cestu v její vlastní měně, bez přepočtu.',
  'help.guide.language-region.tip.2': 'Jazyk určuje také názvy dnů a měsíců v doplňku „Dovolená (Vacay)“ a v deníku.',
  // travel-map-prefs
  'help.guide.travel-map-prefs.title': 'Úprava mapy cesty a nadpisů dnů',
  'help.guide.travel-map-prefs.goal':
    'Zvolte, co ukazuje mapa cesty a jak vypadají záhlaví dnů, a to ve všech cestách.',
  'help.guide.travel-map-prefs.step.1':
    'V části „Cestování a mapa“ určuje „Otevírat místa v“, kterou mapovou aplikaci tlačítko navigace rovnou otevře; „Pokaždé se zeptat“ vám nechá vybrat aplikaci pokaždé. „Datum na začátku nadpisů dnů“ zobrazí v záhlaví každého dne nejdřív kalendářní datum.',
  'help.guide.travel-map-prefs.step.2':
    '„Vždy zobrazovat trasy rezervací“ zobrazí na mapě každý let, vlak a další rezervace; „Popisky tras rezervací“ přidají na každý konec název stanice nebo letiště. „Kompaktní značky pro nenaplánovaná místa“ zmenší místa, která ještě nejsou zařazená do dne, takže naplánované zastávky jsou lépe vidět.',
  'help.guide.travel-map-prefs.result': 'Mapa cesty tato nastavení použije u všech cest, dokud je znovu nezměníte.',
  'help.guide.travel-map-prefs.tip.1':
    'Tato nastavení platí pro účet, ne pro cestu. Každý člen sdílené cesty vidí svoje vlastní volby.',
  'help.guide.travel-map-prefs.tip.2':
    'Správce může nastavit výchozí hodnoty pro všechny; co přepnete tady, platí pro vás.',
  // startup
  'help.guide.startup.title': 'Čím se TREK otevře',
  'help.guide.startup.goal': 'Otevírejte TREK na stránce, kterou používáte nejčastěji, ne pokaždé na přehledu.',
  'help.guide.startup.step.1':
    'Nahoře na kartě „Zobrazení“ v části „Spuštění“ nastavte „Úvodní stránka“ na „Přehled“ nebo „Aktivní cesta“.',
  'help.guide.startup.step.2':
    'Při volbě „Aktivní cesta“ se objeví „Úvodní karta“: vyberte, na které kartě se cesta otevře.',
  'help.guide.startup.result': 'Až TREK příště otevřete, otevře se rovnou tato stránka.',
  'help.guide.startup.tip.1':
    '„Aktivní cesta“ je cesta, která právě probíhá, nebo nejbližší nadcházející. Je to stejná cesta, kterou přehled ukazuje nahoře.',
  // theme-scheme
  'help.guide.theme-scheme.title': 'Nastavení motivu a barvy zvýraznění',
  'help.guide.theme-scheme.goal': 'Nastavte TREK světlý, tmavý nebo podle zařízení, v barvě, která se vám líbí.',
  'help.guide.theme-scheme.step.1':
    'V části „Motiv“ nastavte „Barevné schéma“ na „Světlé“, „Tmavá“ nebo „Automatické“. „Automatické“ se řídí vaším zařízením.',
  'help.guide.theme-scheme.step.2':
    'Zvolte „Barevné schéma“: Výchozí, Vysoký kontrast, Indigo, Tyrkysová, Růžová, Jantarová, Fialová nebo Vlastní.',
  'help.guide.theme-scheme.step.3':
    'U volby „Vlastní“ vyberte jednu z barevných teček, nebo nastavte vlastní barvu zvýraznění zvlášť pro „Světlé“ a „Tmavá“. Pilulka vedle ukazuje „Dobrý kontrast“ nebo „Nízký kontrast“.',
  'help.guide.theme-scheme.result':
    'Tlačítka, odkazy a zvýraznění používají barvu akcentu všude, na každém zařízení, kde se přihlásíte.',
  'help.guide.theme-scheme.tip.1':
    'V navigační liště je také rychlý přepínač světlého a tmavého režimu; nastavuje stejný motiv.',
  'help.guide.theme-scheme.tip.2': 'Pokud se vám výchozí schéma špatně čte, zvolte schéma High contrast.',
  // readability
  'help.guide.readability.title': 'Čitelnost a velikost písma',
  'help.guide.readability.goal': 'Používejte méně efektu skla a animací, víc místa nebo větší písmo.',
  'help.guide.readability.step.1':
    'V části „Čitelnost“ přepne „Průhlednost“ skleněné panely na plné plochy, „Omezit pohyb“ omezí animace na minimum a „Hustota“ přepíná mezi pohodlným a kompaktním zobrazením.',
  'help.guide.readability.step.2':
    '„Velikost písma“: posuvníkem „Vše“ změníte velikost veškerého textu najednou, nebo nastavte Velké, Střední, „Normálně“ a Malé jednotlivě. U každé velikosti je ukázka, takže výsledek vidíte už během posouvání.',
  'help.guide.readability.result': 'Změna se okamžitě projeví v celé aplikaci, včetně panelů mapy a deníku.',
  'help.guide.readability.tip.1':
    'Některé části TREK už používají méně animací, když má vaše zařízení nastavené omezení pohybu. „Omezit pohyb“ omezí animace i ve zbývajících částech.',
  'help.guide.readability.tip.2':
    'Velikost textu se uplatňuje přes typografické úrovně, takže se nic neořízne. Co se už nevejde, zalomí se na další řádek.',
  // dashboard-widgets
  'help.guide.dashboard-widgets.title': 'Vybrat widgety na přehledu',
  'help.guide.dashboard-widgets.goal': 'Zobrazte jen widgety, které používáte, zvlášť na počítači a na telefonu.',
  'help.guide.dashboard-widgets.step.1':
    'V části „Widgety na přehledu“ vypisuje „Počítač“ widgety „Pod hlavním panelem“ a „Pravý postranní panel“. Vypnutím „Pravý postranní panel“ skryjete celý sloupec a přehled se vycentruje; jeho widgety jsou ztlumené, dokud ho znovu nezapnete.',
  'help.guide.dashboard-widgets.step.2':
    'Pro přehled v telefonu má mobilní verze vlastní přepínače, „Pod hlavním panelem“ a „Konec stránky“.',
  'help.guide.dashboard-widgets.result':
    'Přehled se hned změní. Když je pravý panel vypnutý, přehled se zarovná na střed.',
  'help.guide.dashboard-widgets.tip.1': 'Widgety doplňku se zobrazí, jen když má správce daný doplněk zapnutý.',
  'help.guide.dashboard-widgets.tip.2':
    'Samotný přehled si pro každé zařízení pamatuje zobrazení v mřížce nebo seznamu a řazení.',
  // map-provider
  'help.guide.map-provider.title': 'Vybrat mapový systém a styl',
  'help.guide.map-provider.goal': 'Přepínejte mezi klasickou mapou, vektorovými dlaždicemi a 3D mapou od Mapboxu.',
  'help.guide.map-provider.step.1':
    'V části „Poskytovatel mapy“ zvolte Leaflet pro klasickou 2D mapu s libovolnými rastrovými dlaždicemi, Mapbox GL pro vektorové dlaždice s 3D budovami a terénem, nebo MapLibre GL pro vektorové dlaždice OpenFreeMap bez tokenu.',
  'help.guide.map-provider.step.2':
    'Vyberte „Šablona mapy“ pro Leaflet nebo „Styl mapy“ pro engine GL, případně vložte vlastní URL. Mapbox GL potřebuje „Mapbox přístupový token“, šablony CARTO „CARTO API klíč“; odkaz pod každým polem ukazuje, kde ho získat.',
  'help.guide.map-provider.step.3':
    'U Mapbox GL zapněte „3D budovy a terén“ a pokud je vaše zařízení dost výkonné, také „Režim vysoké kvality“. Zkontrolujte náhled a klikněte na „Uložit nastavení mapy“.',
  'help.guide.map-provider.result':
    'Mapy plánovače cest a deníku používají zvolený engine. Atlas vždy používá Leaflet.',
  'help.guide.map-provider.tip.1': 'Bez tokenu použije Mapbox GL místo prázdné mapy Leaflet.',
  'help.guide.map-provider.tip.2':
    'Mapové dlaždice uložené offline pocházejí od poskytovatele, který byl aktivní při jejich stažení.',
  // notification-channels
  'help.guide.notification-channels.title': 'Nastavení, kam vám chodí oznámení',
  'help.guide.notification-channels.goal':
    'Dostávejte připomínky cest a oznámení o spolupráci do telefonu nebo do jiného nástroje.',
  'help.guide.notification-channels.step.1':
    'U webhooku vložte „URL webhooku“ pro Discord, Slack nebo vlastní službu, klikněte na „Testovat“ a pak na „Uložit“.',
  'help.guide.notification-channels.step.2':
    'U ntfy vyplňte „Téma Ntfy“, a pokud provozujete vlastní server, přidejte jeho „URL serveru Ntfy“ a přístupový token. „Testovat“ hned odešle zprávu; „Uložit“ nastavení uloží.',
  'help.guide.notification-channels.step.3':
    'Na kartě „Oznámení“ nahoře zapněte nebo vypněte každou událost pro jednotlivé kanály. Zámek znamená, že ji správce vypnul všem. Kanál pluginu ukazuje „Nastavit“, dokud není nastavený; „Odeslat test“ ho vyzkouší.',
  'help.guide.notification-channels.result':
    'Události se posílají kanály, které jste pro ně zapnuli. Sloupec „V aplikaci“ určuje, co ukazuje zvonek v navigační liště.',
  'help.guide.notification-channels.tip.1':
    'Vlastní „Připomínka“ cesty, tedy kolik dní před odjezdem, se nastavuje ve formuláři úpravy cesty.',
  'help.guide.notification-channels.tip.2':
    'Správce může všem předvyplnit výchozí server ntfy; téma si ale volíte sami.',
  // photo-providers
  'help.guide.photo-providers.title': 'Připojení knihovny fotek',
  'help.guide.photo-providers.goal': 'Nechte deník načítat fotky z daného dne z Immich nebo Synology Photos.',
  'help.guide.photo-providers.step.1':
    'V části „Integrace“ najděte kartu Immich nebo Synology Photos a zadejte požadované údaje: u Immich „URL serveru“ a „API klíč“, u Synology Photos „Uživatelské jméno“ a „Heslo“. Immich umí při nahrávání také kopírovat fotky z deníku do knihovny Immich.',
  'help.guide.photo-providers.step.2':
    'Klikněte na „Otestovat připojení“ a pak na „Uložit“. Odznak se změní na „Připojeno“.',
  'help.guide.photo-providers.result':
    'Karta „External photos“ v editoru záznamu prohledá připojenou knihovnu podle dne záznamu, nejdřív fotky nejblíže místu záznamu.',
  'help.guide.photo-providers.tip.1':
    'Připojení patří jen vašemu účtu: ostatní členové deníku si připojují vlastní knihovny.',
  'help.guide.photo-providers.tip.2':
    'Poskytovatel, jehož fotky nemají GPS data, funguje také. Seznam se pak seřadí podle času.',
  // api-keys
  'help.guide.api-keys.title': 'Vytvoření API klíče',
  'help.guide.api-keys.goal': 'Umožněte jinému softwaru číst vaše cesty přes veřejné API.',
  'help.guide.api-keys.step.1':
    'V části „API klíče“ klikněte na „Vytvořit klíč“, zadejte „Název“, podle kterého poznáte, kde se klíč používá, a v části „Co smí tento klíč číst“ ponechte jen oblasti, které potřebuje. Klikněte na „Vytvořit“.',
  'help.guide.api-keys.step.2':
    'Zkopírujte klíč z okna „Klíč API vytvořen“: zobrazí se jen jednou. Klikněte na „Hotovo“. Endpoint, který máte volat, je uvedený pod seznamem.',
  'help.guide.api-keys.result':
    'Software s klíčem může číst vybrané oblasti a nikdy nic nezmění. Seznam ukazuje, kdy byl každý klíč vytvořen a naposledy použit, a košem klíč smažete.',
  'help.guide.api-keys.tip.1':
    'Pro každý nástroj použijte samostatný klíč, abyste mohli klíč odvolat, aniž by to ovlivnilo ostatní nástroje.',
  'help.guide.api-keys.tip.2':
    'Pokud má klient AI moci něco měnit, použijte místo toho MCP s OAuth; API klíče umí jen číst.',
  // mcp-oauth
  'help.guide.mcp-oauth.title': 'Připojení AI asistenta přes MCP',
  'help.guide.mcp-oauth.goal': 'Zpřístupněte své cesty pro Claude, IDE nebo jiného klienta MCP.',
  'help.guide.mcp-oauth.step.1': 'V části „Konfigurace MCP“ zkopírujte pro svého klienta „MCP endpoint“.',
  'help.guide.mcp-oauth.step.2':
    'V části „Klienti OAuth 2.1“ klikněte na „Nový klient“ a vyberte rychlou předvolbu, například Claude Desktop nebo Cursor, nebo sami vyplňte „Název aplikace“, „Přesměrovací URI“ a „Povolená oprávnění“; pro server bez prohlížeče vyberte strojového klienta. Klikněte na „Zaregistrovat klienta“ a zkopírujte „Tajný klíč klienta“: zobrazí se jen jednou.',
  'help.guide.mcp-oauth.step.3':
    'Každý klient má tlačítka „Obnovit tajný klíč“ a „Smazat klienta“. „Aktivní relace OAuth“ vypisují přihlášené klienty s tlačítkem „Odvolat“. Po rozbalení „Konfigurace klienta“ uvidíte hotový úryvek pro klienty, kteří používají JSON.',
  'help.guide.mcp-oauth.result':
    'Klient může vaším jménem číst a měnit vše, co mu povolují jeho oprávnění, a každá akce se zobrazí pod vaším jménem.',
  'help.guide.mcp-oauth.tip.1':
    'Oprávnění omezují, co klient smí dělat: dejte klientovi jen oprávnění ke čtení, dokud nebude potřebovat víc.',
  'help.guide.mcp-oauth.tip.2': 'Správce může MCP vypnout pro celou instanci. Tato sekce se pak nezobrazuje.',
  // offline-prepare
  'help.guide.offline-prepare.title': 'Cesty offline',
  'help.guide.offline-prepare.goal': 'Uložte si cesty a jejich mapy do tohoto zařízení dřív, než přijdete o připojení.',
  'help.guide.offline-prepare.step.1':
    'V části „Co ukládat offline“ nechte zapnuté „Ukládat mapové dlaždice offline“ a zapněte cesty, které chcete mít v tomto zařízení. Dokončená cesta se uloží, jen když ji zapnete.',
  'help.guide.offline-prepare.step.2':
    'Nahoře v části „Příprava na offline“ klikněte na „Stáhnout pro offline použití“. Stáhnou se data cest, dokumenty a mapové dlaždice a zobrazí se, kolik cest se uložilo.',
  'help.guide.offline-prepare.step.3':
    '„Vynutit offline režim“ vše ještě jednou stáhne a pak pracuje jen s daty v tomto zařízení, takže si před odjezdem můžete ověřit, že máte vše potřebné.',
  'help.guide.offline-prepare.result':
    'Cesty se otevřou i bez připojení. Změny, které provedete, se uloží do fronty a odešlou se, až budete znovu online.',
  'help.guide.offline-prepare.tip.1':
    'Nejvíc místa zabírají mapové dlaždice; když je vypnete, uloží se jen data cest a dokumenty.',
  'help.guide.offline-prepare.tip.2':
    'Pro nejplynulejší start offline si TREK nainstalujte z prohlížeče jako aplikaci.',
  // offline-conflicts
  'help.guide.offline-conflicts.title': 'Rozhodnout, která verze zůstane při konfliktu synchronizace',
  'help.guide.offline-conflicts.goal':
    'Zvolte, jak má TREK řešit konflikt mezi změnou provedenou offline a změnou provedenou jinde.',
  'help.guide.offline-conflicts.step.1':
    'Když je změna provedená offline v konfliktu s novější změnou, objeví se nahoře na kartě „Offline“ „Konflikty synchronizace“. U každé změny klikněte na „Moji verzi“ nebo „Zachovat serverovou“.',
  'help.guide.offline-conflicts.step.2':
    'Na stejné kartě určuje „Když dojde ke konfliktu“, co se stane příště: „Vždy se mě zeptat“, „Vždy zachovat moji verzi“ nebo „Vždy zachovat verzi ze serveru“.',
  'help.guide.offline-conflicts.result':
    'Při volbě „Vždy se mě zeptat“ zůstane konflikt v části „Konflikty synchronizace“, dokud nerozhodnete. U zbývajících dvou možností ho TREK vyřeší automaticky.',
  'help.guide.offline-conflicts.tip.1':
    '„Vymazat mezipaměť“ odstraní jen kopii na tomto zařízení. Na serveru se nic nezmění.',
  // profile
  'help.guide.profile.title': 'Úprava profilu',
  'help.guide.profile.goal': 'Aktualizujte své jméno, e-mail a obrázek.',
  'help.guide.profile.step.1':
    'Na kartě „Účet“ klikněte na fotoaparát u svého obrázku a nahrajte nový; červeným košem ho zase odstraníte a vrátí se vaše iniciála.',
  'help.guide.profile.step.2': 'Pod obrázkem upravte „Uživatelské jméno“ a „E-mail“.',
  'help.guide.profile.result': 'Vaše jméno a obrázek se okamžitě aktualizují všude, i v cestách, které sdílíte.',
  'help.guide.profile.tip.1': 'Účet propojený přes SSO má odznak SSO a „Propojeno přes“ se svým poskytovatelem.',
  // password
  'help.guide.password.title': 'Změnit heslo',
  'help.guide.password.goal': 'Nastavte si nové heslo.',
  'help.guide.password.step.1':
    'V části „Změnit heslo“ zadejte „Současné heslo“, pak „Nové heslo“ a totéž znovu do „Potvrď nové heslo“. Seznam pod tím během psaní označuje splněná pravidla.',
  'help.guide.password.step.2': 'Klikněte na „Aktualizovat heslo“.',
  'help.guide.password.result':
    'Nové heslo platí okamžitě. Všechna ostatní zařízení se odhlásí, vaše API tokeny pro MCP se smažou a klienti OAuth se musí znovu přihlásit; toto zařízení zůstane přihlášené.',
  'help.guide.password.tip.1':
    'Pokud se do této instance TREK přihlašuje jen přes SSO, žádné heslo TREK neexistuje a karta „Změnit heslo“ chybí.',
  // mfa
  'help.guide.mfa.title': 'Zapnutí dvoufázového ověření',
  'help.guide.mfa.goal': 'Chraňte účet kódem z ověřovací aplikace.',
  'help.guide.mfa.step.1': 'V části „Dvoufaktorové ověření (2FA)“ klikněte na „Nastavit autentizační aplikaci“.',
  'help.guide.mfa.step.2':
    'Naskenujte QR kód ve své aplikaci, nebo tajný klíč zadejte ručně, pak napište šestimístný kód, který aplikace ukazuje, a klikněte na „Zapnout 2FA“.',
  'help.guide.mfa.step.3':
    'Uložte si záložní kódy přes „Kopírovat kódy“, „Stáhnout TXT“ nebo „Tisk / PDF“ a klikněte na OK. Každý kód funguje jen jednou. Použijte ho, když nemáte po ruce telefon.',
  'help.guide.mfa.result': 'Každé přihlášení si po hesle vyžádá i kód.',
  'help.guide.mfa.tip.1': 'K vypnutí přes „Vypnout 2FA“ potřebujete heslo a aktuální kód nebo nepoužitý záložní kód.',
  'help.guide.mfa.tip.2': 'Správce může 2FA vyžadovat u všech. Pak ho tady vypnout nelze.',
  // passkeys
  'help.guide.passkeys.title': 'Přihlásit se pomocí přístupového klíče',
  'help.guide.passkeys.goal': 'Místo hesla použijte otisk prstu, obličej nebo PIN svého zařízení.',
  'help.guide.passkeys.step.1':
    'V části „Přístupové klíče“ klikněte na „Přidat přístupový klíč“, potvrďte současné heslo, pojmenujte klíč podle zařízení a pak postupujte podle pokynů zařízení.',
  'help.guide.passkeys.step.2':
    'U každého přístupového klíče vidíte, jestli je „Synchronizováno“ nebo vázaný na „Toto zařízení“, a kdy byl naposledy použit. „Přejmenovat“ změní jeho název a tlačítkem pro smazání ho po zadání hesla odstraníte.',
  'help.guide.passkeys.result': 'Přihlašovací stránka nabídne přístupový klíč. Přihlásit se heslem můžete i nadále.',
  'help.guide.passkeys.tip.1':
    'Přístupový klíč se ukládá v zařízení nebo v jeho správci hesel, proto přidejte jeden klíč pro každé zařízení.',
  'help.guide.passkeys.tip.2':
    'Přístupové klíče se zobrazí, až je správce zapne. Dokud server nemá nastavenou doménu WebAuthn, karta na to upozorní místo nabídky „Přidat přístupový klíč“.',
  // delete-account
  'help.guide.delete-account.title': 'Smazání účtu',
  'help.guide.delete-account.goal': 'Smažte svůj účet a data, která patří jen vám.',
  'help.guide.delete-account.step.1':
    'Na kartě „Účet“ klikněte vlevo v patičce na „Smazat účet“ a pak na „Smazat natrvalo“.',
  'help.guide.delete-account.result':
    'Váš účet se smaže spolu s cestami, místy a soubory, které vlastníte. Cesty, které vlastní jiní, zůstanou zachované.',
  'help.guide.delete-account.tip.1':
    'Pokud jste jediný správce, TREK zobrazí „Účet nelze smazat“: nejdřív povyšte na správce jiného uživatele.',
  'help.guide.delete-account.tip.2': 'Nejde to vrátit zpět. Než potvrdíte, exportujte si, co si chcete ponechat.',

  // ── Screen: admin (all tabs) ──────────────────────────────────────────────────────────
  'help.ctx.admin.title': 'Správce',
  'help.ctx.admin.summary':
    'Nastavení celé instance TREK pro všechny uživatele: kdo se smí přihlásit a jak, co je zapnuté, kde se ukládají soubory, jak server kontaktuje lidi a jak se zálohuje. Tuto stránku vidí jen správci. Postranní panel řadí karty do skupin „Uživatelé“, „Konfigurace“, „Integrace“ a „Údržba“ a každá karta je samostatná obrazovka.',
  'help.ctx.admin.bullet.1':
    'Záhlaví vpravo ukazuje počet uživatelů, cest, míst a souborů. Pod ním se zobrazí banner „Dostupná aktualizace“, když vyjde novější verze TREK.',
  'help.ctx.admin.bullet.2':
    '„Uživatelé“ a „Výchozí nastavení uživatele“: účty, pozvánky a oprávnění a také nastavení a mapa, se kterými nový účet začíná.',
  'help.ctx.admin.bullet.3':
    '„Personalizace“, „Nastavení“, „Doplňky“, „Pluginy“ a „Úložiště“: šablony pro balení, kategorie a školní prázdniny; přihlašování, přístupové klíče, 2FA, API klíče a poskytovatelé vyhledávání; funkční moduly; pluginy třetích stran; kam se ukládají nahrané soubory.',
  'help.ctx.admin.bullet.4':
    '„Oznámení“, „MCP přístup“ a GitHub: kanály, které si uživatelé mohou vybrat, a jejich výchozí nastavení, tokeny a relace klientů AI a historie verzí.',
  'help.ctx.admin.bullet.5':
    'Zálohování a Audit: zálohy na vyžádání i podle plánu a záznam bezpečnostně důležitých událostí.',
  'help.ctx.admin-users.title': 'Uživatelé',
  'help.ctx.admin-users.summary':
    'Všechny účty v této instanci TREK s rolí, e-mailem a poslední aktivitou, pozvánky, přes které se lidé mohou registrovat v uzavřené instanci, a kdo smí co dělat v cestách.',
  'help.ctx.admin-users.bullet.1':
    'Tabulka: uživatel, e-mail, role, datum vytvoření a „Naposledy aktivní“, v každém řádku s „Upravit uživatele“ a „Smazat uživatele“. Zelená tečka na avataru znamená, že je osoba právě online; u vašeho vlastního řádku je „(Vy)“.',
  'help.ctx.admin-users.bullet.2':
    '„Vytvořit uživatele“ vpravo nahoře na kartě „Uživatelé“ ručně přidá účet s heslem, které uživateli předáte.',
  'help.ctx.admin-users.bullet.3':
    '„Pozvánky“ níže: registrační odkazy s limitem použití, platností a případně cestou, ke které se nový uživatel po registraci připojí.',
  'help.ctx.admin-users.bullet.4':
    '„Nastavení oprávnění“ dole: u každé akce, kdo ji smí provádět („Všichni“, „Členové výletu“, „Vlastník výletu“ nebo „Pouze administrátor“). Uložíte tlačítkem „Uložit“ nahoře na kartě.',
  'help.ctx.admin-defaults.title': 'Výchozí nastavení uživatele',
  'help.ctx.admin-defaults.summary':
    'S čím nový účet začíná, aby nikdo nemusel nic nastavovat hned na začátku: barevné schéma, jednotky, formát času, začátek týdne, zobrazovaná měna a skryté rezervační kódy, a k tomu mapa, její klíče a servery pro plánování tras.',
  'help.ctx.admin-defaults.bullet.1':
    '„Výchozí nastavení uživatele“ vlevo: „Barevné schéma“, „Jednotky teploty“, „Jednotky vzdálenosti“, „Formát času“, „Týden začíná“, „Zobrazovaná měna“ a „Skrýt rezervační kódy“.',
  'help.ctx.admin-defaults.bullet.2':
    'Mapa vpravo: „Šablona mapy“, „Sdílený klíč CARTO“, „Vlastní směrovací server“ a „Vlastní instance Valhalla“, náhled, pak „Mapový engine“ se „Styl mapy“, „Sdílený token Mapbox“, „3D budovy & terén“ a „Režim vysoké kvality“.',
  'help.ctx.admin-config.title': 'Personalizace',
  'help.ctx.admin-config.summary':
    'Nastavení společná pro všechny cesty na instanci: šablony balení, sada kategorií pro místa a sbírky a katalog školních prázdnin, který používá Vacay.',
  'help.ctx.admin-config.bullet.1':
    'Šablony seznamů: pojmenované seznamy kategorií a položek, ze kterých může vycházet seznam věcí na cestu.',
  'help.ctx.admin-config.bullet.2':
    '„Kategorie“: název, ikona a barva kategorií používaných v celém TREK, od detailu místa po Sbírky, každá se upravuje v dialogu s náhledem.',
  'help.ctx.admin-config.bullet.3':
    'Školní prázdniny: katalog zemí a regionů s termíny prázdnin, ze kterého si může každý vybírat v sekci „Dovolená (Vacay)“.',
  'help.ctx.admin-settings.title': 'Nastavení',
  'help.ctx.admin-settings.summary':
    'Jak se lidé přihlašují a které externí služby smí server používat. Vlevo: „Metody ověřování“, „Přihlášení přístupovým klíčem“, „Vyžadovat dvoufázové ověření (2FA)“ a „Jednotné přihlášení (OIDC)“. Vpravo: „Povolené typy souborů“ a „API klíče“ s poskytovateli vyhledávání a veřejné dopravy. „Nebezpečná zóna“ je dole.',
  'help.ctx.admin-settings.bullet.1':
    '„Metody ověřování“: přihlášení heslem, registrace heslem a po nastavení OIDC také přihlášení přes SSO a automatické zakládání účtů přes SSO. „Vyžadovat dvoufázové ověření (2FA)“ má vlastní kartu.',
  'help.ctx.admin-settings.bullet.2':
    '„Přihlášení přístupovým klíčem“: „Povolit přihlášení přístupovým klíčem“, „Relying Party ID (doména)“ a „Povolené origins“. „Jednotné přihlášení (OIDC)“: „Zobrazované jméno“, „URL vydavatele (Issuer)“, volitelně „Discovery URL (volitelné)“, „ID klienta“ a „Tajný klíč klienta“.',
  'help.ctx.admin-settings.bullet.3':
    '„API klíče“: první je TREK Places API, které klíč nepotřebuje. Pod ním je „Google Maps API klíč“ (s tlačítky „Testovat“ a „K čemu se klíč používá“), klíč Unsplash a klíč Amap a dole na kartě jedno tlačítko „Uložit“.',
  'help.ctx.admin-settings.bullet.4':
    '„Poskytovatel veřejné dopravy“ a „Poskytovatel hledání míst“ určují, kdo odpovídá na hledání spojů a míst; „Záznam vyhledávání míst“ zaznamenává, který výsledek byl vybrán; „Povolené typy souborů“ omezují nahrávání.',
  'help.ctx.admin-addons.title': 'Doplňky',
  'help.ctx.admin-addons.summary':
    'Funkční moduly TREKu, každý s vlastním přepínačem: Balení, Rozpočet, Dokumenty, Dovolená (Vacay), Atlas, Spolupráce, Cestovní deník, Sbírky, Cesta autem, MCP, AirTrail, Dawarich a Analýza pomocí AI. Vypnutý modul zmizí všem z navigace a odstraní se i jeho stránky a API.',
  'help.ctx.admin-addons.bullet.1':
    'Pro každý doplněk dlaždice s přepínačem a, pokud nějaké má, pod ní řádky s jeho možnostmi.',
  'help.ctx.admin-addons.bullet.2':
    'Poskytovatelé fotek a dokumentů tu mají také své dlaždice, takže můžete uživatelům nabídnout Immich nebo Synology.',
  'help.ctx.admin-addons.bullet.3': '„Sledování zavazadel“ má vlastní přepínač pod dlaždicemi.',
  'help.ctx.admin-plugins.title': 'Pluginy',
  'help.ctx.admin-plugins.summary':
    'Pluginy třetích stran, které běží ve vlastním procesu vedle TREKu, každý s oprávněními, o která požádal při instalaci. Instalujte je z katalogu, nahrajte balíček, nebo při vývoji pluginu připojte složku.',
  'help.ctx.admin-plugins.bullet.1':
    '„Nainstalováno“ a „Objevit“ s „Hledat pluginy…“ a filtry „Typ“, „Stav“ a „Řadit“. Každý řádek ukazuje verzi, „Zkontrolováno“, „Podepsáno“ nebo „Nepodepsáno“, k čemu plugin smí přistupovat, přepínač a nabídku ⋯.',
  'help.ctx.admin-plugins.bullet.2':
    'Dvě ikony v záhlaví karty: „Nahrát plugin“ přijímá .zip, .tgz nebo .tar.gz (případně přetáhněte .zip na stránku); „Znovu prohledat“ najde složku pluginu propojenou pro vývoj.',
  'help.ctx.admin-plugins.bullet.3':
    'Povolení hostitelé pro každý plugin: adresy, na které se plugin smí připojit, protože odchozí připojení jsou ve výchozím stavu blokovaná.',
  'help.ctx.admin-storage.title': 'Úložiště',
  'help.ctx.admin-storage.summary':
    'Kam se ukládají nahrané soubory: na místní disk nebo do bucketu S3, volitelně s kopiemi na další úložiště. Každá kategorie nahrávek může jít na jiné úložiště a nic se nezmění, dokud nekliknete na „Uložit změny“.',
  'help.ctx.admin-storage.bullet.1':
    '„Zdraví“ nahoře: neúspěšné zápisy do cíle zrcadlení, nebo „Nebyly zaznamenány žádné chyby replik.“',
  'help.ctx.admin-storage.bullet.2':
    '„Backendy“: název, typ, využití a cíl zrcadlení, s tlačítky „Testovat“, „Upravit“ a „Odebrat“. „Vypočítat nyní“ spočítá, kolik je uloženo; backend definovaný proměnnou prostředí je jen pro čtení.',
  'help.ctx.admin-storage.bullet.3':
    '„Kategorie“: dokumenty cest, fotky z cestovních deníků, obálky, profilové obrázky, obrázky míst, mezipaměti fotek a zálohy, každá přiřazená k nějakému backendu.',
  'help.ctx.admin-notifications.title': 'Oznámení',
  'help.ctx.admin-notifications.summary':
    'Kanály, které instance nabízí uživatelům, a ty, kterými dostáváte upozornění jako správce. Uživatelé si vlastní témata a URL vybírají v Nastavení; vy určujete, co je k dispozici, a nastavujete e-mail.',
  'help.ctx.admin-notifications.bullet.1':
    '„E-mail (SMTP)“, Webhook, Ntfy a Web Push mají každý přepínač, kterým kanál nabídnete uživatelům; e-mail potřebuje i nastavení serveru. „V aplikaci“ je vždy zapnuté.',
  'help.ctx.admin-notifications.bullet.2': '„Připomínky výletů“: zda server pošle připomínku před začátkem cesty.',
  'help.ctx.admin-notifications.bullet.3':
    '„Admin webhook“, Admin Ntfy a karta „Oznámení“: kam se posílají události pro správce („Nová verze k dispozici“, „Selhání repliky úložiště“, „Vyžádán vodácký region“), u každého s testovacím tlačítkem.',
  'help.ctx.admin-mcp-tokens.title': 'MCP přístup',
  'help.ctx.admin-mcp-tokens.summary':
    'Všechny tokeny a relace OAuth, které mají AI klienti k tomuto TREKu, napříč všemi uživateli. Kterýkoli z nich můžete odvolat.',
  'help.ctx.admin-mcp-tokens.bullet.1':
    '„OAuth relace“: klient, udělené rozsahy oprávnění, jeho vlastník a datum, s ikonou koše, kterou relaci odvoláte.',
  'help.ctx.admin-mcp-tokens.bullet.2':
    '„API tokeny“: název, vlastník, „Vytvořeno“ a „Naposledy použit“, s košem, kterým token smažete.',
  'help.ctx.admin-github.title': 'GitHub',
  'help.ctx.admin-github.summary':
    'Co je v TREK nového: historie verzí z GitHubu a informace, zda je k dispozici novější verze než ta vaše. Samotná aktualizace probíhá mimo aplikaci, na hostitelském serveru.',
  'help.ctx.admin-github.bullet.1':
    '„Historie verzí“ ukazuje verze na časové ose s poznámkami k vydání. Nejnovější má štítek „Nejnovější“, předběžné verze „Předběžná verze“ a odkaz GitHub otevře stránku s verzemi.',
  'help.ctx.admin-github.bullet.2':
    '„Dostupná aktualizace“ se zobrazí pod záhlavím stránky, jakmile vyjde novější verze; „Jak aktualizovat“ ukáže příkazy pro Docker nebo návod na aktualizaci pro jiné instalace.',
  'help.ctx.admin-backup.title': 'Zálohování',
  'help.ctx.admin-backup.summary':
    'Úplné zálohy databáze a nahraných souborů, vytvářené ručně nebo podle plánu, uložené na serveru a ke stažení jako jeden soubor. Zálohu vrátíte zpět tlačítkem „Obnovit“.',
  'help.ctx.admin-backup.bullet.1':
    '„Záloha dat“: „Vytvořit zálohu“ a „Nahrát zálohu“ nahoře na kartě a seznam záloh s tlačítky „Stáhnout“, „Obnovit“ a ikonou koše pro smazání.',
  'help.ctx.admin-backup.bullet.2':
    '„Nahrát zálohu“ obnoví data ze souboru vytvořeného v jiné instanci nebo dříve, po stejném dotazu jako u „Obnovit“.',
  'help.ctx.admin-backup.bullet.3':
    '„Automatické zálohování“: zapnuto nebo vypnuto, „Interval“, „Spustit v hodinu“ a den a „Smazat staré zálohy po“ (od „1 den“ po „Uchovávat navždy“); použije se tlačítkem „Uložit“.',
  'help.ctx.admin-audit.title': 'Audit', // same-as-en
  'help.ctx.admin-audit.summary':
    'Záznam událostí důležitých pro bezpečnost a správu: přihlášení a neúspěšné pokusy, změny MFA, změny uživatelů a nastavení, zálohy a obnovy. Pouze ke čtení, nejnovější nahoře.',
  'help.ctx.admin-audit.bullet.1':
    'Každá událost má jeden řádek s časem, uživatelem, akcí, zdrojem, IP adresou a podrobnostmi.',
  'help.ctx.admin-audit.bullet.2':
    '„Obnovit“ v záhlaví karty znovu načte seznam. Odznak vedle nadpisu ukazuje, kolik záznamů z celkového počtu je načteno, a „Načíst další“ načte starší záznamy.',
  // create-user
  'help.guide.create-user.title': 'Vytvořit uživatele',
  'help.guide.create-user.goal': 'Přidejte účet ručně, bez pozvánky.',
  'help.guide.create-user.step.1': 'Vpravo nahoře na kartě „Uživatelé“ klikněte na „Vytvořit uživatele“.',
  'help.guide.create-user.step.2':
    'Zadejte „Uživatelské jméno“, „E-mail“ a „Heslo“; kontrolní seznam pod heslem ukazuje, která pravidla heslo splňuje. Vyberte roli: „Uživatel“ nebo „Administrátor“.',
  'help.guide.create-user.step.3': 'Klikněte na „Vytvořit uživatele“.',
  'help.guide.create-user.result':
    'Účet se objeví v tabulce a může se hned přihlásit. Heslo předejte uživateli kanálem, kterému důvěřujete.',
  'help.guide.create-user.tip.1': 'Pro člověka, který si má heslo zvolit sám, je lepší pozvánka.',
  'help.guide.create-user.tip.2':
    '„Administrátor“ vidí tuto stránku a smí dělat cokoli. Co smí „Uživatel“ v cestách, nastavíte níže v části „Nastavení oprávnění“.',
  // edit-user
  'help.guide.edit-user.title': 'Změna údajů nebo hesla uživatele',
  'help.guide.edit-user.goal':
    'Přejmenujte uživatele, povyšte ho nebo mu odeberte práva, nebo mu pomozte znovu se přihlásit, když zapomněl heslo.',
  'help.guide.edit-user.step.1':
    'V řádku uživatele klikněte na tužku („Upravit uživatele“). Nahoře v dialogu je e-mail účtu.',
  'help.guide.edit-user.step.2':
    'Změňte „Uživatelské jméno“, „E-mail“ nebo roli, případně zadejte „Nové heslo“ (pokud ho necháte prázdné, zůstane současné), a klikněte na „Uložit“. „Resetovat přístupové klíče“ dole po potvrzení odebere všechny přístupové klíče účtu.',
  'help.guide.edit-user.result':
    'Změna platí okamžitě. Nové heslo navíc osobu odhlásí na všech zařízeních, takže stará relace přestane fungovat.',
  'help.guide.edit-user.tip.1': 'Pokud jste poslední administrátor, nemůžete si roli administrátora odebrat.',
  'help.guide.edit-user.tip.2':
    'Reset přístupových klíčů heslo zachová. Nové přístupové klíče si dotyčný přidá v Nastavení v části „Účet“.',
  // invite-links
  'help.guide.invite-links.title': 'Pozvat někoho odkazem',
  'help.guide.invite-links.goal':
    'Umožněte někomu registraci na uzavřené instanci a pokud chcete, rovnou ho přidejte do cesty.',
  'help.guide.invite-links.step.1': 'Vpravo nahoře na kartě „Pozvánky“ klikněte na „Vytvořit odkaz“.',
  'help.guide.invite-links.step.2':
    'Vyberte „Max. použití“ (1× až 5×, nebo ∞) a „Vyprší za“ (1d až 14d, nebo ∞), případně cestu v poli „Přidat k cestě (volitelné)“, a klikněte na „Vytvořit a zkopírovat“.',
  'help.guide.invite-links.step.3':
    'Pošlete odkaz. U každého řádku vidíte, kolikrát byl použit, kdy vyprší, do které cesty přidává a kdo ho vytvořil, a vedle stav „Aktivní“, „Expirované“ nebo „Využito“. „Kopírovat odkaz“ ho znovu zkopíruje a košem ho smažete.',
  'help.guide.invite-links.result':
    'Kdo odkaz otevře, zaregistruje se s vlastním heslem. Pokud byla zvolená cesta, hned se k ní připojí.',
  'help.guide.invite-links.tip.1': 'Pozvánky fungují, i když je v Nastavení vypnutá registrace heslem.',
  'help.guide.invite-links.tip.2':
    'Odkaz s jedním použitím a krátkou platností je pro jednoho člověka nejbezpečnější výchozí volba.',
  // delete-user
  'help.guide.delete-user.title': 'Smazat uživatele',
  'help.guide.delete-user.goal': 'Odstraňte účet a vše, co mu patří.',
  'help.guide.delete-user.step.1':
    'V řádku uživatele klikněte na koš („Smazat uživatele“) a potvrďte tlačítkem „Smazat“.',
  'help.guide.delete-user.result':
    'Účet se smaže spolu se všemi cestami a deníky, které vlastní, i s cestami, které sdílel s ostatními. Cesty, kde byl jen členem, zůstanou jejich vlastníkům.',
  'help.guide.delete-user.tip.1': 'Nejde to vrátit zpět. Pokud si nejste jistí, nejdřív si udělejte zálohu.',
  'help.guide.delete-user.tip.2':
    'Ikona koše ve vašem vlastním řádku nefunguje: sami sebe smazat nemůžete. Musí to udělat jiný správce.',
  // permissions
  'help.guide.permissions.title': 'Určit, kdo smí co dělat',
  'help.guide.permissions.goal': 'Nastavte u každé akce, která role ji smí v tomto TREKu provádět.',
  'help.guide.permissions.step.1':
    'V části „Nastavení oprávnění“ najděte akci v její skupině, například „Mazat výlety“ ve skupině „Správa výletů“, a vyberte, kdo ji smí provádět: „Všichni“, „Členové výletu“, „Vlastník výletu“ nebo „Pouze administrátor“. Změněný řádek je označený jako „upraveno“.',
  'help.guide.permissions.step.2':
    'Klikněte na „Uložit“ vpravo nahoře na kartě. „Obnovit výchozí“ vrátí všechny řádky na výchozí úroveň; i potom klikněte na „Uložit“.',
  'help.guide.permissions.result':
    'Pravidlo platí pro všechny cesty najednou. Kdo nemá potřebnou úroveň, příslušná tlačítka a nabídky už neuvidí.',
  'help.guide.permissions.tip.1': '„Vlastník výletu“ je ten, kdo cestu vytvořil; správci smějí vždy všechno.',
  'help.guide.permissions.tip.2':
    'Každá akce má vlastní řádek, takže můžete například členům dovolit plánovat místa a dny, ale mazání cesty nechat jen vlastníkovi.',
  // default-map
  'help.guide.default-map.title': 'Výchozí mapa pro nové uživatele',
  'help.guide.default-map.goal': 'Zajistěte každému novému účtu funkční mapu i bez osobního tokenu.',
  'help.guide.default-map.step.1':
    'V části „Mapa“ vyberte „Šablona mapy“ nebo vložte URL dlaždic, a pokud používáte dlaždice CARTO, zadejte „Sdílený klíč CARTO“. Náhled níže ukazuje výsledek.',
  'help.guide.default-map.step.2':
    'Níže zvolte „Mapový engine“: „Standardní (zdarma)“, Mapbox (3D) nebo MapLibre (OpenFreeMap). U Mapbox a MapLibre vyberte „Styl mapy“; u Mapbox doplňte „Sdílený token Mapbox“ a rozhodněte o „3D budovy & terén“ a „Režim vysoké kvality“.',
  'help.guide.default-map.result':
    'Nové účty začínají s tímto nastavením. Kdo si v Nastavení zvolil vlastní mapu, tomu zůstane.',
  'help.guide.default-map.tip.1':
    'Token nebo klíč zadaný tady sdílejí všichni, kdo nemají vlastní, takže hlídejte jeho kvótu.',
  'help.guide.default-map.tip.2':
    'Tyto výchozí hodnoty platí i pro stávající účty, které na kartě mapy nikdy nic nezměnily.',
  // packing-templates
  'help.guide.packing-templates.title': 'Vytvoření šablony balení',
  'help.guide.packing-templates.goal': 'Dejte cestám výchozí seznam věcí na balení, ať nezačínají s prázdným.',
  'help.guide.packing-templates.step.1': 'Klikněte na „Nová šablona“, napište název a potvrďte zatržítkem.',
  'help.guide.packing-templates.step.2':
    'Kliknutím na název šablony ji otevřete a pak klikněte na „Přidat kategorii“. + nahoře v kategorii přidává položky a položce stačí název.',
  'help.guide.packing-templates.step.3':
    'Vše se ukládá průběžně. Tužkou přejmenujete šablonu, kategorii nebo položku. Košem položku okamžitě smažete. U šablony nebo kategorie se TREK nejdřív zeptá, protože se smaže i vše, co obsahuje.',
  'help.guide.packing-templates.result':
    'Šablona se nabízí v seznamu věcí každé cesty; jejím použitím se položky zkopírují, takže je cesta může libovolně měnit.',
  'help.guide.packing-templates.tip.1':
    'Lépe funguje jedna šablona pro každý typ cesty (k moři, do města, na túru) než jeden velmi dlouhý seznam.',
  'help.guide.packing-templates.tip.2': 'Smazání šablony nezmění cesty, ve kterých už byla použita.',
  'help.guide.packing-templates.tip.3':
    '„Uložit jako šablonu“ u seznamu věcí cesty vytvoří šablonu s hmotností, množstvím a taškou každé položky. Tady se zobrazují vedle položky a při použití šablony se položky uloží do stejných tašek.',
  // categories
  'help.guide.categories.title': 'Spravovat sadu kategorií',
  'help.guide.categories.goal': 'Určete, jaké kategorie mohou mít místa a kolekce a jak budou vypadat.',
  'help.guide.categories.step.1':
    'Klikněte na „Nová kategorie“, do řádku s nadpisem dialogu napište název, vyberte „Ikona“ a „Barva“ a zkontrolujte „Náhled“. Klikněte na „Vytvořit“.',
  'help.guide.categories.step.2':
    'V seznamu otevřete kategorii tužkou („Upravit“) a uložíte ji tlačítkem „Aktualizovat“. Košem („Smazat“) ji po potvrzení odstraníte.',
  'help.guide.categories.result':
    'Sada platí všude najednou: v inspektoru míst, u špendlíků na mapě, ve Sbírkách i ve filtrech.',
  'help.guide.categories.tip.1':
    'Místa si uchovávají ID kategorie, takže přejmenováním kategorie se přejmenuje u všech míst.',
  'help.guide.categories.tip.2':
    'Když kategorii smažete, její místa zůstanou bez kategorie. Pokud vám na tom záleží, přiřaďte je nejdřív k jiné kategorii.',
  // school-holiday-catalog
  'help.guide.school-holiday-catalog.title': 'Spravovat školní prázdniny ručně',
  'help.guide.school-holiday-catalog.goal':
    'Spravujte školní prázdniny země nebo regionu, ze kterých si může každý vybrat v sekci Dovolená (Vacay).',
  'help.guide.school-holiday-catalog.step.1':
    'V části „Školní prázdniny“ vyberte „Země“, nebo klikněte na + („Přidat zemi“), zadejte „Země“ a „Kód země (např. US)“ a klikněte na „Uložit“. „Přidat region“ přidá každou její část, která má vlastní termíny.',
  'help.guide.school-holiday-catalog.step.2':
    'Kliknutím na region otevřete „Region nebo školní obvod“: „Přidat období“, ke každému zadejte „Název prázdnin“, „Datum začátku“ a „Datum konce“ a klikněte na „Uložit“. Košem odeberete období nebo region; zemi smažete, až nebude mít žádné regiony.',
  'help.guide.school-holiday-catalog.result':
    'Uživatelé najdou zemi a region v Nastavení v sekci Dovolená (Vacay) a uvidí období ve své roční mřížce.',
  'help.guide.school-holiday-catalog.tip.1':
    'Region, který už si někdo vybral ve svém kalendáři v sekci Dovolená (Vacay), smazat nelze.',
  // auth-methods
  'help.guide.auth-methods.title': 'Určit, jak se lidé přihlašují',
  'help.guide.auth-methods.goal': 'Zapněte nebo vypněte přihlášení heslem, SSO a registraci a vyžadujte 2FA.',
  'help.guide.auth-methods.step.1':
    'V části „Metody ověřování“ zapněte nebo vypněte přihlášení heslem a registraci heslem; každý přepínač platí okamžitě. S vypnutou registrací vznikají nové účty jen přes pozvánky, SSO nebo „Vytvořit uživatele“.',
  'help.guide.auth-methods.step.2':
    '„SSO Login“ a „SSO Auto-Provisioning“ vyžadují níže nastavené „Jednotné přihlášení (OIDC)“. Automatické zřizování vytvoří účet, když se někdo poprvé přihlásí přes SSO.',
  'help.guide.auth-methods.step.3':
    'Zapněte „Vyžadovat dvoufázové ověření (2FA)“: každý, kdo 2FA nemá, si ho pak musí v Nastavení zřídit, než bude moci TREK používat.',
  'help.guide.auth-methods.result': 'Přihlašovací stránka nabízí právě ty způsoby, které jste nechali zapnuté.',
  'help.guide.auth-methods.tip.1':
    'TREK vám nedovolí vypnout poslední způsob přihlášení: jeho přepínač zešedne a popisek hlásí At least one login method must remain enabled.',
  'help.guide.auth-methods.tip.2':
    'Pokud je na serveru nastavené OIDC_ONLY, jsou přepínače pro hesla zamčené a upozorní na to poznámka.',
  // oidc
  'help.guide.oidc.title': 'Připojení jednotného přihlášení',
  'help.guide.oidc.goal': 'Umožněte přihlašování přes vašeho poskytovatele identit.',
  'help.guide.oidc.step.1':
    'V části „Jednotné přihlášení (OIDC)“ zadejte „Zobrazované jméno“ pro tlačítko, „URL vydavatele (Issuer)“, „ID klienta“ a „Tajný klíč klienta“ od svého poskytovatele. „Discovery URL (volitelné)“ vyplňte jen tehdy, když ho poskytovatel nezveřejňuje na obvyklé adrese, jako například Authentik. Klikněte na „Uložit“.',
  'help.guide.oidc.step.2': 'V části „Authentication Methods“ zapněte „SSO Login“.',
  'help.guide.oidc.result':
    'Na přihlašovací stránce se zobrazí tlačítko SSO; se zapnutým „SSO Auto-Provisioning“ dostanou noví uživatelé při prvním přihlášení účet automaticky.',
  'help.guide.oidc.tip.1':
    'Adresa pro přesměrování (redirect URI), kterou váš poskytovatel potřebuje, je adresa vašeho TREKu plus cesta pro OIDC callback z dokumentace.',
  'help.guide.oidc.tip.2':
    'Mapování claimů určuje, ze kterých skupin SSO se stanou správci. Podrobnosti najdete na stránce OIDC v dokumentaci.',
  // instance-keys
  'help.guide.instance-keys.title': 'Zadání API klíčů',
  'help.guide.instance-keys.goal':
    'Přidejte pro celou instanci fotky a hodnocení z Google, obálky z Unsplash a vyhledávání přes Amap.',
  'help.guide.instance-keys.step.1':
    'V části „API klíče“ už TREK Places API nahoře zajišťuje vyhledávání míst bez klíče. „Co v tom je“ vypisuje, co pokrývá a co ne.',
  'help.guide.instance-keys.step.2':
    'Pro fotky, hodnocení a otevírací dobu vložte „Google Maps API klíč“ a klikněte na „Testovat“; výsledek bude „Připojeno“ nebo „Neplatný“. Otevřete „K čemu se klíč používá“ a zapněte jen to, za co chcete platit: „Fotografie míst“, „Automatické doplňování míst“, „Podrobnosti o místě“, „Obohacení míst“ a „Hledat pouze přes Google“, a k tomu „Denní limit volání Google“.',
  'help.guide.instance-keys.step.3':
    'Vložte „Klíč API Unsplash“ pro hledání obálek a „API klíč Amap (高德地图)“ pro hledání míst v pevninské Číně a dole na kartě klikněte na „Uložit“.',
  'help.guide.instance-keys.result':
    'Uživatelé mohou funkce používat bez vlastních klíčů. Bez klíče Google běží vyhledávání přes TREK Places API a OpenStreetMap.',
  'help.guide.instance-keys.tip.1':
    'Pokud má uživatel v Nastavení osobní klíč, použije TREK pro něj tento klíč místo klíče instance.',
  'help.guide.instance-keys.tip.2': 'Klíče mohou pocházet i z proměnných prostředí. Ty se tu zobrazují jen pro čtení.',
  'help.guide.instance-keys.tip.3':
    '„Denní limit volání Google“ určuje, kolik smí TREK za den s klíčem utratit. Odznak vedle nadpisu počítá dnešní volání. Po dosažení limitu vyhledává TREK až do dalšího dne (UTC) přes OpenStreetMap.',
  // places-transit
  'help.guide.places-transit.title': 'Zvolit poskytovatele vyhledávání a veřejné dopravy',
  'help.guide.places-transit.goal':
    'Vyberte, která služba bude odpovídat na hledání míst a na dotazy na trasy veřejnou dopravou.',
  'help.guide.places-transit.step.1':
    'V části „Poskytovatel veřejné dopravy“ zvolte „Transitous (zdarma)“, který nepotřebuje klíč a nejlépe pokrývá Evropu, nebo Google, který používá klíč Google. Volba se uloží okamžitě.',
  'help.guide.places-transit.step.2':
    'V části „Poskytovatel hledání míst“ zvolte, kterou službu se TREK zeptá, když index TREK a OpenStreetMap nic nenajdou: „Automaticky“ (Google, pokud existuje klíč, jinak Amap), Google Places, Amap (高德地图) nebo OpenStreetMap.',
  'help.guide.places-transit.result':
    'Touto volbou se řídí všechna vyhledávací pole i všechny trasy veřejnou dopravou v TREKu.',
  'help.guide.places-transit.tip.1':
    'Volba bez klíče tu zobrazí varování. Vyhledávání míst pak používá jen index TREK a OpenStreetMap a veřejná doprava jen Transitous.',
  'help.guide.places-transit.tip.2': 'Trasy veřejné dopravy od Google se účtují za každý požadavek; Transitous ne.',
  // file-types
  'help.guide.file-types.title': 'Omezení typů souborů',
  'help.guide.file-types.goal': 'Určete, jaké přípony mohou mít nahrávané soubory.',
  'help.guide.file-types.step.1':
    'V části „Povolené typy souborů“ upravte seznam přípon oddělených čárkami, nebo zadejte *, pokud chcete povolit všechny typy, a klikněte na „Uložit“.',
  'help.guide.file-types.result':
    'Nahrání souboru jiného typu se odmítne se srozumitelnou zprávou, a to v dokumentech, v deníku i u obálek.',
  'help.guide.file-types.tip.1':
    'Typy obrázků v seznamu ponechte; obálky a fotky deníku se kontrolují podle stejného seznamu.',
  // toggle-addon
  'help.guide.toggle-addon.title': 'Zapnutí nebo vypnutí doplňku',
  'help.guide.toggle-addon.goal': 'Zpřístupněte funkční modul všem, nebo ho odeberte.',
  'help.guide.toggle-addon.step.1':
    'Klikněte na přepínač na dlaždici doplňku. Položka v navigaci se všem okamžitě zobrazí, nebo zmizí.',
  'help.guide.toggle-addon.step.2':
    'Některé dlaždice mají pod sebou řádky s možnostmi, například „Sledování zavazadel“ u Seznamů nebo poskytovatele fotek u Cestovního deníku; zobrazují se, jen když je doplněk zapnutý.',
  'help.guide.toggle-addon.result':
    'Když doplněk vypnete, jeho data zůstanou zachována. Po opětovném zapnutí se znovu zobrazí.',
  'help.guide.toggle-addon.tip.1': 'Vypnutím MCP zmizí endpoint i sekce „Integrace“, které na něm závisí.',
  'help.guide.toggle-addon.tip.2':
    '„Dovolená (Vacay)“, Atlas a „Cestovní deník“ jsou doplňky, o které uživatelé žádají nejčastěji; „Dokumenty“ potřebují úložiště pro nahrané soubory.',
  // install-plugin
  'help.guide.install-plugin.title': 'Instalace pluginu',
  'help.guide.install-plugin.goal': 'Přidejte plugin třetí strany a udělte mu přesně ta oprávnění, o která žádá.',
  'help.guide.install-plugin.step.1':
    'Otevřete „Objevit“, najděte plugin přes „Hledat pluginy…“ nebo filtr „Typ“ a klikněte na „Instalovat“. U souboru s balíčkem klikněte na „Nahrát plugin“ (ikona mráčku vpravo nahoře na kartě), nebo přetáhněte .zip na stránku.',
  'help.guide.install-plugin.step.2':
    'V části „Nainstalováno“ si přečtěte řádek: k čemu plugin smí přistupovat, ke kterým hostitelům se připojuje a jestli je „Zkontrolováno“ a „Podepsáno“. Pak zapněte „Povolit plugin“; řádek ukáže „Aktivní“.',
  'help.guide.install-plugin.step.3':
    'Nabídka ⋯ v řádku nabízí „Restartovat“, „Zobrazit protokol chyb“, „Povolení hostitelé“ a „Změnit verzi…“ a odkazy na zdrojový kód; „Smazat“ plugin odinstaluje i s jeho daty. Novější verze se v řádku zobrazí jako aktualizace a verze, která žádá nová oprávnění, zůstane vypnutá, dokud je neschválíte.',
  'help.guide.install-plugin.result':
    'Plugin běží ve vlastním procesu. Co přidává, například widgety, mapové vrstvy nebo nástroje, se zobrazí tam, kde to plugin určuje.',
  'help.guide.install-plugin.tip.1': '„Znovu prohledat“ najde složku pluginu propojenou pro vývoj i bez balíčku.',
  'help.guide.install-plugin.tip.2':
    'Nepodepsaný plugin je takto označený. Instalujte ho, jen pokud jeho zdroji důvěřujete.',
  // storage-backends
  'help.guide.storage-backends.title': 'Přesun nahraných souborů na S3 nebo jejich zrcadlení',
  'help.guide.storage-backends.goal':
    'Ukládejte soubory do objektového úložiště, nebo každou nahrávku kopírujte na druhé úložiště.',
  'help.guide.storage-backends.step.1':
    'V části „Backendy“ klikněte na „Přidat backend“, zadejte „Název“, vyberte „Typ“, místní úložiště nebo S3, a vyplňte jeho pole. Pokud chcete mít kopii i jinde, zaškrtněte „Cíle zrcadla“. Klikněte na „Použít“ a pak u nového řádku na „Testovat“, abyste ověřili připojení.',
  'help.guide.storage-backends.step.2':
    'V části „Kategorie“ přiřaďte každý druh nahrávek, například „Dokumenty cesty“, „Fotky z cestovního deníku“ nebo „Zálohy“, k backendu.',
  'help.guide.storage-backends.step.3':
    'Dole klikněte na „Uložit změny“. Pokud teď některá kategorie míří jinam, TREK se zeptá, zda „Přesunout stávající objekty“, nebo „Pouze směrovat nové zápisy“.',
  'help.guide.storage-backends.result':
    'Nové nahrávky se ukládají na přiřazený backend. Přesunuté soubory se poskytují odtamtud a to, co jste se rozhodli nepřesouvat, zůstává na původním místě.',
  'help.guide.storage-backends.tip.1':
    'Backend nastavený přes proměnné prostředí se tu zobrazí, ale upravit ho tu nelze.',
  'help.guide.storage-backends.tip.2':
    'Cíl zrcadlení dostává kopii každého nového zápisu; „Synchronizovat teď“ v řádku zkopíruje i to, co bylo uložené dřív. Pomalý cíl zpomaluje každé nahrávání na daném backendu.',
  // channels-instance
  'help.guide.channels-instance.title': 'Nastavit kanály oznámení',
  'help.guide.channels-instance.goal': 'Určete, které kanály si uživatelé mohou vybrat, a nastavte e-mail.',
  'help.guide.channels-instance.step.1':
    'V záhlaví karty zapněte „E-mail (SMTP)“, zadejte SMTP Host, SMTP Port, SMTP User, SMTP Password a From Address a klikněte na „Uložit“. „Odeslat testovací e-mail“ vám pošle zkušební e-mail. „Přeskočit kontrolu certifikátu TLS“ je jen pro místní poštovní server s vlastním certifikátem.',
  'help.guide.channels-instance.step.2':
    'Zapněte Webhook, Ntfy a Web Push, aby byly uživatelům k dispozici. Uživatelé pak v Nastavení, Oznámení zadají vlastní URL nebo téma, případně zapnou push na jednotlivých zařízeních.',
  'help.guide.channels-instance.step.3':
    '„Připomínky výletů“ zapínají připomínku před začátkem cesty; „V aplikaci“ je vždy zapnuté.',
  'help.guide.channels-instance.result': 'Na kartě „Oznámení“ uvidí každý uživatel kanály, které jste zapnuli.',
  'help.guide.channels-instance.tip.1':
    '„URL serveru Ntfy“ na kartě Ntfy pro správce je zároveň výchozím serverem pro uživatele. Uživatelé si přesto mohou nastavit vlastní server.',
  'help.guide.channels-instance.tip.2':
    'Kanály pluginů se zobrazí automaticky, jakmile je aktivní plugin s takovou schopností.',
  // admin-channels
  'help.guide.admin-channels.title': 'Upozornění pro správce do telefonu',
  'help.guide.admin-channels.goal':
    'Dostávejte upozornění na nové verze, selhávající zrcadla úložiště a žádosti o vodácké regiony.',
  'help.guide.admin-channels.step.1':
    'V části Admin Ntfy zadejte „Admin téma“ a podle potřeby „URL serveru Ntfy“ a „Přístupový token (volitelné)“; v části „Admin webhook“ zadejte URL. Na každé kartě klikněte na „Uložit“.',
  'help.guide.admin-channels.step.2':
    'Klikněte na „Odeslat testovací Ntfy“ nebo „Odeslat testovací webhook“ a ověřte, že zpráva dorazí.',
  'help.guide.admin-channels.result':
    'Události pro správce dostane v aplikaci každý správce a tam, kde jste to zapnuli, také téma ntfy a webhook pro správce.',
  'help.guide.admin-channels.tip.1':
    'Mějte téma pro správce oddělené od svého osobního, aby se hlášení o výpadcích neztratila mezi zprávami o cestách.',
  'help.guide.admin-channels.tip.2':
    'Webhook a téma pro správce jsou oddělené od vašich vlastních kanálů v Nastavení, Oznámení.',
  // mcp-tokens-admin
  'help.guide.mcp-tokens-admin.title': 'Odvolat přístup AI',
  'help.guide.mcp-tokens-admin.goal':
    'Prohlédněte si a zrušte libovolný token či relaci, kterou má AI klient, u kteréhokoli uživatele.',
  'help.guide.mcp-tokens-admin.step.1':
    'V části „OAuth relace“ najděte klienta podle názvu a vlastníka; jeho čipy ukazují udělené rozsahy oprávnění. Košem relaci po potvrzení odvoláte.',
  'help.guide.mcp-tokens-admin.step.2':
    'V části „API tokeny“ najdete totéž pro tokeny: název, vlastníka, „Vytvořeno“ a „Naposledy použit“. Košem token smažete a klient okamžitě přestane fungovat.',
  'help.guide.mcp-tokens-admin.result': 'Uživatel klienta ho musí znovu připojit. Nic jiného se nemění.',
  'help.guide.mcp-tokens-admin.tip.1':
    'Rozsahy oprávnění ukazují, co klient mohl dělat; rozsah jen pro čtení můžete klidně ponechat.',
  'help.guide.mcp-tokens-admin.tip.2':
    'Vypnutí doplňku MCP zastaví všechny klienty najednou a skryje tuto kartu, ale nic nesmaže: po opětovném zapnutí tokeny zase fungují.',
  // release-history
  'help.guide.release-history.title': 'Kontrola nové verze',
  'help.guide.release-history.goal': 'Zjistěte, zda je váš TREK aktuální a co přinese další verze.',
  'help.guide.release-history.step.1':
    'Když vyjde novější verze, zobrazí se pod záhlavím stránky „Dostupná aktualizace“ s verzí, kterou používáte. „Zobrazit na GitHubu“ otevře danou verzi a „Jak aktualizovat“ ukáže příkazy pro Docker nebo návod na aktualizaci pro jiné instalace.',
  'help.guide.release-history.step.2':
    '„Historie verzí“ uvádí všechna vydání s poznámkami. „Zobrazit podrobnosti“ je rozbalí, nejnovější vydání má štítek „Nejnovější“ a „Načíst další“ zobrazí starší vydání.',
  'help.guide.release-history.result':
    'Aktualizujete na hostiteli stažením nového image nebo sestavením nového tagu; datový adresář zůstane zachován.',
  'help.guide.release-history.tip.1': 'Před aktualizací si udělejte zálohu. Karta Zálohování je hned vedle této.',
  'help.guide.release-history.tip.2':
    'Předběžné verze se zobrazují, ale jako aktualizace se nenabízejí, pokud sami předběžnou verzi nepoužíváte.',
  // create-backup
  'help.guide.create-backup.title': 'Vytvoření a obnovení zálohy',
  'help.guide.create-backup.goal': 'Zálohujte celou instanci, uchovejte kopii jinde a mějte možnost ji obnovit.',
  'help.guide.create-backup.step.1':
    'V části „Záloha dat“ klikněte vpravo nahoře na „Vytvořit zálohu“. Uloží databázi a nahrané soubory do jednoho souboru na serveru.',
  'help.guide.create-backup.step.2': '„Stáhnout“ uloží kopii mimo server; košem po potvrzení smažete staré zálohy.',
  'help.guide.create-backup.step.3':
    '„Obnovit“ u zálohy nebo „Nahrát zálohu“ se souborem nahradí všechna současná data, jakmile v dialogu „Obnovit zálohu?“ kliknete na „Ano, obnovit“.',
  'help.guide.create-backup.result':
    'Obnovení vrátí uživatele, cesty, soubory a nastavení přesně do stavu v dané záloze.',
  'help.guide.create-backup.tip.1':
    'Obnovení je tu jediná akce, kterou nejde vrátit. Nejdřív si proto vytvořte novou zálohu.',
  'help.guide.create-backup.tip.2':
    'Zálohy se ukládají do datového adresáře. Zkopírujte je na jiný počítač, aby byly v bezpečí, i kdyby tento počítač selhal.',
  // auto-backup
  'help.guide.auto-backup.title': 'Naplánovat zálohy',
  'help.guide.auto-backup.goal': 'Nechte server, ať se zálohuje sám a maže staré zálohy.',
  'help.guide.auto-backup.step.1':
    'V části „Automatické zálohování“ zapněte „Povolit automatické zálohování“ a vyberte „Interval“ („Každou hodinu“, „Denně“, „Týdně“ nebo „Měsíčně“), „Spustit v hodinu“ a u týdenní nebo měsíční zálohy také „Den v týdnu“ nebo „Den v měsíci“.',
  'help.guide.auto-backup.step.2':
    'V části „Smazat staré zálohy po“ zvolte, jak dlouho se záloha uchovává, od „1 den“ po „Uchovávat navždy“, a klikněte na „Uložit“.',
  'help.guide.auto-backup.result':
    'Zálohy se v seznamu objevují podle plánu. Starší zálohy se smažou, jakmile jsou starší než zvolená doba.',
  'help.guide.auto-backup.tip.1':
    '„Spustit v hodinu“ používá čas serveru; nápověda pod ním uvádí časové pásmo serveru.',
  'help.guide.auto-backup.tip.2':
    'Místo na serveru není neomezené: obvykle stačí 7 nebo 14 dní a stažená kopie uložená jinde.',
  // audit-log
  'help.guide.audit-log.title': 'Čtení protokolu auditu',
  'help.guide.audit-log.goal': 'Zjistěte, kdo co a kdy udělal.',
  'help.guide.audit-log.step.1':
    'Procházejte řádky od nejnovějších: „Čas“, „Uživatel“, „Akce“, „Zdroj“, „IP“ a „Podrobnosti“. Akce jsou pojmenované podle toho, co se stalo, například neúspěšné přihlášení, změna MFA nebo obnovení.',
  'help.guide.audit-log.step.2':
    '„Obnovit“ vpravo nahoře znovu načte seznam. Odznak vedle nadpisu ukazuje, kolik záznamů z celkového počtu je načteno, a „Načíst další“ načte starší záznamy.',
  'help.guide.audit-log.result': 'Máte záznam, který můžete ukázat každému, kdo se ptá, proč se něco změnilo.',
  'help.guide.audit-log.tip.1': 'Časy jsou uvedené v časovém pásmu serveru.',
  'help.guide.audit-log.tip.2': 'Do protokolu se jen přidává; nic v něm nelze v aplikaci upravit ani smazat.',
  // document-providers
  'help.guide.document-providers.title': 'Nabídka úložiště dokumentů',
  'help.guide.document-providers.goal': 'Určete, se kterými úložišti může cesta synchronizovat dokumenty.',
  'help.guide.document-providers.step.1':
    'Dlaždice „Dokumenty“ vypisuje úložiště jako řádky: Paperless-ngx, Papra, Nextcloud, OpenCloud a Synology Drive. Všech pět je na začátku vypnutých a řádky se zobrazují, jen když jsou zapnuté samotné Dokumenty.',
  'help.guide.document-providers.step.2':
    'Zapněte přepínač v řádku Nextcloud. Zobrazí se zpráva „Doplněk byl aktualizován“ a vlastníci cest od té chvíle najdou na kartě „Soubory“ svých cest „Synchronizace dokumentů“ s Nextcloud v části „Připojit poskytovatele“.',
  'help.guide.document-providers.result':
    'Úložiště je k dispozici na každé cestě v tomto TREKu. Nic se nepřipojí, dokud to neudělá vlastník cesty.',
  'help.guide.document-providers.tip.1':
    'Tady se rozhoduje jen o tom, jestli se úložiště smí nabízet. Adresa a přihlašovací údaje patří k cestě a zadává je vlastník cesty na její kartě „Soubory“, nikdy v administraci.',
  'help.guide.document-providers.tip.2':
    'Když vypnete doplněk „Dokumenty“, vypnou se i všechna úložiště, a dokud jsou „Dokumenty“ vypnuté, žádné úložiště zapnout nejde: server odpoví „Enable the Documents addon first“. Úložiště ve vaší vlastní síti navíc vyžaduje na serveru ALLOW_INTERNAL_NETWORK=true.',

  // ── Screen: trip ──────────────────────────────────────────────────────────────────────
  'help.ctx.trip.title': 'Cesta',
  'help.ctx.trip.summary':
    'Vše o jedné cestě: plán s dny, mapou a místy a karty pro výlety, dopravu, rezervace, seznamy, náklady, soubory, spolupráci a propojený deník. Každá z nich má vlastní nápovědu pod touto.',
  'help.ctx.trip.bullet.1':
    'Lišta karet pod horní lištou: Plán, Výlety, Doprava, Rezervace, Seznamy, Náklady, Soubory, Spolupráce a po propojení deníku také Deník. Které karty na vašem TREK existují, určují doplňky a pluginy.',
  'help.ctx.trip.bullet.2':
    '„Plán“ má tři sloupce: vlevo dny, uprostřed mapu, vpravo místa. S doplňkem Cesta autem začíná sloupec dnů přepínačem „Dny“ a „Cesta autem“, s doplňkem Výlety začíná sloupec míst přepínačem „Místa“ a „Výlety“. Rezervace a doprava jsou součástí plánu, u zastávky a mezi zastávkami; karty je vypisují.',
  'help.ctx.trip.bullet.3':
    '„Nastavení cesty“, pilulka vedle názvu cesty vlevo nahoře, otevře nastavení cesty: „Lidé“ (členové a hosté), „Sdílení“ (veřejný odkaz jen pro čtení a odkaz pro pozvání) a „Deník“.',
  'help.ctx.trip.bullet.4':
    'Název, termín, obálku a měnu upravíte v části „Moje cesty“ tužkou na kartě cesty. Kliknutím na název cesty vlevo nahoře se tam vrátíte.',
  'help.ctx.trip.bullet.5':
    'Záložkou na vnitřním okraji sloupce sloupec sbalíte a mapa zabere uvolněné místo. Sbalený sloupec se zobrazí jako malá dlaždice v horním rohu mapy; kliknutím ji sloupec znovu zobrazíte. Přetažením tenkého oddělovače vedle sloupce změníte jeho šířku.',
  'help.ctx.trip.bullet.6': 'Šipka zpět na liště nástrojů dnů vrací vaše nedávné změny plánu, jednu po druhé.',
  // add-member
  'help.guide.add-member.title': 'Přidat člena',
  'help.guide.add-member.goal': 'Dejte někomu s účtem TREK přístup k této cestě.',
  'help.guide.add-member.step.1':
    'Klikněte na „Nastavení cesty“, pilulku vedle názvu cesty vlevo nahoře. Otevře se na části „Lidé“.',
  'help.guide.add-member.step.2':
    'V části „Pozvat uživatele“ vyberte osobu v poli „Vyberte uživatele…“ a klikněte na „Pozvat“.',
  'help.guide.add-member.step.3':
    'Osoba se teď zobrazí v části „Přístup“. Vlastníka označuje odznak „Vlastník“. Tlačítkem „Odebrat přístup“ na konci řádku osobu po potvrzení odeberete.',
  'help.guide.add-member.result':
    'Člen cestu vidí a upravuje stejně jako vy, v mezích úrovní, které správce nastavil v části „Nastavení oprávnění“.',
  'help.guide.add-member.tip.1':
    'Kdo v seznamu chybí, ještě nemá účet v TREKu: přidejte ho jako hosta, nebo ho nechte zaregistrovat přes pozvánku.',
  'help.guide.add-member.tip.2': 'Číslo vedle „Přístup“ ukazuje počet lidí v cestě; hosté jsou vypsaní zvlášť níže.',
  // trip-invite-link
  'help.guide.trip-invite-link.title': 'Pozvání odkazem',
  'help.guide.trip-invite-link.goal': 'Nechte lidi, aby se k cestě připojili sami.',
  'help.guide.trip-invite-link.step.1':
    'Vedle názvu cesty klikněte na „Nastavení cesty“ a vlevo vyberte „Sdílení“. V části „Odkaz pro pozvání na cestu“ klikněte na „Vytvořit odkaz pro pozvání“.',
  'help.guide.trip-invite-link.step.2':
    'Klikněte na „Kopírovat“ a odkaz pošlete. Kdo má účet TREK a odkaz otevře, připojí se jako člen.',
  'help.guide.trip-invite-link.step.3':
    '„Vygenerovat znovu“ odkaz nahradí a starý odkaz přestane fungovat; „Deaktivovat“ ho vypne.',
  'help.guide.trip-invite-link.result': 'Kdo odkaz otevře, připojí se k cestě a objeví se v části „Přístup“.',
  'help.guide.trip-invite-link.tip.1':
    'Kdo nemá účet, odkaz použít nemůže. Registrační odkazy vytváří správce v sekci Správce, Uživatelé a může je propojit s touto cestou.',
  'help.guide.trip-invite-link.tip.2':
    'Pokud jste odkaz poslali do špatného chatu, vygenerujte ho znovu: starý odkaz okamžitě přestane fungovat.',
  // add-guest
  'help.guide.add-guest.title': 'Přidání hosta bez účtu',
  'help.guide.add-guest.goal': 'Přidejte do cesty někoho, kdo TREK nepoužívá.',
  'help.guide.add-guest.step.1':
    'Vedle názvu cesty klikněte na „Nastavení cesty“. V části „Lidé“ jsou „Hosté“ úplně dole, pod „Přístup“.',
  'help.guide.add-guest.step.2': 'Napište jméno do pole „Jméno hosta“ a klikněte na „Přidat hosta“.',
  'help.guide.add-guest.result':
    'Hosta můžete přiřadit k nákladům, položkám k zabalení a úkolům, ale přihlásit se nemůže.',
  'help.guide.add-guest.tip.1':
    '„Přejmenovat“ (tužka) změní jméno hosta. „Odebrat přístup“ (koš) hosta po potvrzení odebere: jeho přiřazení se smažou a jeho podíl na každém výdaji se rozdělí mezi ostatní v daném rozdělení.',
  'help.guide.add-guest.tip.2': 'Pokud si ten člověk později založí účet, pozvěte ho jako člena a hosta odeberte.',
  // public-link
  'help.guide.public-link.title': 'Zveřejnění odkazu jen pro čtení',
  'help.guide.public-link.goal': 'Ukažte cestu lidem, kteří ji nemají upravovat.',
  'help.guide.public-link.step.1': 'Vedle názvu cesty klikněte na „Nastavení cesty“ a vlevo vyberte „Sdílení“.',
  'help.guide.public-link.step.2':
    'Na kartě „Veřejný odkaz“ zapněte, co smí odkaz ukazovat. „Mapa a plán“ je vždy zapnuté; „Rezervace“, „Balení“, „Náklady“ a „Chat“ jsou na vás.',
  'help.guide.public-link.step.3':
    'V části „Možnosti“ vynechá „Jen doprava a ubytování“ aktivity, poznámky ke dnům a prázdné dny. „Bez fotek“ vynechá fotky míst.',
  'help.guide.public-link.result': 'Kdo má odkaz, vidí vybrané části bez přihlášení a nemůže nic změnit.',
  'help.guide.public-link.tip.1':
    'Odkaz není nikde zveřejněný, ale otevřít ho může každý, kdo ho má. Chraňte ho stejně jako heslo.',
  'help.guide.public-link.tip.2': 'Pokud má osoba cestu upravovat, přidejte ji místo toho jako člena.',
  // transfer-ownership
  'help.guide.transfer-ownership.title': 'Předat cestu nebo ji opustit',
  'help.guide.transfer-ownership.goal': 'Předejte vlastnictví někomu jinému, nebo opusťte cestu, která není vaše.',
  'help.guide.transfer-ownership.step.1':
    'Vedle názvu cesty klikněte na „Nastavení cesty“. V části „Přístup“ klikněte v řádku člena na „Nastavit jako vlastníka“ (korunka) a potvrďte.',
  'help.guide.transfer-ownership.step.2':
    '„Opustit cestu“ ve vašem vlastním řádku vás po potvrzení z cesty odebere. Pokud jste vlastník, nejdřív předejte vlastnictví.',
  'help.guide.transfer-ownership.result':
    'Nový vlastník spravuje členy a může cestu smazat. Vy zůstanete běžným členem.',
  'help.guide.transfer-ownership.tip.1':
    'Vlastníkem je ten, kdo cestu vytvořil, dokud vlastnictví nepředá. Cestu může smazat jen vlastník.',
  'help.guide.transfer-ownership.tip.2':
    '„Odebrat přístup“ v řádku jiného člena funguje opačně: vlastník tohoto člena z cesty odebere.',
  // collapse-columns
  'help.guide.collapse-columns.title': 'Udělat víc místa pro mapu',
  'help.guide.collapse-columns.goal': 'Sbalte sloupec, nebo ho rozšiřte.',
  'help.guide.collapse-columns.step.1':
    'Klikněte na záložku s ikonou panelu na vnitřním okraji sloupce dnů a sloupec se sbalí; uvolněné místo zabere mapa. Stejnou záložku má i sloupec míst.',
  'help.guide.collapse-columns.step.2':
    'Když je sloupec sbalený, objeví se v horním rohu mapy malá dlaždice s ikonou panelu; její popisek uvádí „Plán“ nebo „Místa“. Kliknutím na ni sloupec znovu zobrazíte.',
  'help.guide.collapse-columns.step.3': 'Tažením tenkého oddělovače mezi sloupcem a mapou změníte šířku sloupce.',
  'help.guide.collapse-columns.result': 'Šířky se uloží. Při další návštěvě budou sloupce zase rozbalené.',
  'help.guide.collapse-columns.tip.1': 'Můžete sbalit oba sloupce najednou a mít na obrazovce jen mapu.',
  'help.guide.collapse-columns.tip.2':
    'V úzkém okně se vejde jen jeden sloupec: když jeden otevřete, druhý se sbalí. V telefonu sloupce nejsou; mezi zobrazeními přepínáte nahoře přes „Cesta“, „Plán“ a „Místa“.',
  // undo-change
  'help.guide.undo-change.title': 'Vrácení poslední změny',
  'help.guide.undo-change.goal': 'Vraťte zpět svou poslední změnu v plánu.',
  'help.guide.undo-change.step.1': 'Klikněte na šipku zpět na liště nad dny. Její popisek uvádí, kterou změnu vrátí.',
  'help.guide.undo-change.result': 'Plán je zpátky v původním stavu a krátká zpráva uvede, co se vrátilo.',
  'help.guide.undo-change.tip.1':
    '„Vrátit zpět“ se týká plánu: přidávání, přiřazování, odebírání, změny pořadí, přesouvání a zamykání míst, vyprázdnění dne, optimalizace trasy, mazání míst, změn kategorií a importů.',
  'help.guide.undo-change.tip.2':
    'Dalšími kliknutími se vracíte dál: TREK si pamatuje vašich posledních 30 změn v této cestě, od nejnovější, dokud cestu neopustíte.',
  'help.guide.clear-day.title': 'Vyprázdnění dne',
  'help.guide.clear-day.goal':
    'Odeberte ze dne všechna místa najednou, například když chcete den naplánovat od začátku.',
  'help.guide.clear-day.step.1': 'V plánu klikněte pravým tlačítkem na záhlaví dne.',
  'help.guide.clear-day.step.2': 'Zvolte „Vyprázdnit den“ a potvrďte.',
  'help.guide.clear-day.result':
    'Den je prázdný a jeho místa jsou zpět v seznamu jako nenaplánovaná. Šipka zpět nad dny je vrátí.',
  'help.guide.clear-day.tip.1': 'Odeberou se jen místa. Poznámky a rezervace dne zůstanou.',

  // ── Screen: trip-places ───────────────────────────────────────────────────────────────
  'help.ctx.trip-places.title': 'Místa',
  'help.ctx.trip-places.summary':
    'Pravý sloupec plánu: všechna místa cesty, naplánovaná i nenaplánovaná, s vyhledáváním, filtry a řazením, a možnosti, jak místa přidat: vyhledáním, ručně nebo ze sdíleného seznamu. „Místa“ a „Výlety“ nahoře přepínají mezi místy a výlety cesty.',
  'help.ctx.trip-places.bullet.1':
    '„Místa“ a „Výlety“ nahoře ve sloupci přepínají seznam. Při otevření je zobrazené „Místa“. „Výlety“ vypisuje výlety cesty a přes „Importovat GPX nebo KML“ importuje soubory GPX, KML a KMZ; výlet se v seznamu míst nezobrazuje.',
  'help.ctx.trip-places.bullet.2':
    '„Přidat místo/aktivitu“ otevře formulář pro místo, které vyhledáte nebo zadáte. Když je otevřený den, ukazuje tlačítko „Nové místo“ a „Ke dni“ vedle něj vytvoří místo rovnou v tomto dni.',
  'help.ctx.trip-places.bullet.3':
    '„Importovat místa“, ikonové tlačítko vedle, nabízí „Import seznamu“ pro seznam sdílený z Google Maps nebo Naver Maps. Pokud správce vypnul doplněk Výlety, nabízí také „Importovat soubor“ pro soubory .gpx, .kml a .kmz a soubor můžete přetáhnout přímo na sloupec.',
  'help.ctx.trip-places.bullet.4':
    'Pod nimi je „Hledat“, které prohledává i popisy a poznámky, a vedle něj zaškrtávací pole „Vybrat“. Řádek pod ním obsahuje filtry: „Zobrazit“ přepíná mezi „Vše“, „Nezařazené“ a „Plánováno“, u každé volby s počtem. Tlačítko se štítkem filtruje podle kategorie, hvězdička podle minimálního hodnocení, zeměkoule (když cesta zasahuje do více zemí nebo regionů) podle země nebo regionu a „Seřadit podle“ určuje pořadí seznamu.',
  'help.ctx.trip-places.bullet.5':
    'Řádek ukazuje obrázek, název a popis nebo adresu, a jakmile místo někdo ohodnotí, také hvězdičku s průměrným hodnocením. Kliknutím otevřete podrobnosti místa, přetažením ho zařadíte do dne a pravým tlačítkem (nebo přes „Další možnosti“, tři tečky) otevřete volby „Upravit“, „+ Den“, „Otevřít webové stránky“, Google Maps, „Uložit do sbírky“ a „Smazat“.',
  'help.ctx.trip-places.bullet.6':
    'Když je otevřený nějaký den, přidá kulaté + na konci řádku („+ Den“) místo do tohoto dne. Zobrazuje se u každého místa, které v tom dni ještě není. „Plánováno“ pak ukazuje jen tento den a upozorňuje na to čip „Zobrazuje se jen otevřený den“. Jeho křížek, „Zobrazit celou cestu“, den zavře.',
  // create-place
  'help.guide.create-place.title': 'Vytvoření místa',
  'help.guide.create-place.goal': 'Přidejte místo nebo aktivitu ručně, se všemi údaji, které plán potřebuje.',
  'help.guide.create-place.step.1':
    'Nahoře ve sloupci míst klikněte na „Přidat místo/aktivitu“ („Nové místo“, když je otevřený nějaký den). Formulář se otevře s kurzorem ve vyhledávání.',
  'help.guide.create-place.step.2':
    'Napište místo do pole „Hledat místa…“ a vyberte výsledek. Vyplní se název nahoře v dialogu, „Adresa“, „Zeměpisná šířka“, „Zeměpisná délka“ a „Webové stránky“ a „Podrobnosti místa“ vlevo ukážou obrázky, otevírací dobu a popis. V instanci TREK s klíčem Google spustí odkaz „Není to správné místo? Hledat místo toho přes Google“ pod výsledky stejné hledání přes Google. Když jsou zapnuté Sbírky, nabízí „Uložená místa“ vpravo stejným způsobem místa z vašich seznamů.',
  'help.guide.create-place.step.3':
    'V části „Podrobnosti místa“ klikněte na obrázek pod „Vybrat obrázek“ a nastavte ho jako obrázek místa. „Použít tento text“ zkopíruje popis do formuláře.',
  'help.guide.create-place.step.4':
    'Zkontrolujte pole formuláře. Jediné povinné pole je název nahoře v dialogu. Pilulkou „Kategorie“ pod ním vyberete jednu z kategorií cesty a + vedle ní vytvoří novou. „Adresa“, „Zeměpisná šířka“ a „Zeměpisná délka“ se doplní z vyhledávání, nebo je zadáte sami. „Popis“ a „Poznámky“ jsou pro váš vlastní text. Do pole „Webové stránky“ patří odkaz, „Připojit“ v části „Soubory“ přidá dokument a „Telefon“, „E-mail“ a „Přidat otevírací dobu“ slouží pro údaje, které vyhledávání nenašlo.',
  'help.guide.create-place.step.5':
    'Klikněte na „Přidat“. Pokud už je v cestě místo se stejným názvem nebo na stejném místě, TREK zobrazí upozornění a tlačítko se změní na „Přesto přidat“.',
  'help.guide.create-place.result': 'Místo je v seznamu i na mapě, mezi „Nezařazené“, dokud ho nezařadíte do dne.',
  'help.guide.create-place.tip.1':
    '„Náklady“ dole ve formuláři otevřou se zapnutým doplňkem Rozpočet hned po uložení editor nákladů pro výdaj za toto místo. Obrázek nebo PDF vložené do dialogu se připojí jako soubor v části „Soubory“.',
  'help.guide.create-place.tip.2':
    'Výsledky hledání dodává v každém TREKu index TREK a OpenStreetMap a „Podrobnosti místa“ se automaticky doplní z Wikipedie, Wikivoyage a Wikimedia. Googlu se TREK ptá, jen když oba zdroje nic nenajdou, a hodnocení poskytuje jen Google.',
  'help.guide.create-place.tip.3':
    'Místo můžete vytvořit i na mapě: klikněte na bod pravým tlačítkem a otevře se formulář s vyplněnými souřadnicemi a adresou.',
  // place-to-open-day
  'help.guide.place-to-open-day.title': 'Přidat místo rovnou do otevřeného dne',
  'help.guide.place-to-open-day.goal': 'Vytvořte nebo vyberte místo a přidejte ho ke dni v jednom kroku.',
  'help.guide.place-to-open-day.step.1':
    'Ve sloupci dnů klikněte na záhlaví dne. Den se otevře: jeho karta se zvýrazní a ve sloupci míst se vedle „Nové místo“ objeví tlačítko „Ke dni“.',
  'help.guide.place-to-open-day.step.2':
    '„Ke dni“ otevře stejný formulář jako „Nové místo“, ale po kliknutí na „Přidat“ se místo rovnou přidá do otevřeného dne.',
  'help.guide.place-to-open-day.step.3':
    'Existující místo přidáte do otevřeného dne kulatým + na konci jeho řádku („+ Den“), nebo pravým tlačítkem a volbou „+ Den“. + se zobrazuje u každého místa, které v tom dni ještě není.',
  'help.guide.place-to-open-day.step.4':
    'Funguje to i obráceně, bez otevření dne: přetáhněte řádek místa ze sloupce a pusťte ho na kartu dne. Když ho pustíte mezi dvě zastávky, zařadí se přesně tam.',
  'help.guide.place-to-open-day.result':
    'Místo se přidá na konec dne. Přetažením nahoru nebo dolů ho posunete tam, kam patří.',
  'help.guide.place-to-open-day.tip.1':
    'Otevřený den ovlivňuje i hledání: když je den otevřený, vychází mapa i hledání v okolí z míst, která už v tom dni jsou.',
  'help.guide.place-to-open-day.tip.2': '„Vrátit zpět“ na liště nástrojů nad dny přiřazení vrátí.',
  // filter-places
  'help.guide.filter-places.title': 'Najít místo v seznamu',
  'help.guide.filter-places.goal': 'Zobrazte ve sloupci jen místa, která hledáte.',
  'help.guide.filter-places.step.1':
    'Rozbalovací nabídka „Zobrazit“ pod vyhledáváním přepíná mezi „Vše“, „Nezařazené“ (zatím v žádném dni) a „Plánováno“ (zařazené do dne), u každé volby s počtem. Pokud je doplněk Výlety vypnutý a byla importována stopa GPX, nabízí také „Stopy“.',
  'help.guide.filter-places.step.2':
    'Pište do pole „Hledat“ nahoře. Seznam se při psaní zužuje podle názvu, adresy, popisu a poznámek; křížkem v poli hledání vymažete.',
  'help.guide.filter-places.step.3':
    'Tlačítko se štítkem vedle „Zobrazit“ vypíše kategorie: zaškrtněte jednu nebo více, mezi nimi i „Bez kategorie“. Tlačítko ukazuje, kolik jich je zaškrtnutých, a „Vymazat filtr“ dole v seznamu všechny zruší.',
  'help.guide.filter-places.step.4':
    'Hvězdička vedle nastavuje minimální hodnocení: 5+, 4+ a tak dále ponechají jen místa s průměrným hodnocením alespoň na této úrovni. Místa bez hodnocení se skryjí.',
  'help.guide.filter-places.result': 'Číslo u „Zobrazit“ ukazuje, kolik míst odpovídá, a filtry se kombinují.',
  'help.guide.filter-places.tip.1':
    'Když je otevřený den, „Plánováno“ ukazuje jen tento den a upozorní na to hláškou „Zobrazuje se jen otevřený den“ s odkazem „Zobrazit celou cestu“ vedle.',
  'help.guide.filter-places.tip.2':
    'Mapa se řídí také volbou „Zobrazit“, kategoriemi a hodnocením, a když je otevřený den, ukazuje „Plánováno“ na mapě jen tento den. Vyhledávání a zeměkoule filtrují jen seznam.',
  // edit-place
  'help.guide.edit-place.title': 'Úprava místa',
  'help.guide.edit-place.goal': 'Opravte název, posuňte špendlík, přidejte web nebo změňte kategorii.',
  'help.guide.edit-place.step.1':
    'Klikněte na řádek pravým tlačítkem a zvolte „Upravit“, nebo klikněte na „Další možnosti“ na konci řádku, nebo místo otevřete a v jeho podrobnostech klikněte na „Upravit“.',
  'help.guide.edit-place.step.2':
    'V okně „Upravit místo“ změňte, co potřebujete: název a pilulku „Kategorie“ nahoře v dialogu, „Adresa“, „Zeměpisná šířka“ a „Zeměpisná délka“, „Popis“, „Poznámky“, „Webové stránky“, „Telefon“, „E-mail“ a otevírací dobu. Pokud je místo zařazené právě do jednoho dne nebo jste ho otevřeli ze dne, obsahuje formulář také „Začátek“, „Do“ a „Poznámky pro tento den“.',
  'help.guide.edit-place.step.3': 'Klikněte na „Aktualizovat“.',
  'help.guide.edit-place.result':
    'Změna platí všude, kde se místo zobrazuje: v seznamu, na mapě i ve všech dnech, ve kterých je.',
  'help.guide.edit-place.tip.1':
    '„Poznámky pro tento den“ patří k místu jen v daném dni, „Poznámky“ patří k místu samotnému.',
  'help.guide.edit-place.tip.2':
    'Když je „Do“ dřív než „Od“, nejde kliknout na „Aktualizovat“. „Časový překryv s:“ jen upozorňuje, že jiná zastávka toho dne má stejný čas.',
  // delete-place
  'help.guide.delete-place.title': 'Smazat místo',
  'help.guide.delete-place.goal': 'Odstraňte místo z cesty natrvalo.',
  'help.guide.delete-place.step.1':
    'Klikněte na řádek pravým tlačítkem a zvolte „Smazat“ (najdete ho i v „Další možnosti“ na konci řádku), nebo klikněte na „Smazat“ v podrobnostech místa.',
  'help.guide.delete-place.step.2':
    'V potvrzovacím dotazu klikněte na „Smazat“. Pokud je na místě rezervovaná noc nebo je k němu propojená rezervace, dotaz uvede, co se smaže spolu s ním.',
  'help.guide.delete-place.result':
    'Místo zmizí ze seznamu, z mapy i ze všech dnů. „Vrátit zpět“ na liště nástrojů nad dny ho obnoví.',
  'help.guide.delete-place.tip.1':
    'Pokud chcete místo odebrat jen z jednoho dne, použijte místo toho u dané zastávky „Odebrat ze dne“.',
  'help.guide.delete-place.tip.2':
    'Chcete-li smazat více míst najednou, klikněte na ikonu zaškrtnutí vedle hledání a spusťte výběr.',
  // select-places
  'help.guide.select-places.title': 'Změnit nebo smazat několik míst najednou',
  'help.guide.select-places.goal': 'Změňte víc míst najednou, ne jedno po druhém.',
  'help.guide.select-places.step.1':
    'Klikněte na fajfku vedle vyhledávacího pole. U řádků se objeví kulatá zaškrtávací políčka a dole ve sloupci se zobrazí lišta s akcemi.',
  'help.guide.select-places.step.2':
    'Kliknutím na řádky je zaškrtnete. „Vybrat vše“, dvojité zaškrtnutí na liště, vybere všechny řádky, které zobrazují filtry.',
  'help.guide.select-places.step.3':
    'Lišta ukazuje počet zaškrtnutých míst. „Změnit kategorii“ jim všem nastaví jednu kategorii; „Uložit do sbírky“ (se zapnutými Sbírkami) je zkopíruje do některé z vašich sbírek; „Smazat vybrané“ je po potvrzení odstraní.',
  'help.guide.select-places.step.4': 'Výběr ukončíte kliknutím na „Hotovo“, křížek na konci lišty.',
  'help.guide.select-places.result':
    'Změna platí pro všechna vybraná místa; smazání můžete vrátit z lišty nástrojů nad dny.',
  'help.guide.select-places.tip.1':
    'Filtry při výběru dál fungují: nejdřív vyfiltrujte „Nezařazené“ a „Vybrat vše“ pak vybere jen tato místa.',
  'help.guide.select-places.tip.2':
    'Když je zapnutý doplněk „Sbírky“, objeví se na liště „Označit jako navštívené v seznamech“: označí místa jako navštívená ve sbírkách, do kterých jsou uložená.',
  // import-places-file
  'help.guide.import-places-file.title': 'Importovat místa ze souboru GPX, KML nebo KMZ',
  'help.guide.import-places-file.goal':
    'Pokud je doplněk Výlety vypnutý, importujte jako místa špendlíky a trasy exportované z Google My Maps, Google Earth nebo GPS trackeru.',
  'help.guide.import-places-file.step.1':
    'Klikněte na „Importovat místa“, ikonové tlačítko vedle tlačítka pro přidání, a zvolte „Importovat soubor“, nebo soubor přetáhněte kamkoli na sloupec míst. Obojí je k dispozici, jen pokud správce vypnul doplněk Výlety.',
  'help.guide.import-places-file.step.2':
    'Vyberte soubor nebo ho přetáhněte do pole. U GPX zaškrtněte, co se má importovat: „Trasové body“, „Trasy“, „Trasy GPS (s geometrií)“. U KML a KMZ zaškrtněte „Body (Placemarks)“ a „Trasy (LineStrings)“.',
  'help.guide.import-places-file.step.3':
    'Pole přijme několik souborů najednou, ale jen .gpx, .kml a .kmz. Jiný typ souboru nebo soubor nad 10 MB dialog odmítne a neimportuje.',
  'help.guide.import-places-file.step.4':
    'Klikněte na „Importovat“. Zpráva uvede, kolik míst se importovalo. U souboru KML nebo KMZ zůstane dialog otevřený se souhrnem toho, co se vytvořilo a co se přeskočilo.',
  'help.guide.import-places-file.result':
    'Místa jsou v seznamu. Stopa má na svém řádku barevnou linku, zobrazí se na mapě a dostane vlastní filtr „Stopy“.',
  'help.guide.import-places-file.tip.1':
    'Příliš velký soubor se odmítne a TREK zobrazí limit velikosti; vyexportujte ho znovu bez fotek, nebo ho rozdělte.',
  'help.guide.import-places-file.tip.2': 'Celý import můžete vrátit zpět z lišty nástrojů nad dny.',
  // import-places-list
  'help.guide.import-places-list.title': 'Importovat sdílený seznam z Google Maps nebo Naver Maps',
  'help.guide.import-places-list.goal': 'Importujte místa z odkazu na sdílený seznam.',
  'help.guide.import-places-list.step.1':
    'Klikněte na „Importovat místa“, ikonové tlačítko vedle tlačítka pro přidání, a zvolte „Import seznamu“.',
  'help.guide.import-places-list.step.2':
    'V části „Poskytovatel“ vyberte „Google Seznam“ nebo „Naver Seznam“ a do pole „Odkaz“ vložte sdílený odkaz na seznam. Funguje i odkaz na trasu v Google Maps: jeho zastávky se stanou místy v pořadí jízdy.',
  'help.guide.import-places-list.step.3': 'Klikněte na „Importovat“.',
  'help.guide.import-places-list.result':
    'Všechna místa ze seznamu jsou v cestě se stejnými názvy jako v seznamu; místa, která už v cestě jsou, se přeskočí.',
  'help.guide.import-places-list.tip.1': 'Seznam musí být sdílený veřejně; odkaz na soukromý seznam nic neimportuje.',
  'help.guide.import-places-list.tip.2':
    '„Obohatit místa přes Google“ se v dialogu zobrazí, když má váš TREK klíč Google: vyhledá každé importované místo a doplní fotky, adresu a podrobnosti.',
  'help.guide.sort-places.title': 'Řazení seznamu míst',
  'help.guide.sort-places.goal':
    'Seřaďte seznam podle názvu, hodnocení nebo podle toho, co bylo naposledy přidáno či změněno.',
  'help.guide.sort-places.step.1':
    'Klikněte na „Seřadit podle“, tlačítko se šipkami na konci řádku filtrů. Zatržítko označuje aktuální řazení a popisek tlačítka ukazuje jeho název.',
  'help.guide.sort-places.step.2':
    'Vyberte řazení, například „Nejlépe hodnocené“, nebo řaďte podle názvu. Seznam se okamžitě aktualizuje.',
  'help.guide.sort-places.result': 'Seznam ukazuje místa ve zvoleném pořadí, dokud nevyberete jiné.',
  'help.guide.sort-places.tip.1':
    'Při jakémkoli jiném řazení než „Naposledy přidané“ je tlačítko zvýrazněné, takže hned vidíte, že je seznam seřazený jinak.',
  'help.guide.sort-places.tip.2':
    'Řazení mění jen seznam. Dny si zachovávají vlastní pořadí a prohlížeč si zvolené řazení zapamatuje.',
  'help.guide.place-by-hand.title': 'Přidat místo, které vyhledávání nenajde',
  'help.guide.place-by-hand.goal':
    'Zadejte místo sami i s telefonem, e-mailem a otevírací dobou, když ho vyhledávání míst nenajde.',
  'help.guide.place-by-hand.step.1':
    'V dialogu místa napište název do vyhledávání a stiskněte Enter. Když se nic nenajde, dialog vám to oznámí a nabídne „Přidat ručně“.',
  'help.guide.place-by-hand.step.2':
    'Klikněte na „Přidat ručně“. Hledaný text se použije jako název a dialog se posune k polím s kontaktem.',
  'help.guide.place-by-hand.step.3': 'Pokud je znáte, vyplňte „Telefon“ a „E-mail“.',
  'help.guide.place-by-hand.step.4':
    'Klikněte na „Přidat otevírací dobu“ a nastavte, kdy místo v jednotlivé dny otevírá a zavírá. Tlačítkem kopírování nastavíte všem dnům časy prvního dne a přepínačem dne ho označíte jako „Uzavřeno“.',
  'help.guide.place-by-hand.step.5': 'Klikněte na „Přidat“.',
  'help.guide.place-by-hand.result':
    'Místo se přidá do seznamu. V jeho podrobnostech uvidíte zadaný telefon, e-mail a otevírací dobu, stejně jako u místa z vyhledávání.',
  'help.guide.place-by-hand.tip.1':
    'Když upravujete místo bez vlastní otevírací doby, automaticky se převezme otevírací doba z „Podrobnosti místa“ vlevo. Pokud už místo otevírací dobu má, dohledané časy převezmete tlačítkem vedle ní.',
  'help.guide.place-by-hand.tip.2':
    'Otevírací doba, kterou zadáte, nahradí dohledanou, takže kavárna se sezónní otevírací dobou ukáže tu, kterou znáte vy.',

  // ── Screen: trip-days ─────────────────────────────────────────────────────────────────
  'help.ctx.trip-days.title': 'Dny',
  'help.ctx.trip-days.summary':
    'Levý sloupec plánu: karta pro každý den se zastávkami v pořadí, poznámkami, rezervacemi a dopravou daného dne a trasou mezi zastávkami. Tady se cesta skutečně plánuje.',
  'help.ctx.trip-days.bullet.1':
    'Záhlaví nahoře: vlevo „Exportovat“ (PDF, kalendář, GPX); vpravo šipka zpět, „Rozbalit všechny dny“ / „Sbalit všechny dny“, „Změnit pořadí dnů“ a „Zobrazit všechny trasy rezervací“, jakmile má některá rezervace trasu k zobrazení.',
  'help.ctx.trip-days.bullet.2':
    'Karta dne: dlaždice s číslem dne a předpovědí počasí, název („Den 1“, dokud ho nepojmenujete) a datum, pod nimi pilulky pro nocleh (zelená v den příjezdu, červená v den odjezdu, čárkovaná, dokud není potvrzený; ikonou vstupenky otevřete rezervaci) a pro půjčené auto. Kliknutím na záhlaví den otevřete, šipkou ho sbalíte a + („Přidat ke dni“) otevře nabídku: „Přidat místo k tomuto dni“, „Přidat ubytování“, „Přidat dopravu“, „Veřejná doprava“ a „Přidat poznámku“. Pravým tlačítkem na záhlaví získáte totéž a navíc „Vyprázdnit den“.',
  'help.ctx.trip-days.bullet.3':
    'Uvnitř dne: zastávky v pořadí, každá s obrázkem, ikonou kategorie, názvem, časem a popisem, s propojenými rezervacemi a s tím, kdo jede; poznámky; rezervace a doprava daného dne, obarvené podle typu. Když najedete myší na zastávku, uvidíte úchyt pro přetažení, zámek na obrázku, šipky, „Přidat rezervaci“ a tři tečky („Další možnosti“). Nabídku zastávek a poznámek otevřete také pravým tlačítkem.',
  'help.ctx.trip-days.bullet.4':
    'Jakmile má otevřený den dvě zastávky, objeví se pod nimi lišta trasy: „Trasa“ zobrazí den na mapě a ukáže dobu cesty každého úseku mezi zastávkami, tři ikony nastaví pro den „Auto“, „Pěšky“ nebo „Kolo“ a dál následuje „Optimalizovat“, „Otevřít v Google Mapách“ a „Otevřít v CoMaps“.',
  'help.ctx.trip-days.bullet.5':
    'Místa můžete do dne přidat několika způsoby: přetáhnout řádek ze sloupce míst, použít „+ Den“ na daném řádku, „Přidat místo k tomuto dni“ z nabídky + u dne nebo u prázdného dne, nebo podrobnosti místa.',
  'help.ctx.trip-days.bullet.6':
    '„Celkové náklady“ dole sčítají výdaje z „Náklady“, které patří k zastávkám a rezervacím dne, každý jednou, ve vaší zobrazované měně.',
  // read-day-plan
  'help.guide.read-day-plan.title': 'Projít plán dne',
  'help.guide.read-day-plan.goal': 'Než cokoli změníte, zjistěte, co vám říká každá část karty dne.',
  'help.guide.read-day-plan.step.1':
    'Záhlaví: dlaždice s číslem dne a předpovědí, pak „Den 1“ nebo název, který jste dni dali, a datum. Pod nimi pilulky pro nocleh (zelená v den příjezdu, červená v den odjezdu, čárkovaná, dokud není potvrzený; ikonou vstupenky na ní otevřete rezervaci) a pro půjčené auto. Kliknutím na záhlaví den otevřete (jeho panel podrobností se otevře přes mapu). + vpravo („Přidat ke dni“) přidá místo, pobyt, dopravu, spojení veřejnou dopravou nebo poznámku a šipkou kartu sbalíte.',
  'help.guide.read-day-plan.step.2':
    'Zastávka ukazuje obrázek, ikonu kategorie a název, po zadání „Začátek“ také čas, a popis. Pod ní jsou „Poznámky pro tento den“. Když na řádek najedete myší, objeví se ovládací prvky: úchytem vlevo zastávku přetáhnete, obrázek se změní na zámek pro optimalizaci trasy a na pravém konci jsou šipky („Posunout nahoru“, „Posunout dolů“), „Přidat rezervaci“ a tři tečky („Další možnosti“).',
  'help.guide.read-day-plan.step.3':
    'Rezervace u zastávky se na ní zobrazuje jako odznak „Rezervace“, zelený, když je potvrzená, a oranžový, dokud čeká na potvrzení, s časem a dopravcem. Kliknutím na odznak rezervaci otevřete; tlačítko trasy vedle něj zobrazí její trasu. Doprava má vlastní řádek, obarvený podle typu, s časem a údajem „Odlet“ nebo „Přílet“. Kliknutím na rezervaci otevřete její podrobnosti; tlačítkem „Upravit“ ji tam změníte.',
  'help.guide.read-day-plan.step.4':
    'Když je zapnutá „Trasa“, ukazuje spojnice mezi dvěma zastávkami, jak dlouho úsek trvá a jak je dlouhý, a to podle způsobu dopravy daného dne; kliknutím způsob dopravy změníte jen pro tento úsek.',
  'help.guide.read-day-plan.step.5':
    'Lišta trasy pod zastávkami otevřeného dne: „Trasa“ zobrazí cestu dne na mapě, třemi ikonami zvolíte „Auto“, „Pěšky“ nebo „Kolo“, „Optimalizovat“ pak přeuspořádá zastávky a „Otevřít v Google Mapách“ a „Otevřít v CoMaps“ v nich den otevřou.',
  'help.guide.read-day-plan.result':
    'Každý symbol na kartě má svůj význam; návody níže vysvětlují, jak který z nich změnit.',
  'help.guide.read-day-plan.tip.1':
    'Pravým tlačítkem na zastávku nebo kliknutím na její tři tečky otevřete její nabídku: „Upravit“, „Odebrat ze dne“, „Vynechat z trasy“, „Otevřít webové stránky“, „Uložit do sbírky“, „Smazat“. Navigační aplikace najdete v podrobnostech místa pod „Navigace“.',
  'help.guide.read-day-plan.tip.2':
    'Když najedete myší na zastávku, objeví se na konci řádku „Přidat rezervaci“. Rezervace vytvořená tímto způsobem se propojí s touto zastávkou v tomto dni.',
  // place-onto-day
  'help.guide.place-onto-day.title': 'Přiřazení místa ke dni',
  'help.guide.place-onto-day.goal': 'Udělejte z místa ze seznamu zastávku dne na správném místě v pořadí.',
  'help.guide.place-onto-day.step.1':
    'Přetáhněte řádek ze sloupce míst na kartu dne. Pusťte ho mezi dvě zastávky, pokud ho chcete mít přesně tam, nebo na záhlaví dne, pokud ho chcete přidat na konec.',
  'help.guide.place-onto-day.step.2':
    'Bez přetahování: otevřete den kliknutím na jeho záhlaví a pak klikněte na kulaté + na konci řádku místa („+ Den“), nebo klikněte na řádek pravým tlačítkem a zvolte „+ Den“.',
  'help.guide.place-onto-day.step.3':
    '„Přidat místo k tomuto dni“ v nabídce + u dne nebo u prázdného dne otevře formulář místa a nové místo se do dne přidá okamžitě.',
  'help.guide.place-onto-day.step.4':
    'Když je otevřený den, zařadí ho do něj „Přidat ke dni“ v podrobnostech místa; „Ke dni“ v záhlaví sloupce míst vytvoří nové místo rovnou v otevřeném dni.',
  'help.guide.place-onto-day.result':
    'Místo je teď zastávkou dne. Na mapě se zobrazí s číslem dne a sloupec míst ho započítá pod „Plánováno“.',
  'help.guide.place-onto-day.tip.1':
    'Místo může být na více dnech: na druhý den ho přetáhněte ze sloupce míst. Když naopak přetáhnete zastávku z jedné karty dne na jinou, přesune se.',
  'help.guide.place-onto-day.tip.2': 'Šipkou zpět v záhlaví přiřazení vrátíte.',
  'help.guide.place-onto-day.tip.3':
    'Zastávku nemůžete pustit mezi dva záznamy s pevným časem ani před rezervaci, která už čas má; plán zůstává seřazený podle času.',
  // reorder-stops
  'help.guide.reorder-stops.title': 'Změna pořadí v rámci dne',
  'help.guide.reorder-stops.goal': 'Posuňte zastávku nahoru nebo dolů, případně na jiný den.',
  'help.guide.reorder-stops.step.1': 'Najeďte myší na zastávku a přetáhněte ji za úchyt na nové místo v kartě.',
  'help.guide.reorder-stops.step.2':
    'Nebo použijte šipky na pravém konci zastávky, na kterou jste najeli („Posunout nahoru“, „Posunout dolů“): každým kliknutím o jedno místo.',
  'help.guide.reorder-stops.step.3':
    'Přetažením zastávky na kartu jiného dne ji přesunete tam; z původního dne se odebere.',
  'help.guide.reorder-stops.step.4':
    'Pokud má zastávka pevný čas a přesun by narušil pořadí dne, zeptá se TREK „Odebrat čas?“, protože čas určuje pozici zastávky. „Potvrdit“ čas odebere a zastávku pak můžete dát kamkoli. „Zrušit“ ponechá den beze změny.',
  'help.guide.reorder-stops.result': 'Trasa i doby cesty se okamžitě přizpůsobí novému pořadí.',
  'help.guide.reorder-stops.tip.1':
    'Rezervace s pevným časem zůstává na pozici podle svého času. Když ji pustíte jinde v jejím dni, vrátí se zpět. Když ji přetáhnete na kartu jiného dne, přesune se do tohoto dne.',
  'help.guide.reorder-stops.tip.2':
    '„Optimalizovat“ v liště trasy seřadí celý den podle nejkratší cesty, pokud má den tři nebo více zastávek. Zastávku, která má zůstat na místě, nejdřív zamkněte.',
  // set-stop-times
  'help.guide.set-stop-times.title': 'Nastavit čas zastávky',
  'help.guide.set-stop-times.goal': 'Nastavte, kdy zastávka začíná a končí, aby den fungoval jako harmonogram.',
  'help.guide.set-stop-times.step.1':
    'Klikněte na zastávku pravým tlačítkem nebo na její tři tečky a zvolte „Upravit“. Když formulář otevřete ze dne, najdete hned pod místem pole „Začátek“ a „Do“ pro tento den.',
  'help.guide.set-stop-times.step.2':
    'Zadejte „Začátek“ a pokud chcete, i „Do“. „Časový překryv s:“ upozorní, že se překrývá jiná zastávka dne s nastaveným časem. Pokud je „Do“ dřív než „Začátek“, nejde kliknout na „Aktualizovat“.',
  'help.guide.set-stop-times.step.3':
    'Klikněte na „Aktualizovat“. Zastávka dostane štítek s časem a přesune se ve dni na místo, které jejímu času odpovídá.',
  'help.guide.set-stop-times.result':
    'Zastávky s časem si drží své místo v pořadí; zastávky bez času se řadí kolem nich.',
  'help.guide.set-stop-times.tip.1': 'Čas patří k zastávce v daném dni; stejné místo může mít v jiném dni jiný čas.',
  'help.guide.set-stop-times.tip.2':
    'Zastávku s časem přesunete ručně přetažením. TREK se zeptá „Odebrat čas?“ a po kliknutí na „Potvrdit“ se čas odstraní.',
  'help.guide.set-stop-times.tip.3':
    'Pole „Poznámky pro tento den“ ve stejném formuláři slouží pro informace, které platí jen pro tento den, třeba rezervaci stolu nebo číslo vstupenky.',
  // remove-from-day
  'help.guide.remove-from-day.title': 'Odebrat zastávku ze dne',
  'help.guide.remove-from-day.goal': 'Odeberte místo ze dne, aniž byste ho smazali z cesty.',
  'help.guide.remove-from-day.step.1':
    'Klikněte na zastávku pravým tlačítkem nebo na její tři tečky a zvolte „Odebrat ze dne“.',
  'help.guide.remove-from-day.step.2':
    'Zastávka ze dne zmizí. Místo zůstane ve sloupci míst, a pokud není v žádném jiném dni, najdete ho v sekci „Nezařazené“.',
  'help.guide.remove-from-day.result': 'Den, jeho trasa a náklady se aktualizují. Šipkou zpět zastávku obnovíte.',
  'help.guide.remove-from-day.tip.1': '„Smazat“ ve stejné nabídce odstraní místo z celé cesty, ze všech dnů.',
  'help.guide.remove-from-day.tip.2':
    '„Odebrat ze dne“ najdete také v panelu s podrobnostmi místa, vedle „Přidat ke dni“.',
  // lock-stop
  'help.guide.lock-stop.title': 'Zamknout zastávku na jejím místě',
  'help.guide.lock-stop.goal': 'Nechte zastávku na jejím místě, i když se trasa optimalizuje.',
  'help.guide.lock-stop.step.1':
    'Najeďte myší na obrázek zastávky a klikněte na zámek „Zachovat pozici při optimalizaci trasy“.',
  'help.guide.lock-stop.step.2':
    '„Optimalizovat“ teď seřadí ostatní zastávky kolem ní. Odemknete ji dalším kliknutím na zámek („Klikněte pro odemčení“).',
  'help.guide.lock-stop.result': 'Na obrázku je vidět zámek; zastávka si drží své místo, dokud ji neodemknete.',
  'help.guide.lock-stop.tip.1': 'Zastávka s pevným časem je zamčená svým časem; při optimalizaci se nikdy nepřesune.',
  'help.guide.lock-stop.tip.2':
    'Zámek platí jen do opětovného načtení stránky. Po načtení jsou všechny zastávky zase odemčené a pevně na místě zůstanou jen zastávky s časem.',
  // day-note
  'help.guide.day-note.title': 'Přidat ke dni poznámku',
  'help.guide.day-note.goal': 'Uložte si ke dni připomínku, číslo vstupenky nebo záložní plán.',
  'help.guide.day-note.step.1': 'Klikněte na + v záhlaví dne („Přidat ke dni“) a zvolte „Přidat poznámku“.',
  'help.guide.day-note.step.2':
    'Název poznámky napište nahoru do dialogu, kde je „Poznámka“. Tento název se zobrazí na kartě dne. Zbytek napište do „Poznámka ke dni“: lišta nad polem text formátuje (tučné písmo, seznamy, odkazy, citace) a „Náhled“ vlevo ukazuje, jak bude řádek vypadat.',
  'help.guide.day-note.step.3':
    'Vyberte ikonu a barvu, aby se poznámka od zastávek snadno odlišila, a klikněte na „Přidat“.',
  'help.guide.day-note.step.4':
    'Poznámka se ve dni zobrazí jako zastávka: přetáhněte ji na správné místo nebo použijte její šipky. Kliknutím ji upravíte. „Smazat“ najdete v dialogu i v nabídce tří teček nebo pravého tlačítka myši a před smazáním se zobrazí dotaz „Smazat poznámku?“.',
  'help.guide.day-note.result': 'Poznámka je součástí dne i PDF, a to na místě, kam jste ji přetáhli.',
  'help.guide.day-note.tip.1':
    'Odkazy v poznámce se otevírají v nové kartě a jednoduché zalomení řádku zůstane zachované.',
  'help.guide.day-note.tip.2': 'Poznámky patří k jednotlivým dnům. Poznámku pro celou cestu dejte do „Spolupráce“.',
  // day-route
  'help.guide.day-route.title': 'Zobrazení a optimalizace trasy dne',
  'help.guide.day-route.goal':
    'Podívejte se na trasu mezi zastávkami, zvolte způsob dopravy a nechte TREK určit pořadí.',
  'help.guide.day-route.step.1':
    'Otevřete den a v liště trasy pod jeho zastávkami klikněte na „Trasa“: trasa mezi zastávkami se zobrazí na mapě a spojnice mezi zastávkami ukazují čas a vzdálenost každého úseku.',
  'help.guide.day-route.step.2':
    'Třemi ikonami vedle nastavíte způsob dopravy pro celý den: „Auto“, „Pěšky“ nebo „Kolo“. Úseky se přepočítají. Pluginy mohou přidat vlastní způsoby dopravy.',
  'help.guide.day-route.step.3':
    'Kliknutím na spojnici změníte způsob dopravy jen pro tento úsek: vyberte způsob dopravy, „Veřejná doprava“, pokud chcete vyhledat spojení tam, kde je to k dispozici, nebo „Použít výchozí dne“, pokud se má úsek znovu řídit dnem.',
  'help.guide.day-route.step.4':
    '„Optimalizovat“ (kruhová šipka) seřadí zastávky podle nejkratší cesty, pokud jsou aspoň tři. Zastávky se zámkem nebo pevným časem zůstanou na místě; pokud je v daném dni ubytování, trasa začíná tam.',
  'help.guide.day-route.step.5':
    '„Otevřít v Google Mapách“ nebo „Otevřít v CoMaps“ otevře celý den jako trasu v dané aplikaci, abyste podle ní mohli cestou navigovat; CoMaps převezme i způsob dopravy dne.',
  'help.guide.day-route.result':
    'Den je trasa s časy. „Celkové náklady“ a jednotlivé úseky se při změně pořadí aktualizují.',
  'help.guide.day-route.tip.1':
    'Trasy ve výchozím stavu počítá OSRM; správce může v sekci „Výchozí nastavení uživatele“ nastavit jiný směrovací engine.',
  'help.guide.day-route.tip.2':
    'U úseku, pro který se nepodařilo najít trasu, se čas nezobrazí. Zkontrolujte, že obě zastávky mají souřadnice.',
  'help.guide.day-route.tip.3': 'Šipkou zpět optimalizaci vrátíte.',
  // manage-days
  'help.guide.manage-days.title': 'Přidávání, řazení a přejmenování dnů',
  'help.guide.manage-days.goal': 'Měňte samotné dny, nejen místa v nich.',
  'help.guide.manage-days.step.1':
    'Dny vycházejí z termínu cesty. Změňte data ve formuláři úpravy cesty na Přehledu a dny se přidají nebo odeberou na začátku či na konci. Než se odebere den s obsahem, zobrazí se seznam dnů, které se odeberou, a toho, co na nich je.',
  'help.guide.manage-days.step.2':
    '„Změnit pořadí dnů“ v záhlaví otevře seznam: přetáhněte den za úchyt, nebo použijte „Posunout nahoru“ a „Posunout dolů“; den se přesune i se svými místy, poznámkami a rezervacemi. Pod seznamem přidá „Přidat s dalším datem“ den za poslední den s datem a prodlouží cestu o jeden den; „Bez data“ přidá na konec den bez data. Cesta bez dat má jen „Přidat den“.',
  'help.guide.manage-days.step.3':
    '„Smazat den“, koš na konci řádku, se nejdřív zeptá. Vypíše, co se s dnem smaže: jeho místa, poznámky a rezervace, pobyt, který v tento den začíná nebo končí, a dny, které se posunou o jedno datum dřív. „Smazat den“ den odstraní, „Zrušit“ ho ponechá; poslední den smazat nelze.',
  'help.guide.manage-days.step.4':
    'Den přejmenujete tak, že ho otevřete a v panelu s podrobnostmi nad mapou kliknete na tužku vedle jeho názvu. Název nahradí „Den 1“ na kartě i v PDF.',
  'help.guide.manage-days.step.5':
    '„Rozbalit všechny dny“ a „Sbalit všechny dny“ v záhlaví rozbalí nebo sbalí všechny karty najednou. Jednu kartu sbalíte její šipkou.',
  'help.guide.manage-days.result':
    'Data zůstávají navázaná na pozici: když den posunete nahoru, dostane dřívější datum a jeho zastávky, poznámky a rezervace se přesunou s ním.',
  'help.guide.manage-days.tip.1': 'Přesun dnů můžete vrátit šipkou zpět; smazání dne vrátit nelze.',
  'help.guide.manage-days.tip.2': '„Celkové náklady“ dole v plánu sčítají celou cestu; karta „Náklady“ je rozepisuje.',
  // bookings-in-plan
  'help.guide.bookings-in-plan.title': 'Vyznat se v rezervacích a dopravě v plánu',
  'help.guide.bookings-in-plan.goal':
    'Zjistěte, kde se rezervace po vytvoření zobrazí a na které obrazovce se vytváří.',
  'help.guide.bookings-in-plan.step.1':
    'Doprava (let, vlak, trajekt, autobus, auto) je řádek obarvený podle typu, s časem a údajem „Odlet“ v den odjezdu nebo „Přílet“ v den příjezdu; zeměkoule vedle uvádí časové pásmo a let s přestupem má řádek pro každý úsek. U spojení veřejnou dopravou zobrazíte linky kliknutím na šipku. Kliknutím na řádek otevřete rezervaci; tlačítkem „Upravit“ ji tam změníte.',
  'help.guide.bookings-in-plan.step.2':
    'Rezervace propojená se zastávkou (restaurace, prohlídka) se u zastávky zobrazí jako štítek „Rezervace“ s časem. Potvrzená rezervace má štítek zelený, nepotvrzená oranžový. Rezervace, která má den, ale žádnou zastávku, má ve dni vlastní řádek.',
  'help.guide.bookings-in-plan.step.3':
    'Noc v hotelu je ubytování: jeho pilulka v záhlaví dne je v den příjezdu zelená a v den odjezdu červená a ikonou vstupenky otevřete rezervaci. Panel podrobností dne ho uvádí v části „Ubytování“ a trasa každého z těchto dnů začíná právě tam.',
  'help.guide.bookings-in-plan.step.4':
    'Tlačítko trasy na řádku rezervace zobrazí její trasu na mapě; „Zobrazit všechny trasy rezervací“ v záhlaví zobrazí všechny.',
  'help.guide.bookings-in-plan.step.5':
    'Vytváření: „Přidat rezervaci“ u zastávky, na kterou najedete myší, „Přidat dopravu“ a „Veřejná doprava“ v nabídce + u dne a karty „Rezervace“ a „Doprava“ pro úplný seznam s importem a soubory.',
  'help.guide.bookings-in-plan.result':
    'Každá rezervace je v plánu jednou. Karty ukazují stejné rezervace jako seznam.',
  'help.guide.bookings-in-plan.tip.1':
    'Potvrzeno a čeká na potvrzení je stav, který nastavíte u rezervace; plán ho ukazuje u zastávky, karta „Rezervace“ počítá oba.',
  'help.guide.bookings-in-plan.tip.2':
    'Když rezervaci s časem pustíte jinde v jejím dni, vrátí se na pozici podle svého času. Když ji přetáhnete na kartu jiného dne, přesune se do tohoto dne. Čas změníte úpravou rezervace.',
  // export-plan
  'help.guide.export-plan.title': 'Export plánu',
  'help.guide.export-plan.goal': 'Exportujte plán jako dokument, do kalendáře nebo do GPS zařízení.',
  'help.guide.export-plan.step.1': 'Vlevo v záhlaví nad dny klikněte na „Exportovat“.',
  'help.guide.export-plan.step.2':
    '„Dokument“: PDF otevře tiskové zobrazení všech dnů se zastávkami, poznámkami a rezervacemi, na začátku s přehledovou mapou trasy; „Můj plán jako PDF“ ponechá jen to, čeho se účastníte. V tomto zobrazení začne „Zalomení stránky pro každý den“ každý den na nové stránce, „Poznámky k dopravě“ přidají poznámky k vaší dopravě a „Uložit jako PDF“ dokument stáhne.',
  'help.guide.export-plan.step.3':
    'Kalendář: „Stáhnout .ics“ uloží rezervace jako soubor kalendáře, „Přihlásit se k odběru kalendáře“ vám dá odkaz, který vaše kalendářová aplikace automaticky aktualizuje.',
  'help.guide.export-plan.step.4':
    '„Mapy a GPS“ (GPX): „Celá cesta“ exportuje místa, trasy dnů a stopy; „Jen místa“ jen špendlíky; „Dny jako trasy“ jednu trasu na den, pro offline mapy a zařízení GPS.',
  'help.guide.export-plan.result': 'Soubor se stáhne; na cestě se nic nezmění.',
  'help.guide.export-plan.tip.1':
    'Jednotlivý den otevřete v mapové aplikaci z jeho lišty trasy: „Otevřít v Google Mapách“ nebo „Otevřít v CoMaps“.',
  'help.guide.export-plan.tip.2':
    '„Přihlásit se k odběru kalendáře“ vyžaduje zapnuté kalendářové kanály v nastavení a oprávnění cestu sdílet; návod najdete u Přehledu.',
  'help.guide.export-plan.tip.3':
    'K exportu stačí oprávnění ke čtení: PDF, .ics i GPX může exportovat každý člen cesty.',

  // ── Screen: trip-place ────────────────────────────────────────────────────────────────
  'help.ctx.trip-place.title': 'Podrobnosti místa',
  'help.ctx.trip-place.summary':
    'Karta, která se otevře přes mapu, když vyberete místo: vše, co o něm cesta ví, hodnocení hvězdičkami od všech, jeho obrázek a soubory a tlačítka, kterými ho přidáte do otevřeného dne, otevřete v mapové aplikaci nebo uložíte do seznamu.',
  'help.ctx.trip-place.bullet.1':
    'Klikněte na řádek ve sloupci míst, na zastávku ve dni nebo na značku na mapě a přes mapu se otevře karta. Když ji otevřete ze dne, karta ví, o kterou zastávku jde, a ukáže i účastníky zastávky a její rezervaci. Výlet (túra, vyjížďka nebo procházka z karty „Výlety“) místo toho otevře vlastní kartu výletu.',
  'help.ctx.trip-place.bullet.2':
    'Záhlaví ukazuje kulatý obrázek, název, adresu na jednom řádku a štítky se známými údaji: otevřeno nebo zavřeno, kategorie, čas, cena, telefonní číslo, e-mail a souřadnice. Kliknutím na obrázek použijete vlastní obrázek nebo fotku ze souborů místa. Dvojklikem na název místo přejmenujete. Křížkem vpravo kartu zavřete. Obrázek, přejmenování, „Upravit“ a „Smazat“ mají k dispozici jen cestující, kteří smějí upravovat místa.',
  'help.ctx.trip-place.bullet.3':
    'Pod tím: hodnocení hvězdičkami od každého cestujícího, popis a poznámky, a pokud je zastávka má, také „Poznámky pro tento den“.',
  'help.ctx.trip-place.bullet.4':
    'Dál následují „Otevírací doba“, „Barva trasy“, „Data trasy“ a „Soubory“, pokud se místa týkají. „Nahrát“ u nadpisu „Soubory“ přidá soubory z počítače a seznam ukazuje i soubory připnuté k této zastávce a soubory její rezervace, včetně potvrzení z hotelu. Pluginy mohou níže přidat vlastní řádky.',
  'help.ctx.trip-place.bullet.5':
    'Řádek dole: „Přidat ke dni“ nebo „Odebrat ze dne“, když je otevřený den, pak „Navigace“ (nebo název vaší mapové aplikace, pokud jste ji vybrali v Nastavení), „Otevřít webové stránky“ a „Uložit do sbírky“. Vpravo červený koš místo smaže a „Upravit“ otevře jeho formulář.',
  'help.ctx.trip-place.bullet.6':
    'U místa vybraného z vyhledávání uvidíte, co o něm ví index TREK nebo OpenStreetMap: mezi pilulkami nahoře „Otevřeno“ nebo „Uzavřeno“ se zeleným nebo červeným kroužkem kolem obrázku, podle místního času daného místa; jeho telefonní číslo, také jako pilulku; níže „Otevírací doba“ s dnešními hodinami v řádku a po kliknutí s celým týdnem; a jeho web pod „Otevřít webové stránky“. Hodnocení Google se zobrazí jen u místa nalezeného přes Google, a to v instanci TREK s klíčem Google. Otevírací doba, telefon a e-mail, které jste sami zadali do formuláře místa, nahradí vyhledané údaje a určují také barvu kroužku.',
  // read-place
  'help.guide.read-place.title': 'Co vám karta řekne o místě',
  'help.guide.read-place.goal': 'Zobrazte si vše, co cesta o jednom místě ví, na jedné kartě.',
  'help.guide.read-place.step.1':
    'Ve sloupci dnů klikněte na zastávku, kterou si chcete prohlédnout. Nad mapou se otevře karta a zastávka zůstane ve svém dni zvýrazněná.',
  'help.guide.read-place.step.2':
    'Nahoře: kulatý obrázek, název a adresa na jednom řádku; popisek ukazuje celou adresu. Pilulky pod nimi ukazují „Otevřeno“ nebo „Uzavřeno“ právě teď, podle místního času daného místa, a k tomu odpovídající zelený nebo červený kroužek kolem obrázku. Dále ukazují kategorii, čas, telefonní číslo a e-mail (kliknutím je otevřete v telefonu nebo poštovní aplikaci) a na širokém displeji i přesné souřadnice. Křížkem vpravo kartu zavřete.',
  'help.guide.read-place.step.3':
    '„Hodnocení“ je první sekce pod záhlavím: hvězdičky, které místu dali jednotliví cestující, s průměrem a počtem hlasů. Dokud nikdo nehlasoval, stojí tam „Zatím bez hodnocení“.',
  'help.guide.read-place.step.4':
    'Pak následuje popis a pod ním poznámky. Obojí je text z formuláře místa i s formátováním: seznamy, odkazy i tučné písmo fungují.',
  'help.guide.read-place.step.5':
    '„Účastníci“ ukazují, kdo na tuto zastávku jde. Zahrnutí jsou všichni, dokud někoho neodeberete.',
  'help.guide.read-place.step.6':
    'Níže „Otevírací doba“: řádek ukazuje otevírací dobu dne, který právě prohlížíte. Kliknutím zobrazíte celý týden, kde je tento den tučně. Hned vedle jsou „Soubory“.',
  'help.guide.read-place.result':
    'Karta zůstane otevřená, dokud ji nezavřete křížkem nebo nevyberete jiné místo. Otevírací doba na celý týden zůstane rozbalená a zastávka, ke které patří, zůstane ve sloupci dnů zvýrazněná.',
  'help.guide.read-place.tip.1':
    'Když místo vyberete ve sloupci míst, karta ukazuje místo, ale ne zastávku. Nezobrazí proto účastníky a jen rezervace, které patří přímo k místu, například pobyt v hotelu. Pokud chcete vidět vše, vyberte zastávku ve dni.',
  'help.guide.read-place.tip.2':
    'Pokud smíte upravovat místa, přejmenujete místo dvojklikem na název, bez otevírání formuláře. Enter změnu uloží, Escape ji zruší.',
  'help.guide.read-place.tip.3':
    'Ručně zadané místo má jen údaje z formuláře. Klikněte na „Upravit“ a vyplňte „Telefon“, „E-mail“ a otevírací dobu sami, nebo vyberte místo z návrhů pod „Hledat místa…“ a klikněte na „Aktualizovat“, aby se údaje dohledaly. Hodnocení Google vyžaduje klíč Google.',
  // rate-place
  'help.guide.rate-place.title': 'Hodnocení místa',
  'help.guide.rate-place.goal': 'Ohodnoťte místo vlastními hvězdičkami a podívejte se, jak ho hodnotili ostatní.',
  'help.guide.rate-place.step.1':
    'Otevřete místo. Řada hvězdiček je hned pod záhlavím a ukazuje průměr dosavadních hlasů, v závorce jejich počet.',
  'help.guide.rate-place.step.2':
    'Klikněte na požadovanou hvězdičku. Při přejíždění ukazatelem se hvězdičky vyplňují, takže vidíte, jaké hodnocení udělíte.',
  'help.guide.rate-place.step.3':
    'Váš hlas se hned započítá do průměru a obličeje vedle něj ukazují, kdo hlasoval. Když na řádek najedete myší, uvidíte hvězdičky od všech.',
  'help.guide.rate-place.step.4':
    'Stejný průměr se zobrazuje i na řádku místa ve sloupci míst, takže nejlepší místa v seznamu snadno najdete.',
  'help.guide.rate-place.result':
    'Vaše hvězdičky u místa vidí všichni v cestě. Hvězdičkou v řádku filtrů nad seznamem teď můžete zobrazit jen místa s určitým minimálním hodnocením.',
  'help.guide.rate-place.tip.1': 'Hodnotit může každý cestující, i v cestě, kde místa smí upravovat jen někteří z vás.',
  'help.guide.rate-place.tip.2':
    'Kliknutím na hvězdičku, kterou jste už udělili, své hodnocení odeberete. Když místo nikdo nehodnotil, zobrazí se znovu „Zatím bez hodnocení“.',
  'help.guide.rate-place.tip.3':
    'Vedle hvězdiček se zobrazí až šest hlasujících jako avatary. Bublina s nápovědou uvede všechny a označí i vás.',
  // place-image
  'help.guide.place-image.title': 'Nastavit místu vlastní obrázek',
  'help.guide.place-image.goal': 'Nahraďte automatickou miniaturu vlastní fotkou.',
  'help.guide.place-image.step.1': 'Otevřete místo ve sloupci míst.',
  'help.guide.place-image.step.2':
    'Najeďte myší na kulatý obrázek v záhlaví: objeví se fotoaparát s popiskem „Nahrát obrázek“. Klikněte na něj a vyberte soubor. Pokud už má místo mezi soubory fotky, TREK se nejdřív zeptá: „Nahrát ze zařízení“, nebo jeden z obrázků v části „Z přiložených souborů“.',
  'help.guide.place-image.step.3': 'Nahoře na kartě je teď váš obrázek s malým červeným křížkem v rohu.',
  'help.guide.place-image.step.4':
    'Stejný obrázek se zobrazí i u řádku místa ve sloupci míst a na jeho značce na mapě.',
  'help.guide.place-image.result':
    'Váš obrázek se u místa použije všude: na kartě, ve sloupci míst, u zastávky ve dni, na značce na mapě i ve sdílené cestě.',
  'help.guide.place-image.tip.1':
    'Podporované formáty jsou JPG, PNG, GIF a WebP. Fotku HEIC z iPhonu TREK při nahrání převede.',
  'help.guide.place-image.tip.2':
    'Křížkem v rohu svůj obrázek odeberete a znovu se zobrazí automatický. Samotné místo se nezmění.',
  'help.guide.place-image.tip.3':
    'Pokud jste obrázek nepřidali, TREK ho vyhledá podle souřadnic místa. Pokud žádný nenajde, zobrazí ikonu kategorie. Obrázek mohou nastavit jen cestující, kteří smějí upravovat místa.',
  // place-day-assign
  'help.guide.place-day-assign.title': 'Přidání místa k otevřenému dni nebo jeho odebrání',
  'help.guide.place-day-assign.goal': 'Místo přetahování řádku přes celý plánovač použijte tlačítko na kartě.',
  'help.guide.place-day-assign.step.1':
    'Ve sloupci dnů klikněte na záhlaví dne. Tento den je teď otevřený a karta se k němu vztahuje.',
  'help.guide.place-day-assign.step.2':
    'Ve sloupci míst klikněte na místo, které v tomto dni není. Otevře se jeho karta a řádek dole nabídne „Přidat ke dni“.',
  'help.guide.place-day-assign.step.3':
    'Klikněte na „Přidat ke dni“. Zastávka se přidá na konec dne a tlačítko se změní na „Odebrat ze dne“.',
  'help.guide.place-day-assign.step.4':
    'Zastávka je teď ve dni, na konci seznamu. Přetáhněte ji nahoru na správné místo.',
  'help.guide.place-day-assign.step.5':
    '„Odebrat ze dne“ zastávku ze dne zase odebere a na kartě se znovu objeví „Přidat ke dni“.',
  'help.guide.place-day-assign.result': 'Zastávka se ke dni přidá, nebo se z něj odebere. Samotné místo se nezmění.',
  'help.guide.place-day-assign.tip.1':
    'Tlačítko je k dispozici, jen když je otevřený nějaký den. Bez otevřeného dne není, kam místo přidat.',
  'help.guide.place-day-assign.tip.2':
    'Když zastávku ze dne odeberete, místo zůstane v cestě i ve sloupci míst. „Smazat“ ho odstraní všude.',
  'help.guide.place-day-assign.tip.3':
    'Zastávka, kterou do dne přidala rezervace ubytování, nemá ani jedno tlačítko. Tuto noc přidáte nebo odeberete v bloku ubytování daného dne.',
  // place-participants
  'help.guide.place-participants.title': 'Určit, kdo na zastávku jde',
  'help.guide.place-participants.goal': 'Vyberte, kdo jde na jednu zastávku, aniž byste měnili, kdo jede na cestu.',
  'help.guide.place-participants.step.1':
    'Klikněte na zastávku uvnitř dne. Otevře se karta a v části „Účastníci“ jsou uvedeni všichni účastníci cesty.',
  'help.guide.place-participants.step.2':
    'Kliknutím na štítek cestovatele ho z této zastávky odeberete. Když na štítek najedete myší, jméno se přeškrtne.',
  'help.guide.place-participants.step.3':
    'Jakmile někdo chybí, objeví se čárkované +. Kliknutím zjistíte, kdo na zastávce není.',
  'help.guide.place-participants.step.4':
    'Kliknutím na jméno osobu znovu přidáte. Když jsou znovu přidaní všichni, patří zastávka zase celé skupině.',
  'help.guide.place-participants.result': 'Zastávka ukazuje jen vybrané cestující. Zbytek skupiny má v tu dobu volno.',
  'help.guide.place-participants.tip.1':
    '„Účastníci“ se zobrazí, jen když je vybraná zastávka, takže vyberte místo přímo ve dni, ne ve sloupci míst. Zobrazí se také jen u cesty s více než jedním cestujícím.',
  'help.guide.place-participants.tip.2':
    'Když nikoho nevyberete, jdou všichni. Proto ze zastávky nemůžete odebrat posledního cestujícího.',
  'help.guide.place-participants.tip.3': 'Host, který nemá vlastní účet, může být účastníkem jako kdokoli jiný.',
  // place-booking
  'help.guide.place-booking.title': 'Rezervace u zastávky',
  'help.guide.place-booking.goal':
    'Podívejte se na rezervaci, která k zastávce patří, otevřete ji a propojte se zastávkou novou.',
  'help.guide.place-booking.step.1':
    'Otevřete zastávku, ke které rezervace patří. Karta ji uvádí v části „Rezervace“ jako vlastní malou kartičku s názvem rezervace a stavem „Potvrzeno“ nebo „Čeká na potvrzení“.',
  'help.guide.place-booking.step.2':
    'Karta rezervace ukazuje „Datum“, „Čas“ a „Rezervační kód“, štítky s dalšími údaji rezervace (číslo letu, nástupiště, check-in) a případné poznámky k rezervaci.',
  'help.guide.place-booking.step.3': 'Klikněte na kartičku rezervace. Rezervace se otevře přes mapu.',
  'help.guide.place-booking.step.4':
    '„Upravit“ v dolní části rezervace otevře její vlastní formulář. V něm „Propojit s přiřazením dne“ propojí rezervaci se zastávkou a už ukazuje tuto zastávku. Formulář pak zase zavřete.',
  'help.guide.place-booking.step.5':
    'Novou rezervaci pro zastávku založíte ve sloupci dnů: najeďte na zastávku a klikněte na „Přidat rezervaci“, ikonu vstupenky na jejím konci. Formulář se otevře jako „Nová rezervace“, už propojený se zastávkou.',
  'help.guide.place-booking.result':
    'Rezervace je propojená se zastávkou: zobrazuje se na kartě i ve dni a její soubory najdete i tady v části „Soubory“.',
  'help.guide.place-booking.tip.1':
    'Rezervace se zobrazuje u zastávky, ke které je připnutá, a rezervace hotelu navíc u hotelu, ať ho otevřete kdekoli. Rezervace bez zastávky se zobrazuje na kartě „Rezervace“.',
  'help.guide.place-booking.tip.2':
    'Jedna zastávka může mít víc rezervací, třeba oběd a prohlídku, které začínají na stejném místě.',
  'help.guide.place-booking.tip.3':
    'U vlaku, letu nebo trajektu otevře „Upravit“ místo toho formulář dopravy, stejný jako na kartě „Doprava“.',
  // place-files
  'help.guide.place-files.title': 'Vstupenky přímo u místa',
  'help.guide.place-files.goal': 'Přiložte vstupenku, voucher nebo mapu k místu, ke kterému patří.',
  'help.guide.place-files.step.1':
    'Otevřete místo. Soubory jsou pod jeho podrobnostmi, vedle „Otevírací doba“, pokud ji místo má, a dokud místo žádné soubory nemá, je tam nápis „Soubory“.',
  'help.guide.place-files.step.2': 'Vpravo od nadpisu „Soubory“ klikněte na „Nahrát“ a vyberte soubor.',
  'help.guide.place-files.step.3': 'Tlačítko ukazuje, kolik souborů místo má, a seznam se otevře automaticky.',
  'help.guide.place-files.step.4': 'Na každém řádku je název a velikost souboru. Kliknutím soubor otevřete.',
  'help.guide.place-files.result':
    'Soubor je připojený k místu a započítaný na kartě. Najdete ho také na kartě „Soubory“ cesty.',
  'help.guide.place-files.tip.1':
    '„Soubory“ vypisují i to, co je připnuté k této zastávce a přiložené k její rezervaci, takže potvrzení z hotelu uvidíte přímo u hotelu.',
  'help.guide.place-files.tip.2':
    '„Nahrát“ přijme několik souborů najednou a fotka mezi nimi se může stát obrázkem místa.',
  'help.guide.place-files.tip.3':
    'Pokud nemáte oprávnění nahrávat soubory, tlačítko „Nahrát“ se nezobrazí; soubory, které už k místu patří, se zobrazují dál.',
  // place-navigation
  'help.guide.place-navigation.title': 'Otevření místa v mapové aplikaci nebo na jeho webu',
  'help.guide.place-navigation.goal': 'Otevřete místo v navigační aplikaci, se kterou se tam dostanete.',
  'help.guide.place-navigation.step.1': 'Otevřete místo a v řádku dole klikněte na „Navigace“.',
  'help.guide.place-navigation.step.2':
    'Seznam obsahuje mapové aplikace vhodné pro toto místo: Google Maps, Waze, Apple Maps, OpenStreetMap a CoMaps, na Androidu navíc „Jiná mapová aplikace“.',
  'help.guide.place-navigation.step.3':
    'Klikněte na tu, kterou používáte. Kde to jde, pošle TREK do aplikace samotné místo, ne jen souřadnice, takže dorazíte ke správnému vchodu.',
  'help.guide.place-navigation.step.4':
    '„Otevřít webové stránky“ vedle otevře na nové kartě vlastní web místa s otevírací dobou a vstupenkami.',
  'help.guide.place-navigation.result':
    'Mapová aplikace se otevře na daném místě, web v nové kartě a v cestě se nic nezmění. Pokud máte TREK nainstalovaný jako aplikaci, otevře se místo nové karty mapová aplikace.',
  'help.guide.place-navigation.tip.1':
    'Waze začne navigovat hned. Ostatní aplikace místo otevřou a navigaci spustíte dalším klepnutím.',
  'help.guide.place-navigation.tip.2':
    'Které aplikace se nabídnou, záleží na místě a na vašem zařízení: Apple Maps se na Androidu nenabízí, 高德地图 jen u míst v Číně a Waze, Apple Maps a CoMaps potřebují souřadnice místa. „Jiná mapová aplikace“ otevře místo v libovolné mapové aplikaci ve vašem telefonu s Androidem.',
  'help.guide.place-navigation.tip.3':
    'Vyberte si mapovou aplikaci jednou v Nastavení v části „Otevírat místa v“. Tlačítko pak ukazuje její název a rovnou ji otevře. Stejně se chová, když se k místu hodí jen jedna aplikace.',
  // place-to-collection
  'help.guide.place-to-collection.title': 'Uložit místo do některého ze svých seznamů',
  'help.guide.place-to-collection.goal': 'Uložte si místo, které jste našli na této cestě, na příští.',
  'help.guide.place-to-collection.step.1': 'Otevřete místo a v řádku dole na kartě klikněte na „Uložit do sbírky“.',
  'help.guide.place-to-collection.step.2':
    '„Uložit do seznamu“ ukazuje všechny seznamy, které vlastníte nebo sdílíte. Vyplněná záložka vpravo označuje seznamy, které už toto místo obsahují.',
  'help.guide.place-to-collection.step.3': 'Klikněte na seznam. Místo se do něj hned přidá.',
  'help.guide.place-to-collection.step.4': 'Zavřete dialog křížkem a tlačítko na kartě teď ukazuje „Uloženo“.',
  'help.guide.place-to-collection.result':
    'Místo je ve vašem seznamu i s obrázkem, poznámkami a adresou, připravené na další cestu.',
  'help.guide.place-to-collection.tip.1':
    'Tlačítko je k dispozici, jen když je zapnutý doplněk Sbírky, který správce zapíná v části „Doplňky“.',
  'help.guide.place-to-collection.tip.2':
    'Místo může být ve více seznamech zároveň, v každém s jiným stavem: v jednom jako nápad, v jiném jako navštívené.',
  'help.guide.place-to-collection.tip.3':
    '„Označit jako navštívené“ pod názvem místa nahoře ve výběru označí místo v seznamu jako navštívené. Pokud je místo ve více vašich seznamech, ukazuje tlačítko „Navštíveno všude“ a označí ho ve všech najednou. „Zobrazení“ otevře vaše seznamy ve Sbírkách.',
  // place-track
  'help.guide.place-track.title': 'Prohlédnout si stopu a dát jí vlastní barvu',
  'help.guide.place-track.goal': 'Zjistěte, jak dlouhá je importovaná trasa a která čára na mapě jí patří.',
  'help.guide.place-track.step.1':
    'Řádek trasy ve sloupci míst ukazuje krátkou čáru v barvě, jakou má trasa na mapě. Klikněte na ni.',
  'help.guide.place-track.step.2': '„Data trasy“ uvádějí délku trasy v jednotkách, které máte nastavené.',
  'help.guide.place-track.step.3':
    '„Barva trasy“ nad tím ukazuje použitou barvu. Kliknutím na řádek otevřete vzorník barev.',
  'help.guide.place-track.step.4': 'Vyberte barvu. Linie na mapě i proužek na řádku se změní současně.',
  'help.guide.place-track.step.5':
    'Čárkované políčko vlevo, „Automatická barva“, vrátí trase výchozí barvu. Kapátko vpravo otevře systémový výběr barev pro jakoukoli jinou barvu.',
  'help.guide.place-track.result':
    'Stopa se vykreslí ve zvolené barvě, na kartě, na svém řádku ve sloupci míst i na mapě.',
  'help.guide.place-track.tip.1':
    'Tyto dva bloky má jen místo s trasou: místo importované ze souboru GPX, KML nebo KMZ dřív, než existovaly Výlety, nebo v instanci TREK s vypnutými Výlety. Když jsou Výlety zapnuté, nový soubor GPX se stane výletem s vlastní kartou výletu.',
  'help.guide.place-track.tip.2':
    'Stopa zaznamenaná s výškami ukazuje také nejvyšší a nejnižší bod, nastoupané a sestoupané metry a výškový profil trasy.',
  'help.guide.place-track.tip.3':
    'Import dá každé trase, kterou přidá, vlastní barvu, takže dvě procházky nikdy nemají stejnou.',
  // read-place
  'help.guide.read-place.step.7':
    'Řádek dole nabízí, co odsud můžete udělat: zařadit místo do otevřeného dne nebo ho z něj odebrat, otevřít ho v mapové aplikaci nebo na jeho webu, uložit ho do seznamu a vpravo ho smazat (červený koš) nebo upravit.',

  // ── Screen: trip-files ────────────────────────────────────────────────────────────────
  'help.ctx.trip-files.title': 'Soubory',
  'help.ctx.trip-files.summary':
    'Všechny dokumenty cesty v jednom seznamu: jízdenky, potvrzení, permanentky a obrázky. Ke každému můžete připsat poznámku a propojit ho s místem nebo rezervací, ke které patří. Smazané soubory jdou do koše, odkud je lze obnovit.',
  'help.ctx.trip-files.bullet.1':
    '„Přetáhněte soubory sem“, čárkované pole pod lištou, přijímá soubory, které na něj přetáhnete. Kliknutím na něj otevřete výběr souborů. Pole ukazuje typy souborů, které tato instance TREK přijímá, a limit na jeden soubor (Max 50 MB, pokud správce nenastavil jiný).',
  'help.ctx.trip-files.bullet.2':
    'Lišta nahoře obsahuje „Soubory“ a karty filtrů „Vše“, „PDF“, „Obrázky“ a „Dokumenty“, každou s počtem. Jakmile má nějaký soubor hvězdičku, objeví se za „Vše“ karta s hvězdičkou, a jakmile má nějaká poznámka přílohu, objeví se na konci karta „Poznámky spolupráce“.',
  'help.ctx.trip-files.bullet.3':
    'Řádek ukazuje náhled nebo typ souboru, kdo ho nahrál, název, poznámku pod ním, velikost a datum a jeden odznak za každé propojení: místo, rezervaci nebo dopravu podle jejího názvu (po najetí myší se ukáže „Denní plán“, „Rezervace“ nebo „Doprava“) a „Z poznámek spolupráce“.',
  'help.ctx.trip-files.bullet.4':
    'Na konci řádku je až pět ikon, každá s názvem po najetí myší: „Označit hvězdičkou“, „Přiřadit“ (tužka), „Otevřít“, „Stáhnout“ a „Smazat“. „Smazat“ se neptá: soubor se přesune do koše, odkud ho můžete obnovit. Offline dál fungují poznámka, odkaz, hvězdička i koš a odešlou se, až bude TREK znovu online; připojení vyžaduje jen nahrávání a odebrání dalšího odkazu.',
  'help.ctx.trip-files.bullet.5':
    'Obrázek nebo video se otevře na celou obrazovku, s ovládáním šipkami na klávesnici a řadou náhledů. Ostatní dokumenty se otevřou v dialogu s názvem nahoře a pod ním „Otevřít v nové kartě“ a „Stáhnout“. Karta do digitální peněženky se rovnou stáhne.',
  'help.ctx.trip-files.bullet.6':
    'Ikona koše na pravém konci lišty („Koš“) přepne seznam na smazané soubory. Tam můžete každý obnovit nebo trvale smazat a „Vysypat koš“ na liště smaže všechny. „Synchronizace dokumentů“ je vlevo od ikony koše, pokud je cesta propojená s úložištěm dokumentů, nebo pro vlastníka cesty či správce, jakmile je nějaké úložiště zapnuté.',
  // files-upload
  'help.guide.files-upload.title': 'Přidat do cesty dokument',
  'help.guide.files-upload.goal':
    'Nahrajte jízdenku, potvrzení nebo fotku ze složky Stažené soubory do cesty, kde ji otevře kdokoli z cesty.',
  'help.guide.files-upload.step.1':
    'Otevřete cestu a v liště karet klikněte na „Soubory“. Najdete tam dokumenty cesty a nad nimi pole pro nahrávání.',
  'help.guide.files-upload.step.2':
    'Klikněte na „Přetáhněte soubory sem“ a vyberte jeden nebo více souborů. Nahrávají se postupně a během nahrávání pole ukazuje „Nahrávání...“. V poli pod „nebo klikněte pro výběr“ vidíte typy souborů, které tato instance TREK přijímá, a maximální velikost souboru.',
  'help.guide.files-upload.step.3':
    'Jakmile se nahraje poslední soubor, automaticky se pro něj otevře „Přiřadit soubor“ (pokud má cesta nějaká místa nebo rezervace) s názvem souboru nahoře v dialogu. „Přidat poznámku...“ v části „Poznámka“ přidá k souboru poznámku a seznamy pod ní ho propojí s místem nebo rezervací. Zavřete ho křížkem vpravo nahoře; zavřením o nic nepřijdete.',
  'help.guide.files-upload.step.4':
    'Nové soubory se zobrazí nahoře v seznamu; nad nimi jsou jen soubory s hvězdičkou. Řádek ukazuje, kdo soubor nahrál, název, velikost a datum. Obrázek má náhled, ostatní soubory ukazují svůj typ.',
  'help.guide.files-upload.result': 'Dokumenty jsou v cestě a každý, kdo cestu vidí, je může otevřít a stáhnout.',
  'help.guide.files-upload.tip.1':
    'Soubor můžete také přetáhnout z plochy přímo do pole. Pole se zvýrazní, dokud je soubor nad ním.',
  'help.guide.files-upload.tip.2':
    'Stisknutím Ctrl+V přidáte do seznamu obrázek ze schránky, takže snímek obrazovky s rezervací nemusíte nejdřív ukládat.',
  'help.guide.files-upload.tip.3':
    'Nahrávání vyžaduje oprávnění nahrávat soubory; bez něj pole vůbec nevidíte. Typ, který není na seznamu, se odmítne s hlášením a nic se nenahraje. Soubor nad limit (50 MB, pokud správce nenastavil jiný) se odmítne ještě před odesláním a hlášení limit uvede. Nahrávání vyžaduje také připojení: offline vám to TREK oznámí a nic nenahraje.',
  // files-link
  'help.guide.files-link.title': 'Propojení dokumentu s místem nebo rezervací',
  'help.guide.files-link.goal': 'Mějte jízdenku po ruce i u dne, ke kterému patří, nejen v tomto seznamu.',
  'help.guide.files-link.step.1':
    'Klikněte na tužku na konci řádku („Přiřadit“). Otevře se „Přiřadit soubor“ s názvem souboru nahoře v dialogu.',
  'help.guide.files-link.step.2':
    'V části „Poznámka“ přijímá „Přidat poznámku...“ jeden řádek, který se pak zobrazí pod názvem souboru v seznamu. Uloží se po stisknutí Enter nebo po opuštění pole.',
  'help.guide.files-link.step.3':
    'V části „Místo“ vlevo vidíte místa cesty seskupená podle dnů s datem a na konci „Nepřiřazeno“ pro místa, která nejsou v žádném dni. Kliknutím místo zaškrtnete.',
  'help.guide.files-link.step.4':
    'Vpravo v části „Rezervace a doprava“ jsou rezervace cesty. Klikněte na tu, ke které dokument patří. I ona dostane zaškrtnutí.',
  'help.guide.files-link.step.5':
    'Zavřete křížkem × vpravo nahoře. Tlačítko pro uložení tu není: každé kliknutí se uložilo okamžitě.',
  'help.guide.files-link.result':
    'Řádek ukazuje poznámku a jeden štítek pro každé propojení: jeden s názvem místa a jeden s názvem letu. Po najetí myší na štítek se zobrazí „Denní plán“ nebo „Doprava“. Dokument je také připojený k místu i k letu.',
  'help.guide.files-link.tip.1':
    'Soubor může mít víc propojení najednou, takže stejné potvrzení může patřit k rezervaci hotelu i k místu hotelu zároveň.',
  'help.guide.files-link.tip.2':
    'Dalším kliknutím na zaškrtnutou položku tento odkaz odeberete; samotný soubor zůstane. Offline se poznámka a nová zaškrtnutí uloží a odešlou, až bude TREK znovu online; připojení vyžaduje jen odebrání dalšího odkazu.',
  'help.guide.files-link.tip.3':
    'Funguje to i obráceně: dokument přiložený k místu nebo k rezervaci je také v tomto seznamu, se stejným odznakem na řádku.',
  // files-star
  'help.guide.files-star.title': 'Důležité dokumenty nahoře',
  'help.guide.files-star.goal':
    'Označte těch pár dokumentů, které budete opravdu potřebovat, abyste je v dlouhém seznamu rychle našli.',
  'help.guide.files-star.step.1':
    'Klikněte na hvězdičku na konci řádku („Označit hvězdičkou“). Zezlátne, před názvem souboru se objeví druhá hvězdička a po najetí na tlačítko se zobrazí „Odebrat hvězdičku“.',
  'help.guide.files-star.step.2':
    'Seznam se znovu seřadí: soubory s hvězdičkou jsou nad všemi ostatními a v každé skupině jsou nejnovější nahoře.',
  'help.guide.files-star.step.3':
    'Na kartách filtrů v liště se teď hned za „Vše“ objeví hvězdička s počtem označených souborů. Kliknutím na ni zobrazíte jen tyto soubory.',
  'help.guide.files-star.result': 'Soubory označené hvězdičkou jsou v seznamu nahoře a jedna karta ukazuje jen je.',
  'help.guide.files-star.tip.1':
    'Karta s hvězdičkou existuje, jen dokud má nějaký soubor hvězdičku. Když ji odeberete poslednímu souboru, karta zmizí.',
  'help.guide.files-star.tip.2':
    'Označování hvězdičkou vyžaduje stejné oprávnění jako „Přiřadit“, tedy „Upravit metadata souborů“. Člen bez něj hvězdičky vidí, ale kliknutím na „Označit hvězdičkou“ nic nezmění.',
  // files-filter
  'help.guide.files-filter.title': 'Najít dokument v seznamu',
  'help.guide.files-filter.goal': 'Zobrazte jen ten typ dokumentu, který hledáte.',
  'help.guide.files-filter.step.1':
    'Karty filtrů jsou na liště nahoře vedle „Soubory“: „Vše“, „PDF“, „Obrázky“ a „Dokumenty“, každá s počtem souborů.',
  'help.guide.files-filter.step.2': 'Klikněte na „PDF“: seznam zobrazí jen soubory PDF.',
  'help.guide.files-filter.step.3':
    'Další dvě karty se objeví, jen když má cesta odpovídající soubory. Klikněte na „Poznámky spolupráce“, kartu, která se objeví, jakmile má některá poznámka na kartě „Spolupráce“ přílohu: seznam pak ukáže jen tyto soubory. Stejně se objeví karta s hvězdičkou, jakmile nějaký soubor označíte hvězdičkou.',
  'help.guide.files-filter.step.4': '„Vše“ zobrazí znovu celý seznam.',
  'help.guide.files-filter.result':
    'Seznam ukazuje jen soubory vybrané karty a počet na každé kartě uvádí, kolik jich je.',
  'help.guide.files-filter.tip.1':
    'Nejsou tu žádné složky a soubory nejde přejmenovat. Dokumenty rozlišíte podle poznámky v „Přiřadit soubor“, propojení s místy a rezervacemi a hvězdičky.',
  'help.guide.files-filter.tip.2':
    'Seznam je vždy seřazený tak, že nahoře jsou soubory s hvězdičkou a pak od nejnovějších, takže dokument nahraný dnes je nad dokumentem z minulého měsíce.',
  // files-preview
  'help.guide.files-preview.title': 'Číst dokument přímo v TREKu',
  'help.guide.files-preview.goal':
    'Hned si prohlédněte jízdenku nebo obrázek a když ho potřebujete v zařízení, stáhněte si ho.',
  'help.guide.files-preview.step.1':
    'Klikněte na název obrázku nebo jeho miniaturu. Otevře se přes celou obrazovku a vlevo nahoře uvidíte název souboru a jeho pořadí mezi obrázky. Video se otevře stejně a přehraje se přímo tam.',
  'help.guide.files-preview.step.2':
    'Kulatými šipkami po stranách, šipkami doleva a doprava na klávesnici nebo pruhem náhledů dole procházíte všechny obrázky, které seznam právě zobrazuje.',
  'help.guide.files-preview.step.3':
    '„Otevřít v nové kartě“ a „Stáhnout“ jsou kulatá tlačítka vpravo nahoře vedle ×. Obrázek zavřete křížkem, klávesou Escape nebo kliknutím na tmavé pozadí.',
  'help.guide.files-preview.step.4':
    'Dokument, který není obrázek, se místo toho otevře v dialogu: nahoře název, pod ním pilulky „Otevřít v nové kartě“ a „Stáhnout“ a u PDF pod tím samotná stránka. Zavřete ho křížkem vpravo nahoře, klávesou Escape nebo kliknutím mimo dialog.',
  'help.guide.files-preview.step.5':
    'Šipka na konci řádku („Stáhnout“) uloží soubor rovnou do zařízení, aniž byste ho nejdřív otevírali.',
  'help.guide.files-preview.result':
    'Dokument se zobrazí na obrazovce a stejnými dvěma tlačítky ho otevřete v kartě prohlížeče nebo uložíte na disk.',
  'help.guide.files-preview.tip.1': 'Na dotykové obrazovce mezi obrázky přejíždějte prstem místo klikání na šipky.',
  'help.guide.files-preview.tip.2':
    'Karta do peněženky (wallet pass) nikdy neotevře náhled. Rovnou se stáhne, aby ji telefon mohl otevřít v aplikaci peněženky.',
  'help.guide.files-preview.tip.3':
    '„Otevřít v nové kartě“ i „Stáhnout“ načítají soubor přes vaše přihlášení, takže odkaz zkopírovaný z adresního řádku nikomu jinému fungovat nebude.',
  // files-trash
  'help.guide.files-trash.title': 'Smazání dokumentu a jeho obnovení',
  'help.guide.files-trash.goal': 'Smažte, co cesta už nepotřebuje, a obnovte soubory, které ještě potřebujete.',
  'help.guide.files-trash.step.1':
    'Klikněte na koš na konci řádku („Smazat“). Soubor hned zmizí ze seznamu a zobrazí se zpráva „Přesunuto do koše“. Žádné potvrzení se nezobrazí.',
  'help.guide.files-trash.step.2':
    'Ikona koše na pravém konci lišty („Koš“) přepne seznam na smazané soubory. Nadpis lišty ukazuje „Koš“ a karty filtrů i pole pro nahrávání jsou skryté.',
  'help.guide.files-trash.step.3':
    'Řádek v koši je zašedlý a má dvě ikony: „Obnovit“, která soubor obnoví, a „Smazat“, která ho po potvrzení trvale smaže.',
  'help.guide.files-trash.step.4':
    'Klikněte na „Obnovit“. Zobrazí se zpráva „Soubor byl obnoven“ a soubor zmizí z koše. Jeho poznámka i propojení zůstanou zachované.',
  'help.guide.files-trash.step.5':
    '„Vysypat koš“ na liště vedle ikony koše natrvalo smaže všechno, co v koši zbývá. Prohlížeč se předtím jednou zeptá na potvrzení. Ikonou koše se vrátíte zpět k souborům.',
  'help.guide.files-trash.result': 'Soubor je zpátky v seznamu na původním místě.',
  'help.guide.files-trash.tip.1':
    '„Smazat“ na řádku se předem neptá. Proto existuje koš: z TREK se nic neodstraní, dokud to nesmažete tady. Vše funguje i offline a odešle se, až bude TREK znovu online.',
  'help.guide.files-trash.tip.2':
    'Mazání a obnovování souborů vyžaduje oprávnění soubory mazat. Člen bez něj nevidí na řádku „Smazat“ ani tlačítka v koši.',
  'help.guide.files-trash.tip.3': 'Soubor, který v koši smažete natrvalo, už nejde obnovit.',
  // files-sync
  'help.guide.files-sync.title': 'Synchronizovat dokumenty s úložištěm dokumentů',
  'help.guide.files-sync.goal':
    'Propojte cestu s vlastním úložištěm dokumentů, aby se soubory nahrané sem ukládaly tam a soubory uložené tam se objevovaly tady.',
  'help.guide.files-sync.step.1':
    'Klikněte na „Synchronizace dokumentů“ vedle ikony koše na pravém konci lišty. Otevře se dialog s názvem cesty pod nadpisem. Vlevo v části „Připojit poskytovatele“ jsou úložiště, která zapnul správce, každé s řádkem o tom, jak soubory ukládá: Paperless-ngx a Papra podle štítku, Nextcloud a Synology Drive do složky, OpenCloud do prostoru. Vpravo je „Zatím nic nepřipojeno“.',
  'help.guide.files-sync.step.2':
    'Klikněte na své úložiště, tady Nextcloud. Otevře se menší dialog pro připojení s názvem úložiště, který se zeptá na přihlašovací údaje, jež toto úložiště vyžaduje.',
  'help.guide.files-sync.step.3':
    'Vyplňte „Adresa“ a přihlašovací údaje k úložišti: API token u Paperless-ngx, API klíč a „ID organizace“ u Papra, „Uživatelské jméno“ a „Heslo aplikace“ u Nextcloud, „Uživatelské jméno“ a „Token aplikace“ u OpenCloud a u Synology Drive „Uživatelské jméno“, heslo a, pokud ho účet vyžaduje, „Dvoufaktorový kód“. Kde to úložiště umožňuje, použijte heslo nebo token aplikace, nikdy heslo ke svému účtu. Nextcloud a Synology Drive mají navíc nepovinnou „Základní složka“, kde TREK hledá složky cest, tady /Reisen. „Přijmout vlastnoručně podepsaný certifikát“ dole je jen pro úložiště ve vaší vlastní síti s takovým certifikátem.',
  'help.guide.files-sync.step.4':
    'Klikněte na „Otestovat připojení“. TREK se s zadanými údaji připojí k úložišti a v patičce se zobrazí Reached it, signed in as a jméno účtu. Pokud jsou přihlašovací údaje odmítnuté nebo adresa nedostupná, zobrazí se v patičce místo toho tato informace. V obou případech se nic neuloží.',
  'help.guide.files-sync.step.5':
    'Klikněte na „Připojit“. Připojení se uloží k cestě a TREK se zeptá, kde v úložišti mají být dokumenty cesty: štítek, složka nebo prostor, který je obsahuje. Synchronizuje se jen to, co je uvnitř. „Vytvořit nové“ ho po kliknutí na „Vytvořit“ založí s názvem podle názvu cesty. V části „Nebo použijte existující“ vidíte ty, které už existují. Klikněte na jeden z nich, tady na složku Autumn in Japan.',
  'help.guide.files-sync.step.6':
    'Dialog se znovu otevře: vaše úložiště je vlevo v části „Tato cesta“ a jeho karta vpravo ukazuje, kam se synchronizuje, kdy synchronizace naposledy proběhla, a tlačítko „Synchronizovat teď“. První synchronizace se spustí automaticky, tlačítkem „Synchronizovat teď“ ji spustíte kdykoli. Po synchronizaci se odznak „Zatím nesynchronizováno“ vedle názvu změní na zelenou tečku, která po najetí ukáže „Aktuální“. Pruh toku ukazuje, kolik dokumentů má TREK a kolik úložiště, a mezi nimi dráhy „Do úložiště“ a „Z úložiště“. Dialog zavřete křížkem × vpravo nahoře.',
  'help.guide.files-sync.result':
    'Dokumenty, které už v úložišti byly, se objeví nahoře v seznamu jako nahrané vaším jménem a každý dokument cesty je také v úložišti, kromě dokumentů z „Poznámky spolupráce“. Od této chvíle TREK úložiště kontroluje na pozadí a změny v seznamu se do úložiště kopírují.',
  'help.guide.files-sync.tip.1':
    'Cestu může připojit jen její vlastník nebo správce instance, protože přihlašovací údaje dávají přístup k celému účtu v úložišti. Jakmile je cesta připojená, vidí „Synchronizace dokumentů“ každý člen, může ji otevřít, přečíst si kartu a stisknout „Synchronizovat teď“.',
  'help.guide.files-sync.tip.2':
    'Úložiště ve vaší vlastní síti vyžaduje na serveru TREKu ALLOW_INTERNAL_NETWORK=true a jeho adresa musí být adresa počítače v síti, nikdy localhost. Jinak „Otestovat připojení“ odpoví „Tato adresa není povolena.“',
  'help.guide.files-sync.tip.3':
    '„Odpojit“, ikona vedle „Synchronizovat teď“, se jednou zeptá na potvrzení. Pak připojení ukončí a všechny dokumenty ponechá na obou stranách. Pokud štítek, složku nebo prostor připojíte podruhé, TREK ho bere jako nový a znovu importuje vše, co obsahuje. Po odpojení proto připojte prázdný, ne ten původní.',

  // ── Screen: trip-day-detail ───────────────────────────────────────────────────────────
  'help.ctx.trip-day-detail.title': 'Podrobnosti dne',
  'help.ctx.trip-day-detail.summary':
    'Panel, který se otevře přes mapu, když kliknete na záhlaví dne. Ukazuje den jako celek: jeho název a datum, počasí v místě, kde budete, rezervace na tento den a zarezervované noci.',
  'help.ctx.trip-day-detail.bullet.1':
    'Klikněte na záhlaví dne ve sloupci dnů a přes střed mapy se otevře panel. Dalším kliknutím na stejné záhlaví nebo na křížek vpravo panel zavřete a výběr dne zrušíte. Když otevřete místo ze sloupce míst nebo z mapy, panel se zavře a zobrazí se místo.',
  'help.ctx.trip-day-detail.bullet.2':
    'Záhlaví ukazuje název dne a jeho datum. Tužkou vedle názvu den přejmenujete. Dvojitou šipkou panel sbalíte do úzkého pruhu, abyste zase viděli mapu.',
  'help.ctx.trip-day-detail.bullet.3':
    'Nahoře vidíte počasí pro daný den. „Předpověď pro“ ukazuje místo, pro které předpověď platí: první zastávku dne, nebo hotel, ve kterém se ráno probudíte.',
  'help.ctx.trip-day-detail.bullet.4':
    '„Rezervace“ vypisují rezervace daného dne, každou s druhem, zastávkou, ke které patří, a časy. Zelená znamená potvrzenou, oranžová čekající na potvrzení a spojení veřejnou dopravou je modré a nemá stav. Kliknutím na řádek rezervaci otevřete.',
  'help.ctx.trip-day-detail.bullet.5':
    '„Ubytování“ ukazuje každou noc zarezervovanou v tomto dni, s příjezdem a odjezdem ve dnech, kdy nastávají, časovým oknem pro příjezd, časem odjezdu a číslem potvrzení. Pokud má pobyt rezervaci, uvádí ji pole „Rezervace“ pod ním se stavem „Čeká na potvrzení“ nebo „Potvrzeno“. Kliknutím rezervaci otevřete.',
  'help.ctx.trip-day-detail.bullet.6':
    '„Přidat ubytování“ přidá k tomuto dni nocleh: vyberte ubytování z míst cesty, zvolte, které dny pokrývá, a doplňte časy a kód. Volbu „Přidat ubytování“ má i + v záhlaví dne s popiskem „Přidat ke dni“: otevře tento panel rovnou s otevřeným formulářem.',
  // day-panel
  'help.guide.day-panel.title': 'Otevřít den a zobrazit jeho podrobnosti',
  'help.guide.day-panel.goal':
    'Mějte celý den na očích, včetně počasí, rezervací a místa, kde spíte, aniž byste opustili mapu.',
  'help.guide.day-panel.step.1':
    'Ve sloupci dnů klikněte na záhlaví dne. Den se vybere a jeho podrobnosti se otevřou uprostřed nad mapou.',
  'help.guide.day-panel.step.2': 'V záhlaví je název dne, dokud ho nepojmenujete, tak „Den 1“, a pod ním datum.',
  'help.guide.day-panel.step.3':
    'Nahoře je počasí pro daný den. „Předpověď pro“ uvádí, ke kterému místu se vztahuje: k první zastávce dne, nebo k hotelu, kde jste strávili předchozí noc.',
  'help.guide.day-panel.step.4': '„Rezervace“ pod ním vypisují rezervace na tento den i s časy.',
  'help.guide.day-panel.step.5':
    '„Ubytování“ ukazuje noci rezervované v tomto dni, s „Check-in“ a „Check-out“ ve dnech, kdy proběhnou.',
  'help.guide.day-panel.step.6':
    'Dvojitá šipka v záhlaví sbalí panel do úzkého pruhu. Křížek vedle ní panel zavře a zruší výběr dne.',
  'help.guide.day-panel.result':
    'Když panel sbalíte do lišty, mapa je volná a den zůstane vybraný. Když ho zavřete, výběr dne se zruší a plán zůstane beze změny.',
  'help.guide.day-panel.tip.1': 'Panel sbalíte i kliknutím kamkoli na jeho záhlaví. Šipka je jen jedna z možností.',
  'help.guide.day-panel.tip.2':
    'Když otevřete místo ze sloupce míst nebo z mapy, panel dne se zavře a místo něj se zobrazí podrobnosti místa. Den znovu zobrazíte dalším kliknutím na jeho záhlaví.',
  // day-weather
  'help.guide.day-weather.title': 'Počasí na den',
  'help.guide.day-weather.goal': 'Zjistěte počasí v místě, kde v daný den skutečně budete.',
  'help.guide.day-weather.step.1':
    '„Předpověď pro“ uvádí místo, ke kterému se údaje vztahují: první zastávku dne, nebo u dne bez zastávky hotel, kde strávíte předchozí noc.',
  'help.guide.day-weather.step.2':
    'Velké číslo je teplota dne. Vedle něj je nejnižší a nejvyšší teplota a slovní popis počasí.',
  'help.guide.day-weather.step.3':
    'Štítky vpravo od něj ukazují pravděpodobnost deště, množství srážek, nejsilnější vítr a východ a západ slunce.',
  'help.guide.day-weather.step.4':
    'Dole je přehled dne po hodinách, vždy po dvou hodinách: čas, ikona, teplota a pravděpodobnost deště. Hodiny s pravděpodobností nad 50 procent jsou podbarvené modře.',
  'help.guide.day-weather.result':
    'Karta dne ve sloupci dnů ukazuje počasí také malým písmem pod svým číslem, takže rychle vidíte počasí na celou cestu.',
  'help.guide.day-weather.tip.1':
    'Stupně a vítr se řídí nastavením „Jednotky teploty“ v Nastavení v sekci „Zobrazení“: když zvolíte °F Fahrenheit, stejná předpověď se zobrazí v °F a mph.',
  'help.guide.day-weather.tip.2':
    'Den bez zastávky s polohou a bez hotelu z předchozí noci počasí vůbec neukazuje: předpověď je vždy pro místo, nikdy pro celou cestu.',
  'help.guide.day-weather.tip.3':
    'Na víc než 16 dní dopředu předpověď k dispozici není. Údaje jsou pak průměry z minulých let pro toto datum, označené Ø, a upozorní na to poznámka pod nimi.',
  // rename-day
  'help.guide.rename-day.title': 'Pojmenovat den',
  'help.guide.rename-day.goal': 'Pojmenujte den třeba „Příjezd do Kjóta“ nebo „Den odpočinku“ místo „Den 5“.',
  'help.guide.rename-day.step.1': 'Otevřete den. V jeho záhlaví stojí „Den 5“ a pod tím datum.',
  'help.guide.rename-day.step.2': 'Klikněte na tužku vedle názvu.',
  'help.guide.rename-day.step.3': 'Z názvu se stane textové pole. Napište požadovaný název.',
  'help.guide.rename-day.step.4':
    'Stiskněte Enter, nebo klikněte jinam. Klávesou Escape změnu zrušíte. Název se zobrazí i na kartě dne ve sloupci dnů.',
  'help.guide.rename-day.result': 'Název nahradí „Den 5“ v panelu i na kartě dne ve sloupci dnů; datum se nemění.',
  'help.guide.rename-day.tip.1':
    'Když pole vymažete a uložíte, den se bude zase jmenovat „Den 5“: bez názvu se zobrazuje číslo.',
  'help.guide.rename-day.tip.2':
    'Název patří ke dni, ne k jeho datu. Když dny přeuspořádáte, přesune se název spolu se vším ostatním z toho dne.',
  // add-accommodation
  'help.guide.add-accommodation.title': 'Zarezervovat ke dni nocleh',
  'help.guide.add-accommodation.goal':
    'Přidejte hotel do plánu jednou, i se dny, které pokrývá, s časy a s číslem potvrzení.',
  'help.guide.add-accommodation.step.1':
    'Ubytování musí být nejdřív místem cesty. Vytvořte ho ve sloupci míst jako jakékoli jiné místo: výběr nabízí jen místa, která už existují.',
  'help.guide.add-accommodation.step.2': 'Otevřete den příjezdu a v části „Ubytování“ klikněte na „Přidat ubytování“.',
  'help.guide.add-accommodation.step.3':
    '„Použít na dny“ určuje, které noci pobyt pokrývá: „Začátek“ je den příjezdu, „Do“ den odjezdu a „Vše“ pokrývá celou cestu. Nahoře v dialogu je vidět rozmezí a počet nocí.',
  'help.guide.add-accommodation.step.4':
    'Vyplňte „Check-in“, „Do“ a „Check-out“ a číslo rezervace zadejte do pole „Potvrzení“. Všechna čtyři pole můžete nechat prázdná.',
  'help.guide.add-accommodation.step.5':
    'Vyberte ubytování v části „Vybrat ubytování“. Pole „Kategorie“ nad seznamem ho zúží na jednu kategorii.',
  'help.guide.add-accommodation.step.6': 'Klikněte na „Uložit“.',
  'help.guide.add-accommodation.result':
    'Pobyt se zobrazí v každém dni, který pokrývá, v prvním s příjezdem a v posledním s odjezdem. Ubytování se stane zastávkou v den příjezdu, takže mapa ukazuje trasu k němu, a na kartě „Rezervace“ se objeví rezervace hotelu.',
  'help.guide.add-accommodation.tip.1':
    'Výběr se otevře na dni, ze kterého jste přišli, s check-outem následující den; obojí můžete před uložením změnit.',
  'help.guide.add-accommodation.tip.2':
    'Při vytváření dejte hotelu kategorii Hotel. „Kategorie“ nad seznamem pak jedním kliknutím zobrazí jen vaše hotely.',
  'help.guide.add-accommodation.tip.3':
    'Žádný z časů není povinný: pobyt bez času check-inu a bez kódu přesto pokrývá svoje noci a jeho trasa se i tak vykreslí.',
  // edit-accommodation
  'help.guide.edit-accommodation.title': 'Změna nebo zrušení zarezervované noci',
  'help.guide.edit-accommodation.goal': 'Přesuňte pobyt, opravte jeho časy, nebo ho odeberte z plánu.',
  'help.guide.edit-accommodation.step.1':
    'Karta ukazuje ubytování a jeho adresu, příjezd nebo odjezd ve dnech, kdy nastávají, s časy, číslo potvrzení a v části „Rezervace“ rezervaci, která k němu patří.',
  'help.guide.edit-accommodation.step.2':
    'Tužkou vpravo, „Upravit ubytování“, otevřete pobyt k úpravám. Okno se teď jmenuje „Upravit ubytování“.',
  'help.guide.edit-accommodation.step.3':
    'Opravte „Check-in“, „Do“, „Check-out“ a „Potvrzení“. Upravit tu můžete i dny nad nimi a ubytování pod nimi.',
  'help.guide.edit-accommodation.step.4': 'Klikněte na „Uložit“.',
  'help.guide.edit-accommodation.step.5':
    'Křížek vedle tužky, „Odebrat“, pobyt odstraní. Na potvrzení se neptá a smaže se i rezervace hotelu, která k pobytu patří.',
  'help.guide.edit-accommodation.result':
    'Změna se okamžitě projeví ve všech dnech, které pobyt pokrývá, i v rezervaci hotelu na kartě „Rezervace“.',
  'help.guide.edit-accommodation.tip.1':
    'Noc uprostřed pobytu nemá štítek „Check-in“ ani „Check-out“: mají ho jen první a poslední den rozsahu.',
  'help.guide.edit-accommodation.tip.2':
    'Zrušením pobytu se odebere i zastávka, kterou přidal ke dni příjezdu, a všechny náklady propojené s jeho rezervací. Pokud to byl omyl, rezervujte noc znovu.',
  // day-bookings
  'help.guide.day-bookings.title': 'Rezervace dne v kostce',
  'help.guide.day-bookings.goal':
    'Zjistěte na jednom místě, co už je na tento den zarezervované a jestli je to potvrzené.',
  'help.guide.day-bookings.step.1':
    '„Rezervace“ vypisují rezervace dne: ty s datem tohoto dne a ty připnuté k některé z jeho zastávek. Rezervace připnutá k zastávce v jiném dni se zobrazí jen u této zastávky.',
  'help.guide.day-bookings.step.2':
    'Řádek ukazuje druh rezervace, její název a, pokud patří k zastávce, za ním šedě i tuto zastávku. Časy jsou na pravém konci, před tečkou stavu.',
  'help.guide.day-bookings.step.3':
    'Barva ukazuje stav rezervace: zelená je potvrzená, oranžová čeká na potvrzení a spojení veřejnou dopravou je modré, bez stavu. Hotely v tomto seznamu nejsou, mají vlastní sekci níže.',
  'help.guide.day-bookings.step.4':
    'Kliknutím na řádek otevřete rezervaci. Pilulka v jejím záhlaví ji přepíná mezi „Čeká na potvrzení“ a „Potvrzeno“ a „Upravit“ dole změní zbytek. Nové rezervace se vytvářejí na kartě „Rezervace“, doprava na kartě „Doprava“.',
  'help.guide.day-bookings.result':
    'V tomto seznamu je vše, co má datum v daném dni, i vše, co je propojené s některou z jeho zastávek.',
  'help.guide.day-bookings.tip.1':
    'Rezervace se zobrazí v den svého data. Když datum změníte na kartě „Rezervace“ nebo „Doprava“, rezervace se automaticky přesune do jiného dne.',
  'help.guide.day-bookings.tip.2':
    'Když chybí blok „Rezervace“, nemá den žádné rezervace: blok se skryje, místo aby se zobrazil prázdný.',
  'help.guide.map-lock.title': 'Uzamčení mapy',
  'help.guide.map-lock.goal': 'Zafixujte mapu, zatímco procházíte dny a místa.',
  'help.guide.map-lock.step.1':
    'Zámek je horní ze dvou kulatých tlačítek vlevo dole na mapě; po najetí myší ukáže „Uzamknout zobrazení mapy“. Klikněte na něj. Dokud je zamčený, otevření dne ani výběr místa mapu nepřiblíží ani neposune a tlačítko teď ukazuje „Nechat mapu sledovat výběr“.',
  'help.guide.map-lock.result': 'Mapa zůstane tam, kde jste ji nechali, zatímco procházíte plán.',
  'help.guide.map-lock.tip.1':
    'Dalším kliknutím na zámek, teď s popiskem „Nechat mapu sledovat výběr“, bude mapa zase sledovat, co vyberete. Zámek je jen na počítači; v telefonu mapa výběr sleduje vždy.',

  // ── Screen: trip-map ──────────────────────────────────────────────────────────────────
  'help.ctx.trip-map.title': 'Mapa',
  'help.ctx.trip-map.summary':
    'Střed plánu: všechna místa cesty jako špendlíky, všechny výlety jako linie, trasy mezi nimi a tlačítka po okrajích mapy pro zamknutí pohledu, přepnutí na satelit, zobrazení celé cesty najednou a zobrazení míst v oblasti, na kterou se díváte.',
  'help.ctx.trip-map.bullet.1':
    'Špendlík je místo: zobrazuje vlastní fotku místa, pokud ji má, jinak barvu a ikonu jeho kategorie. Když na špendlík najedete myší, zobrazí se karta s obrázkem, názvem a adresou a také hodnocením a kategorií, pokud je místo má. Přetažením špendlíku na kartu dne místo do tohoto dne naplánujete. Pobyt, jehož rezervace ještě čeká na potvrzení, je zobrazený vybledle s přerušovaným kroužkem.',
  'help.ctx.trip-map.bullet.2':
    'Špendlíky, které jsou příliš blízko sebe, se seskupí do jednoho tmavého kroužku s počtem. Kliknutím na kroužek mapa přiblíží špendlíky v něm. Se zapnutou volbou „Kompaktní značky pro nenaplánovaná místa“ (Nastavení > Zobrazení, část Cestování a mapa) jsou místa, která zatím nejsou v žádném dni, malé tečky bez fotky, takže naplánované zastávky jsou lépe vidět.',
  'help.ctx.trip-map.bullet.3':
    'Kliknutím na špendlík otevřete místo v kartě dole na mapě, s hodnocením, soubory a dalšími akcemi. Kliknutím na prázdnou část mapy kartu zavřete.',
  'help.ctx.trip-map.bullet.4':
    'Když je ve sloupci dnů otevřený den, mají jeho zastávky malý bílý odznak se svým pořadím v tomto dni. Místo, které je ve dni dvakrát, ukazuje obě čísla. Filtry nad seznamem míst („Zobrazit“, kategorie a hvězdička pro minimální hodnocení) filtrují i špendlíky na mapě.',
  'help.ctx.trip-map.bullet.5':
    'Řada ikon nahoře prohledává viditelnou část mapy: „Restaurace“, „Kavárny“, „Bary a noční život“, „Ubytování“, „Památky“, „Muzea a kultura“, „Příroda a parky“ a „Aktivity“. Kategorie přidané pluginem následují za tenkou dělicí čarou. Když je řada širší než mapa, posouváte ji kolečkem myši do strany. „Hledat v této oblasti“ po posunutí mapy spustí hledání znovu.',
  'help.ctx.trip-map.bullet.6':
    'Kliknutím pravým tlačítkem kamkoli na mapu otevřete formulář místa pro tento bod s už dohledanou adresou. Vlevo dole jsou dvě kulatá tlačítka: zámek, „Uzamknout zobrazení mapy“, drží pohled mapy na místě, zatímco proklikáváte dny a místa, a tlačítko pod ním, „Přepnout na satelitní zobrazení“, nahradí kreslenou mapu satelitními snímky.',
  'help.ctx.trip-map.bullet.7':
    '„Zobrazit celou cestu“ vpravo dole vykreslí všechny dny cesty najednou a vypíše, co každý den zahrnuje. Ikona trasy na řádku rezervace vykreslí tuto rezervaci, ikona trasy na liště nad dny vykreslí všechny rezervace. Kliknutím na konec vykreslené rezervace otevřete její podrobnosti.',
  'help.ctx.trip-map.bullet.8':
    'Když je zapnutý doplněk Dawarich, ukáže kulaté tlačítko Dawarich pod „Zobrazit celou cestu“ trasu, kterou váš telefon skutečně zaznamenal. „Zobrazit zaznamenanou trasu“ ji vykreslí čárkovaně pod plánovanou trasou, každý den jinou barvou. Pokud žádná čára není, popisek tlačítka vysvětlí proč.',
  // map-markers
  'help.guide.map-markers.title': 'Jak číst mapu',
  'help.guide.map-markers.goal': 'Zjistěte, co znamenají jednotlivé špendlíky, odznaky a bubliny na mapě.',
  'help.guide.map-markers.step.1':
    'Mapa zobrazuje všechna místa cesty. Kde jsou špendlíky tak blízko u sebe, že je nelze rozlišit, seskupí se do jednoho tmavého kolečka s jejich počtem uvnitř. Po kliknutí na kolečko se mapa na tyto špendlíky přiblíží, nebo je při největším přiblížení rozprostře.',
  'help.guide.map-markers.step.2':
    'Špendlík ukazuje vlastní fotku místa, pokud ji má, jinak barvu a ikonu jeho kategorie. Pobyt, jehož rezervace ještě čeká na potvrzení, je zobrazen vybledle s přerušovaným kroužkem. Když na špendlík najedete myší, otevře se vedle něj karta: stejná fotka ve větším, název a adresa, a pokud je místo má, také hodnocení a kategorie.',
  'help.guide.map-markers.step.3':
    'Klikněte na špendlík a místo se otevře v kartě přes spodní část mapy: nahoře obrázek, název a adresa, pak hvězdičky, popis a soubory, včetně souborů jeho rezervace. Dole jsou akce: „Přidat ke dni“, když je otevřený nějaký den („Odebrat ze dne“, když už v něm místo je), „Navigace“, „Otevřít webové stránky“, „Uložit do sbírky“ („Uloženo“, jakmile je v nějaké sbírce) a vpravo koš a „Upravit“. Kartu zavřete křížkem nahoře nebo kliknutím na prázdnou část mapy.',
  'help.guide.map-markers.step.4':
    'Otevřete den ve sloupci dnů a jeho zastávky dostanou čísla: malý bílý odznak v rohu špendlíku ukazuje pořadí zastávky ve dni. Místo, které se ve dni objeví dvakrát, ukazuje obě svá čísla. Když není otevřený žádný den, čísla se nezobrazují a v rohu je místo nich hodnocení místa, pokud nějaké má.',
  'help.guide.map-markers.step.5':
    'Přetáhněte špendlík z mapy na kartu dne ve sloupci dnů a místo se na ten den naplánuje, stejně jako když přetáhnete jeho řádek ze seznamu míst.',
  'help.guide.map-markers.result':
    'V cestě se nic nezměnilo, mapa ji jen zobrazuje. Každý špendlík ukazuje, o jaké místo jde, ve kterém dni je a v jakém pořadí.',
  'help.guide.map-markers.tip.1':
    'Když ve sloupci dnů sbalíte den, jeho zastávky se na mapě skryjí. Po rozbalení dne se znovu zobrazí.',
  'help.guide.map-markers.tip.2':
    'Filtry nad seznamem míst určují i to, co ukazuje mapa: „Zobrazit“ („Nezařazené“, „Plánováno“), kategorie pod tlačítkem se štítkem a minimální hodnocení pod hvězdičkou snižují počet špendlíků. Filtr země zužuje jen seznam.',
  'help.guide.map-markers.tip.3':
    'Tato mapa nemá tlačítka pro přiblížení: přibližujete kolečkem myši, dvojklikem přiblížíte o jeden stupeň a tažením mapy s ní pohybujete.',
  // map-nearby-places
  'help.guide.map-nearby-places.title': 'Najít místa v okolí na mapě',
  'help.guide.map-nearby-places.goal':
    'Vyhledejte restaurace, památky nebo hotel v části města, kterou ukazuje mapa, a jedno z nich přidejte do cesty.',
  'help.guide.map-nearby-places.step.1':
    'Řada ikon nahoře na mapě slouží k vyhledávání podle kategorií: „Restaurace“, „Kavárny“, „Bary a noční život“, „Ubytování“, „Památky“, „Muzea a kultura“, „Příroda a parky“ a „Aktivity“. Kategorie přidané pluginem následují za tenkým oddělovačem; název zjistíte, když na ikonu najedete myší.',
  'help.guide.map-nearby-places.step.2':
    'Klikněte na kategorii. TREK vyhledá tento druh míst ve viditelné části mapy a ke každému výsledku umístí špendlík v barvě kategorie. Najednou funguje jen jedna kategorie: kliknutím na jinou ji nahradíte a kliknutím na aktivní ji vypnete.',
  'help.guide.map-nearby-places.step.3':
    'Když posunete mapu, objeví se pod řádkem druhé tlačítko: „Hledat v této oblasti“ spustí stejné hledání pro nový výřez. Samotný posun mapy nové hledání nespustí. Počet dotazů tak zůstává nízký.',
  'help.guide.map-nearby-places.step.4':
    'Když na špendlík najedete myší, uvidíte název toho, co hledání našlo. Kliknutím na špendlík otevřete formulář místa s už vyplněnými údaji: název nahoře v dialogu, „Adresa“, „Zeměpisná šířka“ a „Zeměpisná délka“ a také web a telefon, pokud je hledání našlo.',
  'help.guide.map-nearby-places.step.5':
    'Zkontrolujte vyplněné údaje a doplňte, co hledání nemohlo vědět. Pilulka kategorie pod názvem je už nastavená, pokud má cesta odpovídající kategorii, například restauraci pro restauraci; jinak ukazuje „Bez kategorie“, dokud nějakou nevyberete. Přidejte „Popis“ a vlastní poznámky.',
  'help.guide.map-nearby-places.step.6':
    'Klikněte na „Přidat“. Pokud už v cestě je místo se stejným názvem nebo na stejném bodě, TREK vás upozorní a tlačítko se změní na „Přesto přidat“.',
  'help.guide.map-nearby-places.result':
    'Místo je v seznamu míst a na mapě jako jeden z vlastních špendlíků cesty, mezi „Nezařazené“, dokud ho nezařadíte do dne. Špendlíky z hledání zůstanou, dokud kategorii nevypnete.',
  'help.guide.map-nearby-places.tip.1':
    'Řada se nezobrazuje, když je v Nastavení > Zobrazení v části Cestování a mapa vypnuté „Objevovat místa na mapě“.',
  'help.guide.map-nearby-places.tip.2':
    'Výsledky pocházejí z indexu TREK Places a z OpenStreetMap, takže jde o jednu z mála věcí v plánu, která potřebuje připojení.',
  'help.guide.map-nearby-places.tip.3':
    'Hledání zahrne jen oblast na obrazovce, proto si přibližte ulici, která vás zajímá. Hledání v celém městě vrátí jen prvních šedesát výsledků, a to bez jasného pořadí.',
  // map-add-place
  'help.guide.map-add-place.title': 'Vytvořit místo kliknutím pravým tlačítkem do mapy',
  'help.guide.map-add-place.goal': 'Umístěte místo přesně tam, kam chcete, aniž byste ho museli nejdřív hledat.',
  'help.guide.map-add-place.step.1':
    'Klikněte pravým tlačítkem na místo na mapě. Otevře se formulář místa s nadpisem „Přidat místo/aktivitu“.',
  'help.guide.map-add-place.step.2':
    '„Zeměpisná šířka“ a „Zeměpisná délka“ jsou už nastavené na tento bod. TREK souřadnice dohledá a do pole „Adresa“ vyplní, co na nich najde. Pokud najde i název, vyplní ho nahoře v dialogu. Zatím se nic neuložilo, takže opravte, co nesedí.',
  'help.guide.map-add-place.step.3':
    'Do pole nahoře v dialogu napište název, podle kterého místo poznáte. V pilulce pod ním, která ukazuje „Bez kategorie“, dokud nějakou nevyberete, zvolte kategorii. Pak doplňte další údaje pro plán: „Popis“, „Poznámky“, „Webové stránky“.',
  'help.guide.map-add-place.step.4':
    'Klikněte na „Přidat“. Místo se přidá do seznamu jako nezařazené, i když je otevřený nějaký den: pravým kliknutím na mapu určujete polohu, ne den.',
  'help.guide.map-add-place.result': 'Místo je v seznamu i na mapě, v části „Nezařazené“, dokud ho nezařadíte do dne.',
  'help.guide.map-add-place.tip.1':
    'Adresa se dohledává podle souřadnic, takže místo názvu může ukázat ulici a ve volné krajině může zůstat prázdná. Obě pole můžete přepsat.',
  'help.guide.map-add-place.tip.2':
    'Na mapách MapLibre GL a Mapbox GL funguje stejně kliknutí prostředním tlačítkem a na dotykové obrazovce dlouhé podržení.',
  // map-satellite
  'help.guide.map-satellite.title': 'Přepnutí na satelitní mapu',
  'help.guide.map-satellite.goal': 'Přepněte z kreslené mapy na letecké snímky a zpět.',
  'help.guide.map-satellite.step.1':
    'Přepínač podkladové vrstvy je spodní ze dvou kulatých tlačítek vlevo dole na mapě, pod zámkem. Jeho ikona vždy ukazuje vrstvu, na kterou přepne, a popisek to uvádí: „Přepnout na satelitní zobrazení“. Klikněte na něj.',
  'help.guide.map-satellite.step.2':
    'Mapa teď ukazuje letecké snímky. Jsou tak podrobné, že na nich rozeznáte jednotlivé budovy, a nepotřebujete k nim vlastní klíč. Vše, co TREK kreslí, zůstává navrchu: špendlíky, trasa dne, stopy i trasy rezervací.',
  'help.guide.map-satellite.step.3':
    'Tlačítko teď ukazuje „Přepnout na mapové zobrazení“. Kliknutím na něj se vrátíte k mapě.',
  'help.guide.map-satellite.result': 'Mapa se znovu vykreslí a zvolená vrstva se uloží k vašemu účtu.',
  'help.guide.map-satellite.tip.1':
    'Volba se ukládá k vašemu účtu, ne k cestě, takže se každá cesta otevře tak, jak jste ji nechali, ať používáte kterýkoli vykreslovač mapy.',
  'help.guide.map-satellite.tip.2':
    'Satelitní snímky nemají popisky: názvy ulic, čtvrtí a čísla domů jsou jen na kreslené mapě, takže když hledáte adresu, přepněte zpět.',
  // map-whole-trip
  'help.guide.map-whole-trip.title': 'Celá cesta a její vzdálenosti',
  'help.guide.map-whole-trip.goal':
    'Zobrazte místo otevřeného dne všechny cestovní dny a podívejte se, kolik každý den urazíte.',
  'help.guide.map-whole-trip.step.1':
    'Kulaté tlačítko „Zobrazit celou cestu“ je vpravo dole na mapě. Po kliknutí se vykreslí všechny cestovní dny najednou, každý ve vlastní barvě, abyste sousední dny od sebe rozeznali.',
  'help.guide.map-whole-trip.step.2':
    'Karta nad tlačítkem tyto dny vypisuje: barevnou tečku, název dne, ikonu pro každý způsob dopravy toho dne a vzdálenost, kterou den pokrývá. Nahoře je „Celková vzdálenost“.',
  'help.guide.map-whole-trip.step.3':
    'Kliknutím na den v kartě ho vyberete: jeho řádek se podbarví a den se otevře ve sloupci dnů. Kolečkem myši nad městem ho přiblížíte. Dny, které městem procházejí, se zobrazí vedle sebe, každý ve své barvě.',
  'help.guide.map-whole-trip.step.4':
    'Na tlačítku je teď „Skrýt celou cestu“. Kliknutím zase zobrazíte jen otevřený den.',
  'help.guide.map-whole-trip.result':
    'Každý cestovní den má vlastní barvu a karta ukazuje, co který den pokrývá, i celkový součet za cestu.',
  'help.guide.map-whole-trip.tip.1':
    'Celkový součet se počítá postupně po několika úsecích. Dokud je za ním …, jde jen o dílčí součet. Konečný je, jakmile jsou vypočítané všechny úseky.',
  'help.guide.map-whole-trip.tip.2':
    'Pokud plánovač trasy úsek nespočítá, zůstane úsek rovnou čarou a nezapočítá se. Karta vás na to upozorní, aby celkový součet nevypadal bez varování nižší.',
  'help.guide.map-whole-trip.tip.3':
    'Den s méně než dvěma zastávkami se známou polohou a bez jízdy do hotelu nebo z něj nemá žádnou trasu k vykreslení, proto se na kartě vůbec nezobrazí.',
  // map-booking-routes
  'help.guide.map-booking-routes.title': 'Zobrazit trasu rezervace na mapě',
  'help.guide.map-booking-routes.goal': 'Zobrazte na mapě rezervované lety, vlaky a jízdy autem a zase je skryjte.',
  'help.guide.map-booking-routes.step.1':
    'Trasy rezervací jsou vypnuté, dokud nějakou nezapnete. Na pravém konci řádku dopravy ve sloupci dnů je malá ikona trasy: „Zobrazit trasy rezervací“.',
  'help.guide.map-booking-routes.step.2':
    'Klikněte na ni a rezervace se zobrazí na mapě: let jako oblouk po ortodromě, jízda autem po skutečných silnicích, vlak jako řetězec stanic. „Potvrzeno“ se kreslí plnou čarou, „Čeká na potvrzení“ čárkovaně a konce trasy jsou modré pilulky s ikonou dopravy.',
  'help.guide.map-booking-routes.step.3':
    'Klikněte na koncovou pilulku a otevřou se podrobnosti rezervace: stav, typ a dny jako pilulky v barevném záhlaví, časy na obou koncích, další údaje níže a dole „Na mapě“, které tuto trasu zase vypne, „Změnit trasu“ u spojení veřejnou dopravou, koš pro smazání rezervace a „Upravit“. Křížkem v záhlaví podrobnosti zavřete.',
  'help.guide.map-booking-routes.step.4':
    'Ikona trasy na liště nástrojů nad dny funguje pro celou cestu najednou: „Zobrazit všechny trasy rezervací“ zobrazí všechny rezervace, které mají trasu.',
  'help.guide.map-booking-routes.step.5':
    'Tím se přepíšou vaše dřívější volby, takže trasy, které jste zapnuli u jednotlivých rezervací, se resetují. Dalším stisknutím, teď s popiskem „Skrýt všechny trasy rezervací“, všechny trasy rezervací skryjete.',
  'help.guide.map-booking-routes.result':
    'Vybrané rezervace se vykreslí na mapě a volba zůstane pro tuto cestu v tomto prohlížeči, dokud ji nezměníte.',
  'help.guide.map-booking-routes.tip.1':
    'Konce ukazují kód letiště nebo název stanice jen tehdy, když je v Nastavení > Zobrazení v části Cestování a mapa zapnuté „Popisky tras rezervací“; jinak ukazují jen ikonu.',
  'help.guide.map-booking-routes.tip.2':
    'Volba „Vždy zobrazovat trasy rezervací“ ve stejné sekci je zobrazí hned od začátku u každé cesty, kde jste to ještě sami nenastavili.',
  'help.guide.map-booking-routes.tip.3':
    'Aby šlo rezervaci nakreslit, potřebuje začátek a konec se souřadnicemi, takže hotel nebo restaurace ikonu trasy nemá.',
  // map-dawarich-trail
  'help.guide.map-dawarich-trail.title': 'Zobrazení skutečně projeté trasy',
  'help.guide.map-dawarich-trail.goal':
    'Zobrazte na mapě trasu, kterou Dawarich zaznamenal ve vašem telefonu, jako čárkovanou čáru vedle naplánované trasy, a sledujte den po dni, jak cesta doopravdy proběhla.',
  'help.guide.map-dawarich-trail.step.1':
    'Kulaté tlačítko Dawarich je vpravo dole na mapě, pod „Zobrazit celou cestu“. Po najetí myší ukazuje „Zobrazit zaznamenanou trasu“. Klikněte na něj. TREK si od vašeho Dawarich vyžádá data za termín cesty a kolem tlačítka se točí kroužek, dokud čeká na odpověď.',
  'help.guide.map-dawarich-trail.step.2':
    'Zaznamenaná trasa se zobrazí jako čárkovaná čára, každý den jinou barvou, pod plánovanou trasou, aby plán zůstal čitelný. Tlačítko teď ukazuje „Skrýt zaznamenanou trasu“. Každý den končí o místní půlnoci. Když ve sloupci dnů sbalíte den, jeho čárkovaná čára i zastávky se na mapě skryjí.',
  'help.guide.map-dawarich-trail.step.3':
    'Klikněte také na „Zobrazit celou cestu“ a každý naplánovaný den se vykreslí plnou čarou vedle čárkovaného záznamu. Kde se obě čáry kryjí, proběhl den podle plánu. Kde se čárkovaná čára od plánované trasy odchyluje, podle plánu neproběhl.',
  'help.guide.map-dawarich-trail.result':
    'Co jste naplánovali a co jste opravdu absolvovali, uvidíte na mapě společně jako čárkované a plné čáry. Karta nad tlačítky dál uvádí plánované dny a jejich vzdálenosti.',
  'help.guide.map-dawarich-trail.tip.1':
    'Zapnutí či vypnutí se ukládá pro každou cestu ve vašem účtu, takže platí v každém prohlížeči i na každém zařízení. Dokud je trasa zapnutá, TREK se Dawarichu ptá znovu každé dvě minuty, takže probíhající cesta se aktualizuje bez obnovení stránky. Samotná trasa se nikdy neukládá, takže není v databázi TREKu, v zálohách ani k dispozici offline.',
  'help.guide.map-dawarich-trail.tip.2':
    'Popisek tlačítka vysvětlí, proč je mapa prázdná: „Načítá se zaznamenaná trasa…“ během načítání, „V těchto dnech nebylo nic zaznamenáno“, „Zaznamenanou trasu se nepodařilo načíst“, nebo „Zaznamenaná trasa vyžaduje připojení“, když je TREK offline.',
  // map-compass
  'help.guide.map-compass.title': 'Otočení mapy a návrat k severu',
  'help.guide.map-compass.goal': 'Natočte mapu ve směru, kterým jdete, a jedním kliknutím ji vraťte k severu.',
  'help.guide.map-compass.step.1':
    'Mapu otočíte tažením pravým tlačítkem myši, nebo tažením levým tlačítkem s podrženou klávesou Ctrl; na dotykové obrazovce otáčejte dvěma prsty. Kulatý kompas vedle řady ikon kategorií nahoře na mapě se otáčí s ní: jeho šipka vždy ukazuje na sever, takže se natočí o stejný úhel jako mapa.',
  'help.guide.map-compass.step.2':
    'Klikněte na kompas. Tlačítko „Reset north“ otočí mapu zpět tak, aby byl sever nahoře, vrátí plochý pohled a šipka zase míří nahoru.',
  'help.guide.map-compass.result':
    'Mapa je opět natočená k severu a rovně. Na cestě se nic nezměnilo: kompas mění jen pohled.',
  'help.guide.map-compass.tip.1':
    'Kompas mají jen mapy MapLibre GL a Mapbox GL; mapu Leaflet nelze otáčet, takže kompas nemá. Kterou mapu používáte, určuje „Poskytovatel mapy“ v Nastavení v části „Mapa“ a volbu uložíte tlačítkem „Uložit nastavení mapy“.',
  'help.guide.map-compass.tip.2':
    'Kliknutím se zruší i náklon. Pohled nakloníte tažením nahoru nebo dolů pravým tlačítkem myši a „Reset north“ ho vyrovná a zruší otočení. U Mapbox GL se zapnutou volbou „3D budovy a terén“ se tím zploští i 3D pohled, dokud ho znovu nenakloníte.',

  // ── Screen: trip-collab ───────────────────────────────────────────────────────────────
  'help.ctx.trip-collab.title': 'Spolupráce',
  'help.ctx.trip-collab.summary':
    'Karta, na které skupina plánuje společně, má pět částí: chat vlevo, „Poznámky“ a „Odkazy“ vedle něj, „Ankety“ a „Co následuje“ pod nimi. Vše, co sem napíšete, se okamžitě zobrazí všem ostatním členům, bez nutnosti znovu načítat stránku.',
  'help.ctx.trip-collab.bullet.1':
    'Chat je karta vlevo. Pište do pole „Napište zprávu...“ a stiskněte Enter, Shift+Enter vloží nový řádek. Smajlík přidá emoji a „Připojit obrázky“ přidá ke zprávě až čtyři obrázky.',
  'help.ctx.trip-collab.bullet.2':
    'Po najetí myší na zprávu se zobrazí „Odpovědět“ a u vlastních zpráv i „Smazat“; kliknutím pravým tlačítkem otevřete osm rychlých reakcí. Smazanou zprávu nahradí poznámka, kdo ji smazal.',
  'help.ctx.trip-collab.bullet.3':
    '„Poznámky“ jsou společný prostor pro poznámky: „Nová poznámka“ v záhlaví vytvoří poznámku a ozubené kolo vedle otevře „Spravovat kategorie“ pro jejich názvy a barvy. Jakmile existují kategorie, filtruje karty řada pilulek pod záhlavím: „Vše“, nebo jedna kategorie. Karta poznámky ukazuje kategorii jako barevnou tečku a odkaz jako kulaté tlačítko a její tři tečky („Další možnosti“) obsahují „Rozbalit“, „Připnout“, „Upravit“ a „Smazat“.',
  'help.ctx.trip-collab.bullet.4':
    '„Odkazy“ shromažďují webové adresy k cestě. „Přidat odkaz“ potřebuje název a adresu http nebo https. „Upravit odkaz“, „Připnout odkaz“ a „Smazat odkaz“ jsou na konci štítku a připnuté odkazy zůstávají na začátku.',
  'help.ctx.trip-collab.bullet.5':
    'Rozhodujte pomocí anket. „Nové hlasování“ položí otázku s alespoň dvěma možnostmi. Kliknutím na možnost pro ni hlasujete. Zámek („Uzavřít“) a koš („Smazat“) vpravo v záhlaví ankety hlasování ukončí, nebo anketu odstraní.',
  'help.ctx.trip-collab.bullet.6':
    '„Co následuje“ vypisuje zastávky cesty, které vás ještě čekají, nejvýše osm, s časy a lidmi, kteří se jich účastní. Jen čte denní plán; časy se nastavují tam.',
  // write-note
  'help.guide.write-note.title': 'Psaní sdílené poznámky',
  'help.guide.write-note.goal':
    'Dejte to, co potřebuje celá skupina, třeba pravidlo, adresu nebo připomínku, tam, kde to všichni najdou.',
  'help.guide.write-note.step.1':
    'Klikněte v záhlaví karty „Poznámky“ na „Nová poznámka“. Otevře se dialog poznámky s kurzorem už v poli pro název.',
  'help.guide.write-note.step.2':
    'Název napište nahoru do dialogu, kde stojí „Poznámka...“. Je to jediné povinné pole: „Vytvořit“ zůstane zašedlé, dokud název nevyplníte, a stisknutím Enter v názvu poznámku rovnou vytvoříte.',
  'help.guide.write-note.step.3':
    '„Obsah“ obsahuje text a podporuje Markdown: tučné slovo, seznam, nadpis. Karta zobrazí první tři řádky a „Rozbalit“ v její nabídce otevře celou poznámku.',
  'help.guide.write-note.step.4':
    'V části „Kategorie“ vyberte, kam poznámka patří. Její barvou se teď obarví záhlaví dialogu a později záhlaví karty. První kategorie je už předvybraná. Pilulky jsou existující kategorie, novou vytvoříte ve „Spravovat kategorie“. Dokud cesta nemá žádné kategorie, tento řádek se nezobrazuje.',
  'help.guide.write-note.step.5':
    'Do pole „Webové stránky“ vložte odkaz, který k poznámce patří. Na kartě se pak nahoře objeví kulaté tlačítko, které odkaz otevře.',
  'help.guide.write-note.step.6':
    'Klikněte na „Vytvořit“. Dialog zavře jen „Zrušit“ a jeho křížek, takže o napsaný text nepřijdete kliknutím mimo dialog ani klávesou Esc.',
  'help.guide.write-note.result':
    'Poznámka je kartou v panelu „Poznámky“, s horní částí v barvě kategorie, a všichni ostatní členové ji okamžitě vidí.',
  'help.guide.write-note.tip.1':
    'Tři tečky na kartě („Další možnosti“) nabízejí „Rozbalit“, „Připnout“, „Upravit“ a „Smazat“. „Připnout“ podrží poznámku nahoře v panelu s rámečkem v její barvě. Ostatní poznámky jsou seřazené podle poslední změny.',
  'help.guide.write-note.tip.2':
    'Ozubené kolečko vedle „Nová poznámka“ otevře „Spravovat kategorie“. Tam můžete kategorii přiřadit barvu, přejmenovat ji najednou všude, nebo ji přidat dřív, než ji nějaká poznámka použije. Nic se nezmění, dokud nekliknete na „Uložit“.',
  'help.guide.write-note.tip.3':
    '„Přiložit soubory“ přidá k poznámce dokument, pokud smíte do cesty nahrávat soubory. „Připojit“ otevře výběr souborů; obrázek nebo PDF můžete do dialogu také vložit.',
  'help.guide.write-note.tip.4':
    '„Poznámky“ mají vlastní přepínač v části „Doplňky“ pod „Spolupráce“: správce je může vypnout a chat, odkazy, hlasování i „Co následuje“ nechat zapnuté.',
  // shared-links
  'help.guide.shared-links.title': 'Sběr odkazů k cestě',
  'help.guide.shared-links.goal':
    'Mějte rezervační portál, sdílené album a jízdní řád na jednom místě, ať je nemusíte hledat v chatu.',
  'help.guide.shared-links.step.1':
    'V záhlaví karty „Odkazy“ klikněte na „Přidat odkaz“. Otevře se dialog s kurzorem v poli nahoře.',
  'help.guide.shared-links.step.2':
    'Do pole „Název odkazu“ napište název, do pole pod ním vložte adresu a klikněte na „Uložit odkaz“.',
  'help.guide.shared-links.step.3':
    'Štítek ukazuje název a web, na který odkazuje. Kliknutím otevřete stránku na nové kartě.',
  'help.guide.shared-links.step.4':
    'Tři kulatá tlačítka na jeho konci jsou „Upravit odkaz“, „Připnout odkaz“ a „Smazat odkaz“. „Připnout odkaz“ přesune štítek na začátek panelu a zobrazí ho v barvě akcentu. „Smazat odkaz“ si nejdřív vyžádá potvrzení, protože odkaz zmizí všem členům.',
  'help.guide.shared-links.result':
    'Odkaz se zobrazí jako štítek v panelu „Odkazy“, připnutý na začátek, a hned se objeví na obrazovce každého člena.',
  'help.guide.shared-links.tip.1':
    'Přijímá se jen adresa http nebo https. Cokoli jiného se odmítne a dialog zůstane otevřený s tím, co jste napsali.',
  'help.guide.shared-links.tip.2':
    'Nejdřív jsou připnuté odkazy, pak nejnovější. Malá ikona vedle názvu je favicona webu načtená přímo z něj, takže bez internetu se místo ní zobrazí obyčejná ikona odkazu.',
  'help.guide.shared-links.tip.3':
    '„Odkazy“ mají v části „Doplňky“ vlastní přepínač pod „Spolupráce“, takže správce může panel vypnout, aniž by sahal na zbytek karty.',
  // create-poll
  'help.guide.create-poll.title': 'Hlasování ve skupině',
  'help.guide.create-poll.goal':
    'Když na otázku v chatu nikdo neodpovídá, udělejte z ní anketu, ve které může hlasovat každý.',
  'help.guide.create-poll.step.1': 'Klikněte v záhlaví karty „Ankety“ na „Nové hlasování“. Otevře se dialog.',
  'help.guide.create-poll.step.2':
    'Otázku napište do pole „Otázka“. „Podporuje Markdown“ pod polem znamená, že tu funguje tučné písmo, zalomení řádku nebo krátký seznam.',
  'help.guide.create-poll.step.3':
    'V části „Možnosti“ vyplňte „Možnost 1“ a „Možnost 2“. Potřebujete aspoň dvě neprázdné možnosti a jedna možnost může mít víc řádků.',
  'help.guide.create-poll.step.4':
    '„Přidat možnost“ pod nimi přidá třetí, čtvrtou a tolik dalších, kolik potřebujete. Malým křížkem vedle řádku, který se objeví, jakmile máte víc než dvě možnosti, danou možnost odeberete.',
  'help.guide.create-poll.step.5':
    '„Více možností“ umožní každému zaškrtnout víc než jednu možnost. Pokud je vypnuté, přesune se hlas na novou možnost, jakmile ji dotyčný vybere.',
  'help.guide.create-poll.step.6': 'Klikněte na „Vytvořit hlasování“.',
  'help.guide.create-poll.result': 'Anketa se zobrazí nahoře v panelu „Ankety“, otevřená a s 0 hlasy v záhlaví.',
  'help.guide.create-poll.tip.1': 'Otázka se vykresluje jako Markdown, možnosti zůstávají prostým textem.',
  'help.guide.create-poll.tip.2': '„Vytvořit hlasování“ zůstane zašedlé, dokud nevyplníte otázku a aspoň dvě možnosti.',
  'help.guide.create-poll.tip.3':
    'Termín ukončení lze nastavit jen v telefonní aplikaci. Hlasování s termínem ukazuje zbývající čas v jantarovém štítku v záhlaví a po vypršení času se uzavře.',
  'help.guide.create-poll.tip.4':
    'Ankety mají vlastní přepínač „Ankety“ v sekci „Doplňky“, pod „Spolupráce“: správce je může vypnout a ostatní čtyři panely nechat zapnuté.',
  // vote-poll
  'help.guide.vote-poll.title': 'Hlasování a výsledky',
  'help.guide.vote-poll.goal': 'Hlasujte, podívejte se na výsledky skupiny a případně svůj hlas změňte.',
  'help.guide.vote-poll.step.1':
    'Klikněte na možnost, kterou chcete. V jejím kolečku se objeví zaškrtnutí, možnost dostane rámeček v barvě zvýraznění a pruh za ní se prodlouží.',
  'help.guide.vote-poll.step.2':
    'Teď vidíte celý výsledek: pruh ukazuje podíl, vpravo je procento a malá kolečka jsou lidé, kteří tuto možnost vybrali, nejvýše tři.',
  'help.guide.vote-poll.step.3':
    'Rozmysleli jste si to? Klikněte na jinou možnost. U hlasování bez „Více možností“ se váš hlas přesune na novou možnost, místo aby přibyl druhý.',
  'help.guide.vote-poll.step.4':
    'Počet hlasů se zobrazuje ve štítku pod otázkou. Kliknutím na možnost, kterou jste už zvolili, svůj hlas odeberete a počet klesne.',
  'help.guide.vote-poll.result':
    'Vaše možnost je zaškrtnutá, pruhy ukazují, jak skupina hlasovala, a kolečka, kdo co vybral.',
  'help.guide.vote-poll.tip.1':
    'Procenta a to, kdo hlasoval pro co, se zobrazí až po vašem hlasování, nebo po uzavření hlasování. Počet hlasů v záhlaví vidí všichni.',
  'help.guide.vote-poll.tip.2':
    'Hlasování nikdy není anonymní: když najedete myší na některý z kroužků u možnosti, uvidíte jméno toho, kdo hlasoval.',
  // close-poll
  'help.guide.close-poll.title': 'Uzavřít nebo odstranit anketu',
  'help.guide.close-poll.goal':
    'Ukončete hlasování, jakmile se skupina rozhodne, a smažte anketu, kterou už nikdo nepotřebuje.',
  'help.guide.close-poll.step.1':
    '„Uzavřít“, zámek vpravo v záhlaví hlasování, ukončí hlasování. Na možnosti pak už nejde kliknout.',
  'help.guide.close-poll.step.2':
    'Uzavřené hlasování se přesune na konec panelu, pod nadpis „Uzavřeno“, pokud jsou nad ním otevřená hlasování. Má čip „Uzavřeno“ a ukazuje výsledek všem, ať hlasovali, nebo ne. Vítězná možnost je tučně na zeleném pruhu; pokud jste ji vybrali vy, má pruh místo toho vaši barvu zvýraznění.',
  'help.guide.close-poll.step.3':
    '„Smazat“, koš vpravo v záhlaví, hlasování smaže. U uzavřeného hlasování je to jediné tlačítko, protože zámek už tam není. Žádné potvrzení se nezobrazí a smažou se i hlasy.',
  'help.guide.close-poll.result':
    'Smazaná anketa zmizí z panelu všem členům. Anketa, kterou jste jen uzavřeli, zůstane vidět dole i s výsledkem.',
  'help.guide.close-poll.tip.1':
    'Uzavření nelze vrátit: znovu otevřít hlasování nejde. Omylem uzavřené hlasování je potřeba založit znovu.',
  'help.guide.close-poll.tip.2': '„Smazat“ odstraní hlasování i všechny hlasy, a to všem, okamžitě a bez potvrzení.',
  // whats-next
  'help.guide.whats-next.title': 'Jak číst „Co následuje“',
  'help.guide.whats-next.goal': 'Podívejte se, co skupinu čeká dál, aniž byste otevírali plán.',
  'help.guide.whats-next.step.1':
    'Karta ukazuje nadcházející zastávky cesty, nejvýš osm, seřazené podle času, pod nadpisem pro každý den: „Dnes“, „Zítra“ nebo datum, a vedle název dne, pokud nějaký má. V záhlaví je jejich počet.',
  'help.guide.whats-next.step.2':
    'Vlevo u každé zastávky je její čas: začátek, „do“ a konec, pokud ho zastávka má, nebo TBD, když ještě žádný čas nastavený není.',
  'help.guide.whats-next.step.3':
    'Vedle je název, adresa a jako štítky lidé na této zastávce. Pokud k zastávce nikdo přiřazený není, zobrazí se všichni účastníci cesty.',
  'help.guide.whats-next.result': 'Seznam toho, co vás čeká, jen ke čtení: řídí se plánem a nic tady ho nemění.',
  'help.guide.whats-next.tip.1':
    'Tady nic nenastavujete. Časy pocházejí z denního plánu; když je tam změníte, tento seznam se okamžitě aktualizuje.',
  'help.guide.whats-next.tip.2':
    'Zobrazuje se jen to, co vás ještě čeká: zastávka zmizí, jakmile uplyne její čas začátku, dnešní zastávka bez času zůstane do konce dne a na konci cesty je panel prázdný.',
  'help.guide.whats-next.tip.3':
    '„Co následuje“ má vlastní přepínač v části „Doplňky“, pod „Spolupráce“. Je to panel pro počítač: karta „Spolupráce“ v mobilní aplikaci ho nezobrazuje.',
  // trip-chat
  'help.guide.trip-chat.title': 'Psát si se skupinou',
  'help.guide.trip-chat.goal':
    'Pošlete zprávu, odpovězte na konkrétní zprávu, zareagujte na jinou a smažte vlastní zprávu.',
  'help.guide.trip-chat.step.1':
    'Pište do pole „Napište zprávu...“ a stiskněte Enter. Kulatá šipka vedle pole udělá totéž. Shift a Enter místo toho vloží nový řádek.',
  'help.guide.trip-chat.step.2':
    'Smajlík otevře výběr emoji se skupinami „Smileys“, „Reactions“ a „Travel“. Vybrané emoji se vloží do rozepsaného textu, samo se neodešle.',
  'help.guide.trip-chat.step.3':
    'Najeďte myší na zprávu někoho jiného: v jejím rohu se objeví malé kulaté tlačítko. To je „Odpovědět“.',
  'help.guide.trip-chat.step.4':
    'Zpráva, na kterou odpovídáte, je citovaná nad polem. Napište a odešlete zprávu a citace se odešle s ní. Křížkem na citaci ji odstraníte.',
  'help.guide.trip-chat.step.5':
    'Kliknutím pravým tlačítkem na zprávu zobrazíte osm rychlých reakcí. Vaše reakce se objeví pod zprávou. Opětovným kliknutím na stejnou reakci ji odeberete.',
  'help.guide.trip-chat.step.6':
    'U vlastních zpráv je vedle „Odpovědět“ i „Smazat“, ikona koše. Zpráva se smaže hned a zůstane po ní poznámka, že jste ji smazali. Nejde to vrátit zpět.',
  'help.guide.trip-chat.result':
    'Vaše odpověď je nejnovější zpráva a citovaná zpráva je zobrazená v její horní části. Vaše reakce se objeví pod druhou zprávou. Místo smazané zprávy je poznámka, že jste ji smazali.',
  'help.guide.trip-chat.tip.1':
    'Enter zprávu odešle, Shift a Enter vloží nový řádek. Zpráva jen s jedním až třemi emoji se zobrazí velká.',
  'help.guide.trip-chat.tip.2':
    'Přes „Připojit obrázky“ přidáte k jedné zprávě až čtyři obrázky. Můžete je také vložit ze schránky nebo přetáhnout do pole.',
  'help.guide.trip-chat.tip.3':
    'Zpráva s odkazem dostane pod sebe kartu s náhledem, kterou načte váš vlastní TREK, takže odkaz na něco, k čemu máte přístup jen vy, zůstane obyčejným odkazem.',
  'help.guide.trip-chat.tip.4':
    'Chat má vlastní přepínač v části „Doplňky“ pod „Spolupráce“: správce ho může vypnout a ponechat zapnuté poznámky, odkazy, hlasování a „Co následuje“.',

  // ── Screen: trip-lists ────────────────────────────────────────────────────────────────
  'help.ctx.trip-lists.title': 'Seznamy',
  'help.ctx.trip-lists.summary':
    'Dva seznamy pro jednu cestu: seznam věcí na balení, kde je vidět, kdo co veze a kolik to váží, a seznam úkolů se vším, co je potřeba zařídit před cestou a během ní. Karta se zobrazuje, dokud je zapnutý doplněk „Seznamy“.',
  'help.ctx.trip-lists.bullet.1':
    '„Seznam věcí“ a „Úkoly“ na liště nahoře přepínají mezi oběma částmi a ukazují počet položek v každé; tlačítka na pravém konci lišty patří k té, která je právě otevřená.',
  'help.ctx.trip-lists.bullet.2':
    'Seznam věcí je rozdělený do seznamů, například Dokumenty nebo Oblečení, pojmenovaných podle vás. Každý seznam je karta. V jejím záhlaví je úchyt, kterým celý seznam přetáhnete jinam, barevná tečka, odznak se zabalenými položkami z celkového počtu, tři tečky s volbami „Přejmenovat“, „Označit vše“, „Odznačit vše“ a „Smazat seznam“ a šipka, která kartu sbalí. „Přidat seznam“ na liště nad nimi vytvoří nový.',
  'help.ctx.trip-lists.bullet.3':
    'Řádek obsahuje úchyt, zaškrtávací pole a název a za nimi malý avatar osoby, která věc přiveze. Položka s množstvím větším než jedna má navíc počítadlo zabalených kusů, například 3/10, s minusem a plusem. Pak následuje množství jako malý odznak, a pokud je zapnuté „Sledování zavazadel“, také hmotnost v gramech a kroužek tašky, dále koš a nabídka tří teček s volbami „Přesunout do seznamu“, „Sdílení“, „Přejmenovat“ a „Smazat“. Ovládací prvky, které řádek nepoužívá, jsou ztlumené, dokud na ně nenajedete myší.',
  'help.ctx.trip-lists.bullet.4':
    '„Sdílené“ a „Můj seznam“ rozdělují seznam věcí na dvě části: seznam, který vidí všichni, a váš vlastní. „Vše“, „Nezabalené“ a „Hotovo“ vedle nich zužují ten, který je právě otevřený. „A až Z“ na konci řádku seřadí položky každého seznamu podle názvu a dalším kliknutím se vrátíte k vlastnímu pořadí. Karta průběhu nahoře počítá, co je zabalené.',
  'help.ctx.trip-lists.bullet.5':
    '„Použít šablonu“ a „Uložit jako šablonu“ seznam naplní nebo uloží, takže ho nemusíte psát. Dvě ikony za nimi, „Exportovat“ a „Importovat“, seznam vyexportují pro tisk, jako PDF nebo soubor a seznam importují. Červené tlačítko na pravém konci karty průběhu ukazuje počet zaškrtnutých položek a odstraní je.',
  'help.ctx.trip-lists.bullet.6':
    '„Úkoly“ mají vlastní postranní panel: kartu s postupem, filtry „Vše“, „Moje úkoly“, „Po termínu“ a „Hotovo“, jeden řádek pro každý seznam a pod nimi „Přidat seznam“. Úkoly jsou v kartě, jejíž záhlaví ukazuje název filtru a řazení: „Priorita“ nebo „Termín splnění“. Kliknutím na úkol ho otevřete v panelu vpravo. „Přidat nový úkol“ na liště otevře dialog „Nový úkol“.',
  // packing-categories
  'help.guide.packing-categories.title': 'Sestavit seznam věcí',
  'help.guide.packing-categories.goal':
    'Rozdělte věci, které si berete, do seznamů, přidejte do nich položky a určete, kdo má který seznam na starosti.',
  'help.guide.packing-categories.step.1':
    'V liště nad seznamy klikněte na „Přidat seznam“. Otevře se malý dialog. Do jeho horního pruhu, kde je „Název seznamu (např. Oblečení)“, napište název a klikněte na „Přidat“.',
  'help.guide.packing-categories.step.2':
    'Nový seznam začíná zástupným řádkem, na kterém jsou jen tři slabé tečky. Klikněte dole na „Přidat položku“, napište položku do pole „Název položky...“ a stiskněte Enter: první položka nahradí zástupný řádek a pole zůstane otevřené pro další.',
  'help.guide.packing-categories.step.3':
    'Řádek přejmenujete kliknutím na jeho název, nebo přes „Přejmenovat“ ve třech tečkách na jeho pravém konci.',
  'help.guide.packing-categories.step.4':
    'Čárkovaný kroužek s postavou v horním pruhu seznamu přiřadí k seznamu členy cesty. Vyberte jméno. Pokud chcete osobu zase odebrat, klikněte na čip, který se objeví.',
  'help.guide.packing-categories.step.5':
    'Tři tečky vedle počtu otevřou další možnosti: „Přejmenovat“, „Označit vše“, „Odznačit vše“ a „Smazat seznam“. „Smazat seznam“ smaže seznam i všechny jeho položky bez dalšího dotazu. Šipka úplně vpravo seznam sbalí.',
  'help.guide.packing-categories.result':
    'Nový seznam se objeví v mřížce s položkami pod sebou a barevnou tečkou. Jeho odznak ukazuje, kolik je už zabaleno.',
  'help.guide.packing-categories.tip.1':
    'Seznam existuje jen díky svým položkám. Když smažete poslední položku, řádek se změní na zástupný, aby si seznam zachoval pozici i barvu; když smažete i tento řádek, seznam se smaže.',
  'help.guide.packing-categories.tip.2':
    'Když někoho přiřadíte k seznamu, dostane oznámení o balení. Na tom, kdo položky vidí, to nic nemění. To nastavíte v části „Sdílení“ v nabídce pod třemi tečkami u řádku.',
  'help.guide.packing-categories.tip.3':
    'Dva seznamy mohou mít stejný název. TREK je interně rozlišuje, takže názvy zůstanou přesně tak, jak jste je napsali.',
  // check-off-packing
  'help.guide.check-off-packing.title': 'Odškrtávání při balení',
  'help.guide.check-off-packing.goal':
    'Označujte, co už je v tašce, sledujte ukazatel průběhu a odstraňte zabalené položky.',
  'help.guide.check-off-packing.step.1':
    'Klikněte na políčko vlevo na řádku. Název se přeškrtne a ukazatel postupu se aktualizuje.',
  'help.guide.check-off-packing.step.2':
    'Karta průběhu nad seznamy ukazuje, kolik položek je zabaleno ze všech položek na seznamu, jako číslo, procento i pruh.',
  'help.guide.check-off-packing.step.3':
    'Celý seznam odškrtnete najednou přes tři tečky v jeho záhlaví: najdete tam „Označit vše“ a „Odznačit vše“.',
  'help.guide.check-off-packing.step.4':
    '„Vše“, „K zabalení“ a „Hotovo“ vedle „Sdílené“ a „Můj seznam“ filtrují mřížku. „K zabalení“ ukáže jen to, co ještě chybí, takže úplně zabalený seznam se skryje.',
  'help.guide.check-off-packing.step.5':
    'Červené tlačítko „Odebrat … zaškrtnuté“ na pravém konci karty průběhu, s počtem zaškrtnutých položek, je po jednom potvrzení v prohlížeči smaže všechny najednou.',
  'help.guide.check-off-packing.result':
    'Zobrazují se jen nezabalené položky a pruh nahoře ukazuje, kolik už máte sbaleno.',
  'help.guide.check-off-packing.tip.1': 'Odškrtnutou položku můžete i tak přejmenovat: klikněte na její název.',
  'help.guide.check-off-packing.tip.2':
    '„Označit vše“ a „Odznačit vše“ fungují vždy pro jeden seznam, z jeho vlastních tří teček.',
  'help.guide.check-off-packing.tip.3':
    'Když jsou zaškrtnuté všechny položky, počítadlo nahradí text „Vše je zabaleno!“ a ukazatel zezelená.',
  // apply-packing-template
  'help.guide.apply-packing-template.title': 'Použít šablonu seznamu',
  'help.guide.apply-packing-template.goal':
    'Přidejte do cesty hotový seznam a uložte si seznam této cesty pro příští cestu.',
  'help.guide.apply-packing-template.step.1': 'V liště nad seznamem klikněte na „Použít šablonu“.',
  'help.guide.apply-packing-template.step.2': 'Vyberte šablonu. U každé je vidět název a počet položek.',
  'help.guide.apply-packing-template.step.3':
    'Položky se přidají do zobrazení, ve kterém jste: „Sdílené“ je přidá do společného seznamu, který vidí všichni, „Můj seznam“ do vašeho vlastního.',
  'help.guide.apply-packing-template.step.4':
    'Pokud si chcete seznam této cesty uložit pro další cestu, klikněte na „Uložit jako šablonu“. Otevře se malý dialog. Do pole nahoře, kde je „Název šablony“, napište název a klikněte na „Uložit“.',
  'help.guide.apply-packing-template.result':
    'Seznamy a položky ze šablony se přidají do cesty vedle toho, co v ní už bylo.',
  'help.guide.apply-packing-template.tip.1':
    'Šablona zkopíruje u každé položky seznam, množství, hmotnost a tašku a vytvoří tašku, kterou cesta ještě nemá. Zaškrtnutí se nekopírují a nic, co už na seznamu je, se neodebere.',
  'help.guide.apply-packing-template.tip.2':
    '„Použít šablonu“ je k dispozici, až když existuje nějaká šablona. Bez ní se tlačítko vůbec nezobrazí.',
  'help.guide.apply-packing-template.tip.3':
    '„Uložit jako šablonu“ vidí jen správce instance, a to jen tehdy, když seznam obsahuje položky. Uloží sdílené položky a vaše vlastní, nikdy soukromé položky jiného člena.',
  // import-packing-list
  'help.guide.import-packing-list.title': 'Vložení celého seznamu věcí',
  'help.guide.import-packing-list.goal': 'Převeďte seznam, který už máte jinde, najednou na položky k zabalení.',
  'help.guide.import-packing-list.step.1':
    'Klikněte na „Importovat“, ikonu se šipkou dolů na pravém konci lišty nad seznamem.',
  'help.guide.import-packing-list.step.2':
    'Jedna položka na řádek: Kategorie, Název, Hmotnost v g (volitelné), Taška (volitelné), checked/unchecked (volitelné). Šedá ukázka v poli předvádí všechny čtyři formáty a čísla u levého okraje počítají napsané řádky. Funguje i seznam v Markdownu: nadpis pojmenuje seznam a z "- [ ]" a "- [x]" se stanou položky.',
  'help.guide.import-packing-list.step.3':
    'Řádky můžete také načíst ze souboru tlačítkem „Načíst CSV/TXT/MD“ vlevo dole v dialogu. Přijme soubor .csv, .txt nebo .md a jeho obsah nahradí vše, co je v poli.',
  'help.guide.import-packing-list.step.4':
    'Klikněte vpravo dole na „Importovat 3“. Číslo na tlačítku udává, kolik řádků TREK rozpoznal.',
  'help.guide.import-packing-list.result':
    'Z každého řádku vznikne položka v seznamu, jehož název je v prvním poli. Položky, které už tam byly, se nezmění.',
  'help.guide.import-packing-list.tip.1':
    'Pole oddělují čárky, středníky i tabulátory a dvojité uvozovky drží pole pohromadě, takže "Košile, modrá" zůstane jedním názvem. Řádek s jedinou hodnotou je jen název. Řádek bez vlastního seznamu se zařadí do „Ostatní“. "3x" před názvem nastaví počet kusů.',
  'help.guide.import-packing-list.tip.2':
    'Pokud cesta ještě nemá tašku uvedenou ve čtvrtém poli, TREK ji vytvoří. „Importovat“ a „Použít šablonu“ jsou dva způsoby, jak přidat hmotnosti a tašky mnoha položkám najednou.',
  // export-packing-list
  'help.guide.export-packing-list.title': 'Tisk a export seznamu věcí',
  'help.guide.export-packing-list.goal':
    'Vytiskněte seznam, uložte ho jako PDF, nebo ho vyexportujte jako soubor pro jinou aplikaci či další cestu.',
  'help.guide.export-packing-list.step.1':
    'Klikněte na „Exportovat“, ikonu se šipkou nahoru na liště nad seznamem, hned před „Importovat“.',
  'help.guide.export-packing-list.step.2':
    '„Kontrolní seznam v Markdownu (.md)“ a „CSV pro import (.csv)“ seznam rovnou uloží jako soubor.',
  'help.guide.export-packing-list.step.3':
    'Klikněte na „Vytisknout nebo uložit jako PDF“. Náhled zobrazí seznam jako stránku: nahoře cestu, její termín a kolik je zabaleno, pod tím každý seznam jako kartu a u každé položky políčko k zaškrtnutí.',
  'help.guide.export-packing-list.step.4':
    'Pod náhledem klikněte na „Vytisknout nebo uložit jako PDF“. Prohlížeč otevře dialog tisku: vyberte tiskárnu, nebo „Uložit jako PDF“, pokud chcete uložit soubor.',
  'help.guide.export-packing-list.result':
    'Výtisk i soubory obsahují otevřené zobrazení, „Sdílené“ nebo „Můj seznam“, s počty kusů, hmotnostmi a zaškrtnutím.',
  'help.guide.export-packing-list.tip.1':
    'CSV je formát, který načítá „Importovat“, i se zavazadly, takže ho můžete použít jako vlastní šablonu na balení: stačí ho importovat do další cesty.',
  'help.guide.export-packing-list.tip.2':
    'Soubor Markdown se v Obsidian, Notion nebo na GitHubu otevře jako kontrolní seznam a přes „Importovat“ ho můžete znovu načíst.',
  // share-packing-item
  'help.guide.share-packing-item.title': 'Kdo položku vidí a kdo ji přiveze',
  'help.guide.share-packing-item.goal':
    'Přesouvejte položku mezi společnými věcmi skupiny, vlastním seznamem a lidmi, pro které ji berete.',
  'help.guide.share-packing-item.step.1':
    'Nad seznamy je „Sdílené“, seznam, který vidí všichni, a „Můj seznam“, váš vlastní. U obou je vidět počet položek. Kliknutím na „Můj seznam“ zobrazíte ten svůj.',
  'help.guide.share-packing-item.step.2':
    'Zpátky v části „Sdílené“ otevřete tři tečky na konci řádku a klikněte na „Sdílení“.',
  'help.guide.share-packing-item.step.3':
    'Na výběr jsou tři úrovně: „Sdílené“, viditelné pro všechny ve skupině; „Osobní“, které vidíte jen vy; a „Sdílet s…“, kde vyberete lidi, pro které položka je.',
  'help.guide.share-packing-item.step.4':
    'Položka „Osobní“ je jen v „Můj seznam“. Přepněte na „Můj seznam“ a najdete ji tam.',
  'help.guide.share-packing-item.step.5':
    'Znovu otevřete „Sdílení“ a v části „Sdílet s…“ zaškrtněte jméno. Položka se zobrazí i v seznamu dané osoby a řádek dostane malý odznak s počtem lidí, se kterými je sdílená.',
  'help.guide.share-packing-item.result': 'Položka je v úrovni, kterou jste vybrali, a řádek ukazuje, kdo ji přiveze.',
  'help.guide.share-packing-item.tip.1':
    'Sdílení položky může měnit jen ten, kdo ji bere s sebou. Ten, s kým ji sdílíte, ji uvidí ve svém „Můj seznam“ s malým odznakem ruky, který po najetí myší ukáže vaše jméno. Může si ji odškrtnout.',
  'help.guide.share-packing-item.tip.2':
    'U sdílené položky, kterou veze někdo jiný, nabídne menu se třemi tečkami místo „Sdílení“ dvě jiné volby: „Můžu to vzít taky“, která vás přidá vedle něj, a „Kopírovat do mého seznamu“, která vám vytvoří soukromou kopii.',
  'help.guide.share-packing-item.tip.3':
    'Nové položky přebírají sdílení podle zobrazení, ve kterém je přidáte. Položky přidané v zobrazení „Sdílené“ se sdílejí se všemi. Položky přidané v „Můj seznam“ jsou „Osobní“, pokud nejsou všechny položky toho seznamu sdílené se stejnými lidmi: pak se s nimi sdílí i nová položka.',
  // packing-bags
  'help.guide.packing-bags.title': 'Zvážit zavazadla',
  'help.guide.packing-bags.goal':
    'Zadejte u každé položky hmotnost, rozdělte položky do zavazadel a udržte každé zavazadlo pod limitem letecké společnosti.',
  'help.guide.packing-bags.step.1':
    'Klikněte na štítek s hmotností před kolečkem a zadejte hmotnost položky v gramech.',
  'help.guide.packing-bags.step.2': 'Kroužek za hmotností je taška položky. Klikněte na něj.',
  'help.guide.packing-bags.step.3':
    'Pokud zatím žádná taška není, klikněte na „Přidat zavazadlo“, napište název a stiskněte Enter. Taška se vytvoří a položka se do ní vloží.',
  'help.guide.packing-bags.step.4':
    'Karta „Zavazadla“ se objeví vpravo od seznamů, jakmile existuje aspoň jedna taška. U každé tašky vidíte název, kdo ji nese, ukazatel zaplnění, počet položek a hmotnost. Pod taškami je „Nepřiřazeno“ a „Celková váha“ a pod ní „Zabaleno“: hmotnost už zabalených věcí a tenký pruh s jejím podílem.',
  'help.guide.packing-bags.step.5':
    'Klikněte na „Nastavit limit“ vedle hmotnosti zavazadla a zadejte limit v kilogramech, jak ho uvádějí aerolinky.',
  'help.guide.packing-bags.step.6':
    'Čárkované plus na konci řádku s názvem tašky, těsně před křížkem, otevře „Přiřadit členy“. Zaškrtněte členy, kteří tašku ponesou: zobrazí se vedle plusu a „Na osobu“ dole na kartě vypíše, co kdo nese.',
  'help.guide.packing-bags.result':
    'Karta „Zavazadla“ vpravo ukazuje hmotnost každé tašky vůči jejímu limitu, co není v žádné tašce, co nese každá osoba a celkovou hmotnost včetně toho, kolik je už zabaleno.',
  'help.guide.packing-bags.tip.1':
    'Pole hmotnosti, kolečko zavazadla a karta „Zavazadla“ jsou k dispozici, jen dokud má správce v doplňku „Seznamy“ zapnuté „Sledování zavazadel“. V užším okně otevřete zavazadla místo toho tlačítkem „Zavazadla“ nad kartou průběhu.',
  'help.guide.packing-bags.tip.2':
    'Hmotnost zavazadla počítá server z položek všech členů, i z těch, které nevidíte, takže číslo odpovídá skutečné hmotnosti zavazadla.',
  'help.guide.packing-bags.tip.3':
    'Zavazadlo bez limitu se porovnává s nejtěžším zavazadlem, takže pruhy můžete porovnat. Když zavazadlu nastavíte limit, jeho pruh se místo toho měří vůči tomuto limitu.',
  // create-todo
  'help.guide.create-todo.title': 'Přidání úkolu',
  'help.guide.create-todo.goal': 'Zapište si úkol se seznamem, prioritou, termínem a přiřazenou osobou.',
  'help.guide.create-todo.step.1': 'Na pravém konci lišty klikněte na „Přidat nový úkol“.',
  'help.guide.create-todo.step.2':
    'Otevře se dialog „Nový úkol“ s kurzorem v záhlaví. Do pole „Název úkolu“ napište název a vše, co si chcete zapamatovat, přidejte do pole „Popis“.',
  'help.guide.create-todo.step.3':
    '„Seznam“ určuje, do které skupiny úkol patří. Vyberte existující, nebo přes plus vedle něj pojmenujte v malém dialogu nový.',
  'help.guide.create-todo.step.4': '„Priorita“ má čtyři tlačítka: „Žádné“, P1, P2 a P3, od červené po modrou.',
  'help.guide.create-todo.step.5':
    '„Termín splnění“ vedle „Seznam“ otevře kalendář a „Přiřazeno“ přiřadí úkol konkrétnímu člověku.',
  'help.guide.create-todo.step.6': 'Klikněte na „Vytvořit úkol“.',
  'help.guide.create-todo.result':
    'Úkol je v seznamu s prioritou, termínem a seznamem jako odznaky a s avatarem přiřazené osoby na konci řádku a otevře se v panelu vpravo.',
  'help.guide.create-todo.tip.1': 'Povinný je jen název. Vše ostatní můžete doplnit později v panelu vpravo.',
  'help.guide.create-todo.tip.2': 'Když máte v postranním panelu vybraný seznam, nový úkol se založí v něm.',
  'help.guide.create-todo.tip.3': 'Enter v poli názvu úkol rovnou vytvoří, aniž byste vyplňovali ostatní pole.',
  // todo-filters
  'help.guide.todo-filters.title': 'Najít a změnit úkol',
  'help.guide.todo-filters.goal': 'Zobrazte jen úkoly, na kterých teď záleží, a pak upravte úkol, který jste našli.',
  'help.guide.todo-filters.step.1':
    'Úkoly v postranním panelu: „Vše“ ukazuje všechny otevřené úkoly, „Moje úkoly“ ty přiřazené vám, „Po termínu“ úkoly s datem v minulosti a „Hotovo“ dokončené úkoly. U každého je vidět počet. Klikněte na „Po termínu“.',
  'help.guide.todo-filters.step.2':
    'V části „Seznamy“ je řádek pro každý seznam. Když jeden vyberete, zobrazí se tento seznam včetně dokončených úkolů.',
  'help.guide.todo-filters.step.3':
    'Řazení nahoře v seznamu mění pořadí zobrazených úkolů: „Priorita“ dá na začátek P1, „Termín splnění“ nejbližší termín. Použít můžete vždy jen jedno z nich a dalším kliknutím se vrátíte k vlastnímu pořadí.',
  'help.guide.todo-filters.step.4': 'Kliknutím na úkol ho otevřete v panelu vpravo.',
  'help.guide.todo-filters.step.5':
    'Změňte, co potřebujete: název, „Priorita“, „Seznam“, „Termín splnění“ nebo „Přiřazeno“. Popis ukazuje text s funkčními odkazy; kliknutím do něj ho upravíte. Pak dole v panelu klikněte na „Uložit změny“. Políčkem v záhlaví panelu úkol označíte jako hotový a „Smazat“ vedle „Uložit změny“ ho okamžitě smaže.',
  'help.guide.todo-filters.result':
    'Seznam ukazuje jen úkoly, které jste chtěli vidět, a v panelu vpravo upravujete ten vybraný.',
  'help.guide.todo-filters.tip.1':
    'Řádek seznamu počítá jen otevřené úkoly, ale když ho vyberete, zobrazí se i dokončené. „Vše“, „Moje úkoly“ a „Po termínu“ dokončené úkoly skrývají; „Hotovo“ zobrazuje jen dokončené úkoly.',
  'help.guide.todo-filters.tip.2':
    '„Priorita“ a „Termín splnění“ v řazení nejde použít současně. Dokud je jedno z nich zapnuté, nemůžete řádky přetahovat do vlastního pořadí.',

  // ── Screen: trip-bookings ─────────────────────────────────────────────────────────────
  'help.ctx.trip-bookings.title': 'Rezervace',
  'help.ctx.trip-bookings.summary':
    'Tato karta obsahuje vše, co je pro cestu zarezervované, kromě dopravy: ubytování, stoly, vstupenky, prohlídky a parkování. Každá rezervace je kartou, řádkem seznamu nebo pruhem na časové ose s kódem, dokumenty, cestujícími a cenou. Kliknutím na rezervaci otevřete její podrobnosti.',
  'help.ctx.trip-bookings.bullet.1':
    '„Ruční rezervace“ na pravém konci lišty otevře „Nová rezervace“. Vytvoříte tak šest druhů rezervací: Ubytování, Restaurace, Událost, Prohlídka, Parkování a Ostatní. Lety, vlaky a další doprava jsou na kartě „Doprava“ a tady se nikdy nezobrazí.',
  'help.ctx.trip-bookings.bullet.2':
    'Ikona stažení před „Ruční rezervace“, „Importovat potvrzení rezervace“, nahraje potvrzení, aby je TREK mohl automaticky přečíst: EML, PDF, PKPass, HTML nebo TXT, nejvýše pět souborů po 10 MB, a fotky, pokud model AI umí číst obrázky. Ikona se zobrazuje, jen když je server umí číst.',
  'help.ctx.trip-bookings.bullet.3':
    '„Hledat“ prochází názvy, typy, místa, poznámky, rezervační kódy a cestující. „Filtr“, trychtýř vedle něj, zúží záložku v sekcích „Stav“, „Typ“ (s počtem u každého typu) a „Cestující“, která se objeví, jakmile nějaká rezervace uvádí osoby. Číslo na trychtýři ukazuje, kolik filtrů je aktivních.',
  'help.ctx.trip-bookings.bullet.4':
    'Tři ikony za „Filtr“ přepínají zobrazení: „Karty“, „Seznam“ a „Časová osa“. „Možnosti zobrazení“, posuvníky vedle nich, seskupují a řadí karty a seznam nebo nastavují pruhy časové osy a ikona tabulky za nimi, „Exportovat jako tabulku (CSV)“, stáhne obsah karty jako soubor. Ve výchozím stavu jsou karty seskupené na „Potvrzeno“ a „Čeká na potvrzení“ a seznam podle dnů. Kliknutím na nadpis sekce ji sbalíte.',
  'help.ctx.trip-bookings.bullet.5':
    'Karta má záhlaví podbarvené podle stavu se stavovou tečkou (kliknutím přepnete mezi „Čeká na potvrzení“ a „Potvrzeno“), typem, názvem, tužkou a košem. Pod ním jsou údaje, které rezervace má: „Datum“, „Čas“, „Rezervační kód“, „Check-in“ a „Check-out“, „Místo / Adresa“, „Ubytování“, „Propojeno s“ (zastávka v plánu), „Odkaz“, „Poznámky“, „Cestující“, „Soubory“ a propojené náklady.',
  'help.ctx.trip-bookings.bullet.6':
    'Kliknutím na kartu, řádek nebo pruh otevřete podrobnosti rezervace, dole s tlačítky „Na mapě“ (pokud má rezervace místo), košem a „Upravit“. Před smazáním se TREK jednou zeptá („Smazat rezervaci?“ upozorní, pokud se s ní smažou i náklady). Pak se smaže rezervace i propojené výdaje a u ubytování se jeho noci odeberou z denního plánu.',
  // booking-views
  'help.guide.booking-views.title': 'Přepnutí zobrazení a otevření rezervace',
  'help.guide.booking-views.goal':
    'Zobrazte rezervace jako karty, seznam nebo na časové ose a otevřete kteroukoli, abyste viděli všechny podrobnosti.',
  'help.guide.booking-views.step.1':
    'Tři ikony za „Filtr“ na liště jsou zobrazení; každá po najetí myší ukáže svůj název: „Karty“, „Seznam“ a „Časová osa“. Karta se otevírá v zobrazení „Karty“, s kartou pro každou rezervaci v sekcích „Potvrzeno“ a „Čeká na potvrzení“. Klikněte na „Seznam“, prostřední ikonu.',
  'help.guide.booking-views.step.2':
    '„Seznam“ zobrazí každou rezervaci jako řádek pod nadpisem jejího dne, se dnem a časem vpravo; šipkami na klávesnici přecházíte mezi řádky. Klikněte na „Časová osa“, poslední ze tří ikon.',
  'help.guide.booking-views.step.3':
    '„Časová osa“ ukazuje rezervace v průběhu dnů cesty: jeden pruh pro každý typ a lištu od začátku do konce každé rezervace. Rezervace čekající na potvrzení má čárkovaný obrys. „Cesta“ vměstná celou cestu na šířku obrazovky. Kliknutím na nadpis dne zobrazíte daný den po hodinách.',
  'help.guide.booking-views.step.4':
    '„Den“ zobrazí jeden den na hodinové ose a délka každého pruhu odpovídá jeho času. Šipkami vedle názvu dne přejdete na předchozí a následující den. Během cesty skočí „Dnes“ na aktuální den a přepínač „Cesta“ a „Den“ vpravo vás vrátí k celé cestě.',
  'help.guide.booking-views.step.5':
    'Najeďte na pruh a uvidíte jeho den, časy a místo. Kliknutím otevřete podrobnosti rezervace. Karta v zobrazení „Karty“ a řádek v zobrazení „Seznam“ otevírají stejné okno.',
  'help.guide.booking-views.step.6':
    'V záhlaví detailu je název a štítky se stavem (kliknutím ho přepnete), typem, dnem a rezervačním kódem s tlačítkem pro jeho zkopírování. Pod ním jsou časy jako dlaždice, pak místo, cestující, poznámky, náklady a soubory, pokud je rezervace má, a úplně dole „Na mapě“, koš a „Upravit“.',
  'help.guide.booking-views.result':
    'Rezervace se otevře v podrobném zobrazení: „Upravit“ otevře její formulář, „Na mapě“ ji ukáže v plánu a „Zavřít“ nebo Escape vás vrátí do zobrazení, odkud jste přišli.',
  'help.guide.booking-views.tip.1':
    'V „Možnosti zobrazení“, ikoně s posuvníky za ikonami zobrazení, můžete „Karty“ a „Seznam“ seskupit a seřadit pomocí „Seskupit podle“ a „Seřadit podle“. U „Časová osa“ nabízí „Jeden pruh pro každý typ“ a „Zobrazit druhou kartu“. „Zobrazit druhou kartu“ ukáže položky z karty „Doprava“ ztlumeně v úzkém pruhu nahoře. „Obnovit zobrazení“ vrátí výchozí nastavení a každá karta si své zobrazení pamatuje v tomto prohlížeči.',
  'help.guide.booking-views.tip.2':
    'Rezervace před cestou, po ní nebo bez data se na časové ose zobrazit nemůže. Najdete ji pod grafem jako malou kartu v části „Před cestou“, „Po cestě“ nebo „Bez data“.',
  'help.guide.booking-views.tip.3':
    'Stejné podrobnosti se otevřou všude, kde se rezervace zobrazuje: na kartě „Doprava“, v denním plánu, v podrobnostech dne i místa. Kliknutím na název rezervaci přejmenujete.',
  // create-booking
  'help.guide.create-booking.title': 'Vytvořit rezervaci',
  'help.guide.create-booking.goal':
    'Přidejte do cesty ručně restauraci, akci, prohlídku, parkovací místo nebo cokoli jiného.',
  'help.guide.create-booking.step.1':
    'Klikněte na „Ruční rezervace“ na pravém konci lišty. Otevře se „Nová rezervace“ se záhlavím nahoře, ve kterém je název a dva štítky.',
  'help.guide.create-booking.step.2':
    'Klikněte na štítek typu v horním pruhu, u nové rezervace je na něm „Ostatní“, a vyberte „Typ rezervace“. Na této kartě vytvoříte šest typů: Ubytování, Restaurace, Událost, Prohlídka, Parkování a Ostatní. Formulář se podle volby změní: jen Ubytování používá místo dat rozsah dnů.',
  'help.guide.create-booking.step.3':
    'Napište název do pruhu nahoře, do pole nad štítky. Je to jediné povinné pole a tlačítko „Přidat“ zůstane šedé, dokud něco nevyplníte.',
  'help.guide.create-booking.step.4':
    'Nastavte „Datum“ a „Čas začátku“, a pokud má rezervace konec, také „Datum konce“ a „Čas konce“. Kalendáře nabízejí jen dny v rámci cesty. Datum a čas konce, které nejsou po začátku, se zobrazí červeně a zablokují „Přidat“. Čas konce před časem začátku bez data konce vás jen upozorní: pokud rezervace končí následující den, nastavte datum konce.',
  'help.guide.create-booking.step.5':
    'Zadejte „Rezervační kód“ z potvrzení a pak klikněte na pilulku stavu v záhlaví vedle typu. U nové rezervace ukazuje „Čeká na potvrzení“ a změní se na „Potvrzeno“. Podle stavu se karta zobrazí v příslušné sekci.',
  'help.guide.create-booking.step.6': 'Dole ve formuláři klikněte na „Přidat“.',
  'help.guide.create-booking.result':
    'Rezervace se zobrazí jako karta ve své sekci. Barva záhlaví ukazuje její stav a na kartě je typ, datum, časy a kód. Všichni ostatní v cestě ji uvidí okamžitě.',
  'help.guide.create-booking.tip.1':
    '„Místo / Adresa“ vám při psaní nabízí skutečné adresy. Když jednu vyberete, nahradí to, co jste napsali. Adresa, kterou napíšete sami, zůstane, jak je.',
  'help.guide.create-booking.tip.2':
    'Do pole „Odkaz“ zadejte stránku rezervace u poskytovatele. Karta i detail ho zobrazí jako odkaz, který se otevře v nové záložce.',
  'help.guide.create-booking.tip.3':
    'Poznámky podporují Markdown, takže seznam nebo tučný řádek se na kartě i v podrobném zobrazení ukáže jako seznam nebo tučný text.',
  // booking-hotel
  'help.guide.booking-hotel.title': 'Rezervace ubytování',
  'help.guide.booking-hotel.goal':
    'Zadejte ubytování tak, aby se počítalo jako rezervace a zároveň jako noci v denním plánu.',
  'help.guide.booking-hotel.step.1':
    'Klikněte na „Ruční rezervace“ a pilulkou typu v horním pruhu zvolte „Ubytování“. Pole s daty se nahradí blokem polí pro hotel.',
  'help.guide.booking-hotel.step.2':
    'V části „Ubytování“ vyberte hotel. Seznam obsahuje místa cesty bez importovaných stop a výletů. Po výběru se jeho název doplní do prázdného názvu a adresa do pole „Místo / Adresa“.',
  'help.guide.booking-hotel.step.3':
    'Nastavte „Od“ a „Do“: první noc a ráno, kdy odjíždíte. Obě pole nabízejí dny cesty s daty a TREK hlídá, aby „Do“ bylo po „Od“.',
  'help.guide.booking-hotel.step.4':
    'Vyplňte „Check-in“, „Check-in do“ a „Check-out“ a také „Rezervační kód“ z potvrzení.',
  'help.guide.booking-hotel.step.5': 'Klikněte na „Přidat“.',
  'help.guide.booking-hotel.result':
    'Karta zobrazuje pod „Datum“ rozsah dnů, časy příjezdu a odjezdu a adresu. Pobyt se teď zobrazuje i v těchto dnech plánu.',
  'help.guide.booking-hotel.tip.1':
    'Ubytování je jediný typ bez polí „Datum“ a „Čas začátku“. Místo nich má „Od“ a „Do“ a vybíráte v nich dny cesty, ne data v kalendáři.',
  'help.guide.booking-hotel.tip.2':
    'Nechte pole „Ubytování“ prázdné a místo toho napište adresu: místo se vyhledá, vytvoří a připne na mapu za vás.',
  'help.guide.booking-hotel.tip.3': 'Když rezervaci smažete, odeberou se z denního plánu i její noci.',
  // link-booking
  'help.guide.link-booking.title': 'Propojit rezervaci s plánem',
  'help.guide.link-booking.goal': 'Propojte rezervaci se zastávkou a místem, aby se zobrazila tam, kde ji potřebujete.',
  'help.guide.link-booking.step.1':
    'Najeďte myší na kartu, kterou chcete propojit, a klikněte na tužku v jejím záhlaví. Otevře se „Upravit rezervaci“.',
  'help.guide.link-booking.step.2':
    'Otevřete „Propojit s přiřazením dne“. Seznam ukazuje váš plán: nadpis pro každý den a pod ním zastávky toho dne, očíslované a s časy. Vyberte zastávku, ke které rezervace patří.',
  'help.guide.link-booking.step.3':
    '„Místo / Aktivita“ propojí rezervaci přímo s místem. Vyberte ho tam a název a „Místo / Adresa“ se vyplní, pokud jsou prázdné.',
  'help.guide.link-booking.step.4': 'Klikněte na „Aktualizovat“.',
  'help.guide.link-booking.result':
    'Karta ukazuje den a zastávku v části „Propojeno s“ a rezervace se v denním plánu zobrazí u této zastávky.',
  'help.guide.link-booking.tip.1':
    '„Bez propojení (samostatné)“ nahoře v seznamu propojení zase zruší. Ubytování výběr zastávky nemá: propojuje se přes své noci.',
  'help.guide.link-booking.tip.2':
    'Když vyberete zastávku ve dni s datem, vyplní se prázdné pole „Datum“ samo. Datum, které už máte nastavené, se nezmění.',
  // booking-travelers
  'help.guide.booking-travelers.title': 'Určit, pro koho rezervace je',
  'help.guide.booking-travelers.goal':
    'Označte, pro které cestovatele rezervace je, a pak zobrazte jen jejich rezervace.',
  'help.guide.booking-travelers.step.1':
    'Otevřete rezervaci tužkou na její kartě. Pole „Cestující“ je vedle pole „Rezervační kód“. Dokud k rezervaci nikoho nepřiřadíte, je v něm „Přiřadit cestující“.',
  'help.guide.booking-travelers.step.2':
    'Klikněte na něj a vyberte lidi, pro které rezervace je; v seznamu jsou i pojmenovaní hosté. Vybraná osoba dostane zatržítko a její avatar se objeví v poli. Dalším kliknutím na jméno ji odeberete.',
  'help.guide.booking-travelers.step.3': 'Klikněte na „Aktualizovat“.',
  'help.guide.booking-travelers.step.4':
    'Klikněte na liště na „Filtr“ a v části „Cestující“ klikněte na osobu, abyste viděli jen její rezervace. Zapnout jich můžete několik najednou.',
  'help.guide.booking-travelers.result':
    'Na kartě jsou uvedeni lidé, pro které rezervace je, a „Filtr“ zúží záložku na rezervace vybraných lidí.',
  'help.guide.booking-travelers.tip.1':
    'Na kartě a v detailu se cestující jen zobrazují, změnit je tam nemůžete. Nastavíte je tady ve formuláři.',
  'help.guide.booking-travelers.tip.2':
    '„Cestující“ se ve „Filtr“ objeví, jakmile má cesta víc než jednoho člena a aspoň jedna rezervace někoho uvádí. Váš výběr platí, dokud nezavřete kartu prohlížeče.',
  // booking-files
  'help.guide.booking-files.title': 'Voucher přímo u rezervace',
  'help.guide.booking-files.goal': 'Přiložte potvrzení, jízdenku nebo palubní vstupenku k rezervaci, ke které patří.',
  'help.guide.booking-files.step.1':
    'Otevřete rezervaci tužkou na její kartě. Soubory jsou vedle propojení; klikněte tam na „Přiložit soubor“. U existující rezervace se dokument nahraje hned a TREK ukáže „Soubor byl nahrán“.',
  'help.guide.booking-files.step.2': 'Dokument je uvedený pod svým názvem, s tlačítkem pro otevření a křížkem vedle.',
  'help.guide.booking-files.step.3':
    '„Propojit stávající soubor“ nabídne dokumenty cesty, které u této rezervace ještě nejsou. Vyberte jeden a připojí se, aniž byste cokoli nahrávali znovu.',
  'help.guide.booking-files.step.4': 'Klikněte na „Aktualizovat“.',
  'help.guide.booking-files.result':
    'Karta i podrobnosti uvádějí dokumenty v části „Soubory“. Kliknutím dokument otevřete. Tlačítkem „Zobrazit v souborech“ nad seznamem v podrobnostech přejdete na kartu „Soubory“.',
  'help.guide.booking-files.tip.1':
    'U rezervace, kterou teprve vytváříte, se dokument nahraje, až kliknete na „Přidat“. Nahrávání vyžaduje připojení.',
  'help.guide.booking-files.tip.2':
    'Křížek vedle dokumentu odebere propojení, ne dokument. Dokument zůstane na kartě „Soubory“ dané cesty.',
  'help.guide.booking-files.tip.3':
    'Jaké typy souborů lze připojit, nastavuje správce v „Povolené typy souborů“. Ve výchozím stavu jsou povolené dokumenty, text a obrázky.',
  // booking-cost
  'help.guide.booking-cost.title': 'Převedení ceny rezervace na náklad',
  'help.guide.booking-cost.goal': 'Přidejte cenu rezervace do Nákladů a rozdělte ji mezi ty, kdo ji platí.',
  'help.guide.booking-cost.step.1':
    'Otevřete rezervaci tužkou na její kartě a přejděte na konec formuláře. V části „Náklady“ najdete „Vytvořit výdaj“ a „Propojit stávající výdaj“ s poznámkou „Uloží rezervaci a poté otevře editor nákladů“.',
  'help.guide.booking-cost.step.2':
    'Klikněte na „Vytvořit výdaj“. Rezervace se uloží, její formulář se zavře a otevře se editor nákladů jako „Přidat výdaj“.',
  'help.guide.booking-cost.step.3':
    'Název v záhlaví už odpovídá názvu rezervace a „Den“ dni rezervace. Zadejte „Celková částka“ a zkontrolujte „Měna“ vedle ní.',
  'help.guide.booking-cost.step.4':
    'Štítek v záhlaví je „Kategorie“, předvyplněná podle typu rezervace. V části „Kdo zaplatil?“ vyberte, kdo platil, a v části „Rozdělení“ zvolte, jak se částka rozdělí.',
  'help.guide.booking-cost.step.5': 'Klikněte na „Přidat výdaj“.',
  'help.guide.booking-cost.result':
    'Karta ukazuje částku dole, formulář rezervace uvádí výdaj v sekci „Propojené výdaje“ a stejný výdaj najdete na kartě „Náklady“, propojený s touto rezervací.',
  'help.guide.booking-cost.tip.1':
    'Kategorie závisí na typu: z „Restaurace“ je „Jídlo a pití“, z „Ubytování“ „Ubytování“, z „Parkování“ „Parkování“ a „Událost“ i „Prohlídka“ spadnou do „Ostatní“.',
  'help.guide.booking-cost.tip.2':
    'Rezervace může mít několik výdajů. „Propojit stávající výdaj“ nabízí výdaje z Nákladů, které zatím nejsou s ničím propojené. U propojeného výdaje „Odpojit, výdaj ponechat“ zruší propojení a výdaj v Nákladech ponechá, kdežto koš ho smaže.',
  'help.guide.booking-cost.tip.3':
    'Část „Náklady“ je ve formuláři, jen když je zapnutý doplněk Náklady. Ten zapíná správce v části „Doplňky“.',
  // filter-bookings
  'help.guide.filter-bookings.title': 'Najít rezervaci',
  'help.guide.filter-bookings.goal': 'Vyfiltrujte dlouhou kartu podle slova, stavu, typu nebo osoby.',
  'help.guide.filter-bookings.step.1':
    'Pište do pole „Hledat“ v liště. Hledá se v názvech, typech, místech a adresách, poznámkách, rezervačních kódech a jménech cestujících a během psaní ubývá výsledků. Klávesa Escape pole vymaže.',
  'help.guide.filter-bookings.step.2':
    'Klikněte na „Filtr“, trychtýř vedle vyhledávání. Panel obsahuje „Stav“, „Typ“ a jakmile má některá rezervace přiřazené lidi, i „Cestující“.',
  'help.guide.filter-bookings.step.3':
    'V části „Stav“ vyberte „Potvrzeno“ nebo „Čeká na potvrzení“ a zobrazí se jen tyto rezervace; „Vše“ zobrazí obojí.',
  'help.guide.filter-bookings.step.4':
    'V části „Typ“ klikněte na jeden nebo více typů a zůstanou jen ty. U každého typu je počet rezervací a vybrané typy mají zatržítko.',
  'help.guide.filter-bookings.step.5':
    'Číslo na tlačítku „Filtr“ ukazuje, kolik filtrů je zapnutých, a štítek vedle hledání ukazuje, kolik ze všech rezervací zbývá. Kliknutím na štítek nebo na „Zrušit filtry“ dole v panelu zase zobrazíte všechno.',
  'help.guide.filter-bookings.result':
    'Záložka ukazuje jen to, co jste vybrali, v zobrazení „Karty“, „Seznam“ i „Časová osa“, a filtry pro tuto cestu zůstanou, dokud nezavřete kartu prohlížeče.',
  'help.guide.filter-bookings.tip.1':
    'Filtr „Typ“ se zobrazí, jen když karta obsahuje víc než jeden typ, a nabízí jen typy, které na kartě jsou. Pokud tedy karta nemá žádnou prohlídku, „Typ“ nenabízí možnost „Prohlídka“.',
  'help.guide.filter-bookings.tip.2':
    'Pokud filtru nic neodpovídá, zobrazí se „Těmto filtrům nic neodpovídá“ a hned pod tím „Zrušit filtry“.',
  // import-booking-file
  'help.guide.import-booking-file.title': 'Import rezervace z potvrzení',
  'help.guide.import-booking-file.goal':
    'Nechte TREK načíst rezervaci z e-mailu nebo PDF, které poslal poskytovatel, abyste ji nemuseli opisovat.',
  'help.guide.import-booking-file.step.1':
    'Na liště klikněte na ikonu stažení, „Importovat potvrzení rezervace“; název se zobrazí, když na ni najedete myší. Otevře se dialog stejného názvu.',
  'help.guide.import-booking-file.step.2':
    'Přetáhněte potvrzení do pole, nebo na pole klikněte a vyberte je: EML, PDF, PKPass, HTML a TXT, až pět souborů po 10 MB, a fotky (JPG, PNG, WEBP), pokud model AI umí číst obrázky. V poli se zobrazí názvy vybraných souborů.',
  'help.guide.import-booking-file.step.3':
    'Klikněte na „Importovat“. Dialog se hned zavře, protože načítání probíhá na pozadí.',
  'help.guide.import-booking-file.step.4':
    'Vpravo dole se objeví karta s průběhem pod názvem souboru. Zůstává vidět, i když se v aplikaci přesouváte, a také po obnovení stránky. Až je čtení hotové, změní se „Zpracování souborů…“ na fajfku a karta nabídne „Importovat“. Klikněte na to.',
  'help.guide.import-booking-file.step.5':
    'Každá nalezená rezervace se postupně otevře v okně „Nová rezervace“, už vyplněná. U hotelu je to jeho název jako název rezervace a, pokud cesta toto místo obsahuje, v části „Ubytování“ jeho „Místo / Adresa“, „Od“ a „Do“ na jeho nocích, „Check-in“ a „Check-out“, „Rezervační kód“, potvrzení v části „Soubory“ a se zapnutým doplňkem „Náklady“ cena jako „Propojený výdaj“. Zkontrolujte to a klikněte na „Přidat“.',
  'help.guide.import-booking-file.result':
    'Rezervace se objeví jako karta v části „Čeká na potvrzení“ s nocemi, kódem a potvrzením v části „Soubory“. Pobyt se zobrazí v těchto dnech plánu. Pokud jsou zapnuté Náklady, přidá se cena jako výdaj propojený s rezervací.',
  'help.guide.import-booking-file.tip.1':
    'Ikona importu se zobrazí, jen když server umí potvrzení načítat. K tomu je potřeba buď extraktor, nebo doplněk „Analýza pomocí AI“, který zapíná správce v sekci „Doplňky“. Na kartě bez rezervací je k dispozici také jako tlačítko „Importovat ze souboru“.',
  'help.guide.import-booking-file.tip.2':
    'Pokud se nepodařilo nic přečíst, karta vás na to upozorní. Se zapnutou „Analýza pomocí AI“ nabídne „Zkusit načíst pomocí AI“, které pošle stejné soubory přímo modelu. Dokončené zpracování se uchová deset minut; kontrolu spusťte během této doby.',
  'help.guide.import-booking-file.tip.3':
    'Potvrzení se přiloží, jen pokud je jeho typ v „Povolené typy souborů“ v nastavení správy. PDF je povolené ve výchozím stavu; e-mail (EML) je potřeba nejdřív přidat, jinak se rezervace uloží bez něj.',
  // edit-booking
  'help.guide.edit-booking.title': 'Upravit rezervaci',
  'help.guide.edit-booking.goal':
    'Opravte čas, doplňte kód, který přišel později, nebo změňte stav rezervace z „Čeká na potvrzení“ na „Potvrzeno“.',
  'help.guide.edit-booking.step.1':
    'Najeďte myší na kartu a klikněte na tužku v jejím záhlaví. Otevře se „Upravit rezervaci“ se všemi údaji rezervace.',
  'help.guide.edit-booking.step.2':
    'Změňte, co je potřeba, například „Rezervační kód“, který provozovatel poslal později.',
  'help.guide.edit-booking.step.3':
    'Klikněte na štítek „Čeká na potvrzení“ v pruhu nahoře. Změní se na „Potvrzeno“ a pruh zezelená.',
  'help.guide.edit-booking.step.4': 'Klikněte na „Aktualizovat“.',
  'help.guide.edit-booking.result':
    'Karta se přesune: potvrzená rezervace se zobrazí v sekci „Potvrzeno“ se zelenou tečkou a zeleným horním pruhem a všichni v cestě uvidí, jak se přesunula.',
  'help.guide.edit-booking.tip.1':
    'Pokud „Rezervační kód“ nejde přečíst, máte v „Nastavení“ v části „Zobrazení“ zapnuté „Skrýt rezervační kódy“. Kód zobrazíte tak, že na něj najedete myší nebo na něj kliknete.',
  'help.guide.edit-booking.tip.2':
    'Když změníte typ, změní se s ním i kategorie propojeného výdaje, pokud jste kategorii nevybrali ručně v editoru nákladů.',
  'help.guide.edit-booking.tip.3':
    'Stejný formulář otevře i „Upravit“ dole v detailu rezervace. Stav můžete přepnout i bez formuláře: klikněte na tečku na kartě nebo v řádku, nebo na štítek stavu v detailu.',
  // delete-booking
  'help.guide.delete-booking.title': 'Smazání rezervace',
  'help.guide.delete-booking.goal': 'Odeberte z cesty zrušenou rezervaci.',
  'help.guide.delete-booking.step.1':
    'Najeďte myší na kartu a klikněte na koš v jejím záhlaví. Stejně funguje koš dole v podrobnostech rezervace.',
  'help.guide.delete-booking.step.2':
    '„Smazat rezervaci?“ uvede vybranou rezervaci a upozorní, že bude trvale smazána. Pokud jsou s ní propojené náklady, upozorní, že se smažou také.',
  'help.guide.delete-booking.step.3': 'Klikněte na „Smazat“.',
  'help.guide.delete-booking.result':
    'Karta se smaže všem v cestě. Smazání rezervace nejde vrátit, takže potvrzovací otázka je vaše poslední šance to zrušit.',
  'help.guide.delete-booking.tip.1':
    'Smazáním rezervace se odstraní i výdaje, které jsou k ní propojené. Smazáním ubytování se z plánu dní odstraní i jeho noci.',
  'help.guide.delete-booking.tip.2':
    'Přiložené dokumenty zůstanou na kartě „Soubory“ cesty; odstraní se jen jejich propojení s rezervací.',

  // ── Screen: trip-costs ────────────────────────────────────────────────────────────────
  'help.ctx.trip-costs.title': 'Náklady',
  'help.ctx.trip-costs.summary':
    'Peníze cesty: všechny výdaje v přehledu po dnech nebo v tabulce, kdo je zadal a kdo za ně dluží, v měně účtenky. Pravý sloupec ukazuje, kdo komu musí zaplatit, aby se účty vyrovnaly.',
  'help.ctx.trip-costs.bullet.1':
    'Lišta nahoře ukazuje termín cesty a cestující, mezi které se náklady dělí. Obsahuje také „Hledat výdaje…“, „Filtr“ (nálevka), „Exportovat CSV“ (ikona stažení) a přepínač „Seznam“ / „Tabulka“.',
  'help.ctx.trip-costs.bullet.2':
    'Na jejím pravém konci „Vyrovnat“ zaznamená všechny otevřené převody najednou, „Naskenovat účtenku“ vyplní výdaj z fotky, když doplněk „Analýza pomocí AI“ umí číst obrázky, a „Přidat výdaj“ otevře editor.',
  'help.ctx.trip-costs.bullet.3':
    'Čtyři karty pod lištou: „Dlužíte“ a „Dluží vám“ jsou vaše strana vyrovnání, „Nevyřízená částka“ je zapsaná částka, která zatím nemá plátce, a „Celkové výdaje na cestu“ sčítá vše, pod tím jsou „Váš podíl“ a „Zaplatili jste“.',
  'help.ctx.trip-costs.bullet.4':
    'Přehled výdajů je seskupený podle dnů, od nejnovějšího, každý den s počtem záznamů a útratou v záhlaví. Řádek ukazuje kategorii jako barevný štítek, název, čipy plátců s tím, kolik kdo zaplatil, pod nimi „Rozdělení“ s podílem každého cestujícího (zatržítko označuje, kdo svůj podíl už zaplatil), pak poznámku a částku a navíc „půjčili jste“ nebo „dlužíte“, pokud vám podle rozdělení ostatní dluží, nebo dlužíte vy.',
  'help.ctx.trip-costs.bullet.5':
    'Pravý sloupec ukazuje výsledky: „Vyrovnat“ uvádí, kdo komu platí, „Zůstatky“ ukazují přebytek nebo schodek každého cestujícího, „Konečný rozpočet“ kolik cesta každého z nich stojí a „Podle kategorie“ za co se utrácelo.',
  'help.ctx.trip-costs.bullet.6':
    'Zaznamenaná platba se v přehledu zobrazí jako samostatný řádek s tužkou a tlačítkem „Vrátit zpět“. Výdaj má tužku a koš; před smazáním výdaje se koš zeptá. Výdaj s účtenkami má vedle názvu štítek „Účtenka“, kterým je otevřete.',
  'help.ctx.trip-costs.bullet.7':
    '„Tabulka“ v liště ukáže stejné výdaje jako tabulku, seskupené podle kategorie, se sloupci „Osoby“ a „Dní“ a s částkou na osobu a na den. „Souhrn“ pak nahradí „Podle kategorie“. Náklady si zvolené zobrazení zapamatují.',
  // add-expense
  'help.guide.add-expense.title': 'Přidání výdaje',
  'help.guide.add-expense.goal': 'Zapište, kolik něco stálo, kdo to zaplatil a s kým se náklad dělí.',
  'help.guide.add-expense.step.1':
    'Na pravém konci lišty klikněte na „Přidat výdaj“. Otevře se editor s dnešním datem, s vámi jako plátcem a se všemi už zahrnutými v rozdělení.',
  'help.guide.add-expense.step.2':
    'Do pole nahoře v dialogu napište, za co byl výdaj. Dokud je prázdné, ukazuje „např. večeře, suvenýry, benzín…“. Je to název výdaje a bez něj výdaj neuložíte.',
  'help.guide.add-expense.step.3':
    'Štítek pod názvem je „Kategorie“, dokud nevyberete jinou, je nastavená na „Jídlo a pití“. Kategorií je čtrnáct a nedají se měnit. Záhlaví se zbarví podle vybrané kategorie, stejně jako proužek na řádku a jeho sloupec v „Podle kategorie“.',
  'help.guide.add-expense.step.4':
    'Částku z účtenky zadejte do pole „Celková částka“. „Měna“ vedle ní je nejdřív nastavená na měnu, ve které se zobrazují náklady; když ji změníte, editor ukáže přepočtenou částku. „Den“ je nejdřív nastavený na dnešek a pod tímto dnem bude výdaj v seznamu zařazený.',
  'help.guide.add-expense.step.5':
    'V části „Kdo zaplatil?“ klikněte na toho, kdo skutečně platil. Předvybrané je „Vy“. „Zatím nikdo nezaplatil“ zapíše částku, aniž by za ni kdokoli dlužil, a „Platilo více lidí“ v přepínači vedle nadpisu rozdělí účet mezi několik plátců.',
  'help.guide.add-expense.step.6':
    '„Rozdělení“ níže je nastavené na „Rovným dílem“, všichni jsou zaškrtnutí a u každého jména je jeho podíl. Nechte to tak, nebo to změňte. Uložíte tlačítkem „Přidat výdaj“ dole v dialogu.',
  'help.guide.add-expense.result':
    'Výdaj je v přehledu pod svým dnem, započítaný do „Celkové výdaje na cestu“, a sloupec vyrovnání přepočítal, kdo komu dluží.',
  'help.guide.add-expense.tip.1':
    'Pokud výchozí hodnoty nezměníte, má výdaj dnešní datum, platíte ho vy a dělí se rovným dílem mezi všechny: vyplnit musíte jen název a částku.',
  'help.guide.add-expense.tip.2':
    'Tlačítko ± vedle částky změní výdaj na vratku. Záporná celková částka znamená, že se peníze vracejí, a rozdělení se obrátí.',
  'help.guide.add-expense.tip.3':
    '„Připojit“ vedle „Účtenky a faktury“ dole v dialogu přijímá obrázky a PDF. Nahrají se při uložení, uloží se do souborů cesty a v seznamu se vedle názvu objeví štítek „Účtenka“.',
  // expense-payers
  'help.guide.expense-payers.title': 'Nastavit, kdo platil',
  'help.guide.expense-payers.goal': 'Zaznamenejte, kdo výdaj zaplatil. To je druhá polovina výpočtu vyrovnání.',
  'help.guide.expense-payers.step.1':
    'Otevřete výdaj tužkou vedle jeho řádku a podívejte se na „Kdo zaplatil?“. V přepínači vedle nadpisu je ve výchozím stavu „Platil jeden člověk“: každý cestovatel má svůj štítek a ten s obrysem je ten, kdo platil. Kliknutím na jiný štítek to změníte.',
  'help.guide.expense-payers.step.2':
    '„Zatím nikdo nezaplatil“, čárkovaný štítek za cestujícími, zaznamená částku, aniž by kdokoli cokoli dlužil. Výdaj se i tak započítá do „Celkové výdaje na cestu“.',
  'help.guide.expense-payers.step.3':
    '„Platilo více lidí“, druhá volba tohoto přepínače, vypíše všechny cestující se zaškrtávacím políčkem a každý zaškrtnutý dostane pole pro částku. Zaškrtněte, kdo platil, a zadejte, kolik kdo zaplatil; částky musí dát dohromady celkovou sumu.',
  'help.guide.expense-payers.step.4':
    'Výdaj, který zatím nikdo nezaplatil, je na svém řádku označený „Nedokončeno“ a započítává se do karty „Nevyřízená částka“, která sčítá útraty zatím bez plátce.',
  'help.guide.expense-payers.result':
    'Kdo platil, určuje, komu se peníze vrátí, rozdělení určuje, kdo platí, a „Zůstatky“ ukazují rozdíl mezi obojím.',
  'help.guide.expense-payers.tip.1':
    '„Kdo zaplatil?“ a „Rozdělení“ jsou na sobě nezávislé: můžete zaplatit večeři, na které jste nebyli, a podílet se na útratě, kterou jste neplatili.',
  'help.guide.expense-payers.tip.2':
    'Při více plátcích musí částky dát dohromady celkovou částku. Když zaškrtnete dalšího plátce, zbytek se znovu rozdělí mezi částky, které jste nezadali sami. Dokud částky nesedí, editor ukazuje, kolik mají dát dohromady, a výdaj neuloží.',
  'help.guide.expense-payers.tip.3':
    'Když výdaj vrátíte na „Zatím nikdo nezaplatil“, neodstraní se: částka zůstane v „Celkové výdaje na cestu“ a řádek bude „Nedokončeno“.',
  // split-expense
  'help.guide.split-expense.title': 'Rozdělení účtu mezi cestující',
  'help.guide.split-expense.goal':
    'Rozhodněte, kdo za výdaj dluží: všichni rovným dílem, podle částek, nebo položku po položce z účtenky.',
  'help.guide.split-expense.step.1':
    'V editoru výdaje vypisuje „Rozdělení“ všechny cestující se zaškrtávacím políčkem. Když jméno odškrtnete, vynecháte osobu z tohoto výdaje: jméno zešedne, ztratí svůj podíl a nic za výdaj nedluží.',
  'help.guide.split-expense.step.2':
    'Výchozí volba je „Rovným dílem“ v přepínači vedle nadpisu: každý zaškrtnutý cestující dostane stejný podíl, který vidíte vedle jména. Odznaky pod seznamem ukazují, kolik lidí se o výdaj dělí a kolik vychází na každého.',
  'help.guide.split-expense.step.3':
    '„Vlastní“ nahradí podíly poli pro částky. Zadejte, kolik dluží který cestující. Odznak pod nimi se při psaní aktualizuje a zezelená s textem „Rozdělení sedí s celkem“. Dokud částky neodpovídají celkové částce, nejde uložit.',
  'help.guide.split-expense.step.4':
    '„Účtenka“ rozdělí účtenku po řádcích: „Přidat položku“, pak název a cena na každý řádek a vedle „Dělí se mezi:“ cestující, kteří se o daný řádek dělí.',
  'help.guide.split-expense.step.5':
    '„Podíl každého“ pod řádky ukazuje, kolik každý cestovatel nakonec dluží, a „Celková částka“ nahoře je součet řádků. Klikněte na „Uložit“ dole v dialogu.',
  'help.guide.split-expense.result':
    'Všechny zůstatky se počítají z tohoto rozdělení. Uloží se s výdajem, na jeho řádku se zobrazí jako „Rozdělení“ s podílem každého cestujícího a později ho můžete změnit, aniž by se změnilo cokoli jiného.',
  'help.guide.split-expense.tip.1':
    'Cestující, u kterého zrušíte zaškrtnutí, za tento výdaj nic nedluží. Ostatní zaplatí svůj podíl.',
  'help.guide.split-expense.tip.2':
    '„Rovným dílem“ dělí přesně na halíře: zbývající halíř připadne u každého výdaje někomu jinému, takže ho neplatí pořád stejný člověk.',
  'help.guide.split-expense.tip.3':
    'Režim „Účtenka“ vypočítá „Celková částka“ sám a pole zešedne: celková částka je součtem řádků účtenky.',
  'help.guide.split-expense.tip.4':
    'Vlastní rozdělení můžete zadat i v procentech: přepněte „Zadávat podíly jako“ na % a podíly musí dohromady dát 100 %, jinak výdaj neuložíte.',
  // expense-currency
  'help.guide.expense-currency.title': 'Zadat výdaj v jiné měně',
  'help.guide.expense-currency.goal': 'Zadejte částku z účtenky a TREK uloží směnný kurz.',
  'help.guide.expense-currency.step.1':
    'Otevřete „Přidat výdaj“. Nahoru do dialogu napište název a do „Celková částka“ zadejte částku přesně tak, jak je na účtence, ne přepočtenou.',
  'help.guide.expense-currency.step.2':
    'Otevřete „Měna“ vedle částky a vyberte měnu z účtenky. Seznam obsahuje všechny kódy, které TREK zná, a dá se v něm hledat: napište tři písmena kódu.',
  'help.guide.expense-currency.step.3':
    'Pod poli se objeví řada odznaků: zadaná částka a její aktuální hodnota s označením „aktuální kurz“. Jde jen o náhled, ne o hodnotu, která se uloží.',
  'help.guide.expense-currency.step.4':
    'Dole v dialogu klikněte na „Přidat výdaj“. Kurz se v tu chvíli zafixuje: výdaj si ponechá hodnotu, jakou měl v den zadání.',
  'help.guide.expense-currency.step.5':
    'V přehledu výdajů ukazuje řádek pod názvem obě částky: tu, kterou jste zadali, šipku a částku v měně cesty. Všechny součty, zůstatky a vyrovnání na kartě „Náklady“ počítají s tou druhou.',
  'help.guide.expense-currency.result':
    'Výdaj si ponechá částku a měnu, které jste zadali. Přehled výdajů ukazuje obojí a součty i zůstatky cesty se počítají v měně cesty.',
  'help.guide.expense-currency.tip.1':
    'Kurz se zafixuje při uložení, takže vyrovnaný dluh se nezmění, když se kurz o týden později pohne. Nový kurz se uloží jen tehdy, když změníte měnu výdaje.',
  'help.guide.expense-currency.tip.2':
    '„Zobrazovaná měna“ v Nastavení mění jen to, jak se částky zobrazují. Uložené částky se nikdy nezmění. Pokud je prázdná, každá cesta se zobrazuje ve své vlastní měně.',
  'help.guide.expense-currency.tip.3':
    'Měna cesty se nastavuje přímo u cesty v „Upravit cestu“ a vyžaduje oprávnění „Upravit detaily výletu“. Když ji změníte, všechny zmrazené kurzy se přepočítají na novou měnu. Samotné částky se nepřevádějí.',
  // filter-costs
  'help.guide.filter-costs.title': 'Hledání výdaje nebo útraty za jeden den',
  'help.guide.filter-costs.goal': 'Zužte dlouhý seznam výdajů jen na to, co hledáte.',
  'help.guide.filter-costs.step.1':
    'Pište do pole „Hledat výdaje…“ na liště. Hledá v názvech výdajů už během psaní a klávesou Esc ho zase vymažete.',
  'help.guide.filter-costs.step.2':
    '„Filtr“, trychtýř vedle vyhledávání, otevře filtry. Přepínač nahoře je váš vlastní pohled na výdaje: „Vše“, „Zaplaceno mnou“ pro to, co jste platili vy, a „Dluží mi“ pro výdaje, kde jste zaplatili víc, než je váš podíl.',
  'help.guide.filter-costs.step.3':
    'V části „Kategorie“ vyberte jednu ze čtrnácti kategorií a zobrazí se jen výdaje této kategorie. Trychtýř ukazuje, kolik filtrů je zapnutých.',
  'help.guide.filter-costs.step.4':
    'V části „Den“ vyberte jeden ze dnů, kdy byly nějaké výdaje. Místo záhlaví dnů se zobrazí pruh s tímto dnem vypsaným celým, s počtem výdajů a jejich součtem.',
  'help.guide.filter-costs.step.5':
    '„Exportovat CSV“, ikona stažení vedle trychtýře, uloží všechny výdaje do souboru, s původní částkou, její měnou a přepočtenou částkou.',
  'help.guide.filter-costs.result':
    'Filtry můžete kombinovat a skupiny dnů se aktualizují i s vlastními součty pro zbývající výdaje.',
  'help.guide.filter-costs.tip.1':
    'Zaznamenané platby nemají název ani kategorii, takže je skryje vyhledávání, filtr kategorie i „Dluží mi“. Filtr dne je ponechá, a to pod dnem, kdy platba proběhla.',
  'help.guide.filter-costs.tip.2':
    '„Exportovat CSV“ vždy exportuje všechny výdaje, bez ohledu na filtr na obrazovce, jeden řádek za každý výdaj.',
  'help.guide.filter-costs.tip.3':
    '„Zrušit filtry“ dole v nabídce filtrů, které se objeví, jakmile je nějaký filtr zapnutý, vypne všechny filtry najednou.',
  // settle-up
  'help.guide.settle-up.title': 'Zjistit, kdo komu dluží, a vyrovnat dluhy',
  'help.guide.settle-up.goal':
    'Shrňte mnoho sdílených výdajů do co nejmenšího počtu převodů, které vyrovnají všechny dluhy, a zaznamenejte je, až proběhnou.',
  'help.guide.settle-up.step.1':
    'Karta „Vyrovnat“ v pravém sloupci uvádí převody, kterými by se vyrovnaly všechny dluhy: kdo komu platí, zobrazené jako dva avatary se jmény v popisku, a kolik. Číslo v záhlaví ukazuje, kolik jich je ještě otevřených.',
  'help.guide.settle-up.step.2':
    'Tlačítkem „Vyrovnat“ u převodu ho označíte jako provedený. Převod z karty zmizí a zůstatky se aktualizují.',
  'help.guide.settle-up.step.3':
    'Zaznamenaný převod je v přehledu řádkem pod dnem, kdy proběhl, s označením „Platba“, oběma cestujícími a částkou.',
  'help.guide.settle-up.step.4':
    'Vedle tohoto řádku tužkou platbu opravíte a „Vrátit zpět“ ji zruší; převod se pak vrátí na kartu „Vyrovnat“.',
  'help.guide.settle-up.step.5':
    '„Přidat platbu“ v záhlaví karty zaznamená převod, který neodpovídal žádnému návrhu. Vyberte „Od“ a „Do“, částku, měnu a den, kdy proběhl, případně přidejte „Poznámka“, třeba jak se platilo, a dole v dialogu klikněte na „Přidat platbu“.',
  'help.guide.settle-up.step.6':
    '„Vyrovnat“ na liště nahoře zaznamená všechny otevřené převody najednou, bez ptaní, třeba když skupina na konci cesty vyrovná všechny dluhy.',
  'help.guide.settle-up.result':
    'Každý zapsaný převod je řádek v přehledu výdajů a ubere jeden řádek z karty „Vyrovnat“. Když karta ukazuje „Všichni jsou vyrovnáni“, je cesta kompletně zaplacená.',
  'help.guide.settle-up.tip.1':
    'Karta ukazuje nejmenší počet převodů, ne každý dluh: pokud si tři lidé dluží navzájem dokola, zredukuje se to na jednu nebo dvě platby.',
  'help.guide.settle-up.tip.2':
    '„Vyrovnat“ převod jen zaznamená, peníze neposílá. Zaplaťte obvyklým způsobem a pak klikněte na „Vyrovnat“.',
  'help.guide.settle-up.tip.3':
    'Platit se dá v jakékoli měně, takže splatit dluh v jenech v eurech je úplně normální: dialog má vlastní výběr měny a i tento kurz zmrazí.',
  // final-budget
  'help.guide.final-budget.title': 'Kolik cesta stála jednotlivé cestující',
  'help.guide.final-budget.goal': 'Prohlédněte si údaje za každou osobu: dnešní zůstatek a skutečné náklady na osobu.',
  'help.guide.final-budget.step.1':
    '„Zůstatky“ ukazují stav každého cestujícího: zelený pruh doprava, když mu cesta dluží, červený pruh doleva, když dluží on, a částku vedle jména.',
  'help.guide.final-budget.step.2':
    '„Konečný rozpočet“ pod ní odpovídá na jinou otázku: ne kdo teď komu kolik dluží, ale kolik cesta každého cestujícího stojí, až se všechno vyrovná.',
  'help.guide.final-budget.step.3':
    'Kliknutím na jméno zobrazíte výpočet: „Zaplacené výdaje“ a pod tím „Náhrady netto“ a „Nevyřízené náhrady“.',
  'help.guide.final-budget.step.4':
    'Pod těmito třemi řádky je pod jménem každého cestovatele seznam položek, ze kterých se daný řádek skládá: výdaje, které cestovatel zaplatil, už zaznamenané převody a převody, které jsou ještě otevřené. Každý seznam dává v součtu přesně řádek se stejným názvem.',
  'help.guide.final-budget.result':
    '„Zůstatky“ ukazují, kdo má k dnešku dostat peníze a kdo je dluží. „Konečný rozpočet“ ukazuje, kolik vás cesta každého vyjde, až bude všechno vyrovnané.',
  'help.guide.final-budget.tip.1':
    'Zaznamenání platby nikomu nezmění konečný rozpočet. Jen přesune částku z čekajících náhrad do čistých náhrad.',
  'help.guide.final-budget.tip.2':
    'Výdaj bez plátce se nezapočítává do žádné z obou karet, stejně jako se nezapočítává do návrhů vyrovnání.',
  // expense-from-booking
  'help.guide.expense-from-booking.title': 'Převést rezervaci na výdaj',
  'help.guide.expense-from-booking.goal':
    'Připojte skutečnou cenu letu, hotelu nebo místa k záznamu, ke kterému patří.',
  'help.guide.expense-from-booking.step.1':
    'Najděte rezervaci na kartě „Doprava“ nebo „Rezervace“ a klikněte na tužku nahoře na její kartě.',
  'help.guide.expense-from-booking.step.2':
    'Sjeďte k části „Náklady“ u konce formuláře. Najdete tam „Vytvořit výdaj“, které nejdřív uloží rezervaci, a „Propojit stávající výdaj“ pro výdaj, který už v nákladech je.',
  'help.guide.expense-from-booking.step.3':
    'Klikněte na „Vytvořit výdaj“. Rezervace se uloží, formulář se zavře a otevře se editor nákladů s názvem rezervace jako názvem výdaje, kategorií podle typu rezervace a dnem rezervace jako dnem výdaje.',
  'help.guide.expense-from-booking.step.4':
    'Vyplňte částku a měnu, kdo platil a rozdělení jako u každého jiného výdaje, a klikněte na „Přidat výdaj“. Když rezervaci znovu otevřete, výdaj se zobrazí pod „Propojené výdaje“, s tužkou pro úpravu, s „Odpojit, výdaj ponechat“, které zruší propojení a výdaj zachová, a s košem pro smazání.',
  'help.guide.expense-from-booking.result':
    'Rezervace ukazuje svou cenu a výdaj je na kartě „Náklady“ běžný řádek s plátcem, rozdělením a měnou jako kterýkoli jiný.',
  'help.guide.expense-from-booking.tip.1':
    'Smazáním rezervace se smažou i propojené výdaje a dotaz na potvrzení vás na to upozorní. „Odebrat výdaj“ v bloku „Náklady“ u rezervace dělá opak: smaže výdaj a rezervaci ponechá. „Odpojit, výdaj ponechat“ ponechá obojí.',
  'help.guide.expense-from-booking.tip.2':
    'Místo má ve svém formuláři stejný blok; „Vytvořit výdaj“ tam nejdřív uloží místo.',
  // costs-table
  'help.guide.costs-table.title': 'Plánování nákladů v tabulce',
  'help.guide.costs-table.goal':
    'Prohlížejte a upravujte výdaje v tabulce, seřazené podle kategorií a přepočtené na osobu a den.',
  'help.guide.costs-table.step.1':
    'Klikněte na „Tabulka“, druhou ikonu přepínače „Seznam / Tabulka“ na liště. Místo přehledu výdajů se zobrazí tabulka se stejnými výdaji a vyhledávání i filtry platí i pro ni.',
  'help.guide.costs-table.step.2':
    'Tabulka je seskupená podle kategorií. Záhlaví každé skupiny ukazuje její název, počet výdajů a mezisoučet; kliknutím na záhlaví skupinu sbalíte. Sloupce jsou „Název“, „Datum“, „Celkem“, „Osoby“ a „Dní“ a pak z nich vypočítané „Na osobu“, „Za den“ a „Os. / den“ na šedém pozadí. Řádek „Celkem“ dole vše sečte.',
  'help.guide.costs-table.step.3':
    'Kliknutím na buňku ji změníte přímo: název, celkovou částku, „Osoby“ nebo „Dní“. Napište hodnotu a uložte ji klávesou Enter nebo kliknutím jinam, klávesou Esc úpravu zrušíte; u data se otevře kalendář. „Na osobu“ a ostatní počítané sloupce se hned aktualizují.',
  'help.guide.costs-table.step.4':
    'Částku se zámkem tu změnit nejde: buď ji někdo zaplatil, nebo byla zadaná v jiné měně, a popisek uvádí, co z toho platí. Kliknutím se místo toho otevře výdaj, aby zůstatky i pevný směnný kurz zůstaly správné.',
  'help.guide.costs-table.step.5':
    '„Přidat výdaj“ na konci kategorie do ní přidá řádek s názvem „Nová položka“ a datem nejnovější položky v kategorii. Pole s názvem je už otevřené, takže ho můžete hned změnit. Celkovou částku zadáte stejně.',
  'help.guide.costs-table.step.6':
    'V tomto zobrazení ukazuje pravý sloupec místo „Podle kategorie“ „Souhrn“. Ten sčítá výdaje čtyřmi způsoby: podle kategorie, dne, plátce (nezaplacené pod „Zatím bez plátce“) a stavu („Zaplaceno“ oproti „Nezaplaceno“).',
  'help.guide.costs-table.result':
    'Každý výdaj je ve své kategorii s částkou na osobu a na den. Když v buňce změníte celkovou částku, karty nahoře i „Souhrn“ se okamžitě aktualizují.',
  'help.guide.costs-table.tip.1':
    '„Náklady“ si v tomto prohlížeči pamatují zobrazení: otevírají se v tabulce, dokud znovu nekliknete na „Seznam“.',
  'help.guide.costs-table.tip.2':
    'Výdaj rozdělený jako „Vlastní“ nebo „Účtenka“ nemá jednotný podíl na osobu, proto u něj „Na osobu“ a „Os. / den“ zůstanou prázdné.',
  'help.guide.costs-table.tip.3':
    'Plátce, rozdělení, poznámku a účtenky upravíte přímo ve výdaji: v nabídce „Další možnosti“ na konci řádku je „Upravit“ a také „Smazat“, které řádek odstraní.',

  // ── Screen: trip-transports ───────────────────────────────────────────────────────────
  'help.ctx.trip-transports.title': 'Doprava',
  'help.ctx.trip-transports.summary':
    'Všechny způsoby, jak se dostanete mezi zastávkami: lety, vlaky, autobusy, auta, taxi, kola, plavby, trajekty, lanovky a spojení veřejné dopravy, která pro vás TREK vyhledá. Karta je vypisuje. Vytvářet a prohlížet je můžete i v plánu a zobrazují se na mapě.',
  'help.ctx.trip-transports.bullet.1':
    'Karta ukazuje jen jízdy. Ubytování, restaurace, akce a vstupenky jsou na kartě „Rezervace“, takže se stejný záznam nikdy nezobrazí dvakrát.',
  'help.ctx.trip-transports.bullet.2':
    'Lišta nahoře obsahuje „Hledat“, „Filtr“ pro stav, typy a cestující, tři zobrazení „Karty“, „Seznam“ a „Časová osa“, „Možnosti zobrazení“ a „Exportovat jako tabulku (CSV)“, které stáhne zobrazený obsah. „Doprava“ vpravo přidá jízdu ručně. Ikony před ním, „Importovat potvrzení rezervace“ a „Import z AirTrail“, se zobrazí, když server umí číst potvrzení nebo je připojený AirTrail. Na prázdné kartě jsou stejné akce uprostřed jako „Doprava“, „Importovat ze souboru“ a AirTrail.',
  'help.ctx.trip-transports.bullet.3':
    'Karta se otevírá v zobrazení „Karty“: nejdřív „Potvrzeno“, pak „Čeká na potvrzení“. Každou sekci můžete sbalit kliknutím na její nadpis. Naplánovaná spojení veřejnou dopravou nemají stav a zobrazují se mezi potvrzenými jízdami v časovém pořadí, pokud jim „Možnosti zobrazení“ nedají vlastní sekci, „Automatické spojení MHD“. „Seznam“ seskupuje podle dnů a „Časová osa“ ukazuje všechny jízdy přes všechny dny cesty.',
  'help.ctx.trip-transports.bullet.4':
    'Horní pruh karty je obarvený podle stavu: zeleně u potvrzené, oranžově u čekající, modře u naplánovaného spojení. Ukazuje stavovou tečku, typ, název, tužku a koš. Pod ním: „Datum“, „Čas“, „Rezervační kód“, „Trasa“ a letecká společnost s číslem letu, nebo číslo vlaku, nástupiště a sedadlo. Kliknutím na kartu otevřete její podrobnosti.',
  'help.ctx.trip-transports.bullet.5':
    'Dopravu můžete vytvářet i v plánu: + v záhlaví dne (s popiskem „Přidat ke dni“) nebo pravé tlačítko na záhlaví nabízí „Přidat dopravu“ a „Veřejná doprava“. Spojnice s dobou cesty mezi dvěma zastávkami otevře stejné hledání pro tento jeden úsek.',
  'help.ctx.trip-transports.bullet.6':
    'Doprava s nastaveným začátkem i cílem vykreslí na mapě čáru. Tuto čáru zapnete ikonou trasy na jejím řádku v plánu dne a volbou „Na mapě“ v jejích podrobnostech. „Zobrazit všechny trasy rezervací“ na liště nad dny zapne nebo vypne čáry celé cesty.',
  // transports-list
  'help.guide.transports-list.title': 'Jak číst kartu „Doprava“',
  'help.guide.transports-list.goal': 'Pochopte, co seznam ukazuje, ještě než v něm něco změníte.',
  'help.guide.transports-list.step.1':
    '„Doprava“ je karta cesty za „Plán“ (a za „Výlety“, když je ten doplněk zapnutý). Obsahuje jen jízdy: hotely, restaurace, akce a vstupenky jsou na kartě „Rezervace“.',
  'help.guide.transports-list.step.2':
    'Pole „Hledat“ vlevo na liště filtruje jízdy už při psaní. „Filtr“, nálevka vedle, otevře možnosti: „Stav“ s volbami „Vše“, „Potvrzeno“ a „Čeká na potvrzení“, pak každý použitý typ s počtem. Zaškrtněte jeden nebo více typů a zobrazí se jen ty. Číslo na nálevce ukazuje, kolik filtrů je aktivních, a lišta ukazuje, kolik jízd se zobrazuje, například 1 z 4. „Zrušit filtry“ dole v nabídce opět zobrazí všechny jízdy.',
  'help.guide.transports-list.step.3':
    '„Karty“, „Seznam“ a „Časová osa“ vedle něj zobrazí dopravu jako karty, jako řádky seskupené podle dne, nebo jako pruhy přes dny cesty. „Možnosti zobrazení“, ikona s posuvníky, nastaví „Seskupit podle“ a „Seřadit podle“ pro Karty a Seznam a pruhy pro Časovou osu. „Obnovit zobrazení“ vrátí výchozí nastavení. V zobrazení Karty ukáže volba „MHD jako samostatná sekce“ naplánovaná spojení pod „Automatické spojení MHD“.',
  'help.guide.transports-list.step.4':
    'Na každé kartě jsou všechny údaje. Pruh nahoře je zelený u stavu „Potvrzeno“ a oranžový u stavu „Čeká na potvrzení“ a ukazuje tečku stavu, typ a název. Pod ním „Datum“ uvádí dny, přes které doprava vede, i s daty. Pak následuje „Čas“, „Rezervační kód“, „Trasa“ s ikonou typu mezi zastávkami a letecká společnost s číslem letu, nebo číslo vlaku, nástupiště a místo. Kliknutím na kartu otevřete podrobnosti.',
  'help.guide.transports-list.step.5':
    'Kliknutím na tečku stavu přepnete jízdu mezi „Čeká na potvrzení“ a „Potvrzeno“; popisek ukazuje směr, například „Nastavit na Čeká na potvrzení“. Tužka v záhlaví otevře formulář dopravy a koš ji smaže po dotazu „Smazat rezervaci?“, který vypíše, co se smaže, včetně propojených nákladů.',
  'help.guide.transports-list.result':
    'Na každé kartě je vidět, jestli je jízda zarezervovaná, a lištou můžete seznam kdykoli filtrovat nebo řadit.',
  'help.guide.transports-list.tip.1':
    'Karta si pamatuje vaše nastavení: zobrazení, seskupení a řazení v tomto prohlížeči, sbalené sekce pro každou cestu a filtry, dokud nezavřete kartu prohlížeče.',
  'help.guide.transports-list.tip.2':
    '„Importovat potvrzení rezervace“ a „Import z AirTrail“, dvě ikony před tlačítkem „Doprava“, se zobrazí, jen když server umí číst potvrzení a když je připojená instance AirTrail. Bez nich seznam plníte ručně nebo vyhledáváním spojů veřejné dopravy.',
  // add-transport
  'help.guide.add-transport.title': 'Přidat dopravu ke dni',
  'help.guide.add-transport.goal': 'Přidejte dopravu z jedné zastávky na další ke dni, kdy se uskuteční.',
  'help.guide.add-transport.step.1':
    'V záhlaví dne, kdy jízda proběhne, klikněte na + s popiskem „Přidat ke dni“ a zvolte „Přidat dopravu“. Stejnou nabídku otevře i pravé tlačítko na záhlaví dne. Formulář se otevře s tímto dnem už vyplněným.',
  'help.guide.add-transport.step.2':
    'Pilulka typu v záhlaví ukazuje druh dopravy, ve výchozím stavu „Let“. Kliknutím zvolíte „Let“, „Vlak“, „Autobus“, „Auto“, Taxi, „Kolo“, „Plavba“, „Trajekt“, „Lanovka“ nebo „Ostatní“ a formulář se přizpůsobí: let dostane letiště u každé zastávky, vlak řetězec stanic, plavba „Nalodění“, „Přístav“ a „Vylodění“, auto „Vyzvednutí“, „Vrácení“ a „Zastávky po cestě“.',
  'help.guide.add-transport.step.3':
    'Napište název přímo do horního pruhu, kde je šedý ukázkový text. Je to jediné povinné pole: dokud ho nevyplníte, je pod ním řádek „Název *“ a tlačítko „Přidat“ zůstává šedé. Zvolte název, který byste poznali na odjezdové tabuli.',
  'help.guide.add-transport.step.4':
    'V sekci „Trasa“ zadejte do polí „Od“ a „Do“ stanici, přístav nebo adresu. Místa z cesty se nabídnou, ještě než začnete psát. Pro hledání napište alespoň tři písmena a vyberte výsledek. Název, který jen napíšete a nevyberete z výsledků, se neuloží a na mapě se nic nezobrazí.',
  'help.guide.add-transport.step.5':
    '„Datum“ a „Čas začátku“ určují, kdy jízda začíná, „Datum konce“ a „Čas konce“, kdy končí; u jízdy, která přijíždí až další den, tam nastavte další den. „Rezervační kód“ a „Poznámky“ níže jsou nepovinné. Kliknutím na pilulku „Čeká na potvrzení“ v záhlaví ji změníte na „Potvrzeno“.',
  'help.guide.add-transport.step.6': 'Klikněte na „Přidat“.',
  'help.guide.add-transport.result':
    'Doprava se objeví jako řádek ve dni, ve svém čase mezi zastávkami, a jako karta na kartě „Doprava“ v části „Čeká na potvrzení“ nebo „Potvrzeno“.',
  'help.guide.add-transport.tip.1':
    'Řádek se zařadí podle času začátku, za poslední zastávku, která začíná dřív. Za úchyt ho můžete přetáhnout jinam v rámci dne nebo na jiný den.',
  'help.guide.add-transport.tip.2':
    'Jízdenku přidáte přes „Přiložit soubor“ v části „Soubory“. „Vytvořit výdaj“ v části „Náklady“ uloží rezervaci a otevře editor nákladů pro jízdné.',
  'help.guide.add-transport.tip.3':
    '„Cestující“, první blok formuláře, určuje, kdo touto dopravou jede. Jakmile má cesta víc než jednoho člena a u některé dopravy je někdo uvedený, nabídne „Filtr“ na kartě také „Cestující“, který zobrazí dopravu jen jednoho člověka.',
  // import-transport-file
  'help.guide.import-transport-file.title': 'Import letu z elektronické letenky',
  'help.guide.import-transport-file.goal':
    'Nechte TREK načíst let, vlak nebo trajekt z jízdenky, kterou poslal dopravce, a zkontrolujte ji, než se uloží.',
  'help.guide.import-transport-file.step.1':
    'Na liště karty „Doprava“ klikněte na ikonu stažení před „Doprava“ s popiskem „Importovat potvrzení rezervace“. Otevře se dialog stejného názvu, jaký má i karta „Rezervace“. Na prázdné kartě udělá totéž „Importovat ze souboru“ uprostřed.',
  'help.guide.import-transport-file.step.2':
    'Přetáhněte jízdenku do pole, nebo na pole klikněte a vyberte soubor: EML, PDF, PKPass, HTML a TXT, až pět souborů po 10 MB, a fotky jízdenky (JPG, PNG, WEBP), pokud má váš server AI model, který je umí přečíst. V poli se zobrazí názvy vybraných souborů.',
  'help.guide.import-transport-file.step.3':
    'Klikněte na „Importovat“. Dialog se okamžitě zavře a soubor se načte na pozadí.',
  'help.guide.import-transport-file.step.4':
    'Karta vpravo dole ukazuje pod názvem souboru průběh. Po dokončení načítání se „Zpracování souborů…“ změní na zaškrtnutí a karta nabídne „Importovat“. Klikněte na tlačítko.',
  'help.guide.import-transport-file.step.5':
    'Let se otevře v „Přidat dopravu“, už vyplněný: štítek typu na „Let“, letecká společnost a číslo letu jako název v záhlaví, obě letiště v části „Trasa“ s „Odlet“ a „Přílet“, jejich časy a časová pásma, „Letecká společnost“ a „Číslo letu“, „Rezervační kód“ a letenka v části „Soubory“. Vše zkontrolujte a klikněte na „Přidat“.',
  'help.guide.import-transport-file.result':
    'Let se zobrazí jako karta v části „Čeká na potvrzení“ na kartě „Doprava“ a jako řádek ve dni odletu, s letenkou v části „Soubory“. Když jsou známá obě letiště, let se na mapě vykreslí jako oblouk.',
  'help.guide.import-transport-file.tip.1':
    'Obě karty používají stejný import. Soubor, který obsahuje let i hotel, otevře let v „Přidat dopravu“ a potom hotel v „Nová rezervace“, bez ohledu na to, ze které karty jste začali.',
  'help.guide.import-transport-file.tip.2':
    'Letiště se umisťují podle kódu. Pokud se nepodařilo najít stanici nebo přístav, je jeho název na kartě importu vpravo dole oranžově. Než kliknete na „Přidat“, vyberte ho ručně v sekci „Trasa“, jinak se doprava na mapě nezobrazí.',
  // plan-transit
  'help.guide.plan-transit.title': 'Plánování spojení veřejnou dopravou',
  'help.guide.plan-transit.goal':
    'Nechte TREK vyhledat skutečné vlaky a autobusy mezi dvěma body dne a vložte do plánu ten, který si vyberete.',
  'help.guide.plan-transit.step.1':
    'Klikněte na + v záhlaví dne a zvolte „Veřejná doprava“. Pro tento den se otevře vyhledávání: den je v záhlaví zobrazený jako štítek a volby „Ručně“ a „Automaticky“ vedle něj přepínají mezi tímto vyhledáváním a běžným formulářem.',
  'help.guide.plan-transit.step.2':
    'Do polí „Od“ a „Do“ zadejte zastávku nebo stanici. Dokud je pole prázdné, TREK nabízí ubytování daného dne, stanice a letiště z rezervací toho dne a vlastní zastávky dne. Jakmile napíšete dvě písmena, hledá místo toho ve stanicích jízdního řádu. „Prohodit“ mezi oběma poli prohodí „Od“ a „Do“.',
  'help.guide.plan-transit.step.3':
    '„Odjezd“ nebo „Příjezd“ s časem určuje, kdy chcete cestovat, a „Nejlepší spojení“, „Méně přestupů“ nebo „Méně chůze“ určuje, jak se mají výsledky seřadit.',
  'help.guide.plan-transit.step.4':
    'Štítky níže ukazují, které druhy dopravy lze použít: „Vlak“, „Metro“, „Tramvaj“, „Autobus“, „Trajekt“ a „Lanovka“. Vypnutím štítku daný druh vyloučíte; alespoň jeden zůstane zapnutý. Pak klikněte na „Hledat“.',
  'help.guide.plan-transit.step.5':
    'U každého výsledku vidíte odjezd a příjezd, dobu cesty, počet přestupů a kolik se jde pěšky, a linky jako odznaky, v jejich vlastních barvách, pokud je jízdní řád uvádí. Kliknutím výsledek rozbalíte a uvidíte jednotlivé úseky se zastávkami, kde nastupujete a přestupujete, s nástupišti a s přechody pěšky mezi linkami.',
  'help.guide.plan-transit.step.6': 'Klikněte na „Přidat ke dni“.',
  'help.guide.plan-transit.result':
    'Spojení je řádkem ve dni s odznaky linek. Kliknutím na šipku zobrazíte jednotlivé úseky. Na kartě „Doprava“ je také jako karta mezi potvrzenými jízdami, zobrazená modře.',
  'help.guide.plan-transit.tip.1':
    'Spojení pocházejí z Transitous, bezplatné komunitní služby, která využívá veřejná data jízdních řádů: bez klíče, bez účtu. Správce může nastavit, aby se místo toho hledalo přes Google.',
  'help.guide.plan-transit.tip.2':
    'Nic nenalezeno? Zdroje dat pokrývají určitý region a období. Zkuste jiný čas, zapněte víc druhů dopravy nebo vyberte stanici místo samotného místa. Zpráva uvádí službu, která odpověděla. Cesta bez dat nemá den, ve kterém by se dalo hledat, a nabízí proto jen běžný formulář.',
  'help.guide.plan-transit.tip.3':
    'Stejné vyhledávání otevřete i pro jediný úsek: klikněte na spojnici s dobou cesty mezi dvěma zastávkami a zvolte „Veřejná doprava“. „Odkud“, „Kam“ a čas odjezdu se vyplní za vás.',
  // change-transit-route
  'help.guide.change-transit-route.title': 'Otevřít a změnit naplánované spojení',
  'help.guide.change-transit-route.goal':
    'Projděte spojení linku po lince, přejmenujte ho, nebo trasu vyhledejte znovu.',
  'help.guide.change-transit-route.step.1':
    'Na kartě „Doprava“ je naplánované spojení karta s modrým horním pruhem, seřazená podle času mezi potvrzenou dopravou. Když je v „Možnosti zobrazení“ zapnutá volba „MHD jako samostatná sekce“, zobrazí se místo toho pod „Automatické spojení MHD“. Klikněte na kartu. Spojení se otevře jako rezervace.',
  'help.guide.change-transit-route.step.2':
    'Dlaždice nahoře ukazují odjezd a příjezd se zastávkami, „Doba trvání“, „Přestupy“ a „Pěšky“. Pod nimi „Itinerář“ rozepisuje spojení linku po lince, s časy, nástupišti a pěšími přesuny mezi linkami.',
  'help.guide.change-transit-route.step.3':
    '„Změnit trasu“ dole v rezervaci znovu otevře vyhledávání, už vyplněné oběma konci spojení a jeho dnem.',
  'help.guide.change-transit-route.step.4':
    'Klikněte na „Hledat“, otevřete jiné spojení a klikněte na „Přidat ke dni“; nahradí původní. „Upravit“ úplně vpravo dole v rezervaci místo toho otevře běžný formulář dopravy, kde můžete upravit „Rezervační kód“, cestující, poznámky a soubory.',
  'help.guide.change-transit-route.result':
    'Spoj teď používá nový itinerář a jeho karta na kartě „Doprava“ ukazuje nové linky a časy.',
  'help.guide.change-transit-route.tip.1':
    'Kliknutím na název v záhlaví rezervace spojení přejmenujete, aniž by se změnila trasa. Poznámky k němu píšete ve formuláři dopravy, který otevře „Upravit“.',
  'help.guide.change-transit-route.tip.2': 'Koš dole v rezervaci po potvrzení spojení smaže; zastávky dne zůstanou.',
  // leg-travel-mode
  'help.guide.leg-travel-mode.title': 'Změna způsobu dopravy na jednom úseku',
  'help.guide.leg-travel-mode.goal':
    'Nastavte jeden úsek dne, který jinak jedete autem, na chůzi, nebo ho naplánujte přes vyhledávání veřejné dopravy.',
  'help.guide.leg-travel-mode.step.1':
    'Spojnice mezi zastávkami se zobrazí, až je zapnutá trasa dne. Kliknutím na záhlaví den otevřete a pak v liště pod jeho zastávkami klikněte na „Trasa“.',
  'help.guide.leg-travel-mode.step.2':
    'Každá spojnice ukazuje dobu cesty a vzdálenost daného úseku s ikonou způsobu dopravy, pro který byl naplánován: auto pro jízdu autem, chodidlo pro chůzi, kolo pro jízdu na kole.',
  'help.guide.leg-travel-mode.step.3':
    'Klikněte na spojnici. Nabídka nabízí „Auto“, „Pěšky“ a „Kolo“, „Veřejná doprava“ pro tento jeden úsek a „Použít výchozí dne“.',
  'help.guide.leg-travel-mode.step.4':
    'Zvolte „Pěšky“. Změní se jen tento úsek; zbytek dne si ponechá svůj způsob dopravy.',
  'help.guide.leg-travel-mode.result':
    'Úsek ukazuje ikonu chodce a dobu chůze, ostatní úseky dne si ponechají způsob dopravy nastavený pro den.',
  'help.guide.leg-travel-mode.tip.1':
    'Způsob dopravy patří k úseku, ne ke dni: tlačítka „Auto“, „Pěšky“ a „Kolo“ pro celý den nikdy nepřepíšou úsek, který jste nastavili ručně. „Použít výchozí dne“ zajistí, že se úsek bude znovu řídit těmito tlačítky.',
  'help.guide.leg-travel-mode.tip.2':
    '„Veřejná doprava“ ve stejné nabídce otevře vyhledávání spojení přesně pro tento úsek, s oběma konci a časem odjezdu už vyplněnými.',
  'help.guide.leg-travel-mode.tip.3':
    'Časy počítá veřejný plánovač tras po skutečných silnicích a stezkách. Pokud úsek spočítat nedokáže, zůstane úsek jako přímá čára bez času.',
  // edit-transport
  'help.guide.edit-transport.title': 'Úprava nebo smazání dopravy',
  'help.guide.edit-transport.goal': 'Opravte čas, nástupiště nebo rezervační kód, nebo dopravu z cesty odeberte.',
  'help.guide.edit-transport.step.1':
    'V denním plánu je doprava řádek mezi zastávkami, obarvený podle typu. Kliknutím otevřete její rezervaci: nahoře jako pilulky stav, typ, dny a „Rezervační kód“ (s tlačítkem pro zkopírování), níže časy odjezdu a příjezdu s letišti nebo stanicemi.',
  'help.guide.edit-transport.step.2':
    '„Upravit“ dole v rezervaci otevře formulář, ve kterém vznikla, s nápisem „Upravit dopravu“ nad názvem v záhlaví. Změnit tam můžete vše: název, pilulky stavu a typu, trasu, dny a časy i „Rezervační kód“.',
  'help.guide.edit-transport.step.3':
    'Trasa letu je řetězec letišť, trasa vlaku řetězec stanic a trasa plavby řetězec přístavů. „Přidat zastávku“ („Přidat přístav“ u plavby) vloží mezi ně další a každý úsek si zachová vlastní časy a vlastní číslo letu nebo vlaku.',
  'help.guide.edit-transport.step.4':
    'Klikněte na „Aktualizovat“. Pokud chcete dopravu úplně odstranit, použijte koš vlevo na stejné liště, koš dole v její rezervaci nebo koš na její kartě na kartě „Doprava“ a potvrďte.',
  'help.guide.edit-transport.result':
    'Změna se projeví všude, kde se doprava zobrazuje: na kartě „Doprava“, ve dni, kdy se jede, i na její čáře na mapě.',
  'help.guide.edit-transport.tip.1':
    'Stejný formulář se otevírá ze dvou míst: přes „Upravit“ v rezervaci, která se otevře z řádku plánu dne, a přes tužku na kartě na záložce „Doprava“. Naplánované spojení veřejnou dopravou se také otevře jako rezervace. „Změnit trasu“ v ní znovu otevře vyhledávání a „Upravit“ tento formulář.',
  'help.guide.edit-transport.tip.2':
    'K přesunu dopravy na jiný den formulář nepotřebujete: přetáhněte její řádek z karty jednoho dne na druhou.',
  // transport-on-map
  'help.guide.transport-on-map.title': 'Zobrazení dopravy na mapě',
  'help.guide.transport-on-map.goal': 'Podívejte se, kudy skutečně vede let, jízda nebo spojení.',
  'help.guide.transport-on-map.step.1':
    'Doprava s oběma zadanými konci má na svém řádku v denním plánu malou ikonu trasy. Klikněte na ni; její popisek se změní na „Skrýt trasy rezervací“.',
  'help.guide.transport-on-map.step.2':
    'Trasa se zobrazí na mapě a na každém konci má značku ve tvaru pilulky s ikonou dopravy.',
  'help.guide.transport-on-map.step.3':
    'Klikněte na koncovou značku a nad mapou se otevře rezervace. V záhlaví vidíte stav, typ, dny a „Rezervační kód“. Pod nimi jsou časy s letišti nebo stanicemi, letecká společnost a číslo letu. Zavřete ji tlačítkem „Uzavřít“ v záhlaví.',
  'help.guide.transport-on-map.step.4':
    'Ikona trasy na liště nad dny funguje pro celou cestu najednou: „Zobrazit všechny trasy rezervací“ a „Skrýt všechny trasy rezervací“ pro jejich opětovné skrytí.',
  'help.guide.transport-on-map.step.5':
    'Naplánované spojení veřejnou dopravou nemá vlastní ikonu trasy. Vykresluje se přepínačem „Trasa“ daného dne, takže ho „Skrýt všechny trasy rezervací“ neskryje, dokud je trasa toho dne zapnutá.',
  'help.guide.transport-on-map.result':
    'Trasy se zobrazí na mapě se značkou na každém konci a zůstanou tam, dokud je nevypnete.',
  'help.guide.transport-on-map.tip.1':
    'Let, plavba a trajekt se vykreslí jako oblouk. Auto, autobus, taxi a kolo jedou po skutečných silnicích. Vlak nebo naplánované spojení vede přes stanice, kde zastavuje.',
  'help.guide.transport-on-map.tip.2':
    'Potvrzená rezervace má plnou čáru, čekající čárkovanou. Nastavení „Popisky tras rezervací“ ukáže v koncových značkách kód letiště nebo název stanice.',
  'help.guide.transport-on-map.tip.3':
    '„Zobrazit všechny trasy rezervací“ nic nepřidává k trasám, které už zobrazujete: nahradí nastavení jednotlivých ikon. Po jeho stisknutí jsou všechny trasy buď zobrazené, nebo skryté.',
  // airtrail-import
  'help.guide.airtrail-import.title': 'Importovat lety z AirTrail',
  'help.guide.airtrail-import.goal':
    'Naimportujte do cesty najednou lety, které už máte v AirTrail, a nechte je pak z AirTrail průběžně aktualizovat.',
  'help.guide.airtrail-import.step.1':
    'Když je zapnutý doplněk AirTrail a vaše instance je připojená v Nastavení v části „Integrace“, zobrazí se na liště karty „Doprava“ před tlačítkem „Doprava“ ikona letadla „Import z AirTrail“. Klikněte na ni.',
  'help.guide.airtrail-import.step.2':
    '„Import z AirTrail“ zobrazí lety z vašeho účtu ve dvou skupinách. „Během tohoto výletu“ obsahuje lety s datem v rámci cesty, už zaškrtnuté. „Ostatní lety“ obsahuje zbytek, nezaškrtnutý. Let, který už v cestě je, je zašedlý a označený „Importováno“.',
  'help.guide.airtrail-import.step.3':
    'Každý řádek je zaškrtávací políčko s leteckou společností a číslem letu, oběma letišti a datem. Kliknutím na řádek let zahrnete nebo vynecháte. Lety v sekci „Ostatní lety“ se importují, jen když je zaškrtnete.',
  'help.guide.airtrail-import.step.4':
    'Navazující lety jsou seskupené: každý odlétá z letiště, kde předchozí přistál, a to do jednoho dne. Zaškrtávací políčko pod nimi, „Importovat jako jeden let s přestupem v tom letišti“, je už zapnuté. Nechte ho zapnuté pro jednu rezervaci s přestupem, nebo ho vypněte, pokud chcete úseky importovat jako samostatné lety.',
  'help.guide.airtrail-import.step.5':
    'Klikněte na tlačítko vpravo dole, které ukazuje počet zaškrtnutých letů, například „Importovat 2“. Zpráva pak uvede, kolik letů se importovalo.',
  'help.guide.airtrail-import.step.6':
    'Lety se zobrazí jako karty v části „Potvrzeno“, každá s modrým štítkem AirTrail vedle názvu, a jako řádky ve dnech, kdy letí. Let s přestupem je jedna karta a jeho trasa vede přes místo přestupu.',
  'help.guide.airtrail-import.result':
    'Lety z AirTrail se zobrazí jako karty na záložce „Doprava“ a jako řádky ve svých dnech, každý se štítkem AirTrail, který ukazuje, odkud pochází.',
  'help.guide.airtrail-import.tip.1':
    'Let, který už v cestě je se stejným číslem a datem, se přeskočí a zpráva uvede, kolik letů bylo přeskočeno. Šipka zpět v liště nástrojů nad dny vrátí celý import.',
  'help.guide.airtrail-import.tip.2':
    'Hlavním zdrojem dat zůstává AirTrail. TREK načítá jeho změny, když cestu otevřete, a každých pár minut na pozadí. Let smazaný v AirTrailu si v TREKu ponechá kartu a její štítek se změní na „Nesynchronizováno“. Úpravy provedené v TREKu se do AirTrailu odešlou jen tehdy, když je v Integracích zapnuté „Zapisovat změny zpět do AirTrail“.',
  'help.guide.airtrail-import.tip.3':
    'Spojený přestup není jeden let v AirTrailu, který by šlo synchronizovat, takže jde o jednorázový import: zůstane mu modrý štítek, a když na něj najedete, dozvíte se to. Totéž se stane se synchronizovaným letem, když mu ručně přidáte mezipřistání.',

  // ── Screen: trip-roadtrip ─────────────────────────────────────────────────────────────
  'help.ctx.trip-roadtrip.title': 'Cesta autem',
  'help.ctx.trip-roadtrip.summary':
    'Plán zobrazený jako jedna jízda: stejné dny a stejná místa, propojená jako zastávky s jízdou mezi nimi, v pásu v levém sloupci a na mapě. Ukazuje vzdálenost a dobu jízdy, kde je potřeba natankovat a co je po cestě.',
  'help.ctx.trip-roadtrip.bullet.1':
    '„Dny“ a „Cesta autem“ nahoře v levém sloupci přepínají mezi plánem dnů a jízdou. Nic se nekopíruje ani nemění: „Dny“ ukazují plán přesně takový, jaký byl.',
  'help.ctx.trip-roadtrip.bullet.2':
    'Nahoře na liště jsou součty za cestu: „Vzdálenost“, „Doba jízdy“ a „Zastávky“. Pod nimi je karta pro každý den s jízdou: číslo a datum dne na dlaždici, pak pilulky s kilometry a dobou jízdy, počtem zastávek, tím, co jízda přejíždí, a odznakem „Stopa“. Zarezervovaný let, vlak nebo trajekt je ve sledu jako samostatná karta.',
  'help.ctx.trip-roadtrip.bullet.3':
    'Očíslovaná zastávka je místo, kvůli kterému daný den jedete. Zastávka po cestě, například tankování, nabíjení nebo odpočívadlo, má místo čísla ikonu svého druhu a nezapočítává se. Kliknutím na číslo změníte, o jakou zastávku jde, kliknutím na odznak pobytu nastavíte, jak dlouho zůstanete, a přetažením zastávku posunete v rámci dne nebo na jiný den.',
  'help.ctx.trip-roadtrip.bullet.4':
    'Mezi dvěma zastávkami ukazuje pruh jízdy vzdálenost a čas úseku. Kliknutím na něj otevřete „Trasy tohoto úseku“, nebo klikněte na trasu na mapě a veďte úsek přes průjezdní bod.',
  'help.ctx.trip-roadtrip.bullet.5':
    'Pravý sloupec se změní na „Na trase“: na jednom řádku vyberte, co hledáte, a den, pak šířku koridoru a klikněte na „Hledat“. Plusem u výsledku, „Přidat“, ho přidáte do jízdy v místě, kudy skutečně projíždíte, a ikonou postele u hotelu přidáte nocleh. „Ručně“ přidá místo, které hledání nenašlo, a třemi tečkami vedle názvu importujete trasu z Google Maps.',
  'help.ctx.trip-roadtrip.bullet.6':
    '„Nastavení jízdy“ pod ním obsahuje limity, auto a jeho dojezd, denní časy jízdy, čemu se vyhnout, jak se kreslí linie a zda se na mapě zobrazují aktuální varování. Patří k cestě, takže všichni plánují se stejným autem.',
  // roadtrip-mode
  'help.guide.roadtrip-mode.title': 'Cesta jako jedna jízda',
  'help.guide.roadtrip-mode.goal': 'Přepněte plán do režimu jízdy autem a zjistěte, co lišta ukazuje.',
  'help.guide.roadtrip-mode.step.1':
    'Nahoře v levém sloupci klikněte v přepínači „Dny“ a „Cesta autem“ na „Cesta autem“. Denní plán nahradí jízda a mapa ukáže každý den, který má trasu.',
  'help.guide.roadtrip-mode.step.2':
    'Karta nahoře na liště sčítá celou cestu: „Vzdálenost“, „Doba jízdy“ a „Zastávky“. Při posouvání dnů zůstává na místě.',
  'help.guide.roadtrip-mode.step.3':
    'Pod ní je karta pro každý den s jízdou; den bez jízdy se vynechá. Záhlaví karty ukazuje číslo dne a pod ním datum, pak pilulky se vzdáleností a dobou jízdy a s počtem zastávek v daném dni.',
  'help.guide.roadtrip-mode.step.4':
    'Uvnitř karty je den zobrazený jako sled: očíslovaná zastávka pro každé místo, úsek jízdy mezi každou dvojicí a čas příjezdu u pravého okraje. Zarezervovaný let, vlak nebo trajekt je v tomto sledu jako samostatná karta.',
  'help.guide.roadtrip-mode.step.5':
    'Kliknutím na záhlaví dne ho sbalíte; šipka na jeho konci se otočí. Sbalený den se skryje i na mapě. Dalším kliknutím na záhlaví ho znovu zobrazíte.',
  'help.guide.roadtrip-mode.result':
    'V levém sloupci je jízda a mapa ukazuje všechny její dny. Tlačítko „Dny“ vás vrátí rovnou zpět k plánu, beze změn.',
  'help.guide.roadtrip-mode.tip.1':
    'Volba se ukládá pro každou cestu zvlášť k vašemu účtu, takže po obnovení stránky, v jiném prohlížeči i na jiném zařízení se cesta znovu otevře v zobrazení „Cesta autem“.',
  'help.guide.roadtrip-mode.tip.2':
    'Přepínač se zobrazí, až správce zapne doplněk „Cesta autem“ v části „Doplňky“ v administraci.',
  'help.guide.roadtrip-mode.tip.3':
    'Na telefonu žádný přepínač není: doplněk přidá vlastní kartu „Cesta autem“ vedle „Plán“.',
  // roadtrip-stops
  'help.guide.roadtrip-stops.title': 'Zastávky po cestě a délka pobytu',
  'help.guide.roadtrip-stops.goal':
    'Udělejte z místa na trase zastávku po cestě a nastavte, jak dlouho každá zastávka trvá.',
  'help.guide.roadtrip-stops.step.1':
    'Na liště klikněte na číslo před zastávkou. Jeho popisek je „Změnit na zastávku po cestě“ a pod ním se otevřou druhy zastávek jako řada barevných koleček.',
  'help.guide.roadtrip-stops.step.2':
    'Vyberte druh. Když najedete na kolečko, zobrazí se jeho název: Ubytování, Palivo, Nabíjení, Odpočívadlo, Kemp, Jídlo nebo Památky. Číslo se změní na ikonu daného druhu a zastávky pod ním se přečíslují.',
  'help.guide.roadtrip-stops.step.3': 'Zastávka po cestě není cíl, proto záhlaví dne počítá o jednu zastávku méně.',
  'help.guide.roadtrip-stops.step.4':
    'Klikněte znovu na ikonu „Změnit typ zastávky“ a zvolte „Zpět na cíl cesty“, aby zastávka znovu dostala číslo.',
  'help.guide.roadtrip-stops.step.5':
    'Každá zastávka má odznak pobytu, který ukazuje plus, dokud není nic naplánováno. Kliknutím na něj otevřete „Čas na této zastávce“.',
  'help.guide.roadtrip-stops.step.6':
    'Délku nastavte posuvníkem, tlačítky minus a plus nebo jednou z předvoleb. „Odjezd“ se změní, kdežto „Příjezd“ zůstane na čase, kdy jízda dorazí. Pak klikněte na „Uložit“.',
  'help.guide.roadtrip-stops.result':
    'Štítek „Zastávka“ u změněné zastávky ukazuje novou délku pobytu a všechny následující časy příjezdu se podle toho posunou. Zastávka, které jste změnili druh a pak ho vrátili, je zase číslovaným cílem.',
  'help.guide.roadtrip-stops.tip.1':
    'Délka pobytu patří k místu, ne k jedné návštěvě: místo naplánované na dva dny má v obou dnech stejnou délku pobytu.',
  'help.guide.roadtrip-stops.tip.2':
    'Zastávky po cestě se zobrazují i ve „Dny“. Když v „Nastavení jízdy“ v části „Servisní zastávky“ vypnete „Zobrazit také ve Dnech“, zůstanou jen v „Cesta autem“.',
  'help.guide.roadtrip-stops.tip.3': 'Volba „Bez zastávky“ ve stejném dialogu čas zase odebere.',
  'help.guide.roadtrip-stops.tip.4':
    'Kliknutím na zastávku po cestě nebo na rezervovanou noc otevřete její kartu nad mapou. Se zapnutým režimem „Cesta autem“ otevře „Upravit“ místo formuláře místa kompaktní dialog, který používá vyhledávání, a „Více podrobností“ v tomto dialogu otevře celý formulář.',
  // roadtrip-corridor
  'help.guide.roadtrip-corridor.title': 'Najít palivo, jídlo a nocleh podél trasy',
  'help.guide.roadtrip-corridor.goal':
    'Hledejte podél silnice, po které opravdu pojedete, a přidejte nalezené místo ke správnému úseku.',
  'help.guide.roadtrip-corridor.step.1':
    'V poli „Hledá se“ otevřete seznam a zaškrtněte, co potřebujete. Kombinovat můžete „Palivo“, „Nabíjení“, „Odpočívadlo“, „Kemp“, „Ubytování“, „Jídlo“ a „Památky“: seznam zůstane otevřený pro další volbu a pole pak ukazuje ikonu každého druhu.',
  'help.guide.roadtrip-corridor.step.2':
    'V rozbalovací nabídce na konci stejného řádku vyberte den. Nabízí dny, pro které má lišta kartu, a „Hledat“ počká, dokud se trasa pro vybraný den nevypočítá.',
  'help.guide.roadtrip-corridor.step.3':
    'V části „Do“ zvolte, jak daleko od silnice na obě strany hledat, 2 km, 5 km nebo 10 km, a pak klikněte na „Hledat“.',
  'help.guide.roadtrip-corridor.step.4':
    'Výsledky jsou seskupené podle druhu, v pořadí, v jakém je míjíte. U každého vidíte, jak daleko je od trasy a v jaké části denní jízdy leží.',
  'help.guide.roadtrip-corridor.step.5':
    'Klikněte na „Přidat“, plus u výsledku. „Přidat jako zastávku“ ukazuje, do kterého dne a na kterou pozici se místo přidá, a ptá se na „Druh zastávky“ a „Čas na této zastávce“; u nabíjecí stanice uvidíte také „Dostupnost a tarify“. „Přidat“ ji zařadí do jízdy, „Více podrobností“ místo toho otevře úplný formulář místa.',
  'help.guide.roadtrip-corridor.result':
    'Přidaná zastávka se objeví na trase v místě, kudy budete projíždět, s ikonou svého druhu. Trasa dne se přepočítá přes tuto zastávku a seznam se tím vyprázdní: pro další zastávku hledejte znovu.',
  'help.guide.roadtrip-corridor.tip.1':
    'Dokud nestisknete „Hledat“, nic se nehledá: jedno hledání posílá mnoho požadavků na sdílenou službu.',
  'help.guide.roadtrip-corridor.tip.2':
    '„Filtrovat podle názvu“ filtruje výsledky bez nového hledání a „Vymazat výsledky“ vyprázdní seznam a odebere jeho špendlíky. Kliknutím na výsledek ho zobrazíte na mapě.',
  'help.guide.roadtrip-corridor.tip.3':
    'Výsledek můžete také přetáhnout z mapy na trasu. Tak si sami vyberete úsek, když jedete po stejné silnici dvakrát. „Ručně“ vedle „Hledat“ přidá místo, které hledání nenašlo, vyhledáním podle názvu.',
  // roadtrip-via
  'help.guide.roadtrip-via.title': 'Vedení úseku přes průjezdní bod',
  'help.guide.roadtrip-via.goal': 'Nechte úsek vést po silnici, kterou chcete, aniž byste přidávali zastávku.',
  'help.guide.roadtrip-via.step.1':
    'Zobrazte na mapě úsek, o který vám jde: klikněte na liště na zastávku a pak zavřete kartu, která se otevře přes mapu.',
  'help.guide.roadtrip-via.step.2':
    'Klikněte na vykreslenou trasu. Na úsek, na který jste klikli, se přidá průjezdní bod a úsek se přes něj přepočítá.',
  'help.guide.roadtrip-via.step.3':
    'Pás se aktualizuje: záhlaví dne ukáže novou vzdálenost a dobu jízdy a všechny příjezdy po průjezdním bodu se podle toho změní.',
  'help.guide.roadtrip-via.step.4':
    'Po najetí myší na úchyt uvidíte, co dělá: „Tažením změníte trasu, pravým tlačítkem odeberete“. Přetáhněte ho jinam a úsek se znovu vykreslí přes nový bod.',
  'help.guide.roadtrip-via.step.5': 'Úchyt odeberete kliknutím pravým tlačítkem. Úsek pak znovu vede přímou trasou.',
  'help.guide.roadtrip-via.result':
    'Úsek povede po zvolené silnici a vzdálenost, doba jízdy i časy příjezdu v daném dni se přepočítají.',
  'help.guide.roadtrip-via.tip.1':
    'Průjezdní bod není zastávka: nemá číslo, délku pobytu ani čas příjezdu a nezapočítává se do zastávek dne.',
  'help.guide.roadtrip-via.tip.2':
    'Úchyty se zobrazují až od úrovně přiblížení 9, takže na mapě s celou cestou je vidět jen čára bez nich.',
  'help.guide.roadtrip-via.tip.3':
    'Kliknutí dál než dva kilometry od vykresleného úseku se ignoruje, stejně jako kliknutí na let, vlak nebo trajekt.',
  // roadtrip-alternatives
  'help.guide.roadtrip-alternatives.title': 'Vyzkoušet jinou trasu pro úsek',
  'help.guide.roadtrip-alternatives.goal':
    'Prohlédněte si další trasy, které plánovač pro jednu část jízdy nabízí, a jednu vyberte.',
  'help.guide.roadtrip-alternatives.step.1':
    'V postranním panelu klikněte na pruh jízdy, řádek mezi dvěma zastávkami, který ukazuje vzdálenost a čas úseku. Jeho popisek je „Jiné trasy“.',
  'help.guide.roadtrip-alternatives.step.2':
    'Nad mapou se otevře „Trasy tohoto úseku“, kde je každá silnice jako samostatná položka s délkou. Mapa vykreslí všechny silnice s dobou jízdy: aktuální plnou modrou, ostatní světlejší modrou.',
  'help.guide.roadtrip-alternatives.step.3':
    'Když najedete myší na položku, silnice se zvýrazní. „Aktuální“ je silnice, kterou používáte, a „Nejrychlejší“ je nejrychlejší varianta; ostatní ukazují, o kolik jsou pomalejší nebo kterou třídu silnic vynechávají.',
  'help.guide.roadtrip-alternatives.step.4':
    'Kliknutím na položku použijete danou trasu, „Uzavřít“ ponechá současnou trasu.',
  'help.guide.roadtrip-alternatives.result':
    'Úsek teď vede po zvolené silnici a změní se i vzdálenost v postranním sloupci a časy příjezdu po tomto úseku.',
  'help.guide.roadtrip-alternatives.tip.1':
    'Když zvolíte jinou silnici, TREK ji nejdřív ověří u plánovače trasy pro cestu autem. Pak úsek na této silnici udrží s co nejmenším počtem průjezdních bodů a nahradí průjezdní body, které úsek už měl. Silnice, po které plánovač neumí vést, se neuloží. Když zvolíte silnici, kterou navrhuje sám plánovač, průjezdní body se zase odeberou.',
  'help.guide.roadtrip-alternatives.tip.2':
    '„Bez dálnice“, „Bez mýtného“ a „Bez trajektu“ počítá druhý engine s vlastním modelem rychlosti, takže jejich časy nejsou srovnatelné s ostatními.',
  // roadtrip-limits
  'help.guide.roadtrip-limits.title': 'Nastavení auta a limitů jízdy',
  'help.guide.roadtrip-limits.goal': 'Řekněte TREKu, jakým vozidlem jedete a jak daleko chcete jet bez přestávky.',
  'help.guide.roadtrip-limits.step.1':
    '„Nastavení jízdy“ je pod hledáním v pravém sloupci. Jeho odznaky ukazují, co je nastavené; kliknutím ho otevřete.',
  'help.guide.roadtrip-limits.step.2':
    'V části o jízdě jsou „Nejdelší jízda v kuse“ a „Jízda za den“ v minutách. Prázdné pole znamená vypnuto a nic se neoznačuje.',
  'help.guide.roadtrip-limits.step.3':
    'V části „Vozidlo“ zadejte, čím jedete. „Palivo“ tankuje jen na zastávkách s palivem, „Elektro“ jen na nabíjecích, „Obojí“ na obou.',
  'help.guide.roadtrip-limits.step.4':
    'Zadejte „Dojezd na jednu nádrž“, nebo „Dojezd na nabití“ sami. Nebo otevřete „Spočítat z údajů auta“ pod „Natankovat na“: z „Objem nádrže“ a „Spotřeba“, případně z „Baterie“, „Spotřeba“ a „Opotřebení baterie“ dojezd vypočítá.',
  'help.guide.roadtrip-limits.step.5':
    '„Vyhnout se, pokud to jde“ v levém sloupci je preference, ne zákaz: pokud den nemá jinou možnost, silnici přesto použije a v jeho záhlaví se zobrazí poznámka.',
  'help.guide.roadtrip-limits.step.6':
    'Klikněte na „Uzavřít“. Odznaky na kartě ukazují, co je nastavené, a lišta označí každý úsek a každý den, který některý limit překračuje.',
  'help.guide.roadtrip-limits.result':
    'Odznaky na kartě ukazují, co je nastavené, a každý úsek i den nad limitem má v pásu odznak.',
  'help.guide.roadtrip-limits.tip.1':
    'Nastavení patří k cestě, takže všichni její účastníci plánují se stejným autem a stejnými limity.',
  'help.guide.roadtrip-limits.tip.2':
    '„Natankovat na“ určuje, kolik se na zastávce dotankuje nebo dobije, protože na cestách nikdo nenabíjí na 100 %. Zastávka s tankováním nebo nabíjením to může změnit odznakem baterie na svém řádku.',
  'help.guide.roadtrip-limits.tip.3':
    'V části „Čára trasy“ volba „Propojit dny“ naplánuje i jízdu z poslední zastávky jednoho dne k první zastávce dalšího dne. „Začínat a končit každý den v ubytování“ začne i ukončí každý den v ubytování rezervovaném na dané noci. „Barva na den“ zobrazí každý den jeho vlastní barvou.',
  // roadtrip-day-window
  'help.guide.roadtrip-day-window.title': 'Začátek a konec jízdního dne',
  'help.guide.roadtrip-day-window.goal': 'Ukončete jízdu v čase, který si zvolíte, a určete, kde má den skončit.',
  'help.guide.roadtrip-day-window.step.1':
    'V pravém sloupci otevřete „Nastavení jízdy“ a v levém sloupci dialogu najděte „Denní časy cestování“.',
  'help.guide.roadtrip-day-window.step.2':
    'Nastavte „Začátek dne“. Samotný nic nedělá: jsou potřeba oba časy, jak upozorňuje poznámka pod nimi.',
  'help.guide.roadtrip-day-window.step.3':
    'Nastavte „Konec dne“. Jízda se v tu dobu zastaví a pokračuje další ráno. V postranním sloupci to ukazuje řádek „Konec dne“ a řádek „Pokračovat v cestě“.',
  'help.guide.roadtrip-day-window.step.4':
    'V části „Ukončení dne“ zvolte „Na trase“, pokud se má v čase konce udělat pauza na silnici, nebo „Na posledním místě“, pokud má den skončit na posledním místě dřív, než by ho další jízda překročila.',
  'help.guide.roadtrip-day-window.step.5':
    'Klikněte na „Uzavřít“. Karta „Nastavení jízdy“ ukazuje oba časy jako odznak.',
  'help.guide.roadtrip-day-window.result':
    'Jízda se rozdělí na cestovní dny nastavené délky a co se nevejde, pokračuje na vypočtených dnech po posledním dni. Vaše dny a jejich místa se nemění.',
  'help.guide.roadtrip-day-window.tip.1':
    'Když vymažete kterýkoli z časů, tato funkce se znovu vypne. Časy, které sami nastavíte u zastávky, mají vždy přednost.',
  'help.guide.roadtrip-day-window.tip.2':
    'S nastavenými denními časy jízdy jsou dny vždy propojené: jízda z poslední zastávky jednoho dne k první zastávce dalšího se naplánuje a započítá.',
  'help.guide.roadtrip-day-window.tip.3':
    'Každý konec dne je na mapě také jako značka: měsíc s číslem dne. Přetažením po trase nebo na místo ukončíte den jinde. Pravým tlačítkem obnovíte automatický konec. „Obnovit automatické konce dnů“ v tomto dialogu vrátí všechny tyto změny. Pokud chcete den ukončit u konkrétní zastávky, klikněte na ni a na její kartě zapněte „Ukončit den zde“.',
  // roadtrip-refuel
  'help.guide.roadtrip-refuel.title': 'Natankovat dřív, než dojde nádrž',
  'help.guide.roadtrip-refuel.goal':
    'Najděte místo k tankování na části trasy, kam auto ještě dojede, a přidejte ho do jízdy.',
  'help.guide.roadtrip-refuel.step.1':
    'Když je nastavený dojezd, ukazuje postranní sloupec na úseku pruh v místě, kde dojde palivo nebo baterie: „Tady dojde palivo“, u elektromobilu „Tady dojde baterie“. Pod ním vidíte, jak daleko v úseku to je.',
  'help.guide.roadtrip-refuel.step.2':
    'Tlačítkem je ikona lampy na pruhu: „Najít palivo“, nebo u elektromobilu „Najít nabíječku“. Hledá podél silnice před tímto bodem a během hledání ukazuje „Hledám podél trasy…“.',
  'help.guide.roadtrip-refuel.step.3':
    'Zobrazí se až tři čerpací stanice, každá se vzdáleností od trasy a s dojezdem, který by vám zbyl.',
  'help.guide.roadtrip-refuel.step.4':
    'Plus u nabídky ji přidá jako zastávku na tankování. „Přidat jako zastávku“ se otevře s už vyplněným typem a časem a „Přidat“ ji zařadí do úseku v místě, kudy kolem ní trasa skutečně vede.',
  'help.guide.roadtrip-refuel.result':
    'Zastávka se objeví na správném úseku s vlastní ikonou a dojezd se počítá znovu od ní. Pruh se posune tam, kde vám teď dojde nádrž, nebo zmizí, pokud dojedete do cíle bez další zastávky.',
  'help.guide.roadtrip-refuel.tip.1':
    'Dojezd se počítá od poslední zastávky s tankováním nebo nabíjením, i přes více dnů. Typ vozidla určuje, které zastávky se počítají: „Palivo“ jen čerpací stanice, „Elektro“ jen nabíjecí stanice.',
  'help.guide.roadtrip-refuel.tip.2':
    'Hledání prohledává silnici před místem, kde dojde palivo, počítá s rezervou a zajížďku započítá dvakrát, takže každé nabídnuté místo je skutečně dosažitelné.',
  'help.guide.roadtrip-refuel.tip.3':
    'Pokud se nic nenajde, můžete hledat znovu: z lampy se stane „Zkusit znovu“, protože hledání míst je sdílená služba, která občas nestihne odpovědět včas.',
  // roadtrip-track
  'help.guide.roadtrip-track.title': 'Nechat den sledovat importovanou stopu',
  'help.guide.roadtrip-track.goal':
    'Použijte pro jízdu dne vyhlídkovou trasu, kterou jste importovali jako stopu GPX nebo KML.',
  'help.guide.roadtrip-track.step.1': 'Klikněte na štítek „Stopa“ v záhlaví dne. Dialog se otevře na tomto dni.',
  'help.guide.roadtrip-track.step.2':
    'Vyberte stopu. U každé je vidět její délka a jestli vede podél trasy tohoto dne, případně jak daleko od ní je. Nejbližší stopa je první.',
  'help.guide.roadtrip-track.step.3':
    'Klikněte na „Sledovat tuto stopu“. TREK přidá průjezdní body tam, kde se jízda od stopy nejvíc vzdaluje, znovu vypočítá trasu a několikrát to zopakuje.',
  'help.guide.roadtrip-track.step.4':
    'Dialog uvede, kolik průjezdních bodů se umístilo a jak blízko se jízda teď drží stopy, nebo že jízda stopu už sledovala. „Zahodit průjezdní body“ vlevo dole je odebere a router den naplánuje znovu. Po zavření dialogu stopa zůstane.',
  'help.guide.roadtrip-track.result':
    'Jízda dne sleduje stopu místo silnice, kterou by vybral router. Když najedete myší na její odznak „Stopa“, uvidíte název stopy. Pokud jízdu na stopě drží průjezdní body, je odznak navíc zvýrazněný.',
  'help.guide.roadtrip-track.tip.1':
    'Dialog vypisuje místa cesty, která mají trasu: GPX nebo KML importované přes „Importovat soubor“ ve sloupci míst pod dny, u GPX se zaškrtnutými „Trasy“ nebo „Trasy GPS (s geometrií)“, u KML s „Trasy (LineStrings)“. „Importovat soubor“ se nabízí, jen když je doplněk Výlety vypnutý; se zapnutými Výlety se z GPX stane výlet a ten tento dialog nevypisuje. Dokud cesta nemá žádnou stopu, žádný den odznak nezobrazuje.',
  'help.guide.roadtrip-track.tip.2':
    'Sledování stopy nahradí průjezdní body, které už úseky dne měly. Úsek proto tvarujte ručně až po stopě, ne předtím.',
  'help.guide.dateless-trip.step.1': 'Klikněte na „Nová cesta“ a pojmenujte ji.',
  'help.guide.edit-trip.tip.2':
    'Spolucestující, které tu přidáte nebo odeberete, se změní hned, bez kliknutí na „Aktualizovat“.',
  'help.guide.trip-reminder.result':
    'Připomenutí dostanete zvolený počet dní před začátkem cesty, a to všemi kanály, kterými vám chodí oznámení.',
  'help.guide.upcoming-reservations.step.1':
    'V pravém sloupci najděte „Nadcházející rezervace“. Zobrazují šest nejbližších rezervací ze všech vašich cest, od nejbližší, s datem, časem a typem.',
  'help.guide.half-company-holiday.step.1': 'Na panelu nástrojů přepněte na „Firemní volno“.',
  'help.guide.edit-holiday-calendar.result': 'Mřížka i legenda se po každé změně okamžitě aktualizují.',
  'help.guide.person-color.result': 'Všechny dny, které má osoba zapsané, se teď zobrazují novou barvou.',
  'help.guide.answer-fusion-request.step.1':
    'Jakmile vás někdo pozve, otevřete sekci „Dovolená (Vacay)“. Dialog „Žádost o propojení“ se otevře sám.',
  'help.guide.log-for-partner.step.1':
    'Na kartě „Osoby“ klikněte na jméno dané osoby. Zatržítko ukazuje, že je vybraná.',
  'help.guide.dissolve-fusion.step.1': 'Otevřete „Nastavení“.',
  'help.guide.country-places.step.2': 'Na kartě klikněte na odznak s počtem míst, ten se špendlíkem.',
  'help.guide.search-place.tip.2': 'Pokud už je region označený, okno se místo toho zeptá, jestli ho chcete odebrat.',
  'help.guide.tour-activity-stats.step.4':
    'Odznaky vpravo ukazují, z čeho součty vycházejí: „Plánováno“ u výletů započtených podle plánu cesty, „Zaznamenáno“ u výletů s propojenou skutečnou stopou. „Teprve čeká“, „Bez dne“ a „Bez data“ počítají výlety, které zatím zahrnuté nejsou. Ikona i vysvětluje pravidlo.',
  'help.guide.move-to-list.step.2':
    'Klikněte na „Duplikovat do seznamu“, pokud je chcete mít i tady, nebo na „Přesunout do seznamu“, pokud je chcete z tohoto seznamu odebrat.',
  'help.guide.accept-list-invite.title': 'Přijetí pozvánky do seznamu',
  'help.guide.tour-collection-add-to-trip.step.3':
    'V části „Trasové body“ zvolte dlaždici s trasovými body, pokud chcete přidat start, zastávky a cíl v jejich pořadí, nebo „Jen linie“, pokud chcete přidat jen uloženou linii.',
  'help.guide.tour-collection-manage.step.1':
    'Otevřete seznam. U každého uloženého výletu vidíte obtížnost, typ, cestu, ze které byl uložen, vzdálenost, převýšení a počet trasových bodů. Když najedete myší na název cesty, uvidíte, kdo výlet uložil.',
  'help.guide.entry-draft.step.1': 'V editoru zapněte v pravém sloupci „Koncept“.',
  'help.guide.journey-map-layers.step.3':
    'Klikněte na mapě na prázdný špendlík nebo malou tečku. Karta ukáže, o co jde: plánované místo a jeho den, nebo pobyt s tlačítkem „Otevřít záznam“, které vás přenese k denní zprávě, ke které patří.',
  'help.guide.journey-keep-route.step.3': 'Klikněte na „Uložit trasu“.',
  'help.guide.journey-day-stays.step.3':
    'U pobytu, který nechcete, klikněte na „Tady jsem nebyl“. Pobyt ze seznamu zmizí.',
  'help.guide.journey-take-over-day.step.3':
    'Pokud chcete na celý den jen jeden záznam, přepněte „Záznamy“ na „Denní zpráva“: jeden záznam pak obsahuje všechny vybrané pobyty i s časy.',
  'help.guide.journey-auto-prepare.step.2':
    'V části „Zaznamenané dny“ zapněte „Automaticky připravovat zaznamenané dny“.',
  'help.guide.photo-location.step.2': 'V části „Fotky“ zapněte „Umístit záznamy podle jejich fotek“.',
  'help.guide.link-trip.tip.3':
    'Když píšete záznam ke dni cesty, která ještě není propojená, editor vám přímo v záznamu nabídne „Propojit cestu“.',
  'help.ctx.settings-plugins.summary':
    'Vaše vlastní nastavení pluginů, které nainstaloval správce: klíče a předvolby, o které vás jednotlivé pluginy žádají, a záznam toho, co pluginy udělaly vaším jménem. Karta se zobrazuje jen tehdy, když je nějaký plugin aktivní.',
  'help.ctx.settings-about.bullet.3':
    'Přes Ko-fi, Buy Me a Coffee a Discord můžete TREK podpořit nebo si promluvit s lidmi, kteří ho vyvíjejí.',
  'help.guide.language-region.step.3':
    'Nastavte „Zobrazovaná měna“, nebo ponechte „Měna cesty“, aby se každá cesta zobrazovala ve své vlastní měně. Pak zvolte „Jednotky teploty“, „Jednotky vzdálenosti“, „Formát času“ a den, kterým začíná týden („Týden začíná“).',
  'help.guide.travel-map-prefs.step.3':
    '„Objevovat místa na mapě“ zobrazí pilulku s kategoriemi pro hledání míst v okolí. „Skrýt rezervační kódy“ skryje čísla potvrzení, dokud na ně nenajedete myší nebo neklepnete. „Optimalizovat trasu od ubytování“ začíná a končí den u vašeho hotelu.',
  'help.guide.web-push-device.step.2':
    'Na kartě „Oznámení“ nahoře určuje sloupec Push, které události se posílají na vaše zařízení.',
  'help.guide.connect-airtrail.goal': 'Nechte TREK importovat a synchronizovat lety z vašeho vlastního AirTrail.',
  'help.guide.connect-dawarich.goal': 'Nechte TREK zjistit z vašeho vlastního Dawarich, kde jste skutečně byli.',
  'help.guide.tour-connect-wanderer.goal':
    'Nechte TREK číst trasy z vašeho vlastního wanderer, abyste je mohli importovat jako výlety.',
  'help.guide.tour-wanderer-watch.title': 'Upozornění na změny vašich tras ve wanderer',
  'help.guide.plugin-settings.tip.2':
    'Kanál pluginu v části „Oznámení“ má tlačítko „Nastavit“, které otevře tuto stránku.',
  'help.guide.default-user-settings.result':
    'Vaše volby uvidí nové účty a všichni, kdo tato nastavení nikdy nezměnili.',
  'help.guide.own-routing-engine.goal':
    'Plánujte trasy dnů a výletů autem přes vlastní server OSRM nebo Valhalla místo veřejných.',
  'help.guide.admin-passkeys.tip.1':
    'Pokud TREK zatím nedokáže určit doménu, upozorní vás na to a přístupové klíče zůstanou skryté, dokud nenastavíte APP_URL nebo Relying Party ID.',
  'help.guide.rotate-jwt-secret.step.1':
    'Dole na kartě „Nastavení“ v části „Nebezpečná zóna“ klikněte na „Obnovit“ vedle „Obnovit tajný klíč JWT“.',
  'help.guide.storage-backends.tip.3':
    'Mezipaměti fotek si TREK umí stáhnout znovu, takže jejich zrcadlení obvykle jen zbytečně zabírá místo.',
  'help.guide.admin-channels.step.3':
    'Na kartě „Oznámení“ níže zvolte u každé události, kterými kanály se posílá: „Nová verze k dispozici“, „Selhání repliky úložiště“ a „Vyžádán vodácký region“. Každý přepínač se uloží okamžitě.',
  'help.guide.notification-defaults.tip.1':
    '„Vypnuto“ je výchozí stav, který si každý uživatel může zapnout; „Blokováno“ oznámení vypne všem.',
  'help.ctx.notifications.bullet.4':
    'Vedle času každého oznámení jsou „Označit jako přečtené“ (dvojité zatržítko) a „Smazat“ (koš), které platí jen pro dané oznámení. „Označit vše jako přečtené“ a „Smazat vše“ nahoře platí pro celý seznam.',
  'help.guide.read-notifications.tip.2':
    'Oznámení bez tlačítka je jen informativní. Přečtěte si ho v panelu a tam ho také označte jako přečtené.',
  'help.guide.filter-notifications.result': 'V seznamu zůstane jen to, co je ještě nepřečtené, od nejnovějšího.',
  'help.guide.delete-notifications.title': 'Mazání oznámení',
  'help.guide.notification-settings.goal':
    'Určete, které události se zobrazí pod ikonou zvonku a které vám přijdou také e-mailem, webhookem, přes ntfy nebo jako push.',
  'help.guide.public-link.step.4': 'Klikněte na „Vytvořit odkaz“, pak na „Kopírovat“ a odkaz pošlete.',
  'help.guide.link-journal.step.2':
    'Klikněte na „Propojit deník“ a v okně „Vyberte deník“ zvolte jeden ze svých deníků.',
  'help.guide.dawarich-stays.title': 'Zaznamenaný pobyt jako místo',
  'help.guide.dawarich-stays.tip.2':
    'Když smažete místo, které vzniklo z pobytu, pobyt se vrátí do seznamu jako čekající.',
  'help.guide.leave-stop-off-route.goal':
    'Nechte zastávku ve dni, aniž by k ní vedla trasa, třeba u místa, kolem kterého jdete pěšky nebo které chcete mít jen na mapě.',
  'help.guide.day-route.tip.4':
    'Pokud chcete zastávku mít ve dni, ale ne na trase, zvolte v její nabídce „Vynechat z trasy“.',
  'help.guide.move-booking-day.step.2':
    'Přetáhněte řádek na záhlaví karty jiného dne. Jednodenní rezervace se na ten den přesune celá. U rezervace na více dní přesunete řádkem „Odlet“ den začátku a řádkem „Přílet“ den konce.',
  'help.guide.place-image-from-file.title': 'Připojená fotka jako obrázek místa',
  'help.guide.place-image-from-file.tip.2': 'Nabídne se i fotka připnutá k zastávce nebo přiložená k její rezervaci.',
  'help.guide.place-own-hours.step.5':
    'Klikněte na „Aktualizovat“. Karta teď v části „Otevírací doba“ ukazuje vaše hodiny a podle nich se řídí i „Otevřeno“ nebo „Uzavřeno“ nahoře.',
  'help.guide.confirm-stay-booking.step.3':
    'Klikněte nahoře na „Čeká na potvrzení“. Popisek ukazuje „Nastavit na Potvrzeno“ a tečka zezelená.',
  'help.guide.map-nearby-places.tip.4':
    'Kategorie, jejíž hledání selhalo, dostane červenou tečku a tlačítko „Hledat v této oblasti“ zčervená a ukáže výstražný symbol: kliknutím hledání zopakujete.',
  'help.guide.tour-map-lines.tip.1': 'Když ve sloupci dnů sbalíte den, jeho výlety i zastávky se na mapě skryjí.',
  'help.guide.car-stops.step.3':
    'Do záhlaví napište název. V části „Trasa“ vyberte v poli „Od“, kde auto vyzvednete, a v poli „Do“, kde ho vrátíte; místa cesty se nabídnou ještě dřív, než začnete psát. „Vyzvednutí“ a „Čas vyzvednutí“ určují, kdy auto vyzvednete, „Vrácení“ a „Čas vrácení“, kdy ho vrátíte.',
  'help.guide.transport-details.step.1':
    'Na kartě „Doprava“ klikněte na některou kartu. Přes kartu Doprava se otevřou její podrobnosti se záhlavím ve stejné barvě, jakou má karta. Stejné podrobnosti otevře i řádek dopravy v denním plánu.',
  'help.guide.export-transports-csv.tip.2':
    'Karta „Rezervace“ má stejnou ikonu a vytvoří vlastní soubor, jehož název končí na bookings.csv.',
  'help.guide.group-sort-bookings.step.2':
    'V části „Seskupit podle“ vyberte „Stav“, „Den“, „Typ“ nebo „Neseskupovat“. Karta se do těchto sekcí okamžitě roztřídí.',
  'help.guide.export-bookings-csv.result':
    'Prohlížeč stáhne soubor pojmenovaný podle cesty a karty, například autumn-in-japan-bookings.csv, s jedním řádkem za každou rezervaci, kterou karta zobrazovala.',
  'help.guide.arrange-packing-list.result':
    'Seznamy jsou v pořadí, do kterého jste je přetáhli, a položky jsou seřazené od A do Z, dokud to nevypnete. TREK si vaše vlastní pořadí stále pamatuje.',
  'help.guide.count-packed-pieces.step.2':
    'Před množstvím se objeví počítadlo 0/5 s minusem a plusem. Za každý kus, který dáte do tašky, klikněte na plus.',
  'help.guide.expense-receipts.step.4':
    'V přehledu má řádek vedle názvu štítek „Účtenka“, a pokud je účtenek víc, s jejich počtem v závorce. Kliknutím účtenku otevřete.',
  'help.guide.final-budget.tip.3':
    'Kdo cestu opustil, má v „Zůstatky“ a „Konečný rozpočet“ řádek tak dlouho, dokud mu někdo dluží nebo on dluží někomu.',
  'help.guide.files-sync-settings.step.2':
    'Lišta toku ukazuje TREK a vaše úložiště s dokumenty, které každé z nich obsahuje, a mezi nimi dva pruhy: „Do úložiště“ a „Z úložiště“. Kliknutím na „Do úložiště“ ho vypnete. Pruh zešedne a řádek pod pruhy hlásí „Jen příchozí“. Dalším kliknutím ho zase zapnete.',
  'help.guide.files-sync-settings.tip.4':
    'Nic z toho nemůže měnit nikdo jiný než vlastník cesty nebo správce. Ostatní členové vidí lištu toku s řádkem jako „Dokumenty putují oběma směry“, ale žádné „Nastavení“.',
  'help.guide.manage-notes.step.2':
    '„Rozbalit“ otevře celou poznámku: celý text, její „Webové stránky“ a „Soubory“. Kliknutím na soubor zobrazíte náhled. „Upravit“ dole přepne přímo do editoru; křížkem vpravo nahoře poznámku zase zavřete.',
  'help.guide.note-categories.goal':
    'Dejte poznámkám skupiny pojmenované barevné kategorie a zobrazujte vždy jen jednu kategorii.',
  'help.guide.note-categories.tip.1':
    'Koš odebere jen kategorii, kterou nepoužívá žádná poznámka. Kategorie, kterou poznámky ještě používají, zůstane v seznamu, dokud tyto poznámky nepřesunete do jiné kategorie.',
  'help.guide.roadtrip-reorder.title': 'Změna pořadí zastávky nebo přesun na jiný den',
  'help.guide.roadtrip-reorder.tip.3':
    'Na čas, který jste připnuli, se TREK neptá: lišta den hned přepočítá a označí každou zastávku, kterou už nelze stihnout včas.',
  'help.guide.roadtrip-overnight.step.3':
    'Nahoře v dialogu přidá „Nocleh“ přenocování a „Pauza“ z místa udělá zastávku na chvíli. Hotel se otevře s volbou „Nocleh“, kemp s volbou „Pauza“. U noci se vyplňuje jen „Check-in“, který můžete nechat prázdný.',
  'help.guide.roadtrip-stop-fill.step.1':
    'U zastávky s tankováním nebo nabíjením na liště klikněte na odznak baterie. Ukazuje úroveň, na kterou se na zastávce doplní: vybledle, dokud používá vaši hodnotu „Natankovat na“, plně, jakmile má vlastní hodnotu.',
  'help.guide.roadtrip-bookings.step.1':
    'Zarezervujte jízdu jako rezervaci typu „Let“, „Vlak“, „Trajekt“, „Plavba“ nebo „Autobus“ v daný den a s umístěnými oběma konci. Jízda autem ji automaticky zahrne: silnice končí u terminálu, odkud spoj odjíždí, a pokračuje tam, kam přijíždí.',
  'help.guide.roadtrip-google-import.result':
    'Zastávky z trasy se přidají za poslední zastávku daného dne a trasa na liště i na mapě vede přes ně.',
  'help.guide.roadtrip-hazards.step.3':
    'Varování jsou na mapě zakreslená jako oblasti. Kliknutím na některé zjistíte, čeho se týká, která služba ho nahlásila a kdy bylo naposledy aktualizováno.',
  'help.ctx.trip-tours.bullet.2':
    'Nahoře přes „Importovat GPX nebo KML“ přidáte soubory jako výlety. Tlačítko filtru pod ním (zpočátku „Vše“ s počtem výletů) zúží seznam podle stavu, zdroje, limitu trasy a typu.',
  'help.guide.tour-show-list.step.2':
    'Každý řádek je jeden výlet. Barevný pruh odpovídá jeho linii na mapě a kulatá dlaždice ukazuje limit trasy (T1 až T6) u túry naplánované v TREK, jinak ikonu typu. Odznaky pod názvem ukazují dny, kdy výlet je, jeho čas, vzdálenost a stoupání. U vícedenního výletu ukazuje měsíc s číslem počet etap.',
  'help.guide.tour-add-to-day.title': 'Zařazení výletu do dne',
  'help.guide.tour-add-to-day.tip.2':
    'Pokud cesta skončí dřív než poslední etapa, volba ukáže poslední etapu, která se ještě vejde, a další etapy zůstanou bez dne.',
  'help.guide.tour-day-times.step.3':
    'Klikněte na „Aktualizovat“. Řádek teď ukazuje začátek → konec. Vypočítaný čas konce je světlejší: ≈ označuje odhad, ≥ znamená, že některý pobyt zatím nemá čas, a +1 přechod přes půlnoc. Když na něj najedete myší, uvidíte, jak byl vypočítán.',
  'help.guide.tour-remove-from-day.goal': 'Vyřaďte výlet z plánu, aniž byste ho smazali.',
  'help.guide.tour-filter-list.goal':
    'Zužte dlouhý seznam na výlety, které hledáte: zatím nenaplánované, ze souboru nebo určitého typu.',
  'help.guide.tour-filter-list.result': 'V seznamu jsou jen vyfiltrované výlety; ostatní v cestě zůstávají.',
  'help.guide.tour-hide-on-map.result':
    'Na mapě máte jen výlety, které chcete vidět, a skryté zůstávají ztlumené v seznamu.',
  'help.guide.tour-import-plan-tab.result':
    'Stopa je teď výletem cesty: řádkem v seznamu s odznakem GPX a linií na mapě.',
  'help.guide.tour-detail-read.title': 'Otevření výletu a jeho karta',
  'help.guide.tour-detail-read.step.7': 'Kartu zavřete křížkem nahoře, nebo stiskněte Escape.',
  'help.guide.tour-rename-colour.goal':
    'Pojmenujte výlet tak, abyste ho poznali, a dejte jeho linii barvu, která je na mapě dobře vidět.',
  'help.guide.tour-take-along.title': 'Stažení výletu do telefonu nebo GPS',
  'help.guide.tour-take-along.tip.4':
    'Na kartě „Výlety“ najdete stejné stažení nahoře v levém sloupci. Pokud má výlet neuložené změny, stažení vás nejdřív vyzve k uložení.',
  'help.guide.tour-copy-keep.tip.1':
    'Obojí jsou kopie: pozdější změny výletu se neprojeví ani v kopii, ani ve verzi uložené ve sbírce.',
  'help.guide.tour-packing-link.step.2':
    'V části „Propojit s“ vyberte „Celý seznam věcí“ nebo jeden z jeho seznamů. U každého řádku vidíte, kolik obsahuje položek.',
  'help.guide.tour-files.title': 'Přiložení souborů k výletu',
  'help.guide.tour-activity-link.title': 'Propojení skutečně absolvované stopy',
  'help.guide.tour-activity-link.tip.2':
    'Propojit lze jen importovanou stopu, která nebyla použita k naplánování výletu, a každou stopu jen s jedním výletem.',
  'help.guide.tour-activity-compare.step.4':
    'Tlačítkem „Změnit“ pod stopou vyberete jiný záznam. „Odpojit“ ho z výletu odebere a stopa zůstane v cestě jako import.',
  'help.guide.tour-origin-check.step.3':
    'U výletu, který jste nakreslili na kartě „Výlety“, je uvedeno „naplánováno v TREK“ a den, kdy byl vytvořen („Vytvořeno“).',
  'help.ctx.trip-tour-planner.bullet.2':
    'Levý panel je editor. Když není nic otevřené, nabízí „Naplánovat nový výlet“. Otevřený výlet ukazuje název, typ, trasové body, karty pro svůj typ a podrobnosti, dole s tlačítky „Zahodit“ a „Uložit“.',
  'help.guide.tour-open-workspace.step.2':
    'Levý panel je editor. Když není otevřený žádný výlet, nabízí „Naplánovat nový výlet“, čímž začnete nový výlet na mapě.',
  'help.guide.tour-open-workspace.tip.3':
    'Když otevřete jiný výlet a editor obsahuje neuložené změny, nejdřív se zobrazí dotaz: „Zahodit změny“, nebo pokračovat v úpravách.',
  'help.guide.tour-draw-route.step.5':
    'Klikejte na další místa v pořadí, v jakém je projdete. Každým kliknutím přidáte bod jako nový konec a od dvou bodů TREK plánuje trasu po cestách.',
  'help.guide.tour-type-profile.goal':
    'Vyberte typ výletu a u cyklovýletu i profil, aby trasa vedla po správných cestách.',
  'help.guide.tour-edit-points.title': 'Přesun, změna pořadí a odebrání bodů',
  'help.guide.tour-edit-points.tip.1':
    'První bod má odznak „Začátek“ a poslední „Do“. Když bod přesunete úplně nahoru nebo dolů, stane se začátkem nebo koncem.',
  'help.guide.tour-shaping-points.step.4':
    'Pokud chcete ze zastávky udělat tvarový bod nebo naopak, otevřete na jejím řádku „Další akce“ a zvolte „Udělat tvarovým bodem“ nebo „Udělat zastávkou“.',
  'help.guide.tour-loop-reverse.step.2':
    'Poslední řádek teď ukazuje „Zpět na start“ a trasa na mapě končí tam, kde začala.',
  'help.guide.tour-leg-by-hand.step.1':
    'U bodu, kde úsek začíná, otevřete „Další akce“ a zvolte „Nakreslit další úsek ručně“.',
  'help.guide.tour-trip-places.goal': 'Přidejte do výletu jako zastávku místo, které už máte naplánované v cestě.',
  'help.guide.tour-trip-places.result': 'Výlet má novou zastávku pro místo z cesty se stejným názvem.',
  'help.guide.tour-details-times.tip.2':
    'U túry obsahují „Podrobnosti“ také „Maximální obtížnost stezky“ a „Volba trasy“, které vysvětlují návody k túrám. Procházka městem nemá „Pauzy“: místo nich se počítá čas strávený na zastávkách.',
  'help.guide.tour-save.step.4': 'Výlet je teď uvedený v části „Výlety této cesty“, zatím bez dne.',
  'help.guide.tour-edit-saved.step.2':
    'Změňte, co potřebujete, stejně jako u nového výletu: přesuňte nebo přidejte body, změňte typ nebo upravte podrobnosti, jako tady „Popis“.',
  'help.guide.tour-summary-profile.goal':
    'Zjistěte, jak dlouhý a strmý výlet je a v jaké výšce jste na kterém místě trasy.',
  'help.guide.tour-summary-profile.result':
    'Víte, jak dlouhý výlet je, kolik nastoupáte, jak dlouho potrvá a kde je strmý.',
  'help.guide.tour-list-manage.tip.1':
    'Každý výlet se do součtů počítá jen jednou, i když je ve více dnech. Součet se znakem ≥ před číslem některé výlety nezahrnuje. Najeďte na něj myší a uvidíte kolik.',
  'help.guide.tour-delete.tip.1': 'Tuto akci nelze vrátit a výlet neobnoví ani „Vrátit zpět“.',
  'help.guide.tour-saved-elsewhere.step.3':
    'Pokud přesto kliknete na „Uložit“, otevře se místo toho okno „Mezitím změněno“ a nic se nepřepíše.',
  'help.ctx.trip-tour-import.bullet.2':
    '„Náhled importu“ ukáže všechny stopy ze souborů na mapě se vzdáleností, stoupáním, klesáním a počtem bodů, ještě než se cokoli uloží. V části „Importovat jako“ určíte, čím stopy jsou.',
  'help.guide.tour-import-gpx.step.3':
    'Otevře se „Náhled importu“ a zatím se nic neukládá. Mapa ukazuje celý průběh a každá stopa ze souborů je očíslovaný řádek se vzdáleností, stoupáním, klesáním a počtem bodů. U zaznamenané stopy je uvedeno i to, kdy vznikla a jak dlouho trvala.',
  'help.guide.tour-import-gpx.result':
    'Výlet je v části „Výlety této cesty“, zatím bez dne. Pokud jde o jediný výlet, otevře se rovnou na mapě jako „Výlet GPX“.',
  'help.guide.tour-view-import.tip.3': 'Trasa z wanderer se otevře stejně, jako „Výlet z aplikace wanderer“.',
  'help.guide.tour-plan-from-import.tip.1': '„Zahodit“ návrh odstraní. Dokud neuložíte, nic se neukládá.',
  'help.guide.tour-restore-recorded.step.2': 'Klikněte na „Obnovit zaznamenanou stopu“.',
  'help.guide.tour-take-over.step.2': 'Zvolte „Převzít túru z jiné cesty“.',
  'help.guide.tour-take-over.result':
    'Zpráva převzetí potvrdí a výlet se otevře v editoru, připravený k zařazení do dne.',
  'help.guide.tour-import-wanderer.tip.2':
    'Import je kopie: pozdější změny ve wanderer výlet nezmění. „Zkontrolovat zdroj“ v části „Původ“ výletu vám řekne, kdy se trasa změnila.',
  'help.ctx.trip-tour-map.bullet.3':
    '„Hledat místo nebo adresu“ nahoře na mapě přesune mapu na město, chatu nebo vrchol, aniž by do výletu cokoli přidalo.',
  'help.guide.tour-map-layers.result':
    'Výlet je zobrazený na mapě, která mu sedí, a pilulka ukazuje, která mapa je zapnutá.',
  'help.guide.tour-along-search.step.3':
    'V části „Do této vzdálenosti od trasy“ vyberte, jak daleko od linie hledat: 250 m, 500 m, 1 km nebo 2 km.',
  'help.guide.tour-along-add-stop.goal': 'Veďte výlet kolem vyhlídky, chaty nebo pramene, které jste našli po cestě.',
  'help.guide.tour-along-add-stop.tip.3':
    'Úsek, kam zastávku přidat nelze (ferata nebo přenáška přidaná jako pevná linie, případně ručně nakreslený úsek), zůstane v seznamu ztlumený a vedle něj je uvedený důvod.',
  'help.guide.tour-3d-terrain.result':
    'Prohlédli jste si výlet na 3D terénu s barevně odlišenými strmými úseky a pro plánování máte zase plochou mapu.',
  'help.guide.tour-3d-flyover.step.3':
    '„Pauza“ zastaví přelet tam, kde je, a „Přehrát přelet“ odtud pokračuje. „Od začátku“ se vrátí na začátek a spustí přelet znovu.',
  'help.guide.tour-map-overlays.step.1':
    'Na kartě „Výlety“ otevřete lyžařský výlet. Sjezdovky jsou zapnuté od začátku: jejich přepínač je zasněžená hora v pilulce vlevo dole, „Sjezdovky, běžkařské tratě a vleky“. Kliknutím je na mapě skryjete a dalším kliknutím zase zobrazíte.',
  'help.ctx.trip-tour-stages.title': 'Vícedenní výlety',
  'help.guide.tour-multi-day.goal': 'Rozdělte jednu trasu na etapy, jednu na každý den na cestě.',
  'help.guide.tour-multi-day.tip.2':
    'Pokud chcete dvě etapy znovu spojit, zvolte v nabídce zastávky s měsícem „Odebrat konec etapy“. Spojí je i odebrání této zastávky a oznámení nabídne „Vrátit zpět“.',
  'help.guide.tour-stages-on-days.step.3':
    'Zvolte „Etapy od tohoto dne“: etapa 1 připadne na tento den a každá další na den následující. „Celá trasa v tento den“ naopak dá celou trasu na tento jediný den.',
  'help.guide.tour-stages-on-days.result':
    'Každá etapa je ve svém dni cesty a etapa, kterou jste otevřeli, je v editoru.',
  'help.ctx.trip-tour-hike.bullet.6':
    '„Přehled výletu“ vpravo ukazuje vzdálenost, stoupání, odhadovaný čas chůze nebo běhu, pauzy a plánovaný celkový čas, pod nimi výškový profil. Tlačítkem „Uložit“ dole v editoru výlet uložíte.',
  'help.guide.tour-hike-plan.step.6': 'Klikněte na „Uložit“ dole v levém sloupci.',
  'help.guide.tour-hike-trail-details.step.1':
    'Otevřete túru z „Výlety této cesty“ a pod kartou „Trasové body“ najděte „Podrobnosti o cestě“. Zapněte „Zobrazit podél trasy“.',
  'help.guide.tour-hike-trail-details.tip.3':
    'Nic na této kartě výlet nemění a karta potřebuje připojení. Importovaná túra má stejnou kartu ve svém zobrazení, jen bez limitu trasy.',
  'help.guide.tour-hike-round.result':
    'Túra vede po zvoleném okruhu zpět na start. „Okruh převzat“ dole na mapě nabízí „Vrátit zpět“ a tlačítkem „Uložit“ okruh uložíte.',
  'help.guide.tour-hike-compare-ways.step.3':
    'Odznaky na řádku ukazují, o kolik je varianta delší, vyšší nebo pomalejší než současná cesta. Klikněte na tu, kterou chcete.',
  'help.guide.tour-ferrata-add.step.1':
    'S otevřenou túrou klikněte v řadě mapových tlačítek vlevo dole na „Ferraty“. Odznak ukazuje počet ferat v zobrazené oblasti; pokud vás k tomu vyzve, přibližte mapu.',
  'help.guide.tour-ferrata-add.tip.3':
    'Úsek po feratě je zvýrazněný ve výškovém profilu, takže vidíte, v které části dne na něj dorazíte.',
  'help.guide.tour-run-plan.step.5': 'Do pole „Název výletu“ zadejte název běhu a klikněte na „Uložit“.',
  'help.guide.tour-run-ways.step.1':
    'Otevřete běh z „Výlety této cesty“ a v „Podrobnosti o cestě“ pod kartou „Trasové body“ zapněte „Zobrazit podél trasy“.',
  'help.ctx.trip-tour-walk.bullet.1':
    '„Typ túry“ s volbou „Procházka městem / po památkách“ z výletu udělá procházku. Její body jsou zastávky s popiskem („Popisek“), délkou pobytu a důležitostí. Procházka nemá limit obtížnosti ani pole „Pauzy“: místo nich se počítají pobyty.',
  'help.guide.tour-walk-plan.step.2':
    'Přidejte zastávky: zkontrolujte, že je zapnuté „Přidat bod“, a klikněte na mapu u každé z nich, nebo klikněte na „Místa cesty“ a vyberte místo, které už v cestě máte.',
  'help.guide.tour-walk-plan.result':
    'Procházka uvádí zastávky s délkou pobytu a „Přehled výletu“ je sečte. Zařaďte ji do dne a uvidíte, kdy na kterou zastávku dorazíte.',
  'help.guide.tour-walk-sights.tip.1': 'Stane se zastávkou procházky, ne místem cesty.',
  'help.guide.tour-walk-day-times.step.3':
    'Znovu otevřete procházku na kartě „Výlety“. Nahoře v části „Trasové body“ ukazuje „Časy pro“ den a jeho čas začátku. U procházky naplánované na více dní na něj klikněte a vyberte jiný.',
  'help.guide.tour-walk-google-import.goal':
    'Vložte pěší trasu sdílenou z Google Maps a načtěte její zastávky jako procházku.',
  'help.guide.tour-walk-google-import.result':
    'V editoru se otevře nová procházka městem se zastávkami z Google Maps, připravená k uložení.',
  'help.guide.tour-walk-check-off.tip.2': 'Počet ukazuje i řádek procházky v denním plánu, například 3/7.',
  'help.ctx.trip-tour-bike.bullet.4':
    'U profilu MTB ukazuje stejná karta obtížnost stezek (mtb:scale) tam, kde ji mapovači doplnili. Cesta bez stupně obtížnosti je neznámá, ne snadná.',
  'help.guide.tour-bike-profile.step.6':
    'Do pole „Název výletu“ zadejte název a pak klikněte na „Uložit“ dole v levém panelu.',
  'help.guide.tour-bike-surfaces.goal':
    'Zjistěte, jaká část trasy vede po asfaltu, po šotolině nebo po neznámém povrchu a po jakých typech cest.',
  'help.guide.tour-bike-surfaces.tip.3':
    'Karta vychází z trasy, jak ji naplánoval router, a na výletu nic nemění. Potřebuje připojení; offline vám to oznámí a trasa zůstane beze změny.',
  'help.guide.tour-bike-mtb-grades.tip.1':
    '„Bez stupně v datech“ znamená neznámou obtížnost, ne snadnou. Stupeň neříká nic o tom, jestli vám stezka sedí.',
  'help.ctx.trip-tour-ski.bullet.3':
    'Každý bod, na který na mapě kliknete, se s předchozím spojí po sjezdovkách, vlecích a tratích. Pod každým bodem je jeho úsek rozepsaný do čipů, sjezdovky v barvě své obtížnosti, s minutami. Úsek, který nelze naplánovat, zčervená, uvede důvod a nabídne opravu nebo „Nakreslit rovně“.',
  'help.guide.tour-ski-plan.step.4':
    'Zkontrolujte, že je zapnuté „Přidat bod“, a pak postupně klikněte na mapu tam, kde začínáte, a na každé místo, kam chcete dojet. Router sjezdovek spojí každý bod s předchozím po sjezdovkách, vlecích a tratích.',
  'help.guide.tour-ski-options.title': 'Nastavení routeru sjezdovek podle toho, jak lyžujete',
  'help.guide.tour-ski-options.tip.2':
    '„Jezdit lanovkami“ je ve výchozím stavu zapnuté pro „Sjezd“ a Snowboard a vypnuté pro ostatní disciplíny. „Vynechat“ a „Podle potřeby sjet lanovkou“ se zobrazují, jen když se lanovkami jezdí.',
  'help.guide.tour-ski-fix-leg.tip.1':
    'Bod můžete na mapě také přetáhnout blíž ke sjezdovce, trati nebo vleku. Po puštění se úsek naplánuje znovu.',
  'help.guide.tour-ski-summary.step.2':
    '„Lyžování“, „Na lanovkách“, „Čekání“ a „Pěšky“ ukazují čas pro každou činnost. „Sjezdovky“, „Sjezd po sjezdovkách“ a „Jízdy vlekem“ ukazují délku sjezdovek, výškový rozdíl, který na nich sjedete, a počet jízd vlekem.',
  'help.guide.tour-ski-pistes-layer.goal':
    'Prohlédněte si sjezdovky, běžkařské tratě a vleky kolem svého lyžařského výletu a zjistěte, co znamenají jejich barvy.',
  'help.guide.tour-ski-import.title': 'Import lyžařské stopy a určení, o co šlo',
  'help.guide.tour-ski-import.tip.1':
    'Importovaná stopa zůstane tak, jak byla zaznamenaná: TREK ji nepřiřazuje ke sjezdovkám a na její kartě je „Čas na lyžích“ uvedený jako „Nepočítá se“.',
  'help.ctx.trip-tour-paddle.bullet.3':
    '„Další akce“ u bodu obsahují vodácké nástroje: naplánovat další úsek po vodě nebo ho nakreslit ručně, „Odtud loď přenášet“ a „Zdymadlo v tomto bodě“.',
  'help.guide.tour-paddle-setup.step.3':
    'V části „Loď“ vyberte „Kajak“, „Kánoe“, SUP nebo „Ostatní“. Podle lodi TREK navrhne rychlost.',
  'help.guide.tour-paddle-setup.tip.4':
    'Řádek „Pádlování má rizika“ dole ve sloupci otevře „Bezpečnost na vodě“. Před prvním výletem si ji jednou přečtěte.',
  'help.guide.tour-paddle-water-route.step.5':
    'Pokud chcete naplánovat všechny ručně nakreslené úseky najednou, klikněte na „Naplánovat ručně kreslené úseky po vodě“, vlny v záhlaví „Trasové body“.',
  'help.guide.tour-paddle-portage.step.1':
    'Najeďte na zastávku, kde vystupujete, a klikněte na „Další akce“, tři tečky.',
  'help.guide.tour-paddle-portage.result':
    'Úsek je na mapě i v trasových bodech přenáškou a „Odhad času“ ho počítá jako přenášení.',
  'help.guide.tour-paddle-lock.tip.2':
    'Pokud zdymadlo obchází přenáška, je zdymadlo ztlumené a označené „Přeneseno kolem“. Místo něj se počítá čas přenášky a minuty zdymadla se nezahrnují.',
  'help.guide.tour-paddle-time.step.4':
    'Pokud výlet obsahuje přenášku, řádek „Přenášení“ ji započítá. Klikněte na jeho rychlost a zadejte, jak rychle loď přenášíte. „Výstup a opětovný nástup“ přidá minuty u každé přenášky.',
  'help.guide.tour-paddle-wind.step.1':
    'Zařaďte vodácký výlet do některého dne cesty. Karta „Vítr“ v levém sloupci pak ukáže předpověď pro ten den na začátku výletu.',
  'help.guide.tour-paddle-wind.result': 'Znáte vítr pro daný den v místě, kde spouštíte loď na vodu, hodinu po hodině.',
  'help.guide.tour-paddle-checklist.tip.1':
    'U každé překážky vyberte, co uděláte: „Projet“, „Přenést“, „Objet“ nebo „Netýká se“. „Další“ vás přenese k další nevyřešené položce.',
  'help.guide.tour-paddle-track-marks.step.1':
    'Na kartě „Výlety“ klikněte v pravém sloupci na „Přidat túru“, zvolte „Importovat GPX nebo KML“ a vyberte soubor.',
  'help.guide.tour-paddle-track-marks.tip.2':
    '„Zahodit“ odstraní značky, které jste neuložili. Samotná zaznamenaná stopa se nikdy nepřekresluje.',
  'help.ctx.trip-tour-horse.bullet.4':
    'TREK čas jízdy nepočítá. Pokud ho chcete mít ve dni, zadejte čas do pole „Plánováno“ v části „Podrobnosti“.',
  'help.guide.tour-horse-plan.step.5':
    'Vyberte úsek v části „Úseky“. Zkontrolujte „Směr“, kterým ho pojedete, a co u něj uvádí „Přístup pro koně“.',
  'help.guide.tour-horse-plan.tip.5':
    'Na vyjížďce nic neplánuje router: kliknutí na nakreslenou linii nepřidá tvarový bod a body na koncích úseku zůstávají tam, kde je trasa má.',
  'help.guide.tour-horse-gap.tip.1':
    'Ručně zadaný úsek nezkontroloval žádný router ani žádná jezdecká trasa. Na mapě se podívejte, kudy skutečně vede.',
  'help.guide.tour-horse-recorded.step.4':
    'Vyjížďka se otevře v levém sloupci. Karta „Zaznamenaná vyjížďka“ ukazuje „Jak bylo zaznamenáno“, „Bez doby jízdy“ a „Přístup neověřen“. Najeďte na odznak a dozvíte se proč.',
  'help.guide.dateless-trip.step.2':
    'Pole „Datum začátku“ a „Datum konce“ nechte prázdná. Pod nimi se objeví pole „Počet dnů“: zadejte, na kolik dní chcete plánovat.',
  'help.guide.trip-reminder.tip.1':
    'Blok „Připomínka“ vidí jen vlastník cesty (nebo správce). Pokud je zašedlý, musí správce nejdřív zapnout připomínky cest v části Správce, Oznámení.',
  'help.guide.upcoming-reservations.step.2': 'Kliknutím na rezervaci otevřete cestu, ke které patří.',
  'help.guide.timezones-widget.tip.1':
    'Seznam používá oficiální názvy časových pásem, například Europe/Lisbon nebo America/New_York, takže hledejte město, které je v názvu.',
  'help.guide.half-company-holiday.step.2': 'Na stejném panelu nástrojů zapněte „Půlden“.',
  'help.guide.edit-holiday-calendar.tip.1': 'Každá změna se uloží hned. Tlačítko „Uložit“ tu není.',
  'help.guide.person-color.tip.1': 'Stejnou barvou je osoba označená na panelu nástrojů i na kartě „Nárok“.',
  'help.guide.answer-fusion-request.step.2':
    'Přečtěte si, co propojení znamená: jeden společný kalendář, záznamy, které si můžete navzájem upravovat, a společné nastavení svátků.',
  'help.guide.log-for-partner.step.2':
    'Podívejte se na panel nástrojů: jeho první tlačítko teď ukazuje jméno a barvu dané osoby.',
  'help.guide.dissolve-fusion.step.2': 'Dole v části „Zrušit propojení“ klikněte na „Oddělit“.',
  'help.guide.country-places.step.3':
    'Dialog vypíše všechna místa započtená pro danou zemi, seskupená podle cest; pokud jich je víc než šest, můžete seznam zúžit polem „Hledat místa“ nahoře. Kliknutím na místo nebo nadpis cesty otevřete tuto cestu v plánovači.',
  'help.guide.tour-activity-stats.step.5':
    'Klikněte na „Zobrazit výlety“. Otevře se „Moje absolvované výlety“ se součty, rozpadem „Podle druhu“ a všemi výlety daného období s dnem, cestou, vzdáleností a stoupáním. Pilulkami v záhlaví tu můžete také měnit období a typ.',
  'help.guide.move-to-list.step.3':
    'Vyberte cílový seznam. Pokud máte víc než tři seznamy, můžete je zúžit vyhledávacím polem nahoře.',
  'help.guide.accept-list-invite.goal': 'Připojte se k seznamu, který s vámi někdo sdílí, nebo pozvánku odmítněte.',
  'help.guide.tour-collection-add-to-trip.step.4':
    'Pokud chcete, změňte „Název v cestě“ a pak klikněte na „Přidat do cesty“.',
  'help.guide.tour-collection-manage.step.2': 'Pište do pole „Hledat místa“. Zúží podle názvu výlety i místa.',
  'help.guide.create-journey.tip.3':
    'Když cesta právě skončila, můžete v banneru „Cesta právě skončila“ nahoře kliknout na „Vytvořit cestovní deník“ a deník se založí s touto cestou už vybranou.',
  'help.guide.entry-draft.step.2': 'Klikněte na „Uložit“. Karta teď má odznak „Koncept“.',
  'help.guide.gallery-map.step.3':
    'Zpátky na „Časová osa“ sleduje mapa vpravo vaše posouvání: záznam, který právě vidíte, má kroužek v barvě svého dne. Kliknutím na špendlík posunete časovou osu k jeho záznamu.',
  'help.guide.journey-map-layers.tip.1':
    'Čárkovaná barevná linie je trasa GPX z cesty, tedy součást plánu; plná linie je trasa zaznamenaná v daný den.',
  'help.guide.journey-keep-route.tip.1': 'Kde záznam končí, končí i linie. TREK kreslí jen to, co bylo zaznamenáno.',
  'help.guide.journey-day-stays.tip.1':
    'Řádek se zobrazuje jen těm, kdo smějí deník upravovat a mají připojený vlastní Dawarich, a jen ve dnech, kde je ještě co rozhodnout.',
  'help.guide.journey-take-over-day.step.4':
    'Pokud chcete zachovat i trasu, nechte zapnuté „Uložit i trasu dne“ a pak klikněte na tlačítko „Převzít“. Ukazuje, kolik konceptů vytvoří.',
  'help.guide.journey-auto-prepare.step.3':
    'Řádek pod tím uvádí, kdy se vaše pobyty naposledy načetly, nebo proč to nefungovalo. Kliknutím na „Načíst teď“ se Dawarich zeptáte hned.',
  'help.guide.photo-location.tip.1': 'Místa, která jste nastavili sami, se nikdy nepřesouvají.',
  'help.ctx.settings-plugins.bullet.1':
    '„Nastavení doplňků“: pod nadpisem je karta pro každý plugin, který od vás potřebuje údaje, s jeho poli a tlačítkem „Uložit“. Tajné pole se po uložení už nikdy nezobrazí.',
  'help.guide.dashboard-widgets.step.3':
    '„Obnovit výchozí“ pod kartami vrátí celou kartu „Vzhled“ na původní nastavení.',
  'help.guide.web-push-device.result':
    'Karta ukazuje „Zapnuto pro toto zařízení“ a události zapnuté ve sloupci Push vám přijdou, i když je TREK zavřený.',
  'help.guide.connect-airtrail.step.1':
    'V části „Integrace“ najděte AirTrail a zadejte jeho „URL instance“ a API klíč. Klíč vytvoříte v AirTrail v části Nastavení, Zabezpečení.',
  'help.guide.connect-dawarich.step.1':
    'V části „Integrace“ najděte Dawarich a zadejte jeho „Adresa instance“ a API klíč, který najdete v Dawarich v části Účet, API klíč.',
  'help.guide.tour-connect-wanderer.step.1':
    'V části „Integrace“ najděte wanderer a zadejte jeho „URL instance“ a API token. Token vytvoříte ve wanderer v části Nastavení, Účet, API tokeny; začíná na wanderer_key_.',
  'help.guide.tour-wanderer-watch.goal': 'Nechte TREK na pozadí hlídat změny tras, které jste importovali.',
  'help.guide.mcp-oauth.tip.3':
    'API tokeny stále fungují, ale jsou označené jako „Zastaralé“; přejděte na klienta OAuth.',
  'help.guide.offline-conflicts.tip.2': 'Volba platí jen pro toto zařízení.',
  'help.guide.default-user-settings.tip.1':
    'Vlastní volba uživatele v Nastavení má vždy přednost; tyto hodnoty platí pro všechny, kdo dané nastavení nezměnili.',
  'help.guide.own-routing-engine.step.1':
    'Na kartě „Výchozí nastavení uživatele“ v části „Mapa“ zadejte do pole „Vlastní směrovací server“ adresu svého serveru OSRM.',
  'help.guide.admin-passkeys.tip.2':
    'Pokud doménu později změníte, přestanou fungovat všechny přístupové klíče, které už lidé přidali.',
  'help.guide.instance-keys.tip.4': 'Klíč Amap musí být typu Web 服务 (webová služba), ne klíč pro JS API.',
  'help.guide.rotate-jwt-secret.step.2': 'Přečtěte si varování a klikněte na „Obnovit a odhlásit“.',
  'help.guide.notification-defaults.tip.2': 'Výchozí hodnota platí jen pro ty, kdo danou buňku sami nezměnili.',
  'help.ctx.notifications.bullet.5':
    'Které události dostáváte sem a které e-mailem, webhookem, přes ntfy nebo jako push, nastavíte v Nastavení v části „Oznámení“.',
  'help.guide.read-notifications.result':
    'Jste na obrazovce, které se oznámení týkalo, a číslo u zvonku se sníží o jedna.',
  'help.guide.mark-notifications-read.title': 'Označení oznámení jako přečtených',
  'help.guide.delete-notifications.goal': 'Udržujte seznam krátký a mažte, co už nepotřebujete.',
  'help.guide.notification-settings.step.1': 'Klikněte vpravo nahoře na své jméno.',
  'help.guide.public-link.step.5': 'Dokud odkaz existuje, můžete volby měnit. „Smazat odkaz“ odkaz vypne.',
  'help.guide.link-journal.step.3':
    'U každé osoby z cesty vyberte „Bez přístupu“, „Číst“ nebo „Upravit“. „Všichni čtou“ a „Nikdo“ nastaví všechny najednou.',
  'help.guide.collapse-columns.tip.3': 'Když je oddělovač aktivní, můžete ho posouvat i šipkami na klávesnici.',
  'help.guide.edit-place.tip.3':
    'Když kliknete mimo dialog, o změny nepřijdete: TREK se nejdřív zeptá „Zahodit změny?“ a tlačítkem „Pokračovat v úpravách“ se vrátíte do formuláře.',
  'help.guide.dawarich-stays.goal':
    'Přidejte místa, kde Dawarich během cesty zaznamenal vaše pobyty, až každé z nich zkontrolujete.',
  'help.guide.leave-stop-off-route.step.1':
    'Klikněte na zastávku pravým tlačítkem nebo na její tři tečky a zvolte „Vynechat z trasy“.',
  'help.guide.move-booking-day.step.3':
    'Řádek je teď v novém dni ve svém vlastním čase. Pokud potřebujete změnit i čas, otevřete rezervaci.',
  'help.guide.place-image-from-file.goal':
    'Použijte jako obrázek místa fotku, která už je mezi jeho soubory, aniž byste ji museli nahrávat znovu.',
  'help.guide.place-image-from-file.tip.3': 'Obrázek mohou měnit jen cestující, kteří smějí upravovat místa.',
  'help.guide.place-own-hours.result':
    'Karta ukazuje vaše telefonní číslo, váš e-mail a vaši otevírací dobu a kroužek kolem obrázku je zelený nebo červený podle vaší otevírací doby.',
  'help.guide.confirm-stay-booking.step.4':
    'Zavřete rezervaci křížkem vpravo nahoře. Karta pobytu teď v části „Rezervace“ ukazuje „Potvrzeno“.',
  'help.guide.tour-map-lines.title': 'Výlety na mapě',
  'help.guide.tour-map-lines.tip.2':
    'Skrytí výletu platí jen pro vás a ukládá se v tomto prohlížeči pro tuto cestu: výlet, jeho dny a barva zůstávají pro všechny stejné. „Zobrazit vše“ nad seznamem výletů znovu zobrazí všechny skryté výlety a mapa v telefonu ukazuje vždy všechny výlety.',
  'help.guide.car-stops.step.4':
    'V části „Zastávky po cestě“ klikněte na „Přidat zastávku“ u každého místa, kterým jízda projíždí, a vyberte ho, případně i s časem. Zastávka bez vybraného místa se při uložení odstraní.',
  'help.guide.transport-details.step.2':
    'Pilulky v záhlaví ukazují stav, typ, den a „Rezervační kód“. Kliknutím na pilulku stavu přepínáte mezi „Čeká na potvrzení“ a „Potvrzeno“. Malá ikona kopírování v pilulce s kódem, „Kopírovat rezervační kód“, zkopíruje kód do schránky.',
  'help.guide.group-sort-bookings.step.3':
    'V části „Seřadit podle“ vyberte „Datum“, „Název“, „Typ“ nebo „Stav“. Řádek pod nimi obrací pořadí: „Od nejdřívějších“ nebo „Od nejpozdějších“ u data, „A až Z“ nebo „Z až A“ u ostatních.',
  'help.guide.booking-on-map.title': 'Rezervace na mapě',
  'help.guide.export-bookings-csv.tip.1':
    'Sloupce jsou Typ, Název, Stav, Začátek, Konec, Od, Do, Místo, Potvrzení a Poznámky.',
  'help.guide.arrange-packing-list.tip.1':
    'Když je zapnuté „A až Z“, položky přetahovat nemůžete, celé seznamy ale ano.',
  'help.guide.count-packed-pieces.step.3':
    'Dokud je zabalená jen část kusů, má počítadlo vaši barvu zvýraznění a zaškrtávací pole má obrys ve stejné barvě. Kliknutím na minus kus z počtu odeberete.',
  'help.guide.expense-receipts.step.5':
    'Náhled zobrazí účtenku a nahoře tlačítka „Otevřít v nové kartě“ a „Stáhnout“. Pokud je účtenek víc, přepínáte mezi nimi šipkami a klávesou Esc náhled zavřete.',
  'help.guide.files-sync-settings.step.3': 'Kliknutím na „Nastavení“ pod lištou toku zobrazíte ostatní možnosti.',
  'help.guide.manage-notes.step.3':
    '„Připnout“ ve stejné nabídce udrží poznámku nahoře v panelu, s rámečkem v barvě její kategorie a špendlíkem vedle nadpisu. „Odepnout“ ve stejné nabídce vrátí poznámku na její běžné místo.',
  'help.guide.note-categories.step.1':
    'Klikněte na ozubené kolo vedle „Nová poznámka“ v záhlaví karty „Poznámky“. Otevře se „Spravovat kategorie“ s řádkem pro každou kategorii: barva, název, šest barevných teček a koš.',
  'help.guide.note-categories.tip.2':
    'Kategorie bez poznámek se ukládá jen ve vašem prohlížeči. Ostatní členové ji uvidí, jakmile do ní bude zařazená nějaká poznámka.',
  'help.guide.roadtrip-reorder.goal': 'Změňte pořadí jízdy nebo přesuňte zastávku na jiný den, a to přímo na liště.',
  'help.guide.roadtrip-overnight.step.4':
    '„Najít ubytování“ vedle ukáže název ke zkopírování a odkazy na rezervační weby: trivago nebo CHECK24 pro hotel, PiNCAMP nebo Pitchup pro kemp. Místo, termín a počet hostů zkontrolujte na daném webu.',
  'help.guide.roadtrip-stop-fill.step.2':
    'V části „Natankuje na“ vyberte 50 až 100. Řádek pod tlačítky ukazuje, jak daleko se s tím odsud dostanete.',
  'help.guide.roadtrip-bookings.step.2':
    'Na liště je spoj karta v barvě svého typu, s jízdním řádem ve sloupci příjezdu a výchozím a cílovým bodem pod názvem.',
  'help.guide.roadtrip-google-import.tip.1':
    'TREK si mezi zastávkami vypočítá vlastní trasu; silnici z Google nekopíruje.',
  'help.guide.roadtrip-hazards.result': 'Mapa ukazuje aktuální varování v okolí vaší cesty a trasa se nemění.',
  'help.ctx.trip-tours.bullet.3':
    'Řádek: barevný pruh je linie výletu na mapě, kulatá dlaždice ukazuje limit trasy (T1 až T6) nebo typ, malý odznak GPX nebo wanderer označuje import a odznaky uvádějí dny, čas, vzdálenost a stoupání. Měsíc s číslem ukazuje počet etap vícedenního výletu.',
  'help.guide.tour-show-list.step.3': 'Klikněte na řádek. Karta výletu se otevře přes mapu.',
  'help.guide.tour-add-to-day.goal':
    'Naplánujte, kdy výlet absolvujete, aby se zobrazil ve dni i se svou linií na mapě.',
  'help.guide.tour-add-to-day.tip.3':
    'Výlet můžete do dne přidat jen jednou. Pokud ho přetáhnete na den, kde už je, TREK jen ukáže „Tento výlet už je k tomuto dni přiřazen.“',
  'help.guide.tour-day-times.step.4':
    'Pokud výlet skončí až po začátku další položky dne, upozorní vás na to poznámka pod řádkem, například Skončí v 13:30, po začátku Oběd v Gostner Schwaige ve 12:30. Nic se nepřesouvá.',
  'help.guide.tour-remove-from-day.step.1':
    'Ve sloupci dnů najeďte na řádek výletu, klikněte na „Další možnosti“ a zvolte „Odebrat ze dne“.',
  'help.guide.tour-filter-list.step.1':
    'Klikněte na tlačítko filtru pod „Importovat GPX nebo KML“. Ukazuje stav, podle kterého filtruje, na začátku „Vše“, a vedle počet výletů.',
  'help.guide.tour-hide-on-map.title': 'Skrytí linie výletu na mapě',
  'help.guide.tour-import-plan-tab.title': 'Import stopy z karty Plán',
  'help.ctx.trip-tour-detail.title': 'Podrobnosti výletu',
  'help.guide.tour-detail-read.goal':
    'Prohlédněte si všechny informace, které cesta o výletu má: dny, vzdálenost a výšky, profil a zdroj.',
  'help.guide.tour-detail-read.tip.1':
    'Oranžová pilulka use with caution znamená, že import má neúplné výšky nebo měření. Mějte to na paměti, když čtete jeho stoupání a profil.',
  'help.guide.tour-rename-colour.step.1':
    'Otevřete kartu výletu a klikněte na tužku vedle jeho názvu. Z názvu se stane textové pole.',
  'help.guide.tour-take-along.goal':
    'Nechte se navigovat na začátek výletu, otevřete jeho stránku na webu nebo si stáhněte trasu jako soubor GPX.',
  'help.guide.tour-take-along.result': 'Cestu na začátek máte v mapové aplikaci a celou trasu jako soubor GPX.',
  'help.guide.tour-copy-keep.tip.2':
    '„Uložit do sbírky“ v nabídce výletu v denním plánu otevře stejný dialog, takže se trasa uloží i tam.',
  'help.guide.tour-packing-link.step.3': 'Klikněte na „Připojit“.',
  'help.guide.tour-files.goal':
    'Přidejte k výletu rezervaci, mapu nebo popis trasy a otevírejte je pak přímo z karty výletu.',
  'help.guide.tour-activity-link.goal':
    'Propojte zaznamenanou stopu GPX s naplánovaným výletem, aniž byste měnili plán.',
  'help.guide.tour-activity-link.tip.3':
    '„Potřebný čas“ se počítá od prvního do posledního časového razítka ve stopě, včetně přestávek.',
  'help.guide.tour-activity-compare.tip.1':
    '„Porovnat na mapě“ je k dispozici, jen když je karta zobrazená vedle mapy, ne v telefonu.',
  'help.guide.tour-origin-check.tip.1':
    'U výletu převzatého z jiné cesty je v části „Převzato z“ uvedena tato cesta a výlet.',
  'help.ctx.trip-tour-planner.bullet.3':
    '„Výlety této cesty“ v pravém panelu vypisují všechny výlety, nad seznamem je filtr a „Rozsah cesty“. Když je otevřený výlet, „Přehled výletu“ nahoře ukazuje jeho vzdálenost, stoupání, čas a výškový profil. Plusem nahoře, „Přidat túru“, výlet naplánujete, importujete nebo převezmete.',
  'help.guide.tour-open-workspace.step.3':
    'Pravý panel, „Výlety této cesty“, vypisuje všechny výlety cesty, nad seznamem je filtr a „Rozsah cesty“.',
  'help.guide.tour-open-workspace.result': 'Karta „Výlety“: vlevo editor, vpravo výlety cesty a mezi nimi mapa.',
  'help.guide.tour-draw-route.step.6':
    'V části „Trasové body“ dostane každý bod řádek s číslem a po načtení i názvem podle místa. Zatímco TREK pracuje, ukazuje malá tečka vedle „Nový výlet“ jeho stav.',
  'help.guide.tour-type-profile.step.1':
    'Pod „Název výletu“ klikněte na „Typ túry“. Ukazuje aktuální typ a řádek o tom, jak se plánuje.',
  'help.guide.tour-edit-points.goal': 'Změňte, kudy výlet vede, posouváním jeho bodů na mapě nebo v seznamu.',
  'help.guide.tour-edit-points.tip.2':
    'Dokud se nenačte název místa, ukazuje řádek souřadnice. „Vrátit zpět“ a „Znovu“ nemají klávesovou zkratku.',
  'help.guide.tour-shaping-points.tip.1': 'Začátek a konec jsou vždy zastávky.',
  'help.guide.tour-loop-reverse.step.3': 'Kliknutím na „Obrátit směr“ vedle projdete celý výlet opačným směrem.',
  'help.guide.tour-leg-by-hand.step.2':
    'Z úseku se stane čárkovaná přímka a seznam pod řádkem ukáže „Nakresleno ručně, nevypočítáno“ i s délkou.',
  'help.guide.tour-trip-places.step.1':
    'V části „Trasové body“ klikněte vedle „Přidat bod“ na „Místa cesty“. Pod tím se zobrazí místa cesty.',
  'help.guide.tour-details-times.title': 'Pojmenování výletu a plánování času',
  'help.guide.tour-details-times.tip.3':
    'Šipkou vedle „Podrobnosti“ sekci sbalíte. Sama se otevře, když některé její pole obsahuje hodnotu, kterou „Uložit“ nepřijme.',
  'help.guide.tour-save.tip.1': '„Zahodit“ vedle „Uložit“ po potvrzení zahodí neuložené změny. Uložený výlet nemění.',
  'help.guide.tour-edit-saved.step.3':
    'Klikněte na „Uložit“. Zobrazí se „Výlet uložen“ a výlet si zachová své dny, soubory i poznámky.',
  'help.guide.tour-summary-profile.step.1':
    '„Přehled výletu“ nahoře v „Výlety této cesty“ ukazuje „Vzdálenost“, „Stoupání“ a „Klesání“ výletu otevřeného v editoru, jeho odhadovaný čas, pauzy a plánovaný celkový čas.',
  'help.guide.tour-list-manage.title': 'Správa výletů cesty',
  'help.guide.tour-list-manage.tip.2':
    'Den, ve kterém už výlet je, je v nabídce dnů zašedlý. U vícedenního výletu se TREK zeptá, jestli mají jeho etapy začít tímto dnem, nebo má být celý výlet v tomto dni.',
  'help.guide.tour-delete.tip.2':
    'Pokud ho chcete jen vyřadit ze dne, použijte místo toho „Odebrat ze dne“ v nabídce dne.',
  'help.guide.tour-saved-elsewhere.step.4':
    'Zvolte „Uložit jako novou túru“, pokud chcete zachovat obě verze, „Načíst novější“, pokud chcete načíst druhou verzi, nebo „Přepsat“, pokud chcete druhou verzi nahradit svou.',
  'help.ctx.trip-tour-import.bullet.3':
    'Import se otevře jako „Výlet GPX“ nebo „Výlet z aplikace wanderer“: jeho linie, „Přehled výletu“ a výškový profil přesně tak, jak byly importovány. Jeho řádek v seznamu má odznak „Import GPX“.',
  'help.guide.tour-import-gpx.step.4':
    'V části „Importovat jako“ zkontrolujte, čím stopy jsou. Předvolená je „Pěší túra“. „Cyklovýlet“ nebo „Běh“ se ptá na profil, „Vodácká túra“ na loď a vodu, „Lyže a zima“ na disciplínu.',
  'help.guide.tour-view-import.title': 'Prohlížení importované stopy',
  'help.guide.tour-view-import.result':
    'Vidíte zaznamenanou stopu přesně tak, jak byla importována, bez přepočítávání.',
  'help.guide.tour-plan-from-import.tip.2':
    'Když karta uvádí, že se návrh na delších úsecích od stopy vzdaluje, zkontrolujte tyto části na mapě dřív, než podle něj začnete plánovat.',
  'help.guide.tour-restore-recorded.step.3':
    'Potvrďte tlačítkem „Obnovit zaznamenanou stopu“. Trasové body a vypočítaná linie se odstraní, dny a poznámky zůstanou.',
  'help.guide.tour-take-over.step.3':
    'Najděte výlet: pište do pole „Hledat podle názvu“, nebo seznam zužte filtry „Cesta“ a „Typ“.',
  'help.guide.tour-import-wanderer.title': 'Import trasy z wanderer',
  'help.guide.tour-import-wanderer.tip.3':
    'Trasa, která už v cestě je, je označená „V této cestě“ a nabízí „Otevřít výlet“. Trasa, která se od importu změnila, nabízí vedle staré verze „Importovat jako novou verzi“.',
  'help.ctx.trip-tour-map.bullet.4':
    '„Podél túry“, karta v levém panelu, hledá v blízkosti trasy vyhlídky, vodu, chaty, jídlo a další a vypíše výsledky. Místo ze seznamu můžete přidat do výletu jako zastávku.',
  'help.guide.tour-map-layers.tip.1':
    'Vybraná mapa zůstane pro každý výlet, který otevřete, dokud stránku znovu nenačtete. Výlet, jehož typ ji nenabízí, se otevře na „Mapa“; mapa na kartě „Plán“ ani volba v Nastavení se nemění.',
  'help.guide.tour-along-search.step.4': 'Klikněte na „Hledat podél túry“. TREK jen hledá: výlet se nemění.',
  'help.guide.tour-along-add-stop.step.1':
    'Klikněte na místo v seznamu „Podél túry“ nebo na jeho špendlík na mapě. Přes mapu se otevře jeho karta: co to je, jak daleko je od trasy a v jaké části výletu leží.',
  'help.guide.tour-3d-terrain.title': 'Výlet ve 3D',
  'help.guide.tour-3d-terrain.tip.1':
    '„Přehled“ ve stejném řádku znovu zobrazí celou trasu, když jste pohled posunuli.',
  'help.guide.tour-3d-flyover.step.4': 'Kliknutím na „Přehled“ znovu zobrazíte celý výlet.',
  'help.guide.tour-map-overlays.step.2':
    'Klikněte na „Legenda sjezdovek“, malý čtvereček s barevnými tečkami vedle přepínače.',
  'help.ctx.trip-tour-stages.summary':
    'Vícedenní výlet je jedna trasa rozdělená na etapy, jednu na každý den na cestě. Tady nastavíte, kde který den končí, uvidíte údaje každé etapy a zařadíte etapy do dnů cesty.',
  'help.guide.tour-multi-day.step.1': 'V „Výlety této cesty“ klikněte na výlet a otevřete ho v editoru.',
  'help.guide.tour-multi-day.tip.3':
    'Čas etapy nezahrnuje pauzy. Čas ve výstražné barvě, „Víc než den v pohybu“, je delší než jeden den.',
  'help.guide.tour-stages-on-days.step.4': 'Etapy zobrazíte tlačítkem s měsícem a počtem etap, „Zobrazit etapy“.',
  'help.ctx.trip-tour-hike.title': 'Túry a běhy',
  'help.guide.tour-hike-plan.title': 'Plánování túry v obtížnosti, kterou si určíte',
  'help.guide.tour-hike-plan.result':
    'Túra je v „Výlety této cesty“ se vzdáleností, stoupáním a časem chůze, připravená k zařazení do dne.',
  'help.guide.tour-hike-trail-details.step.2':
    'Vyberte, co zobrazit: SAC pro turistickou obtížnost, „Povrch“ nebo „Typ cesty“. Trasa na mapě má stejné barvy jako seznam.',
  'help.guide.tour-hike-round.title': 'Okružní túra zhruba dané délky',
  'help.guide.tour-hike-round.tip.1':
    'Okruhy nepřekračují „Maximální obtížnost stezky“ túry; pilulka T na kartě ukazuje jakou.',
  'help.guide.tour-hike-compare-ways.step.4':
    'Klikněte na „Použít tuto cestu“. TREK s routerem ověří, že po ní trasa skutečně vede.',
  'help.guide.tour-ferrata-add.step.2':
    'Klikněte na mapě na feratu, na její čárkovanou linii nebo značku. Její karta ukazuje název, obtížnost a délku.',
  'help.guide.tour-ferrata-add.tip.4':
    '„Zobrazit v OpenStreetMap“ na kartě otevře vlastní data ferraty. Když se nic nenačte, odznak zoranžoví a důvod najdete v popisku.',
  'help.guide.tour-run-plan.result':
    'Běh je v „Výlety této cesty“ s údajem „Čas běhu (plánovaný)“ a uloží se i jeho profil a tempo.',
  'help.guide.tour-run-ways.step.2':
    'Horní část karty teď ukazuje, jaká část běhu vede po nezpevněném povrchu, a nejtěžší klasifikovanou stezku na trase.',
  'help.ctx.trip-tour-walk.bullet.2':
    '„Trasové body“ vypisují zastávky v pořadí. Kroužek kolem čísla zastávky ji označuje jako „Musíš vidět“ (plný) nebo „Volitelné“ (čárkovaný), malý štít jako „Chráněná“ a pilulka pod názvem ukazuje, jak dlouho tam zůstanete.',
  'help.guide.tour-walk-plan.step.3':
    'V „Trasové body“ najeďte na zastávku, klikněte vedle na „Další akce“ a zvolte „Upravit zastávku“.',
  'help.guide.tour-walk-sights.title': 'Přidání pamětihodností k procházce městem',
  'help.guide.tour-walk-sights.tip.2':
    'Po změně trasy ukazuje tlačítko „Hledat znovu“, protože nalezená místa patří k původní trase.',
  'help.guide.tour-walk-day-times.step.4':
    'Pod každou zastávkou vidíte, kdy dorazíte a jak dlouho zůstanete. Pokud je místo v tu dobu zavřené nebo během pobytu zavírá, zobrazí se varování.',
  'help.guide.tour-walk-google-import.step.1':
    'V „Výlety této cesty“ klikněte na „Přidat túru“ (+ nahoře) a zvolte „Importovat procházku z Google Maps“.',
  'help.guide.tour-walk-check-off.title': 'Odškrtávání zastávek procházky v daný den',
  'help.guide.tour-walk-check-off.tip.3':
    'Pokud procházku zařadíte do dne offline, můžete ji odškrtávat, jakmile se synchronizuje.',
  'help.guide.tour-bike-profile.title': 'Plánování cyklovýletu podle toho, jak jezdíte',
  'help.guide.tour-bike-profile.result':
    'Cyklovýlet je uložený a uvedený v „Výlety této cesty“, naplánovaný pro svůj profil, s dobou jízdy v „Přehled výletu“.',
  'help.guide.tour-bike-surfaces.step.1':
    'Vpravo v „Výlety této cesty“ klikněte na cyklovýlet a otevřete ho. Jakmile je jeho trasa vypočítaná, objeví se pod „Trasové body“ karta „Povrch a cesty“.',
  'help.guide.tour-bike-surfaces.tip.4':
    'Kliknutím na nadpis karty ji sbalíte. V tomto prohlížeči zůstane sbalená i po opětovném načtení.',
  'help.guide.tour-bike-mtb-grades.tip.2':
    'Tam, kde mapovači ohodnotili stoupání, následuje níže „Obtížnost do kopce (mtb:scale:uphill)“ s vlastními řádky.',
  'help.ctx.trip-tour-ski.bullet.4':
    'Karta „Trasa po sjezdovkách“ pod trasovými body rozděluje den na „Lyžování“, „Na lanovkách“, „Čekání“ a „Pěšky“ a uvádí délku sjezdovek, výškový rozdíl, který na nich sjedete, a jízdy lanovkou. „Čas na lyžích“ v „Přehled výletu“ vpravo vše sečte, jakmile je naplánovaný každý úsek.',
  'help.guide.tour-ski-plan.step.5':
    'Pod každým bodem je jeho úsek rozepsaný do čipů: každá sjezdovka, vlek a úsek pěšky podle názvu nebo typu, sjezdovky s tečkou v barvě své obtížnosti, a u každého minuty.',
  'help.guide.tour-ski-options.goal':
    'Nastavte nejtěžší sjezdovky, co upřednostnit, své tempo a které lanovky použít, aby vám úseky seděly.',
  'help.guide.tour-ski-options.tip.3':
    '„Vyhnout se domnělým spojkám“ udrží trasu mimo spojení, která mapová data jen odhadují, například nezmapovaný úsek mezi dvěma sjezdovkami.',
  'help.guide.tour-ski-fix-leg.tip.2':
    'Dokud se data o sjezdovkách pro danou oblast stahují, plánovač počká a pak to automaticky zkusí znovu.',
  'help.guide.tour-ski-summary.step.3':
    'V „Přehled výletu“ vpravo vše sečte „Čas na lyžích“. Informační tečka u něj vysvětluje, jak se počítá.',
  'help.guide.tour-ski-pistes-layer.step.1':
    'Když je otevřený výlet typu „Lyže a zima“, mapa automaticky ukazuje sjezdovky. Přepínač se zasněženou horou v řadě vlevo dole na mapě je vypíná a zapíná; jeho popisek zní „Sjezdovky, běžkařské tratě a vleky“.',
  'help.guide.tour-ski-import.goal':
    'Importujte zaznamenanou stopu ze sjezdovek, běžek nebo sněžnic a přiřaďte jí správnou disciplínu.',
  'help.guide.tour-ski-import.tip.2':
    'Pokud ji chcete upravovat jako naplánovaný výlet, použijte „Naplánovat upravitelnou verzi“ na její kartě „Upravitelná verze“. Její body se spojí přímkami.',
  'help.ctx.trip-tour-paddle.bullet.4':
    '„Odhad času“ sečte čas na vodě, přenášení lodi, vystupování a nastupování, zdymadla a pauzy, a to podle rychlostí a minut, které můžete měnit.',
  'help.guide.tour-paddle-setup.step.4':
    'V části „Voda“ vyberte „Řeka“ nebo „Jezero“. Dokud nevyberete loď i typ vody, výlet nelze uložit.',
  'help.guide.tour-paddle-setup.result':
    'Nový vodácký výlet s lodí, typem vody a rychlostí, připravený na první bod na mapě.',
  'help.guide.tour-paddle-water-route.tip.1':
    'Kde chybí data o vodě, TREK je pro daný region buď automaticky stáhne, nebo o ně požádá správce, podle nastavení instance. Úsek pak ukazuje „Načítání dat o vodě“ a jakmile jsou data k dispozici, naplánuje se automaticky, obvykle do jedné až tří minut.',
  'help.guide.tour-paddle-portage.step.2':
    'Zvolte „Odtud loď přenášet“. Úsek k dalšímu bodu se změní na přenášku zakreslenou po souši.',
  'help.guide.tour-paddle-lock.title': 'Přidání zdymadla a doby čekání',
  'help.guide.tour-paddle-lock.tip.3': '„Odstranit zdymadlo“ je dole na otevřené kartě a v „Další akce“.',
  'help.guide.tour-paddle-time.step.5':
    'Dokud nemají všechna zdymadla své časy, ukazuje odhad „Neúplné“ a poznámka pod řádky vypíše, co chybí.',
  'help.guide.tour-paddle-wind.step.2':
    'Zkontrolujte směr větru, „Průměr“ a „Nárazy“. „Průměr“ je nejsilnější hodinový průměr dne, „Nárazy“ nejsilnější poryv.',
  'help.guide.tour-paddle-checklist.title': 'Kontrolní seznam překážek',
  'help.guide.tour-paddle-checklist.tip.2':
    '„Přenést“ přenášku automaticky nenaplánuje. Kliknutím na „Naplánovat přenášku“ ji nastavíte na mapě.',
  'help.guide.tour-paddle-track-marks.step.2':
    'V „Náhled importu“ nastavte „Importovat jako“ na „Vodácká túra“ a pak vyberte „Loď“ a „Voda“. Dokud nevyberete obojí, import nemůže pokračovat.',
  'help.guide.tour-paddle-track-marks.tip.3':
    'U zaznamenané stopy má řádek „Voda“ v „Odhad času“ vlastní rychlost: klikněte na ni a zadejte, jak rychle jste pádlovali.',
  'help.ctx.trip-tour-horse.bullet.5':
    'Vyjížďka importovaná ze souboru GPX zůstane přesně tak, jak byla zaznamenaná, a její karta „Zaznamenaná vyjížďka“ uvádí, co import nedokázal spočítat.',
  'help.guide.tour-horse-plan.step.6':
    'Klikněte na „Převzít úsek“. Úsek se přidá k vyjížďce jako odznak s názvem trasy na kartě „Trasové body“. Další úseky přidáte stejně.',
  'help.guide.tour-horse-gap.title': 'Překlenutí mezery mezi jezdeckými trasami',
  'help.guide.tour-horse-gap.tip.2':
    'Body, na které kliknete na mapě, se k vyjížďce přidají stejně, jako rovné neověřené úseky.',
  'help.guide.tour-horse-recorded.result':
    'Vyjížďka je v cestě přesně tak, jak jste ji jeli, se vzdáleností a výškami ze souboru.',
  'help.guide.dateless-trip.step.3': 'Klikněte na „Vytvořit novou cestu“.',
  'help.guide.trip-reminder.tip.2':
    'Nová cesta má od začátku připomínku 3 dny před odjezdem. Kanály pro ni vyberete v Nastavení, Oznámení.',
  'help.guide.upcoming-reservations.result':
    'Cesta se otevře. Když se vrátíte na přehled, widget dál ukazuje, co vás čeká.',
  'help.guide.entitlement.tip.2': 'V propojeném plánu má každý vlastní řádek a nárok můžete nastavit i ostatním.',
  'help.guide.half-company-holiday.step.3': 'Klikněte na den. Polovina buňky zoranžoví.',
  'help.guide.school-holidays.tip.2':
    'Když najedete myší na den v prázdninách, uvidíte jejich název v části „Školní prázdniny“.',
  'help.guide.answer-fusion-request.step.3':
    'Kliknutím na „Přijmout a propojit“ plány sloučíte, kliknutím na „Zamítnout“ si ponecháte samostatný plán.',
  'help.guide.log-for-partner.step.3':
    'Klikněte na dny, které chcete zapsat, a pak znovu klikněte na své jméno v části „Osoby“.',
  'help.guide.dissolve-fusion.result':
    'Každý má zase svůj vlastní plán se svými záznamy a v části „Osoby“ jste jen vy.',
  'help.guide.country-places.result': 'Plánovač se otevře na cestě, ke které místo patří.',
  'help.guide.tour-activity-stats.step.6':
    'U výletu, který se neuskutečnil, klikněte na „Vynechat“, kulaté tlačítko na konci jeho řádku. Výlet zůstane v seznamu, ztlumený a označený „Vynechána“. Stejným tlačítkem, teď s nápisem „Znovu započítat“, ho opět započítáte.',
  'help.guide.move-to-list.tip.1':
    'Štítky patří vždy k jednomu seznamu, takže přesunuté nebo duplikované místo v novém seznamu žádné štítky nemá.',
  'help.guide.accept-list-invite.step.1':
    'Pozvánku najdete v části „Pozvánky“ na liště seznamů. Pokud jste přišli z oznámení o pozvánce, je karta nahoře na stránce. Uvádí název seznamu a od koho pozvánka je.',
  'help.guide.tour-collection-add-to-trip.tip.1':
    'Nový výlet zatím není v žádném dni a nepřidává žádná místa. Seznam ani původní výlet se nemění.',
  'help.guide.tour-collection-manage.step.3':
    'Klikněte na koš na konci řádku výletu a potvrďte volbou „Odebrat ze sbírky“.',
  'help.ctx.journey-detail.bullet.7':
    'Když máte připojený Dawarich, ukazuje záhlaví dne také „Převzít záznam“ (nebo vzdálenost trasy uložené pro daný den) a „Převzít den“. Ve dni s čekajícími pobyty jsou pobyty seskupené v jednom řádku na konci dne.',
  'help.guide.entry-draft.tip.1':
    'Přispěvatelé koncept stále vidí. Skrytý je jen ve veřejném odkazu, dokud „Koncept“ nevypnete.',
  'help.guide.journey-map-layers.tip.2':
    'Ztlumený přepínač zatím nemá co zobrazit a popisek vysvětluje proč. Vaše volba se v tomto prohlížeči ukládá pro každý deník zvlášť.',
  'help.guide.journey-keep-route.tip.2':
    'Později můžete kliknutím na vzdálenost v záhlaví dne trasu znovu porovnat s Dawarich: „Nahradit“ převezme novou verzi, „Odebrat trasu“ odstraní trasu dne z deníku.',
  'help.guide.journey-day-stays.tip.2':
    'U nabitého dne vyřídí „Převzít den“ na konci řádku všechny jeho pobyty najednou.',
  'help.guide.journey-take-over-day.tip.1':
    'Dokud na toto tlačítko nekliknete, nic se neukládá, a nic se neuloží dvakrát: pobyt, který už v deníku je, je označený a znovu ho vybrat nelze.',
  'help.guide.journey-auto-prepare.tip.1':
    'Připravují se jen dny propojených cest s daty a do deníku se automaticky nic nepřidává.',
  'help.guide.photo-location.result':
    'Záznam bez místa dostane polohu, kde byla pořízena jeho první fotka s GPS, a zobrazí se na mapě.',
  'help.guide.contributors.tip.2':
    '„Přes cesty“ uvádí lidi, kteří mají přístup díky propojené cestě. Jejich přístup změníte v nastavení dané cesty, ne tady.',
  'help.ctx.settings-plugins.bullet.2':
    'Plugin může na svou kartu přidat „Akce“, které se spustí po potvrzení, a „Připojit“ nebo „Odpojit“, pokud se za vás přihlašuje k jiné službě.',
  'help.guide.web-push-device.tip.1':
    'Push funguje v každém prohlížeči zvlášť: zopakujte to na každém telefonu a počítači, kde chcete oznámení dostávat. „Vypnout pro toto zařízení“ ho vypne jen na daném zařízení.',
  'help.guide.connect-airtrail.step.2':
    '„Povolit certifikáty podepsané sebou samým“ je jen pro důvěryhodnou instanci ve vaší vlastní síti. „Zapisovat změny zpět do AirTrail“ je ve výchozím stavu vypnuté, takže TREK jen čte; pokud chcete své úpravy posílat zpět, zapněte ho.',
  'help.guide.connect-dawarich.step.2':
    '„Automaticky hledat nové pobyty“ nechá TREK kontrolovat sám. Když je vypnuté, čte TREK Dawarich jen na vaši žádost. „Povolit vlastnoručně podepsaný certifikát“ je jen pro instanci, které váš server nedůvěřuje.',
  'help.guide.tour-connect-wanderer.step.2':
    '„Povolit certifikát podepsaný sám sebou“ zapněte jen u instance ve vlastní síti.',
  'help.guide.tour-wanderer-watch.step.1':
    'Na kartě wanderer zapněte „Kontrolovat změny mých tras“. Nejdřív je potřeba mít uložené připojení.',
  'help.guide.plugin-settings.title': 'Nastavení pluginu pro vás',
  'help.guide.default-user-settings.tip.2':
    '„Zobrazovaná měna“ jen přepočítává částky pro zobrazení. Částky zadané v části „Náklady“ zůstávají beze změny.',
  'help.guide.own-routing-engine.step.2':
    'Pro trasy, které se vyhýbají mýtu, dálnicím nebo trajektům, zadejte do pole „Vlastní instance Valhalla“ adresu svého serveru Valhalla. Každé pole se uloží, jakmile ho opustíte; pak restartujte server TREK a znovu načtěte stránku.',
  'help.guide.admin-passkeys.tip.3':
    'Pokud uživatel přišel o zařízení s přístupovými klíči, odstraňte je tlačítkem „Resetovat přístupové klíče“ v okně „Upravit uživatele“.',
  'help.guide.rotate-jwt-secret.result':
    'Platí nový podpisový klíč a všichni uživatelé včetně vás se musí znovu přihlásit.',
  'help.guide.read-notifications.title': 'Čtení oznámení',
  'help.guide.filter-notifications.title': 'Všechna oznámení, nebo jen nepřečtená',
  'help.guide.mark-notifications-read.goal': 'Jakmile uvidíte, co je nového, zrušte zvýraznění a číslo u zvonku.',
  'help.guide.delete-notifications.step.1':
    'Kliknutím na „Smazat“, koš vedle času oznámení, odstraníte jen toto jedno.',
  'help.guide.notification-settings.step.2': 'V nabídce klikněte na „Nastavení“.',
  'help.guide.public-link.tip.3': 'Když na volbu najedete myší, dozvíte se, co skrývá.',
  'help.guide.link-journal.step.4':
    'Přečtěte si žlutou poznámku: uvádí, kdo deník dostane poprvé. Pak klikněte na „Propojit deník“.',
  'help.guide.dawarich-stays.step.1':
    'Pokud máte Dawarich připojený v Nastavení, Integrace, je nad seznamem míst „Z Dawarichu“. Jeho záhlaví ukazuje, kdy TREK naposledy kontroloval a kolik pobytů čeká. Kliknutím seznam otevřete.',
  'help.guide.leave-stop-off-route.step.2':
    'Vedle názvu se objeví odznak „Mimo trasu“. Zastávka zůstane ve dni i na mapě, ale trasa dne a časy úseků ji vynechají.',
  'help.guide.move-booking-day.result': 'Rezervace v plánu patří k novému dni a její čas se nezměnil.',
  'help.guide.clear-day.tip.2': 'Tato položka nabídky se zobrazí jen u dne, ve kterém jsou místa.',
  'help.guide.place-image-from-file.step.1':
    'Otevřete místo, které má mezi soubory fotku. Blok „Soubory“ u spodního okraje karty ukazuje, kolik souborů místo má.',
  'help.guide.place-own-hours.title': 'Oprava otevírací doby, telefonu nebo e-mailu místa',
  'help.guide.place-own-hours.tip.1':
    'Hodiny, které zadáte, nahradí ty, které TREK dohledal, takže kavárna se sezónní otevírací dobou ukazuje to, co víte vy.',
  'help.guide.day-panel.tip.3':
    'Plánujete podle kalendáře? Zapněte v Nastavení na kartě „Zobrazení“ volbu „Datum na začátku nadpisů dnů“ a záhlaví bude začínat datem, pod kterým bude „Den 1“ nebo název dne.',
  'help.guide.confirm-stay-booking.result':
    'Rezervace hotelu je potvrzená, a to na kartě pobytu i na kartě „Rezervace“.',
  'help.guide.tour-map-lines.goal':
    'Rozlište výlety cesty na mapě, otevřete výlet kliknutím na jeho linii a skryjte ty, které teď nepotřebujete.',
  'help.guide.tour-map-lines.tip.3':
    '„Vynechat z trasy“ v nabídce řádku výletu v denním plánu znamená, že trasa dne už nevede na začátek a konec výletu. „Vrátit do trasy“ je znovu propojí.',
  'help.guide.car-stops.step.5':
    'Pořadí zastávek určuje trasu. Měníte ho tlačítky „Posunout nahoru“ a „Posunout dolů“ vlevo u zastávky a křížkem vpravo, „Odebrat zastávku“, zastávku odstraníte.',
  'help.guide.transport-details.step.3':
    'Dlaždice níže ukazují odjezd a příjezd se stanicemi nebo letišti a pak nástupiště a sedadlo, pokud jsou zadané. Jízda s mezizastávkami je vypisuje v části „Trasa“ a jízda rezervovaná po úsecích uvádí kód každého úseku v části „Kódy úseků“. Následují „Cestující“, „Poznámky“, „Náklady“ a „Soubory“; „Zobrazit v souborech“ otevře jízdenku na kartě „Soubory“.',
  'help.guide.export-transports-csv.title': 'Export dopravy do tabulky',
  'help.guide.group-sort-bookings.step.4':
    'Kliknutím na nadpis sekce ji sbalíte. Číslo vedle ukazuje, kolik rezervací obsahuje, a dalším kliknutím ji znovu otevřete.',
  'help.guide.booking-on-map.goal': 'Přejděte z rezervace přímo na její místo v plánu a na mapě.',
  'help.guide.export-bookings-csv.tip.2':
    'Sloupce jsou oddělené středníky a Excel soubor otevře se zachovanou diakritikou.',
  'help.guide.arrange-packing-list.tip.2':
    'TREK si „A až Z“ pamatuje v tomto prohlížeči, takže se seznam příště otevře také seřazený. Mění to jen to, co vidíte vy, nikdy pořadí, které vidí ostatní.',
  'help.guide.count-packed-pieces.step.4':
    'Jakmile počítadlo dosáhne zadaného množství, položka se automaticky odškrtne a počítá se jako zabalená.',
  'help.guide.expense-receipts.result':
    'Účtenka je uložená s výdajem: otevřete ji štítkem na jeho řádku a soubor najdete i v souborech cesty.',
  'help.guide.files-sync-settings.step.4':
    'V části „Když se dokument smaže“ vyberte, co se stane s kopií na druhé straně. „Zachovat obě kopie“ nechá kopii v úložišti tam, kde je. „Přesunout do koše“ ji po smazání dokumentu v TREK přesune do koše úložiště.',
  'help.ctx.trip-collab.bullet.7':
    'Vše tady vyžaduje připojení. Offline se zpráva, poznámka, odkaz, hlasování ani hlas neuloží a TREK zobrazí This needs a connection. Try again once TREK is back online. Členové, kteří nesmějí upravovat „Spolupráce“, mohou vše číst, ale „Nová poznámka“, „Přidat odkaz“ a „Nové hlasování“ nevidí a pole pro zprávy mají zašedlé.',
  'help.guide.manage-notes.step.4':
    '„Upravit“ otevře dialog poznámky se vším vyplněným. Změňte, co potřebujete, tady jeden další řádek v části „Obsah“, a klikněte na „Uložit“.',
  'help.guide.note-categories.step.2':
    'Dole do pole „Nová kategorie...“ napište název a stiskněte Enter nebo klikněte na plus vedle. Nová kategorie dostane další barvu a vlastní řádek.',
  'help.guide.note-categories.tip.3':
    'Na kartě je kategorie vidět jen jako barevná tečka v záhlaví. Když na tečku najedete myší, uvidíte její název.',
  'help.guide.roadtrip-reorder.step.1':
    'Přetáhněte zastávku za její řádek a pusťte ji na jinou zastávku téhož dne. Zaujme její místo a trasa dne se naplánuje znovu v novém pořadí.',
  'help.guide.roadtrip-overnight.step.5':
    'Klikněte na „Přidat“. Nocleh se zarezervuje od tohoto dne do následujícího a místo se přidá do jízdy jako noc daného dne.',
  'help.guide.roadtrip-stop-fill.step.3':
    'Pokud chcete u zastávky znovu použít svoje nastavení, otevřete odznak znovu a klikněte na „Použít moji výchozí hodnotu“.',
  'help.guide.roadtrip-bookings.step.3':
    'Pilulka „Check-in“ nebo „Nástup“ ukazuje, do kdy vás jízda musí dovézt k terminálu: odjezd se nastaví o tolik dřív, než uvádí jízdní řád.',
  'help.guide.roadtrip-google-import.title': 'Import trasy z Google Maps',
  'help.guide.roadtrip-google-import.tip.2':
    'Odkaz musí obsahovat aspoň dvě zastávky, které TREK dokáže umístit, a nejvýše 30.',
  'help.guide.roadtrip-hazards.tip.1':
    'Varování nejsou uzavírky silnic: trasa se kvůli nim nikdy nemění a jde o aktuální hlášení, ne o předpověď pro váš termín.',
  'help.ctx.trip-tours.bullet.4':
    'Když na řádek najedete myší, objeví se oko („Skrýt na mapě“) a kulaté + („Přidat ke dni“). Přetažením řádku na den v levém sloupci výlet do dne naplánujete, kliknutím otevřete kartu výletu přes mapu.',
  'help.guide.tour-show-list.step.4':
    'Karta ukazuje údaje výletu a v části „Dny cesty“ dny, ve kterých je. Pokud chcete změnit samotnou trasu, otevřete kartu „Výlety“ a klikněte na výlet v části „Výlety této cesty“.',
  'help.guide.tour-add-to-day.step.1':
    'Najeďte myší na výlet v seznamu a klikněte na kulaté + vpravo na jeho řádku („Přidat ke dni“).',
  'help.guide.tour-add-to-day.tip.4':
    'Když je otevřený nějaký den (kliknutím na jeho záhlaví), nabízí karta výletu „Přidat ke dni“ i pro tento den. Šipkou zpět nad dny přiřazení vrátíte.',
  'help.guide.tour-day-times.tip.1': 'Čas konce, který zadáte, nahradí vypočítaný.',
  'help.guide.tour-remove-from-day.step.2':
    'Výlet zůstane v seznamu vpravo. Odznak dne zmizí a filtr ho znovu počítá mezi „Nezařazené“.',
  'help.guide.tour-filter-list.step.2':
    'V části „Stav“ vyberte „Nezařazené“ pro výlety, které zatím nejsou v žádném dni, nebo „Plánováno“ pro ty, které už ve dni jsou. U každého řádku vidíte, kolik výletů odpovídá.',
  'help.guide.tour-hide-on-map.goal': 'Skryjte z mapy výlety, které teď nepotřebujete, aniž byste je komukoli měnili.',
  'help.guide.tour-import-plan-tab.goal': 'Importujte během plánování dnů stopu GPX nebo KML jako výlet.',
  'help.ctx.trip-tour-detail.summary':
    'Karta, která se otevře přes mapu, když na kartě „Plán“ vyberete výlet: jeho dny, údaje a profil, odkud pochází a tlačítka, kterými ho pošlete do telefonu, zkopírujete, uložíte do sbírky nebo propojíte se seznamem věcí.',
  'help.guide.tour-detail-read.step.1':
    'Nahoře v pravém sloupci přepněte z „Míst“ na „Výlety“ a klikněte na výlet. Přes mapu se otevře jeho karta. Stejnou kartu otevře i jeho řádek ve dni nebo jeho linie na mapě.',
  'help.guide.tour-detail-read.tip.2':
    'Vodácký výlet neukazuje výšky ani profil: jeho body leží na březích, takže by výšky nebyly správné.',
  'help.guide.tour-rename-colour.step.2':
    'Napište nový název a klikněte na kulaté tlačítko se zatržítkem, nebo stiskněte Enter. Klávesou Escape ponecháte původní název.',
  'help.guide.tour-take-along.step.1':
    'Otevřete kartu výletu. „Navigace“ dole na kartě otevře začátek výletu v mapové aplikaci, a pokud jich máte víc, nejdřív je vypíše. Navede vás na začátek, ne po trase.',
  'help.guide.tour-copy-keep.title': 'Kopie výletu nebo jeho uložení do sbírky',
  'help.guide.tour-copy-keep.tip.3':
    'Na kartě „Výlety“ udělá totéž pro otevřený výlet záložka nahoře v levém sloupci. Pokud má výlet neuložené změny, nejdřív vás vyzve k jeho uložení.',
  'help.guide.tour-packing-link.step.4':
    'Karta teď ukazuje seznam, kolik jeho položek je zabalených, ukazatel průběhu a první položky. Zabalené jsou přeškrtnuté.',
  'help.guide.tour-files.step.1':
    'Otevřete kartu výletu a posuňte se na konec k části „Soubory“. V záhlaví sekce klikněte na „Nahrát“ a vyberte jeden nebo více souborů.',
  'help.guide.tour-activity-link.step.1':
    'Otevřete kartu naplánovaného výletu a posuňte se k části „Skutečná trasa“. Klikněte na „Přidat skutečnou trasu“.',
  'help.guide.tour-activity-link.result': 'Stopa je propojená s výletem a karta ukazuje plán a skutečnost vedle sebe.',
  'help.guide.tour-activity-compare.tip.2':
    'Absolvované výlety v Atlasu počítají místo plánovaných hodnot s propojenou stopou.',
  'help.guide.tour-origin-check.tip.2':
    'Výlet z wanderer má vedle zdroje šipku, „Otevřít ve wanderer“, a v záhlaví sekce „Zkontrolovat zdroj“. Kontrola se zeptá wanderer, jestli se trasa od importu změnila. „Importovat jako nový snímek“ pak importuje novou verzi jako samostatný výlet. Tento výlet si ponechá své dny a poznámky.',
  'help.ctx.trip-tour-planner.bullet.4':
    'Když je zapnuté „Přidat bod“ („Přidávat body“ v pilulce mapy), kliknutím na mapu přidáte bod. Přetažením špendlíku ho přesunete, kliknutím na nakreslenou trasu tam přidáte tvarový bod a přes „Místa cesty“ vyberete místo z cesty.',
  'help.guide.tour-open-workspace.step.4':
    'Plus nahoře v pravém panelu, „Přidat túru“, nabízí „Importovat GPX nebo KML“, „Importovat procházku z Google Maps“ a „Převzít túru z jiné cesty“. Když je otevřený výlet, najdete tu i „Naplánovat nový výlet“.',
  'help.guide.tour-draw-route.title': 'Nakreslení nového výletu',
  'help.guide.tour-draw-route.tip.1':
    'Když je zapnuté „Přidávat body“, má ukazatel tvar zaměřovacího kříže. Vypněte ho, pokud chcete mapou posouvat bez přidávání bodů. Ve 3D je od začátku vypnuté, protože tam se tažením mapy rozhlížíte.',
  'help.guide.tour-type-profile.step.2':
    'Vyberte typ ze seznamu: „Pěší túra“, „Procházka městem / po památkách“, „Běh“, „Cyklovýlet“, „Vodácká túra“, „Vyjížďka na koni“ nebo „Lyže a zima“. U každého je uvedeno, co plánuje, a po změně typu se trasa naplánuje znovu.',
  'help.guide.tour-edit-points.step.1':
    'Přetáhněte očíslovaný špendlík na mapě tam, kde má bod být. Trasa se znovu naplánuje přes nové místo.',
  'help.guide.tour-edit-points.result': 'Body jsou tam a v takovém pořadí, jak chcete, a trasa je znovu naplánovaná.',
  'help.guide.tour-shaping-points.tip.2': 'Tvarovým bodem nemůže končit etapa vícedenního výletu.',
  'help.guide.tour-loop-reverse.tip.1':
    'Jakmile je výlet okruhem, ukazuje „Zpět na start“ hlášení „Túra se už vrací na start“.',
  'help.guide.tour-leg-by-hand.step.3':
    'Pokud ho má znovu naplánovat router, otevřete stejnou nabídku a zvolte „Další úsek znovu vypočítat“.',
  'help.guide.tour-trip-places.step.2':
    'Hledejte v místech cesty („Hledat v místech cesty“), nebo se podívejte do části „Blízko túry“: místa do dvou kilometrů od trasy, od nejbližšího, každé se vzdáleností.',
  'help.guide.tour-details-times.goal': 'Dejte výletu název, popis a odkaz a přidejte k jeho času pauzy.',
  'help.guide.tour-details-times.result': 'Výlet má teď svůj název, poznámky a čas, který na něj plánujete.',
  'help.guide.tour-save.tip.2':
    '„Zpět na výlety“ nahoře v panelu zavře editor, a pokud máte neuložené změny, nejdřív se zeptá.',
  'help.guide.tour-edit-saved.step.4':
    'Kliknutím na „Zpět na výlety“ editor zavřete. Pokud máte neuložené změny, nejdřív se zobrazí dotaz „Zahodit neuložené změny výletu?“.',
  'help.guide.tour-summary-profile.step.2': 'Informační tečka vedle odhadovaného času vysvětluje, jak se počítá.',
  'help.guide.tour-list-manage.goal':
    'Podívejte se na součty výletů cesty, zařaďte výlet do dne a zužte seznam na to, co potřebujete.',
  'help.guide.tour-list-manage.tip.3':
    'Košem na řádku výlet smažete. Karta „Plán“ ukazuje stejné výlety, když přepnete její pravý sloupec na „Výlety“.',
  'help.guide.tour-delete.tip.3':
    'Výlet se maže tady, na kartě „Výlety“. Koš vidí jen cestující, kteří smějí upravovat místa cesty.',
  'help.guide.tour-saved-elsewhere.tip.1':
    '„Uložit jako novou túru“ pojmenuje vaši kopii podle výletu a přidá za název (my version).',
  'help.ctx.trip-tour-import.bullet.4':
    '„Upravitelná verze“ udělá z importu výlet s trasovými body, které můžete posouvat. „Nahradit import“ zaznamenanou stopu zachová a karta „Zaznamenaná stopa“ v editoru vás k ní vrátí.',
  'help.guide.tour-import-gpx.step.5':
    'Klikněte na „Importovat 1 výlet“ (nebo „Importovat 3 výlety“ u souboru se třemi stopami).',
  'help.guide.tour-view-import.goal':
    'Prohlédněte si průběh, údaje a výškový profil importovaného výletu přesně tak, jak byl importován.',
  'help.guide.tour-plan-from-import.title': 'Upravitelný výlet z importu',
  'help.guide.tour-plan-from-import.tip.3':
    'U vodáckého nebo lyžařského importu se body místo plánování trasy spojí přímkami.',
  'help.guide.tour-restore-recorded.tip.1':
    'Karta se zobrazuje jen u výletu, který byl nahrazen volbou „Nahradit import“ a pak uložen.',
  'help.guide.tour-take-over.step.4': 'Klikněte na výlet. Vpravo uvidíte jeho linii, údaje a cestu, ze které pochází.',
  'help.guide.tour-import-wanderer.goal': 'Importujte do cesty jako výlet jednu z tras ve svém vlastním wanderer.',
  'help.guide.tour-import-wanderer.tip.4': '„Otevřít ve wanderer“ otevře trasu na vaší instanci.',
  'help.ctx.trip-tour-map.bullet.5':
    'Ve 3D se trasa zobrazí na terénu, zbarvená podle sklonu, s legendou, která shrnuje její sklony, a s přeletem, který ji sleduje od začátku do konce.',
  'help.guide.tour-map-layers.tip.2':
    '„Turistika“ a „Kolo“ pocházejí z dobrovolnických serverů a jsou k dispozici, jen pokud je správce povolí. Když některý přestane odpovídat, ukáže jeho segment ! a můžete přepnout na jinou mapu; váš výlet zůstane beze změny.',
  'help.guide.tour-along-search.step.5':
    'Nalezená místa se vypíšou se vzdáleností od trasy a zobrazí se na mapě ve své barvě. Hvězdička označuje nejznámější a „V túře“ ta, která už jsou zastávkou. Tlačítko teď ukazuje „Hledat znovu“.',
  'help.guide.tour-along-add-stop.step.2':
    '„Kam patří“ navrhne úsek, kam místo nejlépe zapadá. Kliknutím můžete místo toho vybrat, mezi které dvě zastávky přijde, nebo zvolit „Jako nový cíl“. Mapa ukáže novou trasu čárkovaně dřív, než se cokoli změní.',
  'help.guide.tour-3d-terrain.goal': 'Prohlédněte si výlet ve skutečné krajině, zbarvený podle sklonu.',
  'help.guide.tour-3d-terrain.tip.2':
    'Vybraná mapa se používá i ve 3D, stejně jako ferraty, sjezdovky a plavební značky. Při úpravě výletu můžete jeho body přetahovat po terénu a se zapnutým „Přidávat body“ přidáte bod kliknutím.',
  'help.guide.tour-3d-flyover.result':
    'Prohlédli jste si výlet z výšky, od začátku do konce, rychlostí, kterou jste zvolili.',
  'help.guide.tour-map-overlays.step.3':
    'Legenda vysvětluje barvy: sjezdovky od „Začátečník“ po Freeride, „Běžkařské tratě“, „Zimní a sněžnicové trasy“, „Sáňkařské dráhy“ a „Vleky a lanovky“. „Celá legenda na OpenSnowMap“ ukáže všechny symboly. Klávesou Escape legendu zavřete.',
  'help.ctx.trip-tour-stages.bullet.1':
    '„Dny“ v editoru přepínají otevřený výlet na „Jednodenní“ nebo „Vícedenní“. Když přepnete zpět na jednodenní, odstraní se po potvrzení všechny konce etap a trasa zůstane beze změny.',
  'help.guide.tour-multi-day.step.2':
    'V části „Dny“ klikněte na „Vícedenní“. Poznámka ukáže, kam se umístil první konec etapy.',
  'help.guide.tour-multi-day.tip.4':
    'Etapy se uloží po kliknutí na „Uložit“. Pokud změna odstraní etapu, která je zařazená v některém dni cesty, upozorní vás oznámení, že ji uložení z tohoto dne odebere.',
  'help.guide.tour-stages-on-days.step.5':
    'U každé etapy vidíte, ve kterém je dni. Kliknutím na den ji přesunete na jiný den, volbou „Bez dne“ ji ze dne odeberete.',
  'help.ctx.trip-tour-hike.summary':
    'Túra nebo běh otevřený na kartě „Výlety“: vlevo editor, uprostřed mapa, vpravo přehled výletu a ostatní výlety cesty. Túra se drží obtížnosti stezek, kterou povolíte, běh se počítá podle vašeho tempa a u obou vidíte, co OpenStreetMap o trase eviduje.',
  'help.guide.tour-hike-plan.goal':
    'Založte túru, nastavte zastávky, zvolte nejtěžší stupeň stezky, po které smí trasa vést, a túru uložte.',
  'help.guide.tour-hike-plan.tip.1':
    'Nová túra začíná na T2 („Horská turistika“). U T3 se přidá varování, že takové stezky mohou být exponované a vyžadují jistý krok a odolnost vůči výškám.',
  'help.guide.tour-hike-trail-details.step.3':
    'Odznaky vše shrnují: jaká část trasy je „Známé“, „Nejvyšší známý“ stupeň a zvlášť „Limit trasy“, se kterým byla túra naplánovaná.',
  'help.guide.tour-hike-round.goal':
    'Nechte TREK navrhnout okruhy požadované délky se začátkem v jedné ze zastávek túry.',
  'help.guide.tour-hike-round.tip.2':
    'Lze zadat vzdálenost od 1 do 60 km a nabídnou se okruhy, které se od ní liší nejvýše o 20 %.',
  'help.guide.tour-hike-compare-ways.result':
    'Tento jeden úsek vede po cestě, kterou jste vybrali, a zbytek túry zůstává beze změny. „Cesta převzata“ dole na mapě nabízí „Vrátit zpět“.',
  'help.guide.tour-ferrata-add.step.3':
    'Klikněte na „Přidat do túry“. Ferata se přidá na konec trasy jako samostatný úsek s bodem na každém konci.',
  'help.guide.tour-run-plan.title': 'Plánování běhu vlastním tempem',
  'help.guide.tour-run-plan.tip.1': 'Bez tempa nelze běh uložit.',
  'help.guide.tour-run-ways.step.3':
    'Klikněte na „Povrch“ a pak na povrch v seznamu, aby se na mapě zobrazily jen tyto úseky.',
  'help.ctx.trip-tour-walk.bullet.3':
    'Jakmile je procházka zařazená do dne s časem začátku, uvádí „Časy pro“ nahoře v části „Trasové body“ tento den a u každé zastávky vidíte čas příchodu, délku pobytu a co říká otevírací doba.',
  'help.guide.tour-walk-plan.step.4':
    'Zadejte zastávce „Popisek“ a „Pobyt v minutách“. Dokud délku pobytu neznáte, nechte pole prázdné, a u bodu, kterým jen projdete, zadejte 0.',
  'help.guide.tour-walk-sights.goal': 'Vyberte téma, hledejte podél procházky a přidejte místo jako zastávku.',
  'help.guide.tour-walk-sights.tip.3':
    'Otevírací doba a weby pocházejí ze zdroje, většinou z OpenStreetMap. Před cestou si je ověřte.',
  'help.guide.tour-walk-day-times.tip.1':
    'Bez času začátku vás na to řádek upozorní: Give the walk a time on this day to see arrivals and opening hours.',
  'help.guide.tour-walk-google-import.step.2':
    'Vložte odkaz do pole „Odkaz na pěší trasu“ a klikněte na „Přečíst odkaz“.',
  'help.guide.tour-walk-check-off.goal':
    'Označujte v daný den zastávky jako navštívené nebo přeskočené a sledujte, kolik chůze zbývá.',
  'help.guide.tour-walk-check-off.result':
    'Navštívené zastávky jsou zaškrtnuté, přeskočené přeškrtnuté a zbývající čas počítá jen s tím, co máte ještě před sebou.',
  'help.guide.tour-bike-profile.goal':
    'Založte cyklovýlet a nechte TREK naplánovat trasu pro trekové kolo, silniční kolo, gravel nebo MTB.',
  'help.guide.tour-bike-profile.tip.1': 'Pokud profil později změníte, naplánuje se celá trasa znovu pro nový profil.',
  'help.guide.tour-bike-surfaces.step.2':
    'Odznak v záhlaví karty ukazuje podíl trasy, o kterém je známo, že vede po nezpevněném povrchu.',
  'help.guide.tour-bike-mtb-grades.title': 'Kontrola obtížnosti stezek u výletu na horském kole',
  'help.guide.tour-bike-mtb-grades.tip.3':
    'Pokud se obtížnost nepodařilo načíst, karta na to upozorní. Klikněte na „Zkusit znovu“.',
  'help.ctx.trip-tour-ski.bullet.5':
    'Když je otevřený výlet typu „Lyže a zima“, mapa ukazuje sjezdovky z OpenSnowMap a vedle jejich přepínače je „Legenda sjezdovek“. Vše jsou mapová data: nic tu neříká, jestli je sjezdovka nebo vlek v provozu, jaký je sníh, ani nic o lavinách.',
  'help.guide.tour-ski-plan.step.6': 'Do pole „Název výletu“ zadejte název a klikněte na „Uložit“.',
  'help.guide.tour-ski-options.step.1':
    'U výletu typu „Lyže a zima“ najdete volby routeru pod „Disciplína“. Vidíte jen ty, které vaše disciplína používá: „Běh na lyžích“ například nemá „Nejtěžší sjezdovky“.',
  'help.guide.tour-ski-options.result':
    'Výlet se znovu naplánuje v rámci vašich limitů a karta „Trasa po sjezdovkách“ vypíše těžší sjezdovky, kterým se vyhnul.',
  'help.guide.tour-ski-fix-leg.tip.3':
    'Offline se úseky zatím kreslí jako přímky. Šedý řádek o letních stezkách je poznámka, ne chyba.',
  'help.guide.tour-ski-summary.tip.1':
    '„Vynecháno“ vypisuje těžší sjezdovky, kterým se router vyhnul kvůli vašemu limitu „Nejtěžší sjezdovky“.',
  'help.guide.tour-ski-pistes-layer.step.2':
    'Klikněte na „Legenda sjezdovek“, tlačítko se čtyřmi barevnými tečkami vedle přepínače.',
  'help.guide.tour-ski-import.step.1':
    'Na kartě „Výlety“ klikněte na „Přidat túru“ (plus nad „Výlety této cesty“), zvolte „Importovat GPX nebo KML“ a vyberte soubor.',
  'help.guide.tour-ski-import.tip.3':
    'Stejný náhled otevřete i tak, že soubory GPX, KML nebo KMZ přetáhnete kamkoli na kartu „Výlety“.',
  'help.ctx.trip-tour-paddle.bullet.5':
    '„Vítr“ ukazuje předpověď na začátku výletu pro den, na který je naplánovaný. „Kontrolní seznam“ vypisuje překážky na uložené trase a co jste u každé rozhodli.',
  'help.guide.tour-paddle-setup.step.5':
    'Na jezeře určuje trasu „Přes jezera“: „Přímo“ je nejkratší, „Podél břehu“ se drží blízko břehu pro větrné dny.',
  'help.guide.tour-paddle-water-route.title': 'Plánování úseků po vodě',
  'help.guide.tour-paddle-water-route.tip.2':
    'Kde trasa obchází jez s lodí na zádech nebo vede přes zdymadlo, nastaví tam TREK vlastní bod označený „Nalezeno“. Když ho přesunete nebo změníte, stane se vaším vlastním bodem.',
  'help.guide.tour-paddle-portage.step.3':
    'Pod bodem se objeví karta „Přenáška“ s délkou a minutami navíc. Kliknutím ji otevřete.',
  'help.guide.tour-paddle-lock.goal': 'Přidejte do výletu zdymadlo a započítejte do času čekání i proplutí.',
  'help.guide.tour-paddle-lock.result': 'Zdymadlo je ve výletu i se svými minutami a „Odhad času“ je přičítá.',
  'help.guide.tour-paddle-time.tip.1':
    'TREK začíná se 4 km/h na vodě, 2 km/h při přenášení a 10 minutami u každé přenášky. Jsou to výchozí hodnoty k úpravě, ne naměřené údaje.',
  'help.guide.tour-paddle-wind.step.3':
    'Sloupce ukazují hodiny dne, nárazy za průměrným větrem. Když na sloupec najedete myší, uvidíte údaje a směr pro danou hodinu.',
  'help.guide.tour-paddle-checklist.goal':
    'Zjistěte, co je známo o jezech, zdymadlech a pravidlech vstupu na uložené trase, a rozhodněte, co u každého uděláte.',
  'help.guide.tour-paddle-checklist.tip.3':
    'Položka označená „Zkontrolovat znovu“ byla rozhodnutá dřív, než se změnila trasa nebo data. Rozhodněte ji znovu, nebo zvolte „Ponechat rozhodnutí“ či „Odstranit rozhodnutí“. Rozhodnutí, která už neplatí, jsou v části „Dřívější rozhodnutí“.',
  'help.guide.tour-paddle-track-marks.step.3': 'Klikněte na „Importovat 1 výlet“.',
  'help.guide.tour-paddle-track-marks.result':
    'Zaznamenaná stopa obsahuje své přenášky a zdymadla a „Odhad času“ s nimi počítá.',
  'help.guide.tour-horse-plan.title': 'Plánování vyjížďky po jezdeckých trasách',
  'help.guide.tour-horse-plan.step.7':
    'Do pole „Název výletu“ zadejte název vyjížďky a pak klikněte na „Uložit“ dole v levém sloupci.',
  'help.guide.tour-horse-gap.goal': 'Pokračujte úsekem, který nezačíná na konci vaší vyjížďky.',
  'help.guide.tour-horse-gap.tip.3':
    'Úsek, který začíná do 25 m od konce vaší vyjížďky, na ni přímo naváže a „Napojení na vyjížďku“ ukáže „Navazuje na konec tvé vyjížďky“.',
  'help.guide.tour-horse-recorded.tip.1':
    'Linie zůstane přesně tak, jak ji soubor zaznamenal. Nic se znovu neplánuje a zaznamenaná vyjížďka nemá upravitelnou verzi.',
  'help.guide.dateless-trip.result':
    'Karta ukazuje „Nápad“ a „Bez termínu“ a cesta má tolik prázdných dní, kolik jste zadali.',
  'help.guide.trip-reminder.title': 'Připomínka před cestou',
  'help.guide.upcoming-reservations.tip.1':
    'Pobyt v hotelu se zobrazí dvakrát, jednou pro příjezd a jednou pro odjezd.',
  'help.guide.half-company-holiday.result':
    'Firma má půl dne volno a den dovolené zapsaný na tento den se počítá jen jako půl dne.',
  'help.guide.edit-holiday-calendar.title': 'Změna nebo odebrání kalendáře svátků',
  'help.guide.answer-fusion-request.result':
    'Po kliknutí na „Přijmout a propojit“ se oba plány zobrazí v jedné mřížce, každá osoba ve své barvě.',
  'help.guide.log-for-partner.result':
    'Dny se zobrazí v barvě druhé osoby a odečítají se z jejího nároku, ne z vašeho.',
  'help.guide.dissolve-fusion.tip.1':
    '„Zrušit“ v tomto okně ponechá plán beze změny; vaše záznamy zůstanou zachované v každém případě.',
  'help.guide.country-places.tip.1':
    'Místo zařazené pod špatnou zemí má obvykle chybnou adresu nebo souřadnice. Otevřete odsud jeho cestu a místo opravte tam.',
  'help.guide.tour-activity-stats.title': 'Přehled toho, co jste na výletech zvládli',
  'help.guide.tour-activity-stats.result':
    'Součty v dialogu a na kartě „Výlety“ už vynechaný výlet nezahrnují. Jeho trasa, dny i cesta zůstávají beze změny.',
  'help.guide.move-to-list.tip.2':
    'Přesunem se místa ze seznamu odebírají, proto „Přesunout do seznamu“ vidí jen vlastník seznamu nebo správce. „Duplikovat do seznamu“ funguje z každého seznamu, který můžete otevřít.',
  'help.guide.accept-list-invite.step.2':
    'Kliknutím na „Přijmout“ se připojíte, kliknutím na „Zamítnout“ pozvánku odmítnete.',
  'help.guide.tour-collection-add-to-trip.tip.2':
    'Pokud byl výlet uložený bez linie, je potřeba přidat i jeho trasové body. Dialog vás na to upozorní a tuto možnost vybere za vás.',
  'help.guide.tour-collection-manage.tip.1':
    'Odebrání výletu ze seznamu nemění výlety, které už jste z něj vytvořili ve svých cestách.',
  'help.guide.entry-draft.tip.2':
    'Když převezmete den z Dawarich, jsou jeho záznamy koncepty. Před sdílením zkontrolujte odznak.',
  'help.guide.journey-map-layers.result':
    'Mapa ukazuje jen vrstvy, které chcete, a každý špendlík, tečku a linii vysvětluje legenda.',
  'help.guide.journey-keep-route.result':
    'Záhlaví dne ukazuje vzdálenost a trasa je pro všechny v deníku zobrazená plnou čarou ve vrstvě „Zaznamenáno“. Ve sdíleném odkazu se zobrazí, jen když jsou zapnuté „Zaznamenané trasy“.',
  'help.guide.journey-day-stays.result':
    'Pobyty, o kterých jste rozhodli, z řádku zmizí. Záznamy, které jste napsali, se zobrazí ve svém dni jako kterékoli jiné a můžete do nich jako obvykle přidávat fotky a text.',
  'help.guide.journey-take-over-day.tip.2':
    'Koncepty se ve sdílených odkazech nezobrazují. Přidejte fotky a text a pak v každém záznamu vypněte „Koncept“.',
  'help.guide.journey-auto-prepare.tip.2':
    'Tečka na tlačítku seznamu dne znamená, že den ještě není hotový; popisek vysvětluje proč.',
  'help.ctx.settings-plugins.bullet.3':
    '„Aktivita pluginů“ dole vypisuje každou akci, kterou plugin provedl vaším jménem, od nejnovější, s tlačítkem „Obnovit“.',
  'help.guide.language-region.tip.3':
    '„Týden začíná“ určuje první sloupec všech výběrů data; Dovolená (Vacay) má vlastní nastavení.',
  'help.guide.web-push-device.tip.2': 'Na iPhonu a iPadu nejdřív přidejte TREK na plochu a otevírejte ho odtamtud.',
  'help.guide.connect-airtrail.step.3':
    'Klikněte na „Uložit“ a pak na „Otestovat připojení“. Ukáže, kolik letů našel, a odznak se změní na „Připojeno“.',
  'help.guide.connect-dawarich.step.3':
    'Klikněte na „Uložit“ a pak na „Otestovat připojení“: spočítá pobyty za posledních 30 dní. Po připojení zkontroluje „Zkontrolovat teď“ okamžitě a „Odpojit“ vpravo připojení ukončí.',
  'help.guide.tour-connect-wanderer.step.3':
    'Klikněte na „Uložit“ a pak na „Otestovat připojení“. Ukáže, kolik vašich tras můžete importovat, a odznak se změní na „Připojeno“.',
  'help.guide.tour-wanderer-watch.step.2':
    'Nejvýše jednou denně si TREK přečte krátký záznam každé importované trasy a řádek ukazuje, kdy kontroloval naposledy. Pokud se trasa mohla změnit, dostanete oznámení a „Upozornění“ ji započítá: kliknutím na „Upozornění“ uvidíte každý výlet jako „Možná změněno“, „Změněno“ nebo „Nelze ověřit“ a můžete ho odtud otevřít.',
  'help.guide.plugin-settings.goal':
    'Zadejte pluginu své vlastní klíče a předvolby a podívejte se, co udělal vaším jménem.',
  'help.guide.own-routing-engine.result': 'Trasy ve všech cestách se počítají na vašich serverech.',
  'help.guide.admin-passkeys.title': 'Nabídka přihlášení přístupovým klíčem',
  'help.guide.rotate-jwt-secret.tip.1': 'Odhlásí to i vás, takže se hned potom znovu přihlaste.',
  'help.guide.notification-defaults.title': 'Výchozí nastavení oznámení pro uživatele',
  'help.ctx.notifications.title': 'Oznámení',
  'help.guide.read-notifications.goal':
    'Podívejte se, co se ve vašich cestách stalo, zatímco jste byli pryč, a rovnou to otevřete.',
  'help.guide.filter-notifications.goal': 'Projděte všechna oznámení, nebo jen ta, která jste ještě nečetli.',
  'help.guide.mark-notifications-read.step.1':
    'Kliknutím na „Označit jako přečtené“, dvojité zatržítko vedle času oznámení, označíte jen toto jedno.',
  'help.guide.delete-notifications.step.2':
    '„Smazat vše“ nahoře smaže celý seznam najednou, jakmile to v dialogu potvrdíte.',
  'help.guide.notification-settings.step.3':
    'V postranním panelu Nastavení klikněte na „Oznámení“. První karta má řádek pro každou událost a sloupec „V aplikaci“ určuje, co ukazuje zvonek.',
  'help.guide.link-journal.result':
    'Na liště karet cesty se objeví karta „Deník“. Každý, komu jste dali „Číst“ nebo „Upravit“, v ní může deník otevřít a vidí změny živě.',
  'help.guide.create-place.tip.4':
    'Ve vyhledávání funguje i odkaz zkopírovaný z Google Maps: vložte ho, stiskněte Enter a TREK z něj místo načte. Jakmile má formulář polohu, ukáže „Místa poblíž tohoto špendlíku“, zaměřovací kříž vedle hledání, co je v okolí.',
  'help.guide.dawarich-stays.step.2':
    'Pobyty jsou seskupené podle dnů, u každého je čas příjezdu a odjezdu; ikona měřidla označuje pobyt, u kterého si Dawarich nebyl jistý. Klikněte na „Přidat jako místo“, špendlík vedle pobytu.',
  'help.guide.leave-stop-off-route.step.3':
    'Pokud ji chcete znovu zařadit do trasy, otevřete stejnou nabídku a zvolte „Vrátit do trasy“.',
  'help.guide.move-booking-day.tip.1':
    'Vybledlé řádky ve dnech uprostřed vícedenní rezervace přetahovat nelze, stejně jako jednotlivý úsek letu s přestupy.',
  'help.guide.place-image-from-file.step.2':
    'Klikněte na kulatý obrázek v záhlaví. Protože místo má fotky, malé okno se zeptá, odkud má obrázek být.',
  'help.guide.place-own-hours.goal':
    'Pokud jsou dohledané hodiny špatně nebo chybí, zadejte na kartu ty, které jste si sami ověřili.',
  'help.guide.place-own-hours.tip.2':
    'Telefonní číslo a e-mail se zobrazí jako pilulky v záhlaví karty. Kliknutím je otevřete v telefonu nebo poštovní aplikaci.',
  'help.guide.edit-accommodation.tip.3':
    'Pokud máte v Nastavení na kartě „Zobrazení“ zapnuté „Skrýt rezervační kódy“, zůstane číslo potvrzení rozmazané. Přečtete si ho, když na něj najedete myší nebo kliknete.',
  'help.guide.confirm-stay-booking.tip.1':
    'Dalším kliknutím na pilulku vrátíte rezervaci do stavu „Čeká na potvrzení“.',
  'help.guide.map-markers.tip.4':
    'Se zapnutou volbou „Kompaktní značky pro nenaplánovaná místa“ (Nastavení > Zobrazení, část Cestování a mapa) jsou místa, která zatím nejsou v žádném dni, malé tečky bez fotky a hodnocení. Místo, které vyberete, se vždy zobrazí celé.',
  'help.guide.tour-map-lines.step.1':
    'Každý výlet cesty je na mapě zobrazený jako linie ve své barvě se špendlíkem tam, kde začíná. Pokud jste výletu vybrali barvu, linie ji použije. Jinak má barvu své kategorie.',
  'help.guide.car-stops.step.6': 'Klikněte na „Přidat“.',
  'help.guide.transport-details.step.4':
    'Kliknutím na název jízdu přejmenujete, aniž byste otevírali formulář. „Přejmenovat“ se otevře s vyplněným názvem: napište nový a klikněte na „Uložit“.',
  'help.guide.export-transports-csv.goal':
    'Vyexportujte jízdy cesty z TREK jako soubor CSV pro tabulku, cestovní kancelář nebo tisk.',
  'help.guide.group-sort-bookings.result':
    'Rezervace jsou v sekcích a v pořadí, které jste zvolili, a tento prohlížeč si volbu zapamatuje pro příští návštěvu.',
  'help.guide.booking-on-map.step.1':
    'Klikněte na kartu rezervace, která má místo propojené v části „Místo / Aktivita“, nebo u pobytu v části „Ubytování“. Otevřou se její podrobnosti.',
  'help.guide.export-bookings-csv.title': 'Export rezervací do tabulky',
  'help.guide.export-bookings-csv.tip.3':
    'Tlačítko se objeví, jakmile je na kartě nějaká rezervace. Karta „Doprava“ exportuje své záznamy stejným způsobem.',
  'help.guide.arrange-packing-list.title': 'Seřazení seznamu věcí podle vás',
  'help.guide.count-packed-pieces.result':
    'Řádek ukazuje, kolik kusů je zabalených, a jakmile zabalíte poslední, položka se odškrtne.',
  'help.guide.expense-receipts.title': 'Přiložení účtenky k výdaji',
  'help.guide.expense-receipts.tip.1':
    'V editoru otevře stejný náhled i kliknutí na název souboru v seznamu. Klávesa Esc pak zavře jen náhled, ne výdaj.',
  'help.guide.files-sync-settings.step.5':
    '„Když se změnily obě strany“ určuje, která kopie se zachová, pokud byl dokument upravený na obou místech: „Zeptat se“, „Ponechat kopii z TREKu“ nebo „Ponechat kopii z úložiště“. „Synchronizovat automaticky“ nechá TREK hledat změny na pozadí; když je vypnuté, karta ukazuje „Pozastaveno“ a synchronizaci spustí jen „Synchronizovat teď“. Každá změna se tu ukládá okamžitě.',
  'help.guide.manage-notes.step.5':
    '„Smazat“ se nejdřív zeptá „Smazat poznámku?“, protože poznámka se smaže všem členům, a to i se soubory. Potvrďte kliknutím na „Smazat“.',
  'help.guide.note-categories.step.3':
    'Kategorii přejmenujete kliknutím na její název. Napište nový název a stiskněte Enter; klávesou Esc ponecháte původní.',
  'help.guide.roadtrip-reorder.step.2':
    'Pokud chcete zastávku přesunout na jiný den, pusťte ji na zastávku v kartě tohoto dne. Během tažení se den s méně než dvěma zastávkami zobrazí jako čárkovaná karta na konci lišty a můžete zastávku pustit i na ni.',
  'help.guide.roadtrip-corridor.tip.4':
    'Pod filtrem vyberte jednu zastávku dne, nebo „Na půl cesty“ mezi dvěma, a ponecháte jen to, co leží do 25, 50 nebo 100 km od tohoto bodu. Pokud jsou v seznamu nabíjecí stanice, zúžíte je podle zásuvky a výkonu volbami „Libovolná zásuvka“ a „Libovolný výkon“.',
  'help.guide.roadtrip-overnight.result':
    'Místo se v jízdě zobrazí jako nocleh daného dne a pobyt je v cestě zarezervovaný jako kterýkoli jiný.',
  'help.guide.roadtrip-stop-fill.result':
    'Na této zastávce se natankuje nebo nabije na zvolenou úroveň. Dojezd za ní, včetně případného pruhu „Tady dojde palivo“, se počítá od této hodnoty.',
  'help.guide.roadtrip-bookings.step.4': 'Kliknutím na kartu otevřete rezervaci.',
  'help.guide.roadtrip-google-import.goal':
    'Převeďte trasu naplánovanou v Google Maps na zastávky v jednom ze svých dnů.',
  'help.guide.roadtrip-google-import.tip.3': 'Import vyžaduje připojení a oprávnění upravovat místa i dny.',
  'help.guide.roadtrip-hazards.tip.2':
    'DWD pokrývá Německo a GDACS hlásí katastrofy po celém světě. Pokud je varování zadané jen jako bod, není jeho zasažená oblast známá.',
  'help.ctx.trip-tours.bullet.5':
    'Ve sloupci dnů je výlet řádkem jako zastávka. Pokud má „Začátek“, ukazuje začátek → konec, přičemž konec se počítá z času výletu, a „Další možnosti“ obsahují „Upravit“, „Odebrat ze dne“, „Vynechat z trasy“ a „Uložit do sbírky“.',
  'help.guide.tour-show-list.step.5': 'Seznam míst vrátíte kliknutím na „Místa“ ve stejném přepínači.',
  'help.guide.tour-add-to-day.step.2':
    'Vyberte den. Nabídka vypisuje všechny dny cesty s datem a názvem; den, ve kterém už výlet je, je zašedlý.',
  'help.guide.tour-add-to-day.result': 'Výlet je uvedený pod svým dnem a jeho linie patří na mapě k tomuto dni.',
  'help.guide.tour-day-times.tip.2':
    'Den s jednou etapou vícedenního výletu vypočítaný čas konce nedostane, protože čas výletu platí pro celou trasu.',
  'help.guide.tour-remove-from-day.step.3':
    'Nebo kliknutím na záhlaví dne den otevřete, v seznamu klikněte na výlet a dole na jeho kartě klikněte na „Odebrat ze dne“.',
  'help.guide.tour-filter-list.step.3':
    'Pokud seznam obsahuje různé druhy, můžete ho dál zúžit podle „Zdroj“ (TREK, „Import GPX“, wanderer), „Limit trasy“ (T1 až T6) a „Typ“ („Pěší túra“, „Cyklovýlet“ a další). Dalším kliknutím na zaškrtnutou hodnotu ji zrušíte.',
  'help.guide.tour-hide-on-map.step.1':
    'Najeďte myší na výlet v seznamu a klikněte na oko, které se objeví vpravo na jeho řádku („Skrýt na mapě“).',
  'help.guide.tour-import-plan-tab.step.1': 'Na kartě „Plán“ klikněte v přepínači nahoře v pravém sloupci na „Výlety“.',
  'help.ctx.trip-tour-detail.bullet.1':
    'Klikněte na výlet v seznamu výletů (nejdřív přepněte pravý sloupec z „Míst“ na „Výlety“), na jeho řádek ve dni nebo na jeho linii na mapě a jeho karta se otevře přes mapu. S mapou můžete pracovat, i když je karta otevřená.',
  'help.guide.tour-detail-read.step.2':
    'Záhlaví ukazuje název výletu a v pilulkách jeho shrnutí: o jaký druh výletu jde, odkud pochází, pokud byl importován, plánovanou dobu, vzdálenost, stoupání a klesání.',
  'help.guide.tour-detail-read.tip.3':
    'Některé výlety ukazují víc: procházka městem své zastávky, vodácký výlet kontroly a vítr, absolvovaný výlet svou „Skutečná trasa“ a výlet propojený se seznamem svůj „Seznam věcí“.',
  'help.guide.tour-rename-colour.step.3':
    'Klikněte na barevnou tečku v rohu kulaté dlaždice výletu, „Barva stopy“. Pod záhlavím se otevře sekce „Barva stopy“.',
  'help.guide.tour-take-along.step.2':
    'Pokud má výlet webovou stránku, ukazuje tlačítko vedle název webu (Komoot, AllTrails, Outdooractive nebo Wanderer), u ostatních „Webové stránky“. Stránku otevře v nové kartě.',
  'help.guide.tour-copy-keep.goal':
    'Vytvořte variantu výletu v této cestě, nebo si ho uložte do některé ze svých sbírek pro další cesty.',
  'help.guide.tour-copy-keep.tip.4':
    '„Sbírka“ je k dispozici, jen když je zapnutý doplněk Sbírky. Seznam, který smíte jen číst, vybrat nelze, a pokud zatím žádný seznam nemáte, nabídne dialog „Otevřít sbírky“.',
  'help.guide.tour-packing-link.step.5':
    'Kliknutím na „Otevřít seznam věcí“ můžete začít odškrtávat. TREK přepne na kartu „Seznamy“ přímo na seznam věcí.',
  'help.guide.tour-files.step.2': 'Řádek pod ním teď ukazuje jejich počet a seznam se rozbalí.',
  'help.guide.tour-activity-link.step.2':
    'V části „Uskutečněno“ zkontrolujte den, kdy jste výlet absolvovali. Pokud nepatří k žádnému dni, vyberte „Bez dne“.',
  'help.guide.tour-activity-compare.title': 'Porovnání plánu se skutečností',
  'help.guide.tour-activity-compare.result': 'Den můžete rychle porovnat s plánem, na kartě i na mapě.',
  'help.guide.tour-origin-check.tip.3':
    '„Žádné připojení k wanderer“ znamená, že váš účet ještě není připojený. Připojte ho v Nastavení v části „Integrace“.',
  'help.ctx.trip-tour-planner.bullet.5':
    '„Hledat místo nebo adresu“ nahoře na mapě mapu přesune. Pilulka vlevo dole přepíná mezi mapami, které typ výletu nabízí, například Topo nebo „Satelit“, a obsahuje přepínače otevřeného výletu, například „Přidávat body“ a 3D.',
  'help.guide.tour-open-workspace.step.5':
    '„Hledat místo nebo adresu“ nahoře na mapě přesune mapu na dané místo, takže můžete začít tam, kde výlet je.',
  'help.guide.tour-draw-route.goal': 'Zadejte body nového výletu na mapě a nechte TREK vypočítat trasu mezi nimi.',
  'help.guide.tour-draw-route.tip.2':
    'Topo nebo „Turistika“ v pilulce mapy zobrazí cesty, takže se na ně snáz trefíte. Bod, který je příliš daleko od cesty použitelné pro daný typ, dostane místo trasy upozornění.',
  'help.guide.tour-type-profile.step.3':
    'U cyklovýletu vyberete pod typem „Profil“: „Treking“, „Silnice“, Gravel nebo MTB. Řádek pod ním popisuje, co profil upřednostňuje.',
  'help.guide.tour-edit-points.step.2':
    'Kliknutím na řádek v části „Trasové body“ vyberete jeho bod. Jeho špendlík se na mapě zvýrazní.',
  'help.guide.tour-shaping-points.title': 'Úprava trasy tvarovým bodem',
  'help.guide.tour-shaping-points.tip.3':
    'U vyjížďky na koni kliknutí na linii nic nepřidá, protože ji žádný router netvaruje.',
  'help.guide.tour-loop-reverse.tip.2':
    'Pokud odeberete řádek „Zpět na start“, bude výlet zase jednosměrný. Ručně nakreslený úsek zůstane i po obrácení výletu nakreslený ručně.',
  'help.guide.tour-leg-by-hand.step.4':
    '„Znovu vypočítat další úsek“ se router zeptá znovu jen na tento jeden úsek, ostatní nezmění.',
  'help.guide.tour-trip-places.step.3':
    'Klikněte na místo. Přidá se jako nový konec výletu a seznam zůstane otevřený pro další.',
  'help.guide.tour-details-times.step.1':
    '„Název výletu“ nahoře v levém panelu obsahuje název. U nového výletu je tam šedý text, například „Túra bez názvu“, jen jako zástupný text: napište vlastní.',
  'help.guide.tour-save.title': 'Uložení výletu',
  'help.guide.tour-save.tip.3':
    '„Uložit“ nefunguje ani tehdy, když má některé pole neplatnou hodnotu, například web, který není adresou. „Podrobnosti“ se samy otevřou a ukážou ho.',
  'help.guide.tour-edit-saved.tip.1': 'U výletu, který jste nezměnili, zůstává „Uložit“ zašedlé.',
  'help.guide.tour-summary-profile.step.3':
    'Pohybujte ukazatelem po „Výškový profil“. Ukazuje vzdálenost a výšku v daném bodě a tečka označí stejné místo na mapě.',
  'help.guide.tour-list-manage.step.1':
    '„Rozsah cesty“ je nad seznamem. Ve sbaleném stavu ukazuje počet výletů a kolik z nich je „Plánováno“ a „Nezařazené“. Šipka vpravo otevře řádek pro každý typ se sečtenou vzdáleností, stoupáním, klesáním a časy.',
  'help.guide.tour-list-manage.result':
    'Vidíte součty výletů, které filtr zobrazuje, a každý výlet je v dni, kde ho chcete mít.',
  'help.guide.tour-delete.result': 'Výlet zmizel ze seznamu, z mapy i ze všech dnů.',
  'help.guide.tour-saved-elsewhere.tip.2':
    'Totéž se stane, když jste výlet změnili na jiném zařízení. Výlet, který jste nezměnili, se jednoduše znovu načte a upozorní na to poznámka.',
  'help.ctx.trip-tour-import.bullet.5':
    'Jakmile je wanderer připojený v Nastavení, Integrace, objeví se vedle „Naplánovat nový výlet“ tlačítko wanderer, pokud není otevřený žádný výlet. Vypíše vaše vlastní trasy k importu.',
  'help.guide.tour-import-gpx.tip.1':
    'Soubory můžete také přetáhnout z počítače na kartu „Výlety“ a pustit je tam. Otevře se stejný náhled.',
  'help.guide.tour-view-import.step.1':
    'Na kartě „Výlety“ klikněte v „Výlety této cesty“ na výlet s odznakem „Import GPX“.',
  'help.guide.tour-plan-from-import.goal':
    'Získejte ze zaznamenané stopy trasové body, které můžete posouvat, a podívejte se, jak blízko stopy se nová trasa drží.',
  'help.guide.tour-plan-from-import.tip.4':
    '„Vyjížďka na koni“ nemá upravitelnou verzi: zůstává tak, jak jste ji jeli.',
  'help.guide.tour-restore-recorded.tip.2':
    'Výlet vytvořený přes „Naplánovat jako nový výlet“ nemá vlastní zaznamenanou stopu. Import, ze kterého vznikl, je v seznamu dál.',
  'help.guide.tour-take-over.step.5': 'Pokud chcete, dejte mu jiný název v poli „Název v této cestě“.',
  'help.guide.tour-import-wanderer.step.1':
    'Na kartě „Výlety“, když není otevřený žádný výlet, klikněte na wanderer vedle „Naplánovat nový výlet“.',
  'help.guide.tour-import-wanderer.result':
    'Trasa je teď výletem cesty a otevře se na mapě jako „Výlet z aplikace wanderer“.',
  'help.guide.tour-map-layers.title': 'Výběr mapy pro výlet',
  'help.guide.tour-map-layers.tip.3':
    'Vodácký výlet a procházka městem nabízejí jen „Mapa“ a „Satelit“; běh, lyžařský výlet a vyjížďka na koni nabízejí „Mapa“, Topo a „Satelit“.',
  'help.guide.tour-along-search.result': 'Místa podél trasy jsou v seznamu i na mapě a můžete si je prohlédnout.',
  'help.guide.tour-along-add-stop.step.3':
    'Klikněte na „Přidat jako zastávku“. Odznak vedle je hrubý odhad zajížďky, měřený vzdušnou čarou.',
  'help.guide.tour-3d-terrain.step.1':
    'Otevřete výlet na kartě „Výlety“ a klikněte na 3D na konci pilulky vlevo dole. Mapa se nakloní a zobrazí terén ve 3D i s trasou.',
  'help.guide.tour-3d-terrain.tip.3':
    'Krajina potřebuje připojení: výšky pocházejí z otevřených terénních dlaždic Mapzen. Vodácký výlet se zobrazí ve vlastní barvě bez sklonů, protože voda je rovná.',
  'help.guide.tour-3d-flyover.tip.1':
    'Během přeletu můžete kolečkem myši přibližovat a oddalovat; kamera zůstává na tečce. Mapu nelze táhnout, dokud přelet nepozastavíte.',
  'help.guide.tour-map-overlays.step.4':
    'U vodáckého výletu nabízí pilulka místo toho „Plavební znaky“. Kliknutím zobrazíte na vodě bóje, majáky a přístavní značky.',
  'help.ctx.trip-tour-stages.bullet.2':
    '„Ukončit etapu zde“ v nabídce „Další akce“ u zastávky ukončí etapu u této zastávky. „Trasové body“ pak ukazují pro každou etapu nadpis „Etapa N“ se vzdáleností a časem a zastávka, kterou etapa končí, má ikonu měsíce.',
  'help.guide.tour-multi-day.step.3':
    'Najeďte na zastávku, kde končí první den, klikněte na „Další akce“ a zvolte „Ukončit etapu zde“.',
  'help.guide.tour-multi-day.result':
    'Jedna trasa s etapami, z nichž každá má vlastní údaje. Uložíte je kliknutím na „Uložit“.',
  'help.guide.tour-stages-on-days.step.6':
    'Šipka vedle, „Otevřít tuto etapu v plánovači“, otevře výlet v editoru na této etapě.',
  'help.ctx.trip-tour-hike.bullet.1':
    '„Typ túry“ nahoře v editoru určuje, jak se trasa plánuje. „Pěší túra“ používá stezky až do „Maximální obtížnost stezky“ v části „Podrobnosti“; „Běh“ používá cesty vhodné pro běh a ptá se na vaše „Plánované tempo“.',
  'help.guide.tour-hike-plan.step.1':
    'Nahoře v levém sloupci klikněte na „Naplánovat nový výlet“. Editor se otevře jako „Nový výlet“.',
  'help.guide.tour-hike-plan.tip.2':
    'U T4 a výš se nejdřív zobrazí dotaz „Povolit vysokohorské trasy?“. Potvrďte ho jen tehdy, pokud trasa smí vést exponovaným nebo neznačeným terénem; dotaz se zobrazí jednou za každé úpravy.',
  'help.guide.tour-hike-trail-details.step.4':
    'Kliknutím na stupeň v seznamu zobrazíte na mapě jen tyto úseky. Dalším kliknutím zobrazíte celou trasu.',
  'help.guide.tour-hike-round.step.1':
    'S otevřenou túrou klikněte v záhlaví karty „Trasové body“ na „Okruh od startu“. U jiné zastávky otevřete její „Další akce“ a zvolte „Okruh odsud“.',
  'help.guide.tour-hike-round.tip.3':
    '„Hledat znovu“ vás vrátí k zadání vzdálenosti a „Zrušit“ kartu zavře, aniž by cokoli změnilo.',
  'help.guide.tour-hike-compare-ways.tip.1':
    'Tuto možnost nabízejí jen túry, a to jen u úseku, který naplánoval router, ne u ručně nakresleného.',
  'help.guide.tour-ferrata-add.step.4':
    'V části „Trasové body“ ukazuje úsek mezi těmito dvěma body název, obtížnost a délku ferraty.',
  'help.guide.tour-run-plan.goal':
    'Naplánujte běh po cestách vhodných pro běh a nechte si podle tempa vypočítat jeho čas.',
  'help.guide.tour-run-plan.tip.2':
    'Stoupání, klesání ani technická náročnost cesty se do času nepočítají: je to jen vzdálenost krát tempo.',
  'help.guide.tour-run-ways.result': 'Ještě před vyběhnutím víte, které části běhu nevedou po asfaltu.',
  'help.ctx.trip-tour-walk.bullet.4':
    '„Podél túry“ hledá pamětihodnosti podle „Téma procházky“ do určité vzdálenosti od trasy a „Přidat jako zastávku“ jednu z nich zařadí do procházky tam, kam určíte.',
  'help.guide.tour-walk-plan.step.5':
    'Nastavte „Důležitost“ na „Běžná“, „Volitelné“ nebo „Musíš vidět“. U zastávky, která má při pozdějších navržených změnách zůstat na místě, zapněte „Chráněná“ a pak klikněte na „Uložit“.',
  'help.guide.tour-walk-sights.step.1':
    'S otevřenou procházkou městem najděte v levém sloupci „Podél túry“ a vyberte „Téma procházky“: „Kultura a historie“, „Parky a výhledy“, „Jídlo a místní život“ nebo „Od všeho trochu“.',
  'help.guide.tour-walk-sights.result':
    'Pamětihodnost je zastávkou procházky a je zařazená do trasy mezi zastávky, které jste vybrali.',
  'help.guide.tour-walk-day-times.tip.2':
    'Pokud zastávka ještě nemá délku pobytu, zobrazují se časy příchodu za ní jako nejdřívější možné.',
  'help.guide.tour-walk-google-import.step.3':
    'Zkontrolujte „Zastávky v odkazu“. Zastávka, která v odkazu nemá polohu, je označená a vynechá se.',
  'help.guide.tour-walk-check-off.step.1':
    'Na kartě „Plán“ klikněte na procházku městem v jejím dni. Vedle mapy se otevře její karta.',
  'help.ctx.trip-tour-bike.title': 'Cyklovýlety',
  'help.guide.tour-bike-profile.step.1': 'Na kartě „Výlety“ klikněte nahoře v levém panelu na „Naplánovat nový výlet“.',
  'help.guide.tour-bike-profile.tip.2':
    'Profil jen usměrňuje router. Neříká nic o tom, zda je cesta sjízdná: po čem trasa vede, ukazuje karta „Povrch a cesty“.',
  'help.guide.tour-bike-surfaces.step.3':
    'V části „Povrch“ klikněte na řádek, například Gravel nebo „Přírodní povrch“. Jeho úseky se na mapě zvýrazní. Dalším kliknutím na řádek zvýraznění zrušíte.',
  'help.guide.tour-bike-mtb-grades.goal':
    'Zjistěte, jak náročné jsou stezky na výletu na horském kole, ještě než po nich pojedete.',
  'help.guide.tour-bike-mtb-grades.tip.4':
    'Když přepnete „Profil“ z MTB na jiný, sekce s obtížností zmizí. Trasa se pak znovu naplánuje pro nový profil.',
  'help.guide.tour-ski-plan.title': 'Plánování lyžařského a zimního výletu',
  'help.guide.tour-ski-plan.tip.1':
    'U „Běh na lyžích“ zvolte také „Technika“: „Klasika“, „Bruslení“ nebo „Neznámá“. Upozornění pod poli ukazuje, co ještě chybí.',
  'help.guide.tour-ski-options.step.2':
    'Otevřete „Nejtěžší sjezdovky“ a vyberte nejvyšší obtížnost, kterou chcete lyžovat, od „Začátečník“ po „Expertní“. Výchozí je „Střední“.',
  'help.guide.tour-ski-fix-leg.title': 'Oprava lyžařského úseku, který nešlo naplánovat',
  'help.guide.tour-ski-fix-leg.tip.4':
    'Dokud nejsou naplánované všechny úseky, uvádí karta „Trasa po sjezdovkách“, že čas na lyžích zatím není k dispozici.',
  'help.guide.tour-ski-summary.tip.2':
    '„Čas na lyžích“ zůstává „Nepočítá se“, dokud nejsou naplánované všechny úseky. Pokud chcete výletu přesto přidělit čas, zadejte v jeho podrobnostech plánovaný celkový čas.',
  'help.guide.tour-ski-pistes-layer.step.3':
    'Legenda ukazuje sjezdovky podle obtížnosti, běžkařské tratě, zimní a sněžnicové trasy, sáňkařské dráhy a vleky. „Celá legenda na OpenSnowMap“ otevře kompletní legendu.',
  'help.guide.tour-ski-import.step.2': 'V „Náhled importu“ otevřete „Importovat jako“ a vyberte „Lyže a zima“.',
  'help.guide.tour-ski-import.result':
    'Stopa je v „Výlety této cesty“ a disciplínu s technikou najdete na její kartě „Lyžařská trasa“.',
  'help.ctx.trip-tour-paddle.bullet.6':
    'Řádek „Pádlování má rizika“ dole v levém sloupci otevře „Bezpečnost na vodě“. Mapa nabízí „Mapa“ a „Satelit“ a jako překryvnou vrstvu „Plavební znaky“.',
  'help.guide.tour-paddle-setup.step.6':
    '„Rychlost pádlování“ ukazuje šedě rychlost navrženou podle lodi. Když zadáte vlastní, ukáže pole „Vlastní rychlost“; odkazem pod ním, „Použít navrženou“, se vrátíte k rychlosti lodi.',
  'help.guide.tour-paddle-water-route.goal':
    'Nechte TREK naplánovat úsek po řece nebo jezeře a porozumějte poznámkám u úseku, který naplánovat nešel.',
  'help.guide.tour-paddle-water-route.tip.3':
    'Poznámky pod naplánovaným úsekem upozorňují na divokou vodu s její obtížností, na „Vodácká propust“ nebo na „Mezera v mapových datech“ překlenutou přímkou.',
  'help.guide.tour-paddle-portage.step.4':
    'V části „Trasa“ vede „Sledovat cestu“ po zmapované cestě a „Přímá čára“ přímo napříč. TREK cestu hledá sám a upozorní vás, pokud žádná bez dlouhé zajížďky neexistuje.',
  'help.guide.tour-paddle-lock.step.1': 'Najeďte na zastávku u zdymadla a klikněte na „Další akce“, tři tečky.',
  'help.guide.tour-paddle-time.title': 'Čas vodáckého výletu a jeho úprava',
  'help.guide.tour-paddle-time.tip.2': 'Proud ani vítr se do odhadu nepočítají.',
  'help.guide.tour-paddle-wind.step.4':
    'Otevřete „Co znamená vítr pro pádlování“ a zjistíte, jak na loď působí protivítr, boční vítr, přejezdy přes otevřenou vodu a nárazy.',
  'help.guide.tour-paddle-checklist.step.1':
    'Uložte vodácký výlet a pak v levém sloupci najděte „Kontrolní seznam“. Odznak v jeho záhlaví shrnuje stav seznamu.',
  'help.guide.tour-paddle-checklist.tip.4':
    'Překážky pocházejí z dat OpenStreetMap pro regiony, které TREK má. Kde data chybí, karta na to upozorní a jezy, zdymadla a přenášky zkontrolujete sami.',
  'help.guide.tour-paddle-track-marks.step.4':
    'Klikněte na stopu v „Výlety této cesty“. Levý sloupec ji ukazuje tak, jak byla zaznamenaná, s kartou „Přenášky a zdymadla“.',
  'help.ctx.trip-tour-horse.title': 'Vyjížďky na koni',
  'help.guide.tour-horse-plan.goal': 'Sestavte vyjížďku z úseků značených jezdeckých tras v zobrazení mapy.',
  'help.guide.tour-horse-plan.result':
    'Vyjížďka vede po převzatých úsecích, každý s názvem trasy, tečkou přístupu a délkou, a je uvedená v „Výlety této cesty“.',
  'help.guide.tour-horse-gap.step.1':
    'Když už má vyjížďka úsek, otevřete jinou trasu a vyberte úsek, který nenavazuje na konec vaší vyjížďky. V části „Napojení na vyjížďku“ upozornění ukáže, jak daleko od sebe jsou.',
  'help.guide.tour-horse-recorded.title': 'Zaznamenaná vyjížďka ze souboru GPX',
  'help.guide.tour-horse-recorded.tip.2':
    'U souboru bez výšek se místo nulového stoupání zobrazí „V souboru nejsou výšky“.',
  'help.guide.dateless-trip.tip.1':
    'Jakmile víte, kdy pojedete, otevřete formulář tužkou na kartě a vyberte data. Naplánované dny si zachovají pořadí a data dostanou ve stejném pořadí.',
  'help.guide.trip-reminder.goal': 'Nechte si připomenout cestu pár dní před odjezdem.',
  'help.guide.upcoming-reservations.tip.2':
    '„Čeká na potvrzení“ označuje rezervaci, která ještě není potvrzená. Zrušené rezervace a archivované cesty se nezobrazují.',
  'help.guide.half-company-holiday.tip.1':
    'Dovolená už zapsaná na tento den se zkrátí na půl dne. Kdo tento den zapíše později, čerpá jen 0,5 dne.',
  'help.guide.edit-holiday-calendar.goal':
    'Přejmenujte, přebarvěte, přesuňte nebo smažte kalendář státních svátků či školních prázdnin, který jste přidali.',
  'help.guide.person-color.title': 'Změna barvy osoby',
  'help.guide.answer-fusion-request.tip.1':
    'Žádost zůstává otevřená, dokud na ni neodpovíte. Pokud je jich víc, zobrazí se postupně jedna po druhé.',
  'help.guide.log-for-partner.tip.1': '„Půlden“ a „Náhradní volno“ fungují i pro vybranou osobu.',
  'help.guide.dissolve-fusion.tip.2': 'Pokud chcete někomu jen ukázat své dny, sdílejte místo toho svůj kalendář.',
  'help.guide.country-details.tip.2':
    'Kliknutím na odznak s počtem míst uvidíte všechna místa započtená pro danou zemi, seskupená podle cest.',
  'help.guide.country-places.tip.2':
    'Odznak se zobrazí, jen když má země vlastní místa. Země, kterou jste označili jen ručně, žádná nemá.',
  'help.guide.tour-activity-stats.goal':
    'Zjistěte vzdálenost, převýšení a počet výletů, které jste absolvovali napříč všemi cestami, za určité období a typ, a vynechte výlet, který se neuskutečnil.',
  'help.guide.tour-activity-stats.tip.1':
    'Výlet se započítá, jakmile skončí jeho poslední den. Výlet, který není v žádném dni nebo je jen ve dnech bez data, se nezapočítá nikdy. Pokud ho chcete započítat, zařaďte ho ve své cestě do dne s datem.',
  'help.guide.move-to-list.result':
    'Místa jsou v druhém seznamu a krátká poznámka uvede, kolik jich bylo přesunuto nebo duplikováno.',
  'help.guide.accept-list-invite.tip.1':
    'Co v seznamu můžete dělat, závisí na roli, kterou vám vlastník přidělil: „Divák“, „Editor“ nebo „Správce“.',
  'help.guide.tour-collection-add-to-trip.title': 'Přidání výletu ze seznamu do cesty',
  'help.guide.tour-collection-add-to-trip.tip.3':
    'Pokud chcete výlet uložit do seznamu, otevřete uložený výlet v cestě a klikněte v jeho patičce na „Sbírka“.',
  'help.guide.tour-collection-manage.tip.2': 'Koš vidí jen vlastník a správci seznamu.',
  'help.guide.entry-draft.result':
    'Záznam zůstane na vaší časové ose s označením „Koncept“ a ve sdíleném odkazu se nezobrazí.',
  'help.guide.journey-map-layers.title': 'Co ukazuje mapa deníku',
  'help.guide.journey-keep-route.title': 'Uložení trasy zaznamenané v daný den',
  'help.guide.journey-day-stays.title': 'Záznamy z pobytů zaznamenaných v Dawarich',
  'help.guide.journey-take-over-day.title': 'Převzetí celého zaznamenaného dne',
  'help.guide.journey-take-over-day.result':
    'Den teď má jeden koncept na každý pobyt nebo spojenou skupinu, nebo jednu denní zprávu, a jeho pobyty už nejsou vedené jako nevyřízené.',
  'help.guide.journey-auto-prepare.result':
    'Během propojené cesty se pobyty každého dne zobrazují u daného dne, připravené pro „Převzít den“.',
  'help.ctx.settings-about.title': 'O aplikaci',
  'help.guide.web-push-device.tip.3':
    'Push vyžaduje, aby byl TREK otevřený přes HTTPS. Pokud jsou oznámení zablokovaná, povolte je v nastavení prohlížeče a zkuste to znovu.',
  'help.guide.connect-airtrail.result':
    'Odznak ukazuje „Připojeno“ a karta „Doprava“ v cestě nabízí „Import z AirTrail“.',
  'help.guide.connect-dawarich.result':
    'Odznak ukazuje „Připojeno“ a plánovač cest, deník i Atlas mohou nabízet, co Dawarich zaznamenal.',
  'help.guide.tour-connect-wanderer.result':
    'Odznak ukazuje „Připojeno“ a karta „Výlety“ v cestě může prohledávat váš wanderer a importovat z něj trasy.',
  'help.guide.tour-wanderer-watch.result':
    'TREK kontroluje vaše importované trasy a upozorní vás, když se některá mohla změnit. Výlet se změní, jen když změnu přijmete.',
  'help.guide.plugin-settings.step.1':
    'V postranním panelu nastavení otevřete „Pluginy“. Pod „Nastavení doplňků“ má každý plugin, který od vás potřebuje nastavení, kartu se svými poli: vyplňte je a klikněte na „Uložit“. Akce na kartě se spustí po potvrzení.',
  'help.guide.profile.step.3': 'Vpravo v patičce karty klikněte na „Uložit profil“.',
  'help.guide.default-user-settings.title': 'Výchozí nastavení pro nové uživatele',
  'help.guide.own-routing-engine.tip.1':
    'Veřejné servery OSRM zvládnou zhruba jeden požadavek za sekundu. Na jeden den to stačí, na výlet autem to ale může být příliš pomalé.',
  'help.guide.admin-passkeys.goal': 'Umožněte lidem přihlašovat se otiskem prstu, obličejem nebo PIN kódem zařízení.',
  'help.guide.rotate-jwt-secret.tip.2':
    'Pokud chcete odhlásit jen jednu osobu, nastavte jí v okně „Upravit uživatele“ „Nové heslo“. Tím se ukončí jen její relace.',
  'help.guide.notification-defaults.goal':
    'Určete výchozí nastavení oznámení pro všechny uživatele a případně kanál pro určitou událost úplně zablokujte.',
  'help.ctx.notifications.summary':
    'Všechna oznámení, která vám TREK zobrazil v aplikaci, od nejnovějšího: rezervace, kterou někdo změnil, nová zpráva v chatu cesty, kalendář, který s vámi někdo sdílí. Zvonek vpravo nahoře ukazuje posledních deset, tato stránka všechna.',
  'help.guide.read-notifications.step.1':
    'Klikněte na zvonek vpravo nahoře. Červené číslo na něm ukazuje počet nepřečtených oznámení.',
  'help.guide.filter-notifications.step.1': 'Klikněte na zvonek vpravo nahoře.',
  'help.guide.mark-notifications-read.step.2':
    'Kliknutím na „Označit vše jako přečtené“ nahoře označíte všechna oznámení najednou.',
  'help.guide.delete-notifications.tip.1':
    'Smazáním odstraníte oznámení jen pro sebe. Rezervace, zpráva nebo sdílení, kterých se týkalo, zůstávají beze změny.',
  'help.guide.notification-settings.tip.1': 'Zámek v buňce znamená, že správce tuto událost vypnul všem.',
  'help.guide.add-guest.tip.3':
    'Hosty může přidávat, přejmenovávat a odebírat jen vlastník cesty. Hosta, který zaplatil nějaký výdaj, nelze odebrat, dokud nezměníte plátce nebo platbu nesmažete.',
  'help.guide.link-journal.tip.1':
    'Propojit můžete jen deníky, které vlastníte. Deník, do kterého jen píšete, propojit nelze.',
  'help.ctx.trip-places.bullet.7':
    'Zatržítko vedle vyhledávání spustí výběr. Lištou dole ve sloupci můžete několika řádkům najednou přiřadit novou kategorii, přidat je do sbírky, označit je jako navštívené nebo je smazat.',
  'help.guide.filter-places.step.5':
    'Jakmile cesta zasahuje do více zemí nebo regionů, zúží zeměkoule seznam na jednu zemi nebo na jeden region v ní, každý s počtem. „Vymazat filtr“ vrátí výběr na „Všechny země“.',
  'help.guide.import-places-file.tip.3':
    'Když jsou zapnuté Výlety, což je výchozí stav, importujete soubor přes „Výlety“ nahoře ve sloupci volbou „Importovat GPX nebo KML“ a jeho linie se stanou výlety. Špendlíky ze souboru se tam neimportují, protože výlety obsahují jen linie.',
  'help.guide.dawarich-stays.step.3':
    'Zkontrolujte „Název“, „Příchod“ a „Odchod“, vyberte „Den“ nebo ponechte „Zatím bez dne“, případně doplňte „Poznámky“ a klikněte na „Přidat místo“.',
  'help.guide.leave-stop-off-route.result':
    'Zastávka je dál součástí dne i PDF; dokud je označená „Mimo trasu“, vede trasa přímo od předchozí zastávky k následující.',
  'help.guide.move-booking-day.tip.2': 'V rámci svého dne se rezervace s časem vždy vrátí na pozici podle svého času.',
  'help.guide.place-image-from-file.step.3':
    'V části „Z přiložených souborů“ klikněte na fotku, kterou chcete. „Nahrát ze zařízení“ nad ní místo toho vybere novou fotku z počítače.',
  'help.guide.place-own-hours.step.1':
    'Otevřete místo a vpravo dole na kartě klikněte na „Upravit“. Otevře se formulář místa.',
  'help.guide.place-own-hours.tip.3':
    'Kliknutím na „Odebrat otevírací dobu“ a pak na „Aktualizovat“ se na kartě znovu zobrazí automaticky nalezená otevírací doba.',
  'help.guide.confirm-stay-booking.title': 'Potvrzení rezervace pobytu',
  'help.guide.confirm-stay-booking.tip.2':
    'Stejná pilulka funguje u každé rezervace, i u rezervací v části „Rezervace“ ve dni.',
  'help.guide.map-lock.tip.2':
    'Tento prohlížeč si zámek pamatuje pro každou cestu zvlášť. Po otevření cesty mapa přesto jednou přiblíží celou cestu, takže se nikdy neotevře na prázdném místě.',
  'help.guide.tour-map-lines.step.2':
    'Klikněte na linii nebo na špendlík na jejím začátku. Přes spodní část mapy se otevře karta výletu a jeho linie se zobrazí širší s bílým okrajem, takže ji mezi ostatními snadno najdete. Křížkem v záhlaví karty ji zavřete.',
  'help.guide.car-stops.title': 'Plánování jízdy se zastávkami po cestě',
  'help.guide.car-stops.result':
    'Jízda je kartou na kartě „Doprava“ a řádkem ve svém dni a její linie na mapě vede od vyzvednutí přes všechny zastávky v jejich pořadí až k vrácení.',
  'help.guide.transport-details.step.5':
    '„Na mapě“ dole v podrobnostech zobrazí linii jízdy a otevře „Plán“ v jejím dni. „Upravit“ úplně vpravo otevře celý formulář a košem vedle jízdu po potvrzení smažete.',
  'help.guide.export-transports-csv.step.1':
    'Pokud chcete jen část seznamu, nejdřív ho zužte. Počítá se „Hledat“, „Filtr“ i řazení v „Možnosti zobrazení“: soubor obsahuje to, co karta zobrazuje, a ve stejném pořadí.',
  'help.guide.group-sort-bookings.tip.1':
    '„Karty“ a „Seznam“ mají vlastní seskupení: „Karty“ začínají podle stavu, „Seznam“ podle dne. Tečka u „Možnosti zobrazení“ ukazuje, že se něco liší od výchozího stavu, a „Obnovit zobrazení“ dole v panelu výchozí stav vrátí.',
  'help.guide.booking-on-map.step.2': 'Dole v podrobnostech klikněte na „Na mapě“.',
  'help.guide.export-bookings-csv.goal':
    'Vyexportujte rezervace cesty jako soubor CSV, který otevřete v Excelu, Numbers nebo jiném tabulkovém programu.',
  'help.guide.arrange-packing-list.goal':
    'Přesuňte celé seznamy i jednotlivé položky tam, kam chcete, nebo si každý seznam zobrazte seřazený podle názvu.',
  'help.guide.check-off-packing.tip.4':
    'U položky s množstvím větším než jedna můžete kusy označovat jako zabalené i jednotlivě. Viz návod „Balení více kusů jedné věci“.',
  'help.guide.count-packed-pieces.tip.1':
    'Zaškrtnutím políčka zabalíte všechny kusy najednou, odškrtnutím je zase všechny vybalíte.',
  'help.guide.expense-receipts.goal':
    'Uložte účtenku nebo fakturu k výdaji, ke kterému patří, a otevírejte ji pak přímo z přehledu výdajů.',
  'help.guide.expense-receipts.tip.2':
    'Koš vedle účtenky ji při uložení z výdaje odebere. Samotný soubor zůstane v souborech; pokud ho chcete odstranit úplně, smažte ho tam.',
  'help.guide.files-sync.tip.4':
    'Pokud karta ukazuje žluté upozornění s tlačítkem „Znovu připojit“, úložiště už uložené přihlašovací údaje nepřijímá. Klikněte na „Znovu připojit“, zadejte nové heslo aplikace nebo token a synchronizace se znovu spustí.',
  'help.guide.files-sync-settings.result':
    'Od příští synchronizace se cesta synchronizuje jen ve směru, který jste zvolili, a mazání i konfliktní úpravy se řídí pravidly, která jste nastavili.',
  'help.guide.manage-notes.result':
    'Poznámka zmizí z karty „Poznámky“ všem členům najednou. Poznámka, kterou jste jen připnuli nebo upravili, zůstane a ostatní ji vidí tak, jak jste ji nechali.',
  'help.guide.note-categories.step.4':
    'Barevné tečky v řádku nastavují barvu kategorie: Indigo, „Červená“, „Jantarová“, Smaragdová, „Modrá“ nebo Fialová. Tady se „Ubytování“ zbarví do jantarova.',
  'help.guide.roadtrip-reorder.step.3':
    'Z klávesnice: přejděte na zastávku a stisknutím Alt se šipkou nahoru nebo dolů ji posunete o jedno místo v rámci dne.',
  'help.guide.roadtrip-overnight.title': 'Přenocování na trase',
  'help.guide.roadtrip-overnight.tip.1':
    'Nocleh trvá do následujícího dne. Pokud chcete jiná data, změňte rezervaci: upravte data v části „Dní“ spolu se zbytkem pobytu.',
  'help.guide.roadtrip-stop-fill.tip.1':
    'Odznak mají jen zastávky, kde může vaše auto doplnit energii: čerpací stanice u „Palivo“, nabíjecí stanice u „Elektro“, obojí u „Obojí“.',
  'help.guide.roadtrip-bookings.result':
    'Každý zarezervovaný spoj je v jízdě na místě, kde se odehrává, a trasa před ním a po něm vede k jeho terminálům a od nich.',
  'help.guide.roadtrip-google-import.step.1':
    'Klikněte na tři tečky nahoře v „Na trase“ a zvolte „Importovat trasu z Google Maps“.',
  'help.guide.roadtrip-hazards.title': 'Aktuální varování na mapě',
  'help.guide.roadtrip-hazards.tip.3':
    'Zdroje se obnovují každých deset minut a vyžadují připojení. Stejně jako ostatní nastavení jízdy se i tento přepínač ukládá pro cestu.',
  'help.ctx.trip-tours.bullet.6':
    'Změnu trasy a mazání výletu provedete na kartě „Výlety“ v části „Výlety této cesty“.',
  'help.guide.tour-show-list.tip.1':
    'Když na mapě kliknete na linii výletu, seznam tento výlet označí a posune se k němu.',
  'help.guide.tour-add-to-day.step.3':
    'Potvrdí to hlášení „Přidáno ke dni 10“, řádek dostane odznak dne a den v levém sloupci uvádí výlet s jeho časem, vzdáleností a stoupáním.',
  'help.guide.tour-day-times.title': 'Čas začátku výletu v jeho dni',
  'help.guide.tour-day-times.tip.3':
    '„Vynechat z trasy“ ve stejné nabídce ponechá výlet ve dni, ale vynechá ho z trasy dne na mapě. „Vrátit do trasy“ to vrátí.',
  'help.guide.tour-remove-from-day.tip.1':
    'Vícedenní výlet odebíráte ze dnů postupně po jednom, protože každý den má svou etapu.',
  'help.guide.tour-filter-list.step.4':
    'Zavřete nabídku. Tlačítko teď ukazuje stav, počet zbývajících výletů a +1 za každý další nastavený filtr.',
  'help.guide.tour-hide-on-map.step.2':
    'Linie výletu se na mapě skryje. Jeho řádek zůstane v seznamu, ztlumený, s přeškrtnutým okem („Zobrazit na mapě“). Kliknutím na něj linii znovu zobrazíte.',
  'help.guide.tour-import-plan-tab.step.2':
    'Nahoře v seznamu klikněte na „Importovat GPX nebo KML“ a vyberte soubory (GPX, KML nebo KMZ).',
  'help.ctx.trip-tour-detail.bullet.2':
    'Záhlaví ukazuje kulatou dlaždici výletu, jeho název s tužkou pro přejmenování, barevnou tečku pro barvu linie a pilulky s typem, původem, plánovaným časem, vzdáleností, stoupáním a klesáním. Křížkem vpravo nebo klávesou Escape kartu zavřete.',
  'help.guide.tour-detail-read.step.3':
    'Najeďte myší na čas a uvidíte, z čeho se skládá: čas v pohybu, pauzy a plánovaný celkový čas.',
  'help.guide.tour-detail-read.tip.4':
    'Karta trasu nemění. Pokud chcete posunout bod nebo překreslit úsek, otevřete kartu „Výlety“ a klikněte na výlet v části „Výlety této cesty“.',
  'help.guide.tour-rename-colour.step.4':
    'Vyberte barvu. „Automatická barva“, první políčko, vrátí linii výchozí barvu a „Vybrat vlastní barvu“, poslední políčko, umožní zvolit libovolnou barvu. Linie na mapě i proužek v seznamu výletů se změní okamžitě.',
  'help.guide.tour-take-along.step.3':
    'Kliknutím na GPX stáhnete uložený výlet jako soubor GPX: celou trasu i s výškami, které má, připravenou pro navigační aplikaci nebo zařízení GPS.',
  'help.guide.tour-copy-keep.step.1':
    'Otevřete kartu výletu a dole klikněte na „Kopírovat“. TREK vytvoří nový, samostatný výlet bez jeho dnů a původní výlet zůstane beze změny.',
  'help.guide.tour-copy-keep.result':
    'Cesta má druhý výlet, který můžete libovolně měnit, a sbírka obsahuje vlastní kopii, připravenou k přidání do jiné cesty.',
  'help.guide.tour-packing-link.tip.1':
    'Jde jen o propojení. Nic se nekopíruje ani nepřesouvá a položky zůstávají v „Seznamy“. Když tam některou zaškrtnete, výlet to hned ukáže.',
  'help.guide.tour-files.step.3': 'Kliknutím na soubor ho otevřete.',
  'help.guide.tour-activity-link.step.3':
    'Vyberte záznam v části „Stopa“, nebo klikněte na „Importovat GPX“ a nahrajte nový soubor.',
  'help.guide.tour-activity-compare.goal':
    'Zjistěte, kde se skutečná trasa liší od plánu, a změňte ji nebo ji odpojte.',
  'help.guide.tour-origin-check.title': 'Původ výletu',
  'help.guide.tour-origin-check.result': 'Víte, odkud výlet pochází, kdy vznikl a jestli se od té doby změnil.',
  'help.ctx.trip-tour-planner.bullet.6':
    'Neuložený koncept se zachová: když kartu „Výlety“ znovu otevřete, obnoví se s označením „Neuložený koncept obnoven“. „Zpět na výlety“ a „Zahodit“ se před zahozením změn zeptají.',
  'help.guide.tour-open-workspace.step.6':
    'Pilulka vlevo dole přepíná mapu, na začátku „Mapa“ nebo „Satelit“. S otevřeným výletem nabízí mapy jeho typu, například Topo nebo „Turistika“, a přepínače jako „Přidávat body“ a 3D.',
  'help.guide.tour-draw-route.step.1':
    'Nahoře v levém panelu klikněte na „Naplánovat nový výlet“. Panel se změní na „Nový výlet“, a pokud nezvolíte jiný typ, jde o túru.',
  'help.guide.tour-draw-route.tip.3':
    'Pokud má koncept neuložené změny, zeptá se „Naplánovat nový výlet“ v nabídce „Přidat túru“ nejdřív „Začít nový výlet?“ s volbou „Zahodit a začít“.',
  'help.guide.tour-type-profile.step.4':
    'Trasa se pro daný profil znovu naplánuje a „Přehled výletu“ vpravo ukáže její vzdálenost a čas.',
  'help.guide.tour-edit-points.step.3':
    'Pořadí změníte tak, že najedete na řádek a přetáhnete ho za úchyt, který se objeví u jeho levého okraje.',
  'help.guide.tour-shaping-points.goal': 'Převeďte trasu na jinou cestu, aniž byste přidávali zastávku.',
  'help.guide.tour-shaping-points.result':
    'Trasa vede tam, kam jste ji přetáhli, a zastávky mají stejná čísla jako dřív.',
  'help.guide.tour-loop-reverse.tip.3': 'U túry hledá „Okruh od startu“ vedle nich okružní túry zvolené délky.',
  'help.guide.tour-leg-by-hand.tip.1':
    'Ručně nakreslený úsek žádný router nekontroloval: může vést přes vodu, soukromý pozemek nebo sráz.',
  'help.guide.tour-trip-places.step.4':
    'Jeho řádek má pod názvem „Místo cesty“. „Odpojit od místa“ v „Další akce“ bod ponechá, ale propojení zruší.',
  'help.guide.tour-details-times.step.2': 'V části „Podrobnosti“ napište „Popis“ a případně doplňte „Webové stránky“.',
  'help.guide.tour-save.goal': 'Uložte nakreslený výlet do cesty.',
  'help.guide.tour-save.result': 'Výlet je uložený v cestě a připravený k zařazení do dne.',
  'help.guide.tour-edit-saved.tip.2':
    'Importovaná stopa GPX nebo KML se otevře jako „Výlet GPX“ k prohlížení. „Naplánovat upravitelnou verzi“ z ní vytvoří výlet, který můžete měnit.',
  'help.guide.tour-summary-profile.step.4':
    '„Sbalit výškový profil“, šipka vedle jeho nadpisu, profil skryje; dalším kliknutím ho zase zobrazíte.',
  'help.guide.tour-list-manage.step.2':
    'Najeďte na výlet a klikněte na kulaté plus na jeho řádku, „Přidat ke dni“, a otevřou se dny cesty.',
  'help.guide.tour-delete.title': 'Smazání výletu',
  'help.guide.tour-saved-elsewhere.title': 'Když byl výlet mezitím uložen jinde',
  'help.guide.tour-saved-elsewhere.result': 'Žádné změny se neztratí, pokud se je někdo sám nerozhodne zahodit.',
  'help.guide.tour-import-gpx.title': 'Import souboru GPX, KML nebo KMZ jako výletu',
  'help.guide.tour-import-gpx.tip.2':
    'Z každé stopy nebo trasy v souboru vznikne samostatný výlet. Stopy se nikdy nespojují.',
  'help.guide.tour-view-import.step.2':
    'Levý sloupec ho ukazuje jako „Výlet GPX“: „Přehled výletu“ se vzdáleností, výškami a zaznamenaným časem a pod ním výškový profil. Na mapě je jeho linie.',
  'help.guide.tour-plan-from-import.step.1':
    'Otevřete importovaný výlet na kartě „Výlety“. Na kartě „Upravitelná verze“ vlevo klikněte na „Naplánovat upravitelnou verzi“.',
  'help.guide.tour-plan-from-import.result':
    'Výlet má teď trasové body, které můžete přetahovat, a jeho „Původ“ uvádí „Přeplánováno, zaznamenaná stopa zachována“.',
  'help.guide.tour-restore-recorded.result': 'Výlet je opět „Výlet GPX“ a ukazuje linii, se kterou byl zaznamenán.',
  'help.guide.tour-take-over.step.6': 'Klikněte na „Převzít“.',
  'help.guide.tour-import-wanderer.step.2':
    'Pište do pole „Hledat trasy“. „Hledat v této oblasti mapy“ zobrazí jen trasy ve viditelné části mapy.',
  'help.ctx.trip-tour-map.title': 'Mapa výletu',
  'help.guide.tour-map-layers.goal':
    'Plánujte na mapě, která se k danému druhu výletu hodí nejlépe: s vrstevnicemi pro stoupání, se značenými stezkami nebo cyklotrasami, nebo s leteckými snímky.',
  'help.guide.tour-along-search.title': 'Hledání míst podél výletu',
  'help.guide.tour-along-search.tip.1':
    'Když změníte trasu, druhy míst nebo vzdálenost, zvýrazní se „Hledat znovu“ s upozorněním, že seznam platí pro původní trasu. Kliknutím ho aktualizujete.',
  'help.guide.tour-along-add-stop.step.4':
    'Trasa se znovu naplánuje přes dané místo a „Podél túry“ ukáže, o kolik se výlet prodloužil v kilometrech a čase. „Vrátit zpět“ ve stejném řádku zastávku zase odebere.',
  'help.guide.tour-3d-terrain.step.2':
    'Trasa je zbarvená podle sklonu. Kliknutím na „Sklon“ v řadě dole ji zobrazíte v barvě výletu, dalším kliknutím zase podle sklonu.',
  'help.guide.tour-3d-flyover.title': 'Přelet nad výletem',
  'help.guide.tour-3d-flyover.tip.2':
    'Přelet začne, až se načte krajina podél celé trasy, takže se uprostřed nezastaví kvůli načítání mapových dat. Když najedete myší na kroužek, uvidíte, kolik je načteno.',
  'help.guide.tour-map-overlays.result': 'Sjezdovky nebo plavební znaky se zobrazí přes mapu a legenda je vysvětlí.',
  'help.ctx.trip-tour-stages.bullet.3':
    '„Přehled výletu“ vypisuje v části „Etapy“ každou etapu od zastávky, kde začíná, po zastávku, kde končí. Kliknutím na etapu vyberete její poslední zastávku a místo se označí ve výškovém profilu.',
  'help.guide.tour-multi-day.step.4':
    '„Trasové body“ se teď dělí na „Etapa 1“ a „Etapa 2“, každou s vlastní vzdáleností a časem. Zastávka, kterou etapa končí, má ikonu měsíce.',
  'help.guide.tour-stages-on-days.title': 'Rozvržení vícedenního výletu do dnů cesty',
  'help.guide.tour-stages-on-days.tip.1':
    'Pokud cesta skončí dřív než poslední etapa, volba ukáže poslední etapu, která se ještě vejde. Etapy po ní žádný den nedostanou.',
  'help.ctx.trip-tour-hike.bullet.2':
    '„Trasové body“ vypisují zastávky v pořadí. „Přidat bod“ je zapnuté od začátku, takže kliknutím na mapu přidáte další; „Místa cesty“ vedle udělá z chaty nebo hotelu z cesty zastávku.',
  'help.guide.tour-hike-plan.step.2':
    'Otevřete „Typ túry“ a vyberte „Pěší túra“: pěšky, v obtížnosti, kterou nastavíte.',
  'help.guide.tour-hike-plan.tip.3':
    '„Volba trasy“ pod obtížností nastavuje preference trasy: „Vyhnout se prudkým stoupáním“, „Vyhnout se schodům“ a „Vyhnout se přívozům“. Pokud jiná cesta neexistuje, trasa tudy přesto povede.',
  'help.guide.tour-hike-trail-details.step.5':
    'Kliknutím na „Povrch“ uvidíte stejnou trasu podle toho, po čem jdete, od asfaltu po přírodní povrch a skálu.',
  'help.guide.tour-hike-round.step.2':
    'Přes mapu se otevře karta „Okružní túra“. Zkontrolujte start v poli „Od“ a zadejte požadovanou „Vzdálenost“. Pilulka vedle ukazuje rozsah délek, které okruh může mít.',
  'help.guide.tour-hike-compare-ways.title': 'Porovnání jiných cest pro jeden úsek túry',
  'help.guide.tour-hike-compare-ways.tip.2':
    'Když router žádnou jinou cestu nezná, karta na to upozorní. Když router zvolenou cestu sledovat nedokáže, úsek zůstane beze změny a karta vám to oznámí.',
  'help.guide.tour-ferrata-add.step.5':
    '„Přehled výletu“ vpravo ukáže odznak „Ferata“ s její obtížností a záhlaví editoru upozorní „Trasa vede po feratě“.',
  'help.guide.tour-run-plan.step.1': 'Klikněte na „Naplánovat nový výlet“, otevřete „Typ túry“ a vyberte „Běh“.',
  'help.guide.tour-run-plan.tip.3': 'Pokud máte vzdálenosti v mílích, je i tempo na míli.',
  'help.guide.tour-run-ways.tip.1': 'Nic z toho nemění trasu běhu ani jeho čas.',
  'help.ctx.trip-tour-walk.bullet.5':
    '„Přidat túru“ v „Výlety této cesty“ importuje pěší trasu sdílenou z Google Maps. Na kartě „Plán“ můžete u procházky otevřené z jejího dne odškrtávat zastávky pro tento den.',
  'help.guide.tour-walk-plan.step.6':
    '„Přehled výletu“ vpravo ukazuje „Odhad. čas chůze“, „Pobyty“ a „Plánováno“, tedy obojí dohromady. Procházku uložíte kliknutím na „Uložit“ dole v levém sloupci.',
  'help.guide.tour-walk-sights.step.2':
    'Téma vyplní „Co hledat“. Rozbalte ho a zapněte nebo vypněte jednotlivé druhy míst; v části „Do této vzdálenosti od trasy“ zvolte, jak daleko hledat.',
  'help.guide.tour-walk-day-times.title': 'Časy příchodů a otevírací doba pro daný den',
  'help.guide.tour-walk-day-times.tip.3':
    'Otevírací doba pochází z OpenStreetMap nebo z místa cesty, ke kterému zastávka patří, a pilulka vedle uvádí odkud. Před cestou si ji ověřte.',
  'help.guide.tour-walk-google-import.step.4':
    'Klikněte na „Načíst jako procházku“. TREK sám naplánuje pěší cestu mezi zastávkami. Procházku uložíte kliknutím na „Uložit“.',
  'help.guide.tour-walk-check-off.step.2':
    'Posuňte se k části „Zastávky procházky“. U každé zastávky vidíte, jak dlouho tam zůstanete, a pokud má procházka čas začátku, i kdy dorazíte.',
  'help.ctx.trip-tour-bike.summary':
    'Cyklovýlet otevřený v editoru na kartě „Výlety“: profil, pro který je naplánovaný, doba jízdy, po čem trasa vede a u výletu na horském kole i obtížnost stezek.',
  'help.guide.tour-bike-profile.step.2': 'Otevřete pole „Typ túry“ a vyberte „Cyklovýlet“.',
  'help.guide.tour-bike-profile.tip.3':
    'Pokud se k bodu nepřiblíží žádná cesta pro kola, ukáže panel No way for bikes reaches point N. Bod posuňte, nebo u předchozího bodu otevřete „Další akce“ a zvolte „Nakreslit další úsek ručně“.',
  'help.guide.tour-bike-surfaces.step.4':
    'V části „Druh cesty“ klikněte na řádek, například „Polní nebo lesní cesta“ nebo „Silnice s provozem“, a uvidíte, kde po ní trasa vede.',
  'help.guide.tour-bike-mtb-grades.step.1':
    'Otevřete cyklovýlet v editoru a zkontrolujte, že je „Profil“ nastavený na MTB. Obtížnost stezek se načítá jen u tohoto profilu.',
  'help.ctx.trip-tour-ski.title': 'Lyžařské a zimní výlety',
  'help.guide.tour-ski-plan.goal':
    'Naplánujte den na sjezdovkách, běžkařský okruh, skialpinistický výlet nebo výšlap na sněžnicích po zmapovaných sjezdovkách, vlecích a tratích.',
  'help.guide.tour-ski-plan.tip.2':
    'Informační tečka vedle „Disciplína“ vysvětluje, co TREK s lyžařskými výlety dělá. Nic v ní ani nikde jinde tady neříká nic o sněhu, lavinách ani o tom, jestli jsou sjezdovky, vleky a tratě v provozu.',
  'help.guide.tour-ski-options.step.3':
    'V části „Upřednostnit“ zvolte „Nejrychlejší“, „Nejvíc lyžování“ nebo „Nejlehčí“. V části „Tempo“ zvolte „Pohodové“, „Normálně“ nebo „Sportovní“: mění čas, který router přiřadí každé sjezdovce.',
  'help.guide.tour-ski-fix-leg.goal': 'Nechte červený úsek naplánovat jedním kliknutím, nebo ho nakreslete rovně.',
  'help.guide.tour-ski-fix-leg.result':
    'Žádný úsek už není červený: každý vede po sjezdovkách nebo rovně mezi svými body.',
  'help.guide.tour-ski-summary.tip.3':
    'Uložený výlet se otevře tak, jak byl uložen. Pokud ho chcete znovu naplánovat podle aktuálních dat o sjezdovkách, posuňte bod nebo změňte některou volbu.',
  'help.guide.tour-ski-pistes-layer.tip.1':
    'Pokud přepínač zůstane zašedlý a ukazuje „Přibližte mapu, abyste viděli sjezdovky“, přibližte mapu na lyžařský areál.',
  'help.guide.tour-ski-import.step.3':
    'Vyberte „Disciplína“ a u „Běh na lyžích“ i „Technika“. Dokud to neuděláte, dialog ukazuje Choose a discipline to import the track as ski.',
  'help.ctx.trip-tour-paddle.title': 'Vodácké výlety',
  'help.guide.tour-paddle-setup.title': 'Plánování vodáckého výletu',
  'help.guide.tour-paddle-setup.step.7':
    'Zkontrolujte, že je zapnuté „Přidat bod“, a klikejte na mapu: nejdřív místo, kde spouštíte loď na vodu, pak body po cestě a nakonec místo, kde loď vytahujete.',
  'help.guide.tour-paddle-water-route.step.1':
    'Ručně nakreslený úsek má pod svým bodem „Nakresleno ručně, nevypočítáno“ a svou délku. TREK zachová jeho linii tak, jak jste ji nakreslili.',
  'help.guide.tour-paddle-water-route.tip.4':
    'Dokud některý úsek není naplánovaný, nelze výlet uložit. Nejdřív ho naplánujte po vodě nebo nakreslete ručně.',
  'help.guide.tour-paddle-portage.step.5':
    'Do pole „Výstup a nástup“ zadejte, kolik minut potřebujete na vystoupení, vyložení a opětovné spuštění lodi. Pokud pole necháte prázdné, počítá TREK s 10 minutami.',
  'help.guide.tour-paddle-lock.step.2':
    'Zvolte „Zdymadlo v tomto bodě“. Pod bodem se objeví karta zdymadla s označením „Chybí čas“.',
  'help.guide.tour-paddle-time.goal':
    'Podívejte se, jak se sčítá čas na vodě, přenášení, zdymadla a pauzy, a nastavte vlastní hodnoty.',
  'help.guide.tour-paddle-time.tip.3':
    'Pauzy a vlastní plánovaný celkový čas nastavíte v části „Podrobnosti“. Pokud ho zadáte, ukáže karta vedle odhadu „Vaše plánovaná celková doba“.',
  'help.guide.tour-paddle-wind.tip.1':
    'Předpověď je k dispozici jen na příštích 16 dní. U vzdálenějšího dne karta uvede, od kterého data bude předpověď k dispozici. U dne v minulosti uvede, že už uplynul.',
  'help.guide.tour-paddle-checklist.step.2':
    'Řádek pod ním ukazuje, jak aktuální data jsou: „Stav OSM“ pro OpenStreetMap, „Načteno“ pro čas, kdy je TREK načetl, a „Údaje o překážkách“ tam, kde nepokrývají celou trasu.',
  'help.guide.tour-paddle-checklist.tip.5':
    'Kontrolní seznam není bezpečnostní ani právní schválení. Vaše rozhodnutí neruší zákaz ani soukromý pozemek zaznamenaný v OpenStreetMap.',
  'help.guide.tour-paddle-track-marks.step.5':
    'Klikněte na „Přenáška“ a pak na linii v místě, kde jste vystoupili, a v místě, kde jste loď znovu spustili.',
  'help.ctx.trip-tour-horse.summary':
    'Vyjížďka na koni se nikdy neplánuje routerem. Skládá se z úseků značených jezdeckých tras, které zná OpenStreetMap, propojených úseky, které nakreslíte ručně, nebo zůstává přesně tak, jak jste ji zaznamenali.',
  'help.guide.tour-horse-plan.step.1':
    'Zobrazte na mapě oblast, kde chcete jezdit, a nahoře v levém sloupci klikněte na „Naplánovat nový výlet“.',
  'help.guide.tour-horse-plan.tip.1':
    'Jezdecká trasa vám ještě nedává povolení po ní jet. „Přístup pro koně“ ukazuje jen to, co je označené v OpenStreetMap. Vždy se řiďte značením na místě.',
  'help.guide.tour-horse-gap.step.2': 'Zapněte „Propojit ručním úsekem“. Mezera se vykreslí jako přímka bez ověření.',
  'help.guide.tour-horse-recorded.goal':
    'Importujte vyjížďku zaznamenanou v zařízení GPS nebo v aplikaci a zachovejte ji přesně tak, jak jste ji jeli.',
  'help.guide.tour-horse-recorded.tip.3':
    'Stejný náhled otevřete i tak, že soubor přetáhnete kamkoli na kartu „Výlety“.',
  'help.guide.create-trip.tip.3':
    'V části „Spolucestující“ můžete přidat lidi, kteří tu už mají účet. Členy cesty se stanou hned po jejím vytvoření.',
  'help.guide.trip-reminder.step.1':
    'Klikněte na tužku na kartě cesty. U nové cesty má formulář „Nová cesta“ stejnou sekci.',
  'help.guide.company-holidays.tip.2':
    'Celodenní firemní volno odstraní dovolenou už zapsanou na tento den, takže na něj nikdo nečerpá nárok na dovolenou.',
  'help.guide.half-company-holiday.tip.2':
    'Dalším kliknutím na den se stejným nastavením ho zrušíte, s vypnutým „Půlden“ z něj uděláte celodenní firemní volno.',
  'help.guide.edit-holiday-calendar.step.1':
    'Otevřete „Nastavení“ a najděte kalendář v části „Státní svátky“ nebo „Školní prázdniny“.',
  'help.guide.person-color.goal': 'Přidělte sobě nebo někomu, s kým plánujete, barvu, kterou snáz rozlišíte.',
  'help.guide.answer-fusion-request.tip.2':
    'Propojení může později kdokoli z vás zrušit a vaše záznamy zůstanou zachované.',
  'help.guide.log-for-partner.tip.2':
    'Druhá osoba změnu vidí okamžitě a její řádek v kartě „Nárok“ se hned aktualizuje.',
  'help.guide.country-places.title': 'Všechna místa v zemi',
  'help.guide.tour-activity-stats.step.1':
    'V panelu dole na mapě otevřete kartu „Výlety“ vedle „Statistiky“ a „Bucket list“.',
  'help.guide.tour-activity-stats.tip.2':
    'Propojte skutečně absolvovanou stopu přes „Přidat skutečnou trasu“ v podrobnostech výletu a její zaznamenané hodnoty tu nahradí plánované. Výlet naplánovaný na několik dní se počítá jednou.',
  'help.ctx.collections.bullet.7':
    'Uložené výlety: výlety uložené z cesty jsou první řádky seznamu, s obtížností, typem, cestou, ze které pocházejí, a s údaji. „Přidat do cesty“ z nich vytvoří nový výlet a ikonou koše ho ze seznamu odeberete.',
  'help.guide.move-to-list.title': 'Přesun nebo duplikace míst do jiného seznamu',
  'help.guide.copy-to-trip.tip.2': 'Místo, které už cesta má, se přeskočí a TREK ukáže, kolik jich bylo přeskočeno.',
  'help.guide.accept-list-invite.tip.2':
    'Kliknutím na „Sdílené“ nahoře v seznamu zobrazíte jeho členy. Tam také kliknutím na „Opustit seznam“ seznam zase opustíte.',
  'help.guide.tour-collection-add-to-trip.goal':
    'Vytvořte v některé ze svých cest nový výlet z výletu uloženého v seznamu, s trasovými body nebo bez nich.',
  'help.guide.tour-collection-add-to-trip.result':
    'Dialog potvrdí, že výlet teď patří k dané cestě. „Otevřít cestu“ vás do ní přenese, „Uzavřít“ vás nechá ve Sbírkách.',
  'help.guide.tour-collection-manage.tip.3': 'Uložené výlety se zobrazují jen ve svém seznamu, ne v „Vše uložené“.',
  'help.guide.search-journey.step.3':
    'Kliknutím na den se k němu posunete, kliknutím na jeho šipku zobrazíte záznamy toho dne a jeden vyberete.',
  'help.guide.journey-map-layers.goal': 'Rozlište plán od toho, co se skutečně stalo, a zapínejte a vypínejte vrstvy.',
  'help.guide.journey-keep-route.goal': 'Přidejte skutečnou trasu dne z Dawarich na mapu deníku a nechte ji tam.',
  'help.guide.journey-day-stays.goal': 'Postupně převeďte pobyty zaznamenané v Dawarich na záznamy.',
  'help.guide.journey-take-over-day.goal':
    'Převeďte jedním krokem pobyty dne na koncepty záznamů, nebo na jednu denní zprávu.',
  'help.guide.journey-auto-prepare.title': 'Automatická příprava zaznamenaných dnů',
  'help.guide.photo-location.title': 'Umístění záznamů podle místa pořízení fotek',
  'help.ctx.settings-about.summary':
    'Co je TREK, jakou verzi tento server používá a kde projekt najdete: dokumentace, kam hlásit chyby a jak projekt podpořit.',
  'help.guide.startup.tip.2': 'Úvodní karta patřící k doplňku, který jste vypnuli, otevře místo toho plán.',
  'help.guide.web-push-device.title': 'Push notifikace na tomto zařízení',
  'help.guide.connect-airtrail.tip.1': 'Karta se zobrazí, jen když má správce zapnutý doplněk AirTrail.',
  'help.guide.connect-dawarich.tip.1':
    'TREK záznamy, místa a země jen navrhuje; nic se nepřidá, dokud to nepotvrdíte, a do Dawarich se nic nezapisuje.',
  'help.guide.tour-connect-wanderer.tip.1': 'Karta se zobrazí, jen když správce povolí wanderer v části Výlety.',
  'help.guide.tour-wanderer-watch.tip.1':
    'Upozornění výlet nikdy nezmění; co se skutečně změnilo, ukáže kontrola zdroje výletu.',
  'help.guide.api-keys.tip.3':
    'Klíč posílejte jako Authorization: Bearer nebo X-API-Key na /api/v1. Jeden účet může mít až 10 klíčů.',
  'help.guide.plugin-settings.step.2':
    '„Aktivita pluginů“ vypisuje každou akci, kterou plugin provedl vaším jménem, od nejnovější; „Obnovit“ načte nejnovější stav.',
  'help.ctx.admin-github.bullet.3':
    '„O aplikaci“: Ko-fi, Buy Me a Coffee, Discord, „Nahlásit chybu“, „Navrhnout funkci“ a Wiki.',
  'help.guide.default-user-settings.goal':
    'Nastavte všem účtům rozumné jednotky, barevné schéma a měnu, aniž by kdokoli musel otevírat Nastavení.',
  'help.guide.default-map.step.3':
    'Každé pole se uloží, jakmile ho opustíte. Odkaz „obnovit“ vedle názvu pole vrátí výchozí hodnotu TREK.',
  'help.guide.own-routing-engine.tip.2':
    'Pokud je nastavený jen váš vlastní směrovací server, nepoužívá se ani veřejná Valhalla. Odkazem „obnovit“ vedle pole ho zase vymažete.',
  'help.guide.admin-passkeys.step.1':
    'Na kartě „Nastavení“ v části „Přihlášení přístupovým klíčem“ zapněte „Povolit přihlášení přístupovým klíčem“.',
  'help.guide.storage-backends.step.4':
    '„Zdraví“ nahoře vypisuje neúspěšné zápisy do cíle zrcadlení. Pokud ukazuje „Nebyly zaznamenány žádné chyby replik.“, vše funguje.',
  'help.guide.channels-instance.tip.3':
    'Web Push vyžaduje HTTPS. Na iPhonu a iPadu musí lidé nejdřív přidat TREK na plochu.',
  'help.guide.notification-defaults.step.1':
    'Na kartě „Oznámení“ se posuňte dolů k části „Výchozí nastavení pro uživatele“. Každý řádek je událost, každý sloupec kanál.',
  'help.ctx.notifications.bullet.1':
    'Zvonek vpravo nahoře ukazuje počet nepřečtených oznámení. Kliknutím na něj zobrazíte posledních deset a kliknutím na „Zobrazit všechna oznámení“ dole otevřete tuto stránku.',
  'help.guide.read-notifications.step.2':
    'Panel vypisuje vašich posledních deset oznámení. U každého je uvedeno, kdo co a kde udělal, a nepřečtená mají podbarvené pozadí.',
  'help.guide.filter-notifications.step.2': 'Dole v panelu klikněte na „Zobrazit všechna oznámení“.',
  'help.guide.mark-notifications-read.tip.1':
    'Otevřením oznámení přes jeho tlačítko se oznámení také označí jako přečtené.',
  'help.guide.delete-notifications.tip.2':
    'Smazané oznámení nelze obnovit. Pokud ho chcete skrýt, ale ponechat, označte ho jako přečtené a použijte filtr „Nepřečtené“.',
  'help.guide.notification-settings.tip.2':
    'Nastavení pro jednotlivé cesty neexistuje: jeden přepínač platí pro všechny vaše cesty.',
  'help.guide.link-journal.title': 'Propojení deníku s cestou',
  'help.guide.link-journal.tip.2':
    'Lidé, kterým dáte přístup, pak deník uvidí i ve svém vlastním seznamu cestovních deníků.',
  'help.ctx.trip-places.bullet.8':
    'Když máte připojený Dawarich, ukazuje „Z Dawarichu“ nahoře v seznamu pobyty, které Dawarich během cesty zaznamenal. „Přidat jako místo“ udělá z pobytu místo, „Tady jsem nebyl“ ho ze seznamu odebere.',
  'help.guide.dawarich-stays.step.4':
    'Pokud pobyt nebyl skutečnou návštěvou, odeberete ho kliknutím na „Tady jsem nebyl“, křížek vedle něj. „Zobrazit … už vyřízené“ dole v seznamu ukáže pobyty, které jste přidali nebo odebrali. „Vrátit zpět“ vrátí odebraný pobyt do seznamu.',
  'help.guide.leave-stop-off-route.tip.1':
    'Tuto volbu má jen zastávka se souřadnicemi a nastavení platí jen pro tento den: stejné místo v jiném dni se do trasy dál započítává.',
  'help.guide.move-booking-day.title': 'Přesun rezervace na jiný den',
  'help.guide.place-image-from-file.step.4':
    'Fotka je teď obrázkem místa. Kliknutím na malý červený křížek v jejím rohu ji zase odeberete.',
  'help.guide.place-own-hours.step.2': 'Pod „Webové stránky“ vyplňte „Telefon“ a „E-mail“, pokud je znáte.',
  'help.guide.add-accommodation.tip.4':
    'Rychlejší způsob: + v záhlaví dne s popiskem „Přidat ke dni“ nabízí „Přidat ubytování“. Otevře den rovnou s tímto formulářem.',
  'help.guide.confirm-stay-booking.goal': 'Označte rezervaci hotelu k pobytu jako potvrzenou, a to přímo ze dne.',
  'help.guide.map-whole-trip.tip.4':
    'Zda se zobrazuje celá cesta, se ukládá pro každou cestu ve vašem účtu, takže se cesta otevře stejně i v jiném prohlížeči.',
  'help.guide.tour-map-lines.step.3':
    'Otevřete ve sloupci dnů den, ve kterém výlet je, a výlet se stane součástí trasy dne: trasa vede na začátek výletu a pokračuje z místa, kde končí.',
  'help.guide.car-stops.goal':
    'Zadejte u půjčeného nebo vlastního auta vyzvednutí, vrácení a místa, kde mezitím zastavíte.',
  'help.guide.car-stops.tip.1': 'Zvláštní typ pro půjčovnu neexistuje: půjčené i vlastní auto je „Auto“.',
  'help.guide.transport-details.result':
    '„Plán“ je otevřený v den jízdy, její linie je na mapě a ikona trasy na jejím řádku je zapnutá.',
  'help.guide.export-transports-csv.step.2':
    'Klikněte na ikonu tabulky za „Možnosti zobrazení“ s popiskem „Exportovat jako tabulku (CSV)“.',
  'help.guide.group-sort-bookings.title': 'Seskupení a řazení rezervací',
  'help.guide.group-sort-bookings.tip.2':
    'V zobrazení „Časová osa“ obsahuje stejné tlačítko volby „Jeden pruh pro každý typ“ a „Zobrazit druhou kartu“.',
  'help.guide.booking-on-map.result':
    'Podrobnosti se zavřou a otevře se karta „Plán“ v den rezervace s jejím místem vybraným na mapě.',
  'help.guide.export-bookings-csv.step.1':
    'Pokud chcete exportovat jen část karty, nejdřív ji zužte přes „Hledat“ nebo „Filtr“. Soubor obsahuje přesně to, co karta zobrazuje.',
  'help.guide.import-booking-file.tip.4':
    'Čtení potvrzení vyžaduje připojení. Offline vás na to „Importovat“ upozorní a zkusíte to znovu, až bude TREK online.',
  'help.guide.arrange-packing-list.step.1':
    'Uchopte úchyt na levém konci záhlaví seznamu, před barevnou tečkou, a pusťte seznam na jinou kartu. Obrys ve vaší barvě zvýraznění označí cílovou kartu a seznam zaujme její místo pro všechny v cestě.',
  'help.guide.count-packed-pieces.title': 'Balení více kusů jedné věci',
  'help.guide.count-packed-pieces.tip.2':
    'Když je zapnuté „Sledování zavazadel“, počítá „Zabaleno“ na kartě „Zavazadla“ jen kusy, které už jsou započítané jako zabalené.',
  'help.guide.packing-bags.tip.4':
    'Hmotnost tašky, kterou nese víc lidí, se v části „Na osobu“ rozdělí rovným dílem. Tato hmotnost je podtržená tečkovaně a po najetí myší se zobrazí vysvětlení.',
  'help.guide.expense-receipts.step.1':
    'Klikněte na tužku vedle řádku výdaje. Otevře se editor výdaje a dole najdete „Účtenky a faktury“.',
  'help.guide.expense-receipts.tip.3':
    'Přiložení vyžaduje připojení a oprávnění nahrávat soubory, protože účtenka se ukládá jako jeden ze souborů cesty.',
  'help.guide.files-sync-settings.title': 'Volba směru synchronizace dokumentů',
  'help.guide.files-sync-settings.tip.1':
    'Jeden pruh zůstává vždy zapnutý: kliknutí na jediný zapnutý pruh nic neudělá.',
  'help.guide.manage-notes.title': 'Čtení, připnutí a úprava poznámky',
  'help.guide.manage-notes.tip.1':
    '„Rozbalit“ je v nabídce, jen když poznámka obsahuje text. Člen, který nesmí upravovat „Spolupráce“, vidí jen „Rozbalit“.',
  'help.guide.note-categories.step.5':
    'Klikněte na „Uložit“. Všechny poznámky v přejmenované nebo přebarvené kategorii se změní najednou, a to všem členům. „Zrušit“ změny zahodí.',
  'help.guide.trip-chat.tip.5':
    'Chat ukazuje nejdřív nejnovější zprávy. „Načíst starší zprávy“ nahoře v chatu načte starší zprávy.',
  'help.guide.roadtrip-reorder.result':
    'Zastávky jsou v pořadí, které jste nastavili, a vzdálenost, doba jízdy a časy příjezdu každého změněného dne se přepočítají.',
  'help.guide.roadtrip-overnight.goal': 'Najděte nocleh na cestě a přidejte noc do jízdy jako rezervaci.',
  'help.guide.roadtrip-overnight.tip.2':
    'Když zarezervovanou noc přes „Upravit“ na její kartě přepnete zpět na „Pauza“, zobrazí se nejdřív dotaz „Zrušit přenocování?“. „Změnit na pauzu“ odstraní noc i s rezervací a případným propojeným výdajem a zastávku v jízdě ponechá.',
  'help.guide.roadtrip-stop-fill.tip.2':
    'Pokud vyberete hodnotu, kterou už zastávka má, vrátí se zastávka k vaší výchozí hodnotě.',
  'help.guide.roadtrip-bookings.tip.1':
    'Čas příjezdu k terminálu se kvůli odbavení nastaví dřív, než uvádí jízdní řád: hodinu u letu nebo plavby, půl hodiny u trajektu, deset minut u vlaku nebo autobusu.',
  'help.guide.roadtrip-google-import.step.2':
    'Vložte odkaz na trasu, kterou jste sdíleli z Google Maps, a klikněte na „Náhled“.',
  'help.guide.roadtrip-hazards.goal':
    'Zobrazte si na mapě výstrahy před počasím a upozornění na katastrofy v okolí vaší jízdy.',
  'help.ctx.trip-tours.title': 'Výlety v plánu',
  'help.guide.tour-show-list.title': 'Zobrazení výletů cesty v plánu',
  'help.guide.tour-show-list.tip.2':
    'Zatím žádné výlety? „Importovat GPX nebo KML“ nahoře v seznamu importuje soubor a „Naplánovat nový výlet“ na kartě „Výlety“ vytvoří nový.',
  'help.guide.tour-add-to-day.step.4':
    'Nebo přetáhněte řádek ze seznamu a pusťte ho na den v levém sloupci. Když ho pustíte mezi dvě zastávky, zařadí se přesně tam.',
  'help.guide.tour-day-times.goal': 'Zjistěte, kdy výlet skončí a jestli nezasahuje do dalšího programu dne.',
  'help.guide.tour-day-times.tip.4':
    '„Uložit do sbírky“ ve stejné nabídce uloží výlet i s trasou do sbírky, stejně jako tlačítko „Sbírka“ na kartě.',
  'help.guide.tour-remove-from-day.tip.2':
    'V těchto nabídkách ani na kartě není „Smazat“. Výlet se maže na kartě „Výlety“ košem na jeho řádku v části „Výlety této cesty“.',
  'help.guide.tour-filter-list.tip.1':
    '„Limit trasy“ je nejvyšší obtížnost, kterou trasa při plánování směla mít, ne obtížnost naměřená na stezce.',
  'help.guide.tour-hide-on-map.step.3':
    'Dokud je některý výlet skrytý, ukazuje řádek nad seznamem „Skryto na mapě“ i s počtem. „Zobrazit vše“ vrátí všechny výlety najednou.',
  'help.guide.tour-import-plan-tab.step.3':
    '„Náhled importu“ ukáže každou stopu dřív, než se cokoli uloží. V části „Importovat jako“ zvolte typ („Pěší túra“, „Cyklovýlet“ a další) a klikněte na „Importovat 1 výlet“.',
  'help.ctx.trip-tour-detail.bullet.3':
    'Níže následují „Dny cesty“ s dlaždicí pro každý den, ve kterém výlet je, údaje s výškovým profilem a pak, pokud se týkají: zastávky procházky městem, kontroly a vítr u vodáckého výletu, „Skutečná trasa“, „Seznam věcí“, „Popis“, „Poznámky“, „Původ“ a „Soubory“.',
  'help.guide.tour-detail-read.step.4':
    '„Dny cesty“ ukazují dlaždici s datem pro každý den, ve kterém výlet je. Pokud výlet zatím není v žádném dni cesty, je ještě nenaplánovaný.',
  'help.guide.tour-detail-read.tip.5':
    'V telefonu se karta otevře jako panel zespodu, ke čtení i k tomu, abyste si výlet vzali s sebou.',
  'help.guide.tour-rename-colour.tip.1':
    'Název a barva patří k cestě, takže je vidí všichni v ní. Pokud chcete výlet skrýt jen na své mapě a nikomu ho neměnit, použijte oko v seznamu výletů.',
  'help.guide.tour-take-along.tip.1':
    'Na zařízení, které umí sdílet soubory, se vedle GPX objeví „Sdílet“ a stejný soubor pošle rovnou do jiné aplikace.',
  'help.guide.tour-copy-keep.step.2':
    'Kopie se hned otevře s názvem originálu a za ním (kopie). Kliknutím na tužku jí dáte vlastní název.',
  'help.guide.tour-packing-link.title': 'Propojení výletu se seznamem věcí',
  'help.guide.tour-packing-link.tip.2':
    '„Změnit“ v záhlaví sekce propojí výlet s jiným seznamem. „Zrušit propojení“ v tomto dialogu propojení odstraní a seznam zůstane beze změny.',
  'help.guide.tour-files.tip.1': 'Soubory jsou zároveň soubory cesty, takže se zobrazují i na kartě „Soubory“.',
  'help.guide.tour-activity-link.step.4':
    'V části „Skutečnost“ zkontrolujte, co stopa naměřila, a klikněte na „Připojit“.',
  'help.guide.tour-activity-compare.step.1':
    'Otevřete kartu výletu. „Plán a skutečnost“ ukazuje „Vzdálenost“, „Stoupání“, „Klesání“ a „Čas s přestávkami“ z plánu vedle hodnot ze stopy, včetně „Rozdíl“.',
  'help.guide.tour-origin-check.goal':
    'Zjistěte, jestli byl výlet nakreslený v TREK nebo importovaný, z jakého souboru a zda se od té doby změnil.',
  'help.ctx.trip-tour-planner.title': 'Výlety',
  'help.guide.tour-open-workspace.title': 'Orientace na kartě Výlety',
  'help.guide.tour-open-workspace.step.7':
    'Klikněte na výlet v pravém panelu. Výlet naplánovaný v TREK se otevře v editoru. Importovaná stopa se otevře beze změny jako „Výlet GPX“ k prohlížení.',
  'help.guide.tour-draw-route.step.2':
    'Do pole „Hledat místo nebo adresu“ napište, kde výlet začíná, a vyberte výsledek. Mapa se tam přesune.',
  'help.guide.tour-draw-route.tip.4':
    'Neuložený koncept se zachová. Když znovu otevřete kartu „Výlety“ dané cesty, obnoví se s označením „Neuložený koncept obnoven“.',
  'help.guide.tour-type-profile.tip.1':
    'Změna typu se v historii počítá jako jeden krok: „Vrátit úpravu bodu“ v záhlaví panelu obnoví původní typ i jeho trasu.',
  'help.guide.tour-edit-points.step.4':
    'Nebo na řádku otevřete „Další akce“ (tři tečky) a zvolte „Posunout bod nahoru“ nebo „Posunout bod dolů“.',
  'help.guide.tour-shaping-points.step.1':
    'Klikněte na nakreslenou trasu na mapě v místě, kudy má vést jinak. Objeví se tam malá tečka: tvarový bod.',
  'help.guide.tour-loop-reverse.title': 'Okruh nebo obrácení výletu',
  'help.guide.tour-loop-reverse.result': 'Okruh, který končí tam, kde začal, nebo stejný výlet v opačném směru.',
  'help.guide.tour-leg-by-hand.tip.2':
    'U bodu, ke kterému nevede žádná cesta, se zobrazí upozornění s tlačítkem „Zobrazit bod“ a jeho číslem. Posuňte bod na cestu, nebo k němu nakreslete úsek ručně.',
  'help.guide.tour-trip-places.tip.1': 'Místo, které už ve výletu je, je označené „V túře“ a nelze ho vybrat podruhé.',
  'help.guide.tour-details-times.step.3': 'Zadejte „Pauzy“, například 0:45. Přičtou se k odhadovanému času.',
  'help.guide.tour-save.step.1': 'Do pole „Název výletu“ zadejte název. Bez něj zůstane „Uložit“ zašedlé.',
  'help.guide.tour-edit-saved.title': 'Úprava uloženého výletu',
  'help.guide.tour-edit-saved.tip.3':
    '„Stáhnout GPX“ a „Uložit do sbírky“ v záhlaví panelu fungují, až budou změny uložené.',
  'help.guide.tour-summary-profile.tip.1': 'Kliknutím na nadpis karty sbalíte celý přehled.',
  'help.guide.tour-list-manage.step.3': 'Vyberte den. Výlet se do něj přidá a jeho řádek ukáže den.',
  'help.guide.tour-delete.goal': 'Odstraňte výlet z cesty natrvalo.',
  'help.guide.tour-saved-elsewhere.goal':
    'Rozhodněte, co se stane, když výlet mezitím uložil někdo jiný, zatímco jste ho upravovali.',
  'help.ctx.trip-tour-import.title': 'Import výletů',
  'help.guide.tour-import-gpx.goal':
    'Převeďte stopu z hodinek s GPS, aplikace nebo Google Earth na výlet cesty a zkontrolujte ji dřív, než se cokoli uloží.',
  'help.guide.tour-import-gpx.tip.3':
    'Stopa, kterou už cesta má, je zašedlá s označením „Už je v cestě“ a přeskočí se.',
  'help.guide.tour-view-import.step.3': '„Zpět na výlety“, šipka vlevo nahoře, ji zase zavře.',
  'help.guide.tour-plan-from-import.step.2':
    'TREK vezme ze stopy kontrolní body a znovu mezi nimi naplánuje trasu. Mapa ukazuje import tečkovaně a návrh plnou čarou a karta porovnává jejich délky, podíl do 50 m od stopy a „Největší odchylka“.',
  'help.guide.tour-restore-recorded.title': 'Návrat k zaznamenané stopě',
  'help.guide.tour-take-over.title': 'Převzetí výletu z jiné cesty',
  'help.guide.tour-take-over.tip.1':
    'Kopie je samostatný výlet. Zatím není v žádném dni a pozdější změny originálu se kopie nedotknou, ani naopak. Její „Původ“ uvádí cestu, ze které byla převzata.',
  'help.guide.tour-import-wanderer.step.3':
    'Klikněte na trasu. Zobrazí se na mapě a sloupec ukáže, co naměřil její soubor GPX, její popis a jestli je ve wanderer veřejná, nebo soukromá.',
  'help.ctx.trip-tour-map.summary':
    'Mapa uprostřed karty „Výlety“ pro otevřený výlet: mapy, které se hodí k jeho typu, sjezdovky nebo plavební znaky nad nimi, místa podél trasy a stejný výlet ve 3D na skutečném terénu.',
  'help.guide.tour-map-layers.step.1':
    'Otevřete kartu „Výlety“ a vpravo v „Výlety této cesty“ klikněte na výlet. Otevře se v plánovači a pilulka vlevo dole na mapě vypíše mapy, které tento druh výletu nabízí.',
  'help.guide.tour-along-search.goal':
    'Hledejte vyhlídky, vodu, chaty nebo místo k jídlu poblíž trasy výletu, který plánujete.',
  'help.guide.tour-along-search.tip.2':
    'U procházky městem vyberou správné druhy míst za vás čtyři témata nad seznamem.',
  'help.guide.tour-along-add-stop.result':
    'Výlet teď vede kolem daného místa a „Přehled výletu“ ukazuje novou vzdálenost a čas. Změnu zachováte uložením výletu.',
  'help.guide.tour-3d-terrain.step.3':
    'Klikněte na pilulku „Rozložení sklonu“ vpravo. Rozbalí se a ukáže, jaká část výletu má sklon „pod 5 %“, „5 až 10 %“, „10 až 18 %“, „18 až 27 %“ a „27 % a více“. Ve sbaleném stavu ukazuje nejvyšší bod a nejstrmější úsek.',
  'help.guide.tour-3d-flyover.goal':
    'Prohlédněte si celý výlet od začátku do konce dřív, než ho projdete, projedete nebo sjedete.',
  'help.guide.tour-3d-flyover.tip.3':
    'Když je přelet pozastavený, posunutím po výškovém profilu přesunete tečku na dané místo. „Přehrát přelet“ odtud pokračuje.',
  'help.guide.tour-map-overlays.tip.1':
    'Sjezdovky jsou mapová data, ne aktuální hlášení: neříkají nic o tom, co je v provozu nebo upravené, o sněhu ani o lavinách. Když mapu oddálíte mimo lyžařský areál, ukáže přepínač „Přibližte mapu, abyste viděli sjezdovky“.',
  'help.ctx.trip-tour-stages.bullet.4':
    'V „Výlety této cesty“ ukazuje vícedenní výlet měsíc s počtem etap. Toto tlačítko, „Zobrazit etapy“, rozbalí seznam etap se dnem, ve kterém každá je, a součty pro „Celá trasa“.',
  'help.guide.tour-multi-day.step.5':
    '„Přehled výletu“ vypisuje v části „Etapy“ všechny etapy. Kliknutím na etapu zjistíte, kde končí: její poslední zastávka se vybere a výškový profil místo označí.',
  'help.guide.tour-stages-on-days.goal': 'Zařaďte každou etapu do samostatného dne, nebo celý výlet do jednoho dne.',
  'help.guide.tour-stages-on-days.tip.2':
    '„Celá trasa v tento den“ je zašedlé u dne, ve kterém už výlet je. „Etapy od tohoto dne“ tam ale funguje a nahradí v tomto dni celý výlet.',
  'help.ctx.trip-tour-hike.bullet.3':
    'Záhlaví karty „Trasové body“ obsahuje nástroje pro trasu: „Obrátit směr“, „Zpět na start“ a u túry „Okruh od startu“. „Další akce“ u zastávky obsahují „Porovnat cesty pro další úsek“.',
  'help.guide.tour-hike-plan.step.3': 'Do pole „Název výletu“ zadejte název.',
  'help.guide.tour-hike-plan.tip.4':
    'Doba chůze se počítá podle pravidla pro turistické rozcestníky (DIN 33466) a nezahrnuje pauzy. Přidejte je do pole „Pauzy“ v „Podrobnosti“ a započítají se do plánovaného celkového času.',
  'help.guide.tour-hike-trail-details.result':
    'Víte, jakou obtížnost a jaký povrch mají jednotlivé části túry a kde na mapě leží.',
  'help.guide.tour-hike-round.step.3':
    'Klikněte na „Hledat okruhy“. V seznamu a na mapě se objeví okruh A, okruh B a další, každý ve své barvě.',
  'help.guide.tour-hike-compare-ways.goal':
    'Podívejte se, kudy jinudy by túra mohla vést mezi dvěma zastávkami, a jednu z cest vyberte.',
  'help.guide.tour-hike-compare-ways.tip.3': '„Zrušit“ kartu zavře a trasu nezmění.',
  'help.guide.tour-ferrata-add.result':
    'Túra vede po feratě po její vlastní linii z OpenStreetMap. Kliknutím na mapu pokračujte z vrcholu. Router plánuje jen cestu k feratě a cestu za ní.',
  'help.guide.tour-run-plan.step.2':
    'Vyberte „Profil“: „Běh“ pro převážně zpevněné cesty ve městě, v parcích a podél řek, „Trailový běh“ pro lesní cesty a přírodní stezky.',
  'help.guide.tour-run-plan.tip.4':
    '„Trailový běh“ používá stezky nejvýše do obtížnosti horských stezek (T2), nikdy těžší.',
  'help.guide.tour-run-ways.tip.2':
    'Přepněte „Profil“ na „Trailový běh“, pokud má trasa vést víc po přírodních stezkách, nebo na „Běh“, pokud má zůstat na pevném povrchu.',
  'help.guide.tour-walk-plan.title': 'Plánování procházky městem od zastávky k zastávce',
  'help.guide.tour-walk-plan.tip.1':
    'Kroužek kolem čísla zastávky ukazuje její důležitost: plný pro „Musíš vidět“, čárkovaný pro „Volitelné“. Malý štít označuje zastávku „Chráněná“.',
  'help.guide.tour-walk-sights.step.3':
    'Klikněte na „Hledat podél túry“. Hvězdička před názvem označuje „Top místo“, jedno z nejznámějších míst v okolí.',
  'help.guide.tour-walk-day-times.goal':
    'Zjistěte, kdy v den procházky dorazíte ke každé zastávce a která místa budou v tu dobu zavřená.',
  'help.guide.tour-walk-day-times.tip.4':
    'Dvě procházky v jednom dni: na kartě „Plán“ klikněte na úsek mezi nimi („Změnit způsob dopravy“) a zvolte „Veřejná doprava“. Hledání začne tam, kde končí první procházka, v čase jejího konce, a upozorní vás, pokud spoj přijede až po začátku druhé procházky.',
  'help.guide.tour-walk-google-import.tip.1':
    'Načte se jen trasa naplánovaná pro chůzi. Než trasu v Google Maps nasdílíte, přepněte na chůzi.',
  'help.guide.tour-walk-check-off.step.3':
    'U zastávky, kterou jste viděli, klikněte na „Označit jako navštívené“, u té, kterou vynecháte, na „Přeskočit“.',
  'help.ctx.trip-tour-bike.bullet.1':
    '„Profil“ pod „Typ túry“ určuje, pro jaký druh jízdy router plánuje: „Treking“, „Silnice“, Gravel nebo MTB. Řádek pod ním popisuje, co router hledá, a jeho změna naplánuje celou trasu znovu.',
  'help.guide.tour-bike-profile.step.3':
    'V části „Profil“ zvolte „Treking“, „Silnice“, Gravel nebo MTB. Řádek pod ním popisuje, co router s tímto profilem hledá.',
  'help.guide.tour-bike-profile.tip.4':
    '„Uložit“ zůstane zašedlé, dokud výlet nemá název a dokud nejsou vypočítané trasa a výšky.',
  'help.guide.tour-bike-surfaces.result':
    'Mapa označí úseky vybraného řádku a víte, po jakých površích trasa vede. Samotný výlet se nezmění.',
  'help.guide.tour-bike-mtb-grades.step.2':
    'Na kartě „Povrch a cesty“ najděte „Obtížnost trati (mtb:scale)“: podíl trasy od „S0, bez zvláštních obtíží“ až po „S4 a více, terén pro experty“.',
  'help.ctx.trip-tour-ski.summary':
    'Výlet typu „Lyže a zima“ na kartě „Výlety“: den na sjezdovkách, běžkařský okruh, skialpinistický výlet, sněžnice nebo zimní procházka. Jeho úseky vedou po sjezdovkách, vlecích a tratích zmapovaných v OpenStreetMap a plánuje je router sjezdovek podle vaší disciplíny a limitů; zaznamenaná lyžařská stopa se importuje i se svou disciplínou.',
  'help.guide.tour-ski-plan.step.1': 'Na kartě „Výlety“ klikněte nahoře v levém panelu na „Naplánovat nový výlet“.',
  'help.guide.tour-ski-plan.tip.3':
    'Pozdější změna disciplíny zachová vaše body a úseky naplánuje znovu s volbami, které daná disciplína používá.',
  'help.guide.tour-ski-options.step.4':
    'Použijte přepínače: „Jezdit lanovkami“, „Povolit freeride trasy“, „Podle potřeby sjet lanovkou“ a „Vyhnout se domnělým spojkám“. „Běh na lyžích“ přidává „Jen upravené stopy“ a „Jen osvětlené stopy“, „Skialpinismus“ přidává „Stoupat po okraji sjezdovky“.',
  'help.guide.tour-ski-fix-leg.step.1':
    'Úsek, který router nedokázal naplánovat, má pod svým bodem červený řádek s důvodem, například Only a lift you left out joins these points, a se sjezdovkou nebo vlekem, kterých se týká.',
  'help.guide.tour-ski-summary.title': 'Trasa lyžařského výletu po sjezdovkách',
  'help.guide.tour-ski-summary.tip.4':
    'Dole na kartě jsou uvedené lyžařské areály a datum mapových dat, podle kterých byl výlet naplánovaný.',
  'help.guide.tour-ski-pistes-layer.tip.2':
    'Pokud se sjezdovky přestanou načítat, ukáže přepínač výstražnou značku. Mapa i vaše trasa dál fungují.',
  'help.guide.tour-ski-import.step.4': 'Klikněte na „Importovat 1 výlet“.',
  'help.ctx.trip-tour-paddle.summary':
    'Výlet na kajaku, kánoi nebo SUP po řece nebo jezeře. Má uvedenou loď a typ vody, vede po vodě tam, kde má TREK data, započítává do času přenášky a zdymadla a ukazuje vítr v den pádlování i to, co je známo o překážkách na cestě.',
  'help.guide.tour-paddle-setup.goal':
    'Založte výlet na kajaku, kánoi nebo SUP a uveďte, na čem pádlujete, po jaké vodě a jak rychle.',
  'help.guide.tour-paddle-setup.tip.1':
    'Když je „Loď“ nastavená na „Ostatní“, žádná rychlost se nenavrhuje. Zadejte ji, jinak zůstane čas na vodě prázdný.',
  'help.guide.tour-paddle-water-route.step.2':
    'Pokud chcete naplánovat po vodě jeden úsek, najeďte na zastávku před ním a klikněte na „Další akce“, tři tečky.',
  'help.guide.tour-paddle-water-route.result':
    'Každý úsek vede po vodě nebo je záměrně nakreslený ručně a úsek, který TREK naplánovat nedokázal, uvádí důvod.',
  'help.guide.tour-paddle-portage.tip.1':
    'Pokud chcete úsek přece jen sjet na lodi, otevřete u bodu znovu „Další akce“ a zvolte „Tento úsek opět pádlovat“. Změní se zpět na ručně nakreslený úsek.',
  'help.guide.tour-paddle-lock.step.3': 'Kliknutím na kartu zdymadla ji otevřete.',
  'help.guide.tour-paddle-time.step.1':
    '„Odhad času“ je v levém sloupci pod trasovými body. Odznak v jeho záhlaví ukazuje celkový čas včetně pauz.',
  'help.guide.tour-paddle-time.result': 'Odhad počítá s tím, co jste zadali, a uvádí, co ještě chybí.',
  'help.guide.tour-paddle-wind.tip.2':
    'Výlet na několik dní má v záhlaví karty čip pro každý den. Kliknutím na něj zobrazíte daný den.',
  'help.guide.tour-paddle-checklist.step.3':
    'Položky jsou seřazené podle trasy: jezy, zdymadla, peřeje, místa pro spuštění lodi a pravidla vstupu z OpenStreetMap a vaše vlastní přenášky a zdymadla s označením „Vlastní“.',
  'help.guide.tour-paddle-checklist.result':
    'Každá položka na trase má rozhodnutí a bezpečnostní upozornění máte přečtené.',
  'help.guide.tour-paddle-track-marks.step.6': 'Klikněte na zdymadlo a pak na linii v místě, kde zdymadlo je.',
  'help.ctx.trip-tour-horse.bullet.1':
    'Když v editoru nastavíte „Typ túry“ na „Vyjížďka na koni“, objeví se v levém sloupci karta „Jezdecké trasy“. „Hledat ve výřezu mapy“ vypíše trasy ve viditelné části mapy.',
  'help.guide.tour-horse-plan.step.2':
    'Klikněte na pole „Typ túry“ pod „Název výletu“ a zvolte „Vyjížďka na koni“. Pod „Trasové body“ se objeví karta „Jezdecké trasy“.',
  'help.guide.tour-horse-plan.tip.2':
    'TREK u vyjížďky nepočítá žádnou dobu jízdy. Pokud chcete mít ve dni čas, zadejte ho do pole „Plánováno“ v „Podrobnosti“.',
  'help.guide.tour-horse-gap.step.3':
    'Klikněte na „Převzít úsek“. Dokud není přepínač zapnutý, zůstává tlačítko zašedlé.',
  'help.guide.tour-horse-recorded.step.1':
    'V „Výlety této cesty“ klikněte na „Přidat túru“ (+), zvolte „Importovat GPX nebo KML“ a vyberte soubor se svou vyjížďkou.',
  'help.guide.dateless-trip.title': 'Plánování cesty bez termínu',
  'help.guide.trip-reminder.step.2':
    'V části „Připomínka“ vyberte 1, 3 nebo 9 dní. Pokud chcete jinou lhůtu, klikněte na „Vlastní“ a zadejte počet dní od 1 do 30.',
  'help.guide.upcoming-reservations.title': 'Rychlý přechod na nejbližší rezervace',
  'help.guide.half-company-holiday.title': 'Označení půldenního firemního volna',
  'help.guide.edit-holiday-calendar.step.2':
    'Kliknutím na barevný čtverec vyberete novou barvu, nebo napište nový popisek a stiskněte Enter.',
  'help.guide.person-color.step.1': 'Na kartě „Osoby“ klikněte na barevnou tečku před jménem.',
  'help.guide.answer-fusion-request.title': 'Odpověď na žádost o propojení',
  'help.guide.log-for-partner.title': 'Zapisování dnů za někoho, s kým plánujete',
  'help.guide.dissolve-fusion.title': 'Ukončení společného plánování',
  'help.guide.country-places.goal':
    'Vypište místa, která TREK počítá pro danou zemi, abyste si ověřili, co jste tam dělali, nebo našli místo, které TREK přiřadil ke špatné zemi.',
  'help.guide.regions.tip.3':
    '„Přidat do seznamu přání (Bucket list)“ funguje i u regionu. Region se pak zobrazí se stejným šrafováním jako země na vašem bucket listu.',
  'help.guide.tour-activity-stats.step.2':
    'Dvěma pilulkami vlevo vyberte období a typ. „Období“ nabízí „Celkem“, „Letos“, „Posledních 12 měsíců“ a každý dřívější rok, ve kterém máte výlety; „Typ“ zúží čísla na jeden druh výletu, nebo „Všechny typy“.',
  'help.guide.tour-activity-stats.tip.3':
    'Den s uvedenými účastníky se počítá jen jim; den bez uvedených účastníků se počítá všem v cestě. Karta načítá aktuální data a potřebuje připojení k internetu.',
  'help.guide.move-to-list.goal':
    'Uspořádejte své seznamy přesouváním míst mezi nimi nebo jejich kopírováním do dalšího seznamu.',
  'help.guide.accept-list-invite.result':
    'Seznam se objeví na liště v části „Sdílené“ a otevře se se svými místy. Změny ostatních členů se zobrazují živě.',
  'help.guide.tour-collection-add-to-trip.step.1':
    'Otevřete seznam. Uložené výlety jsou v prvních řádcích, nad místy. U výletu klikněte na „Přidat do cesty“, nebo přímo na jeho řádek.',
  'help.guide.tour-collection-manage.title': 'Hledání a odebírání uložených výletů',
  'help.guide.tour-collection-manage.result': 'Výlet se ze seznamu odebere a krátká zpráva to potvrdí.',
  'help.guide.entry-draft.title': 'Uložení záznamu jako konceptu',
  'help.guide.journey-map-layers.step.1':
    'Nahoře na mapě je lišta vrstev „Plán“, „Zaznamenáno“, „Záznamy“ a „Fotky“, každá s počtem. Kliknutím vrstvu skryjete nebo zobrazíte.',
  'help.guide.journey-keep-route.step.1': 'V záhlaví dne klikněte na tlačítko Dawarich, „Převzít záznam“.',
  'help.guide.journey-day-stays.step.1':
    'Den s pobyty ke kontrole končí řádkem jako 4 pobyty z Dawarich a časovým rozmezím. Kliknutím na něj pobyty zobrazíte.',
  'help.guide.journey-take-over-day.step.1':
    'Klikněte na „Převzít den“ na konci řádku s pobyty, nebo na tlačítko seznamu v záhlaví dne, které ukazuje, kolik pobytů čeká.',
  'help.guide.journey-auto-prepare.goal':
    'Nechte si během cesty automaticky připravovat pobyty každého dne ke kontrole.',
  'help.guide.photo-location.goal': 'Umístěte záznamy na mapu, aniž byste u každého museli hledat místo.',
  'help.ctx.settings-about.bullet.1': 'Verze, kterou tento server používá, je uvedená vedle nadpisu.',
  'help.guide.readability.tip.3':
    'Čitelnost je označená jako „Experimentální“. Pokud něco nevypadá dobře, klikněte dole na kartě na „Obnovit výchozí“ a nastavení se vrátí do výchozího stavu.',
  'help.guide.web-push-device.goal': 'Dostávejte oznámení z TREK do telefonu nebo počítače, i když je TREK zavřený.',
  'help.guide.connect-airtrail.tip.2':
    'Klíč se ukládá šifrovaně a už se nikdy nezobrazí; tečky v poli znamenají, že je klíč uložený.',
  'help.guide.connect-dawarich.tip.2':
    'Pod tlačítky karta uvádí, kdy TREK naposledy kontroloval a co vaše verze Dawarich nenabízí.',
  'help.guide.tour-connect-wanderer.tip.2':
    'U instance na soukromé adrese možná bude muset správce povolit interní sítě.',
  'help.guide.tour-wanderer-watch.tip.2':
    '„Pozastaveno do“ znamená, že wanderer neodpověděl; „Token odmítnut“ znamená, že token potřebuje úspěšný test připojení, nebo je potřeba nový token.',
  'help.guide.plugin-settings.result':
    'Plugin pracuje s vaším nastavením a každá akce, kterou za vás provede, je uvedená v části „Aktivita pluginů“.',
  'help.ctx.admin-defaults.bullet.3':
    'Odkaz „obnovit“ vedle pole, které jste nastavili, vrátí výchozí hodnotu TREK. Vlastní nastavení uživatele má před těmito hodnotami vždy přednost.',
  'help.ctx.admin-settings.bullet.5':
    '„Nebezpečná zóna“: „Obnovit tajný klíč JWT“ odhlásí všechny uživatele včetně vás.',
  'help.guide.default-user-settings.step.1':
    'V části „Výchozí nastavení uživatele“ vyberte „Barevné schéma“ („Světlé“, „Tmavá“ nebo „Automatické“), „Jednotky teploty“, „Jednotky vzdálenosti“, „Formát času“, „Týden začíná“, „Zobrazovaná měna“ a zda je „Skrýt rezervační kódy“ zapnuté, nebo vypnuté. Každá volba se uloží okamžitě.',
  'help.guide.admin-passkeys.step.2':
    'Zadejte „Relying Party ID (doména)“, například trek.example.org, a „Povolené origins“, na kterých je váš TREK dostupný, a klikněte na „Uložit“. Pokud obě pole necháte prázdná, použije se APP_URL.',
  'help.guide.rotate-jwt-secret.title': 'Odhlášení všech najednou',
  'help.guide.notification-defaults.step.2':
    'Kliknutím na buňku ji přepnete na další stav: „Zapnuto“, „Vypnuto“, „Blokováno“. Popisek uvádí další stav a každé kliknutí se uloží okamžitě.',
  'help.ctx.notifications.bullet.2':
    '„Vše“ a „Nepřečtené“ nahoře přepínají mezi všemi oznámeními a jen těmi nepřečtenými. Při posouvání se načítají další.',
  'help.guide.read-notifications.step.3':
    'Klikněte na tlačítko pod oznámením, tady „Zobrazit Vacay“, a otevře se to, čeho se týká. Tím se oznámení zároveň označí jako přečtené.',
  'help.guide.filter-notifications.step.3':
    'Kliknutím na „Nepřečtené“ zobrazíte jen nepřečtená oznámení. „Vše“ zobrazí znovu všechna.',
  'help.guide.mark-notifications-read.tip.2':
    'Označení jako přečtené změní jen barvu pozadí a počet. Oznámení zůstane v seznamu, dokud ho nesmažete.',
  'help.guide.delete-notifications.result': 'Oznámení zmizí ze seznamu i ze zvonku.',
  'help.guide.notification-settings.result':
    'Nastavení je otevřené na kartě „Oznámení“, s přepínačem pro každou událost a kanál.',
  'help.guide.link-journal.goal':
    'Zobrazte jeden ze svých cestovních deníků přímo v cestě, a to lidem, které vyberete.',
  'help.guide.link-journal.tip.3':
    'Později najdete v „Nastavení cesty“ v části „Deník“ volby „Upravit přístup“, „Změnit deník“ a „Odpojit“. Odpojením se karta odebere; lidé, které jste přidali přímo v deníku, si přístup ponechají.',
  'help.guide.dawarich-stays.result':
    'Pobyt je teď místem cesty, ve zvoleném dni nebo mezi „Nezařazené“, a panel ho označí jako vyřízený.',
  'help.ctx.trip-days.bullet.7': 'Během cesty se plán otevře na dnešním dni a posune se k němu.',
  'help.guide.leave-stop-off-route.tip.2':
    '„Odebrat ze dne“ místo toho zastávku ze dne odebere; „Vynechat z trasy“ ji v plánu ponechá.',
  'help.guide.move-booking-day.goal':
    'Přesuňte dopravu nebo rezervaci na jiný den přímo z plánu, bez otevírání formuláře.',
  'help.guide.place-image-from-file.result': 'Fotka je obrázkem místa na kartě, ve sloupci míst, ve dni i na mapě.',
  'help.guide.place-own-hours.step.3':
    '„Otevírací doba“ pod nimi ukazuje týden, jeden řádek na den. Pokud TREK pro místo našel otevírací dobu, je už vyplněná; jinak nejdřív klikněte na „Přidat otevírací dobu“. Zadejte, kdy se každý den otevírá a zavírá, a u dne, kdy je zavřeno, klikněte na „Uzavřeno“.',
  'help.guide.add-accommodation.tip.5':
    'Stopy GPX a místa z výletů se jako ubytování nikdy nenabízejí, jen běžná místa cesty.',
  'help.guide.confirm-stay-booking.step.1':
    'Otevřete den příjezdu. Na kartě pobytu v části „Rezervace“ vidíte rezervaci hotelu na tuto noc se stavem „Čeká na potvrzení“ nebo „Potvrzeno“. Klikněte na toto políčko.',
  'help.guide.tour-map-lines.step.4':
    'Pokud chcete výlet z mapy odebrat, přepněte pravý sloupec na „Výlety“, najeďte na výlet a klikněte na oko, „Skrýt na mapě“. Jeho linie a špendlík z mapy zmizí a řádek zůstane v seznamu, ztlumený, s přeškrtnutým okem, „Zobrazit na mapě“, které ho zase zobrazí.',
  'help.guide.car-stops.step.1':
    'V záhlaví dne, kdy auto vyzvedáváte, klikněte na + s popiskem „Přidat ke dni“ a zvolte „Přidat dopravu“.',
  'help.guide.car-stops.tip.2': '„Posunout nahoru“ a „Posunout dolů“ se zobrazí, až má jízda aspoň dvě zastávky.',
  'help.guide.transport-details.title': 'Otevření dopravy a práce s jejími podrobnostmi',
  'help.guide.transport-details.tip.1': 'Dalším kliknutím na „Na mapě“ u jízdy se zobrazenou linií linii vypnete.',
  'help.guide.export-transports-csv.result':
    'Prohlížeč uloží soubor pojmenovaný podle cesty, například autumn-in-japan-transports.csv, s jedním řádkem za každou jízdu: Typ, Název, Stav, Začátek, Konec, Od, Do, Místo, Potvrzení a Poznámky.',
  'help.guide.group-sort-bookings.goal':
    'Uspořádejte karty nebo seznam podle stavu, dne nebo typu, v pořadí, jaké chcete.',
  'help.guide.booking-on-map.tip.1':
    '„Na mapě“ je k dispozici jen u rezervace s místem. Vyberte místo ve formuláři v části „Místo / Aktivita“ a tlačítko se objeví.',
  'help.guide.export-bookings-csv.step.2':
    'Otevřete „Možnosti zobrazení“, posuvníky za ikonami zobrazení, a v části „Seřadit podle“ vyberte řazení. Řádky ho dodrží, jeden řádek za každou rezervaci, bez sekcí.',
  'help.guide.edit-booking.tip.4':
    'Pokud jste něco změnili, zeptá se kliknutí mimo formulář nebo klávesa Escape „Zahodit změny?“. „Pokračovat v úpravách“ vás vrátí do formuláře.',
  'help.guide.arrange-packing-list.step.2':
    'V rámci seznamu přetáhnete položku nahoru nebo dolů za úchyt vlevo na řádku. Čára ve vaší barvě zvýraznění u levého okraje řádku ukazuje, kam položka dopadne.',
  'help.guide.count-packed-pieces.goal':
    'Zadejte u položky množství a označujte její kusy jako zabalené jeden po druhém.',
  'help.guide.count-packed-pieces.tip.3': 'U množství jedna se počítadlo nezobrazuje; je tam jen zaškrtávací políčko.',
  'help.guide.expense-receipts.step.2':
    'Klikněte na „Připojit“ vedle „Účtenky a faktury“ a vyberte fotku nebo PDF; můžete vybrat i víc souborů najednou. Každý soubor se vypíše pod nadpisem s košem, kterým ho odeberete.',
  'help.guide.files-sync-settings.goal':
    'Rozhodněte, jestli se dokumenty z vašeho úložiště jen importují, jen do něj exportují, nebo obojí, a co se stane, když se dokument smaže nebo změní na obou místech.',
  'help.guide.files-sync-settings.tip.2':
    'Při volbě „Zeptat se“ čeká dokument upravený na obou místech v části „Vyžaduje pozornost“ pod kartou. Klikněte na „Vyřešit“ a vyberte „Ponechat verzi z TREKu“, „Ponechat verzi poskytovatele“ nebo „Ponechat obě“.',
  'help.guide.manage-notes.goal':
    'Otevřete poznámku celou, mějte důležitou nahoře a opravte nebo odstraňte, co už neplatí.',
  'help.guide.manage-notes.tip.2':
    'Během úprav smaže červený křížek u už přiloženého souboru soubor okamžitě, ještě než kliknete na „Uložit“, a soubor se nepřesune do koše. Každý soubor poznámky najdete i na kartě „Soubory“ cesty.',
  'help.guide.note-categories.step.6':
    'Zpátky na kartě „Poznámky“ filtrují karty pilulky pod záhlavím. Kliknutím na kategorii zobrazíte jen její poznámky; „Vše“ nebo další kliknutí na stejnou pilulku zobrazí všechny.',
  'help.guide.roadtrip-reorder.tip.1':
    'Přesunutím zastávky tady ji přesunete i v denním plánu: „Dní“ ukazuje stejné pořadí.',
  'help.guide.roadtrip-overnight.step.1':
    'V „Na trase“ zaškrtněte v části „Hledá se“ „Ubytování“, nebo „Kemp“, pokud hledáte místo pro stan či obytňák, vyberte den, kdy chcete zastavit, a klikněte na „Hledat“.',
  'help.guide.roadtrip-overnight.tip.3':
    'Pokud je v „Nastavení jízdy“ v části „Čára trasy“ zapnuté „Začínat a končit každý den v ubytování“, začíná jízda dalšího dne tam, kde jste spali.',
  'help.guide.roadtrip-stop-fill.title': 'Nastavení úrovně doplnění u jedné zastávky',
  'help.guide.roadtrip-bookings.title': 'Zahrnutí letu, vlaku nebo trajektu do jízdy',
  'help.guide.roadtrip-bookings.tip.2':
    'Stůl nebo vstupenka zarezervovaná u zastávky se zobrazí jako pilulka u této zastávky; co nepatří k žádné zastávce, je v části „Také rezervováno na tento den“.',
  'help.guide.roadtrip-google-import.step.3':
    'Zkontrolujte nalezené zastávky. U každé je vidět, kde leží; zastávka označená Location unresolved se přeskočí.',
  'help.guide.roadtrip-hazards.step.1': 'V pravém sloupci otevřete „Nastavení jízdy“.',
  'help.ctx.trip-tours.summary':
    'Pravý sloupec karty „Plán“ v režimu výletů: všechny výlety cesty v jednom seznamu vedle dnů. Tady zařazujete výlety do dnů, filtrujete seznam, skrýváte linie na mapě a importujete soubory GPX nebo KML. Trasy se kreslí a mění na kartě „Výlety“.',
  'help.guide.tour-show-list.goal': 'Nahraďte sloupec míst výlety cesty, abyste je viděli a mohli vybírat vedle dnů.',
  'help.guide.tour-show-list.tip.3':
    'Když je zapnutý doplněk Výlety, stopy se v seznamu míst nikdy nezobrazují: každá importovaná stopa je výlet a je uvedená tady.',
  'help.guide.tour-add-to-day.step.5':
    'U výletu s etapami se ve stejné nabídce zobrazí další dotaz. „Etapy od tohoto dne“ zařadí etapu 1 do tohoto dne a každou další do následujícího; „Celá trasa v tento den“ zařadí celý výlet do tohoto jednoho dne.',
  'help.guide.tour-day-times.step.1':
    'Ve sloupci dnů najeďte na řádek výletu, klikněte na „Další možnosti“ (tři tečky) a zvolte „Upravit“.',
  'help.guide.tour-day-times.result':
    'Výlet se v časové ose dne zobrazí se začátkem a koncem, jako každá zastávka s časem.',
  'help.guide.tour-remove-from-day.result': 'Den už výlet neuvádí a jeho řádek v seznamu nemá odznak dne.',
  'help.guide.tour-filter-list.tip.2':
    'Sekce se zobrazí, jen když se v ní výlety liší, takže krátký seznam může nabízet jen „Stav“.',
  'help.guide.tour-hide-on-map.tip.1':
    'Skrytí platí jen pro vás a ukládá se v tomto prohlížeči pro tuto cestu: výlet, jeho dny ani barva se nemění a na mapách ostatních zůstává vidět.',
  'help.guide.tour-import-plan-tab.tip.1':
    'Stopa, která už v cestě je, je označená „Už je v cestě“ a neimportuje se podruhé.',
  'help.ctx.trip-tour-detail.bullet.4':
    'Řádek dole: „Přidat ke dni“ nebo „Odebrat ze dne“, když je otevřený den, „Navigace“ na začátek, webová stránka výletu, GPX, „Sdílet“, pokud vaše zařízení umí sdílet soubory, „Sbírka“ a „Kopírovat“.',
  'help.guide.tour-detail-read.step.5':
    'Níže následují údaje: „Vzdálenost“, „Minimální nadmořská výška“, „Maximální nadmořská výška“, „Stoupání“ a „Klesání“, pod nimi časy a výškový profil v barvě linie výletu.',
  'help.guide.tour-detail-read.result':
    'Karta výletu je otevřená vedle plánu a víte, ve kterých dnech výlet je, jak je dlouhý a strmý a odkud pochází.',
  'help.guide.tour-rename-colour.tip.2': 'Tužka a tečka fungují jen pro členy, kteří smějí upravovat místa.',
  'help.guide.tour-take-along.tip.2':
    'Pokud si v Nastavení vyberete preferovanou mapovou aplikaci, otevře ji „Navigace“ rovnou a nebude vypisovat ostatní.',
  'help.guide.tour-copy-keep.step.3':
    'Pokud si chcete výlet uložit pro další cesty, otevřete ho a dole na jeho kartě klikněte na „Sbírka“.',
  'help.guide.tour-packing-link.goal':
    'Zobrazte přímo na kartě výletu, co si na něj zabalit, ze seznamu věcí cesty nebo z některého z jeho seznamů.',
  'help.guide.tour-packing-link.tip.3':
    'Propojení vyžaduje oprávnění upravovat místa. Ostatní propojený seznam vidí, ale propojení měnit nemohou.',
  'help.guide.tour-files.tip.2': '„Nahrát“ vidí jen členové, kteří smějí měnit výlet a přidávat soubory.',
  'help.guide.tour-activity-link.step.5':
    'Stopa je teď v části „Skutečná trasa“ s vlastními hodnotami a vlastním profilem vedle plánu.',
  'help.guide.tour-activity-compare.step.2':
    '„Největší odchylka od plánu“ ukazuje největší vzdálenost mezi stopou a plánovanou linií a „Mimo plán“ ukazuje, jaká část stopy vedla mimo tuto linii.',
  'help.guide.tour-origin-check.step.1':
    'Otevřete kartu výletu a posuňte se k části „Původ“. „Zdroj“ uvádí, odkud výlet pochází: „Import GPX“ s názvem souboru, import KML nebo KMZ, nebo wanderer s adresou.',
  'help.ctx.trip-tour-planner.summary':
    'Plánovač výletů cesty: vlevo editor, vpravo všechny výlety cesty a mezi nimi mapa. Tady nakreslíte výlet bod po bodu, necháte trasu vést po skutečných cestách a silnicích, doplníte podrobnosti a uložíte ho do cesty.',
  'help.guide.tour-open-workspace.goal': 'Otevřete plánovač výletů a zjistěte, k čemu slouží jednotlivé části.',
  'help.guide.tour-open-workspace.tip.1':
    '„Sbalit“ na záložce u vnitřního okraje každého panelu panel skryje, aby měla mapa víc místa; „Plán“ a „Výlety této cesty“ panely znovu zobrazí. Přetažením okraje panelu ho rozšíříte nebo zúžíte.',
  'help.guide.tour-draw-route.step.3':
    'Zkontrolujte, že je v části „Trasové body“ zapnuté „Přidat bod“ (je to stejný přepínač jako „Přidávat body“ v pilulce mapy), a klikněte na mapu tam, kde výlet začíná.',
  'help.guide.tour-draw-route.result':
    'Očíslovaná trasa na mapě a její body v části „Trasové body“, připravené k pojmenování a uložení.',
  'help.guide.tour-type-profile.tip.2':
    'Některé typy potřebují před uložením další údaje: „Běh“ své „Plánované tempo“, „Vodácká túra“ loď a typ vody, výlet „Lyže a zima“ disciplínu.',
  'help.guide.tour-edit-points.step.5': '„Odstranit bod“, koš vedle, bod z výletu odebere.',
  'help.guide.tour-shaping-points.step.2':
    'Přetáhněte tečku na cestu, kudy má trasa vést. Trasa se přes ni znovu naplánuje.',
  'help.guide.tour-loop-reverse.goal': 'Ukončete výlet v místě startu, nebo obraťte jeho směr.',
  'help.guide.tour-leg-by-hand.title': 'Ruční nakreslení úseku, nebo jeho nové naplánování',
  'help.guide.tour-leg-by-hand.result':
    'Úsek je přímka tam, kde jste chtěli, označená jako nakreslená ručně, nebo je znovu naplánovaný routerem.',
  'help.guide.tour-trip-places.tip.2':
    'Odebráním nebo odpojením zastávky zůstane místo v cestě beze změny, včetně svých dnů.',
  'help.guide.tour-details-times.step.4':
    '„Plánováno“ ukazuje celkový čas. Pokud zadáte vlastní, nahradí vypočítaný a označí se jako „Ruční úprava“.',
  'help.guide.tour-save.step.2':
    'Počkejte, až zmizí tečka vedle „Nový výlet“. „Uložit“ potřebuje trasu a všechny její výšky.',
  'help.guide.tour-edit-saved.goal': 'Otevřete dříve naplánovaný výlet, upravte ho a znovu uložte.',
  'help.guide.tour-edit-saved.result': 'Uložený výlet teď obsahuje vaše změny.',
  'help.guide.tour-summary-profile.tip.2':
    'Trasa, která vede po feratě, dostane nad údaji výstražný odznak s její obtížností.',
  'help.guide.tour-list-manage.step.4':
    'Tlačítko nad „Rozsah cesty“ je filtr. Ukazuje stav, podle kterého filtruje, na začátku „Vše“, a počet výletů.',
  'help.guide.tour-delete.step.1':
    'Najeďte na výlet v „Výlety této cesty“ a klikněte na koš vpravo na jeho řádku, „Smazat“ s názvem výletu.',
  'help.guide.tour-saved-elsewhere.step.1':
    'Během úprav se nahoře v panelu objeví „Tato túra byla uložena jinde“. Vaše změny zůstanou zachované, dokud se nerozhodnete.',
  'help.ctx.trip-tour-import.summary':
    'Tady importujete do cesty výlety, které už existují jinde: soubor GPX, KML nebo KMZ z hodinek nebo aplikace, výlet z jiné vaší cesty, nebo trasu z vašeho vlastního wanderer. Import zůstane přesně tak, jak byl zaznamenán, a můžete z něj naplánovat upravitelnou verzi.',
  'help.guide.tour-import-gpx.step.1':
    'Otevřete kartu „Výlety“ dané cesty. Nahoře v „Výlety této cesty“ vpravo klikněte na + („Přidat túru“).',
  'help.guide.tour-import-gpx.tip.4':
    'Soubor KML nebo KMZ v části „Neimportováno“ navíc vypíše, co kromě linií obsahoval: špendlíky, oblasti a další prvky.',
  'help.guide.tour-view-import.tip.1':
    'Import nelze upravovat bod po bodu. „Naplánovat upravitelnou verzi“ na kartě „Upravitelná verze“ výše z něj vytvoří výlet, který můžete měnit.',
  'help.guide.tour-plan-from-import.step.3':
    'Kliknutím na „Nahradit import“ tento výlet přeplánujete na místě: jeho dny a poznámky zůstanou a zaznamenaná stopa se zachová, abyste ji mohli obnovit. „Naplánovat jako nový výlet“ import nezmění a vytvoří vedle něj druhý výlet.',
  'help.guide.tour-restore-recorded.goal':
    'Vraťte přeplánování importu a získejte zpět původní stopu, i po delší době.',
  'help.guide.tour-take-over.goal':
    'Použijte znovu výlet, který jste už naplánovali nebo importovali v jiné své cestě, aniž byste ho kreslili znovu.',
  'help.guide.tour-take-over.tip.2':
    'Vypisují se jen vaše ostatní cesty a jen prvních 100 výletů. Ostatní najdete hledáním nebo filtrem.',
  'help.guide.tour-import-wanderer.step.4': 'Klikněte na „Importovat do cesty“.',
  'help.ctx.trip-tour-map.bullet.1':
    'Pilulka vlevo dole na mapě nabízí podkladové mapy, které má typ otevřeného výletu k dispozici: „Mapa“, Topo, „Turistika“ u túry, „Kolo“ u cyklovýletu a „Satelit“. Volba tady platí jen pro plánovač a nikdy nezmění nastavení mapy v Nastavení.',
  'help.guide.tour-map-layers.step.2':
    'Klikněte na Topo pro vrstevnice a stínovaný reliéf, tedy mapu, která ukazuje, jak strmý je terén. Vybraná mapa zůstane v pilulce zvýrazněná.',
  'help.guide.tour-along-search.step.1':
    'Otevřete výlet na kartě „Výlety“ a v levém panelu se posuňte dolů k „Podél túry“, pod zastávky výletu. Karta se zobrazí, jakmile má výlet trasu.',
  'help.guide.tour-along-search.tip.3':
    'Výsledky pocházejí z OpenStreetMap a z indexu míst TREK, takže hledání vyžaduje připojení. Když se nic nenajde, zkusí „Rozšířit na“ další vzdálenost; když je server přetížený, ukazuje „Zkusit znovu“ odpočet, než to můžete zkusit znovu.',
  'help.guide.tour-along-add-stop.tip.1':
    'Místo se stane zastávkou výletu, ne místem cesty, takže se v seznamu míst nezobrazí.',
  'help.guide.tour-3d-terrain.step.4':
    'Posuvníkem „Reliéf“ zvětšíte kopce až na trojnásobek, což pomůže v mírném terénu.',
  'help.guide.tour-3d-flyover.step.1':
    'Přepněte výlet do 3D. Zatímco se načítá krajina podél trasy, plní se v místě tlačítka přehrávání kroužek; jakmile je plný, klikněte na „Přehrát přelet“. Kamera sleduje tečku po trase a kurzor na výškovém profilu v „Přehled výletu“ se pohybuje s ní.',
  'help.guide.tour-map-overlays.title': 'Sjezdovky nebo plavební znaky na mapě',
  'help.guide.tour-map-overlays.tip.2':
    'Přepínač sjezdovek je k dispozici i bez otevřeného výletu, takže si můžete lyžařský areál prohlédnout dřív, než začnete plánovat. U túry nabízí pilulka místo toho „Ferraty“ s počtem tras ve výřezu.',
  'help.ctx.trip-tour-stages.bullet.5':
    'Plus na řádku výletu, „Přidat ke dni“, rozvrhne etapy do cesty po jedné na den od zvoleného dne, nebo zařadí celý výlet do jednoho dne.',
  'help.guide.tour-multi-day.step.6':
    'Pokud z něj chcete zase jednodenní výlet, klikněte na „Jednodenní“ a potvrďte dotaz „Udělat z ní jednodenní túru?“ tlačítkem „Odebrat konce etap“. Trasa zůstane beze změny.',
  'help.guide.tour-stages-on-days.step.1':
    'V „Výlety této cesty“ najeďte na vícedenní výlet a klikněte na plus, „Přidat ke dni“.',
  'help.guide.tour-stages-on-days.tip.3':
    'Když vícedenní výlet přetáhnete na den na kartě „Plán“, zeptá se TREK na totéž v dialogu, stejně jako u „Přidat ke dni“ na kartě výletu.',
  'help.ctx.trip-tour-hike.bullet.4':
    '„Podrobnosti o cestě“ pod trasovými body ukazují stupeň SAC, povrch a typ cesty každého úseku z OpenStreetMap a podle nich barví trasu na mapě. Nic z toho výlet nemění.',
  'help.guide.tour-hike-plan.step.4':
    '„Přidat bod“ je zapnuté od začátku: klikněte na mapu tam, kde túra začíná a kde končí. „Místa cesty“ vedle místo toho vybere chatu nebo hotel z cesty. Od dvou bodů TREK vypočítá pěší trasu.',
  'help.guide.tour-hike-trail-details.title': 'Obtížnost, povrch a typy cest podél túry',
  'help.guide.tour-hike-trail-details.tip.1':
    'Cesty, které v OpenStreetMap nemají hodnotu, jsou uvedené pod „Neznámá“, a neznámá neznamená snadná. Pokud některé ukazují „Tentokrát nešlo zjistit“, klikněte na „Zkusit znovu“.',
  'help.guide.tour-hike-round.step.4':
    'Kliknutím okruh vyberete. Jeho řádek ukazuje vzdálenost, stoupání a čas a o kolik se liší od požadované vzdálenosti.',
  'help.guide.tour-hike-compare-ways.step.1':
    'Najeďte na zastávku, kde úsek začíná, klikněte na jejím řádku na „Další akce“ a zvolte „Porovnat cesty pro další úsek“.',
  'help.guide.tour-ferrata-add.title': 'Přidání ferraty do túry',
  'help.guide.tour-ferrata-add.tip.1':
    'Ferata vyžaduje vybavení a zkušenosti. Popisek odznaku uvádí, jakou část trasy tvoří.',
  'help.guide.tour-run-plan.step.3': 'Zadejte „Plánované tempo“ v minutách a sekundách na kilometr, například 7:30.',
  'help.guide.tour-run-ways.title': 'Po jakých cestách běh vede',
  'help.ctx.trip-tour-walk.title': 'Procházka městem',
  'help.guide.tour-walk-plan.goal':
    'Sestavte procházku po památkách ze zastávek, s délkou pobytu u každé a s tím, které jsou důležité.',
  'help.guide.tour-walk-plan.tip.2':
    'Procházka městem nemá limit obtížnosti ani pole „Pauzy“: místo nich se počítají časy pobytů.',
  'help.guide.tour-walk-sights.step.4':
    'Klikněte na místo v seznamu. Přes mapu se otevře jeho karta: v části „Kam patří“ vyberte, mezi které dvě zastávky přijde.',
  'help.guide.tour-walk-day-times.step.1':
    'Zařaďte procházku do dne: v „Výlety této cesty“ klikněte na kulaté + na jejím řádku („Přidat ke dni“) a vyberte den.',
  'help.guide.tour-walk-day-times.result':
    'Zastávky můžete přeuspořádat nebo měnit délku pobytů, dokud nebude každé místo při vašem příchodu otevřené.',
  'help.guide.tour-walk-google-import.tip.2':
    '„Použít jiný odkaz“ vás vrátí k poli pro odkaz. Načtení nahradí neuložené změny v plánovači a dialog vás na to předem upozorní.',
  'help.guide.tour-walk-check-off.step.4':
    'Nahoře v seznamu je počet navštívených zastávek a zbývající doba chůze. „Vrátit“ u zastávky zruší její označení.',
  'help.ctx.trip-tour-bike.bullet.2':
    '„Přehled výletu“ vpravo uvádí „Doba jízdy (odhad)“, tedy čas routeru pro daný profil včetně stoupání. Pauzy zahrnuté nejsou.',
  'help.guide.tour-bike-profile.step.4':
    'V části „Trasové body“ klikněte na „Místa cesty“ a vyberte start a cíl, tady Hotel Alpenroyal a pak Hotel Greif. Můžete také zkontrolovat, že je zapnuté „Přidat bod“, a klikat na mapu. Od dvou bodů TREK vypočítá trasu.',
  'help.guide.tour-bike-profile.tip.5':
    'Pokud správce povolí mapu CyclOSM, nabízí řada vrstev na mapě při otevřeném cyklovýletu také „Kolo“. Pokud se přestane načítat, přepněte na „Mapa“. Výlet se nezmění.',
  'help.guide.tour-bike-surfaces.tip.1':
    '„Není v datech“ znamená, že OpenStreetMap v daném místě žádný povrch neuvádí. Povrch je neznámý, nemusí být dobrý.',
  'help.guide.tour-bike-mtb-grades.step.3': 'Kliknutím na řádek obtížnosti zvýrazníte tyto stezky na mapě.',
  'help.ctx.trip-tour-ski.bullet.1':
    'Nejdřív se vybírá „Disciplína“ a nic není předvybrané: „Sjezd“, Snowboard, „Běh na lyžích“, „Skialpinismus“, „Sněžnice“ nebo „Zimní turistika“. „Běh na lyžích“ se navíc ptá na „Technika“: „Klasika“, „Bruslení“ nebo „Neznámá“. Bez disciplíny nelze výlet uložit.',
  'help.guide.tour-ski-plan.step.2': 'Otevřete „Typ túry“ a vyberte „Lyže a zima“.',
  'help.guide.tour-ski-plan.tip.4':
    'Kde chybí data o sjezdovkách, vede úsek jako přímka mezi svými body. U sněžnic a zimní turistiky může místo toho vést po letních stezkách, na což upozorní šedá poznámka u úseku.',
  'help.guide.tour-ski-options.step.5':
    'V části „Vynechat“ stiskněte každý druh lanovky, kterým jezdit nechcete: „Vleky“, „Otevřené sedačky“, „Kabinkové lanovky“, „Kyvadlové lanovky“ nebo „Pozemní lanovky a vlaky“. Stisknutá volba je přeškrtnutá.',
  'help.guide.tour-ski-fix-leg.step.2':
    'Klikněte na opravu, kterou řádek nabízí: „Povolit těžší sjezdovky“, „Povolit tuto lanovku“, „Sjet lanovkou“, „Změnit techniku“ nebo „Změnit disciplínu“. Volba se změní a úsek se naplánuje znovu.',
  'help.guide.tour-ski-summary.goal': 'Zjistěte, jak se den dělí na lyžování, lanovky, čekání a chůzi.',
  'help.guide.tour-ski-summary.result': 'Víte, kolik času strávíte na sjezdovkách, na lanovkách a čekáním na ně.',
  'help.guide.tour-ski-pistes-layer.tip.3':
    'Vrstva obsahuje mapová data, ne aktuální hlášení: neříká nic o tom, co je v provozu nebo upravené, o sněhu ani o lavinách. Přepínač je k dispozici i bez otevřeného výletu, takže si lyžařský areál můžete prohlédnout ještě před plánováním.',
  'help.guide.tour-ski-import.step.5':
    'Kliknutím na stopu v „Výlety této cesty“ ji otevřete. Pokud chcete později opravit její disciplínu, klikněte na „Změnit“ na její kartě „Lyžařská trasa“.',
  'help.ctx.trip-tour-paddle.bullet.1':
    'V části „Typ túry“ se „Vodácká túra“ ptá na „Loď“ („Kajak“, „Kánoe“, SUP nebo „Ostatní“) a „Voda“ („Řeka“ nebo „Jezero“). Dokud nevyberete obojí, výlet nelze uložit.',
  'help.guide.tour-paddle-setup.step.1':
    'Na kartě „Výlety“ klikněte nahoře v levém sloupci na „Naplánovat nový výlet“.',
  'help.guide.tour-paddle-setup.tip.2':
    'Mapa vodáckého výletu nabízí „Mapa“ a „Satelit“ a jako překryvnou vrstvu „Plavební znaky“ z OpenSeaMap.',
  'help.guide.tour-paddle-water-route.step.3':
    'Zvolte „Naplánovat další úsek po vodě“. TREK naplánuje úsek po řece nebo jezeře od tohoto bodu k dalšímu.',
  'help.guide.tour-paddle-portage.title': 'Přenesení lodi kolem překážky',
  'help.guide.tour-paddle-portage.tip.2':
    'U posledního bodu se „Odtud loď přenášet“ uplatní, až nastavíte další bod. Řádek ukazuje „Odsud přenášet“ a jeho křížek, „Nakonec nepřenášet“, volbu zruší.',
  'help.guide.tour-paddle-lock.step.4':
    'Zadejte minuty pro „Čekání“ a „Proplutí“. Jakmile jsou obě vyplněné, karta ukáže jejich součet.',
  'help.guide.tour-paddle-time.step.2':
    'Pruh ukazuje trasu od začátku do konce: vodu, přenášky hnědě a zdymadla jako svislé značky. Překážky na trase jsou značky, na které můžete kliknout a najít je na mapě.',
  'help.guide.tour-paddle-wind.title': 'Kontrola větru na den pádlování',
  'help.guide.tour-paddle-wind.tip.3':
    'Za větrného dne s přejezdem jezera nabídne karta „Naplánovat podél břehu“, které naplánuje jezera podél břehu.',
  'help.guide.tour-paddle-checklist.step.4':
    'Klikněte na položku. Mapa se k ní přesune: u překážky se otevře její karta s vaším rozhodnutím, u vaší vlastní přenášky nebo zdymadla se vybere jejich bod.',
  'help.guide.tour-paddle-track-marks.title': 'Označení přenášek a zdymadel na zaznamenané vodácké stopě',
  'help.guide.tour-paddle-track-marks.step.7': 'Otevřete karty, zadejte minuty a klikněte na „Uložit“.',
  'help.ctx.trip-tour-horse.bullet.2':
    'Trasa se otevře ve vlastním dialogu: vyberte úsek a „Směr“, kterým ho pojedete, zkontrolujte „Přístup pro koně“ a klikněte na „Převzít úsek“.',
  'help.guide.tour-horse-plan.step.3':
    'Na kartě „Jezdecké trasy“ klikněte na „Hledat ve výřezu mapy“. Všechny značené jezdecké trasy ve výřezu se tam vypíšou i s délkou.',
  'help.guide.tour-horse-plan.tip.3':
    'Posunuli jste po hledání mapu? Tlačítko teď ukazuje „Prohledat tento výřez“. U příliš velkého výřezu vás TREK nejdřív požádá o přiblížení.',
  'help.guide.tour-horse-gap.step.4':
    'Na kartě „Trasové body“ ukazuje spojka „Ručně, neověřeno“ a svou délku. Když na ni najedete myší, dozvíte se proč.',
  'help.guide.tour-horse-recorded.step.2':
    'Otevře se „Náhled importu“ a zatím se nic neukládá. V části „Importovat jako“ nastavte „Typ túry“ na „Vyjížďka na koni“. Tři odznaky ukazují, co import zachová a co nepočítá.',
  'help.guide.dateless-trip.goal': 'Začněte plánovat dřív, než víte, kdy pojedete.',
  'help.guide.trip-reminder.step.3': 'Klikněte na „Aktualizovat“.',
  'help.guide.upcoming-reservations.goal':
    'Podívejte se, co máte nejblíž zarezervované napříč všemi cestami, a otevřete cestu, ke které to patří.',
  'help.guide.log-day.tip.3':
    'Den označený jako celodenní firemní volno zapsat nelze. Při půldenním firemním volnu se den dovolené počítá jen jako 0,5.',
  'help.guide.half-company-holiday.goal':
    'Dejte všem volné odpoledne, třeba na Štědrý den, aniž byste zavírali celý den.',
  'help.guide.public-holidays.tip.2': 'Když v mřížce najedete myší na svátek, uvidíte jeho název.',
  'help.guide.edit-holiday-calendar.step.3':
    'Změňte zemi nebo region v jeho seznamech, nebo kalendář odeberte kliknutím na koš.',
  'help.guide.person-color.step.2': 'Vyberte barvu. Uloží se okamžitě a dialog se zavře.',
  'help.guide.answer-fusion-request.goal':
    'Rozhodněte, jestli svůj plán dovolené sloučíte s člověkem, který vás pozval.',
  'help.guide.log-for-partner.goal':
    'Zapište volný den osobě propojené s vaším plánem, například když vás o to požádá.',
  'help.guide.dissolve-fusion.goal': 'Rozdělte propojený plán zpět na samostatné plány.',
  'help.guide.country-places.step.1':
    'Vyhledejte zemi, kterou jste navštívili, a vyberte ji. V panelu dole se zobrazí její karta.',
  'help.guide.tour-activity-stats.step.3':
    'Přečtěte si čísla: vzdálenost s počtem výletů v rohu, pak „Stoupání“ a „Klesání“. U „Všechny typy“ následují tři nejčastější typy výletů, každý s počtem a vzdáleností.',
  'help.guide.move-to-list.step.1':
    'V řádku filtrů klikněte na ikonu zaškrtávacího políčka, „Vybrat“, a zaškrtněte místa.',
  'help.guide.tour-collection-add-to-trip.step.2':
    'V části „Do cesty“ vyberte cestu. Cesta, do které nesmíte přidávat výlety, je ztlumená.',
  'help.guide.tour-collection-manage.goal':
    'Zjistěte, jaké výlety seznam obsahuje a odkud pocházejí, a odeberte ty, které už nepotřebujete.',
  'help.guide.entry-draft.goal': 'Napište záznam hned a skryjte ho ve sdíleném deníku, dokud nebude hotový.',
  'help.guide.journey-map-layers.step.2':
    'Kliknutím na (i) na konci lišty zobrazíte legendu mapy: vysvětluje každý špendlík, tečku a linii.',
  'help.guide.journey-keep-route.step.2':
    'Zkontrolujte „Časové pásmo dne“, podle kterého se určuje začátek a konec dne, a projděte záznam: vzdálenost, časové rozmezí, části a mezery.',
  'help.guide.journey-day-stays.step.2':
    'U pobytu klikněte na „Napsat záznam do deníku“. Záznam se přidá k danému dni v čase příjezdu, s názvem a polohou pobytu.',
  'help.guide.journey-take-over-day.step.2':
    'Zaškrtněte pobyty, které chcete zachovat, a opravte jejich názvy. „Spojit do jednoho záznamu“ mezi dvěma zaškrtnutými pobyty je sloučí, „Ponechat zvlášť“ je zase rozdělí.',
  'help.guide.journey-auto-prepare.step.1':
    'Kliknutím na ⋯ vpravo nahoře v záhlaví otevřete „Nastavení cestovního deníku“.',
  'help.guide.photo-location.step.1': 'Kliknutím na ⋯ vpravo nahoře v záhlaví otevřete „Nastavení cestovního deníku“.',
  'help.guide.share-public.tip.3':
    'Koncepty se v odkazu nikdy nezobrazí a zaznamenané trasy jsou vidět jen ve dnech se zveřejněným záznamem.',
  'help.ctx.settings-plugins.title': 'Pluginy',
  'help.ctx.settings-about.bullet.2':
    '„Nahlásit chybu“ a „Navrhnout funkci“ otevřou projekt na GitHubu; Wiki otevře dokumentaci.',
  'help.guide.map-provider.tip.3':
    'Na mapě GL ji tažením pravým tlačítkem otáčíte a nakláníte; kliknutím prostředním tlačítkem přidáte místo.',
  'help.guide.web-push-device.step.1':
    'V části „Push notifikace na tomto zařízení“ klikněte na „Zapnout pro toto zařízení“ a povolte oznámení, až se prohlížeč zeptá. „Odeslat test“ ověří, že oznámení dorazí.',
  'help.guide.connect-airtrail.title': 'Připojení vlastního AirTrail',
  'help.guide.connect-dawarich.title': 'Připojení vlastního Dawarich',
  'help.guide.tour-connect-wanderer.title': 'Připojení vlastního wanderer',
  'help.guide.tour-connect-wanderer.tip.3': '„Odpojit“ vpravo token zase odstraní.',
  'help.guide.tour-wanderer-watch.tip.3':
    'Kanály pro tato upozornění vyberete v části „Oznámení“ v řádku „wanderer: upozornění k vašim trasám“.',
  'help.guide.plugin-settings.tip.1': 'Toto nastavení je jen vaše; ostatní členové si plugin nastavují sami.',
  'help.guide.offline-conflicts.step.3':
    'Změny, které server opakovaně odmítá, se zobrazí v „Offline mezipaměť“ jako „Neúspěšné změny“: „Zkusit znovu“ je odešle ještě jednou, „Zahodit“ ponechá verzi ze serveru.',
  'help.ctx.admin-notifications.bullet.4':
    '„Výchozí nastavení pro uživatele“ dole: pro každou událost a kanál „Zapnuto“, „Vypnuto“ nebo „Blokováno“ pro všechny, kdo nastavení nezměnili.',
  'help.guide.default-user-settings.step.2':
    'Pole, které nastavíte, dostane vedle názvu odkaz „obnovit“; ten vrátí výchozí hodnotu TREK.',
  'help.guide.own-routing-engine.title': 'Vlastní servery pro plánování tras',
  'help.guide.admin-passkeys.result':
    'Přihlašovací stránka nabízí „Přihlásit se pomocí přístupového klíče“ a lidé si mohou přidávat přístupové klíče ve svém nastavení.',
  'help.guide.rotate-jwt-secret.goal': 'Ukončete všechny relace při podezření na únik.',
  'help.guide.notification-defaults.result':
    'Všichni, kdo buňku nezměnili, začínají s vaší volbou a blokované buňky se jim v nastavení zobrazují jako zamčené.',
  'help.ctx.notifications.bullet.3':
    'Každé oznámení uvádí, kdo co a kde udělal. Nepřečtená mají podbarvené pozadí. Tlačítko pod oznámením, například „Zobrazit výlet“ nebo „Zobrazit Vacay“, vás tam přenese a oznámení označí jako přečtené.',
  'help.guide.read-notifications.tip.1':
    'Zvonek je na každé obrazovce s navigační lištou a jeho číslo se při novém oznámení samo aktualizuje.',
  'help.guide.filter-notifications.tip.1':
    'Stránka při posouvání dolů načítá starší oznámení, takže za první obrazovkou nic nechybí.',
  'help.guide.mark-notifications-read.result':
    'Žádné oznámení už nemá podbarvené pozadí a červené číslo u zvonku zmizelo.',
  'help.guide.notification-settings.title': 'Na co vás má TREK upozorňovat',
  'help.guide.link-journal.step.1': 'Vedle názvu cesty klikněte na „Nastavení cesty“ a vlevo vyberte „Deník“.',
  'help.guide.dawarich-stays.tip.1':
    'Dokud nekliknete na „Přidat místo“, do cesty se nic nepřidá. Místo přidané z pobytu to uvádí ve svých podrobnostech: „Přidáno z vašich záznamů Dawarich“.',
  'help.guide.leave-stop-off-route.title': 'Vynechání zastávky z trasy',
  'help.guide.move-booking-day.step.1':
    'Najeďte myší na řádek rezervace ve dni: úchyt vlevo ukazuje, že ji můžete přetáhnout.',
  'help.guide.place-image-from-file.tip.1': 'Nabízejí se jen soubory JPG, PNG, GIF a WebP; jízdenka v PDF ne.',
  'help.guide.place-own-hours.step.4':
    'Tlačítka vpravo od „Otevírací doba“: tlačítkem kopírování nastavíte všem dnům pondělní hodiny a křížkem své hodiny zase odeberete. Pokud TREK našel vlastní otevírací dobu, vrátí ji „Převzít z podrobností místa“.',
  'help.guide.confirm-stay-booking.step.2':
    'Rezervace se otevře přes plán. První pilulka v jejím záhlaví ukazuje její stav.',
  'help.ctx.trip-map.bullet.9':
    'Každý výlet cesty je linie ve své barvě se špendlíkem v místě, kde začíná. Kliknutím na linii otevřete kartu výletu. V den s výletem vede trasa dne na začátek výletu a pokračuje z místa, kde končí. Oko vedle výletu v seznamu výletů, „Skrýt na mapě“, odebere jeho linii z vaší mapy.',
  'help.guide.tour-map-lines.result':
    'Výlety, které chcete vidět, jsou na mapě, každý ve své barvě, a ten, který jste skryli, je v seznamu výletů ztlumený.',
  'help.guide.car-stops.step.2':
    'Klikněte na pilulku typu v záhlaví a zvolte „Auto“. Formulář se změní: z „Datum“ a „Čas začátku“ se stane „Vyzvednutí“ a „Čas vyzvednutí“, z „Datum konce“ a „Čas konce“ se stane „Vrácení“ a „Čas vrácení“ a pod „Od“ a „Do“ se objeví „Zastávky po cestě“.',
  'help.guide.transport-details.goal':
    'Prohlédněte si všechny údaje o jízdě na jednom místě, zkopírujte rezervační kód, přejmenujte ji nebo ji najděte na mapě.',
  'help.guide.transport-details.tip.2':
    'Klávesou Escape nebo kliknutím mimo podrobnosti je zavřete. Pokud je otevřené přejmenování nebo dotaz na smazání, zavře se nejdřív to.',
  'help.guide.export-transports-csv.tip.1': 'Ikona je na liště, jen když karta obsahuje aspoň jednu jízdu.',
  'help.guide.group-sort-bookings.step.1':
    'V zobrazení „Karty“ nebo „Seznam“ klikněte na „Možnosti zobrazení“, posuvníky za třemi ikonami zobrazení.',
  'help.guide.create-booking.tip.4':
    'Offline se rezervace uloží v tomto zařízení a synchronizuje se, až budete znovu online. Nové soubory vyžadují připojení, takže je odeberte nebo uložte později. Pokud omylem kliknete mimo formulář nebo stisknete Escape, zeptá se TREK „Zahodit změny?“ dřív, než o napsané přijdete.',
  'help.guide.booking-on-map.tip.2': 'Pobyt se otevře na své první noci.',
  'help.guide.export-bookings-csv.step.3':
    'Klikněte na „Exportovat jako tabulku (CSV)“, ikonu tabulky za „Možnosti zobrazení“.',
  'help.guide.arrange-packing-list.step.3':
    '„A až Z“ úplně vpravo v řádku se „Sdílené“ a „Můj seznam“ seřadí položky každého seznamu podle názvu, takže rychle zjistíte, jestli už na něm něco je. Dalším kliknutím se vrátíte k vlastnímu pořadí.',
  'help.guide.count-packed-pieces.step.1':
    'Klikněte v řádku na odznak s množstvím, malé číslo s x za ním, zadejte, kolik kusů berete, například 5, a stiskněte Enter.',
  'help.guide.expense-receipts.step.3':
    'Dole v dialogu klikněte na „Uložit“. Soubory se nahrají spolu s výdajem a objeví se i v souborech cesty.',
  'help.guide.files-sync-settings.step.1':
    'Klikněte na „Synchronizace dokumentů“ na pravém konci lišty. Pokud je cesta propojená, otevře se vpravo karta vašeho úložiště; pokud máte víc úložišť, klikněte vlevo v části „Tato cesta“ na to, které chcete.',
  'help.guide.files-sync-settings.tip.3':
    '„Okamžité aktualizace“, odkaz s tlačítkem „Kopírovat“ vedle, se zobrazuje jen u úložišť, kde se TREK nemůže automaticky přihlásit k odběru změn. Vložte odkaz do úložiště a změny budou chodit okamžitě, ne až při další kontrole.',
  'help.guide.manage-notes.step.1':
    'Klikněte na tři tečky v záhlaví karty poznámky („Další možnosti“). Nabídka obsahuje „Rozbalit“, „Připnout“, „Upravit“ a „Smazat“.',
  'help.guide.note-categories.title': 'Třídění poznámek do kategorií',
  'help.guide.note-categories.result':
    'Poznámky mají nové názvy a barvy a karta „Poznámky“ ukazuje jen vybranou kategorii.',
  'help.guide.roadtrip-stops.tip.5':
    'Zastávka s časem konce v denním plánu trvá do tohoto času. Její dialog uvádí, kdy jízda pokračuje, a „Odebrat čas konce“ vám umožní nastavit délku zase sami.',
  'help.guide.roadtrip-reorder.tip.2':
    'Zarezervované spoje a jejich terminály zůstávají tam, kam je umístila rezervace; přetahovat lze jen místa.',
  'help.guide.roadtrip-overnight.step.2':
    'Hotel má místo plusu ikonu postele. Kliknutím na ni, „Přidat jako nocleh“, otevřete „Přidat jako zastávku“ pro noc. Kemp má obvyklé „Přidat“.',
  'help.guide.roadtrip-stop-fill.goal':
    'Nastavte jedné zastávce s tankováním nebo nabíjením vlastní úroveň doplnění, například 80 % u rychlonabíječky nebo 100 % přes noc.',
  'help.guide.roadtrip-bookings.goal': 'Zjistěte, kde se zarezervovaný spoj v jízdě nachází a kdy tam musíte dorazit.',
  'help.guide.roadtrip-bookings.tip.3':
    'Spoj, který není v žádném dni cesty, do jízdy nepatří: poznámka nahoře na liště ho uvede s tlačítkem „Otevřít rezervaci“, kde mu zadáte datum.',
  'help.guide.roadtrip-google-import.step.4':
    'V části „Den“ vyberte den, do kterého zastávky patří, a klikněte na „Importovat“.',
  'help.guide.roadtrip-hazards.step.2':
    'V části „Aktuální výstrahy“ dole v pravém sloupci dialogu zapněte „Zobrazit nebezpečné oblasti“ a pak klikněte na „Uzavřít“.',
  'help.ctx.trip-tours.bullet.1':
    'Přepínač „Místa“ a „Výlety“ nahoře v pravém sloupci nahradí seznam míst výlety. Je k dispozici, jen když je zapnutý doplněk Výlety, a výlety se pak v seznamu míst nikdy nezobrazují.',
  'help.guide.tour-show-list.step.1':
    'Na kartě „Plán“ klikněte v přepínači nahoře v pravém sloupci na „Výlety“. Sloupec teď místo míst vypisuje výlety.',
  'help.guide.tour-show-list.result':
    'Pravý sloupec vypisuje výlety cesty a ten, na který jste klikli, je otevřený ve své kartě.',
  'help.guide.tour-add-to-day.tip.1':
    'Když na den přetáhnete výlet s etapami, zeptá se TREK na totéž v malém dialogu. „Zrušit“ ponechá plán beze změny.',
  'help.guide.tour-day-times.step.2':
    'Nastavte „Začátek“ a pole „Do“ nechte prázdné. Řádek pod poli ukazuje konec, který TREK vypočítá: začátek plus čas výletu.',
  'help.guide.tour-remove-from-day.title': 'Odebrání výletu ze dne',
  'help.guide.tour-filter-list.title': 'Filtrování seznamu výletů',
  'help.guide.tour-filter-list.tip.3':
    'Pokud nezbude nic, zobrazí seznam No tour matches these filters a „Zrušit filtry“ je všechny vymaže. Filtry mění jen to, co seznam zobrazuje, nikdy výlet ani den.',
  'help.guide.tour-hide-on-map.tip.2':
    'Mapa v telefonu ukazuje vždy všechny výlety a karta „Výlety“ oko nemá: skrývání funguje tady, na kartě „Plán“.',
  'help.guide.tour-import-plan-tab.tip.2':
    'Import tady zůstane v seznamu a v plánovači se neotevře. Zařaďte ho do dne kulatým +, nebo otevřete kartu „Výlety“ a prohlédněte si ho tam.',
  'help.ctx.trip-tour-detail.bullet.5':
    'Karta slouží ke čtení a k věcem, které k výletu patří. Samotnou trasu změníte na kartě „Výlety“: otevřete ji a klikněte na výlet v části „Výlety této cesty“. Tam se výlet také maže, ne tady.',
  'help.guide.tour-detail-read.step.6':
    'Posuňte se dál k „Popis“ a „Poznámky“ a pak k „Původ“: „naplánováno v TREK“, soubor, ze kterého byl výlet importován, nebo trasa z wanderer, ze které pochází, i s datem.',
  'help.guide.tour-rename-colour.title': 'Přejmenování výletu a změna jeho barvy',
  'help.guide.tour-rename-colour.result':
    'Výlet má v celé cestě nový název a jeho linie má barvu, kterou jste vybrali.',
  'help.guide.tour-take-along.tip.3':
    'Soubor se stahuje ze serveru, takže potřebuje připojení. Výlet vytvořený offline můžete stáhnout, jakmile se synchronizuje.',
  'help.guide.tour-copy-keep.step.4':
    'V části „Sbírka“ vyberte seznam, zkontrolujte „Název ve sbírce“ a klikněte na „Uložit“.',
  'help.guide.tour-packing-link.step.1':
    'Otevřete kartu výletu a posuňte se k části „Seznam věcí“. Klikněte na „Propojit seznam věcí“.',
  'help.guide.tour-packing-link.result':
    'Jste na seznamu věcí na kartě „Seznamy“ a karta výletu ukazuje každou položku, kterou zaškrtnete.',
  'help.guide.tour-files.result': 'Soubory jsou přiložené k výletu a otevřete je z jeho karty.',
  'help.guide.tour-activity-link.tip.1':
    'Plán zůstane beze změny. Stopa je jen propojená a „Odpojit“ propojení zase zruší.',
  'help.guide.tour-activity-compare.step.3':
    'Kliknutím na „Porovnat na mapě“ zobrazíte skutečnou stopu tečkovaně vedle plánu. „Ukončit porovnání“ ji zase skryje.',
  'help.guide.tour-origin-check.step.2':
    '„Importováno“ ukazuje den importu. „Zde“ ukazuje aktuální stav: „Jak bylo importováno“, „Upraveno v TREK“ nebo „Přeplánováno, zaznamenaná stopa zachována“.',
  'help.ctx.trip-tour-planner.bullet.1':
    'Když je zapnutý doplněk Výlety, jsou „Výlety“ na liště karet cesty hned za „Plán“. Karta je k dispozici na počítači a tabletu; v telefonu se výlety prohlížejí a zařazují do dnů z karty „Plán“, ale nekreslí se.',
  'help.guide.tour-open-workspace.step.1':
    'Na liště karet cesty klikněte na „Výlety“, hned za „Plán“. Mapa vyplní obrazovku a po stranách jsou panely.',
  'help.guide.tour-open-workspace.tip.2':
    'Přetáhněte soubory GPX, KML nebo KMZ kamkoli na tuto kartu a importují se jako výlety cesty.',
  'help.guide.tour-draw-route.step.4': 'Dole na mapě se objeví „Bod přidán“. „Vrátit zpět“ vedle bod zase odebere.',
  'help.guide.tour-type-profile.title': 'Výběr typu výletu',
  'help.guide.tour-type-profile.result': 'Trasa výletu je naplánovaná pro zvolený typ a profil.',
  'help.guide.tour-edit-points.step.6':
    '„Vrátit úpravu bodu“ a „Zopakovat úpravu bodu“ v záhlaví panelu vrátí nebo zopakují každou změnu, jednu po druhé.',
  'help.guide.tour-shaping-points.step.3':
    'V části „Trasové body“ je uvedený s odznakem „Tvarový bod“ a bez čísla, takže zastávky si ponechají svá čísla.',
  'help.guide.tour-loop-reverse.step.1':
    'V záhlaví karty „Trasové body“ klikněte na „Zpět na start“. Výlet dostane poslední úsek zpátky k prvnímu bodu.',
  'help.guide.tour-leg-by-hand.goal':
    'Spojte dva body přímkou tam, kde router nenajde cestu, nebo úsek naplánujte znovu.',
  'help.guide.tour-trip-places.title': 'Místo z cesty jako zastávka',
  'help.guide.tour-trip-places.tip.3': 'Ostatní výlety cesty se jako zastávka nikdy nenabízejí.',
  'help.guide.tour-details-times.tip.1': 'Čas můžete zadat jako 2:56, 2 h 56 nebo 176 minut.',
  'help.guide.tour-save.step.3':
    'Dole v levém panelu klikněte na „Uložit“. Zobrazí se „Výlet uložen“ a nadpis panelu se změní na „Upravit výlet“.',
  'help.guide.tour-edit-saved.step.1':
    'Klikněte na výlet v „Výlety této cesty“. Otevře se v levém panelu jako „Upravit výlet“ a mapa ukáže jeho trasu.',
  'help.guide.tour-summary-profile.title': 'Přehled výletu a výškový profil',
  'help.guide.tour-summary-profile.tip.3':
    'Vodácký výlet výšky neukazuje, protože na vodě by byly k dispozici jen výšky břehů.',
  'help.guide.tour-list-manage.step.5':
    'Vyberte „Nezařazené“ pro výlety, které zatím nejsou v žádném dni, nebo seznam zužte podle „Zdroj“, „Limit trasy“ nebo „Typ“. U každého řádku vidíte, kolik výletů odpovídá, a součty se řídí filtrem.',
  'help.guide.tour-delete.step.2':
    'Přečtěte si, co se s ním smaže: trasa, upravitelné trasové body a zařazení do dnů. Klikněte na „Smazat natrvalo“.',
  'help.guide.tour-saved-elsewhere.step.2': '„Načíst novější“ po potvrzení nahradí vaše změny novější verzí.',
  'help.ctx.trip-tour-import.bullet.1':
    '+ nahoře v „Výlety této cesty“ je „Přidat túru“. Nabízí „Importovat GPX nebo KML“, „Importovat procházku z Google Maps“ a „Převzít túru z jiné cesty“. Soubory můžete také přetáhnout kamkoli na kartu „Výlety“.',
  'help.guide.tour-import-gpx.step.2':
    'Zvolte „Importovat GPX nebo KML“ a vyberte jeden nebo více souborů .gpx, .kml nebo .kmz, každý nejvýše 10 MB.',
  'help.guide.tour-import-gpx.tip.5':
    'U souboru bez výšek se zobrazí „V souboru nejsou výšky“. Linie i vzdálenost jsou správně, ale stoupání a klesání zůstanou neznámé.',
  'help.guide.tour-view-import.tip.2':
    'Ikonou stažení v záhlaví ho znovu uložíte jako soubor GPX a záložkou ho uložíte do sbírky.',
  'help.guide.tour-plan-from-import.step.4':
    'Výlet se otevře v editoru se svými trasovými body. Případně ho upravte a dole ve sloupci klikněte na „Uložit“.',
  'help.guide.tour-restore-recorded.step.1':
    'V „Výlety této cesty“ klikněte na přeplánovaný výlet. Karta „Zaznamenaná stopa“ v editoru uvádí, že původní zaznamenaná stopa je zachovaná.',
  'help.guide.tour-take-over.step.1':
    'Otevřete kartu „Výlety“ cesty, do které má výlet patřit. Nahoře v „Výlety této cesty“ klikněte na + („Přidat túru“).',
  'help.guide.tour-take-over.tip.3':
    'Převzetí túry potřebuje připojení. Pokud má editor neuložené změny, kopie se do seznamu přesto přidá, ale neotevře se, takže vaše rozpracovaná práce zůstane otevřená.',
  'help.guide.tour-import-wanderer.tip.1':
    'Tlačítko se objeví, jakmile je wanderer připojený v Nastavení, Integrace. Do té doby seznam nabízí „Připojit v nastavení“.',
  'help.ctx.trip-tour-map.bullet.2':
    'Za oddělovačem v pilulce následují přepínače podle typu výletu: „Přidávat body“ při úpravě výletu, „Ferraty“ u túry, „Plavební znaky“ u vodáckého výletu a sjezdovky u lyžařského výletu. 3D na konci zobrazí výlet na trojrozměrné krajině.',
  'help.guide.tour-map-layers.step.3':
    'U túry klikněte na „Turistika“ pro značené stezky a jejich čísla; cyklovýlet místo toho nabízí „Kolo“ pro cyklotrasy. „Satelit“ zobrazí letecké snímky a „Mapa“ vás vrátí ke standardní mapě.',
  'help.guide.tour-along-search.step.2':
    'Klikněte na „Co hledat“ a zaškrtněte druhy míst, které chcete, najednou až šest: „Vyhlídky“, „Vrcholy“, „Chaty a přístřešky“, „Pitná voda“, „Jídlo“ a další. Seznam nabízí to, co se hodí k typu výletu, a nový výlet má tři z nich předem zaškrtnuté.',
  'help.guide.tour-along-add-stop.title': 'Přidání místa podél výletu jako zastávky',
  'help.guide.tour-along-add-stop.tip.2':
    'Místo, které se stane novým cílem, je označené „Prodlouží túru“: původní konec už není koncem a výlet pokračuje k tomuto místu.',
  'help.guide.tour-3d-terrain.step.5':
    'Dalším kliknutím na 3D se vrátíte k ploché mapě a můžete pokračovat v plánování.',
  'help.guide.tour-3d-flyover.step.2':
    'V části „Rychlost“ vyberte 1×, 2× nebo 4×. Při 1× trvá přelet většiny výletů od začátku do konce asi 45 sekund.',
  'help.guide.tour-map-overlays.goal':
    'Zobrazte si na mapě lyžařské sjezdovky a vleky, nebo bóje a přístavní značky, když plánujete lyžařský nebo vodácký výlet.',
  'help.guide.tour-map-overlays.tip.3':
    'Když se vrstva přestane načítat, ukáže její přepínač ! a vysvětlení; mapa i vaše trasa fungují i bez ní.',
  'help.guide.tour-multi-day.title': 'Plánování výletu na několik dní',
  'help.guide.tour-multi-day.tip.1':
    '„Ukončit etapu zde“ funguje i u jednodenního výletu: výlet se pak automaticky stane vícedenním. Etapu nemůže ukončit první ani poslední zastávka ani tvarový bod.',
  'help.guide.tour-stages-on-days.step.2': 'Vyberte den, kdy vyrazíte na první etapu.',
  'help.guide.tour-stages-on-days.tip.4':
    'V denním plánu se každá etapa zobrazí jako „Etapa N“ s vlastní vzdáleností a časem. „Vrátit zpět“ nad dny na kartě „Plán“ vrátí celé rozvržení jedním krokem.',
  'help.ctx.trip-tour-hike.bullet.5':
    'U túry ukáže „Ferraty“ v řadě mapových tlačítek vlevo dole ferraty v okolí. Na kartě ferraty ji přidáte do trasy jako samostatný úsek.',
  'help.guide.tour-hike-plan.step.5':
    'V části „Podrobnosti“ otevřete „Maximální obtížnost stezky“ a vyberte, jak náročné smějí stezky být, od T1 („Turistika“) po T6 („Obtížná vysokohorská turistika“). Trasa se v těchto mezích naplánuje znovu.',
  'help.guide.tour-hike-trail-details.goal':
    'Zjistěte, co OpenStreetMap eviduje o cestách na trase túry, a najděte tyto úseky na mapě.',
  'help.guide.tour-hike-trail-details.tip.2': 'Obtížnost vyšší než limit túry má ve svém řádku odznak „Nad limitem“.',
  'help.guide.tour-hike-round.step.5':
    'Klikněte na „Vzít tento okruh“ a pak na „Nahradit“, až se TREK zeptá, jestli má nahradit naplánovanou trasu.',
  'help.guide.tour-hike-compare-ways.step.2':
    'Přes mapu se otevře „Jiné cesty pro tento úsek“ s „Aktuální cesta“ a cestami A, B a dalšími. Každá je na mapě ve své barvě a po najetí na řádek se jeho linie zvýrazní.',
  'help.guide.tour-ferrata-add.goal': 'Najděte ferraty v okolí své túry a zařaďte jednu z nich do trasy.',
  'help.guide.tour-ferrata-add.tip.2':
    'Ferraty se nabízejí jen u túr. Ferata, po které už trasa vede, má na své kartě místo „Přidat do túry“ nápis „Součást túry“.',
  'help.guide.tour-run-plan.step.4':
    'Zadejte start a cíl na mapě, nebo je vyberte přes „Místa cesty“. Pod tempem vidíte dobu běhu: vzdálenost krát tempo.',
  'help.guide.tour-run-ways.goal':
    'Zjistěte, jaká část běhu vede po nezpevněném povrchu a jak náročné jsou jeho stezky.',
  'help.ctx.trip-tour-walk.summary':
    'Pěší výlet od zastávky k zastávce, naplánovaný na kartě „Výlety“: jak dlouho u každé zastávky zůstanete, které jsou důležité, pamětihodnosti po cestě a kdy v den procházky ke každé dorazíte, ověřené podle otevírací doby.',
  'help.guide.tour-walk-plan.step.1':
    'Nahoře v levém sloupci klikněte na „Naplánovat nový výlet“, pak otevřete „Typ túry“ a zvolte „Procházka městem / po památkách“.',
  'help.guide.tour-walk-plan.tip.3':
    '„Odpojit od místa“ v „Další akce“ u zastávky zruší jen propojení s místem cesty. Samotné místo v cestě zůstane.',
  'help.guide.tour-walk-sights.step.5':
    'Klikněte na „Přidat jako zastávku“. Oznámení ukáže, o kolik se procházka prodlouží, a vedle nabídne „Vrátit zpět“.',
  'help.guide.tour-walk-day-times.step.2':
    'Nastavte jí v tomto dni čas začátku: na kartě „Plán“ klikněte na procházku ve dni pravým tlačítkem, zvolte „Upravit“ a zadejte „Začátek“.',
  'help.guide.tour-walk-google-import.title': 'Procházka městem z pěší trasy v Google Maps',
  'help.guide.tour-walk-google-import.tip.3':
    'Převezmou se jen zastávky, ne linie nakreslená v Google Maps. Krátký odkaz maps.app.goo.gl potřebuje k otevření připojení.',
  'help.guide.tour-walk-check-off.tip.1':
    'Označení se ukládá pro každý den zvlášť: otevřete procházku z jejího dne v plánu, ne ze seznamu výletů.',
  'help.ctx.trip-tour-bike.bullet.3':
    'Karta „Povrch a cesty“ pod „Trasové body“ ukazuje, po čem trasa vede: povrchy, druhy cest a podíl, o kterém je známo, že je nezpevněný. Kliknutím na řádek zvýrazníte jeho úseky na mapě.',
  'help.guide.tour-bike-profile.step.5':
    'V „Přehled výletu“ vpravo najděte „Doba jízdy (odhad)“. Když najedete myší na informační tečku u ní, uvidíte, jak se počítá.',
  'help.guide.tour-bike-surfaces.title': 'Povrchy na trase cyklovýletu',
  'help.guide.tour-bike-surfaces.tip.2':
    'U profilu „Silnice“ upozorní varování nad sloupci, jak dlouhá část trasy je prokazatelně nezpevněná. „Zobrazit na mapě“ tyto úseky označí.',
  'help.guide.tour-bike-mtb-grades.result':
    'Mapa označí stezky vybrané obtížnosti a víte, které úseky výletu jsou náročné.',
  'help.ctx.trip-tour-ski.bullet.2':
    'Pod disciplínou jsou volby routeru sjezdovek, jen ty, které vaše disciplína používá: „Nejtěžší sjezdovky“, „Upřednostnit“, „Tempo“, přepínače jako „Jezdit lanovkami“ a „Vynechat“ pro druhy lanovek, kterými jezdit nechcete. Každá změna výlet naplánuje znovu.',
  'help.guide.tour-ski-plan.step.3':
    'V části „Disciplína“ vyberte, co budete dělat: „Sjezd“, Snowboard, „Běh na lyžích“, „Skialpinismus“, „Sněžnice“ nebo „Zimní turistika“. Nic není předvybrané a bez disciplíny nelze výlet uložit.',
  'help.guide.tour-ski-plan.result':
    'Uložený výlet „Lyže a zima“ v „Výlety této cesty“, jehož úseky vedou po zmapovaných sjezdovkách, vlecích a tratích a jehož čas je vypočítaný v „Přehled výletu“.',
  'help.guide.tour-ski-options.tip.1': 'Každá změna výlet naplánuje znovu, úsek po úseku.',
  'help.guide.tour-ski-fix-leg.step.3':
    'Pokud vám žádná oprava nevyhovuje, klikněte na „Nakreslit rovně“. Úsek se změní na přímku mezi svými dvěma body.',
  'help.guide.tour-ski-summary.step.1':
    'Pod trasovými body najděte kartu „Trasa po sjezdovkách“. Kliknutím na její nadpis ji sbalíte nebo znovu rozbalíte.',
  'help.guide.tour-ski-pistes-layer.title': 'Sjezdovky na mapě',
  'help.guide.tour-ski-pistes-layer.result': 'Sjezdovky jsou zobrazené pod výletem a můžete číst jejich barvy.',
  'help.guide.tour-ski-import.step.6':
    'V „Zařadit lyžařskou trasu“ vyberte správnou disciplínu nebo techniku a klikněte na „Uložit“.',
  'help.ctx.trip-tour-paddle.bullet.2':
    'Každý bod má svou roli jako odznak: „Nástup“, „Výstup“, „Opětovný nástup“ nebo „Konečný výstup“. Pod bodem vidíte, co po něm následuje: ručně nakreslený úsek, přenášku, zdymadlo, nebo proč úsek nešlo naplánovat.',
  'help.guide.tour-paddle-setup.step.2':
    'Otevřete „Typ túry“ a vyberte „Vodácká túra“, „Na vodě, na kajaku, kánoi nebo SUP“.',
  'help.guide.tour-paddle-setup.tip.3':
    '„Podél túry“ hledá u vodáckého výletu nejdřív „Nástupní místa“, „Půjčovna lodí“ a „Pitná voda“.',
  'help.guide.tour-paddle-water-route.step.4':
    'Úsek, který TREK nedokázal naplánovat, zčervená a uvede důvod, například že pro oblast zatím nejsou data o vodě. Kliknutím na „Nakreslit rovně“ ho zatím nakreslíte ručně.',
  'help.guide.tour-paddle-portage.goal':
    'Označte úsek, kde loď přenášíte, aby se počítal jako souš i s časem na vystoupení a opětovné nastoupení.',
  'help.guide.tour-paddle-portage.tip.3':
    'Přenášení se počítá rychlostí 2 km/h, dokud na kartě „Odhad času“ nenastavíte vlastní „Rychlost přenášení“.',
  'help.guide.tour-paddle-lock.tip.1':
    'TREK nezná provozní doby zdymadel. Časy jsou jen to, co zadáte, takže si provozní dobu zdymadla ověřte sami.',
  'help.guide.tour-paddle-time.step.3':
    'Řádek „Voda“ je vzdálenost na vodě při vaší rychlosti pádlování. Rychlost změníte v poli „Rychlost pádlování“ nahoře ve sloupci.',
  'help.guide.tour-paddle-wind.goal': 'Zjistěte předpověď větru na začátku výletu v den, kdy pojedete.',
  'help.guide.tour-paddle-wind.tip.4':
    'Chybějící hodnota předpovědi neznamená, že je bezpečno. Podmínky si ověřte na místě.',
  'help.guide.tour-paddle-checklist.step.5':
    'Dole ve sloupci klikněte na „Pádlování má rizika“ a před vyplutím si přečtěte „Bezpečnost na vodě“.',
  'help.guide.tour-paddle-track-marks.goal':
    'Importujte vodáckou stopu z hodinek a doplňte, kde jste loď přenášeli a kde jste projeli zdymadlem.',
  'help.guide.tour-paddle-track-marks.tip.1':
    'Klikejte přesně na stopu: kliknutí příliš daleko od linie se odmítne a karta na to upozorní.',
  'help.ctx.trip-tour-horse.bullet.3':
    'Každý úsek je na kartě „Trasové body“ odznakem s názvem trasy, tečkou přístupu a délkou. Úsek, který nepokrývá žádná jezdecká trasa, je označený „Ručně, neověřeno“.',
  'help.guide.tour-horse-plan.step.4': 'Klikněte na trasu v seznamu. Otevře se na vlastní mapě s očíslovanými úseky.',
  'help.guide.tour-horse-plan.tip.4': '„Vrátit úpravu bodu“ v záhlaví levého sloupce vrátí celý úsek jedním krokem.',
  'help.guide.tour-horse-gap.result': 'Vyjížďka už nemá mezeru a překlenutý úsek je označený jako nakreslený ručně.',
  'help.guide.tour-horse-recorded.step.3': 'Klikněte na „Importovat 1 výlet“.',
  'help.guide.dissolve-fusion.step.3': 'V okně, které se zeptá, potvrďte tlačítkem „Oddělit“.',
};

export default help;
