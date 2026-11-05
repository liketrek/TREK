import type { TranslationStrings } from '../types';

const storage: TranslationStrings = {
  // Field labels/help — these keys are pinned by STORAGE_BACKEND_TYPES in
  // @trek/shared (labelKey/helpKey); renaming one breaks the admin form.
  'storage.field.root': 'Koreňový adresár',
  'storage.help.root': 'Absolútna cesta na serveri, kam tento backend ukladá svoje objekty.',
  'storage.field.endpoint': 'URL koncového bodu',
  'storage.help.endpoint':
    'Základná URL služby kompatibilnej s S3, napr. https://s3.example.com alebo http://127.0.0.1:9000.',
  'storage.field.bucket': 'Bucket', // same-as-en
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
  'storage.backends.envReadOnly': 'Definované premennou prostredia (iba na čítanie)',
  'storage.source.built-in': 'Vstavané',
  'storage.source.env': 'Prostredie',
  'storage.source.settings': 'Nastavenia',
  'storage.type.local': 'Miestne',
  'storage.type.s3': 'S3',
  'storage.type.mirror': 'Zrkadlo',
  'storage.actions.test': 'Test', // same-as-en
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
  'storage.usage.line': '{count} objektov · {size}',
  'storage.usage.line.one': '{count} objekt · {size}',
  'storage.usage.line.few': '{count} objekty · {size}',
  'storage.usage.computed': 'Využitie vypočítané {age}',
  'storage.usage.never': 'Využitie ešte nebolo vypočítané',
  'storage.usage.refresh': 'Obnoviť',
  'storage.usage.compute': 'Vypočítať teraz',
  'storage.usage.legacyNote': 'zahŕňa staršiu knižnicu fotiek',

  // Category migration (copy → flip → delta sweep)
  'storage.migrate.promptTitle': 'Presunúť existujúce objekty do nového backendu?',
  'storage.migrate.promptLine': '{category}: {count} objektov ({size}) z {from} do {to}',
  'storage.migrate.promptLine.one': '{category}: {count} objekt ({size}) z {from} do {to}',
  'storage.migrate.promptLine.few': '{category}: {count} objekty ({size}) z {from} do {to}',
  'storage.migrate.promptLineUnknown': '{category}: neznáma veľkosť (využitie ešte nebolo vypočítané) z {from} do {to}',
  'storage.migrate.move': 'Presunúť existujúce objekty',
  'storage.migrate.routeOnly': 'Iba smerovať nové zápisy',
  'storage.migrate.running': 'Presúva sa {category}… {done}/{total}',
  'storage.migrate.done': 'Presun dokončený: {copied} skopírovaných, {skipped} preskočených',
  'storage.migrate.doneFailures': '{failed} zlyhalo — tieto objekty neboli skopírované do nového backendu',
  'storage.migrate.failed': 'Presun zlyhal: {error} — kategória nebola prepnutá',
  'storage.migrate.cancelled': 'Presun zrušený — nič nebolo prepnuté',
  'storage.migrate.reclaimable': '{count} objektov ({size}) zostáva na {from}, uvoľnite ručne',
  'storage.migrate.reclaimable.one': '{count} objekt ({size}) zostáva na {from}, uvoľnite ručne',
  'storage.migrate.reclaimable.few': '{count} objekty ({size}) zostávajú na {from}, uvoľnite ručne',
  'storage.migrate.cancel': 'Zrušiť presun',
  'storage.migrate.promptCancel': 'Zrušiť',
  'storage.migrate.queued': 'V poradí: {categories}',
  'storage.migrate.queueDropped': 'Nepodarilo sa spustiť ďalší presun — zvyšné poradie bolo vymazané: {categories}',
  'storage.reclaim.title': 'Nepoužívané súbory',
  'storage.reclaim.hint':
    'TREK každú noc hľadá nahrané súbory, ktoré už nepoužíva žiadna cesta, miesto, denník, kolekcia ani používateľ, napríklad po odstránení cesty.',
  'storage.reclaim.check': 'Skontrolovať teraz',
  'storage.reclaim.checked': 'Posledná kontrola: {age}',
  'storage.reclaim.never': 'Ešte neskontrolované',
  'storage.reclaim.delete': 'Odstraňovať nepoužívané súbory',
  'storage.reclaim.deleteHint':
    'Vypnuté: nočná kontrola len hlási. Zapnuté: súbor, ktorý týždeň nikto nepoužil, sa odstráni. Súbory, ktoré odstránite v TREK, sa v oboch prípadoch odstránia o deň neskôr, keď ich už nemožno vrátiť späť.',
  'storage.reclaim.freeable': 'Možno uvoľniť',
  'storage.reclaim.waiting': 'Nepoužité menej ako týždeň',
  'storage.reclaim.deleted': 'Uvoľnené pri poslednom nočnom čistení',
  'storage.reclaim.nothing': 'Nenašli sa žiadne nepoužívané súbory.',
  'storage.reclaim.stopped': 'Posledná kontrola sa predčasne zastavila, pretože sa počas jej behu obnovila databáza.',
  'storage.reclaim.skip.sources_missing': 'Preskočené: nebolo možné sa opýtať každej časti TREK',
  'storage.reclaim.skip.shared_location': 'Preskočené: zdieľa umiestnenie s inou kategóriou',
  'storage.reclaim.skip.list_failed': 'Preskočené: súbory sa nepodarilo vypísať',
  'storage.reclaim.skip.source_failed': 'Preskočené: vyhľadávanie zlyhalo',
  'storage.reclaim.running': 'Kontroluje sa…',
  'storage.reclaim.stoppedFailed': 'Posledná kontrola sa zastavila po chybe. Dnes v noci sa spustí znova.',
  'storage.reclaim.skip.foreign_install': 'Preskočené: toto úložisko používa iná inštalácia TREK',
  'storage.reclaim.skip.owner_unknown': 'Preskočené: TREK nemohol označiť toto úložisko ako svoje',
  'storage.reclaim.skip.delete_failed': 'Zastavené: úložisko odmietlo odstránenie',
  'storage.reclaim.skip.interrupted': 'Zastavené pred dokončením, údaje sú neúplné',
  'storage.reclaim.confirmNeeded':
    'Viac ako pätina týchto súborov vyzerá ako nepoužívaná. Nič tu nebude odstránené, kým nepotvrdíte, že je to očakávané.',
  'storage.reclaim.confirm': 'Potvrdiť',
  'storage.reclaim.confirmed': 'Potvrdené na ďalších 14 dní.',
  'storage.reclaim.error.reclaim_busy': 'Beží iná úloha úložiska. Skúste to o chvíľu znova.',
  'storage.reclaim.error.reclaim_demo': 'Nie je dostupné v demo inštancii.',
  'storage.reclaim.error.reclaim_nothing_to_confirm': 'Už nie je čo potvrdzovať. Najprv spustite kontrolu.',
  'storage.reclaim.skip.backup_running': 'Preskočené: bežala záloha',
  'storage.reclaim.error.reclaim_confirm_stale':
    'Počet sa od zobrazenia zmenil. Skontrolujte nový údaj a potvrďte znova.',
  'storage.reclaim.error.reclaim_install_unknown':
    'TREK nemohol prečítať ID svojej inštalácie, preto nič neodstraňuje. Skontrolujte priečinok s dátami.',
};
export default storage;
