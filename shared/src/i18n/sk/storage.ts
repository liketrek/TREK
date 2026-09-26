import type { TranslationStrings } from '../types';

const storage: TranslationStrings = {
  // Field labels/help — these keys are pinned by STORAGE_BACKEND_TYPES in
  // @trek/shared (labelKey/helpKey); renaming one breaks the admin form.
  'storage.field.root': 'Koreňový adresár',
  'storage.help.root': 'Absolútna cesta na serveri, kam tento backend ukladá svoje objekty.',
  'storage.field.endpoint': 'URL koncového bodu',
  'storage.help.endpoint':
    'Základná URL služby kompatibilnej s S3, napr. https://s3.example.com alebo http://127.0.0.1:9000.',
  'storage.field.bucket': 'Bucket',
  'storage.field.accessKeyId': 'ID prístupového kľúča',
  'storage.field.secretAccessKey': 'Tajný prístupový kľúč',
  'storage.field.region': 'Región',
  'storage.help.region': 'Ponechajte predvolenú hodnotu, pokiaľ váš poskytovateľ nevyžaduje konkrétny región.',
  'storage.field.keyPrefix': 'Predpona kľúča',
  'storage.help.keyPrefix': 'Voliteľná predpona pridaná ku každému kľúču objektu, napr. trek/prod.',
  'storage.field.retries': 'Počet pokusov',
  'storage.field.timeoutMs': 'Časový limit (ms)',
  'storage.field.primary': 'Primárny backend',
  'storage.field.replicas': 'Repliky',

  // Panel chrome
  'storage.title': 'Úložisko',
  'storage.description': 'Kam TREK ukladá nahrané súbory, fotky a zálohy. Kým neuložíte, nič sa nezmení.',
  'storage.loading': 'Načítava sa…',
  'storage.saved': 'Konfigurácia úložiska uložená',
  'storage.save': 'Uložiť zmeny',
  'storage.unsaved': 'Neuložené zmeny',

  'storage.saveConflict':
    'Nastavenia úložiska sa od načítania zmenili, takže vaše zmeny neboli uložené. Zahoďte ich a načítajte uložené nastavenia znova, aby ste mohli začať odznova.',
  'storage.discardAndReload': 'Zahodiť moje zmeny a načítať znova',
  'storage.configError.banner': 'Uložené nastavenia úložiska sa nepodarilo načítať — uložením ich nahradíte: {error}',
  // Backends list
  'storage.backends.title': 'Backendy',
  'storage.backends.add': 'Pridať backend',
  'storage.backends.usedBy': 'Používa: {categories}',
  'storage.backends.unused': 'Nepriradené k žiadnej kategórii',
  'storage.backends.envReadOnly': 'Definované premennou prostredia — iba na čítanie',
  'storage.source.built-in': 'Vstavané',
  'storage.source.env': 'Prostredie',
  'storage.source.settings': 'Nastavenia',
  'storage.type.local': 'Miestne',
  'storage.type.s3': 'S3',
  'storage.type.mirror': 'Zrkadlo',
  'storage.actions.test': 'Test',
  'storage.actions.edit': 'Upraviť',
  'storage.actions.remove': 'Odobrať',

  // Test-connection results
  'storage.test.running': 'Testuje sa…',
  'storage.test.ok': 'Pripojenie v poriadku',
  'storage.test.failed': 'Test zlyhal',

  // Remove pre-check (friendly message; the server stays authoritative)
  'storage.remove.title': 'Odobrať backend',
  'storage.remove.body': 'Odobrať {name} z konfigurácie? Server odmietne uloženie, ak od neho ešte niečo závisí.',
  'storage.remove.stillAssigned': 'Stále priradené k: {categories}',

  // Backend form
  'storage.form.addTitle': 'Pridať backend',
  'storage.form.editTitle': 'Upraviť backend',
  'storage.form.name': 'Názov',
  'storage.form.type': 'Typ',
  'storage.form.apply': 'Použiť',
  'storage.form.cancel': 'Zrušiť',
  'storage.form.duplicateName': 'Backend s názvom {name} už existuje',

  // Category map
  'storage.categories.title': 'Kategórie',
  'storage.categories.default': 'predvolené',
  'storage.categories.reassignWarning':
    'Existujúce objekty sa nepresúvajú: nové objekty idú do novo priradeného backendu, staré zostávajú tam, kde sú.',
  'storage.category.files': 'Dokumenty cesty',
  'storage.category.journey': 'Fotky z cestovného denníka',
  'storage.category.covers': 'Titulné obrázky',
  'storage.category.avatars': 'Profilové fotky',
  'storage.category.places': 'Obrázky miest',
  'storage.category.photos-google': 'Vyrovnávacia pamäť fotiek Google',
  'storage.category.photos-trek': 'Vyrovnávacia pamäť fotiek TREK',
  'storage.category.backups': 'Zálohy',

  // What each category stores — rendered under the label in the category map.
  'storage.categoryDesc.files':
    'Súbory nahrané k cestám — lístky, PDF, potvrdenia rezervácií a súbory zdieľané v chate cesty.',
  'storage.categoryDesc.journey': 'Fotky a náhľady pripojené k záznamom cestovného denníka.',
  'storage.categoryDesc.covers': 'Titulné obrázky ciest a zbierok vrátane obrázkov načítaných z Unsplash.',
  'storage.categoryDesc.avatars': 'Profilové fotky používateľských účtov.',
  'storage.categoryDesc.places': 'Obrázky pripojené k miestam a miestam v zbierkach — nahrané alebo importované.',
  'storage.categoryDesc.photos-google':
    'Uložené kópie fotiek z Google Places — dajú sa znovu načítať, ich strata je bezpečná.',
  'storage.categoryDesc.photos-trek':
    'Fotky uložené vo vyrovnávacej pamäti zo služby fotiek TREK používanej funkciou Spomienky — dajú sa znovu načítať, ich strata je bezpečná.',
  'storage.categoryDesc.backups': 'Archívy záloh servera vytvorené panelom Zálohy alebo plánovačom.',

  // Health strip
  'storage.health.title': 'Stav',
  'storage.health.allClear': 'Neboli zaznamenané žiadne zlyhania replík.',
  'storage.health.seedFile':
    'Je prítomný seed súbor storage-config.json, ale je ignorovaný — konfiguračné riadky už existujú. Spravujte úložisko tu.',
  'storage.health.failureLine': '{op} pre {key} na {backend} zlyhalo: {error}',

  // Replicas-on-primary mirror UX (2026-08-20 spec)
  'storage.mirror.targets': 'Ciele zrkadla',
  'storage.mirror.targetsHelp': 'Každý zápis do tohto backendu sa tiež skopíruje do každého vybraného cieľa.',
  'storage.mirror.latencyNote':
    'Repliky sa zapisujú jedna po druhej počas každého nahrávania — pomalý alebo nedostupný cieľ spomalí každé nahrávanie každej kategórie na tomto backende.',
  'storage.mirror.mirroredTo': 'Zrkadlené do: {targets}',
  'storage.mirror.replicaOf': 'Replika: {primaries}',
  'storage.mirror.cacheWarning':
    'Neodporúča sa: táto kategória obsahuje znovu získateľný obsah — jeho replikácia je zvyčajne zbytočná.',
  'storage.mirror.degenerate.duplicate-mirror':
    'Druhé zrkadlo obaľuje {primary} — panel spravuje iba prvé; odoberte toto, aby ste spravovali zrkadlenie z {primary}.',
  'storage.mirror.degenerate.env-primary': 'Obaľuje backend definovaný premennou prostredia — tu sa nedá upraviť.',
  'storage.mirror.degenerate.missing-primary': 'Odkazuje na backend, ktorý už neexistuje.',
  'storage.remove.usedAsReplicaBy': 'Používané ako replika: {primaries}',

  // Backfill + usage (backfill/stats/notifications spec)
  'storage.sync.now': 'Synchronizovať teraz',
  'storage.sync.running': 'Synchronizuje sa… {done}/{total}',
  'storage.sync.counts': '{copied} skopírovaných · {skipped} preskočených · {failed} zlyhaní',
  'storage.sync.cancel': 'Zrušiť synchronizáciu',
  'storage.sync.done': 'Synchronizácia dokončená: {copied} skopírovaných, {deleted} odstránených, {failed} zlyhaní',
  'storage.sync.cancelled': 'Synchronizácia zrušená',
  'storage.sync.error': 'Synchronizácia zlyhala: {error}',
  'storage.sync.prompt': 'Existujúce objekty ešte nie sú replikované — synchronizovať teraz?',
  'storage.sync.dismiss': 'Zavrieť',
  'storage.usage.line': '{objects} objektov · {size}',
  'storage.usage.computed': 'Využitie vypočítané {age}',
  'storage.usage.never': 'Využitie ešte nebolo vypočítané',
  'storage.usage.refresh': 'Obnoviť',
  'storage.usage.compute': 'Vypočítať teraz',
  'storage.usage.legacyNote': 'zahŕňa staršiu knižnicu fotiek',

  // Category migration (copy → flip → delta sweep)
  'storage.migrate.promptTitle': 'Presunúť existujúce objekty do nového backendu?',
  'storage.migrate.promptLine': '{category}: {objects} objektov ({size}) z {from} do {to}',
  'storage.migrate.promptLineUnknown': '{category}: neznáma veľkosť (využitie ešte nebolo vypočítané) z {from} do {to}',
  'storage.migrate.move': 'Presunúť existujúce objekty',
  'storage.migrate.routeOnly': 'Iba smerovať nové zápisy',
  'storage.migrate.running': 'Presúva sa {category}… {done}/{total}',
  'storage.migrate.done': 'Presun dokončený: {copied} skopírovaných, {skipped} preskočených',
  'storage.migrate.doneFailures': '{failed} zlyhalo — tieto objekty neboli skopírované do nového backendu',
  'storage.migrate.failed': 'Presun zlyhal: {error} — kategória nebola prepnutá',
  'storage.migrate.cancelled': 'Presun zrušený — nič nebolo prepnuté',
  'storage.migrate.reclaimable': '{objects} objektov ({size}) zostáva na {from} — uvoľnite ručne',
  'storage.migrate.cancel': 'Zrušiť presun',
  'storage.migrate.promptCancel': 'Zrušiť',
  'storage.migrate.queued': 'V poradí: {categories}',
  'storage.migrate.queueDropped': 'Nepodarilo sa spustiť ďalší presun — zvyšné poradie bolo vymazané: {categories}',
};
export default storage;
