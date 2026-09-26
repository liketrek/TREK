import type { TranslationStrings } from '../types';

const help: TranslationStrings = {
  'help.title': 'Pomoc a dokumentácia',
  'help.search': 'Hľadať v dokumentácii…',
  'help.contents': 'Obsah',
  'help.noResults': 'Žiadne zodpovedajúce stránky.',
  'help.errorTitle': 'Túto stránku sa nepodarilo načítať',
  'help.errorBody': 'Obsah pomocníka sa načítava z wiki TREK. Skontrolujte pripojenie a skúste to znova.',

  // ── Help center (the contextual panel behind the ? in the navbar) ──────────
  'help.center.button': 'Pomoc k tejto obrazovke',
  'help.center.title': 'Pomoc',
  'help.center.onThisScreen': 'Na tejto obrazovke',
  'help.center.screens': 'Obrazovky',
  'help.center.thisScreen': 'Táto obrazovka',
  'help.center.subScreens': 'Podobrazovky: {count}',
  'help.center.subScreensLabel': 'Podobrazovky',
  'help.center.guidesCount': 'Návody: {count}',
  'help.center.goToScreen': 'Prejsť na {screen}',
  'help.center.overview': 'Prehľad',
  'help.center.howTo': 'Ako…',
  'help.center.searchPlaceholder': 'Hľadať v návodoch a dokumentácii…',
  'help.center.searchEmpty': 'Pre „{query}“ sa nič nenašlo.',
  'help.center.searchGuides': 'Návody',
  'help.center.searchDocs': 'Dokumentácia',
  'help.center.searchError': 'Vyhľadávanie momentálne nie je dostupné.',
  'help.center.back': 'Späť',
  'help.center.close': 'Zavrieť pomoc',
  'help.center.steps': 'Kroky: {count}',
  'help.center.step': 'Krok {n}',
  'help.center.stepsLabel': 'Kroky',
  'help.center.stepOf': 'Krok {n} z {total}',
  'help.center.screenshot': 'Snímka obrazovky',
  'help.center.result': 'Výsledok',
  'help.center.tips': 'Dobré vedieť',
  'help.center.related': 'Súvisiace',
  'help.center.openDocs': 'Otvoriť v Pomoci a dokumentácii',
  'help.center.docsSection': 'V dokumentácii',
  'help.center.noContext': 'Pre túto obrazovku zatiaľ nie je žiadny návod.',
  'help.center.noContextHint': 'Prehľadajte dokumentáciu alebo nám povedzte, čo ste hľadali.',
  'help.center.feedback': 'Niečo chýba?',
  'help.center.feedbackLink': 'Dajte nám vedieť na GitHube',
  'help.center.discord': 'Opýtajte sa na Discorde',
  'help.center.quick': 'Rýchly',
  'help.center.guide': 'Návod',
  'help.center.tour': 'Prehliadka',
  'help.center.imageAlt': 'Krok {n} návodu „{title}“',

  // ── Screen: dashboard ──────────────────────────────────────────────────────
  'help.ctx.dashboard.title': 'Prehľad',
  'help.ctx.dashboard.summary':
    'Prehľad je vstupnou bránou ku každej ceste. Palubný lístok hore zvýrazňuje cestu, ktorá práve prebieha alebo je najbližšie na rade, riadok pod ním počíta, čo ste doteraz precestovali, a karty zobrazujú všetko, čo plánujete, máte archivované alebo ste už dokončili.',
  'help.ctx.dashboard.bullet.1':
    'Palubný lístok: prebiehajúca alebo najbližšia cesta s dátumami, cestujúcimi, miestami a odpočítavaním. Kliknutím cestu otvoríte.',
  'help.ctx.dashboard.bullet.2':
    'Cestovné štatistiky: navštívené krajiny, cesty, dni na cestách a nalietaná vzdialenosť naprieč všetkými vašimi cestami.',
  'help.ctx.dashboard.bullet.3':
    'Karty ciest, filtrované podľa Plánované, Archivované a Dokončené, ako mriežka alebo zoznam. Po prejdení myšou nad kartou ju môžete upraviť, duplikovať, archivovať alebo vymazať.',
  'help.ctx.dashboard.bullet.4':
    'Widgety vpravo: prevodník mien, svetové hodiny, nadchádzajúce rezervácie a zbierky. Každý z nich sa dá vypnúť.',
  'help.ctx.dashboard.bullet.5': 'Karta Nová cesta aj tlačidlo v pravom dolnom rohu vytvoria novú cestu.',

  // create-trip
  'help.guide.create-trip.title': 'Vytvoriť cestu',
  'help.guide.create-trip.goal': 'Založte novú cestu s názvom, dátumami a úvodnou fotkou.',
  'help.guide.create-trip.step.1':
    'Kliknite na Nová cesta. Karta na konci vašich ciest aj tlačidlo v pravom dolnom rohu robia to isté.',
  'help.guide.create-trip.step.2': 'Pomenujte cestu. Je to jediné povinné pole; všetko ostatné môžete doplniť neskôr.',
  'help.guide.create-trip.step.3':
    'Vyberte dátum začiatku a konca. TREK vytvorí jeden deň pre každý dátum, takže itinerár je pripravený na vyplnenie.',
  'help.guide.create-trip.step.4':
    'Voliteľné: pridajte úvodnú fotku. Nahrajte vlastnú, pretiahnite ju sem alebo vyhľadajte cieľ na Unsplash.',
  'help.guide.create-trip.step.5': 'Kliknite na Vytvoriť novú cestu.',
  'help.guide.create-trip.result':
    'Cesta sa zobrazí na vašom prehľade. Ak je to vaša najbližšia cesta, prevezme palubný lístok hore.',
  'help.guide.create-trip.tip.1':
    'Dátumy môžete zmeniť neskôr. Ak už existujú rezervácie, TREK sa opýta, či ich posunúť spolu s dňami.',
  'help.guide.create-trip.tip.2':
    'Do meny cesty, ktorú tu vyberiete, sa prepočítavajú všetky náklady. Zvoľte menu cieľovej krajiny.',

  // edit-trip
  'help.guide.edit-trip.title': 'Upraviť cestu',
  'help.guide.edit-trip.goal': 'Premenujte cestu, zmeňte jej dátumy alebo upravte jej nastavenia.',
  'help.guide.edit-trip.step.1': 'Prejdite myšou nad kartu cesty (alebo palubný lístok) a kliknite na ceruzku.',
  'help.guide.edit-trip.step.2':
    'Zmeňte, čo potrebujete: názov, popis, dátumy, úvodný obrázok, menu, pripomienku alebo členov.',
  'help.guide.edit-trip.step.3': 'Kliknite na Aktualizovať.',
  'help.guide.edit-trip.result': 'Karta sa okamžite aktualizuje pre všetkých členov cesty.',
  'help.guide.edit-trip.tip.1':
    'Posunutie dátumov cesty, ktorá už má rezervácie, otvorí druhý krok s otázkou, či sa majú posunúť aj rezervácie.',

  // cover-image
  'help.guide.cover-image.title': 'Nastaviť úvodnú fotku',
  'help.guide.cover-image.goal': 'Dajte ceste obrázok, ktorý sa zobrazí na jej karte a na palubnom lístku.',
  'help.guide.cover-image.step.1': 'Otvorte formulár na úpravu cesty cez ceruzku na jej karte.',
  'help.guide.cover-image.step.2':
    'V časti Úvodný obrázok pustite fotku, kliknutím nahrajte vlastnú alebo zadajte cieľ do vyhľadávania Unsplash.',
  'help.guide.cover-image.step.3': 'Vyberte fotku a kliknite na Aktualizovať.',
  'help.guide.cover-image.result': 'Fotka sa uloží s cestou a zobrazí sa všade, kde je cesta uvedená.',
  'help.guide.cover-image.tip.1':
    'Pri fotkách z vyhľadávania Unsplash sa autor uvádza automaticky; vaše vlastné nahrané fotky zostávajú na vašom serveri.',

  // duplicate-trip
  'help.guide.duplicate-trip.title': 'Duplikovať cestu',
  'help.guide.duplicate-trip.goal': 'Použite cestu ako šablónu pre novú.',
  'help.guide.duplicate-trip.step.1': 'Prejdite myšou nad kartu a kliknite na ikonu duplikovania.',
  'help.guide.duplicate-trip.step.2': 'Prečítajte si, čo sa skopíruje a čo nie, a potom potvrďte.',
  'help.guide.duplicate-trip.result': 'Vedľa originálu sa zobrazí kópia pripravená na premenovanie a nové dátumy.',
  'help.guide.duplicate-trip.tip.1':
    'Skopírujú sa dni, miesta, rezervácie, položky rozpočtu, zoznamy vecí a poznámky k dňom. Členovia, chat, ankety, súbory a odkazy na zdieľanie nie.',

  // archive-trip
  'help.guide.archive-trip.title': 'Archivovať a obnoviť cestu',
  'help.guide.archive-trip.goal': 'Odložte cestu bez vymazania a neskôr ju vráťte späť.',
  'help.guide.archive-trip.step.1': 'Prejdite myšou nad kartu a kliknite na Archivovať.',
  'help.guide.archive-trip.step.2': 'Prepnite filter nad kartami na Archivované, aby ste ju znova videli.',
  'help.guide.archive-trip.step.3': 'Kliknutím na Obnoviť na karte ju presuniete späť medzi Plánované.',
  'help.guide.archive-trip.result':
    'Archivované cesty si ponechajú všetko. Len už nezahlcujú prehľad ani kalendárový kanál všetkých ciest.',

  // delete-trip
  'help.guide.delete-trip.title': 'Vymazať cestu',
  'help.guide.delete-trip.goal': 'Odstráňte cestu natrvalo.',
  'help.guide.delete-trip.step.1': 'Prejdite myšou nad kartu a kliknite na ikonu koša.',
  'help.guide.delete-trip.step.2': 'Potvrďte. Dialóg uvádza názov cesty, takže viete, že máte tú správnu.',
  'help.guide.delete-trip.result':
    'Cesta, jej dni, miesta, rezervácie a súbory sú preč. Nedá sa to vrátiť späť, takže ak si nie ste istí, radšej ju archivujte.',

  // filter-and-view
  'help.guide.filter-and-view.title': 'Nájsť dokončené cesty, prepnúť mriežku a zoznam',
  'help.guide.filter-and-view.goal':
    'Zobrazte dokončené alebo archivované cesty a vyberte si rozloženie, ktoré vám vyhovuje.',
  'help.guide.filter-and-view.step.1':
    'Použite Plánované, Archivované a Dokončené nad kartami. Dokončené sú všetky cesty, ktorých dátum konca už uplynul.',
  'help.guide.filter-and-view.step.2':
    'Kliknutím na ikonu zoznamu prepnete na kompaktný zoznam; ďalším kliknutím sa vrátite k mriežke.',
  'help.guide.filter-and-view.result': 'Prehľad si na tomto zariadení zapamätá vaše rozloženie.',

  // calendar-feed
  'help.guide.calendar-feed.title': 'Odoberať všetky cesty vo svojom kalendári',
  'help.guide.calendar-feed.goal':
    'Majte dni a rezervácie všetkých aktívnych ciest vo svojej kalendárovej aplikácii, vždy synchronizované.',
  'help.guide.calendar-feed.step.1': 'Kliknite na ikonu kalendára vedľa prepínača zobrazenia.',
  'help.guide.calendar-feed.step.2': 'Kliknite na Povoliť odber kalendára. TREK vygeneruje súkromný odkaz na kanál.',
  'help.guide.calendar-feed.step.3':
    'Pridajte kanál jedným z tlačidiel (Google, Apple, Outlook) alebo skopírujte odkaz do ľubovoľnej kalendárovej aplikácie, ktorá podporuje odber cez URL.',
  'help.guide.calendar-feed.result':
    'Každá aktívna cesta sa zobrazí vo vašom kalendári a aktualizuje sa sama. Archivované cesty a cesty, ktoré skončili pred viac ako 90 dňami, sú vynechané.',
  'help.guide.calendar-feed.tip.1':
    'Odkaz je tajný. Ktokoľvek, kto ho má, môže kanál čítať; ak unikne, zrušte ho v tom istom dialógu.',

  // widgets
  'help.guide.widgets.title': 'Vybrať widgety na prehľade',
  'help.guide.widgets.goal': 'Zobrazte alebo skryte riadok so štatistikami a widgety vpravo.',
  'help.guide.widgets.step.1': 'Otvorte ponuku avatara v pravom hornom rohu a vyberte Nastavenia.',
  'help.guide.widgets.step.2': 'Prepnite na kartu Vzhľad.',
  'help.guide.widgets.step.3':
    'V časti Widgety na prehľade zapnite alebo vypnite jednotlivé widgety. Počítač a mobil sa nastavujú zvlášť.',
  'help.guide.widgets.step.4': 'Vráťte sa na prehľad. Zmena sa prejaví okamžite.',
  'help.guide.widgets.result':
    'Skryté widgety uvoľnia miesto pre vaše cesty; ak vypnete celý pravý bočný panel, rozloženie sa vycentruje.',
  'help.guide.widgets.link': 'Otvoriť nastavenia vzhľadu',

  // currency-widget
  'help.guide.currency-widget.title': 'Prevádzať meny',
  'help.guide.currency-widget.goal': 'Preveďte sumu medzi dvoma menami podľa aktuálnych kurzov.',
  'help.guide.currency-widget.step.1': 'Zadajte sumu a vyberte obe meny.',
  'help.guide.currency-widget.step.2': 'Šípka medzi nimi vymení poradie mien; kruhová šípka obnoví kurz.',
  'help.guide.currency-widget.result': 'Váš pár mien sa ukladá k vášmu účtu, takže je rovnaký na každom zariadení.',
  'help.guide.currency-widget.tip.1': 'Kurzy pochádzajú z Európskej centrálnej banky a aktualizujú sa raz denne.',

  // timezones-widget
  'help.guide.timezones-widget.title': 'Pridať svetové hodiny',
  'help.guide.timezones-widget.goal': 'Sledujte miestny čas vo svojich cieľových destináciách.',
  'help.guide.timezones-widget.step.1': 'Kliknite na + vo widgete Časové pásma a vyhľadajte mesto.',
  'help.guide.timezones-widget.step.2': 'Hodiny odstránite pomocou × vedľa nich.',
  'help.guide.timezones-widget.result': 'Vaše hodiny sa ukladajú k vášmu účtu.',

  // ── Screen: vacay ──────────────────────────────────────────────────────────
  'help.ctx.vacay.title': 'Dovolenka (Vacay)',
  'help.ctx.vacay.summary':
    'Dovolenka (Vacay) je váš osobný plánovač voľna: koľko dní dovolenky máte v roku, ktoré ste si už zapísali a koľko zostáva. Mriežka zobrazuje celý rok naraz; bočný panel obsahuje výber roka, ľudí, s ktorými plánujete, kalendáre zdieľané s vami, legendu a váš nárok.',
  'help.ctx.vacay.bullet.1':
    'Ročná mriežka: dvanásť kariet mesiacov, jedna bunka na deň. Kliknutím na deň ho zapíšete alebo zrušíte. Malá modrá bodka označuje dni, ktoré už pokrýva nejaká cesta.',
  'help.ctx.vacay.bullet.2':
    'Panel nástrojov dole: režim Dovolenka alebo Firemné voľno a k tomu prepínače Pol dňa a Náhradné / pružné voľno, ktoré menia, čo sa kliknutím zapíše.',
  'help.ctx.vacay.bullet.3':
    'Nárok: vaše dni na daný rok, koľko je použitých a koľko zostáva, vrátane prevodu z predchádzajúceho obdobia.',
  'help.ctx.vacay.bullet.4':
    'Osoby sú ľudia prepojení s vaším plánom, každý vo vlastnej farbe. Zdieľané kalendáre sú krúžky s voľnými dňami iných ľudí, len na čítanie.',
  'help.ctx.vacay.bullet.5':
    'Nastavenia zahŕňajú víkendy, začiatok týždňa, prevod dovolenky, váš dovolenkový rok, firemné voľná a kalendáre štátnych sviatkov či školských prázdnin.',

  // log-day
  'help.guide.log-day.title': 'Zapísať deň dovolenky',
  'help.guide.log-day.goal': 'Označte si voľný deň v ročnej mriežke a sledujte, ako sa mení váš zostatok.',
  'help.guide.log-day.step.1':
    'Skontrolujte panel nástrojov dole: ľavé tlačidlo vo vašej farbe znamená, že kliknutím si zapíšete deň dovolenky.',
  'help.guide.log-day.step.2':
    'Kliknite na deň v ľubovoľnej karte mesiaca. Vyplní sa vašou farbou a Použité započíta o jeden deň viac.',
  'help.guide.log-day.step.3': 'Opätovným kliknutím na ten istý deň ho zrušíte.',
  'help.guide.log-day.result':
    'Deň je zapísaný, Dni, Použité a Zostáva sa okamžite aktualizujú a každý, kto je prepojený s vaším plánom, to vidí naživo.',
  'help.guide.log-day.tip.1': 'Víkendy nie je možné zapísať, kým je v Nastaveniach zapnuté Blokovať víkendy.',
  'help.guide.log-day.tip.2':
    'Modrá bodka v bunke znamená, že daný deň pokrýva niektorá z vašich ciest, takže vidíte, kde sa voľno a cestovanie prekrývajú.',

  // half-day
  'help.guide.half-day.title': 'Zapísať pol dňa',
  'help.guide.half-day.goal': 'Vezmite si voľné popoludnie bez toho, aby ste minuli celý deň nároku.',
  'help.guide.half-day.step.1':
    'Zapnite na paneli nástrojov Pol dňa. Jeho oranžová bodka je značka, ktorú v mriežke dostane polovičný deň.',
  'help.guide.half-day.step.2': 'Kliknite na deň. Zapíše sa ako 0,5 a v rohu má oranžovú bodku.',
  'help.guide.half-day.step.3':
    'Keď skončíte, Pol dňa znova vypnite; kliknutím na polovičný deň s inými nastaveniami ho priamo prevediete.',
  'help.guide.half-day.result':
    'Použité sa zvýši o 0,5. Pol dňa a Náhradné / pružné voľno sú nezávislé, takže je možný aj polovičný deň náhradného voľna.',
  'help.guide.half-day.tip.1':
    'Panel nástrojov vždy ukazuje značku, ktorú umiestni vaše ďalšie kliknutie, takže si to môžete pred zápisom skontrolovať.',

  // comp-day
  'help.guide.comp-day.title': 'Zapísať náhradné alebo pružné voľno',
  'help.guide.comp-day.goal': 'Vezmite si náhradné voľno, ktoré vás nestojí dni dovolenky.',
  'help.guide.comp-day.step.1':
    'Zapnite na paneli nástrojov Náhradné / pružné voľno. Šrafovaný kruh ukazuje, ako vyzerá deň náhradného voľna v mriežke.',
  'help.guide.comp-day.step.2': 'Kliknite na deň. Namiesto plnej výplne dostane diagonálne šrafovanie vo vašej farbe.',
  'help.guide.comp-day.result': 'Dni náhradného voľna sa počítajú vedľa dlaždíc nároku a nikdy neznižujú Zostáva.',
  'help.guide.comp-day.tip.1':
    'Vybrané nadčasy, pružný čas, náhradný deň: sem patrí všetko, čo je voľno, ale nie dovolenka.',

  // entitlement
  'help.guide.entitlement.title': 'Nastaviť nárok',
  'help.guide.entitlement.goal': 'Nastavte vo Vacay, koľko dní dovolenky máte v roku.',
  'help.guide.entitlement.step.1': 'V bočnom paneli kliknite na dlaždicu Dni v časti Nárok.',
  'help.guide.entitlement.step.2': 'Zadajte počet dní a stlačte Enter.',
  'help.guide.entitlement.result':
    'Zostáva sa prepočíta z vášho nároku, prípadného prevodu a dní, ktoré ste už použili.',
  'help.guide.entitlement.tip.1': 'Každý rok má vlastný nárok, takže zmena tu ovplyvní iba vybraný rok.',

  // years
  'help.guide.years.title': 'Pridávať a prepínať roky',
  'help.guide.years.goal': 'Naplánujte si už budúci rok alebo sa pozrite späť na ten minulý.',
  'help.guide.years.step.1':
    'Kliknutím na + vpravo od roka pridáte nasledujúci rok, kliknutím na + vľavo predchádzajúci.',
  'help.guide.years.step.2': 'Medzi rokmi prepínate šípkami alebo čipmi rokov pod nimi.',
  'help.guide.years.step.3':
    'Ak chcete rok odstrániť, prejdite myšou nad jeho čip a kliknite na malé mínus. Jeho záznamy sa odstránia s ním, preto potvrdzujte opatrne.',
  'help.guide.years.result': 'Každý rok si ponecháva vlastný nárok a záznamy; prevod dovolenky ich navzájom prepája.',

  // company-holidays
  'help.guide.company-holidays.title': 'Označiť firemné voľno',
  'help.guide.company-holidays.goal': 'Zablokujte dni, keď má voľno celá firma, bez čerpania nároku kohokoľvek.',
  'help.guide.company-holidays.step.1':
    'Otvorte Nastavenia a skontrolujte, či sú Firemné voľná zapnuté. Predvolene sú zapnuté; panel nástrojov ponúka tento režim, len kým sú zapnuté.',
  'help.guide.company-holidays.step.2': 'Späť v mriežke prepnite panel nástrojov do režimu Firemné voľno.',
  'help.guide.company-holidays.step.3': 'Kliknite na dni. Zafarbia sa na jantárovo a zobrazia sa v legende.',
  'help.guide.company-holidays.result': 'Firemné voľná vidia všetci prepojení s plánom a nikdy neznižujú Zostáva.',
  'help.guide.company-holidays.tip.1':
    'Firemné voľná môže upravovať ktokoľvek z prepojených osôb, preto sa dohodnite, kto ich bude spravovať.',

  // public-holidays
  'help.guide.public-holidays.title': 'Zobraziť štátne sviatky',
  'help.guide.public-holidays.goal': 'Zobrazte v mriežke štátne sviatky svojej krajiny alebo regiónu.',
  'help.guide.public-holidays.step.1': 'Otvorte Nastavenia a zapnite Štátne sviatky.',
  'help.guide.public-holidays.step.2':
    'Kliknite na Pridať kalendár a vyberte krajinu a v prípade potreby aj región. Ak chcete, priraďte mu farbu a označenie.',
  'help.guide.public-holidays.step.3': 'Zatvorte Nastavenia. Sviatky sa zobrazia v mriežke a v legende.',
  'help.guide.public-holidays.result':
    'Štátne sviatky sú označené farbou kalendára a nikdy sa nezapočítavajú do vášho nároku.',
  'help.guide.public-holidays.tip.1':
    'Môžete pridať viacero kalendárov, napríklad pre váš región a pre región prepojeného kolegu.',

  // school-holidays
  'help.guide.school-holidays.title': 'Zobraziť školské prázdniny',
  'help.guide.school-holidays.goal': 'Zobrazte školské prázdniny vo svojom regióne vedľa vlastných voľných dní.',
  'help.guide.school-holidays.step.1': 'Otvorte Nastavenia a zapnite Školské prázdniny.',
  'help.guide.school-holidays.step.2':
    'Kliknite na Pridať kalendár a vyberte krajinu. Ak má krajina kalendár rozdelený, vyberte aj región alebo skupinu.',
  'help.guide.school-holidays.step.3':
    'Zatvorte Nastavenia. Každé prázdniny dostanú farebný pruh pozdĺž spodnej časti svojich dní.',
  'help.guide.school-holidays.result': 'Školské prázdniny sú čisto vizuálne: nikdy nikomu neznižujú nárok.',
  'help.guide.school-holidays.tip.1':
    'Chýba región? Váš administrátor môže školské prázdniny spravovať ručne v časti Správca, Personalizácia, Školské prázdniny.',

  // weekends
  'help.guide.weekends.title': 'Blokovať víkendy a nastaviť začiatok týždňa',
  'help.guide.weekends.goal': 'Vynechajte víkendy zo súčtu a začínajte týždeň dňom, na ktorý ste zvyknutí.',
  'help.guide.weekends.step.1': 'Otvorte Nastavenia.',
  'help.guide.weekends.step.2': 'Zapnite Blokovať víkendy a vyberte, ktoré dni sa počítajú ako váš víkend.',
  'help.guide.weekends.step.3': 'V časti Týždeň začína vyberte pondelok alebo nedeľu.',
  'help.guide.weekends.result': 'Blokované dni sú v mriežke sivé a nedajú sa omylom zapísať.',

  // leave-year
  'help.guide.leave-year.title': 'Nastaviť dovolenkový rok',
  'help.guide.leave-year.goal':
    'Počítajte nárok za fiškálny rok alebo od dátumu nástupu namiesto od januára do decembra.',
  'help.guide.leave-year.step.1': 'Otvorte Nastavenia a nájdite Dovolenkový rok.',
  'help.guide.leave-year.step.2':
    'Vyberte Kalendár, Fiškálny (s mesiacom a dňom, kedy začína) alebo Dátum nástupu (s dátumom, keď ste nastúpili).',
  'help.guide.leave-year.result':
    'Nárok, použité dni a prevod dovolenky sa riadia týmto obdobím a mriežka začína jeho prvým mesiacom.',
  'help.guide.leave-year.tip.1':
    'Toto nastavenie je osobné: v prepojenom pláne si každý ponecháva vlastný dovolenkový rok a čísla.',

  // carry-over
  'help.guide.carry-over.title': 'Prevádzať nevyčerpané dni',
  'help.guide.carry-over.goal': 'Pripočítajte to, čo zostane na konci obdobia, k nasledujúcemu obdobiu.',
  'help.guide.carry-over.step.1': 'Otvorte Nastavenia.',
  'help.guide.carry-over.step.2': 'Zapnite Prevod dovolenky.',
  'help.guide.carry-over.result':
    'Prevedený počet sa prepočíta naprieč všetkými vašimi rokmi a zobrazí sa pod nárokom.',
  'help.guide.carry-over.tip.1': 'Vypnutím sa všetky zostatky prevodu vynulujú.',

  // invite
  'help.guide.invite.title': 'Plánovať spolu s niekým',
  'help.guide.invite.goal':
    'Prepojte svoj plán s iným používateľom TREK, aby ste navzájom videli svoje voľné dni v jednej mriežke.',
  'help.guide.invite.step.1': 'Kliknite na ikonu osoby v paneli Osoby.',
  'help.guide.invite.step.2': 'Vyberte používateľa a odošlite pozvánku.',
  'help.guide.invite.step.3':
    'Používateľ dostane upozornenie a pozvánku prijme. Dovtedy sa pozvánka zobrazuje ako čaká na vybavenie.',
  'help.guide.invite.result':
    'Oba plány sa zlúčia: každá osoba má svoju farbu, môžete si navzájom zapisovať dni a všetko sa synchronizuje naživo.',
  'help.guide.invite.tip.1':
    'Ak chcete prepojenie zrušiť, použite Oddeliť v Nastaveniach. Záznamy každého sa vrátia do jeho vlastného plánu.',
  'help.guide.invite.tip.2': 'Ak má druhá osoba vaše dni iba vidieť, namiesto prepojenia jej zdieľajte svoj kalendár.',

  // share-calendar
  'help.guide.share-calendar.title': 'Zdieľať kalendár len na čítanie',
  'help.guide.share-calendar.goal':
    'Umožnite niekomu vidieť, kedy máte voľno, bez toho, aby mohol zasahovať do vášho plánu.',
  'help.guide.share-calendar.step.1': 'Kliknite na ikonu zdieľania v paneli Zdieľané kalendáre.',
  'help.guide.share-calendar.step.2': 'Vyberte používateľa a kliknite na Zdieľať. Prijatie nie je potrebné.',
  'help.guide.share-calendar.step.3':
    'Kalendáre zdieľané s vami sa zobrazia v tom istom paneli; oko jeden z nich skryje, Zastaviť zdieľanie zruší ten váš.',
  'help.guide.share-calendar.result':
    'Vaše voľné dni sa v jeho mriežke zobrazia ako farebný krúžok. Nič z toho, čo zdieľate, nemôže upravovať.',
  'help.guide.share-calendar.tip.1':
    'Zdieľanie a prepojenie sú nezávislé: môžete byť prepojení s jednou osobou a zdieľať s inými.',
  'help.guide.share-calendar.tip.2': 'Prejdite myšou nad deň s krúžkom a uvidíte, kto má voľno a na ako dlho.',

  // ── Screen: atlas ──────────────────────────────────────────────────────────
  'help.ctx.atlas.title': 'Atlas',
  'help.ctx.atlas.summary':
    'Atlas je vaša cestovateľská stopa na mape sveta: každá krajina, do ktorej vás zaviedla nejaká cesta, je vyfarbená a krajiny, ktoré ste navštívili pred TREK, môžete pridať ručne. Priblížte si regióny, veďte si zoznam prianí miest, ktoré ešte chcete vidieť, a sledujte svoje čísla v sklenenom paneli dole.',
  'help.ctx.atlas.bullet.1':
    'Mapa: navštívené krajiny majú farbu, ktorá im zostane, plánované krajiny prerušovaný obrys, krajiny zo zoznamu prianí diagonálne šrafovanie a všetko ostatné je sivé. Prejdite myšou nad krajinu a uvidíte jej cesty, miesta a prvú a poslednú návštevu.',
  'help.ctx.atlas.bullet.2':
    'Vyhľadávanie hore: zadajte krajinu alebo miesto. Po výbere krajiny mapa preletí k nej a otvorí jej okno; po výbere miesta sa presunie do jeho regiónu, aby ste ho mohli označiť.',
  'help.ctx.atlas.bullet.3':
    'Zobraziť plánované krajiny vpravo hore: odhalí krajiny vašich nadchádzajúcich ciest. Prepínač sa zobrazuje, len keď nejaké máte.',
  'help.ctx.atlas.bullet.4':
    'Panel dole: karta Štatistiky s krajinami, cestami, miestami, mestami, dňami, kontinentmi a vašou sériou; karta Zoznam prianí s tým, čo vás ešte čaká.',
  'help.ctx.atlas.bullet.5':
    'Regióny: od úrovne priblíženia 5 mapa prepne na štáty a provincie, pričom každý z nich môžete kliknutím označiť alebo odznačiť.',
  'help.ctx.atlas.bullet.6':
    'Dawarich: s pripojeným doplnkom panel naľavo od štatistík odškrtáva priania a pridáva krajiny z vašich záznamov, nikdy bez vášho potvrdenia.',
  // mark-country
  'help.guide.mark-country.title': 'Označiť krajinu ako navštívenú',
  'help.guide.mark-country.goal':
    'Pridajte krajinu, ktorú ste navštívili ešte pred TREK, aby ju zahŕňala mapa aj váš počet.',
  'help.guide.mark-country.step.1': 'Zadajte krajinu do vyhľadávacieho poľa v hornej časti mapy.',
  'help.guide.mark-country.step.2': 'Vyberte ju zo zoznamu. Mapa preletí k nej a otvorí sa okno danej krajiny.',
  'help.guide.mark-country.step.3': 'Vyberte Označiť ako navštívené.',
  'help.guide.mark-country.result':
    'Krajina dostane na mape svoju farbu a Krajiny započítajú o jednu viac. Táto farba je trvalá: označovanie ďalších krajín nikdy nepremieša ostatné.',
  'help.guide.mark-country.tip.1':
    'Kliknutím na sivú krajinu na mape sa otvorí to isté okno; pri malých krajinách je vyhľadávanie spoľahlivejšia cesta.',
  'help.guide.mark-country.tip.2':
    'Krajina, ktorú označíte ručne, sa vždy počíta ako navštívená bez ohľadu na dátumy akejkoľvek cesty do nej.',
  // unmark-country
  'help.guide.unmark-country.title': 'Odstrániť krajinu, ktorú ste označili',
  'help.guide.unmark-country.goal': 'Odstráňte ručne označenú krajinu z mapy.',
  'help.guide.unmark-country.step.1':
    'Vyhľadajte krajinu a vyberte ju alebo na ňu kliknite na mape. Pri krajine, ktorú ste označili sami, sa okno opýta, či ju odstrániť.',
  'help.guide.unmark-country.step.2': 'Potvrďte tlačidlom Odobrať.',
  'help.guide.unmark-country.result': 'Krajina opäť zosivie a vypadne z vášho počtu.',
  'help.guide.unmark-country.tip.1':
    'Takto možno odstrániť iba ručne označené krajiny. Krajina s cestami alebo miestami zostane, kým tie existujú; ak bola označená ručne, Odobrať nájdete aj v jej karte s podrobnosťami v paneli.',
  // country-details
  'help.guide.country-details.title': 'Pozrieť, čo ste v krajine zažili',
  'help.guide.country-details.goal': 'Otvorte navštívenú krajinu a prejdite na cesty, ktoré vás tam zaviedli.',
  'help.guide.country-details.step.1': 'Vyhľadajte krajinu, ktorú ste navštívili.',
  'help.guide.country-details.step.2':
    'Vyberte ju. Mapa preletí k nej a v paneli dole pribudne karta s jej vlajkou, miestami, cestami a čipom pre každú cestu.',
  'help.guide.country-details.result': 'Kliknutím na čip cesty otvoríte túto cestu v plánovači.',
  'help.guide.country-details.tip.1':
    'Po prejdení myšou nad krajinu na mape uvidíte tie isté čísla a navyše prvú a poslednú návštevu.',
  // planned-countries
  'help.guide.planned-countries.title': 'Zobraziť krajiny, kam sa chystáte',
  'help.guide.planned-countries.goal':
    'Zobrazte na mape krajiny svojich nadchádzajúcich ciest bez toho, aby sa počítali ako navštívené.',
  'help.guide.planned-countries.step.1':
    'Zapnite Zobraziť plánované krajiny vpravo hore. Číslo vedľa ukazuje, koľko ich na vás čaká.',
  'help.guide.planned-countries.step.2':
    'Vyhľadajte plánovanú krajinu a vyberte ju: panel uvádza Plánované a popis na mape ukazuje, kedy tam idete.',
  'help.guide.planned-countries.result':
    'Plánované krajiny sa zobrazujú s prerušovaným obrysom, takže nikdy nevyzerajú ako miesta, kde ste už boli. Prepínač si pamätá vašu voľbu.',
  'help.guide.planned-countries.tip.1':
    'Krajina sa počíta ako navštívená, keď sa cesta do nej začala; počíta sa aj prebiehajúca cesta. Cesty bez dátumov zostávajú úplne mimo štatistík.',
  'help.guide.planned-countries.tip.2': 'Prepínač existuje, len kým máte nadchádzajúce cesty.',
  // regions
  'help.guide.regions.title': 'Označiť región',
  'help.guide.regions.goal':
    'Choďte do väčších podrobností ako krajiny: označte štáty, provincie alebo prefektúry, kde ste boli.',
  'help.guide.regions.step.1':
    'Priblížte krajinu, kým sa nezobrazia jej regióny, od úrovne priblíženia 5. Ak krajinu vyhľadáte a vyberiete, mapa vás priblíži dostatočne.',
  'help.guide.regions.step.2':
    'Kliknite na región. Po prejdení myšou sa zobrazí jeho názov; okno ukazuje región a jeho krajinu.',
  'help.guide.regions.step.3': 'Vyberte Označiť ako navštívené.',
  'help.guide.regions.result':
    'Región sa vyplní farbou krajiny. Označením regiónu sa zároveň započíta ako navštívená aj krajina, ak ešte nebola.',
  'help.guide.regions.tip.1':
    'Po kliknutí na navštívený región sa ponúkne Odobrať, či už ste ho označili vy, alebo ho tam pridalo niektoré miesto.',
  'help.guide.regions.tip.2': 'Regióny, v ktorých máte skutočné miesta, sa označia za vás; tam nemusíte nič robiť.',
  // search-place
  'help.guide.search-place.title': 'Nájsť miesto a označiť jeho región',
  'help.guide.search-place.goal':
    'Označte Lombardiu vyhľadaním Milána bez toho, aby ste vedeli, v ktorom regióne mesto leží.',
  'help.guide.search-place.step.1':
    'Zadajte do vyhľadávacieho poľa mesto, pamiatku alebo adresu. Najprv sa zobrazia krajiny; zodpovedajúce miesta sa objavia pod nimi v časti Miesta.',
  'help.guide.search-place.step.2': 'Vyberte miesto. Mapa preletí k nemu a zistí, v ktorom regióne sa nachádza.',
  'help.guide.search-place.step.3':
    'Pre tento región vyberte Označiť ako navštívené, alebo Pridať do zoznamu prianí (Bucket list), ak vás ešte len čaká.',
  'help.guide.search-place.result':
    'Región je označený a s ním aj krajina. Pri krajinách bez údajov o regiónoch v balíku mapy sa použije samotná krajina.',
  'help.guide.search-place.tip.1':
    'Miesta pochádzajú z rovnakého vyhľadávania ako všade inde v TREK, takže sa riadia poskytovateľom, ktorého nastavil váš administrátor.',
  // bucket-country
  'help.guide.bucket-country.title': 'Pridať krajinu do zoznamu prianí',
  'help.guide.bucket-country.goal':
    'Veďte si zoznam vysnívaných krajín priamo na mape, oddelene od tých, kde ste už boli.',
  'help.guide.bucket-country.step.1': 'Vyhľadajte krajinu a vyberte ju alebo na ňu kliknite na mape.',
  'help.guide.bucket-country.step.2': 'Vyberte Pridať do zoznamu prianí (Bucket list).',
  'help.guide.bucket-country.step.3':
    'Ak už viete kedy, vyberte mesiac a rok a potom potvrďte tlačidlom Pridať do zoznamu prianí (Bucket list).',
  'help.guide.bucket-country.result':
    'Krajina sa vykreslí s diagonálnym šrafovaním vo farbe, ktorú bude mať, keď sa tam dostanete, a zobrazí sa na karte Zoznam prianí v paneli.',
  'help.guide.bucket-country.tip.1': 'Keď je krajina v zozname, to isté okno ponúka Odobrať zo zoznamu prianí.',
  'help.guide.bucket-country.tip.2':
    'Jeden záznam na cieľový dátum: tá istá krajina môže byť v zozname pre dva rôzne mesiace, ale nie dvakrát pre ten istý.',
  // bucket-place
  'help.guide.bucket-place.title': 'Pridať miesto do zoznamu prianí',
  'help.guide.bucket-place.goal':
    'Uložte si mesto, pamiatku alebo adresu, o ktorej snívate, so súradnicami a cieľovým dátumom.',
  'help.guide.bucket-place.step.1': 'Otvorte kartu Zoznam prianí v paneli dole.',
  'help.guide.bucket-place.step.2': 'Kliknite na Pridať miesto.',
  'help.guide.bucket-place.step.3':
    'Zadajte názov a stlačte tlačidlo vyhľadávania; vyberte zhodu, aby miesto malo súradnice. Funguje aj zadanie názvu bez vyhľadávania.',
  'help.guide.bucket-place.step.4': 'Ak chcete, vyberte mesiac a rok a kliknite na Pridať.',
  'help.guide.bucket-place.result':
    'Miesto sa zobrazí na začiatku vášho zoznamu prianí s cieľovým dátumom; × vedľa neho ho opäť odstráni.',
  'help.guide.bucket-place.tip.1':
    'Prianie so súradnicami môže Dawarich neskôr odškrtnúť za vás, keď vaše záznamy ukážu, že ste tam boli.',
  // stats
  'help.guide.stats.title': 'Čítať svoje štatistiky',
  'help.guide.stats.goal': 'Zistite, čo čísla v paneli počítajú a čo nie.',
  'help.guide.stats.step.1':
    'Krajiny sú počet rôznych krajín, v ktorých ste skutočne boli; plánované sa zobrazujú vedľa, nie v tomto čísle. Cesty, Miesta a Dni sú súčty naprieč všetkými vašimi cestami. Mestá sa odvodzujú z adries vašich miest, takže ide o odhad.',
  'help.guide.stats.step.2':
    'Kontinenty zobrazujú navštívené krajiny na kontinent; Antarktída pribudne do radu, keď ju navštívite. Nasleduje vaša séria, teda po sebe idúce roky s aspoň jednou cestou, a koľko ciest ste podnikli tento rok.',
  'help.guide.stats.result': 'Čísla sa riadia vašimi cestami tak, ako ich plánujete; nič tu netreba udržiavať.',
  'help.guide.stats.tip.1':
    'Mestá sa čítajú z textu adresy, nevyhľadávajú sa, takže krátka adresa ako „Osteria Francescana, Italy“ alebo adresa končiaca prefektúrou môže skončiť ako región namiesto mesta.',
  'help.guide.stats.tip.2':
    'Krajiny, ktoré ste označili ručne, sa počítajú do Krajín a kontinentov, ale neprinášajú žiadne cesty, miesta ani dni.',

  // dawarich-countries
  'help.guide.dawarich-countries.title': 'Pridať krajiny z vašich záznamov',
  'help.guide.dawarich-countries.goal':
    'Nechajte Dawarich zistiť, v ktorých krajinách ste boli za posledný rok, a tie, ktoré potvrdíte, pridajte na mapu.',
  'help.guide.dawarich-countries.step.1':
    'S pripojeným doplnkom Dawarich je v spodnej časti mapy, naľavo od štatistík, panel Dawarich s dvoma dlaždicami. Kliknite na Krajiny.',
  'help.guide.dawarich-countries.step.2':
    'Dialóg sa otvorí na karte Krajiny. Kliknite na Vyhľadať krajiny: TREK načíta krajiny a mestá, ktoré pokrývajú vaše záznamy za posledných 12 mesiacov, po jednom mesiaci, takže chvíľu počkajte. Každá krajina, ktorú váš Atlas ešte nemá, je uvedená s vlajkou, počtom miest a názvom prvého mesta a je predvolene zaškrtnutá; kliknutím na riadok ju vynecháte.',
  'help.guide.dawarich-countries.step.3':
    'Potvrďte tlačidlom vpravo dole, na ktorom je pri piatich zaškrtnutých riadkoch napísané Pridať 5 krajín. Dialóg uvedie, koľko krajín sa pridalo; zatvorte ho a mapa sa medzitým sama obnovila.',
  'help.guide.dawarich-countries.result':
    'Potvrdené krajiny majú na mape farbu a počítajú sa do Krajín, zaznamenané so zdrojom Dawarich. To, čo ste označili ručne, zostáva nedotknuté.',
  'help.guide.dawarich-countries.tip.1':
    'Krajiny, ktoré Atlas už zobrazuje ako navštívené, či už ručne, z cesty alebo z predchádzajúcej kontroly, sú vynechané, takže vaše vlastné označenia sa nikdy neprepíšu. Krajina, ktorú ste predtým z Atlasu odstránili, sa vráti, keď ju tu potvrdíte.',
  'help.guide.dawarich-countries.tip.2':
    'Názov krajiny, ktorý TREK nedokáže priradiť, sa namiesto zahodenia zobrazí pod riadkami a tlačidlo Skontrolovať znova sa opýta Dawarich ešte raz. Poznámka pod zoznamom uvádza, že sa prehľadalo posledných 12 mesiacov; toto obdobie je pevné.',
  // dawarich-wishes
  'help.guide.dawarich-wishes.title': 'Odškrtnúť priania podľa vašich záznamov',
  'help.guide.dawarich-wishes.goal':
    'Zistite, ktoré miesta zo zoznamu prianí ste naozaj navštívili, a odškrtnite ich s dátumom, kedy sa to stalo.',
  'help.guide.dawarich-wishes.step.1':
    'V paneli Dawarich v spodnej časti mapy, naľavo od štatistík, kliknite na Zoznam prianí.',
  'help.guide.dawarich-wishes.step.2':
    'Dialóg sa otvorí na karte Zoznam prianí. Kliknite na Skontrolovať zoznam prianí: TREK prehľadá vaše záznamy pre každú položku, ktorá má súradnice. Splnené prianie je uvedené s tým, ako blízko ste sa dostali, ako dlho ste zostali a v ktorý deň, a je predvolene zaškrtnuté; pri už odškrtnutom je uvedené Už odškrtnuté. Pod zoznamom poznámka počíta položky bez súradníc a je tam uvedené aj pravidlo: Prianie sa počíta ako splnené v okruhu 250 m a po 20 minútach na mieste.',
  'help.guide.dawarich-wishes.step.3':
    'Potvrďte tlačidlom vpravo dole, na ktorom je pri dvoch zaškrtnutých riadkoch napísané Odškrtnúť 2. Potom dialóg zatvorte a otvorte kartu Zoznam prianí v paneli vedľa neho.',
  'help.guide.dawarich-wishes.result':
    'Každé prianie má zelenú fajku s dátumom pobytu, nie s dnešným dátumom; jeho popis uvádza Odškrtnuté podľa vašich záznamov v Dawarichu a kliknutím na dátum to vrátite späť.',
  'help.guide.dawarich-wishes.tip.1':
    'Prejazd okolo sa nepočíta: pravidlo vyžaduje blízkosť aj čas a z viacerých vyhovujúcich pobytov vyhráva najdlhší. Prianie bez súradníc nemožno skontrolovať, preto pridávajte miesta cez vyhľadávanie v Pridať miesto, nie iba podľa názvu.',
  'help.guide.dawarich-wishes.tip.2':
    'Jedna kontrola prejde až 50 položiek, najprv tie, ktoré ešte nie sú odškrtnuté, a oznámi, ak ich bolo viac. Prianie, ktoré už bolo odškrtnuté, si ponechá svoj dátum.',
  // ── Screen: collections ────────────────────────────────────────────────────
  'help.ctx.collections.title': 'Zbierky',
  'help.ctx.collections.summary':
    'Zbierky sú vaša knižnica miest mimo akejkoľvek cesty: pomenované zoznamy miest, ktoré ste našli a chcete si ich ponechať, pričom každé miesto má stav Nápad, Chcem navštíviť alebo Navštívené. Miesta sa do ciest a z ciest kopírujú, nikdy nie sú prepojené, takže zoznam a cesta sa nikdy navzájom neovplyvňujú.',
  'help.ctx.collections.bullet.1':
    'Panel zoznamov vľavo: vaše vlastné zoznamy, zoznamy zdieľané s vami, pozvánky čakajúce na súhlas, Všetko uložené ako súhrn všetkého, čo vlastníte, a hore Nový zoznam spolu s importom zo súboru.',
  'help.ctx.collections.bullet.2':
    'Hlavička otvoreného zoznamu: jeho farba, obal, popis a odkazy, členovia a vpravo akcie Upraviť, Exportovať a Zdieľať.',
  'help.ctx.collections.bullet.3':
    'Riadok filtrov nad miestami: stav, kategória, hodnotenie a zoradenie, filter štítkov, + na pridanie miesta, import z cesty a Vybrať pre hromadné akcie.',
  'help.ctx.collections.bullet.4':
    'Riadky miest: avatar, názov a adresa, štítky a kategória a vpravo odznak stavu, ktorý sa prepína jedným kliknutím.',
  'help.ctx.collections.bullet.5':
    'Mapa vpravo: špendlík pre každé miesto so súradnicami, prepínač zoznamu a mapy, vyhľadávacie pole a filter štítkov. Kliknutím na špendlík otvoríte dané miesto.',
  'help.ctx.collections.bullet.6':
    'Panel s podrobnosťami: kliknutím na riadok zobrazíte obal, kategóriu, štítky, stav, popis a odkazy s možnosťami Upraviť, Kopírovať do cesty a Odobrať zo zoznamu.',
  // create-list
  'help.guide.create-list.title': 'Vytvoriť zoznam',
  'help.guide.create-list.goal': 'Založte nový pomenovaný zoznam s farbou a obalom, pripravený na miesta.',
  'help.guide.create-list.step.1': 'Kliknite na Nový zoznam v hornej časti panela zoznamov.',
  'help.guide.create-list.step.2':
    'Pomenujte zoznam a vyberte farbu. Obrázok na obálku, popis a odkazy sú voliteľné; môžete ich pridať neskôr cez Upraviť.',
  'help.guide.create-list.step.3': 'Kliknite na Vytvoriť.',
  'help.guide.create-list.result':
    'Zoznam sa otvorí prázdny a naplniť ho môžete dvoma spôsobmi: Pridať miesto a Importovať z cesty.',
  'help.guide.create-list.tip.1':
    'Obal môže byť váš vlastný nahraný obrázok alebo obrázok nájdený cez vyhľadávanie Unsplash v tom istom dialógu.',
  // add-place
  'help.guide.add-place.title': 'Pridať miesto',
  'help.guide.add-place.goal':
    'Nájdite miesto a uložte ho do otvoreného zoznamu naraz s názvom, kategóriou, stavom a poznámkami.',
  'help.guide.add-place.step.1': 'Kliknite na + v riadku filtrov nad miestami.',
  'help.guide.add-place.step.2':
    'Zadajte miesto do vyhľadávacieho poľa a vyberte výsledok. Názov, adresa a súradnice sa z neho vyplnia.',
  'help.guide.add-place.step.3':
    'Nastavte stav a podľa potreby kategóriu, popis a odkazy, potom kliknite na Pridať. Dialóg zostane otvorený pre ďalšie miesto; Zrušiť ho zavrie.',
  'help.guide.add-place.result': 'Miesto sa zobrazí v zozname a ak má súradnice, aj ako špendlík na mape.',
  'help.guide.add-place.tip.1':
    'Priamo v ceste môžete pomocou Uložiť do zbierky v inšpektore miesta alebo v ponuke miesta pridať miesto z cesty do zoznamu bez toho, aby ste cestu opustili.',
  'help.guide.add-place.tip.2':
    'Zoznam musí byť váš alebo taký, v ktorom ste editor alebo správca; vo Všetko uložené ani v zozname, ktorý len prezeráte, + nie je.',
  // import-from-trip
  'help.guide.import-from-trip.title': 'Importovať miesta z cesty',
  'help.guide.import-from-trip.goal': 'Preneste do zoznamu naraz všetky miesta z cesty namiesto ukladania po jednom.',
  'help.guide.import-from-trip.step.1':
    'Kliknite na tlačidlo importu so šípkou v oblaku v riadku filtrov. Pri prázdnom zozname je rovnaká akcia vedľa Pridať miesto.',
  'help.guide.import-from-trip.step.2': 'Vyberte jednu zo svojich ciest.',
  'help.guide.import-from-trip.step.3':
    'Zaškrtnite požadované miesta. Miesta, ktoré už v zozname sú, sú sivé; tie, ktoré nie sú v žiadnom dni cesty, sú predvolene vybrané. Len nové skryje to, čo už máte.',
  'help.guide.import-from-trip.step.4': 'Kliknite na Importovať. Tlačidlo vždy uvádza, koľko miest sa pridá.',
  'help.guide.import-from-trip.result':
    'Miesta sa skopírujú do zoznamu s názvom, adresou, súradnicami, popisom a kategóriou. Cesta zostane taká, aká bola.',
  'help.guide.import-from-trip.tip.1':
    'Duplikáty podľa názvu alebo súradníc sa automaticky preskočia, takže opakovaný import neuškodí.',
  'help.guide.import-from-trip.tip.2':
    'V zozname miest cesty ponúka režim výberu namiesto toho Uložiť do zbierky pre ručne vybranú skupinu miest.',
  // place-status
  'help.guide.place-status.title': 'Nastaviť stav miesta',
  'help.guide.place-status.goal': 'Majte prehľad o tom, čo je nápad, čo je v užšom výbere a kde ste už boli.',
  'help.guide.place-status.step.1':
    'Kliknite na odznak stavu na pravom konci riadku miesta. Z Nápad sa stane Chcem navštíviť.',
  'help.guide.place-status.step.2': 'Ďalším kliknutím nastavíte Navštívené a ešte jedným začnete znova od Nápad.',
  'help.guide.place-status.result':
    'Odznak a jeho farba sa zmenia okamžite; filter stavu nad zoznamom priebežne prepočítava.',
  'help.guide.place-status.tip.1': 'Stav patrí len do Zbierok: pri kopírovaní miesta do cesty sa neprenáša.',
  'help.guide.place-status.tip.2':
    'V ceste zobrazuje Uložiť do zoznamu odznak stavu pre každý zoznam, v ktorom miesto je, a panel miest má pre výber akciu na označenie ako navštívené.',
  // place-detail
  'help.guide.place-detail.title': 'Otvoriť uložené miesto',
  'help.guide.place-detail.goal':
    'Pozrite si všetko o mieste a pracujte s ním: upravte ho, skopírujte do cesty alebo odstráňte.',
  'help.guide.place-detail.step.1':
    'Kliknite na riadok miesta. Vedľa zoznamu sa otvorí panel s podrobnosťami a mapa sa posunie na miesto.',
  'help.guide.place-detail.step.2':
    'Dole sú Upraviť, Kopírovať do cesty a Odobrať zo zoznamu; fotoaparát na obale nahradí automatickú fotku vašou vlastnou.',
  'help.guide.place-detail.result':
    'Upraviť odomkne názov, kategóriu, štítky, adresu, súradnice, popis a odkazy priamo v paneli.',
  'help.guide.place-detail.tip.1':
    'Obal sa načíta automaticky, keď miesto nemá vlastný obrázok. Vaša vlastná nahraná fotka môže byť vo formáte JPG, PNG, GIF alebo WebP s veľkosťou do 20 MB.',
  'help.guide.place-detail.tip.2':
    'Členovia zdieľaného zoznamu tu môžu tiež udeliť hodnotenie hviezdičkami a filter hodnotenia v riadku filtrov používa priemer.',
  // labels
  'help.guide.labels.title': 'Zoskupiť miesta pomocou štítkov',
  'help.guide.labels.goal': 'Dajte zoznamu vlastné štítky, napríklad štvrte alebo dni, nad rámec spoločných kategórií.',
  'help.guide.labels.step.1': 'Otvorte správu štítkov cez ovládací prvok štítkov v riadku filtrov.',
  'help.guide.labels.step.2':
    'Zadajte názov, vyberte farbu a kliknite na Pridať štítok. V tom istom dialógu môžete existujúce štítky premenovať, prefarbiť alebo vymazať.',
  'help.guide.labels.step.3':
    'Zapnite Vybrať, zaškrtnite miesta a na paneli výberu kliknite na Priradiť štítok. Jednotlivému miestu môžete štítky priradiť aj cez Upraviť v jeho paneli s podrobnosťami.',
  'help.guide.labels.step.4':
    'Vyberte v riadku filtrov jeden alebo viac štítkov, aby sa zoznam a mapa zúžili na miesta s ktorýmkoľvek z nich.',
  'help.guide.labels.result':
    'Miesta so štítkami ich zobrazujú v riadku; filter štítkov má k dispozícii každý člen vrátane divákov.',
  'help.guide.labels.tip.1':
    'Štítky patria k jedinému zoznamu, v ktorom boli vytvorené. Pri presune miesta do iného zoznamu sa stratia.',
  'help.guide.labels.tip.2': 'Správa a priraďovanie štítkov vyžaduje práva na úpravu zoznamu.',
  // filter-select
  'help.guide.filter-select.title': 'Filtrovať a vyberať miesta',
  'help.guide.filter-select.goal': 'Zúžte zoznam a pracujte s viacerými miestami naraz.',
  'help.guide.filter-select.step.1':
    'Použite rozbaľovacie ponuky v riadku filtrov: stav, kategória, minimálne hodnotenie a poradie zoradenia. Každá ukazuje, koľko miest by zostalo.',
  'help.guide.filter-select.step.2':
    'Kliknite na Vybrať. Každý riadok dostane zaškrtávacie políčko a zobrazí sa panel výberu.',
  'help.guide.filter-select.step.3':
    'Zaškrtnite miesta alebo použite Vybrať všetko pre všetko aktuálne vyfiltrované a potom zvoľte Priradiť štítok, Presunúť do zoznamu, Duplikovať do zoznamu, Kopírovať do cesty alebo Vymazať.',
  'help.guide.filter-select.result': 'Akcie sa použijú na celý výber naraz. × vpravo ukončí režim výberu.',
  'help.guide.filter-select.tip.1':
    'Vybrať všetko sa riadi filtrom, takže vyfiltrovať Chcem navštíviť a vybrať všetko je rýchly spôsob, ako pracovať s užším výberom.',
  // copy-to-trip
  'help.guide.copy-to-trip.title': 'Kopírovať miesta do cesty',
  'help.guide.copy-to-trip.goal': 'Premeňte uložené miesta na zastávky jednej zo svojich ciest.',
  'help.guide.copy-to-trip.step.1':
    'Zapnite Vybrať a zaškrtnite miesta, alebo otvorte jedno miesto a použite Kopírovať do cesty v jeho paneli s podrobnosťami.',
  'help.guide.copy-to-trip.step.2': 'Kliknite na Kopírovať do cesty na paneli výberu.',
  'help.guide.copy-to-trip.step.3': 'Vyberte cestu. Vyhľadávacie pole zúži dlhý zoznam.',
  'help.guide.copy-to-trip.result':
    'Miesta sa pridajú do zoznamu miest tejto cesty s názvom, popisom, kategóriou, poznámkami, cenou, súradnicami, fotkou a štítkami. V zbierke sa nič nezmení.',
  'help.guide.copy-to-trip.tip.1':
    'Diváci zdieľaného zoznamu to môžu robiť tiež; miesta sa zo zoznamu kopírujú, zoznam sa nemení.',
  // share-list
  'help.guide.share-list.title': 'Zdieľať zoznam s niekým',
  'help.guide.share-list.goal': 'Plánujte zoznam naživo spolu s ďalšími ľuďmi na tomto TREK.',
  'help.guide.share-list.step.1': 'Kliknite na Zdieľať v hlavičke svojho zoznamu.',
  'help.guide.share-list.step.2': 'Vyberte používateľa a rolu: Divák, Editor alebo Správca.',
  'help.guide.share-list.step.3':
    'Kliknite na Odoslať pozvánku. Osoba sa zobrazuje ako čaká na vybavenie, kým pozvánku neprijme vo svojom paneli zoznamov.',
  'help.guide.share-list.result':
    'Po prijatí sa jej zoznam zobrazí v časti Zdieľané a každá zmena sa synchronizuje naživo. Členov a ich roly môžete naďalej upravovať v tom istom dialógu.',
  'help.guide.share-list.tip.1':
    'Diváci môžu prezerať, hodnotiť a kopírovať miesta do vlastných ciest. Editori pridávajú a upravujú miesta a štítky. Správcovia môžu aj mazať.',
  'help.guide.share-list.tip.2': 'Ľudí pozýva a odoberá iba vlastník; člen môže zdieľaný zoznam sám opustiť.',
  // export-list
  'help.guide.export-list.title': 'Exportovať zoznam ako súbor',
  'help.guide.export-list.goal': 'Odovzdajte zoznam niekomu na inom TREK alebo ho preneste do mapovej aplikácie.',
  'help.guide.export-list.step.1': 'Kliknite na Exportovať v hlavičke zoznamu.',
  'help.guide.export-list.step.2':
    'Vyberte Zoznam TREK pre iný TREK, so štítkami a stavom, alebo GPX pre OsmAnd, Organic Maps, Garmin a ďalšie aplikácie, ktoré čítajú body trasy.',
  'help.guide.export-list.result': 'Súbor sa stiahne. Exportovať ho môže ktorýkoľvek člen zdieľaného zoznamu.',
  'help.guide.export-list.tip.1':
    'Miesto bez súradníc nemôže byť bodom GPX; vynechá sa a TREK vám oznámi, koľko takých bolo.',
  'help.guide.export-list.tip.2':
    'Hodnotenia, členovia a nahrané fotky sa zámerne neexportujú; patria k tomuto TREK, nie k zoznamu.',
  // import-file
  'help.guide.import-file.title': 'Importovať zoznam zo súboru',
  'help.guide.import-file.goal': 'Načítajte súbor zoznamu TREK alebo súbor GPX ako nový zoznam alebo do existujúceho.',
  'help.guide.import-file.step.1':
    'Kliknite na tlačidlo importu so šípkou nahrávania vedľa Nový zoznam v paneli zoznamov.',
  'help.guide.import-file.step.2':
    'Vyberte súbor. TREK vám ešte pred akoukoľvek zmenou ukáže, čo obsahuje: názov a počet miest a štítkov.',
  'help.guide.import-file.step.3':
    'Ponechajte Nový zoznam a prípadne zmeňte názov, alebo vyberte Pridať do zoznamu a vložte miesta do zoznamu, ktorý môžete upravovať, potom kliknite na Importovať.',
  'help.guide.import-file.result':
    'Ocitnete sa v zozname s importovanými miestami. Pridanie do zoznamu vždy iba pridáva; miesta, ktoré tam už sú, si ponechajú stav, poznámky a štítky.',
  'help.guide.import-file.tip.1':
    'Z GPX sa každý pomenovaný bod trasy stane miestom; stopy sú čiary a vynechajú sa, pričom náhľad uvádza, koľko bodov to bolo.',
  'help.guide.import-file.tip.2':
    'Súbor, ktorý nie je zoznamom TREK ani GPX, sa odmietne s uvedením dôvodu; jedno nečitateľné miesto sa preskočí, nie celý súbor.',
  // edit-list
  'help.guide.edit-list.title': 'Upraviť alebo vymazať zoznam',
  'help.guide.edit-list.goal': 'Zmeňte názov, farbu, obal, popis alebo odkazy zoznamu, prípadne zoznam odstráňte.',
  'help.guide.edit-list.step.1': 'Kliknite na Upraviť v hlavičke zoznamu. Vidí ho iba vlastník.',
  'help.guide.edit-list.step.2':
    'Zmeňte, čo chcete, a kliknite na Uložiť. Odstrániť zoznam vľavo dole po potvrdení odstráni zoznam so všetkými jeho miestami.',
  'help.guide.edit-list.result': 'Hlavička okamžite prevezme novú farbu, obal a popis.',
  'help.guide.edit-list.tip.1':
    'Vymazanie zoznamu sa nedá vrátiť späť. Ak si chcete ponechať kópiu, najprv ho exportujte.',
  // all-saved
  'help.guide.all-saved.title': 'Prehľadávať celú knižnicu',
  'help.guide.all-saved.goal': 'Prezerajte naraz všetky zoznamy, ktoré vlastníte.',
  'help.guide.all-saved.step.1':
    'Kliknite na Všetko uložené v paneli zoznamov. Spája miesta zo všetkých zoznamov, ktoré vlastníte alebo spoluvlastníte.',
  'help.guide.all-saved.step.2':
    'Používajte vyhľadávacie pole a filtre ako v ktoromkoľvek zozname; aj tu funguje Vybrať na kopírovanie do cesty.',
  'help.guide.all-saved.result':
    'Jeden pohľad na všetky uložené miesta, bez pridávania či importu, keďže nemá jeden konkrétny zoznam, do ktorého by ich vložil.',
  'help.guide.all-saved.tip.1':
    'Štítky sú pre každý zoznam zvlášť, preto sa filter štítkov vo Všetko uložené neponúka.',

  // ── Screen: journey ───────────────────────────────────────────────────────
  'help.ctx.journey.title': 'Cestovný denník',
  'help.ctx.journey.summary':
    'Cestovný denník je váš cestovateľský denník postavený na fotkách. Každý cestovný denník je prepojený s jednou alebo viacerými cestami a rastie deň po dni zo záznamov s príbehom, fotkami, náladou a počasím. Táto obrazovka zobrazuje vaše cestovné denníky; otvorte jeden a začnite písať.',
  'help.ctx.journey.bullet.1':
    'Banner hore zobrazuje prebiehajúci cestovný denník alebo váš najnovší s počtom záznamov, fotiek a miest. Pokračovať v písaní ho otvorí na dnešnom dni.',
  'help.ctx.journey.bullet.2':
    'Pod ním je jedna karta pre každý cestovný denník s obalom, podnadpisom, dátumami a počtami. Kliknutím na kartu ho otvoríte.',
  'help.ctx.journey.bullet.3': 'Posledná karta v mriežke, Vytvoriť nový cestovný denník, založí nový z vašich ciest.',
  // create-journey
  'help.guide.create-journey.title': 'Vytvoriť cestovný denník',
  'help.guide.create-journey.goal': 'Založte denník pre cestu, v ktorom už na vás čakajú miesta z cesty ako návrhy.',
  'help.guide.create-journey.step.1': 'Kliknite na Vytvoriť nový cestovný denník, poslednú kartu v mriežke.',
  'help.guide.create-journey.step.2':
    'Pomenujte ho, ak chcete, pridajte podnadpis a potom zaškrtnite cesty, ku ktorým patrí. Počítadlo ukazuje, koľko miest sa pridá.',
  'help.guide.create-journey.step.3': 'Kliknite na Vytvoriť cestovný denník.',
  'help.guide.create-journey.result':
    'Denník sa otvorí. Každé miesto z prepojených ciest je na časovej osi ako návrh, jeden za každý deň, v ktorom sa nachádza, pripravený na zápis.',
  'help.guide.create-journey.tip.1': 'Ďalšie cesty môžete neskôr prepojiť v Nastaveniach cestovného denníka.',
  'help.guide.create-journey.tip.2': 'Funguje aj cestovný denník bez ciest; záznamy potom pridávate ručne.',
  // open-journey
  'help.guide.open-journey.title': 'Otvoriť cestovný denník',
  'help.guide.open-journey.goal': 'Vstúpte do denníka a zistite, kde sa otvorí.',
  'help.guide.open-journey.step.1':
    'Kliknite na kartu. Každá zobrazuje obal, dátumy a počet záznamov, fotiek a miest v cestovnom denníku.',
  'help.guide.open-journey.result':
    'Prebiehajúci cestovný denník sa otvorí na dnešnom dni, alebo na poslednom zázname pred dneškom, ak ešte nič nie je napísané; dokončený sa otvorí na začiatku.',
  'help.guide.open-journey.tip.1':
    'Obalom je prvá fotka cestovného denníka, pokiaľ nejaký nenastavíte v Nastaveniach cestovného denníka.',
  // continue-writing
  'help.guide.continue-writing.title': 'Pokračovať v prebiehajúcom cestovnom denníku',
  'help.guide.continue-writing.goal': 'Skočte priamo na dnešnú stránku cestovného denníka, v ktorom práve ste.',
  'help.guide.continue-writing.step.1':
    'Kliknite na Pokračovať v písaní v banneri hore. Zobrazuje prebiehajúci cestovný denník, alebo najnovší, ak žiadny neprebieha.',
  'help.guide.continue-writing.result':
    'Denník sa otvorí na dnešnom dni, alebo na poslednom zázname pred dneškom, ak ešte nič nie je napísané.',
  'help.guide.continue-writing.tip.1':
    'Banner ponúka aj návrh pre cestu, ktorá ešte nemá cestovný denník; Zavrieť tento návrh skryje.',

  // ── Screen: journey-detail ────────────────────────────────────────────────────────────
  'help.ctx.journey-detail.title': 'Denník',
  'help.ctx.journey-detail.summary':
    'Jeden otvorený cestovný denník: časová os vľavo, deň po dni, a mapa vpravo so všetkými záznamami a miestami prepojených ciest. Všetko, čím denník dopĺňate, je hore; hlavička obsahuje počty, Studio, prepínač návrhov a Nastavenia cestovného denníka.',
  'help.ctx.journey-detail.bullet.1':
    'Hlavička: obal, názov a podnadpis, počty dní, miest, záznamov a fotiek a vpravo Studio, prepínač návrhov a Nastavenia cestovného denníka.',
  'help.ctx.journey-detail.bullet.2':
    'Panel nástrojov: karty Časová os a Galéria, Hľadať v tejto ceste a Pridať záznam.',
  'help.ctx.journey-detail.bullet.3':
    'Časová os: jedna sekcia na deň s + na pridanie záznamu v daný deň; karty záznamov s fotkami, náladou, počasím a príbehom; návrhy z ciest v svetlejšom štýle s možnosťou Zahodiť tento návrh.',
  'help.ctx.journey-detail.bullet.4':
    'Mapa: záznamy ako špendlíky spojené v poradí dátumov prerušovanou čiarou, miesta z ciest a všetky stopy GPX importované do týchto ciest.',
  'help.ctx.journey-detail.bullet.5':
    'Nastavenia cestovného denníka: obal, názov a podnadpis, stopy na mape, polia záznamov, zahodené návrhy, prepojené cesty, prispievatelia, verejné zdieľanie, archivácia a vymazanie.',
  'help.ctx.journey-detail.bullet.6':
    'Nad dlhou časovou osou sa vznášajú dve okrúhle tlačidlá: späť na začiatok a skok na posledný záznam.',
  // add-entry
  'help.guide.add-entry.title': 'Napísať záznam',
  'help.guide.add-entry.goal': 'Pridajte príbeh dňa s názvom, textom, náladou a počasím.',
  'help.guide.add-entry.step.1':
    'Kliknite na Pridať záznam na paneli nástrojov alebo na + v hlavičke dňa, ak chcete začať v daný deň.',
  'help.guide.add-entry.step.2':
    'Pomenujte chvíľu a napíšte príbeh. Panel nástrojov nad textom pridáva tučné písmo, kurzívu, nadpisy, citácie, odkazy a zoznamy vo formáte Markdown.',
  'help.guide.add-entry.step.3':
    'Vyberte náladu a počasie, skontrolujte dátum a ak chcete, pripnite polohu: vyhľadajte miesto alebo použite svoju aktuálnu polohu.',
  'help.guide.add-entry.step.4': 'Kliknite na Uložiť.',
  'help.guide.add-entry.result':
    'Záznam sa zobrazí pri svojom dni na časovej osi a ako špendlík na mape. Počty v hlavičke sa aktualizujú.',
  'help.guide.add-entry.tip.1': 'Písanie do návrhu prebieha v tom istom editore, len s už nastaveným miestom.',
  'help.guide.add-entry.tip.2':
    'Štítky dole sú voľný text, napríklad skrytý klenot alebo najlepšie jedlo, a vyhľadávanie ich nájde.',
  // entry-photos
  'help.guide.entry-photos.title': 'Pridanie fotiek a videí k záznamu',
  'help.guide.entry-photos.goal': 'Pridajte k dňu obrázky; prvý sa stane titulnou fotkou záznamu.',
  'help.guide.entry-photos.step.1': 'Otvorte ponuku záznamu cez ⋯ na jeho karte a vyberte Upraviť.',
  'help.guide.entry-photos.step.2':
    'Kliknite na Nahrať fotky a vyberte súbory. Z galérie prevezme obrázky, ktoré už sú v galérii cestovného denníka; Externé fotky prehľadajú pripojenú knižnicu Immich alebo Synology pre daný deň.',
  'help.guide.entry-photos.step.3':
    'Prejdite myšou nad obrázok a cez Nastaviť ako 1. zvoľte titulnú fotku, potom kliknite na Uložiť.',
  'help.guide.entry-photos.result': 'Fotky sa zobrazia na karte aj v galérii; prvá z nich slúži všade ako náhľad.',
  'help.guide.entry-photos.tip.1':
    'Videá sa k záznamu pridávajú rovnako: mp4, m4v, webm alebo mov do 500 MB, uložené tak, ako boli nahrané.',
  'help.guide.entry-photos.tip.2':
    'Súbory HEIC z iPhonu sa pri nahrávaní prevedú na JPEG, čím prídu o GPS a metadáta fotoaparátu.',
  // suggestions
  'help.guide.suggestions.title': 'Použitie alebo zahodenie návrhov',
  'help.guide.suggestions.goal':
    'Premeňte miesta zo svojich ciest na záznamy a odstráňte tie, o ktorých písať nebudete.',
  'help.guide.suggestions.step.1':
    'Návrh je svetlejšia karta s názvom miesta kurzívou. Kliknutím naň otvoríte editor s už nastaveným miestom a dňom.',
  'help.guide.suggestions.step.2':
    'Na karte, ktorú nepoužijete, kliknite na Zahodiť tento návrh. Zmizne z časovej osi bez odstránenia a synchronizácia s cestou ho už znova neponúkne.',
  'help.guide.suggestions.step.3':
    'Zmenili ste názor? Nastavenia cestovného denníka ukazujú, koľko návrhov je zahodených, a Vrátiť zahodené návrhy ich vráti všetky.',
  'help.guide.suggestions.result':
    'Na časovej osi zostane len to, o čom chcete písať; prepínač v hlavičke počas čítania skryje všetky návrhy naraz.',
  'help.guide.suggestions.tip.1': 'Miesto ponechané počas dvoch dní vytvorí návrh pre každý z nich.',
  'help.guide.suggestions.tip.2': 'Návrhy sa nikdy nezapočítavajú do štatistík; počítajú sa len napísané záznamy.',
  // add-on-day
  'help.guide.add-on-day.title': 'Pridanie záznamu k skoršiemu dňu',
  'help.guide.add-on-day.goal': 'Napíšte o dni, ktorý už uplynul, bez toho, aby ste potom museli opravovať dátum.',
  'help.guide.add-on-day.step.1': 'Kliknite na + v hlavičke daného dňa.',
  'help.guide.add-on-day.step.2': 'Editor sa otvorí s týmto dátumom. Napíšte text a kliknite na Uložiť ako zvyčajne.',
  'help.guide.add-on-day.result': 'Záznam sa hneď zaradí k správnemu dňu.',
  'help.guide.add-on-day.tip.1': 'V rámci dňa ho šípky v ponuke záznamu posunú skôr alebo neskôr.',
  // pros-cons
  'help.guide.pros-cons.title': 'Pridanie hodnotenia',
  'help.guide.pros-cons.goal': 'Zhrňte deň tým, čo bolo skvelé a čo nie.',
  'help.guide.pros-cons.step.1':
    'V editore nájdete pod príbehom Klady a zápory. Napíšte bod do poľa Klady alebo Zápory a pre ďalší použite Pridať ďalší.',
  'help.guide.pros-cons.step.2': 'Uložte. Hodnotenie sa na karte zobrazí ako dva krátke zoznamy.',
  'help.guide.pros-cons.result': 'Palec hore a palec dole na prvý pohľad, pod príbehom.',
  'help.guide.pros-cons.tip.1':
    'Cestovný denník, ktorý hodnotenia nepoužíva, môže túto sekciu vypnúť v časti Polia záznamu v Nastaveniach cestovného denníka.',
  // search-journey
  'help.guide.search-journey.title': 'Vyhľadanie niečoho v dlhom denníku',
  'help.guide.search-journey.goal': 'Dostaňte sa k požadovanému záznamu bez posúvania cez celé týždne.',
  'help.guide.search-journey.step.1':
    'Píšte do poľa Hľadať v tejto ceste na paneli nástrojov. Časová os sa filtruje už počas písania, a to v názvoch, príbehoch, miestach aj štítkoch. Na diakritike a veľkosti písmen nezáleží.',
  'help.guide.search-journey.step.2':
    'Prepínač návrhov v hlavičke počas čítania skryje nenapísané karty. Keď je časová os dlhá, nad jej spodným okrajom sa vznášajú dve okrúhle tlačidlá: späť na začiatok a skok na posledný záznam.',
  'help.guide.search-journey.result': 'Zostanú len zodpovedajúce záznamy; po vymazaní poľa sa znova zobrazí všetko.',
  'help.guide.search-journey.tip.1':
    'Prebiehajúci cestovný denník sa otvorí na dnešku, takže aktuálna stránka je zvyčajne hneď na očiach.',
  'help.guide.search-journey.tip.2':
    'Počítajú sa aj štítky: hľadanie výrazu skrytý klenot nájde každý záznam označený týmto štítkom.',
  // gallery-map
  'help.guide.gallery-map.title': 'Prehliadanie galérie a mapy',
  'help.guide.gallery-map.goal': 'Pozrite si celý cestovný denník ako obrázky aj ako miesta na mape.',
  'help.guide.gallery-map.step.1':
    'Na paneli nástrojov prepnite na Galéria: každá fotka z každého záznamu plus obrázky nahrané priamo do galérie. Kliknutím na niektorú ju otvoríte vo zväčšenom náhľade.',
  'help.guide.gallery-map.step.2':
    'Mapa vpravo zobrazuje záznamy ako špendlíky v poradí podľa dátumu, miesta prepojených ciest a všetky GPX trasy importované do týchto ciest vo farbe, ktorú majú v plánovači.',
  'help.guide.gallery-map.result':
    'Po prejdení myšou nad trasu sa zobrazí jej názov. Prerušovanú čiaru medzi záznamami kreslí TREK; trasa je cesta, ktorú ste skutočne zaznamenali.',
  'help.guide.gallery-map.tip.1': 'Trasy možno pre cestovný denník vypnúť v Nastaveniach cestovného denníka.',
  'help.guide.gallery-map.tip.2':
    'Fotky z galérie s polohou sa zobrazia aj na verejnej mape, ak sú zdieľané Galéria aj Mapa.',
  // entry-fields
  'help.guide.entry-fields.title': 'Vypnutie polí záznamu',
  'help.guide.entry-fields.goal': 'Obmedzte editor na to, čo tento cestovný denník používa.',
  'help.guide.entry-fields.step.1': 'Otvorte Nastavenia cestovného denníka z hlavičky.',
  'help.guide.entry-fields.step.2': 'V časti Polia záznamu vypnite Nálada, Počasie alebo Klady a zápory.',
  'help.guide.entry-fields.result':
    'Editor sa na ne prestane pýtať. Nič napísané sa nestratí: po opätovnom zapnutí poľa sa uložené hodnoty znova zobrazia a zdieľaný cestovný denník skrýva tie isté polia.',
  'help.guide.entry-fields.tip.1':
    'Prepínače platia pre každý cestovný denník zvlášť, takže pracovná cesta a dovolenka sa môžu líšiť.',
  // link-trip
  'help.guide.link-trip.title': 'Prepojenie ďalšej cesty',
  'help.guide.link-trip.goal': 'Preneste miesta druhej cesty do denníka ako návrhy.',
  'help.guide.link-trip.step.1': 'Otvorte Nastavenia cestovného denníka z hlavičky.',
  'help.guide.link-trip.step.2': 'Pod prepojenými cestami kliknite na Pridať cestu.',
  'help.guide.link-trip.step.3': 'Vyberte cestu.',
  'help.guide.link-trip.result':
    'Jej miesta sa objavia na časovej osi ako návrhy v príslušných dňoch a jej GPX trasy pribudnú na mapu.',
  'help.guide.link-trip.tip.1': '× vedľa prepojenej cesty ju znova odpojí; záznamy, ktoré ste napísali, zostanú.',
  'help.guide.link-trip.tip.2': 'Záznamy s dňom sa počítajú len raz, bez ohľadu na to, koľko ciest daný deň pokrýva.',
  // share-public
  'help.guide.share-public.title': 'Verejné zdieľanie cestovného denníka',
  'help.guide.share-public.goal': 'Poskytnite ľuďom bez účtu TREK odkaz len na čítanie.',
  'help.guide.share-public.step.1': 'Otvorte Nastavenia cestovného denníka a nájdite Verejné zdieľanie.',
  'help.guide.share-public.step.2': 'Kliknite na Vytvoriť odkaz na zdieľanie.',
  'help.guide.share-public.step.3':
    'Vyberte, čo návštevníci uvidia: Časová os, Galéria a Mapa sú samostatné prepínače. Kopírovať skopíruje odkaz do schránky.',
  'help.guide.share-public.result':
    'Ktokoľvek s odkazom uvidí zapnuté sekcie a nič iné; polia, ktoré ste vypli v Poliach záznamu, zostanú skryté aj tam.',
  'help.guide.share-public.tip.1':
    'Fotky sa na verejnej mape zobrazia, len keď sú zapnuté Galéria aj Mapa; pri vypnutej Mape sa ich súradnice odstránia ešte predtým, ako opustia server.',
  'help.guide.share-public.tip.2': 'Zdieľanie ukončíte tak, že odkaz na tom istom mieste vymažete.',
  // contributors
  'help.guide.contributors.title': 'Spoločné písanie',
  'help.guide.contributors.goal': 'Umožnite spolucestujúcemu pridávať vlastné záznamy a fotky.',
  'help.guide.contributors.step.1': 'Otvorte Nastavenia cestovného denníka a prejdite k prispievateľom.',
  'help.guide.contributors.step.2':
    'Kliknite na Pozvať prispievateľa a vyhľadajte používateľa podľa mena alebo e-mailu.',
  'help.guide.contributors.step.3': 'Vyberte rolu a potvrďte.',
  'help.guide.contributors.result':
    'Cestovný denník sa objaví v jeho zozname a jeho záznamy ponesú jeho meno. Prispievateľa odoberiete cez × vedľa neho.',
  'help.guide.contributors.tip.1':
    'Prispievatelia sú určení pre ľudí na tejto inštancii TREK. Pre všetkých ostatných je tu verejný odkaz.',
  // studio
  'help.guide.studio.title': 'Zostavenie cestovného denníka ako fotoknihy',
  'help.guide.studio.goal': 'Premeňte denník na strany pripravené na tlač.',
  'help.guide.studio.step.1': 'V hlavičke kliknite na Studio. Návrhár sa otvorí nad cestovným denníkom.',
  'help.guide.studio.step.2':
    'Názov cestovného denníka vľavo na hornej lište slúži na návrat; vráti vás tam, kde ste boli.',
  'help.guide.studio.result':
    'Panel strán vľavo, dvojstrana na pracovnej ploche, vlastnosti vpravo. Automatické rozloženie zostaví knihu z vašich záznamov; Exportovať vytvorí PDF pripravené na tlač.',
  'help.guide.studio.tip.1': 'Studio potrebuje okno široké aspoň 1024 px a na telefóne nie je k dispozícii.',
  'help.guide.studio.tip.2':
    'Kniha preberá prístup cestovného denníka: kto môže denník čítať, môže ju otvoriť, a kto ho môže upravovať, môže ju ukladať.',
  // archive-journey
  'help.guide.archive-journey.title': 'Archivácia alebo odstránenie cestovného denníka',
  'help.guide.archive-journey.goal': 'Uzavrite dokončený cestovný denník alebo ho natrvalo odstráňte.',
  'help.guide.archive-journey.step.1': 'Otvorte Nastavenia cestovného denníka.',
  'help.guide.archive-journey.step.2':
    'Dole Archivovať cestu denník ukončí a označí ako archivovaný; Obnoviť cestu ho vráti späť. Vymazať ho po potvrdení odstráni so všetkými záznamami a fotkami.',
  'help.guide.archive-journey.result':
    'Archivovaný cestovný denník zostáva čitateľný a dá sa zdieľať; len sa už neotvára na dnešku.',
  'help.guide.archive-journey.tip.1':
    'Odstránenie nemožno vrátiť späť a nijako neovplyvní cesty, s ktorými bol denník prepojený.',
  'help.guide.archive-journey.tip.2': 'Titulná fotka, názov a podnadpis sa nachádzajú v tom istom dialógu, hore.',

  // ── Screen: journey-studio ─────────────────────────────────────────────────
  'help.ctx.journey-studio.title': 'Studio',
  'help.ctx.journey-studio.summary':
    'TREK Studio zostaví cestovný denník ako fotoknihu pripravenú na tlač. Otvára sa nad denníkom: panel strán a obsah vľavo, dvojstrana, na ktorej pracujete, v strede a jej vlastnosti vpravo. Automatické rozloženie vytvorí prvý návrh z vašich záznamov; potom už všetko môžete presúvať, orezávať a meniť štýl, pričom každý krok sa dá vrátiť späť.',
  'help.ctx.journey-studio.bullet.1':
    'Horná lišta: Späť na cestovný denník, Zobrazenie knihy, späť a znova, Formát strany, Automatické rozloženie a Exportovať. Značka Uložené vedľa názvu ukazuje, kedy je kniha uložená.',
  'help.ctx.journey-studio.bullet.2':
    'Panel vľavo s piatimi sekciami: Strany, Obsah (fotky a záznamy cestovného denníka), Prvky (text, tvary, čiary, mriežky, rámčeky, ikony), Cesta (mapy, krajiny, vlajky a značky vytvorené z cestovného denníka) a Rozloženia.',
  'help.ctx.journey-studio.bullet.3':
    'Pracovná plocha: aktuálna dvojstrana so spadávkou a bezpečnými okrajmi, pod ňou lišta priblíženia, Prispôsobiť pohľadu a vpravo Stiahnuť túto dvojstranu.',
  'help.ctx.journey-studio.bullet.4':
    'Vlastnosti vpravo: poloha a veľkosť, orezanie a ohnisko, vyplnenie alebo prispôsobenie, vzhľad, rohy, rámček, poradie vrstiev a zamknutie vybraného prvku; keď nie je vybraté nič, čísla strán a dokument.',
  'help.ctx.journey-studio.bullet.5':
    'Kniha má tvar viazanej knihy: obálka, samostatná prvá strana, dvojstrany, samostatná posledná strana a zadná obálka. Čísla strán sa počítajú od prvej strany a tlačia sa tak, ako sú zobrazené.',
  'help.ctx.journey-studio.bullet.6':
    'Navrhovať môže naraz viac ľudí: každý vidí kurzory ostatných s ich menami a uloženie verzie, ktorú medzitým zmenil niekto iný, sa vráti ako konflikt namiesto prepísania jeho práce.',
  // studio-auto-layout
  'help.guide.studio-auto-layout.title': 'Automatické zostavenie knihy',
  'help.guide.studio-auto-layout.goal': 'Získajte jedným kliknutím kompletný prvý návrh zo záznamov a fotiek denníka.',
  'help.guide.studio-auto-layout.step.1': 'Na hornej lište kliknite na Automatické rozloženie.',
  'help.guide.studio-auto-layout.step.2':
    'Vyberte Celá kniha: nahradí každú stranu a zachová váš názov aj nastavenie strán. Táto dvojstrana znova zostaví len tú, ktorá je na obrazovke, a ponúka sa pri dvojstrane, ktorá vznikla zo záznamu.',
  'help.guide.studio-auto-layout.step.3':
    'Prezrite si panel strán. Ak sa vám viac páčil pôvodný stav, Vrátiť späť zruší celé rozloženie naraz.',
  'help.guide.studio-auto-layout.result':
    'Jedna dvojstrana na záznam, v poradí, s fotkami, názvom a príbehom rozmiestnenými za vás. Každý prvok sleduje svoj záznam, kým ho neupravíte.',
  'help.guide.studio-auto-layout.tip.1':
    'Obe možnosti sú bežné kroky, ktoré sa dajú vrátiť späť, takže ich pokojne vyskúšajte.',
  'help.guide.studio-auto-layout.tip.2':
    'Prvok, ktorý automatické rozloženie previazalo so záznamom, preberá úpravy tohto záznamu, kým ho nezmeníte vo Vlastnostiach; tým sa prepojenie preruší.',
  // studio-pages
  'help.guide.studio-pages.title': 'Pridávanie, presúvanie a odstraňovanie dvojstrán',
  'help.guide.studio-pages.goal': 'Tvarujte knihu stranu po strane.',
  'help.guide.studio-pages.step.1':
    'V paneli otvorte Strany. Náhľady predstavujú knihu v poradí: obálka, prvá strana, dvojstrany, posledná strana, zadná obálka.',
  'help.guide.studio-pages.step.2':
    'Pridať dvojstranu dole vloží novú pred poslednú stranu; + medzi dvoma náhľadmi vloží jednu presne tam.',
  'help.guide.studio-pages.step.3':
    'Po prejdení myšou nad náhľad sa zobrazia jeho akcie: Posunúť dopredu, Posunúť dozadu, Duplikovať dvojstranu a Odstrániť dvojstranu. Kliknutím na náhľad otvoríte danú dvojstranu na pracovnej ploche.',
  'help.guide.studio-pages.result':
    'Obálka, prvá a posledná strana a zadná obálka zostávajú na svojom mieste; nové dvojstrany vždy pribudnú medzi ne.',
  'help.guide.studio-pages.tip.1':
    'Zobrazenie knihy na hornej lište ukáže celú knihu ako hárky, tak ako bude zviazaná.',
  'help.guide.studio-pages.tip.2': 'Čísla strán sa zapínajú v časti Dokument vo Vlastnostiach, keď nie je nič vybraté.',
  // studio-layouts
  'help.guide.studio-layouts.title': 'Použitie rozloženia na dvojstranu',
  'help.guide.studio-layouts.goal': 'Dajte dvojstrane hotové usporiadanie rámčekov pre fotky a text.',
  'help.guide.studio-layouts.step.1':
    'V paneli otvorte Rozloženia. Trinásť rozložení dvojstrán a samostatná sada pre obálku, zadnú stranu a jednotlivé strany.',
  'help.guide.studio-layouts.step.2':
    'Kliknite na jedno z nich. Dvojstrana na pracovnej ploche prevezme jeho rámčeky; fotky a text, ktoré ste už mali, sa do nich prelejú.',
  'help.guide.studio-layouts.result':
    'Prázdne rámčeky čakajú na obsah: presuňte na niektorý fotku z Obsahu alebo použite Pridať na túto stranu.',
  'help.guide.studio-layouts.tip.1': 'Rozloženie je krok, ktorý sa dá vrátiť späť ako ktorýkoľvek iný.',
  // studio-content
  'help.guide.studio-content.title': 'Umiestnenie fotiek a záznamov na stranu',
  'help.guide.studio-content.goal': 'Preneste vlastný materiál cestovného denníka na dvojstranu.',
  'help.guide.studio-content.step.1':
    'V paneli otvorte Obsah. Fotky obsahujú každý obrázok cestovného denníka; Záznamy obsahujú záznamy s ich textom.',
  'help.guide.studio-content.step.2':
    'Presuňte fotku na dvojstranu alebo do prázdneho rámčeka, prípadne pod ňou kliknite na Pridať na túto stranu. Nahrať fotky pridá obrázky, ktoré v cestovnom denníku ešte nie sú.',
  'help.guide.studio-content.step.3':
    'Pod záznamom Názov, Príbeh a Miesto umiestnia daný text na stranu ako textový prvok; Dátum a súradnice sa pridajú ako značky a fotky záznamu sú uvedené priamo tam.',
  'help.guide.studio-content.result':
    'Pustená fotka sa stane fotografickým prvkom; text sleduje záznam, kým ho neupravíte.',
  'help.guide.studio-content.tip.1': 'Vyhľadávacie pole v hornej časti Obsahu filtruje oba zoznamy.',
  'help.guide.studio-content.tip.2': 'Súbor pretiahnutý z počítača na pracovnú plochu sa naraz nahrá aj umiestni.',
  // studio-elements
  'help.guide.studio-elements.title': 'Pridanie textu, tvarov a ikon',
  'help.guide.studio-elements.goal': 'Ozdobte dvojstranu aj niečím iným než fotkami a príbehmi.',
  'help.guide.studio-elements.step.1': 'V paneli otvorte Prvky.',
  'help.guide.studio-elements.step.2':
    'Kliknite na štýl textu pre nadpis alebo popisok, na tvar, čiaru, mriežku, prázdny rámček so štýlom rámčeka alebo na ikonu z prehľadávateľnej knižnice. Každý prvok sa objaví v strede dvojstrany, pripravený na presunutie.',
  'help.guide.studio-elements.result':
    'Dvojitým kliknutím na textový prvok doň môžete písať; Vlastnosti obsahujú písmo, hrúbku, veľkosť, rozostupy a zarovnanie.',
  'help.guide.studio-elements.tip.1': 'Rámčeky sú prázdne miesta pre fotky: obrázok do nich môžete vložiť neskôr.',
  // studio-travel
  'help.guide.studio-travel.title': 'Pridanie mapy, vlajok a údajov',
  'help.guide.studio-travel.goal': 'Premeňte samotný cestovný denník na údaje na strane.',
  'help.guide.studio-travel.step.1': 'V paneli otvorte Cesta.',
  'help.guide.studio-travel.step.2':
    'Vyberte, čo pridať: mapu trasy záznamov, obrysy krajín, zoznam alebo mriežku krajín, vlajky, značku dátumu, dňa alebo vzdialenosti, alebo súhrn celej cesty. Každý prvok sa vytvorí z údajov cestovného denníka a aktualizuje sa spolu s nimi.',
  'help.guide.studio-travel.result':
    'Prvok sa objaví na dvojstrane; vo Vlastnostiach upravíte jeho štýl a pri mape aj jej oblasť.',
  'help.guide.studio-travel.tip.1':
    'Značky sledujú záznam, z ktorého dvojstrana vznikla, takže značka dátumu na automaticky zostavenej dvojstrane už ukazuje daný deň.',
  // studio-properties
  'help.guide.studio-properties.title': 'Úprava vybraného prvku',
  'help.guide.studio-properties.goal': 'Presúvajte, orezávajte, upravujte štýl a poradie prvku pomocou inšpektora.',
  'help.guide.studio-properties.step.1':
    'Kliknite na prvok na dvojstrane. Objavia sa úchyty na zmenu veľkosti a otočenie; presuniete ho ťahaním.',
  'help.guide.studio-properties.step.2':
    'Vlastnosti vpravo sa riadia výberom: poloha a veľkosť, Orezať s ohniskom, ktoré určuje, čo zostane v zábere, Vyplniť alebo Prispôsobiť, filtre v časti Vzhľad, zaoblenie v časti Roh, štýl v časti Rámček, poradie vrstiev a Zamknúť.',
  'help.guide.studio-properties.step.3':
    'Duplikovať a Vymazať nájdete v hornej časti inšpektora; Vrátiť späť na hornej lište zruší ktorúkoľvek z týchto zmien.',
  'help.guide.studio-properties.result':
    'Zamknutý prvok sa už na strane nedá uchopiť, takže hotové rozloženie zostane v bezpečí, kým pracujete okolo neho.',
  'help.guide.studio-properties.tip.1':
    'Kliknutím so stlačeným Shift vyberiete viac prvkov; inšpektor ich potom upravuje spoločne.',
  'help.guide.studio-properties.tip.2':
    'Úprava prvku, ktorý umiestnilo automatické rozloženie, preruší jeho prepojenie so záznamom; neskoršie zmeny tohto záznamu už nesleduje.',
  // studio-format
  'help.guide.studio-format.title': 'Výber formátu strany',
  'help.guide.studio-format.goal':
    'Nastavte veľkosť, v ktorej sa kniha vytlačí, skôr než od nej bude závisieť rozloženie.',
  'help.guide.studio-format.step.1': 'Na hornej lište kliknite na Formát strany.',
  'help.guide.studio-format.step.2':
    'Vyberte Štvorec 21 × 21 cm, Štvorec 30 × 30 cm, A4 alebo A5 na šírku či na výšku, alebo zadajte vlastnú šírku a výšku v milimetroch. Spadávka a bezpečný okraj sú pod tým.',
  'help.guide.studio-format.result':
    'Každá dvojstrana sa vykreslí v tejto veľkosti, predvolene so spadávkou 3 mm a bezpečným okrajom 5 mm.',
  'help.guide.studio-format.tip.1':
    'Najprv zmeňte formát a potom spustite Automatické rozloženie; rozloženie sa vytvorí pre veľkosť, ktorú nájde.',
  'help.guide.studio-format.tip.2':
    'Opýtajte sa svojej tlačiarne na hodnoty spadávky a bezpečného okraja a zadajte ich.',
  // studio-export
  'help.guide.studio-export.title': 'Export knihy do PDF',
  'help.guide.studio-export.goal': 'Získajte súbor pripravený na tlač alebo na čítanie na obrazovke.',
  'help.guide.studio-export.step.1': 'Na hornej lište kliknite na Exportovať.',
  'help.guide.studio-export.step.2':
    'Vyberte Jednotlivé strany, teda jeden list na hárok v poradí čítania, čo vyžaduje tlačiareň, alebo Dvojstrany, teda dve strany naraz tak, ako sa kniha otvára. Orezové značky pridajú spadávku na každom okraji a označia, kde rezať.',
  'help.guide.studio-export.step.3':
    'Kliknite na Náhľad tlače. Prehliadač otvorí strany a Uložiť ako PDF z nich vytvorí súbor.',
  'help.guide.studio-export.result':
    'PDF s toľkými hárkami, koľko ohlásil dialóg, vo formáte strany, ktorý ste nastavili.',
  'help.guide.studio-export.tip.1': 'Vytvorenie PDF funguje, rovnako ako samotné Studio, len na počítači.',
  'help.guide.studio-export.tip.2':
    'Na korektúru exportujte Dvojstrany bez orezových značiek; pre tlačiareň Jednotlivé strany s nimi.',
  // studio-spread-file
  'help.guide.studio-spread-file.title': 'Opätovné použitie dvojstrany v inej knihe',
  'help.guide.studio-spread-file.goal':
    'Preneste dizajn, ktorý sa vám páči, z knihy jedného cestovného denníka do inej.',
  'help.guide.studio-spread-file.step.1':
    'Keď je dvojstrana na pracovnej ploche, kliknite na Stiahnuť túto dvojstranu na pravom konci lišty priblíženia. Súbor obsahuje dizajn, nie fotografie.',
  'help.guide.studio-spread-file.step.2':
    'V druhej knihe otvorte Strany, kliknite na Importovať vedľa Pridať dvojstranu a vyberte súbor.',
  'help.guide.studio-spread-file.result':
    'Dvojstrana sa pridá aj s rámčekmi a štýlmi textu; vložte do rámčekov fotky nového cestovného denníka.',
  'help.guide.studio-spread-file.tip.1': 'Súbor, ktorý nie je dizajnom dvojstrany, sa odmietne aj s uvedením dôvodu.',

  // ── Screen: settings (all tabs) ────────────────────────────────────────────
  'help.ctx.settings.title': 'Nastavenia',
  'help.ctx.settings.summary':
    'Vaše osobné nastavenia, jedna karta na každú tému v bočnom paneli vľavo. Väčšina prepínačov platí hneď po prepnutí; formulár s tlačidlom Uložiť dole čaká na jeho stlačenie. Nič tu nemení TREK nikoho iného.',
  'help.ctx.settings.bullet.1':
    'Bočný panel vľavo: Všeobecné, Vzhľad, Mapa, Oznámenia, Integrácie, Offline a Účet. Pluginy sa zobrazia, keď je nejaký nainštalovaný, O aplikácii všade tam, kde ho prevádzkovateľ neodstránil.',
  'help.ctx.settings.bullet.2':
    'Všeobecné zahŕňa jazyk, jednotky, menu a to, čím sa aplikácia otvorí; Vzhľad motív, farby, veľkosť písma a widgety na prehľade.',
  'help.ctx.settings.bullet.3':
    'Mapa vyberá vykresľovač a jeho štýl; Oznámenia kanály, ktorými vás možno zastihnúť; Integrácie knižnice fotiek, API kľúče a MCP; Offline to, čo aplikácia uchováva v tomto zariadení.',
  'help.ctx.settings.bullet.4':
    'Účet obsahuje váš profil, heslo, dvojfaktorové overenie, prístupové kľúče a zmazanie účtu.',
  'help.ctx.settings-display.title': 'Všeobecné',
  'help.ctx.settings-display.summary':
    'Jazyk, jednotky a mena, správanie mapy a rezervácií a to, čím sa TREK otvorí. Každá zmena tu platí okamžite.',
  'help.ctx.settings-display.bullet.1':
    'Jazyk a región: jazyk rozhrania, formát času, prvý deň týždňa, zobrazovaná mena a jednotky vzdialenosti a teploty.',
  'help.ctx.settings-display.bullet.2':
    'Cestovanie a mapa: trasy rezervácií vždy na mape, tlačidlo Objavovať miesta, optimalizácia trasy od ubytovania, skryté rezervačné kódy a popisky trás rezervácií.',
  'help.ctx.settings-display.bullet.3':
    'Spustenie: či sa TREK otvorí na prehľade alebo na aktívnej ceste a ktorá karta cesty sa zobrazí ako prvá.',
  'help.ctx.settings-appearance.title': 'Vzhľad',
  'help.ctx.settings-appearance.summary':
    'Ako TREK vyzerá v tomto účte: svetlý alebo tmavý režim, farba akcentu, sklo a pohyb, veľkosť písma a ktoré widgety sa zobrazujú na prehľade. Všetko sa uplatní okamžite na každom zariadení, na ktorom sa prihlásite.',
  'help.ctx.settings-appearance.bullet.1':
    'Motív: Svetlé, Tmavý alebo Automatické a Farebná schéma s možnosťou Vlastný akcent.',
  'help.ctx.settings-appearance.bullet.2':
    'Čitateľnosť: Priehľadnosť, Obmedziť pohyb, Hustota a Veľkosť písma s rozšírenými veľkosťami pre jednotlivé úrovne.',
  'help.ctx.settings-appearance.bullet.3':
    'Widgety na prehľade: jeden prepínač pre každý widget, zvlášť pre Počítač a Mobil.',
  'help.ctx.settings-appearance.bullet.4': 'Obnoviť predvolené dole vráti všetko do pôvodného stavu.',
  'help.ctx.settings-map.title': 'Mapa',
  'help.ctx.settings-map.summary':
    'Ktorý engine kreslí mapy a v akom štýle. Leaflet je klasická rastrová mapa, MapLibre kreslí vektorové dlaždice bez tokenu, Mapbox pridáva 3D budovy a terén s vaším vlastným tokenom.',
  'help.ctx.settings-map.bullet.1':
    'Poskytovateľ mapy: Leaflet, MapLibre alebo Mapbox, každý s riadkom o tom, čo potrebuje.',
  'help.ctx.settings-map.bullet.2':
    'Štýl mapy a Šablóna mapy: vzhľad dlaždíc plus token alebo kľúč, ktorý poskytovateľ vyžaduje.',
  'help.ctx.settings-map.bullet.3':
    'Režim vysokej kvality pre vyhladzovanie hrán a projekciu glóbusu; Uložiť nastavenia mapy výber uloží.',
  'help.ctx.settings-notifications.title': 'Oznámenia',
  'help.ctx.settings-notifications.summary':
    'Kde vás TREK zastihne mimo aplikácie: push oznámenia v tomto zariadení, téma ntfy, webhook alebo kanál, ktorý poskytuje plugin. Pod kanálmi jeden riadok pre každú udalosť určuje, čo kam ide.',
  'help.ctx.settings-notifications.bullet.1':
    'ntfy: téma, voliteľný vlastný server a voliteľný prístupový token, s tlačidlom Testovať na okamžité odoslanie skúšobnej správy.',
  'help.ctx.settings-notifications.bullet.2':
    'Webhook: jedna URL adresa, ktorá prijíma každú udalosť ako JSON, s tlačidlom Testovať.',
  'help.ctx.settings-notifications.bullet.3':
    'Push oznámenia v tomto zariadení: Zapnúť pre toto zariadenie platí len pre prehliadač, ktorý práve používate, preto to zopakujte na každom telefóne alebo počítači. Odoslať test príde na všetky.',
  'help.ctx.settings-notifications.bullet.4':
    'Riadky predvolieb: pre každú udalosť určujú, ktorý kanál je zapnutý. Kanály pluginov zobrazujú Nastaviť, kým nie sú nastavené.',
  'help.ctx.settings-integrations.title': 'Integrácie',
  'help.ctx.settings-integrations.summary':
    'Všetko, čo sa k TREK pripája zvonku: knižnice fotiek pre denník, API kľúče pre skripty a MCP endpoint s tokenmi a OAuth klientmi pre AI asistentov.',
  'help.ctx.settings-integrations.bullet.1':
    'Poskytovatelia fotiek: Immich a Synology Photos, každý so svojou URL a kľúčom, Otestovať pripojenie a Uložiť.',
  'help.ctx.settings-integrations.bullet.2':
    'API kľúče: osobné kľúče pre skripty a iné nástroje, ktoré volajú TREK API vo vašom mene.',
  'help.ctx.settings-integrations.bullet.3':
    'Konfigurácia MCP: endpoint, hotová konfigurácia klienta na skopírovanie a API tokeny.',
  'help.ctx.settings-integrations.bullet.4':
    'Klienti OAuth 2.1: aplikácie, ktoré sa prihlasujú cez TREK, s presmerovacími URI, povolenými oprávneniami, strojovými klientmi a aktívnymi reláciami.',
  'help.ctx.settings-offline.title': 'Offline',
  'help.ctx.settings-offline.summary':
    'Čo TREK uchováva v tomto zariadení, aby sa cesta otvorila aj bez pripojenia, a čo sa stane, keď sa zmena urobená offline stretne so zmenou urobenou inde.',
  'help.ctx.settings-offline.bullet.1':
    'Offline režim: Vynútiť offline režim prinúti aplikáciu správať sa, akoby sieť nebola dostupná, napríklad na testovanie alebo pri meranom pripojení.',
  'help.ctx.settings-offline.bullet.2':
    'Príprava na offline: Stiahnuť pre offline použitie hneď stiahne vaše cesty a ich mapové dlaždice.',
  'help.ctx.settings-offline.bullet.3':
    'Čo ukladať offline: mapové dlaždice zapnuté alebo vypnuté a prepínač pre každú cestu.',
  'help.ctx.settings-offline.bullet.4':
    'Konflikty synchronizácie a Offline vyrovnávacia pamäť: stratégia pri kolíziách, počty čakajúcich a neúspešných zmien, Synchronizovať teraz a Vymazať vyrovnávaciu pamäť.',
  'help.ctx.settings-account.title': 'Účet',
  'help.ctx.settings-account.summary':
    'Kto ste v tejto inštancii TREK a ako sa prihlasujete: profil a avatar, heslo, dvojfaktorové overenie, prístupové kľúče a úplne dole zmazanie účtu.',
  'help.ctx.settings-account.bullet.1': 'Profil: používateľské meno, e-mail a avatar, uložené cez Uložiť profil.',
  'help.ctx.settings-account.bullet.2': 'Zmeniť heslo: aktuálne heslo, dvakrát nové heslo, Aktualizovať heslo.',
  'help.ctx.settings-account.bullet.3':
    'Dvojfaktorové overenie (2FA) s autentifikačnou aplikáciou a záložnými kódmi; Prístupové kľúče na prihlásenie bez hesla.',
  'help.ctx.settings-account.bullet.4':
    'Zmazať účet úplne dole, s potvrdením. Posledný administrátor nemôže zmazať sám seba.',
  // language-region
  'help.guide.language-region.title': 'Nastavenie jazyka, jednotiek a meny',
  'help.guide.language-region.goal': 'Nech TREK hovorí vaším jazykom a počíta tak ako vy.',
  'help.guide.language-region.step.1':
    'V časti Jazyk a región vyberte jazyk rozhrania. TREK sa prepne okamžite na každom zariadení, na ktorom sa prihlásite.',
  'help.guide.language-region.step.2':
    'Pod ním vyberte formát času, deň, ktorým začína týždeň vo všetkých výberoch dátumu, zobrazovanú menu a jednotky vzdialenosti a teploty.',
  'help.guide.language-region.result':
    'Dátumy, vzdialenosti a peniaze sa zobrazujú tak, ako očakávate; vlastná mena cesty sa stále zobrazuje vedľa prepočítaných súm.',
  'help.guide.language-region.tip.1':
    'Zobrazovaná mena slúži na súčty naprieč cestami; každá cesta si ponecháva menu, ktorú ste jej zadali.',
  'help.guide.language-region.tip.2': 'Jazyk nastavuje aj názvy dní a mesiacov v module Dovolenka (Vacay) a v denníku.',
  // travel-map-prefs
  'help.guide.travel-map-prefs.title': 'Nastavenie správania mapy a rezervácií',
  'help.guide.travel-map-prefs.goal': 'Rozhodnite, čo mapa cesty predvolene zobrazuje.',
  'help.guide.travel-map-prefs.step.1':
    'V časti Cestovanie a mapa Vždy zobrazovať trasy rezervácií ponechá lety a vlaky na mape, aj keď ich deň nie je otvorený; Objavovať miesta na mape zobrazí tlačidlo na hľadanie miest; Optimalizovať trasu od ubytovania začne trasu tam, kde spíte.',
  'help.guide.travel-map-prefs.step.2':
    'Skryť rezervačné kódy skryje potvrdzovacie čísla, kým na ne neprejdete myšou; Popisky trás rezervácií vypíšu názov rezervácie pozdĺž jej trasy.',
  'help.guide.travel-map-prefs.result': 'Mapa sa nimi riadi pri každej ceste, kým ich znova neprepnete.',
  'help.guide.travel-map-prefs.tip.1':
    'Tieto nastavenia platia pre účet, nie pre cestu. Každý člen zdieľanej cesty vidí svoje vlastné voľby.',
  // startup
  'help.guide.startup.title': 'Výber, čím sa TREK otvorí',
  'help.guide.startup.goal': 'Dostaňte sa tam, kde najviac pracujete, a nie zakaždým na prehľad.',
  'help.guide.startup.step.1': 'V časti Spustenie nastavte Úvodná stránka na Prehľad alebo Aktívna cesta.',
  'help.guide.startup.step.2': 'Úvodná karta určuje, ktorá karta cesty sa zobrazí ako prvá, keď cestu otvoríte.',
  'help.guide.startup.result': 'Pri ďalšom prihlásení a ďalšom ťuknutí na logo sa dostanete priamo tam.',
  'help.guide.startup.tip.1':
    'Aktívna cesta znamená cestu, ktorá dnes prebieha, alebo najbližšiu nasledujúcu, ak žiadna neprebieha.',
  // theme-scheme
  'help.guide.theme-scheme.title': 'Nastavenie motívu a farby akcentu',
  'help.guide.theme-scheme.goal': 'Nastavte TREK na svetlý, tmavý alebo podľa zariadenia, vo farbe, ktorá sa vám páči.',
  'help.guide.theme-scheme.step.1':
    'V časti Motív vyberte Svetlé, Tmavý alebo Automatické. Automatické sa riadi vaším zariadením.',
  'help.guide.theme-scheme.step.2':
    'Vyberte Farebnú schému: Predvolené, Vysoký kontrast, Indigová, Zelenomodrá, Ružová, Jantárová, Fialová alebo Vlastné.',
  'help.guide.theme-scheme.step.3':
    'Pri možnosti Vlastné vyberte akcent z predvolieb alebo zadajte vlastný. Kontrola kontrastu vedľa neho ukáže, či na ňom zostane text čitateľný.',
  'help.guide.theme-scheme.result':
    'Tlačidlá, odkazy a zvýraznenia všade preberú akcent, na každom zariadení, na ktorom sa prihlásite.',
  'help.guide.theme-scheme.tip.1':
    'Navigačná lišta má aj rýchly prepínač svetlého a tmavého režimu; nastavuje ten istý motív.',
  'help.guide.theme-scheme.tip.2': 'Vysoký kontrast je vhodná schéma, keď sa predvolená číta príliš nevýrazne.',
  // readability
  'help.guide.readability.title': 'Úprava čitateľnosti a veľkosti písma',
  'help.guide.readability.goal': 'Menej skla, menej pohybu, viac priestoru alebo väčšie písmo.',
  'help.guide.readability.step.1':
    'V časti Čitateľnosť Priehľadnosť zmení sklenené panely na plné plochy, Obmedziť pohyb obmedzí animácie a Hustota vyberá medzi Pohodlná a Kompaktná.',
  'help.guide.readability.step.2':
    'Veľkosť písma s možnosťou Všetko zmení mierku všetkého naraz; Rozšírené veľkosti textu umožnia nastaviť nadpisy, podnadpisy, hlavný text a popisky zvlášť.',
  'help.guide.readability.result': 'Celá aplikácia sa prispôsobí okamžite, vrátane panelov mapy a denníka.',
  'help.guide.readability.tip.1': 'Obmedziť pohyb sa riadi aj nastavením vášho systému, ak ho necháte tak.',
  'help.guide.readability.tip.2':
    'Veľkosť písma sa uplatňuje cez typografické úrovne, takže sa nič neoreže; veľkosť, ktorá sa už nezmestí, sa zalomí.',
  // dashboard-widgets
  'help.guide.dashboard-widgets.title': 'Výber widgetov na prehľade',
  'help.guide.dashboard-widgets.goal': 'Zobrazte len widgety, ktoré používate, zvlášť na počítači a na telefóne.',
  'help.guide.dashboard-widgets.step.1':
    'V časti Widgety na prehľade zapnite alebo vypnite každý widget pre Počítač a pre Mobil: pravý bočný panel ako celok, menu, zbierky, časové pásma, nadchádzajúce rezervácie, krajiny Atlasu a cestovné štatistiky.',
  'help.guide.dashboard-widgets.step.2': 'Obnoviť predvolené dole vráti celú kartu do pôvodného stavu.',
  'help.guide.dashboard-widgets.result':
    'Prehľad sa okamžite preusporiada; s vypnutým pravým bočným panelom sa vycentruje.',
  'help.guide.dashboard-widgets.tip.1': 'Widgety doplnku sa zobrazia, len kým má administrátor daný doplnok zapnutý.',
  'help.guide.dashboard-widgets.tip.2':
    'Samotný prehľad si pre každé zariadenie pamätá zobrazenie mriežky alebo zoznamu a poradie triedenia.',
  // map-provider
  'help.guide.map-provider.title': 'Výber mapového enginu a štýlu',
  'help.guide.map-provider.goal': 'Prepínajte medzi klasickou mapou, vektorovými dlaždicami a 3D mapou od Mapboxu.',
  'help.guide.map-provider.step.1':
    'V časti Poskytovateľ mapy zvoľte Leaflet pre klasickú 2D mapu s ľubovoľnými rastrovými dlaždicami, MapLibre pre vektorové dlaždice OpenFreeMap bez tokenu alebo Mapbox pre vektorové dlaždice s 3D budovami a terénom.',
  'help.guide.map-provider.step.2':
    'Pre vzhľad vyberte Štýl mapy alebo Šablónu mapy. Mapbox potrebuje Mapbox prístupový token, niektoré rastrové štýly CARTO API kľúč; odkaz vedľa poľa vás zavedie tam, kde ho získate.',
  'help.guide.map-provider.step.3':
    'Režim vysokej kvality pridá vyhladzovanie hrán a projekciu glóbusu. Kliknite na Uložiť nastavenia mapy.',
  'help.guide.map-provider.result':
    'Každú mapu v TREK, teda cesty, Atlas, Zbierky aj denník, vykresľuje engine, ktorý ste vybrali.',
  'help.guide.map-provider.tip.1': 'Bez tokenu sa Mapbox vráti k predvolenej mape, namiesto toho, aby nezobrazil nič.',
  'help.guide.map-provider.tip.2':
    'Mapové dlaždice, ktoré ukladáte offline, pochádzajú od poskytovateľa, ktorý je aktívny v čase sťahovania.',
  // notification-channels
  'help.guide.notification-channels.title': 'Nastavenie, kam vám budú chodiť oznámenia',
  'help.guide.notification-channels.goal':
    'Dostávajte pripomienky ciest a udalosti spolupráce do telefónu alebo do iného nástroja.',
  'help.guide.notification-channels.step.1':
    'V časti Oznámenia vyplňte Téma Ntfy; ak prevádzkujete vlastný server, pridajte URL servera Ntfy a prístupový token. Testovať hneď odošle správu.',
  'help.guide.notification-channels.step.2':
    'Alebo zadajte URL webhooku, ktorá prijíma každú udalosť ako JSON, a rovnako ju otestujte cez Testovať.',
  'help.guide.notification-channels.step.3':
    'V riadkoch nižšie zapnite alebo vypnite každú udalosť pre jednotlivé kanály. Kanál pluginu zobrazuje Nastaviť, kým nie je nastavený v nastaveniach pluginu; Odoslať test ho vyskúša.',
  'help.guide.notification-channels.result':
    'Udalosti sa odosielajú cez zapnuté kanály. Zvonček na navigačnej lište ich v aplikácii zobrazuje bez ohľadu na to.',
  'help.guide.notification-channels.tip.1':
    'Predvoľby pre jednotlivé cesty sa nachádzajú priamo v ceste, v jej nastaveniach oznámení.',
  'help.guide.notification-channels.tip.2':
    'Administrátor môže pre všetkých predvyplniť predvolený server ntfy; vlastnú tému si však vyberáte sami.',
  // photo-providers
  'help.guide.photo-providers.title': 'Pripojenie knižnice fotiek',
  'help.guide.photo-providers.goal': 'Nechajte denník načítať fotky daného dňa z Immich alebo Synology Photos.',
  'help.guide.photo-providers.step.1':
    'V časti Integrácie nájdite sekciu poskytovateľa a zadajte jeho URL a API kľúč. Immich ponúka aj zrkadlenie nahraných súborov cestovného denníka späť do knižnice.',
  'help.guide.photo-providers.step.2': 'Kliknite na Otestovať pripojenie a potom na Uložiť.',
  'help.guide.photo-providers.result':
    'Karta Externé fotky v editore záznamu prehľadáva pripojenú knižnicu pre deň záznamu, najprv fotky najbližšie k miestu záznamu.',
  'help.guide.photo-providers.tip.1':
    'Pripojenie je vaše: ostatní členovia cestovného denníka si pripájajú vlastné knižnice.',
  'help.guide.photo-providers.tip.2':
    'Poskytovateľ bez GPS údajov vo fotkách funguje tiež; zoznam je potom zoradený podľa času.',
  // api-keys
  'help.guide.api-keys.title': 'Vytvorenie API kľúča',
  'help.guide.api-keys.goal': 'Umožnite skriptu alebo inému nástroju volať TREK API vo vašom mene.',
  'help.guide.api-keys.step.1':
    'V časti API kľúče kliknite na Vytvoriť kľúč a dajte mu názov, z ktorého bude jasné, kde sa bude používať.',
  'help.guide.api-keys.step.2':
    'Skopírujte kľúč z dialógu: zobrazí sa len raz. Keď ho nástroj už nepotrebuje, odstráňte kľúč zo zoznamu.',
  'help.guide.api-keys.result':
    'Požiadavky s týmto kľúčom konajú s vašimi oprávneniami; zoznam ukazuje, kedy bol každý kľúč vytvorený a naposledy použitý.',
  'help.guide.api-keys.tip.1': 'Jeden kľúč na každý nástroj robí odvolanie bezbolestným.',
  'help.guide.api-keys.tip.2':
    'Pre AI asistenta namiesto toho použite MCP s OAuth; API kľúče sú pre bežných HTTP klientov.',
  // mcp-oauth
  'help.guide.mcp-oauth.title': 'Pripojenie AI asistenta cez MCP',
  'help.guide.mcp-oauth.goal': 'Poskytnite prístup k vašim cestám Claude, IDE alebo inému MCP klientovi.',
  'help.guide.mcp-oauth.step.1':
    'V časti Konfigurácia MCP skopírujte MCP endpoint alebo celú Konfiguráciu klienta pre klienta, ktorý prijíma úryvok JSON.',
  'help.guide.mcp-oauth.step.2':
    'Klienti, ktorí sa prihlasujú cez prehliadač, používajú OAuth 2.1: Nový klient v časti Klienti OAuth 2.1 s presmerovacími URI, povolenými oprávneniami a pre server bez prehliadača Strojový klient.',
  'help.guide.mcp-oauth.step.3':
    'Obnoviť tajný kľúč a Zmazať klienta sú pri každom klientovi; Aktívne relácie OAuth zobrazujú, čo je prihlásené, a umožňujú to odvolať. API tokeny s tlačidlom Vytvoriť nový token sú starší spôsob prístupu.',
  'help.guide.mcp-oauth.result':
    'Klient môže vo vašom mene čítať a meniť to, čo mu povoľujú jeho oprávnenia, a každá akcia sa zobrazí pod vaším menom.',
  'help.guide.mcp-oauth.tip.1':
    'Oprávnenia sú bezpečnostná sieť: dajte klientovi len oprávnenie na čítanie, kým nebude potrebovať viac.',
  'help.guide.mcp-oauth.tip.2': 'Administrátor môže MCP vypnúť pre celú inštanciu; potom táto sekcia chýba.',
  // offline-prepare
  'help.guide.offline-prepare.title': 'Príprava ciest na offline',
  'help.guide.offline-prepare.goal': 'Majte svoje cesty a ich mapy v tomto zariadení skôr, než vypadne pripojenie.',
  'help.guide.offline-prepare.step.1':
    'V časti Čo ukladať offline nechajte zapnuté Ukladať mapové dlaždice offline a zapnite cesty, ktoré chcete mať v tomto zariadení.',
  'help.guide.offline-prepare.step.2':
    'V časti Príprava na offline kliknite na Stiahnuť pre offline použitie. Stiahnu sa cesty a dlaždice okolo ich miest.',
  'help.guide.offline-prepare.step.3':
    'Vynútiť offline režim v časti Offline režim vám pred odchodom umožní skontrolovať, že je všetko k dispozícii.',
  'help.guide.offline-prepare.result':
    'Cesty sa otvoria bez pripojenia; zmeny, ktoré urobíte, čakajú vo fronte a odošlú sa po opätovnom pripojení.',
  'help.guide.offline-prepare.tip.1':
    'Najviac miesta zaberajú dlaždice: sekcia Offline vyrovnávacia pamäť ukazuje, čo je uložené, pre každú cestu.',
  'help.guide.offline-prepare.tip.2':
    'Pre najplynulejší offline štart si nainštalujte TREK ako aplikáciu z prehliadača.',
  // offline-conflicts
  'help.guide.offline-conflicts.title': 'Rozhodnutie, čo vyhrá pri konflikte synchronizácie',
  'help.guide.offline-conflicts.goal': 'Vyberte, ako TREK vyrieši zmenu urobenú offline oproti zmene urobenej inde.',
  'help.guide.offline-conflicts.step.1':
    'V časti Konflikty synchronizácie vyberte Vždy sa ma opýtať, Vždy zachovať moju verziu alebo Vždy zachovať verziu zo servera.',
  'help.guide.offline-conflicts.step.2':
    'Offline vyrovnávacia pamäť ukazuje cesty, čakajúce a neúspešné zmeny a konflikty; Synchronizovať teraz odošle frontu, Vymazať vyrovnávaciu pamäť vyprázdni zariadenie.',
  'help.guide.offline-conflicts.result':
    'Pri možnosti Vždy sa ma opýtať konflikt zobrazí obe verzie a nechá vás vybrať; pri ostatných dvoch sa vyrieši potichu.',
  'help.guide.offline-conflicts.tip.1':
    'Vymazať vyrovnávaciu pamäť odstráni len kópiu v tomto zariadení; na serveri sa ničoho nedotkne.',
  // profile
  'help.guide.profile.title': 'Zmena profilu',
  'help.guide.profile.goal': 'Aktualizujte svoje meno, e-mail a obrázok.',
  'help.guide.profile.step.1':
    'V časti Účet upravte Používateľské meno a E-mail. Ako avatar môžete nahrať vlastný obrázok; po jeho odstránení sa vrátia iniciály.',
  'help.guide.profile.step.2': 'Kliknite na Uložiť profil.',
  'help.guide.profile.result': 'Vaše meno a obrázok sa aktualizujú všade naraz, aj v cestách, ktoré zdieľate.',
  'help.guide.profile.tip.1':
    'Účet, ktorý sa prihlasuje cez OIDC, to tu uvádza; e-mail potom pochádza od poskytovateľa.',
  // password
  'help.guide.password.title': 'Zmena hesla',
  'help.guide.password.goal': 'Nastavte nové heslo.',
  'help.guide.password.step.1': 'V časti Zmeniť heslo zadajte aktuálne heslo a potom dvakrát nové.',
  'help.guide.password.step.2': 'Kliknite na Aktualizovať heslo.',
  'help.guide.password.result': 'Nové heslo platí od ďalšieho prihlásenia; ostatné relácie zostanú prihlásené.',
  'help.guide.password.tip.1': 'Účet, ktorý sa prihlasuje cez OIDC, nemá heslo TREK, ktoré by sa dalo zmeniť.',
  // mfa
  'help.guide.mfa.title': 'Zapnutie dvojfaktorového overenia',
  'help.guide.mfa.goal': 'Chráňte účet kódom z autentifikačnej aplikácie.',
  'help.guide.mfa.step.1': 'V časti Dvojfaktorové overenie (2FA) kliknite na Nastaviť autentifikačnú aplikáciu.',
  'help.guide.mfa.step.2':
    'Naskenujte QR kód aplikáciou alebo zadajte tajný kľúč ručne, potom napíšte šesťmiestny kód, ktorý zobrazí, a kliknite na Zapnúť 2FA.',
  'help.guide.mfa.step.3':
    'Uložte si záložné kódy: skopírujte, stiahnite alebo vytlačte ich. Každý funguje raz, keď nemáte telefón po ruke.',
  'help.guide.mfa.result': 'Každé prihlásenie si po hesle vyžiada kód.',
  'help.guide.mfa.tip.1': 'Vypnúť 2FA vyžaduje vaše heslo a aktuálny kód.',
  'help.guide.mfa.tip.2': 'Administrátor môže vyžadovať 2FA pre všetkých; potom ho tu nemožno vypnúť.',
  // passkeys
  'help.guide.passkeys.title': 'Prihlásenie prístupovým kľúčom',
  'help.guide.passkeys.goal': 'Namiesto hesla použite odtlačok prsta, tvár alebo PIN svojho zariadenia.',
  'help.guide.passkeys.step.1':
    'V časti Prístupové kľúče kliknite na Pridať prístupový kľúč a potvrďte to na zariadení. Pomenujte ho tak, aby bolo jasné, o ktoré zariadenie ide.',
  'help.guide.passkeys.step.2':
    'Zoznam ukazuje každý prístupový kľúč s názvom a časom posledného použitia; tlačidlom na odstránenie ho odstránite.',
  'help.guide.passkeys.result': 'Prihlasovacia stránka ponúkne prístupový kľúč; heslo zostane ako záloha.',
  'help.guide.passkeys.tip.1':
    'Prístupový kľúč je uložený v zariadení alebo v jeho správcovi hesiel, preto pridajte jeden pre každé zariadenie.',
  'help.guide.passkeys.tip.2':
    'Prístupové kľúče vyžadujú HTTPS; na inštancii s obyčajným HTTP sekcia vysvetlí, prečo nie sú k dispozícii.',
  // delete-account
  'help.guide.delete-account.title': 'Zmazanie účtu',
  'help.guide.delete-account.goal': 'Odstráňte svoj účet a údaje, ktoré patria len vám.',
  'help.guide.delete-account.step.1': 'Úplne dole v časti Účet kliknite na Zmazať účet a potvrďte.',
  'help.guide.delete-account.result':
    'Váš účet, vaše vlastné cesty a vaše cestovné denníky zmiznú; cesty, ktoré zdieľate s inými, im zostanú.',
  'help.guide.delete-account.tip.1':
    'Posledný administrátor inštancie nemôže zmazať sám seba; najprv urobte administrátorom niekoho iného.',
  'help.guide.delete-account.tip.2': 'Nedá sa to vrátiť späť. Pred potvrdením exportujte, čo si chcete ponechať.',

  // ── Screen: admin (all tabs) ───────────────────────────────────────────────
  'help.ctx.admin.title': 'Správca',
  'help.ctx.admin.summary':
    'Inštancia, na ktorej beží TREK pre všetkých: kto sa môže prihlásiť a ako, čo je zapnuté, kde sú uložené súbory, ako server kontaktuje ľudí a ako sa zálohuje. Túto stránku vidia len administrátori; každá karta je samostatná obrazovka v bočnom paneli.',
  'help.ctx.admin.bullet.1':
    'Štyri karty hore počítajú používateľov, cesty, miesta a súbory; banner nad nimi ohlasuje novšiu verziu TREK.',
  'help.ctx.admin.bullet.2':
    'Používatelia a Predvolené nastavenia používateľa: účty, pozývacie odkazy a nastavenia mapy, s ktorými nový účet začína.',
  'help.ctx.admin.bullet.3':
    'Personalizácia, Nastavenia, Doplnky a Pluginy: šablóny balenia, kategórie a školské prázdniny; metódy prihlásenia a API kľúče; funkčné moduly; pluginy tretích strán.',
  'help.ctx.admin.bullet.4':
    'Úložisko, Oznámenia, MCP prístup a GitHub: kam idú nahrané súbory, kanály pre celú inštanciu, tokeny a relácie AI klientov a história verzií.',
  'help.ctx.admin.bullet.5':
    'Zálohovanie a Audit: zálohy na požiadanie aj plánované zálohy a záznam udalostí dôležitých pre bezpečnosť.',
  'help.ctx.admin-users.title': 'Používatelia',
  'help.ctx.admin-users.summary':
    'Každý účet v tejto inštancii TREK s rolou, e-mailom a posledným prihlásením a pozývacie odkazy, cez ktoré sa ľudia môžu zaregistrovať na uzavretej inštancii.',
  'help.ctx.admin-users.bullet.1':
    'Tabuľka: používateľské meno, e-mail, rola, dátum vytvorenia, posledné prihlásenie a akcie v každom riadku. Váš riadok je označený slovom vy.',
  'help.ctx.admin-users.bullet.2': 'Vytvoriť používateľa hore pridá účet ručne, s heslom, ktoré mu odovzdáte.',
  'help.ctx.admin-users.bullet.3':
    'Pozývacie odkazy nižšie: jednorazové registračné odkazy s limitom použití, dátumom vypršania a podľa potreby aj s cestou, ku ktorej sa nový používateľ po príchode pripojí.',
  'help.ctx.admin-users.bullet.4':
    'Nastavenia oprávnení dole: pre každú akciu určujú, kto ju smie vykonať, teda Všetci, Členovia výletu, Vlastník výletu alebo Iba administrátor.',
  'help.ctx.admin-defaults.title': 'Predvolené nastavenia používateľa',
  'help.ctx.admin-defaults.summary':
    'Nastavenia, s ktorými nový účet začína, aby nikto nemusel najprv hľadať kartu mapy: poskytovateľ mapy, štýl, tokeny a kvalita.',
  'help.ctx.admin-defaults.bullet.1':
    'Poskytovateľ mapy, štýl a token Mapbox, kľúč CARTO a kvalita Mapbox, presne tak, ako by ich používateľ nastavil v časti Nastavenia, Mapa.',
  'help.ctx.admin-defaults.bullet.2':
    'Obnoviť na vstavanú predvolenú hodnotu pri každom poli vráti voľbu, ktorú má TREK vstavanú; vlastné nastavenie používateľa má pred týmito vždy prednosť.',
  'help.ctx.admin-config.title': 'Personalizácia',
  'help.ctx.admin-config.summary':
    'Čo zdieľajú všetky cesty v inštancii: šablóny balenia, sadu kategórií pre miesta a zbierky a katalóg školských prázdnin, z ktorého čerpá Dovolenka (Vacay).',
  'help.ctx.admin-config.bullet.1':
    'Šablóny balenia: pomenované zoznamy kategórií a položiek, z ktorých môže zoznam vecí cesty vychádzať.',
  'help.ctx.admin-config.bullet.2':
    'Kategórie: názov, ikona a farba kategórií používaných v celom TREK, od inšpektora miest až po Zbierky.',
  'help.ctx.admin-config.bullet.3':
    'Školské prázdniny: katalóg krajín a regiónov pre miesta, ktoré vstavané zdroje nepokrývajú.',
  'help.ctx.admin-settings.title': 'Nastavenia',
  'help.ctx.admin-settings.summary':
    'Ako sa ľudia dostanú dnu a s čím smie server komunikovať: metódy prihlásenia a registrácie, SSO, prístupové kľúče, pravidlá dvojfaktorového overenia, API kľúče pre mapy, miesta a obrázky, poskytovatelia vyhľadávania a verejnej dopravy a povolené typy nahrávaných súborov.',
  'help.ctx.admin-settings.bullet.1':
    'Metódy overenia: Prihlásenie heslom, Registrácia heslom, Prihlásenie cez SSO, Automatické vytváranie účtov SSO a Vyžadovať dvojfaktorové overenie (2FA).',
  'help.ctx.admin-settings.bullet.2':
    'Jednotné prihlásenie (OIDC) s vydavateľom, klientom a zobrazovaným názvom; Prihlásenie prístupovým kľúčom s ID spoliehajúcej sa strany (RP ID) a pôvodmi.',
  'help.ctx.admin-settings.bullet.3':
    'API kľúče: Google Maps, Unsplash a Amap, každý s tlačidlom Testovať; Na čo sa kľúč môže používať obmedzí kľúč Google na funkcie, za ktoré chcete platiť.',
  'help.ctx.admin-settings.bullet.4':
    'Poskytovateľ vyhľadávania miest a Poskytovateľ verejnej dopravy určujú, kto odpovedá na vyhľadávania a trasy; Povolené typy súborov obmedzujú nahrávanie.',
  'help.ctx.admin-addons.title': 'Doplnky',
  'help.ctx.admin-addons.summary':
    'Funkčné moduly TREK, každý s prepínačom: Balenie, Rozpočet, Dokumenty, Dovolenka (Vacay), Atlas, Spolupráca, Cestovný denník, Zbierky, Cesta autom, MCP, AirTrail, Dawarich a Spracovanie pomocou AI. Vypnuté znamená, že položka v navigácii, príslušné stránky aj API zmiznú pre všetkých.',
  'help.ctx.admin-addons.bullet.1':
    'Jedna dlaždica na doplnok s prepínačom a, ak nejaké má, s podriadenými riadkami pre jeho možnosti.',
  'help.ctx.admin-addons.bullet.2':
    'Poskytovatelia fotiek a dokumentov sa tu tiež zobrazujú ako dlaždice, takže Immich alebo Synology možno ponúknuť používateľom.',
  'help.ctx.admin-addons.bullet.3': 'Sledovanie batožiny má vlastný prepínač pod dlaždicami.',
  'help.ctx.admin-plugins.title': 'Pluginy',
  'help.ctx.admin-plugins.summary':
    'Pluginy tretích strán, ktoré bežia vo vlastnom procese vedľa TREK, každý s oprávneniami, o ktoré požiadal pri inštalácii. Inštalujte z katalógu, nahrajte balík alebo počas vývoja pripojte priečinok.',
  'help.ctx.admin-plugins.bullet.1':
    'Zoznam: každý nainštalovaný plugin s verziou, stavom, podpisom a oprávneniami, ktoré má; aktivácia, deaktivácia, aktualizácia alebo odinštalovanie v každom riadku.',
  'help.ctx.admin-plugins.bullet.2':
    'Nahrať plugin prijme súbor balíka; Znovu prehľadať načíta priečinok pluginu pripojený na vývoj.',
  'help.ctx.admin-plugins.bullet.3':
    'Povolení hostitelia pre každý plugin: adresy, ktoré plugin smie volať, keďže odchádzajúca komunikácia je predvolene zakázaná.',
  'help.ctx.admin-storage.title': 'Úložisko',
  'help.ctx.admin-storage.summary':
    'Kde sú uložené nahrané súbory: na lokálnom disku, v S3 buckete alebo v zrkadle, ktoré zapisuje do oboch. Každá kategória nahrávaných súborov môže ísť do iného backendu a Zdravie ukazuje, či odpovedá každý backend.',
  'help.ctx.admin-storage.bullet.1':
    'Backendy: názov a typ každého, s tlačidlami Testovať, Upraviť a Odobrať; backend nastavený cez prostredie je tu len na čítanie.',
  'help.ctx.admin-storage.bullet.2':
    'Kategórie: titulné obrázky, dokumenty, fotky cestovných denníkov a ostatné, každá priradená k backendu; pri zmene sa ponúkne presun existujúcich súborov.',
  'help.ctx.admin-storage.bullet.3':
    'Zdravie: kontrola pre každý backend a testovací súbor, ktorý dokazuje, že konfigurácia zodpovedá tomu, čo vidí server.',
  'help.ctx.admin-notifications.title': 'Oznámenia',
  'help.ctx.admin-notifications.summary':
    'Kanály, ktoré inštancia ponúka svojim používateľom, a tie, ktoré zastihnú vás ako administrátora. Používatelia si vlastné témy a URL vyberajú v Nastaveniach; vy rozhodujete, čo je k dispozícii, a nastavujete e-mail.',
  'help.ctx.admin-notifications.bullet.1':
    'V aplikácii, E-mail (SMTP), Ntfy, Webhook a Web Push: každý s vlastným panelom, s prepínačom, ktorý kanál ponúkne používateľom, a s konfiguráciou na strane servera, ktorú potrebuje.',
  'help.ctx.admin-notifications.bullet.2': 'Pripomienky ciest: či server posiela pripomienku pred začiatkom cesty.',
  'help.ctx.admin-notifications.bullet.3':
    'Admin Ntfy a Admin webhook: kam idú udalosti pre administrátora, napríklad neúspešná záloha alebo nová verzia, s tlačidlom Testovať.',
  'help.ctx.admin-mcp-tokens.title': 'MCP prístup',
  'help.ctx.admin-mcp-tokens.summary':
    'Každý token a každá OAuth relácia, ktoré majú AI klienti voči tejto inštancii TREK, naprieč všetkými používateľmi, s možnosťou ktorékoľvek z nich odvolať.',
  'help.ctx.admin-mcp-tokens.bullet.1': 'API tokeny: kto token vytvoril, kedy bol naposledy použitý, a Vymazať.',
  'help.ctx.admin-mcp-tokens.bullet.2':
    'OAuth relácie: klient, používateľ a oprávnenia, ktoré mu boli udelené, a Odvolať.',
  'help.ctx.admin-github.title': 'GitHub',
  'help.ctx.admin-github.summary':
    'Čo je v TREK nové: história verzií z GitHubu, verzia, ktorú používate, a či už vyšla novšia. Samotná aktualizácia prebieha mimo aplikácie, na hostiteľovi.',
  'help.ctx.admin-github.bullet.1':
    'História verzií uvádza vydania s poznámkami; najnovšie nesie označenie Najnovšia a vaša verzia je vyznačená.',
  'help.ctx.admin-github.bullet.2':
    'Dostupná aktualizácia sa zobrazí v hlavičke, keď existuje novšie vydanie, spolu s postupom aktualizácie pre Docker a iné inštalácie.',
  'help.ctx.admin-backup.title': 'Zálohovanie',
  'help.ctx.admin-backup.summary':
    'Úplné zálohy databázy a nahraných súborov, vytvorené ručne alebo podľa plánu, uchovávané na serveri a stiahnuteľné ako jeden súbor. Obnoviť jednu z nich vráti späť.',
  'help.ctx.admin-backup.bullet.1':
    'Záloha dát: Vytvoriť zálohu a zoznam existujúcich záloh s možnosťami Stiahnuť, Obnoviť a odstrániť.',
  'help.ctx.admin-backup.bullet.2': 'Nahrať zálohu prinesie súbor vytvorený na inej inštancii alebo v skorší deň.',
  'help.ctx.admin-backup.bullet.3':
    'Automatické zálohovanie: zapnuté alebo vypnuté, interval, hodina a deň a koľko záloh uchovať.',
  'help.ctx.admin-audit.title': 'Audit',
  'help.ctx.admin-audit.summary':
    'Záznam udalostí dôležitých pre bezpečnosť a správu: prihlásenia a neúspešné pokusy, zmeny MFA, zmeny používateľov a nastavení, zálohy a obnovenia. Len na čítanie, najnovšie ako prvé.',
  'help.ctx.admin-audit.bullet.1':
    'Jeden riadok pre každú udalosť s časom, používateľom, akciou, prostriedkom, IP a podrobnosťami.',
  'help.ctx.admin-audit.bullet.2': 'Obnoviť načíta záznam znova; Načítať ďalšie ide ďalej do minulosti.',
  // create-user
  'help.guide.create-user.title': 'Vytvorenie používateľa',
  'help.guide.create-user.goal': 'Pridajte účet ručne, bez pozvánky.',
  'help.guide.create-user.step.1': 'Kliknite na Vytvoriť používateľa v hornej časti karty Používatelia.',
  'help.guide.create-user.step.2':
    'Zadajte Používateľské meno, E-mail a Heslo a vyberte Rolu: Používateľ alebo Administrátor.',
  'help.guide.create-user.step.3': 'Kliknite na Vytvoriť používateľa.',
  'help.guide.create-user.result':
    'Účet sa objaví v tabuľke a môže sa hneď prihlásiť; heslo odovzdajte cez kanál, ktorému dôverujete.',
  'help.guide.create-user.tip.1': 'Pre človeka, ktorý si má zvoliť vlastné heslo, je lepšou cestou pozývací odkaz.',
  'help.guide.create-user.tip.2':
    'Administrátori vidia túto stránku a záznam auditu; všetko ostatné je pre obe roly rovnaké.',
  // edit-user
  'help.guide.edit-user.title': 'Zmena roly alebo hesla používateľa',
  'help.guide.edit-user.goal': 'Povýšte niekoho, znížte mu rolu alebo mu pomôžte späť po strate hesla.',
  'help.guide.edit-user.step.1':
    'Kliknite na ceruzku v riadku používateľa. Otvorí sa Upraviť používateľa s údajmi účtu.',
  'help.guide.edit-user.step.2':
    'Zmeňte Rolu, nastavte Nové heslo alebo kliknite na Resetovať prístupové kľúče, ak daná osoba stratila zariadenie so svojimi prístupovými kľúčmi, a potom kliknite na Uložiť.',
  'help.guide.edit-user.result': 'Zmena platí pri ďalšej požiadavke; nové heslo funguje od ďalšieho prihlásenia.',
  'help.guide.edit-user.tip.1': 'Rolu administrátora si nemôžete odobrať, kým ste posledným administrátorom.',
  'help.guide.edit-user.tip.2':
    'Resetovanie prístupových kľúčov zachová heslo; osoba si pridá nové prístupové kľúče v časti Nastavenia, Účet.',
  // invite-links
  'help.guide.invite-links.title': 'Pozvanie niekoho cez odkaz',
  'help.guide.invite-links.goal':
    'Umožnite niekomu zaregistrovať sa na uzavretej inštancii a podľa potreby sa hneď dostať do cesty.',
  'help.guide.invite-links.step.1': 'V časti Pozývacie odkazy kliknite na Vytvoriť odkaz.',
  'help.guide.invite-links.step.2':
    'Nastavte Max. použití a Vyprší po, prípadne Pridať k ceste (voliteľné), a kliknite na Vytvoriť a skopírovať.',
  'help.guide.invite-links.step.3':
    'Pošlite odkaz. Každý riadok ukazuje, koľkokrát bol použitý a kto ho vytvoril; Kopírovať odkaz ho skopíruje znova a vyčerpané alebo vypršané odkazy sú označené.',
  'help.guide.invite-links.result':
    'Kto otvorí odkaz, zaregistruje sa s vlastným heslom, a ak bola zvolená cesta, hneď sa k nej pripojí.',
  'help.guide.invite-links.tip.1': 'Pozývacie odkazy fungujú, aj keď je Registrácia heslom v Nastaveniach vypnutá.',
  'help.guide.invite-links.tip.2':
    'Odkaz s jedným použitím a krátkou platnosťou je pre jednu osobu najbezpečnejšia voľba.',
  // delete-user
  'help.guide.delete-user.title': 'Odstránenie používateľa',
  'help.guide.delete-user.goal': 'Odstráňte účet a všetko, čo vlastní len on.',
  'help.guide.delete-user.step.1': 'Kliknite na ikonu koša v riadku používateľa a potvrďte Odstrániť používateľa.',
  'help.guide.delete-user.result':
    'Účet, jeho vlastné cesty a jeho cestovné denníky zmiznú; cesty zdieľané s inými zostanú zvyšným členom.',
  'help.guide.delete-user.tip.1': 'Nedá sa to vrátiť späť. Ak si nie ste istí, najprv vytvorte zálohu.',
  'help.guide.delete-user.tip.2':
    'Posledného administrátora nemožno odstrániť; najprv urobte administrátorom niekoho iného.',
  // permissions
  'help.guide.permissions.title': 'Rozhodnutie, kto smie čo robiť',
  'help.guide.permissions.goal': 'Nastavte pre každú akciu, ktorá rola ju smie v tejto inštancii TREK vykonávať.',
  'help.guide.permissions.step.1':
    'V časti Nastavenia oprávnení nájdite akciu v jej skupine, napríklad Mazať cesty v časti Správa výletov, a vyberte úroveň: Všetci, Členovia výletu, Vlastník výletu alebo Iba administrátor. Zmenený riadok je označený ako upravené.',
  'help.guide.permissions.step.2': 'Kliknite na Uložiť. Obnoviť predvolené vráti každý riadok na vstavanú úroveň.',
  'help.guide.permissions.result':
    'Pravidlo platí naraz pre všetky cesty; ľuďom pod danou úrovňou zmiznú príslušné tlačidlá a ponuky.',
  'help.guide.permissions.tip.1': 'Vlastník výletu je osoba, ktorá cestu vytvorila; administrátori smú vždy všetko.',
  'help.guide.permissions.tip.2':
    'Radšej znížte úroveň, než by ste odstránili člena: člen, ktorý nesmie upravovať, môže stále čítať a komentovať.',
  // default-map
  'help.guide.default-map.title': 'Nastavenie predvolenej mapy pre nových používateľov',
  'help.guide.default-map.goal': 'Dajte každému novému účtu funkčnú mapu bez osobného tokenu.',
  'help.guide.default-map.step.1':
    'V časti Mapa vyberte Mapový engine a pre Mapbox alebo MapLibre Štýl mapy, Zdieľaný token Mapbox a Režim vysokej kvality; pre rastrovú mapu Šablónu mapy a Zdieľaný kľúč CARTO.',
  'help.guide.default-map.step.2':
    'Vedľa každého zmeneného poľa vráti obnoviť voľbu, ktorú má TREK vstavanú. Predvolené nastavenia používateľa vľavo robia to isté pre Farebný režim, jednotky a menu.',
  'help.guide.default-map.result':
    'Nové účty začínajú s týmito nastaveniami; kto si nastavil vlastnú mapu v Nastaveniach, ponechá si ju.',
  'help.guide.default-map.tip.1': 'Token zadaný tu zdieľajú všetci, ktorí nemajú vlastný, preto sledujte jeho kvótu.',
  'help.guide.default-map.tip.2':
    'Existujúce účty, ktoré kartu mapy nikdy nezmenili, sa tiež riadia týmito predvoľbami.',
  // packing-templates
  'help.guide.packing-templates.title': 'Vytvorte šablónu na balenie',
  'help.guide.packing-templates.goal': 'Poskytnite cestám východiskový zoznam vecí namiesto prázdneho.',
  'help.guide.packing-templates.step.1': 'Kliknite na Nová šablóna, zadajte názov a potvrďte ho symbolom zaškrtnutia.',
  'help.guide.packing-templates.step.2':
    'Otvorte šablónu a kliknite na Pridať kategóriu; pod každou kategóriou pridáte položky tlačidlom +, pričom položka potrebuje iba názov.',
  'help.guide.packing-templates.step.3':
    'Všetko sa ukladá priebežne. Ceruzkou premenujete šablónu, kategóriu alebo položku, kôšom ju vymažete.',
  'help.guide.packing-templates.result':
    'Šablóna sa ponúka v zozname vecí každej cesty; jej použitím sa položky skopírujú, takže ich cesta môže ľubovoľne meniť.',
  'help.guide.packing-templates.tip.1':
    'Šablóna pre každý typ cesty (pláž, mesto, turistika) je lepšia než jeden obrovský zoznam.',
  'help.guide.packing-templates.tip.2': 'Vymazanie šablóny neovplyvní cesty, ktoré ju už použili.',
  // categories
  'help.guide.categories.title': 'Spravujte sadu kategórií',
  'help.guide.categories.goal': 'Určte, aké kategórie môžu mať miesta a zbierky a ako vyzerajú.',
  'help.guide.categories.step.1':
    'Kliknite na Nová kategória, zadajte názov, vyberte ikonu a farbu; Náhľad ukáže výsledok. Kliknite na Vytvoriť.',
  'help.guide.categories.step.2':
    'Ak chcete kategóriu upraviť alebo vymazať, podržte nad ňou v zozname kurzor. Vymazanie vyžaduje potvrdenie.',
  'help.guide.categories.result':
    'Sada platí všade naraz: v paneli miesta, v špendlíkoch na mape, v Zbierkach aj vo filtroch.',
  'help.guide.categories.tip.1':
    'Miesta si uchovávajú ID kategórie, takže premenovanie kategórie sa prejaví pri každom mieste.',
  'help.guide.categories.tip.2':
    'Po vymazaní kategórie zostanú jej miesta bez kategórie; ak na tom záleží, najprv ich priraďte inam.',
  // school-holiday-catalog
  'help.guide.school-holiday-catalog.title': 'Spravujte školské prázdniny ručne',
  'help.guide.school-holiday-catalog.goal': 'Pokryte krajinu alebo región, ktoré vstavané zdroje prázdnin nepokrývajú.',
  'help.guide.school-holiday-catalog.step.1':
    'V časti Školské prázdniny kliknite na Pridať krajinu, zadajte Krajinu a jej Kód krajiny (napr. US) a kliknite na Uložiť; potom použite Pridať región pre každú jej časť, ktorá sa líši.',
  'help.guide.school-holiday-catalog.step.2':
    'Kliknutím na región otvoríte Región alebo školský obvod: kliknite na Pridať obdobie prázdnin, každému obdobiu zadajte Názov prázdnin, Dátum začiatku a Dátum konca a kliknite na Uložiť. Kôšom odstránite obdobie, región alebo krajinu, keď už nemá žiadne regióny.',
  'help.guide.school-holiday-catalog.result':
    'Používatelia nájdu krajinu a región v Nastaveniach v Dovolenke (Vacay) a obdobia vidia vo svojej ročnej mriežke.',
  'help.guide.school-holiday-catalog.tip.1':
    'Regióny zo vstavaných zdrojov tu nemožno upravovať; ak je dátum nesprávny, pridajte vedľa nich ručný región.',
  // auth-methods
  'help.guide.auth-methods.title': 'Určte, ako sa ľudia prihlasujú',
  'help.guide.auth-methods.goal': 'Povoľte alebo zakážte prihlásenie heslom, SSO a registráciu a vyžadujte 2FA.',
  'help.guide.auth-methods.step.1':
    'V časti Metódy overenia zapnite alebo vypnite Prihlásenie heslom a Registráciu heslom. Vypnutá registrácia znamená, že nové účty vznikajú iba cez odkazy na pozvanie, SSO alebo ručne.',
  'help.guide.auth-methods.step.2':
    'Prihlásenie cez SSO a Automatické vytváranie účtov SSO vyžadujú nastavené Jednotné prihlásenie (OIDC) nižšie; automatické vytváranie založí účet, keď sa niekto prvýkrát prihlási cez SSO.',
  'help.guide.auth-methods.step.3':
    'Vyžadovať dvojfaktorové overenie (2FA) prinúti každého, kto sa prihlasuje heslom, nastaviť si pri ďalšom prihlásení autentifikátor. Prihlásenie prístupovým kľúčom vyžaduje ID spoliehajúcej sa strany (relying party) a pôvody (origins), na ktorých je váš TREK dostupný.',
  'help.guide.auth-methods.result': 'Prihlasovacia stránka ponúka presne tie metódy, ktoré ste nechali zapnuté.',
  'help.guide.auth-methods.tip.1':
    'Skôr než sa sami zamknete, zobrazí sa upozornenie: aspoň jeden spôsob prihlásenia pre správcov zostane zapnutý.',
  'help.guide.auth-methods.tip.2': 'Hodnoty nastavené cez premenné prostredia sa tu zobrazujú iba na čítanie.',
  // oidc
  'help.guide.oidc.title': 'Pripojte jednotné prihlásenie',
  'help.guide.oidc.goal': 'Umožnite ľuďom prihlásiť sa cez vášho poskytovateľa identity.',
  'help.guide.oidc.step.1':
    'V časti Jednotné prihlásenie (OIDC) zadajte Zobrazované meno pre tlačidlo a URL vydavateľa (Issuer), ID klienta a Tajný kľúč klienta od svojho poskytovateľa a potom kliknite na Uložiť.',
  'help.guide.oidc.step.2': 'V časti Metódy overenia zapnite Prihlásenie cez SSO.',
  'help.guide.oidc.result':
    'Prihlasovacia stránka zobrazí tlačidlo SSO; so zapnutým Automatickým vytváraním účtov SSO dostanú noví používatelia účet automaticky.',
  'help.guide.oidc.tip.1':
    'URI presmerovania, ktoré váš poskytovateľ potrebuje, je adresa vášho TREK doplnená o cestu spätného volania OIDC z dokumentácie.',
  'help.guide.oidc.tip.2':
    'Mapovanie claimov určuje, ktoré skupiny SSO sa stanú správcami; pozrite si stránku OIDC v dokumentácii.',
  // instance-keys
  'help.guide.instance-keys.title': 'Zadajte API kľúče',
  'help.guide.instance-keys.goal':
    'Sprístupnite vyhľadávanie miest cez Google, obaly z Unsplash a Amap pre celú inštanciu.',
  'help.guide.instance-keys.step.1':
    'V časti API kľúče vložte Google Maps API kľúč a kliknite na Testovať; pole ukáže, či kľúč odpovedá.',
  'help.guide.instance-keys.step.2':
    'V časti Na čo sa kľúč môže používať zapnite iba funkcie, ktoré chcete účtovať na tento kľúč: automatické dopĺňanie, podrobnosti, fotky, obohatenie, tieňovú kópiu miest.',
  'help.guide.instance-keys.step.3':
    'Unsplash API kľúč poháňa vyhľadávanie obalov, Amap (高德地图) API kľúč vyhľadávanie miest v Číne. Každý otestujte rovnakým spôsobom.',
  'help.guide.instance-keys.result':
    'Používatelia získajú tieto funkcie bez vlastných kľúčov; bez kľúča Google vyhľadáva TREK cez bezplatné nástroje OpenStreetMap a TREK Places API.',
  'help.guide.instance-keys.tip.1':
    'Osobný kľúč používateľa v Nastaveniach má pre daného používateľa prednosť pred kľúčom inštancie.',
  'help.guide.instance-keys.tip.2':
    'Kľúče môžu pochádzať aj z premenných prostredia; tie sa tu zobrazujú iba na čítanie.',
  // places-transit
  'help.guide.places-transit.title': 'Vyberte poskytovateľov vyhľadávania a verejnej dopravy',
  'help.guide.places-transit.goal': 'Určte, kto odpovedá na vyhľadávanie miest a trasy verejnej dopravy.',
  'help.guide.places-transit.step.1':
    'V časti Poskytovateľ vyhľadávania miest zvoľte Automaticky, Google Places, Amap (高德地图) alebo OpenStreetMap. Automaticky použije najlepší existujúci kľúč.',
  'help.guide.places-transit.step.2':
    'V časti Poskytovateľ verejnej dopravy zvoľte Transitous (zdarma), ktorý funguje celosvetovo a bez kľúča, alebo Google, ktorý vyžaduje kľúč Google.',
  'help.guide.places-transit.result':
    'Každé vyhľadávacie pole a každá trasa verejnej dopravy v TREK sa riadi touto voľbou.',
  'help.guide.places-transit.tip.1':
    'Poskytovateľ bez svojho kľúča tu zobrazí upozornenie a náhradne sa použije OpenStreetMap.',
  'help.guide.places-transit.tip.2': 'Trasy verejnej dopravy od Google sa účtujú za každú požiadavku, Transitous nie.',
  // file-types
  'help.guide.file-types.title': 'Obmedzte typy súborov',
  'help.guide.file-types.goal': 'Určte, aké prípony môžu mať nahrávané súbory.',
  'help.guide.file-types.step.1':
    'V časti Povolené typy súborov upravte zoznam prípon oddelených čiarkami a uložte ho.',
  'help.guide.file-types.result':
    'Nahrávanie iných typov sa odmietne so zrozumiteľnou správou, v dokumentoch, v denníku aj pri obaloch.',
  'help.guide.file-types.tip.1':
    'Ponechajte v zozname typy obrázkov; obaly a fotky z cestovného denníka prechádzajú rovnakou kontrolou.',
  // toggle-addon
  'help.guide.toggle-addon.title': 'Zapnite alebo vypnite doplnok',
  'help.guide.toggle-addon.goal': 'Ponúknite funkčný modul všetkým, alebo ho odoberte.',
  'help.guide.toggle-addon.step.1':
    'Prepnite prepínač na dlaždici doplnku. Položka v navigácii sa objaví alebo zmizne pre všetkých naraz.',
  'help.guide.toggle-addon.step.2':
    'Niektoré dlaždice majú podriadené riadky pre svoje možnosti, napríklad Sledovanie batožiny pod Zoznamami alebo poskytovateľov fotiek pod Cestovným denníkom; zobrazujú sa iba vtedy, keď je doplnok zapnutý.',
  'help.guide.toggle-addon.result':
    'Údaje vypnutého doplnku sa zachovajú; po jeho opätovnom zapnutí sa znova zobrazia.',
  'help.guide.toggle-addon.tip.1': 'Vypnutím MCP sa odstráni endpoint aj sekcie Integrácie, ktoré od neho závisia.',
  'help.guide.toggle-addon.tip.2':
    'Dovolenka (Vacay), Atlas a Cestovný denník sú doplnky, o ktoré používatelia žiadajú najčastejšie; Dokumenty potrebujú úložisko pre nahrané súbory.',
  // document-providers
  'help.guide.document-providers.title': 'Ponúknite úložisko dokumentov',
  'help.guide.document-providers.goal': 'Určte, s ktorými úložiskami môže cesta synchronizovať svoje dokumenty.',
  'help.guide.document-providers.step.1':
    'Dlaždica Dokumenty obsahuje úložiská ako riadky vo svojej rozbaľovacej časti: Paperless-ngx, Papra, Nextcloud, OpenCloud a Synology Drive. Všetkých päť je na začiatku vypnutých a táto časť je viditeľná iba vtedy, keď sú zapnuté samotné Dokumenty.',
  'help.guide.document-providers.step.2':
    'Prepnite prepínač v riadku Nextcloud. Zobrazí sa správa Doplnok aktualizovaný a odteraz vlastníci ciest nájdu Synchronizáciu dokumentov na karte Súbory svojich ciest, s Nextcloud v časti Pripojiť poskytovateľa.',
  'help.guide.document-providers.result':
    'Úložisko je k dispozícii v každej ceste tohto TREK; nič sa nepripojí, kým to neurobí vlastník cesty.',
  'help.guide.document-providers.tip.1':
    'Tu sa rozhoduje iba o tom, či sa úložisko môže ponúkať. Adresa a prihlasovacie údaje patria k ceste a zadáva ich vlastník cesty na jej karte Súbory, nikdy nie v paneli správcu.',
  'help.guide.document-providers.tip.2':
    'Vypnutím Dokumentov sa vypnú aj všetky úložiská a úložisko nemožno zapnúť, kým sú Dokumenty vypnuté: server odpovie Najprv povoľte doplnok Dokumenty. Úložisko vo vašej vlastnej sieti navyše vyžaduje na serveri ALLOW_INTERNAL_NETWORK=true.',
  // install-plugin
  'help.guide.install-plugin.title': 'Nainštalujte plugin',
  'help.guide.install-plugin.goal': 'Pridajte plugin tretej strany a udeľte mu presne tie oprávnenia, o ktoré žiada.',
  'help.guide.install-plugin.step.1':
    'Otvorte Objaviť, vyberte plugin a kliknite na Inštalovať; alebo kliknite na Nahrať plugin a zvoľte balík .zip alebo .tar.gz.',
  'help.guide.install-plugin.step.2':
    'Späť v časti Nainštalované si prečítajte riadok: čo môže plugin čítať alebo zapisovať, ktorých hostiteľov volá a či je podpísaný. Zapnite Povoliť plugin.',
  'help.guide.install-plugin.step.3':
    'Ponuka riadku obsahuje Reštartovať, Zobraziť protokol chýb, Povolení hostitelia a Zmeniť verziu…; Vymazať ho odinštaluje. Keď existuje novšia verzia, riadok ponúkne aktualizáciu, a tá, ktorá žiada nové práva, zostane vypnutá, kým ich neschválite.',
  'help.guide.install-plugin.result':
    'Plugin beží vo vlastnom procese; to, čo pridáva (widgety, mapové vrstvy, nástroje), sa zobrazí tam, kde to plugin určí.',
  'help.guide.install-plugin.tip.1': 'Znovu prehľadať načíta priečinok pluginu prepojený na vývoj bez balíka.',
  'help.guide.install-plugin.tip.2':
    'Nepodpísaný plugin je takto označený; inštalujte ho, iba ak dôverujete jeho zdroju.',
  // storage-backends
  'help.guide.storage-backends.title': 'Presuňte nahrané súbory do S3 alebo na zrkadlo',
  'help.guide.storage-backends.goal': 'Uchovávajte súbory v objektovom úložisku alebo súčasne na disku aj v buckete.',
  'help.guide.storage-backends.step.1':
    'V časti Backendy kliknite na Pridať backend, zadajte Názov, vyberte Typ (Lokálne, S3 alebo Zrkadlo), vyplňte polia a kliknite na Použiť. Testovať overí pripojenie, Uložiť zmeny ho uloží.',
  'help.guide.storage-backends.step.2':
    'V časti Kategórie priraďte každú kategóriu nahrávaných súborov k backendu. Pri zmene sa zobrazí otázka, či Presunúť existujúce objekty alebo Iba smerovať nové zápisy.',
  'help.guide.storage-backends.step.3':
    'Zdravie v hornej časti kontroluje každý backend; červená položka uvádza, čo zlyhalo.',
  'help.guide.storage-backends.result':
    'Nové súbory sa nahrávajú do priradeného backendu; presunuté súbory sa poskytujú odtiaľ.',
  'help.guide.storage-backends.tip.1':
    'Backend nastavený cez premenné prostredia sa tu zobrazuje, ale nemožno ho upravovať.',
  'help.guide.storage-backends.tip.2':
    'Zrkadlo zapisuje do oboch cieľov a číta z prvého; použite ho na migráciu bez výpadku.',
  // channels-instance
  'help.guide.channels-instance.title': 'Nastavte kanály oznámení',
  'help.guide.channels-instance.goal': 'Určte, ktoré kanály si používatelia môžu vybrať, a nastavte e-mail.',
  'help.guide.channels-instance.step.1':
    'V časti E-mail (SMTP) zadajte SMTP hostiteľa, SMTP port, SMTP používateľa, SMTP heslo a adresu odosielateľa; Odoslať testovací e-mail vám pošle správu.',
  'help.guide.channels-instance.step.2':
    'Zapnite Web Push, Ntfy a Webhook, ak ich chcete ponúknuť; používatelia potom v časti Nastavenia, Oznámenia zapnú push pre každé zariadenie alebo zadajú vlastnú tému či URL.',
  'help.guide.channels-instance.step.3':
    'Pripomienky ciest zapínajú pripomienku pred začiatkom cesty; V aplikácii je vždy zapnuté a je tu iba vysvetlené.',
  'help.guide.channels-instance.result': 'Karta Oznámenia každého používateľa zobrazuje kanály, ktoré ste zapli.',
  'help.guide.channels-instance.tip.1':
    'Predvolený server ntfy zadaný tu sa používateľom predvyplní; stále môžu zadať vlastný.',
  'help.guide.channels-instance.tip.2': 'Kanály pluginov sa zobrazia samy, keď je aktívny plugin s touto schopnosťou.',
  // admin-channels
  'help.guide.admin-channels.title': 'Dostávajte udalosti pre správcov do telefónu',
  'help.guide.admin-channels.goal':
    'Buďte informovaní o neúspešných zálohách, nových verziách a ďalších udalostiach inštancie.',
  'help.guide.admin-channels.step.1':
    'V časti Admin ntfy zadajte tému a v prípade potreby server a token; v časti Admin webhook adresu URL.',
  'help.guide.admin-channels.step.2':
    'Kliknite na Odoslať testovacie ntfy alebo Odoslať testovací webhook a overte, že správa príde.',
  'help.guide.admin-channels.result':
    'Udalosti pre správcov chodia tam, a navyše do zvončeka v aplikácii každého správcu.',
  'help.guide.admin-channels.tip.1':
    'Tému pre správcov udržujte oddelenú od osobnej, aby sa hlásenie o výpadku nestratilo medzi správami o cestách.',
  // mcp-tokens-admin
  'help.guide.mcp-tokens-admin.title': 'Odvolajte prístup AI',
  'help.guide.mcp-tokens-admin.goal':
    'Zobrazte a zrušte každý token a reláciu, ktoré má AI klient, pre ľubovoľného používateľa.',
  'help.guide.mcp-tokens-admin.step.1':
    'V časti API tokeny nájdite token podľa používateľa a názvu; kôšom ho vymažete a klient okamžite prestane fungovať.',
  'help.guide.mcp-tokens-admin.step.2':
    'V časti OAuth relácie to isté pre klientov v prehliadači: klient, používateľ a dátum, a kôšom reláciu odvoláte.',
  'help.guide.mcp-tokens-admin.result': 'Používateľ musí klienta znova pripojiť; nič iné sa nemení.',
  'help.guide.mcp-tokens-admin.tip.1':
    'Oprávnenia ukazujú, čo môže klient robiť; oprávnenie iba na čítanie je neškodné ponechať.',
  'help.guide.mcp-tokens-admin.tip.2': 'Vypnutím doplnku MCP sa všetko naraz odvolá.',
  // release-history
  'help.guide.release-history.title': 'Skontrolujte dostupnosť novej verzie',
  'help.guide.release-history.goal': 'Zistite, či je váš TREK aktuálny a čo prinesie ďalšia verzia.',
  'help.guide.release-history.step.1':
    'Keď existuje novšia verzia, v hornej časti stránky správcu sa zobrazí Dostupná aktualizácia; Zobraziť na GitHube ju otvorí a Ako aktualizovať vysvetlí aktualizáciu pre Docker aj pre iné inštalácie.',
  'help.guide.release-history.step.2':
    'História verzií uvádza každú verziu s jej poznámkami; Zobraziť podrobnosti ich rozbalí, najnovšia nesie označenie Najnovšia a Načítať ďalšie ide ďalej do minulosti.',
  'help.guide.release-history.result':
    'Aktualizácia prebieha na hostiteľovi, stiahnutím nového obrazu alebo zostavením novej značky (tagu); dátový adresár zostáva.',
  'help.guide.release-history.tip.1': 'Pred aktualizáciou si vytvorte zálohu; karta Zálohovanie je hneď vedľa.',
  'help.guide.release-history.tip.2':
    'Predbežné verzie sa zobrazujú, ale neoznamujú sa ako aktualizácie, pokiaľ nejakú sami nepoužívate.',
  // create-backup
  'help.guide.create-backup.title': 'Vytvorte a obnovte zálohu',
  'help.guide.create-backup.goal':
    'Zachyťte stav celej inštancie, uchovajte kópiu inde a majte možnosť ju vrátiť späť.',
  'help.guide.create-backup.step.1':
    'V časti Záloha dát kliknite na Vytvoriť zálohu. Databáza a nahrané súbory sa zabalia do jedného súboru na serveri.',
  'help.guide.create-backup.step.2':
    'Stiahnuť uloží kópiu mimo servera; kôšom vymažete staré zálohy a uvoľníte miesto.',
  'help.guide.create-backup.step.3':
    'Obnoviť pri zálohe alebo Nahrať zálohu so súborom nahradí aktuálne údaje po jednom potvrdení otázky Obnoviť zálohu?',
  'help.guide.create-backup.result':
    'Obnovenie vráti používateľov, cesty, súbory a nastavenia do stavu tejto zálohy; všetci budú odhlásení.',
  'help.guide.create-backup.tip.1':
    'Obnovenie je jediná akcia tu, ktorú nemožno vrátiť späť. Najprv si vytvorte novú zálohu.',
  'help.guide.create-backup.tip.2':
    'Zálohy sa ukladajú v dátovom adresári; skutočnou zálohou sa stanú až vďaka kópii na inom počítači.',
  // auto-backup
  'help.guide.auto-backup.title': 'Naplánujte zálohy',
  'help.guide.auto-backup.goal': 'Nechajte server, aby sa zálohoval sám a uchovával iba niekoľko posledných záloh.',
  'help.guide.auto-backup.step.1':
    'V časti Automatické zálohovanie zapnite Povoliť automatické zálohovanie a vyberte Interval, Spustiť o hodine a pri týždennom alebo mesačnom zálohovaní aj Deň v týždni alebo Deň v mesiaci.',
  'help.guide.auto-backup.step.2':
    'Odstrániť staré zálohy po určuje, ako dlho sa záloha uchováva; staršie sa odstránia pri vytvorení novej.',
  'help.guide.auto-backup.result':
    'Zálohy sa v zozname objavujú podľa plánu; zlyhanie sa ohlási v kanáloch pre správcov.',
  'help.guide.auto-backup.tip.1': 'Časy sa riadia časovým pásmom servera, ktoré je uvedené na karte Audit.',
  'help.guide.auto-backup.tip.2': 'Úložisko na serveri je obmedzené; zvyčajne stačí uchovávať tri až päť záloh.',
  // audit-log
  'help.guide.audit-log.title': 'Prečítajte si protokol auditu',
  'help.guide.audit-log.goal': 'Zistite, kto čo urobil a kedy.',
  'help.guide.audit-log.step.1':
    'Prečítajte si riadky: čas, používateľ, akcia, zdroj, IP a podrobnosti, od najnovších. Akcie sú pomenované podľa toho, čo sa stalo, napríklad neúspešné prihlásenie, zmena MFA alebo obnovenie.',
  'help.guide.audit-log.step.2': 'Obnoviť znova načíta najnovšie záznamy; Načítať ďalšie ide ďalej do minulosti.',
  'help.guide.audit-log.result': 'Záznam, ktorý môžete predložiť každému, kto sa pýta, prečo sa niečo zmenilo.',
  'help.guide.audit-log.tip.1': 'Časy sa zobrazujú v časovom pásme servera, ktoré je uvedené nad tabuľkou.',
  'help.guide.audit-log.tip.2': 'Do protokolu sa dá iba pridávať; nič v ňom nemožno v aplikácii upraviť ani vymazať.',

  // ── Screen: trip ──────────────────────────────────────────────────────────────────────
  'help.ctx.trip.title': 'Cesta',
  'help.ctx.trip.summary':
    'Jedna cesta so všetkým, čo k nej patrí: plán s dňami, mapou a miestami a karty pre dopravu, rezervácie, zoznamy, náklady, súbory a spoluprácu. Každá z nich má pod touto vlastnú obrazovku pomocníka.',
  'help.ctx.trip.bullet.1':
    'Lišta kariet: Plán, Doprava, Rezervácie, Zoznamy, Náklady, Súbory a Spolupráca. Doplnky a pluginy určujú, ktoré karty sú vo vašom TREK k dispozícii.',
  'help.ctx.trip.bullet.2':
    'Plán má tri stĺpce: dni vľavo, mapu v strede, miesta vpravo. Rezervácie a doprava sú priamo v pláne, pri zastávke a medzi zastávkami; karty ich zobrazujú v zozname.',
  'help.ctx.trip.bullet.3':
    'Zdieľať vpravo hore otvorí ľudí cesty: členov, hostí, odkaz na pozvanie a verejný odkaz iba na čítanie.',
  'help.ctx.trip.bullet.4': 'Názov, dátumy, obal a mena sa upravujú v časti Moje cesty ceruzkou na karte cesty.',
  'help.ctx.trip.bullet.5':
    'Šípky na vnútornom okraji stĺpca ho zbalia a mapa zaberie uvoľnené miesto; tenký oddeľovač vedľa stĺpca mení jeho šírku.',
  'help.ctx.trip.bullet.6': 'Šípka späť na paneli nástrojov dní vráti poslednú zmenu plánu.',
  // add-member
  'help.guide.add-member.title': 'Pridajte člena',
  'help.guide.add-member.goal': 'Udeľte prístup k tejto ceste niekomu s účtom TREK.',
  'help.guide.add-member.step.1': 'Kliknite vpravo hore na Zdieľať.',
  'help.guide.add-member.step.2': 'V časti Pozvať používateľa vyberte osobu zo zoznamu a kliknite na Pozvať.',
  'help.guide.add-member.step.3':
    'Osoba sa teraz zobrazí v časti Prístup. Korunka označuje vlastníka; ikonou na konci riadka prístup znova odoberiete.',
  'help.guide.add-member.result':
    'Člen vidí a upravuje cestu ako vy, v rámci úrovní, ktoré správca nastavil v Nastaveniach oprávnení.',
  'help.guide.add-member.tip.1':
    'Kto v zozname chýba, ešte nemá účet TREK: pridajte ho ako hosťa alebo ho nechajte zaregistrovať sa cez odkaz na pozvanie.',
  'help.guide.add-member.tip.2': 'Číslo vedľa Prístup udáva počet ľudí v ceste; hostia sú uvedení samostatne nižšie.',
  // trip-invite-link
  'help.guide.trip-invite-link.title': 'Pozvite cez odkaz',
  'help.guide.trip-invite-link.goal': 'Nechajte ľudí, aby sa k ceste pripojili sami.',
  'help.guide.trip-invite-link.step.1':
    'Kliknite na Zdieľať a potom v časti Odkaz na pozvanie na cestu kliknite na Vytvoriť odkaz na pozvanie.',
  'help.guide.trip-invite-link.step.2':
    'Kliknite na Kopírovať a odošlite odkaz. Každý s účtom TREK, kto ho otvorí, sa pripojí ako člen.',
  'help.guide.trip-invite-link.step.3': 'Vygenerovať znova nahradí odkaz a starý znefunkční; Deaktivovať ho vypne.',
  'help.guide.trip-invite-link.result': 'Kto otvorí odkaz, je v ceste a zobrazí sa v časti Prístup.',
  'help.guide.trip-invite-link.tip.1':
    'Niekto bez účtu ho použiť nemôže. Správca rozdáva registračné odkazy v časti Správca, Používatelia a môže ich prepojiť s touto cestou.',
  'help.guide.trip-invite-link.tip.2':
    'Ak odkaz skončil v nesprávnom chate, použite Vygenerovať znova: starý okamžite prestane fungovať.',
  // add-guest
  'help.guide.add-guest.title': 'Pridajte hosťa bez účtu',
  'help.guide.add-guest.goal': 'Započítajte aj niekoho, kto TREK nepoužíva.',
  'help.guide.add-guest.step.1': 'Kliknite na Zdieľať a posuňte sa k časti Hostia.',
  'help.guide.add-guest.step.2': 'Zadajte meno do poľa Meno hosťa a kliknite na Pridať hosťa.',
  'help.guide.add-guest.result':
    'Hosťa možno priradiť k nákladom, veciam na balenie a úlohám, ale nemôže sa prihlásiť.',
  'help.guide.add-guest.tip.1':
    'Ceruzkou hosťa premenujete; ikonou na konci riadka ho odstránite spolu s jeho podielmi a priradeniami.',
  'help.guide.add-guest.tip.2': 'Ak osoba neskôr získa účet, pozvite ju ako člena a hosťa odstráňte.',
  // public-link
  'help.guide.public-link.title': 'Zverejnite odkaz iba na čítanie',
  'help.guide.public-link.goal': 'Ukážte cestu ľuďom, ktorí ju nemajú upravovať.',
  'help.guide.public-link.step.1':
    'Kliknite na Zdieľať; vpravo v časti Verejný odkaz zaškrtnite, čo môže odkaz zobraziť. Mapa a plán je vždy zapnutá; Rezervácie, Balenie, Náklady a Chat sú na vás.',
  'help.guide.public-link.step.2': 'Kliknite na Vytvoriť odkaz a potom na Kopírovať.',
  'help.guide.public-link.step.3': 'Zaškrtnutia môžete meniť, kým odkaz existuje; Vymazať odkaz ho zruší.',
  'help.guide.public-link.result': 'Každý s odkazom vidí vybrané časti bez prihlásenia a nemôže nič zmeniť.',
  'help.guide.public-link.tip.1':
    'Odkaz nie je nikde uvedený; otvoriť ho môže ktokoľvek, kto ho má, preto s ním zaobchádzajte ako s heslom.',
  'help.guide.public-link.tip.2': 'Ak má osoba cestu upravovať, pridajte ju radšej ako člena.',
  // transfer-ownership
  'help.guide.transfer-ownership.title': 'Odovzdajte cestu alebo ju opustite',
  'help.guide.transfer-ownership.goal': 'Urobte vlastníkom niekoho iného alebo opustite cestu, ktorá nie je vaša.',
  'help.guide.transfer-ownership.step.1':
    'Kliknite na Zdieľať. V časti Prístup korunkou v riadku člena urobíte túto osobu vlastníkom; potvrďte otázku.',
  'help.guide.transfer-ownership.step.2':
    'Opustiť cestu vo vašom vlastnom riadku vás z cesty odstráni; ako vlastník ju najprv odovzdajte.',
  'help.guide.transfer-ownership.result':
    'Nový vlastník spravuje členov a môže cestu vymazať; vy zostávate bežným členom.',
  'help.guide.transfer-ownership.tip.1':
    'Vlastníkom je ten, kto cestu vytvoril, kým ju neodovzdá; vymazať cestu môže iba on.',
  'help.guide.transfer-ownership.tip.2':
    'Odobrať prístup v inom riadku je to isté tlačidlo z opačnej strany: vlastník ním odstráni člena.',
  // collapse-columns
  'help.guide.collapse-columns.title': 'Uvoľnite miesto pre mapu',
  'help.guide.collapse-columns.goal': 'Zbaľte stĺpec alebo mu dajte viac šírky.',
  'help.guide.collapse-columns.step.1':
    'Kliknutím na šípku na vnútornom okraji stĺpca dní ho zbalíte; mapa zaberie uvoľnené miesto. Stĺpec miest má rovnakú šípku.',
  'help.guide.collapse-columns.step.2': 'Opätovným kliknutím na šípku stĺpec vrátite.',
  'help.guide.collapse-columns.step.3': 'Potiahnutím tenkého oddeľovača medzi stĺpcom a mapou zmeníte šírku stĺpca.',
  'help.guide.collapse-columns.result': 'Šírky sa zapamätajú; pri ďalšej návšteve budú stĺpce opäť otvorené.',
  'help.guide.collapse-columns.tip.1': 'Oba stĺpce môžete zbaliť naraz a zobraziť iba mapu.',
  'help.guide.collapse-columns.tip.2': 'Na telefóne nie sú stĺpce: Plán a Miesta sú dve tlačidlá v dolnej časti mapy.',
  // undo-change
  'help.guide.undo-change.title': 'Vráťte poslednú zmenu',
  'help.guide.undo-change.goal': 'Vráťte späť to, čo ste práve urobili s plánom.',
  'help.guide.undo-change.step.1':
    'Kliknite na šípku späť na paneli nástrojov nad dňami; jej popis uvádza zmenu, ktorú vráti.',
  'help.guide.undo-change.result': 'Plán je opäť taký, aký bol, a šípka zostane sivá až do ďalšej zmeny.',
  'help.guide.undo-change.tip.1':
    'Vrátenie sa týka plánu: priraďovania, odoberania, zmeny poradia a presúvania miest, optimalizácie trasy, mazania miest, zmien kategórie a importov.',
  'help.guide.undo-change.tip.2': 'Má hĺbku jedného kroku: vrátiť možno iba najnovšiu zmenu a nová zmena ju nahradí.',

  // ── Screen: trip-places ───────────────────────────────────────────────────────────────
  'help.ctx.trip-places.title': 'Miesta',
  'help.ctx.trip-places.summary':
    'Pravý stĺpec plánu: všetky miesta cesty, naplánované aj nenaplánované, s vyhľadávaním a filtrami a so spôsobmi, ako miesta pridať: ručne, zo súboru alebo zo zdieľaného zoznamu.',
  'help.ctx.trip-places.bullet.1':
    'Pridať miesto/aktivitu hore otvorí formulár pre miesto, ktoré zadáte alebo vyhľadáte. Keď je otvorený deň, tlačidlo má názov Nové miesto a Ku dňu vedľa neho vytvorí miesto priamo v tomto dni.',
  'help.ctx.trip-places.bullet.2':
    'Importovať súbor prijíma súbory .gpx, .kml a .kmz; Import zoznamu prijíma zdieľaný zoznam z Google Maps alebo Naver Maps. Súbor môžete aj jednoducho pustiť na stĺpec.',
  'help.ctx.trip-places.bullet.3':
    'Rozbaľovací zoznam prepína medzi Všetky, Nezaradené, Plánované a po importe stopy aj Trasy; pod ním je vyhľadávanie, filter kategórií a hviezdička pre minimálne hodnotenie.',
  'help.ctx.trip-places.bullet.4':
    'Riadok zobrazuje obrázok, názov a popis alebo adresu. Kliknutím naň zobrazíte podrobnosti miesta, môžete ho potiahnuť na deň alebo kliknutím pravým tlačidlom otvoriť Upraviť, Pridať k dňu, Otvoriť webovú stránku, Google Maps, Uložiť do zbierky a Vymazať.',
  'help.ctx.trip-places.bullet.5':
    'Keď je otvorený deň, tlačidlo + na konci nezaradeného riadka pridá miesto k tomuto dňu a Plánované zobrazí iba tento deň; tlačidlom Zobraziť celú cestu zobrazenie znova rozšírite.',
  'help.ctx.trip-places.bullet.6':
    'Symbol zaškrtnutia na pravom konci riadka filtrov spustí výber: viacerým riadkom naraz môžete priradiť novú kategóriu, pridať ich do zbierky alebo ich vymazať.',
  // create-place
  'help.guide.create-place.title': 'Vytvorte miesto',
  'help.guide.create-place.goal': 'Pridajte miesto alebo aktivitu ručne so všetkým, čo o nich plán potrebuje vedieť.',
  'help.guide.create-place.step.1':
    'Kliknite na Pridať miesto/aktivitu v hornej časti stĺpca miest (Nové miesto, keď je otvorený deň). Otvorí sa formulár.',
  'help.guide.create-place.step.2':
    'Zadajte miesto do poľa Hľadať miesta… hore a vyberte výsledok. Vyplní sa Názov, Adresa, Zemepisná šírka, Zemepisná dĺžka a Webová stránka a Podrobnosti miesta vľavo zobrazia jeho obrázky, otváracie hodiny a popis. V TREK s kľúčom Google je pod zoznamom možnosť Nie je to správne miesto? Hľadať radšej cez Google, ktorá spustí rovnaké vyhľadávanie cez Google.',
  'help.guide.create-place.step.3':
    'V Podrobnostiach miesta kliknutím na obrázok v časti Vybrať obrázok z neho urobíte obrázok miesta; Použiť tento text prevezme popis do formulára.',
  'help.guide.create-place.step.4':
    'Skontrolujte polia: Názov je povinný; Popis a Poznámky sú na vás; Adresa, Zemepisná šírka a Zemepisná dĺžka pochádzajú z vyhľadávania alebo sa zadajú ručne; Kategória vyberá jednu z kategórií cesty a tlačidlo + vedľa nej hneď vytvorí novú; do poľa Webová stránka patrí odkaz.',
  'help.guide.create-place.step.5':
    'Kliknite na Pridať. Ak už v ceste je miesto s rovnakým názvom, formulár vás na to upozorní a tlačidlo sa zmení na Aj tak pridať.',
  'help.guide.create-place.result': 'Miesto je v zozname aj na mape, v časti Nezaradené, kým ho nepridáte k dňu.',
  'help.guide.create-place.tip.1':
    'Súbory a Náklady v dolnej časti formulára pripoja k miestu dokument alebo hneď po uložení otvoria editor nákladov pre jeho výdavok.',
  'help.guide.create-place.tip.2':
    'Na vyhľadávanie v každom TREK odpovedá index TREK a OpenStreetMap a Podrobnosti miesta sa vyplnia z Wikipédie, Wikivoyage a Wikimedia. Google sa použije, iba ak oba zdroje nič nenájdu, a iba on poskytuje hodnotenia.',
  'help.guide.create-place.tip.3':
    'Miesto môžete vytvoriť aj na mape: kliknite pravým tlačidlom na bod a otvorí sa formulár s vyplnenými súradnicami a adresou.',
  // place-to-open-day
  'help.guide.place-to-open-day.title': 'Pridajte miesto priamo k otvorenému dňu',
  'help.guide.place-to-open-day.goal': 'Preskočte druhý krok: vytvorte alebo vyberte miesto a majte ho hneď v dni.',
  'help.guide.place-to-open-day.step.1':
    'Kliknite na hlavičku dňa v stĺpci dní. Deň je otvorený: jeho karta je zvýraznená a v stĺpci miest pribudne tlačidlo Ku dňu.',
  'help.guide.place-to-open-day.step.2':
    'Ku dňu otvorí rovnaký formulár ako Nové miesto, len miesto sa pridá k otvorenému dňu v okamihu, keď kliknete na Pridať.',
  'help.guide.place-to-open-day.step.3':
    'Existujúce miesto pridáte k otvorenému dňu tlačidlom + na konci jeho riadka alebo kliknutím pravým tlačidlom a voľbou Pridať k dňu.',
  'help.guide.place-to-open-day.step.4':
    'Funguje to aj opačne, a to bez predchádzajúceho otvorenia dňa: potiahnite riadok miesta zo stĺpca a pustite ho na kartu dňa. Ak ho pustíte medzi dve zastávky, umiestni sa presne tam.',
  'help.guide.place-to-open-day.result':
    'Miesto sa zobrazí v dni na konci; potiahnite ho nahor alebo nadol tam, kam patrí.',
  'help.guide.place-to-open-day.tip.1':
    'Otvorený deň ovplyvňuje aj vyhľadávanie: keď je deň otvorený, mapa a vyhľadávanie v okolí vychádzajú z oblasti, kam tento deň už smeruje.',
  'help.guide.place-to-open-day.tip.2': 'Vrátiť späť na paneli nástrojov nad dňami priradenie zruší.',
  // filter-places
  'help.guide.filter-places.title': 'Nájdite miesto v zozname',
  'help.guide.filter-places.goal': 'Zúžte stĺpec na miesta, ktoré hľadáte.',
  'help.guide.filter-places.step.1':
    'Rozbaľovací zoznam hore prepína medzi Všetky, Nezaradené (zatiaľ v žiadnom dni), Plánované (v niektorom dni) a Trasy (importované stopy GPX), každé s počtom.',
  'help.guide.filter-places.step.2': 'Píšte do poľa Hľadať miesta…; zoznam sa počas písania zužuje.',
  'help.guide.filter-places.step.3':
    'Všetky kategórie otvorí zoznam, v ktorom zaškrtnete jednu alebo viac kategórií vrátane možnosti Bez kategórie; Vymazať filter v jeho dolnej časti výber zruší.',
  'help.guide.filter-places.step.4':
    'Hviezdička vedľa neho nastaví minimálne hodnotenie: 5+, 4+ atď. zobrazia iba miesta, ktoré ste hodnotili aspoň takto vysoko.',
  'help.guide.filter-places.result': 'Počet nad riadkami udáva, koľko miest zodpovedá filtrom; filtre sa kombinujú.',
  'help.guide.filter-places.tip.1':
    'Keď je otvorený deň, Plánované zobrazí iba tento deň a uvedie to: Zobrazuje sa iba otvorený deň, a vedľa toho Zobraziť celú cestu.',
  'help.guide.filter-places.tip.2':
    'Aj mapa sa zúži na otvorený deň; Všetky v zozname stále zobrazuje všetky miesta cesty.',
  // edit-place
  'help.guide.edit-place.title': 'Zmeňte miesto',
  'help.guide.edit-place.goal': 'Opravte názov, presuňte špendlík, pridajte webovú stránku alebo zmeňte kategóriu.',
  'help.guide.edit-place.step.1':
    'Kliknite pravým tlačidlom na riadok a zvoľte Upraviť, alebo otvorte miesto a v jeho podrobnostiach kliknite na Upraviť.',
  'help.guide.edit-place.step.2':
    'Zmeňte, čo potrebujete: Názov, Popis, Poznámky, Adresa, Zemepisná šírka a Zemepisná dĺžka, Kategória, Webová stránka. Ak formulár otvoríte z dňa, obsahuje aj Poznámky pre tento deň a Začiatok a Do pre tento deň.',
  'help.guide.edit-place.step.3': 'Kliknite na Aktualizovať.',
  'help.guide.edit-place.result':
    'Zmena sa prejaví všade, kde sa miesto zobrazuje: v zozname, na mape a v každom dni, v ktorom je.',
  'help.guide.edit-place.tip.1':
    'Poznámky pre tento deň patria k miestu iba v tom jednom dni; Poznámky patria k samotnému miestu.',
  'help.guide.edit-place.tip.2':
    'Ak je Do pred Začiatkom, Aktualizovať nebude možné; Časový prekryv s: iba upozorňuje, že iná zastávka dňa má rovnaký čas.',
  // delete-place
  'help.guide.delete-place.title': 'Vymažte miesto',
  'help.guide.delete-place.goal': 'Natrvalo odstráňte miesto z cesty.',
  'help.guide.delete-place.step.1':
    'Kliknite pravým tlačidlom na riadok a zvoľte Vymazať, alebo kliknite na Vymazať v podrobnostiach miesta.',
  'help.guide.delete-place.step.2':
    'Potvrďte. Ak bola v mieste rezervovaná noc alebo je s ním prepojená rezervácia, otázka uvedie, čo sa odstráni spolu s ním.',
  'help.guide.delete-place.result':
    'Miesto zmizne zo zoznamu, z mapy aj zo všetkých dní; Vrátiť späť na paneli nástrojov nad dňami ho obnoví.',
  'help.guide.delete-place.tip.1':
    'Ak chcete miesto odobrať iba z jedného dňa, použite radšej Odobrať z dňa pri danej zastávke.',
  'help.guide.delete-place.tip.2': 'Viac miest naraz: symbol zaškrtnutia vedľa filtrov spustí výber.',
  // select-places
  'help.guide.select-places.title': 'Zmeňte alebo vymažte viac miest naraz',
  'help.guide.select-places.goal': 'Upracte zoznam naraz namiesto po jednom mieste.',
  'help.guide.select-places.step.1':
    'Kliknite na symbol zaškrtnutia na pravom konci riadka filtrov. Riadky dostanú zaškrtávacie políčka a zobrazí sa lišta s akciami.',
  'help.guide.select-places.step.2':
    'Zaškrtnite riadky alebo použite Vybrať všetko na lište; lišta ukazuje počet vybraných.',
  'help.guide.select-places.step.3':
    'Zmeniť kategóriu im všetkým priradí jednu kategóriu; Uložiť do zbierky ich skopíruje do jednej z vašich zbierok; Vymazať vybrané ich po potvrdení odstráni.',
  'help.guide.select-places.step.4': 'Opätovným kliknutím na symbol zaškrtnutia výber ukončíte.',
  'help.guide.select-places.result':
    'Zmena sa použije na každé vybrané miesto; vymazanie možno vrátiť späť z panela nástrojov nad dňami.',
  'help.guide.select-places.tip.1':
    'Filtre počas výberu naďalej fungujú: najprv vyfiltrujte Nezaradené, potom Vybrať všetko zachytí presne tie.',
  'help.guide.select-places.tip.2':
    'Označiť ako navštívené vo vašich zoznamoch sa na lište zobrazí, keď je zapnutý doplnok Zbierky: označí miesta ako navštívené v zbierkach, v ktorých sú uložené.',
  // import-places-file
  'help.guide.import-places-file.title': 'Importujte miesta zo súboru GPX, KML alebo KMZ',
  'help.guide.import-places-file.goal': 'Načítajte to, čo exportovali Google My Maps, Google Earth alebo GPS tracker.',
  'help.guide.import-places-file.step.1': 'Kliknite na Importovať súbor alebo pustite súbor kamkoľvek na stĺpec miest.',
  'help.guide.import-places-file.step.2':
    'Vyberte súbor alebo ho potiahnite do poľa. Pri GPX zaškrtnite, čo sa má importovať: Trasové body, Trasy, Trasy GPS (s geometriou cesty); pri KML a KMZ Body (Placemarks) a Cesty (LineStrings).',
  'help.guide.import-places-file.step.3':
    'Pole prijme viac súborov naraz, ale iba .gpx, .kml a .kmz. Iný druh súboru alebo súbor nad 10 MB sa v dialógu odmietne a neimportuje.',
  'help.guide.import-places-file.step.4':
    'Kliknite na Importovať. Správa uvedie, koľko miest pribudlo; pri súbore KML alebo KMZ zostane dialóg otvorený so súhrnom toho, čo sa vytvorilo a čo sa preskočilo.',
  'help.guide.import-places-file.result':
    'Miesta sú v zozname; stopa má vo svojom riadku značku trasy, vykreslí sa na mape a dostane vlastný filter Trasy.',
  'help.guide.import-places-file.tip.1':
    'Príliš veľký súbor sa odmietne s uvedením limitu veľkosti; exportujte ho znova bez fotiek alebo ho rozdeľte.',
  'help.guide.import-places-file.tip.2': 'Import možno vrátiť späť ako celok z panela nástrojov nad dňami.',
  // import-places-list
  'help.guide.import-places-list.title': 'Importujte zdieľaný zoznam z Google Maps alebo Naver Maps',
  'help.guide.import-places-list.goal': 'Premeňte odkaz na zdieľaný zoznam na miesta.',
  'help.guide.import-places-list.step.1': 'Kliknite na Import zoznamu a zvoľte Zoznam Google alebo Zoznam Naver.',
  'help.guide.import-places-list.step.2':
    'Vložte zdieľaný odkaz na zoznam. Funguje aj odkaz na trasu v Google Maps: jej zastávky sa stanú miestami v poradí jazdy.',
  'help.guide.import-places-list.step.3': 'Kliknite na Importovať.',
  'help.guide.import-places-list.result':
    'Každé miesto zo zoznamu je v ceste s rovnakým názvom ako v zozname; miesta, ktoré už v ceste sú, sa preskočia.',
  'help.guide.import-places-list.tip.1':
    'Zoznam musí byť zdieľaný verejne; z odkazu na súkromný zoznam sa nič neimportuje.',
  'help.guide.import-places-list.tip.2':
    'Obohatiť miesta cez Google sa v dialógu zobrazí, keď má váš TREK kľúč Google: vyhľadá každé importované miesto a doplní fotky, adresu a podrobnosti.',

  // ── Screen: trip-days ─────────────────────────────────────────────────────────────────
  'help.ctx.trip-days.title': 'Dni',
  'help.ctx.trip-days.summary':
    'Ľavý stĺpec plánu: jedna karta na každý deň so zastávkami v poradí, poznámkami, rezerváciami a dopravou daného dňa a trasou medzi zastávkami. Práve tu sa cesta skutočne plánuje.',
  'help.ctx.trip-days.bullet.1':
    'Panel nástrojov hore: Exportovať (PDF, kalendár, GPX), Rozbaliť všetky dni / Zbaliť všetky dni, šípka späť, Zmeniť poradie dní a Zobraziť všetky trasy rezervácií.',
  'help.ctx.trip-days.bullet.2':
    'Karta dňa: v hlavičke číslo, počasie, názov, dátum a náklady dňa; kliknutím na hlavičku deň otvoríte, jej šípkou ho zbalíte. V hlavičke sú aj Verejná doprava, Pridať dopravu a Pridať poznámku.',
  'help.ctx.trip-days.bullet.3':
    'V rámci dňa: zastávky v poradí, každá s obrázkom, názvom, časom a zámkom na obrázku; poznámky; rezervácie patriace k dňu; a medzi zastávkami čas cesty každého úseku.',
  'help.ctx.trip-days.bullet.4':
    'Pod zastávkami je lišta trasy: Trasa vykreslí deň na mape, Optimalizovať zoradí zastávky, Autom / Pešo nastaví spôsob presunu pre deň, Otvoriť v Mapách Google a Otvoriť v CoMaps odovzdajú deň do týchto aplikácií.',
  'help.ctx.trip-days.bullet.5':
    'Miesta sa do dňa dostanú potiahnutím riadka zo stĺpca miest, tlačidlom + v tomto riadku, tlačidlom Pridať miesto k tomuto dňu v prázdnom dni alebo z podrobností miesta.',
  'help.ctx.trip-days.bullet.6':
    'Celkové náklady v dolnej časti sčítajú každú zastávku a rezerváciu s cenou, v mene cesty.',
  // read-day-plan
  'help.guide.read-day-plan.title': 'Porozumejte karte dňa',
  'help.guide.read-day-plan.goal': 'Zistite, čo vám hovorí každá časť karty dňa, skôr než niečo zmeníte.',
  'help.guide.read-day-plan.step.1':
    'Hlavička: číslo dňa, predpoveď počasia na deň, Deň 1 alebo názov, ktorý ste mu dali, dátum a náklady dňa. Kliknutím na hlavičku deň otvoríte (nad mapou sa otvorí panel s jeho podrobnosťami); šípka vpravo kartu zbalí a rozbalí.',
  'help.guide.read-day-plan.step.2':
    'Zastávka: úchytom vľavo ju potiahnete, obrázok nesie zámok pre optimalizáciu trasy, potom nasleduje názov, popis a prípadne poznámky pre tento deň. Časový štítok zobrazuje Začiatok a Do, ak ich zastávka má; šípky, ktoré sa zobrazia na jej pravom konci, ju posúvajú nahor alebo nadol.',
  'help.guide.read-day-plan.step.3':
    'Rezervácia v dni: rezervácia pri zastávke ju označí ako Rezervácia potvrdená alebo Rezervácia čaká a doprava sa zobrazí ako Odlet alebo Prílet s časom a trasou, s malým prepínačom, ktorý túto trasu vykreslí na mape.',
  'help.guide.read-day-plan.step.4':
    'Spojnica medzi dvoma zastávkami uvádza, ako dlho úsek trvá a aký je dlhý, v spôsobe presunu daného dňa; kliknutím na ňu zmeníte spôsob presunu iba pre tento úsek.',
  'help.guide.read-day-plan.step.5':
    'Lišta trasy na konci: Trasa vykreslí cestu dňa na mape, Optimalizovať zmení poradie zastávok, tlačidlá spôsobu presunu vyberú Autom alebo Pešo, Otvoriť v Mapách Google a Otvoriť v CoMaps otvoria deň v týchto aplikáciách.',
  'help.guide.read-day-plan.result':
    'Každý symbol na karte má svoj význam; návody nižšie ukazujú, ako každý z nich zmeniť.',
  'help.guide.read-day-plan.tip.1':
    'Kliknutím pravým tlačidlom na zastávku otvoríte jej ponuku: Upraviť, Odobrať z dňa, Otvoriť webovú stránku, navigačné aplikácie (Google Maps, Waze, Apple Maps, OpenStreetMap, CoMaps), Uložiť do zbierky, Vymazať.',
  'help.guide.read-day-plan.tip.2':
    'Keď podržíte kurzor nad zastávkou, na jej konci sa zobrazí Pridať rezerváciu: rezervácia vytvorená tam je viazaná na túto zastávku v tento deň.',
  // place-onto-day
  'help.guide.place-onto-day.title': 'Pridajte miesto do dňa',
  'help.guide.place-onto-day.goal': 'Premeňte miesto zo zoznamu na zastávku dňa, na správnom mieste v poradí.',
  'help.guide.place-onto-day.step.1':
    'Potiahnite riadok zo stĺpca miest na kartu dňa. Pustite ho medzi dve zastávky, ak ho chcete umiestniť presne tam, alebo kamkoľvek na kartu, ak ho chcete pridať na koniec.',
  'help.guide.place-onto-day.step.2':
    'Bez ťahania: otvorte deň kliknutím na jeho hlavičku a potom kliknite na + na konci riadka miesta, alebo kliknite na riadok pravým tlačidlom a zvoľte Pridať k dňu.',
  'help.guide.place-onto-day.step.3':
    'V prázdnom dni otvorí Pridať miesto k tomuto dňu formulár miesta a nové miesto sa hneď pridá k dňu.',
  'help.guide.place-onto-day.step.4':
    'Z podrobností miesta sa Pridať k dňu opýta, ku ktorému dňu; po otvorení dňa cez jeho hlavičku vytvorí Ku dňu v stĺpci miest nové miesto v otvorenom dni.',
  'help.guide.place-onto-day.result':
    'Miesto je zastávkou dňa, na mape s číslom dňa, a stĺpec miest ho započíta pod Plánované.',
  'help.guide.place-onto-day.tip.1':
    'Miesto môže byť vo viacerých dňoch: do druhého dňa ho pridajte zo stĺpca miest. Potiahnutie zastávky z jednej karty dňa na inú ju naopak presunie.',
  'help.guide.place-onto-day.tip.2': 'Šípka späť na paneli nástrojov priradenie zruší.',
  'help.guide.place-onto-day.tip.3':
    'Zastávku nemožno pustiť medzi dva záznamy s pevným časom ani pred rezerváciu, ktorá už má čas; plán si zachováva chronologické poradie.',
  // reorder-stops
  'help.guide.reorder-stops.title': 'Zmeňte poradie v dni',
  'help.guide.reorder-stops.goal': 'Posuňte zastávku nahor alebo nadol, prípadne do iného dňa.',
  'help.guide.reorder-stops.step.1': 'Potiahnite zastávku za úchyt na novú pozíciu v karte.',
  'help.guide.reorder-stops.step.2':
    'Alebo použite šípky na pravom konci zastávky: každé kliknutie ju posunie o jeden krok nahor alebo nadol.',
  'help.guide.reorder-stops.step.3':
    'Potiahnutím zastávky na kartu iného dňa ju tam presuniete; z pôvodného dňa zmizne.',
  'help.guide.reorder-stops.step.4':
    'Zastávka s pevným časom sa opýta Odobrať čas?, ak by presun narušil poradie dňa, pretože jej miesto určil čas: Potvrdiť čas odoberie a zastávku potom môžete umiestniť kamkoľvek.',
  'help.guide.reorder-stops.result': 'Trasa a časy presunov sa okamžite prispôsobia novému poradiu.',
  'help.guide.reorder-stops.tip.1':
    'Rezervácie s pevným časom nie je možné preusporiadať; sú tam, kam ich zaraďuje ich čas.',
  'help.guide.reorder-stops.tip.2':
    'Optimalizovať na lište trasy zoradí celý deň podľa najkratšej cesty; ak chcete zastávku ponechať na mieste, najprv ju zamknite.',
  // set-stop-times
  'help.guide.set-stop-times.title': 'Nastavte zastávke čas',
  'help.guide.set-stop-times.goal': 'Určte, kedy zastávka začína a končí, aby sa deň čítal ako harmonogram.',
  'help.guide.set-stop-times.step.1':
    'Kliknite pravým tlačidlom na zastávku a zvoľte Upraviť. Ak formulár otvoríte z dňa, v dolnej časti má polia Začiatok a Do.',
  'help.guide.set-stop-times.step.2':
    'Zadajte Začiatok a podľa potreby aj Do. Časový prekryv s: upozorňuje, že sa prekrýva iná zastávka dňa s časom; ak je Do pred Začiatkom, Aktualizovať nebude možné.',
  'help.guide.set-stop-times.step.3':
    'Kliknite na Aktualizovať. Zastávka dostane časový štítok a presunie sa na miesto v dni, kam podľa času patrí.',
  'help.guide.set-stop-times.result':
    'Zastávky s časom si udržia svoje miesto v poradí; zastávky bez času sa zoradia okolo nich.',
  'help.guide.set-stop-times.tip.1': 'Čas patrí k zastávke v danom dni; rovnaké miesto môže mať v inom dni iný čas.',
  'help.guide.set-stop-times.tip.2':
    'Ak chcete zastávku s časom presunúť ručne, potiahnite ju: otázka Odobrať čas? čas pri presune odoberie, keď kliknete na Potvrdiť.',
  'help.guide.set-stop-times.tip.3':
    'Poznámky pre tento deň v tom istom formulári obsahujú to, čo platí iba v tento deň, napríklad rezervovaný stôl alebo číslo lístka.',
  // remove-from-day
  'help.guide.remove-from-day.title': 'Odoberte zastávku z dňa',
  'help.guide.remove-from-day.goal': 'Zrušte naplánovanie miesta bez toho, aby ste ho vymazali z cesty.',
  'help.guide.remove-from-day.step.1': 'Kliknite pravým tlačidlom na zastávku a zvoľte Odobrať z dňa.',
  'help.guide.remove-from-day.step.2':
    'Zastávka z dňa zmizne; miesto zostane v stĺpci miest, v časti Nezaradené, ak nie je v žiadnom inom dni.',
  'help.guide.remove-from-day.result': 'Deň, jeho trasa a náklady sa aktualizujú; šípka späť zastávku vráti.',
  'help.guide.remove-from-day.tip.1': 'Vymazať v tej istej ponuke odstráni miesto z celej cesty vrátane všetkých dní.',
  'help.guide.remove-from-day.tip.2': 'Odobrať z dňa je aj v paneli podrobností miesta, vedľa Pridať k dňu.',
  // lock-stop
  'help.guide.lock-stop.title': 'Uzamknite zastávku na mieste',
  'help.guide.lock-stop.goal': 'Ponechajte zastávku na jej mieste pri optimalizácii trasy.',
  'help.guide.lock-stop.step.1':
    'Podržte kurzor nad obrázkom zastávky a kliknite na zámok: Zachovať pozíciu pri optimalizácii trasy.',
  'help.guide.lock-stop.step.2':
    'Optimalizovať teraz zoradí ostatné zastávky okolo nej; opätovným kliknutím na zámok (Kliknutím odomknete) ju uvoľníte.',
  'help.guide.lock-stop.result': 'Zámok sa zobrazuje na obrázku; zastávka si drží svoju pozíciu, kým ju neodomknete.',
  'help.guide.lock-stop.tip.1': 'Zastávku s pevným časom uzamyká jej čas; pri optimalizácii sa nikdy nepresunie.',
  'help.guide.lock-stop.tip.2':
    'Zámok platí počas tejto návštevy: po opätovnom načítaní sú všetky zastávky znova voľné, pevné zostanú iba zastávky s časom.',
  // day-note
  'help.guide.day-note.title': 'Pridajte k dňu poznámku',
  'help.guide.day-note.goal': 'Majte pripomienku, číslo lístka alebo plán B priamo v dni.',
  'help.guide.day-note.step.1': 'Kliknite na Pridať poznámku v hlavičke dňa.',
  'help.guide.day-note.step.2':
    'Do poľa Poznámka zadajte názov (ten sa zobrazí na karte dňa) a zvyšok napíšte do poľa Poznámka ku dňu. Panel nástrojov nad ním formátuje text (tučné písmo, zoznamy, odkazy, citáty) a Náhľad vľavo ukazuje, ako bude karta vyzerať.',
  'help.guide.day-note.step.3':
    'Vyberte Ikonu a Farbu, aby sa poznámka odlíšila od zastávok, a potom kliknite na Pridať.',
  'help.guide.day-note.step.4':
    'Poznámka je v dni ako zastávka: potiahnite ju na správne miesto, kliknutím pravým tlačidlom otvoríte Upraviť a Vymazať.',
  'help.guide.day-note.result':
    'Poznámka je súčasťou dňa, aj v PDF; poznámka s časom sa zoradí spolu so zastávkami s časom.',
  'help.guide.day-note.tip.1':
    'Poznámka s časom môže nahradiť dopravu, na ktorú nemáte rezerváciu: „08:15 S3 z hlavnej stanice“.',
  'help.guide.day-note.tip.2': 'Poznámky sú pre jednotlivé dni; poznámka pre celú cestu patrí do Spolupráce.',
  // day-route
  'help.guide.day-route.title': 'Zobrazte a optimalizujte trasu dňa',
  'help.guide.day-route.goal':
    'Pozrite si cestu medzi zastávkami, vyberte spôsob presunu a nechajte TREK zoradiť poradie.',
  'help.guide.day-route.step.1':
    'Otvorte deň a kliknite na Trasa na lište trasy: cesta medzi zastávkami sa vykreslí na mape a spojnice medzi zastávkami ukážu čas a vzdialenosť každého úseku.',
  'help.guide.day-route.step.2':
    'Autom a Pešo vedľa nej nastavia spôsob presunu pre deň; úseky sa prepočítajú. Pluginy môžu pridať vlastné spôsoby.',
  'help.guide.day-route.step.3':
    'Kliknutím na spojnicu zmeníte spôsob presunu iba pre tento úsek: vyberte spôsob alebo Použiť predvolené pre deň, ak sa chcete vrátiť k nastaveniu dňa.',
  'help.guide.day-route.step.4':
    'Optimalizovať zoradí zastávky podľa najkratšej cesty. Zastávky so zámkom alebo s pevným časom si udržia svoje miesto; ak má deň ubytovanie, trasa začína tam.',
  'help.guide.day-route.step.5':
    'Otvoriť v Mapách Google alebo Otvoriť v CoMaps otvorí celý deň ako trasu v danej aplikácii, na navigáciu počas cesty.',
  'help.guide.day-route.result': 'Deň je trasa s časmi; Celkové náklady a úseky sa aktualizujú pri zmene poradia.',
  'help.guide.day-route.tip.1':
    'Trasy predvolene poskytuje OSRM; správca môže v časti Predvolené nastavenia používateľa nasmerovať TREK na iný smerovací nástroj.',
  'help.guide.day-route.tip.2':
    'Úsek, pre ktorý sa nepodarilo nájsť trasu, nezobrazuje čas; skontrolujte, či obe zastávky majú súradnice.',
  'help.guide.day-route.tip.3': 'Šípka späť optimalizáciu vráti.',
  // manage-days
  'help.guide.manage-days.title': 'Pridávajte, preusporiadajte a premenujte dni',
  'help.guide.manage-days.goal': 'Upravujte samotné dni, nielen to, čo obsahujú.',
  'help.guide.manage-days.step.1':
    'Dni vychádzajú z dátumov cesty; zmeňte dátumy na karte cesty v Prehľade a dni sa pridajú alebo odoberú na koncoch. Skôr než sa odoberie deň, ktorý niečo obsahuje, zoznam ukáže, ktoré dni zmiznú a čo v nich je.',
  'help.guide.manage-days.step.2':
    'Zmeniť poradie dní na paneli nástrojov otvorí zoznam: Posunúť nahor a Posunúť nadol presunú deň so všetkým, čo obsahuje, a Vymazať deň, kôš vedľa nich, ho odstráni. Tlačidlo s ďalším dátumom pod zoznamom pridá deň hneď za posledný deň s dátumom a predĺži cestu o jeden deň; Bez dátumu pridá na koniec deň bez dátumu.',
  'help.guide.manage-days.step.3':
    'Vymazať deň sa najprv opýta: uvedie, čo sa odstráni spolu s dňom (jeho miesta, poznámky a rezervácie, pobyt s príchodom alebo odchodom v tento deň) a ktoré dni sa posunú o dátum dopredu. Vymazať deň ho odstráni, Zrušiť ho ponechá; posledný deň nemožno vymazať.',
  'help.guide.manage-days.step.4':
    'Ak chcete deň premenovať, otvorte ho a kliknite na ceruzku vedľa jeho názvu v paneli podrobností nad mapou; názov nahradí Deň 1 na karte aj v PDF.',
  'help.guide.manage-days.step.5':
    'Rozbaliť všetky dni a Zbaliť všetky dni na paneli nástrojov rozbalia alebo zbalia všetky karty naraz; jednotlivú kartu zbalíte jej šípkou.',
  'help.guide.manage-days.result':
    'Dátumy zostávajú viazané na pozíciu: deň posunutý nahor dostane skorší dátum a jeho zastávky, poznámky a rezervácie sa presunú spolu s ním.',
  'help.guide.manage-days.tip.1': 'Presun dní možno vrátiť späť z panela nástrojov, vymazanie dňa nie.',
  'help.guide.manage-days.tip.2': 'Náklady v hlavičke dňa sčítavajú zastávky a rezervácie daného dňa, ktoré majú cenu.',
  // bookings-in-plan
  'help.guide.bookings-in-plan.title': 'Orientujte sa v rezerváciách a doprave v pláne',
  'help.guide.bookings-in-plan.goal':
    'Zistite, kde sa rezervácia zobrazí, keď už existuje, a na ktorej obrazovke sa vytvára.',
  'help.guide.bookings-in-plan.step.1':
    'Doprava (let, vlak, trajekt, autobus, auto) sa zobrazí v deň odchodu ako Odlet a v deň príchodu ako Prílet, s časom a trasou; viacdenná doprava sa tiahne cez dni medzi nimi.',
  'help.guide.bookings-in-plan.step.2':
    'Rezervácia viazaná na zastávku (reštaurácia, prehliadka) označí túto zastávku ako Rezervácia potvrdená alebo Rezervácia čaká; rezervácia s dňom, ale bez zastávky, má v dni vlastný riadok.',
  'help.guide.bookings-in-plan.step.3':
    'Noc v hoteli je ubytovanie: nájdete ho v paneli podrobností dňa v časti Ubytovanie, od príchodu po odchod, a trasa každého z týchto dní začína tam.',
  'help.guide.bookings-in-plan.step.4':
    'Prepínač v riadku dopravy vykreslí jej trasu na mape; Zobraziť všetky trasy rezervácií na paneli nástrojov vykreslí všetky.',
  'help.guide.bookings-in-plan.step.5':
    'Vytváranie: Pridať rezerváciu pri zastávke pod kurzorom, Pridať dopravu a Verejná doprava v hlavičke dňa a karty Rezervácie a Doprava pre úplný zoznam s importom a súbormi.',
  'help.guide.bookings-in-plan.result':
    'Jedna rezervácia, jedno miesto v pláne; karty zobrazujú tie isté rezervácie ako zoznam.',
  'help.guide.bookings-in-plan.tip.1':
    'Potvrdené a čakajúce je stav, ktorý nastavíte v rezervácii; plán ho zobrazuje pri zastávke, karta Rezervácie počíta oba.',
  'help.guide.bookings-in-plan.tip.2':
    'Dopravu s pevným časom nemožno potiahnuť; namiesto toho zmeňte jej čas v rezervácii.',
  // export-plan
  'help.guide.export-plan.title': 'Exportujte plán',
  'help.guide.export-plan.goal': 'Vezmite si plán so sebou ako dokument, do kalendára alebo do GPS.',
  'help.guide.export-plan.step.1': 'Kliknite na Exportovať na paneli nástrojov nad dňami.',
  'help.guide.export-plan.step.2':
    'Dokument: PDF otvorí tlačové zobrazenie všetkých dní so zastávkami, poznámkami a rezerváciami; Zalomenie strany pre každý deň začne každý deň na novej strane, Uložiť ako PDF ho stiahne.',
  'help.guide.export-plan.step.3':
    'Kalendár: Stiahnuť .ics uloží rezervácie ako súbor kalendára; Prihlásiť sa na odber kalendára poskytne odkaz, ktorý vaša kalendárová aplikácia sama obnovuje.',
  'help.guide.export-plan.step.4':
    'Mapy a GPS · GPX: Celá cesta exportuje miesta, trasy dní a stopy; Len miesta iba špendlíky; Dni ako trasy jednu trasu na deň, pre offline mapy a GPS zariadenia.',
  'help.guide.export-plan.result': 'Súbor sa stiahne; v ceste sa nič nezmení.',
  'help.guide.export-plan.tip.1':
    'Jednotlivý deň pošlete do mapovej aplikácie z jeho lišty trasy: Otvoriť v Mapách Google alebo Otvoriť v CoMaps.',
  'help.guide.export-plan.tip.2':
    'Prihlásiť sa na odber kalendára vyžaduje zapnuté kalendárové kanály vo vašich nastaveniach; návod nájdete v Prehľade.',
  'help.guide.export-plan.tip.3': 'Export je len čítanie: môže ho urobiť každý člen cesty.',

  // ── Screen: trip-place ────────────────────────────────────────────────────────────────
  'help.ctx.trip-place.title': 'Podrobnosti miesta',
  'help.ctx.trip-place.summary':
    'Karta, ktorá sa otvorí nad mapou, keď vyberiete miesto: všetko, čo cesta o ňom vie, hviezdičky, ktoré mu všetci dali, jeho obrázok a súbory a tlačidlá, ktorými ho pridáte do otvoreného dňa, do zoznamu alebo do mapovej aplikácie.',
  'help.ctx.trip-place.bullet.1':
    'Kliknite na riadok v stĺpci miest, na zastávku v dni alebo na značku na mape a karta sa otvorí nad mapou. Keď miesto vyberiete v dni, karta vie, ktorú zastávku myslíte, a preto zobrazí aj účastníkov zastávky a jej rezerváciu.',
  'help.ctx.trip-place.bullet.2':
    'Hlavička obsahuje okrúhly obrázok, názov, kategóriu, adresu a súradnice. Kliknutím na obrázok použijete vlastný, dvojitým kliknutím na názov miesto hneď premenujete a X vpravo kartu zatvorí.',
  'help.ctx.trip-place.bullet.3':
    'Pod ňou: cena, ak ju miesto má, hviezdičky, ktoré mu dal každý cestovateľ, popis a poznámky a Poznámky pre tento deň, ak ich zastávka má.',
  'help.ctx.trip-place.bullet.4':
    'Nasledujú Otváracie hodiny, Farba trasy, Dáta trasy a Súbory, ak sa uplatňujú. Súbory prijmú čokoľvek z vašich priečinkov a zobrazia aj to, čo je pripojené k rezervácii tejto zastávky.',
  'help.ctx.trip-place.bullet.5':
    'Riadok v dolnej časti: Pridať k dňu alebo Odobrať z dňa, keď je otvorený deň, potom Uložiť do zbierky, Navigácia, Otvoriť webovú stránku, Upraviť a Vymazať.',
  'help.ctx.trip-place.bullet.6':
    'Miesto vybrané z vyhľadávania nesie to, čo o ňom vie index TREK alebo OpenStreetMap: zelený krúžok Otvorené alebo červený Uzavreté okolo obrázka podľa miestneho času miesta, telefónne číslo pod hviezdičkami, nižšie Otváracie hodiny s riadkom pre daný deň a celým týždňom po kliknutí a jeho webovú stránku pod tlačidlom Otvoriť webovú stránku. Hodnotenie Google sa zobrazuje iba pri mieste nájdenom cez Google, v TREK s kľúčom Google.',
  // read-place
  'help.guide.read-place.title': 'Čo vám karta povie o mieste',
  'help.guide.read-place.goal': 'Prečítajte si všetko, čo cesta vie o jednom mieste, na jednej karte.',
  'help.guide.read-place.step.1':
    'V stĺpci dní kliknite na zastávku, ktorú si chcete pozrieť. Karta sa otvorí nad mapou a zastávka zostane vo svojom dni označená.',
  'help.guide.read-place.step.2':
    'Hlavička: okrúhly obrázok, názov, adresa a presné súradnice. Zelený krúžok s nápisom Otvorené alebo červený s nápisom Uzavreté okolo obrázka ukazuje, či je miesto práve otvorené podľa jeho miestneho času, keď TREK pozná jeho otváracie hodiny. X vpravo kartu znova zatvorí.',
  'help.guide.read-place.step.3':
    'Pod ňou sú hviezdičky, ktoré miestu dal každý cestovateľ, s priemerom a počtom hlasov. Kým nikto nehodnotil, zobrazuje sa Zatiaľ bez hodnotenia. Hneď pod tým je telefónne číslo, ak ho miesto má: kliknutím naň ho odovzdáte aplikácii na telefonovanie.',
  'help.guide.read-place.step.4':
    'Potom popis a pod ním poznámky. Oboje je vykreslený text z formulára miesta: zoznamy, odkazy aj tučné písmo fungujú.',
  'help.guide.read-place.step.5': 'Účastníci ukazujú, kto ide na túto zastávku. Idú všetci, kým niekoho neodoberiete.',
  'help.guide.read-place.step.6':
    'Otváracie hodiny nižšie: riadok obsahuje hodiny dňa, na ktorý sa pozeráte, a kliknutím naň rozbalíte celý týždeň s týmto dňom zvýrazneným tučne. Vedľa sú Súbory.',
  'help.guide.read-place.step.7':
    'Riadok v dolnej časti ukazuje, čo tu môžete urobiť: odobrať miesto z otvoreného dňa alebo ho doň pridať, uložiť ho do zoznamu, otvoriť ho v mapovej aplikácii, upraviť ho alebo vymazať.',
  'help.guide.read-place.result':
    'Karta zostane otvorená, kým ju nezatvoríte cez X alebo nevyberiete iné miesto, hodiny týždňa zostanú rozbalené a zastávka, ku ktorej patrí, zostane označená v stĺpci dní.',
  'help.guide.read-place.tip.1':
    'Pri výbere zo stĺpca miest karta pozná miesto, ale nie zastávku, takže nezobrazí účastníkov ani rezerváciu. Vyberte radšej zastávku v dni a zobrazí sa oboje.',
  'help.guide.read-place.tip.2':
    'Dvojitým kliknutím na názov premenujete miesto bez otvorenia formulára. Enter uloží, Escape zmenu zahodí.',
  'help.guide.read-place.tip.3':
    'Ručne zadané miesto nič z toho nezobrazí: karta pozná iba to, čo obsahuje jeho formulár. Otvorte ho cez Upraviť, vyberte ho z návrhov v poli Hľadať miesta… a kliknite na Aktualizovať; otváracie hodiny, telefónne číslo a webová stránka sa doplnia. Hodnotenie Google vyžaduje kľúč Google.',
  // rate-place
  'help.guide.rate-place.title': 'Ohodnoťte miesto',
  'help.guide.rate-place.goal': 'Dajte miestu vlastné hviezdičky a pozrite sa, koľko mu dali ostatní.',
  'help.guide.rate-place.step.1':
    'Otvorte miesto. Riadok s hviezdičkami je hneď pod hlavičkou a ukazuje priemer doterajších hlasov s ich počtom v zátvorke.',
  'help.guide.rate-place.step.2':
    'Kliknite na požadovanú hviezdičku. Hviezdičky sa pri prechode kurzorom vypĺňajú, takže vidíte, aké hodnotenie sa chystáte dať.',
  'help.guide.rate-place.step.3':
    'Váš hlas sa okamžite započíta do priemeru a tváre vedľa neho ukazujú, kto hlasoval. Podržte kurzor nad riadkom a uvidíte hviezdičky všetkých.',
  'help.guide.rate-place.step.4':
    'Rovnaký priemer je aj v riadku miesta v stĺpci miest, takže dobré miesta v zozname vyniknú.',
  'help.guide.rate-place.result':
    'Vaše hviezdičky sú pri mieste viditeľné pre celú cestu a hviezdička v riadku filtrov nad zoznamom teraz môže ponechať iba miesta, ktoré dosahujú určitú hranicu.',
  'help.guide.rate-place.tip.1': 'Hodnotiť môže každý cestovateľ, aj v ceste, kde miesta môžu meniť iba niektorí.',
  'help.guide.rate-place.tip.2':
    'Kliknutím na hviezdičku, ktorú ste už dali, svoj hlas stiahnete. Ak už nikto nehlasuje, miesto opäť ukazuje Zatiaľ bez hodnotenia.',
  'help.guide.rate-place.tip.3':
    'Vedľa hviezdičiek sa zmestí až šesť hlasujúcich ako tváre; popis ich všetkých vymenuje a označí váš hlas.',
  // place-image
  'help.guide.place-image.title': 'Pridajte miestu vlastný obrázok',
  'help.guide.place-image.goal': 'Nahraďte automatickú miniatúru vlastnou fotkou.',
  'help.guide.place-image.step.1': 'Otvorte miesto zo stĺpca miest.',
  'help.guide.place-image.step.2':
    'Podržte kurzor nad okrúhlym obrázkom v hlavičke: zobrazí sa fotoaparát a popis Nahrať obrázok. Kliknite naň a vyberte svoj súbor.',
  'help.guide.place-image.step.3': 'Hlavička teraz zobrazuje váš obrázok s malým červeným X v rohu.',
  'help.guide.place-image.step.4': 'Rovnaký obrázok je aj v riadku miesta v stĺpci miest a na jeho značke na mape.',
  'help.guide.place-image.result':
    'Váš obrázok je obrázkom miesta všade: na karte, v stĺpci miest, pri zastávke v dni, na značke na mape aj v zdieľanej ceste.',
  'help.guide.place-image.tip.1': 'Prijímajú sa JPG, PNG, GIF a WebP a HEIC z iPhonu sa pri nahrávaní skonvertuje.',
  'help.guide.place-image.tip.2':
    'X v rohu váš obrázok znova odstráni a vráti sa automatický. Samotné miesto zostane nezmenené.',
  'help.guide.place-image.tip.3':
    'Bez vlastného obrázka TREK vyhľadá obrázok podľa súradníc miesta, inak použije ikonu kategórie.',
  // place-day-assign
  'help.guide.place-day-assign.title': 'Pridajte miesto do otvoreného dňa alebo ho z neho odoberte',
  'help.guide.place-day-assign.goal': 'Použite tlačidlo priamo na karte namiesto ťahania riadka cez plánovač.',
  'help.guide.place-day-assign.step.1':
    'Kliknite na hlavičku dňa v stĺpci dní. Tento deň je teraz otvorený a karta pracuje s ním.',
  'help.guide.place-day-assign.step.2':
    'V stĺpci miest kliknite na miesto, ktoré v tomto dni nie je. Otvorí sa jeho karta a riadok v dolnej časti ponúkne Pridať k dňu.',
  'help.guide.place-day-assign.step.3':
    'Kliknite na Pridať k dňu. Zastávka sa pridá na koniec dňa a tlačidlo sa zmení na Odobrať z dňa.',
  'help.guide.place-day-assign.step.4':
    'Zastávka je teraz v dni, posledná v zozname. Potiahnite ju nahor tam, kam patrí.',
  'help.guide.place-day-assign.step.5':
    'Odobrať z dňa túto zastávku z dňa znova odoberie a karta opäť ponúkne Pridať k dňu.',
  'help.guide.place-day-assign.result':
    'Deň zastávku obsahuje, alebo už nie, a samotné miesto zostane v oboch prípadoch nezmenené.',
  'help.guide.place-day-assign.tip.1':
    'Tlačidlo existuje iba vtedy, keď je otvorený deň. Bez neho karta nemá kam miesto pridať.',
  'help.guide.place-day-assign.tip.2':
    'Po odobratí zastávky z dňa zostane miesto v ceste aj v stĺpci miest. Všade ho odstráni iba Vymazať.',
  'help.guide.place-day-assign.tip.3':
    'Zastávka, ktorú do dňa pridala rezervácia ubytovania, neponúka ani jedno tlačidlo: túto noc pridáte a odoberiete v bloku nocľahu daného dňa.',
  // place-participants
  'help.guide.place-participants.title': 'Určte, kto ide na túto zastávku',
  'help.guide.place-participants.goal': 'Rozdeľte skupinu pre jednu zastávku bez rozdelenia cesty.',
  'help.guide.place-participants.step.1':
    'Kliknite na zastávku v dni. Otvorí sa karta a Účastníci uvedú všetkých v ceste.',
  'help.guide.place-participants.step.2':
    'Kliknutím na štítok cestovateľa ho z tejto zastávky odoberiete. Keď nad menom podržíte kurzor, zobrazí sa prečiarknuté.',
  'help.guide.place-participants.step.3':
    'Hneď ako niekto chýba, zobrazí sa prerušované +. Kliknutím naň uvidíte, kto na zastávke nie je.',
  'help.guide.place-participants.step.4':
    'Kliknutím na meno danú osobu vrátite. Keď sú späť všetci, zastávka opäť patrí celej skupine.',
  'help.guide.place-participants.result':
    'Zastávka má cestovateľov, ktorých ste vybrali, a zvyšok skupiny má toto popoludnie pre seba.',
  'help.guide.place-participants.tip.1':
    'Účastníci sa zobrazia iba pri vybranej zastávke, preto vyberte miesto v dni, nie v stĺpci miest, a iba v ceste s viac ako jedným cestovateľom.',
  'help.guide.place-participants.tip.2':
    'Ak nie je vybraný nikto, idú všetci, a preto posledného cestovateľa, ktorý na zastávke zostal, nemožno odobrať.',
  'help.guide.place-participants.tip.3': 'Hosť, ktorý nemá vlastný účet, môže byť účastníkom ako ktokoľvek iný.',
  // place-booking
  'help.guide.place-booking.title': 'Rezervácia na zastávke',
  'help.guide.place-booking.goal':
    'Prečítajte si rezerváciu, ktorá patrí k zastávke, otvorte ju a pripnite k nej novú.',
  'help.guide.place-booking.step.1':
    'Otvorte zastávku, ku ktorej rezervácia patrí. Karta zobrazuje pás so stavom Potvrdené alebo Čaká na potvrdenie a názvom rezervácie.',
  'help.guide.place-booking.step.2': 'Pás obsahuje Dátum, Čas a Rezervačný kód, ako aj poznámky, ktoré rezervácia má.',
  'help.guide.place-booking.step.3': 'Kliknite na pás. Otvorí sa formulár samotnej rezervácie.',
  'help.guide.place-booking.step.4':
    'Rezerváciu k zastávke pripína pole Prepojiť s priradením dňa a tu už uvádza práve túto zastávku. Formulár opäť zatvorte.',
  'help.guide.place-booking.step.5':
    'Nová rezervácia pre zastávku sa začína v stĺpci dní: prejdite myšou na zastávku a kliknite na + na jej konci. Formulár sa otvorí ako Nová rezervácia, už prepojený so zastávkou.',
  'help.guide.place-booking.result':
    'Rezervácia visí na zastávke: je na karte, je v dni a jej súbory sú uvedené aj tu v časti Súbory.',
  'help.guide.place-booking.tip.1':
    'Pás sa zobrazuje len pri zastávke, ku ktorej je rezervácia pripnutá. Rezervácia bez zastávky je na záložke Rez.',
  'help.guide.place-booking.tip.2':
    'Jednu zastávku môže zdieľať viacero rezervácií: obed aj prehliadka, ktorá začína pred tými istými dverami.',
  'help.guide.place-booking.tip.3':
    'Vlak, let alebo trajekt namiesto toho otvorí formulár dopravy, ten istý, ktorý používa záložka Doprava.',
  // place-files
  'help.guide.place-files.title': 'Majte vstupenky k miestu priamo pri mieste',
  'help.guide.place-files.goal': 'Uložte vstupenku, poukaz alebo mapu k miestu tam, kde ju budete hľadať.',
  'help.guide.place-files.step.1':
    'Otvorte miesto. Súbory sú v spodnej časti karty a kým miesto nemá žiadne, je tam len nápis Súbory.',
  'help.guide.place-files.step.2': 'Kliknite vedľa na Nahrať a vyberte súbor.',
  'help.guide.place-files.step.3': 'Tlačidlo ukazuje počet súborov miesta a zoznam sa sám rozbalí.',
  'help.guide.place-files.step.4': 'Každý riadok obsahuje názov súboru a jeho veľkosť. Kliknutím súbor otvoríte.',
  'help.guide.place-files.result':
    'Súbor je uložený pri mieste, započítaný na karte a nájdete ho aj na záložke Súbory cesty.',
  'help.guide.place-files.tip.1':
    'Súbory zobrazujú aj to, čo visí na rezervácii tejto zastávky, takže potvrdenie z hotela sa ukáže pri hoteli.',
  'help.guide.place-files.tip.2': 'Nahrať prijme naraz viacero súborov.',
  'help.guide.place-files.tip.3':
    'Bez oprávnenia nahrávať súbory tlačidlo Nahrať chýba; súbory, ktoré už pri mieste sú, však zostávajú.',
  // place-navigation
  'help.guide.place-navigation.title': 'Otvorte miesto v mapovej aplikácii alebo na jeho webovej stránke',
  'help.guide.place-navigation.goal': 'Odovzdajte miesto aplikácii, ktorá vás tam naozaj dovedie.',
  'help.guide.place-navigation.step.1': 'Otvorte miesto a v riadku dole kliknite na Navigácia.',
  'help.guide.place-navigation.step.2':
    'Zoznam obsahuje mapové aplikácie, ktoré sa pre toto miesto hodia: Google Maps, Waze, Apple Maps, OpenStreetMap a CoMaps.',
  'help.guide.place-navigation.step.3':
    'Kliknite na tú, ktorú používate. TREK jej tam, kde sa dá, odovzdá samotné miesto, nielen dvojicu súradníc, takže skončíte pri správnom vchode.',
  'help.guide.place-navigation.step.4':
    'Otvoriť webovú stránku vedľa neho otvorí vlastnú stránku miesta s otváracími časmi a vstupenkami na novej karte prehliadača.',
  'help.guide.place-navigation.result':
    'Mapová aplikácia sa otvorí na mieste, webová stránka na vlastnej karte prehliadača a v ceste sa nič nezmení.',
  'help.guide.place-navigation.tip.1':
    'Waze hneď spustí navigáciu. Ostatné otvoria miesto a spustiť ju odtiaľ je už len jedno ťuknutie.',
  'help.guide.place-navigation.tip.2':
    'Ktoré aplikácie sa ponúknu, závisí od miesta a od vášho zariadenia: Apple Maps na Androide chýba, 高德地图 sa zobrazí len pre miesto v Číne a Waze, Apple Maps a CoMaps potrebujú súradnice miesta.',
  'help.guide.place-navigation.tip.3':
    'Keď pripadá do úvahy len jedna aplikácia, tlačidlo nesie jej názov a rovno ju otvorí.',
  // place-to-collection
  'help.guide.place-to-collection.title': 'Uložte miesto do jedného zo svojich zoznamov',
  'help.guide.place-to-collection.goal': 'Uchovajte si miesto, ktoré ste našli na tejto ceste, pre tú ďalšiu.',
  'help.guide.place-to-collection.step.1': 'Otvorte miesto a v spodnej časti karty kliknite na Uložiť do zbierky.',
  'help.guide.place-to-collection.step.2':
    'Uložiť do zoznamu ukazuje všetky zoznamy, ktoré vlastníte alebo zdieľate. Fajka označuje tie, ktoré už toto miesto obsahujú.',
  'help.guide.place-to-collection.step.3': 'Kliknite na zoznam. Miesto je v ňom okamžite.',
  'help.guide.place-to-collection.step.4': 'Zatvorte okno a tlačidlo na karte ukazuje Uložené.',
  'help.guide.place-to-collection.result':
    'Miesto je vo vašom zozname aj s obrázkom, poznámkami a adresou, pripravené na ďalšiu cestu.',
  'help.guide.place-to-collection.tip.1':
    'Tlačidlo je k dispozícii, len kým je zapnutý doplnok Zbierky, ktorý administrátor zapína v časti Doplnky.',
  'help.guide.place-to-collection.tip.2':
    'Miesto môže byť naraz vo viacerých zoznamoch, v každom s vlastným stavom: v jednom ako nápad, v inom ako navštívené.',
  'help.guide.place-to-collection.tip.3':
    'Označiť ako navštívené vedľa názvu miesta vo výbere ho v zozname odškrtne; ak je miesto vo viacerých vašich zoznamoch, štítok ukazuje Navštívené všade a označí ich všetky naraz.',
  // place-track
  'help.guide.place-track.title': 'Prečítajte si stopu a dajte jej vlastnú farbu',
  'help.guide.place-track.goal':
    'Zistite, aká dlhá je importovaná prechádzka, a odlíšte jej čiaru od ostatných na mape.',
  'help.guide.place-track.step.1':
    'Riadok stopy v stĺpci miest má krátku čiarku vo farbe, ktorou je jej čiara nakreslená. Kliknite naň.',
  'help.guide.place-track.step.2': 'Dáta trasy uvádzajú dĺžku trasy v jednotkách, ktoré ste nastavili.',
  'help.guide.place-track.step.3':
    'Farba trasy nad nimi ukazuje použitú farbu. Kliknutím na riadok otvoríte vzorkovník.',
  'help.guide.place-track.step.4': 'Vyberte farbu. Čiara na mape aj čiarka v riadku sa zmenia spolu s ňou.',
  'help.guide.place-track.step.5':
    'Prerušované políčko vľavo, Automatická farba, vráti stope zdedenú farbu; pipeta vpravo otvorí systémový výber farieb pre akúkoľvek inú.',
  'help.guide.place-track.result':
    'Stopa je nakreslená vo farbe, ktorú ste vybrali, na karte, v jej riadku v stĺpci miest aj na mape.',
  'help.guide.place-track.tip.1': 'Tieto dva bloky má len miesto s trasou, importované zo súboru GPX, KML alebo KMZ.',
  'help.guide.place-track.tip.2':
    'Stopa zaznamenaná s výškami ukazuje aj najvyšší a najnižší bod, metre stúpania a klesania a výškový profil prechádzky.',
  'help.guide.place-track.tip.3':
    'Import dá každej stope, ktorú prinesie, vlastnú farbu, takže dve prechádzky nikdy neprídu v rovnakej.',

  // ── Screen: trip-day-detail ───────────────────────────────────────────────────────────
  'help.ctx.trip-day-detail.title': 'Podrobnosti dňa',
  'help.ctx.trip-day-detail.summary':
    'Panel, ktorý hlavička dňa otvorí nad mapou: deň ako celok, jeho názov a dátum, počasie tam, kde budete, rezervácie pripadajúce naň a noci rezervované na tento deň.',
  'help.ctx.trip-day-detail.bullet.1':
    'Kliknite na hlavičku dňa v stĺpci dní a panel sa otvorí nad stredom mapy. Tá istá hlavička znova alebo X vpravo ho zatvorí a zruší výber dňa.',
  'help.ctx.trip-day-detail.bullet.2':
    'Hlavička obsahuje názov dňa a jeho dátum. Ceruzka vedľa názvu deň premenuje, dvojitá šípka zbalí panel na úzky pruh, aby bola mapa opäť voľná.',
  'help.ctx.trip-day-detail.bullet.3':
    'Hore je počasie dňa. Predpoveď pre uvádza miesto, pre ktoré platí: prvú zastávku dňa alebo hotel, v ktorom sa zobudíte.',
  'help.ctx.trip-day-detail.bullet.4':
    'Rezervácie uvádzajú rezervácie daného dňa, každú s jej druhom, zastávkou, ku ktorej patrí, a časmi. Zelená znamená potvrdené, jantárová ešte čaká na potvrdenie; je to len prehľad, rezervácie sa menia v časti Rezervácie.',
  'help.ctx.trip-day-detail.bullet.5':
    'Ubytovanie ukazuje každú noc rezervovanú v tento deň, s Check-in a Check-out v dňoch, keď nastanú, s časovým oknom check-inu, časom check-outu a číslom potvrdenia.',
  'help.ctx.trip-day-detail.bullet.6':
    'Pridať ubytovanie rezervuje noc v tento deň: vyberte ubytovacie zariadenie z miest cesty, určte, ktoré dni pokrýva, a doplňte časy a kód.',
  // day-panel
  'help.guide.day-panel.title': 'Otvorte deň a prečítajte si jeho podrobnosti',
  'help.guide.day-panel.goal':
    'Pozrite si jeden deň celý, jeho počasie, rezervácie a miesto, kde spíte, bez opustenia mapy.',
  'help.guide.day-panel.step.1':
    'Kliknite na hlavičku dňa v stĺpci dní. Deň sa vyberie a jeho podrobnosti sa otvoria nad stredom mapy.',
  'help.guide.day-panel.step.2': 'Hlavička uvádza názov dňa, Deň 1, kým mu nedáte názov, a pod ním jeho dátum.',
  'help.guide.day-panel.step.3':
    'Hore je počasie dňa. Predpoveď pre hovorí, pre ktoré miesto platí: prvú zastávku dňa alebo hotel, v ktorom sa zobudíte.',
  'help.guide.day-panel.step.4': 'Rezervácie pod ním uvádzajú rezervácie pripadajúce na tento deň aj s časmi.',
  'help.guide.day-panel.step.5':
    'Ubytovanie ukazuje noci rezervované v tento deň, s Check-in a Check-out v dňoch, keď nastanú.',
  'help.guide.day-panel.step.6':
    'Dvojitá šípka v hlavičke zbalí panel na úzky pruh. X vedľa nej panel zatvorí a zruší výber dňa.',
  'help.guide.day-panel.result':
    'Zbalený do pruhu nechá panel mapu voľnú a deň zostane vybraný; po zatvorení sa výber dňa zruší a plán je taký ako predtým.',
  'help.guide.day-panel.tip.1':
    'Zbaliť ho možno aj kliknutím kamkoľvek na lištu hlavičky panelu. Šípka je len tlačidlo na to.',
  'help.guide.day-panel.tip.2':
    'Otvorením miesta zo stĺpca miest sa namiesto panelu zobrazia podrobnosti miesta. Zatvorte ich a deň sa vráti.',
  // day-weather
  'help.guide.day-weather.title': 'Prečítajte si počasie dňa',
  'help.guide.day-weather.goal': 'Zistite, aký bude deň tam, kde v ten deň naozaj budete.',
  'help.guide.day-weather.step.1':
    'Predpoveď pre uvádza miesto, pre ktoré čísla platia: prvú zastávku dňa, alebo v deň bez zastávky hotel, v ktorom sa zobudíte.',
  'help.guide.day-weather.step.2': 'Veľké číslo je teplota dňa, vedľa neho minimum a maximum a slovný popis počasia.',
  'help.guide.day-weather.step.3':
    'Údaje pod ním: pravdepodobnosť dažďa, jeho množstvo, najsilnejší vietor a východ a západ slnka.',
  'help.guide.day-weather.step.4':
    'Dole je deň po hodinách, každé dve hodiny: čas, ikona, teplota a pravdepodobnosť dažďa. Hodina nad 50 percent je podfarbená modrou.',
  'help.guide.day-weather.result':
    'Karta dňa v stĺpci dní nesie to isté počasie v malom pod svojím číslom, takže celú cestu prečítate na prvý pohľad.',
  'help.guide.day-weather.tip.1':
    'Stupne a vietor sa riadia nastavením Jednotky teploty v časti Všeobecné v Nastaveniach: vyberte °F Fahrenheit a tá istá predpoveď sa zobrazí v °F a mph.',
  'help.guide.day-weather.tip.2':
    'Deň bez zastávky s polohou a bez hotela, v ktorom sa zobudíte, nezobrazuje žiadne počasie: predpoveď je vždy pre miesto, nikdy pre cestu.',
  'help.guide.day-weather.tip.3':
    'Na viac ako 16 dní dopredu predpoveď nie je k dispozícii. Čísla sú potom priemermi z predchádzajúcich rokov pre daný dátum, označené Ø a s poznámkou pod nimi.',
  // rename-day
  'help.guide.rename-day.title': 'Dajte dňu názov',
  'help.guide.rename-day.goal': 'Pomenujte deň podľa toho, čím je, Prílet do Kjóta alebo Deň oddychu, namiesto Deň 5.',
  'help.guide.rename-day.step.1': 'Otvorte deň. Jeho hlavička ukazuje Deň 5 a pod tým dátum.',
  'help.guide.rename-day.step.2': 'Kliknite na ceruzku vedľa názvu.',
  'help.guide.rename-day.step.3': 'Názov sa zmení na pole. Napíšte požadovaný názov.',
  'help.guide.rename-day.step.4':
    'Stlačte Enter alebo jednoducho kliknite inam; Escape zmenu zahodí. Názov nesie aj karta dňa v stĺpci dní.',
  'help.guide.rename-day.result':
    'Názov nahradí Deň 5 v paneli aj na karte dňa v stĺpci dní; dátum zostane tam, kde bol.',
  'help.guide.rename-day.tip.1': 'Vymažte pole a uložte, a deň je znova Deň 5: číslo sa zobrazuje, keď názov chýba.',
  'help.guide.rename-day.tip.2':
    'Názov patrí dňu, nie jeho dátumu. Keď dni preusporiadate, presunie sa spolu so všetkým ostatným v ten deň.',
  // add-accommodation
  'help.guide.add-accommodation.title': 'Rezervujte noc v daný deň',
  'help.guide.add-accommodation.goal':
    'Zadajte hotel do plánu raz, s dňami, ktoré pokrýva, jeho časmi a číslom potvrdenia.',
  'help.guide.add-accommodation.step.1':
    'Ubytovacie zariadenie musí byť najprv miestom cesty. Vytvorte ho v stĺpci miest ako každé iné miesto: výber ponúka len to, čo už existuje.',
  'help.guide.add-accommodation.step.2': 'Otvorte deň príchodu a v časti Ubytovanie kliknite na Pridať ubytovanie.',
  'help.guide.add-accommodation.step.3':
    'Použiť na dni určuje, ktoré noci pobyt pokrýva: deň check-inu vľavo, deň check-outu vpravo. Všetky pokrýva celú cestu.',
  'help.guide.add-accommodation.step.4':
    'Vyplňte Check-in, Do a Check-out a číslo rezervácie zadajte do poľa Potvrdenie. Všetky štyri môžu zostať prázdne.',
  'help.guide.add-accommodation.step.5':
    'Vyberte ubytovacie zariadenie z miest cesty. Štítky nad zoznamom ho zúžia na jednu kategóriu.',
  'help.guide.add-accommodation.step.6': 'Kliknite na Uložiť.',
  'help.guide.add-accommodation.result':
    'Pobyt sa zobrazí v každom dni, ktorý pokrýva, Check-in v prvom a Check-out v poslednom. Ubytovacie zariadenie sa stane zastávkou v deň check-inu, takže mapa nakreslí cestu k nemu, a v časti Rezervácie sa objaví rezervácia typu Hotel.',
  'help.guide.add-accommodation.tip.1':
    'Výber sa otvorí na dni, z ktorého ste prišli, s check-outom v nasledujúci deň; oba sa dajú pred uložením posunúť.',
  'help.guide.add-accommodation.tip.2':
    'Pri vytváraní dajte hotelu kategóriu Hotel a štítky nad zoznamom ho jedným kliknutím zúžia na vaše hotely.',
  'help.guide.add-accommodation.tip.3':
    'Všetky časy sú voliteľné: pobyt bez check-inu a bez kódu stále pokrýva svoje noci a stále kreslí svoju trasu.',
  // edit-accommodation
  'help.guide.edit-accommodation.title': 'Zmeňte alebo zrušte rezervovanú noc',
  'help.guide.edit-accommodation.goal': 'Presuňte pobyt, opravte jeho časy alebo ho znova vyraďte z plánu.',
  'help.guide.edit-accommodation.step.1':
    'V každom dni pobytu karta ukazuje ubytovacie zariadenie, časové okno check-inu, čas check-outu a číslo potvrdenia.',
  'help.guide.edit-accommodation.step.2': 'Ceruzka vpravo pobyt znova otvorí. Okno má teraz názov Upraviť ubytovanie.',
  'help.guide.edit-accommodation.step.3':
    'Opravte rad polí: Check-in, Do, Check-out a Potvrdenie. Dni nad nimi a ubytovacie zariadenie pod nimi sa tu dajú tiež zmeniť.',
  'help.guide.edit-accommodation.step.4': 'Kliknite na Uložiť.',
  'help.guide.edit-accommodation.step.5':
    'X vedľa ceruzky pobyt ukončí. Na nič sa nepýta a rezervácia typu Hotel, ktorá k nemu patrí, zmizne spolu s ním.',
  'help.guide.edit-accommodation.result':
    'Zmena sa naraz prejaví v každom dni, ktorý pobyt pokrýva, a spolu s ňou aj v rezervácii typu Hotel v časti Rezervácie.',
  'help.guide.edit-accommodation.tip.1':
    'Noc uprostred pobytu nemá štítok Check-in ani Check-out: majú ho len prvý a posledný deň rozsahu.',
  'help.guide.edit-accommodation.tip.2':
    'Zrušením pobytu zmizne aj zastávka, ktorú pridal v deň check-inu, a všetky náklady pripojené k jeho rezervácii. Ak išlo o omyl, rezervujte noc znova.',
  // day-bookings
  'help.guide.day-bookings.title': 'Rezervácie dňa na prvý pohľad',
  'help.guide.day-bookings.goal':
    'Pozrite si na jednom mieste, čo je na tento deň už rezervované a či je to potvrdené.',
  'help.guide.day-bookings.step.1':
    'Rezervácie uvádzajú rezervácie dňa: tie, ktoré majú jeho dátum, a tie, ktoré visia na niektorej z jeho zastávok.',
  'help.guide.day-bookings.step.2':
    'Riadok ukazuje druh rezervácie, jej názov a, ak patrí k zastávke, túto zastávku za bodkou. Jej časy sú na pravom konci.',
  'help.guide.day-bookings.step.3':
    'Farba ukazuje stav rezervácie: zelený riadok je potvrdený, jantárový ešte čaká na potvrdenie. Hotely v tomto zozname nie sú, majú vlastný blok nižšie.',
  'help.guide.day-bookings.step.4': 'Zoznam rezervácie len zobrazuje. Rezervácia sa vytvára a mení v časti Rezervácie.',
  'help.guide.day-bookings.result':
    'Všetko s dátumom tohto dňa a všetko, čo visí na niektorej z jeho zastávok, je v tomto jednom zozname.',
  'help.guide.day-bookings.tip.1':
    'Rezervácia sa dostane k dňu podľa vlastného dátumu. Zmeňte dátum v časti Rezervácie a sama sa presunie do iného dňa.',
  'help.guide.day-bookings.tip.2':
    'Ak blok Rezervácie chýba, deň nemá žiadne rezervácie: namiesto prázdneho bloku sa skryje.',

  // ── Screen: trip-map ──────────────────────────────────────────────────────────────────
  'help.ctx.trip-map.title': 'Mapa',
  'help.ctx.trip-map.summary':
    'Stred plánu: každé miesto cesty ako špendlík, trasy, ktoré ich spájajú, a prepínače po okrajoch mapy pre satelit, pre celú cestu naraz a pre miesta v okolí časti mesta, na ktorú sa pozeráte.',
  'help.ctx.trip-map.bullet.1':
    'Špendlík je miesto: jeho vlastná fotka, ak ju má, inak farba kategórie s ikonou kategórie. Podržte naň ukazovateľ a zobrazí sa karta s názvom a adresou, a tam, kde ich miesto má, aj s kategóriou a hodnotením. Presunutím špendlíka na kartu dňa miesto naplánujete na ten deň.',
  'help.ctx.trip-map.bullet.2':
    'Špendlíky príliš blízko seba, aby sa dali rozlíšiť, sa zlúčia do jednej tmavej bubliny s počtom. Kliknite na bublinu a mapa priblíži to, čo je v nej.',
  'help.ctx.trip-map.bullet.3':
    'Kliknutím na špendlík otvoríte miesto pod mapou s hodnotením, súbormi a ďalšími krokmi; kliknutím na prázdnu časť mapy ho opäť zatvoríte.',
  'help.ctx.trip-map.bullet.4':
    'Keď je v stĺpci dní otvorený deň, jeho zastávky majú malú bielu značku so svojím poradím v tom dni a miesto naplánované na dva dni nesie obe čísla spojené znakom ·.',
  'help.ctx.trip-map.bullet.5':
    'Rad ikon hore prehľadáva viditeľnú časť mapy: Reštaurácie, Kaviarne, Bary a nočný život, Ubytovanie, Pamiatky, Múzeá a kultúra, Príroda a parky a Aktivity. Hľadať v tejto oblasti spustí hľadanie znova po posunutí mapy.',
  'help.ctx.trip-map.bullet.6':
    'Kliknutím pravým tlačidlom kdekoľvek na mape otvoríte formulár miesta v tomto bode s už vyhľadanou adresou. Okrúhle tlačidlo vľavo dole prepne kreslenú mapu na letecké snímky.',
  'help.ctx.trip-map.bullet.7':
    'Zobraziť celú cestu vpravo dole nakreslí všetky cestovné dni naraz a uvedie, čo každý pokrýva; ikona trasy v riadku rezervácie nakreslí túto rezerváciu a tá na paneli nástrojov nad dňami nakreslí všetky.',
  'help.ctx.trip-map.bullet.8':
    'So zapnutým doplnkom Dawarich okrúhle tlačidlo Dawarich pod Zobraziť celú cestu nakreslí trasu, ktorú váš telefón naozaj zaznamenal: Zobraziť zaznamenanú trasu ju položí prerušovane pod plánovanú trasu, jednou farbou na deň, a popis tlačidla vysvetlí, prečo čiara chýba, keď žiadna nie je.',
  // map-markers
  'help.guide.map-markers.title': 'Čítajte mapu',
  'help.guide.map-markers.goal': 'Zistite, čo vám hovorí každý špendlík, značka a bublina na mape.',
  'help.guide.map-markers.step.1':
    'Mapa obsahuje všetky miesta cesty. Kde sú špendlíky príliš blízko seba, aby sa dali rozlíšiť, zlúčia sa do jednej tmavej bubliny s počtom; kliknite na bublinu a mapa priblíži to, čo v nej bolo, alebo pri najväčšom priblížení špendlíky rozloží.',
  'help.guide.map-markers.step.2':
    'Špendlík je vlastná fotka miesta, ak ju má, inak farba kategórie s ikonou kategórie. Podržte naň ukazovateľ a karta ukáže názov a adresu, a tam, kde ich miesto má, aj kategóriu a hodnotenie.',
  'help.guide.map-markers.step.3':
    'Kliknite na špendlík a miesto sa otvorí na karte pod mapou: súradnice, hodnotenie, súbory a dole ďalšie kroky, medzi nimi Navigácia, Upraviť a Vymazať, a keď je otvorený deň, aj Pridať k dňu. Kliknutím na prázdnu časť mapy ho opäť zatvoríte.',
  'help.guide.map-markers.step.4':
    'Otvorte deň v stĺpci dní a jeho zastávky dostanú čísla: malá biela značka v rohu špendlíka je poradie zastávky v dni. Miesto naplánované na dva dni nesie obe čísla spojené znakom ·. Bez otvoreného dňa čísla nie sú a v rohu je namiesto nich hodnotenie.',
  'help.guide.map-markers.step.5':
    'Presuňte špendlík z mapy na kartu dňa v stĺpci dní a miesto sa naplánuje na ten deň, presne ako keby ste presunuli jeho riadok zo zoznamu miest.',
  'help.guide.map-markers.result':
    'Na ceste sa nič nezmenilo: mapa je len jej zobrazenie a každý špendlík hovorí, ktoré miesto, ktorý deň a v akom poradí.',
  'help.guide.map-markers.tip.1':
    'Deň zbalený v stĺpci dní vezme svoje zastávky z mapy so sebou; otvorte deň znova a sú späť.',
  'help.guide.map-markers.tip.2':
    'Filter nad zoznamom miest určuje aj to, čo mapa kreslí: vyberte Nezaradené a zostanú na nej len miesta, ktoré ešte nemajú deň.',
  'help.guide.map-markers.tip.3':
    'Táto mapa nemá tlačidlá priblíženia: koliesko približuje, dvojklik priblíži o krok a ťahaním mapy ju posúvate.',
  // map-nearby-places
  'help.guide.map-nearby-places.title': 'Nájdite miesta v okolí na mape',
  'help.guide.map-nearby-places.goal':
    'Nechajte mapu hľadať reštaurácie, pamiatky alebo hotel v časti mesta, na ktorú sa pozeráte, a jedno z nich pridajte do cesty.',
  'help.guide.map-nearby-places.step.1':
    'Rad ikon v hornej časti mapy je hľadanie podľa kategórie: Reštaurácie, Kaviarne, Bary a nočný život, Ubytovanie, Pamiatky, Múzeá a kultúra, Príroda a parky a Aktivity.',
  'help.guide.map-nearby-places.step.2':
    'Kliknite na kategóriu. TREK hľadá tento druh miest vo viditeľnej časti mapy a pre každý výsledok umiestni špendlík vo farbe kategórie. Vždy len jedna kategória: kliknutím na inú ju vymeníte a kliknutím na zapnutú ju vypnete.',
  'help.guide.map-nearby-places.step.3':
    'Posuňte mapu a pod radom sa objaví druhé tlačidlo: Hľadať v tejto oblasti spustí to isté hľadanie pre nový výrez. Samotný posun nikdy nehľadá znova, čo znižuje počet požiadaviek.',
  'help.guide.map-nearby-places.step.4':
    'Špendlíky nesú názov toho, čo sa našlo. Kliknite na jeden a otvorí sa formulár miesta, už vyplnený: Názov, Adresa, Zemepisná šírka a Zemepisná dĺžka a webová stránka a telefónne číslo, ak ich OpenStreetMap má.',
  'help.guide.map-nearby-places.step.5':
    'Skontrolujte, čo sa vyplnilo, a doplňte, čo hľadanie nemohlo vedieť: Popis, Kategóriu, vlastné poznámky.',
  'help.guide.map-nearby-places.step.6':
    'Kliknite na Pridať. Ak už je v ceste miesto s rovnakým názvom, formulár vás upozorní a tlačidlo sa zmení na Aj tak pridať.',
  'help.guide.map-nearby-places.result':
    'Miesto je v zozname miest a na mape ako jeden z vlastných špendlíkov cesty, v časti Nezaradené, kým ho nezaradíte do dňa. Špendlíky z hľadania zostanú, kým kategóriu nevypnete.',
  'help.guide.map-nearby-places.tip.1':
    'Rad zmizne, keď je v Nastaveniach v časti Cestovanie a mapa vypnuté Objavovať miesta na mape.',
  'help.guide.map-nearby-places.tip.2':
    'Výsledky pochádzajú z indexu TREK Places a z OpenStreetMap, takže toto je jedna z mála vecí v pláne, ktorá potrebuje pripojenie.',
  'help.guide.map-nearby-places.tip.3':
    'Hľadanie pokrýva to, čo je na obrazovke, preto si priblížte ulicu, na ktorú sa pýtate: celé mesto odpovie prvými šesťdesiatimi výsledkami bez veľkého poriadku.',
  // map-add-place
  'help.guide.map-add-place.title': 'Vytvorte miesto kliknutím pravým tlačidlom na mapu',
  'help.guide.map-add-place.goal': 'Umiestnite miesto presne tam, kde ho chcete, bez toho, aby ste ho najprv hľadali.',
  'help.guide.map-add-place.step.1':
    'Kliknite pravým tlačidlom na bod na mape, ktorý máte na mysli. Otvorí sa formulár miesta s názvom Pridať miesto/aktivitu.',
  'help.guide.map-add-place.step.2':
    'Zemepisná šírka a Zemepisná dĺžka sú už nastavené na tento bod a TREK súradnice vyhľadá a podľa výsledku vyplní Adresu a tam, kde ho vyhľadávanie poskytne, aj Názov. Nič sa ešte neuložilo, takže prepíšte, čo je nesprávne.',
  'help.guide.map-add-place.step.3':
    'Dajte mu Názov, ktorý spoznáte, a ostatné, čo má plán vedieť: Popis, Poznámky, Kategóriu, Webovú stránku.',
  'help.guide.map-add-place.step.4':
    'Kliknite na Pridať. Miesto sa dostane do zoznamu ako nezaradené, aj keď je otvorený deň: kliknutie pravým tlačidlom na mapu hovorí kde, nie kedy.',
  'help.guide.map-add-place.result': 'Miesto je v zozname aj na mape, v časti Nezaradené, kým ho nezaradíte do dňa.',
  'help.guide.map-add-place.tip.1':
    'Adresa pochádza z vyhľadania súradníc, takže môže znieť ako ulica namiesto názvu a vo voľnej krajine môže prísť prázdna. Obe polia môžete prepísať.',
  'help.guide.map-add-place.tip.2':
    'Na mapách MapLibre GL a Mapbox GL urobí to isté kliknutie stredným tlačidlom a na dotykovej obrazovke dlhé podržanie.',
  // map-satellite
  'help.guide.map-satellite.title': 'Prepnite na satelit',
  'help.guide.map-satellite.goal': 'Vymeňte kreslenú mapu za letecké snímky a späť.',
  'help.guide.map-satellite.step.1':
    'Okrúhle tlačidlo vľavo dole na mape prepína základnú vrstvu. Jeho ikona vždy ukazuje vrstvu, na ktorú by prepol, a pri prejdení myšou napíše ktorú: Prepnúť na satelitné zobrazenie. Kliknite naň.',
  'help.guide.map-satellite.step.2':
    'Mapa je teraz z leteckých snímok, dostatočne podrobných na rozlíšenie jednotlivej budovy a bez vlastného kľúča. Všetko, čo TREK kreslí, zostáva navrchu: špendlíky, trasa dňa, stopy a trasy rezervácií.',
  'help.guide.map-satellite.step.3':
    'Tlačidlo teraz ukazuje Prepnúť na mapové zobrazenie. Kliknutím sa vrátite na kreslenú mapu.',
  'help.guide.map-satellite.result':
    'Mapa je opäť kreslená a vrstva, na ktorej ste ju nechali, sa zapamätá vo vašom účte.',
  'help.guide.map-satellite.tip.1':
    'Voľba sa ukladá vo vašom účte, nie v ceste, takže každá cesta sa otvorí tak, ako ste ju nechali, bez ohľadu na to, aký vykresľovač máp používate.',
  'help.guide.map-satellite.tip.2':
    'Snímky neobsahujú žiadne popisy: názvy ulíc, štvrtí a čísla domov sú na kreslenej mape, preto sa pri hľadaní adresy prepnite späť.',
  // map-whole-trip
  'help.guide.map-whole-trip.title': 'Pozrite si celú cestu a jej vzdialenosti',
  'help.guide.map-whole-trip.goal':
    'Namiesto jedného otvoreného dňa zobrazte všetky cestovné dni a zistite, ako ďaleko každý vedie.',
  'help.guide.map-whole-trip.step.1':
    'Okrúhle tlačidlo Zobraziť celú cestu je vpravo dole na mape. Kliknite naň a všetky cestovné dni cesty sa nakreslia naraz, každý vlastnou farbou s bielym lemom, aby susedné dni zostali oddelené.',
  'help.guide.map-whole-trip.step.2':
    'Karta nad tlačidlom uvádza tieto dni: farebný bod, názov dňa, ikonu pre každý spôsob, ktorým ho cestujete, a vzdialenosť, ktorú pokrýva. Celková vzdialenosť je hore.',
  'help.guide.map-whole-trip.step.3':
    'Kliknutím na deň na karte ho vyberiete, rovnako ako v stĺpci dní: mapa zaberie tento deň a jeho zastávky znova dostanú čísla.',
  'help.guide.map-whole-trip.step.4':
    'Tlačidlo teraz ukazuje Skryť celú cestu. Stlačením sa vrátite k jednému otvorenému dňu.',
  'help.guide.map-whole-trip.result':
    'Každý cestovný deň je nakreslený vlastnou farbou a karta uvádza, čo každý pokrýva a koľko vychádza celá cesta.',
  'help.guide.map-whole-trip.tip.1':
    'Súčet prichádza postupne po niekoľkých úsekoch. Kým za ním nasleduje …, číslo je ešte len čiastkový súčet; ustáli sa, keď odpovie každý úsek.',
  'help.guide.map-whole-trip.tip.2':
    'Úsek, ktorý smerovač odmietne, zostane priamou čiarou a nič sa nezapočíta, a karta to povie namiesto toho, aby potichu ukázala nižšiu hodnotu.',
  'help.guide.map-whole-trip.tip.3':
    'Deň s menej ako dvoma zastávkami s polohou nemá trasu na nakreslenie, preto na karte úplne chýba.',
  // map-booking-routes
  'help.guide.map-booking-routes.title': 'Zobrazte trasu rezervácie na mape',
  'help.guide.map-booking-routes.goal':
    'Nakreslite rezervované lety, vlaky a jazdy na mapu a znova ich z nej odstráňte.',
  'help.guide.map-booking-routes.step.1':
    'Trasy rezervácií sú vypnuté, kým o ne nepožiadate. V riadku rezervácie v stĺpci dní je malá ikona trasy: Zobraziť trasy rezervácií.',
  'help.guide.map-booking-routes.step.2':
    'Kliknite na ňu a rezervácia sa objaví na mape: let ako oblúk hlavnej kružnice, jazda po skutočných cestách, vlak ako reťaz svojich staníc. Potvrdené sa kreslí plnou čiarou, čakajúce prerušovanou a konce trasy sú modré oválne značky s ikonou dopravy.',
  'help.guide.map-booking-routes.step.3':
    'Kliknite na koncovú značku a otvorí sa rezervácia za ňou s časmi, referenciou a miestom začiatku. Uzavrieť ju opäť skryje.',
  'help.guide.map-booking-routes.step.4':
    'Ikona trasy na paneli nástrojov nad dňami spracuje celú cestu naraz: Zobraziť všetky trasy rezervácií nakreslí každú rezerváciu, ktorá trasu má.',
  'help.guide.map-booking-routes.step.5':
    'Začína od nuly, nie ako vrstva navrch, takže všetko, čo ste vybrali rezerváciu po rezervácii, sa zruší. Stlačte ho znova, teraz s popisom Skryť všetky trasy rezervácií, a mapa je čistá.',
  'help.guide.map-booking-routes.result':
    'Rezervácie, o ktoré ste požiadali, sú nakreslené na mape a voľba sa pre túto cestu v tomto prehliadači uchová, kým ju nezmeníte.',
  'help.guide.map-booking-routes.tip.1':
    'Konce nesú kód letiska alebo názov stanice len vtedy, keď je v Nastaveniach v časti Cestovanie a mapa zapnuté Popisky trás rezervácií; inak ukazujú len ikonu.',
  'help.guide.map-booking-routes.tip.2':
    'Vždy zobrazovať trasy rezervácií v tých istých nastaveniach ich nakreslí hneď od začiatku v každej ceste, o ktorej ste ešte nerozhodli.',
  'help.guide.map-booking-routes.tip.3':
    'Rezervácia potrebuje na nakreslenie dva konce so súradnicami, preto hotel ani reštaurácia ikonu trasy nemajú.',

  // map-dawarich-trail
  'help.guide.map-dawarich-trail.title': 'Zobrazte trasu, ktorú ste naozaj prešli',
  'help.guide.map-dawarich-trail.goal':
    'Položte na mapu trasu, ktorú Dawarich zaznamenal vo vašom telefóne, prerušovane vedľa plánovanej, a prečítajte si cestu deň po dni tak, ako naozaj prebehla.',
  'help.guide.map-dawarich-trail.step.1':
    'Okrúhle tlačidlo Dawarich je vpravo dole na mape pod Zobraziť celú cestu; pri prejdení myšou ukáže Zobraziť zaznamenanú trasu. Kliknite naň. TREK požiada váš Dawarich o dátumy cesty a kým odpoveď prichádza, okolo tlačidla sa točí krúžok.',
  'help.guide.map-dawarich-trail.step.2':
    'Zaznamenaná trasa sa zobrazí ako prerušovaná čiara, jednou farbou na deň, nakreslená pod plánovanou trasou, aby plán zostal čitateľný. Tlačidlo teraz ukazuje Skryť zaznamenanú trasu. Dni sa delia o miestnej polnoci a deň zbalený v stĺpci dní vezme svoju prerušovanú čiaru z mapy spolu so zastávkami.',
  'help.guide.map-dawarich-trail.step.3':
    'Kliknite aj na Zobraziť celú cestu a každý plánovaný deň sa nakreslí plnou čiarou vedľa prerušovaného záznamu. Kde obe vedú spolu, deň prebehol podľa plánu; kde sa prerušovaná čiara odkloní, tam nie.',
  'help.guide.map-dawarich-trail.result':
    'To, čo ste naplánovali, aj to, čo ste naozaj urobili, je na mape spolu, prerušovaná čiara proti plnej, a karta nad tlačidlami stále uvádza plánované dni a ich vzdialenosti.',
  'help.guide.map-dawarich-trail.tip.1':
    'Zapnutie alebo vypnutie sa pamätá pre každú cestu počas tejto relácie prehliadača. Kým je trasa zapnutá, TREK sa Dawarichu pýta znova každé dve minúty, takže prebiehajúca cesta sa dobieha bez obnovenia stránky; samotná trasa sa nikdy neukladá, takže nie je v databáze TREK, v zálohách ani offline.',
  'help.guide.map-dawarich-trail.tip.2':
    'Popis tlačidla vysvetlí prázdnu mapu: Načítava sa zaznamenaná trasa…, kým prichádza, V týchto dňoch sa nič nezaznamenalo, Zaznamenanú trasu sa nepodarilo načítať alebo Zaznamenaná trasa vyžaduje pripojenie, keď je TREK offline.',
  // map-compass
  'help.guide.map-compass.title': 'Otočte mapu a znova nájdite sever',
  'help.guide.map-compass.goal': 'Otočte mapu v smere, ktorým idete, a jedným kliknutím ju vráťte na sever.',
  'help.guide.map-compass.step.1':
    'Mapu otočíte ťahaním pravým tlačidlom alebo podržaním Ctrl a ťahaním ľavým tlačidlom; na dotykovej obrazovke otočením dvoma prstami. Okrúhly kompas vedľa radu ikon kategórií v hornej časti mapy sa otáča s ňou: jeho šípka vždy ukazuje na sever, takže sa nakloní presne o toľko, o koľko ste mapu otočili.',
  'help.guide.map-compass.step.2':
    'Kliknite na kompas. Obnoviť sever, ako sa tlačidlo volá, plynulo vráti mapu severom nahor a do plochého pohľadu a šípka sa znova postaví zvislo.',
  'help.guide.map-compass.result':
    'Mapa je opäť severom nahor a vodorovná a na ceste sa nič nezmenilo: kompas hýbe len kamerou.',
  'help.guide.map-compass.tip.1':
    'Kompas existuje len na mapách MapLibre GL a Mapbox GL; mapu Leaflet nemožno otáčať, preto ho nemá. Ktorú používate, určuje Poskytovateľ mapy v Nastaveniach v časti Mapa a Uložiť nastavenia mapy voľbu uloží.',
  'help.guide.map-compass.tip.2':
    'Kliknutie odstráni aj náklon: ťahanie pravým tlačidlom nahor alebo nadol nakláňa pohľad a Obnoviť sever ho vyrovná spolu s otočením. Na Mapbox GL so zapnutým 3D budovy a terén sa tým splošti aj 3D pohľad, kým ho znova nenakloníte.',
  // ── Screen: trip-transports ───────────────────────────────────────────────────────────
  'help.ctx.trip-transports.title': 'Doprava',
  'help.ctx.trip-transports.summary':
    'Všetko, čo vás prepravuje medzi zastávkami: lety, vlaky, autobusy, autá, taxíky, bicykle, plavby, trajekty a spojenia verejnou dopravou, ktoré pre vás TREK vyhľadá. Záložka je ich zoznamom; vytvárajú a čítajú sa aj v pláne a kreslia sa na mapu.',
  'help.ctx.trip-transports.bullet.1':
    'Záložka obsahuje len jazdy. Ubytovanie, reštaurácie, udalosti a vstupenky sú v časti Rezervácie, takže ten istý záznam sa nikdy nezobrazí dvakrát.',
  'help.ctx.trip-transports.bullet.2':
    'Panel nástrojov ich všetky spočíta pod Všetky a každému použitému typu dá vlastný štítok s vlastným počtom, Let, Vlak, Auto, Verejná doprava. Tlačidlo Doprava vpravo pridá dopravu ručne.',
  'help.ctx.trip-transports.bullet.3':
    'Karty sú v troch skupinách, každú možno zbaliť jej nadpisom: Automatické spojenie MHD pre spojenia, ktoré naplánovalo hľadanie, potom Čaká na potvrdenie a potom Potvrdené.',
  'help.ctx.trip-transports.bullet.4':
    'Karta nesie stav, typ, dni, ktoré zaberá, časy, Rezervačný kód, trasu a leteckú spoločnosť a číslo letu alebo číslo vlaku, nástupište a miesto. Ceruzka ju otvorí, kôš ju po otázke vymaže.',
  'help.ctx.trip-transports.bullet.5':
    'Dopravu možno vytvoriť aj v pláne: každá hlavička dňa má plus pre Pridať dopravu a tlačidlo s električkou pre Verejná doprava a spojnica s časom cesty medzi dvoma zastávkami otvorí to isté hľadanie pre tento jeden úsek.',
  'help.ctx.trip-transports.bullet.6':
    'Doprava s nastavenými oboma koncami nakreslí na mape čiaru. Ikona trasy v jej riadku v pláne dňa túto čiaru zapne a Zobraziť všetky trasy rezervácií na paneli nástrojov nad dňami prepne celú cestu.',
  // transports-list
  'help.guide.transports-list.title': 'Čítajte záložku Doprava',
  'help.guide.transports-list.goal': 'Zistite, čo vám zoznam hovorí, skôr než v ňom niečo zmeníte.',
  'help.guide.transports-list.step.1':
    'Doprava je druhá záložka cesty. Obsahuje len jazdy: hotely, reštaurácie, udalosti a vstupenky sú v časti Rezervácie.',
  'help.guide.transports-list.step.2':
    'Panel nástrojov spočíta každú dopravu pod Všetky a každému použitému typu dá vlastný štítok s vlastným počtom. Kliknutím na štítok ponecháte len tento typ, ďalším kliknutím filter zrušíte. Zapnutých môže byť viacero štítkov naraz a Všetky ich vymaže.',
  'help.guide.transports-list.step.3':
    'Automatické spojenie MHD je samostatná skupina so spojeniami, ktoré naplánovalo hľadanie spojení. Čaká na potvrdenie a Potvrdené obsahujú všetko zadané ručne. Šípka vedľa nadpisu skupinu zbalí.',
  'help.guide.transports-list.step.4':
    'Karta povie všetko: stavový bod s Čaká na potvrdenie alebo Potvrdené, typ, dni, ktoré zaberá, s ich dátumami, časy, Rezervačný kód, trasu a leteckú spoločnosť a číslo letu alebo číslo vlaku, nástupište a miesto.',
  'help.guide.transports-list.step.5':
    'Ceruzka otvorí dopravu na úpravu, kôš ju vymaže po otázke, ktorá pomenuje, čo zmizne.',
  'help.guide.transports-list.result':
    'Zoznam je zúžený na to, čo ste hľadali, a každá karta na prvý pohľad ukazuje, či je jazda rezervovaná.',
  'help.guide.transports-list.tip.1':
    'Štítky a zbalené skupiny sa pamätajú pre každú cestu, takže sa záložka znova otvorí tak, ako ste ju nechali.',
  'help.guide.transports-list.tip.2':
    'Importovať zo súboru a AirTrail sa na paneli nástrojov pridajú k tlačidlu Doprava len vtedy, keď server vie čítať potvrdenia rezervácií a keď je pripojená inštancia AirTrail. Bez nich sa zoznam plní ručne a hľadaním spojení.',
  // add-transport
  'help.guide.add-transport.title': 'Pridajte dopravu k dňu',
  'help.guide.add-transport.goal':
    'Zadajte jazdu, ktorá vás dovezie z jednej zastávky na ďalšiu, do dňa, v ktorý sa uskutoční.',
  'help.guide.add-transport.step.1':
    'Každá hlavička dňa má vpravo štyri malé tlačidlá. Kliknite na plus s popisom Pridať dopravu. Formulár sa otvorí s Dátumom už nastaveným na tento deň.',
  'help.guide.add-transport.step.2':
    'Typ rezervácie určuje, čím cestujete: Let, Vlak, Autobus, Auto, Taxi, Bicykel, Plavba, Trajekt alebo Ostatné. Formulár sa prispôsobí. Let dostane letisko pri každom úseku, vlak reťaz staníc, auto označenia Vyzdvihnutie a Vrátenie a Zastávky po ceste.',
  'help.guide.add-transport.step.3':
    'Názov je jediné povinné pole; bez neho zostane Pridať sivé. Napíšte to, čo by ste spoznali na odchodovej tabuli.',
  'help.guide.add-transport.step.4':
    'Od a Do hľadajú stanicu, prístav alebo adresu. Napíšte aspoň tri písmená a vyberte výsledok zo zoznamu. Názov, ktorý bol len napísaný, nemá súradnice, takže na mape nič nenakreslí.',
  'help.guide.add-transport.step.5':
    'Dátum a Čas začiatku určujú, kedy jazda začína, Dátum konca a Čas konca, kedy končí; jazda, ktorá pristane na druhý deň, tam dostane nasledujúci deň. Rezervačný kód, Stav s Čaká na potvrdenie alebo Potvrdené a Poznámky sú voliteľné.',
  'help.guide.add-transport.step.6': 'Kliknite na Pridať.',
  'help.guide.add-transport.result':
    'Doprava je riadok v dni, v jej čase medzi zastávkami, a karta na záložke Doprava v časti Čaká na potvrdenie alebo Potvrdené.',
  'help.guide.add-transport.tip.1':
    'Riadok sa zaradí podľa času začiatku, za poslednú zastávku, ktorá začína skôr. Úchytom ho presuniete kamkoľvek inam v dni alebo do iného dňa.',
  'help.guide.add-transport.tip.2':
    'Priložiť súbor v časti Súbory prijme lístok a Vytvoriť výdavok v časti Náklady uloží rezerváciu a otvorí editor nákladov pre cestovné.',
  'help.guide.add-transport.tip.3':
    'Cestujúci označuje, kto touto jazdou cestuje. Hneď ako má jedna doprava cestujúcich, na paneli nástrojov záložky pribudnú ich avatary a zoznam sa podľa nich dá filtrovať.',
  // import-transport-file
  'help.guide.import-transport-file.title': 'Načítajte let z elektronickej letenky',
  'help.guide.import-transport-file.goal':
    'Nechajte TREK vytiahnuť let, vlak alebo trajekt z lístka, ktorý poslal dopravca, a skontrolujte ho pred uložením.',
  'help.guide.import-transport-file.step.1':
    'Kliknite na Importovať zo súboru na paneli nástrojov záložky Doprava vedľa tlačidla Doprava. Otvorí sa Importovať potvrdenia rezervácií, ten istý dialóg, aký má záložka Rezervácie.',
  'help.guide.import-transport-file.step.2':
    'Pustite lístok do poľa, alebo naň kliknite a vyberte ho: EML, PDF, PKPass, HTML a TXT, najviac päť súborov po 10 MB. Vybrané súbory sú v poli uvedené.',
  'help.guide.import-transport-file.step.3':
    'Kliknite na Importovať. Dialóg sa hneď zatvorí; načítanie prebieha na pozadí.',
  'help.guide.import-transport-file.step.4':
    'Karta vpravo dole hlási priebeh pod názvom súboru. Spracúvajú sa súbory… sa po dokončení načítania zmení na fajku a karta ponúkne Importovať. Kliknite naň.',
  'help.guide.import-transport-file.step.5':
    'Let sa otvorí v Pridať dopravu, už vyplnený: Typ rezervácie na Let, letecká spoločnosť a číslo letu v poli Názov, obe letiská v časti Trasa s Odlet a Prílet, ich časmi a časovými pásmami, Letecká spoločnosť a Číslo letu, Rezervačný kód a lístok v časti Súbory. Skontrolujte ho a kliknite na Pridať.',
  'help.guide.import-transport-file.result':
    'Let je karta v časti Čaká na potvrdenie na záložke Doprava a riadok v deň odletu, s lístkom v časti Súbory, a keďže pozná obe letiská, nakreslí na mape svoj oblúk.',
  'help.guide.import-transport-file.tip.1':
    'Obe záložky zdieľajú jeden import: súbor, ktorý obsahuje let aj hotel, otvorí let v Pridať dopravu a hotel v Nová rezervácia, jedno po druhom, bez ohľadu na to, z ktorej záložky ste začali.',
  'help.guide.import-transport-file.tip.2':
    'Letiská sa umiestňujú podľa kódu. Stanica alebo prístav, ktoré sa pri načítaní nepodarilo nájsť, sú na karte uvedené jantárovou farbou; pred kliknutím na Pridať ich vyberte ručne v časti Trasa, inak doprava na mape nič nenakreslí.',
  // plan-transit
  'help.guide.plan-transit.title': 'Naplánujte spojenie verejnou dopravou',
  'help.guide.plan-transit.goal':
    'Nechajte TREK vyhľadať skutočné vlaky a autobusy medzi dvoma bodmi dňa a vybrané spojenie vložte do plánu.',
  'help.guide.plan-transit.step.1':
    'V hlavičke dňa kliknite na tlačidlo s električkou, Verejná doprava. Hľadanie sa otvorí pre tento deň.',
  'help.guide.plan-transit.step.2':
    'Od a Do prijmú zastávku alebo stanicu. Kým je pole prázdne, ponúkajú sa vlastné zastávky dňa a ubytovania cesty; po napísaní dvoch písmen sa namiesto toho hľadajú stanice v cestovnom poriadku. Prehodiť medzi oboma poľami otočí smer spojenia.',
  'help.guide.plan-transit.step.3':
    'Odchod alebo Príchod s časom určuje, kedy chcete cestovať, a Najlepšie spojenie, Menej prestupov alebo Menej chôdze určuje, ako sa majú výsledky zoradiť.',
  'help.guide.plan-transit.step.4':
    'Štítky nižšie určujú, ktoré druhy dopravy sa môžu použiť: Vlak, Metro, Električka, Autobus, Trajekt a Lanovka. Vypnutím jedného ho vynecháte, aspoň jeden zostane zapnutý. Potom kliknite na Hľadať.',
  'help.guide.plan-transit.step.5':
    'Každý výsledok uvádza odchod a príchod, trvanie, počet prestupov a množstvo chôdze a linky v ich vlastných farbách. Kliknutím ho rozbalíte zastávku po zastávke, s nástupišťami a presunmi pešo medzi linkami.',
  'help.guide.plan-transit.step.6': 'Kliknite na Pridať k dňu.',
  'help.guide.plan-transit.result':
    'Spojenie je riadok v dni s linkami, prestupmi a časom chôdze a karta na záložke Doprava v časti Automatické spojenie MHD.',
  'help.guide.plan-transit.tip.1':
    'Spojenia pochádzajú z Transitous, bezplatnej komunitnej služby nad verejnými údajmi cestovných poriadkov: bez kľúča, bez účtu. Administrátor môže hľadanie presmerovať na Google.',
  'help.guide.plan-transit.tip.2':
    'Nič sa nenašlo? Údaje pokrývajú určitý región a obdobie. Skúste iný čas, zapnite viac druhov dopravy alebo vyberte stanicu namiesto samotného miesta. Správa uvádza službu, ktorá odpovedala.',
  'help.guide.plan-transit.tip.3':
    'To isté hľadanie sa otvorí aj pre jeden úsek: kliknite na spojnicu s časom cesty medzi dvoma zastávkami a zvoľte Verejná doprava. Od, Do a čas odchodu sa vyplnia za vás.',
  // change-transit-route
  'help.guide.change-transit-route.title': 'Otvorte a zmeňte naplánované spojenie',
  'help.guide.change-transit-route.goal':
    'Prečítajte si spojenie zastávku po zastávke, premenujte ho alebo trasu vyhľadajte znova.',
  'help.guide.change-transit-route.step.1':
    'Na záložke Doprava sú naplánované spojenia v časti Automatické spojenie MHD. Kliknite na kartu.',
  'help.guide.change-transit-route.step.2':
    'Trvanie, Prestupy a Pešo sú hore. Itinerár pod nimi prechádza spojením zastávku po zastávke, s nástupišťami a presunmi pešo medzi linkami.',
  'help.guide.change-transit-route.step.3':
    'Zmeniť trasu spustí hľadanie znova, už vyplnené oboma koncami tohto spojenia a jeho dňom.',
  'help.guide.change-transit-route.step.4':
    'Vyberte iné spojenie a kliknite na Pridať k dňu; nahradí to staré. Upraviť podrobnosti vedľa Zmeniť trasu namiesto toho otvorí bežný formulár dopravy, kde sú Rezervačný kód, Stav, cestujúci a súbory.',
  'help.guide.change-transit-route.result':
    'Spojenie má nový itinerár a jeho karta na záložke Doprava ukazuje nové linky a časy.',
  'help.guide.change-transit-route.tip.1':
    'Názov spojenia je len text: ceruzka vedľa neho ho premenuje bez zmeny trasy. Poznámky pod ním podporujú markdown a majú záložky Upraviť a Náhľad.',
  'help.guide.change-transit-route.tip.2':
    'Vymazať v spodnej časti spojenia odstráni spojenie z cesty; deň si zastávky ponechá.',
  // leg-travel-mode
  'help.guide.leg-travel-mode.title': 'Zmeňte spôsob cestovania jedného úseku',
  'help.guide.leg-travel-mode.goal':
    'Prejdite pešo jeden úsek dňa, ktorý inak jazdíte autom, alebo tento úsek zverte hľadaniu spojení.',
  'help.guide.leg-travel-mode.step.1':
    'Spojnice medzi zastávkami sa objavia až po zapnutí trasy dňa. Kliknutím na deň ho otvorte a potom kliknite na Trasa pod jeho zastávkami.',
  'help.guide.leg-travel-mode.step.2':
    'Každá spojnica uvádza čas cesty a vzdialenosť daného úseku s ikonou spôsobu, akým bol vypočítaný: auto pre jazdu autom, chodidlo pre chôdzu.',
  'help.guide.leg-travel-mode.step.3':
    'Kliknite na spojnicu. Ponuka obsahuje Autom a Pešo, Verejná doprava a Použiť predvolené pre deň.',
  'help.guide.leg-travel-mode.step.4': 'Zvoľte Pešo. Zmení sa len tento úsek; zvyšok dňa si ponechá vlastný spôsob.',
  'help.guide.leg-travel-mode.result':
    'Úsek ukazuje ikonu chodidla a svoj čas chôdze a ostatné úseky dňa si ponechajú spôsob dňa.',
  'help.guide.leg-travel-mode.tip.1':
    'Spôsob patrí úseku, nie dňu: tlačidlá Autom a Pešo pre celý deň nikdy neprepíšu úsek, ktorý ste nastavili ručne. Použiť predvolené pre deň vráti úsek pod ich správu.',
  'help.guide.leg-travel-mode.tip.2':
    'Verejná doprava v tej istej ponuke otvorí hľadanie spojenia presne pre tento úsek, s oboma koncami a časom odchodu už vyplnenými.',
  'help.guide.leg-travel-mode.tip.3':
    'Časy pochádzajú z verejného smerovača po skutočných cestách a chodníkoch. Úsek, na ktorý nevie odpovedať, si ponechá priamu čiaru a čas neukazuje.',
  // edit-transport
  'help.guide.edit-transport.title': 'Zmeňte alebo vymažte dopravu',
  'help.guide.edit-transport.goal': 'Opravte čas, nástupište alebo rezervačný kód, alebo jazdu odstráňte z cesty.',
  'help.guide.edit-transport.step.1': 'V pláne dňa je doprava farebný riadok medzi zastávkami. Kliknite naň.',
  'help.guide.edit-transport.step.2':
    'Formulár je ten istý, ktorým vznikla, s Upraviť dopravu v záhlaví. Zmeniť sa dá všetko: typ, trasa, dni a časy, Rezervačný kód, Stav.',
  'help.guide.edit-transport.step.3':
    'Trasa letu je reťaz letísk, trasa vlaku reťaz staníc. Pridať zastávku vloží medzi ne ďalšiu a každý úsek si ponechá vlastné časy a vlastné číslo letu alebo vlaku.',
  'help.guide.edit-transport.step.4':
    'Kliknite na Aktualizovať. Ak chcete dopravu úplne odstrániť, použite kôš na jej karte na záložke Doprava a potvrďte.',
  'help.guide.edit-transport.result':
    'Zmena sa prejaví všade, kde sa doprava zobrazuje: na záložke Doprava, v dni, v ktorý jazda prebieha, a v jej čiare na mape.',
  'help.guide.edit-transport.tip.1':
    'Ten istý formulár sa otvára z oboch strán, ceruzkou na karte na záložke Doprava aj vlastným riadkom dopravy v pláne dňa. Výnimkou je naplánované spojenie verejnou dopravou: jeho riadok otvorí zobrazenie spojenia a Upraviť podrobnosti tam vedie k tomuto formuláru.',
  'help.guide.edit-transport.tip.2':
    'Na presun dopravy do iného dňa formulár vôbec nepotrebujete: presuňte jej riadok z jednej karty dňa na ďalšiu.',
  // transport-on-map
  'help.guide.transport-on-map.title': 'Nakreslite dopravu na mapu',
  'help.guide.transport-on-map.goal': 'Pozrite sa, kam let, jazda alebo spojenie naozaj vedie.',
  'help.guide.transport-on-map.step.1':
    'Doprava s nastavenými oboma koncami má v riadku v pláne dňa malú ikonu trasy. Kliknite na ňu; jej popis sa zmení na Skryť trasy rezervácií.',
  'help.guide.transport-on-map.step.2':
    'Trasa sa nakreslí na mapu s oválnou značkou na každom konci, ktorá nesie ikonu dopravy.',
  'help.guide.transport-on-map.step.3':
    'Kliknutím na koncovú značku si prečítate rezerváciu bez opustenia mapy: časy, leteckú spoločnosť a číslo letu, Rezervačný kód a adresu. Uzavrieť okno opäť skryje.',
  'help.guide.transport-on-map.step.4':
    'Ikona trasy na paneli nástrojov nad dňami spracuje celú cestu naraz: Zobraziť všetky trasy rezervácií, a Skryť všetky trasy rezervácií ich zase odstráni.',
  'help.guide.transport-on-map.step.5':
    'Naplánované spojenie verejnou dopravou nemá vlastnú ikonu. Kreslí sa prepínačom Trasa dňa, a preto ho Skryť všetky trasy rezervácií neodstráni, kým je trasa toho dňa zapnutá.',
  'help.guide.transport-on-map.result':
    'Trasy sú na mape so značkou na každom konci a zostanú tam, kým ich znova nevypnete.',
  'help.guide.transport-on-map.tip.1':
    'Let, plavba a trajekt sa kreslia ako oblúk, auto, autobus, taxi a bicykel sledujú skutočné cesty a vlak alebo naplánované spojenie vedie cez stanice, na ktorých zastavuje.',
  'help.guide.transport-on-map.tip.2':
    'Potvrdená rezervácia je plná čiara, čakajúca prerušovaná. Nastavenie Popisky trás rezervácií vpíše do koncových značiek kód letiska alebo názov stanice.',
  'help.guide.transport-on-map.tip.3':
    'Zobraziť všetky trasy rezervácií začína od nuly, nie je to vrstva: zahodí to, čo nastavili jednotlivé ikony, takže po dvojnásobnom stlačení je všetko zapnuté alebo všetko vypnuté.',

  // airtrail-import
  'help.guide.airtrail-import.title': 'Importujte lety z AirTrail',
  'help.guide.airtrail-import.goal':
    'Preneste lety, ktoré už vediete v AirTrail, do cesty naraz a nechajte ich odvtedy sledovať AirTrail.',
  'help.guide.airtrail-import.step.1':
    'So zapnutým doplnkom AirTrail a vašou inštanciou pripojenou v časti Integrácie v Nastaveniach má panel nástrojov záložky Doprava vedľa tlačidla Doprava tlačidlo AirTrail. Kliknite naň.',
  'help.guide.airtrail-import.step.2':
    'Import z AirTrail zobrazí lety vášho účtu v dvoch skupinách. Počas tejto cesty obsahuje lety s dátumom v rámci cesty, už zaškrtnuté; Ostatné lety obsahujú zvyšok, nezaškrtnutý. Let, ktorý už v ceste je, je sivý a označený Importované.',
  'help.guide.airtrail-import.step.3':
    'Každý riadok je zaškrtávacie políčko s leteckou spoločnosťou a číslom letu, oboma letiskami a dátumom. Kliknutím na riadok let pridáte alebo vynecháte; lety v časti Ostatné lety sa pridajú, len keď ich zaškrtnete.',
  'help.guide.airtrail-import.step.4':
    'Nadväzujúce lety, keď každý odlieta z letiska, kde predchádzajúci do jedného dňa pristál, sú orámované spolu. Zaškrtávacie políčko pod nimi, Importovať ako jeden let s prestupom na tomto letisku, je už zapnuté: nechajte ho zapnuté pre jednu rezerváciu so zastávkou alebo ho vypnite, ak chcete importovať úseky ako samostatné lety.',
  'help.guide.airtrail-import.step.5':
    'Kliknite na Importovať. Tlačidlo ukazuje počet zaškrtnutých letov a správa potom uvedie, koľko ich pribudlo.',
  'help.guide.airtrail-import.step.6':
    'Lety sú karty v časti Potvrdené, každá s modrým odznakom AirTrail vedľa stavu, a riadky v dňoch, keď lietajú. Spojený let s prestupom je jedna karta s trasou vedúcou cez miesto prestupu.',
  'help.guide.airtrail-import.result':
    'Lety z AirTrail sú karty na záložke Doprava a riadky v ich dňoch, každý s odznakom AirTrail, ktorý hovorí, odkiaľ pochádza.',
  'help.guide.airtrail-import.tip.1':
    'Let, ktorý už v ceste je s rovnakým číslom a dátumom, sa preskočí a správa uvedie, koľko ich bolo. Vrátiť späť na paneli nástrojov nad dňami vráti celý import.',
  'help.guide.airtrail-import.tip.2':
    'Zdrojom pravdy zostáva AirTrail. TREK načíta jeho zmeny, keď otvoríte cestu, a každých pár minút na pozadí; let, ktorý tam vymažete, si ponechá kartu s odznakom zmeneným na Nesynchronizované. Úpravy urobené v TREK sa prenesú späť len so zapnutým Zapisovať zmeny späť do AirTrail v časti Integrácie.',
  'help.guide.airtrail-import.tip.3':
    'Spojený let s prestupom nemá jeden let v AirTrail, ktorý by mohol sledovať, preto ide o jednorazový import: ponechá si modrý odznak a pri prejdení myšou to odznak povie. To isté sa stane synchronizovanému letu, ktorému ručne pridáte zastávku.',
  // ── Screen: trip-bookings ─────────────────────────────────────────────────────────────
  'help.ctx.trip-bookings.title': 'Rezervácie',
  'help.ctx.trip-bookings.summary':
    'Záložka, ktorá obsahuje všetko rezervované pre cestu, čo nie je spôsob prepravy: ubytovanie, stoly, vstupenky, prehliadky, parkovanie. Každá rezervácia je karta v časti Čaká na potvrdenie alebo Potvrdené a nesie svoj kód, dokument, cestujúcich a náklady.',
  'help.ctx.trip-bookings.bullet.1':
    'Ručná rezervácia vpravo hore otvorí formulár. Šesť druhov, ktoré vytvára, sú Ubytovanie, Reštaurácia, Udalosť, Prehliadka, Parkovanie a Ostatné; lety, vlaky a ostatné sú na záložke Doprava a tu sa nikdy nezobrazia.',
  'help.ctx.trip-bookings.bullet.2':
    'Importovať zo súboru odovzdá potvrdenie analyzátoru: EML, PDF, PKPass, HTML alebo TXT, najviac päť súborov po 10 MB. Tlačidlo je k dispozícii, len keď ich server vie čítať.',
  'help.ctx.trip-bookings.bullet.3':
    'Štítky vedľa nadpisu filtrujú podľa typu, každý s vlastným počtom, a Všetky vráti všetko späť. Keď rezervácia uvádza ľudí, rad avatarov vedľa štítkov zúži záložku na jedného z nich.',
  'help.ctx.trip-bookings.bullet.4':
    'Karty sú v dvoch sekciách, Čaká na potvrdenie a Potvrdené, každá so svojím počtom. Kliknutím na nadpis sekcie ju zbalíte a to, či je otvorená, sa pre túto cestu zapamätá.',
  'help.ctx.trip-bookings.bullet.5':
    'Karta nesie stavový bod, typ, názov, dátumy a časy, Rezervačný kód, Miesto / Adresa, s čím je rezervácia prepojená, jej Odkaz, Poznámky, Súbory a Cestujúci.',
  'help.ctx.trip-bookings.bullet.6':
    'Ceruzka na karte znova otvorí ten istý formulár; kôš sa raz opýta a potom je rezervácia preč. Pri ubytovaní zmiznú spolu s ňou aj jeho noci v pláne dňa a prepojený výdavok.',
  // create-booking
  'help.guide.create-booking.title': 'Vytvorte rezerváciu',
  'help.guide.create-booking.goal':
    'Zadajte do cesty ručne reštauráciu, udalosť, prehliadku, parkovacie miesto alebo čokoľvek iné.',
  'help.guide.create-booking.step.1': 'Kliknite na Ručná rezervácia vpravo hore na záložke. Otvorí sa Nová rezervácia.',
  'help.guide.create-booking.step.2':
    'Vyberte Typ rezervácie zo zoznamu v hornej časti formulára, vedľa poľa Cestujúci. Ubytovanie, Reštaurácia, Udalosť, Prehliadka, Parkovanie a Ostatné je šesť typov, ktoré táto záložka vytvára, a formulár sa mení podľa voľby: len Ubytovanie vymení dátumy za rozsah dní.',
  'help.guide.create-booking.step.3':
    'Zadajte Názov. Je to jediné pole, na ktorom formulár trvá, a Pridať zostane neaktívne, kým v ňom niečo nie je.',
  'help.guide.create-booking.step.4':
    'Nastavte Dátum a Čas začiatku a Dátum konca a Čas konca, ak má rezervácia koniec. Kalendáre ponúkajú len dni v rámci cesty a koniec, ktorý nie je po začiatku, sa ohlási červenou a zablokuje Pridať.',
  'help.guide.create-booking.step.5':
    'Zadajte Rezervačný kód z potvrdenia a nastavte Stav. Čaká na potvrdenie alebo Potvrdené rozhoduje, do ktorej z dvoch sekcií karta patrí.',
  'help.guide.create-booking.step.6': 'Kliknite na Pridať.',
  'help.guide.create-booking.result':
    'Rezervácia je karta vo svojej sekcii so štítkom typu, dátumami a kódom a všetci ostatní v ceste ju uvidia pribudnúť.',
  'help.guide.create-booking.tip.1':
    'Miesto / Adresa počas písania ponúka skutočné adresy; výber jednej nahradí to, čo ste napísali, a adresa, ktorú ste napísali sami, zostane tak, ako je.',
  'help.guide.create-booking.tip.2':
    'Do poľa Odkaz patrí vlastná stránka rezervácie u poskytovateľa. Karta z neho urobí odkaz, ktorý sa otvorí na novej karte prehliadača.',
  'help.guide.create-booking.tip.3':
    'Poznámky sú v Markdowne, takže zoznam alebo tučný riadok sa na karte zobrazí ako taký.',
  // booking-hotel
  'help.guide.booking-hotel.title': 'Rezervujte ubytovanie',
  'help.guide.booking-hotel.goal':
    'Zadajte ubytovanie tak, aby sa naraz počítalo ako rezervácia aj ako noci v pláne dňa.',
  'help.guide.booking-hotel.step.1':
    'Kliknite na Ručná rezervácia a zvoľte Ubytovanie. Polia s dátumom zmiznú a nahradí ich blok polí pre hotel.',
  'help.guide.booking-hotel.step.2':
    'Vyberte hotel v časti Ubytovanie. Zoznam obsahuje vlastné miesta cesty a výber jedného zapíše jeho názov do poľa Názov a jeho adresu do poľa Miesto / Adresa.',
  'help.guide.booking-hotel.step.3':
    'Nastavte Od a Do: prvú noc a ráno, keď odchádzate. Obe ponúkajú dni cesty s ich dátumami a navzájom si udržiavajú poradie.',
  'help.guide.booking-hotel.step.4': 'Vyplňte Check-in, Check-in do a Check-out a Rezervačný kód z potvrdenia.',
  'help.guide.booking-hotel.step.5': 'Kliknite na Pridať.',
  'help.guide.booking-hotel.result':
    'Karta nesie namiesto dátumu rozsah dní s časmi check-inu a check-outu a adresou a ten istý pobyt je teraz v týchto dňoch plánu.',
  'help.guide.booking-hotel.tip.1':
    'Ubytovanie je jediný typ bez Dátumu a Času začiatku. Jeho dátumy sú Od a Do a sú to dni cesty, nie kalendár.',
  'help.guide.booking-hotel.tip.2':
    'Nechajte Ubytovanie prázdne a namiesto toho napíšte adresu: miesto sa za vás vyhľadá, vytvorí a pripne na mapu.',
  'help.guide.booking-hotel.tip.3': 'Vymazaním rezervácie zmiznú z plánu dňa aj noci.',
  // link-booking
  'help.guide.link-booking.title': 'Prepojte rezerváciu s plánom',
  'help.guide.link-booking.goal':
    'Zaveste rezerváciu na zastávku a miesto, ku ktorým patrí, aby sa objavila tam, kde ju budete chcieť.',
  'help.guide.link-booking.step.1':
    'Kliknite na ceruzku na karte, ktorú chcete prepojiť. Otvorí sa Upraviť rezerváciu.',
  'help.guide.link-booking.step.2':
    'Otvorte Prepojiť s priradením dňa. Zoznam je váš plán: nadpis pre každý deň a pod ním zastávky toho dňa, očíslované a s časmi. Vyberte tú, ku ktorej rezervácia patrí.',
  'help.guide.link-booking.step.3':
    'Miesto / Aktivita prepojí samotné miesto. Vyberte ho tam a Názov aj Miesto / Adresa sa vyplnia všade, kde ste ich nechali prázdne.',
  'help.guide.link-booking.step.4': 'Kliknite na Aktualizovať.',
  'help.guide.link-booking.result':
    'Karta uvádza deň a zastávku pod Prepojiť s priradením dňa a rezervácia sa v pláne dňa presúva spolu s touto zastávkou.',
  'help.guide.link-booking.tip.1':
    'Bez prepojenia (samostatné) na začiatku zoznamu prepojenie opäť zruší. Ubytovanie výber zastávky vôbec nemá: prepája sa cez svoje noci.',
  'help.guide.link-booking.tip.2':
    'Výber zastávky v dni s dátumom za vás vyplní prázdny Dátum. Dátum, ktorý ste už nastavili, zostane nezmenený.',
  // booking-travelers
  'help.guide.booking-travelers.title': 'Určte, pre koho je rezervácia',
  'help.guide.booking-travelers.goal':
    'Označte cestujúcich, na ktorých sa rezervácia vzťahuje, a potom zobrazte len ich rezervácie.',
  'help.guide.booking-travelers.step.1':
    'Otvorte rezerváciu ceruzkou. Pole Cestujúci je v hornej časti formulára, vedľa poľa Typ rezervácie, a kým na rezervácii nikto nie je, ukazuje Priradiť cestujúcich.',
  'help.guide.booking-travelers.step.2':
    'Kliknite naň a vyberte ľudí, pre ktorých je rezervácia; pomenovaní hostia sú v zozname tiež. Vybraný dostane fajku a svoj avatar v poli. Ďalším kliknutím na meno ho odstránite.',
  'help.guide.booking-travelers.step.3': 'Kliknite na Aktualizovať.',
  'help.guide.booking-travelers.step.4':
    'Hore na paneli nástrojov vedľa štítkov typov kliknite na avatar cestujúceho, aby ste videli len jeho rezervácie.',
  'help.guide.booking-travelers.result':
    'Karta uvádza ľudí, pre ktorých je, a rad avatarov zúži záložku na jedného z nich.',
  'help.guide.booking-travelers.tip.1':
    'Na karte sa cestujúci len zobrazujú, nikdy nemenia. Nastavujú sa tu, vo formulári.',
  'help.guide.booking-travelers.tip.2':
    'Rad avatarov sa objaví, keď má cesta viac ako jedného člena a aspoň jedna rezervácia niekoho uvádza. Váš výber platí počas tejto relácie prehliadača.',
  // booking-files
  'help.guide.booking-files.title': 'Majte poukaz pri rezervácii',
  'help.guide.booking-files.goal': 'Priložte potvrdenie, lístok alebo preukaz k rezervácii, ku ktorej patrí.',
  'help.guide.booking-files.step.1':
    'Otvorte rezerváciu ceruzkou, prejdite nadol na Súbory a kliknite na Priložiť súbor. Pri už existujúcej rezervácii sa dokument hneď nahrá a TREK ohlási Súbor bol nahraný.',
  'help.guide.booking-files.step.2': 'Dokument je uvedený podľa názvu, s tlačidlom na otvorenie a X vedľa neho.',
  'help.guide.booking-files.step.3':
    'Prepojiť existujúci súbor ponúka dokumenty cesty, ktoré ešte nie sú pri tejto rezervácii. Vyberte jeden a priloží sa bez opätovného nahrávania.',
  'help.guide.booking-files.step.4': 'Kliknite na Aktualizovať.',
  'help.guide.booking-files.result':
    'Karta uvádza dokumenty v časti Súbory a kliknutím na niektorý z nich ho otvoríte.',
  'help.guide.booking-files.tip.1':
    'Pri rezervácii, ktorú ešte vytvárate, dokument počká a nahrá sa vo chvíli, keď kliknete na Pridať.',
  'help.guide.booking-files.tip.2':
    'X vedľa dokumentu odstráni prepojenie, nie dokument. Ten zostane na záložke Súbory cesty.',
  'help.guide.booking-files.tip.3':
    'Ktoré druhy súborov možno priložiť, určuje zoznam administrátora; dokumenty, text a obrázky sú povolené od začiatku.',
  // booking-cost
  'help.guide.booking-cost.title': 'Premeňte cenu rezervácie na náklad',
  'help.guide.booking-cost.goal': 'Dostaňte cenu rezervácie do Nákladov, rozdelenú medzi ľudí, ktorí za ňu platia.',
  'help.guide.booking-cost.step.1':
    'Otvorte rezerváciu a prejdite do spodnej časti formulára. V časti Náklady sú Vytvoriť výdavok a Prepojiť existujúci výdavok s poznámkou Uloží rezerváciu a potom otvorí editor nákladov.',
  'help.guide.booking-cost.step.2':
    'Kliknite na Vytvoriť výdavok. Rezervácia sa uloží, jej formulár sa zatvorí a otvorí sa editor nákladov.',
  'help.guide.booking-cost.step.3':
    'Za čo to bolo? už obsahuje názov rezervácie. Zadajte Celkovú sumu a skontrolujte Menu a Deň.',
  'help.guide.booking-cost.step.4':
    'Kategória je tá, ktorú naznačuje typ rezervácie. Nastavte Kto zaplatil? a spôsob rozdelenia sumy.',
  'help.guide.booking-cost.step.5': 'Kliknite na Pridať výdavok.',
  'help.guide.booking-cost.result':
    'Formulár rezervácie teraz uvádza výdavok v časti Prepojené výdavky s jeho sumou a ten istý výdavok je na záložke Náklady, prepojený s touto rezerváciou.',
  'help.guide.booking-cost.tip.1':
    'Kategória sa riadi typom: z Reštaurácie je Jedlo a pitie, z Ubytovania Ubytovanie, z Parkovania Parkovanie a Udalosť aj Prehliadka skončia v Ostatné.',
  'help.guide.booking-cost.tip.2':
    'Rezervácia môže niesť viac výdavkov. Prepojiť existujúci výdavok ponúka tie z Nákladov, ktoré zatiaľ nikam nepatria. Pri prepojenom ho Odpojiť, výdavok ponechať uvoľní a nechá v Nákladoch, kým kôš ho odstráni.',
  'help.guide.booking-cost.tip.3':
    'Náklady sú vo formulári len vtedy, keď je zapnutý doplnok Náklady, ktorý administrátor zapína v časti Doplnky.',
  // filter-bookings
  'help.guide.filter-bookings.title': 'Nájdite rezerváciu',
  'help.guide.filter-bookings.goal': 'Zúžte dlhú záložku na typ, osobu alebo stav, ktorý hľadáte.',
  'help.guide.filter-bookings.step.1':
    'Štítky vedľa nadpisu sú typy, ktoré táto cesta skutočne používa, každý s počtom, ktorý obsahuje. Všetky je celá záložka.',
  'help.guide.filter-bookings.step.2':
    'Kliknutím na štítok ponecháte len tento typ. Kliknite na druhý a ponechajú sa oba.',
  'help.guide.filter-bookings.step.3': 'Všetky vráti všetko späť.',
  'help.guide.filter-bookings.step.4':
    'Avatary vedľa štítkov filtrujú podľa cestujúceho, jednej osoby alebo viacerých naraz.',
  'help.guide.filter-bookings.step.5':
    'Čaká na potvrdenie a Potvrdené sú dve sekcie, každá so svojím počtom. Kliknutím na nadpis jednu zbalíte; keď sa vrátite, bude stále zbalená.',
  'help.guide.filter-bookings.result':
    'Záložka ukazuje len to, čo ste vybrali, a výber platí, aj keď sa k nej v tejto relácii prehliadača vrátite.',
  'help.guide.filter-bookings.tip.1':
    'Štítky ponúkajú len typy, ktoré cesta má, takže cesta bez jedinej prehliadky nemá štítok Prehliadka.',
  'help.guide.filter-bookings.tip.2':
    'Filter, ktorému nič nezodpovedá, nechá záložku prázdnu s textom Žiadne miesta sa nenašli. Znenie pochádza zo zoznamu miest; význam je rovnaký.',
  // import-booking-file
  'help.guide.import-booking-file.title': 'Načítajte rezerváciu z potvrdenia',
  'help.guide.import-booking-file.goal':
    'Nechajte TREK vytiahnuť rezerváciu z e-mailu alebo PDF, ktoré poslal poskytovateľ, namiesto toho, aby ste ju znova prepisovali.',
  'help.guide.import-booking-file.step.1':
    'Kliknite na Importovať zo súboru na paneli nástrojov. Otvorí sa Importovať potvrdenia rezervácií.',
  'help.guide.import-booking-file.step.2':
    'Pustite potvrdenia do poľa, alebo naň kliknite a vyberte ich: EML, PDF, PKPass, HTML a TXT, najviac päť súborov po 10 MB. Vybrané súbory sú v poli uvedené.',
  'help.guide.import-booking-file.step.3':
    'Kliknite na Importovať. Dialóg sa hneď zatvorí, pretože načítanie prebieha na pozadí.',
  'help.guide.import-booking-file.step.4':
    'Karta vpravo dole hlási priebeh pod názvom súboru a sprevádza vás aplikáciou aj po obnovení stránky. Spracúvajú sa súbory… sa po dokončení načítania zmení na fajku a karta ponúkne Importovať. Kliknite naň.',
  'help.guide.import-booking-file.step.5':
    'Každá nájdená rezervácia sa otvorí v Nová rezervácia, jedna po druhej, už vyplnená. Pri hoteli je to názov v poli Názov a, ak cesta miesto má, v časti Ubytovanie, jeho Miesto / Adresa, Od a Do na jeho noci, Check-in a Check-out, Rezervačný kód, potvrdenie v časti Súbory a so zapnutými Nákladmi cena ako Prepojený výdavok. Skontrolujte ju a kliknite na Pridať.',
  'help.guide.import-booking-file.result':
    'Rezervácia je karta v časti Čaká na potvrdenie s nocami, kódom a potvrdením v časti Súbory, pobyt je v týchto dňoch plánu a so zapnutými Nákladmi je cena výdavkom prepojeným s ňou.',
  'help.guide.import-booking-file.tip.1':
    'Importovať zo súboru je k dispozícii, len keď server vie čítať potvrdenia, na čo je potrebný buď extraktor, alebo doplnok Analýza pomocou AI. Ten zapína administrátor v časti Doplnky.',
  'help.guide.import-booking-file.tip.2':
    'Ak sa nič nepodarilo načítať, karta to oznámi a ponúkne Skúsiť spracovanie pomocou AI, ktoré pošle tie isté súbory priamo modelu. Dokončené spracovanie sa uchová desať minút; kontrolu začnite v tomto čase.',
  'help.guide.import-booking-file.tip.3':
    'Potvrdenie sa priloží, len ak je jeho typ v zozname Povolené typy súborov v nastaveniach administrátora. PDF tam je od začiatku; e-mail, EML, treba najprv pridať, inak sa rezervácia uloží bez neho.',
  // edit-booking
  'help.guide.edit-booking.title': 'Zmeňte rezerváciu',
  'help.guide.edit-booking.goal':
    'Opravte čas, doplňte kód, ktorý prišiel neskôr, alebo presuňte rezerváciu z Čaká na potvrdenie do Potvrdené.',
  'help.guide.edit-booking.step.1':
    'Kliknite na ceruzku v záhlaví karty. Otvorí sa Upraviť rezerváciu so všetkým, čo rezervácia obsahuje.',
  'help.guide.edit-booking.step.2': 'Zmeňte, čo treba, tu Rezervačný kód, ktorý prevádzkovateľ konečne poslal.',
  'help.guide.edit-booking.step.3': 'Nastavte Stav na Potvrdené.',
  'help.guide.edit-booking.step.4': 'Kliknite na Aktualizovať.',
  'help.guide.edit-booking.result':
    'Karta sa presunie: potvrdená rezervácia je v sekcii Potvrdené so zeleným bodom a všetci v ceste uvidia presun.',
  'help.guide.edit-booking.tip.1':
    'Rezervačný kód, ktorý sa nedá prečítať, spôsobuje Skryť rezervačné kódy v Nastaveniach v časti Zobrazenie. Prejdite naň myšou alebo naň kliknite a bude čitateľný.',
  'help.guide.edit-booking.tip.2':
    'Ak zmeníte typ, kategória prepojeného výdavku sa zmení s ním, pokiaľ ste kategóriu v editore nákladov nevybrali ručne.',
  'help.guide.edit-booking.tip.3': 'Aj ubytovanie sa upravuje tu: jeho dni Od a Do sú v tom istom formulári.',
  // delete-booking
  'help.guide.delete-booking.title': 'Vymažte rezerváciu',
  'help.guide.delete-booking.goal': 'Odstráňte z cesty rezerváciu, ktorá padla.',
  'help.guide.delete-booking.step.1': 'Kliknite na kôš v záhlaví karty.',
  'help.guide.delete-booking.step.2':
    'Odstrániť rezerváciu? uvádza tú, ktorú ste vybrali, a upozorní, že bude natrvalo odstránená.',
  'help.guide.delete-booking.step.3': 'Kliknite na Potvrdiť.',
  'help.guide.delete-booking.result':
    'Karta zmizla pre všetkých v ceste. Rezerváciu nemožno vrátiť späť, preto je otázka poslednou zastávkou.',
  'help.guide.delete-booking.tip.1':
    'Vymazaním rezervácie ubytovania zmiznú z plánu dňa aj jej noci a odstráni sa výdavok, ktorý s ňou bol prepojený.',
  'help.guide.delete-booking.tip.2':
    'Priložené dokumenty zostanú na záložke Súbory cesty; zmizne len ich prepojenie s rezerváciou.',

  // ── Screen: trip-lists ────────────────────────────────────────────────────────────────
  'help.ctx.trip-lists.title': 'Zoznamy',
  'help.ctx.trip-lists.summary':
    'Dva zoznamy pre jednu cestu: zoznam vecí na zbalenie, s tým, kto čo prinesie a koľko to váži, a zoznam úloh so všetkým, čo sa musí stať pred cestou a počas nej. Záložka je k dispozícii, kým je zapnutý doplnok Zoznamy.',
  'help.ctx.trip-lists.bullet.1':
    'Zoznam vecí a Úlohy hore prepínajú medzi oboma a počítajú, čo je v každom; tlačidlá vpravo patria k tomu, ktorý je práve otvorený.',
  'help.ctx.trip-lists.bullet.2':
    'Zoznam vecí je rozdelený do zoznamov, Dokumenty, Oblečenie, akokoľvek ich nazvete, každý s farebným bodom, odznakom zabalené z celkového počtu a tromi bodkami s Premenovať, Označiť všetko, Odznačiť všetko a Odstrániť zoznam. Pridať zoznam v lište hore vytvorí nový.',
  'help.ctx.trip-lists.bullet.3':
    'Riadok je zaškrtávacie políčko a názov, potom ako malé odznaky, kto položku prinesie, množstvo a hmotnosť v gramoch, a krúžok batožiny, kým je zapnuté Sledovanie batožiny, potom kôš a tri bodky s Presunúť do zoznamu, Zdieľanie, Premenovať a Odstrániť. Čo riadok nepoužíva, zostáva stlmené, kým naň neukážete myšou, a úchytom vľavo ho presuniete nahor alebo nadol v rámci jeho zoznamu.',
  'help.ctx.trip-lists.bullet.4':
    'Zdieľané a Môj zoznam rozdelia zoznam vecí na dve časti: spoločný, ktorý vidia všetci, a váš vlastný. Všetky, Otvorené a Hotovo zúžia ten, ktorý je otvorený, a lišta nad nimi počíta, čo je zabalené.',
  'help.ctx.trip-lists.bullet.5':
    'Použiť šablónu a Uložiť ako šablónu naplnia alebo uchovajú zoznam bez vypisovania a dve ikony vedľa nich zoznam exportujú, ako výtlačok, PDF alebo súbor, alebo nejaký importujú. Červené tlačidlo pri lište priebehu uvádza, koľko položiek je zaškrtnutých, a odstráni ich.',
  'help.ctx.trip-lists.bullet.6':
    'Úlohy majú vlastný bočný panel: kartu priebehu, filtre Všetko, Moje úlohy, Po termíne a Hotové, jeden riadok na zoznam a pod nimi Pridať zoznam. Úlohy sú v karte, ktorej hlavička pomenúva filter a nesie zoradenie, Priorita alebo Termín splnenia. Kliknutím na úlohu ju otvoríte v paneli vpravo a Pridať novú úlohu otvorí formulár Nová úloha uprostred obrazovky.',
  // packing-categories
  'help.guide.packing-categories.title': 'Zostavte zoznam vecí',
  'help.guide.packing-categories.goal':
    'Rozdeľte, čo si beriete, do zoznamov, naplňte ich položkami a určte, kto sa o ktorý zoznam stará.',
  'help.guide.packing-categories.step.1':
    'Kliknite na Pridať zoznam v lište nad zoznamami, napíšte názov do poľa Názov zoznamu (napr. Oblečenie) a kliknite na Pridať.',
  'help.guide.packing-categories.step.2':
    'Nový zoznam začína jedným prázdnym riadkom. Kliknite na Pridať položku, napíšte položku do poľa Názov položky… a stlačte Enter; pole zostane otvorené pre ďalšiu.',
  'help.guide.packing-categories.step.3':
    'Riadok premenujete kliknutím na jeho názov alebo cez Premenovať v troch bodkách na jeho pravom konci.',
  'help.guide.packing-categories.step.4':
    'Prerušovaný krúžok v hlavičke zoznamu priradí k zoznamu členov cesty. Vyberte meno; štítok, ktorý sa objaví, túto osobu po kliknutí opäť odstráni.',
  'help.guide.packing-categories.step.5':
    'Tri bodky na konci hlavičky obsahujú zvyšok: Premenovať, Označiť všetko, Odznačiť všetko a Odstrániť zoznam, ktoré odstráni zoznam aj všetko v ňom bez ďalšej otázky.',
  'help.guide.packing-categories.result':
    'Nový zoznam je v mriežke s položkami pod ním a farebným bodom a jeho odznak počíta, čo je už zabalené.',
  'help.guide.packing-categories.tip.1':
    'Zoznam tvoria len jeho položky. Vymažte poslednú a riadok sa zmení na zástupný, aby si zoznam ponechal miesto a farbu; vymažte aj tento riadok a zoznam zmizne.',
  'help.guide.packing-categories.tip.2':
    'Priradenie niekoho k zoznamu mu pošle upozornenie o balení. Nemení to, kto vidí položky, na to slúži Zdieľanie v troch bodkách riadku.',
  'help.guide.packing-categories.tip.3':
    'Dva zoznamy môžu mať rovnaký názov. TREK ich interne rozlišuje, takže názvy zostanú tak, ako ste ich napísali.',
  // check-off-packing
  'help.guide.check-off-packing.title': 'Odškrtávajte veci počas balenia',
  'help.guide.check-off-packing.goal': 'Označte, čo je v taške, sledujte lištu a zabalené položky odstráňte.',
  'help.guide.check-off-packing.step.1': 'Kliknite na políčko vľavo v riadku. Názov sa prečiarkne a lišta sa posunie.',
  'help.guide.check-off-packing.step.2':
    'Lišta hore porovnáva zabalené so všetkým v zozname, ako číslo aj ako percento.',
  'help.guide.check-off-packing.step.3':
    'Celý zoznam naraz: tri bodky v jeho hlavičke obsahujú Označiť všetko a Odznačiť všetko.',
  'help.guide.check-off-packing.step.4':
    'Všetky, Otvorené a Hotovo zúžia mriežku. Otvorené ponechá len to, čo ešte chýba, takže úplne zabalený zoznam z nej vypadne.',
  'help.guide.check-off-packing.step.5':
    'Odstrániť 3 označených vedľa lišty priebehu vymaže naraz všetky zaškrtnuté položky po jednom potvrdení v prehliadači.',
  'help.guide.check-off-packing.result':
    'Zobrazuje sa len to, čo je ešte otvorené, a lišta hore ukazuje, ako ďaleko je balenie.',
  'help.guide.check-off-packing.tip.1': 'Označenú položku môžete aj tak premenovať: kliknite na jej názov.',
  'help.guide.check-off-packing.tip.2':
    'Označiť všetko a Odznačiť všetko fungujú vždy na jeden zoznam, z vlastných troch bodiek daného zoznamu.',
  'help.guide.check-off-packing.tip.3':
    'Keď sú označené všetky položky, počítadlo nahradí Všetko je zabalené! a lišta zozelenie.',
  // apply-packing-template
  'help.guide.apply-packing-template.title': 'Použiť šablónu balenia',
  'help.guide.apply-packing-template.goal': 'Preneste do cesty hotový zoznam a zoznam tejto cesty si uložte na ďalšiu.',
  'help.guide.apply-packing-template.step.1': 'Kliknite na Použiť šablónu v lište nad zoznamom.',
  'help.guide.apply-packing-template.step.2':
    'Vyberte šablónu. Každý riadok uvádza jej názov a počet položiek, ktoré obsahuje.',
  'help.guide.apply-packing-template.step.3':
    'Položky sa pridajú do zobrazenia, v ktorom sa nachádzate: Zdieľané ich vloží do spoločného zoznamu, ktorý vidia všetci, Môj zoznam ich priradí vám.',
  'help.guide.apply-packing-template.step.4':
    'Zoznam tejto cesty si uložte na ďalšiu cestu: Uložiť ako šablónu otvorí dialóg, zadajte názov a kliknite na Uložiť.',
  'help.guide.apply-packing-template.result': 'Zoznamy a položky zo šablóny sú v ceste vedľa toho, čo tam už bolo.',
  'help.guide.apply-packing-template.tip.1':
    'Šablóna prenáša iba názvy a zoznamy. Množstvá, hmotnosti, zavazadlá a to, čo je už odškrtnuté, sa neprenesú.',
  'help.guide.apply-packing-template.tip.2':
    'Použiť šablónu je k dispozícii, až keď existuje nejaká šablóna. Bez nej sa tlačidlo vôbec nezobrazí.',
  'help.guide.apply-packing-template.tip.3':
    'Uložiť ako šablónu sa zobrazuje iba administrátorovi inštancie a iba vtedy, keď zoznam obsahuje položky. Uloží spoločný zoznam a vaše vlastné položky, nikdy nie súkromné položky iného člena.',
  // import-packing-list
  'help.guide.import-packing-list.title': 'Vložiť celý zoznam vecí naraz',
  'help.guide.import-packing-list.goal': 'Premeňte zoznam, ktorý už máte inde, na položky balenia jedným krokom.',
  'help.guide.import-packing-list.step.1': 'Kliknite na tlačidlo importu so šípkou nadol v lište nad zoznamom.',
  'help.guide.import-packing-list.step.2':
    'Jedna položka na riadok: Kategória, Názov, Hmotnosť v g (voliteľné), Zavazadlo (voliteľné), checked/unchecked (voliteľné). Sivá ukážka v poli zobrazuje všetky štyri varianty. Funguje aj zoznam v Markdowne: nadpis pomenuje zoznam a z "- [ ]" a "- [x]" sa stanú položky.',
  'help.guide.import-packing-list.step.3':
    'Alebo načítajte riadky zo súboru cez Načítať CSV/TXT/MD. Prijme súbor .csv, .txt alebo .md a nahradí všetko, čo je v poli.',
  'help.guide.import-packing-list.step.4': 'Kliknite na Importovať. Tlačidlo ukazuje počet riadkov, ktoré rozpoznalo.',
  'help.guide.import-packing-list.result':
    'Každý riadok sa stane položkou v zozname, ktorý uvádza jeho prvé pole, a nič z toho, čo tam už bolo, sa nezmení.',
  'help.guide.import-packing-list.tip.1':
    'Polia oddeľujú čiarky, bodkočiarky aj tabulátory a dvojité úvodzovky držia pole pohromade, takže "Tričko, modré" zostane jedným názvom. Riadok s jedinou hodnotou je iba názov, riadok bez vlastného zoznamu skončí v kategórii Ostatné a "3x" pred názvom nastaví množstvo.',
  'help.guide.import-packing-list.tip.2':
    'Zavazadlo uvedené vo štvrtom poli sa vytvorí, ak ho cesta ešte nemá. Je to jediné miesto, kde sa hmotnosti a zavazadlá načítajú hromadne; šablóna prináša iba názvy a zoznamy.',
  // export-packing-list
  'help.guide.export-packing-list.title': 'Vytlačiť alebo exportovať zoznam vecí',
  'help.guide.export-packing-list.goal':
    'Vezmite si zoznam so sebou na papieri, ako PDF alebo ako súbor pre inú aplikáciu či ďalšiu cestu.',
  'help.guide.export-packing-list.step.1': 'Kliknite na tlačidlo exportu so šípkou nahor v lište nad zoznamom.',
  'help.guide.export-packing-list.step.2':
    'Kontrolný zoznam v Markdowne (.md) a CSV na import (.csv) uložia zoznam hneď ako súbor.',
  'help.guide.export-packing-list.step.3':
    'Kliknite na Vytlačiť alebo uložiť ako PDF. Náhľad zobrazí zoznam ako stranu: hore cestu a jej termín, potom každý zoznam ako kartu s políčkom na zaškrtnutie.',
  'help.guide.export-packing-list.step.4':
    'Pod náhľadom kliknite na Vytlačiť alebo uložiť ako PDF. Prehliadač otvorí svoje dialógové okno tlače: vyberte tlačiareň, alebo Uložiť ako PDF, ak si chcete ponechať súbor.',
  'help.guide.export-packing-list.result':
    'Výtlačok aj súbory obsahujú otvorené zobrazenie, Zdieľané alebo Môj zoznam, s množstvami, hmotnosťami a zaškrtnutiami.',
  'help.guide.export-packing-list.tip.1':
    'CSV je formát, ktorý číta Importovať, vrátane zavazadiel, takže poslúži ako vaša vlastná šablóna balenia: importujte ho do ďalšej cesty.',
  'help.guide.export-packing-list.tip.2':
    'Súbor Markdown sa v Obsidian, Notion alebo GitHub otvorí ako kontrolný zoznam a cez Importovať sa rovnako vráti späť.',
  // share-packing-item
  'help.guide.share-packing-item.title': 'Určiť, kto položku vidí a kto ju prinesie',
  'help.guide.share-packing-item.goal':
    'Presúvajte položku medzi spoločným zoznamom skupiny, vaším vlastným zoznamom a ľuďmi, pre ktorých ju beriete.',
  'help.guide.share-packing-item.step.1':
    'Zdieľané nad zoznamami je spoločný zoznam, ktorý vidia všetci, Môj zoznam je váš vlastný a pri oboch je počet položiek. Kliknutím na Môj zoznam si pozriete ten svoj.',
  'help.guide.share-packing-item.step.2':
    'Späť v zobrazení Zdieľané otvorte tri bodky na konci riadku a kliknite na Zdieľanie.',
  'help.guide.share-packing-item.step.3':
    'Tri úrovne: Zdieľané, v spoločnom zozname skupiny a viditeľné pre všetkých; Osobné, ktoré vidíte iba vy; a Zdieľať s…, kde vyberiete ľudí, pre ktorých položka platí.',
  'help.guide.share-packing-item.step.4':
    'Osobná položka je iba v zobrazení Môj zoznam. Prepnite sa naň, aby ste ju našli.',
  'help.guide.share-packing-item.step.5':
    'Znova otvorte Zdieľanie a pod Zdieľať s… zaškrtnite meno. Položka sa zobrazí aj v zozname tejto osoby a riadok dostane malý odznak s počtom ľudí, s ktorými je zdieľaná.',
  'help.guide.share-packing-item.result': 'Položka je v úrovni, ktorú ste zvolili, a riadok ukazuje, kto ju prinesie.',
  'help.guide.share-packing-item.tip.1':
    'Zdieľanie položky mení iba osoba, ktorá ju prinesie. Ten, s kým ste ju zdieľali, ju vidí vo svojom zobrazení Môj zoznam označenú vaším menom a môže ju odškrtnúť.',
  'help.guide.share-packing-item.tip.2':
    'Pri položke, ktorú prináša niekto iný, máte namiesto toho dve iné tlačidlá: Môžem to vziať tiež, ktoré vás pridá vedľa neho, a Kopírovať do môjho zoznamu, ktoré vytvorí vašu vlastnú súkromnú kópiu.',
  'help.guide.share-packing-item.tip.3':
    'Nové položky preberajú zobrazenie, v ktorom ich pridáte. Pridané v zobrazení Môj zoznam sú Osobné, pridané v zobrazení Zdieľané idú do spoločného zoznamu.',
  // packing-bags
  'help.guide.packing-bags.title': 'Zvážiť zavazadlá',
  'help.guide.packing-bags.goal':
    'Priraďte každej položke hmotnosť, roztrieďte položky do zavazadiel a udržte každé zavazadlo pod limitom leteckej spoločnosti.',
  'help.guide.packing-bags.step.1': 'Kliknite na odznak hmotnosti pred krúžkom a zadajte hmotnosť položky v gramoch.',
  'help.guide.packing-bags.step.2': 'Krúžok na konci riadku je jej zavazadlo. Kliknite naň.',
  'help.guide.packing-bags.step.3':
    'Ešte žiadne zavazadlo: Pridať zavazadlo, názov, Enter. Zavazadlo sa vytvorí a položka sa doň hneď presunie.',
  'help.guide.packing-bags.step.4':
    'Panel Zavazadlá sa zobrazí vpravo, hneď ako existuje aspoň jedno zavazadlo: názov, hmotnosť, ukazovateľ naplnenia, kto ho nesie a koľko položiek obsahuje, potom Nepriradené a Celková hmotnosť.',
  'help.guide.packing-bags.step.5':
    'Kliknite na Nastaviť limit a zadajte limit v kilogramoch, tak ako ho uvádzajú letecké spoločnosti.',
  'help.guide.packing-bags.step.6': 'Prerušované plus vedľa názvu zavazadla určuje, kto ho nesie.',
  'help.guide.packing-bags.result':
    'Panel Zavazadlá vpravo ukazuje hmotnosť každého zavazadla voči jeho limitu, čo nie je v žiadnom zavazadle, a celkovú hmotnosť.',
  'help.guide.packing-bags.tip.1':
    'Pole hmotnosti, krúžok zavazadla a panel Zavazadlá existujú iba vtedy, keď má administrátor zapnuté Sledovanie batožiny v doplnku Zoznamy.',
  'help.guide.packing-bags.tip.2':
    'Hmotnosť zavazadla sa sčítava na serveri zo všetkých položiek všetkých členov vrátane tých, ktoré nevidíte, takže číslo skutočne zodpovedá tomu, koľko zavazadlo váži.',
  'help.guide.packing-bags.tip.3':
    'Zavazadlo bez limitu sa zobrazuje v pomere k najťažšiemu zavazadlu, aby ukazovatele zostali porovnateľné. Keď mu nastavíte limit, ukazovateľ sa meria voči nemu.',
  // create-todo
  'help.guide.create-todo.title': 'Pridať úlohu',
  'help.guide.create-todo.goal': 'Zapíšte si, čo treba urobiť, aj so zoznamom, prioritou, dátumom a menom.',
  'help.guide.create-todo.step.1': 'Kliknite na Pridať novú úlohu vpravo hore.',
  'help.guide.create-todo.step.2':
    'Pomenujte ju v poli Názov úlohy a všetko, čo stojí za zapamätanie, napíšte do poľa Popis.',
  'help.guide.create-todo.step.3':
    'Zoznam úlohy zoskupuje. Vyberte jeden alebo pomocou plusu vedľa neho pomenujte nový v malom dialógu.',
  'help.guide.create-todo.step.4': 'Priorita má štyri tlačidlá: Žiadne, P1, P2 a P3, od červenej po modrú.',
  'help.guide.create-todo.step.5': 'Termín splnenia otvorí kalendár a Priradené priradí úlohu konkrétnej osobe.',
  'help.guide.create-todo.step.6': 'Kliknite na Vytvoriť úlohu.',
  'help.guide.create-todo.result':
    'Úloha je v zozname so svojimi štítkami: priorita, termín splnenia, zoznam a osoba, ktorej je priradená, a otvorí sa v paneli vpravo.',
  'help.guide.create-todo.tip.1': 'Povinný je iba názov. Všetko ostatné môžete doplniť neskôr v paneli vpravo.',
  'help.guide.create-todo.tip.2': 'Ak je na bočnom paneli vybraný zoznam, nová úloha sa vytvorí v tomto zozname.',
  'help.guide.create-todo.tip.3': 'Enter v poli názvu vytvorí úlohu okamžite bez vyplnenia ostatných polí.',
  // todo-filters
  'help.guide.todo-filters.title': 'Nájsť a zmeniť úlohu',
  'help.guide.todo-filters.goal':
    'Zúžte zoznam úloh na to, na čom práve záleží, a potom upravte úlohu, na ktorú ste narazili.',
  'help.guide.todo-filters.step.1':
    'Úlohy na bočnom paneli: Všetky je všetko, čo je ešte otvorené, Moje úlohy to, čo je na vás, Po termíne to, čo má dátum v minulosti, Hotovo to, čo je dokončené. Pri každej položke je počet; kliknite na Po termíne.',
  'help.guide.todo-filters.step.2':
    'Pod Zoznamy je jeden riadok pre každý zoznam. Výberom sa zobrazí daný zoznam vrátane dokončených úloh.',
  'help.guide.todo-filters.step.3':
    'Zoradenie v hlavičke zoznamu mení poradie toho, čo je na obrazovke: Priorita dá na začiatok P1, Termín splnenia najbližší termín. Naraz platí iba jedno z nich a druhé kliknutie vráti vaše vlastné poradie.',
  'help.guide.todo-filters.step.4': 'Kliknutím na úlohu ju otvoríte v paneli vpravo.',
  'help.guide.todo-filters.step.5':
    'Zmeňte, čo potrebujete: Popis, Priorita, Zoznam, Termín splnenia alebo Priradené, potom Uložiť zmeny. Začiarkavacie políčko v hlavičke panela označí úlohu ako hotovú a Zmazať ju okamžite odstráni.',
  'help.guide.todo-filters.result':
    'Zoznam ukazuje iba úlohy, ktoré ste chceli vidieť, a panel vpravo upravuje tú, ktorú ste vybrali.',
  'help.guide.todo-filters.tip.1':
    'Riadok zoznamu počíta iba to, čo je ešte otvorené, ale po jeho výbere sa zobrazia aj dokončené úlohy. Všetky, Moje úlohy a Po termíne skrývajú hotové; Hotovo nezobrazuje nič iné.',
  'help.guide.todo-filters.tip.2':
    'Priorita a Termín splnenia v zoradení sa navzájom vylučujú a kým je niektoré zapnuté, riadky už nemožno presúvaním usporiadať do vlastného poradia.',

  // ── Screen: trip-costs ────────────────────────────────────────────────────────────────
  'help.ctx.trip-costs.title': 'Náklady',
  'help.ctx.trip-costs.summary':
    'Peniaze cesty: každý výdavok v datovanom prehľade, kto ho zaplatil a kto zaň dlhuje, v mene, v ktorej bola účtenka, a v pravom stĺpci, kto má komu zaplatiť, aby bolo všetko opäť vyrovnané.',
  'help.ctx.trip-costs.bullet.1':
    'Štyri karty hore: Dlhujete a Dlhujú vám sú vaša strana vyúčtovania, Nevyriešená suma je to, čo je zaznamenané, ale ešte nemá platiteľa, a Celkové výdavky na cestu sčítava všetko, pod tým je váš podiel a to, čo ste zaplatili.',
  'help.ctx.trip-costs.bullet.2':
    'Pridať výdavok vpravo hore otvorí editor; Vyrovnať vedľa neho zaznamená všetky otvorené prevody naraz.',
  'help.ctx.trip-costs.bullet.3':
    'Prehľad je zoskupený podľa dní, najnovšie navrchu, so súčtom daného dňa vpravo. Riadok obsahuje kategóriu ako farebný štítok, názov, čipy platiteľov, poznámku a sumu, navyše požičali ste alebo požičali ste si, keď vás rozdelenie dostane do plusu alebo mínusu.',
  'help.ctx.trip-costs.bullet.4':
    'Nad zoznamom sú Hľadať výdavky…, filter kategórií, filter dní, prepínač Všetky / Zaplatené mnou / Dlhujú mi a tlačidlo Exportovať CSV.',
  'help.ctx.trip-costs.bullet.5':
    'Pravý stĺpec je odpoveďou: Vyrovnať uvádza, kto platí komu, Zostatky ukazujú prebytok alebo schodok každého cestujúceho, Konečný rozpočet, koľko cesta stojí každého z nich, a Podľa kategórie, kam peniaze išli.',
  'help.ctx.trip-costs.bullet.6':
    'Zaznamenaná platba je v tom istom prehľade ako samostatný riadok s tlačidlami Upraviť a Vrátiť späť; výdavok má ceruzku a kôš a kôš ho vymaže bez opýtania.',
  // add-expense
  'help.guide.add-expense.title': 'Pridať výdavok',
  'help.guide.add-expense.goal': 'Zaznamenajte, koľko niečo stálo, kto to zaplatil a s kým sa to delí.',
  'help.guide.add-expense.step.1':
    'Kliknite na Pridať výdavok vpravo hore na karte Náklady. Otvorí sa editor s dnešným dátumom a so všetkými už zahrnutými v rozdelení.',
  'help.guide.add-expense.step.2':
    'Do poľa Za čo to bolo?, jediného povinného poľa, napíšte, za čo výdavok bol, a do poľa Celková suma údaj z účtenky.',
  'help.guide.add-expense.step.3':
    'Mena a Deň sú pod sumou. Mena je predvolene nastavená na menu cesty; keď ju zmeníte, editor ukáže, akú hodnotu má suma v mene cesty. Deň je predvolene dnešný a podľa neho sa výdavok v prehľade zoskupí.',
  'help.guide.add-expense.step.4':
    'Vyberte Kategóriu. Je ich štrnásť a nedajú sa meniť: tá, ktorú zvolíte, je farebný štítok na riadku a stĺpec v Podľa kategórie.',
  'help.guide.add-expense.step.5':
    'V časti Kto zaplatil? vyberte osobu, ktorá peniaze skutočne vyložila. Predvolene je vybraté Vy; Zatiaľ nikto nezaplatil zaznamená sumu bez toho, aby za ňu niekto dlhoval, a Platilo viacero ľudí rozdelí účet medzi viacerých platiteľov.',
  'help.guide.add-expense.step.6':
    'Rozdeliť začína na Rovnakým dielom so všetkými zahrnutými a pri každom mene je podiel, ktorý mu vychádza. Uložte kliknutím na Pridať výdavok.',
  'help.guide.add-expense.result':
    'Výdavok je v prehľade pod svojím dňom, započítaný do Celkové výdavky na cestu, a stĺpec vyrovnania prepočítal, kto komu dlhuje.',
  'help.guide.add-expense.tip.1':
    'Ak nič nezmeníte, výdavok je v mene cesty, s dnešným dátumom a rozdelený rovnakým dielom medzi všetkých: vyplniť treba naozaj iba názov a sumu.',
  'help.guide.add-expense.tip.2':
    '± vedľa sumy zmení výdavok na refundáciu. Záporná suma peniaze vracia namiesto toho, aby ich brala, a rozdelenie funguje opačne.',
  'help.guide.add-expense.tip.3':
    'Priložiť účtenku / faktúru dole prijíma obrázky a PDF. Nahrajú sa pri uložení, uložia sa do Súborov cesty a vedľa názvu v zozname sa objaví čip Účtenky.',
  // expense-payers
  'help.guide.expense-payers.title': 'Určiť, kto zaplatil účet',
  'help.guide.expense-payers.goal': 'Zaznamenajte, kto za výdavok vyložil peniaze, druhú polovicu výpočtu vyrovnania.',
  'help.guide.expense-payers.step.1':
    'Otvorte výdavok ceruzkou vedľa jeho riadku a pozrite sa na Kto zaplatil?. Predvolene je Platil jeden človek: rozbaľovací zoznam určuje jedinú osobu, ktorá peniaze vyložila.',
  'help.guide.expense-payers.step.2':
    'Zatiaľ nikto nezaplatil, prvá položka tohto zoznamu, zaznamená sumu bez toho, aby ktokoľvek niečo dlhoval. Výdavok sa aj tak započíta do Celkové výdavky na cestu.',
  'help.guide.expense-payers.step.3':
    'Platilo viacero ľudí, odkaz vedľa popisu, otvorí riadok pre každého cestujúceho. Zahrňte tých, ktorí platili, a zadajte, koľko každý z nich vložil; sumy musia dať dohromady celkovú sumu.',
  'help.guide.expense-payers.step.4':
    'Výdavok, za ktorý nikto nezaplatil, je na svojom riadku označený ako Nedokončené a započítaný do karty Nevyriešená suma, kde sa zhromažďujú zaznamenané, ale nevyrovnané výdavky.',
  'help.guide.expense-payers.result':
    'Kto zaplatil, rozhoduje, komu sa peniaze vracajú, rozdelenie rozhoduje, kto platí, a Zostatky sú rozdiel medzi nimi.',
  'help.guide.expense-payers.tip.1':
    'Kto zaplatil? a Rozdeliť sú nezávislé: môžete zaplatiť večeru, na ktorej ste neboli, a byť zahrnutí do inej, ktorú ste neplatili.',
  'help.guide.expense-payers.tip.2':
    'Pri viacerých platiteľoch musia sumy dať dohromady celkovú sumu. Keď zahrniete ďalšieho, ostatné sumy sa mu prispôsobia; kým nesedia, editor ukazuje, koľko musia dať dohromady, a odmietne uložiť.',
  'help.guide.expense-payers.tip.3':
    'Odstránenie platiteľa neodstráni výdavok: suma zostáva v Celkové výdavky na cestu a riadok sa zmení na Nedokončené.',
  // split-expense
  'help.guide.split-expense.title': 'Rozdeliť účet medzi cestujúcich',
  'help.guide.split-expense.goal':
    'Určte, kto za výdavok dlhuje: všetci rovnakým dielom, podľa súm alebo položku po položke z účtenky.',
  'help.guide.split-expense.step.1':
    'V editore výdavku Rozdeliť uvádza všetkých cestujúcich. Kliknutím na meno daného cestujúceho z tohto výdavku vynecháte; vynechaný cestujúci má označenie Nezahrnuté a nič zaň nedlhuje.',
  'help.guide.split-expense.step.2':
    'Rovnakým dielom je predvolené: každý zahrnutý cestujúci dostane rovnaký podiel a riadok pod zoznamom uvádza, na koľko častí sa delí a koľko vychádza na každý podiel.',
  'help.guide.split-expense.step.3':
    'Vlastné nahradí podiely poliami na sumy. Zadajte, koľko dlhuje každý cestujúci; riadok pod nimi priebežne počíta a pri Rozdelenie sedí s celkom zozelenie. Kým nesedí, nedá sa uložiť.',
  'help.guide.split-expense.step.4':
    'Účtenka rozdelí účet položku po položke: Pridať položku, potom názov a cena pre každý riadok a pod Delí sa medzi: cestujúci, ktorí sa o tento riadok delia.',
  'help.guide.split-expense.step.5':
    'Podiel každého pod riadkami ukazuje, koľko nakoniec dlhuje každý cestujúci, a Celková suma hore sa sčíta z riadkov. Kliknite na Uložiť.',
  'help.guide.split-expense.result':
    'Rozdelenie je základom každého zostatku. Uloží sa s výdavkom a dá sa neskôr zmeniť bez toho, aby sa zmenilo čokoľvek iné.',
  'help.guide.split-expense.tip.1':
    'Cestujúci, ktorého vynecháte, má označenie Nezahrnuté a za tento jeden výdavok nič nedlhuje; ostatní prevezmú svoj podiel.',
  'help.guide.split-expense.tip.2':
    'Rovnakým dielom je presné na cent: zvyšný cent sa strieda od výdavku k výdavku, takže ho nikto neplatí vždy.',
  'help.guide.split-expense.tip.3':
    'Režim Účtenka sčíta Celková suma sám a pole zošedne: celkovú sumu tvoria riadky účtenky.',
  // expense-currency
  'help.guide.expense-currency.title': 'Zadať výdavok v inej mene',
  'help.guide.expense-currency.goal': 'Zadajte, čo je skutočne na účtenke, a kurz nechajte na TREK.',
  'help.guide.expense-currency.step.1':
    'Otvorte Pridať výdavok a vyplňte názov a sumu presne podľa účtenky, samotný údaj, nie jeho prepočet.',
  'help.guide.expense-currency.step.2':
    'Otvorte Mena a vyberte menu z účtenky. Zoznam obsahuje každý kód, ktorý TREK pozná, a dá sa v ňom hľadať: napíšte tri písmená.',
  'help.guide.expense-currency.step.3':
    'Pod poľami sa objaví riadok s tým, akú hodnotu má suma práve teraz, označený ako aktuálny kurz. Je to náhľad, nie hodnota, ktorá sa uloží.',
  'help.guide.expense-currency.step.4':
    'Kliknite na Pridať výdavok. Kurz sa okamžite zmrazí: odteraz má tento výdavok hodnotu, akú mal v deň, keď ste ho zadali.',
  'help.guide.expense-currency.step.5':
    'V prehľade má riadok pod názvom oba údaje: to, čo ste zadali, šípku a to, koľko to predstavuje v mene cesty. Všetky súčty, zostatky a vyrovnania vyššie používajú ten druhý.',
  'help.guide.expense-currency.result':
    'Výdavok si zachová sumu a menu, ktoré ste zadali. Prehľad zobrazuje oba údaje a súčty a zostatky cesty zostávajú v mene cesty.',
  'help.guide.expense-currency.tip.1':
    'Kurz sa zmrazí v okamihu uloženia, takže vyrovnaný dlh sa znova neotvorí, keď sa trh o týždeň neskôr pohne. Nový kurz zmrazí iba zmena meny výdavku.',
  'help.guide.expense-currency.tip.2':
    'Zobrazovaná mena v Nastaveniach mení iba to, čo vidíte; uložené sumy sa nikdy nemenia. Ak zostane prázdna, každá cesta sa zobrazuje vo svojej vlastnej mene.',
  'help.guide.expense-currency.tip.3':
    'Samotná mena cesty je nastavená pri ceste, v časti Upraviť cestu, a jej zmena vyžaduje oprávnenie upravovať cestu. Zmenou sa všetky zmrazené kurzy ukotvia k novej mene, sumy sa neprepočítavajú.',
  // filter-costs
  'help.guide.filter-costs.title': 'Nájsť výdavok alebo výdavky jedného dňa',
  'help.guide.filter-costs.goal': 'Zúžte dlhý prehľad na to, čo skutočne hľadáte.',
  'help.guide.filter-costs.step.1':
    'Píšte do poľa Hľadať výdavky… nad zoznamom. Už počas písania hľadá podľa názvu výdavku.',
  'help.guide.filter-costs.step.2':
    'Všetky kategórie otvorí štrnásť kategórií. Vyberte jednu a zostanú iba výdavky tejto kategórie.',
  'help.guide.filter-costs.step.3':
    'Všetky dni uvádza každý deň, v ktorom sa niečo minulo. Vyberte jeden a namiesto hlavičiek dní sa zobrazí pruh s týmto dňom, počtom jeho výdavkov a jeho súčtom.',
  'help.guide.filter-costs.step.4':
    'Prepínač Všetky / Zaplatené mnou / Dlhujú mi je váš vlastný pohľad na prehľad: za čo ste platili vy a čo vám ešte nebolo vrátené.',
  'help.guide.filter-costs.step.5':
    'Exportovať CSV na konci riadku zapíše všetky výdavky do súboru s pôvodnou sumou, jej menou a prepočítanou sumou.',
  'help.guide.filter-costs.result':
    'Filtre sa kombinujú a skupiny dní sa prekreslia s vlastnými súčtami pre to, čo zostane.',
  'help.guide.filter-costs.tip.1':
    'Zaznamenané platby nemajú názov ani kategóriu, takže ich vyhľadávanie alebo filter kategórií skryje. Filter dní ich ponechá pod dňom, keď bola platba zaznamenaná.',
  'help.guide.filter-costs.tip.2':
    'Exportovať CSV vždy exportuje všetky výdavky bez ohľadu na filter na obrazovke, jeden riadok na výdavok.',
  // settle-up
  'help.guide.settle-up.title': 'Zistiť, kto komu dlhuje, a vyrovnať to',
  'help.guide.settle-up.goal':
    'Premeňte kopu spoločných výdavkov na čo najmenej prevodov, ktoré všetkých vyrovnajú, a zaznamenávajte ich, keď sa uskutočnia.',
  'help.guide.settle-up.step.1':
    'Karta Vyrovnať v pravom stĺpci uvádza prevody, ktoré by všetkých vyrovnali: kto platí komu a koľko. Číslo vedľa nadpisu udáva, koľko ich je ešte otvorených.',
  'help.guide.settle-up.step.2':
    'Vyrovnať vedľa prevodu ho zaznamená ako vykonaný. Prevod z karty zmizne a zostatky sa prekreslia.',
  'help.guide.settle-up.step.3':
    'Zaznamenaný prevod je riadok v prehľade pod dňom, keď sa uskutočnil, označený ako Platba s oboma cestujúcimi a sumou.',
  'help.guide.settle-up.step.4':
    'Vedľa tohto riadku ceruzka platbu opraví a Vrátiť späť ju zruší, pričom sa prevod vráti na kartu Vyrovnať.',
  'help.guide.settle-up.step.5':
    'Pridať platbu v hlavičke karty zaznamená prevod, ktorý nezodpovedá žiadnemu návrhu. Vyberte Od a Komu, sumu, jej menu a deň, keď sa uskutočnil.',
  'help.guide.settle-up.step.6':
    'Vyrovnať v hlavičke hore na obrazovke zaznamená všetky otvorené prevody naraz, tak ako sa skupina vyrovná na konci cesty.',
  'help.guide.settle-up.result':
    'Každý zaznamenaný prevod je riadok v prehľade a o riadok menej na karte Vyrovnať. Keď karta ukazuje Všetci sú vyrovnaní, cesta je splatená.',
  'help.guide.settle-up.tip.1':
    'Karta ukazuje čo najmenej prevodov, nie každý dlh: traja ľudia, ktorí si navzájom dlhujú do kruhu, sa zredukujú na jednu alebo dve platby.',
  'help.guide.settle-up.tip.2':
    'Vyrovnať prevod iba zaznamená, peniaze nepresúva. Pošlite ich akýmkoľvek spôsobom, ktorý používate, a potom naň kliknite.',
  'help.guide.settle-up.tip.3':
    'Platbu možno uskutočniť v akejkoľvek mene, takže splatiť dlh v jenoch eurami je bežné: dialóg má vlastný výber meny a aj tento kurz zmrazí.',
  // final-budget
  'help.guide.final-budget.title': 'Zistiť, koľko cesta stála každého cestujúceho',
  'help.guide.final-budget.goal':
    'Pozrite si prehľad po jednotlivých osobách: dnešný zostatok a skutočné náklady na osobu.',
  'help.guide.final-budget.step.1':
    'Zostatky ukazujú pozíciu každého cestujúceho: zelený pruh doprava, ak mu cesta dlhuje, červený pruh doľava, ak dlhuje on, a sumu vedľa mena.',
  'help.guide.final-budget.step.2':
    'Konečný rozpočet pod nimi odpovedá na inú otázku: nie kto čo práve dlhuje, ale koľko cesta stojí každého cestujúceho, keď sa všetko vyrovná.',
  'help.guide.final-budget.step.3':
    'Kliknutím na meno otvoríte výpočet: Zaplatené výdavky a pod tým Náhrady netto a Nevyriešené náhrady.',
  'help.guide.final-budget.step.4':
    'Pod každým riadkom sú položky, z ktorých sa skladá: výdavky, ktoré tento cestujúci zaplatil, už zaznamenané prevody a tie ešte otvorené. Ich súčet presne zodpovedá riadku nad nimi.',
  'help.guide.final-budget.result':
    'Zostatky ukazujú, kto je dnes v pluse alebo v mínuse; Konečný rozpočet je to, koľko cesta nakoniec stojí každého z vás, keď sa všetko vyrovná.',
  'help.guide.final-budget.tip.1':
    'Zaznamenanie platby nezmení nikomu konečný rozpočet. Iba presunie sumu z nevyriešených náhrad do náhrad netto.',
  'help.guide.final-budget.tip.2':
    'Výdavok bez platiteľa zostáva mimo oboch kariet, rovnako ako zostáva mimo návrhov na vyrovnanie.',
  // expense-from-booking
  'help.guide.expense-from-booking.title': 'Premeniť rezerváciu na výdavok',
  'help.guide.expense-from-booking.goal':
    'Priraďte skutočnú cenu letu, hotela alebo miesta k záznamu, ku ktorému patrí.',
  'help.guide.expense-from-booking.step.1':
    'Otvorte rezerváciu na karte Doprava alebo Rezervácie a kliknite na jej ceruzku.',
  'help.guide.expense-from-booking.step.2':
    'Prejdite na blok Náklady v spodnej časti formulára. Ponúka Vytvoriť výdavok, ktorý najprv uloží rezerváciu, a Prepojiť existujúci výdavok pre výdavok, ktorý už v Nákladoch je.',
  'help.guide.expense-from-booking.step.3':
    'Kliknite na Vytvoriť výdavok. Rezervácia sa uloží, formulár sa zatvorí a otvorí sa editor nákladov s názvom rezervácie ako názvom výdavku a s kategóriou priradenou podľa jej typu.',
  'help.guide.expense-from-booking.step.4':
    'Vyplňte sumu a jej menu, kto zaplatil a rozdelenie ako pri každom výdavku a uložte. Po opätovnom otvorení rezervácie je výdavok v časti Prepojené výdavky, s ceruzkou na úpravu, Odpojiť, výdavok ponechať na uvoľnenie a košom na odstránenie.',
  'help.guide.expense-from-booking.result':
    'Rezervácia nesie svoju cenu a výdavok je bežný riadok na karte Náklady s platiteľom, rozdelením a menou ako ktorýkoľvek iný.',
  'help.guide.expense-from-booking.tip.1':
    'Vymazaním rezervácie sa vymažú aj jej prepojené výdavky. Odstrániť výdavok v bloku Náklady rezervácie robí opak: výdavok zmizne, rezervácia zostane. Odpojiť, výdavok ponechať zachová oboje.',
  'help.guide.expense-from-booking.tip.2':
    'Miesto má vo svojom formulári rovnaký blok a Vytvoriť výdavok v ňom najprv uloží miesto.',

  // ── Screen: trip-files ────────────────────────────────────────────────────────────────
  'help.ctx.trip-files.title': 'Súbory',
  'help.ctx.trip-files.summary':
    'Všetky dokumenty cesty v jednom zozname: lístky, potvrdenia, preukazy a obrázky, každý s poznámkou, prepojením na miesto alebo rezerváciu, ku ktorej patrí, a košom, z ktorého sa dá vrátiť.',
  'help.ctx.trip-files.bullet.1':
    'Presuňte súbory sem hore prijíma súbory; kliknutím na pole sa otvorí výber súborov. Riadok pod ním uvádza typy súborov, ktoré tento TREK prijíma, a limit 50 MB na súbor.',
  'help.ctx.trip-files.bullet.2':
    'Karty hovoria, čo zoznam ukazuje: Všetky, PDF, Obrázky a Dokumenty, každá s počtom. Karta s hviezdičkou pribudne, hneď ako je nejaký súbor označený hviezdičkou, Poznámky spolupráce, hneď ako má niektorá poznámka prílohu.',
  'help.ctx.trip-files.bullet.3':
    'Riadok ukazuje, kto súbor nahral, názov, poznámku pod ním, veľkosť a dátum a jeden štítok na každé prepojenie: Denný plán a miesto, Rezervácia alebo Doprava a rezerváciu, Z poznámok spolupráce.',
  'help.ctx.trip-files.bullet.4':
    'Na konci riadku sú Označiť hviezdičkou, Priradiť, Otvoriť, Stiahnuť a Vymazať. Vymazať sa nepýta: súbor ide do koša, odkiaľ sa dá vrátiť.',
  'help.ctx.trip-files.bullet.5':
    'Obrázok alebo video sa otvorí na celú obrazovku s ovládaním šípkami a pásom miniatúr; každý iný dokument sa otvorí v náhľade nad stránkou s tlačidlami Otvoriť na novej karte a Stiahnuť. Karta do peňaženky sa hneď stiahne.',
  'help.ctx.trip-files.bullet.6':
    'Kôš na pravom konci prepne zoznam na vymazané súbory, kde sa každý dá obnoviť alebo natrvalo vymazať a Vyprázdniť kôš ich odstráni všetky. Ak administrátor pripojil úložisko dokumentov, vedľa je Synchronizácia dokumentov.',
  // files-upload
  'help.guide.files-upload.title': 'Vložiť dokument do cesty',
  'help.guide.files-upload.goal':
    'Presuňte lístok, potvrdenie alebo fotku z priečinka so stiahnutými súbormi do cesty, kde k nim má prístup každý jej účastník.',
  'help.guide.files-upload.step.1':
    'Otvorte cestu a na lište kariet kliknite na Súbory. Sú tam uvedené dokumenty cesty a nad nimi pole na nahrávanie.',
  'help.guide.files-upload.step.2':
    'Kliknite na Presuňte súbory sem a vyberte jeden alebo viac súborov. Nahrávajú sa jeden po druhom a pole počas toho ukazuje Nahráva sa... Riadok pod poľom uvádza, ktoré typy tento TREK prijíma a že súbor môže mať najviac 50 MB.',
  'help.guide.files-upload.step.3':
    'Hneď ako je posledný súbor nahratý, samo sa preň otvorí Priradiť súbor. Pridať poznámku... dá súboru vlastný riadok textu a zoznamy pod ním ho prepoja s miestom alebo rezerváciou. Zatvorte ho krížikom ×; zatvorením sa nič nestratí.',
  'help.guide.files-upload.step.4':
    'Nové súbory sú navrchu zoznamu. Riadok ukazuje, kto súbor nahral, názov, veľkosť a dátum; obrázok má miniatúru, každý iný súbor svoj typ.',
  'help.guide.files-upload.result': 'Dokumenty sú v ceste a každý, kto cestu vidí, ich môže otvoriť a stiahnuť.',
  'help.guide.files-upload.tip.1':
    'Súbor môžete tiež pretiahnuť z plochy priamo na pole, ktoré sa rozsvieti, kým je súbor nad ním.',
  'help.guide.files-upload.tip.2':
    'Obrázok zo schránky vložíte do zoznamu cez Ctrl+V, takže snímku obrazovky rezervácie nemusíte najprv ukladať.',
  'help.guide.files-upload.tip.3':
    'Nahrávanie vyžaduje oprávnenie nahrávať súbory; bez neho pole vôbec nie je. Typ, ktorý nie je v zozname, sa odmietne so správou a nič sa nenahrá. Súbor nad 50 MB odmietne samotné pole ešte pred odoslaním.',
  // files-link
  'help.guide.files-link.title': 'Prepojiť dokument s miestom alebo rezerváciou',
  'help.guide.files-link.goal': 'Nech sa dá lístok nájsť aj zo dňa, ku ktorému patrí, nielen z tohto zoznamu.',
  'help.guide.files-link.step.1':
    'Kliknite na Priradiť, ceruzku na konci riadku. Otvorí sa Priradiť súbor s názvom súboru.',
  'help.guide.files-link.step.2':
    'Pod Poznámka pole Pridať poznámku... prijme jeden riadok, ktorý sa potom zobrazí pod názvom súboru v zozname. Uloží sa v momente, keď pole opustíte.',
  'help.guide.files-link.step.3':
    'Pod Miesto sú miesta cesty zoskupené podľa dní, na ktorých sú, a na konci Nepriradené pre tie, ktoré nie sú v žiadnom dni. Kliknite na jedno a dostane fajku.',
  'help.guide.files-link.step.4':
    'Pod Rezervácia a Doprava sú rezervácie cesty. Kliknite na tú, ku ktorej dokument patrí; aj ona dostane fajku.',
  'help.guide.files-link.step.5':
    'Zatvorte krížikom ×. Nie je tu žiadne tlačidlo na uloženie: každé kliknutie sa zapísalo hneď.',
  'help.guide.files-link.result':
    'Riadok nesie poznámku a jeden štítok na každé prepojenie, Denný plán a názov miesta, Doprava a názov letu, a dokument je pripojený aj k miestu a k letu.',
  'help.guide.files-link.tip.1':
    'Súbor môže mať naraz viac prepojení, takže to isté potvrdenie patrí k hotelu aj k noci, na ktorú platí.',
  'help.guide.files-link.tip.2':
    'Opätovným kliknutím na zaškrtnutú položku sa prepojenie zruší; samotný súbor zostane.',
  'help.guide.files-link.tip.3':
    'Funguje to aj opačne: dokument priložený k miestu alebo rezervácii je aj v tomto zozname, s rovnakým štítkom na riadku.',
  // files-star
  'help.guide.files-star.title': 'Držať dôležité dokumenty navrchu',
  'help.guide.files-star.goal':
    'Vytiahnite dva alebo tri papiere, ktoré budete naozaj potrebovať, zo zoznamu, ktorý rastie počas celej cesty.',
  'help.guide.files-star.step.1':
    'Kliknite na Označiť hviezdičkou na konci riadku. Vyplní sa žltou, pred názvom súboru sa objaví druhá hviezdička a tlačidlo teraz ukazuje Odobrať hviezdičku.',
  'help.guide.files-star.step.2':
    'Zoznam sa znova zoradí: súbory s hviezdičkou sú nad všetkými ostatnými, v každej skupine najnovšie navrchu.',
  'help.guide.files-star.step.3':
    'Medzi kartami hore pribudla hviezdička s počtom súborov označených hviezdičkou. Kliknutím na ňu zobrazíte iba tie.',
  'help.guide.files-star.result':
    'Papiere, ktoré potrebujete pri prepážke, sú navrchu zoznamu a jedna karta nezobrazuje nič iné.',
  'help.guide.files-star.tip.1':
    'Karta s hviezdičkou existuje iba vtedy, keď je niečo označené hviezdičkou. Odoberte hviezdičku z posledného súboru a karta zmizne s ňou.',
  'help.guide.files-star.tip.2':
    'Označenie hviezdičkou sa počíta ako úprava: člen, ktorý smie súbory cesty iba čítať, hviezdičky vidí, ale nemôže ich nastaviť.',
  // files-filter
  'help.guide.files-filter.title': 'Nájsť dokument v zozname',
  'help.guide.files-filter.goal': 'Zúžte zoznam všetkého na ten jeden druh papiera, ktorý hľadáte.',
  'help.guide.files-filter.step.1': 'Karty nad zoznamom sú Všetky, PDF, Obrázky a Dokumenty, každá s počtom súborov.',
  'help.guide.files-filter.step.2': 'Kliknite na PDF: v zozname zostanú iba súbory PDF.',
  'help.guide.files-filter.step.3':
    'Dve ďalšie karty sa objavujú a miznú podľa toho, čo je v ceste. Kliknite na Poznámky spolupráce, ktorá je k dispozícii, hneď ako má poznámka na karte Spolupráca prílohu: v zozname zostanú iba tieto súbory. Hviezdička pribudne rovnako, hneď ako je nejaký súbor označený hviezdičkou.',
  'help.guide.files-filter.step.4': 'Všetky vráti celý zoznam.',
  'help.guide.files-filter.result':
    'Zoznam ukazuje iba to, čo uvádza karta, a počet na každej karte hovorí, koľko toho je.',
  'help.guide.files-filter.tip.1':
    'Nie sú tu žiadne priečinky ani premenovanie: dokumenty sa triedia podľa poznámky v Priradiť súbor, prepojení na miesta a rezervácie a hviezdičky.',
  'help.guide.files-filter.tip.2':
    'Samotný zoznam je vždy zoradený najprv podľa hviezdičky, potom od najnovšieho, takže dnes nahraný dokument je nad dokumentom z minulého mesiaca.',
  // files-preview
  'help.guide.files-preview.title': 'Prečítať dokument bez opustenia TREK',
  'help.guide.files-preview.goal':
    'Pozrite si lístok alebo obrázok hneď na mieste a keď ho potrebujete, stiahnite si ho do svojho zariadenia.',
  'help.guide.files-preview.step.1':
    'Kliknite na názov obrázka alebo na jeho miniatúru. Otvorí sa na celú obrazovku a v hlavičke je názov súboru a jeho poradie medzi obrázkami.',
  'help.guide.files-preview.step.2':
    'Okrúhle šípky po stranách, klávesy šípka vľavo a vpravo a pás miniatúr dole prechádzajú všetkými obrázkami, ktoré zoznam práve zobrazuje.',
  'help.guide.files-preview.step.3':
    'Otvoriť na novej karte a Stiahnuť sú v hlavičke; × alebo Escape obrázok znova zatvorí.',
  'help.guide.files-preview.step.4':
    'Dokument, ktorý nie je obrázok, sa namiesto toho otvorí v náhľade nad stránkou s tými istými dvoma tlačidlami v hlavičke. Ten sa zatvorí krížikom × alebo kliknutím vedľa neho.',
  'help.guide.files-preview.step.5':
    'Stiahnuť na konci riadku uloží súbor priamo do vášho zariadenia bez toho, aby sa niečo najprv otváralo.',
  'help.guide.files-preview.result':
    'Dokument je na obrazovke a tie isté dve tlačidlá ho otvoria na karte prehliadača alebo uložia na disk.',
  'help.guide.files-preview.tip.1':
    'Na dotykovej obrazovke obrázkami namiesto klikania na šípky listujete potiahnutím prsta.',
  'help.guide.files-preview.tip.2':
    'Karta do peňaženky nikdy neotvorí náhľad: hneď sa stiahne, aby ju telefón mohol odovzdať svojej aplikácii peňaženky.',
  'help.guide.files-preview.tip.3':
    'Otvoriť na novej karte aj Stiahnuť načítajú súbor s vašou reláciou, takže odkaz skopírovaný z panela s adresou je pre nikoho iného nepoužiteľný.',
  // files-trash
  'help.guide.files-trash.title': 'Vyhodiť dokument a vrátiť ho späť',
  'help.guide.files-trash.goal':
    'Odstráňte to, čo cesta už nepotrebuje, bez toho, aby ste stratili niečo, čo ste nakoniec predsa potrebovali.',
  'help.guide.files-trash.step.1':
    'Kliknite na Vymazať na konci riadku. Súbor okamžite zmizne zo zoznamu a zobrazí sa správa Presunuté do koša. Nič sa vopred nepýta.',
  'help.guide.files-trash.step.2':
    'Kôš na pravom konci panela nástrojov prepne zoznam na to, čo bolo vyhodené. Nadpis znie Kôš a karty filtrov zmiznú.',
  'help.guide.files-trash.step.3':
    'Vyhodený riadok je sivý a zostali mu dve tlačidlá: Obnoviť, ktoré súbor vráti, a Vymazať, ktoré ho po otázke natrvalo odstráni.',
  'help.guide.files-trash.step.4':
    'Kliknite na Obnoviť. Zobrazí sa správa Súbor bol obnovený a riadok zmizne z koša, stále s poznámkou a prepojeniami.',
  'help.guide.files-trash.step.5':
    'Vyprázdniť kôš hore natrvalo odstráni všetko, čo tu ešte je, a prehliadač sa predtým raz opýta. Kôš prepne späť na súbory.',
  'help.guide.files-trash.result': 'Súbor je späť v zozname tam, kde bol, akoby sa nič nestalo.',
  'help.guide.files-trash.tip.1':
    'Vymazať pri riadku sa vopred nepýta, a práve na to slúži kôš: nič neopustí TREK, kým to tu nepotvrdíte.',
  'help.guide.files-trash.tip.2':
    'Vyhodenie súboru a jeho obnovenie vyžaduje oprávnenie mazať súbory. Člen bez neho nevidí ani Vymazať pri riadku, ani tlačidlá v koši.',
  'help.guide.files-trash.tip.3': 'Súbor natrvalo vymazaný v koši sa už nedá obnoviť.',

  // files-sync
  'help.guide.files-sync.title': 'Synchronizovať dokumenty s vaším úložiskom dokumentov',
  'help.guide.files-sync.goal':
    'Prepojte cestu s vlastným úložiskom dokumentov, aby sa to, čo sa nahrá sem, dostalo tam, a to, čo sa uloží tam, sa objavilo tu.',
  'help.guide.files-sync.step.1':
    'Kliknite na Synchronizácia dokumentov vedľa Kôš na pravom konci panela nástrojov. Otvorí sa dialóg s názvom cesty pod nadpisom. Vľavo pod Pripojiť poskytovateľa sú úložiská, ktoré zapol administrátor, každé s riadkom o tom, ako ukladá: Paperless-ngx a Papra podľa štítku, Nextcloud a Synology Drive do priečinka, OpenCloud do priestoru. Vpravo je Zatiaľ nič nepripojené.',
  'help.guide.files-sync.step.2':
    'Kliknite na svoje úložisko, tu Nextcloud. Otvorí sa menší dialóg pre pripojenie, pomenovaný podľa úložiska, ktorý žiada údaje, ktorými sa do daného úložiska prihlasujete.',
  'help.guide.files-sync.step.3':
    'Vyplňte Adresa a prihlasovacie údaje úložiska: API token pre Paperless-ngx, API kľúč a ID organizácie pre Papra, Používateľské meno a Heslo aplikácie pre Nextcloud, Používateľské meno a Token aplikácie pre OpenCloud a pre Synology Drive Používateľské meno, Heslo a, ak si ho účet vyžaduje, Dvojfaktorový kód. Všade, kde to úložisko ponúka, použite heslo alebo token aplikácie, nikdy nie heslo k účtu. Nextcloud a Synology Drive prijímajú aj voliteľný Základný priečinok, kde TREK hľadá priečinky ciest, tu /Reisen. Prijať vlastnoručne podpísaný certifikát dole je iba pre úložisko vo vašej vlastnej sieti s takýmto certifikátom.',
  'help.guide.files-sync.step.4':
    'Kliknite na Otestovať pripojenie. TREK sa pripojí k úložisku so zadanými údajmi a v päte sa zobrazí Spojenie funguje, prihlásený ako a za tým meno účtu. Odmietnuté prihlasovacie údaje alebo nedostupná adresa sa namiesto toho uvedú tam a v žiadnom prípade sa nič neuloží.',
  'help.guide.files-sync.step.5':
    'Kliknite na Pripojiť. Pripojenie sa uloží k ceste a TREK sa opýta, kde má cesta v úložisku bývať: štítok, priečinok alebo priestor, ktorý obsahuje jej dokumenty. Synchronizuje sa iba to, čo je v ňom. Vytvoriť nové ho vytvorí po kliknutí na Vytvoriť, s názvom predvyplneným z názvu cesty; pod Alebo použite existujúce sú tie, ktoré už existujú. Kliknite na jeden, tu priečinok Jeseň v Japonsku.',
  'help.guide.files-sync.step.6':
    'Dialóg je späť: vaše úložisko je vľavo pod Táto cesta a jeho karta vpravo uvádza, kam sa synchronizuje, kedy naposledy prebehla synchronizácia, a Synchronizovať teraz. Prvá synchronizácia sa spustí sama; Synchronizovať teraz ju spustí kedykoľvek. Po dokončení synchronizácie nahradí štítok Zatiaľ nesynchronizované vedľa názvu zelená bodka, ktorá po nabehnutí myšou ukáže Aktuálne, a ukazovateľ toku počíta dokumenty, ktoré má TREK a úložisko, s dráhami Do úložiska a Z úložiska medzi nimi. Zatvorte dialóg krížikom ×.',
  'help.guide.files-sync.result':
    'Dokumenty, ktoré tam už boli, sú navrchu zoznamu, nahraté pod vaším menom, a každý dokument cesty je aj v úložisku. Odteraz TREK kontroluje úložisko na pozadí a úložisko sleduje zoznam.',
  'help.guide.files-sync.tip.1':
    'Cestu môže prepojiť iba vlastník cesty alebo administrátor inštancie, pretože prihlasovacie údaje umožňujú prístup k celému účtu v úložisku. Každý člen môže otvoriť Synchronizácia dokumentov, čítať kartu a stlačiť Synchronizovať teraz.',
  'help.guide.files-sync.tip.2':
    'Úložisko vo vašej vlastnej sieti vyžaduje na serveri TREK ALLOW_INTERNAL_NETWORK=true a jeho adresa musí byť adresa počítača v sieti, nikdy nie localhost. Bez toho Otestovať pripojenie odpovie Táto adresa nie je povolená.',
  'help.guide.files-sync.tip.3':
    'Odpojiť na karte ukončí spárovanie a ponechá všetky dokumenty na oboch stranách. Štítok, priečinok alebo priestor prepojený druhýkrát sa považuje za nový a všetko v ňom sa načíta znova, takže po odpojení radšej prepojte prázdny namiesto starého.',
  // ── Screen: trip-collab ───────────────────────────────────────────────────────────────
  'help.ctx.trip-collab.title': 'Spolupráca',
  'help.ctx.trip-collab.summary':
    'Karta, na ktorej skupina plánuje spoločne: chat vľavo, zdieľané poznámky a odkazy vedľa neho, ankety pod nimi a Čo nás čaká na konci. Všetko, čo sa tu napíše, sa okamžite zobrazí na obrazovke každého ďalšieho člena bez opätovného načítania.',
  'help.ctx.trip-collab.bullet.1':
    'Chat je stĺpec vľavo. Píšte do poľa Napíšte správu… a stlačte Enter; Shift a Enter vytvoria nový riadok. Smajlík pridá emoji, Priložiť obrázky pripojí k správe až štyri obrázky.',
  'help.ctx.trip-collab.bullet.2':
    'Po nabehnutí myšou na správu sa zobrazí Odpovedať a pri vašich vlastných aj Vymazať; kliknutím pravým tlačidlom otvoríte osem rýchlych reakcií. Vymazaná správa zanechá jeden riadok s informáciou, že ste ju vymazali.',
  'help.ctx.trip-collab.bullet.3':
    'Poznámky sú spoločný zápisník: Nová poznámka jednu napíše a ozubené koliesko vedľa nej otvorí Spravovať kategórie pre ich názvy a farby. Karta má Rozbaliť, Pripnúť, Upraviť a Vymazať.',
  'help.ctx.trip-collab.bullet.4':
    'Odkazy zhromažďujú adresy, ktoré cesta potrebuje. Pridať odkaz prijme názov a adresu http alebo https; Upraviť odkaz, Pripnúť odkaz a Vymazať odkaz sú na konci čipu a pripnuté odkazy zostávajú vpredu.',
  'help.ctx.trip-collab.bullet.5':
    'Ankety rozhodujú. Nová anketa položí otázku s aspoň dvoma možnosťami; kliknutie na možnosť je váš hlas, Uzavrieť ukončí hlasovanie a Vymazať anketu odstráni.',
  'help.ctx.trip-collab.bullet.6':
    'Čo nás čaká uvádza zastávky cesty, ktoré sú ešte pred vami, najviac osem, s ich časmi a ľuďmi, ktorí sa na nich zúčastnia. Iba číta denný plán; časy sa nastavujú tam.',
  // write-note
  'help.guide.write-note.title': 'Napísať zdieľanú poznámku',
  'help.guide.write-note.goal':
    'Dajte to, čo potrebuje celá skupina, pravidlo, adresu, pripomienku, tam, kde to každý znova nájde.',
  'help.guide.write-note.step.1': 'Kliknite na Nová poznámka hore v paneli Poznámky. Otvorí sa formulár.',
  'help.guide.write-note.step.2':
    'Názov poznámky je názov, ktorý nesie karta. Je to jediné, čo formulár vyžaduje: Vytvoriť zostane sivé, kým v ňom niečo nie je.',
  'help.guide.write-note.step.3':
    'Veľké pole pod ním obsahuje text a podporuje Markdown: tučné slovo, zoznam, nadpis. Karta ukazuje prvých pár riadkov a Rozbaliť na nej otvorí celú poznámku.',
  'help.guide.write-note.step.4':
    'Pod Kategória vyberte tú, do ktorej poznámka patrí; jej farba sa stane farbou karty. Tlačidlá sú už existujúce kategórie a novú vytvoríte v Spravovať kategórie.',
  'help.guide.write-note.step.5':
    'Webová stránka prijme odkaz, ktorý patrí k poznámke. Karta potom nesie dlaždicu Odkaz, ktorá ho otvorí.',
  'help.guide.write-note.step.6': 'Kliknite na Vytvoriť.',
  'help.guide.write-note.result':
    'Poznámka je karta v paneli Poznámky vo farbe svojej kategórie a už je na obrazovke každého ďalšieho člena.',
  'help.guide.write-note.tip.1':
    'Pripnúť na karte ju drží navrchu panela; všetko pod ňou je zoradené podľa času poslednej zmeny.',
  'help.guide.write-note.tip.2':
    'Ozubené koliesko vedľa Nová poznámka otvorí Spravovať kategórie: tam kategória dostane farbu, premenuje sa všade naraz alebo sa pridá skôr, než ju použije akákoľvek poznámka.',
  'help.guide.write-note.tip.3':
    'Priložiť súbory pripojí k poznámke dokument. Priložiť otvorí výber súborov a obrázok alebo PDF môžete do formulára aj jednoducho vložiť.',
  'help.guide.write-note.tip.4':
    'Poznámky majú vlastný prepínač v Doplnky pod Spolupráca: administrátor ich môže vypnúť a chat, odkazy, ankety a Čo nás čaká nechať bežať.',
  // shared-links
  'help.guide.shared-links.title': 'Zhromaždiť odkazy cesty',
  'help.guide.shared-links.goal':
    'Majte rezervačný portál, zdieľaný album a cestovný poriadok na jednom mieste namiesto ich hľadania v chate.',
  'help.guide.shared-links.step.1': 'Kliknite na Pridať odkaz hore v paneli Odkazy.',
  'help.guide.shared-links.step.2':
    'Pomenujte odkaz v poli Názov odkazu, vložte adresu do poľa pod ním a potom kliknite na Uložiť odkaz.',
  'help.guide.shared-links.step.3':
    'Čip ukazuje názov a stránku, na ktorú odkazuje. Kliknutím naň sa stránka otvorí na novej karte.',
  'help.guide.shared-links.step.4':
    'Tri malé tlačidlá na jeho konci sú Upraviť odkaz, Pripnúť odkaz a Vymazať odkaz. Pripnúť odkaz presunie čip na začiatok panela; Vymazať odkaz sa na nič nepýta.',
  'help.guide.shared-links.result':
    'Odkaz je čip v paneli Odkazy, pripnutý vpredu, a je okamžite na obrazovke každého člena.',
  'help.guide.shared-links.tip.1':
    'Prijímajú sa iba adresy http a https; pole odmietne čokoľvek iné ešte pred uložením.',
  'help.guide.shared-links.tip.2':
    'Pripnuté odkazy sú prvé, potom najnovšie. Malá ikona vedľa názvu je favicon stránky načítaný priamo z nej, takže bez internetu čip namiesto nej ukáže obyčajný symbol odkazu.',
  'help.guide.shared-links.tip.3':
    'Odkazy majú vlastný prepínač v Doplnky pod Spolupráca, takže administrátor môže panel vypnúť bez zásahu do zvyšku karty.',
  // create-poll
  'help.guide.create-poll.title': 'Opýtať sa skupiny',
  'help.guide.create-poll.goal':
    'Premeňte otázku, na ktorú v chate nikto neodpovedá, na anketu, v ktorej môže hlasovať každý.',
  'help.guide.create-poll.step.1': 'Kliknite na Nová anketa hore v paneli Ankety.',
  'help.guide.create-poll.step.2':
    'Napíšte otázku. Podporuje Markdown pod poľom znamená, že tu funguje tučné slovo, zalomenie riadku alebo krátky zoznam.',
  'help.guide.create-poll.step.3': 'Vyplňte Možnosť 1 a Možnosť 2. Minimum sú dve vyplnené možnosti.',
  'help.guide.create-poll.step.4':
    '+ Pridať možnosť pridá tretiu, štvrtú, koľko potrebujete; malý krížik vedľa riadku ju znova odoberie.',
  'help.guide.create-poll.step.5':
    'Viac možností umožní každému zaškrtnúť viac ako jednu možnosť. Ak je vypnuté, hlas sa presunie, keď niekto vyberie niečo iné.',
  'help.guide.create-poll.step.6': 'Kliknite na Vytvoriť anketu.',
  'help.guide.create-poll.result': 'Anketa je navrchu panela Ankety, otvorená a zatiaľ bez hlasov.',
  'help.guide.create-poll.tip.1': 'Otázka sa vykresľuje ako Markdown; možnosti zostávajú obyčajným textom.',
  'help.guide.create-poll.tip.2':
    'Vytvoriť anketu zostane sivé, kým nie je zadaná otázka a aspoň dve vyplnené možnosti.',
  'help.guide.create-poll.tip.3':
    'Termín sa dá nastaviť iba v mobilnej aplikácii. Anketa, ktorá ho má, tu ukazuje zostávajúci čas v jantárovom čipe a po jeho uplynutí sa považuje za uzavretú.',
  'help.guide.create-poll.tip.4':
    'Ankety majú vlastný prepínač v Doplnky pod Spolupráca: administrátor ich môže vypnúť a ostatné štyri panely nechať bežať.',
  // vote-poll
  'help.guide.vote-poll.title': 'Hlasovať a prečítať výsledok',
  'help.guide.vote-poll.goal': 'Odovzdajte svoj hlas, pozrite sa, ako je na tom skupina, a zmeňte názor.',
  'help.guide.vote-poll.step.1': 'Kliknite na možnosť, ktorú chcete. Jej krúžok sa vyplní a pruh za ňou narastie.',
  'help.guide.vote-poll.step.2':
    'Teraz je čitateľný celý výsledok: pruh je podiel, percento je vpravo a malé krúžky sú ľudia, ktorí zvolili túto možnosť.',
  'help.guide.vote-poll.step.3':
    'Zmenili ste názor? Kliknite na inú možnosť. Pri ankete bez Viac možností sa váš hlas presunie namiesto toho, aby pribudol druhý.',
  'help.guide.vote-poll.step.4':
    'Pod otázkou je počet hlasov ankety. Kliknutím na možnosť, ktorú ste už zvolili, svoj hlas stiahnete a počítadlo opäť klesne.',
  'help.guide.vote-poll.result':
    'Váš hlas je pri jednej možnosti, pruhy ukazujú, ako je skupina rozdelená, a krúžky hovoria, kto čo zvolil.',
  'help.guide.vote-poll.tip.1':
    'Pruhy a percentá sa zobrazia až potom, čo sami zahlasujete, alebo keď je anketa uzavretá, aby nikoho neovplyvnil priebežný stav.',
  'help.guide.vote-poll.tip.2':
    'Hlas nie je nikdy anonymný: po nabehnutí myšou na jeden z krúžkov pri možnosti uvidíte meno.',
  // close-poll
  'help.guide.close-poll.title': 'Uzavrieť anketu alebo ju odstrániť',
  'help.guide.close-poll.goal':
    'Ukončite hlasovanie, keď sa skupina rozhodla, a odstráňte anketu, ktorú už nikto nepotrebuje.',
  'help.guide.close-poll.step.1': 'Uzavrieť, zámok v rohu ankety, ukončí hlasovanie. Na možnosti sa už nedá kliknúť.',
  'help.guide.close-poll.step.2':
    'Uzavretá anketa klesne pod nadpis Uzavreté na spodku panela, má štítok Uzavreté a ukazuje výsledok všetkým, či hlasovali alebo nie. Víťazná možnosť je zafarbená nazeleno.',
  'help.guide.close-poll.step.3':
    'Vymazať, kôš v tom istom rohu, anketu odstráni. Nič sa nepýta dvakrát a hlasy zmiznú s ňou.',
  'help.guide.close-poll.result':
    'Anketa zmizne z panela každého člena. Tá, ktorú ste iba uzavreli, zostane dole čitateľná aj s výsledkom.',
  'help.guide.close-poll.tip.1':
    'Uzavretie sa nedá vrátiť: opätovné otvorenie neexistuje. Omylom uzavretú anketu treba vytvoriť znova.',
  'help.guide.close-poll.tip.2': 'Vymazať odstráni anketu a všetky hlasy v nej pre všetkých, okamžite a bez otázky.',
  // whats-next
  'help.guide.whats-next.title': 'Čítať Čo nás čaká',
  'help.guide.whats-next.goal': 'Pozrite sa, čo skupina robí ďalej, bez otvárania plánu.',
  'help.guide.whats-next.step.1':
    'Panel uvádza zastávky cesty, ktoré sú ešte pred vami, najviac osem, v časovom poradí pod nadpisom pre každý deň: Dnes, Zajtra alebo dátum.',
  'help.guide.whats-next.step.2':
    'Vľavo v riadku je jeho čas: začiatok, do a koniec, ak ho zastávka má, alebo neurčené, ak ešte nemá nastavený čas.',
  'help.guide.whats-next.step.3':
    'Čipy pod názvom sú ľudia na tejto zastávke. Ak nie je nikto vybraný, uvedení sú všetci v ceste.',
  'help.guide.whats-next.result': 'Zoznam toho, čo príde, iba na čítanie: riadi sa plánom a nič tu ho nemení.',
  'help.guide.whats-next.tip.1':
    'Nič sa tu nenastavuje. Časy pochádzajú z denného plánu; zmeňte ich tam a tento zoznam sa okamžite prispôsobí.',
  'help.guide.whats-next.tip.2':
    'Uvedené je iba to, čo je ešte pred vami: zastávka, ktorej čas uplynul, vypadne a na konci cesty je panel prázdny.',
  'help.guide.whats-next.tip.3':
    'Čo nás čaká má vlastný prepínač v Doplnky pod Spolupráca a je to panel pre počítač: karta Spolupráca v mobilnej aplikácii ho neponúka.',
  // trip-chat
  'help.guide.trip-chat.title': 'Rozprávať sa so skupinou',
  'help.guide.trip-chat.goal':
    'Povedzte niečo, odpovedzte na konkrétnu správu, reagujte na inú a vezmite späť svoju vlastnú.',
  'help.guide.trip-chat.step.1':
    'Píšte do poľa Napíšte správu… a stlačte Enter. Modrá šípka vedľa poľa urobí to isté; Shift a Enter namiesto toho vytvoria nový riadok.',
  'help.guide.trip-chat.step.2':
    'Smajlík otvorí výber emoji so skupinami Smajlíky, Reakcie a Cestovanie. To, čo vyberiete, sa pridá k písanému textu, samo sa neodošle.',
  'help.guide.trip-chat.step.3':
    'Nabehnite myšou na správu niekoho iného: v jej rohu sa objaví malé okrúhle tlačidlo. To je Odpovedať.',
  'help.guide.trip-chat.step.4':
    'Správa, na ktorú odpovedáte, sa citovaná zobrazí nad poľom. Napíšte a odošlite a citát pôjde spolu s vašou bublinou; krížik na citáte ho znova odoberie.',
  'help.guide.trip-chat.step.5':
    'Kliknutím pravým tlačidlom na správu otvoríte osem rýchlych reakcií. Vaša sa zobrazí pod bublinou a druhé kliknutie na tú istú ju zruší.',
  'help.guide.trip-chat.step.6':
    'Vaše vlastné správy majú vedľa Odpovedať aj Vymazať. Odstráni správu a zanechá jeden riadok s informáciou, že ste ju vymazali: vrátiť sa to nedá.',
  'help.guide.trip-chat.result':
    'Vaša odpoveď je pod správou, ktorú cituje, reakcia visí na ďalšej a tá, ktorú ste vzali späť, zanechá jediný riadok, ktorý o tom hovorí.',
  'help.guide.trip-chat.tip.1':
    'Enter odošle, Shift a Enter vytvoria nový riadok. Správa, ktorá obsahuje iba emoji, sa zobrazí veľká.',
  'help.guide.trip-chat.tip.2':
    'Priložiť obrázky prijme až štyri obrázky na jednu správu; môžete ich aj jednoducho vložiť alebo pretiahnuť na pole.',
  'help.guide.trip-chat.tip.3':
    'Správa s odkazom dostane pod sebou kartu s náhľadom, ktorú načíta váš vlastný TREK, takže odkaz na niečo, k čomu máte prístup iba vy, zostane obyčajným odkazom.',
  'help.guide.trip-chat.tip.4':
    'Chat má vlastný prepínač v Doplnky pod Spolupráca: administrátor ho môže vypnúť a poznámky, odkazy, ankety a Čo nás čaká nechať bežať.',

  // ── Screen: trip-roadtrip ─────────────────────────────────────────────────────────────
  'help.ctx.trip-roadtrip.title': 'Cesta autom',
  'help.ctx.trip-roadtrip.summary':
    'Plán čítaný ako jedna jazda: tie isté dni a tie isté miesta, spojené do zastávok s jazdou medzi nimi, na osi v ľavom stĺpci a na mape. Ukazuje, ako ďaleko a ako dlho, kde dôjde palivo a čo je pozdĺž cesty.',
  'help.ctx.trip-roadtrip.bullet.1':
    'Dni a Cesta autom hore v ľavom stĺpci prepínajú medzi denným plánom a jazdou. Nič sa nekopíruje ani nemení: Dni vrátia plán presne taký, aký bol.',
  'help.ctx.trip-roadtrip.bullet.2':
    'Hlavička osi sčíta celú cestu: Vzdialenosť, Čas jazdy a Zastávky. Pod ňou je jedna karta na každý deň s kilometrami daného dňa, počtom zastávok, ktoré obsahuje, tým, čo prekračuje, a štítkom Stopa.',
  'help.ctx.trip-roadtrip.bullet.3':
    'Očíslovaná zastávka je cieľové miesto dňa. Zastávka po ceste, tankovanie, nabíjanie, odpočívadlo, má namiesto čísla ikonu svojho druhu a nepočíta sa. Kliknutím na číslo zmeníte, o ktorú ide, a kliknutím na štítok Pobyt určíte, ako dlho trvá.',
  'help.ctx.trip-roadtrip.bullet.4':
    'Medzi dvoma zastávkami ukazuje pás jazdy úsek ako vzdialenosť a čas. Kliknutím naň otvoríte Spôsoby, ako prejsť tento úsek, alebo kliknutím na vykreslenú trasu na mape úsek ohnete cez prejazdný bod.',
  'help.ctx.trip-roadtrip.bullet.5':
    'Pravý stĺpec sa zmení na Pozdĺž trasy: vyberte deň, čo hľadať a aký široký je koridor, potom Hľadať. Pridať zaradí nájdené miesto do jazdy v bode, kde sa okolo neho naozaj prechádza.',
  'help.ctx.trip-roadtrip.bullet.6':
    'Nastavenie jazdy pod ním obsahuje limity, auto a jeho dojazd, denné časy cestovania, čomu sa vyhnúť a ako sa kreslí čiara. Patria k ceste, takže všetci plánujú s tým istým autom.',
  // roadtrip-mode
  'help.guide.roadtrip-mode.title': 'Čítať cestu ako jednu jazdu',
  'help.guide.roadtrip-mode.goal': 'Prepnite plán do režimu cesty autom a prečítajte si, čo vám os hovorí.',
  'help.guide.roadtrip-mode.step.1':
    'Kliknite na Cesta autom v prepínači Dni a Cesta autom hore v ľavom stĺpci. Denný plán sa nahradí jazdou a mapa vykreslí každý deň, ktorý má vypočítanú trasu.',
  'help.guide.roadtrip-mode.step.2': 'Hlavička osi sčíta celú cestu: Vzdialenosť, Čas jazdy a Zastávky.',
  'help.guide.roadtrip-mode.step.3':
    'Pod ňou je jedna karta na každý deň. Jej hlavička uvádza číslo a dátum dňa, jazdu ako vzdialenosť a čas a počet zastávok, ktoré deň obsahuje.',
  'help.guide.roadtrip-mode.step.4':
    'Vnútri karty je deň reťazou: očíslovaná zastávka pre každé miesto, pás jazdy medzi každou dvojicou a čas príchodu na pravom okraji.',
  'help.guide.roadtrip-mode.step.5':
    'Kliknutím na hlavičku dňa ho zbalíte. Zbalený deň zmizne aj z mapy; opätovným kliknutím na hlavičku ho vrátite.',
  'help.guide.roadtrip-mode.result':
    'Ľavý stĺpec je jazda a mapa ukazuje každý jej deň. Dni prepnú priamo späť na plán, nezmenený.',
  'help.guide.roadtrip-mode.tip.1':
    'Voľba sa pamätá pre každú cestu, kým je karta prehliadača otvorená, takže po opätovnom načítaní sa vrátite k jazde.',
  'help.guide.roadtrip-mode.tip.2':
    'Prepínač existuje, až keď administrátor zapne doplnok Cesta autom v časti Doplnky v administrácii.',
  'help.guide.roadtrip-mode.tip.3':
    'V telefóne prepínač nie je: doplnok pridá vlastnú kartu Cesta autom vedľa karty Plán.',
  // roadtrip-stops
  'help.guide.roadtrip-stops.title': 'Zastávky po ceste a dĺžka pobytu',
  'help.guide.roadtrip-stops.goal':
    'Zmeňte miesto na trase na zastávku po ceste a určte, ako dlho trvá každá zastávka.',
  'help.guide.roadtrip-stops.step.1':
    'Kliknite na číslo pred zastávkou na osi. Jeho popis je Zmeniť na zastávku po ceste a otvorí Druh zastávky.',
  'help.guide.roadtrip-stops.step.2':
    'Vyberte druh: Ubytovanie, Palivo, Nabíjanie, Odpočívadlo, Kemp, Jedlo alebo Pamiatky. Číslo sa zmení na ikonu daného druhu a zastávky pod ním sa prečíslujú.',
  'help.guide.roadtrip-stops.step.3':
    'Zastávka po ceste nie je cieľ, takže hlavička dňa počíta o jednu zastávku menej.',
  'help.guide.roadtrip-stops.step.4':
    'Znova kliknite na ikonu, Zmeniť typ tejto zastávky, a vyberte Späť na cieľ, aby zastávka dostala svoje číslo späť.',
  'help.guide.roadtrip-stops.step.5': 'Každá zastávka má štítok Pobyt. Kliknutím naň otvoríte Čas na tejto zastávke.',
  'help.guide.roadtrip-stops.step.6':
    'Nastavte dĺžku posuvníkom, tlačidlami mínus a plus alebo jednou z predvolieb, sledujte, čo robia Príchod a Odchod, a potom kliknite na Uložiť.',
  'help.guide.roadtrip-stops.result':
    'Zastávka, ktorej ste nastavili čas, ho má na štítku Pobyt a každý nasledujúci príchod sa posunul s ňou, a tá, ktorú ste zmenili na druh a späť, je opäť očíslovaný cieľ.',
  'help.guide.roadtrip-stops.tip.1':
    'Pobyt patrí k miestu, nie k jednej návšteve: na mieste naplánovanom na dva dni sa zdržíte rovnako dlho v oba dni.',
  'help.guide.roadtrip-stops.tip.2':
    'Zastávky po ceste sa zobrazujú aj v Dni. Vypnutím Zobraziť aj v Dňoch v časti Servisné zastávky v Nastavenie jazdy zostanú iba v Cesta autom.',
  'help.guide.roadtrip-stops.tip.3': 'Bez pobytu v tom istom dialógu čas znova odoberie.',
  // roadtrip-corridor
  'help.guide.roadtrip-corridor.title': 'Nájsť palivo, jedlo a posteľ pozdĺž trasy',
  'help.guide.roadtrip-corridor.goal':
    'Hľadajte na ceste, ktorou naozaj jazdíte, a to, čo nájdete, zaraďte na správny úsek.',
  'help.guide.roadtrip-corridor.step.1': 'Vyberte deň hore v Pozdĺž trasy. Ponúkajú sa iba dni s vypočítanou trasou.',
  'help.guide.roadtrip-corridor.step.2':
    'Pod Hľadá sa zaškrtnite, čo potrebujete. Palivo, Nabíjanie, Odpočívadlo, Kemp, Ubytovanie, Jedlo a Pamiatky sa dajú kombinovať.',
  'help.guide.roadtrip-corridor.step.3':
    'Pod Do vyberte, ako ďaleko na obe strany cesty hľadať, 2 km, 5 km alebo 10 km, a potom kliknite na Hľadať.',
  'help.guide.roadtrip-corridor.step.4':
    'Výsledky sa vrátia zoskupené podľa druhu, v poradí, v akom okolo nich prechádzate, každý s údajom, ako ďaleko v rámci dňa leží a ako ďaleko je od trasy.',
  'help.guide.roadtrip-corridor.step.5':
    'Pridať pri výsledku otvorí Pridať ako zastávku. Uvádza, na ktorý deň a na ktorú pozíciu zastávka pripadne, pýta sa na druh a čas na zastávke a Pridať ju zaradí do jazdy.',
  'help.guide.roadtrip-corridor.result':
    'Výsledky sú zoradené v poradí, v akom okolo nich prechádzate, a vykreslené na mape a ten, ktorý ste pridali, je v jazde v bode, kde okolo neho naozaj prechádzate.',
  'help.guide.roadtrip-corridor.tip.1':
    'Nič sa nehľadá, kým nestlačíte Hľadať: jedno hľadanie znamená veľa požiadaviek na zdieľanú službu.',
  'help.guide.roadtrip-corridor.tip.2':
    'Filtrovať podľa názvu zúži výsledky bez nového dopytu a Vymazať výsledky vyprázdni zoznam aj jeho špendlíky. Kliknutím na výsledok ho zobrazíte na mape.',
  'help.guide.roadtrip-corridor.tip.3':
    'Výsledok môžete aj pretiahnuť z mapy na vykreslenú trasu, a tak si sami vybrať úsek tam, kde sa po tej istej ceste ide dvakrát. Pridať ručne vedľa Hľadať namiesto toho vyhľadá miesto podľa názvu.',
  // roadtrip-via
  'help.guide.roadtrip-via.title': 'Ohnúť úsek cez prejazdný bod',
  'help.guide.roadtrip-via.goal': 'Pošlite úsek po ceste, ktorú naozaj chcete, bez pridania zastávky.',
  'help.guide.roadtrip-via.step.1':
    'Zobrazte úsek, ktorý chcete: kliknite na zastávku na osi a potom zatvorte kartu, ktorá sa otvorí nad mapou.',
  'help.guide.roadtrip-via.step.2':
    'Kliknite na vykreslenú trasu. Na úsek, na ktorý ste klikli, sa umiestni prejazdný bod a trasa úseku sa cez neho prepočíta.',
  'help.guide.roadtrip-via.step.3':
    'Os sa prispôsobí: hlavička dňa ukazuje novú vzdialenosť a čas jazdy a každý príchod za prejazdným bodom sa posunie.',
  'help.guide.roadtrip-via.step.4':
    'Po nabehnutí myšou na úchyt sa zobrazí, čo dokáže: Potiahnutím zmeníte trasu, pravým tlačidlom odstránite. Potiahnite ho inam a úsek sa prekreslí cez nové miesto.',
  'help.guide.roadtrip-via.step.5':
    'Kliknutím pravým tlačidlom na úchyt ho odstránite. Úsek opäť vedie priamou cestou.',
  'help.guide.roadtrip-via.result':
    'Úsek vedie po ceste, ktorú ste zvolili, a vzdialenosť, čas jazdy a príchody dňa sa preň prepočítajú.',
  'help.guide.roadtrip-via.tip.1':
    'Prejazdný bod nie je zastávka: nemá číslo, pobyt ani čas príchodu a nepočíta sa do zastávok dňa.',
  'help.guide.roadtrip-via.tip.2':
    'Úchyty sa vykresľujú od úrovne priblíženia 9, takže mapa prispôsobená celej ceste ukazuje čiaru bez nich.',
  'help.guide.roadtrip-via.tip.3':
    'Kliknutie ďalej než dva kilometre od akéhokoľvek vykresleného úseku sa ignoruje, rovnako ako kliknutie na let, vlak alebo trajekt.',
  // roadtrip-alternatives
  'help.guide.roadtrip-alternatives.title': 'Skúsiť inú cestu pre úsek',
  'help.guide.roadtrip-alternatives.goal':
    'Pozrite sa, čo ďalšie ponúka plánovač trasy pre jeden úsek, a vyberte si to.',
  'help.guide.roadtrip-alternatives.step.1':
    'Kliknite na pás jazdy na osi, riadok medzi dvoma zastávkami, ktorý ukazuje úsek ako vzdialenosť a čas. Jeho popis je Iné cesty.',
  'help.guide.roadtrip-alternatives.step.2':
    'Nad mapou sa otvorí Spôsoby, ako prejsť tento úsek, jedna položka pre každú cestu, každá vykreslená na mape vlastnou farbou.',
  'help.guide.roadtrip-alternatives.step.3':
    'Nabehnite myšou na položku a daná cesta sa zvýrazní. Aktuálne je cesta, po ktorej sa ide, a Najrýchlejšie tá najrýchlejšia; ostatné uvádzajú, o koľko sú pomalšie alebo ktorej triede ciest sa vyhýbajú.',
  'help.guide.roadtrip-alternatives.step.4':
    'Kliknutím na položku pôjdete touto cestou, alebo kliknite na Uzavrieť, ak si chcete ponechať súčasnú.',
  'help.guide.roadtrip-alternatives.result':
    'Úsek vedie po ceste, ktorú ste zvolili, a vzdialenosť na osi aj nasledujúce príchody sa podľa toho zmenia.',
  'help.guide.roadtrip-alternatives.tip.1':
    'Výber inej cesty umiestni na úsek prejazdný bod a nahradí všetky, ktoré už mal; výber cesty, ktorú navrhol plánovač, ich znova odstráni.',
  'help.guide.roadtrip-alternatives.tip.2':
    'Bez diaľnice, Bez mýta a Bez trajektu pochádzajú z druhého výpočtového nástroja s vlastným modelom rýchlosti, takže ich časy nie sú porovnateľné s ostatnými.',
  // roadtrip-limits
  'help.guide.roadtrip-limits.title': 'Nastaviť auto a limity jazdy',
  'help.guide.roadtrip-limits.goal': 'Povedzte TREK, čím jazdíte a koľko ste ochotní odjazdiť naraz.',
  'help.guide.roadtrip-limits.step.1':
    'Nastavenie jazdy je pod vyhľadávaním v pravom stĺpci. Jeho štítky ukazujú, čo je nastavené; kliknutím ho otvoríte.',
  'help.guide.roadtrip-limits.step.2':
    'V časti Jazda sú Najdlhšia jazda naraz a Jazda za deň v minútach. Prázdne pole znamená vypnuté a nič sa neoznačuje.',
  'help.guide.roadtrip-limits.step.3':
    'V časti Vozidlo uveďte, čím jazdíte. Palivo tankuje iba na čerpacích zastávkach, Elektro iba na nabíjacích, Oboje na oboch.',
  'help.guide.roadtrip-limits.step.4':
    'Dojazd na jednu nádrž alebo Dojazd na jedno nabitie zadajte sami. Vypočítať z auta pod ním vezme Objem nádrže a Spotrebu, alebo Batériu a Spotrebu, a dojazd vypočíta.',
  'help.guide.roadtrip-limits.step.5':
    'Vyhnúť sa, ak je to možné je preferencia, nie zákaz: deň bez obchádzky danú cestu aj tak použije a uvedie to vo svojej hlavičke.',
  'help.guide.roadtrip-limits.step.6':
    'Zatvorte dialóg. Karta ukazuje, čo je nastavené, a os označí každý úsek a každý deň, ktorý limit prekračuje.',
  'help.guide.roadtrip-limits.result':
    'Štítky karty ukazujú, čo je nastavené, a každý úsek a deň nad limitom má na osi štítok.',
  'help.guide.roadtrip-limits.tip.1':
    'Nastavenia patria k ceste, takže všetci jej účastníci plánujú s tým istým autom a rovnakými limitmi.',
  'help.guide.roadtrip-limits.tip.2':
    'Natankovať na určuje, dokedy sa na zastávke tankuje alebo nabíja, pretože na cestách nikto nenabíja na 100 %. Čerpacia alebo nabíjacia zastávka to môže pre seba zmeniť.',
  'help.guide.roadtrip-limits.tip.3':
    'Čiara trasy určuje, ako sa jazda vykreslí: Prepojiť dni vypočíta trasu cez noc medzi dvoma dňami a Farba na každý deň dá každému dňu vlastnú farbu.',
  // roadtrip-day-window
  'help.guide.roadtrip-day-window.title': 'Nastaviť začiatok a koniec jazdného dňa',
  'help.guide.roadtrip-day-window.goal': 'Prestaňte jazdiť v hodinu, ktorú si zvolíte, a určte, kde má deň skončiť.',
  'help.guide.roadtrip-day-window.step.1': 'Otvorte Nastavenie jazdy v pravom stĺpci a nájdite Denné časy cestovania.',
  'help.guide.roadtrip-day-window.step.2':
    'Nastavte Čas začiatku dňa. Sám osebe nič nerobí: potrebné sú oba časy, ako uvádza poznámka pod nimi.',
  'help.guide.roadtrip-day-window.step.3':
    'Nastavte Čas konca dňa. Jazda sa teraz v túto hodinu zastaví a zvyšok presunie na nasledujúce ráno, ako riadok Koniec dňa a riadok Pokračovať v ceste na osi.',
  'help.guide.roadtrip-day-window.step.4':
    'V časti Ukončiť deň vyberte Pozdĺž trasy, ak chcete zastaviť na ceste v čase konca, alebo Na poslednom mieste, ak chcete zastaviť skôr, než by ho ďalšia jazda minula.',
  'help.guide.roadtrip-day-window.step.5': 'Zatvorte dialóg. Karta Nastavenie jazdy nesie oba časy ako štítok.',
  'help.guide.roadtrip-day-window.result':
    'Jazda je rozdelená na cestovné dni s nastavenou dĺžkou a všetko, čo sa nezmestí, pokračuje vo vypočítaných dňoch po poslednom. Vaše dni a ich miesta sa nemenia.',
  'help.guide.roadtrip-day-window.tip.1':
    'Vymazaním ktoréhokoľvek z časov sa celá funkcia opäť vypne. Časy, ktoré ste sami pevne nastavili pri zastávke, majú vždy prednosť.',
  'help.guide.roadtrip-day-window.tip.2':
    'Pri nastavených denných časoch cestovania sú dni vždy prepojené: jazda z poslednej zastávky jedného dňa na prvú zastávku ďalšieho sa vypočíta a započíta.',
  'help.guide.roadtrip-day-window.tip.3':
    'Každý koniec dňa je aj značkou na mape, mesiacom s číslom dňa. Potiahnite ho pozdĺž trasy alebo na miesto, ak chcete ukončiť deň inde; kliknutím pravým tlačidlom vrátite automatický koniec a Obnoviť automatické konce dní v tomto dialógu vráti všetko späť.',
  // roadtrip-refuel
  'help.guide.roadtrip-refuel.title': 'Natankovať skôr, než dôjde palivo',
  'help.guide.roadtrip-refuel.goal':
    'Nájdite miesto na tankovanie na úseku, kam auto ešte dôjde, a zaraďte ho do jazdy.',
  'help.guide.roadtrip-refuel.step.1':
    'Pri nastavenom dojazde os vykreslí cez úsek pás v mieste, kde palivo dôjde: Tu dôjde palivo a pod tým, ako ďaleko v úseku to je.',
  'help.guide.roadtrip-refuel.step.2':
    'Lampa na páse je tlačidlo. Nájsť palivo hľadá pozdĺž cesty, ktorú ste už prešli; počas hľadania je zobrazené Hľadá sa pozdĺž trasy…',
  'help.guide.roadtrip-refuel.step.3':
    'Vrátia sa najviac tri čerpacie stanice, každá s údajom, ako ďaleko je od trasy a koľko dojazdu by ešte zostalo v rezerve.',
  'help.guide.roadtrip-refuel.step.4':
    'Plus pri ponuke ju pridá ako zastávku na tankovanie. Pridať ako zastávku sa otvorí s už vyplneným druhom a časom a Pridať ju zaradí na úsek v bode, kde okolo nej naozaj prechádzate.',
  'help.guide.roadtrip-refuel.result':
    'Zastávka je na správnom úseku s vlastnou ikonou, dojazd sa od nej počíta znova a pás zmizol.',
  'help.guide.roadtrip-refuel.tip.1':
    'Dojazd sa počíta od poslednej čerpacej alebo nabíjacej zastávky, aj naprieč dňami. Čím jazdíte, rozhoduje o tom, ktoré zastávky sa počítajú: Palivo iba čerpacie, Elektro iba nabíjacie.',
  'help.guide.roadtrip-refuel.tip.2':
    'Hľadanie prezerá cestu pred bodom, kde dôjde palivo, ponecháva si rezervu a obchádzku počíta dvakrát, takže všetko, čo ponúkne, je naozaj dosiahnuteľné.',
  'help.guide.roadtrip-refuel.tip.3':
    'Prázdna odpoveď nie je slepá ulička: lampa sa zmení na Skúsiť znova, pretože vyhľadávanie miest je zdieľaná služba, ktorej niekedy vyprší časový limit.',
  // roadtrip-track
  'help.guide.roadtrip-track.title': 'Nechať deň sledovať importovanú stopu',
  'help.guide.roadtrip-track.goal':
    'Presmerujte jazdu dňa na malebnú trasu, ktorú ste importovali ako stopu GPX alebo KML.',
  'help.guide.roadtrip-track.step.1': 'Kliknite na štítok Stopa v hlavičke dňa. Dialóg sa otvorí pre tento deň.',
  'help.guide.roadtrip-track.step.2':
    'Vyberte stopu. Pri každej je uvedená jej dĺžka a či vedie pozdĺž tohto dňa, alebo ako ďaleko od neho leží, najbližšie navrchu.',
  'help.guide.roadtrip-track.step.3':
    'Kliknite na Sledovať túto stopu. TREK umiestni prejazdné body tam, kde sa jazda od stopy najviac odchyľuje, a trasu prepočíta, kolo za kolom.',
  'help.guide.roadtrip-track.step.4':
    'Uvedie, koľko prejazdných bodov umiestnil a ako blízko sa jazda teraz drží stopy. Tlačidlo pod tým tieto prejazdné body znova odstráni a vráti deň plánovaču trasy; zatvorením dialógu sa stopa ponechá.',
  'help.guide.roadtrip-track.result':
    'Jazda dňa sleduje stopu namiesto cesty, ktorú vybral plánovač trasy, a jej štítok Stopa svieti a po nabehnutí myšou ukáže názov stopy.',
  'help.guide.roadtrip-track.tip.1':
    'Importujte súbor v Dni cez Importovať súbor so zaškrtnutými trasami alebo stopami. Kým cesta žiadnu nemá, štítok nenesie žiadny deň.',
  'help.guide.roadtrip-track.tip.2':
    'Sledovanie stopy nahradí prejazdné body, ktoré úseky dňa už mali, takže úsek upravujte ručne až po stope, nie pred ňou.',
};

export default help;
