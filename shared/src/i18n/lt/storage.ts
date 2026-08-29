import type { TranslationStrings } from '../types';

const storage: TranslationStrings = {
  // Field labels/help — these keys are pinned by STORAGE_BACKEND_TYPES in
  // @trek/shared (labelKey/helpKey); renaming one breaks the admin form.
  'storage.field.root': 'Šakninis katalogas',
  'storage.help.root': "Absoliutus kelias serveryje, kuriame šis backend'as saugo savo objektus.",
  'storage.field.endpoint': 'Galinio taško URL',
  'storage.help.endpoint':
    'Bazinis su S3 suderinamos paslaugos URL, pvz., https://s3.example.com arba http://127.0.0.1:9000.',
  'storage.field.bucket': 'Bucket',
  'storage.field.accessKeyId': 'Prieigos rakto ID',
  'storage.field.secretAccessKey': 'Slaptasis prieigos raktas',
  'storage.field.region': 'Regionas',
  'storage.help.region': 'Palikite numatytąją reikšmę, nebent jūsų paslaugų teikėjas reikalauja konkretaus regiono.',
  'storage.field.keyPrefix': 'Rakto priešdėlis',
  'storage.help.keyPrefix': 'Neprivalomas priešdėlis, pridedamas prie kiekvieno objekto rakto, pvz., trek/prod.',
  'storage.field.retries': 'Pakartojimai',
  'storage.field.timeoutMs': 'Laiko limitas (ms)',
  'storage.field.primary': "Pagrindinis backend'as",
  'storage.field.replicas': 'Replikos',

  // Panel chrome
  'storage.title': 'Saugykla',
  'storage.description': 'Kur TREK saugo įkeltus failus, nuotraukas ir atsargines kopijas. Kol neišsaugosite, niekas nepasikeis.',
  'storage.loading': 'Įkeliama…',
  'storage.saved': 'Saugyklos konfigūracija išsaugota',
  'storage.save': 'Išsaugoti pakeitimus',
  'storage.unsaved': 'Neišsaugoti pakeitimai',

  'storage.saveConflict':
    'Saugyklos nustatymai buvo pakeisti po to, kai juos įkėlėte, todėl jūsų pakeitimai nebuvo išsaugoti. Atmeskite juos ir iš naujo įkelkite išsaugotus nustatymus, kad pradėtumėte iš naujo.',
  'storage.discardAndReload': 'Atmesti mano pakeitimus ir įkelti iš naujo',
  'storage.configError.banner': 'Nepavyko įkelti išsaugotų saugyklos nustatymų — išsaugojus jie bus pakeisti: {error}',
  // Backends list
  'storage.backends.title': "Backend'ai",
  'storage.backends.add': "Pridėti backend'ą",
  'storage.backends.usedBy': 'Naudoja: {categories}',
  'storage.backends.unused': 'Nepriskirtas jokiai kategorijai',
  'storage.backends.envReadOnly': 'Apibrėžtas aplinkos kintamuoju — tik skaitymui',
  'storage.source.built-in': 'Įtaisytas',
  'storage.source.env': 'Aplinka',
  'storage.source.settings': 'Nustatymai',
  'storage.type.local': 'Vietinis',
  'storage.type.s3': 'S3',
  'storage.type.mirror': 'Veidrodinis',
  'storage.actions.test': 'Testuoti',
  'storage.actions.edit': 'Redaguoti',
  'storage.actions.remove': 'Pašalinti',

  // Test-connection results
  'storage.test.running': 'Testuojama…',
  'storage.test.ok': 'Ryšys sėkmingas',
  'storage.test.failed': 'Testas nepavyko',

  // Remove pre-check (friendly message; the server stays authoritative)
  'storage.remove.title': "Pašalinti backend'ą",
  'storage.remove.body':
    'Pašalinti {name} iš konfigūracijos? Serveris atmes išsaugojimą, jei nuo jo vis dar kažkas priklauso.',
  'storage.remove.stillAssigned': 'Vis dar priskirtas: {categories}',

  // Backend form
  'storage.form.addTitle': "Pridėti backend'ą",
  'storage.form.editTitle': "Redaguoti backend'ą",
  'storage.form.name': 'Pavadinimas',
  'storage.form.type': 'Tipas',
  'storage.form.apply': 'Taikyti',
  'storage.form.cancel': 'Atšaukti',
  'storage.form.duplicateName': "Backend'as pavadinimu {name} jau egzistuoja",

  // Category map
  'storage.categories.title': 'Kategorijos',
  'storage.categories.default': 'numatytoji',
  'storage.categories.reassignWarning':
    "Esami objektai nėra perkeliami: nauji objektai bus saugomi naujai priskirtame backend'e, o seni liks ten, kur buvo.",
  'storage.category.files': 'Kelionės dokumentai',
  'storage.category.journey': 'Kelionių žurnalo nuotraukos',
  'storage.category.covers': 'Viršelio paveikslėliai',
  'storage.category.avatars': 'Profilio nuotraukos',
  'storage.category.places': 'Vietų nuotraukos',
  'storage.category.photos-google': 'Google nuotraukų talpykla',
  'storage.category.photos-trek': 'TREK nuotraukų talpykla',
  'storage.category.backups': 'Atsarginės kopijos',

  // What each category stores — rendered under the label in the category map.
  'storage.categoryDesc.files':
    'Prie kelionių prisegti failai — bilietai, PDF dokumentai, rezervacijų patvirtinimai ir kelionės pokalbiuose bendrinti failai.',
  'storage.categoryDesc.journey': 'Nuotraukos ir miniatiūros, pridėtos prie kelionių žurnalo įrašų.',
  'storage.categoryDesc.covers': 'Kelionių ir kolekcijų viršelio paveikslėliai, įskaitant iš Unsplash gautus viršelius.',
  'storage.categoryDesc.avatars': 'Naudotojo paskyros profilio nuotraukos.',
  'storage.categoryDesc.places': 'Prie vietų ir kolekcijų vietų pridėti paveikslėliai — įkelti arba importuoti.',
  'storage.categoryDesc.photos-google': 'Talpykloje saugomos Google Places nuotraukų kopijos — jas galima gauti pakartotinai, prarasti saugu.',
  'storage.categoryDesc.photos-trek':
    'Talpykloje saugomos nuotraukos iš TREK nuotraukų paslaugos, naudojamos funkcijos „Prisiminimai" — jas galima gauti pakartotinai, prarasti saugu.',
  'storage.categoryDesc.backups': 'Serverio atsarginių kopijų archyvai, sukurti skydelyje „Atsarginės kopijos" arba pagal tvarkaraštį.',

  // Health strip
  'storage.health.title': 'Būklė',
  'storage.health.allClear': 'Replikų klaidų neužfiksuota.',
  'storage.health.seedFile':
    'Yra storage-config.json pradinis failas, tačiau jis ignoruojamas — konfigūracijos įrašai jau egzistuoja. Saugyklą tvarkykite čia.',
  'storage.health.failureLine': '{op} veiksmas su {key} ({backend}) nepavyko: {error}',

  // Replicas-on-primary mirror UX (2026-08-20 spec)
  'storage.mirror.targets': 'Veidrodžio tikslai',
  'storage.mirror.targetsHelp': "Kiekvienas įrašymas į šį backend'ą taip pat nukopijuojamas į kiekvieną pasirinktą tikslą.",
  'storage.mirror.latencyNote':
    "Replikos įrašomos viena po kitos kiekvieno įkėlimo metu — lėtas arba nepasiekiamas tikslas sulėtina kiekvieną šio backend'o kiekvienos kategorijos įkėlimą.",
  'storage.mirror.mirroredTo': 'Veidrodinama į: {targets}',
  'storage.mirror.replicaOf': 'Replika iš: {primaries}',
  'storage.mirror.cacheWarning':
    'Nerekomenduojama: šioje kategorijoje laikomas turinys, kurį galima gauti pakartotinai — jo replikavimas dažniausiai yra beprasmis.',
  'storage.mirror.degenerate.duplicate-mirror':
    'Antras veidrodis apgaubia {primary} — skydelis tvarko tik pirmąjį; pašalinkite šį, kad galėtumėte tvarkyti veidrodinimą iš {primary}.',
  'storage.mirror.degenerate.env-primary': "Apgaubia aplinkos kintamuoju apibrėžtą backend'ą — čia neredaguojamas.",
  'storage.mirror.degenerate.missing-primary': "Nurodo į backend'ą, kurio jau nebėra.",
  'storage.remove.usedAsReplicaBy': 'Naudojamas kaip replika: {primaries}',

  // Backfill + usage (backfill/stats/notifications spec)
  'storage.sync.now': 'Sinchronizuoti dabar',
  'storage.sync.running': 'Sinchronizuojama… {done}/{total}',
  'storage.sync.counts': '{copied} nukopijuota · {skipped} praleista · {failed} nepavyko',
  'storage.sync.cancel': 'Atšaukti sinchronizavimą',
  'storage.sync.done': 'Sinchronizavimas baigtas: {copied} nukopijuota, {deleted} ištrinta, {failed} nepavyko',
  'storage.sync.cancelled': 'Sinchronizavimas atšauktas',
  'storage.sync.error': 'Sinchronizavimas nepavyko: {error}',
  'storage.sync.prompt': 'Esami objektai dar nereplikuoti — sinchronizuoti dabar?',
  'storage.sync.dismiss': 'Atmesti',
  'storage.usage.line': '{objects} vnt. · {size}',
  'storage.usage.computed': 'Naudojimas apskaičiuotas {age}',
  'storage.usage.never': 'Naudojimas dar neapskaičiuotas',
  'storage.usage.refresh': 'Atnaujinti',
  'storage.usage.compute': 'Apskaičiuoti dabar',
  'storage.usage.legacyNote': 'įskaitant senąją nuotraukų biblioteką',

  // Category migration (copy → flip → delta sweep)
  'storage.migrate.promptTitle': "Perkelti esamus objektus į naują backend'ą?",
  'storage.migrate.promptLine': '{category}: {objects} vnt. ({size}) iš {from} į {to}',
  'storage.migrate.promptLineUnknown': '{category}: nežinomas dydis (naudojimas dar nenuskaitytas) iš {from} į {to}',
  'storage.migrate.move': 'Perkelti esamus objektus',
  'storage.migrate.routeOnly': 'Tik nukreipti naujus įrašymus',
  'storage.migrate.running': 'Perkeliama {category}… {done}/{total}',
  'storage.migrate.done': 'Perkėlimas baigtas: {copied} nukopijuota, {skipped} praleista',
  'storage.migrate.doneFailures': "{failed} nepavyko — šie objektai nebuvo nukopijuoti į naują backend'ą",
  'storage.migrate.failed': 'Perkėlimas nepavyko: {error} — kategorija nebuvo perjungta',
  'storage.migrate.cancelled': 'Perkėlimas atšauktas — niekas nebuvo perjungta',
  'storage.migrate.reclaimable': '{objects} vnt. ({size}) liko šaltinyje {from} — atlaisvinkite rankiniu būdu',
  'storage.migrate.cancel': 'Atšaukti perkėlimą',
  'storage.migrate.promptCancel': 'Atšaukti',
  'storage.migrate.queued': 'Eilėje: {categories}',
  'storage.migrate.queueDropped': 'Nepavyko pradėti kito perkėlimo — likusi eilė buvo išvalyta: {categories}',
};
export default storage;
