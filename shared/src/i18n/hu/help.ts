import type { TranslationStrings } from '../types';

// English fallback until 'hu' is translated.
const help: TranslationStrings = {
  'help.title': 'Súgó és dokumentáció',
  'help.search': 'Keresés a súgóban…',
  'help.contents': 'Tartalom',
  'help.noResults': 'Nincs találat.',
  'help.errorTitle': 'Az oldal nem tölthető be',
  'help.errorBody': 'A súgó tartalmát a TREK wikiből töltjük be. Ellenőrizd a kapcsolatot, és próbáld újra.',

  // center
  'help.center.button': 'Súgó ehhez a képernyőhöz',
  'help.center.title': 'Súgó',
  'help.center.onThisScreen': 'Ezen a képernyőn',
  'help.center.screens': 'Képernyők',
  'help.center.thisScreen': 'Jelenlegi',
  'help.center.subScreens': '{count} alképernyő',
  'help.center.subScreens.one': '{count} alképernyő',
  'help.center.subScreensLabel': 'Alképernyők',
  'help.center.guidesCount': '{count} útmutató',
  'help.center.guidesCount.one': '{count} útmutató',
  'help.center.goToScreen': 'Ugrás ide: {screen}',
  'help.center.overview': 'Áttekintés',
  'help.center.howTo': 'Hogyan tudom…',
  'help.center.searchPlaceholder': 'Keresés az útmutatókban és a súgóban…',
  'help.center.searchEmpty': 'Nincs találat erre: „{query}”.',
  'help.center.searchGuides': 'Útmutatók',
  'help.center.searchDocs': 'Dokumentáció',
  'help.center.searchError': 'A keresés jelenleg nem érhető el.',
  'help.center.back': 'Vissza',
  'help.center.close': 'Súgó bezárása',
  'help.center.steps': '{count} lépés',
  'help.center.steps.one': '{count} lépés',
  'help.center.step': '{n}. lépés',
  'help.center.stepsLabel': 'Lépések',
  'help.center.stepOf': '{n}/{total}. lépés',
  'help.center.screenshot': 'Képernyőkép',
  'help.center.result': 'Az eredmény',
  'help.center.tips': 'Jó tudni',
  'help.center.related': 'Kapcsolódó',
  'help.center.openDocs': 'Megnyitás a Súgóban',
  'help.center.docsSection': 'A dokumentációban',
  'help.center.noContext': 'Ehhez a képernyőhöz még nincs útmutató.',
  'help.center.noContextHint': 'Keress a dokumentációban, vagy írd meg nekünk, mit kerestél.',
  'help.center.feedback': 'Hiányzik valami?',
  'help.center.feedbackLink': 'Írd meg nekünk a GitHubon',
  'help.center.discord': 'Kérdezz a Discordon',
  'help.center.quick': 'Gyors',
  'help.center.guide': 'Útmutató',
  'help.center.tour': 'Bemutató',
  'help.center.imageAlt': '„{title}”, {n}. lépés',

  // ctx
  'help.ctx.dashboard.title': 'Irányítópult',
  'help.ctx.dashboard.summary':
    'Az irányítópulton az összes utazásodat látod. A felső, beszállókártya stílusú kártya a most zajló vagy a következő utazást mutatja. Az alatta lévő sor összesíti, mennyit utaztál eddig, a kártyák pedig minden tervezett, archivált és már befejezett utazásodat felsorolják.',
  'help.ctx.dashboard.bullet.1':
    'Beszállókártya: a folyamatban lévő vagy a következő utazás a dátumokkal, az útitársakkal, a helyekkel és egy visszaszámlálóval. Kattints rá, és megnyílik az utazás. A jobb felső sarok négy gombjával szerkesztheted, duplikálhatod, archiválhatod vagy törölheted.',
  'help.ctx.dashboard.bullet.2':
    'Utazási statisztika: meglátogatott országok, utazások, úton töltött napok és repült távolság, az összes utazásod alapján.',
  'help.ctx.dashboard.bullet.3':
    'Utazáskártyák „Tervezett”, „Archivált” és „Befejezett” szűréssel, rácsos vagy listás nézetben. A fölöttük lévő keresőmező egyszerre keres az összes utazásodban, cím, dátum vagy az utazás egyik helye alapján. Az utazás szerkesztésére, duplikálására, archiválására és törlésére szolgáló gombok minden kártya fotójának jobb felső sarkában vannak.',
  'help.ctx.dashboard.bullet.4':
    'Widgetek a jobb oldalon: pénznemváltó, „Gyűjtemények” (ha a Gyűjtemények bővítmény be van kapcsolva), világórák, közelgő foglalások és a pluginek widgetjei. A beépített widgeteket a Beállítások, Megjelenés menüpontban kapcsolhatod ki.',
  'help.ctx.dashboard.bullet.5':
    'Az „Új utazás” kártyával és a jobb alsó sarokban lévő gombbal is új utazást indíthatsz.',

  // create-trip
  'help.guide.create-trip.title': 'Utazás létrehozása',
  'help.guide.create-trip.goal': 'Új utazás létrehozása névvel, dátumokkal és borítóképpel.',
  'help.guide.create-trip.step.1':
    'Kattints az „Új utazás” gombra. Az utazásaid végén lévő kártya és a jobb alsó sarokban lévő gomb ugyanezt teszi.',
  'help.guide.create-trip.step.2':
    'Adj nevet az utazásnak. Csak ezt a mezőt kötelező kitölteni, minden mást később is megadhatsz.',
  'help.guide.create-trip.step.3':
    'Válassz kezdő és záró dátumot. A TREK minden dátumhoz létrehoz egy napot, így máris elkezdheted az útiterv összeállítását. Még nincsenek dátumaid? Hagyd mindkettőt üresen, és helyette add meg a „Napok száma” értékét.',
  'help.guide.create-trip.step.4':
    'Ha szeretnéd, adj hozzá borítófotót: tölts fel sajátot, húzd be vagy illeszd be, vagy keress képet az úti célhoz az Unsplashen.',
  'help.guide.create-trip.step.5': 'Kattints az „Új utazás létrehozása” gombra.',
  'help.guide.create-trip.result':
    'Az utazás megjelenik az irányítópulton. Ha ez a következő utazásod, a felső beszállókártyán látszik.',
  'help.guide.create-trip.tip.1':
    'A dátumok később is módosíthatók. Ha már vannak foglalások, a TREK megkérdezi, hogy a napokkal együtt azokat is áthelyezze-e.',
  'help.guide.create-trip.tip.2':
    'Az itt megadott pénznemre váltódik át az utazás összes költsége. Válaszd az úti cél pénznemét.',

  // edit-trip
  'help.guide.edit-trip.title': 'Utazás szerkesztése',
  'help.guide.edit-trip.goal': 'Nevezz át egy utazást, módosítsd a dátumait vagy a beállításait.',
  'help.guide.edit-trip.step.1': 'Kattints az utazáskártya (vagy a beszállókártya) jobb felső sarkában lévő ceruzára.',
  'help.guide.edit-trip.step.2':
    'Módosítsd, amit kell: nevet, leírást, dátumokat, borítót, pénznemet, emlékeztetőt vagy útitársakat.',
  'help.guide.edit-trip.step.3': 'Kattints a „Frissítés” gombra.',
  'help.guide.edit-trip.result': 'A kártya azonnal frissül az utazás minden tagjánál.',
  'help.guide.edit-trip.tip.1':
    'Ha egy foglalásokkal rendelkező utazás kezdetét áthelyezed, a TREK megkérdezi, hogy a foglalások is kerüljenek-e át. Ha lerövidíted az utazást, felsorolja a kieső napokat és az azokra tervezett programokat. A mentés csak a „Napok eltávolítása és mentés” gombra kattintva történik meg.',

  // cover-image
  'help.guide.cover-image.title': 'Borítókép beállítása',
  'help.guide.cover-image.goal': 'Adj az utazásnak egy képet, amely a kártyáján és a beszállókártyán is megjelenik.',
  'help.guide.cover-image.step.1': 'A kártyán lévő ceruzával nyisd meg az utazás szerkesztőűrlapját.',
  'help.guide.cover-image.step.2':
    'A „Borítókép” részben húzz be vagy illessz be egy fotót, kattints a feltöltéshez, vagy írj be egy úti célt, és kattints a „Keresés az Unsplashen” gombra.',
  'help.guide.cover-image.step.3': 'Válassz egy fotót, és kattints a „Frissítés” gombra.',
  'help.guide.cover-image.result': 'A fotót az utazáshoz mentjük, és mindenhol megjelenik, ahol az utazás szerepel.',
  'help.guide.cover-image.tip.1':
    'Az Unsplash-keresésből származó fotóknál a TREK automatikusan feltünteti a szerzőt; a saját feltöltéseid a szervereden maradnak.',

  // duplicate-trip
  'help.guide.duplicate-trip.title': 'Utazás duplikálása',
  'help.guide.duplicate-trip.goal': 'Használj egy meglévő utazást sablonként egy újhoz.',
  'help.guide.duplicate-trip.step.1': 'Kattints a kártya jobb felső sarkában lévő duplikálás ikonra.',
  'help.guide.duplicate-trip.step.2':
    'Olvasd el, mi kerül át a másolatba és mi nem, majd kattints az „Utazás másolása” gombra.',
  'help.guide.duplicate-trip.result':
    'Az irányítópulton megjelenik egy másolat az eredeti nevével, utána a (másolat) jelöléssel. Átnevezheted, és módosíthatod a dátumait.',
  'help.guide.duplicate-trip.tip.1':
    'A másolatba bekerülnek a napok, a helyek, a túrák és az autós útvonalak, a foglalások, a költségvetési tételek, a csomagolási listák, a teendők és a napi jegyzetek; a csomagolási listák és a teendők kipipálás nélkül. A tagok, a csevegés, a szavazások, a fájlok és a megosztási linkek nem kerülnek át.',

  // archive-trip
  'help.guide.archive-trip.title': 'Utazás archiválása és visszaállítása',
  'help.guide.archive-trip.goal': 'Vedd ki az utazást az utazáslistádból törlés nélkül, és később állítsd vissza.',
  'help.guide.archive-trip.step.1': 'Kattints a kártya jobb felső sarkában lévő archiválás ikonra.',
  'help.guide.archive-trip.step.2': 'Ha újra látni szeretnéd, állítsd a kártyák fölötti szűrőt „Archivált” állásba.',
  'help.guide.archive-trip.step.3':
    'Kattints a kártyán a „Visszaállítás” gombra: az utazás visszakerül a „Tervezett” csoportba, vagy a „Befejezett” csoportba, ha a dátumai már elmúltak.',
  'help.guide.archive-trip.result':
    'Az archivált utazások minden adata megmarad. Az irányítópulton és az összes utazást tartalmazó naptárfeedben viszont már nem jelennek meg.',

  // delete-trip
  'help.guide.delete-trip.title': 'Utazás törlése',
  'help.guide.delete-trip.goal': 'Töröld véglegesen az utazást.',
  'help.guide.delete-trip.step.1': 'Kattints a kártya jobb felső sarkában lévő kuka ikonra.',
  'help.guide.delete-trip.step.2':
    'Erősítsd meg a „Törlés” gombbal. Az ablak megnevezi az utazást, így biztos lehetsz benne, hogy a megfelelőt törlöd.',
  'help.guide.delete-trip.result':
    'Az utazás a napjaival, helyeivel, foglalásaival és fájljaival együtt törlődik. Ez nem vonható vissza, ezért ha bizonytalan vagy, inkább archiváld az utazást.',

  // filter-and-view
  'help.guide.filter-and-view.title': 'Befejezett utazások keresése, váltás rács- és listanézet között',
  'help.guide.filter-and-view.goal':
    'Nézd meg a befejezett vagy archivált utazásokat, és válaszd ki a neked tetsző elrendezést.',
  'help.guide.filter-and-view.step.1':
    'A kártyák fölött válthatsz a „Tervezett”, az „Archivált” és a „Befejezett” nézet között. „Befejezett” minden olyan utazás, amelynek a záró dátuma már elmúlt.',
  'help.guide.filter-and-view.step.2':
    'A lista ikonra kattintva tömör listanézetre válthatsz, újabb kattintással visszatérhetsz a rácsnézethez.',
  'help.guide.filter-and-view.result': 'Az irányítópult ezen az eszközön megjegyzi az elrendezésedet.',

  // calendar-feed
  'help.guide.calendar-feed.title': 'Feliratkozás az összes utazásra a naptáradban',
  'help.guide.calendar-feed.goal':
    'Lásd minden aktív utazás napjait és foglalásait a naptáralkalmazásodban, folyamatosan szinkronban.',
  'help.guide.calendar-feed.step.1': 'Kattints a nézetváltó melletti naptár ikonra.',
  'help.guide.calendar-feed.step.2':
    'Kattints a „Naptár-feliratkozás bekapcsolása” gombra. A TREK létrehoz egy privát feedlinket.',
  'help.guide.calendar-feed.step.3':
    'Kattints a „Hozzáadás a Google Naptárhoz” vagy a „Hozzáadás az Apple Naptárhoz / Outlookhoz” gombra. Más naptáralkalmazásnál nyisd meg a „Vagy másold ki kézzel a hivatkozást” részt, és onnan másold ki a linket.',
  'help.guide.calendar-feed.result':
    'Minden aktív utazás megjelenik a naptáradban, és automatikusan frissül. Az archivált és a több mint 90 napja véget ért utazások nem szerepelnek benne.',
  'help.guide.calendar-feed.tip.1':
    'Tartsd titokban a linket: aki ismeri, olvashatja a feedet. Ha mások is hozzájutottak, az „Újragenerálás” új linket ad, a régi pedig nem működik tovább. A „Kikapcsolás” teljesen megszünteti a linket.',

  // widgets
  'help.guide.widgets.title': 'Az irányítópult widgetjeinek kiválasztása',
  'help.guide.widgets.goal': 'A statisztikasor és a jobb oldali widgetek megjelenítése vagy elrejtése.',
  'help.guide.widgets.step.1':
    'Nyisd meg a jobb felső sarokban az avatarod menüjét, és válaszd a „Beállítások” pontot.',
  'help.guide.widgets.step.2': 'Válts a „Megjelenés” fülre.',
  'help.guide.widgets.step.3':
    'Az „Irányítópult-widgetek” alatt egyenként kapcsold be vagy ki a widgeteket, külön az asztali és a mobilos nézethez. A „Jobb oldalsáv” egyszerre kikapcsolja a teljes jobb oldali oszlopot.',
  'help.guide.widgets.step.4': 'Lépj vissza az irányítópultra. A módosítás azonnal érvénybe lép.',
  'help.guide.widgets.result':
    'Ha elrejted a widgeteket, több hely jut az utazásaidnak. Ha a teljes jobb oldalsávot kikapcsolod, az elrendezés középre igazodik.',
  'help.guide.widgets.link': 'Megjelenési beállítások megnyitása',

  // currency-widget
  'help.guide.currency-widget.title': 'Pénznemek átváltása',
  'help.guide.currency-widget.goal': 'Összeg átváltása két pénznem között az aktuális árfolyamon.',
  'help.guide.currency-widget.step.1': 'Írd be az összeget, és válaszd ki a két pénznemet.',
  'help.guide.currency-widget.step.2':
    'A köztük lévő nyíl megcseréli a két pénznemet, a körkörös nyíl pedig frissíti az árfolyamot.',
  'help.guide.currency-widget.result': 'A pénznempárt a fiókod megjegyzi, így minden eszközödön ugyanaz lesz.',
  'help.guide.currency-widget.tip.1':
    'Az árfolyamok az ingyenes Frankfurter szolgáltatásból származnak. A widget sarkában lévő körkörös nyíllal lekérheted a legfrissebbeket.',

  // timezones-widget
  'help.guide.timezones-widget.title': 'Világórák hozzáadása',
  'help.guide.timezones-widget.goal': 'Lásd az úti céljaid helyi idejét.',
  'help.guide.timezones-widget.step.1':
    'Kattints az „Időzónák” widgeten a + gombra, keress egy várost, például Lisszabont, és válaszd ki a listából.',
  'help.guide.timezones-widget.step.2':
    'Egy óra eltávolításához vidd fölé az egeret, és kattints a jobb oldalon megjelenő × jelre.',
  'help.guide.timezones-widget.result': 'Az óráidat a fiókodhoz mentjük.',
  'help.guide.search-trips.title': 'Keresés az utazásaid között',
  'help.guide.search-trips.goal':
    'Keress meg egy utazást a neve, egy dátum vagy egy rajta tervezett hely alapján, az archivált utazások között is.',
  'help.guide.search-trips.step.1':
    'Írj a kártyák fölötti „Utak vagy helyek keresése” mezőbe. A lista már gépelés közben szűkül, egyszerre a tervezett, az archivált és a befejezett utazások között.',
  'help.guide.search-trips.step.2':
    'Ha egy utazás az egyik helye miatt szerepel a találatok között, az a hely az utazás címe alatt látszik. Kattints a mezőben az x-re, vagy nyomd meg az Escape billentyűt, és újra az összes utazásodat látod.',
  'help.guide.search-trips.result':
    'Az irányítópulton csak az egyező utazások látszanak. Ha kiüríted a keresőmezőt, újra az összes utazás megjelenik.',
  'help.guide.search-trips.tip.1':
    'Dátum szerint is kereshetsz: írj be egy hónapot és egy évet, például 2027. május, vagy 2027-05, és megkapod az abban a hónapban zajló utazásokat.',
  'help.guide.search-trips.tip.2':
    'Keresés közben a „Tervezett”, „Archivált” és „Befejezett” kapcsoló nem érvényes, így egy rosszul beállított szűrő sem rejthet el utazást.',

  // ── Screen: vacay ──────────────────────────────────────────────────────────
  'help.ctx.vacay.title': 'Vacay',
  'help.ctx.vacay.summary':
    'A Vacay a személyes szabadságterveződ: hány szabadnapod van egy évben, mennyit rögzítettél már, és mennyi maradt. A rács a teljes évet mutatja. Az oldalsávban az évválasztó, a veled közösen tervezők, a veled megosztott naptárak, a jelmagyarázat és a szabadságkereted található.',
  'help.ctx.vacay.bullet.1':
    'Éves nézet: tizenkét hónapkártya, minden naphoz egy cella. Egy napra kattintva rögzíted vagy törlöd. A kis kék pont azokat a napokat jelöli, amelyekre már esik egy utazás.',
  'help.ctx.vacay.bullet.2':
    'Eszköztár alul: az első gombbal, amelyen a neved és a színed látszik, szabadságot rögzítesz; a „Céges szabadnap” azokat a napokat jelöli, amikor az egész cég szabadnapos. A „Fél nap” és a „Csúsztatás” azt módosítja, mit rögzít egy kattintás, és a „Fél nap” céges szabadnapokra is működik.',
  'help.ctx.vacay.bullet.3':
    '„Szabadságkeret”: „Nap”, „Felhasználva” és „Maradt” a kiválasztott évre, mellettük az áthozott és a csúsztatott napokkal. A kártya címére kattintva összecsukhatod.',
  'help.ctx.vacay.bullet.4':
    'A „Személyek” azok, akikkel közös a terved, mindenki a saját színével. A „Megosztott naptárak” mások szabadnapjait színes gyűrűként mutatják. Ezeket nem szerkesztheted.',
  'help.ctx.vacay.bullet.5':
    'A beállításokban megadhatod a hétvégéket, a hét kezdőnapját, az áthozatalt, a szabadságévedet, a céges szabadnapokat, az ünnepnapi és iskolai szüneti naptárakat, és ha valakivel közösen tervezel, itt az „Összevonás feloldása” is.',
  // log-day
  'help.guide.log-day.title': 'Szabadnap rögzítése',
  'help.guide.log-day.goal': 'Jelölj meg egy szabadnapot az éves naptárban, és nézd meg, hogyan frissül az egyenleged.',
  'help.guide.log-day.step.1':
    'Nézd meg az alsó eszköztár első gombját. Ha a neved és a színed látszik rajta, egy napra kattintva szabadnapot rögzítesz magadnak.',
  'help.guide.log-day.step.2':
    'Kattints egy napra bármelyik hónap kártyáján. A nap a te színedet kapja, a „Használva” értéke pedig egy nappal nő.',
  'help.guide.log-day.step.3': 'A törléshez kattints újra ugyanarra a napra.',
  'help.guide.log-day.result':
    'A nap rögzítve van. A „Nap”, a „Felhasználva” és a „Maradt” azonnal frissül, és mindenki, akinek a terve össze van vonva a tiéddel, rögtön látja a változást.',
  'help.guide.log-day.tip.1':
    'Amíg a Beállításokban a „Hétvégék zárolása” be van kapcsolva, hétvégi napot nem rögzíthetsz. A korábban rögzített hétvégi napot viszont törölheted.',
  'help.guide.log-day.tip.2':
    'Ha egy cellában kék pont van, arra a napra esik valamelyik utazásod, így látod, hol fedi egymást a szabadság és az utazás.',
  // half-day
  'help.guide.half-day.title': 'Fél nap rögzítése',
  'help.guide.half-day.goal': 'Vegyél ki egy délutánt, és csak fél napot használj fel a szabadságkeretedből.',
  'help.guide.half-day.step.1':
    'Kapcsold be az eszköztáron a „Fél nap” lehetőséget. A narancssárga pont jelöli a naptárban a fél napot.',
  'help.guide.half-day.step.2':
    'Kattints egy napra. 0,5 napként kerül rögzítésre, és a sarkában narancssárga pont jelenik meg.',
  'help.guide.half-day.step.3':
    'Ha végeztél, kapcsold ki újra a „Fél nap” módot. Ha egy eltérő beállítású fél napra kattintasz, az átvált az aktuális beállításokra.',
  'help.guide.half-day.result':
    'A „Felhasználva” értéke 0,5-tel nő. A „Fél nap” és a „Csúsztatás” egymástól független, így fél csúsztatott napot is rögzíthetsz.',
  'help.guide.half-day.tip.1':
    'Az eszköztár mindig azt a jelölést mutatja, amelyet a következő kattintásod elhelyez, így rögzítés előtt ellenőrizheted.',
  // comp-day
  'help.guide.comp-day.title': 'Csúsztatás vagy rugalmas munkaidő rögzítése',
  'help.guide.comp-day.goal': 'Vegyél ki csúsztatott szabadidőt szabadnapok felhasználása nélkül.',
  'help.guide.comp-day.step.1':
    'Kapcsold be az eszköztáron a „Csúsztatás” lehetőséget. A vonalkázott korong jelöli a naptárban a csúsztatott napot.',
  'help.guide.comp-day.step.2': 'Kattints egy napra. Teljes kitöltés helyett a színedben átlós csíkozást kap.',
  'help.guide.comp-day.result':
    'A csúsztatott napokat a szabadságkeret csempéi mellett számoljuk, és sosem csökkentik a „Maradt” értéket.',
  'help.guide.comp-day.tip.1':
    'Ezt használd a szabadidőként kivett túlórához, a rugalmas munkaidőhöz vagy a csereszabadnaphoz: minden olyan szabadidőhöz, amely nem szabadság.',
  // entitlement
  'help.guide.entitlement.title': 'Szabadságkeret beállítása',
  'help.guide.entitlement.goal': 'Add meg a Vacayben, hány szabadnapod van az évben.',
  'help.guide.entitlement.step.1':
    'Az oldalsáv „Szabadságkeret” kártyáján kattints a saját sorodban a „Nap” csempére. Ha a kártya össze van csukva, a címére kattintva nyithatod ki.',
  'help.guide.entitlement.step.2':
    'Írd be a napjaid számát, és nyomj Entert. Az Esc billentyűvel megtartod a régi értéket.',
  'help.guide.entitlement.result':
    'A „Maradt” értéke újraszámolódik a keretedből, az esetleges áthozott napokból és a már felhasznált napokból.',
  'help.guide.entitlement.tip.1':
    'Minden évnek saját kerete van, így az itteni módosítás csak a kiválasztott évre vonatkozik.',
  // years
  'help.guide.years.title': 'Évek hozzáadása és váltása',
  'help.guide.years.goal': 'Tervezd meg már most a jövő évet, vagy nézd meg a tavalyit.',
  'help.guide.years.step.1':
    'Az évszámtól jobbra lévő + gombbal a következő, a bal oldalival az előző évet adhatod hozzá.',
  'help.guide.years.step.2': 'Az évek között a nyilakkal vagy az alattuk lévő évcímkékkel válthatsz.',
  'help.guide.years.step.3':
    'Egy év eltávolításához vidd az egeret az évcímkéje fölé, és kattints a kis mínuszjelre. Ezzel az év összes bejegyzése is törlődik, ezért gondold meg, mielőtt megerősíted.',
  'help.guide.years.result':
    'Minden évnek saját kerete és saját bejegyzései vannak. Az áthozott napok kötik össze az egyik évet a következővel.',
  // company-holidays
  'help.guide.company-holidays.title': 'Céges szünetek megjelölése',
  'help.guide.company-holidays.goal':
    'Zárolj olyan napokat, amikor az egész cég szabadságon van, anélkül, hogy bárki szabadságkeretéből levonnád.',
  'help.guide.company-holidays.step.1':
    'Nyisd meg a Beállításokat, és ellenőrizd, hogy a „Céges szabadnapok” be van-e kapcsolva. Alapértelmezetten be van kapcsolva. Az eszköztáron csak bekapcsolt állapotban jelenik meg ez a mód.',
  'help.guide.company-holidays.step.2': 'A rácsban állítsd az eszköztárat „Céges szabadnap” módra.',
  'help.guide.company-holidays.step.3':
    'Kattints a napokra. Borostyánsárgák lesznek, és megjelennek a jelmagyarázatban. Egy napra újra kattintva törölheted.',
  'help.guide.company-holidays.result':
    'A céges szabadnapokat mindenki látja, akinek a terve össze van vonva, és ezek soha nem csökkentik a „Maradt” értéket.',
  'help.guide.company-holidays.tip.1':
    'A céges szüneteket az összevont terv bármelyik tagja szerkesztheti, ezért egyezzetek meg, ki gondozza őket.',
  // public-holidays
  'help.guide.public-holidays.title': 'Munkaszüneti napok megjelenítése',
  'help.guide.public-holidays.goal': 'Jelenítsd meg a naptárban az országod vagy a régiód munkaszüneti napjait.',
  'help.guide.public-holidays.step.1': 'Nyisd meg a Beállításokat, és kapcsold be az „Ünnepnapok” lehetőséget.',
  'help.guide.public-holidays.step.2':
    'Kattints a „Naptár hozzáadása” gombra, majd válaszd ki az országot, és ha kell, a régiót. Színt és címkét is adhatsz neki. Ezután kattints a „Hozzáadás” gombra.',
  'help.guide.public-holidays.step.3':
    'Zárd be a Beállításokat. Az ünnepnapok megjelennek a naptárrácson és a jelmagyarázatban.',
  'help.guide.public-holidays.result':
    'Az ünnepnapok a naptár színével vannak jelölve, és sosem vonódnak le a szabadságkeretedből.',
  'help.guide.public-holidays.tip.1':
    'Több naptárat is hozzáadhatsz, például a saját régiódét és egy összevont tervű kollégádét.',
  // school-holidays
  'help.guide.school-holidays.title': 'Iskolai szünetek megjelenítése',
  'help.guide.school-holidays.goal': 'Lásd a régiód iskolai szüneteit a saját szabadnapjaid mellett.',
  'help.guide.school-holidays.step.1': 'Nyisd meg a Beállításokat, és kapcsold be az „Iskolai szünetek” lehetőséget.',
  'help.guide.school-holidays.step.2':
    'Kattints a „Naptár hozzáadása” gombra, és válaszd ki az országot. Ha az ország naptára több részre oszlik, a régiót vagy a csoportot is válaszd ki, majd kattints a „Hozzáadás” gombra.',
  'help.guide.school-holidays.step.3':
    'Zárd be a Beállításokat. Az iskolai szünetek a naptár színével árnyalva jelennek meg, és a napjaik alján színes sáv fut végig.',
  'help.guide.school-holidays.result':
    'Az iskolai szünetek csak megjelennek a naptárban: senkinek a keretét nem csökkentik.',
  'help.guide.school-holidays.tip.1':
    'Nem találod a régiódat? Az adminisztrátor kézzel is felviheti az iskolai szüneteket: Adminisztrátor, Személyre szabás, „Iskolai szünetek”.',
  // weekends
  'help.guide.weekends.title': 'Hétvégék zárolása és a hét első napjának beállítása',
  'help.guide.weekends.goal': 'Hagyd ki a hétvégéket a számolásból, és kezdd a hetet a neked tetsző napon.',
  'help.guide.weekends.step.1': 'Nyisd meg a Beállításokat.',
  'help.guide.weekends.step.2':
    'Kapcsold be a „Hétvégék zárolása” beállítást, majd a „Hétvégi napok” alatt válaszd ki, mely napok számítanak hétvégének.',
  'help.guide.weekends.step.3': '„A hét kezdőnapja” alatt válaszd a „Hé” vagy a „Va” lehetőséget.',
  'help.guide.weekends.result': 'A „Tiltva” jelölésű napok szürkék a naptárban, így véletlenül sem rögzítheted őket.',
  // leave-year
  'help.guide.leave-year.title': 'Szabadságév beállítása',
  'help.guide.leave-year.goal':
    'A szabadságkereted üzleti év szerint vagy a belépésed napjától számolódjon, ne januártól decemberig.',
  'help.guide.leave-year.step.1': 'Nyisd meg a Beállításokat, és keresd meg a „Szabadságév” beállítást.',
  'help.guide.leave-year.step.2':
    'Válaszd a „Naptár” (naptári év), az „Üzleti év” (a kezdő hónappal és nappal) vagy a „Belépés dátuma” (a belépésed dátumával) lehetőséget.',
  'help.guide.leave-year.result':
    'A szabadságkeret, a felhasznált napok és az áthozatal erre az időszakra számolódik, a rács pedig az időszak első hónapjával kezdődik.',
  'help.guide.leave-year.tip.1':
    'Ez személyes beállítás: összevont tervben is mindenkinek megmarad a saját szabadságéve és a saját számai.',
  // carry-over
  'help.guide.carry-over.title': 'Fel nem használt napok átvitele',
  'help.guide.carry-over.goal': 'Vidd át az időszak végén megmaradt napokat a következő időszakra.',
  'help.guide.carry-over.step.1': 'Nyisd meg a Beállításokat.',
  'help.guide.carry-over.step.2': 'Kapcsold be a „Szabadság átvitele” kapcsolót.',
  'help.guide.carry-over.result':
    'Az átvitt mennyiséget az összes évedre újraszámoljuk, és a szabadságkeret alatt jelenítjük meg.',
  'help.guide.carry-over.tip.1': 'Kikapcsolásakor minden áthozott egyenleg nullára áll vissza.',
  // invite
  'help.guide.invite.title': 'Közös tervezés valakivel',
  'help.guide.invite.goal':
    'Vond össze a tervedet egy másik TREK-felhasználó tervével, hogy egy naptárban lássátok mindkettőtök szabadnapjait.',
  'help.guide.invite.step.1': 'Kattints a „Személyek” kártyán a személy ikonra.',
  'help.guide.invite.step.2': 'Válaszd ki a felhasználót, és kattints a „Meghívó küldése” gombra.',
  'help.guide.invite.step.3':
    'A meghívott értesítést kap, és amikor legközelebb megnyitja a Vacay-t, megjelenik neki az „Összevonási kérelem”. Addig a meghívás függőben látszik; ha fölé viszed az egeret, visszavonhatod.',
  'help.guide.invite.result':
    'A két terv összeolvad: mindenkinek saját színe van, rögzíthettek napokat egymásnak is, és minden élőben szinkronizálódik.',
  'help.guide.invite.tip.1':
    'Az összevonás megszüntetéséhez kattints a Beállításokban a „Feloldás” gombra. Mindenki bejegyzései visszakerülnek a saját tervébe.',
  'help.guide.invite.tip.2':
    'Ha a másik félnek csak látnia kell a napjaidat, összevonás helyett oszd meg vele a naptáradat.',
  // share-calendar
  'help.guide.share-calendar.title': 'Naptár megosztása csak olvasásra',
  'help.guide.share-calendar.goal': 'Mások is láthassák, mikor vagy szabadságon, de ne módosíthassák a tervedet.',
  'help.guide.share-calendar.step.1': 'Kattints a „Megosztott naptárak” kártyán a megosztás ikonra.',
  'help.guide.share-calendar.step.2':
    'Válaszd ki a felhasználót, és kattints a „Megosztás” gombra. Elfogadásra nincs szükség.',
  'help.guide.share-calendar.step.3':
    'A veled megosztott naptárak a kártya tetején jelennek meg: egyre kattintva elrejtheted vagy megjelenítheted, ha pedig fölé viszed az egeret, az x-szel eltávolíthatod. A „Te megosztod” alatt vidd az egeret egy név fölé, és kattints a „Megosztás leállítása” gombra.',
  'help.guide.share-calendar.result':
    'A szabadnapjaid színes gyűrűként jelennek meg az ő naptárában. Semmit sem szerkeszthet abból, amit megosztasz vele.',
  'help.guide.share-calendar.tip.1':
    'A megosztás és az összevonás független egymástól: összevonhatod a terved egy személlyel, és közben másokkal is megoszthatod.',
  'help.guide.share-calendar.tip.2':
    'Vidd az egeret egy gyűrűvel jelölt nap fölé, hogy lásd, ki van szabadságon és meddig.',

  // ── Screen: atlas ─────────────────────────────────────────────────────────────────────
  'help.ctx.atlas.title': 'Atlasz',
  'help.ctx.atlas.summary':
    'Az Atlasz egy világtérképen mutatja meg, merre jártál: minden ország, ahová egy utazásod vitt, színes, a TREK használata előtt meglátogatott országokat pedig kézzel is hozzáadhatod. Nagyíts rá a régiókhoz, vezess bakancslistát a még meglátogatni kívánt helyekről, a számaidat pedig az alsó üvegpanelen látod.',
  'help.ctx.atlas.bullet.1':
    'A térkép: minden meglátogatott ország saját, állandó színt kap, a tervezett országok szaggatott körvonalat, a bakancslistás országok átlós vonalkázást, minden más ország szürke. Ha egy ország fölé viszed az egeret, látod az utazásait, a helyeit, valamint az első és az utolsó látogatás idejét.',
  'help.ctx.atlas.bullet.2':
    'Felül a keresés: írj be egy országot vagy helyet. Ha olyan országot választasz, ahol még nem jártál, megnyílik a felugró ablaka. Ha olyat, ahol már jártál, a kártyája megjelenik a panelen. Ha egy helyet választasz, a térkép megnyitja a régióját, így megjelölheted.',
  'help.ctx.atlas.bullet.3':
    '„Tervezett országok megjelenítése”, jobbra fent: megmutatja a közelgő utazásaid országait. A kapcsoló csak akkor látszik, ha van ilyen utazásod.',
  'help.ctx.atlas.bullet.4':
    'Alul egy panel: a „Statisztikák” fülön az országok (mellettük a tervezettek), a régiók, az utazások, a helyek, a városok, a napok, a kontinensek, a sorozatod és az idei utazások; a „Bakancslista” fülön azok a helyek, ahová még el szeretnél jutni; a Túrák bővítménnyel pedig egy „Túrák” fül a megtett túráid távolságával és szintemelkedésével.',
  'help.ctx.atlas.bullet.5':
    'Régiók: ha erősen ránagyítasz, a térkép államokat és tartományokat mutat. Kattints egyre, és megjelölheted, törölheted a jelölését, vagy felveheted a bakancslistára.',
  'help.ctx.atlas.bullet.6':
    'Dawarich: ha a bővítmény csatlakoztatva van, a statisztikától balra lévő panel teljesítettnek jelöli a kívánságokat, és országokat ad hozzá a felvételeid alapján. Ezt csak a megerősítésed után teszi meg.',
  // mark-country
  'help.guide.mark-country.title': 'Ország megjelölése meglátogatottként',
  'help.guide.mark-country.goal':
    'Vegyél fel egy országot, ahol még a TREK használata előtt jártál, hogy a térkép és a számlálód is tartalmazza.',
  'help.guide.mark-country.step.1': 'Írd be az ország nevét a térkép tetején lévő keresőmezőbe.',
  'help.guide.mark-country.step.2':
    'Válaszd ki a listából. A térkép az országra ugrik, és megnyílik hozzá egy felugró ablak.',
  'help.guide.mark-country.step.3': 'Válaszd a „Megjelölés meglátogatottként” lehetőséget.',
  'help.guide.mark-country.result':
    'Az ország színt kap a térképen, az „Ország” számláló pedig eggyel nő. A szín végleges: ha további országokat jelölsz meg, a többi ország színe nem változik.',
  'help.guide.mark-country.tip.1':
    'Ha a térképen egy szürke országra kattintasz, ugyanez az ablak nyílik meg. Kis országoknál megbízhatóbb a keresés.',
  'help.guide.mark-country.tip.2':
    'A kézzel megjelölt ország mindig meglátogatottnak számít, függetlenül az oda tartó utazások dátumától.',
  // unmark-country
  'help.guide.unmark-country.title': 'Megjelölt ország eltávolítása',
  'help.guide.unmark-country.goal': 'Kézzel megjelölt ország levétele a térképről.',
  'help.guide.unmark-country.step.1':
    'Keresd meg és válaszd ki az országot, vagy kattints rá a térképen. Ha saját magad jelölted meg, a felugró ablak megkérdezi, hogy eltávolítsa-e.',
  'help.guide.unmark-country.step.2': 'Erősítsd meg az „Eltávolítás” gombbal.',
  'help.guide.unmark-country.result': 'Az ország ismét szürke lesz, és már nem számít bele a számlálóba.',
  'help.guide.unmark-country.tip.1':
    'Így csak a kézzel megjelölt országokat távolíthatod el. Az az ország, amelyhez utazás vagy hely tartozik, megjelölve marad, amíg ezeket el nem távolítod. Kézzel megjelölt országnál az „Eltávolítás” a panelen lévő részletkártyáján is megtalálható.',
  // country-details
  'help.guide.country-details.title': 'Mit csináltál egy országban',
  'help.guide.country-details.goal': 'Nyiss meg egy meglátogatott országot, és ugorj az oda vezető utazásokhoz.',
  'help.guide.country-details.step.1': 'Írj be egy országot, ahol jártál, a térkép tetején lévő keresőmezőbe.',
  'help.guide.country-details.step.2':
    'Válaszd ki. A térkép odaugrik, az alsó panelen pedig megjelenik egy kártya az ország zászlajával, a helyeit, utazásait és meglátogatott régióit mutató jelvényekkel, valamint az első három utazásához tartozó címkékkel.',
  'help.guide.country-details.result': 'Ha egy utazás címkéjére kattintasz, az utazás megnyílik a tervezőben.',
  'help.guide.country-details.tip.1':
    'Ha a térképen az ország fölé viszed az egeret, ugyanezeket a számokat látod, kiegészítve az első és az utolsó látogatással.',
  // planned-countries
  'help.guide.planned-countries.title': 'A tervezett úti célok országainak megjelenítése',
  'help.guide.planned-countries.goal':
    'Jelenítsd meg a térképen a közelgő utazásaid országait úgy, hogy ne számítsanak meglátogatottnak.',
  'help.guide.planned-countries.step.1':
    'Kapcsold be jobbra fent a „Tervezett országok megjelenítése” kapcsolót. A mellette lévő szám mutatja, hány tervezett ország van.',
  'help.guide.planned-countries.step.2':
    'Keress rá egy tervezett országra, és válaszd ki: a panelen a „Tervezett” felirat látszik, a térkép buboréksúgója pedig mutatja, mikor utazol oda.',
  'help.guide.planned-countries.result':
    'A tervezett országok szaggatott körvonallal jelennek meg, így sosem tűnnek már meglátogatott országnak. A kapcsoló megjegyzi a választásodat.',
  'help.guide.planned-countries.tip.1':
    'Egy ország akkor számít meglátogatottnak, ha az oda szóló utazás már elkezdődött, tehát a folyamatban lévő utazás is beleszámít. A dátum nélküli utazások egyáltalán nem kerülnek bele a statisztikába.',
  'help.guide.planned-countries.tip.2': 'A kapcsoló csak akkor jelenik meg, ha vannak közelgő utazásaid.',
  // regions
  'help.guide.regions.title': 'Régió megjelölése',
  'help.guide.regions.goal':
    'Ne csak az országokat jelöld meg, hanem azokat az államokat, tartományokat vagy prefektúrákat is, ahol jártál.',
  'help.guide.regions.step.1':
    'Nagyíts rá egy országra, amíg meg nem jelennek az államai és tartományai határai. Ha rákeresel az országra, és kiválasztod, a térkép elég közel ugrik.',
  'help.guide.regions.step.2':
    'Kattints egy régióra. Ha fölé viszed az egeret, megjelenik a neve. Az ablakban a régió és az országa látszik.',
  'help.guide.regions.step.3': 'Válaszd a „Megjelölés meglátogatottként” lehetőséget.',
  'help.guide.regions.result':
    'A régió az ország színét kapja. Ha megjelölsz egy régiót, az ország is meglátogatottnak számít, ha korábban még nem volt az.',
  'help.guide.regions.tip.1':
    'Ha egy meglátogatott régióra kattintasz, mindig felajánlja az „Eltávolítás” lehetőséget, akár te jelölted meg, akár egy hely miatt került be.',
  'help.guide.regions.tip.2':
    'Azok a régiók, ahol valódi helyeid vannak, automatikusan megjelölődnek. Ezekkel nincs teendőd.',
  // search-place
  'help.guide.search-place.title': 'Hely keresése és régiójának megjelölése',
  'help.guide.search-place.goal':
    'Jelöld meg Bajorországot úgy, hogy Münchenre keresel, anélkül hogy tudnád, melyik régióban van a város.',
  'help.guide.search-place.step.1':
    'Írj be egy várost, nevezetességet vagy címet a keresőmezőbe. Elsőként az országok jelennek meg, alattuk, a „Hely” csoportban pedig az egyező helyek.',
  'help.guide.search-place.step.2': 'Válaszd ki a helyet. A térkép odaugrik, és megkeresi, melyik régióban van a pont.',
  'help.guide.search-place.step.3':
    'Válaszd az adott régiónál a „Megjelölés meglátogatottként” lehetőséget, vagy a „Hozzáadás a bakancslistához” lehetőséget, ha még nem jártál ott.',
  'help.guide.search-place.result':
    'A régió és vele az ország is megjelölődik. Azoknál az országoknál, amelyekhez a térképcsomag nem tartalmaz régióadatot, maga az ország kap jelölést.',
  'help.guide.search-place.tip.1':
    'A helyek ugyanabból a keresésből jönnek, mint a TREK-ben máshol, így az adminisztrátor által beállított szolgáltatót használják.',
  // bucket-country
  'help.guide.bucket-country.title': 'Ország felvétele a bakancslistára',
  'help.guide.bucket-country.goal':
    'Vezess országokról kívánságlistát a térképen, elkülönítve azoktól az országoktól, ahol már jártál.',
  'help.guide.bucket-country.step.1': 'Keresd meg és válaszd ki az országot, vagy kattints rá a térképen.',
  'help.guide.bucket-country.step.2': 'Válaszd a „Hozzáadás a bakancslistához” lehetőséget.',
  'help.guide.bucket-country.step.3':
    'Ha már tudod, mikor mennél, válassz hónapot és évet, majd erősítsd meg a „Hozzáadás a bakancslistához” gombbal.',
  'help.guide.bucket-country.result':
    'Az ország átlós csíkozással jelenik meg abban a színben, amelyet a meglátogatása után kap, és felkerül a panel „Bakancslista” fülére.',
  'help.guide.bucket-country.tip.1':
    'Ha az ország már a listán van, ugyanebben az ablakban az „Eltávolítás a bakancslistáról” lehetőséget találod.',
  'help.guide.bucket-country.tip.2':
    'Céldátumonként egy bejegyzés lehet: ugyanaz az ország két különböző hónappal is szerepelhet a listán, ugyanazzal a hónappal viszont kétszer nem.',
  // bucket-place
  'help.guide.bucket-place.title': 'Hely hozzáadása a bakancslistához',
  'help.guide.bucket-place.goal':
    'Ments el egy várost, látnivalót vagy címet, ahová el szeretnél jutni, koordinátákkal és céldátummal.',
  'help.guide.bucket-place.step.1': 'Nyisd meg a „Bakancslista” fület az alsó panelen.',
  'help.guide.bucket-place.step.2': 'Kattints a „Hely hozzáadása” gombra.',
  'help.guide.bucket-place.step.3':
    'Írd be a nevet, és nyomd meg a keresés gombot; válaszd ki a találatot, hogy a hely koordinátákat kapjon. Kereséssel nem muszáj bajlódnod: elég csak a nevet beírni.',
  'help.guide.bucket-place.step.4': 'Ha szeretnéd, adj meg hónapot és évet, majd kattints a „Hozzáadás” gombra.',
  'help.guide.bucket-place.result':
    'A hely a céldátummal együtt a bakancslistád tetejére kerül. Ha fölé viszed az egeret, megjelenik a × jel, amellyel eltávolíthatod.',
  'help.guide.bucket-place.tip.1':
    'A Dawarich csak akkor tudja később teljesítettnek jelölni a kívánságot, ha vannak koordinátái. Ezt akkor teszi meg, amikor a rögzítéseid alapján kiderül, hogy ott jártál.',
  // stats
  'help.guide.stats.title': 'A statisztikáid',
  'help.guide.stats.goal': 'Tudd meg, mit számolnak a panel számai, és mit nem.',
  'help.guide.stats.step.1':
    'Az „Ország” azoknak a különböző országoknak a száma, ahol valóban jártál. A tervezett országok a szám alatt látszanak, és nem számítanak bele. A „Régió” azokat az államokat és tartományokat számolja, ahol jártál. Az „Utazás”, a „Hely” és a „Nap” az összes utazásod összesítése. A „Város” a helyeid címéből számolódik, ezért csak becslés.',
  'help.guide.stats.step.2':
    'A kontinensek kontinensenként mutatják a meglátogatott országokat. Az Antarktisz akkor jelenik meg a sorban, ha már jártál ott. Ezután a sorozatod következik (egymást követő évek legalább egy utazással), majd az, hogy idén hány utazáson voltál.',
  'help.guide.stats.result':
    'A számok automatikusan frissülnek, ahogy az utazásaidat tervezed. Itt semmit sem kell karbantartanod.',
  'help.guide.stats.tip.1':
    'A városokat a TREK a cím szövegéből veszi, nem keresi ki. Ezért egy rövid cím, például „Osteria Francescana, Italy”, vagy egy prefektúrára végződő cím város helyett régióként is beszámíthat.',
  'help.guide.stats.tip.2':
    'A kézzel megjelölt országok beleszámítanak az „Ország” értékbe és a kontinensekbe, de utazást, helyet vagy napot nem adnak hozzá.',
  // dawarich-countries
  'help.guide.dawarich-countries.title': 'Országok hozzáadása a rögzítéseidből',
  'help.guide.dawarich-countries.goal':
    'A Dawarich segítségével derítsd ki, mely országokban jártál az elmúlt évben, és tedd fel a térképre azokat, amelyeket megerősítesz.',
  'help.guide.dawarich-countries.step.1':
    'Ha a Dawarich bővítmény csatlakoztatva van, a térkép alján, a statisztikától balra megjelenik egy Dawarich panel két csempével. Kattints az „Ország” csempére.',
  'help.guide.dawarich-countries.step.2':
    'Az ablak az „Ország” fülön nyílik meg. Kattints az „Országok keresése” gombra: a TREK hónapról hónapra beolvassa, mely országokat és városokat fednek le a felvételeid az elmúlt 12 hónapban, ezért ez eltarthat egy ideig. Minden ország, amely még nincs az Atlaszodban, megjelenik a zászlajával, a városok számával és az első város nevével. Alapból minden ország ki van pipálva. Ha egyet ki akarsz hagyni, kattints a sorára.',
  'help.guide.dawarich-countries.step.3':
    'Erősítsd meg a jobb alsó gombbal, amelyen öt kipipált sor esetén „5 ország hozzáadása” áll. Az ablak jelzi, hány ország került be. Mire bezárod, a térkép már frissült.',
  'help.guide.dawarich-countries.result':
    'A megerősített országok színt kapnak a térképen, és beleszámítanak az „Ország” értékbe, Dawarich forrással rögzítve. A kézzel megjelölt országok nem változnak.',
  'help.guide.dawarich-countries.tip.1':
    'Azokat az országokat, amelyeket az Atlasz már meglátogatottként mutat, akár kézi jelölés, akár egy utazás, akár egy korábbi ellenőrzés alapján, kihagyjuk, így a saját jelöléseid sosem változnak. Ha egy országot korábban eltávolítottál az Atlaszból, és itt megerősíted, újra bekerül.',
  'help.guide.dawarich-countries.tip.2':
    'Ha a TREK nem tud párosítani egy országnevet, a nevet a sorok alatt felsorolja, nem hagyja ki. Az „Ellenőrzés újra” ismét lekérdezi a Dawarichot. A lista alatti megjegyzés jelzi, hogy az elmúlt 12 hónapot ellenőriztük. Ez az időszak nem módosítható.',
  // dawarich-wishes
  'help.guide.dawarich-wishes.title': 'Kívánságok kipipálása a felvételeid alapján',
  'help.guide.dawarich-wishes.goal':
    'Tudd meg, a bakancslistád mely helyeire jutottál el valóban, és jelöld meg őket elértként az elérés dátumával.',
  'help.guide.dawarich-wishes.step.1':
    'A térkép alján, a statisztikától balra lévő Dawarich panelen kattints a „Kívánságlista” csempére.',
  'help.guide.dawarich-wishes.step.2':
    'Az ablak a „Kívánságlista” fülön nyílik meg. Kattints a „Kívánságlista ellenőrzése” gombra: a TREK a felvételeid alapján minden olyan bejegyzést ellenőriz, amelynek vannak koordinátái. Az elért kívánságoknál látszik, milyen közel jutottál, mennyi ideig maradtál, és melyik napon jártál ott; alapból ki vannak pipálva. Amit már korábban kipipáltál, azon a „Már kipipálva” felirat áll. A lista alatti megjegyzés megadja a koordináták nélküli bejegyzések számát, és a szabályt is: „Egy kívánság 250 méteren belül és 20 perc helyszíni tartózkodás után számít teljesítettnek.”',
  'help.guide.dawarich-wishes.step.3':
    'Erősítsd meg a jobb alsó gombbal, amelyen két kipipált sor esetén „2 kipipálása” áll. Ezután zárd be az ablakot, és nyisd meg a mellette lévő panel „Bakancslista” fülét.',
  'help.guide.dawarich-wishes.result':
    'Minden kívánság zöld pipát kap, mellette az ott-tartózkodás dátumával, nem a mai nappal. A buboréksúgóban ez áll: „A Dawarich-rögzítéseid alapján kipipálva”. A dátumra kattintva visszavonhatod.',
  'help.guide.dawarich-wishes.tip.1':
    'Az elhaladás nem számít: a hely közelében kell lenned, és ott is kell töltened egy kis időt. Ha több tartózkodás is megfelel, a leghosszabbat vesszük alapul. Koordináták nélküli kívánságot nem lehet ellenőrizni, ezért a helyeket a „Hely hozzáadása” keresőjével add hozzá, ne csak név alapján.',
  'help.guide.dawarich-wishes.tip.2':
    'Egy ellenőrzés legfeljebb 50 bejegyzést vizsgál meg, a még ki nem pipáltakkal kezdve. Ha több van, a TREK jelzi. A már kipipált kívánság megtartja a saját dátumát.',

  // ── Screen: collections ───────────────────────────────────────────────────────────────
  'help.ctx.collections.title': 'Gyűjtemények',
  'help.ctx.collections.summary':
    'A Gyűjtemények az utazásoktól független könyvtárad: elnevezett listák azokról a helyekről, amelyeket találtál, és meg szeretnél tartani, mindegyik „Ötlet”, „Szeretnék odamenni” vagy „Meglátogatva” állapottal, a Túrák bővítménnyel pedig az utazásokból mentett teljes túrák is. A helyek és a túrák másolatként kerülnek az utazásokba és onnan ki, soha nem kapcsolódnak össze, így egy lista és egy utazás sosem módosítja egymást.',
  'help.ctx.collections.bullet.1':
    'A bal oldali listaoszlopban a saját listáid, a veled megosztott listák, a még meg nem válaszolt meghívások és az „Összes mentett” látszik, amely a saját listáid teljes tartalmát egyesíti. Felül található az „Új lista” és a fájlimportálás.',
  'help.ctx.collections.bullet.2':
    'A megnyitott lista fejlécében látod a színét, a borítóját, a leírását és a linkjeit, a tagokat, jobbra pedig a „Szerkesztés” (csak a tulajdonosnak), az „Exportálás” és a „Megosztás” gombot. A veled megosztott listán a „Megosztás” gombon „Megosztott” felirat áll.',
  'help.ctx.collections.bullet.3':
    'A helyek fölötti szűrősor: a + gomb hely hozzáadásához, az „Állapot”, „Kategória”, „Értékelés” és „Rendezés” legördülő menü, a jelölőnégyzet ikon a „Jelölés” módhoz és a felhő ikon az „Importálás egy utazásból” funkcióhoz. A címkeszűrő csak akkor jelenik meg ebben a sorban, ha nem látszik térkép.',
  'help.ctx.collections.bullet.4':
    'Helysorok: fotó, név és cím, címkék és kategória, jobb oldalon pedig az állapotjelző gomb. Egy kattintással a következő állapotra vált.',
  'help.ctx.collections.bullet.5':
    'Jobb oldalon a térkép: minden koordinátával rendelkező helynek saját gombostűje van. A felső sávban található a „Térkép nagyítása” (teljes méretű térképnél „Lista megjelenítése”), a címkeszűrő a címkék kezelésére szolgáló gombbal, és a „Helyek keresése” mező. Egy gombostűre kattintva megnyílik az adott hely.',
  'help.ctx.collections.bullet.6':
    'Részletlap: egy sorra kattintva megjelenik a borító, a kategória, az állapot, a csillagos értékelés, a címkék, a leírás és a linkek. A borítón lévő kamerával lecserélheted a fotót. Alul található a „Szerkesztés”, a „Másolás utazásba”, a navigációs gomb és az „Eltávolítás a listából”.',
  // create-list
  'help.guide.create-list.title': 'Lista létrehozása',
  'help.guide.create-list.goal':
    'Hozz létre egy új, elnevezett listát színnel és borítóval, amelybe aztán helyeket tehetsz.',
  'help.guide.create-list.step.1': 'Kattints az „Új lista” gombra a listák oldalsávjának tetején.',
  'help.guide.create-list.step.2':
    'Adj nevet a listának, és válassz színt. A borítókép, a leírás és a linkek nem kötelezők, később a „Szerkesztés” gombbal is megadhatod őket.',
  'help.guide.create-list.step.3': 'Kattints a „Létrehozás” gombra.',
  'help.guide.create-list.result':
    'A lista üresen nyílik meg, és kétféleképpen töltheted fel: „Hely hozzáadása” vagy „Importálás egy utazásból”.',
  'help.guide.create-list.tip.1':
    'Borítónak feltölthetsz saját képet, vagy választhatsz egyet az ugyanebben az ablakban elérhető Unsplash-keresővel.',
  // add-place
  'help.guide.add-place.title': 'Hely hozzáadása',
  'help.guide.add-place.goal':
    'Keress meg egy helyet, és egy lépésben mentsd a megnyitott listába névvel, kategóriával, állapottal és jegyzetekkel.',
  'help.guide.add-place.step.1':
    'Kattints a helyek fölötti szűrősor elején lévő + gombra. Még üres listán kattints az oldal közepén a „Hely hozzáadása” gombra.',
  'help.guide.add-place.step.2':
    'Írd be a hely nevét a keresőmezőbe, és válassz egy találatot. A név, a cím és a koordináták a találatból töltődnek ki.',
  'help.guide.add-place.step.3':
    'Állítsd be az állapotot, és ha szeretnéd, a kategóriát, a leírást és a linkeket, majd kattints a „Hozzáadás” gombra. Az ablak nyitva marad a következő helyhez, a „Mégse” gombbal bezárhatod.',
  'help.guide.add-place.result': 'A hely megjelenik a listában, és ha vannak koordinátái, gombostűként a térképen is.',
  'help.guide.add-place.tip.1':
    'Egy utazáson belül a helyinspektorban vagy egy hely menüjében lévő „Mentés gyűjteménybe” az utazás elhagyása nélkül listára teszi az utazás egy helyét.',
  'help.guide.add-place.tip.2':
    'A listának a tiédnek kell lennie, vagy olyannak, amelyen szerkesztő vagy adminisztrátor vagy; az „Összes mentett” nézetben és a csak megtekinthető listákon nincs + gomb.',
  // import-from-trip
  'help.guide.import-from-trip.title': 'Helyek importálása egy utazásból',
  'help.guide.import-from-trip.goal':
    'Vidd át egy teljes utazás helyeit egyszerre egy listára, ahelyett hogy egyenként mentenéd őket.',
  'help.guide.import-from-trip.step.1':
    'Kattints a szűrősorban a felhős nyilas importálás gombra. Üres listán ugyanez a gomb a „Hely hozzáadása” mellett található.',
  'help.guide.import-from-trip.step.2': 'Válaszd ki az egyik utazásodat.',
  'help.guide.import-from-trip.step.3':
    'Jelöld be a kívánt helyeket. A listán már szereplő helyek szürkék. Kezdetben azok a helyek vannak kijelölve, amelyek az utazás egyik napján sem szerepelnek. Ha minden hely szerepel már valamelyik napon, az összes új hely ki van jelölve. A „Csak az újak” elrejti azokat a helyeket, amelyek már a listán vannak.',
  'help.guide.import-from-trip.step.4':
    'Kattints az „Importálás” gombra. A gombon mindig látszik, hány hely kerül hozzáadásra.',
  'help.guide.import-from-trip.result':
    'A helyek a nevükkel, címükkel, koordinátáikkal, leírásukkal és kategóriájukkal együtt átmásolódnak a listába. Az utazás nem változik.',
  'help.guide.import-from-trip.tip.1':
    'A TREK automatikusan kihagyja a név vagy koordináták szerinti ismétlődéseket, így nyugodtan importálhatsz kétszer is.',
  'help.guide.import-from-trip.tip.2':
    'Egy utazás helylistájában a jelölési mód a „Mentés gyűjteménybe” lehetőséget kínálja, ha csak kézzel válogatott helyeket szeretnél menteni.',
  // place-status
  'help.guide.place-status.title': 'Hely állapotának beállítása',
  'help.guide.place-status.goal': 'Kövesd nyomon, mi csak ötlet, mi került a szűkített listára, és hol jártál már.',
  'help.guide.place-status.step.1':
    'Kattints a hely sorának jobb végén lévő állapotcímkére. Az „Ötlet” helyett „Szeretnék odamenni” lesz.',
  'help.guide.place-status.step.2':
    'Kattints rá még egyszer a „Meglátogatva” állapothoz, majd újra, hogy visszaálljon „Ötlet” állapotra.',
  'help.guide.place-status.result':
    'Az állapotgomb és a színe azonnal megváltozik, és a lista fölötti állapotszűrő darabszámai is frissülnek.',
  'help.guide.place-status.tip.1':
    'Állapot csak a Gyűjteményekben létezik. Ha egy helyet utazásba másolsz, az állapota nem másolódik át.',
  'help.guide.place-status.tip.2':
    'Egy utazásból a „Mentés gyűjteménybe” a „Mentés listába” ablakot nyitja meg, minden olyan listánál egy állapotgombbal, amelyen a hely szerepel; a helyek panel kijelölősávjában pedig ott a „Megjelölés látogatottként a listáidban”.',
  // place-detail
  'help.guide.place-detail.title': 'Mentett hely megnyitása',
  'help.guide.place-detail.goal':
    'Lásd egy hely összes adatát és azt, mit tehetsz vele: szerkesztés, utazásba másolás, útvonaltervezés, eltávolítás.',
  'help.guide.place-detail.step.1':
    'Kattints egy hely sorára. A lista mellett megnyílik a részletes adatlap, a térkép pedig a helyre ugrik.',
  'help.guide.place-detail.step.2':
    'Alul található a „Szerkesztés”, a „Másolás utazásba”, a navigációs gomb, amely térképalkalmazásban nyitja meg a helyet, és az „Eltávolítás a listából”. A borítón lévő kamerával az automatikus fotót saját fotóra cserélheted.',
  'help.guide.place-detail.result':
    'A „Szerkesztés” gombbal közvetlenül az adatlapon módosíthatod a nevet, a kategóriát, a címkéket, a címet, a koordinátákat, a leírást és a linkeket.',
  'help.guide.place-detail.tip.1':
    'Ha a helynek nincs saját képe, a borítót a TREK automatikusan letölti. Saját képként JPG, PNG, GIF, WebP vagy HEIC fájlt tölthetsz fel, legfeljebb 20 MB-ig. A kamera melletti kuka visszaállítja az automatikus fotót.',
  'help.guide.place-detail.tip.2':
    'Minden tag, te is, adhat csillagos értékelést az állapot alatt; a szűrősor „Értékelés” szűrője az átlagot használja.',
  // labels
  'help.guide.labels.title': 'Helyek csoportosítása címkékkel',
  'help.guide.labels.goal':
    'Adj a listának saját címkéket, például kerületeket vagy napokat, a közös kategóriák mellé.',
  'help.guide.labels.step.1':
    'Kattints a térkép fölötti címkék melletti „Címke hozzáadása” gombra (ha a listának már vannak címkéi, „Címkék kezelése”). Ha nem látszik térkép, a gomb a szűrősor végén található.',
  'help.guide.labels.step.2':
    'Írj be egy nevet, válassz színt, és kattints a „Címke hozzáadása” gombra. Ugyanebben az ablakban a meglévő címkéket átnevezheted, átszínezheted vagy törölheted.',
  'help.guide.labels.step.3':
    'Kapcsold be a „Jelölés” módot, jelöld be a helyeket, kattints a kijelölési sávban a „Címke hozzárendelése” gombra, válaszd ki a címkéket, és erősítsd meg a „Címke hozzárendelése” gombbal. Egyetlen helyhez a részletlapján a „Szerkesztés” gombbal is adhatsz címkét.',
  'help.guide.labels.step.4':
    'Kattints egy vagy több címkére a térkép fölött: a listában és a térképen csak azok a helyek maradnak, amelyeken ezek közül legalább egy címke szerepel. Egy címkére újra kattintva kiveszed a szűrőből.',
  'help.guide.labels.result':
    'A címkézett helyek sorában látszanak a címkéik; a címkeszűrőt minden tag használhatja, a megtekintők is.',
  'help.guide.labels.tip.1':
    'A címkék ahhoz a listához tartoznak, amelyben létrehozták őket. Ha egy helyet másik listába helyezel át, a címkéi törlődnek.',
  'help.guide.labels.tip.2': 'A címkék kezeléséhez és hozzárendeléséhez szerkesztési jog kell a listához.',
  // filter-select
  'help.guide.filter-select.title': 'Helyek szűrése és kijelölése',
  'help.guide.filter-select.goal': 'Szűrd a listát, és módosíts egyszerre több helyet.',
  'help.guide.filter-select.step.1':
    'Használd a szűrősor legördülő menüit: állapot, kategória, minimális értékelés és rendezési sorrend. Az állapotnál és a kategóriánál látod, hány hely felel meg az egyes lehetőségeknek.',
  'help.guide.filter-select.step.2':
    'Kattints a legördülő menük utáni jelölőnégyzet ikonra („Jelölés”). Minden sor kap egy jelölőnégyzetet, és megjelenik egy kijelölősáv.',
  'help.guide.filter-select.step.3':
    'Jelöld be a helyeket, vagy az „Összes kijelölése” gombbal jelöld ki a szűrő által mutatott összes helyet, majd válaszd a „Címke hozzárendelése”, az „Áthelyezés listába”, a „Másolás listába”, a „Másolás utazásba” vagy a „Törlés” lehetőséget. Az áthelyezést és a törlést csak a lista tulajdonosa vagy egy adminisztrátora használhatja.',
  'help.guide.filter-select.result':
    'A műveletek egyszerre a teljes kijelölésre vonatkoznak. A jobb oldali × gombbal kiléphetsz a kijelölő módból.',
  'help.guide.filter-select.tip.1':
    'Az „Összes kijelölése” csak a szűrőnek megfelelő helyeket jelöli ki. Ha az összes „Szeretnék odamenni” helyeddel szeretnél valamit kezdeni, szűrj „Szeretnék odamenni” állapotra, és kattints az „Összes kijelölése” gombra.',
  // copy-to-trip
  'help.guide.copy-to-trip.title': 'Helyek másolása utazásba',
  'help.guide.copy-to-trip.goal': 'Vedd fel a mentett helyeket megállóként valamelyik utazásodba.',
  'help.guide.copy-to-trip.step.1':
    'Kapcsold be a „Jelölés” módot, és pipáld ki a helyeket, vagy nyiss meg egy helyet, és használd az adatlapján a „Másolás utazásba” lehetőséget.',
  'help.guide.copy-to-trip.step.2': 'Kattints a kijelölési sávban a „Másolás utazásba” gombra.',
  'help.guide.copy-to-trip.step.3': 'Válaszd ki az utazást. Hosszú listánál a keresőmezővel szűkítheted a találatokat.',
  'help.guide.copy-to-trip.result':
    'A helyek bekerülnek az adott utazás helylistájába a névvel, leírással, kategóriával, jegyzetekkel, árral, koordinátákkal, fotóval és címkékkel együtt. A gyűjteményben semmi sem változik.',
  'help.guide.copy-to-trip.tip.1':
    'Ezt egy megosztott lista nézői is megtehetik. A helyeket átmásolja a listából, magát a listát nem módosítja.',
  // share-list
  'help.guide.share-list.title': 'Lista megosztása valakivel',
  'help.guide.share-list.goal': 'Tervezz meg egy listát másokkal közösen, élőben, ezen a TREK-példányon.',
  'help.guide.share-list.step.1': 'Kattints a „Megosztás” gombra a listád fejlécében.',
  'help.guide.share-list.step.2':
    'Válaszd ki a felhasználót és a szerepkört: „Néző”, „Szerkesztő” vagy „Adminisztrátor”.',
  'help.guide.share-list.step.3':
    'Kattints a „Meghívó küldése” gombra. A személy függőben marad, amíg el nem fogadja a meghívást a listasávjában vagy az értesítésből.',
  'help.guide.share-list.result':
    'Amint elfogadja, a lista megjelenik nála a „Megosztott” alatt, és minden módosítás élőben szinkronizálódik. A tagokat és a szerepüket ugyanebben az ablakban továbbra is szerkesztheted.',
  'help.guide.share-list.tip.1':
    'A „Néző” megtekintheti és értékelheti a helyeket, és a saját utazásaiba másolhatja őket. A „Szerkesztő” helyeket és címkéket adhat hozzá és szerkeszthet. Az „Adminisztrátor” emellett áthelyezhet és törölhet is.',
  'help.guide.share-list.tip.2':
    'Csak a tulajdonos hívhat meg és távolíthat el másokat; egy tag viszont maga is kiléphet a megosztott listából.',
  // export-list
  'help.guide.export-list.title': 'Lista exportálása fájlba',
  'help.guide.export-list.goal':
    'Adj át egy listát valakinek egy másik TREK-szerveren, vagy nyisd meg egy térképalkalmazásban.',
  'help.guide.export-list.step.1': 'Kattints az „Exportálás” gombra a lista fejlécében.',
  'help.guide.export-list.step.2':
    'Válaszd a „TREK-lista” formátumot, ha egy másik TREK-ben használnád a listát címkékkel és állapotokkal együtt, vagy a GPX-et az OsmAndhoz, az Organic Mapshez, Garmin eszközhöz és más, útpontokat kezelő alkalmazásokhoz.',
  'help.guide.export-list.result': 'A fájl letöltődik. Megosztott listát bármelyik tagja exportálhat.',
  'help.guide.export-list.tip.1':
    'Koordináták nélküli hely nem lehet GPX-útpont; ezek kimaradnak, és a TREK jelzi, hány ilyen volt.',
  'help.guide.export-list.tip.2':
    'Az értékelések, a tagok és a feltöltött fotók szándékosan nem kerülnek az exportba; ezek ehhez a TREK-példányhoz tartoznak, nem a listához.',
  // import-file
  'help.guide.import-file.title': 'Lista importálása fájlból',
  'help.guide.import-file.goal': 'Importálj egy TREK-listafájlt vagy GPX-fájlt új listaként vagy egy meglévő listába.',
  'help.guide.import-file.step.1': 'A listasávban kattints az „Új lista” melletti, feltöltés nyilas importálás gombra.',
  'help.guide.import-file.step.2':
    'Válaszd ki a fájlt. Mielőtt bármit importálna, a TREK megmutatja, mi van a fájlban: a nevét, a helyek és a címkék számát.',
  'help.guide.import-file.step.3':
    'Hagyd az „Új lista” lehetőséget, ha szeretnéd, módosítsd a nevet, majd kattints az „Importálás” gombra. Vagy válaszd a „Hozzáadás listához” lehetőséget, hogy a helyek egy általad szerkeszthető listára kerüljenek, és kattints a „Hozzáadás a listához” gombra.',
  'help.guide.import-file.result':
    'Megnyílik a lista az importált helyekkel. A listába importálás csak hozzáad helyeket. A már meglévő helyek megtartják az állapotukat, a jegyzeteiket és a címkéiket.',
  'help.guide.import-file.tip.1':
    'GPX-fájlból minden névvel ellátott útpont hely lesz; a nyomvonalak vonalak, ezért kimaradnak, és az előnézet jelzi, hány pontról van szó.',
  'help.guide.import-file.tip.2':
    'A TREK elutasítja azt a fájlt, amely se nem TREK-lista, se nem GPX, és megmutatja az okát. Ha csak egy hely nem olvasható, csak az az egy marad ki, nem az egész fájl.',
  // edit-list
  'help.guide.edit-list.title': 'Lista szerkesztése vagy törlése',
  'help.guide.edit-list.goal':
    'Módosítsd egy lista nevét, színét, borítóját, leírását vagy linkjeit, vagy töröld a listát.',
  'help.guide.edit-list.step.1': 'Kattints a „Szerkesztés” gombra a lista fejlécében. Ezt csak a tulajdonos látja.',
  'help.guide.edit-list.step.2':
    'Módosíts, amit szeretnél, és kattints a „Mentés” gombra. A bal alsó sarokban lévő kuka ikon, a „Lista törlése”, megerősítés után a listát az összes helyével együtt törli.',
  'help.guide.edit-list.result': 'A fenti fejléc azonnal az új színt, borítót és leírást mutatja.',
  'help.guide.edit-list.tip.1':
    'A lista törlése nem vonható vissza. Ha meg szeretnél tartani egy másolatot, előbb exportáld.',
  // all-saved
  'help.guide.all-saved.title': 'Keresés a teljes gyűjteményedben',
  'help.guide.all-saved.goal': 'Az összes saját listád helyeinek megtekintése egyszerre.',
  'help.guide.all-saved.step.1':
    'A listasávban kattints az „Összes mentett” elemre. Itt egy nézetben látod az összes saját és közösen birtokolt listád helyeit.',
  'help.guide.all-saved.step.2':
    'Írj a térkép fölötti „Helyek keresése” mezőbe, és használd a szűrőket ugyanúgy, mint bármelyik listán. A „Jelölés” itt is működik: több listán átívelően is áthelyezhetsz, duplikálhatsz, utazásba másolhatsz vagy törölhetsz.',
  'help.guide.all-saved.result':
    'Ebben a nézetben az összes mentett helyedet együtt látod. Itt nem adhatsz hozzá és nem importálhatsz helyeket, mert nincs egyetlen lista, amelybe bekerülhetnének.',
  'help.guide.all-saved.tip.1':
    'A címkék és a mentett túrák egy-egy listához tartoznak, ezért az „Összes mentett” nézetben egyik sem érhető el.',

  // ── Screen: journey ───────────────────────────────────────────────────────────────────
  'help.ctx.journey.title': 'Útinaplók',
  'help.ctx.journey.summary':
    'Az útinapló a fotókra épülő utazási naplód. Minden útinapló egy vagy több utazáshoz kapcsolódik, és napról napra töltöd meg bejegyzésekkel, amelyekben történet, fotók, hangulat és időjárás szerepel. Ez a képernyő az útinaplóidat listázza; nyiss meg egyet, és kezdj írni.',
  'help.ctx.journey.bullet.1':
    'A felső sáv a folyamatban lévő vagy a legutóbbi útinaplót mutatja a bejegyzések, fotók és helyek számával. Az „Írás folytatása” a mai napnál nyitja meg. Ha egy utazás épp véget ért, a fölötte megjelenő „Az út épp véget ért” sáv felajánlja, hogy útinaplót készíts belőle.',
  'help.ctx.journey.bullet.2':
    'Az „Összes útinapló” alatt minden útinaplónak saját kártyája van a borítóval, az állapottal, a dátumokkal és a darabszámokkal; a szalagban kiemelt útinapló itt nem jelenik meg újra. Kattints egy kártyára a megnyitásához.',
  'help.ctx.journey.bullet.3':
    'A rács utolsó kártyájával, az „Új útinapló létrehozása” lehetőséggel az utazásaidból indíthatsz újat.',
  // create-journey
  'help.guide.create-journey.title': 'Útinapló létrehozása',
  'help.guide.create-journey.goal':
    'Indíts naplót egy utazáshoz úgy, hogy az utazás helyei már javaslatként szerepeljenek benne.',
  'help.guide.create-journey.step.1': 'Kattints az „Új útinapló létrehozása” kártyára, ez a rács utolsó kártyája.',
  'help.guide.create-journey.step.2':
    'Adj neki nevet, és ha szeretnéd, alcímet, majd jelöld be az utazásokat, amelyekhez tartozik. A számláló mutatja, hány hely kerül bele.',
  'help.guide.create-journey.step.3': 'Kattints az „Útinapló létrehozása” gombra.',
  'help.guide.create-journey.result':
    'Megnyílik a napló. A kapcsolt utazások minden helye javaslatként jelenik meg az idővonalon, minden olyan napnál egyszer, amelyre be van tervezve. Mindegyikhez írhatsz bejegyzést.',
  'help.guide.create-journey.tip.1': 'További utazásokat később, az „Útinapló beállításai” alatt kapcsolhatsz hozzá.',
  'help.guide.create-journey.tip.2':
    'Utazás nélkül is létrehozhatsz útinaplót; ilyenkor a bejegyzéseket kézzel veszed fel.',
  // open-journey
  'help.guide.open-journey.title': 'Útinapló megnyitása',
  'help.guide.open-journey.goal': 'Nyiss meg egy naplót, és nézd meg, hol nyílik meg.',
  'help.guide.open-journey.step.1':
    'Kattints egy kártyára. Mindegyiken látszik a borító, a dátumok, valamint hogy hány bejegyzés, fotó és hely van az útinaplóban.',
  'help.guide.open-journey.result':
    'A folyamatban lévő útinapló a mai napnál nyílik meg, vagy ha mára még nincs bejegyzés, az utolsó korábbi bejegyzésnél. A befejezett útinapló az elején nyílik meg.',
  'help.guide.open-journey.tip.1':
    'A borító az útinapló első fotója, hacsak az „Útinapló beállításai” ablakban nem állítasz be másikat.',
  // continue-writing
  'help.guide.continue-writing.title': 'A folyamatban lévő útinapló folytatása',
  'help.guide.continue-writing.goal': 'Nyisd meg közvetlenül az éppen zajló útinapló mai oldalát.',
  'help.guide.continue-writing.step.1':
    'Kattints a felső sávban az „Írás folytatása” gombra. A sáv a folyamatban lévő útinaplót mutatja, vagy ha ilyen nincs, a legutóbbit.',
  'help.guide.continue-writing.result':
    'A napló a mai napnál nyílik meg, vagy ha ma még nem írtál semmit, a mai nap előtti utolsó bejegyzésnél.',
  'help.guide.continue-writing.tip.1':
    'Ha egy utazás épp véget ért, e fölött „Az út épp véget ért” sáv jelenik meg: az „Útinapló létrehozása” olyan útinaplót indít, amelyben az az utazás már ki van jelölve, az „Elvetés” pedig ebben a böngészőben elrejti az ajánlatot.',

  // ── Screen: journey-detail ────────────────────────────────────────────────────────────
  'help.ctx.journey-detail.title': 'Napló',
  'help.ctx.journey-detail.summary':
    'Egy megnyitott útinapló: balra az idővonal napról napra, jobbra a térkép, amelyen ki- és bekapcsolhatod a terv, a rögzített adatok, a bejegyzések és a fotók rétegét. A fejlécben látod a darabszámokat, a Studiót, a javaslatok kapcsolóját és a ⋯ gombot az „Útinapló beállításai” ablakhoz. Bejegyzéseket az alatta lévő eszköztárral adhatsz hozzá.',
  'help.ctx.journey-detail.bullet.1':
    'Fejléc: vissza nyíl és állapotjelvény, borító, cím és alcím, a napok, helyek, bejegyzések és fotók száma, jobb oldalon pedig a Studio, a javaslatokat elrejtő vagy megjelenítő szem ikon és a ⋯ gomb az „Útinapló beállításai” ablakhoz.',
  'help.ctx.journey-detail.bullet.2':
    'Eszköztár: „Idővonal” és „Galéria” fül, „Keresés ebben az útinaplóban” és „Bejegyzés hozzáadása”. A „Galéria” fülön a „Bejegyzés hozzáadása” helyett „Feltöltés” látszik.',
  'help.ctx.journey-detail.bullet.3':
    'Idővonal: minden napnak saját része van a sorszámával, a helyek számával és egy + gombbal, amellyel bejegyzést adhatsz hozzá arra a napra. Alatta a bejegyzések kártyái fotókkal, hangulattal, időjárással és történettel, valamint az utazásokból származó szaggatott keretes javaslatkártyák, mindegyik egy × gombbal az elvetéshez.',
  'help.ctx.journey-detail.bullet.4':
    'Térkép: a tetején lévő rétegsávval kapcsolhatod a „Terv” (üres gombostűk és az utazások szaggatott GPX-útvonalai), a „Rögzített” (a Dawarichból megtartott folytonos útvonalak), a „Bejegyzések” (a nap színeivel jelölt, időrendben vékony szaggatott vonallal összekötött gombostűk) és a „Fotók” réteget. A mellettük lévő (i) minden jelet elmagyaráz.',
  'help.ctx.journey-detail.bullet.5':
    '„Útinapló beállításai” (⋯): borító, név és alcím, állapot, GPX-nyomvonalak, rögzített napok, helyek a fotókból, bejegyzésmezők, elvetett javaslatok, szinkronizált utazások, közreműködők és az, hogy egy utazás mely tagjai kapnak hozzáférést, nyilvános megosztás, archiválás és törlés.',
  'help.ctx.journey-detail.bullet.6':
    'Egy hosszú idővonal alján ott a „Vissza a tetejére”, egy napszámláló, amellyel bármelyik napra vagy bejegyzésre ugorhatsz, és az „Ugrás az utolsó bejegyzéshez”.',
  // add-entry
  'help.guide.add-entry.title': 'Bejegyzés írása',
  'help.guide.add-entry.goal': 'Írd le egy nap történetét címmel, szöveggel, hangulattal és időjárással.',
  'help.guide.add-entry.step.1':
    'Kattints az eszköztáron a „Bejegyzés hozzáadása” gombra, vagy egy nap fejlécének jobb szélén a + gombra, ha arra a napra szeretnél írni.',
  'help.guide.add-entry.step.2':
    'Adj címet a bejegyzésnek, és írd meg a szöveget. A szöveg fölötti eszköztárral félkövér és dőlt formázást, címsorokat, idézeteket, linkeket és listákat adhatsz hozzá Markdownban.',
  'help.guide.add-entry.step.3':
    'A jobb oldali oszlopban ellenőrizd a dátumot és az időpontot, keress helyszínt, vagy használd a jelenlegi pozíciódat, és válassz hangulatot és időjárást.',
  'help.guide.add-entry.step.4': 'Kattints a „Mentés” gombra.',
  'help.guide.add-entry.result':
    'A bejegyzés a saját napjánál megjelenik az idővonalon, a térképen pedig gombostűként. A fejlécben lévő számok frissülnek.',
  'help.guide.add-entry.tip.1':
    'Ha egy javaslatba írsz, ugyanazt a szerkesztőt használod, csak a hely már be van állítva.',
  'help.guide.add-entry.tip.2':
    'A hellyel rendelkező bejegyzésnél ott a „Kihagyás az útvonalból” lehetőség: a bejegyzés a naplóban marad, de nem számít bele a távolságba és az országokba, és a Studio térképén sem jelenik meg.',
  // entry-photos
  'help.guide.entry-photos.title': 'Fotók és videók hozzáadása egy bejegyzéshez',
  'help.guide.entry-photos.goal': 'Adj fotókat egy naphoz; az első lesz a bejegyzés borítója.',
  'help.guide.entry-photos.step.1':
    'Nyisd meg a bejegyzés menüjét a kártyáján lévő ⋯ ikonnal, és válaszd a „Szerkesztés” lehetőséget.',
  'help.guide.entry-photos.step.2':
    'Kattints a „Fotók feltöltése” gombra, és válaszd ki a fájlokat. A „Galériából” az útinapló galériájában már meglévő képek közül választ, a „Külső fotók” pedig a csatlakoztatott Immich vagy Synology könyvtárban keres az adott napra.',
  'help.guide.entry-photos.step.3':
    'A borító kiválasztásához vidd az egeret egy kép fölé, kattints a „Legyen az 1.” gombra, majd a „Mentés” gombra.',
  'help.guide.entry-photos.result':
    'A fotók megjelennek a kártyán és a galériában. Mindenhol az első fotó lesz a bélyegkép.',
  'help.guide.entry-photos.tip.1':
    'Videót ugyanígy adhatsz egy bejegyzéshez: mp4, m4v, webm vagy mov formátumban, legfeljebb 500 MB-ig. A videók változtatás nélkül tárolódnak.',
  'help.guide.entry-photos.tip.2':
    'Az iPhone-ról származó HEIC fájlokat feltöltéskor JPEG formátumra alakítjuk, ezzel elvesznek a GPS- és fényképezőgép-adataik.',
  // suggestions
  'help.guide.suggestions.title': 'Javaslatok felhasználása vagy elvetése',
  'help.guide.suggestions.goal':
    'Készíts bejegyzéseket az utazásaid helyeiből, és vesd el azokat, amelyekről nem fogsz írni.',
  'help.guide.suggestions.step.1':
    'A javaslat egy szaggatott szegélyű kártya „Bejegyzés hozzáadása” gombbal: egy összekapcsolt utazás helye azon a napon, amelyre tervezték. Rákattintva megnyílik a szerkesztő, a hely és a nap már ki van töltve.',
  'help.guide.suggestions.step.2':
    'Ha egy kártyára nincs szükséged, kattints a jobb szélén lévő × jelre. A kártya lekerül az idővonalról, de nem törlődik, és az utazás szinkronizálása sem javasolja újra.',
  'help.guide.suggestions.step.3':
    'Meggondoltad magad? A fejléc ⋯ gombjával nyisd meg az „Útinapló beállításai” ablakot: az „Elvetett javaslatok visszahozása” mutatja, hány ilyen van, és mindet visszahozza.',
  'help.guide.suggestions.result':
    'Az idővonalon csak azok a bejegyzések maradnak, amelyeket meg szeretnél írni. Olvasás közben a fejléc szem ikonjával egyszerre elrejtheted az összes javaslatot.',
  'help.guide.suggestions.tip.1': 'Ha egy hely két napon is szerepel a tervben, mindkét napra kapsz róla javaslatot.',
  'help.guide.suggestions.tip.2': 'A javaslatok sosem számítanak bele a statisztikába, csak a megírt bejegyzések.',
  // add-on-day
  'help.guide.add-on-day.title': 'Bejegyzés hozzáadása egy korábbi naphoz',
  'help.guide.add-on-day.goal': 'Írj egy elmúlt napról úgy, hogy utólag ne kelljen módosítanod a dátumot.',
  'help.guide.add-on-day.step.1': 'Kattints a nap fejlécének jobb szélén lévő + gombra.',
  'help.guide.add-on-day.step.2': 'A szerkesztő ezzel a dátummal nyílik meg. Írj, majd ments a szokásos módon.',
  'help.guide.add-on-day.result': 'A bejegyzés azonnal a megfelelő napra kerül.',
  'help.guide.add-on-day.tip.1':
    'Ha egy napon belül módosítanád a sorrendet, vidd az egeret egy bejegyzés fölé: a bal oldalán megjelenik a „Mozgatás felfelé” és a „Mozgatás lefelé”.',
  // pros-cons
  'help.guide.pros-cons.title': 'Értékelés hozzáadása',
  'help.guide.pros-cons.goal': 'Foglald össze a napot: mi volt nagyszerű, és mi nem.',
  'help.guide.pros-cons.step.1':
    'A szerkesztőben a történet alatt találod az „Előnyök és hátrányok” részt. Írj egy pontot az „Előnyök” vagy a „Hátrányok” mezőbe, a következőhöz pedig használd a „Másik hozzáadása” gombot.',
  'help.guide.pros-cons.step.2':
    'Mentsd el. A kártyán a „Továbbiak” két rövid listában mutatja a történetet és az értékelést.',
  'help.guide.pros-cons.result':
    'A felfelé és lefelé mutató hüvelykujjak a történet alatt jelennek meg, így gyorsan átláthatod őket.',
  'help.guide.pros-cons.tip.1':
    'Ha egy útinaplóban nem használsz értékelést, a részt az „Útinapló beállításai” alatt, „A bejegyzés mezői” résznél kapcsolhatod ki.',
  // search-journey
  'help.guide.search-journey.title': 'Keresés egy hosszú naplóban',
  'help.guide.search-journey.goal':
    'Találd meg a keresett bejegyzést anélkül, hogy hetekig tartó bejegyzéseken kellene végiggörgetned.',
  'help.guide.search-journey.step.1':
    'Írj az eszköztár „Keresés ebben az útinaplóban” mezőjébe. Az idővonal gépelés közben szűkül a címek, a történetek, a helyek és a címkék alapján. Az ékezetek és a kis- és nagybetűk nem számítanak.',
  'help.guide.search-journey.step.2':
    'Ha inkább egy napra ugranál, kattints az idővonal alján lévő napszámlálóra, a „Vissza a tetejére” és az „Ugrás az utolsó bejegyzéshez” között.',
  'help.guide.search-journey.result':
    'Az idővonal a kiválasztott naphoz vagy bejegyzéshez görget, a térkép pedig odaugrik. Amíg nem törlöd a keresőmezőt, csak a találatok látszanak.',
  'help.guide.search-journey.tip.1':
    'A folyamatban lévő útinapló a mai oldalon nyílik meg, így az aktuális oldal általában már eleve látszik.',
  'help.guide.search-journey.tip.2':
    'A fejlécben lévő szem ikon elrejti a javaslatokat, így csak az általad írt bejegyzések látszanak.',
  // gallery-map
  'help.guide.gallery-map.title': 'A galéria és a térkép böngészése',
  'help.guide.gallery-map.goal': 'Nézd meg a teljes útinaplót képekben és helyekként a térképen.',
  'help.guide.gallery-map.step.1':
    'Az eszköztáron válts a „Galéria” nézetre. Itt látod az összes bejegyzés összes fotóját, valamint a közvetlenül a galériába feltöltött képeket. Kattints egy képre, hogy megnyisd a nagyított nézetben.',
  'help.guide.gallery-map.step.2':
    'A jobb oldali „Feltöltés” gombbal képeket adhatsz a galériához. Ha az Immich vagy a Synology csatlakoztatva van, a könyvtár nevét viselő gombbal onnan is választhatsz képeket.',
  'help.guide.gallery-map.result':
    'A gombostűk a napjuk színét kapják, és vékony szaggatott vonal köti össze őket időrendben. A térkép tetején lévő rétegsávval választhatod ki, mi jelenjen meg.',
  'help.guide.gallery-map.tip.1':
    'Az utazás GPX-nyomvonalai szaggatott vonalként jelennek meg a térkép „Terv” rétegén. Az „Útinapló beállításai” ablakban „Az utazások összes GPX-nyomvonalának megjelenítése” beállítással kikapcsolhatod őket.',
  'help.guide.gallery-map.tip.2':
    'A helyadattal rendelkező galériafotók a nyilvános térképen is megjelennek, ha a „Galéria” és a „Térkép” is meg van osztva.',
  // entry-fields
  'help.guide.entry-fields.title': 'Bejegyzésmezők kikapcsolása',
  'help.guide.entry-fields.goal': 'A szerkesztőben csak azok a mezők jelenjenek meg, amelyeket ez az útinapló használ.',
  'help.guide.entry-fields.step.1':
    'A fejléc jobb felső sarkában kattints a ⋯ gombra, és megnyílik az „Útinapló beállításai” ablak.',
  'help.guide.entry-fields.step.2':
    '„A bejegyzés mezői” alatt kapcsold ki a „Hangulat”, az „Időjárás” vagy az „Előnyök és hátrányok” mezőt.',
  'help.guide.entry-fields.result':
    'A szerkesztőben ezek a mezők már nem jelennek meg. Semmi sem vész el abból, amit írtál: ha visszakapcsolsz egy mezőt, a tárolt értékek újra látszanak. A megosztott útinapló ugyanezeket a mezőket rejti el.',
  'help.guide.entry-fields.tip.1': 'A kapcsolók útinaplónként állíthatók, így egy munkaút és egy nyaralás eltérhet.',
  // link-trip
  'help.guide.link-trip.title': 'Másik utazás csatolása',
  'help.guide.link-trip.goal': 'Egy másik utazás helyeinek hozzáadása a naplóhoz javaslatként.',
  'help.guide.link-trip.step.1':
    'A fejléc jobb felső sarkában kattints a ⋯ gombra, és megnyílik az „Útinapló beállításai” ablak.',
  'help.guide.link-trip.step.2': 'A „Szinkronizált utak” alatt kattints az „Út hozzáadása” gombra.',
  'help.guide.link-trip.step.3':
    'Keresd meg az utazást név vagy úti cél alapján, és kattints a mellette lévő „Csatolás” gombra.',
  'help.guide.link-trip.result':
    'Az utazás helyei javaslatként jelennek meg az idővonalon a saját napjukon, és a GPX-nyomvonalakkal együtt bekerülnek a térkép „Terv” rétegébe.',
  'help.guide.link-trip.tip.1':
    'Az összekapcsolt utazás melletti kuka rákérdezés után megszünteti a kapcsolatot; az általad írt bejegyzések megmaradnak.',
  'help.guide.link-trip.tip.2':
    'A naphoz kötött bejegyzések csak egyszer számítanak, akárhány utazás érinti is azt a napot.',
  // share-public
  'help.guide.share-public.title': 'Az útinapló nyilvános megosztása',
  'help.guide.share-public.goal': 'Adj csak olvasható linket azoknak, akiknek nincs TREK-fiókjuk.',
  'help.guide.share-public.step.1':
    'A fejléc ⋯ gombjával nyisd meg az „Útinapló beállításai” ablakot, és görgess a „Nyilvános megosztás” részhez.',
  'help.guide.share-public.step.2': 'Kattints a „Megosztó link létrehozása” gombra.',
  'help.guide.share-public.step.3':
    'Válaszd ki, mit lássanak a látogatók: „Idővonal”, „Galéria” és „Térkép”. A „Térkép” alatt az „Úti terv” a tervezett helyeket és útvonalakat, a „Rögzített útvonalak” pedig a rögzített napok útvonalait adja hozzá. A „Másolás” a vágólapra másolja a linket.',
  'help.guide.share-public.result':
    'Aki ismeri a linket, csak a bekapcsolt részeket látja; azok a mezők, amelyeket „A bejegyzés mezői” alatt kikapcsoltál, ott is rejtve maradnak.',
  'help.guide.share-public.tip.1':
    'A fotók csak akkor jelennek meg a nyilvános térképen, ha a „Galéria” és a „Térkép” is be van kapcsolva. Ha a „Térkép” ki van kapcsolva, a szerver a fotók elküldése előtt eltávolítja a koordinátáikat.',
  'help.guide.share-public.tip.2': 'A megosztás leállításához kattints a „Másolás” melletti „Link törlése” gombra.',
  // contributors
  'help.guide.contributors.title': 'Közös írás',
  'help.guide.contributors.goal': 'Engedd, hogy egy útitársad is hozzáadja a saját bejegyzéseit és fotóit.',
  'help.guide.contributors.step.1':
    'A fejléc ⋯ gombjával nyisd meg az „Útinapló beállításai” ablakot, és keresd meg a „Közreműködők” részt.',
  'help.guide.contributors.step.2':
    'Kattints a „Közreműködő meghívása” gombra, és keresd meg a felhasználót név vagy e-mail-cím alapján.',
  'help.guide.contributors.step.3': 'Válaszd a „Néző” vagy a „Szerkesztő” szerepet, és kattints a „Meghívás” gombra.',
  'help.guide.contributors.result':
    'Az útinapló megjelenik a listájukban, a bejegyzéseiknél pedig a nevük látszik. Közreműködő eltávolításához kattints a mellette lévő × jelre.',
  'help.guide.contributors.tip.1':
    'A közreműködők ennek a TREK-nek a felhasználói lehetnek. Mindenki másnak ott a nyilvános link.',
  // studio
  'help.guide.studio.title': 'Az útinapló tördelése fotókönyvvé',
  'help.guide.studio.goal': 'Készíts a naplóból nyomtatható oldalakat.',
  'help.guide.studio.step.1': 'Kattints a fejlécben a „Studio” gombra. A tervező az útinapló fölött nyílik meg.',
  'help.guide.studio.step.2':
    'A visszatéréshez kattints a felső sáv jobb szélén lévő × jelre. Oda jutsz vissza, ahol voltál.',
  'help.guide.studio.result':
    'A sáv a paneleivel balra van, az oldalpár a munkaterületen, a tulajdonságok pedig jobbra. Az Automatikus elrendezés a bejegyzéseidből építi fel a könyvet. Az Exportálás nyomtatásra kész PDF-et készít.',
  'help.guide.studio.tip.1': 'A Studióhoz legalább 1024 px széles ablak kell, telefonon nem érhető el.',
  'help.guide.studio.tip.2':
    'A könyvhöz ugyanaz a hozzáférés tartozik, mint az útinaplóhoz: aki olvashatja az útinaplót, megnyithatja a könyvet, aki szerkesztheti, mentheti is.',
  // archive-journey
  'help.guide.archive-journey.title': 'Útinapló archiválása vagy törlése',
  'help.guide.archive-journey.goal': 'Zárj le egy befejezett útinaplót, vagy töröld véglegesen.',
  'help.guide.archive-journey.step.1':
    'A fejléc jobb felső sarkában kattints a ⋯ gombra, és megnyílik az „Útinapló beállításai” ablak.',
  'help.guide.archive-journey.step.2':
    'Alul az „Út archiválása” lezárja az útinaplót, és archiváltként jelöli meg; az „Út visszaállítása” visszaállítja. A „Törlés” megerősítés után az összes bejegyzéssel és fotóval együtt törli.',
  'help.guide.archive-journey.result':
    'Az archivált útinapló továbbra is olvasható és megosztható; csak már nem a mai napnál nyílik meg.',
  'help.guide.archive-journey.tip.1':
    'A törlés nem vonható vissza, és nem érinti azokat az utazásokat, amelyekhez az útinapló kapcsolódott.',
  'help.guide.archive-journey.tip.2': 'A borító, a név és az alcím ugyanennek az ablaknak a tetején található.',
  'help.guide.journey-status.title': 'Útinapló állapotának beállítása',
  'help.guide.journey-status.goal':
    'Te magad jelöld meg az útinaplót vázlatként, élőként vagy befejezettként, ahelyett hogy az utazásai dátumai döntenének.',
  'help.guide.journey-status.step.1':
    'Az útinapló fejlécének jobb felső sarkában kattints a ⋯ gombra, és megnyílik az „Útinapló beállításai” ablak.',
  'help.guide.journey-status.step.2':
    'Az „Állapot” alatt válaszd a „Vázlat”, az „Élő” vagy a „Befejezett” lehetőséget. A választás azonnal mentődik.',
  'help.guide.journey-status.result':
    'Az útinapló a kiválasztott állapotot kapja: a „Vázlat” és a „Befejezett” jelvényként jelenik meg a kártyáján és a fejlécében, az „Élő” útinapló pedig az útinaplólista tetején lévő sávban látszik.',
  'help.guide.journey-status.tip.1':
    'Az „Automatikus” ismét a kapcsolt utazások dátumait követi. Kapcsolt utazás nélkül az automatikus útinapló vázlat marad.',
  'help.guide.journey-status.tip.2':
    'A kézzel beállított állapot addig marad, amíg meg nem változtatod, akkor is, ha az utazás dátumai módosulnak.',

  // ── Screen: journey-studio ────────────────────────────────────────────────────────────
  'help.ctx.journey-studio.title': 'Studio', // same-as-en
  'help.ctx.journey-studio.summary':
    'A TREK Studio nyomtatható fotókönyvvé tördeli az útinaplót. A napló fölött nyílik meg: balra a sáv a paneleivel, középen az éppen szerkesztett oldalpár, jobbra a tulajdonságai. Az Automatikus elrendezés a bejegyzéseidből elkészíti az első vázlatot, egy téma színeket és betűtípusokat ad a könyvnek, az asszisztens pedig veled együtt tervezhet oldalakat. Ezután mindent áthelyezhetsz, körbevághatsz és átformázhatsz, és minden lépés visszavonható.',
  'help.ctx.journey-studio.bullet.1':
    'Felső sáv: balra az útinapló borítója és neve. Jobbra: ki van még a könyvben és el van-e mentve, az oldalformátum, a visszavonás, az újra és a beillesztés, az Automatikus elrendezés, az asszisztens, a súgó, az Exportálás és a Studiót bezáró gomb.',
  'help.ctx.journey-studio.bullet.2':
    'Bal oldali sáv: Oldalak, Tartalom (az útinapló fotói és bejegyzései), Elrendezések, Elemek (szöveg, alakzatok, vonalak, keretek, ikonok és matricák), Utazás (az útinaplóból készült számok, térképek, országok és jelek), alattuk külön pedig Téma és Rétegek.',
  'help.ctx.journey-studio.bullet.3':
    'Munkaterület: az aktuális oldalpár a kifutóval és a biztonsági margóval, alatta a nagyítósáv az Illesztés a nézethez, a Könyvnézet és az Oldalpár letöltése gombokkal.',
  'help.ctx.journey-studio.bullet.4':
    'Tulajdonságok jobb oldalon: minden a kijelölt elemről, a helyzettől, mérettől és vágástól a színekig, effektekig, rétegsorrendig és zárolásig. Ha nincs kijelölve semmi, az oldal hátterét, a témát, az oldalszámokat és a dokumentumot mutatja.',
  'help.ctx.journey-studio.bullet.5':
    'A könyv felépítése egy nyomtatott könyvét követi: borító, egy különálló első oldal a borító üres belső oldalával szemben, az oldalpárok, egy különálló utolsó oldal és a hátsó borító. Az oldalszámozás az első oldallal kezdődik, és nyomtatásban is úgy jelenik meg, ahogy látod.',
  'help.ctx.journey-studio.bullet.6':
    'Egyszerre többen is dolgozhattok a terven: mindenki látja a többiek mutatóját a nevükkel. Ha olyan verziót mentesz, amelyet közben más módosított, a TREK ütközést jelez, és nem írja felül a munkáját.',
  'help.ctx.journey-studio.bullet.7':
    'Téma: egyetlen megjelenés az egész könyvnek, a papírja, a tintája és három kiemelőszíne, a betűtípusai és a motívumai. A témához kapcsolt elemek követik, ha módosítod.',
  'help.ctx.journey-studio.bullet.8':
    'Asszisztens: ha egy adminisztrátor beállította az MI-t, a felső sávban lévő szövegbuborék megnyit egy asszisztenst, amely veled együtt tördeli az oldalakat, ír képaláírásokat és formázza át a könyvet. Minden módosítása egy visszavonási lépés.',
  // studio-auto-layout
  'help.guide.studio-auto-layout.title': 'A könyv automatikus összeállítása',
  'help.guide.studio-auto-layout.goal':
    'Egy kattintással készíts teljes első vázlatot a napló bejegyzéseiből és fotóiból.',
  'help.guide.studio-auto-layout.step.1': 'Kattints a felső sávban az „Automatikus elrendezés” gombra.',
  'help.guide.studio-auto-layout.step.2':
    'Válaszd „A teljes könyv” lehetőséget: lecseréli az összes oldalt, a címet és az oldalbeállítást viszont megtartja. Az „Ez az oldal” csak a képernyőn látható oldalpárt építi újra. Ezt csak olyan oldalpárnál kínálja fel, amely egy bejegyzésből készült.',
  'help.guide.studio-auto-layout.step.3':
    'Nézd végig az oldalsávot. Ha az előző változat jobban tetszett, a „Visszavonás” a teljes elrendezést visszaállítja.',
  'help.guide.studio-auto-layout.result':
    'Minden bejegyzéshez egy oldalpár készül, sorrendben, a fotói, a címe és a szövege automatikusan elhelyezve. Minden elem kapcsolatban marad a bejegyzésével, és vele együtt frissül, amíg nem szerkeszted.',
  'help.guide.studio-auto-layout.tip.1':
    'Mindkét lehetőség szokásos visszavonható lépés, így nyugodtan kipróbálhatod, majd visszavonhatod őket.',
  'help.guide.studio-auto-layout.tip.2':
    'Ha az automatikus elrendezés egy elemet egy bejegyzéshez kapcsol, az elem frissül, amikor szerkeszted a bejegyzést. Ha a „Tulajdonságok” panelen módosítod az elemet, a kapcsolat megszűnik.',
  // studio-pages
  'help.guide.studio-pages.title': 'Oldalpárok hozzáadása, áthelyezése és törlése',
  'help.guide.studio-pages.goal': 'Szerkeszd a könyvet oldalanként.',
  'help.guide.studio-pages.step.1':
    'Nyisd meg az Oldalak részt az oldalsávban. A miniatűrök sorrendben mutatják a könyvet: borító, első oldal, oldalpárok, utolsó oldal és hátsó borító. Az első és az utolsó oldal a borítójuk üres belső oldala mellett látszik, ahogy a bekötött könyv kinyílik.',
  'help.guide.studio-pages.step.2':
    'Az alul lévő „Oldal hozzáadása” új oldalpárt szúr be az utolsó oldal elé. A két bélyegkép közötti + jellel az adott helyre szúrhatsz be egyet.',
  'help.guide.studio-pages.step.3':
    'Ha egy bélyegkép fölé viszed az egeret, megjelennek a műveletei: „Előrébb”, „Hátrébb”, „Oldal duplikálása” és „Oldal törlése”. Egy bélyegképre kattintva az a kétoldalas nézet nyílik meg a munkaterületen.',
  'help.guide.studio-pages.result':
    'A borító, az első és az utolsó oldal, valamint a hátsó borító a helyén marad. Az új oldalpárok mindig ezek közé kerülnek.',
  'help.guide.studio-pages.tip.1':
    'A felső sáv „Könyvnézet” gombja ívekként mutatja az egész könyvet, úgy, ahogyan bekötik majd.',
  'help.guide.studio-pages.tip.2':
    'Az „Oldalszámok” a „Tulajdonságok” panel „Dokumentum” részében kapcsolhatók be, amikor semmi sincs kijelölve.',
  // studio-layouts
  'help.guide.studio-layouts.title': 'Elrendezés alkalmazása egy oldalpárra',
  'help.guide.studio-layouts.goal': 'Adj egy oldalpárnak kész elrendezést fotó- és szövegkeretekkel.',
  'help.guide.studio-layouts.step.1':
    'Nyisd meg az Elrendezések részt az oldalsávban. Elöl a megtervezett oldalak állnak: teljes borítók és oldalpárok a könyv témájában, amelyeket a stílusgombok egyetlen megjelenésre szűkítenek. Alattuk, ugyanabban a rácsban a Saját elrendezéseim és a Beépített következnek.',
  'help.guide.studio-layouts.step.2':
    'Kattints egyre. A munkaterületen lévő kétoldalas nézet megkapja ennek az elrendezésnek a kereteit, a meglévő fotóid és szövegeid pedig bekerülnek a keretekbe.',
  'help.guide.studio-layouts.result':
    'Az üres keretek a tartalom helyét jelölik: húzz rájuk egy fotót a „Tartalom” részből, vagy használd a „Hozzáadás ehhez az oldalhoz” lehetőséget.',
  'help.guide.studio-my-layouts.title': 'Oldal mentése saját elrendezésként',
  'help.guide.studio-my-layouts.goal': 'Használj újra egy elrendezést, amelyet a könyv más oldalain építettél fel.',
  'help.guide.studio-my-layouts.step.1':
    'Rendezd el az oldalt úgy, ahogy tetszik, majd nyisd meg az Elrendezések részt az oldalsávban.',
  'help.guide.studio-my-layouts.step.2':
    'Kattints az Oldal mentése elrendezésként gombra a Saját elrendezéseim alatt. Az oldal kártyaként jelenik meg a listában.',
  'help.guide.studio-my-layouts.tip.1':
    'Kattints a saját elrendezésedre egy másik oldalon, és az ugyanígy kapja meg az elrendezést, a saját fotóival és szövegeivel.',
  'help.guide.studio-my-layouts.result':
    'Az elrendezéseid a könyvvel együtt mentődnek, és azonos fajtájú oldalakon jelennek meg: a borítóé a borítókon, az oldalpáré az oldalpárokon.',
  'help.guide.studio-layouts.tip.1': 'Egy elrendezés is ugyanolyan visszavonható lépés, mint bármelyik másik.',
  // studio-content
  'help.guide.studio-content.title': 'Fotók és bejegyzések elhelyezése az oldalon',
  'help.guide.studio-content.goal': 'Tedd az oldalpárra az útinapló saját fotóit és bejegyzéseit.',
  'help.guide.studio-content.step.1':
    'Nyisd meg az oldalsávban a „Content” részt. A „Photos” az útinapló összes képét listázza, az „Entries” pedig a bejegyzéseket a szövegükkel együtt.',
  'help.guide.studio-content.step.2':
    'Húzz egy fotót a kétoldalas nézetre vagy egy üres keretbe, vagy kattints alatta a „Hozzáadás ehhez az oldalhoz” gombra. A „Fotók feltöltése” olyan képeket ad hozzá, amelyek még nincsenek az útinaplóban; az Immichből vagy a Synologyból egy csatlakoztatott könyvtárból választhatsz.',
  'help.guide.studio-content.step.3':
    'Egy bejegyzés alatt a „Title”, a „Story” és a „Place” szövegelemként helyezi az oldalra az adott szöveget. A dátum és a koordináták jelölésként kerülnek fel, és itt találod a bejegyzés fotóit is.',
  'help.guide.studio-content.result':
    'A ráhúzott fotóból fotóelem lesz. A szöveg kapcsolatban marad a bejegyzéssel, amíg nem szerkeszted.',
  'help.guide.studio-theme.title': 'Téma választása a könyvhöz',
  'help.guide.studio-theme.goal': 'Állítsd be az egész könyv színeit és betűtípusait egyszerre.',
  'help.guide.studio-theme.step.1':
    'Nyisd meg a Téma részt az oldalsávban. Minden kártya egy témát mutat kis oldalként: a papírját, a betűtípusát és a három kiemelőszínét.',
  'help.guide.studio-theme.step.2':
    'Kattints egy témára, hogy kipróbáld. A kártyák alatt módosíthatod a palettáját, más betűtípusokat választhatsz, valamint motívumokat és díszítést.',
  'help.guide.studio-theme.step.3':
    'Kattints az Alkalmazás a könyvre vagy az Alkalmazás erre az oldalra gombra a képernyőn látható oldalpárhoz.',
  'help.guide.studio-theme.tip.1':
    'A témához kapcsolt elemek átveszik a színeit és betűtípusait, és követik, ha módosítod. A A még nem kapcsoltakat is alakítsa át először a többit is összekapcsolja.',
  'help.guide.studio-theme.tip.2': 'A Színek a fotókból az útinapló képeiből épít palettát.',
  'help.guide.studio-theme.result':
    'A könyv minden kapcsolt színe és betűtípusa egyszerre változik, a téma alkalmazása pedig egyetlen visszavonási lépés.',
  'help.guide.studio-content.tip.1': 'A „Content” tetején lévő keresőmező mindkét listát szűri.',
  'help.guide.studio-content.tip.2':
    'Ha az asztalodról ráhúzol egy fájlt a munkaterületre, a TREK egy lépésben feltölti és el is helyezi.',
  // studio-elements
  'help.guide.studio-elements.title': 'Szöveg, alakzatok, ikonok és matricák hozzáadása',
  'help.guide.studio-elements.goal': 'Díszítsd az oldalpárt a fotókon és a történeteken túl.',
  'help.guide.studio-elements.step.1':
    'Nyisd meg az Elemek részt az oldalsávban. Hat fül rendezi, mit adhatsz hozzá: Szöveg, Alakzatok, Vonalak, Keretek, Ikonok és Matricák.',
  'help.guide.studio-elements.step.2':
    'Kattints egy szövegstílusra vagy megtervezett címre, egy alakzatra, egy vonalra, egy üres keretre, egy ikonra vagy egy matricára. Mindegyik az oldalpár közepére kerül, onnan pedig áthelyezheted.',
  'help.guide.studio-elements.result':
    'Szövegelembe dupla kattintással írhatsz; a betűtípust, a vastagságot, a méretet, a térközt és az igazítást a „Tulajdonságok” panelen állíthatod be.',
  'help.guide.studio-stickers.title': 'Díszítés matricákkal',
  'help.guide.studio-stickers.goal':
    'Adj hozzá illusztrációkat, a nevezetességektől és ételektől az állatokig és nyilakig.',
  'help.guide.studio-stickers.step.1': 'Nyisd meg az Elemek részt az oldalsávban, és válaszd a Matricák fület.',
  'help.guide.studio-stickers.step.2':
    'Keress egy szóra vagy böngéssz a polcokon, majd kattints egy matricára, hogy az oldalpárra helyezd.',
  'help.guide.studio-stickers.tip.1': 'Kijelölt matricánál a Tulajdonságok átszínezik a részeit, és tükrözik is.',
  'help.guide.studio-stickers.result': 'A matrica rajz, ezért bármilyen méretben éles marad.',
  'help.guide.studio-elements.tip.1': 'A keretek üres fotóhelyek: később tehetsz beléjük képet.',
  // studio-travel
  'help.guide.studio-travel.title': 'Térképek, számok, országok és jelek hozzáadása',
  'help.guide.studio-travel.goal': 'Alakítsd magát az utazást megtervezett elemekké az oldalon.',
  'help.guide.studio-travel.step.1':
    'Nyisd meg az Utazás részt az oldalsávban. Négy fül rendezi, mit adhatsz hozzá: Számok, Térképek, Országok és Jelek.',
  'help.guide.studio-travel.step.2':
    'Minden kártya az elemet mutatja az utazásod saját számaival, a téma színeiben: egy összegzés plakátként, jegyként, útjelző táblaként vagy kilométeróraként, egy térkép számozott megállókkal vagy egy országra szabva, egy ország bélyegként, képeslapként vagy tűként, egy dátum vagy egy távolság bélyegként, címkeként vagy szalagként.',
  'help.guide.studio-travel.step.3':
    'Kattints egy kártyára. Az elem az oldalpár közepére kerül, onnan pedig áthelyezheted és átméretezheted.',
  'help.guide.studio-travel.result':
    'Az elem megjelenik az oldalpáron. A Tulajdonságok módosítják a kinézetét, és minden szám, térkép és ország frissül, amikor az utazás változik.',
  'help.guide.studio-text-effects.title': 'Effektek hozzáadása a szöveghez',
  'help.guide.studio-text-effects.goal': 'Adj egy címnek körvonalat, árnyékot, ívet vagy mintával kitöltött betűket.',
  'help.guide.studio-text-effects.step.1': 'Kattints egy szövegelemre az oldalon, hogy kijelöld.',
  'help.guide.studio-text-effects.step.2':
    'A Tulajdonságokban nyisd meg az Effektek részt, hogy körvonalat, árnyékot vagy kiemelést adj hozzá, vagy színátmenettel vagy mintával töltsd ki a betűket. A Betűforma és elhelyezés ívbe hajlítja a sort, és a keretéhez igazítja.',
  'help.guide.studio-text-effects.tip.1':
    'A Kerethez igazítás addig kicsinyíti a szöveget, amíg belefér a keretébe, így egy hosszú cím sosem lóg ki.',
  'help.guide.studio-text-effects.result':
    'Az effekt a szöveggel együtt rajzolódik ki, nyomtatásban ugyanúgy, mint a képernyőn.',
  'help.guide.studio-background.title': 'Az oldal hátterének módosítása',
  'help.guide.studio-background.goal':
    'Fesd be az oldalt egy színnel, színátmenettel vagy mintával, vagy tégy alá egy fotót.',
  'help.guide.studio-background.step.1':
    'Kattints az oldal egy üres részére, hogy semmi ne legyen kijelölve. Az Oldal háttere a Tulajdonságok tetején van.',
  'help.guide.studio-background.step.2':
    'Válaszd a Papír, Egyszínű, Színátmenet vagy Minta lehetőséget és egy színt, vagy kattints egy fotóra a Fotó háttérként alatt.',
  'help.guide.studio-background.tip.1':
    'Az Alkalmazás minden oldalra ugyanazt a hátteret adja a könyv minden oldalának.',
  'help.guide.studio-background.result': 'A háttér belenyúlik a kifutóba, ezért nyomtatásban az oldal széléig ér.',
  'help.guide.studio-layers.title': 'Rendezés, elrejtés és zárolás rétegekkel',
  'help.guide.studio-layers.goal': 'Lásd az oldalpár minden elemét rétegsorrendben, és dolgozz velük ott.',
  'help.guide.studio-layers.step.1': 'Nyisd meg a Rétegek részt az oldalsávban. A lista teteje az oldal eleje.',
  'help.guide.studio-layers.step.2':
    'Húzz át egy sort az átrendezéshez, a szemmel elrejthetsz egy elemet, a zárral pedig a helyén tarthatod. Jelölj ki többet, és csoportosítsd őket, hogy együtt mozgathasd őket.',
  'help.guide.studio-layers.tip.1': 'Kattints duplán egy sorra, hogy az elem saját nevet kapjon.',
  'help.guide.studio-layers.tip.2': 'Az elrejtett elemek kimaradnak a PDF-ből.',
  'help.guide.studio-layers.result':
    'A zsúfolt oldalak is könnyen szerkeszthetők maradnak, a kész részeket pedig nem lehet véletlenül elmozdítani.',
  'help.guide.studio-travel.tip.1':
    'A Térképek alatt a Megállók az útvonal minden megállóját felsorolják. Kapcsolj ki egyet, ha ki szeretnéd hagyni a térképekből és a számokból, például az otthoni repülőteret.',
  'help.guide.studio-travel.tip.2':
    'Egy ország térképe csak az adott ország megállóit mutatja, így az ország akkor is kitölti az oldalt, ha az utazás hosszú repüléssel kezdődött.',
  // studio-properties
  'help.guide.studio-properties.title': 'A kijelölt elem szerkesztése',
  'help.guide.studio-properties.goal':
    'Mozgasd, vágd körbe, formázd és rendezd rétegekbe az elemeket a tulajdonságpanellel.',
  'help.guide.studio-properties.step.1':
    'Kattints egy elemre az oldalpáron. Megjelennek a méretezés és a forgatás fogópontjai; húzással mozgathatod az elemet.',
  'help.guide.studio-properties.step.2':
    'A jobb oldali „Tulajdonságok” panel a kijelölt elem beállításait mutatja: helyzet és méret, „Vágás” a fókuszponttal, amely meghatározza, mi marad a keretben, „Kitöltés” vagy „Illesztés”, „Megjelenés” szűrők, „Sarokkerekítés”, „Keret” stílusa, rétegsorrend és „Zárolás”.',
  'help.guide.studio-properties.step.3':
    'A „Duplikálás” és a „Törlés” a tulajdonságpanel tetején található. A felső sáv „Visszavonás” gombjával ezek bármelyikét visszacsinálhatod.',
  'help.guide.studio-properties.result':
    'A zárolt elemet nem lehet kijelölni vagy mozgatni az oldalon. Így a kész elrendezés védve marad, amíg a többi elemen dolgozol.',
  'help.guide.studio-properties.tip.1':
    'Shift+kattintással több elemet is kijelölhetsz, ilyenkor a tulajdonságpanel egyszerre szerkeszti őket.',
  'help.guide.studio-properties.tip.2':
    'Ha az automatikus elrendezés által elhelyezett elemet szerkesztesz, az már nem kapcsolódik a bejegyzéshez, és nem követi annak későbbi módosításait.',
  // studio-format
  'help.guide.studio-format.title': 'Oldalformátum kiválasztása',
  'help.guide.studio-format.goal': 'Állítsd be a könyv nyomtatási méretét, mielőtt elkészíted az elrendezést.',
  'help.guide.studio-format.step.1':
    'Kattints a felső sávban az oldalformátumra, a szerkesztőeszközök mellett. A formátum nevét és alakját mutatja.',
  'help.guide.studio-format.step.2':
    'Válassz a „Square 21 × 21 cm”, a „Square 30 × 30 cm”, az A4 vagy A5 fekvő vagy álló formátum közül, vagy adj meg egyéni szélességet és magasságot milliméterben. A kifutó és a biztonsági margó alatta állítható.',
  'help.guide.studio-format.result':
    'Minden oldalpár ebben a méretben jelenik meg, alapértelmezés szerint 3 mm kifutóval és 5 mm biztonsági margóval.',
  'help.guide.studio-format.tip.1':
    'Előbb állítsd be a formátumot, és csak utána futtasd az „Auto layout” funkciót. Az „Auto layout” a futtatáskor beállított formátumot használja.',
  'help.guide.studio-format.tip.2':
    'Kérdezd meg a nyomdát, milyen kifutó- és biztonsági margót használnak, és azokat add meg.',
  // studio-export
  'help.guide.studio-export.title': 'A könyv exportálása PDF-be',
  'help.guide.studio-export.goal': 'Készíts nyomdakész fájlt, vagy olyat, amelyet képernyőn olvashatsz.',
  'help.guide.studio-export.step.1': 'Kattints a felső sávban az „Exportálás” gombra.',
  'help.guide.studio-export.step.2':
    'Válaszd az „Önálló oldalak” lehetőséget, ilyenkor minden lapra egy oldal kerül olvasási sorrendben, ahogy a nyomdának kell, vagy a „Dupla oldalak” lehetőséget, ilyenkor két-két oldal kerül egymás mellé, ahogy a könyv kinyílik. A „Vágójelek” minden szélen hozzáadja a kifutót, és jelzi, hol kell vágni.',
  'help.guide.studio-export.step.3':
    'Kattints a „Nyomtatási nézet” gombra. A böngésződ megnyitja az oldalakat. A fájl elkészítéséhez válaszd a „Mentés PDF-ként” lehetőséget.',
  'help.guide.studio-export.result':
    'Egy PDF annyi ívvel, amennyit az ablak előre jelzett, a beállított oldalformátumban.',
  'help.guide.studio-export.tip.1': 'PDF-et csak számítógépen készíthetsz, ahogy a Studio is csak ott használható.',
  'help.guide.studio-export.tip.2':
    'Próbanyomathoz „Dupla oldalak” módban, vágójelek nélkül exportálj, a nyomdának pedig „Önálló oldalak” módban, vágójelekkel.',
  // studio-spread-file
  'help.guide.studio-spread-file.title': 'Oldalpár újrafelhasználása egy másik könyvben',
  'help.guide.studio-spread-file.goal': 'Másold át egy neked tetsző tervet az egyik útinapló könyvéből egy másikba.',
  'help.guide.studio-spread-file.step.1':
    'Amíg az oldalpár a munkaterületen van, kattints a nagyítósáv jobb végén az „Oldalpár letöltése” gombra. A fájl a tervet tartalmazza, a fotókat nem.',
  'help.guide.studio-spread-file.step.2':
    'A másik könyvben nyisd meg a „Pages” részt, kattints az „Oldal hozzáadása” melletti „Importálás” gombra, majd válaszd ki a fájlt.',
  'help.guide.studio-spread-file.result':
    'Az oldalpár a kereteivel és szövegstílusaival együtt importálódik. Húzd a keretekbe az új útinapló fotóit.',
  'help.guide.studio-spread-file.tip.1':
    'Ha egy fájl nem kétoldalas tervfájl, a TREK elutasítja, és megmutatja az okát.',

  // ── Screen: settings (all tabs) ───────────────────────────────────────────────────────
  'help.ctx.settings.title': 'Beállítások',
  'help.ctx.settings.summary':
    'A személyes beállításaid, a bal oldalsávban témánként egy füllel. A legtöbb kapcsoló azonnal érvénybe lép, amint átállítod. A „Mentés” gombbal rendelkező űrlapok csak akkor mentődnek, ha a „Mentés” gombra kattintasz. Az itteni beállítások senki más TREK-jét nem befolyásolják.',
  'help.ctx.settings.bullet.1':
    'Bal oldalsáv: „Általános”, „Megjelenés”, „Térkép”, „Értesítések”, „Integráció”, „Offline” és „Fiók”. A „Pluginok” akkor jelenik meg, ha van aktív plugin. A „Névjegy” akkor látszik, ha az üzemeltető nem rejtette el. A verziószám alul látható.',
  'help.ctx.settings.bullet.2':
    'Elsőként az „Általános” fül nyílik meg. Itt van a nyelv, a helynevek nyelve, a mértékegységek, az időformátum, a hét kezdőnapja és a megjelenítési pénznem, valamint az utazástérkép viselkedése. A „Megjelenés” fülön a téma, a színek, az olvashatóság, a szövegméret és az irányítópult-widgetek találhatók.',
  'help.ctx.settings.bullet.3':
    'A „Térkép” fülön a térképmotort és a stílusát állítod be; az „Értesítések” fülön azt, melyik esemény melyik csatornára menjen; az „Integráció” fülön fotókönyvtárakat, az AirTrailt, a Dawarichot és a wanderert csatlakoztathatod, és itt vannak az API-kulcsok és az MCP is; az „Offline” fülön azt, mit tároljon ez az eszköz.',
  'help.ctx.settings.bullet.4':
    'A „Fiók” részben a profilod, a jelszavad, a kétlépcsős azonosítás, a jelkulcsok és a fiók törlésének lehetősége található.',
  'help.ctx.settings-display.title': 'Megjelenés',
  'help.ctx.settings-display.summary':
    'Itt állíthatod be, mivel induljon a TREK, milyen nyelvet és mértékegységeket használjon, és hogyan működjön az utazástérkép és a foglalások. Minden módosítás azonnal érvénybe lép.',
  'help.ctx.settings-display.bullet.1':
    '„Indítás”: a „Kezdőoldal” az „Irányítópult” vagy az „Aktív utazás” lehet; az „Aktív utazás” választásakor a „Kezdő fül” határozza meg, melyik fülön nyíljon meg az utazás.',
  'help.ctx.settings-display.bullet.2':
    'Nyelv és régió: „Megjelenítési pénznem” (átváltás nélkül „Az utazás pénzneme”), „Nyelv”, „Helynevek”, „Hőmérséklet egység”, „Távolság egység”, „Időformátum” és „A hét kezdőnapja”.',
  'help.ctx.settings-display.bullet.3':
    'Utazás és térkép: „Helyek megnyitása itt”, „Dátum elöl a napok fejlécében”, „Útvonal-címkék a foglalásokhoz”, „Mindig jelenjenek meg a foglalási útvonalak”, „Kompakt jelölők a nem tervezett helyekhez”, „Helyek felfedezése a térképen”, „Foglalási kódok elrejtése” és „Útvonal optimalizálása a szállástól”.',
  'help.ctx.settings-appearance.title': 'Megjelenés',
  'help.ctx.settings-appearance.summary':
    'Így néz ki a TREK ennél a fióknál: világos vagy sötét téma, kiemelőszín, üveghatás és animációk, betűméret, és hogy mely widgetek jelenjenek meg az irányítópulton. Minden azonnal érvénybe lép, minden eszközön, ahol bejelentkezel.',
  'help.ctx.settings-appearance.bullet.1':
    'Téma: „Színmód” („Világos”, „Sötét” vagy „Automatikus”), a „Színséma”, és az „Egyéni” lehetőséggel saját kiemelőszín világos és sötét módhoz, kontrasztellenőrzéssel.',
  'help.ctx.settings-appearance.bullet.2':
    'Olvashatóság, „Kísérleti” jelöléssel: átlátszóság, „Mozgás csökkentése”, sűrűség és „Szövegméret”, egy csúszkával a „Minden” számára, és egy-egy csúszkával a nagy, közepes, normál és kis mérethez.',
  'help.ctx.settings-appearance.bullet.3':
    'Irányítópult-widgetek: külön kapcsolók az asztali („Címkép alatt”, „Jobb oldalsáv”) és a mobilos („Címkép alatt”, „Oldal alján”) nézethez.',
  'help.ctx.settings-appearance.bullet.4':
    'A kártyák alatti „Alapértelmezések visszaállítása” az egész fület visszaállítja az alapértékekre.',
  'help.ctx.settings-map.title': 'Térkép',
  'help.ctx.settings-map.summary':
    'Itt választod ki, melyik motor rajzolja az utazástervező és a napló térképeit, és milyen stílusban. A Leaflet a klasszikus raszteres térkép, a Mapbox GL saját tokennel 3D-s épületeket és domborzatot is mutat, a MapLibre GL token nélkül rajzol OpenFreeMap vektorcsempéket. Az Atlasz mindig a Leafletet használja.',
  'help.ctx.settings-map.bullet.1':
    '„Térkép szolgáltató”: Leaflet, Mapbox GL („Kísérleti”) vagy MapLibre GL, mindegyik egy rövid leírással.',
  'help.ctx.settings-map.bullet.2':
    'Leafletnél „Térkép sablon” és „CARTO API-kulcs”; a két GL-motornál „Térkép stílus”, a Mapbox GL-nél pedig emellett „Mapbox hozzáférési token”.',
  'help.ctx.settings-map.bullet.3':
    'Csak Mapbox GL-nél: „3D épületek és terep” és „Magas minőség mód”. A „Térkép mentése” gomb fölött élő előnézet látható. A „Térkép mentése” elmenti a választásodat.',
  'help.ctx.settings-notifications.title': 'Értesítések',
  'help.ctx.settings-notifications.summary':
    'Itt állíthatod be, hogyan ér el a TREK az alkalmazáson kívül. Felül egy táblázat dönti el, mi hová menjen: eseményenként egy sor, csatornánként egy oszlop. Alatta a webhook, az ntfy, az ezen az eszközön használt push és az esetleges plugincsatornák kártyái találhatók.',
  'help.ctx.settings-notifications.bullet.1':
    '„Értesítések”: csatornánként kapcsold be vagy ki az egyes eseményeket. A lakat azt jelzi, hogy a rendszergazda mindenkinél kikapcsolta az adott eseményt.',
  'help.ctx.settings-notifications.bullet.2':
    'Webhook URL: Discord-, Slack- vagy egyéni webhook, „Teszt” és „Mentés” gombbal.',
  'help.ctx.settings-notifications.bullet.3':
    'Ntfy: „Ntfy téma”, opcionálisan „Ntfy szerver URL” és hozzáférési token, „Teszt” és „Mentés” gombbal.',
  'help.ctx.settings-notifications.bullet.4':
    '„Push értesítések ezen az eszközön”: a „Bekapcsolás ezen az eszközön” csak erre a böngészőre vonatkozik; a „Teszt küldése” egy próbaértesítést küld. A plugincsatornán a „Beállítás” gomb látszik, amíg be nem állítod.',
  'help.ctx.settings-integrations.title': 'Integrációk',
  'help.ctx.settings-integrations.summary':
    'Minden, ami kívülről kapcsolódik a TREK-hez: fotókönyvtárak a naplóhoz, az AirTrail a repülésekhez, a Dawarich a ténylegesen bejárt helyekhez, a wanderer az útvonalakhoz, csak olvasható API-kulcsok más programokhoz és MCP az AI-kliensekhez. Egy másik szolgáltatáshoz csak akkor csatlakozhatsz, ha a rendszergazda bekapcsolta.',
  'help.ctx.settings-integrations.bullet.1':
    'Immich és Synology Photos, AirTrail, Dawarich és wanderer: minden kártyán ott a cím és a kulcs, a „Mentés” és a „Kapcsolat tesztelése” gomb, valamint egy „Csatlakozva” vagy „Nincs kapcsolódva” jelvény.',
  'help.ctx.settings-integrations.bullet.2':
    'API kulcsok: csak olvasható kulcsok a nyilvános API-hoz, mindegyik az általad kiválasztott területekre korlátozva, a kimásolható „Végpont” címmel.',
  'help.ctx.settings-integrations.bullet.3':
    '„MCP konfiguráció”: az „MCP végpont”, az „OAuth 2.1 kliensek” alatt a regisztrált klienseid, a kimásolható „Kliens konfiguráció” és az „Aktív OAuth munkamenetek” „Visszavonás” gombbal.',
  'help.ctx.settings-integrations.bullet.4':
    'API tokenek: az MCP-hez való csatlakozás régi módja, „Elavult” jelöléssel; helyette használd az „OAuth 2.1 kliensek” lehetőséget.',
  'help.ctx.settings-offline.title': 'Offline', // same-as-en
  'help.ctx.settings-offline.summary':
    'Mit tárol a TREK ezen az eszközön, hogy egy utazás kapcsolat nélkül is megnyíljon, és mi történik, ha egy offline végzett módosítás ütközik egy máshol végzett módosítással.',
  'help.ctx.settings-offline.bullet.1':
    '„Offline mód”: az „Offline mód kényszerítése” előbb mindent letölt, utána csak a gyorsítótárból dolgozik, a módosításaidat pedig sorba állítja.',
  'help.ctx.settings-offline.bullet.2':
    '„Felkészülés offline használatra”: a „Letöltés offline használatra” letölti az utazások adatait, a dokumentumokat és a térképcsempéket; az „Újraszinkronizálás most” kézzel indít újabb szinkronizálást.',
  'help.ctx.settings-offline.bullet.3':
    '„Mit tároljon offline”: „Térképcsempék offline tárolása”, valamint utazásonként egy kapcsoló. Egy befejezett utazás csak akkor kerül tárolásra, ha bekapcsolod.',
  'help.ctx.settings-offline.bullet.4':
    'A „Szinkronizálási ütközések” csak akkor jelenik meg, ha két módosítás ütközik, „Az enyém”, „A szerveré megtartása” és az „Ütközés esetén” lehetőséggel. Az „Offline gyorsítótár” mutatja az utazások, valamint a függő vagy sikertelen módosítások számát, „Próbáld újra”, „Elvetés” és „Gyorsítótár törlése” gombbal.',
  'help.ctx.settings-account.title': 'Fiók',
  'help.ctx.settings-account.summary':
    'A fiókod ezen a TREK-en és a bejelentkezésed módja: profilkép, felhasználónév és e-mail, jelszó, kétlépcsős hitelesítés és passkey-k. A fiók törlése a „Fiók” kártya alján található.',
  'help.ctx.settings-account.bullet.1':
    'Fiók: a képen lévő kamerára kattintva profilképet tölthetsz fel, a piros kukával eltávolíthatod. A felhasználónevet és az e-mail-címet a „Mentés” gomb menti.',
  'help.ctx.settings-account.bullet.2':
    '„Jelszó módosítása”: a jelenlegi jelszó, majd kétszer az új, a szabályok gépelés közben kipipálódnak, végül „Jelszó frissítése”. Ha ezen a TREK-en csak SSO-val lehet bejelentkezni, ez a kártya nem jelenik meg.',
  'help.ctx.settings-account.bullet.3':
    '„Kétfaktoros hitelesítés (2FA)” hitelesítő alkalmazással és tartalékkódokkal, valamint „Passkey-k” a jelszó nélküli bejelentkezéshez.',
  'help.ctx.settings-account.bullet.4':
    'A fiók törlése a „Fiók” kártya aljának bal oldalán található, és megerősítést kér. Az egyetlen rendszergazda nem törölheti saját magát.',
  // language-region
  'help.guide.language-region.title': 'Nyelv, mértékegységek és pénznem beállítása',
  'help.guide.language-region.goal': 'Használd a TREK-et a saját nyelveden, a régiódban szokásos formátumokkal.',
  'help.guide.language-region.step.1':
    'A „Nyelv és régió” részben válassz nyelvet a gombsorból („Nyelv”). A TREK azonnal átvált, minden eszközön, amelyen bejelentkezel.',
  'help.guide.language-region.step.2':
    'A „Helynevek” határozza meg, milyen nyelven jelenjenek meg a helykeresés eredményei, a javaslatok és a címek; az „Ugyanaz, mint az alkalmazás” a felület nyelvét követi.',
  'help.guide.language-region.result':
    'A dátumok, a távolságok és a pénzösszegek a megszokott formátumban jelennek meg. A „Költségek” fülön az összegek csak megjelenítésként látszanak a megjelenítési pénznemedben; a rögzített összegek nem változnak.',
  'help.guide.language-region.tip.1':
    '„Az utazás pénzneme” beállítással minden utazás a saját pénznemében látszik, átváltás nélkül.',
  'help.guide.language-region.tip.2': 'A nyelv a napok és hónapok nevét is meghatározza a Vacayben és az útinaplóban.',
  // travel-map-prefs
  'help.guide.travel-map-prefs.title': 'Az utazástérkép és a napfejlécek beállítása',
  'help.guide.travel-map-prefs.goal':
    'Válaszd ki, mit mutasson az utazástérkép, és hogyan nézzenek ki a napfejlécek, minden utazásnál.',
  'help.guide.travel-map-prefs.step.1':
    'Az „Utazás és térkép” részben a „Helyek megnyitása itt” határozza meg, melyik térképalkalmazást nyissa meg közvetlenül a navigációs gomb; a „Mindig kérdezzen” beállítással minden alkalommal választhatsz. A „Dátum elöl a napok fejlécében” minden nap fejlécében előre teszi a naptári dátumot.',
  'help.guide.travel-map-prefs.step.2':
    'A „Mindig jelenjenek meg a foglalási útvonalak” minden repülést, vonatot és egyéb foglalást megjelenít a térképen; az „Útvonal-címkék a foglalásokhoz” minden végpontra kiírja az állomás vagy a repülőtér nevét. A „Kompakt jelölők a nem tervezett helyekhez” kisebbre veszi a még egyik naphoz sem rendelt helyeket, így a tervezett megállók jobban látszanak.',
  'help.guide.travel-map-prefs.result':
    'Az utazás térképe minden utazásnál ezeket a beállításokat használja, amíg újra meg nem változtatod őket.',
  'help.guide.travel-map-prefs.tip.1':
    'Ezek a beállítások fiókra szólnak, nem utazásra. Egy megosztott utazás minden tagja a saját beállításait látja.',
  'help.guide.travel-map-prefs.tip.2':
    'A rendszergazda mindenkinek megadhatja az alapértelmezéseket; amit itt módosítasz, az csak rád vonatkozik.',
  // startup
  'help.guide.startup.title': 'Mivel induljon a TREK',
  'help.guide.startup.goal':
    'A TREK azzal az oldallal nyíljon meg, amelyet a legtöbbet használsz, ne mindig az irányítópulttal.',
  'help.guide.startup.step.1':
    'A „Megjelenés” fül tetején, az „Indítás” részben állítsd a „Kezdőoldal” értékét „Irányítópult” vagy „Aktív utazás” lehetőségre.',
  'help.guide.startup.step.2':
    'Az „Aktív utazás” választásakor megjelenik a „Kezdő fül”: válaszd ki, melyik fülön nyíljon meg az utazás.',
  'help.guide.startup.result': 'Amikor legközelebb megnyitod a TREK-et, közvetlenül ez az oldal jelenik meg.',
  'help.guide.startup.tip.1':
    'Az „Aktív utazás” a ma zajló utazás, vagy ha nincs ilyen, a következő. Ugyanez az utazás látszik felül az irányítópulton is.',
  // theme-scheme
  'help.guide.theme-scheme.title': 'Téma és kiemelőszín beállítása',
  'help.guide.theme-scheme.goal':
    'Legyen a TREK világos, sötét, vagy kövesse az eszközöd beállítását, a neked tetsző színben.',
  'help.guide.theme-scheme.step.1':
    'A „Téma” részben állítsd a „Színmód” értékét „Világos”, „Sötét” vagy „Automatikus” lehetőségre. Az „Automatikus” az eszközöd beállítását követi.',
  'help.guide.theme-scheme.step.2':
    'Válassz egy színsémát: Alapértelmezett, Nagy kontraszt, Indigó, Kékeszöld, Rózsa, Borostyán, Ibolya vagy Egyéni.',
  'help.guide.theme-scheme.step.3':
    'Az „Egyéni” lehetőséggel válassz egy színpontot, vagy állíts be saját kiemelőszínt külön a „Világos” és a „Sötét” módhoz. A mellettük lévő jelvény jelzi, hogy a kontraszt jó vagy alacsony.',
  'help.guide.theme-scheme.result':
    'A gombok, a linkek és a kiemelések mindenhol a kiemelőszínt használják, minden eszközön, amelyen bejelentkezel.',
  'help.guide.theme-scheme.tip.1':
    'A navigációs sávban is van egy gyors világos/sötét kapcsoló; ugyanazt a témát állítja be.',
  'help.guide.theme-scheme.tip.2': 'Ha az alapértelmezett séma nehezen olvasható, válaszd a „High contrast” sémát.',
  // readability
  'help.guide.readability.title': 'Olvashatóság és betűméret beállítása',
  'help.guide.readability.goal': 'Kevesebb üveghatás és animáció, több térköz vagy nagyobb betűméret.',
  'help.guide.readability.step.1':
    'Az „Olvashatóság” alatt az „Átlátszóság” az üvegpaneleket tömör felületekre cseréli, a „Mozgás csökkentése” minimálisra veszi az animációkat, a „Sűrűség” pedig a „Kényelmes” és a „Tömör” elrendezés közül választ.',
  'help.guide.readability.step.2':
    '„Szövegméret”: a „Minden” csúszkával egyszerre méretezheted az összes szöveget, vagy egyenként állíthatod a nagy, közepes, normál és kis méretet. Minden méretnél minta látszik, így húzás közben is látod az eredményt.',
  'help.guide.readability.result':
    'A módosítás egyszerre az egész alkalmazásra érvényes, a térképpanelekre és az útinaplóra is.',
  'help.guide.readability.tip.1':
    'A TREK egyes részei már most is kevesebb animációt használnak, ha az eszközödön be van kapcsolva a mozgáscsökkentés. A „Mozgás csökkentése” a többi részen is csökkenti az animációt.',
  'help.guide.readability.tip.2':
    'A szövegméret a tipográfiai szinteken keresztül érvényesül, így semmi sem vágódik le; ami már nem fér el, új sorba tördelődik.',
  // dashboard-widgets
  'help.guide.dashboard-widgets.title': 'Az irányítópult widgetjeinek kiválasztása',
  'help.guide.dashboard-widgets.goal': 'Csak a használt widgetek megjelenítése, külön asztali gépen és telefonon.',
  'help.guide.dashboard-widgets.step.1':
    'Az „Irányítópult-widgetek” alatt az asztali rész a „Címkép alatt” és a „Jobb oldalsáv” widgetjeit sorolja fel. A „Jobb oldalsáv” kikapcsolása elrejti az egész oszlopot, és középre igazítja az irányítópultot; a widgetjei halványan látszanak, amíg újra be nem kapcsolod.',
  'help.guide.dashboard-widgets.step.2':
    'A telefonos irányítópultnak saját kapcsolói vannak: „Címkép alatt” és „Oldal alján”.',
  'help.guide.dashboard-widgets.result':
    'Az irányítópult azonnal módosul. Ha a jobb oldali sáv ki van kapcsolva, az irányítópult középre kerül.',
  'help.guide.dashboard-widgets.tip.1':
    'Egy bővítmény widgetjei csak akkor jelennek meg, ha a rendszergazda bekapcsolta a bővítményt.',
  'help.guide.dashboard-widgets.tip.2':
    'Az irányítópult eszközönként megjegyzi, hogy rács- vagy listanézetet használsz, és milyen sorrendben rendezel.',
  // map-provider
  'help.guide.map-provider.title': 'Térképmotor és térképstílus kiválasztása',
  'help.guide.map-provider.goal': 'Válts a klasszikus térkép, a vektoros csempék és a Mapbox 3D-s térképe között.',
  'help.guide.map-provider.step.1':
    'A „Térkép szolgáltató” részben a Leaflet a klasszikus 2D-s térkép tetszőleges raszteres csempékkel, a Mapbox GL vektorcsempéket ad 3D-s épületekkel és domborzattal, a MapLibre GL pedig token nélkül használ OpenFreeMap vektorcsempéket.',
  'help.guide.map-provider.step.2':
    'Leaflethez válassz „Térkép sablon” értéket, GL-motorhoz „Térkép stílus” értéket, vagy illeszd be a saját URL-edet. A Mapbox GL-hez „Mapbox hozzáférési token”, a CARTO-sablonokhoz „CARTO API-kulcs” kell; az egyes mezők alatti link megmutatja, hol szerezhetsz ilyet.',
  'help.guide.map-provider.step.3':
    'Mapbox GL-nél kapcsold be a „3D épületek és terep” beállítást, és ha az eszközöd elég gyors, a „Magas minőség mód” beállítást is. Ellenőrizd az előnézetet, majd kattints a „Térkép mentése” gombra.',
  'help.guide.map-provider.result':
    'Az utazástervező és a napló térképei a választott motort használják. Az Atlasz mindig a Leafletet használja.',
  'help.guide.map-provider.tip.1':
    'Token nélkül a Mapbox GL helyett a Leaflet jelenik meg, hogy ne kapj üres térképet.',
  'help.guide.map-provider.tip.2':
    'Az offline tárolt térképcsempék attól a szolgáltatótól származnak, amelyik a letöltéskor aktív.',
  // notification-channels
  'help.guide.notification-channels.title': 'Értesítési csatornák beállítása',
  'help.guide.notification-channels.goal':
    'Kapd meg az utazási emlékeztetőket és a közös munkával kapcsolatos eseményeket a telefonodon vagy egy másik eszközben.',
  'help.guide.notification-channels.step.1':
    'Webhookhoz illessz be egy Discord-, Slack- vagy egyéni webhook URL-t, kattints a „Teszt”, majd a „Mentés” gombra.',
  'help.guide.notification-channels.step.2':
    'Az ntfy-hoz töltsd ki az „Ntfy téma” mezőt, és ha saját szervert üzemeltetsz, add meg az „Ntfy szerver URL” címet és egy hozzáférési tokent. A „Teszt” azonnal üzenetet küld, a „Mentés” elmenti a beállításokat.',
  'help.guide.notification-channels.step.3':
    'A felső „Értesítések” kártyán csatornánként kapcsold be vagy ki az egyes eseményeket. A lakat azt jelzi, hogy a rendszergazda mindenkinél kikapcsolta. A plugincsatornán a „Beállítás” gomb látszik, amíg be nem állítod; a „Teszt küldése” kipróbálja.',
  'help.guide.notification-channels.result':
    'Az eseményekről azokon a csatornákon kapsz értesítést, amelyeket bekapcsoltál. Az alkalmazáson belüli oszlop határozza meg, mi jelenjen meg a navigációs sáv csengőjénél.',
  'help.guide.notification-channels.tip.1':
    'Az utazás saját emlékeztetőjét, vagyis hogy hány nappal az indulás előtt érkezzen, az utazás szerkesztőűrlapján állíthatod be.',
  'help.guide.notification-channels.tip.2':
    'A rendszergazda mindenkinek beállíthat egy alapértelmezett ntfy-szervert; a témát ettől még te választod.',
  // photo-providers
  'help.guide.photo-providers.title': 'Fotókönyvtár csatlakoztatása',
  'help.guide.photo-providers.goal': 'Az útinapló töltse be a nap fotóit az Immichből vagy a Synology Photosból.',
  'help.guide.photo-providers.step.1':
    'Az „Integráció” részben keresd meg az Immich vagy a Synology Photos kártyáját, és add meg, amit kér: Immichnél a „Szerver URL” címet és egy API-kulcsot, Synology Photosnál felhasználónevet és jelszót. Az Immich feltöltéskor az útinapló fotóit az Immich-könyvtárba is be tudja másolni.',
  'help.guide.photo-providers.step.2':
    'Kattints a „Kapcsolat tesztelése”, majd a „Mentés” gombra. A jelvény „Csatlakozva” állapotra vált.',
  'help.guide.photo-providers.result':
    'A bejegyzésszerkesztő „Külső fotók” füle a csatlakoztatott könyvtárban a bejegyzés napjára keres, elöl a bejegyzés helyszínéhez legközelebb készült képekkel.',
  'help.guide.photo-providers.tip.1':
    'A kapcsolat csak a te fiókodhoz tartozik: az útinapló többi tagja a saját könyvtárát csatlakoztatja.',
  'help.guide.photo-providers.tip.2':
    'Olyan szolgáltató is működik, amelynek fotóiban nincs GPS-adat. Ilyenkor a lista időrendben jelenik meg.',
  // api-keys
  'help.guide.api-keys.title': 'API-kulcs létrehozása',
  'help.guide.api-keys.goal': 'Más programok is olvashassák az utazásaidat a nyilvános API-n keresztül.',
  'help.guide.api-keys.step.1':
    'Az „API kulcsok” részben kattints a „Kulcs létrehozása” gombra, adj neki olyan nevet („Név”), amelyből kiderül, hol fogod használni, és a „Mit olvashat ez a kulcs” alatt csak a szükséges területeket hagyd bejelölve. Kattints a „Létrehozás” gombra.',
  'help.guide.api-keys.step.2':
    'Másold ki a kulcsot az „API-kulcs létrehozva” ablakból: csak egyszer jelenik meg. Kattints a „Kész” gombra. A hívandó „Végpont” a lista alatt látható.',
  'help.guide.api-keys.result':
    'A kulccsal rendelkező program olvashatja a kiválasztott területeket, de soha semmit nem módosíthat. A listában látod, mikor jött létre és mikor használták utoljára az egyes kulcsokat, a kukával pedig törölheted őket.',
  'help.guide.api-keys.tip.1':
    'Minden eszközhöz használj külön kulcsot, így egy kulcsot úgy vonhatsz vissza, hogy a többi eszközt nem érinti.',
  'help.guide.api-keys.tip.2':
    'Ha azt szeretnéd, hogy egy AI-kliens módosíthasson is, használd inkább az MCP-t OAuth-tal; az API-kulcsok csak olvasni tudnak.',
  // mcp-oauth
  'help.guide.mcp-oauth.title': 'AI-asszisztens csatlakoztatása MCP-n keresztül',
  'help.guide.mcp-oauth.goal':
    'Adj hozzáférést az utazásaidhoz a Claude-nak, egy fejlesztőkörnyezetnek vagy más MCP-kliensnek.',
  'help.guide.mcp-oauth.step.1': 'Az „MCP konfiguráció” részben másold ki a kliensedhez az „MCP végpont” címét.',
  'help.guide.mcp-oauth.step.2':
    'Az „OAuth 2.1 kliensek” alatt kattints az „Új kliens” gombra, és válassz egy gyors előbeállítást, például Claude Desktop vagy Cursor, vagy töltsd ki magad az alkalmazás nevét, az átirányítási URI-kat és az engedélyezett hatóköröket; böngésző nélküli szerverhez válaszd a gépi klienst. Kattints a „Kliens regisztrálása” gombra, és másold ki a kliens titkát: csak egyszer jelenik meg.',
  'help.guide.mcp-oauth.step.3':
    'Minden kliensnél ott a „Titok megújítása” és a „Kliens törlése”. Az „Aktív OAuth munkamenetek” a bejelentkezett klienseket sorolja fel, „Visszavonás” gombbal. A „Kliens konfiguráció” lenyitva egy kész kódrészletet mutat a JSON-t használó kliensekhez.',
  'help.guide.mcp-oauth.result':
    'A kliens a nevedben olvashatja és módosíthatja azt, amit a jogosultságai engednek, és minden művelet a te neved alatt jelenik meg.',
  'help.guide.mcp-oauth.tip.1':
    'A jogosultságok korlátozzák, mit tehet egy kliens: csak olvasási jogot adj neki, amíg nincs szüksége többre.',
  'help.guide.mcp-oauth.tip.2':
    'Az adminisztrátor a teljes példányon kikapcsolhatja az MCP-t. Ilyenkor ez a rész nem jelenik meg.',
  // offline-prepare
  'help.guide.offline-prepare.title': 'Utazások elérhetővé tétele offline',
  'help.guide.offline-prepare.goal':
    'Mentsd el az utazásaidat és a térképeiket erre az eszközre, mielőtt megszakad a kapcsolat.',
  'help.guide.offline-prepare.step.1':
    'A „Mit tároljon offline” részben hagyd bekapcsolva a „Térképcsempék offline tárolása” beállítást, és kapcsold be azokat az utazásokat, amelyeket ezen az eszközön szeretnél elérni. Egy befejezett utazás csak akkor kerül tárolásra, ha bekapcsolod.',
  'help.guide.offline-prepare.step.2':
    'Fent a „Felkészülés offline használatra” részben kattints a „Letöltés offline használatra” gombra. Ez letölti az utazások adatait, a dokumentumokat és a térképcsempéket, és jelzi, hány utazást tárolt.',
  'help.guide.offline-prepare.step.3':
    'Az „Offline mód kényszerítése” még egyszer letölt mindent, majd csak erről az eszközről működik, így indulás előtt ellenőrizheted, hogy minden megvan-e.',
  'help.guide.offline-prepare.result':
    'Az utazások kapcsolat nélkül is megnyílnak. A módosításaid várólistára kerülnek, és akkor mennek el, amikor újra online leszel.',
  'help.guide.offline-prepare.tip.1':
    'A legtöbb helyet a térképcsempék foglalják; ha kikapcsolod őket, csak az utazások adatai és a dokumentumok maradnak.',
  'help.guide.offline-prepare.tip.2':
    'A legzökkenőmentesebb offline indításhoz telepítsd a TREK-et alkalmazásként a böngészőből.',
  // offline-conflicts
  'help.guide.offline-conflicts.title': 'Melyik verzió maradjon meg szinkronizálási ütközéskor',
  'help.guide.offline-conflicts.goal':
    'Válaszd ki, hogyan oldja fel a TREK az offline végzett és a máshol végzett módosítás közötti ütközést.',
  'help.guide.offline-conflicts.step.1':
    'Ha egy offline végzett módosításod ütközik egy újabbal, az „Offline” fül tetején megjelenik a „Szinkronizálási ütközések” rész. Minden módosításnál kattints „Az enyém” vagy „A szerveré megtartása” gombra.',
  'help.guide.offline-conflicts.step.2':
    'Ugyanezen a kártyán az „Ütközés esetén” határozza meg, mi történjen legközelebb: „Kérdezz rá minden alkalommal”, „Mindig az én verzióm megtartása” vagy „Mindig a szerver verziójának megtartása”.',
  'help.guide.offline-conflicts.result':
    'A „Kérdezz rá minden alkalommal” beállításnál az ütközés a „Szinkronizálási ütközések” között marad, amíg nem döntesz. A másik két beállításnál a TREK magától feloldja.',
  'help.guide.offline-conflicts.tip.1':
    'A „Gyorsítótár törlése” csak az ezen az eszközön tárolt másolatot törli. A szerveren semmi sem változik.',
  // profile
  'help.guide.profile.title': 'Profil módosítása',
  'help.guide.profile.goal': 'Frissítsd a nevedet, az e-mail-címedet és a profilképedet.',
  'help.guide.profile.step.1':
    'A „Fiók” kártyán a képeden lévő kamerára kattintva tölthetsz fel profilképet; a piros kuka eltávolítja, és visszaállítja a monogramodat.',
  'help.guide.profile.step.2': 'A kép alatt szerkeszd a felhasználónevet és az e-mail-címet.',
  'help.guide.profile.result': 'A neved és a képed mindenhol egyszerre frissül, a megosztott utazásaidon is.',
  'help.guide.profile.tip.1':
    'Az SSO-val összekapcsolt fióknál SSO jelvény és az „Összekapcsolva:” felirat látszik, a szolgáltató nevével.',
  // password
  'help.guide.password.title': 'Jelszó módosítása',
  'help.guide.password.goal': 'Állíts be új jelszót.',
  'help.guide.password.step.1':
    'A „Jelszó módosítása” részben add meg a „Jelenlegi jelszó” értékét, majd az „Új jelszó” mezőben az újat, és ugyanezt az „Új jelszó megerősítése” mezőben is. Az alatta lévő lista gépelés közben jelöli, mely szabályoknak felel meg a jelszó.',
  'help.guide.password.step.2': 'Kattints a „Jelszó frissítése” gombra.',
  'help.guide.password.result':
    'Az új jelszó azonnal érvénybe lép. Minden más eszközöd kijelentkezik, az MCP API-tokenjeid törlődnek, az OAuth klienseknek pedig újra be kell jelentkezniük; ezen az eszközön bejelentkezve maradsz.',
  'help.guide.password.tip.1':
    'Ha ezen a TREK-en csak SSO-val lehet bejelentkezni, nincs TREK-jelszó, és nincs „Jelszó módosítása” kártya sem.',
  // mfa
  'help.guide.mfa.title': 'Kétlépcsős azonosítás bekapcsolása',
  'help.guide.mfa.goal': 'Védd a fiókodat egy hitelesítő alkalmazás kódjával.',
  'help.guide.mfa.step.1': 'A „Kétfaktoros hitelesítés (2FA)” részben kattints a „Hitelesítő beállítása” gombra.',
  'help.guide.mfa.step.2':
    'Olvasd be a QR-kódot az alkalmazással, vagy írd be kézzel a titkos kulcsot, majd add meg a megjelenő hatjegyű kódot, és kattints a „2FA engedélyezése” gombra.',
  'help.guide.mfa.step.3':
    'Mentsd el a tartalékkódokat a „Kódok másolása”, a „TXT letöltése” vagy a „Nyomtatás / PDF” gombbal, majd kattints az OK gombra. Minden kód egyszer használható. Akkor használj kódot, ha nincs nálad a telefonod.',
  'help.guide.mfa.result': 'Minden bejelentkezéskor a jelszó után egy kódot is meg kell adnod.',
  'help.guide.mfa.tip.1':
    'A „2FA kikapcsolása” a jelszavadat és egy aktuális kódot vagy egy még fel nem használt tartalékkódot kér.',
  'help.guide.mfa.tip.2': 'Az admin mindenkinek kötelezővé teheti a 2FA-t; ilyenkor itt nem kapcsolható ki.',
  // passkeys
  'help.guide.passkeys.title': 'Bejelentkezés passkey-jel',
  'help.guide.passkeys.goal':
    'Jelszó helyett használd az eszközöd ujjlenyomat-olvasóját, arcfelismerését vagy PIN-kódját.',
  'help.guide.passkeys.step.1':
    'A „Passkey-k” részben kattints a „Passkey hozzáadása” gombra, erősítsd meg a jelenlegi jelszavadat, adj neki olyan nevet, amelyből kiderül, melyik eszközről van szó, majd kövesd az eszközöd utasításait.',
  'help.guide.passkeys.step.2':
    'Minden passkey-nél látod, hogy „Szinkronizálva” van-e, vagy „Ez az eszköz” eszközhöz kötött, és mikor használták utoljára. Az „Átnevezés” módosítja a nevét, a törlés gomb pedig a jelszavad megadása után eltávolítja.',
  'help.guide.passkeys.result':
    'A bejelentkezési oldal felajánlja a passkey használatát. Jelszóval továbbra is bejelentkezhetsz.',
  'help.guide.passkeys.tip.1':
    'A passkey az eszközön vagy az eszköz jelszókezelőjében tárolódik, ezért minden eszközhöz külön passkey-t adj hozzá.',
  'help.guide.passkeys.tip.2':
    'A passkey-k csak akkor jelennek meg, ha a rendszergazda bekapcsolta őket. Amíg a szervernek nincs WebAuthn-domainje, a kártya ezt jelzi a „Passkey hozzáadása” helyett.',
  // delete-account
  'help.guide.delete-account.title': 'Fiók törlése',
  'help.guide.delete-account.goal': 'Töröld a fiókodat és azokat az adatokat, amelyek csak hozzád tartoznak.',
  'help.guide.delete-account.step.1':
    'A „Fiók” kártya alján, bal oldalon kattints a fiók törlése gombra, majd a „Végleges törlés” gombra.',
  'help.guide.delete-account.result':
    'A fiókod törlődött, a saját utazásaiddal, helyeiddel és fájljaiddal együtt. A mások által birtokolt utazások megmaradnak.',
  'help.guide.delete-account.tip.1':
    'Ha te vagy az egyetlen rendszergazda, a TREK a „Törlés nem lehetséges” üzenetet jeleníti meg: előbb nevezz ki egy másik felhasználót rendszergazdának.',
  'help.guide.delete-account.tip.2': 'Ez nem vonható vissza. Megerősítés előtt exportáld, amit meg szeretnél tartani.',

  // ── Screen: admin (all tabs) ──────────────────────────────────────────────────────────
  'help.ctx.admin.title': 'Adminisztráció',
  'help.ctx.admin.summary':
    'A teljes TREK-példány beállításai, minden felhasználóra: ki és hogyan jelentkezhet be, mi van bekapcsolva, hol tárolódnak a fájlok, hogyan küld üzenetet a szerver, és hogyan készül a biztonsági mentés. Ezt az oldalt csak a rendszergazdák látják. Az oldalsáv a füleket „Felhasználók”, „Konfiguráció”, „Integrációk” és „Karbantartás” csoportba rendezi, és minden fül külön képernyő.',
  'help.ctx.admin.bullet.1':
    'A fejléc jobb oldalán látod a felhasználók, utazások, helyek és fájlok számát. Alatta „Frissítés elérhető” sáv jelenik meg, ha új TREK-verzió jelent meg.',
  'help.ctx.admin.bullet.2':
    '„Felhasználók” és „Alapértelmezett beállítások”: fiókok, meghívó linkek és jogosultságok, valamint azok a beállítások és az a térkép, amelyekkel egy új fiók indul.',
  'help.ctx.admin.bullet.3':
    '„Személyre szabás”, „Beállítások”, „Bővítmények”, „Pluginok” és „Tárhely”: csomagolási sablonok, kategóriák és iskolai szünetek; bejelentkezés, passkey-k, 2FA, API-kulcsok és keresőszolgáltatók; a funkciómodulok; külső fejlesztésű pluginek; a feltöltések tárolási helye.',
  'help.ctx.admin.bullet.4':
    '„Értesítések”, „MCP hozzáférés” és GitHub: a felhasználók által választható csatornák és az alapértelmezett beállításaik, az AI-kliensek tokenjei és munkamenetei, valamint a kiadások története.',
  'help.ctx.admin.bullet.5':
    'Biztonsági mentés és audit: azonnali és ütemezett mentések, valamint a biztonsági szempontból fontos események naplója.',
  'help.ctx.admin-users.title': 'Felhasználók',
  'help.ctx.admin-users.summary':
    'A TREK összes fiókja a szerepkörrel, az e-mail-címmel és az utolsó aktivitás idejével, a meghívó linkek, amelyekkel zárt példányon is lehet regisztrálni, valamint az, hogy ki mit tehet az utazásokban.',
  'help.ctx.admin-users.bullet.1':
    'A táblázat: felhasználó, e-mail, szerepkör, létrehozás dátuma és „Utoljára aktív”, soronként „Felhasználó szerkesztése” és „Felhasználó törlése” gombbal. Az avatáron lévő zöld pont azt jelzi, hogy a felhasználó éppen online; a saját sorodban a (Te) jelölés látszik.',
  'help.ctx.admin-users.bullet.2':
    'A „Felhasználók” kártya jobb felső sarkában a „Felhasználó létrehozása” gombbal kézzel hozhatsz létre fiókot egy jelszóval, amelyet aztán átadsz a felhasználónak.',
  'help.ctx.admin-users.bullet.3':
    'Alatta a „Meghívó linkek”: regisztrációs linkek használati korláttal, lejárati idővel, és ha szeretnéd, egy utazással, amelyhez az új felhasználó a regisztrációkor csatlakozik.',
  'help.ctx.admin-users.bullet.4':
    'Alul a „Jogosultsági beállítások”: műveletenként megadhatod, ki végezheti el („Mindenki”, „Utazás tagjai”, „Utazás tulajdonosa” vagy „Csak adminisztrátor”). A mentéshez kattints a kártya tetején lévő „Mentés” gombra.',
  'help.ctx.admin-defaults.title': 'Alapértelmezett beállítások',
  'help.ctx.admin-defaults.summary':
    'Itt állítod be, mivel induljon egy új fiók, hogy senkinek ne kelljen előbb beállítgatnia: színmód, mértékegységek, időformátum, a hét kezdőnapja, megjelenítési pénznem és a foglalási kódok elrejtése, valamint a térkép, a kulcsai és az útvonaltervező szerverek.',
  'help.ctx.admin-defaults.bullet.1':
    'Bal oldalon az „Alapértelmezett felhasználói beállítások”: „Színmód”, „Hőmérséklet egység”, „Távolság egység”, „Időformátum”, „A hét kezdőnapja”, „Megjelenítési pénznem” és „Foglalási kódok elrejtése”.',
  'help.ctx.admin-defaults.bullet.2':
    'Jobb oldalon a „Térkép”: „Térkép sablon”, „Megosztott CARTO-kulcs”, „Saját útvonaltervező” és „Saját Valhalla-példány”, egy előnézet, majd a „Térképmotor” a „Térképstílus”, a „Megosztott Mapbox-token”, a „3D épületek & domborzat” és a „Kiváló minőségű mód” beállítással.',
  'help.ctx.admin-config.title': 'Személyre szabás',
  'help.ctx.admin-config.summary':
    'Olyan beállítások, amelyek a példány minden utazására érvényesek: a csomagolási sablonok, a helyek és gyűjtemények kategóriái, valamint az iskolai szünetek katalógusa, amelyet a Vacay használ.',
  'help.ctx.admin-config.bullet.1':
    '„Csomagolási sablonok”: elnevezett kategória- és tétellisták, amelyekből egy utazás csomaglistája kiindulhat.',
  'help.ctx.admin-config.bullet.2':
    'Kategóriák: a TREK-ben a helyinspektortól a Gyűjteményekig használt kategóriák neve, ikonja és színe, mindegyik egy előnézettel ellátott ablakban szerkeszthető.',
  'help.ctx.admin-config.bullet.3':
    'Iskolai szünetek: az országok és régiók katalógusa a szünetek időszakaival, amelyből a Vacay-ben bárki választhat.',
  'help.ctx.admin-settings.title': 'Beállítások',
  'help.ctx.admin-settings.summary':
    'Itt állítod be, hogyan jelentkezhetnek be a felhasználók, és milyen külső szolgáltatásokat használhat a szerver. Bal oldalon: „Hitelesítési módszerek”, „Passkey-bejelentkezés”, „Kétlépcsős hitelesítés (2FA) kötelezővé tétele” és „Egyszeri bejelentkezés (OIDC)”. Jobb oldalon: „Engedélyezett fájltípusok” és „API kulcsok” a kereső- és tömegközlekedési szolgáltatókkal. A „Veszélyzóna” alul található.',
  'help.ctx.admin-settings.bullet.1':
    '„Hitelesítési módszerek”: jelszavas bejelentkezés, jelszavas regisztráció, és ha az OIDC be van állítva, SSO-bejelentkezés és automatikus SSO-fióklétrehozás. A „Kétlépcsős hitelesítés (2FA) kötelezővé tétele” külön kártyán található.',
  'help.ctx.admin-settings.bullet.2':
    '„Passkey-bejelentkezés”: „Passkey-bejelentkezés engedélyezése”, a Relying Party ID (domain) és az „Engedélyezett origók”. „Egyszeri bejelentkezés (OIDC)”: „Megjelenítendő név”, Issuer URL, egy opcionális Discovery URL, „Kliens azonosító” és „Kliens titok”.',
  'help.ctx.admin-settings.bullet.3':
    'API kulcsok: az első a TREK Places API, amelyhez nem kell kulcs. Alatta a „Google Maps API kulcs” („Teszt” és „Mire használja a kulcsot” lehetőséggel), az Unsplash- és az Amap-kulcs, a kártya alján pedig egyetlen „Mentés” gomb.',
  'help.ctx.admin-settings.bullet.4':
    'A „Tömegközlekedési szolgáltató” és a „Helykeresési szolgáltató” határozza meg, ki válaszol a tömegközlekedési és a helykeresésekre; a „Helykeresési napló” rögzíti, melyik találatot választották; az „Engedélyezett fájltípusok” korlátozza a feltöltéseket.',
  'help.ctx.admin-addons.title': 'Bővítmények',
  'help.ctx.admin-addons.summary':
    'A TREK funkciómoduljai, mindegyik saját kapcsolóval: Csomagolás, Költségvetés, Dokumentumok, Vacay, Atlasz, Együttműködés, Útinaplók, Gyűjtemények, Autós út, MCP, AirTrail, Dawarich és az MI-elemzés. Kikapcsolt állapotban a menüpont, az útvonalak és az API mindenki számára eltűnik.',
  'help.ctx.admin-addons.bullet.1':
    'Minden bővítménynek saját csempéje van a kapcsolójával, és ha vannak beállításai, alsorokkal ezekhez.',
  'help.ctx.admin-addons.bullet.2':
    'A fotó- és dokumentumszolgáltatók is csempeként jelennek meg itt, így az Immich vagy a Synology is elérhetővé tehető a felhasználók számára.',
  'help.ctx.admin-addons.bullet.3': 'A „Poggyászkövetés” saját kapcsolót kapott a csempék alatt.',
  'help.ctx.admin-plugins.title': 'Pluginok',
  'help.ctx.admin-plugins.summary':
    'Külső fejlesztésű pluginok, amelyek saját folyamatban futnak a TREK mellett, mindegyik a telepítéskor kért jogosultságokkal. Telepíthetsz a katalógusból, feltölthetsz egy csomagot, vagy plugin fejlesztése közben belinkelhetsz egy mappát.',
  'help.ctx.admin-plugins.bullet.1':
    '„Telepítve” és „Felfedezés”, a „Pluginok keresése…” mezővel, valamint a „Típus”, az „Állapot” és a „Rendezés” szűrővel. Minden sorban látszik a verzió, az „Ellenőrizve”, „Aláírva” vagy aláíratlan jelzés, az, hogy mihez férhet hozzá a plugin, egy kapcsoló és egy ⋯ menü.',
  'help.ctx.admin-plugins.bullet.2':
    'A kártya fejlécének két ikonja: a „Plugin feltöltése” .zip, .tgz vagy .tar.gz fájlt fogad (de egy .zip fájlt az oldalra is húzhatsz); az „Újraszkennelés” megtalálja a fejlesztéshez belinkelt pluginmappát.',
  'help.ctx.admin-plugins.bullet.3':
    'Engedélyezett hosztok pluginonként: azok a címek, amelyeket egy plugin elérhet, mert a kimenő kapcsolatok alapértelmezetten le vannak tiltva.',
  'help.ctx.admin-storage.title': 'Tárhely',
  'help.ctx.admin-storage.summary':
    'Itt adod meg, hol tárolódjanak a feltöltések: a helyi lemezen vagy egy S3-gyűjtőben, igény szerint további háttértárakra is másolva. Minden feltöltési kategória más háttértárra kerülhet, és semmi sem változik, amíg a „Módosítások mentése” gombra nem kattintasz.',
  'help.ctx.admin-storage.bullet.1':
    'Felül az „Egészség”: a tükörcélra sikertelenül írt adatok, vagy a „Nincs rögzített replikahiba.” üzenet.',
  'help.ctx.admin-storage.bullet.2':
    '„Backendek”: név, típus, foglalt hely és tükrözési cél, „Teszt”, „Szerkesztés” és „Eltávolítás” gombbal. A „Számítás most” kiszámolja a tárolt adatok mennyiségét; a környezeti változóval megadott backend csak olvasható.',
  'help.ctx.admin-storage.bullet.3':
    'Kategóriák: útidokumentumok, útinapló-fotók, borítók, profilképek, helyképek, a fotógyorsítótárak és a biztonsági mentések, mindegyik egy-egy backendhez rendelve.',
  'help.ctx.admin-notifications.title': 'Értesítések',
  'help.ctx.admin-notifications.summary':
    'Itt látod, milyen csatornákat kínál a példány a felhasználóinak, és melyeken kapsz értesítést adminként. A felhasználók a Beállítások alatt maguk választják ki a témáikat és URL-jeiket; te döntöd el, mi érhető el, és te állítod be az e-mailt.',
  'help.ctx.admin-notifications.bullet.1':
    'Az „E-mail (SMTP)”, a Webhook, az Ntfy és a Web Push csatornának is van egy kapcsolója, amellyel elérhetővé teheted a felhasználóknak; az e-mailhez a szerverbeállítások is kellenek. Az alkalmazáson belüli értesítés mindig be van kapcsolva.',
  'help.ctx.admin-notifications.bullet.2':
    '„Utazási emlékeztetők”: küldjön-e a szerver emlékeztetőt az utazás kezdete előtt.',
  'help.ctx.admin-notifications.bullet.3':
    '„Admin webhook”, „Admin Ntfy” és az „Értesítések” kártya: ide kerülnek az adminisztrátori események („Új verzió elérhető”, „Tárhely-replika hiba”, „Evezős régiót kértek”), mindegyikhez egy teszt gombbal.',
  'help.ctx.admin-mcp-tokens.title': 'MCP hozzáférés',
  'help.ctx.admin-mcp-tokens.summary':
    'Az AI-kliensek összes tokenje és OAuth-munkamenete ehhez a TREK-példányhoz, az összes felhasználónál. Bármelyiket visszavonhatod.',
  'help.ctx.admin-mcp-tokens.bullet.1':
    'OAuth munkamenetek: a kliens, a neki megadott hatókörök, a tulajdonos és a dátum, valamint egy kuka ikon, amellyel visszavonhatod.',
  'help.ctx.admin-mcp-tokens.bullet.2':
    'API tokenek: név, tulajdonos, „Létrehozva” és „Utoljára használva”, egy kuka ikonnal, amellyel törölheted.',
  'help.ctx.admin-github.title': 'GitHub',
  'help.ctx.admin-github.summary':
    'A TREK újdonságai: a kiadások története a GitHubról, és az, hogy van-e a tiédnél újabb verzió. Maga a frissítés nem az alkalmazásban, hanem a gazdagépen történik.',
  'help.ctx.admin-github.bullet.1':
    'A „Frissítési előzmények” idővonalon sorolja fel a kiadásokat a kiadási megjegyzésekkel. A legújabbon „Legújabb” címke látszik, az előzetes kiadásokon „Előzetes kiadás”, a GitHub gomb pedig megnyitja a kiadások oldalát.',
  'help.ctx.admin-github.bullet.2':
    'Ha újabb kiadás jelent meg, az oldal fejléce alatt megjelenik a „Frissítés elérhető”; a „Frissítési útmutató” a Dockerhez szükséges parancsokat, más telepítéseknél pedig a frissítési útmutatót mutatja.',
  'help.ctx.admin-backup.title': 'Biztonsági mentés',
  'help.ctx.admin-backup.summary':
    'Teljes biztonsági mentések az adatbázisról és a feltöltésekről, kézzel vagy ütemezetten készítve, a szerveren tárolva, és egyetlen fájlként letölthetően. Egy mentést a „Visszaállítás” gombbal állíthatsz vissza.',
  'help.ctx.admin-backup.bullet.1':
    '„Adatmentés”: a kártya tetején a „Mentés készítése” és a „Mentés feltöltése”, alatta a mentések listája „Letöltés”, „Visszaállítás” gombbal és törléshez egy kuka ikonnal.',
  'help.ctx.admin-backup.bullet.2':
    'A „Mentés feltöltése” egy másik példányon vagy korábban készült fájlból állít vissza, ugyanazzal a megerősítő kérdéssel, mint a „Visszaállítás”.',
  'help.ctx.admin-backup.bullet.3':
    'Automatikus mentés: be- vagy kikapcsolás, „Időköz”, „Futtatás időpontja” és a nap, valamint „Régi mentések törlése ennyi idő után” („1 nap” és „Örökre megőrzés” között), a „Mentés” gombbal érvényesítve.',
  'help.ctx.admin-audit.title': 'Audit', // same-as-en
  'help.ctx.admin-audit.summary':
    'A biztonsági és adminisztrációs események naplója: bejelentkezések és sikertelen próbálkozások, MFA-módosítások, felhasználói és beállításváltozások, biztonsági mentések és visszaállítások. Csak olvasható, a legújabb van elöl.',
  'help.ctx.admin-audit.bullet.1':
    'Eseményenként egy sor az időponttal, a felhasználóval, a művelettel, az erőforrással, az IP-címmel és a részletekkel.',
  'help.ctx.admin-audit.bullet.2':
    'A kártya fejlécében lévő „Frissítés” újratölti a listát. A cím melletti jelvény mutatja, hány bejegyzés töltődött be az összesből, a „Továbbiak betöltése” pedig a régebbi bejegyzéseket tölti be.',
  // create-user
  'help.guide.create-user.title': 'Felhasználó létrehozása',
  'help.guide.create-user.goal': 'Fiók hozzáadása kézzel, meghívó nélkül.',
  'help.guide.create-user.step.1':
    'Kattints a „Felhasználók” kártya jobb felső sarkában a „Felhasználó létrehozása” gombra.',
  'help.guide.create-user.step.2':
    'Add meg a felhasználónevet, az e-mail-címet és a jelszót; a jelszó alatti ellenőrzőlista mutatja, mely szabályoknak felel meg a jelszó. Válaszd ki a szerepkört: „Felhasználó” vagy „Adminisztrátor”.',
  'help.guide.create-user.step.3': 'Kattints a „Felhasználó létrehozása” gombra.',
  'help.guide.create-user.result':
    'A fiók megjelenik a táblázatban, és azonnal be lehet vele jelentkezni. A jelszót megbízható csatornán add át a felhasználónak.',
  'help.guide.create-user.tip.1':
    'Ha valaki maga szeretné megválasztani a jelszavát, jobb, ha meghívó linket küldesz neki.',
  'help.guide.create-user.tip.2':
    'Az „Adminisztrátor” látja ezt az oldalt, és mindent megtehet. Hogy a „Felhasználó” mit tehet az utazásokban, azt lent, a „Jogosultsági beállítások” részben adhatod meg.',
  // edit-user
  'help.guide.edit-user.title': 'Felhasználó adatainak vagy jelszavának módosítása',
  'help.guide.edit-user.goal':
    'Nevezz át valakit, módosítsd a szerepkörét, vagy segíts neki újra bejelentkezni, ha elfelejtette a jelszavát.',
  'help.guide.edit-user.step.1':
    'Kattints a felhasználó sorában a ceruzára („Felhasználó szerkesztése”). Az ablak tetején a fiók e-mail-címe látszik.',
  'help.guide.edit-user.step.2':
    'Módosítsd a felhasználónevet, az e-mail-címet vagy a szerepkört, vagy adj meg egy új jelszót (ha üresen hagyod, a jelenlegi marad), és kattints a „Mentés” gombra. Az alul található „Passkey-k visszaállítása” megerősítés után a fiók összes passkey-ét eltávolítja.',
  'help.guide.edit-user.result':
    'A módosítás azonnal érvénybe lép. Új jelszó megadásakor a felhasználó minden eszközén kijelentkeztetésre kerül, így a régi munkamenet nem használható tovább.',
  'help.guide.edit-user.tip.1': 'Amíg te vagy az utolsó admin, nem veheted el magadtól az admin szerepkört.',
  'help.guide.edit-user.tip.2':
    'A jelkulcsok visszaállítása után a jelszó megmarad; az illető a Beállítások „Fiók” részében adhat hozzá új jelkulcsokat.',
  // invite-links
  'help.guide.invite-links.title': 'Meghívás linkkel',
  'help.guide.invite-links.goal':
    'Tedd lehetővé, hogy valaki regisztráljon egy zárt példányon, és ha szeretnéd, rögtön egy utazáshoz is hozzáadhasd.',
  'help.guide.invite-links.step.1':
    'Kattints a „Meghívó linkek” kártya jobb felső sarkában a „Link létrehozása” gombra.',
  'help.guide.invite-links.step.2':
    'Válaszd ki a „Max. használat” (1× és 5× között, vagy ∞) és a „Lejárat” (1 és 14 nap között, vagy ∞) értékét, igény szerint egy utazást a „Hozzáadás utazáshoz (opcionális)” alatt, majd kattints a „Létrehozás és másolás” gombra.',
  'help.guide.invite-links.step.3':
    'Küldd el a linket. Minden sorban látod, hányszor használták, mikor jár le, melyik utazáshoz csatol és ki hozta létre, mellette pedig az „Aktív”, „Lejárt” vagy „Elhasználva” jelzést. A „Link másolása” újra kimásolja, a kuka pedig törli.',
  'help.guide.invite-links.result':
    'Aki megnyitja a linket, saját jelszóval regisztrál. Ha utazást is kiválasztottál, azonnal csatlakozik hozzá.',
  'help.guide.invite-links.tip.1':
    'A meghívó linkek akkor is működnek, ha a „Beállítások” fülön a jelszavas regisztráció („Password Registration”) ki van kapcsolva.',
  'help.guide.invite-links.tip.2':
    'Egyetlen személy meghívásához a legbiztonságosabb alapbeállítás egy egyszer használható, rövid lejáratú link.',
  // delete-user
  'help.guide.delete-user.title': 'Felhasználó törlése',
  'help.guide.delete-user.goal': 'Egy fiók és minden hozzá tartozó adat eltávolítása.',
  'help.guide.delete-user.step.1':
    'Kattints a felhasználó sorában a kukára („Felhasználó törlése”), és erősítsd meg a „Törlés” gombbal.',
  'help.guide.delete-user.result':
    'A fiók törlődött, és vele együtt minden utazás és útinapló, amelynek a tulajdonosa volt, még azok is, amelyeket másokkal megosztott. Azok az utazások, amelyeknek csak tagja volt, a tulajdonosaiknál maradnak.',
  'help.guide.delete-user.tip.1':
    'Ez nem vonható vissza. Ha nem vagy biztos a dolgodban, előbb készíts biztonsági mentést.',
  'help.guide.delete-user.tip.2':
    'A saját sorodban a kuka ikon nem működik: saját magadat nem törölheted. Ezt egy másik rendszergazdának kell megtennie.',
  // permissions
  'help.guide.permissions.title': 'Ki mit tehet',
  'help.guide.permissions.goal':
    'Állítsd be műveletenként, melyik szerepkör végezheti el az adott műveletet ezen a TREK-en.',
  'help.guide.permissions.step.1':
    'A „Jogosultsági beállítások” részben keresd meg a műveletet a csoportjában, például az „Utazások törlése” műveletet az „Utazáskezelés” alatt, és válaszd ki, ki végezheti el: „Mindenki”, „Utazás tagjai”, „Utazás tulajdonosa” vagy „Csak adminisztrátor”. A módosított sor „testreszabott” jelölést kap.',
  'help.guide.permissions.step.2':
    'Kattints a kártya jobb felső sarkában a „Mentés” gombra. Az „Alapértelmezések visszaállítása” minden sort visszaállít a beépített szintre; ezután is kattints a „Mentés” gombra.',
  'help.guide.permissions.result':
    'A szabály egyszerre minden utazásra érvényes. Akinek a szintje alacsonyabb, az már nem látja a hozzá tartozó gombokat és menüket.',
  'help.guide.permissions.tip.1':
    'Az „Utazás tulajdonosa” az, aki az utazást létrehozta; az adminisztrátorok mindig mindent megtehetnek.',
  'help.guide.permissions.tip.2':
    'Minden művelet külön sor, így például a tagok tervezhetik a helyeket és a napokat, az utazás törlését viszont a tulajdonosra hagyhatod.',
  // default-map
  'help.guide.default-map.title': 'Alapértelmezett térképbeállítások új felhasználóknak',
  'help.guide.default-map.goal': 'Minden új fiók kapjon működő térképet személyes token nélkül is.',
  'help.guide.default-map.step.1':
    'A „Térkép” részben válassz „Térkép sablon” értéket, vagy illessz be egy csempe-URL-t, és ha CARTO-csempéket használsz, add meg a „Megosztott CARTO-kulcs” értékét. Az alatta lévő előnézet mutatja az eredményt.',
  'help.guide.default-map.step.2':
    'Lejjebb válaszd ki a „Térképmotor” értékét: „Alapértelmezett (ingyenes)”, Mapbox (3D) vagy MapLibre (OpenFreeMap). Mapboxnál és MapLibre-nél válaszd ki a „Térképstílus” értékét; Mapboxnál add meg a „Megosztott Mapbox-token” értékét, és döntsd el, kell-e „3D épületek & domborzat” és „Kiváló minőségű mód”.',
  'help.guide.default-map.result':
    'Az új fiókok ezekkel a beállításokkal indulnak; aki a Beállítások alatt saját térképet állított be, annál az marad.',
  'help.guide.default-map.tip.1':
    'Az itt megadott tokent vagy kulcsot mindenki használja, akinek nincs sajátja, ezért figyelj a kvótájára.',
  'help.guide.default-map.tip.2':
    'Azok a meglévő fiókok is ezeket az alapértelmezéseket használják, amelyek soha nem módosítottak semmit a térkép fülön.',
  // packing-templates
  'help.guide.packing-templates.title': 'Csomagolási sablon összeállítása',
  'help.guide.packing-templates.goal':
    'Adj az utazásoknak egy kiinduló csomagolási listát, hogy ne üres listával kezdjenek.',
  'help.guide.packing-templates.step.1': 'Kattints az „Új sablon” gombra, írj be egy nevet, és a pipával erősítsd meg.',
  'help.guide.packing-templates.step.2':
    'A sablon nevére kattintva nyisd meg, majd kattints a „Kategória hozzáadása” gombra. A kategória tetején lévő + gombbal tételeket adhatsz hozzá, és egy tételhez elég a név.',
  'help.guide.packing-templates.step.3':
    'Minden azonnal mentődik. A ceruzával átnevezhetsz egy sablont, kategóriát vagy tételt. A kuka egy tételt azonnal töröl. Sablonnál vagy kategóriánál előbb rákérdez, mert a tartalmuk is törlődik.',
  'help.guide.packing-templates.result':
    'A sablon minden utazás csomaglistájánál választható. Alkalmazáskor a tételek átmásolódnak, így az utazáson szabadon módosíthatók.',
  'help.guide.packing-templates.tip.1':
    'Utazástípusonként egy-egy sablon (tengerpart, városnézés, túrázás) jobban bevált, mint egyetlen nagyon hosszú lista.',
  'help.guide.packing-templates.tip.2':
    'Egy sablon törlése nem érinti azokat az utazásokat, amelyeken már alkalmazták.',
  'help.guide.packing-templates.tip.3':
    'Az utazás csomagolási listáján a „Mentés sablonként” olyan sablont készít, amely minden tétel súlyát, mennyiségét és táskáját is tartalmazza. Ezek itt a tétel mellett látszanak, és a sablon alkalmazásakor a tételek ugyanazokba a táskákba kerülnek.',
  // categories
  'help.guide.categories.title': 'A kategóriák kezelése',
  'help.guide.categories.goal':
    'Döntsd el, milyen kategóriákat kaphatnak a helyek és a gyűjtemények, és hogyan nézzenek ki.',
  'help.guide.categories.step.1':
    'Kattints az „Új kategória” gombra, írd be a nevet az ablak címsorába, válassz ikont („Ikon”) és színt („Szín”), és ellenőrizd az „Előnézet” részt. Kattints a „Létrehozás” gombra.',
  'help.guide.categories.step.2':
    'A listában a ceruzával („Szerkesztés”) megnyithatsz egy kategóriát, a „Frissítés” pedig elmenti. A kuka („Törlés”) megerősítés után eltávolítja.',
  'help.guide.categories.result':
    'A beállítás egyszerre mindenhol érvényes: a hely részleteinél, a térkép gombostűinél, a Gyűjteményekben és a szűrőkben.',
  'help.guide.categories.tip.1':
    'A helyek a kategória azonosítóját tárolják, így ha átnevezel egy kategóriát, minden helyen az új név jelenik meg.',
  'help.guide.categories.tip.2':
    'Ha törölsz egy kategóriát, a helyei kategória nélkül maradnak. Ha ez számít, előbb sorold át őket egy másik kategóriába.',
  // school-holiday-catalog
  'help.guide.school-holiday-catalog.title': 'Iskolai szünetek kézi karbantartása',
  'help.guide.school-holiday-catalog.goal':
    'Tartsd karban egy ország vagy régió iskolai szüneteit, hogy a Vacay-ben bárki kiválaszthassa őket.',
  'help.guide.school-holiday-catalog.step.1':
    'Az „Iskolai szünetek” részben válaszd ki az országot („Ország”), vagy kattints a + gombra („Ország hozzáadása”), add meg az országot és az „Országkód (pl. US)” értékét, majd mentsd. A „Régió hozzáadása” gombbal az ország minden olyan részét felveheted, amelynek saját dátumai vannak.',
  'help.guide.school-holiday-catalog.step.2':
    'Egy régióra kattintva megnyílik a „Régió vagy tankerület”: kattints az „Időszak hozzáadása” gombra, add meg mindegyiknél a „Szünet neve”, a „Kezdő dátum” és a „Befejezés dátuma” értékét, majd mentsd. A kuka eltávolít egy időszakot vagy egy régiót; egy ország akkor törölhető, ha már nincs régiója.',
  'help.guide.school-holiday-catalog.result':
    'A felhasználók a Vacay beállításai között megtalálják az országot és a régiót, az időszakokat pedig az éves naptárukban látják.',
  'help.guide.school-holiday-catalog.tip.1':
    'Az a régió, amelyet valaki már kiválasztott a Vacay-naptárában, nem törölhető.',
  // auth-methods
  'help.guide.auth-methods.title': 'A bejelentkezési módok meghatározása',
  'help.guide.auth-methods.goal':
    'A jelszavas bejelentkezés, az SSO és a regisztráció be- vagy kikapcsolása, valamint a 2FA kötelezővé tétele.',
  'help.guide.auth-methods.step.1':
    'A „Hitelesítési módszerek” részben kapcsold be vagy ki a jelszavas bejelentkezést és a jelszavas regisztrációt; minden kapcsoló azonnal érvénybe lép. Kikapcsolt regisztrációnál új fiók csak meghívó linkkel, SSO-val vagy a „Felhasználó létrehozása” gombbal jöhet létre.',
  'help.guide.auth-methods.step.2':
    'Az „SSO Login” és az „SSO Auto-Provisioning” használatához be kell állítani lent az „Egyszeri bejelentkezés (OIDC)” részt. Az automatikus létrehozás akkor hoz létre fiókot, amikor valaki először jelentkezik be SSO-val.',
  'help.guide.auth-methods.step.3':
    'Kapcsold be a „Kétlépcsős hitelesítés (2FA) kötelezővé tétele” beállítást: így mindenkinek, akinek még nincs 2FA-ja, be kell állítania a Beállításokban, mielőtt használhatná a TREK-et.',
  'help.guide.auth-methods.result':
    'A bejelentkezési oldal pontosan azokat a módokat kínálja, amelyeket bekapcsolva hagytál.',
  'help.guide.auth-methods.tip.1':
    'A TREK nem engedi kikapcsolni az utolsó bejelentkezési módot: a kapcsolója kiszürkül, az elemleírásban pedig ez áll: „Legalább egy bejelentkezési módnak engedélyezettnek kell maradnia.”',
  'help.guide.auth-methods.tip.2':
    'Ha a szerveren be van állítva az OIDC_ONLY, a jelszavas kapcsolók zárolva vannak, és egy megjegyzés jelzi ezt.',
  // oidc
  'help.guide.oidc.title': 'Egyszeri bejelentkezés beállítása',
  'help.guide.oidc.goal': 'Lehessen bejelentkezni a saját identitásszolgáltatótokkal.',
  'help.guide.oidc.step.1':
    'Az „Egyszeri bejelentkezés (OIDC)” részben add meg a gomb „Megjelenítendő név” értékét, az Issuer URL-t, valamint a szolgáltatódtól kapott „Kliens azonosító” és „Kliens titok” értékét. A „Discovery URL (opcionális)” mezőt csak akkor töltsd ki, ha a szolgáltatód nem a szokásos címen teszi közzé, ahogy például az Authentik. Kattints a „Mentés” gombra.',
  'help.guide.oidc.step.2': 'A „Hitelesítési módok” alatt kapcsold be az „SSO-bejelentkezés” lehetőséget.',
  'help.guide.oidc.result':
    'A bejelentkezési oldalon megjelenik az SSO gomb; ha az „SSO automatikus fióklétrehozás” be van kapcsolva, az első alkalommal belépők automatikusan fiókot kapnak.',
  'help.guide.oidc.tip.1':
    'A szolgáltatód által kért átirányítási URI a TREK-példányod címe és a dokumentációban szereplő OIDC callback útvonal együtt.',
  'help.guide.oidc.tip.2':
    'A claim-leképezés határozza meg, mely SSO-csoportok tagjai lesznek adminisztrátorok. Részletek a dokumentáció OIDC oldalán.',
  // instance-keys
  'help.guide.instance-keys.title': 'API-kulcsok megadása',
  'help.guide.instance-keys.goal':
    'Google-fotók és -értékelések, Unsplash-borítók és Amap-keresés az egész példány számára.',
  'help.guide.instance-keys.step.1':
    'Az „API kulcsok” részben a legfelső, a TREK Places API, kulcs nélkül is kezeli a helykeresést. A „Mi van benne” felsorolja, mit fed le, és mit nem.',
  'help.guide.instance-keys.step.2':
    'Fotókhoz, értékelésekhez és nyitvatartáshoz illessz be egy „Google Maps API kulcs” értéket, és kattints a „Teszt” gombra; az eredmény „Csatlakozva” vagy „Érvénytelen”. Nyisd meg a „Mire használja a kulcsot” részt, és csak azt kapcsold be, amiért fizetni szeretnél: „Helyfotók”, „Hely automatikus kiegészítése”, „Hely részletei”, „Helyek gazdagítása” és „Keresés csak a Google-lel”, valamint állíts be egy „Napi korlát a Google-hívásokra” értéket.',
  'help.guide.instance-keys.step.3':
    'Illeszd be az Unsplash API-kulcsot a borítókereséshez és az Amap (高德地图) API-kulcsot a szárazföldi Kínában történő helykereséshez, majd kattints a kártya alján a „Mentés” gombra.',
  'help.guide.instance-keys.result':
    'A felhasználók saját kulcs nélkül is használhatják a funkciókat. Google-kulcs nélkül a keresés a TREK Places API-t és az OpenStreetMapet használja.',
  'help.guide.instance-keys.tip.1':
    'Ha egy felhasználónak saját kulcsa van a Beállítások alatt, a TREK nála ezt használja a példány kulcsa helyett.',
  'help.guide.instance-keys.tip.2':
    'A kulcsok környezeti változókból is származhatnak; ezek itt csak olvashatóként jelennek meg.',
  'help.guide.instance-keys.tip.3':
    'A „Napi korlát a Google-hívásokra” meghatározza, mennyit költhet a TREK naponta a kulcsra; a cím melletti jelvény a mai hívásokat számolja. A korlát elérése után a keresések másnapig (UTC) az OpenStreetMapet használják.',
  // places-transit
  'help.guide.places-transit.title': 'A kereső- és a tömegközlekedési szolgáltató kiválasztása',
  'help.guide.places-transit.goal':
    'Válaszd ki, melyik szolgáltatás válaszoljon a helykeresésekre és a tömegközlekedési útvonaltervezésre.',
  'help.guide.places-transit.step.1':
    'A „Tömegközlekedési szolgáltató” alatt választhatsz: „Transitous (ingyenes)”, amely kulcs nélkül működik, és Európában a legerősebb, vagy Google, amely a Google-kulcsot használja. A választás azonnal mentődik.',
  'help.guide.places-transit.step.2':
    'A „Helykeresési szolgáltató” alatt választhatod ki, melyik szolgáltatást kérdezze a TREK, ha a TREK indexe és az OpenStreetMap nem talál semmit: „Automatikus” (Google, ha van kulcs, utána Amap), Google Places, Amap (高德地图) vagy OpenStreetMap.',
  'help.guide.places-transit.result':
    'A TREK minden keresőmezője és minden tömegközlekedési útvonaltervezése ezt a beállítást használja.',
  'help.guide.places-transit.tip.1':
    'Ha egy választott szolgáltatóhoz nincs kulcs, itt figyelmeztetés jelenik meg. A helykeresés ilyenkor csak a TREK indexét és az OpenStreetMapet, a tömegközlekedés csak a Transitoust használja.',
  'help.guide.places-transit.tip.2': 'A Google tömegközlekedési útvonalait kérésenként számlázzák, a Transitoust nem.',
  // file-types
  'help.guide.file-types.title': 'Fájltípusok korlátozása',
  'help.guide.file-types.goal': 'Döntsd el, milyen kiterjesztésű fájlokat lehet feltölteni.',
  'help.guide.file-types.step.1':
    'Az „Engedélyezett fájltípusok” részben szerkeszd a vesszővel elválasztott kiterjesztéslistát, vagy írj be * jelet, ha minden típust engedélyeznél, majd kattints a „Mentés” gombra.',
  'help.guide.file-types.result':
    'Minden más típusú feltöltést a TREK egyértelmű üzenettel elutasít, a dokumentumoknál, az útinaplóban és a borítóknál is.',
  'help.guide.file-types.tip.1':
    'A képtípusokat hagyd a listában; a borítókat és az útinapló fotóit is ugyanez a lista alapján ellenőrzi a rendszer.',
  // toggle-addon
  'help.guide.toggle-addon.title': 'Bővítmény be- vagy kikapcsolása',
  'help.guide.toggle-addon.goal': 'Tegyél elérhetővé mindenki számára egy funkciómodult, vagy távolítsd el.',
  'help.guide.toggle-addon.step.1':
    'Kattints a bővítmény csempéjén a kapcsolóra. A menüpont mindenkinél azonnal megjelenik vagy eltűnik.',
  'help.guide.toggle-addon.step.2':
    'Egyes csempékhez alsorok tartoznak a beállításokkal, például a „Poggyászkövetés” a „Listák” alatt vagy a fotószolgáltatók az „Útinaplók” alatt; ezek csak akkor látszanak, ha a bővítmény be van kapcsolva.',
  'help.guide.toggle-addon.result':
    'Ha kikapcsolsz egy bővítményt, az adatai megmaradnak. Ha visszakapcsolod, az adatok újra megjelennek.',
  'help.guide.toggle-addon.tip.1': 'Az MCP kikapcsolásával eltűnik a végpont és az „Integrációk” tőle függő részei is.',
  'help.guide.toggle-addon.tip.2':
    'A Vacay, az Atlasz és az Útinaplók a felhasználók által leggyakrabban kért bővítmények; a „Dokumentumok” bővítményhez tárhely kell a feltöltésekhez.',
  // install-plugin
  'help.guide.install-plugin.title': 'Plugin telepítése',
  'help.guide.install-plugin.goal':
    'Telepíts egy külső fejlesztésű plugint, és add meg neki pontosan azokat a jogosultságokat, amelyeket kér.',
  'help.guide.install-plugin.step.1':
    'Nyisd meg a „Felfedezés” lapot, keress egy plugint a „Pluginok keresése…” mezővel vagy a „Típus” szűrővel, és kattints a „Telepítés” gombra. Csomagfájlhoz kattints a „Plugin feltöltése” gombra (felhő ikon a kártya jobb felső sarkában), vagy húzd a .zip fájlt az oldalra.',
  'help.guide.install-plugin.step.2':
    'A „Telepítve” alatt olvasd el a sort: mihez férhet hozzá a plugin, mely kiszolgálókhoz csatlakozik, és „Ellenőrizve” és „Aláírva” van-e. Ezután kapcsold be a „Plugin engedélyezése” beállítást; a sorban „Aktív” jelzés jelenik meg.',
  'help.guide.install-plugin.step.3':
    'A sor ⋯ menüjében található az „Újraindítás”, a „Hibanapló megtekintése”, az „Engedélyezett kiszolgálók” és a „Verzióváltás…”, valamint a forrásra mutató linkek; a „Törlés” eltávolítja a plugint és az adatait. Ha újabb verzió érhető el, frissítésként jelenik meg a sorban, és ha új jogosultságokat kér, kikapcsolva marad, amíg jóvá nem hagyod őket.',
  'help.guide.install-plugin.result':
    'A plugin saját folyamatban fut. Amit hozzáad, például widgetek, térképrétegek vagy eszközök, ott jelenik meg, ahol a plugin meghatározza.',
  'help.guide.install-plugin.tip.1':
    'Az „Újraszkennelés” csomag nélkül is megtalálja a fejlesztéshez belinkelt pluginmappát.',
  'help.guide.install-plugin.tip.2':
    'Az aláíratlan plugint a TREK ennek megfelelően jelöli; csak akkor telepítsd, ha megbízol a forrásában.',
  // storage-backends
  'help.guide.storage-backends.title': 'Feltöltések áthelyezése S3-ra vagy tükrözésük',
  'help.guide.storage-backends.goal':
    'Tárold a fájlokat objektumtárhelyen, vagy másold minden feltöltésedet egy második háttértárra is.',
  'help.guide.storage-backends.step.1':
    'A „Backendek” részben kattints a „Backend hozzáadása” gombra, adj neki nevet („Név”), válaszd ki a típust („Típus”: „Helyi” vagy S3), és töltsd ki a mezőit. Ha máshol is szeretnél másolatot, jelöld be a „Tükör célok” közül a megfelelőket. Kattints az „Alkalmaz”, majd az új sorban a „Teszt” gombra a kapcsolat ellenőrzéséhez.',
  'help.guide.storage-backends.step.2':
    'A „Kategóriák” részben rendeld hozzá a feltöltések egyes típusait, például az „Útidokumentumok”, az „Útinapló-fotók” vagy a „Biztonsági mentések” kategóriát, egy-egy backendhez.',
  'help.guide.storage-backends.step.3':
    'Kattints alul a „Módosítások mentése” gombra. Ha egy kategória mostantól máshová mutat, a TREK megkérdezi, hogy a „Meglévő objektumok áthelyezése” vagy a „Csak az új írások irányítása” legyen.',
  'help.guide.storage-backends.result':
    'Az új feltöltések a hozzárendelt backendre kerülnek. Az áthelyezett fájlokat a TREK onnan szolgálja ki, ami pedig nem került áthelyezésre, az a régi helyén marad.',
  'help.guide.storage-backends.tip.1':
    'A környezeti változókkal beállított háttértár itt látszik, de nem szerkeszthető.',
  'help.guide.storage-backends.tip.2':
    'A tükörcél minden új írásról másolatot kap; a sorában lévő „Szinkronizálás most” a korábban tárolt adatokat is átmásolja. A lassú tükörcél az adott backend minden feltöltését lelassítja.',
  // channels-instance
  'help.guide.channels-instance.title': 'Az értesítési csatornák beállítása',
  'help.guide.channels-instance.goal':
    'Döntsd el, mely csatornák közül választhatnak a felhasználók, és állítsd be az e-mailt.',
  'help.guide.channels-instance.step.1':
    'A kártya fejlécében kapcsold be az „E-mail (SMTP)” kapcsolót, add meg az SMTP-kiszolgálót, az SMTP-portot, az SMTP-felhasználót, az SMTP-jelszót és a feladó címét, majd kattints a „Mentés” gombra. A „Teszt e-mail küldése” egy e-mailt küld neked. A „TLS-tanúsítvány ellenőrzésének kihagyása” csak saját tanúsítványt használó helyi levelezőszerverhez való.',
  'help.guide.channels-instance.step.2':
    'Kapcsold be a Webhook, az Ntfy és a Web Push csatornát, hogy elérhetők legyenek. A felhasználók ezután a Beállítások, Értesítések menüpontban adhatják meg a saját URL-jüket vagy témájukat, illetve eszközönként kapcsolhatják be a pusht.',
  'help.guide.channels-instance.step.3':
    'Az „Utazási emlékeztetők” az utazás kezdete előtti emlékeztetőt kapcsolja be vagy ki; az alkalmazáson belüli értesítés mindig be van kapcsolva.',
  'help.guide.channels-instance.result': 'Minden felhasználó „Értesítések” fülén a bekapcsolt csatornák jelennek meg.',
  'help.guide.channels-instance.tip.1':
    'Az adminisztrátori Ntfy kártyán megadott „Ntfy szerver URL” egyben a felhasználók alapértelmezett szervere is. A felhasználók ettől még saját szervert is megadhatnak.',
  'help.guide.channels-instance.tip.2':
    'A plugincsatornák automatikusan megjelennek, amint aktív egy ilyen képességű plugin.',
  // admin-channels
  'help.guide.admin-channels.title': 'Adminesemények a telefonodon',
  'help.guide.admin-channels.goal':
    'Kapj értesítést az új kiadásokról, a hibás tárhelytükrökről és az evezős régiókérésekről.',
  'help.guide.admin-channels.step.1':
    'Az „Admin Ntfy” alatt add meg az adminisztrátori témát, és ha kell, az „Ntfy szerver URL” címet és egy hozzáférési tokent (opcionális); az „Admin webhook” alatt egy URL-t. Mindkét kártyán kattints a „Mentés” gombra.',
  'help.guide.admin-channels.step.2':
    'Kattints a „Teszt Ntfy küldése” vagy a „Teszt webhook küldése” gombra, és nézd meg, megérkezik-e az üzenet.',
  'help.guide.admin-channels.result':
    'Az adminisztrátori események minden rendszergazdához eljutnak az alkalmazásban, és ahol bekapcsoltad, az adminisztrátori ntfy-témára és webhookra is.',
  'help.guide.admin-channels.tip.1':
    'Az admin témát tartsd külön a személyestől, hogy a leállási értesítések ne vesszenek el az utazási üzenetek között.',
  'help.guide.admin-channels.tip.2':
    'Az adminisztrátori webhook és téma független a Beállítások, Értesítések menüpontban megadott saját csatornáidtól.',
  // mcp-tokens-admin
  'help.guide.mcp-tokens-admin.title': 'AI-hozzáférés visszavonása',
  'help.guide.mcp-tokens-admin.goal':
    'Bármelyik felhasználó összes AI-kliensnél lévő tokenjének és munkamenetének megtekintése és visszavonása.',
  'help.guide.mcp-tokens-admin.step.1':
    'Az „OAuth munkamenetek” alatt keresd meg a klienst a neve és a tulajdonosa alapján; a címkéi mutatják a neki megadott hatóköröket. A kuka megerősítés után visszavonja a munkamenetet.',
  'help.guide.mcp-tokens-admin.step.2':
    'Az „API tokenek” részben ugyanez látszik a tokenekhez: név, tulajdonos, „Létrehozva” és „Utoljára használva”. A kuka törli a tokent, és a kliens azonnal leáll.',
  'help.guide.mcp-tokens-admin.result': 'A kliens felhasználójának újra csatlakoztatnia kell. Más nem változik.',
  'help.guide.mcp-tokens-admin.tip.1':
    'A hatókörökből látod, mit tehetett egy kliens; a csak olvasási hatókört nyugodtan meghagyhatod.',
  'help.guide.mcp-tokens-admin.tip.2':
    'Az MCP bővítmény kikapcsolása egyszerre leállít minden klienst, és elrejti ezt a fület, de semmit sem töröl: a tokenek a visszakapcsolás után újra működnek.',
  // release-history
  'help.guide.release-history.title': 'Új kiadás keresése',
  'help.guide.release-history.goal': 'Tudd meg, naprakész-e a TREK-példányod, és mit hoz a következő verzió.',
  'help.guide.release-history.step.1':
    'Ha újabb kiadás jelent meg, az oldal fejléce alatt megjelenik a „Frissítés elérhető” a jelenleg futó verzióval. A „Megtekintés a GitHubon” megnyitja a kiadást, a „Frissítési útmutató” pedig a Dockerhez szükséges parancsokat, más telepítéseknél a frissítési útmutatót mutatja.',
  'help.guide.release-history.step.2':
    'A „Frissítési előzmények” minden kiadást felsorol a kiadási megjegyzésekkel. A „Részletek megjelenítése” kibontja őket, a legújabb kiadáson a „Legújabb” címke látszik, a „Továbbiak betöltése” pedig a régebbi kiadásokat mutatja.',
  'help.guide.release-history.result':
    'A frissítést a gazdagépen végzed, az új image letöltésével vagy az új tag buildelésével; az adatkönyvtár megmarad.',
  'help.guide.release-history.tip.1':
    'Frissítés előtt készíts biztonsági mentést. A „Biztonsági mentés” fül rögtön mellette van.',
  'help.guide.release-history.tip.2':
    'Az előzetes kiadások megjelennek a listában, de nem kínáljuk fel őket frissítésként, kivéve, ha éppen előzetes kiadást futtatsz.',
  // create-backup
  'help.guide.create-backup.title': 'Biztonsági mentés készítése és visszaállítása',
  'help.guide.create-backup.goal':
    'Készíts biztonsági mentést a teljes példányról, tárold egy másolatát máshol is, és legyen mód a visszaállításra.',
  'help.guide.create-backup.step.1':
    'Az „Adatmentés” részben kattints a jobb felső sarokban a „Mentés készítése” gombra. Az adatbázist és a feltöltéseket egyetlen fájlba menti a szerveren.',
  'help.guide.create-backup.step.2':
    'A „Letöltés” gombbal másolatot tárolhatsz a gépen kívül; a kuka megerősítés után törli a régi mentéseket.',
  'help.guide.create-backup.step.3':
    'Egy mentés „Visszaállítás” gombja, vagy a „Mentés feltöltése” egy fájllal, az összes jelenlegi adatot lecseréli, amint a „Mentés visszaállítása?” ablakban az „Igen, visszaállítás” gombra kattintasz.',
  'help.guide.create-backup.result':
    'A visszaállítás a felhasználókat, az utazásokat, a fájlokat és a beállításokat pontosan abba az állapotba hozza vissza, amelyben a mentés idején voltak.',
  'help.guide.create-backup.tip.1':
    'Itt a visszaállítás az egyetlen művelet, amely nem vonható vissza. Előtte készíts friss biztonsági mentést.',
  'help.guide.create-backup.tip.2':
    'A biztonsági mentések az adatkönyvtárba kerülnek. Másold át őket egy másik gépre, hogy akkor is biztonságban legyenek, ha ez a gép meghibásodik.',
  // auto-backup
  'help.guide.auto-backup.title': 'Biztonsági mentések ütemezése',
  'help.guide.auto-backup.goal':
    'A szerver készítsen magáról automatikusan biztonsági mentést, és törölje a régi mentéseket.',
  'help.guide.auto-backup.step.1':
    'Az „Automatikus mentés” részben kapcsold be az „Automatikus mentés engedélyezése” beállítást, és válaszd ki az „Időköz” („Óránként”, „Naponta”, „Hetente” vagy „Havonta”) és a „Futtatás időpontja” értékét, heti vagy havi mentésnél pedig „A hét napja” vagy „A hónap napja” értékét.',
  'help.guide.auto-backup.step.2':
    'A „Régi mentések törlése ennyi idő után” részben add meg, meddig maradjon meg egy mentés, „1 nap” és „Örökre megőrzés” között, majd kattints a „Mentés” gombra.',
  'help.guide.auto-backup.result':
    'A mentések az ütemezés szerint megjelennek a listában. A választott időnél régebbi mentéseket a TREK törli.',
  'help.guide.auto-backup.tip.1':
    'A „Futtatás időpontja” a szerver idejét használja; az alatta lévő tipp megmutatja a szerver időzónáját.',
  'help.guide.auto-backup.tip.2':
    'A szerver tárhelye véges: általában 7 vagy 14 nap elég, ha egy letöltött másolatot máshol is tárolsz.',
  // audit-log
  'help.guide.audit-log.title': 'Az auditnapló olvasása',
  'help.guide.audit-log.goal': 'Derítsd ki, ki mit csinált és mikor.',
  'help.guide.audit-log.step.1':
    'A sorok a legújabbal kezdődnek: „Időpont”, „Felhasználó”, „Művelet”, „Erőforrás”, IP és „Részletek”. A műveletek neve azt írja le, mi történt, például sikertelen bejelentkezés, MFA-módosítás vagy visszaállítás.',
  'help.guide.audit-log.step.2':
    'A jobb felső sarokban lévő „Frissítés” újratölti a listát. A cím melletti jelvény mutatja, hány bejegyzés töltődött be az összesből, a „Továbbiak betöltése” pedig a régebbi bejegyzéseket tölti be.',
  'help.guide.audit-log.result':
    'Van egy nyilvántartásod, amelyet bárkinek megmutathatsz, aki megkérdezi, miért változott meg valami.',
  'help.guide.audit-log.tip.1': 'Az időpontok a szerver időzónája szerint jelennek meg.',
  'help.guide.audit-log.tip.2':
    'A naplóhoz csak hozzáírni lehet; az alkalmazásból semmi sem szerkeszthető vagy törölhető benne.',
  // document-providers
  'help.guide.document-providers.title': 'Dokumentumtár elérhetővé tétele',
  'help.guide.document-providers.goal': 'Döntsd el, mely tárolókkal szinkronizálhatja egy utazás a dokumentumait.',
  'help.guide.document-providers.step.1':
    'A „Dokumentumok” csempe soronként sorolja fel a tárolókat: Paperless-ngx, Papra, Nextcloud, OpenCloud és Synology Drive. Kezdetben mind az öt ki van kapcsolva, és a sorok csak akkor látszanak, ha maga a „Dokumentumok” bővítmény be van kapcsolva.',
  'help.guide.document-providers.step.2':
    'Kapcsold be a kapcsolót a Nextcloud sorában. Megjelenik a „Bővítmény frissítve” üzenet, és innentől az utazások tulajdonosai az utazásaik „Fájl” fülén megtalálják a „Dokumentumok szinkronizálása” lehetőséget, a „Szolgáltató csatlakoztatása” alatt pedig a Nextcloudot.',
  'help.guide.document-providers.result':
    'A tárhely ennek a TREK-nek minden utazásán elérhető. Semmi sem csatlakozik, amíg egy utazás tulajdonosa be nem kapcsolja.',
  'help.guide.document-providers.tip.1':
    'Itt csak arról döntesz, hogy egy tárhely felkínálható-e. A cím és a hitelesítő adatok az adott utazáshoz tartoznak: ezeket az utazás tulajdonosa adja meg az utazás „Fájl” fülén, sosem az adminfelületen.',
  'help.guide.document-providers.tip.2':
    'A „Dokumentumok” kikapcsolásával minden tárhely is kikapcsol, és amíg a „Dokumentumok” ki van kapcsolva, egyetlen tárhelyet sem kapcsolhatsz be: a szerver ezt válaszolja: „Enable the Documents addon first”. A saját hálózatodon lévő tárhelyhez a szerveren az ALLOW_INTERNAL_NETWORK=true beállítás is szükséges.',

  // ── Screen: trip ──────────────────────────────────────────────────────────────────────
  'help.ctx.trip.title': 'Utazás',
  'help.ctx.trip.summary':
    'Egy utazás minden része: a terv a napokkal, a térképpel és a helyekkel, valamint a túrák, a közlekedés, a foglalások, a listák, a költségek, a fájlok, az együttműködés és az összekapcsolt napló fülei. Mindegyiknek saját súgóoldala van ez alatt.',
  'help.ctx.trip.bullet.1':
    'A felső sáv alatti fülsor: „Terv”, „Túrák”, „Közlekedés”, „Foglalások”, „Listák”, „Költségek”, „Fájl”, „Együttműködés”, és ha van összekapcsolt napló, „Napló”. Hogy a TREK-eden mely fülek léteznek, azt a bővítmények és a pluginek határozzák meg.',
  'help.ctx.trip.bullet.2':
    'A „Terv” fül három oszlopból áll: balra a napok, középen a térkép, jobbra a helyek. Az Autós út bővítménnyel a napok oszlopa egy „Nap” és „Autós út” kapcsolóval kezdődik, a Túrák bővítménnyel a helyek oszlopa egy „Hely” és „Túrák” kapcsolóval. A foglalások és a közlekedés a terv részei, a megállóknál és a megállók között jelennek meg; a fülek felsorolják őket.',
  'help.ctx.trip.bullet.3':
    'A bal felső sarokban, az utazás neve melletti „Utazás beállításai” gomb megnyitja az utazás beállításait: „Személyek” (tagok és vendégek), „Megosztás” (a csak olvasható nyilvános link és a meghívó link) és „Napló”.',
  'help.ctx.trip.bullet.4':
    'A címet, a dátumokat, a borítót és a pénznemet az „Utazásaim” oldalon szerkesztheted, az utazáskártya ceruza ikonjával. A bal felső sarokban az utazás nevére kattintva visszajutsz oda.',
  'help.ctx.trip.bullet.5':
    'Az oszlop belső szélén lévő fül összecsukja az oszlopot, és a térkép kitölti a felszabadult helyet. Az összecsukott oszlop helyén a térkép felső sarkában egy kis csempe látszik: rákattintva újra megjelenik az oszlop. Az oszlop melletti vékony elválasztót húzva módosíthatod a szélességét.',
  'help.ctx.trip.bullet.6':
    'A napok eszköztárában lévő visszavonás nyíllal egyenként visszavonhatod a tervben végzett legutóbbi módosításaidat.',
  // add-member
  'help.guide.add-member.title': 'Tag hozzáadása',
  'help.guide.add-member.goal': 'Adj hozzáférést ehhez az utazáshoz valakinek, akinek van TREK-fiókja.',
  'help.guide.add-member.step.1':
    'Kattints a bal felső sarokban, az utazás neve melletti „Utazás beállításai” gombra. A „Személyek” lapon nyílik meg.',
  'help.guide.add-member.step.2':
    'A „Felhasználó meghívása” részben válaszd ki a személyt a „Felhasználó kiválasztása…” listából, és kattints a „Meghívás” gombra.',
  'help.guide.add-member.step.3':
    'A személy mostantól megjelenik a „Hozzáférés” alatt. A tulajdonost a „Tulajdonos” jelvény jelöli. A sor végén lévő „Hozzáférés eltávolítása” megerősítés után eltávolítja a személyt.',
  'help.guide.add-member.result':
    'A tag ugyanúgy látja és szerkesztheti az utazást, mint te, az adminisztrátor által a „Jogosultsági beállítások” alatt megadott kereteken belül.',
  'help.guide.add-member.tip.1':
    'Akit nem találsz a listában, annak még nincs TREK-fiókja: add hozzá vendégként, vagy regisztráljon egy meghívó linkkel.',
  'help.guide.add-member.tip.2':
    'A „Hozzáférés” melletti szám az utazás résztvevőinek számát mutatja; a vendégek külön, lejjebb szerepelnek.',
  // trip-invite-link
  'help.guide.trip-invite-link.title': 'Meghívás linkkel',
  'help.guide.trip-invite-link.goal': 'Az emberek maguk csatlakozhassanak az utazáshoz.',
  'help.guide.trip-invite-link.step.1':
    'Kattints az utazás neve melletti „Utazás beállításai” gombra, és bal oldalon válaszd a „Megosztás” lehetőséget. A „Meghívó link az utazáshoz” alatt kattints a „Meghívó link létrehozása” gombra.',
  'help.guide.trip-invite-link.step.2':
    'Kattints a „Másolás” gombra, és küldd el a linket. Aki TREK-fiókkal megnyitja, tagként csatlakozik.',
  'help.guide.trip-invite-link.step.3':
    'Az „Újragenerálás” lecseréli a linket, és a régi link megszűnik működni; a „Letiltás” kikapcsolja.',
  'help.guide.trip-invite-link.result':
    'Aki megnyitja a linket, csatlakozik az utazáshoz, és megjelenik a „Hozzáférés” alatt.',
  'help.guide.trip-invite-link.tip.1':
    'Fiók nélkül nem használható. Az adminisztrátor az Adminisztrátor, „Felhasználók” alatt hozhat létre regisztrációs linkeket, és egyet ehhez az utazáshoz is kapcsolhat.',
  'help.guide.trip-invite-link.tip.2':
    'Ha a linket rossz csevegésbe küldted, generáld újra: a régi link azonnal megszűnik működni.',
  // add-guest
  'help.guide.add-guest.title': 'Vendég hozzáadása fiók nélkül',
  'help.guide.add-guest.goal': 'Vegyél fel az utazásba valakit, aki nem használja a TREK-et.',
  'help.guide.add-guest.step.1':
    'Kattints az utazás neve melletti „Utazás beállításai” gombra. A „Személyek” lapon a „Vendégek” az utolsó rész, a „Hozzáférés” alatt.',
  'help.guide.add-guest.step.2': 'Írd be a nevet a „Vendég neve” mezőbe, és kattints a „Vendég hozzáadása” gombra.',
  'help.guide.add-guest.result':
    'A vendég hozzárendelhető költségekhez, csomagolási tételekhez és feladatokhoz, de bejelentkezni nem tud.',
  'help.guide.add-guest.tip.1':
    'Az „Átnevezés” (ceruza) módosítja a vendég nevét. A „Hozzáférés eltávolítása” (kuka) megerősítés után eltávolítja a vendéget: a hozzárendelései törlődnek, a kiadásokból rá eső részt pedig a felosztásban szereplő többiek között osztja szét a TREK.',
  'help.guide.add-guest.tip.2': 'Ha a vendég később fiókot kap, hívd meg tagként, a vendéget pedig távolítsd el.',
  // public-link
  'help.guide.public-link.title': 'Csak olvasható link közzététele',
  'help.guide.public-link.goal': 'Mutasd meg az utazást azoknak, akiknek nem kell szerkeszteniük.',
  'help.guide.public-link.step.1':
    'Kattints az utazás neve melletti „Utazás beállításai” gombra, és bal oldalon válaszd a „Megosztás” lehetőséget.',
  'help.guide.public-link.step.2':
    'A „Nyilvános link” kártyán kapcsold be, mit mutathat a link. A „Térkép és terv” mindig be van kapcsolva; a foglalások, a csomagolás, a költségek és a csevegés megjelenítéséről te döntesz.',
  'help.guide.public-link.step.3':
    'Az „Opciók” alatt a „Csak utazás és szállás” kihagyja a programokat, a napi jegyzeteket és az üres napokat. A „Fotók nélkül” kihagyja a helyek fotóit.',
  'help.guide.public-link.result':
    'Aki ismeri a linket, bejelentkezés nélkül látja a kiválasztott részeket, de semmit sem módosíthat.',
  'help.guide.public-link.tip.1':
    'A link sehol sincs nyilvánosan feltüntetve, de bárki megnyithatja, akinél megvan. Kezeld olyan bizalmasan, mint egy jelszót.',
  'help.guide.public-link.tip.2': 'Ha szerkesztési jogot is adnál, inkább vedd fel az illetőt tagként.',
  // transfer-ownership
  'help.guide.transfer-ownership.title': 'Az utazás átadása vagy elhagyása',
  'help.guide.transfer-ownership.goal':
    'Tegyél meg mást tulajdonosnak, vagy lépj ki egy olyan utazásból, amely nem a tiéd.',
  'help.guide.transfer-ownership.step.1':
    'Kattints az utazás neve melletti „Utazás beállításai” gombra. A „Hozzáférés” részben kattints egy tag sorában a „Tulajdonossá tétel” gombra (korona), és erősítsd meg.',
  'help.guide.transfer-ownership.step.2':
    'A saját sorodban az „Utazás elhagyása” megerősítés után eltávolít az utazásból. Ha te vagy a tulajdonos, előbb add át a tulajdonjogot.',
  'help.guide.transfer-ownership.result':
    'Az új tulajdonos kezeli a tagokat, és törölheti az utazást. Te egyszerű tag maradsz.',
  'help.guide.transfer-ownership.tip.1':
    'A tulajdonos az, aki az utazást létrehozta, amíg át nem adja a tulajdonjogot. Az utazást csak a tulajdonos törölheti.',
  'help.guide.transfer-ownership.tip.2':
    'Egy másik tag sorában a „Hozzáférés eltávolítása” fordítva működik: ott a tulajdonos veszi ki az adott tagot az utazásból.',
  // collapse-columns
  'help.guide.collapse-columns.title': 'Több hely a térképnek',
  'help.guide.collapse-columns.goal': 'Csukj össze egy oszlopot, vagy tedd szélesebbé.',
  'help.guide.collapse-columns.step.1':
    'Az oszlop összecsukásához kattints a napok oszlopának belső szélén lévő, panel ikonos fülre; a felszabaduló helyet a térkép foglalja el. A helyek oszlopán ugyanilyen fül van.',
  'help.guide.collapse-columns.step.2':
    'Ha egy oszlop össze van csukva, a térkép felső sarkában egy kis csempe jelenik meg a panel ikonjával; az elemleírásában „Terv” vagy „Hely” áll. Rákattintva az oszlop újra megjelenik.',
  'help.guide.collapse-columns.step.3':
    'Az oszlop szélességét az oszlop és a térkép közötti vékony elválasztó húzásával módosíthatod.',
  'help.guide.collapse-columns.result':
    'A szélességeket megjegyezzük. A következő látogatáskor az oszlopok ismét nyitva lesznek.',
  'help.guide.collapse-columns.tip.1':
    'A két oszlopot egyszerre is összecsukhatod, ha csak a térképet szeretnéd látni.',
  'help.guide.collapse-columns.tip.2':
    'Keskeny ablakban csak egy oszlop fér el: ha az egyiket kinyitod, a másik összecsukódik. Telefonon nincsenek oszlopok; a nézetek között a felül lévő „Utazás”, „Terv” és „Hely” gombbal válthatsz.',
  // undo-change
  'help.guide.undo-change.title': 'Az utolsó módosítás visszavonása',
  'help.guide.undo-change.goal': 'Vond vissza a tervben végzett utolsó módosításodat.',
  'help.guide.undo-change.step.1':
    'Kattints a napok fölötti eszköztárban a visszavonás nyílra; a buboréksúgója megmutatja, melyik módosítást vonja vissza.',
  'help.guide.undo-change.result': 'A terv visszaáll az előző állapotba, és egy rövid üzenet jelzi, mit vontál vissza.',
  'help.guide.undo-change.tip.1':
    'A visszavonás a tervre vonatkozik: helyek hozzáadása, hozzárendelése, eltávolítása, átrendezése, áthelyezése és rögzítése, nap kiürítése, útvonal-optimalizálás, helyek törlése, kategóriamódosítások és importálások.',
  'help.guide.undo-change.tip.2':
    'Újabb kattintással tovább léphetsz vissza: a TREK ezen az utazáson az utolsó 30 módosításodat tartja meg, a legújabbal kezdve, amíg el nem hagyod az utazást.',
  'help.guide.clear-day.title': 'Nap kiürítése',
  'help.guide.clear-day.goal': 'Vedd le egyszerre az összes helyet egy napról, például ha elölről tervezed újra.',
  'help.guide.clear-day.step.1': 'Kattints jobb gombbal a nap fejlécére a tervben.',
  'help.guide.clear-day.step.2': 'Válaszd a „Nap kiürítése” lehetőséget, és erősítsd meg.',
  'help.guide.clear-day.result':
    'A nap kiürül, a helyei pedig nem tervezettként visszakerülnek a listába. A napok fölötti visszavonás nyíllal visszateheted őket.',
  'help.guide.clear-day.tip.1': 'Csak a helyek kerülnek le. A nap jegyzetei és foglalásai megmaradnak.',

  // ── Screen: trip-places ───────────────────────────────────────────────────────────────
  'help.ctx.trip-places.title': 'Helyek',
  'help.ctx.trip-places.summary':
    'A terv jobb oldali oszlopa: az utazás összes helye, tervezett vagy sem, kereséssel, szűrőkkel és rendezéssel, valamint a helyek hozzáadásának módjai: kereséssel, kézzel vagy megosztott listából. A tetején a „Hely” és a „Túrák” gombbal válthatsz a helyek és az utazás túrái között.',
  'help.ctx.trip-places.bullet.1':
    'Az oszlop tetején a „Hely” és a „Túrák” gombbal válthatsz a listák között. Megnyitáskor a „Hely” lista látszik. A „Túrák” az utazás túráit mutatja, és a „GPX vagy KML importálása” gombbal GPX-, KML- és KMZ-fájlokat importálhatsz; a túrák nem jelennek meg a helylistában.',
  'help.ctx.trip-places.bullet.2':
    'A „Hely/Tevékenység hozzáadása” egy keresett vagy beírt hely űrlapját nyitja meg. Ha egy nap meg van nyitva, a gombon „Új hely” áll, a mellette lévő „A naphoz” pedig egyenesen arra a napra hozza létre a helyet.',
  'help.ctx.trip-places.bullet.3':
    'A mellette lévő ikongomb, a „Helyek importálása”, a „Lista importálás” lehetőséget kínálja a Google Mapsből vagy a Naver Mapsből megosztott listákhoz. Ha a rendszergazda kikapcsolta a Túrák bővítményt, a „Fájl importálása” is megjelenik a .gpx, .kml és .kmz fájlokhoz, és fájlt az oszlopra húzva is importálhatsz.',
  'help.ctx.trip-places.bullet.4':
    'Alattuk a „Keresés”, amely a leírásokban és jegyzetekben is keres, mellette pedig a „Jelölés” jelölőnégyzet. Az alatta lévő sorban vannak a szűrők: a „Megjelenítés” a „Mind”, a „Nem tervezett” és a „Tervezett” nézet között vált, mindegyiknél a darabszámmal. A címke gomb kategória, a csillag minimális értékelés, a földgömb (ha az utazás több országot vagy régiót érint) ország vagy régió szerint szűr, a „Rendezés” pedig a lista sorrendjét állítja be.',
  'help.ctx.trip-places.bullet.5':
    'Egy sorban a kép, a név és a leírás vagy a cím látszik, valamint egy csillag az átlagos értékeléssel, ha valaki már értékelte a helyet. Kattints rá a hely részleteiért, húzd egy napra, vagy kattints rá jobb gombbal (illetve a három pontra, „További lehetőségek”) a „Szerkesztés”, „+ Nap”, „Weboldal megnyitása”, Google Maps, „Mentés gyűjteménybe” és „Törlés” eléréséhez.',
  'help.ctx.trip-places.bullet.6':
    'Ha egy nap meg van nyitva, a sor végén lévő kerek + gomb („+ Nap”) arra a napra teszi a helyet. Minden olyan helynél megjelenik, amely még nem szerepel azon a napon. A „Tervezett” ilyenkor csak azt a napot mutatja, és ezt a „Csak a megnyitott nap látszik” címke jelzi. A címke x gombja („Teljes utazás megjelenítése”) bezárja a napot.',
  // create-place
  'help.guide.create-place.title': 'Hely létrehozása',
  'help.guide.create-place.goal':
    'Hely vagy tevékenység kézi hozzáadása minden olyan adattal, amelyre a tervhez szükség van.',
  'help.guide.create-place.step.1':
    'Kattints a helyek oszlopának tetején a „Hely/Tevékenység hozzáadása” gombra (ha egy nap meg van nyitva, „Új hely”). Az űrlap a keresőmezőben villogó kurzorral nyílik meg.',
  'help.guide.create-place.step.2':
    'Írd be a helyet a „Helyek keresése…” mezőbe, és válassz egy találatot. Kitöltődik az ablak tetején lévő név, a „Cím”, a „Szélességi fok”, a „Hosszúsági fok” és a „Weboldal”, a bal oldali „Hely részletei” pedig képeket, nyitvatartást és leírást mutat. Google-kulccsal rendelkező TREK-en a találatok alatti „Nem ez a hely? Keresés a Google-lel” ugyanezt a keresést a Google-lel futtatja le. Bekapcsolt Gyűjtemények bővítménnyel a jobb oldali „Mentett helyek” ugyanígy kínálja fel a listáid helyeit.',
  'help.guide.create-place.step.3':
    'A „Hely részletei” részben a „Válassz képet” alatt kattints egy képre, és az lesz a hely képe. A „Szöveg átvétele” bemásolja a leírást az űrlapba.',
  'help.guide.create-place.step.4':
    'Ellenőrizd az űrlap mezőit. Csak az ablak tetején lévő név kötelező. Az alatta lévő „Kategória” gombbal az utazás egyik kategóriáját választhatod ki, a mellette lévő + gombbal újat hozhatsz létre. A „Cím”, a „Szélességi fok” és a „Hosszúsági fok” a keresésből jön, vagy te írod be. A „Leírás” és a „Jegyzetek” a saját szövegeidnek való. A „Weboldal” mezőbe a linket írhatod, a „Fájl” alatti „Csatolás” dokumentumot ad hozzá, a „Telefon”, az „E-mail” és a „Nyitvatartás hozzáadása” pedig azokhoz az adatokhoz való, amelyeket a keresés nem talált meg.',
  'help.guide.create-place.step.5':
    'Kattints a „Hozzáadás” gombra. Ha az utazásban már van azonos nevű vagy azonos helyen lévő hely, a TREK figyelmeztet, és a gomb felirata „Hozzáadás mindenképp” lesz.',
  'help.guide.create-place.result':
    'A hely bekerül a listába és a térképre, a „Nem tervezett” csoportba, amíg egy napra nem teszed.',
  'help.guide.create-place.tip.1':
    'Ha a Költségvetés bővítmény be van kapcsolva, az űrlap alján lévő „Költség” mentés után azonnal megnyitja a „Költségek” szerkesztőt a hely kiadásához. Az ablakba beillesztett kép vagy PDF fájlként csatolódik a „Fájl” részhez.',
  'help.guide.create-place.tip.2':
    'A keresési találatokat minden TREK-példányon a TREK indexe és az OpenStreetMap adja, a „Hely részletei” pedig automatikusan kitöltődik a Wikipedia, a Wikivoyage és a Wikimedia adataiból. A TREK csak akkor fordul a Google-höz, ha egyik sem talál semmit, és értékeléseket csak a Google ad.',
  'help.guide.create-place.tip.3':
    'Helyet a térképen is létrehozhatsz: kattints jobb gombbal a kívánt pontra, és az űrlap a koordinátákkal és a címmel kitöltve nyílik meg.',
  // place-to-open-day
  'help.guide.place-to-open-day.title': 'Hely hozzáadása közvetlenül a megnyitott naphoz',
  'help.guide.place-to-open-day.goal': 'Hozz létre vagy válassz ki egy helyet, és egy lépésben add hozzá a naphoz.',
  'help.guide.place-to-open-day.step.1':
    'A napok oszlopában kattints egy nap fejlécére. A nap megnyílik: a kártyája kiemelve látszik, a helyek oszlopában pedig az „Új hely” mellett megjelenik „A naphoz” gomb.',
  'help.guide.place-to-open-day.step.2':
    '„A naphoz” ugyanazt az űrlapot nyitja meg, mint az „Új hely”, de a hely a „Hozzáadás” gombra kattintva azonnal a megnyitott napra kerül.',
  'help.guide.place-to-open-day.step.3':
    'Ha egy már meglévő helyet tennél a megnyitott napra, kattints a sora végén lévő kerek + gombra („+ Nap”), vagy kattints rá jobb gombbal, és válaszd a „+ Nap” lehetőséget. A + minden olyan helynél megjelenik, amely még nem szerepel azon a napon.',
  'help.guide.place-to-open-day.step.4':
    'Fordítva is működik, nap megnyitása nélkül: húzd ki a hely sorát az oszlopból, és ejtsd egy napkártyára. Ha két megálló közé ejted, pontosan oda kerül.',
  'help.guide.place-to-open-day.result': 'A hely a nap végére kerül. Húzd feljebb vagy lejjebb a megfelelő helyre.',
  'help.guide.place-to-open-day.tip.1':
    'A megnyitott nap a keresést is befolyásolja: ha egy nap meg van nyitva, a térkép és a közeli keresés az adott napon már szereplő helyekből indul ki.',
  'help.guide.place-to-open-day.tip.2': 'A napok fölötti eszköztár „Visszavonás” gombja visszavonja a hozzárendelést.',
  // filter-places
  'help.guide.filter-places.title': 'Hely keresése a listában',
  'help.guide.filter-places.goal': 'Az oszlopban csak a keresett helyek jelenjenek meg.',
  'help.guide.filter-places.step.1':
    'A keresőmező alatti „Megjelenítés” legördülő menüvel válthatsz a „Mind”, a „Nem tervezett” (még egyik napon sem szerepel) és a „Tervezett” (szerepel egy napon) nézet között, mindegyiknél a darabszámmal. Ha a Túrák bővítmény ki van kapcsolva, és importáltak GPX-nyomvonalat, a „Nyomvonalak” is választható.',
  'help.guide.filter-places.step.2':
    'Írj a felül lévő „Keresés” mezőbe. A lista gépelés közben szűkül név, cím, leírás és jegyzetek alapján; a mezőben lévő x törli a keresést.',
  'help.guide.filter-places.step.3':
    'A „Megjelenítés” melletti címkegomb felsorolja a kategóriákat: jelölj be egyet vagy többet, akár a „Nincs kategória” lehetőséget is. A gombon látszik, hány van bejelölve, a lista alján pedig a „Szűrő törlése” mindet eltávolítja.',
  'help.guide.filter-places.step.4':
    'A mellette lévő csillaggal minimális értékelést állíthatsz be: az 5+, a 4+ és így tovább csak azokat a helyeket hagyja meg, amelyek átlagos értékelése legalább ennyi. Az értékelés nélküli helyek rejtve maradnak.',
  'help.guide.filter-places.result':
    'A „Megjelenítés” gombon lévő szám mutatja, hány hely felel meg a feltételeknek, és a szűrők összeadódnak.',
  'help.guide.filter-places.tip.1':
    'Ha egy nap meg van nyitva, a „Tervezett” csak azt a napot listázza, és ezt jelzi is: „Csak a megnyitott nap látszik”, mellette a „Teljes utazás megjelenítése” lehetőséggel.',
  'help.guide.filter-places.tip.2':
    'A térkép is figyelembe veszi a „Megjelenítés”, a kategóriák és az értékelés szűrőjét, és megnyitott napnál a „Tervezett” a térképen csak azt a napot mutatja. A keresés és a földgömb csak a listát szűri.',
  // edit-place
  'help.guide.edit-place.title': 'Hely módosítása',
  'help.guide.edit-place.goal':
    'Javíts ki egy nevet, helyezd át a gombostűt, adj meg weboldalt, vagy módosítsd a kategóriát.',
  'help.guide.edit-place.step.1':
    'Kattints jobb gombbal a sorra, és válaszd a „Szerkesztés” lehetőséget, vagy kattints a sor végén a „További lehetőségek” gombra, vagy nyisd meg a helyet, és a részleteinél kattints a „Szerkesztés” gombra.',
  'help.guide.edit-place.step.2':
    'A „Hely szerkesztése” ablakban módosítsd, amit kell: a nevet és a „Kategória” gombot az ablak tetején, a „Cím”, a „Szélességi fok”, a „Hosszúsági fok”, a „Leírás”, a „Jegyzetek”, a „Weboldal”, a „Telefon”, az „E-mail” mezőt és a nyitvatartást. Ha a hely pontosan egy napon szerepel, vagy egy napról nyitottad meg, az űrlapon a „Kezdés”, a „Befejezés” és a „Jegyzetek erre a napra” mező is megjelenik.',
  'help.guide.edit-place.step.3': 'Kattints a „Frissítés” gombra.',
  'help.guide.edit-place.result':
    'A módosítás mindenhol érvényes, ahol a hely szerepel: a listában, a térképen és minden napon, amelyre be van osztva.',
  'help.guide.edit-place.tip.1':
    'A „Jegyzetek erre a napra” a helyhez csak azon az egy napon tartozik, a „Jegyzetek” viszont magához a helyhez.',
  'help.guide.edit-place.tip.2':
    'Ha a „Befejezés” a „Kezdés” előtt van, a „Frissítés” nem lehetséges; az „Időbeli átfedés:” csak figyelmeztet, hogy a nap egy másik megállója ugyanarra az időre esik.',
  // delete-place
  'help.guide.delete-place.title': 'Hely törlése',
  'help.guide.delete-place.goal': 'Hely végleges eltávolítása az utazásból.',
  'help.guide.delete-place.step.1':
    'Kattints jobb gombbal a sorra, és válaszd a „Törlés” lehetőséget (a sor végén lévő „További lehetőségek” menüben is megtalálod), vagy kattints a hely részleteiben a „Törlés” gombra.',
  'help.guide.delete-place.step.2':
    'A megerősítő kérdésnél kattints a „Törlés” gombra. Ha a helyen éjszakát foglaltak, vagy foglalás kapcsolódik hozzá, a kérdés jelzi, mi törlődik vele együtt.',
  'help.guide.delete-place.result':
    'A hely eltűnik a listából, a térképről és az összes napról. A napok fölötti eszköztárban a „Visszavonás” visszaállítja.',
  'help.guide.delete-place.tip.1':
    'Ha csak egy napról vennéd le a helyet, használd inkább az adott megálló „Eltávolítás a napról” pontját.',
  'help.guide.delete-place.tip.2':
    'Ha egyszerre több helyet szeretnél törölni, kattints a kereső melletti pipára, és kezdj kijelölni.',
  // select-places
  'help.guide.select-places.title': 'Több hely módosítása vagy törlése egyszerre',
  'help.guide.select-places.goal': 'Módosíts egyszerre több helyet, ne egyenként.',
  'help.guide.select-places.step.1':
    'Kattints a keresőmező melletti pipára. A sorok kerek jelölőnégyzeteket kapnak, az oszlop alján pedig megjelenik egy sáv a műveletekkel.',
  'help.guide.select-places.step.2':
    'A sorokra kattintva jelölheted ki őket. Az „Összes kijelölése” (a sávban lévő dupla pipa) minden olyan sort kijelöl, amelyet a szűrők megjelenítenek.',
  'help.guide.select-places.step.3':
    'A sáv mutatja a bejelölt helyek számát. A „Kategória módosítása” mindegyiknek ugyanazt a kategóriát adja; a „Mentés gyűjteménybe” (bekapcsolt Gyűjtemények bővítménnyel) átmásolja őket az egyik gyűjteményedbe; a „Kijelöltek törlése” megerősítés után eltávolítja őket.',
  'help.guide.select-places.step.4': 'A kijelölés befejezéséhez kattints a sáv végén lévő X-re („Kész”).',
  'help.guide.select-places.result':
    'A módosítás minden kijelölt helyre vonatkozik; a törlést a napok fölötti eszköztárból vonhatod vissza.',
  'help.guide.select-places.tip.1':
    'A szűrők kijelölés közben is működnek: előbb szűrj a „Nem tervezett” helyekre, és az „Összes kijelölése” csak ezeket jelöli ki.',
  'help.guide.select-places.tip.2':
    'Ha a „Gyűjtemények” bővítmény be van kapcsolva, a sávban megjelenik a „Megjelölés látogatottként a listáidban” lehetőség: ez meglátogatottnak jelöli a helyeket azokban a gyűjteményekben, amelyekbe el vannak mentve.',
  // import-places-file
  'help.guide.import-places-file.title': 'Helyek importálása GPX, KML vagy KMZ fájlból',
  'help.guide.import-places-file.goal':
    'Ha a Túrák bővítmény ki van kapcsolva, importáld helyekként a Google My Maps, a Google Earth vagy egy GPS-nyomkövető által exportált pontokat és útvonalakat.',
  'help.guide.import-places-file.step.1':
    'Kattints a hozzáadás gomb melletti ikongombra („Helyek importálása”), és válaszd a „Fájl importálása” lehetőséget, vagy ejtsd a fájlt bárhová a helyek oszlopában. Mindkettő csak akkor érhető el, ha a rendszergazda kikapcsolta a Túrák bővítményt.',
  'help.guide.import-places-file.step.2':
    'Válaszd ki a fájlt, vagy húzd a mezőbe. GPX-nél jelöld be, mit importálsz: „Útpontok”, „Útvonalak”, „Nyomvonalak (útvonalgeometriával)”. KML-nél és KMZ-nél jelöld be a „Pontok (Placemarks)” és az „Útvonalak (LineStrings)” lehetőséget.',
  'help.guide.import-places-file.step.3':
    'A mezőbe egyszerre több fájlt is húzhatsz, de csak .gpx, .kml és .kmz fájlt. Minden más fájltípust, illetve a 10 MB-nál nagyobb fájlokat az ablak elutasítja, és nem importálja.',
  'help.guide.import-places-file.step.4':
    'Kattints az „Importálás” gombra. Egy üzenet jelzi, hány helyet importáltál. KML- vagy KMZ-fájlnál az ablak nyitva marad, és összefoglalja, mi jött létre, és mi maradt ki.',
  'help.guide.import-places-file.result':
    'A helyek bekerültek a listába. A nyomvonalak sorában színes vonal látszik, a térképen megjelennek, és saját „Nyomvonalak” szűrőt kapnak.',
  'help.guide.import-places-file.tip.1':
    'A túl nagy fájlt a TREK elutasítja, és megmutatja a méretkorlátot; exportáld újra fotók nélkül, vagy oszd fel.',
  'help.guide.import-places-file.tip.2': 'A teljes importálást visszavonhatod a napok fölötti eszköztárból.',
  // import-places-list
  'help.guide.import-places-list.title': 'Megosztott Google Maps- vagy Naver Maps-lista importálása',
  'help.guide.import-places-list.goal': 'Helyek importálása megosztott lista linkjéből.',
  'help.guide.import-places-list.step.1':
    'Kattints a hozzáadás gomb melletti ikongombra („Helyek importálása”), és válaszd a „Lista importálás” lehetőséget.',
  'help.guide.import-places-list.step.2':
    'A „Szolgáltató” alatt válaszd a „Google Lista” vagy a „Naver Lista” lehetőséget, majd illeszd be a lista megosztott linkjét a „Link” mezőbe. Google Maps-útvonaltervező link is működik: a megállói helyek lesznek, az autós útvonal sorrendjében.',
  'help.guide.import-places-list.step.3': 'Kattints az „Importálás” gombra.',
  'help.guide.import-places-list.result':
    'A lista összes helye bekerült az utazásba, a listában szereplő néven; az utazásban már meglévő helyeket a TREK kihagyja.',
  'help.guide.import-places-list.tip.1':
    'A listának nyilvánosan megosztottnak kell lennie; egy privát lista linkjéből semmi sem importálódik.',
  'help.guide.import-places-list.tip.2':
    'Ha a TREK-példányodhoz tartozik Google-kulcs, az ablakban megjelenik a „Helyek gazdagítása a Google-lel” lehetőség: ez minden importált helyet megkeres, és kitölti a fotókat, a címet és a részleteket.',
  'help.guide.sort-places.title': 'A helyek listájának rendezése',
  'help.guide.sort-places.goal':
    'Rendezd a listát név, értékelés vagy aszerint, mit adtál hozzá vagy módosítottál utoljára.',
  'help.guide.sort-places.step.1':
    'Kattints a szűrősor végén lévő nyilas gombra („Rendezés”). Pipa jelöli a jelenlegi sorrendet, a gomb elemleírása pedig a nevét mutatja.',
  'help.guide.sort-places.step.2':
    'Válassz sorrendet, például „Legjobbra értékelt”, vagy rendezz név szerint. A lista azonnal frissül.',
  'help.guide.sort-places.result': 'A lista a választott sorrendben mutatja a helyeket, amíg másikat nem választasz.',
  'help.guide.sort-places.tip.1':
    'A „Legutóbb hozzáadott” kivételével minden rendezésnél kiemelve látszik a gomb, így rögtön tudod, hogy a lista más sorrendben van.',
  'help.guide.sort-places.tip.2':
    'A rendezés csak a listát módosítja. A napok megtartják a saját sorrendjüket, a böngésződ pedig megjegyzi a választott rendezést.',
  'help.guide.place-by-hand.title': 'Olyan hely hozzáadása, amelyet a keresés nem talál',
  'help.guide.place-by-hand.goal':
    'Ha a helykereső nem talál semmit, add meg magad a helyet a telefonszámával, e-mail-címével és nyitvatartásával.',
  'help.guide.place-by-hand.step.1':
    'A hely ablakában írd be a nevet a keresőbe, és nyomj Entert. Ha nincs találat, az ablak jelzi ezt, és felajánlja a „Kézi hozzáadás” lehetőséget.',
  'help.guide.place-by-hand.step.2':
    'Kattints a „Kézi hozzáadás” gombra. A keresett szöveg lesz a név, az ablak pedig a kapcsolati mezőkhöz görget.',
  'help.guide.place-by-hand.step.3': 'Ha ismered, töltsd ki a „Telefon” és az „E-mail” mezőt.',
  'help.guide.place-by-hand.step.4':
    'Kattints a „Nyitvatartás hozzáadása” gombra, és add meg, mikor nyit és mikor zár a hely az egyes napokon. A másolás gombbal az első nap nyitvatartása minden napra átkerül, egy nap kapcsolójával pedig „Zárva” állapotúra állíthatod.',
  'help.guide.place-by-hand.step.5': 'Kattints a „Hozzáadás” gombra.',
  'help.guide.place-by-hand.result':
    'A hely bekerül a listába. A részleteinél a megadott telefonszám, e-mail-cím és nyitvatartás látszik, ugyanúgy, mint egy kereséssel talált helynél.',
  'help.guide.place-by-hand.tip.1':
    'Ha olyan helyet szerkesztesz, amelynek nincs saját nyitvatartása, az automatikusan átveszi a bal oldali „Hely részletei” részből. Ha már van nyitvatartása, a mellette lévő gombbal veheted át a kikeresettet.',
  'help.guide.place-by-hand.tip.2':
    'Az általad megadott nyitvatartás felülírja a lekérdezettet, így egy szezonálisan nyitva tartó kávézónál azt látod, amit te tudsz róla.',

  // ── Screen: trip-days ─────────────────────────────────────────────────────────────────
  'help.ctx.trip-days.title': 'Nap',
  'help.ctx.trip-days.summary':
    'A terv bal oldali oszlopa: minden napnak saját kártyája van a megállókkal sorrendben, a jegyzetekkel, a nap foglalásaival és közlekedésével, valamint a megállók közötti útvonallal. Itt készül valójában az utazás terve.',
  'help.ctx.trip-days.bullet.1':
    'A fejléc felül: balra az „Exportálás” (PDF, naptár, GPX); jobbra a visszavonás nyíl, a „Minden nap kibontása” / „Minden nap összecsukása”, a „Napok átrendezése”, és ha egy foglalásnak van megrajzolható útvonala, az „Összes foglalási útvonal megjelenítése”.',
  'help.ctx.trip-days.bullet.2':
    'Napkártya: egy csempe a nap számával és az időjárás-előrejelzéssel, a cím (amíg el nem nevezed, „1. nap”) és a dátum, alattuk pedig gombok az éjszakai szálláshoz (a bejelentkezés napján zöld, a kijelentkezés napján piros, amíg nincs megerősítve, szaggatott; a jegy ikonja megnyitja a foglalást) és a bérautóhoz. A fejlécre kattintva megnyitod a napot, a nyíllal összecsukod, a + gomb („Hozzáadás a naphoz”) pedig menüt nyit: „Hely hozzáadása ehhez a naphoz”, „Szállás hozzáadása”, „Közlekedés hozzáadása”, „Tömegközlekedés” és „Jegyzet hozzáadása”. A fejlécen jobb gombbal kattintva ugyanezt éred el, plusz a „Nap kiürítése” lehetőséget.',
  'help.ctx.trip-days.bullet.3':
    'Egy napon belül: a megállók sorrendben, mindegyik képpel, kategóriaikonnal, névvel, időponttal és leírással, a hozzá kapcsolódó foglalásokkal és azzal, hogy ki megy; a jegyzetek; a nap foglalásai és közlekedése, a típusuk szerint színezve. Ha egy megálló fölé viszed az egeret, megjelenik a fogantyú, a kép lakatja, a nyilak, a „Foglalás hozzáadása” és a három pont („További lehetőségek”). A megállók és a jegyzetek menüjét jobb gombbal kattintva is megnyithatod.',
  'help.ctx.trip-days.bullet.4':
    'Ha a megnyitott napon legalább két megálló van, alattuk megjelenik az útvonalsáv: az „Útvonal” megmutatja a napot a térképen, és kiírja a megállók közötti szakaszok menetidejét, a három ikonnal az „Autó”, a „Gyalog” vagy a „Kerékpár” módot állíthatod be a napra, ezt követi az „Optimalizálás”, a „Megnyitás a Google Térképben” és a „Megnyitás a CoMaps-ben”.',
  'help.ctx.trip-days.bullet.5':
    'Többféleképpen tehetsz helyeket egy napra: áthúzhatsz egy sort a helyek oszlopából, használhatod a sor „+ Nap” gombját, a nap + menüjében vagy egy üres napon a „Hely hozzáadása ehhez a naphoz” lehetőséget, vagy a hely részleteit.',
  'help.ctx.trip-days.bullet.6':
    'Az alul lévő „Összköltség” összeadja a „Költségek” fülről azokat a kiadásokat, amelyek a nap megállóihoz és foglalásaihoz tartoznak, mindegyiket egyszer, a megjelenítési pénznemedben.',
  // read-day-plan
  'help.guide.read-day-plan.title': 'Egy nap áttekintése',
  'help.guide.read-day-plan.goal': 'Értsd meg a napkártya minden részét, mielőtt bármit módosítanál.',
  'help.guide.read-day-plan.step.1':
    'A fejléc: egy csempe a nap sorszámával és az időjárás-előrejelzéssel, majd az „1. nap” vagy az általad adott cím és a dátum. Alattuk gombok az éjszakai szálláshoz (a bejelentkezés napján zöld, a kijelentkezés napján piros, amíg nincs megerősítve, szaggatott; a rajta lévő jegy ikon megnyitja a foglalást) és a bérautóhoz. A fejlécre kattintva megnyitod a napot (a részletpanel a térkép fölött nyílik meg). A jobb oldali + gomb („Hozzáadás a naphoz”) helyet, szállást, közlekedést, tömegközlekedési kapcsolatot vagy jegyzetet ad hozzá, a nyíl pedig összecsukja a kártyát.',
  'help.guide.read-day-plan.step.2':
    'Egy megállónál látod a képét, a kategóriaikonját és a nevét, ha van „Kezdés” időpontja, akkor azt is, valamint a leírását. Alatta jelennek meg a „Jegyzetek erre a napra”. Ha a sor fölé viszed az egeret, megjelennek a vezérlők: a bal oldali fogantyúval húzhatod, a kép lakattá változik az útvonal-optimalizáláshoz, a jobb szélen pedig ott vannak a nyilak („Mozgatás felfelé”, „Mozgatás lefelé”), a „Foglalás hozzáadása” és a három pont („További lehetőségek”).',
  'help.guide.read-day-plan.step.3':
    'A megállóhoz tartozó foglalás „Foglalás” jelvényként jelenik meg rajta, megerősítve zöld, függőben borostyánsárga színnel, az időponttal és a szolgáltatóval. Kattints a jelvényre a foglalás megnyitásához; a mellette lévő útvonalgomb megrajzolja az útvonalát. A közlekedésnek saját sora van, a típusa szerint színezve, az időponttal és az „Indulás” vagy „Érkezés” jelöléssel. Egy foglalásra kattintva megnyílnak a részletei; az ott található „Szerkesztés” gombbal módosíthatod.',
  'help.guide.read-day-plan.step.4':
    'Ha az „Útvonal” be van kapcsolva, a két megálló közötti összekötő mutatja, mennyi ideig tart és milyen hosszú a szakasz a nap közlekedési módjával; rákattintva csak arra az egy szakaszra módosíthatod a módot.',
  'help.guide.read-day-plan.step.5':
    'A megnyitott nap megállói alatti útvonalsáv: az „Útvonal” megrajzolja a nap útvonalát a térképen, a három ikonnal az „Autó”, a „Gyalog” vagy a „Kerékpár” módot választhatod, az „Optimalizálás” átrendezi a megállókat, a „Megnyitás a Google Térképben” és a „Megnyitás a CoMaps-ben” pedig ott nyitja meg a napot.',
  'help.guide.read-day-plan.result':
    'A kártyán minden jelnek jelentése van; az alábbi útmutatók elmagyarázzák, hogyan módosíthatod őket.',
  'help.guide.read-day-plan.tip.1':
    'Kattints jobb gombbal egy megállóra, vagy a három pontjára, és megnyílik a menüje: „Szerkesztés”, „Eltávolítás a napról”, „Kihagyás az útvonalból”, „Weboldal megnyitása”, „Mentés gyűjteménybe”, „Törlés”. A navigációs alkalmazásokat a hely részleteinél, a „Navigáció” alatt találod.',
  'help.guide.read-day-plan.tip.2':
    'Ha egy megálló fölé viszed az egeret, a sor végén megjelenik a „Foglalás hozzáadása”. Az így létrehozott foglalás ehhez a megállóhoz kapcsolódik ezen a napon.',
  // place-onto-day
  'help.guide.place-onto-day.title': 'Hely hozzáadása egy naphoz',
  'help.guide.place-onto-day.goal': 'Tegyél egy helyet a listából egy nap megállójává, a sorrend megfelelő pontján.',
  'help.guide.place-onto-day.step.1':
    'Húzz egy sort a helyek oszlopából a napkártyára. Ha két megálló közé ejted, pontosan oda kerül, ha a nap fejlécére, akkor a nap végére.',
  'help.guide.place-onto-day.step.2':
    'Húzás nélkül: nyisd meg a napot a fejlécére kattintva, majd kattints a hely sorának végén lévő kerek + gombra („+ Nap”), vagy kattints jobb gombbal a sorra, és válaszd a „+ Nap” lehetőséget.',
  'help.guide.place-onto-day.step.3':
    'A „Hely hozzáadása ehhez a naphoz” a nap + menüjében vagy egy üres napon megnyitja a helyűrlapot, és az új hely azonnal a napra kerül.',
  'help.guide.place-onto-day.step.4':
    'Ha egy nap meg van nyitva, a hely részleteinél a „Hozzáadás a naphoz” arra a napra teszi; a helyek oszlopának fejlécében „A naphoz” pedig új helyet hoz létre közvetlenül a megnyitott napon.',
  'help.guide.place-onto-day.result':
    'A hely mostantól a nap egyik megállója. A térképen a nap számával jelenik meg, a helyek oszlopa pedig a „Tervezett” alatt számolja.',
  'help.guide.place-onto-day.tip.1':
    'Egy hely több napon is szerepelhet: a második napra a helyek oszlopából tedd fel. Ha viszont egy megállót egyik napkártyáról a másikra húzol, azzal áthelyezed.',
  'help.guide.place-onto-day.tip.2': 'A fejléc visszavonás nyila visszavonja a hozzárendelést.',
  'help.guide.place-onto-day.tip.3':
    'Megállót nem tehetsz két rögzített időpontú elem közé, sem egy már időponttal rendelkező foglalás elé; a terv mindig időrendben marad.',
  // reorder-stops
  'help.guide.reorder-stops.title': 'Egy nap sorrendjének módosítása',
  'help.guide.reorder-stops.goal': 'Mozgass egy megállót feljebb vagy lejjebb, vagy át egy másik napra.',
  'help.guide.reorder-stops.step.1':
    'Vidd az egeret a megálló fölé, és a fogantyújánál fogva húzd az új helyére a kártyán belül.',
  'help.guide.reorder-stops.step.2':
    'Vagy használd a megálló jobb szélén megjelenő nyilakat („Mozgatás felfelé”, „Mozgatás lefelé”): kattintásonként egy hellyel mozdul.',
  'help.guide.reorder-stops.step.3':
    'Ha egy megállót másik napkártyára húzol, átkerül arra a napra, és lekerül a régiről.',
  'help.guide.reorder-stops.step.4':
    'Ha egy megállónak rögzített időpontja van, és az áthelyezés felborítaná a nap sorrendjét, a TREK megkérdezi: „Időpont eltávolítása?”, mert az időpont határozza meg a megálló helyét. A „Megerősítés” törli az időpontot, így a megálló bárhová kerülhet. A „Mégse” változatlanul hagyja a napot.',
  'help.guide.reorder-stops.result': 'Az útvonal és a menetidők azonnal az új sorrendhez igazodnak.',
  'help.guide.reorder-stops.tip.1':
    'A rögzített időpontú foglalás az időpontjának megfelelő helyen marad. Ha a napján belül máshová ejted, visszaugrik. Ha egy másik napkártyára húzod, átkerül arra a napra.',
  'help.guide.reorder-stops.tip.2':
    'Ha a napon legalább három megálló van, az útvonalsávban lévő „Optimalizálás” a legrövidebb útvonal szerint rendezi a teljes napot. Ha egy megállót a helyén szeretnél tartani, előbb rögzítsd.',
  // set-stop-times
  'help.guide.set-stop-times.title': 'Időpont megadása egy megállóhoz',
  'help.guide.set-stop-times.goal':
    'Add meg, mikor kezdődik és mikor ér véget egy megálló, hogy a nap menetrendként működjön.',
  'help.guide.set-stop-times.step.1':
    'Kattints jobb gombbal a megállóra, vagy kattints a három pontjára, és válaszd a „Szerkesztés” lehetőséget. Ha a napról nyitod meg az űrlapot, közvetlenül a helyszín alatt megjelenik a „Kezdés” és a „Befejezés” mező az adott napra.',
  'help.guide.set-stop-times.step.2':
    'Add meg a „Kezdés” időpontot, és ha szeretnéd, a „Befejezés” időpontot is. Az „Időbeli átfedés:” figyelmeztetés jelzi, ha a nap egy másik időponthoz kötött megállójával átfedés van. Ha a befejezés a kezdés elé esik, a „Frissítés” gomb nem használható.',
  'help.guide.set-stop-times.step.3':
    'Kattints a „Frissítés” gombra. A megálló időpont-jelvényt kap, és az időpontja szerinti helyre kerül a napon belül.',
  'help.guide.set-stop-times.result':
    'Az időponthoz kötött megállók megtartják a helyüket a sorrendben, az időpont nélküliek ezek köré rendeződnek.',
  'help.guide.set-stop-times.tip.1':
    'Az időpont az adott napi megállóhoz tartozik; ugyanannak a helynek egy másik napon más időpontja lehet.',
  'help.guide.set-stop-times.tip.2':
    'Időponthoz kötött megállót úgy mozgathatsz kézzel, hogy áthúzod. A TREK ekkor megkérdezi: „Időpont eltávolítása?”, és ha a „Megerősítés” gombra kattintasz, az időpont törlődik.',
  'help.guide.set-stop-times.tip.3':
    'Ugyanebben az űrlapban a „Jegyzetek erre a napra” mező olyan információkra való, amelyek csak erre a napra érvényesek, például egy asztalfoglalás vagy egy jegyszám.',
  // remove-from-day
  'help.guide.remove-from-day.title': 'Megálló eltávolítása egy napról',
  'help.guide.remove-from-day.goal': 'Hely eltávolítása egy napról úgy, hogy az utazásban megmaradjon.',
  'help.guide.remove-from-day.step.1':
    'Kattints jobb gombbal a megállóra, vagy a három pontjára, és válaszd az „Eltávolítás a napról” lehetőséget.',
  'help.guide.remove-from-day.step.2':
    'A megálló lekerül a napról. A hely a helyek oszlopában marad, és ha más napon sem szerepel, a „Nem tervezett” alá kerül.',
  'help.guide.remove-from-day.result':
    'A nap, az útvonala és a költsége frissül. A visszavonás nyíllal visszaállíthatod a megállót.',
  'help.guide.remove-from-day.tip.1':
    'Ugyanebben a menüben a „Törlés” az egész utazásból eltávolítja a helyet, minden napról.',
  'help.guide.remove-from-day.tip.2':
    'Az „Eltávolítás a napról” a hely részleteinek paneljén is megtalálható, a „Hozzáadás a naphoz” mellett.',
  // lock-stop
  'help.guide.lock-stop.title': 'Megálló rögzítése a helyén',
  'help.guide.lock-stop.goal': 'Tartsd meg a megállót a helyén az útvonal optimalizálásakor.',
  'help.guide.lock-stop.step.1':
    'Vidd az egeret a megálló képe fölé, és kattints a lakatra: „Pozíció megtartása útvonal-optimalizálás során”.',
  'help.guide.lock-stop.step.2':
    'Az „Optimalizálás” ezután a többi megállót rendezi körülötte. A feloldáshoz kattints újra a lakatra („Kattints a feloldáshoz”).',
  'help.guide.lock-stop.result': 'A képen megjelenik a lakat; a megálló megtartja a helyét, amíg fel nem oldod.',
  'help.guide.lock-stop.tip.1': 'A fix időpontú megállót az időpontja rögzíti; optimalizáláskor sosem mozdul el.',
  'help.guide.lock-stop.tip.2':
    'A zárolás csak az oldal újratöltéséig tart. Újratöltés után minden megálló ismét feloldott, csak az időponthoz kötött megállók maradnak rögzítve.',
  // day-note
  'help.guide.day-note.title': 'Jegyzet hozzáadása egy naphoz',
  'help.guide.day-note.goal': 'Ments el a napnál egy emlékeztetőt, egy jegyszámot vagy egy B tervet.',
  'help.guide.day-note.step.1':
    'Kattints a nap fejlécében a + gombra („Hozzáadás a naphoz”), és válaszd a „Jegyzet hozzáadása” lehetőséget.',
  'help.guide.day-note.step.2':
    'Az ablak tetején, ahol a „Megjegyzés” felirat áll, írd be a jegyzet nevét. Ez a név jelenik meg a nap kártyáján. A többit a „Napi jegyzet” alá írd: a fölötte lévő eszköztárral formázhatod a szöveget (félkövér, listák, linkek, idézetek), a bal oldali „Előnézet” pedig megmutatja, hogyan fog kinézni a sor.',
  'help.guide.day-note.step.3':
    'Válassz „Ikon” és „Szín” értéket, hogy a jegyzet könnyen elkülönüljön a megállóktól, majd kattints a „Hozzáadás” gombra.',
  'help.guide.day-note.step.4':
    'A jegyzet megállóként jelenik meg a napban: húzd a helyére, vagy mozgasd a nyilaival. Kattints rá a szerkesztéshez. A „Törlés” az ablakban, valamint a három pont menüjében és a jobb gombos menüben is megtalálható, és előbb rákérdez: „Törli a jegyzetet?”',
  'help.guide.day-note.result': 'A jegyzet a nap és a PDF része lett, azon a helyen, ahová húztad.',
  'help.guide.day-note.tip.1':
    'A jegyzetben lévő linkek új lapon nyílnak meg, és az egyszeres sortörés is sortörés marad.',
  'help.guide.day-note.tip.2':
    'A jegyzetek naponként tárolódnak. Az egész utazásra vonatkozó jegyzetet az „Együttműködés” fülön írd.',
  // day-route
  'help.guide.day-route.title': 'A napi útvonal megjelenítése és optimalizálása',
  'help.guide.day-route.goal':
    'Nézd meg a megállók közötti útvonalat, válaszd ki, mivel utazol, és bízd a TREK-re a sorrend kialakítását.',
  'help.guide.day-route.step.1':
    'Nyisd meg a napot, és kattints a megállói alatti útvonalsávban az „Útvonal” gombra: a megállók közötti útvonal megjelenik a térképen, a megállók közötti összekötők pedig az egyes szakaszok idejét és távolságát mutatják.',
  'help.guide.day-route.step.2':
    'A mellette lévő három ikonnal a nap közlekedési módját állíthatod be: „Autó”, „Gyalog” vagy „Kerékpár”. A szakaszok újraszámolódnak. A pluginek saját közlekedési módokat is hozzáadhatnak.',
  'help.guide.day-route.step.3':
    'Egy összekötőre kattintva csak az adott szakasz módját módosíthatod: válassz közlekedési módot, a „Tömegközlekedés” lehetőséget, ha ott elérhető, és kapcsolatot keresnél, vagy a „Napi alapértelmezett” lehetőséget, ha újra a nap módját használná.',
  'help.guide.day-route.step.4':
    'Az „Optimalizálás” (a körkörös nyíl) három megállótól a legrövidebb útvonal szerint rendezi át a megállókat. A lakattal vagy rögzített időponttal rendelkező megállók a helyükön maradnak; ha a napon van szállás, az útvonal onnan indul.',
  'help.guide.day-route.step.5':
    'A „Megnyitás a Google Térképben” vagy a „Megnyitás a CoMaps-ben” a teljes napot útvonalként nyitja meg az adott alkalmazásban, hogy útközben navigálhass; a CoMaps a nap közlekedési módját is átveszi.',
  'help.guide.day-route.result':
    'A nap időpontokkal ellátott útvonallá válik; az „Összköltség” és a szakaszok a sorrend változásával együtt frissülnek.',
  'help.guide.day-route.tip.1':
    'Az útvonalakat alapértelmezés szerint az OSRM adja; az adminisztrátor az „Alapértelmezett beállítások” alatt másik útvonaltervező motort is beállíthat.',
  'help.guide.day-route.tip.2':
    'Ha egy szakaszra nem sikerült útvonalat tervezni, nem látszik mellette idő. Ellenőrizd, hogy mindkét megállónak vannak-e koordinátái.',
  'help.guide.day-route.tip.3': 'A visszavonás nyíllal az optimalizálást vonhatod vissza.',
  // manage-days
  'help.guide.manage-days.title': 'Napok hozzáadása, átrendezése és átnevezése',
  'help.guide.manage-days.goal': 'Magukat a napokat módosítsd, ne csak a rajtuk lévő helyeket.',
  'help.guide.manage-days.step.1':
    'A napok az utazás dátumaiból adódnak. Ha az „Irányítópult” oldalon az utazás szerkesztőűrlapján módosítod a dátumokat, az elején vagy a végén napok kerülnek hozzá vagy kerülnek ki. Mielőtt egy tartalommal rendelkező nap törlődne, egy lista megmutatja, mely napok kerülnek ki, és mi van rajtuk.',
  'help.guide.manage-days.step.2':
    'A fejlécben a „Napok átrendezése” egy listát nyit meg: húzz egy napot a fogantyújánál, vagy használd a „Mozgatás felfelé” és a „Mozgatás lefelé” gombot, és a nap a helyeivel, jegyzeteivel és foglalásaival együtt mozog. A lista alatt a „Hozzáadás a következő dátummal” az utolsó dátummal rendelkező nap után illeszt be egy napot, és egy nappal meghosszabbítja az utazást; a „Dátum nélkül” dátum nélküli napot fűz a végére. Dátum nélküli utazásnál csak a „Nap hozzáadása” érhető el.',
  'help.guide.manage-days.step.3':
    'A sor végén lévő kuka („Nap törlése”) előbb rákérdez. Felsorolja, mi törlődik a nappal együtt: a helyei, jegyzetei és foglalásai, az aznap kezdődő vagy véget érő szállás, valamint azok a napok, amelyek egy dátummal korábbra kerülnek. A „Nap törlése” eltávolítja, a „Mégse” megtartja; az utolsó nap nem törölhető.',
  'help.guide.manage-days.step.4':
    'Egy nap átnevezéséhez nyisd meg a napot, és a térkép fölötti részletek panelen kattints a címe melletti ceruzára. Az új név váltja fel az „1. nap” feliratot a kártyán és a PDF-ben.',
  'help.guide.manage-days.step.5':
    'A fejlécben lévő „Minden nap kibontása” és „Minden nap összecsukása” egyszerre nyitja ki vagy csukja össze az összes kártyát. Egyetlen kártyát a nyilával csukhatsz össze.',
  'help.guide.manage-days.result':
    'A dátumok a pozícióhoz kötődnek: ha egy napot feljebb viszel, az a korábbi dátumot kapja, és a megállói, jegyzetei és foglalásai vele együtt mozognak.',
  'help.guide.manage-days.tip.1': 'A napok áthelyezése visszavonható a visszavonás nyíllal, egy nap törlése nem.',
  'help.guide.manage-days.tip.2':
    'A terv alján lévő „Összköltség” a teljes utazást összeadja; a részletes bontást a „Költségek” fülön látod.',
  // bookings-in-plan
  'help.guide.bookings-in-plan.title': 'Foglalások és közlekedés a tervben',
  'help.guide.bookings-in-plan.goal':
    'Nézd meg, hol jelenik meg egy foglalás, miután létrejött, és melyik képernyőn hozhatod létre.',
  'help.guide.bookings-in-plan.step.1':
    'A közlekedés (repülés, vonat, komp, busz, autó) a típusa szerint színezett sor az időponttal, indulás napján „Indulás”, érkezés napján „Érkezés” jelöléssel; a mellette lévő földgömb megnevezi az időzónát, az átszállásos repülés pedig szakaszonként egy sort kap. Tömegközlekedési kapcsolatnál a nyílra kattintva láthatod a járatokat. Egy sorra kattintva megnyílik a foglalás; az ott található „Szerkesztés” gombbal módosíthatod.',
  'help.guide.bookings-in-plan.step.2':
    'A megállóhoz kapcsolt foglalás (például étterem vagy túra) „Foglalás” jelvényként jelenik meg a megállón, az időpontjával együtt. A jelvény megerősített foglalásnál zöld, függőben lévőnél borostyánsárga. Az a foglalás, amelyhez nap tartozik, de megálló nem, saját sort kap a napon.',
  'help.guide.bookings-in-plan.step.3':
    'Egy szállodai éjszaka szállásnak számít: a nap fejlécében a jelvénye a bejelentkezés napján zöld, a kijelentkezés napján piros, a jegy ikonja pedig megnyitja a foglalást. A nap részletpanelje a „Szállás” alatt sorolja fel, és ezeken a napokon az útvonal innen indul.',
  'help.guide.bookings-in-plan.step.4':
    'A foglalás sorában lévő útvonalgomb megrajzolja a térképen a foglalás útvonalát; a fejlécben lévő „Összes foglalási útvonal megjelenítése” mindet megrajzolja.',
  'help.guide.bookings-in-plan.step.5':
    'Létrehozás: a megálló fölé víve az egeret a „Foglalás hozzáadása”, a nap + menüjében a „Közlekedés hozzáadása” és a „Tömegközlekedés”, a teljes listához importálással és fájlokkal pedig a „Foglalások” és a „Közlekedés” fül.',
  'help.guide.bookings-in-plan.result':
    'Minden foglalás egyszer jelenik meg a tervben. A fülek ugyanezeket a foglalásokat listaként mutatják.',
  'help.guide.bookings-in-plan.tip.1':
    'A „Megerősítve” és a „Függőben” a foglaláson beállított állapot; a terv a megállónál mutatja, a „Foglalások” fül mindkettőt számolja.',
  'help.guide.bookings-in-plan.tip.2':
    'Ha egy időponttal rendelkező foglalást a napján belül máshová ejtesz, visszaugrik az időpontjának megfelelő helyre. Ha egy másik napkártyára húzod, átkerül arra a napra. Az időpontját a foglalás szerkesztésével módosíthatod.',
  // export-plan
  'help.guide.export-plan.title': 'A terv exportálása',
  'help.guide.export-plan.goal': 'Exportáld a tervet dokumentumként, a naptáradba vagy GPS-eszközre.',
  'help.guide.export-plan.step.1': 'Kattints a napok fölötti fejléc bal oldalán az „Exportálás” gombra.',
  'help.guide.export-plan.step.2':
    '„Dokumentum”: a PDF megnyitja az összes nap nyomtatási nézetét a megállókkal, jegyzetekkel és foglalásokkal, az elején egy útvonal-áttekintő térképpel; a „Saját tervem PDF-ként” csak azt tartalmazza, amiben részt veszel. A nézetben az „Oldaltörés naponta” minden napot új oldalon kezd, a „Közlekedési jegyzetek” hozzáadja a közlekedéseid jegyzeteit, a „Mentés PDF-ként” pedig letölti.',
  'help.guide.export-plan.step.3':
    '„Naptár”: az „.ics letöltése” naptárfájlba menti a foglalásokat, a „Feliratkozás a naptárra” pedig olyan linket ad, amelyet a naptáralkalmazásod automatikusan frissít.',
  'help.guide.export-plan.step.4':
    '„Térképek és GPS (GPX)”: a „Teljes utazás” a helyeket, a napi útvonalakat és a nyomvonalakat exportálja, a „Csak a helyek” csak a pontokat, a „Napok útvonalként” pedig naponta egy útvonalat, offline térképekhez és GPS-eszközökhöz.',
  'help.guide.export-plan.result': 'A fájl letöltődik; az utazásban semmi sem változik.',
  'help.guide.export-plan.tip.1':
    'Egyetlen napot az útvonalsávjából nyithatsz meg térképalkalmazásban: „Megnyitás a Google Térképben” vagy „Megnyitás a CoMaps-ben”.',
  'help.guide.export-plan.tip.2':
    'A „Feliratkozás a naptárra” használatához a beállításaidban be kell kapcsolnod a naptárfeedeket, és jogosultnak kell lenned az utazás megosztására; az „Irányítópult” részben külön útmutató szól erről.',
  'help.guide.export-plan.tip.3':
    'Az exportáláshoz elég az olvasási jog: az utazás minden tagja exportálhatja a PDF-et, az .ics-fájlt és a GPX-et.',

  // ── Screen: trip-place ────────────────────────────────────────────────────────────────
  'help.ctx.trip-place.title': 'Hely részletei',
  'help.ctx.trip-place.summary':
    'Ez a kártya akkor nyílik meg a térkép fölött, amikor kiválasztasz egy helyet: minden, amit az utazás tud róla, az értékelések, amelyeket a résztvevők adtak, a képe és a fájljai, valamint a gombok, amelyekkel a megnyitott napra teheted, térképalkalmazásban nyithatod meg, vagy listába mentheted.',
  'help.ctx.trip-place.bullet.1':
    'Kattints egy sorra a helyek oszlopában, egy megállóra egy napon belül vagy egy jelölőre a térképen, és a kártya megnyílik a térkép fölött. Ha egy napról nyitod meg, a kártya tudja, melyik megállóról van szó, és a megálló résztvevőit és foglalását is mutatja. A túrák (gyalogtúra, kerékpár- vagy lovastúra, séta a „Túrák” fülről) ehelyett a saját túrakártyájukat nyitják meg.',
  'help.ctx.trip-place.bullet.2':
    'A fejlécben a kerek kép, a név és egy sorban a cím látszik, valamint címkék az ismert adatokról: nyitva van-e vagy zárva, a kategória, az időpont, az ár, a telefonszám, az e-mail-cím és a koordináták. A képre kattintva saját képet vagy a hely fájljai közül egy fotót használhatsz. A névre duplán kattintva átnevezheted a helyet. A jobb oldali X bezárja a kártyát. A kép, az átnevezés, a „Szerkesztés” és a „Törlés” csak azoknak az utazóknak érhető el, akik szerkeszthetik a helyeket.',
  'help.ctx.trip-place.bullet.3':
    'Alatta: az egyes utazók által adott csillagok, a leírás és a jegyzetek, valamint a „Jegyzetek erre a napra”, ha a megállóhoz tartozik ilyen.',
  'help.ctx.trip-place.bullet.4':
    'Ezután következik a „Nyitvatartás”, az „Útvonal színe”, az „Útvonal adatok” és a „Fájl”, ha vonatkoznak a helyre. A „Fájl” címsorában lévő „Feltöltés” gombbal a számítógépedről adhatsz hozzá fájlokat, a listában pedig az ehhez a megállóhoz rögzített és a foglalásához tartozó fájlok is látszanak, például a szállodai visszaigazolás. A pluginek alatta saját sorokat adhatnak hozzá.',
  'help.ctx.trip-place.bullet.5':
    'Az alsó sor: „Hozzáadás a naphoz” vagy „Eltávolítás a napról”, ha egy nap meg van nyitva, majd „Navigáció” (vagy a térképalkalmazásod neve, ha a Beállításokban már választottál egyet), „Weboldal megnyitása” és „Mentés gyűjteménybe”. Jobb oldalon a piros kuka törli a helyet, a „Szerkesztés” pedig megnyitja az űrlapját.',
  'help.ctx.trip-place.bullet.6':
    'A keresésből kiválasztott helynél azt látod, amit a TREK indexe vagy az OpenStreetMap tud róla: a felső gombok között „Nyitott” vagy „Lezárva” állapotot, zöld vagy piros gyűrűvel a kép körül, a hely helyi ideje szerint; a telefonszámát, szintén gombként; lejjebb a „Nyitvatartás” részt, a sorban a mai nyitvatartással, kattintásra pedig az egész héttel; a weboldalát pedig a „Weboldal megnyitása” alatt. A Google-értékelés csak a Google-on keresztül talált helyeknél jelenik meg, Google-kulccsal rendelkező TREK-en. A hely űrlapján általad megadott nyitvatartás, telefonszám és e-mail felülírja a lekérdezett adatokat, és ezek határozzák meg a gyűrű színét is.',
  // read-place
  'help.guide.read-place.title': 'Mit mutat a kártya egy helyről',
  'help.guide.read-place.goal': 'Nézd meg egyetlen kártyán mindazt, amit az utazás egy helyről tud.',
  'help.guide.read-place.step.1':
    'A napok oszlopában kattints arra a megállóra, amelyet meg szeretnél nézni. A kártya megnyílik a térkép fölött, a megálló pedig kijelölve marad a napjában.',
  'help.guide.read-place.step.2':
    'Felül: a kerek kép, a név és a cím egy sorban; az elemleírásban a teljes cím látszik. Az alattuk lévő gombok a hely helyi ideje szerint jelzik, hogy most „Nyitott” vagy „Lezárva”, és ennek megfelelően zöld vagy piros gyűrű veszi körül a képet. Ugyanitt látod a kategóriát, az időpontot, a telefonszámot és az e-mail-címet (kattintásra megnyílik a telefon- vagy a levelezőalkalmazásod), széles képernyőn pedig a pontos koordinátákat is. A jobb oldali X bezárja a kártyát.',
  'help.guide.read-place.step.3':
    'Az „Értékelés” az első rész a fejléc alatt: az utazók által adott csillagok, az átlaguk és a szavazók száma. Amíg senki sem szavazott, a „Még nincs értékelve” felirat látszik.',
  'help.guide.read-place.step.4':
    'Ezután a leírás, alatta pedig a jegyzetek következnek. Mindkettő a hely űrlapján megadott szöveg, formázással együtt: a listák, a linkek és a félkövér szöveg is működik.',
  'help.guide.read-place.step.5':
    'A „Résztvevők” mutatja, ki megy el erre a megállóra. Alapból mindenki benne van, amíg valakit el nem távolítasz.',
  'help.guide.read-place.step.6':
    'Lejjebb a „Nyitvatartás”: a sor az épp megtekintett nap nyitvatartását mutatja. Kattints rá az egész hét megtekintéséhez, ahol ez a nap félkövérrel szerepel. Mellette találod a „Fájl” részt.',
  'help.guide.read-place.result':
    'A kártya nyitva marad, amíg az X-szel be nem zárod, vagy másik helyet nem választasz. A heti nyitvatartás kibontva marad, a napok oszlopában pedig továbbra is ki van jelölve a megálló, amelyhez a kártya tartozik.',
  'help.guide.read-place.tip.1':
    'Ha a helyet a helyek oszlopából választod ki, a kártya a helyet mutatja, nem egy megállót. Ezért nem jelennek meg a résztvevők, és csak azok a foglalások látszanak, amelyek magához a helyhez tartoznak, például egy szálloda szállásfoglalása. Ha mindent látni szeretnél, a napon belül válaszd ki a megállót.',
  'help.guide.read-place.tip.2':
    'Ha szerkesztheted a helyeket, a névre duplán kattintva az űrlap megnyitása nélkül átnevezheted a helyet. Az Enter ment, az Esc elveti a módosítást.',
  'help.guide.read-place.tip.3':
    'A kézzel beírt helynél csak az űrlapon megadott adatok látszanak. Kattints a „Szerkesztés” gombra, és töltsd ki magad a „Telefon”, az „E-mail” mezőt és a nyitvatartást, vagy válaszd ki a helyet a „Helyek keresése…” alatti javaslatok közül, és kattints a „Frissítés” gombra, hogy a TREK lekérdezze őket. A Google-értékeléshez Google-kulcs kell.',
  // rate-place
  'help.guide.rate-place.title': 'Hely értékelése',
  'help.guide.rate-place.goal': 'Értékeld a helyet saját csillagokkal, és nézd meg, mások hogyan értékelték.',
  'help.guide.rate-place.step.1':
    'Nyisd meg a helyet. A csillagsor közvetlenül a fejléc alatt van, és az eddigi szavazatok átlagát mutatja, zárójelben a szavazatok számával.',
  'help.guide.rate-place.step.2':
    'Kattints a kívánt csillagra. Ahogy az egeret végighúzod a csillagokon, azok kitöltődnek, így látod, milyen értékelést adsz majd.',
  'help.guide.rate-place.step.3':
    'A szavazatod azonnal beleszámít az átlagba, a mellette lévő arcok pedig azt mutatják, kik szavaztak. Ha a sor fölé viszed az egeret, mindenki csillagait látod.',
  'help.guide.rate-place.step.4':
    'Ugyanez az átlag a helyek oszlopában a hely sorában is látszik, így könnyen megtalálod a listában a legjobb helyeket.',
  'help.guide.rate-place.result':
    'Az utazás minden résztvevője látja a helyen a csillagaidat. A lista fölötti szűrősor csillagával mostantól csak a legalább adott értékelésű helyeket jelenítheted meg.',
  'help.guide.rate-place.tip.1':
    'Minden utazó értékelhet, akkor is, ha az utazáson csak néhányan módosíthatják a helyeket.',
  'help.guide.rate-place.tip.2':
    'Az értékelésed törléséhez kattints arra a csillagra, amelyet már megadtál. Ha senki sem értékelte a helyet, ismét a „Még nincs értékelve” felirat látszik.',
  'help.guide.rate-place.tip.3':
    'A csillagok mellett legfeljebb hat szavazó arcképe látszik. A buboréksúgó mindegyiküket felsorolja, és téged is megjelöl.',
  // place-image
  'help.guide.place-image.title': 'Saját kép beállítása egy helyhez',
  'help.guide.place-image.goal': 'Cseréld le az automatikus bélyegképet egy saját fotóra.',
  'help.guide.place-image.step.1': 'Nyisd meg a helyet a helyek oszlopából.',
  'help.guide.place-image.step.2':
    'Vidd az egeret a fejlécben lévő kerek kép fölé: megjelenik egy kamera, az elemleírásban pedig ez áll: „Kép feltöltése”. Kattints rá, és válaszd ki a fájlt. Ha a helynek már vannak fotói a fájljai között, a TREK előbb megkérdezi, melyiket választod: „Feltöltés eszközről”, vagy az egyik kép a „Csatolt fájlokból” alatt.',
  'help.guide.place-image.step.3': 'A kártya tetején most a te képed látszik, a sarkában egy kis piros X-szel.',
  'help.guide.place-image.step.4':
    'Ugyanez a kép jelenik meg a hely sorában a helyek oszlopában, és a jelölőjén a térképen.',
  'help.guide.place-image.result':
    'A képed mindenhol a hely képeként jelenik meg: a kártyán, a helyek oszlopában, a napi megállónál, a térképen a jelölőn és a megosztott utazásban is.',
  'help.guide.place-image.tip.1':
    'JPG, PNG, GIF és WebP formátumot tölthetsz fel, az iPhone-os HEIC képek pedig feltöltéskor automatikusan átalakulnak.',
  'help.guide.place-image.tip.2':
    'A sarokban lévő X eltávolítja a képedet, és újra az automatikus kép jelenik meg. Maga a hely nem változik.',
  'help.guide.place-image.tip.3':
    'Ha nem adtál meg képet, a TREK a hely koordinátái alapján keres egyet. Ha nem talál, a kategória ikonját mutatja. Képet csak azok az utazók állíthatnak be, akik szerkeszthetik a helyeket.',
  // place-day-assign
  'help.guide.place-day-assign.title': 'A hely hozzáadása a megnyitott naphoz vagy eltávolítása róla',
  'help.guide.place-day-assign.goal': 'Használd a kártyán lévő gombot ahelyett, hogy a sort áthúznád a tervezőn.',
  'help.guide.place-day-assign.step.1':
    'A napok oszlopában kattints egy nap fejlécére. Ez lesz a megnyitott nap, és a kártya erre vonatkozik.',
  'help.guide.place-day-assign.step.2':
    'A helyek oszlopában kattints egy olyan helyre, amely nincs rajta az adott napon. Megnyílik a kártyája, és az alsó sorban megjelenik a „Hozzáadás a naphoz” gomb.',
  'help.guide.place-day-assign.step.3':
    'Kattints a „Hozzáadás a naphoz” gombra. A megálló a nap végére kerül, a gomb felirata pedig „Eltávolítás a napról” lesz.',
  'help.guide.place-day-assign.step.4': 'A megálló most a napon van, a lista végén. Húzd fel a megfelelő helyre.',
  'help.guide.place-day-assign.step.5':
    'Az „Eltávolítás a napról” ismét leveszi a megállót a napról, a kártyán pedig újra a „Hozzáadás a naphoz” gomb jelenik meg.',
  'help.guide.place-day-assign.result': 'A megálló felkerül a napra, vagy lekerül róla. Maga a hely nem változik.',
  'help.guide.place-day-assign.tip.1':
    'A gomb csak akkor látszik, ha egy nap meg van nyitva. Megnyitott nap nélkül nincs nap, amelyhez a helyet hozzá lehetne adni.',
  'help.guide.place-day-assign.tip.2':
    'Ha egy megállót leveszel egy napról, a hely az utazásban és a helyek oszlopában marad. A „Törlés” mindenhonnan eltávolítja.',
  'help.guide.place-day-assign.tip.3':
    'Ha egy megállót szállásfoglalás tett a napra, egyik gomb sem jelenik meg nála. Ezt az éjszakát a nap éjszakai szállás blokkjában adhatod hozzá vagy veheted ki.',
  // place-participants
  'help.guide.place-participants.title': 'Ki megy erre a megállóra',
  'help.guide.place-participants.goal':
    'Válaszd ki, ki megy egy adott megállóra, anélkül hogy az utazás résztvevőit módosítanád.',
  'help.guide.place-participants.step.1':
    'Kattints a megállóra a napon belül. Megnyílik a kártya, és a „Résztvevők” részben az utazás minden tagja látszik.',
  'help.guide.place-participants.step.2':
    'Ha egy utazót el szeretnél távolítani erről a megállóról, kattints a címkéjére. Ha fölé viszed az egeret, a név áthúzva jelenik meg.',
  'help.guide.place-participants.step.3':
    'Amint valaki hiányzik, megjelenik egy szaggatott vonalas + jel. Kattints rá, és megnézheted, ki nem vesz részt a megállón.',
  'help.guide.place-participants.step.4':
    'Egy névre kattintva újra hozzáadhatod azt a személyt. Ha mindenki újra hozzá van adva, a megálló ismét az egész csoporté.',
  'help.guide.place-participants.result':
    'A megállónál csak a kiválasztott utazók szerepelnek. A csoport többi tagja ilyenkor szabad.',
  'help.guide.place-participants.tip.1':
    'A „Résztvevők” csak kijelölt megállónál jelenik meg, ezért a helyet a napon belül válaszd ki, ne a helyek oszlopában. Ráadásul csak olyan utazáson látszik, ahol egynél több utazó van.',
  'help.guide.place-participants.tip.2':
    'Ha senki sincs kiválasztva, mindenki megy. Ezért nem lehet az utolsó utazót eltávolítani egy megállóról.',
  'help.guide.place-participants.tip.3':
    'A saját fiókkal nem rendelkező vendég is lehet résztvevő, ugyanúgy, mint bárki más.',
  // place-booking
  'help.guide.place-booking.title': 'Megállóhoz tartozó foglalás',
  'help.guide.place-booking.goal': 'Nézd meg a megállóhoz tartozó foglalást, nyisd meg, és kapcsolj hozzá újat.',
  'help.guide.place-booking.step.1':
    'Nyisd meg a megállót, amelyhez a foglalás tartozik. A kártya a „Foglalások” alatt saját kis kártyaként mutatja, a foglalás nevével és a „Megerősítve” vagy „Függőben” állapottal.',
  'help.guide.place-booking.step.2':
    'A foglalási kártyán a „Dátum”, az „Időpont” és a „Foglalási kód” látszik, címkék a foglalás egyéb adataival (járatszám, vágány, bejelentkezés), valamint a foglaláshoz tartozó jegyzetek.',
  'help.guide.place-booking.step.3': 'Kattints a foglaláskártyára. A foglalás a térkép fölött nyílik meg.',
  'help.guide.place-booking.step.4':
    'A foglalás alján lévő „Szerkesztés” megnyitja a foglalás saját űrlapját. Ott az „Összekapcsolás napi tervvel” köti a foglalást egy megállóhoz, és már ezt a megállót mutatja. Zárd be újra az űrlapot.',
  'help.guide.place-booking.step.5':
    'Egy megálló új foglalását a napok oszlopában kezdheted el: vidd az egeret a megálló fölé, és kattints a végén lévő jegy ikonra, a „Foglalás hozzáadása” gombra. Az űrlap „Új foglalás” néven nyílik meg, már a megállóhoz kapcsolva.',
  'help.guide.place-booking.result':
    'A foglalás a megállóhoz kapcsolódik: megjelenik a kártyán és a napon, a fájljai pedig itt, a „Fájl” alatt is látszanak.',
  'help.guide.place-booking.tip.1':
    'A foglalás azon a megállón jelenik meg, amelyhez rögzítve van, a szállodafoglalás pedig a szállodánál is, bárhonnan nyitod meg. A megállóhoz nem rendelt foglalás a „Foglalások” fülön látszik.',
  'help.guide.place-booking.tip.2':
    'Egy megállóhoz több foglalás is tartozhat, például egy ebéd és egy túra, amelyek ugyanonnan indulnak.',
  'help.guide.place-booking.tip.3':
    'Vonatnál, repülésnél vagy kompnál a „Szerkesztés” helyette a közlekedési űrlapot nyitja meg, ugyanazt, amelyet a „Közlekedés” fül használ.',
  // place-files
  'help.guide.place-files.title': 'A hely jegyei a helynél',
  'help.guide.place-files.goal': 'Csatold a jegyet, az utalványt vagy a térképet ahhoz a helyhez, amelyhez tartozik.',
  'help.guide.place-files.step.1':
    'Nyisd meg a helyet. A „Fájl” rész a részletei alatt van, a „Nyitvatartás” mellett, ha a helynek van nyitvatartása, és amíg a helyhez nem tartozik fájl, „Fájl” felirat látszik rajta.',
  'help.guide.place-files.step.2':
    'Kattints a „Fájl” címsor jobb oldalán lévő „Feltöltés” gombra, és válaszd ki a fájlt.',
  'help.guide.place-files.step.3': 'A gombon látszik, hány fájl tartozik a helyhez, és a lista automatikusan kinyílik.',
  'help.guide.place-files.step.4': 'Minden sorban a fájl neve és mérete látszik. Kattints rá a fájl megnyitásához.',
  'help.guide.place-files.result':
    'A fájl a helyhez csatolódik, és a kártyán is beleszámít. Az utazás „Fájl” fülén is megjelenik.',
  'help.guide.place-files.tip.1':
    'A „Fájl” rész azt is felsorolja, ami ehhez a megállóhoz van rögzítve, vagy a foglalásához van csatolva, így a szállodai visszaigazolás a szállodánál is megjelenik.',
  'help.guide.place-files.tip.2':
    'A „Feltöltés” egyszerre több fájlt is fogad, és a köztük lévő fotók bármelyike lehet a hely képe.',
  'help.guide.place-files.tip.3':
    'Ha nincs jogod fájlokat feltölteni, a „Feltöltés” gomb nem jelenik meg; a helyhez már csatolt fájlokat azonban továbbra is látod.',
  // place-navigation
  'help.guide.place-navigation.title': 'Hely megnyitása térképalkalmazásban vagy a weboldalán',
  'help.guide.place-navigation.goal': 'Nyisd meg a helyet abban a navigációs alkalmazásban, amellyel odajutsz.',
  'help.guide.place-navigation.step.1': 'Nyisd meg a helyet, és az alsó sorban kattints a „Navigáció” gombra.',
  'help.guide.place-navigation.step.2':
    'A lista az ehhez a helyhez illő térképalkalmazásokat mutatja: Google Maps, Waze, Apple Maps, OpenStreetMap és CoMaps, Androidon pedig a „Másik térképalkalmazás” lehetőséget is.',
  'help.guide.place-navigation.step.3':
    'Kattints arra, amelyiket használod. Ahol lehet, a TREK magát a helyet küldi át az alkalmazásnak, nem csak a koordinátáit, így a megfelelő bejárathoz jutsz.',
  'help.guide.place-navigation.step.4':
    'A mellette lévő „Weboldal megnyitása” új lapon nyitja meg a hely saját weboldalát a nyitvatartással és a jegyekkel.',
  'help.guide.place-navigation.result':
    'A térképalkalmazás a helynél nyílik meg, a weboldal új lapon, az utazásban pedig semmi sem változik. Ha a TREK alkalmazásként van telepítve, új lap helyett a térképalkalmazás nyílik meg.',
  'help.guide.place-navigation.tip.1':
    'A Waze azonnal elindítja a navigációt. A többi alkalmazás megnyitja a helyet, és a navigáció indításához még egyszer koppintanod kell.',
  'help.guide.place-navigation.tip.2':
    'Hogy mely alkalmazások jelennek meg, az a helytől és az eszközödtől függ: Androidon nincs Apple Maps, a 高德地图 csak kínai helyeknél jelenik meg, a Waze, az Apple Maps és a CoMaps pedig a hely koordinátáit igényli. A „Másik térképalkalmazás” az Android telefonodon lévő bármelyik térképalkalmazásban megnyitja a helyet.',
  'help.guide.place-navigation.tip.3':
    'Válaszd ki egyszer a térképalkalmazásodat a Beállításokban, a „Helyek megnyitása itt” alatt. A gomb ezután az alkalmazás nevét mutatja, és azonnal megnyitja. Ugyanez történik, ha egy helyhez csak egy alkalmazás jöhet szóba.',
  // place-to-collection
  'help.guide.place-to-collection.title': 'Hely mentése valamelyik listádba',
  'help.guide.place-to-collection.goal':
    'Mentsd el a következő utazásra azt a helyet, amelyet ezen az utazáson találtál.',
  'help.guide.place-to-collection.step.1':
    'Nyisd meg a helyet, és a kártya alsó sorában kattints a „Mentés gyűjteménybe” gombra.',
  'help.guide.place-to-collection.step.2':
    'A „Mentés listába” az összes saját és veled megosztott listádat mutatja. A jobb oldalon kitöltött könyvjelző jelzi azokat a listákat, amelyeken a hely már szerepel.',
  'help.guide.place-to-collection.step.3': 'Kattints a listára. A hely azonnal bekerül.',
  'help.guide.place-to-collection.step.4':
    'Zárd be az ablakot az X-szel: a kártyán lévő gombon most „Mentve” felirat áll.',
  'help.guide.place-to-collection.result':
    'A hely a képével, a jegyzeteivel és a címével bekerült a listádba, készen a következő utazásra.',
  'help.guide.place-to-collection.tip.1':
    'A gomb csak akkor látszik, ha a „Gyűjtemények” bővítmény be van kapcsolva; ezt az adminisztrátor a „Bővítmények” alatt kapcsolhatja be.',
  'help.guide.place-to-collection.tip.2':
    'Egy hely egyszerre több listában is szerepelhet, mindegyikben más állapottal: az egyikben ötletként, a másikban meglátogatottként.',
  'help.guide.place-to-collection.tip.3':
    'A választó tetején, a hely neve alatt lévő „Megjelölés látogatottként” a listában meglátogatottnak jelöli a helyet. Ha a hely több listádon is szerepel, a gombon „Mindenhol látogatott” felirat áll, és egyszerre mindegyikben megjelöli. A „Nézet” megnyitja a listáidat a Gyűjteményekben.',
  // place-track
  'help.guide.place-track.title': 'Nyomvonal megtekintése és saját szín megadása',
  'help.guide.place-track.goal':
    'Nézd meg, milyen hosszú egy importált túra, és melyik vonal tartozik hozzá a térképen.',
  'help.guide.place-track.step.1':
    'A helyek oszlopában a nyomvonal sorában egy rövid vonal látható, olyan színű, amilyen a nyomvonal a térképen. Kattints rá.',
  'help.guide.place-track.step.2': 'Az „Útvonal adatok” az útvonal hosszát mutatja, a beállított mértékegységben.',
  'help.guide.place-track.step.3':
    'A fölötte lévő „Útvonal színe” a jelenleg használt színt mutatja. A sorra kattintva megnyílnak a színminták.',
  'help.guide.place-track.step.4':
    'Válassz színt. A térképen a vonal és a sorban a vonás színe is ennek megfelelően változik.',
  'help.guide.place-track.step.5':
    'A bal oldali szaggatott cella, az „Automatikus szín” visszaállítja a nyomvonal alapértelmezett színét. A jobb oldali pipettával a rendszer színválasztójában bármilyen más színt választhatsz.',
  'help.guide.place-track.result':
    'A nyomvonal a választott színnel jelenik meg a kártyán, a helyek oszlopában lévő sorában és a térképen.',
  'help.guide.place-track.tip.1':
    'Ez a két rész csak útvonallal rendelkező helyeknél jelenik meg: olyan helynél, amelyet még a Túrák bővítmény előtt importáltak GPX-, KML- vagy KMZ-fájlból, vagy olyan TREK-en, ahol a Túrák ki van kapcsolva. Bekapcsolt Túrák bővítménnyel az új GPX-fájlból túra lesz, amely a saját túrakártyáját nyitja meg.',
  'help.guide.place-track.tip.2':
    'A magassági adatokkal rögzített nyomvonal a legmagasabb és a legalacsonyabb pontját, a megtett szintemelkedést és -csökkenést, valamint a túra magassági profilját is mutatja.',
  'help.guide.place-track.tip.3':
    'Az importálás minden hozzáadott nyomvonalnak saját színt ad, így két túra sosem lesz ugyanolyan színű.',
  // read-place
  'help.guide.read-place.step.7':
    'Az alsó sorban azt látod, mit tehetsz innen: felveheted a helyet a megnyitott napra, vagy leveheted róla, megnyithatod térképalkalmazásban vagy a weboldalán, mentheted egy listába, jobb oldalon pedig törölheted (piros kuka) vagy szerkesztheted.',

  // ── Screen: trip-files ────────────────────────────────────────────────────────────────
  'help.ctx.trip-files.title': 'Fájl',
  'help.ctx.trip-files.summary':
    'Az utazás összes dokumentuma egy listában: jegyek, visszaigazolások, Wallet-kártyák és képek. Mindegyikhez tartozik egy megjegyzés, egy kapcsolat ahhoz a helyhez vagy foglaláshoz, amelyhez tartozik, valamint egy kuka, ahonnan visszaállíthatod.',
  'help.ctx.trip-files.bullet.1':
    'A sáv alatti szaggatott keretes mező („Húzd ide a fájlokat”) fogadja a ráejtett fájlokat. Rákattintva megnyílik a fájlválasztó. A mezőben látod, milyen fájltípusokat fogad ez a TREK, és mekkora a fájlonkénti korlát (max. 50 MB, hacsak a rendszergazda mást nem állított be).',
  'help.ctx.trip-files.bullet.2':
    'A felső sávban a „Fájl” felirat és a szűrőfülek láthatók: „Mind”, „PDF-ek”, „Képek” és „Dokumentumok”, mindegyik a darabszámával. Amint egy fájl csillagot kap, a „Mind” után megjelenik egy csillag fül, és amint egy jegyzethez melléklet tartozik, a sor végén megjelenik a „Közös jegyzetek” fül.',
  'help.ctx.trip-files.bullet.3':
    'Egy sorban látszik a bélyegkép vagy a fájl típusa, a feltöltő, a név, alatta a megjegyzés, a méret és a dátum, valamint minden kapcsolathoz egy jelvény: a hely, a foglalás vagy a közlekedés a nevével (ha fölé viszed az egeret, megjelenik a „Napi terv”, a „Foglalás” vagy a „Közlekedés” felirat), illetve a „Közös jegyzetekből” jelvény.',
  'help.ctx.trip-files.bullet.4':
    'A sor végén legfeljebb öt ikon van, mindegyik neve megjelenik, ha fölé viszed az egeret: „Csillag”, „Hozzárendelés” (a ceruza), „Megnyitás”, „Letöltés” és „Törlés”. A „Törlés” nem kérdez rá: a fájl a kukába kerül, ahonnan visszaállíthatod. Offline állapotban a jegyzet, a kapcsolat, a csillag és a kuka is működik, és a TREK akkor küldi el őket, amikor újra van kapcsolat; csak a feltöltéshez és egy további kapcsolat megszüntetéséhez kell internet.',
  'help.ctx.trip-files.bullet.5':
    'A képek és videók teljes képernyőn nyílnak meg, a nyílbillentyűkkel lapozhatók, és bélyegképsor is tartozik hozzájuk. Minden más dokumentum egy ablakban nyílik meg, felül a nevével, alatta a „Megnyitás új lapon” és a „Letöltés” gombbal. A Wallet-kártyák azonnal letöltődnek.',
  'help.ctx.trip-files.bullet.6':
    'A sáv jobb végén lévő kuka ikon („Kuka”) a törölt fájlokra váltja a listát. Itt egyenként visszaállíthatod vagy véglegesen törölheted őket, a sáv „Kuka ürítése” gombja pedig mindet törli. A „Dokumentumok szinkronizálása” a kuka ikontól balra jelenik meg, ha az utazás dokumentumtárhoz van csatlakoztatva, az utazás tulajdonosának vagy egy adminisztrátornak pedig már akkor, amikor egy tárhely be van kapcsolva.',
  // files-upload
  'help.guide.files-upload.title': 'Dokumentum hozzáadása az utazáshoz',
  'help.guide.files-upload.goal':
    'Tölts fel egy jegyet, visszaigazolást vagy fotót a letöltések mappádból az utazáshoz, ahol az utazás minden tagja megnyithatja.',
  'help.guide.files-upload.step.1':
    'Nyisd meg az utazást, és a fülsávon kattints a „Fájl” fülre. Itt látod az utazás dokumentumait, fölöttük a feltöltési mezővel.',
  'help.guide.files-upload.step.2':
    'Kattints a „Húzd ide a fájlokat” mezőre, és válassz ki egy vagy több fájlt. Egymás után töltődnek fel, közben a mezőben a „Feltöltés...” felirat látszik. A mezőben, a „vagy kattints a böngészéshez” alatt látod, milyen fájltípusokat fogad ez a TREK, és mekkora lehet egy fájl.',
  'help.guide.files-upload.step.3':
    'Amikor az utolsó fájl feltöltése befejeződik, automatikusan megnyílik hozzá a „Fájl hozzárendelése” ablak (ha az utazásnak vannak helyei vagy foglalásai), a tetején a fájl nevével. A „Megjegyzés” alatti „Megjegyzés hozzáadása...” mezővel megjegyzést fűzhetsz a fájlhoz, az alatta lévő listákkal pedig egy helyhez vagy foglaláshoz kapcsolhatod. A jobb felső × gombbal zárd be; a bezárással semmi sem vész el.',
  'help.guide.files-upload.step.4':
    'Az új fájlok a lista tetején jelennek meg, csak a csillagozott fájlok vannak fölöttük. Egy sorban látszik a feltöltő, a név, a méret és a dátum. A képek bélyegképet kapnak, a többi fájlnál a típusuk látszik.',
  'help.guide.files-upload.result':
    'A dokumentumok bekerülnek az utazásba, és mindenki, aki látja az utazást, megnyithatja és letöltheti őket.',
  'help.guide.files-upload.tip.1':
    'Fájlt az asztalról közvetlenül a mezőre is húzhatsz. Amíg a fájl fölötte van, a mező kiemelve látszik.',
  'help.guide.files-upload.tip.2':
    'A Ctrl+V billentyűkkel a vágólapon lévő képet közvetlenül a listába illesztheted, így egy foglalásról készült képernyőképet nem kell előbb elmentened.',
  'help.guide.files-upload.tip.3':
    'A feltöltéshez fájlfeltöltési jogosultság kell; enélkül a feltöltőmező meg sem jelenik. A listán nem szereplő típust a TREK üzenettel elutasítja, és semmit sem tölt fel. A méretkorlátot (50 MB, hacsak a rendszergazda mást nem állított be) meghaladó fájlt még a küldés előtt elutasítja, és az üzenet megadja a korlátot. A feltöltéshez internetkapcsolat is kell: offline állapotban a TREK jelzi ezt, és nem tölt fel semmit.',
  // files-link
  'help.guide.files-link.title': 'Dokumentum csatolása helyhez vagy foglaláshoz',
  'help.guide.files-link.goal':
    'Legyen a jegy könnyen elérhető arról a napról is, amelyhez tartozik, ne csak ebből a listából.',
  'help.guide.files-link.step.1':
    'Kattints a sor végén lévő ceruzára („Hozzárendelés”). Megnyílik a „Fájl hozzárendelése” ablak, a tetején a fájl nevével.',
  'help.guide.files-link.step.2':
    'A „Megjegyzés” alatt a „Megjegyzés hozzáadása...” mezőbe egy sort írhatsz, amely aztán a fájl neve alatt jelenik meg a listában. Enter lenyomásakor vagy a mező elhagyásakor mentődik.',
  'help.guide.files-link.step.3':
    'A bal oldalon, a „Hely” alatt az utazás helyei látszanak napok szerint csoportosítva a dátummal, a végén pedig a „Nincs hozzárendelve” csoportban azok a helyek, amelyek egyik napon sem szerepelnek. Kattints egyre a kipipáláshoz.',
  'help.guide.files-link.step.4':
    'Jobb oldalon a „Foglalás” és „Közlekedés” alatt az utazás foglalásai láthatók. Kattints arra, amelyikhez a dokumentum tartozik; az is pipát kap.',
  'help.guide.files-link.step.5':
    'Zárd be a jobb felső × jellel. Itt nincs mentés gomb: minden kattintás azonnal mentődött.',
  'help.guide.files-link.result':
    'A sorban látszik a megjegyzés és minden kapcsolathoz egy jelvény: az egyiken a hely neve, a másikon a járat neve. Ha egy jelvény fölé viszed az egeret, a „Napi terv” vagy a „Közlekedés” felirat jelenik meg. A dokumentum a helyhez és a járathoz is csatolva lesz.',
  'help.guide.files-link.tip.1':
    'Egy fájlnak egyszerre több kapcsolata is lehet, így ugyanaz a visszaigazolás tartozhat egyszerre a szálloda foglalásához és a szálloda helyéhez.',
  'help.guide.files-link.tip.2':
    'Egy bejelölt tételre újra kattintva megszünteted a kapcsolatot; maga a fájl megmarad. Offline állapotban a jegyzet és az új jelölések mentődnek, és a TREK akkor küldi el őket, amikor újra van kapcsolat; csak egy másik kapcsolat megszüntetéséhez kell internet.',
  'help.guide.files-link.tip.3':
    'Fordítva is működik: a helyhez vagy foglaláshoz csatolt dokumentum is szerepel ebben a listában, ugyanazzal a jelvénnyel a sorában.',
  // files-star
  'help.guide.files-star.title': 'A fontos dokumentumok legyenek felül',
  'help.guide.files-star.goal':
    'Jelöld meg azt a néhány dokumentumot, amelyre tényleg szükséged lesz, hogy egy hosszú listában is gyorsan megtaláld őket.',
  'help.guide.files-star.step.1':
    'Kattints a sor végén lévő csillagra („Csillag”). Aranyszínűre vált, a fájl neve elé egy második csillag kerül, és ha az egeret a gomb fölé viszed, most a „Csillag eltávolítása” felirat jelenik meg.',
  'help.guide.files-star.step.2':
    'A lista újrarendeződik: a csillagozott fájlok az összes többi fölött jelennek meg, csoportonként a legújabbal kezdve.',
  'help.guide.files-star.step.3':
    'A sáv szűrőfülei között, közvetlenül a „Mind” után megjelenik egy csillag, mellette a csillagozott fájlok számával. Kattints rá, hogy csak ezeket a fájlokat lásd.',
  'help.guide.files-star.result':
    'A csillagozott fájlok a lista tetején jelennek meg, és egy külön fül csak a csillagozott fájlokat mutatja.',
  'help.guide.files-star.tip.1':
    'A csillag fül csak addig létezik, amíg van csillagozott fájl. Ha az utolsó fájlról is leveszed a csillagot, a fül eltűnik.',
  'help.guide.files-star.tip.2':
    'A csillagozáshoz ugyanaz a jog kell, mint a „Hozzárendelés” funkcióhoz: „Fájl metaadatok szerkesztése”. Akinek ez nincs meg, látja a csillagokat, de a „Csillag” gombra kattintva nem változik semmi.',
  // files-filter
  'help.guide.files-filter.title': 'Dokumentum keresése a listában',
  'help.guide.files-filter.goal': 'Csak azt a dokumentumtípust jelenítsd meg, amelyet keresel.',
  'help.guide.files-filter.step.1':
    'A szűrőfülek a felső sávban, a „Fájl” mellett vannak: „Mind”, „PDF-ek”, „Képek” és „Dokumentumok”, mindegyik mellett a fájlok számával.',
  'help.guide.files-filter.step.2': 'Kattints a „PDF-ek” fülre: a lista csak a PDF-fájlokat mutatja.',
  'help.guide.files-filter.step.3':
    'Két további fül csak akkor jelenik meg, ha az utazásban vannak hozzájuk illő fájlok. Kattints a „Közös jegyzetek” fülre, amely akkor jelenik meg, amikor az „Együttműködés” fülön egy jegyzethez melléklet tartozik: a lista ekkor csak ezeket a fájlokat mutatja. A csillag fül ugyanígy jelenik meg, amint egy fájlt csillaggal jelölsz.',
  'help.guide.files-filter.step.4': 'A „Mind” újra a teljes listát mutatja.',
  'help.guide.files-filter.result':
    'A lista csak a kiválasztott fül fájljait mutatja, és minden fülön látszik, hány fájl tartozik hozzá.',
  'help.guide.files-filter.tip.1':
    'Itt nincsenek mappák, és a fájlokat nem lehet átnevezni. A dokumentumok megkülönböztetésére a „Fájl hozzárendelése” ablakban megadott megjegyzést, a helyekhez és foglalásokhoz kapcsolást, valamint a csillagot használhatod.',
  'help.guide.files-filter.tip.2':
    'A lista mindig úgy van rendezve, hogy elöl a csillagozott fájlok állnak, utána a legújabbak, így a ma feltöltött dokumentum a múlt havi fölött látszik.',
  // files-preview
  'help.guide.files-preview.title': 'Dokumentum megtekintése a TREK elhagyása nélkül',
  'help.guide.files-preview.goal':
    'Nézz meg azonnal egy jegyet vagy képet, és töltsd le az eszközödre, ha ott van rá szükséged.',
  'help.guide.files-preview.step.1':
    'Kattints egy kép nevére vagy bélyegképére. Teljes képernyőn nyílik meg, a bal felső sarokban a fájl nevével és azzal, hányadik a képek között. A videó ugyanígy nyílik meg, és ott le is játszhatod.',
  'help.guide.files-preview.step.2':
    'Az oldalsó kerek nyilakkal, a bal és jobb nyílbillentyűvel vagy az alsó bélyegképsávval lapozhatsz a lista által épp mutatott képek között.',
  'help.guide.files-preview.step.3':
    'A „Megnyitás új lapon” és a „Letöltés” a jobb felső sarokban lévő kerek gombok, az × mellett. A képet az × gombbal, az Esc billentyűvel vagy a sötét háttérre kattintva zárhatod be.',
  'help.guide.files-preview.step.4':
    'A nem kép típusú dokumentumok ehelyett egy ablakban nyílnak meg: felül a nevük, alatta a „Megnyitás új lapon” és a „Letöltés” gomb, PDF esetén pedig lejjebb maga az oldal. Az ablakot a jobb felső × jellel, az Escape billentyűvel vagy az ablak mellé kattintva zárhatod be.',
  'help.guide.files-preview.step.5':
    'A sor végén lévő nyíl („Letöltés”) megnyitás nélkül, egyenesen az eszközödre menti a fájlt.',
  'help.guide.files-preview.result':
    'A dokumentum megjelenik a képernyőn, és ugyanazzal a két gombbal megnyithatod egy böngészőlapon, vagy elmentheted a lemezedre.',
  'help.guide.files-preview.tip.1': 'Érintőképernyőn a nyilak helyett lapozz a képek között ujjal.',
  'help.guide.files-preview.tip.2':
    'A Wallet-kártyáknál sosem nyílik előnézet. Azonnal letöltődnek, hogy a telefon megnyithassa őket a tárcaalkalmazásában.',
  'help.guide.files-preview.tip.3':
    'A „Megnyitás új lapon” és a „Letöltés” is a te munkameneteddel tölti be a fájlt, így a címsorból kimásolt link másnak nem működik.',
  // files-trash
  'help.guide.files-trash.title': 'Dokumentum törlése és visszaállítása',
  'help.guide.files-trash.goal':
    'Töröld, amire az utazásnak már nincs szüksége, és állítsd vissza azokat a fájlokat, amelyekre még szükséged van.',
  'help.guide.files-trash.step.1':
    'Kattints a sor végén lévő kukára („Törlés”). A fájl azonnal eltűnik a listából, és megjelenik a „Kukába helyezve” üzenet. Megerősítő kérdés nincs.',
  'help.guide.files-trash.step.2':
    'A sáv jobb végén lévő kuka ikon („Kuka”) a törölt fájlokra váltja a listát. A sáv címe „Kuka” lesz, a szűrőfülek és a feltöltési mező pedig eltűnnek.',
  'help.guide.files-trash.step.3':
    'A kukában lévő sorok szürkék, és két ikon tartozik hozzájuk: a „Visszaállítás”, amely visszaállítja a fájlt, és a „Törlés”, amely megerősítés után véglegesen törli.',
  'help.guide.files-trash.step.4':
    'Kattints a „Visszaállítás” gombra. Megjelenik a „Fájl visszaállítva” üzenet, a fájl pedig kikerül a kukából. A megjegyzése és a kapcsolatai megmaradnak.',
  'help.guide.files-trash.step.5':
    'A sávban a kuka ikon melletti „Kuka ürítése” véglegesen töröl mindent, ami még a kukában van. A böngésző előtte egyszer megerősítést kér. A kuka ikon visszavált a fájlokra.',
  'help.guide.files-trash.result': 'A fájl visszakerült a listába, oda, ahol korábban volt.',
  'help.guide.files-trash.tip.1':
    'A sorban lévő „Törlés” nem kérdez rá előbb. Ezért van kuka: a TREK-ből semmi sem tűnik el, amíg itt nem törlöd. Mindez offline is működik, és a TREK akkor küldi el, amikor újra van kapcsolat.',
  'help.guide.files-trash.tip.2':
    'A fájlok törléséhez és visszaállításához fájltörlési jog kell. Akinek ez nincs meg, nem látja sem a sorban a „Törlés” gombot, sem a kuka gombjait.',
  'help.guide.files-trash.tip.3': 'A kukából véglegesen törölt fájl már nem állítható vissza.',
  // files-sync
  'help.guide.files-sync.title': 'Dokumentumok szinkronizálása a dokumentumtárral',
  'help.guide.files-sync.goal':
    'Csatlakoztasd az utazást a saját dokumentumtáradhoz, hogy az itt feltöltött fájlok ott is mentődjenek, az ott tárolt fájlok pedig itt is megjelenjenek.',
  'help.guide.files-sync.step.1':
    'Kattints a sáv jobb végén, a kuka ikon mellett a „Dokumentumok szinkronizálása” gombra. Megnyílik az ablak, a címe alatt az utazás nevével. Bal oldalon, a „Szolgáltató csatlakoztatása” alatt azok a tárolók szerepelnek, amelyeket az adminisztrátor bekapcsolt, mindegyiknél egy sor arról, hogyan tárolja a fájlokat: a Paperless-ngx és a Papra címke szerint, a Nextcloud és a Synology Drive mappában, az OpenCloud egy térben. Jobb oldalon a „Még nincs semmi csatlakoztatva” felirat áll.',
  'help.guide.files-sync.step.2':
    'Kattints a tárolódra, például a Nextcloudra. Megnyílik egy kisebb ablak a csatlakozáshoz. Ennek címe a tároló neve, és azokat a bejelentkezési adatokat kéri, amelyekre ennek a tárolónak szüksége van.',
  'help.guide.files-sync.step.3':
    'Töltsd ki a „Cím” mezőt és a tároló saját bejelentkezési adatait: Paperless-ngx-nél API-tokent, Papránál API-kulcsot és szervezetazonosítót, Nextcloudnál felhasználónevet és alkalmazásjelszót, OpenCloudnál felhasználónevet és alkalmazástokent, Synology Drive-nál pedig felhasználónevet, jelszót és, ha a fiók kéri, kétlépcsős kódot. Ahol a tároló lehetővé teszi, mindig alkalmazásjelszót vagy tokent használj, soha ne a fiókod jelszavát. A Nextcloud és a Synology Drive emellett egy opcionális alapmappát is elfogad, ahol a TREK az utazások mappáit keresi, itt a /Reisen mappát. Az alul lévő „Saját aláírású tanúsítvány elfogadása” csak a saját hálózatodon lévő, ilyen tanúsítványt használó tárolóhoz való.',
  'help.guide.files-sync.step.4':
    'Kattints a „Kapcsolat tesztelése” gombra. A TREK a megadott adatokkal csatlakozik a tárhelyhez, és a láblécben megjelenik a „Sikeres kapcsolat, bejelentkezve:” felirat a fiók nevével. Ha a hitelesítő adatokat elutasítja a tárhely, vagy a cím nem érhető el, a lábléc ezt jelzi. Egyik esetben sem mentődik el semmi.',
  'help.guide.files-sync.step.5':
    'Kattints a „Csatlakozás” gombra. A kapcsolat az utazással együtt mentődik, és a TREK megkérdezi, hol legyenek a tárhelyen az utazás dokumentumai: melyik címke, mappa vagy tér tartalmazza őket. Csak az szinkronizálódik, ami ott van. Az „Új létrehozása” a „Létrehozás” gombra kattintva létrehozza ezt az utazás címéből képzett névvel. A „Vagy használj egy meglévőt” alatt a már létezők látszanak. Kattints egyre, itt az Autumn in Japan mappára.',
  'help.guide.files-sync.step.6':
    'Az ablak újra megnyílik: a tárhelyed bal oldalon az „Ez az utazás” alatt látszik, a jobb oldali kártyáján pedig az, hová szinkronizál, mikor futott utoljára, és a „Szinkronizálás most” gomb. Az első szinkronizálás automatikusan elindul; a „Szinkronizálás most” gombbal bármikor elindíthatsz egyet. Szinkronizálás után a név melletti „Még nincs szinkronizálva” jelvény zöld pontra vált, amely fölé víve az egeret a „Naprakész” felirat látszik. A folyamatsáv mutatja, hány dokumentum van a TREK-ben és a tárhelyen, köztük a „Ki a tárolóba” és a „Be a tárolóból” sávval. Az ablakot a jobb felső × jellel zárhatod be.',
  'help.guide.files-sync.result':
    'A tárhelyen már meglévő dokumentumok a lista tetején jelennek meg, a te nevedben feltöltve, és az utazás minden dokumentuma a tárhelyen is megvan, kivéve a „Közös jegyzetek” dokumentumait. Mostantól a TREK a háttérben figyeli a tárhelyet, és a listában végzett módosításokat átmásolja oda.',
  'help.guide.files-sync.tip.1':
    'Az utazást csak a tulajdonosa vagy a példány adminisztrátora csatlakoztathatja, mert a hitelesítő adatok a tárolóban a teljes fiókhoz hozzáférést adnak. Ha az utazás már csatlakoztatva van, minden tag látja a „Dokumentumok szinkronizálása” gombot, megnyithatja, elolvashatja a kártyát, és megnyomhatja a „Szinkronizálás most” gombot.',
  'help.guide.files-sync.tip.2':
    'A saját hálózatodon lévő tárolóhoz a TREK-szerveren ALLOW_INTERNAL_NETWORK=true beállítás kell, a címének pedig a gép hálózati címének kell lennie, sosem localhost. Enélkül a „Kapcsolat tesztelése” ezt válaszolja: „Ez a cím nem engedélyezett.”',
  'help.guide.files-sync.tip.3':
    'A „Szinkronizálás most” melletti ikon, a „Leválasztás”, egyszer megerősítést kér. Ezután megszünteti a kapcsolatot, és mindkét oldalon megtart minden dokumentumot. Ha egy címkét, mappát vagy teret másodszor is csatlakoztatsz, a TREK újként kezeli, és mindent újra importál belőle. Ezért leválasztás után üreset csatlakoztass, ne a régit.',

  // ── Screen: trip-day-detail ───────────────────────────────────────────────────────────
  'help.ctx.trip-day-detail.title': 'Nap részletei',
  'help.ctx.trip-day-detail.summary':
    'Ez a panel nyílik meg a térkép fölött, ha egy nap fejlécére kattintasz. Egészében mutatja a napot: a nevét és a dátumát, az időjárást ott, ahol leszel, az aznapi foglalásokat és az erre a napra lefoglalt éjszakákat.',
  'help.ctx.trip-day-detail.bullet.1':
    'A napok oszlopában egy nap fejlécére kattintva a panel a térkép közepén nyílik meg. Ugyanerre a fejlécre újra kattintva, vagy a jobb oldali X-szel bezárod a panelt, és megszünteted a nap kijelölését. Ha a helyek oszlopából vagy a térképről megnyitsz egy helyet, a panel bezárul, és helyette a hely jelenik meg.',
  'help.ctx.trip-day-detail.bullet.2':
    'A fejlécben a nap neve és dátuma látszik. A név melletti ceruzával átnevezheted a napot. A dupla nyíllal keskeny sávvá csukhatod össze a panelt, hogy újra lásd a térképet.',
  'help.ctx.trip-day-detail.bullet.3':
    'Legfelül a nap időjárása látszik. Az „Előrejelzés:” felirat mutatja, melyik helyre vonatkozik az előrejelzés: a nap első megállójára, vagy arra a szállodára, ahol reggel ébredsz.',
  'help.ctx.trip-day-detail.bullet.4':
    'A „Foglalások” az adott nap foglalásait sorolja fel, mindegyiket a fajtájával, a hozzá tartozó megállóval és az időpontjaival. A zöld a megerősítettet, a borostyánsárga a még függőben lévőt jelzi, a tömegközlekedési út pedig kék, és nincs állapota. Egy sorra kattintva megnyílik a foglalás.',
  'help.ctx.trip-day-detail.bullet.5':
    'A „Szállás” az adott napot érintő összes lefoglalt éjszakát mutatja, a „Bejelentkezés” és a „Kijelentkezés” jelöléssel a megfelelő napokon, a bejelentkezési időablakkal, a kijelentkezés idejével és a visszaigazolási számmal. Ha a szálláshoz foglalás tartozik, alatta egy „Foglalás” mező mutatja a foglalást „Függőben” vagy „Megerősítve” állapottal. Rákattintva megnyílik a foglalás.',
  'help.ctx.trip-day-detail.bullet.6':
    'A „Szállás hozzáadása” szállást rögzít erre a napra: válaszd ki a szálláshelyet az utazás helyei közül, add meg, mely napokra szól, majd töltsd ki az időpontokat és a kódot. A nap fejlécében lévő + gomb („Hozzáadás a naphoz”) menüjében is ott a „Szállás hozzáadása”: ez ezt a panelt nyitja meg, már kinyitott űrlappal.',
  // day-panel
  'help.guide.day-panel.title': 'Nap megnyitása és részleteinek megtekintése',
  'help.guide.day-panel.goal':
    'Lásd egy nap minden részletét, az időjárást, a foglalásokat és a szállásodat, a térkép elhagyása nélkül.',
  'help.guide.day-panel.step.1':
    'Kattints egy nap fejlécére a napok oszlopában. A nap kijelölődik, a részletei pedig a térkép közepén nyílnak meg.',
  'help.guide.day-panel.step.2': 'A fejlécben a nap neve látható (amíg nem nevezed el, „1. nap”), alatta a dátuma.',
  'help.guide.day-panel.step.3':
    'Legfelül a nap időjárása látszik. Az „Előrejelzés” megmutatja, melyik helyre vonatkozik: a nap első megállójára, vagy arra a szállodára, ahol az előző éjszakát töltötted.',
  'help.guide.day-panel.step.4':
    'Alatta a „Foglalások” rész listázza az erre a napra eső foglalásokat az időpontjukkal.',
  'help.guide.day-panel.step.5':
    'A „Szállás” rész az erre a napra lefoglalt éjszakákat mutatja, a „Bejelentkezés” és a „Kijelentkezés” jelöléssel azokon a napokon, amikor esedékesek.',
  'help.guide.day-panel.step.6':
    'A fejlécben lévő dupla nyíllal keskeny sávvá csukhatod össze a panelt. A mellette lévő X bezárja a panelt, és megszünteti a nap kijelölését.',
  'help.guide.day-panel.result':
    'Ha sávvá csukod össze a panelt, a térkép szabadon látszik, a nap pedig kijelölve marad. Ha bezárod, a nap kijelölése megszűnik, és a terv változatlan marad.',
  'help.guide.day-panel.tip.1':
    'A panelt úgy is összecsukhatod, hogy a fejlécsávján bárhová kattintasz. A nyíl ennek csak az egyik módja.',
  'help.guide.day-panel.tip.2':
    'Ha a helyek oszlopából vagy a térképről megnyitsz egy helyet, a nap panelje bezárul, és helyette a hely részletei jelennek meg. A napot a fejlécére kattintva hozhatod vissza.',
  // day-weather
  'help.guide.day-weather.title': 'A nap időjárása',
  'help.guide.day-weather.goal': 'Nézd meg az időjárást ott, ahol aznap valóban leszel.',
  'help.guide.day-weather.step.1':
    'Az „Előrejelzés:” felirat mutatja, melyik helyre vonatkoznak a számok: a nap első megállójára, vagy ha a napon nincs megálló, arra a szállodára, ahol az előző éjszakát töltöd.',
  'help.guide.day-weather.step.2':
    'A nagy szám a nap hőmérséklete. Mellette a napi minimum és maximum, valamint az időjárás szöveges leírása látszik.',
  'help.guide.day-weather.step.3':
    'A tőle jobbra lévő címkék: a csapadék valószínűsége és várható mennyisége, a legerősebb szél, valamint a napkelte és a napnyugta.',
  'help.guide.day-weather.step.4':
    'Alul a nap óránkénti bontása, kétóránként: az időpont, az ikon, a hőmérséklet és a csapadék valószínűsége. Az 50 százalék feletti órák kék hátteret kapnak.',
  'help.guide.day-weather.result':
    'A napok oszlopában a nap kártyáján is megjelenik az időjárás, kis betűvel a nap száma alatt, így gyorsan átlátod az egész utazás időjárását.',
  'help.guide.day-weather.tip.1':
    'A hőmérséklet és a szél a Beállítások „Megjelenés” részében megadott „Hőmérséklet egység” szerint jelenik meg: ha a °F Fahrenheitet választod, ugyanazt az előrejelzést °F-ban és mph-ban látod.',
  'help.guide.day-weather.tip.2':
    'Ha egy napon nincs hellyel rendelkező megálló, és az előző éjszakáról sincs szálloda, a nap nem mutat időjárást: az előrejelzés mindig egy helyre vonatkozik, sosem az egész utazásra.',
  'help.guide.day-weather.tip.3':
    '16 napnál távolabbi időpontra nincs előrejelzés. Ilyenkor a számok a korábbi évek átlagai az adott napra. Ø jel jelöli őket, és alattuk egy megjegyzés is erre utal.',
  // rename-day
  'help.guide.rename-day.title': 'Nap elnevezése',
  'help.guide.rename-day.goal': 'Adj a napnak „5. nap” helyett olyan nevet, mint „Érkezés Kiotóba” vagy „Pihenőnap”.',
  'help.guide.rename-day.step.1': 'Nyisd meg a napot. A fejlécében az „5. nap” felirat áll, alatta a dátum.',
  'help.guide.rename-day.step.2': 'Kattints a név melletti ceruzára.',
  'help.guide.rename-day.step.3': 'A név szerkeszthető mezővé alakul. Írd be a kívánt nevet.',
  'help.guide.rename-day.step.4':
    'Nyomj Entert, vagy kattints máshová. Az Esc billentyű elveti a módosítást. A nap kártyáján a napok oszlopában is megjelenik a név.',
  'help.guide.rename-day.result':
    'Az új név váltja fel az „5. nap” feliratot a panelen és a nap kártyáján a napok oszlopában; a dátum nem változik.',
  'help.guide.rename-day.tip.1':
    'Ha kiüríted a mezőt és mentesz, a nap neve újra „5. nap” lesz: név hiányában a sorszám látszik.',
  'help.guide.rename-day.tip.2':
    'A név a naphoz tartozik, nem a dátumhoz. Ha átrendezed a napokat, a név a nap minden más tartalmával együtt vándorol.',
  // add-accommodation
  'help.guide.add-accommodation.title': 'Éjszaka foglalása egy napra',
  'help.guide.add-accommodation.goal':
    'Vedd fel a szállodát egyszer a tervbe, az érintett napokkal, az időpontokkal és a visszaigazolási számmal együtt.',
  'help.guide.add-accommodation.step.1':
    'A szálláshelynek előbb az utazás helyei között kell szerepelnie. Hozd létre a helyek oszlopában, ugyanúgy, mint bármely más helyet: a választó csak a már meglévő helyeket kínálja fel.',
  'help.guide.add-accommodation.step.2':
    'Nyisd meg az érkezés napját, és a „Szállás” alatt kattints a „Szállás hozzáadása” gombra.',
  'help.guide.add-accommodation.step.3':
    'Az „Alkalmazás napokra” résznél adhatod meg, mely éjszakákra szól a szállás: a „Kezdés” a bejelentkezés napja, a „Befejezés” a kijelentkezésé, a „Mind” pedig a teljes utazásra kiterjed. Az ablak tetején látszik az időszak és az éjszakák száma.',
  'help.guide.add-accommodation.step.4':
    'Töltsd ki a „Bejelentkezés”, az „Eddig” és a „Kijelentkezés” mezőt, a foglalás számát pedig írd a „Visszaigazolás” mezőbe. Mind a négy maradhat üresen.',
  'help.guide.add-accommodation.step.5':
    'Válaszd ki a szálláshelyet a „Szálloda kiválasztása” alatt. A lista fölötti „Kategória” egy kategóriára szűkíti a listát.',
  'help.guide.add-accommodation.step.6': 'Kattints a „Mentés” gombra.',
  'help.guide.add-accommodation.result':
    'A szállás minden olyan napon látszik, amelyre vonatkozik, az elsőn „Bejelentkezés”, az utolsón „Kijelentkezés” jelzéssel. A bejelentkezés napján a szálláshely megálló lesz, így a térkép odáig megmutatja az útvonalat, a „Foglalások” fülön pedig megjelenik egy szállodafoglalás.',
  'help.guide.add-accommodation.tip.1':
    'A választó azon a napon nyílik meg, ahonnan indítottad, a kijelentkezés a következő napra esik; mentés előtt mindkettőt módosíthatod.',
  'help.guide.add-accommodation.tip.2':
    'Létrehozáskor add meg a szállodának a „Hotel” kategóriát. Így a lista fölötti „Kategória” szűrővel egy kattintással csak a szállodáidat látod.',
  'help.guide.add-accommodation.tip.3':
    'Az időpontok megadása nem kötelező: be- és kijelentkezési idő és kód nélkül is lefedi a szállás az éjszakáit, és az útvonala is megjelenik.',
  // edit-accommodation
  'help.guide.edit-accommodation.title': 'Lefoglalt éjszaka módosítása vagy lemondása',
  'help.guide.edit-accommodation.goal': 'Helyezz át egy szállást, javítsd az időpontjait, vagy vedd ki a tervből.',
  'help.guide.edit-accommodation.step.1':
    'A kártyán látod a szálláshelyet és a címét, a megfelelő napokon a „Bejelentkezés” vagy „Kijelentkezés” jelölést az időpontokkal, a visszaigazolási számot, a „Foglalás” alatt pedig a hozzá tartozó foglalást.',
  'help.guide.edit-accommodation.step.2':
    'A jobb oldalán lévő ceruzával („Szállás szerkesztése”) megnyithatod szerkesztésre. A felugró ablak címe ilyenkor „Szállás szerkesztése”.',
  'help.guide.edit-accommodation.step.3':
    'Javítsd a „Bejelentkezés”, az „Eddig”, a „Kijelentkezés” és a „Visszaigazolás” mezőt. A fölöttük lévő napokat és az alattuk lévő szálláshelyet is itt módosíthatod.',
  'help.guide.edit-accommodation.step.4': 'Kattints a „Mentés” gombra.',
  'help.guide.edit-accommodation.step.5':
    'A ceruza melletti X („Eltávolítás”) törli a szállást. Nem kér megerősítést, és a szálláshoz tartozó szállodafoglalás is törlődik.',
  'help.guide.edit-accommodation.result':
    'A módosítás azonnal érvényes a szállás összes napjára, és a „Foglalások” fülön lévő szállodafoglalásra is.',
  'help.guide.edit-accommodation.tip.1':
    'A szállás közbülső éjszakáin nincs „Bejelentkezés” és „Kijelentkezés” címke: csak az időszak első és utolsó napján.',
  'help.guide.edit-accommodation.tip.2':
    'Egy szállás lemondásával a bejelentkezés napjára felvett megálló is törlődik, ahogy a foglaláshoz kapcsolt összes költség is. Ha tévedés volt, foglald le újra az éjszakát.',
  // day-bookings
  'help.guide.day-bookings.title': 'A nap foglalásai egy helyen',
  'help.guide.day-bookings.goal': 'Lásd egy helyen, mi van már lefoglalva erre a napra, és meg van-e erősítve.',
  'help.guide.day-bookings.step.1':
    'A „Foglalások” a nap foglalásait sorolja fel: az erre a napra szólókat és azokat, amelyek a nap egyik megállójához vannak rögzítve. Ha egy foglalás egy másik nap megállójához van rögzítve, csak annál a megállónál jelenik meg.',
  'help.guide.day-bookings.step.2':
    'Egy sorban látszik a foglalás típusa és neve, és ha egy megállóhoz tartozik, utána szürkével az a megálló is. Az időpontok a sor jobb végén, az állapotpont előtt jelennek meg.',
  'help.guide.day-bookings.step.3':
    'A szín a foglalás állapotát mutatja: a zöld megerősített, a borostyánsárga még függőben van, a tömegközlekedési út pedig kék, állapot nélkül. A szállodák nem szerepelnek ebben a listában, saját részük van alatta.',
  'help.guide.day-bookings.step.4':
    'Egy sorra kattintva megnyílik a foglalás. A fejlécében lévő gombbal „Függőben” és „Megerősítve” között válthatsz, az alul lévő „Szerkesztés” gombbal pedig a többi adatot módosíthatod. Új foglalást a „Foglalások” fülön, új közlekedést a „Közlekedés” fülön hozhatsz létre.',
  'help.guide.day-bookings.result':
    'Ebben a listában minden megtalálható, ami arra a napra van dátumozva, vagy a nap valamelyik megállójához kapcsolódik.',
  'help.guide.day-bookings.tip.1':
    'A foglalás a saját dátumának napján jelenik meg. Ha a „Foglalások” vagy a „Közlekedés” fülön módosítod a dátumot, a foglalás magától átkerül a másik napra.',
  'help.guide.day-bookings.tip.2':
    'Ha nincs „Foglalások” blokk, a napra nincs foglalás: ilyenkor a blokk nem jelenik meg üresen, hanem rejtve marad.',
  'help.guide.map-lock.title': 'A térkép zárolása',
  'help.guide.map-lock.goal': 'Tartsd egy helyben a térképet, miközben a napokra és a helyekre kattintgatsz.',
  'help.guide.map-lock.step.1':
    'A lakat a térkép bal alsó sarkában lévő két kerek gomb közül a felső; ha fölé viszed az egeret, ez olvasható: „Térképnézet zárolása”. Kattints rá. Amíg zárva van, egy nap megnyitása vagy egy hely kiválasztása már nem nagyítja és nem mozgatja a térképet, a gombon pedig ez áll: „A térkép kövesse a kijelölést”.',
  'help.guide.map-lock.result': 'A térkép ott marad, ahol hagytad, miközben a terven dolgozol.',
  'help.guide.map-lock.tip.1':
    'Kattints újra a lakatra (most „A térkép kövesse a kijelölést”), és a térkép ismét követi, amit kiválasztasz. A lakat csak számítógépen érhető el; telefonon a térkép mindig követi a kijelölést.',

  // ── Screen: trip-map ──────────────────────────────────────────────────────────────────
  'help.ctx.trip-map.title': 'Térkép',
  'help.ctx.trip-map.summary':
    'A terv közepe: az utazás minden helye gombostűként, minden túra vonalként, a köztük futó útvonalak, a térkép szélein pedig a gombok, amelyekkel rögzítheted a nézetet, műholdas nézetre válthatsz, egyszerre megjelenítheted a teljes utazást, és megmutathatod az éppen nézett terület helyeit.',
  'help.ctx.trip-map.bullet.1':
    'A gombostű egy hely: a saját fotójával, ha van, egyébként a kategória színével és ikonjával. Ha fölé viszed az egeret, egy kártya mutatja a képét, a nevét és a címét, valamint az értékelését és a kategóriáját, ha vannak. Egy gombostűt egy napkártyára húzva arra a napra tervezed a helyet. A még függőben lévő foglalású szállás halványan, szaggatott gyűrűvel látszik.',
  'help.ctx.trip-map.bullet.2':
    'Az egymáshoz túl közeli gombostűk egy sötét körbe csoportosulnak, benne a számukkal. A körre kattintva a térkép ráközelít a benne lévő gombostűkre. Ha a Beállítások > Megjelenés menüpont „Utazás és térkép” részében be van kapcsolva a „Kompakt jelölők a nem tervezett helyekhez”, a még egyik napon sem szereplő helyek fotó nélküli kis pontként jelennek meg, így a tervezett megállók jobban látszanak.',
  'help.ctx.trip-map.bullet.3':
    'Ha egy gombostűre kattintasz, a hely egy kártyán nyílik meg a térkép alján, az értékelésével, a fájljaival és a további műveletekkel. A kártyát a térkép egy üres pontjára kattintva zárhatod be.',
  'help.ctx.trip-map.bullet.4':
    'Ha a napok oszlopában egy nap meg van nyitva, a megállóin kis fehér jelvény mutatja, hányadikak az adott napon. Ha egy hely kétszer is szerepel a napon, mindkét száma látszik. A helylista fölötti szűrők („Megjelenítés”, a kategóriák és a minimális értékelés csillaga) a térkép gombostűit is szűrik.',
  'help.ctx.trip-map.bullet.5':
    'A felső ikonsor a térkép látható részén keres: „Éttermek”, „Kávézók”, „Bárok és éjszakai élet”, „Szállás”, „Látnivalók”, „Múzeumok és kultúra”, „Természet és parkok” és „Programok”. A pluginek által hozzáadott kategóriák egy vékony elválasztó vonal után következnek. Ha a sor szélesebb a térképnél, az egérgörgővel oldalra görgetheted. A térkép mozgatása után a „Keresés ezen a területen” újra lefuttatja a keresést.',
  'help.ctx.trip-map.bullet.6':
    'A térképen bárhol jobb gombbal kattintva megnyílik a helyűrlap az adott pontra, a címmel már lekérdezve. A bal alsó sarokban két kerek gomb van: a lakat („Térképnézet zárolása”) a helyén tartja a térképnézetet, miközben napokra és helyekre kattintasz, az alatta lévő gomb („Váltás műholdas nézetre”) pedig a rajzolt térképet műholdképre cseréli.',
  'help.ctx.trip-map.bullet.7':
    'A jobb alsó sarokban lévő „Teljes utazás megjelenítése” egyszerre rajzolja ki az összes utazási napot, és felsorolja, mit tartalmaz az egyes nap. Egy foglalás sorában az útvonal ikon az adott foglalást, a napok fölötti eszköztár útvonal ikonja pedig az összes foglalást rajzolja ki. Egy kirajzolt foglalás végére kattintva megnyílnak a részletei.',
  'help.ctx.trip-map.bullet.8':
    'Bekapcsolt Dawarich bővítménnyel a „Teljes utazás megjelenítése” alatti kerek Dawarich gomb a telefonod által ténylegesen rögzített útvonalat mutatja. A „Rögzített útvonal megjelenítése” szaggatott vonalként rajzolja a tervezett útvonal alá, naponként más színnel. Ha nincs vonal, a gomb felirata elárulja, miért.',
  // map-markers
  'help.guide.map-markers.title': 'A térkép értelmezése',
  'help.guide.map-markers.goal': 'Értsd meg, mit jelent a térképen minden gombostű, jelvény és buborék.',
  'help.guide.map-markers.step.1':
    'A térkép az utazás összes helyét mutatja. Ahol a gombostűk túl közel vannak egymáshoz, egyetlen sötét körbe csoportosulnak, benne a gombostűk számával. Ha a körre kattintasz, a térkép ráközelít ezekre a gombostűkre, a legnagyobb nagyításnál pedig széthúzza őket.',
  'help.guide.map-markers.step.2':
    'A gombostű a hely saját fotóját mutatja, ha van, egyébként a kategória színét és ikonját. A még függőben lévő foglalású szállás halványan, szaggatott gyűrűvel látszik. Ha egy gombostű fölé viszed az egeret, mellette kártya nyílik: ugyanaz a fotó nagyobban, a név és a cím, valamint az értékelés és a kategória, ha a helynek van ilyen.',
  'help.guide.map-markers.step.3':
    'Kattints egy gombostűre, és a hely kártyája megnyílik a térkép alsó részén: felül a kép, a név és a cím, alatta a csillagok, a leírás és a fájlok, a foglaláshoz tartozókat is beleértve. Alul találod a műveleteket: „Hozzáadás a naphoz”, ha egy nap meg van nyitva (ha a hely már szerepel rajta, „Eltávolítás a napról”), „Navigáció”, „Weboldal megnyitása”, „Mentés gyűjteménybe” (ha már egy gyűjteményben van, „Mentve”), jobbra pedig a kuka és a „Szerkesztés”. A felső X vagy egy kattintás a térkép üres részére bezárja a kártyát.',
  'help.guide.map-markers.step.4':
    'Ha a napok oszlopában megnyitsz egy napot, a megállói sorszámot kapnak: a gombostű sarkában lévő kis fehér jelvény mutatja, hányadik a megálló a napon. Ha egy hely kétszer szerepel a napon, mindkét száma látszik. Ha nincs megnyitott nap, nincsenek számok, és a sarokban helyettük a hely értékelése látszik, ha van.',
  'help.guide.map-markers.step.5':
    'Ha egy gombostűt a térképről a napok oszlopában egy nap kártyájára húzol, a hely arra a napra kerül, ugyanúgy, mintha a sorát húznád át a helyek listájából.',
  'help.guide.map-markers.result':
    'Az utazáson semmi sem változott: a térkép csak megjeleníti az utazást. Minden gombostűről leolvasható, melyik helyről van szó, melyik napon és hányadikként szerepel.',
  'help.guide.map-markers.tip.1':
    'Ha a napok oszlopában összecsuksz egy napot, a megállói eltűnnek a térképről. Ha újra kibontod a napot, megjelennek.',
  'help.guide.map-markers.tip.2':
    'A helylista fölötti szűrők azt is meghatározzák, mit mutat a térkép: a „Megjelenítés” („Nem tervezett”, „Tervezett”), a címkegomb alatti kategóriák és a csillag alatti minimális értékelés is csökkenti a gombostűk számát. Az országszűrő csak a listát szűkíti.',
  'help.guide.map-markers.tip.3':
    'Ezen a térképen nincsenek nagyítógombok: a görgővel nagyíthatsz, dupla kattintással egy lépést közelíthetsz, magát a térképet pedig húzással mozgathatod.',
  // map-nearby-places
  'help.guide.map-nearby-places.title': 'Helyek keresése a környéken a térképen',
  'help.guide.map-nearby-places.goal':
    'Keress éttermet, látnivalót vagy szállodát a városnak a térképen látható részén, és vedd fel valamelyiket az utazásba.',
  'help.guide.map-nearby-places.step.1':
    'A térkép tetején lévő ikonsor a kategóriakeresés: „Éttermek”, „Kávézók”, „Bárok és éjszakai élet”, „Szállás”, „Látnivalók”, „Múzeumok és kultúra”, „Természet és parkok” és „Programok”. A pluginek által hozzáadott kategóriák egy vékony elválasztó után következnek; ha egy ikon fölé viszed az egeret, megjelenik a neve.',
  'help.guide.map-nearby-places.step.2':
    'Kattints egy kategóriára. A TREK ilyen típusú helyeket keres a térkép látható részén, és minden találathoz a kategória színével jelölt gombostűt tesz le. Egyszerre csak egy kategória lehet aktív: egy másikra kattintva lecseréled, az aktívra kattintva kikapcsolod.',
  'help.guide.map-nearby-places.step.3':
    'Ha elmozdítod a térképet, a sor alatt megjelenik egy második gomb: a „Keresés ezen a területen” ugyanazt a keresést futtatja le az új nézetre. A térkép mozgatása magától nem indít új keresést, így kevesebb kérés megy ki.',
  'help.guide.map-nearby-places.step.4':
    'Ha egy gombostű fölé viszed az egeret, látod a találat nevét. Rákattintva megnyílik a hely űrlapja, már kitöltött adatokkal: a név az ablak tetején, a „Cím”, a „Szélességi fok” és a „Hosszúsági fok”, valamint a weboldal és a telefonszám, ha a keresés megtalálta őket.',
  'help.guide.map-nearby-places.step.5':
    'Ellenőrizd a kitöltött adatokat, és egészítsd ki azzal, amit a keresés nem tudhatott. A név alatti kategóriagomb már be van állítva, ha az utazásnak van megfelelő kategóriája, például étteremnél az étterem; ha nincs, „Nincs kategória” látszik rajta, amíg nem választasz. Adj hozzá leírást („Leírás”) és saját jegyzeteket.',
  'help.guide.map-nearby-places.step.6':
    'Kattints a „Hozzáadás” gombra. Ha már van az utazásban azonos nevű vagy ugyanazon a ponton lévő hely, a TREK jelzi ezt, és a gomb felirata „Hozzáadás mindenképp” lesz.',
  'help.guide.map-nearby-places.result':
    'A hely bekerült a helylistába, és a térképen az utazás saját gombostűjeként látszik, a „Nem tervezett” helyek között, amíg egy naphoz nem rendeled. A keresés gombostűi addig maradnak, amíg ki nem kapcsolod a kategóriát.',
  'help.guide.map-nearby-places.tip.1':
    'A sor rejtve marad, ha a Beállítások > Megjelenés menüpont „Utazás és térkép” részében a „Helyek felfedezése a térképen” ki van kapcsolva.',
  'help.guide.map-nearby-places.tip.2':
    'A találatok a TREK Places indexéből és az OpenStreetMapből származnak, így ez azon kevés funkció egyike a tervben, amelyhez internetkapcsolat kell.',
  'help.guide.map-nearby-places.tip.3':
    'A keresés csak a képernyőn látható területet fedi le, ezért nagyíts rá arra az utcára, amely érdekel. Egy egész városra kiterjedő keresés csak az első hatvan találatot adja, különösebb sorrend nélkül.',
  // map-add-place
  'help.guide.map-add-place.title': 'Hely létrehozása jobb kattintással a térképen',
  'help.guide.map-add-place.goal': 'Tedd a helyet pontosan oda, ahová szeretnéd, előzetes keresés nélkül.',
  'help.guide.map-add-place.step.1':
    'Kattints jobb gombbal a térkép kívánt pontjára. Megnyílik a hely űrlapja „Hely/Tevékenység hozzáadása” címmel.',
  'help.guide.map-add-place.step.2':
    'A „Szélességi fok” és a „Hosszúsági fok” már erre a pontra van beállítva. A TREK lekérdezi a koordinátákat, és a „Cím” mezőt az ott talált adattal tölti ki. Ha a lekérdezés nevet is talál, a TREK az ablak tetején a nevet is kitölti. Még semmi sincs elmentve, így javítsd ki, ami nem stimmel.',
  'help.guide.map-add-place.step.3':
    'Az ablak tetején lévő mezőbe írj egy olyan nevet, amelyről felismered a helyet. Az alatta lévő gombbal válassz kategóriát; amíg nem választasz, „Nincs kategória” látszik rajta. Ezután add meg a tervhez szükséges további adatokat: „Leírás”, „Jegyzetek”, „Weboldal”.',
  'help.guide.map-add-place.step.4':
    'Kattints a „Hozzáadás” gombra. A hely nem tervezettként kerül a listába akkor is, ha egy nap meg van nyitva: a jobb kattintás a térképen a helyszínt adja meg, nem a napot.',
  'help.guide.map-add-place.result':
    'A hely bekerül a listába és a térképre, a „Nem tervezett” csoportba, amíg egy napra nem teszed.',
  'help.guide.map-add-place.tip.1':
    'A cím a koordináták alapján készül, ezért név helyett gyakran csak utca jelenik meg, lakatlan területen pedig üres is lehet. Mindkét mezőt felülírhatod.',
  'help.guide.map-add-place.tip.2':
    'A MapLibre GL és a Mapbox GL térképen a középső egérgombos kattintás is ugyanezt teszi, érintőképernyőn pedig a hosszú nyomás.',
  // map-satellite
  'help.guide.map-satellite.title': 'Váltás műholdas nézetre',
  'help.guide.map-satellite.goal': 'Váltás a rajzolt térkép és a légifelvételek között.',
  'help.guide.map-satellite.step.1':
    'Az alapréteg-kapcsoló a térkép bal alsó sarkában lévő két kerek gomb közül az alsó, a lakat alatt. Az ikonja mindig azt a réteget mutatja, amelyre vált, az elemleírása pedig meg is nevezi: „Váltás műholdas nézetre”. Kattints rá.',
  'help.guide.map-satellite.step.2':
    'A térkép most légifotókat mutat. Ezek elég részletesek ahhoz, hogy egyes épületeket is láss, és nincs szükséged saját kulcsra. Minden, amit a TREK rajzol, fölöttük marad: a gombostűk, a nap útvonala, a nyomvonalak és a foglalási útvonalak.',
  'help.guide.map-satellite.step.3':
    'A gombon most a „Váltás térkép nézetre” felirat áll. Kattints rá, hogy visszatérj a térképnézethez.',
  'help.guide.map-satellite.result': 'A térkép újrarajzolódik, és a fiókod megjegyzi a választott réteget.',
  'help.guide.map-satellite.tip.1':
    'A választás a fiókodban mentődik, nem az utazásban, így minden utazás úgy nyílik meg, ahogy legutóbb hagytad, bármelyik térképmegjelenítőt használod.',
  'help.guide.map-satellite.tip.2':
    'A műholdképeken nincsenek feliratok: utcanevek, városrészek és házszámok csak a rajzolt térképen vannak, ezért ha címet keresel, válts vissza.',
  // map-whole-trip
  'help.guide.map-whole-trip.title': 'A teljes utazás és a távolságok áttekintése',
  'help.guide.map-whole-trip.goal':
    'Jelenítsd meg az utazás összes utazási napját a megnyitott nap helyett, és nézd meg, naponta mekkora távot teszel meg.',
  'help.guide.map-whole-trip.step.1':
    'A kerek „Teljes utazás megjelenítése” gomb a térkép jobb alsó sarkában van. Ha rákattintasz, az utazás összes utazási napja egyszerre megjelenik, mindegyik saját színnel, így a szomszédos napok is jól elkülönülnek.',
  'help.guide.map-whole-trip.step.2':
    'A gomb fölötti kártya felsorolja ezeket a napokat: egy színes pont, a nap neve, a napon használt közlekedési módok ikonjai és a megtett távolság. Legfelül a „Teljes távolság” áll.',
  'help.guide.map-whole-trip.step.3':
    'Egy nap kijelöléséhez kattints rá a kártyán: a sora kiemelést kap, a nap pedig megnyílik a napok oszlopában. Egy város fölött görgess az egérgörgővel a nagyításhoz. A városon áthaladó napok egymás mellett, mindegyik a saját színében jelennek meg.',
  'help.guide.map-whole-trip.step.4':
    'A gomb felirata most „Teljes utazás elrejtése”. Kattints rá, hogy ismét csak a megnyitott nap látszódjon.',
  'help.guide.map-whole-trip.result':
    'Minden utazási nap a saját színével jelenik meg, a kártya pedig mutatja, mit fed le az egyes nap, és mennyi az utazás összesen.',
  'help.guide.map-whole-trip.tip.1':
    'A teljes táv néhány szakaszonként számolódik. Amíg utána … látszik, a szám csak részösszeg. Akkor végleges, amikor már minden szakasz ki van számolva.',
  'help.guide.map-whole-trip.tip.2':
    'Ha az útvonaltervező nem tudja kiszámolni egy szakaszt, az egyenes vonal marad, és nem számít bele az összegbe. A kártya ezt jelzi is, így az összeg nem csökken figyelmeztetés nélkül.',
  'help.guide.map-whole-trip.tip.3':
    'Ha egy napon kettőnél kevesebb helyhez kötött megálló van, és nincs autóút a szállásra vagy onnan, nincs kirajzolható útvonal, ezért a nap egyáltalán nem jelenik meg a kártyán.',
  // map-booking-routes
  'help.guide.map-booking-routes.title': 'Foglalás útvonalának megjelenítése a térképen',
  'help.guide.map-booking-routes.goal':
    'A lefoglalt repülőutak, vonatutak és autós utak megjelenítése a térképen, majd elrejtése.',
  'help.guide.map-booking-routes.step.1':
    'A foglalási útvonalak alapból ki vannak kapcsolva, amíg egyet be nem kapcsolsz. A napok oszlopában egy közlekedési tétel sorának jobb végén van egy kis útvonal ikon: „Foglalási útvonalak megjelenítése”.',
  'help.guide.map-booking-routes.step.2':
    'Kattints rá, és a foglalás megjelenik a térképen: a repülés főköríves ívként, az autóút a valódi utak mentén, a vonat az állomásai láncaként. A megerősített foglalás folytonos, a függőben lévő szaggatott vonallal jelenik meg, az útvonal végein pedig kék címkék látszanak a közlekedési eszköz ikonjával.',
  'help.guide.map-booking-routes.step.3':
    'Kattints egy végponti gombra, és megnyílnak a foglalás részletei: a színes fejlécben gombként az állapot, a típus és a napok, alatta a két végpont időpontja, majd a többi adat, alul pedig a „Térképen” gomb, amely újra kikapcsolja ezt az útvonalat, tömegközlekedési kapcsolatnál az „Útvonal módosítása”, a foglalást törlő kuka és a „Szerkesztés”. A fejlécben lévő X bezárja a részleteket.',
  'help.guide.map-booking-routes.step.4':
    'A napok fölötti eszköztár útvonal ikonja egyszerre az egész utazásra vonatkozik: az „Összes foglalási útvonal megjelenítése” minden olyan foglalást kirajzol, amelyhez útvonal tartozik.',
  'help.guide.map-booking-routes.step.5':
    'Ez felülírja a korábbi választásaidat, így a foglalásonként bekapcsolt útvonalak visszaállnak. Az összes foglalási útvonal elrejtéséhez nyomd meg újra a gombot, amelyen most az „Összes foglalási útvonal elrejtése” felirat áll.',
  'help.guide.map-booking-routes.result':
    'A kért foglalások megjelennek a térképen, és a választás ehhez az utazáshoz ebben a böngészőben megmarad, amíg meg nem változtatod.',
  'help.guide.map-booking-routes.tip.1':
    'A végpontokon csak akkor jelenik meg a repülőtér kódja vagy az állomás neve, ha a Beállítások > Megjelenés menüpont „Utazás és térkép” részében be van kapcsolva az „Útvonal-címkék a foglalásokhoz”; egyébként csak az ikon látszik.',
  'help.guide.map-booking-routes.tip.2':
    'Az ugyanebben a részben lévő „Mindig jelenjenek meg a foglalási útvonalak” beállítással ezek az útvonalak minden olyan utazásnál kezdettől látszanak, ahol ezt még nem állítottad be magad.',
  'help.guide.map-booking-routes.tip.3':
    'Egy foglalás csak akkor rajzolható ki, ha a kiindulópontjának és a céljának is vannak koordinátái, ezért egy szállodánál vagy egy étteremnél nincs útvonal ikon.',
  // map-dawarich-trail
  'help.guide.map-dawarich-trail.title': 'A ténylegesen megtett útvonal megjelenítése',
  'help.guide.map-dawarich-trail.goal':
    'Jelenítsd meg a térképen a Dawarich által a telefonodon rögzített útvonalat szaggatott vonalként a tervezett útvonal mellett, és nézd meg napról napra, hogyan alakult valójában az utazás.',
  'help.guide.map-dawarich-trail.step.1':
    'A kerek Dawarich gomb a térkép jobb alsó sarkában, a „Teljes utazás megjelenítése” alatt található. Ha fölé viszed az egeret, ez látszik: „Rögzített útvonal megjelenítése”. Kattints rá. A TREK lekéri a Dawarichodtól az utazás dátumaira vonatkozó adatokat, és amíg a válaszra vár, egy gyűrű forog a gomb körül.',
  'help.guide.map-dawarich-trail.step.2':
    'A rögzített útvonal szaggatott vonalként jelenik meg, naponként más színnel, a tervezett útvonal alá rajzolva, hogy a terv olvasható maradjon. A gombon most a „Rögzített útvonal elrejtése” felirat áll. Minden nap helyi idő szerint éjfélkor ér véget. Ha a napok oszlopában összecsukasz egy napot, a szaggatott vonala és a megállói eltűnnek a térképről.',
  'help.guide.map-dawarich-trail.step.3':
    'Kattints a „Teljes utazás megjelenítése” gombra is, és minden tervezett nap folytonos vonalként jelenik meg a szaggatott felvétel mellett. Ahol a két vonal egybeesik, a nap a terv szerint telt. Ahol a szaggatott vonal letér a tervezett útvonalról, ott nem.',
  'help.guide.map-dawarich-trail.result':
    'A térképen együtt látod, mit terveztél és mit csináltál valójában, szaggatott és folytonos vonalként. A gombok fölötti kártya továbbra is a tervezett napokat és azok távolságait sorolja fel.',
  'help.guide.map-dawarich-trail.tip.1':
    'A be- vagy kikapcsolt állapotot a fiókod utazásonként menti, így minden böngészőben és minden eszközön ugyanaz. Amíg az útvonal be van kapcsolva, a TREK kétpercenként újra lekérdezi a Dawarichot, így egy zajló utazás az oldal újratöltése nélkül is frissül. Magát az útvonalat a TREK sosem tárolja, így nincs benne az adatbázisában, a biztonsági mentésekben, és offline sem érhető el.',
  'help.guide.map-dawarich-trail.tip.2':
    'A gomb felirata elárulja, miért üres a térkép: betöltés közben „Rögzített útvonal betöltése…”, egyébként „Ezeken a napokon nem készült rögzítés”, „A rögzített útvonalat nem sikerült betölteni”, vagy ha a TREK offline, „A rögzített útvonalhoz kapcsolat kell”.',
  // map-compass
  'help.guide.map-compass.title': 'A térkép elforgatása és visszaállítása északra',
  'help.guide.map-compass.goal':
    'Fordítsd el a térképet a haladási irányodba, és egy kattintással állítsd vissza északra.',
  'help.guide.map-compass.step.1':
    'A térképet jobb egérgombbal húzva forgathatod, vagy a Ctrl lenyomva tartása mellett bal gombbal húzva; érintőképernyőn két ujjal forgasd. A térkép tetején, a kategóriaikonok sora mellett lévő kerek iránytű vele együtt fordul: a nyila mindig északra mutat, így ugyanannyival dől el, mint a térkép.',
  'help.guide.map-compass.step.2':
    'Kattints az iránytűre. Az „Észak visszaállítása” gomb úgy forgatja vissza a térképet, hogy észak felül legyen, újra sík nézetre vált, és a nyíl ismét felfelé mutat.',
  'help.guide.map-compass.result':
    'A térkép ismét észak felé néz, és újra sík. Az utazáson semmi sem változott: az iránytű csak a nézetet módosítja.',
  'help.guide.map-compass.tip.1':
    'Az iránytű csak a MapLibre GL és a Mapbox GL térképen van; a Leaflet térkép nem forgatható, ezért ott nincs iránytű. A Beállítások „Térkép” részében a „Térkép szolgáltató” határozza meg, melyik térképet használod, a „Térkép mentése” pedig elmenti a választást.',
  'help.guide.map-compass.tip.2':
    'A kattintás a döntést is megszünteti. A nézetet a jobb egérgombbal felfelé vagy lefelé húzva döntheted meg, a „Reset north” pedig vízszintesre állítja, és a forgatást is visszaállítja. Mapbox GL esetén, bekapcsolt „3D épületek és terep” mellett a 3D nézetet is laposra állítja, amíg újra meg nem döntöd.',

  // ── Screen: trip-collab ───────────────────────────────────────────────────────────────
  'help.ctx.trip-collab.title': 'Együttműködés',
  'help.ctx.trip-collab.summary':
    'Ezen a fülön tervez együtt a csoport, öt kártyán: balra a csevegés, mellette a „Jegyzetek” és a „Linkek”, alattuk a „Szavazások” és a „Mi következik”. Minden, amit itt írtok, azonnal megjelenik a többi tag képernyőjén, újratöltés nélkül.',
  'help.ctx.trip-collab.bullet.1':
    'A csevegés a bal oldali kártya. Írj az „Üzenet írása...” mezőbe, és nyomj Entert; Shift+Enterrel új sort kezdhetsz. A mosolygós ikonnal emojit szúrhatsz be, a „Képek csatolása” pedig legfeljebb négy képet csatol az üzenethez.',
  'help.ctx.trip-collab.bullet.2':
    'Ha egy üzenet fölé viszed az egeret, megjelenik a „Válasz”, a saját üzeneteidnél a „Törlés” is; jobb kattintással a nyolc gyorsreakció érhető el. A törölt üzenet helyén egy megjegyzés jelzi, ki törölte.',
  'help.ctx.trip-collab.bullet.3':
    'A „Jegyzetek” a közös jegyzetfelület: a fejlécében az „Új jegyzet” gombbal hozhatsz létre jegyzetet, a mellette lévő fogaskerék pedig a „Kategóriák kezelése” ablakot nyitja meg a nevekhez és színekhez. Ha vannak kategóriák, a fejléc alatti gombsor szűri a kártyákat: „Mind” vagy egy kategória. A jegyzetkártyán a kategória színes pontként, a link kerek gombként látszik, a három pontos menüben („További lehetőségek”) pedig a „Kibontás”, a „Kitűzés”, a „Szerkesztés” és a „Törlés” található.',
  'help.ctx.trip-collab.bullet.4':
    'A „Linkek” az utazáshoz tartozó webcímeket gyűjti. A „Link hozzáadása” egy címet és egy http vagy https kezdetű webcímet kér. A „Link szerkesztése”, a „Link rögzítése” és a „Link törlése” a címke végén található, a rögzített linkek pedig elöl maradnak.',
  'help.ctx.trip-collab.bullet.5':
    'Szavazással közösen dönthettek. Az „Új szavazás” egy kérdést tesz fel legalább két opcióval. Egy opcióra kattintva szavazhatsz rá. A szavazás fejlécének jobb oldalán lévő lakattal („Lezárás”) lezárhatod a szavazást, a kukával („Törlés”) pedig törölheted.',
  'help.ctx.trip-collab.bullet.6':
    'A „Mi következik” az utazás még előtted álló megállóit sorolja fel, legfeljebb nyolcat, az időpontjaikkal és a résztvevőikkel. Csak a napi tervből olvas; az időpontokat ott állíthatod be.',
  // write-note
  'help.guide.write-note.title': 'Közös jegyzet írása',
  'help.guide.write-note.goal':
    'Tedd mindenki számára elérhetővé, amire az egész csoportnak szüksége van, például egy szabályt, egy címet vagy egy emlékeztetőt.',
  'help.guide.write-note.step.1':
    'Kattints a „Jegyzetek” kártya fejlécében az „Új jegyzet” gombra. Megnyílik a jegyzetablak, a kurzor már a cím mezőben áll.',
  'help.guide.write-note.step.2':
    'Írd be a címet az ablak tetején, ahol a „Jegyzet címe” felirat áll. Ez az egyetlen kötelező mező: a „Létrehozás” addig szürke marad, amíg nincs cím, és ha a cím mezőben Entert nyomsz, a jegyzet azonnal létrejön.',
  'help.guide.write-note.step.3':
    'A „Tartalom” mezőbe kerül a szöveg, és Markdown is használható: félkövér szó, lista, címsor. A kártya az első három sort mutatja, a menüjében lévő „Kibontás” pedig megnyitja a teljes jegyzetet.',
  'help.guide.write-note.step.4':
    'A „Kategória” alatt válaszd ki, melyikbe tartozik a jegyzet. A színe most az ablak fejlécén, később a kártya fejlécén jelenik meg. Az első kategória már ki van választva. A gombok a már létező kategóriák, újat a „Kategóriák kezelése” részben hozhatsz létre. Amíg az utazásnak nincs kategóriája, ez a sor nem jelenik meg.',
  'help.guide.write-note.step.5':
    'A „Weboldal” mezőbe a jegyzethez tartozó linket írhatod. A kártya tetején ekkor megjelenik egy kerek link gomb, amely megnyitja.',
  'help.guide.write-note.step.6':
    'Kattints a „Létrehozás” gombra. Az ablakot csak a „Mégse” gomb és az x zárja be, így ha mellé kattintasz, vagy megnyomod az Esc billentyűt, nem vész el, amit írtál.',
  'help.guide.write-note.result':
    'A jegyzet kártyaként jelenik meg a „Jegyzetek” panelen, a teteje a kategória színét kapja, és a többi tag azonnal látja.',
  'help.guide.write-note.tip.1':
    'A kártyán lévő három pont („További lehetőségek”) a „Kibontás”, a „Kitűzés”, a „Szerkesztés” és a „Törlés” lehetőséget kínálja. A „Kitűzés” a panel tetején tartja a jegyzetet a színének megfelelő kerettel. A többi jegyzet az utolsó módosítás ideje szerint rendeződik.',
  'help.guide.write-note.tip.2':
    'Az „Új jegyzet” melletti fogaskerék a „Kategóriák kezelése” ablakot nyitja meg. Itt színt adhatsz egy kategóriának, egyszerre mindenhol átnevezheted, vagy létrehozhatod, mielőtt bármelyik jegyzet használná. Semmi sem változik, amíg a „Mentés” gombra nem kattintasz.',
  'help.guide.write-note.tip.3':
    'Ha tölthetsz fel fájlokat az utazáshoz, a „Fájlok csatolása” dokumentumot ad a jegyzethez. A „Csatolás” megnyitja a fájlválasztót, de képet vagy PDF-et be is illeszthetsz az ablakba.',
  'help.guide.write-note.tip.4':
    'A „Jegyzetek” saját kapcsolóval rendelkezik a „Bővítmények” alatt, az „Együttműködés” alatt: az adminisztrátor kikapcsolhatja, miközben a csevegés, a linkek, a szavazások és a „Mi következik” tovább működnek.',
  // shared-links
  'help.guide.shared-links.title': 'Az utazás linkjeinek összegyűjtése',
  'help.guide.shared-links.goal':
    'Tartsd egy helyen a foglalási oldalt, a közös albumot és a menetrendet, hogy ne a csevegésben kelljen keresgélned őket.',
  'help.guide.shared-links.step.1':
    'Kattints a „Linkek” kártya fejlécében a „Link hozzáadása” gombra. Megnyílik az ablak, a kurzor a felső mezőben áll.',
  'help.guide.shared-links.step.2':
    'Írd be a nevet a „Link címe” mezőbe, illeszd be a címet az alatta lévő „Hivatkozás” mezőbe, majd kattints a „Link mentése” gombra.',
  'help.guide.shared-links.step.3':
    'A címkén a név és a hivatkozott weboldal látszik. Kattints rá, hogy új lapon megnyisd az oldalt.',
  'help.guide.shared-links.step.4':
    'A végén lévő három kerek gomb: „Link szerkesztése”, „Link rögzítése” és „Link törlése”. A „Link rögzítése” a panel elejére helyezi a címkét, és kiemelőszínnel jeleníti meg. A „Link törlése” előbb megerősítést kér, mert a link minden tagnál törlődik.',
  'help.guide.shared-links.result':
    'A link címkeként jelenik meg a „Linkek” panelen, elöl rögzítve, és azonnal megjelenik minden tag képernyőjén.',
  'help.guide.shared-links.tip.1':
    'Csak http vagy https kezdetű cím adható meg. Minden mást elutasít, és az ablak nyitva marad azzal, amit beírtál.',
  'help.guide.shared-links.tip.2':
    'Elöl a rögzített linkek állnak, utánuk a legújabbak. A cím melletti kis ikon az oldal saját faviconja, amelyet magáról az oldalról töltünk be, így internetkapcsolat nélkül helyette egy egyszerű link ikon látszik a címkén.',
  'help.guide.shared-links.tip.3':
    'A „Linkek” saját kapcsolóval rendelkezik a „Bővítmények” alatt, az „Együttműködés” alatt, így a rendszergazda kikapcsolhatja a panelt a fül többi része nélkül.',
  // create-poll
  'help.guide.create-poll.title': 'Kérdés a csoportnak',
  'help.guide.create-poll.goal':
    'Ha a csevegésben senki sem válaszol egy kérdésre, csinálj belőle szavazást, amelyen mindenki voksolhat.',
  'help.guide.create-poll.step.1':
    'Kattints a „Szavazások” kártya fejlécében az „Új szavazás” gombra. Megnyílik az ablak.',
  'help.guide.create-poll.step.2':
    'Írd be a kérdést a „Kérdés” mezőbe. A mező alatti „Markdown támogatott” felirat azt jelenti, hogy félkövér szöveget, sortörést vagy rövid listát is használhatsz.',
  'help.guide.create-poll.step.3':
    'Az „Opciók” alatt töltsd ki az „1. opció” és a „2. opció” mezőt. Legalább két nem üres opcióra van szükség, és egy opció több soros is lehet.',
  'help.guide.create-poll.step.4':
    'Az alattuk lévő „Opció hozzáadása” gombbal harmadik, negyedik, vagy annyi opciót adhatsz hozzá, amennyi kell. A sor melletti kis X, amely kettőnél több opció esetén jelenik meg, eltávolítja az adott opciót.',
  'help.guide.create-poll.step.5':
    'A „Többszörös választás” lehetővé teszi, hogy mindenki több lehetőséget is bejelöljön. Ha ki van kapcsolva, és valaki másik lehetőséget választ, a szavazata átkerül az újra.',
  'help.guide.create-poll.step.6': 'Kattints a „Szavazás létrehozása” gombra.',
  'help.guide.create-poll.result':
    'A szavazás a „Szavazások” panel tetején jelenik meg, nyitott állapotban, a fejlécében 0 szavazattal.',
  'help.guide.create-poll.tip.1': 'A kérdés Markdownként jelenik meg, a válaszlehetőségek egyszerű szövegként.',
  'help.guide.create-poll.tip.2':
    'A „Szavazás létrehozása” addig szürke marad, amíg nincs kérdés és legalább két kitöltött válaszlehetőség.',
  'help.guide.create-poll.tip.3':
    'Határidőt csak a telefonos alkalmazásban állíthatsz be. A határidős szavazás fejlécében egy borostyánsárga címke mutatja a hátralévő időt, és amint lejár az idő, a szavazás lezárul.',
  'help.guide.create-poll.tip.4':
    'A „Szavazások” saját kapcsolóval rendelkezik a „Bővítmények” alatt, az „Együttműködés” alatt: az adminisztrátor kikapcsolhatja, a másik négy panelt pedig bekapcsolva hagyhatja.',
  // vote-poll
  'help.guide.vote-poll.title': 'Szavazás és az eredmény megtekintése',
  'help.guide.vote-poll.goal': 'Szavazz, nézd meg a csoport eredményeit, és ha kell, módosítsd a szavazatodat.',
  'help.guide.vote-poll.step.1':
    'Kattints a választott lehetőségre. A körében pipa jelenik meg, a lehetőség kiemelőszínű keretet kap, a mögötte lévő sáv pedig megnő.',
  'help.guide.vote-poll.step.2':
    'Most már a teljes eredményt látod: a sáv az arányt mutatja, jobbra a százalék áll, a kis körök pedig azokat jelölik, akik ezt a lehetőséget választották, legfeljebb hármat.',
  'help.guide.vote-poll.step.3':
    'Meggondoltad magad? Kattints egy másik lehetőségre. „Többszörös választás” nélküli szavazásnál a szavazatod átkerül az új lehetőségre, nem adsz le egy másodikat.',
  'help.guide.vote-poll.step.4':
    'A szavazatok száma a kérdés alatti címkén látható. Ha arra az opcióra kattintasz, amelyet már választottál, visszavonod a szavazatodat, és a szám csökken.',
  'help.guide.vote-poll.result':
    'A választott opciód pipát kap, a sávok mutatják, hogyan szavazott a csoport, a körök pedig azt, ki melyik opciót választotta.',
  'help.guide.vote-poll.tip.1':
    'A százalékok és az, hogy ki mire szavazott, csak akkor jelenik meg, ha már te is szavaztál, vagy ha a szavazás lezárult. A fejlécben lévő szavazatszámot mindenki látja.',
  'help.guide.vote-poll.tip.2':
    'A szavazás sosem névtelen: ha egy lehetőségnél az egyik kör fölé viszed az egeret, látod, ki szavazott.',
  // close-poll
  'help.guide.close-poll.title': 'Szavazás lezárása vagy törlése',
  'help.guide.close-poll.goal':
    'Zárd le a szavazást, ha a csoport döntött, és töröld azt, amelyre már senkinek sincs szüksége.',
  'help.guide.close-poll.step.1':
    'A „Lezárás”, a szavazás fejlécének jobb oldalán lévő lakat, befejezi a szavazást. Ezután már nem lehet a lehetőségekre kattintani.',
  'help.guide.close-poll.step.2':
    'A lezárt szavazás a panel aljára kerül, és ha fölötte nyitott szavazások vannak, egy „Lezárva” címsor alá. „Lezárva” címkét kap, és mindenkinek megmutatja az eredményt, akár szavazott, akár nem. A nyertes lehetőség félkövéren, zöld sávon látszik; ha te is erre szavaztál, a sáv a kiemelőszínedet kapja.',
  'help.guide.close-poll.step.3':
    'A fejléc jobb oldalán lévő kukával, a „Törlés” gombbal törölheted a szavazást. Lezárt szavazásnál ez az egyetlen gomb, mert a lakat már nincs ott. Nincs megerősítés, és a szavazatok is törlődnek.',
  'help.guide.close-poll.result':
    'A törölt szavazás minden tag paneljéről eltűnik. A csak lezárt szavazás az eredményével együtt alul látható marad.',
  'help.guide.close-poll.tip.1':
    'A lezárás nem vonható vissza: újranyitás nincs. A véletlenül lezárt szavazást újra ki kell írni.',
  'help.guide.close-poll.tip.2':
    'A „Törlés” mindenkinél azonnal, megerősítés nélkül törli a szavazást az összes szavazattal együtt.',
  // whats-next
  'help.guide.whats-next.title': 'A „Mi következik” panel használata',
  'help.guide.whats-next.goal': 'Nézd meg, mi a csoport következő programja, a terv megnyitása nélkül.',
  'help.guide.whats-next.step.1':
    'A kártya az utazás következő megállóit sorolja fel, legfeljebb nyolcat, időrendben, naponként egy címsor alatt: „Ma”, „Holnap” vagy a dátum, mellette a nap címével, ha van. A fejlécben látszik, hány megálló van.',
  'help.guide.whats-next.step.2':
    'Minden megálló bal oldalán az időpontja látható: a kezdés, „-ig”, és ha van, a befejezés, vagy TBD, ha még nincs megadva időpont.',
  'help.guide.whats-next.step.3':
    'Mellette a név, a cím, valamint címkeként a megállón részt vevő személyek láthatók. Ha senki sincs a megállóhoz rendelve, az utazás összes tagja megjelenik.',
  'help.guide.whats-next.result':
    'A következő programok listája, csak olvasásra: a tervet követi, és itt semmit sem módosít.',
  'help.guide.whats-next.tip.1':
    'Itt nincs mit beállítanod. Az időpontok a napi tervből származnak; ha ott módosítod őket, ez a lista azonnal frissül.',
  'help.guide.whats-next.tip.2':
    'Csak az jelenik meg, ami még hátravan: egy megálló lekerül a listáról, ha a kezdési ideje elmúlt, a mai, időpont nélküli megálló a nap végéig marad, az utazás végén pedig a panel üres.',
  'help.guide.whats-next.tip.3':
    'A „Mi következik” saját kapcsolóval rendelkezik a „Bővítmények” alatt, az „Együttműködés” alatt. Ez asztali panel: a telefonos alkalmazás „Együttműködés” fülén nem jelenik meg.',
  // trip-chat
  'help.guide.trip-chat.title': 'Beszélgetés a csoporttal',
  'help.guide.trip-chat.goal':
    'Küldj üzenetet, válaszolj egy adott üzenetre, reagálj egy másik üzenetre, és töröld a saját üzenetedet.',
  'help.guide.trip-chat.step.1':
    'Írj az „Üzenet írása...” mezőbe, és nyomj Entert. A mező melletti kerek nyíl ugyanezt teszi. Shift+Enterrel új sort kezdhetsz.',
  'help.guide.trip-chat.step.2':
    'A mosolygó arc megnyitja az emodzsiválasztót, benne a „Smileys”, a „Reactions” és a „Travel” résszel. A kiválasztott emodzsi bekerül az épp írt szövegbe, önmagában nem küldődik el.',
  'help.guide.trip-chat.step.3':
    'Vidd az egeret valaki más üzenete fölé: a sarkában megjelenik egy kis kerek gomb. Ez a „Válasz”.',
  'help.guide.trip-chat.step.4':
    'Az üzenet, amelyre válaszolsz, idézetként jelenik meg a mező fölött. Írd meg és küldd el az üzeneted, az idézet is vele megy. Az idézet eltávolításához kattints a rajta lévő keresztre.',
  'help.guide.trip-chat.step.5':
    'Kattints jobb gombbal egy üzenetre, hogy megjelenjen a nyolc gyorsreakció. A reakciód az üzenet alatt jelenik meg. Ha ugyanarra a reakcióra újra kattintasz, eltávolítod.',
  'help.guide.trip-chat.step.6':
    'A saját üzeneteidnél a „Válasz” mellett a „Törlés” gomb (kuka ikon) is megjelenik. Ez azonnal törli az üzenetet, és egy megjegyzés jelzi, hogy te törölted. Ez nem vonható vissza.',
  'help.guide.trip-chat.result':
    'A válaszod a legújabb üzenet, a tetején az idézett üzenettel. A reakciód a másik üzenet alatt jelenik meg. A törölt üzeneted helyén egy megjegyzés jelzi, hogy te törölted.',
  'help.guide.trip-chat.tip.1':
    'Az Enter elküldi az üzenetet, a Shift+Enter új sort kezd. Az egy-három emodzsiból álló üzenetek nagy méretben jelennek meg.',
  'help.guide.trip-chat.tip.2':
    'A „Képek csatolása” gombbal egy üzenethez legfeljebb négy képet adhatsz hozzá. Be is illesztheted őket, vagy ráhúzhatod a mezőre.',
  'help.guide.trip-chat.tip.3':
    'A linket tartalmazó üzenet alatt előnézeti kártya jelenik meg, amelyet a saját TREK-ed tölt le, így ha a link olyasmire mutat, amit csak te érsz el, egyszerű link marad.',
  'help.guide.trip-chat.tip.4':
    'A Chatnek saját kapcsolója van a „Bővítmények” alatt, az „Együttműködés” alatt: az adminisztrátor kikapcsolhatja, a jegyzetek, a linkek, a szavazások és a „Mi következik” pedig közben bekapcsolva maradhatnak.',

  // ── Screen: trip-lists ────────────────────────────────────────────────────────────────
  'help.ctx.trip-lists.title': 'Listák',
  'help.ctx.trip-lists.summary':
    'Két lista egy utazáshoz: a csomagolási lista, amelyen látszik, ki mit visz és mennyi a súlya, valamint a teendőlista mindarról, amit az utazás előtt és alatt el kell intézni. A fül akkor jelenik meg, ha a „Listák” bővítmény be van kapcsolva.',
  'help.ctx.trip-lists.bullet.1':
    'A felső sávban a „Csomagolási lista” és a „Teendők” között válthatsz, és mindkettőnél látod a tételek számát; a sáv jobb szélén lévő gombok mindig az éppen megnyitotthoz tartoznak.',
  'help.ctx.trip-lists.bullet.2':
    'A csomagolási lista kisebb listákra oszlik, például „Dokumentumok” vagy „Ruházat”, tetszőleges névvel. Minden lista egy kártya. A fejlécében van egy fogantyú, amellyel az egész listát máshová húzhatod, egy színes pont, egy „becsomagolt/összes” jelvény, egy három pontos menü az „Átnevezés”, az „Összes kipipálása”, az „Összes jelölés törlése” és a „Lista törlése” lehetőséggel, valamint egy nyíl, amellyel összecsukhatod a kártyát. A fenti sávban a „Lista hozzáadása” gombbal hozhatsz létre újat.',
  'help.ctx.trip-lists.bullet.3':
    'Egy sorban van egy fogantyú, egy jelölőnégyzet és egy név, utána annak a kis avatárja, aki a tételt hozza. Az egynél nagyobb mennyiségű tételeknél egy csomagolásszámláló is megjelenik, például 3/10, mínusz és plusz gombbal. Ezt követi a mennyiség kis jelvényként, és ha a „Poggyászkövetés” be van kapcsolva, a súly grammban és egy táskakör, végül a kuka és egy három pontos menü az „Áthelyezés listába”, „Megosztás”, „Átnevezés” és „Törlés” lehetőséggel. A sorban nem használt vezérlők halványak, amíg föléjük nem viszed az egeret.',
  'help.ctx.trip-lists.bullet.4':
    'A „Megosztott” és a „Saját lista” két részre osztja a csomagolási listát: a mindenki által látott közös listára és a sajátodra. A mellettük lévő „Mind”, „Nyitott” és „Kész” az éppen megnyitottat szűri. A sor végén lévő „A-tól Z-ig” név szerint rendezi az egyes listák tételeit, egy újabb kattintással pedig visszatér a saját sorrendedhez. A fenti haladáskártya mutatja, mennyi van már becsomagolva.',
  'help.ctx.trip-lists.bullet.5':
    'A „Sablon alkalmazása” és a „Mentés sablonként” kitölti vagy elmenti a listát, így nem kell begépelned. Az utánuk következő két ikon, az „Exportálás” és az „Importálás”, nyomtatható formában, PDF-ként vagy fájlként exportálja a listát, illetve importál egyet. A haladáskártya jobb végén lévő piros gomb mutatja, hány tétel van kipipálva, és eltávolítja őket.',
  'help.ctx.trip-lists.bullet.6':
    'A „Teendők” saját oldalsávval rendelkezik: itt van a haladáskártya, a „Mind”, „Saját feladataim”, „Lejárt” és „Kész” szűrő, listánként egy sor, alattuk pedig a „Lista hozzáadása”. A feladatok egy kártyán jelennek meg, amelynek fejlécében a szűrő neve és a rendezés („Prioritás” vagy „Határidő”) látszik. Egy feladatra kattintva a jobb oldali panelen nyílik meg. A sávban lévő „Új feladat” az „Új feladat” ablakot nyitja meg.',
  // packing-categories
  'help.guide.packing-categories.title': 'A csomaglista összeállítása',
  'help.guide.packing-categories.goal':
    'Rendezd listákba, amit viszel, adj hozzájuk tételeket, és döntsd el, ki felel az egyes listákért.',
  'help.guide.packing-categories.step.1':
    'Kattints a listák fölötti sávban a „Lista hozzáadása” gombra. Megnyílik egy kis ablak. Írd be a nevet a felső sávba, ahol a „Lista neve (pl. Ruházat)” felirat áll, majd kattints a „Hozzáadás” gombra.',
  'help.guide.packing-categories.step.2':
    'Az új lista egy helykitöltő sorral indul, amelyben csak három halvány pont látszik. Kattints a sor alján a „Tétel hozzáadása” gombra, írd be a tételt a „Tétel neve...” mezőbe, és nyomj Entert: az első tétel a helykitöltő helyére kerül, a mező pedig nyitva marad a következőhöz.',
  'help.guide.packing-categories.step.3':
    'Egy sort a nevére kattintva, vagy a jobb szélén lévő három pont „Átnevezés” parancsával nevezhetsz át.',
  'help.guide.packing-categories.step.4':
    'A lista felső sávjában lévő, személyt ábrázoló szaggatott körrel utazási tagokat rendelhetsz a listához. Válassz egy nevet. Ha újra el akarod távolítani az illetőt, kattints a megjelenő címkére.',
  'help.guide.packing-categories.step.5':
    'A számláló melletti három pont további lehetőségeket kínál: „Átnevezés”, „Összes kipipálása”, „Összes jelölés törlése” és „Lista törlése”. A „Lista törlése” további kérdés nélkül törli a listát az összes tételével együtt. A jobb szélen lévő nyíllal összecsukhatod a listát.',
  'help.guide.packing-categories.result':
    'Az új lista megjelenik a rácsban a tételeivel és a színes pontjával, a jelvénye pedig számolja, mi van már becsomagolva.',
  'help.guide.packing-categories.tip.1':
    'Egy lista csak a tételei révén létezik. Ha törlöd az utolsó tételt, a sor helykitöltővé válik, így a lista megtartja a helyét és a színét; ha ezt a sort is törlöd, a lista törlődik.',
  'help.guide.packing-categories.tip.2':
    'Ha valakit hozzárendelsz egy listához, csomagolási értesítést kap. Ez nem befolyásolja, ki látja a tételeket: ezt a sor hárompontos menüjében, a „Megosztás” alatt állíthatod be.',
  'help.guide.packing-categories.tip.3':
    'Két listának lehet ugyanaz a neve. A TREK a háttérben megkülönbözteti őket, így a nevek pontosan úgy maradnak, ahogy beírtad.',
  // check-off-packing
  'help.guide.check-off-packing.title': 'Kipipálás csomagolás közben',
  'help.guide.check-off-packing.goal':
    'Jelöld be, mi van már a táskában, kövesd a folyamatjelzőt, és távolítsd el a bepakolt tételeket.',
  'help.guide.check-off-packing.step.1':
    'Kattints a sor bal oldalán lévő négyzetre. A név áthúzottá válik, és a folyamatjelző frissül.',
  'help.guide.check-off-packing.step.2':
    'A listák fölötti haladáskártya mutatja, hogy a lista összes tételéből mennyi van már becsomagolva: számként, százalékban és sávként.',
  'help.guide.check-off-packing.step.3':
    'Egy teljes lista egyszerre is kipipálható: a fejlécében lévő hárompontos menüben megtalálod az „Összes kipipálása” és az „Összes jelölés törlése” lehetőséget.',
  'help.guide.check-off-packing.step.4':
    'A „Megosztott” és a „Saját lista” melletti „Mind”, „Nyitott” és „Kész” szűri a rácsot. A „Nyitott” csak azt mutatja, ami még hiányzik, így a teljesen becsomagolt listák eltűnnek.',
  'help.guide.check-off-packing.step.5':
    'A haladáskártya jobb szélén lévő piros „Eltávolítás … kipipálva” gomb, benne a kipipált tételek számával, a böngésző egyetlen megerősítő kérdése után egyszerre törli az összeset.',
  'help.guide.check-off-packing.result':
    'Csak a nyitott tételek jelennek meg, a fenti sáv pedig mutatja, hol tartasz a csomagolással.',
  'help.guide.check-off-packing.tip.1': 'A kipipált tétel is átnevezhető: kattints a nevére.',
  'help.guide.check-off-packing.tip.2':
    'Az „Összes kipipálása” és az „Összes jelölés törlése” egyszerre egy listára vonatkozik, és az adott lista saját hárompontos menüjéből érhető el.',
  'help.guide.check-off-packing.tip.3':
    'Ha minden tétel ki van pipálva, a számláló helyén a „Minden be van csomagolva!” felirat jelenik meg, és a sáv zöldre vált.',
  // apply-packing-template
  'help.guide.apply-packing-template.title': 'Csomagolási sablon alkalmazása',
  'help.guide.apply-packing-template.goal':
    'Adj egy kész listát az utazáshoz, és mentsd el ennek az utazásnak a listáját a következőre.',
  'help.guide.apply-packing-template.step.1': 'Kattints a lista fölötti sávban a „Sablon alkalmazása” gombra.',
  'help.guide.apply-packing-template.step.2':
    'Válassz egy sablont. Minden sorban látszik a sablon neve és a benne lévő tételek száma.',
  'help.guide.apply-packing-template.step.3':
    'A tételek abba a nézetbe kerülnek, amelyben éppen vagy: a „Megosztott” a mindenki által látott közös listára, a „Saját lista” a saját listádra teszi őket.',
  'help.guide.apply-packing-template.step.4':
    'Ha ennek az utazásnak a listáját a következő útra is meg akarod tartani, kattints a „Mentés sablonként” gombra. Megnyílik egy kis ablak. Írj be egy nevet a felső mezőbe, ahol a „Sablon neve” felirat látszik, és kattints a „Mentés” gombra.',
  'help.guide.apply-packing-template.result': 'A sablon listái és tételei bekerülnek az utazásba a már meglévők mellé.',
  'help.guide.apply-packing-template.tip.1':
    'A sablon minden tételnél átmásolja a listát, a mennyiséget, a súlyt és a táskát, és létrehozza azokat a táskákat, amelyek még nincsenek meg az utazásban. A pipák nem másolódnak át, és a listán már szereplő tételek közül semmi sem törlődik.',
  'help.guide.apply-packing-template.tip.2':
    'A „Sablon alkalmazása” csak akkor érhető el, ha már létezik sablon. Sablon nélkül a gomb meg sem jelenik.',
  'help.guide.apply-packing-template.tip.3':
    'A „Mentés sablonként” csak a példány adminisztrátorainak jelenik meg, és csak akkor, ha a listában vannak tételek. A megosztott tételeket és a saját tételeidet menti, egy másik tag privát tételeit soha.',
  // import-packing-list
  'help.guide.import-packing-list.title': 'Teljes csomagolási lista beillesztése',
  'help.guide.import-packing-list.goal':
    'Egy máshol már meglévő listádat egy lépésben alakíthatod csomagolási tételekké.',
  'help.guide.import-packing-list.step.1':
    'Kattints a lista fölötti sáv jobb szélén lévő, lefelé mutató nyilas ikonra („Importálás”).',
  'help.guide.import-packing-list.step.2':
    'Soronként egy tétel: Kategória, Név, Súly g-ban (nem kötelező), Táska (nem kötelező), checked/unchecked (nem kötelező). A mezőben látható szürke minta mind a négy formátumot mutatja, a bal szélén lévő számok pedig a begépelt sorokat számolják. Markdown-lista is használható: a címsor adja a lista nevét, a "- [ ]" és a "- [x]" sorokból pedig tételek lesznek.',
  'help.guide.import-packing-list.step.3':
    'Vagy töltsd be a sorokat fájlból az ablak bal alsó sarkában lévő „CSV/TXT/MD betöltése” gombbal. Egy .csv, .txt vagy .md fájlt választhatsz, és a tartalma felülírja a mezőben lévő szöveget.',
  'help.guide.import-packing-list.step.4':
    'Kattints a jobb alsó „3 importálása” gombra; a rajta lévő szám azt mutatja, hány sort értelmezett a TREK.',
  'help.guide.import-packing-list.result':
    'Minden sorból egy tétel lesz abban a listában, amelyet az első mezője megnevez. A már meglévő tételek nem változnak.',
  'help.guide.import-packing-list.tip.1':
    'A mezőket vessző, pontosvessző vagy tabulátor is elválaszthatja, az idézőjelek pedig egyben tartják a mezőt, így a "Shirt, blue" egyetlen név marad. Az egyetlen értéket tartalmazó sor csak egy név. A saját lista nélküli sor az „Egyéb” listába kerül. A név előtti "3x" a mennyiséget adja meg.',
  'help.guide.import-packing-list.tip.2':
    'Ha a negyedik mezőben megadott táska még nem létezik az utazásban, a TREK létrehozja. Az „Importálás” és a „Sablon alkalmazása” a két módja annak, hogy egyszerre sok tételhez adj súlyt és táskát.',
  // export-packing-list
  'help.guide.export-packing-list.title': 'A csomagolási lista nyomtatása vagy exportálása',
  'help.guide.export-packing-list.goal':
    'Nyomtasd ki a listát, mentsd PDF-ként, vagy exportáld fájlként egy másik alkalmazásba vagy a következő utazáshoz.',
  'help.guide.export-packing-list.step.1':
    'Kattints az „Exportálás” ikonra, a felfelé mutató nyílra a lista fölötti sávban, közvetlenül az „Importálás” előtt.',
  'help.guide.export-packing-list.step.2':
    'A „Markdown ellenőrzőlista (.md)” és a „CSV importáláshoz (.csv)” azonnal fájlba menti a listát.',
  'help.guide.export-packing-list.step.3':
    'Kattints a „Nyomtatás vagy mentés PDF-ként” lehetőségre. Az előnézet oldalként mutatja a listát: felül az utazás, a dátumai és a csomagolás állása, alatta minden lista kártyaként, minden tétel mellett egy kipipálható négyzettel.',
  'help.guide.export-packing-list.step.4':
    'Kattints az előnézet alatt a „Nyomtatás vagy mentés PDF-ként” gombra. A böngésző megnyitja a nyomtatási ablakot: válassz nyomtatót, vagy fájl mentéséhez a „Mentés PDF-ként” lehetőséget.',
  'help.guide.export-packing-list.result':
    'A nyomtatás és a fájlok a megnyitott nézetet tartalmazzák („Megosztott” vagy „Saját lista”), a mennyiségekkel, a súlyokkal és a pipákkal együtt.',
  'help.guide.export-packing-list.tip.1':
    'A CSV az a formátum, amelyet az „Importálás” beolvas, a táskákkal együtt, így saját csomagolási sablonként is használhatod: importáld a következő utazásba.',
  'help.guide.export-packing-list.tip.2':
    'A Markdown-fájl ellenőrzőlistaként nyílik meg az Obsidianban, a Notionban vagy a GitHubon, és az „Importálás” gombbal újra be is töltheted.',
  // share-packing-item
  'help.guide.share-packing-item.title': 'Ki látja a tételt, és ki hozza',
  'help.guide.share-packing-item.goal':
    'Helyezz át egy tételt a csoport közös listája, a saját listád és azok között, akiknek viszed.',
  'help.guide.share-packing-item.step.1':
    'A listák fölött a „Megosztott” az a lista, amelyet mindenki lát, a „Saját lista” pedig a tiéd. Mindkettőnél látszik a tételek száma. A sajátod megtekintéséhez kattints a „Saját lista” elemre.',
  'help.guide.share-packing-item.step.2':
    'A „Megosztott” nézetben nyisd meg egy sor végén a három pontot, és kattints a „Megosztás” lehetőségre.',
  'help.guide.share-packing-item.step.3':
    'Három szint közül választhatsz: „Megosztott”, ezt a csoportban mindenki látja; „Személyes”, ezt csak te látod; és „Megosztás vele…”, ahol kiválasztod, kiknek szól a tétel.',
  'help.guide.share-packing-item.step.4':
    'A „Személyes” tétel csak a „Saját lista” nézetben szerepel. Válts a „Saját lista” nézetre, hogy megtaláld.',
  'help.guide.share-packing-item.step.5':
    'Nyisd meg újra a „Megosztás” menüt, és a „Megosztás vele…” alatt jelölj be egy nevet. A tétel annak a személynek a listáján is megjelenik, a sorban pedig egy kis jelvény mutatja, hány emberrel van megosztva.',
  'help.guide.share-packing-item.result': 'A tétel a választott szintre kerül, a sorban pedig látszik, ki hozza.',
  'help.guide.share-packing-item.tip.1':
    'Egy tétel megosztását csak az módosíthatja, aki hozza. Akivel megosztottad, a saját „Saját lista” nézetében látja egy kis kéz jelvénnyel, amely fölé víve az egeret a neved jelenik meg. Ő is kipipálhatja.',
  'help.guide.share-packing-item.tip.2':
    'Ha egy megosztott tételt más hoz, a hárompontos menüben a „Megosztás” helyett két másik lehetőség jelenik meg: az „Én is tudom hozni” téged is felvesz mellé, a „Másolás a listámra” pedig saját, privát másolatot készít.',
  'help.guide.share-packing-item.tip.3':
    'Az új tételek megosztása attól a nézettől függ, amelyben hozzáadod őket. A „Megosztott” nézetben hozzáadott tételek mindenkivel meg vannak osztva. A „Saját lista” nézetben hozzáadottak „Személyes” jelölést kapnak, kivéve ha a lista összes tétele ugyanazokkal az emberekkel van megosztva: ilyenkor az új tétel is meg lesz osztva velük.',
  // packing-bags
  'help.guide.packing-bags.title': 'A táskák lemérése',
  'help.guide.packing-bags.goal':
    'Adj meg minden tételhez súlyt, oszd szét a tételeket táskákba, és tartsd minden táska súlyát a légitársaság korlátja alatt.',
  'help.guide.packing-bags.step.1': 'Kattints a kör előtti súlyjelvényre, és add meg a tétel súlyát grammban.',
  'help.guide.packing-bags.step.2': 'A súly utáni kör a tétel táskája. Kattints rá.',
  'help.guide.packing-bags.step.3':
    'Ha még nincs táska, kattints a „Táska hozzáadása” gombra, írj be egy nevet, és nyomj Entert. A táska létrejön, és a tétel bele is kerül.',
  'help.guide.packing-bags.step.4':
    'Amint létrejön egy táska, a listák jobb oldalán megjelenik a „Táskák” kártya. Minden táskánál látod a nevét, azt, hogy ki viszi, egy telítettségi sávot, a benne lévő tételek számát és a súlyát. A táskák alatt a „Nincs hozzárendelve” és az „Összsúly” következik, alatta a „Becsomagolva”: a már becsomagolt súly és egy vékony sáv az arányával.',
  'help.guide.packing-bags.step.5':
    'Kattints a táska súlya melletti „Korlát beállítása” gombra, és add meg a súlyhatárt kilogrammban, ahogy a légitársaságok is megadják.',
  'help.guide.packing-bags.step.6':
    'A táska nevét tartalmazó sor végén, közvetlenül az x előtt lévő szaggatott plusz megnyitja a „Tagok hozzárendelése” ablakot. Jelöld be, kik viszik a táskát: megjelennek a plusz mellett, a kártya alján pedig a „Személyenként” rész felsorolja, ki mit visz.',
  'help.guide.packing-bags.result':
    'A jobb oldali „Táskák” kártyán látod az egyes táskák súlyát a korláthoz képest, azt, ami egyik táskában sincs, hogy ki mit visz, és az összsúlyt azzal együtt, hogy mennyi van már becsomagolva.',
  'help.guide.packing-bags.tip.1':
    'A súlymező, a táskakör és a „Táskák” kártya csak akkor érhető el, ha egy adminisztrátor a „Listák” bővítmény alatt bekapcsolta a „Poggyászkövetés” funkciót. Keskenyebb ablakban a táskákat ehelyett a haladáskártya fölötti „Táskák” gombbal nyithatod meg.',
  'help.guide.packing-bags.tip.2':
    'A táska súlyát a szerver minden tag tételeiből számolja, azokból is, amelyeket te nem látsz, így a szám a táska valódi súlya.',
  'help.guide.packing-bags.tip.3':
    'A korlát nélküli táskát a legnehezebb táskához viszonyítjuk, így a sávok összehasonlíthatók. Ha megadsz neki korlátot, a sávja ehhez a korláthoz mérődik.',
  // create-todo
  'help.guide.create-todo.title': 'Feladat hozzáadása',
  'help.guide.create-todo.goal': 'Rögzíts egy feladatot listával, prioritással, határidővel és felelőssel.',
  'help.guide.create-todo.step.1': 'Kattints a sáv jobb végén az „Új feladat” gombra.',
  'help.guide.create-todo.step.2':
    'Megnyílik az „Új feladat” ablak, a kurzor a fejlécében áll. Írd be a nevet a „Feladat neve” mezőbe, és a „Leírás” alá írj be mindent, amire emlékezni szeretnél.',
  'help.guide.create-todo.step.3':
    'A „Lista” csoportosítja a feladatot. Válassz egyet, vagy a mellette lévő pluszjellel adj nevet egy újnak egy kis ablakban.',
  'help.guide.create-todo.step.4': 'A „Prioritás” négy gombból áll: „Nincs”, P1, P2 és P3, a pirostól a kékig.',
  'help.guide.create-todo.step.5':
    'A „Lista” melletti „Határidő” naptárat nyit, a „Hozzárendelve” mezővel pedig egy személyhez rendelheted a feladatot.',
  'help.guide.create-todo.step.6': 'Kattints a „Feladat létrehozása” gombra.',
  'help.guide.create-todo.result':
    'A feladat megjelenik a listában, a prioritás, a határidő és a lista jelvényként, a sor végén pedig a felelős avatarja látszik, és a jobb oldali panelen megnyílik.',
  'help.guide.create-todo.tip.1': 'Csak a név kötelező. Minden mást később is kitölthetsz a jobb oldali panelen.',
  'help.guide.create-todo.tip.2': 'Ha az oldalsávban ki van választva egy lista, az új feladat abba a listába kerül.',
  'help.guide.create-todo.tip.3':
    'Ha a név mezőben Entert nyomsz, a feladat azonnal létrejön, a többi mező kitöltése nélkül.',
  // todo-filters
  'help.guide.todo-filters.title': 'Feladat keresése és módosítása',
  'help.guide.todo-filters.goal': 'Csak a most fontos feladatok megjelenítése, majd a megtalált feladat szerkesztése.',
  'help.guide.todo-filters.step.1':
    '„Feladatok” az oldalsávban: a „Mind” az összes még nyitott feladatot mutatja, a „Saját feladataim” a hozzád rendelteket, a „Lejárt” a múltbeli dátumúakat, a „Kész” pedig a befejezetteket. Mindegyik mellett ott a darabszám. Kattints a „Lejárt” elemre.',
  'help.guide.todo-filters.step.2':
    'A „Listák” alatt minden listának saját sora van. Ha kiválasztasz egyet, az a lista jelenik meg, a befejezett feladatokkal együtt.',
  'help.guide.todo-filters.step.3':
    'A lista tetején lévő rendezés a képernyőn látható elemek sorrendjét módosítja: a „Prioritás” a P1 elemeket teszi előre, a „Határidő” a legközelebbi határidőt. Egyszerre csak az egyiket használhatod, egy második kattintással pedig visszaáll a saját sorrended.',
  'help.guide.todo-filters.step.4': 'Kattints egy feladatra, hogy megnyíljon a jobb oldali panelen.',
  'help.guide.todo-filters.step.5':
    'Módosítsd, amit kell: a nevet, a „Prioritás”, a „Lista”, a „Határidő” vagy a „Hozzárendelve” mezőt. A „Leírás” működő linkekkel mutatja a szöveget; belekattintva szerkesztheted. Ezután kattints a panel alján a „Módosítások mentése” gombra. A panel fejlécében lévő jelölőnégyzettel késznek jelölheted a feladatot, a „Módosítások mentése” melletti „Törlés” pedig azonnal törli.',
  'help.guide.todo-filters.result':
    'A lista csak a kért feladatokat mutatja, a jobb oldali panelen pedig a kiválasztottat szerkesztheted.',
  'help.guide.todo-filters.tip.1':
    'Egy listasor csak a nyitott feladatokat számolja, de ha kiválasztod, a befejezett feladatok is megjelennek. A „Mind”, a „Saját feladataim” és a „Lejárt” elrejti a befejezett feladatokat, a „Kész” pedig csak a befejezetteket mutatja.',
  'help.guide.todo-filters.tip.2':
    'A rendezésnél a „Prioritás” és a „Határidő” nem használható egyszerre. Amíg bármelyik be van kapcsolva, a sorokat nem húzhatod saját sorrendbe.',

  // ── Screen: trip-bookings ─────────────────────────────────────────────────────────────
  'help.ctx.trip-bookings.title': 'Foglalások',
  'help.ctx.trip-bookings.summary':
    'Ezen a fülön minden olyan foglalás megtalálható, amely nem közlekedés: szállások, asztalfoglalások, jegyek, túrák és parkolás. Minden foglalás egy kártya, egy listasor vagy egy sáv az idővonalon, a kódjával, dokumentumaival, utazóival és költségével. A részletek megnyitásához kattints egy foglalásra.',
  'help.ctx.trip-bookings.bullet.1':
    'A sáv jobb végén lévő „Kézi foglalás” megnyitja az „Új foglalás” ablakot. Hatféle foglalást hozhatsz létre: „Szállás”, „Étterem”, „Esemény”, „Túra”, „Parkolás” és „Egyéb”. A repülőjáratok, vonatok és egyéb közlekedési eszközök a „Közlekedés” fülön vannak, és itt sosem jelennek meg.',
  'help.ctx.trip-bookings.bullet.2':
    'A „Kézi foglalás” előtti letöltés ikonnal („Foglalási visszaigazolások importálása”) visszaigazolásokat tölthetsz fel, amelyeket a TREK automatikusan feldolgoz: EML, PDF, PKPass, HTML vagy TXT, legfeljebb öt fájl, egyenként 10 MB-ig, valamint fotók, ha az AI-modell képeket is tud olvasni. Az ikon csak akkor jelenik meg, ha a szerver képes feldolgozni őket.',
  'help.ctx.trip-bookings.bullet.3':
    'A „Keresés” a címekben, típusokban, helyekben, jegyzetekben, foglalási kódokban és utazókban keres. A mellette lévő tölcsér, a „Szűrő” „Állapot” és „Típus” szerint (típusonként darabszámmal), valamint „Utasok” szerint szűkíti a fület, ha egy foglaláshoz személyek is tartoznak. A tölcséren lévő szám mutatja, hány szűrő aktív.',
  'help.ctx.trip-bookings.bullet.4':
    'A „Szűrő” utáni három ikonnal válthatsz a nézetek között: „Kártyák”, „Lista” és „Idővonal”. A mellettük lévő csúszkákkal („Nézet beállításai”) csoportosíthatod és rendezheted a kártyákat és a listát, vagy beállíthatod az idővonal sávjait; az ezt követő táblázat ikon („Exportálás táblázatként (CSV)”) fájlként letölti, amit a fül mutat. Alapból a kártyák „Megerősítve” és „Függőben” csoportba, a lista napok szerint rendeződik. Egy csoport címére kattintva összecsukhatod.',
  'help.ctx.trip-bookings.bullet.5':
    'A kártya fejlécének színe az állapotot jelzi; benne van az állapotpont (kattintásra „Függőben” és „Megerősítve” között vált), a típus, a cím, a ceruza és a kuka. Alatta a foglalás meglévő adatai: „Dátum”, „Időpont”, „Foglalási kód”, „Bejelentkezés” és „Kijelentkezés”, „Helyszín / Cím”, „Szállás”, „Kapcsolódik” (a megálló a tervben), „Hivatkozás”, „Jegyzetek”, „Utasok”, „Fájl” és a kapcsolt költségek.',
  'help.ctx.trip-bookings.bullet.6':
    'Egy kártyára, sorra vagy sávra kattintva megnyílnak a foglalás részletei, alul a „Térképen” gombbal (ha a foglaláshoz tartozik hely), a kukával és a „Szerkesztés” gombbal. Törlés előtt egyszer rákérdez („Foglalás törlése?”, és jelzi, ha költségek is törlődnek vele). Ezután a foglalás a kapcsolódó kiadásokkal együtt törlődik, szállásnál pedig az éjszakái is lekerülnek a napi tervről.',
  // booking-views
  'help.guide.booking-views.title': 'Nézetváltás és foglalás megnyitása',
  'help.guide.booking-views.goal':
    'Nézd meg a foglalásokat kártyaként, listaként vagy idővonalon, és nyiss meg egyet az összes részletéhez.',
  'help.guide.booking-views.step.1':
    'A sávban a „Szűrő” utáni három ikon a nézetek, és ha föléjük viszed az egeret, mindegyik megmutatja a nevét: „Kártyák”, „Lista” és „Idővonal”. A fül a „Kártyák” nézetben nyílik meg, minden foglalásnak egy kártyával, „Megerősítve” és „Függőben” csoportban. Kattints a középső ikonra, a „Lista” nézetre.',
  'help.guide.booking-views.step.2':
    'A „Lista” nézet naponként egy címsor alatt soronként egy foglalást mutat, jobbra a nappal és az időponttal; a nyílbillentyűkkel lépkedhetsz a sorok között. Kattints az „Idővonal” gombra, a három közül az utolsóra.',
  'help.guide.booking-views.step.3':
    'Az „Idővonal” az utazás napjain ábrázolja a foglalásokat: típusonként egy sávban, mindegyiket a kezdetétől a végéig tartó csíkként. A függőben lévő foglalásnak szaggatott a körvonala. Az „Utazás” a teljes utazást a képernyő szélességébe illeszti; egy nap címére kattintva azt a napot óránkénti bontásban látod.',
  'help.guide.booking-views.step.4':
    'A „Nap” nézet egy napot mutat óraskálán, és minden sáv hossza az időtartamát jelzi. A nap neve melletti nyilakkal az előző és a következő napra léphetsz. Amíg az utazás tart, a „Ma” az aktuális napra ugrik, a jobb oldali „Utazás” és „Nap” kapcsolóval pedig visszatérhetsz a teljes utazáshoz.',
  'help.guide.booking-views.step.5':
    'Vidd az egeret egy sáv fölé, hogy lásd a napját, időpontjait és helyét, majd kattints rá a foglalás részleteinek megnyitásához. A „Kártyák” nézetben egy kártya és a „Lista” nézetben egy sor ugyanezt az ablakot nyitja meg.',
  'help.guide.booking-views.step.6':
    'A részletes nézet fejlécében a cím, valamint címkék látszanak az állapothoz (kattintásra vált), a típushoz, a naphoz és a foglalási kódhoz, egy másolás gombbal. Alatta csempékként az időpontok, majd a hely, az utazók, a jegyzetek, a költségek és a fájlok, ha vannak, legalul pedig a „Térképen”, a kuka és a „Szerkesztés”.',
  'help.guide.booking-views.result':
    'A foglalás a részletes nézetében nyílik meg: a „Szerkesztés” megnyitja az űrlapját, a „Térképen” megmutatja a terven, a „Lezárás” vagy az Escape pedig visszavisz abba a nézetbe, ahonnan jöttél.',
  'help.guide.booking-views.tip.1':
    'A „Nézet beállításai” (a nézetikonok utáni csúszkák ikon) alatt a „Kártyák” és a „Lista” nézetet a „Csoportosítás” és a „Rendezés” segítségével csoportosíthatod és rendezheted. Az „Idővonal” nézetben a „Típusonként külön sáv” és „A másik fül megjelenítése” érhető el. „A másik fül megjelenítése” a „Közlekedés” fül tételeit halványítva, egy vékony sávban mutatja felül. A „Nézet visszaállítása” visszaállítja az alapértékeket, és minden fül megjegyzi a nézetét ebben a böngészőben.',
  'help.guide.booking-views.tip.2':
    'Az utazás előtti vagy utáni, illetve dátum nélküli foglalás nem jelenhet meg az idővonalon. Ezek a diagram alatt kis kártyaként látszanak „Az utazás előtt”, „Az utazás után” vagy a „Dátum nélkül” csoportban.',
  'help.guide.booking-views.tip.3':
    'Ugyanaz a részletes nézet nyílik meg mindenhol, ahol a foglalás megjelenik: a „Közlekedés” fülön, a napi tervben, egy nap és egy hely részleteiben. A címére kattintva átnevezheted a foglalást.',
  // create-booking
  'help.guide.create-booking.title': 'Foglalás létrehozása',
  'help.guide.create-booking.goal':
    'Vegyél fel kézzel egy éttermet, eseményt, túrát, parkolóhelyet vagy bármi mást az utazásba.',
  'help.guide.create-booking.step.1':
    'Kattints a sáv jobb végén a „Kézi foglalás” gombra. Megnyílik az „Új foglalás” ablak, felül egy fejlécben a címmel és két címkével.',
  'help.guide.create-booking.step.2':
    'Kattints a felső sávban a típuscímkére (új foglalásnál „Egyéb” áll rajta), és válaszd ki a „Foglalás típusa” értékét. Ezen a fülön hat típust hozhatsz létre: „Szállás”, „Étterem”, „Esemény”, „Túra”, „Parkolás” és „Egyéb”. Az űrlap a választásodtól függően változik: csak a „Szállás” használ dátumok helyett naptartományt.',
  'help.guide.create-booking.step.3':
    'Írd be a címet a felső sávba, a címkék fölötti mezőbe. Ez az egyetlen kötelező mező, és amíg nem írsz bele semmit, a „Hozzáadás” gomb szürke marad.',
  'help.guide.create-booking.step.4':
    'Add meg a „Dátum” és a „Kezdési idő” értékét, és ha a foglalásnak van vége, a „Befejezés dátuma” és a „Befejezési idő” értékét is. A naptárak csak az utazás napjait kínálják fel. Ha a befejezés dátuma és ideje nem a kezdés utánra esik, piros színnel jelenik meg, és a „Hozzáadás” nem működik. Ha a befejezési idő a kezdési idő előtt van, de nincs befejezési dátum, csak figyelmeztetést kapsz: ha a foglalás másnap ér véget, adj meg befejezési dátumot.',
  'help.guide.create-booking.step.5':
    'Add meg a visszaigazolásban szereplő „Foglalási kód” értékét, majd kattints a fejlécben a típus melletti állapotgombra. Új foglalásnál „Függőben” áll rajta, és „Megerősítve” értékre vált. Az állapot határozza meg, melyik csoportba kerül a kártya.',
  'help.guide.create-booking.step.6': 'Kattints az űrlap alján a „Hozzáadás” gombra.',
  'help.guide.create-booking.result':
    'A foglalás kártyaként jelenik meg a saját szakaszában. A fejléc színe az állapotát jelzi, a kártyán pedig a típusa, a dátuma, az időpontjai és a kódja látszik. Az utazás többi tagja azonnal látja.',
  'help.guide.create-booking.tip.1':
    'A „Helyszín / Cím” mező gépelés közben valódi címeket ajánl; ha kiválasztasz egyet, az felülírja a beírt szöveget, a saját magad által beírt cím pedig változatlan marad.',
  'help.guide.create-booking.tip.2':
    'A „Hivatkozás” mezőbe a foglalás saját oldalát írd be a szolgáltatónál. A kártya és a részletes nézet linkként jeleníti meg, amely új lapon nyílik meg.',
  'help.guide.create-booking.tip.3':
    'A jegyzetekben Markdown is használható, így egy lista vagy egy félkövér sor a kártyán és a részletes nézetben is listaként, illetve félkövéren jelenik meg.',
  // booking-hotel
  'help.guide.booking-hotel.title': 'Szállás foglalása',
  'help.guide.booking-hotel.goal':
    'Vigyél fel egy szállást úgy, hogy egyszerre számítson foglalásnak és éjszakáknak a napi tervben.',
  'help.guide.booking-hotel.step.1':
    'Kattints a „Kézi foglalás” gombra, és a felső sáv típusválasztójában válaszd a „Szállás” típust. A dátummezők helyén szállodai mezők blokkja jelenik meg.',
  'help.guide.booking-hotel.step.2':
    'A „Szállás” alatt válaszd ki a szállodát. A listában az utazás helyei szerepelnek, az importált nyomvonalak és túrák nélkül. Ha kiválasztasz egyet, a neve bekerül az üres címmezőbe, a címe pedig a „Helyszín / Cím” mezőbe.',
  'help.guide.booking-hotel.step.3':
    'Állítsd be a „Kitől” és az „Eddig” mezőt: az első éjszakát és az elutazás reggelét. Mindkettőben az utazás napjai közül választhatsz a dátumukkal együtt, és a TREK gondoskodik róla, hogy az „Eddig” a „Kitől” után legyen.',
  'help.guide.booking-hotel.step.4':
    'Töltsd ki a „Bejelentkezés”, a „Bejelentkezés eddig” és a „Kijelentkezés” mezőt, valamint a visszaigazolásból a „Foglalási kód” mezőt.',
  'help.guide.booking-hotel.step.5': 'Kattints a „Hozzáadás” gombra.',
  'help.guide.booking-hotel.result':
    'A kártyán a „Dátum” alatt a naptartomány, a be- és kijelentkezés időpontja és a cím látható. A szállás mostantól a terv érintett napjain is megjelenik.',
  'help.guide.booking-hotel.tip.1':
    'A „Szállás” az egyetlen típus „Dátum” és „Kezdési idő” nélkül. A dátumait az „Ettől” és az „Eddig” mezőben adod meg, és nem naptári dátumokat, hanem az utazás napjait választod ki.',
  'help.guide.booking-hotel.tip.2':
    'Ha a „Szállás” mezőt üresen hagyod, és helyette beírod a címet, a TREK megkeresi a helyet, létrehozza, és felteszi a térképre.',
  'help.guide.booking-hotel.tip.3': 'Ha törlöd a foglalást, az éjszakái is eltűnnek a napi tervből.',
  // link-booking
  'help.guide.link-booking.title': 'Foglalás összekapcsolása a tervvel',
  'help.guide.link-booking.goal':
    'Kapcsold a foglalást a megállójához és a helyéhez, hogy ott jelenjen meg, ahol szükséged van rá.',
  'help.guide.link-booking.step.1':
    'Vidd az egeret az összekapcsolni kívánt kártya fölé, és kattints a fejlécében lévő ceruzára. Megnyílik a „Foglalás szerkesztése” ablak.',
  'help.guide.link-booking.step.2':
    'Nyisd meg az „Összekapcsolás napi tervvel” listát. Ez a tervedet mutatja: minden naphoz egy fejléc, alatta az adott nap megállói számozva, az időpontjukkal. Válaszd ki azt a megállót, amelyhez a foglalás tartozik.',
  'help.guide.link-booking.step.3':
    'A „Hely / Tevékenység” magát a helyet kapcsolja hozzá. Ha itt kiválasztod, a cím és a „Helyszín / Cím” kitöltődik, ha üresek.',
  'help.guide.link-booking.step.4': 'Kattints a „Frissítés” gombra.',
  'help.guide.link-booking.result':
    'A kártyán a „Kapcsolódik” alatt megjelenik a nap és a megálló, a napi tervben pedig a foglalás annál a megállónál látszik.',
  'help.guide.link-booking.tip.1':
    'A lista tetején lévő „Nincs összekapcsolás (önálló)” megszünteti a kapcsolatot. A szállásnál nincs megállóválasztó: az éjszakáin keresztül kapcsolódik a tervhez.',
  'help.guide.link-booking.tip.2':
    'Ha dátummal rendelkező napon választasz megállót, a TREK kitölti az üres „Dátum” mezőt. A már beállított dátumot nem módosítja.',
  // booking-travelers
  'help.guide.booking-travelers.title': 'Kinek szól a foglalás',
  'help.guide.booking-travelers.goal':
    'Jelöld meg, mely utazókra vonatkozik egy foglalás, majd szűrj csak az ő foglalásaikra.',
  'help.guide.booking-travelers.step.1':
    'Nyisd meg a foglalást a kártyáján lévő ceruzával. Az „Utasok” a „Foglalási kód” mellett található. Amíg senki sincs a foglaláshoz rendelve, az „Utasok hozzárendelése” felirat látszik.',
  'help.guide.booking-travelers.step.2':
    'Kattints rá, és válaszd ki, kiknek szól a foglalás; a megnevezett vendégek is szerepelnek a listában. A kiválasztott személy pipát kap, az avatarja pedig megjelenik a mezőben. A névre újra kattintva eltávolíthatod.',
  'help.guide.booking-travelers.step.3': 'Kattints a „Frissítés” gombra.',
  'help.guide.booking-travelers.step.4':
    'Kattints a sávban a „Szűrő” gombra: az „Utasok” alatt kattints egy személyre, hogy csak az ő foglalásait lásd. Egyszerre több személy is kiválasztható.',
  'help.guide.booking-travelers.result':
    'A kártyán látszik, kiknek szól a foglalás, a „Szűrő” pedig a kiválasztott személyek foglalásaira szűkíti a fület.',
  'help.guide.booking-travelers.tip.1':
    'A kártyán és a részletes nézetben az utazók csak megjelennek, ott nem módosíthatod őket. Itt, az űrlapon állíthatod be őket.',
  'help.guide.booking-travelers.tip.2':
    'Az „Utasok” akkor jelenik meg a „Szűrő” alatt, ha az utazásnak egynél több tagja van, és legalább egy foglalásnál meg van adva valaki. A választásod a böngészőlap bezárásáig megmarad.',
  // booking-files
  'help.guide.booking-files.title': 'A voucher a foglalásnál',
  'help.guide.booking-files.goal':
    'Csatold a visszaigazolást, a jegyet vagy a bérletet ahhoz a foglaláshoz, amelyhez tartozik.',
  'help.guide.booking-files.step.1':
    'Nyisd meg a foglalást a kártyáján lévő ceruzával. A „Fájl” rész a „Csatolás” mellett van; kattints ott a „Fájl csatolása” gombra. Meglévő foglalásnál a dokumentum azonnal feltöltődik, és megjelenik a „Fájl feltöltve” üzenet.',
  'help.guide.booking-files.step.2':
    'A dokumentum a nevével jelenik meg a listában, egy megnyitás gombbal és mellette egy X-szel.',
  'help.guide.booking-files.step.3':
    'A „Meglévő fájl csatolása” az utazás azon dokumentumait kínálja fel, amelyek még nincsenek ennél a foglalásnál. Válassz egyet, és újbóli feltöltés nélkül csatolódik.',
  'help.guide.booking-files.step.4': 'Kattints a „Frissítés” gombra.',
  'help.guide.booking-files.result':
    'A kártya és a részletnézet a „Fájl” alatt sorolja fel a dokumentumokat. Egy dokumentumra kattintva megnyithatod. A részletnézetben a lista fölötti „Megjelenítés a fájlokban” a „Fájl” fülre visz.',
  'help.guide.booking-files.tip.1':
    'Ha a foglalást még most hozod létre, a dokumentum akkor töltődik fel, amikor a „Hozzáadás” gombra kattintasz. A feltöltéshez internetkapcsolat kell.',
  'help.guide.booking-files.tip.2':
    'A dokumentum melletti X csak a kapcsolatot szünteti meg, a dokumentumot nem. A dokumentum az utazás „Fájl” fülén megmarad.',
  'help.guide.booking-files.tip.3':
    'Azt, hogy milyen fájltípusok csatolhatók, az adminisztrátor állítja be az „Engedélyezett fájltípusok” alatt. Alapértelmezetten dokumentumok, szövegek és képek engedélyezettek.',
  // booking-cost
  'help.guide.booking-cost.title': 'Foglalás árának rögzítése költségként',
  'help.guide.booking-cost.goal':
    'Vedd fel egy foglalás költségét a „Költségek” közé, és oszd el azok között, akik fizetik.',
  'help.guide.booking-cost.step.1':
    'Nyisd meg a foglalást a kártyáján lévő ceruzával, és görgess az űrlap aljára. A „Költségek” alatt találod a „Költség létrehozása” és a „Meglévő költség csatolása” lehetőséget, mellettük a következő megjegyzéssel: „Menti a foglalást, majd megnyitja a költségszerkesztőt”.',
  'help.guide.booking-cost.step.2':
    'Kattints a „Költség létrehozása” gombra. A foglalás mentődik, az űrlapja bezárul, és megnyílik a költségszerkesztő „Költség hozzáadása” címmel.',
  'help.guide.booking-cost.step.3':
    'A fejlécben a név már a foglalás címe, a „Nap” pedig már a foglalás napja. Add meg a „Teljes összeg” értékét, és ellenőrizd mellette a „Pénznem” mezőt.',
  'help.guide.booking-cost.step.4':
    'A fejlécben lévő címke a „Kategória”, amely már a foglalás típusának megfelelő kategóriára van állítva. A „Ki fizetett?” alatt válaszd ki, ki fizetett, a „Felosztás” alatt pedig azt, hogyan oszlik meg az összeg.',
  'help.guide.booking-cost.step.5': 'Kattints a „Költség hozzáadása” gombra.',
  'help.guide.booking-cost.result':
    'A kártya alján megjelenik az összeg, a foglalás űrlapján a költség a „Kapcsolt költségek” alatt szerepel, és ugyanez a költség a „Költségek” fülön is megjelenik, ehhez a foglaláshoz kapcsolva.',
  'help.guide.booking-cost.tip.1':
    'A kategória a típustól függ: az étteremből „Étel és ital”, a szállásból „Szállás”, a parkolásból „Parkolás”, az eseményből és a túrából pedig egyaránt „Egyéb” lesz.',
  'help.guide.booking-cost.tip.2':
    'Egy foglaláshoz több kiadás is tartozhat. A „Meglévő költség csatolása” azokat a kiadásokat kínálja fel a „Költségek” közül, amelyek még semmihez sem kapcsolódnak. Egy csatolt kiadásnál a „Leválasztás, a költség megmarad” megszünteti a kapcsolatot, de a kiadás a „Költségek” között marad, a kuka viszont törli.',
  'help.guide.booking-cost.tip.3':
    'A „Költségek” rész csak akkor van az űrlapon, ha a „Költségek” bővítmény be van kapcsolva; ezt az adminisztrátor a „Bővítmények” alatt kapcsolhatja.',
  // filter-bookings
  'help.guide.filter-bookings.title': 'Foglalás keresése',
  'help.guide.filter-bookings.goal': 'Szűrd a hosszú fület egy szóra, állapotra, típusra vagy személyre.',
  'help.guide.filter-bookings.step.1':
    'Írj a sáv „Keresés” mezőjébe. A keresés a címekben, típusokban, helyekben és címekben, jegyzetekben, foglalási kódokban és az utazók nevében is keres, a fül pedig gépelés közben egyre kevesebb találatot mutat. Az Escape törli a mező tartalmát.',
  'help.guide.filter-bookings.step.2':
    'Kattints a keresés melletti tölcsérre, a „Szűrő” gombra. A panelen az „Állapot”, a „Típus”, és ha egy foglaláshoz már személyek vannak rendelve, az „Utasok” szűrő található.',
  'help.guide.filter-bookings.step.3':
    'Az „Állapot” alatt válaszd a „Megerősítve” vagy a „Függőben” lehetőséget, ha csak azokat szeretnéd látni; a „Mind” mindkettőt mutatja.',
  'help.guide.filter-bookings.step.4':
    'A „Típus” alatt kattints egy vagy több típusra, hogy csak azok maradjanak. Minden típusnál látszik, hány foglalás tartozik hozzá, a kiválasztottakat pipa jelöli.',
  'help.guide.filter-bookings.step.5':
    'A „Szűrő” gombon lévő szám mutatja, hány szűrő aktív, a kereső melletti címke pedig azt, hogy az összes foglalásból hány maradt. Ha újra mindent látni szeretnél, kattints a címkére vagy a panel alján a „Szűrők visszaállítása” gombra.',
  'help.guide.filter-bookings.result':
    'A fül csak a kiválasztott elemeket mutatja, a „Kártyák”, a „Lista” és az „Idővonal” nézetben egyaránt, a szűrők pedig ennél az utazásnál a böngészőlap bezárásáig megmaradnak.',
  'help.guide.filter-bookings.tip.1':
    'A „Típus” csak akkor jelenik meg, ha a fülön egynél több típus van, és csak a fülön szereplő típusokat sorolja fel. Ha tehát nincs túra a fülön, a „Típus” alatt nincs „Túra” lehetőség.',
  'help.guide.filter-bookings.tip.2':
    'Ha semmi sem felel meg a szűrőnek, a fülön a „Nincs a szűrőknek megfelelő találat” üzenet jelenik meg, közvetlenül alatta a „Szűrők visszaállítása” gombbal.',
  // import-booking-file
  'help.guide.import-booking-file.title': 'Foglalás importálása a visszaigazolásból',
  'help.guide.import-booking-file.goal':
    'A TREK olvassa ki a foglalást a szolgáltatótól kapott e-mailből vagy PDF-ből, hogy ne kelljen újra begépelned.',
  'help.guide.import-booking-file.step.1':
    'Kattints a sávban a letöltés ikonra, a „Foglalási visszaigazolások importálása” gombra; a neve akkor jelenik meg, ha fölé viszed az egeret. Megnyílik az azonos nevű ablak.',
  'help.guide.import-booking-file.step.2':
    'Húzd a visszaigazolásokat a mezőre, vagy kattints rá, és válaszd ki őket: EML, PDF, PKPass, HTML vagy TXT, legfeljebb öt fájl, egyenként 10 MB-ig, valamint fotók (JPG, PNG, WEBP), ha az AI-modell képeket is tud olvasni. A mezőben látod a kiválasztott fájlok nevét.',
  'help.guide.import-booking-file.step.3':
    'Kattints az „Importálás” gombra. Az ablak azonnal bezárul, mert a beolvasás a háttérben történik.',
  'help.guide.import-booking-file.step.4':
    'Jobbra lent egy kártya mutatja a folyamatot a fájl neve alatt. Akkor is látható marad, ha máshová lépsz az alkalmazásban, vagy újratöltöd az oldalt. A „Fájlok feldolgozása…” felirat pipára vált, amikor a beolvasás kész, és a kártyán megjelenik az „Importálás” gomb. Kattints rá.',
  'help.guide.import-booking-file.step.5':
    'Minden megtalált foglalás egymás után, már kitöltve nyílik meg az „Új foglalás” ablakban. Szállodánál ez a nevét jelenti címként, és ha a hely szerepel az utazásban, a „Szállás” alatt, továbbá a „Helyszín / Cím”, a „Kitől” és az „Eddig” az éjszakáira, a „Bejelentkezés” és a „Kijelentkezés”, a „Foglalási kód”, a visszaigazolás a „Fájl” alatt, és bekapcsolt „Költségek” esetén az ár „Kapcsolt költség” formájában. Ellenőrizd, és kattints a „Hozzáadás” gombra.',
  'help.guide.import-booking-file.result':
    'A foglalás kártyaként jelenik meg a „Függőben” alatt, az éjszakák számával, a kóddal, a visszaigazolás pedig a „Fájl” alatt. A szállás a terv érintett napjain is megjelenik. Ha a „Költségek” be van kapcsolva, az ár a foglaláshoz kapcsolt költségként is bekerül.',
  'help.guide.import-booking-file.tip.1':
    'Az importálás ikon csak akkor jelenik meg, ha a szerver be tudja olvasni a visszaigazolásokat. Ehhez a kinyerő vagy az „MI-elemzés” bővítmény szükséges. Az „MI-elemzés” bővítményt az adminisztrátor kapcsolhatja be a „Bővítmények” alatt. Foglalások nélküli fülön „Importálás fájlból” gombként is megjelenik.',
  'help.guide.import-booking-file.tip.2':
    'Ha semmit sem sikerült kiolvasni, a kártya jelzi ezt. Bekapcsolt MI-elemzésnél felajánlja a „Próba MI-elemzéssel” lehetőséget, amely ugyanezeket a fájlokat közvetlenül a modellnek küldi. Az elkészült feldolgozás tíz percig érhető el; ezen belül kezdd el az átnézést.',
  'help.guide.import-booking-file.tip.3':
    'A visszaigazolás csak akkor csatolódik, ha a típusa szerepel az adminbeállítások „Engedélyezett fájltípusok” listáján. A PDF alapból engedélyezett; az e-mailt (EML) előbb fel kell venni, különben a foglalás nélküle mentődik.',
  // edit-booking
  'help.guide.edit-booking.title': 'Foglalás módosítása',
  'help.guide.edit-booking.goal':
    'Javíts egy időpontot, add meg a később érkezett kódot, vagy tedd át a foglalást a „Függőben” állapotból a „Megerősítve” állapotba.',
  'help.guide.edit-booking.step.1':
    'Vidd az egeret a kártya fölé, és kattints a fejlécében lévő ceruzára. Megnyílik a „Foglalás szerkesztése” ablak a foglalás összes adatával.',
  'help.guide.edit-booking.step.2':
    'Módosítsd, amit kell, például a „Foglalási kód” mezőt, ha a szolgáltató később küldte el.',
  'help.guide.edit-booking.step.3':
    'Kattints a felső sávban a „Függőben” címkére. „Megerősítve” lesz belőle, a sáv pedig zöldre vált.',
  'help.guide.edit-booking.step.4': 'Kattints a „Frissítés” gombra.',
  'help.guide.edit-booking.result':
    'A kártya áthelyeződik: a megerősített foglalás a „Megerősítve” szakaszba kerül zöld ponttal és zöld felső sávval, és az utazás minden tagja látja az áthelyezést.',
  'help.guide.edit-booking.tip.1':
    'Ha nem tudod elolvasni a „Foglalási kód” mezőt, akkor a Beállítások „Megjelenés” részében be van kapcsolva a „Foglalási kódok elrejtése”. Az elolvasáshoz vidd az egeret a kód fölé, vagy kattints rá.',
  'help.guide.edit-booking.tip.2':
    'Ha módosítod a típust, a kapcsolódó kiadás kategóriája is vele változik, kivéve ha a költségszerkesztőben kézzel választottál kategóriát.',
  'help.guide.edit-booking.tip.3':
    'A foglalás részletes nézetének alján lévő „Szerkesztés” ugyanezt az űrlapot nyitja meg. Az állapotot űrlap nélkül is átválthatod: kattints a kártyán vagy a sorban lévő pontra, vagy a részletes nézetben az állapotcímkére.',
  // delete-booking
  'help.guide.delete-booking.title': 'Foglalás törlése',
  'help.guide.delete-booking.goal': 'Lemondott foglalás eltávolítása az utazásból.',
  'help.guide.delete-booking.step.1':
    'Vidd az egeret a kártya fölé, és kattints a fejlécében lévő kukára. A foglalás részleteinek alján lévő kuka ugyanezt teszi.',
  'help.guide.delete-booking.step.2':
    'A „Foglalás törlése?” kérdés megnevezi a kiválasztott foglalást, és jelzi, hogy véglegesen törlődik. Ha költségek kapcsolódnak hozzá, azt is jelzi, hogy azok is törlődnek.',
  'help.guide.delete-booking.step.3': 'Kattints a „Törlés” gombra.',
  'help.guide.delete-booking.result':
    'A kártya az utazás minden tagjánál törlődik. A foglalás törlése nem vonható vissza, így a megerősítő kérdés az utolsó lehetőséged, hogy meggondold magad.',
  'help.guide.delete-booking.tip.1':
    'A foglalás törlésével a hozzá kapcsolt kiadások is törlődnek. Szállás törlésekor az éjszakái is eltűnnek a napi tervből.',
  'help.guide.delete-booking.tip.2':
    'A csatolt dokumentumok az utazás „Fájl” fülén maradnak; csak a foglaláshoz fűződő kapcsolatuk szűnik meg.',

  // ── Screen: trip-costs ────────────────────────────────────────────────────────────────
  'help.ctx.trip-costs.title': 'Költségek',
  'help.ctx.trip-costs.summary':
    'Az utazás pénzügyei: minden kiadás egy dátum szerinti főkönyvben vagy táblázatban, azzal együtt, ki rögzítette, és kinek kell állnia, a nyugta pénznemében. A jobb oldali oszlop mutatja, kinek kit kell kifizetnie az egyenleg rendezéséhez.',
  'help.ctx.trip-costs.bullet.1':
    'A felső sávban az utazás dátumai és azok az utazók látszanak, akik között a költségek megoszlanak. Itt található a „Költségek keresése…” mező, a „Szűrő” (a tölcsér), a „CSV exportálás” (a letöltés ikon) és a „Lista” / „Táblázat” kapcsoló is.',
  'help.ctx.trip-costs.bullet.2':
    'A sáv jobb végén az „Elszámolás” egyszerre rögzíti az összes nyitott átutalást, a „Nyugta beolvasása” egy fotóból tölti ki a kiadást, ha az „MI-elemzés” bővítmény képes képeket olvasni, a „Költség hozzáadása” pedig megnyitja a szerkesztőt.',
  'help.ctx.trip-costs.bullet.3':
    'Négy kártya a sáv alatt: a „Tartozol” és a „Neked tartoznak” az elszámolás rád vonatkozó része, a „Rendezetlen összeg” a rögzített, de még fizető nélküli kiadásokat mutatja, a „Teljes utazási költség” pedig mindent összead, alatta „A te részed” és a „Te fizettél” értékkel.',
  'help.ctx.trip-costs.bullet.4':
    'A főkönyv napok szerint csoportosít, a legújabbal kezdve, minden nap fejlécében a bejegyzések számával és az aznap elköltött összeggel. Egy sorban látod a kategóriát színes fülként, a nevet, a fizetők címkéit azzal, ki mennyit fizetett, alattuk a „Felosztás” résszel, minden utas részével (pipa jelöli, ki fizette már ki a sajátját), majd a jegyzetet és az összeget, valamint a „kölcsönadtál” vagy „kölcsönvettél” jelzést, ha a felosztás szerint mások tartoznak neked, vagy te tartozol.',
  'help.ctx.trip-costs.bullet.5':
    'A jobb oldali oszlop az eredményeket mutatja: az „Elszámolás” felsorolja, ki kinek fizet, az „Egyenlegek” minden utazó többletét vagy hiányát, a „Végső költségvetés” azt, mennyibe kerül az utazás az egyes utazóknak, a „Kategóriánként” pedig azt, mire ment el a pénz.',
  'help.ctx.trip-costs.bullet.6':
    'A rögzített befizetés ugyanabban a főkönyvben külön sorként jelenik meg, mellette ceruzával és „Visszavonás” gombbal. A kiadásnál ceruza és kuka van, a kuka pedig törlés előtt rákérdez. A nyugtával rendelkező kiadás neve mellett „Nyugta” címke látható, amellyel megnyithatod a nyugtákat.',
  'help.ctx.trip-costs.bullet.7':
    'A sáv „Táblázat” gombja ugyanezeket a költségeket táblázatban mutatja, kategóriák szerint csoportosítva, „Személyek” és „Nap” oszloppal, valamint a személyenkénti és napi összeggel. Ilyenkor a „Kategóriánként” helyén az „Összegzés” jelenik meg. A „Költségek” megjegyzi a választott nézetet.',
  // add-expense
  'help.guide.add-expense.title': 'Költség hozzáadása',
  'help.guide.add-expense.goal': 'Rögzítsd, mennyibe került valami, ki fizette ki, és kik között oszlik meg.',
  'help.guide.add-expense.step.1':
    'Kattints a sáv jobb végén a „Költség hozzáadása” gombra. Megnyílik a szerkesztő mai dátummal, téged megadva fizetőként, és már mindenki benne van a felosztásban.',
  'help.guide.add-expense.step.2':
    'Írd be az ablak tetején lévő mezőbe, mire ment a kiadás. Üresen a „pl. vacsora, ajándékok, benzin…” felirat látszik benne. Ez a kiadás neve, és enélkül nem mentheted a kiadást.',
  'help.guide.add-expense.step.3':
    'A név alatti címke a „Kategória”, amely „Étel és ital”, amíg mást nem választasz. Tizennégy kategória van, és nem módosíthatók. A fejléc a választott kategória színére vált, ahogy a sor színes füle és a „Kategóriánként” nézetben a sávja is.',
  'help.guide.add-expense.step.4':
    'Írd be a nyugtán szereplő összeget a „Teljes összeg” mezőbe. A mellette lévő „Pénznem” kezdetben a „Költségek” megjelenítési pénzneme; ha módosítod, a szerkesztő mutatja az átváltott összeget. A „Nap” kezdetben a mai nap, és a kiadás a listában e nap alá kerül.',
  'help.guide.add-expense.step.5':
    'A „Ki fizetett?” alatt kattints arra, aki ténylegesen fizetett. Alapból a „Te” van kiválasztva. A „Még senki sem fizetett” úgy rögzíti az összeget, hogy senki sem tartozik érte, a fejléc melletti kapcsolóban a „Többen fizettek” pedig több fizető között osztja meg a számlát.',
  'help.guide.add-expense.step.6':
    'Az alatta lévő „Felosztás” alapból „Egyenlően” áll, mindenki be van jelölve, és a nevek mellett látszik az egyes részek összege. Hagyd így, vagy módosítsd. A mentéshez kattints az ablak alján a „Költség hozzáadása” gombra.',
  'help.guide.add-expense.result':
    'A kiadás a főkönyvben a napja alatt szerepel, beleszámít a „Teljes utazási költség” összegébe, az elszámolási oszlop pedig újraszámolta, ki kinek tartozik.',
  'help.guide.add-expense.tip.1':
    'Ha nem módosítod az alapértékeket, a kiadás mai dátumot kap, te leszel a fizető, és mindenki között egyenlően oszlik meg: csak a nevet és az összeget kell kitöltened.',
  'help.guide.add-expense.tip.2':
    'Az összeg melletti ± jellel visszatérítéssé alakíthatod a kiadást. A negatív végösszeg visszafizetett pénzt jelent, és a felosztás is megfordul.',
  'help.guide.add-expense.tip.3':
    'Az ablak alján a „Nyugták és számlák” melletti „Csatolás” gombbal képeket és PDF-eket csatolhatsz. Ezek mentéskor töltődnek fel, az utazás „Fájl” részébe kerülnek, és a listában a név mellett megjelenik a „Nyugta” címke.',
  // expense-payers
  'help.guide.expense-payers.title': 'Ki fizetett',
  'help.guide.expense-payers.goal': 'Rögzítsd, ki fizette ki a kiadást. Ez az elszámolás kiszámításának másik fele.',
  'help.guide.expense-payers.step.1':
    'Nyisd meg a költséget a sora melletti ceruzával, és nézd meg a „Ki fizetett?” részt. A fejléc melletti kapcsoló alapértelmezett állása az „Egy személy fizetett”: minden utazó egy címke, a körvonalas címke jelöli, ki fizetett. Másik címkére kattintva módosíthatod.',
  'help.guide.expense-payers.step.2':
    'A „Még senki sem fizetett”, az utazók utáni szaggatott keretes címke, úgy rögzíti az összeget, hogy senki sem tartozik semmivel. A költség ettől még beleszámít a „Teljes utazási költség” értékébe.',
  'help.guide.expense-payers.step.3':
    'A kapcsoló másik lehetősége, a „Többen fizettek”, minden utast felsorol egy jelölőnégyzettel, és minden bejelölt személy kap egy összegmezőt. Jelöld be, kik fizettek, és írd be, ki mennyit; az összegeknek ki kell adniuk a teljes összeget.',
  'help.guide.expense-payers.step.4':
    'Ha egy kiadást senki sem fizetett ki, a sorában „Befejezetlen” jelölés látszik, és beleszámít a „Rendezetlen összeg” kártyába, amely a még fizető nélküli kiadásokat összesíti.',
  'help.guide.expense-payers.result':
    'Az dönti el, kinek jár vissza pénz, hogy ki fizetett; a felosztás dönti el, ki fizet; az „Egyenlegek” pedig a kettő különbségét mutatják.',
  'help.guide.expense-payers.tip.1':
    'A „Ki fizetett?” és a „Felosztás” független egymástól: kifizethetsz egy vacsorát, amelyen ott sem voltál, és benne lehetsz egy olyan felosztásában, amelyet nem te fizettél.',
  'help.guide.expense-payers.tip.2':
    'Több fizető esetén az összegek együttesen ki kell, hogy adják a végösszeget. Ha még egy fizetőt kipipálsz, a maradék újra elosztódik azok között az összegek között, amelyeket nem te írtál be. Amíg az összegek nem egyeznek, a szerkesztő mutatja, mennyit kell kiadniuk együtt, és nem engedi a mentést.',
  'help.guide.expense-payers.tip.3':
    'Ha egy költséget visszaállítasz „Még senki sem fizetett” állapotra, az nem törlődik: az összeg benne marad a „Teljes utazási költség” értékében, a sor pedig „Befejezetlen” lesz.',
  // split-expense
  'help.guide.split-expense.title': 'Számla felosztása az utazók között',
  'help.guide.split-expense.goal':
    'Döntsd el, kik állják a kiadást: mindenki egyenlően, összeg szerint, vagy tételenként a nyugta alapján.',
  'help.guide.split-expense.step.1':
    'A kiadásszerkesztőben a „Felosztás” rész minden utazót felsorol egy jelölőnégyzettel. Ha egy névnél kiveszed a pipát, az illető kimarad ebből a kiadásból: a neve kiszürkül, nem kap részt, és nem tartozik érte semmivel.',
  'help.guide.split-expense.step.2':
    'A címsor melletti kapcsolón az „Egyenlően” az alapértelmezett: minden kipipált utazó ugyanakkora részt kap, amely a neve mellett látszik. A lista alatti jelvények mutatják, hány ember osztozik, és mennyi egy rész.',
  'help.guide.split-expense.step.3':
    'Az „Egyéni” a részek helyett összegmezőket jelenít meg. Írd be, ki mennyivel tartozik. Az alatta lévő jelvény gépelés közben frissül, és zöldre vált „A felosztás megegyezik a végösszeggel” felirattal. Amíg az összegek nem egyeznek a végösszeggel, nem mentheted a kiadást.',
  'help.guide.split-expense.step.4':
    'A „Blokk” soronként osztja fel a nyugtát: „Tétel hozzáadása”, majd soronként egy név és egy ár, a „Megosztva:” mellett pedig azok az utazók, akik az adott tételen osztoznak.',
  'help.guide.split-expense.step.5':
    'A sorok alatti „Egyéni részek” mutatja, végül ki mennyivel tartozik, a fent lévő „Teljes összeg” pedig a sorok összege. Kattints az ablak alján a „Mentés” gombra.',
  'help.guide.split-expense.result':
    'Minden egyenleg a felosztás alapján számolódik. A felosztás a kiadással együtt mentődik, a sorában „Felosztás” jelöléssel, az egyes utasok részével látszik, és később módosítható anélkül, hogy bármi más változna.',
  'help.guide.split-expense.tip.1':
    'Akinél kiveszed a pipát, az ennél az egy költségnél nem tartozik semmivel, a többiek pedig kifizetik a saját részüket.',
  'help.guide.split-expense.tip.2':
    'Az „Equally” centre pontosan oszt: a maradék cent kiadásonként más-más személyhez kerül, így nem mindig ugyanaz fizeti.',
  'help.guide.split-expense.tip.3':
    '„Blokk” módban a „Teljes összeg” mezőt a TREK maga számolja ki, ezért a mező kiszürkül: a végösszeg a blokk tételeinek összege.',
  'help.guide.split-expense.tip.4':
    'Egyéni felosztást százalékban is megadhatsz: állítsd a „Részek megadása mint” kapcsolót %-ra. A részek összegének 100 %-nak kell lennie, különben a kiadás nem menthető.',
  // expense-currency
  'help.guide.expense-currency.title': 'Kiadás rögzítése más pénznemben',
  'help.guide.expense-currency.goal': 'Add meg a nyugtán szereplő összeget, az árfolyamot pedig a TREK elmenti.',
  'help.guide.expense-currency.step.1':
    'Nyisd meg a „Költség hozzáadása” ablakot. Írd be a nevet az ablak tetejére, az összeget pedig a „Teljes összeg” mezőbe pontosan úgy, ahogy a nyugtán szerepel, ne átváltva.',
  'help.guide.expense-currency.step.2':
    'Nyisd meg az összeg melletti „Pénznem” listát, és válaszd ki a nyugta pénznemét. A lista a TREK által ismert összes kódot tartalmazza, és kereshető: írd be a háromjegyű kódot.',
  'help.guide.expense-currency.step.3':
    'A mezők alatt jelvények jelennek meg: a beírt összeg és a jelenlegi értéke, „élő árfolyam” jelöléssel. Ez csak előnézet, nem ez az érték kerül mentésre.',
  'help.guide.expense-currency.step.4':
    'Kattints az ablak alján a „Költség hozzáadása” gombra. Az árfolyam ekkor rögzül: a kiadás azt az értéket tartja meg, amennyi a bevitel napján volt.',
  'help.guide.expense-currency.step.5':
    'A kiadáslistában a sor mindkét összeget mutatja a név alatt: a beírt összeget, egy nyilat és az utazás pénznemében számolt összeget. A „Költségek” fülön minden végösszeg, egyenleg és elszámolás a második összeggel számol.',
  'help.guide.expense-currency.result':
    'A kiadás megtartja a beírt összeget és pénznemet. A kiadáslista mindkettőt mutatja, az utazás végösszegei és egyenlegei pedig az utazás pénznemében számolódnak.',
  'help.guide.expense-currency.tip.1':
    'Az árfolyam a mentéskor rögzül, így egy rendezett tartozás nem változik meg attól, hogy egy héttel később elmozdul az árfolyam. Új árfolyam csak akkor mentődik, ha módosítod a kiadás pénznemét.',
  'help.guide.expense-currency.tip.2':
    'A Beállítások alatti „Megjelenítési pénznem” csak azt módosítja, hogyan látod az összegeket. A tárolt összegek sosem változnak. Ha üresen hagyod, minden utazás a saját pénznemében jelenik meg.',
  'help.guide.expense-currency.tip.3':
    'Az utazás pénznemét magánál az utazásnál, az „Utazás szerkesztése” alatt állíthatod be, ehhez az „Utazás részleteinek szerkesztése” jogosultság kell. Ha módosítod, minden rögzített árfolyamot újraszámolunk az új pénznemre. Magukat az összegeket nem váltjuk át.',
  // filter-costs
  'help.guide.filter-costs.title': 'Kiadás vagy egy nap költéseinek megkeresése',
  'help.guide.filter-costs.goal': 'Szűrd a hosszú kiadáslistát úgy, hogy csak azt lásd, amit keresel.',
  'help.guide.filter-costs.step.1':
    'Írj a sávban a „Költségek keresése…” mezőbe. Gépelés közben a kiadások nevében keres, az Esc billentyűvel pedig kiürítheted.',
  'help.guide.filter-costs.step.2':
    'A „Szűrő”, a kereső melletti tölcsér megnyitja a szűrőket. A felső kapcsolóval a saját szemszögedből nézheted a kiadásokat: „Mind”, „Én fizettem” azokhoz, amelyeket te fizettél, és „Nekem tartoznak” azokhoz, amelyeknél többet fizettél a részednél.',
  'help.guide.filter-costs.step.3':
    'A „Kategória” alatt válassz a tizennégy kategória közül, és csak az adott kategória kiadásai jelennek meg. A tölcséren látszik, hány szűrő aktív.',
  'help.guide.filter-costs.step.4':
    'A „Nap” alatt válassz egyet azok közül a napok közül, amelyeken volt költség. A napfejlécek helyén egy sáv jelenik meg, amely kiírja a teljes napot, a költségek számát és a napi összeget.',
  'help.guide.filter-costs.step.5':
    'A „CSV exportálás” (a tölcsér melletti letöltés ikon) minden költséget fájlba ment az eredeti összeggel, annak pénznemével és az átváltott összeggel.',
  'help.guide.filter-costs.result':
    'A szűrőket kombinálhatod, a napi csoportok pedig a megmaradó kiadások alapján frissülnek a saját összesítésükkel.',
  'help.guide.filter-costs.tip.1':
    'A rögzített befizetéseknek nincs nevük és kategóriájuk, ezért a keresés, a kategóriaszűrő és a „Nekem tartoznak” szűrő is elrejti őket. A napszűrő megtartja őket, a befizetés napjánál.',
  'help.guide.filter-costs.tip.2':
    'A „CSV exportálás” mindig az összes kiadást exportálja, a képernyőn beállított szűréstől függetlenül, kiadásonként egy sorban.',
  'help.guide.filter-costs.tip.3':
    'A „Szűrők visszaállítása”, amely aktív szűrő esetén a szűrőmenü alján jelenik meg, egyszerre kikapcsolja az összes szűrőt.',
  // settle-up
  'help.guide.settle-up.title': 'Ki kinek tartozik, és a tartozások rendezése',
  'help.guide.settle-up.goal':
    'Alakítsd a sok közös kiadást a lehető legkevesebb átutalássá, amely minden tartozást rendez, és rögzítsd az átutalásokat, amikor megtörténnek.',
  'help.guide.settle-up.step.1':
    'A jobb oldali oszlop „Elszámolás” kártyája felsorolja azokat az átutalásokat, amelyekkel minden tartozás rendeződne: ki kinek fizet (két profilképként, a nevek a buboréksúgóban), és mennyit. A fejlécben lévő szám mutatja, hány átutalás van még nyitva.',
  'help.guide.settle-up.step.2':
    'Egy átutalás melletti „Elszámol” gombbal teljesítettként rögzíted. Az átutalás eltűnik a kártyáról, az egyenlegek pedig frissülnek.',
  'help.guide.settle-up.step.3':
    'A rögzített átutalás egy sor a főkönyvben annak a napnak az alatt, amikor történt, „Fizetés” jelöléssel, a két utassal és az összeggel.',
  'help.guide.settle-up.step.4':
    'A sor mellett a ceruzával javíthatod a befizetést, a „Visszavonás” pedig érvényteleníti, és az átutalás visszakerül az „Elszámolás” kártyára.',
  'help.guide.settle-up.step.5':
    'A kártya fejlécében lévő „Fizetés hozzáadása” olyan átutalást rögzít, amely nem egy javaslatot követett. Válaszd ki a „Kitől” és a „Ki” értékét, az összeget, a pénznemét és a napot, amikor történt, ha szeretnéd, írj „Jegyzetet”, például a fizetés módjáról, majd kattints az ablak alján a „Fizetés hozzáadása” gombra.',
  'help.guide.settle-up.step.6':
    'A felső sáv „Elszámolás” gombja kérdés nélkül, egyszerre rögzíti az összes nyitott átutalást, például amikor a csoport az utazás végén minden tartozást rendez.',
  'help.guide.settle-up.result':
    'Minden rögzített átutalás egy sor a kiadáslistában, és eltávolít egy sort az „Elszámolás” kártyáról. Amikor a kártyán a „Mindenki kvittben van” felirat látszik, az utazás teljesen ki van fizetve.',
  'help.guide.settle-up.tip.1':
    'A kártya a legkevesebb szükséges átutalást mutatja, nem minden egyes tartozást: ha hárman körbe tartoznak egymásnak, ez egy vagy két fizetésre egyszerűsödik.',
  'help.guide.settle-up.tip.2':
    'Az „Elszámol” csak rögzíti az átutalást, pénzt nem küld. Fizess a szokásos módon, majd kattints az „Elszámol” gombra.',
  'help.guide.settle-up.tip.3':
    'Fizetni bármilyen pénznemben lehet, így teljesen rendben van, ha egy jenben fennálló tartozást euróban fizetsz meg: az ablakban külön pénznemválasztó van, és ezt az árfolyamot is rögzíti.',
  // final-budget
  'help.guide.final-budget.title': 'Mennyibe került az utazás az egyes utasoknak',
  'help.guide.final-budget.goal':
    'Nézd meg a személyenkénti számokat: a mai egyenleget és a valós, fejenkénti költséget.',
  'help.guide.final-budget.step.1':
    'Az „Egyenlegek” minden utazó helyzetét mutatják: zöld sáv jobbra, ha az utazás tartozik neki, piros sáv balra, ha ő tartozik az utazásnak, a név mellett pedig az összeg.',
  'help.guide.final-budget.step.2':
    'Az alatta lévő „Végső költségvetés” más kérdésre ad választ: nem arra, hogy most ki mennyivel tartozik, hanem arra, hogy mennyibe kerül az utazás az egyes utazóknak, amikor már minden vissza van fizetve.',
  'help.guide.final-budget.step.3':
    'Kattints egy névre a számítás megtekintéséhez: „Kifizetett kiadások”, alatta pedig „Nettó visszatérítések” és „Függőben lévő visszatérítések”.',
  'help.guide.final-budget.step.4':
    'A három sor alatt minden utazó neve alatt egy lista mutatja, milyen tételekből áll össze az adott sor: az általa kifizetett költségek, a már rögzített és a még nyitott átutalások. Minden lista összege pontosan megegyezik az azonos nevű sorral.',
  'help.guide.final-budget.result':
    'Az „Egyenlegek” azt mutatják, kinek tartoznak és ki tartozik ma. A „Végső költségvetés” azt mutatja, mennyibe kerül az utazás mindegyikőtöknek, ha minden tartozást rendeztetek.',
  'help.guide.final-budget.tip.1':
    'Egy befizetés rögzítése senkinek a végső költségvetését nem változtatja meg. Csak áthelyez egy összeget a függő visszatérítésektől a nettó visszatérítésekhez.',
  'help.guide.final-budget.tip.2':
    'A fizető nélküli kiadás egyik kártyába sem számít bele, ahogy az elszámolási javaslatokba sem.',
  // expense-from-booking
  'help.guide.expense-from-booking.title': 'Foglalásból kiadás',
  'help.guide.expense-from-booking.goal':
    'Kapcsold hozzá egy repülőjárat, szálloda vagy hely tényleges költségét ahhoz a tételhez, amelyhez tartozik.',
  'help.guide.expense-from-booking.step.1':
    'Keresd meg a foglalást a „Közlekedés” vagy a „Foglalások” fülön, és kattints a kártyája tetején lévő ceruzára.',
  'help.guide.expense-from-booking.step.2':
    'Görgess az űrlap vége felé a „Költségek” részhez. Itt találod a „Költség létrehozása” lehetőséget, amely előbb menti a foglalást, és a „Meglévő költség csatolása” lehetőséget egy olyan kiadáshoz, amely már szerepel a „Költségek” között.',
  'help.guide.expense-from-booking.step.3':
    'Kattints a „Költség létrehozása” gombra. A foglalás mentődik, az űrlap bezárul, és megnyílik a „Költségek” szerkesztő: névként a foglalás címével, a típusának megfelelő kategóriával, a kiadás napjaként pedig a foglalás napjával.',
  'help.guide.expense-from-booking.step.4':
    'Add meg az összeget és a pénznemet, azt, hogy ki fizetett, és a felosztást, ugyanúgy, mint bármelyik költségnél, majd kattints a „Költség hozzáadása” gombra. Ha újra megnyitod a foglalást, a költség a „Kapcsolt költségek” alatt látszik: a ceruzával szerkesztheted, a „Leválasztás, a költség megmarad” megszünteti a kapcsolatot, de a költséget megtartja, a kukával pedig törölheted.',
  'help.guide.expense-from-booking.result':
    'A foglaláson látszik a költsége, a költség pedig egy szokásos sor a „Költségek” fülön, fizetővel, felosztással és pénznemmel, mint bármelyik másik.',
  'help.guide.expense-from-booking.tip.1':
    'A foglalás törlésével a kapcsolódó kiadások is törlődnek, és a megerősítő kérdés ezt jelzi. A foglalás „Költségek” részében a „Költség eltávolítása” ennek az ellenkezője: a kiadás törlődik, a foglalás megmarad. A „Leválasztás, a költség megmarad” mindkettőt megtartja.',
  'help.guide.expense-from-booking.tip.2':
    'A helyek űrlapján is ugyanez a rész található, ott a „Költség létrehozása” előbb a helyet menti el.',
  // costs-table
  'help.guide.costs-table.title': 'Költségtervezés táblázatban',
  'help.guide.costs-table.goal':
    'Tekintsd át és módosítsd a kiadásokat táblázatban, kategóriák szerint rendezve, személyenként és naponként kiszámolva.',
  'help.guide.costs-table.step.1':
    'Kattints a „Táblázat” gombra, a sávban lévő „Lista” / „Táblázat” kapcsoló második ikonjára. A kiadáslista helyén ugyanezek a kiadások táblázatban jelennek meg, és a keresés meg a szűrők itt is működnek.',
  'help.guide.costs-table.step.2':
    'A táblázat kategóriák szerint van csoportosítva. Minden csoport fejlécében látod a nevét, a kiadások számát és a részösszeget; a fejlécre kattintva összecsukhatod a csoportot. Az oszlopok: „Név”, „Dátum”, „Összesen”, „Személyek” és „Nap”, majd az ezekből számolt, szürke hátterű „Személyenként”, „Naponta” és „Fő / Nap”. Az alsó „Összesen” sor mindent összead.',
  'help.guide.costs-table.step.3':
    'Kattints egy cellára, hogy közvetlenül módosítsd: egy nevet, egy végösszeget, a „Személyek” vagy a napok számát. Írd be az értéket, majd a mentéshez nyomj Entert vagy kattints máshová, a megszakításhoz pedig nyomd meg az Esc billentyűt; a dátumra kattintva megnyílik a naptár. A „Személyenként” és a többi számított oszlop azonnal frissül.',
  'help.guide.costs-table.step.4':
    'A lakattal jelölt összeg itt nem módosítható: valaki már kifizette, vagy más pénznemben rögzítették, és a buboréksúgó megmondja, melyik az ok. Rákattintva inkább a költség nyílik meg, így az egyenlegek és a rögzített árfolyam helyesek maradnak.',
  'help.guide.costs-table.step.5':
    'Egy kategória végén a „Költség hozzáadása” egy „Új bejegyzés” nevű sort ad hozzá, a kategória legutóbbi bejegyzésének dátumával. A név mezője már szerkeszthető, így rögtön átírhatod. Az összeget ugyanígy add meg.',
  'help.guide.costs-table.step.6':
    'Ebben a nézetben a jobb oldali oszlopban a „Kategóriánként” helyett az „Összegzés” látszik. A kiadásokat négyféleképpen összesíti: „Kategória”, „Nap”, „Fizető” (a még kifizetetlenekhez „Még nincs fizető” értékkel) és „Állapot” („Fizetve” a „Nyitott” mellett).',
  'help.guide.costs-table.result':
    'Minden kiadás a saját kategóriájában látszik, a személyenkénti és a napi összeggel. Ha egy cellában módosítasz egy végösszeget, a fenti kártyák és az „Összegzés” azonnal frissülnek.',
  'help.guide.costs-table.tip.1':
    'A „Költségek” ebben a böngészőben megjegyzi a nézetet: a táblázattal nyílik meg, amíg újra a „Lista” gombra nem kattintasz.',
  'help.guide.costs-table.tip.2':
    'Az „Egyéni” vagy „Blokk” felosztású kiadásnak nincs egységes személyenkénti része, ezért a „Személyenként” és a „Fő / Nap” értéke üres marad.',
  'help.guide.costs-table.tip.3':
    'A fizetőket, a felosztást, a megjegyzést és a nyugtákat magában a kiadásban szerkesztheted: egy sor végén a „További lehetőségek” menüben megtalálod a „Szerkesztés” és a sor eltávolításához a „Törlés” lehetőséget.',

  // ── Screen: trip-transports ───────────────────────────────────────────────────────────
  'help.ctx.trip-transports.title': 'Közlekedés',
  'help.ctx.trip-transports.summary':
    'Minden mód, amellyel a megállók között utazol: repülők, vonatok, buszok, autók, taxik, kerékpárok, hajóutak, kompok, kötélpályák és azok a tömegközlekedési kapcsolatok, amelyeket a TREK kikeres neked. A fül felsorolja őket. A terven is létrehozhatod és megtekintheted őket, és a térképen is megjelennek.',
  'help.ctx.trip-transports.bullet.1':
    'Ez a fül csak az utakat mutatja. A szállások, éttermek, események és jegyek a „Foglalások” fülön vannak, így ugyanaz a bejegyzés soha nem jelenik meg kétszer.',
  'help.ctx.trip-transports.bullet.2':
    'A felső sávban található a „Keresés”, a „Szűrő” az állapothoz, a típusokhoz és az utasokhoz, a három nézet („Kártyák”, „Lista” és „Idővonal”), a „Nézet beállításai” és az „Exportálás táblázatként (CSV)”, amely letölti a látható tartalmat. A jobb oldali „Közlekedés” gombbal kézzel adhatsz hozzá utat. Az előtte lévő ikonok, a „Foglalási visszaigazolások importálása” és az „Importálás az AirTrailből”, akkor jelennek meg, ha a szerver fel tudja dolgozni a visszaigazolásokat, vagy ha van csatlakoztatott AirTrail. Üres fülön ugyanezek a műveletek középen jelennek meg: „Közlekedés”, „Importálás fájlból” és AirTrail.',
  'help.ctx.trip-transports.bullet.3':
    'A fül a „Kártyák” nézetben nyílik meg: előbb a „Megerősítve”, aztán a „Függőben” csoport. Minden csoportot összecsukhatsz a címére kattintva. A tervezett tömegközlekedési kapcsolatoknak nincs állapota, ezért időrendben a megerősített utak között jelennek meg, hacsak a „Nézet beállításai” nem ad nekik saját csoportot „Automatikus tömegközlekedés” néven. A „Lista” napok szerint csoportosít, az „Idővonal” pedig az összes utat mutatja az utazás napjain.',
  'help.ctx.trip-transports.bullet.4':
    'A kártya felső sávjának színe az állapotot jelzi: zöld a megerősített, borostyánsárga a függőben lévő, kék a tervezett csatlakozás. Ebben a sávban van az állapotpont, a típus, a cím, a ceruza és a kuka. Alatta: „Dátum”, „Időpont”, „Foglalási kód”, „Útvonal”, valamint a légitársaság és a járatszám, illetve a vonatszám, a vágány és az ülőhely. A kártyára kattintva megnyílnak a részletei.',
  'help.ctx.trip-transports.bullet.5':
    'Közlekedést a terven is létrehozhatsz: a nap fejlécében lévő + gomb („Hozzáadás a naphoz”), vagy a fejlécen jobb gombbal kattintva a „Közlekedés hozzáadása” és a „Tömegközlekedés” közül választhatsz. A két megálló közötti menetidő-összekötő ugyanezt a keresést nyitja meg arra az egy szakaszra.',
  'help.ctx.trip-transports.bullet.6':
    'Ha egy közlekedésnek mindkét végpontja meg van adva, vonalat rajzol a térképre. Ezt a vonalat a napi tervben a sorának útvonal ikonjával vagy a részleteinél a „Térképen” lehetőséggel kapcsolhatod be. A napok fölötti eszköztár „Összes foglalási útvonal megjelenítése” gombja az egész utazás vonalait egyszerre kapcsolja be vagy ki.',
  // transports-list
  'help.guide.transports-list.title': 'A „Közlekedés” fül áttekintése',
  'help.guide.transports-list.goal': 'Értsd meg, mit mutat a lista, mielőtt bármit módosítanál rajta.',
  'help.guide.transports-list.step.1':
    'A „Közlekedés” az utazás egyik füle, a „Terv” után (és a „Túrák” után, ha az a bővítmény be van kapcsolva). Csak az utakat tartalmazza: a szállodák, éttermek, események és jegyek a „Foglalások” fülön vannak.',
  'help.guide.transports-list.step.2':
    'A sáv bal oldalán lévő „Keresés” gépelés közben szűri az utakat. A mellette lévő tölcsér, a „Szűrő”, megnyitja a lehetőségeket: „Állapot” a „Mind”, „Megerősítve” és „Függőben” értékkel, majd az összes használt típus a darabszámával. Jelölj be egy vagy több típust, ha csak azokat szeretnéd látni. A tölcséren lévő szám mutatja, hány szűrő aktív, a sáv pedig azt, hány út látszik, például 1 / 4. A menü alján a „Szűrők visszaállítása” újra az összes utat megjeleníti.',
  'help.guide.transports-list.step.3':
    'A mellette lévő „Kártyák”, „Lista” és „Idővonal” nézet a közlekedési eszközöket kártyákként, napok szerint csoportosított sorokként vagy az utazás napjain átívelő sávokként mutatja. A „Nézet beállításai” (a csúszkák ikon) alatt a „Kártyák” és a „Lista” nézethez a „Csoportosítás” és a „Rendezés”, az „Idővonal” nézethez pedig a sávok állíthatók be. A „Nézet visszaállítása” visszaállítja az alapértékeket. A „Kártyák” nézetben a „Tömegközlekedés külön szakaszban” beállítás a tervezett csatlakozásokat az „Automatikus tömegközlekedés” alatt mutatja.',
  'help.guide.transports-list.step.4':
    'Minden kártyán az összes részlet látható. A felső sáv „Megerősítve” állapotnál zöld, „Függőben” állapotnál borostyánsárga, és mutatja az állapotjelző pontot, a típust és a címet. Alatta a „Dátum” mutatja, mely napokra terjed ki, a dátumokkal együtt. Ezután következik az „Időpont”, a „Foglalási kód”, az „Útvonal” a típus ikonjával a megállók között, valamint a légitársaság és a járatszám, illetve a vonatszám, a vágány és az ülés. A részletek megnyitásához kattints a kártyára.',
  'help.guide.transports-list.step.5':
    'Az állapotpontra kattintva az utat „Függőben” és „Megerősítve” állapot között váltod; az elemleírás megmondja, merre, például „Függőbe állítás”. A fejlécben lévő ceruza megnyitja a közlekedés űrlapját, a kuka pedig a „Foglalás törlése?” kérdés után törli; a kérdés felsorolja, mi törlődik, a kapcsolódó költségeket is beleértve.',
  'help.guide.transports-list.result':
    'Minden kártyán látod, hogy az út le van-e foglalva, a sávval pedig bármikor szűrheted vagy rendezheted a listát.',
  'help.guide.transports-list.tip.1':
    'A fül megjegyzi a beállításaidat: a nézetet, a csoportosítást és a rendezést ebben a böngészőben, az összecsukott szakaszokat utazásonként, a szűrőket pedig a böngészőlap bezárásáig.',
  'help.guide.transports-list.tip.2':
    'A „Foglalási visszaigazolások importálása” és az „Importálás az AirTrailből”, a „Közlekedés” előtti két ikon csak akkor jelenik meg, ha a szerver képes beolvasni a visszaigazolásokat, illetve ha AirTrail-példány van csatlakoztatva. Nélkülük kézzel vagy a tömegközlekedési keresővel töltheted fel a listát.',
  // add-transport
  'help.guide.add-transport.title': 'Közlekedés hozzáadása egy naphoz',
  'help.guide.add-transport.goal':
    'Add hozzá ahhoz a naphoz a közlekedést, amely az egyik megállótól a következőig visz.',
  'help.guide.add-transport.step.1':
    'Az utazás napjának fejlécében kattints a + gombra („Hozzáadás a naphoz”), és válaszd a „Közlekedés hozzáadása” lehetőséget. A nap fejlécén jobb gombbal kattintva ugyanez a menü jelenik meg. Az űrlap már kitöltött nappal nyílik meg.',
  'help.guide.add-transport.step.2':
    'A fejlécben lévő típusgomb a közlekedési módot mutatja, alapértelmezés szerint „Repülés”. Rákattintva választhatsz: „Repülés”, „Vonat”, „Busz”, „Autó”, „Taxi”, „Kerékpár”, „Hajóút”, „Komp”, „Kötélpálya” vagy „Egyéb”, és az űrlap ehhez igazodik: repülésnél minden megálló repülőtér, vonatnál állomások sora, hajóútnál „Behajózás”, „Kikötő” és „Kihajózás”, autónál „Felvétel”, „Visszaadás” és „Megállók útközben”.',
  'help.guide.add-transport.step.3':
    'A címet közvetlenül a felső sávba írd, oda, ahol a szürke példaszöveg áll. Ez az egyetlen kötelező mező: amíg ki nem töltöd, alatta „Cím *” áll, a „Hozzáadás” gomb pedig szürke marad. Olyan címet adj, amelyet egy indulási táblán is felismernél.',
  'help.guide.add-transport.step.4':
    'Az „Útvonal” alatt a „Honnan” és a „Hová” mezőbe állomást, kikötőt vagy címet adhatsz meg. Gépelés előtt az utazás saját helyeit kínálja fel. A kereséshez írj be legalább három betűt, és válassz egy találatot. Ha csak beírsz egy nevet, de nem választod ki a találatok közül, nem mentődik el, és a térképen sem jelenik meg semmi.',
  'help.guide.add-transport.step.5':
    'A „Dátum” és a „Kezdési idő” az indulás, a „Befejezés dátuma” és a „Befejezési idő” az érkezés időpontja; ha az út másnap érkezik, ott a következő napot add meg. A lejjebb lévő „Foglalási kód” és „Jegyzetek” mező nem kötelező. A fejlécben lévő „Függőben” gombra kattintva „Megerősítve” állapotra válthatod.',
  'help.guide.add-transport.step.6': 'Kattints a „Hozzáadás” gombra.',
  'help.guide.add-transport.result':
    'A közlekedés sorként jelenik meg a napon, az időpontjának megfelelő helyen a megállók között, a „Közlekedés” fülön pedig kártyaként a „Függőben” vagy a „Megerősítve” alatt.',
  'help.guide.add-transport.tip.1':
    'A sor a kezdési ideje szerint kerül a helyére, az utolsó korábban kezdődő megálló után. A fogantyújánál fogva áthúzhatod a nap egy másik pontjára vagy egy másik napra.',
  'help.guide.add-transport.tip.2':
    'A jegyet a „Fájl” alatti „Fájl csatolása” gombbal adhatod hozzá. A „Költségek” alatti „Költség létrehozása” menti a foglalást, és megnyitja a költségszerkesztőt a viteldíjhoz.',
  'help.guide.add-transport.tip.3':
    'Az űrlap első blokkjában, az „Utasok” résznél adhatod meg, ki utazik ezzel a járművel. Ha az utazásnak egynél több tagja van, és egy közlekedési tételnél meg van adva valaki, a fül „Szűrő” menüjében az „Utasok” is megjelenik, így egyetlen személy útjait is megnézheted.',
  // import-transport-file
  'help.guide.import-transport-file.title': 'Járat importálása az e-jegyből',
  'help.guide.import-transport-file.goal':
    'A TREK olvassa ki a repülést, a vonatot vagy a kompot a szolgáltatótól kapott jegyből, te pedig mentés előtt ellenőrizd.',
  'help.guide.import-transport-file.step.1':
    'A „Közlekedés” fül sávjában kattints a „Közlekedés” előtti letöltés ikonra („Foglalási visszaigazolások importálása”). Megnyílik az ilyen nevű ablak, ugyanaz, mint a „Foglalások” fülön. Üres fülön a középen lévő „Importálás fájlból” ugyanezt teszi.',
  'help.guide.import-transport-file.step.2':
    'Húzd a jegyet a mezőre, vagy kattints rá, és válaszd ki a fájlt: EML, PDF, PKPass, HTML vagy TXT, legfeljebb öt fájl, egyenként 10 MB-ig, valamint jegyfotók (JPG, PNG, WEBP), ha a szervereden van AI-modell a feldolgozásukhoz. A mezőben látod a kiválasztott fájlok nevét.',
  'help.guide.import-transport-file.step.3':
    'Kattints az „Importálás” gombra. Az ablak azonnal bezárul, a fájl beolvasása a háttérben történik.',
  'help.guide.import-transport-file.step.4':
    'Jobbra lent egy kártya mutatja a folyamatot a fájl neve alatt. A „Fájlok feldolgozása…” felirat pipára vált, amikor a beolvasás kész, és a kártyán megjelenik az „Importálás” gomb. Kattints rá.',
  'help.guide.import-transport-file.step.5':
    'A repülőjárat a „Közlekedés hozzáadása” űrlapon nyílik meg, már kitöltve: a típuscímke „Repülés”, a fejlécben címként a légitársaság és a járatszám, az „Útvonal” alatt mindkét repülőtér „Indulás” és „Érkezés” jelöléssel, az időpontjaikkal és időzónáikkal, a „Légitársaság” és a „Járatszám”, a „Foglalási kód”, a „Fájl” alatt pedig a jegy. Ellenőrizd, és kattints a „Hozzáadás” gombra.',
  'help.guide.import-transport-file.result':
    'A járat kártyaként jelenik meg a „Közlekedés” fülön a „Függőben” alatt, és sorként az indulás napján, a jeggyel a „Fájl” alatt. Ha mindkét repülőtér ismert, a járat ívként látszik a térképen.',
  'help.guide.import-transport-file.tip.1':
    'A két fül ugyanazt az importálást használja. Ha egy fájlban egy járat és egy szálloda is szerepel, a járat a „Közlekedés hozzáadása”, majd a szálloda az „Új foglalás” ablakban nyílik meg, függetlenül attól, melyik fülön kezdted.',
  'help.guide.import-transport-file.tip.2':
    'A repülőtereket a kódjuk alapján helyezzük el. Ha egy állomást vagy kikötőt nem sikerült megtalálni, a neve borostyánsárgával jelenik meg a jobb alsó sarokban lévő importkártyán. Mielőtt a „Hozzáadás” gombra kattintasz, válaszd ki kézzel az „Útvonal” alatt, különben a közlekedési tétel nem jelenik meg a térképen.',
  // plan-transit
  'help.guide.plan-transit.title': 'Tömegközlekedési kapcsolat tervezése',
  'help.guide.plan-transit.goal':
    'Keresd ki a TREK-kel a valódi vonat- és buszjáratokat egy nap két pontja között, és tedd be a tervbe a kiválasztottat.',
  'help.guide.plan-transit.step.1':
    'Kattints a nap fejlécében a + jelre, és válaszd a „Tömegközlekedés” lehetőséget. A kereső az adott napra nyílik meg: a nap címkeként látszik a fejlécben, a mellette lévő „Kézzel” és „Automatikus” pedig a kereső és a szokásos űrlap között vált.',
  'help.guide.plan-transit.step.2':
    'A „Kitől” és a „Ki” mezőbe megállót vagy állomást adhatsz meg. Amíg a mező üres, a TREK a nap szállását, a nap foglalásainak állomásait és repülőtereit, valamint a nap saját megállóit javasolja. Ha beírsz két betűt, helyette a menetrend állomásai között keres. A két mező közötti „Csere” gomb felcseréli a „Kitől” és a „Ki” értékét.',
  'help.guide.plan-transit.step.3':
    'Az „Indulás” vagy az „Érkezés” egy időponttal együtt megadja, mikor szeretnél utazni, a „Legjobb útvonal”, a „Kevesebb átszállás” vagy a „Kevesebb gyaloglás” pedig azt, milyen sorrendben jelenjenek meg a találatok.',
  'help.guide.plan-transit.step.4':
    'Az alatta lévő címkék mutatják, mely közlekedési módok használhatók: „Vonat”, „Metró”, „Villamos”, „Busz”, „Komp” és „Kötélpálya”. Kapcsolj ki egyet, ha ki akarod zárni; legalább egy bekapcsolva marad. Ezután kattints a „Keresés” gombra.',
  'help.guide.plan-transit.step.5':
    'Minden találatnál látod az indulást és az érkezést, a menetidőt, az átszállások számát és a gyaloglás hosszát, valamint a járatokat jelvényként, a saját színükkel, ha a menetrend tartalmazza. Kattints egy találatra, hogy kibontsd, és lásd az egyes szakaszokat a fel- és átszállási megállókkal, a vágányokkal és a járatok közötti gyalogos szakaszokkal.',
  'help.guide.plan-transit.step.6': 'Kattints a „Hozzáadás a naphoz” gombra.',
  'help.guide.plan-transit.result':
    'A kapcsolat egy sor a napon a járatok jelvényeivel. A nyílra kattintva látod az egyes szakaszokat. A „Közlekedés” fülön is megjelenik kék kártyaként a megerősített utak között.',
  'help.guide.plan-transit.tip.1':
    'A járatokat a Transitous adja, egy ingyenes közösségi szolgáltatás, amely nyilvános menetrendi adatokat használ: nem kell hozzá se kulcs, se fiók. Az adminisztrátor beállíthatja, hogy a keresés helyette a Google-t használja.',
  'help.guide.plan-transit.tip.2':
    'Nincs találat? A menetrendi adatok egy adott régiót és időszakot fednek le. Próbálj másik időpontot, kapcsolj be több közlekedési módot, vagy válassz állomást magának a helynek a helyett. Az üzenet megnevezi a válaszoló szolgáltatást. Dátum nélküli utazásnál nincs nap, amelyre keresni lehetne, ezért csak a szokásos űrlap érhető el.',
  'help.guide.plan-transit.tip.3':
    'Ugyanez a kereső egyetlen szakaszhoz is megnyitható: kattints két megálló között a menetidőt jelző összekötőre, és válaszd a „Tömegközlekedés” lehetőséget. A kiindulási pont, a cél és az indulási idő már ki van töltve.',
  // change-transit-route
  'help.guide.change-transit-route.title': 'Tervezett járat megnyitása és módosítása',
  'help.guide.change-transit-route.goal':
    'Nézd át a járatot szakaszonként, nevezd át, vagy keresd ki újra az útvonalat.',
  'help.guide.change-transit-route.step.1':
    'A „Közlekedés” fülön a tervezett csatlakozás kék felső sávos kártya, amely időrendben szerepel a megerősített közlekedési tételek között. Ha a „Nézet beállításai” alatt a „Tömegközlekedés külön szakaszban” be van kapcsolva, akkor az „Automatikus tömegközlekedés” alatt látod. Kattints a kártyára. A csatlakozás foglalásként nyílik meg.',
  'help.guide.change-transit-route.step.2':
    'A felső csempék mutatják az indulást és az érkezést a megállókkal, az „Időtartam”, az „Átszállások” és a „Gyalog” értékét. Alattuk az „Útiterv” soronként mutatja a csatlakozást az időpontokkal, a vágányokkal és a járatok közötti gyalogos szakaszokkal.',
  'help.guide.change-transit-route.step.3':
    'A foglalás alján lévő „Útvonal módosítása” újra megnyitja a keresést, már kitöltve a kapcsolat két végpontjával és a napjával.',
  'help.guide.change-transit-route.step.4':
    'Kattints a „Keresés” gombra, nyiss meg egy másik járatot, és kattints a „Hozzáadás a naphoz” gombra; ez lecseréli a régit. A foglalás alján, a jobb szélen lévő „Szerkesztés” ehelyett a szokásos közlekedési űrlapot nyitja meg, ahol a „Foglalási kód”, az utazók, a jegyzetek és a fájlok szerkeszthetők.',
  'help.guide.change-transit-route.result':
    'Az út mostantól az új útitervet használja, a kártyája pedig a „Közlekedés” fülön az új járatokat és időpontokat mutatja.',
  'help.guide.change-transit-route.tip.1':
    'Ha a foglalás fejlécében a címre kattintasz, átnevezheted a járatot az útvonal módosítása nélkül. A jegyzeteit a „Szerkesztés” gombbal megnyíló közlekedési űrlapon írhatod meg.',
  'help.guide.change-transit-route.tip.2':
    'A foglalás alján lévő kuka megerősítés után törli a járatot; a nap megállói megmaradnak.',
  // leg-travel-mode
  'help.guide.leg-travel-mode.title': 'Egy szakasz közlekedési módjának módosítása',
  'help.guide.leg-travel-mode.goal':
    'Egy autós nap egyik szakaszát állítsd gyaloglásra, vagy tervezd meg tömegközlekedési kereséssel.',
  'help.guide.leg-travel-mode.step.1':
    'A megállók közötti összekötők csak akkor jelennek meg, ha a nap útvonala be van kapcsolva. Kattints a nap fejlécére a megnyitásához, majd a megállók alatti sávban az „Útvonal” gombra.',
  'help.guide.leg-travel-mode.step.2':
    'Minden összekötő mutatja az adott szakasz menetidejét és távolságát, annak a közlekedési módnak az ikonjával, amellyel a TREK tervezte: autó ikon az autózáshoz, láb a gyalogláshoz, kerékpár a kerékpározáshoz.',
  'help.guide.leg-travel-mode.step.3':
    'Kattints az összekötőre. A menüben az „Autó”, a „Gyalog” és a „Kerékpár”, erre az egy szakaszra a „Tömegközlekedés”, valamint a „Napi alapértelmezett” lehetőség közül választhatsz.',
  'help.guide.leg-travel-mode.step.4':
    'Válaszd a „Gyalog” lehetőséget. Csak ez a szakasz változik, a nap többi része megtartja a saját közlekedési módját.',
  'help.guide.leg-travel-mode.result':
    'A szakasznál a gyalogos ikon és a gyaloglási idő látszik, a nap többi szakasza pedig megtartja a nap közlekedési módját.',
  'help.guide.leg-travel-mode.tip.1':
    'A közlekedési mód a szakaszhoz tartozik, nem a naphoz: a nap „Autó”, „Gyalog” és „Kerékpár” gombjai soha nem írják felül a kézzel beállított szakaszt. A „Napi alapértelmezett” hatására a szakasz újra ezeket a gombokat követi.',
  'help.guide.leg-travel-mode.tip.2':
    'Ugyanebben a menüben a „Tömegközlekedés” pontosan erre a szakaszra nyitja meg a járatkeresőt, a két végponttal és az indulási idővel már kitöltve.',
  'help.guide.leg-travel-mode.tip.3':
    'Az időket egy nyilvános útvonaltervező számolja valódi utak és gyalogutak alapján. Ha egy szakaszt nem tud kiszámolni, az egyenes vonal marad, és nem jelenik meg mellette idő.',
  // edit-transport
  'help.guide.edit-transport.title': 'Közlekedés módosítása vagy törlése',
  'help.guide.edit-transport.goal':
    'Javíts ki egy időpontot, vágányt vagy foglalási kódot, vagy töröld a közlekedési tételt az utazásból.',
  'help.guide.edit-transport.step.1':
    'A napi tervben a közlekedés a megállók közötti sor, a típusa szerint színezve. Kattints rá a foglalás megnyitásához: felül gombként látod az állapotot, a típust, a napokat és a „Foglalási kód” mezőt (másológombbal), alatta pedig az indulási és érkezési időpontokat a repülőterekkel vagy állomásokkal.',
  'help.guide.edit-transport.step.2':
    'A foglalás alján lévő „Szerkesztés” azt az űrlapot nyitja meg, amellyel létrehozták, a fejlécben a cím fölött „Közlekedés szerkesztése” felirattal. Itt mindent módosíthatsz: a címet, az állapot- és a típusgombot, az útvonalat, a napokat és időpontokat, a „Foglalási kód” mezőt.',
  'help.guide.edit-transport.step.3':
    'A repülés útvonala repülőterek, a vonaté állomások, a hajóúté kikötők sorozata. A „Megálló hozzáadása” (hajóútnál „Kikötő hozzáadása”) újabbat illeszt be közéjük, és minden szakasz megtartja a saját időpontjait és a saját járat- vagy vonatszámát.',
  'help.guide.edit-transport.step.4':
    'Kattints a „Frissítés” gombra. A közlekedés teljes törléséhez használd ugyanennek a sávnak a bal oldalán lévő kukát, a foglalás alján lévő kukát vagy a „Közlekedés” fülön a kártyáján lévő kukát, majd erősítsd meg.',
  'help.guide.edit-transport.result':
    'A módosítás mindenhol megjelenik, ahol a közlekedés szerepel: a „Közlekedés” fülön, azon a napon, amikor közlekedik, és a vonalán a térképen.',
  'help.guide.edit-transport.tip.1':
    'Ugyanez az űrlap két helyről is megnyitható: a napi terv egy sorából megnyíló foglalás „Szerkesztés” gombjával, és a „Közlekedés” fülön a kártya ceruzájával. A tervezett tömegközlekedési járat is foglalásként nyílik meg; ott az „Útvonal módosítása” újra megnyitja a keresőt, a „Szerkesztés” pedig ezt az űrlapot.',
  'help.guide.edit-transport.tip.2':
    'Ha egy közlekedést másik napra tennél, ehhez nem kell az űrlap: húzd át a sorát az egyik napkártyáról a másikra.',
  // transport-on-map
  'help.guide.transport-on-map.title': 'Közlekedés megjelenítése a térképen',
  'help.guide.transport-on-map.goal': 'Egy repülőút, autós út vagy csatlakozás tényleges útvonalának megtekintése.',
  'help.guide.transport-on-map.step.1':
    'Ha egy közlekedésnek mindkét végpontja meg van adva, a napi tervben a sorában kis útvonal ikon jelenik meg. Kattints rá; az elemleírása ekkor „Foglalási útvonalak elrejtése” lesz.',
  'help.guide.transport-on-map.step.2':
    'Az útvonal megjelenik a térképen, mindkét végén egy kapszula alakú jelölővel, amelyen a közlekedési eszköz ikonja látszik.',
  'help.guide.transport-on-map.step.3':
    'Kattints egy végponti jelölőre, és a foglalás megnyílik a térkép fölött. A fejlécében az állapot, a típus, a napok és a „Foglalási kód” látszik. Alattuk az időpontok a repülőterekkel vagy állomásokkal, a légitársaság és a járatszám. A bezáráshoz kattints a fejléc „Bezárás” gombjára.',
  'help.guide.transport-on-map.step.4':
    'A napok fölötti eszköztár útvonal ikonja egyszerre az egész utazásra vonatkozik: „Összes foglalási útvonal megjelenítése”, illetve „Összes foglalási útvonal elrejtése”, ha újra el akarod rejteni őket.',
  'help.guide.transport-on-map.step.5':
    'A tervezett tömegközlekedési járatnak nincs saját útvonal ikonja. A nap „Útvonal” kapcsolója rajzolja ki, ezért az „Összes foglalási útvonal elrejtése” nem rejti el, amíg az adott nap útvonala be van kapcsolva.',
  'help.guide.transport-on-map.result':
    'Az útvonalak megjelennek a térképen, mindkét végükön egy jelölővel, és addig ott maradnak, amíg ki nem kapcsolod őket.',
  'help.guide.transport-on-map.tip.1':
    'A repülőutak, hajóutak és kompok ívként jelennek meg. Az autó, a busz, a taxi és a kerékpár a valódi utakat követi. A vonatok és a tervezett csatlakozások azokon az állomásokon haladnak át, ahol megállnak.',
  'help.guide.transport-on-map.tip.2':
    'A megerősített foglalás folytonos, a függőben lévő szaggatott vonal. Az „Útvonal-címkék a foglalásokhoz” beállítás a végpontjelölőkön a repülőtér kódját vagy az állomás nevét mutatja.',
  'help.guide.transport-on-map.tip.3':
    'Az „Összes foglalási útvonal megjelenítése” nem a már látható útvonalakhoz ad hozzá: felülírja azt, amit az egyes ikonokkal beállítottál. Megnyomása után vagy minden útvonal látszik, vagy egyik sem.',
  // airtrail-import
  'help.guide.airtrail-import.title': 'Járatok importálása az AirTrailből',
  'help.guide.airtrail-import.goal':
    'Importáld egyszerre az utazásba az AirTrailben már meglévő járataidat, és utána tartsd őket naprakészen az AirTrailből.',
  'help.guide.airtrail-import.step.1':
    'Ha az AirTrail bővítmény be van kapcsolva, és a példányod csatlakoztatva van a Beállítások „Integrációk” részében, a „Közlekedés” fül sávjában a „Közlekedés” előtt megjelenik egy repülő ikon, az „Importálás az AirTrailből”. Kattints rá.',
  'help.guide.airtrail-import.step.2':
    'Az „Importálás az AirTrailből” két csoportban listázza a fiókod járatait. „Az utazás ideje alatt” csoportban az utazás időszakába eső járatok vannak, előre bejelölve. Az „Egyéb járatok” a többit tartalmazza, bejelölés nélkül. Az utazásban már szereplő járat szürkén jelenik meg „Importálva” jelöléssel.',
  'help.guide.airtrail-import.step.3':
    'Minden sor egy jelölőnégyzet a légitársasággal és a járatszámmal, a két repülőtérrel és a dátummal. Egy sorra kattintva hozzáadhatod vagy kihagyhatod a járatot. Az „Egyéb járatok” alatt lévők csak akkor kerülnek importálásra, ha bejelölöd őket.',
  'help.guide.airtrail-import.step.4':
    'A csatlakozó járatok csoportosítva jelennek meg: mindegyik egy napon belül arról a repülőtérről indul, ahol az előző leszállt. Az alatta lévő jelölőnégyzet („Importálás egyetlen járatként, átszállással itt:” és a repülőtér) már be van jelölve. Hagyd bejelölve, ha egyetlen átszállásos foglalást szeretnél, vagy töröld a jelölést, ha a szakaszokat külön járatként importálnád.',
  'help.guide.airtrail-import.step.5':
    'Kattints a jobb alsó gombra, amelyen a kipipált járatok száma látszik, például „2 importálása”. Az ezt követő üzenet jelzi, hány járat importálódott.',
  'help.guide.airtrail-import.step.6':
    'A járatok kártyaként jelennek meg a „Megerősítve” alatt, mindegyik címe mellett kék AirTrail címkével, valamint sorként azokon a napokon, amikor közlekednek. Egy átszállásos út egyetlen kártya, és az útvonala az átszállási helyen halad át.',
  'help.guide.airtrail-import.result':
    'Az AirTrailből érkezett járatok kártyaként jelennek meg a „Közlekedés” fülön és sorként a napjaikon, mindegyik AirTrail címkével, amely jelzi, honnan származik.',
  'help.guide.airtrail-import.tip.1':
    'Az a járat, amely ugyanazzal a számmal és dátummal már szerepel az utazásban, kimarad, és egy üzenet jelzi, hány ilyen volt. A napok fölötti eszköztár visszavonás nyila a teljes importálást visszavonja.',
  'help.guide.airtrail-import.tip.2':
    'Az adatok elsődleges forrása továbbra is az AirTrail. A TREK az utazás megnyitásakor és a háttérben néhány percenként lekéri a módosításokat. Az AirTrailben törölt járat kártyája a TREK-ben megmarad, a címkéje pedig „Nincs szinkronizálva” lesz. A TREK-ben végzett módosítások csak akkor kerülnek vissza az AirTrailbe, ha az Integrációk alatt be van kapcsolva a „Módosítások visszaírása az AirTrailbe”.',
  'help.guide.airtrail-import.tip.3':
    'Az összevont csatlakozás nem egyetlen AirTrail-járat, amelyet szinkronizálni lehetne, ezért egyszeri importálásként kerül be: megtartja a kék címkét, és ha fölé viszed az egeret, ezt jelzi is. Ugyanez történik egy szinkronizált járattal, ha kézzel megállót adsz hozzá.',

  // ── Screen: trip-roadtrip ─────────────────────────────────────────────────────────────
  'help.ctx.trip-roadtrip.title': 'Autós út',
  'help.ctx.trip-roadtrip.summary':
    'A terv egyetlen autóútként: ugyanazok a napok és helyek, megállókként összekötve a köztük lévő vezetési szakaszokkal, a bal oszlop sávjában és a térképen. Megmutatja a távolságot és a vezetési időt, azt, hol kell tankolnod, és mi van az út mentén.',
  'help.ctx.trip-roadtrip.bullet.1':
    'A bal oszlop tetején a „Nap” és az „Autós út” vált a napi terv és a vezetés között. Semmi sem másolódik és semmi sem változik: a „Nap” pontosan úgy mutatja a tervet, ahogy volt.',
  'help.ctx.trip-roadtrip.bullet.2':
    'A sáv tetején az utazás összesítése látszik: „Távolság”, „Vezetési idő” és „Megállók”. Alatta minden autós napnak saját kártyája van: egy csempén a nap sorszáma és dátuma, utána gombok a kilométerekkel és a vezetési idővel, a megállók számával, azzal, amin az út áthalad, és egy „Nyomvonal” jelvény. A lefoglalt repülés, vonat vagy komp külön kártyaként jelenik meg a sorozatban.',
  'help.ctx.trip-roadtrip.bullet.3':
    'A számozott megálló olyan hely, amely miatt az adott napon útnak indulsz. Az útközbeni megálló, például tankolás, töltés vagy pihenő, szám helyett a típusa ikonját mutatja, és nem számít bele a számozásba. Egy számra kattintva módosíthatod, melyik fajta legyen, a „Megálló” jelvényre kattintva beállíthatod, mennyi ideig maradsz, egy megállót húzva pedig a napján belül vagy másik napra helyezheted át.',
  'help.ctx.trip-roadtrip.bullet.4':
    'Két megálló között egy vezetési sáv mutatja a szakasz hosszát és idejét. Kattints rá az „Útvonalak ehhez a szakaszhoz” megnyitásához, vagy kattints az útvonalra a térképen, hogy a szakaszt egy köztes ponton át vezesd.',
  'help.ctx.trip-roadtrip.bullet.5':
    'A jobb oldali oszlop „Az útvonalon” nézetre vált: egy sorban választod ki, mit keresel és melyik napon, megadod a sáv szélességét, majd „Keresés”. A találat pluszgombja („Hozzáadás”) a helyet az út azon pontjára teszi, ahol ténylegesen elhaladsz mellette, egy szállodánál pedig az ágy ikon szállást ad hozzá. A „Kézzel” gombbal olyan helyet adhatsz hozzá, amelyet a keresés nem talált meg, a cím melletti három ponttal pedig Google Maps-útvonalat importálhatsz.',
  'help.ctx.trip-roadtrip.bullet.6':
    'Alatta a „Vezetési beállítások”: a korlátok, az autó és a hatótávja, a napi vezetési idők, a kerülendők, a vonal megjelenítése, és az, hogy a térképen látszódjanak-e az aktuális figyelmeztetések. Ezek az utazáshoz tartoznak, így mindenki ugyanazzal az autóval tervez.',
  // roadtrip-mode
  'help.guide.roadtrip-mode.title': 'Az utazás egyetlen autós útként',
  'help.guide.roadtrip-mode.goal': 'Kapcsold a tervet autós út módba, és ismerd meg, mit mutat a sáv.',
  'help.guide.roadtrip-mode.step.1':
    'Kattints az „Autós út” elemre a bal oszlop tetején lévő „Nap” és „Autós út” kapcsolón. A napi terv helyére a vezetés kerül, a térkép pedig minden olyan napot megmutat, amelyhez útvonal tartozik.',
  'help.guide.roadtrip-mode.step.2':
    'A sáv tetején lévő kártya a teljes utazást összesíti: „Távolság”, „Vezetési idő” és „Megállók”. A napok görgetése közben is a helyén marad.',
  'help.guide.roadtrip-mode.step.3':
    'Alatta minden autós napnak saját kártyája van; az autózás nélküli napok kimaradnak. A kártya fejlécében a nap sorszáma látszik, alatta a dátum, majd gombok az autóút távolságával és idejével, valamint az aznapi megállók számával.',
  'help.guide.roadtrip-mode.step.4':
    'A kártyán belül a nap sorozatként jelenik meg: minden helynek számozott megálló, minden pár között egy vezetési szakasz, a jobb szélen pedig az érkezési idő. A lefoglalt repülés, vonat vagy komp saját kártyaként jelenik meg a sorozatban.',
  'help.guide.roadtrip-mode.step.5':
    'Egy nap fejlécére kattintva összecsukhatod; a végén lévő nyíl elfordul. Az összecsukott nap a térképről is eltűnik. Újabb kattintással ismét megjelenik.',
  'help.guide.roadtrip-mode.result':
    'A bal oszlopban a vezetés látszik, a térkép pedig annak minden napját mutatja. A „Nap” gombbal azonnal, változatlan formában visszatérhetsz a tervhez.',
  'help.guide.roadtrip-mode.tip.1':
    'A választást a fiókod utazásonként menti, így újratöltés után, másik böngészőben vagy másik eszközön is autós út nézetben nyílik meg az utazás.',
  'help.guide.roadtrip-mode.tip.2':
    'A kapcsoló csak akkor jelenik meg, ha egy adminisztrátor az adminfelület „Bővítmények” részében bekapcsolta az „Autós út” bővítményt.',
  'help.guide.roadtrip-mode.tip.3': 'Telefonon nincs kapcsoló: a bővítmény saját „Autós út” fület ad a „Terv” mellé.',
  // roadtrip-stops
  'help.guide.roadtrip-stops.title': 'Megállók útközben, és meddig maradsz',
  'help.guide.roadtrip-stops.goal':
    'Tegyél egy helyet az autós úton útközbeni megállóvá, és add meg, mennyi ideig tartanak a megállók.',
  'help.guide.roadtrip-stops.step.1':
    'Kattints a sávban egy megálló előtti számra. A felirata „Legyen útközbeni megálló”, és alatta színes korongok sorában megjelennek a megállótípusok.',
  'help.guide.roadtrip-stops.step.2':
    'Válassz típust. Ha egy korong fölé viszed az egeret, megjelenik a neve: „Szállás”, „Üzemanyag”, „Töltés”, „Pihenőhely”, „Kemping”, „Étkezés” vagy „Látnivalók”. A szám helyére a típus ikonja kerül, az alatta lévő megállók pedig újraszámozódnak.',
  'help.guide.roadtrip-stops.step.3':
    'Az útközbeni megálló nem úti cél, ezért a nap fejléce eggyel kevesebb megállót számol.',
  'help.guide.roadtrip-stops.step.4':
    'Kattints újra az ikonra („Megálló típusának módosítása”), és válaszd a „Vissza úti céllá” lehetőséget, hogy a megálló visszakapja a sorszámát.',
  'help.guide.roadtrip-stops.step.5':
    'Minden megállónál ott a „Megálló” jelvény, amelyen plusz jel látszik, amíg nincs tervezett idő. Rákattintva megnyílik az „Idő ezen a megállón”.',
  'help.guide.roadtrip-stops.step.6':
    'A hosszt a csúszkával, a mínusz és plusz gombokkal vagy valamelyik előre beállított értékkel adhatod meg. Az „Indulás” ennek megfelelően változik, az „Érkezés” viszont az autós út érkezési idején marad. Ezután kattints a „Mentés” gombra.',
  'help.guide.roadtrip-stops.result':
    'A módosított megálló „Megálló” jelvényén megjelenik az új időtartam, és az utána következő összes érkezési idő ehhez igazodik. Ha egy megállót átállítottál egy típusra, majd vissza, ismét számozott úti cél lesz.',
  'help.guide.roadtrip-stops.tip.1':
    'A tartózkodási idő a helyhez tartozik, nem egy látogatáshoz: ha egy hely két napon is szerepel, mindkét napon ugyanannyi ideig tart.',
  'help.guide.roadtrip-stops.tip.2':
    'Az útközbeni megállók a napi nézetben is megjelennek. Ha a „Vezetési beállítások” „Szervizmegállók” részében kikapcsolod a „Megjelenítés a Napok nézetben is” opciót, csak az „Autós út” nézetben maradnak.',
  'help.guide.roadtrip-stops.tip.3': 'Ugyanebben az ablakban a „Nincs tartózkodás” ismét eltávolítja az időt.',
  'help.guide.roadtrip-stops.tip.4':
    'Kattints egy útközbeni megállóra vagy egy lefoglalt éjszakára, hogy megnyíljon a kártyája a térkép fölött. Bekapcsolt „Autós út” módban az ott lévő „Szerkesztés” a helyűrlap helyett a kereső által használt tömör ablakot nyitja meg, és abban a „További részletek” nyitja meg a teljes űrlapot.',
  // roadtrip-corridor
  'help.guide.roadtrip-corridor.title': 'Tankolás, étkezés és szállás keresése az útvonal mentén',
  'help.guide.roadtrip-corridor.goal':
    'Keress azon az úton, amelyen ténylegesen haladsz, és a találatot add hozzá a megfelelő szakaszhoz.',
  'help.guide.roadtrip-corridor.step.1':
    'Az „Amit keresel” alatt nyisd meg a listát, és jelöld be, amire szükséged van. Az „Üzemanyag”, a „Töltés”, a „Pihenőhely”, a „Kemping”, a „Szállás”, az „Étkezés” és a „Látnivalók” kombinálható: a lista nyitva marad a további választáshoz, a mezőben pedig minden típus a saját ikonjával jelenik meg.',
  'help.guide.roadtrip-corridor.step.2':
    'Válaszd ki a napot ugyanennek a sornak a végén lévő legördülő listában. Azok a napok szerepelnek benne, amelyekhez a sávban van kártya, a „Keresés” pedig megvárja, amíg a választott nap útvonala elkészül.',
  'help.guide.roadtrip-corridor.step.3':
    'Az „Ezen belül” alatt válaszd ki, milyen távolságra keressen az út két oldalán (2 km, 5 km vagy 10 km), majd kattints a „Keresés” gombra.',
  'help.guide.roadtrip-corridor.step.4':
    'A találatok típus szerint csoportosítva jelennek meg, abban a sorrendben, ahogy elhaladsz mellettük. Mindegyiknél látod, milyen messze van az útvonaltól, és a nap útjának melyik szakaszán található.',
  'help.guide.roadtrip-corridor.step.5':
    'Kattints a találaton lévő pluszra („Hozzáadás”). A „Hozzáadás megállóként” megmutatja, melyik napra és hányadik helyre kerül, és megkérdezi a „Megálló típusa” és az „Idő ezen a megállón” értékét; töltőnél az „Elérhetőség és díjak” is megjelenik. A „Hozzáadás” felveszi az útra, a „További részletek” pedig helyette a teljes helyűrlapot nyitja meg.',
  'help.guide.roadtrip-corridor.result':
    'A hozzáadott megálló a típusa ikonjával azon a ponton jelenik meg az útvonalon, ahol elhaladsz mellette. A TREK a napot a megállón keresztül újratervezi, és ez kiüríti a listát: a következő megállóhoz keress újra.',
  'help.guide.roadtrip-corridor.tip.1':
    'A keresés csak a „Keresés” gomb megnyomásakor indul el: egyetlen keresés is sok kérést küld egy közös szolgáltatásnak.',
  'help.guide.roadtrip-corridor.tip.2':
    'A „Szűrés név szerint” új keresés nélkül szűri a találatokat, a „Találatok törlése” pedig kiüríti a listát, és eltávolítja a gombostűit. Kattints egy találatra, hogy megjelenjen a térképen.',
  'help.guide.roadtrip-corridor.tip.3':
    'Egy találatot a térképről az útvonalra is húzhatsz. Így te választhatod ki a szakaszt, ha ugyanazon az úton kétszer haladsz végig. A „Keresés” melletti „Kézzel” gombbal olyan helyet adhatsz hozzá, amelyet a keresés nem talált, név alapján kikeresve.',
  // roadtrip-via
  'help.guide.roadtrip-via.title': 'Szakasz vezetése egy köztes ponton át',
  'help.guide.roadtrip-via.goal': 'Vezesd a szakaszt a kívánt úton, anélkül hogy megállót adnál hozzá.',
  'help.guide.roadtrip-via.step.1':
    'Jelenítsd meg a térképen a kívánt szakaszt: kattints egy megállóra a sávban, majd zárd be a térkép fölött megnyíló kártyát.',
  'help.guide.roadtrip-via.step.2':
    'Kattints a kirajzolt útvonalra. A kattintott szakaszra egy köztes pont kerül, és a TREK a szakaszt ezen keresztül újratervezi.',
  'help.guide.roadtrip-via.step.3':
    'A sáv frissül: a nap fejlécében megjelenik az új távolság és vezetési idő, és a köztes pont utáni összes érkezési idő is ennek megfelelően változik.',
  'help.guide.roadtrip-via.step.4':
    'Vidd az egeret a fogópont fölé, hogy lásd, mire való: „Húzással alakíthatod az útvonalat, jobb kattintással eltávolíthatod.” Húzd egy másik helyre, és a szakasz az új ponton keresztül rajzolódik újra.',
  'help.guide.roadtrip-via.step.5':
    'A fogantyú eltávolításához kattints rá jobb gombbal. A szakasz ismét a közvetlen útvonalat használja.',
  'help.guide.roadtrip-via.result':
    'A szakasz a választott úton halad, a nap távolságát, vezetési idejét és érkezési időit pedig újraszámoljuk.',
  'help.guide.roadtrip-via.tip.1':
    'A köztes pont nem megálló: nincs száma, tartózkodási ideje és érkezési ideje, és nem számít bele a nap megállóiba.',
  'help.guide.roadtrip-via.tip.2':
    'A fogópontok csak 9-es nagyítási szinttől látszanak, így a teljes utazást mutató térképen a vonal nélkülük jelenik meg.',
  'help.guide.roadtrip-via.tip.3':
    'A rendszer figyelmen kívül hagyja azt a kattintást, amely bármely kirajzolt szakasztól két kilométernél messzebb van, és azt is, amely repülőjáratra, vonatra vagy kompra esik.',
  // roadtrip-alternatives
  'help.guide.roadtrip-alternatives.title': 'Más útvonal kipróbálása egy szakaszon',
  'help.guide.roadtrip-alternatives.goal':
    'Nézd meg, milyen más útvonalakat kínál az útvonaltervező a vezetés egy szakaszára, és válassz közülük.',
  'help.guide.roadtrip-alternatives.step.1':
    'Kattints az oldalsávban egy vezetési sávra, vagyis a két megálló közötti sorra, amely a szakasz hosszát és idejét mutatja. A felirata „Más útvonalak”.',
  'help.guide.roadtrip-alternatives.step.2':
    'Az „Útvonalak ehhez a szakaszhoz” a térkép fölött nyílik meg, útonként egy bejegyzéssel és annak hosszával. A térkép minden utat a vezetési idejével rajzol ki: a jelenlegit telt kékkel, a többit világosabb kékkel.',
  'help.guide.roadtrip-alternatives.step.3':
    'Ha egy bejegyzés fölé viszed az egeret, az az út kiemelve jelenik meg. A „Jelenlegi” az az út, amelyen most haladsz, a „Leggyorsabb” a legrövidebb idejű; a többinél látod, mennyivel lassabbak, vagy melyik úttípust kerülik el.',
  'help.guide.roadtrip-alternatives.step.4':
    'Kattints egy elemre az adott útvonal használatához, vagy a „Bezárás” gombra, ha a jelenlegi útvonalat tartanád meg.',
  'help.guide.roadtrip-alternatives.result':
    'A szakasz mostantól a választott utat használja, és vele együtt változik az oldalsó oszlopban a távolság és az utána következő érkezési idők is.',
  'help.guide.roadtrip-alternatives.tip.1':
    'Ha másik utat választasz, a TREK előbb ellenőrzi azt az autós út útvonaltervezőjével. Ezután a lehető legkevesebb köztes ponttal tartja rajta a szakaszt, és lecseréli a szakasz korábbi köztes pontjait. Az olyan út, amelyet az útvonaltervező nem tud követni, nem mentődik el. Ha az útvonaltervező saját útját választod, a köztes pontok ismét eltűnnek.',
  'help.guide.roadtrip-alternatives.tip.2':
    'Az „Autópálya nélkül”, az „Útdíj nélkül” és a „Komp nélkül” egy másik, saját sebességmodellt használó motorból származik, ezért az idejük nem hasonlítható össze a többiekével.',
  // roadtrip-limits
  'help.guide.roadtrip-limits.title': 'Az autó és a vezetési korlátok beállítása',
  'help.guide.roadtrip-limits.goal':
    'Add meg a TREK-nek, milyen járművel utazol, és mennyit szeretnél vezetni szünet nélkül.',
  'help.guide.roadtrip-limits.step.1':
    'A „Vezetési beállítások” a jobb oldali oszlopban, a keresés alatt található. A jelvényei mutatják, mi van beállítva; rákattintva megnyílik.',
  'help.guide.roadtrip-limits.step.2':
    'A „Vezetés” alatt a „Leghosszabb egyhuzamban vezetés” és a „Vezetés naponta” értéke percben értendő. Az üres mező kikapcsolt állapotot jelent, ilyenkor semmi sincs megjelölve.',
  'help.guide.roadtrip-limits.step.3':
    'A „Jármű” alatt add meg, mivel utazol. Az „Üzemanyag” csak tankolási megállóknál tölt, az „Elektromos” csak töltőállomásoknál, a „Mindkettő” mindkét helyen.',
  'help.guide.roadtrip-limits.step.4':
    'Add meg magad az egy tankkal vagy egy töltéssel megtehető hatótávot. Vagy nyisd meg a „Feltöltés eddig” alatt az autó adataiból való kiszámítást: a tankméret és a fogyasztás, illetve az akkumulátor, a fogyasztás és az akkumulátor kopása alapján kiszámolja a hatótávot.',
  'help.guide.roadtrip-limits.step.5':
    'A bal oldali oszlopban a „Kerülés, ha lehet” csak preferencia, nem tiltás: ha egy napon nincs más út, az útvonal mégis azt használja, és a nap fejléce jelzi ezt.',
  'help.guide.roadtrip-limits.step.6':
    'Kattints a „Lezárás” gombra. A kártya jelvényei mutatják, mi van beállítva, a sáv pedig megjelöl minden szakaszt és napot, amely túllép egy korlátot.',
  'help.guide.roadtrip-limits.result':
    'A kártya jelvényei mutatják, mi van beállítva, és a sávban minden korlátot túllépő szakasz és nap jelvényt kap.',
  'help.guide.roadtrip-limits.tip.1':
    'A beállítások az utazáshoz tartoznak, így mindenki ugyanazzal az autóval és ugyanazokkal a korlátokkal tervez.',
  'help.guide.roadtrip-limits.tip.2':
    'A „Feltöltés eddig” azt adja meg, mennyire tölti fel egy megálló a tankot vagy az akkumulátort, mert útközben senki sem tölt 100 %-ra. Egy tankoló- vagy töltőmegálló ezt a sorában lévő akkumulátor jelvénnyel felülírhatja.',
  'help.guide.roadtrip-limits.tip.3':
    'Az „Útvonalvonal” alatt a „Napok összekötése” az egyik nap utolsó megállójától a következő nap első megállójáig tartó utat is megtervezi. A „Minden nap a szálláson kezdődjön és érjen véget” minden napot az adott éjszakákra foglalt szálláson kezd és zár. A „Naponta egy szín” minden napot a saját színével mutat.',
  // roadtrip-day-window
  'help.guide.roadtrip-day-window.title': 'A vezetési nap kezdetének és végének megadása',
  'help.guide.roadtrip-day-window.goal':
    'Fejezd be a vezetést egy általad választott időpontban, és add meg, hol érjen véget a nap.',
  'help.guide.roadtrip-day-window.step.1':
    'A jobb oldali oszlopban nyisd meg a „Vezetési beállítások” ablakot, és a bal oldali oszlopában keresd meg a „Napi utazási időszak” részt.',
  'help.guide.roadtrip-day-window.step.2':
    'Adj meg egy „Nap kezdete” időpontot. Önmagában ez nem csinál semmit: mindkét időpont szükséges, ahogy az alattuk lévő megjegyzés is írja.',
  'help.guide.roadtrip-day-window.step.3':
    'Állíts be egy „Nap vége” időpontot. A vezetés ekkor ebben az időpontban megáll, és másnap reggel folytatódik; ezt az oldalsó oszlopban egy „Nap vége” és egy „Utazás folytatása” sor jelzi.',
  'help.guide.roadtrip-day-window.step.4':
    'A „Nap lezárása” alatt válaszd „Az útvonalon” lehetőséget, ha a befejezési időpontban az úton szeretnél megállni, vagy „Az utolsó helyen” lehetőséget, ha még azelőtt megállnál, hogy a következő vezetési szakasz elhaladna mellette.',
  'help.guide.roadtrip-day-window.step.5':
    'Kattints a „Lezárás” gombra. A „Vezetési beállítások” kártyán a két időpont jelvényként jelenik meg.',
  'help.guide.roadtrip-day-window.result':
    'A vezetés a beállított hosszúságú utazási napokra oszlik, és ami nem fér bele, az az utolsó nap után kiszámított napokon folytatódik. A napjaid és a helyeik nem változnak.',
  'help.guide.roadtrip-day-window.tip.1':
    'Ha bármelyik időpontot törlöd, ez a funkció ismét kikapcsol. A megállókon saját magad által megadott időpontok mindig elsőbbséget élveznek.',
  'help.guide.roadtrip-day-window.tip.2':
    'Ha napi utazási időket állítasz be, a napok mindig össze vannak kötve: az egyik nap utolsó megállójától a következő nap első megállójáig tartó utat is megtervezzük és beszámítjuk.',
  'help.guide.roadtrip-day-window.tip.3':
    'Minden nap vége jelölőként is megjelenik a térképen: egy hold a nap sorszámával. Húzd az útvonal mentén vagy egy helyre, ha máshol fejeznéd be a napot. Jobb gombbal kattintva visszaállíthatod az automatikus napvéget. Ebben az ablakban az „Automatikus napvégek visszaállítása” az összes ilyen módosítást visszavonja. Ha egy megállónál szeretnéd befejezni a napot, kattints a megállóra, és kapcsold be a kártyáján a „Nap befejezése itt” beállítást.',
  // roadtrip-refuel
  'help.guide.roadtrip-refuel.title': 'Tankolás, mielőtt kifogy a tank',
  'help.guide.roadtrip-refuel.goal':
    'Keress tankolási lehetőséget az útvonal azon részén, ameddig az autó még elér, és add hozzá az úthoz.',
  'help.guide.roadtrip-refuel.step.1':
    'Ha be van állítva a hatótáv, az oldalsó oszlopban egy sáv jelzi azt a szakaszt, ahol kifogy az üzemanyag vagy lemerül az akkumulátor: „Itt fogy ki a tank”, elektromos autónál „Itt fogy el az akkumulátor”. Alatta látod, hogy ez a szakasz mekkora részénél következik be.',
  'help.guide.roadtrip-refuel.step.2':
    'A sávon lévő lámpa ikon a gomb: „Üzemanyag keresése”, elektromos autónál „Töltő keresése”. Az út mentén keres az adott pont előtt, és keresés közben a „Keresés az útvonal mentén…” felirat látszik.',
  'help.guide.roadtrip-refuel.step.3':
    'Legfeljebb három állomás jelenik meg, mindegyiknél az útvonaltól mért távolsággal és azzal, mekkora hatótávod maradna.',
  'help.guide.roadtrip-refuel.step.4':
    'Egy ajánlat melletti plusz jellel tankolási megállóként adhatod hozzá. A „Hozzáadás megállóként” ablak már kitöltött típussal és időponttal nyílik meg, a „Hozzáadás” pedig a szakasznak arra a pontjára teszi, ahol az útvonal ténylegesen elhalad mellette.',
  'help.guide.roadtrip-refuel.result':
    'A megálló a saját ikonjával a megfelelő szakaszon jelenik meg, és a hatótávot ettől a megállótól számoljuk újra. A sáv arra a pontra kerül, ahol a tank most kiürül, vagy eltűnik, ha újabb megálló nélkül is eljutsz az út végéig.',
  'help.guide.roadtrip-refuel.tip.1':
    'A hatótávot a TREK az utolsó tankoló- vagy töltőmegállótól számolja, napokon átívelően. A jármű típusa határozza meg, mely megállók számítanak: „Üzemanyag” esetén csak a tankolóhelyek, „Elektromos” esetén csak a töltőállomások.',
  'help.guide.roadtrip-refuel.tip.2':
    'A keresés az út azon szakaszát nézi, amely a tank kiürülése előtt van, tartalékot is számol, és a kitérőt kétszer veszi figyelembe, így minden felkínált hely valóban elérhető.',
  'help.guide.roadtrip-refuel.tip.3':
    'Ha nincs találat, kereshetsz újra: a lámpa felirata „Próbáld újra” lesz, mert a helykereső közös szolgáltatás, amely néha időtúllépéssel leáll.',
  // roadtrip-track
  'help.guide.roadtrip-track.title': 'Egy nap kövesse az importált nyomvonalat',
  'help.guide.roadtrip-track.goal':
    'Egy nap vezetéséhez használd a GPX- vagy KML-nyomvonalként importált festői útvonaladat.',
  'help.guide.roadtrip-track.step.1':
    'Kattints egy nap fejlécében a „Nyomvonal” jelvényre. Az ablak az adott napnál nyílik meg.',
  'help.guide.roadtrip-track.step.2':
    'Válassz egy nyomvonalat. Mindegyiknél látszik a hossza, és hogy követi-e a nap útvonalát, vagy milyen messze van tőle. A legközelebbi nyomvonal áll elöl.',
  'help.guide.roadtrip-track.step.3':
    'Kattints a „Kövesse ezt a nyomvonalat” gombra. A TREK köztes pontokat tesz oda, ahol az autós útvonal a legtávolabb esik a nyomvonaltól, újraszámolja az útvonalat, és ezt többször megismétli.',
  'help.guide.roadtrip-track.step.4':
    'Az ablak megmutatja, hány köztes pontot helyezett el, és mennyire közel halad most az útvonal a nyomvonalhoz, vagy azt, hogy az útvonal már eddig is követte a nyomvonalat. A bal alsó „Köztes pontok elvetése” eltávolítja őket, és az útvonaltervező újratervezi a napot. Az ablak bezárásakor a nyomvonal megmarad.',
  'help.guide.roadtrip-track.result':
    'A napi út a nyomvonalat követi, nem azt az utat, amelyet az útvonaltervező választott volna. A „Nyomvonal” jelvény fölé víve az egeret látod a nyomvonal nevét. Ha köztes pontok tartják az utat a nyomvonalon, a jelvény ki is emelődik.',
  'help.guide.roadtrip-track.tip.1':
    'Az ablak az utazás azon helyeit sorolja fel, amelyekhez útvonal tartozik: olyan GPX- vagy KML-fájlt, amelyet a „Nap” nézet helyek oszlopában a „Fájl importálása” funkcióval importáltak, GPX-nél az „Útvonalak” vagy a „Nyomvonalak (útvonalgeometriával)”, KML-nél az „Útvonalak (LineStrings)” bejelölésével. A „Fájl importálása” csak akkor érhető el, ha a Túrák bővítmény ki van kapcsolva; bekapcsolt Túrák bővítménnyel a GPX túrává válik, ezeket pedig ez az ablak nem sorolja fel. Amíg az utazásnak nincs nyomvonala, egyik napon sem jelenik meg a jelvény.',
  'help.guide.roadtrip-track.tip.2':
    'A nyomvonal követése lecseréli a nap szakaszain már meglévő köztes pontokat, ezért egy szakaszt a nyomvonal beállítása után alakíts kézzel, ne előtte.',
  'help.guide.dateless-trip.step.1': 'Kattints az „Új utazás” gombra, és adj nevet az utazásnak.',
  'help.guide.edit-trip.tip.2':
    'Ha itt veszel fel vagy távolítasz el útitársat, az azonnal érvénybe lép, a „Frissítés” gomb nélkül is.',
  'help.guide.trip-reminder.result':
    'Az emlékeztetőt a beállított számú nappal az utazás kezdete előtt kapod meg, azokon a csatornákon, amelyeken az értesítéseidet is.',
  'help.guide.upcoming-reservations.step.1':
    'A jobb oldali oszlopban keresd meg a „Közelgő foglalások” részt. Itt látod az összes utazásod következő hat foglalását, a legközelebbivel kezdve, dátummal, időponttal és típussal.',
  'help.guide.half-company-holiday.step.1': 'Az eszköztáron válts a „Céges szabadnap” módra.',
  'help.guide.edit-holiday-calendar.result': 'A rács és a jelmagyarázat minden módosítás után azonnal frissül.',
  'help.guide.person-color.result': 'A személy összes rögzített napja mostantól az új színnel jelenik meg.',
  'help.guide.answer-fusion-request.step.1':
    'Ha valaki meghívott, nyisd meg a Vacay-t. Az „Összevonási kérelem” ablak magától megnyílik.',
  'help.guide.log-for-partner.step.1':
    'A „Személyek” kártyán kattints a személy nevére. A pipa jelzi, hogy ki van jelölve.',
  'help.guide.dissolve-fusion.step.1': 'Nyisd meg a Beállításokat.',
  'help.guide.country-places.step.2': 'Kattints a kártyán a „Hely” jelvényre, arra, amelyiken a gombostű van.',
  'help.guide.search-place.tip.2':
    'Ha a régió már meg van jelölve, a felugró ablak azt kérdezi, hogy inkább eltávolítod-e.',
  'help.guide.tour-activity-stats.step.4':
    'A jobb oldali jelvényekből látod, mi alapján készültek az összegek: a „Tervezve erre” az utazástervezés alapján számolt túrákat jelöli, a „Rögzített” azokat, amelyekhez valódi nyomvonal tartozik. A „Még hátravan”, a „Nap nélkül” és a „Nincs dátum” azokat a túrákat számolja, amelyek még nem számítanak bele. Az i ikon elmagyarázza a szabályt.',
  'help.guide.move-to-list.step.2':
    'A „Másolás listába” gombbal itt is megmaradnak, az „Áthelyezés listába” gombbal lekerülnek erről a listáról.',
  'help.guide.accept-list-invite.title': 'Listameghívás elfogadása',
  'help.guide.tour-collection-add-to-trip.step.3':
    'Az „Útpontok” alatt az útpontos csempét választva a kezdőpont, a megállók és a végpont sorrendben kerülnek be, a „Csak a vonal” csempével pedig csak a mentett vonal.',
  'help.guide.tour-collection-manage.step.1':
    'Nyiss meg egy listát. Minden mentett túránál látod a nehézségi fokát, a típusát, azt az utazást, amelyből mentették, a távolságát és a szintemelkedését, valamint azt, hány útpontja van. Ha az utazás nevére viszed az egeret, azt is látod, ki mentette.',
  'help.guide.entry-draft.step.1': 'A szerkesztő jobb oldali oszlopában kapcsold be a „Vázlat” kapcsolót.',
  'help.guide.journey-map-layers.step.3':
    'Kattints a térképen egy üres gombostűre vagy egy kis pontra. Egy kártya mutatja, mi az: egy tervezett hely a napjával, vagy egy tartózkodás a „Bejegyzés megnyitása” gombbal, amely a hozzá tartozó napi beszámolóhoz visz.',
  'help.guide.journey-keep-route.step.3': 'Kattints az „Útvonal mentése” gombra.',
  'help.guide.journey-day-stays.step.3':
    'Annál a tartózkodásnál, amelyre nincs szükséged, kattints az „Itt nem jártam” gombra. A tartózkodás lekerül a listáról.',
  'help.guide.journey-take-over-day.step.3':
    'Ha az egész napra egyetlen bejegyzést szeretnél, állítsd a „Bejegyzések” kapcsolót „Napi beszámoló” értékre: ekkor egy bejegyzés sorolja fel az összes kiválasztott tartózkodást az időpontjaikkal.',
  'help.guide.journey-auto-prepare.step.2':
    'A „Rögzített napok” alatt kapcsold be a „Rögzített napok automatikus előkészítése” beállítást.',
  'help.guide.photo-location.step.2': 'A „Fotók” alatt kapcsold be a „Bejegyzések helye a fotóik alapján” beállítást.',
  'help.guide.link-trip.tip.3':
    'Ha egy még össze nem kapcsolt utazás valamelyik napjára írsz bejegyzést, a szerkesztő közvetlenül a bejegyzésben felajánlja az „Út kapcsolása” lehetőséget.',
  'help.ctx.settings-plugins.summary':
    'A rendszergazda által telepített pluginek saját beállításaid: a kulcsok és beállítások, amelyeket az egyes pluginek kérnek tőled, valamint egy napló arról, mit végeztek a pluginek a nevedben. A fül csak akkor látszik, ha van aktív plugin.',
  'help.ctx.settings-about.bullet.3':
    'A Ko-fi, a Buy Me a Coffee és a Discord oldalán támogathatod a TREK-et, vagy beszélgethetsz a fejlesztőkkel.',
  'help.guide.language-region.step.3':
    'Állítsd be a „Megjelenítési pénznem” értékét, vagy hagyd „Az utazás pénzneme” beállításon, hogy minden utazást a saját pénznemében láss. Ezután válaszd ki a „Hőmérséklet egység”, a „Távolság egység” és az „Időformátum” értékét, valamint azt, melyik nappal kezdődjön a hét („A hét kezdőnapja”).',
  'help.guide.travel-map-prefs.step.3':
    'A „Helyek felfedezése a térképen” megjeleníti a kategóriagombot, amellyel a közeli helyeket keresheted. A „Foglalási kódok elrejtése” addig takarja a visszaigazolási számokat, amíg föléjük nem viszed az egeret, vagy rájuk nem koppintasz. Az „Útvonal optimalizálása a szállástól” beállítással a nap a szállásodon kezdődik és ott is ér véget.',
  'help.guide.web-push-device.step.2':
    'A felső „Értesítések” kártya „Push” oszlopában állíthatod be, mely eseményekről kapjanak értesítést az eszközeid.',
  'help.guide.connect-airtrail.goal':
    'A TREK importálja és szinkronizálja a repüléseidet a saját AirTrail-példányodból.',
  'help.guide.connect-dawarich.goal': 'A TREK a saját Dawarich-példányodból olvassa ki, hol jártál valójában.',
  'help.guide.tour-connect-wanderer.goal':
    'A TREK beolvassa a saját wanderer-példányod útvonalait, így túraként importálhatod őket.',
  'help.guide.tour-wanderer-watch.title': 'Értesítés a wanderer-útvonalaid változásairól',
  'help.guide.plugin-settings.tip.2':
    'Az „Értesítések” alatt egy plugincsatorna „Beállítás” gombja erre az oldalra visz.',
  'help.guide.default-user-settings.result':
    'Az új fiókok, és mindenki, aki még soha nem módosította ezeket a beállításokat, a te választásaidat látják.',
  'help.guide.own-routing-engine.goal':
    'A napok és az autós utak útvonalát a saját OSRM- vagy Valhalla-szervered tervezze a nyilvánosak helyett.',
  'help.guide.admin-passkeys.tip.1':
    'Ha a TREK még nem tudja megállapítani a domaint, egy figyelmeztetés jelzi ezt, és a passkey-k rejtve maradnak, amíg be nem állítod az APP_URL-t vagy a Relying Party ID-t.',
  'help.guide.rotate-jwt-secret.step.1':
    'A „Beállítások” fül alján, a „Veszélyzóna” részben kattints a „JWT-titok cseréje” melletti „Megújítás” gombra.',
  'help.guide.storage-backends.tip.3':
    'A TREK a fotógyorsítótárakat újra le tudja tölteni, ezért a tükrözésük általában csak pazarolja a tárhelyet.',
  'help.guide.admin-channels.step.3':
    'Az alatta lévő „Értesítések” kártyán eseményenként válaszd ki, mely csatornákon menjen ki az értesítés: „Új verzió elérhető”, „Tárhely-replika hiba” és „Evezős régiót kértek”. Minden kapcsoló azonnal mentődik.',
  'help.guide.notification-defaults.tip.1':
    'A „Ki” csak alapértelmezés, amelyet a felhasználók még bekapcsolhatnak; a „Tiltva” mindenkinél kikapcsolja.',
  'help.ctx.notifications.bullet.4':
    'Az értesítés időpontja mellett az „Olvasottnak jelölés” (dupla pipa) és a „Törlés” (kuka) csak arra az egy értesítésre vonatkozik. A felül lévő „Összes olvasottnak jelölése” és „Összes törlése” a teljes listára.',
  'help.guide.read-notifications.tip.2':
    'A gomb nélküli értesítés csak tájékoztató jellegű. Olvasd el a panelen, és ott jelöld olvasottnak.',
  'help.guide.filter-notifications.result': 'A lista csak a még olvasatlan értesítéseket mutatja, a legújabbal kezdve.',
  'help.guide.delete-notifications.title': 'Értesítések törlése',
  'help.guide.notification-settings.goal':
    'Döntsd el, mely események jelenjenek meg a csengő ikon alatt, és melyekről kapj értesítést e-mailben, webhookon, ntfy-on vagy pushként is.',
  'help.guide.public-link.step.4': 'Kattints a „Link létrehozása”, majd a „Másolás” gombra, és küldd el a linket.',
  'help.guide.link-journal.step.2':
    'Kattints a „Napló összekapcsolása” gombra, és a „Válassz naplót” listából válaszd ki az egyik naplódat.',
  'help.guide.dawarich-stays.title': 'Rögzített tartózkodás hellyé alakítása',
  'help.guide.dawarich-stays.tip.2':
    'Ha törölsz egy tartózkodásból létrehozott helyet, a tartózkodás várakozóként visszakerül a listára.',
  'help.guide.leave-stop-off-route.goal':
    'Egy megálló maradjon a napon úgy, hogy az útvonal ne vezessen oda, például olyan helynél, amely mellett gyalog haladsz el, vagy amelyet csak a térképen szeretnél látni.',
  'help.guide.day-route.tip.4':
    'Ha egy megállót a napon szeretnél tartani, de az útvonalon nem, válaszd a menüjében a „Kihagyás az útvonalból” lehetőséget.',
  'help.guide.move-booking-day.step.2':
    'Húzd a sort egy másik napkártya fejlécére. Az egynapos foglalás teljes egészében arra a napra kerül. Több napos foglalásnál az „Indulás” sorral a kezdőnapot, az „Érkezés” sorral a befejező napot helyezed át.',
  'help.guide.place-image-from-file.title': 'Csatolt fotó beállítása a hely képeként',
  'help.guide.place-image-from-file.tip.2': 'A megállóhoz rögzített vagy a foglalásához csatolt fotók is választhatók.',
  'help.guide.place-own-hours.step.5':
    'Kattints a „Frissítés” gombra. A kártya „Nyitvatartás” része mostantól a te időpontjaidat mutatja, és a felül látható „Nyitott” vagy „Lezárva” állapot is ezek alapján dől el.',
  'help.guide.confirm-stay-booking.step.3':
    'Kattints felül a „Függőben” jelvényre. Az elemleírása szerint „Megerősítettre állítás”, és a pont zöldre vált.',
  'help.guide.map-nearby-places.tip.4':
    'Ha egy kategória keresése nem sikerült, a kategória piros pontot kap, a „Keresés ezen a területen” gomb pedig figyelmeztető jellel pirosra vált: kattints rá az újrapróbáláshoz.',
  'help.guide.tour-map-lines.tip.1':
    'Ha a napok oszlopában összecsuksz egy napot, annak túrái és megállói eltűnnek a térképről.',
  'help.guide.car-stops.step.3':
    'Írj be egy címet a fejlécbe. Az „Útvonal” alatt a „Kitől” mezőben add meg, hol veszed át az autót, a „Ki” mezőben pedig, hol adod le; az utazás saját helyei már gépelés előtt megjelennek. A „Felvétel” és a „Felvétel ideje” az átvétel időpontja, a „Visszaadás” és a „Visszaadás ideje” a leadásé.',
  'help.guide.transport-details.step.1':
    'A „Közlekedés” fülön kattints egy kártyára. A részletek a fül fölött nyílnak meg, a kártyáéval azonos színű fejléccel. A napi tervben a közlekedés sorára kattintva ugyanezek a részletek nyílnak meg.',
  'help.guide.export-transports-csv.tip.2':
    'A „Foglalások” fülön is ott van ugyanez az ikon, és külön fájlt készít, amelynek neve bookings.csv-re végződik.',
  'help.guide.group-sort-bookings.step.2':
    'A „Csoportosítás” alatt válaszd az „Állapot”, a „Nap”, a „Típus” vagy a „Nincs csoportosítás” lehetőséget. A fül azonnal ezekbe a csoportokba rendeződik.',
  'help.guide.export-bookings-csv.result':
    'A böngésződ letölt egy fájlt, amelynek neve az utazásból és a fülből áll, például autumn-in-japan-bookings.csv, és a fülön látott minden foglalás egy sort kap benne.',
  'help.guide.arrange-packing-list.result':
    'A listák abban a sorrendben állnak, ahogy elrendezted őket, a tételek pedig A-tól Z-ig rendezve jelennek meg, amíg ezt ki nem kapcsolod. A saját sorrendedet a TREK ettől még megőrzi.',
  'help.guide.count-packed-pieces.step.2':
    'A mennyiség előtt megjelenik egy számláló, például 0/5, mínusz és plusz gombbal. Minden darabnál, amely bekerül a táskába, kattints a pluszra.',
  'help.guide.expense-receipts.step.4':
    'A főkönyvben a sor neve mellett megjelenik a „Nyugta” címke, több nyugta esetén zárójelben a számukkal. Kattints rá a nyugta megnyitásához.',
  'help.guide.final-budget.tip.3':
    'Aki kilépett az utazásból, az „Egyenlegek” és a „Végső költségvetés” alatt addig megtartja a sorát, amíg neki tartoznak, vagy ő tartozik valakinek.',
  'help.guide.files-sync-settings.step.2':
    'A folyamatsávon a TREK és a tárolód látszik a bennük lévő dokumentumokkal, köztük pedig két sáv: „Ki a tárolóba” és „Be a tárolóból”. Kattints a „Ki a tárolóba” sávra a kikapcsolásához. A sáv kiszürkül, alatta pedig ez olvasható: „Csak befelé”. Újabb kattintással visszakapcsolhatod.',
  'help.guide.files-sync-settings.tip.4':
    'Ezeket csak az utazás tulajdonosa vagy egy rendszergazda módosíthatja. A többi tag a folyamatsávot látja egy olyan sorral, mint például „A dokumentumok mindkét irányba mozognak”, de „Beállítások” nélkül.',
  'help.guide.manage-notes.step.2':
    'A „Kibontás” megnyitja a teljes jegyzetet: a teljes szöveget, a weboldalát és a fájljait. Egy fájlra kattintva előnézetet kapsz. Az alsó „Szerkesztés” gomb közvetlenül a szerkesztőre vált, a jobb felső x pedig bezárja a jegyzetet.',
  'help.guide.note-categories.goal':
    'Rendezd a csoport jegyzeteit elnevezett, színes kategóriákba, és jeleníts meg egyszerre egy kategóriát.',
  'help.guide.note-categories.tip.1':
    'A kukával csak olyan kategóriát törölhetsz, amelyet egyik jegyzet sem használ. A még használt kategória addig a listán marad, amíg az érintett jegyzeteket át nem teszed egy másik kategóriába.',
  'help.guide.roadtrip-reorder.title': 'Megálló átrendezése vagy áthelyezése másik napra',
  'help.guide.roadtrip-reorder.tip.3':
    'A rögzített időpontnál a TREK nem kérdez rá semmire: a sáv azonnal újraszámolja a napot, és megjelöli azokat a megállókat, amelyek már nem érhetők el időben.',
  'help.guide.roadtrip-overnight.step.3':
    'Az ablak tetején az „Éjszakázás” szállást ad hozzá, a „Szünet” pedig rövidebb megállóvá teszi. Szállodánál az „Éjszakázás”, kempingnél a „Szünet” van kiválasztva. Éjszakázásnál csak a „Bejelentkezés” időpontja kell, ezt üresen is hagyhatod.',
  'help.guide.roadtrip-stop-fill.step.1':
    'A sávon egy tankoló- vagy töltőmegállónál kattints az akkumulátor jelvényre. Ez mutatja, milyen szintre töltesz a megállóban: halványan, amíg a „Feltöltés eddig” értékedet használja, teljes színnel, ha saját értéket kapott.',
  'help.guide.roadtrip-bookings.step.1':
    'Foglald le az utat „Repülés”, „Vonat”, „Komp”, „Hajóút” vagy „Busz” foglalásként a megfelelő napra, mindkét végpont helyével. Az autós útvonal automatikusan számol vele: az autóút annál a terminálnál ér véget, ahonnan a járat indul, és ott folytatódik, ahová megérkezik.',
  'help.guide.roadtrip-google-import.result':
    'Az útvonal megállói az adott nap utolsó megállója után kerülnek be, és a sávon és a térképen az útvonal érinti őket.',
  'help.guide.roadtrip-hazards.step.3':
    'A figyelmeztetések területként jelennek meg a térképen. Kattints egyre, és megtudod, miről szól, melyik szolgáltatás jelentette, és mikor frissült utoljára.',
  'help.ctx.trip-tours.bullet.2':
    'Felül a „GPX vagy KML importálása” gombbal fájlokat hozhatsz be túraként. Az alatta lévő szűrőgomb (kezdetben „Mind”, a túrák számával) állapot, forrás, útvonalkorlát és típus szerint szűkíti a listát.',
  'help.guide.tour-show-list.step.2':
    'Minden sor egy túra. A színes sáv a túra vonala a térképen, a kerek csempe pedig a TREK-ben tervezett gyalogtúra útvonalkorlátját (T1-től T6-ig) vagy a típus ikonját mutatja. A név alatti jelvények a napokat, amelyeken szerepel, valamint az időt, a távolságot és a szintemelkedést jelzik. Többnapos túránál a holdas szám a szakaszok számát mutatja.',
  'help.guide.tour-add-to-day.title': 'Túra hozzáadása egy naphoz',
  'help.guide.tour-add-to-day.tip.2':
    'Ha az utazás az utolsó szakasz előtt véget ér, a lehetőség az utolsó még beférő szakaszt mutatja, az utána következő szakaszok pedig nap nélkül maradnak.',
  'help.guide.tour-day-times.step.3':
    'Kattints a „Frissítés” gombra. A sorban most kezdés → befejezés látszik. A kiszámolt befejezési idő halványabb: a ≈ becslést jelez, a ≥ azt, hogy egy tartózkodásnak még nincs időtartama, a +1 pedig éjfél utánit. Ha fölé viszed az egeret, látod, hogyan számolta ki a TREK.',
  'help.guide.tour-remove-from-day.goal': 'Túra levétele a tervből törlés nélkül.',
  'help.guide.tour-filter-list.goal':
    'Szűkítsd a hosszú listát a keresett túrákra: a még nem tervezettekre, a fájlból származókra vagy egy adott típusúakra.',
  'help.guide.tour-filter-list.result':
    'A listában csak a szűrésnek megfelelő túrák látszanak; a többi ettől még az utazás része marad.',
  'help.guide.tour-hide-on-map.result':
    'A térképen csak a kívánt túrák látszanak, az elrejtettek halványítva a listában maradnak.',
  'help.guide.tour-import-plan-tab.result':
    'A nyomvonalból az utazás egyik túrája lett: egy sor a listában GPX jelvénnyel, és egy vonal a térképen.',
  'help.guide.tour-detail-read.title': 'Túra megnyitása és a túrakártya áttekintése',
  'help.guide.tour-detail-read.step.7': 'A kártyát a tetején lévő X-szel vagy az Esc billentyűvel zárhatod be.',
  'help.guide.tour-rename-colour.goal':
    'Adj a túrának könnyen felismerhető nevet és a térképen jól látható vonalszínt.',
  'help.guide.tour-take-along.title': 'Túra letöltése telefonra vagy GPS-re',
  'help.guide.tour-take-along.tip.4':
    'A „Túrák” fülön ugyanez a letöltés a bal oldali oszlop tetején található. Ha a túrán mentetlen módosítások vannak, a letöltés előtt mentést kér.',
  'help.guide.tour-copy-keep.tip.1':
    'Mindkettő másolat: a túra későbbi módosításai sem a másolatot, sem a gyűjteménybe mentett változatot nem érintik.',
  'help.guide.tour-packing-link.step.2':
    'A „Csatolás ehhez” alatt válaszd „A teljes csomagolási lista” lehetőséget vagy annak egyik listáját. Minden sorban látod, hány tétel van benne.',
  'help.guide.tour-files.title': 'Fájlok csatolása túrához',
  'help.guide.tour-activity-link.title': 'A ténylegesen bejárt nyomvonal csatolása',
  'help.guide.tour-activity-link.tip.2':
    'Csak olyan importált nyomvonalat csatolhatsz, amely alapján nem terveztél túrát, és minden nyomvonal csak egy túrához csatolható.',
  'help.guide.tour-activity-compare.step.4':
    'A nyomvonal alatti „Csere” gombbal másik felvételt választhatsz. A „Leválasztás” eltávolítja a túráról, a nyomvonal pedig importként az utazásban marad.',
  'help.guide.tour-origin-check.step.3':
    'A „Túrák” fülön rajzolt túránál a „TREK-ben tervezve” felirat látszik, a létrehozás napjával („Létrehozva”).',
  'help.ctx.trip-tour-planner.bullet.2':
    'A bal oldali sáv a szerkesztő. Ha nincs megnyitva semmi, az „Új túra tervezése” lehetőséget kínálja. Egy megnyitott túránál a nevét, a típusát, az útpontjait, a típusához tartozó kártyákat és a részleteit mutatja, alul „Elveti” és „Mentés” gombbal.',
  'help.guide.tour-open-workspace.step.2':
    'A bal oldali sáv a szerkesztő. Ha nincs megnyitva túra, az „Új túra tervezése” lehetőséget kínálja, amellyel a térképen kezdhetsz új túrát.',
  'help.guide.tour-open-workspace.tip.3':
    'Ha másik túrát nyitsz meg, miközben a szerkesztőben mentetlen módosítások vannak, a TREK előbb rákérdez: „Módosítások elvetése”, vagy folytatod a szerkesztést.',
  'help.guide.tour-draw-route.step.5':
    'Kattints a következő pontokra abban a sorrendben, ahogy bejárod őket. Minden kattintás új végpontként adja hozzá a pontot, és két ponttól a TREK az ösvények mentén tervezi meg az útvonalat.',
  'help.guide.tour-type-profile.goal':
    'Válaszd ki a túra típusát, kerékpártúránál a profilját is, hogy az útvonal a megfelelő utakon haladjon.',
  'help.guide.tour-edit-points.title': 'Pontok mozgatása, átrendezése és törlése',
  'help.guide.tour-edit-points.tip.1':
    'Az első pont „Kezdés”, az utolsó „Befejezés” jelvényt kap. Ha egy pontot a lista elejére vagy végére mozgatsz, az lesz a kezdő- vagy a végpont.',
  'help.guide.tour-shaping-points.step.4':
    'Ha egy megállót alakítóponttá vagy vissza szeretnél alakítani, nyisd meg a sorában a „További műveletek” menüt, és válaszd a „Legyen alakítópont” vagy a „Legyen megálló” lehetőséget.',
  'help.guide.tour-loop-reverse.step.2':
    'Az utolsó sorban most „Vissza a kiindulópontra” áll, és a térképen az útvonal ott ér véget, ahol elkezdődött.',
  'help.guide.tour-leg-by-hand.step.1':
    'Annál a pontnál, ahol a szakasz kezdődik, nyisd meg a „További műveletek” menüt, és válaszd „A következő szakasz kézi rajzolása” lehetőséget.',
  'help.guide.tour-trip-places.goal': 'Egy az utazásban már megtervezett hely felvétele a túra megállójaként.',
  'help.guide.tour-trip-places.result': 'A túra új megállót kapott az utazás helyéből, ugyanazzal a névvel.',
  'help.guide.tour-details-times.tip.2':
    'Gyalogtúránál a „Részletek” között az „Ösvény legnagyobb nehézsége” és az „Útvonalválasztás” is megtalálható, ezeket a gyalogtúrás útmutatók magyarázzák el. A városi sétának nincs „Szünetek” mezője: helyette a megállóknál eltöltött idő számít.',
  'help.guide.tour-save.step.4': 'A túra most „Az utazás túrái” között szerepel, még egyik naphoz sincs rendelve.',
  'help.guide.tour-edit-saved.step.2':
    'Módosíts, amit kell, ugyanúgy, mint egy új túránál: mozgass vagy adj hozzá pontokat, válts típust, vagy szerkeszd a részleteket, ahogy itt a „Leírás” mezőt.',
  'help.guide.tour-summary-profile.goal':
    'Nézd meg, milyen hosszú és meredek a túra, és az útvonal melyik pontján milyen magasan jársz.',
  'help.guide.tour-summary-profile.result':
    'Tudod, milyen hosszú a túra, mennyi a szintemelkedés, mennyi ideig tart, és hol meredek.',
  'help.guide.tour-list-manage.tip.1':
    'Minden túra egyszer számít bele az összesítésbe, akkor is, ha több napon szerepel. A ≥ jellel kezdődő összeg néhány túrát nem tartalmaz. Ha fölé viszed az egeret, látod, hányat.',
  'help.guide.tour-delete.tip.1': 'Ez nem vonható vissza, a „Visszavonás” sem hozza vissza a túrát.',
  'help.guide.tour-saved-elsewhere.step.3':
    'Ha mégis a „Mentés” gombra kattintasz, helyette a „Közben módosult” ablak nyílik meg, és semmi sem íródik felül.',
  'help.ctx.trip-tour-import.bullet.2':
    'Az „Importálás előnézete” mentés előtt térképen mutatja a fájlok összes nyomvonalát a távolsággal, a szintemelkedéssel, a lejtéssel és a pontokkal. Az „Importálás mint” alatt adod meg, mik ezek a nyomvonalak.',
  'help.guide.tour-import-gpx.step.3':
    'Megnyílik az „Importálás előnézete”, még semmi sincs mentve. A térkép a teljes útvonalat mutatja, a fájlok minden nyomvonala pedig egy számozott sor a távolsággal, a szintemelkedéssel, a lejtéssel és a pontokkal. A rögzített nyomvonalnál azt is látod, mikor készült, és mennyi ideig tartott.',
  'help.guide.tour-import-gpx.result':
    'A túra „Az utazás túrái” között van, még egyik naphoz sincs rendelve. Ha csak egy túrát importáltál, az azonnal megnyílik a térképen GPX-túraként.',
  'help.guide.tour-view-import.tip.3': 'A wanderer-útvonal ugyanígy nyílik meg, wanderer-túraként.',
  'help.guide.tour-plan-from-import.tip.1': 'Az „Elveti” gombbal eldobod a javaslatot. Mentésig semmi sem tárolódik.',
  'help.guide.tour-restore-recorded.step.2': 'Kattints a „Rögzített nyomvonal visszaállítása” gombra.',
  'help.guide.tour-take-over.step.2': 'Válaszd a „Túra átvétele másik útból” lehetőséget.',
  'help.guide.tour-take-over.result':
    'Egy üzenet megerősíti az átvételt, a túra pedig megnyílik a szerkesztőben, és máris hozzárendelheted egy naphoz.',
  'help.guide.tour-import-wanderer.tip.2':
    'Az importált túra másolat: a wandererben később végzett módosítások nem érintik. A túra „Eredet” részében a „Forrás ellenőrzése” megmutatja, ha az útvonal megváltozott.',
  'help.ctx.trip-tour-map.bullet.3':
    'A térkép tetején a „Hely vagy cím keresése” mezővel egy településre, menedékházra vagy csúcsra ugorhatsz anélkül, hogy bármi bekerülne a túrába.',
  'help.guide.tour-map-layers.result':
    'A túra a hozzá illő térképen jelenik meg, és a gomb mutatja, melyik térkép van bekapcsolva.',
  'help.guide.tour-along-search.step.3':
    'Az „Ezen a távolságon belül az útvonaltól” alatt add meg, milyen messze keressen a vonaltól: 250 m, 500 m, 1 km vagy 2 km.',
  'help.guide.tour-along-add-stop.goal':
    'Vezesd el a túrát egy útközben talált kilátó, menedékház vagy forrás mellett.',
  'help.guide.tour-along-add-stop.tip.3':
    'Azok a szakaszok, ahová nem tehetsz megállót (rögzített vonalként felvett vasalt út vagy átemelés, illetve kézzel rajzolt szakasz), halványítva maradnak a listában, mellettük az okkal.',
  'help.guide.tour-3d-terrain.result':
    'Megnézted a túrát a 3D-s domborzaton, a meredek szakaszokat színesen, és a tervezéshez visszakaptad a sík térképet.',
  'help.guide.tour-3d-flyover.step.3':
    'A „Szünet” ott megállítja a repülést, ahol éppen tart, az „Átrepülés lejátszása” pedig onnan folytatja. Az „Újrakezdés” visszaugrik az elejére, és újraindítja a repülést.',
  'help.guide.tour-map-overlays.step.1':
    'Nyiss meg egy sítúrát a „Túrák” fülön. A pályák kezdettől látszanak: a kapcsolójuk a bal alsó gomb havas hegy ikonja („Pályák, sífutópályák és felvonók”). Egy kattintással elrejted őket a térképen, egy újabbal újra megjelennek.',
  'help.ctx.trip-tour-stages.title': 'Többnapos túrák',
  'help.guide.tour-multi-day.goal': 'Oszd szakaszokra az útvonalat, minden úton töltött napra egyet.',
  'help.guide.tour-multi-day.tip.2':
    'Két szakasz összevonásához a holdas megálló menüjében válaszd a „Szakaszvég eltávolítása” lehetőséget. A megálló törlése is összevonja őket, ilyenkor egy értesítés felajánlja a „Visszavonás” lehetőséget.',
  'help.guide.tour-stages-on-days.step.3':
    'Válaszd a „Szakaszok ettől a naptól” lehetőséget: az 1. szakasz arra a napra kerül, a többi pedig egyenként a következő napokra. A „Teljes túra ezen a napon” ehelyett a teljes útvonalat arra az egy napra teszi.',
  'help.guide.tour-stages-on-days.result':
    'Minden szakasz a saját napján szerepel az utazásban, a megnyitott szakasz pedig a szerkesztőben van.',
  'help.ctx.trip-tour-hike.bullet.6':
    'A jobb oldali „Túra összefoglalója” megadja a távolságot, a szintemelkedést, a becsült gyaloglási vagy futási időt, a szüneteket és a tervezett teljes időt, alattuk a magassági profillal. A szerkesztő alján a „Mentés” gombbal mentheted a túrát.',
  'help.guide.tour-hike-plan.step.6': 'Kattints a bal oldali oszlop alján a „Mentés” gombra.',
  'help.guide.tour-hike-trail-details.step.1':
    'Nyisd meg a gyalogtúrát „Az utazás túrái” közül, és keresd meg az „Útrészletek” részt az „Útpontok” kártya alatt. Kapcsold be a „Megjelenítés az útvonal mentén” lehetőséget.',
  'help.guide.tour-hike-trail-details.tip.3':
    'A kártya semmit sem változtat a túrán, és internetkapcsolat kell hozzá. Importált gyalogtúránál ugyanez a kártya a túra nézetében jelenik meg, útvonalkorlát nélkül.',
  'help.guide.tour-hike-round.result':
    'A gyalogtúra a választott kört követi, vissza a kiindulópontig. A térkép alján megjelenő „Kör átvéve” üzenetben ott a „Visszavonás”, a „Mentés” pedig véglegesíti.',
  'help.guide.tour-hike-compare-ways.step.3':
    'A sorok jelvényei mutatják, mennyivel hosszabb, magasabb vagy lassabb az adott út a jelenleginél. Kattints arra, amelyiket választod.',
  'help.guide.tour-ferrata-add.step.1':
    'Megnyitott gyalogtúránál kattints a bal alsó térképgombok közül a „Vasalt utak” gombra. A jelvény a látható területen lévő vasalt utakat számolja; ha a TREK kéri, nagyíts rá.',
  'help.guide.tour-ferrata-add.tip.3':
    'A vasalt úti szakasz ki van emelve a magassági profilon, így látod, a nap melyik pontján érsz oda.',
  'help.guide.tour-run-plan.step.5': 'A „Túra neve” mezőben adj nevet a futásnak, és kattints a „Mentés” gombra.',
  'help.guide.tour-run-ways.step.1':
    'Nyisd meg a futást „Az utazás túrái” közül, és az „Útpontok” kártya alatti „Útrészletek” részben kapcsold be a „Megjelenítés az útvonal mentén” lehetőséget.',
  'help.ctx.trip-tour-walk.bullet.1':
    'A „Túratípus” mezőben a „Városi / városnéző séta” sétává alakítja a túrát. A pontjai megállók „Címke” mezővel, tartózkodási idővel és fontossággal. A sétának nincs túrázási korlátja és „Szünetek” mezője: helyette a tartózkodási idők számítanak.',
  'help.guide.tour-walk-plan.step.2':
    'Add hozzá a megállókat: ellenőrizd, hogy a „Pont hozzáadása” be van-e kapcsolva, és kattints a térképen az egyes megállókra, vagy az „Út helyei” gombbal vegyél át egy helyet az utazásból.',
  'help.guide.tour-walk-plan.result':
    'A séta felsorolja a megállóit a tartózkodási időkkel, a „Túra összefoglalója” pedig összeadja őket. Rendeld hozzá egy naphoz, és látod, mikor érsz az egyes megállókhoz.',
  'help.guide.tour-walk-sights.tip.1': 'Ez a séta megállója lesz, nem az utazás helye.',
  'help.guide.tour-walk-day-times.step.3':
    'Nyisd meg újra a sétát a „Túrák” fülön. Az „Útpontok” tetején az „Időpontok:” mutatja a napot és a kezdési időt. Ha a séta több napon is szerepel, rákattintva másik napot választhatsz.',
  'help.guide.tour-walk-google-import.goal':
    'Illessz be egy Google Mapsből megosztott gyalogos útvonalat, és töltsd be a megállóit sétaként.',
  'help.guide.tour-walk-google-import.result':
    'A szerkesztőben megnyílik egy új városi séta a Google Maps megállóival, mentésre készen.',
  'help.guide.tour-walk-check-off.tip.2': 'A napi tervben a séta sora is mutatja a számot, például 3/7.',
  'help.ctx.trip-tour-bike.bullet.4':
    'Az MTB profilnál ugyanez a kártya az ösvények nehézségi fokát (mtb:scale) mutatja, ahol a térképezők megadták. A fok nélküli út ismeretlen, nem könnyű.',
  'help.guide.tour-bike-profile.step.6':
    'Adj nevet a túrának a „Túra neve” mezőben, majd kattints a bal oldali sáv alján a „Mentés” gombra.',
  'help.guide.tour-bike-surfaces.goal':
    'Tudd meg, az útvonal mekkora része aszfalt, murva vagy ismeretlen burkolatú, és milyen típusú utakon halad.',
  'help.guide.tour-bike-surfaces.tip.3':
    'A kártya az útvonaltervező által megtervezett útvonalat használja, és semmit sem változtat a túrán. Internetkapcsolat kell hozzá; offline állapotban jelzi ezt, és az útvonal változatlan marad.',
  'help.guide.tour-bike-mtb-grades.tip.1':
    'Ha az adatokban nincs nehézségi fok, az ismeretlent jelent, nem könnyűt. A fok semmit sem mond arról, hogy egy ösvény neked való-e.',
  'help.ctx.trip-tour-ski.bullet.3':
    'A térképen minden kattintott pont pályákon, felvonókon és ösvényeken át kapcsolódik az előzőhöz. Minden pont alatt címkékként látod a hozzá vezető szakaszt, a pályákat a nehézségük színében, percekkel. A nem tervezhető szakasz pirosra vált, megmondja az okát, és javítást vagy „Egyenes vonal” lehetőséget kínál.',
  'help.guide.tour-ski-plan.step.4':
    'Ellenőrizd, hogy a „Pont hozzáadása” be van-e kapcsolva, majd kattints a térképen a kiindulópontra, aztán sorban minden helyre, ahová el akarsz jutni. A pályatervező minden pontot pályákon, felvonókon és ösvényeken át köt össze az előzővel.',
  'help.guide.tour-ski-options.title': 'Síelési stílus beállítása a pályatervezőben',
  'help.guide.tour-ski-options.tip.2':
    'A „Felvonók használata” alapértelmezés szerint be van kapcsolva az „Alpesi” és a Snowboard szakágnál, a többinél ki. A „Kihagyás” és a „Szükség esetén lefelé felvonóval” csak akkor látszik, ha a felvonók használata be van kapcsolva.',
  'help.guide.tour-ski-fix-leg.tip.1':
    'A pontot a térképen közelebb is húzhatod egy pályához, ösvényhez vagy felvonóhoz. Amikor elengeded, a szakasz újratervezése megtörténik.',
  'help.guide.tour-ski-summary.step.2':
    'A „Síelés”, a „Felvonón”, a „Várakozik” és a „Gyalog” az egyes tevékenységek idejét mutatja. A „Pályák”, a „Lesiklás pályán” és a „Felvonós utak” a pályák hosszát, a rajtuk lesiklott szintkülönbséget és a felvonózások számát adja meg.',
  'help.guide.tour-ski-pistes-layer.goal':
    'Nézd meg a sítúrád körüli pályákat, sífutópályákat és felvonókat, és azt, mit jelentenek a színeik.',
  'help.guide.tour-ski-import.title': 'Sínyomvonal importálása és típusának megadása',
  'help.guide.tour-ski-import.tip.1':
    'Az importált nyomvonal a rögzített formájában marad: a TREK nem illeszti a pályákhoz, és a kártyáján a „Síidő” értéke „Nincs kiszámolva”.',
  'help.ctx.trip-tour-paddle.bullet.3':
    'Egy pont „További műveletek” menüjében találod az evezős eszközöket: a következő szakasz megtervezése a vízen vagy kézi rajzolása, „Átemelés innentől” és „Zsilip ezen a ponton”.',
  'help.guide.tour-paddle-setup.step.3':
    'A „Hajó” alatt válaszd a „Kajak”, „Kenu”, SUP vagy „Egyéb” lehetőséget. A hajótól függ, milyen sebességet javasol a TREK.',
  'help.guide.tour-paddle-setup.tip.4':
    'Az oszlop alján lévő „Az evezés kockázatos” sor megnyitja a „Biztonság a vízen” részt. Az első túrád előtt egyszer olvasd el.',
  'help.guide.tour-paddle-water-route.step.5':
    'Ha az összes kézzel rajzolt szakaszt egyszerre szeretnéd megtervezni, kattints az „Útpontok” fejlécében lévő hullám ikonra („Kézzel rajzolt szakaszok tervezése a vízen”).',
  'help.guide.tour-paddle-portage.step.1':
    'Vidd az egeret arra a megállóra, ahol kiszállsz, és kattints a három pontra („További műveletek”).',
  'help.guide.tour-paddle-portage.result':
    'A szakasz átemelésként jelenik meg a térképen és az útpontok között, az „Időbecslés” pedig hordozásként számolja.',
  'help.guide.tour-paddle-lock.tip.2':
    'Ha egy átemelés megkerüli a zsilipet, a zsilip halványítva, „Megkerülve, az átemelés számít” jelöléssel látszik. Ilyenkor az átemelés ideje számít, a zsilip perceit nem számolja bele a TREK.',
  'help.guide.tour-paddle-time.step.4':
    'Ha a túrán van átemelés, a „Hordozás” sor számolja a cipelést. Kattints a sebességére, és add meg, milyen gyorsan viszed a hajót. A „Ki- és visszaszállás” minden átemelésnél hozzáadja a perceket.',
  'help.guide.tour-paddle-wind.step.1':
    'Rendeld hozzá az evezős túrát az utazás egyik napjához. A bal oldali oszlop „Szél” kártyája ekkor az adott napra mutatja az előrejelzést a túra kiindulópontján.',
  'help.guide.tour-paddle-wind.result': 'Óráról órára látod, milyen szél fúj aznap a vízre szállás helyén.',
  'help.guide.tour-paddle-checklist.tip.1':
    'Minden akadálynál válaszd ki, mit teszel: „Átevezés”, „Átemelés”, „Kikerülés” vagy „Nem érintett”. A „Következő” a következő megválaszolatlan tételre ugrik.',
  'help.guide.tour-paddle-track-marks.step.1':
    'A „Túrák” fülön kattints a jobb oldali oszlopban a „Túra hozzáadása” gombra, válaszd a „GPX vagy KML importálása” lehetőséget, és válaszd ki a fájlt.',
  'help.guide.tour-paddle-track-marks.tip.2':
    'Az „Elveti” gombbal eldobod a nem mentett jelöléseket. A rögzített nyomvonalat a TREK sosem rajzolja újra.',
  'help.ctx.trip-tour-horse.bullet.4':
    'A TREK nem számol lovaglási időt. Ha szeretnéd, hogy a napon szerepeljen idő, add meg a „Részletek” között a „Tervezett” mezőben.',
  'help.guide.tour-horse-plan.step.5':
    'Válassz egy szakaszt a „Szakaszok” alatt. Ellenőrizd, milyen irányban lovagolsz rajta („Irány”), és mit mutat mentén a „Lovas hozzáférés”.',
  'help.guide.tour-horse-plan.tip.5':
    'Lovastúránál semmilyen útvonaltervezés nem történik: a megrajzolt vonalra kattintva nem jön létre alakítópont, és a szakaszvégi pontok ott maradnak, ahol az útvonalon vannak.',
  'help.guide.tour-horse-gap.tip.1':
    'A kézi szakaszt sem útvonaltervező, sem lovasútvonal nem ellenőrizte. A térképen nézd meg, merre halad valójában.',
  'help.guide.tour-horse-recorded.step.4':
    'A lovastúra a bal oldali oszlopban nyílik meg. A „Rögzített lovastúra” kártyán ez látszik: „Ahogy rögzítették”, „Nincs lovaglási idő” és „Hozzáférés ellenőrizetlen”. Vidd az egeret egy jelvényre, és elolvashatod az okát.',
  'help.guide.dateless-trip.step.2':
    'Hagyd üresen a „Kezdő dátum” és a „Záró dátum” mezőt. Alattuk megjelenik a „Napok száma” mező: add meg, hány napot szeretnél megtervezni.',
  'help.guide.trip-reminder.tip.1':
    'Az „Emlékeztető” részt csak az utazás tulajdonosa (vagy egy rendszergazda) látja. Ha szürke, előbb egy rendszergazdának be kell kapcsolnia az utazási emlékeztetőket az Adminisztrátor, Értesítések menüpontban.',
  'help.guide.upcoming-reservations.step.2': 'Kattints egy foglalásra, és megnyílik az utazás, amelyhez tartozik.',
  'help.guide.timezones-widget.tip.1':
    'A lista a hivatalos időzónaneveket használja, például Europe/Lisbon vagy America/New_York, ezért arra a városra keress, amely a névben szerepel.',
  'help.guide.half-company-holiday.step.2': 'Ugyanezen az eszköztáron kapcsold be a „Fél nap” lehetőséget.',
  'help.guide.edit-holiday-calendar.tip.1': 'Minden módosítás azonnal mentődik. Nincs „Mentés” gomb.',
  'help.guide.person-color.tip.1': 'Ugyanez a szín jelöli a személyt az eszköztáron és a „Szabadságkeret” kártyán.',
  'help.guide.answer-fusion-request.step.2':
    'Olvasd el, mit jelent az összevonás: egy közös naptár, egymás helyett is szerkeszthető bejegyzések és közös szabadságbeállítások.',
  'help.guide.log-for-partner.step.2': 'Nézd meg az eszköztárat: az első gombján most az ő neve és színe látszik.',
  'help.guide.dissolve-fusion.step.2': 'Alul az „Összevonás feloldása” részben kattints a „Feloldás” gombra.',
  'help.guide.country-places.step.3':
    'Az ablak az országhoz számolt összes helyet felsorolja, utazásonként csoportosítva; hatnál több hely esetén a felül lévő „Helyek keresése” mezővel szűkítheted a listát. Kattints egy helyre vagy egy utazás címére, és az utazás megnyílik a tervezőben.',
  'help.guide.tour-activity-stats.step.5':
    'Kattints a „Túrák megjelenítése” gombra. Megnyílik a „Teljesített túráim” az összesítésekkel, a „Fajta szerint” bontással és az időszak összes túrájával, mindegyiknél a nappal, az utazással, a távolsággal és a szintemelkedéssel. A fejlécében lévő gombokkal itt is módosíthatod az időszakot és a típust.',
  'help.guide.move-to-list.step.3':
    'Válaszd ki a céllistát. Háromnál több lista esetén a felül lévő keresőmezővel szűkítheted őket.',
  'help.guide.accept-list-invite.goal': 'Csatlakozz egy veled megosztott listához, vagy utasítsd el a meghívást.',
  'help.guide.tour-collection-add-to-trip.step.4':
    'Ha szeretnéd, módosítsd a „Név az útban” mezőt, majd kattints a „Hozzáadás egy úthoz” gombra.',
  'help.guide.tour-collection-manage.step.2':
    'Írj a „Helyek keresése” mezőbe. A helyekkel együtt a túrákat is szűri név szerint.',
  'help.guide.create-journey.tip.3':
    'Ha egy utazás épp véget ért, a felül megjelenő „Az út épp véget ért” sávban az „Útinapló létrehozása” gombbal olyan útinaplót indíthatsz, amelyben ez az utazás már ki van választva.',
  'help.guide.entry-draft.step.2': 'Kattints a „Mentés” gombra. A kártyán most „Vázlat” jelvény látszik.',
  'help.guide.gallery-map.step.3':
    'Az „Idővonal” nézetben a jobb oldali térkép követi a görgetést: a látható bejegyzés gombostűjét a nap színével körbefutó gyűrű jelöli. Egy gombostűre kattintva az idővonal a hozzá tartozó bejegyzéshez görget.',
  'help.guide.journey-map-layers.tip.1':
    'A szaggatott színes vonal az utazás GPX-útvonala, a terv része; a folytonos vonal az adott napon rögzített útvonal.',
  'help.guide.journey-keep-route.tip.1':
    'Ahol a felvétel megszakad, ott a vonal is véget ér. A TREK csak azt rajzolja meg, amit rögzítettek.',
  'help.guide.journey-day-stays.tip.1':
    'A sor csak azoknak jelenik meg, akik szerkeszthetik a naplót, és saját Dawarich-fiókjuk van csatlakoztatva, és csak azokon a napokon, ahol még van mit eldönteni.',
  'help.guide.journey-take-over-day.step.4':
    'Ha az útvonalat is meg szeretnéd tartani, hagyd bekapcsolva „A nap útvonalának mentése is” lehetőséget, majd kattints az „Átvétel” gombra. A gombon látszik, hány vázlat jön létre.',
  'help.guide.journey-auto-prepare.step.3':
    'Az alatta lévő sorból kiderül, mikor kérte le utoljára a TREK a tartózkodásaidat, vagy hogy miért nem sikerült. A „Lekérés most” gombbal azonnal lekérheted őket a Dawarichtól.',
  'help.guide.photo-location.tip.1': 'Az általad megadott helyeket a TREK soha nem helyezi át.',
  'help.ctx.settings-plugins.bullet.1':
    '„Bővítménybeállítások”: alatta minden olyan pluginnek saját kártyája van, amely adatot kér tőled, a mezőivel és „Mentés” gombbal. A titkos mezők tartalma mentés után soha többé nem jelenik meg.',
  'help.guide.dashboard-widgets.step.3':
    'A kártyák alatti „Alapértelmezések visszaállítása” az egész „Megjelenés” fület visszaállítja az eredeti beállításokra.',
  'help.guide.web-push-device.result':
    'A kártyán a „Bekapcsolva ezen az eszközön” felirat látszik, és a „Push” alatt bekapcsolt eseményekről akkor is kapsz értesítést, ha a TREK be van zárva.',
  'help.guide.connect-airtrail.step.1':
    'Az „Integráció” részben keresd meg az AirTrailt, és add meg a „Példány URL-címe” mezőt és egy API-kulcsot. A kulcsot az AirTrailben hozhatod létre a Settings, Security menüpontban.',
  'help.guide.connect-dawarich.step.1':
    'Az „Integráció” részben keresd meg a Dawarichot, és add meg „A példány címe” mezőt, valamint az API-kulcsot, amelyet a Dawarichban az Account, API key menüpontban találsz.',
  'help.guide.tour-connect-wanderer.step.1':
    'Az „Integráció” részben keresd meg a wanderert, és add meg a „Példány URL-címe” mezőt és egy API-tokent. A tokent a wandererben hozhatod létre a Settings, Account, API tokens menüpontban; wanderer_key_ előtaggal kezdődik.',
  'help.guide.tour-wanderer-watch.goal': 'A TREK a háttérben figyelje az importált útvonalaid változásait.',
  'help.guide.mcp-oauth.tip.3': 'Az API tokenek még működnek, de „Elavult” jelölést kaptak; válts OAuth kliensre.',
  'help.guide.offline-conflicts.tip.2': 'A beállítás csak erre az eszközre vonatkozik.',
  'help.guide.default-user-settings.tip.1':
    'A felhasználó saját beállítása a Beállításokban mindig elsőbbséget élvez; ezek az értékek mindenkire vonatkoznak, aki nem módosította az adott beállítást.',
  'help.guide.own-routing-engine.step.1':
    'Az „Alapértelmezett beállítások” „Térkép” részében a „Saját útvonaltervező” alatt add meg az OSRM-szervered címét.',
  'help.guide.admin-passkeys.tip.2':
    'Ha később módosítod a domaint, a felhasználók által addig hozzáadott összes passkey használhatatlanná válik.',
  'help.guide.instance-keys.tip.4':
    'Az Amap-kulcsnak Web 服务 (webszolgáltatás) típusúnak kell lennie, nem JS API-kulcsnak.',
  'help.guide.rotate-jwt-secret.step.2': 'Olvasd el a figyelmeztetést, és kattints a „Csere és kijelentkezés” gombra.',
  'help.guide.notification-defaults.tip.2':
    'Az alapértelmezés csak azokra vonatkozik, akik maguk nem módosították az adott cellát.',
  'help.ctx.notifications.bullet.5':
    'A Beállítások „Értesítések” részében választhatod ki, mely eseményekről kapsz itt értesítést, és melyekről e-mailben, webhookon, ntfy-on vagy pushként.',
  'help.guide.read-notifications.result':
    'Azon a képernyőn vagy, amelyre az értesítés vonatkozott, a csengőn látható szám pedig eggyel csökken.',
  'help.guide.mark-notifications-read.title': 'Értesítések olvasottnak jelölése',
  'help.guide.delete-notifications.goal': 'Tartsd rövidre a listát: töröld, amire már nincs szükséged.',
  'help.guide.notification-settings.step.1': 'Kattints a jobb felső sarokban a nevedre.',
  'help.guide.public-link.step.5':
    'Amíg a link létezik, módosíthatod a beállításait. A „Link törlése” kikapcsolja a linket.',
  'help.guide.link-journal.step.3':
    'Az utazás minden résztvevőjénél válaszd a „Nincs hozzáférés”, az „Olvasás” vagy a „Szerkesztés” lehetőséget. A „Mindenki olvashatja” és a „Senki” egyszerre mindenkire beállítja.',
  'help.guide.collapse-columns.tip.3': 'Ha az elválasztó fókuszban van, a nyílbillentyűkkel is mozgathatod.',
  'help.guide.edit-place.tip.3':
    'Ha az ablakon kívülre kattintasz, a módosításaid nem vesznek el: a TREK előbb megkérdezi: „Elveted a módosításokat?”, és a „Szerkesztés folytatása” gombbal visszatérhetsz az űrlaphoz.',
  'help.guide.dawarich-stays.goal':
    'Vedd fel azokat a helyeket, ahol a Dawarich az utazás során tartózkodást rögzített, miután mindegyiket ellenőrizted.',
  'help.guide.leave-stop-off-route.step.1':
    'Kattints jobb gombbal a megállóra, vagy kattints a három pontjára, és válaszd a „Kihagyás az útvonalból” lehetőséget.',
  'help.guide.move-booking-day.step.3':
    'A sor most az új napon jelenik meg, a saját időpontjánál. Ha az időpontot is módosítanod kell, nyisd meg a foglalást.',
  'help.guide.place-image-from-file.goal':
    'Egy a hely fájljai között már meglévő fotót állíts be a hely képeként, újrafeltöltés nélkül.',
  'help.guide.place-image-from-file.tip.3':
    'A képet csak azok az utazók módosíthatják, akik a helyeket is szerkeszthetik.',
  'help.guide.place-own-hours.result':
    'A kártya a te telefonszámodat, e-mail-címedet és nyitvatartásodat mutatja, a kép körüli gyűrű pedig a te nyitvatartásod alapján zöld vagy piros.',
  'help.guide.confirm-stay-booking.step.4':
    'Zárd be a foglalást a jobb felső sarkában lévő X-szel. A szállás kártyáján a „Foglalás” alatt most „Megerősítve” látszik.',
  'help.guide.tour-map-lines.title': 'Túráid megtalálása a térképen',
  'help.guide.tour-map-lines.tip.2':
    'Egy túra elrejtése csak rád vonatkozik, és ebben a böngészőben, ehhez az utazáshoz tárolódik: a túra, a napjai és a színe mindenki más számára változatlan. A „Túrák” lista fölötti „Összes megjelenítése” minden elrejtett túrát újra megjelenít, a telefonos térkép pedig mindig minden túrát mutat.',
  'help.guide.car-stops.step.4':
    'A „Megállók útközben” alatt minden helyhez, amelyen az út keresztülvezet, kattints a „Megálló hozzáadása” gombra, és válaszd ki, ha szeretnéd, egy időponttal együtt. A kiválasztott hely nélküli megállót a TREK mentéskor eltávolítja.',
  'help.guide.transport-details.step.2':
    'A fejlécben lévő gombok az állapotot, a típust, a napot és a „Foglalási kód” értékét mutatják. Az állapotra kattintva „Függőben” és „Megerősítve” között válthatsz. A kód melletti kis másolás ikon („Foglalási kód másolása”) a vágólapra másolja a kódot.',
  'help.guide.group-sort-bookings.step.3':
    'A „Rendezés” alatt válaszd a „Dátum”, a „Cím”, a „Típus” vagy az „Állapot” lehetőséget. Az alattuk lévő sor megfordítja a sorrendet: dátumoknál „Legkorábbi elöl” vagy „Legkésőbbi elöl”, a többinél „A-tól Z-ig” vagy „Z-től A-ig”.',
  'help.guide.booking-on-map.title': 'Foglalás megkeresése a térképen',
  'help.guide.export-bookings-csv.tip.1':
    'Az oszlopok: „Típus”, „Cím”, „Állapot”, „Kezdés”, „Befejezés”, „Kitől”, „Ki”, „Helyszín”, „Visszaigazolás” és „Jegyzetek”.',
  'help.guide.arrange-packing-list.tip.1':
    'Amíg az „A-tól Z-ig” be van kapcsolva, a tételeket nem húzhatod, a teljes listákat viszont igen.',
  'help.guide.count-packed-pieces.step.3':
    'Amíg csak a darabok egy része van becsomagolva, a számláló a kiemelőszínedben jelenik meg, és a jelölőnégyzet is ilyen színű keretet kap. A mínuszra kattintva egy darabot kiveszel a számlálásból.',
  'help.guide.expense-receipts.step.5':
    'Az előnézet a nyugtát mutatja, felül „Megnyitás új lapon” és „Letöltés” gombbal. Több nyugta esetén a nyílbillentyűkkel lapozhatsz köztük, az Esc pedig bezárja az előnézetet.',
  'help.guide.files-sync-settings.step.3':
    'A további beállításokhoz kattints a folyamatsáv alatti „Beállítások” gombra.',
  'help.guide.manage-notes.step.3':
    'Ugyanebben a menüben a „Kitűzés” a panel tetején tartja a jegyzetet, a kategória színével keretezve, a cím mellett egy gombostűvel. Ugyanitt a „Kitűzés eltávolítása” visszaviszi a jegyzetet a szokásos helyére.',
  'help.guide.note-categories.step.1':
    'A „Jegyzetek” kártya fejlécében kattints az „Új jegyzet” melletti fogaskerékre. Megnyílik a „Kategóriák kezelése”, minden kategóriához egy sorral: a színe, a neve, hat színpont és egy kuka.',
  'help.guide.note-categories.tip.2':
    'A jegyzet nélküli kategória csak a böngésződben létezik. A többi tag akkor látja, amikor egy jegyzet bekerül ebbe a kategóriába.',
  'help.guide.roadtrip-reorder.goal':
    'Módosítsd az út sorrendjét, vagy helyezz át egy megállót másik napra, közvetlenül a sávon.',
  'help.guide.roadtrip-overnight.step.4':
    'A mellette lévő „Szállás keresése” megmutatja a másolható nevet, és foglalási oldalakra mutató linkeket kínál: szállodához trivago vagy CHECK24, kempinghez PiNCAMP vagy Pitchup. Az oldalon ellenőrizd a helyet, a dátumokat és a vendégek számát.',
  'help.guide.roadtrip-stop-fill.step.2':
    'A „Feltölt eddig” alatt válassz 50 és 100 közötti értéket. A gombok alatti sor mutatja, milyen messzire jutsz innen ezzel a töltöttséggel.',
  'help.guide.roadtrip-bookings.step.2':
    'A sávon az út egy kártya a típusa színében, az érkezési oszlopban a menetrenddel, a cím alatt pedig a kiinduló- és végponttal.',
  'help.guide.roadtrip-google-import.tip.1':
    'A TREK maga számolja ki az útvonalat a megállók között; nem a Google útvonalát másolja.',
  'help.guide.roadtrip-hazards.result':
    'A térkép az utazásod környékén érvényes aktuális figyelmeztetéseket mutatja, az útvonal pedig nem változik.',
  'help.ctx.trip-tours.bullet.3':
    'Egy sor: a színes sáv a túra vonala a térképen, a kerek csempe az útvonalkorlátot (T1-től T6-ig) vagy a típust mutatja, a kis GPX vagy wanderer jelvény importált túrát jelöl, a többi jelvény pedig a napokat, az időt, a távolságot és a szintemelkedést adja meg. Többnapos túránál a holdas szám a szakaszok számát mutatja.',
  'help.guide.tour-show-list.step.3': 'Kattints egy sorra. A túra kártyája megnyílik a térkép fölött.',
  'help.guide.tour-add-to-day.goal':
    'Tervezd meg, mikor teljesíted a túrát, hogy a vonalával együtt megjelenjen a napon és a térképen.',
  'help.guide.tour-add-to-day.tip.3':
    'Egy túrát egy naphoz csak egyszer adhatsz hozzá. Ha olyan napra húzod, amelyen már szerepel, a TREK csak ezt jelzi: „Ez a túra már szerepel ezen a napon.”',
  'help.guide.tour-day-times.step.4':
    'Ha a túra később ér véget, mint ahogy a nap következő eleme kezdődik, a sor alatt megjegyzés jelzi, például: 13:30-kor ér véget, a Gostner Schwaige-i ebéd 12:30-as kezdése után. Semmi sem mozdul el.',
  'help.guide.tour-remove-from-day.step.1':
    'A napok oszlopában vidd az egeret a túra sorára, kattints a „További lehetőségek” gombra, és válaszd az „Eltávolítás a napról” lehetőséget.',
  'help.guide.tour-filter-list.step.1':
    'Kattints a „GPX vagy KML importálása” alatti szűrőgombra. Ez mutatja, milyen állapotra szűr (kezdetben „Mind”), mellette a túrák számával.',
  'help.guide.tour-hide-on-map.title': 'Túra vonalának elrejtése a térképen',
  'help.guide.tour-import-plan-tab.title': 'Nyomvonal importálása a „Terv” fülről',
  'help.ctx.trip-tour-detail.title': 'Túra részletei',
  'help.guide.tour-detail-read.goal':
    'Lásd egy helyen mindazt, amit az utazás egy túráról tud: a napjait, a távolságát és a magassági adatait, a profilját és a forrását.',
  'help.guide.tour-detail-read.tip.1':
    'A borostyánsárga „óvatosan használandó” jelvény azt jelzi, hogy az importált adatokban hiányosak a magassági vagy mérési értékek. Ezt tartsd szem előtt, amikor a szintemelkedést és a profilt nézed.',
  'help.guide.tour-rename-colour.step.1':
    'Nyisd meg a túra kártyáját, és kattints a neve melletti ceruzára. A név szerkeszthető mezővé válik.',
  'help.guide.tour-take-along.goal':
    'Kérj útvonaltervet a túra kiindulópontjához, nyisd meg a túra weboldalát, vagy töltsd le az útvonalát GPX-fájlként.',
  'help.guide.tour-take-along.result':
    'A térképalkalmazásodban megvan az út a kiindulópontig, és GPX-fájlként a teljes útvonal is.',
  'help.guide.tour-copy-keep.tip.2':
    'A napi tervben a túra menüjének „Mentés gyűjteménybe” pontja ugyanezt az ablakot nyitja meg, így az útvonal ott is mentésre kerül.',
  'help.guide.tour-packing-link.step.3': 'Kattints a „Csatolás” gombra.',
  'help.guide.tour-files.goal':
    'Csatolj a túrához foglalást, térképet vagy útleírást, és nyisd meg később a túra kártyájáról.',
  'help.guide.tour-activity-link.goal':
    'Csatolj egy rögzített GPX-nyomvonalat egy tervezett túrához anélkül, hogy a terv megváltozna.',
  'help.guide.tour-activity-link.tip.3':
    'Az „Eltelt idő” a nyomvonal első és utolsó időbélyege közötti idő, a szünetekkel együtt.',
  'help.guide.tour-activity-compare.tip.1':
    'Az „Összehasonlítás a térképen” csak akkor érhető el, ha a kártya a térkép mellett látszik, telefonon nem.',
  'help.guide.tour-origin-check.tip.1':
    'Egy másik utazásból átvett túránál az „Átvéve innen” alatt az az utazás és a túra neve szerepel.',
  'help.ctx.trip-tour-planner.bullet.3':
    'A jobb oldali sáv, „Az utazás túrái”, az összes túrát felsorolja, a lista fölött a szűrővel és „Az út összesítése” résszel. Ha egy túra meg van nyitva, felül a „Túra összefoglalója” mutatja a távolságát, a szintemelkedését, az idejét és a magassági profilját. A felső plusz gombbal („Túra hozzáadása”) túrát tervezhetsz, importálhatsz vagy átvehetsz.',
  'help.guide.tour-open-workspace.step.3':
    'A jobb oldali sáv, „Az utazás túrái”, az utazás összes túráját felsorolja, a lista fölött a szűrővel és „Az út összesítése” résszel.',
  'help.guide.tour-open-workspace.result':
    'A „Túrák” fül: balra a szerkesztő, jobbra az utazás túrái, középen a térkép.',
  'help.guide.tour-draw-route.step.6':
    'Az „Útpontok” alatt minden pont saját sort kap a számával, és amint betöltődik a hely neve, arról kapja a nevét. Amíg a TREK dolgozik, az „Új túra” melletti kis pont jelzi, mit csinál éppen.',
  'help.guide.tour-type-profile.step.1':
    'Kattints a „Túra neve” alatti „Túratípus” gombra. Megmutatja a jelenlegi típust, egy sorban azzal együtt, hogyan tervezi az útvonalat.',
  'help.guide.tour-edit-points.goal': 'Módosítsd a túra útvonalát a pontok mozgatásával a térképen vagy a listában.',
  'help.guide.tour-edit-points.tip.2':
    'Amíg a hely neve be nem töltődik, a sorban a koordináták látszanak. A „Visszavonás” és az „Újra” műveletnek nincs billentyűparancsa.',
  'help.guide.tour-shaping-points.tip.1': 'A kezdő- és a végpont mindig megálló.',
  'help.guide.tour-loop-reverse.step.3':
    'A mellette lévő „Irány megfordítása” gombbal az egész túrát ellenkező irányban járhatod be.',
  'help.guide.tour-leg-by-hand.step.2':
    'A szakasz szaggatott egyenes vonal lesz, a sor alatt pedig a lista ezt mutatja: „Kézzel rajzolva, nem tervezett”, a hosszával együtt.',
  'help.guide.tour-trip-places.step.1':
    'Az „Útpontok” alatt kattints a „Pont hozzáadása” melletti „Út helyei” gombra. Alatta megjelennek az utazás helyei.',
  'help.guide.tour-details-times.title': 'A túra elnevezése és időbeosztása',
  'help.guide.tour-details-times.tip.3':
    'A „Részletek” melletti nyíllal összecsukhatod a részt. Magától kinyílik, ha valamelyik mezőjében olyan érték van, amelyet a mentés nem fogad el.',
  'help.guide.tour-save.tip.1':
    'A „Mentés” melletti „Elveti” gomb megerősítés után elveti a nem mentett módosításokat. A már mentett túrát nem változtatja meg.',
  'help.guide.tour-edit-saved.step.3':
    'Kattints a „Mentés” gombra. Megjelenik a „Túra mentve” üzenet, és a túra megtartja a napjait, a fájljait és a jegyzeteit.',
  'help.guide.tour-summary-profile.step.1':
    '„Az utazás túrái” tetején a „Túra összefoglalója” mutatja a szerkesztőben lévő túra „Távolság”, „Szintemelkedés” és „Szintcsökkenés” értékét, a becsült időt, a szüneteket és a tervezett teljes időt.',
  'help.guide.tour-list-manage.title': 'Az utazás túráinak kezelése',
  'help.guide.tour-list-manage.tip.2':
    'A napmenüben azok a napok, amelyeken a túra már szerepel, szürkén jelennek meg. Többnapos túránál a TREK megkérdezi, hogy a szakaszok azon a napon kezdődjenek-e, vagy az egész túra arra a napra kerüljön.',
  'help.guide.tour-delete.tip.2':
    'Ha csak egy napról szeretnéd levenni, inkább a nap menüjében válaszd az „Eltávolítás a napról” lehetőséget.',
  'help.guide.tour-saved-elsewhere.step.4':
    'Válaszd a „Mentés új túraként” lehetőséget, ha mindkettőt meg szeretnéd tartani, az „Újabb betöltése” lehetőséget, ha a másik változatot töltenéd be, vagy a „Felülírás” lehetőséget, ha a te változatod lépjen a másik helyére.',
  'help.ctx.trip-tour-import.bullet.3':
    'Az importált túra GPX-túraként vagy wanderer-túraként nyílik meg: a vonala, a „Túra összefoglalója” és a magassági profil pontosan úgy, ahogy importálták. A listában a során „GPX-import” jelvény látszik.',
  'help.guide.tour-import-gpx.step.4':
    'Az „Importálás mint” alatt ellenőrizd, milyen nyomvonalakról van szó. A „Gyalogtúra” van előre kiválasztva. A „Kerékpártúra” és a „Futás” a profilt, az „Evezős túra” a hajót és a víz típusát, a „Sí és tél” a szakágat kéri.',
  'help.guide.tour-view-import.title': 'Importált nyomvonal megtekintése',
  'help.guide.tour-view-import.result':
    'A rögzített nyomvonalat pontosan úgy látod, ahogy importálták, semmit sem számol újra a TREK.',
  'help.guide.tour-plan-from-import.tip.2':
    'Ha a kártya szerint a javaslat hosszabb szakaszokon messze esik a nyomvonaltól, ellenőrizd ezeket a részeket a térképen, mielőtt erre alapozva tervezel.',
  'help.guide.tour-restore-recorded.step.3':
    'Erősítsd meg a „Rögzített nyomvonal visszaállítása” gombbal. Az útpontok és a tervezett vonal törlődnek, a napok és a jegyzetek megmaradnak.',
  'help.guide.tour-take-over.step.3':
    'Keresd meg a túrát: írj a „Keresés név szerint” mezőbe, vagy szűkítsd a listát az „Utazás” és a „Típus” szűrővel.',
  'help.guide.tour-import-wanderer.title': 'Útvonal importálása a wandererből',
  'help.guide.tour-import-wanderer.tip.3':
    'Az utazásban már szereplő útvonalon „Ebben az utazásban” jelölés látszik, és a „Túra megnyitása” lehetőséget kínálja. Az importálás óta megváltozott útvonalnál a régi mellett az „Importálás új változatként” lehetőség is megjelenik.',
  'help.ctx.trip-tour-map.bullet.4':
    'A bal oldali panel „A túra mentén” kártyája kilátókat, vizet, menedékházakat, étkezési lehetőségeket és egyebeket keres az útvonal közelében, és felsorolja a találatokat. A listából bármelyik helyet megállóként hozzáadhatod a túrához.',
  'help.guide.tour-map-layers.tip.1':
    'A kiválasztott térkép minden megnyitott túránál megmarad, amíg újra nem töltöd az oldalt. Az a túra, amelynek típusánál ez a térkép nem érhető el, a „Térkép” nézetben nyílik meg; a „Terv” fül térképe és a Beállításokban megadott érték nem változik.',
  'help.guide.tour-along-search.step.4':
    'Kattints a „Keresés a túra mentén” gombra. A TREK csak keres, a túra nem változik.',
  'help.guide.tour-along-add-stop.step.1':
    'Kattints egy helyre „A túra mentén” listában, vagy a gombostűjére a térképen. A térkép fölött megnyílik a kártyája: mi az, milyen messze van az útvonaltól, és a túra mekkora részénél található.',
  'help.guide.tour-3d-terrain.title': 'Túra megtekintése 3D-ben',
  'help.guide.tour-3d-terrain.tip.1':
    'Ha elmozdítottad a nézetet, az ugyanebben a sorban lévő „Áttekintés” újra a teljes útvonalat mutatja.',
  'help.guide.tour-3d-flyover.step.4': 'Kattints az „Áttekintés” gombra, és újra a teljes túra látszik.',
  'help.guide.tour-map-overlays.step.2':
    'Kattints a kapcsoló melletti, színes pontokból álló kis négyzetre („Pályajelmagyarázat”).',
  'help.ctx.trip-tour-stages.summary':
    'A többnapos túra egyetlen útvonal, szakaszokra bontva, minden úton töltött napra egy szakasszal. Itt állíthatod be, hol ér véget az egyes nap, itt látod az egyes szakaszok adatait, és itt rendelheted a szakaszokat az utazás napjaihoz.',
  'help.guide.tour-multi-day.step.1': '„Az utazás túrái” listában kattints a túrára, és megnyílik a szerkesztőben.',
  'help.guide.tour-multi-day.tip.3':
    'A szakasz ideje nem tartalmazza a szüneteket. A figyelmeztető színnel jelölt idő („Több mint egy nap mozgásban”) hosszabb egy napnál.',
  'help.guide.tour-stages-on-days.step.4':
    'A szakaszok megjelenítéséhez kattints a holdat és a szakaszok számát mutató gombra („Szakaszok mutatása”).',
  'help.ctx.trip-tour-hike.title': 'Gyalogtúrák és futások',
  'help.guide.tour-hike-plan.title': 'Gyalogtúra tervezése megadott nehézségi határon belül',
  'help.guide.tour-hike-plan.result':
    'A gyalogtúra „Az utazás túrái” között szerepel a távolságával, a szintemelkedésével és a gyaloglási idejével, és máris hozzárendelheted egy naphoz.',
  'help.guide.tour-hike-trail-details.step.2':
    'Válaszd ki, mit szeretnél látni: SAC (túrázási nehézségi fok), „Burkolat” vagy „Úttípus”. A térképen az útvonal ugyanazokkal a színekkel jelenik meg, mint a listában.',
  'help.guide.tour-hike-round.title': 'Adott hosszúságú körtúra keresése',
  'help.guide.tour-hike-round.tip.1':
    'A körök a gyalogtúra „Ösvény legnagyobb nehézsége” beállításán belül maradnak; a kártyán lévő T jelvény mutatja, melyik ez.',
  'help.guide.tour-hike-compare-ways.step.4':
    'Kattints az „Ezt az utat választom” gombra. A TREK az útvonaltervezővel ellenőrzi, hogy az útvonal valóban ezt követi-e.',
  'help.guide.tour-ferrata-add.step.2':
    'Kattints egy vasalt útra a térképen: a szaggatott vonalára vagy a jelére. A kártyáján látod a nevét, a nehézségi fokát és a hosszát.',
  'help.guide.tour-ferrata-add.tip.4':
    'A kártyán a „Megtekintés az OpenStreetMapen” megnyitja a vasalt út saját adatait. Ha semmi sem tölthető be, a jelvény borostyánsárgára vált, az okot pedig az elemleírásban találod.',
  'help.guide.tour-run-plan.result':
    'A futás „Az utazás túrái” között szerepel a „Futásidő (tervezett)” értékkel, a profilja és a tempója pedig vele együtt mentődik.',
  'help.guide.tour-run-ways.step.2':
    'A kártya tetején most látod, hogy a futás mekkora része burkolatlan, és melyik a legnehezebb besorolású ösvény rajta.',
  'help.ctx.trip-tour-walk.bullet.2':
    'Az „Útpontok” sorrendben sorolja fel a megállókat. A megálló száma körüli gyűrű „Kihagyhatatlan” (teli) vagy „Nem kötelező” (szaggatott) jelölést ad, a kis pajzs „Védett” megállót jelöl, a név alatti jelvény pedig azt mutatja, mennyi ideig maradsz.',
  'help.guide.tour-walk-plan.step.3':
    'Az „Útpontok” listában vidd az egeret egy megállóra, kattints a mellette lévő „További műveletek” gombra, és válaszd a „Megálló szerkesztése” lehetőséget.',
  'help.guide.tour-walk-sights.title': 'Látnivalók hozzáadása városi sétához',
  'help.guide.tour-walk-sights.tip.2':
    'Ha módosítod az útvonalat, a gombon „Keresés újra” felirat jelenik meg, mert a talált helyek a régi útvonalhoz tartoznak.',
  'help.guide.tour-walk-day-times.step.4':
    'Minden megálló alatt látod, mikor érkezel, és mennyi ideig maradsz. Figyelmeztetés jelenik meg, ha egy hely abban az időpontban zárva van, vagy a tartózkodásod alatt bezár.',
  'help.guide.tour-walk-google-import.step.1':
    '„Az utazás túrái” részben kattints a „Túra hozzáadása” gombra (a felső +), és válaszd a „Séta importálása a Google Mapsből” lehetőséget.',
  'help.guide.tour-walk-check-off.title': 'Séta megállóinak kipipálása a túra napján',
  'help.guide.tour-walk-check-off.tip.3':
    'Ha egy sétát offline állapotban rendeltél egy naphoz, a szinkronizálás után pipálhatod ki.',
  'help.guide.tour-bike-profile.title': 'Kerékpártúra tervezése a kerékpározási stílusodhoz',
  'help.guide.tour-bike-profile.result':
    'A kerékpártúra mentve van, és „Az utazás túrái” között szerepel, a profiljához igazított útvonallal, a „Túra összefoglalója” részben pedig a kerékpározási idővel.',
  'help.guide.tour-bike-surfaces.step.1':
    'A jobb oldali „Az utazás túrái” listában kattints egy kerékpártúrára a megnyitásához. Amint az útvonal kiszámolása megtörtént, az „Útpontok” alatt megjelenik a „Burkolat és utak” kártya.',
  'help.guide.tour-bike-surfaces.tip.4':
    'A kártya címére kattintva összecsukhatod. Ebben a böngészőben újratöltés után is összecsukva marad.',
  'help.guide.tour-bike-mtb-grades.tip.2':
    'Ahol a térképezők az emelkedőket is besorolták, alatta az „Emelkedő nehézsége (mtb:scale:uphill)” következik, saját sorokkal.',
  'help.ctx.trip-tour-ski.bullet.4':
    'Az útpontok alatti „Pályaútvonal” kártya a napot „Síelés”, „Felvonón”, „Várakozik” és „Gyalog” részekre bontja, a pályák hosszával, a rajtuk lesiklott szintkülönbséggel és a felvonózásokkal. A jobb oldali „Túra összefoglalója” „Síidő” értéke ezt adja össze, amint minden szakasz megtervezése megtörtént.',
  'help.guide.tour-ski-plan.step.5':
    'Minden pont alatt címkékként jelenik meg a hozzá vezető szakasz: minden pálya, felvonó és gyalogos szakasz a nevével vagy a típusával, a pályák a nehézségük színével jelölt ponttal, és mindegyiknél a percek.',
  'help.guide.tour-ski-options.goal':
    'Állítsd be a legnehezebb pályákat, a preferenciáidat, a tempódat és a használható felvonókat, hogy a szakaszok hozzád igazodjanak.',
  'help.guide.tour-ski-options.tip.3':
    'A „Feltételezett összeköttetések kerülése” távol tartja az útvonalat azoktól a kapcsolatoktól, amelyeket a térképadatok csak feltételeznek, például két pálya közötti, fel nem térképezett szakasztól.',
  'help.guide.tour-ski-fix-leg.tip.2':
    'Amíg egy terület pályaadatai letöltés alatt állnak, a tervező vár, és automatikusan újrapróbálkozik.',
  'help.guide.tour-ski-summary.step.3':
    'A jobb oldali „Túra összefoglalója” részben a „Síidő” mindezt összeadja. Az információs pont elmagyarázza, hogyan számolja a TREK.',
  'help.guide.tour-ski-pistes-layer.step.1':
    'Ha egy „Sí és tél” túra meg van nyitva, a térkép automatikusan megjeleníti a pályákat. A térkép bal alsó sarkában lévő gombsorban a havas hegy kapcsolóval ki- és bekapcsolhatod őket; az elemleírása: „Pályák, sífutópályák és felvonók”.',
  'help.guide.tour-ski-import.goal':
    'Importálj egy rögzített sí-, sífutó- vagy hótalpas nyomvonalat, és add meg a megfelelő szakágat.',
  'help.guide.tour-ski-import.tip.2':
    'Ha tervezett túraként szeretnéd szerkeszteni, használd a „Szerkeszthető változat” kártyán a „Szerkeszthető változat tervezése” gombot. A pontjait egyenes vonalak kötik össze.',
  'help.ctx.trip-tour-paddle.bullet.4':
    'Az „Időbecslés” összeadja a vízen töltött időt, a hajó cipelését, a ki- és beszállást, a zsilipeket és a szüneteket, általad módosítható sebességek és percek alapján.',
  'help.guide.tour-paddle-setup.step.4':
    'A „Víz” alatt válaszd a „Folyó” vagy a „Tó” lehetőséget. Amíg hajót és víztípust is nem választottál, a túrát nem mentheted.',
  'help.guide.tour-paddle-setup.result':
    'Elkészült egy új evezős túra a hajóval, a víz típusával és a sebességgel, készen arra, hogy felvedd az első pontját a térképen.',
  'help.guide.tour-paddle-water-route.tip.1':
    'Ahol hiányoznak a vízadatok, a TREK a példány beállításától függően vagy automatikusan letölti őket a régióra, vagy egy rendszergazdától kéri. A szakaszon ilyenkor a vízadatok betöltését jelző üzenet látszik, és amint megvannak az adatok, automatikusan megtörténik a tervezés, általában egy-három percen belül.',
  'help.guide.tour-paddle-portage.step.2':
    'Válaszd az „Átemelés innentől” lehetőséget. A következő pontig tartó szakasz átemelés lesz, a szárazföldön megrajzolva.',
  'help.guide.tour-paddle-lock.title': 'Zsilip és várakozási idő hozzáadása',
  'help.guide.tour-paddle-lock.tip.3':
    'A „Zsilip eltávolítása” a megnyitott kártya alján és a „További műveletek” menüben található.',
  'help.guide.tour-paddle-time.step.5':
    'Amíg nem minden zsilipnek van megadva az ideje, a becslés „Hiányos” jelzést mutat, a sorok alatti megjegyzés pedig felsorolja, mi hiányzik.',
  'help.guide.tour-paddle-wind.step.2':
    'Nézd meg a szélirányt, az „Átlag” és a „Széllökések” értékét. Az „Átlag” a nap legerősebb óránkénti átlaga, a „Széllökések” a legerősebb széllökés.',
  'help.guide.tour-paddle-checklist.title': 'Az akadálylista átnézése',
  'help.guide.tour-paddle-checklist.tip.2':
    'Az „Átemelés” nem tervez automatikusan átemelést. Kattints az „Átemelés tervezése” gombra, és állítsd be a térképen.',
  'help.guide.tour-paddle-track-marks.step.2':
    'Az „Importálás előnézete” ablakban állítsd az „Importálás mint” értékét „Evezős túra” lehetőségre, majd válaszd ki a „Hajó” és a „Víz” értékét. Amíg mindkettőt ki nem választod, az importálás nem folytatható.',
  'help.guide.tour-paddle-track-marks.tip.3':
    'Rögzített nyomvonalnál az „Időbecslés” „Víz” sorának saját sebessége van: kattints rá, és add meg, milyen gyorsan eveztél.',
  'help.ctx.trip-tour-horse.bullet.5':
    'A GPX-fájlból importált lovastúra pontosan úgy marad, ahogy rögzítették, a „Rögzített lovastúra” kártya pedig jelzi, mit nem tudott kiszámolni az importálás.',
  'help.guide.tour-horse-plan.step.6':
    'Kattints a „Szakasz átvétele” gombra. A szakasz jelvényként, az útvonal nevével kerül a lovastúrába az „Útpontok” kártyán. További szakaszokat ugyanígy adhatsz hozzá.',
  'help.guide.tour-horse-gap.title': 'Lovasútvonalak közötti hézag áthidalása',
  'help.guide.tour-horse-gap.tip.2':
    'A térképen kattintott pontok ugyanígy, egyenes, ellenőrizetlen szakaszként kerülnek a lovastúrába.',
  'help.guide.tour-horse-recorded.result':
    'A lovastúra pontosan úgy szerepel az utazásban, ahogy lovagoltad, a fájlból származó távolsággal és magassági adatokkal.',
  'help.guide.dateless-trip.step.3': 'Kattints az „Új utazás létrehozása” gombra.',
  'help.guide.trip-reminder.tip.2':
    'Az új utazásokhoz alapból tartozik egy emlékeztető 3 nappal az indulás előtt. Hogy milyen csatornákon kapod meg, azt a Beállítások, Értesítések menüpontban adhatod meg.',
  'help.guide.upcoming-reservations.result':
    'Megnyílik az utazás. Az irányítópultra visszatérve a widget továbbra is a következő eseményeket mutatja.',
  'help.guide.entitlement.tip.2':
    'Összevont tervben mindenkinek saját sora van, és a többiek szabadságkeretét is beállíthatod.',
  'help.guide.half-company-holiday.step.3': 'Kattints a napra. A cella fele borostyánsárga lesz.',
  'help.guide.school-holidays.tip.2':
    'Ha egy szünetbe eső nap fölé viszed az egeret, az „Iskolai szünetek” alatt megjelenik a szünet neve.',
  'help.guide.answer-fusion-request.step.3':
    'Az „Elfogadás és összevonás” gombbal egyesítheted a terveket, az „Elutasítás” gombbal külön tarthatod a sajátodat.',
  'help.guide.log-for-partner.step.3':
    'Kattints a rögzítendő napokra, majd a „Személyek” között kattints újra a saját nevedre.',
  'help.guide.dissolve-fusion.result':
    'Mindenki visszakapja a saját tervét a saját bejegyzéseivel, és a „Személyek” között már csak te szerepelsz.',
  'help.guide.country-places.result': 'A tervező azon az utazáson nyílik meg, amelyhez a hely tartozik.',
  'help.guide.tour-activity-stats.step.6':
    'Ha egy túra elmaradt, kattints a sora végén lévő kerek gombra („Kihagyás”). A túra a listában marad, halványítva, „Kihagyva” jelöléssel. Ugyanez a gomb, most már „Számítson újra” felirattal, újra beszámítja.',
  'help.guide.move-to-list.tip.1':
    'A címkék egy adott listához tartoznak, ezért az áthelyezett vagy duplikált hely az új listán címkék nélkül jelenik meg.',
  'help.guide.accept-list-invite.step.1':
    'A meghívót a listasáv „Meghívók” részében találod. Ha a meghívásról szóló értesítésből érkeztél, a kártya az oldal tetején van. Látod rajta a lista nevét és azt, kitől jött.',
  'help.guide.tour-collection-add-to-trip.tip.1':
    'Az új túra még egyik naphoz sincs rendelve, és nem ad hozzá helyeket. Sem a lista, sem az eredeti túra nem változik.',
  'help.guide.tour-collection-manage.step.3':
    'Kattints a túra sorának végén lévő kukára, és erősítsd meg az „Eltávolítás a gyűjteményből” gombbal.',
  'help.ctx.journey-detail.bullet.7':
    'Ha a Dawarich csatlakoztatva van, a nap fejlécében a „Felvétel átvétele” (vagy a napra mentett útvonal távolsága) és a „Nap átvétele” is megjelenik. Ha egy napon várakozó tartózkodások vannak, ezek a nap végén egy sorba csoportosítva látszanak.',
  'help.guide.entry-draft.tip.1':
    'A közreműködők a vázlatot is látják. Csak a nyilvános linken marad rejtve, amíg ki nem kapcsolod a „Vázlat” kapcsolót.',
  'help.guide.journey-map-layers.tip.2':
    'A halvány kapcsolónak még nincs mit megjelenítenie, az elemleírásból kiderül, miért. A választásodat a böngésző útinaplónként megjegyzi.',
  'help.guide.journey-keep-route.tip.2':
    'Később a nap fejlécében a távolságra kattintva újra összevetheted a Dawarichcsal: a „Csere” az új változatot veszi át, az „Útvonal eltávolítása” pedig törli a nap útvonalát az útinaplóból.',
  'help.guide.journey-day-stays.tip.2':
    'Sűrű napokon a sor végén lévő „Nap átvétele” az összes tartózkodást egyszerre kezeli.',
  'help.guide.journey-take-over-day.tip.1':
    'Amíg erre a gombra nem kattintasz, semmi sem mentődik, és semmi sem kerül be kétszer: a naplóban már szereplő tartózkodás meg van jelölve, és nem választható ki újra.',
  'help.guide.journey-auto-prepare.tip.1':
    'Csak a dátummal rendelkező, összekapcsolt utazások napjai készülnek elő, és a naplóba semmi sem kerül be automatikusan.',
  'help.guide.photo-location.result':
    'A hely nélküli bejegyzés azt a helyet kapja meg, ahol az első GPS-adatos fotója készült, és megjelenik a térképen.',
  'help.guide.contributors.tip.2':
    'Az „Utazásokon át” azokat sorolja fel, akik egy összekapcsolt utazás révén férnek hozzá. Az ő hozzáférésüket annak az utazásnak a beállításaiban módosíthatod, nem itt.',
  'help.ctx.settings-plugins.bullet.2':
    'Egy plugin műveleteket („Műveletek”) is elhelyezhet a kártyáján, amelyek megerősítés után futnak le, valamint „Csatlakozás” vagy „Leválasztás” gombot, ha a nevedben bejelentkezik egy másik szolgáltatásba.',
  'help.guide.web-push-device.tip.1':
    'A push böngészőnként működik: ismételd meg minden telefonon és számítógépen, amelyen értesítést szeretnél kapni. A „Kikapcsolás ezen az eszközön” csak azon az eszközön kapcsolja ki.',
  'help.guide.connect-airtrail.step.2':
    'Az „Önaláírt tanúsítványok engedélyezése” csak a saját hálózatodon futó, megbízható példányhoz való. A „Módosítások visszaírása az AirTrailbe” alapból ki van kapcsolva, így a TREK csak olvas; kapcsold be, ha a szerkesztéseidet is vissza szeretnéd küldeni.',
  'help.guide.connect-dawarich.step.2':
    'Az „Új tartózkodások automatikus keresése” beállítással a TREK magától ellenőrzi az újdonságokat. Kikapcsolt állapotban csak akkor olvassa a Dawarichot, ha kéred. A „Saját aláírású tanúsítvány engedélyezése” csak olyan példányhoz való, amelyben a szervered nem bízik.',
  'help.guide.tour-connect-wanderer.step.2':
    'Az „Önaláírt tanúsítvány engedélyezése” beállítást csak a saját hálózatodon futó példányhoz kapcsold be.',
  'help.guide.tour-wanderer-watch.step.1':
    'A wanderer kártyán kapcsold be az „Útvonalaim változásainak ellenőrzése” beállítást. Ehhez előbb mentett kapcsolat szükséges.',
  'help.guide.plugin-settings.title': 'Plugin beállítása saját magadnak',
  'help.guide.default-user-settings.tip.2':
    'A „Megjelenítési pénznem” csak a megjelenítéshez váltja át az összegeket. A „Költségek” fülön rögzített összegek nem változnak.',
  'help.guide.own-routing-engine.step.2':
    'Ha az útvonalaknak el kell kerülniük az útdíjas utakat, az autópályákat vagy a kompokat, add meg a Valhalla címedet a „Saját Valhalla-példány” alatt. Minden mező akkor mentődik, amikor elhagyod; ezután indítsd újra a TREK-szervert, és töltsd újra az oldalt.',
  'help.guide.admin-passkeys.tip.3':
    'Ha egy felhasználó elvesztette a passkey-it tároló eszközét, a „Felhasználó szerkesztése” ablakban a „Passkey-k visszaállítása” gombbal törölheted őket.',
  'help.guide.rotate-jwt-secret.result':
    'Új aláírási titok lépett életbe, és minden felhasználónak, neked is, újra be kell jelentkeznie.',
  'help.guide.read-notifications.title': 'Értesítések elolvasása',
  'help.guide.filter-notifications.title': 'Az összes vagy csak az olvasatlan értesítések megjelenítése',
  'help.guide.mark-notifications-read.goal':
    'Ha már láttad az újdonságokat, tüntesd el a kiemelést és a csengőn lévő számot.',
  'help.guide.delete-notifications.step.1':
    'Kattints az értesítés időpontja melletti kukára („Törlés”), ha csak azt az egyet szeretnéd törölni.',
  'help.guide.notification-settings.step.2': 'Kattints a menüben a „Beállítások” pontra.',
  'help.guide.public-link.tip.3': 'Ha egy lehetőség fölé viszed az egeret, megtudod, mit rejt el.',
  'help.guide.link-journal.step.4':
    'Olvasd el a sárga megjegyzést: megnevezi, kik kapnak most először hozzáférést a naplóhoz. Ezután kattints a „Napló kapcsolása” gombra.',
  'help.guide.dawarich-stays.step.1':
    'Ha a Dawarich csatlakoztatva van a Beállítások, Integrációk menüpontban, a helylista fölött megjelenik „A Dawarichból” rész. A fejlécéből kiderül, mikor ellenőrzött utoljára a TREK, és hány tartózkodás vár. Kattints rá a lista megnyitásához.',
  'help.guide.leave-stop-off-route.step.2':
    'A név mellett „Útvonalon kívül” jelvény jelenik meg. A megálló a napon és a térképen marad, de a nap útvonala és a szakaszidők nem számolnak vele.',
  'help.guide.move-booking-day.result': 'A foglalás a tervben már az új naphoz tartozik, az időpontja nem változott.',
  'help.guide.clear-day.tip.2': 'Ez a menüpont csak olyan napon jelenik meg, amelyen vannak helyek.',
  'help.guide.place-image-from-file.step.1':
    'Nyiss meg egy helyet, amelynek a fájljai között van fotó. A kártya alján lévő „Fájl” rész mutatja, hány fájl tartozik a helyhez.',
  'help.guide.place-own-hours.title': 'Hely nyitvatartásának, telefonszámának vagy e-mail-címének javítása',
  'help.guide.place-own-hours.tip.1':
    'Az általad megadott nyitvatartás felülírja a TREK által lekérdezettet, így egy szezonálisan nyitva tartó kávézónál az látszik, amit te tudsz.',
  'help.guide.day-panel.tip.3':
    'Naptár szerint tervezel? Kapcsold be a Beállítások „Megjelenés” részében a „Dátum elöl a napok fejlécében” beállítást: a fejlécben előbb a dátum látszik, alatta az „1. nap” vagy a nap neve.',
  'help.guide.confirm-stay-booking.result':
    'A szállodafoglalás meg van erősítve, a szállás kártyáján és a „Foglalások” fülön is.',
  'help.guide.tour-map-lines.goal':
    'Különböztesd meg az utazás túráit a térképen, nyiss meg egyet a vonalára kattintva, és rejtsd el azokat, amelyekre most nincs szükséged.',
  'help.guide.tour-map-lines.tip.3':
    'Ha a napi tervben a túra sorának menüjében a „Kihagyás az útvonalból” lehetőséget választod, a nap útvonala már nem vezet a túra kezdő- és végpontjához. A „Visszavétel az útvonalba” újra összeköti őket.',
  'help.guide.car-stops.step.5':
    'A megállók sorrendje adja az útvonalat. A megálló bal oldalán lévő „Mozgatás felfelé” és „Mozgatás lefelé” gombbal módosíthatod, a jobb oldali x („Megálló eltávolítása”) pedig törli a megállót.',
  'help.guide.transport-details.step.3':
    'Az alatta lévő csempék az indulást és az érkezést mutatják az állomásokkal vagy repülőterekkel, majd a vágányt és az ülőhelyet, ha meg vannak adva. Köztes megállós útnál az „Útvonal” alatt látszanak a megállók, szakaszonként foglalt útnál pedig a „Szakaszkódok” alatt az egyes szakaszok kódja. Ezután következik az „Utasok”, a „Jegyzetek”, a „Költségek” és a „Fájl”; a „Megjelenítés a fájlokban” a „Fájl” fülön nyitja meg a jegyet.',
  'help.guide.export-transports-csv.title': 'Közlekedés exportálása táblázatként',
  'help.guide.group-sort-bookings.step.4':
    'Egy csoport címére kattintva összecsukhatod. A mellette lévő szám mutatja, hány foglalás van benne, egy újabb kattintással pedig újra kinyithatod.',
  'help.guide.booking-on-map.goal': 'Ugorj egy foglalásról a helyére a tervben és a térképen.',
  'help.guide.export-bookings-csv.tip.2':
    'Az oszlopokat pontosvessző választja el, és az Excel az ékezeteket helyesen jeleníti meg.',
  'help.guide.arrange-packing-list.tip.2':
    'A TREK ebben a böngészőben megjegyzi az „A-tól Z-ig” beállítást, így a lista legközelebb is rendezve nyílik meg. Ez csak azt befolyásolja, amit te látsz, a többiek sorrendjét soha.',
  'help.guide.count-packed-pieces.step.4':
    'Amint a számláló eléri a mennyiséget, a tétel automatikusan kipipálódik, és becsomagoltnak számít.',
  'help.guide.expense-receipts.result':
    'A nyugta a kiadással együtt mentődik: a sorában lévő címke megnyitja, a fájl pedig az utazás „Fájl” részében is megtalálható.',
  'help.guide.files-sync-settings.step.4':
    'A „Ha egy dokumentumot törölnek” alatt add meg, mi történjen a másik oldalon lévő példánnyal. A „Mindkét példány megtartása” a tárolóban lévő példányt a helyén hagyja. Az „Áthelyezés a kukába” a tároló kukájába helyezi, amikor a dokumentumot a TREK-ben törlik.',
  'help.ctx.trip-collab.bullet.7':
    'Itt mindenhez internetkapcsolat kell. Offline állapotban az üzenet, a jegyzet, a link, a szavazás vagy a szavazat nem mentődik, és a TREK ezt jelzi: „Ehhez kapcsolat kell. Próbáld újra, ha a TREK újra online.” Azok a tagok, akik nem szerkeszthetik az „Együttműködés” fület, mindent elolvashatnak, de az „Új jegyzet”, a „Link hozzáadása” és az „Új szavazás” nem jelenik meg nekik, az üzenetmező pedig szürke.',
  'help.guide.manage-notes.step.4':
    'A „Szerkesztés” megnyitja a jegyzet ablakát, minden mező kitöltve. Módosítsd, amit kell, itt például egy újabb sort a „Tartalom” alatt, és kattints a „Mentés” gombra.',
  'help.guide.note-categories.step.2':
    'Írj egy nevet az alul lévő „Új kategória...” mezőbe, és nyomj Entert, vagy kattints a mellette lévő pluszra. Az új kategória a következő színt és saját sort kap.',
  'help.guide.note-categories.tip.3':
    'A kártyán a kategória csak a fejlécben lévő színes pontként látszik. Ha fölé viszed az egeret, a neve is megjelenik.',
  'help.guide.roadtrip-reorder.step.1':
    'Fogd meg a megállót a soránál, és ejtsd ugyanannak a napnak egy másik megállójára. Átveszi annak a helyét, és a nap útvonala az új sorrend szerint újratervezésre kerül.',
  'help.guide.roadtrip-overnight.step.5':
    'Kattints a „Hozzáadás” gombra. Az éjszaka erről a napról a következőre szól, és a hely az aznapi éjszakai szállásként kerül az útvonalra.',
  'help.guide.roadtrip-stop-fill.step.3':
    'Ha a megállónál újra a saját alapbeállításodat szeretnéd használni, nyisd meg ismét a jelvényt, és kattints „Az alapértelmezettet használom” gombra.',
  'help.guide.roadtrip-bookings.step.3':
    'A „Bejelentkezés” vagy a „Beszállás” gomb mutatja, mikorra kell az autóútnak a terminálhoz érnie: az indulás ennyivel korábbra kerül a menetrendinél.',
  'help.guide.roadtrip-google-import.title': 'Útvonal importálása a Google Mapsből',
  'help.guide.roadtrip-google-import.tip.2':
    'A linkben legalább kettő, legfeljebb 30 olyan megállónak kell lennie, amelyet a TREK el tud helyezni.',
  'help.guide.roadtrip-hazards.tip.1':
    'A figyelmeztetések nem útlezárások: az útvonal soha nem változik miattuk, és aktuális közlemények, nem az utazásod idejére szóló előrejelzések.',
  'help.ctx.trip-tours.bullet.4':
    'Ha egy sor fölé viszed az egeret, megjelenik a szem ikon („Elrejtés a térképen”) és a kerek + gomb („Hozzáadás a naphoz”). A sort a bal oldali oszlop egyik napjára húzva arra a napra tervezed, rákattintva pedig a térkép fölött megnyílik a túra kártyája.',
  'help.guide.tour-show-list.step.4':
    'A kártya a túra adatait mutatja, az „Utazási napok” alatt pedig azokat a napokat, amelyeken szerepel. Ha magát az útvonalat szeretnéd módosítani, nyisd meg a „Túrák” fület, és „Az utazás túrái” alatt kattints a túrára.',
  'help.guide.tour-add-to-day.step.1':
    'Vidd az egeret a túra fölé a listában, és kattints a sor jobb oldalán lévő kerek + gombra („Hozzáadás a naphoz”).',
  'help.guide.tour-add-to-day.tip.4':
    'Ha egy nap meg van nyitva (a fejlécére kattintva), a túra kártyáján a „Hozzáadás a naphoz” is megjelenik arra a napra. A napok fölötti visszavonás nyíllal visszavonhatod a hozzárendelést.',
  'help.guide.tour-day-times.tip.1': 'Az általad megadott befejezési idő felülírja a kiszámoltat.',
  'help.guide.tour-remove-from-day.step.2':
    'A túra a jobb oldali listában marad. A „Nap” jelvénye eltűnik, és a szűrő újra a „Nem tervezett” túrák között számolja.',
  'help.guide.tour-filter-list.step.2':
    'Az „Állapot” alatt válaszd a „Nem tervezett” lehetőséget a még egyik naphoz sem rendelt túrákhoz, vagy a „Tervezett” lehetőséget a már napra tett túrákhoz. Minden sorban látod, hány túra felel meg.',
  'help.guide.tour-hide-on-map.goal':
    'Rejtsd el a térképről azokat a túrákat, amelyekre most nincs szükséged, anélkül hogy bárki más számára megváltoznának.',
  'help.guide.tour-import-plan-tab.goal': 'Importálj egy GPX- vagy KML-nyomvonalat túraként a napok tervezése közben.',
  'help.ctx.trip-tour-detail.summary':
    'Ez a kártya akkor nyílik meg a térkép fölött, amikor a „Terv” fülön kiválasztasz egy túrát: a napjai, az adatai és a profilja, a forrása, valamint a gombok, amelyekkel a telefonodra küldheted, lemásolhatod, gyűjteménybe mentheted vagy a csomagolási listához kapcsolhatod.',
  'help.guide.tour-detail-read.step.1':
    'A jobb oldali oszlop tetején válts a „Hely” nézetről a „Túrák” nézetre, majd kattints egy túrára. A térkép fölött megnyílik a kártyája. A napon belüli sorára vagy a térképen a vonalára kattintva ugyanez a kártya nyílik meg.',
  'help.guide.tour-detail-read.tip.2':
    'Evezős túránál nincs magassági adat és profil: a pontjai a partokon vannak, így a magasságok félrevezetők lennének.',
  'help.guide.tour-rename-colour.step.2':
    'Írd be az új nevet, és kattints a kerek pipa gombra, vagy nyomj Entert. Az Esc billentyűvel megtartod a régi nevet.',
  'help.guide.tour-take-along.step.1':
    'Nyisd meg a túra kártyáját. A kártya alján lévő „Navigáció” egy térképalkalmazásban nyitja meg a túra kiindulópontját; ha több alkalmazásod van, előbb felsorolja őket. A kiindulópontig navigál, nem az útvonal mentén.',
  'help.guide.tour-copy-keep.title': 'Túra másolása vagy mentése gyűjteménybe',
  'help.guide.tour-copy-keep.tip.3':
    'A „Túrák” fülön a bal oldali oszlop tetején lévő könyvjelző ugyanezt teszi a megnyitott túrával. Ha a túrán mentetlen módosítások vannak, előbb mentést kér.',
  'help.guide.tour-packing-link.step.4':
    'A kártyán most látszik a lista, hogy hány tétele van becsomagolva, egy sáv és az első tételek. A becsomagoltak át vannak húzva.',
  'help.guide.tour-files.step.1':
    'Nyisd meg a túra kártyáját, és görgess le a végén lévő „Fájl” részhez. Kattints a rész fejlécében a „Feltöltés” gombra, és válassz ki egy vagy több fájlt.',
  'help.guide.tour-activity-link.step.1':
    'Nyisd meg a tervezett túra kártyáját, és görgess a „Tényleges nyomvonal” részhez. Kattints a „Tényleges nyomvonal hozzáadása” gombra.',
  'help.guide.tour-activity-link.result':
    'A nyomvonal a túrához kapcsolódik, a kártya pedig egymás mellett mutatja a tervet és azt, amit ténylegesen teljesítettél.',
  'help.guide.tour-activity-compare.tip.2':
    'Az Atlasz túrastatisztikái a csatolt nyomvonal adataival számolnak a tervezett értékek helyett.',
  'help.guide.tour-origin-check.tip.2':
    'A wandererből származó túra forrása mellett egy nyíl („Megnyitás a wandereren”), a rész fejlécében pedig a „Forrás ellenőrzése” látható. Az ellenőrzés megkérdezi a wanderert, változott-e az útvonal az importálás óta. Ezután az „Importálás új pillanatképként” külön túraként importálja az új változatot. Ez a túra megtartja a napjait és a jegyzeteit.',
  'help.ctx.trip-tour-planner.bullet.4':
    'Amíg a „Pont hozzáadása” be van kapcsolva (a térkép gombján „Pontok elhelyezése”), a térképre kattintva pontot helyezel el. Egy gombostűt húzva áthelyezheted, a megrajzolt útvonalra kattintva alakítópontot adhatsz hozzá, az „Út helyei” gombbal pedig az utazás egyik helyét választhatod ki.',
  'help.guide.tour-open-workspace.step.4':
    'A jobb oldali sáv tetején lévő plusz gomb („Túra hozzáadása”) a „GPX vagy KML importálása”, a „Séta importálása a Google Mapsből” és a „Túra átvétele másik útból” lehetőséget kínálja. Ha egy túra meg van nyitva, az „Új túra tervezése” is itt található.',
  'help.guide.tour-draw-route.title': 'Új túra rajzolása',
  'help.guide.tour-draw-route.tip.1':
    'Amíg a „Pontok elhelyezése” be van kapcsolva, a mutató célkereszt alakú. Kapcsold ki, ha pontok hozzáadása nélkül szeretnéd mozgatni a térképet. 3D-ben alapból ki van kapcsolva, mert ott a térkép húzásával nézel körül.',
  'help.guide.tour-type-profile.step.2':
    'Válaszd ki a típust a listából: „Gyalogtúra”, „Városi / városnéző séta”, „Futás”, „Kerékpártúra”, „Evezős túra”, „Lovastúra” vagy „Sí és tél”. Mindegyiknél látod, mit tervez, és új típus választásakor az útvonal újratervezése megtörténik.',
  'help.guide.tour-edit-points.step.1':
    'Húzz egy számozott gombostűt a térképen oda, ahová a pontot szeretnéd. Az útvonal az új helyen át újratervezésre kerül.',
  'help.guide.tour-edit-points.result':
    'A pontok ott vannak, és abban a sorrendben, ahogy szeretnéd, az útvonal pedig újratervezésre került.',
  'help.guide.tour-shaping-points.tip.2': 'Többnapos túrán egy alakítópont nem lehet szakasz vége.',
  'help.guide.tour-loop-reverse.tip.1':
    'Ha a túra már körtúra, a „Vissza a kiindulópontra” ezt jelzi: „A túra már visszatér a kiindulópontra”.',
  'help.guide.tour-leg-by-hand.step.3':
    'Ha újra az útvonaltervezőre bíznád, nyisd meg ugyanezt a menüt, és válaszd „A következő szakasz újratervezése” lehetőséget.',
  'help.guide.tour-trip-places.step.2':
    'Keress a „Keresés az út helyei között” mezőben, vagy nézd meg „A túra közelében” részt: itt az útvonaltól két kilométeren belüli helyek látszanak, a legközelebbivel kezdve, mindegyik a távolságával.',
  'help.guide.tour-details-times.goal':
    'Adj a túrának nevet, leírást és linket, és számolj a szünetekkel az időtervben.',
  'help.guide.tour-details-times.result':
    'A túrának most már van neve, vannak jegyzetei, és megvan a rá tervezett idő.',
  'help.guide.tour-save.tip.2':
    'A sáv tetején lévő „Vissza a túrákhoz” bezárja a szerkesztőt, de ha mentetlen módosítások vannak, előbb rákérdez.',
  'help.guide.tour-edit-saved.step.4':
    'A bezáráshoz kattints a „Vissza a túrákhoz” gombra. Mentetlen módosítások esetén előbb megkérdezi: „Elveted a túra nem mentett módosításait?”',
  'help.guide.tour-summary-profile.step.2': 'A becsült idő melletti információs pont elmagyarázza, hogyan számolódik.',
  'help.guide.tour-list-manage.goal':
    'Nézd meg az utazás túráinak összesített adatait, rendelj egy túrát egy naphoz, és szűkítsd a listát a szükségesekre.',
  'help.guide.tour-list-manage.tip.3':
    'A sorban lévő kuka törli a túrát. A „Terv” fül ugyanezeket a túrákat mutatja, ha a jobb oldali oszlopa „Túrák” nézetre van állítva.',
  'help.guide.tour-delete.tip.3':
    'Túrát itt, a „Túrák” fülön lehet törölni. A kuka csak azoknak az utazóknak jelenik meg, akik szerkeszthetik az utazás helyeit.',
  'help.guide.tour-saved-elsewhere.tip.1':
    'A „Mentés új túraként” a túra nevét adja a másolatodnak, a végén a (my version) kiegészítéssel.',
  'help.ctx.trip-tour-import.bullet.4':
    'A „Szerkeszthető változat” az importált túrát mozgatható útpontokkal rendelkező túrává alakítja. Az „Import lecserélése” megtartja a rögzített nyomvonalat, a szerkesztőben pedig a „Rögzített nyomvonal” kártyával visszatérhetsz hozzá.',
  'help.guide.tour-import-gpx.step.5':
    'Kattints az „1 túra importálása” gombra (három nyomvonalat tartalmazó fájlnál „3 túra importálása”).',
  'help.guide.tour-view-import.goal':
    'Nézd meg egy importált túra nyomvonalát, adatait és magassági profilját úgy, ahogy beérkezett.',
  'help.guide.tour-plan-from-import.title': 'Szerkeszthető túra tervezése importált nyomvonalból',
  'help.guide.tour-plan-from-import.tip.3':
    'Evezős vagy sí-importnál a pontokat útvonaltervezés helyett egyenes vonalak kötik össze.',
  'help.guide.tour-restore-recorded.tip.1':
    'A kártya csak olyan túránál jelenik meg, amelyet az „Import lecserélése” funkcióval cseréltek le, majd mentettek.',
  'help.guide.tour-take-over.step.4':
    'Kattints a túrára. A jobb oldalon látod a vonalát, az adatait és azt az utazást, amelyből származik.',
  'help.guide.tour-import-wanderer.goal': 'Importáld a saját wanderer-példányod egyik útvonalát túraként az utazásba.',
  'help.guide.tour-import-wanderer.tip.4': 'A „Megnyitás a wandereren” a saját példányodon nyitja meg az útvonalat.',
  'help.ctx.trip-tour-map.bullet.5':
    '3D-ben az útvonal a domborzaton jelenik meg, a meredekség szerint színezve, egy jelmagyarázattal, amely összefoglalja a meredekségi kategóriákat, és egy átrepüléssel, amely elejétől a végéig végigköveti.',
  'help.guide.tour-map-layers.tip.2':
    'A „Túrázás” és a „Kerékpár” térkép önkéntesek által üzemeltetett szerverekről érkezik, és csak akkor érhető el, ha a rendszergazda engedélyezi. Ha valamelyik nem válaszol, a gombján ! jel jelenik meg, és átválthatsz másik térképre; a túrád nem változik.',
  'help.guide.tour-along-search.step.5':
    'A talált helyek az útvonaltól mért távolságukkal együtt jelennek meg a listában, a térképen pedig a saját színükkel. Csillag jelöli a legismertebbeket, „A túrában” pedig azokat, amelyek már megállók. A gombon most „Keresés újra” felirat látszik.',
  'help.guide.tour-along-add-stop.step.2':
    'A „Hová kerül” azt a szakaszt javasolja, ahová a hely a legjobban illik. Rákattintva kiválaszthatod, melyik két megálló közé kerüljön, vagy azt, hogy „Új végpontként” kerüljön be. A térkép szaggatott vonallal mutatja az új útvonalat, mielőtt bármi megváltozna.',
  'help.guide.tour-3d-terrain.goal': 'Nézd meg a túrát a valódi domborzaton, a meredekség szerint színezve.',
  'help.guide.tour-3d-terrain.tip.2':
    'A kiválasztott térkép 3D-ben is megmarad, ahogy a vasalt utak, a sípályák és a tengeri jelek is. Túra szerkesztése közben a pontjait a domborzaton is húzhatod, és ha a „Pontok elhelyezése” be van kapcsolva, kattintással újat adhatsz hozzá.',
  'help.guide.tour-3d-flyover.result': 'Láttad a túrát a levegőből, az elejétől a végéig, a választott sebességgel.',
  'help.guide.tour-map-overlays.step.3':
    'A jelmagyarázatból kiderül, mit jelentenek a színek: a lesiklópályák a „Kezdő” szinttől a Freeride-ig, „Sífutópályák”, „Téli és hótalpas utak”, „Szánkópályák”, valamint „Felvonók és kabinos pályák”. A „Teljes jelmagyarázat az OpenSnowMapen” minden jelet megmutat. Az Esc billentyűvel bezárhatod.',
  'help.ctx.trip-tour-stages.bullet.1':
    'A szerkesztőben a „Nap” alatt választhatod ki, hogy a megnyitott túra „Egynapos” vagy „Többnapos” legyen. Ha visszaváltasz egynaposra, megerősítés után az összes szakaszvég törlődik, az útvonal viszont változatlan marad.',
  'help.guide.tour-multi-day.step.2':
    'A „Nap” alatt kattints a „Többnapos” lehetőségre. Egy megjegyzés jelzi, hová került az első szakasz vége.',
  'help.guide.tour-multi-day.tip.4':
    'A szakaszok a „Mentés” gombra kattintáskor mentődnek. Ha egy módosítás olyan szakaszt szüntet meg, amely az utazás egyik napjához van rendelve, egy értesítés jelzi, hogy a mentéssel lekerül arról a napról.',
  'help.guide.tour-stages-on-days.step.5':
    'Minden szakasznál látod, melyik napra van rendelve. A napjára kattintva másik napra teheted, a „Nap nélkül” lehetőséggel pedig leveheted.',
  'help.ctx.trip-tour-hike.summary':
    'A „Túrák” fülön megnyitott gyalogtúra vagy futás: balra a szerkesztő, középen a térkép, jobbra a túra összefoglalója és az utazás többi túrája. A gyalogtúra az általad engedélyezett ösvénynehézségen belül marad, a futás idejét a saját tempód határozza meg, és mindkettő megmutatja, mit tartalmaz az OpenStreetMap az útvonal mentén.',
  'help.guide.tour-hike-plan.goal':
    'Kezdj egy gyalogtúrát, add meg a megállóit, válaszd ki a legnehezebb ösvényfokozatot, amelyet az útvonal használhat, és mentsd el.',
  'help.guide.tour-hike-plan.tip.1':
    'Az új gyalogtúra T2 („Hegyi túra”) szinten indul. T3-nál figyelmeztetés jelenik meg, hogy az ilyen ösvények kitettek lehetnek, biztos lépést és tériszonymentességet igényelnek.',
  'help.guide.tour-hike-trail-details.step.3':
    'A jelvények összefoglalják: az útvonal mekkora része „Ismert”, mi a „Legmagasabb ismert” fokozat, és külön az az „Útvonalkorlát”, amellyel a gyalogtúrát tervezték.',
  'help.guide.tour-hike-round.goal':
    'A TREK javasoljon a kívánt hosszúságú körtúrákat a gyalogtúra egyik megállójából indulva.',
  'help.guide.tour-hike-round.tip.2':
    '1 és 60 km közötti távolságot adhatsz meg, és a TREK a megadott értéktől legfeljebb 20 %-kal eltérő köröket kínál.',
  'help.guide.tour-hike-compare-ways.result':
    'Az adott szakasz a választott utat követi, a gyalogtúra többi része változatlan. A térkép alján megjelenő „Út átvéve” üzenetben ott a „Visszavonás”.',
  'help.guide.tour-ferrata-add.step.3':
    'Kattints a „Hozzáadás a túrához” gombra. A vasalt út önálló szakaszként az útvonal végére kerül, mindkét végén egy ponttal.',
  'help.guide.tour-run-plan.title': 'Futás tervezése a saját tempódhoz',
  'help.guide.tour-run-plan.tip.1': 'Tempó megadása nélkül a futás nem menthető.',
  'help.guide.tour-run-ways.step.3':
    'Kattints a „Burkolat” gombra, majd a listában egy burkolattípusra, és a térképen csak az ilyen szakaszok látszanak.',
  'help.ctx.trip-tour-walk.bullet.3':
    'Ha a séta egy kezdési idővel rendelkező napon szerepel, az „Útpontok” tetején az „Időpontok:” megnevezi a napot, és minden megállónál látszik az érkezés, a tartózkodás és az, hogy mit mond a nyitvatartás.',
  'help.guide.tour-walk-plan.step.4':
    'Add meg a megálló „Címke” és „Tartózkodás percben” értékét. Ha még nem tudod, mennyi ideig maradsz, hagyd üresen, ha pedig csak elhaladsz egy pont mellett, írj be 0-t.',
  'help.guide.tour-walk-sights.goal': 'Válassz témát, keress a séta mentén, és vegyél fel egy helyet megállóként.',
  'help.guide.tour-walk-sights.tip.3':
    'A nyitvatartás és a weboldalak a forrásból származnak, többnyire az OpenStreetMapből. Indulás előtt ellenőrizd őket.',
  'help.guide.tour-walk-day-times.tip.1':
    'Kezdési idő nélkül a sor ezt jelzi: „Adj a sétának egy időpontot ezen a napon, hogy lásd az érkezéseket és a nyitvatartást.”',
  'help.guide.tour-walk-google-import.step.2':
    'Illeszd be a linket a „Link a gyalogos útvonalhoz” mezőbe, és kattints a „Link beolvasása” gombra.',
  'help.guide.tour-walk-check-off.goal':
    'Jelöld a megállókat meglátogatottnak vagy kihagyottnak a túra napján, és nézd meg, mennyi séta van még hátra.',
  'help.guide.tour-walk-check-off.result':
    'A meglátogatott megállók ki vannak pipálva, a kihagyottak át vannak húzva, a hátralévő idő pedig csak azt számolja, ami még előtted áll.',
  'help.guide.tour-bike-profile.goal':
    'Kezdj egy kerékpártúrát, és a TREK tervezze meg az útvonalat túrakerékpárhoz, országúti, gravel- vagy MTB-kerékpárhoz.',
  'help.guide.tour-bike-profile.tip.1':
    'Ha később módosítod a profilt, a teljes útvonal újratervezése megtörténik az új profillal.',
  'help.guide.tour-bike-surfaces.step.2':
    'A kártya fejlécében lévő jelvény mutatja, hogy az útvonal mekkora része ismerten burkolatlan.',
  'help.guide.tour-bike-mtb-grades.title': 'Hegyikerékpáros túra ösvényfokozatainak ellenőrzése',
  'help.guide.tour-bike-mtb-grades.tip.3':
    'Ha a fokozatokat nem sikerült beolvasni, a kártya jelzi ezt. Kattints a „Próbáld újra” gombra.',
  'help.ctx.trip-tour-ski.bullet.5':
    'Amíg egy „Sí és tél” túra meg van nyitva, a térkép az OpenSnowMap pályáit mutatja, a kapcsolójuk mellett a „Pályajelmagyarázat” gombbal. Mindez térképi adat: semmi sem jelzi, hogy egy pálya vagy felvonó nyitva van-e, milyen a hó, és semmit sem mond a lavinákról.',
  'help.guide.tour-ski-plan.step.6': 'A „Túra neve” mezőben adj nevet a túrának, és kattints a „Mentés” gombra.',
  'help.guide.tour-ski-options.step.1':
    'Egy „Sí és tél” túránál az útvonaltervező beállításai a „Szakág” alatt találhatók. Csak a szakágadhoz tartozókat látod: a „Sífutás” szakágnál például nincs „Legnehezebb pályák” beállítás.',
  'help.guide.tour-ski-options.result':
    'A túra a korlátaidon belül újratervezésre kerül, a „Pályaútvonal” kártya pedig felsorolja azokat a nehezebb pályákat, amelyeket elkerült.',
  'help.guide.tour-ski-fix-leg.tip.3':
    'Offline állapotban a szakaszok egyelőre egyenes vonallal jelennek meg. A nyári ösvényekről szóló szürke sor csak megjegyzés, nem hiba.',
  'help.guide.tour-ski-summary.tip.1':
    'Az „Elkerülve” felsorolja azokat a nehezebb pályákat, amelyeket az útvonaltervező a „Legnehezebb pályák” korlátod miatt elkerült.',
  'help.guide.tour-ski-pistes-layer.step.2':
    'Kattints a kapcsoló melletti, négy színes pontot mutató gombra („Pályajelmagyarázat”).',
  'help.guide.tour-ski-import.step.1':
    'A „Túrák” fülön kattints a „Túra hozzáadása” gombra („Az utazás túrái” fölötti plusz), válaszd a „GPX vagy KML importálása” lehetőséget, és válaszd ki a fájlt.',
  'help.guide.tour-ski-import.tip.3':
    'GPX-, KML- vagy KMZ-fájlokat a „Túrák” fül bármely részére is húzhatsz, és ugyanez az előnézet nyílik meg.',
  'help.ctx.trip-tour-paddle.bullet.5':
    'A „Szél” arra a napra mutatja az előrejelzést a túra kiindulópontján, amelyre a túrát tervezted. Az „Ellenőrzőlista” felsorolja a mentett útvonal akadályait, és azt, mit döntöttél az egyes akadályoknál.',
  'help.guide.tour-paddle-setup.step.5':
    'Tavon a „Tavakon át” határozza meg az útvonalat: az „Egyenesen” a legrövidebb, a „Part mentén” szeles napokra a parthoz közel halad.',
  'help.guide.tour-paddle-water-route.title': 'Vízi szakaszok tervezése',
  'help.guide.tour-paddle-water-route.tip.2':
    'Ahol az útvonal egy duzzasztógát mellett átemeléssel halad el, vagy egy zsilipen megy át, a TREK saját pontot helyez el, „Felismert” jelöléssel. Ha áthelyezed vagy módosítod, a saját pontod lesz.',
  'help.guide.tour-paddle-portage.step.3':
    'A pont alatt megjelenik egy „Átemelés” kártya a hosszával és a többletpercekkel. Kattints rá a megnyitásához.',
  'help.guide.tour-paddle-lock.goal':
    'Vegyél fel egy zsilipet a túrára, és számold bele az idejébe a várakozást és az áthaladást.',
  'help.guide.tour-paddle-lock.result':
    'A zsilip a perceivel együtt szerepel a túrán, az „Időbecslés” pedig hozzáadja őket.',
  'help.guide.tour-paddle-time.tip.1':
    'A TREK kiindulásként vízen 4 km/h-val, cipeléskor 2 km/h-val és átemelésenként 10 perccel számol. Ezek beállítandó kiindulási értékek, nem mért adatok.',
  'help.guide.tour-paddle-wind.step.3':
    'A sávok a nap óráit mutatják, a széllökések az átlagos szél mögött látszanak. Ha egy sáv fölé viszed az egeret, megjelennek az adott óra értékei és a szélirány.',
  'help.guide.tour-paddle-checklist.goal':
    'Nézd meg, mit tudni a duzzasztógátakról, zsilipekről és a hozzáférési szabályokról egy mentett útvonalon, és döntsd el, mit teszel az egyes helyeken.',
  'help.guide.tour-paddle-checklist.tip.3':
    'Az „Ellenőrzés újra” jelölésű tételről még azelőtt döntöttél, hogy az útvonal vagy az adatok megváltoztak. Dönts újra, vagy válaszd a „Döntés megtartása” vagy a „Döntés törlése” lehetőséget. A már nem érvényes döntések a „Korábbi döntések” alatt láthatók.',
  'help.guide.tour-paddle-track-marks.step.3': 'Kattints az „1 túra importálása” gombra.',
  'help.guide.tour-paddle-track-marks.result':
    'A rögzített nyomvonal tartalmazza az átemeléseket és a zsilipeket, az „Időbecslés” pedig számol velük.',
  'help.guide.tour-horse-plan.title': 'Lovastúra tervezése lovasútvonalak mentén',
  'help.guide.tour-horse-plan.step.7':
    'A „Túra neve” mezőben adj nevet a lovastúrának, majd kattints a bal oldali oszlop alján a „Mentés” gombra.',
  'help.guide.tour-horse-gap.goal':
    'Folytasd a lovastúrát egy olyan szakasszal, amely nem a jelenlegi végpontnál kezdődik.',
  'help.guide.tour-horse-gap.tip.3':
    'Ha egy szakasz a lovastúrád végpontjától 25 m-en belül kezdődik, közvetlenül onnan folytatódik, és a „Csatlakozás a túrához” ezt mutatja: „A túra végéhez csatlakozik”.',
  'help.guide.tour-horse-recorded.tip.1':
    'A vonal pontosan úgy marad, ahogy a fájl rögzítette. Semmi sem kerül újratervezésre, és a rögzített lovastúrának nincs szerkeszthető változata.',
  'help.guide.dateless-trip.result':
    'A kártyán az „Ötlet” és a „Nincs dátum megadva” jelzés látszik, és az utazásnak annyi üres napja van, amennyit megadtál.',
  'help.guide.trip-reminder.title': 'Emlékeztető kérése utazás előtt',
  'help.guide.upcoming-reservations.tip.1':
    'A szállodai tartózkodás kétszer jelenik meg: egyszer a bejelentkezésnél, egyszer a kijelentkezésnél.',
  'help.guide.half-company-holiday.result':
    'A cégnél aznap fél nap a szabadnap, és az erre a napra rögzített szabadság csak fél napnak számít.',
  'help.guide.edit-holiday-calendar.title': 'Ünnepnapnaptár módosítása vagy eltávolítása',
  'help.guide.answer-fusion-request.result':
    'Az „Elfogadás és összevonás” után mindkét terv egy rácsban látszik, mindenki a saját színével.',
  'help.guide.log-for-partner.result':
    'A napok a másik személy színével jelennek meg, és az ő szabadságkeretéből vonódnak le, nem a tiédből.',
  'help.guide.dissolve-fusion.tip.1':
    'Ha ebben az ablakban a „Mégse” gombra kattintasz, a terv változatlan marad; a bejegyzéseid mindkét esetben megmaradnak.',
  'help.guide.country-places.tip.1':
    'Ha egy hely rossz országnál szerepel, általában hibás a címe vagy a koordinátái. Nyisd meg innen az utazását, és ott javítsd a helyet.',
  'help.guide.tour-activity-stats.title': 'Áttekintés a teljesített túráidról',
  'help.guide.tour-activity-stats.result':
    'Az ablakban és a „Túrák” fülön lévő összesítések már nem tartalmazzák a kihagyott túrát. Az útvonala, a napjai és az utazás változatlanok.',
  'help.guide.move-to-list.tip.2':
    'Az áthelyezés eltávolítja a helyeket a listáról, ezért az „Áthelyezés listába” csak a lista tulajdonosának vagy egy rendszergazdának jelenik meg. A „Másolás listába” bármelyik listáról működik, amelyet meg tudsz nyitni.',
  'help.guide.accept-list-invite.step.2':
    'Az „Elfogadás” gombbal csatlakozol, az „Elutasítás” gombbal visszautasítod a meghívást.',
  'help.guide.tour-collection-add-to-trip.tip.2':
    'Ha egy túrát vonal nélkül mentettek, az útpontjait is hozzá kell adni. Az ablak jelzi ezt, és ki is választja helyetted ezt a lehetőséget.',
  'help.guide.tour-collection-manage.tip.1':
    'Ha eltávolítasz egy túrát a listáról, az utazásaidban belőle már létrehozott túrák nem változnak.',
  'help.guide.entry-draft.tip.2':
    'Ha egy napot a Dawarichból veszel át, a bejegyzései vázlatok lesznek. Megosztás előtt ellenőrizd a jelvényt.',
  'help.guide.journey-map-layers.result':
    'A térkép csak a kívánt rétegeket mutatja, és minden gombostű, pont és vonal jelentése kiolvasható a jelmagyarázatból.',
  'help.guide.journey-keep-route.result':
    'A nap fejlécében megjelenik a távolság, az útvonal pedig folytonos vonalként látszik a térkép „Rögzített” rétegén az útinapló minden résztvevőjének. Megosztott linken csak akkor látszik, ha a „Rögzített útvonalak” be van kapcsolva.',
  'help.guide.journey-day-stays.result':
    'A tartózkodások, amelyekről döntöttél, eltűnnek a sorból. Az általad írt bejegyzések a saját napjukon jelennek meg, mint bármelyik másik, és a szokásos módon adhatsz hozzájuk fotót és szöveget.',
  'help.guide.journey-take-over-day.tip.2':
    'A vázlatok nem jelennek meg a megosztott linkeken. Adj hozzájuk fotókat és szöveget, majd minden bejegyzésben kapcsold ki a „Vázlat” kapcsolót.',
  'help.guide.journey-auto-prepare.tip.2':
    'Ha egy nap listagombján pont látszik, a nap még nem végleges; az elemleírásból kiderül, miért.',
  'help.ctx.settings-plugins.bullet.3':
    'Alul a „Bővítmény-tevékenység” felsorolja a pluginek által a nevedben végzett összes műveletet, a legújabbal kezdve, „Frissítés” gombbal.',
  'help.guide.language-region.tip.3':
    '„A hét kezdőnapja” minden dátumválasztó első oszlopát meghatározza; a Vacay-nek saját beállítása van.',
  'help.guide.web-push-device.tip.2':
    'iPhone-on és iPaden előbb add hozzá a TREK-et a Főképernyőhöz, és onnan nyisd meg.',
  'help.guide.connect-airtrail.step.3':
    'Kattints a „Mentés”, majd a „Kapcsolat tesztelése” gombra. A teszt jelzi, hány repülést talált, a jelvény pedig „Csatlakozva” állapotra vált.',
  'help.guide.connect-dawarich.step.3':
    'Kattints a „Mentés”, majd a „Kapcsolat tesztelése” gombra: a teszt megszámolja az elmúlt 30 nap tartózkodásait. Csatlakozás után a „Keresés most” azonnal ellenőriz, a jobb oldali „Leválasztás” pedig megszünteti a kapcsolatot.',
  'help.guide.tour-connect-wanderer.step.3':
    'Kattints a „Mentés”, majd a „Kapcsolat tesztelése” gombra. A teszt jelzi, hány útvonaladat importálhatod, a jelvény pedig „Csatlakozva” állapotra vált.',
  'help.guide.tour-wanderer-watch.step.2':
    'A TREK naponta legfeljebb egyszer lekéri az általad importált útvonalak rövid adatait, a sorban pedig látod, mikor ellenőrzött utoljára. Ha egy útvonal megváltozhatott, értesítést kapsz, és a „Jelzések” számlálója nő: a „Jelzések” gombra kattintva minden túránál látod, hogy „Változhatott”, „Megváltozott” vagy „Nem ellenőrizhető”, és onnan meg is nyithatod.',
  'help.guide.plugin-settings.goal':
    'Add meg egy pluginnek a saját kulcsaidat és beállításaidat, és nézd meg, mit végzett a nevedben.',
  'help.guide.own-routing-engine.result': 'Minden utazás útvonalait a te szervereid számolják.',
  'help.guide.admin-passkeys.title': 'Passkey-bejelentkezés bevezetése',
  'help.guide.rotate-jwt-secret.tip.1': 'Téged is kijelentkeztet, ezért utána azonnal jelentkezz be újra.',
  'help.guide.notification-defaults.title': 'Alapértelmezett értesítési beállítások megadása a felhasználóknak',
  'help.ctx.notifications.title': 'Értesítések',
  'help.guide.read-notifications.goal':
    'Nézd meg, mi történt az utazásaidban, amíg távol voltál, és nyisd meg közvetlenül.',
  'help.guide.filter-notifications.goal':
    'Nézd át az összes értesítésedet, vagy csak azokat, amelyeket még nem olvastál.',
  'help.guide.mark-notifications-read.step.1':
    'Kattints az értesítés időpontja melletti dupla pipára („Olvasottnak jelölés”), ha csak azt az egyet szeretnéd olvasottnak jelölni.',
  'help.guide.delete-notifications.step.2':
    'A felül lévő „Összes törlése” egyszerre törli a teljes listát, miután egy ablakban megerősítetted.',
  'help.guide.notification-settings.step.3':
    'A Beállítások oldalsávjában kattints az „Értesítések” pontra. Az első kártyán minden eseménynek saját sora van, és az alkalmazáson belüli oszlop határozza meg, mi jelenjen meg a csengőnél.',
  'help.guide.link-journal.result':
    'Az utazás fülsorában megjelenik a „Napló” fül. Mindenki, akinek „Olvasás” vagy „Szerkesztés” jogot adtál, ezen a fülön nyithatja meg a naplót, élő frissítéssel.',
  'help.guide.create-place.tip.4':
    'A Google Mapsből másolt link a keresőben is működik: illeszd be, nyomj Entert, és a TREK kiolvassa belőle a helyet. Ha az űrlapon már van pozíció, a kereső melletti célkereszt („Helyek a gombostű közelében”) felsorolja, mi található a közelben.',
  'help.guide.dawarich-stays.step.2':
    'A tartózkodások napok szerint csoportosítva jelennek meg, mindegyik az érkezés és a távozás idejével; a mérőóra ikon azt a tartózkodást jelöli, amelyben a Dawarich bizonytalan volt. Kattints a tartózkodás melletti gombostűre („Hozzáadás helyszínként”).',
  'help.guide.leave-stop-off-route.step.3':
    'Ha újra az útvonal része legyen, nyisd meg ugyanezt a menüt, és válaszd a „Visszavétel az útvonalba” lehetőséget.',
  'help.guide.move-booking-day.tip.1':
    'A többnapos foglalás közbülső napjain lévő halvány sorokat nem lehet húzni, és az átszállásos repülés egyes szakaszait sem.',
  'help.guide.place-image-from-file.step.2':
    'Kattints a fejlécben lévő kerek képre. Mivel a helyhez fotók tartoznak, egy kis ablak megkérdezi, honnan származzon a kép.',
  'help.guide.place-own-hours.goal':
    'Írd a kártyára az általad ellenőrzött nyitvatartást, ha a lekérdezett adat hibás vagy hiányzik.',
  'help.guide.place-own-hours.tip.2':
    'A telefonszám és az e-mail-cím gombként jelenik meg a kártya fejlécében. Rájuk kattintva megnyílik a telefon- vagy a levelezőalkalmazásod.',
  'help.guide.edit-accommodation.tip.3':
    'Ha a Beállítások „Megjelenés” részében be van kapcsolva a „Foglalási kódok elrejtése”, a visszaigazolási szám elmosva marad. Vidd fölé az egeret, vagy kattints rá, és elolvashatod.',
  'help.guide.confirm-stay-booking.tip.1': 'Ha újra a jelvényre kattintasz, a foglalás visszaáll „Függőben” állapotra.',
  'help.guide.map-markers.tip.4':
    'Ha a Beállítások > Megjelenés menüpont „Utazás és térkép” részében be van kapcsolva a „Kompakt jelölők a nem tervezett helyekhez”, a még egyik napon sem szereplő helyek kis pontként jelennek meg, fotó és értékelés nélkül. A kiválasztott hely mindig teljes méretben látszik.',
  'help.guide.tour-map-lines.step.1':
    'Az utazás minden túrája a saját színével, vonalként jelenik meg a térképen, a kezdőpontjánál egy gombostűvel. Ha a túrának színt választottál, a vonal azt használja, egyébként a kategóriája színét.',
  'help.guide.car-stops.step.6': 'Kattints a „Hozzáadás” gombra.',
  'help.guide.transport-details.step.4':
    'A címre kattintva az űrlap megnyitása nélkül nevezheted át az utat. Az „Átnevezés” ablakban már ott a jelenlegi név: írd be az újat, és kattints a „Mentés” gombra.',
  'help.guide.export-transports-csv.goal':
    'Exportáld az utazás közlekedési adatait a TREK-ből CSV-fájlként, táblázatkezelőhöz, utazási irodának vagy nyomtatáshoz.',
  'help.guide.group-sort-bookings.result':
    'A foglalások a választott csoportokban és sorrendben jelennek meg, és ez a böngésző a következő alkalomra is megjegyzi a beállítást.',
  'help.guide.booking-on-map.step.1':
    'Kattints egy olyan foglalás kártyájára, amelyhez hely tartozik, a „Hely / Tevékenység” alatt, illetve szállásnál a „Szállás” alatt kapcsolva. Megnyílnak a részletei.',
  'help.guide.export-bookings-csv.title': 'Foglalások exportálása táblázatként',
  'help.guide.export-bookings-csv.tip.3':
    'A gomb akkor jelenik meg, amint a fülön van legalább egy foglalás. A „Közlekedés” fül ugyanígy exportálja a saját bejegyzéseit.',
  'help.guide.arrange-packing-list.title': 'Csomagolási lista rendezése a saját sorrended szerint',
  'help.guide.count-packed-pieces.result':
    'A sorban látszik, hány darab van már becsomagolva, és amint az utolsó is bekerül, a tétel kipipálódik.',
  'help.guide.expense-receipts.title': 'Nyugta csatolása kiadáshoz',
  'help.guide.expense-receipts.tip.1':
    'A szerkesztőben egy felsorolt fájl nevére kattintva ugyanez az előnézet nyílik meg. Ilyenkor az Esc csak az előnézetet zárja be, a kiadást nem.',
  'help.guide.files-sync-settings.step.5':
    'A „Ha mindkét oldal változott” határozza meg, melyik példány marad meg, ha egy dokumentumot mindkét helyen szerkesztettek: „Kérdezzen rá”, „A TREK-példány megtartása” vagy „A tároló példányának megtartása”. Az „Automatikus szinkronizálás” bekapcsolásával a TREK a háttérben figyeli a változásokat; kikapcsolva a kártyán „Szüneteltetve” látszik, és csak a „Szinkronizálás most” indít szinkronizálást. Minden itteni módosítás azonnal mentődik.',
  'help.guide.manage-notes.step.5':
    'A „Törlés” előbb rákérdez („Törli a jegyzetet?”), mert a jegyzet a fájljaival együtt minden tagnál törlődik. A megerősítéshez kattints a „Törlés” gombra.',
  'help.guide.note-categories.step.3':
    'Egy kategória nevére kattintva átnevezheted. Írd be az új nevet, és nyomj Entert; az Esc billentyűvel megtartod a régit.',
  'help.guide.roadtrip-reorder.step.2':
    'Ha egy megállót másik napra szeretnél tenni, ejtsd annak a napnak a kártyáján egy megállóra. Húzás közben a kettőnél kevesebb megállóval rendelkező napok szaggatott kártyaként jelennek meg a sáv végén, és ezekre is ejtheted.',
  'help.guide.roadtrip-corridor.tip.4':
    'A szűrő alatt kiválaszthatod a nap egy megállóját, vagy a „Félúton két között” lehetőséget, így csak az marad, ami attól a ponttól 25, 50 vagy 100 km-en belül van. Ha töltők is vannak a listában, a „Bármely csatlakozó” és a „Bármely teljesítmény” csatlakozótípus és teljesítmény szerint szűri őket.',
  'help.guide.roadtrip-overnight.result':
    'A hely az adott nap éjszakai megállójaként jelenik meg az útvonalon, a szállás pedig ugyanúgy foglalásként szerepel az utazásban, mint bármelyik másik.',
  'help.guide.roadtrip-stop-fill.result':
    'Ennél a megállónál a tank a választott szintre töltődik. Az utána következő hatótáv, az esetleges „Itt fogy ki a tank” sávval együtt, ebből számolódik.',
  'help.guide.roadtrip-bookings.step.4': 'Kattints a kártyára a foglalás megnyitásához.',
  'help.guide.roadtrip-google-import.goal':
    'Egy Google Mapsben tervezett útvonalból készíts megállókat az egyik napodon.',
  'help.guide.roadtrip-google-import.tip.3':
    'Az importáláshoz internetkapcsolat, valamint a helyek és a napok szerkesztéséhez szükséges jogosultság kell.',
  'help.guide.roadtrip-hazards.tip.2':
    'A DWD Németországot fedi le, a GDACS világszerte jelenti a katasztrófákat. Ha egy figyelmeztetés csak pontként jelenik meg, az érintett terület ismeretlen.',
  'help.ctx.trip-tours.bullet.5':
    'A napok oszlopában a túra egy megállóhoz hasonló sor. Ha van „Kezdés” időpontja, a sorban kezdés → befejezés látszik, a befejezést a túra idejéből számolja a TREK, a „További lehetőségek” menüben pedig a „Szerkesztés”, az „Eltávolítás a napról”, a „Kihagyás az útvonalból” és a „Mentés gyűjteménybe” található.',
  'help.guide.tour-show-list.step.5': 'Ugyanebben a kapcsolóban a „Hely” gombra kattintva visszakapod a helylistát.',
  'help.guide.tour-add-to-day.step.2':
    'Válaszd ki a napot. A menü az utazás összes napját felsorolja dátummal és címmel; az a nap, amelyen a túra már szerepel, szürke.',
  'help.guide.tour-add-to-day.result': 'A túra megjelenik a napja alatt, a vonala pedig a térképen az adott nap része.',
  'help.guide.tour-day-times.tip.2':
    'Ha egy napon egy többnapos túrának csak egy szakasza szerepel, a TREK nem számol befejezési időt, mert a túra ideje a teljes útvonalra vonatkozik.',
  'help.guide.tour-remove-from-day.step.3':
    'Vagy kattints a nap fejlécére a nap megnyitásához, kattints a túrára a listában, majd a kártyája alján az „Eltávolítás a napról” gombra.',
  'help.guide.tour-filter-list.step.3':
    'Ha a lista vegyes, a „Forrás” (TREK, GPX-import, wanderer), az „Útvonalkorlát” (T1-től T6-ig) és a „Típus” („Gyalogtúra”, „Kerékpártúra” és így tovább) tovább szűkíti. Egy bejelölt értékre újra kattintva törlöd a szűrést.',
  'help.guide.tour-hide-on-map.step.1':
    'Vidd az egeret egy túra fölé a listában, és kattints a sor jobb oldalán megjelenő szem ikonra („Elrejtés a térképen”).',
  'help.guide.tour-import-plan-tab.step.1':
    'A „Terv” fülön a jobb oldali oszlop tetején lévő kapcsolóban kattints a „Túrák” lehetőségre.',
  'help.ctx.trip-tour-detail.bullet.1':
    'Kattints egy túrára a „Túrák” listában (ehhez előbb állítsd a jobb oldali oszlopot „Hely” nézetről „Túrák” nézetre), egy napon belüli sorára vagy a térképen a vonalára, és a kártyája megnyílik a térkép fölött. A térkép a kártya megnyitása közben is használható.',
  'help.guide.tour-detail-read.step.2':
    'A fejlécben a túra neve látszik, alatta gombokban az összefoglaló: a túra típusa, importált túránál a forrása, a tervezett időtartam, a távolság, a szintemelkedés és a szintcsökkenés.',
  'help.guide.tour-detail-read.tip.3':
    'Egyes túráknál több adat is látszik: a városi sétánál a megállók, az evezős túránál az ellenőrzések és a szél, a már teljesített túránál a „Tényleges nyomvonal”, a listához kapcsolt túránál pedig a „Csomagolási lista”.',
  'help.guide.tour-rename-colour.step.3':
    'Kattints a túra kerek csempéjének sarkában lévő színes pontra („Nyomvonal színe”). A fejléc alatt megnyílik a „Nyomvonal színe” rész.',
  'help.guide.tour-take-along.step.2':
    'Ha a túrának van weboldala, a mellette lévő gombon az oldal neve látszik (Komoot, AllTrails, Outdooractive vagy Wanderer), egyéb oldalaknál pedig „Weboldal”. A gomb új lapon nyitja meg az oldalt.',
  'help.guide.tour-copy-keep.goal':
    'Készíts egy túrából változatot ebben az utazásban, vagy mentsd el későbbi utazásokhoz az egyik gyűjteményedbe.',
  'help.guide.tour-copy-keep.tip.4':
    'A „Gyűjtemény” csak akkor érhető el, ha a Gyűjtemények bővítmény be van kapcsolva. Csak olvasható listát nem választhatsz, ha pedig még nincs listád, az ablak a „Gyűjtemények megnyitása” lehetőséget kínálja.',
  'help.guide.tour-packing-link.step.5':
    'A tételek kipipálásához kattints a „Csomagolási lista megnyitása” gombra. A TREK a „Listák” fülre vált, a csomagolási listára.',
  'help.guide.tour-files.step.2': 'Az alatta lévő sor most mutatja a fájlok számát, és kinyílik a lista.',
  'help.guide.tour-activity-link.step.2':
    'A „Teljesítve” alatt ellenőrizd, melyik napon teljesítetted. Ha egyik naphoz sem tartozik, válaszd a „Nap nélkül” lehetőséget.',
  'help.guide.tour-activity-compare.title': 'A terv összevetése a teljesítettel',
  'help.guide.tour-activity-compare.result': 'A kártyán és a térképen is gyorsan összevetheted a napot a tervvel.',
  'help.guide.tour-origin-check.tip.3':
    'A „Nincs wanderer-kapcsolat” azt jelenti, hogy a fiókod még nincs csatlakoztatva. Csatlakoztasd a Beállítások „Integráció” részében.',
  'help.ctx.trip-tour-planner.bullet.5':
    'A térkép tetején lévő „Hely vagy cím keresése” mezővel mozgathatod a térképet. A bal alsó gomb a túra típusához elérhető térképek között vált, például Topo vagy „Műhold”, és itt vannak a megnyitott túra kapcsolói is, például a „Pontok elhelyezése” és a 3D.',
  'help.guide.tour-open-workspace.step.5':
    'A térkép tetején lévő „Hely vagy cím keresése” mezővel egy adott helyre ugorhatsz, így ott kezdheted, ahol a túra lesz.',
  'help.guide.tour-draw-route.goal':
    'Helyezd el egy új túra pontjait a térképen, és a TREK megtervezi köztük az útvonalat.',
  'help.guide.tour-draw-route.tip.2':
    'A térkép gombján a Topo vagy a „Túrázás” térkép megmutatja az ösvényeket, így könnyebb rájuk kattintani. Ha egy pont túl messze van minden olyan úttól, amelyet a túratípus használhat, útvonal helyett értesítés jelenik meg.',
  'help.guide.tour-type-profile.step.3':
    'Kerékpártúránál a típus alatt a profilt is meg kell adni: „Túra”, „Országúti”, „Murva” vagy MTB. Az alatta lévő sor leírja, mit részesít előnyben az adott profil.',
  'help.guide.tour-edit-points.step.2':
    'Kattints egy sorra az „Útpontok” alatt, és kijelölöd a hozzá tartozó pontot. A gombostűje kiemelve jelenik meg a térképen.',
  'help.guide.tour-shaping-points.title': 'Útvonal módosítása alakítóponttal',
  'help.guide.tour-shaping-points.tip.3':
    'Lovastúránál a vonalra kattintás semmit sem ad hozzá, mert nincs útvonaltervező, amely alakítaná.',
  'help.guide.tour-loop-reverse.tip.2':
    'Ha újra egyirányú túrát szeretnél, töröld a „Vissza a kiindulópontra” sort. A kézzel rajzolt szakasz az irány megfordítása után is kézzel rajzolt marad.',
  'help.guide.tour-leg-by-hand.step.4':
    'A „Következő szakasz újratervezése” még egyszer az útvonaltervezőre bízza azt az egy szakaszt, a többit nem érinti.',
  'help.guide.tour-trip-places.step.3':
    'Kattints egy helyre. A túra új végpontjaként kerül be, a lista pedig nyitva marad a következőhöz.',
  'help.guide.tour-details-times.step.1':
    'A bal oldali sáv tetején lévő „Túra neve” mezőben található a név. Új túránál az ott látható szürke szöveg, például „Névtelen gyalogtúra”, csak helykitöltő: írd be a sajátodat.',
  'help.guide.tour-save.title': 'Túra mentése',
  'help.guide.tour-save.tip.3':
    'A mentés akkor sem működik, ha egy mezőben érvénytelen érték van, például olyan weboldal, amely nem érvényes cím. Ilyenkor a „Részletek” magától kinyílik, és megmutatja a hibát.',
  'help.guide.tour-edit-saved.tip.1': 'Ha nem módosítottál a túrán, a „Mentés” gomb szürke marad.',
  'help.guide.tour-summary-profile.step.3':
    'Mozgasd a mutatót a „Magassági profil” mentén. Látod az adott pont távolságát és magasságát, a térképen pedig egy pont jelöli ugyanazt a helyet.',
  'help.guide.tour-list-manage.step.1':
    '„Az út összesítése” a lista fölött található. Összecsukva a túrák számát mutatja, és azt, hány „Tervezett” és hány „Nem tervezett”. A jobb oldalán lévő nyíl típusonként egy sort nyit meg az összesített távolsággal, szintemelkedéssel, szintcsökkenéssel és idővel.',
  'help.guide.tour-list-manage.result':
    'Látod a szűrőnek megfelelő túrák összesítését, és minden túra a kívánt napon szerepel.',
  'help.guide.tour-delete.result': 'A túra eltűnt a listából, a térképről és az összes napról.',
  'help.guide.tour-saved-elsewhere.tip.2':
    'Ugyanez történik, ha a túrát egy másik eszközön módosítottad. Ha nem módosítottad, a túra egyszerűen újratöltődik, és egy megjegyzés jelzi ezt.',
  'help.ctx.trip-tour-import.bullet.5':
    'Ha a wanderer csatlakoztatva van a Beállítások, Integrációk menüpontban, és nincs megnyitott túra, az „Új túra tervezése” mellett megjelenik egy wanderer gomb. Ez felsorolja a saját útvonalaidat importáláshoz.',
  'help.guide.tour-import-gpx.tip.1':
    'A fájlokat a számítógépedről is ráhúzhatod a „Túrák” fülre. Ugyanez az előnézet nyílik meg.',
  'help.guide.tour-view-import.step.1':
    'A „Túrák” fülön „Az utazás túrái” között kattints egy „GPX-import” jelvényű túrára.',
  'help.guide.tour-plan-from-import.goal':
    'Készíts egy rögzített nyomvonalból mozgatható útpontokat, és nézd meg, mennyire követi az új útvonal az eredetit.',
  'help.guide.tour-plan-from-import.tip.4':
    'A „Lovastúra” típusnak nincs szerkeszthető változata: úgy marad meg, ahogy lovagolták.',
  'help.guide.tour-restore-recorded.tip.2':
    'A „Tervezés új túraként” funkcióval készült túrának nincs saját rögzített nyomvonala. Az az importált túra, amelyből készült, továbbra is a listában van.',
  'help.guide.tour-take-over.step.5': 'Ha szeretnéd, adj neki más nevet a „Név ebben az útban” mezőben.',
  'help.guide.tour-import-wanderer.step.1':
    'A „Túrák” fülön, megnyitott túra nélkül, kattints az „Új túra tervezése” melletti wanderer gombra.',
  'help.guide.tour-import-wanderer.result':
    'Az útvonal az utazás túrája lett, és wanderer-túraként nyílik meg a térképen.',
  'help.guide.tour-map-layers.title': 'Térkép kiválasztása a túrához',
  'help.guide.tour-map-layers.tip.3':
    'Evezős túránál és városi sétánál csak a „Térkép” és a „Műhold” érhető el; futásnál, sítúránál és lovastúránál a „Térkép”, a Topo és a „Műhold”.',
  'help.guide.tour-along-search.result':
    'Az útvonal menti helyek megjelennek a listában és a térképen, és megnézheted őket.',
  'help.guide.tour-along-add-stop.step.3':
    'Kattints a „Hozzáadás megállóként” gombra. A mellette lévő jelvény a kitérő légvonalban mért, durva becslése.',
  'help.guide.tour-3d-terrain.step.1':
    'Nyiss meg egy túrát a „Túrák” fülön, és kattints a bal alsó gomb végén lévő 3D lehetőségre. A térkép megdől, és 3D-ben mutatja a domborzatot, rajta az útvonallal.',
  'help.guide.tour-3d-terrain.tip.3':
    'A domborzathoz internetkapcsolat kell: a magassági adatok a nyílt Mapzen-domborzatcsempékből származnak. Az evezős túra meredekségi színek nélkül, a saját színével jelenik meg, mert a víz sík.',
  'help.guide.tour-3d-flyover.tip.1':
    'Átrepülés közben az egérgörgővel nagyíthatsz vagy kicsinyíthetsz; a kamera a ponton marad. A térképet csak szüneteltetés után húzhatod.',
  'help.guide.tour-map-overlays.step.4':
    'Evezős túránál a gomb helyette a „Hajózási jelek” lehetőséget kínálja. Rákattintva megjelennek a bóják, a jelzőfények és a kikötői jelek a vízen.',
  'help.ctx.trip-tour-stages.bullet.2':
    'Egy megálló „További műveletek” menüjében a „Szakasz vége itt” az adott megállónál lezár egy szakaszt. Az „Útpontok” ezután minden szakaszhoz „N. szakasz” címsort mutat a távolsággal és az idővel, a szakaszt lezáró megállót pedig hold ikon jelöli.',
  'help.guide.tour-multi-day.step.3':
    'Vidd az egeret arra a megállóra, ahol az első nap véget ér, kattints a „További műveletek” gombra, és válaszd a „Szakasz vége itt” lehetőséget.',
  'help.guide.tour-multi-day.result':
    'Egy útvonal a szakaszaival, mindegyik külön mért adatokkal. A megtartásukhoz kattints a „Mentés” gombra.',
  'help.guide.tour-stages-on-days.step.6':
    'A mellette lévő nyíl („A szakasz megnyitása a tervezőben”) a szerkesztőben, ennél a szakasznál nyitja meg a túrát.',
  'help.ctx.trip-tour-hike.bullet.1':
    'A szerkesztő tetején lévő „Túratípus” határozza meg, hogyan tervezi a TREK az útvonalat. A „Gyalogtúra” a „Részletek” alatt megadott „Ösvény legnagyobb nehézsége” szintig használ ösvényeket; a „Futás” futásra alkalmas utakat választ, és a „Tervezett tempó” megadását kéri.',
  'help.guide.tour-hike-plan.step.1':
    'Kattints a bal oldali oszlop tetején az „Új túra tervezése” gombra. A szerkesztő „Új túra” címmel nyílik meg.',
  'help.guide.tour-hike-plan.tip.2':
    'T4-es és afölötti szintnél előbb megjelenik a kérdés: „Engedélyezed a magashegyi útvonaltervezést?” Csak akkor erősítsd meg, ha az útvonal kitett vagy jelöletlen terepen is áthaladhat; a kérdés szerkesztésenként egyszer jelenik meg.',
  'help.guide.tour-hike-trail-details.step.4':
    'A listában egy fokozatra kattintva a térképen csak az ilyen szakaszok látszanak. Újabb kattintással ismét a teljes útvonal jelenik meg.',
  'help.guide.tour-hike-round.step.1':
    'Megnyitott gyalogtúránál kattints az „Útpontok” kártya fejlécében a „Körtúra a kezdőponttól” gombra. Másik megállóból indulva nyisd meg annak „További műveletek” menüjét, és válaszd a „Körtúra innen” lehetőséget.',
  'help.guide.tour-hike-round.tip.3':
    'A „Keresés újra” visszavisz a távolság megadásához, a „Mégse” pedig bezárja a kártyát anélkül, hogy bármi változna.',
  'help.guide.tour-hike-compare-ways.tip.1':
    'Ez csak gyalogtúráknál érhető el, és csak az útvonaltervező által tervezett szakaszoknál, a kézzel rajzoltaknál nem.',
  'help.guide.tour-ferrata-add.step.4':
    'Az „Útpontok” listában a két pont közötti szakasznál a vasalt út neve, nehézségi foka és hossza látszik.',
  'help.guide.tour-run-plan.goal': 'Tervezz futást futásra alkalmas utakon, és tudd meg az idejét a tempód alapján.',
  'help.guide.tour-run-plan.tip.2':
    'Az idő nem számol az emelkedőkkel, a lejtőkkel és az út technikai nehézségével: csak a távolság és a tempó szorzata.',
  'help.guide.tour-run-ways.result': 'Indulás előtt tudod, a futás mely részei nem aszfalton vezetnek.',
  'help.ctx.trip-tour-walk.bullet.4':
    '„A túra mentén” „A séta témája” szerint keres látnivalókat az útvonaltól adott távolságon belül, a „Hozzáadás megállóként” pedig a választott helyre illeszti be a sétába.',
  'help.guide.tour-walk-plan.step.5':
    'Állítsd a „Fontosság” értékét „Szokásos”, „Nem kötelező” vagy „Kihagyhatatlan” lehetőségre. Kapcsold be a „Védett” beállítást, ha a megállónak a helyén kell maradnia, amikor később módosítási javaslat érkezik, majd kattints a „Mentés” gombra.',
  'help.guide.tour-walk-sights.step.1':
    'Megnyitott városi sétánál keresd meg a bal oldali oszlopban „A túra mentén” részt, és válassz „A séta témája” alatt: „Kultúra és történelem”, „Parkok és kilátás”, „Étel és helyi élet” vagy „Mindenből egy kicsit”.',
  'help.guide.tour-walk-sights.result':
    'A látnivaló a séta megállója lett, a választott megállók közé beillesztve az útvonalba.',
  'help.guide.tour-walk-day-times.tip.2':
    'Ha egy megállónak még nincs tartózkodási ideje, az utána következő érkezési idők a lehető legkorábbi időpontként jelennek meg.',
  'help.guide.tour-walk-google-import.step.3':
    'Ellenőrizd a „Megállók a linkben” részt. Ha egy megállónak nincs pozíciója a linkben, a TREK megjelöli, és kihagyja.',
  'help.guide.tour-walk-check-off.step.1':
    'A „Terv” fülön kattints a városi sétára a napján. A kártyája a térkép mellett nyílik meg.',
  'help.ctx.trip-tour-bike.title': 'Kerékpártúrák',
  'help.guide.tour-bike-profile.step.1':
    'A „Túrák” fülön kattints a bal oldali sáv tetején az „Új túra tervezése” gombra.',
  'help.guide.tour-bike-profile.tip.2':
    'A profil csak az útvonaltervezőt irányítja. Arról semmit sem mond, hogy egy út járható-e kerékpárral: hogy az útvonal milyen utakon halad, azt a „Burkolat és utak” kártya mutatja.',
  'help.guide.tour-bike-surfaces.step.3':
    'A „Burkolat” alatt kattints egy sorra, például a „Murva” vagy a „Földút” sorra. A térképen kiemelve jelennek meg a hozzá tartozó szakaszok. Újabb kattintással megszünteted a kiemelést.',
  'help.guide.tour-bike-mtb-grades.goal': 'Nézd meg, mennyire nehezek egy MTB-túra ösvényei, mielőtt nekivágsz.',
  'help.guide.tour-bike-mtb-grades.tip.4':
    'Ha a profilt MTB-ről másra váltod, a nehézségi szakaszok eltűnnek, és az útvonal az új profillal újratervezésre kerül.',
  'help.guide.tour-ski-plan.title': 'Sí- és téli túra tervezése',
  'help.guide.tour-ski-plan.tip.1':
    '„Sífutás” esetén a „Technika” értékét is válaszd ki: „Klasszikus”, „Korcsolyázó” vagy „Ismeretlen”. A mezők alatti értesítés jelzi, mi hiányzik még.',
  'help.guide.tour-ski-options.step.2':
    'Nyisd meg a „Legnehezebb pályák” beállítást, és válaszd ki a legnehezebb fokozatot, amelyen síelni szeretnél, a „Kezdő” és a „Szakértő” között. Az alapértelmezés a „Közepes”.',
  'help.guide.tour-ski-fix-leg.title': 'Nem tervezhető sízakasz javítása',
  'help.guide.tour-ski-fix-leg.tip.4':
    'Amíg nincs minden szakasz megtervezve, a „Pályaútvonal” kártya jelzi, hogy még nincs síidő.',
  'help.guide.tour-ski-summary.tip.2':
    'A „Síidő” addig „Nincs kiszámolva”, amíg minden szakasz megtervezése meg nem történt. Ha a túrának mégis szeretnél időt adni, add meg a tervezett teljes időt a részleteiben.',
  'help.guide.tour-ski-pistes-layer.step.3':
    'A jelmagyarázat nehézség szerint mutatja a lesiklópályákat, valamint a sífutópályákat, a téli és hótalpas utakat, a szánkópályákat és a felvonókat. A „Teljes jelmagyarázat az OpenSnowMapen” megnyitja a teljes jelmagyarázatot.',
  'help.guide.tour-ski-import.step.2':
    'Az „Importálás előnézete” ablakban nyisd meg az „Importálás mint” listát, és válaszd a „Sí és tél” lehetőséget.',
  'help.guide.tour-ski-import.result':
    'A nyomvonal „Az utazás túrái” között szerepel, a „Sínyomvonal” kártyáján a szakággal és a technikával.',
  'help.ctx.trip-tour-paddle.bullet.6':
    'A bal oldali oszlop alján lévő „Az evezés kockázatos” sor megnyitja a „Biztonság a vízen” részt. A térkép a „Térkép” és a „Műhold” nézetet, rétegként pedig a „Hajózási jelek” lehetőséget kínálja.',
  'help.guide.tour-paddle-setup.step.6':
    'Az „Evezési tempó” szürkén mutatja a hajóhoz javasolt értéket. Ha saját értéket írsz be, a mezőn „Saját tempó” jelzés jelenik meg; az alatta lévő „Javasolt használata” link visszaállítja a hajóhoz javasolt sebességet.',
  'help.guide.tour-paddle-water-route.goal':
    'A TREK tervezzen meg egy szakaszt a folyón vagy a tavon, és értsd meg a megjegyzéseket azoknál a szakaszoknál, amelyeket nem tudott megtervezni.',
  'help.guide.tour-paddle-water-route.tip.3':
    'A megtervezett szakasz alatti megjegyzések jelzik a vadvizet a nehézségi fokával, a csónakcsúszdát („Csónakcsúszda”), vagy az egyenes vonallal áthidalt hiányt a térképadatokban („Hiány a térképadatokban”).',
  'help.guide.tour-paddle-portage.step.4':
    'Az „Útvonal” alatt a „Kövesd az utat” egy feltérképezett utat használ, az „Egyenes vonal” pedig egyenesen átvág. A TREK magától keresi az utat, és jelzi, ha nincs ilyen hosszú kerülő nélkül.',
  'help.guide.tour-paddle-lock.step.1':
    'Vidd az egeret a zsilipnél lévő megállóra, és kattints a három pontra („További műveletek”).',
  'help.guide.tour-paddle-time.title': 'Evezős túra idejének áttekintése és módosítása',
  'help.guide.tour-paddle-time.tip.2': 'A becslés nem számol a sodrással és a széllel.',
  'help.guide.tour-paddle-wind.step.4':
    'Nyisd meg a „Mit jelent a szél az evezésnél” részt, és megtudod, hogyan hat a hajóra az ellenszél, az oldalszél, a nyílt vízi átkelés és a széllökés.',
  'help.guide.tour-paddle-checklist.step.1':
    'Mentsd el az evezős túrát, majd keresd meg a bal oldali oszlopban az „Ellenőrzőlista” részt. A fejlécében lévő jelvény összefoglalja, hol tart a lista.',
  'help.guide.tour-paddle-checklist.tip.4':
    'Az akadályok a TREK által tárolt régiók OpenStreetMap-adataiból származnak. Ahol nincs ilyen adat, a kártya jelzi ezt, és a duzzasztógátakat, zsilipeket és átemeléseket neked kell ellenőrizned.',
  'help.guide.tour-paddle-track-marks.step.4':
    '„Az utazás túrái” között kattints a nyomvonalra. A bal oldali oszlop a rögzített formájában mutatja, az „Átemelések és zsilipek” kártyával együtt.',
  'help.ctx.trip-tour-horse.title': 'Lovastúrák',
  'help.guide.tour-horse-plan.goal': 'Állíts össze lovastúrát a kijelölt lovasútvonalak szakaszaiból a térképnézetben.',
  'help.guide.tour-horse-plan.result':
    'A lovastúra a kiválasztott szakaszokat követi, mindegyiket az útvonal nevével, a hozzáférést jelző ponttal és a hosszával, és „Az utazás túrái” között szerepel.',
  'help.guide.tour-horse-gap.step.1':
    'Ha már van szakasz a lovastúrában, nyiss meg egy másik útvonalat, és válassz egy olyan szakaszt, amely nem csatlakozik a lovastúrád végéhez. A „Csatlakozás a túrához” alatt egy értesítés jelzi, milyen messze vannak egymástól.',
  'help.guide.tour-horse-recorded.title': 'Rögzített lovastúra megtartása GPX-fájlból',
  'help.guide.tour-horse-recorded.tip.2':
    'Magassági adatok nélküli fájlnál a nulla szintemelkedés helyett a „Nincsenek magasságok a fájlban” üzenet látszik.',
  'help.guide.dateless-trip.tip.1':
    'Ha már tudod, mikor utazol, nyisd meg az űrlapot a kártyán lévő ceruzával, és add meg a dátumokat. A megtervezett napjaid megtartják a sorrendjüket, és ebben a sorrendben kapják meg a dátumokat.',
  'help.guide.trip-reminder.goal': 'Kapj emlékeztetőt néhány nappal az indulás előtt.',
  'help.guide.upcoming-reservations.tip.2':
    'A „Függőben” a még meg nem erősített foglalást jelöli. A lemondott foglalások és az archivált utazások nem jelennek meg.',
  'help.guide.half-company-holiday.tip.1':
    'Az aznapra már rögzített szabadság fél napra csökken. Aki később rögzíti ezt a napot, csak 0,5 napot használ fel.',
  'help.guide.edit-holiday-calendar.goal':
    'Nevezd át, színezd át, helyezd át vagy töröld az általad hozzáadott ünnepnapi vagy iskolai szüneti naptárat.',
  'help.guide.person-color.title': 'Személy színének módosítása',
  'help.guide.answer-fusion-request.tip.1':
    'A kérelem nyitva marad, amíg nem válaszolsz rá. Ha több kérelem is van, egymás után jelennek meg.',
  'help.guide.log-for-partner.tip.1': 'A „Fél nap” és a „Csúsztatás” a kiválasztott személynél is működik.',
  'help.guide.dissolve-fusion.tip.2':
    'Ha csak azt szeretnéd, hogy valaki lássa a napjaidat, inkább oszd meg vele a naptáradat.',
  'help.guide.country-details.tip.2':
    'A „Hely” jelvényre kattintva az országhoz számolt összes helyet látod, utazásonként csoportosítva.',
  'help.guide.country-places.tip.2':
    'A jelvény csak akkor jelenik meg, ha az országhoz saját helyek tartoznak. A csak kézzel megjelölt országnak nincsenek ilyen helyei.',
  'help.guide.tour-activity-stats.goal':
    'Nézd meg az összes utazásodon teljesített túráid távolságát, szintemelkedését és számát egy adott időszakra és típusra, és hagyd ki azt a túrát, amely elmaradt.',
  'help.guide.tour-activity-stats.tip.1':
    'Egy túra akkor számít bele, ha az utolsó napja már elmúlt. Az egyik naphoz sem rendelt, vagy csak dátum nélküli napokon szereplő túra soha nem számít bele. Ha szeretnéd beszámítani, rendeld az utazásában egy dátummal rendelkező naphoz.',
  'help.guide.move-to-list.result':
    'A helyek a másik listára kerültek, és egy rövid üzenet jelzi, hányat helyeztél át vagy duplikáltál.',
  'help.guide.accept-list-invite.tip.1':
    'Hogy mit tehetsz a listán, az a tulajdonostól kapott szerepkörtől függ: „Néző”, „Szerkesztő” vagy „Adminisztrátor”.',
  'help.guide.tour-collection-add-to-trip.title': 'Túra hozzáadása listából egy utazáshoz',
  'help.guide.tour-collection-add-to-trip.tip.3':
    'Ha egy túrát listába szeretnél menteni, nyisd meg az utazásban a mentett túrát, és kattints az alján a „Gyűjtemény” gombra.',
  'help.guide.tour-collection-manage.tip.2': 'A kukát csak a lista tulajdonosa és adminisztrátorai látják.',
  'help.guide.entry-draft.result':
    'A bejegyzés „Vázlat” jelöléssel az idővonaladon marad, de a megosztott linken nem jelenik meg.',
  'help.guide.journey-map-layers.title': 'Az útinapló térképén megjelenő elemek kiválasztása',
  'help.guide.journey-keep-route.title': 'Egy napon rögzített útvonal megtartása',
  'help.guide.journey-day-stays.title': 'Bejegyzések írása a Dawarich által rögzített tartózkodásokból',
  'help.guide.journey-take-over-day.title': 'Teljes rögzített nap átvétele',
  'help.guide.journey-take-over-day.result':
    'A napon most minden tartózkodásnak vagy összevont csoportnak saját vázlata van, vagy egyetlen napi beszámoló, és a tartózkodásai már nem szerepelnek nyitottként.',
  'help.guide.journey-auto-prepare.result':
    'Amíg egy összekapcsolt utazás tart, az egyes napok tartózkodásai az adott napnál jelennek meg, készen a „Nap átvétele” funkcióra.',
  'help.ctx.settings-about.title': 'Névjegy',
  'help.guide.web-push-device.tip.3':
    'A pushhoz a TREK-et HTTPS-en keresztül kell megnyitni. Ha az értesítések le vannak tiltva, engedélyezd őket a böngésző beállításaiban, és próbáld újra.',
  'help.guide.connect-airtrail.result':
    'A jelvényen „Csatlakozva” látszik, és az utazások „Közlekedés” fülén megjelenik az „Importálás az AirTrailből” lehetőség.',
  'help.guide.connect-dawarich.result':
    'A jelvényen „Csatlakozva” látszik, és az utazástervező, a napló és az Atlasz is felajánlhatja a Dawarich által rögzített adatokat.',
  'help.guide.tour-connect-wanderer.result':
    'A jelvényen „Csatlakozva” látszik, és az utazások „Túrák” fülén kereshetsz a wanderer-példányodban, és importálhatod az útvonalait.',
  'help.guide.tour-wanderer-watch.result':
    'A TREK figyeli az importált útvonalaidat, és szól, ha valamelyik megváltozhatott. A túra csak akkor változik, ha elfogadod a módosítást.',
  'help.guide.plugin-settings.step.1':
    'A beállítások oldalsávjában nyisd meg a „Pluginok” részt. A „Bővítménybeállítások” alatt minden olyan pluginnek, amely beállítást kér tőled, saját kártyája van a mezőivel: töltsd ki őket, és kattints a „Mentés” gombra. A kártyán lévő műveletek megerősítés után futnak le.',
  'help.guide.profile.step.3': 'Kattints a kártya alján, jobb oldalon a „Mentés” gombra.',
  'help.guide.default-user-settings.title': 'Az új felhasználók alapbeállításainak megadása',
  'help.guide.own-routing-engine.tip.1':
    'A nyilvános OSRM-szerverek nagyjából másodpercenként egy kérést engedélyeznek. Ez egy napra elég, de egy autós útnál túl lassú lehet.',
  'help.guide.admin-passkeys.goal':
    'A felhasználók ujjlenyomattal, arcfelismeréssel vagy az eszközük PIN-kódjával is bejelentkezhessenek.',
  'help.guide.rotate-jwt-secret.tip.2':
    'Ha csak egyetlen felhasználót szeretnél kijelentkeztetni, adj neki új jelszót („Új jelszó”) a „Felhasználó szerkesztése” ablakban. Ez csak az ő munkameneteit szünteti meg.',
  'help.guide.notification-defaults.goal':
    'Add meg, milyen értesítési beállításokkal induljon minden felhasználó, és tilts le teljesen egy csatornát egy adott eseménynél.',
  'help.ctx.notifications.summary':
    'Az összes értesítés, amelyet a TREK az alkalmazáson belül megjelenített, a legújabbal kezdve: egy foglalás, amelyet valaki módosított, egy új üzenet egy utazás csevegésében, egy veled megosztott naptár. A jobb felső sarokban lévő csengő a legújabb tízet mutatja, ez az oldal az összeset.',
  'help.guide.read-notifications.step.1':
    'Kattints a jobb felső sarokban a csengőre. A rajta lévő piros szám az olvasatlan értesítések számát mutatja.',
  'help.guide.filter-notifications.step.1': 'Kattints a jobb felső sarokban a csengőre.',
  'help.guide.mark-notifications-read.step.2':
    'Felül az „Összes olvasottnak jelölése” gombbal egyszerre az összes értesítést olvasottnak jelölheted.',
  'help.guide.delete-notifications.tip.1':
    'A törlés csak nálad távolítja el az értesítést. A foglalás, az üzenet vagy a megosztás, amelyről szólt, változatlan marad.',
  'help.guide.notification-settings.tip.1':
    'Ha egy cellában lakat látszik, a rendszergazda mindenkinél kikapcsolta az adott eseményt.',
  'help.guide.add-guest.tip.3':
    'Vendéget csak az utazás tulajdonosa adhat hozzá, nevezhet át és távolíthat el. Azt a vendéget, aki kifizetett egy kiadást, addig nem lehet eltávolítani, amíg nem módosítod a fizetőt, vagy nem törlöd a befizetést.',
  'help.guide.link-journal.tip.1':
    'Csak a saját naplóidat kapcsolhatod össze. Olyan naplót, amelybe csak írhatsz, nem kapcsolhatsz össze.',
  'help.ctx.trip-places.bullet.7':
    'A kereső melletti pipával kijelölést indíthatsz. Az oszlop alján megjelenő sávval egyszerre több sornak adhatsz új kategóriát, gyűjteménybe teheted, meglátogatottnak jelölheted vagy törölheted őket.',
  'help.guide.filter-places.step.5':
    'Ha az utazás több országot vagy régiót is érint, a földgömbbel egy országra vagy azon belül egy régióra szűrheted a listát, mindegyiknél a darabszámmal. A „Szűrő törlése” visszaállítja a „Minden ország” nézetet.',
  'help.guide.import-places-file.tip.3':
    'Ha a Túrák bővítmény be van kapcsolva (ez az alapértelmezés), a fájlt az oszlop tetején, a „Túrák” részben importálhatod a „GPX vagy KML importálása” gombbal, és a vonalai túrák lesznek. A fájlban lévő pontokat itt nem importálja a TREK, mert a túrák csak vonalakból állnak.',
  'help.guide.dawarich-stays.step.3':
    'Ellenőrizd a nevet, az „Érkezés” és a „Távozás” időpontját, válassz napot, vagy hagyd a „Még nincs naphoz rendelve” értéken, ha szeretnéd, írj jegyzetet, majd kattints a „Hely hozzáadása” gombra.',
  'help.guide.leave-stop-off-route.result':
    'A megálló továbbra is a nap és a PDF része; amíg „Útvonalon kívül” jelölésű, az útvonal egyenesen az előtte lévő megállótól az utána következőig halad.',
  'help.guide.move-booking-day.tip.2':
    'A saját napján belül az időponttal rendelkező foglalás mindig visszaugrik az időpontjának megfelelő helyre.',
  'help.guide.place-image-from-file.step.3':
    'A „Csatolt fájlokból” alatt kattints a kívánt fotóra. A fölötte lévő „Feltöltés eszközről” gombbal helyette új képet választhatsz a számítógépedről.',
  'help.guide.place-own-hours.step.1':
    'Nyisd meg a helyet, és kattints a kártya jobb alsó sarkában a „Szerkesztés” gombra. Megnyílik a hely űrlapja.',
  'help.guide.place-own-hours.tip.3':
    'Ha a „Nyitvatartás törlése”, majd a „Frissítés” gombra kattintasz, a kártyán újra az automatikusan talált nyitvatartás jelenik meg.',
  'help.guide.confirm-stay-booking.title': 'Szállásfoglalás megerősítése',
  'help.guide.confirm-stay-booking.tip.2':
    'Ugyanez a gomb minden foglalásnál működik, a nap „Foglalások” része alatt lévőknél is.',
  'help.guide.map-lock.tip.2':
    'Ez a böngésző minden utazásnál megjegyzi a lakat állását. Egy utazás megnyitásakor a térkép ettől még egyszer ráközelít az utazásra, így soha nem üres területen nyílik meg.',
  'help.guide.tour-map-lines.step.2':
    'Kattints a vonalra vagy a kezdeténél lévő gombostűre. A túra kártyája megnyílik a térkép alsó részén, a vonala pedig szélesebben, fehér szegéllyel jelenik meg, így a többi vonal között is látod. A kártya fejlécében lévő X bezárja.',
  'help.guide.car-stops.title': 'Autóút tervezése útközbeni megállókkal',
  'help.guide.car-stops.result':
    'Az autóút kártyaként jelenik meg a „Közlekedés” fülön és sorként a napján, a térképen pedig a vonala az átvételi helytől sorban minden megállón át a leadási helyig vezet.',
  'help.guide.transport-details.step.5':
    'A részletek alján lévő „Térképen” gomb megmutatja az út vonalát, és a napján megnyitja a „Terv” fület. A jobb szélen lévő „Szerkesztés” megnyitja a teljes űrlapot, a mellette lévő kuka pedig megerősítés után törli az utat.',
  'help.guide.export-transports-csv.step.1':
    'Ha csak egy részére van szükséged, előbb szűkítsd a listát. A „Keresés”, a „Szűrő” és a „Nézet beállításai” alatti rendezés is számít: a fájl azt tartalmazza, amit a fül mutat, ugyanabban a sorrendben.',
  'help.guide.group-sort-bookings.tip.1':
    'A „Kártyák” és a „Lista” nézetnek saját csoportosítása van: a „Kártyák” alapból állapot, a „Lista” nap szerint csoportosít. A „Nézet beállításai” gombon lévő pont jelzi, ha valami eltér az alapértelmezéstől, a panel alján lévő „Nézet visszaállítása” pedig visszaállítja az alapértelmezést.',
  'help.guide.booking-on-map.step.2': 'Kattints a részletek alján a „Térképen” gombra.',
  'help.guide.export-bookings-csv.goal':
    'Exportáld az utazás foglalásait CSV-fájlként, amelyet Excelben, Numbersben vagy bármilyen más táblázatkezelőben megnyithatsz.',
  'help.guide.arrange-packing-list.goal':
    'Helyezd át a teljes listákat és az egyes tételeket oda, ahová szeretnéd, vagy nézd meg a listák tartalmát név szerint rendezve.',
  'help.guide.check-off-packing.tip.4':
    'Az egynél nagyobb mennyiségű tételeknél a darabokat egyenként is becsomagoltnak jelölheted. Lásd: Egy dolog több darabjának becsomagolása.',
  'help.guide.count-packed-pieces.tip.1':
    'A jelölőnégyzet bepipálásával egyszerre az összes darabot becsomagoltnak jelölöd, a pipa eltávolításával pedig mindet visszaállítod.',
  'help.guide.expense-receipts.goal':
    'Tárold a nyugtát vagy a számlát a hozzá tartozó kiadással, és nyisd meg később újra a főkönyvből.',
  'help.guide.expense-receipts.tip.2':
    'A nyugta melletti kukával mentéskor leveszed a nyugtát a kiadásról. Maga a fájl a „Fájl” részben marad; ha teljesen el szeretnéd távolítani, ott töröld.',
  'help.guide.files-sync.tip.4':
    'Ha a kártyán sárga figyelmeztetés látszik „Újracsatlakozás” gombbal, a tároló már nem fogadja el a mentett bejelentkezési adatokat. Kattints az „Újracsatlakozás” gombra, adj meg új alkalmazásjelszót vagy tokent, és a szinkronizálás újraindul.',
  'help.guide.files-sync-settings.result':
    'A következő futástól az utazás csak a választott irányban szinkronizál, a törléseket és az ütköző szerkesztéseket pedig a beállított szabályok szerint kezeli a TREK.',
  'help.guide.manage-notes.result':
    'A jegyzet egyszerre minden tagnál eltűnt a „Jegyzetek” kártyáról. A csak kitűzött vagy módosított jegyzet megmarad, és a többiek is abban az állapotban látják, ahogy hagytad.',
  'help.guide.note-categories.step.4':
    'A sorban lévő színpontok a kategória színét állítják: indigó, piros, borostyán, smaragd, kék vagy ibolya. Itt a „Szállás” kategória borostyánsárga lesz.',
  'help.guide.roadtrip-reorder.step.3':
    'Billentyűzettel jelöld ki a megállót, és az Alt billentyűt nyomva tartva a fel vagy le nyíllal egy hellyel mozgathatod a napján belül.',
  'help.guide.roadtrip-overnight.title': 'Éjszakázás az útvonal mentén',
  'help.guide.roadtrip-overnight.tip.1':
    'Az éjszakázás a következő napig tart. Más dátumokhoz módosítsd a foglalást: a „Nap” alatt változtasd meg a dátumokat a szállás többi adatával együtt.',
  'help.guide.roadtrip-stop-fill.tip.1':
    'A jelvény csak azoknál a megállóknál látszik, ahol az autód tankolhat vagy tölthet: „Üzemanyag” esetén a tankolóhelyeken, „Elektromos” esetén a töltőállomásokon, „Mindkettő” esetén mindkettőn.',
  'help.guide.roadtrip-bookings.result':
    'Minden lefoglalt út ott jelenik meg az autós útvonalon, ahol sorra kerül, és az előtte és utána lévő szakaszok a termináloktól, illetve a terminálokig vezetnek.',
  'help.guide.roadtrip-google-import.step.1':
    'Kattints „Az útvonalon” tetején lévő három pontra, és válaszd a „Google Maps-útvonal importálása” lehetőséget.',
  'help.guide.roadtrip-hazards.title': 'Aktuális figyelmeztetések megjelenítése a térképen',
  'help.guide.roadtrip-hazards.tip.3':
    'Az adatok tízpercenként frissülnek, és internetkapcsolatot igényelnek. A többi vezetési beállításhoz hasonlóan a kapcsoló az utazáshoz mentődik.',
  'help.ctx.trip-tours.bullet.6':
    'Az útvonal módosítása és a túra törlése a „Túrák” fülön, „Az utazás túrái” alatt történik.',
  'help.guide.tour-show-list.tip.1':
    'Ha a térképen egy túra vonalára kattintasz, a lista kiemeli azt a túrát, és odagörget hozzá.',
  'help.guide.tour-add-to-day.step.3':
    'A „Hozzáadva a 10. naphoz” üzenet megerősíti, a sor „Nap” jelvényt kap, a bal oldali oszlopban pedig a nap alatt megjelenik a túra az idejével, a távolságával és a szintemelkedésével.',
  'help.guide.tour-day-times.title': 'Kezdési idő megadása a túrához a napján',
  'help.guide.tour-day-times.tip.3':
    'Ugyanebben a menüben a „Kihagyás az útvonalból” a túrát a napon tartja, de kihagyja a nap térképes útvonalából. A „Visszavétel az útvonalba” visszavonja ezt.',
  'help.guide.tour-remove-from-day.tip.1':
    'A többnapos túrát naponként egyenként veheted le, mert minden napnak saját szakasza van.',
  'help.guide.tour-filter-list.step.4':
    'Zárd be a menüt. A gombon most az állapot, a megmaradt túrák száma, és minden további beállított szűrőhöz egy +1 látszik.',
  'help.guide.tour-hide-on-map.step.2':
    'A túra vonala eltűnik a térképről. A sora halványítva a listában marad, és egy áthúzott szem ikont mutat („Megjelenítés a térképen”). Rákattintva a vonal újra megjelenik.',
  'help.guide.tour-import-plan-tab.step.2':
    'Kattints a lista tetején a „GPX vagy KML importálása” gombra, és válaszd ki a fájljaidat (GPX, KML vagy KMZ).',
  'help.ctx.trip-tour-detail.bullet.2':
    'A fejlécben látod a túra kerek csempéjét, a nevét egy ceruzával az átnevezéshez, egy színes pontot a vonal színéhez, valamint gombokat a típussal, a forrással, a tervezett idővel, a távolsággal, a szintemelkedéssel és a szintcsökkenéssel. A jobb oldali X, vagy az Esc billentyű bezárja a kártyát.',
  'help.guide.tour-detail-read.step.3':
    'Vidd az egeret az idő fölé, és látod, miből áll össze: mozgással töltött idő, szünetek és a tervezett teljes idő.',
  'help.guide.tour-detail-read.tip.4':
    'A kártya nem módosítja az útvonalat. Ha egy pontot áthelyeznél vagy egy szakaszt újrarajzolnál, nyisd meg a „Túrák” fület, és „Az utazás túrái” alatt kattints a túrára.',
  'help.guide.tour-rename-colour.step.4':
    'Válassz színt. Az első cella, az „Automatikus szín”, visszaállítja a vonal alapértelmezett színét, az utolsó, az „Egyéni szín kiválasztása” pedig tetszőleges szín választását teszi lehetővé. A térképen a vonal és a „Túrák” listában a csík azonnal megváltozik.',
  'help.guide.tour-take-along.step.3':
    'A GPX gombbal GPX-fájlként töltheted le a mentett túrát: a teljes útvonalat a meglévő magassági adatokkal, navigációs alkalmazáshoz vagy GPS-eszközhöz.',
  'help.guide.tour-copy-keep.step.1':
    'Nyisd meg a túra kártyáját, és kattints alul a „Másolás” gombra. A TREK új, önálló túrát hoz létre a napjai nélkül, az eredeti pedig változatlan marad.',
  'help.guide.tour-copy-keep.result':
    'Az utazásban van egy második, szabadon módosítható túra, a gyűjteményben pedig egy saját másolat, amelyet egy másik utazáshoz is hozzáadhatsz.',
  'help.guide.tour-packing-link.tip.1':
    'Ez csak egy kapcsolat. Semmi sem másolódik vagy kerül át, a tételek a „Listák” fülön maradnak. Ha ott kipipálsz egyet, a túrán azonnal látszik.',
  'help.guide.tour-files.step.3': 'Egy fájlra kattintva megnyithatod.',
  'help.guide.tour-activity-link.step.3':
    'Válaszd ki a felvételt a „Nyomvonal” alatt, vagy a „GPX importálása” gombbal tölts be egy új fájlt.',
  'help.guide.tour-activity-compare.goal':
    'Nézd meg, hol tér el a ténylegesen bejárt nyomvonal a tervtől, és cseréld le vagy válaszd le.',
  'help.guide.tour-origin-check.title': 'Túra eredetének megtekintése',
  'help.guide.tour-origin-check.result': 'Tudod, honnan és mikor származik a túra, és hogy azóta megváltozott-e.',
  'help.ctx.trip-tour-planner.bullet.6':
    'A nem mentett vázlat megmarad: ha újra megnyitod a „Túrák” fület, a TREK visszaállítja, „Nem mentett vázlat visszaállítva” jelöléssel. A „Vissza a túrákhoz” és az „Elveti” rákérdez, mielőtt elvetné a módosításokat.',
  'help.guide.tour-open-workspace.step.6':
    'A bal alsó gombbal válthatsz a térképek között, kezdetben a „Térkép” és a „Műhold” között. Megnyitott túránál a típusához tartozó térképeket is kínálja, például Topo vagy „Túrázás”, valamint kapcsolókat, például a „Pontok elhelyezése” és a 3D.',
  'help.guide.tour-draw-route.step.1':
    'Kattints a bal oldali sáv tetején az „Új túra tervezése” gombra. A sáv „Új túra” nézetre vált, amely gyalogtúra, hacsak nem választasz másik típust.',
  'help.guide.tour-draw-route.tip.3':
    'Ha egy vázlatban mentetlen módosítások vannak, a „Túra hozzáadása” menü „Új túra tervezése” pontja előbb rákérdez: „Új túrát kezdesz?”, és felkínálja az „Elvetés és új” lehetőséget.',
  'help.guide.tour-type-profile.step.4':
    'Az útvonal a profilnak megfelelően újratervezésre kerül, a jobb oldali „Túra összefoglalója” pedig mutatja a távolságát és az idejét.',
  'help.guide.tour-edit-points.step.3':
    'A sorrend módosításához vidd az egeret egy sor fölé, és húzd a bal szélén megjelenő fogantyúnál fogva.',
  'help.guide.tour-shaping-points.goal': 'Tereld az útvonalat egy másik ösvényre anélkül, hogy megállót adnál hozzá.',
  'help.guide.tour-shaping-points.result':
    'Az útvonal ott halad, ahová húztad, a megállók számozása pedig nem változik.',
  'help.guide.tour-loop-reverse.tip.3':
    'Gyalogtúránál a mellettük lévő „Körtúra a kezdőponttól” az általad megadott hosszúságú körtúrákat keres.',
  'help.guide.tour-leg-by-hand.tip.1':
    'A kézzel rajzolt szakaszt egyetlen útvonaltervező sem ellenőrizte: átvezethet vízen, magánterületen vagy sziklafalon is.',
  'help.guide.tour-trip-places.step.4':
    'A sorában a név alatt „Az út helye” felirat látszik. A „További műveletek” menüben a „Leválasztás a helyről” megtartja a pontot, de megszünteti a kapcsolatot.',
  'help.guide.tour-details-times.step.2':
    'A „Részletek” alatt írj leírást („Leírás”), és ha van, add meg a weboldalt („Weboldal”).',
  'help.guide.tour-save.goal': 'Mentsd a megrajzolt túrát az utazásba.',
  'help.guide.tour-save.result': 'A túra mentve van az utazásban, és hozzárendelheted egy naphoz.',
  'help.guide.tour-edit-saved.tip.2':
    'Az importált GPX- vagy KML-nyomvonal megtekintésre, GPX-túraként nyílik meg. Az ott található „Szerkeszthető változat tervezése” olyan túrát hoz létre, amelyet módosíthatsz.',
  'help.guide.tour-summary-profile.step.4':
    'A címe melletti nyíl („Magassági profil összecsukása”) elrejti a profilt; újabb kattintással ismét megjelenik.',
  'help.guide.tour-list-manage.step.2':
    'Vidd az egeret egy túra fölé, és kattints a sorában lévő kerek plusz gombra („Hozzáadás a naphoz”): megjelennek az utazás napjai.',
  'help.guide.tour-delete.title': 'Túra törlése',
  'help.guide.tour-saved-elsewhere.title': 'Ha a túrát közben máshol mentették',
  'help.guide.tour-saved-elsewhere.result': 'Semmilyen módosítás nem vész el, hacsak valaki szándékosan el nem veti.',
  'help.guide.tour-import-gpx.title': 'GPX-, KML- vagy KMZ-fájl importálása túraként',
  'help.guide.tour-import-gpx.tip.2':
    'A fájl minden nyomvonalából vagy útvonalából külön túra lesz. A nyomvonalakat a TREK soha nem fűzi össze.',
  'help.guide.tour-view-import.step.2':
    'A bal oldali oszlop GPX-túraként mutatja: a „Túra összefoglalója” a távolsággal, a magassági adatokkal és a rögzített idővel, alatta a magassági profillal. A térképen a vonala látszik.',
  'help.guide.tour-plan-from-import.step.1':
    'Nyisd meg az importált túrát a „Túrák” fülön. A bal oldali „Szerkeszthető változat” kártyán kattints a „Szerkeszthető változat tervezése” gombra.',
  'help.guide.tour-plan-from-import.result':
    'A túrának most már vannak húzható útpontjai, az „Eredet” részben pedig ez áll: „Újratervezve, a rögzített nyomvonal megőrizve”.',
  'help.guide.tour-restore-recorded.result': 'A túra újra GPX-túra, és azt a vonalat mutatja, amellyel rögzítették.',
  'help.guide.tour-take-over.step.6': 'Kattints az „Átvétel” gombra.',
  'help.guide.tour-import-wanderer.step.2':
    'Írj a „Túraútvonalak keresése” mezőbe. A „Keresés ezen a térképterületen” csak a térkép látható részén lévő útvonalakat mutatja.',
  'help.ctx.trip-tour-map.title': 'Túratérkép',
  'help.guide.tour-map-layers.goal':
    'Tervezz a túra jellegéhez leginkább illő térképen: szintvonalakkal az emelkedőkhöz, jelzett turistautakkal vagy kerékpárutakkal, vagy légifotóval.',
  'help.guide.tour-along-search.title': 'Helyek keresése a túra mentén',
  'help.guide.tour-along-search.tip.1':
    'Ha módosítod az útvonalat, a keresett típusokat vagy a távolságot, a „Keresés újra” kiemelve jelenik meg, és jelzi, hogy a lista még az útvonal korábbi állapotára vonatkozik. Kattints rá a lista frissítéséhez.',
  'help.guide.tour-along-add-stop.step.4':
    'Az útvonal a helyet érintve újratervezésre kerül, és „A túra mentén” jelzi, mennyivel nőtt a túra távolsága és ideje. Ugyanebben a sorban a „Visszavonás” újra eltávolítja a megállót.',
  'help.guide.tour-3d-terrain.step.2':
    'Az útvonal a meredekség szerint színezett. Az alsó sorban a „Meredekség” gombra kattintva helyette a túra színével jelenik meg, újabb kattintással pedig ismét a meredekségi színekkel.',
  'help.guide.tour-3d-flyover.title': 'Átrepülés a túra mentén',
  'help.guide.tour-3d-flyover.tip.2':
    'Az átrepülés csak akkor indul el, ha a teljes útvonal menti táj betöltődött, így nem áll meg félúton térképadatokra várva. Ha a gyűrű fölé viszed az egeret, látod, mennyi töltődött be.',
  'help.guide.tour-map-overlays.result':
    'A sípályák vagy a hajózási jelek a térkép fölött jelennek meg, a jelmagyarázat pedig elmagyarázza őket.',
  'help.ctx.trip-tour-stages.bullet.3':
    'A „Túra összefoglalója” a „Szakaszok” alatt minden szakaszt felsorol, a kezdő megállótól a záró megállóig. Egy szakaszra kattintva kijelölöd az utolsó megállóját, és a magassági profilon is megjelöli a helyet.',
  'help.guide.tour-multi-day.step.4':
    'Az „Útpontok” most két részre oszlik, „1. szakasz” és „2. szakasz”, mindegyik a saját távolságával és idejével. A szakaszt lezáró megállón hold ikon látszik.',
  'help.guide.tour-stages-on-days.title': 'Többnapos túra elosztása az utazás napjain',
  'help.guide.tour-stages-on-days.tip.1':
    'Ha az utazás az utolsó szakasz előtt véget ér, a lehetőség jelzi, melyik az utolsó még beférő szakasz. Az utána következők nem kapnak napot.',
  'help.ctx.trip-tour-hike.bullet.2':
    'Az „Útpontok” sorrendben sorolja fel a megállókat. A „Pont hozzáadása” kezdettől be van kapcsolva, így a térképre kattintva a következő pontot helyezed el; a mellette lévő „Út helyei” az utazás egy menedékházát vagy szállodáját teszi megállóvá.',
  'help.guide.tour-hike-plan.step.2':
    'Nyisd meg a „Túratípus” listát, és válaszd a „Gyalogtúra” lehetőséget: gyalog, az általad megadott nehézségi határon belül.',
  'help.guide.tour-hike-plan.tip.3':
    'A nehézség alatti „Útvonalválasztás” az útvonalra vonatkozó preferenciákat állítja: „Meredek emelkedők kerülése”, „Lépcsők kerülése” és „Kompok kerülése”. Ahol nincs más lehetőség, az útvonal mégis ott halad.',
  'help.guide.tour-hike-trail-details.step.5':
    'A „Burkolat” gombra kattintva ugyanezt az útvonalat aszerint nézheted meg, min jársz: az aszfalttól a földútig és a szikláig.',
  'help.guide.tour-hike-round.step.2':
    'A térkép fölött megnyílik a „Körtúra” kártya. Ellenőrizd a kiindulópontot a „Kitől” alatt, és írd be a kívánt távolságot („Távolság”). A mellette lévő jelvény mutatja, milyen hosszúságú lehet egy körtúra.',
  'help.guide.tour-hike-compare-ways.title': 'Más útvonalak összehasonlítása a gyalogtúra egy szakaszára',
  'help.guide.tour-hike-compare-ways.tip.2':
    'Ha az útvonaltervező nem ismer másik utat, a kártya jelzi ezt. Ha az útvonaltervező nem tudja követni a választott utat, a szakasz változatlan marad, és a kártya erről is tájékoztat.',
  'help.guide.tour-ferrata-add.step.5':
    'A jobb oldali „Túra összefoglalója” a „Vasalt út” jelvényt mutatja a nehézségi fokkal, a szerkesztő tetején pedig ez a figyelmeztetés jelenik meg: „Az útvonal vasalt úton halad”.',
  'help.guide.tour-run-plan.step.1':
    'Kattints az „Új túra tervezése” gombra, nyisd meg a „Túratípus” listát, és válaszd a „Futás” lehetőséget.',
  'help.guide.tour-run-plan.tip.3': 'Ha a távolságokat mérföldben adod meg, a tempó is mérföldre vonatkozik.',
  'help.guide.tour-run-ways.tip.1': 'Itt semmi sem változtat a futás útvonalán vagy idején.',
  'help.ctx.trip-tour-walk.bullet.5':
    '„Az utazás túrái” részben a „Túra hozzáadása” egy Google Mapsből megosztott gyalogos útvonalat importál. A „Terv” fülön a napjáról megnyitott sétánál az adott napra kipipálhatod a megállókat.',
  'help.guide.tour-walk-plan.step.6':
    'A jobb oldali „Túra összefoglalója” mutatja a „Becs. idő”, a „Tartózkodások” és a „Tervezett” értéket, ez utóbbi a kettő összege. A séta mentéséhez kattints a bal oldali oszlop alján a „Mentés” gombra.',
  'help.guide.tour-walk-sights.step.2':
    'A téma kitölti a „Mit keress” mezőt. Nyisd meg, ha egyes típusokat be- vagy ki szeretnél kapcsolni, és az „Ezen a távolságon belül az útvonaltól” alatt add meg, milyen messze keressen.',
  'help.guide.tour-walk-day-times.title': 'Az érkezési idők és a nyitvatartás megtekintése a napra',
  'help.guide.tour-walk-day-times.tip.3':
    'A nyitvatartás az OpenStreetMapből vagy abból az utazási helyből származik, amelyhez a megálló tartozik, és a mellette lévő jelvény mutatja, honnan. Indulás előtt ellenőrizd.',
  'help.guide.tour-walk-google-import.step.4':
    'Kattints a „Betöltés sétaként” gombra. A TREK maga tervezi meg a gyalogos útvonalat a megállók között. A séta mentéséhez kattints a „Mentés” gombra.',
  'help.guide.tour-walk-check-off.step.2':
    'Görgess „A séta megállói” részhez. Minden megállónál látod, mennyi ideig maradsz, és ha a sétának van kezdési ideje, azt is, mikor érkezel.',
  'help.ctx.trip-tour-bike.summary':
    'A „Túrák” fül szerkesztőjében megnyitott kerékpártúra: a profil, amelyre az útvonal készült, a kerékpározási idő, a burkolatok, amelyeken az útvonal halad, és MTB-túránál az ösvények nehézségi besorolása.',
  'help.guide.tour-bike-profile.step.2': 'Nyisd meg a „Túratípus” mezőt, és válaszd a „Kerékpártúra” lehetőséget.',
  'help.guide.tour-bike-profile.tip.3':
    'Ha egy pont közelében nincs kerékpárral járható út, a sávon ez az üzenet jelenik meg: nincs kerékpárral járható út az N. ponthoz. Helyezd át a pontot, vagy nyisd meg az előtte lévő pont „További műveletek” menüjét, és válaszd „A következő szakasz kézi rajzolása” lehetőséget.',
  'help.guide.tour-bike-surfaces.step.4':
    'Az „Úttípus” alatt kattints egy sorra, például a „Mező- vagy erdei út” vagy a „Forgalmas út” sorra, és látod, hol halad rajta az útvonal.',
  'help.guide.tour-bike-mtb-grades.step.1':
    'Nyisd meg a kerékpártúrát a szerkesztőben, és ellenőrizd, hogy a profil MTB-re van-e állítva. Az ösvények nehézségi fokát a TREK csak ennél a profilnál olvassa be.',
  'help.ctx.trip-tour-ski.title': 'Sí- és téli túrák',
  'help.guide.tour-ski-plan.goal':
    'Tervezz egy napot a pályákon, egy sífutókört, egy sítúrát vagy egy hótalpas sétát a feltérképezett pályák, felvonók és utak mentén.',
  'help.guide.tour-ski-plan.tip.2':
    'A „Szakág” melletti információs pont elmagyarázza, mit csinál a TREK a sítúrákkal. Sem ott, sem máshol itt nincs információ a hóról, a lavinákról, vagy arról, hogy a pályák, a felvonók és az utak nyitva vannak-e.',
  'help.guide.tour-ski-options.step.3':
    'Az „Előnyben” alatt válaszd a „Leggyorsabb”, a „Legtöbb síelés” vagy a „Legkönnyebb” lehetőséget. A „Tempó” alatt válaszd a „Laza”, a „Normál” vagy a „Sportos” lehetőséget: ez azt befolyásolja, mennyi időt számol az útvonaltervező az egyes pályákra.',
  'help.guide.tour-ski-fix-leg.goal':
    'Tervezz meg egy piros szakaszt egyetlen kattintással, vagy rajzold egyenes vonalként.',
  'help.guide.tour-ski-fix-leg.result':
    'Egyik szakasz sem piros már: mindegyik a pályákat követi, vagy egyenesen halad a pontjai között.',
  'help.guide.tour-ski-summary.tip.3':
    'A mentett túra a mentéskori állapotában nyílik meg. Ha a jelenlegi pályaadatok alapján újra szeretnéd tervezni, helyezz át egy pontot, vagy módosíts egy beállítást.',
  'help.guide.tour-ski-pistes-layer.tip.1':
    'Ha a kapcsoló szürke marad, és a „Nagyíts rá a pályák megjelenítéséhez” felirat látszik, nagyíts rá a síterepre.',
  'help.guide.tour-ski-import.step.3':
    'Válaszd ki a „Szakág” értékét, „Sífutás” esetén a „Technika” értékét is. Amíg ezt nem teszed meg, az ablak jelzi, hogy a nyomvonal síelésként való importálásához szakágat kell választanod.',
  'help.ctx.trip-tour-paddle.title': 'Evezős túrák',
  'help.guide.tour-paddle-setup.title': 'Evezős túra tervezése',
  'help.guide.tour-paddle-setup.step.7':
    'Ellenőrizd, hogy a „Pont hozzáadása” be van-e kapcsolva, majd kattints a térképre: először a vízre szállás helyére, aztán az útközbeni pontokra, végül a kiszállás helyére.',
  'help.guide.tour-paddle-water-route.step.1':
    'A kézzel rajzolt szakasz pontja alatt a „Kézzel rajzolva, nem tervezett” felirat és a szakasz hossza látszik. A TREK a vonalat pontosan úgy tartja meg, ahogy megrajzoltad.',
  'help.guide.tour-paddle-water-route.tip.4':
    'Amíg van meg nem tervezett szakasz, nem tudsz menteni. Előbb tervezd meg a vízen, vagy rajzold meg kézzel.',
  'help.guide.tour-paddle-portage.step.5':
    'A „Ki- és beszállás” mezőben add meg, hány percre van szükséged a kiszálláshoz, a kipakoláshoz és a visszaszálláshoz. Ha üresen hagyod, a TREK 10 perccel számol.',
  'help.guide.tour-paddle-lock.step.2':
    'Válaszd a „Zsilip ezen a ponton” lehetőséget. A pont alatt megjelenik egy „Zsilip” kártya „Hiányzó idő” jelöléssel.',
  'help.guide.tour-paddle-time.goal':
    'Nézd meg, hogyan adódik össze a vízen töltött idő, a cipelés, a zsilipek és a szünetek, és add meg a saját értékeidet.',
  'help.guide.tour-paddle-time.tip.3':
    'A szüneteket és a saját tervezett teljes időt a „Részletek” alatt adhatod meg. Ha van tervezett teljes idő, a kártya a becslés mellett a „Saját tervezett összidő” értéket is mutatja.',
  'help.guide.tour-paddle-wind.tip.1':
    'Előrejelzés csak a következő 16 napra érhető el. Egy későbbi napnál a TREK jelzi, melyik dátumtól lesz elérhető az előrejelzés, egy elmúlt napnál pedig azt, hogy a nap már elmúlt.',
  'help.guide.tour-paddle-checklist.step.2':
    'Az alatta lévő sorból kiderül, mennyire frissek az adatok: „OSM-állapot” az OpenStreetMaphez, „Lekérve” arra, hogy a TREK mikor olvasta be őket, és „Akadályadatok”, ha nem fedik le a teljes útvonalat.',
  'help.guide.tour-paddle-checklist.tip.5':
    'Az ellenőrzőlista nem biztonsági vagy jogi engedély. A döntésed nem írja felül az OpenStreetMapben rögzített tilalmakat vagy magánterületeket.',
  'help.guide.tour-paddle-track-marks.step.5':
    'Kattints az „Átemelés” gombra, majd a vonalon arra a pontra, ahol kiszálltál, és arra, ahol visszaszálltál.',
  'help.ctx.trip-tour-horse.summary':
    'A lovastúránál nincs útvonaltervezés. Az OpenStreetMap által ismert, kijelölt lovasútvonalak szakaszaiból áll össze, kézzel rajzolt szakaszokkal összekötve, vagy pontosan úgy marad, ahogy rögzítetted.',
  'help.guide.tour-horse-plan.step.1':
    'Mozgasd a térképet arra a területre, ahol lovagolni szeretnél, majd kattints a bal oldali oszlop tetején az „Új túra tervezése” gombra.',
  'help.guide.tour-horse-plan.tip.1':
    'Egy lovasútvonal nem jelent engedélyt a lovaglásra. A „Lovas hozzáférés” csak azt mutatja, mit jelöl az OpenStreetMap. Mindig a helyszíni táblákat kövesd.',
  'help.guide.tour-horse-gap.step.2':
    'Kapcsold be az „Összekötés kézi szakasszal” beállítást. A hézagot egyenes, ellenőrizetlen vonal köti össze.',
  'help.guide.tour-horse-recorded.goal':
    'Importálj egy GPS-eszközön vagy alkalmazásban rögzített lovastúrát, és tartsd meg pontosan úgy, ahogy lovagoltál.',
  'help.guide.tour-horse-recorded.tip.3':
    'A fájlt a „Túrák” fül bármely részére is ráhúzhatod, és ugyanez az előnézet nyílik meg.',
  'help.guide.create-trip.tip.3':
    'Az „Útitársak” alatt olyan embereket adhatsz hozzá, akiknek már van fiókjuk ezen a TREK-en. Amint az utazás létrejön, a tagjai lesznek.',
  'help.guide.trip-reminder.step.1':
    'Kattints az utazás kártyáján lévő ceruzára. Új utazásnál az „Új utazás” űrlapon ugyanez a rész található.',
  'help.guide.company-holidays.tip.2':
    'Az egész napos céges szabadnap törli az aznapra már rögzített szabadságot, így senkinek nem fogy rá a szabadságkerete.',
  'help.guide.half-company-holiday.tip.2':
    'Ugyanezekkel a beállításokkal újra a napra kattintva törölheted, kikapcsolt „Fél nap” mellett pedig egész napos céges szabadnappá teheted.',
  'help.guide.edit-holiday-calendar.step.1':
    'Nyisd meg a Beállításokat, és keresd meg a naptárat az „Ünnepnapok” vagy az „Iskolai szünetek” alatt.',
  'help.guide.person-color.goal':
    'Adj magadnak vagy annak, akivel közösen tervezel, könnyebben megkülönböztethető színt.',
  'help.guide.answer-fusion-request.tip.2':
    'Később bármelyikőtök feloldhatja az összevonást, a bejegyzéseitek megmaradnak.',
  'help.guide.log-for-partner.tip.2': 'Ő azonnal látja a változást, és a „Szabadságkeret” sora is rögtön frissül.',
  'help.guide.country-places.title': 'Egy ország összes helyének megtekintése',
  'help.guide.tour-activity-stats.step.1':
    'A térkép alján lévő panelen nyisd meg a „Statisztikák” és a „Bakancslista” melletti „Túrák” fület.',
  'help.guide.tour-activity-stats.tip.2':
    'Ha a túra részleteinél a „Tényleges nyomvonal hozzáadása” gombbal csatolod a ténylegesen bejárt nyomvonalat, itt a rögzített értékei lépnek a tervezettek helyére. A több napra tervezett túra egyszer számít.',
  'help.ctx.collections.bullet.7':
    'Mentett túrák: az utazásokból mentett túrák a lista első sorai, a nehézségi fokukkal, a típusukkal, a származási utazással és az adataikkal. A „Hozzáadás egy úthoz” új túrát készít belőlük, a kuka ikon pedig eltávolítja őket a listáról.',
  'help.guide.move-to-list.title': 'Helyek áthelyezése vagy duplikálása másik listába',
  'help.guide.copy-to-trip.tip.2': 'Az utazásban már szereplő helyeket a TREK kihagyja, és jelzi, hányat hagyott ki.',
  'help.guide.accept-list-invite.tip.2':
    'A lista tetején a „Megosztott” gombra kattintva látod a tagokat. Ott a „Lista elhagyása” gombbal ki is léphetsz a listából.',
  'help.guide.tour-collection-add-to-trip.goal':
    'Készíts új túrát az egyik utazásodban egy listába mentett túrából, az útpontjaival vagy azok nélkül.',
  'help.guide.tour-collection-add-to-trip.result':
    'Az ablak megerősíti, hogy a túra már az adott utazáshoz tartozik. Az „Út megnyitása” odavisz, a „Lezárás” után a Gyűjteményekben maradsz.',
  'help.guide.tour-collection-manage.tip.3':
    'A mentett túrák csak a saját listájukban jelennek meg, az „Összes mentett” nézetben nem.',
  'help.guide.search-journey.step.3':
    'Egy napra kattintva odagörgetsz, a nyilára kattintva pedig felsorolhatod az aznapi bejegyzéseket, és választhatsz közülük.',
  'help.guide.journey-map-layers.goal':
    'Lásd a különbséget a terv és a valóság között, és kapcsold be vagy ki a rétegeket.',
  'help.guide.journey-keep-route.goal':
    'Tedd fel egy nap valódi útvonalát a Dawarichból az útinapló térképére, és tartsd is meg ott.',
  'help.guide.journey-day-stays.goal': 'Alakítsd egyenként bejegyzéssé a Dawarich által rögzített tartózkodásokat.',
  'help.guide.journey-take-over-day.goal':
    'Egyetlen lépésben alakítsd egy nap tartózkodásait vázlatbejegyzésekké vagy egyetlen napi beszámolóvá.',
  'help.guide.journey-auto-prepare.title': 'A rögzített napok automatikus előkészítése',
  'help.guide.photo-location.title': 'Bejegyzések elhelyezése a fotók készítési helyén',
  'help.ctx.settings-about.summary':
    'Mi a TREK, melyik verzió fut ezen a szerveren, és hol találod a projektet: a dokumentációt, a hibabejelentés helyét és a támogatás lehetőségeit.',
  'help.guide.startup.tip.2':
    'Ha a kezdő fül egy általad kikapcsolt bővítményhez tartozik, helyette a terv nyílik meg.',
  'help.guide.web-push-device.title': 'Push értesítések ezen az eszközön',
  'help.guide.connect-airtrail.tip.1':
    'A kártya csak akkor jelenik meg, ha a rendszergazda bekapcsolta az AirTrail bővítményt.',
  'help.guide.connect-dawarich.tip.1':
    'A TREK csak javasol bejegyzéseket, helyeket és országokat; semmi sem kerül be, amíg meg nem erősíted, és a Dawarichba semmit sem ír vissza.',
  'help.guide.tour-connect-wanderer.tip.1':
    'A kártya csak akkor jelenik meg, ha a rendszergazda a Túrák beállításainál engedélyezi a wanderert.',
  'help.guide.tour-wanderer-watch.tip.1':
    'Egy jelzés soha nem módosítja a túrát; hogy mi változott valójában, azt a túra forrásellenőrzése mutatja meg.',
  'help.guide.api-keys.tip.3':
    'A kulcsot Authorization: Bearer vagy X-API-Key fejlécben küldd a /api/v1 címre. Egy fiókhoz legfeljebb 10 kulcs tartozhat.',
  'help.guide.plugin-settings.step.2':
    'A „Bővítmény-tevékenység” felsorolja a pluginek által a nevedben végzett összes műveletet, a legújabbal kezdve; a „Frissítés” betölti a legfrissebbeket.',
  'help.ctx.admin-github.bullet.3':
    '„Névjegy”: Ko-fi, Buy Me a Coffee, Discord, „Hiba bejelentése”, „Funkció javaslat” és a Wiki.',
  'help.guide.default-user-settings.goal':
    'Minden fiók kapjon ésszerű mértékegységeket, színmódot és pénznemet anélkül, hogy bárkinek meg kellene nyitnia a Beállításokat.',
  'help.guide.default-map.step.3':
    'Minden mező akkor mentődik, amikor elhagyod. A mező neve melletti „visszaállítás” link visszaállítja a TREK alapértelmezett értékét.',
  'help.guide.own-routing-engine.tip.2':
    'Ha csak a saját útvonaltervező van beállítva, a nyilvános Valhallát sem használja a TREK. A mező melletti „visszaállítás” link újra kiüríti.',
  'help.guide.admin-passkeys.step.1':
    'A „Beállítások” fülön, a „Passkey-bejelentkezés” részben kapcsold be a „Passkey-bejelentkezés engedélyezése” beállítást.',
  'help.guide.storage-backends.step.4':
    'A felül lévő „Egészség” felsorolja a tükörcélra sikertelenül írt adatokat. Ha a „Nincs rögzített replikahiba.” üzenet látszik, minden rendben van.',
  'help.guide.channels-instance.tip.3':
    'A Web Pushhoz HTTPS kell. iPhone-on és iPaden a felhasználóknak előbb hozzá kell adniuk a TREK-et a Főképernyőhöz.',
  'help.guide.notification-defaults.step.1':
    'Az „Értesítések” fülön görgess le az „Alapértelmezések a felhasználóknak” részhez. Minden sor egy esemény, minden oszlop egy csatorna.',
  'help.ctx.notifications.bullet.1':
    'A jobb felső sarokban lévő csengő a még olvasatlan értesítések számát mutatja. Rákattintva a legújabb tízet látod, az alján lévő „Összes értesítés megtekintése” pedig erre az oldalra visz.',
  'help.guide.read-notifications.step.2':
    'A panel a legújabb tíz értesítést sorolja fel. Mindegyikből kiderül, ki mit és hol csinált, az olvasatlanok háttere pedig színezett.',
  'help.guide.filter-notifications.step.2': 'A panel alján kattints az „Összes értesítés megtekintése” gombra.',
  'help.guide.mark-notifications-read.tip.1': 'Ha egy értesítést a gombjával nyitsz meg, az is olvasottnak jelöli.',
  'help.guide.delete-notifications.tip.2':
    'A törölt értesítés nem állítható vissza. Ha el szeretnél rejteni egy értesítést, de meg is tartanád, jelöld olvasottnak, és használd az „Olvasatlan” szűrőt.',
  'help.guide.notification-settings.tip.2':
    'Nincsenek utazásonkénti beállítások: egy kapcsoló az összes utazásodra vonatkozik.',
  'help.guide.link-journal.title': 'Napló összekapcsolása az utazással',
  'help.guide.link-journal.tip.2':
    'Ettől kezdve azok, akiknek hozzáférést adsz, a saját „Útinaplók” listájukban is látják a naplót.',
  'help.ctx.trip-places.bullet.8':
    'Ha a Dawarich csatlakoztatva van, a lista tetején „A Dawarichból” rész a Dawarich által az utazás alatt rögzített tartózkodásokat mutatja. A „Hozzáadás helyszínként” hellyé alakít egy tartózkodást, az „Itt nem jártam” eltávolítja a listáról.',
  'help.guide.dawarich-stays.step.4':
    'Ha egy tartózkodás nem valódi látogatás volt, a mellette lévő x-szel („Itt nem jártam”) eltávolíthatod. A lista alján a „Már elintézett megjelenítése …” mutatja azokat a tartózkodásokat, amelyeket hozzáadtál vagy eltávolítottál. A „Visszatétel” visszahelyezi a listára az eltávolított tartózkodást.',
  'help.guide.leave-stop-off-route.tip.1':
    'Ez a lehetőség csak koordinátákkal rendelkező megállóknál érhető el, és csak erre a napra vonatkozik: ugyanaz a hely egy másik napon továbbra is az útvonal része.',
  'help.guide.move-booking-day.title': 'Foglalás áthelyezése másik napra',
  'help.guide.place-image-from-file.step.4':
    'A fotó most már a hely képe. A sarkában lévő kis piros X-szel ismét eltávolíthatod.',
  'help.guide.place-own-hours.step.2':
    'A „Weboldal” alatt töltsd ki a „Telefon” és az „E-mail” mezőt, ha ismered őket.',
  'help.guide.add-accommodation.tip.4':
    'Gyorsabb módszer: a nap fejlécében lévő + gomb („Hozzáadás a naphoz”) menüjében ott a „Szállás hozzáadása”. Ez úgy nyitja meg a napot, hogy ez az űrlap már nyitva van.',
  'help.guide.confirm-stay-booking.goal':
    'Jelöld megerősítettnek a szállás mögötti szállodafoglalást, közvetlenül a napról.',
  'help.guide.map-whole-trip.tip.4':
    'Hogy a teljes utazás látszik-e, azt a fiókod utazásonként tárolja, így egy másik böngészőben is ugyanígy nyílik meg az utazás.',
  'help.guide.tour-map-lines.step.3':
    'Ha a napok oszlopában megnyitsz egy napot, amelyen a túra szerepel, a túra a nap útvonalának része lesz: az útvonal a túra kezdőpontjáig vezet, és a végpontjától folytatódik.',
  'help.guide.car-stops.goal':
    'Add meg egy bérautó vagy a saját autód átvételi és leadási helyét, valamint a közbeeső megállókat.',
  'help.guide.car-stops.tip.1': 'Nincs külön bérautó típus: a bérelt és a saját autó is „Autó”.',
  'help.guide.transport-details.result':
    'A „Terv” fül az út napján van megnyitva, a vonala megjelenik a térképen, és a sorában lévő útvonal ikon be van kapcsolva.',
  'help.guide.export-transports-csv.step.2':
    'Kattints a „Nézet beállításai” utáni táblázat ikonra („Exportálás táblázatként (CSV)”).',
  'help.guide.group-sort-bookings.title': 'Foglalások csoportosítása és rendezése',
  'help.guide.group-sort-bookings.tip.2':
    'Az „Idővonal” nézetben ugyanez a gomb a „Típusonként külön sáv” és „A másik fül megjelenítése” lehetőséget tartalmazza.',
  'help.guide.booking-on-map.result':
    'A részletek bezárulnak, és a „Terv” fül a foglalás napján nyílik meg, a térképen kijelölt helyével.',
  'help.guide.export-bookings-csv.step.1':
    'Ha a fülnek csak egy részét exportálnád, előbb szűkítsd a „Keresés” vagy a „Szűrő” segítségével. A fájl pontosan azt tartalmazza, amit a fül mutat.',
  'help.guide.import-booking-file.tip.4':
    'A visszaigazolás feldolgozásához internetkapcsolat kell. Offline állapotban az importálás jelzi ezt, és amikor a TREK újra online, próbáld újra.',
  'help.guide.arrange-packing-list.step.1':
    'Fogd meg a lista fejlécének bal szélén, a színpont előtt lévő fogantyút, és ejtsd a listát egy másik kártyára. A célkártyát a kiemelőszíneddel rajzolt keret jelöli, és a lista az utazás minden résztvevőjénél átveszi annak a kártyának a helyét.',
  'help.guide.count-packed-pieces.title': 'Egy dolog több darabjának becsomagolása',
  'help.guide.count-packed-pieces.tip.2':
    'Ha a „Poggyászkövetés” be van kapcsolva, a „Táskák” kártyán a „Becsomagolva” csak a már beszámolt darabokat számolja.',
  'help.guide.packing-bags.tip.4':
    'A több ember által vitt táska súlya a „Személyenként” alatt egyenlően oszlik meg közöttük. Ez a súly pontozott aláhúzással jelenik meg, és ha fölé viszed az egeret, egy megjegyzés is jelzi ezt.',
  'help.guide.expense-receipts.step.1':
    'Kattints a kiadás sora melletti ceruzára. Megnyílik a szerkesztő, alul a „Nyugták és számlák” résszel.',
  'help.guide.expense-receipts.tip.3':
    'A csatoláshoz internetkapcsolat és fájlfeltöltési jogosultság kell, mert a nyugtát a TREK az utazás egyik fájljaként tárolja.',
  'help.guide.files-sync-settings.title': 'A dokumentumok szinkronizálási irányának kiválasztása',
  'help.guide.files-sync-settings.tip.1':
    'Az egyik sáv mindig bekapcsolva marad: ha az egyetlen még bekapcsolt sávra kattintasz, nem történik semmi.',
  'help.guide.manage-notes.title': 'Jegyzet olvasása, kitűzése és szerkesztése',
  'help.guide.manage-notes.tip.1':
    'A „Kibontás” csak akkor szerepel a menüben, ha a jegyzetnek van szövege. Aki nem szerkesztheti az „Együttműködés” fület, csak a „Kibontás” lehetőséget látja.',
  'help.guide.note-categories.step.5':
    'Kattints a „Mentés” gombra. Az átnevezett vagy átszínezett kategória összes jegyzete egyszerre változik meg, minden tagnál. A „Mégse” elveti a módosításaidat.',
  'help.guide.trip-chat.tip.5':
    'A csevegés elsőként a legújabb üzeneteket mutatja. A tetején lévő „Korábbi üzenetek betöltése” betölti a régebbieket.',
  'help.guide.roadtrip-reorder.result':
    'A megállók a beállított sorrendben vannak, és minden módosított napnál újraszámolódik a távolság, a vezetési idő és az érkezési idők.',
  'help.guide.roadtrip-overnight.goal':
    'Keress szálláshelyet útközben, és vedd fel az éjszakát foglalásként az autós útra.',
  'help.guide.roadtrip-overnight.tip.2':
    'Ha egy lefoglalt éjszakát a kártyáján a „Szerkesztés” alatt visszaváltasz „Szünet” típusra, előbb megjelenik a kérdés: „Elveted az éjszakázást?” A „Legyen szünet” eltávolítja az éjszakát a foglalásával és a hozzá kapcsolódó kiadással együtt, a megálló viszont az útvonalon marad.',
  'help.guide.roadtrip-stop-fill.tip.2':
    'Ha azt az értéket választod, amely a megállónál már be van állítva, a megálló visszaáll az alapértelmezett értékedre.',
  'help.guide.roadtrip-bookings.tip.1':
    'A terminálhoz érkezés ideje a bejelentkezés miatt korábbra kerül a menetrendinél: repülésnél és hajóútnál egy órával, kompnál fél órával, vonatnál és busznál tíz perccel.',
  'help.guide.roadtrip-google-import.step.2':
    'Illeszd be egy Google Mapsből megosztott útvonal linkjét, és kattints az „Előnézet” gombra.',
  'help.guide.roadtrip-hazards.goal':
    'Lásd a térképen az autós utad környékén érvényes időjárási figyelmeztetéseket és katasztrófariasztásokat.',
  'help.ctx.trip-tours.title': 'Túrák a tervben',
  'help.guide.tour-show-list.title': 'Az utazás túráinak megjelenítése a tervben',
  'help.guide.tour-show-list.tip.2':
    'Még nincsenek túrák? A lista tetején a „GPX vagy KML importálása” gombbal fájlt importálhatsz, a „Túrák” fülön az „Új túra tervezése” gombbal pedig újat hozhatsz létre.',
  'help.guide.tour-add-to-day.step.4':
    'Vagy húzd ki a sort a listából, és ejtsd a bal oldali oszlop egyik napjára. Ha két megálló közé ejted, oda kerül.',
  'help.guide.tour-day-times.goal': 'Nézd meg, mikor ér véget a túra, és ütközik-e a nap következő programjával.',
  'help.guide.tour-day-times.tip.4':
    'Ugyanebben a menüben a „Mentés gyűjteménybe” az útvonalával együtt gyűjteménybe menti a túrát, ugyanúgy, mint a kártya „Gyűjtemény” gombja.',
  'help.guide.tour-remove-from-day.tip.2':
    'Ezekben a menükben és a kártyán nincs „Törlés”. Túrát a „Túrák” fülön, „Az utazás túrái” alatt a sorában lévő kukával törölhetsz.',
  'help.guide.tour-filter-list.tip.1':
    'Az „Útvonalkorlát” a tervezéskor megengedett legnagyobb nehézség, nem az ösvényen mért nehézség.',
  'help.guide.tour-hide-on-map.step.3':
    'Amíg van elrejtett túra, a lista fölött az „Elrejtve a térképen” felirat látszik a darabszámmal. Az „Összes megjelenítése” egyszerre visszahozza az összes túrát.',
  'help.guide.tour-import-plan-tab.step.3':
    'Az „Importálás előnézete” mentés előtt megmutatja az összes nyomvonalat. Az „Importálás mint” alatt válaszd ki a típust („Gyalogtúra”, „Kerékpártúra” és így tovább), majd kattints az „1 túra importálása” gombra.',
  'help.ctx.trip-tour-detail.bullet.3':
    'Alatta az „Utazási napok” következik, minden olyan naphoz egy csempével, amelyen a túra szerepel, majd az adatok a magassági profillal, végül, ha vonatkoznak a túrára: a városi séta megállói, az evezős túra ellenőrzései és a szél, a „Tényleges nyomvonal”, a „Csomagolási lista”, a „Leírás”, a „Jegyzetek”, az „Eredet” és a „Fájl”.',
  'help.guide.tour-detail-read.step.4':
    'Az „Utazási napok” minden olyan naphoz mutat egy csempét a dátummal, amelyen a túra szerepel. Ha „Az utazás egyetlen napján sem” felirat látszik, a túra még nincs megtervezve.',
  'help.guide.tour-detail-read.tip.5':
    'Telefonon a kártya alulról felcsúszó lapként nyílik meg, olvasásra és arra, hogy a túrát magaddal vidd.',
  'help.guide.tour-rename-colour.tip.1':
    'A név és a szín az utazáshoz tartozik, így az utazás minden résztvevője látja. Ha csak a saját térképeden rejtenél el egy túrát, anélkül hogy másoknál változna, használd a „Túrák” listában a szem ikont.',
  'help.guide.tour-take-along.tip.1':
    'Fájlmegosztásra képes eszközön a GPX mellett megjelenik a „Megosztás” gomb, amellyel ugyanezt a fájlt közvetlenül egy másik alkalmazásnak küldheted.',
  'help.guide.tour-copy-keep.step.2':
    'A másolat azonnal megnyílik az eredeti nevével, utána a (másolat) jelöléssel. A ceruzára kattintva saját nevet adhatsz neki.',
  'help.guide.tour-packing-link.title': 'Túra kapcsolása a csomagolási listához',
  'help.guide.tour-packing-link.tip.2':
    'A rész fejlécében lévő „Csere” egy másik listához kapcsolja a túrát. Ebben az ablakban a „Kapcsolat eltávolítása” megszünteti a kapcsolatot, a lista pedig változatlan marad.',
  'help.guide.tour-files.tip.1': 'A fájlok egyben az utazás fájljai is, így a „Fájl” fülön is megjelennek.',
  'help.guide.tour-activity-link.step.4':
    'A „Tényleges” alatt ellenőrizd a mért adatokat, majd kattints a „Csatolás” gombra.',
  'help.guide.tour-activity-compare.step.1':
    'Nyisd meg a túra kártyáját. A „Terv és tényleges” rész a terv „Távolság”, „Szintemelkedés”, „Szintcsökkenés” és „Idő szünetekkel” értékét a nyomvonaléi mellett mutatja, az „Eltérés” kiszámításával.',
  'help.guide.tour-origin-check.goal':
    'Tudd meg, hogy a túrát a TREK-ben rajzolták vagy importálták, melyik fájlból, és hogy azóta módosult-e.',
  'help.ctx.trip-tour-planner.title': 'Túrák',
  'help.guide.tour-open-workspace.title': 'Eligazodás a „Túrák” fülön',
  'help.guide.tour-open-workspace.step.7':
    'Kattints egy túrára a jobb oldali sávban. A TREK-ben tervezett túra a szerkesztőben nyílik meg, az importált nyomvonal pedig változatlanul, GPX-túraként, megtekintésre.',
  'help.guide.tour-draw-route.step.2':
    'Írd be a „Hely vagy cím keresése” mezőbe, honnan indul a túra, és válaszd ki a találatot. A térkép odaugrik.',
  'help.guide.tour-draw-route.tip.4':
    'A nem mentett vázlat megmarad. Ha újra megnyitod az utazás „Túrák” fülét, a TREK visszaállítja, „Nem mentett vázlat visszaállítva” jelöléssel.',
  'help.guide.tour-type-profile.tip.1':
    'A típus módosítása egy lépésnek számít az előzményekben: a sáv tetején lévő „Pontmódosítás visszavonása” visszaállítja a régi típust és az útvonalát.',
  'help.guide.tour-edit-points.step.4':
    'Vagy nyisd meg a sorban a „További műveletek” menüt (a három pont), és válaszd az „Útvonalpont feljebb” vagy az „Útvonalpont lejjebb” lehetőséget.',
  'help.guide.tour-shaping-points.step.1':
    'Kattints a térképen a megrajzolt útvonalra ott, ahol másképp kellene haladnia. Ott megjelenik egy kis pont: ez az alakítópont.',
  'help.guide.tour-loop-reverse.title': 'Körtúra készítése vagy a túra irányának megfordítása',
  'help.guide.tour-loop-reverse.result':
    'Egy kör, amely ott ér véget, ahol elkezdődött, vagy ugyanaz a túra ellenkező irányban.',
  'help.guide.tour-leg-by-hand.tip.2':
    'Ha egy pontot egyetlen út sem ér el, értesítés jelenik meg a „Pont megjelenítése” gombbal és a pont számával. Helyezd át a pontot egy útra, vagy rajzold meg hozzá kézzel a szakaszt.',
  'help.guide.tour-trip-places.tip.1':
    'A túrában már szereplő helyen „A túrában” jelölés látszik, és kétszer nem választható ki.',
  'help.guide.tour-details-times.step.3':
    'Add meg a „Szünetek” értékét, például 0:45. Ez hozzáadódik a becsült időhöz.',
  'help.guide.tour-save.step.1': 'Írj nevet a „Túra neve” mezőbe. Név nélkül a „Mentés” gomb szürke marad.',
  'help.guide.tour-edit-saved.title': 'Mentett túra módosítása',
  'help.guide.tour-edit-saved.tip.3':
    'A sáv tetején lévő „GPX letöltése” és „Megőrzés gyűjteményben” a módosítások mentése után működik.',
  'help.guide.tour-summary-profile.tip.1': 'A kártya címére kattintva az egész összefoglalót összecsukhatod.',
  'help.guide.tour-list-manage.step.3': 'Válaszd ki a napot. A túra arra a napra kerül, és a sorában megjelenik a nap.',
  'help.guide.tour-delete.goal': 'Túra végleges eltávolítása az utazásból.',
  'help.guide.tour-saved-elsewhere.goal':
    'Döntsd el, mi történjen, ha valaki más mentette a túrát, miközben te szerkesztetted.',
  'help.ctx.trip-tour-import.title': 'Túrák importálása',
  'help.guide.tour-import-gpx.goal':
    'Egy GPS-óráról, alkalmazásból vagy a Google Earthből származó nyomvonalból készíts túrát az utazáshoz, mentés előtti ellenőrzéssel.',
  'help.guide.tour-import-gpx.tip.3':
    'Az utazásban már szereplő nyomvonal szürkén, „Már az utazásban van” jelöléssel látszik, és a TREK kihagyja.',
  'help.guide.tour-view-import.step.3': 'A bal felső sarokban lévő nyíllal („Vissza a túrákhoz”) bezárhatod.',
  'help.guide.tour-plan-from-import.step.2':
    'A TREK ellenőrzőpontokat vesz a nyomvonalból, és újratervezi köztük az útvonalat. A térkép az importált nyomvonalat pontozott, a javaslatot folytonos vonallal mutatja, a kártya pedig összeveti a hosszukat, a nyomvonaltól 50 m-en belül haladó rész arányát és a „Legnagyobb eltérés” értékét.',
  'help.guide.tour-restore-recorded.title': 'Visszatérés a rögzített nyomvonalhoz',
  'help.guide.tour-take-over.title': 'Túra átvétele másik utazásból',
  'help.guide.tour-take-over.tip.1':
    'A másolat önálló túra. Még egyik naphoz sincs rendelve, és az eredeti későbbi módosításai nem hatnak a másolatra, és fordítva sem. Az „Eredet” részben az az utazás szerepel, amelyből átvették.',
  'help.guide.tour-import-wanderer.step.3':
    'Kattints egy útvonalra. Megjelenik a térképen, az oszlopban pedig látod a GPX-fájlja szerinti adatokat, a leírását, és azt, hogy a wandererben nyilvános vagy privát.',
  'help.ctx.trip-tour-map.summary':
    'A „Túrák” fül közepén lévő térkép a megnyitott túrához: a típusához illő térképek, a rájuk rajzolt sípályák vagy hajózási jelek, az útvonal menti helyek, és ugyanez a túra 3D-ben, a valódi domborzaton.',
  'help.guide.tour-map-layers.step.1':
    'Nyisd meg a „Túrák” fület, és kattints jobb oldalon „Az utazás túrái” alatt egy túrára. A tervezőben nyílik meg, a térkép bal alsó gombja pedig felsorolja az ilyen típusú túrához elérhető térképeket.',
  'help.guide.tour-along-search.goal':
    'Keress kilátókat, vizet, menedékházakat vagy étkezési lehetőséget a tervezett túra útvonalának közelében.',
  'help.guide.tour-along-search.tip.2':
    'Városi sétánál a lista fölötti négy téma kiválasztja helyetted a megfelelő típusokat.',
  'help.guide.tour-along-add-stop.result':
    'A túra most érinti a helyet, az új távolsággal és idővel a „Túra összefoglalója” részben. A módosítás megtartásához mentsd a túrát.',
  'help.guide.tour-3d-terrain.step.3':
    'Kattints a jobb oldali „Meredekség megoszlása” gombra. Kinyílik, és megmutatja, a túra mekkora része halad „5% alatt”, „5 és 10% között”, „10 és 18% között”, „18 és 27% között”, illetve „27% vagy több” meredekségen. Összecsukva a legmagasabb pontot és a legmeredekebb szakaszt mutatja.',
  'help.guide.tour-3d-flyover.goal':
    'Nézd végig a teljes túrát az elejétől a végéig, mielőtt gyalog, kerékpárral vagy síléccel nekivágnál.',
  'help.guide.tour-3d-flyover.tip.3':
    'Amíg a repülés szünetel, a magassági profil mentén mozogva a pont arra a helyre ugrik. Az „Átrepülés lejátszása” onnan folytatja.',
  'help.guide.tour-map-overlays.tip.1':
    'A sípályák térképi adatok, nem élő jelentés: semmit sem mondanak arról, mi van nyitva vagy ápolva, milyen a hó, vagy van-e lavinaveszély. Ha a síterepen kívülre kicsinyítesz, a kapcsolón a „Nagyíts rá a pályák megjelenítéséhez” felirat látszik.',
  'help.ctx.trip-tour-stages.bullet.4':
    '„Az utazás túrái” között a többnapos túránál egy hold látszik a szakaszok számával. Ez a gomb („Szakaszok mutatása”) kinyitja a szakaszok listáját, mindegyiknél a hozzá rendelt nappal, valamint a „Teljes túra” összesítésével.',
  'help.guide.tour-multi-day.step.5':
    'A „Túra összefoglalója” a „Szakaszok” alatt minden szakaszt felsorol. Egy szakaszra kattintva látod, hol ér véget: az utolsó megállója kijelölődik, és a magassági profil is megjelöli a helyet.',
  'help.guide.tour-stages-on-days.goal': 'Tedd minden szakaszt külön napra, vagy a teljes túrát egyetlen napra.',
  'help.guide.tour-stages-on-days.tip.2':
    'A „Teljes túra ezen a napon” szürke azon a napon, amelyen a túra már szerepel. A „Szakaszok ettől a naptól” ott is működik, és azon a napon a teljes túra helyére lép.',
  'help.ctx.trip-tour-hike.bullet.3':
    'Az „Útpontok” kártya fejlécében vannak az útvonaleszközök: „Irány megfordítása”, „Vissza a kiindulópontra”, gyalogtúránál pedig „Körtúra a kezdőponttól”. Egy megálló „További műveletek” menüjében található az „Utak összehasonlítása a következő szakaszhoz”.',
  'help.guide.tour-hike-plan.step.3': 'Írj nevet a „Túra neve” mezőbe.',
  'help.guide.tour-hike-plan.tip.4':
    'A gyaloglási idő a turistaútjelzésekre vonatkozó szabályt (DIN 33466) követi, és nem tartalmazza a szüneteket. Ezeket a „Részletek” alatt, a „Szünetek” mezőben adhatod hozzá, és a tervezett teljes időben jelennek meg.',
  'help.guide.tour-hike-trail-details.result':
    'Tudod, a gyalogtúra egyes részei milyen nehézségűek, milyen a burkolatuk, és hol vannak a térképen.',
  'help.guide.tour-hike-round.step.3':
    'Kattints a „Körök keresése” gombra. A listában és a térképen megjelenik az A kör, a B kör és így tovább, mindegyik a saját színével.',
  'help.guide.tour-hike-compare-ways.goal':
    'Nézd meg, milyen más ösvényeken haladhatna a gyalogtúra két megálló között, és válassz közülük.',
  'help.guide.tour-hike-compare-ways.tip.3': 'A „Mégse” bezárja a kártyát, és nem változtat az útvonalon.',
  'help.guide.tour-ferrata-add.result':
    'A gyalogtúra az OpenStreetMapből származó saját vonalán követi a vasalt utat. A térképre kattintva a tetejétől folytathatod. Az útvonaltervező csak a vasalt útig vezető és az utána következő utat tervezi.',
  'help.guide.tour-run-plan.step.2':
    'Válassz profilt: a „Futás” a többnyire burkolt városi, parki és folyóparti utakhoz, a „Terepfutás” az erdei utakhoz és a természetes ösvényekhez való.',
  'help.guide.tour-run-plan.tip.4': 'A „Terepfutás” legfeljebb hegyi ösvényeket (T2) használ, nehezebbeket soha.',
  'help.guide.tour-run-ways.tip.2':
    'Állítsd a profilt „Terepfutás” értékre, ha az útvonal több természetes ösvényen haladhat, vagy „Futás” értékre, ha szilárd talajon maradna.',
  'help.guide.tour-walk-plan.title': 'Városi séta tervezése megállóról megállóra',
  'help.guide.tour-walk-plan.tip.1':
    'A megálló száma körüli gyűrű a fontosságot jelzi: teli gyűrű a „Kihagyhatatlan”, szaggatott a „Nem kötelező” megállót. Kis pajzs jelöli a „Védett” megállót.',
  'help.guide.tour-walk-sights.step.3':
    'Kattints a „Keresés a túra mentén” gombra. A név előtti csillag a „Kiemelt” jelölés, vagyis a környék egyik legismertebb helye.',
  'help.guide.tour-walk-day-times.goal':
    'Tudd meg, mikor érsz az egyes megállókhoz a séta napján, és melyik hely lesz akkor zárva.',
  'help.guide.tour-walk-day-times.tip.4':
    'Két séta egy napon: a „Terv” fülön kattints a köztük lévő szakaszra („Közlekedési mód módosítása”), és válaszd a „Tömegközlekedés” lehetőséget. A keresés onnan és akkor indul, ahol és amikor az első séta véget ér, és figyelmeztet, ha egy kapcsolat a következő séta kezdete után érkezik.',
  'help.guide.tour-walk-google-import.tip.1':
    'A TREK csak gyalogosan tervezett útvonalat tud beolvasni. Megosztás előtt állítsd a Google Mapset gyalogos módra.',
  'help.guide.tour-walk-check-off.step.3':
    'Egy megnézett megállónál kattints a „Megjelölés látogatottként”, egy kihagyottnál a „Kihagyás” gombra.',
  'help.ctx.trip-tour-bike.bullet.1':
    'A „Túratípus” alatti profil határozza meg, milyen kerékpározáshoz tervez az útvonaltervező: „Túra”, „Országúti”, „Murva” vagy MTB. Az alatta lévő sor leírja, mit keres az útvonaltervező, a módosítása pedig a teljes útvonalat újratervezi.',
  'help.guide.tour-bike-profile.step.3':
    'A profilnál válaszd a „Túra”, az „Országúti”, a „Murva” vagy az MTB lehetőséget. Az alatta lévő sor leírja, mit keres az útvonaltervező ezzel a profillal.',
  'help.guide.tour-bike-profile.tip.4':
    'A „Mentés” addig szürke marad, amíg a túrának nincs neve, és amíg az útvonal és a magassági adatok kiszámolása be nem fejeződik.',
  'help.guide.tour-bike-surfaces.result':
    'A térkép kiemeli a kiválasztott sor szakaszait, és tudod, milyen burkolatokon halad az útvonal. Maga a túra változatlan.',
  'help.guide.tour-bike-mtb-grades.step.2':
    'A „Burkolat és utak” kártyán nézd meg a „Nehézségi fok (mtb:scale)” részt: az útvonal megoszlását az „S0, különösebb nehézség nélkül” fokozattól az „S4 és fölötte, haladó terep” fokozatig.',
  'help.ctx.trip-tour-ski.summary':
    'A „Túrák” fülön egy „Sí és tél” típusú túra: egy nap a pályákon, egy sífutókör, egy sítúra, egy hótalpas vagy téli séta. A szakaszai az OpenStreetMapben feltérképezett pályákat, felvonókat és utakat követik, a pályatervező a szakágadhoz és a korlátaidhoz igazítva tervezi őket, a rögzített sínyomvonalat pedig a szakágával együtt importálhatod.',
  'help.guide.tour-ski-plan.step.1': 'A „Túrák” fülön kattints a bal oldali sáv tetején az „Új túra tervezése” gombra.',
  'help.guide.tour-ski-plan.tip.3':
    'Ha később módosítod a szakágat, a pontjaid megmaradnak, a szakaszok pedig az adott szakág beállításaival újratervezésre kerülnek.',
  'help.guide.tour-ski-options.step.4':
    'Használd a kapcsolókat: „Felvonók használata”, „Freeride-útvonalak engedése”, „Szükség esetén lefelé felvonóval” és „Feltételezett összeköttetések kerülése”. A „Sífutás” a „Csak ápolt nyomvonalak” és a „Csak kivilágított nyomvonalak”, a „Sítúra” pedig a „Felfelé a pálya szélén” kapcsolót adja hozzá.',
  'help.guide.tour-ski-fix-leg.step.1':
    'Ha az útvonaltervező nem tudott megtervezni egy szakaszt, a pontja alatt piros sor jelenik meg az okkal, például: „Ezeket a pontokat csak egy kihagyott felvonó köti össze”, és az érintett pályával vagy felvonóval.',
  'help.guide.tour-ski-summary.title': 'Sítúra pályaútvonalának áttekintése',
  'help.guide.tour-ski-summary.tip.4':
    'A kártya alján látod a síterepek nevét és annak a térképadatnak a dátumát, amely alapján a túrát tervezték.',
  'help.guide.tour-ski-pistes-layer.tip.2':
    'Ha a pályák betöltése megszakad, a kapcsolón figyelmeztető jel jelenik meg. A térkép és az útvonalad ettől még működik.',
  'help.guide.tour-ski-import.step.4': 'Kattints az „1 túra importálása” gombra.',
  'help.ctx.trip-tour-paddle.summary':
    'Kajak-, kenu- vagy SUP-túra folyón vagy tavon. Megadja a hajót és a víz típusát, ahol a TREK-nek van adata, a vizet követi, az átemeléseket és a zsilipeket beszámítja az időbe, és mutatja az evezés napjára várható szelet, valamint az útközbeni akadályokról ismert adatokat.',
  'help.guide.tour-paddle-setup.goal':
    'Indíts kajak-, kenu- vagy SUP-túrát, és add meg, mivel, milyen vízen és milyen gyorsan evezel.',
  'help.guide.tour-paddle-setup.tip.1':
    'Ha a „Hajó” értéke „Egyéb”, nincs javasolt sebesség. Adj meg egyet, különben a vízen töltött idő üres marad.',
  'help.guide.tour-paddle-water-route.step.2':
    'Ha egy szakaszt a vízen szeretnél megterveztetni, vidd az egeret az előtte lévő megállóra, és kattints a három pontra („További műveletek”).',
  'help.guide.tour-paddle-water-route.result':
    'Minden szakasz a vizet követi, vagy szándékosan kézzel van rajzolva, és ha a TREK nem tudott megtervezni egy szakaszt, jelzi az okát.',
  'help.guide.tour-paddle-portage.tip.1':
    'Ha mégis evezve tennéd meg a szakaszt, nyisd meg újra a pont „További műveletek” menüjét, és válaszd az „Újra evezés ezen a szakaszon” lehetőséget. A szakasz ismét kézzel rajzolt szakasz lesz.',
  'help.guide.tour-paddle-lock.step.3': 'Kattints a „Zsilip” kártyára a megnyitásához.',
  'help.guide.tour-paddle-time.step.1':
    'Az „Időbecslés” a bal oldali oszlopban, az útpontok alatt található. A fejlécében lévő jelvény a teljes idő, a szünetekkel együtt.',
  'help.guide.tour-paddle-time.result': 'A becslés a megadott értékekkel számol, és jelzi, mi hiányzik még.',
  'help.guide.tour-paddle-wind.tip.2':
    'Több napos túránál a kártya fejlécében minden naphoz egy „Nap” címke tartozik. Egyre kattintva azt a napot látod.',
  'help.guide.tour-paddle-checklist.step.3':
    'A tételek az útvonal sorrendjét követik: duzzasztógátak, zsilipek, zuhatagok, vízre szállási helyek és hozzáférési szabályok az OpenStreetMapből, valamint a saját átemeléseid és zsilipjeid, „Saját” jelöléssel.',
  'help.guide.tour-paddle-checklist.result':
    'Az útvonal minden tételéről döntöttél, és elolvastad a biztonsági tudnivalókat.',
  'help.guide.tour-paddle-track-marks.step.6':
    'Kattints a „Zsilip” gombra, majd a vonalon arra a helyre, ahol a zsilip van.',
  'help.ctx.trip-tour-horse.bullet.1':
    'Ha a szerkesztőben a „Túratípus” értékét „Lovastúra” lehetőségre állítod, a bal oldali oszlopban megjelenik a „Lovas útvonalak” kártya. A „Keresés a térképnézetben” felsorolja a térkép látható részén lévő útvonalakat.',
  'help.guide.tour-horse-plan.step.2':
    'Kattints a „Túra neve” alatti „Túratípus” mezőre, és válaszd a „Lovastúra” lehetőséget. Az „Útpontok” alatt megjelenik a „Lovas útvonalak” kártya.',
  'help.guide.tour-horse-plan.tip.2':
    'A TREK lovastúránál nem számol lovaglási időt. Ha szeretnéd, hogy a napon szerepeljen idő, add meg a „Részletek” között a „Tervezett” mezőben.',
  'help.guide.tour-horse-gap.step.3':
    'Kattints a „Szakasz átvétele” gombra. Amíg a kapcsoló nincs bekapcsolva, a gomb szürke marad.',
  'help.guide.tour-horse-recorded.step.1':
    '„Az utazás túrái” részben kattints a „Túra hozzáadása” gombra (a +), válaszd a „GPX vagy KML importálása” lehetőséget, és válaszd ki a lovastúrád fájlját.',
  'help.guide.dateless-trip.title': 'Utazás tervezése dátumok nélkül',
  'help.guide.trip-reminder.step.2':
    'Az „Emlékeztető” alatt válassz 1, 3 vagy 9 napot. Más időponthoz kattints az „Egyéni” gombra, és írj be 1 és 30 közötti napszámot.',
  'help.guide.upcoming-reservations.title': 'Ugrás a következő foglalásaidhoz',
  'help.guide.half-company-holiday.title': 'Félnapos céges szabadnap jelölése',
  'help.guide.edit-holiday-calendar.step.2':
    'A színes négyzetre kattintva új színt választhatsz, vagy írj be új címkét, és nyomj Entert.',
  'help.guide.person-color.step.1': 'A „Személyek” kártyán kattints a név előtti színes pontra.',
  'help.guide.answer-fusion-request.title': 'Válasz egy összevonási kérelemre',
  'help.guide.log-for-partner.title': 'Napok rögzítése annak, akivel közösen tervezel',
  'help.guide.dissolve-fusion.title': 'Közös tervezés befejezése',
  'help.guide.country-places.goal':
    'Listázd ki, mely helyeket számol a TREK egy országhoz: így ellenőrizheted, mit csináltál ott, vagy megtalálhatod azt a helyet, amelyet a TREK rossz országhoz rendelt.',
  'help.guide.regions.tip.3':
    'A „Hozzáadás a bakancslistához” régióknál is működik. A régió ugyanolyan sraffozással jelenik meg, mint egy bakancslistás ország.',
  'help.guide.tour-activity-stats.step.2':
    'A bal oldali két gombbal válassz időszakot és típust. Az „Időszak” lehetőségei: „Mindenkori”, „Idén”, „Elmúlt 12 hónap”, valamint minden korábbi év, amelyben van túrád; a „Típus” egy túratípusra szűkíti a számokat, vagy „Minden típus”.',
  'help.guide.tour-activity-stats.tip.3':
    'Ha egy napnál résztvevők vannak megadva, csak nekik számít; ha senki sincs megadva, az utazás minden résztvevőjének. A fül élő adatokat tölt be, ezért internetkapcsolat kell hozzá.',
  'help.guide.move-to-list.goal':
    'Rendezd át a listáidat: helyezz át helyeket egyikből a másikba, vagy másold őket egy második listába.',
  'help.guide.accept-list-invite.result':
    'A lista megjelenik a sávban a „Megosztott” alatt, és a helyeivel együtt nyílik meg. A tagok módosításai élőben megjelennek.',
  'help.guide.tour-collection-add-to-trip.step.1':
    'Nyisd meg a listát. A mentett túrák az első sorok, a helyek fölött. Kattints a túránál a „Hozzáadás egy úthoz” gombra, vagy magára a sorra.',
  'help.guide.tour-collection-manage.title': 'Mentett túrák keresése és eltávolítása',
  'help.guide.tour-collection-manage.result': 'A túra lekerül a listáról, és egy rövid üzenet megerősíti ezt.',
  'help.guide.entry-draft.title': 'Bejegyzés megtartása vázlatként',
  'help.guide.journey-map-layers.step.1':
    'A térkép tetején lévő rétegsávban a „Terv”, a „Rögzített”, a „Bejegyzések” és a „Fotók” található, mindegyik a darabszámával. Egyre kattintva elrejtheted vagy megjelenítheted.',
  'help.guide.journey-keep-route.step.1': 'A nap fejlécében kattints a Dawarich gombra („Felvétel átvétele”).',
  'help.guide.journey-day-stays.step.1':
    'Az átnézendő tartózkodásokkal rendelkező nap egy olyan sorral zárul, mint például „4 tartózkodás a Dawarichból”, az időtartammal. Kattints rá, és megjelennek a tartózkodások.',
  'help.guide.journey-take-over-day.step.1':
    'Kattints a nap tartózkodási sorának végén a „Nap átvétele” gombra, vagy a nap fejlécében a listagombra, amely azt is mutatja, hány tartózkodás vár.',
  'help.guide.journey-auto-prepare.goal':
    'Amíg egy utazás tart, minden nap tartózkodásai automatikusan előkészülnek átnézésre.',
  'help.guide.photo-location.goal':
    'Kerüljenek a bejegyzések a térképre anélkül, hogy mindegyikhez helyet kellene keresned.',
  'help.ctx.settings-about.bullet.1': 'A cím mellett látod, melyik verzió fut ezen a szerveren.',
  'help.guide.readability.tip.3':
    'Az olvashatósági beállítások „Kísérleti” jelölésűek. Ha valami rosszul néz ki, a fül alján lévő „Alapértelmezések visszaállítása” gombbal visszaállíthatod az alapbeállításokat.',
  'help.guide.web-push-device.goal':
    'Lásd a TREK értesítéseit a telefonodon vagy a számítógépeden akkor is, ha a TREK be van zárva.',
  'help.guide.connect-airtrail.tip.2':
    'A kulcsot a TREK titkosítva tárolja, és többé nem jeleníti meg; ha a mezőben pontok látszanak, van mentett kulcs.',
  'help.guide.connect-dawarich.tip.2':
    'A gombok alatt a kártya jelzi, mikor ellenőrzött utoljára a TREK, és mit nem tud a Dawarich-verziód.',
  'help.guide.tour-connect-wanderer.tip.2':
    'Privát címen futó példányhoz szükség lehet arra, hogy a rendszergazda engedélyezze a belső hálózatokat.',
  'help.guide.tour-wanderer-watch.tip.2':
    'A „Szünetel eddig” azt jelenti, hogy a wanderer nem válaszolt; a „Token elutasítva” azt, hogy a tokennel sikeres kapcsolattesztet kell futtatni, vagy új token kell.',
  'help.guide.plugin-settings.result':
    'A plugin a te beállításaiddal működik, és minden művelete, amelyet a nevedben végez, megjelenik a „Bővítmény-tevékenység” alatt.',
  'help.ctx.admin-defaults.bullet.3':
    'A beállított mező melletti „visszaállítás” link visszaállítja a TREK alapértelmezett értékét. A felhasználó saját beállítása mindig felülírja ezeket.',
  'help.ctx.admin-settings.bullet.5':
    '„Veszélyzóna”: a „JWT-titok cseréje” minden felhasználót kijelentkeztet, téged is.',
  'help.guide.default-user-settings.step.1':
    'Az „Alapértelmezett felhasználói beállítások” részben válaszd ki a „Színmód” („Világos”, „Sötét” vagy „Automatikus”), a „Hőmérséklet egység”, a „Távolság egység”, az „Időformátum”, „A hét kezdőnapja” és a „Megjelenítési pénznem” értékét, valamint azt, hogy a „Foglalási kódok elrejtése” be vagy ki legyen kapcsolva. Minden választás azonnal mentődik.',
  'help.guide.admin-passkeys.step.2':
    'Add meg a Relying Party ID (domain) értékét, például trek.example.org, és az „Engedélyezett origók” közé azokat a címeket, amelyeken a TREK-ed elérhető, majd kattints a „Mentés” gombra. Ha mindkettőt üresen hagyod, a TREK az APP_URL értékét használja.',
  'help.guide.rotate-jwt-secret.title': 'Mindenki kijelentkeztetése egyszerre',
  'help.guide.notification-defaults.step.2':
    'Egy cellára kattintva a következő állapotra váltasz: „Be”, „Ki”, „Tiltva”. Az elemleírás megnevezi a következő állapotot, és minden kattintás azonnal mentődik.',
  'help.ctx.notifications.bullet.2':
    'A felül lévő „Mind” és „Olvasatlan” között válthatsz: az összes értesítés vagy csak a még nem olvasottak. Görgetés közben a lista továbbiakat tölt be.',
  'help.guide.read-notifications.step.3':
    'Kattints az értesítés alatti gombra, itt a „Vacay megtekintése” gombra, és megnyílik, amiről az értesítés szól. Ez olvasottnak is jelöli.',
  'help.guide.filter-notifications.step.3':
    'Az „Olvasatlan” gombra kattintva csak a még nem olvasott értesítéseket látod. A „Mind” újra az összeset mutatja.',
  'help.guide.mark-notifications-read.tip.2':
    'Az olvasottnak jelölés csak a háttérszínt és a számlálót változtatja meg. Az értesítés a listában marad, amíg nem törlöd.',
  'help.guide.delete-notifications.result': 'Az értesítés lekerül a listáról és a csengőből.',
  'help.guide.notification-settings.result':
    'A Beállítások az „Értesítések” lapon van megnyitva, eseményenként és csatornánként egy kapcsolóval.',
  'help.guide.link-journal.goal': 'Mutasd meg az egyik útinaplódat az utazáson belül azoknak, akiket kiválasztasz.',
  'help.guide.link-journal.tip.3':
    'Később az „Utazás beállításai” „Napló” részében ott a „Hozzáférés szerkesztése”, a „Másik napló” és a „Leválasztás”. A leválasztás eltávolítja a fület; akiket magában a naplóban adtál hozzá, megtartják a hozzáférésüket.',
  'help.guide.dawarich-stays.result':
    'A tartózkodásból az utazás egyik helye lett, a választott napon vagy a „Nem tervezett” helyek között, a panel pedig elintézettnek jelöli.',
  'help.ctx.trip-days.bullet.7': 'Amíg az utazás tart, a terv a mai napon nyílik meg, és odagörget.',
  'help.guide.leave-stop-off-route.tip.2':
    'Az „Eltávolítás a napról” ezzel szemben leveszi a megállót a napról; a „Kihagyás az útvonalból” a tervben hagyja.',
  'help.guide.move-booking-day.goal':
    'Helyezz át egy közlekedést vagy foglalást egy másik napra közvetlenül a tervből, az űrlap megnyitása nélkül.',
  'help.guide.place-image-from-file.result':
    'A fotó lett a hely képe a kártyán, a helyek oszlopában, a napon és a térképen.',
  'help.guide.place-own-hours.step.3':
    'Alattuk a „Nyitvatartás” a hetet mutatja, naponként egy sorral. Ha a TREK talált nyitvatartást a helyhez, az már ki van töltve; ha nem, előbb kattints a „Nyitvatartás hozzáadása” gombra. Írd be, mikor nyit és zár az egyes napokon, és azoknál a napoknál, amikor zárva van, kattints a „Lezárva” gombra.',
  'help.guide.add-accommodation.tip.5':
    'A GPX-nyomvonalakat és a túrák helyeit a TREK soha nem kínálja fel szálláshelyként, csak az utazás szokásos helyeit.',
  'help.guide.confirm-stay-booking.step.1':
    'Nyisd meg a bejelentkezés napját. A szállás kártyáján a „Foglalás” alatt látod az arra az éjszakára szóló szállodafoglalást „Függőben” vagy „Megerősítve” állapottal. Kattints erre a mezőre.',
  'help.guide.tour-map-lines.step.4':
    'Ha egy túrát le szeretnél venni a térképről, állítsd a jobb oldali oszlopot „Túrák” nézetre, vidd az egeret a túra fölé, és kattints a szem ikonra („Elrejtés a térképen”). A vonala és a gombostűje eltűnik a térképről, a sora pedig halványítva a listában marad egy áthúzott szem ikonnal („Megjelenítés a térképen”), amellyel újra megjelenítheted.',
  'help.guide.car-stops.step.1':
    'Annak a napnak a fejlécében, amikor átveszed az autót, kattints a + gombra („Hozzáadás a naphoz”), és válaszd a „Közlekedés hozzáadása” lehetőséget.',
  'help.guide.car-stops.tip.2':
    'A „Mozgatás felfelé” és a „Mozgatás lefelé” csak akkor jelenik meg, ha az autós útnak legalább két megállója van.',
  'help.guide.transport-details.title': 'Közlekedés megnyitása és a részletek használata',
  'help.guide.transport-details.tip.1': 'Ha a vonal már látszik, a „Térképen” gombra újra kattintva kikapcsolod.',
  'help.guide.export-transports-csv.result':
    'A böngésződ elment egy fájlt az utazás nevével, például autumn-in-japan-transports.csv, minden út egy sorral: „Típus”, „Cím”, „Állapot”, „Kezdés”, „Befejezés”, „Kitől”, „Ki”, „Helyszín”, „Visszaigazolás” és „Jegyzetek”.',
  'help.guide.group-sort-bookings.goal':
    'Rendezd a kártyákat vagy a listát állapot, nap vagy típus szerint, a kívánt sorrendben.',
  'help.guide.booking-on-map.tip.1':
    'A „Térképen” gomb csak olyan foglalásnál jelenik meg, amelyhez hely tartozik. Válassz egyet az űrlapon a „Hely / Tevékenység” alatt, és a gomb megjelenik.',
  'help.guide.export-bookings-csv.step.2':
    'Nyisd meg a nézetikonok utáni csúszkákat („Nézet beállításai”), és a „Rendezés” alatt válassz sorrendet. A sorok ezt követik, foglalásonként egy sorral, csoportok nélkül.',
  'help.guide.edit-booking.tip.4':
    'Ha már módosítottál valamit, az űrlapon kívülre kattintva vagy az Esc billentyűvel a TREK megkérdezi: „Elveted a módosításokat?” A „Szerkesztés folytatása” visszavisz az űrlaphoz.',
  'help.guide.arrange-packing-list.step.2':
    'Egy listán belül a sor bal oldalán lévő fogantyúval feljebb vagy lejjebb húzhatod a tételt. A sor bal szélén megjelenő, kiemelőszínű vonal mutatja, hová kerül.',
  'help.guide.count-packed-pieces.goal':
    'Adj meg egy tételhez mennyiséget, és jelöld a darabjait egyenként becsomagoltnak.',
  'help.guide.count-packed-pieces.tip.3': 'Egy darabos tételnél nincs számláló, csak a jelölőnégyzet.',
  'help.guide.expense-receipts.step.2':
    'Kattints a „Nyugták és számlák” melletti „Csatolás” gombra, és válaszd ki a fotót vagy a PDF-et; egyszerre többet is kiválaszthatsz. Minden fájl megjelenik a címsor alatt, egy kukával az eltávolításhoz.',
  'help.guide.files-sync-settings.goal':
    'Döntsd el, hogy a dokumentumok csak bejöjjenek a tárolódból, csak kimenjenek oda, vagy mindkét irányban mozogjanak, és mi történjen, ha egy dokumentumot törölnek, vagy mindkét helyen módosítanak.',
  'help.guide.files-sync-settings.tip.2':
    'A „Kérdezzen rá” beállításnál a mindkét helyen szerkesztett dokumentum a kártya alatti „Átnézést igényel” részben vár. Kattints a „Megoldás” gombra, és válaszd „A TREK-verzió megtartása”, „A szolgáltató verziójának megtartása” vagy a „Mindkettő megtartása” lehetőséget.',
  'help.guide.manage-notes.goal':
    'Nyiss meg egy jegyzetet teljes terjedelmében, tartsd felül a fontosat, és javítsd vagy töröld, ami már nem aktuális.',
  'help.guide.manage-notes.tip.2':
    'Szerkesztés közben a már csatolt fájlon lévő piros x azonnal törli a fájlt, még a „Mentés” előtt, és nem a kukába kerül. A jegyzetek minden fájlja az utazás „Fájl” fülén is megjelenik.',
  'help.guide.note-categories.step.6':
    'A „Jegyzetek” kártyán a fejléc alatti gombok szűrik a kártyákat. Egy kategóriára kattintva csak az ahhoz tartozó jegyzeteket látod; a „Mind”, vagy ugyanaz a gomb újra, ismét mindet megjeleníti.',
  'help.guide.roadtrip-reorder.tip.1':
    'Ha itt mozgatsz egy megállót, a napi tervben is áthelyeződik: a „Nap” nézet ugyanezt a sorrendet mutatja.',
  'help.guide.roadtrip-overnight.step.1':
    '„Az útvonalon” részben az „Amit keresel” alatt jelöld be a „Szállás”, vagy sátorhelyhez a „Kemping” lehetőséget, válaszd ki a napot, amelyen megállnál, és kattints a „Keresés” gombra.',
  'help.guide.roadtrip-overnight.tip.3':
    'Ha a „Vezetési beállítások” „Útvonalvonal” részében be van kapcsolva a „Minden nap a szálláson kezdődjön és érjen véget”, a következő napi autóút onnan indul, ahol aludtál.',
  'help.guide.roadtrip-stop-fill.title': 'Egy megálló töltési szintjének beállítása',
  'help.guide.roadtrip-bookings.title': 'Repülés, vonat vagy komp beillesztése az autós útba',
  'help.guide.roadtrip-bookings.tip.2':
    'A megállónál foglalt asztal vagy jegy gombként jelenik meg az adott megállón; ami egyik megállóhoz sem tartozik, az „Erre a napra még lefoglalva” alatt szerepel.',
  'help.guide.roadtrip-google-import.step.3':
    'Ellenőrizd a talált megállókat. Mindegyiknél látod, hol van; a „Hely nem azonosítható” jelölésűeket a TREK kihagyja.',
  'help.guide.roadtrip-hazards.step.1': 'A jobb oldali oszlopban nyisd meg a „Vezetési beállítások” ablakot.',
  'help.ctx.trip-tours.summary':
    'A „Terv” fül jobb oldali oszlopa „Túrák” módban: az utazás összes túrája egy listában, a napok mellett. Innen rendelheted a túrákat a napokhoz, szűrheted a listát, elrejtheted a vonalakat a térképen, és GPX- vagy KML-fájlokat importálhatsz. Az útvonalakat a „Túrák” fülön rajzolhatod meg és módosíthatod.',
  'help.guide.tour-show-list.goal':
    'Cseréld le a helyek oszlopát az utazás túráira, hogy a napok mellett lásd és kiválaszthasd őket.',
  'help.guide.tour-show-list.tip.3':
    'Bekapcsolt Túrák bővítménnyel a nyomvonalak soha nem jelennek meg a „Hely” listában: minden importált nyomvonal túra, és itt szerepel.',
  'help.guide.tour-add-to-day.step.5':
    'Szakaszokból álló túránál ugyanebben a menüben következik még egy kérdés. A „Szakaszok ettől a naptól” az 1. szakaszt arra a napra, a többit pedig egyenként a következő napokra teszi; a „Teljes túra ezen a napon” az egészet arra az egy napra teszi.',
  'help.guide.tour-day-times.step.1':
    'A napok oszlopában vidd az egeret a túra sorára, kattints a „További lehetőségek” gombra (a három pont), és válaszd a „Szerkesztés” lehetőséget.',
  'help.guide.tour-day-times.result':
    'A túra a kezdési és befejezési idejével jelenik meg a nap idővonalán, mint bármelyik időponthoz kötött megálló.',
  'help.guide.tour-remove-from-day.result':
    'A napon már nem szerepel a túra, a listában pedig a során nincs „Nap” jelvény.',
  'help.guide.tour-filter-list.tip.2':
    'Egy szűrőcsoport csak akkor jelenik meg, ha a túrák eltérnek benne, így egy rövid listánál lehet, hogy csak az „Állapot” érhető el.',
  'help.guide.tour-hide-on-map.tip.1':
    'Az elrejtés csak rád vonatkozik, és ebben a böngészőben, ehhez az utazáshoz tárolódik: a túra, a napjai és a színe nem változnak, és mások térképén továbbra is látszik.',
  'help.guide.tour-import-plan-tab.tip.1':
    'Az utazásban már szereplő nyomvonal „Már az utazásban van” jelölést kap, és nem importálódik kétszer.',
  'help.ctx.trip-tour-detail.bullet.4':
    'Az alsó sor: „Hozzáadás a naphoz” vagy „Eltávolítás a napról”, ha egy nap meg van nyitva, „Navigáció” a kiindulópontig, a túra weboldala, GPX, „Megosztás”, ha az eszközöd tud fájlt megosztani, „Gyűjtemény” és „Másolás”.',
  'help.guide.tour-detail-read.step.5':
    'Alatta az adatok következnek: „Távolság”, „Legkisebb tengerszint feletti magasság”, „Legnagyobb tengerszint feletti magasság”, „Szintemelkedés” és „Szintcsökkenés”, alattuk az idők, végül a magassági profil a túra vonalának színében.',
  'help.guide.tour-detail-read.result':
    'A túra kártyája nyitva van a terv mellett, és tudod, mely napokon szerepel, milyen hosszú és meredek, és honnan származik.',
  'help.guide.tour-rename-colour.tip.2':
    'A ceruza és a színes pont csak azoknak a tagoknak működik, akik szerkeszthetik a helyeket.',
  'help.guide.tour-take-along.tip.2':
    'Ha a Beállításokban választasz kedvenc térképalkalmazást, a „Navigáció” felsorolás helyett azonnal azt nyitja meg.',
  'help.guide.tour-copy-keep.step.3':
    'Ha más utazásokhoz is szeretnéd megtartani a túrát, nyisd meg, és kattints a kártyája alján a „Gyűjtemény” gombra.',
  'help.guide.tour-packing-link.goal':
    'Mutasd meg közvetlenül a túra kártyáján, mit kell bepakolni hozzá, az utazás csomagolási listájából vagy annak egyik listájából.',
  'help.guide.tour-packing-link.tip.3':
    'A csatoláshoz a helyek szerkesztésére vonatkozó jogosultság kell. A többiek látják a csatolt listát, de a kapcsolatot nem módosíthatják.',
  'help.guide.tour-files.tip.2':
    'A „Feltöltés” csak azoknak a tagoknak jelenik meg, akik módosíthatják a túrát, és fájlokat adhatnak hozzá.',
  'help.guide.tour-activity-link.step.5':
    'A nyomvonal most a „Tényleges nyomvonal” alatt látszik, a saját értékeivel és profiljával a terv mellett.',
  'help.guide.tour-activity-compare.step.2':
    'A „Legnagyobb távolság a tervtől” a nyomvonal és a tervezett vonal közötti legnagyobb távolságot mutatja, a „Terven kívül” pedig azt, hogy a nyomvonal mekkora része tért el ettől a vonaltól.',
  'help.guide.tour-origin-check.step.1':
    'Nyisd meg a túra kártyáját, és görgess az „Eredet” részhez. A „Forrás” megmutatja, honnan származik: GPX-import a fájl nevével, KML- vagy KMZ-import, vagy wanderer a címével.',
  'help.ctx.trip-tour-planner.summary':
    'Az utazás túratervezője: balra a szerkesztő, jobbra az utazás összes túrája, középen a térkép. Itt rajzolhatsz meg egy túrát pontról pontra, valódi ösvények és utak mentén tervezheted az útvonalát, megadhatod a részleteit, és mentheted az utazásba.',
  'help.guide.tour-open-workspace.goal': 'Nyisd meg a túratervezőt, és ismerd meg, mire szolgálnak a részei.',
  'help.guide.tour-open-workspace.tip.1':
    'Az egyes sávok belső szélén lévő fülön az „Összecsukás” elrejti a sávot, hogy a térkép nagyobb helyet kapjon; a „Terv” és „Az utazás túrái” gombbal a sávok újra megjelennek. A sáv szélét húzva szélesebbre vagy keskenyebbre állíthatod.',
  'help.guide.tour-draw-route.step.3':
    'Ellenőrizd, hogy az „Útpontok” alatti „Pont hozzáadása” be van-e kapcsolva (ez ugyanaz a kapcsoló, mint a térkép gombján a „Pontok elhelyezése”), majd kattints a térképen a túra kiindulópontjára.',
  'help.guide.tour-draw-route.result':
    'Egy számozott útvonal a térképen, a pontjai pedig az „Útpontok” alatt, készen arra, hogy nevet adj neki, és elmentsd.',
  'help.guide.tour-type-profile.tip.2':
    'Egyes típusok mentés előtt további adatokat kérnek: a „Futás” a „Tervezett tempó” értékét, az „Evezős túra” a hajót és a víz típusát, a „Sí és tél” túra a szakágat.',
  'help.guide.tour-edit-points.step.5': 'A mellette lévő kuka („Útvonalpont törlése”) eltávolítja a pontot a túrából.',
  'help.guide.tour-shaping-points.step.2':
    'Húzd a pontot arra az ösvényre, amelyen az útvonalnak haladnia kell. Az útvonal ezen át újratervezésre kerül.',
  'help.guide.tour-loop-reverse.goal': 'Fejeződjön be a túra a kiindulópontján, vagy fordítsd meg az irányát.',
  'help.guide.tour-leg-by-hand.title': 'Szakasz kézi rajzolása vagy újratervezése',
  'help.guide.tour-leg-by-hand.result':
    'A szakasz a választott helyen egyenes vonalként, kézzel rajzoltként jelölve fut, vagy újra az útvonaltervező tervezi meg.',
  'help.guide.tour-trip-places.tip.2':
    'Ha eltávolítod a megállót, vagy megszünteted a kapcsolatát, a hely változatlanul az utazásban marad, a napjaival együtt.',
  'help.guide.tour-details-times.step.4':
    'A „Tervezett” mutatja a teljes időt. Ha saját értéket írsz be, az felülírja, és „Kézi érték” jelölést kap.',
  'help.guide.tour-save.step.2':
    'Várj, amíg az „Új túra” melletti pont eltűnik. A mentéshez az útvonal és az összes magassági adat kiszámolása szükséges.',
  'help.guide.tour-edit-saved.goal': 'Nyiss meg egy korábban megtervezett túrát, módosítsd, és mentsd el újra.',
  'help.guide.tour-edit-saved.result': 'A mentett túra már tartalmazza a módosításaidat.',
  'help.guide.tour-summary-profile.tip.2':
    'Ha az útvonal vasalt úton halad, a számok fölött figyelmeztető jelvény jelenik meg a nehézségi fokkal.',
  'help.guide.tour-list-manage.step.4':
    '„Az út összesítése” fölötti gomb a szűrő. Azt mutatja, milyen állapotra szűr (kezdetben „Mind”), a túrák számával.',
  'help.guide.tour-delete.step.1':
    '„Az utazás túrái” alatt vidd az egeret a túra fölé, és kattints a sor jobb oldalán lévő kukára („Törlés”, a túra nevével).',
  'help.guide.tour-saved-elsewhere.step.1':
    'Szerkesztés közben a sáv tetején megjelenik az „Ezt a túrát máshol mentették” üzenet. A módosításaid megmaradnak, amíg nem döntesz.',
  'help.ctx.trip-tour-import.summary':
    'Itt importálhatod az utazásba a máshol már létező túrákat: egy óráról vagy alkalmazásból származó GPX-, KML- vagy KMZ-fájlt, egy másik utazásod túráját, vagy egy útvonalat a saját wanderer-példányodból. Az importált túra pontosan úgy marad, ahogy rögzítették, és szerkeszthető változatot tervezhetsz belőle.',
  'help.guide.tour-import-gpx.step.1':
    'Nyisd meg az utazás „Túrák” fülét. Jobb oldalon, „Az utazás túrái” tetején kattints a + gombra („Túra hozzáadása”).',
  'help.guide.tour-import-gpx.tip.4':
    'KML- vagy KMZ-fájlnál a „Nem kerül importálásra” alatt az is látszik, mit tartalmazott a fájl a vonalakon kívül: pontokat, területeket és egyéb elemeket.',
  'help.guide.tour-view-import.tip.1':
    'Az importált túra nem szerkeszthető pontról pontra. A fenti „Szerkeszthető változat” kártyán a „Szerkeszthető változat tervezése” olyan túrát készít belőle, amelyet módosíthatsz.',
  'help.guide.tour-plan-from-import.step.3':
    'Az „Import lecserélése” gombbal a túrát a helyén tervezheted újra: a napjai és jegyzetei megmaradnak, a rögzített nyomvonal pedig megőrződik, így vissza is állíthatod. A „Tervezés új túraként” nem változtat az importált túrán, hanem mellé létrehoz egy második túrát.',
  'help.guide.tour-restore-recorded.goal':
    'Vond vissza egy importált túra újratervezését, és kapd vissza az eredeti nyomvonalat, akár sokkal később is.',
  'help.guide.tour-take-over.goal':
    'Használj fel újra egy másik utazásodban már megtervezett vagy importált túrát, újrarajzolás nélkül.',
  'help.guide.tour-take-over.tip.2':
    'Csak a többi utazásod jelenik meg, és csak az első 100 túra. A többit kereséssel vagy szűréssel találhatod meg.',
  'help.guide.tour-import-wanderer.step.4': 'Kattints az „Importálás az utazásba” gombra.',
  'help.ctx.trip-tour-map.bullet.1':
    'A térkép bal alsó gombján a megnyitott túra típusához elérhető alaptérképek találhatók: „Térkép”, Topo, gyalogtúránál „Túrázás”, kerékpártúránál „Kerékpár”, valamint „Műhold”. Az itt választott térkép csak a tervezőre vonatkozik, és soha nem módosítja a Beállításokban megadott térképet.',
  'help.guide.tour-map-layers.step.2':
    'Kattints a Topo lehetőségre a szintvonalakhoz és az árnyékolt domborzathoz: ez a térkép mutatja meg, mennyire meredek a terep. A kiválasztott térkép kiemelve marad a gombon.',
  'help.guide.tour-along-search.step.1':
    'Nyiss meg egy túrát a „Túrák” fülön, és a bal oldali panelen görgess le „A túra mentén” részhez, a túra megállói alá. A kártya akkor jelenik meg, ha a túrának már van útvonala.',
  'help.guide.tour-along-search.tip.3':
    'A találatok az OpenStreetMapből és a TREK helyindexéből származnak, ezért a kereséshez internetkapcsolat kell. Ha nincs találat, a „Tágítás eddig” a következő távolsággal próbálkozik; ha egy szerver túlterhelt, a „Próbáld újra” visszaszámlálást mutat, amíg újra próbálkozhatsz.',
  'help.guide.tour-along-add-stop.tip.1':
    'A hely a túra megállója lesz, nem az utazás helye, ezért nem jelenik meg a helylistában.',
  'help.guide.tour-3d-terrain.step.4':
    'A „Domborzat” csúszkával akár háromszorosára is megemelheted a dombokat, ami enyhe terepen segít.',
  'help.guide.tour-3d-flyover.step.1':
    'Kapcsold a túrát 3D-s nézetre. Amíg az útvonal menti táj betöltődik, a lejátszás gomb helyén egy gyűrű telik meg; ha megtelt, kattints az „Átrepülés lejátszása” gombra. A kamera egy pontot követ az útvonalon, és a „Túra összefoglalója” magassági profilján a jelölő is vele együtt mozog.',
  'help.guide.tour-map-overlays.title': 'Sípályák vagy hajózási jelek megjelenítése a térképen',
  'help.guide.tour-map-overlays.tip.2':
    'A sípályák kapcsolója megnyitott túra nélkül is elérhető, így tervezés előtt is megnézhetsz egy síterepet. Gyalogtúránál a gomb helyette a „Vasalt utak” lehetőséget kínálja, a látható területen lévő útvonalak számával.',
  'help.ctx.trip-tour-stages.bullet.5':
    'A túra sorában lévő plusz gomb („Hozzáadás a naphoz”) a választott naptól kezdve naponta egy szakaszt tesz az utazásba, vagy a teljes túrát arra az egy napra.',
  'help.guide.tour-multi-day.step.6':
    'Ha újra egynapos túrát szeretnél, kattints az „Egynapos” lehetőségre, és a „Legyen egynapos túra?” kérdést erősítsd meg a „Szakaszvégek eltávolítása” gombbal. Az útvonal változatlan marad.',
  'help.guide.tour-stages-on-days.step.1':
    '„Az utazás túrái” között vidd az egeret a többnapos túra fölé, és kattints a plusz gombra („Hozzáadás a naphoz”).',
  'help.guide.tour-stages-on-days.tip.3':
    'Ha egy többnapos túrát a „Terv” fülön egy napra húzol, ugyanezt kérdezi egy ablak, és a túra kártyáján lévő „Hozzáadás a naphoz” is.',
  'help.ctx.trip-tour-hike.bullet.4':
    'Az útpontok alatti „Útrészletek” az OpenStreetMap alapján mutatja minden szakasz SAC-fokozatát, burkolatát és úttípusát, és ezek szerint színezi az útvonalat a térképen. Semmi sem változtat benne a túrán.',
  'help.guide.tour-hike-plan.step.4':
    'A „Pont hozzáadása” kezdettől be van kapcsolva: kattints a térképen a gyalogtúra kiinduló- és végpontjára. A mellette lévő „Út helyei” gombbal helyette az utazás egy menedékházát vagy szállodáját is kiválaszthatod. Két ponttól a TREK megtervezi a gyalogos útvonalat.',
  'help.guide.tour-hike-trail-details.title': 'Nehézségi fokok, burkolatok és úttípusok egy gyalogtúra mentén',
  'help.guide.tour-hike-trail-details.tip.1':
    'Az OpenStreetMapben értékkel nem rendelkező utak az „Ismeretlen” alatt szerepelnek, és az ismeretlen nem jelent könnyűt. Ha némelyiknél az „Ezúttal nem lehetett lekérdezni” felirat látszik, kattints a „Próbáld újra” gombra.',
  'help.guide.tour-hike-round.step.4':
    'Egy körre kattintva kiválaszthatod. A sorában látszik a távolság, a szintemelkedés és az idő, valamint az, hogy mennyivel tér el a kért távolságtól.',
  'help.guide.tour-hike-compare-ways.step.1':
    'Vidd az egeret arra a megállóra, ahol a szakasz kezdődik, kattints a sorában a „További műveletek” gombra, és válaszd az „Utak összehasonlítása a következő szakaszhoz” lehetőséget.',
  'help.guide.tour-ferrata-add.title': 'Vasalt út hozzáadása gyalogtúrához',
  'help.guide.tour-ferrata-add.tip.1':
    'A vasalt úthoz felszerelés és tapasztalat kell. A jelvény elemleírása mutatja, az útvonal mekkora részén halad vasalt úton.',
  'help.guide.tour-run-plan.step.3':
    'Add meg a „Tervezett tempó” értékét perc és másodperc per kilométerben, például 7:30.',
  'help.guide.tour-run-ways.title': 'A futás útjainak megtekintése',
  'help.ctx.trip-tour-walk.title': 'Városi séta',
  'help.guide.tour-walk-plan.goal':
    'Állíts össze városnéző sétát megállókból, azzal együtt, mennyi ideig maradsz az egyes helyeken, és melyek a fontosak.',
  'help.guide.tour-walk-plan.tip.2':
    'A városi sétának nincs túrázási korlátja és „Szünetek” mezője: helyette a tartózkodási idők számítanak.',
  'help.guide.tour-walk-sights.step.4':
    'Kattints egy helyre a listában. A térkép fölött megnyílik a kártyája: a „Hová kerül” alatt válaszd ki, melyik két megálló közé kerüljön.',
  'help.guide.tour-walk-day-times.step.1':
    'Rendeld a sétát egy naphoz: „Az utazás túrái” között kattints a sorában lévő kerek + gombra („Hozzáadás a naphoz”), és válaszd ki a napot.',
  'help.guide.tour-walk-day-times.result':
    'A megállókat átrendezheted, vagy módosíthatod a tartózkodási időket, amíg minden hely nyitva nem lesz, amikor odaérsz.',
  'help.guide.tour-walk-google-import.tip.2':
    'A „Másik link” visszavisz a link mezőhöz. A betöltés felülírja a tervező mentetlen módosításait, de az ablak előbb figyelmeztet.',
  'help.guide.tour-walk-check-off.step.4':
    'A lista tetején látod a meglátogatott megállók számát és a hátralévő gyaloglási időt. Egy megállónál a „Visszavonás” eltávolítja a jelölést.',
  'help.ctx.trip-tour-bike.bullet.2':
    'A jobb oldali „Túra összefoglalója” a „Kerékpáros idő (becsült)” értéket mutatja, vagyis az útvonaltervező által a profilra számolt időt, az emelkedőkkel együtt. A szüneteket nem tartalmazza.',
  'help.guide.tour-bike-profile.step.4':
    'Az „Útpontok” alatt kattints az „Út helyei” gombra, és válaszd ki a kiinduló- és a végpontot, itt a Hotel Alpenroyal, majd a Hotel Greif. Azt is megteheted, hogy ellenőrzöd, be van-e kapcsolva a „Pont hozzáadása”, és a térképre kattintasz. Két ponttól a TREK megtervezi az útvonalat.',
  'help.guide.tour-bike-profile.tip.5':
    'Ha a rendszergazda engedélyezi a CyclOSM térképet, megnyitott kerékpártúránál a térkép rétegsorában a „Kerékpár” is megjelenik. Ha nem töltődik be, válts a „Térkép” nézetre. A túra nem változik.',
  'help.guide.tour-bike-surfaces.tip.1':
    'A „Nincs az adatokban” azt jelenti, hogy az OpenStreetMap ott nem tartalmaz burkolati adatot. A burkolat ismeretlen, nem feltétlenül jó.',
  'help.guide.tour-bike-mtb-grades.step.3':
    'Egy nehézségi sorra kattintva kiemelheted azokat az ösvényeket a térképen.',
  'help.ctx.trip-tour-ski.bullet.1':
    'Először a „Szakág” kerül sorra, és semmi sincs előre kiválasztva: „Alpesi”, Snowboard, „Sífutás”, „Sítúra”, „Hótalpas túra” vagy „Téli túra”. A „Sífutás” a „Technika” értékét is kéri: „Klasszikus”, „Korcsolyázó” vagy „Ismeretlen”. Szakág nélkül a túra nem menthető.',
  'help.guide.tour-ski-plan.step.2': 'Nyisd meg a „Túratípus” listát, és válaszd a „Sí és tél” lehetőséget.',
  'help.guide.tour-ski-plan.tip.4':
    'Ahol nincs pályaadat, a szakasz egyenes vonal a pontjai között. Hótalpas és téli túránál helyette nyári ösvényeket is használhat, amit a szakaszon egy szürke megjegyzés jelez.',
  'help.guide.tour-ski-options.step.5':
    'A „Kihagyás” alatt nyomd meg azokat a felvonótípusokat, amelyeket nem szeretnél használni: „Húzóliftek”, „Nyitott ülőliftek”, „Kabinos felvonók”, „Kötélpályák” vagy „Siklók és vonatok”. A megnyomott típus át van húzva.',
  'help.guide.tour-ski-fix-leg.step.2':
    'Kattints a sorban felkínált javításra: „Nehezebb pályák engedése”, „Felvonó engedése”, „Lefelé felvonóval”, „Technika váltása” vagy „Sportág váltása”. A beállítás megváltozik, és a szakasz újratervezésre kerül.',
  'help.guide.tour-ski-summary.goal':
    'Nézd meg, hogyan oszlik meg a nap síelés, felvonózás, várakozás és gyaloglás között.',
  'help.guide.tour-ski-summary.result':
    'Tudod, mennyi időt töltesz aznap a pályákon, a felvonókon és a felvonókra várva.',
  'help.guide.tour-ski-pistes-layer.tip.3':
    'A réteg térképi adat, nem élő jelentés: semmit sem mond arról, mi van nyitva vagy ápolva, milyen a hó, vagy van-e lavinaveszély. A kapcsoló megnyitott túra nélkül is elérhető, így tervezés előtt is megnézhetsz egy síterepet.',
  'help.guide.tour-ski-import.step.5':
    '„Az utazás túrái” között kattints a nyomvonalra a megnyitásához. Ha később módosítanád a szakágát, kattints a „Sínyomvonal” kártyán a „Csere” gombra.',
  'help.ctx.trip-tour-paddle.bullet.1':
    'A „Túratípus” alatt az „Evezős túra” a „Hajó” („Kajak”, „Kenu”, SUP vagy „Egyéb”) és a „Víz” („Folyó” vagy „Tó”) megadását kéri. Amíg mindkettőt ki nem választod, a túra nem menthető.',
  'help.guide.tour-paddle-setup.step.1':
    'A „Túrák” fülön kattints a bal oldali oszlop tetején az „Új túra tervezése” gombra.',
  'help.guide.tour-paddle-setup.tip.2':
    'Evezős túránál a térkép a „Térkép” és a „Műhold” nézetet, rétegként pedig az OpenSeaMap „Hajózási jelek” rétegét kínálja.',
  'help.guide.tour-paddle-water-route.step.3':
    'Válaszd a „Következő szakasz tervezése a vízen” lehetőséget. A TREK ettől a ponttól a következőig a folyó vagy a tó mentén tervezi meg a szakaszt.',
  'help.guide.tour-paddle-portage.title': 'A hajó átemelése egy akadály mellett',
  'help.guide.tour-paddle-portage.tip.2':
    'Az utolsó pontnál az „Átemelés innentől” akkor lép életbe, amikor elhelyezed a következő pontot. A sorban „Innen átemelés” látszik, az x-szel („Mégse emeld át”) pedig visszavonhatod.',
  'help.guide.tour-paddle-lock.step.4':
    'Add meg a „Várakozás” és a „Zsilipelés” perceit. Ha mindkettő megvan, a kártya mutatja az összegüket.',
  'help.guide.tour-paddle-time.step.2':
    'A sáv az útvonalat mutatja az elejétől a végéig: a vizet, barnával az átemeléseket, jelekként a zsilipeket. Az útvonalon lévő akadályok kattintható jelölések, amelyekkel megtalálhatod őket a térképen.',
  'help.guide.tour-paddle-wind.title': 'A szél ellenőrzése az evezés napjára',
  'help.guide.tour-paddle-wind.tip.3':
    'Szeles napon, ha a túra tavon kel át, a kártya felkínálja a „Tervezés a part mentén” lehetőséget, amely a tavakon a part mentén tervezi az útvonalat.',
  'help.guide.tour-paddle-checklist.step.4':
    'Kattints egy tételre. A térkép odaugrik: akadálynál megnyílik a kártyája a döntéseddel, saját átemelésnél vagy zsilipnél pedig kijelölődik a pontja.',
  'help.guide.tour-paddle-track-marks.title': 'Átemelések és zsilipek jelölése egy rögzített evezős nyomvonalon',
  'help.guide.tour-paddle-track-marks.step.7':
    'Nyisd meg a kártyákat, add meg a perceket, és kattints a „Mentés” gombra.',
  'help.ctx.trip-tour-horse.bullet.2':
    'Egy útvonal saját ablakban nyílik meg: válassz egy szakaszt és az „Irány” értékét, amerre lovagolsz, ellenőrizd a „Lovas hozzáférés” adatait, majd kattints a „Szakasz átvétele” gombra.',
  'help.guide.tour-horse-plan.step.3':
    'A „Lovas útvonalak” kártyán kattints a „Keresés a térképnézetben” gombra. A látható terület összes kijelölt lovasútvonala megjelenik a hosszával.',
  'help.guide.tour-horse-plan.tip.3':
    'Keresés után elmozdítottad a térképet? A gombon ilyenkor „Keresés ebben a nézetben” áll. Túl nagy terület esetén a TREK arra kér, hogy előbb nagyíts rá.',
  'help.guide.tour-horse-gap.step.4':
    'Az „Útpontok” kártyán az áthidalás „Kézi, ellenőrizetlen” jelöléssel és a hosszával jelenik meg. Ha fölé viszed az egeret, elolvashatod, miért.',
  'help.guide.tour-horse-recorded.step.2':
    'Megnyílik az „Importálás előnézete”, még semmi sincs mentve. Az „Importálás mint” alatt állítsd a „Túratípus” értékét „Lovastúra” lehetőségre. Három jelvény mutatja, mit tart meg az importálás, és mit nem számol ki.',
  'help.guide.dateless-trip.goal': 'Kezdj el tervezni, még mielőtt tudnád, mikor utazol.',
  'help.guide.trip-reminder.step.3': 'Kattints a „Frissítés” gombra.',
  'help.guide.upcoming-reservations.goal':
    'Nézd meg, mi a következő foglalásod az összes utazásodon, és nyisd meg az utazást, amelyhez tartozik.',
  'help.guide.log-day.tip.3':
    'Az egész napos céges szabadnapnak jelölt napra nem rögzíthetsz szabadságot. Félnapos céges szabadnapon a szabadságnap csak 0,5 napnak számít.',
  'help.guide.half-company-holiday.goal':
    'Adj mindenkinek szabad délutánt, például szenteste, anélkül hogy az egész napot szabadnappá tennéd.',
  'help.guide.public-holidays.tip.2': 'Ha a rácsban egy ünnepnap fölé viszed az egeret, látod a nevét.',
  'help.guide.edit-holiday-calendar.step.3':
    'Módosítsd az országot vagy a régiót a listáikban, vagy a kukával távolítsd el a naptárat.',
  'help.guide.person-color.step.2': 'Válassz színt. Azonnal mentődik, és az ablak bezárul.',
  'help.guide.answer-fusion-request.goal': 'Döntsd el, összevonod-e a szabadságtervedet azzal, aki meghívott.',
  'help.guide.log-for-partner.goal':
    'Rögzíts szabadnapot egy olyan személynek, akinek a terve össze van vonva a tiéddel, például ha megkér rá.',
  'help.guide.dissolve-fusion.goal': 'Bontsd vissza az összevont tervet külön tervekre.',
  'help.guide.country-places.step.1':
    'Keress egy országot, ahol jártál, és válaszd ki. Az alsó panelen megjelenik a kártyája.',
  'help.guide.tour-activity-stats.step.3':
    'Nézd meg a számokat: a távolságot, a sarkában a túrák számával, majd a „Szintemelkedés” és a „Szintcsökkenés” értékét. „Minden típus” esetén ezután a három leggyakoribb típusod következik, mindegyik a darabszámával és a távolsággal.',
  'help.guide.move-to-list.step.1':
    'Kattints a szűrősorban a jelölőnégyzet ikonra („Jelölés”), és jelöld be a helyeket.',
  'help.guide.tour-collection-add-to-trip.step.2':
    'Az „Az útba” alatt válaszd ki az utazást. Azok az utazások, amelyekhez nem adhatsz túrát, halványan látszanak.',
  'help.guide.tour-collection-manage.goal':
    'Nézd meg, milyen túrák vannak egy listán és honnan származnak, és távolítsd el azokat, amelyekre már nincs szükséged.',
  'help.guide.entry-draft.goal':
    'Írd meg most a bejegyzést, és rejtsd el a megosztott útinaplóból, amíg el nem készül.',
  'help.guide.journey-map-layers.step.2':
    'A térkép jelmagyarázatához kattints a sáv végén lévő (i) jelre: minden gombostűt, pontot és vonalat elmagyaráz.',
  'help.guide.journey-keep-route.step.2':
    'Ellenőrizd „A nap időzónája” beállítást, amely meghatározza, hol kezdődik és ér véget a nap, és nézd át a felvételt: távolság, időtartam, darabok és hézagok.',
  'help.guide.journey-day-stays.step.2':
    'Egy tartózkodásnál kattints a „Naplóbejegyzés írása” gombra. A bejegyzés az érkezés időpontjánál kerül az adott napra, a tartózkodás nevével és helyével.',
  'help.guide.journey-take-over-day.step.2':
    'Jelöld be a megtartandó tartózkodásokat, és javítsd a nevüket. Két bejelölt tartózkodás között az „Összevonás egy bejegyzésbe” egyesíti őket, a „Külön marad” újra szétválasztja.',
  'help.guide.journey-auto-prepare.step.1':
    'A fejléc jobb felső sarkában kattints a ⋯ gombra, és megnyílik az „Útinapló beállításai” ablak.',
  'help.guide.photo-location.step.1':
    'A fejléc jobb felső sarkában kattints a ⋯ gombra, és megnyílik az „Útinapló beállításai” ablak.',
  'help.guide.share-public.tip.3':
    'A vázlatok soha nem jelennek meg a linken, a rögzített útvonalak pedig csak azokon a napokon látszanak, amelyeken van közzétett bejegyzés.',
  'help.ctx.settings-plugins.title': 'Pluginok',
  'help.ctx.settings-about.bullet.2':
    'A „Hiba bejelentése” és a „Funkció javaslat” a projekt GitHub-oldalát nyitja meg, a Wiki a dokumentációt.',
  'help.guide.map-provider.tip.3':
    'GL-térképen jobb gombbal kattintva és húzva forgathatod és döntheted a térképet; a középső gombos kattintás helyet ad hozzá.',
  'help.guide.web-push-device.step.1':
    'A „Push értesítések ezen az eszközön” alatt kattints a „Bekapcsolás ezen az eszközön” gombra, és engedélyezd az értesítéseket, amikor a böngésző rákérdez. A „Teszt küldése” ellenőrzi, hogy megérkezik-e egy értesítés.',
  'help.guide.connect-airtrail.title': 'Az AirTrail-példányod csatlakoztatása',
  'help.guide.connect-dawarich.title': 'A Dawarich-példányod csatlakoztatása',
  'help.guide.tour-connect-wanderer.title': 'A wanderer-példányod csatlakoztatása',
  'help.guide.tour-connect-wanderer.tip.3': 'A jobb oldali „Leválasztás” ismét eltávolítja a tokent.',
  'help.guide.tour-wanderer-watch.tip.3':
    'Hogy ezeket a jelzéseket milyen csatornákon kapod, azt az „Értesítések” alatt, a „wanderer: jelzések az útvonalaidról” sorban állíthatod be.',
  'help.guide.plugin-settings.tip.1':
    'Ezek a beállítások csak rád vonatkoznak; a többi tag a saját beállításait adja meg a pluginhez.',
  'help.guide.offline-conflicts.step.3':
    'Azok a módosítások, amelyeket a szerver ismételten elutasít, az „Offline gyorsítótár” alatt „Sikertelen módosítások” néven jelennek meg: a „Próbáld újra” még egyszer elküldi őket, az „Elvetés” a szerver verzióját tartja meg.',
  'help.ctx.admin-notifications.bullet.4':
    'Alul az „Alapértelmezések a felhasználóknak”: eseményenként és csatornánként „Be”, „Ki” vagy „Tiltva” mindenkinek, aki nem módosította.',
  'help.guide.default-user-settings.step.2':
    'A beállított mező neve mellett megjelenik egy „visszaállítás” link, amely visszaállítja a TREK beépített alapértelmezését.',
  'help.guide.own-routing-engine.title': 'Saját útvonaltervező szerverek használata',
  'help.guide.admin-passkeys.result':
    'A bejelentkezési oldalon megjelenik a passkey-s bejelentkezés lehetősége, és a felhasználók a beállításaikban passkey-ket adhatnak hozzá.',
  'help.guide.rotate-jwt-secret.goal': 'Szüntess meg minden munkamenetet, ha adatszivárgás gyanúja merül fel.',
  'help.guide.notification-defaults.result':
    'Aki nem módosított egy cellát, a te választásoddal indul, a tiltott cellák pedig zárolva jelennek meg a beállításaiban.',
  'help.ctx.notifications.bullet.3':
    'Minden értesítésből kiderül, ki mit és hol csinált. Az olvasatlanok háttere színezett. Az alatta lévő gomb, például „Utazás megtekintése” vagy „Vacay megtekintése”, odavisz, és olvasottnak jelöli az értesítést.',
  'help.guide.read-notifications.tip.1':
    'A csengő minden olyan képernyőn ott van, ahol a navigációs sáv is, és a száma magától frissül, amikor valami új érkezik.',
  'help.guide.filter-notifications.tip.1':
    'Lefelé görgetve az oldal betölti a régebbi értesítéseket, így az első képernyő után sem marad le semmi.',
  'help.guide.mark-notifications-read.result':
    'Egyik értesítés háttere sem színezett már, és a csengőn lévő piros szám eltűnt.',
  'help.guide.notification-settings.title': 'Mi küldjön értesítést',
  'help.guide.link-journal.step.1':
    'Kattints az utazás neve melletti „Utazás beállításai” gombra, és bal oldalon válaszd a „Napló” lehetőséget.',
  'help.guide.dawarich-stays.tip.1':
    'Amíg nem kattintasz a „Hely hozzáadása” gombra, semmi sem kerül az utazásba. A tartózkodásból létrehozott hely részleteinél ez áll: „A Dawarich-felvételeidből hozzáadva”.',
  'help.guide.leave-stop-off-route.title': 'Megálló kihagyása az útvonalból',
  'help.guide.move-booking-day.step.1':
    'Vidd az egeret a foglalás sora fölé a napon: a bal oldalán megjelenő fogantyú jelzi, hogy húzható.',
  'help.guide.place-image-from-file.tip.1': 'Csak JPG, PNG, GIF és WebP fájlok választhatók; PDF-jegy nem.',
  'help.guide.place-own-hours.step.4':
    'A „Nyitvatartás” jobb oldalán lévő gombok: a másolás gomb minden napra a hétfői nyitvatartást állítja be, az X pedig törli a saját időpontjaidat. Ha a TREK saját nyitvatartást is talált, az „Átvétel a hely adataiból” visszaállítja azt.',
  'help.guide.confirm-stay-booking.step.2':
    'A foglalás a terv fölött nyílik meg. A fejlécében az első gomb az állapotát mutatja.',
  'help.ctx.trip-map.bullet.9':
    'Az utazás minden túrája a saját színével jelölt vonal, a kezdőpontjánál egy gombostűvel. A vonalra kattintva megnyílik a túra kártyája. Azon a napon, amelyen túra szerepel, a nap útvonala a túra kezdőpontjáig vezet, és a végpontjától folytatódik. A „Túrák” listában a túra melletti szem ikon („Elrejtés a térképen”) eltünteti a vonalát a térképedről.',
  'help.guide.tour-map-lines.result':
    'A kívánt túrák a térképen vannak, mindegyik a saját színével, az elrejtett pedig halványítva látszik a „Túrák” listában.',
  'help.guide.car-stops.step.2':
    'Kattints a fejlécben a típusgombra, és válaszd az „Autó” lehetőséget. Az űrlap átalakul: a „Dátum” és a „Kezdési idő” helyett „Felvétel” és „Felvétel ideje”, a „Befejezés dátuma” és a „Befejezési idő” helyett „Visszaadás” és „Visszaadás ideje” látszik, a „Kitől” és a „Ki” alatt pedig megjelenik a „Megállók útközben”.',
  'help.guide.transport-details.goal':
    'Lásd egy helyen egy út összes adatát, másold ki a foglalási kódját, nevezd át, vagy ugorj rá a térképen.',
  'help.guide.transport-details.tip.2':
    'Az Esc billentyű vagy a részleteken kívüli kattintás bezárja őket. Ha az „Átnevezés” vagy a törlési kérdés nyitva van, előbb az zárul be.',
  'help.guide.export-transports-csv.tip.1': 'Az ikon csak akkor látszik a sávban, ha a fülön legalább egy út van.',
  'help.guide.group-sort-bookings.step.1':
    'A „Kártyák” vagy a „Lista” nézetben kattints a három nézetikon utáni csúszkákra („Nézet beállításai”).',
  'help.guide.create-booking.tip.4':
    'Offline állapotban a foglalás ezen az eszközön mentődik, és amint újra van kapcsolat, szinkronizálódik. Az új fájlokhoz internetkapcsolat kell, ezért távolítsd el őket, vagy mentsd később. Ha véletlenül az űrlapon kívülre kattintasz, vagy megnyomod az Esc billentyűt, a TREK megkérdezi: „Elveted a módosításokat?”, mielőtt bármi elveszne abból, amit beírtál.',
  'help.guide.booking-on-map.tip.2': 'A szállás az első éjszakájánál nyílik meg.',
  'help.guide.export-bookings-csv.step.3':
    'Kattints a „Nézet beállításai” utáni táblázat ikonra („Exportálás táblázatként (CSV)”).',
  'help.guide.arrange-packing-list.step.3':
    'A „Megosztott” és a „Saját lista” sorának jobb szélén lévő „A-tól Z-ig” név szerint rendezi az egyes listák tételeit, így gyorsan láthatod, rajta van-e már valami. Újabb kattintással visszatérhetsz a saját sorrendedhez.',
  'help.guide.count-packed-pieces.step.1':
    'Kattints egy sorban a mennyiségjelvényre (a kis szám, utána egy x-szel), írd be, hány darabot viszel, például 5, és nyomj Entert.',
  'help.guide.expense-receipts.step.3':
    'Kattints az ablak alján a „Mentés” gombra. A fájlok a kiadással együtt töltődnek fel, és az utazás „Fájl” részében is megjelennek.',
  'help.guide.files-sync-settings.step.1':
    'Kattints a sáv jobb szélén a „Dokumentumok szinkronizálása” gombra. Ha az utazás össze van kötve egy tárolóval, a tároló kártyája jobb oldalon nyílik meg; több tárolónál bal oldalon, az „Ez az utazás” alatt kattints a kívántra.',
  'help.guide.files-sync-settings.tip.3':
    'Az „Azonnali frissítések”, egy link a mellette lévő „Másolás” gombbal, csak azoknál a tárolóknál jelenik meg, amelyeknél a TREK nem tud automatikusan feliratkozni a változásokra. Illeszd be a linket a tárolóba, és a változások azonnal megérkeznek, nem csak a következő ellenőrzéskor.',
  'help.guide.manage-notes.step.1':
    'Kattints a jegyzetkártya fejlécében a három pontra („További lehetőségek”). A menüben a „Kibontás”, a „Kitűzés”, a „Szerkesztés” és a „Törlés” található.',
  'help.guide.note-categories.title': 'Jegyzetek rendezése kategóriákba',
  'help.guide.note-categories.result':
    'A jegyzeteken az új nevek és színek látszanak, a „Jegyzetek” kártya pedig csak a kiválasztott kategóriát mutatja.',
  'help.guide.roadtrip-stops.tip.5':
    'Ha egy megállónak a napi tervben befejezési ideje van, addig tart. Az ablaka jelzi, mikor indul tovább az autó, a „Befejezési idő törlése” után pedig újra te adhatod meg a hosszát.',
  'help.guide.roadtrip-reorder.tip.2':
    'A lefoglalt utak és a termináljaik ott maradnak, ahová a foglalás teszi őket; csak a helyeket lehet húzni.',
  'help.guide.roadtrip-overnight.step.2':
    'Szállodánál a plusz helyett ágy ikon látszik. Rákattintva („Hozzáadás éjszakázásként”) megnyílik a „Hozzáadás megállóként” ablak az éjszakához. Kempingnél a szokásos „Hozzáadás” gomb látszik.',
  'help.guide.roadtrip-stop-fill.goal':
    'Adj egy tankoló- vagy töltőmegállónak saját töltési szintet, például 80 %-ot gyorstöltőnél vagy 100 %-ot éjszakára.',
  'help.guide.roadtrip-bookings.goal':
    'Nézd meg, hol illeszkedik egy lefoglalt út az autós útvonalba, és mikorra kell odaérned.',
  'help.guide.roadtrip-bookings.tip.3':
    'Az az út, amely az utazás egyik napján sem szerepel, nem része az autós útvonalnak: a sáv tetején egy megjegyzés megnevezi, a „Foglalás megnyitása” gombbal pedig dátumot adhatsz neki.',
  'help.guide.roadtrip-google-import.step.4':
    'A „Nap” alatt válaszd ki, melyik napra kerüljenek a megállók, majd kattints az „Importálás” gombra.',
  'help.guide.roadtrip-hazards.step.2':
    'Az ablak jobb oldali oszlopának alján, az „Aktuális figyelmeztetések” alatt kapcsold be a „Veszélyes területek megjelenítése” beállítást, majd kattints a „Lezárás” gombra.',
  'help.ctx.trip-tours.bullet.1':
    'A jobb oldali oszlop tetején lévő „Hely” és „Túrák” kapcsoló a helylistát a túrákra cseréli. Csak akkor érhető el, ha a Túrák bővítmény be van kapcsolva, és ilyenkor a túrák soha nem jelennek meg a „Hely” listában.',
  'help.guide.tour-show-list.step.1':
    'A „Terv” fülön a jobb oldali oszlop tetején lévő kapcsolóban kattints a „Túrák” lehetőségre. Az oszlop most a helyek helyett a túrákat mutatja.',
  'help.guide.tour-show-list.result':
    'A jobb oldali oszlop az utazás túráit mutatja, és az, amelyikre kattintottál, nyitva van a kártyáján.',
  'help.guide.tour-add-to-day.tip.1':
    'Ha egy szakaszokból álló túrát egy napra húzol, ugyanezt egy kis ablak kérdezi meg. A „Mégse” változatlanul hagyja a tervet.',
  'help.guide.tour-day-times.step.2':
    'Add meg a „Kezdés” értékét, a „Befejezés” mezőt hagyd üresen. A mezők alatti sor mutatja a TREK által kiszámolt befejezési időt: a kezdés plusz a túra ideje.',
  'help.guide.tour-remove-from-day.title': 'Túra levétele egy napról',
  'help.guide.tour-filter-list.title': 'A túralista szűrése',
  'help.guide.tour-filter-list.tip.3':
    'Ha egy túra sem marad, a listán a „Nincs a szűrőknek megfelelő túra” üzenet látszik, a „Szűrők visszaállítása” pedig az összes szűrőt törli. A szűrők csak azt befolyásolják, mi látszik a listában, a túrákat és a napokat soha.',
  'help.guide.tour-hide-on-map.tip.2':
    'A telefonos térkép mindig minden túrát mutat, a „Túrák” fülön pedig nincs szem ikon: elrejteni itt, a „Terv” fülön lehet.',
  'help.guide.tour-import-plan-tab.tip.2':
    'Az importált túra itt a listában marad, és nem nyílik meg tervezőben. A kerek + gombjával rendeld hozzá egy naphoz, vagy nyisd meg a „Túrák” fület, és ott nézd meg.',
  'help.ctx.trip-tour-detail.bullet.5':
    'A kártya az áttekintésre és a túrához kapcsolódó dolgokra való. Magát az útvonalat a „Túrák” fülön módosíthatod: nyisd meg, és „Az utazás túrái” alatt kattints a túrára. Túrát is ott törölhetsz, nem itt.',
  'help.guide.tour-detail-read.step.6':
    'Görgess tovább a „Leírás” és a „Jegyzetek” részhez, majd az „Eredet” részhez: TREK-ben tervezve, az importált fájl, vagy a wanderer-útvonal, amelyből származik, a dátummal.',
  'help.guide.tour-rename-colour.title': 'Túra átnevezése és színének módosítása',
  'help.guide.tour-rename-colour.result':
    'A túra az utazásban mindenhol az új nevével jelenik meg, a vonala pedig a választott színnel.',
  'help.guide.tour-take-along.tip.3':
    'A fájl a szerverről érkezik, ezért internetkapcsolat kell hozzá. Az offline létrehozott túra a szinkronizálás után tölthető le.',
  'help.guide.tour-copy-keep.step.4':
    'Válaszd ki a listát a „Gyűjtemény” alatt, ellenőrizd a „Név a gyűjteményben” mezőt, és kattints a „Megőrzés” gombra.',
  'help.guide.tour-packing-link.step.1':
    'Nyisd meg a túra kártyáját, és görgess a „Csomagolási lista” részhez. Kattints a „Csomagolási lista csatolása” gombra.',
  'help.guide.tour-packing-link.result':
    'A „Listák” fülön a csomagolási listánál vagy, a túra kártyáján pedig minden kipipált tétel látszik.',
  'help.guide.tour-files.result': 'A fájlok a túrához vannak csatolva, és a kártyájáról megnyithatók.',
  'help.guide.tour-activity-link.tip.1':
    'A terv változatlan marad. A nyomvonal csak hozzá van kapcsolva, a „Leválasztás” pedig megszünteti a kapcsolatot.',
  'help.guide.tour-activity-compare.step.3':
    'Az „Összehasonlítás a térképen” gombbal a tényleges nyomvonal pontozott vonalként jelenik meg a terv mellett. Az összehasonlítás befejezésével ismét eltűnik.',
  'help.guide.tour-origin-check.step.2':
    'Az „Importálva” az importálás napját mutatja. Az „Itt” a jelenlegi állapotot: „Ahogy importálva”, „Szerkesztve a TREK-ben” vagy „Újratervezve, a rögzített nyomvonal megőrizve”.',
  'help.ctx.trip-tour-planner.bullet.1':
    'Ha a Túrák bővítmény be van kapcsolva, a „Túrák” fül az utazás fülsorában közvetlenül a „Terv” után található. A fül számítógépen és táblagépen érhető el; telefonon a túrákat a „Terv” fülön nézheted meg és rendelheted napokhoz, de nem rajzolhatod meg.',
  'help.guide.tour-open-workspace.step.1':
    'Kattints az utazás fülsorában, közvetlenül a „Terv” után a „Túrák” fülre. A térkép kitölti a képernyőt, mindkét oldalán egy-egy sávval.',
  'help.guide.tour-open-workspace.tip.2':
    'Ha GPX-, KML- vagy KMZ-fájlt ejtesz bárhová ezen a fülön, a TREK az utazás túráiként importálja őket.',
  'help.guide.tour-draw-route.step.4':
    'A térkép alján megjelenik a „Pont elhelyezve” üzenet. A mellette lévő „Visszavonás” ismét eltávolítja a pontot.',
  'help.guide.tour-type-profile.title': 'A túra típusának kiválasztása',
  'help.guide.tour-type-profile.result': 'A túra útvonala a választott típushoz és profilhoz igazodik.',
  'help.guide.tour-edit-points.step.6':
    'A sáv fejlécében lévő „Pontmódosítás visszavonása” és „Pontmódosítás ismétlése” egyenként visszavonja vagy megismétli az összes módosítást.',
  'help.guide.tour-shaping-points.step.3':
    'Az „Útpontok” alatt „Alakítópont” jelvénnyel és szám nélkül jelenik meg, így a megállók megtartják a számukat.',
  'help.guide.tour-loop-reverse.step.1':
    'Kattints az „Útpontok” kártya fejlécében a „Vissza a kiindulópontra” gombra. A túra kap egy utolsó szakaszt, amely visszavezet az első pontjához.',
  'help.guide.tour-leg-by-hand.goal':
    'Köss össze két pontot egyenes vonallal ott, ahol az útvonaltervező nem talál utat, vagy terveztess meg újra egy szakaszt.',
  'help.guide.tour-trip-places.title': 'Az utazás egy helyének használata megállóként',
  'help.guide.tour-trip-places.tip.3': 'Az utazás többi túrája soha nem jelenik meg választható megállóként.',
  'help.guide.tour-details-times.tip.1': 'Az időt 2:56, 2 h 56 vagy 176 perc formában is megadhatod.',
  'help.guide.tour-save.step.3':
    'Kattints a bal oldali sáv alján a „Mentés” gombra. Megjelenik a „Túra mentve” üzenet, a sáv címe pedig „Túra szerkesztése” lesz.',
  'help.guide.tour-edit-saved.step.1':
    'Kattints a túrára „Az utazás túrái” alatt. A bal oldali sávban „Túra szerkesztése” néven nyílik meg, a térképen pedig az útvonala látszik.',
  'help.guide.tour-summary-profile.title': 'A túra összefoglalója és a magassági profil',
  'help.guide.tour-summary-profile.tip.3':
    'Evezős túránál nincs magassági adat, mert a vízen csak a partok magasságát lehetne leolvasni.',
  'help.guide.tour-list-manage.step.5':
    'Válaszd a „Nem tervezett” lehetőséget a még egyik naphoz sem rendelt túrákhoz, vagy szűkíts „Forrás”, „Útvonalkorlát” vagy „Típus” szerint. Minden sorban látod, hány túra felel meg neki, az összesítés pedig a szűrőt követi.',
  'help.guide.tour-delete.step.2':
    'Olvasd el, mi törlődik vele együtt: az útvonal, a szerkeszthető útpontok és a napokhoz rendelések. Kattints a „Végleges törlés” gombra.',
  'help.guide.tour-saved-elsewhere.step.2':
    'Az „Újabb betöltése” megerősítés után az újabb változatra cseréli a módosításaidat.',
  'help.ctx.trip-tour-import.bullet.1':
    '„Az utazás túrái” tetején lévő + gomb a „Túra hozzáadása”. Itt választhatod a „GPX vagy KML importálása”, a „Séta importálása a Google Mapsből” és a „Túra átvétele másik útból” lehetőséget. Fájlokat a „Túrák” fül bármely részére is húzhatsz.',
  'help.guide.tour-import-gpx.step.2':
    'Válaszd a „GPX vagy KML importálása” lehetőséget, és válassz ki egy vagy több .gpx, .kml vagy .kmz fájlt, egyenként legfeljebb 10 MB-ig.',
  'help.guide.tour-import-gpx.tip.5':
    'Magassági adatok nélküli fájlnál a „Nincsenek magasságok a fájlban” üzenet jelenik meg. A vonal és a távolság ettől még pontos, de a szintemelkedés és a szintcsökkenés ismeretlen marad.',
  'help.guide.tour-view-import.tip.2':
    'A fejlécben lévő letöltés ikonnal ismét GPX-fájlként mentheted, a könyvjelzővel pedig gyűjteménybe.',
  'help.guide.tour-plan-from-import.step.4':
    'A túra az útpontjaival együtt megnyílik a szerkesztőben. Ha szeretnéd, módosítsd, majd kattints az oszlop alján a „Mentés” gombra.',
  'help.guide.tour-restore-recorded.step.1':
    '„Az utazás túrái” között kattints az újratervezett túrára. A szerkesztőben a „Rögzített nyomvonal” kártya jelzi, hogy az eredeti rögzített nyomvonal megmaradt.',
  'help.guide.tour-take-over.step.1':
    'Nyisd meg annak az utazásnak a „Túrák” fülét, ahová a túrát szeretnéd tenni. „Az utazás túrái” tetején kattints a + gombra („Túra hozzáadása”).',
  'help.guide.tour-take-over.tip.3':
    'A túra átvételéhez internetkapcsolat kell. Ha a szerkesztőben mentetlen módosítások vannak, a másolat ettől még bekerül a listába, de nem nyílik meg, így a munkád nyitva marad.',
  'help.guide.tour-import-wanderer.tip.1':
    'A gomb akkor jelenik meg, ha a wanderer csatlakoztatva van a Beállítások, Integrációk menüpontban. Addig a lista a „Csatlakoztatás a beállításokban” lehetőséget kínálja.',
  'help.ctx.trip-tour-map.bullet.2':
    'A gombon belül az elválasztó után a túratípus kapcsolói következnek: túra szerkesztése közben a „Pontok elhelyezése”, gyalogtúránál a „Vasalt utak”, evezős túránál a „Hajózási jelek”, sítúránál pedig a sípályák. A végén lévő 3D a túrát háromdimenziós tájon mutatja.',
  'help.guide.tour-map-layers.step.3':
    'Gyalogtúránál kattints a „Túrázás” lehetőségre a jelzett turistautakhoz és a jelzéseikhez; kerékpártúránál helyette a „Kerékpár” térkép érhető el a kerékpárutakhoz. A „Műhold” légifotót mutat, a „Térkép” pedig visszavisz az alaptérképhez.',
  'help.guide.tour-along-search.step.2':
    'Kattints a „Mit keress” gombra, és jelöld be a kívánt típusokat, egyszerre legfeljebb hatot: kilátópontok, csúcsok, menedékházak és esőbeállók, ivóvíz, étkezés és egyebek. A lista a túratípushoz illő lehetőségeket kínálja, és a túra kezdetben hárommal indul, bejelölve.',
  'help.guide.tour-along-add-stop.title': 'Túra menti hely hozzáadása megállóként',
  'help.guide.tour-along-add-stop.tip.2':
    'Az új végpontként felvett helyen „Meghosszabbítja a túrát” jelölés látszik: a régi végpont már nem a vége, és a túra eddig a helyig folytatódik.',
  'help.guide.tour-3d-terrain.step.5':
    'Kattints újra a 3D gombra, és visszatérhetsz a sík térképhez, hogy folytasd a tervezést.',
  'help.guide.tour-3d-flyover.step.2':
    'A „Sebesség” alatt válaszd az 1×, 2× vagy 4× lehetőséget. 1×-es sebességnél a legtöbb túra elejétől a végéig nagyjából 45 másodpercig tart.',
  'help.guide.tour-map-overlays.goal':
    'Jelenítsd meg a sípályákat és a felvonókat, illetve a bójákat és a kikötői jeleket a térképen, miközben sí- vagy evezős túrát tervezel.',
  'help.guide.tour-map-overlays.tip.3':
    'Ha egy réteg betöltése megszakad, a kapcsolóján ! jel és magyarázat jelenik meg; a térkép és az útvonalad nélküle is működik.',
  'help.guide.tour-multi-day.title': 'Többnapos túra tervezése',
  'help.guide.tour-multi-day.tip.1':
    'A „Szakasz vége itt” egynapos túránál is működik: a túra ilyenkor automatikusan többnapos lesz. Az első és az utolsó megálló, valamint egy alakítópont nem lehet szakasz vége.',
  'help.guide.tour-stages-on-days.step.2': 'Válaszd ki azt a napot, amelyen az első szakaszt kezded.',
  'help.guide.tour-stages-on-days.tip.4':
    'A napi tervben minden szakasz „N. szakasz” néven jelenik meg, a saját távolságával és idejével. A „Terv” fülön a napok fölötti „Visszavonás” egy lépésben visszavonja a teljes elosztást.',
  'help.ctx.trip-tour-hike.bullet.5':
    'Gyalogtúránál a bal alsó térképgombok közül a „Vasalt utak” megmutatja a közeli vasalt utakat. Egy vasalt út kártyájáról önálló szakaszként adhatod hozzá az útvonalhoz.',
  'help.guide.tour-hike-plan.step.5':
    'A „Részletek” alatt nyisd meg az „Ösvény legnagyobb nehézsége” beállítást, és válaszd ki, milyen nehéz ösvényeket engedsz meg, T1-től (túrázás) T6-ig (nehéz magashegyi túrázás). Az útvonal ezen belül újratervezésre kerül.',
  'help.guide.tour-hike-trail-details.goal':
    'Nézd meg, mit rögzít az OpenStreetMap a gyalogtúra útjairól, és keresd meg ezeket a szakaszokat a térképen.',
  'help.guide.tour-hike-trail-details.tip.2':
    'A gyalogtúra korlátjánál nehezebb fokozat sorában „A határ felett” jelvény látszik.',
  'help.guide.tour-hike-round.step.5':
    'Kattints az „Ezt a kört választom” gombra, majd a „Csere” gombra, amikor a TREK megkérdezi, lecserélje-e a tervezett útvonalat.',
  'help.guide.tour-hike-compare-ways.step.2':
    'A térkép fölött megnyílik a „Más utak ehhez a szakaszhoz” a „Jelenlegi út” és az „A út”, „B út” és így tovább lehetőséggel. Mindegyik a saját színével jelenik meg a térképen, és ha egy sor fölé viszed az egeret, a vonala kiemelődik.',
  'help.guide.tour-ferrata-add.goal':
    'Keresd meg a gyalogtúrád környékén lévő vasalt utakat, és tegyél egyet az útvonal részévé.',
  'help.guide.tour-ferrata-add.tip.2':
    'Vasalt utak csak gyalogtúráknál érhetők el. Ha az útvonal már halad egy vasalt úton, annak kártyáján a „Hozzáadás a túrához” helyett „A túra része” látszik.',
  'help.guide.tour-run-plan.step.4':
    'Add meg a kiinduló- és a végpontot a térképen, vagy válaszd ki őket az „Út helyei” gombbal. A tempó alatt látod a futás idejét: a távolság és a tempó szorzatát.',
  'help.guide.tour-run-ways.goal': 'Ellenőrizd, a futás mekkora része burkolatlan, és milyen nehezek az ösvényei.',
  'help.ctx.trip-tour-walk.summary':
    'Gyalogos túra megállóról megállóra, a „Túrák” fülön tervezve: mennyi ideig maradsz az egyes megállóknál, melyek a fontosak, milyen látnivalók vannak útközben, és a séta napján mikor érsz az egyes helyekre, a nyitvatartásukhoz viszonyítva.',
  'help.guide.tour-walk-plan.step.1':
    'Kattints a bal oldali oszlop tetején az „Új túra tervezése” gombra, majd nyisd meg a „Túratípus” listát, és válaszd a „Városi / városnéző séta” lehetőséget.',
  'help.guide.tour-walk-plan.tip.3':
    'Egy megálló „További műveletek” menüjében a „Leválasztás a helyről” csak az utazás helyével való kapcsolatot szünteti meg. Maga a hely az utazásban marad.',
  'help.guide.tour-walk-sights.step.5':
    'Kattints a „Hozzáadás megállóként” gombra. Egy értesítés jelzi, mennyivel lesz hosszabb a séta, mellette „Visszavonás” lehetőséggel.',
  'help.guide.tour-walk-day-times.step.2':
    'Adj neki kezdési időt azon a napon: a „Terv” fülön kattints jobb gombbal a napon lévő sétára, válaszd a „Szerkesztés” lehetőséget, és add meg a „Kezdés” értékét.',
  'help.guide.tour-walk-google-import.title': 'Google Maps gyalogos útvonal átalakítása városi sétává',
  'help.guide.tour-walk-google-import.tip.3':
    'Csak a megállók kerülnek át, a Google Mapsben rajzolt vonal nem. A rövid maps.app.goo.gl linkek feloldásához internetkapcsolat kell.',
  'help.guide.tour-walk-check-off.tip.1':
    'A jelölések naponként mentődnek: a sétát a tervben a napjáról nyisd meg, ne a túralistából.',
  'help.ctx.trip-tour-bike.bullet.3':
    'Az „Útpontok” alatti „Burkolat és utak” kártya megmutatja, milyen talajon halad az útvonal: a burkolatokat, az úttípusokat és az ismerten burkolatlan rész arányát. Egy sorra kattintva kiemelheted a hozzá tartozó szakaszokat a térképen.',
  'help.guide.tour-bike-profile.step.5':
    'Nézd meg a jobb oldali „Túra összefoglalója” részben a „Kerékpáros idő (becsült)” értéket. Ha az információs pontja fölé viszed az egeret, látod, hogyan számolja a TREK.',
  'help.guide.tour-bike-surfaces.title': 'Egy kerékpártúra burkolatainak megtekintése',
  'help.guide.tour-bike-surfaces.tip.2':
    'Az „Országúti” profilnál a sávok fölötti figyelmeztetés jelzi, mekkora szakasz ismerten burkolatlan. A „Megjelenítés a térképen” megjelöli ezeket a szakaszokat.',
  'help.guide.tour-bike-mtb-grades.result':
    'A térkép megjelöli a kiválasztott nehézségű ösvényeket, és tudod, melyek a túra nehéz szakaszai.',
  'help.ctx.trip-tour-ski.bullet.2':
    'A szakág alatt a pályatervező beállításai vannak, csak azok, amelyeket a szakágad használ: „Legnehezebb pályák”, „Előnyben”, „Tempó”, kapcsolók, például a „Felvonók használata”, valamint a „Kihagyás” azokhoz a felvonótípusokhoz, amelyeket nem szeretnél használni. Minden módosítás újratervezi a túrát.',
  'help.guide.tour-ski-plan.step.3':
    'A „Szakág” alatt válaszd ki, mit fogsz csinálni: „Alpesi”, Snowboard, „Sífutás”, „Sítúra”, „Hótalpas túra” vagy „Téli túra”. Semmi sincs előre kiválasztva, és szakág nélkül a túra nem menthető.',
  'help.guide.tour-ski-plan.result':
    'Egy mentett „Sí és tél” túra „Az utazás túrái” között, a szakaszai a feltérképezett pályák, felvonók és utak mentén haladnak, az ideje pedig a „Túra összefoglalója” részben látszik.',
  'help.guide.tour-ski-options.tip.1': 'Minden módosítás szakaszonként újratervezi a túrát.',
  'help.guide.tour-ski-fix-leg.step.3':
    'Ha egyik javítás sem megfelelő, kattints az „Egyenes vonal” gombra. A szakasz egyenes vonal lesz a két pontja között.',
  'help.guide.tour-ski-summary.step.1':
    'Az útpontok alatt keresd meg a „Pályaútvonal” kártyát. A címére kattintva összecsukhatod, vagy újra kinyithatod.',
  'help.guide.tour-ski-pistes-layer.title': 'Sípályák megjelenítése a térképen',
  'help.guide.tour-ski-pistes-layer.result': 'A sípályák a túra alatt jelennek meg, és leolvashatod a színeiket.',
  'help.guide.tour-ski-import.step.6':
    'A sínyomvonal besorolására szolgáló ablakban válaszd ki a megfelelő szakágat vagy technikát, és kattints a „Mentés” gombra.',
  'help.ctx.trip-tour-paddle.bullet.2':
    'Minden pont jelvényként mutatja a szerepét: vízre szállás, kiszállás, visszaszállás vagy végső kiszállás. A pont alatt látod, mi következik utána: kézzel rajzolt szakasz, átemelés, zsilip, vagy az, hogy miért nem lehetett megtervezni egy szakaszt.',
  'help.guide.tour-paddle-setup.step.2':
    'Nyisd meg a „Túratípus” listát, és válaszd az „Evezős túra” lehetőséget: a vízen, kajakkal, kenuval vagy SUP-pal.',
  'help.guide.tour-paddle-setup.tip.3':
    'Evezős túránál „A túra mentén” elsőként vízre szállási helyeket, csónakkölcsönzőt és ivóvizet keres.',
  'help.guide.tour-paddle-water-route.step.4':
    'Ha a TREK nem tudott megtervezni egy szakaszt, az pirosra vált, és jelzi az okát, például hogy a területre még nincs vízadat. Az „Egyenes vonal” gombbal egyelőre kézzel rajzolhatod meg.',
  'help.guide.tour-paddle-portage.goal':
    'Jelölj meg egy szakaszt, ahol viszed a hajót, hogy szárazföldi szakaszként számítson, a ki- és beszállás idejével együtt.',
  'help.guide.tour-paddle-portage.tip.3':
    'A hordozás 2 km/h-val számít, amíg az „Időbecslés” kártyán meg nem adod a saját hordozási sebességedet.',
  'help.guide.tour-paddle-lock.tip.1':
    'A TREK nem ismeri a zsilipek üzemrendjét. Csak az általad megadott időkkel számol, ezért a zsilip nyitvatartását magad ellenőrizd.',
  'help.guide.tour-paddle-time.step.3':
    'A „Víz” sor a vízen megtett távolság az „Evezési tempó” alapján. A sebességet az oszlop tetején lévő „Evezési tempó” mezőben módosíthatod.',
  'help.guide.tour-paddle-wind.goal': 'Nézd meg az evezés napjára várható szelet a túra kiindulópontján.',
  'help.guide.tour-paddle-wind.tip.4':
    'Ha nincs előrejelzési érték, az nem jelenti azt, hogy biztonságos. Ellenőrizd a körülményeket a helyszínen.',
  'help.guide.tour-paddle-checklist.step.5':
    'Indulás előtt kattints az oszlop alján az „Az evezés kockázatos” sorra, és olvasd el a „Biztonság a vízen” részt.',
  'help.guide.tour-paddle-track-marks.goal':
    'Importálj evezős nyomvonalat az órádról, és jelöld meg rajta, hol vitted a hajót, és hol mentél át zsilipen.',
  'help.guide.tour-paddle-track-marks.tip.1':
    'Pontosan a nyomvonalra kattints: a vonaltól túl messze eső kattintást a TREK elutasítja, és a kártya jelzi ezt.',
  'help.ctx.trip-tour-horse.bullet.3':
    'Minden szakasz egy jelvény az „Útpontok” kártyán, az útvonal nevével, egy hozzáférést jelző ponttal és a hosszával. Az a szakasz, amelyet egyetlen lovasútvonal sem fed le, „Kézi, ellenőrizetlen” jelölést kap.',
  'help.guide.tour-horse-plan.step.4':
    'Kattints egy útvonalra a listában. Saját térképen nyílik meg, a szakaszai megszámozva.',
  'help.guide.tour-horse-plan.tip.4':
    'A bal oldali oszlop fejlécében lévő „Pontmódosítás visszavonása” egy lépésben egy teljes szakaszt von vissza.',
  'help.guide.tour-horse-gap.result':
    'A lovastúrában már nincs hézag, az áthidalt szakasz pedig kézzel rajzoltként van jelölve.',
  'help.guide.tour-horse-recorded.step.3': 'Kattints az „1 túra importálása” gombra.',
  'help.guide.dissolve-fusion.step.3': 'A megjelenő ablakban erősítsd meg a „Feloldás” gombbal.',
};

export default help;
