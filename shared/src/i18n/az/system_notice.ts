import type { TranslationStrings } from '../types';

const system_notice: TranslationStrings = {
  'system_notice.v3_photos.title': '3.0 versiyasında fotoların yeri dəyişib',
  'system_notice.v3_photos.body':
    '**Fotolar** bölməsi Səyahət planlayıcısından silinib. Fotolarınız təhlükəsizdir — TREK Immich və ya Synology kitabxananızı heç vaxt dəyişdirməyib.\n\nFotolar indi **Səyahət gündəliyi** əlavəsində yerləşir. Səyahət gündəliyi istəyə bağlıdır — hələ mövcud deyilsə, administratorunuzdan onu İdarəetmə → Əlavələr bölməsində aktivləşdirməsini istəyin.',
  'system_notice.v3_journey.title': 'Səyahət gündəliyi ilə tanış olun',
  'system_notice.v3_journey.body':
    'Səyahətlərinizi zaman xətləri, foto qalereyaları və interaktiv xəritələrlə zəngin səyahət hekayələri kimi sənədləşdirin.',
  'system_notice.v3_journey.cta_label': 'Səyahət gündəliyini aç',
  'system_notice.v3_journey.highlight_timeline': 'Günbəgün zaman xətti və qalereya',
  'system_notice.v3_journey.highlight_photos': 'Immich və ya Synology-dən idxal',
  'system_notice.v3_journey.highlight_share': 'Açıq paylaşın — giriş tələb olunmur',
  'system_notice.v3_journey.highlight_export': 'PDF foto kitabı kimi ixrac edin',
  'system_notice.v3_features.title': '3.0 versiyasındakı digər yeniliklər',
  'system_notice.v3_features.body': 'Bu buraxılış haqqında bilməyə dəyər daha bir neçə yenilik.',
  'system_notice.v3_features.highlight_dashboard': 'Mobil cihazlara üstünlük verən yenilənmiş idarə paneli',
  'system_notice.v3_features.highlight_offline': 'PWA kimi tam oflayn rejim',
  'system_notice.v3_features.highlight_search': 'Real vaxt rejimində məkan axtarışının avtomatik tamamlanması',
  'system_notice.v3_features.highlight_import': 'KMZ/KML fayllarından məkan idxalı',
  'system_notice.v3_mcp.title': 'MCP: OAuth 2.1 yeniləməsi',
  'system_notice.v3_mcp.body':
    'MCP inteqrasiyası tamamilə yenilənib. OAuth 2.1 indi tövsiyə edilən doğrulama üsuludur. Köhnə statik tokenlər (trek_…) artıq tövsiyə edilmir və gələcək buraxılışda silinəcək.',
  'system_notice.v3_mcp.highlight_oauth': 'OAuth 2.1 tövsiyə edilir (mcp-remote)',
  'system_notice.v3_mcp.highlight_scopes': '24 dəqiq tənzimlənən icazə sahəsi',
  'system_notice.v3_mcp.highlight_deprecated': 'Statik trek_ tokenləri artıq tövsiyə edilmir',
  'system_notice.v3_mcp.highlight_tools': 'Genişləndirilmiş alətlər və sorğular',
  'system_notice.v3_thankyou.title': 'Məndən şəxsi bir qeyd',
  'system_notice.v3_thankyou.body':
    'Getməzdən əvvəl bir anlıq dayanmaq istəyirəm.\n\nTREK öz səyahətlərim üçün hazırladığım kiçik əlavə layihə kimi başladı. Onun böyüyərək macəralarını planlaşdırmaq üçün indi 4 000 nəfərin etibar etdiyi bir layihəyə çevriləcəyini heç vaxt təsəvvür etməzdim. Hər ulduzu, hər problem bildirişini və hər funksiya təklifini oxuyuram. Onlar tam iş günü və universitet arasında gecə saatlarında işləməyə davam etməyimə kömək edir.\n\nBunu bilməyinizi istəyirəm: TREK həmişə açıq mənbəli, həmişə şəxsi serverinizdə işləyən və həmişə sizə məxsus olacaq. İzləmə, abunəlik və gizli şərt yoxdur. Sadəcə səyahəti sizin qədər sevən birinin hazırladığı alətdir.\n\n[jubnl](https://github.com/jubnl) üçün xüsusi təşəkkür — inanılmaz əməkdaş oldunuz. 3.0 versiyasını möhtəşəm edən xüsusiyyətlərin çoxunda sizin iziniz var. Layihə hələ tam hazır olmadığı vaxtda ona inandığınız üçün təşəkkür edirəm.\n\nXəta bildirən, bir sətri tərcümə edən, TREK-i dostu ilə paylaşan və ya sadəcə səyahət planlaşdırmaq üçün istifadə edən hər birinizə — **təşəkkür edirəm**. Bunun mövcud olmasının səbəbi sizsiniz.\n\nBirlikdə daha çox macəralara.\n\n— Maurice\n\n---\n\n[Discord icmasına qoşulun](https://discord.gg/7Q6M6jDwzf)\n\nTREK səyahətlərinizi yaxşılaşdırırsa, [kiçik bir qəhvə](https://ko-fi.com/mauriceboe) layihənin davam etməsinə həmişə kömək edir.',
  'system_notice.v3014_whitespace_collision.title': 'Əməliyyat tələb olunur: istifadəçi hesabı ziddiyyəti',
  'system_notice.v3014_whitespace_collision.body':
    '3.0.14 yeniləməsi saxlanılan hesablardakı adların əvvəlində və ya sonunda olan boşluqların yaratdığı bir və ya daha çox istifadəçi adı və ya e-poçt ziddiyyəti aşkarladı. Təsirlənmiş hesabların adları avtomatik dəyişdirildi. Hansı hesabların yoxlanılmalı olduğunu müəyyən etmək üçün server jurnallarında **[migration] WHITESPACE COLLISION** ilə başlayan sətirləri yoxlayın.',
  'system_notice.welcome_v1.title': 'TREK-ə xoş gəlmisiniz',
  'system_notice.welcome_v1.body':
    'Hamısı birində səyahət planlayıcınız. Marşrutlar yaradın, səyahətləri dostlarınızla paylaşın və onlayn və ya oflayn rejimdə planlı qalın.',
  'system_notice.welcome_v1.cta_label': 'Səyahət planlaşdır',
  'system_notice.welcome_v1.hero_alt': 'TREK planlaşdırma interfeysinin göstərildiyi mənzərəli səyahət məkanı',
  'system_notice.welcome_v1.highlight_plan': 'İstənilən səyahət üçün günbəgün marşrutlar',
  'system_notice.welcome_v1.highlight_share': 'Səyahət yoldaşlarınızla əməkdaşlıq edin',
  'system_notice.welcome_v1.highlight_offline': 'Mobil cihazlarda oflayn işləyir',
  'system_notice.dev_test_modal.title': '[Tərtibat] Sınaq bildirişi',
  'system_notice.dev_test_modal.body': 'Bu, yalnız tərtibat üçün olan sınaq bildirişidir.',

  // Thank-you + support the project (shown once per install and once per upgrade)
  'system_notice.thank_you_support.title': 'TREK-dən istifadə etdiyiniz üçün təşəkkür edirik',
  'system_notice.thank_you_support.body':
    'TREK-i quraşdırdığınız üçün sizə qısa təşəkkür etmək istəyirəm — bu, mənim üçün həqiqətən çox şey ifadə edir.\n\nMən tək çalışan tərtibatçıyam və TREK-i boş vaxtlarımda hazırlayıram. O, əvvəlcə yalnız öz səyahətlərim üçün kiçik alət kimi başladı. O vaxtdan bəri icmanın göstərdiyi dəstək və maraq məni həqiqətən heyrətləndirib. TREK mənim tərəfimdən böyük həvəslə hazırlanır, lakin onun formalaşmasına kömək edən çoxsaylı möhtəşəm xarici iştirakçıların da əməyi var.\n\n**TREK açıq mənbəlidir və tamamilə pulsuzdur — həmişə də belə qalacaq. Ödənişli səviyyələr, abunəliklər və gizli şərtlər yoxdur. Söz verirəm.**\n\nTREK sizin üçün faydalıdırsa və inkişafını dəstəkləmək istəyirsinizsə, kiçik bir qəhvə layihəni davam etdirməyimə həqiqətən kömək edir — heç bir məcburiyyət yoxdur, lakin hər fincan gecə işlərinin davam etməsinə dəstək olur.\n\nBurada olduğunuz üçün təşəkkür edirəm.\n\n— Maurice',
  'system_notice.thank_you_support.highlight_opensource': 'GitHub-da 100% açıq mənbəlidir',
  'system_notice.thank_you_support.highlight_free': 'Həmişə pulsuzdur — heç vaxt ödənişli səviyyə olmayacaq',
  'system_notice.thank_you_support.highlight_community': 'İcma ilə birlikdə hazırlanır',
  'system_notice.thank_you_support.cta_bmc': 'Mənə qəhvə al',
  'system_notice.thank_you_support.cta_kofi': 'Ko-fi-da dəstəklə',
  'system_notice.thank_you_support.cta_patreon': 'Patreon-da aylıq',

  // The release modal. One stable set of keys: each big release swaps the copy in place.
  'system_notice.release_notes.eyebrow': 'Yeniləmə quraşdırıldı',
  'system_notice.release_notes.headline': 'Az yazın, çox səyahət edin.',
  'system_notice.release_notes.intro':
    'Yönləndirdiyiniz rezervasiya məktubları səyahətinizə düşür, TREK uçuşlarınızı canlı izləyir, səyahət PDF-i isə tamamilə yenidir. TREK artıq PostgreSQL üzərində də işləyir.',
  'system_notice.release_notes.features_label': 'Əsas yeniliklər',
  'system_notice.release_notes.features_aside': 'Bundan əlavə',
  'system_notice.release_notes.feature_mail_title': 'Rezervasiya məktubları səyahətinizə düşür',
  'system_notice.release_notes.feature_mail_body':
    'Təsdiqi şəxsi ünvanınıza yönləndirin, TREK səyahətinizi tapır, yoxlayır və rezervasiyanı sənədi ilə birlikdə əlavə edir.',
  'system_notice.release_notes.feature_flight_title': 'Canlı uçuş statusu, pulsuz',
  'system_notice.release_notes.feature_flight_body':
    'TREK hər uçuşunuzu həmin gün izləyir: vəziyyət, gecikmə, hər iki hava limanı və təyyarənin göründüyü xəritə, API açarı olmadan.',
  'system_notice.release_notes.feature_pdf_title': 'Yeni səyahət PDF-i',
  'system_notice.release_notes.feature_pdf_body':
    'Marşrutunuzla örtük, hər gün zaman xətti kimi və bütün rezervasiyalarınız kodları ilə, çapa və ya paylaşmağa hazır.',
  'system_notice.release_notes.footnote':
    'Bunlarla yanaşı PostgreSQL, səyahət üzrə əlavələr, məkanlara etiketlər, xərcləri izləməyin daha çox yolu və kiçik dəyişikliklərin uzun siyahısı.',
  'system_notice.release_notes.notes_label': 'Buraxılış qeydləri',
  'system_notice.release_notes.note_eyebrow': 'Layihə rəhbərindən qeyd',
  'system_notice.release_notes.note_title': 'TREK-i inkişaf etdirməyə davam etməyimin səbəbi sizsiniz.',
  'system_notice.release_notes.note_body':
    'TREK mənim öz səyahətlərim üçün kiçik bir alət kimi başladı, işdən sonra yazdım. Bu gün istifadə etdiyiniz demək olar ki, hər şey gecələr, həftə sonları və qatarlarda, tam ştatlı işin yanında ərsəyə gəldi və tez-tez düşünürdüm ki, kimsə onu açacaqmı.',
  'system_notice.release_notes.promise_label': 'Vəd',
  'system_notice.release_notes.promise_lead': 'TREK həmişə pulsuz qalacaq.',
  'system_notice.release_notes.promise_text':
    'Hər funksiya və hər yeniləmə hər kəs üçün olacaq. Ödənişli səviyyələr, abunəliklər və gizli şərtlər yoxdur.',
  'system_notice.release_notes.note_body_after':
    'Sonra siz gəldiniz, tezliklə minlərlə: ulduzlarla, xəta hesabatları ilə, bilmədiyim dillərə tərcümələrlə və heç tanımadığım insanların pull request-ləri ilə. Hər səhər ilk işim repozitoriyaya baxmaqdır və bu, hələ də tam gerçək görünmür.',
  'system_notice.release_notes.note_closing': 'Burada olduğunuz üçün təşəkkür edirəm. Maurice',
  'system_notice.release_notes.support_label': 'Sizin sayənizdə mümkündür',
  'system_notice.release_notes.support_lead': 'TREK yalnız ianələr sayəsində mövcuddur.',
  'system_notice.release_notes.support_text':
    'Onlar serverlərin xərcini ödəyir və mənə onu inkişaf etdirməyə vaxt verir. Bir fincan qəhvə belə TREK-in hamı üçün pulsuz qalmasına kömək edir.',
  'system_notice.release_notes.cta_bmc': 'Mənə qəhvə al',
  'system_notice.release_notes.cta_kofi': 'Ko-fi-da dəstəklə',
  'system_notice.release_notes.cta_patreon': 'Patreon-da aylıq',
  'system_notice.pager.prev': 'Əvvəlki bildiriş',
  'system_notice.pager.next': 'Növbəti bildiriş',
  'system_notice.pager.counter': '{current} / {total}',
  'system_notice.pager.goto': '{n}-ci bildirişə keç',
  'system_notice.pager.position': '{total} bildirişdən {current}-cisi',
};

export default system_notice;
