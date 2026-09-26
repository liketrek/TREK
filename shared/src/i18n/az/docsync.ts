import type { TranslationStrings } from '../types';

const docsync: TranslationStrings = {
  'docsync.title': 'Sənəd sinxronizasiyası',
  'docsync.noProviders': 'Heç bir sənəd provayderi mövcud deyil',
  'docsync.noProvidersHint':
    'Sistem administratoru bunları İdarəetmə → Əlavələr → Sənədlər bölməsində aktivləşdirir.',
  'docsync.addProvider': 'Provayder qoş',
  'docsync.test': 'Bağlantını sına',
  'docsync.connect.optional': 'İstəyə bağlı',
  'docsync.connected': 'Qoşulub',
  'docsync.chooseFolder': 'Qovluq seç',
  'docsync.noFolders': 'Bu sistemdə hələ heç nə tapılmadı.',
  'docsync.newFolderPlaceholder': 'Yeni qovluğun adı',
  'docsync.syncNow': 'İndi sinxronlaşdır',
  'docsync.unlink': 'Bağlantını kəs',
  'docsync.confirmUnlink':
    'Sənədlər TREK-də və saxlama xidmətində qalacaq. Yalnız onların arasındakı əlaqə silinəcək.',
  'docsync.syncEnabled': 'Avtomatik sinxronlaşdır',
  'docsync.deletePolicy': 'Sənəd silindikdə',
  'docsync.deleteUnlink': 'Hər iki nüsxəni saxla',
  'docsync.deleteTrash': 'Zibil qutusuna köçür',
  'docsync.conflictPolicy': 'Hər iki tərəf dəyişdikdə',
  'docsync.onConflict.manual': 'Məndən soruş',
  'docsync.onConflict.trek_wins': 'TREK nüsxəsini saxla',
  'docsync.onConflict.provider_wins': 'Saxlama xidmətindəki nüsxəni saxla',
  'docsync.webhookHint':
    'Dəyişikliklərin dərhal çatması üçün bu URL-ni provayderinizə daxil edin. Bu edilmədikdə TREK müəyyən vaxt intervalları ilə yoxlayır.',

  // Connection form fields. The keys mirror the `label` column in
  // document_provider_fields, which stores a key suffix rather than text.
  'docsync.providerUrl': 'Ünvan',
  'docsync.providerApiToken': 'API tokeni',
  'docsync.providerApiKey': 'API açarı',
  'docsync.providerAppPassword': 'Tətbiq parolu',
  'docsync.providerAppToken': 'Tətbiq tokeni',
  'docsync.providerUsername': 'İstifadəçi adı',
  'docsync.providerPassword': 'Parol',
  'docsync.providerOrganization': 'Təşkilat ID-si',
  'docsync.providerBasePath': 'Əsas qovluq',
  'docsync.providerOTP': 'İki faktorlu doğrulama kodu',
  'docsync.allowInsecureTls': 'Öz-özünə imzalanmış sertifikatı qəbul et',

  'docsync.hintPaperlessToken':
    'Paperless-də Profilim bölməsindən yaradın. Token həmin hesabın bütün hüquqlarını daşıyır.',
  'docsync.hintPapraKey':
    'Papra-da API açarları bölməsindən yaradın. Papra açarları üzv olduğunuz bütün təşkilatlara həmişə giriş əldə edir.',
  'docsync.hintPapraOrg': 'Papra ünvan sətrindəki org_… ID-si.',
  'docsync.hintNextcloudLogin': 'E-poçt ünvanınız deyil, Nextcloud giriş adınız.',
  'docsync.hintNextcloudAppPassword':
    'Tənzimləmələr → Təhlükəsizlik → Yeni tətbiq parolu yarat. Hesab parolunuzu heç vaxt istifadə etməyin.',
  'docsync.hintOpenCloudToken': 'OpenCloud-da tətbiq tokenləri bölməsindən yaradılır.',
  'docsync.hintBasePath': 'TREK-in səyahət qovluqlarını axtardığı yer. Standart olaraq /TREK.',
  'docsync.hintSynologyUrl':
    'Portu da daxil edin, məsələn, https://nas.example.com:5001',
  'docsync.hintSynologyUser':
    'Yalnız bu paylaşılan qovluğa giriş icazəsi olan ayrıca DSM hesabından istifadə etmək daha yaxşıdır.',
  'docsync.hintSynologyOtp':
    'Hesab iki faktorlu doğrulamadan istifadə edirsə, yalnız bir dəfə tələb olunur.',

  'docsync.linkState.never': 'Hələ sinxronlaşdırılmayıb',
  'docsync.linkState.ok': 'Sinxronlaşdırılıb',
  'docsync.linkState.partial': 'Qismən sinxronlaşdırılıb',
  'docsync.linkState.failed': 'Uğursuz oldu',
  'docsync.linkState.needs_reauth': 'Yenidən daxil olun',
  'docsync.linkState.scope_lost': 'Qovluq artıq mövcud deyil',
  'docsync.linkState.orphaned': 'Sahib səyahətdən ayrılıb',

  'docsync.state.pending': 'Gözləyir',
  'docsync.state.synced': 'Sinxronlaşdırılıb',
  'docsync.state.conflict': 'Ziddiyyət',
  'docsync.state.rejected_type': 'Fayl növünə icazə verilmir',
  'docsync.state.too_large': 'Həddindən artıq böyükdür',
  'docsync.state.error': 'Xəta',
  'docsync.state.remote_missing': 'Provayderdə yoxdur',
  'docsync.state.local_deleted': 'TREK-də silinib',
  'docsync.state.scope_drift': 'Qovluqdan kənara köçürülüb',

  'docsync.conflict.resolve': '{count} ziddiyyəti həll et',

  'docsync.conflict.title': 'Hər iki nüsxə dəyişdirilib',
  'docsync.conflict.keepTrek': 'TREK versiyasını saxla',
  'docsync.conflict.keepProvider': 'Provayder versiyasını saxla',
  'docsync.conflict.keepBoth': 'Hər ikisini saxla',

  // Failure reasons travel as codes, never as upstream text: a provider answers
  // in English, or with a proxy's HTML login page, and neither belongs here.
  'docsync.error.unreachable': 'Provayderə qoşulmaq mümkün olmadı.',
  'docsync.error.tls_untrusted':
    'Sertifikat rədd edildi. Bu sistemə etibar edirsinizsə, öz-özünə imzalanmış sertifikatlara icazə verin.',
  'docsync.error.unauthorized': 'Giriş məlumatları qəbul edilmədi.',
  'docsync.error.forbidden': 'Bu hesabın həmin əməliyyatı yerinə yetirməsinə icazə verilmir.',
  'docsync.error.not_found': 'Provayderdə tapılmadı.',
  'docsync.error.scope_missing': 'Qoşulmuş qovluq artıq mövcud deyil.',
  'docsync.error.rate_limited':
    'Provayder sorğu tezliyini məhdudlaşdırır. TREK daha sonra yenidən cəhd edəcək.',
  'docsync.error.too_large': 'Fayl provayderin qəbul etdiyi ölçüdən böyükdür.',
  'docsync.error.unsupported_type': 'Provayder bu fayl növünü qəbul etmir.',
  'docsync.error.quota_exceeded': 'Provayderdə boş yer qalmayıb.',
  'docsync.error.conflict': 'Sənəd hər iki tərəfdə dəyişdirilib.',
  'docsync.error.checksum_mismatch': 'Fayl ötürülmə zamanı bütöv çatmayıb.',
  'docsync.error.provider_error': 'Provayder xəta bildirdi.',
  'docsync.error.timeout': 'Provayderin cavabı həddindən artıq gecikdi.',
  'docsync.error.ssrf_blocked': 'Bu ünvana icazə verilmir.',
  'docsync.error.mass_delete_guard':
    'Sənədlərin əksəriyyəti eyni anda yoxa çıxdığı üçün heç nə dəyişdirilmədi. Qovluğun hələ də qoşulu olduğunu yoxlayın.',
  'docsync.error.unknown': 'Nəsə yanlış getdi.',

  // ── The dialog ─────────────────────────────────────────────────────────────
  'docsync.sidebar.connected': 'Bu səyahət',
  'docsync.addAnother': 'Başqa provayder əlavə et',
  'docsync.syncing': 'Sinxronlaşdırılır',
  'docsync.card.pickFolder': 'Qoşulub, qovluq seçin',

  'docsync.empty.title': 'Hələ heç nə qoşulmayıb',
  'docsync.empty.hintOwner':
    'Soldan saxlama xidməti seçin. TREK hər şeyin öz nüsxəsini saxlayır, buna görə xidmət yoxa çıxsa belə heç nə itmir.',
  'docsync.empty.hintMember':
    'Bunu səyahətin sahibi quraşdırır. Hər bir halda sənədlər TREK-də qalır.',

  // How each product files things. Shown before anyone connects, because it is
  // what the next screen will ask for.
  'docsync.model.paperless': 'Etiket üzrə fayllar',
  'docsync.model.papra': 'Təşkilat daxilində etiket üzrə fayllar',
  'docsync.model.nextcloud': 'Qovluqdakı fayllar',
  'docsync.model.opencloud': 'Məkandakı fayllar',
  'docsync.model.synologydrive': 'NAS-dakı qovluqda yerləşən fayllar',

  // ── The flow bar ───────────────────────────────────────────────────────────
  'docsync.flow.trek': 'TREK',
  'docsync.flow.toProvider': 'Saxlama xidmətinə',
  'docsync.flow.toTrek': 'Saxlama xidmətindən',
  'docsync.flow.documents': 'sənəd',
  'docsync.flow.summary.both': 'Sənədlər hər iki istiqamətdə ötürülür.',
  'docsync.flow.summary.pull': 'Sənədlər yalnız daxil olur.',
  'docsync.flow.summary.push': 'Sənədlər yalnız xaricə göndərilir.',
  'docsync.flow.summaryEditable.both':
    'Hər iki istiqamətdə ötürülür. Dayandırmaq üçün istiqamətlərdən birinə toxunun.',
  'docsync.flow.summaryEditable.pull':
    'Yalnız daxil olur. Xaricə də göndərmək üçün digər istiqamətə toxunun.',
  'docsync.flow.summaryEditable.push':
    'Yalnız xaricə göndərilir. Daxil də etmək üçün digər istiqamətə toxunun.',

  // ── One binding ────────────────────────────────────────────────────────────
  'docsync.binding.settings': 'Tənzimləmələr',
  'docsync.binding.folder': 'Qovluq',
  'docsync.binding.lastRun': 'Son icra',
  'docsync.binding.autoOff': 'Dayandırılıb',
  'docsync.binding.neverRun': 'hələ icra edilməyib',
  'docsync.binding.deleteHint': 'Digər tərəfdəki nüsxəyə nə ediləcəyi.',
  'docsync.binding.conflictHint':
    'Sənəd hər iki yerdə redaktə edildikdə hansı nüsxənin saxlanılacağı.',
  'docsync.binding.autoHint': 'Arxa fonda dəyişiklikləri yoxla.',
  'docsync.binding.webhookTitle': 'Ani yeniləmələr',
  'docsync.binding.copy': 'Kopyala',
  'docsync.binding.copied': 'Kopyalandı',

  // ── Connecting ─────────────────────────────────────────────────────────────
  'docsync.connect.submit': 'Qoşul',
  'docsync.connect.testing': 'Qoşulmağa cəhd edilir',
  'docsync.connect.okAs': 'Qoşuldu, {account} hesabı ilə daxil olundu',
  'docsync.connect.insecureHint':
    'Öz-özünə imzalanmış sertifikata malik şəxsi şəbəkənizdəki sistem üçün.',
  'docsync.connect.about.paperless':
    'TREK bu səyahətin fayllarını ayrıca etiket altında saxlayır və arxivinizin qalan hissəsinə toxunmur.',
  'docsync.connect.about.papra':
    'Bu səyahətin aid olduğu təşkilatı seçin. TREK faylları onun daxilində ayrıca etiket altında saxlayır.',
  'docsync.connect.about.nextcloud':
    'Hesab parolunuzdan deyil, tətbiq parolundan istifadə edin: o, iki faktorlu doğrulama ilə işləyir və ayrıca ləğv edilə bilər.',
  'docsync.connect.about.opencloud':
    'TREK bu səyahət üçün digər hər şeydən ayrı öz məkanını əldə edir.',
  'docsync.connect.about.synologydrive':
    'Yalnız bu səyahətin istifadə etməli olduğu paylaşılan qovluğa giriş əldə edən DSM hesabından istifadə etmək daha yaxşıdır.',

  // ── Picking the container ──────────────────────────────────────────────────
  'docsync.scope.title': 'Bu səyahət {provider} daxilində harada saxlanılsın?',
  'docsync.scope.intro':
    'Yalnız buradakı məzmun sinxronlaşdırılır. Saxlama xidmətinizdəki digər hər şey TREK-dən kənarda qalır.',
  'docsync.scope.createTitle': 'Yenisini yarat',
  'docsync.scope.createAction': 'Yarat',
  'docsync.scope.pickTitle': 'Və ya mövcud olanlardan istifadə et',
  'docsync.scope.search': 'Axtar',
  'docsync.scope.noMatch': 'Uyğun nəticə tapılmadı.',

  // ── Things a person has to decide ──────────────────────────────────────────
  'docsync.issues.title': 'Yoxlanılmalıdır',
  'docsync.issues.conflict':
    'Hər iki yerdə dəyişdirilib. Hansının saxlanılacağını seçin.',
  'docsync.issues.remote_missing':
    'Saxlama xidmətindən silinib. TREK nüsxəsi hələ də buradadır.',
  'docsync.issues.rejected_type': 'Bu fayl növünə burada icazə verilmir.',
  'docsync.issues.too_large': 'İcazə verilən ölçüdən böyükdür.',
  'docsync.issues.error': 'Ötürmə baş tutmadı.',

  'docsync.error.unknown_provider': 'Bu provayder həmin sistemdə mövcud deyil.',
  'docsync.error.provider_disabled':
    'Dayandırılıb: administrator bu provayderi deaktiv edib. O, yenidən aktivləşdirildikdə sinxronlaşdırma davam edəcək.',
  'docsync.binding.reconnect': 'Yenidən qoşul',
};

export default docsync;