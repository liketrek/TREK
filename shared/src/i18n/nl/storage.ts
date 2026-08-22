import type { TranslationStrings } from '../types';

const storage: TranslationStrings = {
  'storage.field.root': 'Hoofdmap',
  'storage.help.root': 'Absoluut pad op de server waar deze backend zijn objecten opslaat.',
  'storage.field.endpoint': 'Endpoint-URL',
  'storage.help.endpoint':
    'Basis-URL van de S3-compatibele service, bijv. https://s3.example.com of http://127.0.0.1:9000.',
  'storage.field.bucket': 'Bucket',
  'storage.field.accessKeyId': 'Toegangssleutel-ID',
  'storage.field.secretAccessKey': 'Geheime toegangssleutel',
  'storage.field.region': 'Regio',
  'storage.help.region': 'Laat de standaard staan tenzij je provider een specifieke regio vereist.',
  'storage.field.keyPrefix': 'Sleutelvoorvoegsel',
  'storage.help.keyPrefix': 'Optioneel voorvoegsel toegevoegd aan elke objectsleutel, bijv. trek/prod.',
  'storage.field.retries': 'Nieuwe pogingen',
  'storage.field.timeoutMs': 'Time-out (ms)',
  'storage.field.primary': 'Primaire backend',
  'storage.field.replicas': "Replica's",
  'storage.title': 'Opslag',
  'storage.description':
    "Waar TREK geüploade bestanden, foto's en back-ups bewaart. Er verandert niets totdat je opslaat.",
  'storage.loading': 'Laden…',
  'storage.saved': 'Opslagconfiguratie opgeslagen',
  'storage.save': 'Wijzigingen opslaan',
  'storage.unsaved': 'Niet-opgeslagen wijzigingen',
  'storage.saveConflict':
    'De opslagconfiguratie is gewijzigd sinds deze werd geladen, dus je wijzigingen zijn niet opgeslagen. Verwerp ze en laad de opgeslagen instellingen opnieuw om opnieuw te beginnen.',
  'storage.discardAndReload': 'Mijn wijzigingen verwerpen en opnieuw laden',
  'storage.configError.banner':
    'Het laden van de opgeslagen opslaginstellingen is mislukt — opslaan zal ze vervangen: {error}',
  'storage.backends.title': 'Backends',
  'storage.backends.add': 'Backend toevoegen',
  'storage.backends.usedBy': 'Gebruikt door: {categories}',
  'storage.backends.unused': 'Niet toegewezen aan een categorie',
  'storage.backends.envReadOnly': 'Gedefinieerd door een omgevingsvariabele — alleen-lezen',
  'storage.source.built-in': 'Ingebouwd',
  'storage.source.env': 'Omgeving',
  'storage.source.settings': 'Instellingen',
  'storage.type.local': 'Lokaal',
  'storage.type.s3': 'S3',
  'storage.type.mirror': 'Mirror',
  'storage.actions.test': 'Testen',
  'storage.actions.edit': 'Bewerken',
  'storage.actions.remove': 'Verwijderen',
  'storage.test.running': 'Bezig met testen…',
  'storage.test.ok': 'Verbinding OK',
  'storage.test.failed': 'Test mislukt',
  'storage.remove.title': 'Backend verwijderen',
  'storage.remove.body':
    '{name} verwijderen uit de configuratie? De server weigert het opslaan als er nog iets van afhankelijk is.',
  'storage.remove.stillAssigned': 'Nog toegewezen aan: {categories}',
  'storage.form.addTitle': 'Backend toevoegen',
  'storage.form.editTitle': 'Backend bewerken',
  'storage.form.name': 'Naam',
  'storage.form.type': 'Type',
  'storage.form.apply': 'Toepassen',
  'storage.form.cancel': 'Annuleren',
  'storage.form.duplicateName': 'Er bestaat al een backend met de naam {name}',
  'storage.categories.title': 'Categorieën',
  'storage.categories.default': 'standaard',
  'storage.categories.reassignWarning':
    'Bestaande objecten worden niet verplaatst: nieuwe objecten gaan naar de nieuw toegewezen backend, oude blijven waar ze zijn.',
  'storage.category.files': 'Reisdocumenten',
  'storage.category.journey': "Reisverslag-foto's",
  'storage.category.covers': 'Omslagafbeeldingen',
  'storage.category.avatars': "Profielfoto's",
  'storage.category.places': 'Locatieafbeeldingen',
  'storage.category.photos-google': 'Google-fotocache',
  'storage.category.photos-trek': 'TREK-fotocache',
  'storage.category.backups': 'Back-ups',

  // What each category stores — rendered under the label in the category map.
  'storage.categoryDesc.files':
    "Bestandsbijlagen die naar reizen zijn geüpload — tickets, PDF's, boekingsbevestigingen en bestanden gedeeld in de reischat.",
  'storage.categoryDesc.journey': "Foto's en miniaturen die zijn gekoppeld aan reisverslag-items.",
  'storage.categoryDesc.covers':
    'Omslagafbeeldingen van reizen en collecties, inclusief omslagen opgehaald van Unsplash.',
  'storage.categoryDesc.avatars': "Profielfoto's van gebruikersaccounts.",
  'storage.categoryDesc.places': 'Afbeeldingen gekoppeld aan locaties en collectielocaties — geüpload of geïmporteerd.',
  'storage.categoryDesc.photos-google':
    "Gecachte kopieën van Google Places-foto's — opnieuw op te halen, veilig om te verliezen.",
  'storage.categoryDesc.photos-trek':
    "Gecachte foto's van de TREK-fotoservice die wordt gebruikt door Foto's (Memories) — opnieuw op te halen, veilig om te verliezen.",
  'storage.categoryDesc.backups': 'Serverback-uparchieven aangemaakt door het back-uppaneel of de planning.',
  'storage.health.title': 'Status',
  'storage.health.allClear': 'Geen replicafouten geregistreerd.',
  'storage.health.seedFile':
    'Er is een storage-config.json seedbestand aanwezig maar dit wordt genegeerd — configuratierijen bestaan al. Beheer de opslag hier.',
  'storage.health.failureLine': '{op} van {key} op {backend} mislukt: {error}',

  // Replicas-on-primary mirror UX (2026-08-20 spec)
  'storage.mirror.targets': 'Mirrordoelen',
  'storage.mirror.targetsHelp': 'Elke schrijfactie naar deze backend wordt ook gekopieerd naar elk geselecteerd doel.',
  'storage.mirror.latencyNote':
    "Replica's worden bij elke upload één voor één geschreven — een traag of onbereikbaar doel vertraagt elke upload van elke categorie op deze backend.",
  'storage.mirror.mirroredTo': 'Gespiegeld naar: {targets}',
  'storage.mirror.replicaOf': 'Replica van: {primaries}',
  'storage.mirror.cacheWarning':
    'Niet aanbevolen: deze categorie bevat opnieuw ophaalbare inhoud — repliceren is meestal verspilling.',
  'storage.mirror.degenerate.duplicate-mirror':
    'Een tweede mirror omhult {primary} — het paneel beheert alleen de eerste; verwijder deze om spiegeling vanaf {primary} te beheren.',
  'storage.mirror.degenerate.env-primary':
    'Omhult een backend die door een omgevingsvariabele is gedefinieerd — hier niet bewerkbaar.',
  'storage.mirror.degenerate.missing-primary': 'Verwijst naar een backend die niet meer bestaat.',
  'storage.remove.usedAsReplicaBy': 'Gebruikt als replica door: {primaries}',

  // Backfill + usage (backfill/stats/notifications spec)
  'storage.sync.now': 'Nu synchroniseren',
  'storage.sync.running': 'Synchroniseren… {done}/{total}',
  'storage.sync.counts': '{copied} gekopieerd · {skipped} overgeslagen · {failed} mislukt',
  'storage.sync.cancel': 'Synchronisatie annuleren',
  'storage.sync.done': 'Synchronisatie voltooid: {copied} gekopieerd, {deleted} verwijderd, {failed} mislukt',
  'storage.sync.cancelled': 'Synchronisatie geannuleerd',
  'storage.sync.error': 'Synchronisatie mislukt: {error}',
  'storage.sync.prompt': 'Bestaande objecten zijn nog niet gerepliceerd — nu synchroniseren?',
  'storage.sync.dismiss': 'Negeren',
  'storage.usage.line': '{objects} objecten · {size}',
  'storage.usage.computed': 'Gebruik berekend {age}',
  'storage.usage.never': 'Gebruik nog niet berekend',
  'storage.usage.refresh': 'Vernieuwen',
  'storage.usage.compute': 'Nu berekenen',
  'storage.usage.legacyNote': 'inclusief de oude fotobibliotheek',

  // Category migration (copy → flip → delta sweep)
  'storage.migrate.promptTitle': 'Bestaande objecten naar de nieuwe backend verplaatsen?',
  'storage.migrate.promptLine': '{category}: {objects} objecten ({size}) van {from} naar {to}',
  'storage.migrate.promptLineUnknown': '{category}: onbekende grootte (gebruik nog niet gescand) van {from} naar {to}',
  'storage.migrate.move': 'Bestaande objecten verplaatsen',
  'storage.migrate.routeOnly': 'Alleen nieuwe schrijfacties omleiden',
  'storage.migrate.running': '{category} verplaatsen… {done}/{total}',
  'storage.migrate.done': 'Verplaatsen voltooid: {copied} gekopieerd, {skipped} overgeslagen',
  'storage.migrate.doneFailures': '{failed} mislukt — die objecten zijn niet gekopieerd naar de nieuwe backend',
  'storage.migrate.failed': 'Verplaatsen mislukt: {error} — de categorie is niet omgezet',
  'storage.migrate.cancelled': 'Verplaatsen geannuleerd — er is niets omgezet',
  'storage.migrate.reclaimable': '{objects} objecten ({size}) blijven op {from} — handmatig terugwinnen',
  'storage.migrate.cancel': 'Verplaatsen annuleren',
  'storage.migrate.promptCancel': 'Annuleren',
  'storage.migrate.queued': 'In wachtrij: {categories}',
  'storage.migrate.queueDropped': 'Kon de volgende verplaatsing niet starten — de resterende wachtrij is gewist: {categories}',
};
export default storage;
