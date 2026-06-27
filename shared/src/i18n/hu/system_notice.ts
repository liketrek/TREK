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
};
export default system_notice;
