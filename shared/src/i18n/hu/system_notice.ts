import type { TranslationStrings } from '../types';

const system_notice: TranslationStrings = {
  'system_notice.welcome_v1.title': 'Üdvözöl a TREK',
  'system_notice.welcome_v1.body':
    'Az összes az egyben utazástervező. Készítsen útvonalakat, ossza meg az utakat barátaival, és maradjon szervezett — online és offline.',
  'system_notice.welcome_v1.cta_label': 'Utazás tervezése',
  'system_notice.welcome_v1.hero_alt': 'Festői úticél TREK tervező felülettel',
  'system_notice.welcome_v1.highlight_plan': 'Napi útvonalak minden utazáshoz',
  'system_notice.welcome_v1.highlight_share': 'Együttműködés utazótársakkal',
  'system_notice.welcome_v1.highlight_offline': 'Mobilon offline is működik',
  'system_notice.dev_test_modal.title': '[Dev] Test notice',
  'system_notice.dev_test_modal.body': 'This is a dev-only test notice.',
  'system_notice.thank_you_support.title': 'Köszönöm, hogy a TREK-et használod',
  'system_notice.thank_you_support.body':
    'Gyors köszönet, hogy telepítetted a TREK-et — őszintén sokat jelent.\n\nEgyedül fejlesztek, és a szabadidőmben építem a TREK-et. Egy kis eszközként indult, csak a saját utazásaimhoz, és azóta őszintén lenyűgöz a közösség támogatása és érdeklődése. A TREK sok szívvel készül a részemről — de annak a sok csodálatos külső közreműködőnek is köszönhetően, akik segítettek formálni.\n\n**A TREK nyílt forráskódú és teljesen ingyenes — és ez örökre így is marad. Nincsenek fizetős csomagok, nincsenek előfizetések, nincs semmi átverés. Ígérem.**\n\nHa a TREK hasznos számodra, és szeretnéd támogatni a fejlesztését, egy kis kávé őszintén segít, hogy tovább építhessem — semmi nyomás, de minden csésze átsegít a késő éjszakákon.\n\nKöszönöm, hogy itt vagy.\n\n— Maurice',
  'system_notice.thank_you_support.highlight_opensource': '100% nyílt forráskódú a GitHubon',
  'system_notice.thank_you_support.highlight_free': 'Örökre ingyenes — soha semmi fizetős csomag',
  'system_notice.thank_you_support.highlight_community': 'A közösséggel együtt épült',
  'system_notice.thank_you_support.cta_bmc': 'Buy Me a Coffee',
  'system_notice.thank_you_support.cta_kofi': 'Támogass a Ko-fi-n',
  'system_notice.pager.prev': 'Előző értesítés',
  'system_notice.pager.next': 'Következő értesítés',
  'system_notice.pager.counter': '{current} / {total}',
  'system_notice.pager.goto': '{n}. értesítésre ugrás',
  'system_notice.pager.position': '{current}/{total}. értesítés',
  'system_notice.v3_photos.title': 'A fotók helye megváltozott 3.0-ban',
  'system_notice.v3_photos.body':
    'Az útiterv-tervező **Fényképek** lapja eltávolításra került. Fényképeid biztonságban vannak — TREK soha nem módosította Immich vagy Synology könyvtáradat.\n\nA fényképek mostantól a **Journey** bővítményben élnek. A Journey opcionális — ha még nem elérhető, kérd meg a rendszergazdát, hogy engedélyezze Admin → Bővítmények alatt.',
  'system_notice.v3_journey.title': 'Ismerje meg a Journey-t — útinnapló',
  'system_notice.v3_journey.body':
    'Dokumentáld utazazsaid gazdag történetekként idővonalakkal, fotgáriákkal és interaktív térképekkel.',
  'system_notice.v3_journey.cta_label': 'Journey megnyitása',
  'system_notice.v3_journey.highlight_timeline': 'Napi idővonal és galéria',
  'system_notice.v3_journey.highlight_photos': 'Import Immich-ből vagy Synology-ból',
  'system_notice.v3_journey.highlight_share': 'Nyilvános megosztás — bejelentkezés nélkül',
  'system_notice.v3_journey.highlight_export': 'Exportálás PDF fotkönyvként',
  'system_notice.v3_features.title': 'További újdonságok a 3.0-ban',
  'system_notice.v3_features.body': 'Néhány további dolog, amit érdemes tudni erről a kiadásról.',
  'system_notice.v3_features.highlight_dashboard': 'Mobile-first irmütébla újratervezve',
  'system_notice.v3_features.highlight_offline': 'Teljes offline mód PWA-ként',
  'system_notice.v3_features.highlight_search': 'Valós idejű helykeresés-kiegészítés',
  'system_notice.v3_features.highlight_import': 'Helyek importálása KMZ/KML fájlokból',
  'system_notice.v3_mcp.title': 'MCP: OAuth 2.1 frissítés',
  'system_notice.v3_mcp.body':
    'Az MCP integráció teljesen megújult. Az OAuth 2.1 mostantól az ajánlott hitelesítési módszer. A statikus tokenek (trek_…) elavultak és egy jövőbeli kiadásban eltávolításra kerülnek.',
  'system_notice.v3_mcp.highlight_oauth': 'OAuth 2.1 ajánlott (mcp-remote)',
  'system_notice.v3_mcp.highlight_scopes': '24 részletes engedélyezési hatókör',
  'system_notice.v3_mcp.highlight_deprecated': 'Statikus trek_ tokenek elavultak',
  'system_notice.v3_mcp.highlight_tools': 'Bővített eszközkészlet és promptok',
  'system_notice.v3_thankyou.title': 'Egy személyes gondolat tőlem',
  'system_notice.v3_thankyou.body':
    'Mielőtt továbbmennél — szeretnék egy pillanatra megállni.\n\nA TREK egy hobbiprojektként indult, amit a saját utazásaimhoz építettem. Sosem gondoltam volna, hogy valami olyanná nő, amire 4000-en bízzátok a kalandjaitok tervezését. Minden csillagot, minden issue-t, minden funkciókérést — mindet elolvasom, és ezek tartanak életben a késő éjszakákon a teljes állás és az egyetem között.\n\nSzeretnétek, ha tudnátok: a TREK mindig nyílt forráskódú marad, mindig self-hosted, mindig a tiétek. Nincs nyomkövetés, nincs előfizetés, nincsenek rejtett feltételek. Csak egy eszköz, amit valaki épített, aki ugyanúgy szereti az utazást, mint ti.\n\nKülönleges köszönet [jubnl](https://github.com/jubnl)-nek — hihetetlen társsá váltál. A 3.0 nagyszerűségének nagy része a te kézjegyedet viseli. Köszönöm, hogy hittél ebben a projektben, amikor még nyers volt.\n\nÉs mindannyiótoknak, akik hibát jelentettetek, szöveget fordítottatok, megosztottátok a TREK-et egy baráttal, vagy egyszerűen csak egy utazást terveztetek vele — **köszönöm**. Ti vagytok az ok, amiért ez létezik.\n\nSok további közös kalandért.\n\n— Maurice\n\n---\n\n[Csatlakozz a közösséghez a Discordon](https://discord.gg/7Q6M6jDwzf)\n\nHa a TREK jobbá teszi az utazásaidat, egy [kis kávé](https://ko-fi.com/mauriceboe) mindig segít, hogy égve maradjanak a fények.',
  'system_notice.v3014_whitespace_collision.title': 'Szükséges beavatkozás: felhasználói fiókütközés',
  'system_notice.v3014_whitespace_collision.body':
    'A 3.0.14-es frissítés egy vagy több felhasználónév- vagy e-mail-ütközést észlelt, amelyeket a tárolt értékek elején vagy végén lévő szóközök okoztak. Az érintett fiókok automatikusan át lettek nevezve. Ellenőrizze a szervernaplókat a **[migration] WHITESPACE COLLISION** kezdetű soroknál a felülvizsgálatot igénylő fiókok azonosításához.',
  'system_notice.release_notes.eyebrow': 'Frissítés telepítve',
  'system_notice.release_notes.headline': 'Három dolog, amit a TREK mostantól magától csinál.',
  'system_notice.release_notes.intro':
    'Saját hely-API, elejétől a végéig megtervezett autós utak és a helyelőzményeid újra a saját kezedben.',
  'system_notice.release_notes.features_label': 'A fő újdonságok',
  'system_notice.release_notes.features_aside': 'És ez még nem minden',
  'system_notice.release_notes.feature_places_title': 'TREK Places API',
  'system_notice.release_notes.feature_places_body':
    'Az első nyílt forráskódú utazástervező, amely saját hely-API-t üzemeltet. 73,6 millió hely, havonta újraépítve. Nincs kulcs, nincs kvóta.',
  'system_notice.release_notes.feature_roadtrip_title': 'Autós út bővítmény',
  'system_notice.release_notes.feature_roadtrip_body':
    'Az Autós út mód magát a vezetést is megtervezi: az útvonalat, a távolságot, a vezetési időt és a megállókat. Ez egy bővítmény, amely addig ki van kapcsolva, amíg egy rendszergazda be nem kapcsolja.',
  'system_notice.release_notes.feature_dawarich_title': 'Dawarich-integráció',
  'system_notice.release_notes.feature_dawarich_body':
    'A Google Timeline self-hosted megfelelője, mostantól a TREK-ben is olvasható. A TREK olvas, és csak olvas. Soha semmit nem ír vissza.',
  'system_notice.release_notes.footnote': 'Plusz rengeteg kisebb változás a TREK többi részében.',
  'system_notice.release_notes.notes_label': 'Kiadási jegyzetek',
  'system_notice.release_notes.note_eyebrow': 'Egy szó a fejlesztőtől',
  'system_notice.release_notes.note_title': 'Miattad építem tovább a TREK-et.',
  'system_notice.release_notes.note_body':
    'A TREK egy kis eszközként indult a saját utazásaimhoz, munka után írtam, mert jobban szerettem volna megtervezni őket. Azóta igazából folyamatosan nő. Szinte mindent, amit használsz, késő éjjel, hétvégén, vonaton, egy teljes állás mellett építettem, és sok olyan este volt, amikor csendben azon tűnődtem, megnyitja-e egyáltalán valaki valaha.',
  'system_notice.release_notes.promise_label': 'Az ígéret',
  'system_notice.release_notes.promise_lead': 'A TREK ingyenes marad, örökre.',
  'system_notice.release_notes.promise_text':
    'Minden funkció, minden frissítés, mindenkinek. Nincsenek fizetős csomagok, nincsenek előfizetések, nincs átverés.',
  'system_notice.release_notes.note_body_after':
    'Aztán megnyitottátok. Néhány hónap alatt több ezren lettetek: csillagok, hibajelentések, fordítások olyan nyelvekre, amelyeket nem beszélek, pull requestek olyanoktól, akikkel sosem találkoztam. Még mindig a repóval kezdem minden reggelt, és még mindig nem egészen tűnik valóságosnak.',
  'system_notice.release_notes.note_closing': 'Köszönöm, hogy itt vagy. Maurice',
  'system_notice.release_notes.support_lead':
    'A TREK ingyenes, és mindig az is marad, de a szerverek, a domainek és a sok késő éjszaka nem azok.',
  'system_notice.release_notes.support_text':
    'Ha kiérdemelt egy helyet az utazásaid között, hívj meg egy kávéra, és segíts, hogy jöhessen a következő kiadás.',
  'system_notice.release_notes.cta_bmc': 'Buy me a coffee',
  'system_notice.release_notes.cta_kofi': 'Támogass a Ko-fi-n',
};
export default system_notice;
