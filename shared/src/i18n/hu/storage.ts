import type { TranslationStrings } from '../types';

const storage: TranslationStrings = {
  'storage.field.root': 'Gyökérkönyvtár',
  'storage.help.root': 'Abszolút elérési út a szerveren, ahol ez a backend tárolja az objektumait.',
  'storage.field.endpoint': 'Végpont URL',
  'storage.help.endpoint':
    'Az S3-kompatibilis szolgáltatás alap URL-je, pl. https://s3.example.com vagy http://127.0.0.1:9000.',
  'storage.field.bucket': 'Bucket',
  'storage.field.accessKeyId': 'Hozzáférési kulcs azonosító',
  'storage.field.secretAccessKey': 'Titkos hozzáférési kulcs',
  'storage.field.region': 'Régió',
  'storage.help.region': 'Hagyd az alapértelmezettet, hacsak a szolgáltatód nem igényel konkrét régiót.',
  'storage.field.keyPrefix': 'Kulcs-előtag',
  'storage.help.keyPrefix': 'Opcionális előtag, amely minden objektumkulcs elé kerül, pl. trek/prod.',
  'storage.field.retries': 'Újrapróbálkozások',
  'storage.field.timeoutMs': 'Időtúllépés (ms)',
  'storage.field.primary': 'Elsődleges backend',
  'storage.field.replicas': 'Replikák',
  'storage.title': 'Tárhely',
  'storage.description':
    'Itt tárolja a TREK a feltöltött fájlokat, fotókat és biztonsági mentéseket. Semmi sem változik, amíg nem mentesz.',
  'storage.loading': 'Betöltés…',
  'storage.saved': 'A tárhely-konfiguráció mentve',
  'storage.save': 'Módosítások mentése',
  'storage.unsaved': 'Nem mentett módosítások',
  'storage.saveConflict':
    'A tárhely-konfiguráció megváltozott a betöltése óta, ezért a módosításai nem lettek mentve. Vesse el őket, és töltse be újra a mentett beállításokat az újrakezdéshez.',
  'storage.discardAndReload': 'Módosításaim elvetése és újratöltés',
  'storage.configError.banner':
    'A mentett tárhely-beállítások betöltése nem sikerült — a mentés felülírja őket: {error}',
  'storage.backends.title': 'Backendek',
  'storage.backends.add': 'Backend hozzáadása',
  'storage.backends.usedBy': 'Használja: {categories}',
  'storage.backends.unused': 'Nincs kategóriához rendelve',
  'storage.backends.envReadOnly': 'Környezeti változó definiálja — csak olvasható',
  'storage.source.built-in': 'Beépített',
  'storage.source.env': 'Környezet',
  'storage.source.settings': 'Beállítások',
  'storage.type.local': 'Helyi',
  'storage.type.s3': 'S3',
  'storage.type.mirror': 'Tükör',
  'storage.actions.test': 'Tesztelés',
  'storage.actions.edit': 'Szerkesztés',
  'storage.actions.remove': 'Eltávolítás',
  'storage.test.running': 'Tesztelés…',
  'storage.test.ok': 'A kapcsolat rendben',
  'storage.test.failed': 'A teszt sikertelen',
  'storage.remove.title': 'Backend eltávolítása',
  'storage.remove.body':
    'Eltávolítod a(z) {name} elemet a konfigurációból? A szerver elutasítja a mentést, ha még bármi függ tőle.',
  'storage.remove.stillAssigned': 'Még mindig hozzá van rendelve: {categories}',
  'storage.form.addTitle': 'Backend hozzáadása',
  'storage.form.editTitle': 'Backend szerkesztése',
  'storage.form.name': 'Név',
  'storage.form.type': 'Típus',
  'storage.form.apply': 'Alkalmaz',
  'storage.form.cancel': 'Mégse',
  'storage.form.duplicateName': 'Már létezik {name} nevű backend',
  'storage.categories.title': 'Kategóriák',
  'storage.categories.default': 'alapértelmezett',
  'storage.categories.reassignWarning':
    'A meglévő objektumok nem mozdulnak: az új objektumok az újonnan hozzárendelt backendbe kerülnek, a régiek ott maradnak, ahol vannak.',
  'storage.category.files': 'Útidokumentumok',
  'storage.category.journey': 'Útinapló-fotók',
  'storage.category.covers': 'Borítóképek',
  'storage.category.avatars': 'Profilképek',
  'storage.category.places': 'Helyképek',
  'storage.category.photos-google': 'Google fotó gyorsítótár',
  'storage.category.photos-trek': 'TREK fotó gyorsítótár',
  'storage.category.backups': 'Biztonsági mentések',

  // What each category stores — rendered under the label in the category map.
  'storage.categoryDesc.files':
    'Az utazásokhoz feltöltött fájlmellékletek — jegyek, PDF-ek, foglalási visszaigazolások és az útcsevegésben megosztott fájlok.',
  'storage.categoryDesc.journey': 'Az útinapló bejegyzésekhez csatolt fotók és bélyegképek.',
  'storage.categoryDesc.covers': 'Utazások és gyűjtemények borítóképei, beleértve az Unsplashről lekért borítókat is.',
  'storage.categoryDesc.avatars': 'Felhasználói fiókok profilképei.',
  'storage.categoryDesc.places': 'Helyekhez és gyűjteményhelyekhez csatolt képek — feltöltve vagy importálva.',
  'storage.categoryDesc.photos-google':
    'A Google Places fotóinak gyorsítótárazott másolatai — újra lekérhetők, biztonságosan elveszíthetők.',
  'storage.categoryDesc.photos-trek':
    'A Fotók (Memories) funkció által használt TREK fotószolgáltatás gyorsítótárazott fotói — újra lekérhetők, biztonságosan elveszíthetők.',
  'storage.categoryDesc.backups':
    'A Biztonsági mentés panel vagy az ütemezés által létrehozott szerver-mentési archívumok.',
  'storage.health.title': 'Állapot',
  'storage.health.allClear': 'Nincs rögzített replikahiba.',
  'storage.health.seedFile':
    'Egy storage-config.json seed fájl jelen van, de figyelmen kívül marad — konfigurációs sorok már léteznek. A tárhelyet itt kezelheted.',
  'storage.health.failureLine': '{op} sikertelen: {key} ezen: {backend} — {error}',

  // Replicas-on-primary mirror UX (2026-08-20 spec)
  'storage.mirror.targets': 'Tükör célok',
  'storage.mirror.targetsHelp': 'Az ebbe a backendbe történő minden írás minden kiválasztott célra is átmásolódik.',
  'storage.mirror.latencyNote':
    'A replikák egymás után íródnak minden feltöltés során — egy lassú vagy elérhetetlen cél lelassítja e backend minden kategóriájának minden feltöltését.',
  'storage.mirror.mirroredTo': 'Tükrözve ide: {targets}',
  'storage.mirror.replicaOf': 'Replika innen: {primaries}',
  'storage.mirror.cacheWarning':
    'Nem ajánlott: ez a kategória újra lekérhető tartalmat tartalmaz — a replikálása általában felesleges.',
  'storage.mirror.degenerate.duplicate-mirror':
    'Egy második tükör veszi körül a(z) {primary} elemet — a panel csak az elsőt kezeli; távolítsd el ezt, hogy a tükrözést a(z) {primary} elemtől kezelhesd.',
  'storage.mirror.degenerate.env-primary':
    'Egy környezeti változóval definiált backendet vesz körül — itt nem szerkeszthető.',
  'storage.mirror.degenerate.missing-primary': 'Egy már nem létező backendre hivatkozik.',
  'storage.remove.usedAsReplicaBy': 'Replikaként használja: {primaries}',

  // Backfill + usage (backfill/stats/notifications spec)
  'storage.sync.now': 'Szinkronizálás most',
  'storage.sync.running': 'Szinkronizálás… {done}/{total}',
  'storage.sync.counts': '{copied} másolva · {skipped} kihagyva · {failed} sikertelen',
  'storage.sync.cancel': 'Szinkronizálás megszakítása',
  'storage.sync.done': 'Szinkronizálás befejezve: {copied} másolva, {deleted} törölve, {failed} sikertelen',
  'storage.sync.cancelled': 'Szinkronizálás megszakítva',
  'storage.sync.error': 'A szinkronizálás sikertelen: {error}',
  'storage.sync.prompt': 'A meglévő objektumok még nincsenek replikálva — szinkronizálsz most?',
  'storage.sync.dismiss': 'Elvetés',
  'storage.usage.line': '{objects} objektum · {size}',
  'storage.usage.computed': 'A használat kiszámítva {age}',
  'storage.usage.never': 'A használat még nincs kiszámítva',
  'storage.usage.refresh': 'Frissítés',
  'storage.usage.compute': 'Számítás most',
  'storage.usage.legacyNote': 'tartalmazza a régi fotókönyvtárat',

  // Category migration (copy → flip → delta sweep)
  'storage.migrate.promptTitle': 'Áthelyezed a meglévő objektumokat az új backendre?',
  'storage.migrate.promptLine': '{category}: {objects} objektum ({size}) innen: {from} ide: {to}',
  'storage.migrate.promptLineUnknown':
    '{category}: ismeretlen méret (a használat még nincs kiszámítva) innen: {from} ide: {to}',
  'storage.migrate.move': 'Meglévő objektumok áthelyezése',
  'storage.migrate.routeOnly': 'Csak az új írások irányítása',
  'storage.migrate.running': '{category} áthelyezése… {done}/{total}',
  'storage.migrate.done': 'Áthelyezés kész: {copied} másolva, {skipped} kihagyva',
  'storage.migrate.doneFailures': '{failed} sikertelen — ezek az objektumok nem lettek átmásolva az új backendre',
  'storage.migrate.failed': 'Az áthelyezés sikertelen: {error} — a kategória nem lett átváltva',
  'storage.migrate.cancelled': 'Áthelyezés megszakítva — semmi sem lett átváltva',
  'storage.migrate.reclaimable': '{objects} objektum ({size}) marad a(z) {from} helyen — kézzel szabadítsd fel',
  'storage.migrate.cancel': 'Áthelyezés megszakítása',
  'storage.migrate.promptCancel': 'Mégse',
  'storage.migrate.queued': 'Várólistán: {categories}',
  'storage.migrate.queueDropped': 'A következő áthelyezés nem indítható el — a hátralévő várólista törlésre került: {categories}',
};
export default storage;
