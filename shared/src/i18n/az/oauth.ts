import type { TranslationStrings } from '../types';

const oauth: TranslationStrings = {
  'oauth.scope.group.trips': 'Səyahətlər',
  'oauth.scope.group.places': 'Məkanlar',
  'oauth.scope.group.collections': 'Kolleksiyalar',
  'oauth.scope.group.atlas': 'Atlas',
  'oauth.scope.group.packing': 'Baqaj',
  'oauth.scope.group.todos': 'Tapşırıqlar',
  'oauth.scope.group.budget': 'Büdcə',
  'oauth.scope.group.reservations': 'Rezervasiyalar',
  'oauth.scope.group.collab': 'Əməkdaşlıq',
  'oauth.scope.group.notifications': 'Bildirişlər',
  'oauth.scope.group.vacay': 'Məzuniyyət',
  'oauth.scope.group.geo': 'Coğrafi məlumatlar',
  'oauth.scope.group.weather': 'Hava',
  'oauth.scope.group.journey': 'Səyahət gündəlikləri',
  'oauth.scope.trips:read.label': 'Səyahətlərə və marşrutlara bax',
  'oauth.scope.trips:read.description':
    'Səyahətləri, günləri, günlük qeydləri və üzvləri oxumaq',
  'oauth.scope.trips:write.label': 'Səyahətləri və marşrutları redaktə et',
  'oauth.scope.trips:write.description':
    'Səyahətlər, günlər və qeydlər yaratmaq və yeniləmək, həmçinin üzvləri idarə etmək',
  'oauth.scope.trips:delete.label': 'Səyahətləri sil',
  'oauth.scope.trips:delete.description':
    'Bütün səyahətləri həmişəlik silmək — bu əməliyyatı geri qaytarmaq mümkün deyil',
  'oauth.scope.trips:share.label': 'Paylaşma keçidlərini idarə et',
  'oauth.scope.trips:share.description':
    'Səyahətlər üçün açıq paylaşma keçidləri yaratmaq, yeniləmək və ləğv etmək',
  'oauth.scope.places:read.label': 'Məkanlara və xəritə məlumatlarına bax',
  'oauth.scope.places:read.description':
    'Məkanları, gün təyinatlarını, etiketləri və kateqoriyaları oxumaq',
  'oauth.scope.places:write.label': 'Məkanları idarə et',
  'oauth.scope.places:write.description':
    'Məkanları, təyinatları və etiketləri yaratmaq, yeniləmək və silmək',
  'oauth.scope.collections:read.label': 'Kolleksiyalara bax',
  'oauth.scope.collections:read.description':
    'Yadda saxlanılmış məkan kolleksiyalarını, onların məkanlarını, reytinqlərini, etiketlərini və üzvlərini oxumaq',
  'oauth.scope.collections:write.label': 'Kolleksiyaları idarə et',
  'oauth.scope.collections:write.description':
    'Kolleksiyalar yaratmaq və redaktə etmək, məkanları yadda saxlamaq, qiymətləndirmək, etiketləmək və kopyalamaq, həmçinin siyahıları paylaşmaq',
  'oauth.scope.atlas:read.label': 'Atlasa bax',
  'oauth.scope.atlas:read.description':
    'Ziyarət edilmiş ölkələri, regionları və arzular siyahısını oxumaq',
  'oauth.scope.atlas:write.label': 'Atlası idarə et',
  'oauth.scope.atlas:write.description':
    'Ölkələri və regionları ziyarət edilmiş kimi işarələmək və arzular siyahısını idarə etmək',
  'oauth.scope.packing:read.label': 'Baqaj siyahılarına bax',
  'oauth.scope.packing:read.description':
    'Baqaj elementlərini, çantaları və kateqoriyalara təyin edilmiş şəxsləri oxumaq',
  'oauth.scope.packing:write.label': 'Baqaj siyahılarını idarə et',
  'oauth.scope.packing:write.description':
    'Baqaj elementlərini və çantaları əlavə etmək, yeniləmək, silmək, vəziyyətini dəyişmək və yenidən sıralamaq',
  'oauth.scope.todos:read.label': 'Tapşırıq siyahılarına bax',
  'oauth.scope.todos:read.description':
    'Səyahət tapşırıqlarını və kateqoriyalara təyin edilmiş şəxsləri oxumaq',
  'oauth.scope.todos:write.label': 'Tapşırıq siyahılarını idarə et',
  'oauth.scope.todos:write.description':
    'Tapşırıqlar yaratmaq, yeniləmək, vəziyyətini dəyişmək, silmək və yenidən sıralamaq',
  'oauth.scope.budget:read.label': 'Büdcəyə bax',
  'oauth.scope.budget:read.description':
    'Büdcə elementlərini və xərclərin bölgüsünü oxumaq',
  'oauth.scope.budget:write.label': 'Büdcəni idarə et',
  'oauth.scope.budget:write.description':
    'Büdcə elementləri yaratmaq, yeniləmək və silmək',
  'oauth.scope.reservations:read.label': 'Rezervasiyalara bax',
  'oauth.scope.reservations:read.description':
    'Rezervasiyaları və qalma yeri məlumatlarını oxumaq',
  'oauth.scope.reservations:write.label': 'Rezervasiyaları idarə et',
  'oauth.scope.reservations:write.description':
    'Rezervasiyalar yaratmaq, yeniləmək, silmək və yenidən sıralamaq',
  'oauth.scope.collab:read.label': 'Əməkdaşlıq məlumatlarına bax',
  'oauth.scope.collab:read.description':
    'Birgə qeydləri, sorğuları və mesajları oxumaq',
  'oauth.scope.collab:write.label': 'Əməkdaşlığı idarə et',
  'oauth.scope.collab:write.description':
    'Birgə qeydlər, sorğular və mesajlar yaratmaq, yeniləmək və silmək',
  'oauth.scope.notifications:read.label': 'Bildirişlərə bax',
  'oauth.scope.notifications:read.description':
    'Tətbiqdaxili bildirişləri və oxunmamış bildirişlərin sayını oxumaq',
  'oauth.scope.notifications:write.label': 'Bildirişləri idarə et',
  'oauth.scope.notifications:write.description':
    'Bildirişləri oxunmuş kimi işarələmək və onlara cavab vermək',
  'oauth.scope.vacay:read.label': 'Məzuniyyət planlarına bax',
  'oauth.scope.vacay:read.description':
    'Məzuniyyət planlaşdırma məlumatlarını, qeydlərini və statistikasını oxumaq',
  'oauth.scope.vacay:write.label': 'Məzuniyyət planlarını idarə et',
  'oauth.scope.vacay:write.description':
    'Məzuniyyət qeydlərini, bayramları və komanda planlarını yaratmaq və idarə etmək',
  'oauth.scope.geo:read.label': 'Xəritələr və geokodlaşdırma',
  'oauth.scope.geo:read.description':
    'Məkanları axtarmaq, xəritə URL-lərini müəyyən etmək və koordinatları əks geokodlaşdırmaq',
  'oauth.scope.weather:read.label': 'Hava proqnozları',
  'oauth.scope.weather:read.description':
    'Səyahət məkanları və tarixləri üçün hava proqnozlarını əldə etmək',
  'oauth.scope.journey:read.label': 'Səyahət gündəliklərinə bax',
  'oauth.scope.journey:read.description':
    'Səyahət gündəliklərini, qeydləri və iştirakçılar siyahısını oxumaq',
  'oauth.scope.journey:write.label': 'Səyahət gündəliklərini idarə et',
  'oauth.scope.journey:write.description':
    'Səyahət gündəliklərini və onların qeydlərini yaratmaq, yeniləmək və silmək',
  'oauth.scope.journey:share.label': 'Səyahət gündəliyi keçidlərini idarə et',
  'oauth.scope.journey:share.description':
    'Səyahət gündəlikləri üçün açıq paylaşma keçidləri yaratmaq, yeniləmək və ləğv etmək',
  'oauth.authorize.authorizing': 'İcazə verilir…',
  'oauth.authorize.loading': 'Yüklənir…',
  'oauth.authorize.errorTitle': 'İcazə xətası',
  'oauth.authorize.loginTitle': 'Davam etmək üçün daxil olun',
  'oauth.authorize.loginDescription':
    '{client} TREK hesabınıza giriş istəyir. Əvvəlcə daxil olun.',
  'oauth.authorize.loginButton': 'TREK-ə daxil ol',
  'oauth.authorize.requestLabel': 'İcazə sorğusu',
  'oauth.authorize.requestDescription':
    'Bu tətbiq TREK hesabınıza giriş icazəsi istəyir.',
  'oauth.authorize.trustNote':
    'Yalnız etibar etdiyiniz tətbiqlərə giriş icazəsi verin. Məlumatlarınız serverinizdə qalır.',
  'oauth.authorize.selectScope': 'Ən azı bir icazə sahəsi seçin',
  'oauth.authorize.approveOneScope': 'Təsdiqlə ({count} icazə sahəsi)',
  'oauth.authorize.approveManyScopes': 'Təsdiqlə ({count} icazə sahəsi)',
  'oauth.authorize.approveAccess': 'Girişə icazə ver',
  'oauth.authorize.deny': 'Rədd et',
  'oauth.authorize.choosePermissions': 'Veriləcək icazələri seçin',
  'oauth.authorize.permissionsRequested': 'Tələb edilən icazələr',
  'oauth.authorize.alwaysIncluded': 'Həmişə daxildir',
  'oauth.authorize.alwaysTool.listTrips':
    'Süni intellektin səyahət ID-lərini müəyyən edə bilməsi üçün səyahətlərinizi siyahılamaq',
  'oauth.authorize.alwaysTool.getTripSummary':
    'Digər alətlərdən istifadə etmək üçün tələb olunan səyahət icmalını oxumaq',
  'oauth.scope.group.files': 'Fayllar',
  'oauth.scope.group.settings': 'Tənzimləmələr',
  'oauth.scope.files:read.label': 'Səyahət fayllarına bax',
  'oauth.scope.files:read.description':
    'Səyahətdəki sənədləri siyahılamaq: adları, ölçüləri, onları kimin yüklədiyi və nəyə əlaqələndirildiyi',
  'oauth.scope.files:write.label': 'Səyahət fayllarını təşkil et',
  'oauth.scope.files:write.description':
    'Faylların adını və təsvirini dəyişmək, onları rezervasiyalara və məkanlara əlaqələndirmək, seçilmişlərə əlavə etmək və zibil qutusuna köçürmək',
  'oauth.scope.files:content.label': 'Fayl məzmununu oxu',
  'oauth.scope.files:content.description':
    'Rezervasiya PDF-i və ya bilet kimi yüklənmiş sənədin daxilindəki məzmunu oxumaq',
  'oauth.scope.settings:read.label': 'Seçimlərinizə bax',
  'oauth.scope.settings:read.description':
    'Ölçü vahidlərini, vaxt formatını, dili, standart valyutanı və başlanğıc səhifəsini oxumaq',
  'oauth.scope.settings:write.label': 'Seçimlərinizi dəyiş',
  'oauth.scope.settings:write.description':
    'Ölçü vahidlərini, vaxt formatını, dili, standart valyutanı və başlanğıc səhifəsini dəyişmək. Saxlanılan API açarlarına heç vaxt giriş verilmir',
  'oauth.scope.group.plugins': 'Plaginlər',
  'oauth.scope.plugins:use.label': 'Plagin alətlərini işə sal',
  'oauth.scope.plugins:use.description':
    'Bu müştəriyə administratorun quraşdırdığı və təsdiqlədiyi plaginlərin yayımladığı alətləri çağırmağa icazə vermək. Hər plagin bu tokendəki icazə sahələri ilə deyil, ona əvvəlcədən verilmiş giriş icazələri ilə işləyir',
};

export default oauth;