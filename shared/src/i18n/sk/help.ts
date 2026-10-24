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
  'help.center.thisScreen': 'Aktuálna',
  'help.center.subScreens': 'Podobrazovky: {count}',
  'help.center.subScreens.one': '{count} podobrazovka',
  'help.center.subScreens.few': '{count} podobrazovky',
  'help.center.subScreensLabel': 'Podobrazovky',
  'help.center.guidesCount': '{count} návodov',
  'help.center.guidesCount.one': '{count} návod',
  'help.center.guidesCount.few': '{count} návody',
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
  'help.center.steps': '{count} krokov',
  'help.center.steps.one': '{count} krok',
  'help.center.steps.few': '{count} kroky',
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
  'help.center.noContextHint': 'Prehľadajte dokumentáciu alebo nám napíšte, čo ste hľadali.',
  'help.center.feedback': 'Niečo vám tu chýba?',
  'help.center.feedbackLink': 'Napíšte nám na GitHub',
  'help.center.discord': 'Opýtajte sa na Discorde',
  'help.center.quick': 'Rýchle',
  'help.center.guide': 'Návod',
  'help.center.tour': 'Prehliadka',
  'help.center.imageAlt': 'Krok {n} návodu „{title}“',

  // ── Screen: dashboard ──────────────────────────────────────────────────────
  'help.ctx.dashboard.title': 'Prehľad',
  'help.ctx.dashboard.summary':
    'Prehľad zobrazuje všetky vaše cesty. Karta navrchu v štýle palubného lístka ukazuje cestu, ktorá práve prebieha alebo je najbližšie na rade. Riadok pod ňou sčíta, koľko ste doteraz precestovali, a karty uvádzajú každú cestu, ktorú plánujete, ktorú máte v archíve alebo ste už dokončili.',
  'help.ctx.dashboard.bullet.1':
    'Palubný lístok: prebiehajúca alebo najbližšia cesta s dátumami, spolucestujúcimi, miestami a odpočítavaním. Kliknutím cestu otvoríte. Štyri tlačidlá v jeho pravom hornom rohu cestu upravia, duplikujú, archivujú alebo vymažú.',
  'help.ctx.dashboard.bullet.2':
    'Cestovné štatistiky: navštívené krajiny, cesty, dni na cestách a nalietaná vzdialenosť zo všetkých vašich ciest.',
  'help.ctx.dashboard.bullet.3':
    'Karty ciest, filtrované podľa Plánované, Archivované a Dokončené, zobrazené ako mriežka alebo zoznam. Vyhľadávacie pole nad nimi prehľadáva všetky vaše cesty naraz, podľa názvu, dátumu alebo miesta v ceste. Tlačidlá na úpravu, duplikovanie, archiváciu a vymazanie cesty sú v pravom hornom rohu fotky na každej karte.',
  'help.ctx.dashboard.bullet.4':
    'Widgety vpravo: prevodník mien, Zbierky (keď je zapnutý doplnok Zbierky), svetové hodiny, nadchádzajúce rezervácie a widgety z doplnkov. Vstavané môžete vypnúť v Nastavenia, Vzhľad.',
  'help.ctx.dashboard.bullet.5': 'Novú cestu založíte kartou „Nová cesta“ aj tlačidlom v pravom dolnom rohu.',

  // create-trip
  'help.guide.create-trip.title': 'Vytvorenie cesty',
  'help.guide.create-trip.goal': 'Založte novú cestu s názvom, dátumami a úvodnou fotkou.',
  'help.guide.create-trip.step.1':
    'Kliknite na „Nová cesta“. Rovnako funguje karta na konci zoznamu vašich ciest aj tlačidlo v pravom dolnom rohu.',
  'help.guide.create-trip.step.2':
    'Zadajte názov cesty. Je to jediné povinné pole, všetko ostatné môžete doplniť neskôr.',
  'help.guide.create-trip.step.3':
    'Vyberte dátum začiatku a konca. TREK vytvorí jeden deň pre každý dátum, takže môžete začať plánovať itinerár. Zatiaľ bez dátumov? Nechajte obe polia prázdne a namiesto toho zadajte Počet dní.',
  'help.guide.create-trip.step.4':
    'Voliteľné: pridajte titulnú fotku. Nahrajte vlastnú, pretiahnite ju sem alebo vložte zo schránky, prípadne vyhľadajte cieľ cesty na Unsplash.',
  'help.guide.create-trip.step.5': 'Kliknite na Vytvoriť novú cestu.',
  'help.guide.create-trip.result':
    'Cesta sa zobrazí na vašom prehľade. Ak je to vaša najbližšia cesta, zobrazí sa na palubnom lístku navrchu.',
  'help.guide.create-trip.tip.1':
    'Dátumy môžete neskôr zmeniť. Ak už máte rezervácie, TREK sa opýta, či ich má posunúť spolu s dňami.',
  'help.guide.create-trip.tip.2':
    'Všetky náklady sa prepočítavajú na menu cesty, ktorú tu vyberiete. Zvoľte menu cieľovej krajiny.',

  // edit-trip
  'help.guide.edit-trip.title': 'Úprava cesty',
  'help.guide.edit-trip.goal': 'Premenujte cestu, zmeňte jej dátumy alebo upravte nastavenia.',
  'help.guide.edit-trip.step.1': 'Kliknite na ceruzku v pravom hornom rohu karty cesty (alebo palubného lístka).',
  'help.guide.edit-trip.step.2':
    'Zmeňte, čo potrebujete: názov, popis, dátumy, titulný obrázok, menu, pripomienku alebo spolucestujúcich.',
  'help.guide.edit-trip.step.3': 'Kliknite na „Aktualizovať“.',
  'help.guide.edit-trip.result': 'Karta sa okamžite aktualizuje pre všetkých členov cesty.',
  'help.guide.edit-trip.tip.1':
    'Ak posuniete začiatok cesty, ktorá má rezervácie, TREK sa opýta, či sa majú posunúť aj rezervácie. Pri skrátení cesty zobrazí dni, ktoré zaniknú, a čo je v nich naplánované. Uloží sa až po kliknutí na Odobrať dni a uložiť.',

  // cover-image
  'help.guide.cover-image.title': 'Nastavenie titulnej fotky',
  'help.guide.cover-image.goal': 'Dajte ceste obrázok, ktorý sa zobrazí na jej karte aj na palubnom lístku.',
  'help.guide.cover-image.step.1': 'Formulár na úpravu cesty otvoríte ceruzkou na jej karte.',
  'help.guide.cover-image.step.2':
    'Pod Úvodný obrázok pustite alebo vložte fotku, kliknutím nahrajte súbor, alebo zadajte cieľ a kliknite na Hľadať na Unsplash.',
  'help.guide.cover-image.step.3': 'Vyberte fotku a kliknite na Aktualizovať.',
  'help.guide.cover-image.result': 'Fotka sa uloží spolu s cestou a zobrazí sa všade, kde je cesta uvedená.',
  'help.guide.cover-image.tip.1':
    'Pri fotkách z vyhľadávania Unsplash sa autor uvedie automaticky. Fotky, ktoré nahráte sami, zostávajú na vašom serveri.',

  // duplicate-trip
  'help.guide.duplicate-trip.title': 'Duplikovanie cesty',
  'help.guide.duplicate-trip.goal': 'Použite existujúcu cestu ako šablónu pre novú.',
  'help.guide.duplicate-trip.step.1': 'Kliknite na ikonu duplikovania v pravom hornom rohu karty.',
  'help.guide.duplicate-trip.step.2': 'Prečítajte si, čo sa skopíruje a čo nie, a kliknite na „Kopírovať cestu“.',
  'help.guide.duplicate-trip.result':
    'Kópia sa zobrazí na vašom prehľade. Má názov originálu a za ním (kópia). Môžete ju premenovať a zmeniť jej dátumy.',
  'help.guide.duplicate-trip.tip.1':
    'Skopírujú sa dni, miesta, túry a trasy road tripov, rezervácie, položky rozpočtu, zoznamy vecí na balenie, úlohy a poznámky ku dňom. Zoznamy vecí a úlohy sa skopírujú bez odškrtnutia. Členovia, čet, ankety, súbory a zdieľané odkazy sa neskopírujú.',

  // archive-trip
  'help.guide.archive-trip.title': 'Archivácia a obnovenie cesty',
  'help.guide.archive-trip.goal': 'Presuňte cestu zo zoznamu ciest bez vymazania a neskôr ju obnovte.',
  'help.guide.archive-trip.step.1': 'Kliknite na ikonu archivácie v pravom hornom rohu karty.',
  'help.guide.archive-trip.step.2': 'Ak ju chcete znova vidieť, prepnite filter nad kartami na Archivované.',
  'help.guide.archive-trip.step.3':
    'Kliknutím na „Obnoviť“ na karte vrátite cestu medzi „Plánované“, alebo medzi „Dokončené“, ak jej dátumy už uplynuli.',
  'help.guide.archive-trip.result':
    'Archivované cesty si ponechajú všetky údaje. Už sa však nezobrazujú na prehľade ani v kalendárovom kanáli všetkých ciest.',

  // delete-trip
  'help.guide.delete-trip.title': 'Vymazanie cesty',
  'help.guide.delete-trip.goal': 'Odstráňte cestu natrvalo.',
  'help.guide.delete-trip.step.1': 'Kliknite na ikonu koša v pravom hornom rohu karty.',
  'help.guide.delete-trip.step.2': 'Potvrďte cez Vymazať. Dialóg uvádza názov cesty, takže viete, že mažete správnu.',
  'help.guide.delete-trip.result':
    'Cesta, jej dni, miesta, rezervácie a súbory sa vymažú. Nedá sa to vrátiť späť, preto ju radšej archivujte, ak si nie ste istí.',

  // filter-and-view
  'help.guide.filter-and-view.title': 'Hľadanie dokončených ciest, prepínanie medzi mriežkou a zoznamom',
  'help.guide.filter-and-view.goal':
    'Zobrazte dokončené alebo archivované cesty a vyberte si rozloženie, ktoré vám vyhovuje.',
  'help.guide.filter-and-view.step.1':
    'Použite Plánované, Archivované a Dokončené nad kartami. Dokončené sú všetky cesty, ktorých dátum konca už uplynul.',
  'help.guide.filter-and-view.step.2':
    'Kliknutím na ikonu zoznamu prepnete na kompaktný zoznam. Ďalším kliknutím sa vrátite k mriežke.',
  'help.guide.filter-and-view.result': 'Prehľad si rozloženie na tomto zariadení zapamätá.',

  // calendar-feed
  'help.guide.calendar-feed.title': 'Odber všetkých ciest v kalendári',
  'help.guide.calendar-feed.goal':
    'Majte dni a rezervácie všetkých aktívnych ciest vo svojej kalendárovej aplikácii, stále synchronizované.',
  'help.guide.calendar-feed.step.1': 'Kliknite na ikonu kalendára vedľa prepínača zobrazenia.',
  'help.guide.calendar-feed.step.2': 'Kliknite na Zapnúť odber kalendára. TREK vytvorí súkromný odkaz na kanál.',
  'help.guide.calendar-feed.step.3':
    'Kliknite na „Pridať do Kalendára Google“ alebo „Pridať do Kalendára Apple / Outlooku“. Pri inej kalendárovej aplikácii otvorte „Alebo skopírujte odkaz ručne“ a odkaz skopírujte odtiaľ.',
  'help.guide.calendar-feed.result':
    'Každá aktívna cesta sa zobrazí vo vašom kalendári a sama sa aktualizuje. Archivované cesty a cesty, ktoré skončili pred viac ako 90 dňami, v ňom nie sú.',
  'help.guide.calendar-feed.tip.1':
    'Odkaz držte v tajnosti: kto ho má, môže kanál čítať. Ak sa dostal k iným ľuďom, Vygenerovať znova vám vytvorí nový odkaz a starý prestane fungovať. Vypnúť odkaz úplne odstráni.',

  // widgets
  'help.guide.widgets.title': 'Výber widgetov na prehľade',
  'help.guide.widgets.goal': 'Zobrazte alebo skryte riadok so štatistikami a widgety vpravo.',
  'help.guide.widgets.step.1': 'V pravom hornom rohu otvorte ponuku pod svojím avatarom a vyberte „Nastavenia“.',
  'help.guide.widgets.step.2': 'Prepnite na záložku „Vzhľad“.',
  'help.guide.widgets.step.3':
    'Pod Widgety na prehľade zapnite alebo vypnite každý widget zvlášť pre Počítač a Mobil. Pravý bočný panel vypne celý pravý stĺpec naraz.',
  'help.guide.widgets.step.4': 'Vráťte sa na prehľad. Zmena sa prejaví okamžite.',
  'help.guide.widgets.result':
    'Keď widgety skryjete, vaše cesty dostanú viac miesta. Ak vypnete celý pravý bočný panel, rozloženie sa vycentruje.',
  'help.guide.widgets.link': 'Otvoriť nastavenia vzhľadu',

  // currency-widget
  'help.guide.currency-widget.title': 'Prevod mien',
  'help.guide.currency-widget.goal': 'Prevádzajte sumu medzi dvoma menami podľa aktuálnych kurzov.',
  'help.guide.currency-widget.step.1': 'Zadajte sumu a vyberte obe meny.',
  'help.guide.currency-widget.step.2': 'Šípka medzi nimi meny vymení, kruhová šípka obnoví kurz.',
  'help.guide.currency-widget.result': 'Váš menový pár sa ukladá k účtu, takže je rovnaký na každom zariadení.',
  'help.guide.currency-widget.tip.1':
    'Kurzy pochádzajú z bezplatnej služby Frankfurter. Kruhová šípka v rohu widgetu načíta tie najnovšie.',

  // timezones-widget
  'help.guide.timezones-widget.title': 'Pridanie svetových hodín',
  'help.guide.timezones-widget.goal': 'Majte prehľad o miestnom čase vo svojich destináciách.',
  'help.guide.timezones-widget.step.1':
    'Vo widgete Časové pásma kliknite na +, vyhľadajte mesto, napríklad Lisabon, a vyberte ho zo zoznamu.',
  'help.guide.timezones-widget.step.2':
    'Hodiny odstránite tak, že na ne nabehnete myšou a kliknete na ×, ktoré sa objaví vpravo.',
  'help.guide.timezones-widget.result': 'Vaše hodiny sa ukladajú k vášmu účtu.',
  'help.guide.search-trips.title': 'Vyhľadávanie ciest',
  'help.guide.search-trips.goal':
    'Nájdite cestu podľa názvu, dátumu alebo miesta, ktoré ste v nej naplánovali, aj medzi archivovanými.',
  'help.guide.search-trips.step.1':
    'Píšte do poľa „Hľadať výlety alebo miesta“ nad kartami. Zoznam sa filtruje už počas písania, a to naraz v naplánovaných, archivovaných aj dokončených cestách.',
  'help.guide.search-trips.step.2':
    'Ak cesta vyhovuje vyhľadávaniu kvôli niektorému zo svojich miest, toto miesto sa zobrazí pod názvom cesty. Kliknutím na x v poli alebo stlačením Escape znova uvidíte všetky svoje cesty.',
  'help.guide.search-trips.result':
    'Prehľad zobrazuje len cesty, ktoré zodpovedajú hľadaniu. Ak pole vyhľadávania vymažete, zobrazia sa znova všetky cesty.',
  'help.guide.search-trips.tip.1':
    'Hľadať môžete aj podľa dátumu: zadajte mesiac a rok, napríklad máj 2027, alebo 2027-05 a nájdete cesty z tohto mesiaca.',
  'help.guide.search-trips.tip.2':
    'Kým je vyhľadávanie aktívne, prepínač Plánované, Archivované a Dokončené sa nepoužije, takže žiadnu cestu neskryje nesprávny filter.',

  // ── Screen: vacay ──────────────────────────────────────────────────────────
  'help.ctx.vacay.title': 'Dovolenka (Vacay)',
  'help.ctx.vacay.summary':
    'Dovolenka (Vacay) je váš osobný plánovač voľna: koľko dní dovolenky máte na rok, ktoré ste si už zapísali a koľko vám zostáva. Mriežka ukazuje celý rok. V bočnom paneli nájdete výber roka, ľudí, s ktorými plánujete, kalendáre zdieľané s vami, legendu a váš nárok.',
  'help.ctx.vacay.bullet.1':
    'Ročná mriežka: dvanásť kariet mesiacov, jedna bunka na každý deň. Kliknutím na deň ho zapíšete alebo zrušíte. Malá modrá bodka označuje dni, na ktoré už pripadá nejaká cesta.',
  'help.ctx.vacay.bullet.2':
    'Panel nástrojov dole: prvé tlačidlo s vaším menom a farbou zapisuje dovolenku. Firemné voľno označuje dni, keď má voľno celá firma. Pol dňa a Náhradné / pružné voľno menia, čo kliknutie zapíše, a Pol dňa funguje aj pri firemnom voľne.',
  'help.ctx.vacay.bullet.3':
    'Nárok: Dní, Použitý a Zostáva pre vybraný rok, vedľa nich prenos z minulého roka a náhradné / pružné voľno. Kliknutím na nadpis karty ju zbalíte.',
  'help.ctx.vacay.bullet.4':
    'Osoby sú ľudia, ktorí s vami zdieľajú plán, každý vo vlastnej farbe. Zdieľané kalendáre zobrazujú voľné dni iných ľudí ako farebné krúžky. Upravovať ich nemôžete.',
  'help.ctx.vacay.bullet.5':
    'V nastaveniach sú víkendy, začiatok týždňa, prenos dovolenky, váš dovolenkový rok, firemné voľno, kalendáre štátnych sviatkov a školských prázdnin a pri spoločnom plánovaní aj „Zrušiť prepojenie“.',

  // log-day
  'help.guide.log-day.title': 'Zapísanie dňa dovolenky',
  'help.guide.log-day.goal': 'Označte si v ročnej mriežke voľný deň a sledujte, ako sa mení váš zostatok.',
  'help.guide.log-day.step.1':
    'Pozrite sa na prvé tlačidlo na paneli nástrojov dole. Ak ukazuje vaše meno a farbu, kliknutím na deň zapíšete dovolenku pre seba.',
  'help.guide.log-day.step.2':
    'Kliknite na deň v ľubovoľnej karte mesiaca. Deň sa vyplní vašou farbou a Použité sa zvýši o jeden deň.',
  'help.guide.log-day.step.3': 'Opätovným kliknutím na ten istý deň ho zrušíte.',
  'help.guide.log-day.result':
    'Deň je zapísaný. „Dni“, „Použité“ a „Zostáva“ sa hneď aktualizujú a zmenu okamžite vidí každý, kto je prepojený s vaším plánom.',
  'help.guide.log-day.tip.1':
    'Pokiaľ je v Nastavenia zapnuté Blokovať víkendy, víkend sa zapísať nedá. Víkendový deň, ktorý ste zapísali predtým, môžete stále vymazať.',
  'help.guide.log-day.tip.2':
    'Modrá bodka v bunke znamená, že na daný deň pripadá niektorá z vašich ciest. Hneď tak vidíte, kde sa voľno a cestovanie stretávajú.',

  // half-day
  'help.guide.half-day.title': 'Zapísanie polovice dňa',
  'help.guide.half-day.goal': 'Vezmite si voľné popoludnie a minite len pol dňa svojho nároku.',
  'help.guide.half-day.step.1':
    'Na paneli nástrojov zapnite „Pol dňa“. Oranžová bodka označuje v mriežke polovičný deň.',
  'help.guide.half-day.step.2': 'Kliknite na deň. Zapíše sa ako 0,5 a v rohu sa zobrazí oranžová bodka.',
  'help.guide.half-day.step.3':
    'Keď skončíte, Pol dňa znova vypnite. Ak kliknete na polovičný deň s inými nastaveniami, zmení sa podľa aktuálnych nastavení.',
  'help.guide.half-day.result':
    '„Použité“ sa zvýši o 0,5. „Pol dňa“ a „Náhradné / pružné voľno“ sú od seba nezávislé, takže si môžete zapísať aj pol dňa náhradného voľna.',
  'help.guide.half-day.tip.1':
    'Panel nástrojov vždy ukazuje značku, ktorú umiestni vaše ďalšie kliknutie, takže si ju pred zápisom môžete skontrolovať.',

  // comp-day
  'help.guide.comp-day.title': 'Zapísanie náhradného alebo pružného voľna',
  'help.guide.comp-day.goal': 'Vezmite si náhradné voľno bez toho, aby ste míňali dni dovolenky.',
  'help.guide.comp-day.step.1':
    'Na paneli nástrojov zapnite „Náhradné / pružné voľno“. Šrafovaný kruh označuje v mriežke deň náhradného voľna.',
  'help.guide.comp-day.step.2':
    'Kliknite na deň. Namiesto plnej farby sa vyplní diagonálnym šrafovaním vo vašej farbe.',
  'help.guide.comp-day.result': 'Dni náhradného voľna sa počítajú vedľa dlaždíc nároku a nikdy neznižujú Zostáva.',
  'help.guide.comp-day.tip.1':
    'Použite ho na nadčasy čerpané ako voľno, pružný pracovný čas alebo náhradný deň: na akékoľvek voľno, ktoré nie je dovolenka.',

  // entitlement
  'help.guide.entitlement.title': 'Nastavenie nároku',
  'help.guide.entitlement.goal': 'Nastavte vo Vacay, koľko dní dovolenky máte v roku.',
  'help.guide.entitlement.step.1':
    'V karte „Nárok“ v bočnom paneli kliknite vo svojom riadku na dlaždicu „Dní“. Ak je karta zbalená, rozbaľte ju kliknutím na nadpis.',
  'help.guide.entitlement.step.2':
    'Zadajte počet svojich dní a stlačte Enter. Klávesom Escape ponecháte pôvodnú hodnotu.',
  'help.guide.entitlement.result':
    'Zostáva sa prepočíta z vášho nároku, prípadného prenosu a dní, ktoré ste už využili.',
  'help.guide.entitlement.tip.1': 'Každý rok má vlastný nárok, preto sa zmena tu týka iba vybraného roka.',

  // years
  'help.guide.years.title': 'Pridanie a prepínanie rokov',
  'help.guide.years.goal': 'Naplánujte si budúci rok už teraz alebo sa pozrite na minulý.',
  'help.guide.years.step.1':
    'Kliknutím na + vpravo od roka pridáte nasledujúci rok, kliknutím na + vľavo predchádzajúci.',
  'help.guide.years.step.2': 'Medzi rokmi prepínate šípkami alebo štítkami rokov pod nimi.',
  'help.guide.years.step.3':
    'Ak chcete rok odstrániť, ukážte na jeho čip a kliknite na malé mínus. Tým sa vymažú aj všetky jeho záznamy, preto potvrdzujte opatrne.',
  'help.guide.years.result': 'Každý rok má vlastný nárok a vlastné záznamy. Prenos dní spája jeden rok s ďalším.',

  // company-holidays
  'help.guide.company-holidays.title': 'Označiť firemné voľno',
  'help.guide.company-holidays.goal':
    'Zablokujte dni, keď má voľno celá firma, bez toho, aby sa komukoľvek odčítali dni z nároku.',
  'help.guide.company-holidays.step.1':
    'Otvorte Nastavenia a skontrolujte, či sú Firemné voľná zapnuté. Predvolene sú zapnuté. Panel nástrojov ukazuje tento režim, len kým je zapnutý.',
  'help.guide.company-holidays.step.2': 'Späť v mriežke prepnite panel nástrojov na Firemné voľno.',
  'help.guide.company-holidays.step.3':
    'Kliknite na dni. Zafarbia sa na jantárovo a objavia sa v legende. Ďalším kliknutím deň znova zrušíte.',
  'help.guide.company-holidays.result':
    'Firemné voľno vidí každý, kto je prepojený s plánom, a nikdy neuberá z hodnoty „Zostáva“.',
  'help.guide.company-holidays.tip.1':
    'Firemné voľno môže upravovať ktokoľvek z prepojených ľudí, preto sa dohodnite, kto ho bude spravovať.',

  // public-holidays
  'help.guide.public-holidays.title': 'Zobrazenie štátnych sviatkov',
  'help.guide.public-holidays.goal': 'Zobrazte v mriežke štátne sviatky svojej krajiny alebo regiónu.',
  'help.guide.public-holidays.step.1': 'Otvorte Nastavenia a zapnite „Štátne sviatky“.',
  'help.guide.public-holidays.step.2':
    'Kliknite na Pridať kalendár, vyberte krajinu a podľa potreby aj región. Môžete mu dať aj farbu a popis. Potom kliknite na Pridať.',
  'help.guide.public-holidays.step.3': 'Zatvorte Nastavenia. Sviatky sa zobrazia v mriežke aj v legende.',
  'help.guide.public-holidays.result':
    'Štátne sviatky sú označené farbou kalendára a nikdy sa nezapočítavajú do vášho nároku.',
  'help.guide.public-holidays.tip.1':
    'Kalendárov môžete pridať viac, napríklad pre svoj región a pre región prepojeného kolegu.',

  // school-holidays
  'help.guide.school-holidays.title': 'Zobrazenie školských prázdnin',
  'help.guide.school-holidays.goal': 'Zobrazte si školské prázdniny vo svojom regióne vedľa vlastných voľných dní.',
  'help.guide.school-holidays.step.1': 'Otvorte Nastavenia a zapnite Školské prázdniny.',
  'help.guide.school-holidays.step.2':
    'Kliknite na „Pridať kalendár“ a vyberte krajinu. Ak má krajina kalendár rozdelený, vyberte aj región alebo skupinu a potom kliknite na „Pridať“.',
  'help.guide.school-holidays.step.3':
    'Zatvorte Nastavenia. Školské prázdniny sú v kalendári zafarbené farbou kalendára a ich dni majú dole farebný pruh.',
  'help.guide.school-holidays.result': 'Školské prázdniny sa zobrazujú iba v kalendári: nikomu nikdy neznižujú nárok.',
  'help.guide.school-holidays.tip.1':
    'Chýba váš región? Správca môže školské prázdniny spravovať ručne v časti Správca, Personalizácia, Školské prázdniny.',

  // weekends
  'help.guide.weekends.title': 'Blokovanie víkendov a nastavenie začiatku týždňa',
  'help.guide.weekends.goal': 'Nezapočítavajte víkendy a nechajte týždeň začínať dňom, ktorý vám vyhovuje.',
  'help.guide.weekends.step.1': 'Otvorte „Nastavenia“.',
  'help.guide.weekends.step.2':
    'Zapnite Blokovať víkendy a potom pod Víkendové dni vyberte dni, ktoré sa u vás počítajú ako víkend.',
  'help.guide.weekends.step.3': 'Pod Týždeň začína vyberte Po alebo Ne.',
  'help.guide.weekends.result': 'Blokované dni sú v mriežke sivé a nedajú sa zapísať omylom.',

  // leave-year
  'help.guide.leave-year.title': 'Nastavenie dovolenkového roka',
  'help.guide.leave-year.goal': 'Počítajte nárok za fiškálny rok alebo od dátumu nástupu, nie od januára do decembra.',
  'help.guide.leave-year.step.1': 'Otvorte Nastavenia a nájdite Dovolenkový rok.',
  'help.guide.leave-year.step.2':
    'Vyberte Kalendár, Fiškálny (s mesiacom a dňom začiatku) alebo Dátum nástupu (s dátumom, kedy ste nastúpili).',
  'help.guide.leave-year.result':
    'Nárok, čerpané dni a prenesená dovolenka sa počítajú za toto obdobie a mriežka začína jeho prvým mesiacom.',
  'help.guide.leave-year.tip.1':
    'Toto nastavenie je osobné: v prepojenom pláne má každý vlastný dovolenkový rok a vlastné čísla.',

  // carry-over
  'help.guide.carry-over.title': 'Prenos nevyčerpaných dní',
  'help.guide.carry-over.goal': 'Pripočítajte to, čo zostane na konci obdobia, k nasledujúcemu obdobiu.',
  'help.guide.carry-over.step.1': 'Otvorte Nastavenia.',
  'help.guide.carry-over.step.2': 'Zapnite Prevod dovolenky.',
  'help.guide.carry-over.result':
    'Prevedený počet dní sa prepočíta naprieč všetkými vašimi rokmi a zobrazí sa pod nárokom.',
  'help.guide.carry-over.tip.1': 'Po vypnutí sa všetky zostatky prenesenej dovolenky vynulujú.',

  // invite
  'help.guide.invite.title': 'Spoločné plánovanie',
  'help.guide.invite.goal':
    'Prepojte svoj plán s plánom iného používateľa TREK, aby ste obaja videli svoje voľné dni v jednej mriežke.',
  'help.guide.invite.step.1': 'Kliknite na ikonu osoby v karte Osoby.',
  'help.guide.invite.step.2': 'Vyberte používateľa a kliknite na Odoslať pozvánku.',
  'help.guide.invite.step.3':
    'Pri ďalšom otvorení Dovolenky (Vacay) dostane pozvaná osoba oznámenie a žiadosť o prepojenie. Dovtedy je pozvánka označená ako čakajúca; ak ju chcete zrušiť, prejdite na ňu myšou.',
  'help.guide.invite.result':
    'Oba plány sa zlúčia: každý má svoju farbu, môžete si navzájom zapisovať dni a všetko sa synchronizuje naživo.',
  'help.guide.invite.tip.1':
    'Prepojenie zrušíte kliknutím na Oddeliť v Nastavenia. Záznamy všetkých sa vrátia do ich vlastných plánov.',
  'help.guide.invite.tip.2':
    'Ak má druhá osoba vaše dni iba vidieť, namiesto zlúčenia jej radšej zdieľajte svoj kalendár.',

  // share-calendar
  'help.guide.share-calendar.title': 'Zdieľanie kalendára len na čítanie',
  'help.guide.share-calendar.goal': 'Dovoľte niekomu vidieť, kedy máte voľno, bez toho, aby mohol meniť váš plán.',
  'help.guide.share-calendar.step.1': 'Kliknite na ikonu zdieľania v karte Zdieľané kalendáre.',
  'help.guide.share-calendar.step.2': 'Vyberte používateľa a kliknite na „Zdieľať“. Nemusí nič prijímať.',
  'help.guide.share-calendar.step.3':
    'Kalendáre zdieľané s vami sú navrchu karty: kliknutím na kalendár ho skryjete alebo zobrazíte, alebo naň ukážte a kliknutím na x ho odstránite. Pod Zdieľate s ukážte na meno a kliknite na Zastaviť zdieľanie.',
  'help.guide.share-calendar.result':
    'Vaše voľné dni sa v jeho mriežke zobrazia ako farebný krúžok. To, čo zdieľate, nemôže nijako upravovať.',
  'help.guide.share-calendar.tip.1':
    'Zdieľanie a prepojenie sú nezávislé: môžete byť prepojení s jedným človekom a zdieľať kalendár s inými.',
  'help.guide.share-calendar.tip.2': 'Keď prejdete myšou nad deň s krúžkom, uvidíte, kto má voľno a ako dlho.',

  // ── Screen: atlas ──────────────────────────────────────────────────────────
  'help.ctx.atlas.title': 'Atlas',
  'help.ctx.atlas.summary':
    'Atlas ukazuje na mape sveta, kde ste cestovali: každá krajina, do ktorej vás zaviedla nejaká cesta, je vyfarbená a krajiny, ktoré ste navštívili skôr, než ste začali používať TREK, môžete pridať ručne. Priblížením uvidíte regióny, vediete si zoznam prianí miest, ktoré chcete ešte vidieť, a svoje čísla nájdete v sklenenom paneli dole.',
  'help.ctx.atlas.bullet.1':
    'Mapa: každá navštívená krajina má vlastnú stálu farbu, plánované krajiny majú prerušovaný obrys, krajiny zo zoznamu prianí šikmé šrafovanie a všetky ostatné sú sivé. Keď nad krajinu prejdete myšou, uvidíte jej cesty, miesta a prvú aj poslednú návštevu.',
  'help.ctx.atlas.bullet.2':
    'Hľadať navrchu: zadajte krajinu alebo miesto. Krajina, v ktorej ste ešte neboli, otvorí svoje vyskakovacie okno. Pri krajine, v ktorej ste boli, sa v paneli zobrazí jej karta. Ak vyberiete miesto, mapa otvorí jeho región, aby ste ho mohli označiť.',
  'help.ctx.atlas.bullet.3':
    '„Zobraziť plánované krajiny“ vpravo hore: zobrazí krajiny vašich nadchádzajúcich ciest. Prepínač sa ukáže, len keď nejaké máte.',
  'help.ctx.atlas.bullet.4':
    'Panel dole: karta „Štatistiky“ s krajinami (vedľa nich plánované), regiónmi, cestami, miestami, mestami, dňami, kontinentmi, vašou sériou a cestami tohto roka; karta „Bucket List“ s miestami, ktoré chcete ešte navštíviť; s doplnkom Túry aj karta „Túry“ so vzdialenosťou a prevýšením túr, ktoré ste absolvovali.',
  'help.ctx.atlas.bullet.5':
    'Regióny: keď mapu pritiahnete bližšie, zobrazia sa štáty a provincie. Kliknutím ich označíte, zrušíte označenie alebo pridáte do zoznamu želaní (bucket list).',
  'help.ctx.atlas.bullet.6':
    'Dawarich: ak je doplnok pripojený, panel vľavo od štatistík označuje priania ako splnené a pridáva krajiny z vašich záznamov. Robí to až po vašom potvrdení.',
  // mark-country
  'help.guide.mark-country.title': 'Označenie krajiny ako navštívenej',
  'help.guide.mark-country.goal':
    'Pridajte krajinu, ktorú ste navštívili ešte pred používaním TREK, aby bola na mape aj vo vašom počte.',
  'help.guide.mark-country.step.1': 'Zadajte krajinu do vyhľadávacieho poľa v hornej časti mapy.',
  'help.guide.mark-country.step.2': 'Vyberte ju zo zoznamu. Mapa sa presunie ku krajine a otvorí sa jej okno.',
  'help.guide.mark-country.step.3': 'Vyberte „Označiť ako navštívené“.',
  'help.guide.mark-country.result':
    'Krajina dostane na mape farbu a počet v „Krajín“ stúpne o jednu. Farba je trvalá: keď označíte ďalšie krajiny, farby ostatných sa nezmenia.',
  'help.guide.mark-country.tip.1':
    'Kliknutím na sivú krajinu na mape sa otvorí rovnaké okno. Pri malých krajinách je spoľahlivejšie vyhľadávanie.',
  'help.guide.mark-country.tip.2':
    'Krajina, ktorú označíte ručne, sa vždy počíta ako navštívená, bez ohľadu na dátumy ciest do nej.',
  // unmark-country
  'help.guide.unmark-country.title': 'Odstrániť označenú krajinu',
  'help.guide.unmark-country.goal': 'Odstráňte z mapy krajinu, ktorú ste označili ručne.',
  'help.guide.unmark-country.step.1':
    'Vyhľadajte krajinu a vyberte ju alebo na ňu kliknite na mape. Pri krajine, ktorú ste označili sami, sa okno opýta, či ju chcete odstrániť.',
  'help.guide.unmark-country.step.2': 'Potvrďte tlačidlom „Odobrať“.',
  'help.guide.unmark-country.result': 'Krajina znova zosivie a už sa nezapočítava.',
  'help.guide.unmark-country.tip.1':
    'Takto sa dajú odstrániť len krajiny, ktoré ste označili ručne. Krajina s cestami alebo miestami zostane označená, kým tieto cesty alebo miesta neodstránite. Pri ručne označenej krajine nájdete Odobrať aj v jej karte s podrobnosťami v paneli.',
  // country-details
  'help.guide.country-details.title': 'Zobrazenie toho, čo ste v krajine robili',
  'help.guide.country-details.goal': 'Otvorte navštívenú krajinu a prejdite na cesty, na ktorých ste v nej boli.',
  'help.guide.country-details.step.1': 'Do vyhľadávacieho poľa navrchu mapy zadajte krajinu, ktorú ste navštívili.',
  'help.guide.country-details.step.2':
    'Vyberte ju. Mapa sa tam posunie a v paneli dole sa zobrazí karta s vlajkou krajiny, odznakmi pre jej miesta, cesty a navštívené regióny a štítkom pre každú z jej prvých troch ciest.',
  'help.guide.country-details.result': 'Kliknutím na čip cesty otvoríte túto cestu v plánovači.',
  'help.guide.country-details.tip.1':
    'Keď nad krajinou na mape podržíte kurzor, uvidíte tie isté čísla a navyše prvú a poslednú návštevu.',
  // planned-countries
  'help.guide.planned-countries.title': 'Zobrazenie krajín, kam sa chystáte',
  'help.guide.planned-countries.goal':
    'Zobrazte na mape krajiny svojich nadchádzajúcich ciest bez toho, aby sa počítali ako navštívené.',
  'help.guide.planned-countries.step.1':
    'Vpravo hore zapnite Zobraziť plánované krajiny. Číslo vedľa neho ukazuje, koľko plánovaných krajín máte.',
  'help.guide.planned-countries.step.2':
    'Vyhľadajte plánovanú krajinu a vyberte ju: panel ukáže Plánované a popis na mape zobrazí, kedy tam idete.',
  'help.guide.planned-countries.result':
    'Plánované krajiny majú prerušovaný obrys, takže si ich nikdy nezameníte s krajinami, ktoré ste už navštívili. Prepínač si vašu voľbu zapamätá.',
  'help.guide.planned-countries.tip.1':
    'Krajina sa počíta ako navštívená, len čo sa cesta tam začala. Počíta sa aj prebiehajúca cesta. Cesty bez dátumov sa do štatistík nezahŕňajú vôbec.',
  'help.guide.planned-countries.tip.2': 'Prepínač existuje, len kým máte nadchádzajúce cesty.',
  // regions
  'help.guide.regions.title': 'Označenie regiónu',
  'help.guide.regions.goal': 'Označte nielen krajiny, ale aj štáty, provincie či prefektúry, kde ste boli.',
  'help.guide.regions.step.1':
    'Priblížte krajinu, kým sa nezobrazia hranice jej štátov a provincií. Ak krajinu vyhľadáte a vyberiete, mapa sa priblíži dostatočne.',
  'help.guide.regions.step.2':
    'Kliknite na región. Keď na región ukážete, zobrazí sa jeho názov. Okno ukazuje región a jeho krajinu.',
  'help.guide.regions.step.3': 'Vyberte Označiť ako navštívené.',
  'help.guide.regions.result':
    'Región sa vyfarbí farbou krajiny. Keď označíte región, ako navštívená sa započíta aj krajina, ak ešte nebola.',
  'help.guide.regions.tip.1':
    'Po kliknutí na navštívený región sa ponúkne Odobrať, či už ste ho označili sami, alebo pribudol kvôli nejakému miestu.',
  'help.guide.regions.tip.2':
    'Regióny, v ktorých máte skutočné miesta, sa označia automaticky. Nemusíte pre ne nič robiť.',
  // search-place
  'help.guide.search-place.title': 'Vyhľadanie miesta a označenie jeho regiónu',
  'help.guide.search-place.goal': 'Označte Bavorsko vyhľadaním Mníchova, aj keď neviete, v ktorom regióne mesto leží.',
  'help.guide.search-place.step.1':
    'Do vyhľadávacieho poľa zadajte mesto, pamiatku alebo adresu. Najprv sa zobrazia krajiny, zodpovedajúce miesta nájdete pod nimi v časti „Miesta“.',
  'help.guide.search-place.step.2': 'Vyberte miesto. Mapa sa presunie k nemu a nájde región, v ktorom miesto leží.',
  'help.guide.search-place.step.3':
    'Pre tento región vyberte Označiť ako navštívené, alebo Pridať do zoznamu prianí (Bucket list), ak ste tam ešte neboli.',
  'help.guide.search-place.result':
    'Označí sa región a s ním aj krajina. Pri krajinách, ktoré v mapovom balíku nemajú údaje o regiónoch, sa označí priamo krajina.',
  'help.guide.search-place.tip.1':
    'Miesta pochádzajú z rovnakého vyhľadávania ako inde v TREK, takže používajú poskytovateľa, ktorého nastavil váš správca.',
  // bucket-country
  'help.guide.bucket-country.title': 'Pridanie krajiny do zoznamu prianí',
  'help.guide.bucket-country.goal':
    'Veďte si na mape zoznam vysnívaných krajín, oddelene od krajín, ktoré ste už navštívili.',
  'help.guide.bucket-country.step.1': 'Vyhľadajte krajinu a vyberte ju alebo na ňu kliknite na mape.',
  'help.guide.bucket-country.step.2': 'Vyberte Pridať do zoznamu prianí (Bucket list).',
  'help.guide.bucket-country.step.3':
    'Ak už viete, kedy tam pôjdete, vyberte mesiac a rok a potom potvrďte tlačidlom Pridať do zoznamu prianí (Bucket list).',
  'help.guide.bucket-country.result':
    'Krajina sa zobrazí s diagonálnymi čiarami vo farbe, ktorú dostane po vašej návšteve, a objaví sa na karte „Zoznam prianí“ v paneli.',
  'help.guide.bucket-country.tip.1': 'Keď je krajina v zozname, to isté okno ponúka Odobrať zo zoznamu prianí.',
  'help.guide.bucket-country.tip.2':
    'Jeden záznam na cieľový dátum: tá istá krajina môže byť v zozname pre dva rôzne mesiace, ale nie dvakrát pre ten istý.',
  // bucket-place
  'help.guide.bucket-place.title': 'Pridanie miesta do zoznamu prianí',
  'help.guide.bucket-place.goal':
    'Uložte si mesto, pamiatku alebo adresu, ktorú chcete navštíviť, so súradnicami a cieľovým dátumom.',
  'help.guide.bucket-place.step.1': 'V paneli dole otvorte kartu Zoznam prianí.',
  'help.guide.bucket-place.step.2': 'Kliknite na Pridať miesto.',
  'help.guide.bucket-place.step.3':
    'Zadajte názov a stlačte tlačidlo vyhľadávania. Vyberte správny výsledok, aby miesto dostalo súradnice. Môžete zadať aj len názov a vyhľadávanie vynechať.',
  'help.guide.bucket-place.step.4': 'Ak chcete, vyberte mesiac a rok a kliknite na Pridať.',
  'help.guide.bucket-place.result':
    'Miesto sa zobrazí navrchu vášho zoznamu želaní (bucket list) s cieľovým dátumom. Keď naň ukážete myšou, objaví sa ×, ktorým ho odstránite.',
  'help.guide.bucket-place.tip.1':
    'Dawarich môže prianie neskôr označiť ako splnené, len ak má prianie súradnice. Urobí to, keď vaše záznamy ukážu, že ste tam boli.',
  // stats
  'help.guide.stats.title': 'Vaše štatistiky',
  'help.guide.stats.goal': 'Zistite, čo čísla v paneli počítajú a čo nie.',
  'help.guide.stats.step.1':
    'Krajín je počet rôznych krajín, v ktorých ste naozaj boli. Plánované krajiny sú uvedené pod číslom a nezapočítavajú sa doň. Regiónov počíta štáty a provincie, v ktorých ste boli. Ciest, Miest a Dní sú súčty za všetky vaše cesty. Miest (mestá) sa počíta z adries vašich miest, takže ide o odhad.',
  'help.guide.stats.step.2':
    'Kontinenty ukazujú navštívené krajiny podľa kontinentu. Antarktída sa v rade objaví, až keď ju navštívite. Potom nasleduje vaša séria (po sebe idúce roky s aspoň jednou cestou) a počet ciest, ktoré ste absolvovali tento rok.',
  'help.guide.stats.result': 'Čísla sa aktualizujú automaticky, ako plánujete cesty. Nemusíte tu nič udržiavať.',
  'help.guide.stats.tip.1':
    'Mestá sa berú z textu adresy, nevyhľadávajú sa. Krátka adresa ako „Osteria Francescana, Italy“ alebo adresa, ktorá končí prefektúrou, sa preto môže započítať ako región namiesto mesta.',
  'help.guide.stats.tip.2':
    'Krajiny, ktoré ste označili ručne, sa započítajú do Krajín a kontinentov, ale nepridajú žiadne cesty, miesta ani dni.',

  // dawarich-countries
  'help.guide.dawarich-countries.title': 'Pridanie krajín z vašich záznamov',
  'help.guide.dawarich-countries.goal':
    'Zistite cez Dawarich, v ktorých krajinách ste za posledný rok boli, a tie, ktoré potvrdíte, pridajte na mapu.',
  'help.guide.dawarich-countries.step.1':
    'Keď je pripojený doplnok Dawarich, v spodnej časti mapy, naľavo od štatistík, sa objaví panel Dawarich s dvoma dlaždicami. Kliknite na „Krajín“.',
  'help.guide.dawarich-countries.step.2':
    'Dialóg sa otvorí na karte Krajiny. Kliknite na Vyhľadať krajiny: TREK načíta krajiny a mestá, ktoré vaše záznamy pokrývajú za posledných 12 mesiacov, po jednom mesiaci, takže to môže chvíľu trvať. Každá krajina, ktorú váš Atlas ešte nemá, sa zobrazí s vlajkou, počtom miest a názvom prvého mesta. Každá krajina je predvolene zaškrtnutá. Kliknutím na riadok ju vynecháte.',
  'help.guide.dawarich-countries.step.3':
    'Potvrďte tlačidlom vpravo dole, ktoré pri piatich zaškrtnutých riadkoch znie Pridať 5 krajín. Dialóg uvedie, koľko krajín sa pridalo. Keď ho zavriete, mapa je už aktualizovaná.',
  'help.guide.dawarich-countries.result':
    'Potvrdené krajiny sa na mape vyfarbia a započítajú do „Krajín“ so zdrojom Dawarich. Krajiny, ktoré ste označili ručne, sa nezmenia.',
  'help.guide.dawarich-countries.tip.1':
    'Krajiny, ktoré Atlas už zobrazuje ako navštívené, či už ručne, z cesty alebo z predchádzajúcej kontroly, sa vynechajú, takže vaše vlastné označenia sa nikdy nezmenia. Krajina, ktorú ste z Atlasu predtým odstránili, sa pridá znova, keď ju tu potvrdíte.',
  'help.guide.dawarich-countries.tip.2':
    'Ak TREK nevie priradiť názov krajiny, zobrazí ho pod riadkami a nezahodí ho. Skontrolovať znova sa opýta Dawarich ešte raz. Poznámka pod zoznamom uvádza, že sa skontrolovalo posledných 12 mesiacov. Toto obdobie nemožno zmeniť.',
  // dawarich-wishes
  'help.guide.dawarich-wishes.title': 'Odškrtnutie prianí podľa vašich záznamov',
  'help.guide.dawarich-wishes.goal':
    'Zistite, ktoré miesta zo zoznamu prianí ste naozaj navštívili, a označte ich ako dosiahnuté aj s dátumom návštevy.',
  'help.guide.dawarich-wishes.step.1': 'V paneli Dawarich dole na mape, vľavo od štatistík, kliknite na Zoznam prianí.',
  'help.guide.dawarich-wishes.step.2':
    'Dialóg sa otvorí na karte Zoznam prianí. Kliknite na Skontrolovať zoznam prianí: TREK prehľadá vaše záznamy a vezme každú položku so súradnicami. Splnené prianie sa zobrazí s informáciou, ako blízko ste sa dostali, ako dlho ste tam zostali a v ktorý deň, a je predvolene zaškrtnuté. Pri tom, ktoré ste už odškrtli, je napísané Už odškrtnuté. Pod zoznamom poznámka uvádza počet položiek bez súradníc a pravidlo: Prianie sa počíta ako splnené v okruhu 250 m a po 20 minútach na mieste.',
  'help.guide.dawarich-wishes.step.3':
    'Potvrďte tlačidlom vpravo dole, na ktorom pri dvoch zaškrtnutých riadkoch stojí „Odškrtnúť 2“. Potom dialóg zatvorte a otvorte kartu „Zoznam prianí“ v paneli vedľa neho.',
  'help.guide.dawarich-wishes.result':
    'Každé prianie dostane zelenú fajku s dátumom pobytu, nie s dnešným dátumom. Jej popis hlási Odškrtnuté podľa vašich záznamov v Dawarichu. Kliknutím na dátum odškrtnutie vrátite späť.',
  'help.guide.dawarich-wishes.tip.1':
    'Prejazd okolo sa nepočíta: musíte byť blízko miesta a istý čas tam zostať. Ak vyhovuje viac pobytov, použije sa ten najdlhší. Prianie bez súradníc sa skontrolovať nedá, preto pridávajte miesta cez vyhľadávanie v Pridať miesto, nie len podľa názvu.',
  'help.guide.dawarich-wishes.tip.2':
    'Jedna kontrola prejde najviac 50 položiek, najprv tie, ktoré ešte nie sú odškrtnuté. Ak ich je viac, TREK vám to oznámi. Prianie, ktoré už bolo odškrtnuté, si ponechá svoj dátum.',
  // ── Screen: collections ────────────────────────────────────────────────────
  'help.ctx.collections.title': 'Zbierky',
  'help.ctx.collections.summary':
    'Zbierky sú vaša knižnica mimo akejkoľvek cesty: pomenované zoznamy miest, ktoré ste našli a chcete si ich ponechať, každé miesto so stavom Nápad, Chcem navštíviť alebo Navštívené, a ak je zapnuté Túry, aj celé túry, ktoré ste si uložili z cesty. Miesta a túry sa do ciest a z nich kopírujú, nikdy nie prepájajú, takže zoznam a cesta sa navzájom nikdy nemenia.',
  'help.ctx.collections.bullet.1':
    'Stĺpec zoznamov vľavo ukazuje vaše vlastné zoznamy, zoznamy zdieľané s vami, pozvánky, na ktoré ste ešte neodpovedali, a Všetko uložené, ktoré spája všetko zo zoznamov, ktoré vlastníte. Navrchu je Nový zoznam a import zo súboru.',
  'help.ctx.collections.bullet.2':
    'Hlavička otvoreného zoznamu ukazuje jeho farbu, titulný obrázok, popis a odkazy, členov a vpravo „Upraviť“ (iba vlastník), „Exportovať“ a „Zdieľať“. Pri zozname, ktorý s vami niekto zdieľa, je na tlačidle „Zdieľať“ nápis „Zdieľané“.',
  'help.ctx.collections.bullet.3':
    'Riadok filtrov nad miestami: + na pridanie miesta, rozbaľovacie zoznamy Stav, Kategória, Hodnotenie a Zoradiť, ikona začiarkavacieho políčka pre Vybrať a ikona oblaku pre Importovať z cesty. Filter štítkov sa v tomto riadku zobrazí, iba keď nie je zobrazená mapa.',
  'help.ctx.collections.bullet.4':
    'Riadky miest: fotka, názov a adresa, štítky a kategória a vpravo štítok stavu. Jedno kliknutie naň ho zmení na ďalší stav.',
  'help.ctx.collections.bullet.5':
    'Mapa vpravo: špendlík pre každé miesto so súradnicami. Jej horná lišta obsahuje Zväčšiť mapu (Zobraziť zoznam, keď je mapa na celú plochu), filter štítkov s tlačidlom na správu štítkov a pole Hľadať miesta. Kliknutím na špendlík otvoríte dané miesto.',
  'help.ctx.collections.bullet.6':
    'Detail: kliknutím na riadok zobrazíte titulnú fotku, kategóriu, stav, hodnotenie hviezdičkami, štítky, popis a odkazy. Fotoaparátom na titulnej fotke fotku zmeníte. Dole sú tlačidlá „Upraviť“, „Kopírovať do cesty“, navigácia a „Odobrať zo zoznamu“.',
  // create-list
  'help.guide.create-list.title': 'Vytvorenie zoznamu',
  'help.guide.create-list.goal': 'Založte nový pomenovaný zoznam s farbou a titulným obrázkom, pripravený na miesta.',
  'help.guide.create-list.step.1': 'Kliknite na Nový zoznam v hornej časti bočného panela so zoznamami.',
  'help.guide.create-list.step.2':
    'Zoznam pomenujte a vyberte farbu. Obrázok na obálku, popis a odkazy sú voliteľné, môžete ich pridať neskôr cez Upraviť.',
  'help.guide.create-list.step.3': 'Kliknite na „Vytvoriť“.',
  'help.guide.create-list.result':
    'Zoznam sa otvorí prázdny a môžete ho naplniť dvoma spôsobmi: Pridať miesto a Importovať z cesty.',
  'help.guide.create-list.tip.1':
    'Ako titulný obrázok môžete nahrať vlastný obrázok alebo nájsť obrázok cez vyhľadávanie Unsplash v tom istom dialógu.',
  // add-place
  'help.guide.add-place.title': 'Pridanie miesta',
  'help.guide.add-place.goal':
    'Nájdite miesto a jedným krokom ho uložte do otvoreného zoznamu aj s názvom, kategóriou, stavom a poznámkami.',
  'help.guide.add-place.step.1':
    'Kliknite na + na začiatku riadku s filtrami nad miestami. Ak je zoznam ešte prázdny, kliknite na Pridať miesto uprostred stránky.',
  'help.guide.add-place.step.2':
    'Zadajte miesto do vyhľadávacieho poľa a vyberte výsledok. Názov, adresa a súradnice sa vyplnia z výsledku.',
  'help.guide.add-place.step.3':
    'Nastavte stav a, ak chcete, kategóriu, popis a odkazy, potom kliknite na Pridať. Dialóg zostane otvorený pre ďalšie miesto, Zrušiť ho zavrie.',
  'help.guide.add-place.result': 'Miesto sa objaví v zozname a ak má súradnice, aj ako špendlík na mape.',
  'help.guide.add-place.tip.1':
    'V rámci cesty vložíte miesto cesty do zoznamu bez opustenia cesty cez Uložiť do zbierky v inšpektore miesta alebo v ponuke miesta.',
  'help.guide.add-place.tip.2':
    'Zoznam musí byť váš alebo v ňom musíte byť editor či správca. V zobrazení „Všetko uložené“ ani v zozname, ktorý môžete len prezerať, tlačidlo + nenájdete.',
  // import-from-trip
  'help.guide.import-from-trip.title': 'Import miest z cesty',
  'help.guide.import-from-trip.goal': 'Preneste do zoznamu naraz všetky miesta z cesty namiesto ukladania po jednom.',
  'help.guide.import-from-trip.step.1':
    'V riadku filtrov kliknite na tlačidlo importu so šípkou a oblakom. V prázdnom zozname je to isté tlačidlo vedľa „Pridať miesto“.',
  'help.guide.import-from-trip.step.2': 'Vyberte jednu zo svojich ciest.',
  'help.guide.import-from-trip.step.3':
    'Zaškrtnite miesta, ktoré chcete. Miesta, ktoré už v zozname sú, sú sivé. Miesta, ktoré nie sú na žiadnom dni cesty, sú na začiatku vybrané. Ak je každé miesto už na nejakom dni, vybrané sú všetky nové miesta. „Len nové“ skryje miesta, ktoré zoznam už obsahuje.',
  'help.guide.import-from-trip.step.4': 'Kliknite na Importovať. Tlačidlo vždy uvádza, koľko miest sa práve pridá.',
  'help.guide.import-from-trip.result':
    'Miesta sa skopírujú do zoznamu s názvom, adresou, súradnicami, popisom a kategóriou. Cesta sa nezmení.',
  'help.guide.import-from-trip.tip.1':
    'TREK duplikáty podľa názvu alebo súradníc automaticky preskočí, takže import môžete pokojne spustiť aj dvakrát.',
  'help.guide.import-from-trip.tip.2':
    'V zozname miest v ceste môžete v režime výberu namiesto toho použiť Uložiť do zbierky a uložiť ručne vybranú skupinu miest.',
  // place-status
  'help.guide.place-status.title': 'Nastavenie stavu miesta',
  'help.guide.place-status.goal': 'Sledujte, čo je len nápad, čo je v užšom výbere a kde ste už boli.',
  'help.guide.place-status.step.1':
    'Kliknite na odznak stavu na pravom konci riadka miesta. Z „Nápad“ sa stane „Chcem navštíviť“.',
  'help.guide.place-status.step.2': 'Ďalším kliknutím nastavíte Navštívené a ešte jedným sa vrátite na Nápad.',
  'help.guide.place-status.result':
    'Štítok a jeho farba sa zmenia okamžite a počty vo filtri stavu nad zoznamom sa aktualizujú.',
  'help.guide.place-status.tip.1':
    'Stav existuje len v Zbierkach. Keď miesto skopírujete do cesty, jeho stav sa neprenesie.',
  'help.guide.place-status.tip.2':
    'Z cesty otvorí Uložiť do zbierky okno Uložiť do zoznamu so štítkom stavu pre každý zoznam, v ktorom miesto je, a lišta výberu v paneli miest má Označiť ako navštívené vo vašich zoznamoch.',
  // place-detail
  'help.guide.place-detail.title': 'Otvorenie uloženého miesta',
  'help.guide.place-detail.goal':
    'Pozrite si všetko o mieste a čo s ním môžete robiť: upraviť ho, skopírovať do cesty, nájsť k nemu cestu, odstrániť ho.',
  'help.guide.place-detail.step.1':
    'Kliknite na riadok miesta. Vedľa zoznamu sa otvorí panel s podrobnosťami a mapa sa presunie na miesto.',
  'help.guide.place-detail.step.2':
    'Dole sú tlačidlá „Upraviť“, „Kopírovať do cesty“, navigácia, ktorá otvorí miesto v mapovej aplikácii, a „Odobrať zo zoznamu“. Fotoaparátom na titulnej fotke nahradíte automatickú fotku vlastnou.',
  'help.guide.place-detail.result':
    'Cez Upraviť môžete názov, kategóriu, štítky, adresu, súradnice, popis a odkazy meniť priamo v paneli.',
  'help.guide.place-detail.tip.1':
    'Titulná fotka sa načíta automaticky, ak miesto nemá vlastný obrázok. Vlastný obrázok môže byť JPG, PNG, GIF, WebP alebo HEIC do 20 MB. Ikona koša vedľa fotoaparátu vráti automatickú fotku.',
  'help.guide.place-detail.tip.2':
    'Každý člen, vrátane vás, môže pod stavom pridať hodnotenie hviezdičkami. Filter Hodnotenie v riadku filtrov používa priemer.',
  // labels
  'help.guide.labels.title': 'Zoskupiť miesta pomocou štítkov',
  'help.guide.labels.goal': 'Dajte zoznamu vlastné štítky, napríklad štvrte alebo dni, popri spoločných kategóriách.',
  'help.guide.labels.step.1':
    'Kliknite na Pridať štítok vedľa štítkov nad mapou (keď už nejaké sú, tlačidlo znie Spravovať štítky). Ak sa mapa nezobrazuje, tlačidlo je na konci riadku s filtrami.',
  'help.guide.labels.step.2':
    'Zadajte názov, vyberte farbu a kliknite na Pridať štítok. V tom istom dialógu môžete existujúce štítky premenovať, prefarbiť alebo vymazať.',
  'help.guide.labels.step.3':
    'Zapnite „Vybrať“, zaškrtnite miesta, na lište výberu kliknite na „Priradiť štítok“, potom vyberte štítky a potvrďte tlačidlom „Priradiť štítok“. Jednému miestu môžete štítky pridať aj cez „Upraviť“ v jeho detaile.',
  'help.guide.labels.step.4':
    'Kliknite na jeden alebo viac štítkov nad mapou. V zozname aj na mape sa zobrazia iba miesta, ktoré majú aspoň jeden z nich. Opätovným kliknutím na štítok ho z filtra odstránite.',
  'help.guide.labels.result':
    'Miesta so štítkami ich zobrazujú v riadku. Filter štítkov majú k dispozícii všetci členovia, aj diváci.',
  'help.guide.labels.tip.1':
    'Štítky patria k zoznamu, v ktorom vznikli. Keď miesto presuniete do iného zoznamu, jeho štítky sa odstránia.',
  'help.guide.labels.tip.2': 'Na správu a priraďovanie štítkov potrebujete právo upravovať zoznam.',
  // filter-select
  'help.guide.filter-select.title': 'Filtrovanie a výber miest',
  'help.guide.filter-select.goal': 'Vyfiltrujte zoznam a zmeňte viac miest naraz.',
  'help.guide.filter-select.step.1':
    'Použite rozbaľovacie zoznamy v riadku filtrov: stav, kategória, minimálne hodnotenie a poradie. Stav a kategória ukazujú, koľko miest zodpovedá každej voľbe.',
  'help.guide.filter-select.step.2':
    'Kliknite na ikonu začiarkavacieho políčka, Vybrať, za rozbaľovacími zoznamami. Každý riadok dostane políčko a zobrazí sa lišta výberu.',
  'help.guide.filter-select.step.3':
    'Zaškrtnite miesta alebo cez „Vybrať všetko“ označte všetky, ktoré filter zobrazuje. Potom zvoľte „Priradiť štítok“, „Presunúť do zoznamu“, „Duplikovať do zoznamu“, „Kopírovať do cesty“ alebo „Vymazať“. Presúvať a mazať môže iba vlastník alebo správca zoznamu.',
  'help.guide.filter-select.result': 'Akcie sa použijú na celý výber naraz. × vpravo ukončí režim výberu.',
  'help.guide.filter-select.tip.1':
    'Vybrať všetko vyberie len miesta, ktoré zodpovedajú filtru. Ak chcete pracovať so všetkými miestami so stavom Chcem navštíviť, vyfiltrujte Chcem navštíviť a kliknite na Vybrať všetko.',
  // copy-to-trip
  'help.guide.copy-to-trip.title': 'Kopírovanie miest do cesty',
  'help.guide.copy-to-trip.goal': 'Pridajte uložené miesta ako zastávky do niektorej zo svojich ciest.',
  'help.guide.copy-to-trip.step.1':
    'Zapnite Vybrať a zaškrtnite miesta, alebo otvorte jedno miesto a v paneli s podrobnosťami použite Kopírovať do cesty.',
  'help.guide.copy-to-trip.step.2': 'Na paneli výberu kliknite na Kopírovať do cesty.',
  'help.guide.copy-to-trip.step.3': 'Vyberte cestu. Dlhý zoznam zúžite vyhľadávacím poľom.',
  'help.guide.copy-to-trip.result':
    'Miesta sa pridajú do zoznamu miest tejto cesty s názvom, popisom, kategóriou, poznámkami, cenou, súradnicami, fotkou a štítkami. V zbierke sa nič nezmení.',
  'help.guide.copy-to-trip.tip.1':
    'Môžu to urobiť aj diváci zdieľaného zoznamu. Miesta sa zo zoznamu skopírujú a zoznam sa nezmení.',
  // share-list
  'help.guide.share-list.title': 'Zdieľanie zoznamu',
  'help.guide.share-list.goal': 'Plánujte zoznam spolu s ďalšími ľuďmi na tomto TREK, v reálnom čase.',
  'help.guide.share-list.step.1': 'V hlavičke svojho zoznamu kliknite na Zdieľať.',
  'help.guide.share-list.step.2': 'Vyberte používateľa a rolu: Divák, Editor alebo Správca.',
  'help.guide.share-list.step.3':
    'Kliknite na Odoslať pozvánku. Dotyčný sa zobrazuje ako čakajúci, kým pozvánku neprijme vo svojej lište zoznamov alebo cez oznámenie.',
  'help.guide.share-list.result':
    'Keď pozvánku prijmú, zoznam sa im zobrazí v časti Zdieľané a každá zmena sa synchronizuje naživo. Členov a ich roly môžete naďalej upravovať v tom istom dialógu.',
  'help.guide.share-list.tip.1':
    'Diváci môžu miesta prezerať, hodnotiť a kopírovať do vlastných ciest. Editori pridávajú a upravujú miesta a štítky. Správcovia môžu aj presúvať a mazať.',
  'help.guide.share-list.tip.2': 'Pozývať a odoberať ľudí môže iba vlastník. Člen môže zdieľaný zoznam sám opustiť.',
  // export-list
  'help.guide.export-list.title': 'Export zoznamu do súboru',
  'help.guide.export-list.goal': 'Pošlite zoznam niekomu na inom serveri TREK alebo ho otvorte v mapovej aplikácii.',
  'help.guide.export-list.step.1': 'V hlavičke zoznamu kliknite na „Exportovať“.',
  'help.guide.export-list.step.2':
    'Vyberte Zoznam TREK, ak chcete zoznam použiť v inom TREK, aj so štítkami a stavom, alebo GPX pre OsmAnd, Organic Maps, Garmin a ďalšie aplikácie, ktoré čítajú body trasy.',
  'help.guide.export-list.result': 'Súbor sa stiahne. Exportovať môže ktorýkoľvek člen zdieľaného zoznamu.',
  'help.guide.export-list.tip.1':
    'Miesto bez súradníc nemôže byť bodom GPX. Vynechá sa a TREK vám oznámi, koľko takých miest bolo.',
  'help.guide.export-list.tip.2':
    'Hodnotenia, členovia a nahrané fotky sa zámerne neexportujú: patria k tejto inštancii TREK, nie k zoznamu.',
  // import-file
  'help.guide.import-file.title': 'Import zoznamu zo súboru',
  'help.guide.import-file.goal':
    'Importujte súbor so zoznamom TREK alebo súbor GPX ako nový zoznam alebo do existujúceho.',
  'help.guide.import-file.step.1':
    'V paneli zoznamov kliknite na tlačidlo importu so šípkou nahor vedľa „Nový zoznam“.',
  'help.guide.import-file.step.2':
    'Vyberte súbor. Skôr než TREK niečo importuje, ukáže, čo súbor obsahuje: názov, počet miest a počet štítkov.',
  'help.guide.import-file.step.3':
    'Nechajte Nový zoznam a podľa potreby zmeňte názov, potom kliknite na Importovať. Alebo vyberte Pridať do zoznamu, aby sa miesta pridali do zoznamu, ktorý môžete upravovať, a kliknite na Pridať do zoznamu.',
  'help.guide.import-file.result':
    'Zoznam sa otvorí s importovanými miestami. Import do zoznamu miesta len pridáva. Miesta, ktoré tam už sú, si ponechajú stav, poznámky aj štítky.',
  'help.guide.import-file.tip.1':
    'Z GPX sa každý pomenovaný bod trasy stane miestom. Stopy sú čiary a vynechajú sa, pričom náhľad uvádza, koľko bodov to bolo.',
  'help.guide.import-file.tip.2':
    'Súbor, ktorý nie je zoznamom TREK ani GPX, TREK odmietne a uvedie dôvod. Ak sa nedá prečítať jedno miesto, preskočí sa iba toto miesto, nie celý súbor.',
  // edit-list
  'help.guide.edit-list.title': 'Úprava alebo vymazanie zoznamu',
  'help.guide.edit-list.goal':
    'Zmeňte názov, farbu, titulný obrázok, popis alebo odkazy zoznamu, prípadne zoznam odstráňte.',
  'help.guide.edit-list.step.1': 'V hlavičke zoznamu kliknite na „Upraviť“. Toto tlačidlo vidí len vlastník.',
  'help.guide.edit-list.step.2':
    'Zmeňte, čo potrebujete, a kliknite na „Uložiť“. Ikona koša vľavo dole, „Odstrániť zoznam“, po potvrdení odstráni zoznam aj so všetkými jeho miestami.',
  'help.guide.edit-list.result': 'Hlavička navrchu okamžite ukáže novú farbu, obal a popis.',
  'help.guide.edit-list.tip.1':
    'Vymazanie zoznamu sa nedá vrátiť späť. Ak si chcete ponechať kópiu, najprv ho exportujte.',
  // all-saved
  'help.guide.all-saved.title': 'Prehľadávať celú knižnicu',
  'help.guide.all-saved.goal': 'Zobrazte naraz miesta zo všetkých zoznamov, ktoré vlastníte.',
  'help.guide.all-saved.step.1':
    'Kliknite na Všetko uložené v lište zoznamov. Zobrazí miesta zo všetkých zoznamov, ktoré vlastníte alebo spoluvlastníte, v jednom prehľade.',
  'help.guide.all-saved.step.2':
    'Píšte do poľa Hľadať miesta nad mapou a filtre používajte ako v ktoromkoľvek zozname. Vybrať tu funguje tiež: presúvajte, duplikujte, kopírujte do cesty alebo mažte naprieč zoznamami.',
  'help.guide.all-saved.result':
    'Toto zobrazenie ukazuje všetky vaše uložené miesta spolu. Miesta tu pridávať ani importovať nemôžete, pretože neexistuje jeden zoznam, do ktorého by sa pridali.',
  'help.guide.all-saved.tip.1': 'Štítky a uložené túry patria jednému zoznamu, preto sa v Všetko uložené neponúkajú.',

  // ── Screen: journey ───────────────────────────────────────────────────────
  'help.ctx.journey.title': 'Cestovný denník',
  'help.ctx.journey.summary':
    'Cestovný denník je váš cestovateľský denník, v ktorom hrajú hlavnú úlohu fotky. Každý denník je prepojený s jednou alebo viacerými cestami a deň po dni ho napĺňate záznamami s príbehom, fotkami, náladou a počasím. Na tejto obrazovke sú vaše denníky. Ak chcete písať, jeden otvorte.',
  'help.ctx.journey.bullet.1':
    'Banner navrchu ukazuje prebiehajúci cestovný denník, alebo ten najnovší, s počtom záznamov, fotiek a miest. Pokračovať v písaní ho otvorí na dnešnom dni. Hneď po skončení cesty ponúka banner Cesta práve skončila nad ním premenu tejto cesty na cestovný denník.',
  'help.ctx.journey.bullet.2':
    'Pod „Všetky cestovné denníky“ má každý denník svoju kartu s titulným obrázkom, stavom, dátumami a počtami; denník z bannera sa tu už neopakuje. Kliknutím na kartu ho otvoríte.',
  'help.ctx.journey.bullet.3':
    'Posledná karta v mriežke, Vytvoriť nový cestovný denník, založí nový denník z vašich ciest.',
  // create-journey
  'help.guide.create-journey.title': 'Vytvorenie cestovného denníka',
  'help.guide.create-journey.goal': 'Založte k ceste denník, v ktorom už budú miesta z cesty ako návrhy.',
  'help.guide.create-journey.step.1': 'Kliknite na Vytvoriť nový cestovný denník, poslednú kartu v mriežke.',
  'help.guide.create-journey.step.2':
    'Pomenujte ho a, ak chcete, pridajte podnadpis, potom zaškrtnite cesty, ku ktorým patrí. Počítadlo ukazuje, koľko miest sa pridá.',
  'help.guide.create-journey.step.3': 'Kliknite na „Vytvoriť cestovný denník“.',
  'help.guide.create-journey.result':
    'Denník sa otvorí. Každé miesto z prepojených ciest je na časovej osi ako návrh, raz za každý deň, na ktorý je naplánované. Ku každému môžete napísať záznam.',
  'help.guide.create-journey.tip.1': 'Ďalšie cesty môžete prepojiť neskôr v „Nastaveniach cestovného denníka“.',
  'help.guide.create-journey.tip.2': 'Funguje aj cestovný denník bez ciest. Záznamy potom pridávate ručne.',
  // open-journey
  'help.guide.open-journey.title': 'Otvoriť cestovný denník',
  'help.guide.open-journey.goal': 'Otvorte denník a zistite, na ktorom mieste sa otvorí.',
  'help.guide.open-journey.step.1':
    'Kliknite na kartu. Každá ukazuje obálku, dátumy a počet záznamov, fotiek a miest v cestovnom denníku.',
  'help.guide.open-journey.result':
    'Prebiehajúci denník sa otvorí na dnešnom dni, alebo na poslednom zázname pred dneškom, ak dnes ešte nie je nič napísané. Dokončený denník sa otvorí na začiatku.',
  'help.guide.open-journey.tip.1':
    'Titulným obrázkom je prvá fotka denníka, ak si v „Nastaveniach cestovného denníka“ nenastavíte inú.',
  // continue-writing
  'help.guide.continue-writing.title': 'Pokračovanie v aktuálnom cestovnom denníku',
  'help.guide.continue-writing.goal': 'Otvorte rovno dnešnú stranu cestovného denníka, ktorý práve píšete.',
  'help.guide.continue-writing.step.1':
    'Kliknite na „Pokračovať v písaní“ v banneri hore. Zobrazuje sa v ňom práve prebiehajúci cestovný denník, a ak žiadny neprebieha, najnovší.',
  'help.guide.continue-writing.result':
    'Denník sa otvorí na dnešnom dni, alebo na poslednom zázname pred dneškom, ak ešte nie je nič napísané.',
  'help.guide.continue-writing.tip.1':
    'Keď cesta práve skončila, nad týmto je zobrazený banner Cesta práve skončila: Vytvoriť cestovný denník založí denník s už vybranou touto cestou, Zavrieť skryje ponuku v tomto prehliadači.',

  // ── Screen: journey-detail ────────────────────────────────────────────────────────────
  'help.ctx.journey-detail.title': 'Denník',
  'help.ctx.journey-detail.summary':
    'Jeden otvorený cestovný denník: vľavo časová os deň po dni, vpravo mapa s prepínateľnými vrstvami pre plán, vaše záznamy trás, zápisy a fotky. Záhlavie ukazuje počty, Studio, prepínač návrhov a ⋯ pre Nastavenia cestovného denníka. Záznamy pridáte lištou pod ním.',
  'help.ctx.journey-detail.bullet.1':
    'Záhlavie: šípka späť a odznak stavu, titulná fotka, názov a podnadpis, počet dní, miest, záznamov a fotiek a vpravo Studio, oko na skrytie alebo zobrazenie návrhov a ⋯ pre „Nastavenia cestovného denníka“.',
  'help.ctx.journey-detail.bullet.2':
    'Lišta: karty Časová os a Galéria, Hľadať v tejto ceste a Pridať záznam. V Galéria Pridať záznam nahrádza Nahrať.',
  'help.ctx.journey-detail.bullet.3':
    'Časová os: jedna sekcia na deň s jeho číslom, počtom miest a tlačidlom + na pridanie záznamu v ten deň. Pod ňou sú karty záznamov s fotkami, náladou, počasím a príbehom a prerušované karty návrhov z ciest, každá s tlačidlom × na odmietnutie.',
  'help.ctx.journey-detail.bullet.4':
    'Mapa: lišta vrstiev navrchu prepína Plán (prázdne špendlíky a prerušované trasy GPX z ciest), Zaznamenané (plné trasy uložené z Dawarich), Záznamy (špendlíky vo farbách dní, spojené v poradí podľa dátumu tenkou prerušovanou čiarou) a Fotky. Ikona (i) vedľa nich vysvetľuje každý symbol.',
  'help.ctx.journey-detail.bullet.5':
    '„Nastavenia cestovného denníka“ (⋯): titulný obrázok, názov a podnadpis, stav, stopy GPX, zaznamenané dni, miesta z fotiek, polia záznamu, odmietnuté návrhy, synchronizované cesty, prispievatelia a ktorí členovia cesty majú prístup, verejné zdieľanie, archivácia a vymazanie.',
  'help.ctx.journey-detail.bullet.6':
    'Na konci dlhej časovej osi nájdete Späť nahor, počet dní, ktorým preskočíte na ľubovoľný deň alebo záznam, a Prejsť na posledný záznam.',
  // add-entry
  'help.guide.add-entry.title': 'Napísanie záznamu',
  'help.guide.add-entry.goal': 'Pridajte príbeh dňa s nadpisom, textom, náladou a počasím.',
  'help.guide.add-entry.step.1':
    'Kliknite na Pridať záznam na lište, alebo na + na pravom konci záhlavia dňa, ak chcete začať v tom dni.',
  'help.guide.add-entry.step.2':
    'Zadajte záznamu názov a napíšte text. Panel nástrojov nad textom pridáva v Markdowne tučné písmo, kurzívu, nadpisy, citácie, odkazy a zoznamy.',
  'help.guide.add-entry.step.3':
    'V pravom stĺpci skontrolujte dátum a čas, vyhľadajte miesto alebo použite aktuálnu polohu a vyberte náladu a počasie.',
  'help.guide.add-entry.step.4': 'Kliknite na Uložiť.',
  'help.guide.add-entry.result':
    'Záznam sa zobrazí pri svojom dni na časovej osi a ako špendlík na mape. Počty v hlavičke sa aktualizujú.',
  'help.guide.add-entry.tip.1': 'Keď píšete do návrhu, používate ten istý editor, len s už nastaveným miestom.',
  'help.guide.add-entry.tip.2':
    'Záznam s miestom ponúka Vynechať z trasy: záznam zostane v denníku, ale nezapočíta sa do vzdialenosti ani do krajín a v Studiu sa nezobrazí na mape.',
  // entry-photos
  'help.guide.entry-photos.title': 'Pridanie fotiek a videí k záznamu',
  'help.guide.entry-photos.goal': 'Pridajte k dňu fotky. Prvá sa stane titulnou fotkou záznamu.',
  'help.guide.entry-photos.step.1': 'Otvorte ponuku záznamu cez ⋯ na jeho karte a vyberte „Upraviť“.',
  'help.guide.entry-photos.step.2':
    'Kliknite na Nahrať fotky a vyberte súbory. Z galérie použije obrázky, ktoré už sú v galérii cestovného denníka. Externé fotky prehľadajú pre daný deň pripojenú knižnicu Immich alebo Synology.',
  'help.guide.entry-photos.step.3':
    'Ukážte na obrázok a kliknutím na Nastaviť ako 1. vyberte titulnú fotku, potom kliknite na Uložiť.',
  'help.guide.entry-photos.result': 'Fotky sa zobrazia na karte aj v galérii. Prvá z nich je všade náhľadom.',
  'help.guide.entry-photos.tip.1':
    'Videá pridáte k záznamu rovnako: mp4, m4v, webm alebo mov do 500 MB. Uložia sa bez úprav.',
  'help.guide.entry-photos.tip.2':
    'Súbory HEIC z iPhonu sa pri nahrávaní prevedú na JPEG, čím stratia údaje GPS aj metadáta fotoaparátu.',
  // suggestions
  'help.guide.suggestions.title': 'Použitie alebo zamietnutie návrhov',
  'help.guide.suggestions.goal': 'Vytvorte z miest svojich ciest záznamy a zamietnite tie, o ktorých písať nebudete.',
  'help.guide.suggestions.step.1':
    'Návrh je karta s prerušovaným okrajom a tlačidlom Pridať záznam: ide o miesto z prepojenej cesty v deň, na ktorý bolo naplánované. Kliknutím na ňu otvoríte editor s už nastaveným miestom a dňom.',
  'help.guide.suggestions.step.2':
    'Kliknite na × na pravom konci karty, ktorú nechcete použiť. Karta zmizne z časovej osi, ale nevymaže sa, a synchronizácia cesty ju už nenavrhne.',
  'help.guide.suggestions.step.3':
    'Rozmysleli ste si to? Otvorte Nastavenia cestovného denníka cez ⋯ v záhlaví: Vrátiť zahodené návrhy ukazuje, koľko ich je, a vráti ich všetky.',
  'help.guide.suggestions.result':
    'Na časovej osi sú iba záznamy, ktoré chcete napísať. Ikona oka v hlavičke počas čítania skryje všetky návrhy naraz.',
  'help.guide.suggestions.tip.1': 'Miesto naplánované na dva dni vytvorí návrh v každom z nich.',
  'help.guide.suggestions.tip.2': 'Návrhy sa do štatistík nikdy nezapočítavajú, počítajú sa len napísané záznamy.',
  // add-on-day
  'help.guide.add-on-day.title': 'Pridať záznam k skoršiemu dňu',
  'help.guide.add-on-day.goal': 'Napíšte o dni v minulosti a nemusíte potom upravovať dátum.',
  'help.guide.add-on-day.step.1': 'Kliknite na + na pravom konci záhlavia daného dňa.',
  'help.guide.add-on-day.step.2': 'Editor sa otvorí s nastaveným dátumom. Píšte a Uložiť kliknite ako zvyčajne.',
  'help.guide.add-on-day.result': 'Záznam sa hneď pridá k správnemu dňu.',
  'help.guide.add-on-day.tip.1':
    'Poradie záznamov v rámci dňa zmeníte tak, že ukážete myšou na záznam: vľavo od neho sa zobrazia Posunúť nahor a Posunúť nadol.',
  // pros-cons
  'help.guide.pros-cons.title': 'Pridanie hodnotenia',
  'help.guide.pros-cons.goal': 'Zhrňte deň tým, čo bolo skvelé a čo nie.',
  'help.guide.pros-cons.step.1':
    'V editore nájdete pod príbehom Klady a zápory. Napíšte bod do poľa Klady alebo Zápory a pre ďalší použite Pridať ďalší.',
  'help.guide.pros-cons.step.2': 'Uložte. Na karte Zobraziť viac otvorí príbeh a verdikt ako dva krátke zoznamy.',
  'help.guide.pros-cons.result': 'Palec hore a palec dole sa zobrazia pod príbehom, kde ich hneď uvidíte.',
  'help.guide.pros-cons.tip.1':
    'Ak cestovný denník hodnotenia nepoužíva, sekciu môžete vypnúť v časti „Polia záznamu“ v Nastaveniach cestovného denníka.',
  // search-journey
  'help.guide.search-journey.title': 'Hľadanie v dlhom denníku',
  'help.guide.search-journey.goal': 'Nájdite záznam bez toho, aby ste museli prechádzať záznamy z celých týždňov.',
  'help.guide.search-journey.step.1':
    'Píšte do poľa „Hľadať v tejto ceste“ na paneli nástrojov. Časová os sa filtruje už počas písania, v nadpisoch, príbehoch, miestach aj štítkoch. Na diakritike ani veľkosti písmen nezáleží.',
  'help.guide.search-journey.step.2':
    'Ak chcete radšej preskočiť na konkrétny deň, kliknite na počet dní dole na časovej osi, medzi „Späť nahor“ a „Prejsť na posledný záznam“.',
  'help.guide.search-journey.result':
    'Časová os sa posunie na vybraný deň alebo záznam a mapa sa presunie k nemu. Kým pole vyhľadávania nevymažete, zobrazujú sa len zodpovedajúce záznamy.',
  'help.guide.search-journey.tip.1':
    'Prebiehajúci cestovný denník sa otvorí na dnešnej strane, takže aktuálna strana je zvyčajne hneď na očiach.',
  'help.guide.search-journey.tip.2': 'Oko v záhlaví skryje návrhy, takže uvidíte len záznamy, ktoré ste napísali sami.',
  // gallery-map
  'help.guide.gallery-map.title': 'Prezeranie galérie a mapy',
  'help.guide.gallery-map.goal': 'Pozrite si celý cestovný denník v obrázkoch aj ako miesta na mape.',
  'help.guide.gallery-map.step.1':
    'Na paneli nástrojov prepnite na Galéria. Zobrazí všetky fotky zo všetkých záznamov, aj obrázky nahrané priamo do galérie. Kliknutím na niektorú ju otvoríte v zväčšenom náhľade.',
  'help.guide.gallery-map.step.2':
    'Tlačidlom „Nahrať“ vpravo pridáte obrázky do galérie. Ak máte pripojený Immich alebo Synology, môžete obrázky vybrať aj odtiaľ cez tlačidlo s názvom knižnice.',
  'help.guide.gallery-map.result':
    'Špendlíky majú farbu svojho dňa a tenká prerušovaná čiara ich spája v poradí podľa dátumu. Lišta vrstiev navrchu mapy prepína, čo sa zobrazuje.',
  'help.guide.gallery-map.tip.1':
    'Stopy GPX z cesty sa zobrazujú vo vrstve Plán na mape ako prerušované čiary. Zobraziť všetky GPX stopy z ciest v Nastavenia cestovného denníka ich vypne.',
  'help.guide.gallery-map.tip.2':
    'Fotky z galérie s polohou sa zobrazia aj na verejnej mape, ak sú zdieľané Galéria aj Mapa.',
  // entry-fields
  'help.guide.entry-fields.title': 'Vypnutie polí záznamu',
  'help.guide.entry-fields.goal': 'Zobrazte v editore len polia, ktoré tento denník používa.',
  'help.guide.entry-fields.step.1': 'Kliknutím na ⋯ vpravo hore v záhlaví otvoríte Nastavenia cestovného denníka.',
  'help.guide.entry-fields.step.2': 'V časti Polia záznamu vypnite Nálada, Počasie alebo Klady a zápory.',
  'help.guide.entry-fields.result':
    'Editor tieto polia už nezobrazuje. Nič z toho, čo ste napísali, sa nestratí: keď pole znova zapnete, uložené hodnoty sa opäť zobrazia. Zdieľaný cestovný denník skrýva tie isté polia.',
  'help.guide.entry-fields.tip.1':
    'Prepínače platia pre každý cestovný denník zvlášť, takže pracovná cesta a dovolenka sa môžu líšiť.',
  // link-trip
  'help.guide.link-trip.title': 'Prepojenie ďalšej cesty',
  'help.guide.link-trip.goal': 'Pridajte do denníka miesta z druhej cesty ako návrhy.',
  'help.guide.link-trip.step.1': 'Kliknite na ⋯ vpravo hore v záhlaví a otvorte „Nastavenia cestovného denníka“.',
  'help.guide.link-trip.step.2': 'Pod Synchronizované cesty kliknite na Pridať cestu.',
  'help.guide.link-trip.step.3': 'Vyhľadajte cestu podľa názvu alebo cieľa a kliknite na Pripojiť vedľa nej.',
  'help.guide.link-trip.result':
    'Miesta z cesty sa v časovej osi zobrazia ako návrhy v príslušných dňoch a pridajú sa do vrstvy Plán na mape spolu so stopami GPX.',
  'help.guide.link-trip.tip.1':
    'Kôš vedľa prepojenej cesty ju po potvrdení odpojí. Záznamy, ktoré ste napísali, zostanú.',
  'help.guide.link-trip.tip.2': 'Záznamy s dňom sa započítajú len raz, bez ohľadu na to, koľko ciest daný deň zahŕňa.',
  // share-public
  'help.guide.share-public.title': 'Verejné zdieľanie cestovného denníka',
  'help.guide.share-public.goal': 'Dajte ľuďom bez účtu TREK odkaz, cez ktorý si denník môžu len prečítať.',
  'help.guide.share-public.step.1':
    'Cez ⋯ v záhlaví otvorte „Nastavenia cestovného denníka“ a posuňte sa k časti „Verejné zdieľanie“.',
  'help.guide.share-public.step.2': 'Kliknite na „Vytvoriť odkaz na zdieľanie“.',
  'help.guide.share-public.step.3':
    'Vyberte, čo návštevníci uvidia: Časová os, Galéria a Mapa. Pod Mapa pridá Plán cesty naplánované miesta a trasy a Zaznamenané trasy pridá trasy dní, ktoré ste zaznamenali. Kopírovať skopíruje odkaz do schránky.',
  'help.guide.share-public.result':
    'Ktokoľvek s odkazom uvidí zapnuté sekcie a nič iné. Polia, ktoré ste vypli v Polia záznamu, zostanú skryté aj tam.',
  'help.guide.share-public.tip.1':
    'Fotky sa na verejnej mape zobrazia len vtedy, keď sú zapnuté Galéria aj Mapa. Pri vypnutej Mape server ich súradnice odstráni skôr, než fotky odošle.',
  'help.guide.share-public.tip.2': 'Kliknutím na Vymazať odkaz vedľa Kopírovať zdieľanie ukončíte.',
  // contributors
  'help.guide.contributors.title': 'Písať spoločne',
  'help.guide.contributors.goal': 'Umožnite ďalšiemu cestovateľovi pridávať vlastné záznamy a fotky.',
  'help.guide.contributors.step.1':
    'Cez ⋯ v hlavičke otvorte „Nastavenia cestovného denníka“ a nájdite „Prispievatelia“.',
  'help.guide.contributors.step.2':
    'Kliknite na Pozvať prispievateľa a vyhľadajte používateľa podľa mena alebo e-mailu.',
  'help.guide.contributors.step.3': 'Vyberte Divák alebo Editor a kliknite na Pozvať.',
  'help.guide.contributors.result':
    'Denník sa zobrazí v zozname danej osoby a pri jej záznamoch bude jej meno. Prispievateľa odoberiete krížikom × vedľa neho.',
  'help.guide.contributors.tip.1':
    'Prispievatelia sú pre ľudí na tejto inštancii TREK. Pre všetkých ostatných je tu verejný odkaz.',
  // studio
  'help.guide.studio.title': 'Rozloženie cestovného denníka ako fotoknihy',
  'help.guide.studio.goal': 'Premeňte denník na strany pripravené na tlač.',
  'help.guide.studio.step.1': 'V hlavičke kliknite na Studio. Návrhár sa otvorí nad cestovným denníkom.',
  'help.guide.studio.step.2':
    'Späť sa vrátite kliknutím na × na pravom konci hornej lišty. Ocitnete sa tam, kde ste boli.',
  'help.guide.studio.result':
    'Panel a jeho sekcie sú vľavo, dvojstrana na pracovnej ploche a vlastnosti vpravo. Automatické rozloženie zostaví knihu z vašich záznamov. Exportovať vytvorí PDF pripravené na tlač.',
  'help.guide.studio.tip.1': 'Studio potrebuje okno široké aspoň 1024 px a na telefóne sa neponúka.',
  'help.guide.studio.tip.2':
    'Kniha má rovnaké prístupové práva ako denník: kto môže denník čítať, môže knihu otvoriť, a kto ho môže upravovať, môže ju aj uložiť.',
  // archive-journey
  'help.guide.archive-journey.title': 'Archivácia alebo vymazanie cestovného denníka',
  'help.guide.archive-journey.goal': 'Uzavrite dokončený cestovný denník, alebo ho natrvalo vymažte.',
  'help.guide.archive-journey.step.1': 'Kliknutím na ⋯ vpravo hore v záhlaví otvoríte Nastavenia cestovného denníka.',
  'help.guide.archive-journey.step.2':
    'Dole „Archivovať cestu“ denník ukončí a označí ako archivovaný, „Obnoviť cestu“ ho obnoví. „Vymazať“ ho po potvrdení odstráni so všetkými záznamami a fotkami.',
  'help.guide.archive-journey.result':
    'Archivovaný denník si stále môžete prečítať aj zdieľať, len sa už neotvára na dnešnom dni.',
  'help.guide.archive-journey.tip.1':
    'Vymazanie sa nedá vrátiť späť a cesty, s ktorými bol denník prepojený, sa nezmenia.',
  'help.guide.archive-journey.tip.2': 'Obálka, názov a podnadpis sú v tom istom dialógu, hore.',
  'help.guide.journey-status.title': 'Nastavenie stavu denníka',
  'help.guide.journey-status.goal':
    'Označte cestovný denník sami ako koncept, prebiehajúci alebo dokončený, namiesto toho, aby sa riadil dátumami svojich ciest.',
  'help.guide.journey-status.step.1':
    'Kliknutím na ⋯ vpravo hore v záhlaví cestovného denníka otvoríte Nastavenia cestovného denníka.',
  'help.guide.journey-status.step.2': 'Pod Stav vyberte Koncept, Naživo alebo Dokončené. Voľba sa uloží okamžite.',
  'help.guide.journey-status.result':
    'Cestovný denník si ponechá stav, ktorý ste vybrali: Koncept a Dokončené sa zobrazia ako odznak na jeho karte a v jeho záhlaví a denník Naživo sa zobrazí v banneri navrchu zoznamu cestovných denníkov.',
  'help.guide.journey-status.tip.1':
    '„Automaticky“ sa znova riadi dátumami prepojených ciest. Bez prepojenej cesty zostane automatický denník konceptom.',
  'help.guide.journey-status.tip.2': 'Ručne nastavený stav zostane, kým ho nezmeníte, aj keď sa dátumy cesty zmenia.',

  // ── Screen: journey-studio ─────────────────────────────────────────────────
  'help.ctx.journey-studio.title': 'Studio', // same-as-en
  'help.ctx.journey-studio.summary':
    'TREK Studio rozloží denník do fotoknihy, ktorú môžete vytlačiť. Otvorí sa nad denníkom: panel a jeho sekcie sú vľavo, dvojstrana, na ktorej pracujete, uprostred a jej vlastnosti vpravo. Automatické rozloženie zostaví prvý návrh z vašich záznamov, motív dá knihe farby a písma a asistent s vami vie navrhovať strany. Potom môžete všetko presúvať, orezávať a prestylovať a každý krok sa dá vrátiť späť.',
  'help.ctx.journey-studio.bullet.1':
    'Horná lišta: vľavo obálka a názov denníka. Vpravo kto ďalší je v knihe a či je uložená, formát strany, späť, znova a vložiť, Automatické rozloženie, asistent, pomocník, Exportovať a tlačidlo, ktoré zavrie Studio.',
  'help.ctx.journey-studio.bullet.2':
    'Panel vľavo: Strany, Obsah (fotky a záznamy denníka), Rozloženia, Prvky (text, tvary, čiary, rámčeky, ikony a nálepky), Cesta (čísla, mapy, krajiny a značky vytvorené z denníka) a oddelene pod nimi Motív a Vrstvy.',
  'help.ctx.journey-studio.bullet.3':
    'Pracovná plocha: aktuálna dvojstrana so spadávkou a bezpečnými okrajmi a pod ňou lišta priblíženia s voľbami Prispôsobiť pohľadu, Zobrazenie knihy a Stiahnuť túto dvojstranu.',
  'help.ctx.journey-studio.bullet.4':
    'Vlastnosti vpravo: všetko o vybranom prvku, od polohy, veľkosti a orezania po farby, efekty, poradie vrstiev a zamknutie. Keď nie je vybraté nič, ukazujú pozadie stránky, motív, čísla strán a dokument.',
  'help.ctx.journey-studio.bullet.5':
    'Kniha je rozložená ako tlačená kniha: obálka, jedna prvá strana oproti prázdnej vnútornej strane obálky, dvojstrany, jedna posledná strana a zadná obálka. Čísla strán sa počítajú od prvej strany a tlačia sa tak, ako ich vidíte.',
  'help.ctx.journey-studio.bullet.6':
    'Navrhovať môže viac ľudí naraz: každý vidí kurzory ostatných s ich menami. Ak uložíte verziu, ktorú medzitým zmenil niekto iný, TREK zobrazí konflikt a jeho prácu neprepíše.',
  'help.ctx.journey-studio.bullet.7':
    'Motív: jeden vzhľad pre celú knihu, jej papier, atrament a tri akcentové farby, písma a motívy. Prvky prepojené s motívom ho nasledujú, keď ho zmeníte.',
  'help.ctx.journey-studio.bullet.8':
    'Asistent: tam, kde správca nastavil AI, otvorí bublina na hornej lište asistenta, ktorý s vami rozvrhuje strany, píše popisky a mení štýl knihy. Každá jeho zmena je krok, ktorý sa dá vrátiť späť.',
  // studio-auto-layout
  'help.guide.studio-auto-layout.title': 'Automatické vytvorenie knihy',
  'help.guide.studio-auto-layout.goal': 'Získajte jedným kliknutím kompletný prvý návrh zo záznamov a fotiek denníka.',
  'help.guide.studio-auto-layout.step.1': 'Na hornej lište kliknite na „Automatické rozloženie“.',
  'help.guide.studio-auto-layout.step.2':
    'Vyberte Celá kniha: nahradí všetky strany, ale zachová váš názov aj nastavenie strán. Táto dvojstrana znova zostaví iba dvojstranu na obrazovke. Ponúka sa len pri dvojstrane, ktorá vznikla zo záznamu.',
  'help.guide.studio-auto-layout.step.3':
    'Prezrite si panel strán. Ak sa vám predchádzajúca verzia páčila viac, Vrátiť späť zruší celé rozloženie.',
  'help.guide.studio-auto-layout.result':
    'Jedna dvojstrana na záznam, v poradí, s rozmiestnenými fotkami, názvom a textom. Každý prvok zostáva prepojený so svojím záznamom a aktualizuje sa s ním, kým ho neupravíte.',
  'help.guide.studio-auto-layout.tip.1':
    'Obe možnosti sú bežné kroky, ktoré sa dajú vrátiť späť, takže ich môžete pokojne vyskúšať.',
  'help.guide.studio-auto-layout.tip.2':
    'Keď automatické rozloženie prepojí prvok so záznamom, prvok sa pri úprave záznamu aktualizuje. Ak prvok zmeníte vo „Vlastnostiach“, prepojenie sa zruší.',
  // studio-pages
  'help.guide.studio-pages.title': 'Pridávanie, presúvanie a odstraňovanie dvojstrán',
  'help.guide.studio-pages.goal': 'Upravujte knihu stranu po strane.',
  'help.guide.studio-pages.step.1':
    'V paneli otvorte Strany. Náhľady ukazujú knihu po poradí: obálka, prvá strana, dvojstrany, posledná strana a zadná obálka. Prvá a posledná strana sú nakreslené vedľa prázdnej vnútornej strany svojej obálky, tak ako sa viazaná kniha otvára.',
  'help.guide.studio-pages.step.2':
    'Pridať dvojstranu dole vloží novú dvojstranu pred poslednú stranu. Znamienko + medzi dvoma náhľadmi vloží dvojstranu na túto pozíciu.',
  'help.guide.studio-pages.step.3':
    'Keď prejdete myšou nad náhľad, zobrazia sa jeho akcie: „Posunúť dopredu“, „Posunúť dozadu“, „Duplikovať dvojstranu“ a „Odstrániť dvojstranu“. Kliknutím na náhľad otvoríte danú dvojstranu na pracovnej ploche.',
  'help.guide.studio-pages.result':
    'Obálka, prvá a posledná strana a zadná obálka zostanú na svojom mieste. Nové dvojstrany sa vždy pridajú medzi ne.',
  'help.guide.studio-pages.tip.1':
    '„Zobrazenie knihy“ na hornej lište ukáže celú knihu po hárkoch, tak ako bude zviazaná.',
  'help.guide.studio-pages.tip.2': 'Čísla strán zapnete vo Vlastnosti v časti Dokument, keď nie je nič vybraté.',
  // studio-layouts
  'help.guide.studio-layouts.title': 'Použiť rozloženie na dvojstranu',
  'help.guide.studio-layouts.goal': 'Dajte dvojstrane hotové rozloženie rámčekov pre fotky a text.',
  'help.guide.studio-layouts.step.1':
    'V paneli otvorte Rozloženia. Najprv sú navrhnuté strany: celé obálky a dvojstrany v motíve knihy, ktoré tlačidlá štýlu zúžia na jeden vzhľad. Moje rozloženia a Vstavané nasledujú pod nimi v rovnakej mriežke.',
  'help.guide.studio-layouts.step.2':
    'Kliknite na jedno z nich. Dvojstrana na pracovnej ploche dostane rámčeky tohto rozloženia a vaše existujúce fotky a texty sa do nich umiestnia.',
  'help.guide.studio-layouts.result':
    'Prázdne rámčeky sú zástupné miesta pre obsah: presuňte na jeden z nich fotku z Obsah, alebo použite Pridať na túto stranu.',
  'help.guide.studio-my-layouts.title': 'Uloženie strany ako vlastného rozloženia',
  'help.guide.studio-my-layouts.goal': 'Použite znova usporiadanie, ktoré ste vytvorili na iných stranách knihy.',
  'help.guide.studio-my-layouts.step.1': 'Usporiadajte stranu podľa seba a potom v paneli otvorte Rozloženia.',
  'help.guide.studio-my-layouts.step.2':
    'Kliknite na Uložiť túto stranu ako rozloženie v časti Moje rozloženia. Strana sa v zozname zobrazí ako karta.',
  'help.guide.studio-my-layouts.tip.1':
    'Kliknutím na svoje rozloženie na inej strane ju usporiadate rovnako, s jej vlastnými fotkami a textami.',
  'help.guide.studio-my-layouts.result':
    'Vaše rozloženia sa ukladajú s knihou a ponúkajú sa na stranách rovnakého druhu: rozloženia obálky pre obálky, rozloženia dvojstrany pre dvojstrany.',
  'help.guide.studio-layouts.tip.1': 'Použitie rozloženia sa dá vrátiť späť ako každý iný krok.',
  // studio-content
  'help.guide.studio-content.title': 'Umiestnenie fotiek a záznamov na stranu',
  'help.guide.studio-content.goal': 'Pridajte na dvojstranu fotky a záznamy z cestovného denníka.',
  'help.guide.studio-content.step.1':
    'V bočnom paneli otvorte Obsah. Fotky zobrazí všetky obrázky cestovného denníka. Záznamy zobrazí záznamy s ich textom.',
  'help.guide.studio-content.step.2':
    'Pretiahnite fotku na dvojstranu alebo do prázdneho rámčeka, prípadne kliknite pod ňou na „Pridať na túto stranu“. Cez „Nahrať fotky“ pridáte obrázky, ktoré v cestovnom denníku ešte nie sú; From Immich alebo From Synology ich vyberie z pripojenej knižnice.',
  'help.guide.studio-content.step.3':
    'Pod záznamom Názov, Príbeh a Miesto vložia daný text na stranu ako textový prvok. Dátum a súradnice sa pridajú ako značky a fotky záznamu sú uvedené tam tiež.',
  'help.guide.studio-content.result':
    'Pustená fotka sa stane prvkom s fotkou. Text zostáva prepojený so záznamom, kým ho neupravíte.',
  'help.guide.studio-theme.title': 'Dať knihe motív',
  'help.guide.studio-theme.goal': 'Nastavte farby a písma celej knihy naraz.',
  'help.guide.studio-theme.step.1':
    'V paneli otvorte Motív. Každá karta ukazuje motív ako malú stranu: jeho papier, písmo a tri akcentové farby.',
  'help.guide.studio-theme.step.2':
    'Kliknutím na motív ho vyskúšate. Pod kartami môžete zmeniť jeho paletu, vybrať iné písma a zvoliť motívy a dekoráciu.',
  'help.guide.studio-theme.step.3':
    'Kliknite na Použiť na knihu, alebo na Použiť na túto stranu pre dvojstranu na obrazovke.',
  'help.guide.studio-theme.tip.1':
    'Prvky prepojené s motívom preberajú jeho farby a písma a nasledujú ho, keď ho zmeníte. Prestylovať aj to, čo ešte nie je prepojené, najprv prepojí zvyšok.',
  'help.guide.studio-theme.tip.2': 'Farby z fotiek zostaví paletu z obrázkov denníka.',
  'help.guide.studio-theme.result':
    'Všetky prepojené farby a písma v knihe sa zmenia naraz a použitie motívu je jeden krok, ktorý sa dá vrátiť späť.',
  'help.guide.studio-content.tip.1': 'Vyhľadávacie pole v hornej časti panela „Obsah“ filtruje oba zoznamy.',
  'help.guide.studio-content.tip.2':
    'Keď súbor z počítača pretiahnete na pracovnú plochu, TREK ho naraz nahrá aj umiestni.',
  // studio-elements
  'help.guide.studio-elements.title': 'Pridanie textu, tvarov, ikon a nálepiek',
  'help.guide.studio-elements.goal': 'Doplňte dvojstranu okrem fotiek a príbehov aj o ozdoby.',
  'help.guide.studio-elements.step.1':
    'V paneli otvorte Prvky. Šesť kariet triedi, čo môžete pridať: Text, Tvary, Čiary, Rámčeky, Ikony a Nálepky.',
  'help.guide.studio-elements.step.2':
    'Kliknite na štýl textu alebo navrhnutý nadpis, tvar, čiaru, prázdny rámček, ikonu či nálepku. Každý prvok sa umiestni do stredu dvojstrany a potom ním môžete hýbať.',
  'help.guide.studio-elements.result':
    'Do textového prvku začnete písať dvojitým kliknutím. Vo „Vlastnostiach“ nastavíte písmo, rez, veľkosť, rozostupy a zarovnanie.',
  'help.guide.studio-stickers.title': 'Ozdobenie nálepkami',
  'help.guide.studio-stickers.goal': 'Pridajte ilustrácie, od pamätihodností a jedla po zvieratá a šípky.',
  'help.guide.studio-stickers.step.1': 'V paneli otvorte Prvky a vyberte Nálepky.',
  'help.guide.studio-stickers.step.2':
    'Vyhľadajte slovo alebo prechádzajte police a kliknutím na nálepku ju umiestnite na dvojstranu.',
  'help.guide.studio-stickers.tip.1': 'Pri vybratej nálepke vo Vlastnostiach prefarbíte jej časti a zrkadlíte ju.',
  'help.guide.studio-stickers.result': 'Nálepka je kresba, takže zostáva ostrá v akejkoľvek veľkosti.',
  'help.guide.studio-elements.tip.1': 'Rámčeky sú prázdne miesta na fotky, obrázok do nich vložíte neskôr.',
  // studio-travel
  'help.guide.studio-travel.title': 'Pridanie máp, čísel, krajín a značiek',
  'help.guide.studio-travel.goal': 'Premeňte samotný denník na navrhnuté prvky na strane.',
  'help.guide.studio-travel.step.1':
    'V paneli otvorte Cesta. Štyri karty triedia, čo môžete pridať: Čísla, Mapy, Krajiny a Značky.',
  'help.guide.studio-travel.step.2':
    'Každá karta ukazuje prvok s číslami vášho denníka vo farbách motívu: súhrn ako plagát, lístok, dopravnú značku alebo počítadlo kilometrov, mapu s očíslovanými zastávkami alebo orezanú na jednu krajinu, krajinu ako pečiatku, pohľadnicu alebo špendlík, dátum či vzdialenosť ako pečiatku, štítok alebo stuhu.',
  'help.guide.studio-travel.step.3':
    'Kliknite na kartu. Prvok sa umiestni do stredu dvojstrany a potom ho môžete presunúť a zmeniť jeho veľkosť.',
  'help.guide.studio-travel.result':
    'Prvok sa zobrazí na dvojstrane. Vlastnosti menia jeho vzhľad a každé číslo, mapa i krajina sa aktualizujú, keď sa zmení denník.',
  'help.guide.studio-text-effects.title': 'Pridanie efektov k textu',
  'help.guide.studio-text-effects.goal': 'Dajte nadpisu obrys, tieň, oblúk alebo písmená vyplnené vzorom.',
  'help.guide.studio-text-effects.step.1': 'Kliknutím na textový prvok na strane ho vyberiete.',
  'help.guide.studio-text-effects.step.2':
    'Vo Vlastnostiach otvorte Efekty a pridajte obrys, tieň alebo zvýraznenie, alebo vyplňte písmená prechodom či vzorom. Veľkosť písmen a umiestnenie zakrivia riadok a prispôsobia ho rámčeku.',
  'help.guide.studio-text-effects.tip.1':
    'Prispôsobiť rámčeku zmenšuje text, kým sa nezmestí do rámčeka, takže dlhý nadpis nikdy nepretečie.',
  'help.guide.studio-text-effects.result': 'Efekt sa kreslí spolu s textom, v tlači rovnako ako na obrazovke.',
  'help.guide.studio-background.title': 'Zmena pozadia strany',
  'help.guide.studio-background.goal': 'Vyfarbite stranu farbou, prechodom alebo vzorom, alebo pod ňu položte fotku.',
  'help.guide.studio-background.step.1':
    'Kliknite na prázdne miesto strany, aby nebolo nič vybraté. Pozadie stránky je hore vo Vlastnostiach.',
  'help.guide.studio-background.step.2':
    'Vyberte Papier, Plná, Prechod alebo Vzor a farbu, alebo kliknite na fotku v časti Fotka ako pozadie.',
  'help.guide.studio-background.tip.1': 'Použiť na všetky stránky dá všetkým stranám knihy rovnaké pozadie.',
  'help.guide.studio-background.result': 'Pozadie zasahuje do spadávky, takže sa tlačí až po okraj strany.',
  'help.guide.studio-layers.title': 'Usporiadanie, skrývanie a zamykanie pomocou vrstiev',
  'help.guide.studio-layers.goal': 'Pozrite si všetko na dvojstrane v poradí vrstiev a pracujte s tým priamo tam.',
  'help.guide.studio-layers.step.1': 'V paneli otvorte Vrstvy. Horná časť zoznamu je predná strana stránky.',
  'help.guide.studio-layers.step.2':
    'Potiahnutím riadka zmeníte poradie, okom prvok skryjete a zámkou ho udržíte na mieste. Vyberte ich viac a zoskupte ich, aby sa pohybovali spolu.',
  'help.guide.studio-layers.tip.1': 'Dvojitým kliknutím na riadok dáte prvku vlastný názov.',
  'help.guide.studio-layers.tip.2': 'Skryté prvky sa do PDF nedostanú.',
  'help.guide.studio-layers.result': 'Plné strany sa naďalej ľahko upravujú a hotové časti sa nedajú posunúť omylom.',
  'help.guide.studio-travel.tip.1':
    'V Mapách zoznam Zastávky obsahuje každú zastávku trasy. Vypnite jednu, aby sa vynechala z máp a čísel, napríklad domáce letisko.',
  'help.guide.studio-travel.tip.2':
    'Mapa krajiny ukazuje len zastávky tejto krajiny, takže krajina vyplní stranu, aj keď cesta začala dlhým letom.',
  // studio-properties
  'help.guide.studio-properties.title': 'Úprava vybraného prvku',
  'help.guide.studio-properties.goal':
    'Presúvajte, orezávajte, upravujte vzhľad a poradie vrstiev prvku pomocou inšpektora.',
  'help.guide.studio-properties.step.1':
    'Kliknite na prvok na dvojstrane. Zobrazia sa úchyty na zmenu veľkosti a otáčanie. Ťahaním prvok presuniete.',
  'help.guide.studio-properties.step.2':
    '„Vlastnosti“ vpravo zobrazujú nastavenia vybranej položky: polohu a veľkosť, „Orezať“ s ohniskom, ktoré určuje, čo zostane v zábere, „Vyplniť“ alebo „Prispôsobiť“, filtre „Vzhľad“, zaoblenie rohov, štýl rámčeka, poradie vrstiev a „Zamknúť“.',
  'help.guide.studio-properties.step.3':
    'Duplikovať a Vymazať nájdete v hornej časti inšpektora. Vrátiť späť na hornej lište zruší ktorúkoľvek z týchto zmien.',
  'help.guide.studio-properties.result':
    'Zamknutý prvok sa na strane nedá vybrať ani presunúť. Hotové rozloženie je tak chránené, kým pracujete s ostatnými prvkami.',
  'help.guide.studio-properties.tip.1':
    'Kliknutím so stlačeným Shift vyberiete viac prvkov. Inšpektor ich potom upravuje spoločne.',
  'help.guide.studio-properties.tip.2':
    'Keď upravíte prvok, ktorý umiestnilo automatické rozloženie, prestane byť prepojený so záznamom a neskoršie zmeny záznamu sa v ňom už neprejavia.',
  // studio-format
  'help.guide.studio-format.title': 'Výber formátu strany',
  'help.guide.studio-format.goal': 'Nastavte tlačovú veľkosť knihy skôr, než vytvoríte rozloženie.',
  'help.guide.studio-format.step.1':
    'Kliknite na formát strany na hornej lište, vedľa nástrojov na úpravy. Ukazuje názov a tvar formátu.',
  'help.guide.studio-format.step.2':
    'Vyberte Štvorec 21 × 21 cm, Štvorec 30 × 30 cm, A4 alebo A5 na šírku či na výšku, alebo zadajte vlastnú šírku a výšku v milimetroch. Spadávka a bezpečný okraj sú pod tým.',
  'help.guide.studio-format.result':
    'Každá dvojstrana sa zobrazí v tejto veľkosti, predvolene so spadávkou 3 mm a bezpečným okrajom 5 mm.',
  'help.guide.studio-format.tip.1':
    'Najprv zmeňte formát a potom spustite Automatické rozloženie. Automatické rozloženie použije formát, ktorý je nastavený v čase spustenia.',
  'help.guide.studio-format.tip.2':
    'Spýtajte sa v tlačiarni na ich hodnoty spadávky a bezpečného okraja a zadajte ich.',
  // studio-export
  'help.guide.studio-export.title': 'Export knihy do PDF',
  'help.guide.studio-export.goal': 'Získajte súbor pripravený na tlač, alebo taký na čítanie na obrazovke.',
  'help.guide.studio-export.step.1': 'Na hornej lište kliknite na Exportovať.',
  'help.guide.studio-export.step.2':
    'Vyberte Jednotlivé strany, teda jednu stranu na list v poradí čítania, čo potrebuje tlačiareň, alebo Dvojstrany, teda dve strany naraz tak, ako sa kniha otvára. Orezové značky pridajú spadávku na každom okraji a ukážu, kde rezať.',
  'help.guide.studio-export.step.3':
    'Kliknite na Náhľad tlače. Prehliadač otvorí strany. Súbor vytvoríte voľbou Uložiť ako PDF.',
  'help.guide.studio-export.result':
    'PDF s toľkými hárkami, koľko dialóg oznámil, vo formáte strany, ktorý ste nastavili.',
  'help.guide.studio-export.tip.1': 'PDF vytvoríte, rovnako ako celé Studio, len na počítači.',
  'help.guide.studio-export.tip.2':
    'Na kontrolu exportujte „Dvojstrany“ bez orezových značiek, do tlačiarne „Jednotlivé strany“ so značkami.',
  // studio-spread-file
  'help.guide.studio-spread-file.title': 'Použitie dvojstrany v inej knihe',
  'help.guide.studio-spread-file.goal':
    'Skopírujte dizajn, ktorý sa vám páči, z knihy jedného cestovného denníka do druhého.',
  'help.guide.studio-spread-file.step.1':
    'Keď je dvojstrana na pracovnej ploche, kliknite na Stiahnuť túto dvojstranu na pravom konci lišty priblíženia. Súbor obsahuje dizajn, nie fotky.',
  'help.guide.studio-spread-file.step.2':
    'V druhej knihe otvorte Strany, kliknite na Importovať vedľa Pridať dvojstranu a vyberte súbor.',
  'help.guide.studio-spread-file.result':
    'Dvojstrana sa importuje aj s rámčekmi a štýlmi textu. Vložte do rámčekov fotky z nového denníka.',
  'help.guide.studio-spread-file.tip.1': 'Ak súbor nie je návrhom dvojstrany, TREK ho odmietne a uvedie dôvod.',

  // ── Screen: settings (all tabs) ────────────────────────────────────────────
  'help.ctx.settings.title': 'Nastavenia',
  'help.ctx.settings.summary':
    'Vaše osobné nastavenia, pre každú tému jedna karta v bočnom paneli vľavo. Väčšina prepínačov sa použije hneď po prepnutí. Formulár s tlačidlom Uložiť sa uloží, až keď kliknete na Uložiť. Nič z toho, čo tu zmeníte, nemení TREK nikomu inému.',
  'help.ctx.settings.bullet.1':
    'Bočný panel vľavo: Všeobecné, Vzhľad, Mapa, Oznámenia, Integrácie, Offline a Účet. Pluginy sa zobrazia, keď je aktívny nejaký plugin. O aplikácii sa zobrazí, pokiaľ ju prevádzkovateľ neskryl. Verzia je úplne dole.',
  'help.ctx.settings.bullet.2':
    'Všeobecné sa otvorí ako prvé. Obsahuje jazyk, jazyk názvov miest, jednotky, formát času, začiatok týždňa a zobrazovanú menu, ako aj správanie mapy cesty. Vzhľad obsahuje motív, farby, čitateľnosť, veľkosť písma a widgety na prehľade.',
  'help.ctx.settings.bullet.3':
    '„Mapa“ nastavuje mapový engine a jeho štýl; „Oznámenia“ určujú, ktoré udalosti idú na ktorý kanál; „Integrácie“ pripájajú knižnice fotiek, AirTrail, Dawarich a wanderer a nájdete tu aj kľúče API a MCP; „Offline“ určuje, čo si toto zariadenie ukladá.',
  'help.ctx.settings.bullet.4':
    'Účet obsahuje váš profil, heslo, dvojfaktorové overenie, prístupové kľúče a možnosť zmazať účet.',
  'help.ctx.settings-display.title': 'Všeobecné',
  'help.ctx.settings-display.summary':
    'S čím sa TREK otvára, aký jazyk a jednotky používa a ako sa správa mapa cesty a rezervácie. Každá zmena sa použije hneď.',
  'help.ctx.settings-display.bullet.1':
    'Spustenie: Úvodná stránka sa otvára na Prehľad alebo na Aktívna cesta. Pri Aktívna cesta vyberá Úvodná karta kartu, na ktorej sa táto cesta otvorí.',
  'help.ctx.settings-display.bullet.2':
    'Jazyk a región: Zobrazovaná mena (alebo Mena cesty, ak žiadnu nechcete), Jazyk, Názvy miest, Jednotky teploty, Jednotky vzdialenosti, Formát času a Týždeň začína.',
  'help.ctx.settings-display.bullet.3':
    'Cestovanie a mapa: „Otvárať miesta v“, „Dátum na začiatku nadpisov dní“, „Popisky trás rezervácií“, „Vždy zobrazovať trasy rezervácií“, „Kompaktné značky pre nenaplánované miesta“, „Objavovať miesta na mape“, „Skryť rezervačné kódy“ a „Optimalizovať trasu od ubytovania“.',
  'help.ctx.settings-appearance.title': 'Vzhľad',
  'help.ctx.settings-appearance.summary':
    'Ako TREK vyzerá v tomto účte: svetlý alebo tmavý režim, farba akcentu, sklo a pohyb, veľkosť písma a to, ktoré widgety sa zobrazujú na prehľade. Všetko sa uplatní okamžite na každom zariadení, na ktorom sa prihlásite.',
  'help.ctx.settings-appearance.bullet.1':
    'Motív: Farebný režim (Svetlé, Tmavý alebo Automatické), Farebná schéma a pri Vlastné váš vlastný akcent pre svetlý a tmavý režim s kontrolou kontrastu.',
  'help.ctx.settings-appearance.bullet.2':
    'Čitateľnosť, označená ako Experimentálne: Priehľadnosť, Obmedziť pohyb, Hustota a Veľkosť písma s jedným posuvníkom pre Všetko a ďalším pre každú z možností Veľká, Stredná, Normálne a Malá.',
  'help.ctx.settings-appearance.bullet.3':
    'Widgety na prehľade: samostatné prepínače pre Počítač (Pod hlavičkou, Pravý bočný panel) a Mobil (Pod hlavičkou, Dole na stránke).',
  'help.ctx.settings-appearance.bullet.4': '„Obnoviť predvolené“ pod kartami vráti celú kartu na predvolené hodnoty.',
  'help.ctx.settings-map.title': 'Mapa',
  'help.ctx.settings-map.summary':
    'Ktorý engine kreslí mapy plánovača ciest a denníka a v akom štýle. Leaflet je klasická rastrová mapa, Mapbox GL pridáva 3D budovy a terén s vlastným tokenom a MapLibre GL kreslí vektorové dlaždice OpenFreeMap bez tokenu. Atlas vždy používa Leaflet.',
  'help.ctx.settings-map.bullet.1':
    'Poskytovateľ mapy: Leaflet, Mapbox GL (Experimentálne) alebo MapLibre GL, každá možnosť s krátkym popisom.',
  'help.ctx.settings-map.bullet.2':
    'Šablóna mapy a CARTO API kľúč pre Leaflet, Štýl mapy pre oba GL enginy a k tomu Mapbox prístupový token pre Mapbox GL.',
  'help.ctx.settings-map.bullet.3':
    'Iba pre Mapbox GL: „3D budovy a terén“ a „Režim vysokej kvality“. Nad tlačidlom „Uložiť nastavenia mapy“ je živý náhľad. Týmto tlačidlom voľbu uložíte.',
  'help.ctx.settings-notifications.title': 'Oznámenia',
  'help.ctx.settings-notifications.summary':
    'Ako vás TREK kontaktuje mimo aplikácie. Navrchu tabuľka s jedným riadkom pre každú udalosť a jedným stĺpcom pre každý kanál určuje, čo sa kam posiela. Pod ňou sú karty pre webhook, ntfy, push v tomto zariadení a všetky kanály z doplnkov.',
  'help.ctx.settings-notifications.bullet.1':
    'Oznámenia: každú udalosť zapnite alebo vypnite zvlášť pre každý kanál. Zámok znamená, že správca to vypol pre všetkých.',
  'help.ctx.settings-notifications.bullet.2':
    'URL webhooku: webhook pre Discord, Slack alebo vlastný, s tlačidlami Testovať a Uložiť.',
  'help.ctx.settings-notifications.bullet.3':
    'Ntfy: „Téma Ntfy“, voliteľne „URL servera Ntfy“ a prístupový token, s tlačidlami „Testovať“ a „Uložiť“.',
  'help.ctx.settings-notifications.bullet.4':
    'Push oznámenia v tomto zariadení: Zapnúť pre toto zariadenie platí iba pre tento prehliadač. Odoslať test pošle testovacie oznámenie. Kanál z doplnku ukazuje Nastaviť, kým nie je nastavený.',
  'help.ctx.settings-integrations.title': 'Integrácie',
  'help.ctx.settings-integrations.summary':
    'Všetko, čo sa zvonku pripája k TREK: knižnice fotiek pre denník, AirTrail pre lety, Dawarich pre to, kde ste naozaj boli, wanderer pre trasy, API kľúče len na čítanie pre iný softvér a MCP pre AI klientov. Pripojenie k inej službe sa zobrazí, až keď ho správca zapne.',
  'help.ctx.settings-integrations.bullet.1':
    'Immich a Synology Photos, AirTrail, Dawarich a wanderer: každá karta má svoju adresu a kľúč, tlačidlá Uložiť a Otestovať pripojenie a odznak Pripojené alebo Nepripojené.',
  'help.ctx.settings-integrations.bullet.2':
    'API kľúče: kľúče iba na čítanie pre verejné API, každý obmedzený na oblasti, ktoré zvolíte, s endpointom na skopírovanie.',
  'help.ctx.settings-integrations.bullet.3':
    'Konfigurácia MCP: MCP endpoint a pod Klienti OAuth 2.1 vaši registrovaní klienti, Konfigurácia klienta na skopírovanie a Aktívne relácie OAuth s tlačidlom Odvolať.',
  'help.ctx.settings-integrations.bullet.4':
    'API tokeny: starší spôsob pripojenia k MCP, označený ako Zastarané. Použite radšej Klienti OAuth 2.1.',
  'help.ctx.settings-offline.title': 'Offline', // same-as-en
  'help.ctx.settings-offline.summary':
    'Čo TREK ukladá v tomto zariadení, aby sa cesta otvorila aj bez pripojenia, a čo sa stane, keď je zmena urobená offline v konflikte so zmenou urobenou inde.',
  'help.ctx.settings-offline.bullet.1':
    'Offline režim: „Vynútiť offline režim“ najprv všetko stiahne, potom pracuje iba z vyrovnávacej pamäte a vaše zmeny zaraďuje do frontu.',
  'help.ctx.settings-offline.bullet.2':
    'Príprava na offline: Stiahnuť pre offline použitie načíta údaje ciest, dokumenty a mapové dlaždice. Synchronizovať teraz spustí synchronizáciu ručne znova.',
  'help.ctx.settings-offline.bullet.3':
    'Čo ukladať offline: Ukladať mapové dlaždice offline a prepínač pre každú cestu. Skončená cesta sa uloží len vtedy, keď ju zapnete.',
  'help.ctx.settings-offline.bullet.4':
    'Konflikty synchronizácie sa zobrazia len vtedy, keď sa dve zmeny dostanú do konfliktu, s možnosťami Moju verziu, Zachovať ich a Keď dôjde ku konfliktu. Offline vyrovnávacia pamäť uvádza počet ciest a čakajúcich alebo neúspešných zmien, s tlačidlami Skúsiť znova, Zahodiť a Vymazať vyrovnávaciu pamäť.',
  'help.ctx.settings-account.title': 'Účet',
  'help.ctx.settings-account.summary':
    'Váš účet v tomto TREK a spôsob prihlásenia: profilový obrázok, používateľské meno a e-mail, heslo, dvojfaktorové overenie a prístupové kľúče. „Zmazať účet“ nájdete v päte karty „Účet“.',
  'help.ctx.settings-account.bullet.1':
    'Účet: kliknutím na fotoaparát na obrázku nahráte nový obrázok a červeným košom ho odstránite. Používateľské meno a E-mail sa ukladajú tlačidlom Uložiť profil.',
  'help.ctx.settings-account.bullet.2':
    'Zmeniť heslo: súčasné heslo, nové heslo dvakrát, pričom sa počas písania odškrtávajú pravidlá, a potom Aktualizovať heslo. Ak sa do tohto TREK prihlasuje iba cez SSO, karta sa nezobrazí.',
  'help.ctx.settings-account.bullet.3':
    'Dvojfaktorové overenie (2FA) s autentifikačnou aplikáciou a záložnými kódmi. Prístupové kľúče na prihlásenie bez hesla.',
  'help.ctx.settings-account.bullet.4':
    'Zmazať účet je vľavo v päte karty Účet a pýta si potvrdenie. Jediný správca sa nemôže zmazať.',
  // language-region
  'help.guide.language-region.title': 'Nastavenie jazyka, jednotiek a meny',
  'help.guide.language-region.goal': 'Používajte TREK vo svojom jazyku a s formátmi svojho regiónu.',
  'help.guide.language-region.step.1':
    'Pod Jazyk a región vyberte Jazyk z radu čipov. TREK sa prepne okamžite, na každom zariadení, na ktorom ste prihlásený.',
  'help.guide.language-region.step.2':
    'Názvy miest určujú jazyk, v ktorom sa zobrazuje vyhľadávanie miest, návrhy a adresy. Rovnako ako aplikácia sa riadi jazykom rozhrania.',
  'help.guide.language-region.result':
    'Dátumy, vzdialenosti a peniaze sa zobrazujú v takom formáte, na aký ste zvyknutí. V časti Náklady sa sumy zobrazujú vo vašej zobrazovanej mene, len na zobrazenie. Zadané sumy sa nemenia.',
  'help.guide.language-region.tip.1': 'Mena cesty zobrazí každú cestu v jej vlastnej mene, bez prepočtu.',
  'help.guide.language-region.tip.2':
    'Podľa jazyka sa nastavia aj názvy dní a mesiacov v module Dovolenka (Vacay) a v denníku.',
  // travel-map-prefs
  'help.guide.travel-map-prefs.title': 'Nastavenie mapy cesty a nadpisov dní',
  'help.guide.travel-map-prefs.goal': 'Vyberte, čo mapa cesty ukazuje a ako vyzerajú záhlavia dní, pri každej ceste.',
  'help.guide.travel-map-prefs.step.1':
    'V Cestovanie a mapa určuje Otvárať miesta v mapovú aplikáciu, ktorú tlačidlo navigácie otvorí rovno. Zakaždým sa opýtať vám necháva výber aplikácie pri každom otvorení. Dátum na začiatku nadpisov dní zobrazí v nadpise každého dňa najprv kalendárny dátum.',
  'help.guide.travel-map-prefs.step.2':
    'Vždy zobrazovať trasy rezervácií nakreslí na mape každý let, vlak a ďalšie rezervácie. Popisky trás rezervácií pridajú na každý koniec názov stanice alebo letiska. Kompaktné značky pre nenaplánované miesta zmenšia miesta, ktoré ešte nie sú zaradené do dňa, takže naplánované zastávky lepšie vynikną.',
  'help.guide.travel-map-prefs.result':
    'Mapa cesty používa tieto nastavenia pri každej ceste, kým ich znova nezmeníte.',
  'help.guide.travel-map-prefs.tip.1':
    'Tieto nastavenia platia pre účet, nie pre cestu. Každý člen zdieľanej cesty vidí svoje vlastné voľby.',
  'help.guide.travel-map-prefs.tip.2':
    'Správca môže nastaviť predvolené hodnoty pre všetkých. Čo prepnete tu, platí len pre vás.',
  // startup
  'help.guide.startup.title': 'Čo sa po spustení TREK otvorí',
  'help.guide.startup.goal':
    'Nechajte TREK otvárať sa na stránke, ktorú používate najčastejšie, a nie zakaždým na prehľade.',
  'help.guide.startup.step.1':
    'Navrchu v časti Všeobecné nastavte pod Spustenie Úvodná stránka na Prehľad alebo Aktívna cesta.',
  'help.guide.startup.step.2':
    'Pri Aktívna cesta sa zobrazí Úvodná karta: vyberte kartu, na ktorej sa táto cesta otvorí.',
  'help.guide.startup.result': 'Pri ďalšom otvorení sa TREK otvorí priamo na tejto stránke.',
  'help.guide.startup.tip.1':
    'Aktívna cesta je cesta, ktorá prebieha dnes, alebo najbližšia nadchádzajúca. Je to tá istá cesta, ktorú prehľad zobrazuje navrchu.',
  // theme-scheme
  'help.guide.theme-scheme.title': 'Nastavenie motívu a farby zvýraznenia',
  'help.guide.theme-scheme.goal': 'Nastavte TREK na svetlý, tmavý alebo podľa zariadenia, vo farbe, ktorá sa vám páči.',
  'help.guide.theme-scheme.step.1':
    'Pod Motív nastavte Farebný režim na Svetlé, Tmavý alebo Automatické. Automatické sa riadi vaším zariadením.',
  'help.guide.theme-scheme.step.2':
    'Vyberte Farebná schéma: Predvolené, Vysoký kontrast, Indigová, Zelenomodrá, Ružová, Jantárová, Fialová alebo Vlastné.',
  'help.guide.theme-scheme.step.3':
    'Pri Vlastné vyberte jednu z farebných bodiek alebo nastavte vlastný akcent zvlášť pre Svetlé a Tmavý. Štítok vedľa nich ukazuje Dobrý kontrast alebo Nízky kontrast.',
  'help.guide.theme-scheme.result':
    'Tlačidlá, odkazy a zvýraznenia všade používajú akcentovú farbu, na každom zariadení, na ktorom sa prihlásite.',
  'help.guide.theme-scheme.tip.1':
    'V navigačnej lište je aj rýchly prepínač svetlého a tmavého režimu. Nastavuje ten istý motív.',
  'help.guide.theme-scheme.tip.2': 'Ak je predvolená schéma príliš zle čitateľná, vyberte schému Vysoký kontrast.',
  // readability
  'help.guide.readability.title': 'Úprava čitateľnosti a veľkosti písma',
  'help.guide.readability.goal': 'Zapnite menej sklených efektov a animácií, viac priestoru alebo väčšie písmo.',
  'help.guide.readability.step.1':
    'V časti „Čitateľnosť“ zmení „Priehľadnosť“ sklenené panely na plné plochy, „Obmedziť pohyb“ obmedzí animácie a v „Hustota“ si vyberiete „Pohodlná“ alebo „Kompaktná“.',
  'help.guide.readability.step.2':
    'Veľkosť písma: posuvníkom „Všetko“ zmeníte celý text naraz, prípadne nastavte „Veľká“, „Stredná“, „Normálne“ a „Malá“ jednotlivo. Každá veľkosť má ukážku, takže výsledok vidíte hneď pri posúvaní.',
  'help.guide.readability.result': 'Zmena sa prejaví v celej aplikácii naraz, vrátane panelov mapy a denníka.',
  'help.guide.readability.tip.1':
    'Niektoré časti TREK už používajú menej animácií, keď je vaše zariadenie nastavené na obmedzenie pohybu. Obmedziť pohyb obmedzí animácie aj v ostatných častiach.',
  'help.guide.readability.tip.2':
    'Veľkosť písma sa uplatňuje cez typografické úrovne, takže sa nič neorezáva. Text, ktorý sa už nezmestí, sa zalomí.',
  // dashboard-widgets
  'help.guide.dashboard-widgets.title': 'Vybrať widgety na prehľade',
  'help.guide.dashboard-widgets.goal':
    'Zobrazte iba widgety, ktoré používate, zvlášť na počítači a zvlášť na telefóne.',
  'help.guide.dashboard-widgets.step.1':
    'Pod Widgety na prehľade uvádza Počítač widgety Pod hlavičkou a Pravý bočný panel. Vypnutím Pravý bočný panel sa skryje celý stĺpec a prehľad sa vycentruje. Jeho widgety sú stlmené, kým ho znova nezapnete.',
  'help.guide.dashboard-widgets.step.2':
    'Pre prehľad na telefóne má „Mobil“ vlastné prepínače: „Pod hlavičkou“ a „Dole na stránke“.',
  'help.guide.dashboard-widgets.result':
    'Prehľad sa zmení okamžite. Ak je pravý bočný panel vypnutý, prehľad sa vycentruje.',
  'help.guide.dashboard-widgets.tip.1': 'Widgety doplnku sa zobrazujú, len kým má administrátor daný doplnok zapnutý.',
  'help.guide.dashboard-widgets.tip.2':
    'Samotný prehľad si na každom zariadení pamätá zobrazenie v mriežke alebo zozname a zoradenie.',
  // map-provider
  'help.guide.map-provider.title': 'Výber mapového enginu a štýlu',
  'help.guide.map-provider.goal': 'Prepínajte medzi klasickou mapou, vektorovými dlaždicami a 3D mapou Mapbox.',
  'help.guide.map-provider.step.1':
    'Pod Poskytovateľ mapy vyberte Leaflet pre klasickú 2D mapu s ľubovoľnými rastrovými dlaždicami, Mapbox GL pre vektorové dlaždice s 3D budovami a terénom, alebo MapLibre GL pre vektorové dlaždice OpenFreeMap bez tokenu.',
  'help.guide.map-provider.step.2':
    'Vyberte Šablóna mapy pre Leaflet alebo Štýl mapy pre GL engine, alebo vložte vlastnú URL. Mapbox GL potrebuje Mapbox prístupový token, šablóny CARTO potrebujú CARTO API kľúč. Odkaz pod každým poľom vedie na miesto, kde ho získate.',
  'help.guide.map-provider.step.3':
    'Pri Mapbox GL zapnite „3D budovy a terén“ a ak je vaše zariadenie dosť výkonné, aj „Režim vysokej kvality“. Skontrolujte náhľad a kliknite na „Uložiť nastavenia mapy“.',
  'help.guide.map-provider.result':
    'Mapy plánovača ciest a denníka používajú engine, ktorý ste vybrali. Atlas vždy používa Leaflet.',
  'help.guide.map-provider.tip.1': 'Bez tokenu použije Mapbox GL namiesto prázdnej mapy Leaflet.',
  'help.guide.map-provider.tip.2':
    'Mapové dlaždice uložené offline pochádzajú od poskytovateľa, ktorý bol aktívny v čase sťahovania.',
  // notification-channels
  'help.guide.notification-channels.title': 'Nastavenie, kde dostávate oznámenia',
  'help.guide.notification-channels.goal':
    'Dostávajte pripomienky k cestám a udalosti spolupráce do telefónu alebo do iného nástroja.',
  'help.guide.notification-channels.step.1':
    'Pri webhooku vložte URL webhooku z Discordu, zo Slacku alebo vlastnú, kliknite na „Testovať“ a potom na „Uložiť“.',
  'help.guide.notification-channels.step.2':
    'Pri ntfy vyplňte Tému Ntfy. Ak prevádzkujete vlastný server, pridajte aj jeho URL servera Ntfy a prístupový token. Testovať odošle správu hneď, Uložiť nastavenia uloží.',
  'help.guide.notification-channels.step.3':
    'V karte Oznámenia navrchu zapnite alebo vypnite každú udalosť pre každý kanál. Zámok znamená, že to správca vypol pre všetkých. Kanál z doplnku ukazuje Nastaviť, kým nie je nastavený. Odoslať test ho vyskúša.',
  'help.guide.notification-channels.result':
    'Udalosti sa posielajú cez kanály, ktoré ste pre ne zapli. Stĺpec V aplikácii určuje, čo ukazuje zvonček v navigačnej lište.',
  'help.guide.notification-channels.tip.1':
    'Pripomienku konkrétnej cesty, teda koľko dní pred odchodom príde, nastavíte vo formulári na úpravu cesty.',
  'help.guide.notification-channels.tip.2':
    'Administrátor môže všetkým predvyplniť predvolený server ntfy, tému si však vyberáte sami.',
  // photo-providers
  'help.guide.photo-providers.title': 'Pripojenie knižnice fotiek',
  'help.guide.photo-providers.goal': 'Nechajte denník načítať fotky daného dňa z Immich alebo Synology Photos.',
  'help.guide.photo-providers.step.1':
    'Pod Integrácie nájdite kartu Immich alebo Synology Photos a zadajte, čo si pýta: URL servera s API kľúč pri Immich, alebo Používateľské meno a Heslo pri Synology Photos. Immich môže pri nahrávaní skopírovať fotky z cestovného denníka aj do knižnice Immich.',
  'help.guide.photo-providers.step.2':
    'Kliknite na Otestovať pripojenie a potom na Uložiť. Odznak sa zmení na Pripojené.',
  'help.guide.photo-providers.result':
    'Karta Externé fotky v editore záznamu prehľadáva pripojenú knižnicu pre deň záznamu, najprv fotky najbližšie k miestu záznamu.',
  'help.guide.photo-providers.tip.1':
    'Pripojenie patrí iba vášmu účtu: ostatní členovia cestovného denníka si pripájajú vlastné knižnice.',
  'help.guide.photo-providers.tip.2':
    'Poskytovateľ bez údajov GPS vo fotkách funguje tiež. Zoznam je potom zoradený podľa času.',
  // api-keys
  'help.guide.api-keys.title': 'Vytvorenie API kľúča',
  'help.guide.api-keys.goal': 'Umožnite iným aplikáciám čítať vaše cesty cez verejné API.',
  'help.guide.api-keys.step.1':
    'V časti API kľúče kliknite na Vytvoriť kľúč, zadajte Názov, ktorý hovorí, kde sa kľúč použije, a pod Čo smie tento kľúč čítať ponechajte iba oblasti, ktoré potrebuje. Kliknite na Vytvoriť.',
  'help.guide.api-keys.step.2':
    'Skopírujte kľúč z okna API kľúč vytvorený: zobrazí sa iba raz. Kliknite na Hotovo. Endpoint to call nájdete pod zoznamom.',
  'help.guide.api-keys.result':
    'Softvér s týmto kľúčom môže čítať oblasti, ktoré ste vybrali, a nikdy nič nemení. Zoznam ukazuje, kedy bol každý kľúč vytvorený a naposledy použitý, a kôš ho vymaže.',
  'help.guide.api-keys.tip.1':
    'Pre každý nástroj použite samostatný kľúč. Potom môžete jeden kľúč zrušiť bez vplyvu na ostatné nástroje.',
  'help.guide.api-keys.tip.2':
    'Ak má AI klient niečo meniť, použite radšej MCP s OAuth; API kľúče umožňujú iba čítanie.',
  // mcp-oauth
  'help.guide.mcp-oauth.title': 'Pripojenie AI asistenta cez MCP',
  'help.guide.mcp-oauth.goal': 'Poskytnite Claude, IDE alebo inému MCP klientovi prístup k svojim cestám.',
  'help.guide.mcp-oauth.step.1': 'Pod Konfigurácia MCP skopírujte MCP endpoint pre svojho klienta.',
  'help.guide.mcp-oauth.step.2':
    'Pod Klienti OAuth 2.1 kliknite na Nový klient a vyberte „Quick preset“, napríklad Claude Desktop alebo Cursor, alebo vyplňte Názov aplikácie, Presmerovacie URI a Povolené oprávnenia sami. Pre server bez prehliadača vyberte „Machine client“. Kliknite na Zaregistrovať klienta a skopírujte Tajný kľúč klienta: zobrazí sa iba raz.',
  'help.guide.mcp-oauth.step.3':
    'Každý klient má tlačidlá „Obnoviť tajný kľúč“ a „Zmazať klienta“. „Aktívne relácie OAuth“ uvádza prihlásených klientov s možnosťou „Odvolať“. Po rozbalení „Konfigurácia klienta“ uvidíte hotový úryvok pre klientov, ktorí používajú JSON.',
  'help.guide.mcp-oauth.result':
    'Klient môže vo vašom mene čítať a meniť to, čo mu povoľujú jeho oprávnenia, a každá akcia sa zobrazí pod vaším menom.',
  'help.guide.mcp-oauth.tip.1':
    'Oprávnenia obmedzujú, čo klient môže robiť: dajte klientovi iba oprávnenie na čítanie, kým nebude potrebovať viac.',
  'help.guide.mcp-oauth.tip.2': 'Správca môže MCP vypnúť pre celú inštanciu. Potom sa táto sekcia nezobrazuje.',
  // offline-prepare
  'help.guide.offline-prepare.title': 'Príprava ciest na používanie offline',
  'help.guide.offline-prepare.goal': 'Uložte si cesty aj ich mapy do tohto zariadenia skôr, než prídete o pripojenie.',
  'help.guide.offline-prepare.step.1':
    'Pod Čo ukladať offline nechajte zapnuté Ukladať mapové dlaždice offline a zapnite cesty, ktoré chcete mať v tomto zariadení. Dokončená cesta sa uloží, iba ak ju zapnete.',
  'help.guide.offline-prepare.step.2':
    'Späť navrchu kliknite pod Príprava na offline na Stiahnuť pre offline použitie. Načíta údaje ciest, dokumenty a mapové dlaždice a povie, koľko ciest uložil.',
  'help.guide.offline-prepare.step.3':
    'Vynútiť offline režim stiahne všetko ešte raz a potom funguje iba z tohto zariadenia, takže pred odchodom môžete skontrolovať, či tam všetko je.',
  'help.guide.offline-prepare.result':
    'Cesty sa otvoria aj bez pripojenia. Vaše zmeny sa uložia do frontu a odošlú sa, keď budete znova online.',
  'help.guide.offline-prepare.tip.1':
    'Najviac miesta zaberajú dlaždice mapy. Ak ich vypnete, uložia sa iba údaje ciest a dokumenty.',
  'help.guide.offline-prepare.tip.2':
    'Pre najplynulejší offline štart si nainštalujte TREK z prehliadača ako aplikáciu.',
  // offline-conflicts
  'help.guide.offline-conflicts.title': 'Rozhodnutie, ktorá verzia sa pri konflikte synchronizácie zachová',
  'help.guide.offline-conflicts.goal':
    'Vyberte, ako TREK vyrieši konflikt medzi zmenou urobenou offline a zmenou urobenou inde.',
  'help.guide.offline-conflicts.step.1':
    'Ak sa zmena, ktorú ste urobili offline, dostane do konfliktu s novšou zmenou, v hornej časti Offline sa zobrazí Konflikty synchronizácie. Pri každej zmene kliknite na Moju verziu alebo Zachovať ich.',
  'help.guide.offline-conflicts.step.2':
    'V tej istej karte určuje Keď dôjde ku konfliktu, čo sa stane nabudúce: Vždy sa ma opýtať, Vždy zachovať moju verziu alebo Vždy zachovať verziu zo servera.',
  'help.guide.offline-conflicts.result':
    'Pri voľbe „Vždy sa ma opýtať“ zostáva konflikt v „Konflikty synchronizácie“, kým sa nerozhodnete. Pri ostatných dvoch možnostiach ho TREK vyrieši automaticky.',
  'help.guide.offline-conflicts.tip.1':
    'Vymazať vyrovnávaciu pamäť odstráni iba kópiu v tomto zariadení. Na serveri sa nič nezmení.',
  // profile
  'help.guide.profile.title': 'Zmena profilu',
  'help.guide.profile.goal': 'Zmeňte svoje meno, e-mail a profilovú fotku.',
  'help.guide.profile.step.1':
    'V karte Účet kliknite na fotoaparát na svojom obrázku a nahrajte nový. Červený kôš ho odstráni a vráti vaše iniciálky.',
  'help.guide.profile.step.2': 'Pod obrázkom upravte Používateľské meno a E-mail.',
  'help.guide.profile.result': 'Vaše meno a profilová fotka sa zmenia všade naraz, aj v cestách, ktoré zdieľate.',
  'help.guide.profile.tip.1': 'Účet prepojený cez SSO ukazuje odznak SSO a Prepojené cez s názvom poskytovateľa.',
  // password
  'help.guide.password.title': 'Zmena hesla',
  'help.guide.password.goal': 'Nastavte si nové heslo.',
  'help.guide.password.step.1':
    'Pod Zmeniť heslo zadajte Súčasné heslo, potom Nové heslo a to isté ešte raz do Potvrďte nové heslo. Zoznam pod poľami počas písania označuje každé splnené pravidlo.',
  'help.guide.password.step.2': 'Kliknite na „Aktualizovať heslo“.',
  'help.guide.password.result':
    'Nové heslo platí okamžite. Všetky ostatné zariadenia sa odhlásia, vaše API tokeny pre MCP sa vymažú a klienti OAuth sa musia prihlásiť znova. Toto zariadenie zostane prihlásené.',
  'help.guide.password.tip.1':
    'Ak sa do tohto TREK prihlasuje iba cez SSO, heslo TREK neexistuje a karta „Zmeniť heslo“ tu nie je.',
  // mfa
  'help.guide.mfa.title': 'Zapnutie dvojfaktorového overenia',
  'help.guide.mfa.goal': 'Chráňte účet kódom z autentifikačnej aplikácie.',
  'help.guide.mfa.step.1': 'V časti „Dvojfaktorové overenie (2FA)“ kliknite na „Nastaviť autentifikačnú aplikáciu“.',
  'help.guide.mfa.step.2':
    'Naskenujte QR kód aplikáciou alebo zadajte tajný kľúč ručne. Potom napíšte šesťmiestny kód, ktorý aplikácia zobrazí, a kliknite na „Zapnúť 2FA“.',
  'help.guide.mfa.step.3':
    'Záložné kódy uložte cez Kopírovať kódy, Stiahnuť TXT alebo Tlač / PDF a potom kliknite na OK. Každý kód platí len raz. Použite ho, keď nemáte po ruke telefón.',
  'help.guide.mfa.result': 'Pri každom prihlásení sa po hesle vyžiada kód.',
  'help.guide.mfa.tip.1': 'Vypnúť 2FA vyžaduje vaše heslo a aktuálny kód alebo nepoužitý záložný kód.',
  'help.guide.mfa.tip.2': 'Správca môže vyžadovať 2FA pre všetkých. Potom ho tu nemožno vypnúť.',
  // passkeys
  'help.guide.passkeys.title': 'Prihlásiť sa pomocou prístupového kľúča',
  'help.guide.passkeys.goal': 'Namiesto hesla použite odtlačok prsta, tvár alebo PIN svojho zariadenia.',
  'help.guide.passkeys.step.1':
    'Pod Prístupové kľúče kliknite na Pridať prístupový kľúč, potvrďte svoje súčasné heslo, zadajte názov, podľa ktorého spoznáte zariadenie, a potom sa riaďte výzvou zariadenia.',
  'help.guide.passkeys.step.2':
    'Pri každom prístupovom kľúči vidíte, či je synchronizovaný alebo viazaný na toto zariadenie a kedy bol naposledy použitý. „Premenovať“ zmení jeho názov a tlačidlom na mazanie ho po zadaní hesla odstránite.',
  'help.guide.passkeys.result': 'Prihlasovacia stránka ponúkne prístupový kľúč. Prihlásiť sa môžete aj naďalej heslom.',
  'help.guide.passkeys.tip.1':
    'Prístupový kľúč sa ukladá v zariadení alebo v jeho správcovi hesiel, preto pridajte samostatný kľúč pre každé zariadenie.',
  'help.guide.passkeys.tip.2':
    'Prístupové kľúče sa zobrazia, až keď ich správca zapne. Kým server nemá nastavenú doménu WebAuthn, karta to uvedie namiesto ponuky Pridať prístupový kľúč.',
  // delete-account
  'help.guide.delete-account.title': 'Zrušenie účtu',
  'help.guide.delete-account.goal': 'Odstráňte svoj účet a údaje, ktoré patria len vám.',
  'help.guide.delete-account.step.1':
    'V karte Účet kliknite vľavo v jej päte na Zmazať účet a potom na Zmazať natrvalo.',
  'help.guide.delete-account.result':
    'Váš účet sa vymaže spolu s cestami, miestami a súbormi, ktoré vlastníte. Cesty, ktoré vlastnia iní ľudia, zostanú zachované.',
  'help.guide.delete-account.tip.1':
    'Ak ste jediný správca, TREK zobrazí „Zmazanie nie je možné“: najprv povýšte iného používateľa na správcu.',
  'help.guide.delete-account.tip.2': 'Nedá sa to vrátiť späť. Pred potvrdením exportujte, čo si chcete ponechať.',

  // ── Screen: admin (all tabs) ───────────────────────────────────────────────
  'help.ctx.admin.title': 'Správca',
  'help.ctx.admin.summary':
    'Nastavenia celej inštancie TREK pre všetkých používateľov: kto sa smie prihlásiť a ako, čo je zapnuté, kde sa ukladajú súbory, ako server kontaktuje ľudí a ako sa zálohuje. Túto stránku vidia iba správcovia. Bočný panel zoskupuje karty pod Používatelia, Konfigurácia, Integrácie a Údržba a každá karta je samostatná obrazovka.',
  'help.ctx.admin.bullet.1':
    'Záhlavie vpravo ukazuje počet používateľov, ciest, miest a súborov. Pod ním sa zobrazí banner Dostupná aktualizácia, keď je dostupné novšie vydanie TREK.',
  'help.ctx.admin.bullet.2':
    'Používatelia a Predvolené nastavenia používateľa: účty, pozývacie odkazy a oprávnenia, a nastavenia a mapa, s ktorými nový účet začína.',
  'help.ctx.admin.bullet.3':
    'Personalizácia, Nastavenia, Doplnky, Pluginy a Úložisko: šablóny balenia, kategórie a školské prázdniny; prihlásenie, prístupové kľúče, 2FA, API kľúče a poskytovatelia vyhľadávania; funkčné moduly; pluginy tretích strán; kam sa ukladajú nahrané súbory.',
  'help.ctx.admin.bullet.4':
    'Oznámenia, MCP prístup a GitHub: kanály, ktoré môžu používatelia vybrať, a predvolené hodnoty, s ktorými začínajú, tokeny a relácie AI klientov a história vydaní.',
  'help.ctx.admin.bullet.5':
    'Zálohovanie a Audit: zálohy na požiadanie aj plánované zálohy a záznam udalostí dôležitých pre bezpečnosť.',
  'help.ctx.admin-users.title': 'Používatelia',
  'help.ctx.admin-users.summary':
    'Všetky účty v tomto TREK s rolou, e-mailom a časom poslednej aktivity, pozývacie odkazy, ktorými sa ľudia môžu zaregistrovať v uzavretej inštancii, a kto čo smie robiť v cestách.',
  'help.ctx.admin-users.bullet.1':
    'Tabuľka: používateľ, e-mail, rola, vytvorené a Naposledy aktívny, pri každom riadku s Upraviť používateľa a Odstrániť používateľa. Zelená bodka na avatare znamená, že je človek práve online. Váš vlastný riadok je označený (Vy).',
  'help.ctx.admin-users.bullet.2':
    '„Vytvoriť používateľa“ vpravo hore v karte „Používatelia“ ručne pridá účet s heslom, ktoré používateľovi odovzdáte.',
  'help.ctx.admin-users.bullet.3':
    'Pozývacie odkazy nižšie: registračné odkazy s limitom použití, platnosťou a, ak chcete, aj cestou, ku ktorej sa nový používateľ pri registrácii pripojí.',
  'help.ctx.admin-users.bullet.4':
    'Nastavenia oprávnení dole: pri každej akcii určíte, kto ju smie robiť (Všetci, Členovia výletu, Vlastník výletu alebo Iba administrátor). Uložíte to tlačidlom Uložiť v hlavičke karty.',
  'help.ctx.admin-defaults.title': 'Predvolené nastavenia používateľa',
  'help.ctx.admin-defaults.summary':
    'S čím nový účet začína, aby ho nikto nemusel najprv nastavovať: farebný režim, jednotky, formát času, začiatok týždňa, zobrazovaná mena a skryté rezervačné kódy, plus mapa, jej kľúče a smerovacie servery.',
  'help.ctx.admin-defaults.bullet.1':
    '„Predvolené nastavenia používateľa“ vľavo: Farebný režim, Jednotky teploty, Jednotky vzdialenosti, Formát času, Týždeň začína, Zobrazovaná mena a Skryť rezervačné kódy.',
  'help.ctx.admin-defaults.bullet.2':
    'Mapa vpravo: Šablóna mapy, Zdieľaný kľúč CARTO, Vlastný smerovací server a Vlastná inštancia Valhalla, náhľad a potom Mapový engine so Štýl mapy, Zdieľaný token Mapbox, 3D budovy a terén a Režim vysokej kvality.',
  'help.ctx.admin-config.title': 'Personalizácia',
  'help.ctx.admin-config.summary':
    'Nastavenia spoločné pre všetky cesty v inštancii: šablóny balenia, sada kategórií pre miesta a zbierky a katalóg školských prázdnin, ktorý používa Dovolenka (Vacay).',
  'help.ctx.admin-config.bullet.1':
    'Šablóny balenia: pomenované zoznamy kategórií a položiek, z ktorých môže zoznam vecí na balenie v ceste vychádzať.',
  'help.ctx.admin-config.bullet.2':
    'Kategórie: názov, ikona a farba kategórií používaných v celom TREK, od inšpektora miesta až po Zbierky. Každá sa upravuje v dialógu s náhľadom.',
  'help.ctx.admin-config.bullet.3':
    'Školské prázdniny: katalóg krajín a regiónov s obdobiami prázdnin, z ktorého si môže každý vyberať v Dovolenke (Vacay).',
  'help.ctx.admin-settings.title': 'Nastavenia',
  'help.ctx.admin-settings.summary':
    'Ako sa ľudia prihlasujú a ktoré externé služby smie server používať. Vľavo: Metódy overenia, Prihlásenie prístupovým kľúčom, Vyžadovať dvojfaktorové overenie (2FA) a Jednotné prihlásenie (OIDC). Vpravo: Povolené typy súborov a API kľúče s poskytovateľmi vyhľadávania a dopravy. Nebezpečná zóna je úplne dole.',
  'help.ctx.admin-settings.bullet.1':
    'Metódy overenia: Prihlásenie heslom, Registrácia heslom a, keď je nastavené OIDC, Prihlásenie cez SSO a Automatické vytváranie účtov SSO. Vyžadovať dvojfaktorové overenie (2FA) má vlastnú kartu.',
  'help.ctx.admin-settings.bullet.2':
    'Prihlásenie prístupovým kľúčom: Povoliť prihlásenie prístupovým kľúčom, Relying Party ID (doména) a Povolené origins. Jednotné prihlásenie (OIDC): Zobrazované meno, URL vydavateľa (Issuer), voliteľná Discovery URL, ID klienta a Tajný kľúč klienta.',
  'help.ctx.admin-settings.bullet.3':
    'API kľúče: ako prvé je TREK Places API, ktoré kľúč nepotrebuje. Pod ním je Google Maps API kľúč (s tlačidlom „Testovať“ a časťou „Na čo sa kľúč môže používať“), kľúč pre Unsplash a pre Amap a dole na karte jedno spoločné tlačidlo „Uložiť“.',
  'help.ctx.admin-settings.bullet.4':
    'Poskytovateľ verejnej dopravy a Poskytovateľ vyhľadávania miest určujú, kto odpovedá na vyhľadávanie dopravy a miest. Záznam vyhľadávania miest zaznamenáva, ktorý výsledok bol vybraný. Povolené typy súborov obmedzujú nahrávanie.',
  'help.ctx.admin-addons.title': 'Doplnky',
  'help.ctx.admin-addons.summary':
    'Funkčné moduly TREK, každý s prepínačom: Balenie, Rozpočet, Dokumenty, Dovolenka (Vacay), Atlas, Spolupráca, Cestovný denník, Zbierky, Cesta autom, MCP, AirTrail, Dawarich a Analýza pomocou AI. Vypnuté znamená, že položka v navigácii, príslušné stránky aj API zmiznú pre všetkých.',
  'help.ctx.admin-addons.bullet.1':
    'Každý doplnok má vlastnú dlaždicu s prepínačom a, ak nejaké má, s riadkami pre svoje možnosti.',
  'help.ctx.admin-addons.bullet.2':
    'Poskytovatelia fotiek a dokumentov tu majú tiež svoje dlaždice, takže používateľom môžete ponúknuť napríklad Immich alebo Synology.',
  'help.ctx.admin-addons.bullet.3': 'Sledovanie batožiny má vlastný prepínač pod dlaždicami.',
  'help.ctx.admin-plugins.title': 'Pluginy',
  'help.ctx.admin-plugins.summary':
    'Pluginy tretích strán, ktoré bežia vo vlastnom procese vedľa TREK, každý s oprávneniami, o ktoré požiadal pri inštalácii. Nainštalujte ich z katalógu, nahrajte balík alebo počas vývoja pluginu pripojte priečinok.',
  'help.ctx.admin-plugins.bullet.1':
    'Nainštalované a Objaviť, s poľom Hľadať pluginy… a filtrami Typ, Stav a Zoradiť. Každý riadok ukazuje verziu, Skontrolované, Podpísané alebo Nepodpísané, k čomu môže plugin pristupovať, prepínač a ponuku ⋯.',
  'help.ctx.admin-plugins.bullet.2':
    'Dve ikony v hlavičke karty: „Nahrať plugin“ prijme .zip, .tgz alebo .tar.gz (alebo pretiahnite .zip na stránku); „Znovu prehľadať“ nájde priečinok pluginu prepojený na vývoj.',
  'help.ctx.admin-plugins.bullet.3':
    'Povolení hostitelia pre každý plugin: adresy, ktoré plugin smie volať, pretože odchádzajúce pripojenia sú predvolene zablokované.',
  'help.ctx.admin-storage.title': 'Úložisko',
  'help.ctx.admin-storage.summary':
    'Kde sa ukladajú nahrané súbory: na lokálny disk alebo do S3 bucketu, voliteľne s kópiou na ďalšie úložiská. Každá kategória nahrávok môže ísť do iného úložiska a nič sa nezmení, kým nekliknete na Uložiť zmeny.',
  'help.ctx.admin-storage.bullet.1':
    'Zdravie navrchu: neúspešné zápisy na cieľ zrkadla, alebo Neboli zaznamenané žiadne zlyhania replík.',
  'help.ctx.admin-storage.bullet.2':
    'Backendy: názov, typ, využitie a „Mirrored to“, s tlačidlami Testovať, Upraviť a Odobrať. Vypočítať teraz spočíta, čo je uložené. Backend definovaný premennou prostredia je iba na čítanie.',
  'help.ctx.admin-storage.bullet.3':
    'Kategórie: dokumenty ciest, fotky z cestovných denníkov, titulné fotky, profilové obrázky, obrázky miest, vyrovnávacie pamäte fotiek a zálohy, každá priradená k jednému úložisku.',
  'help.ctx.admin-notifications.title': 'Oznámenia',
  'help.ctx.admin-notifications.summary':
    'Kanály, ktoré inštancia ponúka používateľom, a tie, cez ktoré dostávate oznámenia vy ako administrátor. Používatelia si vlastné témy a URL nastavujú v „Nastaveniach“, vy rozhodujete, čo je k dispozícii, a nastavujete e-mail.',
  'help.ctx.admin-notifications.bullet.1':
    'E-mail (SMTP), Webhook, Ntfy a Web Push majú každý prepínač, ktorým sa kanál ponúkne používateľom. E-mail potrebuje aj nastavenia servera. V aplikácii je vždy zapnuté.',
  'help.ctx.admin-notifications.bullet.2': 'Pripomienky ciest: či server posiela pripomienku pred začiatkom cesty.',
  'help.ctx.admin-notifications.bullet.3':
    'Admin webhook, Admin Ntfy a karta Oznámenia: kam idú udalosti pre správcu (Nová verzia k dispozícii, Zlyhanie repliky úložiska, Vyžiadaný vodácky región), každé s tlačidlom na test.',
  'help.ctx.admin-mcp-tokens.title': 'MCP prístup',
  'help.ctx.admin-mcp-tokens.summary':
    'Všetky tokeny a OAuth relácie, ktoré majú AI klienti k tejto inštancii TREK, za všetkých používateľov. Ktorýkoľvek z nich môžete odvolať.',
  'help.ctx.admin-mcp-tokens.bullet.1':
    '„OAuth relácie“: klient, rozsahy, ktoré dostal, jeho vlastník a dátum, a ikona koša, ktorou reláciu odvoláte.',
  'help.ctx.admin-mcp-tokens.bullet.2':
    'API tokeny: názov, vlastník, Vytvorené a Naposledy použité, s košom, ktorým token vymažete.',
  'help.ctx.admin-github.title': 'GitHub',
  'help.ctx.admin-github.summary':
    'Čo je nové v TREK: história vydaní z GitHubu a či je dostupná novšia verzia, než akú máte. Samotná aktualizácia prebieha mimo aplikácie, na hostiteľovi.',
  'help.ctx.admin-github.bullet.1':
    'História verzií vypisuje vydania ako časovú os s poznámkami. Najnovšie má označenie Najnovšia, predbežné majú Predbežná verzia a GitHub otvorí stránku vydaní.',
  'help.ctx.admin-github.bullet.2':
    'Keď vyjde novšia verzia, pod záhlavím stránky sa zobrazí „Dostupná aktualizácia“. „Ako aktualizovať“ ukáže príkazy pre Docker alebo návod na aktualizáciu pri iných inštaláciách.',
  'help.ctx.admin-backup.title': 'Zálohovanie',
  'help.ctx.admin-backup.summary':
    'Úplné zálohy databázy a nahraných súborov, vytvorené ručne alebo podľa plánu. Uchovávajú sa na serveri a dajú sa stiahnuť ako jeden súbor. Zálohu vrátite späť tlačidlom „Obnoviť“.',
  'help.ctx.admin-backup.bullet.1':
    'Záloha dát: navrchu karty Vytvoriť zálohu a Nahrať zálohu, pod nimi zoznam záloh s tlačidlami Stiahnuť, Obnoviť a ikonou koša na vymazanie.',
  'help.ctx.admin-backup.bullet.2':
    'Nahrať zálohu obnoví dáta zo súboru vytvoreného v inej inštancii alebo v skorší deň, po rovnakej otázke ako Obnoviť.',
  'help.ctx.admin-backup.bullet.3':
    '„Automatické zálohovanie“: zapnuté alebo vypnuté, „Interval“, „Spustiť o hodine“ a deň a „Odstrániť staré zálohy po“ (od 1 dňa po „Uchovávať navždy“), uložené tlačidlom „Uložiť“.',
  'help.ctx.admin-audit.title': 'Audit', // same-as-en
  'help.ctx.admin-audit.summary':
    'Záznam udalostí dôležitých pre bezpečnosť a správu: prihlásenia a neúspešné pokusy, zmeny MFA, zmeny používateľov a nastavení, zálohy a obnovenia. Len na čítanie, najnovšie navrchu.',
  'help.ctx.admin-audit.bullet.1':
    'Jeden riadok na udalosť s časom, používateľom, akciou, prostriedkom, IP adresou a podrobnosťami.',
  'help.ctx.admin-audit.bullet.2':
    'Obnoviť v hlavičke karty načíta zoznam znova. Odznak vedľa názvu ukazuje, koľko záznamov je načítaných z celkového počtu, a Načítať ďalšie načíta staršie záznamy.',
  // create-user
  'help.guide.create-user.title': 'Vytvoriť používateľa',
  'help.guide.create-user.goal': 'Pridajte účet ručne, bez pozvánky.',
  'help.guide.create-user.step.1': 'Kliknite na Vytvoriť používateľa vpravo hore v karte Používatelia.',
  'help.guide.create-user.step.2':
    'Zadajte Používateľské meno, E-mail a Heslo. Kontrolný zoznam pod heslom ukazuje, ktoré pravidlá heslo spĺňa. Vyberte Rola: Používateľ alebo Administrátor.',
  'help.guide.create-user.step.3': 'Kliknite na Vytvoriť používateľa.',
  'help.guide.create-user.result':
    'Účet sa objaví v tabuľke a dá sa doň hneď prihlásiť. Heslo dotyčnému pošlite kanálom, ktorému dôverujete.',
  'help.guide.create-user.tip.1': 'Ak si má človek zvoliť vlastné heslo, je lepší pozývací odkaz.',
  'help.guide.create-user.tip.2':
    'Administrátor vidí túto stránku a môže robiť všetko. Čo môže v cestách robiť Používateľ, nastavíte nižšie v časti „Nastavenia oprávnení“.',
  // edit-user
  'help.guide.edit-user.title': 'Zmena údajov alebo hesla používateľa',
  'help.guide.edit-user.goal':
    'Premenujte používateľa, povýšte ho alebo degradujte, alebo mu pomôžte znova sa prihlásiť po strate hesla.',
  'help.guide.edit-user.step.1':
    'V riadku používateľa kliknite na ceruzku (Upraviť používateľa). Dialóg ukazuje navrchu e-mail účtu.',
  'help.guide.edit-user.step.2':
    'Zmeňte „Používateľské meno“, „E-mail“ alebo „Rola“, prípadne zadajte „Nové heslo“ (ak ho necháte prázdne, zostane súčasné), a kliknite na „Uložiť“. „Resetovať prístupové kľúče“ dole po potvrdení odstráni všetky prístupové kľúče účtu.',
  'help.guide.edit-user.result':
    'Zmena sa použije hneď. Nové heslo osobu navyše odhlási na všetkých zariadeniach, takže stará relácia prestane fungovať.',
  'help.guide.edit-user.tip.1': 'Rolu správcu si nemôžete odobrať, kým ste posledným správcom.',
  'help.guide.edit-user.tip.2':
    'Resetovanie prístupových kľúčov zachová heslo. Dotyčný si nové prístupové kľúče pridá v Nastavenia, Účet.',
  // invite-links
  'help.guide.invite-links.title': 'Pozvať niekoho cez odkaz',
  'help.guide.invite-links.goal':
    'Umožnite niekomu zaregistrovať sa na uzavretej inštancii a, ak chcete, rovno ho pridajte do cesty.',
  'help.guide.invite-links.step.1': 'Kliknite na Vytvoriť odkaz vpravo hore v karte Pozývacie odkazy.',
  'help.guide.invite-links.step.2':
    'Vyberte Max. použití (1× až 5× alebo ∞) a Vyprší po (1d až 14d alebo ∞), voliteľne cestu pod Pridať k ceste (voliteľné), a kliknite na Vytvoriť a skopírovať.',
  'help.guide.invite-links.step.3':
    'Odošlite odkaz. Pri každom riadku vidíte, koľkokrát bol použitý, kedy vyprší, do ktorej cesty pridáva a kto ho vytvoril, a vedľa stav Aktívny, Vypršaný alebo Vyčerpaný. „Kopírovať odkaz“ ho skopíruje znova a košom ho vymažete.',
  'help.guide.invite-links.result':
    'Kto odkaz otvorí, zaregistruje sa s vlastným heslom. Ak bola vybratá cesta, hneď sa k nej pripojí.',
  'help.guide.invite-links.tip.1': 'Pozývacie odkazy fungujú, aj keď je „Registrácia heslom“ v „Nastaveniach“ vypnutá.',
  'help.guide.invite-links.tip.2': 'Pre jednu osobu je najbezpečnejší odkaz na jedno použitie s krátkou platnosťou.',
  // delete-user
  'help.guide.delete-user.title': 'Odstránenie používateľa',
  'help.guide.delete-user.goal': 'Odstráňte účet a všetko, čo mu patrí.',
  'help.guide.delete-user.step.1':
    'Kliknite na kôš (Odstrániť používateľa) v riadku používateľa a potvrďte tlačidlom Vymazať.',
  'help.guide.delete-user.result':
    'Účet sa vymaže spolu so všetkými cestami a cestovnými denníkmi, ktoré vlastní, aj s cestami zdieľanými s inými. Cesty, v ktorých bol len členom, zostanú u ich vlastníkov.',
  'help.guide.delete-user.tip.1': 'Nedá sa to vrátiť späť. Ak si nie ste istí, najprv vytvorte zálohu.',
  'help.guide.delete-user.tip.2':
    'Ikona koša vo vašom vlastnom riadku nefunguje: samého seba vymazať nemôžete. Musí to urobiť iný správca.',
  // permissions
  'help.guide.permissions.title': 'Určiť, kto môže čo robiť',
  'help.guide.permissions.goal': 'Nastavte pre každú akciu, ktorá rola ju smie v tomto TREK vykonávať.',
  'help.guide.permissions.step.1':
    'V časti Nastavenia oprávnení nájdite akciu v jej skupine, napríklad Mazať cesty v skupine Správa výletov, a vyberte, kto ju smie robiť: Všetci, Členovia výletu, Vlastník výletu alebo Iba administrátor. Zmenený riadok je označený ako upravené.',
  'help.guide.permissions.step.2':
    'Kliknite na Uložiť vpravo hore v karte. Obnoviť predvolené vráti každý riadok na vstavanú úroveň. Aj po ňom kliknite na Uložiť.',
  'help.guide.permissions.result':
    'Pravidlo platí naraz pre všetky cesty. Ľudia pod danou úrovňou už nevidia príslušné tlačidlá a ponuky.',
  'help.guide.permissions.tip.1': '„Vlastník výletu“ je ten, kto cestu vytvoril. Administrátori môžu vždy všetko.',
  'help.guide.permissions.tip.2':
    'Každá akcia je samostatný riadok, takže môžete napríklad nechať členov plánovať miesta a dni, ale mazanie cesty ponechať jej vlastníkovi.',
  // default-map
  'help.guide.default-map.title': 'Predvolené nastavenia mapy pre nových používateľov',
  'help.guide.default-map.goal': 'Dajte každému novému účtu funkčnú mapu bez osobného tokenu.',
  'help.guide.default-map.step.1':
    'Pod Mapa vyberte Šablóna mapy alebo vložte URL dlaždíc a, ak používate dlaždice CARTO, zadajte Zdieľaný kľúč CARTO. Náhľad nižšie ukazuje výsledok.',
  'help.guide.default-map.step.2':
    'Nižšie vyberte „Mapový engine“: „Štandardná (zdarma)“, Mapbox (3D) alebo MapLibre (OpenFreeMap). Pri Mapbox a MapLibre zvoľte „Štýl mapy“; pri Mapbox zadajte aj „Zdieľaný token Mapbox“ a rozhodnite o voľbách „3D budovy a terén“ a „Režim vysokej kvality“.',
  'help.guide.default-map.result':
    'Nové účty začínajú s týmito nastaveniami. Kto si v Nastavenia nastavil vlastnú mapu, ponechá si ju.',
  'help.guide.default-map.tip.1':
    'Token alebo kľúč zadaný tu používajú všetci, ktorí nemajú vlastný, takže sledujte jeho kvótu.',
  'help.guide.default-map.tip.2':
    'Tieto predvolené hodnoty používajú aj existujúce účty, ktoré na karte mapy nikdy nič nezmenili.',
  // packing-templates
  'help.guide.packing-templates.title': 'Vytvorenie šablóny balenia',
  'help.guide.packing-templates.goal':
    'Dajte cestám zoznam vecí, z ktorého môžu vychádzať, namiesto prázdneho zoznamu.',
  'help.guide.packing-templates.step.1': 'Kliknite na „Nová šablóna“, zadajte názov a potvrďte ho fajkou.',
  'help.guide.packing-templates.step.2':
    'Kliknutím na názov šablóny ju otvoríte, potom kliknite na Pridať kategóriu. Tlačidlo + navrchu kategórie pridáva položky a položka potrebuje len názov.',
  'help.guide.packing-templates.step.3':
    'Všetko sa ukladá priebežne. Ceruzka premenuje šablónu, kategóriu alebo položku. Kôš vymaže položku okamžite. Pri šablóne alebo kategórii sa najprv opýta, pretože sa vymaže aj všetko, čo obsahuje.',
  'help.guide.packing-templates.result':
    'Šablóna sa ponúkne v zozname vecí každej cesty. Pri použití sa položky skopírujú, takže ich v ceste môžete ľubovoľne meniť.',
  'help.guide.packing-templates.tip.1':
    'Jedna šablóna pre každý druh cesty (pláž, mesto, turistika) funguje lepšie než jeden veľmi dlhý zoznam.',
  'help.guide.packing-templates.tip.2': 'Vymazanie šablóny neovplyvní cesty, ktoré ju už použili.',
  'help.guide.packing-templates.tip.3':
    '„Uložiť ako šablónu“ v zozname vecí cesty vytvorí šablónu s hmotnosťou, množstvom a taškou každej položky. Tie sa tu zobrazia vedľa položky a pri použití šablóny sa položky uložia do rovnakých tašiek.',
  // categories
  'help.guide.categories.title': 'Spravovať sadu kategórií',
  'help.guide.categories.goal': 'Určte, aké kategórie môžu mať miesta a zbierky, a ako vyzerajú.',
  'help.guide.categories.step.1':
    'Kliknite na Nová kategória, do titulného riadka dialógu napíšte názov, vyberte Ikona a Farba a skontrolujte Náhľad. Kliknite na Vytvoriť.',
  'help.guide.categories.step.2':
    'V zozname ceruzka (Upraviť) otvorí kategóriu a Aktualizovať ju uloží. Kôš (Vymazať) ju po potvrdení odstráni.',
  'help.guide.categories.result':
    'Sada platí všade naraz: v paneli miesta, v špendlíkoch na mape, v Zbierkach aj vo filtroch.',
  'help.guide.categories.tip.1':
    'Miesta si uchovávajú ID kategórie, takže keď kategóriu premenujete, zmení sa pri všetkých miestach.',
  'help.guide.categories.tip.2':
    'Keď kategóriu vymažete, jej miesta zostanú bez kategórie. Ak vám na tom záleží, najprv ich priraďte do inej kategórie.',
  // school-holiday-catalog
  'help.guide.school-holiday-catalog.title': 'Ručná správa školských prázdnin',
  'help.guide.school-holiday-catalog.goal':
    'Spravujte školské prázdniny krajiny alebo regiónu, ktoré si môže každý vybrať v Dovolenka (Vacay).',
  'help.guide.school-holiday-catalog.step.1':
    'V časti „Školské prázdniny“ vyberte krajinu, alebo kliknite na + (Pridať krajinu), zadajte krajinu a jej kód (napr. US) a uložte. „Pridať región“ pridá každú jej časť, ktorá má vlastné termíny.',
  'help.guide.school-holiday-catalog.step.2':
    'Kliknutím na región otvoríte Región alebo školský obvod: Pridať obdobie prázdnin, zadajte pri každom Názov prázdnin, Dátum začiatku a Dátum konca a kliknite na Uložiť. Kôš odstráni obdobie alebo región. Krajinu možno vymazať, keď už nemá žiadne regióny.',
  'help.guide.school-holiday-catalog.result':
    'Používatelia nájdu krajinu a región v Nastavenia vo Dovolenka (Vacay) a obdobia uvidia vo svojej ročnej mriežke.',
  'help.guide.school-holiday-catalog.tip.1':
    'Región, ktorý si už niekto vybral vo svojom kalendári Dovolenka (Vacay), sa nedá vymazať.',
  // auth-methods
  'help.guide.auth-methods.title': 'Určiť, ako sa ľudia prihlasujú',
  'help.guide.auth-methods.goal': 'Zapnite alebo vypnite prihlásenie heslom, SSO a registráciu a vyžadujte 2FA.',
  'help.guide.auth-methods.step.1':
    'Pod Metódy overenia zapnite alebo vypnite Prihlásenie heslom a Registrácia heslom. Každý prepínač platí okamžite. Pri vypnutej registrácii vznikajú nové účty len z pozývacích odkazov, cez SSO alebo cez Vytvoriť používateľa.',
  'help.guide.auth-methods.step.2':
    'Prihlásenie cez SSO a Automatické vytváranie účtov SSO vyžadujú nastavené Jednotné prihlásenie (OIDC) nižšie. Automatické vytváranie založí účet, keď sa niekto prvýkrát prihlási cez SSO.',
  'help.guide.auth-methods.step.3':
    'Zapnite „Vyžadovať dvojfaktorové overenie (2FA)“ a každý, kto 2FA nemá, si ho bude musieť nastaviť v „Nastaveniach“, kým bude môcť TREK používať.',
  'help.guide.auth-methods.result': 'Prihlasovacia stránka ponúkne presne tie spôsoby, ktoré ste nechali zapnuté.',
  'help.guide.auth-methods.tip.1':
    'TREK nedovolí vypnúť poslednú metódu prihlásenia: jej prepínač zosivie a tooltip povie „At least one login method must remain enabled“.',
  'help.guide.auth-methods.tip.2':
    'Ak je na serveri nastavené OIDC_ONLY, prepínače hesla sú zamknuté a poznámka na to upozorní.',
  // oidc
  'help.guide.oidc.title': 'Pripojenie jednotného prihlásenia',
  'help.guide.oidc.goal': 'Umožnite ľuďom prihlásiť sa cez vášho poskytovateľa identity.',
  'help.guide.oidc.step.1':
    'Pod Jednotné prihlásenie (OIDC) zadajte Zobrazované meno pre tlačidlo, URL vydavateľa (Issuer), ID klienta a Tajný kľúč klienta od svojho poskytovateľa. Discovery URL (voliteľné) vyplňte iba vtedy, ak ju váš poskytovateľ nezverejňuje na obvyklej adrese, ako napríklad Authentik. Kliknite na Uložiť.',
  'help.guide.oidc.step.2': 'Pod Metódy overenia zapnite Prihlásenie cez SSO.',
  'help.guide.oidc.result':
    'Na prihlasovacej stránke sa zobrazí tlačidlo SSO. So zapnutým „Automatickým vytváraním účtov SSO“ dostanú noví používatelia pri prvom prihlásení účet automaticky.',
  'help.guide.oidc.tip.1':
    'URI presmerovania, ktoré váš poskytovateľ potrebuje, je adresa vášho TREK a za ňou cesta spätného volania OIDC z dokumentácie.',
  'help.guide.oidc.tip.2':
    'Mapovanie claimov určuje, ktoré skupiny SSO sa stanú správcami. Pozrite si stránku OIDC v dokumentácii.',
  // instance-keys
  'help.guide.instance-keys.title': 'Zadanie API kľúčov',
  'help.guide.instance-keys.goal':
    'Zapnite pre celú inštanciu fotky a hodnotenia z Google, titulné fotky z Unsplash a vyhľadávanie cez Amap.',
  'help.guide.instance-keys.step.1':
    'Pod API kľúče už TREK Places API navrchu vybavuje vyhľadávanie miest bez akéhokoľvek kľúča. Čo v tom je vypisuje, čo pokrýva a čo nie.',
  'help.guide.instance-keys.step.2':
    'Pre fotky, hodnotenia a otváracie hodiny vložte Google Maps API kľúč a kliknite na Testovať. Zobrazí sa Pripojené alebo Neplatný. Otvorte Na čo sa kľúč môže používať a zapnite len to, čo chcete mať spoplatnené: Fotografie miest, Automatické dopĺňanie miest, Podrobnosti o mieste, Obohatenie miest a Hľadať len cez Google, a nastavte Denný limit volaní Google.',
  'help.guide.instance-keys.step.3':
    'Vložte Unsplash API kľúč pre vyhľadávanie titulných obrázkov a Amap (高德地图) API kľúč pre vyhľadávanie miest v pevninskej Číne, potom kliknite dole v karte na Uložiť.',
  'help.guide.instance-keys.result':
    'Používatelia dostanú funkcie aj bez vlastných kľúčov. Bez kľúča Google beží vyhľadávanie cez TREK Places API a OpenStreetMap.',
  'help.guide.instance-keys.tip.1':
    'Ak má používateľ v „Nastaveniach“ vlastný kľúč, TREK preňho použije ten namiesto kľúča inštancie.',
  'help.guide.instance-keys.tip.2':
    'Kľúče môžu pochádzať aj z premenných prostredia. Tie sa tu zobrazujú len na čítanie.',
  'help.guide.instance-keys.tip.3':
    'Denný limit volaní Google obmedzuje, koľko môže TREK za deň s týmto kľúčom minúť. Značka vedľa nadpisu počíta dnešné volania. Po dosiahnutí limitu používa vyhľadávanie do nasledujúceho dňa (UTC) OpenStreetMap.',
  // places-transit
  'help.guide.places-transit.title': 'Vybrať poskytovateľov vyhľadávania a verejnej dopravy',
  'help.guide.places-transit.goal':
    'Vyberte službu, ktorá odpovedá na vyhľadávanie miest a požiadavky na trasy verejnej dopravy.',
  'help.guide.places-transit.step.1':
    'Pod Poskytovateľ verejnej dopravy vyberte Transitous (zdarma), ktorý nepotrebuje kľúč a je najsilnejší v Európe, alebo Google, ktorý používa kľúč Google. Voľba sa uloží hneď.',
  'help.guide.places-transit.step.2':
    'Pod Poskytovateľ vyhľadávania miest vyberte službu, ktorú sa TREK opýta, keď index TREK a OpenStreetMap nič nenájdu: Automaticky (Google, ak existuje kľúč, potom Amap), Google Places, Amap (高德地图) alebo OpenStreetMap.',
  'help.guide.places-transit.result':
    'Táto voľba platí pre každé vyhľadávacie pole a každú trasu verejnej dopravy v TREK.',
  'help.guide.places-transit.tip.1':
    'Pri voľbe bez kľúča sa tu zobrazí upozornenie. Vyhľadávanie miest potom používa iba index TREK a OpenStreetMap a verejná doprava iba Transitous.',
  'help.guide.places-transit.tip.2': 'Trasy verejnej dopravy od Google sa účtujú za každú požiadavku, Transitous nie.',
  // file-types
  'help.guide.file-types.title': 'Obmedzenie typov súborov',
  'help.guide.file-types.goal': 'Určte, aké prípony môžu mať nahrávané súbory.',
  'help.guide.file-types.step.1':
    'Pod Povolené typy súborov upravte zoznam prípon oddelených čiarkami alebo zadajte * na povolenie všetkých typov a kliknite na Uložiť.',
  'help.guide.file-types.result':
    'Nahrávanie iných typov súborov sa odmietne zrozumiteľnou správou, v dokumentoch, v denníku aj pri titulných obrázkoch.',
  'help.guide.file-types.tip.1':
    'Typy obrázkov v zozname ponechajte: titulné obrázky aj fotky z cestovného denníka sa kontrolujú podľa toho istého zoznamu.',
  // toggle-addon
  'help.guide.toggle-addon.title': 'Zapnutie alebo vypnutie doplnku',
  'help.guide.toggle-addon.goal': 'Sprístupnite funkčný modul všetkým alebo ho odstráňte.',
  'help.guide.toggle-addon.step.1':
    'Kliknite na prepínač na dlaždici doplnku. Položka v navigácii sa všetkým hneď zobrazí alebo zmizne.',
  'help.guide.toggle-addon.step.2':
    'Niektoré dlaždice majú riadky so svojimi možnosťami, napríklad „Sledovanie batožiny“ pod „Zoznamami“ alebo poskytovateľov fotiek pod „Cestovným denníkom“. Zobrazujú sa, len kým je doplnok zapnutý.',
  'help.guide.toggle-addon.result':
    'Keď doplnok vypnete, jeho údaje sa zachovajú. Keď ho znova zapnete, údaje sa opäť zobrazia.',
  'help.guide.toggle-addon.tip.1': 'Vypnutím MCP sa odstráni endpoint aj sekcie Integrácie, ktoré od neho závisia.',
  'help.guide.toggle-addon.tip.2':
    'Dovolenka (Vacay), Atlas a Cestovný denník sú doplnky, ktoré používatelia chcú najčastejšie. Dokumenty potrebujú úložisko pre nahrané súbory.',
  // document-providers
  'help.guide.document-providers.title': 'Ponuka úložiska dokumentov',
  'help.guide.document-providers.goal': 'Určte, s ktorými úložiskami môže cesta synchronizovať svoje dokumenty.',
  'help.guide.document-providers.step.1':
    'Na dlaždici „Dokumenty“ sú úložiská v riadkoch: Paperless-ngx, Papra, Nextcloud, OpenCloud a Synology Drive. Na začiatku sú všetky vypnuté a riadky sa zobrazujú, len kým sú zapnuté samotné „Dokumenty“.',
  'help.guide.document-providers.step.2':
    'Zapnite prepínač v riadku Nextcloud. Zobrazí sa správa „Doplnok aktualizovaný“ a vlastníci ciest odteraz nájdu na záložke „Súbory“ svojich ciest „Synchronizáciu dokumentov“, kde je Nextcloud v časti „Pripojiť poskytovateľa“.',
  'help.guide.document-providers.result':
    'Úložisko je k dispozícii v každej ceste v tomto TREK. Nič sa nepripojí, kým ho nepripojí vlastník cesty.',
  'help.guide.document-providers.tip.1':
    'Tu sa rozhoduje len o tom, či sa úložisko môže ponúkať. Adresa a prihlasovacie údaje patria k ceste a zadáva ich vlastník cesty v jej karte Súborov, nikdy nie v paneli správcu.',
  'help.guide.document-providers.tip.2':
    'Keď vypnete Dokumenty, vypnú sa aj všetky úložiská, a kým sú Dokumenty vypnuté, žiadne úložisko nezapnete: server odpovie „Najprv povoľte doplnok Dokumenty“. Úložisko vo vašej vlastnej sieti navyše vyžaduje na serveri ALLOW_INTERNAL_NETWORK=true.',
  // install-plugin
  'help.guide.install-plugin.title': 'Inštalácia pluginu',
  'help.guide.install-plugin.goal': 'Pridajte plugin tretej strany a udeľte mu presne tie oprávnenia, o ktoré žiada.',
  'help.guide.install-plugin.step.1':
    'Otvorte Objaviť, nájdite doplnok cez Hľadať pluginy… alebo filter Typ a kliknite na Inštalovať. Pri súbore balíka kliknite na Nahrať plugin (ikona oblaku vpravo hore v karte) alebo pustite súbor .zip na stránku.',
  'help.guide.install-plugin.step.2':
    'Pod Nainštalované si prečítajte riadok: k čomu má plugin prístup, s ktorými hostiteľmi sa spája a či je Skontrolované a Podpísané. Potom zapnite Povoliť plugin. Riadok ukáže Aktívny.',
  'help.guide.install-plugin.step.3':
    'Ponuka ⋯ pri riadku ponúka Reštartovať, Zobraziť protokol chýb, Povolení hostitelia a Zmeniť verziu…, plus odkazy na zdroj. Vymazať odinštaluje plugin aj s jeho dátami. Novšia verzia sa v riadku zobrazí ako aktualizácia a verzia, ktorá žiada nové oprávnenia, zostane vypnutá, kým ich neschválite.',
  'help.guide.install-plugin.result':
    'Doplnok beží vo vlastnom procese. Všetko, čo pridáva, napríklad widgety, mapové vrstvy alebo nástroje, sa zobrazí tam, kde to doplnok určí.',
  'help.guide.install-plugin.tip.1': '„Znovu prehľadať“ nájde priečinok doplnku prepojený na vývoj, aj keď nemá balík.',
  'help.guide.install-plugin.tip.2':
    'Nepodpísaný plugin je takto označený. Inštalujte ho, len ak dôverujete jeho zdroju.',
  // storage-backends
  'help.guide.storage-backends.title': 'Presun nahraných súborov na S3 alebo ich zrkadlenie',
  'help.guide.storage-backends.goal':
    'Uchovávajte súbory v objektovom úložisku alebo kopírujte každý nahraný súbor do druhého úložiska.',
  'help.guide.storage-backends.step.1':
    'Pod Backendy kliknite na Pridať backend, zadajte Názov, vyberte Typ, Local alebo S3, a vyplňte jeho polia. Ak chcete mať kópiu inde, zaškrtnite Ciele zrkadla. Kliknite na Použiť a potom v novom riadku na Testovať, aby ste skontrolovali pripojenie.',
  'help.guide.storage-backends.step.2':
    'Pod Kategórie priraďte každý druh nahraných súborov, ako Dokumenty cesty, Fotky z cestovného denníka alebo Zálohy, k nejakému backendu.',
  'help.guide.storage-backends.step.3':
    'Dole kliknite na „Uložiť zmeny“. Ak kategória teraz smeruje inam, TREK sa opýta, či má „Presunúť existujúce objekty“ alebo „Iba smerovať nové zápisy“.',
  'help.guide.storage-backends.result':
    'Nové nahrávky idú do pridelenej služby úložiska. Presunuté súbory sa poskytujú odtiaľ a súbory, ktoré ste sa rozhodli nepresúvať, zostanú tam, kde boli.',
  'help.guide.storage-backends.tip.1':
    'Úložisko nastavené cez premenné prostredia sa tu zobrazuje, ale nedá sa tu upravovať.',
  'help.guide.storage-backends.tip.2':
    'Cieľ zrkadla dostane kópiu každého nového zápisu. Synchronizovať teraz v riadku skopíruje to, čo bolo uložené predtým. Pomalý cieľ spomalí každé nahrávanie v tom úložisku.',
  // channels-instance
  'help.guide.channels-instance.title': 'Nastaviť kanály oznámení',
  'help.guide.channels-instance.goal': 'Určte, ktoré kanály si môžu používatelia vybrať, a nastavte e-mail.',
  'help.guide.channels-instance.step.1':
    'V hlavičke karty zapnite E-mail (SMTP), zadajte SMTP Host, SMTP Port, SMTP User, SMTP Password a From Address a kliknite na Uložiť. Odoslať testovací e-mail pošle e-mail vám. Preskočiť kontrolu certifikátu TLS používajte iba pri lokálnom poštovom serveri s vlastným certifikátom.',
  'help.guide.channels-instance.step.2':
    'Zapnite Webhook, Ntfy a Web Push, aby ich bolo možné ponúknuť. Používatelia potom v Nastavenia, Oznámenia zadajú vlastnú URL alebo tému, alebo zapnú push pre jednotlivé zariadenia.',
  'help.guide.channels-instance.step.3':
    'Pripomienky ciest zapínajú pripomienku pred začiatkom cesty. V aplikácii je vždy zapnuté.',
  'help.guide.channels-instance.result': 'Karta Oznámenia každého používateľa zobrazuje kanály, ktoré ste zapli.',
  'help.guide.channels-instance.tip.1':
    'URL servera Ntfy na karte Ntfy v administrácii je zároveň predvoleným serverom pre používateľov. Tí si stále môžu nastaviť vlastný.',
  'help.guide.channels-instance.tip.2':
    'Kanály doplnkov sa zobrazia automaticky, keď je aktívny doplnok, ktorý ich podporuje.',
  // admin-channels
  'help.guide.admin-channels.title': 'Udalosti pre administrátora v telefóne',
  'help.guide.admin-channels.goal':
    'Dostávajte oznámenia o nových vydaniach, zlyhávajúcich zrkadlách úložiska a žiadostiach o vodácke regióny.',
  'help.guide.admin-channels.step.1':
    'Pod Admin Ntfy zadajte Admin téma a podľa potreby URL servera Ntfy a Prístupový token (voliteľné). Pod Admin webhook zadajte URL. V každej karte kliknite na Uložiť.',
  'help.guide.admin-channels.step.2':
    'Kliknite na Odoslať testovacie ntfy alebo Odoslať testovací webhook a overte, že správa dorazí.',
  'help.guide.admin-channels.result':
    'Udalosti pre správcov dostane každý správca v aplikácii a tam, kde ste ich zapli, aj admin téma ntfy a admin webhook.',
  'help.guide.admin-channels.tip.1':
    'Tému pre správcov oddeľte od osobnej, aby sa hlásenia o výpadkoch nestratili medzi správami o cestách.',
  'help.guide.admin-channels.tip.2':
    'Webhook a téma pre správcov sú oddelené od vašich vlastných kanálov v Nastavenia, Oznámenia.',
  // mcp-tokens-admin
  'help.guide.mcp-tokens-admin.title': 'Odvolať prístup AI',
  'help.guide.mcp-tokens-admin.goal':
    'Zobrazte a zrušte každý token a reláciu, ktorú má AI klient, pre ľubovoľného používateľa.',
  'help.guide.mcp-tokens-admin.step.1':
    'Pod OAuth relácie nájdite klienta podľa názvu a vlastníka. Jeho štítky ukazujú udelené rozsahy. Kôš reláciu po potvrdení zruší.',
  'help.guide.mcp-tokens-admin.step.2':
    'Pod API tokeny je to rovnaké pre tokeny: názov, vlastník, Vytvorené a Naposledy použité. Kôš token vymaže a klient okamžite prestane fungovať.',
  'help.guide.mcp-tokens-admin.result': 'Používateľ klienta ho musí pripojiť znova. Nič iné sa nezmení.',
  'help.guide.mcp-tokens-admin.tip.1':
    'Oprávnenia ukazujú, čo by klient mohol robiť. Oprávnenie len na čítanie môžete pokojne ponechať.',
  'help.guide.mcp-tokens-admin.tip.2':
    'Vypnutím doplnku MCP odpojíte všetkých klientov naraz a táto karta sa skryje, nič sa však nevymaže: po opätovnom zapnutí tokeny znova fungujú.',
  // release-history
  'help.guide.release-history.title': 'Kontrola novej verzie',
  'help.guide.release-history.goal': 'Zistite, či je váš TREK aktuálny a čo prinesie ďalšia verzia.',
  'help.guide.release-history.step.1':
    'Ak existuje novšie vydanie, pod záhlavím stránky sa zobrazí Dostupná aktualizácia s verziou, ktorú používate. Zobraziť na GitHube otvorí vydanie a Ako aktualizovať ukáže príkazy pre Docker alebo návod na aktualizáciu pre iné inštalácie.',
  'help.guide.release-history.step.2':
    'História verzií uvádza každú verziu s poznámkami. Zobraziť podrobnosti ich rozbalí, najnovšia verzia má označenie Najnovšia a Načítať ďalšie zobrazí staršie verzie.',
  'help.guide.release-history.result':
    'Aktualizujete na hostiteľovi: stiahnete nový obraz alebo zostavíte novú značku (tag). Dátový adresár zostane zachovaný.',
  'help.guide.release-history.tip.1': 'Pred aktualizáciou si vytvorte zálohu. Karta Zálohovanie je hneď vedľa tejto.',
  'help.guide.release-history.tip.2':
    'Predbežné verzie sa zobrazujú, ale neoznamujú sa ako aktualizácie, ak sami nepoužívate predbežnú verziu.',
  // create-backup
  'help.guide.create-backup.title': 'Vytvorenie a obnovenie zálohy',
  'help.guide.create-backup.goal': 'Zálohujte celú inštanciu, uložte si kópiu inde a majte možnosť ju obnoviť.',
  'help.guide.create-backup.step.1':
    'Pod Záloha dát kliknite vpravo hore na Vytvoriť zálohu. Databáza a nahrávky sa uložia do jedného súboru na serveri.',
  'help.guide.create-backup.step.2': 'Stiahnuť uloží kópiu mimo servera. Kôš po potvrdení vymaže staré zálohy.',
  'help.guide.create-backup.step.3':
    '„Obnoviť“ pri zálohe alebo „Nahrať zálohu“ so súborom nahradí všetky súčasné dáta, keď v okne „Obnoviť zálohu?“ kliknete na „Áno, obnoviť“.',
  'help.guide.create-backup.result':
    'Obnova vráti používateľov, cesty, súbory a nastavenia presne tak, ako boli v danej zálohe.',
  'help.guide.create-backup.tip.1':
    'Obnovenie je tu jediná akcia, ktorú nemožno vrátiť späť. Najprv preto vytvorte novú zálohu.',
  'help.guide.create-backup.tip.2':
    'Zálohy sa ukladajú v dátovom adresári. Skopírujte ich na iný počítač, aby boli v bezpečí aj pri výpadku tohto.',
  // auto-backup
  'help.guide.auto-backup.title': 'Naplánovať zálohy',
  'help.guide.auto-backup.goal': 'Nechajte server zálohovať sám seba a mazať staré zálohy.',
  'help.guide.auto-backup.step.1':
    'Pod Automatické zálohovanie zapnite Povoliť automatické zálohovanie a vyberte Interval (Každú hodinu, Denne, Týždenne alebo Mesačne), Spustiť o hodine a pri týždennom alebo mesačnom zálohovaní Deň v týždni alebo Deň v mesiaci.',
  'help.guide.auto-backup.step.2':
    'V časti „Odstrániť staré zálohy po“ zvoľte, ako dlho sa záloha uchováva, od „1 deň“ po „Uchovávať navždy“, a kliknite na „Uložiť“.',
  'help.guide.auto-backup.result':
    'Zálohy sa v zozname objavujú podľa rozvrhu. Zálohy staršie, než je vek, ktorý ste vybrali, sa vymažú.',
  'help.guide.auto-backup.tip.1':
    'Spustiť o hodine sa riadi časom servera. Nápoveda pod poľom ukazuje časové pásmo servera.',
  'help.guide.auto-backup.tip.2':
    'Úložisko na serveri je obmedzené: zvyčajne stačí 7 alebo 14 dní, a stiahnutú kópiu uchovajte inde.',
  // audit-log
  'help.guide.audit-log.title': 'Čítanie protokolu auditu',
  'help.guide.audit-log.goal': 'Zistite, kto čo urobil a kedy.',
  'help.guide.audit-log.step.1':
    'Riadky sú zoradené od najnovšieho: „Čas“, „Používateľ“, „Akcia“, „Zdroj“, IP a „Podrobnosti“. Akcie sú pomenované podľa toho, čo sa stalo, napríklad neúspešné prihlásenie, zmena MFA alebo obnova.',
  'help.guide.audit-log.step.2':
    'Obnoviť vpravo hore načíta zoznam znova. Odznak vedľa názvu ukazuje, koľko záznamov je načítaných z celkového počtu, a Načítať ďalšie načíta staršie záznamy.',
  'help.guide.audit-log.result': 'Máte záznam, ktorý môžete ukázať každému, kto sa spýta, prečo sa niečo zmenilo.',
  'help.guide.audit-log.tip.1': 'Časy sa zobrazujú v časovom pásme servera.',
  'help.guide.audit-log.tip.2': 'Do protokolu sa dá len pridávať, v aplikácii v ňom nič neupravíte ani nevymažete.',

  // ── Screen: trip ──────────────────────────────────────────────────────────────────────
  'help.ctx.trip.title': 'Cesta',
  'help.ctx.trip.summary':
    'Všetko o jednej ceste: plán s dňami, mapou a miestami a karty pre túry, dopravu, rezervácie, zoznamy, náklady, súbory, spoluprácu a prepojený denník. Každá z nich má pod touto obrazovkou vlastnú obrazovku pomoci.',
  'help.ctx.trip.bullet.1':
    'Lišta kariet pod hornou lištou: „Plán“, „Túry“, „Doprava“, „Rezervácie“, „Zoznamy“, „Náklady“, „Súbory“, „Spolupráca“ a po prepojení denníka aj „Denník“. Ktoré karty vo vašom TREK sú, určujú doplnky a pluginy.',
  'help.ctx.trip.bullet.2':
    'Plán má tri stĺpce: dni vľavo, mapa uprostred, miesta vpravo. S doplnkom Cesta autom začína stĺpec dní prepínačom Dni a Cesta autom, s doplnkom Túry začína stĺpec miest prepínačom Miesta a Túry. Rezervácie a doprava sú súčasťou plánu, pri zastávke aj medzi zastávkami. Karty ich vypisujú.',
  'help.ctx.trip.bullet.3':
    'Nastavenia cesty, štítok vedľa názvu cesty vľavo hore, otvoria nastavenia cesty: Ľudia (členovia a hostia), Zdieľanie (verejný odkaz len na čítanie a odkaz na pozvanie) a Denník.',
  'help.ctx.trip.bullet.4':
    'Názov, dátumy, titulná fotka a mena sa upravujú v časti Moje cesty, ceruzkou na karte cesty. Názov cesty vľavo hore vás tam vráti.',
  'help.ctx.trip.bullet.5':
    'Záložkou na vnútornom okraji stĺpca stĺpec zbalíte a mapa využije uvoľnené miesto. Zbalený stĺpec zobrazí v hornom rohu mapy malú dlaždicu; kliknutím naň stĺpec znova zobrazíte. Ťahaním tenkého oddeľovača vedľa stĺpca zmeníte jeho šírku.',
  'help.ctx.trip.bullet.6': 'Šípka späť na paneli nástrojov dní vráti vaše posledné zmeny plánu, jednu po druhej.',
  // add-member
  'help.guide.add-member.title': 'Pridanie člena',
  'help.guide.add-member.goal': 'Sprístupnite túto cestu niekomu, kto má účet TREK.',
  'help.guide.add-member.step.1':
    'Kliknite na Nastavenia cesty, pilulku vedľa názvu cesty vľavo hore. Otvorí sa na Ľudia.',
  'help.guide.add-member.step.2': 'Pod Pozvať používateľa vyberte človeka z Vyberte používateľa… a kliknite na Pozvať.',
  'help.guide.add-member.step.3':
    'Osoba sa teraz zobrazí v časti „Prístup“. Vlastníka označuje odznak „Vlastník“. „Odobrať prístup“ na konci riadku po potvrdení osobu odstráni.',
  'help.guide.add-member.result':
    'Člen vidí a upravuje cestu rovnako ako vy, v rámci úrovní, ktoré správca nastavil v Nastaveniach oprávnení.',
  'help.guide.add-member.tip.1':
    'Kto v zozname chýba, ešte nemá účet v TREK. Pridajte ho ako hosťa alebo ho nechajte zaregistrovať sa cez odkaz na pozvanie.',
  'help.guide.add-member.tip.2': 'Číslo vedľa „Prístup“ udáva počet ľudí v ceste. Hostia sú uvedení samostatne nižšie.',
  // trip-invite-link
  'help.guide.trip-invite-link.title': 'Pozvanie cez odkaz',
  'help.guide.trip-invite-link.goal': 'Nechajte ľudí, aby sa k ceste pripojili sami.',
  'help.guide.trip-invite-link.step.1':
    'Kliknite na Nastavenia cesty vedľa názvu cesty a vľavo vyberte Zdieľanie. Pod Odkaz na pozvanie na cestu kliknite na Vytvoriť odkaz na pozvanie.',
  'help.guide.trip-invite-link.step.2':
    'Kliknite na Kopírovať a pošlite odkaz. Každý, kto má účet TREK a odkaz otvorí, sa pripojí ako člen.',
  'help.guide.trip-invite-link.step.3':
    '„Vygenerovať znova“ nahradí odkaz novým a starý prestane fungovať. „Deaktivovať“ odkaz vypne.',
  'help.guide.trip-invite-link.result': 'Každý, kto odkaz otvorí, sa pripojí k ceste a zobrazí sa v časti Prístup.',
  'help.guide.trip-invite-link.tip.1':
    'Niekto bez účtu ho nemôže použiť. Správca vytvára registračné odkazy v časti Správca, Používatelia a môže jeden prepojiť s touto cestou.',
  'help.guide.trip-invite-link.tip.2':
    'Ak ste odkaz poslali do nesprávneho chatu, vygenerujte ho znova. Starý odkaz okamžite prestane fungovať.',
  // add-guest
  'help.guide.add-guest.title': 'Pridanie hosťa bez účtu',
  'help.guide.add-guest.goal': 'Pridajte do cesty niekoho, kto TREK nepoužíva.',
  'help.guide.add-guest.step.1':
    'Kliknite na Nastavenia cesty vedľa názvu cesty. V Ľudia je časť Hostia posledná, pod Prístup.',
  'help.guide.add-guest.step.2': 'Zadajte meno do poľa Meno hosťa a kliknite na Pridať hosťa.',
  'help.guide.add-guest.result':
    'Hosťa môžete priradiť k nákladom, veciam na balenie a úlohám, prihlásiť sa však nemôže.',
  'help.guide.add-guest.tip.1':
    'Premenovať (ceruzka) zmení meno hosťa. Odobrať prístup (kôš) po potvrdení hosťa odstráni: jeho priradenia sa vymažú a jeho podiel na každom výdavku sa rozdelí medzi ostatných v danom rozdelení.',
  'help.guide.add-guest.tip.2': 'Ak osoba neskôr získa účet, pozvite ju ako člena a hosťa odstráňte.',
  // public-link
  'help.guide.public-link.title': 'Zverejnenie odkazu len na čítanie',
  'help.guide.public-link.goal': 'Ukážte cestu ľuďom, ktorí ju nemajú upravovať.',
  'help.guide.public-link.step.1': 'Kliknite na Nastavenia cesty vedľa názvu cesty a vľavo vyberte Zdieľanie.',
  'help.guide.public-link.step.2':
    'V karte Verejný odkaz zapnite, čo môže odkaz zobrazovať. Mapa a plán je zapnuté vždy, Rezervácie, Balenie, Náklady a Čet už závisia od vás.',
  'help.guide.public-link.step.3':
    'Pod Možnosti vynechá Len doprava a ubytovanie aktivity, poznámky ku dňom a prázdne dni. Bez fotiek vynechá fotky miest.',
  'help.guide.public-link.result': 'Každý, kto má odkaz, uvidí vybrané časti bez prihlásenia a nemôže nič zmeniť.',
  'help.guide.public-link.tip.1':
    'Odkaz nie je nikde zverejnený, ale otvoriť ho môže ktokoľvek, kto ho má. Chráňte ho ako heslo.',
  'help.guide.public-link.tip.2': 'Ak má mať dotyčný právo upravovať, pridajte ho radšej ako člena.',
  // transfer-ownership
  'help.guide.transfer-ownership.title': 'Odovzdať cestu alebo ju opustiť',
  'help.guide.transfer-ownership.goal': 'Určte vlastníkom niekoho iného alebo opustite cestu, ktorá nie je vaša.',
  'help.guide.transfer-ownership.step.1':
    'Kliknite na Nastavenia cesty vedľa názvu cesty. Pod Prístup kliknite v riadku člena na Nastaviť ako vlastníka (koruna) a potvrďte.',
  'help.guide.transfer-ownership.step.2':
    'Tlačidlom „Opustiť cestu“ vo vlastnom riadku sa po potvrdení z cesty odstránite. Ak ste vlastník, najprv odovzdajte vlastníctvo.',
  'help.guide.transfer-ownership.result':
    'Nový vlastník spravuje členov a môže cestu vymazať. Vy zostanete bežným členom.',
  'help.guide.transfer-ownership.tip.1':
    'Vlastníkom je ten, kto cestu vytvoril, kým vlastníctvo neprevedie na niekoho iného. Vymazať cestu môže len vlastník.',
  'help.guide.transfer-ownership.tip.2':
    '„Odobrať prístup“ v riadku iného člena funguje opačne: vlastník ním daného člena z cesty odstráni.',
  // collapse-columns
  'help.guide.collapse-columns.title': 'Uvoľnenie miesta pre mapu',
  'help.guide.collapse-columns.goal': 'Zbaľte stĺpec, alebo ho rozšírte.',
  'help.guide.collapse-columns.step.1':
    'Kliknutím na jazýček s ikonou panela na vnútornom okraji stĺpca dní stĺpec zbalíte a mapa zaberie uvoľnené miesto. Rovnaký jazýček má aj stĺpec miest.',
  'help.guide.collapse-columns.step.2':
    'Keď je stĺpec zbalený, v hornom rohu mapy sa zobrazí malá dlaždica s ikonou panela. Jej tooltip znie Plán alebo Miest. Kliknutím naň stĺpec znova zobrazíte.',
  'help.guide.collapse-columns.step.3': 'Šírku stĺpca zmeníte potiahnutím tenkého oddeľovača medzi stĺpcom a mapou.',
  'help.guide.collapse-columns.result': 'Šírky sa zapamätajú. Pri ďalšej návšteve budú stĺpce opäť otvorené.',
  'help.guide.collapse-columns.tip.1': 'Oba stĺpce môžete zbaliť naraz, aby ste videli len mapu.',
  'help.guide.collapse-columns.tip.2':
    'V úzkom okne sa zmestí iba jeden stĺpec: keď jeden otvoríte, druhý sa zbalí. Na telefóne stĺpce nie sú; medzi zobrazeniami prepínate cez „Cesta“, „Plán“ a „Miesta“ hore.',
  // undo-change
  'help.guide.undo-change.title': 'Vrátenie poslednej zmeny',
  'help.guide.undo-change.goal': 'Vráťte späť poslednú zmenu v pláne.',
  'help.guide.undo-change.step.1':
    'Kliknite na šípku späť na paneli nástrojov nad dňami. Jej tooltip uvádza zmenu, ktorú vráti.',
  'help.guide.undo-change.result': 'Plán je späť v pôvodnom stave a krátka správa uvádza, čo sa vrátilo.',
  'help.guide.undo-change.tip.1':
    'Vrátiť späť sa týka plánu: pridávania, priraďovania, odstraňovania, preraďovania, presúvania a zamykania miest, vyprázdnenia dňa, optimalizácie trasy, mazania miest, zmien kategórií a importov.',
  'help.guide.undo-change.tip.2':
    'Ďalším kliknutím sa vrátite ešte o krok späť: TREK si pamätá vašich posledných 30 zmien v tejto ceste, od najnovšej, kým cestu neopustíte.',
  'help.guide.clear-day.title': 'Vyprázdnenie dňa',
  'help.guide.clear-day.goal': 'Odstráňte z dňa všetky miesta naraz, napríklad ak ho chcete naplánovať od začiatku.',
  'help.guide.clear-day.step.1': 'V pláne kliknite pravým tlačidlom myši na hlavičku dňa.',
  'help.guide.clear-day.step.2': 'Vyberte Vyprázdniť deň a potvrďte.',
  'help.guide.clear-day.result':
    'Deň je prázdny a jeho miesta sú späť v zozname ako nezaradené. Šípka späť nad dňami ich vráti.',
  'help.guide.clear-day.tip.1': 'Odstránia sa iba miesta. Poznámky a rezervácie dňa zostanú.',

  // ── Screen: trip-places ───────────────────────────────────────────────────────────────
  'help.ctx.trip-places.title': 'Miesta',
  'help.ctx.trip-places.summary':
    'Pravý stĺpec plánu: všetky miesta cesty, naplánované aj nenaplánované, s vyhľadávaním, filtrami a zoradením a so spôsobmi, ako miesta pridať: vyhľadávaním, ručne alebo zo zdieľaného zoznamu. Miesta a Túry navrchu prepínajú medzi miestami a túrami cesty.',
  'help.ctx.trip-places.bullet.1':
    'Miest a Túry navrchu stĺpca prepínajú zoznam. Po otvorení je zvolené Miest. Túry zobrazí túry cesty a importuje súbory GPX, KML a KMZ cez Importovať GPX alebo KML. Túra sa v zozname miest nezobrazuje.',
  'help.ctx.trip-places.bullet.2':
    'Pridať miesto/aktivitu otvorí formulár pre miesto, ktoré vyhľadáte alebo zadáte. Pri otvorenom dni tlačidlo znie Nové miesto a Ku dňu vedľa neho vytvorí miesto rovno v tom dni.',
  'help.ctx.trip-places.bullet.3':
    '„Importovať miesta“, ikonové tlačidlo vedľa, ponúka „Import zoznamu“ pre zoznam zdieľaný z Google Maps alebo Naver Maps. Ak správca doplnok Túry vypol, ponúka aj „Importovať súbor“ pre súbory .gpx, .kml a .kmz a súbor môžete pretiahnuť aj priamo na stĺpec.',
  'help.ctx.trip-places.bullet.4':
    'Pod nimi je pole Hľadať, ktoré prehľadáva aj popisy a poznámky, a vedľa neho začiarkavacie políčko Vybrať. V riadku pod ním sú filtre: Zobraziť prepína medzi Všetky, Nezaradené a Plánované, každé s počtom. Tlačidlo štítka filtruje podľa kategórie, hviezda podľa minimálneho hodnotenia, glóbus (keď cesta zahŕňa viac ako jednu krajinu alebo región) podľa krajiny alebo regiónu a Zoradiť podľa určuje poradie zoznamu.',
  'help.ctx.trip-places.bullet.5':
    'Riadok ukazuje obrázok, názov a popis alebo adresu a hviezdu s priemerným hodnotením, keď niekto miesto ohodnotil. Kliknutím naň otvoríte podrobnosti miesta, potiahnutím ho presuniete na deň, alebo naň kliknite pravým tlačidlom (alebo kliknite na Ďalšie možnosti, jeho tri bodky) pre Upraviť, + Deň, Otvoriť webovú stránku, Google Maps, Uložiť do zbierky a Vymazať.',
  'help.ctx.trip-places.bullet.6':
    'Keď je otvorený deň, okrúhle + na konci riadka (+ Deň) pridá miesto do toho dňa. Zobrazuje sa pri každom mieste, ktoré ešte nie je v tom dni. Plánované potom vypisuje iba tento deň a štítok Zobrazuje sa iba otvorený deň vás na to upozorní. Jeho x, Zobraziť celú cestu, deň zatvorí.',
  // create-place
  'help.guide.create-place.title': 'Vytvorenie miesta',
  'help.guide.create-place.goal': 'Pridajte miesto alebo aktivitu ručne, so všetkými údajmi, ktoré plán potrebuje.',
  'help.guide.create-place.step.1':
    'Kliknite navrchu stĺpca miest na Pridať miesto/aktivitu (pri otvorenom dni na Nové miesto). Formulár sa otvorí s kurzorom vo vyhľadávaní.',
  'help.guide.create-place.step.2':
    'Zadajte miesto do poľa Hľadať miesta… a vyberte výsledok. Vyplní sa názov v hlavičke dialógu, Adresa, Zemepisná šírka, Zemepisná dĺžka a Webová stránka a Podrobnosti miesta vľavo ukážu obrázky, otváracie hodiny a popis. Ak má váš TREK kľúč Google, „Not the right place? Search Google instead“ pod výsledkami spustí rovnaké hľadanie cez Google. Pri zapnutých Zbierky ponúkajú Uložené miesta vpravo rovnakým spôsobom miesta z vašich zoznamov.',
  'help.guide.create-place.step.3':
    'V „Podrobnosti miesta“ kliknite na obrázok pod „Vybrať obrázok“ a stane sa obrázkom miesta. „Použiť tento text“ skopíruje popis do formulára.',
  'help.guide.create-place.step.4':
    'Skontrolujte polia formulára. Názov v hlavičke dialógu je jediné povinné pole. Štítok Kategória pod ním vyberá jednu z kategórií cesty a + vedľa neho vytvorí novú. Adresa, Zemepisná šírka a Zemepisná dĺžka sa doplnia z vyhľadávania alebo ich zadáte sami. Popis a Poznámky sú na vlastný text. Webová stránka berie odkaz, Priložiť pod Súbory pridá dokument a Telefón, E-mail a Pridať otváracie hodiny sú na údaje, ktoré vyhľadávanie nenašlo.',
  'help.guide.create-place.step.5':
    'Kliknite na „Pridať“. Ak už v ceste je miesto s rovnakým názvom alebo na rovnakej polohe, TREK zobrazí upozornenie a tlačidlo sa zmení na „Aj tak pridať“.',
  'help.guide.create-place.result':
    'Miesto je v zozname aj na mape, v skupine „Nezaradené“, kým ho nepridáte do niektorého dňa.',
  'help.guide.create-place.tip.1':
    'Náklady dole vo formulári, so zapnutým doplnkom Rozpočet, otvoria hneď po uložení editor Náklady pre výdavok miesta. Obrázok alebo PDF vložené do dialógu sa pripojí ako súbor pod Súbory.',
  'help.guide.create-place.tip.2':
    'Výsledky vyhľadávania v každom TREK poskytuje index TREK a OpenStreetMap a Podrobnosti miesta sa automaticky vyplnia z Wikipédie, Wikivoyage a Wikimedia. TREK sa pýta Google len vtedy, keď oba zdroje nič nenájdu, a hodnotenia poskytuje iba Google.',
  'help.guide.create-place.tip.3':
    'Miesto môžete vytvoriť aj na mape: kliknite pravým tlačidlom na bod a otvorí sa formulár s vyplnenými súradnicami a adresou.',
  // place-to-open-day
  'help.guide.place-to-open-day.title': 'Pridať miesto priamo k otvorenému dňu',
  'help.guide.place-to-open-day.goal': 'Vytvorte alebo vyberte miesto a pridajte ho do dňa jedným krokom.',
  'help.guide.place-to-open-day.step.1':
    'V stĺpci dní kliknite na záhlavie dňa. Deň sa otvorí: jeho karta sa zvýrazní a v stĺpci miest sa vedľa „Nové miesto“ objaví tlačidlo „Ku dňu“.',
  'help.guide.place-to-open-day.step.2':
    'Ku dňu otvorí rovnaký formulár ako Nové miesto, ale miesto sa po kliknutí na Pridať hneď pridá do otvoreného dňa.',
  'help.guide.place-to-open-day.step.3':
    'Ak chcete pridať existujúce miesto do otvoreného dňa, kliknite na okrúhle + na konci jeho riadku (+ Deň), alebo naň kliknite pravým tlačidlom a vyberte + Deň. Tlačidlo + je pri každom mieste, ktoré v tom dni ešte nie je.',
  'help.guide.place-to-open-day.step.4':
    'Funguje to aj naopak, bez toho, aby ste najprv otvorili deň: potiahnite riadok miesta zo stĺpca a pustite ho na kartu dňa. Ak ho pustíte medzi dve zastávky, zaradí sa presne tam.',
  'help.guide.place-to-open-day.result':
    'Miesto sa zobrazí v dni na konci. Potiahnite ho nahor alebo nadol tam, kam patrí.',
  'help.guide.place-to-open-day.tip.1':
    'Otvorený deň ovplyvňuje aj vyhľadávanie: keď je deň otvorený, mapa aj hľadanie v okolí vychádzajú z miest, ktoré už v tom dni sú.',
  'help.guide.place-to-open-day.tip.2': 'Tlačidlom „Vrátiť späť“ na paneli nástrojov nad dňami priradenie zrušíte.',
  // filter-places
  'help.guide.filter-places.title': 'Hľadanie miesta v zozname',
  'help.guide.filter-places.goal': 'Zobrazte v stĺpci len miesta, ktoré hľadáte.',
  'help.guide.filter-places.step.1':
    '„Zobraziť“, rozbaľovací zoznam pod vyhľadávaním, prepína medzi „Všetky“, „Nezaradené“ (zatiaľ na žiadnom dni) a „Plánované“ (na niektorom dni), pri každej možnosti s počtom. Ak je doplnok Túry vypnutý a bola importovaná stopa GPX, ponúka aj „Stopy“.',
  'help.guide.filter-places.step.2':
    'Píšte do poľa Hľadať navrchu. Zoznam sa zužuje počas písania podľa názvu, adresy, popisu a poznámok. Krížikom v poli ho vymažete.',
  'help.guide.filter-places.step.3':
    'Tlačidlo štítka vedľa Zobraziť vypisuje kategórie: zaškrtnite jednu alebo viac, vrátane Bez kategórie. Tlačidlo ukazuje, koľko je zaškrtnutých, a Vymazať filter na konci zoznamu zruší všetky.',
  'help.guide.filter-places.step.4':
    'Hviezda vedľa nastavuje minimálne hodnotenie: 5+, 4+ a tak ďalej ponechajú iba miesta, ktorých priemerné hodnotenie je aspoň také vysoké. Miesta bez hodnotenia sa skryjú.',
  'help.guide.filter-places.result': 'Číslo pri Zobraziť ukazuje, koľko miest vyhovuje, a filtre sa kombinujú.',
  'help.guide.filter-places.tip.1':
    'Keď je otvorený deň, „Plánované“ zobrazuje iba tento deň a upozorní na to: „Zobrazuje sa iba otvorený deň“ a vedľa „Zobraziť celú cestu“.',
  'help.guide.filter-places.tip.2':
    'Mapa rešpektuje aj Zobraziť, kategórie a hodnotenie, a pri otvorenom dni zobrazí Plánované na mape iba ten deň. Vyhľadávanie a glóbus filtrujú len zoznam.',
  // edit-place
  'help.guide.edit-place.title': 'Zmena miesta',
  'help.guide.edit-place.goal': 'Opravte názov, presuňte špendlík, pridajte webovú stránku alebo zmeňte kategóriu.',
  'help.guide.edit-place.step.1':
    'Kliknite na riadok pravým tlačidlom a vyberte Upraviť, alebo kliknite na Ďalšie možnosti na konci riadku, alebo otvorte miesto a v jeho podrobnostiach kliknite na Upraviť.',
  'help.guide.edit-place.step.2':
    'V okne „Upraviť miesto“ zmeňte, čo potrebujete: názov a „Kategória“ hore v dialógu, „Adresa“, „Zemepisná šírka“ a „Zemepisná dĺžka“, „Popis“, „Poznámky“, „Webová stránka“, „Telefón“, „E-mail“ a otváracie hodiny. Ak je miesto presne na jednom dni alebo ste ho otvorili z dňa, formulár má aj „Začiatok“, „Do“ a „Poznámky pre tento deň“.',
  'help.guide.edit-place.step.3': 'Kliknite na „Aktualizovať“.',
  'help.guide.edit-place.result':
    'Zmena platí všade, kde sa miesto zobrazuje: v zozname, na mape aj v každom dni, v ktorom je.',
  'help.guide.edit-place.tip.1':
    'Poznámky pre tento deň patria k miestu len v tom jednom dni. Poznámky patria k samotnému miestu.',
  'help.guide.edit-place.tip.2':
    'Ak je Do pred Začiatok, Aktualizovať je zablokované. Časový prekryv s: len upozorní, že iná zastávka dňa má rovnaký čas.',
  // delete-place
  'help.guide.delete-place.title': 'Vymazať miesto',
  'help.guide.delete-place.goal': 'Natrvalo odstráňte miesto z cesty.',
  'help.guide.delete-place.step.1':
    'Kliknite na riadok pravým tlačidlom a vyberte Vymazať (nájdete ho aj v Ďalšie možnosti na konci riadka), alebo kliknite na Vymazať v podrobnostiach miesta.',
  'help.guide.delete-place.step.2':
    'V potvrdzovacej otázke kliknite na Vymazať. Ak bola v mieste rezervovaná noc alebo je s ním prepojená rezervácia, otázka uvedie, čo sa s ním vymaže.',
  'help.guide.delete-place.result':
    'Miesto zmizne zo zoznamu, z mapy aj zo všetkých dní. Tlačidlom „Vrátiť späť“ na paneli nástrojov nad dňami ho obnovíte.',
  'help.guide.delete-place.tip.1':
    'Ak chcete miesto odobrať len z jedného dňa, použite pri danej zastávke „Odobrať z dňa“.',
  'help.guide.delete-place.tip.2':
    'Ak chcete vymazať viac miest naraz, kliknite na symbol zaškrtnutia vedľa vyhľadávania a spustite výber.',
  // select-places
  'help.guide.select-places.title': 'Zmena alebo vymazanie viacerých miest naraz',
  'help.guide.select-places.goal': 'Zmeňte viac miest naraz, nie jedno po druhom.',
  'help.guide.select-places.step.1':
    'Kliknite na symbol zaškrtnutia vedľa vyhľadávacieho poľa. Riadky dostanú okrúhle zaškrtávacie políčka a v dolnej časti stĺpca sa zobrazí lišta s akciami.',
  'help.guide.select-places.step.2':
    'Kliknutím na riadky ich zaškrtnete. Vybrať všetko, dvojité zaškrtnutie na lište, vyberie každý riadok, ktorý filtre zobrazujú.',
  'help.guide.select-places.step.3':
    'Lišta počíta zaškrtnuté miesta. Zmeniť kategóriu priradí všetkým jednu kategóriu. Uložiť do zbierky (so zapnutým doplnkom Zbierky) ich skopíruje do jednej z vašich zbierok. Vymazať vybrané ich po potvrdení odstráni.',
  'help.guide.select-places.step.4': 'Výber ukončíte tlačidlom „Hotovo“, teda X na konci lišty.',
  'help.guide.select-places.result':
    'Zmena platí pre všetky vybrané miesta. Vymazanie môžete vrátiť späť na paneli nástrojov nad dňami.',
  'help.guide.select-places.tip.1':
    'Filtre fungujú aj počas výberu: najprv vyfiltrujte Nezaradené, potom Vybrať všetko vyberie len tieto miesta.',
  'help.guide.select-places.tip.2':
    'Označiť ako navštívené vo vašich zoznamoch sa na lište zobrazí, keď je zapnutý doplnok Zbierky: označí miesta ako navštívené v zbierkach, v ktorých sú uložené.',
  // import-places-file
  'help.guide.import-places-file.title': 'Import miest zo súboru GPX, KML alebo KMZ',
  'help.guide.import-places-file.goal':
    'Ak je doplnok Túry vypnutý, importujte ako miesta špendlíky a trasy, ktoré exportoval Google My Maps, Google Earth alebo GPS tracker.',
  'help.guide.import-places-file.step.1':
    'Kliknite na Importovať miesta, ikonové tlačidlo vedľa tlačidla na pridanie, a vyberte Importovať súbor, alebo pustite súbor kamkoľvek na stĺpec miest. Oboje je dostupné len tam, kde správca vypol doplnok Túry.',
  'help.guide.import-places-file.step.2':
    'Vyberte súbor alebo ho pretiahnite do poľa. Pri GPX zaškrtnite, čo sa má importovať: „Trasové body“, „Trasy“, „Trasy GPS (s geometriou cesty)“. Pri KML a KMZ zaškrtnite „Body (Placemarks)“ a „Cesty (LineStrings)“.',
  'help.guide.import-places-file.step.3':
    'Pole prijme naraz viac súborov, ale iba .gpx, .kml a .kmz. Iný druh súboru alebo súbor väčší ako 10 MB dialóg odmietne a neimportuje sa.',
  'help.guide.import-places-file.step.4':
    'Kliknite na Importovať. Správa uvedie, koľko miest sa importovalo. Pri súbore KML alebo KMZ zostane dialóg otvorený so súhrnom toho, čo sa vytvorilo a čo sa preskočilo.',
  'help.guide.import-places-file.result':
    'Miesta sú v zozname. Stopa má na svojom riadku farebnú čiaru, kreslí sa na mape a dostane vlastný filter Stopy.',
  'help.guide.import-places-file.tip.1':
    'Príliš veľký súbor TREK odmietne a uvedie limit veľkosti. Exportujte ho znova bez fotiek alebo ho rozdeľte.',
  'help.guide.import-places-file.tip.2': 'Celý import môžete vrátiť späť z panela nástrojov nad dňami.',
  // import-places-list
  'help.guide.import-places-list.title': 'Importovať zdieľaný zoznam z Google Maps alebo Naver Maps',
  'help.guide.import-places-list.goal': 'Importujte miesta z odkazu na zdieľaný zoznam.',
  'help.guide.import-places-list.step.1':
    'Kliknite na „Importovať miesta“, ikonu vedľa tlačidla na pridanie, a vyberte „Import zoznamu“.',
  'help.guide.import-places-list.step.2':
    'Pod Poskytovateľ vyberte Zoznam Google alebo Zoznam Naver a do Odkaz vložte zdieľaný odkaz na zoznam. Funguje aj odkaz na trasu z Google Maps: jeho zastávky sa stanú miestami, v poradí jazdy.',
  'help.guide.import-places-list.step.3': 'Kliknite na Importovať.',
  'help.guide.import-places-list.result':
    'Všetky miesta zo zoznamu sú v ceste s rovnakými názvami ako v zozname. Miesta, ktoré už v ceste boli, sa preskočia.',
  'help.guide.import-places-list.tip.1':
    'Zoznam musí byť zdieľaný verejne. Z odkazu na súkromný zoznam sa nič neimportuje.',
  'help.guide.import-places-list.tip.2':
    'Obohatiť miesta cez Google sa v dialógu zobrazí, ak má váš TREK kľúč Google: vyhľadá každé importované miesto a doplní fotky, adresu a podrobnosti.',
  'help.guide.sort-places.title': 'Zoradenie zoznamu miest',
  'help.guide.sort-places.goal':
    'Zoraďte zoznam podľa názvu, hodnotenia alebo podľa toho, čo pribudlo či sa zmenilo naposledy.',
  'help.guide.sort-places.step.1':
    'Kliknite na Zoradiť podľa, tlačidlo so šípkami na konci riadka filtrov. Začiarknutie označuje aktuálne poradie a tooltip tlačidla ukazuje jeho názov.',
  'help.guide.sort-places.step.2':
    'Vyberte poradie, napríklad Najlepšie hodnotené, alebo zoraďte podľa názvu. Zoznam sa okamžite aktualizuje.',
  'help.guide.sort-places.result': 'Zoznam ukazuje miesta v zvolenom poradí, kým nevyberiete iné.',
  'help.guide.sort-places.tip.1':
    'Každé iné poradie ako Naposledy pridané zvýrazní tlačidlo, takže hneď vidíte, že je zoznam zoradený inak.',
  'help.guide.sort-places.tip.2':
    'Zoradenie mení len zoznam. Dni majú vlastné poradie a váš prehliadač si pamätá poradie, ktoré ste vybrali.',
  'help.guide.place-by-hand.title': 'Pridanie miesta, ktoré vyhľadávanie nepozná',
  'help.guide.place-by-hand.goal':
    'Ak vyhľadávanie miest nič nenájde, zadajte miesto sami aj s telefónom, e-mailom a otváracími hodinami.',
  'help.guide.place-by-hand.step.1':
    'V dialógu miesta napíšte názov do vyhľadávania a stlačte Enter. Keď sa nič nenájde, dialóg to oznámi a ponúkne Pridať ručne.',
  'help.guide.place-by-hand.step.2':
    'Kliknite na Pridať ručne. Text, ktorý ste hľadali, sa stane názvom a dialóg sa posunie k poliam s kontaktmi.',
  'help.guide.place-by-hand.step.3': 'Ak ich poznáte, vyplňte „Telefón“ a „E-mail“.',
  'help.guide.place-by-hand.step.4':
    'Kliknite na „Pridať otváracie hodiny“ a nastavte, kedy miesto v jednotlivé dni otvára a zatvára. Tlačidlo kopírovania nastaví všetkým dňom hodiny prvého dňa a prepínačom dňa ho označíte ako „Uzavreté“.',
  'help.guide.place-by-hand.step.5': 'Kliknite na Pridať.',
  'help.guide.place-by-hand.result':
    'Miesto sa pridá do zoznamu. Jeho podrobnosti ukazujú telefón, e-mail a otváracie hodiny, ktoré ste zadali, rovnako ako pri mieste nájdenom vyhľadávaním.',
  'help.guide.place-by-hand.tip.1':
    'Keď upravujete miesto bez vlastných otváracích hodín, automaticky sa doň skopírujú otváracie hodiny z „Podrobností miesta“ vľavo. Ak už hodiny má, vyhľadané hodiny skopírujete tlačidlom vedľa nich.',
  'help.guide.place-by-hand.tip.2':
    'Hodiny, ktoré zadáte, nahradia vyhľadané, takže kaviareň so sezónnymi hodinami ukáže hodiny, ktoré poznáte vy.',

  // ── Screen: trip-days ─────────────────────────────────────────────────────────────────
  'help.ctx.trip-days.title': 'Dni',
  'help.ctx.trip-days.summary':
    'Ľavý stĺpec plánu: pre každý deň jedna karta so zastávkami v poradí, poznámkami, rezerváciami a dopravou daného dňa a s trasou medzi zastávkami. Práve tu cestu naozaj plánujete.',
  'help.ctx.trip-days.bullet.1':
    'Hlavička navrchu: vľavo Exportovať (PDF, kalendár, GPX), vpravo šípka späť, Rozbaliť všetky dni / Zbaliť všetky dni, Zmeniť poradie dní a Zobraziť všetky trasy rezervácií, akonáhle má nejaká rezervácia trasu na nakreslenie.',
  'help.ctx.trip-days.bullet.2':
    'Karta dňa: dlaždica s číslom dňa a predpoveďou, názov (Deň 1, kým ho nepomenujete) a dátum a pod nimi štítky pre nocľah (zelený pri príchode, červený pri odchode, prerušovaný, kým nie je potvrdený; jeho lístok otvorí rezerváciu) a pre prenajaté auto. Kliknutím na záhlavie deň otvoríte, šípka ho zbalí a + (Pridať k dňu) otvorí ponuku: Pridať miesto k tomuto dňu, Pridať ubytovanie, Pridať dopravu, Verejná doprava a Pridať poznámku. Pravé tlačidlo myši na záhlaví ponúka to isté plus Vyprázdniť deň.',
  'help.ctx.trip-days.bullet.3':
    'Vnútri dňa: zastávky v poradí, každá s obrázkom, ikonou kategórie, názvom, časom a popisom, s rezerváciami prepojenými s ňou a s tým, kto ide; poznámky; rezervácie a doprava dňa, zafarbené podľa typu. Keď ukážete myšou na zastávku, zobrazí sa jej úchyt na presúvanie, zámok na obrázku, šípky, Pridať rezerváciu a tri bodky (Ďalšie možnosti). Ponuku zastávok a poznámok otvoríte aj pravým tlačidlom myši.',
  'help.ctx.trip-days.bullet.4':
    'Keď má otvorený deň aspoň dve zastávky, objaví sa pod nimi lišta trasy: „Trasa“ zobrazí deň na mape spolu s časom presunu medzi jednotlivými zastávkami, tri ikony nastavia pre deň Auto, Pešo alebo Bicykel a za nimi sú „Optimalizovať“, „Otvoriť v Mapách Google“ a „Otvoriť v CoMaps“.',
  'help.ctx.trip-days.bullet.5':
    'Miesta môžete do dňa pridať viacerými spôsobmi: potiahnite riadok zo stĺpca miest, použite „+ Deň“ v tomto riadku, „Pridať miesto k tomuto dňu“ v ponuke + dňa alebo v prázdnom dni, prípadne podrobnosti miesta.',
  'help.ctx.trip-days.bullet.6':
    'Celkové náklady dole sčítavajú výdavky z Náklady, ktoré patria k zastávkam a rezerváciám dňa, každý raz, vo vašej zobrazovanej mene.',
  // read-day-plan
  'help.guide.read-day-plan.title': 'Čítanie dňa v pláne',
  'help.guide.read-day-plan.goal': 'Zistite, čo vám hovorí každá časť karty dňa, skôr než niečo zmeníte.',
  'help.guide.read-day-plan.step.1':
    'Záhlavie: dlaždica s číslom dňa a predpoveďou, potom Deň 1 alebo názov, ktorý ste dňu dali, a dátum. Pod nimi sú pilulky pre nocľah (zelená pri príchode, červená pri odchode, prerušovaná, kým nie je potvrdený; lístok na nej otvorí rezerváciu) a pre prenajaté auto. Kliknutím na záhlavie deň otvoríte (jeho panel s podrobnosťami sa otvorí nad mapou). Tlačidlo + vpravo (Pridať k dňu) pridá miesto, pobyt, dopravu, spojenie verejnou dopravou alebo poznámku a šípka kartu zbalí.',
  'help.guide.read-day-plan.step.2':
    'Pri zastávke vidíte jej obrázok, ikonu kategórie a názov, potom čas, ak má „Začiatok“, a popis. Pod ňou sú „Poznámky pre tento deň“. Keď na riadok nabehnete myšou, objavia sa ovládacie prvky: úchytom vľavo ho presuniete, obrázok sa zmení na zámok pre optimalizáciu trasy a na pravom konci sú šípky („Posunúť nahor“, „Posunúť nadol“), „Pridať rezerváciu“ a tri bodky („Ďalšie možnosti“).',
  'help.guide.read-day-plan.step.3':
    'Rezervácia pri zastávke sa na nej zobrazí ako odznak Rezervácia, zelený, keď je potvrdená, a oranžový, kým čaká na potvrdenie, s časom a dopravcom. Kliknutím na odznak rezerváciu otvoríte, tlačidlo trasy vedľa neho nakreslí jej trasu. Doprava má vlastný riadok, zafarbený podľa typu, s časom a údajom Odlet alebo Prílet. Kliknutím na rezerváciu otvoríte jej podrobnosti, tlačidlom Upraviť ju tam zmeníte.',
  'help.guide.read-day-plan.step.4':
    'Ak je zapnuté Trasa, spojnica medzi dvoma zastávkami ukazuje, ako dlho úsek trvá a aký je dlhý, v režime cestovania daného dňa. Kliknutím naň zmeníte režim iba pre tento jeden úsek.',
  'help.guide.read-day-plan.step.5':
    'Lišta trasy pod zastávkami otvoreného dňa: Trasa nakreslí cestu dňa na mape, tri ikony vyberú Auto, Pešo alebo Bicykel, Optimalizovať zmení poradie zastávok a Otvoriť v Mapách Google a Otvoriť v CoMaps tam deň otvoria.',
  'help.guide.read-day-plan.result':
    'Každý symbol na karte niečo znamená. Návody nižšie vysvetľujú, ako ktorý z nich zmeniť.',
  'help.guide.read-day-plan.tip.1':
    'Ponuku zastávky otvoríte pravým kliknutím alebo cez jej tri bodky: Upraviť, Odobrať z dňa, Vynechať z trasy, Otvoriť webovú stránku, Uložiť do zbierky, Vymazať. Navigačné aplikácie nájdete v podrobnostiach miesta v časti „Navigácia“.',
  'help.guide.read-day-plan.tip.2':
    'Keď ukážete kurzorom na zastávku, na konci riadka sa zobrazí Pridať rezerváciu. Rezervácia vytvorená tam je prepojená s touto zastávkou v tento deň.',
  // place-onto-day
  'help.guide.place-onto-day.title': 'Pridanie miesta do dňa',
  'help.guide.place-onto-day.goal': 'Pridajte miesto zo zoznamu ako zastávku do dňa, na správne miesto v poradí.',
  'help.guide.place-onto-day.step.1':
    'Potiahnite riadok zo stĺpca miest na kartu dňa. Ak ho pustíte medzi dve zastávky, zaradí sa presne tam, ak ho pustíte na záhlavie dňa, pridá sa na koniec.',
  'help.guide.place-onto-day.step.2':
    'Bez ťahania: otvorte deň kliknutím na jeho záhlavie a potom kliknite na okrúhle + na konci riadku miesta (+ Deň), alebo na riadok kliknite pravým tlačidlom a vyberte + Deň.',
  'help.guide.place-onto-day.step.3':
    '„Pridať miesto k tomuto dňu“ v ponuke + dňa alebo v prázdnom dni otvorí formulár miesta a nové miesto sa hneď pridá do dňa.',
  'help.guide.place-onto-day.step.4':
    'Pri otvorenom dni dá Pridať k dňu v podrobnostiach miesta miesto do toho dňa. Ku dňu v záhlaví stĺpca miest vytvorí nové miesto rovno v otvorenom dni.',
  'help.guide.place-onto-day.result':
    'Miesto je teraz zastávkou dňa. Na mape sa zobrazí s číslom dňa a stĺpec miest ho započíta pod Plánované.',
  'help.guide.place-onto-day.tip.1':
    'Miesto môže byť vo viacerých dňoch: do druhého dňa ho pridajte zo stĺpca miest. Ak zastávku potiahnete z karty jedného dňa na kartu iného, naopak sa presunie.',
  'help.guide.place-onto-day.tip.2': 'Šípka späť v hlavičke priradenie vráti.',
  'help.guide.place-onto-day.tip.3':
    'Zastávku nemôžete pustiť medzi dva záznamy s pevným časom ani pred rezerváciu, ktorá už čas má. Plán tak zostáva v časovom poradí.',
  // reorder-stops
  'help.guide.reorder-stops.title': 'Zmena poradia dňa',
  'help.guide.reorder-stops.goal': 'Posuňte zastávku nahor alebo nadol, alebo ju presuňte do iného dňa.',
  'help.guide.reorder-stops.step.1': 'Ukážte na zastávku a potiahnite ju za úchyt na novú pozíciu v karte.',
  'help.guide.reorder-stops.step.2':
    'Alebo použite šípky na pravom konci zastávky, na ktorú ukazujete myšou (Posunúť nahor, Posunúť nadol): jedno kliknutie je jeden krok.',
  'help.guide.reorder-stops.step.3':
    'Ak zastávku potiahnete na kartu iného dňa, presunie sa tam a z pôvodného dňa zmizne.',
  'help.guide.reorder-stops.step.4':
    'Ak má zastávka pevný čas a presun by porušil poradie dňa, TREK sa opýta Odobrať čas?, pretože čas určuje polohu zastávky. Potvrdiť čas odstráni, takže zastávku možno presunúť kamkoľvek. Zrušiť nechá deň, ako bol.',
  'help.guide.reorder-stops.result': 'Trasa aj časy presunov sa hneď prispôsobia novému poradiu.',
  'help.guide.reorder-stops.tip.1':
    'Rezervácia s pevným časom zostáva na mieste, ktoré zodpovedá jej času. Ak ju v rámci dňa presuniete inam, vráti sa späť. Ak ju pretiahnete na kartu iného dňa, presunie sa do toho dňa.',
  'help.guide.reorder-stops.tip.2':
    'Optimalizovať v lište trasy zoradí celý deň podľa najkratšej cesty, ak má deň aspoň tri zastávky. Zastávku, ktorá má zostať na mieste, najprv zamknite.',
  // set-stop-times
  'help.guide.set-stop-times.title': 'Nastavenie času zastávky',
  'help.guide.set-stop-times.goal': 'Určte, kedy zastávka začína a končí, aby sa deň čítal ako harmonogram.',
  'help.guide.set-stop-times.step.1':
    'Kliknite na zastávku pravým tlačidlom alebo na jej tri bodky a vyberte „Upraviť“. Ak formulár otvoríte z dňa, nájdete v ňom hneď pod miestom polia „Začiatok“ a „Do“ pre tento deň.',
  'help.guide.set-stop-times.step.2':
    'Zadajte Začiatok a, ak chcete, aj Do. Časový prekryv s: upozorní, že sa prekrýva iná zastávka dňa s časom. Ak je Do pred Začiatkom, Aktualizovať je zablokované.',
  'help.guide.set-stop-times.step.3':
    'Kliknite na Aktualizovať. Zastávka dostane časový štítok a presunie sa na správne miesto v dni podľa svojho času.',
  'help.guide.set-stop-times.result':
    'Zastávky s časom si ponechajú svoje miesto v poradí a zastávky bez času sa zoradia okolo nich.',
  'help.guide.set-stop-times.tip.1': 'Čas patrí k zastávke v danom dni. To isté miesto môže mať v inom dni iný čas.',
  'help.guide.set-stop-times.tip.2':
    'Ak chcete zastávku s časom presunúť ručne, potiahnite ju. TREK sa opýta Odobrať čas? a po kliknutí na Potvrdiť sa čas odstráni.',
  'help.guide.set-stop-times.tip.3':
    'Poznámky pre tento deň v tom istom formulári sú na informácie, ktoré platia len v tento deň, napríklad rezerváciu stola alebo číslo lístka.',
  // remove-from-day
  'help.guide.remove-from-day.title': 'Odobrať zastávku z dňa',
  'help.guide.remove-from-day.goal': 'Odstráňte miesto z dňa bez toho, aby ste ho vymazali z cesty.',
  'help.guide.remove-from-day.step.1':
    'Kliknite na zastávku pravým tlačidlom, alebo na jej tri bodky, a vyberte Odobrať z dňa.',
  'help.guide.remove-from-day.step.2':
    'Zastávka sa z dňa odstráni. Miesto zostane v stĺpci miest, v časti Nezaradené, ak nie je v žiadnom inom dni.',
  'help.guide.remove-from-day.result':
    'Deň, jeho trasa aj náklady sa aktualizujú. Šípkou „Vrátiť späť“ zastávku obnovíte.',
  'help.guide.remove-from-day.tip.1': '„Vymazať“ v tej istej ponuke odstráni miesto z celej cesty, zo všetkých dní.',
  'help.guide.remove-from-day.tip.2': 'Odobrať z dňa nájdete aj v paneli s podrobnosťami miesta, vedľa Pridať k dňu.',
  // lock-stop
  'help.guide.lock-stop.title': 'Zamknutie zastávky na mieste',
  'help.guide.lock-stop.goal': 'Ponechajte zastávku na jej pozícii aj pri optimalizácii trasy.',
  'help.guide.lock-stop.step.1':
    'Ukážte kurzorom na obrázok zastávky a kliknite na zámok: Zachovať pozíciu pri optimalizácii trasy.',
  'help.guide.lock-stop.step.2':
    'Optimalizovať teraz zoradí ostatné zastávky okolo nej. Zámok odomknete opätovným kliknutím naň (Kliknutím odomknete).',
  'help.guide.lock-stop.result': 'Na obrázku sa zobrazí zámok a zastávka zostane na svojom mieste, kým ju neodomknete.',
  'help.guide.lock-stop.tip.1':
    'Zastávku s pevným časom drží na mieste jej čas, pri optimalizácii sa nikdy nepresunie.',
  'help.guide.lock-stop.tip.2':
    'Zámok platí len do opätovného načítania stránky. Po ňom sú všetky zastávky opäť odomknuté, pevné zostanú len zastávky s časom.',
  // day-note
  'help.guide.day-note.title': 'Pridanie poznámky k dňu',
  'help.guide.day-note.goal': 'Uložte si do dňa pripomienku, číslo lístka alebo náhradný plán.',
  'help.guide.day-note.step.1': 'Kliknite na + v záhlaví dňa (Pridať k dňu) a vyberte Pridať poznámku.',
  'help.guide.day-note.step.2':
    'Názov poznámky napíšte do hornej časti dialógu, kde je Poznámka. Karta dňa zobrazuje tento názov. Zvyšok napíšte do poľa Poznámka ku dňu: panel nástrojov nad ním formátuje text (tučné písmo, zoznamy, odkazy, citácie) a Náhľad vľavo ukazuje, ako riadok bude vyzerať.',
  'help.guide.day-note.step.3':
    'Vyberte Ikonu a Farbu, aby sa poznámka dala ľahko odlíšiť od zastávok, a potom kliknite na Pridať.',
  'help.guide.day-note.step.4':
    'Poznámka sa v dni zobrazí ako zastávka: potiahnite ju na správne miesto alebo použite jej šípky. Kliknutím ju upravíte. „Vymazať“ nájdete v dialógu aj v ponuke troch bodiek či pravého tlačidla myši a najprv sa opýta „Vymazať poznámku?“.',
  'help.guide.day-note.result': 'Poznámka je súčasťou dňa aj PDF, a to na mieste, kam ste ju potiahli.',
  'help.guide.day-note.tip.1':
    'Odkazy v poznámke sa otvárajú na novej karte a jednoduchý zlom riadka zostáva zlomom riadka.',
  'help.guide.day-note.tip.2': 'Poznámky sa viažu na jednotlivé dni. Poznámku k celej ceste dajte do „Spolupráce“.',
  // day-route
  'help.guide.day-route.title': 'Zobrazenie a optimalizácia trasy dňa',
  'help.guide.day-route.goal':
    'Pozrite si trasu medzi zastávkami, vyberte spôsob cestovania a nechajte TREK zoradiť poradie.',
  'help.guide.day-route.step.1':
    'Otvorte deň a kliknite na Trasa v lište trasy pod jeho zastávkami: trasa medzi zastávkami sa nakreslí na mape a spojnice medzi zastávkami ukazujú čas a vzdialenosť každého úseku.',
  'help.guide.day-route.step.2':
    'Tromi ikonami vedľa nastavíte spôsob dopravy pre deň: Auto, Pešo alebo Bicykel. Úseky sa prepočítajú. Pluginy môžu pridať ďalšie spôsoby.',
  'help.guide.day-route.step.3':
    'Kliknutím na spojnicu zmeníte režim toho jedného úseku: vyberte režim, Verejná doprava, ak chcete pre úsek vyhľadať spojenie tam, kde sa ponúka, alebo Použiť predvolené pre deň, ak sa má znova použiť režim dňa.',
  'help.guide.day-route.step.4':
    'Optimalizovať (kruhová šípka) preusporiada zastávky podľa najkratšej cesty, od troch zastávok. Zastávky so zámkom alebo pevným časom zostanú na svojom mieste. Ak je v dni ubytovanie, trasa začína tam.',
  'help.guide.day-route.step.5':
    'Otvoriť v Mapách Google alebo Otvoriť v CoMaps otvorí celý deň ako trasu v tejto aplikácii, aby ste sa mohli navigovať na ceste. CoMaps preberie aj spôsob cestovania daného dňa.',
  'help.guide.day-route.result':
    'Deň je trasa s časmi. Celkové náklady a úseky sa aktualizujú pri každej zmene poradia.',
  'help.guide.day-route.tip.1':
    'Trasy predvolene počíta OSRM. Správca môže v časti „Predvolené nastavenia používateľa“ nastaviť pre TREK iný smerovací nástroj.',
  'help.guide.day-route.tip.2':
    'Úsek, pre ktorý sa nepodarilo nájsť trasu, nezobrazuje čas. Skontrolujte, či majú obe zastávky súradnice.',
  'help.guide.day-route.tip.3': 'Šípka späť vráti optimalizáciu.',
  // manage-days
  'help.guide.manage-days.title': 'Pridanie, presunutie a premenovanie dní',
  'help.guide.manage-days.goal': 'Upravte samotné dni, nielen miesta v nich.',
  'help.guide.manage-days.step.1':
    'Dni vychádzajú z dátumov cesty. Zmeňte dátumy vo formulári na úpravu cesty v časti Prehľad a dni sa na začiatku alebo na konci pridajú či odstránia. Predtým, než sa odstráni deň s obsahom, zoznam ukáže, ktoré dni sa odstránia a čo na nich je.',
  'help.guide.manage-days.step.2':
    'Zmeniť poradie dní v záhlaví otvorí zoznam: potiahnite deň za úchyt alebo použite Posunúť nahor a Posunúť nadol. Deň sa presunie spolu so svojimi miestami, poznámkami a rezerváciami. Pod zoznamom Pridať s ďalším dátumom pridá deň za posledný dátumový a predĺži cestu o jeden deň. Bez dátumu pripojí deň bez dátumu. Cesta bez dátumov má iba Pridať deň.',
  'help.guide.manage-days.step.3':
    'Vymazať deň, kôš na konci riadka, sa najprv opýta. Vypíše, čo sa s dňom vymaže: jeho miesta, poznámky a rezervácie, pobyt, ktorý v ňom začína alebo končí, a dni, ktoré sa posunú o jeden dátum skôr. Vymazať deň ho odstráni, Zrušiť ho ponechá. Posledný deň sa vymazať nedá.',
  'help.guide.manage-days.step.4':
    'Ak chcete deň premenovať, otvorte ho a v paneli s podrobnosťami nad mapou kliknite na ceruzku vedľa jeho názvu. Názov nahradí Deň 1 na karte aj v PDF.',
  'help.guide.manage-days.step.5':
    'Tlačidlami „Rozbaliť všetky dni“ a „Zbaliť všetky dni“ v záhlaví rozbalíte alebo zbalíte všetky karty naraz. Jednu kartu zbalíte kliknutím na jej šípku.',
  'help.guide.manage-days.result':
    'Dátumy zostávajú viazané na pozíciu: keď deň posuniete nahor, dostane skorší dátum a jeho zastávky, poznámky a rezervácie sa presunú spolu s ním.',
  'help.guide.manage-days.tip.1': 'Presun dní môžete vrátiť šípkou späť, vymazanie dňa nie.',
  'help.guide.manage-days.tip.2': 'Celkové náklady na konci plánu sčítajú celú cestu, rozpis nájdete v karte Náklady.',
  // bookings-in-plan
  'help.guide.bookings-in-plan.title': 'Rezervácie a doprava v pláne',
  'help.guide.bookings-in-plan.goal':
    'Zistite, kde sa rezervácia zobrazí, keď už existuje, a na ktorej obrazovke sa vytvára.',
  'help.guide.bookings-in-plan.step.1':
    'Doprava (let, vlak, trajekt, autobus, auto) je riadok zafarbený podľa typu, s časom a s Odlet v deň odchodu alebo Prílet v deň príchodu. Glóbus vedľa neho uvádza časové pásmo a let s medzipristátím má jeden riadok na každý úsek. Pri spojení verejnou dopravou zobrazíte linky kliknutím na šípku. Kliknutím na riadok otvoríte rezerváciu a Upraviť tam ju zmení.',
  'help.guide.bookings-in-plan.step.2':
    'Rezervácia prepojená so zastávkou (reštaurácia, prehliadka) sa na tejto zastávke zobrazí ako štítok Rezervácia s časom. Štítok je zelený, keď je rezervácia potvrdená, a jantárový, kým čaká. Rezervácia s dňom, ale bez zastávky, má v dni vlastný riadok.',
  'help.guide.bookings-in-plan.step.3':
    'Noc v hoteli je ubytovanie: jeho štítok v hlavičke dňa je pri príchode zelený a pri odchode červený a ikona lístka otvorí rezerváciu. Panel podrobností dňa ho uvádza pod „Ubytovanie“ a trasa každého z týchto dní tam začína.',
  'help.guide.bookings-in-plan.step.4':
    'Na mape tlačidlo trasy v riadku rezervácie nakreslí jej trasu. Zobraziť všetky trasy rezervácií v hlavičke nakreslí všetky.',
  'help.guide.bookings-in-plan.step.5':
    'Vytváranie: Pridať rezerváciu na zastávke, na ktorú ukazujete myšou, Pridať dopravu a Verejná doprava v ponuke + pri dni a karty Rezervácie a Doprava pre úplný zoznam s importom a súbormi.',
  'help.guide.bookings-in-plan.result':
    'Každá rezervácia je v pláne práve raz. Záložky ukazujú tie isté rezervácie ako zoznam.',
  'help.guide.bookings-in-plan.tip.1':
    'Potvrdené a čaká na potvrdenie je stav, ktorý nastavíte na rezervácii. Plán ho ukazuje na zastávke, karta Rezervácie počíta obe.',
  'help.guide.bookings-in-plan.tip.2':
    'Ak rezerváciu s časom presuniete v rámci jej dňa inam, vráti sa na miesto podľa svojho času. Ak ju pretiahnete na kartu iného dňa, presunie sa do toho dňa. Čas zmeníte úpravou rezervácie.',
  // export-plan
  'help.guide.export-plan.title': 'Export plánu',
  'help.guide.export-plan.goal': 'Exportujte plán ako dokument, do kalendára alebo do zariadenia GPS.',
  'help.guide.export-plan.step.1': 'Kliknite na Exportovať vľavo v hornej lište nad dňami.',
  'help.guide.export-plan.step.2':
    'Dokument: PDF otvorí tlačové zobrazenie všetkých dní so zastávkami, poznámkami a rezerváciami, na začiatku s mapou prehľadu trasy. Môj plán ako PDF ponechá len to, na čom sa zúčastňujete. V zobrazení začne Zalomenie strany pre každý deň každý deň na novej strane, Poznámky k doprave pridá poznámky k vašim dopravám a Uložiť ako PDF súbor stiahne.',
  'help.guide.export-plan.step.3':
    'Kalendár: Stiahnuť .ics uloží rezervácie ako súbor kalendára. Prihlásiť sa na odber kalendára poskytne odkaz, ktorý vaša kalendárová aplikácia obnovuje automaticky.',
  'help.guide.export-plan.step.4':
    'Mapy a GPS (GPX): Celá cesta exportuje miesta, trasy dní a stopy. Len miesta exportuje iba špendlíky. Dni ako trasy exportuje jednu trasu na deň, pre offline mapy a zariadenia GPS.',
  'help.guide.export-plan.result': 'Súbor sa stiahne a v ceste sa nič nezmení.',
  'help.guide.export-plan.tip.1':
    'Jeden deň otvoríte v mapovej aplikácii z jeho lišty trasy: Otvoriť v Mapách Google alebo Otvoriť v CoMaps.',
  'help.guide.export-plan.tip.2':
    '„Prihlásiť sa na odber kalendára“ vyžaduje, aby ste mali v nastaveniach zapnuté kalendárové kanály a právo cestu zdieľať; návod nájdete v časti „Prehľad“.',
  'help.guide.export-plan.tip.3':
    'Export vyžaduje iba právo na čítanie: každý člen cesty môže exportovať PDF, .ics aj GPX.',

  // ── Screen: trip-place ────────────────────────────────────────────────────────────────
  'help.ctx.trip-place.title': 'Podrobnosti miesta',
  'help.ctx.trip-place.summary':
    'Karta, ktorá sa otvorí nad mapou, keď vyberiete miesto: všetko, čo cesta o mieste vie, hviezdičkové hodnotenia od všetkých, obrázok a súbory miesta a tlačidlá, ktoré ho pridajú do otvoreného dňa, otvoria v mapovej aplikácii alebo uložia do zoznamu.',
  'help.ctx.trip-place.bullet.1':
    'Kliknite na riadok v stĺpci miest, na zastávku v dni alebo na značku na mape a nad mapou sa otvorí karta. Ak ju otvoríte zo dňa, karta vie, o ktorú zastávku ide, a zobrazí aj jej účastníkov a rezerváciu. Túra (pešia túra, jazda alebo prechádzka z karty „Túry“) namiesto toho otvorí vlastnú kartu túry.',
  'help.ctx.trip-place.bullet.2':
    'Záhlavie ukazuje okrúhly obrázok, názov, adresu v jednom riadku a štítky s tým, čo je známe: otvorené alebo zatvorené, kategória, čas, cena, telefónne číslo, e-mail a súradnice. Kliknutím na obrázok použijete vlastný alebo fotku zo súborov miesta. Dvojitým kliknutím na názov miesto premenujete. X vpravo kartu zatvorí. Obrázok, premenovanie, Upraviť a Vymazať sú dostupné iba cestujúcim, ktorí smú meniť miesta.',
  'help.ctx.trip-place.bullet.3':
    'Pod ňou: hviezdičky, ktoré miestu dal každý cestovateľ, popis a poznámky, a Poznámky pre tento deň, ak ich zastávka má.',
  'help.ctx.trip-place.bullet.4':
    'Potom nasledujú Otváracie hodiny, Farba trasy, Dáta trasy a Súborov, ak sa na dané miesto vzťahujú. Nahrať v nadpise Súborov pridá súbory z počítača. Zoznam ukazuje aj súbory pripnuté k tejto zastávke a súbory jej rezervácie, vrátane potvrdenia hotela. Pluginy môžu nižšie pridať vlastné riadky.',
  'help.ctx.trip-place.bullet.5':
    'Riadok úplne dole: Pridať k dňu alebo Odobrať z dňa pri otvorenom dni, potom Navigácia (alebo názov vašej mapovej aplikácie, keď ste ju vybrali v Nastavenia), Otvoriť webovú stránku a Uložiť do zbierky. Vpravo červený kôš vymaže miesto a Upraviť otvorí jeho formulár.',
  'help.ctx.trip-place.bullet.6':
    'Pri mieste vybranom z vyhľadávania vidíte, čo o ňom vie index TREK alebo OpenStreetMap: „Otvorené“ alebo „Uzavreté“ medzi štítkami hore so zeleným alebo červeným krúžkom okolo obrázka podľa miestneho času na danom mieste; telefónne číslo, tiež ako štítok; nižšie „Otváracie hodiny“ s dnešnými hodinami v riadku a po kliknutí s celým týždňom; a webovú stránku pod „Otvoriť webovú stránku“. Hodnotenie Google sa zobrazí iba pri mieste nájdenom cez Google, v TREK s kľúčom Google. Otváracie hodiny, telefónne číslo a e-mail, ktoré ste do formulára miesta zadali sami, nahradia vyhľadané údaje a určujú aj farbu krúžku.',
  // read-place
  'help.guide.read-place.title': 'Čo sa o mieste dozviete z karty',
  'help.guide.read-place.goal': 'Pozrite si na jednej karte všetko, čo cesta o mieste vie.',
  'help.guide.read-place.step.1':
    'V stĺpci dní kliknite na zastávku, ktorú si chcete prečítať. Karta sa otvorí nad mapou a zastávka zostane v svojom dni označená.',
  'help.guide.read-place.step.2':
    'Navrchu: okrúhly obrázok, názov a adresa v jednom riadku, celá adresa je v tooltipe. Štítky pod nimi ukazujú Otvorené alebo Zatvorené práve teraz podľa miestneho času miesta, a podľa toho má obrázok zelený alebo červený krúžok. Ukazujú aj kategóriu, čas, telefónne číslo a e-mail (kliknutím otvoríte aplikáciu na telefonovanie alebo poštu) a na širokej obrazovke presné súradnice. X vpravo kartu zatvorí.',
  'help.guide.read-place.step.3':
    'Hodnotenie je prvá sekcia pod hlavičkou: hviezdičky, ktoré miestu dal každý cestujúci, s priemerom a počtom hlasov. Kým nikto nehlasoval, zobrazuje sa Zatiaľ bez hodnotenia.',
  'help.guide.read-place.step.4':
    'Potom popis a pod ním poznámky. Obe pochádzajú z formulára miesta aj s formátovaním: zoznamy, odkazy aj tučné písmo fungujú.',
  'help.guide.read-place.step.5': 'Účastníci ukazujú, kto ide na túto zastávku. Idú všetci, kým niekoho neodoberiete.',
  'help.guide.read-place.step.6':
    'Otváracie hodiny nižšie: riadok ukazuje hodiny dňa, ktorý si prezeráte. Kliknutím naň zobrazíte celý týždeň, pričom tento deň je tučne. Vedľa sú Súbory.',
  'help.guide.read-place.step.7':
    'Riadok dole ukazuje, čo môžete odtiaľto robiť: dať miesto do otvoreného dňa alebo ho z neho odobrať, otvoriť ho v mapovej aplikácii alebo na jeho webe, uložiť ho do zoznamu a vpravo ho vymazať (červený kôš) alebo upraviť.',
  'help.guide.read-place.result':
    'Karta zostane otvorená, kým ju nezavriete krížikom X alebo nevyberiete iné miesto. Otváracie hodiny na celý týždeň zostanú rozbalené a zastávka, ku ktorej karta patrí, zostane v stĺpci dní označená.',
  'help.guide.read-place.tip.1':
    'Keď vyberiete miesto zo stĺpca miest, karta ukazuje miesto, ale nie zastávku. Preto nezobrazuje účastníkov a z rezervácií iba tie, ktoré patria samotnému miestu, napríklad pobyt v hoteli. Ak chcete vidieť všetko, vyberte zastávku v rámci dňa.',
  'help.guide.read-place.tip.2':
    'Ak môžete upravovať miesta, dvojitým kliknutím na názov miesto premenujete bez otvárania formulára. Enter zmenu uloží, Escape ju zruší.',
  'help.guide.read-place.tip.3':
    'Ručne zadané miesto má iba údaje zadané vo formulári. Kliknite na Upraviť a vyplňte Telefón, E-mail a otváracie hodiny sami, alebo vyberte miesto z návrhov pod Hľadať miesta… a kliknutím na Aktualizovať ich nechajte vyhľadať. Hodnotenie z Google vyžaduje kľúč Google.',
  // rate-place
  'help.guide.rate-place.title': 'Hodnotenie miesta',
  'help.guide.rate-place.goal': 'Dajte miestu vlastné hviezdičky a pozrite si hodnotenia ostatných.',
  'help.guide.rate-place.step.1':
    'Otvorte miesto. Rad hviezdičiek je hneď pod hlavičkou a ukazuje priemer doterajších hlasov, s ich počtom v zátvorke.',
  'help.guide.rate-place.step.2':
    'Kliknite na požadovanú hviezdičku. Keď nad hviezdičkami pohybujete kurzorom, vypĺňajú sa, takže vidíte, aké hodnotenie dáte.',
  'help.guide.rate-place.step.3':
    'Váš hlas sa hneď započíta do priemeru a tváre vedľa neho ukazujú, kto hlasoval. Ukážte kurzorom na riadok a uvidíte hviezdičky všetkých.',
  'help.guide.rate-place.step.4':
    'Rovnaký priemer sa zobrazuje aj v riadku miesta v stĺpci miest, takže najlepšie miesta v zozname ľahko nájdete.',
  'help.guide.rate-place.result':
    'Vaše hviezdičky pri mieste vidia všetci v ceste. Hviezdičkou v riadku filtrov nad zoznamom si teraz môžete nechať zobraziť len miesta s určitým minimálnym hodnotením.',
  'help.guide.rate-place.tip.1': 'Hodnotiť môže každý cestujúci, aj v ceste, kde miesta smú meniť len niektorí.',
  'help.guide.rate-place.tip.2':
    'Kliknutím na hviezdičku, ktorú ste už dali, svoje hodnotenie odstránite. Ak miesto nikto nehodnotil, opäť ukazuje Zatiaľ bez hodnotenia.',
  'help.guide.rate-place.tip.3':
    'Vedľa hviezdičiek sa ako tváre zobrazí až šesť hlasujúcich. Tooltip vymenuje všetkých a označí vás.',
  // place-image
  'help.guide.place-image.title': 'Pridať miestu vlastný obrázok',
  'help.guide.place-image.goal': 'Nahraďte automatickú miniatúru vlastnou fotkou.',
  'help.guide.place-image.step.1': 'Otvorte miesto zo stĺpca miest.',
  'help.guide.place-image.step.2':
    'Ukážte na okrúhly obrázok v záhlaví: objaví sa fotoaparát a tooltip znie Nahrať obrázok. Kliknite naň a vyberte súbor. Ak má miesto medzi súbormi už nejaké fotky, TREK sa najprv opýta, čo chcete: Nahrať zo zariadenia, alebo jeden z obrázkov pod Z priložených súborov.',
  'help.guide.place-image.step.3': 'V hornej časti karty je teraz váš obrázok s malým červeným X v rohu.',
  'help.guide.place-image.step.4':
    'Rovnaký obrázok sa zobrazí aj v riadku miesta v stĺpci miest a na jeho značke na mape.',
  'help.guide.place-image.result':
    'Váš obrázok sa používa pre miesto všade: na karte, v stĺpci miest, pri zastávke v dni, na značke na mape aj v zdieľanej ceste.',
  'help.guide.place-image.tip.1': 'Prijímajú sa JPG, PNG, GIF a WebP a HEIC z iPhonu sa pri nahrávaní skonvertuje.',
  'help.guide.place-image.tip.2':
    'Krížikom v rohu svoj obrázok odstránite a znova sa zobrazí automatický. Samotné miesto sa nezmení.',
  'help.guide.place-image.tip.3':
    'Ak ste nepridali obrázok, TREK ho vyhľadá podľa súradníc miesta. Ak nič nenájde, zobrazí ikonu kategórie. Obrázok môžu nastaviť len cestujúci, ktorí smú meniť miesta.',
  // place-day-assign
  'help.guide.place-day-assign.title': 'Pridanie miesta do otvoreného dňa alebo jeho odobratie',
  'help.guide.place-day-assign.goal': 'Použite tlačidlo na karte namiesto ťahania riadka cez plánovač.',
  'help.guide.place-day-assign.step.1':
    'V stĺpci dní kliknite na hlavičku dňa. Tento deň je teraz otvorený a karta sa vzťahuje naň.',
  'help.guide.place-day-assign.step.2':
    'V stĺpci miest kliknite na miesto, ktoré v tom dni nie je. Otvorí sa jeho karta a v spodnom riadku ponúkne „Pridať k dňu“.',
  'help.guide.place-day-assign.step.3':
    'Kliknite na Pridať k dňu. Zastávka sa pridá na koniec dňa a tlačidlo sa zmení na Odobrať z dňa.',
  'help.guide.place-day-assign.step.4':
    'Zastávka je teraz v dni, na konci zoznamu. Potiahnite ju nahor na správnu pozíciu.',
  'help.guide.place-day-assign.step.5':
    '„Odobrať z dňa“ zastávku z dňa opäť odoberie a na karte sa znova zobrazí „Pridať k dňu“.',
  'help.guide.place-day-assign.result': 'Zastávka sa pridá do dňa alebo sa z neho odoberie. Samotné miesto sa nezmení.',
  'help.guide.place-day-assign.tip.1':
    'Tlačidlo existuje, len kým je otvorený nejaký deň. Bez otvoreného dňa nie je deň, do ktorého by sa miesto pridalo.',
  'help.guide.place-day-assign.tip.2':
    'Keď zastávku z dňa odoberiete, miesto zostane v ceste aj v stĺpci miest. Všade ho odstránite len tlačidlom „Vymazať“.',
  'help.guide.place-day-assign.tip.3':
    'Pri zastávke, ktorú do dňa pridala rezervácia ubytovania, nie je ani jedno tlačidlo. Túto noc pridáte a odoberiete v časti s nocľahom daného dňa.',
  // place-participants
  'help.guide.place-participants.title': 'Určenie, kto ide na zastávku',
  'help.guide.place-participants.goal': 'Určte, kto ide na jednu zastávku, bez zmeny toho, kto je v ceste.',
  'help.guide.place-participants.step.1':
    'Kliknite na zastávku v dni. Otvorí sa karta a v časti „Účastníci“ sú všetci, ktorí sú v ceste.',
  'help.guide.place-participants.step.2':
    'Kliknutím na čip cestujúceho ho odoberiete z tejto zastávky. Keď nad čip ukážete kurzorom, meno sa prečiarkne.',
  'help.guide.place-participants.step.3':
    'Hneď ako niekto chýba, zobrazí sa prerušované +. Kliknutím naň uvidíte, kto na zastávke nie je.',
  'help.guide.place-participants.step.4':
    'Kliknutím na meno danú osobu znova pridáte. Keď sú znova pridaní všetci, zastávka opäť patrí celej skupine.',
  'help.guide.place-participants.result':
    'Pri zastávke sú len cestujúci, ktorých ste vybrali. Zvyšok skupiny má v tom čase voľno.',
  'help.guide.place-participants.tip.1':
    'Účastníci sa zobrazia len pri vybranej zastávke, preto vyberte miesto v dni, nie v stĺpci miest. Zobrazia sa aj len v ceste s viac ako jedným cestujúcim.',
  'help.guide.place-participants.tip.2':
    'Ak nie je vybraný nikto, idú všetci. Preto zo zastávky nemožno odobrať posledného cestujúceho.',
  'help.guide.place-participants.tip.3': 'Aj hosť bez vlastného účtu môže byť účastníkom ako ktokoľvek iný.',
  // place-booking
  'help.guide.place-booking.title': 'Rezervácia pri zastávke',
  'help.guide.place-booking.goal': 'Pozrite si rezerváciu, ktorá patrí k zastávke, otvorte ju a prepojte s ňou novú.',
  'help.guide.place-booking.step.1':
    'Otvorte zastávku, ku ktorej rezervácia patrí. Karta ju uvádza v časti „Rezervácie“ ako samostatnú malú kartu s názvom rezervácie a stavom „Potvrdené“ alebo „Čaká na potvrdenie“.',
  'help.guide.place-booking.step.2':
    'Karta rezervácie ukazuje Dátum, Čas a Rezervačný kód, štítky s ďalšími údajmi rezervácie (číslo letu, nástupište, check-in) a prípadné poznámky k rezervácii.',
  'help.guide.place-booking.step.3': 'Kliknite na kartu rezervácie. Rezervácia sa otvorí nad mapou.',
  'help.guide.place-booking.step.4':
    'Upraviť dole v rezervácii otvorí jej vlastný formulár. V ňom Prepojiť s priradením dňa pripája rezerváciu k zastávke a už ukazuje túto zastávku. Formulár opäť zavrite.',
  'help.guide.place-booking.step.5':
    'Novú rezerváciu pre zastávku začnete v stĺpci dní: ukážte na zastávku a kliknite na Pridať rezerváciu, ikonu lístka na jej konci. Formulár sa otvorí ako Nová rezervácia, už prepojený so zastávkou.',
  'help.guide.place-booking.result':
    'Rezervácia je prepojená so zastávkou: zobrazuje sa na karte aj v dni a jej súbory nájdete aj tu v časti „Súbory“.',
  'help.guide.place-booking.tip.1':
    'Rezervácia sa zobrazí na zastávke, ku ktorej je pripnutá, a rezervácia hotela sa zobrazí aj pri hoteli, kdekoľvek ho otvoríte. Rezervácia bez zastávky je v karte Rezervácie.',
  'help.guide.place-booking.tip.2':
    'Jednu zastávku môže zdieľať viac rezervácií, napríklad obed a prehliadka, ktoré začínajú na tom istom mieste.',
  'help.guide.place-booking.tip.3':
    'Pri vlaku, lete alebo trajekte Upraviť otvorí namiesto toho formulár dopravy, ten istý, ktorý používa karta Doprava.',
  // place-files
  'help.guide.place-files.title': 'Uloženie lístkov k miestu priamo pri mieste',
  'help.guide.place-files.goal': 'Priložte lístok, poukaz alebo mapu k miestu, ku ktorému patrí.',
  'help.guide.place-files.step.1':
    'Otvorte miesto. „Súbory“ sú pod jeho podrobnosťami, vedľa „Otváracie hodiny“, ak ich miesto má, a kým miesto žiadne súbory nemá, je tam nápis „Súbory“.',
  'help.guide.place-files.step.2': 'Kliknite na Nahrať vpravo od nadpisu Súbory a vyberte súbor.',
  'help.guide.place-files.step.3': 'Na tlačidle vidíte, koľko súborov miesto má, a zoznam sa automaticky rozbalí.',
  'help.guide.place-files.step.4': 'Každý riadok ukazuje názov súboru a jeho veľkosť. Kliknutím súbor otvoríte.',
  'help.guide.place-files.result':
    'Súbor je priložený k miestu a započítaný na karte. Zobrazí sa aj v karte Súborov cesty.',
  'help.guide.place-files.tip.1':
    'Súbory uvádza aj to, čo je pripnuté k tejto zastávke a čo je pripojené k jej rezervácii, takže potvrdenie hotela sa zobrazí pri hoteli.',
  'help.guide.place-files.tip.2': 'Nahrať prijme viac súborov naraz a fotka medzi nimi sa môže stať obrázkom miesta.',
  'help.guide.place-files.tip.3':
    'Ak nemáte oprávnenie nahrávať súbory, tlačidlo „Nahrať“ sa nezobrazí. Súbory, ktoré už pri mieste sú, však uvidíte aj naďalej.',
  // place-navigation
  'help.guide.place-navigation.title': 'Otvorenie miesta v mapovej aplikácii alebo na jeho webovej stránke',
  'help.guide.place-navigation.goal': 'Otvorte miesto v navigačnej aplikácii, ktorou sa tam dostanete.',
  'help.guide.place-navigation.step.1': 'Otvorte miesto a v spodnom riadku kliknite na „Navigácia“.',
  'help.guide.place-navigation.step.2':
    'V zozname sú mapové aplikácie vhodné pre toto miesto: Google Maps, Waze, Apple Maps, OpenStreetMap a CoMaps a na Androide aj „Iná mapová aplikácia“.',
  'help.guide.place-navigation.step.3':
    'Kliknite na aplikáciu, ktorú používate. Kde sa dá, TREK do nej pošle samotné miesto, nielen jeho súradnice, takže dorazíte k správnemu vchodu.',
  'help.guide.place-navigation.step.4':
    'Otvoriť webovú stránku vedľa neho otvorí na novej karte vlastnú webovú stránku miesta, s otváracími hodinami a lístkami.',
  'help.guide.place-navigation.result':
    'Mapová aplikácia sa otvorí na mieste, webová stránka sa otvorí na novej karte a nič v ceste sa nezmení. Ak je TREK nainštalovaný ako aplikácia, namiesto novej karty sa otvorí mapová aplikácia.',
  'help.guide.place-navigation.tip.1':
    'Waze spustí navigáciu hneď. Ostatné aplikácie otvoria miesto a navigáciu spustíte ďalším ťuknutím.',
  'help.guide.place-navigation.tip.2':
    'Ktoré aplikácie sa ponúkajú, závisí od miesta a od vášho zariadenia: Apple Maps sa na Androide nenavrhuje, 高德地图 sa ponúka len pri mieste v Číne a Waze, Apple Maps a CoMaps potrebujú súradnice miesta. Iná mapová aplikácia otvorí miesto v ľubovoľnej mapovej aplikácii vo vašom telefóne s Androidom.',
  'help.guide.place-navigation.tip.3':
    'Mapovú aplikáciu si vyberte raz v Nastavenia, pod Otvárať miesta v. Tlačidlo potom zobrazí jej názov a otvorí ju rovno. Urobí to isté aj vtedy, keď sa k miestu hodí len jedna aplikácia.',
  // place-to-collection
  'help.guide.place-to-collection.title': 'Uložiť miesto do jedného zo svojich zoznamov',
  'help.guide.place-to-collection.goal': 'Uložte si miesto, ktoré ste našli na tejto ceste, pre ďalšiu.',
  'help.guide.place-to-collection.step.1': 'Otvorte miesto a v riadku dole na karte kliknite na „Uložiť do zbierky“.',
  'help.guide.place-to-collection.step.2':
    'Uložiť do zoznamu ukazuje každý zoznam, ktorý vlastníte alebo zdieľate. Vyplnená záložka vpravo označuje zoznamy, ktoré toto miesto už obsahujú.',
  'help.guide.place-to-collection.step.3': 'Kliknite na zoznam. Miesto sa do neho hneď pridá.',
  'help.guide.place-to-collection.step.4': 'Dialóg zatvorte pomocou X a tlačidlo v karte bude ukazovať Uložené.',
  'help.guide.place-to-collection.result':
    'Miesto je vo vašom zozname aj s obrázkom, poznámkami a adresou, pripravené na ďalšiu cestu.',
  'help.guide.place-to-collection.tip.1':
    'Tlačidlo je k dispozícii, len kým je zapnutý doplnok „Zbierky“, ktorý administrátor zapína v časti „Doplnky“.',
  'help.guide.place-to-collection.tip.2':
    'Miesto môže byť naraz vo viacerých zoznamoch, v každom s iným stavom: v jednom ako nápad, v inom ako navštívené.',
  'help.guide.place-to-collection.tip.3':
    'Označiť ako navštívené, pod názvom miesta navrchu výberu, označí miesto v zozname ako navštívené. Ak je miesto vo viacerých vašich zoznamoch, tlačidlo ukazuje Navštívené všade a označí ho vo všetkých naraz. Zobrazenie otvorí vaše zoznamy v Zbierky.',
  // place-track
  'help.guide.place-track.title': 'Čítanie stopy a nastavenie jej vlastnej farby',
  'help.guide.place-track.goal': 'Zistite, aká dlhá je importovaná prechádzka a ktorá čiara na mape jej patrí.',
  'help.guide.place-track.step.1':
    'Riadok stopy v stĺpci miest ukazuje krátku čiarku vo farbe stopy na mape. Kliknite na ňu.',
  'help.guide.place-track.step.2': 'Dáta trasy uvádzajú dĺžku trasy v jednotkách, ktoré ste nastavili.',
  'help.guide.place-track.step.3':
    '„Farba trasy“ nad nimi ukazuje aktuálnu farbu. Kliknutím na riadok otvoríte vzorkovník farieb.',
  'help.guide.place-track.step.4': 'Vyberte farbu. Čiara na mape aj prúžok v riadku sa podľa nej zmenia.',
  'help.guide.place-track.step.5':
    'Prerušovaná bunka vľavo, Automatická farba, vráti stope predvolenú farbu. Pipeta vpravo otvorí systémový výber farieb pre ľubovoľnú inú farbu.',
  'help.guide.place-track.result':
    'Stopa je nakreslená vo farbe, ktorú ste vybrali: na karte, v jej riadku v stĺpci miest aj na mape.',
  'help.guide.place-track.tip.1':
    'Tieto dve časti má iba miesto s trasou: miesto importované zo súboru GPX, KML alebo KMZ ešte pred zavedením Túr, alebo v inštancii TREK s vypnutými Túrami. Keď sú Túry zapnuté, nový súbor GPX sa stane túrou s vlastnou kartou.',
  'help.guide.place-track.tip.2':
    'Stopa zaznamenaná s výškami ukazuje aj najvyšší a najnižší bod, metre stúpania a klesania a výškový profil prechádzky.',
  'help.guide.place-track.tip.3':
    'Import dá každej stope, ktorú pridá, vlastnú farbu, takže dve prechádzky nikdy nemajú rovnakú farbu.',

  // ── Screen: trip-day-detail ───────────────────────────────────────────────────────────
  'help.ctx.trip-day-detail.title': 'Podrobnosti dňa',
  'help.ctx.trip-day-detail.summary':
    'Panel, ktorý sa otvorí nad mapou, keď kliknete na hlavičku dňa. Ukazuje deň ako celok: jeho názov a dátum, počasie tam, kde budete, rezervácie na ten deň a noci, ktoré sú naň rezervované.',
  'help.ctx.trip-day-detail.bullet.1':
    'Kliknutím na záhlavie dňa v stĺpci dní sa panel otvorí nad stredom mapy. Opätovným kliknutím na to isté záhlavie alebo na X vpravo od neho panel zatvoríte a výber dňa zrušíte. Keď otvoríte miesto zo stĺpca miest alebo z mapy, panel sa zatvorí a namiesto neho sa zobrazí miesto.',
  'help.ctx.trip-day-detail.bullet.2':
    'V hlavičke je názov dňa a jeho dátum. Ceruzkou vedľa názvu deň premenujete. Dvojitá šípka zbalí panel na úzky pruh, aby ste znova videli mapu.',
  'help.ctx.trip-day-detail.bullet.3':
    'Navrchu vidíte počasie dňa. Predpoveď pre ukazuje miesto, pre ktoré predpoveď platí: prvú zastávku dňa alebo hotel, v ktorom sa zobudíte.',
  'help.ctx.trip-day-detail.bullet.4':
    'Rezervácie uvádzajú rezervácie daného dňa, každú s druhom, zastávkou, ku ktorej patrí, a časmi. Zelená znamená potvrdené, oranžová stále čaká na potvrdenie a cesta verejnou dopravou je modrá a nemá stav. Kliknutím na riadok otvoríte rezerváciu.',
  'help.ctx.trip-day-detail.bullet.5':
    'Ubytovanie ukazuje každú noc rezervovanú cez tento deň, s Check-in a Check-out v dňoch, kedy nastanú, časovým oknom check-inu, časom check-outu a číslom potvrdenia. Ak má pobyt rezerváciu, pole Rezervácia pod ním uvádza rezerváciu so stavom Čaká na potvrdenie alebo Potvrdené. Kliknutím naň rezerváciu otvoríte.',
  'help.ctx.trip-day-detail.bullet.6':
    '„Pridať ubytovanie“ pridá k tomuto dňu nocľah: vyberte ubytovanie z miest cesty, určte, ktoré dni pokrýva, a doplňte časy a kód. Aj + v hlavičke dňa s popisom „Pridať k dňu“ ponúka „Pridať ubytovanie“: otvorí tento panel s už otvoreným formulárom.',
  // day-panel
  'help.guide.day-panel.title': 'Otvorenie dňa a čítanie jeho podrobností',
  'help.guide.day-panel.goal':
    'Pozrite si celý deň aj s počasím, rezerváciami a ubytovaním bez toho, aby ste opustili mapu.',
  'help.guide.day-panel.step.1':
    'Kliknite na hlavičku dňa v stĺpci dní. Deň sa vyberie a jeho podrobnosti sa otvoria nad stredom mapy.',
  'help.guide.day-panel.step.2': 'Hlavička ukazuje názov dňa, Deň 1, kým mu nedáte názov, a pod ním jeho dátum.',
  'help.guide.day-panel.step.3':
    'Hore je počasie na daný deň. „Predpoveď pre“ ukazuje, pre ktoré miesto platí: pre prvú zastávku dňa alebo pre hotel, v ktorom ste strávili predchádzajúcu noc.',
  'help.guide.day-panel.step.4': '„Rezervácie“ pod ním uvádzajú rezervácie na tento deň aj s časmi.',
  'help.guide.day-panel.step.5':
    'Ubytovanie ukazuje noci rezervované cez tento deň, s Check-in a Check-out v dňoch, kedy nastanú.',
  'help.guide.day-panel.step.6':
    'Dvojitá šípka v hlavičke zbalí panel na úzky pruh. X vedľa nej panel zavrie a zruší výber dňa.',
  'help.guide.day-panel.result':
    'Keď panel zbalíte do lišty, mapa sa uvoľní a deň zostane vybraný. Keď ho zatvoríte, výber dňa sa zruší a plán zostane taký, aký bol.',
  'help.guide.day-panel.tip.1':
    'Panel zbalíte aj kliknutím kamkoľvek na lištu jeho hlavičky. Šípka je len jeden zo spôsobov.',
  'help.guide.day-panel.tip.2':
    'Keď otvoríte miesto zo stĺpca miest alebo z mapy, panel dňa sa zatvorí a namiesto neho sa zobrazia podrobnosti miesta. Opätovným kliknutím na záhlavie dňa sa deň zobrazí znova.',
  // day-weather
  'help.guide.day-weather.title': 'Čítanie počasia dňa',
  'help.guide.day-weather.goal': 'Pozrite si počasie tam, kde v daný deň naozaj budete.',
  'help.guide.day-weather.step.1':
    '„Predpoveď pre“ ukazuje miesto, pre ktoré údaje platia: prvú zastávku dňa, alebo v deň bez zastávky hotel, v ktorom spíte predchádzajúcu noc.',
  'help.guide.day-weather.step.2':
    'Veľké číslo je teplota dňa. Vedľa neho je minimum a maximum a slovný popis počasia.',
  'help.guide.day-weather.step.3':
    'Pilulky vpravo od neho: pravdepodobnosť dažďa, jeho množstvo, najsilnejší vietor, východ a západ slnka.',
  'help.guide.day-weather.step.4':
    'Dole je deň po hodinách, vždy každá druhá hodina: čas, ikona, teplota a pravdepodobnosť dažďa. Hodiny nad 50 percent sú podfarbené modrou.',
  'help.guide.day-weather.result':
    'Karta dňa v stĺpci dní ukazuje počasie aj malým písmom pod svojím číslom, takže počasie na celú cestu vidíte na prvý pohľad.',
  'help.guide.day-weather.tip.1':
    'Stupne a vietor používajú nastavenie Jednotky teploty v časti Všeobecné v Nastaveniach: ak vyberiete °F Fahrenheit, tá istá predpoveď sa zobrazí v °F a mph.',
  'help.guide.day-weather.tip.2':
    'Deň bez zastávky s polohou a bez hotela z predchádzajúcej noci nezobrazí žiadne počasie: predpoveď sa vždy týka miesta, nikdy celej cesty.',
  'help.guide.day-weather.tip.3':
    'Viac ako 16 dní dopredu predpoveď nie je k dispozícii. Údaje sú vtedy priemerom z predchádzajúcich rokov pre daný dátum. Sú označené symbolom Ø a upozorní na to aj poznámka pod nimi.',
  // rename-day
  'help.guide.rename-day.title': 'Pomenovanie dňa',
  'help.guide.rename-day.goal': 'Dajte dňu názov, napríklad Prílet do Kjóta alebo Deň oddychu, namiesto Deň 5.',
  'help.guide.rename-day.step.1': 'Otvorte deň. V jeho hlavičke je „Deň 5“ a pod tým dátum.',
  'help.guide.rename-day.step.2': 'Kliknite na ceruzku vedľa názvu.',
  'help.guide.rename-day.step.3': 'Názov sa zmení na pole. Napíšte požadovaný názov.',
  'help.guide.rename-day.step.4':
    'Stlačte Enter alebo kliknite inam. Klávesom Escape zmenu zrušíte. Názov sa zobrazí aj na karte dňa v stĺpci dní.',
  'help.guide.rename-day.result': 'Názov nahradí „Deň 5“ v paneli aj na karte dňa v stĺpci dní. Dátum sa nezmení.',
  'help.guide.rename-day.tip.1':
    'Ak pole vymažete a uložíte, deň sa opäť volá Deň 5: číslo sa zobrazí, keď deň nemá názov.',
  'help.guide.rename-day.tip.2':
    'Názov patrí dňu, nie jeho dátumu. Ak dni preusporiadate, názov sa presunie spolu so všetkým ostatným v tom dni.',
  // add-accommodation
  'help.guide.add-accommodation.title': 'Rezervovať nocľah k dňu',
  'help.guide.add-accommodation.goal':
    'Pridajte hotel do plánu raz, s dňami, ktoré pokrýva, jeho časmi a číslom potvrdenia.',
  'help.guide.add-accommodation.step.1':
    'Ubytovanie musí byť najprv miestom cesty. Vytvorte ho v stĺpci miest ako každé iné miesto: výber ponúka len miesta, ktoré už existujú.',
  'help.guide.add-accommodation.step.2': 'Otvorte deň príchodu a v časti „Ubytovanie“ kliknite na „Pridať ubytovanie“.',
  'help.guide.add-accommodation.step.3':
    '„Použiť na dni“ určuje, na ktoré noci sa pobyt vzťahuje: „Začiatok“ je deň príchodu, „Do“ deň odchodu a „Všetky“ zahŕňa celú cestu. V hornej časti dialógu vidíte rozsah a počet nocí.',
  'help.guide.add-accommodation.step.4':
    'Vyplňte Check-in, Do a Check-out a číslo rezervácie zadajte do Potvrdenie. Všetky štyri polia môžu zostať prázdne.',
  'help.guide.add-accommodation.step.5':
    'Vyberte objekt pod Vybrať ubytovanie. Kategória nad zoznamom ho zúži na jednu kategóriu.',
  'help.guide.add-accommodation.step.6': 'Kliknite na Uložiť.',
  'help.guide.add-accommodation.result':
    'Pobyt sa zobrazí v každom dni, ktorý pokrýva, s check-inom v prvom a check-outom v poslednom. Ubytovanie sa stane zastávkou v deň check-inu, takže mapa ukáže trasu k nemu, a na karte „Rezervácie“ pribudne rezervácia hotela.',
  'help.guide.add-accommodation.tip.1':
    'Výber sa otvorí na dni, z ktorého ste prišli, s odchodom (check-out) v nasledujúci deň. Oba dni môžete pred uložením zmeniť.',
  'help.guide.add-accommodation.tip.2':
    'Pri vytváraní dajte hotelu kategóriu Hotel. Potom Kategória nad zoznamom jedným kliknutím zobrazí iba vaše hotely.',
  'help.guide.add-accommodation.tip.3':
    'Všetky časy sú voliteľné: pobyt bez príchodu a bez kódu stále pokrýva svoje noci a jeho trasa sa stále kreslí.',
  // edit-accommodation
  'help.guide.edit-accommodation.title': 'Zmena alebo zrušenie rezervovanej noci',
  'help.guide.edit-accommodation.goal': 'Presuňte pobyt, opravte jeho časy alebo ho odstráňte z plánu.',
  'help.guide.edit-accommodation.step.1':
    'Karta ukazuje ubytovanie a jeho adresu, Check-in alebo Check-out v dňoch, kedy nastanú, s časmi, číslo potvrdenia a pod Rezervácia rezerváciu, ktorá k pobytu patrí.',
  'help.guide.edit-accommodation.step.2':
    'Ceruzkou vpravo, „Upraviť ubytovanie“, otvoríte pobyt na úpravu. Okno má teraz názov „Upraviť ubytovanie“.',
  'help.guide.edit-accommodation.step.3':
    'Opravte Check-in, Do, Check-out a Potvrdenie. Tu môžete zmeniť aj dni nad nimi a ubytovanie pod nimi.',
  'help.guide.edit-accommodation.step.4': 'Kliknite na Uložiť.',
  'help.guide.edit-accommodation.step.5':
    'X vedľa ceruzky, Odobrať, pobyt odstráni. Nepýta sa na potvrdenie a rezervácia hotela, ktorá k pobytu patrí, sa vymaže tiež.',
  'help.guide.edit-accommodation.result':
    'Zmena sa hneď prejaví v každom dni, ktorý pobyt pokrýva, aj v rezervácii hotela na karte Rezervácie.',
  'help.guide.edit-accommodation.tip.1':
    'Noc uprostred pobytu nemá štítok Check-in ani Check-out: má ho iba prvý a posledný deň rozsahu.',
  'help.guide.edit-accommodation.tip.2':
    'Zrušením pobytu zmizne aj zastávka, ktorú pridal v deň príchodu, a všetky náklady prepojené s jeho rezerváciou. Ak išlo o omyl, rezervujte noc znova.',
  // day-bookings
  'help.guide.day-bookings.title': 'Rezervácie dňa na prvý pohľad',
  'help.guide.day-bookings.goal':
    'Pozrite si na jednom mieste, čo už máte na tento deň rezervované a či je to potvrdené.',
  'help.guide.day-bookings.step.1':
    'Rezervácie vypisujú rezervácie dňa: tie s dátumom daného dňa a tie pripnuté k jednej z jeho zastávok. Rezervácia pripnutá k zastávke v inom dni sa zobrazí iba pri tej zastávke.',
  'help.guide.day-bookings.step.2':
    'V riadku vidíte druh rezervácie, jej názov a ak patrí k zastávke, aj túto zastávku sivým písmom za ním. Časy sú na pravom konci, pred bodkou stavu.',
  'help.guide.day-bookings.step.3':
    'Farba ukazuje stav rezervácie: zelená je potvrdená, oranžová stále čaká na potvrdenie a cesta verejnou dopravou je modrá, bez stavu. Hotely v tomto zozname nie sú, majú nižšie vlastnú sekciu.',
  'help.guide.day-bookings.step.4':
    'Kliknutím na riadok otvoríte rezerváciu. Pilulka v jej hlavičke ju prepína medzi Čaká na potvrdenie a Potvrdené a Upraviť dole zmení zvyšok. Nové rezervácie vytvoríte v karte Rezervácie, dopravu v karte Doprava.',
  'help.guide.day-bookings.result':
    'Všetko s dátumom tohto dňa a všetko, čo je prepojené s niektorou z jeho zastávok, je v tomto zozname.',
  'help.guide.day-bookings.tip.1':
    'Rezervácia sa zobrazí v deň svojho dátumu. Ak dátum zmeníte na karte „Rezervácie“ alebo „Doprava“, rezervácia sa na iný deň presunie automaticky.',
  'help.guide.day-bookings.tip.2':
    'Ak blok Rezervácie chýba, deň nemá žiadne rezervácie: namiesto prázdneho bloku sa skryje.',
  'help.guide.map-lock.title': 'Zamknutie mapy',
  'help.guide.map-lock.goal': 'Nechajte mapu na mieste, kým prechádzate dni a miesta.',
  'help.guide.map-lock.step.1':
    'Zámok je horné z dvoch okrúhlych tlačidiel vľavo dole na mape. Keď naň ukážete myšou, zobrazí sa Uzamknúť zobrazenie mapy. Kliknite naň. Kým je zamknuté, otvorenie dňa alebo výber miesta mapu už neposúva ani nepribližuje a tlačidlo teraz ukazuje Nechať mapu sledovať výber.',
  'help.guide.map-lock.result': 'Mapa zostane tam, kde ste ju nechali, kým prechádzate plán.',
  'help.guide.map-lock.tip.1':
    'Kliknite na zámok znova, teraz Nechať mapu sledovať výber, a mapa sa vráti k sledovaniu toho, čo vyberiete. Zámok je len na počítači. V telefóne mapa vždy sleduje výber.',

  // ── Screen: trip-map ──────────────────────────────────────────────────────────────────
  'help.ctx.trip-map.title': 'Mapa',
  'help.ctx.trip-map.summary':
    'Stred plánu: každé miesto cesty ako špendlík, každá túra ako čiara, trasy medzi nimi a tlačidlá pozdĺž okrajov mapy na zamknutie zobrazenia, prepnutie na satelit, zobrazenie celej cesty naraz a zobrazenie miest v oblasti, na ktorú sa pozeráte.',
  'help.ctx.trip-map.bullet.1':
    'Špendlík je miesto: jeho vlastná fotka, ak ju má, inak farba jeho kategórie s ikonou kategórie. Keď naň ukážete myšou, zobrazí sa karta s obrázkom, názvom a adresou, plus hodnotením a kategóriou, ak ich miesto má. Potiahnutím špendlíka na kartu dňa tam miesto naplánujete. Pobyt, ktorého rezervácia ešte čaká na potvrdenie, je zobrazený vyblednuto, s prerušovaným krúžkom.',
  'help.ctx.trip-map.bullet.2':
    'Špendlíky, ktoré sú príliš blízko seba, sa zlúčia do jedného tmavého kruhu s počtom. Kliknite na kruh a mapa sa priblíži na špendlíky v ňom. Ak je zapnuté Kompaktné značky pre nenaplánované miesta, v Nastavenia > Všeobecné pod Cestovanie a mapa, miesta, ktoré ešte nie sú v žiadnom dni, sa zobrazia ako malé bodky bez fotky, takže plánované zastávky lepšie vynikajú.',
  'help.ctx.trip-map.bullet.3':
    'Kliknutím na špendlík otvoríte miesto na karte v dolnej časti mapy s jeho hodnotením, súbormi a ďalšími akciami. Kliknutím na prázdnu časť mapy kartu zatvoríte.',
  'help.ctx.trip-map.bullet.4':
    'Keď je v stĺpci dní otvorený deň, jeho zastávky majú malý biely odznak s poradovým číslom v tom dni. Miesto, ktoré je v dni dvakrát, ukazuje obe čísla. Filtre nad zoznamom miest („Zobraziť“, kategórie a hviezdička pre minimálne hodnotenie) filtrujú aj body na mape.',
  'help.ctx.trip-map.bullet.5':
    'Rad ikon navrchu prehľadáva časť mapy, ktorú vidíte: Reštaurácie, Kaviarne, Bary a nočný život, Ubytovanie, Pamiatky, Múzeá a kultúra, Príroda a parky a Aktivity. Kategórie pridané doplnkom nasledujú za tenkou oddeľovacou čiarou. Ak je rad širší ako mapa, kolieskom myši ho posúvate do strán. Hľadať v tejto oblasti spustí hľadanie znova po posunutí mapy.',
  'help.ctx.trip-map.bullet.6':
    'Kliknite kdekoľvek na mape pravým tlačidlom a v tom bode sa otvorí formulár miesta s už vyhľadanou adresou. Vľavo dole sú dve okrúhle tlačidlá: zámok, Uzamknúť zobrazenie mapy, nechá zobrazenie mapy na mieste, kým prechádzate dni a miesta, a tlačidlo pod ním, Prepnúť na satelitné zobrazenie, nahradí nakreslenú mapu satelitnými snímkami.',
  'help.ctx.trip-map.bullet.7':
    'Zobraziť celú cestu vpravo dole nakreslí všetky cestovné dni naraz a uvedie, čo každý deň zahŕňa. Ikona trasy v riadku rezervácie nakreslí túto rezerváciu a ikona trasy na paneli nástrojov nad dňami nakreslí všetky rezervácie. Kliknutím na koniec nakreslenej rezervácie otvoríte jej podrobnosti.',
  'help.ctx.trip-map.bullet.8':
    'Keď je zapnutý doplnok Dawarich, okrúhle tlačidlo Dawarich pod „Zobraziť celú cestu“ ukáže trasu, ktorú naozaj zaznamenal váš telefón. „Zobraziť zaznamenanú trasu“ ju nakreslí prerušovanou čiarou pod plánovanou trasou, pre každý deň inou farbou. Ak sa čiara nezobrazí, popis tlačidla vám povie prečo.',
  // map-markers
  'help.guide.map-markers.title': 'Ako čítať mapu',
  'help.guide.map-markers.goal': 'Zistite, čo znamená každý špendlík, odznak a bublina na mape.',
  'help.guide.map-markers.step.1':
    'Mapa ukazuje všetky miesta cesty. Špendlíky, ktoré sú príliš blízko seba na to, aby sa dali rozlíšiť, sa zlúčia do jedného tmavého krúžku s počtom špendlíkov v ňom. Po kliknutí na krúžok mapa priblíži tieto špendlíky, alebo ich pri najväčšom priblížení rozloží od seba.',
  'help.guide.map-markers.step.2':
    'Špendlík ukazuje vlastnú fotku miesta, ak ju má, inak farbu kategórie s jej ikonou. Pobyt, ktorého rezervácia ešte čaká, je vyblednutý a má prerušovaný krúžok. Keď na špendlík nabehnete myšou, vedľa sa otvorí karta: tá istá fotka vo väčšom, názov a adresa a tiež hodnotenie a kategória, ak ich miesto má.',
  'help.guide.map-markers.step.3':
    'Kliknite na špendlík a miesto sa otvorí v karte nad spodným okrajom mapy: navrchu obrázok, názov a adresa, potom hviezdičky, popis a súbory, vrátane súborov jeho rezervácie. Dole sú akcie: Pridať k dňu, kým je otvorený nejaký deň (Odobrať z dňa, ak už miesto v ňom je), Navigácia, Otvoriť webovú stránku, Uložiť do zbierky (Uložené, keď už v nejakej je) a vpravo kôš a Upraviť. Kartu zatvorí X navrchu alebo kliknutie na prázdne miesto mapy.',
  'help.guide.map-markers.step.4':
    'Keď otvoríte deň v stĺpci dní, jeho zastávky dostanú čísla: malý biely odznak v rohu špendlíka ukazuje poradie zastávky v dni. Miesto, ktoré je v dni dvakrát, má obe čísla. Keď nie je otvorený žiadny deň, čísla sa nezobrazujú a v rohu je namiesto nich hodnotenie miesta, ak nejaké má.',
  'help.guide.map-markers.step.5':
    'Potiahnite špendlík z mapy na kartu dňa v stĺpci dní a miesto sa naplánuje na ten deň, rovnako ako keď potiahnete jeho riadok zo zoznamu miest.',
  'help.guide.map-markers.result':
    'Na ceste sa nič nezmenilo: mapa cestu len zobrazuje. Každý špendlík ukazuje, o ktoré miesto ide, v ktorom je dni a v akom poradí.',
  'help.guide.map-markers.tip.1':
    'Keď deň v stĺpci dní zbalíte, jeho zastávky sa na mape skryjú. Po opätovnom rozbalení dňa sa znova zobrazia.',
  'help.guide.map-markers.tip.2':
    'Filtre nad zoznamom miest určujú aj to, čo ukazuje mapa: Zobraziť (Nezaradené, Plánované), kategórie pod tlačidlom štítka a minimálne hodnotenie pod hviezdou, všetky znižujú počet špendlíkov. Filter krajiny zužuje iba zoznam.',
  'help.guide.map-markers.tip.3':
    'Táto mapa nemá tlačidlá na priblíženie: približujete kolieskom myši, dvojitým kliknutím priblížite o jeden stupeň a mapu posúvate ťahaním.',
  // map-nearby-places
  'help.guide.map-nearby-places.title': 'Hľadanie miest v okolí na mape',
  'help.guide.map-nearby-places.goal':
    'Vyhľadajte reštaurácie, pamiatky alebo hotel v časti mesta zobrazenej na mape a jedno z nich pridajte do cesty.',
  'help.guide.map-nearby-places.step.1':
    'Rad ikon navrchu mapy slúži na hľadanie podľa kategórií: Reštaurácie, Kaviarne, Bary a nočný život, Ubytovanie, Pamiatky, Múzeá a kultúra, Príroda a parky a Aktivity. Kategórie z pluginov nasledujú za tenkým oddeľovačom; názov ikony uvidíte, keď na ňu prejdete myšou.',
  'help.guide.map-nearby-places.step.2':
    'Kliknite na kategóriu. TREK vyhľadá tento druh miest vo viditeľnej časti mapy a ku každému výsledku pridá špendlík vo farbe kategórie. Naraz môže byť zapnutá iba jedna kategória: kliknutím na inú ju nahradíte a kliknutím na aktívnu ju vypnete.',
  'help.guide.map-nearby-places.step.3':
    'Keď posuniete mapu, pod riadkom sa zobrazí druhé tlačidlo: Hľadať v tejto oblasti spustí rovnaké hľadanie pre nový výrez. Samotný posun mapy nové hľadanie nespustí. Tak zostáva počet požiadaviek nízky.',
  'help.guide.map-nearby-places.step.4':
    'Keď ukážete myšou na špendlík, zobrazí sa názov nájdeného miesta. Kliknutím naň sa otvorí formulár miesta s už vyplnenými údajmi: názov navrchu dialógu, Adresa, Zemepisná šírka a Zemepisná dĺžka a webová stránka a telefónne číslo, ak ich hľadanie našlo.',
  'help.guide.map-nearby-places.step.5':
    'Skontrolujte, čo sa vyplnilo, a doplňte, čo vyhľadávanie vedieť nemohlo. Pilulka kategórie pod názvom je už nastavená, ak má cesta zodpovedajúcu kategóriu, napríklad reštaurácia pre reštauráciu. Inak ukazuje Bez kategórie, kým nejakú nevyberiete. Pridajte vlastný Popis a poznámky.',
  'help.guide.map-nearby-places.step.6':
    'Kliknite na Pridať. Ak je v ceste už miesto s rovnakým názvom alebo na tom istom mieste, TREK vás upozorní a tlačidlo sa zmení na Aj tak pridať.',
  'help.guide.map-nearby-places.result':
    'Miesto je v zozname miest a na mape ako jeden z vlastných špendlíkov cesty, v skupine „Nezaradené“, kým ho nepridáte do niektorého dňa. Špendlíky z vyhľadávania zostanú, kým kategóriu nevypnete.',
  'help.guide.map-nearby-places.tip.1':
    'Riadok sa skryje, ak je Objavovať miesta na mape vypnuté v Nastavenia > Všeobecné, pod Cestovanie a mapa.',
  'help.guide.map-nearby-places.tip.2':
    'Výsledky pochádzajú z indexu TREK Places a z OpenStreetMap, takže je to jedna z mála vecí v pláne, na ktorú potrebujete pripojenie.',
  'help.guide.map-nearby-places.tip.3':
    'Hľadanie pokrýva len oblasť na obrazovke, preto sa priblížte na ulicu, ktorá vás zaujíma. Hľadanie v celom meste vráti len prvých šesťdesiat výsledkov, v nejasnom poradí.',
  // map-add-place
  'help.guide.map-add-place.title': 'Vytvorenie miesta kliknutím pravým tlačidlom na mapu',
  'help.guide.map-add-place.goal': 'Umiestnite miesto presne tam, kam chcete, bez toho, aby ste ho najprv hľadali.',
  'help.guide.map-add-place.step.1':
    'Kliknite pravým tlačidlom na miesto na mape. Otvorí sa formulár miesta s nadpisom Pridať miesto/aktivitu.',
  'help.guide.map-add-place.step.2':
    'Zemepisná šírka a Zemepisná dĺžka sú už nastavené na tento bod. TREK súradnice vyhľadá a do Adresa doplní, čo tam nájde. Ak vyhľadávanie nájde aj názov, TREK doplní aj názov v hornej časti dialógu. Nič sa ešte neuložilo, takže opravte všetko, čo je nesprávne.',
  'help.guide.map-add-place.step.3':
    'Do poľa v hornej časti dialógu napíšte názov, podľa ktorého miesto spoznáte. Pod ním vyberte kategóriu zo štítka, na ktorom je „Bez kategórie“, kým nejakú nevyberiete. Potom doplňte ďalšie údaje pre plán: „Popis“, „Poznámky“, „Webová stránka“.',
  'help.guide.map-add-place.step.4':
    'Kliknite na „Pridať“. Miesto sa pridá do zoznamu ako nezaradené, aj keď je otvorený deň: kliknutie pravým tlačidlom na mapu určuje polohu, nie deň.',
  'help.guide.map-add-place.result': 'Miesto je v zozname aj na mape, pod Nezaradené, kým ho nezaradíte do dňa.',
  'help.guide.map-add-place.tip.1':
    'Adresa sa vyhľadá podľa súradníc, takže môže ukázať ulicu namiesto názvu a vo voľnej krajine môže byť prázdna. Obe polia môžete prepísať.',
  'help.guide.map-add-place.tip.2':
    'Na mapách MapLibre GL a Mapbox GL urobí to isté kliknutie stredným tlačidlom a na dotykovej obrazovke dlhé podržanie.',
  // map-satellite
  'help.guide.map-satellite.title': 'Prepnutie na satelit',
  'help.guide.map-satellite.goal': 'Prepnite z kreslenej mapy na letecké snímky a späť.',
  'help.guide.map-satellite.step.1':
    'Prepínač základnej vrstvy je dolné z dvoch okrúhlych tlačidiel vľavo dole na mape, pod zámkom. Jeho ikona vždy ukazuje vrstvu, na ktorú prepne, a tooltip hovorí, ktorá to je: „Prepnúť na satelitné zobrazenie“. Kliknite naň.',
  'help.guide.map-satellite.step.2':
    'Mapa teraz zobrazuje letecké snímky. Sú dosť podrobné na to, aby ste rozoznali jednotlivé budovy, a nepotrebujete na ne vlastný kľúč. Všetko, čo kreslí TREK, zostáva navrchu: špendlíky, trasa dňa, stopy aj trasy rezervácií.',
  'help.guide.map-satellite.step.3':
    'Na tlačidle je teraz „Prepnúť na mapové zobrazenie“. Kliknutím naň sa vrátite k mapovému zobrazeniu.',
  'help.guide.map-satellite.result': 'Mapa sa prekreslí a vybraná vrstva sa zapamätá vo vašom účte.',
  'help.guide.map-satellite.tip.1':
    'Voľba sa ukladá k vášmu účtu, nie k ceste, takže každá cesta sa otvorí tak, ako ste ju nechali, nech používate akýkoľvek vykresľovač mapy.',
  'help.guide.map-satellite.tip.2':
    'Satelitné snímky nemajú popisy: názvy ulíc, štvrtí a čísla domov sú iba na kreslenej mape. Keď hľadáte adresu, prepnite sa späť.',
  // map-whole-trip
  'help.guide.map-whole-trip.title': 'Celá cesta a jej vzdialenosti',
  'help.guide.map-whole-trip.goal':
    'Zobrazte všetky cestovné dni cesty namiesto jedného otvoreného dňa a zistite, ako ďaleko cestujete v každom z nich.',
  'help.guide.map-whole-trip.step.1':
    'Okrúhle tlačidlo Zobraziť celú cestu je vpravo dole na mape. Po kliknutí sa naraz nakreslí každý cestovný deň cesty vlastnou farbou, takže susedné dni od seba rozlíšite.',
  'help.guide.map-whole-trip.step.2':
    'Karta nad tlačidlom uvádza tieto dni: farebnú bodku, názov dňa, ikonu pre každý spôsob dopravy v daný deň a prejdenú vzdialenosť. Hore je „Celková vzdialenosť“.',
  'help.guide.map-whole-trip.step.3':
    'Kliknutím na deň na karte ho vyberiete: jeho riadok sa podfarbí a deň sa otvorí v stĺpci dní. Kolieskom myši nad mestom ho priblížite. Dni, ktoré mestom prechádzajú, sa zobrazia vedľa seba, každý vo svojej farbe.',
  'help.guide.map-whole-trip.step.4':
    'Tlačidlo teraz hovorí Skryť celú cestu. Kliknutím naň sa opäť zobrazí len otvorený deň.',
  'help.guide.map-whole-trip.result':
    'Každý cestovný deň má vlastnú farbu a karta ukazuje, akú vzdialenosť pokrýva každý deň a koľko je to za celú cestu.',
  'help.guide.map-whole-trip.tip.1':
    'Súčet sa počíta postupne, vždy po niekoľkých úsekoch. Kým je za ním …, ide len o čiastkový súčet. Konečný je, keď sú vypočítané všetky úseky.',
  'help.guide.map-whole-trip.tip.2':
    'Ak smerovač úsek nedokáže vypočítať, úsek zostane priamou čiarou a nezapočíta sa. Karta to oznámi, aby celkový súčet nevyzeral nižší bez upozornenia.',
  'help.guide.map-whole-trip.tip.3':
    'Deň s menej než dvoma zastávkami s polohou a bez jazdy do hotela alebo z hotela nemá čo nakresliť, preto sa na karte vôbec nezobrazí.',
  // map-booking-routes
  'help.guide.map-booking-routes.title': 'Zobraziť trasu rezervácie na mape',
  'help.guide.map-booking-routes.goal': 'Zobrazte na mape rezervované lety, vlaky a jazdy a potom ich zase odstráňte.',
  'help.guide.map-booking-routes.step.1':
    'Trasy rezervácií sú vypnuté, kým nejakú nezapnete. Na pravom konci riadka dopravy v stĺpci dní je malá ikona trasy: Zobraziť trasy rezervácií.',
  'help.guide.map-booking-routes.step.2':
    'Kliknite naň a rezervácia sa zobrazí na mape: let ako oblúk po hlavnej kružnici, jazda autom po skutočných cestách, vlak ako reťaz jeho staníc. „Potvrdené“ sa kreslí plnou čiarou, „Čaká na potvrdenie“ prerušovanou a konce trasy označujú modré štítky s ikonou dopravného prostriedku.',
  'help.guide.map-booking-routes.step.3':
    'Kliknite na koncovú pilulku a otvoria sa podrobnosti rezervácie: stav, typ a dni ako pilulky vo farebnej hlavičke, časy na oboch koncoch, ďalšie podrobnosti pod nimi a úplne dole Na mape, ktoré túto trasu zasa vypne, Zmeniť trasu pri spojení verejnou dopravou, kôš, ktorý rezerváciu vymaže, a Upraviť. X v hlavičke podrobnosti zavrie.',
  'help.guide.map-booking-routes.step.4':
    'Ikona trasy na paneli nástrojov nad dňami funguje pre celú cestu naraz: „Zobraziť všetky trasy rezervácií“ nakreslí každú rezerváciu, ktorá má trasu.',
  'help.guide.map-booking-routes.step.5':
    'Tým sa nahradia vaše predchádzajúce voľby, takže trasy, ktoré ste zapli po jednej rezervácii, sa vynulujú. Ak tlačidlo stlačíte znova, teraz s popisom Skryť všetky trasy rezervácií, všetky trasy rezervácií sa skryjú.',
  'help.guide.map-booking-routes.result':
    'Rezervácie, ktoré ste vybrali, sú nakreslené na mape a voľba sa pre túto cestu v tomto prehliadači zachová, kým ju nezmeníte.',
  'help.guide.map-booking-routes.tip.1':
    'Konce ukazujú kód letiska alebo názov stanice len vtedy, keď je v Nastavenia > Všeobecné, pod Cestovanie a mapa, zapnuté Popisky trás rezervácií. Inak ukazujú len ikonu.',
  'help.guide.map-booking-routes.tip.2':
    '„Vždy zobrazovať trasy rezervácií“ v tej istej časti ich zobrazí hneď od začiatku na každej ceste, kde ste si to ešte nenastavili sami.',
  'help.guide.map-booking-routes.tip.3':
    'Aby sa rezervácia dala nakresliť, potrebuje začiatok a koniec so súradnicami. Hotel ani reštaurácia preto ikonu trasy nemajú.',
  // map-dawarich-trail
  'help.guide.map-dawarich-trail.title': 'Zobrazenie trasy, ktorú ste naozaj prešli',
  'help.guide.map-dawarich-trail.goal':
    'Zobrazte na mape trasu, ktorú Dawarich zaznamenal v telefóne, ako prerušovanú čiaru vedľa plánovanej trasy, a pozrite si deň po dni, ako cesta naozaj prebehla.',
  'help.guide.map-dawarich-trail.step.1':
    'Okrúhle tlačidlo Dawarich je vpravo dole na mape, pod „Zobraziť celú cestu“. Keď nad neho prejdete myšou, zobrazí sa „Zobraziť zaznamenanú trasu“. Kliknite naň. TREK si od vášho Dawarich vyžiada údaje za dátumy cesty a kým čaká na odpoveď, okolo tlačidla sa točí krúžok.',
  'help.guide.map-dawarich-trail.step.2':
    'Zaznamenaná trasa sa zobrazí ako prerušovaná čiara, pre každý deň inou farbou, a je nakreslená pod plánovanou trasou, aby plán zostal čitateľný. Na tlačidle je teraz „Skryť zaznamenanú trasu“. Každý deň končí o polnoci miestneho času. Keď deň v stĺpci dní zbalíte, jeho prerušovaná čiara aj zastávky sa na mape skryjú.',
  'help.guide.map-dawarich-trail.step.3':
    'Kliknite aj na Zobraziť celú cestu a každý plánovaný deň sa nakreslí plnou čiarou vedľa prerušovaného záznamu. Kde sa čiary zhodujú, deň prebehol podľa plánu. Kde prerušovaná čiara opustí plánovanú trasu, tam to tak nebolo.',
  'help.guide.map-dawarich-trail.result':
    'To, čo ste naplánovali, aj to, čo ste naozaj urobili, vidíte na mape spolu, ako prerušované a plné čiary. Karta nad tlačidlami stále uvádza plánované dni a ich vzdialenosti.',
  'help.guide.map-dawarich-trail.tip.1':
    'Zapnutie alebo vypnutie sa ukladá pre každú cestu vo vašom účte, takže platí v každom prehliadači a na každom zariadení. Kým je trasa zapnutá, TREK sa Dawarichu pýta každé dve minúty, takže prebiehajúca cesta sa aktualizuje bez opätovného načítania stránky. Samotná trasa sa nikdy neukladá, preto nie je v databáze TREK, v zálohách ani offline.',
  'help.guide.map-dawarich-trail.tip.2':
    'Popis tlačidla vám povie, prečo je mapa prázdna: Načítava sa zaznamenaná trasa… počas načítania, V týchto dňoch sa nič nezaznamenalo, Zaznamenanú trasu sa nepodarilo načítať, alebo Zaznamenaná trasa vyžaduje pripojenie, keď je TREK offline.',
  // map-compass
  'help.guide.map-compass.title': 'Otočenie mapy a opätovné nájdenie severu',
  'help.guide.map-compass.goal': 'Otočte mapu v smere, ktorým idete, a jedným kliknutím ju vráťte na sever.',
  'help.guide.map-compass.step.1':
    'Mapu otočíte ťahaním pravým tlačidlom myši alebo ťahaním ľavým tlačidlom so stlačeným Ctrl. Na dotykovej obrazovke ju otočíte dvoma prstami. Okrúhly kompas vedľa radu ikon kategórií v hornej časti mapy sa otáča spolu s ňou: jeho šípka vždy ukazuje na sever, takže sa natočí o rovnaký uhol ako mapa.',
  'help.guide.map-compass.step.2':
    'Kliknite na kompas. Tlačidlo s názvom Obnoviť sever otočí mapu späť tak, aby sever smeroval nahor, zarovná pohľad a šípka opäť ukazuje nahor.',
  'help.guide.map-compass.result':
    'Mapa je opäť otočená na sever a vodorovná. Na ceste sa nič nezmenilo: kompas mení len pohľad.',
  'help.guide.map-compass.tip.1':
    'Kompas majú iba mapy MapLibre GL a Mapbox GL. Mapu Leaflet nemožno otáčať, preto kompas nemá. Ktorú mapu používate, určuje „Poskytovateľ mapy“ v Nastaveniach v časti Mapa a voľbu uložíte tlačidlom „Uložiť nastavenia mapy“.',
  'help.guide.map-compass.tip.2':
    'Kliknutie odstráni aj náklon. Ťahaním pravým tlačidlom nahor alebo nadol pohľad nakloníte a Obnoviť sever ho vyrovná a vynuluje otočenie. V Mapbox GL so zapnutými 3D budovami a terénom sa tým vyrovná aj 3D pohľad, kým ho znova nenakloníte.',
  // ── Screen: trip-transports ───────────────────────────────────────────────────────────
  'help.ctx.trip-transports.title': 'Doprava',
  'help.ctx.trip-transports.summary':
    'Všetky spôsoby, ktorými sa presúvate medzi zastávkami: lety, vlaky, autobusy, autá, taxíky, bicykle, plavby, trajekty, lanovky a spojenia verejnej dopravy, ktoré TREK vyhľadá za vás. Karta ich vypisuje. Môžete ich vytvárať a prezerať aj v pláne a kreslia sa na mape.',
  'help.ctx.trip-transports.bullet.1':
    'Na tejto karte sú iba presuny. Ubytovanie, reštaurácie, podujatia a vstupenky sú na karte „Rezervácie“, aby sa nič nezobrazovalo dvakrát.',
  'help.ctx.trip-transports.bullet.2':
    'Lišta navrchu obsahuje Hľadať, Filter pre stav, typy a cestujúcich, tri zobrazenia Karty, Zoznam a Časová os, Možnosti zobrazenia a Exportovať ako tabuľku (CSV), ktoré stiahne to, čo je zobrazené. Doprava vpravo pridá jazdu ručne. Ikony pred ním, Importovať potvrdenia rezervácií a Import z AirTrail, sa zobrazia, keď server vie čítať potvrdenia alebo je pripojený AirTrail. Na prázdnej karte sa rovnaké akcie zobrazia uprostred ako Doprava, Importovať zo súboru a AirTrail.',
  'help.ctx.trip-transports.bullet.3':
    'Záložka sa otvorí v zobrazení „Karty“: najprv „Potvrdené“, potom „Čaká na potvrdenie“. Každú sekciu zbalíte kliknutím na jej nadpis. Naplánované spojenia verejnou dopravou nemajú stav a zobrazujú sa medzi potvrdenými jazdami v časovom poradí, pokiaľ im v „Možnostiach zobrazenia“ nedáte vlastnú sekciu „Automatické spojenie MHD“. „Zoznam“ zoskupuje jazdy podľa dní a „Časová os“ ukazuje všetky jazdy naprieč dňami cesty.',
  'help.ctx.trip-transports.bullet.4':
    'Horný pás karty má farbu podľa stavu: zelenú pri potvrdenej, oranžovú pri nepotvrdenej a modrú pri naplánovanom spojení. Je v ňom bodka stavu, typ, názov, ceruzka a kôš. Pod ním: „Dátum“, „Čas“, „Rezervačný kód“, „Trasa“ a letecká spoločnosť s číslom letu, prípadne číslo vlaku, nástupište a miesto. Kliknutím na kartu otvoríte jej podrobnosti.',
  'help.ctx.trip-transports.bullet.5':
    'Dopravu môžete vytvoriť aj v pláne: tlačidlo + v záhlaví dňa (jeho tooltip znie Pridať k dňu), alebo pravý klik na záhlavie, ponúka Pridať dopravu a Verejná doprava. Spojnica s časom cesty medzi dvoma zastávkami otvorí rovnaké vyhľadávanie pre ten jeden úsek.',
  'help.ctx.trip-transports.bullet.6':
    'Doprava s nastavenými oboma koncami nakreslí na mape čiaru. Ikona trasy v jej riadku v pláne dňa a Na mape v jej podrobnostiach túto čiaru zapnú. Zobraziť všetky trasy rezervácií na paneli nástrojov nad dňami zapína alebo vypína čiary celej cesty.',
  // transports-list
  'help.guide.transports-list.title': 'Čítanie karty Doprava',
  'help.guide.transports-list.goal': 'Zistite, čo zoznam zobrazuje, skôr než v ňom niečo zmeníte.',
  'help.guide.transports-list.step.1':
    'Doprava je karta cesty za kartou Plán (a Túry, ak je zapnutý tento doplnok). Obsahuje len jazdy: hotely, reštaurácie, udalosti a vstupenky nájdete v karte Rezervácie.',
  'help.guide.transports-list.step.2':
    '„Hľadať“ vľavo na lište filtruje jazdy už počas písania. Filter, lievik vedľa, otvorí možnosti: „Stav“ s voľbami „Všetky“, „Potvrdené“ a „Čaká na potvrdenie“ a potom každý použitý typ s počtom. Zaškrtnite jeden alebo viac typov a zobrazia sa iba tie. Číslo na lieviku ukazuje počet aktívnych filtrov a lišta uvádza, koľko jázd sa zobrazuje, napríklad 1 zo 4. „Zrušiť filtre“ dole v ponuke znova zobrazí všetky jazdy.',
  'help.guide.transports-list.step.3':
    'Karty, Zoznam a Časová os vedľa nich zobrazia dopravu ako karty, ako riadky zoskupené podľa dní alebo ako pruhy naprieč dňami cesty. Možnosti zobrazenia, ikona posuvníkov, nastavujú Zoskupiť podľa a Zoradiť podľa pre Karty a Zoznam a pruhy pre Časovú os. Obnoviť zobrazenie vráti predvolené nastavenia. V zobrazení Karty ukáže MHD ako samostatná sekcia naplánované spojenia pod Automatické spojenie MHD.',
  'help.guide.transports-list.step.4':
    'Každá karta ukazuje všetky podrobnosti. Pás hore je zelený pre Potvrdené a jantárový pre Čaká na potvrdenie a ukazuje bod stavu, typ a názov. Pod ním Dátum ukazuje dni, ktoré zahŕňa, s ich dátumami. Potom nasledujú Čas, Rezervačný kód, Trasa s ikonou typu medzi zastávkami a letecká spoločnosť s číslom letu, alebo číslo vlaku, nástupište a miesto. Kliknutím na kartu otvoríte jej podrobnosti.',
  'help.guide.transports-list.step.5':
    'Kliknutím na bodku stavu prepnete jazdu medzi Čaká na potvrdenie a Potvrdené, tooltip hovorí, ktorým smerom, napríklad „Set to Pending“. Ceruzka v hlavičke otvorí formulár dopravy a kôš ju vymaže po otázke „Odstrániť rezerváciu?“, ktorá vypíše, čo sa vymaže, vrátane prepojených nákladov.',
  'help.guide.transports-list.result':
    'Na každej karte vidíte, či je jazda rezervovaná, a lištou môžete zoznam kedykoľvek filtrovať alebo zoradiť.',
  'help.guide.transports-list.tip.1':
    'Záložka si pamätá vaše nastavenia: zobrazenie, zoskupenie a zoradenie v tomto prehliadači, zbalené sekcie pre každú cestu a filtre, kým nezavriete kartu prehliadača.',
  'help.guide.transports-list.tip.2':
    'Importovať potvrdenia rezervácií a Import z AirTrail, dve ikony pred Doprava, sa zobrazia len vtedy, keď server vie čítať potvrdenia a keď je pripojená inštancia AirTrail. Bez nich zoznam naplníte ručne alebo vyhľadávaním spojení.',
  // add-transport
  'help.guide.add-transport.title': 'Pridanie dopravy k dňu',
  'help.guide.add-transport.goal':
    'Pridajte dopravu, ktorá vás dovezie z jednej zastávky na ďalšiu, k dňu, keď sa uskutoční.',
  'help.guide.add-transport.step.1':
    'V záhlaví dňa jazdy kliknite na +, ktorého tooltip znie Pridať k dňu, a vyberte Pridať dopravu. Rovnakú ponuku ponúka aj pravé tlačidlo myši na záhlaví dňa. Formulár sa otvorí s už vyplneným dňom.',
  'help.guide.add-transport.step.2':
    'Štítok typu v záhlaví ukazuje typ dopravy, predvolene Let. Kliknutím naň vyberiete Let, Vlak, Autobus, Auto, Taxi, Bicykel, Plavba, Trajekt, Lanovka alebo Ostatné a formulár sa prispôsobí: let dostane letisko pri každej zastávke, vlak reťazec staníc, plavba Nalodenie, Prístav a Vylodenie, auto Vyzdvihnutie a Vrátenie a Zastávky po ceste.',
  'help.guide.add-transport.step.3':
    'Názov napíšte priamo do hornej časti, kde je sivý príklad. Je to jediné povinné pole: kým ho nevyplníte, riadok pod ním ukazuje Názov * a Pridať zostáva sivé. Použite názov, ktorý by ste spoznali na odchodovej tabuli.',
  'help.guide.add-transport.step.4':
    'V časti Trasa prijímajú polia Od a Do stanicu, prístav alebo adresu. Vlastné miesta cesty sa ponúknu ešte pred písaním. Na hľadanie napíšte aspoň tri písmená a vyberte výsledok. Názov, ktorý len napíšete a nevyberiete z výsledkov, sa neuloží a na mape sa nezobrazí nič.',
  'help.guide.add-transport.step.5':
    '„Dátum“ a „Čas začiatku“ určujú, kedy jazda začína, „Dátum konca“ a „Čas konca“, kedy končí. Ak jazda príde až na druhý deň, nastavte tam nasledujúci deň. „Rezervačný kód“ a „Poznámky“ nižšie sú nepovinné. Kliknutím na štítok „Čaká na potvrdenie“ v hlavičke ho zmeníte na „Potvrdené“.',
  'help.guide.add-transport.step.6': 'Kliknite na „Pridať“.',
  'help.guide.add-transport.result':
    'Doprava je riadok v dni, v jej čase medzi zastávkami, a karta v záložke Doprava pod Čaká na potvrdenie alebo Potvrdené.',
  'help.guide.add-transport.tip.1':
    'Riadok sa zaradí podľa času začiatku, za poslednú zastávku, ktorá začína skôr. Za úchyt ho môžete potiahnuť na inú pozíciu v dni alebo do iného dňa.',
  'help.guide.add-transport.tip.2':
    'Lístok pridáte cez „Priložiť súbor“ v časti Súbory. „Vytvoriť výdavok“ v časti Náklady uloží rezerváciu a otvorí editor nákladov pre cestovné.',
  'help.guide.add-transport.tip.3':
    'Cestujúci, prvý blok formulára, určuje, kto touto dopravou cestuje. Keď má cesta viac ako jedného člena a nejaká doprava niekoho uvádza, ponúkne Filtrovať na záložke aj Cestujúci, ktorý zobrazí iba dopravu jednej osoby.',
  // import-transport-file
  'help.guide.import-transport-file.title': 'Import letu z elektronickej letenky',
  'help.guide.import-transport-file.goal':
    'Nechajte TREK načítať let, vlak alebo trajekt z lístka od dopravcu a pred uložením ho skontrolujte.',
  'help.guide.import-transport-file.step.1':
    'V lište karty Doprava kliknite na ikonu sťahovania pred Doprava, ktorej tooltip znie Importovať potvrdenia rezervácií. Otvorí sa dialóg s rovnakým názvom, taký istý ako v karte Rezervácie. Na prázdnej karte robí to isté Importovať zo súboru uprostred.',
  'help.guide.import-transport-file.step.2':
    'Pretiahnite lístok do poľa, alebo naň kliknite a vyberte súbor: EML, PDF, PKPass, HTML a TXT, najviac päť súborov po 10 MB, a fotky lístka (JPG, PNG, WEBP), ak má váš server AI model, ktorý ich vie prečítať. V poli sa zobrazia názvy vybraných súborov.',
  'help.guide.import-transport-file.step.3':
    'Kliknite na „Importovať“. Dialóg sa hneď zavrie a súbor sa načíta na pozadí.',
  'help.guide.import-transport-file.step.4':
    'Karta vpravo dole ukazuje priebeh pod názvom súboru. Spracúvajú sa súbory… sa po dokončení čítania zmení na fajku a karta ponúkne Importovať. Kliknite naň.',
  'help.guide.import-transport-file.step.5':
    'Let sa otvorí v Pridať dopravu, už vyplnený: pilulka typu na Let, letecká spoločnosť a číslo letu ako názov v záhlaví, obe letiská pod Trasa s Odlet a Prílet, ich časmi a časovými pásmami, Letecká spoločnosť a Číslo letu, Rezervačný kód a lístok pod Súborov. Skontrolujte ho a kliknite na Pridať.',
  'help.guide.import-transport-file.result':
    'Let sa zobrazí ako karta v časti „Čaká na potvrdenie“ na záložke Doprava a ako riadok v deň odletu, s lístkom v časti Súbory. Ak sú známe obe letiská, let sa na mape zobrazí ako oblúk.',
  'help.guide.import-transport-file.tip.1':
    'Obe záložky používajú ten istý import. Súbor, ktorý obsahuje let aj hotel, otvorí let v Pridať dopravu a potom hotel v Nová rezervácia, bez ohľadu na to, z ktorej záložky ste začali.',
  'help.guide.import-transport-file.tip.2':
    'Letiská sa umiestňujú podľa kódu. Ak sa stanicu alebo prístav nepodarilo nájsť, jeho názov sa zobrazí jantárovou farbou na karte importu vpravo dole. Pred kliknutím na Pridať ho vyberte ručne v časti Trasa, inak sa doprava na mape nezobrazí.',
  // plan-transit
  'help.guide.plan-transit.title': 'Naplánovanie spojenia verejnou dopravou',
  'help.guide.plan-transit.goal':
    'Nechajte TREK vyhľadať skutočné vlaky a autobusy medzi dvoma bodmi dňa a vybrané spojenie vložte do plánu.',
  'help.guide.plan-transit.step.1':
    'V záhlaví dňa kliknite na + a vyberte Verejná doprava. Vyhľadávanie sa otvorí pre tento deň: deň je v záhlaví zobrazený ako pilulka a Ručne a Automaticky vedľa nej prepínajú medzi týmto vyhľadávaním a bežným formulárom.',
  'help.guide.plan-transit.step.2':
    'Polia Od a Do berú zastávku alebo stanicu. Kým je pole ešte prázdne, TREK ponúkne ubytovanie dňa, stanice a letiská z rezervácií dňa a vlastné zastávky dňa. Keď napíšete dve písmená, hľadá namiesto toho v staniciach cestovného poriadku. Prehodiť medzi oboma poľami vymení Od a Do.',
  'help.guide.plan-transit.step.3':
    'Odchod alebo Príchod s časom určuje, kedy chcete cestovať, a Najlepšie spojenie, Menej prestupov alebo Menej chôdze určuje, v akom poradí sa majú zobraziť výsledky.',
  'help.guide.plan-transit.step.4':
    'Štítky pod tým ukazujú, ktoré druhy dopravy sa môžu použiť: Vlak, Metro, Električka, Autobus, Trajekt a Lanovka. Vypnutím štítka daný druh vylúčite, aspoň jeden však zostane zapnutý. Potom kliknite na „Hľadať“.',
  'help.guide.plan-transit.step.5':
    'Každý výsledok uvádza odchod a príchod, trvanie, počet prestupov a dĺžku chôdze, a linky ako štítky, v ich vlastných farbách, ak ich cestovný poriadok poskytuje. Kliknutím ho rozbalíte a uvidíte každý úsek, so zastávkami, kde nastupujete a prestupujete, nástupišťami a presunmi pešo medzi linkami.',
  'help.guide.plan-transit.step.6': 'Kliknite na Pridať k dňu.',
  'help.guide.plan-transit.result':
    'Spojenie je v dni ako riadok so štítkami liniek. Kliknutím na jeho šípku zobrazíte jednotlivé úseky. Zároveň je ako modrá karta na záložke „Doprava“ medzi potvrdenými jazdami.',
  'help.guide.plan-transit.tip.1':
    'Spojenia pochádzajú z Transitous, bezplatnej komunitnej služby, ktorá využíva verejné údaje cestovných poriadkov: bez kľúča a bez účtu. Administrátor môže nastaviť, aby vyhľadávanie namiesto toho používalo Google.',
  'help.guide.plan-transit.tip.2':
    'Nič sa nenašlo? Zdroje pokrývajú určitú oblasť a obdobie. Skúste iný čas, zapnite viac druhov dopravy alebo vyberte stanicu namiesto samotného miesta. Správa uvádza službu, ktorá odpovedala. Cesta bez dátumov nemá deň, v ktorom by sa dalo hľadať, preto ponúka iba bežný formulár.',
  'help.guide.plan-transit.tip.3':
    'To isté vyhľadávanie sa otvorí aj pre jeden úsek: kliknite na spojnicu s časom cesty medzi dvoma zastávkami a vyberte Verejná doprava. Od, Do a čas odchodu sa vyplnia za vás.',
  // change-transit-route
  'help.guide.change-transit-route.title': 'Otvorenie a zmena naplánovaného spojenia',
  'help.guide.change-transit-route.goal':
    'Prejdite si spojenie linku po linke, premenujte ho alebo trasu vyhľadajte znova.',
  'help.guide.change-transit-route.step.1':
    'Na záložke Doprava je naplánované spojenie karta s modrým pruhom hore, zoradená v časovom poradí spolu s potvrdenou dopravou. Keď je v Možnostiach zobrazenia zapnuté MHD ako samostatná sekcia, zobrazuje sa namiesto toho pod Automatické spojenie MHD. Kliknite na kartu. Spojenie sa otvorí ako rezervácia.',
  'help.guide.change-transit-route.step.2':
    'Dlaždice hore ukazujú odchod a príchod s ich zastávkami, Trvanie, Prestupy a Pešo. Pod nimi Itinerár ukazuje spojenie linku po linke, s časmi, nástupišťami a presunmi pešo medzi linkami.',
  'help.guide.change-transit-route.step.3':
    '„Zmeniť trasu“ v spodnej časti rezervácie znova otvorí vyhľadávanie, už vyplnené oboma koncami tohto spojenia a jeho dňom.',
  'help.guide.change-transit-route.step.4':
    'Kliknite na „Hľadať“, rozbaľte iné spojenie a kliknite na „Pridať k dňu“. Nahradí to pôvodné. „Upraviť“ úplne vpravo v spodnej časti rezervácie naopak otvorí bežný formulár dopravy, kde môžete upraviť „Rezervačný kód“, cestujúcich, poznámky a súbory.',
  'help.guide.change-transit-route.result':
    'Spojenie teraz používa nový itinerár a jeho karta v záložke Doprava ukazuje nové linky a časy.',
  'help.guide.change-transit-route.tip.1':
    'Kliknutím na názov v záhlaví rezervácie spojenie premenujete bez zmeny trasy. Jeho poznámky píšete vo formulári dopravy, ktorý otvorí Upraviť.',
  'help.guide.change-transit-route.tip.2':
    'Kôš dole v rezervácii spojenie po potvrdení vymaže. Zastávky v dni zostanú.',
  // leg-travel-mode
  'help.guide.leg-travel-mode.title': 'Zmena spôsobu cestovania na jednom úseku',
  'help.guide.leg-travel-mode.goal':
    'Nastavte jeden úsek jazdného dňa na chôdzu alebo naplánujte tento úsek cez vyhľadávanie spojení.',
  'help.guide.leg-travel-mode.step.1':
    'Spojnice medzi zastávkami sa zobrazia až po zapnutí trasy dňa. Kliknutím na hlavičku dňa ho otvorte a potom kliknite na „Trasa“ na lište pod jeho zastávkami.',
  'help.guide.leg-travel-mode.step.2':
    'Každá spojnica ukazuje čas cesty a vzdialenosť daného úseku, s ikonou režimu, v ktorom bola trasa vytýčená: auto pre jazdu, noha pre chôdzu, bicykel pre jazdu na bicykli.',
  'help.guide.leg-travel-mode.step.3':
    'Kliknite na spojnicu. V ponuke je Auto, Pešo a Bicykel, „Verejná doprava“ pre tento jeden úsek a „Použiť predvolené pre deň“.',
  'help.guide.leg-travel-mode.step.4':
    'Vyberte „Pešo“. Zmení sa len tento úsek, zvyšok dňa si ponechá svoj spôsob dopravy.',
  'help.guide.leg-travel-mode.result':
    'Úsek ukazuje ikonu chodidla a čas chôdze a ostatné úseky dňa si ponechajú spôsob cestovania dňa.',
  'help.guide.leg-travel-mode.tip.1':
    'Režim patrí úseku, nie dňu: tlačidlá Auto, Pešo a Bicykel pre celý deň nikdy neprepíšu úsek, ktorý ste nastavili ručne. Použiť predvolené pre deň zariadi, že úsek opäť sleduje tieto tlačidlá.',
  'help.guide.leg-travel-mode.tip.2':
    'Verejná doprava v tej istej ponuke otvorí vyhľadávanie spojenia presne pre tento úsek, s už vyplnenými oboma koncami a časom odchodu.',
  'help.guide.leg-travel-mode.tip.3':
    'Časy počíta verejný smerovač po skutočných cestách a chodníkoch. Ak úsek vypočítať nevie, úsek zostane ako priama čiara a čas sa nezobrazí.',
  // edit-transport
  'help.guide.edit-transport.title': 'Zmena alebo vymazanie dopravy',
  'help.guide.edit-transport.goal': 'Opravte čas, nástupište alebo rezervačný kód, alebo odstráňte dopravu z cesty.',
  'help.guide.edit-transport.step.1':
    'V pláne dňa je doprava riadok medzi zastávkami, zafarbený podľa typu. Kliknutím otvoríte jej rezerváciu: hore sú ako štítky stav, typ, dni a „Rezervačný kód“ (s tlačidlom na skopírovanie), pod nimi časy odchodu a príchodu s letiskami alebo stanicami.',
  'help.guide.edit-transport.step.2':
    '„Upraviť“ v spodnej časti rezervácie otvorí formulár, v ktorom vznikla, s nápisom „Upraviť dopravu“ nad názvom v hlavičke. Zmeniť tam môžete všetko: názov, štítky stavu a typu, trasu, dni a časy aj „Rezervačný kód“.',
  'help.guide.edit-transport.step.3':
    'Trasa letu je reťazec letísk, trasa vlaku reťazec staníc, trasa plavby reťazec prístavov. Pridať zastávku (pri plavbe Pridať prístav) vloží medzi ne ďalšiu a každý úsek si ponechá vlastné časy a vlastné číslo letu alebo vlaku.',
  'help.guide.edit-transport.step.4':
    'Kliknite na „Aktualizovať“. Ak chcete dopravu úplne odstrániť, použite kôš vľavo na tej istej lište, kôš v spodnej časti rezervácie alebo kôš na jej karte na záložke „Doprava“ a potvrďte.',
  'help.guide.edit-transport.result':
    'Zmena sa prejaví všade, kde sa doprava zobrazuje: v záložke Doprava, v dni, v ktorom prebieha, a v jej čiare na mape.',
  'help.guide.edit-transport.tip.1':
    'Ten istý formulár sa otvorí z oboch miest: cez Upraviť v rezervácii, ktorú otvorí riadok v pláne dňa, aj cez ceruzku na karte v karte Doprava. Naplánované spojenie verejnou dopravou sa otvorí tiež ako rezervácia. Zmeniť trasu tam znova otvorí vyhľadávanie a Upraviť otvorí tento formulár.',
  'help.guide.edit-transport.tip.2':
    'Ak chcete dopravu presunúť na iný deň, formulár nepotrebujete: potiahnite jej riadok z karty jedného dňa na kartu druhého.',
  // transport-on-map
  'help.guide.transport-on-map.title': 'Zobrazenie dopravy na mape',
  'help.guide.transport-on-map.goal': 'Pozrite si skutočnú trasu letu, jazdy alebo spojenia.',
  'help.guide.transport-on-map.step.1':
    'Doprava s nastavenými oboma koncami má vo svojom riadku v pláne dňa malú ikonu trasy. Kliknite na ňu a jej popis sa zmení na „Skryť trasy rezervácií“.',
  'help.guide.transport-on-map.step.2':
    'Trasa sa nakreslí na mapu a na každom jej konci je štítok s ikonou dopravného prostriedku.',
  'help.guide.transport-on-map.step.3':
    'Kliknite na koncovú značku a rezervácia sa otvorí nad mapou. Jej záhlavie ukazuje stav, typ, dni a Rezervačný kód. Pod nimi sú časy s letiskami alebo stanicami, letecká spoločnosť a číslo letu. Kliknutím na Zavrieť v záhlaví rezerváciu zavriete.',
  'help.guide.transport-on-map.step.4':
    'Ikona trasy na paneli nástrojov nad dňami platí naraz pre celú cestu: Zobraziť všetky trasy rezervácií a Skryť všetky trasy rezervácií ich opäť skryje.',
  'help.guide.transport-on-map.step.5':
    'Naplánované spojenie verejnou dopravou nemá vlastnú ikonu trasy. Kreslí sa cez prepínač „Trasa“ daného dňa, preto ho „Skryť všetky trasy rezervácií“ neskryje, kým je trasa toho dňa zapnutá.',
  'help.guide.transport-on-map.result':
    'Trasy sa zobrazia na mape so značkou na každom konci a zostanú tam, kým ich nevypnete.',
  'help.guide.transport-on-map.tip.1':
    'Let, plavba a trajekt sa kreslia ako oblúk. Auto, autobus, taxi a bicykel sledujú skutočné cesty. Vlak alebo naplánované spojenie vedie cez stanice, na ktorých zastavuje.',
  'help.guide.transport-on-map.tip.2':
    'Potvrdená rezervácia sa zobrazuje plnou čiarou, nepotvrdená prerušovanou. Nastavenie „Popisky trás rezervácií“ zobrazí v koncových značkách kód letiska alebo názov stanice.',
  'help.guide.transport-on-map.tip.3':
    '„Zobraziť všetky trasy rezervácií“ nepridáva k trasám, ktoré už máte zobrazené: nahradí to, čo ste nastavili jednotlivými ikonami. Po stlačení sú všetky trasy buď zobrazené, alebo skryté.',
  // airtrail-import
  'help.guide.airtrail-import.title': 'Import letov z AirTrail',
  'help.guide.airtrail-import.goal':
    'Importujte lety, ktoré už máte v AirTrail, naraz do cesty a nechajte ich potom aktualizovať z AirTrail.',
  'help.guide.airtrail-import.step.1':
    'Keď je zapnutý doplnok AirTrail a vaša inštancia je pripojená v Nastaveniach v časti Integrácie, na lište záložky Doprava sa pred tlačidlom „Doprava“ zobrazí ikona lietadla „Import z AirTrail“. Kliknite na ňu.',
  'help.guide.airtrail-import.step.2':
    'Import z AirTrail zobrazí lety vášho účtu v dvoch skupinách. Počas tejto cesty obsahuje lety s dátumom v rámci cesty, už zaškrtnuté. Ostatné lety obsahuje zvyšok, nezaškrtnutý. Let, ktorý už v ceste je, je sivý a označený Importované.',
  'help.guide.airtrail-import.step.3':
    'Každý riadok je zaškrtávacie políčko s leteckou spoločnosťou a číslom letu, oboma letiskami a dátumom. Kliknutím na riadok let zahrniete alebo vynecháte. Lety v časti Ostatné lety sa importujú, len keď ich zaškrtnete.',
  'help.guide.airtrail-import.step.4':
    'Nadväzujúce lety sú zoskupené: každý odlieta z letiska, kde do jedného dňa pristál predchádzajúci. Políčko pod nimi „Importovať ako jeden let s prestupom na tomto letisku“ je už zaškrtnuté. Nechajte ho zaškrtnuté, ak chcete jednu rezerváciu s prestupom, alebo ho zrušte a úseky sa importujú ako samostatné lety.',
  'help.guide.airtrail-import.step.5':
    'Kliknite na tlačidlo vpravo dole, ktoré ukazuje počet zaškrtnutých letov, napríklad „Importovať 2“. Následná správa uvedie, koľko letov sa importovalo.',
  'help.guide.airtrail-import.step.6':
    'Lety sa zobrazia ako karty pod Potvrdené, každá s modrou pilulkou AirTrail vedľa názvu, a ako riadky v dňoch, v ktorých letia. Let s prestupom je jedna karta a jeho trasa vedie cez miesto prestupu.',
  'help.guide.airtrail-import.result':
    'Lety z AirTrail sú karty v karte Doprava a riadky v ich dňoch, každý s pilulkou AirTrail, ktorá ukazuje, odkiaľ pochádza.',
  'help.guide.airtrail-import.tip.1':
    'Let, ktorý už v ceste je s rovnakým číslom a dátumom, sa preskočí a správa uvedie, koľko letov sa preskočilo. Šípka späť na paneli nástrojov nad dňami vráti celý import.',
  'help.guide.airtrail-import.tip.2':
    'Hlavným zdrojom údajov zostáva AirTrail. TREK načíta jeho zmeny pri otvorení cesty a každých pár minút na pozadí. Let vymazaný v AirTrail si v TREK ponechá kartu a jeho štítok sa zmení na Nesynchronizované. Úpravy urobené v TREK sa posielajú späť do AirTrail iba vtedy, keď je v časti Integrácie zapnuté Zapisovať zmeny späť do AirTrail.',
  'help.guide.airtrail-import.tip.3':
    'Spojenie s prestupom nie je jeden let z AirTrail, ktorý by sa dal synchronizovať, preto ide o jednorazový import: ponechá si modrý štítok a keď naň ukážete kurzorom, štítok to povie. To isté sa stane synchronizovanému letu, ku ktorému ručne pridáte zastávku.',
  // ── Screen: trip-bookings ─────────────────────────────────────────────────────────────
  'help.ctx.trip-bookings.title': 'Rezervácie',
  'help.ctx.trip-bookings.summary':
    'Na tejto záložke je všetko, čo máte pre cestu rezervované okrem dopravy: ubytovanie, stoly v reštauráciách, vstupenky, prehliadky a parkovanie. Každá rezervácia je karta, riadok zoznamu alebo pruh na časovej osi so svojím kódom, dokumentmi, cestujúcimi a nákladmi. Kliknutím na rezerváciu otvoríte jej podrobnosti.',
  'help.ctx.trip-bookings.bullet.1':
    'Ručná rezervácia na pravom konci lišty otvorí Nová rezervácia. Vytvára šesť druhov rezervácií: Ubytovanie, Reštaurácia, Udalosť, Prehliadka, Parkovanie a Iné. Lety, vlaky a ostatná doprava sú v záložke Doprava a tu sa nikdy nezobrazia.',
  'help.ctx.trip-bookings.bullet.2':
    'Ikona sťahovania pred Ručná rezervácia, Importovať potvrdenia rezervácií, nahrá potvrdenia, aby ich TREK vedel prečítať automaticky: EML, PDF, PKPass, HTML alebo TXT, najviac päť súborov po 10 MB, a fotky, ak AI model číta obrázky. Ikona sa zobrazí, iba ak ich server vie čítať.',
  'help.ctx.trip-bookings.bullet.3':
    'Hľadať prehľadáva názvy, typy, miesta, poznámky, rezervačné kódy a cestujúcich. Filter, lievik vedľa neho, zúži kartu podľa Stav, podľa Typ s počtom pri každom a podľa Cestujúci, keď rezervácia uvádza ľudí. Číslo pri lieviku ukazuje, koľko filtrov je zapnutých.',
  'help.ctx.trip-bookings.bullet.4':
    'Tri ikony za Filter prepínajú zobrazenie: Karty, Zoznam a Časová os. Možnosti zobrazenia, posuvníky vedľa nich, zoskupujú a triedia karty a zoznam alebo nastavujú dráhy časovej osi. Ikona tabuľky za nimi, Exportovať ako tabuľku (CSV), stiahne to, čo karta ukazuje, ako súbor. Predvolene sú karty zoskupené do Potvrdené a Čaká na potvrdenie a zoznam podľa dňa. Kliknutím na nadpis sekcie ju zbalíte.',
  'help.ctx.trip-bookings.bullet.5':
    'Karta má hlavičku zafarbenú podľa stavu, so stavovou bodkou (kliknutím prepínate medzi „Čaká na potvrdenie“ a „Potvrdené“), typom, názvom, ceruzkou a košom. Pod ňou sú údaje, ktoré rezervácia má: Dátum, Čas, Rezervačný kód, Check-in a Check-out, Miesto / Adresa, Ubytovanie, Prepojené s (zastávka v pláne), Odkaz, Poznámky, Cestujúci, Súbory a prepojené náklady.',
  'help.ctx.trip-bookings.bullet.6':
    'Kliknutie na kartu, riadok alebo pruh otvorí detail rezervácie s Na mape (ak má rezervácia miesto), košom a Upraviť dole. Mazanie sa opýta raz (Odstrániť rezerváciu?, čo vám povie, ak sa spolu s ňou vymažú aj náklady). Potom sa rezervácia vymaže spolu s prepojenými výdavkami a pri ubytovaní sa jeho noci odstránia z plánu dňa.',
  // booking-views
  'help.guide.booking-views.title': 'Prepnutie zobrazenia a otvorenie rezervácie',
  'help.guide.booking-views.goal':
    'Pozrite si rezervácie ako karty, ako zoznam alebo na časovej osi a otvorte jednu, aby ste videli všetky jej podrobnosti.',
  'help.guide.booking-views.step.1':
    'Tri ikony za tlačidlom „Filtrovať“ na lište sú zobrazenia a keď na ne ukážete, zobrazí sa ich názov: „Karty“, „Zoznam“ a „Časová os“. Záložka sa otvorí v zobrazení „Karty“, s kartou pre každú rezerváciu v sekciách „Potvrdené“ a „Čaká na potvrdenie“. Kliknite na „Zoznam“, prostrednú ikonu.',
  'help.guide.booking-views.step.2':
    '„Zoznam“ zobrazí každú rezerváciu ako riadok pod nadpisom dňa, s dňom a časom vpravo. Šípkami na klávesnici prechádzate medzi riadkami. Kliknite na „Časová os“, poslednú z troch ikon.',
  'help.guide.booking-views.step.3':
    'Časová os rozloží rezervácie do dní cesty: jeden pruh pre každý typ a lišta od začiatku po koniec každej rezervácie. Čakajúca rezervácia má prerušovaný obrys. Cesta zmestí celú cestu do šírky. Kliknutím na nadpis dňa uvidíte tento deň po hodinách.',
  'help.guide.booking-views.step.4':
    'Zobrazenie „Deň“ ukazuje jeden deň na hodinovej osi a dĺžka každého pruhu zodpovedá jeho času. Šípkami vedľa názvu dňa prejdete na predchádzajúci a nasledujúci deň. Počas cesty skočíte tlačidlom „Dnes“ na aktuálny deň a prepínačom Cesta / Deň vpravo sa vrátite na celú cestu.',
  'help.guide.booking-views.step.5':
    'Ukážte na pruh a uvidíte jeho deň, časy a miesto, kliknutím naň otvoríte podrobnosti rezervácie. Karta v zobrazení Karty a riadok v zobrazení Zoznam otvoria to isté okno.',
  'help.guide.booking-views.step.6':
    'V hlavičke podrobného zobrazenia je názov a štítky so stavom (kliknutím ho prepnete), typom, dňom a rezervačným kódom s tlačidlom na jeho skopírovanie. Pod ňou sú časy ako dlaždice, potom miesto, cestujúci, poznámky, náklady a súbory, ak ich rezervácia má, a úplne dole „Na mape“, kôš a „Upraviť“.',
  'help.guide.booking-views.result':
    'Rezervácia sa otvorí v podrobnom zobrazení: Upraviť otvorí jej formulár, Na mape ju zobrazí v pláne a Uzavrieť alebo Escape vás vráti do zobrazenia, z ktorého ste prišli.',
  'help.guide.booking-views.tip.1':
    'Možnosti zobrazenia, ikona posuvníkov za ikonami zobrazení, umožňujú zoskupiť a zoradiť Karty a Zoznam cez Zoskupiť podľa a Zoradiť podľa. V Časová os ponúkajú Samostatný pruh pre každý typ a Zobraziť druhú záložku. Zobraziť druhú záložku ukáže záznamy záložky Doprava stlmene v tenkom pruhu navrchu. Obnoviť zobrazenie vráti predvolené nastavenia a každá záložka si svoje zobrazenie pamätá v tomto prehliadači.',
  'help.guide.booking-views.tip.2':
    'Rezervácia pred cestou, po nej alebo bez dátumu sa na časovej osi zobraziť nemôže. Nájdete ju pod grafom ako malú kartu v časti „Pred cestou“, „Po ceste“ alebo „Bez dátumu“.',
  'help.guide.booking-views.tip.3':
    'Rovnaké podrobnosti sa otvoria všade, kde sa rezervácia zobrazuje: na záložke „Doprava“, v pláne dňa, v podrobnostiach dňa aj miesta. Kliknutím na názov rezerváciu premenujete.',
  // create-booking
  'help.guide.create-booking.title': 'Vytvorenie rezervácie',
  'help.guide.create-booking.goal':
    'Pridajte do cesty ručne reštauráciu, udalosť, prehliadku, parkovacie miesto alebo čokoľvek iné.',
  'help.guide.create-booking.step.1':
    'Kliknite na „Ručná rezervácia“ na pravom konci lišty. Otvorí sa „Nová rezervácia“ s názvom a dvoma štítkami v hlavičke hore.',
  'help.guide.create-booking.step.2':
    'Kliknite na štítok typu v hornej časti, ktorý je pri novej rezervácii Ostatné, a vyberte Typ rezervácie. Táto záložka vytvára šesť typov: Ubytovanie, Reštaurácia, Udalosť, Prehliadka, Parkovanie a Ostatné. Formulár sa mení podľa vášho výberu: iba Ubytovanie používa namiesto dátumov rozsah dní.',
  'help.guide.create-booking.step.3':
    'Zadajte názov do hornej časti, do poľa nad štítkami. Je to jediné povinné pole a Pridať zostane sivé, kým do neho niečo nezadáte.',
  'help.guide.create-booking.step.4':
    'Nastavte Dátum a Čas začiatku a, ak má rezervácia koniec, aj Dátum konca a Čas konca. Kalendáre ponúkajú len dni v rámci cesty. Dátum a čas konca, ktoré nie sú po začiatku, sa zobrazia červenou a zablokujú Pridať. Čas konca skorší než čas začiatku bez dátumu konca len upozorní: ak rezervácia končí nasledujúci deň, nastavte dátum konca.',
  'help.guide.create-booking.step.5':
    'Zadajte „Rezervačný kód“ z potvrdenia a potom kliknite na štítok stavu v hlavičke vedľa typu. Pri novej rezervácii je na ňom „Čaká na potvrdenie“ a kliknutím ho zmeníte na „Potvrdené“. Podľa stavu sa určí, v ktorej sekcii sa karta zobrazí.',
  'help.guide.create-booking.step.6': 'V spodnej časti formulára kliknite na „Pridať“.',
  'help.guide.create-booking.result':
    'Rezervácia sa zobrazí ako karta vo svojej sekcii. Farba jej záhlavia ukazuje stav a karta uvádza typ, dátum a časy a kód. Všetci ostatní v ceste ju uvidia okamžite.',
  'help.guide.create-booking.tip.1':
    'Miesto / Adresa ponúka počas písania skutočné adresy. Výber jednej nahradí to, čo ste napísali, a adresa, ktorú ste napísali sami, zostane nezmenená.',
  'help.guide.create-booking.tip.2':
    'Do poľa „Odkaz“ zadajte stránku rezervácie u poskytovateľa. Karta aj podrobné zobrazenie ho ukážu ako odkaz, ktorý sa otvorí na novej karte.',
  'help.guide.create-booking.tip.3':
    'Poznámky podporujú Markdown, takže zoznam alebo tučný riadok sa na karte aj v podrobnom zobrazení zobrazí ako zoznam alebo tučný text.',
  // booking-hotel
  'help.guide.booking-hotel.title': 'Rezervácia ubytovania',
  'help.guide.booking-hotel.goal':
    'Zadajte ubytovanie tak, aby sa naraz počítalo ako rezervácia aj ako noci v pláne dňa.',
  'help.guide.booking-hotel.step.1':
    'Kliknite na „Ručná rezervácia“ a štítkom typu v hornom páse vyberte „Ubytovanie“. Polia s dátumom nahradí skupina polí pre hotel.',
  'help.guide.booking-hotel.step.2':
    'Hotel vyberte v časti „Ubytovanie“. Zoznam obsahuje miesta cesty bez importovaných stôp a túr. Po výbere sa jeho názov doplní do prázdneho názvu a adresa do poľa „Miesto / Adresa“.',
  'help.guide.booking-hotel.step.3':
    'Nastavte Od a Do: prvú noc a ráno, keď odchádzate. Obe ponúkajú dni cesty s dátumami a TREK drží Do po Od.',
  'help.guide.booking-hotel.step.4': 'Vyplňte Check-in, Check-in do a Check-out a Rezervačný kód z potvrdenia.',
  'help.guide.booking-hotel.step.5': 'Kliknite na „Pridať“.',
  'help.guide.booking-hotel.result':
    'Karta ukazuje rozsah dní v časti Dátum, časy príchodu a odchodu a adresu. Pobyt sa teraz zobrazuje aj v týchto dňoch plánu.',
  'help.guide.booking-hotel.tip.1':
    'Ubytovanie je jediný typ bez Dátumu a Času začiatku. Jeho dátumy sú Od a Do a vyberáte dni cesty, nie kalendárne dátumy.',
  'help.guide.booking-hotel.tip.2':
    'Pole „Ubytovanie“ nechajte prázdne a namiesto toho napíšte adresu: miesto sa vyhľadá, vytvorí a pripne na mapu za vás.',
  'help.guide.booking-hotel.tip.3': 'Keď rezerváciu vymažete, z plánu dňa sa odstránia aj jej noci.',
  // link-booking
  'help.guide.link-booking.title': 'Prepojenie rezervácie s plánom',
  'help.guide.link-booking.goal':
    'Prepojte rezerváciu s jej zastávkou a miestom, aby sa zobrazovala tam, kde ju potrebujete.',
  'help.guide.link-booking.step.1':
    'Prejdite myšou nad kartu, ktorú chcete prepojiť, a kliknite na ceruzku v jej hlavičke. Otvorí sa „Upraviť rezerváciu“.',
  'help.guide.link-booking.step.2':
    'Otvorte Prepojiť s priradením dňa. Zoznam ukazuje váš plán: nadpis pre každý deň a pod ním zastávky toho dňa, očíslované a s časmi. Vyberte zastávku, ku ktorej rezervácia patrí.',
  'help.guide.link-booking.step.3':
    'Miesto / Aktivita prepojí samotné miesto. Vyberte ho tam a názov aj Miesto / Adresa sa vyplnia, ak sú prázdne.',
  'help.guide.link-booking.step.4': 'Kliknite na „Aktualizovať“.',
  'help.guide.link-booking.result':
    'Karta v časti „Prepojené s“ ukazuje deň a zastávku a rezervácia sa v pláne dňa zobrazí pri tejto zastávke.',
  'help.guide.link-booking.tip.1':
    'Bez prepojenia (samostatné) navrchu zoznamu prepojenie opäť zruší. Ubytovanie nemá výber zastávky: prepája sa cez svoje noci.',
  'help.guide.link-booking.tip.2':
    'Výber zastávky v dni s dátumom vyplní prázdne pole Dátum za vás. Dátum, ktorý ste už nastavili, sa nezmení.',
  // booking-travelers
  'help.guide.booking-travelers.title': 'Určiť, pre koho je rezervácia',
  'help.guide.booking-travelers.goal':
    'Označte, pre ktorých cestujúcich rezervácia platí, a potom zobrazte iba ich rezervácie.',
  'help.guide.booking-travelers.step.1':
    'Otvorte rezerváciu ceruzkou na jej karte. Cestujúci je vedľa Rezervačný kód. Kým nie je k rezervácii priradený nikto, ukazuje Priradiť cestujúcich.',
  'help.guide.booking-travelers.step.2':
    'Kliknite naň a vyberte ľudí, pre ktorých je rezervácia. V zozname sú aj pomenovaní hostia. Pri vybranej osobe sa zobrazí fajka a jej avatar sa objaví v poli. Opätovným kliknutím na meno ju odoberiete.',
  'help.guide.booking-travelers.step.3': 'Kliknite na „Aktualizovať“.',
  'help.guide.booking-travelers.step.4':
    'Na lište kliknite na Filtrovať: pod Cestujúci kliknite na osobu, aby ste videli len jej rezervácie. Môžete zapnúť viac osôb naraz.',
  'help.guide.booking-travelers.result':
    'Karta uvádza ľudí, pre ktorých rezervácia je, a Filter zúži kartu na rezervácie vybraných ľudí.',
  'help.guide.booking-travelers.tip.1':
    'Na karte a v podrobnom zobrazení sa cestujúci iba zobrazujú, zmeniť ich tam nemôžete. Nastavujú sa tu, vo formulári.',
  'help.guide.booking-travelers.tip.2':
    'Cestujúci sa vo Filtrovať zobrazí, keď má cesta viac ako jedného člena a aspoň jedna rezervácia niekoho uvádza. Váš výber platí, kým nezatvoríte kartu prehliadača.',
  // booking-files
  'help.guide.booking-files.title': 'Uloženie poukazu k rezervácii',
  'help.guide.booking-files.goal': 'Priložte potvrdenie, lístok alebo permanentku k rezervácii, ku ktorej patrí.',
  'help.guide.booking-files.step.1':
    'Otvorte rezerváciu ceruzkou na jej karte. Vedľa „Pripojiť“ sú „Súbory“, kliknite tam na „Priložiť súbor“. Pri existujúcej rezervácii sa dokument hneď nahrá a TREK zobrazí „Súbor bol nahraný“.',
  'help.guide.booking-files.step.2': 'Dokument je uvedený podľa názvu, s tlačidlom na otvorenie a X vedľa neho.',
  'help.guide.booking-files.step.3':
    'Prepojiť existujúci súbor ponúka dokumenty cesty, ktoré ešte nie sú pri tejto rezervácii. Vyberte jeden a priloží sa bez ďalšieho nahrávania.',
  'help.guide.booking-files.step.4': 'Kliknite na „Aktualizovať“.',
  'help.guide.booking-files.result':
    'Karta aj detail uvádzajú dokumenty pod „Súbory“. Kliknutím dokument otvoríte. „Zobraziť v súboroch“ nad zoznamom v detaile vás prenesie na kartu „Súbory“.',
  'help.guide.booking-files.tip.1':
    'Pri rezervácii, ktorú ešte vytvárate, sa dokument nahrá po kliknutí na Pridať. Nahrávanie vyžaduje pripojenie.',
  'help.guide.booking-files.tip.2':
    'X vedľa dokumentu odstráni prepojenie, nie dokument. Dokument zostane na záložke Súbory cesty.',
  'help.guide.booking-files.tip.3':
    'Ktoré typy súborov možno priložiť, určuje správca v časti Povolené typy súborov. Predvolene sú povolené dokumenty, text a obrázky.',
  // booking-cost
  'help.guide.booking-cost.title': 'Prevod ceny rezervácie na výdavok',
  'help.guide.booking-cost.goal':
    'Pridajte cenu rezervácie do „Nákladov“ a rozdeľte ju medzi ľudí, ktorí za ňu platia.',
  'help.guide.booking-cost.step.1':
    'Otvorte rezerváciu ceruzkou na jej karte a prejdite na koniec formulára. Pod Náklady nájdete Vytvoriť výdavok a Prepojiť existujúci výdavok s poznámkou Uloží rezerváciu, potom otvorí editor nákladov.',
  'help.guide.booking-cost.step.2':
    'Kliknite na Vytvoriť výdavok. Rezervácia sa uloží, jej formulár sa zavrie a editor nákladov sa otvorí ako Pridať výdavok.',
  'help.guide.booking-cost.step.3':
    'Názov v záhlaví je už názov rezervácie a Deň je už deň rezervácie. Zadajte Celková suma a skontrolujte Mena vedľa nej.',
  'help.guide.booking-cost.step.4':
    'Štítok v hlavičke je „Kategória“, už nastavená podľa typu rezervácie. V časti „Kto zaplatil?“ vyberte, kto platil, a v časti „Rozdeliť“, ako sa suma rozdelí.',
  'help.guide.booking-cost.step.5': 'Kliknite na Pridať výdavok.',
  'help.guide.booking-cost.result':
    'Karta ukazuje sumu dole, formulár rezervácie uvádza výdavok v časti Prepojené výdavky a ten istý výdavok sa zobrazuje na záložke Náklady, prepojený s touto rezerváciou.',
  'help.guide.booking-cost.tip.1':
    'Kategória závisí od typu: „Reštaurácia“ sa zmení na „Jedlo a pitie“, „Ubytovanie“ na „Ubytovanie“, „Parkovanie“ na „Parkovanie“ a „Udalosť“ aj „Prehliadka“ na „Ostatné“.',
  'help.guide.booking-cost.tip.2':
    'Rezervácia môže mať viac výdavkov. „Prepojiť existujúci výdavok“ ponúkne výdavky z „Nákladov“, ktoré ešte nie sú s ničím prepojené. Pri prepojenom výdavku „Odpojiť, výdavok ponechať“ zruší prepojenie a výdavok v „Nákladoch“ ponechá, kôš ho vymaže.',
  'help.guide.booking-cost.tip.3':
    'Náklady sú vo formulári len vtedy, keď je zapnutý doplnok Náklady, ktorý správca zapína v Doplnky.',
  // filter-bookings
  'help.guide.filter-bookings.title': 'Hľadanie rezervácie',
  'help.guide.filter-bookings.goal': 'Vyfiltrujte dlhú záložku podľa slova, stavu, typu alebo osoby.',
  'help.guide.filter-bookings.step.1':
    'Píšte do poľa Hľadať na lište. Prehľadáva názvy, typy, miesta a adresy, poznámky, rezervačné kódy a mená cestujúcich a záložka počas písania ukazuje menej výsledkov. Escape pole vymaže.',
  'help.guide.filter-bookings.step.2':
    'Kliknite na Filtrovať, lievik vedľa vyhľadávania. Panel obsahuje Stav, Typ a, keď je k nejakej rezervácii priradený niekto, aj Cestujúci.',
  'help.guide.filter-bookings.step.3':
    'V časti „Stav“ vyberte „Potvrdené“ alebo „Čaká na potvrdenie“, ak chcete vidieť len tie. „Všetky“ zobrazí oboje.',
  'help.guide.filter-bookings.step.4':
    'V časti „Typ“ kliknite na jeden alebo viac typov, ak chcete vidieť len ich. Pri každom typu je počet rezervácií a vybrané typy sú označené fajkou.',
  'help.guide.filter-bookings.step.5':
    'Číslo na Filtrovať ukazuje, koľko filtrov je zapnutých, a čip vedľa vyhľadávania ukazuje, koľko zo všetkých rezervácií zostalo. Kliknutím na čip alebo na Zrušiť filtre dole v paneli opäť uvidíte všetko.',
  'help.guide.filter-bookings.result':
    'Karta ukazuje len to, čo ste vybrali, v zobrazeniach Karty, Zoznam aj Časová os, a filtre pre túto cestu zostanú, kým nezavriete kartu prehliadača.',
  'help.guide.filter-bookings.tip.1':
    '„Typ“ sa zobrazí iba vtedy, keď sú na záložke rezervácie viacerých typov, a ponúka iba typy, ktoré na nej sú. Ak teda na záložke nie je žiadna prehliadka, „Typ“ nemá možnosť „Prehliadka“.',
  'help.guide.filter-bookings.tip.2':
    'Ak filtru nič nezodpovedá, záložka ukáže Týmto filtrom nič nezodpovedá a hneď pod tým Zrušiť filtre.',
  // import-booking-file
  'help.guide.import-booking-file.title': 'Import rezervácie z potvrdenia',
  'help.guide.import-booking-file.goal':
    'Nechajte TREK načítať rezerváciu z e-mailu alebo PDF od poskytovateľa, aby ste ju nemuseli prepisovať.',
  'help.guide.import-booking-file.step.1':
    'Kliknite na ikonu sťahovania na lište, „Importovať potvrdenia rezervácií“. Jej názov sa zobrazí, keď na ňu prejdete myšou. Otvorí sa rovnomenný dialóg.',
  'help.guide.import-booking-file.step.2':
    'Potvrdenia pretiahnite do poľa alebo naň kliknite a vyberte ich: EML, PDF, PKPass, HTML a TXT, najviac päť súborov po 10 MB, a ak AI model vie čítať obrázky, aj fotky (JPG, PNG, WEBP). Vybrané súbory sa v poli zobrazia s názvom.',
  'help.guide.import-booking-file.step.3':
    'Kliknite na Importovať. Dialóg sa hneď zavrie, pretože čítanie prebieha na pozadí.',
  'help.guide.import-booking-file.step.4':
    'Karta vpravo dole ukazuje priebeh pod názvom súboru. Zostane viditeľná, aj keď sa pohybujete v aplikácii a po obnovení stránky. Spracúvajú sa súbory… sa po dokončení čítania zmení na fajku a karta ponúkne Importovať. Kliknite naň.',
  'help.guide.import-booking-file.step.5':
    'Každá nájdená rezervácia sa postupne otvorí v okne „Nová rezervácia“, už vyplnená. Pri hoteli je to jeho názov ako názov rezervácie a, ak cesta toto miesto má, v časti Ubytovanie jeho Miesto / Adresa, Od a Do pre jeho noci, Check-in a Check-out, Rezervačný kód, potvrdenie v časti Súbory a pri zapnutých Nákladoch cena ako „Prepojený výdavok“. Skontrolujte ju a kliknite na „Pridať“.',
  'help.guide.import-booking-file.result':
    'Rezervácia sa zobrazí ako karta v časti Čaká na potvrdenie s počtom nocí, kódom a potvrdením v časti Súbory. Pobyt sa zobrazí v týchto dňoch plánu. Ak sú zapnuté Náklady, cena sa pridá ako výdavok prepojený s rezerváciou.',
  'help.guide.import-booking-file.tip.1':
    'Ikona importu sa zobrazuje, len keď server vie čítať potvrdenia. Na to je potrebný buď extraktor, alebo doplnok Analýza pomocou AI. Doplnok Analýza pomocou AI zapína správca v časti Doplnky. Záložka bez rezervácií ho ponúka aj ako tlačidlo Importovať zo súboru.',
  'help.guide.import-booking-file.tip.2':
    'Ak sa nepodarilo nič načítať, karta vám to oznámi. Keď je zapnutá „Analýza pomocou AI“, ponúkne „Skúsiť spracovanie pomocou AI“, ktoré pošle tie isté súbory priamo modelu. Hotové spracovanie sa uchová desať minút, kontrolu preto začnite v tomto čase.',
  'help.guide.import-booking-file.tip.3':
    'Potvrdenie sa priloží, len ak je jeho typ v „Povolené typy súborov“ v nastaveniach administrátora. PDF je povolené predvolene, e-mail (EML) treba najprv pridať, inak sa rezervácia uloží bez neho.',
  // edit-booking
  'help.guide.edit-booking.title': 'Zmena rezervácie',
  'help.guide.edit-booking.goal':
    'Opravte čas, doplňte kód, ktorý prišiel neskôr, alebo presuňte rezerváciu z Čaká na potvrdenie do Potvrdené.',
  'help.guide.edit-booking.step.1':
    'Prejdite myšou nad kartu a kliknite na ceruzku v jej hlavičke. Otvorí sa „Upraviť rezerváciu“ so všetkými údajmi rezervácie.',
  'help.guide.edit-booking.step.2': 'Zmeňte, čo treba, napríklad Rezervačný kód, ktorý prevádzkovateľ poslal neskôr.',
  'help.guide.edit-booking.step.3':
    'Kliknite na štítok Čaká na potvrdenie v hornom páse. Zmení sa na Potvrdené a pás zozelenie.',
  'help.guide.edit-booking.step.4': 'Kliknite na „Aktualizovať“.',
  'help.guide.edit-booking.result':
    'Karta sa presunie: potvrdená rezervácia sa zobrazí v sekcii „Potvrdené“ so zelenou bodkou a zeleným horným pásom a presun vidia všetci v ceste.',
  'help.guide.edit-booking.tip.1':
    'Ak nemôžete prečítať Rezervačný kód, je v Nastavenia pod Všeobecné zapnuté Skryť rezervačné kódy. Ukážte na kód alebo naň kliknite a bude čitateľný.',
  'help.guide.edit-booking.tip.2':
    'Ak zmeníte typ, zmení sa s ním aj kategória prepojeného výdavku, pokiaľ ste kategóriu v editore nákladov nevybrali ručne.',
  'help.guide.edit-booking.tip.3':
    'Ten istý formulár otvorí aj „Upraviť“ dole v podrobnom zobrazení rezervácie. Stav prepnete aj bez formulára: kliknite na bodku na karte alebo v riadku, prípadne na štítok stavu v podrobnom zobrazení.',
  // delete-booking
  'help.guide.delete-booking.title': 'Vymazanie rezervácie',
  'help.guide.delete-booking.goal': 'Odstráňte z cesty zrušenú rezerváciu.',
  'help.guide.delete-booking.step.1':
    'Ukážte na kartu a kliknite na kôš v jej hlavičke. Rovnako funguje aj kôš v spodnej časti podrobností rezervácie.',
  'help.guide.delete-booking.step.2':
    'Odstrániť rezerváciu? uvádza vybranú rezerváciu a hovorí, že sa natrvalo vymaže. Ak sú k nej prepojené náklady, upozorní, že sa vymažú tiež.',
  'help.guide.delete-booking.step.3': 'Kliknite na „Vymazať“.',
  'help.guide.delete-booking.result':
    'Karta sa vymaže pre všetkých v ceste. Vymazanie rezervácie sa nedá vrátiť späť, takže potvrdzovacia otázka je vaša posledná šanca ho zrušiť.',
  'help.guide.delete-booking.tip.1':
    'Vymazaním rezervácie sa vymažú aj výdavky prepojené s ňou. Vymazaním ubytovania sa z plánu dňa odstránia aj jeho noci.',
  'help.guide.delete-booking.tip.2':
    'Priložené dokumenty zostanú na záložke Súbory v ceste. Odstráni sa iba ich prepojenie s rezerváciou.',

  // ── Screen: trip-lists ────────────────────────────────────────────────────────────────
  'help.ctx.trip-lists.title': 'Zoznamy',
  'help.ctx.trip-lists.summary':
    'Dva zoznamy pre jednu cestu: zoznam vecí na balenie, s tým, kto čo prinesie a koľko to váži, a zoznam úloh so všetkým, čo sa musí stať pred cestou a počas nej. Záložka sa zobrazuje, kým je zapnutý doplnok Zoznamy.',
  'help.ctx.trip-lists.bullet.1':
    'Tlačidlami „Zoznam vecí“ a „Úlohy“ na lište hore prepínate medzi oboma zoznamami a vidíte, koľko položiek každý obsahuje. Tlačidlá na pravom konci lišty patria k tomu, ktorý je práve otvorený.',
  'help.ctx.trip-lists.bullet.2':
    'Zoznam vecí je rozdelený do zoznamov s ľubovoľným názvom, napríklad Dokumenty alebo Oblečenie. Každý zoznam je karta. V jej hlavičke je úchyt na presun celého zoznamu inam, farebná bodka, odznak so zbalenými z celkového počtu, tri bodky s možnosťami „Premenovať“, „Označiť všetko“, „Odznačiť všetko“ a „Odstrániť zoznam“ a šípka, ktorá kartu zbalí. „Pridať zoznam“ na lište nad nimi vytvorí nový.',
  'help.ctx.trip-lists.bullet.3':
    'Riadok má úchyt na presúvanie, políčko a názov, potom malý avatar osoby, ktorá položku vezme so sebou. Položka s množstvom nad jedna má aj počítadlo zabalených kusov, napríklad 3/10, s mínusom a plusom. Ďalej je množstvo ako malý odznak a, kým je zapnuté Sledovanie batožiny, hmotnosť v gramoch a kruh tašky, potom kôš a ponuka s tromi bodkami s Presunúť do zoznamu, Zdieľanie, Premenovať a Vymazať. Ovládacie prvky, ktoré riadok nepoužíva, sú stlmené, kým na ne neukážete myšou.',
  'help.ctx.trip-lists.bullet.4':
    'Zdieľané a Môj zoznam rozdeľujú zoznam vecí na dva: zoznam, ktorý vidia všetci, a váš vlastný. Všetky, Nezabalené a Hotovo vedľa nich zužujú práve otvorený zoznam. A až Z na konci riadka zobrazí položky každého zoznamu podľa názvu a druhé kliknutie sa vráti k vášmu vlastnému poradiu. Karta priebehu nad tým počíta, čo je zabalené.',
  'help.ctx.trip-lists.bullet.5':
    '„Použiť šablónu“ a „Uložiť ako šablónu“ zoznam naplnia alebo uložia, aby ste ho nemuseli vypisovať. Dve ikony za nimi, „Exportovať“ a „Importovať“, exportujú zoznam na tlač, do PDF alebo do súboru a importujú zoznam. Červené tlačidlo na pravom konci karty s priebehom ukazuje, koľko položiek je odškrtnutých, a odstráni ich.',
  'help.ctx.trip-lists.bullet.6':
    'Úlohy majú vlastný bočný panel: kartu s priebehom, filtre Všetko, Moje úlohy, Po termíne a Hotové, jeden riadok na zoznam a pod nimi Pridať zoznam. Úlohy sú v karte. Jej záhlavie ukazuje názov filtra a poradie, Priorita alebo Termín splnenia. Kliknutím na úlohu ju otvoríte v paneli vpravo. Pridať novú úlohu na lište otvorí dialóg Nová úloha.',
  // packing-categories
  'help.guide.packing-categories.title': 'Zostavenie zoznamu vecí na balenie',
  'help.guide.packing-categories.goal':
    'Rozdeľte veci, ktoré si beriete, do zoznamov, pridajte do nich položky a určte, kto má ktorý zoznam na starosti.',
  'help.guide.packing-categories.step.1':
    'Kliknite na Pridať zoznam na lište nad zoznamami. Otvorí sa malý dialóg. Do jeho hornej časti, kde je „Názov zoznamu (napr. Oblečenie)“, napíšte názov a kliknite na Pridať.',
  'help.guide.packing-categories.step.2':
    'Nový zoznam začína zástupným riadkom, ktorý ukazuje len tri bledé bodky. Kliknite na Pridať položku dole v riadku, napíšte položku do poľa Názov položky... a stlačte Enter: prvá položka nahradí zástupný riadok a pole zostane otvorené pre ďalšiu.',
  'help.guide.packing-categories.step.3':
    'Riadok premenujete kliknutím na jeho názov alebo cez „Premenovať“ v ponuke pod tromi bodkami na jeho pravom konci.',
  'help.guide.packing-categories.step.4':
    'Prerušovaný krúžok s postavičkou v hornom páse zoznamu priradí k zoznamu členov cesty. Vyberte meno. Osobu znova odoberiete kliknutím na štítok, ktorý sa objaví.',
  'help.guide.packing-categories.step.5':
    'Tri bodky vedľa počtu otvoria ďalšie možnosti: Premenovať, Označiť všetko, Odznačiť všetko a Odstrániť zoznam. Odstrániť zoznam vymaže zoznam aj všetky jeho položky bez ďalšej otázky. Šípka úplne vpravo zoznam zbalí.',
  'help.guide.packing-categories.result':
    'Nový zoznam sa zobrazí v mriežke s položkami pod ním a farebnou bodkou a jeho odznak počíta, čo je už zabalené.',
  'help.guide.packing-categories.tip.1':
    'Zoznam existuje iba vďaka svojim položkám. Keď vymažete poslednú položku, z riadka sa stane zástupný riadok, aby si zoznam zachoval pozíciu a farbu. Keď vymažete aj ten, zoznam sa vymaže.',
  'help.guide.packing-categories.tip.2':
    'Keď niekoho priradíte k zoznamu, dostane oznámenie o balení. Nemení to, kto vidí položky. To sa nastavuje v časti Zdieľanie, v ponuke s tromi bodkami pri riadku.',
  'help.guide.packing-categories.tip.3':
    'Dva zoznamy môžu mať rovnaký názov. TREK ich interne rozlišuje, takže názvy zostanú tak, ako ste ich napísali.',
  // check-off-packing
  'help.guide.check-off-packing.title': 'Odškrtávanie vecí pri balení',
  'help.guide.check-off-packing.goal':
    'Odškrtnite, čo už máte v taške, sledujte ukazovateľ priebehu a zabalené položky odstráňte.',
  'help.guide.check-off-packing.step.1':
    'Kliknite na políčko vľavo v riadku. Názov sa prečiarkne a ukazovateľ priebehu sa aktualizuje.',
  'help.guide.check-off-packing.step.2':
    'Karta priebehu nad zoznamami ukazuje, koľko položiek je zabalených zo všetkých položiek zoznamu, ako číslo, ako percento aj ako pruh.',
  'help.guide.check-off-packing.step.3':
    'Celý zoznam označíte naraz cez tri bodky v jeho hlavičke: nájdete tam „Označiť všetko“ a „Odznačiť všetko“.',
  'help.guide.check-off-packing.step.4':
    'Všetky, Otvorené a Hotovo vedľa Zdieľané a Môj zoznam filtrujú mriežku. Otvorené ukáže iba to, čo ešte chýba, takže úplne zabalený zoznam sa skryje.',
  'help.guide.check-off-packing.step.5':
    'Červené tlačidlo Odstrániť … začiarknuté na pravom konci karty priebehu, s počtom zaškrtnutých položiek v ňom, ich všetky naraz vymaže po jednom potvrdení z prehliadača.',
  'help.guide.check-off-packing.result':
    'Zobrazujú sa len otvorené položky a lišta hore ukazuje, koľko z balenia je hotové.',
  'help.guide.check-off-packing.tip.1': 'Aj odškrtnutú položku môžete premenovať: kliknite na jej názov.',
  'help.guide.check-off-packing.tip.2':
    '„Označiť všetko“ a „Odznačiť všetko“ fungujú vždy pre jeden zoznam, cez tri bodky daného zoznamu.',
  'help.guide.check-off-packing.tip.3':
    'Keď sú označené všetky položky, počítadlo nahradí Všetko je zabalené! a ukazovateľ sa zafarbí nazeleno.',
  // apply-packing-template
  'help.guide.apply-packing-template.title': 'Použitie šablóny balenia',
  'help.guide.apply-packing-template.goal':
    'Pridajte do cesty hotový zoznam a zoznam z tejto cesty si uložte na ďalšiu.',
  'help.guide.apply-packing-template.step.1': 'Kliknite na Použiť šablónu na lište nad zoznamom.',
  'help.guide.apply-packing-template.step.2':
    'Vyberte šablónu. Každý riadok uvádza jej názov a počet položiek, ktoré obsahuje.',
  'help.guide.apply-packing-template.step.3':
    'Položky sa pridajú do zobrazenia, v ktorom práve ste: „Zdieľané“ ich pridá do spoločného zoznamu, ktorý vidia všetci, „Môj zoznam“ do vášho vlastného.',
  'help.guide.apply-packing-template.step.4':
    'Ak si chcete zoznam z tejto cesty ponechať na ďalšiu, kliknite na „Uložiť ako šablónu“. Otvorí sa malý dialóg. Do horného poľa s textom „Názov šablóny“ napíšte názov a kliknite na „Uložiť“.',
  'help.guide.apply-packing-template.result':
    'Zoznamy a položky zo šablóny sa pridajú do cesty vedľa toho, čo tam už bolo.',
  'help.guide.apply-packing-template.tip.1':
    'Šablóna skopíruje zoznam, množstvo, hmotnosť a tašku každej položky a vytvorí tašku, ktorú cesta ešte nemá. Odškrtnutia sa nekopírujú a nič, čo už je v zozname, sa neodstráni.',
  'help.guide.apply-packing-template.tip.2':
    'Použiť šablónu sa zobrazí, až keď existuje nejaká šablóna. Bez nej sa tlačidlo vôbec nezobrazí.',
  'help.guide.apply-packing-template.tip.3':
    '„Uložiť ako šablónu“ vidí iba správca inštancie a iba vtedy, keď sú v zozname položky. Uloží spoločné položky a vaše vlastné položky, nikdy nie súkromné položky iného člena.',
  // import-packing-list
  'help.guide.import-packing-list.title': 'Vloženie celého zoznamu na balenie',
  'help.guide.import-packing-list.goal': 'Premeňte zoznam, ktorý už máte inde, na položky balenia naraz.',
  'help.guide.import-packing-list.step.1':
    'Kliknite na „Importovať“, ikonu so šípkou nadol na pravom konci lišty nad zoznamom.',
  'help.guide.import-packing-list.step.2':
    'Jedna položka na riadok: kategória, názov, hmotnosť v g (nepovinné), zavazadlo (nepovinné), checked/unchecked (nepovinné). Sivá ukážka v poli zobrazuje všetky štyri formáty a čísla na jej ľavom okraji počítajú napísané riadky. Funguje aj zoznam v Markdowne: nadpis určí názov zoznamu a z "- [ ]" a "- [x]" sa stanú položky.',
  'help.guide.import-packing-list.step.3':
    'Alebo načítajte riadky zo súboru cez Načítať CSV/TXT/MD vľavo dole v dialógu. Prijme súbor .csv, .txt alebo .md a nahradí všetko, čo je v poli.',
  'help.guide.import-packing-list.step.4':
    'Vpravo dole kliknite na Importovať 3. Číslo na tlačidle udáva počet riadkov, ktorým TREK rozumel.',
  'help.guide.import-packing-list.result':
    'Z každého riadka sa stane položka v zozname, ktorý je uvedený v jeho prvom poli. Položky, ktoré už v zozname boli, sa nezmenia.',
  'help.guide.import-packing-list.tip.1':
    'Polia oddeľujú čiarky, bodkočiarky aj tabulátory a dvojité úvodzovky držia pole pokope, takže „Tričko, modré“ zostane jedným názvom. Riadok s jedinou hodnotou je len názov. Riadok bez vlastného zoznamu skončí v kategórii Ostatné. „3x“ pred názvom nastaví množstvo.',
  'help.guide.import-packing-list.tip.2':
    'Ak cesta ešte nemá tašku uvedenú vo štvrtom poli, TREK ju vytvorí. „Importovať“ a „Použiť šablónu“ sú dva spôsoby, ako pridať hmotnosti a tašky mnohým položkám naraz.',
  // export-packing-list
  'help.guide.export-packing-list.title': 'Tlač alebo export zoznamu vecí na balenie',
  'help.guide.export-packing-list.goal':
    'Vytlačte zoznam, uložte ho ako PDF alebo ho exportujte do súboru pre inú aplikáciu či ďalšiu cestu.',
  'help.guide.export-packing-list.step.1':
    'Kliknite na „Exportovať“, ikonu so šípkou nahor na lište nad zoznamom, hneď pred „Importovať“.',
  'help.guide.export-packing-list.step.2':
    'Kontrolný zoznam v Markdowne (.md) a CSV na import (.csv) uložia zoznam hneď ako súbor.',
  'help.guide.export-packing-list.step.3':
    'Kliknite na Vytlačiť alebo uložiť ako PDF. Náhľad zobrazí zoznam ako stranu: navrchu cestu, jej dátumy a koľko je zabalené, potom každý zoznam ako kartu, každú položku s políčkom na zaškrtnutie.',
  'help.guide.export-packing-list.step.4':
    'Pod náhľadom kliknite na „Vytlačiť alebo uložiť ako PDF“. Prehliadač otvorí dialóg tlače: vyberte tlačiareň, alebo „Uložiť ako PDF“, ak chcete súbor uložiť.',
  'help.guide.export-packing-list.result':
    'Výtlačok aj súbory obsahujú zobrazenie, ktoré je otvorené, Zdieľané alebo Môj zoznam, s množstvami, hmotnosťami a zaškrtnutiami.',
  'help.guide.export-packing-list.tip.1':
    'CSV je formát, ktorý číta Importovať, vrátane batožín, takže ho môžete použiť ako vlastnú šablónu balenia: importujte ho do ďalšej cesty.',
  'help.guide.export-packing-list.tip.2':
    'Súbor Markdown sa v Obsidiane, Notione alebo na GitHube otvorí ako kontrolný zoznam a cez „Importovať“ ho môžete znova načítať.',
  // share-packing-item
  'help.guide.share-packing-item.title': 'Kto položku vidí a kto ju prinesie',
  'help.guide.share-packing-item.goal':
    'Presúvajte položku medzi spoločným fondom skupiny, vlastným zoznamom a ľuďmi, pre ktorých ju beriete.',
  'help.guide.share-packing-item.step.1':
    'Nad zoznamami je Zdieľané zoznam, ktorý vidia všetci, a Môj zoznam je váš vlastný. Pri oboch je počet položiek. Kliknutím na Môj zoznam si pozriete svoj.',
  'help.guide.share-packing-item.step.2':
    'Vráťte sa do časti „Zdieľané“, otvorte tri bodky na konci riadka a kliknite na „Zdieľanie“.',
  'help.guide.share-packing-item.step.3':
    'Sú tri úrovne: Zdieľané, viditeľné pre všetkých v skupine, Osobné, ktoré vidíte iba vy, a Zdieľať s…, kde vyberiete ľudí, pre ktorých je položka určená.',
  'help.guide.share-packing-item.step.4':
    'Osobná položka je len v Môj zoznam. Ak ju chcete nájsť, prepnite na Môj zoznam.',
  'help.guide.share-packing-item.step.5':
    'Znova otvorte „Zdieľanie“ a v časti „Zdieľať s…“ zaškrtnite meno. Položka sa zobrazí aj v zozname tejto osoby a riadok dostane malý odznak s počtom ľudí, s ktorými ju zdieľate.',
  'help.guide.share-packing-item.result': 'Položka je v úrovni, ktorú ste vybrali, a v riadku vidíte, kto ju prinesie.',
  'help.guide.share-packing-item.tip.1':
    'Zdieľanie položky môže meniť len človek, ktorý ju berie so sebou. Ten, s kým ste ju zdieľali, ju vidí vo svojom Môj zoznam s malým odznakom ruky, ktorý po ukázaní naň zobrazí vaše meno. Môže ju odškrtnúť.',
  'help.guide.share-packing-item.tip.2':
    'Pri zdieľanej položke, ktorú berie niekto iný, ponúka ponuka s tromi bodkami namiesto Zdieľanie dve iné položky: Môžem to vziať tiež, ktorá vás pridá vedľa neho, a Kopírovať do môjho zoznamu, ktorá vytvorí súkromnú kópiu pre vás.',
  'help.guide.share-packing-item.tip.3':
    'Nové položky preberajú zdieľanie z pohľadu, v ktorom ich pridáte. Položky pridané v Zdieľané sú zdieľané so všetkými. Položky pridané v Môj zoznam sú Osobné, pokiaľ nie je každá položka toho zoznamu zdieľaná s tými istými ľuďmi: vtedy sa nová položka zdieľa aj s nimi.',
  // packing-bags
  'help.guide.packing-bags.title': 'Zvážiť batožinu',
  'help.guide.packing-bags.goal':
    'Pridajte ku každej položke hmotnosť, roztrieďte položky do batožín a udržte každú batožinu pod limitom leteckej spoločnosti.',
  'help.guide.packing-bags.step.1': 'Kliknite na odznak hmotnosti pred krúžkom a zadajte hmotnosť položky v gramoch.',
  'help.guide.packing-bags.step.2': 'Krúžok za hmotnosťou označuje batožinu, do ktorej položka patrí. Kliknite naň.',
  'help.guide.packing-bags.step.3':
    'Ak ešte nemáte žiadne zavazadlo, kliknite na „Pridať zavazadlo“, napíšte názov a stlačte Enter. Zavazadlo sa vytvorí a položka sa doň vloží.',
  'help.guide.packing-bags.step.4':
    'Karta Zavazadlá sa zobrazí vpravo od zoznamov, hneď ako existuje aspoň jedna taška. Každá taška ukazuje názov, kto ju nesie, pruh naplnenia, koľko položiek v nej je a jej hmotnosť. Pod taškami nasledujú Nepriradené a Celková hmotnosť, pod ňou Zabalené: už zabalená hmotnosť a tenký pruh s jej podielom.',
  'help.guide.packing-bags.step.5':
    'Kliknite na Nastaviť limit vedľa hmotnosti tašky a zadajte limit v kilogramoch, tak ako ho uvádzajú letecké spoločnosti.',
  'help.guide.packing-bags.step.6':
    'Prerušované plus na konci riadka s názvom tašky, tesne pred krížikom, otvorí Priradiť členov. Zaškrtnite členov, ktorí tašku nesú: zobrazia sa vedľa plusu a Na osobu dole na karte ukazuje, čo každý z nich nesie.',
  'help.guide.packing-bags.result':
    'Karta „Zavazadlá“ vpravo ukazuje hmotnosť každej batožiny oproti jej limitu, čo nie je v žiadnej batožine, čo nesie ktorá osoba a celkovú hmotnosť spolu s tým, koľko je už zbalené.',
  'help.guide.packing-bags.tip.1':
    'Pole hmotnosti, krúžok tašky a karta Zavazadlá existujú len vtedy, keď má správca zapnuté Sledovanie batožiny v doplnku Zoznamy. V užšom okne sa tašky otvárajú tlačidlom Zavazadlá nad kartou priebehu.',
  'help.guide.packing-bags.tip.2':
    'Server počíta hmotnosť zavazadla z položiek všetkých členov vrátane tých, ktoré nevidíte, takže číslo zodpovedá skutočnej hmotnosti zavazadla.',
  'help.guide.packing-bags.tip.3':
    'Batožina bez limitu sa porovnáva s najťažšou batožinou, aby sa dali porovnať pruhy. Ak batožine nastavíte limit, jej pruh sa meria voči tomuto limitu.',
  // create-todo
  'help.guide.create-todo.title': 'Pridanie úlohy',
  'help.guide.create-todo.goal': 'Zapíšte si úlohu aj so zoznamom, prioritou, dátumom a zodpovednou osobou.',
  'help.guide.create-todo.step.1': 'Na pravom konci lišty kliknite na „Pridať novú úlohu“.',
  'help.guide.create-todo.step.2':
    'Otvorí sa dialóg Nová úloha s kurzorom v záhlaví. Zadajte názov do poľa Názov úlohy a všetko, čo si chcete zapamätať, pridajte do Popis.',
  'help.guide.create-todo.step.3':
    'Zoznam úlohu zaraďuje do skupiny. Vyberte jeden, alebo cez plus vedľa neho pomenujte nový v malom dialógu.',
  'help.guide.create-todo.step.4': '„Priorita“ má štyri tlačidlá: Žiadne, P1, P2 a P3, od červenej po modrú.',
  'help.guide.create-todo.step.5': 'Termín splnenia vedľa Zoznam otvorí kalendár a Priradené priradí úlohu osobe.',
  'help.guide.create-todo.step.6': 'Kliknite na Vytvoriť úlohu.',
  'help.guide.create-todo.result':
    'Úloha je v zozname s prioritou, termínom a zoznamom v podobe štítkov a s avatarom zodpovednej osoby na konci riadka. Zároveň sa otvorí v paneli vpravo.',
  'help.guide.create-todo.tip.1': 'Povinný je len názov. Všetko ostatné doplníte neskôr v paneli vpravo.',
  'help.guide.create-todo.tip.2': 'Ak je na bočnom paneli vybraný zoznam, nová úloha sa vytvorí v ňom.',
  'help.guide.create-todo.tip.3': 'Enter v poli názvu vytvorí úlohu okamžite, bez vyplnenia ostatných polí.',
  // todo-filters
  'help.guide.todo-filters.title': 'Nájsť a zmeniť úlohu',
  'help.guide.todo-filters.goal':
    'Zobrazte iba úlohy, na ktorých práve záleží, a potom upravte úlohu, ktorú ste našli.',
  'help.guide.todo-filters.step.1':
    'Úlohy na bočnom paneli: Všetky ukáže všetko, čo je ešte otvorené, Moje úlohy to, čo je priradené vám, Po termíne úlohy s dátumom v minulosti a Hotovo dokončené úlohy. Pri každej je uvedený počet. Kliknite na Po termíne.',
  'help.guide.todo-filters.step.2':
    'V časti „Zoznamy“ má každý zoznam svoj riadok. Výberom zobrazíte daný zoznam vrátane dokončených úloh.',
  'help.guide.todo-filters.step.3':
    'Zoradenie v hornej časti zoznamu mení poradie toho, čo vidíte: „Priorita“ dá na začiatok P1, „Termín splnenia“ najbližší termín. Naraz môžete použiť len jedno z nich a druhým kliknutím sa vrátite k vlastnému poradiu.',
  'help.guide.todo-filters.step.4': 'Kliknutím na úlohu ju otvoríte v paneli vpravo.',
  'help.guide.todo-filters.step.5':
    'Zmeňte, čo potrebujete: názov, Priorita, Zoznam, Termín splnenia alebo Priradené. Popis zobrazuje text s funkčnými odkazmi, kliknutím doň ho upravíte. Potom kliknite dole na paneli na Uložiť zmeny. Políčko v hlavičke panela označí úlohu ako hotovú a Vymazať vedľa Uložiť zmeny ju vymaže okamžite.',
  'help.guide.todo-filters.result':
    'Zoznam ukazuje len úlohy, ktoré ste chceli vidieť, a panel vpravo upravuje tú, ktorú ste vybrali.',
  'help.guide.todo-filters.tip.1':
    'Riadok zoznamu počíta iba otvorené úlohy, keď ho však vyberiete, zobrazia sa aj dokončené. „Všetky“, „Moje úlohy“ a „Po termíne“ dokončené úlohy skrývajú, „Hotovo“ zobrazuje iba dokončené.',
  'help.guide.todo-filters.tip.2':
    'Priorita a Termín splnenia v zoradení sa nedajú použiť naraz. Kým je zapnuté niektoré z nich, nemôžete presúvaním riadkov usporiadať vlastné poradie.',

  // ── Screen: trip-costs ────────────────────────────────────────────────────────────────
  'help.ctx.trip-costs.title': 'Náklady',
  'help.ctx.trip-costs.summary':
    'Financie cesty: všetky výdavky v prehľade podľa dátumu alebo v tabuľke, kto ich zadal a kto za ne dlhuje, v mene z účtenky. V pravom stĺpci vidíte, kto má komu koľko zaplatiť, aby ste boli vyrovnaní.',
  'help.ctx.trip-costs.bullet.1':
    'Na lište hore sú dátumy cesty a cestujúci, medzi ktorých sa náklady delia. Nájdete tu aj „Hľadať výdavky…“, filter (lievik), „Exportovať CSV“ (ikona sťahovania) a prepínač „Zoznam“ / „Tabuľka“.',
  'help.ctx.trip-costs.bullet.2':
    'Na jej pravom konci Vyrovnať zaznamená všetky otvorené prevody naraz, Naskenovať účtenku vyplní výdavok z fotky, ak doplnok Analýza pomocou AI vie čítať obrázky, a Pridať výdavok otvorí editor.',
  'help.ctx.trip-costs.bullet.3':
    'Pod lištou sú štyri karty: Dlhujete a Dlhujú vám sú vaša strana vyrovnania, Nevyriešená suma je to, čo je zaznamenané, ale zatiaľ nemá platiteľa, a Celkové výdavky na cestu všetko sčíta, pričom pod ním sú Váš podiel a Zaplatili ste.',
  'help.ctx.trip-costs.bullet.4':
    'Kniha výdavkov je zoskupená podľa dní, od najnovšieho, a v záhlaví každého dňa je počet záznamov a koľko sa v ten deň minulo. Riadok ukazuje kategóriu ako farebnú záložku, názov, čipy platiteľov s tým, čo každý zaplatil, a pod nimi Rozdeliť s podielom každého cestujúceho (začiarknutie označuje, kto svoj podiel zaplatil), potom poznámku a sumu, a ešte „požičali ste“ alebo „ste si požičali“, ak z rozdelenia vyplýva, že vám ostatní dlhujú peniaze alebo vy dlžíte.',
  'help.ctx.trip-costs.bullet.5':
    'V pravom stĺpci sú výsledky: „Vyrovnať“ uvádza, kto komu platí, „Zostatky“ ukazujú preplatok alebo nedoplatok každého cestujúceho, „Konečný rozpočet“ ukazuje, koľko cesta stojí každého z nich, a „Podľa kategórie“, za čo sa minuli peniaze.',
  'help.ctx.trip-costs.bullet.6':
    'Zaznamenaná platba je v tom istom prehľade ako samostatný riadok, vedľa nej je ceruzka a „Vrátiť späť“. Výdavok má ceruzku a kôš, a kôš sa pred vymazaním výdavku opýta. Výdavok s účtenkami má vedľa názvu štítok „Účtenka“, ktorý ich otvorí.',
  'help.ctx.trip-costs.bullet.7':
    'Tabuľka na lište zobrazí tie isté výdavky ako hárok zoskupený podľa kategórie, so stĺpcami Osoby a Dní a sumou na osobu a na deň. Súhrn potom nahradí Podľa kategórie. Náklady si pamätajú zobrazenie, ktoré ste vybrali.',
  // add-expense
  'help.guide.add-expense.title': 'Pridanie výdavku',
  'help.guide.add-expense.goal': 'Zapíšte si, koľko niečo stálo, kto to zaplatil a s kým sa náklady delia.',
  'help.guide.add-expense.step.1':
    'Na pravom konci lišty kliknite na „Pridať výdavok“. Otvorí sa editor s dnešným dátumom, vami ako platiteľom a so všetkými už zahrnutými v rozdelení.',
  'help.guide.add-expense.step.2':
    'Do poľa navrchu dialógu napíšte, na čo výdavok bol. Kým je prázdne, ukazuje napr. večera, suveníry, benzín…. Toto je názov výdavku a bez neho sa výdavok nedá uložiť.',
  'help.guide.add-expense.step.3':
    'Pilulka pod názvom je Kategória, Jedlo a pitie, kým nevyberiete inú. Je ich štrnásť a nedajú sa meniť. Záhlavie prevezme farbu vybranej kategórie, rovnako aj záložka na riadku a jej pruh v Podľa kategórie.',
  'help.guide.add-expense.step.4':
    'Sumu z účtenky zadajte do poľa „Celková suma“. „Mena“ vedľa neho je najprv nastavená na menu, v ktorej sa zobrazujú Náklady. Ak ju zmeníte, editor ukáže prepočítanú sumu. „Deň“ je najprv nastavený na dnešok a v zozname sa výdavok zaradí pod tento deň.',
  'help.guide.add-expense.step.5':
    'V časti Kto zaplatil? kliknite na osobu, ktorá skutočne zaplatila. Predvolene je vybraté Vy. Zatiaľ nikto nezaplatil zaznamená sumu bez toho, aby ju niekto dlhoval, a Platilo viacero ľudí v prepínači vedľa nadpisu rozdelí účet medzi viacerých platiteľov.',
  'help.guide.add-expense.step.6':
    'Rozdeliť nižšie začína na Rovnakým dielom, so všetkými zaškrtnutými a s podielom vedľa každého mena. Nechajte to tak alebo to zmeňte. Uložíte kliknutím na Pridať výdavok v dolnej časti dialógu.',
  'help.guide.add-expense.result':
    'Výdavok je v prehľade pod svojím dňom, je započítaný do „Celkové výdavky na cestu“ a stĺpec vyrovnania znova prepočítal, kto komu dlhuje.',
  'help.guide.add-expense.tip.1':
    'Ak predvolené hodnoty nezmeníte, výdavok bude mať dnešný dátum, zaplatíte ho vy a rozdelí sa rovnakým dielom medzi všetkých. Vyplniť treba len názov a sumu.',
  'help.guide.add-expense.tip.2':
    'Tlačidlo ± vedľa sumy zmení výdavok na vrátenie peňazí. Záporný súčet znamená, že sa peniaze vracajú, a rozdelenie sa obráti.',
  'help.guide.add-expense.tip.3':
    'Priložiť vedľa Účtenky a faktúry dole v dialógu berie obrázky a PDF. Nahrajú sa pri uložení, uložia sa do súborov cesty a vedľa názvu v zozname sa zobrazí štítok Účtenka.',
  // expense-payers
  'help.guide.expense-payers.title': 'Určenie, kto zaplatil',
  'help.guide.expense-payers.goal': 'Zaznamenajte, kto výdavok zaplatil: to je druhá polovica výpočtu vyrovnania.',
  'help.guide.expense-payers.step.1':
    'Otvorte výdavok ceruzkou vedľa jeho riadka a pozrite sa na Kto zaplatil?. Predvolene je v prepínači vedľa nadpisu Platil jeden človek: každý cestujúci je čip a čip s obrysom je osoba, ktorá zaplatila. Kliknutím na iný čip to zmeníte.',
  'help.guide.expense-payers.step.2':
    'Zatiaľ nikto nezaplatil, čip s prerušovaným okrajom za cestujúcimi, zaznamená sumu bez toho, aby niekto niečo dlhoval. Výdavok sa aj tak započíta do Celkové výdavky na cestu.',
  'help.guide.expense-payers.step.3':
    'Druhá možnosť prepínača, „Platilo viacero ľudí“, zobrazí všetkých cestujúcich s políčkom na zaškrtnutie a každý zaškrtnutý dostane pole na sumu. Zaškrtnite tých, ktorí platili, a zadajte, koľko zaplatil každý z nich. Sumy musia dať dokopy celkovú sumu.',
  'help.guide.expense-payers.step.4':
    'Výdavok, ktorý nikto nezaplatil, je vo svojom riadku označený ako „Nedokončené“ a započíta sa do karty „Nevyriešená suma“, ktorá sčítava výdavky ešte bez platiteľa.',
  'help.guide.expense-payers.result':
    'Kto platil, určuje, komu sa peniaze vrátia, rozdelenie určuje, kto platí, a Zostatky sú rozdiel medzi nimi.',
  'help.guide.expense-payers.tip.1':
    'Kto zaplatil? a Rozdeliť sú nezávislé: môžete zaplatiť večeru, na ktorej ste neboli, a byť zahrnutí do rozdelenia výdavku, ktorý ste neplatili.',
  'help.guide.expense-payers.tip.2':
    'Pri viacerých platiteľoch musí súčet súm dať celkovú sumu. Keď zaškrtnete ďalšieho platiteľa, zvyšok sa znova rozdelí medzi sumy, ktoré ste nezadali sami. Kým sumy nesedia, editor ukazuje, akú celkovú sumu musia dať, a neuloží sa.',
  'help.guide.expense-payers.tip.3':
    'Ak výdavok nastavíte späť na Zatiaľ nikto nezaplatil, neodstráni sa: suma zostane v Celkové výdavky na cestu a riadok sa zmení na Nedokončené.',
  // split-expense
  'help.guide.split-expense.title': 'Rozdelenie účtu medzi cestujúcich',
  'help.guide.split-expense.goal':
    'Určte, kto za výdavok dlhuje: všetci rovnakým dielom, podľa súm alebo podľa jednotlivých položiek z účtenky.',
  'help.guide.split-expense.step.1':
    'V editore výdavku „Rozdeliť“ zobrazuje všetkých cestujúcich s políčkom na zaškrtnutie. Ak niekoho z výdavku vynecháte zrušením zaškrtnutia, jeho meno zosivie, stratí podiel a za tento výdavok nič nedlhuje.',
  'help.guide.split-expense.step.2':
    'Rovnakým dielom v prepínači vedľa nadpisu je predvolené nastavenie: každý zaškrtnutý cestujúci dostane rovnaký podiel, zobrazený vedľa mena. Odznaky pod zoznamom ukazujú, koľko ľudí sa delí a aký veľký je každý podiel.',
  'help.guide.split-expense.step.3':
    'Vlastné nahradí podiely poľami na sumy. Zadajte, koľko dlhuje každý cestujúci. Značka pod nimi sa pri písaní aktualizuje a zozelenie s Rozdelenie sedí s celkom. Kým sumy nesedia s celkom, uložiť sa nedá.',
  'help.guide.split-expense.step.4':
    '„Účtenka“ rozdelí účet po riadkoch: „Pridať položku“, potom názov a cena pre každý riadok a vedľa „Delí sa medzi:“ cestujúci, ktorí sa o riadok delia.',
  'help.guide.split-expense.step.5':
    'Podiel každého pod riadkami ukazuje, koľko každý cestujúci nakoniec dlhuje, a Celková suma hore je súčet riadkov. Kliknite na Uložiť v dolnej časti dialógu.',
  'help.guide.split-expense.result':
    'Všetky zostatky sa počítajú z rozdelenia. Rozdelenie sa uloží s výdavkom, v jeho riadku sa zobrazí ako Rozdeliť s podielom každého cestujúceho a neskôr ho možno zmeniť bez zásahu do čohokoľvek iného.',
  'help.guide.split-expense.tip.1':
    'Cestujúci, ktorému zrušíte zaškrtnutie, za tento jeden výdavok nič nedlhuje. Ostatní zaplatia svoj podiel.',
  'help.guide.split-expense.tip.2':
    '„Rovnakým dielom“ delí presne na centy: zvyšný cent pripadne pri každom výdavku niekomu inému, aby ho neplatil vždy ten istý človek.',
  'help.guide.split-expense.tip.3':
    'Režim „Účtenka“ vypočíta „Celková suma“ sám a pole zosivie: celková suma je súčet riadkov účtenky.',
  'help.guide.split-expense.tip.4':
    'Vlastné rozdelenie môžete zadať aj v percentách: prepnite Zadávať podiely ako na % a podiely musia dať spolu 100 %, inak sa výdavok neuloží.',
  // expense-currency
  'help.guide.expense-currency.title': 'Zadanie výdavku v inej mene',
  'help.guide.expense-currency.goal': 'Zadajte sumu z účtenky a TREK uloží výmenný kurz.',
  'help.guide.expense-currency.step.1':
    'Otvorte Pridať výdavok. Hore v dialógu napíšte názov a do Celková suma zadajte sumu presne tak, ako je na bloku, nie prepočítanú.',
  'help.guide.expense-currency.step.2':
    'Otvorte Mena vedľa sumy a vyberte menu z účtenky. Zoznam obsahuje každý kód, ktorý TREK pozná, a dá sa v ňom hľadať: napíšte tri písmená.',
  'help.guide.expense-currency.step.3':
    'Pod poľami sa objaví rad štítkov: zadaná suma a jej aktuálna hodnota, označená ako „aktuálny kurz“. Je to len náhľad, nie hodnota, ktorá sa uloží.',
  'help.guide.expense-currency.step.4':
    'V spodnej časti dialógu kliknite na „Pridať výdavok“. Kurz sa v tej chvíli zafixuje: výdavok si ponechá hodnotu z dňa, keď ste ho zadali.',
  'help.guide.expense-currency.step.5':
    'V zozname výdavkov riadok pod názvom ukazuje obe sumy: to, čo ste zadali, šípku a sumu v mene cesty. Všetky súčty, zostatky a vyrovnania v záložke Náklady vychádzajú z druhej sumy.',
  'help.guide.expense-currency.result':
    'Výdavok si zachová sumu a menu, ktoré ste zadali. Zoznam výdavkov zobrazuje obe a súčty a zostatky cesty sa počítajú v mene cesty.',
  'help.guide.expense-currency.tip.1':
    'Kurz sa zafixuje pri uložení, takže vyrovnaný dlh sa nezmení, ani keď sa kurz o týždeň zmení. Nový kurz sa uloží iba vtedy, keď zmeníte menu výdavku.',
  'help.guide.expense-currency.tip.2':
    'Zobrazovaná mena v Nastaveniach mení iba spôsob zobrazenia súm. Uložené sumy sa nikdy nezmenia. Ak je prázdna, každá cesta sa zobrazuje vo svojej vlastnej mene.',
  'help.guide.expense-currency.tip.3':
    'Mena cesty sa nastavuje pri samotnej ceste, v časti Upraviť cestu, a vyžaduje oprávnenie Upraviť detaily výletu. Ak ju zmeníte, všetky zmrazené kurzy sa prepočítajú na novú menu. Samotné sumy sa neprevádzajú.',
  // filter-costs
  'help.guide.filter-costs.title': 'Vyhľadanie výdavku alebo výdavkov jedného dňa',
  'help.guide.filter-costs.goal': 'Vyfiltrujte z dlhého zoznamu výdavkov len to, čo hľadáte.',
  'help.guide.filter-costs.step.1':
    'Píšte do poľa Hľadať výdavky… na lište. Hľadá podľa názvu výdavku už počas písania a Esc ho znova vymaže.',
  'help.guide.filter-costs.step.2':
    'Filter, lievik vedľa vyhľadávania, otvorí filtre. Prepínač navrchu je váš vlastný pohľad na zoznam výdavkov: Všetko, Zaplatené mnou pre to, čo ste platili vy, a Dlhujú mi pre výdavky, kde ste zaplatili viac, než je váš podiel.',
  'help.guide.filter-costs.step.3':
    'V časti „Kategória“ vyberte jednu zo štrnástich kategórií a zobrazia sa iba výdavky tejto kategórie. Lievik ukazuje, koľko filtrov je zapnutých.',
  'help.guide.filter-costs.step.4':
    'V časti Deň vyberte jeden z dní s výdavkami. Pruh nahradí hlavičky dní a ukáže tento deň celý, počet jeho výdavkov a jeho súčet.',
  'help.guide.filter-costs.step.5':
    'Exportovať CSV, ikona sťahovania vedľa lievika, uloží všetky výdavky do súboru s pôvodnou sumou, jej menou a prepočítanou sumou.',
  'help.guide.filter-costs.result':
    'Filtre môžete kombinovať a skupiny dní sa aktualizujú s vlastnými súčtami za zostávajúce výdavky.',
  'help.guide.filter-costs.tip.1':
    'Zaznamenané platby nemajú názov ani kategóriu, preto ich vyhľadávanie alebo filter kategórie skryje, rovnako ako Dlhujú mi. Filter dňa ich ponechá, a to v dni, v ktorom platba prebehla.',
  'help.guide.filter-costs.tip.2':
    '„Exportovať CSV“ vždy exportuje všetky výdavky bez ohľadu na filter na obrazovke, každý výdavok ako jeden riadok.',
  'help.guide.filter-costs.tip.3':
    'Zrušiť filtre dole v ponuke filtrov, keď je zapnutý nejaký filter, vypne všetky naraz.',
  // settle-up
  'help.guide.settle-up.title': 'Zistenie, kto komu dlhuje, a vyrovnanie dlhov',
  'help.guide.settle-up.goal':
    'Premeňte množstvo spoločných výdavkov na čo najmenej prevodov, ktoré vyrovnajú všetky dlhy, a zaznamenajte prevody, keď prebehnú.',
  'help.guide.settle-up.step.1':
    'Karta Vyrovnať v pravom stĺpci uvádza prevody, ktoré by vyrovnali všetky dlhy: kto platí komu, zobrazené ako dva avatary s menami v popise, a koľko. Číslo v jej hlavičke ukazuje, koľko ich je ešte otvorených.',
  'help.guide.settle-up.step.2':
    'Vyrovnať vedľa prevodu ho zaznamená ako vykonaný. Prevod z karty zmizne a zostatky sa aktualizujú.',
  'help.guide.settle-up.step.3':
    'Zaznamenaný prevod je v prehľade ako riadok pod dňom, keď sa uskutočnil, označený ako „Platba“ s oboma cestujúcimi a sumou.',
  'help.guide.settle-up.step.4':
    'Ceruzkou vedľa tohto riadka platbu opravíte a tlačidlom „Vrátiť späť“ ju zrušíte. Prevod sa potom vráti na kartu „Vyrovnať“.',
  'help.guide.settle-up.step.5':
    'Pridať platbu v záhlaví karty zaznamená prevod, ktorý nevychádzal z návrhu. Vyberte Od a Do, sumu, jej menu a deň, kedy prevod prebehol, podľa potreby pridajte Poznámka, napríklad ako sa platilo, a dole v dialógu kliknite na Pridať platbu.',
  'help.guide.settle-up.step.6':
    'Vyrovnať na lište navrchu zaznamená všetky otvorené prevody naraz, bez opýtania, napríklad keď skupina na konci cesty vyrovnáva všetky dlhy.',
  'help.guide.settle-up.result':
    'Každý zaznamenaný prevod je riadok v zozname výdavkov a odoberie jeden riadok z karty Vyrovnať. Keď karta ukazuje Všetci sú vyrovnaní, cesta je úplne zaplatená.',
  'help.guide.settle-up.tip.1':
    'Karta ukazuje čo najmenej prevodov, nie každý dlh: ak si traja ľudia dlhujú navzájom do kruhu, zredukuje sa to na jednu alebo dve platby.',
  'help.guide.settle-up.tip.2':
    'Vyrovnať iba zaznamená prevod. Peniaze neposiela. Zaplaťte svojím obvyklým spôsobom platby a potom kliknite na Vyrovnať.',
  'help.guide.settle-up.tip.3':
    'Platbu možno uskutočniť v ľubovoľnej mene, takže splatiť dlh v jenoch eurami je bežné: dialóg má vlastný výber meny a zmrazí aj tento kurz.',
  // final-budget
  'help.guide.final-budget.title': 'Koľko cesta stála jednotlivých cestujúcich',
  'help.guide.final-budget.goal': 'Pozrite si čísla za každú osobu: dnešný zostatok a skutočné náklady na osobu.',
  'help.guide.final-budget.step.1':
    'Zostatky ukazujú pozíciu každého cestujúceho: zelený pruh doprava, ak mu cesta dlhuje, červený pruh doľava, ak dlhuje on, a sumu vedľa mena.',
  'help.guide.final-budget.step.2':
    'Konečný rozpočet pod ním odpovedá na inú otázku: nie kto komu práve dlhuje, ale koľko cesta stojí každého cestujúceho po tom, ako sa všetko vyrovná.',
  'help.guide.final-budget.step.3':
    'Kliknutím na meno zobrazíte výpočet: „Zaplatené výdavky“ a pod tým „Náhrady netto“ a „Nevyriešené náhrady“.',
  'help.guide.final-budget.step.4':
    'Pod tromi riadkami je pod menom každého cestujúceho zoznam riadkov, z ktorých sa daný riadok skladá: výdavky, ktoré tento cestujúci zaplatil, už zaznamenané prevody a prevody, ktoré sú ešte otvorené. Každý zoznam sa sčíta presne na riadok s rovnakým názvom.',
  'help.guide.final-budget.result':
    'Zostatky ukazujú, komu sa dnes dlhuje a kto dlhuje. Konečný rozpočet ukazuje, koľko cesta stojí každého z vás, keď sa všetko vyrovná.',
  'help.guide.final-budget.tip.1':
    'Zaznamenanie platby nikomu nezmení konečný rozpočet. Len presunie sumu z čakajúcich náhrad do čistých náhrad.',
  'help.guide.final-budget.tip.2':
    'Výdavok bez platiteľa sa nezapočítava do žiadnej z oboch kariet, rovnako ako ani do návrhov na vyrovnanie.',
  // expense-from-booking
  'help.guide.expense-from-booking.title': 'Premena rezervácie na výdavok',
  'help.guide.expense-from-booking.goal':
    'Priraďte skutočnú cenu letu, hotela alebo miesta k záznamu, ku ktorému patrí.',
  'help.guide.expense-from-booking.step.1':
    'Nájdite rezerváciu na karte Doprava alebo Rezervácie a kliknite na ceruzku navrchu jej karty.',
  'help.guide.expense-from-booking.step.2':
    'Posuňte sa k časti Náklady na konci formulára. Nájdete tam „Vytvoriť výdavok“, ktoré najprv uloží rezerváciu, a „Prepojiť existujúci výdavok“ pre výdavok, ktorý už v Nákladoch je.',
  'help.guide.expense-from-booking.step.3':
    'Kliknite na Vytvoriť výdavok. Rezervácia sa uloží, formulár sa zatvorí a otvorí sa editor Náklady s názvom rezervácie ako názvom, jej typom priradeným ku kategórii a dňom rezervácie ako dňom výdavku.',
  'help.guide.expense-from-booking.step.4':
    'Vyplňte sumu a jej menu, kto zaplatil a rozdelenie ako pri každom výdavku a kliknite na Pridať výdavok. Keď rezerváciu otvoríte znova, výdavok je v časti Prepojené výdavky, s ceruzkou na úpravu, Odpojiť, výdavok ponechať na odstránenie prepojenia bez zmazania výdavku a košom na jeho vymazanie.',
  'help.guide.expense-from-booking.result':
    'Rezervácia ukazuje svoju cenu a výdavok je bežný riadok na záložke Náklady, s platiteľom, rozdelením a menou ako každý iný.',
  'help.guide.expense-from-booking.tip.1':
    'Vymazanie rezervácie vymaže aj jej prepojené výdavky a potvrdzovacia otázka vás na to upozorní. Odstrániť výdavok v bloku Náklady rezervácie robí opak: výdavok vymaže a rezerváciu ponechá. Odpojiť, výdavok ponechať ponechá oboje.',
  'help.guide.expense-from-booking.tip.2':
    'Rovnakú časť má aj formulár miesta, pričom „Vytvoriť výdavok“ najprv uloží miesto.',
  // costs-table
  'help.guide.costs-table.title': 'Plánovanie nákladov v tabuľke',
  'help.guide.costs-table.goal':
    'Čítajte a upravujte výdavky ako tabuľku, zoradenú podľa kategórie a prepočítanú na osobu a na deň.',
  'help.guide.costs-table.step.1':
    'Kliknite na Tabuľka, druhú ikonu prepínača Zoznam / Tabuľka na lište. Zoznam výdavkov nahradí tabuľka s tými istými výdavkami a platí pre ňu aj vyhľadávanie a filtre.',
  'help.guide.costs-table.step.2':
    'Tabuľka je zoskupená podľa kategórií. Záhlavie každej skupiny ukazuje jej názov, počet výdavkov a medzisúčet; kliknutím naň skupinu zbalíte. Stĺpce sú Názov, Dátum, Spolu, Osoby a Dní, za nimi na sivom pozadí z nich vypočítané Na osobu, Za deň a Os. / deň. Riadok Spolu dole všetko sčíta.',
  'help.guide.costs-table.step.3':
    'Kliknutím na bunku ju upravíte priamo: názov, celkovú sumu, „Osoby“ alebo „Dní“. Napíšte hodnotu a uložte ju klávesom Enter alebo kliknutím inam, prípadne ju zrušte klávesom Esc. Pri dátume sa otvorí kalendár. „Na osobu“ a ostatné vypočítané stĺpce sa hneď prepočítajú.',
  'help.guide.costs-table.step.4':
    'Súčet so zámkom sa tu nedá zmeniť: niekto ho zaplatil alebo bol zadaný v inej mene, a jeho popis hovorí, ktorý z týchto prípadov platí. Kliknutím naň sa namiesto toho otvorí výdavok, aby zostatky a pevný výmenný kurz zostali správne.',
  'help.guide.costs-table.step.5':
    'Pridať výdavok na konci kategórie pridá do nej riadok s názvom Nová položka, s dátumom najnovšej položky v nej. Pole názvu je už otvorené, aby ste ho mohli zmeniť. Súčet zadáte rovnako.',
  'help.guide.costs-table.step.6':
    'V tomto zobrazení je v pravom stĺpci „Súhrn“ namiesto „Podľa kategórie“. Sčítava výdavky štyrmi spôsobmi: „Kategória“, „Deň“, „Platiteľ“ (nezaplatené sú pod „Zatiaľ bez platiteľa“) a „Stav“, teda „Zaplatené“ oproti „Nezaplatené“.',
  'help.guide.costs-table.result':
    'Každý výdavok je vo svojej kategórii so sumou na osobu a na deň. Keď zmeníte sumu v bunke, karty nad tabuľkou aj „Súhrn“ sa hneď aktualizujú.',
  'help.guide.costs-table.tip.1':
    'Náklady si zobrazenie pamätajú v tomto prehliadači: otvoria sa v tabuľke, kým znova nekliknete na Zoznam.',
  'help.guide.costs-table.tip.2':
    'Výdavok rozdelený spôsobom Vlastné alebo Účtenka nemá jeden podiel na osobu, preto jeho Na osobu a Os. / deň zostanú prázdne.',
  'help.guide.costs-table.tip.3':
    'Platiteľov, rozdelenie, poznámku a účtenky upravíte priamo vo výdavku: „Ďalšie možnosti“ na konci riadka ponúkajú „Upraviť“ a „Vymazať“, ktorým riadok odstránite.',

  // ── Screen: trip-files ────────────────────────────────────────────────────────────────
  'help.ctx.trip-files.title': 'Súbory',
  'help.ctx.trip-files.summary':
    'Všetky dokumenty cesty v jednom zozname: lístky, potvrdenia, preukazy a obrázky. Každý má poznámku, prepojenie na miesto alebo rezerváciu, ku ktorej patrí, a kôš, z ktorého ho môžete obnoviť.',
  'help.ctx.trip-files.bullet.1':
    'Presuňte súbory sem, prerušované pole pod lištou, prijíma súbory, ktoré naň pustíte. Kliknutím naň otvoríte výber súboru. Pole ukazuje typy súborov, ktoré toto TREK prijíma, a limit na súbor (Max 50 MB, pokiaľ správca nenastavil iný).',
  'help.ctx.trip-files.bullet.2':
    'Na lište hore sú „Súbory“ a záložky filtrov „Všetky“, „PDF“, „Obrázky“ a „Dokumenty“, každá s počtom. Hneď ako súbor označíte hviezdičkou, za „Všetky“ pribudne záložka s hviezdičkou, a keď má niektorá poznámka prílohu, na konci pribudne záložka „Poznámky spolupráce“.',
  'help.ctx.trip-files.bullet.3':
    'V riadku je miniatúra alebo typ súboru, kto ho nahral, názov, poznámka pod ním, veľkosť a dátum a pre každé prepojenie jeden štítok: miesto, rezervácia alebo doprava podľa názvu (keď naň prejdete myšou, uvidíte „Denný plán“, „Rezervácia“ alebo „Doprava“) a „Z poznámok spolupráce“.',
  'help.ctx.trip-files.bullet.4':
    'Na konci riadku je až päť ikon, každá s názvom po ukázaní myšou: Označiť hviezdičkou, Priradiť (ceruzka), Otvoriť, Stiahnuť a Vymazať. Vymazať sa nepýta: súbor ide do koša, odkiaľ ho môžete obnoviť. Offline fungujú poznámka, odkaz, hviezdička a kôš a odošlú sa, keď bude TREK znova online. Pripojenie vyžaduje len nahrávanie a odstránenie ďalšieho odkazu.',
  'help.ctx.trip-files.bullet.5':
    'Obrázok alebo video sa otvorí na celú obrazovku, s ovládaním šípkami a radom miniatúr. Každý iný dokument sa otvorí v dialógu s názvom navrchu a pod ním Otvoriť na novej karte a Stiahnuť. Karta do peňaženky sa stiahne hneď.',
  'help.ctx.trip-files.bullet.6':
    'Ikona koša na pravom konci lišty (Kôš) prepne zoznam na vymazané súbory. Tam môžete každý obnoviť alebo natrvalo vymazať a Vyprázdniť kôš na lište vymaže všetky. Synchronizácia dokumentov je vľavo od ikony koša, keď je cesta prepojená s úložiskom dokumentov, alebo pre vlastníka cesty či správcu hneď, ako je nejaké úložisko zapnuté.',
  // files-upload
  'help.guide.files-upload.title': 'Pridať dokument do cesty',
  'help.guide.files-upload.goal':
    'Nahrajte do cesty lístok, potvrdenie alebo fotku z priečinka so stiahnutými súbormi, aby ich mohol otvoriť každý z cesty.',
  'help.guide.files-upload.step.1':
    'Otvorte cestu a na lište kariet kliknite na Súbory. Sú tam uvedené dokumenty cesty a nad nimi pole na nahrávanie.',
  'help.guide.files-upload.step.2':
    'Kliknite na Presuňte súbory sem a vyberte jeden alebo viac súborov. Nahrávajú sa jeden po druhom a počas toho pole ukazuje Nahráva sa.... Vnútri poľa, pod alebo kliknite pre výber, vidíte typy súborov, ktoré tento TREK prijíma, a maximálnu veľkosť súboru.',
  'help.guide.files-upload.step.3':
    'Keď sa dokončí nahrávanie posledného súboru, automaticky sa preň otvorí „Priradiť súbor“ (ak má cesta nejaké miesta alebo rezervácie) s názvom súboru v hornej časti dialógu. Pole „Pridať poznámku...“ v časti „Poznámka“ pridá k súboru poznámku a zoznamy pod ním ho prepoja s miestom alebo rezerváciou. Dialóg zavriete krížikom × vpravo hore. Zatvorením nič nestratíte.',
  'help.guide.files-upload.step.4':
    'Nové súbory sa zobrazia na začiatku zoznamu, nad nimi sú len súbory označené hviezdičkou. V riadku vidíte, kto súbor nahral, názov, veľkosť a dátum. Obrázok má miniatúru, pri ostatných súboroch je uvedený typ.',
  'help.guide.files-upload.result': 'Dokumenty sú v ceste a každý, kto cestu vidí, ich môže otvoriť a stiahnuť.',
  'help.guide.files-upload.tip.1':
    'Súbor môžete tiež potiahnuť z pracovnej plochy rovno na pole. Kým je súbor nad ním, pole sa zvýrazní.',
  'help.guide.files-upload.tip.2':
    'Klávesmi Ctrl+V pridáte do zoznamu obrázok zo schránky, takže snímku obrazovky rezervácie nemusíte najprv ukladať.',
  'help.guide.files-upload.tip.3':
    'Na nahrávanie potrebujete právo nahrávať súbory; bez neho pole vôbec nie je. Typ, ktorý nie je v zozname, sa odmietne so správou a nič sa nenahrá. Súbor nad limit (50 MB, ak správca nenastavil inak) sa odmietne ešte pred odoslaním a správa limit uvedie. Nahrávanie vyžaduje aj pripojenie: offline to TREK oznámi a nič nenahrá.',
  // files-link
  'help.guide.files-link.title': 'Prepojenie dokumentu s miestom alebo rezerváciou',
  'help.guide.files-link.goal':
    'Uľahčite hľadanie lístka tak, aby ho bolo možné nájsť aj zo dňa, ku ktorému patrí, nielen z tohto zoznamu.',
  'help.guide.files-link.step.1':
    'Kliknite na ceruzku na konci riadka („Priradiť“). Otvorí sa „Priradiť súbor“ s názvom súboru v hornej časti dialógu.',
  'help.guide.files-link.step.2':
    'V časti „Poznámka“ môžete do poľa „Pridať poznámku...“ napísať jeden riadok, ktorý sa potom zobrazí v zozname pod názvom súboru. Uloží sa, keď stlačíte Enter alebo pole opustíte.',
  'help.guide.files-link.step.3':
    'Pod Miesto vľavo vidíte miesta cesty zoskupené podľa dní s dátumom a na konci Nepriradené pre miesta, ktoré nie sú v žiadnom dni. Kliknutím na miesto ho zaškrtnete.',
  'help.guide.files-link.step.4':
    'Pod Rezervácia a Doprava vpravo sú rezervácie cesty. Kliknite na tú, ku ktorej dokument patrí. Aj ona sa zaškrtne.',
  'help.guide.files-link.step.5':
    'Zatvorte krížikom × vpravo hore. Tlačidlo na uloženie tu nie je: každé kliknutie sa uložilo okamžite.',
  'help.guide.files-link.result':
    'Riadok ukazuje poznámku a jeden štítok pre každé prepojenie: jeden s názvom miesta a jeden s názvom letu. Keď ukážete na štítok, zobrazí sa Denný plán alebo Doprava. Dokument je pripojený aj k miestu a k letu.',
  'help.guide.files-link.tip.1':
    'Súbor môže mať naraz viac prepojení, takže to isté potvrdenie môže patriť k rezervácii hotela aj k miestu hotela súčasne.',
  'help.guide.files-link.tip.2':
    'Opätovným kliknutím na označenú položku prepojenie odstránite, samotný súbor zostane. Offline sa poznámka a nové označenia uložia a odošlú, keď bude TREK znova online. Pripojenie vyžaduje iba odstránenie ďalšieho prepojenia.',
  'help.guide.files-link.tip.3':
    'Funguje to aj naopak: dokument priložený k miestu alebo rezervácii nájdete aj v tomto zozname, s rovnakým štítkom v riadku.',
  // files-star
  'help.guide.files-star.title': 'Dôležité dokumenty navrchu',
  'help.guide.files-star.goal':
    'Označte pár dokumentov, ktoré budete naozaj potrebovať, aby ste ich v dlhom zozname rýchlo našli.',
  'help.guide.files-star.step.1':
    'Kliknite na hviezdičku na konci riadku (Označiť hviezdičkou). Zožltne, pred názvom súboru sa zobrazí druhá hviezdička a keď teraz ukážete na tlačidlo, uvádza Odobrať hviezdičku.',
  'help.guide.files-star.step.2':
    'Zoznam sa znova zoradí: súbory s hviezdičkou sú nad všetkými ostatnými a v každej skupine sú najnovšie navrchu.',
  'help.guide.files-star.step.3':
    'Medzi kartami filtrov na lište sa teraz hneď za Všetky zobrazí hviezdička s počtom súborov označených hviezdičkou. Kliknutím na ňu zobrazíte iba tieto súbory.',
  'help.guide.files-star.result': 'Súbory označené hviezdičkou sú navrchu zoznamu a jedna karta zobrazuje len ich.',
  'help.guide.files-star.tip.1':
    'Záložka s hviezdičkou existuje, len kým je nejaký súbor označený hviezdičkou. Keď hviezdičku odoberiete z posledného súboru, záložka zmizne.',
  'help.guide.files-star.tip.2':
    'Na označenie hviezdičkou potrebujete rovnaké oprávnenie ako na „Priradiť“, teda „Upraviť metadáta súborov“. Člen bez neho hviezdičky vidí, ale kliknutím na „Označiť hviezdičkou“ nič nezmení.',
  // files-filter
  'help.guide.files-filter.title': 'Hľadanie dokumentu v zozname',
  'help.guide.files-filter.goal': 'Zobrazte len ten druh dokumentu, ktorý hľadáte.',
  'help.guide.files-filter.step.1':
    'Karty filtrov sú na lište hore vedľa „Súborov“: Všetky, PDF, Obrázky a Dokumenty, každá s počtom súborov.',
  'help.guide.files-filter.step.2': 'Kliknite na PDF: zoznam ukáže iba súbory PDF.',
  'help.guide.files-filter.step.3':
    'Dve ďalšie karty sa zobrazia, len keď má cesta zodpovedajúce súbory. Kliknite na Poznámky spolupráce, ktorá sa zobrazí, hneď ako má poznámka na karte Spolupráca prílohu: zoznam potom ukáže len tieto súbory. Karta s hviezdičkou sa zobrazí rovnako, hneď ako je nejaký súbor označený hviezdičkou.',
  'help.guide.files-filter.step.4': '„Všetky“ zobrazí znova celý zoznam.',
  'help.guide.files-filter.result':
    'Zoznam ukazuje len súbory vybranej záložky a číslo na každej záložke udáva, koľko ich je.',
  'help.guide.files-filter.tip.1':
    'Nie sú tu priečinky a súbory sa nedajú premenovať. Dokumenty rozlíšite podľa poznámky v Priradiť súbor, prepojení na miesta a rezervácie a hviezdičky.',
  'help.guide.files-filter.tip.2':
    'Zoznam je vždy zoradený tak, že hviezdičkou označené súbory sú prvé, potom od najnovšieho, takže dnes nahraný dokument je nad dokumentom z minulého mesiaca.',
  // files-preview
  'help.guide.files-preview.title': 'Prečítať dokument bez opustenia TREK',
  'help.guide.files-preview.goal':
    'Pozrite si lístok alebo obrázok hneď a keď ho potrebujete v zariadení, stiahnite si ho.',
  'help.guide.files-preview.step.1':
    'Kliknite na názov obrázka alebo jeho miniatúru. Otvorí sa na celú obrazovku, vľavo hore s názvom súboru a jeho poradím medzi obrázkami. Video sa otvorí rovnako a prehráva sa tam.',
  'help.guide.files-preview.step.2':
    'Okrúhle šípky po stranách, klávesy so šípkou vľavo a vpravo alebo pás miniatúr dole vás prevedú všetkými obrázkami, ktoré zoznam práve zobrazuje.',
  'help.guide.files-preview.step.3':
    '„Otvoriť na novej karte“ a „Stiahnuť“ sú okrúhle tlačidlá vpravo hore vedľa ×. Obrázok zavriete krížikom ×, klávesom Escape alebo kliknutím na tmavé pozadie.',
  'help.guide.files-preview.step.4':
    'Dokument, ktorý nie je obrázok, sa namiesto toho otvorí v dialógu: hore je jeho názov, pod ním tlačidlá „Otvoriť na novej karte“ a „Stiahnuť“ a pri PDF nižšie samotná stránka. Zavriete ho krížikom × vpravo hore, klávesom Escape alebo kliknutím mimo dialógu.',
  'help.guide.files-preview.step.5':
    'Šípka na konci riadku (Stiahnuť) uloží súbor priamo do vášho zariadenia bez toho, aby sa najprv otvoril.',
  'help.guide.files-preview.result':
    'Dokument sa zobrazí na obrazovke a tie isté dve tlačidlá ho otvoria na karte prehliadača alebo uložia na disk.',
  'help.guide.files-preview.tip.1':
    'Na dotykovej obrazovke medzi obrázkami listujete potiahnutím prsta namiesto klikania na šípky.',
  'help.guide.files-preview.tip.2':
    'Karta do peňaženky sa nikdy neotvorí v náhľade. Stiahne sa hneď, aby ju telefón mohol otvoriť vo svojej aplikácii peňaženky.',
  'help.guide.files-preview.tip.3':
    'Otvoriť na novej karte aj Stiahnuť načítajú súbor s vašou reláciou, takže odkaz skopírovaný z panela s adresou pre nikoho iného nefunguje.',
  // files-trash
  'help.guide.files-trash.title': 'Vymazanie a obnovenie dokumentu',
  'help.guide.files-trash.goal': 'Vymažte, čo už cesta nepotrebuje, a obnovte súbory, ktoré ešte potrebujete.',
  'help.guide.files-trash.step.1':
    'Kliknite na kôš na konci riadku (Vymazať). Súbor okamžite zmizne zo zoznamu a zobrazí sa správa Presunuté do koša. Nepýta sa na potvrdenie.',
  'help.guide.files-trash.step.2':
    'Ikona koša na pravom konci lišty (Kôš) prepne zoznam na vymazané súbory. Nadpis lišty ukáže Kôš a karty filtrov aj pole na nahrávanie sa skryjú.',
  'help.guide.files-trash.step.3':
    'Riadok v koši je sivý a má dve ikony: „Obnoviť“, ktorá súbor obnoví, a „Vymazať“, ktorá ho po potvrdení natrvalo vymaže.',
  'help.guide.files-trash.step.4':
    'Kliknite na Obnoviť. Zobrazí sa správa Súbor bol obnovený a súbor zmizne z koša. Jeho poznámka aj prepojenia zostanú.',
  'help.guide.files-trash.step.5':
    'Vyprázdniť kôš na lište vedľa ikony koša natrvalo vymaže všetko, čo je ešte v koši. Prehliadač sa predtým jedenkrát opýta na potvrdenie. Ikona koša prepne späť na súbory.',
  'help.guide.files-trash.result': 'Súbor je opäť v zozname na pôvodnom mieste.',
  'help.guide.files-trash.tip.1':
    'Vymazať na riadku sa najprv nepýta. Preto je tu kôš: z TREK sa nič neodstráni, kým to nevymažete tu. Toto všetko funguje aj offline a odošle sa, keď bude TREK znova online.',
  'help.guide.files-trash.tip.2':
    'Na vymazanie a obnovenie súboru potrebujete oprávnenie mazať súbory. Člen bez neho nevidí v riadku „Vymazať“ ani tlačidlá v koši.',
  'help.guide.files-trash.tip.3': 'Súbor natrvalo vymazaný v koši sa už nedá obnoviť.',
  // files-sync
  'help.guide.files-sync.title': 'Synchronizácia dokumentov s úložiskom dokumentov',
  'help.guide.files-sync.goal':
    'Prepojte cestu s vlastným úložiskom dokumentov, aby sa súbory nahrané sem uložili tam a súbory uložené tam sa objavili tu.',
  'help.guide.files-sync.step.1':
    'Kliknite na Synchronizácia dokumentov vedľa ikony koša na pravom konci lišty. Otvorí sa dialóg s názvom cesty pod nadpisom. Vľavo pod Pripojiť poskytovateľa sú úložiská, ktoré zapol správca, každé s riadkom o tom, ako ukladá súbory: Paperless-ngx a Papra podľa štítku, Nextcloud a Synology Drive v priečinku, OpenCloud v priestore. Vpravo je Zatiaľ nič nepripojené.',
  'help.guide.files-sync.step.2':
    'Kliknite na svoje úložisko, tu Nextcloud. Otvorí sa menší dialóg pre pripojenie. Obsahuje názov úložiska a žiada prihlasovacie údaje, ktoré toto úložisko vyžaduje.',
  'help.guide.files-sync.step.3':
    'Vyplňte „Adresa“ a prihlasovacie údaje úložiska: API token pre Paperless-ngx, API kľúč a „ID organizácie“ pre Papra, „Používateľské meno“ a „Heslo aplikácie“ pre Nextcloud, „Používateľské meno“ a „Token aplikácie“ pre OpenCloud a pre Synology Drive „Používateľské meno“, „Heslo“ a, ak ho účet vyžaduje, „Dvojfaktorový kód“. Všade, kde to úložisko umožňuje, použite heslo alebo token aplikácie, nikdy nie heslo k účtu. Nextcloud a Synology Drive majú aj nepovinný „Základný priečinok“, v ktorom TREK hľadá priečinky ciest, tu /Reisen. Možnosť „Prijať vlastnoručne podpísaný certifikát“ dole je len pre úložisko vo vašej vlastnej sieti s takýmto certifikátom.',
  'help.guide.files-sync.step.4':
    'Kliknite na „Otestovať pripojenie“. TREK sa so zadanými údajmi pripojí k úložisku a v spodnej časti sa zobrazí „Spojenie funguje, prihlásený ako“ a meno účtu. Ak sú prihlasovacie údaje odmietnuté alebo adresa nie je dostupná, zobrazí sa tam to. V oboch prípadoch sa nič neuloží.',
  'help.guide.files-sync.step.5':
    'Kliknite na Pripojiť. Pripojenie sa uloží k ceste a TREK sa opýta, kde v úložisku majú byť dokumenty cesty: v ktorom štítku, priečinku alebo priestore. Synchronizuje sa len to, čo je v ňom. Vytvoriť nové ho vytvorí po kliknutí na Vytvoriť, s názvom prevzatým z názvu cesty. Pod Alebo použite existujúce vidíte už existujúce. Kliknite na jedno, tu na priečinok Jeseň v Japonsku.',
  'help.guide.files-sync.step.6':
    'Dialóg sa otvorí znova: vaše úložisko je vľavo pod Táto cesta a jeho karta vpravo ukazuje, kam sa synchronizuje, kedy synchronizácia naposledy prebehla, a Synchronizovať teraz. Prvá synchronizácia sa spustí automaticky, Synchronizovať teraz ju spustí kedykoľvek. Po synchronizácii sa značka Zatiaľ nesynchronizované vedľa názvu zmení na zelenú bodku, ktorá po ukázaní na ňu ukáže Aktuálne. Ukazovateľ toku zobrazuje, koľko dokumentov má TREK a koľko úložisko, s dráhami Do úložiska a Z úložiska medzi nimi. Dialóg zavriete krížikom × vpravo hore.',
  'help.guide.files-sync.result':
    'Dokumenty, ktoré už v úložisku boli, sa zobrazia navrchu zoznamu ako nahrané pod vaším menom a každý dokument cesty je aj v úložisku, okrem dokumentov z „Poznámok spolupráce“. Odteraz TREK kontroluje úložisko na pozadí a zmeny v zozname sa kopírujú do úložiska.',
  'help.guide.files-sync.tip.1':
    'Cestu môže pripojiť iba jej vlastník alebo správca inštancie, pretože prihlasovacie údaje dávajú prístup k celému účtu v úložisku. Keď je cesta pripojená, každý člen vidí Synchronizácia dokumentov, môže ju otvoriť, prečítať si kartu a stlačiť Synchronizovať teraz.',
  'help.guide.files-sync.tip.2':
    'Úložisko vo vašej vlastnej sieti vyžaduje na serveri TREK nastavenie ALLOW_INTERNAL_NETWORK=true a jeho adresa musí byť adresa počítača v sieti, nikdy nie localhost. Bez toho Otestovať pripojenie odpovie Táto adresa nie je povolená.',
  'help.guide.files-sync.tip.3':
    '„Odpojiť“, ikona vedľa „Synchronizovať teraz“, si raz vyžiada potvrdenie. Potom ukončí prepojenie a všetky dokumenty ponechá na oboch stranách. Ak štítok, priečinok alebo priestor prepojíte druhýkrát, TREK ho považuje za nový a znova z neho importuje všetko. Po odpojení preto prepojte prázdny, nie ten starý.',
  // ── Screen: trip-collab ───────────────────────────────────────────────────────────────
  'help.ctx.trip-collab.title': 'Spolupráca',
  'help.ctx.trip-collab.summary':
    'Záložka, kde skupina plánuje spoločne, v piatich kartách: vľavo čet, vedľa neho Poznámky a Odkazy, pod nimi Ankety a Čo nasleduje. Všetko, čo sa sem napíše, sa okamžite zobrazí na obrazovke každého ďalšieho člena bez opätovného načítania.',
  'help.ctx.trip-collab.bullet.1':
    'Čet je karta vľavo. Píšte do poľa Napíšte správu... a stlačte Enter. Shift a Enter vytvoria nový riadok. Smajlík pridá emoji a Priložiť obrázky pripojí k správe až štyri obrázky.',
  'help.ctx.trip-collab.bullet.2':
    'Keď prejdete myšou nad správu, zobrazí sa „Odpovedať“ a pri vašich vlastných správach aj „Vymazať“. Kliknutím pravým tlačidlom otvoríte osem rýchlych reakcií. Vymazanú správu nahradí poznámka, kto ju vymazal.',
  'help.ctx.trip-collab.bullet.3':
    'Poznámky sú spoločná oblasť poznámok: Nová poznámka v jej hlavičke vytvorí poznámku a ozubené koleso vedľa otvorí Spravovať kategórie pre ich názvy a farby. Keď existujú kategórie, riadok štítkov pod hlavičkou filtruje karty: Všetky alebo jedna kategória. Karta poznámky ukazuje jej kategóriu ako farebnú bodku a jej odkaz ako okrúhle tlačidlo. Tri bodky (Ďalšie možnosti) obsahujú Rozbaliť, Pripnúť, Upraviť a Vymazať.',
  'help.ctx.trip-collab.bullet.4':
    'Odkazy zhromažďujú webové adresy k ceste. Pridať odkaz prijme názov a adresu http alebo https. Upraviť odkaz, Pripnúť odkaz a Vymazať odkaz sú na konci čipu a pripnuté odkazy zostávajú vpredu.',
  'help.ctx.trip-collab.bullet.5':
    'Ankety slúžia na rozhodovanie. Nová anketa položí otázku s aspoň dvoma možnosťami. Kliknutím na možnosť za ňu hlasujete. Zámok (Uzavrieť) a kôš (Vymazať) vpravo v hlavičke ankety ukončia hlasovanie alebo anketu odstránia.',
  'help.ctx.trip-collab.bullet.6':
    '„Čo nás čaká“ zobrazuje zastávky cesty, ktoré sú ešte pred vami, najviac osem, s časmi a ľuďmi, ktorí sa ich zúčastnia. Údaje len číta z plánu dňa, časy sa nastavujú tam.',
  // write-note
  'help.guide.write-note.title': 'Napísanie zdieľanej poznámky',
  'help.guide.write-note.goal':
    'Dajte to, čo potrebuje celá skupina, napríklad pravidlo, adresu alebo pripomienku, na miesto, kde to každý nájde.',
  'help.guide.write-note.step.1':
    'V záhlaví karty Poznámky kliknite na Nová poznámka. Otvorí sa dialóg poznámky s kurzorom už v poli názvu.',
  'help.guide.write-note.step.2':
    'Názov napíšte do poľa „Názov poznámky“ hore v dialógu. Je to jediné povinné pole: „Vytvoriť“ zostane sivé, kým názov nie je vyplnený, a stlačením Enter v názve poznámku hneď vytvoríte.',
  'help.guide.write-note.step.3':
    'Obsah je text poznámky a podporuje Markdown: tučné slovo, zoznam, nadpis. Karta ukazuje prvé tri riadky a Rozbaliť v jej ponuke otvorí celú poznámku.',
  'help.guide.write-note.step.4':
    'Pod Kategória vyberte tú, do ktorej poznámka patrí. Jej farba sa použije teraz na záhlavie dialógu a neskôr na záhlavie karty. Prvá kategória je už vybraná za vás. Štítky sú kategórie, ktoré už existujú, a novú vytvoríte pod Spravovať kategórie. Kým cesta nemá žiadne kategórie, tento riadok sa nezobrazí.',
  'help.guide.write-note.step.5':
    'Webová stránka prijme odkaz, ktorý patrí k poznámke. Karta potom hore ukazuje okrúhle tlačidlo odkazu, ktoré ho otvorí.',
  'help.guide.write-note.step.6':
    'Kliknite na „Vytvoriť“. Dialóg zavrie len „Zrušiť“ a jeho krížik, takže kliknutím mimo neho ani klávesom Esc o napísaný text neprídete.',
  'help.guide.write-note.result':
    'Poznámka je ako karta v paneli „Poznámky“, s horným okrajom vo farbe kategórie, a ostatní členovia ju hneď vidia.',
  'help.guide.write-note.tip.1':
    'Tri bodky na karte (Ďalšie možnosti) otvoria Rozbaliť, Pripnúť, Upraviť a Vymazať. Pripnúť drží poznámku navrchu panela v rámčeku jej farby. Všetky ostatné poznámky sú zoradené podľa času poslednej zmeny.',
  'help.guide.write-note.tip.2':
    'Ozubené koliesko vedľa Nová poznámka otvorí Spravovať kategórie. Tam môžete kategórii dať farbu, premenovať ju všade naraz, alebo ju pridať skôr, než ju použije nejaká poznámka. Nič sa nezmení, kým nekliknete na Uložiť.',
  'help.guide.write-note.tip.3':
    '„Priložiť súbory“ pridá k poznámke dokument, ak môžete do cesty nahrávať súbory. „Priložiť“ otvorí výber súboru; obrázok alebo PDF môžete do dialógu aj vložiť zo schránky.',
  'help.guide.write-note.tip.4':
    'Poznámky majú vlastný prepínač v časti Doplnky, pod Spoluprácou: správca ich môže vypnúť a chat, odkazy, ankety a „Čo nás čaká“ nechať zapnuté.',
  // shared-links
  'help.guide.shared-links.title': 'Zbieranie odkazov k ceste',
  'help.guide.shared-links.goal':
    'Majte rezervačný portál, zdieľaný album a cestovný poriadok na jednom mieste, aby ste ich nemuseli hľadať v chate.',
  'help.guide.shared-links.step.1':
    'V hlavičke karty „Odkazy“ kliknite na „Pridať odkaz“. Otvorí sa dialóg s kurzorom v hornom poli.',
  'help.guide.shared-links.step.2':
    'Do poľa „Názov odkazu“ napíšte názov, do poľa „Pripojiť“ pod ním vložte adresu a kliknite na „Uložiť odkaz“.',
  'help.guide.shared-links.step.3':
    'Čip ukazuje názov a web, na ktorý odkazuje. Kliknutím naň sa stránka otvorí na novej karte.',
  'help.guide.shared-links.step.4':
    'Tri okrúhle tlačidlá na jeho konci sú Upraviť odkaz, Pripnúť odkaz a Vymazať odkaz. Pripnúť odkaz presunie čip na začiatok panela a zobrazí ho vo farbe zvýraznenia. Vymazať odkaz sa najprv opýta na potvrdenie, pretože odkaz sa odstráni pre všetkých členov.',
  'help.guide.shared-links.result':
    'Odkaz sa zobrazí ako čip v paneli „Odkazy“, pripnutý na začiatok, a hneď ho uvidí každý člen.',
  'help.guide.shared-links.tip.1':
    'Prijíma sa iba adresa http alebo https. Čokoľvek iné sa odmietne a dialóg zostane otvorený s tým, čo ste napísali.',
  'help.guide.shared-links.tip.2':
    'Pripnuté odkazy sú prvé, potom najnovšie. Malá ikona vedľa názvu je favicon stránky, načítaný priamo z nej, takže bez internetu čip namiesto neho ukáže obyčajnú ikonu odkazu.',
  'help.guide.shared-links.tip.3':
    '„Odkazy“ majú v „Doplnkoch“ vlastný prepínač pod „Spoluprácou“, takže administrátor môže panel vypnúť bez vplyvu na zvyšok záložky.',
  // create-poll
  'help.guide.create-poll.title': 'Opýtajte sa skupiny',
  'help.guide.create-poll.goal':
    'Premeňte otázku, na ktorú v čete nikto neodpovedá, na anketu, v ktorej môže hlasovať každý.',
  'help.guide.create-poll.step.1': 'V záhlaví karty Ankety kliknite na Nová anketa. Otvorí sa dialóg.',
  'help.guide.create-poll.step.2':
    'Otázku napíšte do poľa „Otázka“. „Podporuje Markdown“ pod poľom znamená, že tu funguje tučný text, zalomenie riadka aj krátky zoznam.',
  'help.guide.create-poll.step.3':
    'Vyplňte Možnosť 1 a Možnosť 2 v časti Možnosti. Potrebujete aspoň dve neprázdne možnosti a možnosť môže mať aj viac riadkov.',
  'help.guide.create-poll.step.4':
    'Pridať možnosť pod nimi pridá tretiu, štvrtú, koľko potrebujete. Malý krížik vedľa riadka, ktorý sa zobrazí, keď máte viac ako dve možnosti, danú možnosť odstráni.',
  'help.guide.create-poll.step.5':
    '„Viac možností“ umožní každému zaškrtnúť viac ako jednu možnosť. Ak je vypnuté, hlas sa pri výbere inej možnosti presunie na novú.',
  'help.guide.create-poll.step.6': 'Kliknite na „Vytvoriť anketu“.',
  'help.guide.create-poll.result': 'Anketa sa zobrazí navrchu panela Ankety, otvorená, s 0 hlasmi v záhlaví.',
  'help.guide.create-poll.tip.1': 'Otázka sa zobrazuje ako Markdown. Možnosti zostávajú obyčajným textom.',
  'help.guide.create-poll.tip.2': '„Vytvoriť anketu“ zostane sivé, kým nezadáte otázku a aspoň dve vyplnené možnosti.',
  'help.guide.create-poll.tip.3':
    'Termín sa dá nastaviť iba v mobilnej aplikácii. Anketa s termínom ukazuje zostávajúci čas v jantárovom čipe v hlavičke a po uplynutí času sa uzavrie.',
  'help.guide.create-poll.tip.4':
    'Ankety majú vlastný prepínač v časti Doplnky, pod Spolupráca: správca ho môže vypnúť a ostatné štyri panely nechať zapnuté.',
  // vote-poll
  'help.guide.vote-poll.title': 'Hlasovanie a výsledok',
  'help.guide.vote-poll.goal': 'Zahlasujte, pozrite si výsledky skupiny a prípadne zmeňte svoj hlas.',
  'help.guide.vote-poll.step.1':
    'Kliknite na možnosť, ktorú chcete. Jej krúžok sa označí fajkou, možnosť dostane rámček vo farbe zvýraznenia a pruh za ňou narastie.',
  'help.guide.vote-poll.step.2':
    'Teraz vidíte celý výsledok: pruh ukazuje podiel, percento je vpravo a malé krúžky sú ľudia, ktorí zvolili túto možnosť, najviac traja.',
  'help.guide.vote-poll.step.3':
    'Rozmysleli ste si to? Kliknite na inú možnosť. V ankete bez „Viac možností“ sa váš hlas presunie na novú možnosť, druhý hlas nepribudne.',
  'help.guide.vote-poll.step.4':
    'Počet hlasov sa zobrazuje v čipe pod otázkou. Kliknutím na možnosť, ktorú ste už vybrali, svoj hlas stiahnete a počet klesne.',
  'help.guide.vote-poll.result':
    'Vaša možnosť je zaškrtnutá, pruhy ukazujú, ako skupina hlasovala, a krúžky ukazujú, kto ktorú možnosť vybral.',
  'help.guide.vote-poll.tip.1':
    'Percentá a to, kto za čo hlasoval, sa zobrazia až potom, ako sami zahlasujete, alebo keď je anketa uzavretá. Počet hlasov v hlavičke vidí každý.',
  'help.guide.vote-poll.tip.2':
    'Hlasovanie nikdy nie je anonymné: keď prejdete myšou nad niektorý z krúžkov pri možnosti, uvidíte meno toho, kto hlasoval.',
  // close-poll
  'help.guide.close-poll.title': 'Uzavretie ankety alebo jej odstránenie',
  'help.guide.close-poll.goal':
    'Ukončite hlasovanie, keď sa skupina rozhodla, a vymažte anketu, ktorú už nikto nepotrebuje.',
  'help.guide.close-poll.step.1':
    '„Uzavrieť“, zámok vpravo v hlavičke ankety, ukončí hlasovanie. Na možnosti už potom nemožno kliknúť.',
  'help.guide.close-poll.step.2':
    'Uzavretá anketa sa presunie na spodok panela, pod nadpis Uzavreté, ak sú nad ňou otvorené ankety. Má štítok Uzavreté a ukazuje všetkým výsledok, či hlasovali, alebo nie. Víťazná možnosť je vyznačená tučným písmom na zelenom pruhu. Ak je to možnosť, ktorú ste vybrali vy, pruh má namiesto toho farbu vášho akcentu.',
  'help.guide.close-poll.step.3':
    'Vymazať, kôš vpravo v hlavičke, anketu vymaže. Pri uzavretej ankete je to jediné tlačidlo, lebo zámok zmizol. Nič sa nepotvrdzuje a hlasy sa vymažú tiež.',
  'help.guide.close-poll.result':
    'Vymazaná anketa zmizne z panela každého člena. Anketa, ktorú ste len uzavreli, zostane viditeľná dole, spolu s výsledkom.',
  'help.guide.close-poll.tip.1':
    'Uzavretie sa nedá vrátiť späť, anketu nie je možné znova otvoriť. Omylom uzavretú anketu treba vytvoriť znova.',
  'help.guide.close-poll.tip.2':
    '„Vymazať“ odstráni anketu aj všetky jej hlasy pre všetkých, okamžite a bez potvrdenia.',
  // whats-next
  'help.guide.whats-next.title': 'Čítanie Čo nasleduje',
  'help.guide.whats-next.goal': 'Pozrite si, čo skupina robí ďalej, bez otvárania plánu.',
  'help.guide.whats-next.step.1':
    'Karta uvádza najbližšie zastávky cesty, najviac osem, v časovom poradí pod nadpisom pre každý deň: Dnes, Zajtra alebo dátum, a vedľa neho názov dňa, ak ho deň má. V hlavičke je ich počet.',
  'help.guide.whats-next.step.2':
    'Vľavo pri každej zastávke je jej čas: začiatok, do a koniec, ak ho zastávka má, alebo TBD, ak ešte nie je nastavený čas.',
  'help.guide.whats-next.step.3':
    'Vedľa neho sú názov, adresa a ako čipy ľudia na tejto zastávke. Ak nie je k zastávke priradený nikto, uvedení sú všetci z cesty.',
  'help.guide.whats-next.result': 'Zoznam toho, čo vás čaká, len na čítanie: riadi sa plánom a nič tu ho nezmení.',
  'help.guide.whats-next.tip.1':
    'Tu nič nenastavujete. Časy pochádzajú z plánu dňa, a keď ich tam zmeníte, tento zoznam sa hneď aktualizuje.',
  'help.guide.whats-next.tip.2':
    'Zobrazuje sa iba to, čo vás ešte čaká: zastávka zo zoznamu zmizne, keď uplynie jej začiatok, dnešná zastávka bez času zostane do konca dňa a po skončení cesty je panel prázdny.',
  'help.guide.whats-next.tip.3':
    'Čo nasleduje má vlastný prepínač v Doplnky, pod Spolupráca. Je to panel pre počítač: karta Spolupráca v mobilnej aplikácii ho nezobrazuje.',
  // trip-chat
  'help.guide.trip-chat.title': 'Rozhovor so skupinou',
  'help.guide.trip-chat.goal':
    'Pošlite správu, odpovedzte na konkrétnu správu, reagujte na inú a vymažte svoju vlastnú.',
  'help.guide.trip-chat.step.1':
    'Píšte do poľa Napíšte správu... a stlačte Enter. To isté urobí okrúhla šípka vedľa poľa. Shift a Enter namiesto toho vložia nový riadok.',
  'help.guide.trip-chat.step.2':
    'Smajlík otvorí výber emoji so skupinami Smajlíky, Reakcie a Cestovanie. Vybrané emoji sa pridá k textu, ktorý píšete. Samo sa neodošle.',
  'help.guide.trip-chat.step.3':
    'Prejdite myšou nad správu niekoho iného: v jej rohu sa objaví malé okrúhle tlačidlo. To je „Odpovedať“.',
  'help.guide.trip-chat.step.4':
    'Správa, na ktorú odpovedáte, sa zobrazí ako citát nad poľom. Napíšte a odošlite svoju správu a citát sa odošle s ňou. Krížikom na citáte ho odstránite.',
  'help.guide.trip-chat.step.5':
    'Kliknutím pravým tlačidlom na správu zobrazíte osem rýchlych reakcií. Vaša reakcia sa zobrazí pod správou. Opätovným kliknutím na tú istú reakciu ju odstránite.',
  'help.guide.trip-chat.step.6':
    'Vaše vlastné správy majú vedľa Odpovedať aj Vymazať, ikonu koša. Správu vymaže okamžite a zostane poznámka, že ste ju vymazali. Nedá sa to vrátiť späť.',
  'help.guide.trip-chat.result':
    'Vaša odpoveď je najnovšia správa a navrchu má citovanú správu. Vaša reakcia sa zobrazí pod druhou správou. Namiesto vymazanej správy je poznámka, že ste ju vymazali.',
  'help.guide.trip-chat.tip.1':
    'Enter odošle správu, Shift a Enter vložia nový riadok. Správa s jedným až tromi emoji a ničím iným sa zobrazí veľká.',
  'help.guide.trip-chat.tip.2':
    'Cez Priložiť obrázky môžete k jednej správe pridať až štyri obrázky. Môžete ich aj vložiť alebo pretiahnuť na pole.',
  'help.guide.trip-chat.tip.3':
    'Pod správou s odkazom sa zobrazí karta s náhľadom, ktorú načíta váš vlastný TREK. Odkaz na niečo, k čomu máte prístup len vy, preto zostane obyčajným odkazom.',
  'help.guide.trip-chat.tip.4':
    'Chat má v „Doplnkoch“ vlastný prepínač pod „Spoluprácou“: administrátor ho môže vypnúť a poznámky, odkazy, ankety aj „Čo nás čaká“ ponechať zapnuté.',

  // ── Screen: trip-roadtrip ─────────────────────────────────────────────────────────────
  'help.ctx.trip-roadtrip.title': 'Cesta autom',
  'help.ctx.trip-roadtrip.summary':
    'Plán zobrazený ako jedna jazda: tie isté dni a tie isté miesta, spojené ako zastávky s jazdou medzi nimi, na lište v ľavom stĺpci a na mape. Ukazuje vzdialenosť a čas jazdy, kde treba natankovať a čo je pri ceste.',
  'help.ctx.trip-roadtrip.bullet.1':
    '„Dni“ a „Cesta autom“ hore v ľavom stĺpci prepínajú medzi plánom dní a jazdou. Nič sa nekopíruje ani nemení: „Dni“ zobrazujú plán presne taký, aký bol.',
  'help.ctx.trip-roadtrip.bullet.2':
    'Navrchu lišty sú súčty za cestu: Vzdialenosť, Čas jazdy a Zastávky. Pod nimi je karta pre každý deň s jazdou: číslo a dátum dňa na dlaždici, potom pilulky s kilometrami a časom jazdy, počtom zastávok, tým, čo trasa križuje, a odznak Stopa. Let, vlak alebo trajekt, ktorý ste rezervovali, sa v poradí zobrazí ako samostatná karta.',
  'help.ctx.trip-roadtrip.bullet.3':
    'Očíslovaná zastávka je miesto, kvôli ktorému deň vznikol. Zastávka na ceste, napríklad tankovanie, nabíjanie alebo odpočívadlo, má namiesto čísla ikonu svojho druhu a nepočíta sa. Kliknutím na číslo zmeníte, o aký druh ide, kliknutím na odznak Zastávka nastavíte, ako dlho tam zostanete, a ťahaním zastávku presuniete v rámci dňa alebo na iný deň.',
  'help.ctx.trip-roadtrip.bullet.4':
    'Medzi dvoma zastávkami ukazuje pruh jazdy vzdialenosť a čas úseku. Kliknutím naň otvoríte Spôsoby, ako prejsť tento úsek, alebo kliknutím na trasu na mape vediete úsek cez priebežný bod.',
  'help.ctx.trip-roadtrip.bullet.5':
    'Z pravého stĺpca sa stane „Pozdĺž trasy“: v jednom riadku vyberte, čo hľadáte, a deň, potom šírku koridoru a kliknite na „Hľadať“. Plusom pri výsledku, „Pridať“, ho zaradíte do jazdy v bode, kde okolo neho naozaj idete, a ikonou postele pri hoteli pridáte nocľah. „Ručne“ pridá miesto, ktoré vyhľadávanie nenašlo, a cez tri bodky vedľa názvu importujete trasu z Google Maps.',
  'help.ctx.trip-roadtrip.bullet.6':
    'Nastavenie jazdy pod ním obsahuje limity, auto a jeho dojazd, denné časy jazdy, čomu sa vyhnúť, ako sa kreslí čiara a či sa na mape zobrazujú aktuálne upozornenia. Patria k ceste, takže všetci plánujú s rovnakým autom.',
  // roadtrip-mode
  'help.guide.roadtrip-mode.title': 'Zobrazenie cesty ako jednej jazdy',
  'help.guide.roadtrip-mode.goal': 'Prepnite plán do režimu road tripu a zistite, čo ukazuje časová os trasy.',
  'help.guide.roadtrip-mode.step.1':
    'V prepínači „Dní“ a „Cesta autom“ hore v ľavom stĺpci kliknite na „Cesta autom“. Plán dňa nahradí jazda a mapa ukáže všetky dni, ktoré majú trasu.',
  'help.guide.roadtrip-mode.step.2':
    'Karta navrchu lišty sčíta celú cestu: Vzdialenosť, Čas jazdy a Zastávky. Zostáva na mieste, keď posúvate dni.',
  'help.guide.roadtrip-mode.step.3':
    'Pod ním je karta pre každý deň s jazdou. Deň bez jazdy sa vynechá. Záhlavie karty ukazuje číslo dňa s dátumom pod ním a potom štítky so vzdialenosťou a časom jazdy a s počtom zastávok toho dňa.',
  'help.guide.roadtrip-mode.step.4':
    'Na karte je deň zobrazený ako sled: očíslovaná zastávka za každé miesto, medzi každými dvoma úsek jazdy a vpravo čas príchodu. Rezervovaný let, vlak alebo trajekt sa v slede zobrazí ako samostatná karta.',
  'help.guide.roadtrip-mode.step.5':
    'Kliknutím na záhlavie dňa ho zbalíte, šípka na jeho konci sa otočí. Zbalený deň je skrytý aj na mape. Opätovným kliknutím na záhlavie ho zobrazíte znova.',
  'help.guide.roadtrip-mode.result':
    'Ľavý stĺpec ukazuje jazdu a mapa každý jej deň. Dni vás prepnú späť na plán, nezmenený.',
  'help.guide.roadtrip-mode.tip.1':
    'Voľba sa ukladá pre každú cestu k vášmu účtu, takže po opätovnom načítaní, v inom prehliadači aj na inom zariadení sa cesta otvorí opäť v zobrazení cesty autom.',
  'help.guide.roadtrip-mode.tip.2':
    'Prepínač sa zobrazí, až keď správca zapne doplnok „Cesta autom“ v časti Doplnky v administrácii.',
  'help.guide.roadtrip-mode.tip.3':
    'V telefóne prepínač nie je: doplnok pridá vlastnú kartu Cesta autom vedľa karty Plán.',
  // roadtrip-stops
  'help.guide.roadtrip-stops.title': 'Zastávky po ceste a dĺžka pobytu',
  'help.guide.roadtrip-stops.goal':
    'Urobte z miesta na trase zastávku po ceste a nastavte, ako dlho sa na každej zdržíte.',
  'help.guide.roadtrip-stops.step.1':
    'Na osi kliknite na číslo pred zastávkou. Má popis „Zmeniť na zastávku po ceste“ a pod ním sa otvoria druhy zastávok ako rad farebných krúžkov.',
  'help.guide.roadtrip-stops.step.2':
    'Vyberte druh. Keď ukážete na kruh, zobrazí sa jeho názov: Ubytovanie, Palivo, Nabíjanie, Odpočívadlo, Kemp, Jedlo alebo Pamiatky. Číslo sa zmení na ikonu daného druhu a zastávky pod ním sa prečíslujú.',
  'help.guide.roadtrip-stops.step.3':
    'Zastávka po ceste nie je cieľ, preto záhlavie dňa počíta o jednu zastávku menej.',
  'help.guide.roadtrip-stops.step.4':
    'Znova kliknite na ikonu „Zmeniť typ tejto zastávky“ a vyberte „Späť na cieľ“, aby zastávka znova dostala svoje číslo.',
  'help.guide.roadtrip-stops.step.5':
    'Každá zastávka má odznak Zastávka, ktorý ukazuje plus, kým nie je nič naplánované. Kliknutím naň otvoríte Čas na tejto zastávke.',
  'help.guide.roadtrip-stops.step.6':
    'Dĺžku nastavte posuvníkom, tlačidlami mínus a plus alebo jednou z predvolieb. Odchod sa mení, zatiaľ čo Príchod zostáva na čase, keď tam jazda dorazí. Potom kliknite na Uložiť.',
  'help.guide.roadtrip-stops.result':
    'Štítok Pobyt zastávky, ktorú ste zmenili, ukazuje novú dĺžku a každý nasledujúci čas príchodu sa posunie podľa toho. Zastávka, ktorú ste zmenili na iný druh a späť, je opäť očíslovaný cieľ.',
  'help.guide.roadtrip-stops.tip.1':
    'Dĺžka pobytu patrí k miestu, nie k jednej návšteve: miesto naplánované na dva dni má v oboch dňoch rovnakú dĺžku pobytu.',
  'help.guide.roadtrip-stops.tip.2':
    'Zastávky po ceste sa zobrazujú aj v „Dní“. Ak v „Nastavení jazdy“ v časti „Servisné zastávky“ vypnete „Zobraziť aj v Dňoch“, zostanú len v „Cesta autom“.',
  'help.guide.roadtrip-stops.tip.3': 'Bez pobytu v tom istom dialógu čas opäť odstráni.',
  'help.guide.roadtrip-stops.tip.4':
    'Kliknutím na zastávku po ceste alebo na rezervovanú noc otvoríte jej kartu nad mapou. Pri zapnutej Cesta autom otvorí Upraviť namiesto formulára miesta kompaktný dialóg, ktorý používa vyhľadávanie, a Viac podrobností v tomto dialógu otvorí úplný formulár.',
  // roadtrip-corridor
  'help.guide.roadtrip-corridor.title': 'Nájsť palivo, jedlo a nocľah pozdĺž trasy',
  'help.guide.roadtrip-corridor.goal':
    'Hľadajte pozdĺž cesty, ktorou naozaj idete, a nájdené miesta pridajte na správny úsek.',
  'help.guide.roadtrip-corridor.step.1':
    'Pod Hľadá sa otvorte zoznam a zaškrtnite, čo potrebujete. Môžete kombinovať Palivo, Nabíjanie, Odpočívadlo, Kemp, Ubytovanie, Jedlo a Pamiatky: zoznam zostane otvorený pre ďalší výber a pole potom ukazuje ikonu pre každý druh.',
  'help.guide.roadtrip-corridor.step.2':
    'V rozbaľovacom zozname na konci toho istého riadka vyberte deň. Ponúka dni, pre ktoré je na osi karta, a „Hľadať“ počká, kým sa vypočíta trasa vybraného dňa.',
  'help.guide.roadtrip-corridor.step.3':
    'V časti „Do“ vyberte, ako ďaleko od cesty na oboch stranách sa má hľadať, 2 km, 5 km alebo 10 km, a kliknite na „Hľadať“.',
  'help.guide.roadtrip-corridor.step.4':
    'Výsledky sú zoskupené podľa druhu, v poradí, v akom ich míňate. Pri každom vidíte, ako ďaleko je od trasy a ako ďaleko v dennej jazde sa nachádza.',
  'help.guide.roadtrip-corridor.step.5':
    'Kliknite na Pridať, plus pri nájdenej položke. Pridať ako zastávku uvádza, do ktorého dňa a na ktorú pozíciu sa pridá, a pýta si Druh zastávky a Čas na tejto zastávke. Nabíjačka ukazuje aj Dostupnosť a ceny. Pridať ju zaradí do jazdy a Viac podrobností namiesto toho otvorí celý formulár miesta.',
  'help.guide.roadtrip-corridor.result':
    'Pridaná zastávka sa zobrazí na trase v mieste, kde okolo nej prejdete, s ikonou svojho druhu. Deň sa cez zastávku naplánuje znova a zoznam sa tým vyprázdni: ďalšiu zastávku vyhľadajte znova.',
  'help.guide.roadtrip-corridor.tip.1':
    'Nič sa nehľadá, kým nestlačíte Hľadať: jedno hľadanie odošle veľa požiadaviek zdieľanej službe.',
  'help.guide.roadtrip-corridor.tip.2':
    '„Filtrovať podľa názvu“ zúži výsledky bez nového vyhľadávania a „Vymazať výsledky“ vyprázdni zoznam a odstráni jeho špendlíky. Kliknutím na výsledok ho zobrazíte na mape.',
  'help.guide.roadtrip-corridor.tip.3':
    'Výsledok môžete potiahnuť aj z mapy na trasu. Takto si úsek vyberiete sami, keď tou istou cestou idete dvakrát. Ručne vedľa Hľadať pridá miesto, ktoré hľadanie nenašlo, vyhľadaním podľa názvu.',
  // roadtrip-via
  'help.guide.roadtrip-via.title': 'Vedenie úseku cez priebežný bod',
  'help.guide.roadtrip-via.goal': 'Nasmerujte úsek po ceste, ktorú chcete, bez pridania zastávky.',
  'help.guide.roadtrip-via.step.1':
    'Zobrazte na mape úsek, ktorý chcete upraviť: kliknite na zastávku na osi a potom zavrite kartu, ktorá sa otvorí nad mapou.',
  'help.guide.roadtrip-via.step.2':
    'Kliknite na nakreslenú trasu. Na úsek, na ktorý ste klikli, sa pridá priechodný bod a úsek sa cez neho naplánuje znova.',
  'help.guide.roadtrip-via.step.3':
    'Lišta sa aktualizuje: záhlavie dňa ukazuje novú vzdialenosť a čas jazdy a zmenia sa aj všetky príchody po priechodnom bode.',
  'help.guide.roadtrip-via.step.4':
    'Keď prejdete myšou nad úchyt, uvidíte, čo robí: „Potiahnutím zmeníte trasu, pravým kliknutím odstránite“. Potiahnite ho na iné miesto a úsek sa prekreslí cez nový bod.',
  'help.guide.roadtrip-via.step.5':
    'Kliknutím pravým tlačidlom na úchyt ho odstránite. Úsek opäť vedie priamou trasou.',
  'help.guide.roadtrip-via.result':
    'Úsek vedie po ceste, ktorú ste vybrali, a vzdialenosť, čas jazdy a časy príchodu dňa sa prepočítajú znova.',
  'help.guide.roadtrip-via.tip.1':
    'Prejazdný bod nie je zastávka: nemá číslo, dĺžku pobytu ani čas príchodu a nezapočítava sa do zastávok dňa.',
  'help.guide.roadtrip-via.tip.2':
    'Úchyty sa zobrazujú až od úrovne priblíženia 9, takže na mape s celou cestou vidíte čiaru bez nich.',
  'help.guide.roadtrip-via.tip.3':
    'Kliknutie vzdialené od ktoréhokoľvek nakresleného úseku viac než dva kilometre sa ignoruje, rovnako ako kliknutie na let, vlak alebo trajekt.',
  // roadtrip-alternatives
  'help.guide.roadtrip-alternatives.title': 'Vyskúšanie inej cesty pre úsek',
  'help.guide.roadtrip-alternatives.goal':
    'Pozrite si ďalšie trasy, ktoré smerovač ponúka pre časť jazdy, a vyberte si jednu z nich.',
  'help.guide.roadtrip-alternatives.step.1':
    'Kliknite na pruh jazdy v bočnom paneli, teda na riadok medzi dvoma zastávkami, ktorý ukazuje vzdialenosť a čas úseku. Jeho popis je Iné cesty.',
  'help.guide.roadtrip-alternatives.step.2':
    'Spôsoby, ako prejsť tento úsek sa otvorí nad mapou, s jednou položkou pre každú cestu a jej dĺžkou. Mapa vykreslí každú cestu s jej časom jazdy: vašu súčasnú cestu plnou modrou, ostatné svetlejšou modrou.',
  'help.guide.roadtrip-alternatives.step.3':
    'Keď prejdete myšou nad položku, daná cesta sa zvýrazní. „Aktuálne“ je cesta, ktorou idete, a „Najrýchlejšie“ tá najrýchlejšia. Pri ostatných vidíte, o koľko sú pomalšie alebo akej triede ciest sa vyhýbajú.',
  'help.guide.roadtrip-alternatives.step.4':
    'Kliknutím na položku použijete danú trasu, tlačidlom „Uzavrieť“ ponecháte aktuálnu.',
  'help.guide.roadtrip-alternatives.result':
    'Úsek teraz vedie po ceste, ktorú ste vybrali, a zmení sa aj vzdialenosť v bočnom stĺpci a časy príchodov po nej.',
  'help.guide.roadtrip-alternatives.tip.1':
    'Keď vyberiete inú cestu, TREK ju najprv overí smerovačom cesty autom. Potom udrží úsek na tejto ceste s čo najmenším počtom priechodných bodov a nahradí všetky priechodné body, ktoré úsek už mal. Cesta, po ktorej smerovač ísť nevie, sa neuloží. Výber cesty samotného smerovača priechodné body opäť odstráni.',
  'help.guide.roadtrip-alternatives.tip.2':
    '„Bez diaľnice“, „Bez mýta“ a „Bez trajektu“ počíta druhý nástroj s vlastným modelom rýchlosti, preto ich časy nemožno porovnávať s ostatnými.',
  // roadtrip-limits
  'help.guide.roadtrip-limits.title': 'Nastavenie auta a limitov jazdy',
  'help.guide.roadtrip-limits.goal': 'Povedzte TREK, akým vozidlom jazdíte a ako ďaleko chcete jazdiť bez prestávky.',
  'help.guide.roadtrip-limits.step.1':
    '„Nastavenie jazdy“ je pod vyhľadávaním v pravom stĺpci. Jeho štítky ukazujú, čo je nastavené. Kliknutím ho otvoríte.',
  'help.guide.roadtrip-limits.step.2':
    'V časti „Auto“ sa „Najdlhšia jazda naraz“ a „Jazda za deň“ zadávajú v minútach. Prázdne pole znamená vypnuté a nič sa neoznačí.',
  'help.guide.roadtrip-limits.step.3':
    'V časti Vozidlo uveďte, čím jazdíte. Palivo dopĺňa len na čerpacích staniciach, Elektro len na nabíjacích, Oboje na oboch.',
  'help.guide.roadtrip-limits.step.4':
    'Zadajte Dojazd na jednu nádrž alebo Dojazd na jedno nabitie sami. Alebo otvorte Vypočítať z auta pod Natankovať na: zadáte Objem nádrže a Spotreba, alebo Batéria, Spotreba a Opotrebenie batérie, a dojazd sa vypočíta.',
  'help.guide.roadtrip-limits.step.5':
    '„Vyhnúť sa, ak je to možné“ v ľavom stĺpci je preferencia, nie zákaz: ak deň nemá inú možnosť, cestu aj tak použije a v hlavičke zobrazí poznámku.',
  'help.guide.roadtrip-limits.step.6':
    'Kliknite na Zavrieť. Odznaky na karte ukazujú, čo je nastavené, a lišta označí každý úsek a každý deň, ktorý limit prekračuje.',
  'help.guide.roadtrip-limits.result':
    'Odznaky karty ukazujú, čo je nastavené, a každý úsek a deň nad limitom má na lište odznak.',
  'help.guide.roadtrip-limits.tip.1':
    'Nastavenia patria k ceste, takže všetci jej účastníci plánujú s tým istým autom a rovnakými limitmi.',
  'help.guide.roadtrip-limits.tip.2':
    'Natankovať na určuje, na koľko sa pri zastávke naplní nádrž alebo batéria, pretože na ceste nikto nenabíja na 100 %. Zastávka s tankovaním alebo nabíjaním to môže prepísať odznakom batérie na svojom riadku.',
  'help.guide.roadtrip-limits.tip.3':
    'V časti Čiara trasy Prepojiť dni vedie trasu aj z poslednej zastávky jedného dňa na prvú zastávku nasledujúceho dňa. Začať a ukončiť každý deň v ubytovaní začína a končí každý deň v ubytovaní rezervovanom na tieto noci. Farba na každý deň zobrazí každý deň vlastnou farbou.',
  // roadtrip-day-window
  'help.guide.roadtrip-day-window.title': 'Nastavenie začiatku a konca jazdného dňa',
  'help.guide.roadtrip-day-window.goal': 'Skončite s jazdou v čase, ktorý si zvolíte, a určte, kde sa má deň skončiť.',
  'help.guide.roadtrip-day-window.step.1':
    'Otvorte Nastavenie jazdy v pravom stĺpci a v ľavom stĺpci dialógu nájdite Denné časy cestovania.',
  'help.guide.roadtrip-day-window.step.2':
    'Nastavte „Čas začiatku dňa“. Samotný nič nerobí: ako uvádza poznámka pod poľami, potrebné sú oba časy.',
  'help.guide.roadtrip-day-window.step.3':
    'Nastavte Čas konca dňa. Jazda sa teraz v tomto čase zastaví a pokračuje nasledujúce ráno, čo je v bočnom stĺpci zobrazené ako riadok Koniec dňa a riadok Pokračovať v ceste.',
  'help.guide.roadtrip-day-window.step.4':
    'Pod Ukončiť deň vyberte Pozdĺž trasy, ak sa má jazda v čase konca zastaviť na ceste, alebo Na poslednom mieste, ak sa má zastaviť skôr, než by ďalšia jazda toto miesto minula.',
  'help.guide.roadtrip-day-window.step.5':
    'Kliknite na „Uzavrieť“. Karta „Nastavenie jazdy“ ukáže oba časy ako odznak.',
  'help.guide.roadtrip-day-window.result':
    'Jazda sa rozdelí na cestovné dni s nastavenou dĺžkou a čo sa nezmestí, pokračuje vo vypočítaných dňoch po poslednom dni. Vaše dni a ich miesta sa nezmenia.',
  'help.guide.roadtrip-day-window.tip.1':
    'Ak vymažete niektorý z časov, funkcia sa znova vypne. Časy, ktoré nastavíte sami pri zastávke, majú vždy prednosť.',
  'help.guide.roadtrip-day-window.tip.2':
    'Keď sú nastavené denné časy cestovania, dni sú vždy prepojené: jazda z poslednej zastávky jedného dňa na prvú zastávku ďalšieho dňa sa vypočíta a započíta.',
  'help.guide.roadtrip-day-window.tip.3':
    'Koniec každého dňa je aj značka na mape: mesiac s číslom dňa. Potiahnutím po trase alebo na miesto ukončíte deň inde. Pravým tlačidlom myši naň obnovíte automatický koniec. Obnoviť automatické konce dní v tomto dialógu vráti všetky tieto zmeny. Ak chcete deň ukončiť pri jednej zastávke, kliknite na zastávku a v jej karte zapnite Ukončiť deň tu.',
  // roadtrip-refuel
  'help.guide.roadtrip-refuel.title': 'Tankovanie skôr, než dôjde palivo',
  'help.guide.roadtrip-refuel.goal':
    'Nájdite miesto na tankovanie na úseku, kam auto ešte dôjde, a pridajte ho do jazdy.',
  'help.guide.roadtrip-refuel.step.1':
    'Ak je nastavený dojazd, bočný stĺpec ukazuje na úseku, kde dôjde palivo alebo batéria, pás: Tu dôjde palivo, alebo pri elektromobile Tu dôjde batéria. Pod ním vidíte, ako ďaleko v úseku to je.',
  'help.guide.roadtrip-refuel.step.2':
    'Ikona lampy na páse je tlačidlo: Nájsť palivo, alebo Nájsť nabíjačku pri elektromobile. Hľadá pozdĺž cesty pred týmto bodom a počas hľadania ukazuje Hľadá sa pozdĺž trasy…',
  'help.guide.roadtrip-refuel.step.3':
    'Zobrazia sa najviac tri čerpacie stanice, každá so vzdialenosťou od trasy a dojazdom, ktorý by vám ešte zostal.',
  'help.guide.roadtrip-refuel.step.4':
    'Plus pri ponuke ju pridá ako zastávku na tankovanie. Pridať ako zastávku sa otvorí s už vyplneným typom a časom a Pridať ju zaradí na úsek v bode, kde trasa okolo nej naozaj vedie.',
  'help.guide.roadtrip-refuel.result':
    'Zastávka sa zobrazí na správnom úseku s vlastnou ikonou a dojazd sa od tejto zastávky počíta znova. Pás sa posunie na miesto, kde bude nádrž teraz prázdna, alebo zmizne, ak dosiahnete koniec jazdy bez ďalšej zastávky.',
  'help.guide.roadtrip-refuel.tip.1':
    'Dojazd sa počíta od poslednej zastávky na tankovanie alebo nabíjanie, aj naprieč dňami. Typ vozidla určuje, ktoré zastávky sa počítajú: pri možnosti „Palivo“ len čerpacie stanice, pri „Elektro“ len nabíjacie.',
  'help.guide.roadtrip-refuel.tip.2':
    'Vyhľadávanie prezerá cestu pred bodom, kde dôjde palivo, počíta s rezervou a obchádzku započíta dvakrát, takže každé ponúknuté miesto je naozaj dosiahnuteľné.',
  'help.guide.roadtrip-refuel.tip.3':
    'Ak nie sú žiadne výsledky, môžete hľadať znova: lampa sa zmení na Skúsiť znova, pretože vyhľadávanie miest je zdieľaná služba, ktorej občas vyprší časový limit.',
  // roadtrip-track
  'help.guide.roadtrip-track.title': 'Prispôsobenie dňa importovanej stope',
  'help.guide.roadtrip-track.goal':
    'Použite na jazdu dňa malebnú trasu, ktorú ste importovali ako stopu GPX alebo KML.',
  'help.guide.roadtrip-track.step.1': 'Kliknite na štítok Stopa v hlavičke dňa. Dialóg sa otvorí pre tento deň.',
  'help.guide.roadtrip-track.step.2':
    'Vyberte stopu. Pri každej je uvedená jej dĺžka a to, či vedie pozdĺž trasy tohto dňa, alebo ako ďaleko od nej je. Najbližšia stopa je prvá.',
  'help.guide.roadtrip-track.step.3':
    'Kliknite na „Sledovať túto stopu“. TREK pridá prejazdné body tam, kde sa jazda od stopy najviac vzďaľuje, znova vypočíta trasu a niekoľkokrát to zopakuje.',
  'help.guide.roadtrip-track.step.4':
    'Dialóg uvedie, koľko priechodných bodov bolo umiestnených a ako tesne sa jazda teraz drží stopy, prípadne že jazda stopu už sledovala. „Zahodiť priechodné body“ vľavo dole ich odstráni a trasa dňa sa naplánuje znova. Zatvorením dialógu stopu ponecháte.',
  'help.guide.roadtrip-track.result':
    'Jazda v daný deň vedie po stope namiesto cesty, ktorú by zvolil plánovač trasy. Keď prejdete myšou nad štítok „Stopa“, uvidíte názov stopy. Ak jazdu na stope držia prejazdné body, štítok je navyše zvýraznený.',
  'help.guide.roadtrip-track.tip.1':
    'Dialóg vypíše miesta cesty, ktoré majú dráhu: GPX alebo KML importované cez Importovať súbor v stĺpci miest pod Dni, pri GPX so zaškrtnutými Trasy alebo Trasy GPS (s geometriou cesty), pri KML s Cesty (LineStrings). Importovať súbor sa ponúka, iba kým je doplnok Túry vypnutý. Keď je Túry zapnutý, GPX sa stane túrou, ktorú tento dialóg nevypisuje. Kým cesta nemá stopu, žiadny deň odznak nenesie.',
  'help.guide.roadtrip-track.tip.2':
    'Sledovanie stopy nahradí priechodné body, ktoré úseky dňa už mali, preto úsek upravte ručne až po stope, nie pred ňou.',
  'help.guide.dateless-trip.step.1': 'Kliknite na „Nová cesta“ a zadajte názov cesty.',
  'help.guide.edit-trip.tip.2':
    'Spolucestujúci, ktorých tu pridáte alebo odoberiete, sa zmenia hneď, bez kliknutia na „Aktualizovať“.',
  'help.guide.trip-reminder.result':
    'Pripomienka vám príde zvolený počet dní pred začiatkom cesty, a to cez kanály, na ktoré dostávate oznámenia.',
  'help.guide.upcoming-reservations.step.1':
    'V pravom stĺpci nájdete „Nadchádzajúce rezervácie“. Je tam šesť najbližších rezervácií zo všetkých vašich ciest, od najskoršej, s dátumom, časom a typom.',
  'help.guide.half-company-holiday.step.1': 'Na paneli nástrojov prepnite na „Firemné voľno“.',
  'help.guide.edit-holiday-calendar.result': 'Mriežka aj legenda sa po každej zmene hneď aktualizujú.',
  'help.guide.person-color.result': 'Všetky dni, ktoré má osoba zapísané, sa teraz zobrazujú novou farbou.',
  'help.guide.answer-fusion-request.step.1':
    'Keď vás niekto pozve, otvorte Dovolenku (Vacay). Dialóg „Žiadosť o prepojenie“ sa otvorí sám.',
  'help.guide.log-for-partner.step.1': 'V karte „Osoby“ kliknite na meno osoby. Zaškrtnutie znamená, že je vybraná.',
  'help.guide.dissolve-fusion.step.1': 'Otvorte „Nastavenia“.',
  'help.guide.country-places.step.2': 'V karte kliknite na odznak miest, ten so špendlíkom.',
  'help.guide.search-place.tip.2': 'Ak je región už označený, okno sa namiesto toho opýta, či ho chcete odstrániť.',
  'help.guide.tour-activity-stats.step.4':
    'Odznaky vpravo ukazujú, z čoho súčty vychádzajú: „Plánované na“ pre túry započítané podľa plánu cesty, „Zaznamenané“ pre túry s prepojenou skutočnou stopou. „Ešte pred tebou“, „Bez dňa“ a „Bez dátumu“ počítajú túry, ktoré zatiaľ zahrnuté nie sú. Ikona i vysvetľuje pravidlo.',
  'help.guide.move-to-list.step.2':
    'Kliknite na „Duplikovať do zoznamu“, ak ich tu chcete ponechať, alebo na „Presunúť do zoznamu“, ak ich chcete z tohto zoznamu odobrať.',
  'help.guide.accept-list-invite.title': 'Prijatie pozvánky do zoznamu',
  'help.guide.tour-collection-add-to-trip.step.3':
    'V časti „Trasové body“ vyberte dlaždicu s trasovými bodmi, ak chcete pridať štart, zastávky a cieľ v ich poradí, alebo „Len línia“, ak chcete pridať iba uloženú líniu.',
  'help.guide.tour-collection-manage.step.1':
    'Otvorte zoznam. Pri každej uloženej túre vidíte jej náročnosť, typ, cestu, z ktorej bola uložená, vzdialenosť a prevýšenie a počet trasových bodov. Keď nabehnete myšou na názov cesty, uvidíte, kto túru uložil.',
  'help.guide.entry-draft.step.1': 'V editore v pravom stĺpci zapnite „Koncept“.',
  'help.guide.journey-map-layers.step.3':
    'Kliknite na mape na prázdny špendlík alebo malú bodku. Karta ukáže, o čo ide: naplánované miesto a jeho deň, alebo pobyt s tlačidlom „Otvoriť záznam“, ktoré vás prenesie na dennú správu, ku ktorej patrí.',
  'help.guide.journey-keep-route.step.3': 'Kliknite na „Uložiť trasu“.',
  'help.guide.journey-day-stays.step.3':
    'Pri pobyte, ktorý nechcete, kliknite na „Tu som nebol“. Pobyt zo zoznamu zmizne.',
  'help.guide.journey-take-over-day.step.3':
    'Ak chcete jeden záznam na celý deň, prepnite „Záznamy“ na „Denná správa“: jeden záznam potom obsahuje všetky vybrané pobyty s ich časmi.',
  'help.guide.journey-auto-prepare.step.2':
    'V časti „Zaznamenané dni“ zapnite „Automaticky pripravovať zaznamenané dni“.',
  'help.guide.photo-location.step.2': 'V časti „Fotky“ zapnite „Umiestniť záznamy podľa ich fotiek“.',
  'help.guide.link-trip.tip.3':
    'Ak píšete záznam k dňu cesty, ktorá ešte nie je prepojená, editor vám priamo v zázname ponúkne „Prepojiť cestu“.',
  'help.ctx.settings-plugins.summary':
    'Vaše vlastné nastavenia pluginov, ktoré nainštaloval správca: kľúče a predvoľby, ktoré od vás jednotlivé pluginy žiadajú, a záznam o tom, čo pluginy urobili vo vašom mene. Karta sa zobrazuje, iba kým je aktívny nejaký plugin.',
  'help.ctx.settings-about.bullet.3':
    'Cez Ko-fi, Buy Me a Coffee a Discord môžete TREK podporiť alebo sa porozprávať s ľuďmi, ktorí ho tvoria.',
  'help.guide.language-region.step.3':
    'Nastavte „Zobrazovaná mena“, alebo ponechajte „Mena cesty“, aby sa každá cesta zobrazovala vo svojej vlastnej mene. Potom vyberte „Jednotky teploty“, „Jednotky vzdialenosti“, „Formát času“ a deň, ktorým „Týždeň začína“.',
  'help.guide.travel-map-prefs.step.3':
    '„Objavovať miesta na mape“ zobrazí panel kategórií na hľadanie miest v okolí. „Skryť rezervačné kódy“ skryje potvrdzovacie čísla, kým na ne nenabehnete myšou alebo neťuknete. „Optimalizovať trasu od ubytovania“ začne aj ukončí deň vo vašom hoteli.',
  'help.guide.web-push-device.step.2':
    'V karte „Oznámenia“ hore určuje stĺpec Push, ktoré udalosti sa posielajú na vaše zariadenia.',
  'help.guide.connect-airtrail.goal': 'Nechajte TREK importovať a synchronizovať lety z vášho vlastného AirTrail.',
  'help.guide.connect-dawarich.goal': 'Nechajte TREK zistiť z vášho vlastného Dawarich, kde ste naozaj boli.',
  'help.guide.tour-connect-wanderer.goal':
    'Nechajte TREK načítať trasy z vášho vlastného wanderer, aby ste ich mohli importovať ako túry.',
  'help.guide.tour-wanderer-watch.title': 'Upozornenie na zmeny vašich trás vo wanderer',
  'help.guide.plugin-settings.tip.2':
    'Kanál pluginu v časti „Oznámenia“ má tlačidlo „Nastaviť“, ktoré otvorí túto stránku.',
  'help.guide.default-user-settings.result':
    'Vaše voľby uvidia nové účty a všetci, ktorí tieto nastavenia nikdy nezmenili.',
  'help.guide.own-routing-engine.goal':
    'Plánujte trasy dní a road tripov cez vlastný server OSRM alebo Valhalla namiesto verejných.',
  'help.guide.admin-passkeys.tip.1':
    'Ak TREK zatiaľ nevie určiť doménu, zobrazí upozornenie a prístupové kľúče zostanú skryté, kým nenastavíte APP_URL alebo Relying Party ID.',
  'help.guide.rotate-jwt-secret.step.1':
    'Dole na karte „Nastavenia“ v časti „Nebezpečná zóna“ kliknite na „Obnoviť“ pri položke „Obnoviť tajný kľúč JWT“.',
  'help.guide.storage-backends.tip.3':
    'Cache fotiek si TREK vie stiahnuť znova, takže ich zrkadlenie zvyčajne len zaberá miesto.',
  'help.guide.admin-channels.step.3':
    'V karte „Oznámenia“ nižšie vyberte pri každej udalosti, cez ktoré kanály sa pošle: „Nová verzia k dispozícii“, „Zlyhanie repliky úložiska“ a „Vyžiadaný vodácky región“. Každý prepínač sa uloží hneď.',
  'help.guide.notification-defaults.tip.1':
    '„Vypnuté“ je predvolená hodnota, ktorú si každý používateľ môže zapnúť; „Blokované“ ju vypne pre všetkých.',
  'help.ctx.notifications.bullet.4':
    'Vedľa času každého oznámenia sú „Označiť ako prečítané“ (dvojité zaškrtnutie) a „Vymazať“ (kôš), ktoré platia iba pre toto oznámenie. „Označiť všetko ako prečítané“ a „Zmazať všetko“ hore platia pre celý zoznam.',
  'help.guide.read-notifications.tip.2':
    'Oznámenie bez tlačidla je iba informatívne. Prečítajte si ho v paneli a tam ho aj označte ako prečítané.',
  'help.guide.filter-notifications.result': 'V zozname je iba to, čo je ešte neprečítané, od najnovšieho.',
  'help.guide.delete-notifications.title': 'Vymazanie oznámení',
  'help.guide.notification-settings.goal':
    'Rozhodnite, ktoré udalosti sa zobrazia pod zvončekom a ktoré vám prídu aj e-mailom, webhookom, cez ntfy alebo push.',
  'help.guide.public-link.step.4': 'Kliknite na „Vytvoriť odkaz“, potom na „Kopírovať“ a odkaz pošlite.',
  'help.guide.link-journal.step.2':
    'Kliknite na „Prepojiť denník“ a v okne „Vyberte denník“ zvoľte jeden zo svojich denníkov.',
  'help.guide.dawarich-stays.title': 'Zaznamenaný pobyt ako miesto',
  'help.guide.dawarich-stays.tip.2':
    'Ak vymažete miesto, ktoré vzniklo z pobytu, pobyt sa vráti do zoznamu ako čakajúci.',
  'help.guide.leave-stop-off-route.goal':
    'Nechajte zastávku v dni bez toho, aby k nej viedla trasa, napríklad pri mieste, ktoré prejdete pešo alebo ho chcete mať iba na mape.',
  'help.guide.day-route.tip.4': 'Ak chcete zastávku v dni, ale nie na trase, vyberte v jej ponuke „Vynechať z trasy“.',
  'help.guide.move-booking-day.step.2':
    'Potiahnite riadok na hlavičku karty iného dňa. Jednodňová rezervácia sa presunie na ten deň celá. Pri rezervácii na viac dní posúva riadok „Odlet“ deň začiatku a riadok „Prílet“ deň konca.',
  'help.guide.place-image-from-file.title': 'Priložená fotka ako obrázok miesta',
  'help.guide.place-image-from-file.tip.2': 'Ponúkne sa aj fotka pripnutá k zastávke alebo priložená k jej rezervácii.',
  'help.guide.place-own-hours.step.5':
    'Kliknite na „Aktualizovať“. Karta teraz pod „Otváracie hodiny“ ukazuje vaše hodiny a podľa nich sa riadi aj „Otvorené“ alebo „Uzavreté“ hore.',
  'help.guide.confirm-stay-booking.step.3':
    'Kliknite hore na „Čaká na potvrdenie“. Popis tlačidla ukazuje „Nastaviť na Potvrdené“ a bodka sa zmení na zelenú.',
  'help.guide.map-nearby-places.tip.4':
    'Kategória, ktorej vyhľadávanie zlyhalo, dostane červenú bodku a „Hľadať v tejto oblasti“ sčervenie a zobrazí výstražnú značku: kliknutím to skúsite znova.',
  'help.guide.tour-map-lines.tip.1': 'Keď v stĺpci dní zbalíte deň, jeho túry a zastávky sa na mape skryjú.',
  'help.guide.car-stops.step.3':
    'Do hlavičky zadajte názov. V časti „Trasa“ vyberte v poli „Od“, kde auto preberiete, a v poli „Do“, kde ho vrátite; miesta cesty sa ponúknu ešte skôr, než začnete písať. „Vyzdvihnutie“ a „Čas vyzdvihnutia“ určujú, kedy auto preberiete, „Vrátenie“ a „Čas vrátenia“, kedy ho vrátite.',
  'help.guide.transport-details.step.1':
    'Na karte „Doprava“ kliknite na kartu jazdy. Jej podrobnosti sa otvoria nad kartou, s hlavičkou v rovnakej farbe ako karta. Rovnaké podrobnosti otvorí aj riadok dopravy v pláne dňa.',
  'help.guide.export-transports-csv.tip.2':
    'Karta „Rezervácie“ má rovnakú ikonu a vytvorí vlastný súbor, ktorého názov končí na bookings.csv.',
  'help.guide.group-sort-bookings.step.2':
    'V časti „Zoskupiť podľa“ vyberte „Stav“, „Deň“, „Typ“ alebo „Bez zoskupenia“. Karta sa do týchto sekcií hneď roztriedi.',
  'help.guide.export-bookings-csv.result':
    'Prehliadač stiahne súbor pomenovaný podľa cesty a karty, napríklad autumn-in-japan-bookings.csv, s jedným riadkom za každú rezerváciu, ktorú karta zobrazovala.',
  'help.guide.arrange-packing-list.result':
    'Zoznamy sú v poradí, do akého ste ich potiahli, a položky sú zoradené od A po Z, kým to nevypnete. TREK si vaše vlastné poradie stále pamätá.',
  'help.guide.count-packed-pieces.step.2':
    'Pred množstvom sa objaví počítadlo: 0/5, s mínusom a plusom. Za každý kus, ktorý dáte do tašky, kliknite na plus.',
  'help.guide.expense-receipts.step.4':
    'V prehľade má teraz riadok vedľa názvu štítok „Účtenka“, a ak je účteniek viac, aj ich počet v zátvorke. Kliknutím účtenku otvoríte.',
  'help.guide.final-budget.tip.3':
    'Kto z cesty odišiel, má v „Zostatky“ a „Konečný rozpočet“ riadok dovtedy, kým mu niekto dlží peniaze alebo on dlží niekomu.',
  'help.guide.files-sync-settings.step.2':
    'Lišta toku ukazuje TREK a vaše úložisko s dokumentmi, ktoré každé z nich obsahuje, a medzi nimi dva smery: „Do úložiska“ a „Z úložiska“. Kliknutím na „Do úložiska“ ho vypnete. Smer zosivie a v riadku pod ním je „Only coming in“. Ďalším kliknutím ho znova zapnete.',
  'help.guide.files-sync-settings.tip.4':
    'Nič z toho nemôže zmeniť nikto okrem vlastníka cesty alebo správcu. Ostatní členovia vidia lištu toku s riadkom ako „Documents move both ways“, ale bez „Nastavenia“.',
  'help.guide.manage-notes.step.2':
    '„Rozbaliť“ otvorí celú poznámku: celý text, jej „Webová stránka“ a „Súbory“. Kliknutím na súbor zobrazíte jeho náhľad. „Upraviť“ dole prepne rovno do editora; krížik vpravo hore poznámku znova zavrie.',
  'help.guide.note-categories.goal':
    'Dajte poznámkam skupiny pomenované farebné kategórie a zobrazujte vždy iba jednu kategóriu.',
  'help.guide.note-categories.tip.1':
    'Kôš odstráni iba kategóriu, ktorú nepoužíva žiadna poznámka. Kategória, ktorú poznámky ešte používajú, zostane v zozname, kým tieto poznámky nepresuniete do inej kategórie.',
  'help.guide.roadtrip-reorder.title': 'Zmena poradia zastávky alebo presun na iný deň',
  'help.guide.roadtrip-reorder.tip.3':
    'Pri čase, ktorý ste pripli, sa TREK nepýta: lišta deň hneď prepočíta a označí každú zastávku, na ktorú sa už nedá dostať včas.',
  'help.guide.roadtrip-overnight.step.3':
    'Hore v dialógu pridá „Nocľah“ prenocovanie a „Prestávka“ z miesta urobí zastávku na chvíľu. Hotel sa otvorí s voľbou „Nocľah“, kemp s voľbou „Prestávka“. Pri noci sa vyžaduje iba Check-in a aj ten môžete nechať prázdny.',
  'help.guide.roadtrip-stop-fill.step.1':
    'Pri zastávke na tankovanie alebo nabíjanie na lište kliknite na odznak batérie. Ukazuje úroveň, na ktorú zastávka dopĺňa: vyblednutý, kým platí vaša hodnota „Natankovať na“, plný, keď má zastávka vlastnú hodnotu.',
  'help.guide.roadtrip-bookings.step.1':
    'Zarezervujte jazdu ako rezerváciu typu „Let“, „Vlak“, „Trajekt“, „Plavba“ alebo „Autobus“ v jej deň, s určenými oboma koncami. Jazda ju započíta automaticky: cesta autom končí na termináli, odkiaľ spoj odchádza, a pokračuje tam, kam prichádza.',
  'help.guide.roadtrip-google-import.result':
    'Zastávky trasy sa pridajú za poslednú zastávku daného dňa a trasa na lište aj na mape vedie cez ne.',
  'help.guide.roadtrip-hazards.step.3':
    'Upozornenia sú na mape vyznačené ako oblasti. Kliknutím na jednu zistíte, čoho sa týka, ktorá služba ju nahlásila a kedy bola naposledy aktualizovaná.',
  'help.ctx.trip-tours.bullet.2':
    'Hore „Importovať GPX alebo KML“ pridá súbory ako túry. Tlačidlo filtra pod ním (na začiatku „Všetky“ s počtom túr) zužuje zoznam podľa stavu, zdroja, limitu trasovania a typu.',
  'help.guide.tour-show-list.step.2':
    'Každý riadok je jedna túra. Farebný pruh je jej čiara na mape a okrúhla dlaždica ukazuje limit trasovania (T1 až T6) pri túre naplánovanej v TREK alebo ikonu jej typu. Odznaky pod názvom ukazujú dni, na ktorých je, jej čas, vzdialenosť a stúpanie. Pri viacdňovej túre ukazuje mesiac s číslom, koľko má etáp.',
  'help.guide.tour-add-to-day.title': 'Zaradenie túry na deň',
  'help.guide.tour-add-to-day.tip.2':
    'Ak cesta skončí skôr ako posledná etapa, voľba ukáže poslednú etapu, ktorá sa ešte zmestí, a etapy po nej zostanú bez dňa.',
  'help.guide.tour-day-times.step.3':
    'Kliknite na „Aktualizovať“. Riadok teraz ukazuje začiatok → koniec. Vypočítaný koniec je svetlejší, so znakom ≈ pri odhade, ≥ kým pobyt ešte nemá čas, a +1 po polnoci. Keď naň nabehnete myšou, uvidíte, ako bol vypočítaný.',
  'help.guide.tour-remove-from-day.goal': 'Zrušte naplánovanie túry bez toho, aby ste ju vymazali.',
  'help.guide.tour-filter-list.goal':
    'Zúžte dlhý zoznam na túry, ktoré chcete: ešte nenaplánované, zo súboru, jedného typu.',
  'help.guide.tour-filter-list.result': 'V zozname sú iba vyfiltrované túry; ostatné zostávajú v ceste.',
  'help.guide.tour-hide-on-map.result': 'Na mape sú iba túry, ktoré chcete, a skryté zostávajú v zozname stlmené.',
  'help.guide.tour-import-plan-tab.result':
    'Stopa je teraz túrou cesty: riadkom v zozname s odznakom GPX a čiarou na mape.',
  'help.guide.tour-detail-read.title': 'Otvorenie túry a jej karta',
  'help.guide.tour-detail-read.step.7': 'Kartu zavriete krížikom hore alebo klávesom Escape.',
  'help.guide.tour-rename-colour.goal':
    'Dajte túre názov, ktorý spoznáte, a farbu čiary, ktorá je na mape dobre vidieť.',
  'help.guide.tour-take-along.title': 'Stiahnutie túry do telefónu alebo GPS',
  'help.guide.tour-take-along.tip.4':
    'Na karte „Túry“ je rovnaké stiahnutie hore v ľavom stĺpci. Ak má túra neuložené zmeny, pred stiahnutím vás vyzve, aby ste ju najprv uložili.',
  'help.guide.tour-copy-keep.tip.1':
    'Obe sú kópie: neskoršie zmeny túry nezmenia ani kópiu, ani verziu, ktorú ste uložili do zbierky.',
  'help.guide.tour-packing-link.step.2':
    'V časti „Prepojiť s“ vyberte „Celý zoznam vecí“ alebo jeden z jeho zoznamov. Pri každom riadku vidíte, koľko položiek obsahuje.',
  'help.guide.tour-files.title': 'Priloženie súborov k túre',
  'help.guide.tour-activity-link.title': 'Prepojenie stopy, ktorú ste naozaj prešli',
  'help.guide.tour-activity-link.tip.2':
    'Prepojiť môžete iba importovanú stopu, z ktorej ste neplánovali túru, a každú stopu môžete prepojiť iba s jednou túrou.',
  'help.guide.tour-activity-compare.step.4':
    '„Zmeniť“ pod stopou vyberie iný záznam. „Odpojiť“ ju z túry odoberie a stopa zostane v ceste ako import.',
  'help.guide.tour-origin-check.step.3':
    'Pri túre, ktorú ste nakreslili na karte „Túry“, je „Naplánované v TREK“ s dňom, keď bola vytvorená („Vytvorené“).',
  'help.ctx.trip-tour-planner.bullet.2':
    'Ľavý panel je editor. Keď nie je nič otvorené, ponúka „Naplánovať novú túru“. Pri otvorenej túre ukazuje jej názov, typ, trasové body, karty pre jej typ a podrobnosti, dole s tlačidlami „Zahodiť“ a „Uložiť“.',
  'help.guide.tour-open-workspace.step.2':
    'Ľavý panel je editor. Keď nie je otvorená žiadna túra, ponúka „Naplánovať novú túru“, čím začnete novú túru na mape.',
  'help.guide.tour-open-workspace.tip.3':
    'Ak otvoríte inú túru, kým má editor neuložené zmeny, najprv sa opýta: „Zahodiť zmeny“, alebo pokračovať v úpravách.',
  'help.guide.tour-draw-route.step.5':
    'Klikajte na ďalšie miesta v poradí, v akom ich prejdete. Každé kliknutie pridá bod ako nový koniec a od dvoch bodov TREK naplánuje trasu po chodníkoch.',
  'help.guide.tour-type-profile.goal':
    'Vyberte typ túry a pri cyklotúre aj jej profil, aby trasa viedla po správnych cestách.',
  'help.guide.tour-edit-points.title': 'Presun, zmena poradia a odstránenie bodov',
  'help.guide.tour-edit-points.tip.1':
    'Prvý bod má odznak „Začiatok“ a posledný „Do“. Keď bod presuniete úplne hore alebo dole, stane sa začiatkom alebo koncom.',
  'help.guide.tour-shaping-points.step.4':
    'Ak chcete zo zastávky urobiť tvarovací bod alebo naopak, otvorte v jej riadku „Ďalšie akcie“ a vyberte „Urobiť tvarovacím bodom“ alebo „Urobiť zastávkou“.',
  'help.guide.tour-loop-reverse.step.2':
    'V poslednom riadku je teraz „Späť na štart“ a trasa na mape končí tam, kde začala.',
  'help.guide.tour-leg-by-hand.step.1':
    'Pri bode, kde úsek začína, otvorte „Ďalšie akcie“ a vyberte „Nakresliť ďalší úsek ručne“.',
  'help.guide.tour-trip-places.goal': 'Pridajte miesto, ktoré už máte v ceste naplánované, ako zastávku túry.',
  'help.guide.tour-trip-places.result': 'Túra má novú zastávku pre miesto cesty s rovnakým názvom.',
  'help.guide.tour-details-times.tip.2':
    'Pri pešej túre sú v „Podrobnostiach“ aj „Maximálna náročnosť chodníka“ a „Voľba trasy“, ktoré vysvetľujú návody k pešej turistike. Prechádzka mestom nemá „Prestávky“: namiesto nich sa započíta čas strávený na zastávkach.',
  'help.guide.tour-save.step.4': 'Túra je teraz v zozname „Túry tejto cesty“, zatiaľ bez dňa.',
  'help.guide.tour-edit-saved.step.2':
    'Zmeňte, čo potrebujete, rovnako ako pri novej túre: presuňte alebo pridajte body, prepnite typ alebo upravte podrobnosti, ako tu „Popis“.',
  'help.guide.tour-summary-profile.goal': 'Zistite, aká dlhá a strmá je túra a v ktorom mieste trasy je aká výška.',
  'help.guide.tour-summary-profile.result':
    'Viete, aká dlhá je túra, koľko na nej nastúpate, ako dlho trvá a kde je strmá.',
  'help.guide.tour-list-manage.tip.1':
    'Každá túra sa do súčtov započíta raz, aj keď je na viacerých dňoch. Súčet so znakom ≥ pred číslom niektoré túry nezahŕňa. Keď naň nabehnete myšou, uvidíte koľko.',
  'help.guide.tour-delete.tip.1': 'Táto akcia sa nedá vrátiť a ani „Vrátiť späť“ túru neobnoví.',
  'help.guide.tour-saved-elsewhere.step.3':
    'Ak aj tak kliknete na „Uložiť“, otvorí sa namiesto toho „Medzitým zmenené“ a nič sa neprepíše.',
  'help.ctx.trip-tour-import.bullet.2':
    '„Náhľad importu“ ukáže každú stopu zo súborov na mape so vzdialenosťou, stúpaním, klesaním a bodmi, skôr než sa čokoľvek uloží. V časti „Importovať ako“ určíte, čo stopy sú.',
  'help.guide.tour-import-gpx.step.3':
    'Otvorí sa „Náhľad importu“ a zatiaľ sa nič neuloží. Mapa ukazuje celý priebeh a každá stopa zo súborov je očíslovaný riadok so vzdialenosťou, stúpaním, klesaním a bodmi. Pri zaznamenanej stope vidíte aj to, kedy vznikla a ako dlho trvala.',
  'help.guide.tour-import-gpx.result':
    'Túra je v zozname „Túry tejto cesty“, zatiaľ bez dňa. Ak je iba jedna, hneď sa otvorí na mape ako „Túra z GPX“.',
  'help.guide.tour-view-import.tip.3': 'Trasa z wanderer sa otvorí rovnako, ako „Túra z aplikácie wanderer“.',
  'help.guide.tour-plan-from-import.tip.1': '„Zahodiť“ návrh odstráni. Kým neuložíte, nič sa neuchová.',
  'help.guide.tour-restore-recorded.step.2': 'Kliknite na „Obnoviť zaznamenanú stopu“.',
  'help.guide.tour-take-over.step.2': 'Vyberte „Prevziať túru z inej cesty“.',
  'help.guide.tour-take-over.result':
    'Správa potvrdí prevzatie a túra sa otvorí v editore, pripravená na zaradenie na deň.',
  'help.guide.tour-import-wanderer.tip.2':
    'Import je kópia: neskoršie zmeny vo wanderer túru nezmenia. „Skontrolovať zdroj“ v časti „Pôvod“ túry vám povie, keď sa trasa zmenila.',
  'help.ctx.trip-tour-map.bullet.3':
    '„Hľadať miesto alebo adresu“ hore na mape presunie mapu na obec, chatu alebo vrchol bez toho, aby sa do túry čokoľvek pridalo.',
  'help.guide.tour-map-layers.result':
    'Túra je vykreslená na mape, ktorá sa k nej hodí, a štítok ukazuje, ktorá mapa je zapnutá.',
  'help.guide.tour-along-search.step.3':
    'V časti „Do tejto vzdialenosti od trasy“ vyberte, ako ďaleko od čiary hľadať: 250 m, 500 m, 1 km alebo 2 km.',
  'help.guide.tour-along-add-stop.goal': 'Veďte túru cez vyhliadku, chatu alebo prameň, ktorý ste popri nej našli.',
  'help.guide.tour-along-add-stop.tip.3':
    'Úsek, do ktorého sa zastávka pridať nedá (ferata alebo prenáška pridaná ako pevná čiara, prípadne ručne nakreslený úsek), zostane v zozname stlmený a vedľa je uvedený dôvod.',
  'help.guide.tour-3d-terrain.result':
    'Videli ste túru na 3D teréne so strmými úsekmi farebne a na plánovanie máte opäť plochú mapu.',
  'help.guide.tour-3d-flyover.step.3':
    '„Prestávka“ zastaví prelet tam, kde práve je, a „Prehrať prelet“ odtiaľ pokračuje. „Od začiatku“ sa vráti na začiatok a spustí prelet znova.',
  'help.guide.tour-map-overlays.step.1':
    'Na karte „Túry“ otvorte lyžiarsku túru. Zjazdovky sú zapnuté hneď od začiatku: ich prepínač je zasnežená hora v paneli vľavo dole, „Zjazdovky, bežecké trate a vleky“. Kliknutím ich na mape skryjete a ďalším kliknutím znova zobrazíte.',
  'help.ctx.trip-tour-stages.title': 'Viacdňové túry',
  'help.guide.tour-multi-day.goal': 'Rozdeľte jednu trasu na etapy, jednu na každý deň, keď ste na cestách.',
  'help.guide.tour-multi-day.tip.2':
    'Ak chcete dve etapy znova spojiť, vyberte v ponuke zastávky s mesiacom „Odobrať koniec etapy“. Spojí ich aj odstránenie tejto zastávky a v oznámení sa ponúkne „Vrátiť späť“.',
  'help.guide.tour-stages-on-days.step.3':
    'Vyberte „Etapy od tohto dňa“: etapa 1 pripadne na tento deň a každá ďalšia na nasledujúci. „Celá trasa v tento deň“ namiesto toho zaradí celú trasu na tento jediný deň.',
  'help.guide.tour-stages-on-days.result':
    'Každá etapa je na svojom dni cesty a etapa, ktorú ste otvorili, je v editore.',
  'help.ctx.trip-tour-hike.bullet.6':
    '„Prehľad túry“ vpravo uvádza vzdialenosť, stúpanie, odhadovaný čas chôdze alebo behu, prestávky a plánovaný celkový čas a pod nimi výškový profil. „Uložiť“ dole v editore túru uloží.',
  'help.guide.tour-hike-plan.step.6': 'Kliknite na „Uložiť“ dole v ľavom stĺpci.',
  'help.guide.tour-hike-trail-details.step.1':
    'Otvorte pešiu túru zo zoznamu „Túry tejto cesty“ a pod kartou „Trasové body“ nájdite „Podrobnosti o ceste“. Zapnite „Zobraziť pozdĺž trasy“.',
  'help.guide.tour-hike-trail-details.tip.3':
    'Nič v tejto karte túru nemení a karta potrebuje pripojenie. Importovaná pešia túra má rovnakú kartu vo svojom zobrazení, bez limitu trasovania.',
  'help.guide.tour-hike-round.result':
    'Pešia túra vedie zvoleným okruhom späť na štart. „Okruh prevzatý“ dole na mape ponúka „Vrátiť späť“ a „Uložiť“ ho ponechá.',
  'help.guide.tour-hike-compare-ways.step.3':
    'Odznaky v riadku ukazujú, o koľko je cesta dlhšia, vyššia alebo pomalšia ako súčasná. Kliknite na tú, ktorú chcete.',
  'help.guide.tour-ferrata-add.step.1':
    'S otvorenou pešou túrou kliknite v rade tlačidiel mapy vľavo dole na „Ferraty“. Odznak ukazuje počet feratových ciest v zábere; ak vás vyzve, priblížte mapu.',
  'help.guide.tour-ferrata-add.tip.3':
    'Úsek na ferate je vo výškovom profile zvýraznený, takže vidíte, v ktorej časti dňa na ňu prídete.',
  'help.guide.tour-run-plan.step.5': 'Pod „Názov túry“ pomenujte beh a kliknite na „Uložiť“.',
  'help.guide.tour-run-ways.step.1':
    'Otvorte beh zo zoznamu „Túry tejto cesty“ a v „Podrobnosti o ceste“ pod kartou „Trasové body“ zapnite „Zobraziť pozdĺž trasy“.',
  'help.ctx.trip-tour-walk.bullet.1':
    'Typ túry „Prechádzka mestom / po pamiatkach“ zmení túru na prechádzku. Jej body sú zastávky s popiskom („Popisok“), dĺžkou pobytu a dôležitosťou. Prechádzka nemá limit pešej turistiky ani pole „Prestávky“: namiesto nich sa počítajú pobyty.',
  'help.guide.tour-walk-plan.step.2':
    'Pridajte zastávky: skontrolujte, či je zapnuté „Pridať bod“, a kliknite na mapu pri každej z nich, alebo kliknite na „Miesta cesty“ a vyberte miesto, ktoré už cesta obsahuje.',
  'help.guide.tour-walk-plan.result':
    'Prechádzka uvádza zastávky s dĺžkou pobytov a „Prehľad túry“ ich spočíta. Zaraďte ju na deň a uvidíte, kedy na ktorú zastávku prídete.',
  'help.guide.tour-walk-sights.tip.1': 'Stane sa zastávkou prechádzky, nie miestom cesty.',
  'help.guide.tour-walk-day-times.step.3':
    'Znova otvorte prechádzku na karte „Túry“. Hore v „Trasové body“ ukazuje „Časy pre“ deň a čas začiatku. Pri prechádzke naplánovanej na viac dní naň kliknite a vyberte iný deň.',
  'help.guide.tour-walk-google-import.goal':
    'Vložte pešiu trasu zdieľanú z Google Maps a načítajte jej zastávky ako prechádzku.',
  'help.guide.tour-walk-google-import.result':
    'V editore sa otvorí nová prechádzka mestom so zastávkami z Google Maps, pripravená na uloženie.',
  'help.guide.tour-walk-check-off.tip.2': 'Aj riadok prechádzky v pláne dňa ukazuje počet, napríklad 3/7.',
  'help.ctx.trip-tour-bike.bullet.4':
    'Pri profile MTB ukazuje tá istá karta stupne náročnosti chodníkov (mtb:scale), kde ich mapovači doplnili. Cesta bez stupňa je neznáma, nie ľahká.',
  'help.guide.tour-bike-profile.step.6':
    'Pod „Názov túry“ zadajte názov a potom kliknite na „Uložiť“ dole v ľavom paneli.',
  'help.guide.tour-bike-surfaces.goal':
    'Zistite, aká časť trasy je asfalt, štrk alebo neznámy povrch a po akých druhoch ciest vedie.',
  'help.guide.tour-bike-surfaces.tip.3':
    'Karta vychádza z trasy tak, ako ju naplánoval smerovač, a na túre nič nemení. Potrebuje pripojenie; offline to oznámi a trasa zostane nedotknutá.',
  'help.guide.tour-bike-mtb-grades.tip.1':
    '„Bez stupňa v dátach“ znamená neznáme, nie ľahké. Stupeň nič nehovorí o tom, či vám chodník sedí.',
  'help.ctx.trip-tour-ski.bullet.3':
    'Každý bod, na ktorý na mape kliknete, sa spojí s predchádzajúcim po zjazdovkách, vlekoch a tratiach. Pod každým bodom je jeho úsek rozpísaný ako štítky, zjazdovky vo farbe svojej náročnosti, s minútami. Úsek, ktorý sa nedá naplánovať, sčervenie, uvedie dôvod a ponúkne opravu alebo „Nakresliť rovno“.',
  'help.guide.tour-ski-plan.step.4':
    'Skontrolujte, či je zapnuté „Pridať bod“, a potom postupne kliknite na mapu tam, kde začínate, a na každé miesto, kam sa chcete dostať. Smerovač zjazdoviek spojí každý bod s predchádzajúcim po zjazdovkách, vlekoch a tratiach.',
  'help.guide.tour-ski-options.title': 'Ako lyžujete: nastavenie smerovača zjazdoviek',
  'help.guide.tour-ski-options.tip.2':
    '„Jazdiť lanovkami“ je predvolene zapnuté pre „Zjazd“ a Snowboard a vypnuté pre ostatné disciplíny. „Vynechať“ a „Podľa potreby zísť lanovkou“ sa zobrazujú, iba kým sa jazdí lanovkami.',
  'help.guide.tour-ski-fix-leg.tip.1':
    'Bod môžete na mape aj potiahnuť bližšie k zjazdovke, trati alebo vleku. Keď ho pustíte, úsek sa naplánuje znova.',
  'help.guide.tour-ski-summary.step.2':
    '„Lyžovanie“, „Na lanovkách“, „Čakanie“ a „Pešo“ uvádzajú čas pre každú časť. „Zjazdovky“, „Zjazd po zjazdovkách“ a „Jazdy vlekom“ uvádzajú dĺžku zjazdoviek, výškový rozdiel, ktorý po nich zlyžujete, a počet jázd vlekom.',
  'help.guide.tour-ski-pistes-layer.goal':
    'Pozrite si zjazdovky, bežecké trate a vleky okolo svojej lyžiarskej túry a čo znamenajú ich farby.',
  'help.guide.tour-ski-import.title': 'Import lyžiarskej stopy a určenie, čo to bolo',
  'help.guide.tour-ski-import.tip.1':
    'Importovaná stopa zostane tak, ako bola zaznamenaná: TREK ju neprispôsobuje zjazdovkám a jej karta ukazuje „Čas na lyžiach“ ako „Nepočíta sa“.',
  'help.ctx.trip-tour-paddle.bullet.3':
    '„Ďalšie akcie“ pri bode obsahujú vodácke nástroje: naplánovať ďalší úsek po vode alebo ho nakresliť ručne, „Odtiaľto loď preniesť“ a „Plavebná komora v tomto bode“.',
  'help.guide.tour-paddle-setup.step.3':
    'V časti „Loď“ vyberte „Kajak“, „Kanoe“, SUP alebo „Ostatné“. Podľa lode TREK navrhne rýchlosť.',
  'help.guide.tour-paddle-setup.tip.4':
    '„Pádlovanie má riziká“, riadok dole v stĺpci, otvára „Bezpečnosť na vode“. Pred prvou túrou si to raz prečítajte.',
  'help.guide.tour-paddle-water-route.step.5':
    'Ak chcete naplánovať všetky ručne nakreslené úseky naraz, kliknite na „Naplánovať ručne kreslené úseky po vode“, ikonu vĺn v hlavičke „Trasové body“.',
  'help.guide.tour-paddle-portage.step.1':
    'Nabehnite myšou na zastávku, kde vystupujete, a kliknite na „Ďalšie akcie“, tri bodky.',
  'help.guide.tour-paddle-portage.result':
    'Úsek je na mape aj v trasových bodoch prenáška a „Odhad času“ ho počíta ako prenášanie.',
  'help.guide.tour-paddle-lock.tip.2':
    'Ak prenáška vedie okolo plavebnej komory, komora je stlmená a označená „Prenesené okolo“. Namiesto nej sa počíta čas prenášky a minúty komory sa nezapočítajú.',
  'help.guide.tour-paddle-time.step.4':
    'Ak má túra prenášku, riadok „Prenášanie“ ju započíta. Kliknite na jeho rýchlosť a zadajte, ako rýchlo loď prenášate. „Výstup a opätovný nástup“ pridá minúty pri každej prenáške.',
  'help.guide.tour-paddle-wind.step.1':
    'Zaraďte vodácku túru na deň cesty. Karta „Vietor“ v ľavom stĺpci potom ukáže predpoveď na ten deň na začiatku túry.',
  'help.guide.tour-paddle-wind.result':
    'Poznáte vietor na ten deň v mieste, kde spúšťate loď na vodu, hodinu po hodine.',
  'help.guide.tour-paddle-checklist.tip.1':
    'Pri každej prekážke vyberte, čo urobíte: „Preplávať“, „Preniesť“, „Oboplávať“ alebo „Netýka sa“. „Ďalšie“ vás prenesie na ďalšiu otvorenú položku.',
  'help.guide.tour-paddle-track-marks.step.1':
    'Na karte „Túry“ kliknite v pravom stĺpci na „Pridať túru“, vyberte „Importovať GPX alebo KML“ a zvoľte súbor.',
  'help.guide.tour-paddle-track-marks.tip.2':
    '„Zahodiť“ odstráni značky, ktoré ste neuložili. Samotná zaznamenaná stopa sa nikdy neprekresľuje.',
  'help.ctx.trip-tour-horse.bullet.4':
    'TREK čas jazdy na koni nepočíta. Ak ho chcete mať v dni, zadajte čas pod „Plánované“ v „Podrobnostiach“.',
  'help.guide.tour-horse-plan.step.5':
    'V časti „Sekcie“ vyberte úsek. Skontrolujte „Smer“, ktorým ním pôjdete, a čo pozdĺž neho uvádza „Prístup pre kone“.',
  'help.guide.tour-horse-plan.tip.5':
    'Pri jazde na koni sa nič netrasuje: kliknutím na nakreslenú čiaru nepridáte tvarovací bod a body na koncoch úseku zostanú tam, kde ich má trasa.',
  'help.guide.tour-horse-gap.tip.1':
    'Ručný úsek nepreveril žiadny smerovač ani jazdecká trasa. Na mape si pozrite, kade naozaj vedie.',
  'help.guide.tour-horse-recorded.step.4':
    'Jazda sa otvorí v ľavom stĺpci. Karta „Zaznamenaná vychádzka“ ukazuje „Ako bolo zaznamenané“, „Bez času jazdy“ a „Prístup neoverený“. Keď nabehnete myšou na odznak, prečítate si dôvod.',
  'help.guide.dateless-trip.step.2':
    'Polia Dátum začiatku a Dátum konca nechajte prázdne. Pod nimi sa zobrazí pole Počet dní: zadajte, na koľko dní chcete plánovať.',
  'help.guide.trip-reminder.tip.1':
    'Blok Pripomienka vidí iba vlastník cesty (alebo správca). Ak je sivý, správca musí najprv zapnúť pripomienky ciest v časti Správca, Oznámenia.',
  'help.guide.upcoming-reservations.step.2': 'Kliknutím na rezerváciu otvoríte cestu, do ktorej patrí.',
  'help.guide.timezones-widget.tip.1':
    'Zoznam používa oficiálne názvy časových pásiem, napríklad Europe/Lisbon alebo America/New_York, takže hľadajte mesto, ktoré sa v názve objavuje.',
  'help.guide.half-company-holiday.step.2': 'Na tom istom paneli nástrojov zapnite Pol dňa.',
  'help.guide.edit-holiday-calendar.tip.1': 'Každá zmena sa uloží hneď. Tlačidlo Uložiť tu nie je.',
  'help.guide.person-color.tip.1': 'Rovnaká farba označuje osobu na paneli nástrojov aj v karte Nárok.',
  'help.guide.answer-fusion-request.step.2':
    'Prečítajte si, čo prepojenie znamená: jeden spoločný kalendár, záznamy, ktoré môžete navzájom upravovať, a spoločné nastavenia sviatkov.',
  'help.guide.log-for-partner.step.2':
    'Pozrite sa na panel nástrojov: jeho prvé tlačidlo teraz ukazuje meno a farbu partnera.',
  'help.guide.dissolve-fusion.step.2': 'Dole pod Zrušiť prepojenie kliknite na Oddeliť.',
  'help.guide.country-places.step.3':
    'Dialóg vypíše všetky miesta započítané pre danú krajinu, zoskupené podľa ciest. Ak ich je viac ako šesť, zoznam zúžite poľom Hľadať miesta navrchu. Kliknutím na miesto alebo na nadpis cesty otvoríte túto cestu v plánovači.',
  'help.guide.tour-activity-stats.step.5':
    'Kliknite na Zobraziť túry. Otvorí sa Moje absolvované túry so súčtami, rozdelením Podľa druhu a všetkými túrami z daného obdobia s dňom, cestou, vzdialenosťou a stúpaním. Štítky v hlavičke tu tiež menia obdobie a typ.',
  'help.guide.move-to-list.step.3':
    'Vyberte zoznam, do ktorého sa presunú. Ak máte viac ako tri zoznamy, môžete ich zúžiť vyhľadávacím poľom navrchu.',
  'help.guide.accept-list-invite.goal': 'Pripojte sa k zoznamu, ktorý s vami niekto zdieľa, alebo pozvánku odmietnite.',
  'help.guide.tour-collection-add-to-trip.step.4':
    'Ak chcete, zmeňte Názov v ceste a potom kliknite na Pridať do cesty.',
  'help.guide.tour-collection-manage.step.2': 'Píšte do poľa Hľadať miesta. Podľa názvu zúži túry spolu s miestami.',
  'help.guide.create-journey.tip.3':
    'Keď cesta práve skončila, Vytvoriť cestovný denník v banneri Cesta práve skončila navrchu založí denník s už vybranou touto cestou.',
  'help.guide.entry-draft.step.2': 'Kliknite na Uložiť. Karta teraz nesie odznak Koncept.',
  'help.guide.gallery-map.step.3':
    'Po návrate na Časová os mapa vpravo sleduje vaše posúvanie: záznam, ktorý práve vidíte, má krúžok vo farbe svojho dňa. Kliknutím na špendlík sa časová os posunie na jeho záznam.',
  'help.guide.journey-map-layers.tip.1':
    'Prerušovaná farebná čiara je trasa GPX z cesty, teda súčasť plánu. Plná čiara je trasa zaznamenaná v daný deň.',
  'help.guide.journey-keep-route.tip.1':
    'Kde sa záznam končí, končí aj čiara. TREK kreslí iba to, čo bolo zaznamenané.',
  'help.guide.journey-day-stays.tip.1':
    'Riadok sa zobrazí iba ľuďom, ktorí smú denník upravovať a majú pripojený vlastný Dawarich, a to len v dňoch, kde sa ešte niečo musí rozhodnúť.',
  'help.guide.journey-take-over-day.step.4':
    'Ak chcete zachovať aj trasu, nechajte zapnuté „Uložiť aj trasu dňa“ a kliknite na tlačidlo Prevziať. Zobrazuje, koľko konceptov vytvorí.',
  'help.guide.journey-auto-prepare.step.3':
    'Riadok pod tým ukazuje, kedy sa vaše pobyty naposledy načítali, alebo prečo sa to nepodarilo. Kliknutím na Načítať teraz sa Dawarich opýta hneď.',
  'help.guide.photo-location.tip.1': 'Miesta, ktoré ste nastavili sami, sa nikdy nepresúvajú.',
  'help.ctx.settings-plugins.bullet.1':
    'Nastavenia doplnkov: pod nimi je pre každý doplnok, ktorý od vás potrebuje údaje, jedna karta s jeho poľami a tlačidlom Uložiť. Tajné pole sa po uložení už nikdy nezobrazí.',
  'help.guide.dashboard-widgets.step.3':
    'Obnoviť predvolené pod kartami vráti celú kartu Vzhľad do pôvodného nastavenia.',
  'help.guide.web-push-device.result':
    'Karta ukazuje Zapnuté pre toto zariadenie a udalosti zapnuté pod Push vám prídu, aj keď je TREK zatvorený.',
  'help.guide.connect-airtrail.step.1':
    'V časti Integrácie nájdite AirTrail a zadajte jeho URL inštancie a API kľúč. Kľúč vytvoríte v AirTrail v časti Nastavenia, Zabezpečenie.',
  'help.guide.connect-dawarich.step.1':
    'V časti Integrácie nájdite Dawarich a zadajte jeho Adresu inštancie a API kľúč z Dawarich z časti Účet, API kľúč.',
  'help.guide.tour-connect-wanderer.step.1':
    'V časti Integrácie nájdite wanderer a zadajte jeho URL inštancie a API token. Token vytvoríte vo wanderer v časti Nastavenia, Účet, API tokeny. Začína sa wanderer_key_.',
  'help.guide.tour-wanderer-watch.goal': 'Nechajte TREK na pozadí sledovať zmeny v importovaných trasách.',
  'help.guide.mcp-oauth.tip.3': 'API tokeny stále fungujú, ale sú označené ako Zastarané. Prejdite na klienta OAuth.',
  'help.guide.offline-conflicts.tip.2': 'Voľba platí iba pre toto zariadenie.',
  'help.guide.default-user-settings.tip.1':
    'Vlastná voľba používateľa v Nastavenia má vždy prednosť. Tieto hodnoty platia pre všetkých, ktorí dané nastavenie nezmenili.',
  'help.guide.own-routing-engine.step.1':
    'V časti Mapa v Predvolené nastavenia používateľa zadajte pod Vlastný smerovací server adresu svojho servera OSRM.',
  'help.guide.admin-passkeys.tip.2':
    'Ak neskôr zmeníte doménu, všetky prístupové kľúče, ktoré ľudia už pridali, prestanú fungovať.',
  'help.guide.instance-keys.tip.4': 'Kľúč Amap musí byť kľúč Web 服务 (webová služba), nie kľúč JS API.',
  'help.guide.rotate-jwt-secret.step.2': 'Prečítajte si upozornenie a kliknite na Obnoviť a odhlásiť.',
  'help.guide.notification-defaults.tip.2': 'Predvolená hodnota platí iba pre ľudí, ktorí danú bunku sami nezmenili.',
  'help.ctx.notifications.bullet.5':
    'V Nastavenia, v časti Oznámenia, si vyberiete, ktoré udalosti dostanete tu a ktoré e-mailom, cez webhook, ntfy alebo push.',
  'help.guide.read-notifications.result':
    'Ocitnete sa na obrazovke, ktorej sa oznámenie týkalo, a číslo na zvončeku sa zníži o jedna.',
  'help.guide.mark-notifications-read.title': 'Označenie oznámení ako prečítaných',
  'help.guide.delete-notifications.goal': 'Udržte zoznam krátky odstránením toho, čo už nepotrebujete.',
  'help.guide.notification-settings.step.1': 'Kliknite na svoje meno vpravo hore.',
  'help.guide.public-link.step.5': 'Voľby môžete meniť, kým odkaz existuje. Vymazať odkaz odkaz vypne.',
  'help.guide.link-journal.step.3':
    'Pri každom účastníkovi cesty vyberte Bez prístupu, Čítať alebo Upraviť. Všetci čítajú a Nikto nastavia všetkých naraz.',
  'help.guide.collapse-columns.tip.3': 'Ak je oddeľovač vybraný, môžete ho posúvať aj šípkami na klávesnici.',
  'help.guide.edit-place.tip.3':
    'Ak kliknete mimo dialógu, zmeny sa nestratia: TREK sa najprv opýta „Zahodiť zmeny?“ a Pokračovať v úpravách vás vráti do formulára.',
  'help.guide.dawarich-stays.goal':
    'Pridajte miesta, kde Dawarich počas cesty zaznamenal vaše pobyty, po tom, čo každé skontrolujete.',
  'help.guide.leave-stop-off-route.step.1':
    'Kliknite na zastávku pravým tlačidlom myši alebo na jej tri bodky a vyberte Vynechať z trasy.',
  'help.guide.move-booking-day.step.3':
    'Riadok sa teraz zobrazí v novom dni, vo svojom čase. Ak chcete zmeniť aj čas, otvorte rezerváciu.',
  'help.guide.place-image-from-file.goal':
    'Použite fotku, ktorá už je medzi súbormi miesta, ako jeho obrázok, bez opätovného nahrávania.',
  'help.guide.place-image-from-file.tip.3': 'Obrázok môžu zmeniť iba cestujúci, ktorí smú meniť miesta.',
  'help.guide.place-own-hours.result':
    'Karta ukazuje vaše telefónne číslo, váš e-mail a vaše otváracie hodiny a krúžok okolo obrázka je zelený alebo červený podľa vašich hodín.',
  'help.guide.confirm-stay-booking.step.4':
    'Rezerváciu zatvorte pomocou X vpravo hore. Karta pobytu teraz pod Rezervácia ukazuje Potvrdené.',
  'help.guide.tour-map-lines.title': 'Nájdenie vašich túr na mape',
  'help.guide.tour-map-lines.tip.2':
    'Skrytie túry sa týka iba vás a ukladá sa v tomto prehliadači pre túto cestu: túra, jej dni a farba zostávajú pre všetkých rovnaké. Zobraziť všetky nad zoznamom Túry znova zobrazí všetky skryté túry a mapa v telefóne vždy zobrazuje všetky túry.',
  'help.guide.car-stops.step.4':
    'Pod Zastávky po ceste kliknite na Pridať zastávku pre každé miesto, ktorým jazda prechádza, a vyberte ho, ak chcete, aj s časom vedľa. Zastávka bez vybraného miesta sa pri uložení odstráni.',
  'help.guide.transport-details.step.2':
    'Štítky v hlavičke ukazujú stav, typ, deň a Rezervačný kód. Kliknutím na štítok stavu prepnete medzi Čaká na potvrdenie a Potvrdené. Malá ikona kopírovania v štítku kódu, Kopírovať rezervačný kód, skopíruje kód do schránky.',
  'help.guide.group-sort-bookings.step.3':
    'Pod Zoradiť podľa vyberte Dátum, Názov, Typ alebo Stav. Riadok pod nimi obracia poradie: Najskoršie prvé alebo Najneskoršie prvé pri dátumoch, A až Z alebo Od Z po A pri ostatných.',
  'help.guide.booking-on-map.title': 'Nájdenie rezervácie na mape',
  'help.guide.export-bookings-csv.tip.1':
    'Stĺpce sú Typ, Názov, Stav, Začiatok, Koniec, Od, Do, Miesto, Potvrdenie a Poznámky.',
  'help.guide.arrange-packing-list.tip.1': 'Kým je zapnuté A až Z, položky sa nedajú ťahať, ale celé zoznamy áno.',
  'help.guide.count-packed-pieces.step.3':
    'Kým je zabalená len časť kusov, počítadlo má farbu vášho akcentu a políčko obrys v tejto farbe. Kliknutím na mínus kus z počtu odoberiete.',
  'help.guide.expense-receipts.step.5':
    'Náhľad ukazuje účtenku, navrchu s Otvoriť na novej karte a Stiahnuť. Ak je účteniek viac, medzi nimi sa pohybujete šípkami a Esc náhľad zatvorí.',
  'help.guide.files-sync-settings.step.3': 'Kliknutím na Nastavenia pod lištou toku zobrazíte ostatné voľby.',
  'help.guide.manage-notes.step.3':
    'Pripnúť v tej istej ponuke drží poznámku navrchu panela, s rámikom vo farbe jej kategórie a pripináčikom vedľa názvu. Odopnúť v tej istej ponuke vráti poznámku na pôvodné miesto.',
  'help.guide.note-categories.step.1':
    'Kliknite na ozubené koleso vedľa Nová poznámka v hlavičke karty Poznámky. Otvorí sa Spravovať kategórie s riadkom pre každú kategóriu: jej farba, názov, šesť farebných bodiek a kôš.',
  'help.guide.note-categories.tip.2':
    'Kategória bez poznámok sa uchováva iba vo vašom prehliadači. Ostatní členovia ju uvidia, až keď sa pod ňu zaradí poznámka.',
  'help.guide.roadtrip-reorder.goal': 'Zmeňte poradie jazdy alebo presuňte zastávku na iný deň priamo v lište.',
  'help.guide.roadtrip-overnight.step.4':
    'Nájsť ubytovanie vedľa neho ukazuje názov na skopírovanie a odkazy na rezervačné weby: trivago alebo CHECK24 pre hotel, PiNCAMP alebo Pitchup pre kemp. Miesto, dátumy a hostí skontrolujte na danom webe.',
  'help.guide.roadtrip-stop-fill.step.2':
    'Pod Natankuje na vyberte 50 až 100. Riadok pod tlačidlami ukazuje, ako ďaleko sa odtiaľto s tým dostanete.',
  'help.guide.roadtrip-bookings.step.2':
    'V lište je jazda karta vo farbe svojho typu, s cestovným poriadkom v stĺpci príchodu a s východiskom a cieľom pod názvom.',
  'help.guide.roadtrip-google-import.tip.1':
    'TREK vypočíta medzi zastávkami vlastnú trasu, cestu z Google neskopíruje.',
  'help.guide.roadtrip-hazards.result': 'Mapa ukazuje aktuálne upozornenia okolo vašej cesty a trasa sa nezmení.',
  'help.ctx.trip-tours.bullet.3':
    'Riadok: farebný pruh je čiara túry na mape, okrúhla dlaždica ukazuje obmedzenie trasovania (T1 až T6) alebo typ, malý odznak GPX alebo wanderer označuje import a odznaky uvádzajú dni, čas, vzdialenosť a stúpanie. Mesiac s číslom ukazuje počet etáp viacdňovej túry.',
  'help.guide.tour-show-list.step.3': 'Kliknite na riadok. Karta túry sa otvorí nad mapou.',
  'help.guide.tour-add-to-day.goal':
    'Naplánujte, kedy túru absolvujete, aby sa zobrazila v danom dni a jej čiara na mape.',
  'help.guide.tour-add-to-day.tip.3':
    'Túru môžete pridať k dňu iba raz. Ak ju pustíte na deň, ktorý ju už obsahuje, TREK iba oznámi „Táto túra už je k tomuto dňu priradená.“',
  'help.guide.tour-day-times.step.4':
    'Ak túra skončí po začiatku ďalšej položky dňa, upozorní vás na to poznámka pod riadkom, napríklad „Ends at 13:30, after Lunch at Gostner Schwaige starts at 12:30“. Nič sa nepresúva.',
  'help.guide.tour-remove-from-day.step.1':
    'V stĺpci dní ukážte na riadok túry, kliknite na Ďalšie možnosti a vyberte Odobrať z dňa.',
  'help.guide.tour-filter-list.step.1':
    'Kliknite na tlačidlo filtra pod Importovať GPX alebo KML. Ukazuje stav, podľa ktorého filtruje, najprv Všetky, a vedľa počet túr.',
  'help.guide.tour-hide-on-map.title': 'Skrytie čiary túry na mape',
  'help.guide.tour-import-plan-tab.title': 'Import stopy z karty Plán',
  'help.ctx.trip-tour-detail.title': 'Podrobnosti túry',
  'help.guide.tour-detail-read.goal':
    'Pozrite si všetky informácie o túre v ceste: jej dni, vzdialenosť a výšky, profil a zdroj.',
  'help.guide.tour-detail-read.tip.1':
    'Oranžový štítok „use with caution“ znamená, že import má neúplné výšky alebo miery. Majte to na pamäti, keď čítate stúpanie a profil.',
  'help.guide.tour-rename-colour.step.1':
    'Otvorte kartu túry a kliknite na ceruzku vedľa jej názvu. Názov sa zmení na pole.',
  'help.guide.tour-take-along.goal':
    'Získajte navigáciu na začiatok túry, otvorte jej stránku na webe alebo si stiahnite jej trasu ako súbor GPX.',
  'help.guide.tour-take-along.result': 'Cestu na začiatok máte vo svojej mapovej aplikácii a celú trasu ako súbor GPX.',
  'help.guide.tour-copy-keep.tip.2':
    'Uložiť do zbierky v ponuke túry v pláne dňa otvorí rovnaký dialóg, takže sa trasa uloží aj tam.',
  'help.guide.tour-packing-link.step.3': 'Kliknite na Pripojiť.',
  'help.guide.tour-files.goal': 'Pridajte k túre rezerváciu, mapu alebo popis trasy a otvorte ich znova z karty túry.',
  'help.guide.tour-activity-link.goal': 'Prepojte zaznamenanú stopu GPX s naplánovanou túrou bez zmeny plánu.',
  'help.guide.tour-activity-link.tip.3':
    'Potrebný čas sa počíta od prvej po poslednú časovú značku v stope, vrátane prestávok.',
  'help.guide.tour-activity-compare.tip.1':
    'Porovnať na mape je dostupné, iba keď je karta zobrazená vedľa mapy, nie v telefóne.',
  'help.guide.tour-origin-check.tip.1': 'Túra prevzatá z inej cesty uvádza túto cestu a túru pod Prevzaté z.',
  'help.ctx.trip-tour-planner.bullet.3':
    'Túry tejto cesty, pravý panel, vypisuje všetky túry s filtrom a Rozsah cesty nad zoznamom. Kým je túra otvorená, Prehľad túry navrchu ukazuje jej vzdialenosť, stúpanie, čas a výškový profil. Plus navrchu, Pridať túru, naplánuje, importuje alebo prevezme túru.',
  'help.guide.tour-open-workspace.step.3':
    'Pravý panel, Túry tejto cesty, vypisuje všetky túry cesty, nad zoznamom je filter a Rozsah cesty.',
  'help.guide.tour-open-workspace.result': 'Karta Túry: vľavo editor, vpravo túry cesty, medzi nimi mapa.',
  'help.guide.tour-draw-route.step.6':
    'Pod Trasové body dostane každý bod riadok so svojím číslom, ktorý sa po načítaní názvu pomenuje podľa miesta. Kým TREK pracuje, malá bodka vedľa Nová túra ukazuje jeho stav.',
  'help.guide.tour-type-profile.step.1':
    'Kliknite na Typ túry pod Názov túry. Ukazuje aktuálny typ a riadok o tom, ako sa plánuje.',
  'help.guide.tour-edit-points.goal': 'Zmeňte, kadiaľ túra vedie, presúvaním jej bodov na mape alebo v zozname.',
  'help.guide.tour-edit-points.tip.2':
    'Kým sa nenačíta názov miesta, riadok ukazuje súradnice. Vrátiť späť a Znova nemajú klávesovú skratku.',
  'help.guide.tour-shaping-points.tip.1': 'Začiatok a koniec sú vždy zastávky.',
  'help.guide.tour-loop-reverse.step.3': 'Kliknutím na Obrátiť smer vedľa prejdete celú túru opačným smerom.',
  'help.guide.tour-leg-by-hand.step.2':
    'Úsek sa zmení na prerušovanú priamu čiaru a pod riadkom zoznam ukazuje „Nakreslené ručne, nevypočítané“ aj s dĺžkou úseku.',
  'help.guide.tour-trip-places.step.1':
    'Kliknite na Miesta cesty vedľa Pridať bod pod Trasové body. Pod ním sa zobrazia miesta cesty.',
  'help.guide.tour-details-times.title': 'Pomenovanie túry a plánovanie jej času',
  'help.guide.tour-details-times.tip.3':
    'Kliknutím na šípku vedľa Podrobnosti ich zbalíte. Otvoria sa samy, keď niektoré pole obsahuje hodnotu, ktorú Uložiť neprijme.',
  'help.guide.tour-save.tip.1': 'Zahodiť vedľa Uložiť po potvrdení zahodí neuložené zmeny. Uloženú túru nemení.',
  'help.guide.tour-edit-saved.step.3':
    'Kliknite na Uložiť. Zobrazí sa Túra uložená a túra si ponechá svoje dni, súbory a poznámky.',
  'help.guide.tour-summary-profile.step.1':
    'Prehľad túry navrchu v Túry tejto cesty ukazuje Vzdialenosť, Stúpanie a Klesanie túry v editore, jej odhadovaný čas, prestávky a plánovaný súčet.',
  'help.guide.tour-list-manage.title': 'Správa túr v ceste',
  'help.guide.tour-list-manage.tip.2':
    'Deň, ktorý túru už obsahuje, je v ponuke dňa sivý. Pri viacdňovej túre sa TREK opýta, či etapy začínajú v tomto dni, alebo či celá túra patrí do tohto dňa.',
  'help.guide.tour-delete.tip.2': 'Ak ju chcete iba odobrať z dňa, použite namiesto toho Odobrať z dňa v ponuke dňa.',
  'help.guide.tour-saved-elsewhere.step.4':
    'Vyberte Uložiť ako novú túru, ak chcete zachovať obe verzie, Načítať novšiu, ak chcete načítať druhú verziu, alebo Prepísať, ak chcete druhú verziu nahradiť svojou.',
  'help.ctx.trip-tour-import.bullet.3':
    'Import sa otvorí ako Túra z GPX alebo Túra z aplikácie wanderer: jeho čiara, Prehľad túry a výškový profil presne tak, ako boli importované. Jeho riadok v zozname nesie odznak Import GPX.',
  'help.guide.tour-import-gpx.step.4':
    'Pod Importovať ako skontrolujte, čo stopy sú. Predvolená je Pešia túra. Cyklotúra alebo Beh si pýta profil, Vodácka túra loď a vodu, Lyže a zima disciplínu.',
  'help.guide.tour-view-import.title': 'Prezeranie importovanej stopy',
  'help.guide.tour-view-import.result':
    'Vidíte zaznamenanú stopu presne takú, aká bola importovaná, bez akéhokoľvek prepočtu.',
  'help.guide.tour-plan-from-import.tip.2':
    'Ak karta hovorí, že sa návrh na dlhších úsekoch výrazne odchyľuje od stopy, skontrolujte tie časti na mape, než podľa neho začnete plánovať.',
  'help.guide.tour-restore-recorded.step.3':
    'Potvrďte cez Obnoviť zaznamenanú stopu. Trasové body a vypočítaná čiara sa odstránia, dni a poznámky zostanú.',
  'help.guide.tour-take-over.step.3':
    'Nájdite túru: píšte do poľa Hľadať podľa názvu alebo zúžte zoznam filtrami Cesta a Typ.',
  'help.guide.tour-import-wanderer.title': 'Import trasy z wanderer',
  'help.guide.tour-import-wanderer.tip.3':
    'Trasa, ktorá už v ceste je, je označená V tejto ceste a ponúka Otvoriť túru. Trasa, ktorá sa od importu zmenila, ponúka Importovať ako novú verziu vedľa starej.',
  'help.ctx.trip-tour-map.bullet.4':
    'Pozdĺž túry, karta v ľavom paneli, hľadá blízko trasy vyhliadky, vodu, chaty, jedlo a ďalšie a vypíše nálezy. Miesto zo zoznamu môžete pridať k túre ako zastávku.',
  'help.guide.tour-map-layers.tip.1':
    'Vybraná mapa zostane pre každú túru, ktorú otvoríte, kým stránku znova nenačítate. Túra, ktorej typ ju neponúka, sa otvorí na Mapa. Mapa na karte Plán a nastavenie v Nastavenia sa nemenia.',
  'help.guide.tour-along-search.step.4': 'Kliknite na Hľadať pozdĺž túry. TREK iba hľadá, túra sa nezmení.',
  'help.guide.tour-along-add-stop.step.1':
    'Kliknite na miesto v zozname Pozdĺž túry alebo na jeho špendlík na mape. Jeho karta sa otvorí nad mapou: čo to je, ako ďaleko je od trasy a ako ďaleko po túre leží.',
  'help.guide.tour-3d-terrain.title': 'Zobrazenie túry v 3D',
  'help.guide.tour-3d-terrain.tip.1':
    'Prehľad v tom istom riadku znova zobrazí celú trasu, keď ste posunuli zobrazenie.',
  'help.guide.tour-3d-flyover.step.4': 'Kliknutím na Prehľad zobrazíte celú túru znova.',
  'help.guide.tour-map-overlays.step.2':
    'Kliknite na Legenda zjazdoviek, malý štvorec s farebnými bodkami vedľa prepínača.',
  'help.ctx.trip-tour-stages.summary':
    'Viacdňová túra je jedna trasa rozdelená na etapy, jednu na každý deň, keď ste na cestách. Tu nastavíte, kde každý deň končí, uvidíte miery každej etapy a zaradíte etapy do dní cesty.',
  'help.guide.tour-multi-day.step.1': 'V Túry tejto cesty kliknite na túru, aby sa otvorila v editore.',
  'help.guide.tour-multi-day.tip.3':
    'Čas etapy neobsahuje prestávky. Čas vo výstražnej farbe, Viac ako deň v pohybe, je dlhší ako jeden deň.',
  'help.guide.tour-stages-on-days.step.4':
    'Kliknutím na tlačidlo s mesiacom a počtom etáp, Zobraziť etapy, etapy zobrazíte.',
  'help.ctx.trip-tour-hike.title': 'Pešie túry a behy',
  'help.guide.tour-hike-plan.title': 'Naplánujte pešiu túru v rámci náročnosti, ktorú nastavíte',
  'help.guide.tour-hike-plan.result':
    'Pešia túra je vypísaná v Túry tejto cesty so vzdialenosťou, stúpaním a časom chôdze, pripravená na zaradenie do dňa.',
  'help.guide.tour-hike-trail-details.step.2':
    'Vyberte, čo sa má zobraziť: SAC pre turistický stupeň, Povrch alebo Typ cesty. Trasa na mape používa rovnaké farby ako zoznam.',
  'help.guide.tour-hike-round.title': 'Nájdenie okružnej pešej túry približne danej dĺžky',
  'help.guide.tour-hike-round.tip.1':
    'Okruhy sa držia v rámci Maximálna náročnosť chodníka danej pešej túry. Štítok T na karte ukazuje, aká to je.',
  'help.guide.tour-hike-compare-ways.step.4':
    'Kliknite na Použiť túto cestu. TREK cez smerovač overí, že trasa ňou naozaj vedie.',
  'help.guide.tour-ferrata-add.step.2':
    'Kliknite na feratu na mape, na jej prerušovanú čiaru alebo značku. Jej karta ukazuje názov, stupeň a dĺžku.',
  'help.guide.tour-ferrata-add.tip.4':
    'Zobraziť v OpenStreetMap na karte otvorí vlastné údaje ferraty. Odznak zoranžovie, keď sa nedá nič načítať, a dôvod je v tooltipe.',
  'help.guide.tour-run-plan.result':
    'Beh je vypísaný v Túry tejto cesty s údajom Čas behu (plánovaný) a jeho profil a tempo sa uložia spolu s ním.',
  'help.guide.tour-run-ways.step.2':
    'Navrchu karty teraz vidíte, koľko z behu vedie po nespevnenom povrchu, a najnáročnejší ohodnotený chodník na ňom.',
  'help.ctx.trip-tour-walk.bullet.2':
    'Trasové body vypisujú zastávky v poradí. Krúžok okolo čísla zastávky ju označuje ako Musíš vidieť (plný) alebo Voliteľné (prerušovaný), malý štít ako Chránená a štítok pod jej názvom ukazuje, ako dlho tam zostanete.',
  'help.guide.tour-walk-plan.step.3':
    'Ukážte na zastávku v Trasové body, kliknite vedľa nej na Ďalšie akcie a vyberte Upraviť zastávku.',
  'help.guide.tour-walk-sights.title': 'Pridanie pamätihodností pozdĺž prechádzky mestom',
  'help.guide.tour-walk-sights.tip.2':
    'Po zmene trasy tlačidlo ukazuje Hľadať znova, pretože nájdené miesta patria k pôvodnej trase.',
  'help.guide.tour-walk-day-times.step.4':
    'Pod každou zastávkou vidíte, kedy prídete a ako dlho zostanete. Upozornenie sa zobrazí tam, kde je miesto v tom čase zatvorené alebo sa počas pobytu zatvára.',
  'help.guide.tour-walk-google-import.step.1':
    'V Túry tejto cesty kliknite na Pridať túru (+ navrchu) a vyberte Importovať prechádzku z Google Maps.',
  'help.guide.tour-walk-check-off.title': 'Odškrtávanie zastávok prechádzky v daný deň',
  'help.guide.tour-walk-check-off.tip.3':
    'Ak zaradíte prechádzku do dňa offline, môžete ju odškrtávať, až keď sa synchronizuje.',
  'help.guide.tour-bike-profile.title': 'Naplánujte cyklotúru podľa svojho štýlu jazdy',
  'help.guide.tour-bike-profile.result':
    'Cyklotúra je uložená a vypísaná v Túry tejto cesty, vytýčená podľa svojho profilu, a jej čas jazdy je v Prehľad túry.',
  'help.guide.tour-bike-surfaces.step.1':
    'V Túry tejto cesty vpravo kliknite na cyklotúru, aby sa otvorila. Keď je jej trasa vypočítaná, pod Trasové body sa zobrazí karta Povrch a cesty.',
  'help.guide.tour-bike-surfaces.tip.4':
    'Kliknutím na názov karty ju zbalíte. Po opätovnom načítaní zostane v tomto prehliadači zbalená.',
  'help.guide.tour-bike-mtb-grades.tip.2':
    'Tam, kde mapovači ohodnotili stúpania, nižšie nasleduje Obtiažnosť do kopca (mtb:scale:uphill) s vlastnými riadkami.',
  'help.ctx.trip-tour-ski.bullet.4':
    'Karta Trasa po zjazdovkách pod trasovými bodmi rozdeľuje deň na Lyžovanie, Na lanovkách, Čakanie a Pešo, s dĺžkou zjazdoviek, výškou, ktorú na nich zlyžujete, a jazdami na vlekoch. Čas na lyžiach v Prehľad túry vpravo to sčíta, keď je každý úsek naplánovaný.',
  'help.guide.tour-ski-plan.step.5':
    'Pod každým bodom je jeho úsek vypísaný ako štítky: každá zjazdovka, vlek a úsek pešo podľa názvu alebo typu, zjazdovky s bodkou vo farbe svojho stupňa a minúty pri každom.',
  'help.guide.tour-ski-options.goal':
    'Nastavte najťažšie zjazdovky, čo uprednostniť, svoje tempo a ktoré vleky použiť, aby vám úseky vyhovovali.',
  'help.guide.tour-ski-options.tip.3':
    'Vyhnúť sa domnelým spojkám drží trasu mimo spojení, ktoré mapové údaje iba odhadujú, napríklad nezmapovaného úseku medzi dvoma zjazdovkami.',
  'help.guide.tour-ski-fix-leg.tip.2':
    'Kým sa údaje o zjazdovkách pre oblasť ešte sťahujú, plánovač počká a sám to skúsi znova.',
  'help.guide.tour-ski-summary.step.3':
    'V Prehľad túry vpravo Čas na lyžiach všetko sčíta. Informačná bodka pri ňom vysvetľuje, ako sa počíta.',
  'help.guide.tour-ski-pistes-layer.step.1':
    'Kým je otvorená túra Lyže a zima, mapa zobrazuje zjazdovky automaticky. Prepínač so zasneženou horou v riadku vľavo dole na mape ich vypína a zapína. Jeho tooltip znie „Zjazdovky, bežecké trate a vleky“.',
  'help.guide.tour-ski-import.goal':
    'Importujte zaznamenanú lyžiarsku, bežeckú alebo snežnicovú stopu a priraďte jej správnu disciplínu.',
  'help.guide.tour-ski-import.tip.2':
    'Ak ju chcete upravovať ako naplánovanú túru, použite Naplánovať upraviteľnú verziu v jej karte Upraviteľná verzia. Jej body sa spoja priamymi čiarami.',
  'help.ctx.trip-tour-paddle.bullet.4':
    'Odhad času sčíta čas na vode, prenášanie lode, vystupovanie a nastupovanie, plavebné komory a prestávky, podľa rýchlostí a minút, ktoré môžete zmeniť.',
  'help.guide.tour-paddle-setup.step.4':
    'Pod Voda vyberte Rieka alebo Jazero. Túru nemôžete uložiť, kým nevyberiete loď aj typ vody.',
  'help.guide.tour-paddle-setup.result':
    'Nová vodácka túra s loďou, vodou a rýchlosťou, pripravená na prvý bod na mape.',
  'help.guide.tour-paddle-water-route.tip.1':
    'Tam, kde chýbajú údaje o vode, ich TREK buď automaticky stiahne pre región, alebo o ne požiada správcu, podľa nastavenia inštancie. Úsek vtedy ukazuje „Loading the water data“ a naplánuje sa automaticky, keď údaje dorazia, zvyčajne do jednej až troch minút.',
  'help.guide.tour-paddle-portage.step.2':
    'Vyberte Odtiaľto loď preniesť. Úsek k ďalšiemu bodu sa zmení na prenášku, nakreslenú po súši.',
  'help.guide.tour-paddle-lock.title': 'Pridanie plavebnej komory a času čakania',
  'help.guide.tour-paddle-lock.tip.3': 'Odstrániť plavebnú komoru je dole v otvorenej karte a v Ďalšie akcie.',
  'help.guide.tour-paddle-time.step.5':
    'Kým nemá každá plavebná komora zadané časy, odhad ukazuje Neúplné a poznámka pod riadkami vypíše, čo chýba.',
  'help.guide.tour-paddle-wind.step.2':
    'Skontrolujte smer vetra, jeho Priemer a Nárazy. Priemer je najsilnejší hodinový priemer dňa, Nárazy najsilnejší náraz.',
  'help.guide.tour-paddle-checklist.title': 'Prejdenie kontrolného zoznamu prekážok',
  'help.guide.tour-paddle-checklist.tip.2':
    'Preniesť prenášku automaticky nenaplánuje. Kliknite na Naplánovať prenášku a nastavte ju na mape.',
  'help.guide.tour-paddle-track-marks.step.2':
    'V Náhľad importu nastavte Importovať ako na Vodácka túra a potom vyberte Loď a Voda. Import nepokračuje, kým nevyberiete obe.',
  'help.guide.tour-paddle-track-marks.tip.3':
    'Pri zaznamenanej stope má riadok Voda v Odhad času vlastnú rýchlosť: kliknite naň a zadajte, ako rýchlo ste pádlovali.',
  'help.ctx.trip-tour-horse.bullet.5':
    'Vychádzka importovaná zo súboru GPX zostáva presne taká, ako bola zaznamenaná, a jej karta Zaznamenaná vychádzka hovorí, čo import nevedel vypočítať.',
  'help.guide.tour-horse-plan.step.6':
    'Kliknite na Prevziať úsek. Úsek sa pridá k vychádzke ako odznak s názvom trasy v karte Trasové body. Ďalšie úseky pridajte rovnako.',
  'help.guide.tour-horse-gap.title': 'Preklenutie medzery medzi konskými trasami',
  'help.guide.tour-horse-gap.tip.2':
    'Body, na ktoré kliknete na mape, sa k vychádzke pridajú rovnakým spôsobom, ako priame, neoverené úseky.',
  'help.guide.tour-horse-recorded.result':
    'Vychádzka je v ceste presne taká, ako ste ju išli, s vzdialenosťou a výškami zo súboru.',
  'help.guide.dateless-trip.step.3': 'Kliknite na Vytvoriť novú cestu.',
  'help.guide.trip-reminder.tip.2':
    'Nová cesta začína s pripomienkou 3 dni pred odchodom. Kanály, ktorými vám príde, nastavíte v Nastavenia, Oznámenia.',
  'help.guide.upcoming-reservations.result':
    'Cesta sa otvorí. Keď sa vrátite na prehľad, widget ďalej ukazuje, čo nasleduje.',
  'help.guide.entitlement.tip.2': 'V prepojenom pláne má každý vlastný riadok a nárok môžete nastaviť aj ostatným.',
  'help.guide.half-company-holiday.step.3': 'Kliknite na deň. Polovica bunky zoranžovie.',
  'help.guide.school-holidays.tip.2':
    'Keď ukážete myšou na deň v prázdninách, pod Školské prázdniny sa zobrazí jeho názov.',
  'help.guide.answer-fusion-request.step.3':
    'Kliknutím na Prijať a prepojiť plány zlúčite, kliknutím na Zamietnuť ten svoj ponecháte samostatný.',
  'help.guide.log-for-partner.step.3': 'Kliknite na dni, ktoré chcete zapísať, a potom znova na svoje meno v Osoby.',
  'help.guide.dissolve-fusion.result': 'Každý je opäť vo svojom pláne so svojimi záznamami a Osoby uvádza už iba vás.',
  'help.guide.country-places.result': 'Plánovač sa otvorí na ceste, do ktorej miesto patrí.',
  'help.guide.tour-activity-stats.step.6':
    'Pri túre, ktorá sa neuskutočnila, kliknite na Vynechať, okrúhle tlačidlo na konci jej riadka. Túra zostane v zozname, stlmená a označená Vynechaná. Rovnaké tlačidlo, teraz Znova započítať, ju započíta späť.',
  'help.guide.move-to-list.tip.1':
    'Štítky patria jednému zoznamu, takže presunuté alebo duplikované miesto príde do nového zoznamu bez štítkov.',
  'help.guide.accept-list-invite.step.1':
    'Pozvánku nájdete pod Pozvánky v lište zoznamov. Ak ste prišli cez oznámenie o pozvánke, karta je navrchu stránky. Uvádza názov zoznamu a od koho je.',
  'help.guide.tour-collection-add-to-trip.tip.1':
    'Nová túra zatiaľ nie je v žiadnom dni a nepridáva žiadne miesta. Zoznam ani pôvodná túra sa nezmenia.',
  'help.guide.tour-collection-manage.step.3': 'Kliknite na kôš na konci riadka túry a potvrďte cez Odobrať zo zbierky.',
  'help.ctx.journey-detail.bullet.7':
    'S pripojeným Dawarich sa v záhlaví dňa zobrazí aj Prevziať záznam (alebo vzdialenosť trasy uloženej pre deň) a Prevziať deň. V dni s čakajúcimi pobytmi sú pobyty zoskupené v jednom riadku na konci dňa.',
  'help.guide.entry-draft.tip.1':
    'Prispievatelia koncept stále vidia. Skrýva ho len verejný odkaz, kým Koncept nevypnete.',
  'help.guide.journey-map-layers.tip.2':
    'Stlmený prepínač zatiaľ nemá čo zobraziť a jeho tooltip povie prečo. Vaša voľba sa pre každý cestovný denník uchováva v tomto prehliadači.',
  'help.guide.journey-keep-route.tip.2':
    'Ak chcete neskôr znova porovnať s Dawarich, kliknite na vzdialenosť v záhlaví dňa: Nahradiť prevezme novú verziu, Odstrániť trasu odstráni trasu dňa z cestovného denníka.',
  'help.guide.journey-day-stays.tip.2': 'V rušnom dni vybaví Prevziať deň na konci riadka všetky jeho pobyty naraz.',
  'help.guide.journey-take-over-day.tip.1':
    'Kým nekliknete na toto tlačidlo, nič sa neuloží, a nič sa neuloží dvakrát: pobyt, ktorý už je v denníku, je označený a nedá sa vybrať znova.',
  'help.guide.journey-auto-prepare.tip.1':
    'Pripravujú sa iba dni prepojených ciest s dátumami a do denníka sa automaticky nič nepridáva.',
  'help.guide.photo-location.result':
    'Záznam bez miesta dostane miesto, kde bola nafotená jeho prvá fotka s GPS, a zobrazí sa na mape.',
  'help.guide.contributors.tip.2':
    'Cez cesty uvádza ľudí, ktorí majú prístup cez prepojenú cestu. Ich prístup meňte v nastaveniach tejto cesty, nie tu.',
  'help.ctx.settings-plugins.bullet.2':
    'Doplnok môže do svojej karty pridať Akcie, ktoré sa spustia po potvrdení, a Pripojiť alebo Odpojiť, keď sa za vás prihlasuje do inej služby.',
  'help.guide.web-push-device.tip.1':
    'Push funguje pre každý prehliadač zvlášť: zopakujte postup na každom telefóne a počítači, na ktorom chcete dostávať oznámenia. Vypnúť pre toto zariadenie ho zastaví iba na tom zariadení.',
  'help.guide.connect-airtrail.step.2':
    'Povoliť certifikáty podpísané sebou samým používajte iba pre dôveryhodnú inštanciu vo vlastnej sieti. Zapisovať zmeny späť do AirTrail je predvolene vypnuté, takže TREK iba číta. Zapnite to, ak chcete svoje úpravy posielať späť.',
  'help.guide.connect-dawarich.step.2':
    'Automaticky hľadať nové pobyty nechá TREK kontrolovať samo. Keď je vypnuté, TREK číta Dawarich, iba keď o to požiadate. Povoliť vlastnoručne podpísaný certifikát používajte iba pre inštanciu, ktorej váš server nedôveruje.',
  'help.guide.tour-connect-wanderer.step.2':
    'Povoliť certifikát podpísaný sám sebou zapnite iba pre inštanciu vo vlastnej sieti.',
  'help.guide.tour-wanderer-watch.step.1':
    'V karte wanderer zapnite Kontrolovať zmeny mojich trás. Najprv musíte mať uložené pripojenie.',
  'help.guide.plugin-settings.title': 'Nastavenie doplnku pre seba',
  'help.guide.default-user-settings.tip.2':
    'Zobrazovaná mena iba prepočítava sumy na zobrazenie. Sumy zadané v Náklady sa nemenia.',
  'help.guide.own-routing-engine.step.2':
    'Pre trasy, ktoré sa vyhýbajú mýtu, diaľniciam alebo trajektom, zadajte adresu svojej Valhalla pod Vlastná inštancia Valhalla. Každé pole sa uloží, keď ho opustíte. Potom reštartujte server TREK a znova načítajte stránku.',
  'help.guide.admin-passkeys.tip.3':
    'Ak používateľ stratil zariadenie so svojimi prístupovými kľúčmi, odstránite ich cez Resetovať prístupové kľúče v Upraviť používateľa.',
  'help.guide.rotate-jwt-secret.result':
    'Nový podpisový tajný kľúč je nastavený a každý používateľ, vrátane vás, sa musí prihlásiť znova.',
  'help.guide.read-notifications.title': 'Čítanie oznámení',
  'help.guide.filter-notifications.title': 'Zobrazenie všetkých oznámení alebo iba neprečítaných',
  'help.guide.mark-notifications-read.goal': 'Odstráňte zvýraznenie a číslo na zvončeku, keď ste videli, čo je nové.',
  'help.guide.delete-notifications.step.1':
    'Kliknutím na Vymazať, kôš vedľa času oznámenia, odstránite iba toto jedno oznámenie.',
  'help.guide.notification-settings.step.2': 'V ponuke kliknite na Nastavenia.',
  'help.guide.public-link.tip.3': 'Keď ukážete myšou na voľbu, zobrazí sa, čo skrýva.',
  'help.guide.link-journal.step.4':
    'Prečítajte si žltú poznámku: uvádza, kto dostane denník ako prvý. Potom kliknite na Prepojiť denník.',
  'help.guide.dawarich-stays.step.1':
    'Ak máte v Nastavenia, Integrácie pripojený Dawarich, nad zoznamom miest sa zobrazí Z Dawarichu. Jeho záhlavie uvádza, kedy TREK naposledy kontroloval a koľko pobytov čaká. Kliknutím otvoríte zoznam.',
  'help.guide.leave-stop-off-route.step.2':
    'Vedľa názvu sa zobrazí odznak Mimo trasy. Zastávka zostane v dni aj na mape, ale trasa dňa a časy jej úsekov ju preskočia.',
  'help.guide.move-booking-day.result': 'Rezervácia patrí v pláne do nového dňa a jej čas sa nezmenil.',
  'help.guide.clear-day.tip.2': 'Táto položka ponuky sa zobrazí iba pri dni, v ktorom sú miesta.',
  'help.guide.place-image-from-file.step.1':
    'Otvorte miesto, ktoré má medzi Súbory fotku. Blok Súbory pri spodku karty ukazuje, koľko súborov miesto má.',
  'help.guide.place-own-hours.title': 'Oprava otváracích hodín, telefónu alebo e-mailu miesta',
  'help.guide.place-own-hours.tip.1':
    'Hodiny, ktoré zadáte, nahradia tie, ktoré TREK vyhľadal, takže kaviareň so sezónnymi časmi ukazuje to, čo viete vy.',
  'help.guide.day-panel.tip.3':
    'Plánujete podľa kalendára? Zapnite Dátum na začiatku nadpisov dní v Nastavenia, pod Všeobecné, a záhlavie bude začínať dátumom, pod ním bude Deň 1 alebo názov dňa.',
  'help.guide.confirm-stay-booking.result': 'Rezervácia hotela je potvrdená, na karte pobytu aj na karte Rezervácie.',
  'help.guide.tour-map-lines.goal':
    'Rozlíšte túry cesty na mape, otvorte jednu z jej čiary a skryte tie, ktoré práve nepotrebujete.',
  'help.guide.tour-map-lines.tip.3':
    'Vynechať z trasy v ponuke riadka túry v pláne dňa znamená, že trasa dňa už nevedie na začiatok a koniec túry. Vrátiť do trasy ich znova spojí.',
  'help.guide.car-stops.step.5':
    'Poradie zastávok je trasa. Posunúť nahor a Posunúť nadol vľavo od zastávky ho menia a Odstrániť zastávku, krížik vpravo, zastávku odstráni.',
  'help.guide.transport-details.step.3':
    'Dlaždice nižšie ukazujú odchod a príchod s ich stanicami alebo letiskami, potom nástupište a miesto, ak sú zadané. Jazda so zastávkami medzi nimi ich vypisuje pod Trasa a jazda rezervovaná po úsekoch vypisuje kód každého úseku pod Kódy úsekov. Nasledujú Cestujúci, Poznámky, Náklady a Súbory. Zobraziť v súboroch otvorí lístok na karte Súbory.',
  'help.guide.export-transports-csv.title': 'Export dopravy ako tabuľky',
  'help.guide.group-sort-bookings.step.4':
    'Kliknutím na nadpis sekcie ju zbalíte. Číslo vedľa neho ukazuje, koľko rezervácií je v nej, a druhé kliknutie ju znova otvorí.',
  'help.guide.booking-on-map.goal': 'Prejdite z rezervácie na jej miesto v pláne a na mape.',
  'help.guide.export-bookings-csv.tip.2':
    'Stĺpce sú oddelené bodkočiarkami a Excel súbor otvorí so správne zobrazenou diakritikou.',
  'help.guide.arrange-packing-list.tip.2':
    'TREK si A až Z pamätá v tomto prehliadači, takže sa zoznam otvorí zoradený aj nabudúce. Mení iba to, čo vidíte vy, nikdy nie poradie, ktoré vidia ostatní.',
  'help.guide.count-packed-pieces.step.4':
    'Keď počítadlo dosiahne množstvo, položka sa automaticky odškrtne a počíta sa ako zabalená.',
  'help.guide.expense-receipts.result':
    'Účtenka sa uloží s výdavkom: štítok na jeho riadku ju otvorí a súbor je aj v Súbory cesty.',
  'help.guide.files-sync-settings.step.4':
    'Pod Keď sa dokument odstráni vyberte, čo sa stane s kópiou na druhej strane. Zachovať obe kópie nechá kópiu v úložisku, kde je. Presunúť do koša ju presunie do koša úložiska, keď sa dokument v TREK vymaže.',
  'help.ctx.trip-collab.bullet.7':
    'Všetko tu vyžaduje pripojenie. Offline sa správa, poznámka, odkaz, anketa ani hlas neuloží a TREK ohlási „This needs a connection. Try again once TREK is back online.“ Členovia, ktorí nesmú upravovať Spolupráca, môžu všetko čítať, ale Nová poznámka, Pridať odkaz a Nová anketa pre nich nie sú a pole na správu je sivé.',
  'help.guide.manage-notes.step.4':
    'Upraviť otvorí dialóg poznámky s vyplnenými údajmi. Zmeňte, čo potrebujete, tu ešte jeden riadok pod Obsah, a kliknite na Uložiť.',
  'help.guide.note-categories.step.2':
    'Dole do Nová kategória... napíšte názov a stlačte Enter alebo kliknite na plus vedľa. Nová kategória dostane ďalšiu farbu a vlastný riadok.',
  'help.guide.note-categories.tip.3':
    'Na karte je kategória iba farebná bodka v jej záhlaví. Keď na bodku ukážete myšou, zobrazí sa názov kategórie.',
  'help.guide.roadtrip-reorder.step.1':
    'Potiahnite zastávku za jej riadok a pustite ju na inú zastávku toho istého dňa. Zaujme jej miesto a deň sa znova vytýči v novom poradí.',
  'help.guide.roadtrip-overnight.step.5':
    'Kliknite na Pridať. Noc sa rezervuje od tohto dňa do nasledujúceho a miesto sa pridá do jazdy ako nocľah toho dňa.',
  'help.guide.roadtrip-stop-fill.step.3':
    'Ak chcete pri zastávke znova použiť vlastné nastavenie, otvorte odznak znova a kliknite na Použiť moju predvolenú hodnotu.',
  'help.guide.roadtrip-bookings.step.3':
    'Štítok Check-in alebo Nástup ukazuje, dokedy vás jazda musí dostať na terminál: odchod sa nastaví o toľko skôr, než uvádza cestovný poriadok.',
  'help.guide.roadtrip-google-import.title': 'Import trasy z Google Maps',
  'help.guide.roadtrip-google-import.tip.2':
    'Odkaz musí obsahovať aspoň dve zastávky, ktoré TREK vie umiestniť, a najviac 30.',
  'help.guide.roadtrip-hazards.tip.1':
    'Upozornenia nie sú uzávierky ciest: trasa sa kvôli nim nikdy nezmení a sú to aktuálne oznamy, nie predpoveď na vaše dátumy.',
  'help.ctx.trip-tours.bullet.4':
    'Keď ukážete myšou na riadok, zobrazí sa jeho oko (Skryť na mape) a okrúhle + (Pridať k dňu). Potiahnutím riadka na deň v ľavom stĺpci túru tam naplánujete, kliknutím naň otvoríte kartu túry nad mapou.',
  'help.guide.tour-show-list.step.4':
    'Karta ukazuje miery túry a pod Dni cesty dni, v ktorých túra je. Ak chcete zmeniť samotnú trasu, otvorte kartu Túry a kliknite na túru pod Túry tejto cesty.',
  'help.guide.tour-add-to-day.step.1':
    'Ukážte myšou na túru v zozname a kliknite na okrúhle + vpravo od jej riadka (Pridať k dňu).',
  'help.guide.tour-add-to-day.tip.4':
    'Ak je otvorený deň (kliknite na jeho záhlavie), karta túry ponúka Pridať k dňu aj pre tento deň. Šípka späť nad dňami priradenie vráti.',
  'help.guide.tour-day-times.tip.1': 'Čas konca, ktorý zadáte, nahradí vypočítaný.',
  'help.guide.tour-remove-from-day.step.2':
    'Túra zostane v zozname vpravo. Jej odznak Deň zmizne a filter ju znova započíta pod Nezaradené.',
  'help.guide.tour-filter-list.step.2':
    'Pod Stav vyberte Nezaradené pre túry, ktoré ešte nie sú v žiadnom dni, alebo Plánované pre tie, ktoré už v nejakom dni sú. Každý riadok ukazuje, koľko túr zodpovedá.',
  'help.guide.tour-hide-on-map.goal':
    'Skryte z mapy túry, ktoré práve nepotrebujete, bez toho, aby sa tým pre niekoho zmenili.',
  'help.guide.tour-import-plan-tab.goal': 'Importujte stopu GPX alebo KML ako túru, kým plánujete dni.',
  'help.ctx.trip-tour-detail.summary':
    'Karta, ktorá sa otvorí nad mapou, keď na karte Plán vyberiete túru: jej dni, miery a profil, odkiaľ pochádza, a tlačidlá, ktoré ju pošlú do telefónu, skopírujú, uložia do zbierky alebo prepoja so zoznamom vecí na balenie.',
  'help.guide.tour-detail-read.step.1':
    'Navrchu pravého stĺpca prepnite z Miesta na Túry a potom kliknite na túru. Jej karta sa otvorí nad mapou. Rovnakú kartu otvorí aj jej riadok v dni alebo jej čiara na mape.',
  'help.guide.tour-detail-read.tip.2':
    'Vodácka túra nezobrazuje výšky ani profil: jej body sú na brehoch, takže by výšky boli nesprávne.',
  'help.guide.tour-rename-colour.step.2':
    'Napíšte nový názov a kliknite na okrúhle tlačidlo so začiarknutím alebo stlačte Enter. Escape ponechá pôvodný názov.',
  'help.guide.tour-take-along.step.1':
    'Otvorte kartu túry. Navigácia dole na karte otvorí začiatok túry v mapovej aplikácii a ak ich je viac, najprv ich ponúkne. Vedie vás na začiatok, nie po trase.',
  'help.guide.tour-copy-keep.title': 'Skopírovanie túry alebo jej uloženie do zbierky',
  'help.guide.tour-copy-keep.tip.3':
    'Na karte Túry robí to isté záložka navrchu ľavého stĺpca pre otvorenú túru. Ak má túra neuložené zmeny, najprv vás požiada, aby ste ju uložili.',
  'help.guide.tour-packing-link.step.4':
    'Karta teraz ukazuje zoznam, koľko jeho položiek je zabalených, pruh a prvé položky. Zabalené sú preškrtnuté.',
  'help.guide.tour-files.step.1':
    'Otvorte kartu túry a prejdite na Súbory na jej konci. Kliknite na Nahrať v záhlaví sekcie a vyberte jeden alebo viac súborov.',
  'help.guide.tour-activity-link.step.1':
    'Otvorte kartu naplánovanej túry a prejdite na Skutočná trasa. Kliknite na Pridať skutočnú trasu.',
  'help.guide.tour-activity-link.result':
    'Stopa je prepojená s túrou a karta ukazuje plán a to, čo ste absolvovali, vedľa seba.',
  'help.guide.tour-activity-compare.tip.2':
    'Absolvované túry v Atlase počítajú namiesto plánovaných hodnôt prepojenú stopu.',
  'help.guide.tour-origin-check.tip.2':
    'Túra z wanderer má vedľa zdroja šípku Otvoriť vo wanderer a v záhlaví sekcie Skontrolovať zdroj. Kontrola sa wanderer opýta, či sa trasa od importu zmenila. Importovať ako novú snímku potom naimportuje novú verziu ako samostatnú túru. Táto túra si ponechá svoje dni a poznámky.',
  'help.ctx.trip-tour-planner.bullet.4':
    'Kým je zapnuté Pridať bod (Pridávať body v štítku mapy), kliknutím na mapu nastavíte bod. Špendlík presuniete potiahnutím, kliknutím na nakreslenú trasu tam pridáte tvarovací bod a miesto cesty vyberiete cez Miesta cesty.',
  'help.guide.tour-open-workspace.step.4':
    'Plus navrchu pravého panela, Pridať túru, ponúka Importovať GPX alebo KML, Importovať prechádzku z Google Maps a Prevziať túru z inej cesty. Kým je túra otvorená, je tam aj Naplánovať novú túru.',
  'help.guide.tour-draw-route.title': 'Nakreslenie novej túry',
  'help.guide.tour-draw-route.tip.1':
    'Kým je zapnuté Pridávať body, ukazovateľ je zameriavací kríž. Vypnite to, ak chcete mapu posúvať bez pridávania bodov. V 3D je to na začiatku vypnuté, pretože v 3D mapu ťaháte, aby ste sa rozhliadli.',
  'help.guide.tour-type-profile.step.2':
    'Typ vyberte zo zoznamu: Pešia túra, Prechádzka mestom / po pamiatkach, Beh, Cyklotúra, Vodácka túra, Vychádzka na koni alebo Lyže a zima. Každý uvádza, čo plánuje, a nový typ naplánuje trasu znova.',
  'help.guide.tour-edit-points.step.1':
    'Potiahnite očíslovaný špendlík na mape tam, kde má bod byť. Trasa sa znova naplánuje cez nové miesto.',
  'help.guide.tour-edit-points.result': 'Body sú tam a v poradí, aké chcete, a trasa je naplánovaná znova.',
  'help.guide.tour-shaping-points.tip.2': 'Tvarovací bod nemôže ukončiť etapu viacdňovej túry.',
  'help.guide.tour-loop-reverse.tip.1': 'Keď je túra okruh, Späť na štart ohlási „Túra sa už vracia na štart“.',
  'help.guide.tour-leg-by-hand.step.3':
    'Ak chcete úsek znova prenechať smerovaču, otvorte tú istú ponuku a vyberte Ďalší úsek znova vypočítať.',
  'help.guide.tour-trip-places.step.2':
    'Hľadajte v miestach cesty alebo sa pozrite pod Blízko túry: miesta do dvoch kilometrov od trasy, najbližšie prvé, každé s jeho vzdialenosťou.',
  'help.guide.tour-details-times.goal': 'Dajte túre názov, popis a odkaz a pridajte do jej času prestávky.',
  'help.guide.tour-details-times.result': 'Túra má teraz svoj názov, poznámky a čas, ktorý na ňu plánujete.',
  'help.guide.tour-save.tip.2':
    'Späť na túry navrchu panela zatvorí editor a ak sú v ňom neuložené zmeny, najprv sa opýta.',
  'help.guide.tour-edit-saved.step.4':
    'Kliknutím na Späť na túry ho zatvoríte. Ak sú v ňom neuložené zmeny, najprv sa opýta „Zahodiť neuložené zmeny túry?“',
  'help.guide.tour-summary-profile.step.2': 'Informačná bodka vedľa odhadovaného času vysvetľuje, ako sa počíta.',
  'help.guide.tour-list-manage.goal':
    'Pozrite si súčty túr v ceste, zaraďte jednu do dňa a zúžte zoznam na to, čo potrebujete.',
  'help.guide.tour-list-manage.tip.3':
    'Kôš na riadku túru vymaže. Karta Plán vypisuje tie isté túry, keď je jej pravý stĺpec prepnutý na Túry.',
  'help.guide.tour-delete.tip.3':
    'Túra sa maže tu, na karte Túry. Kôš je tam iba pre cestujúcich, ktorí smú upravovať miesta cesty.',
  'help.guide.tour-saved-elsewhere.tip.1':
    'Uložiť ako novú túru pomenuje vašu kópiu podľa túry a pridá za názov „(my version)“.',
  'help.ctx.trip-tour-import.bullet.4':
    'Upraviteľná verzia zmení import na túru s trasovými bodmi, ktoré môžete presúvať. Nahradiť import ponechá zaznamenanú stopu a karta Zaznamenaná stopa v editore vás k nej vráti.',
  'help.guide.tour-import-gpx.step.5':
    'Kliknite na Importovať 1 túru (alebo Importovať 3 túry pri súbore s tromi stopami).',
  'help.guide.tour-view-import.goal':
    'Pozrite si priebeh, miery a prevýšenie importovanej túry tak, ako boli importované.',
  'help.guide.tour-plan-from-import.title': 'Naplánovanie upraviteľnej túry z importu',
  'help.guide.tour-plan-from-import.tip.3':
    'Vodácky alebo lyžiarsky import sa medzi bodmi spojí priamymi čiarami namiesto vytýčenia trasy.',
  'help.guide.tour-restore-recorded.tip.1':
    'Karta sa zobrazí iba pri túre, ktorá bola nahradená cez Nahradiť import a potom uložená.',
  'help.guide.tour-take-over.step.4':
    'Kliknite na túru. Pravá strana ukazuje jej čiaru, miery a cestu, z ktorej pochádza.',
  'help.guide.tour-import-wanderer.goal': 'Importujte do cesty ako túru jednu z trás z vášho vlastného wanderer.',
  'help.guide.tour-import-wanderer.tip.4': 'Otvoriť vo wanderer otvorí trasu na vašej inštancii.',
  'help.ctx.trip-tour-map.bullet.5':
    'V 3D je trasa zobrazená na teréne, zafarbená podľa strmosti, s legendou, ktorá zhŕňa jej stupne, a preletom, ktorý ju sleduje od začiatku do konca.',
  'help.guide.tour-map-layers.tip.2':
    'Turistika a Bicykel pochádzajú z dobrovoľníckych serverov a sú dostupné, iba kým ich váš správca povoľuje. Keď niektorý prestane odpovedať, jeho segment ukáže ! a môžete prepnúť na inú mapu. Vaša túra zostane nezmenená.',
  'help.guide.tour-along-search.step.5':
    'Nájdené miesta sú vypísané s ich vzdialenosťou od trasy a vykreslené na mape vo svojej farbe. Hviezda označuje tie najznámejšie a V túre tie, ktoré už sú zastávkou. Tlačidlo teraz ukazuje Hľadať znova.',
  'help.guide.tour-along-add-stop.step.2':
    'Kam patrí navrhuje úsek, do ktorého sa miesto hodí najlepšie. Kliknutím môžete namiesto toho vybrať, medzi ktoré dve zastávky sa vloží, alebo Ako nový cieľ. Mapa ukáže novú trasu prerušovanou čiarou, skôr než sa čokoľvek zmení.',
  'help.guide.tour-3d-terrain.goal': 'Pozrite sa na túru v skutočnej krajine, zafarbenú podľa strmosti.',
  'help.guide.tour-3d-terrain.tip.2':
    'Mapa, ktorú ste vybrali, sa používa aj v 3D, rovnako ako ferraty, zjazdovky a námorné značky. Kým túru upravujete, môžete jej body ťahať po teréne a so zapnutým Pridávať body ho kliknutím pridáte.',
  'help.guide.tour-3d-flyover.result':
    'Túru ste videli zo vzduchu, od začiatku do konca, rýchlosťou, ktorú ste zvolili.',
  'help.guide.tour-map-overlays.step.3':
    'Legenda vysvetľuje, čo znamenajú farby: zjazdovky od Začiatočník po Freeride, Bežecké trate, Zimné a snežnicové trasy, Sánkarské dráhy a Vleky a lanovky. Celá legenda na OpenSnowMap otvorí každý symbol. Zatvoríte ju klávesom Escape.',
  'help.ctx.trip-tour-stages.bullet.1':
    'Dni v editore urobia z otvorenej túry Jednodňová alebo Viacdňová. Keď prepnete späť na jednodňovú, po potvrdení sa odstránia všetky konce etáp a trasa zostane nezmenená.',
  'help.guide.tour-multi-day.step.2':
    'Pod Dni kliknite na Viacdňová. Poznámka uvádza, kde sa umiestni koniec prvej etapy.',
  'help.guide.tour-multi-day.tip.4':
    'Etapy sa uložia po kliknutí na Uložiť. Ak zmena odstráni etapu, ktorá je v dni cesty, oznámenie upozorní, že uloženie ju z tohto dňa odstráni.',
  'help.guide.tour-stages-on-days.step.5':
    'Každá etapa ukazuje deň, v ktorom je. Kliknutím na jej deň etapu presuniete na iný deň, alebo vyberte Bez dňa a etapu z dňa odoberiete.',
  'help.ctx.trip-tour-hike.summary':
    'Pešia túra alebo beh otvorený na karte Túry: vľavo editor, uprostred mapa, vpravo prehľad túry a ostatné túry cesty. Pešia túra sa drží náročnosti chodníka, ktorú povolíte, beh sa meria podľa vášho vlastného tempa a obe ukazujú, čo OpenStreetMap eviduje po trase.',
  'help.guide.tour-hike-plan.goal':
    'Začnite pešiu túru, nastavte jej zastávky, vyberte najťažší stupeň chodníka, ktorý smie trasa použiť, a uložte ju.',
  'help.guide.tour-hike-plan.tip.1':
    'Nová pešia túra začína na T2 (Horská turistika). T3 pridá upozornenie, že takéto cesty môžu byť exponované a vyžadujú istú chôdzu a nesmie vám robiť problém výška.',
  'help.guide.tour-hike-trail-details.step.3':
    'Odznaky to zhrnú: koľko trasy je Známe, Najvyšší známy stupeň a oddelene Limit trasy, s ktorým sa pešia túra plánovala.',
  'help.guide.tour-hike-round.goal':
    'Nechajte TREK navrhnúť okruhy požadovanej dĺžky, ktoré začínajú v jednej zastávke pešej túry.',
  'help.guide.tour-hike-round.tip.2':
    'Prijímajú sa vzdialenosti od 1 do 60 km a ponúkajú sa okruhy, ktoré sa od vašej dĺžky líšia najviac o 20 %.',
  'help.guide.tour-hike-compare-ways.result':
    'Tá jedna sekcia vedie po ceste, ktorú ste vybrali, a zvyšok pešej túry zostane, aký bol. Dole na mape má Cesta prevzatá tlačidlo Vrátiť späť.',
  'help.guide.tour-ferrata-add.step.3':
    'Kliknite na Pridať do túry. Ferrata sa pridá na koniec trasy ako samostatný úsek s bodom na každom konci.',
  'help.guide.tour-run-plan.title': 'Naplánovanie behu vlastným tempom',
  'help.guide.tour-run-plan.tip.1': 'Bez tempa sa beh nedá uložiť.',
  'help.guide.tour-run-ways.step.3':
    'Kliknite na Povrch a potom na povrch v zozname, aby sa na mape zobrazili iba tieto úseky.',
  'help.ctx.trip-tour-walk.bullet.3':
    'Keď je prechádzka v dni so začiatočným časom, Časy pre navrchu Trasové body uvádza tento deň a každá zastávka ukazuje svoj príchod, pobyt a to, čo hovoria jej otváracie hodiny.',
  'help.guide.tour-walk-plan.step.4':
    'Zadajte zastávke Popisok a Pobyt v minútach. Pobyt nechajte prázdny, kým ho ešte neviete, a pre bod, ktorým iba prejdete, zadajte 0.',
  'help.guide.tour-walk-sights.goal': 'Vyberte tému, hľadajte pozdĺž prechádzky a pridajte miesto ako zastávku.',
  'help.guide.tour-walk-sights.tip.3':
    'Otváracie hodiny a weby pochádzajú zo zdroja, väčšinou z OpenStreetMap. Pred odchodom si ich overte.',
  'help.guide.tour-walk-day-times.tip.1':
    'Bez začiatočného času to riadok oznámi: „Give the walk a time on this day to see arrivals and opening hours.“',
  'help.guide.tour-walk-google-import.step.2': 'Vložte odkaz pod Odkaz na pešiu trasu a kliknite na Prečítať odkaz.',
  'help.guide.tour-walk-check-off.goal':
    'Označte v daný deň zastávky ako navštívené alebo preskočené a pozrite sa, koľko chôdze zostáva.',
  'help.guide.tour-walk-check-off.result':
    'Navštívené zastávky sú odškrtnuté, preskočené preškrtnuté a zostávajúci čas počíta iba to, čo je ešte pred vami.',
  'help.guide.tour-bike-profile.goal':
    'Začnite cyklotúru a nechajte TREK vytýčiť trasu pre turistickú jazdu, cestný bicykel, gravel alebo MTB.',
  'help.guide.tour-bike-profile.tip.1': 'Ak profil neskôr zmeníte, celá trasa sa naplánuje znova pre nový profil.',
  'help.guide.tour-bike-surfaces.step.2':
    'Odznak v záhlaví karty udáva podiel trasy, o ktorom je známe, že je nespevnený.',
  'help.guide.tour-bike-mtb-grades.title': 'Kontrola stupňov náročnosti chodníkov pri túre na horskom bicykli',
  'help.guide.tour-bike-mtb-grades.tip.3':
    'Ak sa stupne nepodarilo prečítať, karta to uvedie. Kliknite na Skúsiť znova.',
  'help.ctx.trip-tour-ski.bullet.5':
    'Kým je otvorená túra Lyže a zima, mapa ukazuje zjazdovky z OpenSnowMap s Legenda zjazdoviek vedľa ich prepínača. Všetko sú to mapové údaje: nič tu nehovorí, či je zjazdovka alebo vlek otvorený, aký je sneh, ani nič o lavínach.',
  'help.guide.tour-ski-plan.step.6': 'Zadajte túre názov pod Názov túry a kliknite na Uložiť.',
  'help.guide.tour-ski-options.step.1':
    'V túre Lyže a zima sú voľby smerovača pod Disciplína. Vidíte iba tie, ktoré vaša disciplína používa: Beh na lyžiach napríklad nemá Najťažšie zjazdovky.',
  'help.guide.tour-ski-options.result':
    'Túra sa znova naplánuje v rámci vašich limitov a karta Trasa po zjazdovkách vypisuje ťažšie zjazdovky, ktorým sa vyhla.',
  'help.guide.tour-ski-fix-leg.tip.3':
    'Offline sa úseky zatiaľ kreslia priamo. Sivý riadok o letných cestách je poznámka, nie chyba.',
  'help.guide.tour-ski-summary.tip.1':
    'Vynechané vypisuje ťažšie zjazdovky, ktorým sa smerovač vyhol kvôli vášmu limitu Najťažšie zjazdovky.',
  'help.guide.tour-ski-pistes-layer.step.2':
    'Kliknite na Legenda zjazdoviek, tlačidlo so štyrmi farebnými bodkami vedľa prepínača.',
  'help.guide.tour-ski-import.step.1':
    'Na karte Túry kliknite na Pridať túru (plus nad Túry tejto cesty), vyberte Importovať GPX alebo KML a zvoľte súbor.',
  'help.guide.tour-ski-import.tip.3':
    'Súbory GPX, KML alebo KMZ môžete tiež pustiť kamkoľvek na kartu Túry a otvorí sa rovnaký náhľad.',
  'help.ctx.trip-tour-paddle.bullet.5':
    'Vietor ukazuje predpoveď na začiatku túry pre deň, na ktorý je naplánovaná. Kontrolný zoznam vypisuje prekážky na uloženej trase a to, čo ste pri každej rozhodli.',
  'help.guide.tour-paddle-setup.step.5':
    'Na jazere určuje trasu Cez jazerá: Priamo je najkratšie, Pozdĺž brehu sa drží blízko brehu pre veterné dni.',
  'help.guide.tour-paddle-water-route.title': 'Naplánovanie úsekov na vode',
  'help.guide.tour-paddle-water-route.tip.2':
    'Tam, kde trasa obchádza jaz s prenášaním lode alebo vedie cez plavebnú komoru, TREK nastaví vlastný bod, označený Nájdené. Ak ho presuniete alebo zmeníte, stane sa vaším vlastným bodom.',
  'help.guide.tour-paddle-portage.step.3':
    'Pod bodom sa zobrazí karta Prenáška s jej dĺžkou a minútami navyše. Kliknutím ju otvoríte.',
  'help.guide.tour-paddle-lock.goal': 'Pridajte na túru plavebnú komoru a započítajte čakanie a prechod do jej času.',
  'help.guide.tour-paddle-lock.result': 'Plavebná komora je na túre so svojimi minútami a Odhad času ich pripočíta.',
  'help.guide.tour-paddle-time.tip.1':
    'TREK začína so 4 km/h na vode, 2 km/h pri prenášaní a 10 minútami pri každej prenáške. Sú to východiskové hodnoty na úpravu, nie namerané údaje.',
  'help.guide.tour-paddle-wind.step.3':
    'Pruhy ukazujú hodiny dňa, nárazy sú za priemerným vetrom. Keď ukážete myšou na pruh, zobrazia sa čísla a smer pre danú hodinu.',
  'help.guide.tour-paddle-checklist.goal':
    'Pozrite si, čo je známe o jazoch, plavebných komorách a pravidlách prístupu na uloženej trase, a rozhodnite, čo urobíte pri každom z nich.',
  'help.guide.tour-paddle-checklist.tip.3':
    'Položka označená Skontrolovať znova bola rozhodnutá pred zmenou trasy alebo údajov. Rozhodnite ju znova, alebo vyberte Ponechať rozhodnutie či Odstrániť rozhodnutie. Rozhodnutia, ktoré už neplatia, sú uvedené pod Staršie rozhodnutia.',
  'help.guide.tour-paddle-track-marks.step.3': 'Kliknite na Importovať 1 túru.',
  'help.guide.tour-paddle-track-marks.result':
    'Zaznamenaná stopa obsahuje svoje prenášky a plavebné komory a jej Odhad času ich započíta.',
  'help.guide.tour-horse-plan.title': 'Naplánovanie vychádzky po konských trasách',
  'help.guide.tour-horse-plan.step.7':
    'Zadajte vychádzke názov pod Názov túry a potom kliknite na Uložiť dole v ľavom stĺpci.',
  'help.guide.tour-horse-gap.goal': 'Pokračujte úsekom, ktorý začína ďalej od konca vašej vychádzky.',
  'help.guide.tour-horse-gap.tip.3':
    'Úsek, ktorý začína do 25 m od konca vašej vychádzky, na ňu nadväzuje priamo a Napojenie na vychádzku ukazuje Nadväzuje na koniec tvojej vychádzky.',
  'help.guide.tour-horse-recorded.tip.1':
    'Čiara zostáva presne taká, akú zaznamenal súbor. Nič sa znova nevytyčuje a zaznamenaná vychádzka nemá upraviteľnú verziu.',
  'help.guide.dateless-trip.result':
    'Karta ukazuje Nápad a Bez termínu a cesta má toľko prázdnych dní, koľko ste zadali.',
  'help.guide.trip-reminder.title': 'Pripomienka pred cestou',
  'help.guide.upcoming-reservations.tip.1': 'Pobyt v hoteli sa zobrazí dvakrát, raz pre príchod a raz pre odchod.',
  'help.guide.half-company-holiday.result':
    'Firma má pol dňa voľno a deň dovolenky zapísaný na ňom sa počíta len ako pol dňa.',
  'help.guide.edit-holiday-calendar.title': 'Zmena alebo odstránenie kalendára sviatkov',
  'help.guide.answer-fusion-request.result':
    'Po kliknutí na Prijať a prepojiť sa oba plány zobrazia v jednej mriežke, každá osoba vo svojej farbe.',
  'help.guide.log-for-partner.result':
    'Dni sa zobrazia vo farbe druhej osoby a počítajú sa do jej nároku, nie do vášho.',
  'help.guide.dissolve-fusion.tip.1':
    'Zrušiť v tomto okne ponechá plán, ako je. Vaše záznamy zostanú zachované v každom prípade.',
  'help.guide.country-places.tip.1':
    'Miesto pod nesprávnou krajinou má zvyčajne nesprávnu adresu alebo súradnice. Otvorte odtiaľto jeho cestu a miesto tam opravte.',
  'help.guide.tour-activity-stats.title': 'Prehľad toho, čo ste absolvovali na svojich túrach',
  'help.guide.tour-activity-stats.result':
    'Súčty v dialógu a na karte Túry už nezahŕňajú túru, ktorú ste vynechali. Jej trasa, dni a cesta zostávajú nezmenené.',
  'help.guide.move-to-list.tip.2':
    'Presun odoberá miesta zo zoznamu, preto Presunúť do zoznamu vidí iba jeho vlastník alebo správca. Duplikovať do zoznamu funguje z každého zoznamu, ktorý môžete otvoriť.',
  'help.guide.accept-list-invite.step.2':
    'Kliknutím na Prijať sa pripojíte, kliknutím na Zamietnuť pozvánku odmietnete.',
  'help.guide.tour-collection-add-to-trip.tip.2':
    'Ak bola túra uložená bez čiary, musia sa spolu s ňou pridať aj jej trasové body. Dialóg vás na to upozorní a túto možnosť vyberie za vás.',
  'help.guide.tour-collection-manage.tip.1':
    'Odstránenie túry zo zoznamu nemení túry, ktoré už z nej vznikli vo vašich cestách.',
  'help.guide.entry-draft.tip.2':
    'Keď prevezmete deň z Dawarich, jeho záznamy sú koncepty. Pred zdieľaním skontrolujte, či majú odznak.',
  'help.guide.journey-map-layers.result':
    'Mapa ukazuje iba vrstvy, ktoré chcete, a každý špendlík, bodku a čiaru vysvetľuje legenda.',
  'help.guide.journey-keep-route.result':
    'Záhlavie dňa ukazuje vzdialenosť a trasa je na vrstve Zaznamenané na mape nakreslená plnou čiarou pre každého v cestovnom denníku. Zdieľaný odkaz ju ukazuje, iba keď je zapnuté Zaznamenané trasy.',
  'help.guide.journey-day-stays.result':
    'Pobyty, o ktorých ste rozhodli, z riadka zmiznú. Záznamy, ktoré ste napísali, sa zobrazia v svojom dni ako každý iný záznam a fotky aj text môžete pridávať ako zvyčajne.',
  'help.guide.journey-take-over-day.tip.2':
    'Koncepty sa v zdieľaných odkazoch nezobrazujú. Pridajte fotky a text a potom v každom zázname vypnite Koncept.',
  'help.guide.journey-auto-prepare.tip.2':
    'Bodka na tlačidle zoznamu dňa znamená, že deň ešte nie je konečný. Jej tooltip povie prečo.',
  'help.ctx.settings-plugins.bullet.3':
    'Aktivita doplnkov dole vypisuje každú akciu, ktorú doplnok urobil vo vašom mene, od najnovšej, s tlačidlom Obnoviť.',
  'help.guide.language-region.tip.3':
    'Týždeň začína určuje prvý stĺpec každého výberu dátumu. Dovolenka (Vacay) má vlastné nastavenie.',
  'help.guide.web-push-device.tip.2': 'Na iPhone a iPade najprv pridajte TREK na plochu a otvorte ho odtiaľ.',
  'help.guide.connect-airtrail.step.3':
    'Kliknite na Uložiť a potom na Otestovať pripojenie. Zobrazí sa, koľko letov sa našlo, a odznak sa zmení na Pripojené.',
  'help.guide.connect-dawarich.step.3':
    'Kliknite na Uložiť a potom na Otestovať pripojenie: spočíta pobyty za posledných 30 dní. Po pripojení Skontrolovať teraz skontroluje nové pobyty hneď a Odpojiť vpravo spojenie ukončí.',
  'help.guide.tour-connect-wanderer.step.3':
    'Kliknite na Uložiť a potom na Otestovať pripojenie. Zobrazí sa, koľko vašich trás môžete importovať, a odznak sa zmení na Pripojené.',
  'help.guide.tour-wanderer-watch.step.2':
    'TREK najviac raz denne načíta krátky záznam každej importovanej trasy a v riadku sa zobrazí, kedy naposledy kontroloval. Ak sa trasa mohla zmeniť, dostanete oznámenie a započíta sa do Upozornenia. Kliknite na Upozornenia, uvidíte každú túru ako Možno zmenené, Zmenené alebo Nedá sa overiť a odtiaľ ju môžete otvoriť.',
  'help.guide.plugin-settings.goal': 'Zadajte doplnku vlastné kľúče a predvoľby a pozrite si, čo urobil vo vašom mene.',
  'help.guide.own-routing-engine.result': 'Trasy vo všetkých cestách sa počítajú na vašich serveroch.',
  'help.guide.admin-passkeys.title': 'Ponuka prihlásenia prístupovým kľúčom',
  'help.guide.rotate-jwt-secret.tip.1': 'Odhlási sa aj vás, takže sa hneď potom prihláste znova.',
  'help.guide.notification-defaults.title': 'Nastavenie predvolených oznámení pre používateľov',
  'help.ctx.notifications.title': 'Oznámenia',
  'help.guide.read-notifications.goal':
    'Pozrite sa, čo sa stalo vo vašich cestách, kým ste boli preč, a otvorte to priamo.',
  'help.guide.filter-notifications.goal': 'Prejdite všetky svoje oznámenia alebo iba tie, ktoré ste ešte neprečítali.',
  'help.guide.mark-notifications-read.step.1':
    'Kliknutím na Označiť ako prečítané, dvojité začiarknutie vedľa času oznámenia, označíte iba toto jedno oznámenie.',
  'help.guide.delete-notifications.step.2':
    'Zmazať všetko navrchu vymaže celý zoznam naraz, keď to potvrdíte v dialógu.',
  'help.guide.notification-settings.step.3':
    'Kliknite na Oznámenia v bočnom paneli Nastavenia. Jeho prvá karta má jeden riadok pre každú udalosť a stĺpec V aplikácii určuje, čo ukazuje zvonček.',
  'help.guide.link-journal.result':
    'Na lište kariet cesty sa zobrazí karta Denník. Každý, komu ste dali Čítať alebo Upraviť, môže na tejto karte otvoriť denník s aktualizáciami naživo.',
  'help.guide.create-place.tip.4':
    'Odkaz skopírovaný z Google Maps funguje aj vo vyhľadávaní: vložte ho, stlačte Enter a TREK z neho prečíta miesto. Keď má formulár pozíciu, Miesta v blízkosti tohto špendlíka, zameriavací kríž vedľa vyhľadávania, vypíše, čo je okolo.',
  'help.guide.dawarich-stays.step.2':
    'Pobyty sú zoskupené podľa dňa, každý s časom príchodu a odchodu. Ikona ukazovateľa označuje pobyt, pri ktorom si Dawarich nebol istý. Kliknite na Pridať ako miesto, špendlík vedľa pobytu.',
  'help.guide.leave-stop-off-route.step.3':
    'Ak ju chcete znova zaradiť do trasy, otvorte tú istú ponuku a vyberte Vrátiť do trasy.',
  'help.guide.move-booking-day.tip.1':
    'Vyblednuté riadky v dňoch medzi dňami viacdňovej rezervácie sa ťahať nedajú, rovnako ani jeden úsek letu s medzipristátiami.',
  'help.guide.place-image-from-file.step.2':
    'Kliknite na okrúhly obrázok v záhlaví. Keďže miesto má fotky, malé okno sa opýta, odkiaľ má obrázok pochádzať.',
  'help.guide.place-own-hours.goal':
    'Zadajte na kartu hodiny, ktoré ste skutočne overili, keď vyhľadané hodiny nesedia alebo chýbajú.',
  'help.guide.place-own-hours.tip.2':
    'Telefónne číslo a e-mail sa zobrazia ako štítky v záhlaví karty. Kliknutím na niektorý z nich ho otvoríte v telefóne alebo poštovej aplikácii.',
  'help.guide.edit-accommodation.tip.3':
    'Ak je v Nastavenia, pod Všeobecné, zapnuté Skryť rezervačné kódy, potvrdzovacie číslo zostane rozmazané. Ukážte naň myšou alebo naň kliknite a prečítate si ho.',
  'help.guide.confirm-stay-booking.tip.1': 'Kliknutím na štítok znova sa rezervácia vráti na Čaká na potvrdenie.',
  'help.guide.map-markers.tip.4':
    'Ak je zapnuté Kompaktné značky pre nenaplánované miesta, v Nastavenia > Všeobecné pod Cestovanie a mapa, miesta, ktoré ešte nie sú v žiadnom dni, sa zobrazia ako malé bodky bez fotky a hodnotenia. Vybrané miesto sa vždy zobrazí celé.',
  'help.guide.tour-map-lines.step.1':
    'Každá túra cesty je na mape nakreslená ako čiara vo svojej farbe, so špendlíkom tam, kde začína. Ak ste pre túru vybrali farbu, použije sa. Inak má čiara farbu svojej kategórie.',
  'help.guide.car-stops.step.6': 'Kliknite na Pridať.',
  'help.guide.transport-details.step.4':
    'Kliknutím na názov jazdu premenujete bez otvorenia formulára. Premenovať sa otvorí s vyplneným názvom: napíšte nový a kliknite na Uložiť.',
  'help.guide.export-transports-csv.goal':
    'Exportujte jazdy cesty z TREK ako súbor CSV, do tabuľky, pre cestovnú kanceláriu alebo na tlač.',
  'help.guide.group-sort-bookings.result':
    'Rezervácie sa zobrazia v sekciách a poradí, ktoré ste vybrali, a tento prehliadač si voľbu pamätá aj na ďalšiu návštevu.',
  'help.guide.booking-on-map.step.1':
    'Kliknite na kartu rezervácie, ktorá má miesto, prepojené pod Miesto / Aktivita alebo pri pobyte pod Ubytovanie. Otvorí sa jej detail.',
  'help.guide.export-bookings-csv.title': 'Export rezervácií ako tabuľky',
  'help.guide.export-bookings-csv.tip.3':
    'Tlačidlo je tam, hneď ako karta obsahuje rezerváciu. Karta Doprava exportuje svoje vlastné položky rovnako.',
  'help.guide.arrange-packing-list.title': 'Zoradenie zoznamu vecí podľa vás',
  'help.guide.count-packed-pieces.result':
    'Riadok ukazuje, koľko kusov je zabalených, a keď je zabalený posledný, položka sa odškrtne.',
  'help.guide.expense-receipts.title': 'Priloženie účtenky k výdavku',
  'help.guide.expense-receipts.tip.1':
    'V editore otvorí rovnaký náhľad aj kliknutie na názov uvedeného súboru. Esc potom zatvorí iba náhľad, nie výdavok.',
  'help.guide.files-sync-settings.step.5':
    'Keď sa zmenili obe strany určuje, ktorá kópia sa ponechá, ak bol dokument upravený na oboch miestach: Opýtať sa, Ponechať kópiu z TREKu alebo Ponechať kópiu z úložiska. Synchronizovať automaticky nechá TREK kontrolovať zmeny na pozadí. Keď je vypnuté, karta ukazuje Pozastavené a synchronizáciu spustí iba Synchronizovať teraz. Každá zmena tu sa uloží okamžite.',
  'help.guide.manage-notes.step.5':
    'Vymazať sa najprv opýta, Vymazať poznámku?, pretože sa poznámka vymaže pre každého člena aj s jej súbormi. Potvrďte kliknutím na Vymazať.',
  'help.guide.note-categories.step.3':
    'Kliknutím na názov kategórie ju premenujete. Napíšte nový názov a stlačte Enter. Esc ponechá starý.',
  'help.guide.roadtrip-reorder.step.2':
    'Ak chcete zastávku presunúť na iný deň, pustite ju na zastávku v karte toho dňa. Počas ťahania sa deň s menej ako dvoma zastávkami zobrazí ako prerušovaná karta na konci lišty a môžete zastávku pustiť aj na ňu.',
  'help.guide.roadtrip-corridor.tip.4':
    'Pod filtrom vyberte jednu zastávku dňa alebo Medzi dvoma v polovici, aby zostalo iba to, čo leží do 25, 50 alebo 100 km od toho bodu. Ak sú v zozname nabíjačky, Ľubovoľná zásuvka a Ľubovoľný výkon ich zúžia podľa zásuvky a výkonu.',
  'help.guide.roadtrip-overnight.result':
    'Miesto sa v jazde zobrazí ako nocľah toho dňa a pobyt je v ceste zarezervovaný ako každý iný.',
  'help.guide.roadtrip-stop-fill.result':
    'Pri tejto zastávke sa nádrž naplní na hodnotu, ktorú ste vybrali. Z nej sa počíta aj dojazd po zastávke, vrátane prípadného pásma Tu dôjde palivo.',
  'help.guide.roadtrip-bookings.step.4': 'Kliknutím na kartu otvoríte rezerváciu.',
  'help.guide.roadtrip-google-import.goal':
    'Zmeňte trasu naplánovanú v Google Maps na zastávky v jednom zo svojich dní.',
  'help.guide.roadtrip-google-import.tip.3': 'Import vyžaduje pripojenie a oprávnenie upravovať miesta aj dni.',
  'help.guide.roadtrip-hazards.tip.2':
    'DWD pokrýva Nemecko a GDACS hlási katastrofy po celom svete. Upozornenie zadané iba ako bod uvádza, že dotknutá oblasť je neznáma.',
  'help.ctx.trip-tours.bullet.5':
    'V stĺpci dní je túra riadok ako zastávka. Ak má Začiatok, zobrazí sa začiatok → koniec, pričom koniec sa vypočíta z času túry. Ďalšie možnosti obsahujú Upraviť, Odobrať z dňa, Vynechať z trasy a Uložiť do zbierky.',
  'help.guide.tour-show-list.step.5': 'Kliknutím na Miesta v tom istom prepínači sa vrátite k zoznamu miest.',
  'help.guide.tour-add-to-day.step.2':
    'Vyberte deň. Ponuka vypisuje každý deň cesty s dátumom a názvom. Deň, ktorý túru už obsahuje, je sivý.',
  'help.guide.tour-add-to-day.result': 'Túra je uvedená pod svojím dňom a jej čiara je na mape súčasťou toho dňa.',
  'help.guide.tour-day-times.tip.2':
    'Deň s jednou etapou viacdňovej túry nemá vypočítaný čas konca, pretože čas túry je čas celej trasy.',
  'help.guide.tour-remove-from-day.step.3':
    'Alebo kliknite na záhlavie dňa, aby sa deň otvoril, kliknite na túru v zozname a potom dole na jej karte na Odobrať z dňa.',
  'help.guide.tour-filter-list.step.3':
    'Ak sú v zozname rôzne druhy, môžete ho ďalej zúžiť podľa Zdroj (TREK, Import GPX, wanderer), Limit trasy (T1 až T6) a Typ (Pešia túra, Cyklotúra a tak ďalej). Opätovným kliknutím na zaškrtnutú hodnotu ju zrušíte.',
  'help.guide.tour-hide-on-map.step.1':
    'Ukážte na túru v zozname a kliknite na oko, ktoré sa zobrazí vpravo od jej riadka (Skryť na mape).',
  'help.guide.tour-import-plan-tab.step.1': 'Na karte Plán kliknite na Túry v prepínači navrchu pravého stĺpca.',
  'help.ctx.trip-tour-detail.bullet.1':
    'Kliknite na túru v zozname Túry (najprv prepnite pravý stĺpec z Miesta na Túry), na jej riadok v dni alebo na jej čiaru na mape a jej karta sa otvorí nad mapou. Mapa zostáva použiteľná, aj keď je karta otvorená.',
  'help.guide.tour-detail-read.step.2':
    'Záhlavie ukazuje názov túry a súhrn v štítkoch: druh túry, odkiaľ pochádza, ak bola importovaná, plánovaný čas, vzdialenosť, stúpanie a klesanie.',
  'help.guide.tour-detail-read.tip.3':
    'Niektoré túry ukazujú viac: prechádzka mestom svoje zastávky, vodácka túra svoje kontroly a vietor, už absolvovaná túra svoju Skutočná trasa a túra prepojená so zoznamom svoj Zoznam vecí.',
  'help.guide.tour-rename-colour.step.3':
    'Kliknite na farebnú bodku v rohu okrúhlej dlaždice túry, Farba stopy. Pod záhlavím sa otvorí sekcia Farba stopy.',
  'help.guide.tour-take-along.step.2':
    'Ak má túra webovú stránku, tlačidlo vedľa ukazuje názov stránky (Komoot, AllTrails, Outdooractive alebo Wanderer) alebo Webová stránka pri akejkoľvek inej. Stránku otvorí na novej karte.',
  'help.guide.tour-copy-keep.goal':
    'Vytvorte variant túry v tejto ceste alebo ju uložte do jednej zo svojich zbierok pre neskoršie cesty.',
  'help.guide.tour-copy-keep.tip.4':
    'Zbierka sa zobrazí, iba kým je zapnutý doplnok Zbierky. Zoznam, ktorý môžete iba čítať, sa vybrať nedá, a ak ešte nemáte žiadny zoznam, dialóg ponúka Otvoriť zbierky.',
  'help.guide.tour-packing-link.step.5':
    'Kliknutím na Otvoriť zoznam vecí môžete veci odškrtávať. TREK prepne na kartu Zoznamy, na zoznam vecí.',
  'help.guide.tour-files.step.2': 'Riadok pod tým ich teraz počíta a zoznam sa otvorí.',
  'help.guide.tour-activity-link.step.2':
    'Pod Uskutočnené vyberte deň, kedy ste túru absolvovali. Ak k žiadnemu dňu nepatrí, vyberte Bez dňa.',
  'help.guide.tour-activity-compare.title': 'Porovnanie plánu s tým, čo ste absolvovali',
  'help.guide.tour-activity-compare.result': 'Môžete rýchlo porovnať deň s plánom, na karte aj na mape.',
  'help.guide.tour-origin-check.tip.3':
    'Žiadne pripojenie k wanderer znamená, že váš účet ešte nie je pripojený. Pripojíte ho v Nastavenia, pod Integrácie.',
  'help.ctx.trip-tour-planner.bullet.5':
    'Hľadať miesto alebo adresu navrchu mapy posunie mapu. Štítok vľavo dole prepína medzi mapami, ktoré typ túry ponúka, ako Topo alebo Satelit, a obsahuje prepínače otvorenej túry, ako Pridávať body a 3D.',
  'help.guide.tour-open-workspace.step.5':
    'Hľadať miesto alebo adresu navrchu mapy posunie mapu na miesto, takže môžete začať tam, kde túra je.',
  'help.guide.tour-draw-route.goal': 'Nastavte na mape body novej túry a nechajte TREK vypočítať trasu medzi nimi.',
  'help.guide.tour-draw-route.tip.2':
    'Topo alebo Turistika v štítku mapy zobrazí cesty, vďaka čomu je jednoduchšie na ne kliknúť. Bod príliš ďaleko od akejkoľvek cesty, ktorú typ môže použiť, dostane namiesto trasy upozornenie.',
  'help.guide.tour-type-profile.step.3':
    'Cyklotúra si pod typom pýta Profil: Trekking, Cestný, Gravel alebo MTB. Riadok pod ním uvádza, čo profil uprednostňuje.',
  'help.guide.tour-edit-points.step.2':
    'Kliknutím na riadok pod Trasové body vyberiete jeho bod. Jeho špendlík je na mape zvýraznený.',
  'help.guide.tour-shaping-points.title': 'Usmernenie trasy tvarovacím bodom',
  'help.guide.tour-shaping-points.tip.3':
    'Pri vychádzke na koni kliknutie na čiaru nič nepridá, pretože jej tvar neurčuje žiadny smerovač.',
  'help.guide.tour-loop-reverse.tip.2':
    'Odstráňte riadok Späť na štart, aby bola túra opäť jednosmerná. Úsek nakreslený ručne zostane po obrátení túry nakreslený ručne.',
  'help.guide.tour-leg-by-hand.step.4':
    'Znova vypočítať ďalší úsek sa smerovača opýta ešte raz iba na ten jeden úsek, bez zásahu do ostatných.',
  'help.guide.tour-trip-places.step.3':
    'Kliknite na miesto. Pridá sa ako nový koniec túry a zoznam zostane otvorený pre ďalšie miesto.',
  'help.guide.tour-details-times.step.1':
    'Názov túry navrchu ľavého panela obsahuje názov. Pri novej túre je sivý text, napríklad Pešia túra bez názvu, len zástupný: napíšte vlastný názov.',
  'help.guide.tour-save.title': 'Uloženie túry',
  'help.guide.tour-save.tip.3':
    'Uložiť nefunguje ani vtedy, keď niektoré pole obsahuje neplatnú hodnotu, napríklad webovú stránku, ktorá nie je adresou. Podrobnosti sa otvoria samy, aby ju ukázali.',
  'help.guide.tour-edit-saved.tip.1': 'Uložiť zostáva sivé pri túre, ktorú ste nezmenili.',
  'help.guide.tour-summary-profile.step.3':
    'Posúvajte ukazovateľ po Výškový profil. Ukáže vzdialenosť a výšku v danom bode a bodka označí to isté miesto na mape.',
  'help.guide.tour-list-manage.step.1':
    'Rozsah cesty je nad zoznamom. Keď je zbalený, ukazuje počet túr a koľko z nich je Plánované a Nezaradené. Šípka vpravo otvorí riadok pre každý typ so súčtom vzdialenosti, stúpania, klesania a časov.',
  'help.guide.tour-list-manage.result':
    'Vidíte súčty pre túry, ktoré filter ukazuje, a každá túra je v dni, ktorý ste chceli.',
  'help.guide.tour-delete.result': 'Túra zmizne zo zoznamu, z mapy aj zo všetkých dní.',
  'help.guide.tour-saved-elsewhere.tip.2':
    'To isté sa stane, ak ste túru zmenili na inom zariadení. Túra, ktorú ste nezmenili, sa jednoducho znova načíta a poznámka vás na to upozorní.',
  'help.ctx.trip-tour-import.bullet.5':
    'Keď je wanderer pripojený v Nastavenia, Integrácie, zobrazí sa vedľa Naplánovať novú túru tlačidlo wanderer, ak nie je otvorená žiadna túra. Vypíše vaše vlastné trasy na import.',
  'help.guide.tour-import-gpx.tip.1':
    'Súbory môžete aj potiahnuť z počítača na kartu Túry a pustiť ich tam. Otvorí sa rovnaký náhľad.',
  'help.guide.tour-view-import.step.1': 'Na karte Túry kliknite v Túry tejto cesty na túru s odznakom Import GPX.',
  'help.guide.tour-plan-from-import.goal':
    'Získajte zo zaznamenanej stopy trasové body, ktoré môžete presúvať, a pozrite sa, ako blízko stopy nová trasa vedie.',
  'help.guide.tour-plan-from-import.tip.4':
    'Vychádzka na koni nemá upraviteľnú verziu: zostáva tak, ako bola prejdená.',
  'help.guide.tour-restore-recorded.tip.2':
    'Túra vytvorená cez Naplánovať ako novú túru nemá vlastnú zaznamenanú stopu. Import, z ktorého vznikla, je stále v zozname.',
  'help.guide.tour-take-over.step.5': 'Ak chcete, zadajte jej iný názov pod Názov v tejto ceste.',
  'help.guide.tour-import-wanderer.step.1':
    'Na karte Túry, keď nie je otvorená žiadna túra, kliknite na wanderer vedľa Naplánovať novú túru.',
  'help.guide.tour-import-wanderer.result': 'Trasa je túra v ceste a na mape sa otvorí ako Túra z aplikácie wanderer.',
  'help.guide.tour-map-layers.title': 'Výber mapy pre túru',
  'help.guide.tour-map-layers.tip.3':
    'Vodácka túra a prechádzka mestom ponúkajú iba Mapa a Satelit. Beh, lyžiarska túra a vychádzka na koni ponúkajú Mapa, Topo a Satelit.',
  'help.guide.tour-along-search.result': 'Miesta pozdĺž trasy sú v zozname aj na mape a môžete si ich prezrieť.',
  'help.guide.tour-along-add-stop.step.3':
    'Kliknite na Pridať ako zastávku. Odznak vedľa je hrubý odhad odbočky, meraný vzdušnou čiarou.',
  'help.guide.tour-3d-terrain.step.1':
    'Otvorte túru na karte Túry a kliknite na 3D na konci štítka vľavo dole. Mapa sa nakloní a zobrazí terén v 3D s vyznačenou trasou.',
  'help.guide.tour-3d-terrain.tip.3':
    'Krajina vyžaduje pripojenie: jej výšky pochádzajú z otvorených dlaždíc terénu Mapzen. Vodácka túra sa kreslí vlastnou farbou bez stupňov, pretože voda je plochá.',
  'help.guide.tour-3d-flyover.tip.1':
    'Počas preletu môžete kolieskom myši približovať a odďaľovať. Kamera zostáva na bodke. Mapu nemožno ťahať, kým prelet nepozastavíte.',
  'help.guide.tour-map-overlays.step.4':
    'Pri vodáckej túre štítok ponúka namiesto toho Plavebné znaky. Kliknutím naň zobrazíte na vode bóje, majáky a prístavné značky.',
  'help.ctx.trip-tour-stages.bullet.2':
    'Ukončiť etapu tu v ponuke Ďalšie akcie pri zastávke ukončí etapu na tej zastávke. Trasové body potom ukazujú nadpis Etapa N pre každú etapu s jej vzdialenosťou a časom a zastávka, ktorá etapu ukončuje, má ikonu mesiaca.',
  'help.guide.tour-multi-day.step.3':
    'Ukážte na zastávku, kde prvý deň končí, kliknite na Ďalšie akcie a vyberte Ukončiť etapu tu.',
  'help.guide.tour-multi-day.result':
    'Jedna trasa s etapami, každá odmeraná zvlášť. Kliknutím na Uložiť ich zachováte.',
  'help.guide.tour-stages-on-days.step.6':
    'Šípka vedľa, Otvoriť túto etapu v plánovači, otvorí túru v editore pri tej etape.',
  'help.ctx.trip-tour-hike.bullet.1':
    'Typ túry navrchu editora určuje, ako sa trasa plánuje. Pešia túra používa cesty až po Maximálna náročnosť chodníka pod Podrobnosti. Beh používa cesty vhodné na beh a pýta si vaše Plánované tempo.',
  'help.guide.tour-hike-plan.step.1':
    'Kliknite na Naplánovať novú túru navrchu ľavého stĺpca. Editor sa otvorí ako Nová túra.',
  'help.guide.tour-hike-plan.tip.2':
    'T4 a vyššie sa najprv opýtajú Povoliť vysokohorské trasy? Potvrďte iba vtedy, ak trasa smie viesť exponovaným alebo neznačeným terénom. Otázka sa zobrazí raz za reláciu úprav.',
  'help.guide.tour-hike-trail-details.step.4':
    'Kliknutím na stupeň v zozname zobrazíte na mape iba tieto úseky. Opätovným kliknutím zobrazíte celú trasu.',
  'help.guide.tour-hike-round.step.1':
    'Keď je pešia túra otvorená, kliknite v záhlaví karty Trasové body na Okruh od štartu. Z inej zastávky otvorte jej Ďalšie akcie a vyberte Okruh odtiaľto.',
  'help.guide.tour-hike-round.tip.3':
    'Hľadať znova sa vráti k zadaniu vzdialenosti a Zrušiť zatvorí kartu bez akejkoľvek zmeny.',
  'help.guide.tour-hike-compare-ways.tip.1':
    'Toto ponúkajú iba pešie túry, a to iba pre úsek, ktorý naplánoval smerovač, nie pre ručne nakreslený.',
  'help.guide.tour-ferrata-add.step.4':
    'V Trasové body ukazuje úsek medzi týmito dvoma bodmi názov, stupeň a dĺžku ferraty.',
  'help.guide.tour-run-plan.goal': 'Naplánujte beh po cestách vhodných na beh a získajte jeho čas z vášho tempa.',
  'help.guide.tour-run-plan.tip.2':
    'Stúpania, klesania a technická náročnosť cesty sa do času nezapočítavajú: je to vzdialenosť krát tempo a nič iné.',
  'help.guide.tour-run-ways.result': 'Ešte pred odchodom viete, ktoré časti behu nevedú po asfalte.',
  'help.ctx.trip-tour-walk.bullet.4':
    'Pozdĺž túry nájde pamätihodnosti podľa Téma prechádzky v zadanej vzdialenosti od trasy a Pridať ako zastávku jednu z nich naplánuje do prechádzky na miesto, ktoré si vyberiete.',
  'help.guide.tour-walk-plan.step.5':
    'Nastavte Dôležitosť na Bežná, Voliteľné alebo Musíš vidieť. Zapnite Chránená pri zastávke, ktorá musí zostať na svojom mieste, keď sa neskôr navrhne zmena, a potom kliknite na Uložiť.',
  'help.guide.tour-walk-sights.step.1':
    'Keď je prechádzka mestom otvorená, nájdite v ľavom stĺpci Pozdĺž túry a vyberte Téma prechádzky: Kultúra a história, Parky a výhľady, Jedlo a miestny život alebo Od všetkého trochu.',
  'help.guide.tour-walk-sights.result':
    'Pamätihodnosť je zastávkou prechádzky a je naplánovaná do trasy medzi zastávkami, ktoré ste vybrali.',
  'help.guide.tour-walk-day-times.tip.2':
    'Ak zastávka ešte nemá čas pobytu, časy príchodu po nej sa zobrazia ako najskoršie možné.',
  'help.guide.tour-walk-google-import.step.3':
    'Skontrolujte Zastávky v odkaze. Zastávka, ktorá nemá v odkaze polohu, je označená a vynechaná.',
  'help.guide.tour-walk-check-off.step.1':
    'Na karte Plán kliknite na prechádzku mestom v jej dni. Jej karta sa otvorí vedľa mapy.',
  'help.ctx.trip-tour-bike.title': 'Cyklotúry',
  'help.guide.tour-bike-profile.step.1': 'Na karte Túry kliknite na Naplánovať novú túru navrchu ľavého panela.',
  'help.guide.tour-bike-profile.tip.2':
    'Profil len usmerňuje smerovač. Nehovorí nič o tom, či sa po ceste dá jazdiť: karta Povrch a cesty ukazuje, po čom trasa vedie.',
  'help.guide.tour-bike-surfaces.step.3':
    'Pod Povrch kliknite na riadok, napríklad Gravel alebo Prírodný povrch. Jeho úseky sa na mape zvýraznia. Opätovným kliknutím na riadok zvýraznenie zrušíte.',
  'help.guide.tour-bike-mtb-grades.goal':
    'Pozrite sa, aké ťažké sú chodníky na túre MTB, ešte skôr, než po nich pôjdete.',
  'help.guide.tour-bike-mtb-grades.tip.4':
    'Ak prepnete Profil z MTB na iný, sekcie so stupňami zmiznú. Trasa sa potom naplánuje znova pre nový profil.',
  'help.guide.tour-ski-plan.title': 'Naplánovanie lyžiarskej a zimnej túry',
  'help.guide.tour-ski-plan.tip.1':
    'Pri Beh na lyžiach vyberte aj Technika: Klasika, Korčuľovanie alebo Neznáma. Upozornenie pod poľami ukazuje, čo ešte chýba.',
  'help.guide.tour-ski-options.step.2':
    'Otvorte Najťažšie zjazdovky a vyberte najvyšší stupeň, na ktorom chcete lyžovať, od Začiatočník po Expertná. Predvolená je Stredná.',
  'help.guide.tour-ski-fix-leg.title': 'Oprava lyžiarskeho úseku, ktorý sa nepodarilo naplánovať',
  'help.guide.tour-ski-fix-leg.tip.4':
    'Kým nie je naplánovaný každý úsek, karta Trasa po zjazdovkách uvádza, že čas na lyžiach zatiaľ nie je k dispozícii.',
  'help.guide.tour-ski-summary.tip.2':
    'Čas na lyžiach zostáva Nepočíta sa, kým nie je naplánovaný každý úsek. Ak chcete túre dať čas aj tak, zadajte plánovaný súčet v jej podrobnostiach.',
  'help.guide.tour-ski-pistes-layer.step.3':
    'Legenda ukazuje zjazdovky podľa náročnosti, bežecké trate, zimné a snežnicové trasy, sánkarské dráhy a vleky. Celá legenda na OpenSnowMap otvorí úplnú legendu.',
  'help.guide.tour-ski-import.step.2': 'V Náhľad importu otvorte Importovať ako a vyberte Lyže a zima.',
  'help.guide.tour-ski-import.result':
    'Stopa je v Túry tejto cesty a jej disciplína a technika sú na karte Lyžiarska trasa.',
  'help.ctx.trip-tour-paddle.bullet.6':
    'Pádlovanie má riziká, riadok dole v ľavom stĺpci, otvorí Bezpečnosť na vode. Mapa ponúka Mapa a Satelit a ako prekrytie Plavebné znaky.',
  'help.guide.tour-paddle-setup.step.6':
    'Rýchlosť pádlovania ukazuje návrh podľa lode sivou. Napíšte vlastnú rýchlosť a pole ukáže Vlastná rýchlosť. Odkaz pod ním, Použiť navrhovanú, vráti rýchlosť lode.',
  'help.guide.tour-paddle-water-route.goal':
    'Nechajte TREK naplánovať úsek pozdĺž rieky alebo jazera a porozumejte poznámkam pri úseku, ktorý nevedel naplánovať.',
  'help.guide.tour-paddle-water-route.tip.3':
    'Poznámky pod naplánovaným úsekom upozorňujú na Divokú vodu s jej stupňom, na Vodácky priepust alebo na Medzera v mapových údajoch preklenutú priamou čiarou.',
  'help.guide.tour-paddle-portage.step.4':
    'Pod Trasa Sledovať cestu použije zmapovanú cestu a Priama čiara vedie priamo naprieč. TREK hľadá cestu sám a povie vám, keď neexistuje žiadna bez dlhej odbočky.',
  'help.guide.tour-paddle-lock.step.1':
    'Ukážte na zastávku pri plavebnej komore a kliknite na Ďalšie akcie, tri bodky.',
  'help.guide.tour-paddle-time.title': 'Čítanie a úprava času vodáckej túry',
  'help.guide.tour-paddle-time.tip.2': 'Prúd a vietor nie sú v odhade zahrnuté.',
  'help.guide.tour-paddle-wind.step.4':
    'Otvorte Čo znamená vietor pri pádlovaní a zistite, čo robí s loďou čelný vietor, bočný vietor, otvorené prechody a nárazy.',
  'help.guide.tour-paddle-checklist.step.1':
    'Uložte vodácku túru a potom v ľavom stĺpci nájdite Kontrolný zoznam. Odznak v jeho záhlaví zhŕňa, ako zoznam stojí.',
  'help.guide.tour-paddle-checklist.tip.4':
    'Prekážky pochádzajú z údajov OpenStreetMap pre regióny, ktoré TREK má. Kde ich nemá, karta to uvedie a jazy, plavebné komory a prenášky si overíte sami.',
  'help.guide.tour-paddle-track-marks.step.4':
    'Kliknite na stopu v Túry tejto cesty. Ľavý stĺpec ju ukazuje tak, ako bola zaznamenaná, s kartou Prenášky a plavebné komory.',
  'help.ctx.trip-tour-horse.title': 'Vychádzky na koni',
  'help.guide.tour-horse-plan.goal': 'Zostavte vychádzku na koni z úsekov značených konských trás v zobrazení mapy.',
  'help.guide.tour-horse-plan.result':
    'Vychádzka sleduje úseky, ktoré ste prevzali, každý s názvom svojej trasy, bodkou prístupu a dĺžkou, a je uvedená v Túry tejto cesty.',
  'help.guide.tour-horse-gap.step.1':
    'Keď je na vychádzke už jeden úsek, otvorte inú trasu a vyberte úsek, ktorý sa nedotýka konca vašej vychádzky. Pod Napojenie na vychádzku oznámenie uvádza, ako ďaleko od seba sú.',
  'help.guide.tour-horse-recorded.title': 'Uchovanie zaznamenanej vychádzky zo súboru GPX',
  'help.guide.tour-horse-recorded.tip.2': 'Súbor bez výšok ukazuje V súbore nie sú výšky namiesto nulového stúpania.',
  'help.guide.dateless-trip.tip.1':
    'Keď už budete vedieť, kedy cestujete, otvorte formulár ceruzkou na karte a vyberte dátumy. Naplánované dni si zachovajú poradie a dátumy dostanú v rovnakom poradí.',
  'help.guide.trip-reminder.goal': 'Nechajte si pripomenúť cestu niekoľko dní pred odchodom.',
  'help.guide.upcoming-reservations.tip.2':
    'Stav „Čaká na potvrdenie“ označuje rezerváciu, ktorá ešte nie je potvrdená. Zrušené rezervácie a archivované cesty sa tu nezobrazujú.',
  'help.guide.half-company-holiday.tip.1':
    'Dovolenka, ktorá je na ten deň už zapísaná, sa skráti na pol dňa. Kto si ten deň zapíše neskôr, minie iba 0,5 dňa.',
  'help.guide.edit-holiday-calendar.goal':
    'Premenujte, prefarbite, presuňte alebo vymažte pridaný kalendár štátnych sviatkov či školských prázdnin.',
  'help.guide.person-color.title': 'Zmena farby osoby',
  'help.guide.answer-fusion-request.tip.1':
    'Žiadosť zostane otvorená, kým na ňu neodpoviete. Ak ich je viac, zobrazia sa postupne jedna za druhou.',
  'help.guide.log-for-partner.tip.1': '„Pol dňa“ a „Náhradné / pružné voľno“ fungujú aj pre vybranú osobu.',
  'help.guide.dissolve-fusion.tip.2': 'Ak chcete, aby niekto vaše dni iba videl, zdieľajte mu radšej svoj kalendár.',
  'help.guide.country-details.tip.2':
    'Kliknite na odznak s počtom miest a uvidíte všetky miesta započítané pre krajinu, zoskupené podľa ciest.',
  'help.guide.country-places.tip.2':
    'Odznak sa zobrazí len vtedy, keď má krajina vlastné miesta. Krajina, ktorú ste označili iba ručne, žiadne nemá.',
  'help.guide.tour-activity-stats.goal':
    'Pozrite si vzdialenosť, prevýšenie a počet absolvovaných túr zo všetkých ciest za zvolené obdobie a typ a vynechajte túru, ktorá sa neuskutočnila.',
  'help.guide.tour-activity-stats.tip.1':
    'Túra sa započíta, keď uplynie jej posledný deň. Túra, ktorá nie je v žiadnom dni alebo len v dňoch bez dátumu, sa nezapočíta nikdy. Ak ju chcete započítať, zaraďte ju do dňa s dátumom v jej ceste.',
  'help.guide.move-to-list.result':
    'Miesta sú v druhom zozname a krátke hlásenie ukáže, koľko z nich sa presunulo alebo duplikovalo.',
  'help.guide.accept-list-invite.tip.1':
    'Čo môžete v zozname robiť, závisí od roly, ktorú vám vlastník pridelil: Divák, Editor alebo Správca.',
  'help.guide.tour-collection-add-to-trip.title': 'Pridanie túry zo zoznamu do cesty',
  'help.guide.tour-collection-add-to-trip.tip.3':
    'Ak si chcete túru uchovať v zozname, otvorte uloženú túru v ceste a v jej spodnej lište kliknite na „Zbierka“.',
  'help.guide.tour-collection-manage.tip.2': 'Kôš vidí iba vlastník a správcovia zoznamu.',
  'help.guide.entry-draft.result':
    'Záznam zostane na vašej časovej osi s označením „Koncept“ a na zdieľanom odkaze sa nezobrazí.',
  'help.guide.journey-map-layers.title': 'Čo zobrazuje mapa cestovného denníka',
  'help.guide.journey-keep-route.title': 'Uloženie trasy zaznamenanej v daný deň',
  'help.guide.journey-day-stays.title': 'Záznamy z pobytov zaznamenaných v Dawarich',
  'help.guide.journey-take-over-day.title': 'Prevzatie celého zaznamenaného dňa',
  'help.guide.journey-take-over-day.result':
    'Deň má teraz jeden koncept za každý pobyt alebo spojenú skupinu, prípadne jednu dennú správu, a jeho pobyty už nie sú medzi otvorenými.',
  'help.guide.journey-auto-prepare.result':
    'Kým prepojená cesta prebieha, pobyty každého dňa sú pripravené pri danom dni na „Prevziať deň“.',
  'help.ctx.settings-about.title': 'O aplikácii',
  'help.guide.web-push-device.tip.3':
    'Push oznámenia fungujú iba vtedy, keď máte TREK otvorený cez HTTPS. Ak sú oznámenia zablokované, povoľte ich v nastaveniach prehliadača a skúste to znova.',
  'help.guide.connect-airtrail.result':
    'Odznak ukazuje „Pripojené“ a na karte „Doprava“ v ceste je k dispozícii „Import z AirTrail“.',
  'help.guide.connect-dawarich.result':
    'Odznak ukazuje „Pripojené“ a plánovač ciest, denník aj Atlas môžu ponúknuť to, čo zaznamenal Dawarich.',
  'help.guide.tour-connect-wanderer.result':
    'Odznak ukazuje „Pripojené“ a na karte „Túry“ v ceste môžete prehľadávať svoj wanderer a importovať z neho trasy.',
  'help.guide.tour-wanderer-watch.result':
    'TREK kontroluje vaše importované trasy a upozorní vás, keď sa niektorá mohla zmeniť. Túra sa zmení iba vtedy, keď zmenu prijmete.',
  'help.guide.plugin-settings.step.1':
    'V bočnom paneli nastavení otvorte „Pluginy“. V časti „Nastavenia doplnkov“ má každý plugin, ktorý od vás potrebuje nastavenia, vlastnú kartu s poľami: vyplňte ich a kliknite na „Uložiť“. Akcie na karte sa spustia až po potvrdení.',
  'help.guide.profile.step.3': 'Kliknite na „Uložiť profil“ vpravo v spodnej časti karty.',
  'help.guide.default-user-settings.title': 'Predvolené nastavenia pre nových používateľov',
  'help.guide.own-routing-engine.tip.1':
    'Verejné servery OSRM zvládnu zhruba jednu požiadavku za sekundu. Na jeden deň to stačí, no pri road tripe to môže byť príliš pomalé.',
  'help.guide.admin-passkeys.goal': 'Umožnite ľuďom prihlásiť sa odtlačkom prsta, tvárou alebo PIN kódom zariadenia.',
  'help.guide.rotate-jwt-secret.tip.2':
    'Ak chcete odhlásiť iba jednu osobu, nastavte jej v časti „Upraviť používateľa“ nové heslo. Ukončia sa tým iba jej relácie.',
  'help.guide.notification-defaults.goal':
    'Určite, ako budú mať všetci používatelia oznámenia nastavené na začiatku, a úplne zablokujte kanál pre určitú udalosť.',
  'help.ctx.notifications.summary':
    'Všetky oznámenia, ktoré vám TREK zobrazil v aplikácii, od najnovších: rezervácia, ktorú niekto zmenil, nová správa v čete cesty, kalendár, ktorý s vami niekto zdieľal. Zvonček vpravo hore ukazuje desať najnovších, táto stránka všetky.',
  'help.guide.read-notifications.step.1':
    'Kliknite na zvonček vpravo hore. Červené číslo na ňom ukazuje počet neprečítaných oznámení.',
  'help.guide.filter-notifications.step.1': 'Kliknite na zvonček vpravo hore.',
  'help.guide.mark-notifications-read.step.2':
    'Kliknutím na „Označiť všetko ako prečítané“ navrchu označíte všetky oznámenia naraz.',
  'help.guide.delete-notifications.tip.1':
    'Vymazaním odstránite oznámenie iba u seba. Rezervácia, správa či zdieľanie, ktorých sa týkalo, zostanú nezmenené.',
  'help.guide.notification-settings.tip.1': 'Zámok v bunke znamená, že správca túto udalosť vypol pre všetkých.',
  'help.guide.add-guest.tip.3':
    'Hostí môže pridávať, premenúvať a odoberať iba vlastník cesty. Hosťa, ktorý zaplatil nejaký výdavok, nemožno odobrať, kým nezmeníte platiteľa alebo platbu nevymažete.',
  'help.guide.link-journal.tip.1':
    'Prepojiť môžete iba denníky, ktoré vlastníte. Denník, do ktorého môžete iba písať, prepojiť nemôžete.',
  'help.ctx.trip-places.bullet.7':
    'Zaškrtávacím políčkom vedľa vyhľadávania spustíte výber. Lištou dole v stĺpci potom môžete viacerým riadkom naraz priradiť novú kategóriu, pridať ich do zbierky, označiť ich ako navštívené alebo ich vymazať.',
  'help.guide.filter-places.step.5':
    'Keď cesta zahŕňa viac krajín alebo regiónov, glóbusom zúžite zoznam na jednu krajinu alebo jeden jej región; pri každom je uvedený počet. „Vymazať filter“ vráti zobrazenie na „Všetky krajiny“.',
  'help.guide.import-places-file.tip.3':
    'Keď sú Túry zapnuté, čo je predvolené, súbor importujete cez Túry navrchu stĺpca tlačidlom „Importovať GPX alebo KML“ a jeho čiary sa stanú túrami. Body zo súboru sa tam neimportujú, pretože túry obsahujú iba čiary.',
  'help.guide.dawarich-stays.step.3':
    'Skontrolujte názov, príchod a odchod, vyberte deň alebo nechajte „Zatiaľ bez dňa“, prípadne doplňte poznámky a kliknite na „Pridať miesto“.',
  'help.guide.leave-stop-off-route.result':
    'Zastávka zostáva súčasťou dňa aj PDF. Kým je označená „Mimo trasy“, trasa vedie priamo od predchádzajúcej zastávky k nasledujúcej.',
  'help.guide.move-booking-day.tip.2':
    'V rámci vlastného dňa sa rezervácia s časom vždy vráti na miesto podľa svojho času.',
  'help.guide.place-image-from-file.step.3':
    'V časti „Z priložených súborov“ kliknite na požadovanú fotku. Cez „Nahrať zo zariadenia“ nad ňou môžete namiesto toho vybrať novú z počítača.',
  'help.guide.place-own-hours.step.1':
    'Otvorte miesto a kliknite na „Upraviť“ vpravo dole na karte. Otvorí sa formulár miesta.',
  'help.guide.place-own-hours.tip.3':
    'Kliknite na „Odstrániť otváracie hodiny“ a potom na „Aktualizovať“; na karte sa znova zobrazia automaticky nájdené hodiny.',
  'help.guide.confirm-stay-booking.title': 'Potvrdenie rezervácie ubytovania',
  'help.guide.confirm-stay-booking.tip.2':
    'Rovnaký prepínač funguje v každej rezervácii, aj v rezerváciách v časti „Rezervácie“ v dni.',
  'help.guide.map-lock.tip.2':
    'Prehliadač si zámok pamätá pre každú cestu zvlášť. Po otvorení cesty sa mapa aj tak raz priblíži na celú cestu, takže sa nikdy neotvorí na prázdnom mieste.',
  'help.guide.tour-map-lines.step.2':
    'Kliknite na čiaru alebo na bod na jej začiatku. Karta túry sa otvorí v spodnej časti mapy a čiara sa vykreslí širšia s bielym okrajom, aby ste ju medzi ostatnými rozoznali. Krížikom v záhlaví karty ju zatvoríte.',
  'help.guide.car-stops.title': 'Jazda autom so zastávkami po ceste',
  'help.guide.car-stops.result':
    'Jazda je kartou na karte „Doprava“ a riadkom vo svojom dni. Jej čiara na mape vedie od vyzdvihnutia cez všetky zastávky v ich poradí až po vrátenie auta.',
  'help.guide.transport-details.step.5':
    '„Na mape“ dole v podrobnostiach zobrazí čiaru presunu a otvorí plán v jeho dni. „Upraviť“ úplne vpravo otvorí celý formulár a košom vedľa presun po potvrdení vymažete.',
  'help.guide.export-transports-csv.step.1':
    'Ak chcete iba časť zoznamu, najprv ho zúžte. Počíta sa hľadanie, filter aj zoradenie v „Možnostiach zobrazenia“: súbor obsahuje presne to, čo karta zobrazuje, v rovnakom poradí.',
  'help.guide.group-sort-bookings.tip.1':
    'Karty a Zoznam majú každý vlastné zoskupenie: Karty začínajú podľa stavu, Zoznam podľa dňa. Bodka pri „Možnostiach zobrazenia“ signalizuje, že sa niečo líši od predvoleného nastavenia, a „Obnoviť zobrazenie“ dole v paneli ho vráti.',
  'help.guide.booking-on-map.step.2': 'Dole v podrobnostiach kliknite na „Na mape“.',
  'help.guide.export-bookings-csv.goal':
    'Exportujte rezervácie cesty do súboru CSV a otvorte ho v Exceli, Numbers alebo inom tabuľkovom programe.',
  'help.guide.arrange-packing-list.goal':
    'Presuňte celé zoznamy aj jednotlivé položky, kam potrebujete, alebo si zoznamy zoraďte podľa názvu.',
  'help.guide.check-off-packing.tip.4':
    'Pri položke s množstvom väčším ako jedna môžete kusy odškrtávať aj po jednom. Pozrite si návod „Balenie viacerých kusov jednej veci“.',
  'help.guide.count-packed-pieces.tip.1':
    'Zaškrtnutím políčka zbalíte všetky kusy naraz, zrušením zaškrtnutia ich všetky znova vybalíte.',
  'help.guide.expense-receipts.goal':
    'Majte účtenku alebo faktúru pri výdavku, ku ktorému patrí, a otvorte ju kedykoľvek z prehľadu výdavkov.',
  'help.guide.expense-receipts.tip.2':
    'Košom vedľa účtenky ju pri uložení od výdavku odoberiete. Samotný súbor zostane v Súboroch; ak ho chcete odstrániť úplne, vymažte ho tam.',
  'help.guide.files-sync.tip.4':
    'Ak karta ukazuje žlté upozornenie s tlačidlom „Znova pripojiť“, úložisko už uložené prihlásenie neprijíma. Kliknite na „Znova pripojiť“, zadajte nové heslo aplikácie alebo token a synchronizácia sa znova spustí.',
  'help.guide.files-sync-settings.result':
    'Od nasledujúceho behu sa cesta synchronizuje iba zvoleným smerom a s vymazaniami a konfliktnými úpravami sa naloží podľa pravidiel, ktoré ste nastavili.',
  'help.guide.manage-notes.result':
    'Poznámka zmizne z karty „Poznámky“ všetkým členom naraz. Poznámka, ktorú ste iba pripli alebo upravili, zostane a ostatní ju vidia tak, ako ste ju nechali.',
  'help.guide.note-categories.step.4':
    'Farebné bodky v riadku určujú farbu danej kategórie: Indigová, Červená, Jantárová, Smaragdová, Modrá alebo Fialová. Tu sa Ubytovanie zafarbí na jantárovo.',
  'help.guide.roadtrip-reorder.step.3':
    'Na klávesnici označte zastávku a stlačte Alt so šípkou nahor alebo nadol; zastávka sa posunie o jedno miesto v rámci dňa.',
  'help.guide.roadtrip-overnight.title': 'Prenocovanie na trase',
  'help.guide.roadtrip-overnight.tip.1':
    'Noc trvá do nasledujúceho dňa. Ak chcete iné dátumy, upravte rezerváciu: zmeňte dátumy v časti „Dní“ spolu so zvyškom pobytu.',
  'help.guide.roadtrip-stop-fill.tip.1':
    'Odznak majú iba zastávky, kde môže vaše auto doplniť energiu: čerpacie stanice pri voľbe Palivo, nabíjačky pri Elektro a oboje pri Oboje.',
  'help.guide.roadtrip-bookings.result':
    'Každý rezervovaný presun je v jazde na mieste, kde sa uskutoční, a trasa pred ním a za ním vedie k jeho terminálom a od nich.',
  'help.guide.roadtrip-google-import.step.1':
    'Kliknite na tri bodky navrchu časti „Pozdĺž trasy“ a vyberte „Importovať trasu z Google Maps“.',
  'help.guide.roadtrip-hazards.title': 'Aktuálne upozornenia na mape',
  'help.guide.roadtrip-hazards.tip.3':
    'Údaje sa obnovujú každých desať minút a potrebujú pripojenie. Rovnako ako ostatné nastavenia jazdy sa prepínač ukladá k ceste.',
  'help.ctx.trip-tours.bullet.6': 'Trasu zmeníte a túru vymažete na karte „Túry“ v časti „Túry tejto cesty“.',
  'help.guide.tour-show-list.tip.1': 'Keď kliknete na čiaru túry na mape, zoznam túru zvýrazní a posunie sa k nej.',
  'help.guide.tour-add-to-day.step.3':
    'Potvrdí to hlásenie „Pridané k dňu 10“, riadok dostane odznak dňa a deň v ľavom stĺpci zobrazí túru s jej časom, vzdialenosťou a stúpaním.',
  'help.guide.tour-day-times.title': 'Čas začiatku túry v jej dni',
  'help.guide.tour-day-times.tip.3':
    '„Vynechať z trasy“ v tej istej ponuke ponechá túru v dni, no nezahrnie ju do trasy dňa na mape. „Vrátiť do trasy“ to zruší.',
  'help.guide.tour-remove-from-day.tip.1':
    'Viacdňovú túru odoberáte z dní po jednom, pretože každý deň má vlastnú etapu.',
  'help.guide.tour-filter-list.step.4':
    'Zatvorte ponuku. Tlačidlo teraz ukazuje stav, počet zostávajúcich túr a +1 za každý ďalší nastavený filter.',
  'help.guide.tour-hide-on-map.step.2':
    'Čiara túry sa na mape skryje. Riadok zostane v zozname stlmený a zobrazí prečiarknuté oko („Zobraziť na mape“). Kliknutím naň čiaru znova zobrazíte.',
  'help.guide.tour-import-plan-tab.step.2':
    'Navrchu zoznamu kliknite na „Importovať GPX alebo KML“ a vyberte súbory (GPX, KML alebo KMZ).',
  'help.ctx.trip-tour-detail.bullet.2':
    'V záhlaví je okrúhla dlaždica túry, jej názov s ceruzkou na premenovanie, farebná bodka s farbou čiary a štítky s typom, pôvodom, plánovaným časom, vzdialenosťou, stúpaním a klesaním. Krížikom vpravo alebo klávesom Escape kartu zatvoríte.',
  'help.guide.tour-detail-read.step.3':
    'Keď prejdete myšou na čas, uvidíte, z čoho sa skladá: čas v pohybe, prestávky a plánovaný celkový čas.',
  'help.guide.tour-detail-read.tip.4':
    'Karta trasu nemení. Ak chcete presunúť bod alebo prekresliť úsek, otvorte kartu „Túry“ a kliknite na túru v časti „Túry tejto cesty“.',
  'help.guide.tour-rename-colour.step.4':
    'Vyberte farbu. „Automatická farba“, prvé políčko, vráti čiare predvolenú farbu a „Vybrať vlastnú farbu“, posledné políčko, umožní zvoliť ľubovoľnú. Čiara na mape aj pruh v zozname túr sa zmenia okamžite.',
  'help.guide.tour-take-along.step.3':
    'Kliknutím na „GPX“ stiahnete uloženú túru ako súbor GPX: celú trasu aj s dostupnými výškami, pripravenú pre navigačnú aplikáciu alebo GPS zariadenie.',
  'help.guide.tour-copy-keep.step.1':
    'Otvorte kartu túry a dole kliknite na „Kopírovať“. TREK vytvorí novú, samostatnú túru bez priradených dní a pôvodná zostane bez zmeny.',
  'help.guide.tour-copy-keep.result':
    'V ceste máte druhú túru, ktorú môžete ľubovoľne upravovať, a zbierka má vlastnú kópiu pripravenú na pridanie do inej cesty.',
  'help.guide.tour-packing-link.tip.1':
    'Ide iba o prepojenie. Nič sa nekopíruje ani nepresúva a položky zostávajú v Zoznamoch. Keď niektorú odškrtnete tam, túra to hneď ukáže.',
  'help.guide.tour-files.step.3': 'Kliknutím na súbor ho otvoríte.',
  'help.guide.tour-activity-link.step.3':
    'V časti „Stopa“ vyberte záznam, alebo kliknite na „Importovať GPX“ a nahrajte nový súbor.',
  'help.guide.tour-activity-compare.goal':
    'Zistite, kde sa skutočná stopa odchyľuje od plánu, a zmeňte ju alebo ju odpojte.',
  'help.guide.tour-origin-check.title': 'Odkiaľ túra pochádza',
  'help.guide.tour-origin-check.result': 'Viete, odkiaľ a kedy túra pochádza a či sa odvtedy zmenila.',
  'help.ctx.trip-tour-planner.bullet.6':
    'Neuložený návrh sa zachová: keď kartu „Túry“ znova otvoríte, obnoví sa s označením „Neuložený návrh obnovený“. „Späť na túry“ a „Zahodiť“ sa pred zahodením zmien opýtajú.',
  'help.guide.tour-open-workspace.step.6':
    'Prepínač vľavo dole mení mapu, na začiatku medzi „Mapa“ a „Satelit“. S otvorenou túrou ponúka mapy pre jej typ, napríklad Topo alebo Turistika, a prepínače ako „Pridávať body“ a 3D.',
  'help.guide.tour-draw-route.step.1':
    'Navrchu ľavého panela kliknite na „Naplánovať novú túru“. Panel sa prepne na „Nová túra“, a ak nezvolíte iný typ, pôjde o pešiu túru.',
  'help.guide.tour-draw-route.tip.3':
    'Ak má návrh neuložené zmeny, „Naplánovať novú túru“ v ponuke „Pridať túru“ sa najprv opýta „Začať novú túru?“ s možnosťou „Zahodiť a začať“.',
  'help.guide.tour-type-profile.step.4':
    'Trasa sa pre zvolený profil naplánuje nanovo a „Prehľad túry“ vpravo ukáže jej vzdialenosť a čas.',
  'help.guide.tour-edit-points.step.3':
    'Poradie zmeníte tak, že prejdete myšou na riadok a potiahnete ho za úchyt, ktorý sa objaví na jeho ľavom okraji.',
  'help.guide.tour-shaping-points.goal': 'Presmerujte trasu na inú cestu bez pridania zastávky.',
  'help.guide.tour-shaping-points.result': 'Trasa vedie tam, kam ste ju potiahli, a číslovanie zastávok sa nezmenilo.',
  'help.guide.tour-loop-reverse.tip.3':
    'Pri pešej túre je vedľa nich „Okruh od štartu“, ktorý vyhľadá okružné túry zvolenej dĺžky.',
  'help.guide.tour-leg-by-hand.tip.1':
    'Ručne nakreslený úsek nekontroluje žiadny plánovač trás: môže viesť cez vodu, súkromný pozemok alebo útes.',
  'help.guide.tour-trip-places.step.4':
    'V jeho riadku je pod názvom uvedené „Miesto cesty“. „Odpojiť od miesta“ v „Ďalších akciách“ bod ponechá, ale zruší prepojenie.',
  'help.guide.tour-details-times.step.2': 'V časti „Podrobnosti“ napíšte popis a ak existuje, pridajte webovú stránku.',
  'help.guide.tour-save.goal': 'Uložte nakreslenú túru do cesty.',
  'help.guide.tour-save.result': 'Túra je uložená v ceste a môžete ju zaradiť do dňa.',
  'help.guide.tour-edit-saved.tip.2':
    'Importovaná stopa GPX alebo KML sa otvorí ako „Túra z GPX“ len na prezeranie. „Naplánovať upraviteľnú verziu“ z nej vytvorí túru, ktorú môžete meniť.',
  'help.guide.tour-summary-profile.step.4':
    'Šípkou „Zbaliť výškový profil“ vedľa jeho názvu profil skryjete; ďalším kliknutím ho znova zobrazíte.',
  'help.guide.tour-list-manage.step.2':
    'Prejdite myšou na túru a kliknite na okrúhle plus v jej riadku („Pridať k dňu“); otvoria sa dni cesty.',
  'help.guide.tour-delete.title': 'Vymazanie túry',
  'help.guide.tour-saved-elsewhere.title': 'Keď túru medzitým uložil niekto iný',
  'help.guide.tour-saved-elsewhere.result': 'Žiadne zmeny sa nestratia, pokiaľ sa ich niekto sám nerozhodne zahodiť.',
  'help.guide.tour-import-gpx.title': 'Import súboru GPX, KML alebo KMZ ako túry',
  'help.guide.tour-import-gpx.tip.2':
    'Každá stopa alebo trasa v súbore sa stane samostatnou túrou. Stopy sa nikdy nespájajú.',
  'help.guide.tour-view-import.step.2':
    'Ľavý stĺpec ju zobrazí ako „Túra z GPX“: „Prehľad túry“ so vzdialenosťou, výškami a zaznamenaným časom a pod ním výškový profil. Na mape je jej čiara.',
  'help.guide.tour-plan-from-import.step.1':
    'Na karte „Túry“ otvorte importovanú túru. V časti „Upraviteľná verzia“ vľavo kliknite na „Naplánovať upraviteľnú verziu“.',
  'help.guide.tour-plan-from-import.result':
    'Túra má teraz trasové body, ktoré môžete presúvať, a pri pôvode je uvedené „Preplánované, zaznamenaná stopa zachovaná“.',
  'help.guide.tour-restore-recorded.result': 'Túra je znova „Túra z GPX“ a zobrazuje čiaru, ktorá bola zaznamenaná.',
  'help.guide.tour-take-over.step.6': 'Kliknite na „Prevziať“.',
  'help.guide.tour-import-wanderer.step.2':
    'Píšte do poľa „Hľadať trasy“. „Hľadať v tejto oblasti mapy“ zobrazí iba trasy vo viditeľnej časti mapy.',
  'help.ctx.trip-tour-map.title': 'Mapa túry',
  'help.guide.tour-map-layers.goal':
    'Plánujte na mape, ktorá sa k druhu túry hodí najviac: vrstevnice pre stúpania, značené chodníky či cyklotrasy, alebo letecké snímky.',
  'help.guide.tour-along-search.title': 'Miesta pozdĺž túry',
  'help.guide.tour-along-search.tip.1':
    'Keď zmeníte trasu, druhy miest alebo vzdialenosť, tlačidlo „Hľadať znova“ sa zvýrazní s upozornením, že zoznam platí pre pôvodnú trasu. Kliknutím naň zoznam aktualizujete.',
  'help.guide.tour-along-add-stop.step.4':
    'Trasa sa naplánuje znova cez dané miesto a „Pozdĺž túry“ ukáže, o koľko sa túra predĺžila vzdialenosťou aj časom. „Vrátiť späť“ v tom istom riadku zastávku znova odstráni.',
  'help.guide.tour-3d-terrain.step.2':
    'Trasa je zafarbená podľa sklonu. Kliknutím na „Sklon“ v dolnom riadku ju vykreslíte farbou túry a ďalším kliknutím znova zobrazíte sklony.',
  'help.guide.tour-3d-flyover.title': 'Prelet nad túrou',
  'help.guide.tour-3d-flyover.tip.2':
    'Prelet sa spustí až po načítaní krajiny pozdĺž celej trasy, aby sa v polovici nezastavil kvôli načítavaniu mapy. Keď prejdete myšou na krúžok, uvidíte, koľko je už načítané.',
  'help.guide.tour-map-overlays.result':
    'Zjazdovky alebo plavebné značky sa vykreslia na mape a legenda vysvetlí, čo znamenajú.',
  'help.ctx.trip-tour-stages.bullet.3':
    '„Prehľad túry“ uvádza v časti „Etapy“ každú etapu od zastávky, kde začína, po zastávku, kde končí. Kliknutím na etapu vyberiete jej poslednú zastávku a príslušné miesto sa označí vo výškovom profile.',
  'help.guide.tour-multi-day.step.4':
    'Trasové body sa teraz delia na Etapu 1 a Etapu 2, každá s vlastnou vzdialenosťou a časom. Zastávka na konci etapy má ikonu mesiaca.',
  'help.guide.tour-stages-on-days.title': 'Rozdelenie viacdňovej túry do dní cesty',
  'help.guide.tour-stages-on-days.tip.1':
    'Ak cesta skončí skôr ako posledná etapa, možnosť uvedie, ktorá etapa sa zmestí ako posledná. Etapy po nej nedostanú žiadny deň.',
  'help.ctx.trip-tour-hike.bullet.2':
    '„Trasové body“ uvádzajú zastávky v poradí. „Pridať bod“ je zapnuté hneď od začiatku, takže kliknutím na mapu pridáte ďalší bod; „Miesta cesty“ vedľa zmenia chatu alebo hotel z cesty na zastávku.',
  'help.guide.tour-hike-plan.step.2':
    'Otvorte „Typ túry“ a vyberte „Pešia túra“: pešo, v rámci náročnosti, ktorú nastavíte.',
  'help.guide.tour-hike-plan.tip.3':
    '„Voľba trasy“ pod náročnosťou nastavuje preferencie: „Vyhnúť sa prudkým stúpaniam“, „Vyhnúť sa schodom“ a „Vyhnúť sa prievozom“. Kde iná možnosť nie je, trasa tade aj tak povedie.',
  'help.guide.tour-hike-trail-details.step.5':
    'Kliknite na „Povrch“ a uvidíte tú istú trasu podľa toho, po čom kráčate, od asfaltu po prírodný terén a skalu.',
  'help.guide.tour-hike-round.step.2':
    'Nad mapou sa otvorí karta „Okružná túra“. Skontrolujte štart v poli „Od“ a zadajte požadovanú vzdialenosť. Štítok vedľa ukazuje rozsah dĺžok, aký okružná túra môže mať.',
  'help.guide.tour-hike-compare-ways.title': 'Porovnanie iných ciest pre úsek pešej túry',
  'help.guide.tour-hike-compare-ways.tip.2':
    'Ak plánovač trás nepozná inú cestu, karta to oznámi. Ak plánovač nedokáže viesť trasu zvolenou cestou, úsek zostane bez zmeny a karta vás na to upozorní.',
  'help.guide.tour-ferrata-add.step.5':
    '„Prehľad túry“ vpravo ukáže odznak „Ferata“ s jej stupňom a v hlavičke editora sa objaví upozornenie „Trasa vedie po ferate“.',
  'help.guide.tour-run-plan.step.1': 'Kliknite na „Naplánovať novú túru“, otvorte „Typ túry“ a vyberte „Beh“.',
  'help.guide.tour-run-plan.tip.3': 'Ak máte vzdialenosti v míľach, aj tempo sa udáva na míľu.',
  'help.guide.tour-run-ways.tip.1': 'Nič z toho nemení trasu behu ani jeho čas.',
  'help.ctx.trip-tour-walk.bullet.5':
    '„Pridať túru“ v časti „Túry tejto cesty“ naimportuje pešiu trasu zdieľanú z Google Maps. Na karte „Plán“ môžete pri prechádzke otvorenej z jej dňa odškrtávať zastávky pre daný deň.',
  'help.guide.tour-walk-plan.step.6':
    '„Prehľad túry“ vpravo ukazuje „Odhad. čas chôdze“, „Pobyty“ a „Plánované“, teda súčet oboch. Prechádzku uložíte tlačidlom „Uložiť“ dole v ľavom stĺpci.',
  'help.guide.tour-walk-sights.step.2':
    'Téma vyplní časť „Čo hľadať“. Rozbaľte ju, zapnite alebo vypnite druhy miest a v poli „Do tejto vzdialenosti od trasy“ zvoľte, ako ďaleko hľadať.',
  'help.guide.tour-walk-day-times.title': 'Príchody a otváracie hodiny počas dňa',
  'help.guide.tour-walk-day-times.tip.3':
    'Otváracie hodiny pochádzajú z OpenStreetMap alebo z miesta cesty, ku ktorému zastávka patrí, a štítok vedľa nich ukazuje, odkiaľ. Pred odchodom si ich overte.',
  'help.guide.tour-walk-google-import.step.4':
    'Kliknite na „Načítať ako prechádzku“. TREK sám naplánuje peší presun medzi zastávkami. Prechádzku uložíte tlačidlom „Uložiť“.',
  'help.guide.tour-walk-check-off.step.2':
    'Posuňte sa k časti „Zastávky prechádzky“. Pri každej zastávke vidíte, ako dlho sa zdržíte, a ak má prechádzka čas začiatku, aj kedy prídete.',
  'help.ctx.trip-tour-bike.summary':
    'Cyklotúra otvorená v editore na karte „Túry“: profil, pre ktorý je trasa naplánovaná, čas jazdy, po akom povrchu trasa vedie a pri túre na horskom bicykli aj obťažnosť jej chodníkov.',
  'help.guide.tour-bike-profile.step.2': 'Otvorte pole „Typ túry“ a vyberte „Cyklotúra“.',
  'help.guide.tour-bike-profile.tip.3':
    'Ak k bodu nevedie žiadna cesta pre bicykle, panel zobrazí No way for bikes reaches point N. Presuňte bod, alebo pri predchádzajúcom bode otvorte „Ďalšie akcie“ a vyberte „Nakresliť ďalší úsek ručne“.',
  'help.guide.tour-bike-surfaces.step.4':
    'V časti „Druh cesty“ kliknite na riadok, napríklad „Poľná alebo lesná cesta“ alebo „Cesta s premávkou“, a uvidíte, kde po nej trasa vedie.',
  'help.guide.tour-bike-mtb-grades.step.1':
    'Otvorte cyklotúru v editore a skontrolujte, či je profil nastavený na MTB. Obťažnosť chodníkov sa načítava iba pri tomto profile.',
  'help.ctx.trip-tour-ski.title': 'Lyžiarske a zimné túry',
  'help.guide.tour-ski-plan.goal':
    'Naplánujte deň na zjazdovkách, bežkársky okruh, skialpinistickú túru alebo túru na snežniciach po zmapovaných zjazdovkách, vlekoch a trasách.',
  'help.guide.tour-ski-plan.tip.2':
    'Informačná bodka vedľa „Disciplína“ vysvetľuje, ako TREK so skialpinistickými túrami pracuje. Nič v nej ani inde tu nehovorí o snehu, lavínach ani o tom, či sú zjazdovky, vleky a trasy otvorené.',
  'help.guide.tour-ski-options.step.3':
    'V časti „Uprednostniť“ vyberte „Najrýchlejšie“, „Najviac lyžovania“ alebo „Najľahšia“. V časti „Tempo“ vyberte „Pohodové“, „Normálne“ alebo „Športové“: mení čas, ktorý plánovač počíta na každú zjazdovku.',
  'help.guide.tour-ski-fix-leg.goal':
    'Nechajte červený úsek naplánovať jedným kliknutím, alebo ho nakreslite ako priamku.',
  'help.guide.tour-ski-fix-leg.result':
    'Žiadny úsek už nie je červený: každý vedie po zjazdovkách alebo priamo medzi svojimi bodmi.',
  'help.guide.tour-ski-summary.tip.3':
    'Uložená túra sa otvorí tak, ako bola uložená. Ak ju chcete naplánovať znova podľa aktuálnych údajov o zjazdovkách, presuňte bod alebo zmeňte niektorú možnosť.',
  'help.guide.tour-ski-pistes-layer.tip.1':
    'Ak prepínač zostáva sivý s textom „Priblížte mapu, aby ste videli zjazdovky“, priblížte lyžiarske stredisko.',
  'help.guide.tour-ski-import.step.3':
    'Vyberte disciplínu a pri behu na lyžiach aj techniku. Kým to neurobíte, dialóg zobrazuje Choose a discipline to import the track as ski.',
  'help.ctx.trip-tour-paddle.title': 'Vodácke túry',
  'help.guide.tour-paddle-setup.title': 'Plánovanie vodáckej túry',
  'help.guide.tour-paddle-setup.step.7':
    'Skontrolujte, či je zapnuté „Pridať bod“, a klikajte do mapy: najprv miesto nalodenia, potom body po ceste a nakoniec miesto vylodenia.',
  'help.guide.tour-paddle-water-route.step.1':
    'Ručne nakreslený úsek má pod svojím bodom označenie „Nakreslené ručne, nevypočítané“ a svoju dĺžku. TREK ponechá čiaru presne tak, ako ste ju nakreslili.',
  'help.guide.tour-paddle-water-route.tip.4':
    'Kým nie je niektorý úsek naplánovaný, túru neuložíte. Najprv ho naplánujte po vode alebo nakreslite ručne.',
  'help.guide.tour-paddle-portage.step.5':
    'Do poľa „Výstup a nástup“ zadajte, koľko minút potrebujete na vystúpenie, vyloženie a opätovné nalodenie. Ak pole necháte prázdne, TREK počíta s 10 minútami.',
  'help.guide.tour-paddle-lock.step.2':
    'Vyberte „Plavebná komora v tomto bode“. Pod bodom sa objaví karta plavebnej komory s označením „Chýba čas“.',
  'help.guide.tour-paddle-time.goal':
    'Pozrite sa, ako sa sčítava čas na vode, prenášanie, plavebné komory a prestávky, a nastavte si vlastné hodnoty.',
  'help.guide.tour-paddle-time.tip.3':
    'Prestávky a vlastný plánovaný celkový čas nastavíte v časti „Podrobnosti“. Ak ho nastavíte, karta zobrazí vedľa odhadu „Vaša plánovaná celková doba“.',
  'help.guide.tour-paddle-wind.tip.1':
    'Predpoveď je dostupná iba na najbližších 16 dní. Pri vzdialenejšom dni sa zobrazí, od ktorého dátumu bude k dispozícii. Pri dni v minulosti sa zobrazí, že už uplynul.',
  'help.guide.tour-paddle-checklist.step.2':
    'Riadok pod ním ukazuje, aké aktuálne sú údaje: „Stav OSM“ pre OpenStreetMap, „Načítané“ pre čas, keď ich TREK načítal, a „Údaje o prekážkach“ tam, kde nepokrývajú celú trasu.',
  'help.guide.tour-paddle-checklist.tip.5':
    'Kontrolný zoznam nie je bezpečnostné ani právne povolenie. Vaše rozhodnutie neruší zákaz ani súkromný pozemok zaznamenaný v OpenStreetMap.',
  'help.guide.tour-paddle-track-marks.step.5':
    'Kliknite na „Prenáška“ a potom kliknite na čiaru tam, kde ste vystúpili, a tam, kde ste sa znova nalodili.',
  'help.ctx.trip-tour-horse.summary':
    'Jazda na koni sa nikdy neplánuje automaticky. Skladá sa z úsekov značených jazdeckých trás, ktoré pozná OpenStreetMap, spojených ručne nakreslenými úsekmi, alebo zostáva presne tak, ako ste ju zaznamenali.',
  'help.guide.tour-horse-plan.step.1':
    'Posuňte mapu na oblasť, kde chcete jazdiť, a navrchu ľavého stĺpca kliknite na „Naplánovať novú túru“.',
  'help.guide.tour-horse-plan.tip.1':
    'Jazdecká trasa vám nedáva povolenie po nej jazdiť. „Prístup pre kone“ ukazuje iba to, čo je označené v OpenStreetMap. Vždy sa riaďte značením na mieste.',
  'help.guide.tour-horse-gap.step.2': 'Zapnite „Prepojiť ručným úsekom“. Medzera sa preklenie priamkou bez kontroly.',
  'help.guide.tour-horse-recorded.goal':
    'Importujte jazdu zaznamenanú na GPS zariadení alebo v aplikácii a zachovajte ju presne tak, ako ste ju prešli.',
  'help.guide.tour-horse-recorded.tip.3':
    'Súbor môžete pretiahnuť aj kamkoľvek na kartu „Túry“ a otvorí sa rovnaký náhľad.',
  'help.guide.create-trip.tip.3':
    'Pod Spolucestujúci môžete pridať ľudí, ktorí tu už majú účet. Stanú sa členmi cesty hneď po jej vytvorení.',
  'help.guide.trip-reminder.step.1':
    'Kliknite na ceruzku na karte cesty. Pri novej ceste nájdete rovnakú sekciu vo formulári Nová cesta.',
  'help.guide.company-holidays.tip.2':
    'Celodenné firemné voľno odstráni všetku dovolenku, ktorá bola na ten deň už zapísaná, takže nikto neminie na tento deň nárok na dovolenku.',
  'help.guide.half-company-holiday.tip.2':
    'Ak chcete deň vymazať, kliknite naň znova s rovnakým nastavením. Ak z neho chcete urobiť celé firemné voľno, kliknite naň s vypnutým Pol dňa.',
  'help.guide.edit-holiday-calendar.step.1':
    'Otvorte Nastavenia a nájdite kalendár pod Štátne sviatky alebo Školské prázdniny.',
  'help.guide.person-color.goal': 'Dajte sebe alebo niekomu, s kým plánujete, farbu, ktorú ľahšie rozlíšite.',
  'help.guide.answer-fusion-request.tip.2':
    'Ktorýkoľvek z vás môže prepojenie neskôr zrušiť a vaše záznamy zostanú zachované.',
  'help.guide.log-for-partner.tip.2': 'Druhá osoba vidí zmenu hneď a jej riadok Nárok sa okamžite aktualizuje.',
  'help.guide.country-places.title': 'Zobrazenie všetkých miest v krajine',
  'help.guide.tour-activity-stats.step.1': 'V paneli dole na mape otvorte kartu Túry vedľa Štatistiky a Bucket List.',
  'help.guide.tour-activity-stats.tip.2':
    'Ak v detaile túry prepojíte trasu, ktorú ste skutočne prešli, cez Pridať skutočnú trasu, jej zaznamenané hodnoty tu nahradia plánované. Túra naplánovaná na viac dní sa počíta raz.',
  'help.ctx.collections.bullet.7':
    'Uložené túry: túry uložené z cesty sú prvé riadky zoznamu, s náročnosťou, typom, cestou, z ktorej pochádzajú, a mierami. Pridať do cesty z jednej vytvorí novú túru a ikona koša ju zo zoznamu odstráni.',
  'help.guide.move-to-list.title': 'Presun alebo duplikovanie miest do iného zoznamu',
  'help.guide.copy-to-trip.tip.2':
    'Miesto, ktoré cesta už obsahuje, sa preskočí a TREK ukáže, koľko miest sa preskočilo.',
  'help.guide.accept-list-invite.tip.2':
    'Kliknutím na Zdieľané v hlavičke zoznamu zobrazíte jeho členov. Tam môžete kliknutím na Opustiť zoznam zoznam znova opustiť.',
  'help.guide.tour-collection-add-to-trip.goal':
    'Vytvorte v jednej zo svojich ciest novú túru z túry uloženej v zozname, s trasovými bodmi alebo bez nich.',
  'help.guide.tour-collection-add-to-trip.result':
    'Dialóg potvrdí, že túra teraz patrí do tej cesty. Otvoriť cestu vás tam zavedie, Zavrieť vás ponechá v Zbierky.',
  'help.guide.tour-collection-manage.tip.3': 'Uložené túry sa zobrazujú iba vo svojom zozname, nie vo Všetko uložené.',
  'help.guide.search-journey.step.3':
    'Kliknutím na deň sa na neho posuniete, kliknutím na šípku pri ňom zobrazíte záznamy toho dňa a jeden z nich vyberiete.',
  'help.guide.journey-map-layers.goal':
    'Zistite, v čom sa plán líši od toho, čo sa naozaj stalo, a zapínajte a vypínajte vrstvy.',
  'help.guide.journey-keep-route.goal':
    'Pridajte skutočnú trasu dňa z Dawarich na mapu cestovného denníka a ponechajte ju tam.',
  'help.guide.journey-day-stays.goal': 'Premeňte pobyty zaznamenané v Dawarich na záznamy, jeden po druhom.',
  'help.guide.journey-take-over-day.goal':
    'Premeňte pobyty dňa na koncepty záznamov alebo na jednu správu o dni jediným krokom.',
  'help.guide.journey-auto-prepare.title': 'Nechajte TREK pripraviť vaše zaznamenané dni',
  'help.guide.photo-location.title': 'Umiestnenie záznamov tam, kde boli nafotené ich fotky',
  'help.ctx.settings-about.summary':
    'Čo je TREK, akú verziu tento server používa a kde nájdete projekt: dokumentáciu, kde nahlásiť chybu a ako projekt podporiť.',
  'help.guide.startup.tip.2': 'Úvodná karta, ktorá patrí vypnutému doplnku, sa namiesto toho otvorí na pláne.',
  'help.guide.web-push-device.title': 'Push oznámenia v tomto zariadení',
  'help.guide.connect-airtrail.tip.1': 'Karta sa zobrazí, iba kým má správca zapnutý doplnok AirTrail.',
  'help.guide.connect-dawarich.tip.1':
    'TREK iba navrhuje záznamy, miesta a krajiny. Nič sa nepridá, kým to nepotvrdíte, a do Dawarich sa nič nezapisuje späť.',
  'help.guide.tour-connect-wanderer.tip.1': 'Karta sa zobrazí, iba kým správca povoľuje wanderer pod Túry.',
  'help.guide.tour-wanderer-watch.tip.1':
    'Upozornenie túru nikdy nezmení. Čo sa naozaj zmenilo, ukáže kontrola zdroja túry.',
  'help.guide.api-keys.tip.3':
    'Pošlite kľúč ako Authorization: Bearer alebo X-API-Key na /api/v1. Jeden účet môže mať najviac 10 kľúčov.',
  'help.guide.plugin-settings.step.2':
    'Aktivita doplnkov vypisuje každú akciu, ktorú doplnok urobil vo vašom mene, od najnovšej. Obnoviť načíta tie najnovšie.',
  'help.ctx.admin-github.bullet.3':
    'O aplikácii: Ko-fi, Buy Me a Coffee, Discord, Nahlásiť chybu, Navrhnúť funkciu a Wiki.',
  'help.guide.default-user-settings.goal':
    'Nastavte každému účtu rozumné jednotky, farebný režim a menu bez toho, aby niekto musel otvoriť Nastavenia.',
  'help.guide.default-map.step.3':
    'Každé pole sa uloží, keď ho opustíte. Odkaz obnoviť vedľa názvu poľa vráti predvolenú hodnotu TREK.',
  'help.guide.own-routing-engine.tip.2':
    'Ak je nastavený iba váš vlastný smerovací server, nepoužíva sa ani verejná Valhalla. Odkaz obnoviť vedľa poľa ho znova vyprázdni.',
  'help.guide.admin-passkeys.step.1':
    'Na karte Nastavenia zapnite pod Prihlásenie prístupovým kľúčom možnosť Povoliť prihlásenie prístupovým kľúčom.',
  'help.guide.storage-backends.step.4':
    'Zdravie navrchu vypisuje neúspešné zápisy na cieľ zrkadla. Ak sa zobrazuje Neboli zaznamenané žiadne zlyhania replík, všetko funguje.',
  'help.guide.channels-instance.tip.3':
    'Web Push vyžaduje HTTPS. Na iPhone a iPade musia ľudia najprv pridať TREK na plochu.',
  'help.guide.notification-defaults.step.1':
    'Na karte Oznámenia prejdite dole na Predvolené nastavenia pre používateľov. Každý riadok je udalosť, každý stĺpec kanál.',
  'help.ctx.notifications.bullet.1':
    'Zvonček vpravo hore ukazuje počet oznámení, ktoré ste ešte neprečítali. Kliknutím naň zobrazíte desať najnovších a cez Zobraziť všetky oznámenia dole sa dostanete na túto stránku.',
  'help.guide.read-notifications.step.2':
    'Panel vypisuje vašich desať najnovších oznámení. Každé uvádza, kto čo urobil a kde, a neprečítané majú zafarbené pozadie.',
  'help.guide.filter-notifications.step.2': 'Dole v paneli kliknite na Zobraziť všetky oznámenia.',
  'help.guide.mark-notifications-read.tip.1': 'Aj otvorenie oznámenia cez jeho tlačidlo ho označí ako prečítané.',
  'help.guide.delete-notifications.tip.2':
    'Vymazané oznámenie sa nedá obnoviť. Ak ho chcete skryť, ale ponechať, označte ho ako prečítané a použite Neprečítané.',
  'help.guide.notification-settings.tip.2':
    'Nastavenia pre jednotlivé cesty neexistujú: jeden prepínač platí pre všetky vaše cesty.',
  'help.guide.link-journal.title': 'Prepojenie denníka s cestou',
  'help.guide.link-journal.tip.2':
    'Odvtedy vidia denník aj ľudia, ktorým dáte prístup, a to vo svojom vlastnom zozname Cestovný denník.',
  'help.ctx.trip-places.bullet.8':
    'Ak je pripojený Dawarich, From Dawarich navrchu zoznamu ukazuje pobyty, ktoré Dawarich zaznamenal počas cesty. Pridať ako miesto zmení pobyt na miesto. Tu som nebol ho zo zoznamu odstráni.',
  'help.guide.dawarich-stays.step.4':
    'Ak pobyt nebol skutočnou návštevou, odstránite ho kliknutím na Tu som nebol, x vedľa neho. Zobraziť … už vybavené dole v zozname ukáže pobyty, ktoré ste pridali alebo odstránili. Vrátiť späť vráti odstránený pobyt do zoznamu.',
  'help.guide.leave-stop-off-route.tip.1':
    'Túto možnosť ponúka iba zastávka so súradnicami a nastavenie platí len pre tento deň: to isté miesto v inom dni sa do trasy stále zahŕňa.',
  'help.guide.move-booking-day.title': 'Presun rezervácie na iný deň',
  'help.guide.place-image-from-file.step.4':
    'Fotka je teraz obrázkom miesta. Malým červeným X v jej rohu ju znova odstránite.',
  'help.guide.place-own-hours.step.2': 'Pod Webová stránka vyplňte Telefón a E-mail, ak ich poznáte.',
  'help.guide.add-accommodation.tip.4':
    'Rýchlejšie: + v záhlaví dňa, s tooltipom Pridať k dňu, obsahuje Pridať ubytovanie. Otvorí deň s už otvoreným týmto formulárom.',
  'help.guide.confirm-stay-booking.goal': 'Označte rezerváciu hotela k pobytu ako potvrdenú, priamo z dňa.',
  'help.guide.map-whole-trip.tip.4':
    'Či sa zobrazuje celá cesta, sa ukladá pre každú cestu vo vašom účte, takže sa cesta otvorí rovnako aj v inom prehliadači.',
  'help.guide.tour-map-lines.step.3':
    'Otvorte v stĺpci dní deň, v ktorom túra je, a túra sa stane súčasťou trasy dňa: trasa vedie na miesto, kde túra začína, a pokračuje z miesta, kde končí.',
  'help.guide.car-stops.goal':
    'Zadajte prenajatému alebo vlastnému autu miesto vyzdvihnutia, vrátenia a miesta, kde medzitým zastavíte.',
  'help.guide.car-stops.tip.1': 'Samostatný typ pre prenájom neexistuje: prenajaté aj vlastné auto sú Auto.',
  'help.guide.transport-details.result':
    'Plán je otvorený na dni jazdy, jej čiara je nakreslená na mape a ikona trasy na jej riadku je zapnutá.',
  'help.guide.export-transports-csv.step.2':
    'Kliknite na ikonu tabuľky za Možnosti zobrazenia, ktorej tooltip znie „Exportovať ako tabuľku (CSV)“.',
  'help.guide.group-sort-bookings.title': 'Zoskupenie a zoradenie rezervácií',
  'help.guide.group-sort-bookings.tip.2':
    'V Časová os obsahuje to isté tlačidlo Samostatný pruh pre každý typ a Zobraziť druhú záložku.',
  'help.guide.booking-on-map.result':
    'Detail sa zatvorí a karta Plán sa otvorí na dni rezervácie s jej miestom vybraným na mape.',
  'help.guide.export-bookings-csv.step.1':
    'Ak chcete exportovať len časť karty, najprv ju zúžte cez Hľadať alebo Filter. Súbor obsahuje presne to, čo karta ukazuje.',
  'help.guide.import-booking-file.tip.4':
    'Čítanie potvrdenia vyžaduje pripojenie. Offline Importovať na to upozorní a skúsite to znova, keď bude TREK opäť online.',
  'help.guide.arrange-packing-list.step.1':
    'Chyťte úchyt na ľavom konci záhlavia zoznamu, pred jeho farebnou bodkou, a pustite zoznam na inú kartu. Cieľovú kartu označí obrys vo farbe vášho akcentu a zoznam zaujme miesto tej karty pre všetkých účastníkov cesty.',
  'help.guide.count-packed-pieces.title': 'Zabalenie viacerých kusov jednej veci',
  'help.guide.count-packed-pieces.tip.2':
    'Ak je zapnuté Sledovanie batožiny, Zabalené v karte Zavazadlá počíta iba kusy, ktoré sú už započítané ako zabalené.',
  'help.guide.packing-bags.tip.4':
    'Hmotnosť tašky, ktorú nesie viac ľudí, sa pod Na osobu rozdelí medzi nich rovnomerne. Táto hmotnosť je podčiarknutá bodkami a keď na ňu ukážete myšou, zobrazí sa o tom poznámka.',
  'help.guide.expense-receipts.step.1':
    'Kliknite na ceruzku vedľa riadka výdavku. Editor sa otvorí na ňom, s Účtenky a faktúry blízko spodku.',
  'help.guide.expense-receipts.tip.3':
    'Priloženie vyžaduje pripojenie a oprávnenie nahrávať súbory, pretože sa účtenka ukladá ako jeden zo súborov cesty.',
  'help.guide.files-sync-settings.title': 'Výber smeru synchronizácie dokumentov',
  'help.guide.files-sync-settings.tip.1':
    'Jeden pruh zostáva vždy zapnutý: kliknutie na jediný pruh, ktorý je ešte zapnutý, nič nezmení.',
  'help.guide.manage-notes.title': 'Čítanie, pripnutie a úprava poznámky',
  'help.guide.manage-notes.tip.1':
    'Rozbaliť je v ponuke, iba ak má poznámka text. Člen, ktorý nesmie upravovať Spolupráca, vidí iba Rozbaliť.',
  'help.guide.note-categories.step.5':
    'Kliknite na Uložiť. Všetky poznámky v premenovanej alebo prefarbenej kategórii sa zmenia naraz, pre každého člena. Zrušiť vaše zmeny zahodí.',
  'help.guide.trip-chat.tip.5':
    'Chat ukazuje najprv najnovšie správy. Načítať staršie správy navrchu chatu načíta staršie správy.',
  'help.guide.roadtrip-reorder.result':
    'Zastávky sú v poradí, ktoré ste nastavili, a vzdialenosť, čas jazdy a časy príchodu každého zmeneného dňa sa vypočítajú znova.',
  'help.guide.roadtrip-overnight.goal': 'Nájdite miesto na spanie na ceste a pridajte noc do jazdy ako rezerváciu.',
  'help.guide.roadtrip-overnight.tip.2':
    'Ak zarezervovanú noc cez Upraviť v jej karte prepnete späť na Prestávka, TREK sa najprv opýta „Zrušiť nocľah?“. Zmeniť na prestávku odstráni noc spolu s jej rezerváciou a každým výdavkom, ktorý je s ňou prepojený, a zastávku v jazde ponechá.',
  'help.guide.roadtrip-stop-fill.tip.2':
    'Ak vyberiete hodnotu, ktorú zastávka už má, zastávka sa vráti k vašej predvolenej hodnote.',
  'help.guide.roadtrip-bookings.tip.1':
    'Čas na termináli sa nastaví skôr, než uvádza cestovný poriadok, aby ste stihli check-in: o hodinu pri lete alebo plavbe, o pol hodiny pri trajekte a o desať minút pri vlaku alebo autobuse.',
  'help.guide.roadtrip-google-import.step.2':
    'Vložte odkaz na trasu, ktorú ste zdieľali z Google Maps, a kliknite na Náhľad.',
  'help.guide.roadtrip-hazards.goal':
    'Zobrazte si na mape výstrahy pred nepriaznivým počasím a upozornenia na katastrofy v okolí svojej jazdy.',
  'help.ctx.trip-tours.title': 'Túry v pláne',
  'help.guide.tour-show-list.title': 'Zobrazenie túr cesty v pláne',
  'help.guide.tour-show-list.tip.2':
    'Zatiaľ žiadne túry? Importovať GPX alebo KML navrchu zoznamu importuje súbor a Naplánovať novú túru na karte Túry vytvorí novú.',
  'help.guide.tour-add-to-day.step.4':
    'Alebo riadok potiahnite zo zoznamu a pustite ho na deň v ľavom stĺpci. Ak ho pustíte medzi dve zastávky, zaradí sa presne tam.',
  'help.guide.tour-day-times.goal': 'Pozrite sa, kedy túra končí a či zasahuje do toho, čo v ten deň nasleduje.',
  'help.guide.tour-day-times.tip.4':
    'Uložiť do zbierky v tej istej ponuke uloží túru do zbierky aj s trasou, rovnako ako tlačidlo Zbierka na karte.',
  'help.guide.tour-remove-from-day.tip.2':
    'V týchto ponukách ani na karte nie je Vymazať. Túra sa maže na karte Túry, košom na jej riadku pod Túry tejto cesty.',
  'help.guide.tour-filter-list.tip.1':
    'Limit trasy je najvyššia náročnosť, ktorú mohla trasa pri plánovaní mať, nie náročnosť nameraná na trase.',
  'help.guide.tour-hide-on-map.step.3':
    'Kým je skrytá nejaká túra, riadok nad zoznamom ukazuje Skryté na mape aj ich počet. Zobraziť všetky vráti všetky túry naraz.',
  'help.guide.tour-import-plan-tab.step.3':
    'Náhľad importu ukáže každú stopu skôr, než sa čokoľvek uloží. Pod Importovať ako vyberte typ (Pešia túra, Cyklotúra a tak ďalej) a kliknite na Importovať 1 túru.',
  'help.ctx.trip-tour-detail.bullet.3':
    'Nižšie nasledujú Dni cesty s dlaždicou pre každý deň, v ktorom túra je, miery s výškovým profilom a potom, ak sa týkajú danej túry: zastávky prechádzky mestom, kontroly a vietor pri vodáckej túre, Skutočná trasa, Zoznam vecí, Popis, Poznámky, Pôvod a Súbory.',
  'help.guide.tour-detail-read.step.4':
    'Dni cesty ukazujú dlaždicu pre každý deň, v ktorom túra je, s jeho dátumom. Zatiaľ v žiadnom dni cesty znamená, že túra ešte nie je naplánovaná.',
  'help.guide.tour-detail-read.tip.5':
    'V telefóne sa karta otvorí ako panel zdola, na čítanie a na to, aby ste si túru vzali so sebou.',
  'help.guide.tour-rename-colour.tip.1':
    'Názov a farba patria ceste, takže ich vidí každý, kto v nej je. Ak chcete túru skryť len na svojej mape a nikomu inému ju nezmeniť, použite oko v zozname Túry.',
  'help.guide.tour-take-along.tip.1':
    'Na zariadení, ktoré vie zdieľať súbory, sa vedľa GPX zobrazí Zdieľať a pošle ten istý súbor priamo inej aplikácii.',
  'help.guide.tour-copy-keep.step.2':
    'Kópia sa otvorí hneď a má názov originálu a za ním (kópia). Kliknutím na ceruzku jej dajte vlastný názov.',
  'help.guide.tour-packing-link.title': 'Prepojenie túry so zoznamom vecí',
  'help.guide.tour-packing-link.tip.2':
    'Zmeniť v záhlaví sekcie prepojí túru s iným zoznamom. Zrušiť prepojenie v tomto dialógu prepojenie odstráni a zoznam zostane nezmenený.',
  'help.guide.tour-files.tip.1': 'Súbory sú zároveň súbormi cesty, takže sa zobrazujú aj na karte Súbory.',
  'help.guide.tour-activity-link.step.4':
    'Skontrolujte pod Skutočnosť, čo stopa odmerala, a potom kliknite na Pripojiť.',
  'help.guide.tour-activity-compare.step.1':
    'Otvorte kartu túry. Plán a skutočnosť ukazuje Vzdialenosť, Stúpanie, Klesanie a Čas s prestávkami z plánu vedľa hodnôt zo stopy, aj s Rozdiel.',
  'help.guide.tour-origin-check.goal':
    'Zistite, či bola túra nakreslená v TREK alebo importovaná, z ktorého súboru a či sa odvtedy zmenila.',
  'help.ctx.trip-tour-planner.title': 'Túry',
  'help.guide.tour-open-workspace.title': 'Orientácia na karte Túry',
  'help.guide.tour-open-workspace.step.7':
    'Kliknite na túru v pravom paneli. Túra naplánovaná v TREK sa otvorí v editore. Importovaná stopa sa otvorí nezmenená, ako Túra z GPX, na prezeranie.',
  'help.guide.tour-draw-route.step.2':
    'Do Hľadať miesto alebo adresu napíšte, kde túra začína, a vyberte výsledok. Mapa sa tam posunie.',
  'help.guide.tour-draw-route.tip.4':
    'Neuložený návrh sa uchová. Keď karta Túry cesty otvoríte znova, návrh sa obnoví a zobrazí sa Neuložený návrh obnovený.',
  'help.guide.tour-type-profile.tip.1':
    'Zmena typu sa v histórii počíta ako jeden krok: Vrátiť úpravu bodu trasy v záhlaví panela obnoví pôvodný typ aj jeho trasu.',
  'help.guide.tour-edit-points.step.4':
    'Alebo na riadku otvorte Ďalšie akcie (tri bodky) a vyberte Posunúť bod trasy nahor alebo Posunúť bod trasy nadol.',
  'help.guide.tour-shaping-points.step.1':
    'Kliknite na nakreslenú trasu na mape tam, kde má viesť inak. Objaví sa tam malá bodka: tvarovací bod.',
  'help.guide.tour-loop-reverse.title': 'Vytvorenie okruhu alebo obrátenie túry',
  'help.guide.tour-loop-reverse.result': 'Okruh, ktorý končí tam, kde začal, alebo tá istá túra v opačnom smere.',
  'help.guide.tour-leg-by-hand.tip.2':
    'Pri bode, ku ktorému nevedie žiadna cesta, sa zobrazí upozornenie s Zobraziť bod a jeho číslom. Presuňte bod na cestu alebo k nemu nakreslite úsek ručne.',
  'help.guide.tour-trip-places.tip.1': 'Miesto, ktoré už v túre je, je označené V túre a nedá sa vybrať dvakrát.',
  'help.guide.tour-details-times.step.3': 'Zadajte Prestávky, napríklad 0:45. Pripočítajú sa k odhadovanému času.',
  'help.guide.tour-save.step.1': 'Do Názov túry napíšte názov. Bez neho Uložiť zostáva sivé.',
  'help.guide.tour-edit-saved.title': 'Zmena uloženej túry',
  'help.guide.tour-edit-saved.tip.3':
    'Stiahnuť GPX a Uložiť do zbierky v záhlaví panela fungujú, až keď sú zmeny uložené.',
  'help.guide.tour-summary-profile.tip.1': 'Kliknutím na názov karty zbalíte celý prehľad.',
  'help.guide.tour-list-manage.step.3': 'Vyberte deň. Túra sa pridá do tohto dňa a jej riadok ukazuje deň.',
  'help.guide.tour-delete.goal': 'Odstráňte túru z cesty natrvalo.',
  'help.guide.tour-saved-elsewhere.goal': 'Rozhodnite, čo sa stane, keď niekto iný uložil túru, kým ste ju menili vy.',
  'help.ctx.trip-tour-import.title': 'Import túr',
  'help.guide.tour-import-gpx.goal':
    'Premeňte stopu z GPS hodiniek, aplikácie alebo Google Earth na túru cesty, ktorú si pred uložením skontrolujete.',
  'help.guide.tour-import-gpx.tip.3':
    'Stopa, ktorú cesta už obsahuje, je sivá s označením Už je v ceste a preskočí sa.',
  'help.guide.tour-view-import.step.3': 'Šípka vľavo hore, Späť na túry, ju znova zatvorí.',
  'help.guide.tour-plan-from-import.step.2':
    'TREK vyberie zo stopy kontrolné body a vytýči trasu medzi nimi znova. Mapa kreslí import bodkovane a návrh plnou čiarou a karta porovnáva ich dĺžky, podiel Do 50 m od stopy a Najväčšia odchýlka.',
  'help.guide.tour-restore-recorded.title': 'Návrat k zaznamenanej stope',
  'help.guide.tour-take-over.title': 'Prevzatie túry z inej cesty',
  'help.guide.tour-take-over.tip.1':
    'Kópia je samostatná túra. Zatiaľ nie je v žiadnom dni a neskoršie zmeny originálu sa na kópiu neprenášajú ani naopak. Jej Pôvod uvádza cestu, z ktorej bola prevzatá.',
  'help.guide.tour-import-wanderer.step.3':
    'Kliknite na trasu. Zobrazí sa na mape a stĺpec ukazuje, čo meria jej súbor GPX, jej popis a či je vo wanderer verejná alebo súkromná.',
  'help.ctx.trip-tour-map.summary':
    'Mapa uprostred karty Túry pre otvorenú túru: mapy, ktoré sa hodia k jej typu, zjazdovky alebo plavebné znaky zobrazené navrchu, miesta pozdĺž jej trasy a tá istá túra v 3D na skutočnej krajine.',
  'help.guide.tour-map-layers.step.1':
    'Otvorte kartu Túry a kliknite vpravo na túru pod Túry tejto cesty. Otvorí sa v plánovači a štítok vľavo dole na mape vypisuje mapy, ktoré tento druh túry ponúka.',
  'help.guide.tour-along-search.goal':
    'Hľadajte vyhliadky, vodu, chaty alebo miesto na jedlo blízko trasy túry, ktorú plánujete.',
  'help.guide.tour-along-search.tip.2':
    'Pri prechádzke mestom vyberú štyri témy nad zoznamom vhodné druhy miest za vás.',
  'help.guide.tour-along-add-stop.result':
    'Túra teraz vedie okolo tohto miesta, s novou vzdialenosťou a časom v Prehľad túry. Uložte túru, aby sa zmena zachovala.',
  'help.guide.tour-3d-terrain.step.3':
    'Kliknite vpravo na štítok Rozloženie sklonu. Rozbalí sa a ukáže, koľko túry vedie pod 5 %, 5 až 10 %, 10 až 18 %, 18 až 27 % a 27 % a viac. Keď je zbalený, ukazuje najvyšší bod a najstrmší úsek.',
  'help.guide.tour-3d-flyover.goal':
    'Pozrite si celú túru od začiatku do konca skôr, než ju prejdete pešo, na bicykli alebo na lyžiach.',
  'help.guide.tour-3d-flyover.tip.3':
    'Kým je prelet pozastavený, posúvajte sa po výškovom profile a bodka sa presunie na dané miesto. Prehrať prelet pokračuje odtiaľ.',
  'help.guide.tour-map-overlays.tip.1':
    'Zjazdovky sú mapové údaje, nie živé hlásenie: nehovoria nič o tom, čo je otvorené alebo upravené, o snehu ani o lavínach. Keď mapu oddialite za lyžiarsku oblasť, prepínač ukazuje „Priblížte mapu, aby ste videli zjazdovky“.',
  'help.ctx.trip-tour-stages.bullet.4':
    'V Túry tejto cesty ukazuje viacdňová túra mesiac s počtom etáp. Toto tlačidlo, Zobraziť etapy, rozbalí zoznam etáp s dňom, v ktorom je každá, a súčtami Celá trasa.',
  'help.guide.tour-multi-day.step.5':
    'Prehľad túry vypisuje všetky etapy pod Etapy. Kliknutím na jednu uvidíte, kde končí: jej posledná zastávka sa vyberie a výškový profil označí dané miesto.',
  'help.guide.tour-stages-on-days.goal': 'Zaraďte každú etapu na samostatný deň alebo celú túru na jeden deň.',
  'help.guide.tour-stages-on-days.tip.2':
    'Celá trasa v tento deň je sivá v dni, ktorý túru už obsahuje. Etapy od tohto dňa tam stále funguje a nahradí celú túru v tom dni.',
  'help.ctx.trip-tour-hike.bullet.3':
    'Záhlavie karty Trasové body obsahuje nástroje trasy: Obrátiť smer, Späť na štart a pri pešej túre Okruh od štartu. Ďalšie akcie pri zastávke obsahujú Porovnať cesty pre ďalší úsek.',
  'help.guide.tour-hike-plan.step.3': 'Pod Názov túry napíšte názov.',
  'help.guide.tour-hike-plan.tip.4':
    'Čas chôdze vychádza z pravidla pre turistické smerovníky (DIN 33466) a nezahŕňa prestávky. Pridajte ich pod Prestávky v Podrobnosti a zobrazia sa v plánovanom súčte.',
  'help.guide.tour-hike-trail-details.result':
    'Viete, ktoré časti pešej túry majú aký stupeň, z čoho sú a kde na mape ležia.',
  'help.guide.tour-hike-round.step.3':
    'Kliknite na Hľadať okruhy. Okruh A, Okruh B a tak ďalej sa zobrazia v zozname aj na mape, každý vo svojej farbe.',
  'help.guide.tour-hike-compare-ways.goal':
    'Zistite, ktorými inými cestami by mohla pešia túra viesť medzi dvoma zastávkami, a jednu z nich vyberte.',
  'help.guide.tour-hike-compare-ways.tip.3': 'Zrušiť zatvorí kartu a trasu nezmení.',
  'help.guide.tour-ferrata-add.result':
    'Pešia túra vedie po ferate po jej vlastnej čiare z OpenStreetMap. Kliknutím na mapu pokračujte z vrcholu. Smerovač plánuje iba cestu k ferate a cestu za ňou.',
  'help.guide.tour-run-plan.step.2':
    'Vyberte Profil: Beh pre prevažne spevnené cesty v meste, v parkoch a pozdĺž riek, Trailový beh pre lesné cesty a prírodné chodníky.',
  'help.guide.tour-run-plan.tip.4': 'Trailový beh používa cesty až po horské chodníky (T2), nikdy ťažšie.',
  'help.guide.tour-run-ways.tip.2':
    'Prepnite Profil na Trailový beh, ak má trasa viesť viac po prírodných cestách, alebo na Beh, ak má zostať na pevnom povrchu.',
  'help.guide.tour-walk-plan.title': 'Naplánovanie prechádzky mestom zastávku po zastávke',
  'help.guide.tour-walk-plan.tip.1':
    'Kruh okolo čísla zastávky ukazuje jej dôležitosť: plný pri Musíš vidieť, prerušovaný pri Voliteľné. Malý štít označuje zastávku Chránená.',
  'help.guide.tour-walk-sights.step.3':
    'Kliknite na Hľadať pozdĺž túry. Hviezda pred názvom označuje Top miesto, teda jedno z tunajších najznámejších miest.',
  'help.guide.tour-walk-day-times.goal':
    'Zistite, kedy v deň prechádzky prídete na každú zastávku a ktoré miesta sú v tom čase zatvorené.',
  'help.guide.tour-walk-day-times.tip.4':
    'Dve prechádzky v jeden deň: na karte Plán kliknite na úsek medzi nimi (Zmeniť spôsob dopravy) a vyberte Verejná doprava. Hľadanie začne tam, kde prvá prechádzka končí, a v čase, keď končí, a upozorní vás, ak spojenie dorazí po začiatku ďalšej prechádzky.',
  'help.guide.tour-walk-google-import.tip.1':
    'Číta sa iba trasa naplánovaná pre chôdzu. Pred zdieľaním prepnite Google Maps na chôdzu.',
  'help.guide.tour-walk-check-off.step.3':
    'Kliknite na Označiť ako navštívené pri zastávke, ktorú ste videli, alebo na Preskočiť pri zastávke, ktorú vynechávate.',
  'help.ctx.trip-tour-bike.bullet.1':
    'Profil pod Typ túry určuje, pre aký druh jazdy smerovač plánuje: Trekking, Cestný, Gravel alebo MTB. Riadok pod ním uvádza, čo smerovač hľadá, a po jeho zmene sa celá trasa naplánuje znova.',
  'help.guide.tour-bike-profile.step.3':
    'Pod Profil vyberte Trekking, Cestný, Gravel alebo MTB. Riadok pod ním uvádza, čo smerovač s týmto profilom hľadá.',
  'help.guide.tour-bike-profile.tip.4':
    'Uložiť zostáva sivé, kým túra nemá názov a kým nie sú vypočítané trasa a jej výšky.',
  'help.guide.tour-bike-surfaces.result':
    'Mapa označí úseky riadka, ktorý ste vybrali, a viete, po akých povrchoch trasa vedie. Samotná túra sa nezmení.',
  'help.guide.tour-bike-mtb-grades.step.2':
    'V karte Povrch a cesty si prečítajte Obtiažnosť trailu (mtb:scale): podiel trasy od S0, bez zvláštnych ťažkostí, až po S4 a viac, terén pre expertov.',
  'help.ctx.trip-tour-ski.summary':
    'Túra typu Lyže a zima na karte Túry: deň na zjazdovkách, bežecký okruh, skialpinistická túra, túra na snežniciach alebo zimná prechádzka. Jej úseky sledujú zjazdovky, vleky a trate zmapované v OpenStreetMap a smerovač zjazdoviek ich plánuje pre vašu disciplínu a vaše limity. Zaznamenaná lyžiarska stopa sa importuje spolu s disciplínou.',
  'help.guide.tour-ski-plan.step.1': 'Na karte Túry kliknite navrchu ľavého panela na Naplánovať novú túru.',
  'help.guide.tour-ski-plan.tip.3':
    'Ak disciplínu neskôr zmeníte, vaše body zostanú a úseky sa naplánujú znova s voľbami, ktoré táto disciplína používa.',
  'help.guide.tour-ski-options.step.4':
    'Použite prepínače: Jazdiť lanovkami, Povoliť freeride trasy, Podľa potreby zísť lanovkou a Vyhnúť sa domnelým spojkám. Beh na lyžiach pridáva Len upravené stopy a Len osvetlené stopy a Skialpinizmus pridáva Stúpať po okraji zjazdovky.',
  'help.guide.tour-ski-fix-leg.step.1':
    'Úsek, ktorý smerovač nevedel naplánovať, ukazuje pod svojím bodom červený riadok s dôvodom, napríklad „Only a lift you left out joins these points“, a so zjazdovkou alebo vlekom, ktorých sa týka.',
  'help.guide.tour-ski-summary.title': 'Čítanie trasy po zjazdovkách lyžiarskej túry',
  'help.guide.tour-ski-summary.tip.4':
    'Dolná časť karty uvádza lyžiarske oblasti a dátum mapových údajov, z ktorých bola túra naplánovaná.',
  'help.guide.tour-ski-pistes-layer.tip.2':
    'Ak sa zjazdovky prestanú načítavať, prepínač ukáže výstražnú značku. Mapa aj vaša trasa naďalej fungujú.',
  'help.guide.tour-ski-import.step.4': 'Kliknite na Importovať 1 túru.',
  'help.ctx.trip-tour-paddle.summary':
    'Túra na kajaku, kanoe alebo SUP po rieke alebo jazere. Uvádza loď a vodu, sleduje vodu tam, kde TREK má údaje, započítava prenášky a plavebné komory do svojho času a ukazuje vietor v deň, keď pádlujete, a čo je známe o prekážkach na ceste.',
  'help.guide.tour-paddle-setup.goal':
    'Začnite túru na kajaku, kanoe alebo SUP a zadajte, na čom pádlujete, na akej vode a ako rýchlo.',
  'help.guide.tour-paddle-setup.tip.1':
    'Ak je Loď nastavená na Ostatné, rýchlosť sa nenavrhne. Zadajte ju sami, inak zostane čas na vode prázdny.',
  'help.guide.tour-paddle-water-route.step.2':
    'Ak chcete jeden úsek naplánovať po vode, ukážte na zastávku pred ním a kliknite na Ďalšie akcie, tri bodky.',
  'help.guide.tour-paddle-water-route.result':
    'Každý úsek buď sleduje vodu, alebo je zámerne nakreslený ručne, a úsek, ktorý TREK nevedel naplánovať, uvádza prečo.',
  'help.guide.tour-paddle-portage.tip.1':
    'Ak chcete úsek predsa len preplávať, znova otvorte Ďalšie akcie pri bode a vyberte Tento úsek znova pádlovať. Úsek sa zmení späť na ručne nakreslený.',
  'help.guide.tour-paddle-lock.step.3': 'Kliknutím na kartu Plavebná komora ju otvoríte.',
  'help.guide.tour-paddle-time.step.1':
    'Odhad času je v ľavom stĺpci pod trasovými bodmi. Odznak v jeho záhlaví je súčet vrátane prestávok.',
  'help.guide.tour-paddle-time.result': 'Odhad zahŕňa to, čo ste zadali, a uvádza, čo ešte chýba.',
  'help.guide.tour-paddle-wind.tip.2':
    'Pri túre na viac dní sa v záhlaví karty zobrazí pre každý deň štítok Deň. Kliknutím na jeden z nich uvidíte ten deň.',
  'help.guide.tour-paddle-checklist.step.3':
    'Položky sledujú trasu: jazy, plavebné komory, pereje, miesta spustenia lode na vodu a pravidlá prístupu z OpenStreetMap, ako aj vaše vlastné prenášky a plavebné komory, označené Vlastné.',
  'help.guide.tour-paddle-checklist.result':
    'Každá položka na trase má rozhodnutie a bezpečnostnú poznámku ste si prečítali.',
  'help.guide.tour-paddle-track-marks.step.6':
    'Kliknite na Plavebná komora a potom na čiaru tam, kde plavebná komora je.',
  'help.ctx.trip-tour-horse.bullet.1':
    'Ak v editore nastavíte Typ túry na Vychádzka na koni, v ľavom stĺpci sa zobrazí karta Jazdecké trasy. Hľadať vo výreze mapy vypíše trasy vo výreze mapy.',
  'help.guide.tour-horse-plan.step.2':
    'Kliknite na pole Typ túry pod Názov túry a vyberte Vychádzka na koni. Karta Jazdecké trasy sa zobrazí pod Trasové body.',
  'help.guide.tour-horse-plan.tip.2':
    'TREK pre vychádzku nevypočíta čas jazdy. Ak chcete mať v dni čas, zadajte ho pod Plánované v Podrobnosti.',
  'help.guide.tour-horse-gap.step.3': 'Kliknite na Prevziať úsek. Kým prepínač nie je zapnutý, tlačidlo zostáva sivé.',
  'help.guide.tour-horse-recorded.step.1':
    'V Túry tejto cesty kliknite na Pridať túru (+), vyberte Importovať GPX alebo KML a zvoľte súbor so svojou vychádzkou.',
  'help.guide.dateless-trip.title': 'Plánovanie cesty bez dátumov',
  'help.guide.trip-reminder.step.2':
    'Pod Pripomienka vyberte 1, 3 alebo 9 dní. Ak chcete iný predstih, kliknite na Vlastné a zadajte počet dní od 1 do 30.',
  'help.guide.upcoming-reservations.title': 'Rýchly skok na najbližšie rezervácie',
  'help.guide.half-company-holiday.title': 'Označenie polovičného firemného voľna',
  'help.guide.edit-holiday-calendar.step.2':
    'Kliknutím na farebný štvorček vyberiete novú farbu, alebo napíšte nový popis a stlačte Enter.',
  'help.guide.person-color.step.1': 'V karte Osoby kliknite na farebnú bodku pred menom.',
  'help.guide.answer-fusion-request.title': 'Odpoveď na žiadosť o prepojenie',
  'help.guide.log-for-partner.title': 'Zapisovanie dní pre človeka, s ktorým plánujete',
  'help.guide.dissolve-fusion.title': 'Ukončenie spoločného plánovania',
  'help.guide.country-places.goal':
    'Zobrazte si miesta, ktoré TREK započítal ku krajine, aby ste skontrolovali, čo ste tam robili, alebo našli miesto, ktoré TREK priradil k nesprávnej krajine.',
  'help.guide.regions.tip.3':
    'Pridať do zoznamu prianí (Bucket list) funguje aj pre región. Región sa zobrazí s rovnakým šrafovaním ako krajina vo vašom zozname prianí.',
  'help.guide.tour-activity-stats.step.2':
    'Dvoma pilulkami vľavo vyberte obdobie a typ. Obdobie ponúka Celkovo, Tento rok, Posledných 12 mesiacov a každý starší rok, v ktorom máte túry. Typ zúži čísla na jeden druh túry, alebo ukáže Všetky typy.',
  'help.guide.tour-activity-stats.tip.3':
    'Deň s uvedenými účastníkmi sa počíta iba im, deň bez uvedených účastníkov sa počíta všetkým v ceste. Karta načíta živé dáta, preto potrebuje pripojenie k internetu.',
  'help.guide.move-to-list.goal':
    'Usporiadajte svoje zoznamy: presúvajte miesta medzi nimi alebo ich kopírujte do ďalšieho zoznamu.',
  'help.guide.accept-list-invite.result':
    'Zoznam sa objaví v lište pod Zdieľané a otvorí sa aj s miestami. Zmeny jeho členov vidíte okamžite.',
  'help.guide.tour-collection-add-to-trip.step.1':
    'Otvorte zoznam. Uložené túry sú v prvých riadkoch, nad miestami. Kliknite pri túre na Pridať do cesty, alebo kliknite priamo na jej riadok.',
  'help.guide.tour-collection-manage.title': 'Hľadanie a odstraňovanie uložených túr',
  'help.guide.tour-collection-manage.result': 'Túra zmizne zo zoznamu a krátka správa to potvrdí.',
  'help.guide.entry-draft.title': 'Uloženie záznamu ako konceptu',
  'help.guide.journey-map-layers.step.1':
    'Navrchu mapy je lišta vrstiev Plán, Zaznamenané, Záznamy a Fotky, každá s počtom. Kliknutím na vrstvu ju skryjete alebo zobrazíte.',
  'help.guide.journey-keep-route.step.1': 'V záhlaví dňa kliknite na tlačidlo Dawarich, Prevziať záznam.',
  'help.guide.journey-day-stays.step.1':
    'Deň s pobytmi na kontrolu končí riadkom v tvare „4 pobyty z Dawarich“ a časovým rozsahom. Kliknutím naň pobyty zobrazíte.',
  'help.guide.journey-take-over-day.step.1':
    'Kliknite na Prevziať deň na konci riadku s pobytmi dňa, alebo na tlačidlo so zoznamom v záhlaví dňa, ktoré ukazuje, koľko pobytov čaká.',
  'help.guide.journey-auto-prepare.goal':
    'Nechajte si pobyty každého dňa pripraviť na kontrolu automaticky, kým cesta prebieha.',
  'help.guide.photo-location.goal': 'Umiestnite záznamy na mapu bez toho, aby ste pre každý hľadali miesto.',
  'help.ctx.settings-about.bullet.1': 'Verzia, ktorá beží na tomto serveri, je vedľa nadpisu.',
  'help.guide.readability.tip.3':
    'Čitateľnosť je označená ako Experimentálne. Ak niečo vyzerá zle, kliknite dole na karte na Obnoviť predvolené a vrátite pôvodné nastavenia.',
  'help.guide.web-push-device.goal':
    'Zobrazujte oznámenia z TREK na telefóne alebo počítači, aj keď je TREK zatvorený.',
  'help.guide.connect-airtrail.tip.2':
    'Kľúč sa ukladá zašifrovaný a už sa nezobrazí. Bodky v poli znamenajú, že je nejaký uložený.',
  'help.guide.connect-dawarich.tip.2':
    'Pod tlačidlami karta uvádza, kedy TREK naposledy kontroloval a čo vaša verzia Dawarich neponúka.',
  'help.guide.tour-connect-wanderer.tip.2':
    'Inštancia na súkromnej adrese môže vyžadovať, aby správca povolil interné siete.',
  'help.guide.tour-wanderer-watch.tip.2':
    'Pozastavené do znamená, že wanderer neodpovedal. Token odmietnutý znamená, že token potrebuje úspešný test pripojenia alebo nový token.',
  'help.guide.plugin-settings.result':
    'Plugin funguje podľa vašich nastavení a každá akcia, ktorú pre vás vykoná, je uvedená pod Aktivita doplnkov.',
  'help.ctx.admin-defaults.bullet.3':
    'Odkaz obnoviť vedľa nastaveného poľa vráti predvolenú hodnotu TREK. Vlastné nastavenie používateľa má vždy prednosť pred týmito.',
  'help.ctx.admin-settings.bullet.5': 'Nebezpečná zóna: Obnoviť tajný kľúč JWT odhlási všetkých používateľov, aj vás.',
  'help.guide.default-user-settings.step.1':
    'Pod Predvolené nastavenia používateľa vyberte Farebný režim (Svetlé, Tmavý alebo Automatické), Jednotky teploty, Jednotky vzdialenosti, Formát času, Týždeň začína, Zobrazovaná mena a či je Skryť rezervačné kódy zapnuté alebo vypnuté. Každá voľba sa uloží okamžite.',
  'help.guide.admin-passkeys.step.2':
    'Zadajte Relying Party ID (doména), napríklad trek.example.org, a Povolené origins, na ktorých je váš TREK dostupný, a kliknite na Uložiť. Ak necháte obe polia prázdne, použije sa APP_URL.',
  'help.guide.rotate-jwt-secret.title': 'Odhlásenie všetkých naraz',
  'help.guide.notification-defaults.step.2':
    'Kliknutím na bunku ju prepnete na ďalší stav: Zapnuté, Vypnuté, Blokované. Tooltip uvádza ďalší stav a každé kliknutie sa uloží okamžite.',
  'help.ctx.notifications.bullet.2':
    'Všetky a Neprečítané navrchu prepínajú medzi všetkými oznámeniami a len neprečítanými. Ďalšie sa načítajú pri rolovaní.',
  'help.guide.read-notifications.step.3':
    'Kliknite na tlačidlo pod oznámením, Zobraziť Vacay, a otvorí sa to, čoho sa oznámenie týka. Zároveň sa označí ako prečítané.',
  'help.guide.filter-notifications.step.3':
    'Kliknutím na Neprečítané zobrazíte len oznámenia, ktoré ste ešte nečítali. Všetky znova ukáže všetky.',
  'help.guide.mark-notifications-read.tip.2':
    'Označenie ako prečítané mení len farbu pozadia a počet. Oznámenie zostane v zozname, kým ho nevymažete.',
  'help.guide.delete-notifications.result': 'Oznámenie zmizne zo zoznamu aj zo zvončeka.',
  'help.guide.notification-settings.result':
    'Nastavenia sa otvoria na Oznámenia, s prepínačom pre každú udalosť a kanál.',
  'help.guide.link-journal.goal':
    'Zobrazte jeden zo svojich denníkov z Cestovný denník priamo v ceste, ľuďom, ktorých si vyberiete.',
  'help.guide.link-journal.tip.3':
    'Neskôr má Denník v Nastavenia cesty možnosti Upraviť prístup, Zmeniť denník a Odpojiť. Odpojením zmizne karta. Ľudia, ktorých ste pridali priamo v denníku, si prístup ponechajú.',
  'help.guide.dawarich-stays.result':
    'Pobyt je miesto cesty v dni, ktorý ste vybrali, alebo pod Nezaradené, a panel ho označí ako vybavený.',
  'help.ctx.trip-days.bullet.7': 'Kým cesta prebieha, plán sa otvorí na dnešnom dni a posunie sa k nemu.',
  'help.guide.leave-stop-off-route.tip.2':
    'Odobrať z dňa zastávku z dňa odstráni, kým Vynechať z trasy ju v pláne ponechá.',
  'help.guide.move-booking-day.goal':
    'Presuňte dopravu alebo rezerváciu na iný deň priamo z plánu, bez otvárania jej formulára.',
  'help.guide.place-image-from-file.result': 'Fotka je obrázok miesta na karte, v stĺpci miest, v dni a na mape.',
  'help.guide.place-own-hours.step.3':
    'Otváracie hodiny pod nimi zobrazujú týždeň, jeden riadok na deň. Ak TREK pre miesto našiel hodiny, sú už vyplnené. Ak nie, kliknite najprv na Pridať otváracie hodiny. Napíšte, kedy sa každý deň otvára a zatvára, a v dni, keď je zatvorené, kliknite na Uzavreté.',
  'help.guide.add-accommodation.tip.5':
    'Stopy GPX a miesta z túr sa ako ubytovanie nikdy nenavrhujú, len bežné miesta cesty.',
  'help.guide.confirm-stay-booking.step.1':
    'Otvorte deň, v ktorom sa ubytujete. Na karte pobytu uvidíte pod Rezervácia rezerváciu hotela na tú noc so stavom Čaká na potvrdenie alebo Potvrdené. Kliknite na toto pole.',
  'help.guide.tour-map-lines.step.4':
    'Ak chcete túru z mapy odstrániť, prepnite pravý stĺpec na Túry, ukážte na túru a kliknite na oko, Skryť na mape. Jej čiara a špendlík z mapy zmiznú a riadok zostane v zozname stlmený, s prečiarknutým okom, Zobraziť na mape, ktoré ju zase zobrazí.',
  'help.guide.car-stops.step.1':
    'V záhlaví dňa, v ktorom preberáte auto, kliknite na +, ktorého tooltip znie Pridať k dňu, a vyberte Pridať dopravu.',
  'help.guide.car-stops.tip.2': 'Posunúť nahor a Posunúť nadol sa zobrazia, až keď má jazda dve zastávky alebo viac.',
  'help.guide.transport-details.title': 'Otvorenie dopravy a práca s jej podrobnosťami',
  'help.guide.transport-details.tip.1': 'Na mape znova pri jazde s nakreslenou čiarou čiaru vypne.',
  'help.guide.export-transports-csv.result':
    'Prehliadač uloží súbor pomenovaný podľa cesty, napríklad autumn-in-japan-transports.csv, s jedným riadkom na jazdu: Typ, Názov, Stav, Začiatok, Do, Od, Do, Miesto, Potvrdenie a Poznámky.',
  'help.guide.group-sort-bookings.goal':
    'Usporiadajte karty alebo zoznam podľa stavu, dňa alebo typu, v poradí, aké chcete.',
  'help.guide.booking-on-map.tip.1':
    'Na mape sa zobrazuje len pri rezervácii s miestom. Vyberte miesto vo formulári pod Miesto / Aktivita a tlačidlo sa objaví.',
  'help.guide.export-bookings-csv.step.2':
    'Otvorte Možnosti zobrazenia, posuvníky za ikonami zobrazení, a pod Zoradiť podľa vyberte poradie. Riadky ho dodržia, jeden riadok na rezerváciu a bez sekcií.',
  'help.guide.edit-booking.tip.4':
    'Ak ste niečo zmenili, kliknutie mimo formulára alebo Escape sa opýta Zahodiť zmeny? Pokračovať v úpravách vás vráti do formulára.',
  'help.guide.arrange-packing-list.step.2':
    'V zozname chyťte úchyt vľavo od riadku a potiahnite položku nahor alebo nadol. Čiara vo farbe vášho akcentu na ľavom okraji riadku ukazuje, kam položka dopadne.',
  'help.guide.count-packed-pieces.goal': 'Určte položke množstvo a označujte jej kusy ako zbalené jeden po druhom.',
  'help.guide.count-packed-pieces.tip.3':
    'Pri množstve jedna sa počítadlo nezobrazuje, je tam len políčko na odškrtnutie.',
  'help.guide.expense-receipts.step.2':
    'Kliknite na Priložiť vedľa Účtenky a faktúry a vyberte fotku alebo PDF, môžete vybrať aj viac súborov naraz. Každý súbor je uvedený pod nadpisom a má kôš na odstránenie.',
  'help.guide.files-sync-settings.goal':
    'Rozhodnite, či sa dokumenty len importujú z vášho úložiska, len exportujú do neho, alebo oboje, a čo sa stane, keď sa dokument vymaže alebo zmení na oboch miestach.',
  'help.guide.files-sync-settings.tip.2':
    'Pri Opýtať sa čaká dokument upravený na oboch miestach pod Vyžaduje pozornosť, pod kartou. Kliknite na „Resolve“ a vyberte Ponechať verziu z TREKu, Ponechať verziu poskytovateľa alebo Ponechať obe.',
  'help.guide.manage-notes.goal':
    'Otvorte poznámku celú, dôležitú nechajte navrchu a zastaranú opravte alebo odstráňte.',
  'help.guide.manage-notes.tip.2':
    'Počas úprav červený krížik pri už priloženom súbore súbor vymaže okamžite, ešte pred kliknutím na Uložiť, a nejde do koša. Každý súbor poznámky sa zobrazuje aj v karte Súborov cesty.',
  'help.guide.note-categories.step.6':
    'Späť v karte Poznámky filtrujú karty pilulky pod záhlavím. Kliknutím na kategóriu uvidíte len jej poznámky. Všetky, alebo tá istá pilulka ešte raz, zobrazí všetky.',
  'help.guide.roadtrip-reorder.tip.1': 'Presun zastávky tu ju presunie aj v pláne dňa: Dni zobrazujú rovnaké poradie.',
  'help.guide.roadtrip-overnight.step.1':
    'V Pozdĺž trasy zaškrtnite pod Hľadá sa Ubytovanie, alebo Kemp pre stanovisko, vyberte deň, v ktorom chcete zastaviť, a kliknite na Hľadať.',
  'help.guide.roadtrip-overnight.tip.3':
    'Ak je zapnuté Začať a ukončiť každý deň v ubytovaní pod Čiara trasy v Nastavenie jazdy, jazda nasledujúceho dňa začne tam, kde ste prespali.',
  'help.guide.roadtrip-stop-fill.title': 'Nastavenie, ako dlho sa zdržíte na jednej zastávke',
  'help.guide.roadtrip-bookings.title': 'Zahrnutie letu, vlaku alebo trajektu do jazdy',
  'help.guide.roadtrip-bookings.tip.2':
    'Stôl alebo lístok rezervovaný na zastávke sa zobrazí ako pilulka pri tej zastávke. Všetko, čo k žiadnej zastávke nepatrí, je uvedené pod V tento deň rezervované aj.',
  'help.guide.roadtrip-google-import.step.3':
    'Skontrolujte nájdené zastávky. Každá ukazuje, kde leží. Zastávka označená „Location unresolved“ sa preskočí.',
  'help.guide.roadtrip-hazards.step.1': 'V pravom stĺpci otvorte Nastavenie jazdy.',
  'help.ctx.trip-tours.summary':
    'Pravý stĺpec karty Plán v režime Túry: všetky túry cesty v jednom zozname vedľa dní. Odtiaľto priraďujete túry k dňom, filtrujete zoznam, skrývate čiary na mape a importujete súbory GPX alebo KML. Trasy sa kreslia a menia v karte Túry.',
  'help.guide.tour-show-list.goal': 'Nahraďte stĺpec miest túrami cesty, aby ste ich videli a vyberali vedľa dní.',
  'help.guide.tour-show-list.tip.3':
    'Pri zapnutom doplnku Túry sa stopy v zozname Miest nikdy nezobrazujú: každá importovaná stopa je túra a nájdete ju tu.',
  'help.guide.tour-add-to-day.step.5':
    'Túra s etapami sa v tej istej ponuke opýta ešte na ďalšie. Etapy od tohto dňa umiestnia etapu 1 na tento deň a každú ďalšiu na nasledujúci deň. Celá trasa v tento deň umiestni všetko na tento jeden deň.',
  'help.guide.tour-day-times.step.1':
    'V stĺpci dní ukážte na riadok túry, kliknite na Ďalšie možnosti (tri bodky) a vyberte Upraviť.',
  'help.guide.tour-day-times.result':
    'Túra sa v časovej osi dňa zobrazí so začiatkom a koncom, ako každá zastávka s časom.',
  'help.guide.tour-remove-from-day.result': 'Deň túru už neuvádza a jej riadok v zozname nemá odznak Deň.',
  'help.guide.tour-filter-list.tip.2':
    'Sekcia sa zobrazí len vtedy, keď sa túry v nej líšia, takže krátky zoznam môže ponúkať len Stav.',
  'help.guide.tour-hide-on-map.tip.1':
    'Skrytie platí len pre vás a ukladá sa v tomto prehliadači pre túto cestu. Túra, jej dni a farba sa nemenia a ostatným zostane na mape viditeľná.',
  'help.guide.tour-import-plan-tab.tip.1':
    'Stopa, ktorá už v ceste je, je označená Už je v ceste a neimportuje sa dvakrát.',
  'help.ctx.trip-tour-detail.bullet.4':
    'Riadok úplne dole: Pridať k dňu alebo Odobrať z dňa, kým je otvorený deň, Navigácia na štart, webová stránka túry, GPX, Zdieľať tam, kde vaše zariadenie vie zdieľať súbory, Zbierka a Kopírovať.',
  'help.guide.tour-detail-read.step.5':
    'Nižšie sú údaje: Vzdialenosť, Minimálna nadmorská výška, Maximálna nadmorská výška, Stúpanie a Klesanie, pod nimi časy a výškový profil vo farbe čiary túry.',
  'help.guide.tour-detail-read.result':
    'Karta túry je otvorená vedľa plánu a viete, v ktorých dňoch túra je, aká je dlhá a strmá a odkiaľ pochádza.',
  'help.guide.tour-rename-colour.tip.2': 'Ceruzka a bodka fungujú len pre členov, ktorí smú upravovať miesta.',
  'help.guide.tour-take-along.tip.2':
    'Vyberte si preferovanú mapovú aplikáciu v Nastavenia a Navigácia otvorí rovno ju, namiesto zoznamu aplikácií.',
  'help.guide.tour-copy-keep.step.3':
    'Ak chcete túru uložiť pre iné cesty, otvorte ju a kliknite dole na jej karte na Zbierka.',
  'help.guide.tour-packing-link.goal':
    'Zobrazte, čo si na túru zbaliť, priamo v jej karte, zo zoznamu vecí na balenie cesty alebo z niektorého z jeho zoznamov.',
  'help.guide.tour-packing-link.tip.3':
    'Prepojenie vyžaduje právo upravovať miesta. Všetci ostatní vidia prepojený zoznam, ale prepojenie nemôžu meniť.',
  'help.guide.tour-files.tip.2': 'Nahrať sa zobrazuje len členom, ktorí smú túru meniť a pridávať súbory.',
  'help.guide.tour-activity-link.step.5':
    'Stopa sa teraz zobrazí pod Skutočná trasa, s vlastnými hodnotami a vlastným profilom vedľa plánu.',
  'help.guide.tour-activity-compare.step.2':
    'Najväčšia odchýlka od plánu ukazuje najväčšiu vzdialenosť medzi stopou a plánovanou čiarou a Mimo plánu ukazuje, koľko stopy viedlo mimo tejto čiary.',
  'help.guide.tour-origin-check.step.1':
    'Otvorte kartu túry a prejdite na Pôvod. Zdroj uvádza, odkiaľ túra pochádza: Import GPX s názvom súboru, import KML alebo KMZ, alebo wanderer s jeho adresou.',
  'help.ctx.trip-tour-planner.summary':
    'Plánovač túr cesty: vľavo editor, vpravo všetky túry cesty a medzi nimi mapa. Tu túru nakreslíte bod po bode, vytrasujete ju po skutočných chodníkoch a cestách, doplníte podrobnosti a uložíte do cesty.',
  'help.guide.tour-open-workspace.goal': 'Otvorte plánovač túr a zistite, načo slúži každá jeho časť.',
  'help.guide.tour-open-workspace.tip.1':
    'Zbaliť na záložke na vnútornom okraji každého panela panel skryje, aby mala mapa viac miesta. Plán a Túry tejto cesty panely znova zobrazia. Ťahaním okraja panela ho zväčšíte alebo zmenšíte.',
  'help.guide.tour-draw-route.step.3':
    'Skontrolujte, či je zapnuté Pridať bod pod Trasové body (je to ten istý prepínač ako Pridávať body v pilulke mapy), a potom kliknite na mapu tam, kde túra začína.',
  'help.guide.tour-draw-route.result':
    'Očíslovaná trasa na mape a jej body pod Trasové body, pripravené na pomenovanie a uloženie.',
  'help.guide.tour-type-profile.tip.2':
    'Niektoré typy vyžadujú pred uložením viac údajov: Beh svoje Plánované tempo, Vodácka túra loď a vodu, túra Lyže a zima svoju disciplínu.',
  'help.guide.tour-edit-points.step.5': 'Odstrániť bod trasy, kôš vedľa neho, odstráni bod z túry.',
  'help.guide.tour-shaping-points.step.2':
    'Potiahnite bodku na cestu, ktorou má trasa viesť. Trasa sa cez ňu naplánuje znova.',
  'help.guide.tour-loop-reverse.goal': 'Urobte z túry okruh, ktorý končí na štarte, alebo otočte jej smer.',
  'help.guide.tour-leg-by-hand.title': 'Ručné nakreslenie úseku alebo jeho opätovné naplánovanie',
  'help.guide.tour-leg-by-hand.result':
    'Úsek je priama čiara tam, kde ste ho určili, označená ako nakreslená ručne, alebo sa vytrasuje znova.',
  'help.guide.tour-trip-places.tip.2':
    'Odstránením zastávky alebo jej odpojením miesto v ceste zostane tak, ako je, aj s jeho dňami.',
  'help.guide.tour-details-times.step.4':
    'Plánované ukazuje súčet. Ak ho chcete prepísať, zadajte vlastnú hodnotu. Potom je označený Ručná úprava.',
  'help.guide.tour-save.step.2':
    'Počkajte, kým zmizne bodka vedľa Nová túra. Uloženie vyžaduje trasu a všetky jej výšky.',
  'help.guide.tour-edit-saved.goal': 'Otvorte túru, ktorú ste plánovali predtým, upravte ju a uložte znova.',
  'help.guide.tour-edit-saved.result': 'Uložená túra obsahuje vaše zmeny.',
  'help.guide.tour-summary-profile.tip.2':
    'Trasa, ktorá vedie po ferate, dostane nad číslami výstražný odznak s jej stupňom.',
  'help.guide.tour-list-manage.step.4':
    'Tlačidlo nad Rozsah cesty je filter. Uvádza stav, ktorý zobrazuje, najprv Všetky, s počtom túr.',
  'help.guide.tour-delete.step.1':
    'Ukážte na túru pod Túry tejto cesty a kliknite na kôš vpravo v jej riadku, Vymazať s názvom túry.',
  'help.guide.tour-saved-elsewhere.step.1':
    'Počas úprav sa navrchu panela zobrazí Táto túra bola uložená inde. Vaše zmeny zostanú zachované, kým sa nerozhodnete.',
  'help.ctx.trip-tour-import.summary':
    'Tu do cesty importujete túry, ktoré už existujú inde: súbor GPX, KML alebo KMZ z hodiniek či aplikácie, túru z inej vašej cesty alebo trasu z vášho vlastného wanderer. Import sa uchová presne tak, ako bol zaznamenaný, a môžete z neho naplánovať upraviteľnú verziu.',
  'help.guide.tour-import-gpx.step.1':
    'Otvorte kartu Túry cesty. Navrchu Túry tejto cesty vpravo kliknite na + (Pridať túru).',
  'help.guide.tour-import-gpx.tip.4':
    'Pri súbore KML alebo KMZ sa pod Neimportované uvádza aj to, čo okrem čiar obsahoval: špendlíky, oblasti a ďalšie položky.',
  'help.guide.tour-view-import.tip.1':
    'Import sa nedá upravovať bod po bode. Naplánovať upraviteľnú verziu v karte Upraviteľná verzia vyššie z neho vytvorí túru, ktorú môžete meniť.',
  'help.guide.tour-plan-from-import.step.3':
    'Kliknite na Nahradiť import, ak chcete túto túru naplánovať znova priamo na mieste: jej dni a poznámky zostanú a zaznamenaná stopa sa zachová, aby ste ju mohli obnoviť. Naplánovať ako novú túru import nezmení a vytvorí vedľa neho druhú túru.',
  'help.guide.tour-restore-recorded.goal':
    'Vráťte späť nové naplánovanie importu a získajte originálnu stopu, aj dlho potom.',
  'help.guide.tour-take-over.goal':
    'Použite túru, ktorú ste už naplánovali alebo importovali v inej zo svojich ciest, bez toho, aby ste ju kreslili znova.',
  'help.guide.tour-take-over.tip.2':
    'Zobrazujú sa len vaše ostatné cesty a len prvých 100 túr. Ostatné nájdete vyhľadávaním alebo filtrom.',
  'help.guide.tour-import-wanderer.step.4': 'Kliknite na Importovať do cesty.',
  'help.ctx.trip-tour-map.bullet.1':
    'Pilulka vľavo dole na mape ponúka základné mapy podľa typu otvorenej túry: Mapa, Topo, Turistika pri pešej túre, Bicykel pri cyklotúre a Satelit. Vaša voľba platí len v plánovači a nikdy nemení nastavenie mapy v Nastavenia.',
  'help.guide.tour-map-layers.step.2':
    'Kliknite na Topo pre vrstevnice a tieňovaný reliéf, teda mapu, ktorá ukazuje strmosť terénu. Vybraná mapa zostane v pilulke zvýraznená.',
  'help.guide.tour-along-search.step.1':
    'Otvorte túru v karte Túry a posuňte ľavý panel nadol na Pozdĺž túry, pod zastávky túry. Karta sa tam zobrazí, len čo má túra trasu.',
  'help.guide.tour-along-search.tip.3':
    'Výsledky pochádzajú z OpenStreetMap a z indexu miest TREK, takže vyhľadávanie potrebuje pripojenie. Keď sa nič nenájde, „Widen to“ skúsi ďalšiu vzdialenosť. Keď je server vyťažený, Skúsiť znova odpočítava, kedy to môžete skúsiť znova.',
  'help.guide.tour-along-add-stop.tip.1':
    'Miesto sa stane zastávkou túry, nie miestom cesty, takže sa v zozname miest nezobrazí.',
  'help.guide.tour-3d-terrain.step.4':
    'Potiahnutím posuvníka Reliéf zväčšíte kopce až trojnásobne, čo pomáha v miernom teréne.',
  'help.guide.tour-3d-flyover.step.1':
    'Prepnite túru na 3D. Kým sa načítava krajina pozdĺž trasy, kruh sa plní tam, kde sa objaví tlačidlo prehrávania. Keď je plný, kliknite na Prehrať prelet. Kamera sleduje bodku po trase a kurzor na výškovom profile v Prehľad túry sa pohybuje spolu s ňou.',
  'help.guide.tour-map-overlays.title': 'Zobrazenie zjazdoviek alebo plavebných znakov nad mapou',
  'help.guide.tour-map-overlays.tip.2':
    'Prepínač zjazdoviek je dostupný aj bez otvorenej túry, takže si lyžiarsku oblasť môžete pozrieť skôr, než niečo naplánujete. Pri pešej túre pilulka namiesto toho ponúka Ferraty s počtom trás v zábere.',
  'help.ctx.trip-tour-stages.bullet.5':
    'Plus na riadku túry, Pridať k dňu, rozloží etapy do cesty po jednej na deň od dňa, ktorý vyberiete, alebo dá celú túru na ten jeden deň.',
  'help.guide.tour-multi-day.step.6':
    'Ak z nej chcete znova urobiť jednodňovú túru, kliknite na Jednodňová a potvrďte Urobiť z nej jednodňovú túru? tlačidlom Odobrať konce etáp. Trasa zostane taká, aká je.',
  'help.guide.tour-stages-on-days.step.1':
    'V Túry tejto cesty ukážte na viacdňovú túru a kliknite na plus, Pridať k dňu.',
  'help.guide.tour-stages-on-days.tip.3':
    'Ak viacdňovú túru potiahnete na deň v karte Plán, opýta sa na to isté v dialógu, rovnako ako Pridať k dňu na karte túry.',
  'help.ctx.trip-tour-hike.bullet.4':
    'Podrobnosti o ceste, pod trasovými bodmi, ukazujú stupeň SAC, povrch a typ cesty každého úseku z OpenStreetMap a podľa nich zafarbujú trasu na mape. Nič z toho túru nemení.',
  'help.guide.tour-hike-plan.step.4':
    'Pridať bod je zapnuté od začiatku: kliknite na mapu tam, kde pešia túra začína a kde končí. Miesta cesty vedľa neho namiesto toho vyberie chatu alebo hotel cesty. Od dvoch bodov TREK vypočíta pešiu trasu.',
  'help.guide.tour-hike-trail-details.title': 'Zobrazenie stupňov, povrchov a typov ciest pozdĺž pešej túry',
  'help.guide.tour-hike-trail-details.tip.1':
    'Cesty, pre ktoré OpenStreetMap nemá hodnotu, sú uvedené pod Neznáma, a neznáma neznamená ľahká. Ak sa pri niektorých zobrazí Tentoraz sa nedalo zistiť, kliknite na Skúsiť znova.',
  'help.guide.tour-hike-round.step.4':
    'Kliknutím na okruh ho vyberiete. Jeho riadok ukazuje vzdialenosť, stúpanie a čas a o koľko sa líši od vzdialenosti, ktorú ste zadali.',
  'help.guide.tour-hike-compare-ways.step.1':
    'Ukážte na zastávku, kde úsek začína, kliknite v jej riadku na Ďalšie akcie a vyberte Porovnať cesty pre ďalší úsek.',
  'help.guide.tour-ferrata-add.title': 'Pridanie ferraty do pešej túry',
  'help.guide.tour-ferrata-add.tip.1':
    'Ferata vyžaduje vybavenie a skúsenosti. Tooltip odznaku ukazuje, koľko z nej trasa prechádza.',
  'help.guide.tour-run-plan.step.3':
    'Zadajte svoje Plánované tempo v minútach a sekundách na kilometer, napríklad 7:30.',
  'help.guide.tour-run-ways.title': 'Zobrazenie ciest, po ktorých beh vedie',
  'help.ctx.trip-tour-walk.title': 'Prechádzka mestom',
  'help.guide.tour-walk-plan.goal':
    'Zostavte prechádzku po pamiatkach zo zastávok, s dĺžkou pobytu pri každej a označením tých dôležitých.',
  'help.guide.tour-walk-plan.tip.2':
    'Prechádzka mestom nemá limit pre pešiu turistiku ani pole Prestávky: namiesto nich sa použijú časy pobytov.',
  'help.guide.tour-walk-sights.step.4':
    'Kliknite na miesto v zozname. Jeho karta sa otvorí nad mapou: pod Kam patrí vyberte dve zastávky, medzi ktoré patrí.',
  'help.guide.tour-walk-day-times.step.1':
    'Priraďte prechádzku k dňu: v Túry tejto cesty kliknite na okrúhle + v jej riadku (Pridať k dňu) a vyberte deň.',
  'help.guide.tour-walk-day-times.result':
    'Zastávky môžete preusporiadať alebo zmeniť časy pobytov, kým nie je každé miesto otvorené v čase, keď tam prídete.',
  'help.guide.tour-walk-google-import.tip.2':
    'Použiť iný odkaz vás vráti k poľu s odkazom. Načítanie prepíše neuložené zmeny v plánovači a dialóg vás na to najprv upozorní.',
  'help.guide.tour-walk-check-off.step.4':
    'Navrchu zoznamu je počet navštívených zastávok a zostávajúci čas chôdze. Vrátiť pri zastávke zruší jej označenie.',
  'help.ctx.trip-tour-bike.bullet.2':
    'Prehľad túry vpravo ukazuje Čas jazdy (odhad), čas podľa smerovača pre daný profil vrátane stúpaní. Prestávky nie sú zahrnuté.',
  'help.guide.tour-bike-profile.step.4':
    'Pod Trasové body kliknite na Miesta cesty a vyberte štart a cieľ, tu Hotel Alpenroyal a potom Hotel Greif. Môžete tiež skontrolovať, či je zapnuté Pridať bod, a kliknúť na mapu. Od dvoch bodov TREK vypočíta trasu.',
  'help.guide.tour-bike-profile.tip.5':
    'Ak správca povolí mapu CyclOSM, riadok vrstiev na mape ponúka pri otvorenej cyklotúre aj Bicykel. Ak sa prestane načítavať, prepnite na Mapa. Túra sa nezmení.',
  'help.guide.tour-bike-surfaces.tip.1':
    'Nie je v dátach znamená, že OpenStreetMap tam o povrchu nič nezaznamenáva. Povrch je neznámy, nie nutne dobrý.',
  'help.guide.tour-bike-mtb-grades.step.3': 'Kliknutím na riadok stupňa zvýrazníte tieto trate na mape.',
  'help.ctx.trip-tour-ski.bullet.1':
    'Disciplína je prvá a nič nie je predvolené: Zjazd, Snowboard, Beh na lyžiach, Skialpinizmus, Snežnice alebo Zimná turistika. Beh na lyžiach vyžaduje aj Technika: Klasika, Korčuľovanie alebo Neznáma. Bez disciplíny sa túra nedá uložiť.',
  'help.guide.tour-ski-plan.step.2': 'Otvorte Typ túry a vyberte Lyže a zima.',
  'help.guide.tour-ski-plan.tip.4':
    'Tam, kde nie sú údaje o zjazdovkách, je úsek priama čiara medzi jeho bodmi. Pri snežniciach a zimnej turistike môže viesť po letných chodníkoch, čo úsek uvádza v sivej poznámke.',
  'help.guide.tour-ski-options.step.5':
    'Pod Vynechať stlačte každý druh vleku, ktorý nechcete použiť: Vleky, Otvorené sedačky, Kabínkové lanovky, Kyvadlové lanovky alebo Pozemné lanovky a vlaky. Stlačená možnosť je prečiarknutá.',
  'help.guide.tour-ski-fix-leg.step.2':
    'Kliknite na opravu, ktorú riadok ponúka: Povoliť ťažšie zjazdovky, Povoliť túto lanovku, Zísť lanovkou, Zmeniť techniku alebo Zmeniť disciplínu. Voľba sa zmení a úsek sa naplánuje znova.',
  'help.guide.tour-ski-summary.goal': 'Pozrite si, ako sa deň rozdelí na lyžovanie, vleky, čakanie a chôdzu.',
  'help.guide.tour-ski-summary.result': 'Viete, ako dlho deň trvá na zjazdovkách, na vlekoch a pri čakaní na ne.',
  'help.guide.tour-ski-pistes-layer.tip.3':
    'Vrstva obsahuje mapované údaje, nie živé hlásenie: nehovorí nič o tom, čo je otvorené alebo upravené, ani o snehu či lavínach. Prepínač je dostupný aj bez otvorenej túry, takže si lyžiarsku oblasť môžete pozrieť pred plánovaním.',
  'help.guide.tour-ski-import.step.5':
    'Kliknutím na stopu v Túry tejto cesty ju otvoríte. Ak chcete neskôr opraviť jej disciplínu, kliknite v jej karte Lyžiarska trasa na Zmeniť.',
  'help.ctx.trip-tour-paddle.bullet.1':
    'Pod Typ túry vyžaduje Vodácka túra Loď (Kajak, Kanoe, SUP alebo Ostatné) a Voda (Rieka alebo Jazero). Túru nemožno uložiť, kým nie sú vybrané obe.',
  'help.guide.tour-paddle-setup.step.1': 'V karte Túry kliknite navrchu ľavého stĺpca na Naplánovať novú túru.',
  'help.guide.tour-paddle-setup.tip.2':
    'Mapa vodáckej túry ponúka Mapa a Satelit a ako prekrytie Plavebné znaky z OpenSeaMap.',
  'help.guide.tour-paddle-water-route.step.3':
    'Vyberte Naplánovať ďalší úsek po vode. TREK naplánuje úsek pozdĺž rieky alebo jazera z tohto bodu k ďalšiemu.',
  'help.guide.tour-paddle-portage.title': 'Prenesenie lode okolo prekážky',
  'help.guide.tour-paddle-portage.tip.2':
    'Pri poslednom bode sa Odtiaľto loď preniesť uplatní, až keď nastavíte ďalší bod. Riadok potom znie Odtiaľto prenášať a jeho krížik, Nakoniec neprenášať, to vráti späť.',
  'help.guide.tour-paddle-lock.step.4':
    'Zadajte minúty pre Čakanie a Prejazd. Keď sú zadané obe, karta ukáže ich súčet.',
  'help.guide.tour-paddle-time.step.2':
    'Pruh ukazuje trasu od začiatku do konca: vodu, prenášky hnedou farbou a plavebné komory ako značky. Prekážky na trase sú značky, na ktoré môžete kliknúť a nájsť ich na mape.',
  'help.guide.tour-paddle-wind.title': 'Kontrola vetra pre vodácky deň',
  'help.guide.tour-paddle-wind.tip.3':
    'V deň s vetrom a prechodom cez jazero karta ponúka Naplánovať pozdĺž brehu, čo naplánuje trasu po jazerách popri brehu.',
  'help.guide.tour-paddle-checklist.step.4':
    'Kliknite na položku. Mapa sa k nej presunie: pri prekážke sa otvorí jej karta s vaším rozhodnutím, pri vašej vlastnej prenáške alebo plavebnej komore sa vyberie jej bod.',
  'help.guide.tour-paddle-track-marks.title': 'Označenie prenášok a plavebných komôr na zaznamenanej vodáckej stope',
  'help.guide.tour-paddle-track-marks.step.7': 'Otvorte karty, zadajte ich minúty a kliknite na Uložiť.',
  'help.ctx.trip-tour-horse.bullet.2':
    'Trasa sa otvorí vo vlastnom dialógu: vyberte úsek a Smer, ktorým ho pôjdete, skontrolujte Prístup pre kone a potom kliknite na Prevziať úsek.',
  'help.guide.tour-horse-plan.step.3':
    'V karte Jazdecké trasy kliknite na Hľadať vo výreze mapy. Zobrazí sa každá značená jazdecká trasa vo výreze s jej dĺžkou.',
  'help.guide.tour-horse-plan.tip.3':
    'Posunuli ste mapu po vyhľadávaní? Tlačidlo potom znie Prehľadať tento výrez. Ak je výrez príliš veľký, najprv vás vyzve na priblíženie.',
  'help.guide.tour-horse-gap.step.4':
    'V karte Trasové body ukazuje most Ručne, neoverené, s jeho dĺžkou. Ukážte naň a prečítate si prečo.',
  'help.guide.tour-horse-recorded.step.2':
    'Otvorí sa Náhľad importu a zatiaľ sa nič neuloží. Pod Importovať ako nastavte Typ túry na Vychádzka na koni. Tri odznaky ukazujú, čo import zachová a čo nevypočíta.',
  'help.guide.dateless-trip.goal': 'Začnite plánovať ešte predtým, než viete, kedy pocestujete.',
  'help.guide.trip-reminder.step.3': 'Kliknite na Aktualizovať.',
  'help.guide.upcoming-reservations.goal':
    'Pozrite si, čo máte rezervované ako najbližšie vo všetkých svojich cestách, a otvorte cestu, do ktorej rezervácia patrí.',
  'help.guide.log-day.tip.3':
    'Deň označený ako celé firemné voľno sa zapísať nedá. Pri polovičnom firemnom voľne stojí deň dovolenky len 0,5.',
  'help.guide.half-company-holiday.goal':
    'Dajte všetkým voľné popoludnie, napríklad na Štedrý deň, bez toho, aby ste zatvorili celý deň.',
  'help.guide.public-holidays.tip.2': 'Ak ukážete na sviatok v mriežke, zobrazí sa jeho názov.',
  'help.guide.edit-holiday-calendar.step.3':
    'Krajinu alebo región zmeníte v zoznamoch kalendára, kalendár odstránite kliknutím na kôš.',
  'help.guide.person-color.step.2': 'Vyberte farbu. Uloží sa okamžite a dialóg sa zavrie.',
  'help.guide.answer-fusion-request.goal':
    'Rozhodnite, či svoj plán dovolenky zlúčite s plánom človeka, ktorý vás pozval.',
  'help.guide.log-for-partner.goal':
    'Zapíšte voľný deň osobe prepojenej s vaším plánom, napríklad keď vás o to požiada.',
  'help.guide.dissolve-fusion.goal': 'Rozdeľte prepojený plán späť na samostatné plány.',
  'help.guide.country-places.step.1':
    'Vyhľadajte krajinu, ktorú ste navštívili, a vyberte ju. Jej karta sa zobrazí v paneli dole.',
  'help.guide.tour-activity-stats.step.3':
    'Prečítajte si čísla: vzdialenosť s počtom túr v rohu, potom Stúpanie a Klesanie. Pri Všetky typy nasledujú tri typy, ktorým ste sa venovali najviac, každý s počtom a vzdialenosťou.',
  'help.guide.move-to-list.step.1': 'V riadku s filtrami kliknite na ikonu políčka, Vybrať, a zaškrtnite miesta.',
  'help.guide.tour-collection-add-to-trip.step.2':
    'Pod Do cesty vyberte cestu. Cesta, do ktorej nesmiete pridávať túry, je stlmená.',
  'help.guide.tour-collection-manage.goal':
    'Pozrite si, ktoré túry zoznam obsahuje a odkiaľ pochádzajú, a odstráňte tie, ktoré už nepotrebujete.',
  'help.guide.entry-draft.goal': 'Napíšte záznam hneď a skryte ho v zdieľanom cestovnom denníku, kým nebude hotový.',
  'help.guide.journey-map-layers.step.2':
    'Kliknutím na (i) na konci lišty zobrazíte legendu mapy: vysvetľuje každý špendlík, bodku a čiaru.',
  'help.guide.journey-keep-route.step.2':
    'Skontrolujte Časové pásmo dňa, ktoré určuje, kde deň začína a končí, a prezrite si záznam: vzdialenosť, časový rozsah, úseky a medzery.',
  'help.guide.journey-day-stays.step.2':
    'Pri pobyte kliknite na Napísať záznam do denníka. Záznam sa pridá do toho dňa v čase príchodu, s názvom a polohou pobytu.',
  'help.guide.journey-take-over-day.step.2':
    'Zaškrtnite pobyty, ktoré chcete ponechať, a opravte ich názvy. Spojiť do jedného záznamu medzi dvoma zaškrtnutými pobytmi ich zlúči, Nechať oddelene ich znova rozdelí.',
  'help.guide.journey-auto-prepare.step.1':
    'Kliknutím na ⋯ vpravo hore v záhlaví otvoríte Nastavenia cestovného denníka.',
  'help.guide.photo-location.step.1': 'Kliknutím na ⋯ vpravo hore v záhlaví otvoríte Nastavenia cestovného denníka.',
  'help.guide.share-public.tip.3':
    'Koncepty sa na odkaze nikdy nezobrazia a zaznamenané trasy sa ukazujú len v dňoch s publikovaným záznamom.',
  'help.ctx.settings-plugins.title': 'Pluginy',
  'help.ctx.settings-about.bullet.2':
    'Nahlásiť chybu a Navrhnúť funkciu otvoria projekt na GitHube. Wiki otvorí dokumentáciu.',
  'help.guide.map-provider.tip.3':
    'Na mape GL otočíte a nakloníte mapu kliknutím pravým tlačidlom a ťahaním. Kliknutím stredným tlačidlom pridáte miesto.',
  'help.guide.web-push-device.step.1':
    'Pod Push oznámenia v tomto zariadení kliknite na Zapnúť pre toto zariadenie a keď sa prehliadač opýta, povoľte oznámenia. Odoslať test overí, že oznámenie dorazí.',
  'help.guide.connect-airtrail.title': 'Pripojenie AirTrail',
  'help.guide.connect-dawarich.title': 'Pripojenie Dawarich',
  'help.guide.tour-connect-wanderer.title': 'Pripojenie wanderer',
  'help.guide.tour-connect-wanderer.tip.3': 'Odpojiť vpravo token znova odstráni.',
  'help.guide.tour-wanderer-watch.tip.3':
    'Kanály pre tieto upozornenia si vyberiete v Oznámenia, v riadku wanderer: upozornenia k vašim trasám.',
  'help.guide.plugin-settings.tip.1': 'Tieto nastavenia sú len vaše. Ostatní členovia si plugin nastavujú sami.',
  'help.guide.offline-conflicts.step.3':
    'Zmeny, ktoré server stále odmieta, sa zobrazia pod Offline vyrovnávacia pamäť ako Neúspešné zmeny: Skúsiť znova ich odošle ešte raz, Zahodiť ponechá verziu zo servera.',
  'help.ctx.admin-notifications.bullet.4':
    'Predvolené nastavenia pre používateľov, úplne dole: pre každú udalosť a kanál Zapnuté, Vypnuté alebo Blokované pre každého, kto to nezmenil.',
  'help.guide.default-user-settings.step.2':
    'Pole, ktoré nastavíte, dostane vedľa názvu odkaz obnoviť, ktorý vráti vstavanú predvolenú hodnotu TREK.',
  'help.guide.own-routing-engine.title': 'Použitie vlastných smerovacích serverov',
  'help.guide.admin-passkeys.result':
    'Prihlasovacia stránka ponúka Prihlásiť sa pomocou prístupového kľúča a ľudia môžu pridávať prístupové kľúče vo svojich nastaveniach.',
  'help.guide.rotate-jwt-secret.goal': 'Ukončite všetky relácie po podozrení na únik.',
  'help.guide.notification-defaults.result':
    'Každý, kto bunku nezmenil, vychádza z vašej voľby a blokované bunky sa v jeho nastaveniach zobrazia ako zamknuté.',
  'help.ctx.notifications.bullet.3':
    'Každé oznámenie uvádza, kto čo urobil a kde. Neprečítané majú zafarbené pozadie. Tlačidlo pod oznámením, napríklad Zobraziť výlet alebo Zobraziť Vacay, vás tam zavedie a označí oznámenie ako prečítané.',
  'help.guide.read-notifications.tip.1':
    'Zvonček je na každej obrazovke s navigačnou lištou a jeho číslo sa aktualizuje automaticky, keď príde niečo nové.',
  'help.guide.filter-notifications.tip.1':
    'Stránka dočítava staršie oznámenia pri rolovaní nadol, takže po prvej obrazovke nič nechýba.',
  'help.guide.mark-notifications-read.result':
    'Žiadne oznámenie už nemá zafarbené pozadie a červené číslo na zvončeku zmizlo.',
  'help.guide.notification-settings.title': 'Výber toho, o čom chcete dostávať oznámenia',
  'help.guide.link-journal.step.1': 'Kliknite na Nastavenia cesty vedľa názvu cesty a vľavo vyberte Denník.',
  'help.guide.dawarich-stays.tip.1':
    'Do cesty sa nič nepridá, kým nekliknete na Pridať miesto. Miesto pridané z pobytu to uvádza vo svojich podrobnostiach: Pridané z vašich záznamov Dawarich.',
  'help.guide.leave-stop-off-route.title': 'Vynechanie zastávky z trasy',
  'help.guide.move-booking-day.step.1': 'Ukážte na riadok rezervácie v dni: úchyt vľavo naznačuje, že sa dá ťahať.',
  'help.guide.place-image-from-file.tip.1': 'Ponúkajú sa len súbory JPG, PNG, GIF a WebP, lístok v PDF nie.',
  'help.guide.place-own-hours.step.4':
    'Tlačidlá vpravo od Otváracie hodiny: tlačidlo kopírovania dá každému dňu hodiny z pondelka a X vaše hodiny opäť odstráni. Ak TREK našiel vlastné hodiny, Prevziať z podrobností miesta ich vráti späť.',
  'help.guide.confirm-stay-booking.step.2':
    'Rezervácia sa otvorí nad plánom. Prvá pilulka v jej hlavičke ukazuje jej stav.',
  'help.ctx.trip-map.bullet.9':
    'Každá túra cesty je čiara vo svojej farbe so špendlíkom tam, kde začína. Kliknutím na čiaru otvoríte kartu túry. V dni, ktorý obsahuje túru, trasa dňa vedie na miesto, kde túra začína, a pokračuje z miesta, kde končí. Oko vedľa túry v zozname Túry, Skryť na mape, odstráni jej čiaru z vašej mapy.',
  'help.guide.tour-map-lines.result':
    'Túry, ktoré chcete, sú na mape, každá vo svojej farbe, a túra, ktorú ste skryli, je v zozname Túry zobrazená stlmene.',
  'help.guide.car-stops.step.2':
    'V záhlaví kliknite na pilulku typu a vyberte Auto. Formulár sa zmení: Dátum a Čas začiatku sa zmenia na Vyzdvihnutie a Čas vyzdvihnutia, Dátum konca a Čas konca na Vrátenie a Čas vrátenia a pod Od a Do sa zobrazí Zastávky po ceste.',
  'help.guide.transport-details.goal':
    'Pozrite si všetky podrobnosti jazdy na jednom mieste, skopírujte jej rezervačný kód, premenujte ju alebo na ňu skočte na mape.',
  'help.guide.transport-details.tip.2':
    'Escape alebo kliknutie mimo podrobností ich zavrie. Ak je otvorené Premenovať alebo otázka o vymazaní, zavrie sa najprv to.',
  'help.guide.export-transports-csv.tip.1': 'Ikona je v lište len vtedy, keď karta obsahuje aspoň jednu jazdu.',
  'help.guide.group-sort-bookings.step.1':
    'V zobrazení Karty alebo Zoznam kliknite na Možnosti zobrazenia, posuvníky za tromi ikonami zobrazení.',
  'help.guide.create-booking.tip.4':
    'Offline sa rezervácia uloží v tomto zariadení a po pripojení sa synchronizuje. Nové súbory vyžadujú pripojenie, preto ich odstráňte alebo uložte neskôr. Ak omylom kliknete mimo formulára alebo stlačíte Escape, TREK sa opýta Zahodiť zmeny?, skôr než sa stratí čokoľvek, čo ste napísali.',
  'help.guide.booking-on-map.tip.2': 'Pobyt sa otvorí na svojej prvej noci.',
  'help.guide.export-bookings-csv.step.3':
    'Kliknite na Exportovať ako tabuľku (CSV), ikonu tabuľky za Možnosti zobrazenia.',
  'help.guide.arrange-packing-list.step.3':
    'A až Z úplne vpravo v riadku so Zdieľané a Môj zoznam zobrazí položky každého zoznamu podľa názvu, takže rýchlo uvidíte, či už niečo na zozname je. Ďalším kliknutím sa vrátite k vlastnému poradiu.',
  'help.guide.count-packed-pieces.step.1':
    'V riadku kliknite na odznak množstva, malé číslo s x za ním, zadajte, koľko kusov berieme so sebou, napríklad 5, a stlačte Enter.',
  'help.guide.expense-receipts.step.3':
    'Dole v dialógu kliknite na Uložiť. Súbory sa nahrajú spolu s výdavkom a zobrazia sa aj v Súborov cesty.',
  'help.guide.files-sync-settings.step.1':
    'Na pravom konci lišty kliknite na Synchronizácia dokumentov. Ak je cesta prepojená, vpravo sa otvorí karta vášho úložiska. Ak máte viac úložísk, vľavo pod Táto cesta kliknite na to, ktoré chcete.',
  'help.guide.files-sync-settings.tip.3':
    'Okamžité aktualizácie, odkaz s tlačidlom Kopírovať vedľa neho, sa zobrazujú len pri úložiskách, v ktorých sa TREK nevie automaticky prihlásiť na odber zmien. Vložte odkaz do úložiska a zmeny prídu hneď, nie až pri ďalšej kontrole.',
  'help.guide.manage-notes.step.1':
    'V záhlaví karty poznámky kliknite na tri bodky (Ďalšie možnosti). Ponuka obsahuje Rozbaliť, Pripnúť, Upraviť a Vymazať.',
  'help.guide.note-categories.title': 'Triedenie poznámok do kategórií',
  'help.guide.note-categories.result':
    'Poznámky zobrazujú nové názvy a farby a karta Poznámky ukazuje len vybranú kategóriu.',
  'help.guide.roadtrip-stops.tip.5':
    'Zastávka s časom konca v pláne dňa trvá do tohto času. Jej dialóg uvádza, kedy jazda pokračuje, a Odstrániť čas konca vám umožní dĺžku znova nastaviť samostatne.',
  'help.guide.roadtrip-reorder.tip.2':
    'Rezervované jazdy a ich terminály zostanú tam, kam ich zaradí rezervácia. Ťahať sa dajú len miesta.',
  'help.guide.roadtrip-overnight.step.2':
    'Pri hoteli je namiesto plusu ikona postele. Kliknite na ňu, Pridať ako nocľah, a otvorí sa Pridať ako zastávku pre noc. Kemp má obvyklé Pridať.',
  'help.guide.roadtrip-stop-fill.goal':
    'Nastavte jednej zastávke s tankovaním alebo nabíjaním vlastnú úroveň naplnenia, napríklad 80 % pri rýchlonabíjačke alebo 100 % cez noc.',
  'help.guide.roadtrip-bookings.goal':
    'Pozrite si, kam sa rezervovaná jazda hodí do vašej jazdy a kedy tam musíte byť.',
  'help.guide.roadtrip-bookings.tip.3':
    'Jazda, ktorá nepripadá na žiadny deň cesty, nie je súčasťou jazdy: poznámka navrchu lišty ju uvádza, s tlačidlom Otvoriť rezerváciu, kde jej môžete určiť dátum.',
  'help.guide.roadtrip-google-import.step.4':
    'Pod Deň vyberte deň, do ktorého zastávky patria, a kliknite na Importovať.',
  'help.guide.roadtrip-hazards.step.2':
    'Pod Aktuálne výstrahy, dole v pravom stĺpci dialógu, zapnite Zobraziť nebezpečné oblasti a potom kliknite na Zavrieť.',
  'help.ctx.trip-tours.bullet.1':
    'Prepínač Miest a Túry navrchu pravého stĺpca vymení zoznam miest za túry. Zobrazuje sa len vtedy, keď je zapnutý doplnok Túry, a túry sa potom v zozname Miest nikdy nezobrazujú.',
  'help.guide.tour-show-list.step.1':
    'V karte Plán kliknite v prepínači navrchu pravého stĺpca na Túry. Stĺpec teraz namiesto miest uvádza túry.',
  'help.guide.tour-show-list.result':
    'Pravý stĺpec uvádza túry cesty a tá, na ktorú ste klikli, je otvorená vo svojej karte.',
  'help.guide.tour-add-to-day.tip.1':
    'Ak túru s etapami potiahnete na deň, malý dialóg sa opýta na to isté. Zrušiť nechá plán tak, ako bol.',
  'help.guide.tour-day-times.step.2':
    'Nastavte Začiatok a Do nechajte prázdne. Riadok pod poľami uvádza koniec, ktorý TREK vypočíta: začiatok plus čas túry.',
  'help.guide.tour-remove-from-day.title': 'Odobratie túry z dňa',
  'help.guide.tour-filter-list.title': 'Filtrovanie zoznamu túr',
  'help.guide.tour-filter-list.tip.3':
    'Ak nič nezostane, zoznam ukáže „No tour matches these filters“ a Zrušiť filtre ich všetky vymaže. Filtre menia len to, čo zoznam zobrazuje, nikdy samotnú túru ani deň.',
  'help.guide.tour-hide-on-map.tip.2':
    'Mapa v telefóne vždy ukazuje všetky túry a karta Túry oko nemá: skrývanie funguje tu, v karte Plán.',
  'help.guide.tour-import-plan-tab.tip.2':
    'Import tu zostane v zozname a v plánovači sa neotvorí. Zaraďte ho na deň okrúhlym + alebo si ho pozrite v karte Túry.',
  'help.ctx.trip-tour-detail.bullet.5':
    'Karta slúži na čítanie a na to, čo k túre patrí. Samotná trasa sa mení v karte Túry: otvorte ju a kliknite na túru pod Túry tejto cesty. Aj mazanie túry sa robí tam, nie tu.',
  'help.guide.tour-detail-read.step.6':
    'Posuňte sa na Popis a Poznámky, potom na Pôvod: naplánované v TREK, súbor, z ktorého túra pochádza, alebo trasa z wanderer, spolu s dátumom.',
  'help.guide.tour-rename-colour.title': 'Premenovanie túry a zmena jej farby',
  'help.guide.tour-rename-colour.result':
    'Túra sa v celej ceste zobrazuje pod novým názvom a jej čiara je nakreslená vybranou farbou.',
  'help.guide.tour-take-along.tip.3':
    'Súbor sa preberá zo servera, takže potrebuje pripojenie. Túru vytvorenú offline môžete stiahnuť, keď sa synchronizuje.',
  'help.guide.tour-copy-keep.step.4': 'Pod Zbierka vyberte zoznam, skontrolujte Názov v zbierke a kliknite na Uložiť.',
  'help.guide.tour-packing-link.step.1':
    'Otvorte kartu túry a prejdite na Zoznam vecí. Kliknite na Prepojiť zoznam vecí.',
  'help.guide.tour-packing-link.result':
    'Ste na zozname vecí v karte Zoznamy a karta túry zobrazuje každú položku, ktorú zaškrtnete.',
  'help.guide.tour-files.result': 'Súbory sú priložené k túre a otvoríte ich z jej karty.',
  'help.guide.tour-activity-link.tip.1':
    'Plán zostane taký, aký je. Stopa sa len prepojí a Odpojiť prepojenie znova zruší.',
  'help.guide.tour-activity-compare.step.3':
    'Kliknutím na Porovnať na mape sa skutočná stopa nakreslí bodkovane vedľa plánu. Ukončiť porovnanie ju znova odstráni.',
  'help.guide.tour-origin-check.step.2':
    'Importované uvádza deň importu. Tu uvádza aktuálny stav: Ako bolo importované, Upravené v TREK alebo Preplánované, zaznamenaná stopa zachovaná.',
  'help.ctx.trip-tour-planner.bullet.1':
    'Túry sú v lište kariet cesty hneď za Plán, kým je zapnutý doplnok Túry. Karta je dostupná na počítači a tablete. V telefóne sa túry zobrazujú a zaraďujú do dní z karty Plán, ale nekreslia sa.',
  'help.guide.tour-open-workspace.step.1':
    'V lište kariet cesty kliknite na Túry, hneď za Plán. Mapa vyplní obrazovku a na oboch stranách je panel.',
  'help.guide.tour-open-workspace.tip.2':
    'Súbory GPX, KML alebo KMZ pustite kamkoľvek na túto kartu a importujú sa ako túry cesty.',
  'help.guide.tour-draw-route.step.4':
    'Dole na mape sa zobrazí Bod pridaný. Vrátiť späť vedľa neho bod znova odstráni.',
  'help.guide.tour-type-profile.title': 'Výber typu túry',
  'help.guide.tour-type-profile.result': 'Trasa túry sa naplánuje podľa vybraného typu a profilu.',
  'help.guide.tour-edit-points.step.6':
    'Vrátiť úpravu bodu trasy a Zopakovať úpravu bodu trasy v záhlaví panela vracajú alebo opakujú zmeny jednu po druhej.',
  'help.guide.tour-shaping-points.step.3':
    'Pod Trasové body je uvedený s odznakom Tvarovací bod a bez čísla, takže zastávky si ponechajú svoje čísla.',
  'help.guide.tour-loop-reverse.step.1':
    'V záhlaví karty Trasové body kliknite na Späť na štart. Túra dostane posledný úsek späť k prvému bodu.',
  'help.guide.tour-leg-by-hand.goal':
    'Spojte dva body priamou čiarou tam, kde smerovač nenájde cestu, alebo naplánujte úsek znova.',
  'help.guide.tour-trip-places.title': 'Použitie miesta cesty ako zastávky',
  'help.guide.tour-trip-places.tip.3': 'Ostatné túry cesty sa ako zastávka nikdy nenavrhujú.',
  'help.guide.tour-details-times.tip.1': 'Časy môžete zadať ako 2:56, 2 h 56 alebo 176 minút.',
  'help.guide.tour-save.step.3':
    'Dole v ľavom paneli kliknite na Uložiť. Zobrazí sa Túra uložená a názov panela sa zmení na Upraviť túru.',
  'help.guide.tour-edit-saved.step.1':
    'Kliknite na túru pod Túry tejto cesty. V ľavom paneli sa otvorí ako Upraviť túru a mapa ukáže jej trasu.',
  'help.guide.tour-summary-profile.title': 'Čítanie prehľadu túry a výškového profilu',
  'help.guide.tour-summary-profile.tip.3':
    'Vodácka túra výšky neukazuje, pretože na vode by boli k dispozícii len výšky brehov.',
  'help.guide.tour-list-manage.step.5':
    'Vyberte Nezaradené pre túry, ktoré ešte nie sú v žiadnom dni, alebo zúžte výber podľa Zdroj, Limit trasy alebo Typ. Každý riadok uvádza, koľko túr mu zodpovedá, a súčty sledujú filter.',
  'help.guide.tour-delete.step.2':
    'Prečítajte si, čo sa s ňou vymaže: trasa, upraviteľné trasové body a zaradenia do dní. Kliknite na Zmazať natrvalo.',
  'help.guide.tour-saved-elsewhere.step.2': 'Načítať novšiu nahradí vaše zmeny novšou verziou, po potvrdení.',
  'help.ctx.trip-tour-import.bullet.1':
    'Tlačidlo + navrchu Túry tejto cesty je Pridať túru. Ponúka Importovať GPX alebo KML, Importovať prechádzku z Google Maps a Prevziať túru z inej cesty. Súbory môžete pustiť aj kamkoľvek na kartu Túry.',
  'help.guide.tour-import-gpx.step.2':
    'Vyberte Importovať GPX alebo KML a zvoľte jeden alebo viac súborov .gpx, .kml alebo .kmz, každý najviac do 10 MB.',
  'help.guide.tour-import-gpx.tip.5':
    'Súbor bez výšok ukazuje V súbore nie sú výšky. Čiara a vzdialenosť sú stále správne, ale stúpanie a klesanie zostanú neznáme.',
  'help.guide.tour-view-import.tip.2':
    'Ikona sťahovania v záhlaví import znova uloží ako súbor GPX a záložka ho uloží do zbierky.',
  'help.guide.tour-plan-from-import.step.4':
    'Túra sa otvorí v editore aj s trasovými bodmi. Podľa potreby ju upravte a potom dole v stĺpci kliknite na Uložiť.',
  'help.guide.tour-restore-recorded.step.1':
    'V Túry tejto cesty kliknite na túru, ktorú ste naplánovali znova. Karta Zaznamenaná stopa v editore uvádza, že pôvodne zaznamenaná stopa je zachovaná.',
  'help.guide.tour-take-over.step.1':
    'Otvorte kartu Túry cesty, do ktorej má túra patriť. Navrchu Túry tejto cesty kliknite na + (Pridať túru).',
  'help.guide.tour-take-over.tip.3':
    'Prevzatie túry potrebuje pripojenie. Ak sú v editore neuložené zmeny, kópia sa do zoznamu aj tak pridá, ale neotvorí sa, aby vaša práca zostala otvorená.',
  'help.guide.tour-import-wanderer.tip.1':
    'Tlačidlo sa zobrazí, keď je wanderer pripojený v Nastavenia, Integrácie. Dovtedy zoznam ponúka Pripojiť v nastaveniach.',
  'help.ctx.trip-tour-map.bullet.2':
    'Za oddeľovačom v pilulke nasledujú prepínače podľa typu túry: Pridávať body pri úprave túry, Ferraty pri pešej túre, Plavebné znaky pri vodáckej túre a zjazdovky pri lyžiarskej túre. 3D na konci zobrazí túru v trojrozmernej krajine.',
  'help.guide.tour-map-layers.step.3':
    'Pri pešej túre kliknite na Turistika pre značené chodníky a ich čísla. Pri cyklotúre sa namiesto toho ponúka Bicykel pre cyklotrasy. Satelit zobrazí letecké snímky a Mapa vás vráti na štandardnú mapu.',
  'help.guide.tour-along-search.step.2':
    'Kliknite na Čo hľadať a zaškrtnite druhy, ktoré chcete, najviac šesť naraz: Vyhliadky, Vrcholy, Chaty a prístrešky, Pitná voda, Jedlo a ďalšie. Zoznam ponúka to, čo sa hodí k typu túry, a pri novej túre sú zaškrtnuté tri z nich.',
  'help.guide.tour-along-add-stop.title': 'Pridanie miesta pozdĺž túry ako zastávky',
  'help.guide.tour-along-add-stop.tip.2':
    'Miesto, ktoré sa stane novým koncom, je označené Predĺži túru: dovtedajší koniec už nie je koncom a túra pokračuje k tomuto miestu.',
  'help.guide.tour-3d-terrain.step.5':
    'Opätovným kliknutím na 3D sa vrátite na plochú mapu a môžete pokračovať v plánovaní.',
  'help.guide.tour-3d-flyover.step.2':
    'Pod Rýchlosť vyberte 1×, 2× alebo 4×. Pri 1× trvá väčšina túr od začiatku do konca asi 45 sekúnd.',
  'help.guide.tour-map-overlays.goal':
    'Zobrazte na mape lyžiarske zjazdovky a vleky, alebo bóje a prístavné značky, kým plánujete lyžiarsku alebo vodácku túru.',
  'help.guide.tour-map-overlays.tip.3':
    'Keď sa vrstva prestane načítavať, jej prepínač zobrazí ! a vysvetlenie. Mapa a vaša trasa fungujú aj bez nej.',
  'help.guide.tour-multi-day.title': 'Plánovanie túry na viac dní',
  'help.guide.tour-multi-day.tip.1':
    'Ukončiť etapu tu funguje aj pri jednodňovej túre: túra sa potom automaticky zmení na viacdňovú. Prvá a posledná zastávka a tvarovací bod etapu ukončiť nemôžu.',
  'help.guide.tour-stages-on-days.step.2': 'Vyberte deň, v ktorom začnete prvú etapu.',
  'help.guide.tour-stages-on-days.tip.4':
    'V pláne dňa sa každá etapa zobrazí ako „Stage N“ s vlastnou vzdialenosťou a časom. Vrátiť späť nad dňami v karte Plán vráti celé rozloženie jedným krokom.',
  'help.ctx.trip-tour-hike.bullet.5':
    'Pri pešej túre zobrazí Ferraty v rade tlačidiel mapy vľavo dole ferraty v okolí. Karta ferraty ju pridá k trase ako samostatný úsek.',
  'help.guide.tour-hike-plan.step.5':
    'Pod Podrobnosti otvorte Maximálna náročnosť chodníka a vyberte, ako náročné môžu chodníky byť, od T1 (Turistika) po T6 (Veľmi náročná vysokohorská turistika). Trasa sa v tomto rámci naplánuje znova.',
  'help.guide.tour-hike-trail-details.goal':
    'Pozrite si, čo OpenStreetMap eviduje o cestách pod pešou túrou, a nájdite tieto úseky na mape.',
  'help.guide.tour-hike-trail-details.tip.2':
    'Stupeň vyšší, než je limit pešej túry, má vo svojom riadku odznak Nad limitom.',
  'help.guide.tour-hike-round.step.5':
    'Kliknite na Vziať tento okruh a potom na Nahradiť, keď sa TREK opýta, či má nahradiť naplánovanú trasu.',
  'help.guide.tour-hike-compare-ways.step.2':
    'Iné cesty pre tento úsek sa otvoria nad mapou s Aktuálna cesta a Cesta A, Cesta B a tak ďalej. Každá je na mape nakreslená svojou farbou a ak ukážete na riadok, jeho čiara sa zvýrazní.',
  'help.guide.tour-ferrata-add.goal': 'Nájdite ferraty v okolí svojej pešej túry a jednu z nich zaraďte do trasy.',
  'help.guide.tour-ferrata-add.tip.2':
    'Ferraty sa ponúkajú len pri pešej túre. Ferrata, po ktorej trasa už stúpa, má na karte Súčasť túry namiesto Pridať do túry.',
  'help.guide.tour-run-plan.step.4':
    'Štart a cieľ nastavte na mape, alebo ich vyberte cez Miesta cesty. Pod tempom vidíte čas behu: vzdialenosť krát tempo.',
  'help.guide.tour-run-ways.goal':
    'Zistite, aká časť behu vedie po nespevnenom povrchu a aké náročné sú jeho chodníky.',
  'help.ctx.trip-tour-walk.summary':
    'Túra pešo zo zastávky na zastávku, naplánovaná v karte Túry: ako dlho pri každej zastávke zostanete, ktoré sú dôležité, pamiatky po ceste a kedy sa k jednotlivým zastávkam v deň prechádzky dostanete, s kontrolou voči otváracím hodinám.',
  'help.guide.tour-walk-plan.step.1':
    'Navrchu ľavého stĺpca kliknite na Naplánovať novú túru, potom otvorte Typ túry a vyberte Prechádzka mestom / po pamiatkach.',
  'help.guide.tour-walk-plan.tip.3':
    'Odpojiť od miesta v Ďalšie akcie pri zastávke zruší len prepojenie s miestom cesty. Samotné miesto zostane v ceste.',
  'help.guide.tour-walk-sights.step.5':
    'Kliknite na Pridať ako zastávku. Oznámenie uvedie, o koľko sa prechádzka predĺži, a vedľa neho je Vrátiť späť.',
  'help.guide.tour-walk-day-times.step.2':
    'Nastavte jej v tom dni čas začiatku: v karte Plán kliknite na prechádzku v dni pravým tlačidlom, vyberte Upraviť a zadajte Začiatok.',
  'help.guide.tour-walk-google-import.title': 'Premena pešej trasy z Google Maps na prechádzku mestom',
  'help.guide.tour-walk-google-import.tip.3':
    'Prevezmú sa len zastávky, nie čiara nakreslená v Google Maps. Krátky odkaz maps.app.goo.gl potrebuje na otvorenie pripojenie.',
  'help.guide.tour-walk-check-off.tip.1':
    'Označenia sa ukladajú pre každý deň zvlášť: otvorte prechádzku z jej dňa v pláne, nie zo zoznamu túr.',
  'help.ctx.trip-tour-bike.bullet.3':
    'Karta Povrch a cesty pod Trasové body ukazuje, po čom trasa vedie: povrchy, druhy ciest a podiel, o ktorom je známe, že je nespevnený. Kliknutím na riadok zvýrazníte jeho úseky na mape.',
  'help.guide.tour-bike-profile.step.5':
    'Prečítajte si Čas jazdy (odhad) v Prehľad túry vpravo. Ak ukážete na informačnú bodku vedľa neho, zobrazí sa, ako sa počíta.',
  'help.guide.tour-bike-surfaces.title': 'Zobrazenie povrchov cyklotúry',
  'help.guide.tour-bike-surfaces.tip.2':
    'Pri profile Cestný upozornenie nad stĺpcami uvádza, ako dlhý úsek je známy ako nespevnený. Zobraziť na mape tieto úseky označí.',
  'help.guide.tour-bike-mtb-grades.result':
    'Mapa označí chodníky vybraného stupňa a viete, ktoré úseky túry sú náročné.',
  'help.ctx.trip-tour-ski.bullet.2':
    'Pod disciplínou sú voľby smerovača zjazdoviek, len tie, ktoré vaša disciplína používa: Najťažšie zjazdovky, Uprednostniť, Tempo, prepínače ako Jazdiť lanovkami a Vynechať pre druhy vlekov, ktoré nechcete použiť. Každá zmena túru naplánuje znova.',
  'help.guide.tour-ski-plan.step.3':
    'Pod Disciplína vyberte, čomu sa budete venovať: Zjazd, Snowboard, Beh na lyžiach, Skialpinizmus, Snežnice alebo Zimná turistika. Nič nie je predvolené a bez výberu sa túra nedá uložiť.',
  'help.guide.tour-ski-plan.result':
    'Uložená túra Lyže a zima v Túry tejto cesty, jej úseky po zmapovaných zjazdovkách, vlekoch a tratiach a jej čas vypočítaný v Prehľad túry.',
  'help.guide.tour-ski-options.tip.1': 'Každá zmena naplánuje túru znova, úsek po úseku.',
  'help.guide.tour-ski-fix-leg.step.3':
    'Ak vám žiadna oprava nevyhovuje, kliknite na Nakresliť rovno. Úsek sa zmení na priamu čiaru medzi svojimi dvoma bodmi.',
  'help.guide.tour-ski-summary.step.1':
    'Pod trasovými bodmi nájdite kartu Trasa po zjazdovkách. Kliknutím na jej názov ju zbalíte alebo znova otvoríte.',
  'help.guide.tour-ski-pistes-layer.title': 'Zobrazenie zjazdoviek na mape',
  'help.guide.tour-ski-pistes-layer.result': 'Zjazdovky sú nakreslené pod túrou a môžete si prečítať ich farby.',
  'help.guide.tour-ski-import.step.6':
    'V Zaradiť lyžiarsku trasu vyberte správnu disciplínu alebo techniku a kliknite na Uložiť.',
  'help.ctx.trip-tour-paddle.bullet.2':
    'Každý bod ukazuje svoju úlohu ako odznak: Nástup, Výstup, Opätovný nástup alebo Konečný výstup. Pod bodom vidíte, čo po ňom nasleduje: ručne nakreslený úsek, prenášku, plavebnú komoru, alebo dôvod, prečo sa úsek nedal naplánovať.',
  'help.guide.tour-paddle-setup.step.2':
    'Otvorte Typ túry a vyberte Vodácka túra, Na vode, na kajaku, kanoe alebo SUP.',
  'help.guide.tour-paddle-setup.tip.3':
    'Pozdĺž túry pri vodáckej túre hľadá najprv Nástupné miesta, Požičovňa lodí a Pitná voda.',
  'help.guide.tour-paddle-water-route.step.4':
    'Úsek, ktorý TREK nedokázal naplánovať, zčervenie a uvedie dôvod, napríklad že pre danú oblasť zatiaľ nie sú dáta o vode. Kliknutím na Nakresliť rovno ho zatiaľ nakreslíte ručne.',
  'help.guide.tour-paddle-portage.goal':
    'Označte úsek, na ktorom loď prenášate, aby sa počítal ako súš, s časom na vystúpenie z lode a opätovný nástup.',
  'help.guide.tour-paddle-portage.tip.3':
    'Prenášanie sa počíta rýchlosťou 2 km/h, kým v karte Odhad času nenastavíte vlastnú Rýchlosť prenášania.',
  'help.guide.tour-paddle-lock.tip.1':
    'TREK nepozná žiadne prevádzkové hodiny plavebných komôr. Časy sú len to, čo zadáte, preto si otváracie hodiny plavebnej komory skontrolujte sami.',
  'help.guide.tour-paddle-time.step.3':
    'Riadok Voda je vzdialenosť na vode pri vašej rýchlosti pádlovania. Rýchlosť zmeníte v poli Rýchlosť pádlovania navrchu stĺpca.',
  'help.guide.tour-paddle-wind.goal': 'Pozrite si predpovedaný vietor na začiatku túry v deň, keď ju pôjdete.',
  'help.guide.tour-paddle-wind.tip.4':
    'Chýbajúca hodnota predpovede neznamená, že je to bezpečné. Podmienky skontrolujte na mieste.',
  'help.guide.tour-paddle-checklist.step.5':
    'Dole v stĺpci kliknite na Pádlovanie má riziká a pred vyplávaním si prečítajte Bezpečnosť na vode.',
  'help.guide.tour-paddle-track-marks.goal':
    'Importujte vodácku stopu z hodiniek a pridajte miesta, kde ste loď niesli a kde ste prechádzali plavebnou komorou.',
  'help.guide.tour-paddle-track-marks.tip.1':
    'Kliknite presne na stopu: kliknutie príliš ďaleko od čiary sa odmietne a karta to oznámi.',
  'help.ctx.trip-tour-horse.bullet.3':
    'Každý úsek je odznak v karte Trasové body s názvom trasy, bodkou prístupu a dĺžkou. Úsek, ktorý nepokrýva žiadna jazdecká trasa, má označenie Ručne, neoverené.',
  'help.guide.tour-horse-plan.step.4': 'Kliknite na trasu v zozname. Otvorí sa na vlastnej mape s očíslovanými úsekmi.',
  'help.guide.tour-horse-plan.tip.4': 'Vrátiť úpravu bodu trasy v záhlaví ľavého stĺpca vráti celý úsek jedným krokom.',
  'help.guide.tour-horse-gap.result': 'Vychádzka už nemá medzeru a preklenutý úsek je označený ako nakreslený ručne.',
  'help.guide.tour-horse-recorded.step.3': 'Kliknite na Importovať 1 túru.',
  'help.guide.dissolve-fusion.step.3': 'V okne, ktoré sa zobrazí, potvrďte tlačidlom Oddeliť.',
};

export default help;
