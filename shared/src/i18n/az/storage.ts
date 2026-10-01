import type { TranslationStrings } from '../types';

const storage: TranslationStrings = {
  // Field labels/help — these keys are pinned by STORAGE_BACKEND_TYPES in
  // @trek/shared (labelKey/helpKey); renaming one breaks the admin form.
  'storage.field.root': 'Kök qovluq',
  'storage.help.root': 'Bu saxlama sisteminin obyektləri saxladığı serverdəki mütləq yol.',
  'storage.field.endpoint': 'Son nöqtə URL-si',
  'storage.help.endpoint':
    'S3 uyğun xidmətin əsas URL-si, məsələn, https://s3.example.com və ya http://127.0.0.1:9000.',
  'storage.field.bucket': 'Bucket',
  'storage.field.accessKeyId': 'Giriş açarı ID-si',
  'storage.field.secretAccessKey': 'Gizli giriş açarı',
  'storage.field.region': 'Region',
  'storage.help.region': 'Provayderiniz xüsusi region tələb etmirsə, standart dəyəri saxlayın.',
  'storage.field.keyPrefix': 'Açar prefiksi',
  'storage.help.keyPrefix': 'Hər obyekt açarına əlavə edilən istəyə bağlı prefiks, məsələn, trek/prod.',
  'storage.field.retries': 'Təkrar cəhdlər',
  'storage.field.timeoutMs': 'Vaxt limiti (ms)',
  'storage.field.primary': 'Əsas saxlama sistemi',
  'storage.field.replicas': 'Replikalar',
  // Panel chrome
  'storage.title': 'Saxlama',
  'storage.description':
    'TREK-in yüklənmiş faylları, fotoları və ehtiyat nüsxələri saxladığı yer. Yadda saxlamayana qədər heç nə dəyişmir.',
  'storage.loading': 'Yüklənir…',
  'storage.saved': 'Saxlama konfiqurasiyası yadda saxlanıldı',
  'storage.save': 'Dəyişiklikləri yadda saxla',
  'storage.unsaved': 'Yadda saxlanılmamış dəyişikliklər',
  'storage.saveConflict':
    'Saxlama tənzimləmələri siz onları yüklədikdən sonra dəyişdirilib, buna görə dəyişiklikləriniz yadda saxlanılmadı. Yenidən başlamaq üçün dəyişikliklərinizi ləğv edin və yadda saxlanılmış tənzimləmələri yenidən yükləyin.',
  'storage.discardAndReload': 'Dəyişikliklərimi ləğv et və yenidən yüklə',
  'storage.configError.banner':
    'Yadda saxlanılmış saxlama tənzimləmələrini yükləmək mümkün olmadı — yadda saxlamaq onları əvəz edəcək: {error}',
  // Backends list
  'storage.backends.title': 'Saxlama sistemləri',
  'storage.backends.add': 'Saxlama sistemi əlavə et',
  'storage.backends.usedBy': 'İstifadə edənlər: {categories}',
  'storage.backends.unused': 'Heç bir kateqoriyaya təyin edilməyib',
  'storage.backends.envReadOnly': 'Mühit dəyişəni ilə müəyyən edilib — yalnız oxumaq mümkündür',
  'storage.source.built-in': 'Daxili',
  'storage.source.env': 'Mühit',
  'storage.source.settings': 'Tənzimləmələr',
  'storage.type.local': 'Yerli',
  'storage.type.s3': 'S3',
  'storage.type.mirror': 'Güzgü',
  'storage.actions.test': 'Sına',
  'storage.actions.edit': 'Redaktə et',
  'storage.actions.remove': 'Sil',
  // Test-connection results
  'storage.test.running': 'Sınaqdan keçirilir…',
  'storage.test.ok': 'Bağlantı qaydasındadır',
  'storage.test.failed': 'Sınaq uğursuz oldu',
  // Remove pre-check (friendly message; the server stays authoritative)
  'storage.remove.title': 'Saxlama sistemini sil',
  'storage.remove.body':
    '{name} konfiqurasiyadan silinsin? Hələ də ondan asılı olan nəsə varsa, server yadda saxlama əməliyyatını rədd edəcək.',
  'storage.remove.stillAssigned': 'Hələ də bunlara təyin edilib: {categories}',
  // Backend form
  'storage.form.addTitle': 'Saxlama sistemi əlavə et',
  'storage.form.editTitle': 'Saxlama sistemini redaktə et',
  'storage.form.name': 'Ad',
  'storage.form.type': 'Növ',
  'storage.form.apply': 'Tətbiq et',
  'storage.form.cancel': 'Ləğv et',
  'storage.form.duplicateName': '{name} adlı saxlama sistemi artıq mövcuddur',
  // Category map
  'storage.categories.title': 'Kateqoriyalar',
  'storage.categories.default': 'standart',
  'storage.categories.reassignWarning':
    'Mövcud obyektlər köçürülmür: yeni obyektlər yeni təyin edilmiş saxlama sisteminə göndərilir, köhnələr isə olduqları yerdə qalır.',
  'storage.category.files': 'Səyahət sənədləri',
  'storage.category.journey': 'Səyahət gündəliyinin fotoları',
  'storage.category.covers': 'Üzlük şəkilləri',
  'storage.category.avatars': 'Profil şəkilləri',
  'storage.category.places': 'Məkan şəkilləri',
  'storage.category.photos-google': 'Google foto keşi',
  'storage.category.photos-trek': 'TREK foto keşi',
  'storage.category.backups': 'Ehtiyat nüsxələr',
  // What each category stores — rendered under the label in the category map.
  'storage.categoryDesc.files':
    'Səyahətlərə yüklənən fayl əlavələri — biletlər, PDF-lər, rezervasiya təsdiqləri və səyahət çatında paylaşılan fayllar.',
  'storage.categoryDesc.journey':
    'Səyahət gündəliyi qeydlərinə əlavə edilmiş fotolar və kiçik təsvirlər.',
  'storage.categoryDesc.covers':
    'Unsplash-dan əldə edilən üzlüklər daxil olmaqla, səyahət və kolleksiya üzlük şəkilləri.',
  'storage.categoryDesc.avatars': 'İstifadəçi hesablarının profil şəkilləri.',
  'storage.categoryDesc.places':
    'Məkanlara və kolleksiya məkanlarına əlavə edilmiş şəkillər — yüklənmiş və ya idxal edilmiş.',
  'storage.categoryDesc.photos-google':
    'Google Places fotolarının keşlənmiş nüsxələri — yenidən əldə edilə bilər, itirilməsi təhlükəsizdir.',
  'storage.categoryDesc.photos-trek':
    'Xatirələr bölməsində istifadə edilən TREK foto xidmətindən keşlənmiş fotolar — yenidən əldə edilə bilər, itirilməsi təhlükəsizdir.',
  'storage.categoryDesc.backups':
    'Ehtiyat nüsxə paneli və ya cədvəl vasitəsilə yaradılmış server ehtiyat nüsxəsi arxivləri.',
  // Health strip
  'storage.health.title': 'Vəziyyət',
  'storage.health.allClear': 'Heç bir replika xətası qeydə alınmayıb.',
  'storage.health.seedFile':
    'storage-config.json başlanğıc faylı mövcuddur, lakin nəzərə alınmır — konfiqurasiya qeydləri artıq mövcuddur. Saxlamanı buradan idarə edin.',
  'storage.health.failureLine': '{backend} üzərində {key} üçün {op} uğursuz oldu: {error}',
  // Replicas-on-primary mirror UX (2026-08-20 spec)
  'storage.mirror.targets': 'Güzgü hədəfləri',
  'storage.mirror.targetsHelp':
    'Bu saxlama sisteminə edilən hər yazma əməliyyatı seçilmiş hər hədəfə də kopyalanır.',
  'storage.mirror.latencyNote':
    'Hər yükləmə zamanı replikalar bir-birinin ardınca yazılır — yavaş və ya əlçatmaz hədəf bu saxlama sistemindəki bütün kateqoriyaların hər yükləməsini ləngidir.',
  'storage.mirror.mirroredTo': 'Güzgüləndiyi hədəflər: {targets}',
  'storage.mirror.replicaOf': 'Bunların replikasıdır: {primaries}',
  'storage.mirror.cacheWarning':
    'Tövsiyə edilmir: bu kateqoriya yenidən əldə edilə bilən məzmun saxlayır — onun replikasını yaratmaq adətən lazımsızdır.',
  'storage.mirror.degenerate.duplicate-mirror':
    'İkinci güzgü {primary} sistemini əhatə edir — panel yalnız birincini idarə edir; güzgüləməni {primary} üzərindən idarə etmək üçün bunu silin.',
  'storage.mirror.degenerate.env-primary':
    'Mühit dəyişəni ilə müəyyən edilmiş saxlama sistemini əhatə edir — burada redaktə edilə bilməz.',
  'storage.mirror.degenerate.missing-primary':
    'Artıq mövcud olmayan saxlama sisteminə istinad edir.',
  'storage.remove.usedAsReplicaBy': 'Bunlar tərəfindən replika kimi istifadə edilir: {primaries}',
  // Backfill + usage (backfill/stats/notifications spec)
  'storage.sync.now': 'İndi sinxronlaşdır',
  'storage.sync.running': 'Sinxronlaşdırılır… {done}/{total}',
  'storage.sync.counts': '{copied} kopyalandı · {skipped} ötürüldü · {failed} uğursuz oldu',
  'storage.sync.cancel': 'Sinxronlaşdırmanı ləğv et',
  'storage.sync.done':
    'Sinxronlaşdırma tamamlandı: {copied} kopyalandı, {deleted} silindi, {failed} uğursuz oldu',
  'storage.sync.cancelled': 'Sinxronlaşdırma ləğv edildi',
  'storage.sync.error': 'Sinxronlaşdırma uğursuz oldu: {error}',
  'storage.sync.prompt': 'Mövcud obyektlərin replikası hələ yaradılmayıb — indi sinxronlaşdırılsın?',
  'storage.sync.dismiss': 'Bağla',
  'storage.usage.line': '{objects} obyekt · {size}',
  'storage.usage.computed': 'İstifadə {age} hesablanıb',
  'storage.usage.never': 'İstifadə hələ hesablanmayıb',
  'storage.usage.refresh': 'Yenilə',
  'storage.usage.compute': 'İndi hesabla',
  'storage.usage.legacyNote': 'köhnə foto kitabxanası daxildir',
  // Category migration (copy → flip → delta sweep)
  'storage.migrate.promptTitle': 'Mövcud obyektlər yeni saxlama sisteminə köçürülsün?',
  'storage.migrate.promptLine':
    '{category}: {from} sistemindən {to} sisteminə {objects} obyekt ({size})',
  'storage.migrate.promptLineUnknown':
    '{category}: {from} sistemindən {to} sisteminə naməlum ölçü (istifadə hələ skan edilməyib)',
  'storage.migrate.move': 'Mövcud obyektləri köçür',
  'storage.migrate.routeOnly': 'Yalnız yeni yazmaları yönləndir',
  'storage.migrate.running': '{category} köçürülür… {done}/{total}',
  'storage.migrate.done': 'Köçürmə tamamlandı: {copied} kopyalandı, {skipped} ötürüldü',
  'storage.migrate.doneFailures':
    '{failed} uğursuz oldu — həmin obyektlər yeni saxlama sisteminə kopyalanmadı',
  'storage.migrate.failed':
    'Köçürmə uğursuz oldu: {error} — kateqoriya dəyişdirilmədi',
  'storage.migrate.cancelled': 'Köçürmə ləğv edildi — heç nə dəyişdirilmədi',
  'storage.migrate.reclaimable':
    '{objects} obyekt ({size}) {from} üzərində qalıb — əl ilə geri qazanın',
  'storage.migrate.cancel': 'Köçürməni ləğv et',
  'storage.migrate.promptCancel': 'Ləğv et',
  'storage.migrate.queued': 'Növbədədir: {categories}',
  'storage.migrate.queueDropped':
    'Növbəti köçürməni başlatmaq mümkün olmadı — qalan növbə təmizləndi: {categories}',
};

export default storage;