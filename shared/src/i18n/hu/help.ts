import type { TranslationStrings } from '../types';

// English fallback until 'hu' is translated.
const help: TranslationStrings = {
  'help.title': 'Help & Docs',
  'help.search': 'Search docs…',
  'help.contents': 'Contents',
  'help.noResults': 'No matching pages.',
  'help.errorTitle': "Couldn't load this page",
  'help.errorBody': 'The help content is fetched from the TREK wiki. Check your connection and try again.',

  // center
  'help.center.button': 'Súgó ehhez a képernyőhöz',
  'help.center.title': 'Súgó',
  'help.center.onThisScreen': 'Ezen a képernyőn',
  'help.center.screens': 'Képernyők',
  'help.center.thisScreen': 'Ez a képernyő',
  'help.center.subScreens': 'Alképernyők: {count}',
  'help.center.subScreensLabel': 'Alképernyők',
  'help.center.guidesCount': '{count} útmutató',
  'help.center.goToScreen': 'Ugrás: {screen}',
  'help.center.overview': 'Áttekintés',
  'help.center.howTo': 'Hogyan tudok…',
  'help.center.searchPlaceholder': 'Keresés az útmutatókban és a dokumentációban…',
  'help.center.searchEmpty': 'Nincs találat erre: „{query}”.',
  'help.center.searchGuides': 'Útmutatók',
  'help.center.searchDocs': 'Dokumentáció',
  'help.center.searchError': 'A keresés most nem érhető el.',
  'help.center.back': 'Vissza',
  'help.center.close': 'Súgó bezárása',
  'help.center.steps': '{count} lépés',
  'help.center.step': '{n}. lépés',
  'help.center.stepsLabel': 'Lépések',
  'help.center.stepOf': '{n}. lépés / {total}',
  'help.center.screenshot': 'Képernyőkép',
  'help.center.result': 'Az eredmény',
  'help.center.tips': 'Jó tudni',
  'help.center.related': 'Kapcsolódó',
  'help.center.openDocs': 'Megnyitás a Súgó és dokumentációban',
  'help.center.docsSection': 'A dokumentációban',
  'help.center.noContext': 'Ehhez a képernyőhöz még nincs útmutató.',
  'help.center.noContextHint': 'Keress a dokumentációban, vagy írd meg nekünk, mit kerestél.',
  'help.center.feedback': 'Hiányzik valami?',
  'help.center.feedbackLink': 'Írd meg nekünk a GitHubon',
  'help.center.discord': 'Kérdezz a Discordon',
  'help.center.quick': 'Gyors',
  'help.center.guide': 'Útmutató',
  'help.center.tour': 'Bemutató',
  'help.center.imageAlt': 'A(z) „{title}” {n}. lépése',

  // ctx
  'help.ctx.dashboard.title': 'Irányítópult',
  'help.ctx.dashboard.summary':
    'Az irányítópult a bejárat minden utazáshoz. A felső beszállókártya a most zajló vagy a következő utazást emeli ki, az alatta lévő sor összeszámolja, mennyit utaztál eddig, a kártyák pedig felsorolnak mindent, amit tervezel, archiváltál vagy már lezártál.',
  'help.ctx.dashboard.bullet.1':
    'Beszállókártya: a zajló vagy a következő utazás dátumokkal, utazókkal, helyekkel és visszaszámlálással. Kattints rá az utazás megnyitásához.',
  'help.ctx.dashboard.bullet.2':
    'Utazási statisztika: meglátogatott országok, utazások, úton töltött napok és repült távolság, az összes utazásod alapján.',
  'help.ctx.dashboard.bullet.3':
    'Utazáskártyák Tervezett, Archivált és Befejezett szűrővel, rácsban vagy listában. Vidd az egeret egy kártya fölé a szerkesztéshez, duplikáláshoz, archiváláshoz és törléshez.',
  'help.ctx.dashboard.bullet.4':
    'Widgetek jobbra: valutaváltó, világórák, közelgő foglalások és gyűjtemények. Mindegyik kikapcsolható.',
  'help.ctx.dashboard.bullet.5': 'Az „Új utazás” kártya és a jobb alsó sarokban lévő gomb egyaránt új utazást indít.',

  // create-trip
  'help.guide.create-trip.title': 'Utazás létrehozása',
  'help.guide.create-trip.goal': 'Új utazás indítása névvel, dátumokkal és borítóképpel.',
  'help.guide.create-trip.step.1':
    'Kattints az „Új utazás” gombra. Az utazásaid végén lévő kártya és a jobb alsó sarok gombja ugyanazt teszi.',
  'help.guide.create-trip.step.2':
    'Adj nevet az utazásnak. Ez az egyetlen kötelező mező; minden más később is megadható.',
  'help.guide.create-trip.step.3':
    'Válassz kezdő és záró dátumot. A TREK minden dátumhoz létrehoz egy napot, így az útiterv készen áll a kitöltésre.',
  'help.guide.create-trip.step.4':
    'Nem kötelező: adj hozzá borítóképet. Tölts fel sajátot, húzz be egyet, vagy keresd meg az úti célt az Unsplashen.',
  'help.guide.create-trip.step.5': 'Kattints az „Új utazás létrehozása” gombra.',
  'help.guide.create-trip.result':
    'Az utazás megjelenik az irányítópulton. Ha ez a következő, átveszi a felső beszállókártyát.',
  'help.guide.create-trip.tip.1':
    'A dátumok később módosíthatók. Ha már vannak foglalások, a TREK megkérdezi, hogy a napokkal együtt tolja-e el őket.',
  'help.guide.create-trip.tip.2':
    'Az itt választott utazási pénznem az, amire minden költség átváltódik. Az úti cél pénznemét válaszd.',

  // edit-trip
  'help.guide.edit-trip.title': 'Utazás szerkesztése',
  'help.guide.edit-trip.goal': 'Utazás átnevezése, a dátumok módosítása vagy a beállítások finomítása.',
  'help.guide.edit-trip.step.1': 'Vidd az egeret az utazáskártya (vagy a beszállókártya) fölé, és kattints a ceruzára.',
  'help.guide.edit-trip.step.2': 'Módosítsd, amit kell: név, leírás, dátumok, borító, pénznem, emlékeztető vagy tagok.',
  'help.guide.edit-trip.step.3': 'Kattints a „Frissítés” gombra.',
  'help.guide.edit-trip.result': 'A kártya azonnal frissül, az utazás minden tagjánál.',
  'help.guide.edit-trip.tip.1':
    'Ha olyan utazás dátumait tolod el, amelynek már vannak foglalásai, egy második lépés megkérdezi, hogy a foglalások is menjenek-e vele.',

  // cover-image
  'help.guide.cover-image.title': 'Borítókép beállítása',
  'help.guide.cover-image.goal': 'Adj az utazásnak egy képet, amely a kártyán és a beszállókártyán is látszik.',
  'help.guide.cover-image.step.1': 'Nyisd meg az utazás szerkesztőűrlapját a kártyáján lévő ceruzával.',
  'help.guide.cover-image.step.2':
    'A „Borítókép” alatt dobj be egy fotót, kattints a feltöltéshez, vagy írj be egy úti célt az Unsplash-keresőbe.',
  'help.guide.cover-image.step.3': 'Válassz egy fotót, és kattints a „Frissítés” gombra.',
  'help.guide.cover-image.result':
    'A fotó az utazással együtt mentődik, és mindenhol megjelenik, ahol az utazás szerepel.',
  'help.guide.cover-image.tip.1':
    'Az Unsplash-keresésből származó fotóknál a szerző automatikusan fel van tüntetve; a saját feltöltéseid a szervereden maradnak.',

  // duplicate-trip
  'help.guide.duplicate-trip.title': 'Utazás duplikálása',
  'help.guide.duplicate-trip.goal': 'Egy utazás újrahasznosítása sablonként egy újhoz.',
  'help.guide.duplicate-trip.step.1': 'Vidd az egeret a kártya fölé, és kattints a duplikálás ikonra.',
  'help.guide.duplicate-trip.step.2': 'Olvasd el, mi kerül másolásra és mi nem, majd erősítsd meg.',
  'help.guide.duplicate-trip.result':
    'Az eredeti mellett megjelenik egy másolat, készen az átnevezésre és az új dátumokra.',
  'help.guide.duplicate-trip.tip.1':
    'Napok, helyek, foglalások, költségvetési tételek, csomaglisták és napi jegyzetek átmásolódnak. Tagok, csevegés, szavazások, fájlok és megosztási linkek nem.',

  // archive-trip
  'help.guide.archive-trip.title': 'Utazás archiválása és visszaállítása',
  'help.guide.archive-trip.goal': 'Utazás félretétele törlés nélkül, és későbbi visszahozása.',
  'help.guide.archive-trip.step.1': 'Vidd az egeret a kártya fölé, és kattints az „Archiválás” gombra.',
  'help.guide.archive-trip.step.2': 'Állítsd a kártyák feletti szűrőt „Archivált”-ra, hogy újra lásd.',
  'help.guide.archive-trip.step.3':
    'Kattints a kártyán a „Visszaállítás” gombra, hogy visszakerüljön a „Tervezett” közé.',
  'help.guide.archive-trip.result':
    'Az archivált utazások mindent megőriznek. Csak nem foglalják tovább az irányítópultot és az összes utazás naptárfolyamát.',

  // delete-trip
  'help.guide.delete-trip.title': 'Utazás törlése',
  'help.guide.delete-trip.goal': 'Utazás végleges eltávolítása.',
  'help.guide.delete-trip.step.1': 'Vidd az egeret a kártya fölé, és kattints a kukára.',
  'help.guide.delete-trip.step.2':
    'Erősítsd meg. A párbeszédablak megnevezi az utazást, így biztosan a megfelelőt törlöd.',
  'help.guide.delete-trip.result':
    'Az utazás, a napjai, helyei, foglalásai és fájljai eltűnnek. Nincs visszavonás; ha bizonytalan vagy, inkább archiválj.',

  // filter-and-view
  'help.guide.filter-and-view.title': 'Befejezett utazások keresése, váltás rács és lista között',
  'help.guide.filter-and-view.goal':
    'Befejezett vagy archivált utazások megtekintése, és a neked tetsző elrendezés kiválasztása.',
  'help.guide.filter-and-view.step.1':
    'Használd a kártyák feletti „Tervezett”, „Archivált” és „Befejezett” szűrőt. Befejezett minden utazás, amelynek záró dátuma elmúlt.',
  'help.guide.filter-and-view.step.2': 'Kattints a lista ikonra a tömör listához; kattints újra a rácshoz.',
  'help.guide.filter-and-view.result': 'Az irányítópult ezen az eszközön megjegyzi az elrendezésedet.',

  // calendar-feed
  'help.guide.calendar-feed.title': 'Feliratkozás az összes utazásra a naptáradban',
  'help.guide.calendar-feed.goal':
    'Minden aktív utazás napjainak és foglalásainak megtekintése a naptáralkalmazásodban, mindig szinkronban.',
  'help.guide.calendar-feed.step.1': 'Kattints a naptár ikonra a nézetváltó mellett.',
  'help.guide.calendar-feed.step.2':
    'Kattints az „Enable calendar subscription” gombra. A TREK létrehoz egy privát folyamlinket.',
  'help.guide.calendar-feed.step.3':
    'Add hozzá a folyamot valamelyik gombbal (Google, Apple, Outlook), vagy másold a linket bármelyik naptáralkalmazásba, amely URL-ekre tud feliratkozni.',
  'help.guide.calendar-feed.result':
    'Minden aktív utazás megjelenik a naptáradban, és magától frissül. Az archivált és a több mint 90 napja befejezett utazások kimaradnak.',
  'help.guide.calendar-feed.tip.1':
    'A link titok. Aki birtokolja, olvashatja a folyamot; ha kiszivárog, vond vissza ugyanabban a párbeszédablakban.',

  // widgets
  'help.guide.widgets.title': 'Irányítópult-widgetek kiválasztása',
  'help.guide.widgets.goal': 'A statisztikasor és a jobb oldali widgetek megjelenítése vagy elrejtése.',
  'help.guide.widgets.step.1': 'Nyisd meg a jobb felső avatar menüt, és válaszd a „Beállítások” pontot.',
  'help.guide.widgets.step.2': 'Válts az „Appearance” fülre.',
  'help.guide.widgets.step.3':
    'A „Dashboard widgets” alatt kapcsold be vagy ki az egyes widgeteket. Az asztali és a mobil nézet külön állítható.',
  'help.guide.widgets.step.4': 'Menj vissza az irányítópultra. A változás azonnal érvényes.',
  'help.guide.widgets.result':
    'Az elrejtett widgetek helyet adnak az utazásaidnak; kapcsold ki az egész jobb oszlopot az elrendezés középre igazításához.',
  'help.guide.widgets.link': 'Megjelenési beállítások megnyitása',

  // currency-widget
  'help.guide.currency-widget.title': 'Valutaváltás',
  'help.guide.currency-widget.goal': 'Egy összeg átváltása két pénznem között aktuális árfolyamon.',
  'help.guide.currency-widget.step.1': 'Írd be az összeget, és válaszd ki a két pénznemet.',
  'help.guide.currency-widget.step.2': 'A köztük lévő nyíl felcseréli a párt; a körkörös nyíl frissíti az árfolyamot.',
  'help.guide.currency-widget.result': 'A pénznempárodat a fiókod megjegyzi, így minden eszközön ugyanaz.',
  'help.guide.currency-widget.tip.1':
    'Az árfolyamok az Európai Központi Banktól érkeznek, és naponta egyszer frissülnek.',

  // timezones-widget
  'help.guide.timezones-widget.title': 'Világórák hozzáadása',
  'help.guide.timezones-widget.goal': 'Tartsd szem előtt az úti céljaid helyi idejét.',
  'help.guide.timezones-widget.step.1': 'Kattints a + jelre az „Időzónák” widgetben, és keress rá egy városra.',
  'help.guide.timezones-widget.step.2': 'Egy órát a mellette lévő × jellel távolíthatsz el.',
  'help.guide.timezones-widget.result': 'Az óráid a fiókoddal együtt mentődnek.',

  // ── Screen: vacay ──────────────────────────────────────────────────────────
  'help.ctx.vacay.title': 'Vacay',
  'help.ctx.vacay.summary':
    'A Vacay a személyes szabadságterveződ: hány szabadnapod van egy évben, melyeket vetted már ki, és mennyi maradt. A rács egy pillantásra mutatja az egész évet; az oldalsávban az évválasztó, a veled együtt tervezők, a veled megosztott naptárak, a jelmagyarázat és a keret található.',
  'help.ctx.vacay.bullet.1':
    'Éves rács: tizenkét hónapkártya, naponként egy cella. Kattints egy napra a rögzítéshez vagy törléshez. A kis kék pont azokat a napokat jelöli, amelyeket már lefed egy utazás.',
  'help.ctx.vacay.bullet.2':
    'Alsó eszköztár: Szabadság vagy Céges szabadnap mód, valamint a Fél nap és a Csúsztatás kapcsolók, amelyek megváltoztatják, mit rögzít egy kattintás.',
  'help.ctx.vacay.bullet.3':
    'Szabadságkeret: az évi napjaid, hány van felhasználva és mennyi maradt, az előző időszakból áthozott nappal együtt.',
  'help.ctx.vacay.bullet.4':
    'A Személyek a terveddel összevont emberek, mindenki a saját színében. A Megosztott naptárak csak olvasható gyűrűk mások szabadnapjaival.',
  'help.ctx.vacay.bullet.5':
    'A beállítások lefedik a hétvégéket, a hét kezdetét, az áthozatalt, a szabadságévedet, a céges szüneteket és az ünnepnap- vagy iskolaiszünet-naptárakat.',
  // log-day
  'help.guide.log-day.title': 'Szabadnap rögzítése',
  'help.guide.log-day.goal': 'Jelölj meg egy szabadnapot az éves rácsban, és nézd, ahogy követi az egyenleg.',
  'help.guide.log-day.step.1':
    'Nézd az alsó eszköztárat: a bal oldali, a te színedben lévő gomb azt jelenti, hogy egy kattintás neked rögzít szabadnapot.',
  'help.guide.log-day.step.2':
    'Kattints egy napra bármelyik hónapkártyán. Kitöltődik a színeddel, és a Felhasznált eggyel többet számol.',
  'help.guide.log-day.step.3': 'Kattints ugyanarra a napra újra a törléshez.',
  'help.guide.log-day.result':
    'A nap rögzítve van, a nap, a Felhasznált és a Maradt csempe azonnal frissül, és mindenki, aki össze van vonva a terveddel, élőben látja.',
  'help.guide.log-day.tip.1': 'A hétvégék nem rögzíthetők, amíg a Beállításokban be van kapcsolva a Hétvégék zárolása.',
  'help.guide.log-day.tip.2':
    'A cellában lévő kék pont azt jelenti, hogy az egyik utazásod lefedi azt a napot, így látod, hol esik egybe a szabadság és az utazás.',
  // half-day
  'help.guide.half-day.title': 'Fél nap rögzítése',
  'help.guide.half-day.goal': 'Vegyél ki egy délutánt anélkül, hogy egy egész napot elköltenél a keretből.',
  'help.guide.half-day.step.1':
    'Kapcsold be a Fél nap opciót az eszköztáron. A narancssárga pont az a jel, amit egy fél nap kap a rácsban.',
  'help.guide.half-day.step.2': 'Kattints egy napra. 0,5-ként rögzül, és a sarkában ott a narancssárga pont.',
  'help.guide.half-day.step.3':
    'Kapcsold ki a Fél napot, ha végeztél; egy fél napra más beállításokkal kattintva helyben átalakítod.',
  'help.guide.half-day.result':
    'A Felhasznált 0,5-tel nő. A Fél nap és a Csúsztatás függetlenek, így fél csúsztatásnap is lehetséges.',
  'help.guide.half-day.tip.1':
    'Az eszköztár mindig azt a jelet mutatja, amit a következő kattintásod tesz le, így rögzítés előtt ellenőrizheted.',
  // comp-day
  'help.guide.comp-day.title': 'Csúsztatás vagy rugalmas idő rögzítése',
  'help.guide.comp-day.goal': 'Vegyél ki olyan szabadidőt, ami nem kerül szabadnapokba.',
  'help.guide.comp-day.step.1':
    'Kapcsold be a Csúsztatás opciót az eszköztáron. A vonalkázott korong mutatja, hogy néz ki egy csúsztatásnap a rácsban.',
  'help.guide.comp-day.step.2': 'Kattints egy napra. Tömör blokk helyett a színed átlós vonalkázásával töltődik ki.',
  'help.guide.comp-day.result': 'A csúsztatásnapok a keretcsempék mellett számolódnak, és sosem csökkentik a Maradtat.',
  'help.guide.comp-day.tip.1':
    'Lecsúsztatott túlóra, rugalmas munkaidő, kompenzációs nap: minden, ami szabad, de nem szabadság, ide tartozik.',
  // entitlement
  'help.guide.entitlement.title': 'A keret beállítása',
  'help.guide.entitlement.goal': 'Mondd meg a Vacaynek, hány szabadnapod van egy évben.',
  'help.guide.entitlement.step.1': 'Az oldalsávban kattints a Szabadságkeret alatti nap csempére.',
  'help.guide.entitlement.step.2': 'Írd be a napok számát, és nyomj Entert.',
  'help.guide.entitlement.result':
    'A Maradt újraszámolódik a keretedből, az esetleges áthozatalból és a felhasznált napokból.',
  'help.guide.entitlement.tip.1':
    'Minden évnek saját kerete van, így az itteni változtatás csak a kiválasztott évet érinti.',
  // years
  'help.guide.years.title': 'Évek hozzáadása és váltása',
  'help.guide.years.goal': 'Tervezd meg már a jövő évet, vagy nézz vissza az előzőre.',
  'help.guide.years.step.1':
    'Kattints az évszámtól jobbra lévő + jelre a következő év hozzáadásához, vagy a bal oldalira az előzőhöz.',
  'help.guide.years.step.2': 'Válts az évek között a nyilakkal vagy az alattuk lévő évcímkékkel.',
  'help.guide.years.step.3':
    'Egy év eltávolításához vidd az egeret a címkéjére, és kattints a kis mínuszra. A bejegyzései vele mennek, ezért óvatosan erősítsd meg.',
  'help.guide.years.result': 'Minden év megtartja a saját keretét és bejegyzéseit; az áthozatal köti össze őket.',
  // company-holidays
  'help.guide.company-holidays.title': 'Céges szünetek jelölése',
  'help.guide.company-holidays.goal':
    'Tiltsd le azokat a napokat, amikor az egész cég szabad, anélkül, hogy bárki keretét elköltenéd.',
  'help.guide.company-holidays.step.1':
    'Nyisd meg a Beállításokat, és ellenőrizd, hogy a Céges szabadnapok be van kapcsolva. Alapból be van; az eszköztár csak addig kínálja a módot.',
  'help.guide.company-holidays.step.2': 'Visszatérve a rácsba állítsd az eszköztárat Céges szabadnap módba.',
  'help.guide.company-holidays.step.3':
    'Kattints a napokra. Borostyánszínűek lesznek, és megjelennek a jelmagyarázatban.',
  'help.guide.company-holidays.result':
    'A céges szüneteket mindenki látja, aki össze van vonva a tervvel, és sosem csökkentik a Maradtat.',
  'help.guide.company-holidays.tip.1':
    'Bármely összevont személy szerkesztheti a céges szüneteket, ezért egyezzetek meg, ki kezeli őket.',
  // public-holidays
  'help.guide.public-holidays.title': 'Ünnepnapok megjelenítése',
  'help.guide.public-holidays.goal': 'Tedd a rácsra az országod vagy régiód ünnepnapjait.',
  'help.guide.public-holidays.step.1': 'Nyisd meg a Beállításokat, és kapcsold be az Ünnepnapok kapcsolót.',
  'help.guide.public-holidays.step.2':
    'Kattints a Naptár hozzáadása gombra, válaszd ki az országot és, ahol számít, a régiót. Adj neki színt és címkét, ha szeretnél.',
  'help.guide.public-holidays.step.3':
    'Zárd be a Beállításokat. Az ünnepnapok megjelennek a rácsban és a jelmagyarázatban.',
  'help.guide.public-holidays.result':
    'Az ünnepnapok a naptár színével vannak jelölve, és sosem számítanak bele a keretedbe.',
  'help.guide.public-holidays.tip.1':
    'Több naptárat is hozzáadhatsz, például a saját régiódat és egy összevont kollégáét.',
  // school-holidays
  'help.guide.school-holidays.title': 'Iskolai szünetek megjelenítése',
  'help.guide.school-holidays.goal': 'Lásd a régiód iskolai szüneteit a saját szabadnapjaid mellett.',
  'help.guide.school-holidays.step.1': 'Nyisd meg a Beállításokat, és kapcsold be a School Holidays kapcsolót.',
  'help.guide.school-holidays.step.2':
    'Kattints a Naptár hozzáadása gombra, és válaszd ki az országot. Ahol egy ország felosztja a naptárát, válaszd ki a régiót vagy csoportot is.',
  'help.guide.school-holidays.step.3': 'Zárd be a Beállításokat. Minden szünet színes sávot kap a napjai alján.',
  'help.guide.school-holidays.result': 'Az iskolai szünetek tisztán vizuálisak: senki keretét nem csökkentik.',
  'help.guide.school-holidays.tip.1':
    'Hiányzik a régió? A rendszergazda kézzel is kezelheti az iskolai szüneteket az Admin, Személyre szabás, Iskolai szünetek alatt.',
  // weekends
  'help.guide.weekends.title': 'Hétvégék tiltása és a hét kezdetének beállítása',
  'help.guide.weekends.goal': 'Tartsd ki a hétvégéket a számolásból, és kezdd a hetet a megszokott napon.',
  'help.guide.weekends.step.1': 'Nyisd meg a Beállításokat.',
  'help.guide.weekends.step.2':
    'Kapcsold be a Hétvégék zárolása kapcsolót, és válaszd ki, mely napok számítanak hétvégének.',
  'help.guide.weekends.step.3': 'A hét kezdőnapja alatt válaszd a hétfőt vagy a vasárnapot.',
  'help.guide.weekends.result': 'A tiltott napok szürkék a rácsban, és nem rögzíthetők véletlenül.',
  // leave-year
  'help.guide.leave-year.title': 'A szabadságév beállítása',
  'help.guide.leave-year.goal':
    'Számold a keretet üzleti év szerint vagy a belépés dátumától januártól decemberig helyett.',
  'help.guide.leave-year.step.1': 'Nyisd meg a Beállításokat, és keresd meg a Szabadságév pontot.',
  'help.guide.leave-year.step.2':
    'Válaszd a Naptári év, az Üzleti év (a kezdő hónappal és nappal) vagy a Belépés dátuma (a belépésed dátumával) lehetőséget.',
  'help.guide.leave-year.result':
    'A keret, a felhasznált napok és az áthozatal ezt az időszakot követik, a rács pedig annak első hónapjával kezdődik.',
  'help.guide.leave-year.tip.1':
    'Ez a beállítás személyes: összevont tervben mindenki megtartja a saját szabadságévét és számait.',
  // carry-over
  'help.guide.carry-over.title': 'Fel nem használt napok áthozása',
  'help.guide.carry-over.goal': 'Add hozzá az időszak végén maradt napokat a következőhöz.',
  'help.guide.carry-over.step.1': 'Nyisd meg a Beállításokat.',
  'help.guide.carry-over.step.2': 'Kapcsold be a Szabadság átvitele kapcsolót.',
  'help.guide.carry-over.result':
    'Az áthozott mennyiség az összes évedre újraszámolódik, és a keret alatt jelenik meg.',
  'help.guide.carry-over.tip.1': 'Kikapcsolása minden áthozott egyenleget nullára állít.',
  // invite
  'help.guide.invite.title': 'Tervezés valakivel közösen',
  'help.guide.invite.goal':
    'Vond össze a tervedet egy másik TREK-felhasználóval, hogy egy rácsban lássátok egymás szabadnapjait.',
  'help.guide.invite.step.1': 'Kattints a személy ikonra a Személyek panelen.',
  'help.guide.invite.step.2': 'Válaszd ki a felhasználót, és küldd el a meghívót.',
  'help.guide.invite.step.3': 'Értesítést kap, és elfogadja. Addig a meghívó függőként jelenik meg.',
  'help.guide.invite.result':
    'A két terv összeolvad: mindenkinek saját színe van, egymásnak is rögzíthettek napokat, és minden élőben szinkronizálódik.',
  'help.guide.invite.tip.1':
    'Az összevonás visszavonásához használd a Beállításokban a Feloldás gombot. Mindenki bejegyzései visszakerülnek a saját tervébe.',
  'help.guide.invite.tip.2':
    'Ha a másik személynek csak látnia kell a napjaidat, oszd meg a naptáradat összevonás helyett.',
  // share-calendar
  'help.guide.share-calendar.title': 'Naptár megosztása csak olvasásra',
  'help.guide.share-calendar.goal':
    'Hadd lássa valaki, mikor vagy szabadságon, anélkül, hogy beleszólhatna a tervedbe.',
  'help.guide.share-calendar.step.1': 'Kattints a megosztás ikonra a Megosztott naptárak panelen.',
  'help.guide.share-calendar.step.2':
    'Válaszd ki a felhasználót, és kattints a Megosztás gombra. Elfogadás nem szükséges.',
  'help.guide.share-calendar.step.3':
    'A veled megosztott naptárak ugyanebben a panelben jelennek meg; a szem elrejt egyet, a Megosztás leállítása visszavonja a tiédet.',
  'help.guide.share-calendar.result':
    'A szabadnapjaid színes gyűrűként jelennek meg az ő rácsában. Semmi, amit megosztasz, nem szerkeszthető onnan.',
  'help.guide.share-calendar.tip.1':
    'A megosztás és az összevonás függetlenek: lehetsz összevonva egy személlyel, és megoszthatod másokkal.',
  'help.guide.share-calendar.tip.2': 'Vidd az egeret egy gyűrűs napra, hogy lásd, ki van szabadságon és meddig.',

  // ── Screen: atlas ─────────────────────────────────────────────────────────────────────
  'help.ctx.atlas.title': 'Atlas',
  'help.ctx.atlas.summary':
    'Az Atlas az utazási lábnyomod egy világtérképen: minden ország, ahová egy utazás elvitt, ki van színezve, a TREK előtti országokat pedig kézzel adod hozzá. Nagyíts a régiókért, vezess bakancslistát a még látni kívánt helyekről, és olvasd le a számaidat az alsó üvegpanelen.',
  'help.ctx.atlas.bullet.1':
    'A térkép: a meglátogatott országok saját, állandó színt viselnek, a tervezett országoknak szaggatott körvonaluk, a bakancslistás országoknak átlós sraffozásuk van, minden más szürke. Vidd az egeret egy ország fölé az utazásaiért, helyeiért, valamint az első és utolsó látogatásért.',
  'help.ctx.atlas.bullet.2':
    'Keresés felül: írj be egy országot vagy helyet. Egy ország kiválasztása odarepíti a térképet és megnyitja a felugró ablakát; egy hely kiválasztása a régiójában landol, hogy azt jelölhesd meg.',
  'help.ctx.atlas.bullet.3':
    'Tervezett országok megjelenítése, jobbra fent: felfedi a közelgő utazásaid országait. A kapcsoló csak addig látszik, amíg van ilyen.',
  'help.ctx.atlas.bullet.4':
    'Panel alul: a Statisztikák fül országokkal, utazásokkal, helyekkel, városokkal, napokkal, kontinensekkel és a sorozatoddal; a Bakancslista fül azzal, ami még előtted áll.',
  'help.ctx.atlas.bullet.5':
    'Régiók: az 5-ös nagyítási szinttől a térkép államokra és tartományokra vált, mindegyik kattintható a megjelöléshez vagy eltávolításhoz.',
  'help.ctx.atlas.bullet.6':
    'Dawarich: a csatlakoztatott bővítménnyel a statisztikától balra egy panel kipipálja a kívánságokat és országokat ad hozzá a felvételeidből, soha nem a megerősítésed nélkül.',
  // mark-country
  'help.guide.mark-country.title': 'Ország megjelölése meglátogatottként',
  'help.guide.mark-country.goal':
    'Adj hozzá egy országot, ahol a TREK előtt jártál, hogy a térkép és a számlálód is tartalmazza.',
  'help.guide.mark-country.step.1': 'Írd be az országot a térkép tetején lévő keresőmezőbe.',
  'help.guide.mark-country.step.2': 'Válaszd ki a listából. A térkép odarepül, és megnyílik az ország felugró ablaka.',
  'help.guide.mark-country.step.3': 'Válaszd a Megjelölés meglátogatottként lehetőséget.',
  'help.guide.mark-country.result':
    'Az ország megkapja a színét a térképen, és az Országok eggyel többet számol. Ez a szín állandó: további országok megjelölése soha nem keveri át a többit.',
  'help.guide.mark-country.tip.1':
    'Egy szürke országra kattintva a térképen ugyanez az ablak nyílik; kis országoknál a keresés a biztos út.',
  'help.guide.mark-country.tip.2':
    'A kézzel megjelölt ország mindig meglátogatottnak számít, bármilyen dátumú is az oda tartó utazás.',
  // unmark-country
  'help.guide.unmark-country.title': 'Megjelölt ország eltávolítása',
  'help.guide.unmark-country.goal': 'Vedd le újra a térképről a kézzel megjelölt országot.',
  'help.guide.unmark-country.step.1':
    'Keresd meg az országot és válaszd ki, vagy kattints rá a térképen. A magad által megjelölt országnál az ablak megkérdezi, eltávolítsa-e.',
  'help.guide.unmark-country.step.2': 'Erősítsd meg az Eltávolítás gombbal.',
  'help.guide.unmark-country.result': 'Az ország újra szürke lesz, és kikerül a számlálódból.',
  'help.guide.unmark-country.tip.1':
    'Így csak a kézzel megjelölt országok távolíthatók el. Az utazásokkal vagy helyekkel rendelkező ország marad, amíg azok megvannak; az Eltávolítás a panel részletkártyáján is ott van, ha kézzel jelölték meg.',
  // country-details
  'help.guide.country-details.title': 'Nézd meg, mit csináltál egy országban',
  'help.guide.country-details.goal': 'Nyiss meg egy meglátogatott országot, és ugorj az odavezető utazásokhoz.',
  'help.guide.country-details.step.1': 'Keress egy országot, amelyet meglátogattál.',
  'help.guide.country-details.step.2':
    'Válaszd ki. A térkép odarepül, és az alsó panel kap egy kártyát zászlóval, helyekkel, utazásokkal és utazásonként egy címkével.',
  'help.guide.country-details.result': 'Kattints egy utazáscímkére, hogy megnyisd az utazást a tervezőben.',
  'help.guide.country-details.tip.1':
    'Ha a térképen az ország fölé viszed az egeret, ugyanezeket a számokat látod, plusz az első és utolsó látogatást.',
  // planned-countries
  'help.guide.planned-countries.title': 'Mutasd az országokat, ahová mész',
  'help.guide.planned-countries.goal':
    'Hozd fel a térképre a közelgő utazásaid országait anélkül, hogy meglátogatottnak számítanának.',
  'help.guide.planned-countries.step.1':
    'Kapcsold be a Tervezett országok megjelenítése kapcsolót jobbra fent. A mellette lévő szám mondja, hány vár.',
  'help.guide.planned-countries.step.2':
    'Keress egy tervezett országot és válaszd ki: a panel Tervezett-et mond, a térkép eszköztippje pedig mutatja, mikor mész.',
  'help.guide.planned-countries.result':
    'A tervezett országok szaggatott körvonallal jelennek meg, így soha nem néznek ki olyan helynek, ahol már jártál. A kapcsoló megjegyzi a választásodat.',
  'help.guide.planned-countries.tip.1':
    'Egy ország akkor számít meglátogatottnak, ha az oda tartó utazás elkezdődött; a folyamatban lévő utazás is számít. A dátum nélküli utazások teljesen kimaradnak a statisztikából.',
  'help.guide.planned-countries.tip.2': 'A kapcsoló csak addig létezik, amíg vannak közelgő utazásaid.',
  // regions
  'help.guide.regions.title': 'Régió megjelölése',
  'help.guide.regions.goal':
    'Finomabban, mint az országok: jelöld meg az államokat, tartományokat vagy prefektúrákat, ahol jártál.',
  'help.guide.regions.step.1':
    'Nagyíts rá egy országra, amíg megjelennek a régiói, az 5-ös nagyítási szinttől. Az ország keresése és kiválasztása elég közel visz.',
  'help.guide.regions.step.2':
    'Kattints egy régióra. Az egér fölé vitele megnevezi; az ablak a régiót és az országát mutatja.',
  'help.guide.regions.step.3': 'Válaszd a Megjelölés meglátogatottként lehetőséget.',
  'help.guide.regions.result':
    'A régió megtelik az ország színével. Egy régió megjelölése az országot is meglátogatottnak számítja, ha még nem volt az.',
  'help.guide.regions.tip.1':
    'Egy meglátogatott régióra kattintva az Eltávolítás jelenik meg, akár te jelölted meg, akár egy hely tette oda.',
  'help.guide.regions.tip.2': 'A régiók, ahol valódi helyeid vannak, maguktól megjelölődnek; ott nincs teendő.',
  // search-place
  'help.guide.search-place.title': 'Hely keresése és a régiójának megjelölése',
  'help.guide.search-place.goal':
    'Jelöld meg Bajorországot Münchenre keresve, anélkül hogy tudnád, melyik régióban van egy város.',
  'help.guide.search-place.step.1':
    'Írj a keresőmezőbe egy várost, nevezetességet vagy címet. Előbb az országok jönnek; az egyező helyek alattuk, a Helyek cím alatt jelennek meg.',
  'help.guide.search-place.step.2': 'Válaszd ki a helyet. A térkép odarepül, és kideríti, melyik régióban van a pont.',
  'help.guide.search-place.step.3':
    'Válaszd a Megjelölés meglátogatottként lehetőséget ahhoz a régióhoz, vagy a Hozzáadás a bakancslistához lehetőséget, ha még előtted áll.',
  'help.guide.search-place.result':
    'A régió megjelölve, és vele az ország is. A térképcsomagban régióadat nélküli országok magára az országra esnek vissza.',
  'help.guide.search-place.tip.1':
    'A helyek ugyanabból a keresésből jönnek, mint mindenhol a TREK-ben, így az admin által beállított szolgáltatót követik.',
  // bucket-country
  'help.guide.bucket-country.title': 'Ország felvétele a bakancslistára',
  'help.guide.bucket-country.goal':
    'Vezess bakancslistát országokról közvetlenül a térképen, elkülönítve azoktól, ahol jártál.',
  'help.guide.bucket-country.step.1': 'Keresd meg az országot és válaszd ki, vagy kattints rá a térképen.',
  'help.guide.bucket-country.step.2': 'Válaszd a Hozzáadás a bakancslistához lehetőséget.',
  'help.guide.bucket-country.step.3':
    'Válassz hónapot és évet, ha már tudod, mikor, majd erősítsd meg a Hozzáadás a bakancslistához gombbal.',
  'help.guide.bucket-country.result':
    'Az ország átlós sraffozással rajzolódik ki abban a színben, amelyet akkor kap, ha odaérsz, és megjelenik a panel Bakancslista fülén.',
  'help.guide.bucket-country.tip.1':
    'Ugyanez az ablak az Eltávolítás a bakancslistáról lehetőséget kínálja, ha az ország már a listán van.',
  'help.guide.bucket-country.tip.2':
    'Céldátumonként egy bejegyzés: ugyanaz az ország két különböző hónapra rajta lehet a listán, de ugyanarra kétszer nem.',
  // bucket-place
  'help.guide.bucket-place.title': 'Hely hozzáadása a bakancslistához',
  'help.guide.bucket-place.goal':
    'Ments el egy várost, látnivalót vagy címet, amelyről álmodsz, koordinátákkal és céldátummal.',
  'help.guide.bucket-place.step.1': 'Nyisd meg a Bakancslista fület az alsó panelen.',
  'help.guide.bucket-place.step.2': 'Kattints a Hely hozzáadása gombra.',
  'help.guide.bucket-place.step.3':
    'Írd be a nevet és nyomd meg a keresőgombot; válaszd ki a találatot, hogy a helynek koordinátái legyenek. Csak egy nevet beírni és a keresést kihagyni is működik.',
  'help.guide.bucket-place.step.4': 'Válassz hónapot és évet, ha szeretnél, és kattints a Hozzáadás gombra.',
  'help.guide.bucket-place.result':
    'A hely a bakancslistád tetején áll a céldátumával; a mellette lévő × újra eltávolítja.',
  'help.guide.bucket-place.tip.1':
    'A koordinátákkal rendelkező kívánság az, amit a Dawarich később kipipálhat helyetted, ha a felvételeid mutatják, hogy ott jártál.',
  // stats
  'help.guide.stats.title': 'A statisztikád olvasása',
  'help.guide.stats.goal': 'Tudd, mit számolnak a panel számai, és mit nem.',
  'help.guide.stats.step.1':
    'Az Országok azoknak a különböző országoknak a száma, ahol tényleg jártál; a tervezettek mellette jelennek meg, nem benne. Az Utazások, Helyek és Napok az összes utazásod összegei. A Városok a helyeid címeiből származik, tehát becslés.',
  'help.guide.stats.step.2':
    'A kontinensek a meglátogatott országokat mutatják kontinensenként; az Antarktisz akkor kerül a sorba, ha már jártál ott. Aztán a sorozatod, egymást követő évek legalább egy utazással, és hogy idén hány utazást tettél.',
  'help.guide.stats.result': 'A számok követik az utazásaidat, ahogy tervezed őket; itt nincs mit karbantartani.',
  'help.guide.stats.tip.1':
    'A városokat a cím szövegéből olvassa ki, nem keresi meg, így egy rövid cím, mint az „Osteria Francescana, Italy”, vagy egy prefektúrával végződő cím régiót adhat város helyett.',
  'help.guide.stats.tip.2':
    'A kézzel megjelölt országok számítanak az Országokban és a kontinenseknél, de nem hoznak utazást, helyet vagy napot.',
  // dawarich-countries
  'help.guide.dawarich-countries.title': 'Országok hozzáadása a felvételeidből',
  'help.guide.dawarich-countries.goal':
    'Hagyd, hogy a Dawarich megmondja, mely országokban jártál az elmúlt évben, és tedd a térképre azokat, amiket megerősítesz.',
  'help.guide.dawarich-countries.step.1':
    'A csatlakoztatott Dawarich bővítménnyel a térkép alján, a statisztikától balra egy Dawarich panel ül két csempével. Kattints az Országok csempére.',
  'help.guide.dawarich-countries.step.2':
    'A párbeszédablak az Országok fülön nyílik meg. Kattints az Országok keresése gombra: a TREK kiolvassa, mely országokat és városokat fednek le a felvételeid az elmúlt 12 hónapban, havonta egyet, úgyhogy adj neki egy pillanatot. Minden ország, ami még nincs az Atlasodban, a zászlajával, a városai számával és az első város nevével szerepel, és kipipálva indul; kattints egy sorra, hogy kihagyd.',
  'help.guide.dawarich-countries.step.3':
    'Erősítsd meg a jobb alsó gombbal, amin 5 ország hozzáadása áll, ha öt sor van kipipálva. A párbeszédablak megmondja, hány került be; zárd be, és a térkép már újraolvasta magát.',
  'help.guide.dawarich-countries.result':
    'A megerősített országok színt viselnek a térképen és beleszámítanak az Országok számába, a Dawarich forrásaként rögzítve. Amit kézzel jelöltél, érintetlen marad.',
  'help.guide.dawarich-countries.tip.1':
    'Azok az országok, amelyeket az Atlas már meglátogatottként mutat, kézzel, egy utazásból vagy egy korábbi ellenőrzésből, kimaradnak, így a saját jelöléseid soha nem kapnak új címkét. Egy ország, amit korábban eltávolítottál az Atlasból, visszajön, ha itt megerősíted.',
  'help.guide.dawarich-countries.tip.2':
    'Egy országnevet, amit a TREK nem tud párosítani, nem dob el, hanem a sorok alatt sorolja fel, és az Ellenőrzés újra még egyszer megkérdezi a Dawarichot. A lista alatti megjegyzés azt mondja, hogy az elmúlt 12 hónapot néztük át; ez az ablak rögzített.',
  // dawarich-wishes
  'help.guide.dawarich-wishes.title': 'Kívánságok kipipálása a felvételeidből',
  'help.guide.dawarich-wishes.goal':
    'Tudd meg, a bakancslistád mely helyeit érted el valóban, és pipáld ki őket azon a napon, amikor megtörtént.',
  'help.guide.dawarich-wishes.step.1':
    'A térkép alján, a statisztikától balra lévő Dawarich panelen kattints a Kívánságlista csempére.',
  'help.guide.dawarich-wishes.step.2':
    'A párbeszédablak a Kívánságlista fülön nyílik meg. Kattints a Kívánságlista ellenőrzése gombra: a TREK átnézi a felvételeidet minden bejegyzéshez, aminek van koordinátája. Egy elért kívánság azzal szerepel, milyen közel jutottál, mennyi ideig maradtál és melyik napon, és kipipálva indul; amit már kipipáltál, azon Már kipipálva áll. A lista alatt egy megjegyzés számolja a koordináta nélküli bejegyzéseket, és ott áll a szabály is: Egy kívánság 250 méteren belül és 20 perc helyszíni idő után számít teljesítettnek.',
  'help.guide.dawarich-wishes.step.3':
    'Erősítsd meg a jobb alsó gombbal, amin 2 kipipálása áll, ha két sor van kipipálva. Aztán zárd be a párbeszédablakot, és nyisd meg a mellette lévő panel Bakancslista fülét.',
  'help.guide.dawarich-wishes.result':
    'Minden kívánság zöld pipát visel az ott-tartózkodás dátumával, nem a maival; a buboréksúgója azt mondja: A Dawarich-rögzítéseid alapján kipipálva, és egy kattintás a dátumra visszavonja.',
  'help.guide.dawarich-wishes.tip.1':
    'Az elhaladás nem számít: a szabályhoz közelség és idő is kell, és több megfelelő tartózkodás közül a leghosszabb nyer. Egy koordináta nélküli kívánság nem ellenőrizhető, ezért a helyeket a Hely hozzáadása keresőjén át add hozzá, ne csak név szerint.',
  'help.guide.dawarich-wishes.tip.2':
    'Egy ellenőrzés legfeljebb 50 bejegyzést néz meg, először a még ki nem pipáltakat, és szól, ha több volt. Egy már kipipált kívánság megtartja a saját dátumát.',

  // ── Screen: collections ───────────────────────────────────────────────────────────────
  'help.ctx.collections.title': 'Gyűjtemények',
  'help.ctx.collections.summary':
    'A Collections a helyek könyvtára bármely utazáson kívül: megtalált és megtartani kívánt helyek nevesített listái, minden hely Ötlet, Szeretnék odamenni vagy Meglátogatva állapottal. A helyek az utazásokba és onnan kifelé másolódnak, sosem kapcsolódnak, így egy lista és egy utazás sosem változtatja meg egymást.',
  'help.ctx.collections.bullet.1':
    'Listasáv a bal oldalon: a saját listáid, a veled megosztottak, az igenre váró meghívók, az Összes mentett mint minden általad birtokolt lista egyesítése, és felül az Új lista meg a fájlimport.',
  'help.ctx.collections.bullet.2':
    'A megnyitott lista fejléce: a színe, borítója, leírása és hivatkozásai, a tagok, valamint jobbra a Szerkesztés, Exportálás és Megosztás műveletek.',
  'help.ctx.collections.bullet.3':
    'Szűrősor a helyek fölött: állapot, kategória, értékelés és rendezés, a címkeszűrő, a + a hely hozzáadásához, az utazásimport és a Jelölés a tömeges műveletekhez.',
  'help.ctx.collections.bullet.4':
    'Helysorok: avatar, név és cím, címkék és kategória, jobbra pedig az állapotjelző, amely egy kattintással vált.',
  'help.ctx.collections.bullet.5':
    'Térkép jobbra: egy tű minden koordinátával rendelkező helyhez, a lista vagy térkép váltó, a keresőmező és a címkeszűrő. Egy tűre kattintva az a hely nyílik meg.',
  'help.ctx.collections.bullet.6':
    'Részletpanel: kattints egy sorra a borítóért, kategóriáért, címkékért, állapotért, leírásért és hivatkozásokért, a Szerkesztés, a Másolás utazásba és az Eltávolítás a listából műveletekkel.',
  // create-list
  'help.guide.create-list.title': 'Lista létrehozása',
  'help.guide.create-list.goal': 'Indíts egy új, nevesített listát színnel és borítóval, készen a helyekre.',
  'help.guide.create-list.step.1': 'Kattints az Új lista gombra a listasáv tetején.',
  'help.guide.create-list.step.2':
    'Adj nevet a listának, és válassz színt. A borítókép, a leírás és a hivatkozások opcionálisak; később a Szerkesztés révén hozzáadhatod őket.',
  'help.guide.create-list.step.3': 'Kattints a Létrehozás gombra.',
  'help.guide.create-list.result':
    'A lista üresen nyílik meg, a Hely hozzáadása és az Importálás egy utazásból a két módja a feltöltésének.',
  'help.guide.create-list.tip.1':
    'A borító lehet saját feltöltés vagy az ugyanabban a párbeszédablakban lévő Unsplash-kereséssel talált kép.',
  // add-place
  'help.guide.add-place.title': 'Hely hozzáadása',
  'help.guide.add-place.goal':
    'Keress egy helyet, és mentsd a megnyitott listába névvel, kategóriával, állapottal és jegyzetekkel egy menetben.',
  'help.guide.add-place.step.1': 'Kattints a + jelre a helyek fölötti szűrősorban.',
  'help.guide.add-place.step.2':
    'Írd be a helyet a keresőmezőbe, és válassz egy találatot. A név, a cím és a koordináták abból töltődnek ki.',
  'help.guide.add-place.step.3':
    'Állítsd be az állapotot és, ha szeretnéd, egy kategóriát, leírást és hivatkozásokat, majd kattints a Hozzáadás gombra. A párbeszédablak nyitva marad a következő helyhez; a Mégse bezárja.',
  'help.guide.add-place.result': 'A hely megjelenik a listában, és ha vannak koordinátái, tűként a térképen is.',
  'help.guide.add-place.tip.1':
    'Egy utazáson belül a helyvizsgálóban vagy a hely menüjében lévő Mentés gyűjteménybe egy utazásbeli helyet tesz listára az utazás elhagyása nélkül.',
  'help.guide.add-place.tip.2':
    'A listának a tiédnek kell lennie, vagy olyannak, ahol szerkesztő vagy adminisztrátor vagy; a + nincs ott az Összes mentett nézetben, sem egy csak megtekintett listán.',
  // import-from-trip
  'help.guide.import-from-trip.title': 'Helyek importálása egy utazásból',
  'help.guide.import-from-trip.goal':
    'Hozd át egy egész utazás helyeit egyszerre egy listára, ahelyett hogy egyenként mentenéd őket.',
  'help.guide.import-from-trip.step.1':
    'Kattints a felhő nyilas importgombra a szűrősorban. Üres listán ugyanez a művelet a Hely hozzáadása mellett ül.',
  'help.guide.import-from-trip.step.2': 'Válaszd ki az egyik utazásodat.',
  'help.guide.import-from-trip.step.3':
    'Pipáld ki a kívánt helyeket. A már listán lévő helyek szürkék; azok, amelyeket az utazás egyetlen napja sem tartalmaz, eleve kijelölve indulnak. A Csak az újak elrejti, amid már megvan.',
  'help.guide.import-from-trip.step.4':
    'Kattints az Importálás gombra. A gomb mindig megmondja, hány hely kerül mindjárt hozzáadásra.',
  'help.guide.import-from-trip.result':
    'A helyek nevükkel, címükkel, koordinátáikkal, leírásukkal és kategóriájukkal másolódnak a listára. Az utazás marad, ahogy volt.',
  'help.guide.import-from-trip.tip.1':
    'A név vagy koordináták szerinti duplikátumok automatikusan kimaradnak, így a kétszeri importálás nem árt.',
  'help.guide.import-from-trip.tip.2':
    'Egy utazás helylistáján belül a kijelölő mód ehelyett a Mentés gyűjteménybe lehetőséget kínálja egy kézzel válogatott helykészlethez.',
  // place-status
  'help.guide.place-status.title': 'Hely állapotának beállítása',
  'help.guide.place-status.goal': 'Tartsd számon, mi ötlet, mi van a rövid listán, és hol jártál már.',
  'help.guide.place-status.step.1':
    'Kattints az állapotjelzőre a helysor jobb végén. Az Ötlet Szeretnék odamenni lesz.',
  'help.guide.place-status.step.2':
    'Kattints rá újra a Meglátogatva állapothoz, és még egyszer, hogy az Ötlet állapotnál kezdd újra.',
  'help.guide.place-status.result':
    'A jelző és a színe azonnal változik; a lista fölötti állapotszűrő vele együtt számol.',
  'help.guide.place-status.tip.1': 'Az állapot Collections-dolog: egy hely utazásba másolása nem viszi magával.',
  'help.guide.place-status.tip.2':
    'Egy utazásból a Mentés listába minden listához mutat egy állapotjelzőt, amelyen a hely rajta van, a helyek panelen pedig van egy Megjelölés látogatottként művelet a kijelöléshez.',
  // place-detail
  'help.guide.place-detail.title': 'Mentett hely megnyitása',
  'help.guide.place-detail.goal': 'Láss mindent egy helyről, és cselekedj: szerkeszd, másold utazásba, távolítsd el.',
  'help.guide.place-detail.step.1':
    'Kattints egy helysorra. A részletpanel a lista mellett nyílik meg, és a térkép a helyhez gördül.',
  'help.guide.place-detail.step.2':
    'Alul ül a Szerkesztés, a Másolás utazásba és az Eltávolítás a listából; a borítón lévő kamera az automatikus fotót sajátra cseréli.',
  'help.guide.place-detail.result':
    'A Szerkesztés feloldja a nevet, kategóriát, címkéket, címet, koordinátákat, leírást és hivatkozásokat közvetlenül a panelen.',
  'help.guide.place-detail.tip.1':
    'A borító automatikusan töltődik le, ha a helynek nincs saját képe. A saját feltöltés JPG, PNG, GIF vagy WebP lehet, legfeljebb 20 MB.',
  'help.guide.place-detail.tip.2':
    'Egy megosztott lista tagjai csillagos értékelést is hagyhatnak itt, és a szűrősor értékelésszűrője az átlagot használja.',
  // labels
  'help.guide.labels.title': 'Helyek csoportosítása címkékkel',
  'help.guide.labels.goal':
    'Adj egy listának saját címkéket, például kerületeket vagy napokat, a közös kategóriákon túl.',
  'help.guide.labels.step.1': 'Nyisd meg a címkekezelőt a szűrősor címkevezérlőjéből.',
  'help.guide.labels.step.2':
    'Írj be egy nevet, válassz színt, és kattints a Címke hozzáadása gombra. A meglévő címkéket ugyanebben a párbeszédablakban nevezheted át, színezheted át vagy törölheted.',
  'help.guide.labels.step.3':
    'Kapcsold be a Jelölés funkciót, pipáld ki a helyeket, és kattints a Címke hozzárendelése gombra a kijelölési sávban. Egyetlen hely a részletpaneljén lévő Szerkesztés révén is kap címkéket.',
  'help.guide.labels.step.4':
    'Válassz egy vagy több címkét a szűrősorban, hogy a listát és a térképet a bármelyiket viselő helyekre szűkítsd.',
  'help.guide.labels.result':
    'A címkézett helyek a soron mutatják címkéiket; a címkeszűrő minden tagnak ott van, a nézőknek is.',
  'help.guide.labels.tip.1':
    'A címkék ahhoz az egy listához tartoznak, amelyben létrehozták őket. Egy hely másik listába helyezése elejti őket.',
  'help.guide.labels.tip.2': 'A címkék kezeléséhez és hozzárendeléséhez szerkesztési jog kell a listán.',
  // filter-select
  'help.guide.filter-select.title': 'Helyek szűrése és kijelölése',
  'help.guide.filter-select.goal': 'Szűkítsd le a listát, és cselekedj sok helyen egyszerre.',
  'help.guide.filter-select.step.1':
    'Használd a szűrősor legördülő menüit: állapot, kategória, minimális értékelés és rendezési sorrend. Mindegyik megmutatja, hány helyet hagyna meg.',
  'help.guide.filter-select.step.2':
    'Kattints a Jelölés gombra. Minden sor kap egy jelölőnégyzetet, és megjelenik egy kijelölési sáv.',
  'help.guide.filter-select.step.3':
    'Pipáld ki a helyeket, vagy használd az Összes kijelölése funkciót mindenre, ami éppen szűrve van, majd válaszd a Címke hozzárendelése, Áthelyezés listába, Másolás listába, Másolás utazásba vagy Törlés műveletet.',
  'help.guide.filter-select.result':
    'A műveletek egyszerre érvényesülnek az egész kijelölésre. A jobb oldali × kilép a kijelölő módból.',
  'help.guide.filter-select.tip.1':
    'Az Összes kijelölése követi a szűrőt, így a Szeretnék odamenni állapotra szűrni és mindent kijelölni a gyors mód a rövid listán való cselekvésre.',
  // copy-to-trip
  'help.guide.copy-to-trip.title': 'Helyek másolása utazásba',
  'help.guide.copy-to-trip.goal': 'Alakítsd a mentett helyeket megállókká az egyik utazásodon.',
  'help.guide.copy-to-trip.step.1':
    'Kapcsold be a Jelölés funkciót és pipáld ki a helyeket, vagy nyiss meg egy helyet, és használd a Másolás utazásba lehetőséget a részletpaneljén.',
  'help.guide.copy-to-trip.step.2': 'Kattints a Másolás utazásba gombra a kijelölési sávban.',
  'help.guide.copy-to-trip.step.3': 'Válaszd ki az utazást. A keresőmező leszűkíti a hosszú listát.',
  'help.guide.copy-to-trip.result':
    'A helyek annak az utazásnak a helylistájába kerülnek névvel, leírással, kategóriával, jegyzetekkel, árral, koordinátákkal, fotóval és címkékkel. A gyűjteményben semmi sem változik.',
  'help.guide.copy-to-trip.tip.1':
    'Egy megosztott lista nézői is megtehetik ezt; a listából kifelé másol, nem változtatja meg.',
  // share-list
  'help.guide.share-list.title': 'Lista megosztása valakivel',
  'help.guide.share-list.goal': 'Tervezz egy listát más emberekkel együtt ezen a TREK-en, élőben.',
  'help.guide.share-list.step.1': 'Kattints a Megosztás gombra a listád fejlécében.',
  'help.guide.share-list.step.2': 'Válaszd ki a felhasználót és egy szerepet: Néző, Szerkesztő vagy Adminisztrátor.',
  'help.guide.share-list.step.3':
    'Kattints a Meghívó küldése gombra. A személy függőben lévő meghívóként jelenik meg, amíg el nem fogadja a meghívót a listasávjában.',
  'help.guide.share-list.result':
    'Elfogadás után a lista nála a Megosztott alatt jelenik meg, és minden változás élőben szinkronizálódik. A tagok és szerepeik ugyanebben a párbeszédablakban maradnak szerkeszthetők.',
  'help.guide.share-list.tip.1':
    'A nézők nézhetnek, értékelhetnek és helyeket másolhatnak a saját utazásaikba. A szerkesztők helyeket és címkéket adnak hozzá és szerkesztenek. Az adminisztrátorok törölhetnek is.',
  'help.guide.share-list.tip.2':
    'Csak a tulajdonos hív meg és távolít el embereket; egy tag maga is elhagyhat egy megosztott listát.',
  // export-list
  'help.guide.export-list.title': 'Lista exportálása fájlként',
  'help.guide.export-list.goal':
    'Add át egy listát valakinek egy másik TREK-en, vagy vidd át egy térképes alkalmazásba.',
  'help.guide.export-list.step.1': 'Kattints az Exportálás gombra a lista fejlécében.',
  'help.guide.export-list.step.2':
    'Válaszd a TREK-lista lehetőséget egy másik TREK-hez, címkékkel és állapottal, vagy a GPX-et OsmAndhez, Organic Mapshez, egy Garminhoz és más, útpontokat olvasó alkalmazásokhoz.',
  'help.guide.export-list.result': 'A fájl letöltődik. Egy megosztott lista bármely tagja exportálhatja.',
  'help.guide.export-list.tip.1':
    'Koordináták nélküli hely nem lehet GPX-útpont; kimarad, és a TREK megmondja, hány ilyen volt.',
  'help.guide.export-list.tip.2':
    'Az értékelések, a tagok és a feltöltött fotók szándékosan itt maradnak; ehhez a TREK-hez tartoznak, nem a listához.',
  // import-file
  'help.guide.import-file.title': 'Lista importálása fájlból',
  'help.guide.import-file.goal': 'Hozz be egy TREK-listafájlt vagy egy GPX-fájlt új listaként vagy egy meglévődbe.',
  'help.guide.import-file.step.1': 'Kattints a feltöltés nyilas importgombra az Új lista mellett a listasávban.',
  'help.guide.import-file.step.2':
    'Válaszd ki a fájlt. A TREK megmutatja, mi van benne, mielőtt bármi történne: a nevet, hány hely és címke.',
  'help.guide.import-file.step.3':
    'Hagyd meg az Új lista lehetőséget, és ha szeretnéd, változtasd meg a nevet, vagy válaszd a Hozzáadás listához lehetőséget, hogy a helyeket egy általad szerkeszthető listába tedd, majd kattints az Importálás gombra.',
  'help.guide.import-file.result':
    'Az importált helyekkel a listán landolsz. A listához adás mindig csak hozzáad; a már ott lévő helyek megtartják állapotukat, jegyzeteiket és címkéiket.',
  'help.guide.import-file.tip.1':
    'GPX-ből minden nevesített útpont hellyé válik; a nyomvonalak vonalak és kimaradnak, az előnézet pedig megmondja, hány pont volt az.',
  'help.guide.import-file.tip.2':
    'Az olyan fájlt, amely se nem TREK-lista, se nem GPX, indoklással elutasítja; egyetlen olvashatatlan hely kimarad, nem az egész fájl.',
  // edit-list
  'help.guide.edit-list.title': 'Lista szerkesztése vagy törlése',
  'help.guide.edit-list.goal':
    'Változtasd meg egy lista nevét, színét, borítóját, leírását vagy hivatkozásait, vagy távolítsd el a listát.',
  'help.guide.edit-list.step.1': 'Kattints a Szerkesztés gombra a lista fejlécében. Csak a tulajdonos látja.',
  'help.guide.edit-list.step.2':
    'Változtasd meg, amit szeretnél, és kattints a Mentés gombra. A bal alsó Lista törlése egy megerősítés után eltávolítja a listát az összes helyével együtt.',
  'help.guide.edit-list.result': 'A fejléc azonnal átveszi az új színt, borítót és leírást.',
  'help.guide.edit-list.tip.1':
    'Egy lista törlése nem vonható vissza. Exportáld előbb, ha szeretnél megtartani egy másolatot.',
  // all-saved
  'help.guide.all-saved.title': 'Keresés az egész könyvtáradban',
  'help.guide.all-saved.goal': 'Nézz át egyszerre minden listát, amelyet birtokolsz.',
  'help.guide.all-saved.step.1':
    'Kattints az Összes mentett elemre a listasávban. Egyesíti minden általad birtokolt vagy társtulajdonolt lista helyeit.',
  'help.guide.all-saved.step.2':
    'Használd a keresőmezőt és a szűrőket, mint bármely listán; a Jelölés itt is működik, utazásba másoláshoz.',
  'help.guide.all-saved.result':
    'Egyetlen nézet az összes mentett helyedre, hozzáadás vagy importálás nélkül, mivel nincs egyetlen lista, amelyre tehetné őket.',
  'help.guide.all-saved.tip.1':
    'A címkék listánként vannak, ezért a címkeszűrő nem elérhető az Összes mentett nézetben.',

  // ── Screen: journey ───────────────────────────────────────────────────────────────────
  'help.ctx.journey.title': 'Útinaplók',
  'help.ctx.journey.summary':
    'Az útinapló a fotóközpontú utazási naplód. Minden útinapló egy vagy több utazáshoz kötődik, és napról napra nő a történetet, fotókat, hangulatot és időjárást tartalmazó bejegyzésekből. Ez a képernyő az útinaplóidat sorolja fel; nyiss meg egyet az íráshoz.',
  'help.ctx.journey.bullet.1':
    'A felső szalag a folyamatban lévő vagy a legutóbbi útinaplódat mutatja a bejegyzések, fotók és helyek számával. Az Írás folytatása a mai napon nyitja meg.',
  'help.ctx.journey.bullet.2':
    'Alatta útinaplónként egy kártya borítóval, alcímmel, dátumokkal és számokkal. Kattints egy kártyára a megnyitásához.',
  'help.ctx.journey.bullet.3': 'A rács utolsó kártyája, az Új útinapló létrehozása, az utazásaidból indít egyet.',
  // create-journey
  'help.guide.create-journey.title': 'Útinapló létrehozása',
  'help.guide.create-journey.goal': 'Indíts naplót egy utazáshoz úgy, hogy az utazás helyei már javaslatként várnak.',
  'help.guide.create-journey.step.1': 'Kattints az Új útinapló létrehozása kártyára, a rács utolsó kártyájára.',
  'help.guide.create-journey.step.2':
    'Adj neki nevet és, ha szeretnél, alcímet, majd pipáld ki az utazásokat, amelyekhez tartozik. A számláló megmondja, hány hely kerül be.',
  'help.guide.create-journey.step.3': 'Kattints az Útinapló létrehozása gombra.',
  'help.guide.create-journey.result':
    'A napló megnyílik. A kapcsolt utazások minden helye javaslatként ül az idővonalon, minden napra egy, amelyen szerepel, készen arra, hogy beleírj.',
  'help.guide.create-journey.tip.1': 'További utazásokat később az Útinapló beállításai alatt kapcsolhatsz hozzá.',
  'help.guide.create-journey.tip.2': 'Utazás nélküli útinapló is működik; a bejegyzéseket akkor kézzel adod hozzá.',
  // open-journey
  'help.guide.open-journey.title': 'Útinapló megnyitása',
  'help.guide.open-journey.goal': 'Juss be egy naplóba, és tudd, hol nyílik meg.',
  'help.guide.open-journey.step.1':
    'Kattints egy kártyára. Mindegyik mutatja a borítót, a dátumokat, és hogy hány bejegyzést, fotót és helyet tartalmaz az útinapló.',
  'help.guide.open-journey.result':
    'A folyamatban lévő útinapló a mai napon nyílik meg, vagy a mai nap előtti utolsó bejegyzésnél, ha még nincs semmi írva; a befejezett az elején nyílik.',
  'help.guide.open-journey.tip.1':
    'A borító az útinapló első fotója, hacsak nem állítasz be egyet az Útinapló beállításai alatt.',
  // continue-writing
  'help.guide.continue-writing.title': 'A folyamatban lévő útinapló folytatása',
  'help.guide.continue-writing.goal': 'Ugorj egyenesen annak az útinaplónak a mai oldalára, amelyen épp vagy.',
  'help.guide.continue-writing.step.1':
    'Kattints a felső szalagon az Írás folytatása gombra. A szalag a folyamatban lévő útinaplót mutatja, vagy a legutóbbit, ha nincs ilyen.',
  'help.guide.continue-writing.result':
    'A napló a mai napon nyílik meg, vagy a mai nap előtti utolsó bejegyzésnél, ha még nincs semmi írva.',
  'help.guide.continue-writing.tip.1':
    'A szalag javaslatot is tesz egy olyan utazásra, amelynek még nincs útinaplója; az Elvetés elrejti azt.',

  // ── Screen: journey-detail ────────────────────────────────────────────────────────────
  'help.ctx.journey-detail.title': 'Napló',
  'help.ctx.journey-detail.summary':
    'Egy megnyitott útinapló: balra az idővonal napról napra, jobbra a térkép minden bejegyzéssel és a kapcsolt utazások helyeivel. Minden, ami hozzáad a naplóhoz, felül van; a fejléc tartja a számokat, a Studiót, a javaslatkapcsolót és az Útinapló beállításait.',
  'help.ctx.journey-detail.bullet.1':
    'Fejléc: borító, cím és alcím, a napok, helyek, bejegyzések és fotók száma, jobbra pedig a Studio, a javaslatkapcsoló és az Útinapló beállításai.',
  'help.ctx.journey-detail.bullet.2':
    'Eszköztár: az Idővonal és a Galéria fül, a Keresés ebben az útinaplóban és a Bejegyzés hozzáadása.',
  'help.ctx.journey-detail.bullet.3':
    'Idővonal: naponként egy szakasz, benne egy + a bejegyzés hozzáadásához azon a napon; bejegyzéskártyák fotókkal, hangulattal, időjárással és történettel; az utazásokból származó javaslatok világosabb stílusban, Javaslat elvetése gombbal.',
  'help.ctx.journey-detail.bullet.4':
    'Térkép: a bejegyzések tűként, dátum szerint szaggatott vonallal összekötve, az utazások helyei és az azokba az utazásokba importált GPX-nyomvonalak.',
  'help.ctx.journey-detail.bullet.5':
    'Útinapló beállításai: borító, név és alcím, nyomvonalak a térképen, a bejegyzés mezői, elvetett javaslatok, kapcsolt utazások, közreműködők, nyilvános megosztás, archiválás és törlés.',
  'help.ctx.journey-detail.bullet.6':
    'Hosszú idővonal fölött két kerek gomb lebeg: vissza a tetejére, és ugrás az utolsó bejegyzésre.',
  // add-entry
  'help.guide.add-entry.title': 'Bejegyzés írása',
  'help.guide.add-entry.goal': 'Add hozzá egy nap történetét címmel, szöveggel, hangulattal és időjárással.',
  'help.guide.add-entry.step.1':
    'Kattints az eszköztáron a Bejegyzés hozzáadása gombra, vagy egy nap fejlécében a + jelre, hogy azon a napon kezdj.',
  'help.guide.add-entry.step.2':
    'Adj nevet a pillanatnak, és írd meg a történetet. A szöveg fölötti eszköztár félkövért, dőltet, címsorokat, idézeteket, linkeket és listákat ad hozzá Markdownban.',
  'help.guide.add-entry.step.3':
    'Válassz hangulatot és időjárást, ellenőrizd a dátumot, és ha szeretnéd, tűzz ki helyszínt: keress egy helyet, vagy használd a jelenlegi helyzetedet.',
  'help.guide.add-entry.step.4': 'Kattints a Mentés gombra.',
  'help.guide.add-entry.result':
    'A bejegyzés a saját napján jelenik meg az idővonalon és tűként a térképen. A számai frissülnek a fejlécben.',
  'help.guide.add-entry.tip.1': 'Egy javaslatba írni ugyanaz a szerkesztő, csak a hely már be van állítva.',
  'help.guide.add-entry.tip.2':
    'Az alul lévő címkék szabad szövegek, rejtett kincs vagy legjobb étkezés, és a keresés megtalálja őket.',
  // entry-photos
  'help.guide.entry-photos.title': 'Fotók és videók hozzáadása egy bejegyzéshez',
  'help.guide.entry-photos.goal': 'Tegyél képeket egy napra; az első lesz a bejegyzés borítója.',
  'help.guide.entry-photos.step.1':
    'Nyisd meg egy bejegyzés menüjét a kártyáján lévő ⋯ jellel, és válaszd a Szerkesztés lehetőséget.',
  'help.guide.entry-photos.step.2':
    'Kattints a Fotók feltöltése gombra, és válaszd ki a fájlokat. A Galériából az útinapló galériájában már meglévő képeket veszi; az External photos egy csatlakoztatott Immich vagy Synology könyvtárban keres arra a napra.',
  'help.guide.entry-photos.step.3':
    'Vidd az egeret egy kép fölé a Legyen az 1. gombért a borító kiválasztásához, majd kattints a Mentés gombra.',
  'help.guide.entry-photos.result': 'A fotók megjelennek a kártyán és a galériában; az első mindenhol a bélyegkép.',
  'help.guide.entry-photos.tip.1':
    'Videók ugyanígy kerülnek egy bejegyzésre: mp4, m4v, webm vagy mov 500 MB-ig, a feltöltött formában tárolva.',
  'help.guide.entry-photos.tip.2':
    'Az iPhone-ról származó HEIC fájlok feltöltéskor JPEG-gé alakulnak, ami elveszíti a GPS- és kameraadataikat.',
  // suggestions
  'help.guide.suggestions.title': 'A javaslatok használata vagy elvetése',
  'help.guide.suggestions.goal':
    'Alakítsd az utazásaid helyeit bejegyzésekké, és takarítsd el azokat, amelyekről nem fogsz írni.',
  'help.guide.suggestions.step.1':
    'A javaslat egy világosabb kártya, a hely nevével dőlt betűvel. Kattints rá, hogy megnyisd a szerkesztőt már beállított hellyel és nappal.',
  'help.guide.suggestions.step.2':
    'Kattints a Javaslat elvetése gombra egy kártyán, amelyet nem fogsz használni. Törlés nélkül hagyja el az idővonalat, és az utazásszinkron nem ajánlja fel újra.',
  'help.guide.suggestions.step.3':
    'Meggondoltad magad? Az Útinapló beállításai mutatja, hány van elvetve, és az Elvetett javaslatok visszahozása mindet visszahozza.',
  'help.guide.suggestions.result':
    'Az idővonalon csak az marad, amit meg akarsz írni; a fejléc kapcsolója olvasás közben egyszerre rejti el az összes javaslatot.',
  'help.guide.suggestions.tip.1': 'Egy két napon át tartó hely mindkettőn ad egy javaslatot.',
  'help.guide.suggestions.tip.2': 'A javaslatok sosem számítanak a statisztikába; csak a megírt bejegyzések.',
  // add-on-day
  'help.guide.add-on-day.title': 'Bejegyzés hozzáadása egy korábbi naphoz',
  'help.guide.add-on-day.goal': 'Írj egy már elmúlt napról anélkül, hogy utólag javítanod kellene a dátumot.',
  'help.guide.add-on-day.step.1': 'Kattints annak a napnak a fejlécében a + jelre.',
  'help.guide.add-on-day.step.2': 'A szerkesztő azzal a dátummal nyílik meg. Írj, és Mentés, mint máskor.',
  'help.guide.add-on-day.result': 'A bejegyzés azonnal a megfelelő napra kerül.',
  'help.guide.add-on-day.tip.1': 'Egy napon belül a bejegyzés menüjének nyilai korábbra vagy későbbre mozgatják.',
  // pros-cons
  'help.guide.pros-cons.title': 'Értékelés hozzáadása',
  'help.guide.pros-cons.goal': 'Foglald össze a napot azzal, ami remek volt, és ami nem.',
  'help.guide.pros-cons.step.1':
    'A szerkesztőben keresd meg az Előnyök és hátrányok részt a történet alatt. Írj egy pontot az Előnyök vagy a Hátrányok mezőbe, és használd a Még egy hozzáadása gombot a következőhöz.',
  'help.guide.pros-cons.step.2': 'Mentés. Az értékelés két rövid listaként jelenik meg a kártyán.',
  'help.guide.pros-cons.result': 'Hüvelykujj fel és hüvelykujj le egy pillantásra, a történet alatt.',
  'help.guide.pros-cons.tip.1':
    'Az az útinapló, amelyik nem használ értékelést, az Útinapló beállításai alatt A bejegyzés mezői résznél kapcsolhatja ki a szakaszt.',
  // search-journey
  'help.guide.search-journey.title': 'Keresés egy hosszú naplóban',
  'help.guide.search-journey.goal': 'Juss el a keresett bejegyzéshez anélkül, hogy heteken át görgetnél.',
  'help.guide.search-journey.step.1':
    'Írj az eszköztár Keresés ebben az útinaplóban mezőjébe. Az idővonal gépelés közben szűr címek, történetek, helyek és címkék szerint. Az ékezetek és a kis- és nagybetűk nem számítanak.',
  'help.guide.search-journey.step.2':
    'A fejléc javaslatkapcsolója olvasás közben elrejti a meg nem írt kártyákat. Ha az idővonal hosszú, két kerek gomb lebeg az alsó széle fölött: vissza a tetejére, és ugrás az utolsó bejegyzésre.',
  'help.guide.search-journey.result': 'Csak az egyező bejegyzések maradnak; töröld a mezőt, hogy újra mindent láss.',
  'help.guide.search-journey.tip.1':
    'A folyamatban lévő útinapló a mai napon nyílik meg, így az aktuális oldal általában már látható.',
  'help.guide.search-journey.tip.2':
    'A címkék is számítanak: a rejtett kincs keresése minden ezzel címkézett bejegyzést megtalál.',
  // gallery-map
  'help.guide.gallery-map.title': 'A galéria és a térkép böngészése',
  'help.guide.gallery-map.goal': 'Lásd az egész útinaplót képekként és helyekként a térképen.',
  'help.guide.gallery-map.step.1':
    'Válts az eszköztáron a Galéria fülre: minden bejegyzés minden fotója, plusz a közvetlenül a galériába feltöltött képek. Kattints egyre a lightboxért.',
  'help.guide.gallery-map.step.2':
    'A jobb oldali térkép a bejegyzéseket tűként mutatja dátum szerint, a kapcsolt utazások helyeit és az azokba az utazásokba importált GPX-nyomvonalakat abban a színben, amely a tervezőben van.',
  'help.guide.gallery-map.result':
    'Vidd az egeret egy nyomvonal fölé a nevéért. A bejegyzések közti szaggatott vonalat a TREK rajzolja; a nyomvonal az az útvonal, amelyet valóban rögzítettél.',
  'help.guide.gallery-map.tip.1': 'A nyomvonalak egy útinaplóhoz az Útinapló beállításai alatt kapcsolhatók ki.',
  'help.guide.gallery-map.tip.2':
    'A helyszínnel rendelkező galériafotók a nyilvános térképen is megjelennek, ha a Galéria és a Térkép is meg van osztva.',
  // entry-fields
  'help.guide.entry-fields.title': 'A bejegyzés mezőinek kikapcsolása',
  'help.guide.entry-fields.goal': 'Tartsd a szerkesztőt annál, amit ez az útinapló használ.',
  'help.guide.entry-fields.step.1': 'Nyisd meg az Útinapló beállításait a fejlécből.',
  'help.guide.entry-fields.step.2':
    'A bejegyzés mezői alatt kapcsold ki a Hangulat, az Időjárás vagy az Előnyök és hátrányok kapcsolót.',
  'help.guide.entry-fields.result':
    'A szerkesztő nem kérdez rájuk többé. Semmi megírt nem vész el: egy mező visszakapcsolása előhozza a tárolt értékeket, a megosztott napló pedig ugyanezeket a mezőket rejti el.',
  'help.guide.entry-fields.tip.1': 'A kapcsolók útinaplónként érvényesek, így egy munkaút és egy nyaralás eltérhet.',
  // link-trip
  'help.guide.link-trip.title': 'Másik utazás hozzákapcsolása',
  'help.guide.link-trip.goal': 'Hozd be egy második utazás helyeit javaslatként a naplóba.',
  'help.guide.link-trip.step.1': 'Nyisd meg az Útinapló beállításait a fejlécből.',
  'help.guide.link-trip.step.2': 'A kapcsolt utazások alatt kattints az Út hozzáadása gombra.',
  'help.guide.link-trip.step.3': 'Válaszd ki az utazást.',
  'help.guide.link-trip.result':
    'A helyei javaslatként érkeznek az idővonalra a saját napjaikon, a GPX-nyomvonalai pedig felkerülnek a térképre.',
  'help.guide.link-trip.tip.1': 'A kapcsolt utazás melletti × újra leválasztja; a megírt bejegyzéseid maradnak.',
  'help.guide.link-trip.tip.2': 'A napos bejegyzések csak egyszer számítanak, akárhány utazás fedi is azt a napot.',
  // share-public
  'help.guide.share-public.title': 'Az útinapló nyilvános megosztása',
  'help.guide.share-public.goal': 'Adj TREK-fiók nélküli embereknek egy csak olvasható linket.',
  'help.guide.share-public.step.1': 'Nyisd meg az Útinapló beállításait, és keresd meg a Nyilvános megosztás részt.',
  'help.guide.share-public.step.2': 'Kattints a Megosztó link létrehozása gombra.',
  'help.guide.share-public.step.3':
    'Válaszd ki, mit látnak a látogatók: az Idővonal, a Galéria és a Térkép külön kapcsolók. A Másolás a vágólapra teszi a linket.',
  'help.guide.share-public.result':
    'Bárki a linkkel a bekapcsolt szakaszokat látja, és semmi mást; A bejegyzés mezői alatt kikapcsolt mezők ott is rejtve maradnak.',
  'help.guide.share-public.tip.1':
    'A fotók csak akkor jelennek meg a nyilvános térképen, ha a Galéria és a Térkép is be van kapcsolva; kikapcsolt Térkép mellett a koordinátáik eltávolításra kerülnek, mielőtt elhagynák a szervert.',
  'help.guide.share-public.tip.2': 'Ugyanott töröld a linket a megosztás befejezéséhez.',
  // contributors
  'help.guide.contributors.title': 'Írás közösen',
  'help.guide.contributors.goal': 'Engedd, hogy egy útitárs saját bejegyzéseket és fotókat adjon hozzá.',
  'help.guide.contributors.step.1': 'Nyisd meg az Útinapló beállításait, és görgess a közreműködőkhöz.',
  'help.guide.contributors.step.2':
    'Kattints a Közreműködő meghívása gombra, és keresd meg a felhasználót név vagy e-mail alapján.',
  'help.guide.contributors.step.3': 'Válassz szerepet, és erősítsd meg.',
  'help.guide.contributors.result':
    'Az útinapló megjelenik a listájukban, és a bejegyzéseik az ő nevüket viselik. Egy közreműködőt a mellette lévő × jellel távolíthatsz el.',
  'help.guide.contributors.tip.1':
    'A közreműködők az ezen a TREK-en lévő embereknek valók. Mindenki másnak ott a nyilvános link.',
  // studio
  'help.guide.studio.title': 'Az útinapló kirakása fotókönyvként',
  'help.guide.studio.goal': 'Alakítsd a naplót nyomtatható oldalakká.',
  'help.guide.studio.step.1': 'Kattints a fejlécben a Studio gombra. A tervező az útinapló fölött nyílik meg.',
  'help.guide.studio.step.2': 'A felső sáv bal oldalán az útinapló neve a visszaút; oda tesz le, ahol voltál.',
  'help.guide.studio.result':
    'Balra az oldalsáv, a munkapadon az oldalpár, jobbra a tulajdonságok. Az Auto layout a bejegyzéseidből építi fel a könyvet; az Export nyomdakész PDF-et készít.',
  'help.guide.studio.tip.1': 'A Studio legalább 1024 px széles ablakot igényel, és telefonon nem elérhető.',
  'help.guide.studio.tip.2':
    'A könyv örökli az útinapló hozzáférését: aki olvashatja az útinaplót, megnyithatja, aki szerkesztheti, menthet.',
  // archive-journey
  'help.guide.archive-journey.title': 'Útinapló archiválása vagy törlése',
  'help.guide.archive-journey.goal': 'Zárj le egy befejezett útinaplót, vagy távolíts el egyet végleg.',
  'help.guide.archive-journey.step.1': 'Nyisd meg az Útinapló beállításait.',
  'help.guide.archive-journey.step.2':
    'Alul az Út archiválása befejezi és archiváltként jelöli meg; az Út visszaállítása visszahozza. A Törlés megerősítés után az összes bejegyzéssel és fotóval együtt eltávolítja.',
  'help.guide.archive-journey.result':
    'Az archivált útinapló olvasható és megosztható marad; csak már nem a mai napon nyílik meg.',
  'help.guide.archive-journey.tip.1':
    'A törlés nem vonható vissza, és nem érinti azokat az utazásokat, amelyekhez az útinapló kapcsolva volt.',
  'help.guide.archive-journey.tip.2': 'A borító, a név és az alcím ugyanabban a párbeszédablakban van, felül.',

  // ── Screen: journey-studio ────────────────────────────────────────────────────────────
  'help.ctx.journey-studio.title': 'Studio',
  'help.ctx.journey-studio.summary':
    'A TREK Studio egy útinaplót nyomtatható fotókönyvvé rendez. A napló fölött nyílik meg: balra az oldalsáv és a tartalom, középen az oldalpár, amelyen dolgozol, jobbra a tulajdonságai. Az Auto layout a bejegyzéseidből építi az első vázlatot; minden, ami utána jön, a tiéd: mozgathatod, vághatod és átstílusozhatod, minden lépéshez visszavonással.',
  'help.ctx.journey-studio.bullet.1':
    'Felső sáv: Back to the journey, Book view, Undo és Redo, Page format, Auto layout és Export. A cím melletti Mentve jelzés mondja meg, mikor van elmentve a könyv.',
  'help.ctx.journey-studio.bullet.2':
    'Bal oldali sáv öt szakasszal: Pages, Content (az útinapló fotói és bejegyzései), Elements (szöveg, alakzatok, vonalak, rácsok, keretek, ikonok), Utazás (az útinaplóból épített térképek, országok, zászlók és jelek) és Layouts.',
  'help.ctx.journey-studio.bullet.3':
    'Munkaterület: az aktuális oldalpár a kifutóval és a védőmargókkal, alatta a nagyítósáv, a Fit to view és jobbra az Oldalpár letöltése.',
  'help.ctx.journey-studio.bullet.4':
    'Properties jobbra: a kijelölt elem pozíciója és mérete, vágása és fókuszpontja, kitöltés vagy illesztés, megjelenés, sarkok, keret, rétegsorrend és zár; oldalszámok és a dokumentum, ha semmi sincs kijelölve.',
  'help.ctx.journey-studio.bullet.5':
    'A könyv egy kötött könyv alakját követi: borító, egy önálló első oldal, az oldalpárok, egy önálló utolsó oldal és a hátsó borító. Az oldalszámok az első oldaltól számolnak, és úgy nyomtatódnak, ahogy látod őket.',
  'help.ctx.journey-studio.bullet.6':
    'Többen tervezhettek egyszerre: mindenki látja a többiek mutatóját a nevükkel, és egy olyan verzió mentése, amelyet közben valaki más módosított, konfliktusként jön vissza ahelyett, hogy felülírná a munkáját.',
  // studio-auto-layout
  'help.guide.studio-auto-layout.title': 'A könyv automatikus felépítése',
  'help.guide.studio-auto-layout.goal':
    'Kapj egy kattintással teljes első vázlatot a napló bejegyzéseiből és fotóiból.',
  'help.guide.studio-auto-layout.step.1': 'Kattints az Auto layout gombra a felső sávban.',
  'help.guide.studio-auto-layout.step.2':
    'Válaszd A teljes könyv lehetőséget: minden oldalt lecserél, a címedet és az oldalbeállításodat megtartva. Az Ez az oldal csak a képernyőn lévőt építi újra, és olyan oldalpáron kínálja fel magát, amely egy bejegyzésből született.',
  'help.guide.studio-auto-layout.step.3':
    'Nézd végig az oldalsávot. Az Undo az egész elrendezést visszaveszi, ha jobban tetszett, amid volt.',
  'help.guide.studio-auto-layout.result':
    'Bejegyzésenként egy oldalpár, sorrendben, a fotóival, címével és történetével elhelyezve helyetted. Minden elem követi a bejegyzését, amíg nem szerkeszted.',
  'help.guide.studio-auto-layout.tip.1':
    'Mindkét lehetőség közönséges visszavonási lépés, úgyhogy próbáld ki őket bátran.',
  'help.guide.studio-auto-layout.tip.2':
    'Az az elem, amelyet az Auto layout egy bejegyzéshez kötött, lépést tart a bejegyzés módosításaival, amíg hozzá nem nyúlsz a Properties alatt; az megszakítja a kapcsolatot.',
  // studio-pages
  'help.guide.studio-pages.title': 'Oldalpárok hozzáadása, mozgatása és eltávolítása',
  'help.guide.studio-pages.goal': 'Formáld a könyvet oldalról oldalra.',
  'help.guide.studio-pages.step.1':
    'Nyisd meg a Pages szakaszt a sávban. A bélyegképek a könyv sorrendben: borító, első oldal, oldalpárok, utolsó oldal, hátsó borító.',
  'help.guide.studio-pages.step.2':
    'Az alul lévő Oldal hozzáadása az utolsó oldal elé tesz egy újat; a két bélyegkép közötti + pontosan oda szúr be egyet.',
  'help.guide.studio-pages.step.3':
    'Vidd az egeret egy bélyegkép fölé a műveleteiért: Előrébb, Hátrébb, Oldal duplikálása és Oldal törlése. Kattints egy bélyegképre, hogy megnyisd azt az oldalpárt a munkaterületen.',
  'help.guide.studio-pages.result':
    'A borító, az első és utolsó oldal és a hátsó borító a helyén marad; az új oldalpárok mindig közéjük kerülnek.',
  'help.guide.studio-pages.tip.1':
    'A felső sáv Book view nézete az egész könyvet ívekként mutatja, úgy, ahogy be lesz kötve.',
  'help.guide.studio-pages.tip.2':
    'Az Oldalszámok a Properties Dokumentum része alatt kapcsolható be, amikor semmi sincs kijelölve.',
  // studio-layouts
  'help.guide.studio-layouts.title': 'Elrendezés alkalmazása egy oldalpárra',
  'help.guide.studio-layouts.goal': 'Adj egy oldalpárnak kész fotó- és szövegkeret-elrendezést.',
  'help.guide.studio-layouts.step.1':
    'Nyisd meg a Layouts szakaszt a sávban. Tizenhárom oldalpár-elrendezés, és külön készlet a borítóhoz, a hátlaphoz és az önálló oldalakhoz.',
  'help.guide.studio-layouts.step.2':
    'Kattints egyre. A munkaterületen lévő oldalpár átveszi a kereteit; a már meglévő fotóid és szövegeid beleömlenek.',
  'help.guide.studio-layouts.result':
    'Az üres keretek tartalomra várnak: húzz egy fotót a Content szakaszból az egyikre, vagy használd az Add to this page gombot.',
  'help.guide.studio-layouts.tip.1': 'Egy elrendezés ugyanolyan visszavonási lépés, mint bármelyik másik.',
  // studio-content
  'help.guide.studio-content.title': 'Fotók és bejegyzések elhelyezése egy oldalon',
  'help.guide.studio-content.goal': 'Vidd az útinapló saját anyagát az oldalpárra.',
  'help.guide.studio-content.step.1':
    'Nyisd meg a Content szakaszt a sávban. A Photos az útinapló minden képét listázza; az Entries a bejegyzéseket a szövegükkel.',
  'help.guide.studio-content.step.2':
    'Húzz egy fotót az oldalpárra vagy egy üres keretre, vagy kattints alatta az Add to this page gombra. A Fotók feltöltése olyan képeket ad hozzá, amelyek még nincsenek az útinaplóban.',
  'help.guide.studio-content.step.3':
    'Egy bejegyzés alatt a Title, a Story és a Place szövegelemként teszi az adott szöveget az oldalra; a Dátum és a koordináták jelként érkeznek, a bejegyzés fotói pedig ott vannak felsorolva.',
  'help.guide.studio-content.result':
    'A ledobott fotó fotóelemmé válik; a szöveg követi a bejegyzést, amíg nem szerkeszted.',
  'help.guide.studio-content.tip.1': 'A Content tetején lévő keresőmező mindkét listát szűri.',
  'help.guide.studio-content.tip.2':
    'Ha az asztalodról dobsz egy fájlt a munkaterületre, az egy lépésben feltölti és elhelyezi.',
  // studio-elements
  'help.guide.studio-elements.title': 'Szöveg, alakzatok és ikonok hozzáadása',
  'help.guide.studio-elements.goal': 'Díszíts egy oldalpárt a fotókon és történeteken túl.',
  'help.guide.studio-elements.step.1': 'Nyisd meg az Elements szakaszt a sávban.',
  'help.guide.studio-elements.step.2':
    'Kattints egy szövegstílusra címsorhoz vagy képaláíráshoz, egy alakzatra, egy vonalra, egy rácsra, egy keretstílusú üres keretre, vagy egy ikonra a kereshető könyvtárból. Mindegyik az oldalpár közepére kerül, mozgatásra készen.',
  'help.guide.studio-elements.result':
    'Kattints duplán egy szövegelemre, hogy beleírj; a Properties tartja a betűtípust, a vastagságot, a méretet, a térközt és az igazítást.',
  'help.guide.studio-elements.tip.1': 'A keretek üres fotóhelyek: később dobj beléjük egy képet.',
  // studio-travel
  'help.guide.studio-travel.title': 'Térkép, zászlók és számok hozzáadása',
  'help.guide.studio-travel.goal': 'Alakítsd magát az útinaplót számokká az oldalon.',
  'help.guide.studio-travel.step.1': 'Nyisd meg az Utazás szakaszt a sávban.',
  'help.guide.studio-travel.step.2':
    'Válaszd ki, mit adsz hozzá: a bejegyzések útvonaltérképét, országkörvonalakat, országlistát vagy országrácsot, zászlókat, dátum-, nap- vagy távolságjelet, vagy az egész utazás összegzését. Mindegyik az útinapló adataiból épül, és azokkal frissül.',
  'help.guide.studio-travel.result':
    'Az elem megjelenik az oldalpáron; a Properties a stílusát állítja, a térképnek pedig a területét.',
  'help.guide.studio-travel.tip.1':
    'A jelek azt a bejegyzést követik, amelyből az oldalpár született, így egy automatikusan elrendezett oldalpáron a dátumjel már azt a napot mutatja.',
  // studio-properties
  'help.guide.studio-properties.title': 'A kijelölt elem szerkesztése',
  'help.guide.studio-properties.goal': 'Mozgass, vágj, stílusozz és rétegezz egy elemet a szerkesztőpanellel.',
  'help.guide.studio-properties.step.1':
    'Kattints egy elemre az oldalpáron. Fogantyúk jelennek meg a mérethez és a forgatáshoz; húzd, hogy mozgasd.',
  'help.guide.studio-properties.step.2':
    'A jobb oldali Properties követi a kijelölést: pozíció és méret, Crop a fókuszponttal, amely eldönti, mi marad a keretben, Kitöltés vagy illesztés, Look szűrők, Corner sugár, Keret, rétegsorrend és Lock.',
  'help.guide.studio-properties.step.3':
    'A Duplikálás és a Delete a szerkesztőpanel tetején ül; a felső sáv Undo gombja bármelyiket visszavonja.',
  'help.guide.studio-properties.result':
    'A zárolt elemet már nem lehet megfogni az oldalon, ami biztonságban tartja a kész elrendezést, amíg körülötte dolgozol.',
  'help.guide.studio-properties.tip.1':
    'A Shift-kattintás több elemet jelöl ki; a szerkesztőpanel ekkor együtt szerkeszti őket.',
  'help.guide.studio-properties.tip.2':
    'Egy olyan elem szerkesztése, amelyet az Auto layout helyezett el, megszakítja a kapcsolatát a bejegyzéssel; nem követi tovább a bejegyzés későbbi változásait.',
  // studio-format
  'help.guide.studio-format.title': 'Oldalformátum kiválasztása',
  'help.guide.studio-format.goal':
    'Állítsd be a méretet, amelyben a könyv nyomtatva lesz, mielőtt az elrendezés függene tőle.',
  'help.guide.studio-format.step.1': 'Kattints a Page format gombra a felső sávban.',
  'help.guide.studio-format.step.2':
    'Válassz Square 21 × 21 cm, Square 30 × 30 cm, A4 vagy A5 landscape vagy portrait közül, vagy adj meg egyéni szélességet és magasságot milliméterben. A Kifutó és a Védőzóna alatta ül.',
  'help.guide.studio-format.result':
    'Minden oldalpár abban a méretben rajzolódik, alapértelmezés szerint 3 mm kifutóval és 5 mm védőmargóval.',
  'help.guide.studio-format.tip.1':
    'Előbb váltsd a formátumot, aztán futtasd az Auto layout funkciót; az elrendezés arra a méretre épül, amelyet talál.',
  'help.guide.studio-format.tip.2': 'Kérdezd meg a nyomdádtól a kifutó- és védőértékeiket, és azokat add meg.',
  // studio-export
  'help.guide.studio-export.title': 'A könyv exportálása PDF-ként',
  'help.guide.studio-export.goal': 'Kapj nyomdakész fájlt, vagy olyat, amit képernyőn olvasol.',
  'help.guide.studio-export.step.1': 'Kattints az Export gombra a felső sávban.',
  'help.guide.studio-export.step.2':
    'Válaszd az Önálló oldalak lehetőséget, ívenként egy lap olvasási sorrendben, ahogy a nyomda kéri, vagy a Dupla oldalak lehetőséget, egyszerre két oldal, ahogy a könyv kinyílik. A Vágójelek minden élhez hozzáadják a kifutót, és jelölik, hol kell vágni.',
  'help.guide.studio-export.step.3':
    'Kattints a Nyomtatási nézet gombra. A böngésződ megnyitja az oldalakat, a Mentés PDF-ként pedig fájllá alakítja őket.',
  'help.guide.studio-export.result':
    'Egy PDF annyi ívvel, amennyit a párbeszédablak jelzett, az általad beállított oldalformátumban.',
  'help.guide.studio-export.tip.1': 'A PDF készítése csak asztali gépen működik, akárcsak maga a Studio.',
  'help.guide.studio-export.tip.2':
    'Próbanyomathoz exportálj Dupla oldalak formában vágójelek nélkül; a nyomdának Önálló oldalak formában, vágójelekkel.',
  // studio-spread-file
  'help.guide.studio-spread-file.title': 'Oldalpár újrafelhasználása másik könyvben',
  'help.guide.studio-spread-file.goal': 'Vidd át a neked tetsző tervet az egyik útinapló könyvéből egy másikba.',
  'help.guide.studio-spread-file.step.1':
    'Amíg az oldalpár a munkaterületen van, kattints az Oldalpár letöltése gombra a nagyítósáv jobb végén. A fájl a tervet tartalmazza, nem a fényképeket.',
  'help.guide.studio-spread-file.step.2':
    'A másik könyvben nyisd meg a Pages szakaszt, kattints az Oldal hozzáadása melletti Importálás gombra, majd válaszd ki a fájlt.',
  'help.guide.studio-spread-file.result':
    'Az oldalpár a kereteivel és szövegstílusaival érkezik; dobd a keretekbe az új útinapló fotóit.',
  'help.guide.studio-spread-file.tip.1': 'Az olyan fájlt, amely nem oldalpárterv, indoklással utasítja el.',

  // ── Screen: settings (all tabs) ───────────────────────────────────────────────────────
  'help.ctx.settings.title': 'Beállítások',
  'help.ctx.settings.summary':
    'A személyes beállításaid, a bal oldali sávban témánként egy fül. A legtöbb kapcsoló abban a pillanatban érvényes, ahogy átbillented; az alján Mentés gombos űrlap arra vár. Itt semmi sem változtat más TREK-jén.',
  'help.ctx.settings.bullet.1':
    'Bal oldali sáv: Megjelenés, Appearance, Térkép, Értesítések, Integrációk, Offline és Fiók. A Bővítmények akkor jelenik meg, ha egy telepítve van, a Névjegy mindenütt, ahol az admin nem távolította el.',
  'help.ctx.settings.bullet.2':
    'A Megjelenés a nyelv, a mértékegységek, a pénznem és az, amivel az alkalmazás megnyílik; az Appearance a téma, a színek, a szövegméret és az irányítópult widgetjei.',
  'help.ctx.settings.bullet.3':
    'A Térkép a rajzolómotort és stílusát választja; az Értesítések a csatornákat, amelyeken elérnek; az Integrációk a fotókönyvtárakat, API-kulcsokat és az MCP-t; az Offline azt, amit az alkalmazás ezen az eszközön tart.',
  'help.ctx.settings.bullet.4':
    'A Fiók tartalmazza a profilodat, a jelszavadat, a kétfaktoros hitelesítést, a passkey-ket és a fiókod törlését.',
  'help.ctx.settings-display.title': 'Megjelenés',
  'help.ctx.settings-display.summary':
    'Nyelv, mértékegységek és pénznem, hogyan viselkedik a térkép és a foglalások, és mivel nyílik meg a TREK. Itt minden változás azonnal érvényes.',
  'help.ctx.settings-display.bullet.1':
    'Language & region: a felület nyelve, az időformátum, a hét első napja, a megjelenítési pénznem, valamint a távolság- és hőmérséklet-egységek.',
  'help.ctx.settings-display.bullet.2':
    'Travel & map: foglalási útvonalak mindig a térképen, a Helyek felfedezése pirula, útvonal-optimalizálás a szállástól, elrejtett foglalási kódok és címkézett foglalási útvonalak.',
  'help.ctx.settings-display.bullet.3':
    'Indítás: a TREK az irányítópulton vagy az aktív utazáson nyíljon-e meg, és egy utazás melyik füle jöjjön fel először.',
  'help.ctx.settings-appearance.title': 'Appearance',
  'help.ctx.settings-appearance.summary':
    'Hogyan néz ki a TREK ezen a fiókon: világos vagy sötét, a kiemelőszín, üveg és mozgás, szövegméret, és mely widgeteket mutatja az irányítópult. Minden élőben érvényes, minden eszközön, ahol bejelentkezel.',
  'help.ctx.settings-appearance.bullet.1':
    'Theme: Világos, Sötét vagy Automatikus, és a Color scheme saját Custom accent színnel.',
  'help.ctx.settings-appearance.bullet.2':
    'Readability: Transparency, Reduce motion, Density és Text size, szintenként haladó méretekkel.',
  'help.ctx.settings-appearance.bullet.3':
    'Dashboard widgets: widgetenként egy kapcsoló, külön a Desktop és a Mobile számára.',
  'help.ctx.settings-appearance.bullet.4': 'Az alsó Reset to defaults mindent visszaállít.',
  'help.ctx.settings-map.title': 'Térkép',
  'help.ctx.settings-map.summary':
    'Melyik motor rajzolja a térképeket és milyen stílusban. A Leaflet a klasszikus rasztertérkép, a MapLibre token nélkül rajzol vektorcsempéket, a Mapbox 3D-épületeket és domborzatot ad hozzá a saját tokeneddel.',
  'help.ctx.settings-map.bullet.1':
    'Térkép szolgáltató: Leaflet, MapLibre vagy Mapbox, mindegyik egy sorral arról, mire van szüksége.',
  'help.ctx.settings-map.bullet.2':
    'Térkép stílus és Térkép sablon: a csempék kinézete, plusz a token vagy kulcs, amit egy szolgáltató kér.',
  'help.ctx.settings-map.bullet.3':
    'Magas minőség mód az élsimításhoz és a gömbvetülethez; a Térkép mentése írja be a választást.',
  'help.ctx.settings-notifications.title': 'Értesítések',
  'help.ctx.settings-notifications.summary':
    'Hol ér el a TREK az alkalmazáson kívül: push értesítések ezen az eszközön, egy ntfy-téma, egy webhook vagy egy bővítmény által adott csatorna. A csatornák alatt eseményenként egy sor dönti el, mi hová megy.',
  'help.ctx.settings-notifications.bullet.1':
    'ntfy: a téma, egy opcionális saját szerver és egy opcionális hozzáférési token, a Teszt gombbal, amely azonnal küld egyet.',
  'help.ctx.settings-notifications.bullet.2': 'Webhook: egy URL, amely minden eseményt JSON-ként kap, Teszt gombbal.',
  'help.ctx.settings-notifications.bullet.3':
    'Push értesítések ezen az eszközön: a Bekapcsolás ezen az eszközön csak az éppen használt böngészőre vonatkozik, ezért ismételd meg minden telefonon vagy számítógépen. A Teszt küldése mindegyikre eljut.',
  'help.ctx.settings-notifications.bullet.4':
    'A preferencia-sorok: eseményenként, melyik csatorna van bekapcsolva. A bővítménycsatornák a Beállítás feliratot mutatják, amíg nincsenek beállítva.',
  'help.ctx.settings-integrations.title': 'Integrációk',
  'help.ctx.settings-integrations.summary':
    'Minden, ami kívülről kapcsolódik a TREK-hez: fotókönyvtárak az útinaplóhoz, API-kulcsok szkriptekhez, és az MCP végpont a tokenjeivel és OAuth klienseivel AI-asszisztensek számára.',
  'help.ctx.settings-integrations.bullet.1':
    'Fotószolgáltatók: Immich és Synology Photos, mindegyik a saját URL-jével és kulcsával, Kapcsolat tesztelése és Mentés.',
  'help.ctx.settings-integrations.bullet.2':
    'API-kulcsok: személyes kulcsok szkriptekhez és más eszközökhöz, amelyek a nevedben hívják a TREK API-t.',
  'help.ctx.settings-integrations.bullet.3':
    'MCP konfiguráció: a végpont, egy kész, másolható kliens-konfiguráció és az API tokenek.',
  'help.ctx.settings-integrations.bullet.4':
    'OAuth 2.1 kliensek: a TREK-en át bejelentkező alkalmazások, átirányítási URI-kkel, engedélyezett jogosultságokkal, gépi kliensekkel és az aktív munkamenetekkel.',
  'help.ctx.settings-offline.title': 'Offline',
  'help.ctx.settings-offline.summary':
    'Mit tart a TREK ezen az eszközön, hogy egy utazás kapcsolat nélkül is megnyíljon, és mi történik, ha egy offline tett változás ütközik egy máshol tett változással.',
  'help.ctx.settings-offline.bullet.1':
    'Offline mód: az Offline mód kényszerítése úgy viselkedteti az alkalmazást, mintha nem lenne hálózat, teszteléshez vagy forgalomkorlátos kapcsolathoz.',
  'help.ctx.settings-offline.bullet.2':
    'Felkészülés offline használatra: a Letöltés offline használatra most letölti az utazásaidat és a térképcsempéiket.',
  'help.ctx.settings-offline.bullet.3': 'Mit tároljon offline: térképcsempék be vagy ki, és utazásonként egy kapcsoló.',
  'help.ctx.settings-offline.bullet.4':
    'Szinkronizálási ütközések és Offline gyorsítótár: az ütközések stratégiája, a függő és sikertelen darabszámok, Újraszinkronizálás most és Gyorsítótár törlése.',
  'help.ctx.settings-account.title': 'Fiók',
  'help.ctx.settings-account.summary':
    'Ki vagy ezen a TREK-en és hogyan jelentkezel be: profil és avatar, jelszó, kétfaktoros hitelesítés, passkey-k, és a legalján a fiók törlése.',
  'help.ctx.settings-account.bullet.1': 'Profil: felhasználónév, e-mail és avatar, a Mentés gombbal mentve.',
  'help.ctx.settings-account.bullet.2': 'Jelszó módosítása: jelenlegi jelszó, új jelszó kétszer, Jelszó frissítése.',
  'help.ctx.settings-account.bullet.3':
    'Kétfaktoros hitelesítés (2FA) hitelesítő alkalmazással és tartalék kódokkal; Passkey-k a jelszó nélküli bejelentkezéshez.',
  'help.ctx.settings-account.bullet.4': 'Törlés a legalján, megerősítés mögött. Az utolsó admin nem törölheti magát.',
  // language-region
  'help.guide.language-region.title': 'Nyelv, mértékegységek és pénznem beállítása',
  'help.guide.language-region.goal': 'Beszéljen a TREK a te nyelveden, és számoljon úgy, ahogy te.',
  'help.guide.language-region.step.1':
    'Válaszd ki a felület nyelvét a Language & region alatt. A TREK azonnal vált, minden eszközön, ahol bejelentkezel.',
  'help.guide.language-region.step.2':
    'Alatta válaszd ki az időformátumot, a hét kezdőnapját minden dátumválasztóban, a megjelenítési pénznemet, valamint a távolság- és hőmérséklet-egységeket.',
  'help.guide.language-region.result':
    'A dátumok, távolságok és pénzösszegek úgy olvashatók, ahogy várod; az utazás saját pénzneme továbbra is ott áll az átváltott összegek mellett.',
  'help.guide.language-region.tip.1':
    'A megjelenítési pénznem az utazásokon átívelő összegekhez van; minden utazás megtartja a pénznemet, amit adtál neki.',
  'help.guide.language-region.tip.2': 'A nyelv a nap- és hónapneveket is beállítja a Vacay-ben és az útinaplóban.',
  // travel-map-prefs
  'help.guide.travel-map-prefs.title': 'A térkép és a foglalások viselkedésének hangolása',
  'help.guide.travel-map-prefs.goal': 'Döntsd el, mit mutasson alapból az utazás térképe.',
  'help.guide.travel-map-prefs.step.1':
    'A Travel & map alatt a Mindig jelenjenek meg a foglalási útvonalak a térképen tartja a járatokat és vonatokat akkor is, ha a napjuk nincs megnyitva; a Helyek felfedezése a térképen mutatja a helykereső pirulát; az Útvonal optimalizálása a szállástól ott indítja az útvonalat, ahol alszol.',
  'help.guide.travel-map-prefs.step.2':
    'A Foglalási kódok elrejtése addig rejti a visszaigazolási számokat, amíg föléjük nem viszed az egeret; az Útvonal-címkék a foglalásokhoz az útvonala mentén írja ki a foglalás nevét.',
  'help.guide.travel-map-prefs.result':
    'Az utazás térképe minden utazáson ezeket követi, amíg vissza nem billented őket.',
  'help.guide.travel-map-prefs.tip.1':
    'Ezek fiókonként érvényesek, nem utazásonként. A megosztott utazás tagjai mind a saját választásaikat látják.',
  // startup
  'help.guide.startup.title': 'Válaszd ki, mivel nyíljon meg a TREK',
  'help.guide.startup.goal': 'Ott érkezz meg, ahol a legtöbbet dolgozol, ne mindig az irányítópulton.',
  'help.guide.startup.step.1': 'Az Indítás alatt állítsd a Kezdőoldal értékét Irányítópult vagy Aktív utazás állásba.',
  'help.guide.startup.step.2':
    'A Kezdő fül választja ki, egy utazás melyik füle jöjjön fel először, amikor megnyitsz egyet.',
  'help.guide.startup.result': 'A következő bejelentkezés és a következő koppintás a logóra egyenesen oda visz.',
  'help.guide.startup.tip.1': 'Az Aktív utazás a ma zajló utazást jelenti, vagy a következőt, ha éppen nincs ilyen.',
  // theme-scheme
  'help.guide.theme-scheme.title': 'A téma és a kiemelőszín beállítása',
  'help.guide.theme-scheme.goal':
    'Legyen a TREK világos, sötét, vagy kövesse az eszközödet, abban a színben, amit szeretsz.',
  'help.guide.theme-scheme.step.1':
    'A Theme alatt válaszd a Világos, Sötét vagy Automatikus lehetőséget. Az Automatikus az eszközödet követi.',
  'help.guide.theme-scheme.step.2':
    'Válassz Color scheme-et: Default, High contrast, Indigo, Teal, Rose, Amber, Violet vagy Custom.',
  'help.guide.theme-scheme.step.3':
    'A Custom mellett válassz kiemelőszínt az előbeállítások közül, vagy adj meg sajátot. A mellette lévő kontrasztellenőrzés megmondja, olvasható marad-e rajta a szöveg.',
  'help.guide.theme-scheme.result':
    'A gombok, linkek és kiemelések mindenhol felveszik a kiemelőszínt, minden eszközön, ahol bejelentkezel.',
  'help.guide.theme-scheme.tip.1': 'A navigációs sávban is van gyors világos-sötét kapcsoló; ugyanazt a témát állítja.',
  'help.guide.theme-scheme.tip.2':
    'A High contrast az a séma, amelyet akkor válassz, ha az alapértelmezett túl lágyan olvasható.',
  // readability
  'help.guide.readability.title': 'Olvashatóság és szövegméret igazítása',
  'help.guide.readability.goal': 'Kevesebb üveg, kevesebb mozgás, több hely vagy nagyobb betűk.',
  'help.guide.readability.step.1':
    'A Readability alatt a Transparency az üvegpaneleket tömör felületekre váltja, a Reduce motion minimálisra csökkenti az animációkat, a Density pedig Comfortable vagy Compact közül választ.',
  'help.guide.readability.step.2':
    'A Text size az Everything választással egyszerre skáláz mindent; az Advanced text sizes lehetővé teszi, hogy a címek, alcímek, a szövegtörzs és a feliratok eltérjenek.',
  'help.guide.readability.result': 'Az egész alkalmazás azonnal követi, a térképpanelekkel és az útinaplóval együtt.',
  'help.guide.readability.tip.1': 'A Reduce motion a rendszered beállítását is követi, ha békén hagyod.',
  'help.guide.readability.tip.2':
    'A szövegméret a tipográfiai szinteken át érvényesül, így semmi sem vágódik le; a már nem elférő méret új sorba tördelődik.',
  // dashboard-widgets
  'help.guide.dashboard-widgets.title': 'Az irányítópult widgetjeinek kiválasztása',
  'help.guide.dashboard-widgets.goal':
    'Csak azokat a widgeteket mutasd, amelyeket használsz, külön asztali gépen és telefonon.',
  'help.guide.dashboard-widgets.step.1':
    'A Dashboard widgets alatt kapcsold be vagy ki az egyes widgeteket a Desktop és a Mobile számára: a jobb oldali sáv egészét, pénznemet, gyűjteményeket, időzónákat, közelgő foglalásokat, Atlas-országokat és az utazási számokat.',
  'help.guide.dashboard-widgets.step.2':
    'Az alsó Reset to defaults az egész fület visszaállítja a kiindulási állapotba.',
  'help.guide.dashboard-widgets.result':
    'Az irányítópult azonnal átrendeződik; kikapcsolt jobb oldali sávval középre kerül.',
  'help.guide.dashboard-widgets.tip.1':
    'Egy bővítmény widgetjei csak addig jelennek meg, amíg az admin bekapcsolva tartja azt a bővítményt.',
  'help.guide.dashboard-widgets.tip.2':
    'Maga az irányítópult eszközönként megjegyzi a rács- vagy listanézetedet és a rendezési sorrendet.',
  // map-provider
  'help.guide.map-provider.title': 'Térképmotor és stílus kiválasztása',
  'help.guide.map-provider.goal': 'Válts a klasszikus térkép, a vektorcsempék és a Mapbox 3D-térképe között.',
  'help.guide.map-provider.step.1':
    'A Térkép szolgáltató alatt válaszd a Leaflet-et a klasszikus 2D-térképhez bármilyen rasztercsempével, a MapLibre-t az OpenFreeMap vektorcsempéihez token nélkül, vagy a Mapbox-ot vektorcsempékhez 3D-épületekkel és domborzattal.',
  'help.guide.map-provider.step.2':
    'Válassz Térkép stílus vagy Térkép sablon lehetőséget a kinézethez. A Mapbox-hoz Mapbox hozzáférési token kell, néhány raszterstílushoz CARTO API-kulcs; a mező melletti link oda vezet, ahol szerezhetsz egyet.',
  'help.guide.map-provider.step.3':
    'A Magas minőség mód élsimítást és gömbvetületet ad hozzá. Kattints a Térkép mentése gombra.',
  'help.guide.map-provider.result':
    'A TREK minden térképét, az utazásokat, az Atlast, a Gyűjteményeket és az útinaplót is a választott motor rajzolja.',
  'help.guide.map-provider.tip.1':
    'Token nélkül a Mapbox az alapértelmezett térképre esik vissza, ahelyett hogy semmit sem mutatna.',
  'help.guide.map-provider.tip.2':
    'Az offline tárolt térképcsempék attól a szolgáltatótól jönnek, amelyik a letöltéskor aktív.',
  // notification-channels
  'help.guide.notification-channels.title': 'Állítsd be, hol érnek el az értesítések',
  'help.guide.notification-channels.goal':
    'Kapd meg az utazási emlékeztetőket és az együttműködési eseményeket a telefonodon vagy egy másik eszközben.',
  'help.guide.notification-channels.step.1':
    'Az Értesítések alatt tölts ki egy Ntfy téma mezőt; add hozzá a saját Ntfy szerver URL-t és egy Hozzáférési token értéket, ha üzemeltetsz ilyet. A Teszt azonnal küld egy üzenetet.',
  'help.guide.notification-channels.step.2':
    'Vagy adj meg egy Webhook URL-t, amely minden eseményt JSON-ként kap, és ugyanígy Teszt-eld.',
  'help.guide.notification-channels.step.3':
    'Az alatta lévő sorokban kapcsold be vagy ki az egyes eseményeket csatornánként. A bővítménycsatorna Beállítás feliratot mutat, amíg a bővítmény beállításaiban be nem állítod; a Teszt küldése kipróbál egyet.',
  'help.guide.notification-channels.result':
    'Az események a bekapcsolt csatornákon mennek ki. A navigációs sáv harangja ettől függetlenül továbbra is mutatja őket az alkalmazásban.',
  'help.guide.notification-channels.tip.1':
    'Az utazásonkénti preferenciák magán az utazáson vannak, az értesítési beállításai alatt.',
  'help.guide.notification-channels.tip.2':
    'Az admin előre kitölthet mindenkinek egy alapértelmezett ntfy-szervert; a témát továbbra is te választod.',
  // photo-providers
  'help.guide.photo-providers.title': 'Fotókönyvtár csatlakoztatása',
  'help.guide.photo-providers.goal': 'Hadd húzza be az útinapló a nap fotóit az Immich-ből vagy a Synology Photos-ból.',
  'help.guide.photo-providers.step.1':
    'Az Integrációk alatt keresd meg a szolgáltató szakaszát, és add meg az URL-jét és API-kulcsát. Az Immich azt is felajánlja, hogy az útinapló feltöltéseit visszatükrözze a könyvtárba.',
  'help.guide.photo-providers.step.2': 'Kattints a Kapcsolat tesztelése, majd a Mentés gombra.',
  'help.guide.photo-providers.result':
    'A bejegyzésszerkesztő External photos füle a bejegyzés napjára keres a csatlakoztatott könyvtárban, elöl a bejegyzés helyéhez legközelebbiekkel.',
  'help.guide.photo-providers.tip.1': 'A kapcsolat a tiéd: az útinapló többi tagja a saját könyvtárát csatlakoztatja.',
  'help.guide.photo-providers.tip.2':
    'A fotóiban GPS-adat nélküli szolgáltató is működik; a lista ilyenkor időrendben van.',
  // api-keys
  'help.guide.api-keys.title': 'API-kulcs létrehozása',
  'help.guide.api-keys.goal': 'Hadd hívja egy szkript vagy másik eszköz a TREK API-t a te nevedben.',
  'help.guide.api-keys.step.1':
    'Az API-kulcsok alatt kattints a Kulcs létrehozása gombra, és adj neki olyan nevet, amely elmondja, hol fogják használni.',
  'help.guide.api-keys.step.2':
    'Másold ki a kulcsot a párbeszédablakból: egyszer jelenik meg. Töröld a kulcsot a listából, ha az eszköznek már nincs rá szüksége.',
  'help.guide.api-keys.result':
    'Az ezzel a kulccsal küldött kérések a te jogosultságaiddal járnak el; a lista mutatja, mikor jött létre és mikor használták utoljára az egyes kulcsokat.',
  'help.guide.api-keys.tip.1': 'Eszközönként egy kulcs fájdalommentessé teszi a visszavonást.',
  'help.guide.api-keys.tip.2':
    'AI-asszisztenshez inkább az MCP-t használd OAuth-tal; az API-kulcsok egyszerű HTTP-klienseknek valók.',
  // mcp-oauth
  'help.guide.mcp-oauth.title': 'AI-asszisztens csatlakoztatása MCP-n keresztül',
  'help.guide.mcp-oauth.goal':
    'Adj hozzáférést az utazásaidhoz a Claude-nak, egy IDE-nek vagy egy másik MCP-kliensnek.',
  'help.guide.mcp-oauth.step.1':
    'Az MCP konfiguráció alatt másold ki az MCP végpont értékét, vagy a teljes Kliens konfiguráció blokkot olyan klienshez, amely JSON-részletet fogad.',
  'help.guide.mcp-oauth.step.2':
    'A böngészőn át bejelentkező kliensek OAuth 2.1-et használnak: Új kliens az OAuth 2.1 kliensek alatt, az Átirányítási URI-k, az Engedélyezett jogosultságok és böngésző nélküli szerverhez a Gépi kliens megadásával.',
  'help.guide.mcp-oauth.step.3':
    'A Titok megújítása és a Kliens törlése minden kliensen ott van; az Aktív OAuth munkamenetek felsorolja, mi van bejelentkezve, és visszavonhatod. Az API tokenek az Új token létrehozása gombbal a régebbi belépési út.',
  'help.guide.mcp-oauth.result':
    'A kliens azt olvashatja és módosíthatja, amit a jogosultságai engednek, a te nevedben, és minden művelet a te neved alatt jelenik meg.',
  'help.guide.mcp-oauth.tip.1':
    'A jogosultságok a biztonsági háló: csak olvasási jogot adj egy kliensnek, amíg többre nincs szüksége.',
  'help.guide.mcp-oauth.tip.2': 'Az admin az egész példányon kikapcsolhatja az MCP-t; akkor ez a szakasz nincs ott.',
  // offline-prepare
  'help.guide.offline-prepare.title': 'Utazások offline-ra vitele',
  'help.guide.offline-prepare.goal':
    'Legyenek az utazásaid és a térképeik ezen az eszközön, mielőtt megszakad a kapcsolat.',
  'help.guide.offline-prepare.step.1':
    'A Mit tároljon offline alatt hagyd bekapcsolva a Térképcsempék offline tárolása kapcsolót, és kapcsold be az utazásokat, amelyeket ezen az eszközön akarsz.',
  'help.guide.offline-prepare.step.2':
    'Kattints a Letöltés offline használatra gombra a Felkészülés offline használatra alatt. Letölti az utazásokat és a helyeik körüli csempéket.',
  'help.guide.offline-prepare.step.3':
    'Az Offline mód alatti Offline mód kényszerítése lehetővé teszi, hogy indulás előtt ellenőrizd, minden megvan-e.',
  'help.guide.offline-prepare.result':
    'Az utazások kapcsolat nélkül is megnyílnak; a változtatásaid sorban várnak, és újracsatlakozáskor kimennek.',
  'help.guide.offline-prepare.tip.1':
    'A csempék foglalják a legtöbb helyet: az Offline gyorsítótár szakasz utazásonként mutatja, mi van tárolva.',
  'help.guide.offline-prepare.tip.2':
    'Telepítsd a TREK-et alkalmazásként a böngészőből a legsimább offline indításhoz.',
  // offline-conflicts
  'help.guide.offline-conflicts.title': 'Döntsd el, mi nyer szinkronizálási ütközésnél',
  'help.guide.offline-conflicts.goal':
    'Válaszd ki, hogyan rendezze a TREK az offline tett változást a máshol tett változással szemben.',
  'help.guide.offline-conflicts.step.1':
    'A Szinkronizálási ütközések alatt válaszd a Kérdezz rá minden alkalommal, a Mindig az én verzióm megtartása vagy a Mindig a szerver verziójának megtartása lehetőséget.',
  'help.guide.offline-conflicts.step.2':
    'Az Offline gyorsítótár mutatja az utazásokat, a függő és sikertelen változásokat és az ütközéseket; az Újraszinkronizálás most kiküldi a sort, a Gyorsítótár törlése kiüríti az eszközt.',
  'help.guide.offline-conflicts.result':
    'Kérdezéssel az ütközés mindkét verziót megmutatja, és választhatsz; a másik kettővel csendben rendeződik.',
  'help.guide.offline-conflicts.tip.1':
    'A Gyorsítótár törlése csak az ezen az eszközön lévő másolatot távolítja el; a szerveren semmihez nem nyúl.',
  // profile
  'help.guide.profile.title': 'Profil módosítása',
  'help.guide.profile.goal': 'Frissítsd a neved, az e-mail-címed és a képed.',
  'help.guide.profile.step.1':
    'A Fiók alatt szerkeszd a Felhasználónév és az E-mail mezőt. Az avatar saját feltöltést fogad; távolítsd el, hogy visszatérj a monogramhoz.',
  'help.guide.profile.step.2': 'Kattints a Mentés gombra.',
  'help.guide.profile.result': 'A neved és a képed egyszerre frissül mindenhol, a megosztott utazásaidon is.',
  'help.guide.profile.tip.1':
    'Az OIDC-n át bejelentkező fiók ezt itt mutatja; az e-mail ilyenkor a szolgáltatótól jön.',
  // password
  'help.guide.password.title': 'Jelszó módosítása',
  'help.guide.password.goal': 'Állíts be új jelszót.',
  'help.guide.password.step.1': 'A Jelszó módosítása alatt add meg a jelenlegi jelszavad, majd kétszer az újat.',
  'help.guide.password.step.2': 'Kattints a Jelszó frissítése gombra.',
  'help.guide.password.result': 'Az új jelszó a következő bejelentkezéstől él; a többi munkamenet bejelentkezve marad.',
  'help.guide.password.tip.1': 'Az OIDC-n át bejelentkező fióknak nincs módosítható TREK-jelszava.',
  // mfa
  'help.guide.mfa.title': 'Kétfaktoros hitelesítés bekapcsolása',
  'help.guide.mfa.goal': 'Védd a fiókot egy hitelesítő alkalmazás kódjával.',
  'help.guide.mfa.step.1': 'A Kétfaktoros hitelesítés (2FA) alatt kattints a Hitelesítő beállítása gombra.',
  'help.guide.mfa.step.2':
    'Olvasd be a QR-kódot az alkalmazásoddal, vagy írd be kézzel a titkot, majd gépeld be az általa mutatott hatjegyű kódot, és kattints a 2FA engedélyezése gombra.',
  'help.guide.mfa.step.3':
    'Mentsd el a tartalék kódokat: másold, töltsd le vagy nyomtasd ki őket. Mindegyik egyszer működik, amikor nincs kéznél a telefonod.',
  'help.guide.mfa.result': 'Minden bejelentkezés a jelszó után kódot kér.',
  'help.guide.mfa.tip.1': 'A 2FA kikapcsolása a jelszavadat és egy aktuális kódot kér.',
  'help.guide.mfa.tip.2': 'Az admin mindenkitől megkövetelheti a 2FA-t; akkor itt nem kapcsolható ki.',
  // passkeys
  'help.guide.passkeys.title': 'Bejelentkezés passkey-jel',
  'help.guide.passkeys.goal': 'Használd az eszközöd ujjlenyomatát, arcát vagy PIN-jét jelszó helyett.',
  'help.guide.passkeys.step.1':
    'A Passkey-k alatt kattints a Passkey hozzáadása gombra, és erősítsd meg az eszközöddel. Adj neki olyan nevet, amely elmondja, melyik eszköz az.',
  'help.guide.passkeys.step.2':
    'A lista minden passkey-t a nevével és az utolsó használat idejével mutat; a törlés gomb eltávolít egyet.',
  'help.guide.passkeys.result': 'A bejelentkezési oldal felajánlja a passkey-t; a jelszó tartalékként megmarad.',
  'help.guide.passkeys.tip.1':
    'A passkey az eszközön vagy annak jelszókezelőjében él, ezért eszközönként adj hozzá egyet.',
  'help.guide.passkeys.tip.2':
    'A passkey-khez HTTPS kell; sima HTTP-s példányon a szakasz elmagyarázza, miért nem érhetők el.',
  // delete-account
  'help.guide.delete-account.title': 'Fiók törlése',
  'help.guide.delete-account.goal': 'Távolítsd el a fiókodat és a csak hozzád tartozó adatokat.',
  'help.guide.delete-account.step.1': 'A Fiók legalján kattints a Törlés gombra, és erősítsd meg.',
  'help.guide.delete-account.result':
    'A fiókod, a saját utazásaid és az útinaplóid eltűnnek; a másokkal megosztott utazások náluk maradnak.',
  'help.guide.delete-account.tip.1': 'Egy példány utolsó adminja nem törölheti magát; előbb tegyél mást adminná.',
  'help.guide.delete-account.tip.2': 'Nincs visszavonás. Exportáld, amit meg akarsz tartani, mielőtt megerősíted.',

  // ── Screen: admin (all tabs) ──────────────────────────────────────────────────────────
  'help.ctx.admin.title': 'Adminisztráció',
  'help.ctx.admin.summary':
    'A mindenki TREK-je mögötti példány: ki és hogyan jelentkezhet be, mi van bekapcsolva, hol vannak a fájlok, hogyan éri el a szerver az embereket, és hogyan készül róla mentés. Ezt az oldalt csak adminok látják; az oldalsávban minden fül külön képernyő.',
  'help.ctx.admin.bullet.1':
    'A felső négy kártya a felhasználókat, utazásokat, helyeket és fájlokat számolja; egy szalag felettük újabb TREK-kiadást jelez.',
  'help.ctx.admin.bullet.2':
    'Felhasználók és Alapértelmezett beállítások: fiókok, meghívó linkek és a térképbeállítások, amelyekkel egy új fiók indul.',
  'help.ctx.admin.bullet.3':
    'Személyre szabás, Beállítások, Bővítmények és Pluginok: csomagolási sablonok, kategóriák és iskolai szünetek; bejelentkezési módok és API-kulcsok; a funkciómodulok; külső pluginok.',
  'help.ctx.admin.bullet.4':
    'Tárhely, Értesítések, MCP hozzáférés és GitHub: hová kerülnek a feltöltések, a példányszintű csatornák, az AI-kliensek tokenjei és munkamenetei, és a kiadási előzmények.',
  'help.ctx.admin.bullet.5':
    'Biztonsági mentés és Audit: kérésre és ütemezetten készülő mentések, és a biztonsági szempontból fontos események naplója.',
  'help.ctx.admin-users.title': 'Felhasználók',
  'help.ctx.admin-users.summary':
    'Minden fiók ezen a TREK-en, szerepkörrel, e-maillel és utolsó bejelentkezéssel, és a meghívó linkek, amelyekkel zárt példányon is lehet regisztrálni.',
  'help.ctx.admin-users.bullet.1':
    'A táblázat: felhasználónév, e-mail, szerepkör, létrehozás dátuma, utolsó belépés és a soronkénti műveletek. Te magadként vagy megjelölve.',
  'help.ctx.admin-users.bullet.2':
    'A felső Felhasználó létrehozása kézzel ad hozzá egy fiókot, egy általad átadott jelszóval.',
  'help.ctx.admin-users.bullet.3':
    'Lent a Meghívó linkek: egyszer használatos regisztrációs linkek használati korláttal, lejárattal és, ha akarod, egy utazással, amelyhez az új felhasználó érkezéskor csatlakozik.',
  'help.ctx.admin-users.bullet.4':
    'Lent a Jogosultsági beállítások: műveletenként ki teheti meg, Mindenki, Utazás tagjai, Utazás tulajdonosa vagy Csak adminisztrátor.',
  'help.ctx.admin-defaults.title': 'Alapértelmezett beállítások',
  'help.ctx.admin-defaults.summary':
    'A beállítások, amelyekkel egy új fiók indul, hogy senkinek ne kelljen először a térkép fület megkeresnie: térképszolgáltató, stílus, tokenek és minőség.',
  'help.ctx.admin-defaults.bullet.1':
    'Térképszolgáltató, Mapbox-stílus és -token, CARTO-kulcs és Mapbox-minőség, pontosan úgy, ahogy egy felhasználó a Beállítások, Térkép alatt beállítaná.',
  'help.ctx.admin-defaults.bullet.2':
    'A mezőnkénti visszaállítás a beépített alapértékre a TREK saját választását adja vissza; a felhasználó saját beállítása mindig felülírja ezeket.',
  'help.ctx.admin-config.title': 'Személyre szabás',
  'help.ctx.admin-config.summary':
    'Amit a példány minden utazása megoszt: csomagolási sablonok, a helyek és gyűjtemények kategóriakészlete, és az iskolaiszünet-katalógus, amelyből a Vacay merít.',
  'help.ctx.admin-config.bullet.1':
    'Csomagolási sablonok: nevesített kategória- és tétellisták, amelyekből egy utazás csomagolási listája kiindulhat.',
  'help.ctx.admin-config.bullet.2':
    'Kategóriák: a TREK-ben mindenhol használt kategóriák neve, ikonja és színe, a helyellenőrtől a Gyűjtemények-ig.',
  'help.ctx.admin-config.bullet.3':
    'Iskolai szünetek: az országok és régiók katalógusa azokhoz a helyekhez, amelyeket a beépített források nem fednek le.',
  'help.ctx.admin-settings.title': 'Beállítások',
  'help.ctx.admin-settings.summary':
    'Hogyan jutnak be az emberek és mivel beszélhet a szerver: bejelentkezési és regisztrációs módok, SSO, passkey-k, kétfaktoros szabály, az API-kulcsok térképekhez, helyekhez és képekhez, a kereső- és tömegközlekedési szolgáltatók, és a fájltípusok, amelyeket a feltöltések hordozhatnak.',
  'help.ctx.admin-settings.bullet.1':
    'Authentication Methods: Password Login, Password Registration, SSO Login, SSO Auto-Provisioning és Kétlépcsős hitelesítés (2FA) kötelezővé tétele.',
  'help.ctx.admin-settings.bullet.2':
    'Egyszeri bejelentkezés (OIDC) kibocsátóval, klienssel és megjelenítendő névvel; Passkey-bejelentkezés a Relying Party ID (domain) és az Engedélyezett origók mezőkkel.',
  'help.ctx.admin-settings.bullet.3':
    'API kulcsok: Google Maps, Unsplash és Amap, mindegyik Teszt gombbal; a Mire használja a kulcsot a Google-kulcsot azokra a funkciókra szűkíti, amelyekért fizetni akarsz.',
  'help.ctx.admin-settings.bullet.4':
    'A Helykeresési szolgáltató és a Tömegközlekedési szolgáltató választja ki, ki válaszol a keresésekre és útvonalakra; az Engedélyezett fájltípusok korlátozza a feltöltéseket.',
  'help.ctx.admin-addons.title': 'Bővítmények',
  'help.ctx.admin-addons.summary':
    'A TREK funkciómoduljai, mindegyik egy kapcsolóval: Listák, Költségek, Dokumentumok, Vacay, Atlas, Együttműködés, Útinaplók, Gyűjtemények, Autós út, MCP, AirTrail, Dawarich és az AI-feldolgozás. A kikapcsolt azt jelenti, hogy a navigációs bejegyzés, az útvonalak és az API mindenkinél eltűnik.',
  'help.ctx.admin-addons.bullet.1':
    'Bővítményenként egy csempe a kapcsolójával és, ahol vannak, az opcióinak alsoraival.',
  'help.ctx.admin-addons.bullet.2':
    'A fotószolgáltatók és dokumentumszolgáltatók itt is csempeként jelennek meg, így az Immich vagy a Synology felkínálható a felhasználóknak.',
  'help.ctx.admin-addons.bullet.3': 'A Poggyászkövetés külön kapcsolót kap a csempék alatt.',
  'help.ctx.admin-plugins.title': 'Pluginok',
  'help.ctx.admin-plugins.summary':
    'Külső pluginok, amelyek saját folyamatban futnak a TREK mellett, mindegyik a telepítéskor kért jogosultságokkal. Telepíts a katalógusból, tölts fel egy csomagot, vagy fejlesztés közben csatolj egy mappát.',
  'help.ctx.admin-plugins.bullet.1':
    'A lista: minden telepített plugin verzióval, állapottal, aláírással és a birtokolt jogosultságokkal; soronként aktiválás, deaktiválás, frissítés vagy eltávolítás.',
  'help.ctx.admin-plugins.bullet.2':
    'A Plugin feltöltése csomagfájlt fogad; az Újraszkennelés felveszi a fejlesztéshez csatolt plugin-mappát.',
  'help.ctx.admin-plugins.bullet.3':
    'Engedélyezett hosztok pluginonként: a címek, amelyeket egy plugin hívhat, mivel a kimenő forgalom alapból tiltott.',
  'help.ctx.admin-storage.title': 'Tárhely',
  'help.ctx.admin-storage.summary':
    'Hol élnek a feltöltések: a helyi lemezen, egy S3-bucketben, vagy egy tükrön, amely mindkettőbe ír. Minden feltöltési kategória más backendre mehet, és az Állapot megmondja, válaszol-e minden backend.',
  'help.ctx.admin-storage.bullet.1':
    'Backendek: mindegyik neve és típusa, Tesztelés, Szerkesztés és Eltávolítás gombokkal; a környezet által beállított itt csak olvasható.',
  'help.ctx.admin-storage.bullet.2':
    'Kategóriák: borítók, dokumentumok, útinapló-fotók és a többi, mindegyik egy backendhez rendelve; egy megváltoztatása felajánlja a meglévő fájlok áthelyezését.',
  'help.ctx.admin-storage.bullet.3':
    'Állapot: backendenként egy ellenőrzés, és a magfájl, amely bizonyítja, hogy a konfiguráció az, amit a szerver lát.',
  'help.ctx.admin-notifications.title': 'Értesítések',
  'help.ctx.admin-notifications.summary':
    'A csatornák, amelyeket a példány a felhasználóinak kínál, és azok, amelyek téged mint admint érnek el. A felhasználók a Beállítások alatt választják saját témáikat és URL-jeiket; te döntöd el, mi létezik, és te állítod be az e-mailt.',
  'help.ctx.admin-notifications.bullet.1':
    'In-App, Email (SMTP), Ntfy, Webhook és Web Push: mindegyiknek egy panel, egy kapcsolóval, amely felkínálja a csatornát a felhasználóknak, és a szerveroldali beállítással, amelyre szüksége van.',
  'help.ctx.admin-notifications.bullet.2':
    'Utazási emlékeztetők: küld-e a szerver emlékeztetőt egy utazás kezdete előtt.',
  'help.ctx.admin-notifications.bullet.3':
    'Admin Ntfy és Admin webhook: hová mennek az admin események, például egy sikertelen mentés vagy egy új kiadás, tesztgombbal.',
  'help.ctx.admin-mcp-tokens.title': 'MCP hozzáférés',
  'help.ctx.admin-mcp-tokens.summary':
    'Minden token és OAuth munkamenet, amelyet AI-kliensek tartanak ehhez a TREK-hez, az összes felhasználónál, bármelyik visszavonásának lehetőségével.',
  'help.ctx.admin-mcp-tokens.bullet.1': 'API tokenek: ki hozta létre, mikor használták utoljára, és Törlés.',
  'help.ctx.admin-mcp-tokens.bullet.2':
    'OAuth munkamenetek: a kliens, a felhasználó és a kapott jogosultságok, és Visszavonás.',
  'help.ctx.admin-github.title': 'GitHub',
  'help.ctx.admin-github.summary':
    'Mi új a TREK-ben: a kiadási előzmények a GitHubról, az általad futtatott verzió, és hogy megjelent-e újabb. Maga a frissítés az alkalmazáson kívül, a gazdagépen történik.',
  'help.ctx.admin-github.bullet.1':
    'A Frissítési előzmények a kiadásokat sorolja fel a jegyzeteikkel; a legújabb a Legújabb jelölést viseli, és a te verziód meg van jelölve.',
  'help.ctx.admin-github.bullet.2':
    'A Frissítés elérhető a fejlécben jelenik meg, amint van újabb kiadás, a frissítés módjával Dockerhez és más telepítésekhez.',
  'help.ctx.admin-backup.title': 'Biztonsági mentés',
  'help.ctx.admin-backup.summary':
    'Teljes mentések az adatbázisról és a feltöltésekről, kézzel vagy ütemezetten készítve, a szerveren tárolva és egyetlen fájlként letölthetően. A Visszaállítás visszatesz egyet.',
  'help.ctx.admin-backup.bullet.1':
    'Adatmentés: Mentés készítése, és a meglévők listája Letöltés, Visszaállítás és törlés gombokkal.',
  'help.ctx.admin-backup.bullet.2':
    'A Mentés feltöltése egy másik példányon vagy egy korábbi napon készült fájlt hoz be.',
  'help.ctx.admin-backup.bullet.3': 'Automatikus mentés: be vagy ki, időköz, óra és nap, és hányat kell megtartani.',
  'help.ctx.admin-audit.title': 'Audit',
  'help.ctx.admin-audit.summary':
    'A biztonsági szempontból fontos és adminisztratív események naplója: bejelentkezések és sikertelen próbálkozások, MFA-változások, felhasználó- és beállításváltozások, mentések és visszaállítások. Csak olvasható, a legújabb elöl.',
  'help.ctx.admin-audit.bullet.1':
    'Eseményenként egy sor idővel, felhasználóval, művelettel, erőforrással, IP-vel és részletekkel.',
  'help.ctx.admin-audit.bullet.2': 'A Frissítés újratölt; a Továbbiak betöltése visszafelé lapoz.',
  // create-user
  'help.guide.create-user.title': 'Felhasználó létrehozása',
  'help.guide.create-user.goal': 'Adj hozzá egy fiókot kézzel, meghívó nélkül.',
  'help.guide.create-user.step.1': 'Kattints a Felhasználó létrehozása gombra a Felhasználók fül tetején.',
  'help.guide.create-user.step.2':
    'Add meg a Felhasználónév, E-mail és Jelszó mezőket, és válaszd ki a Szerepkör értékét: Felhasználó vagy Adminisztrátor.',
  'help.guide.create-user.step.3': 'Kattints a Felhasználó létrehozása gombra.',
  'help.guide.create-user.result':
    'A fiók megjelenik a táblázatban és azonnal bejelentkezhet; a jelszót olyan csatornán add át, amelyben megbízol.',
  'help.guide.create-user.tip.1': 'Annak, aki maga választana jelszót, a meghívó link a jobb belépési út.',
  'help.guide.create-user.tip.2':
    'Az adminok látják ezt az oldalt és az auditnaplót; minden más ugyanaz mindkét szerepkörnél.',
  // edit-user
  'help.guide.edit-user.title': 'Felhasználó szerepkörének vagy jelszavának módosítása',
  'help.guide.edit-user.goal': 'Léptess elő valakit, fokozd le, vagy engedd vissza egy elveszett jelszó után.',
  'help.guide.edit-user.step.1':
    'Kattints a ceruzára a felhasználó sorában. A Felhasználó szerkesztése a fiók adataival nyílik meg.',
  'help.guide.edit-user.step.2':
    'Módosítsd a Szerepkör értékét, adj meg Új jelszó értéket, vagy kattints a Passkey-k visszaállítása gombra, ha a személy elvesztette az eszközt, amelyen a passkey-jei voltak, majd Mentés.',
  'help.guide.edit-user.result':
    'A változás a következő kérésnél érvényes; az új jelszó a következő bejelentkezéstől működik.',
  'help.guide.edit-user.tip.1': 'Nem veheted el magadtól az admin szerepkört, amíg te vagy az utolsó admin.',
  'help.guide.edit-user.tip.2':
    'A passkey-k visszaállítása megtartja a jelszót; a személy a Beállítások, Fiók alatt ad hozzá új passkey-ket.',
  // invite-links
  'help.guide.invite-links.title': 'Meghívás linkkel',
  'help.guide.invite-links.goal':
    'Engedd, hogy valaki zárt példányon regisztráljon, és ha akarod, egy utazásban landoljon.',
  'help.guide.invite-links.step.1': 'A Meghívó linkek alatt kattints a Link létrehozása gombra.',
  'help.guide.invite-links.step.2':
    'Állítsd be a Max. használat és Lejárat értékét, opcionálisan a Hozzáadás utazáshoz (opcionális) mezőt, és kattints a Létrehozás és másolás gombra.',
  'help.guide.invite-links.step.3':
    'Küldd el a linket. Minden sor mutatja, hányszor használták és ki hozta létre; a Link másolása újra kimásolja, az elhasznált vagy lejárt linkek pedig Elhasználva vagy Lejárt jelölést kapnak.',
  'help.guide.invite-links.result':
    'Aki megnyitja a linket, saját jelszóval regisztrál, és választott utazás esetén azonnal csatlakozik hozzá.',
  'help.guide.invite-links.tip.1':
    'A meghívó linkek akkor is működnek, ha a Password Registration ki van kapcsolva a Beállítások alatt.',
  'help.guide.invite-links.tip.2':
    'Egy egyszer használatos, rövid lejáratú link a legbiztonságosabb alapértelmezés egyetlen személynek.',
  // delete-user
  'help.guide.delete-user.title': 'Felhasználó törlése',
  'help.guide.delete-user.goal': 'Távolíts el egy fiókot és mindent, ami csak az övé.',
  'help.guide.delete-user.step.1':
    'Kattints a kuka ikonra a felhasználó sorában, és erősítsd meg a Felhasználó törlése műveletet.',
  'help.guide.delete-user.result':
    'A fiók, a saját utazásai és az útinaplói eltűnnek; a másokkal megosztott utazások a többi tagnál maradnak.',
  'help.guide.delete-user.tip.1': 'Nincs visszavonás. Ha nem vagy biztos benne, készíts előbb mentést.',
  'help.guide.delete-user.tip.2': 'Az utolsó admin nem törölhető; előbb tegyél mást adminná.',
  // permissions
  'help.guide.permissions.title': 'Döntsd el, ki mit tehet',
  'help.guide.permissions.goal': 'Állítsd be műveletenként, melyik szerepkör végezheti el ezen a TREK-en.',
  'help.guide.permissions.step.1':
    'A Jogosultsági beállítások alatt keresd meg a műveletet a csoportjában, például az Utazások törlése műveletet az Utazáskezelés alatt, és válaszd ki a szintet: Mindenki, Utazás tagjai, Utazás tulajdonosa vagy Csak adminisztrátor. A módosított sor testreszabott jelölést kap.',
  'help.guide.permissions.step.2':
    'Kattints a Mentés gombra. Az Alapértelmezések visszaállítása minden sort visszatesz a beépített szintre.',
  'help.guide.permissions.result':
    'A szabály egyszerre érvényes minden utazásra; a szint alatti emberek gombjai és menüi eltűnnek.',
  'help.guide.permissions.tip.1':
    'Az Utazás tulajdonosa az a személy, aki létrehozta az utazást; az adminok mindig mindent megtehetnek.',
  'help.guide.permissions.tip.2':
    'Inkább csökkents egy szintet, mint hogy törölj egy tagot: aki nem szerkeszthet, még olvashat és hozzászólhat.',
  // default-map
  'help.guide.default-map.title': 'Térkép-alapértelmezések beállítása új felhasználóknak',
  'help.guide.default-map.goal': 'Adj minden új fióknak működő térképet személyes token nélkül.',
  'help.guide.default-map.step.1':
    'A Térkép alatt válaszd ki a Térképmotor értékét, és Mapbox vagy MapLibre esetén a Térképstílus, a Megosztott Mapbox-token és a Kiváló minőségű mód értékét; rasztertérképhez a Térkép sablon és a Megosztott CARTO-kulcs értékét.',
  'help.guide.default-map.step.2':
    'Minden megváltoztatott mező mellett a visszaállítás a TREK saját választását adja vissza. A bal oldali Alapértelmezett felhasználói beállítások ugyanezt teszi a Színmód, a mértékegységek és a pénznem esetében.',
  'help.guide.default-map.result':
    'Az új fiókok ezekkel indulnak; aki a Beállítások alatt saját térképet állított be, megtartja a sajátját.',
  'help.guide.default-map.tip.1':
    'Az itt megadott tokent mindenki használja, akinek nincs sajátja, úgyhogy figyelj a kvótájára.',
  'help.guide.default-map.tip.2':
    'A meglévő fiókok, amelyek soha nem nyúltak a térkép fülhöz, szintén ezeket az alapértelmezéseket követik.',
  // packing-templates
  'help.guide.packing-templates.title': 'Csomagolási sablon összeállítása',
  'help.guide.packing-templates.goal': 'Adj az utazásoknak egy csomagolási listát kiindulásnak az üres helyett.',
  'help.guide.packing-templates.step.1': 'Kattints az Új sablon gombra, írj be egy nevet, és erősítsd meg a pipával.',
  'help.guide.packing-templates.step.2':
    'Nyisd meg a sablont és kattints a Kategória hozzáadása gombra; minden kategória alatt a + tételeket ad hozzá, és egy tételnek csak név kell.',
  'help.guide.packing-templates.step.3':
    'Minden menet közben mentődik. A ceruza átnevez egy sablont, kategóriát vagy tételt, a kuka törli.',
  'help.guide.packing-templates.result':
    'A sablon minden utazás csomagolási listáján felkínálódik; alkalmazása lemásolja a tételeket, így egy utazás szabadon módosíthatja őket.',
  'help.guide.packing-templates.tip.1': 'Utazástípusonként egy sablon, strand, város, túra, jobb egy óriási listánál.',
  'help.guide.packing-templates.tip.2': 'Egy sablon törlése nem érinti azokat az utazásokat, amelyek már alkalmazták.',
  // categories
  'help.guide.categories.title': 'A kategóriakészlet kezelése',
  'help.guide.categories.goal':
    'Döntsd el, milyen kategóriákat hordozhatnak a helyek és gyűjtemények, és hogyan nézzenek ki.',
  'help.guide.categories.step.1':
    'Kattints az Új kategória gombra, adj neki nevet, válassz ikont és színt; az Előnézet mutatja az eredményt. Kattints a Létrehozás gombra.',
  'help.guide.categories.step.2':
    'Vidd az egeret egy kategória fölé a listában a szerkesztéshez vagy törléshez. A törlés megerősítést kér.',
  'help.guide.categories.result':
    'A készlet mindenhol egyszerre érvényes: a helyellenőrben, a térképtűkön, a Gyűjtemények-ben és a szűrőkben.',
  'help.guide.categories.tip.1':
    'A helyek megtartják a kategória-azonosítójukat, így egy kategória átnevezése minden helyen átnevezi.',
  'help.guide.categories.tip.2':
    'Egy törölt kategória kategória nélkül hagyja a helyeit; ha ez számít, előbb rendeld át őket.',
  // school-holiday-catalog
  'help.guide.school-holiday-catalog.title': 'Iskolai szünetek kézi karbantartása',
  'help.guide.school-holiday-catalog.goal': 'Fedj le egy országot vagy régiót, amelyet a beépített szünetforrások nem.',
  'help.guide.school-holiday-catalog.step.1':
    'Az Iskolai szünetek alatt kattints az Ország hozzáadása gombra, add meg az Ország és az Országkód (pl. US) értékét, és Mentés; majd Régió hozzáadása minden eltérő részéhez.',
  'help.guide.school-holiday-catalog.step.2':
    'Kattints egy régióra a Régió vagy tankerület megnyitásához: Időszak hozzáadása, adj mindegyiknek Szünet neve, Kezdő dátum és Záró dátum értéket, és Mentés. A kuka eltávolít egy időszakot, egy régiót, vagy, ha már nincs régiója, egy országot.',
  'help.guide.school-holiday-catalog.result':
    'A felhasználók a Vacay Beállítások alatt találják meg az országot és régiót, és az évrácsukon látják az időszakokat.',
  'help.guide.school-holiday-catalog.tip.1':
    'A beépített forrásokból származó régiók itt nem szerkeszthetők; ha egy dátum hibás, adj mellé egy kézi régiót.',
  // auth-methods
  'help.guide.auth-methods.title': 'Döntsd el, hogyan jelentkeznek be az emberek',
  'help.guide.auth-methods.goal':
    'Nyisd meg vagy zárd le a jelszavas bejelentkezést, az SSO-t és a regisztrációt, és tedd kötelezővé a 2FA-t.',
  'help.guide.auth-methods.step.1':
    'Az Authentication Methods alatt kapcsold be vagy ki a Password Login és a Password Registration kapcsolót. Kikapcsolt regisztráció esetén új fiók csak meghívó linken, SSO-n vagy kézzel jön létre.',
  'help.guide.auth-methods.step.2':
    'Az SSO Login és az SSO Auto-Provisioning a lent beállított Egyszeri bejelentkezés (OIDC) meglétét igényli; az automatikus létrehozás az első SSO-bejelentkezéskor hoz létre fiókot.',
  'help.guide.auth-methods.step.3':
    'A Kétlépcsős hitelesítés (2FA) kötelezővé tétele minden jelszavas bejelentkezést hitelesítő beállítására kényszerít a következő belépéskor. A Passkey-bejelentkezés a Relying Party ID (domain) és az Engedélyezett origók mezőket igényli, vagyis a címeket, amelyeken a TREK-ed elérhető.',
  'help.guide.auth-methods.result':
    'A bejelentkezési oldal pontosan azokat a módokat kínálja, amelyeket bekapcsolva hagytál.',
  'help.guide.auth-methods.tip.1':
    'Figyelmeztetés jelenik meg, mielőtt kizárnád magad: az adminok számára legalább egy belépési út bekapcsolva marad.',
  'help.guide.auth-methods.tip.2': 'A környezeti változókkal beállított értékek itt csak olvashatóként jelennek meg.',
  // oidc
  'help.guide.oidc.title': 'Egyszeri bejelentkezés csatlakoztatása',
  'help.guide.oidc.goal': 'Engedd, hogy az emberek az identitásszolgáltatóddal jelentkezzenek be.',
  'help.guide.oidc.step.1':
    'Az Egyszeri bejelentkezés (OIDC) alatt add meg a gomb Megjelenítendő név értékét, valamint a szolgáltatódtól kapott Issuer URL, Client ID és Client Secret értékeket, majd Mentés.',
  'help.guide.oidc.step.2': 'Kapcsold be az SSO Login kapcsolót az Authentication Methods alatt.',
  'help.guide.oidc.result':
    'A bejelentkezési oldal mutatja az SSO gombot; bekapcsolt SSO Auto-Provisioning mellett az először belépők automatikusan fiókot kapnak.',
  'help.guide.oidc.tip.1':
    'A szolgáltatód által kért redirect URI a TREK-ed címe plusz az OIDC callback útvonal a dokumentációból.',
  'help.guide.oidc.tip.2':
    'A claim-leképezés dönti el, mely SSO-csoportok lesznek adminok; lásd az OIDC oldalt a dokumentációban.',
  // instance-keys
  'help.guide.instance-keys.title': 'Az API-kulcsok megadása',
  'help.guide.instance-keys.goal':
    'Oldd fel a Google helykeresést, az Unsplash-borítókat és az Amapot az egész példányon.',
  'help.guide.instance-keys.step.1':
    'Az API kulcsok alatt illeszd be a Google Maps API kulcs értékét, és kattints a Teszt gombra; a mező megmondja, válaszol-e a kulcs.',
  'help.guide.instance-keys.step.2':
    'A Mire használja a kulcsot alatt csak azokat a funkciókat kapcsold be, amelyeket erre a kulcsra akarsz számláztatni: Hely automatikus kiegészítése, Hely részletei, Helyfotók, Helyek gazdagítása, Helykeresési napló.',
  'help.guide.instance-keys.step.3':
    'Az Unsplash API-kulcs a borítókeresést hajtja; az Amap (高德地图) API-kulcs a kínai helykeresést. Mindegyiket ugyanúgy teszteld.',
  'help.guide.instance-keys.result':
    'A felhasználók saját kulcs nélkül kapják a funkciókat; Google-kulcs nélkül a TREK az ingyenes OpenStreetMap-készleten és a TREK Places API-n keresztül keres.',
  'help.guide.instance-keys.tip.1':
    'Egy felhasználó személyes kulcsa a Beállítások alatt felülírja a példánykulcsot annál a felhasználónál.',
  'help.guide.instance-keys.tip.2':
    'A kulcsok környezeti változókból is jöhetnek; azok itt csak olvashatóként jelennek meg.',
  // places-transit
  'help.guide.places-transit.title': 'A kereső- és tömegközlekedési szolgáltató kiválasztása',
  'help.guide.places-transit.goal': 'Döntsd el, ki válaszol a helykeresésekre és a tömegközlekedési útvonalakra.',
  'help.guide.places-transit.step.1':
    'A Helykeresési szolgáltató alatt válassz: Automatikus, Google Places, Amap (高德地图) vagy OpenStreetMap. Az Automatikus a létező legjobb kulcsot használja.',
  'help.guide.places-transit.step.2':
    'A Tömegközlekedési szolgáltató alatt válaszd a Transitous (ingyenes) lehetőséget, amely világszerte és kulcs nélkül működik, vagy a Google-t, amelyhez Google-kulcs kell.',
  'help.guide.places-transit.result':
    'A TREK minden keresőmezője és minden tömegközlekedési útvonala ezt a választást követi.',
  'help.guide.places-transit.tip.1':
    'A kulcs nélküli szolgáltató itt figyelmeztetést mutat, és visszaesik az OpenStreetMapre.',
  'help.guide.places-transit.tip.2': 'A Google tömegközlekedési útvonalait kérésenként számlázzák; a Transitous-t nem.',
  // file-types
  'help.guide.file-types.title': 'A fájltípusok korlátozása',
  'help.guide.file-types.goal': 'Döntsd el, milyen kiterjesztésű fájlok tölthetők fel.',
  'help.guide.file-types.step.1':
    'Az Engedélyezett fájltípusok alatt szerkeszd a vesszővel elválasztott kiterjesztéslistát, és mentsd el.',
  'help.guide.file-types.result':
    'Minden más típusú feltöltést egyértelmű üzenettel utasít el, a dokumentumokban, az útinaplóban és a borítóknál.',
  'help.guide.file-types.tip.1':
    'Hagyd a képtípusokat a listában; a borítók és az útinapló-fotók ugyanezen az ellenőrzésen mennek át.',
  // toggle-addon
  'help.guide.toggle-addon.title': 'Bővítmény be- vagy kikapcsolása',
  'help.guide.toggle-addon.goal': 'Kínálj fel egy funkciómodult mindenkinek, vagy vedd el.',
  'help.guide.toggle-addon.step.1':
    'Billentsd át a kapcsolót a bővítmény csempéjén. A navigációs bejegyzés mindenkinél egyszerre jelenik meg vagy tűnik el.',
  'help.guide.toggle-addon.step.2':
    'Néhány csempe alsorokat hordoz az opcióihoz, például a Poggyászkövetés a Listák alatt vagy a fotószolgáltatók az Útinaplók alatt; csak addig látszanak, amíg a bővítmény be van kapcsolva.',
  'help.guide.toggle-addon.result':
    'A kikapcsolt bővítmény adatai megmaradnak; a visszakapcsolás újra megmutatja őket.',
  'help.guide.toggle-addon.tip.1':
    'Az MCP kikapcsolása eltávolítja a végpontot és a tőle függő Integrációk szakaszokat.',
  'help.guide.toggle-addon.tip.2':
    'A Vacay, az Atlas és az Útinaplók a felhasználók által legtöbbször kért bővítmények; a Dokumentumok tárhelyet igényel a feltöltésekhez.',
  // install-plugin
  'help.guide.install-plugin.title': 'Plugin telepítése',
  'help.guide.install-plugin.goal': 'Adj hozzá egy külső plugint, és add meg neki pontosan a kért jogosultságokat.',
  'help.guide.install-plugin.step.1':
    'Nyisd meg a Felfedezés fület, válassz egy plugint, és kattints a Telepítés gombra; vagy kattints a Plugin feltöltése gombra, és válassz egy .zip vagy .tar.gz csomagot.',
  'help.guide.install-plugin.step.2':
    'Vissza a Telepítve alatt olvasd el a sort: mit olvashat vagy írhat a plugin, mely hosztokat hívja, és alá van-e írva. Kapcsold be a Plugin engedélyezése kapcsolót.',
  'help.guide.install-plugin.step.3':
    'A sor menüje az Újraindítás, Hibanapló megtekintése, Engedélyezett hosztok és Verzióváltás… lehetőségeket kínálja; a Törlés eltávolítja. Frissítést a sor akkor kínál, ha van újabb verzió, és az, amelyik új jogokat kér, kikapcsolva marad, amíg jóvá nem hagyod őket.',
  'help.guide.install-plugin.result':
    'A plugin saját folyamatban fut; amit hozzáad, widgetek, térképrétegek, eszközök, ott jelenik meg, ahol a plugin deklarálja.',
  'help.guide.install-plugin.tip.1': 'Az Újraszkennelés csomag nélkül veszi fel a fejlesztéshez csatolt plugin-mappát.',
  'help.guide.install-plugin.tip.2':
    'Az aláíratlan plugin ekként van megjelölve; csak akkor telepítsd, ha megbízol a forrásában.',
  // storage-backends
  'help.guide.storage-backends.title': 'Feltöltések áthelyezése S3-ra vagy tükörre',
  'help.guide.storage-backends.goal': 'Tartsd a fájlokat objektumtárolón, vagy lemezen és bucketben egyszerre.',
  'help.guide.storage-backends.step.1':
    'A Backendek alatt kattints a Backend hozzáadása gombra, adj neki Név értéket, válassz Típus értéket, Helyi, S3 vagy Tükör, töltsd ki a mezőket, és Alkalmaz. A Tesztelés ellenőrzi a kapcsolatot, a Módosítások mentése írja be.',
  'help.guide.storage-backends.step.2':
    'A Kategóriák alatt rendelj minden feltöltési kategóriát egy backendhez. Egy megváltoztatása megkérdezi, hogy Meglévő objektumok áthelyezése vagy Csak az új írások irányítása legyen.',
  'help.guide.storage-backends.step.3':
    'A felső Állapot minden backendet ellenőriz; egy piros bejegyzés megnevezi, mi hibázott.',
  'help.guide.storage-backends.result':
    'Az új feltöltések a hozzárendelt backendre mennek; az áthelyezett fájlokat onnan szolgálja ki.',
  'help.guide.storage-backends.tip.1': 'A környezeti változókkal beállított backend látszik, de itt nem szerkeszthető.',
  'help.guide.storage-backends.tip.2':
    'A tükör mindkét célba ír és az elsőből olvas; használd leállás nélküli migráláshoz.',
  // channels-instance
  'help.guide.channels-instance.title': 'Az értesítési csatornák beállítása',
  'help.guide.channels-instance.goal':
    'Döntsd el, mely csatornákat választhatják a felhasználók, és állítsd be az e-mailt.',
  'help.guide.channels-instance.step.1':
    'Az Email (SMTP) alatt add meg az SMTP Host, SMTP Port, SMTP User, SMTP Password és From Address értékeket; a Teszt e-mail küldése neked küld egy levelet.',
  'help.guide.channels-instance.step.2':
    'Kapcsold be a Web Push, az Ntfy és a Webhook kapcsolót a felkínálásukhoz; a felhasználók ezután a Beállítások, Értesítések alatt eszközönként bekapcsolják a pusht, vagy megadják saját témájukat vagy URL-jüket.',
  'help.guide.channels-instance.step.3':
    'Az Utazási emlékeztetők az utazás kezdete előtti emlékeztetőt kapcsolja; az In-App mindig be van kapcsolva, és itt csak magyarázat van hozzá.',
  'help.guide.channels-instance.result': 'Minden felhasználó Értesítések füle a bekapcsolt csatornákat mutatja.',
  'help.guide.channels-instance.tip.1':
    'Az itt megadott alapértelmezett ntfy-szerver előre ki van töltve a felhasználóknak; továbbra is megadhatják a sajátjukat.',
  'help.guide.channels-instance.tip.2':
    'A plugin-csatornák maguktól megjelennek, amint aktív egy ilyen képességű plugin.',
  // admin-channels
  'help.guide.admin-channels.title': 'Admin események a telefonodra',
  'help.guide.admin-channels.goal': 'Értesülj a sikertelen mentésekről, új kiadásokról és más példányeseményekről.',
  'help.guide.admin-channels.step.1':
    'Az Admin Ntfy alatt adj meg egy témát és, ha kell, szervert és tokent; az Admin webhook alatt egy URL-t.',
  'help.guide.admin-channels.step.2':
    'Kattints a Teszt Ntfy küldése vagy a Teszt webhook küldése gombra, hogy lásd megérkezni egy üzenetet.',
  'help.guide.admin-channels.result':
    'Az admin események oda mennek, minden admin alkalmazáson belüli csengője mellett.',
  'help.guide.admin-channels.tip.1':
    'Tartsd az admin témát külön a személyesedtől, hogy egy leállás ne vesszen el az utazási csevegésben.',
  // mcp-tokens-admin
  'help.guide.mcp-tokens-admin.title': 'AI-hozzáférés visszavonása',
  'help.guide.mcp-tokens-admin.goal':
    'Lásd és vágd el minden tokent és munkamenetet, amelyet egy AI-kliens tart, bármelyik felhasználónál.',
  'help.guide.mcp-tokens-admin.step.1':
    'Az API tokenek alatt keresd meg a tokent felhasználó és név szerint; a kuka törli, és a kliens azonnal leáll.',
  'help.guide.mcp-tokens-admin.step.2':
    'Az OAuth munkamenetek alatt ugyanez a böngészőalapú kliensekhez: kliens, felhasználó és dátum, és a kuka visszavonja a munkamenetet.',
  'help.guide.mcp-tokens-admin.result':
    'A klienst a felhasználójának újra kell csatlakoztatnia; semmi más nem változik.',
  'help.guide.mcp-tokens-admin.tip.1':
    'A jogosultságok megmondják, mit tehetett egy kliens; egy csak olvasható jogosultságot veszélytelen meghagyni.',
  'help.guide.mcp-tokens-admin.tip.2': 'Az MCP bővítmény kikapcsolása mindent egyszerre visszavon.',
  // release-history
  'help.guide.release-history.title': 'Új kiadás ellenőrzése',
  'help.guide.release-history.goal': 'Tudd, naprakész-e a TREK-ed, és mit hoz a következő verzió.',
  'help.guide.release-history.step.1':
    'Ha van újabb kiadás, a Frissítés elérhető az admin oldal tetején jelenik meg; a Megtekintés a GitHubon megnyitja, a Frissítési útmutató pedig elmagyarázza a frissítést Dockerhez és más telepítésekhez.',
  'help.guide.release-history.step.2':
    'A Frissítési előzmények minden kiadást felsorol a jegyzeteivel; a Részletek megjelenítése kibontja őket, a legújabb a Legújabb jelölést viseli, a Továbbiak betöltése pedig visszafelé lapoz.',
  'help.guide.release-history.result':
    'A frissítés a gazdagépen történik, az új image lehúzásával vagy az új tag buildelésével; az adatkönyvtár marad.',
  'help.guide.release-history.tip.1': 'Frissítés előtt készíts mentést; a Biztonsági mentés fül itt van mellette.',
  'help.guide.release-history.tip.2':
    'Az előzetes kiadások látszanak, de nem jelennek meg frissítésként, hacsak nem ilyet futtatsz.',
  // create-backup
  'help.guide.create-backup.title': 'Mentés készítése és visszaállítása',
  'help.guide.create-backup.goal':
    'Készíts pillanatképet az egész példányról, tarts másolatot máshol, és tudd visszatenni.',
  'help.guide.create-backup.step.1':
    'Az Adatmentés alatt kattints a Mentés készítése gombra. Egyetlen fájlba csomagolja az adatbázist és a feltöltéseket a szerveren.',
  'help.guide.create-backup.step.2':
    'A Letöltés a gépen kívül tart egy másolatot; a kuka törli a régieket, hogy helyet szabadítson fel.',
  'help.guide.create-backup.step.3':
    'A Visszaállítás egy mentésen, vagy a Mentés feltöltése egy fájllal, lecseréli a jelenlegi adatokat, miután a Mentés visszaállítása? egyszer rákérdezett.',
  'help.guide.create-backup.result':
    'A visszaállítás a felhasználókat, utazásokat, fájlokat és beállításokat a mentés időpontjának állapotára hozza vissza; mindenki ki lesz jelentkeztetve.',
  'help.guide.create-backup.tip.1':
    'A visszaállítás itt az egyetlen művelet, amely nem vonható vissza. Készíts előbb friss mentést.',
  'help.guide.create-backup.tip.2':
    'A mentések az adatkönyvtárban élnek; egy másik gépen lévő másolat teszi őket igazi mentéssé.',
  // auto-backup
  'help.guide.auto-backup.title': 'Mentések ütemezése',
  'help.guide.auto-backup.goal': 'Hagyd, hogy a szerver magától mentsen, és csak az utolsó néhányat tartsa meg.',
  'help.guide.auto-backup.step.1':
    'Az Automatikus mentés alatt kapcsold be az Automatikus mentés engedélyezése kapcsolót, és válaszd ki az Időköz, a Futtatás időpontja és, heti vagy havi esetén, A hét napja vagy A hónap napja értékét.',
  'help.guide.auto-backup.step.2':
    'A Régi mentések törlése ennyi idő után adja meg, meddig marad meg egy mentés; a régebbiek eltűnnek, amikor új készül.',
  'help.guide.auto-backup.result':
    'A mentések ütemezés szerint jelennek meg a listában; egy hiba eléri az admin csatornákat.',
  'help.guide.auto-backup.tip.1': 'Az időpontok a szerver időzónáját követik, amely az Audit fülön látható.',
  'help.guide.auto-backup.tip.2': 'A szerver tárhelye véges; három-öt megtartása általában elég.',
  // audit-log
  'help.guide.audit-log.title': 'Az auditnapló olvasása',
  'help.guide.audit-log.goal': 'Derítsd ki, ki mit csinált, és mikor.',
  'help.guide.audit-log.step.1':
    'Olvasd a sorokat: idő, felhasználó, művelet, erőforrás, IP és részletek, a legújabb elöl. A műveletek arról vannak elnevezve, ami történt, például bejelentkezési hiba, MFA-változás vagy visszaállítás.',
  'help.guide.audit-log.step.2': 'A Frissítés újratölti a tetejét; a Továbbiak betöltése visszafelé lapoz.',
  'help.guide.audit-log.result': 'Egy nyom, amelyet átadhatsz bárkinek, aki megkérdezi, miért változott valami.',
  'help.guide.audit-log.tip.1':
    'Az időpontok a szerver időzónájában látszanak, amely a táblázat felett van megnevezve.',
  'help.guide.audit-log.tip.2':
    'A napló csak bővíthető; itt semmit nem lehet szerkeszteni vagy törölni az alkalmazásból.',
  // document-providers
  'help.guide.document-providers.title': 'Dokumentumtár felkínálása',
  'help.guide.document-providers.goal': 'Döntsd el, mely tárolókkal tarthatja egy utazás a dokumentumait szinkronban.',
  'help.guide.document-providers.step.1':
    'A Dokumentumok csempe a polcán sorokként viszi a tárolókat: Paperless-ngx, Papra, Nextcloud, OpenCloud és Synology Drive. Mind az öt kikapcsolva indul, és a polc csak addig van ott, amíg maga a Dokumentumok be van kapcsolva.',
  'help.guide.document-providers.step.2':
    'Billentsd át a kapcsolót a Nextcloud sorában. Az üzenet Bővítmény frissítve, és ezentúl az utak tulajdonosai megtalálják a Dokumentumok szinkronizálása gombot az utazásaik Fájlok fülén, a Nextcloudot pedig a Szolgáltató csatlakoztatása alatt.',
  'help.guide.document-providers.result':
    'A tároló ennek a TREK-nek minden utazásán felkínálva áll; semmi nincs csatlakoztatva, amíg egy út tulajdonosa meg nem teszi.',
  'help.guide.document-providers.tip.1':
    'Itt csak az dől el, felkínálható-e egy tároló. A cím és a hitelesítő adatok egy utazáshoz tartoznak, és az út tulajdonosa adja meg őket a Fájlok fülön, soha nem az adminfelületen.',
  'help.guide.document-providers.tip.2':
    'A Dokumentumok kikapcsolása minden tárolót kikapcsol vele együtt, és egy tároló nem kapcsolható be, amíg a Dokumentumok ki van kapcsolva: a szerver azt válaszolja: Enable the Documents addon first. A saját hálózatodon lévő tárolóhoz a szerveren ALLOW_INTERNAL_NETWORK=true is kell.',

  // ── Screen: trip ──────────────────────────────────────────────────────────────────────
  'help.ctx.trip.title': 'Utazás',
  'help.ctx.trip.summary':
    'Egy utazás, az egész: a terv a napjaival, térképével és helyeivel, meg a fülek a közlekedéshez, foglalásokhoz, listákhoz, költségekhez, fájlokhoz és együttműködéshez. Mindegyiknek saját súgóképernyője van ez alatt.',
  'help.ctx.trip.bullet.1':
    'A fülsor: Terv, Közlekedés, Foglalások, Listák, Költségek, Fájlok és Együttműködés. Hogy melyik fülek léteznek a TREK-eden, azt a bővítmények és pluginok döntik el.',
  'help.ctx.trip.bullet.2':
    'A Terv három oszlop: balra a napok, középen a térkép, jobbra a helyek. A foglalások és a közlekedés a terven belül élnek, a megállónál és a megállók között; a fülek felsorolják őket.',
  'help.ctx.trip.bullet.3':
    'A jobb felső Megosztás az utazás embereit nyitja meg: tagok, vendégek, a meghívó link és a csak olvasható nyilvános link.',
  'help.ctx.trip.bullet.4':
    'A címet, a dátumokat, a borítót és a pénznemet az Utazásaim alatt szerkeszted, az utazáskártya ceruzájával.',
  'help.ctx.trip.bullet.5':
    'Az oszlop belső szélén lévő nyilak összecsukják, és a helyet a térkép veszi át; az oszlop melletti vékony elválasztó a szélességét változtatja.',
  'help.ctx.trip.bullet.6': 'A napok eszköztárában a visszavonás nyíl visszaveszi a terv utolsó módosítását.',
  // add-member
  'help.guide.add-member.title': 'Tag hozzáadása',
  'help.guide.add-member.goal': 'Adj hozzáférést ehhez az utazáshoz valakinek, akinek van TREK-fiókja.',
  'help.guide.add-member.step.1': 'Kattints a jobb felső Megosztás gombra.',
  'help.guide.add-member.step.2':
    'A Felhasználó meghívása alatt válaszd ki a személyt a listából, és kattints a Meghívás gombra.',
  'help.guide.add-member.step.3':
    'A személy most a Hozzáférés alatt jelenik meg. A korona a tulajdonost jelöli; a sor végén lévő ikon újra eltávolítja a hozzáférést.',
  'help.guide.add-member.result':
    'A tag ugyanúgy látja és szerkeszti az utazást, mint te, azokon a szinteken belül, amelyeket az admin a Jogosultsági beállítások alatt megadott.',
  'help.guide.add-member.tip.1':
    'Aki hiányzik a listáról, annak még nincs TREK-fiókja: add hozzá vendégként, vagy hagyd, hogy meghívó linken keresztül regisztráljon.',
  'help.guide.add-member.tip.2':
    'A Hozzáférés melletti szám az utazás embereit számolja; a vendégek külön, lejjebb szerepelnek.',
  // trip-invite-link
  'help.guide.trip-invite-link.title': 'Meghívás linkkel',
  'help.guide.trip-invite-link.goal': 'Hagyd, hogy az emberek maguk csatlakozzanak az utazáshoz.',
  'help.guide.trip-invite-link.step.1':
    'Kattints a Megosztás gombra, majd a Meghívó link az utazáshoz alatt a Meghívó link létrehozása gombra.',
  'help.guide.trip-invite-link.step.2':
    'Kattints a Másolás gombra, és küldd el a linket. Bárki, akinek van TREK-fiókja és megnyitja, tagként csatlakozik.',
  'help.guide.trip-invite-link.step.3':
    'Az Újragenerálás lecseréli a linket, és a régit használhatatlanná teszi; a Letiltás kikapcsolja.',
  'help.guide.trip-invite-link.result':
    'Aki megnyitja a linket, benne van az utazásban, és megjelenik a Hozzáférés alatt.',
  'help.guide.trip-invite-link.tip.1':
    'Aki fiók nélkül van, nem tudja használni. Az admin az Adminisztráció, Felhasználók alatt oszt regisztrációs linkeket, és egyet ehhez az utazáshoz is köthet.',
  'help.guide.trip-invite-link.tip.2':
    'Használd az Újragenerálás gombot, ha egy link rossz csevegésbe került: a régi azonnal megszűnik működni.',
  // add-guest
  'help.guide.add-guest.title': 'Vendég hozzáadása fiók nélkül',
  'help.guide.add-guest.goal': 'Számíts bele valakit, aki nem használja a TREK-et.',
  'help.guide.add-guest.step.1': 'Kattints a Megosztás gombra, és görgess a Vendégek részhez.',
  'help.guide.add-guest.step.2': 'Írd be a nevet a Vendég neve mezőbe, és kattints a Vendég hozzáadása gombra.',
  'help.guide.add-guest.result':
    'A vendég hozzárendelhető költségekhez, csomagolási tételekhez és feladatokhoz, de nem tud bejelentkezni.',
  'help.guide.add-guest.tip.1':
    'A ceruza átnevezi a vendéget; a sor végén lévő ikon a részesedéseivel és hozzárendeléseivel együtt eltávolítja.',
  'help.guide.add-guest.tip.2': 'Ha a személy később fiókot kap, hívd meg tagként, és távolítsd el a vendéget.',
  // public-link
  'help.guide.public-link.title': 'Csak olvasható link közzététele',
  'help.guide.public-link.goal': 'Mutasd meg az utazást olyanoknak, akiknek nem szabad szerkeszteniük.',
  'help.guide.public-link.step.1':
    'Kattints a Megosztás gombra; jobbra, a Nyilvános link alatt pipáld ki, mit mutathat a link. A Térkép és terv mindig be van kapcsolva; a Foglalások, Csomagolás, Költségek és Csevegés rajtad múlik.',
  'help.guide.public-link.step.2': 'Kattints a Link létrehozása, majd a Másolás gombra.',
  'help.guide.public-link.step.3': 'A pipák változtathatók, amíg a link létezik; a Link törlése leállítja.',
  'help.guide.public-link.result':
    'Bárki, akinél ott a link, bejelentkezés nélkül látja a kiválasztott részeket, és semmit sem módosíthat.',
  'help.guide.public-link.tip.1':
    'A link sehol nincs felsorolva; aki birtokolja, megnyithatja, ezért kezeld jelszóként.',
  'help.guide.public-link.tip.2': 'Szerkesztési jogokhoz inkább tagként add hozzá a személyt.',
  // transfer-ownership
  'help.guide.transfer-ownership.title': 'Az utazás átadása vagy elhagyása',
  'help.guide.transfer-ownership.goal': 'Tegyél mást tulajdonossá, vagy lépj ki egy utazásból, amely nem a tiéd.',
  'help.guide.transfer-ownership.step.1':
    'Kattints a Megosztás gombra. A Hozzáférés alatt a tag sorában lévő korona azt a személyt teszi tulajdonossá; erősítsd meg a kérdést.',
  'help.guide.transfer-ownership.step.2':
    'A saját sorodban az Utazás elhagyása kivesz az utazásból; tulajdonosként előbb add át.',
  'help.guide.transfer-ownership.result':
    'Az új tulajdonos kezeli a tagokat, és törölheti az utazást; te sima tag maradsz.',
  'help.guide.transfer-ownership.tip.1':
    'A tulajdonos az, aki az utazást létrehozta, amíg át nem adja; az utazás törlése egyedül az övé.',
  'help.guide.transfer-ownership.tip.2':
    'A Hozzáférés eltávolítása egy másik sorban ugyanaz a gomb fordítva: a tulajdonos kivesz egy tagot.',
  // collapse-columns
  'help.guide.collapse-columns.title': 'Hely a térképnek',
  'help.guide.collapse-columns.goal': 'Csukj össze egy oszlopot, vagy adj neki nagyobb szélességet.',
  'help.guide.collapse-columns.step.1':
    'Kattints a napok oszlopának belső szélén lévő nyílra az összecsukásához; a helyet a térkép veszi át. A helyek oszlopán ugyanez a nyíl van.',
  'help.guide.collapse-columns.step.2': 'Kattints újra a nyílra, hogy visszahozd az oszlopot.',
  'help.guide.collapse-columns.step.3':
    'Húzd az oszlop és a térkép közötti vékony elválasztót az oszlop szélességének módosításához.',
  'help.guide.collapse-columns.result':
    'A szélességeket megjegyzi; az oszlopok a következő látogatáskor nyitva térnek vissza.',
  'help.guide.collapse-columns.tip.1': 'Mindkét oszlop egyszerre összecsukható, csak térképes nézethez.',
  'help.guide.collapse-columns.tip.2':
    'Telefonon nincsenek oszlopok: a Tervezés és a Helyek a térkép alján lévő két gomb.',
  // undo-change
  'help.guide.undo-change.title': 'Az utolsó módosítás visszavonása',
  'help.guide.undo-change.goal': 'Vedd vissza, amit az imént a tervvel tettél.',
  'help.guide.undo-change.step.1':
    'Kattints a visszavonás nyílra a napok feletti eszköztárban; az elemleírása megnevezi a módosítást, amelyet visszavesz.',
  'help.guide.undo-change.result': 'A terv újra olyan, amilyen volt, a nyíl pedig a következő módosításig kiszürkül.',
  'help.guide.undo-change.tip.1':
    'A visszavonás a tervre terjed ki: helyek hozzárendelése, eltávolítása, átrendezése és mozgatása, útvonal optimalizálása, helyek törlése, kategóriamódosítások és importok.',
  'help.guide.undo-change.tip.2':
    'Egy lépés mély: csak a legutóbbi módosítás vehető vissza, és egy új módosítás felülírja.',

  // ── Screen: trip-places ───────────────────────────────────────────────────────────────
  'help.ctx.trip-places.title': 'Helyek',
  'help.ctx.trip-places.summary':
    'A terv jobb oldali oszlopa: az utazás minden helye, tervezett vagy sem, kereséssel és szűrőkkel, meg a módok, ahogy helyeket behozol, kézzel, fájlból vagy megosztott listából.',
  'help.ctx.trip-places.bullet.1':
    'A felül lévő Hely/Tevékenység hozzáadása megnyitja az űrlapot egy helyhez, amit beírsz vagy megkeresel. Amíg egy nap meg van nyitva, a gombon Új hely áll, a mellette lévő A naphoz pedig egyenesen arra a napra hozza létre a helyet.',
  'help.ctx.trip-places.bullet.2':
    'A Fájl importálása .gpx, .kml és .kmz fájlokat fogad; a Lista importálás megosztott Google Maps vagy Naver Maps listát fogad. Egy fájlt egyszerűen az oszlopra is ejthetsz.',
  'help.ctx.trip-places.bullet.3':
    'A legördülő az Összes, a Nem tervezett, a Tervezett és, ha már importáltál nyomvonalat, a Nyomvonalak között vált; alatta ül a keresés, a kategóriaszűrő és a csillag a legkisebb értékeléshez.',
  'help.ctx.trip-places.bullet.4':
    'Egy sor képet, nevet és leírást vagy címet mutat. Kattints rá a hely részleteiért, húzd rá egy napra, vagy kattints rá jobb gombbal, és megkapod a Szerkesztés, + Nap, Weboldal megnyitása, Google Maps, Mentés gyűjteménybe és Törlés pontokat.',
  'help.ctx.trip-places.bullet.5':
    'Megnyitott nappal egy nem tervezett sor végén lévő + arra a napra teszi a helyet, a Tervezett pedig csak azt a napot sorolja fel, a Teljes utazás megjelenítése pedig újra kitágítja.',
  'help.ctx.trip-places.bullet.6':
    'A szűrősor jobb szélén lévő pipa kijelölést indít: több sor egyszerre kap új kategóriát, kerül gyűjteménybe vagy törlődik.',
  // create-place
  'help.guide.create-place.title': 'Hely létrehozása',
  'help.guide.create-place.goal':
    'Adj hozzá kézzel egy helyet vagy tevékenységet, mindennel, amit a tervnek tudnia kell róla.',
  'help.guide.create-place.step.1':
    'Kattints a helyek oszlopának tetején a Hely/Tevékenység hozzáadása gombra (Új hely, amíg egy nap meg van nyitva). Megnyílik az űrlap.',
  'help.guide.create-place.step.2':
    'Írd be a helyet felül a Helyek keresése... mezőbe, és válassz egy találatot. A Név, a Cím, a Szélességi fok, a Hosszúsági fok és a Weboldal kitöltődik, a bal oldali Hely részletei pedig képeket, nyitvatartást és leírást mutat hozzá. Google kulccsal rendelkező TREK-en a lista alatt ott van a Nem a megfelelő hely? Keresés inkább a Google-ben, és ugyanazt a keresést futtatja le a Google-ön át.',
  'help.guide.create-place.step.3':
    'A Hely részletei alatt egy képre kattintás a Válassz képet résznél a hely képévé teszi azt; a Szöveg átvétele a leírást átveszi az űrlapra.',
  'help.guide.create-place.step.4':
    'Nézd át a mezőket: a Név kötelező; a Leírás és a Jegyzetek a tiéd; a Cím, a Szélességi fok és a Hosszúsági fok a keresésből jön vagy beírod; a Kategória az utazás kategóriái közül választ, a mellette lévő + pedig azonnal újat hoz létre; a Weboldal a linket fogadja.',
  'help.guide.create-place.step.5':
    'Kattints a Hozzáadás gombra. Ha már van azonos nevű hely az utazásban, az űrlap szól, és a gombból Hozzáadás mindenképp lesz.',
  'help.guide.create-place.result':
    'A hely benne van a listában és a térképen, a Nem tervezett alatt, amíg egy napra nem kerül.',
  'help.guide.create-place.tip.1':
    'Az űrlap alján a Fájlok és a Költségek dokumentumot csatol a helyhez, vagy mentés után rögtön megnyitja a Költségek szerkesztőt a kiadásához.',
  'help.guide.create-place.tip.2':
    'A keresést minden TREK-en a TREK indexe és az OpenStreetMap válaszolja meg, a Hely részletei pedig a Wikipedia, a Wikivoyage és a Wikimedia forrásaiból tölti fel magát. A Google csak ott kerül sorra, ahol mindkettő üresen marad, és értékelést csak az hoz.',
  'help.guide.create-place.tip.3':
    'Egy hely a térképen is indulhat: kattints jobb gombbal a pontra, és az űrlap kitöltött koordinátákkal és címmel nyílik meg.',
  // place-to-open-day
  'help.guide.place-to-open-day.title': 'Hely hozzáadása egyenesen a megnyitott naphoz',
  'help.guide.place-to-open-day.goal':
    'Hagyd ki a második lépést: hozd létre vagy válaszd ki a helyet, és máris a napon van.',
  'help.guide.place-to-open-day.step.1':
    'Kattints egy nap fejlécére a napok oszlopában. A nap meg van nyitva: a kártyája kiemelt, a helyek oszlopa pedig megkapja A naphoz gombot.',
  'help.guide.place-to-open-day.step.2':
    'A naphoz ugyanazt az űrlapot nyitja meg, mint az Új hely, csak a hely abban a pillanatban a megnyitott napra kerül, ahogy a Hozzáadás gombra kattintasz.',
  'help.guide.place-to-open-day.step.3':
    'Egy már létező hely a sora végén lévő + gombbal vagy jobb gombbal, a + Nap ponttal kerül a megnyitott napra.',
  'help.guide.place-to-open-day.step.4':
    'Fordítva is megy, és anélkül, hogy előbb megnyitnál egy napot: húzd ki a hely sorát az oszlopból, és ejtsd rá egy nap kártyájára. Két megálló közé ejtve pontosan oda kerül.',
  'help.guide.place-to-open-day.result': 'A hely a nap alatt szerepel, a végén; húzd fel vagy le oda, ahová tartozik.',
  'help.guide.place-to-open-day.tip.1':
    'A megnyitott nap a keresést is irányítja: nyitott nappal a térkép és a közeli keresés onnan indul, amerre az a nap amúgy is jár.',
  'help.guide.place-to-open-day.tip.2': 'A napok fölötti eszköztárban a Visszavonás visszaveszi a hozzárendelést.',
  // filter-places
  'help.guide.filter-places.title': 'Hely megtalálása a listában',
  'help.guide.filter-places.goal': 'Szűkítsd az oszlopot azokra a helyekre, amelyeket keresel.',
  'help.guide.filter-places.step.1':
    'A felül lévő legördülő az Összes, a Nem tervezett (még egy napon sincs), a Tervezett (egy napon van) és a Nyomvonalak (importált GPX nyomvonalak) között vált, mindegyik a saját darabszámával.',
  'help.guide.filter-places.step.2': 'Írj a Helyek keresése... mezőbe; a lista szűkül, ahogy gépelsz.',
  'help.guide.filter-places.step.3':
    'Az Összes kategória listát nyit, ahol egy vagy több kategóriát pipálsz ki, köztük a Nincs kategória lehetőséget; az alján a Szűrő törlése visszaállítja.',
  'help.guide.filter-places.step.4':
    'A mellette lévő csillag legkisebb értékelést állít be: az 5+, a 4+ és így tovább csak azokat a helyeket mutatja, amelyeket legalább annyira értékeltél.',
  'help.guide.filter-places.result': 'A sorok fölötti szám megmondja, hány hely illik; a szűrők összeadódnak.',
  'help.guide.filter-places.tip.1':
    'Megnyitott nappal a Tervezett csak azt a napot sorolja fel, és ezt ki is írja: Csak a megnyitott nap látszik, mellette a Teljes utazás megjelenítése.',
  'help.guide.filter-places.tip.2':
    'A térkép is a megnyitott napra szűkül; az Összes a listában továbbra is az utazás minden helyét mutatja.',
  // edit-place
  'help.guide.edit-place.title': 'Hely módosítása',
  'help.guide.edit-place.goal': 'Javíts egy nevet, told el a tűt, adj hozzá weboldalt vagy válts kategóriát.',
  'help.guide.edit-place.step.1':
    'Kattints jobb gombbal a sorra, és válaszd a Szerkesztés pontot, vagy nyisd meg a helyet, és kattints a Szerkesztés gombra a részleteiben.',
  'help.guide.edit-place.step.2':
    'Módosítsd, amire szükséged van: Név, Leírás, Jegyzetek, Cím, Szélességi fok és Hosszúsági fok, Kategória, Weboldal. Napból megnyitva az űrlapon ott van a Jegyzetek erre a napra, valamint a Kezdés és a Befejezés arra a napra.',
  'help.guide.edit-place.step.3': 'Kattints a Frissítés gombra.',
  'help.guide.edit-place.result':
    'A módosítás mindenhol érvényes, ahol a hely megjelenik: a listában, a térképen és minden napon, amelyen rajta van.',
  'help.guide.edit-place.tip.1':
    'A Jegyzetek erre a napra a helyhez tartozik azon az egy napon; a Jegyzetek magához a helyhez tartozik.',
  'help.guide.edit-place.tip.2':
    'A Kezdés előtti Befejezés megakadályozza a Frissítést; az Időbeli átfedés: csak figyelmeztet, hogy a nap egy másik megállója ugyanabban az időben van.',
  // delete-place
  'help.guide.delete-place.title': 'Hely törlése',
  'help.guide.delete-place.goal': 'Vedd ki a helyet az utazásból véglegesen.',
  'help.guide.delete-place.step.1':
    'Kattints jobb gombbal a sorra, és válaszd a Törlés pontot, vagy kattints a Törlés gombra a hely részleteiben.',
  'help.guide.delete-place.step.2':
    'Erősítsd meg. Ha a helyen éjszakát foglaltak, vagy foglalás kapcsolódik hozzá, a kérdés megmondja, mi megy vele.',
  'help.guide.delete-place.result':
    'A hely eltűnik a listából, a térképről és minden napról; a napok fölötti eszköztárban a Visszavonás visszahozza.',
  'help.guide.delete-place.tip.1':
    'Ha csak egy napról akarod levenni a helyet, használd inkább azon a megállón az Eltávolítás a napról pontot.',
  'help.guide.delete-place.tip.2': 'Több hely egyszerre: a szűrők melletti pipa kijelölést indít.',
  // select-places
  'help.guide.select-places.title': 'Több hely módosítása vagy törlése egyszerre',
  'help.guide.select-places.goal': 'Rendezd a listát egy menetben, nem helyenként.',
  'help.guide.select-places.step.1':
    'Kattints a szűrősor jobb szélén lévő pipára. A sorok jelölőnégyzeteket kapnak, és megjelenik egy sáv a műveletekkel.',
  'help.guide.select-places.step.2':
    'Pipáld ki a sorokat, vagy használd a sávban a Mindet kiválaszt gombot; a sáv számolja, mi van kijelölve.',
  'help.guide.select-places.step.3':
    'A Change category mindegyiknek egy kategóriát ad; a Mentés gyűjteménybe átmásolja őket az egyik gyűjteményedbe; a Kijelöltek törlése egy megerősítés után eltávolítja őket.',
  'help.guide.select-places.step.4': 'Kattints újra a pipára, hogy kilépj a kijelölésből.',
  'help.guide.select-places.result':
    'A módosítás minden kijelölt helyre érvényes; a törlés a napok fölötti eszköztárból visszavonható.',
  'help.guide.select-places.tip.1':
    'A szűrők kijelölés közben is működnek: szűrj előbb a Nem tervezett értékre, akkor a Mindet kiválaszt pontosan azokat fogja meg.',
  'help.guide.select-places.tip.2':
    'A Megjelölés látogatottként a listáidban akkor jelenik meg a sávban, ha a Gyűjtemények bővítmény be van kapcsolva: kipipálja a helyeket azokban a gyűjteményekben, amelyekbe el vannak mentve.',
  // import-places-file
  'help.guide.import-places-file.title': 'Helyek importálása GPX, KML vagy KMZ fájlból',
  'help.guide.import-places-file.goal':
    'Hozd be, amit a Google My Maps, a Google Earth vagy egy GPS tracker exportált.',
  'help.guide.import-places-file.step.1':
    'Kattints a Fájl importálása gombra, vagy ejtsd a fájlt bárhová a helyek oszlopára.',
  'help.guide.import-places-file.step.2':
    'Válaszd ki a fájlt, vagy húzd a keretbe. GPX esetén pipáld ki, mit importáljon: Útpontok, Útvonalak, Nyomvonalak (útvonalgeometriával); KML és KMZ esetén Pontok (Placemarks) és Útvonalak (LineStrings).',
  'help.guide.import-places-file.step.3':
    'A keret egyszerre több fájlt is elfogad, és csak .gpx, .kml és .kmz fájlt. Másfajta fájlt vagy 10 MB fölöttit a párbeszédablak visszautasít, és nem importál.',
  'help.guide.import-places-file.step.4':
    'Kattints az Importálás gombra. Egy üzenet megmondja, hány hely jött be; KML vagy KMZ fájlnál a párbeszédablak nyitva marad, és összegzi, mi jött létre és mi maradt ki.',
  'help.guide.import-places-file.result':
    'A helyek a listában vannak; egy nyomvonal útvonaljelet visel a sorában, kirajzolódik a térképen, és saját Nyomvonalak szűrőt kap.',
  'help.guide.import-places-file.tip.1':
    'A túl nagy fájlt a méretkorláttal együtt visszautasítja; exportáld újra fotók nélkül, vagy vágd szét.',
  'help.guide.import-places-file.tip.2': 'Az importálás egészben visszavonható a napok fölötti eszköztárból.',
  // import-places-list
  'help.guide.import-places-list.title': 'Megosztott Google Maps vagy Naver Maps lista importálása',
  'help.guide.import-places-list.goal': 'Alakíts egy megosztott listalinket helyekké.',
  'help.guide.import-places-list.step.1':
    'Kattints a Lista importálás gombra, és válaszd a Google Lista vagy a Naver Lista lehetőséget.',
  'help.guide.import-places-list.step.2':
    'Illeszd be a lista megosztott linkjét. Egy Google Maps útvonaltervező link is működik: a megállói helyek lesznek, vezetési sorrendben.',
  'help.guide.import-places-list.step.3': 'Kattints az Importálás gombra.',
  'help.guide.import-places-list.result':
    'A lista minden helye benne van az utazásban, a listabeli nevével; az utazásban már meglévő helyeket kihagyja.',
  'help.guide.import-places-list.tip.1':
    'A listát nyilvánosan meg kell osztani; egy privát lista linkje semmit sem importál.',
  'help.guide.import-places-list.tip.2':
    'A Helyek gazdagítása a Google-lel akkor jelenik meg a párbeszédablakban, ha a TREK-edhez tartozik Google kulcs: minden importált helyet kikeres, és fotókat, címet és részleteket tölt ki.',

  // ── Screen: trip-days ─────────────────────────────────────────────────────────────────
  'help.ctx.trip-days.title': 'Napok',
  'help.ctx.trip-days.summary':
    'A terv bal oldali oszlopa: naponként egy kártya a megállóival sorrendben, a jegyzetekkel, a nap foglalásaival és közlekedésével, meg a megállók közti útvonallal. Az utazás igazából itt készül.',
  'help.ctx.trip-days.bullet.1':
    'A felső eszköztár: Exportálás (PDF, naptár, GPX), Expand all days / Collapse all days, a visszavonás nyíl, a Napok átrendezése és az Összes foglalási útvonal megjelenítése.',
  'help.ctx.trip-days.bullet.2':
    'Egy napkártya: szám, időjárás, cím, dátum és a nap költsége a fejlécben; kattints a fejlécre a nap megnyitásához, a jobb oldali nyíl összecsukja a kártyát. A Tömegközlekedés, a Közlekedés hozzáadása és a Jegyzet hozzáadása szintén a fejlécben ül.',
  'help.ctx.trip-days.bullet.3':
    'A napon belül: a megállók sorrendben, mindegyik képpel, névvel, időponttal és egy lakattal a képen; jegyzetek; a naphoz tartozó foglalások; a megállók között pedig az egyes szakaszok utazási ideje.',
  'help.ctx.trip-days.bullet.4':
    'A megállók alatt az útvonalsáv: az Útvonal felrajzolja a napot a térképre, az Optimalizálás sorba rendezi a megállókat, az Autózás / Gyaloglás beállítja a nap közlekedési módját, a Megnyitás a Google Térképben és a Megnyitás a CoMaps-ben pedig továbbadja a napot.',
  'help.ctx.trip-days.bullet.5':
    'A helyek úgy kerülnek egy napra, hogy áthúzol egy sort a helyek oszlopából, az adott sor + jelével, üres napon a Hely hozzáadása ehhez a naphoz ponttal, vagy a hely részleteiből.',
  'help.ctx.trip-days.bullet.6':
    'Az alul lévő Összköltség minden árral rendelkező megállót és foglalást összead, az utazás pénznemében.',
  // read-day-plan
  'help.guide.read-day-plan.title': 'Egy nap elolvasása',
  'help.guide.read-day-plan.goal': 'Tudd, mit mond neked a napkártya minden része, mielőtt bármit megváltoztatnál.',
  'help.guide.read-day-plan.step.1':
    'A fejléc: a nap száma, a napra szóló előrejelzés, az 1. nap vagy a cím, amit adtál neki, a dátum és a nap költsége. Kattints a fejlécre a nap megnyitásához (a részletei a térkép fölött nyílnak meg); a jobb oldali nyíl összecsukja és kinyitja a kártyát.',
  'help.guide.read-day-plan.step.2':
    'Egy megálló: a bal oldali fogantyú húzza, a kép lakatot visel az útvonal-optimalizáláshoz, majd jön a név, a leírás és, ha be van állítva, a Jegyzetek erre a napra. Egy időjelvény a Kezdés és a Befejezés értéket mutatja, ha a megállónak van ilyen; a jobb szélén megjelenő nyilak felfelé vagy lefelé mozgatják.',
  'help.guide.read-day-plan.step.3':
    'Egy foglalás a napon: egy megállóhoz kötött foglalás Foglalás megerősítve vagy Foglalás függőben jelzéssel látja el a megállót, egy közlekedés pedig Indulás vagy Érkezés formában jelenik meg az időpontjával és az útvonalával, és a rajta lévő kis kapcsoló felrajzolja azt az útvonalat a térképen.',
  'help.guide.read-day-plan.step.4':
    'Két megálló között az összekötő megmondja, mennyi ideig tart a szakasz és milyen hosszú, a nap közlekedési módjában; kattints rá, ha csak annál az egy szakasznál akarod a módot megváltoztatni.',
  'help.guide.read-day-plan.step.5':
    'A végén az útvonalsáv: az Útvonal felrajzolja a nap útját a térképre, az Optimalizálás átrendezi a megállókat, a módgombok Autózás vagy Gyaloglás közül választanak, a Megnyitás a Google Térképben és a Megnyitás a CoMaps-ben pedig ott nyitja meg a napot.',
  'help.guide.read-day-plan.result':
    'A kártyán minden jelnek van jelentése; az alábbi útmutatók mindegyiket megváltoztatják.',
  'help.guide.read-day-plan.tip.1':
    'Kattints jobb gombbal egy megállóra a menüjéért: Szerkesztés, Eltávolítás a napról, Weboldal megnyitása, a navigációs alkalmazások (Google Maps, Waze, Apple Maps, OpenStreetMap, CoMaps), Mentés gyűjteménybe, Törlés.',
  'help.guide.read-day-plan.tip.2':
    'Vidd az egeret egy megálló fölé, és a végén megjelenik a Foglalás hozzáadása: az ott létrehozott foglalás ehhez a megállóhoz tartozik ezen a napon.',
  // place-onto-day
  'help.guide.place-onto-day.title': 'Hely elhelyezése egy napon',
  'help.guide.place-onto-day.goal':
    'Csinálj a lista egyik helyéből a nap egyik megállóját, oda, ahová a sorrendben való.',
  'help.guide.place-onto-day.step.1':
    'Húzz egy sort a helyek oszlopából a napkártyára. Ejtsd két megálló közé, hogy pontosan oda kerüljön, vagy bárhová a kártyán, hogy a végére fűződjön.',
  'help.guide.place-onto-day.step.2':
    'Húzás nélkül: nyisd meg a napot a fejlécére kattintva, aztán kattints a hely sorának végén lévő + jelre, vagy kattints a sorra jobb gombbal, és válaszd a + Nap pontot.',
  'help.guide.place-onto-day.step.3':
    'Üres napon a Hely hozzáadása ehhez a naphoz megnyitja a hely űrlapját, és az új hely azonnal a napra kerül.',
  'help.guide.place-onto-day.step.4':
    'Egy hely részleteiből a Hozzáadás a naphoz megkérdezi, melyik napra; ha a nap a fejlécéről meg van nyitva, a helyek oszlopában A naphoz egyenesen a megnyitott napon hoz létre új helyet.',
  'help.guide.place-onto-day.result':
    'A hely a nap megállója lett, a térképen a nap számával, és a helyek oszlopa a Tervezett alatt számolja.',
  'help.guide.place-onto-day.tip.1':
    'Egy hely több napon is lehet: a második napra a helyek oszlopából tedd rá. Egy megálló áthúzása az egyik napkártyáról a másikra viszont átmozgatja.',
  'help.guide.place-onto-day.tip.2': 'Az eszköztárban a visszavonás nyíl visszaveszi a hozzárendelést.',
  'help.guide.place-onto-day.tip.3':
    'Egy megálló nem ejthető két rögzített időpontú bejegyzés közé, sem egy olyan foglalás elé, amelynek már van időpontja; a terv tartja az időrendet.',
  // reorder-stops
  'help.guide.reorder-stops.title': 'Egy nap sorrendjének módosítása',
  'help.guide.reorder-stops.goal': 'Mozgass egy megállót felfelé vagy lefelé, vagy át egy másik napra.',
  'help.guide.reorder-stops.step.1': 'Húzd a megállót a fogantyújánál fogva a kártyán belüli új helyére.',
  'help.guide.reorder-stops.step.2':
    'Vagy használd a megálló jobb szélén lévő nyilakat: kattintásonként egy lépés felfelé vagy lefelé.',
  'help.guide.reorder-stops.step.3': 'Húzd a megállót egy másik napkártyára, hogy odakerüljön; a régi napot elhagyja.',
  'help.guide.reorder-stops.step.4':
    'A rögzített időpontú megálló akkor kérdezi meg, hogy Időpont eltávolítása?, ha a mozgatás megbontaná a nap sorrendjét, mert a helyéről az időpont döntött: a Megerősítés elejti az időpontot, és bárhová engedi.',
  'help.guide.reorder-stops.result': 'Az útvonal és az utazási idők azonnal követik az új sorrendet.',
  'help.guide.reorder-stops.tip.1':
    'A rögzített időpontú foglalások nem rendezhetők át; ott ülnek, ahová az időpontjuk teszi őket.',
  'help.guide.reorder-stops.tip.2':
    'Az útvonalsávban az Optimalizálás az egész napot a legrövidebb út szerint rendezi; előbb rögzítsd azt a megállót, amelyik a helyén marad.',
  // set-stop-times
  'help.guide.set-stop-times.title': 'Időpont adása egy megállónak',
  'help.guide.set-stop-times.goal':
    'Rögzítsd, mikor kezdődik és mikor ér véget egy megálló, hogy a nap menetrendként olvasódjon.',
  'help.guide.set-stop-times.step.1':
    'Kattints jobb gombbal a megállóra, és válaszd a Szerkesztés pontot. A napról megnyitva az űrlap alján ott a Kezdés és a Befejezés.',
  'help.guide.set-stop-times.step.2':
    'Írd be a Kezdés értéket és, ha akarod, a Befejezés értéket. Az Időbeli átfedés: figyelmeztet, hogy a nap egy másik időzített megállójával átfedés van; a Kezdés előtti Befejezés letiltja a Frissítés gombot.',
  'help.guide.set-stop-times.step.3':
    'Kattints a Frissítés gombra. A megálló időjelvényt kap, és oda kerül, ahová az időpontja szerint a napon való.',
  'help.guide.set-stop-times.result':
    'Az időzített megállók tartják a helyüket a sorrendben; az időpont nélküliek köréjük rendeződnek.',
  'help.guide.set-stop-times.tip.1':
    'Az időpont a megállóhoz tartozik azon a napon; ugyanannak a helynek egy másik napon más időpontja lehet.',
  'help.guide.set-stop-times.tip.2':
    'Ha kézzel akarsz mozgatni egy időzített megállót, húzd: az Időpont eltávolítása? kérdés útközben elejti az időpontot, amint a Megerősítés gombra kattintasz.',
  'help.guide.set-stop-times.tip.3':
    'Ugyanabban az űrlapban a Jegyzetek erre a napra azt tartja, ami csak ezen a napon érvényes, egy lefoglalt asztal, egy jegyszám.',
  // remove-from-day
  'help.guide.remove-from-day.title': 'Megálló levétele a napról',
  'help.guide.remove-from-day.goal': 'Vedd ki a helyet a tervből anélkül, hogy törölnéd az utazásból.',
  'help.guide.remove-from-day.step.1': 'Kattints jobb gombbal a megállóra, és válaszd az Eltávolítás a napról pontot.',
  'help.guide.remove-from-day.step.2':
    'A megálló eltűnt a napról; a hely a helyek oszlopában marad, a Nem tervezett alatt, ha egyetlen másik napon sincs rajta.',
  'help.guide.remove-from-day.result':
    'A nap, az útvonala és a költsége frissül; a visszavonás nyíl visszahozza a megállót.',
  'help.guide.remove-from-day.tip.1':
    'Ugyanabban a menüben a Törlés az egész utazásból kiveszi a helyet, minden nappal együtt.',
  'help.guide.remove-from-day.tip.2':
    'Az Eltávolítás a napról a hely részletei panelen is ott ül, a Hozzáadás a naphoz mellett.',
  // lock-stop
  'help.guide.lock-stop.title': 'Megálló rögzítése a helyén',
  'help.guide.lock-stop.goal': 'Tartsd a megállót ott, ahol van, amikor az útvonal optimalizálódik.',
  'help.guide.lock-stop.step.1':
    'Vidd az egeret a megálló képe fölé, és kattints a lakatra: Pozíció megtartása útvonal-optimalizálás során.',
  'help.guide.lock-stop.step.2':
    'Az Optimalizálás mostantól köré rendezi a többi megállót; kattints újra a lakatra (Kattints a feloldáshoz), hogy elengedd.',
  'help.guide.lock-stop.result': 'A lakat látszik a képen; a megálló tartja a pozícióját, amíg fel nem oldod.',
  'help.guide.lock-stop.tip.1':
    'A rögzített időpontú megállót az időpontja zárja le; az optimalizálás során soha nem mozdul.',
  'help.guide.lock-stop.tip.2':
    'A lakat erre a látogatásra szól: újratöltés után minden megálló újra szabad, csak az időzített megállók maradnak rögzítve.',
  // day-note
  'help.guide.day-note.title': 'Jegyzet hozzáadása egy naphoz',
  'help.guide.day-note.goal': 'Tarts egy emlékeztetőt, egy jegyszámot vagy egy B tervet egyenesen a napban.',
  'help.guide.day-note.step.1': 'Kattints a nap fejlécében a Jegyzet hozzáadása gombra.',
  'help.guide.day-note.step.2':
    'Adj neki nevet a Jegyzet mezőben, ezt mutatja a nap kártyája, a többit pedig írd a Napi jegyzet alá. A szöveg fölötti sáv formázza (Félkövér, listák, hivatkozások, idézetek), a bal oldali Előnézet pedig megmutatja, milyen kártya lesz belőle.',
  'help.guide.day-note.step.3':
    'Válassz Ikont és Színt, hogy a jegyzet kiváljon a megállók közül, aztán kattints a Hozzáadás gombra.',
  'help.guide.day-note.step.4':
    'A jegyzet megállóként ül a napban: húzd a helyére, kattints rá jobb gombbal a Szerkesztés és a Törlés pontért.',
  'help.guide.day-note.result':
    'A jegyzet a nap része, a PDF-ben is; az időzített jegyzet az időzített megállókkal együtt rendeződik.',
  'help.guide.day-note.tip.1':
    'Egy időponttal ellátott jegyzet helyettesítheti azt a közlekedést, amire nincs foglalásod: „08:15 S3 a főpályaudvarról”.',
  'help.guide.day-note.tip.2':
    'A jegyzetek naponként szólnak; az egész utazásra szóló jegyzet az Együttműködés alá tartozik.',
  // day-route
  'help.guide.day-route.title': 'A nap útvonalának megjelenítése és optimalizálása',
  'help.guide.day-route.goal':
    'Lásd a megállók közti utat, válaszd ki, hogyan utazol, és hagyd, hogy a TREK rendezze a sorrendet.',
  'help.guide.day-route.step.1':
    'Nyisd meg a napot, és kattints az útvonalsávban az Útvonal gombra: a megállók közti út felrajzolódik a térképre, a megállók közti összekötők pedig mutatják az egyes szakaszok idejét és távolságát.',
  'help.guide.day-route.step.2':
    'A mellette lévő Autózás és Gyaloglás beállítja a nap közlekedési módját; a szakaszok újraszámolódnak. A pluginok saját módokat is hozzáadhatnak.',
  'help.guide.day-route.step.3':
    'Kattints egy összekötőre, ha csak annál az egy szakasznál akarod a módot cserélni: válassz módot, vagy a Napi alapértelmezett ponttal térj vissza a napéhoz.',
  'help.guide.day-route.step.4':
    'Az Optimalizálás a legrövidebb út szerint rendezi át a megállókat. A lakattal vagy rögzített időponttal ellátott megállók tartják a helyüket; ha van szállás a napon, az útvonal onnan indul.',
  'help.guide.day-route.step.5':
    'A Megnyitás a Google Térképben vagy a Megnyitás a CoMaps-ben az egész napot útvonalként nyitja meg abban az alkalmazásban, útközbeni navigáláshoz.',
  'help.guide.day-route.result':
    'A nap egy útvonal időpontokkal; az Összköltség és a szakaszok a sorrenddel együtt frissülnek.',
  'help.guide.day-route.tip.1':
    'Az útvonalak alapból az OSRM-től jönnek; az adminisztrátor az Alapértelmezett beállítások alatt másik útvonaltervező motorra állíthatja a TREK-et.',
  'help.guide.day-route.tip.2':
    'Az a szakasz, amelyre nem sikerült útvonalat számolni, nem mutat időt; ellenőrizd, hogy mindkét megállónak van koordinátája.',
  'help.guide.day-route.tip.3': 'A visszavonás nyíl visszaveszi az optimalizálást.',
  // manage-days
  'help.guide.manage-days.title': 'Napok hozzáadása, átrendezése és átnevezése',
  'help.guide.manage-days.goal': 'Magukat a napokat formáld, ne csak azt, ami rajtuk van.',
  'help.guide.manage-days.step.1':
    'A napok az utazás dátumaiból jönnek; módosítsd a dátumokat az utazáskártyán az Irányítópult alatt, és a végeken napok jönnek hozzá vagy esnek ki. Mielőtt egy tartalommal bíró nap kiesne, egy lista megmutatja, mely napok mennek és mi van rajtuk.',
  'help.guide.manage-days.step.2':
    'Az eszköztárban a Napok átrendezése egy listát nyit: a Mozgatás felfelé és a Mozgatás lefelé mindenestül eltolja a napot, a mellettük lévő kuka, a Nap törlése pedig eltávolítja. A lista alatt a következő dátumot mutató gomb közvetlenül az utolsó dátumos nap után szúr be egy napot, és egy nappal meghosszabbítja az utazást; a Dátum nélkül egy dátum nélküli napot fűz a végére.',
  'help.guide.manage-days.step.3':
    'A Nap törlése előbb rákérdez: a lista megmutatja, mi megy a nappal együtt, a helyei, jegyzetei és foglalásai, egy szállás, amelynek aznap van a be- vagy kijelentkezése, és a napok, amelyek egy dátummal előbbre kerülnek. A Nap törlése eltávolítja, a Mégse megtartja; az utolsó nap nem törölhető.',
  'help.guide.manage-days.step.4':
    'Egy nap átnevezéséhez nyisd meg, és kattints a címe melletti ceruzára a térkép fölötti részletek panelen; a név a kártyán és a PDF-ben is az 1. nap helyére lép.',
  'help.guide.manage-days.step.5':
    'Az eszköztárban az Expand all days és a Collapse all days egyszerre csukja össze az összes kártyát; egyetlen kártya a saját nyilával csukódik össze.',
  'help.guide.manage-days.result':
    'A dátumok a pozíciónál maradnak: a felfelé mozgatott nap a korábbi dátumot kapja, a megállói, jegyzetei és foglalásai pedig vele együtt utaznak.',
  'help.guide.manage-days.tip.1': 'A napok mozgatása az eszköztárból visszavonható, egy nap törlése nem.',
  'help.guide.manage-days.tip.2':
    'A nap fejlécében lévő költség az adott nap árral rendelkező megállóit és foglalásait adja össze.',
  // bookings-in-plan
  'help.guide.bookings-in-plan.title': 'Foglalások és közlekedés olvasása a tervben',
  'help.guide.bookings-in-plan.goal':
    'Tudd, hol jelenik meg egy foglalás, ha már létezik, és melyik képernyő hozza létre.',
  'help.guide.bookings-in-plan.step.1':
    'Egy közlekedés (Repülő, Vonat, Komp, Busz, Autó) az indulás napján Indulás, az érkezés napján Érkezés formában jelenik meg, időponttal és útvonallal; a több napos átnyúlik a köztes napokra.',
  'help.guide.bookings-in-plan.step.2':
    'A megállóhoz kötött foglalás (egy Étterem, egy Túra) Foglalás megerősítve vagy Foglalás függőben jelzést tesz arra a megállóra; az a foglalás, amelynek van napja, de nincs megállója, saját sor a napban.',
  'help.guide.bookings-in-plan.step.3':
    'Egy szállodai éjszaka szállás: a nap részletei panelen ül a Szállás alatt, a Bejelentkezéstől a Kijelentkezésig, és azoknak a napoknak az útvonala onnan indul.',
  'help.guide.bookings-in-plan.step.4':
    'A térképen a közlekedés sorában lévő kapcsoló felrajzolja az útvonalát; az eszköztárban az Összes foglalási útvonal megjelenítése mindet felrajzolja.',
  'help.guide.bookings-in-plan.step.5':
    'Létrehozás: Foglalás hozzáadása az egérrel megcélzott megállón, Közlekedés hozzáadása és Tömegközlekedés a nap fejlécében, a teljes listához importtal és fájlokkal pedig a Foglalások és a Közlekedés fül.',
  'help.guide.bookings-in-plan.result': 'Egy foglalás, egy hely a tervben; a fülek ugyanazok a foglalások listaként.',
  'help.guide.bookings-in-plan.tip.1':
    'A Megerősítve és a Függőben egy állapot, amit te állítasz be a foglaláson; a terv a megállón mutatja, a Foglalások fül pedig mindkettőt számolja.',
  'help.guide.bookings-in-plan.tip.2':
    'A rögzített időpontú közlekedés nem húzható; helyette a foglalásban módosítsd az időpontját.',
  // export-plan
  'help.guide.export-plan.title': 'A terv exportálása',
  'help.guide.export-plan.goal': 'Vidd magaddal a tervet dokumentumként, a naptáradba vagy egy GPS-re.',
  'help.guide.export-plan.step.1': 'Kattints a napok fölötti eszköztárban az Exportálás gombra.',
  'help.guide.export-plan.step.2':
    'Dokumentum: a PDF minden nap nyomtatási nézetét megnyitja a megállóival, jegyzeteivel és foglalásaival; az Oldaltörés naponta minden napot új oldalon kezd, a Mentés PDF-ként pedig letölti.',
  'help.guide.export-plan.step.3':
    'Naptár: az .ics letöltése naptárfájlként menti a foglalásokat; a Feliratkozás a naptárra olyan linket ad, amit a naptáralkalmazásod magától frissít.',
  'help.guide.export-plan.step.4':
    'Térképek és GPS · GPX: A teljes utazás exportálja a helyeket, a napi útvonalakat és a nyomvonalakat; a Csak a helyek csak a tűket; a Napok útvonalként naponként egy útvonalat, offline térképekhez és GPS-eszközökhöz.',
  'help.guide.export-plan.result': 'A fájl letöltődik; az utazásban semmi nem változik.',
  'help.guide.export-plan.tip.1':
    'Egyetlen nap a saját útvonalsávjából megy át egy térképalkalmazásba: Megnyitás a Google Térképben vagy Megnyitás a CoMaps-ben.',
  'help.guide.export-plan.tip.2':
    'A Feliratkozás a naptárra ahhoz kell, hogy a beállításaidban be legyen kapcsolva a naptár-feliratkozás; az Irányítópulthoz van róla útmutató.',
  'help.guide.export-plan.tip.3': 'Az exportálás olvasás: az utazás minden tagja megteheti.',

  // ── Screen: trip-place ────────────────────────────────────────────────────────────────
  'help.ctx.trip-place.title': 'Hely részletei',
  'help.ctx.trip-place.summary':
    'A kártya, ami a térkép fölött nyílik meg, amikor kiválasztasz egy helyet: minden, amit az utazás tud róla, a csillagok, amiket mindenki adott neki, a képe és a fájljai, meg a gombok, amik a megnyitott napra, egy listába vagy egy térképalkalmazásba teszik.',
  'help.ctx.trip-place.bullet.1':
    'Kattints egy sorra a helyek oszlopában, egy megállóra a napon belül, vagy egy jelölőre a térképen, és a kártya megnyílik a térkép fölött. Ha a napon belül választod ki, a kártya megtudja, melyik megállóra gondolsz, és épp ez hozza magával a megálló résztvevőit és a foglalását.',
  'help.ctx.trip-place.bullet.2':
    'A fejléc viszi a kerek képet, a nevet, a kategóriát, a címet és a koordinátákat. Kattints a képre, hogy sajátot használj, kattints duplán a névre, hogy helyben átnevezd a helyet, a jobb oldali X pedig bezárja a kártyát.',
  'help.ctx.trip-place.bullet.3':
    'Alatta: az ár, ha van, a csillagok, amiket minden utazó adott a helynek, a leírás és a jegyzetek, és a Jegyzetek erre a napra, ha a megálló hoz ilyet.',
  'help.ctx.trip-place.bullet.4':
    'Utána a Nyitvatartás, az Útvonal színe, az Útvonal adatok és a Fájlok jönnek, amennyiben érvényesek. A Fájlok bármit elfogadnak a mappáidból, és azt is felsorolják, ami ennek a megállónak a foglalásán lóg.',
  'help.ctx.trip-place.bullet.5':
    'A legalsó sor: Hozzáadás a naphoz vagy Eltávolítás a napról, amíg egy nap meg van nyitva, aztán Mentés gyűjteménybe, Navigáció, Weboldal megnyitása, Szerkesztés és Törlés.',
  'help.ctx.trip-place.bullet.6':
    'A keresésből kiválasztott hely magával hozza, amit a TREK-index vagy az OpenStreetMap tud róla: egy zöld Nyitva vagy piros Zárva gyűrűt a kép körül, a hely saját órája szerint megítélve, a telefonszámot a csillagok alatt, lejjebb a Nyitvatartást a nap sorával a soron és az egész héttel egy kattintás mögött, és a weboldalát a Weboldal megnyitása mögött. A Google értékelése csak a Google-lel talált helyen látszik, egy Google-kulcsos TREK-en.',
  // read-place
  'help.guide.read-place.title': 'Mit mond el a kártya egy helyről',
  'help.guide.read-place.goal': 'Olvasd el egyetlen kártyán mindazt, amit az utazás egy helyről tud.',
  'help.guide.read-place.step.1':
    'A napok oszlopában kattints a megállóra, amit el akarsz olvasni. A kártya megnyílik a térkép fölött, a megálló pedig jelölve marad a napjában.',
  'help.guide.read-place.step.2':
    'A fejléc: a kerek kép, a név, a cím és a pontos koordináták. Egy zöld gyűrű Nyitva, vagy egy piros Zárva felirattal a kép körül megmondja, nyitva van-e a hely épp most, a saját órája szerint, amint a TREK ismeri a nyitvatartását. A jobb oldali X újra bezárja a kártyát.',
  'help.guide.read-place.step.3':
    'Alatta a csillagok, amiket minden utazó adott a helynek, az átlaggal és a szavazatok számával. Még nincs értékelve, amíg senki sem szavazott. Rögtön alatta a telefonszám, ahol a helynek van: egy kattintás rá átadja a számot a telefonalkalmazásodnak.',
  'help.guide.read-place.step.4':
    'Aztán a leírás, alatta a jegyzetek. Mindkettő a hely űrlapjáról való szöveg, megjelenítve: a listák, a linkek és a félkövér mind működnek.',
  'help.guide.read-place.step.5':
    'A Résztvevők megmondja, ki megy erre a megállóra. Mindenki benne van, amíg ki nem veszel valakit.',
  'help.guide.read-place.step.6':
    'A Nyitvatartás, lejjebb: a sor annak a napnak az óráit viszi, amelyiket épp nézed, és egy kattintás rá kibontja az egész hetet, azzal a nappal félkövéren. Mellette a Fájlok áll.',
  'help.guide.read-place.result':
    'A kártya addig marad nyitva, amíg be nem zárod az X-szel vagy másik helyet nem választasz, a hét órái kibontva maradnak, a megálló pedig, amelyikhez tartozik, jelölve marad a napok oszlopában.',
  'help.guide.read-place.tip.1':
    'A helyek oszlopából kiválasztva a kártya ismeri a helyet, de a megállót nem, így nem mutat résztvevőket és foglalást sem. Válaszd inkább a megállót a napon belül, és mindkettő ott van.',
  'help.guide.read-place.tip.2':
    'Kattints duplán a névre, hogy az űrlap megnyitása nélkül nevezd át a helyet. Az Enter ment, az Escape eldobja a változtatást.',
  'help.guide.read-place.tip.3':
    'Egy kézzel beírt hely ebből semmit nem mutat: a kártya csak azt tudja, amit az űrlapja tart. Nyisd meg a Szerkesztés gombbal, válaszd ki a Helyek keresése... alatti javaslatokból, és kattints a Frissítés gombra, és vele jön a nyitvatartás, a telefonszám és a weboldal. A Google értékeléséhez Google-kulcs kell.',
  // rate-place
  'help.guide.rate-place.title': 'Hely értékelése',
  'help.guide.rate-place.goal': 'Add meg a helynek a saját csillagaidat, és nézd meg, mit adtak neki a többiek.',
  'help.guide.rate-place.step.1':
    'Nyisd meg a helyet. A csillagsor rögtön a fejléc alatt ül, és az eddigi szavazatok átlagát viszi, a számukkal zárójelben.',
  'help.guide.rate-place.step.2':
    'Kattints arra a csillagra, amelyikre gondolsz. A csillagok telnek, ahogy végighaladsz rajtuk, így látod, mit készülsz adni.',
  'help.guide.rate-place.step.3':
    'A szavazatod azonnal beleszámít az átlagba, a mellette lévő arcok pedig azok, akik szavaztak. Tartsd a mutatót a soron, hogy mindenki csillagait lásd.',
  'help.guide.rate-place.step.4':
    'Ugyanaz az átlag ül a hely során a helyek oszlopában, így a jók kitűnnek a listából.',
  'help.guide.rate-place.result':
    'A csillagaid ott vannak a helyen az egész utazás szeme előtt, a lista fölötti szűrősorban lévő Szűrés értékelés szerint csillag pedig mostantól csak azokat a helyeket tudja megtartani, amik elérnek egy alsó határt.',
  'help.guide.rate-place.tip.1':
    'Minden utazó értékelhet, még olyan utazáson is, ahol a Helyek hozzáadása / szerkesztése / törlése joggal csak néhányan rendelkeznek közületek.',
  'help.guide.rate-place.tip.2':
    'Kattints arra a csillagra, amit már megadtál, hogy visszavedd a szavazatodat. Ha senki sem marad, aki szavazott, a helyen újra Még nincs értékelve áll.',
  'help.guide.rate-place.tip.3':
    'A csillagok mellé arcként legfeljebb hat szavazó fér; a buboréksúgó mindegyiket megnevezi, és a tiédet megjelöli.',
  // place-image
  'help.guide.place-image.title': 'Saját kép egy helyre',
  'help.guide.place-image.goal': 'Cseréld le az automatikus indexképet a saját fotódra.',
  'help.guide.place-image.step.1': 'Nyisd meg a helyet a helyek oszlopából.',
  'help.guide.place-image.step.2':
    'Tartsd a mutatót a fejléc kerek képén: megjelenik egy fényképezőgép, a buboréksúgóban pedig Kép feltöltése áll. Kattints rá, és válaszd ki a fájlodat.',
  'help.guide.place-image.step.3': 'A fejléc most a te képedet mutatja, a sarkában egy kis piros X-szel.',
  'help.guide.place-image.step.4':
    'Ugyanaz a kép ott van a hely során a helyek oszlopában, és a térképen a jelölőjén is.',
  'help.guide.place-image.result':
    'A képed mindenhol a hely képe: a kártyán, a helyek oszlopában, a nap megállóján, a térképen a jelölőn és egy megosztott utazásban.',
  'help.guide.place-image.tip.1':
    'A JPG, a PNG, a GIF és a WebP mind mehet, egy iPhone HEIC képe pedig a feltöltés közben átalakul.',
  'help.guide.place-image.tip.2':
    'A sarokban lévő X újra eltávolítja a képedet, és visszajön az automatikus. Magához a helyhez nem nyúl.',
  'help.guide.place-image.tip.3':
    'Saját kép nélkül a TREK a hely koordinátái alapján keres egyet, ha pedig az sincs, a kategória ikonjára esik vissza.',
  // place-day-assign
  'help.guide.place-day-assign.title': 'Tedd a helyet a megnyitott napra, vagy vedd le róla',
  'help.guide.place-day-assign.goal': 'A kártya saját gombját használd ahelyett, hogy a sort áthúznád a tervezőn.',
  'help.guide.place-day-assign.step.1':
    'Kattints egy nap fejlécére a napok oszlopában. Az a nap most a megnyitott, és a kártya ahhoz igazodik.',
  'help.guide.place-day-assign.step.2':
    'Kattints a helyek oszlopában egy helyre, ami nincs azon a napon. Megnyílik a kártyája, és a legalsó sor felkínálja a Hozzáadás a naphoz gombot.',
  'help.guide.place-day-assign.step.3':
    'Kattints a Hozzáadás a naphoz gombra. A megálló a nap végére érkezik, a gombból pedig Eltávolítás a napról lesz.',
  'help.guide.place-day-assign.step.4': 'A megálló most a napon van, a lista végén. Húzd fel oda, ahová való.',
  'help.guide.place-day-assign.step.5':
    'Az Eltávolítás a napról újra leveszi azt a megállót a napról, a kártya pedig megint felkínálja a Hozzáadás a naphoz gombot.',
  'help.guide.place-day-assign.result':
    'A nap viszi a megállót, vagy már nem viszi, maga a hely pedig így is, úgy is érintetlen marad.',
  'help.guide.place-day-assign.tip.1':
    'A gomb csak akkor létezik, ha egy nap meg van nyitva. Nap nélkül a kártyának nincs mihez hozzáadnia a helyet.',
  'help.guide.place-day-assign.tip.2':
    'Ha leveszel egy megállót egy napról, a hely megmarad az utazásban és a helyek oszlopában. Mindenhonnan a Törlés veszi ki.',
  'help.guide.place-day-assign.tip.3':
    'Egy megálló, amit szállásfoglalás tett a napra, egyik gombot sem kínálja: azt az éjszakát a nap Szállás blokkjában adod hozzá és veszed ki.',
  // place-participants
  'help.guide.place-participants.title': 'Mondd meg, ki megy erre a megállóra',
  'help.guide.place-participants.goal': 'Oszd meg a csapatot egyetlen megállóra anélkül, hogy az utazást osztanád meg.',
  'help.guide.place-participants.step.1':
    'Kattints a megállóra a napon belül. A kártya megnyílik, a Résztvevők pedig felsorolják mindenkit az utazásban.',
  'help.guide.place-participants.step.2':
    'Kattints egy utazó címkéjére, hogy kivedd őt ebből a megállóból. A név áthúzva jelenik meg, ahogy fölé viszed a mutatót.',
  'help.guide.place-participants.step.3':
    'Amint valaki hiányzik, megjelenik egy szaggatott +. Kattints rá, hogy lásd, ki nincs a megállón.',
  'help.guide.place-participants.step.4':
    'Kattints egy névre, hogy visszatedd. Ha mindenki visszakerült, a megálló megint az egész csapaté.',
  'help.guide.place-participants.result':
    'A megálló azokat az utazókat viszi, akiket kiválasztottál, a csapat többi része pedig magának kapja azt a délutánt.',
  'help.guide.place-participants.tip.1':
    'A Résztvevők csak kiválasztott megállóval jelennek meg, ezért a helyet a napon belül válaszd, ne a helyek oszlopában, és csak olyan utazáson, ahol egynél több utazó van.',
  'help.guide.place-participants.tip.2':
    'Ha senki sincs kiválasztva, az azt jelenti, hogy mindenki megy, és ezért a megállón maradt utolsó utazót nem lehet kivenni.',
  'help.guide.place-participants.tip.3':
    'Egy Vendég, akinek nincs saját fiókja, ugyanúgy lehet résztvevő, mint bárki más.',
  // place-booking
  'help.guide.place-booking.title': 'A foglalás egy megállón',
  'help.guide.place-booking.goal': 'Olvasd el a megállóhoz tartozó foglalást, nyisd meg, és tűzz rá egy újat.',
  'help.guide.place-booking.step.1':
    'Nyisd meg a megállót, amelyikhez a foglalás tartozik. A kártya egy sávot mutat a Megerősítve vagy Függőben szóval és a foglalás nevével.',
  'help.guide.place-booking.step.2':
    'A sáv viszi a Dátumot, az Időpontot és a Foglalási kódot, meg bármilyen jegyzetet, ami a foglaláson van.',
  'help.guide.place-booking.step.3': 'Kattints a sávra. Megnyílik rajta a foglalás saját űrlapja.',
  'help.guide.place-booking.step.4':
    'Az Összekapcsolás napi tervvel az, ami egy foglalást egy megállóhoz tűz, és itt már ezt nevezi meg. Zárd be újra az űrlapot.',
  'help.guide.place-booking.step.5':
    'Egy megállóhoz tartozó új foglalás a napok oszlopában kezdődik: vidd a mutatót a megálló fölé, és kattints a végén lévő + jelre. Az űrlap Új foglalás néven nyílik meg, már hozzákapcsolva.',
  'help.guide.place-booking.result':
    'A foglalás a megállón lóg: rajta van a kártyán, benne van a napban, és a fájljai itt is fel vannak sorolva a Fájlok alatt.',
  'help.guide.place-booking.tip.1':
    'A sáv csak annál a megállónál jelenik meg, amelyikhez a foglalás hozzá van tűzve. A megálló nélküli foglalás a Foglalások fülön él.',
  'help.guide.place-booking.tip.2':
    'Több foglalás is osztozhat egy megállón: az ebéd és a túra, ami ugyanabból a kapuból indul.',
  'help.guide.place-booking.tip.3':
    'Egy vonat, egy járat vagy egy komp ehelyett a közlekedési űrlapot nyitja meg, azt, amit a Közlekedés fül használ.',
  // place-files
  'help.guide.place-files.title': 'Tartsd a hely jegyeit a helynél',
  'help.guide.place-files.goal': 'Tedd a hely jegyét, utalványát vagy térképét oda, ahol keresni fogod.',
  'help.guide.place-files.step.1':
    'Nyisd meg a helyet. A Fájlok a kártya alján van, és amíg a helynek nincs egy sem, Fájlok felirat áll rajta.',
  'help.guide.place-files.step.2': 'Kattints mellette a Feltöltés gombra, és válaszd ki a fájlt.',
  'help.guide.place-files.step.3': 'A gomb megszámolja, mit tart a hely, a lista pedig magától kinyílik.',
  'help.guide.place-files.step.4': 'Minden sor a fájl neve a méretével. Kattints rá, hogy megnyisd a fájlt.',
  'help.guide.place-files.result': 'A fájl a helyen ül, beleszámolva a kártyába, és ott van az utazás Fájlok fülén is.',
  'help.guide.place-files.tip.1':
    'A Fájlok azt is felsorolják, ami ennek a megállónak a foglalásán lóg, így egy szállodai visszaigazolás a szállodánál bukkan fel.',
  'help.guide.place-files.tip.2': 'A Feltöltés egyszerre több fájlt is elfogad.',
  'help.guide.place-files.tip.3':
    'A Fájlok feltöltése jog nélkül a Feltöltés gomb nincs ott; a helyen már meglévő fájlok viszont igen.',
  // place-navigation
  'help.guide.place-navigation.title': 'Hely megnyitása térképalkalmazásban vagy a weboldalán',
  'help.guide.place-navigation.goal': 'Add át a helyet annak az alkalmazásnak, ami tényleg odavisz.',
  'help.guide.place-navigation.step.1': 'Nyisd meg a helyet, és kattints a legalsó sorban a Navigáció gombra.',
  'help.guide.place-navigation.step.2':
    'A lista azok a térképalkalmazások, amik illenek ehhez a helyhez: Google Maps, Waze, Apple Maps, OpenStreetMap és CoMaps.',
  'help.guide.place-navigation.step.3':
    'Kattints arra, amelyiket használod. A TREK, ahol tudja, magát a helyet adja át neki, nem csak egy koordinátapárt, így a megfelelő bejáratnál kötsz ki.',
  'help.guide.place-navigation.step.4':
    'A mellette lévő Weboldal megnyitása a hely saját oldalát, az időpontjait és a jegyeit nyitja meg új lapon.',
  'help.guide.place-navigation.result':
    'A térképalkalmazás a helyen nyílik meg, a weboldal saját lapon, és az utazásban semmi sem változik.',
  'help.guide.place-navigation.tip.1':
    'A Waze azonnal navigálni kezd. A többi megnyitja a helyet, és onnan elindulni még egy koppintás.',
  'help.guide.place-navigation.tip.2':
    'Hogy melyik alkalmazások jelennek meg, a helytől és a készülékedtől függ: az Apple Maps Androidon kimarad, a 高德地图 csak kínai helynél jön elő, a Waze, az Apple Maps és a CoMaps pedig a hely koordinátáit igényli.',
  'help.guide.place-navigation.tip.3':
    'Ha csak egy alkalmazás jöhet szóba, a gomb annak az alkalmazásnak a nevét viseli, és egyből megnyitja.',
  // place-to-collection
  'help.guide.place-to-collection.title': 'Hely mentése az egyik listádba',
  'help.guide.place-to-collection.goal': 'Tartsd meg a következőre azt a helyet, amit ezen az utazáson találtál.',
  'help.guide.place-to-collection.step.1':
    'Nyisd meg a helyet, és kattints a kártya alján a Mentés gyűjteménybe gombra.',
  'help.guide.place-to-collection.step.2':
    'A Mentés listába minden listádat mutatja, amit birtokolsz vagy megosztva használsz. Pipa jelöli azokat, amikben ez a hely már benne van.',
  'help.guide.place-to-collection.step.3': 'Kattints a listára. A hely azonnal benne van.',
  'help.guide.place-to-collection.step.4': 'Zárd be, és a kártyán a gombon Mentve áll.',
  'help.guide.place-to-collection.result':
    'A hely ott van a listádban a képével, a jegyzeteivel és a címével, készen a következő utazásra.',
  'help.guide.place-to-collection.tip.1':
    'A gomb csak akkor van ott, ha a Gyűjtemények bővítmény be van kapcsolva, amit az adminisztrátor a Bővítmények alatt kapcsol be.',
  'help.guide.place-to-collection.tip.2':
    'Egy hely egyszerre több listában is ülhet, mindegyikben saját állapottal: az egyikben Ötlet, a másikban Meglátogatva.',
  'help.guide.place-to-collection.tip.3':
    'A Megjelölés látogatottként a hely neve mellett a választóban kipipálja a listában; ha a hely több listádban is benne van, a címkén Mindenhol látogatott áll, és egyszerre intézi mindet.',
  // place-track
  'help.guide.place-track.title': 'Olvass le egy nyomvonalat, és adj neki saját színt',
  'help.guide.place-track.goal':
    'Nézd meg, milyen hosszú egy importált túra, és különböztesd meg a vonalát a többitől a térképen.',
  'help.guide.place-track.step.1':
    'Egy nyomvonal sora a helyek oszlopában rövid vonást visel abban a színben, amivel a vonala rajzolódik. Kattints rá.',
  'help.guide.place-track.step.2': 'Az Útvonal adatok az útvonal hosszát adják meg, a beállított távolság egységben.',
  'help.guide.place-track.step.3':
    'A fölötte lévő Útvonal színe a használatban lévő színt mutatja. Kattints a sorra, hogy megnyisd a színmintákat.',
  'help.guide.place-track.step.4': 'Válassz színt. A vonal a térképen és a vonás a soron vele együtt változik.',
  'help.guide.place-track.step.5':
    'A bal oldali szaggatott cella, az Automatikus szín, visszaadja a nyomvonalnak az örökölt színét; a jobb oldali pipetta, az Egyéni szín kiválasztása, bármi másért megnyitja a rendszered színválasztóját.',
  'help.guide.place-track.result':
    'A nyomvonal a választott színben rajzolódik, a kártyán, a helyek oszlopában lévő során és a térképen.',
  'help.guide.place-track.tip.1':
    'Ez a két blokk csak olyan helyen van, ami útvonalat visz, GPX, KML vagy KMZ fájlból importálva.',
  'help.guide.place-track.tip.2':
    'Egy magasságokkal rögzített nyomvonal a legmagasabb és a legalacsonyabb pontját, a fel és le megtett métereket, meg a túra profilját is mutatja.',
  'help.guide.place-track.tip.3':
    'Egy import minden behozott nyomvonalnak saját színt ad, így két túra sosem érkezik ugyanabban.',
  // read-place
  'help.guide.read-place.step.7':
    'A legalsó sor az, amit innen tehetsz: leveheted a helyet a megnyitott napról vagy ráteheted, listába mentheted, megnyithatod egy térképalkalmazásban, szerkesztheted vagy törölheted.',

  // ── Screen: trip-files ────────────────────────────────────────────────────────────────
  'help.ctx.trip-files.title': 'Fájlok',
  'help.ctx.trip-files.summary':
    'Az utazás minden dokumentuma egy listában: jegyek, visszaigazolások, tárcakártyák és képek, mindegyik megjegyzéssel, a hozzá tartozó helyre vagy foglalásra mutató kapcsolattal, és egy kukával, amiből vissza lehet hozni.',
  'help.ctx.trip-files.bullet.1':
    'A felül lévő Húzd ide a fájlokat átveszi a fájlokat; a mezőre kattintva megnyílik a fájlválasztó. Az alatta lévő sor felsorolja, milyen fájltípusokat fogad ez a TREK, és a fájlonkénti 50 MB korlátot.',
  'help.ctx.trip-files.bullet.2':
    'A fülek mondják meg, mit mutat a lista: Összes, PDF-ek, Képek és Dokumentumok, mindegyik a maga darabszámával. Egy csillag csatlakozik hozzájuk, amint egy fájl csillagot kap, a Közös jegyzetek pedig, amint egy jegyzet mellékletet visz.',
  'help.ctx.trip-files.bullet.3':
    'Egy sor viszi, ki töltötte fel, a nevet, alatta a megjegyzést, a méretet és a dátumot, és kapcsolatonként egy jelvényt: Napi terv és a hely, Foglalás vagy Közlekedés és a foglalás, Közös jegyzetekből.',
  'help.ctx.trip-files.bullet.4':
    'A sor végén a Csillag, a Hozzárendelés, a Megnyitás, a Letöltés és a Törlés ül. A Törlés nem kérdez: a fájl a kukába megy, onnan vissza lehet hozni.',
  'help.ctx.trip-files.bullet.5':
    'Egy kép vagy egy videó teljes képernyőn nyílik meg, a nyílbillentyűkkel és egy bélyegképsávval; minden más dokumentum az oldal fölötti előnézetben nyílik meg, a Megnyitás új lapon és a Letöltés gombbal. Egy tárcakártya rögtön letöltődik.',
  'help.ctx.trip-files.bullet.6':
    'A jobb szélen lévő Kuka a törölt fájlokra váltja a listát, ahol mindegyik visszaállítható vagy véglegesen törölhető, a Kuka ürítése pedig mindet kitakarítja. Ahol egy rendszergazda dokumentumtárat kötött be, ott mellette ül a Dokumentumok szinkronizálása.',
  // files-upload
  'help.guide.files-upload.title': 'Dokumentum betétele az utazásba',
  'help.guide.files-upload.goal':
    'Hozz ki egy jegyet, egy visszaigazolást vagy egy fotót a letöltések mappájából az utazásba, ahol mindenki eléri, aki benne van.',
  'help.guide.files-upload.step.1':
    'Nyisd meg az utazást, és kattints a fülsorban a Fájlok fülre. Ott vannak felsorolva az utazás dokumentumai, fölöttük a feltöltő mezővel.',
  'help.guide.files-upload.step.2':
    'Kattints a Húzd ide a fájlokat mezőre, és válassz ki egy vagy több fájlt. Egymás után töltődnek fel, a mezőn pedig közben Feltöltés... áll. A mező alatti sor megmondja, milyen típusokat fogad ez a TREK, és hogy egy fájl legfeljebb 50 MB lehet.',
  'help.guide.files-upload.step.3':
    'Amint az utolsó fájl felkerült, magától megnyílik hozzá a Fájl hozzárendelése. A Megjegyzés hozzáadása... egy saját sort ad a fájlnak, az alatta lévő listák pedig helyhez vagy foglaláshoz kötik. Zárd be az ×-szel; a bezárással semmi nem vész el.',
  'help.guide.files-upload.step.4':
    'Az új fájlok a lista tetején állnak. Egy sor mutatja, ki töltötte fel, a nevet, a méretet és a dátumot; egy kép bélyegképet kap, minden más fájl a típusát.',
  'help.guide.files-upload.result':
    'A dokumentumok az utazásban vannak, és mindenki, aki látja az utazást, megnyithatja és letöltheti őket.',
  'help.guide.files-upload.tip.1':
    'Egy fájlt az asztalról egyenesen a mezőre is húzhatsz, ami kivilágosodik, amíg a fájl fölötte van.',
  'help.guide.files-upload.tip.2':
    'A vágólapon lévő kép Ctrl+V-vel kerül a listába, így egy foglalásról készült képernyőképet soha nem kell előbb elmenteni.',
  'help.guide.files-upload.tip.3':
    'A feltöltéshez Fájlok feltöltése jog kell; enélkül a mező egyáltalán nincs ott. A listán nem szereplő típust üzenettel visszautasítja, és semmi nem töltődik fel. Az 50 MB fölötti fájlt maga a mező dobja el, még mielőtt bármi elindulna.',
  // files-link
  'help.guide.files-link.title': 'Dokumentum kötése helyhez vagy foglaláshoz',
  'help.guide.files-link.goal':
    'Legyen a jegy megtalálható arról a napról is, amelyhez tartozik, ne csak ebből a listából.',
  'help.guide.files-link.step.1':
    'Kattints a Hozzárendelés gombra, a sor végén lévő ceruzára. Megnyílik a Fájl hozzárendelése, a fájlról elnevezve.',
  'help.guide.files-link.step.2':
    'A Megjegyzés alatt a Megjegyzés hozzáadása... egy sort fogad, ami aztán a fájl neve alatt áll a listában. Abban a pillanatban mentődik, ahogy kilépsz a mezőből.',
  'help.guide.files-link.step.3':
    'A Hely alatt az utazás helyei állnak, aszerint a nap szerint csoportosítva, amelyen vannak, a végén pedig a Nincs hozzárendelve azoknak, amelyek egyetlen napon sincsenek. Kattints egyre, és pipát kap.',
  'help.guide.files-link.step.4':
    'A Foglalás és a Közlekedés alatt az utazás foglalásai állnak. Kattints arra, amelyikhez a dokumentum tartozik; az is megkapja a maga pipáját.',
  'help.guide.files-link.step.5':
    'Zárd be az ×-szel. Itt nincs mentés gomb: minden kattintás abban a pillanatban íródott ki, ahogy megtetted.',
  'help.guide.files-link.result':
    'A sor viszi a megjegyzést és kapcsolatonként egy jelvényt, a Napi terv és a hely nevét, a Közlekedés és a járat nevét, a dokumentum pedig a helyen és a járaton is ott lóg.',
  'help.guide.files-link.tip.1':
    'Egy fájl több kapcsolatot is tarthat egyszerre, így ugyanaz a visszaigazolás a szállodához és az általa fedett éjszakához is tartozik.',
  'help.guide.files-link.tip.2':
    'Egy kipipált bejegyzésre újra kattintva elveszed azt a kapcsolatot; maga a fájl marad.',
  'help.guide.files-link.tip.3':
    'Fordítva is működik: egy helyhez vagy egy foglaláshoz csatolt dokumentum ebben a listában is benne van, ugyanazzal a jelvénnyel a sorában.',
  // files-star
  'help.guide.files-star.title': 'A fontos dokumentumok felül tartása',
  'help.guide.files-star.goal':
    'Húzd ki azt a két-három papírt, amire tényleg szükséged lesz, egy listából, ami az egész utazás alatt nő.',
  'help.guide.files-star.step.1':
    'Kattints a sor végén a Csillag gombra. Sárgára telik, a fájl neve elé egy második csillag kerül, a gombon pedig most Csillag eltávolítása áll.',
  'help.guide.files-star.step.2':
    'A lista újrarendezi magát: a csillagozott fájlok az összes többi fölött állnak, csoportokon belül a legújabbak elöl.',
  'help.guide.files-star.step.3':
    'A felső fülekhez csatlakozott egy csillag, mögötte a csillagozott fájlok számával. Kattints rá, és csak azokat látod.',
  'help.guide.files-star.result': 'A pultnál kellő papírok a lista tetején állnak, és egy fül semmi mást nem mutat.',
  'help.guide.files-star.tip.1':
    'A csillag fül csak addig létezik, amíg valami csillagozott. Vedd le a csillagot az utolsó fájlról, és a fül is eltűnik vele.',
  'help.guide.files-star.tip.2':
    'A csillagozás szerkesztésnek számít: az a tag, aki csak olvashatja az utazás fájljait, látja a csillagokat, de nem tudja beállítani őket.',
  // files-filter
  'help.guide.files-filter.title': 'Dokumentum megtalálása a listában',
  'help.guide.files-filter.goal': 'Szűkítsd a mindent tartalmazó listát arra az egy papírfajtára, amit keresel.',
  'help.guide.files-filter.step.1':
    'A lista fölötti fülek az Összes, a PDF-ek, a Képek és a Dokumentumok, mindegyik mögött a fájlok számával.',
  'help.guide.files-filter.step.2': 'Kattints a PDF-ek fülre: a lista a PDF-fájlokat tartja meg, mást semmit.',
  'help.guide.files-filter.step.3':
    'Még két fül jön és megy azzal, mi van az utazásban. Kattints a Közös jegyzetek fülre, amely ott van, amint egy jegyzet az Együttműködés fülön mellékletet visz: a lista azokat a fájlokat tartja meg, mást semmit. Ugyanígy csatlakozik a sorhoz egy csillag, amint egy fájl csillagot kap.',
  'help.guide.files-filter.step.4': 'Az Összes visszahozza az egész listát.',
  'help.guide.files-filter.result':
    'A lista csak azt mutatja, amit a fül megnevez, és a füleken lévő szám megmondja, hány az.',
  'help.guide.files-filter.tip.1':
    'Itt nincsenek mappák és nincs átnevezés: a dokumentumot a Fájl hozzárendelése alatti megjegyzés, a helyekhez és foglalásokhoz vezető kapcsolatok és a csillag rendezik.',
  'help.guide.files-filter.tip.2':
    'Maga a lista mindig előbb a csillag, aztán a legújabb szerint megy, így egy ma feltöltött dokumentum a múlt hónapi fölött áll.',
  // files-preview
  'help.guide.files-preview.title': 'Dokumentum olvasása a TREK elhagyása nélkül',
  'help.guide.files-preview.goal':
    'Nézz meg egy jegyet vagy egy képet helyben, és tedd a saját gépedre, amikor ott van rá szükséged.',
  'help.guide.files-preview.step.1':
    'Kattints egy kép nevére vagy a bélyegképére. Teljes képernyőn nyílik meg, a fejlécben a fájl nevével és a képek közötti helyével.',
  'help.guide.files-preview.step.2':
    'Az oldalt lévő kerek nyilak, a bal és jobb nyílbillentyű és az alul lévő bélyegképsáv végigvezet minden képen, amit a lista éppen mutat.',
  'help.guide.files-preview.step.3':
    'A Megnyitás új lapon és a Letöltés a fejlécben ül; az × vagy az Escape újra bezárja a képet.',
  'help.guide.files-preview.step.4':
    'Egy dokumentum, ami nem kép, helyette az oldal fölötti előnézetben nyílik meg, ugyanazzal a két gombbal a fejlécében. Ez az ×-re vagy a mellette lévő kattintásra záródik be.',
  'help.guide.files-preview.step.5':
    'A sor végén lévő Letöltés egyenesen a gépedre menti a fájlt, anélkül hogy előbb bármit megnyitna.',
  'help.guide.files-preview.result':
    'A dokumentum a képernyőn van, és ugyanaz a két gomb teszi böngészőlapra vagy a lemezedre.',
  'help.guide.files-preview.tip.1': 'Érintőképernyőn a nyilakra kattintás helyett végighúzod az ujjad a képeken.',
  'help.guide.files-preview.tip.2':
    'Egy tárcakártya soha nem nyit előnézetet: rögtön letöltődik, hogy a telefon átadhassa a tárcaalkalmazásának.',
  'help.guide.files-preview.tip.3':
    'A Megnyitás új lapon és a Letöltés is a te munkameneteddel hozza le a fájlt, így a címsorból kimásolt link senki másnak nem ér semmit.',
  // files-trash
  'help.guide.files-trash.title': 'Dokumentum kidobása és visszahozása',
  'help.guide.files-trash.goal':
    'Takarítsd ki, amire az utazásnak már nincs szüksége, anélkül hogy elveszítenél bármit, amire mégis szükséged volt.',
  'help.guide.files-trash.step.1':
    'Kattints a sor végén a Törlés gombra. A fájl rögtön elhagyja a listát, az üzenet pedig Kukába helyezve. Előtte semmi nem kérdez.',
  'help.guide.files-trash.step.2':
    'Az eszköztár jobb szélén lévő Kuka arra váltja a listát, amit kidobtál. A cím Kuka, a szűrőfülek pedig eltűntek.',
  'help.guide.files-trash.step.3':
    'Egy kidobott sor ki van szürkítve, és két gombja maradt: a Visszaállítás, ami visszahozza a fájlt, és a Törlés, ami egy kérdés után véglegesen eltávolítja.',
  'help.guide.files-trash.step.4':
    'Kattints a Visszaállítás gombra. Az üzenet Fájl visszaállítva, a sor pedig elhagyja a kukát, a megjegyzésével és a kapcsolataival együtt.',
  'help.guide.files-trash.step.5':
    'A felül lévő Kuka ürítése véglegesen kitakarít mindent, ami még itt van, és a böngésző egyszer megkérdezi, mielőtt megtenné. A Kuka visszavált a fájlokra.',
  'help.guide.files-trash.result': 'A fájl megint a listában van, ott, ahol volt, mintha mi sem történt volna.',
  'help.guide.files-trash.tip.1':
    'A soron lévő Törlés előbb nem kérdez, és pont ezért van a kuka: semmi nem hagyja el a TREK-et, amíg itt ki nem mondod.',
  'help.guide.files-trash.tip.2':
    'Egy fájl kidobásához és visszahozásához Fájlok törlése jog kell. Az a tag, akinek nincs meg, sem a soron lévő Törlést, sem a kukában lévő gombokat nem látja.',
  'help.guide.files-trash.tip.3': 'A kukában véglegesen törölt fájlt már nem lehet visszahozni.',
  // files-sync
  'help.guide.files-sync.title': 'A dokumentumok szinkronban tartása a dokumentumtáraddal',
  'help.guide.files-sync.goal':
    'Kösd az utazást a saját dokumentumtáradhoz, hogy ami itt feltöltődik, ott landoljon, és ami ott kerül lerakásra, itt bukkanjon fel.',
  'help.guide.files-sync.step.1':
    'Kattints a Dokumentumok szinkronizálása gombra, a Kuka mellett az eszköztár jobb végén. A párbeszédablak az utazás nevével nyílik meg a címe alatt. Balra, a Szolgáltató csatlakoztatása alatt állnak a tárolók, amiket egy rendszergazda bekapcsolt, mindegyik egy sorral arról, hogyan rendszerez: a Paperless-ngx és a Papra címke szerint, a Nextcloud és a Synology Drive mappába, az OpenCloud térbe. Jobbra Még nincs semmi csatlakoztatva áll.',
  'help.guide.files-sync.step.2':
    'Kattints a tárolódra, itt a Nextcloudra. Egy kisebb párbeszédablak nyílik meg a kapcsolathoz, a tárolóról elnevezve, és azt kéri be, amivel ennél a tárolónál be lehet jelentkezni.',
  'help.guide.files-sync.step.3':
    'Töltsd ki a Cím mezőt és a tároló saját bejelentkezési adatait: egy API-tokent a Paperless-ngx-nél, egy API-kulcsot és a Szervezet azonosítóját a Papránál, Felhasználónevet és egy Alkalmazásjelszót a Nextcloudnál, Felhasználónevet és egy Alkalmazástokent az OpenCloudnál, a Synology Drive-nál pedig Felhasználónevet, Jelszót és, ha a fiók kér ilyet, egy Kétlépcsős kódot. Ahol a tároló kínál ilyet, mindig alkalmazásjelszót vagy tokent használj, soha ne a fiókod jelszavát. A Nextcloud és a Synology Drive ezenfelül egy nem kötelező Alapmappát is elfogad, ahol a TREK az utak mappáit keresi, itt /Reisen. Az alul lévő Saját aláírású tanúsítvány elfogadása csak a saját hálózatodon lévő, ilyen tanúsítványú tárolóhoz való.',
  'help.guide.files-sync.step.4':
    'Kattints a Kapcsolat tesztelése gombra. A TREK eléri a tárolót azzal, amit beírtál, és a láblécen Elértem, bejelentkezve mint áll, utána a fiók nevével. Az elutasított hitelesítő adatokat vagy egy elérhetetlen címet helyette ott nevezi meg, és egyik esetben sem ment semmit.',
  'help.guide.files-sync.step.5':
    'Kattints a Csatlakozás gombra. A kapcsolat az utazással együtt mentődik, és a TREK megkérdezi, hová kerüljön az út a tárolóban: melyik címke, mappa vagy tér tartsa a dokumentumait. Csak az szinkronizálódik, ami abban van. Az Új létrehozása a Létrehozás gombra létrehozza, az utazás címéből előre kitöltött névvel; a Vagy használj egy meglévőt alatt állnak a már meglévők. Kattints egyre, itt az Autumn in Japan mappára.',
  'help.guide.files-sync.step.6':
    'A párbeszédablak visszajött: a tárolód balra az Ez az út alatt áll, a kártyája jobbra pedig mutatja, hová szinkronizál, mikor futott utoljára, és a Szinkronizálás most gombot. Az első futás magától indul; a Szinkronizálás most bármikor lefuttat egyet. Amint egy futás átment, a név melletti Még nincs szinkronizálva jelvény zöld pontnak adja át a helyét, Naprakész, ha rámutatsz, és a folyamsáv számolja a dokumentumokat, amiket a TREK és a tároló külön-külön tart, köztük a Ki a tárolóba és a Be a tárolóból sávokkal. Zárd be a párbeszédablakot a × jellel.',
  'help.guide.files-sync.result':
    'A dokumentumok, amik már ott voltak, a lista tetején állnak, a te nevedben feltöltve, és az utazás minden dokumentuma a tárolóban is megvan. Mostantól a TREK a háttérben ellenőrzi a tárolót, és a tároló követi a listát.',
  'help.guide.files-sync.tip.1':
    'Csak az utazás tulajdonosa vagy egy példány-rendszergazda kötheti be az utazást, mivel a hitelesítő adatok az egész fiókot elérik a tárolóban. Minden tag megnyithatja a Dokumentumok szinkronizálása ablakot, elolvashatja a kártyát és megnyomhatja a Szinkronizálás most gombot.',
  'help.guide.files-sync.tip.2':
    'A saját hálózatodon lévő tárolóhoz ALLOW_INTERNAL_NETWORK=true kell a TREK-szerveren, és a címének a gép hálózati címének kell lennie, soha nem localhost. Enélkül a Kapcsolat tesztelése azt válaszolja: Ez a cím nem engedélyezett.',
  'help.guide.files-sync.tip.3':
    'A kártyán lévő Leválasztás megszünteti a párosítást, és mindkét oldalon megtart minden dokumentumot. Egy másodszor bekötött címkét, mappát vagy teret újként kezel, és minden, ami benne van, újra bejön, ezért egy Leválasztás után inkább egy üreset köss be, ne a régit.',

  // ── Screen: trip-day-detail ───────────────────────────────────────────────────────────
  'help.ctx.trip-day-detail.title': 'Nap részletei',
  'help.ctx.trip-day-detail.summary':
    'A panel, amit egy nap fejléce nyit meg a térkép fölött: a nap mint egész, a neve és a dátuma, az időjárás ott, ahol leszel, a rá eső foglalások és a rá lefoglalt éjszakák.',
  'help.ctx.trip-day-detail.bullet.1':
    'Kattints egy nap fejlécére a napok oszlopában, és a panel a térkép közepe fölött nyílik meg. Ugyanaz a fejléc újra, vagy a jobb szélén lévő X, bezárja és elengedi a napot.',
  'help.ctx.trip-day-detail.bullet.2':
    'A fejléc a nap nevét és dátumát viseli. A név melletti ceruza átnevezi a napot, a dupla nyíl keskeny sávvá csukja a panelt, így a térkép újra szabad.',
  'help.ctx.trip-day-detail.bullet.3':
    'Legfelül a nap időjárása. Az Előrejelzés megnevezi a helyet, amelyre vonatkozik: a nap első megállóját, vagy a szállodát, ahol felébredsz.',
  'help.ctx.trip-day-detail.bullet.4':
    'A Foglalások felsorolja az aznapi foglalásokat, mindegyiket a fajtájával, a megállóval, amelyhez tartozik, és az időpontjaival. A zöld azt jelenti, megerősítve, a borostyánsárga még függőben; ez csak kiolvasás, a foglalásokat a Foglalások fülön módosítod.',
  'help.ctx.trip-day-detail.bullet.5':
    'A Szállás megmutatja az erre a napra lefoglalt minden éjszakát, a Bejelentkezés és a Kijelentkezés címkével azokon a napokon, amikor megtörténnek, a bejelentkezési ablakkal, a kijelentkezés idejével és a visszaigazolási számmal.',
  'help.ctx.trip-day-detail.bullet.6':
    'A Szállás hozzáadása erre a napra foglal egy éjszakát: válaszd ki a szálláshelyet az utazás helyei közül, mondd meg, mely napokat fedi le, és add meg az időpontokat és a kódot.',
  // day-panel
  'help.guide.day-panel.title': 'Nyiss meg egy napot, és olvasd el a részleteit',
  'help.guide.day-panel.goal':
    'Láss egy napot egészben, az időjárását, a foglalásait és azt, hol alszol, anélkül, hogy elhagynád a térképet.',
  'help.guide.day-panel.step.1':
    'Kattints egy nap fejlécére a napok oszlopában. A nap ki van választva, és a részletei a térkép közepe fölött nyílnak meg.',
  'help.guide.day-panel.step.2': 'A fejléc megnevezi a napot, 1. nap, amíg nem adsz neki nevet, alatta a dátummal.',
  'help.guide.day-panel.step.3':
    'Legfelül a nap időjárása. Az Előrejelzés megmondja, melyik helyre vonatkozik: a nap első megállójára, vagy a szállodára, ahol felébredsz.',
  'help.guide.day-panel.step.4': 'Alatta a Foglalások felsorolja az erre a napra eső foglalásokat, az időpontjaikkal.',
  'help.guide.day-panel.step.5':
    'A Szállás megmutatja az erre a napra lefoglalt éjszakákat, a Bejelentkezés és a Kijelentkezés címkével azokon a napokon, amikor megtörténnek.',
  'help.guide.day-panel.step.6':
    'A fejlécben lévő dupla nyíl keskeny sávvá csukja a panelt. A mellette lévő X bezárja a panelt, és elengedi a napot.',
  'help.guide.day-panel.result':
    'A sávvá csukott panel szabadon hagyja a térképet, és a nap kiválasztva marad; bezárva a nap kijelölése megszűnik, és a terv olyan, amilyen volt.',
  'help.guide.day-panel.tip.1':
    'A panel fejlécsávjának bármelyik pontjára kattintva is összecsukódik. A nyíl csak a gomb hozzá.',
  'help.guide.day-panel.tip.2':
    'Ha megnyitsz egy helyet a helyek oszlopából, a hely részletei a panel helyére kerülnek. Zárd be őket, és a nap visszajön.',
  // day-weather
  'help.guide.day-weather.title': 'Olvasd le a nap időjárását',
  'help.guide.day-weather.goal': 'Tudd, milyen lesz a nap ott, ahol azon a napon tényleg vagy.',
  'help.guide.day-weather.step.1':
    'Az Előrejelzés megnevezi a helyet, amelyre a számok vonatkoznak: a nap első megállóját, vagy megálló nélküli napon a szállodát, ahol felébredsz.',
  'help.guide.day-weather.step.2':
    'A nagy szám a nap hőmérséklete, mellette a minimum és a maximum, és az időjárás szavakkal.',
  'help.guide.day-weather.step.3':
    'Alatta a címkék: a csapadék valószínűsége, mennyi lesz belőle, a legerősebb szél, meg a napkelte és a napnyugta.',
  'help.guide.day-weather.step.4':
    'Legalul a nap óráról órára, minden második órában: az idő, az ikon, a hőmérséklet és a csapadék valószínűsége. Az 50 százalék fölötti óra kékkel van árnyékolva.',
  'help.guide.day-weather.result':
    'A nap kártyája a napok oszlopában ugyanazt az időjárást viseli kicsiben a száma alatt, így az egész utazás egy pillantással olvasható.',
  'help.guide.day-weather.tip.1':
    'A fokok és a szél a Beállításokban a Megjelenés alatti Hőmérséklet egység beállítást követik: válaszd a °F Fahrenheit lehetőséget, és ugyanaz az előrejelzés °F és mph egységben olvasható ki.',
  'help.guide.day-weather.tip.2':
    'Egy nap, amelynek nincs helyhez kötött megállója és nincs szállodája, ahol felébredni, egyáltalán nem mutat időjárást: az előrejelzés mindig egy helyre szól, sosem az utazásra.',
  'help.guide.day-weather.tip.3':
    '16 napnál messzebb előre nincs előrejelzés. A számok ilyenkor a korábbi évek átlagai arra a dátumra, Ø jellel megjelölve, és alatta ez oda is van írva.',
  // rename-day
  'help.guide.rename-day.title': 'Adj nevet a napnak',
  'help.guide.rename-day.goal': 'Hívd a napot annak, ami, Érkezés Kyotoba vagy Pihenőnap, az 5. nap helyett.',
  'help.guide.rename-day.step.1': 'Nyisd meg a napot. A fejléce 5. nap, alatta a dátummal.',
  'help.guide.rename-day.step.2': 'Kattints a név melletti ceruzára.',
  'help.guide.rename-day.step.3': 'A név mezővé változik. Írd be a nevet, amit szeretnél.',
  'help.guide.rename-day.step.4':
    'Nyomj Entert, vagy egyszerűen kattints máshová; az Escape eldobja a változtatást. A nap kártyája a napok oszlopában is viseli a nevet.',
  'help.guide.rename-day.result':
    'A név az 5. nap helyére lép a panelen és a nap kártyáján a napok oszlopában; a dátum ott marad, ahol volt.',
  'help.guide.rename-day.tip.1':
    'Töröld ki a mezőt és ments, és a nap újra 5. nap: a szám az, ami látszik, ha nincs név.',
  'help.guide.rename-day.tip.2':
    'A név a naphoz tartozik, nem a dátumához. Rendezd át a napokat, és minden mással együtt vándorol azon a napon.',
  // add-accommodation
  'help.guide.add-accommodation.title': 'Foglalj éjszakát egy napra',
  'help.guide.add-accommodation.goal':
    'Tedd be a szállodát a tervbe egyszer, a napokkal, amiket lefed, az időpontjaival és a visszaigazolási számával.',
  'help.guide.add-accommodation.step.1':
    'A szálláshelynek előbb az utazás helyének kell lennie. Hozd létre a helyek oszlopában, ahogy bármely más helyet: a választó csak azt kínálja, ami már ott van.',
  'help.guide.add-accommodation.step.2':
    'Nyisd meg az érkezés napját, és kattints a Szállás alatt a Szállás hozzáadása gombra.',
  'help.guide.add-accommodation.step.3':
    'Az Alkalmazás napokra megmondja, mely éjszakákat fedi le a tartózkodás: balra a bejelentkezés napja, jobbra a kijelentkezés napja. Az Összes az egész utazást lefedi.',
  'help.guide.add-accommodation.step.4':
    'Töltsd ki a Bejelentkezés, az Eddig és a Kijelentkezés mezőt, a foglalás számát pedig írd a Visszaigazolás alá. Mind a négy maradhat üresen.',
  'help.guide.add-accommodation.step.5':
    'Válaszd ki a szálláshelyet az utazás helyei közül. A lista fölötti címkék egyetlen kategóriára szűkítik.',
  'help.guide.add-accommodation.step.6': 'Kattints a Mentés gombra.',
  'help.guide.add-accommodation.result':
    'A tartózkodás minden napon látszik, amit lefed, az elsőn Bejelentkezés, az utolsón Kijelentkezés. A szálláshely megállóvá válik a bejelentkezés napján, így a térkép megrajzolja az odavezető utat, és a Foglalások fülön megjelenik egy Szálloda típusú foglalás.',
  'help.guide.add-accommodation.tip.1':
    'A választó azon a napon nyílik, ahonnan jöttél, a kijelentkezés a rá következő napon; mentés előtt mindkettő mozgatható.',
  'help.guide.add-accommodation.tip.2':
    'Add a szállodának létrehozáskor az utazás Hotel kategóriáját, és a lista fölötti címkék egy kattintással a szállodáidra szűkítenek.',
  'help.guide.add-accommodation.tip.3':
    'Az időpontok mind opcionálisak: a bejelentkezés és kód nélküli tartózkodás is lefedi az éjszakáit, és megrajzolja az útvonalát.',
  // edit-accommodation
  'help.guide.edit-accommodation.title': 'Változtass meg vagy mondj le egy lefoglalt éjszakát',
  'help.guide.edit-accommodation.goal':
    'Mozgass el egy tartózkodást, javítsd az időpontjait, vagy vedd ki újra a tervből.',
  'help.guide.edit-accommodation.step.1':
    'A tartózkodás minden napján a kártya a szálláshelyet, a bejelentkezési ablakot, a kijelentkezés idejét és a visszaigazolási számot mutatja.',
  'help.guide.edit-accommodation.step.2':
    'A jobb szélén lévő ceruza újra megnyitja a tartózkodást. Az ablak most Szállás szerkesztése feliratot visel.',
  'help.guide.edit-accommodation.step.3':
    'Javítsd ki a mezők sorát: Bejelentkezés, Eddig, Kijelentkezés és Visszaigazolás. A fölötte lévő napok és az alatta lévő szálláshely is módosítható itt.',
  'help.guide.edit-accommodation.step.4': 'Kattints a Mentés gombra.',
  'help.guide.edit-accommodation.step.5':
    'A ceruza melletti X lezárja a tartózkodást. Semmit sem kérdez, és a hozzá tartozó Szálloda típusú foglalás is vele megy.',
  'help.guide.edit-accommodation.result':
    'A változás egyszerre éri el a tartózkodás minden napját, és vele a Foglalások fülön lévő Szálloda típusú foglalást is.',
  'help.guide.edit-accommodation.tip.1':
    'A tartózkodás közepén lévő éjszaka sem Bejelentkezés, sem Kijelentkezés címkét nem visel: csak a tartomány első és utolsó napja.',
  'help.guide.edit-accommodation.tip.2':
    'Egy tartózkodás lemondása elviszi azt a megállót is, amit a bejelentkezés napjára tett, és a foglalásához csatolt minden költséget. Foglald újra az éjszakát, ha tévedés volt.',
  // day-bookings
  'help.guide.day-bookings.title': 'A nap foglalásai egy pillantásra',
  'help.guide.day-bookings.goal': 'Lásd egy helyen, mi van már lefoglalva erre a napra, és hogy meg van-e erősítve.',
  'help.guide.day-bookings.step.1':
    'A Foglalások felsorolja a nap foglalásait: azokat, amiknek a dátuma rá esik, és azokat, amik a megállói valamelyikén lógnak.',
  'help.guide.day-bookings.step.2':
    'Egy sor megmutatja, milyen fajta foglalás, a nevét, és ha megállóhoz tartozik, azt a megállót egy pont után. Az időpontjai a jobb szélen ülnek.',
  'help.guide.day-bookings.step.3':
    'A szín megmondja, hol tart egy foglalás: a zöld sor meg van erősítve, a borostyánsárga még függőben van. A szállodák nincsenek ebben a listában, nekik lent saját blokkjuk van.',
  'help.guide.day-bookings.step.4':
    'A lista csak kiolvassa a foglalásokat. Foglalást a Foglalások fülön hozol létre és módosítasz.',
  'help.guide.day-bookings.result':
    'Minden, aminek a dátuma a napra esik, és minden, ami a megállói valamelyikén lóg, ebben az egy listában van.',
  'help.guide.day-bookings.tip.1':
    'Egy foglalás a saját dátuma szerint kerül egy napra. Változtasd meg a dátumot a Foglalások fülön, és magától átkerül a másik napra.',
  'help.guide.day-bookings.tip.2':
    'Ha nincs Foglalások blokk, a napnak nincsenek foglalásai: inkább rejtve marad, mint hogy üresen jelenjen meg.',

  // ── Screen: trip-map ──────────────────────────────────────────────────────────────────
  'help.ctx.trip-map.title': 'Térkép',
  'help.ctx.trip-map.summary':
    'A terv közepe: az utazás minden helye tűként, az őket összekötő útvonalak, és a térkép szélein a kapcsolók a műholdhoz, a teljes utazáshoz egyszerre és a város éppen nézett részének helyeihez.',
  'help.ctx.trip-map.bullet.1':
    'A tű egy hely: saját fotója, ha van neki, egyébként a kategóriája színe a kategória ikonjával. Vidd fölé az egeret, és kapsz egy kártyát a nevével és a címével, mellettük a kategóriájával és az értékelésével ott, ahol a hely hoz ilyet. Húzz egy tűt egy napkártyára, és a hely arra a napra kerül a tervbe.',
  'help.ctx.trip-map.bullet.2':
    'Az egymáshoz túl közel álló, megkülönböztethetetlen tűk egyetlen sötét buborékba záródnak egy számmal. Kattints a buborékra, és a térkép ráközelít arra, ami benne van.',
  'help.ctx.trip-map.bullet.3':
    'Kattints egy tűre, és a hely megnyílik a térkép alatt, az értékelésével, a fájljaival és azzal, mi legyen vele ezután; kattints a térkép egy üres darabjára, és újra elengeded.',
  'help.ctx.trip-map.bullet.4':
    'Ha a napok oszlopában meg van nyitva egy nap, a megállói kis fehér jelvényt viselnek az adott napi sorszámukkal, és a két napra tervezett hely mindkét számot viseli, · jellel összekötve.',
  'help.ctx.trip-map.bullet.5':
    'A felső ikonsor a térkép látható részében keres: Éttermek, Kávézók, Bárok és éjszakai élet, Szállás, Látnivalók, Múzeumok és kultúra, Természet és parkok, valamint Programok. A Keresés ezen a területen újra lefuttatja, miután elmozgattad a térképet.',
  'help.ctx.trip-map.bullet.6':
    'Kattints jobb gombbal bárhová a térképen, és az adott pontnál megnyílik a hely űrlapja, a már kikeresett címmel. A bal alsó kerek gomb a rajzolt térképet légi felvételekre cseréli.',
  'help.ctx.trip-map.bullet.7':
    'A jobb alsó Teljes utazás megjelenítése egyszerre rajzolja meg az összes utazási napot, és kilistázza, mit fed le mindegyik; egy foglalás sorában az útvonal ikon azt a foglalást rajzolja meg, a napok fölötti eszköztárban lévő pedig az összeset.',
  // map-markers
  'help.guide.map-markers.title': 'Olvasd a térképet',
  'help.guide.map-markers.goal': 'Tudd, mit mond neked a térképen minden tű, jelvény és buborék.',
  'help.guide.map-markers.step.1':
    'A térkép az utazás minden helyét tartja. Ahol a tűk túl közel állnak ahhoz, hogy megkülönböztesd őket, egyetlen sötét buborékba záródnak, amely a bennük lévő számot viseli; kattints a buborékra, és a térkép ráközelít arra, ami benne volt, vagy a legmélyebb nagyításnál legyezőbe bontja a tűket.',
  'help.guide.map-markers.step.2':
    'A tű a hely saját fotója, ha van neki, egyébként a kategóriája színe a kategória ikonjával. Vidd fölé az egeret, és egy kártya megadja a nevét és a címét, mellettük a kategóriáját és az értékelését ott, ahol a hely hoz ilyet.',
  'help.guide.map-markers.step.3':
    'Kattints egy tűre, és a hely egy kártyában nyílik meg a térkép alatt: a koordinátái, az értékelése, a Fájlok, és az alsó szélén az, hogy mi legyen vele ezután, köztük a Navigáció, a Szerkesztés és a Törlés, nyitott nap mellett pedig a Hozzáadás a naphoz. Kattints a térkép egy üres darabjára, és újra elengeded.',
  'help.guide.map-markers.step.4':
    'Nyiss meg egy napot a napok oszlopában, és a megállói sorszámot kapnak: a tű sarkában lévő kis fehér jelvény az adott megálló helye a napban. A két napra tervezett hely mindkét számot viseli, · jellel összekötve. Megnyitott nap nélkül nincsenek számok, és a sarok helyettük az értékelést viseli.',
  'help.guide.map-markers.step.5':
    'Húzz egy tűt a térképről egy napkártyára a napok oszlopában, és a hely arra a napra kerül a tervbe, pontosan úgy, mintha a sorát húznád ki a helyek listájából.',
  'help.guide.map-markers.result':
    'Az utazáson semmi sem változott: a térkép egy nézete annak, és minden tű megmondja, melyik helyről van szó, melyik napon és milyen sorrendben.',
  'help.guide.map-markers.tip.1':
    'A napok oszlopában összecsukott nap magával viszi a megállóit a térképről is; nyisd meg újra a napot, és visszajönnek.',
  'help.guide.map-markers.tip.2':
    'A helyek listája fölötti szűrő arról is dönt, mit rajzol a térkép: válaszd a Nem tervezett lehetőséget, és csak a még nap nélküli helyek maradnak rajta.',
  'help.guide.map-markers.tip.3':
    'Ezen a térképen nincsenek nagyítógombok: a görgő nagyít, a dupla kattintás egy lépést közelít, magának a térképnek a húzása pedig mozgatja.',
  // map-nearby-places
  'help.guide.map-nearby-places.title': 'Találj helyeket magad körül a térképen',
  'help.guide.map-nearby-places.goal':
    'Kerestess a térképpel éttermet, látnivalót vagy szállodát a város éppen nézett részében, és vegyél be egyet az utazásba.',
  'help.guide.map-nearby-places.step.1':
    'A térkép tetején lévő ikonsor a kategóriakeresés: Éttermek, Kávézók, Bárok és éjszakai élet, Szállás, Látnivalók, Múzeumok és kultúra, Természet és parkok, valamint Programok.',
  'help.guide.map-nearby-places.step.2':
    'Kattints egy kategóriára. A TREK ilyen fajta helyet keres a térkép látható részében, és minden találathoz letesz egy tűt a kategória színében. Egyszerre egy kategória: egy másikra kattintva lecseréled, a bekapcsoltra kattintva kikapcsolod.',
  'help.guide.map-nearby-places.step.3':
    'Mozgasd el a térképet, és a sor alatt megjelenik egy második gomb: a Keresés ezen a területen ugyanazt a keresést futtatja az új nézetre. A puszta mozgatás soha nem keres újra, ez alacsonyan tartja a kérések számát.',
  'help.guide.map-nearby-places.step.4':
    'A tűk annak a nevét viselik, amit találtak. Kattints egyre, és a hely űrlapja már abból kitöltve nyílik meg: Név, Cím, Szélességi fok és Hosszúsági fok, valamint a weboldal és a telefonszám ott, ahol az OpenStreetMap ismeri őket.',
  'help.guide.map-nearby-places.step.5':
    'Ellenőrizd, mit töltött ki, és add hozzá, amit a keresés nem tudhatott: egy Leírást, egy Kategóriát, saját jegyzeteket.',
  'help.guide.map-nearby-places.step.6':
    'Kattints a Hozzáadás gombra. Ha már van azonos nevű hely az utazásban, az űrlap szól, és a gombból Hozzáadás mindenképp lesz.',
  'help.guide.map-nearby-places.result':
    'A hely benne van a helyek listájában és a térképen az utazás saját tűinek egyikeként, a Nem tervezett alatt, amíg egy napra nem teszed. A keresés tűi addig maradnak, amíg ki nem kapcsolod a kategóriát.',
  'help.guide.map-nearby-places.tip.1':
    'A sor eltűnik, ha a Beállításokban, a Travel & map alatt a Helyek felfedezése a térképen ki van kapcsolva.',
  'help.guide.map-nearby-places.tip.2':
    'A válaszok a TREK Places indexből és az OpenStreetMapből jönnek, így ez a terv kevés olyan dolgának egyike, amihez kapcsolat kell.',
  'help.guide.map-nearby-places.tip.3':
    'Egy keresés azt fedi le, ami a képernyőn van, ezért nagyíts rá az utcára, amiről kérdezel: egy egész város az első hatvan találattal felel, és kevés renddel közöttük.',
  // map-add-place
  'help.guide.map-add-place.title': 'Hozz létre helyet a térképre jobb gombbal kattintva',
  'help.guide.map-add-place.goal': 'Tedd a helyet pontosan oda, ahová szeretnéd, anélkül hogy előbb rákeresnél.',
  'help.guide.map-add-place.step.1':
    'Kattints jobb gombbal a térképen arra a pontra, amelyikre gondolsz. Megnyílik a hely űrlapja Hely/Tevékenység hozzáadása címmel.',
  'help.guide.map-add-place.step.2':
    'A Szélességi fok és a Hosszúsági fok már azon a ponton áll, a TREK pedig kikeresi a koordinátákat, és abból tölti ki a Cím mezőt, amit ott talál, és a Név mezőt is ott, ahol a keresésnek van mit adnia. Még semmi sincs elmentve, úgyhogy írd felül, ami rossz.',
  'help.guide.map-add-place.step.3':
    'Adj neki olyan Nevet, amit felismersz, és a többit, amit a tervnek tudnia kell: Leírás, Jegyzetek, Kategória, Weboldal.',
  'help.guide.map-add-place.step.4':
    'Kattints a Hozzáadás gombra. A hely nem tervezettként kerül a listába akkor is, ha meg van nyitva egy nap: a jobb kattintás a térképen azt mondja meg, hol, nem azt, mikor.',
  'help.guide.map-add-place.result':
    'A hely benne van a listában és a térképen, a Nem tervezett alatt, amíg egy napra nem teszed.',
  'help.guide.map-add-place.tip.1':
    'A cím a koordináták kikereséséből jön, ezért inkább utcaként hangozhat, mint névként, nyílt vidék fölött pedig üresen térhet vissza. Mindkét mezőt felülírhatod.',
  'help.guide.map-add-place.tip.2':
    'A MapLibre GL és a Mapbox GL térképeken a középső kattintás ugyanezt teszi, érintőképernyőn pedig a hosszú nyomás.',
  // map-satellite
  'help.guide.map-satellite.title': 'Válts műholdra',
  'help.guide.map-satellite.goal': 'Cseréld a rajzolt térképet légi felvételekre, és vissza.',
  'help.guide.map-satellite.step.1':
    'A térkép bal alsó sarkában lévő kerek gomb az alapréteg kapcsolója. Az ikonja mindig azt a réteget mutatja, amelyikre váltana, és fölé víve megmondja, melyiket: Váltás műholdas nézetre. Kattints rá.',
  'help.guide.map-satellite.step.2':
    'A térkép most légi felvétel, elég mélyen ahhoz, hogy egyetlen épületet ki lehessen venni, és saját kulcs nélkül. Minden, amit a TREK rajzol, fölötte marad: a tűk, a nap útvonala, a nyomvonalak és a foglalási útvonalak.',
  'help.guide.map-satellite.step.3':
    'A gombon most a Váltás térkép nézetre áll. Kattints rá, hogy visszatérj a rajzolt térképhez.',
  'help.guide.map-satellite.result': 'A térkép újra rajzolt, és az a réteg, amelyiken hagytad, megmarad a fiókodban.',
  'help.guide.map-satellite.tip.1':
    'A választás a fiókodon marad, nem az utazáson, így minden utazás úgy nyílik meg, ahogy hagytad, bármelyik rajzolómotort használod.',
  'help.guide.map-satellite.tip.2':
    'A felvételek nem hordoznak feliratot: az utcanevek, a városrészek és a házszámok a rajzolt térképen vannak, ezért válts vissza, ha címet keresel.',
  // map-whole-trip
  'help.guide.map-whole-trip.title': 'Nézd meg a teljes utazást és a távolságait',
  'help.guide.map-whole-trip.goal':
    'Cseréld az egy megnyitott napot az utazás összes utazási napjára, és olvasd le, meddig jut mindegyik.',
  'help.guide.map-whole-trip.step.1':
    'A kerek Teljes utazás megjelenítése gomb a térkép jobb alsó sarkában ül. Kattints rá, és az utazás minden utazási napja egyszerre rajzolódik ki, mindegyik a saját színében, fehér burkolat fölött, így a szomszédos napok elkülönülnek.',
  'help.guide.map-whole-trip.step.2':
    'A gomb fölötti kártya felsorolja ezeket a napokat: egy színes pont, a nap neve, egy ikon minden közlekedési módhoz, amivel megteszed, és a távolság, amit lefed. Legfelül a Teljes távolság áll.',
  'help.guide.map-whole-trip.step.3':
    'Kattints egy napra a kártyán a kiválasztásához, ugyanaz, mintha a napok oszlopában választanád: a térkép arra a napra keretez, a megállói pedig visszakapják a számukat.',
  'help.guide.map-whole-trip.step.4':
    'A gombon most a Teljes utazás elrejtése áll. Nyomd meg, hogy visszaess az egyetlen nyitott naphoz.',
  'help.guide.map-whole-trip.result':
    'Minden utazási nap a saját színében van megrajzolva, és a kártya megmondja, mit fed le mindegyik, és mennyit tesz ki az utazás.',
  'help.guide.map-whole-trip.tip.1':
    'A végösszeg néhány szakaszonként érkezik. Amíg egy … áll utána, a szám még részösszeg; akkor áll be, ha már minden szakasz válaszolt.',
  'help.guide.map-whole-trip.tip.2':
    'Az a szakasz, amit az útvonaltervező elutasít, egyenes vonal marad, és semmit sem számít, a kártya pedig ezt megmondja, ahelyett hogy csendben kevesebbet mutatna.',
  'help.guide.map-whole-trip.tip.3':
    'Annak a napnak, amelyiknek kettőnél kevesebb koordinátás megállója van, nincs megrajzolható útvonala, ezért teljesen kimarad a kártyából.',
  // map-booking-routes
  'help.guide.map-booking-routes.title': 'Mutasd meg egy foglalás útvonalát a térképen',
  'help.guide.map-booking-routes.goal':
    'Rajzold ki a térképre a lefoglalt repülőket, vonatokat és autóutakat, és vedd le őket újra.',
  'help.guide.map-booking-routes.step.1':
    'A foglalási útvonalak ki vannak kapcsolva, amíg nem kérsz egyet. A napok oszlopában egy foglalás sorában ül egy kis útvonal ikon: Foglalási útvonalak megjelenítése.',
  'help.guide.map-booking-routes.step.2':
    'Kattints rá, és a foglalás megjelenik a térképen: egy repülőút főkör ívként, egy autóút a valódi utakon, egy vonat az állomásai láncaként. A Megerősítve folytonosan, a Függőben szaggatottan rajzolódik, az útvonal végei pedig kék pirulák a közlekedés ikonjával.',
  'help.guide.map-booking-routes.step.3':
    'Kattints egy végpirulára, és megnyílik a mögötte álló foglalás, az időpontjaival, a Foglalási kóddal és a Helyszín / Cím mezővel, ahol indul. A Bezárás újra elteszi.',
  'help.guide.map-booking-routes.step.4':
    'A napok fölötti eszköztárban lévő útvonal ikon egyszerre az egész utazást csinálja: az Összes foglalási útvonal megjelenítése minden olyan foglalást megrajzol, amelyiknek van útvonala.',
  'help.guide.map-booking-routes.step.5':
    'Ez tiszta lap, nem egy réteg a tetején, így minden elvész, amit foglalásonként kiválasztottál. Nyomd meg újra a gombot, amelyen most az Összes foglalási útvonal elrejtése áll, és a térkép tiszta.',
  'help.guide.map-booking-routes.result':
    'A kért foglalások ki vannak rajzolva a térképen, és a választás ehhez az utazáshoz ebben a böngészőben marad, amíg meg nem változtatod.',
  'help.guide.map-booking-routes.tip.1':
    'A végek csak akkor viselik a repülőtér kódját vagy az állomás nevét, ha a Beállításokban, a Travel & map alatt az Útvonal-címkék a foglalásokhoz be van kapcsolva; egyébként csak az ikont mutatják.',
  'help.guide.map-booking-routes.tip.2':
    'A Mindig jelenjenek meg a foglalási útvonalak, ugyanabban a beállításban, minden olyan utazáson az elejétől megrajzolja őket, amelyikről még nem döntöttél.',
  'help.guide.map-booking-routes.tip.3':
    'Egy foglalásnak két koordinátás végre van szüksége, mielőtt megrajzolható lenne, ezért egy szálloda vagy egy étterem nem visel útvonal ikont.',
  'help.ctx.trip-map.bullet.8':
    'Bekapcsolt Dawarich bővítménnyel a Teljes utazás megjelenítése alatti kerek Dawarich gomb azt az útvonalat rajzolja meg, amit a telefonod valóban rögzített: a Rögzített útvonal megjelenítése szaggatottan a tervezett útvonal alá fekteti, naponta egy színnel, és a gomb felirata megmondja, miért nincs vonal, amikor nincs.',
  // map-dawarich-trail
  'help.guide.map-dawarich-trail.title': 'A valóban megtett útvonal megjelenítése',
  'help.guide.map-dawarich-trail.goal':
    'Fektesd a térképre az útvonalat, amit a Dawarich a telefonodon rögzített, szaggatottan a tervezett mellé, és olvasd az utazást napról napra úgy, ahogy valóban zajlott.',
  'help.guide.map-dawarich-trail.step.1':
    'A kerek Dawarich gomb a térkép jobb alsó sarkában ül, a Teljes utazás megjelenítése alatt; ha fölé viszed az egeret, azt mondja: Rögzített útvonal megjelenítése. Kattints rá. A TREK megkérdezi a Dawarichodat az utazás dátumairól, és egy gyűrű forog a gomb körül, amíg a válasz úton van.',
  'help.guide.map-dawarich-trail.step.2':
    'A rögzített útvonal szaggatott vonalként érkezik, naponta egy színnel, a tervezett útvonal alá rajzolva, hogy a terv olvasható maradjon. A gombon most Rögzített útvonal elrejtése áll. A napok helyi éjfélkor vannak elvágva, és a napok oszlopában összecsukott nap a megállóival együtt a szaggatott vonalát is leveszi a térképről.',
  'help.guide.map-dawarich-trail.step.3':
    'Kattints a Teljes utazás megjelenítése gombra is, és minden tervezett nap folytonosan rajzolódik ki a szaggatott felvétel mellé. Ahol a kettő együtt fut, a nap terv szerint ment; ahol a szaggatott vonal elkalandozik, ott nem.',
  'help.guide.map-dawarich-trail.result':
    'Amit terveztél és amit valóban tettél, együtt van a térképen, szaggatott a folytonos mellett, és a gombok fölötti kártya továbbra is a tervezett napokat és a távolságaikat sorolja.',
  'help.guide.map-dawarich-trail.tip.1':
    'Hogy be vagy ki van kapcsolva, utazásonként megjegyzi erre a böngésző-munkamenetre. Amíg az útvonal be van kapcsolva, a TREK kétpercenként újra kérdezi a Dawarichot, így egy folyamatban lévő utazás újratöltés nélkül utoléri magát; magát az útvonalat soha nem tárolja, tehát nincs a TREK adatbázisában, a biztonsági mentésekben és offline sem.',
  'help.guide.map-dawarich-trail.tip.2':
    'A gomb felirata megmagyarázza az üres térképet: Rögzített útvonal betöltése… amíg úton van, Ezeken a napokon nem készült rögzítés, A rögzített útvonalat nem sikerült betölteni, vagy A rögzített útvonalhoz kapcsolat kell, amikor a TREK offline.',
  // map-compass
  'help.guide.map-compass.title': 'A térkép elforgatása és észak megtalálása',
  'help.guide.map-compass.goal':
    'Forgasd el a térképet, hogy arra nézzen, amerre mész, és pattintsd vissza északra egy kattintással.',
  'help.guide.map-compass.step.1':
    'Forgasd a térképet jobb gombos húzással, vagy tartsd lenyomva a Ctrl-t és húzd bal gombbal; érintőképernyőn csavard két ujjal. A térkép tetején a kategóriaikonok sora melletti kerek iránytű együtt fordul vele: a nyila mindig északra mutat, így annyira dől, amennyit forgattál.',
  'help.guide.map-compass.step.2':
    'Kattints az iránytűre. A Reset north, ahogy a gombot hívják, finoman visszaviszi a térképet északkal felülre és sík nézetbe, és a nyíl újra egyenesen áll.',
  'help.guide.map-compass.result':
    'A térkép újra észak felé és vízszintes, és az utazáson semmi nem változott: az iránytű csak a kamerát mozgatja.',
  'help.guide.map-compass.tip.1':
    'Az iránytű csak a MapLibre GL és a Mapbox GL térképeken létezik; a Leaflet térkép nem forgatható, ezért nincs neki. A Beállítások Térkép része alatti Térkép szolgáltató dönti el, melyiket használod, és a Térkép mentése megőrzi a választást.',
  'help.guide.map-compass.tip.2':
    'A kattintás a döntést is kiveszi: egy jobb gombos húzás fel vagy le megdönti a nézetet, és a Reset north a forgatással együtt ezt is kiegyenesíti. A Mapbox GL-en bekapcsolt 3D épületek és terep mellett ez a 3D nézetet is lelapítja, amíg újra meg nem döntöd.',

  // ── Screen: trip-collab ───────────────────────────────────────────────────────────────
  'help.ctx.trip-collab.title': 'Együttműködés',
  'help.ctx.trip-collab.summary':
    'A fül, ahol a csapat együtt tervez: balra a csevegés, mellette a közös jegyzetek és linkek, alattuk a szavazások, a végén pedig a Mi következik. Minden, amit ide írnak, egyszerre ott áll minden másik tag képernyőjén, újratöltés nélkül.',
  'help.ctx.trip-collab.bullet.1':
    'A csevegés a bal oldali oszlop. Írj az Üzenet írása... mezőbe, és nyomj Entert; a Shift és az Enter új sort csinál. A mosolygó arc emodzsit ad hozzá, a Képek csatolása pedig legfeljebb négy képet akaszt az üzenetre.',
  'help.ctx.trip-collab.bullet.2':
    'Vidd az egeret egy üzenet fölé a Válasz gombért, a sajátodon a Törlés gombért is; kattints rá jobb gombbal a nyolc gyors reakcióért. A törölt üzenet után egyetlen sor marad, amely szerint töröltél egy üzenetet.',
  'help.ctx.trip-collab.bullet.3':
    'A Jegyzetek a közös füzet: az Új jegyzet ír egyet, a mellette lévő fogaskerék pedig a Kategóriák kezelése ablakot nyitja meg a nevükhöz és a színükhöz. Egy kártya Kibontás, Kitűzés, Szerkesztés és Törlés gombot visel.',
  'help.ctx.trip-collab.bullet.4':
    'A Linkek gyűjtik a címeket, amelyeken az utazás fut. A Link hozzáadása egy címet és egy http vagy https webcímet vesz át; a Link szerkesztése, a Link rögzítése és a Link törlése a jelvény végén ül, a rögzített linkek pedig elöl maradnak.',
  'help.ctx.trip-collab.bullet.5':
    'A Szavazások döntenek. Az Új szavazás legalább két opcióval tesz fel egy kérdést; egy opcióra kattintás a te szavazatod, a Lezárás befejezi a szavazást, a Törlés pedig eltünteti a szavazást.',
  'help.ctx.trip-collab.bullet.6':
    'A Mi következik az utazás még előtted álló megállóit sorolja fel, legfeljebb nyolcat közülük, az idejükkel és a rajtuk lévő emberekkel. Csak a napi tervet olvassa; az időpontokat ott állítod be.',
  // write-note
  'help.guide.write-note.title': 'Közös jegyzet írása',
  'help.guide.write-note.goal':
    'Tedd azt, amire az egész csapatnak szüksége van, egy szabályt, egy címet, egy emlékeztetőt, oda, ahol mindenki újra megtalálja.',
  'help.guide.write-note.step.1': 'Kattints a Jegyzetek panel tetején az Új jegyzet gombra. Megnyílik az űrlap.',
  'help.guide.write-note.step.2':
    'A Jegyzet címe az a név, amelyet a kártya visel. Ez az egyetlen, amihez az űrlap ragaszkodik: a Létrehozás szürke marad, amíg nincs benne valami.',
  'help.guide.write-note.step.3':
    'Az alatta lévő nagy mező tartja a szöveget, és elfogadja a Markdownt: egy félkövér szót, egy listát, egy címsort. A kártya az első néhány sort mutatja, a rajta lévő Kibontás pedig az egész jegyzetet megnyitja.',
  'help.guide.write-note.step.4':
    'A Kategória alatt válaszd ki azt, amelyikhez a jegyzet tartozik; a színe lesz a kártya színe. A pirulák a már létező kategóriák, újat pedig a Kategóriák kezelése alatt lehet csinálni.',
  'help.guide.write-note.step.5':
    'A Weboldal egy olyan linket vesz át, amely a jegyzethez tartozik. A kártya ekkor egy Link csempét visel, amely megnyitja.',
  'help.guide.write-note.step.6': 'Kattints a Létrehozás gombra.',
  'help.guide.write-note.result':
    'A jegyzet egy kártya a Jegyzetek panelen, a kategóriája színében, és már ott van minden másik tag képernyőjén.',
  'help.guide.write-note.tip.1':
    'A kártyán lévő Kitűzés a panel tetején tartja; minden alatta aszerint rendeződik, mikor változott utoljára.',
  'help.guide.write-note.tip.2':
    'Az Új jegyzet melletti fogaskerék a Kategóriák kezelése ablakot nyitja meg: ott kap egy kategória színt, nevezed át egyszerre mindenhol, vagy adod hozzá még azelőtt, hogy bármelyik jegyzet használná.',
  'help.guide.write-note.tip.3':
    'A Fájlok csatolása egy dokumentumot akaszt a jegyzetre. A Csatolás megnyitja a fájlválasztót, egy képet vagy egy PDF-et pedig egyszerűen be is illeszthetsz az űrlapba.',
  'help.guide.write-note.tip.4':
    'A Jegyzetek saját kapcsoló a Bővítmények alatt, az Együttműködés részben: egy adminisztrátor kikapcsolhatja, és futni hagyhatja a csevegést, a linkeket, a szavazásokat és a Mi következik panelt.',
  // shared-links
  'help.guide.shared-links.title': 'Az utazás linkjeinek összegyűjtése',
  'help.guide.shared-links.goal':
    'Tartsd a foglalási oldalt, a közös albumot és a menetrendet egy helyen, ahelyett hogy a csevegést görgetnéd értük.',
  'help.guide.shared-links.step.1': 'Kattints a Linkek panel tetején a Link hozzáadása gombra.',
  'help.guide.shared-links.step.2':
    'Adj a linknek nevet a Link címe mezőben, illeszd be a webcímet az alatta lévő mezőbe, majd kattints a Link mentése gombra.',
  'help.guide.shared-links.step.3':
    'A jelvény a nevet és azt az oldalt mutatja, amelyre mutat. Egy kattintás rajta új lapon nyitja meg az oldalt.',
  'help.guide.shared-links.step.4':
    'A végén lévő három kis gomb a Link szerkesztése, a Link rögzítése és a Link törlése. A Link rögzítése a panel elejére viszi a jelvényt; a Link törlése semmit sem kérdez.',
  'help.guide.shared-links.result':
    'A link egy jelvény a Linkek panelen, elöl rögzítve, és egyszerre ott van minden tag képernyőjén.',
  'help.guide.shared-links.tip.1': 'Csak http és https címeket fogad el; a mező mentés előtt minden mást visszautasít.',
  'help.guide.shared-links.tip.2':
    'Először a rögzített linkek jönnek, aztán a legújabbak. A cím melletti kis ikon az oldal saját faviconja, magáról az oldalról lehívva, így internet nélkül a jelvény egy egyszerű linkjelet mutat helyette.',
  'help.guide.shared-links.tip.3':
    'A Linkek saját kapcsoló a Bővítmények alatt, az Együttműködés részben, így egy adminisztrátor kikapcsolhatja a panelt anélkül, hogy a fül többi részéhez hozzányúlna.',
  // create-poll
  'help.guide.create-poll.title': 'A csapat megkérdezése',
  'help.guide.create-poll.goal':
    'Alakítsd át a kérdést, amelyre a csevegésben senki sem válaszol, szavazássá, amelyet mindenki be tud jelölni.',
  'help.guide.create-poll.step.1': 'Kattints a Szavazások panel tetején az Új szavazás gombra.',
  'help.guide.create-poll.step.2':
    'Írd meg a kérdést. A mező alatti Markdown támogatott azt jelenti, hogy egy félkövér szó, egy sortörés vagy egy rövid lista működik itt.',
  'help.guide.create-poll.step.3':
    'Töltsd ki az Opció 1 és az Opció 2 mezőt. Két opció, amelyben van valami, a minimum.',
  'help.guide.create-poll.step.4':
    'Az Opció hozzáadása hoz egy harmadikat, egy negyediket, annyit, amennyire szükséged van; a sor melletti kis kereszt egyet újra elvesz.',
  'help.guide.create-poll.step.5':
    'A Többszörös választás engedi, hogy mindenki egynél több opciót jelöljön be. Kikapcsolva hagyva a szavazat átvándorol, amikor valaki mást választ.',
  'help.guide.create-poll.step.6': 'Kattints a Szavazás létrehozása gombra.',
  'help.guide.create-poll.result': 'A szavazás a Szavazások panel tetején áll, nyitva, és még senki sem szavazott.',
  'help.guide.create-poll.tip.1': 'A kérdés Markdownként jelenik meg; az opciók sima szöveg maradnak.',
  'help.guide.create-poll.tip.2':
    'A Szavazás létrehozása szürke marad, amíg nincs kérdés és legalább két opció, amelyben van valami.',
  'help.guide.create-poll.tip.3':
    'Határidőt csak a telefonos alkalmazásban lehet beállítani. Az a szavazás, amelynek van, itt egy borostyánszínű jelvényben mutatja a hátralévő időt, és lezártnak számít, amint az idő lejár.',
  'help.guide.create-poll.tip.4':
    'A Szavazások saját kapcsoló a Bővítmények alatt, az Együttműködés részben: egy adminisztrátor kikapcsolhatja, és futni hagyhatja a másik négy panelt.',
  // vote-poll
  'help.guide.vote-poll.title': 'Szavazás és az eredmény olvasása',
  'help.guide.vote-poll.goal': 'Add le a szavazatodat, nézd meg, hol áll a csapat, és gondold meg magad.',
  'help.guide.vote-poll.step.1':
    'Kattints arra az opcióra, amelyiket szeretnéd. A köre kitöltődik, a mögötte lévő sáv pedig megnő.',
  'help.guide.vote-poll.step.2':
    'Most az egész eredmény olvasható: a sáv az arány, a százalék jobbra áll, a kis körök pedig azok az emberek, akik azt az opciót választották.',
  'help.guide.vote-poll.step.3':
    'Meggondoltad magad? Kattints egy másik opcióra. Többszörös választás nélküli szavazásban a szavazatod átvándorol, ahelyett hogy egy másodikat adna hozzá.',
  'help.guide.vote-poll.step.4':
    'A kérdés alatt áll, hány szavazata van a szavazásnak. Ha arra az opcióra kattintasz, amelyet már választottál, visszaveszed a szavazatodat, és a számláló újra csökken.',
  'help.guide.vote-poll.result':
    'A jelölésed egy opción áll, a sávok mutatják, hogyan oszlik meg a csapat, a körök pedig megmondják, ki mit választott.',
  'help.guide.vote-poll.tip.1':
    'A sávok és a százalékok csak akkor jelennek meg, ha már magad is szavaztál, vagy ha a szavazás le van zárva, így az állás senkit sem terel.',
  'help.guide.vote-poll.tip.2':
    'Egy szavazat soha nem névtelen: vidd az egeret egy opció körei közül az egyik fölé a mögötte álló névért.',
  // close-poll
  'help.guide.close-poll.title': 'Szavazás lezárása vagy eltávolítása',
  'help.guide.close-poll.goal':
    'Állítsd le a szavazást, amint a csapat döntött, és takarítsd el azt a szavazást, amelyre már senkinek sincs szüksége.',
  'help.guide.close-poll.step.1':
    'A Lezárás, a lakat a szavazás sarkában, befejezi a szavazást. Az opciók nem fogadnak több kattintást.',
  'help.guide.close-poll.step.2':
    'A lezárt szavazás a panel alján a Lezárva fejléc alá süllyed, Lezárva jelvényt visel, és mindenkinek mutatja az eredményt, akár szavazott, akár nem. A győztes opció zöldre színeződik.',
  'help.guide.close-poll.step.3':
    'A Törlés, a kuka ugyanabban a sarokban, eltünteti a szavazást. Semmi sem kérdez kétszer, és a szavazatok is vele mennek.',
  'help.guide.close-poll.result':
    'A szavazás eltűnt minden tag paneljéről. Amelyiket csak lezártad, az az eredményével együtt olvasható marad alul.',
  'help.guide.close-poll.tip.1':
    'A lezárást nem lehet visszavonni: nincs újranyitás. A véletlenül lezárt szavazást újra fel kell tenni.',
  'help.guide.close-poll.tip.2':
    'A Törlés mindenkitől elveszi a szavazást és minden rá adott szavazatot, azonnal és kérdés nélkül.',
  // whats-next
  'help.guide.whats-next.title': 'A Mi következik olvasása',
  'help.guide.whats-next.goal': 'Nézd meg, mit csinál a csapat ezután, anélkül hogy megnyitnád a tervet.',
  'help.guide.whats-next.step.1':
    'A panel az utazás még előtted álló megállóit sorolja fel, legfeljebb nyolcat közülük, idő szerint, naponkénti fejléc alatt: Ma, Holnap vagy a dátum.',
  'help.guide.whats-next.step.2':
    'Egy sor bal oldalán az ideje áll: a kezdés, az -ig, és a vége, ha a megállónak van, vagy TBD, ha még nincs rajta beállítva idő.',
  'help.guide.whats-next.step.3':
    'A név alatti jelvények az azon a megállón lévő emberek. Ha senkit sem választottak ki rá, az utazás minden tagja fel van sorolva.',
  'help.guide.whats-next.result':
    'Annak a listája, ami jön, csak olvasásra: a tervet követi, és semmi sem változtatja meg itt.',
  'help.guide.whats-next.tip.1':
    'Itt semmit sem állítasz be. Az időpontok a napi tervből jönnek; változtasd meg őket ott, és ez a lista azonnal követi.',
  'help.guide.whats-next.tip.2':
    'Csak az van felsorolva, ami még előtted áll: az a megálló, amelynek az ideje elmúlt, kiesik, az utazás végén pedig a panel üres.',
  'help.guide.whats-next.tip.3':
    'A Mi következik saját kapcsoló a Bővítmények alatt, az Együttműködés részben, és asztali panel: a telefonos alkalmazás Együttműködés füle nem kínálja.',
  // trip-chat
  'help.guide.trip-chat.title': 'Beszélgetés a csapattal',
  'help.guide.trip-chat.goal':
    'Mondj valamit, válaszolj egy bizonyos üzenetre, reagálj egy másikra, és vedd vissza a sajátodat.',
  'help.guide.trip-chat.step.1':
    'Írj az Üzenet írása... mezőbe, és nyomj Entert. A mező melletti kék nyíl ugyanezt teszi; a Shift és az Enter ehelyett új sort csinál.',
  'help.guide.trip-chat.step.2':
    'A mosolygó arc megnyitja az emodzsiválasztót, benne a Smileys, a Reactions és a Travel lappal. Amit kiválasztasz, hozzáadódik ahhoz, amit írsz, magától nem küldődik el.',
  'help.guide.trip-chat.step.3':
    'Vidd az egeret valaki más üzenete fölé: a sarkában megjelenik egy kis kerek gomb. Az a Válasz.',
  'help.guide.trip-chat.step.4':
    'Az az üzenet, amelyre válaszolsz, idézetként áll a mező fölött. Írj és küldd el, és az idézet együtt utazik a buborékodban; az idézeten lévő kereszt újra elengedi.',
  'help.guide.trip-chat.step.5':
    'Kattints jobb gombbal egy üzenetre a nyolc gyors reakcióért. A tiéd a buborék alatt ül, és ha másodszor is ugyanarra kattintasz, visszaveszed.',
  'help.guide.trip-chat.step.6':
    'A saját üzeneteid a Válasz mellett Törlés gombot is viselnek. Elveszi az üzenetet, és egyetlen sort hagy, amely szerint töröltél egy üzenetet: nincs visszaút.',
  'help.guide.trip-chat.result':
    'A válaszod az alatt az üzenet alatt ül, amelyet idéz, egy reakció egy harmadikon lóg, és az, amelyet visszavettél, egyetlen sort hagy, amely ezt mondja.',
  'help.guide.trip-chat.tip.1':
    'Az Enter küld, a Shift és az Enter új sort csinál. Az az üzenet, amely semmi más, csak emodzsi, nagyban jelenik meg.',
  'help.guide.trip-chat.tip.2':
    'A Képek csatolása egy üzenethez legfeljebb négy képet vesz át; ezeket egyszerűen be is illesztheted, vagy rá is ejtheted a mezőre.',
  'help.guide.trip-chat.tip.3':
    'Az olyan üzenet, amelyben link van, előnézeti kártyát kap alá, amelyet a saját TREK-ed tölt le, így az olyan dologra mutató link, amelyet csak te érsz el, sima link marad.',
  'help.guide.trip-chat.tip.4':
    'A Chat saját kapcsoló a Bővítmények alatt, az Együttműködés részben: egy adminisztrátor kikapcsolhatja, és futni hagyhatja a jegyzeteket, a linkeket, a szavazásokat és a Mi következik panelt.',

  // ── Screen: trip-lists ────────────────────────────────────────────────────────────────
  'help.ctx.trip-lists.title': 'Listák',
  'help.ctx.trip-lists.summary':
    'Két lista egy utazáshoz: a csomagolási lista azzal, hogy ki mit hoz és mennyit nyom, és a teendőlista mindennel, aminek az utazás előtt és alatt meg kell történnie. A fül addig van ott, amíg a Listák bővítmény be van kapcsolva.',
  'help.ctx.trip-lists.bullet.1':
    'A Csomagolási lista és a Teendők felül a kettő között vált, és megszámolja, mi van mindegyikben; a jobb oldali gombok ahhoz tartoznak, amelyik nyitva van.',
  'help.ctx.trip-lists.bullet.2':
    'A csomagolási lista listákba van csoportosítva, Dokumentumok, Ruházat, ahogy éppen elnevezed őket, mindegyik egy színes ponttal, egy becsomagolva az összesből jelvénnyel és három ponttal, ami alatt az Átnevezés, az Összes kipipálása, az Összes jelölés törlése és a Lista törlése ül. A fenti sávban lévő Lista hozzáadása újat készít.',
  'help.ctx.trip-lists.bullet.3':
    'Egy sor egy jelölőnégyzet és egy név, aztán kis jelvényekként az, hogy ki hozza, a mennyiség és a súly grammban, meg egy táskakör, amíg a Poggyászkövetés be van kapcsolva, aztán a kuka és három pont, ami alatt az Áthelyezés listába, a Megosztás, az Átnevezés és a Törlés ül. Amit egy sor nem használ, halvány marad, amíg rá nem mutatsz, a bal oldali fogantyú pedig fel vagy le húzza a saját listáján belül.',
  'help.ctx.trip-lists.bullet.4':
    'A Megosztott és a Saját lista kettéosztja a csomagolási listát: a mindenki által látott közösre és a sajátodra. Az Összes, a Nyitott és a Kész szűkíti azt, amelyik nyitva van, a fenti sáv pedig számolja, mi van becsomagolva.',
  'help.ctx.trip-lists.bullet.5':
    'A Sablon alkalmazása és a Mentés sablonként gépelés nélkül tölti fel vagy őrzi meg a listát, a mellettük lévő két ikon pedig exportálja a listát, nyomtatásként, PDF-ként vagy fájlként, illetve importál egyet. A haladási sáv melletti piros gomb megmondja, hány tétel van kipipálva, és eltakarítja őket.',
  'help.ctx.trip-lists.bullet.6':
    'A Teendőknek saját oldalsávja van: a haladási kártya, a Mind, a Saját feladataim, a Lejárt és a Kész szűrők, listánként egy sor, alattuk pedig a Lista hozzáadása. A feladatok egy kártyán ülnek, amelynek fejléce megnevezi a szűrőt és a rendezést is hordozza, Prioritás vagy Határidő. Egy feladatra kattintva a jobb oldali panelen nyílik meg, az Új feladat pedig a képernyő közepén nyitja meg az Új feladat űrlapot.',
  // packing-categories
  'help.guide.packing-categories.title': 'Csomagolási lista felépítése',
  'help.guide.packing-categories.goal':
    'Csoportosítsd listákba, amit viszel, töltsd fel őket tételekkel, és mondd meg, ki gondoskodik melyik listáról.',
  'help.guide.packing-categories.step.1':
    'Kattints a listák feletti sávban a Lista hozzáadása gombra, írd be a nevet a Lista neve (pl. Ruházat) mezőbe, és kattints a Hozzáadás gombra.',
  'help.guide.packing-categories.step.2':
    'Az új lista egy üres sorral indul. Kattints a Tétel hozzáadása gombra, írd be a tételt a Tétel neve... mezőbe, és nyomj Entert; a mező nyitva marad a következőnek.',
  'help.guide.packing-categories.step.3':
    'Egy sort a nevére kattintva nevezel át, vagy a jobb szélén lévő három pont alatti Átnevezés paranccsal.',
  'help.guide.packing-categories.step.4':
    'A lista fejlécében lévő szaggatott kör utazási tagokat rendel a listához. Válassz egy nevet; a megjelenő címke egy kattintásra újra leveszi azt a személyt.',
  'help.guide.packing-categories.step.5':
    'A fejléc végén lévő három pont tartja a többit: Átnevezés, Összes kipipálása, Összes jelölés törlése és Lista törlése, ami a listát és mindent, ami benne van, újabb kérdés nélkül elvisz.',
  'help.guide.packing-categories.result':
    'Az új lista a rácsban ül, a tételeivel alatta és a színes pontjával, a jelvénye pedig számolja, mi van már becsomagolva.',
  'help.guide.packing-categories.tip.1':
    'Egy lista csak a tételeiből áll. Töröld az utolsót, és a sor helykitöltővé válik, hogy a lista megtartsa a helyét és a színét; töröld azt a sort is, és a lista eltűnik.',
  'help.guide.packing-categories.tip.2':
    'Ha valakit hozzárendelsz egy listához, csomagolási értesítést kap. Nem változtat azon, ki látja a tételeket, azt a sor három pontja alatti Megosztás intézi.',
  'help.guide.packing-categories.tip.3':
    'Két lista viselheti ugyanazt a nevet. A TREK belül elkülöníti őket, így a nevek úgy maradnak, ahogy beírtad.',
  // check-off-packing
  'help.guide.check-off-packing.title': 'Kipipálás csomagolás közben',
  'help.guide.check-off-packing.goal':
    'Jelöld, mi van a táskában, figyeld a sávot, és takarítsd el a becsomagolt tételeket.',
  'help.guide.check-off-packing.step.1':
    'Kattints a sor bal oldalán lévő négyzetre. A név áthúzódik, a sáv pedig elmozdul.',
  'help.guide.check-off-packing.step.2': 'A fenti sáv a becsomagoltat a lista egészéhez méri, számként és százalékban.',
  'help.guide.check-off-packing.step.3':
    'Egy egész lista egyszerre: a fejlécében lévő három pont tartja az Összes kipipálása és az Összes jelölés törlése pontot.',
  'help.guide.check-off-packing.step.4':
    'Az Összes, a Nyitott és a Kész szűkíti a rácsot. A Nyitott csak azt hagyja meg, ami még hiányzik, így egy teljesen becsomagolt lista kiesik belőle.',
  'help.guide.check-off-packing.step.5':
    'A haladási sáv melletti 3 kipipált eltávolítása egyetlen böngészős megerősítés után minden kipipált tételt egyszerre töröl.',
  'help.guide.check-off-packing.result':
    'Csak az szerepel, ami még nyitott, a fenti sáv pedig megmondja, hol tart a csomagolás.',
  'help.guide.check-off-packing.tip.1': 'Kipipált tétel is átnevezhető: kattints a nevére.',
  'help.guide.check-off-packing.tip.2':
    'Az Összes kipipálása és az Összes jelölés törlése egyszerre egy listán dolgozik, az adott lista saját három pontjából.',
  'help.guide.check-off-packing.tip.3':
    'Amikor minden tétel ki van pipálva, a számláló helyére a Minden be van csomagolva! kerül, és a sáv zöldre vált.',
  // apply-packing-template
  'help.guide.apply-packing-template.title': 'Csomagolási sablon alkalmazása',
  'help.guide.apply-packing-template.goal':
    'Hozz be egy kész listát az utazásba, és őrizd meg ennek az utazásnak a listáját a következőre.',
  'help.guide.apply-packing-template.step.1': 'Kattints a lista fölötti sávban a Sablon alkalmazása gombra.',
  'help.guide.apply-packing-template.step.2':
    'Válassz sablont. Minden sor megnevezi, és megmondja, hány tételt tartalmaz.',
  'help.guide.apply-packing-template.step.3':
    'A tételek abban a nézetben landolnak, amelyikben vagy: a Megosztott a mindenki által látott közösbe teszi őket, a Saját lista a tieddé teszi őket.',
  'help.guide.apply-packing-template.step.4':
    'Őrizd meg ennek az utazásnak a listáját a következő utazásra: a Mentés sablonként megnyit egy párbeszédablakot, írj be egy nevet, és kattints a Mentés gombra.',
  'help.guide.apply-packing-template.result':
    'A sablon listái és tételei az utazásban vannak, amellett, ami már ott volt.',
  'help.guide.apply-packing-template.tip.1':
    'Egy sablon csak neveket és listákat visz. A mennyiségek, a súlyok, a táskák és az, ami már ki van pipálva, itt maradnak.',
  'help.guide.apply-packing-template.tip.2':
    'A Sablon alkalmazása csak akkor van ott, ha létezik sablon. Enélkül a gomb meg sem jelenik.',
  'help.guide.apply-packing-template.tip.3':
    'A Mentés sablonként csak példányadminisztrátornak jelenik meg, és csak addig, amíg a listában van tétel. A megosztott közöset menti a saját tételeiddel együtt, egy másik tag privát tételeit soha.',
  // import-packing-list
  'help.guide.import-packing-list.title': 'Egy egész csomagolási lista beillesztése',
  'help.guide.import-packing-list.goal':
    'Alakítsd át egy mozdulattal csomagolási tételekké azt a listát, ami máshol már megvan.',
  'help.guide.import-packing-list.step.1':
    'Kattints a lista fölötti sávban a lefelé mutató nyíllal jelölt importálás gombra.',
  'help.guide.import-packing-list.step.2':
    'Soronként egy tétel: Kategória, Név, Súly g-ban (opcionális), Táska (opcionális), checked/unchecked (opcionális). A mezőben lévő szürke minta mind a négy alakot mutatja. Markdown-lista is használható: a címsor adja a lista nevét, a "- [ ]" és "- [x]" sorokból pedig tételek lesznek.',
  'help.guide.import-packing-list.step.3':
    'Vagy töltsd be a sorokat fájlból a CSV/TXT/MD betöltése gombbal. Egy .csv, egy .txt vagy egy .md fájlt fogad, és lecseréli, ami a mezőben van.',
  'help.guide.import-packing-list.step.4':
    'Kattints az Importálás gombra. A gomb megszámolja a sorokat, amelyeket megértett.',
  'help.guide.import-packing-list.result':
    'Minden sorból egy tétel lesz, abban a listában, amit az első mezője megnevez, és semmihez nem nyúl, ami már ott volt.',
  'help.guide.import-packing-list.tip.1':
    'A mezőket vessző, pontosvessző és tabulátor is elválasztja, az idézőjelek pedig egyben tartanak egy mezőt, így az „Ing, kék” egyetlen név marad. Az egyetlen értékből álló sor csak egy név, a saját lista nélküli sor az Egyéb listába kerül, a név előtti "3x" pedig a mennyiséget adja meg.',
  'help.guide.import-packing-list.tip.2':
    'A negyedik mezőben megnevezett táska létrejön, ha az utazásnak még nincs meg. Ez az egyetlen hely, ami tömegesen tölt be súlyokat és táskákat; egy sablon csak neveket és listákat hoz.',
  // export-packing-list
  'help.guide.export-packing-list.title': 'A csomagolási lista nyomtatása vagy exportálása',
  'help.guide.export-packing-list.goal':
    'Vidd magaddal a listát papíron, PDF-ként vagy fájlként egy másik alkalmazásba vagy a következő utazásra.',
  'help.guide.export-packing-list.step.1':
    'Kattints a lista fölötti sávban a felfelé mutató nyíllal jelölt exportálás gombra.',
  'help.guide.export-packing-list.step.2':
    'A Markdown ellenőrzőlista (.md) és a CSV importáláshoz (.csv) azonnal fájlba menti a listát.',
  'help.guide.export-packing-list.step.3':
    'Kattints a Nyomtatás vagy mentés PDF-ként elemre. Az előnézet oldalként mutatja a listát: felül az utazás és a dátumai, alatta minden lista kártyaként, egy kipipálható négyzettel.',
  'help.guide.export-packing-list.step.4':
    'Kattints az előnézet alatt a Nyomtatás vagy mentés PDF-ként gombra. A böngésző megnyitja a nyomtatási párbeszédablakát: válassz nyomtatót, vagy a Mentés PDF-ként lehetőséget, ha fájlt szeretnél megtartani.',
  'help.guide.export-packing-list.result':
    'A nyomat és a fájlok a nyitott nézetet tartalmazzák, a Megosztott vagy a Saját lista nézetet, a mennyiségekkel, súlyokkal és pipákkal együtt.',
  'help.guide.export-packing-list.tip.1':
    'A CSV az a formátum, amit az Importálás beolvas, a táskákkal együtt, így saját csomagolási sablonként is működik: importáld a következő utazásba.',
  'help.guide.export-packing-list.tip.2':
    'A Markdown-fájl ellenőrzőlistaként nyílik meg az Obsidianban, a Notionban vagy a GitHubon, és az Importálással ugyanúgy visszahozható.',
  // share-packing-item
  'help.guide.share-packing-item.title': 'Döntsd el, ki látja a tételt és ki hozza',
  'help.guide.share-packing-item.goal':
    'Mozgasd a tételt a csoportos közös, a saját listád és azok között, akiknek hozod.',
  'help.guide.share-packing-item.step.1':
    'A listák fölötti Megosztott a mindenki által látott közös, a Saját lista a tiéd, és mindkettő megszámolja, mi van benne. Kattints a Saját lista fülre, hogy a sajátodat nézd.',
  'help.guide.share-packing-item.step.2':
    'Vissza a Megosztott nézetben nyisd meg egy sor végén a három pontot, és kattints a Megosztás elemre.',
  'help.guide.share-packing-item.step.3':
    'Három szint: Megosztott, a csoportban és mindenki láthatja; Személyes, amit csak te látsz; és Megosztás vele…, ahol kiválasztod, kikre vonatkozik a tétel.',
  'help.guide.share-packing-item.step.4':
    'Egy Személyes tétel csak a Saját lista nézetben van. Válts át, hogy megtaláld.',
  'help.guide.share-packing-item.step.5':
    'Nyisd meg újra a Megosztás elemet, és pipálj ki egy nevet a Megosztás vele… alatt. A tétel annak a személynek a listáján is megjelenik, a sor pedig kap egy kis jelvényt, ami megszámolja, hány emberrel van megosztva.',
  'help.guide.share-packing-item.result': 'A tétel az általad választott szinten ül, a sor pedig megmondja, ki hozza.',
  'help.guide.share-packing-item.tip.1':
    'Egy tétel megosztását csak az változtatja, aki hozza. Akivel megosztottad, a saját Saját lista nézetében látja, a te neveddel megjelölve, és ki tudja pipálni.',
  'help.guide.share-packing-item.tip.2':
    'Egy tételnél, amit más hoz, helyette két másik gombot kapsz: Én is tudom hozni, ami melléje ír téged, és Másolás a listámra, ami saját privát másolatot készít.',
  'help.guide.share-packing-item.tip.3':
    'Az új tételek azt a nézetet öröklik, amelyikben felveszed őket. A Saját lista nézetben felvettek Személyes tételek, a Megosztott nézetben felvettek a közösbe kerülnek.',
  // packing-bags
  'help.guide.packing-bags.title': 'A táskák megmérése',
  'help.guide.packing-bags.goal':
    'Adj minden tételnek súlyt, oszd szét a tételeket táskákba, és tartsd minden táskát a légitársaság korlátja alatt.',
  'help.guide.packing-bags.step.1': 'Kattints a kör előtti súlyjelvényre, és írd be a tétel súlyát grammban.',
  'help.guide.packing-bags.step.2': 'A sor végén lévő kör a táskája. Kattints rá.',
  'help.guide.packing-bags.step.3':
    'Még nincs táska: Táska hozzáadása, egy név, Enter. A táska létrejön, és a tétel egyenesen bele kerül.',
  'help.guide.packing-bags.step.4':
    'A Táskák panel jobb oldalt jelenik meg, amint egy táska létezik: név, súly, egy telítettségsáv, ki viszi és hány tétel van benne, aztán a Nincs hozzárendelve és az Összsúly.',
  'help.guide.packing-bags.step.5':
    'Kattints a Korlát beállítása gombra, és írd be a korlátot kilogrammban, ahogy a légitársaságok megadják.',
  'help.guide.packing-bags.step.6': 'A táska neve melletti szaggatott plusz megmondja, ki viszi.',
  'help.guide.packing-bags.result':
    'A jobb oldali Táskák panel minden táska súlyát a korlátjához mérve mutatja, azt, ami egyik táskában sincs, és az összeget.',
  'help.guide.packing-bags.tip.1':
    'A súlymező, a táskakör és a Táskák panel csak addig létezik, amíg egy adminisztrátor a Listák bővítmény alatt bekapcsolva tartja a Poggyászkövetést.',
  'help.guide.packing-bags.tip.2':
    'Egy táska súlyát a szerver minden tag tételein át adja össze, azokon is, amelyeket nem látsz, így a szám tényleg az, amennyit a táska nyom.',
  'help.guide.packing-bags.tip.3':
    'A korlát nélküli táska a legnehezebb táskához mérve rajzolódik ki, hogy a sávok összehasonlíthatók maradjanak. Adj neki korlátot, és a sáv ahhoz mérve olvasható.',
  // create-todo
  'help.guide.create-todo.title': 'Feladat hozzáadása',
  'help.guide.create-todo.goal':
    'Írj le valamit, aminek meg kell történnie, listával, prioritással, dátummal és névvel.',
  'help.guide.create-todo.step.1': 'Kattints jobbra fent az Új feladat gombra.',
  'help.guide.create-todo.step.2':
    'Nevezd el a Feladat neve mezőben, és tedd a Leírás alá mindazt, amit érdemes megjegyezni.',
  'help.guide.create-todo.step.3':
    'A Lista csoportosítja a feladatot. Válassz egyet, vagy a mellette lévő plusszal nevezz el egy újat egy kis párbeszédablakban.',
  'help.guide.create-todo.step.4': 'A Prioritás négy gomb: Nincs, P1, P2 és P3, a pirostól a kékig.',
  'help.guide.create-todo.step.5': 'A Határidő naptárat nyit, a Hozzárendelve pedig nevet tesz a feladatra.',
  'help.guide.create-todo.step.6': 'Kattints a Feladat létrehozása gombra.',
  'help.guide.create-todo.result':
    'A feladat benne van a listában a jelvényeivel, a prioritásával, a határidejével, a listájával és azzal a személlyel, akihez hozzá van rendelve, és a jobb oldali panelen nyílik meg.',
  'help.guide.create-todo.tip.1': 'Csak a név kötelező. Minden mást később is ki lehet tölteni a jobb oldali panelen.',
  'help.guide.create-todo.tip.2': 'Ha az oldalsávban ki van választva egy lista, az új feladat abban a listában indul.',
  'help.guide.create-todo.tip.3':
    'A név mezőben az Enter azonnal létrehozza a feladatot, a többi mező érintése nélkül.',
  // todo-filters
  'help.guide.todo-filters.title': 'Feladat megtalálása és módosítása',
  'help.guide.todo-filters.goal':
    'Szűkítsd a feladatlistát arra, ami most számít, aztán szerkeszd a feladatot, amire ráakadtál.',
  'help.guide.todo-filters.step.1':
    'Az oldalsávban a Feladatok: a Mind minden, ami még nyitott, a Saját feladataim az, ami rád vár, a Lejárt az, aminek múltbeli dátuma van, a Kész az, ami befejeződött. Mindegyik viszi a saját darabszámát; kattints a Lejárt pontra.',
  'help.guide.todo-filters.step.2':
    'A Listák alatt listánként egy sor ül. Ha kiválasztasz egyet, azt a listát mutatja, a befejezett feladatokkal együtt.',
  'help.guide.todo-filters.step.3':
    'A lista fejlécében lévő rendezés átrendezi, ami a képernyőn van: a Prioritás a P1 elemeket teszi előre, a Határidő a legközelebbi határidőt. Egyszerre csak a kettő egyike, és egy második kattintás visszaáll a saját sorrendedre.',
  'help.guide.todo-filters.step.4': 'Kattints egy feladatra, hogy a jobb oldali panelen nyíljon meg.',
  'help.guide.todo-filters.step.5':
    'Változtasd meg, amit kell, Leírás, Prioritás, Lista, Határidő vagy Hozzárendelve, aztán Módosítások mentése. A panel fejlécében lévő jelölőnégyzet kipipálja a feladatot, a Törlés pedig azonnal elviszi.',
  'help.guide.todo-filters.result':
    'A lista csak azokat a feladatokat mutatja, amiket kértél, a jobb oldali panel pedig azt szerkeszti, amit kiválasztottál.',
  'help.guide.todo-filters.tip.1':
    'Egy listasor csak azt számolja, ami még nyitott, de ha kiválasztod, a befejezett feladatokat is mutatja. A Mind, a Saját feladataim és a Lejárt elrejti, ami kész; a Kész mást nem mutat.',
  'help.guide.todo-filters.tip.2':
    'A rendezésben a Prioritás és a Határidő kizárja egymást, és amíg bármelyik be van kapcsolva, a sorokat már nem lehet saját sorrendbe húzni.',

  // ── Screen: trip-bookings ─────────────────────────────────────────────────────────────
  'help.ctx.trip-bookings.title': 'Foglalások',
  'help.ctx.trip-bookings.summary':
    'A fül, ami mindent tart, amit az utazásra lefoglaltál és nem közlekedési mód: a szállásokat, az asztalokat, a jegyeket, a túrákat, a parkolást. Minden foglalás egy kártya a Függőben vagy a Megerősítve szakaszban, és viszi a kódját, a dokumentumát, az utasait és a költségét.',
  'help.ctx.trip-bookings.bullet.1':
    'A jobbra fent lévő Kézi foglalás megnyitja az űrlapot. A hatféle, amit készít, a Szálloda, az Étterem, az Esemény, a Túra, a Parkolás és az Egyéb; a repülők, a vonatok és a többi a Közlekedés fülön laknak, és itt soha nem jelennek meg.',
  'help.ctx.trip-bookings.bullet.2':
    'Az Importálás fájlból egy visszaigazolást ad át a feldolgozónak: EML, PDF, PKPass, HTML vagy TXT, legfeljebb öt fájl, egyenként 10 MB. A gomb csak akkor van ott, ha a szerver el tudja olvasni őket.',
  'help.ctx.trip-bookings.bullet.3':
    'A cím melletti címkék típus szerint szűrnek, mindegyik a saját számával, az Összes pedig mindent visszahoz. Amint egy foglalás megnevez embereket, a címkék melletti avatársor egyetlenegyükre szűkíti a fület.',
  'help.ctx.trip-bookings.bullet.4':
    'A kártyák két szakaszban állnak, Függőben és Megerősítve, mindegyik a saját számával. Egy szakaszcímre kattintva összecsukod, és hogy nyitva van-e, azt a TREK megjegyzi erre az utazásra.',
  'help.ctx.trip-bookings.bullet.5':
    'Egy kártya viszi az állapotpontot, a típust, a címet, a dátumokat és időpontokat, a Foglalási kódot, a Helyszín / Cím mezőt, azt, amihez a foglalás kapcsolódik, a Hivatkozását, a Jegyzeteit, a Fájljait és az Utasait.',
  'help.ctx.trip-bookings.bullet.6':
    'A kártyán lévő ceruza újra ugyanazt az űrlapot nyitja meg; a kuka egyszer kérdez, és utána a foglalás nincs többé. Szállásnál vele mennek a napi tervben lévő éjszakái és a hozzá kapcsolt költsége is.',
  // create-booking
  'help.guide.create-booking.title': 'Foglalás létrehozása',
  'help.guide.create-booking.goal':
    'Tegyél be kézzel egy éttermet, egy eseményt, egy túrát, egy parkolóhelyet vagy bármi mást az utazásba.',
  'help.guide.create-booking.step.1':
    'Kattints a fül jobb felső sarkában a Kézi foglalás gombra. Megnyílik az Új foglalás.',
  'help.guide.create-booking.step.2':
    'Válaszd ki a Foglalás típusa értéket az űrlap tetején lévő listából, az Utasok mellett. A Szálloda, az Étterem, az Esemény, a Túra, a Parkolás és az Egyéb az a hat, amit ez a fül készít, és az űrlap a választással együtt változik: csak a Szálloda cseréli a dátumait egy napokból álló tartományra.',
  'help.guide.create-booking.step.3':
    'Írd be a Cím mezőt. Ez az egyetlen mező, amihez az űrlap ragaszkodik, és a Hozzáadás halott marad, amíg nincs benne valami.',
  'help.guide.create-booking.step.4':
    'Állítsd be a Dátum és a Kezdési idő mezőt, és a Befejezés dátuma meg a Befejezési idő mezőt is, ha a foglalásnak van vége. A naptárak csak az utazáson belüli napokat kínálják, és egy olyan vég, ami nincs a kezdés után, ezt pirossal megmondja, és letiltja a Hozzáadás gombot.',
  'help.guide.create-booking.step.5':
    'Vidd be a visszaigazolásból a Foglalási kódot, és állítsd be az Állapot mezőt. A Függőben vagy a Megerősítve dönti el, a két szakasz közül melyikbe kerül a kártya.',
  'help.guide.create-booking.step.6': 'Kattints a Hozzáadás gombra.',
  'help.guide.create-booking.result':
    'A foglalás egy kártya a saját szakaszában, a típuscímkéjével, a dátumaival és a kódjával, és az utazásban mindenki más látja megjelenni.',
  'help.guide.create-booking.tip.1':
    'A Helyszín / Cím írás közben valódi címeket kínál; ha kiválasztasz egyet, az felülírja, amit írtál, a magad által beírt cím pedig úgy marad, ahogy van.',
  'help.guide.create-booking.tip.2':
    'A Hivatkozás a foglalás saját oldalára visz a szolgáltatónál. A kártya linket csinál belőle, ami új lapon nyílik meg.',
  'help.guide.create-booking.tip.3':
    'A Jegyzetek Markdown, így egy lista vagy egy félkövér sor a kártyán is listaként vagy félkövér sorként jelenik meg.',
  // booking-hotel
  'help.guide.booking-hotel.title': 'Szállás lefoglalása',
  'help.guide.booking-hotel.goal':
    'Vigyél be egy szállást úgy, hogy egyszerre számítson foglalásnak és a napi tervben éjszakáknak.',
  'help.guide.booking-hotel.step.1':
    'Kattints a Kézi foglalás gombra, és válaszd a Szálloda típust. A dátummezők eltűnnek, és a helyüket egy szállodai mezőkből álló blokk veszi át.',
  'help.guide.booking-hotel.step.2':
    'Válaszd ki a szállodát a Szálloda alatt. A lista az utazás saját helyei, és ha kiválasztasz egyet, a neve a Cím mezőbe, a címe pedig a Helyszín / Cím mezőbe kerül.',
  'help.guide.booking-hotel.step.3':
    'Állítsd be az Ettől és az Eddig mezőt: az első éjszakát és azt a reggelt, amikor elutazol. Mindkettő az utazás napjait kínálja a dátumaikkal, és a kettő rendben tartja egymást.',
  'help.guide.booking-hotel.step.4':
    'Töltsd ki a Bejelentkezés, a Bejelentkezés eddig és a Kijelentkezés mezőt, meg a visszaigazolásból a Foglalási kódot.',
  'help.guide.booking-hotel.step.5': 'Kattints a Hozzáadás gombra.',
  'help.guide.booking-hotel.result':
    'A kártya dátum helyett napok tartományát viszi, a be- és kijelentkezés idejével meg a címmel, és ugyanaz a tartózkodás most már ott ül a terv azon napjain.',
  'help.guide.booking-hotel.tip.1':
    'A Szálloda az egyetlen típus Dátum és Kezdési idő nélkül. A dátumai az Ettől és az Eddig, és ezek az utazás napjai, nem naptár.',
  'help.guide.booking-hotel.tip.2':
    'Hagyd üresen a Szálloda mezőt, és írd be helyette a címet: a helyet megkeresi, létrehozza és kitűzi neked a térképre.',
  'help.guide.booking-hotel.tip.3': 'A foglalás törlése magával viszi az éjszakákat is a napi tervből.',
  // link-booking
  'help.guide.link-booking.title': 'Foglalás kötése a tervhez',
  'help.guide.link-booking.goal':
    'Akaszd a foglalást arra a megállóra és helyre, ahová tartozik, hogy ott bukkanjon fel, ahol kelleni fog.',
  'help.guide.link-booking.step.1':
    'Kattints a ceruzára azon a kártyán, amelyiket össze akarod kapcsolni. Megnyílik a Foglalás szerkesztése.',
  'help.guide.link-booking.step.2':
    'Nyisd meg az Összekapcsolás napi tervvel mezőt. A lista a te terved: naponként egy cím, majd az adott nap megállói, számozva és az időpontjaikkal. Válaszd ki azt, amelyikhez a foglalás tartozik.',
  'help.guide.link-booking.step.3':
    'A Hely / Tevékenység magát a helyet kapcsolja össze. Válaszd ki ott, és a Cím meg a Helyszín / Cím kitöltődik mindenhol, ahol üresen hagytad őket.',
  'help.guide.link-booking.step.4': 'Kattints a Frissítés gombra.',
  'help.guide.link-booking.result':
    'A kártya megnevezi a napot és a megállót az Összekapcsolás napi tervvel alatt, és a foglalás a napi tervben együtt utazik azzal a megállóval.',
  'help.guide.link-booking.tip.1':
    'A lista tetején lévő Nincs összekapcsolás (önálló) újra leveszi a kapcsolatot. A Szállodának egyáltalán nincs megállóválasztója: az éjszakáin keresztül kapcsolódik.',
  'help.guide.link-booking.tip.2':
    'Ha dátumozott napon választasz megállót, az kitölti neked az üres Dátum mezőt. Egy dátumot, amit már beállítottál, békén hagy.',
  // booking-travelers
  'help.guide.booking-travelers.title': 'A foglalás utasainak megadása',
  'help.guide.booking-travelers.goal':
    'Jelöld meg az utasokat, akikre a foglalás vonatkozik, és utána csak az övéiket nézd.',
  'help.guide.booking-travelers.step.1':
    'Nyisd meg a foglalást a ceruzával. Az Utasok az űrlap tetején áll, a Foglalás típusa mellett, és amíg senki sincs a foglaláson, az Utasok hozzárendelése felirat látszik rajta.',
  'help.guide.booking-travelers.step.2':
    'Kattints rá, és válaszd ki azokat, akiknek ez a foglalás szól; a megnevezett vendégek is ott vannak a listában. A kiválasztott pipát kap, és az avatarja megjelenik a mezőben. Kattints újra a névre, és leveszed.',
  'help.guide.booking-travelers.step.3': 'Kattints a Frissítés gombra.',
  'help.guide.booking-travelers.step.4':
    'Fent az eszköztárban, a típuscímkék mellett kattints egy utas avatarjára, és csak az ő foglalásait látod.',
  'help.guide.booking-travelers.result':
    'A kártya felsorolja azokat, akiknek szól, az avatársor pedig egyetlenegyükre szűkíti a fület.',
  'help.guide.booking-travelers.tip.1':
    'A kártyán az utasokat csak mutatja, soha nem változtatod meg őket. Itt, az űrlapon állítod be őket.',
  'help.guide.booking-travelers.tip.2':
    'Az avatársor akkor jelenik meg, ha az utazásnak egynél több tagja van, és legalább egy foglalás megnevez valakit. Amit kiválasztasz, kitart erre a böngészőmenetre.',
  // booking-files
  'help.guide.booking-files.title': 'A voucher megtartása a foglalásnál',
  'help.guide.booking-files.goal':
    'Csatold a visszaigazolást, a jegyet vagy a belépőt ahhoz a foglaláshoz, amelyikhez tartozik.',
  'help.guide.booking-files.step.1':
    'Nyisd meg a foglalást a ceruzával, menj le a Fájlok részhez, és kattints a Fájl csatolása gombra. Egy már létező foglalásnál a dokumentum azonnal felmegy, és a TREK azt mondja, Fájl feltöltve.',
  'help.guide.booking-files.step.2':
    'A dokumentum a nevével szerepel a listán, egy gombbal, ami megnyitja, és egy X-szel mellette.',
  'help.guide.booking-files.step.3':
    'A Meglévő fájl csatolása az utazás azon dokumentumait kínálja, amelyek még nincsenek ezen a foglaláson. Válassz egyet, és úgy csatolódik, hogy semmit nem kell újra feltölteni.',
  'help.guide.booking-files.step.4': 'Kattints a Frissítés gombra.',
  'help.guide.booking-files.result':
    'A kártya felsorolja a dokumentumokat a Fájlok alatt, és ha rákattintasz az egyikre, megnyílik.',
  'help.guide.booking-files.tip.1':
    'Olyan foglalásnál, amit még csak most hozol létre, a dokumentum vár, és abban a pillanatban megy fel, amikor a Hozzáadás gombra kattintasz.',
  'help.guide.booking-files.tip.2':
    'A dokumentum melletti X a kapcsolatot veszi el, nem a dokumentumot. Az ott marad az utazás Fájlok fülén.',
  'help.guide.booking-files.tip.3':
    'Hogy milyen fájltípusokat lehet csatolni, az az adminisztrátor listája; a dokumentumok, a szöveg és a képek alapból engedélyezettek.',
  // booking-cost
  'help.guide.booking-cost.title': 'A foglalás árának költséggé alakítása',
  'help.guide.booking-cost.goal':
    'Vidd be azt, amibe egy foglalás kerül, a Költségek közé, elosztva a fizető emberek között.',
  'help.guide.booking-cost.step.1':
    'Nyisd meg a foglalást, és menj az űrlap aljára. A Költségek alatt áll a Költség létrehozása és a Meglévő költség csatolása, a következő megjegyzéssel: Menti a foglalást, majd megnyitja a költségszerkesztőt.',
  'help.guide.booking-cost.step.2':
    'Kattints a Költség létrehozása gombra. A foglalás elmentődik, az űrlapja bezárul, és megnyílik a költségszerkesztő.',
  'help.guide.booking-cost.step.3':
    'A Mire volt? már a foglalás címe. Vidd be a Teljes összeg mezőt, és ellenőrizd a Pénznem meg a Nap értékét.',
  'help.guide.booking-cost.step.4':
    'A Kategória az, amit a foglalás típusa sugall. Állítsd be a Ki fizetett? mezőt és azt, hogyan oszlik meg az összeg.',
  'help.guide.booking-cost.step.5': 'Kattints a Költség hozzáadása gombra.',
  'help.guide.booking-cost.result':
    'A foglalás űrlapján a költség most a Kapcsolt költségek alatt áll az összegével, és ugyanaz a költség ott áll a Költségek fülön, ehhez a foglaláshoz kötve.',
  'help.guide.booking-cost.tip.1':
    'A kategória a típust követi: az Étteremből Étel és ital lesz, a Szállodából Szállás, a Parkolásból Parkolás, az Esemény és a Túra pedig mindkettő az Egyéb kategóriába esik.',
  'help.guide.booking-cost.tip.2':
    'Egy foglaláshoz több költség is tartozhat. A Meglévő költség csatolása azokat kínálja a Költségekből, amelyek még sehova sem tartoznak. Egy kapcsolt költségnél a Leválasztás, a költség megmarad leválasztja, és a Költségekben hagyja, a kuka viszont törli.',
  'help.guide.booking-cost.tip.3':
    'A Költségek blokk csak addig van az űrlapon, amíg a Költségek bővítmény be van kapcsolva, amit az adminisztrátor a Bővítmények alatt kapcsolgat.',
  // filter-bookings
  'help.guide.filter-bookings.title': 'Foglalás megtalálása',
  'help.guide.filter-bookings.goal':
    'Szűkítsd le a hosszú fület arra a típusra, személyre vagy állapotra, amit keresel.',
  'help.guide.filter-bookings.step.1':
    'A cím melletti címkék azok a típusok, amiket ez az utazás tényleg használ, mindegyik a hozzá tartozó darabszámmal. Az Összes a teljes fül.',
  'help.guide.filter-bookings.step.2':
    'Kattints egy címkére, és csak az a típus marad. Kattints egy másodikra, és mindkettő megmarad.',
  'help.guide.filter-bookings.step.3': 'Az Összes mindent visszatesz.',
  'help.guide.filter-bookings.step.4':
    'A címkék melletti avatarok utas szerint szűrnek, egy személyre vagy többre egyszerre.',
  'help.guide.filter-bookings.step.5':
    'A Függőben és a Megerősítve a két szakasz, mindkettő a saját számával. Kattints egy címre, hogy összecsukd az egyiket; összecsukva marad, amikor visszajössz.',
  'help.guide.filter-bookings.result':
    'A fül csak azt mutatja, amit kiválasztottál, és még mindig az van kiválasztva, amikor ebben a böngészőmenetben visszatérsz rá.',
  'help.guide.filter-bookings.tip.1':
    'A címkék csak azokat a típusokat kínálják, amik az utazásnak vannak, így egy egyetlen túra nélküli utazásnak nincs Túra címkéje.',
  'help.guide.filter-bookings.tip.2':
    'Egy szűrő, ami semmire nem illik, üresen hagyja a fület a Nem találhatók helyek felirattal. A megfogalmazás a helyek listájáé; az értelme ugyanaz.',
  // import-booking-file
  'help.guide.import-booking-file.title': 'Foglalás kiolvasása a visszaigazolásból',
  'help.guide.import-booking-file.goal':
    'Hagyd, hogy a TREK kihúzza a foglalást abból a levélből vagy PDF-ből, amit a szolgáltató küldött, ahelyett hogy újra begépelnéd.',
  'help.guide.import-booking-file.step.1':
    'Kattints az eszköztárban az Importálás fájlból gombra. Megnyílik a Foglalási visszaigazolások importálása.',
  'help.guide.import-booking-file.step.2':
    'Ejtsd a visszaigazolásokat a mezőre, vagy kattints rá, és válaszd ki őket: EML, PDF, PKPass, HTML és TXT, legfeljebb öt fájl, egyenként 10 MB. Amiket kiválasztottál, azok neve ott áll a mezőn.',
  'help.guide.import-booking-file.step.3':
    'Kattints az Importálás gombra. A párbeszédablak azonnal bezárul, mert az olvasás a háttérben történik.',
  'help.guide.import-booking-file.step.4':
    'Jobbra lent egy kártya számol be a futásról a fájl neve alatt, és követ téged az alkalmazáson át, egy újratöltésen át is. A Fájlok feldolgozása… pipává válik, amikor az olvasás kész, és a kártya felkínálja az Importálás lehetőséget. Kattints rá.',
  'help.guide.import-booking-file.result':
    'A foglalás egy kártya a Függőben alatt az éjszakáival, a kódjával és a visszaigazolással a Fájlok alatt, a szállás a terv azon napjain ül, és bekapcsolt Költségek mellett az ár egy hozzá kötött költség.',
  'help.guide.import-booking-file.tip.1':
    'Az Importálás fájlból csak akkor van ott, ha a szerver el tud olvasni visszaigazolásokat, ehhez pedig vagy a kiolvasó, vagy az MI-elemzés bővítmény kell. Ez utóbbit az adminisztrátor a Bővítmények alatt kapcsolgatja.',
  'help.guide.import-booking-file.tip.2':
    'Ha semmit nem sikerült kiolvasni, a kártya ezt megmondja, és felkínálja a Try AI parsing lehetőséget, ami ugyanazokat a fájlokat egyenesen a modellnek küldi. Egy kész feldolgozás tíz percig marad meg; ezen az időn belül indítsd el az átnézést.',
  'help.guide.import-booking-file.tip.3':
    'A visszaigazolás csak akkor kerül csatolásra, ha a típusa szerepel az adminbeállítások Engedélyezett fájltípusok listáján. A PDF alapból ott van; egy levelet, EML-t, előbb hozzá kell adni, különben a foglalás nélküle kerül mentésre.',
  // edit-booking
  'help.guide.edit-booking.title': 'Foglalás módosítása',
  'help.guide.edit-booking.goal':
    'Javíts egy időpontot, írd be a később érkezett kódot, vagy told át a foglalást a Függőben szakaszból a Megerősítve szakaszba.',
  'help.guide.edit-booking.step.1':
    'Kattints a kártya fejlécében a ceruzára. Megnyílik a Foglalás szerkesztése mindennel, amit a foglalás tud.',
  'help.guide.edit-booking.step.2':
    'Változtasd meg, amit meg kell változtatni, itt a Foglalási kódot, amit a szolgáltató végre elküldött.',
  'help.guide.edit-booking.step.3': 'Tedd az Állapot mezőt Megerősítve értékre.',
  'help.guide.edit-booking.step.4': 'Kattints a Frissítés gombra.',
  'help.guide.edit-booking.result':
    'A kártya átköltözik: egy megerősített foglalás a Megerősítve szakaszban áll egy zöld pont mögött, és az utazásban mindenki látja átköltözni.',
  'help.guide.edit-booking.tip.1':
    'Egy Foglalási kód, amit nem tudsz elolvasni, a Beállítások Megjelenés lapján lévő Foglalási kódok elrejtése. Vidd rá az egeret, vagy kattints rá, és olvashatóvá válik.',
  'help.guide.edit-booking.tip.2':
    'Változtasd meg a típust, és a kapcsolt költség kategóriája követi, hacsak nem választottál kézzel kategóriát a költségszerkesztőben.',
  'help.guide.edit-booking.tip.3':
    'Egy szállást is itt szerkesztesz: az Ettől és Eddig napjai ugyanezen az űrlapon vannak.',
  // delete-booking
  'help.guide.delete-booking.title': 'Foglalás törlése',
  'help.guide.delete-booking.goal': 'Vedd ki az utazásból azt a foglalást, ami meghiúsult.',
  'help.guide.delete-booking.step.1': 'Kattints a kártya fejlécében a kukára.',
  'help.guide.delete-booking.step.2':
    'A Foglalás törlése? megnevezi azt, amelyiket kiválasztottad, és azt mondja, hogy véglegesen törlődik.',
  'help.guide.delete-booking.step.3': 'Kattints a Megerősítés gombra.',
  'help.guide.delete-booking.result':
    'A kártya eltűnt, mindenki számára az utazásban. Egy foglalásnál nincs visszavonás, így az a kérdés az utolsó állomás.',
  'help.guide.delete-booking.tip.1':
    'Egy szállásfoglalás törlése az éjszakáit is kiveszi a napi tervből, és eltávolítja a hozzá kapcsolt költséget.',
  'help.guide.delete-booking.tip.2':
    'A csatolt dokumentumok az utazás Fájlok fülén maradnak; csak a foglaláshoz fűződő kapcsolatuk szűnik meg.',
  // import-booking-file
  'help.guide.import-booking-file.step.5':
    'Minden megtalált foglalás az Új foglalás űrlapon nyílik meg, egymás után, már kitöltve. Egy szállodánál ez a név a Címben és, ha az utazásban megvan a hely, a Szálloda alatt, a Helyszín / Cím, az Ettől és az Eddig az éjszakáira, a Bejelentkezés és a Kijelentkezés, a Foglalási kód, a visszaigazolás a Fájlok alatt, és bekapcsolt Költségek mellett az ár Kapcsolt költség gyanánt. Ellenőrizd, és kattints a Hozzáadás gombra.',

  // ── Screen: trip-costs ────────────────────────────────────────────────────────────────
  'help.ctx.trip-costs.title': 'Költségek',
  'help.ctx.trip-costs.summary':
    'Az utazás pénze: minden kiadás dátumozott főkönyvként, ki tette le az asztalra és ki tartozik érte, abban a pénznemben, amiben a nyugta volt, a jobb oldali oszlopban pedig az, kinek kinek kell fizetnie, hogy megint egyenlő legyen.',
  'help.ctx.trip-costs.bullet.1':
    'Négy kártya felül: a Tartozol és a Neked tartoznak a te saját oldalad az elszámolásban, a Rendezetlen összeg az, ami rögzítve van, de még nincs fizetője, a Teljes utazási költség pedig mindent összead, alatta A te részed és a Te fizettél.',
  'help.ctx.trip-costs.bullet.2':
    'A jobb felső Költség hozzáadása megnyitja a szerkesztőt; a mellette lévő Elszámolás egyszerre rögzíti az összes nyitott átutalást.',
  'help.ctx.trip-costs.bullet.3':
    'A főkönyv napok szerint van csoportosítva, a legújabb elöl, az adott nap végösszegével jobbra. Egy sor a kategóriát színes fülként, a nevet, a fizetők zsetonjait, a megjegyzést és az összeget viszi, plusz a kölcsönadtál vagy kölcsönkértél jelzést, ha a felosztás pluszban vagy mínuszban hagy rajta.',
  'help.ctx.trip-costs.bullet.4':
    'A lista fölött ül a Költségek keresése…, egy kategóriaszűrő, egy napszűrő, a Mind / Én fizettem / Nekem tartoznak kapcsoló és a CSV exportálás gomb.',
  'help.ctx.trip-costs.bullet.5':
    'A jobb oldali oszlop a válasz: az Elszámolás kilistázza, ki kinek fizet, az Egyenlegek megmutatják minden utazó többletét vagy hiányát, a Végső költségvetés azt, mennyibe kerül az utazás mindegyikőjüknek, a Kategóriánként pedig azt, hová ment a pénz.',
  'help.ctx.trip-costs.bullet.6':
    'Egy rögzített fizetés ugyanabban a főkönyvben ül saját sorként, mellette a Szerkesztés és a Visszavonás; egy kiadásnak ceruzája és kukája van, és a kuka kérdés nélkül törli.',
  // add-expense
  'help.guide.add-expense.title': 'Adj hozzá egy kiadást',
  'help.guide.add-expense.goal': 'Rögzítsd, mennyibe került valami, ki fizette, és kivel osztozik rajta.',
  'help.guide.add-expense.step.1':
    'Kattints a Költségek fül jobb felső sarkában a Költség hozzáadása gombra. Megnyílik a szerkesztő, a mai dátummal, mindenkivel már a felosztásban.',
  'help.guide.add-expense.step.2':
    'Írd be, mire volt, a Mire volt? mezőbe, az egyetlenbe, amit ki kell tölteni, a nyugtán szereplő számot pedig a Teljes összeg mezőbe.',
  'help.guide.add-expense.step.3':
    'A Pénznem és a Nap az összeg alatt ül. A Pénznem az utazás sajátjáról indul; változtasd meg, és a szerkesztő megmutatja, mennyit ér az összeg az utazás pénznemében. A Nap a maival indul, és a főkönyv ez alá csoportosítja a kiadást.',
  'help.guide.add-expense.step.4':
    'Válassz egy Kategória értéket. Tizennégy van belőlük, és nem lehet őket megváltoztatni: amelyiket választod, az lesz a színes fül a soron és a sáv a Kategóriánként kártyán.',
  'help.guide.add-expense.step.5':
    'A Ki fizetett? alatt válaszd ki azt, aki valóban letette a pénzt. A Te van előre kiválasztva; a Még senki sem fizetett úgy rögzíti az összeget, hogy senki nem tartozik érte, a Többen fizettek pedig több fizető között osztja szét a számlát.',
  'help.guide.add-expense.step.6':
    'A Split az Equally beállításról indul, mindenkivel bent, és minden névnél látszik a rá jutó rész. A mentéshez kattints a Költség hozzáadása gombra.',
  'help.guide.add-expense.result':
    'A kiadás ott van a főkönyvben a napja alatt, beleszámolva a Teljes utazási költség értékébe, az elszámolási oszlop pedig újraszámolta, ki kinek tartozik.',
  'help.guide.add-expense.tip.1':
    'Úgy hagyva, ahogy megnyílik, a kiadás az utazás pénznemében van, mai dátummal, mindenki között egyenlően felosztva: igazából csak a nevet és az összeget kell kitölteni.',
  'help.guide.add-expense.tip.2':
    'Az összeg melletti ± visszatérítéssé alakítja a kiadást. A negatív végösszeg pénzt ad vissza ahelyett, hogy elvenné, és a felosztás is fordítva fut.',
  'help.guide.add-expense.tip.3':
    'Az alul lévő Nyugta / számla csatolása képeket és PDF-eket fogad. Mentéskor töltődnek fel, az utazás Fájlok részébe kerülnek, és a listában a név mellett megjelenik egy Nyugták jelölés.',
  // expense-payers
  'help.guide.expense-payers.title': 'Mondd meg, ki fizette a számlát',
  'help.guide.expense-payers.goal':
    'Rögzítsd, ki fizetett a saját zsebéből egy kiadásért, ez az elszámolás matematikájának másik fele.',
  'help.guide.expense-payers.step.1':
    'Nyisd meg a kiadást a sora melletti ceruzával, és nézd meg a Ki fizetett? mezőt. Az Egy személy fizetett az alapértelmezés: a legördülő megnevezi azt az egy embert, aki letette a pénzt.',
  'help.guide.expense-payers.step.2':
    'A Még senki sem fizetett, annak a legördülőnek az első eleme, úgy rögzíti az összeget, hogy senki nem tartozik semmivel. A kiadás továbbra is beleszámít a Teljes utazási költség értékébe.',
  'help.guide.expense-payers.step.3':
    'A Többen fizettek, a címke melletti hivatkozás, utazónként egy sort nyit. Add hozzá azokat, akik fizettek, és írd be, ki mennyit tett bele; az összegeknek ki kell adniuk a teljes összeget.',
  'help.guide.expense-payers.step.4':
    'Az a kiadás, amit senki nem fizetett, Befejezetlen jelölést kap a sorában, és beleszámít a Rendezetlen összeg kártyába, ahol a rögzített, de el nem számolt költés gyűlik.',
  'help.guide.expense-payers.result':
    'Az, hogy ki fizetett, eldönti, kinek fizetnek vissza, a felosztás eldönti, ki fizet, az Egyenlegek pedig a kettő különbsége.',
  'help.guide.expense-payers.tip.1':
    'A Ki fizetett? és a Split függetlenek: kifizethetsz egy vacsorát, amin ott sem voltál, és belekerülhetsz olyan vacsora felosztásába, amit nem te fizettél.',
  'help.guide.expense-payers.tip.2':
    'Több fizető esetén az összegeknek ki kell adniuk a teljes összeget. Adj hozzá még egyet, és a többi átrendeződik körülötte; amíg nem egyeznek, a szerkesztő megmondja, mennyit kell kiadniuk, és nem hajlandó menteni.',
  'help.guide.expense-payers.tip.3':
    'Egy fizető eltávolítása nem távolítja el a kiadást: az összeg bent marad a Teljes utazási költség értékében, a sor pedig Befejezetlen lesz.',
  // split-expense
  'help.guide.split-expense.title': 'Ossz meg egy számlát az utazók között',
  'help.guide.split-expense.goal':
    'Döntsd el, ki tartozik egy kiadásért: mindenki egyenlően, összeg szerint, vagy soronként a nyugtáról.',
  'help.guide.split-expense.step.1':
    'A kiadásszerkesztőben a Split minden utazót felsorol. Kattints egy névre, hogy kihagyd ebből a kiadásból; a kihagyott utazónál Kihagyva áll, és semmivel nem tartozik érte.',
  'help.guide.split-expense.step.2':
    'Az Equally az alapértelmezés: minden bevont utazó ugyanakkora részt kap, a lista alatti sor pedig megmondja, hány felé oszlik, és mennyi jut egy részre.',
  'help.guide.split-expense.step.3':
    'A Custom a részeket összegmezőkre cseréli. Írd be, ki mennyivel tartozik; az alatta lévő sor folyamatosan számol, és zöldre vált, amikor A felosztás megegyezik a végösszeggel. Amíg nem stimmel, nem ment.',
  'help.guide.split-expense.step.4':
    'A Ticket soronként osztja fel a nyugtát: Tétel hozzáadása, aztán soronként egy név és egy ár, a Megosztva: alatt pedig azok az utazók, akik azon a soron osztoznak.',
  'help.guide.split-expense.step.5':
    'A sorok alatti Egyéni részek megmutatja, ki mennyivel tartozik a végén, a felül lévő Teljes összeg pedig a sorokból adódik össze. Kattints a Mentés gombra.',
  'help.guide.split-expense.result':
    'A felosztás az, amiből minden egyenleg felépül. A kiadással együtt mentődik, és később úgy módosítható, hogy semmi máshoz nem kell nyúlni.',
  'help.guide.split-expense.tip.1':
    'Annál az utazónál, akit kihagysz, Kihagyva áll, és ezzel az egy kiadással nem tartozik semmivel; a többiek viszik a részét.',
  'help.guide.split-expense.tip.2':
    'Az Equally centre pontos: a maradék cent kiadásról kiadásra forog, így nincs olyan, aki mindig ő fizeti.',
  'help.guide.split-expense.tip.3':
    'A Ticket mód magától összegzi a Teljes összeg mezőt, és kiszürkíti: a nyugta sorai adják a végösszeget.',
  // expense-currency
  'help.guide.expense-currency.title': 'Vigyél be kiadást másik pénznemben',
  'help.guide.expense-currency.goal': 'Azt vidd be, ami a nyugtán tényleg áll, az árfolyamot pedig tartsa a TREK.',
  'help.guide.expense-currency.step.1':
    'Kattints a Költség hozzáadása gombra, és töltsd ki a nevet és az összeget pontosan úgy, ahogy a nyugtán áll, magát a számot, nem az átváltását.',
  'help.guide.expense-currency.step.2':
    'Nyisd meg a Pénznem mezőt, és válaszd ki a nyugta pénznemét. A lista minden kódot visz, amit a TREK ismer, és kereshető: írd be a három betűt.',
  'help.guide.expense-currency.step.3':
    'A mezők alatt megjelenik egy sor azzal, mennyit ér az összeg éppen most, élő árfolyam jelöléssel. Ez előnézet, nem az, ami tárolódik.',
  'help.guide.expense-currency.step.4':
    'Kattints a Költség hozzáadása gombra. Az árfolyam azon nyomban befagy: innentől ez a kiadás annyit ér, amennyit azon a napon ért, amikor bevitted.',
  'help.guide.expense-currency.step.5':
    'A főkönyvben a sor mindkét számot viszi a név alatt: amit beírtál, egy nyilat, és azt, amennyinek az utazás pénznemében számít. Minden fenti végösszeg, egyenleg és elszámolás a másodikat használja.',
  'help.guide.expense-currency.result':
    'A kiadás megtartja az összeget és a pénznemet, amit beírtál. A főkönyv mindkettőt mutatja, az utazás végösszegei és egyenlegei pedig az utazás pénznemében maradnak.',
  'help.guide.expense-currency.tip.1':
    'Az árfolyam a mentés pillanatában fagy be, így egy elszámolt tartozás nem nyílik ki újra attól, hogy a piac egy héttel később elmozdult. Új árfolyamot csak a kiadás pénznemének megváltoztatása fagyaszt be.',
  'help.guide.expense-currency.tip.2':
    'A Beállítások alatti Megjelenítési pénznem csak azt változtatja meg, amit olvasol; a tárolt összegek soha nem mozdulnak. Üresen hagyva minden utazás a saját pénznemében jelenik meg.',
  'help.guide.expense-currency.tip.3':
    'Maga az utazás pénzneme az utazáson él, az Utazás szerkesztése alatt, és az Utazás részleteinek szerkesztése jogot kívánja. A megváltoztatása minden befagyott árfolyamot újrarögzít, nem pedig átszámolja az összegeket másik pénznemre.',
  // filter-costs
  'help.guide.filter-costs.title': 'Találj meg egy kiadást vagy egy nap költését',
  'help.guide.filter-costs.goal': 'Szűkítsd le a hosszú főkönyvet arra, amit valójában keresel.',
  'help.guide.filter-costs.step.1':
    'Írj a lista fölötti Költségek keresése… mezőbe. Gépelés közben a kiadás nevére illeszkedik.',
  'help.guide.filter-costs.step.2':
    'Az Összes kategória megnyitja a tizennégy kategóriát. Válassz egyet, és csak annak a kategóriának a kiadásai maradnak.',
  'help.guide.filter-costs.step.3':
    'Az Összes nap minden olyan napot felsorol, amin költöttek valamit. Válassz egyet, és egy sáv váltja fel a napfejléceket azzal a nappal, azzal, hány kiadást tart, és a végösszegével.',
  'help.guide.filter-costs.step.4':
    'A Mind / Én fizettem / Nekem tartoznak kapcsoló a te saját nézeted a főkönyvre: mire tettél le pénzt, és miért van még mindig kint a pénzed.',
  'help.guide.filter-costs.step.5':
    'A sor végén lévő CSV exportálás minden kiadást fájlba ír, az eredeti összeggel, annak pénznemével és az átváltott összeggel.',
  'help.guide.filter-costs.result':
    'A szűrők összeadódnak, a napcsoportok pedig újrarajzolódnak a saját végösszegeikkel arra, ami megmarad.',
  'help.guide.filter-costs.tip.1':
    'A rögzített fizetések nem visznek nevet és kategóriát, így egy keresés vagy egy kategóriaszűrő elrejti őket. A napszűrő megtartja őket, annak a napnak az alatt, amikor a fizetést rögzítették.',
  'help.guide.filter-costs.tip.2':
    'A CSV exportálás mindig minden kiadást exportál, bármi is van a képernyőn leszűrve, kiadásonként egy sorral.',
  // settle-up
  'help.guide.settle-up.title': 'Számold ki, ki kinek tartozik, és rendezd',
  'help.guide.settle-up.goal':
    'Alakítsd egy csomó közös kiadást a lehető legkevesebb átutalássá, ami mindenkit kiegyenlít, és rögzítsd őket, ahogy megtörténnek.',
  'help.guide.settle-up.step.1':
    'A jobb oldali oszlop Elszámolás kártyája felsorolja azokat az átutalásokat, amelyek mindenkit kiegyenlítenének: ki kinek fizet, és mennyit. A cím melletti szám az, hány van még nyitva.',
  'help.guide.settle-up.step.2':
    'Az átutalás melletti Elszámol megtörténtként rögzíti. A folyam eltűnik a kártyáról, az egyenlegek pedig újrarajzolódnak.',
  'help.guide.settle-up.step.3':
    'A rögzített átutalás egy sor a főkönyvben, annak a napnak az alatt, amikor megtörtént, Fizetés jelöléssel, a két utazóval és az összeggel.',
  'help.guide.settle-up.step.4':
    'A sor mellett a ceruza javítja a fizetést, a Visszavonás pedig visszaveszi, és az átutalás visszakerül az Elszámolás kártyára.',
  'help.guide.settle-up.step.5':
    'A kártya fejlécében lévő Fizetés hozzáadása olyan átutalást rögzít, ami nem egy javaslatot követett. Válassz Kitől és Kinek, az összeget, annak pénznemét és a napot, amikor megtörtént.',
  'help.guide.settle-up.step.6':
    'A képernyő tetején lévő fejlécben az Elszámolás egyszerre rögzíti az összes nyitott átutalást, ahogy egy társaság az utazás végén kvittre jön.',
  'help.guide.settle-up.result':
    'Minden rögzített átutalás egy sor a főkönyvben, és egy sorral kevesebb az Elszámolás kártyán. Amikor a kártyán az áll, hogy Mindenki kvittben van, az utazás ki van fizetve.',
  'help.guide.settle-up.tip.1':
    'A kártya a legkevesebb átutalást mutatja, nem minden tartozást: három ember, aki körbe tartozik egymásnak, egy vagy két fizetésre esik össze.',
  'help.guide.settle-up.tip.2':
    'Az Elszámol rögzít egy átutalást, nem mozgat pénzt. Küldd el úgy, ahogy szoktad, aztán kattints rá.',
  'help.guide.settle-up.tip.3':
    'Egy fizetés bármilyen pénznemben történhet, így egy jenben fennálló tartozást euróban fizetni teljesen normális: a párbeszédablaknak saját pénznemválasztója van, és azt az árfolyamot is befagyasztja.',
  // final-budget
  'help.guide.final-budget.title': 'Nézd meg, mennyibe került az utazás minden utazónak',
  'help.guide.final-budget.goal':
    'Olvasd a főkönyv fejenkénti oldalát: a mai egyenleget és a valódi fejenkénti költséget.',
  'help.guide.final-budget.step.1':
    'Az Egyenlegek minden utazó állását mutatják: zöld sáv jobbra, ha az utazás tartozik neki, piros sáv balra, ha ő tartozik az utazásnak, és az összeg a név mellett.',
  'help.guide.final-budget.step.2':
    'Az alatta lévő Végső költségvetés más kérdésre válaszol: nem arra, ki mivel tartozik éppen most, hanem arra, mennyibe kerül az utazás minden utazónak, ha már mindent visszafizettek.',
  'help.guide.final-budget.step.3':
    'Kattints egy névre, hogy megnyíljon a számítás: Kifizetett kiadások, alatta pedig Nettó visszatérítések és Függőben lévő visszatérítések.',
  'help.guide.final-budget.step.4':
    'Minden sor alatt ott ülnek a sorok, amikből összeáll: a kiadások, amiket az az utazó fizetett, a már rögzített átutalások és a még nyitottak. Pontosan kiadják a fölöttük lévő sort.',
  'help.guide.final-budget.result':
    'Az Egyenlegek azt mutatják, ki van ma pluszban vagy mínuszban; a Végső költségvetés azt, mennyibe kerül a végén az utazás mindegyikőtöknek, ha már mindent visszafizettek.',
  'help.guide.final-budget.tip.1':
    'Egy fizetés rögzítése senkinek nem változtatja meg a végső költségvetését. Csak átmozgat egy összeget a függőben lévő visszatérítésekből a nettó visszatérítésekbe.',
  'help.guide.final-budget.tip.2':
    'A fizető nélküli kiadás mindkét kártyán kívül marad, ugyanúgy, ahogy az elszámolási javaslatokon kívül is marad.',
  // expense-from-booking
  'help.guide.expense-from-booking.title': 'Csinálj foglalásból kiadást',
  'help.guide.expense-from-booking.goal':
    'Kapcsold azt, amennyibe egy repülőjárat, egy szállás vagy egy hely valójában került, ahhoz a bejegyzéshez, amihez tartozik.',
  'help.guide.expense-from-booking.step.1':
    'Nyisd meg a foglalást a Közlekedés vagy a Foglalások fülön, és kattints a ceruzájára.',
  'help.guide.expense-from-booking.step.2':
    'Görgess az űrlap alján lévő Költségek blokkhoz. A Költség létrehozása lehetőséget kínálja, amely előbb menti a foglalást, és a Meglévő költség csatolása lehetőséget egy olyan költséghez, amely már a Költségek fülön van.',
  'help.guide.expense-from-booking.step.3':
    'Kattints a Költség létrehozása gombra. A foglalás mentődik, az űrlap bezárul, és megnyílik a Költségek szerkesztő a foglalás címével névként, a típusa pedig már egy kategóriához igazítva.',
  'help.guide.expense-from-booking.step.4':
    'Töltsd ki az összeget és a pénznemét, azt, ki fizetett, és a felosztást, mint bármelyik kiadásnál, majd ments. A foglalást újra megnyitva a kiadás a Kapcsolt költségek alatt látszik, ceruzával a szerkesztéshez, a Leválasztás, a költség megmarad gombbal a leválasztáshoz és kukával az eltávolításhoz.',
  'help.guide.expense-from-booking.result':
    'A foglalás viszi a költségét, a kiadás pedig egy hétköznapi sor a Költségek fülön, fizetővel, felosztással és pénznemmel, mint bármelyik másik.',
  'help.guide.expense-from-booking.tip.1':
    'A foglalás törlése a hozzákapcsolt kiadásokat is törli vele. A foglalás Költségek blokkjában a Költség eltávolítása az ellenkezőjét teszi: a kiadás eltűnik, a foglalás marad. A Leválasztás, a költség megmarad mindkettőt megtartja.',
  'help.guide.expense-from-booking.tip.2':
    'Egy helynek ugyanez a blokk van az űrlapján, ahol a Költség létrehozása előbb a helyet menti.',

  // ── Screen: trip-transports ───────────────────────────────────────────────────────────
  'help.ctx.trip-transports.title': 'Közlekedés',
  'help.ctx.trip-transports.summary':
    'Minden, ami visz téged a megállók között: repülők, vonatok, buszok, autók, taxik, kerékpárok, hajóutak, kompok és a tömegközlekedési kapcsolatok, amiket a TREK kikeres neked. A fül ezek listája; a tervben is létrejönnek és olvashatók, a térképre pedig felrajzolódnak.',
  'help.ctx.trip-transports.bullet.1':
    'A fül csak a közlekedést tartja. A szállás, az éttermek, az események és a jegyek a Foglalások fülön élnek, így ugyanaz a bejegyzés soha nem jelenik meg kétszer.',
  'help.ctx.trip-transports.bullet.2':
    'Az eszköztár mindet megszámolja az Összes alatt, és minden használatban lévő típusnak saját címkét ad saját számmal: Repülő, Vonat, Autó, Tömegközlekedés. A jobb oldali Közlekedés kézzel ad hozzá egyet.',
  'help.ctx.trip-transports.bullet.3':
    'A kártyák három csoportban jönnek, mindegyik összecsukható a fejlécével: Automatikus tömegközlekedés a keresés által tervezett kapcsolatokhoz, aztán Függőben, aztán Megerősítve.',
  'help.ctx.trip-transports.bullet.4':
    'Egy kártya viszi az állapotot, a típust, a napokat, amikre kiterjed, az időpontokat, a Foglalási kódot, az útvonalat, valamint a Légitársaságot és a Járatszámot vagy a Vonatszámot, a Vágányt és az Ülést. A ceruza megnyitja, a kuka egy kérdés után törli.',
  'help.ctx.trip-transports.bullet.5':
    'A közlekedés a tervben is létrejön: minden nap fejlécében van egy plusz a Közlekedés hozzáadása számára és egy villamosgomb a Tömegközlekedéshez, a két megálló közötti menetidő-összekötő pedig ugyanazt a keresést nyitja meg arra az egy szakaszra.',
  'help.ctx.trip-transports.bullet.6':
    'A mindkét végén beállított közlekedés vonalat rajzol a térképre. A napi tervben lévő sorának útvonal-ikonja bekapcsolja ezt a vonalat, a napok fölötti eszköztárban pedig az Összes foglalási útvonal megjelenítése az egész utazást átbillenti.',
  // transports-list
  'help.guide.transports-list.title': 'Olvasd a Közlekedés fület',
  'help.guide.transports-list.goal': 'Tudd, mit mond a lista, mielőtt bármit megváltoztatsz rajta.',
  'help.guide.transports-list.step.1':
    'A Közlekedés az utazás második füle. Csak a közlekedést tartja: a hotelek, az éttermek, az események és a jegyek a Foglalások fülön vannak.',
  'help.guide.transports-list.step.2':
    'Az eszköztár minden közlekedést megszámol az Összes alatt, és minden használatban lévő típusnak saját címkét ad saját számmal. Kattints egy címkére, hogy csak az a típus maradjon, kattints újra, hogy elengedd. Több címke is bekapcsolva lehet egyszerre, az Összes pedig törli őket.',
  'help.guide.transports-list.step.3':
    'Az Automatikus tömegközlekedés saját csoport, a tömegközlekedési keresés által tervezett kapcsolatok. A Függőben és a Megerősítve mindent tart, amit kézzel vittél be. A fejléc melletti nyíl összecsukja a csoportot.',
  'help.guide.transports-list.step.4':
    'Egy kártya mindent elmond: az állapotpont Függőben vagy Megerősítve felirattal, a típus, a napok, amikre kiterjed, a dátumaikkal, az időpontok, a Foglalási kód, az útvonal, valamint a Légitársaság és a Járatszám vagy a Vonatszám, a Vágány és az Ülés.',
  'help.guide.transports-list.step.5':
    'A ceruza szerkesztésre nyitja a közlekedést, a kuka törli, egy kérdés után, amely megnevezi, mi tűnik el.',
  'help.guide.transports-list.result':
    'A lista arra szűkül, amit kerestél, és minden kártya egy pillantásra megmondja, le van-e foglalva az út.',
  'help.guide.transports-list.tip.1':
    'A címkéket és az összecsukott csoportokat a rendszer utazásonként megjegyzi, így a fül újra úgy nyílik meg, ahogy hagytad.',
  'help.guide.transports-list.tip.2':
    'Az Importálás fájlból és az AirTrail csak akkor csatlakozik a Közlekedés gombhoz az eszköztárban, ha a kiszolgáló el tudja olvasni a foglalási visszaigazolásokat, és ha egy AirTrail-példány csatlakoztatva van. Nélkülük a listát kézzel és a tömegközlekedési kereséssel töltöd fel.',
  // add-transport
  'help.guide.add-transport.title': 'Adj közlekedést egy naphoz',
  'help.guide.add-transport.goal':
    'Tedd az utat, amely az egyik megállótól a következőhöz visz, abba a napba, amikor megtörténik.',
  'help.guide.add-transport.step.1':
    'Minden nap fejléce négy kis gombot visz a jobb oldalán. Kattints a pluszra, amelynek a buboréka Közlekedés hozzáadása. Az űrlap a Dátummal már arra a napra állítva nyílik meg.',
  'help.guide.add-transport.step.2':
    'A Foglalás típusa választja ki, mivel mész: Repülő, Vonat, Busz, Autó, Taxi, Kerékpár, Hajóút, Komp vagy Egyéb. Az űrlap követi. Egy repülő minden szakaszon repteret kap, egy vonat állomásláncot, egy autó a Felvétel és a Visszaadás szavakat és a Megállók útközben mezőt.',
  'help.guide.add-transport.step.3':
    'A Cím az egyetlen mező, amit ki kell tölteni; nélküle a Hozzáadás szürke marad. Írd azt, amit felismernél egy peronkijelzőn.',
  'help.guide.add-transport.step.4':
    'A Honnan és a Hová állomást, kikötőt vagy címet keres. Írj be legalább három betűt, és válassz egy találatot a listából. A csak beírt név nem visz koordinátákat, így semmit nem rajzol a térképre.',
  'help.guide.add-transport.step.5':
    'A Dátum és a Kezdési idő mondja meg, mikor megy, a Befejezés dátuma és a Befejezési idő, mikor ér véget; a másnap landoló út ott a következő napot veszi. A Foglalási kód, az Állapot Függőben vagy Megerősítve értékkel és a Jegyzetek nem kötelezők.',
  'help.guide.add-transport.step.6': 'Kattints a Hozzáadás gombra.',
  'help.guide.add-transport.result':
    'A közlekedés egy sor a napon, a saját idejében a megállók között, és egy kártya a Közlekedés fülön a Függőben vagy a Megerősítve alatt.',
  'help.guide.add-transport.tip.1':
    'A sor oda kerül, ahová a kezdési ideje teszi, az utolsó olyan megálló után, amely korábban kezdődik. A fogantyúja bárhová máshová húzza a napon belül, vagy egy másik napra.',
  'help.guide.add-transport.tip.2':
    'A Fájlok alatti Fájl csatolása veszi a jegyet, a Költségek alatti Költség létrehozása pedig elmenti a foglalást, és megnyitja a Költségek szerkesztőt a viteldíjhoz.',
  'help.guide.add-transport.tip.3':
    'Az Utasok jelöli, ki van rajta ezen az úton. Amint egy közlekedésnek utasai vannak, a fül eszköztára kinöveszti az avatarjaikat, és szűri szerintük a listát.',
  // plan-transit
  'help.guide.plan-transit.title': 'Tervezz tömegközlekedési kapcsolatot',
  'help.guide.plan-transit.goal':
    'Hagyd, hogy a TREK kikeresse a valódi vonatokat és buszokat egy nap két pontja között, és tedd a tervbe azt, amelyiket kiválasztod.',
  'help.guide.plan-transit.step.1':
    'A nap fejlécében kattints a villamosgombra, Tömegközlekedés. A keresés arra a napra nyílik meg.',
  'help.guide.plan-transit.step.2':
    'Az Innen és az Ide megállót vagy állomást fogad. Amíg a mező üres, a nap saját megállóit és az utazás szállásait kínálja; két betű beírása helyette a menetrend állomásai között keres. A két mező közötti Csere megfordítja a kapcsolatot.',
  'help.guide.plan-transit.step.3':
    'Az Indulás vagy az Érkezés egy időponttal mondja meg, mikor szeretnél utazni, a Legjobb útvonal, a Kevesebb átszállás vagy a Kevesebb gyaloglás pedig azt, hogyan legyenek rendezve a válaszok.',
  'help.guide.plan-transit.step.4':
    'Az alatta lévő címkék mondják meg, mely módok használhatók: Vonat, Metró, Villamos, Busz, Komp és Sikló. Kapcsolj ki egyet, hogy kimaradjon, legalább egy bekapcsolva marad. Aztán kattints a Keresés gombra.',
  'help.guide.plan-transit.step.5':
    'Minden találat megadja az indulást és az érkezést, mennyi ideig tart, hány átszállás és mennyi gyaloglás van benne, és a vonalakat a saját színeikkel. Kattints egyre, hogy megállóról megállóra kibontsd, a vágányokkal és a vonalak közötti sétákkal.',
  'help.guide.plan-transit.step.6': 'Kattints a Hozzáadás a naphoz gombra.',
  'help.guide.plan-transit.result':
    'A kapcsolat egy sor a napon a vonalaival, az átszállásaival és a gyaloglási idejével, és egy kártya a Közlekedés fülön az Automatikus tömegközlekedés alatt.',
  'help.guide.plan-transit.tip.1':
    'A kapcsolatok a Transitoustól jönnek, ez egy ingyenes közösségi szolgáltatás nyilvános menetrendi adatok fölött: nincs kulcs, nincs fiók. Egy adminisztrátor a keresést a Google felé is irányíthatja.',
  'help.guide.plan-transit.tip.2':
    'Semmit nem találtál? A források egy régiót és egy időszakot fednek le. Próbálj másik időpontot, kapcsolj be több módot, vagy válassz állomást a hely helyett. Az üzenet megnevezi a választ adó szolgáltatást.',
  'help.guide.plan-transit.tip.3':
    'Ugyanez a keresés egyetlen szakaszra is megnyílik: kattints a két megálló közötti menetidő-összekötőre, és válaszd a Tömegközlekedést. Az Innen, az Ide és az indulási idő ki van töltve neked.',
  // change-transit-route
  'help.guide.change-transit-route.title': 'Nyiss meg és módosíts egy tervezett kapcsolatot',
  'help.guide.change-transit-route.goal':
    'Olvasd a kapcsolatot megállóról megállóra, nevezd át, vagy keresd ki újra az útvonalat.',
  'help.guide.change-transit-route.step.1':
    'A Közlekedés fülön a tervezett kapcsolatok az Automatikus tömegközlekedés alatt ülnek. Kattints a kártyára.',
  'help.guide.change-transit-route.step.2':
    'Az Időtartam, az Átszállások és a Gyaloglás felül ül. Alattuk az Útiterv megállóról megállóra végigjárja a kapcsolatot, a vágányokkal és a vonalak közötti sétákkal.',
  'help.guide.change-transit-route.step.3':
    'Az Útvonal módosítása újra lefuttatja a keresést, már kitöltve ennek a kapcsolatnak a két végével és a napjával.',
  'help.guide.change-transit-route.step.4':
    'Válassz másik kapcsolatot, és kattints a Hozzáadás a naphoz gombra; átveszi a régi helyét. Az Útvonal módosítása melletti Részletek szerkesztése helyette a szokásos közlekedési űrlapot nyitja meg, ahol a Foglalási kód, az Állapot, az utasok és a fájlok élnek.',
  'help.guide.change-transit-route.result':
    'A Tömegközlekedési útvonal nézet az új Útitervet viszi, a kártyája pedig a Közlekedés fülön az új vonalakat és időpontokat mutatja.',
  'help.guide.change-transit-route.tip.1':
    'A Tömegközlekedési útvonal nézet címe csak szöveg: a mellette lévő ceruza átnevezi anélkül, hogy az útvonalhoz nyúlna. Az alatta lévő Jegyzetek markdownt fogad, és van egy Szerkesztés és egy Előnézet füle.',
  'help.guide.change-transit-route.tip.2':
    'A Tömegközlekedési útvonal nézet alján lévő Törlés kiveszi a kapcsolatot az utazásból; a nap megtartja a megállóit.',
  // leg-travel-mode
  'help.guide.leg-travel-mode.title': 'Módosítsd, hogyan teszel meg egy szakaszt',
  'help.guide.leg-travel-mode.goal':
    'Sétálj végig egy nap egyik szakaszán, amit egyébként autóval tennél meg, vagy add át azt a szakaszt a tömegközlekedési keresésnek.',
  'help.guide.leg-travel-mode.step.1':
    'A megállók közötti összekötők csak akkor jelennek meg, ha a nap Útvonal kapcsolója be van kapcsolva. Kattints a napra, hogy megnyisd, aztán a megállói alatti Útvonal gombra.',
  'help.guide.leg-travel-mode.step.2':
    'Minden összekötő megnevezi az adott szakasz menetidejét és távolságát, annak a módnak az ikonjával, amelyikben az útvonalat számolták: autó az autózáshoz, láb a gyalogláshoz.',
  'help.guide.leg-travel-mode.step.3':
    'Kattints az összekötőre. A menü az Autózás és a Gyaloglás, a Tömegközlekedés és a Napi alapértelmezett lehetőséget kínálja.',
  'help.guide.leg-travel-mode.step.4':
    'Válaszd a Gyaloglást. Csak ez a szakasz változik; a nap többi része megtartja a saját módját.',
  'help.guide.leg-travel-mode.result':
    'A szakasz a láb ikont és a gyaloglási idejét mutatja, a nap többi szakasza pedig megtartja a nap módját.',
  'help.guide.leg-travel-mode.tip.1':
    'A mód a szakaszhoz tartozik, nem a naphoz: az egész nap Autózás és Gyaloglás gombjai soha nem írják felül a kézzel beállított szakaszt. A Napi alapértelmezett visszaadja nekik a szakaszt.',
  'help.guide.leg-travel-mode.tip.2':
    'Az ugyanabban a menüben lévő Tömegközlekedés pontosan erre a szakaszra nyitja meg a kapcsolatkeresést, a két véggel és az indulási idővel már kitöltve.',
  'help.guide.leg-travel-mode.tip.3':
    'Az időket egy nyilvános útvonaltervező adja valódi utak és gyalogutak fölött. Az a szakasz, amelyikre nem tud válaszolni, megtartja az egyenes vonalát, és nem mutat időt.',
  // edit-transport
  'help.guide.edit-transport.title': 'Módosíts vagy törölj egy közlekedést',
  'help.guide.edit-transport.goal':
    'Javíts egy időpontot, egy vágányt vagy egy foglalási kódot, vagy vedd ki az utat az utazásból.',
  'help.guide.edit-transport.step.1': 'A napi tervben egy közlekedés színes sor a megállók között. Kattints rá.',
  'help.guide.edit-transport.step.2':
    'Az űrlap ugyanaz, amelyik létrehozta, a címsorában a Közlekedés szerkesztése felirattal. Minden módosítható: a típus, az útvonal, a napok és időpontok, a Foglalási kód, az Állapot.',
  'help.guide.edit-transport.step.3':
    'Egy repülő útvonala repterek lánca, egy vonaté állomások lánca. A Megálló hozzáadása közéjük tesz még egyet, és minden szakasz megtartja a saját időpontjait és a saját járatszámát vagy vonatszámát.',
  'help.guide.edit-transport.step.4':
    'Kattints a Frissítés gombra. Ha teljesen el akarod távolítani a közlekedést, használd a kukát a Közlekedés fülön lévő kártyáján, és erősítsd meg.',
  'help.guide.edit-transport.result':
    'A változás mindenhol látszik, ahol a közlekedés megjelenik: a Közlekedés fülön, a napon, amelyiken megy, és a vonalán a térképen.',
  'help.guide.edit-transport.tip.1':
    'Ugyanez az űrlap mindkét oldalról megnyílik, a Közlekedés fülön lévő kártya ceruzájáról és a közlekedés saját soráról a napi tervben. A tervezett tömegközlekedési kapcsolat a kivétel: a sora a Tömegközlekedési útvonal nézetet nyitja meg, és az ottani Részletek szerkesztése vezet ehhez az űrlaphoz.',
  'help.guide.edit-transport.tip.2':
    'Egy közlekedés másik napra mozgatásához egyáltalán nem kell az űrlap: húzd a sorát az egyik napkártyáról a másikra.',
  // transport-on-map
  'help.guide.transport-on-map.title': 'Rajzolj egy közlekedést a térképre',
  'help.guide.transport-on-map.goal': 'Nézd meg, merre megy valójában egy repülő, egy autóút vagy egy kapcsolat.',
  'help.guide.transport-on-map.step.1':
    'A mindkét végén beállított közlekedés kis útvonal-ikont visz a napi tervben lévő során. Kattints rá; a felirata Foglalási útvonalak elrejtése lesz.',
  'help.guide.transport-on-map.step.2':
    'Az útvonal felrajzolódik a térképre, mindkét végén egy pirula alakú jelölővel, amely a közlekedés ikonját viszi.',
  'help.guide.transport-on-map.step.3':
    'Kattints egy végjelölőre, hogy elolvasd a foglalást a térkép elhagyása nélkül: az időpontok, a Légitársaság és a Járatszám, a Foglalási kód és a cím. A Bezárás elteszi a lapot.',
  'help.guide.transport-on-map.step.4':
    'A napok fölötti eszköztár útvonal-ikonja az egész utazást egyszerre intézi: Összes foglalási útvonal megjelenítése, és Összes foglalási útvonal elrejtése, hogy újra letöröld őket.',
  'help.guide.transport-on-map.step.5':
    'A tervezett tömegközlekedési kapcsolatnak nincs saját ikonja. A nap Útvonal kapcsolója rajzolja, ezért az Összes foglalási útvonal elrejtése nem törli, amíg az adott nap útvonala még be van kapcsolva.',
  'help.guide.transport-on-map.result':
    'Az útvonalak a térképen vannak, mindkét végükön egy jelölővel, és ott maradnak, amíg újra ki nem kapcsolod őket.',
  'help.guide.transport-on-map.tip.1':
    'Egy repülő, egy hajóút és egy komp ívként rajzolódik, egy autó, egy busz, egy taxi és egy kerékpár a valódi utakat követi, egy vonat vagy egy tervezett kapcsolat pedig az általa érintett állomásokon fut át.',
  'help.guide.transport-on-map.tip.2':
    'A megerősített foglalás folytonos vonal, a függőben lévő szaggatott. Az Útvonal-címkék a foglalásokhoz beállítás a reptérkódot vagy az állomásnevet írja a végjelölőkbe.',
  'help.guide.transport-on-map.tip.3':
    'Az Összes foglalási útvonal megjelenítése tiszta lap, nem réteg: eldobja, amit az egyes ikonok beállítottak, így kétszer megnyomva vagy minden be, vagy minden ki lesz kapcsolva.',
  // import-transport-file
  'help.guide.import-transport-file.title': 'Járat kiolvasása az e-jegyéből',
  'help.guide.import-transport-file.goal':
    'Hagyd, hogy a TREK kihúzza a járatot, a vonatot vagy a kompot a jegyből, amit a fuvarozó küldött, és ellenőrizd, mielőtt mentésre kerül.',
  'help.guide.import-transport-file.step.1':
    'Kattints az Importálás fájlból gombra a Közlekedés fül eszköztárában, a Közlekedés mellett. Megnyílik a Foglalási visszaigazolások importálása, ugyanaz a párbeszédablak, ami a Foglalások fülön van.',
  'help.guide.import-transport-file.step.2':
    'Ejtsd a jegyet a mezőre, vagy kattints rá, és válaszd ki: EML, PDF, PKPass, HTML és TXT, legfeljebb öt fájl, egyenként 10 MB. A kiválasztott fájlok neve ott áll a mezőn.',
  'help.guide.import-transport-file.step.3':
    'Kattints az Importálás gombra. A párbeszédablak azonnal bezárul; az olvasás a háttérben történik.',
  'help.guide.import-transport-file.step.4':
    'Jobbra lent egy kártya számol be a futásról a fájl neve alatt. A Fájlok feldolgozása… pipává válik, amikor az olvasás kész, és a kártya felkínálja az Importálás lehetőséget. Kattints rá.',
  'help.guide.import-transport-file.step.5':
    'Egy járat nyílik meg a Közlekedés hozzáadása űrlapon, már kitöltve: a Foglalás típusa Repülőn, a légitársaság és a járatszám a Címben, mindkét repülőtér az Útvonal alatt Indulással és Érkezéssel, az időpontjaik és az időzónáik, a Légitársaság és a Járatszám, a Foglalási kód és a jegy a Fájlok alatt. Ellenőrizd, és kattints a Hozzáadás gombra.',
  'help.guide.import-transport-file.result':
    'A járat egy kártya a Függőben alatt a Közlekedés fülön és egy sor azon a napon, amelyiken indul, a jeggyel a Fájlok alatt, és mivel mindkét repülőtér ismert, megrajzolja az ívét a térképen.',
  'help.guide.import-transport-file.tip.1':
    'A két fül egy importot oszt meg: egy fájl, ami egy járatot és egy szállodát tart, a járatot a Közlekedés hozzáadása, a szállodát az Új foglalás űrlapon nyitja meg, egymás után, bármelyik fülről is indultál.',
  'help.guide.import-transport-file.tip.2':
    'A repülőtereket a kódjuk alapján helyezi el. Egy állomást vagy kikötőt, amit az olvasás nem tudott elhelyezni, borostyánsárgán nevez meg a kártya; válaszd ki kézzel az Útvonal alatt, mielőtt a Hozzáadás gombra kattintasz, különben a közlekedés semmit nem rajzol a térképre.',
  // airtrail-import
  'help.guide.airtrail-import.title': 'Járatok importálása az AirTrailből',
  'help.guide.airtrail-import.goal':
    'Hozd be az utazásba egy menetben a járatokat, amiket már az AirTrailben vezetsz, és hagyd, hogy onnantól az AirTrailt kövessék.',
  'help.guide.airtrail-import.step.1':
    'Bekapcsolt AirTrail bővítménnyel és a Beállítások Integrációk része alatt csatlakoztatott példánnyal a Közlekedés fül eszköztára egy AirTrail gombot visz a Közlekedés mellett. Kattints rá.',
  'help.guide.airtrail-import.step.2':
    'Az Importálás az AirTrailből két csoportban sorolja a fiókod járatait. Az utazás ideje alatt tartja az utazáson belülre datáltakat, már kipipálva; az Egyéb járatok a többit, kipipálatlanul. Egy járat, ami már az utazásban van, szürkén jelenik meg és Importálva jelölést visel.',
  'help.guide.airtrail-import.step.3':
    'Minden sor egy jelölőnégyzet a légitársasággal és a járatszámmal, a két repülőtérrel és a dátummal. Kattints egy sorra, hogy bevedd a járatot vagy kihagyd; az Egyéb járatok alattiak csak akkor jönnek be, ha kipipálod őket.',
  'help.guide.airtrail-import.step.4':
    'A csatlakozó járatok, amelyek mindegyike egy napon belül indul arról a repülőtérről, ahol az előző leszállt, együtt vannak bekeretezve. Az alatta lévő pipa, Importálás egyetlen járatként, átszállással itt: és az a repülőtér, már be van kapcsolva: hagyd bekapcsolva egyetlen foglaláshoz megállóval, vagy kapcsold ki, hogy a szakaszokat külön járatokként importáld.',
  'help.guide.airtrail-import.step.5':
    'Kattints az Importálás gombra. A gomb számolja a kipipált járatokat, és az utána jövő üzenet megmondja, hány jött be.',
  'help.guide.airtrail-import.step.6':
    'A járatok kártyák a Megerősítve alatt, mindegyik egy kék AirTrail jelvénnyel az állapota mellett, és sorok azokon a napokon, amikor közlekednek. Egy összekapcsolt csatlakozás egy kártya, az útvonala az átszálláson át fut.',
  'help.guide.airtrail-import.result':
    'Az AirTrailből jött járatok kártyák a Közlekedés fülön és sorok a napjaikon, mindegyik az AirTrail jelvényt viseli, ami megmondja, honnan jött.',
  'help.guide.airtrail-import.tip.1':
    'Egy járat, ami ugyanazzal a számmal és dátummal már az utazásban van, kimarad, és egy üzenet megmondja, hány maradt ki. A napok fölötti eszköztár Visszavonás gombja az egész importot visszaveszi.',
  'help.guide.airtrail-import.tip.2':
    'Az AirTrail marad az igazság forrása. A TREK az utazás megnyitásakor és néhány percenként a háttérben olvassa a változásait; egy ott törölt járat megtartja a kártyáját, a jelvénye Nincs szinkronizálva lesz. A TREK-ben végzett szerkesztések csak az Integrációk alatt bekapcsolt Módosítások visszaírása az AirTrailbe mellett mennek vissza.',
  'help.guide.airtrail-import.tip.3':
    'Egy összekapcsolt csatlakozásnak nincs egyetlen AirTrail-járata, amit követhetne, ezért egyszeri import: megtartja a kék jelvényt, és a jelvény fölé vitt egér ezt meg is mondja. Ugyanez történik egy szinkronizált járattal, aminek kézzel adsz megállót.',

  // ── Screen: trip-roadtrip ─────────────────────────────────────────────────────────────
  'help.ctx.trip-roadtrip.title': 'Autós út',
  'help.ctx.trip-roadtrip.summary':
    'A terv egyetlen vezetésként olvasva: ugyanazok a napok és ugyanazok a helyek, megállókká fűzve a köztük lévő vezetéssel, a bal oszlopban egy sávban és a térképen. Megmondja, milyen messze és mennyi ideig, hol fogy ki a tank, és mi van az út mentén.',
  'help.ctx.trip-roadtrip.bullet.1':
    'A bal oszlop tetején a Napok és az Autós út vált a napterv és a vezetés között. Semmi nem másolódik és semmi nem változik: a Napok pontosan úgy adja vissza a tervet, ahogy volt.',
  'help.ctx.trip-roadtrip.bullet.2':
    'A sáv feje összegzi az utazást: Távolság, Vezetési idő és Megállók. Alatta naponta egy kártya jön, a nap saját kilométereivel, azzal, hány megállóért van, amit túllép, és egy Nyomvonal jelvénnyel.',
  'help.ctx.trip-roadtrip.bullet.3':
    'A számozott megálló olyan hely, amiért a nap van. Az útközbeni megálló, üzemanyag, töltés, pihenőhely, szám helyett a saját fajtájának ikonját viseli, és nem számít bele. Kattints a számra, hogy megváltoztasd, melyik ez, és az Idő jelvényre, hogy megmondd, mennyi ideig tart.',
  'help.ctx.trip-roadtrip.bullet.4':
    'Két megálló között egy vezetési sáv adja a szakaszt távolságként és időként. Kattints rá az Útvonalak ehhez a szakaszhoz megnyitásához, vagy kattints a térképen a kirajzolt útvonalra, hogy a szakaszt egy köztes ponton át hajlítsd.',
  'help.ctx.trip-roadtrip.bullet.5':
    'A jobb oszlopból Az útvonal mentén lesz: válassz napot, azt, hogy mit keresel, és hogy milyen széles a sáv, aztán Keresés. A Hozzáadás a találatot oda teszi a vezetésre, ahol valóban elhaladsz mellette.',
  'help.ctx.trip-roadtrip.bullet.6':
    'Az alatta lévő Vezetési beállítások tartja a korlátokat, az autót és a hatótávját, a napi utazási időszakot, azt, mit kerüljön, és hogy hogyan rajzolódik a vonal. Az utazáshoz tartoznak, így mindenki ugyanazzal az autóval tervez.',
  // roadtrip-mode
  'help.guide.roadtrip-mode.title': 'Olvasd az utazást egyetlen vezetésként',
  'help.guide.roadtrip-mode.goal': 'Kapcsold át a tervet autós út módba, és olvasd el, mit mond a sáv.',
  'help.guide.roadtrip-mode.step.1':
    'Kattints az Autós út elemre a bal oszlop tetején lévő Napok és Autós út kapcsolóban. A naptervet felváltja a vezetés, és a térkép kirajzolja minden napot, amelynek van útvonala.',
  'help.guide.roadtrip-mode.step.2': 'A sáv feje összegzi az egész utazást: Távolság, Vezetési idő és Megállók.',
  'help.guide.roadtrip-mode.step.3':
    'Alatta naponta egy kártya jön. A fejléce hordozza a nap számát és dátumát, a vezetést távolságként és időként, és azt, hány megállóért van a nap.',
  'help.guide.roadtrip-mode.step.4':
    'A kártyán belül a nap egy lánc: helyenként egy számozott megálló, minden pár között egy vezetési sáv, és a jobb szélen az érkezési idő.',
  'help.guide.roadtrip-mode.step.5':
    'Kattints egy nap fejlécére, hogy összecsukd. Az összecsukott nap a térképről is lekerül; kattints újra a fejlécre, hogy visszahozd.',
  'help.guide.roadtrip-mode.result':
    'A bal oszlop a vezetés, és a térkép annak minden napját mutatja. A Napok egyenesen visszakapcsol a tervre, változatlanul.',
  'help.guide.roadtrip-mode.tip.1':
    'A választás utazásonként megmarad, amíg a böngészőfül nyitva van, így egy újratöltés a vezetéshez tér vissza.',
  'help.guide.roadtrip-mode.tip.2':
    'A kapcsoló csak akkor létezik, ha egy adminisztrátor bekapcsolta az Autós út bővítményt, az Adminisztráció Bővítmények lapján.',
  'help.guide.roadtrip-mode.tip.3': 'Telefonon nincs kapcsoló: a bővítmény saját Autós út fület tesz a Terv mellé.',
  // roadtrip-stops
  'help.guide.roadtrip-stops.title': 'Útközbeni megállók, és hogy meddig maradsz',
  'help.guide.roadtrip-stops.goal':
    'Változtass egy helyet a vezetésen útközbeni megállóvá, és mondd meg, mennyi ideig tart minden megálló.',
  'help.guide.roadtrip-stops.step.1':
    'Kattints a sávban a megálló előtti számra. A címkéje Legyen útközbeni megálló, és megnyitja a Megálló típusa ablakot.',
  'help.guide.roadtrip-stops.step.2':
    'Válassz típust: Szállás, Üzemanyag, Töltés, Pihenőhely, Kemping, Étkezés vagy Látnivalók. A számból annak a fajtának az ikonja lesz, az alatta lévő megállók pedig új számot kapnak.',
  'help.guide.roadtrip-stops.step.3':
    'Az útközbeni megálló nem úti cél, így a nap fejléce eggyel kevesebb megállót számol.',
  'help.guide.roadtrip-stops.step.4':
    'Kattints újra az ikonra, Megálló típusának módosítása, és válaszd a Vissza úti céllá lehetőséget, hogy a megálló visszakapja a számát.',
  'help.guide.roadtrip-stops.step.5':
    'Minden megálló visel egy Idő jelvényt. Kattints rá, hogy megnyisd az Idő ezen a megállón ablakot.',
  'help.guide.roadtrip-stops.step.6':
    'Állítsd be a hosszt a csúszkával, a mínusz és a plusz gombbal vagy az egyik kész értékkel, nézd meg, mit csinál az Erkezes és az Indulas, aztán kattints a Mentés gombra.',
  'help.guide.roadtrip-stops.result':
    'Az a megálló, amelynek időt adtál, az óráját az Idő jelvényén viseli, és minden utána következő érkezés elmozdult vele, az pedig, amelyet elküldtél egy típusba és vissza, megint számozott úti cél.',
  'help.guide.roadtrip-stops.tip.1':
    'A tartózkodás a helyhez tartozik, nem egy látogatáshoz: egy két napra tervezett helynél mindkét napon ugyanannyi ideig állsz.',
  'help.guide.roadtrip-stops.tip.2':
    'Az útközbeni megállók a Napok nézetben is látszanak. A Megjelenítés a Napok nézetben is kikapcsolása, a Vezetési beállítások Szervizmegállók része alatt, csak az Autós útban tartja őket.',
  'help.guide.roadtrip-stops.tip.3': 'A Nincs tartozkodas, ugyanabban az ablakban, megint elveszi ezt az időt.',
  // roadtrip-corridor
  'help.guide.roadtrip-corridor.title': 'Üzemanyagot, ételt és szállást találni az útvonal mentén',
  'help.guide.roadtrip-corridor.goal':
    'Keresd végig azt az utat, amin valóban mész, és tedd a találatot a megfelelő szakaszra.',
  'help.guide.roadtrip-corridor.step.1':
    'Válaszd ki a napot Az útvonal mentén tetején. Csak azok a napok kerülnek felkínálásra, amelyeknek van útvonala.',
  'help.guide.roadtrip-corridor.step.2':
    'Az Amit keresel alatt pipáld ki, amire szükséged van. Az Üzemanyag, a Töltés, a Pihenőhely, a Kemping, a Szállás, az Étkezés és a Látnivalók kombinálhatók.',
  'help.guide.roadtrip-corridor.step.3':
    'Az Ezen belül alatt válaszd ki, milyen messzire nézzen az út két oldalán, 2 km, 5 km vagy 10 km, aztán kattints a Keresés gombra.',
  'help.guide.roadtrip-corridor.step.4':
    'A találatok fajta szerint csoportosítva jönnek vissza, abban a sorrendben, ahogy elhaladsz mellettük, mindegyik azzal, milyen messze fekszik a napon belül és milyen messze van az útvonaltól.',
  'help.guide.roadtrip-corridor.step.5':
    'Egy találaton a Hozzáadás megnyitja a Hozzáadás megállóként ablakot. Megmondja, melyik napra és hányadik helyre kerül a megálló, rákérdez a típusra és a megállón töltött időre, a Hozzáadás pedig ráteszi a vezetésre.',
  'help.guide.roadtrip-corridor.result':
    'A találatok abban a sorrendben vannak felsorolva, ahogy elhaladsz mellettük, és ki vannak rajzolva a térképen, a hozzáadott pedig ott ül a vezetésen, ahol valóban elhaladsz mellette.',
  'help.guide.roadtrip-corridor.tip.1':
    'Semmi nem keresődik, amíg meg nem nyomod a Keresés gombot: egy futás sok kérés egy közös szolgáltatás felé.',
  'help.guide.roadtrip-corridor.tip.2':
    'A Szűrés név szerint újabb kérdezés nélkül szűkíti azt, ami visszajött, a Találatok törlése pedig kiüríti a listát és a tűit. Kattints egy találatra, hogy a térképen a látómezőbe kerüljön.',
  'help.guide.roadtrip-corridor.tip.3':
    'Egy találat a térképről a kirajzolt útvonalra is húzható, így választod ki magad a szakaszt ott, ahol ugyanazon az úton kétszer mész végig. A Keresés melletti Hozzáadás kézzel ehelyett név szerint keres meg egy helyet.',
  // roadtrip-via
  'help.guide.roadtrip-via.title': 'Szakasz hajlítása köztes ponton át',
  'help.guide.roadtrip-via.goal':
    'Küldd a szakaszt azon az úton, amelyiket valóban akarod, anélkül hogy megállót tennél rá.',
  'help.guide.roadtrip-via.step.1':
    'Hozd látómezőbe a kívánt szakaszt: kattints egy megállóra a sávban, aztán zárd be a kártyát, ami a térkép fölött nyílik.',
  'help.guide.roadtrip-via.step.2':
    'Kattints a kirajzolt útvonalra. Arra a szakaszra, amelyikre kattintottál, egy köztes pont kerül, és a szakasz újratervezve halad át rajta.',
  'help.guide.roadtrip-via.step.3':
    'A sáv követi: a nap fejléce az új távolságot és vezetési időt hordozza, és a köztes pont utáni minden érkezés elmozdul vele.',
  'help.guide.roadtrip-via.step.4':
    'Vidd az egeret a fogantyú fölé, és megmondja, mit tud: Húzza az útvonal átalakításához, jobb gombbal eltávolítható. Húzd máshová, és a szakasz az új pont felé rajzolódik újra.',
  'help.guide.roadtrip-via.step.5':
    'Kattints jobb gombbal a fogantyúra, hogy elvedd. A szakasz megint a közvetlen úton megy.',
  'help.guide.roadtrip-via.result':
    'A szakasz azt az utat követi, amit választottál, a nap távolsága, vezetési ideje és érkezései pedig újraszámolódnak rá.',
  'help.guide.roadtrip-via.tip.1':
    'A köztes pont nem megálló: nincs száma, tartózkodása és érkezési ideje, és nem számít bele a nap megállóiba.',
  'help.guide.roadtrip-via.tip.2':
    'A fogantyúk a 9. nagyítási szinttől rajzolódnak, így az egész utazáshoz igazított térkép nélkülük mutatja a vonalat.',
  'help.guide.roadtrip-via.tip.3':
    'A bármely kirajzolt szakasztól két kilométernél távolabbi kattintás figyelmen kívül marad, és így jár egy repülőre, vonatra vagy kompra való kattintás is.',
  // roadtrip-alternatives
  'help.guide.roadtrip-alternatives.title': 'Próbálj ki másik utat egy szakaszon',
  'help.guide.roadtrip-alternatives.goal': 'Nézd meg, mit kínál még az útvonaltervező egy szakaszra, és vedd el.',
  'help.guide.roadtrip-alternatives.step.1':
    'Kattints egy vezetési sávra a sávban, arra a sorra két megálló között, amelyik a szakaszt távolságként és időként adja. A címkéje Más útvonalak.',
  'help.guide.roadtrip-alternatives.step.2':
    'Az Útvonalak ehhez a szakaszhoz a térkép fölött nyílik meg, utanként egy bejegyzéssel, mindegyik saját színnel kirajzolva a térképen.',
  'help.guide.roadtrip-alternatives.step.3':
    'Vidd az egeret egy bejegyzés fölé, hogy kigyúljon az az út. A Jelenlegi az az út, amelyiken mész, a Leggyorsabb pedig a leggyorsabb; a többi azt mondja meg, mennyivel lassabbak, vagy melyik útosztályt hagyják ki.',
  'help.guide.roadtrip-alternatives.step.4':
    'Kattints egy bejegyzésre, hogy arra menj, vagy a Bezárás gombra, hogy maradj azon az úton, amin vagy.',
  'help.guide.roadtrip-alternatives.result':
    'A szakasz azon az úton megy, amit választottál, a sáv távolsága és az utána jövő érkezések pedig vele változnak.',
  'help.guide.roadtrip-alternatives.tip.1':
    'Másik út választása köztes pontot tesz a szakaszra, és lecseréli azt, ami már volt rajta; az útvonaltervező saját útjának választása megint elveszi őket.',
  'help.guide.roadtrip-alternatives.tip.2':
    'Az Autopalya nelkul, a Dijmentes és a Komp nélkül egy második motorból jön, saját sebességmodellel, így az idejük nem hasonlítható össze a többiekével.',
  // roadtrip-limits
  'help.guide.roadtrip-limits.title': 'Állítsd be az autót és a vezetési korlátokat',
  'help.guide.roadtrip-limits.goal':
    'Mondd el a TREK-nek, mivel utazol, és milyen messzire vagy hajlandó egyhuzamban vezetni.',
  'help.guide.roadtrip-limits.step.1':
    'A Vezetési beállítások a jobb oszlopban a keresés alatt ül. A jelvényei megmondják, mi van beállítva; kattints rá a megnyitásához.',
  'help.guide.roadtrip-limits.step.2':
    'A Vezetés alatt a Leghosszabb egyhuzamban vezetés és a Vezetés naponta percben értendő. Az üres mező azt jelenti, ki, és semmi nincs megjelölve.',
  'help.guide.roadtrip-limits.step.3':
    'A Jármű alatt mondd meg, mivel utazol. Az Üzemanyag csak üzemanyagos megállóknál tankol, az Elektromos csak töltőknél, a Mindkettő mindkettőnél.',
  'help.guide.roadtrip-limits.step.4':
    'A Hatótáv egy tankkal vagy a Hatótáv egy töltéssel értéket magad írd be. Az alatta lévő Számold ki az autó adataiból a Tank mérete és a Fogyasztás, vagy az Akkumulátor és a Fogyasztás értékét veszi, és elvégzi a számítást.',
  'help.guide.roadtrip-limits.step.5':
    'A Kerülés, ha lehet kívánság, nem tiltás: az a nap, amelyiknek nincs kerülőútja, mégis használja az utat, és ezt megmondja a fejlécében.',
  'help.guide.roadtrip-limits.step.6':
    'Zárd be az ablakot. A kártya megmondja, mi van beállítva, a sáv pedig megjelöl minden szakaszt és minden napot, ami ezt túllépi.',
  'help.guide.roadtrip-limits.result':
    'A kártya jelvényei megmondják, mi van beállítva, és minden korláton túli szakasz és nap jelvényt visel a sávban.',
  'help.guide.roadtrip-limits.tip.1':
    'A beállítások az utazáshoz tartoznak, így mindenki ugyanazzal az autóval és ugyanazokkal a korlátokkal tervez.',
  'help.guide.roadtrip-limits.tip.2':
    'A Feltöltés eddig megmondja, mennyire tölt fel egy megálló, mert úton senki nem tölt 100 %-ig. Egy üzemanyagos vagy töltős megálló ezt magára nézve felülírhatja.',
  'help.guide.roadtrip-limits.tip.3':
    'Az Útvonalvonal dönti el, hogyan rajzolódik a vezetés: a Napok összekötése megtervezi a két nap közötti éjszakát, a Naponta egy szín pedig minden napnak sajátot ad.',
  // roadtrip-day-window
  'help.guide.roadtrip-day-window.title': 'Adj a vezetési napnak kezdetet és véget',
  'help.guide.roadtrip-day-window.goal':
    'Hagyd abba a vezetést az általad választott órában, és mondd meg, hol érjen véget a nap.',
  'help.guide.roadtrip-day-window.step.1':
    'Nyisd meg a Vezetési beállítások ablakot a jobb oszlopban, és keresd meg a Napi utazási időszak részt.',
  'help.guide.roadtrip-day-window.step.2':
    'Állíts be egy Nap kezdete értéket. Önmagában semmit nem csinál: mindkét időpont kell, ahogy az alattuk lévő megjegyzés mondja.',
  'help.guide.roadtrip-day-window.step.3':
    'Állíts be egy Nap vége értéket. A vezetés mostantól abban az órában megáll, és a maradékot átviszi a következő reggelre, a sávban egy Nap vége és egy Utazás folytatása sorként.',
  'help.guide.roadtrip-day-window.step.4':
    'A Nap lezárása alatt válaszd Az útvonalon lehetőséget, hogy a befejezési időben az úton álljon meg, vagy Az utolsó helyen lehetőséget, hogy előbb álljon meg, mint hogy a következő vezetés elhaladna mellette.',
  'help.guide.roadtrip-day-window.step.5':
    'Zárd be az ablakot. A Vezetési beállítások kártya jelvényként hordozza a két időpontot.',
  'help.guide.roadtrip-day-window.result':
    'A vezetés az általad beállított hosszúságú utazási napokra vágódik, és ami nem fér bele, az utolsó után jövő számolt napokon folytatódik. A napjaid és a helyeik nem változnak.',
  'help.guide.roadtrip-day-window.tip.1':
    'Bármelyik időpont törlése az egészet megint kikapcsolja. Az általad egy megállóra rögzített időpontok mindig elsőbbséget élveznek.',
  'help.guide.roadtrip-day-window.tip.2':
    'Beállított napi utazási időszakkal a napok mindig össze vannak kötve: az egyik nap utolsó megállójától a következő nap elsőjéig tartó vezetés megtervezésre és beszámításra kerül.',
  'help.guide.roadtrip-day-window.tip.3':
    'Minden napvég a térképen is jelölő, egy hold a nap számával. Húzd az útvonal mentén vagy egy helyre, hogy a nap máshol érjen véget; kattints rá jobb gombbal, hogy visszakerüljön az automatikus vég, az Automatikus napvégek visszaállítása pedig ebben az ablakban az egészet visszavonja.',
  // roadtrip-refuel
  'help.guide.roadtrip-refuel.title': 'Tankolj, mielőtt kifogy a tank',
  'help.guide.roadtrip-refuel.goal':
    'Keress helyet a tankolásra azon a szakaszon, ameddig az autó még elér, és tedd rá a vezetésre.',
  'help.guide.roadtrip-refuel.step.1':
    'Beállított hatótávval a sáv sávot rajzol a szakaszon oda, ahol kifogy: Itt fogy ki a tank, alatta pedig az, milyen messze van ez a szakaszon belül.',
  'help.guide.roadtrip-refuel.step.2':
    'A sávon lévő lámpa a gomb. Az Üzemanyag keresése a már megtett út mentén néz, és közben Keresés az útvonal mentén… látszik.',
  'help.guide.roadtrip-refuel.step.3':
    'Legfeljebb három állomás jön vissza, mindegyik azzal, milyen messze van az útvonaltól és mennyi hatótávot hagyna meg.',
  'help.guide.roadtrip-refuel.step.4':
    'Egy ajánlaton a plusz tankolási megállóként adja hozzá. A Hozzáadás megállóként már kitöltött típussal és idővel nyílik meg, a Hozzáadás pedig oda teszi a szakaszra, ahol valóban elhaladsz mellette.',
  'help.guide.roadtrip-refuel.result':
    'A megálló a megfelelő szakaszon van a saját ikonjával, a hatótáv tőle számolódik újra, a sáv pedig eltűnt.',
  'help.guide.roadtrip-refuel.tip.1':
    'A hatótáv az utolsó üzemanyagos vagy töltős megállótól számol, a napokon át. Az dönti el, mely megállók számítanak, hogy mivel utazol: az Üzemanyag csak az üzemanyagosak, az Elektromos csak a töltősek.',
  'help.guide.roadtrip-refuel.tip.2':
    'A keresés a kifogyási pont előtti utat nézi, tartalékot hagy, és kétszer számolja a kerülőt, így minden, amit kínál, valóban elérhető.',
  'help.guide.roadtrip-refuel.tip.3':
    'Az üres válasz nem zsákutca: a lámpából Újra lesz, mert a helykeresés közös szolgáltatás, ami néha túllépi az időt.',
  // roadtrip-track
  'help.guide.roadtrip-track.title': 'Kövessen egy nap importált nyomvonalat',
  'help.guide.roadtrip-track.goal':
    'Tedd egy nap vezetését arra a látványos útvonalra, amit GPX vagy KML nyomvonalként importáltál.',
  'help.guide.roadtrip-track.step.1':
    'Kattints a Nyomvonal jelvényre egy nap fejlécében. Az ablak azon a napon nyílik meg.',
  'help.guide.roadtrip-track.step.2':
    'Válassz nyomvonalat. Mindegyik megmondja, milyen hosszú, és hogy e nap mentén fut-e, vagy milyen messze fekszik tőle, a legközelebbi elöl.',
  'help.guide.roadtrip-track.step.3':
    'Kattints a Kövesse ezt a nyomvonalat gombra. A TREK köztes pontokat ejt oda, ahol a vezetés a legjobban eltér a nyomvonaltól, és kör kör után újratervez.',
  'help.guide.roadtrip-track.step.4':
    'Megmondja, hány köztes pontot helyezett el, és mennyire közel marad most a vezetés. Az alatta lévő gomb megint elveszi ezeket a köztes pontokat, és visszaadja a napot az útvonaltervezőnek; az ablak bezárása megtartja a nyomvonalat.',
  'help.guide.roadtrip-track.result':
    'A nap vezetése a nyomvonalat követi az útvonaltervező által választott út helyett, a Nyomvonal jelvénye pedig világít, és rámutatva megnevezi azt a nyomvonalat.',
  'help.guide.roadtrip-track.tip.1':
    'A fájlt a Napok alatt a Fájl importálása paranccsal importáld, bepipált Útvonalak vagy Nyomvonalak mellett. Amíg az utazás nem tart egyet sem, egyik nap sem viseli a jelvényt.',
  'help.guide.roadtrip-track.tip.2':
    'A nyomvonal követése lecseréli azokat a köztes pontokat, amik a nap szakaszain már voltak, ezért egy szakaszt kézzel a nyomvonal után formázz, ne előtte.',
};

export default help;
