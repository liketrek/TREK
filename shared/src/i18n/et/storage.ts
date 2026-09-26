import type { TranslationStrings } from '../types';

const storage: TranslationStrings = {
  // Field labels/help — these keys are pinned by STORAGE_BACKEND_TYPES in
  // @trek/shared (labelKey/helpKey); renaming one breaks the admin form.
  'storage.field.root': 'Juurkataloog',
  'storage.help.root': 'Absoluutne tee serveris, kuhu see taustsüsteem oma objektid salvestab.',
  'storage.field.endpoint': 'Otspunkti URL',
  'storage.help.endpoint': 'S3-ühilduva teenuse baas-URL, nt https://s3.example.com või http://127.0.0.1:9000.',
  'storage.field.bucket': 'Salv (bucket)',
  'storage.field.accessKeyId': 'Pääsuvõtme ID',
  'storage.field.secretAccessKey': 'Salajane pääsuvõti',
  'storage.field.region': 'Piirkond',
  'storage.help.region': 'Jäta vaikeväärtus, kui teenusepakkuja ei nõua kindlat piirkonda.',
  'storage.field.keyPrefix': 'Võtme eesliide',
  'storage.help.keyPrefix': 'Valikuline eesliide iga objekti võtmele, nt trek/prod.',
  'storage.field.retries': 'Korduskatsed',
  'storage.field.timeoutMs': 'Ajalõpp (ms)',
  'storage.field.primary': 'Peamine taustsüsteem',
  'storage.field.replicas': 'Koopiad',

  // Panel chrome
  'storage.title': 'Salvestusruum',
  'storage.description':
    'Kus TREK hoiab üleslaaditud faile, fotosid ja varukoopiaid. Muudatused jõustuvad salvestamisel.',
  'storage.loading': 'Laadimine…',
  'storage.saved': 'Salvestusseadistus salvestatud',
  'storage.save': 'Salvesta muudatused',
  'storage.unsaved': 'Salvestamata muudatused',

  'storage.saveConflict':
    'Salvestusseaded on pärast laadimist muutunud, seega sinu muudatusi ei salvestatud. Loobu neist ja laadi salvestatud seaded uuesti.',
  'storage.discardAndReload': 'Loobu minu muudatustest ja laadi uuesti',
  'storage.configError.banner':
    'Salvestatud salvestusseadete laadimine ebaõnnestus — salvestamine asendab need: {error}',
  // Backends list
  'storage.backends.title': 'Taustsüsteemid',
  'storage.backends.add': 'Lisa taustsüsteem',
  'storage.backends.usedBy': 'Kasutavad: {categories}',
  'storage.backends.unused': 'Pole määratud ühelegi kategooriale',
  'storage.backends.envReadOnly': 'Määratud keskkonnamuutujaga — ainult lugemiseks',
  'storage.source.built-in': 'Sisseehitatud',
  'storage.source.env': 'Keskkond',
  'storage.source.settings': 'Seaded',
  'storage.type.local': 'Kohalik',
  'storage.type.s3': 'S3',
  'storage.type.mirror': 'Peegel',
  'storage.actions.test': 'Testi',
  'storage.actions.edit': 'Muuda',
  'storage.actions.remove': 'Eemalda',

  // Test-connection results
  'storage.test.running': 'Testimine…',
  'storage.test.ok': 'Ühendus toimib',
  'storage.test.failed': 'Test ebaõnnestus',

  // Remove pre-check (friendly message; the server stays authoritative)
  'storage.remove.title': 'Eemalda taustsüsteem',
  'storage.remove.body':
    'Kas eemaldada {name} seadistusest? Server keeldub salvestamisest, kui miski seda veel kasutab.',
  'storage.remove.stillAssigned': 'Endiselt määratud: {categories}',

  // Backend form
  'storage.form.addTitle': 'Lisa taustsüsteem',
  'storage.form.editTitle': 'Muuda taustsüsteemi',
  'storage.form.name': 'Nimi',
  'storage.form.type': 'Tüüp',
  'storage.form.apply': 'Rakenda',
  'storage.form.cancel': 'Tühista',
  'storage.form.duplicateName': 'Taustsüsteem nimega {name} on juba olemas',

  // Category map
  'storage.categories.title': 'Kategooriad',
  'storage.categories.default': 'vaikimisi',
  'storage.categories.reassignWarning':
    'Olemasolevad objektid ei liigu: uued lähevad valitud taustsüsteemi, vanad jäävad oma kohale.',
  'storage.category.files': 'Reisidokumendid',
  'storage.category.journey': 'Reisiloo fotod',
  'storage.category.covers': 'Kaanepildid',
  'storage.category.avatars': 'Profiilipildid',
  'storage.category.places': 'Kohtade pildid',
  'storage.category.photos-google': "Google'i fotode vahemälu",
  'storage.category.photos-trek': 'TREKi fotode vahemälu',
  'storage.category.backups': 'Varukoopiad',

  // What each category stores — rendered under the label in the category map.
  'storage.categoryDesc.files':
    'Reisidele üleslaaditud manused — piletid, PDF-id, broneeringukinnitused ja reisivestluses jagatud failid.',
  'storage.categoryDesc.journey': 'Reisiloo sissekannete fotod ja pisipildid.',
  'storage.categoryDesc.covers': 'Reiside ja kogumike kaanepildid, sealhulgas Unsplashist saadud pildid.',
  'storage.categoryDesc.avatars': 'Kasutajakontode profiilipildid.',
  'storage.categoryDesc.places': 'Kohtade ja kogumike kohtade juurde lisatud pildid — üleslaaditud või imporditud.',
  'storage.categoryDesc.photos-google':
    'Google Placesi fotode vahemälukoopiad — saab uuesti laadida, kaotsiminek pole probleem.',
  'storage.categoryDesc.photos-trek':
    'Fotomälestustes kasutatava TREKi fototeenuse vahemälupildid — saab uuesti laadida, kaotsiminek pole probleem.',
  'storage.categoryDesc.backups': 'Varundusvaatest või ajakava järgi loodud serveri varukoopiaarhiivid.',

  // Health strip
  'storage.health.title': 'Seisund',
  'storage.health.allClear': 'Koopiate tõrkeid pole registreeritud.',
  'storage.health.seedFile':
    'Algseadistuse fail storage-config.json on olemas, kuid seda eiratakse — seadistuskirjed on juba olemas. Halda salvestusruumi siin.',
  'storage.health.failureLine': 'Toiming {op} objektiga {key} taustsüsteemis {backend} ebaõnnestus: {error}',

  // Replicas-on-primary mirror UX (2026-08-20 spec)
  'storage.mirror.targets': 'Peegeldamise sihtkohad',
  'storage.mirror.targetsHelp':
    'Iga sellesse taustsüsteemi kirjutatud objekt kopeeritakse ka kõigisse valitud sihtkohtadesse.',
  'storage.mirror.latencyNote':
    'Iga üleslaadimise ajal kirjutatakse koopiad üksteise järel — aeglane või kättesaamatu sihtkoht aeglustab kõigi selle taustsüsteemi kategooriate üleslaadimisi.',
  'storage.mirror.mirroredTo': 'Peegeldatakse: {targets}',
  'storage.mirror.replicaOf': 'Koopia taustsüsteemidest: {primaries}',
  'storage.mirror.cacheWarning':
    'Pole soovitatav: selle kategooria sisu saab uuesti laadida — koopiate loomine on tavaliselt raiskav.',
  'storage.mirror.degenerate.duplicate-mirror':
    'Taustsüsteemi {primary} ümbritseb teine peegel — vaade haldab ainult esimest. Eemalda see, et hallata peegeldamist taustsüsteemist {primary}.',
  'storage.mirror.degenerate.env-primary': 'Ümbritseb keskkonnas määratud taustsüsteemi — siin muuta ei saa.',
  'storage.mirror.degenerate.missing-primary': 'Viitab taustsüsteemile, mida enam pole.',
  'storage.remove.usedAsReplicaBy': 'Koopiana kasutavad: {primaries}',

  // Backfill + usage (backfill/stats/notifications spec)
  'storage.sync.now': 'Sünkrooni kohe',
  'storage.sync.running': 'Sünkroonimine… {done}/{total}',
  'storage.sync.counts': '{copied} kopeeritud · {skipped} vahele jäetud · {failed} ebaõnnestus',
  'storage.sync.cancel': 'Tühista sünkroonimine',
  'storage.sync.done': 'Sünkroonimine lõpetatud: {copied} kopeeritud, {deleted} kustutatud, {failed} ebaõnnestus',
  'storage.sync.cancelled': 'Sünkroonimine tühistatud',
  'storage.sync.error': 'Sünkroonimine ebaõnnestus: {error}',
  'storage.sync.prompt': 'Olemasolevatest objektidest pole veel koopiaid — kas sünkroonida kohe?',
  'storage.sync.dismiss': 'Sulge',
  'storage.usage.line': '{objects} objekti · {size}',
  'storage.usage.computed': 'Kasutus arvutatud {age}',
  'storage.usage.never': 'Kasutust pole veel arvutatud',
  'storage.usage.refresh': 'Värskenda',
  'storage.usage.compute': 'Arvuta kohe',
  'storage.usage.legacyNote': 'sisaldab vana fotokogu',

  // Category migration (copy → flip → delta sweep)
  'storage.migrate.promptTitle': 'Kas teisaldada olemasolevad objektid uude taustsüsteemi?',
  'storage.migrate.promptLine': '{category}: {objects} objekti ({size}), {from} → {to}',
  'storage.migrate.promptLineUnknown': '{category}: suurus teadmata (kasutust pole veel kontrollitud), {from} → {to}',
  'storage.migrate.move': 'Teisalda olemasolevad objektid',
  'storage.migrate.routeOnly': 'Suuna ainult uued kirjutused',
  'storage.migrate.running': 'Kategooria {category} teisaldamine… {done}/{total}',
  'storage.migrate.done': 'Teisaldamine lõpetatud: {copied} kopeeritud, {skipped} vahele jäetud',
  'storage.migrate.doneFailures': '{failed} ebaõnnestus — neid objekte ei kopeeritud uude taustsüsteemi',
  'storage.migrate.failed': 'Teisaldamine ebaõnnestus: {error} — kategooriat ei suunatud ümber',
  'storage.migrate.cancelled': 'Teisaldamine tühistatud — midagi ei suunatud ümber',
  'storage.migrate.reclaimable': '{objects} objekti ({size}) jäid taustsüsteemi {from} — vabasta ruum käsitsi',
  'storage.migrate.cancel': 'Tühista teisaldamine',
  'storage.migrate.promptCancel': 'Tühista',
  'storage.migrate.queued': 'Järjekorras: {categories}',
  'storage.migrate.queueDropped':
    'Järgmist teisaldamist ei saanud alustada — ülejäänud järjekord tühjendati: {categories}',
};
export default storage;
