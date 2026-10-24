import type { TranslationStrings } from '../types';

const help: TranslationStrings = {
  'help.title': 'Kömək və sənədlər',
  'help.search': 'Yardımda axtar…',
  'help.contents': 'Mündəricat',
  'help.noResults': 'Uyğun səhifə tapılmadı.',
  'help.errorTitle': 'Bu səhifəni yükləmək alınmadı',
  'help.errorBody': 'Kömək məzmunu TREK vikisindən yüklənir. İnternet bağlantınızı yoxlayıb yenidən cəhd edin.',

  // ── Help center (the contextual panel behind the ? in the navbar) ──────────
  'help.center.button': 'Bu ekran üzrə kömək',
  'help.center.title': 'Kömək',
  'help.center.onThisScreen': 'Bu ekranda',
  'help.center.screens': 'Ekranlar',
  'help.center.thisScreen': 'Cari',
  'help.center.subScreens': '{count} alt ekran',
  'help.center.subScreens.one': '{count} alt ekran',
  'help.center.subScreensLabel': 'Alt ekranlar',
  'help.center.guidesCount': '{count} bələdçi',
  'help.center.guidesCount.one': '{count} bələdçi',
  'help.center.goToScreen': '{screen} bölməsinə keç',
  'help.center.overview': 'İcmal',
  'help.center.howTo': 'Necə edim…',
  'help.center.searchPlaceholder': 'Bələdçi və sənədlərdə axtarın…',
  'help.center.searchEmpty': '«{query}» üzrə heç nə tapılmadı.',
  'help.center.searchGuides': 'Bələdçilər',
  'help.center.searchDocs': 'Sənədlər',
  'help.center.searchError': 'Axtarış hazırda əlçatan deyil.',
  'help.center.back': 'Geri',
  'help.center.close': 'Köməyi bağla',
  'help.center.steps': '{count} addım',
  'help.center.steps.one': '{count} addım',
  'help.center.step': 'Addım {n}',
  'help.center.stepsLabel': 'Addımlar',
  'help.center.stepOf': 'Addım {n} / {total}',
  'help.center.screenshot': 'Ekran görüntüsü',
  'help.center.result': 'Nəticə',
  'help.center.tips': 'Faydalı məlumatlar',
  'help.center.related': 'Oxşar mövzular',
  'help.center.openDocs': '«Kömək və sənədlər» bölməsində aç',
  'help.center.docsSection': 'Sənədlərdə',
  'help.center.noContext': 'Bu ekran üçün hələ bələdçi yoxdur.',
  'help.center.noContextHint': 'Sənədlərdə axtarın və ya nə axtardığınızı bizə yazın.',
  'help.center.feedback': 'Nəsə çatışmır?',
  'help.center.feedbackLink': 'GitHub-da bizə yazın',
  'help.center.discord': 'Discord-da soruşun',
  'help.center.quick': 'Qısa',
  'help.center.guide': 'Bələdçi',
  'help.center.tour': 'Addım-addım tanışlıq',
  'help.center.imageAlt': '«{title}», addım {n}',

  // ── Screen: dashboard ──────────────────────────────────────────────────────
  'help.ctx.dashboard.title': 'İdarə paneli',
  'help.ctx.dashboard.summary':
    'İdarə panelində bütün səyahətləriniz görünür. Yuxarıdakı minik talonu şəklində olan kart hazırda davam edən və ya növbəti səyahəti göstərir. Onun altındakı sıra indiyədək nə qədər səyahət etdiyinizi sayır, kartlarda isə planlaşdırdığınız, arxivləşdirdiyiniz və ya artıq başa vurduğunuz bütün səyahətlər sıralanır.',
  'help.ctx.dashboard.bullet.1':
    'Minmə talonu: davam edən və ya növbəti səyahət, tarixləri, səyahətçiləri, məkanları və geri sayımla birlikdə. Səyahəti açmaq üçün ona klikləyin. Yuxarı sağ küncdəki dörd düymə ilə səyahəti redaktə edə, nüsxəsini yarada, arxivləşdirə və ya silə bilərsiniz.',
  'help.ctx.dashboard.bullet.2':
    'Səyahət statistikası: bütün səyahətləriniz üzrə gördüyünüz ölkələr, səyahətlərin sayı, yolda keçən günlər və uçuş məsafəsi.',
  'help.ctx.dashboard.bullet.3':
    'Səyahət kartları «Planlaşdırılıb», «Arxivləşdirilib» və «Tamamlanıb» üzrə süzülür, cədvəl və ya siyahı şəklində göstərilir. Yuxarıdakı axtarış sahəsi bütün səyahətlərinizdə birdəfəlik başlığa, tarixə və ya səyahətdəki məkana görə axtarır. Səyahəti redaktə etmək, nüsxəsini yaratmaq, arxivləşdirmək və silmək düymələri hər kartın fotosunun yuxarı sağ küncündədir.',
  'help.ctx.dashboard.bullet.4':
    'Sağdakı vidcetlər: valyuta çeviricisi, «Kolleksiyalar» (Kolleksiyalar əlavəsi aktivdirsə), dünya saatları, qarşıdakı rezervasiyalar və plaginlərin vidcetləri. Daxili vidcetləri «Tənzimləmələr», «Görünüş» bölməsində söndürə bilərsiniz.',
  'help.ctx.dashboard.bullet.5':
    'Yeni səyahəti həm «Yeni səyahət» kartı, həm də sağ aşağı küncdəki düymə ilə başlada bilərsiniz.',

  // create-trip
  'help.guide.create-trip.title': 'Səyahət yaratmaq',
  'help.guide.create-trip.goal': 'Ad, tarixlər və üzlük fotosu ilə yeni səyahət yaradın.',
  'help.guide.create-trip.step.1':
    '«Yeni səyahət» düyməsinə klikləyin. Səyahətlərinizin sonundakı kart və sağ aşağı küncdəki düymə də eyni işi görür.',
  'help.guide.create-trip.step.2':
    'Səyahətə ad verin. Doldurmalı olduğunuz yeganə sahə budur, qalan hər şeyi sonra əlavə edə bilərsiniz.',
  'help.guide.create-trip.step.3':
    'Başlama və bitmə tarixini seçin. TREK hər tarix üçün bir gün yaradır ki, marşrutunuzu planlaşdırmağa başlaya biləsiniz. Hələ tarix yoxdur? Hər ikisini boş buraxın və əvəzinə «Günlərin sayı»nı daxil edin.',
  'help.guide.create-trip.step.4':
    'İstəyə görə üz şəkli əlavə edin: öz şəklinizi yükləyin, sürükləyib atın və ya yapışdırın, ya da təyinat yeri üçün Unsplash-da axtarın.',
  'help.guide.create-trip.step.5': '«Yeni səyahət yarat» düyməsinə klikləyin.',
  'help.guide.create-trip.result':
    'Səyahət idarə panelində görünür. Növbəti səyahətinizdirsə, yuxarıdakı minik talonunda göstərilir.',
  'help.guide.create-trip.tip.1':
    'Tarixləri sonra da dəyişə bilərsiniz. Artıq rezervasiyalar varsa, TREK onları da günlərlə birlikdə köçürmək istəyib-istəmədiyinizi soruşur.',
  'help.guide.create-trip.tip.2':
    'Burada seçdiyiniz səyahət valyutası bütün xərclərin çevrildiyi valyutadır. Getdiyiniz yerin valyutasını seçin.',

  // edit-trip
  'help.guide.edit-trip.title': 'Səyahəti redaktə edin',
  'help.guide.edit-trip.goal': 'Səyahətin adını, tarixlərini və ya tənzimləmələrini dəyişin.',
  'help.guide.edit-trip.step.1': 'Səyahət kartının (və ya minmə talonunun) yuxarı sağ küncündəki qələmə klikləyin.',
  'help.guide.edit-trip.step.2':
    'Lazım olanı dəyişin: ad, təsvir, tarixlər, üz şəkli, valyuta, xatırlatma və ya səyahət yoldaşları.',
  'help.guide.edit-trip.step.3': '«Yenilə» düyməsini klikləyin.',
  'help.guide.edit-trip.result': 'Kart səyahətin bütün üzvləri üçün dərhal yenilənir.',
  'help.guide.edit-trip.tip.1':
    'Rezervasiyaları olan səyahətin başlanğıcını dəyişdikdə rezervasiyaların da köçürülüb köçürülməyəcəyi soruşulur. Səyahəti qısaltdıqda silinəcək günlər və onlarda planlaşdırılanlar sadalanır. Dəyişiklik yalnız «Günləri sil və yadda saxla» düyməsinə kliklədikdən sonra saxlanır.',

  // cover-image
  'help.guide.cover-image.title': 'Üz qabığı şəkli seçin',
  'help.guide.cover-image.goal': 'Səyahətə onun kartında və minik talonunda görünən şəkil seçin.',
  'help.guide.cover-image.step.1': 'Kartdakı qələmlə səyahətin redaktə formasını açın.',
  'help.guide.cover-image.step.2':
    '«Üz qabığı şəkli» altında fotonu atın və ya yapışdırın, yükləmək üçün klikləyin, ya da təyinat yerini yazıb «Unsplash-da axtar» düyməsinə klikləyin.',
  'help.guide.cover-image.step.3': 'Foto seçin və «Yenilə» düyməsinə klikləyin.',
  'help.guide.cover-image.result': 'Foto səyahətlə birlikdə saxlanılır və səyahətin göründüyü hər yerdə göstərilir.',
  'help.guide.cover-image.tip.1':
    'Unsplash axtarışından götürülən fotoların müəllifi avtomatik qeyd olunur; özünüz yüklədiyiniz şəkillər serverinizdə qalır.',

  // duplicate-trip
  'help.guide.duplicate-trip.title': 'Səyahətin nüsxəsini yaratmaq',
  'help.guide.duplicate-trip.goal': 'Mövcud səyahəti yeni səyahət üçün şablon kimi istifadə edin.',
  'help.guide.duplicate-trip.step.1': 'Kartın yuxarı sağ küncündəki nüsxə işarəsinə klikləyin.',
  'help.guide.duplicate-trip.step.2':
    'Nəyin kopyalanacağını və nəyin kopyalanmayacağını oxuyun, sonra «Səyahətin nüsxəsini yarat» düyməsinə klikləyin.',
  'help.guide.duplicate-trip.result':
    'İdarə panelinizdə nüsxə görünür. Onun adı orijinalın adından və (copy) sözündən ibarətdir. Adını və tarixlərini dəyişə bilərsiniz.',
  'help.guide.duplicate-trip.tip.1':
    'Günlər, məkanlar, turlar və avtomobil səyahəti marşrutları, rezervasiyalar, büdcə maddələri, baqaj siyahıları, tapşırıqlar və gün qeydləri kopyalanır; baqaj siyahıları və tapşırıqlar işarəsiz kopyalanır. Üzvlər, çat, sorğular, fayllar və paylaşım linkləri kopyalanmır.',

  // archive-trip
  'help.guide.archive-trip.title': 'Səyahəti arxivləşdirin və bərpa edin',
  'help.guide.archive-trip.goal': 'Səyahəti silmədən siyahınızdan çıxarın və istədiyiniz vaxt geri qaytarın.',
  'help.guide.archive-trip.step.1': 'Kartın yuxarı sağ küncündəki arxiv işarəsinə klikləyin.',
  'help.guide.archive-trip.step.2':
    'Səyahəti yenidən görmək üçün kartların üstündəki filtri «Arxivləşdirilib» vəziyyətinə keçirin.',
  'help.guide.archive-trip.step.3':
    'Səyahəti geri qaytarmaq üçün kartda «Bərpa et» düyməsinə klikləyin: o, «Planlaşdırılıb» bölməsinə, tarixləri keçibsə «Tamamlanıb» bölməsinə qayıdır.',
  'help.guide.archive-trip.result':
    'Arxivləşdirilmiş səyahətlərin bütün məlumatları qalır. Sadəcə onlar artıq idarə panelində və bütün səyahətlərin təqvim lentində görünmür.',

  // delete-trip
  'help.guide.delete-trip.title': 'Səyahəti silmək',
  'help.guide.delete-trip.goal': 'Səyahəti həmişəlik silin.',
  'help.guide.delete-trip.step.1': 'Kartın yuxarı sağ küncündəki zibil qutusu işarəsinə klikləyin.',
  'help.guide.delete-trip.step.2':
    '«Sil» ilə təsdiqləyin. Pəncərədə səyahətin adı göstərilir ki, düzgün səyahəti seçdiyinizə əmin olasınız.',
  'help.guide.delete-trip.result':
    'Səyahət, onun günləri, məkanları, rezervasiyaları və faylları silinir. Bunu geri qaytarmaq olmur, ona görə əmin deyilsinizsə, səyahəti silmək əvəzinə arxivləşdirin.',

  // filter-and-view
  'help.guide.filter-and-view.title': 'Tamamlanmış səyahətləri tapın, şəbəkə ilə siyahı arasında keçin',
  'help.guide.filter-and-view.goal':
    'Bitmiş və ya arxivləşdirilmiş səyahətlərə baxın və xoşunuza gələn görünüşü seçin.',
  'help.guide.filter-and-view.step.1':
    'Kartların üstündəki «Planlaşdırılıb», «Arxivləşdirilib» və «Tamamlanıb» seçimlərindən istifadə edin. «Tamamlanıb» bitmə tarixi keçmiş bütün səyahətləri göstərir.',
  'help.guide.filter-and-view.step.2':
    'Yığcam siyahıya keçmək üçün siyahı ikonuna klikləyin, şəbəkə görünüşünə qayıtmaq üçün yenidən klikləyin.',
  'help.guide.filter-and-view.result': 'İdarə paneli seçdiyiniz görünüşü bu cihazda yadda saxlayır.',

  // calendar-feed
  'help.guide.calendar-feed.title': 'Bütün səyahətlərə təqviminizdən abunə olmaq',
  'help.guide.calendar-feed.goal':
    'Bütün aktiv səyahətlərin günlərini və rezervasiyalarını təqvim tətbiqinizdə həmişə sinxron şəkildə görün.',
  'help.guide.calendar-feed.step.1': 'Görünüş açarının yanındakı təqvim ikonuna klikləyin.',
  'help.guide.calendar-feed.step.2':
    '«Təqvim abunəliyini aktivləşdir» düyməsinə klikləyin. TREK şəxsi təqvim linki yaradır.',
  'help.guide.calendar-feed.step.3':
    '«Google Təqvimə əlavə et» və ya «Apple Təqvimə / Outlook-a əlavə et» düyməsinə klikləyin. Başqa təqvim tətbiqi üçün «Və ya keçidi əllə kopyalayın» bölməsini açın və linki oradan kopyalayın.',
  'help.guide.calendar-feed.result':
    'Bütün aktiv səyahətlər təqviminizdə görünür və avtomatik yenilənir. Arxivləşdirilmiş səyahətlər və 90 gündən çox əvvəl bitmiş səyahətlər bura düşmür.',
  'help.guide.calendar-feed.tip.1':
    'Linki gizli saxlayın: ona sahib olan hər kəs təqvim axınını oxuya bilər. Başqaları onu əldə edibsə, «Yenidən yarat» sizə yeni link verir, köhnəsi isə işləmir. «Söndür» linki tamamilə silir.',

  // widgets
  'help.guide.widgets.title': 'İdarə paneli vidcetlərini seçmək',
  'help.guide.widgets.goal': 'Statistika sırasını və sağdakı vidcetləri göstərin və ya gizlədin.',
  'help.guide.widgets.step.1': 'Sağ yuxarı küncdəki avatar menyusunu açın və «Tənzimləmələr» bəndini seçin.',
  'help.guide.widgets.step.2': '«Görünüş» tabına keçin.',
  'help.guide.widgets.step.3':
    '«İdarə paneli vidcetləri» altında hər vidceti «Kompüter» və «Mobil» üçün ayrıca yandırın və ya söndürün. «Sağ yan panel» bütün sağ sütunu birdəfəlik söndürür.',
  'help.guide.widgets.step.4': 'İdarə panelinə qayıdın. Dəyişiklik dərhal tətbiq olunur.',
  'help.guide.widgets.result':
    'Vidcetləri gizlətdikdə səyahətlərinizə daha çox yer qalır. Düzülüşü mərkəzə çəkmək üçün sağ yan paneli bütövlükdə söndürün.',
  'help.guide.widgets.link': 'Görünüş tənzimləmələrini aç',

  // currency-widget
  'help.guide.currency-widget.title': 'Valyuta çevirmək',
  'help.guide.currency-widget.goal': 'Məbləği cari məzənnə ilə bir valyutadan digərinə çevirin.',
  'help.guide.currency-widget.step.1': 'Məbləği yazın və iki valyutanı seçin.',
  'help.guide.currency-widget.step.2':
    'Aralarındakı ox valyuta cütünün yerini dəyişir, dairəvi ox isə məzənnəni yeniləyir.',
  'help.guide.currency-widget.result':
    'Valyuta cütünüz hesabınızda yadda saxlanılır, ona görə də bütün cihazlarda eyni olur.',
  'help.guide.currency-widget.tip.1':
    'Məzənnələr pulsuz Frankfurter xidmətindən gəlir. Vidcetin küncündəki dairəvi ox ən son məzənnələri yükləyir.',

  // timezones-widget
  'help.guide.timezones-widget.title': 'Dünya saatları əlavə edin',
  'help.guide.timezones-widget.goal': 'Getdiyiniz yerlərdə saatın neçə olduğunu görün.',
  'help.guide.timezones-widget.step.1':
    '«Saat qurşaqları» vidcetində + düyməsinə klikləyin, şəhər axtarın, məsələn, Lisbon, və onu siyahıdan seçin.',
  'help.guide.timezones-widget.step.2':
    'Saatı silmək üçün kursoru onun üzərinə gətirin və sağda görünən × işarəsinə klikləyin.',
  'help.guide.timezones-widget.result': 'Saatlarınız hesabınızda saxlanılır.',
  'help.guide.search-trips.title': 'Səyahətlərinizdə axtarış edin',
  'help.guide.search-trips.goal':
    'Səyahəti adına, tarixinə və ya orada planlaşdırdığınız məkana görə tapın; arxivdəki səyahətlər də daxildir.',
  'help.guide.search-trips.step.1':
    'Kartların üstündəki «Səfər və ya yer axtar» sahəsinə yazın. Yazdıqca siyahı eyni anda planlaşdırılan, arxivləşdirilmiş və tamamlanmış səyahətlər üzrə süzülür.',
  'help.guide.search-trips.step.2':
    'Səyahət məkanlarından birinə görə tapılıbsa, həmin məkan səyahətin adının altında göstərilir. Bütün səyahətlərinizi yenidən görmək üçün sahədəki x işarəsinə klikləyin və ya Escape düyməsini basın.',
  'help.guide.search-trips.result':
    'İdarə panelində yalnız uyğun səyahətlər qalır. Hamısını yenidən görmək üçün axtarış sahəsini təmizləyin.',
  'help.guide.search-trips.tip.1':
    'Tarixə görə də axtara bilərsiniz: həmin aydakı səyahətləri tapmaq üçün ay və il yazın, məsələn, may 2027 və ya 2027-05.',
  'help.guide.search-trips.tip.2':
    'Axtarış aktiv olanda «Planlaşdırılıb», «Arxivləşdirilib» və «Tamamlanıb» filtri tətbiq olunmur, belə ki, yanlış filtr heç bir səyahəti gizlətmir.',

  // ── Screen: vacay ──────────────────────────────────────────────────────────
  'help.ctx.vacay.title': 'Vacay',
  'help.ctx.vacay.summary':
    'Vacay şəxsi məzuniyyət planlayıcınızdır: ildə neçə məzuniyyət gününüz olduğunu, hansılarını qeyd etdiyinizi və neçəsinin qaldığını göstərir. Təqvim şəbəkəsi bütün ili göstərir. Yan paneldə il seçimi, birlikdə planlaşdırdığınız insanlar, sizinlə paylaşılan təqvimlər, şərti işarələr və məzuniyyət limitiniz yer alır.',
  'help.ctx.vacay.bullet.1':
    'İl cədvəli: on iki ay kartı, hər gün üçün bir xana. Günü qeyd etmək və ya qeydi silmək üçün üzərinə klikləyin. Kiçik mavi nöqtə artıq səyahətə düşən günləri göstərir.',
  'help.ctx.vacay.bullet.2':
    'Aşağıdakı alətlər paneli: adınız və rənginiz olan ilk düymə məzuniyyəti qeyd edir; «Şirkət tətili» bütün şirkətin istirahət etdiyi günləri işarələyir. «Yarım gün» və «Kompensasiya / çevik gün» klikin nəyi qeyd etdiyini dəyişir, «Yarım gün» şirkət tətillərində də işləyir.',
  'help.ctx.vacay.bullet.3':
    '«Məzuniyyət limiti»: seçilmiş il üçün «Gün», «İstifadə edilib» və «Qalıb», yanında isə keçən ildən qalan günlər və kompensasiya / çevik günlər. Kartı yığmaq üçün başlığına klikləyin.',
  'help.ctx.vacay.bullet.4':
    '«Nəfər» planınızı sizinlə bölüşən insanlardır, hər biri öz rəngində. «Paylaşılan təqvimlər» başqalarının istirahət günlərini rəngli halqalarla göstərir. Onları redaktə edə bilməzsiniz.',
  'help.ctx.vacay.bullet.5':
    'Tənzimləmələrdə həftəsonları, həftənin başlanğıcı, qalan günlərin keçirilməsi, məzuniyyət iliniz, şirkət tətilləri, rəsmi və məktəb tətili təqvimləri, kiminləsə birgə planlaşdırırsınızsa, «Birləşdirməni ləğv et» var.',

  // log-day
  'help.guide.log-day.title': 'Məzuniyyət günü qeyd edin',
  'help.guide.log-day.goal': 'İllik cədvəldə istirahət gününü qeyd edin və qalığınızın necə dəyişdiyinə baxın.',
  'help.guide.log-day.step.1':
    'Aşağıdakı alətlər panelinin ilk düyməsinə baxın. Orada sizin adınız və rənginiz göstərilirsə, günə klik sizin üçün məzuniyyət günü qeyd edir.',
  'help.guide.log-day.step.2':
    'İstənilən ay kartında bir günə klikləyin. Gün sizin rənginizlə dolur, «İstifadə edilib» isə bir gün artır.',
  'help.guide.log-day.step.3': 'Qeydi silmək üçün həmin günə yenidən klikləyin.',
  'help.guide.log-day.result':
    'Gün qeyd olunur. «Gün», «İstifadə edilib» və «Qalıb» dərhal yenilənir, planınıza birləşdirilmiş hər kəs də dəyişikliyi elə o an görür.',
  'help.guide.log-day.tip.1':
    '«Tənzimləmələr»də «Həftəsonlarını blokla» aktiv olduqca həftəsonlarını qeyd etmək olmur. Əvvəl qeyd edilmiş həftəsonu gününü isə yenə də təmizləmək olar.',
  'help.guide.log-day.tip.2':
    'Xanadakı mavi nöqtə həmin günün səyahətlərinizdən birinə düşdüyünü bildirir. Belə ki, məzuniyyətlə səfərin harada üst-üstə düşdüyünü görürsünüz.',

  // half-day
  'help.guide.half-day.title': 'Yarım gün qeyd etmək',
  'help.guide.half-day.goal': 'Günortadan sonra istirahət edin və məzuniyyət hüququnuzdan yalnız yarım gün xərcləyin.',
  'help.guide.half-day.step.1':
    'Alətlər panelində «Yarım gün» açarını yandırın. Cədvəldə yarım günü onun narıncı nöqtəsi göstərir.',
  'help.guide.half-day.step.2': 'Bir günə klikləyin. Gün 0,5 kimi qeyd olunur və küncündə narıncı nöqtə görünür.',
  'help.guide.half-day.step.3':
    'İşiniz bitəndə «Yarım gün» açarını yenidən söndürün. Fərqli tənzimləmələri olan yarım günə klikləsəniz, o, cari tənzimləmələrə keçir.',
  'help.guide.half-day.result':
    '«İstifadə edilib» 0,5 artır. «Yarım gün» və «Kompensasiya / çevik gün» bir-birindən asılı deyil, ona görə yarım kompensasiya günü də qeyd edə bilərsiniz.',
  'help.guide.half-day.tip.1':
    'Alətlər panelində həmişə növbəti klikin qoyacağı işarə görünür, ona görə qeyd etməzdən əvvəl yoxlaya bilərsiniz.',

  // comp-day
  'help.guide.comp-day.title': 'Kompensasiya günü və ya çevik vaxt qeyd etmək',
  'help.guide.comp-day.goal': 'Məzuniyyət günlərinizə toxunmadan əvəzində istirahət günü götürün.',
  'help.guide.comp-day.step.1':
    'Alətlər panelində «Kompensasiya / çevik gün» açarını yandırın. Cədvəldə kompensasiya gününü ştrixli dairə göstərir.',
  'help.guide.comp-day.step.2': 'Bir günə klikləyin. Gün tam rəng əvəzinə sizin rənginizdə diaqonal xətlərlə dolur.',
  'help.guide.comp-day.result':
    'Kompensasiya günləri məzuniyyət hüququ xanalarının yanında sayılır və «Qalıb» göstəricisini heç vaxt azaltmır.',
  'help.guide.comp-day.tip.1':
    'Bunu istirahətlə əvəzlədiyiniz əlavə iş saatları, çevik iş qrafiki və ya əvəzedici istirahət günü üçün istifadə edin: məzuniyyət olmayan istənilən istirahət.',

  // entitlement
  'help.guide.entitlement.title': 'Məzuniyyət limitini təyin etmək',
  'help.guide.entitlement.goal': 'Vacay-a ildə neçə məzuniyyət gününüz olduğunu bildirin.',
  'help.guide.entitlement.step.1':
    'Yan paneldəki «Məzuniyyət limiti» kartında öz sətrinizdəki «Gün» xanasına klikləyin. Kart yığılıbsa, açmaq üçün başlığına klikləyin.',
  'help.guide.entitlement.step.2':
    'Gün sayını yazın və Enter düyməsini basın. Köhnə dəyəri saxlamaq üçün Escape basın.',
  'help.guide.entitlement.result':
    '«Qalıb» göstəricisi məzuniyyət hüququnuz, keçirilən günlər və istifadə etdiyiniz günlər əsasında yenidən hesablanır.',
  'help.guide.entitlement.tip.1':
    'Hər ilin öz məzuniyyət limiti var, ona görə burada etdiyiniz dəyişiklik yalnız seçilmiş ilə aiddir.',

  // years
  'help.guide.years.title': 'İl əlavə etmək və illər arasında keçmək',
  'help.guide.years.goal': 'Gələn ili indidən planlaşdırın və ya keçən ilə baxın.',
  'help.guide.years.step.1':
    'Növbəti ili əlavə etmək üçün ilin sağındakı +, əvvəlki il üçün isə soldakı + işarəsinə klikləyin.',
  'help.guide.years.step.2': 'İllər arasında oxlarla və ya altındakı il düymələri ilə keçin.',
  'help.guide.years.step.3':
    'İli silmək üçün kursoru onun nişanının üzərinə aparın və kiçik mənfi işarəsinə klikləyin. Bu zaman ilin bütün qeydləri də silinir, ona görə diqqətlə təsdiqləyin.',
  'help.guide.years.result':
    'Hər ilin öz məzuniyyət hüququ və qeydləri var. Keçirilən günlər bir ili növbəti ilə bağlayır.',

  // company-holidays
  'help.guide.company-holidays.title': 'Şirkət tətillərini qeyd edin',
  'help.guide.company-holidays.goal':
    'Bütün şirkətin istirahət etdiyi günləri bloklayın, heç kimin məzuniyyət günlərindən çıxılmasın.',
  'help.guide.company-holidays.step.1':
    'Tənzimləmələri açın və «Şirkət tətilləri» funksiyasının aktiv olduğunu yoxlayın. Standart olaraq aktivdir. Alətlər panelində bu rejim yalnız o aktiv olanda görünür.',
  'help.guide.company-holidays.step.2': 'Cədvələ qayıdıb alətlər panelini «Şirkət tətili» rejiminə keçirin.',
  'help.guide.company-holidays.step.3':
    'Günlərə klikləyin. Onlar sarı olur və izahatda görünür. Günü təmizləmək üçün ona yenidən klikləyin.',
  'help.guide.company-holidays.result':
    'Şirkət tətillərini plana birləşdirilmiş hər kəs görür və onlar «Qalıb» göstəricisini heç vaxt azaltmır.',
  'help.guide.company-holidays.tip.1':
    'Birləşdirilmiş plandakı hər kəs şirkət tətillərini redaktə edə bilər, ona görə onlara kimin baxacağını əvvəlcədən razılaşdırın.',

  // public-holidays
  'help.guide.public-holidays.title': 'Rəsmi bayramları göstərmək',
  'help.guide.public-holidays.goal': 'Ölkənizin və ya regionunuzun rəsmi bayramlarını cədvəldə göstərin.',
  'help.guide.public-holidays.step.1': 'Tənzimləmələri açın və «Rəsmi bayramlar» açarını yandırın.',
  'help.guide.public-holidays.step.2':
    '«Təqvim əlavə et» düyməsinə klikləyin, sonra ölkəni, lazım olsa, regionu seçin. Ona rəng və etiket də verə bilərsiniz. Sonra «Əlavə et» düyməsinə klikləyin.',
  'help.guide.public-holidays.step.3': 'Tənzimləmələri bağlayın. Bayramlar cədvəldə və izahatda görünür.',
  'help.guide.public-holidays.result':
    'Rəsmi bayramlar təqvimin rəngi ilə işarələnir və heç vaxt məzuniyyət günlərinizdən çıxılmır.',
  'help.guide.public-holidays.tip.1':
    'Bir neçə təqvim əlavə edə bilərsiniz, məsələn, öz regionunuzun və plana birləşdirilmiş həmkarınızın regionunun təqvimini.',

  // school-holidays
  'help.guide.school-holidays.title': 'Məktəb tətillərini göstərmək',
  'help.guide.school-holidays.goal': 'Regionunuzun məktəb tətillərini öz istirahət günlərinizlə yanaşı görün.',
  'help.guide.school-holidays.step.1': '«Tənzimləmələr»i açın və «Məktəb tətilləri»ni aktiv edin.',
  'help.guide.school-holidays.step.2':
    '«Təqvim əlavə et» düyməsinə klikləyin və ölkəni seçin. Ölkənin təqvimi bölgələrə ayrılırsa, bölgəni və ya qrupu da seçin, sonra «Əlavə et» düyməsinə klikləyin.',
  'help.guide.school-holidays.step.3':
    '«Tənzimləmələr»i bağlayın. Məktəb tətilləri təqvimdə həmin təqvimin rəngi ilə kölgələnir və günlərinin aşağısında rəngli zolaq görünür.',
  'help.guide.school-holidays.result':
    'Məktəb tətilləri yalnız təqvimdə göstərilir: heç kimin məzuniyyət limitindən gün çıxmır.',
  'help.guide.school-holidays.tip.1':
    'Regionunuz siyahıda yoxdur? Administrator məktəb tətillərini «Administrator», «Fərdiləşdirmə», «Məktəb tətilləri» bölməsində əl ilə daxil edə bilər.',

  // weekends
  'help.guide.weekends.title': 'Həftəsonlarını bağlayın və həftənin ilk gününü seçin',
  'help.guide.weekends.goal': 'Həftəsonlarını hesabdan çıxarın və həftəni istədiyiniz gündən başladın.',
  'help.guide.weekends.step.1': '«Tənzimləmələr» bölməsini açın.',
  'help.guide.weekends.step.2':
    '«Həftəsonlarını blokla» açarını yandırın, sonra «Həftəsonu günləri» altında həftəsonu sayılan günləri seçin.',
  'help.guide.weekends.step.3': '«Həftənin başlanğıcı» altında «B.e» və ya «Baz» seçin.',
  'help.guide.weekends.result': 'Bloklanmış günlər cədvəldə boz rəngdə görünür və onları səhvən qeyd etmək olmur.',

  // leave-year
  'help.guide.leave-year.title': 'Məzuniyyət ilini təyin edin',
  'help.guide.leave-year.goal':
    'Məzuniyyət limitinizi yanvardan dekabra deyil, maliyyə ili üzrə və ya işə başladığınız tarixdən hesablayın.',
  'help.guide.leave-year.step.1': 'Tənzimləmələri açın və «Məzuniyyət ili» bölməsini tapın.',
  'help.guide.leave-year.step.2':
    '«Təqvim», «Maliyyə ili» (başladığı ay və gün ilə) və ya «İşə qəbul tarixi» (işə qəbul olunduğunuz tarix ilə) seçin.',
  'help.guide.leave-year.result':
    'Məzuniyyət limiti, istifadə olunmuş günlər və keçirilən günlər həmin dövr üçün hesablanır, təqvim şəbəkəsi də onun ilk ayından başlayır.',
  'help.guide.leave-year.tip.1':
    'Bu tənzimləmə şəxsidir: birləşdirilmiş planda hər kəsin öz məzuniyyət ili və öz rəqəmləri qalır.',

  // carry-over
  'help.guide.carry-over.title': 'İstifadə olunmamış günləri növbəti ilə keçirmək',
  'help.guide.carry-over.goal': 'Dövrün sonunda qalan günləri növbəti dövrə keçirin.',
  'help.guide.carry-over.step.1': 'Tənzimləmələri açın.',
  'help.guide.carry-over.step.2': '«Növbəti ilə keçir» açarını yandırın.',
  'help.guide.carry-over.result':
    'Keçirilən günlər bütün illəriniz üzrə yenidən hesablanır və məzuniyyət hüququnun altında göstərilir.',
  'help.guide.carry-over.tip.1': 'Bunu söndürsəniz, bütün keçirilən qalıqlar sıfırlanır.',

  // invite
  'help.guide.invite.title': 'Kiminləsə birgə planlaşdırmaq',
  'help.guide.invite.goal':
    'Planınızı başqa bir TREK istifadəçisinin planı ilə birləşdirin ki, hər ikiniz istirahət günlərinizi eyni cədvəldə görəsiniz.',
  'help.guide.invite.step.1': '«Nəfər» kartında insan işarəsinə klikləyin.',
  'help.guide.invite.step.2': 'İstifadəçini seçin və «Dəvət göndər» düyməsinə klikləyin.',
  'help.guide.invite.step.3':
    'Şəxs bildiriş alır və Vacay-i növbəti dəfə açdıqda «Birləşdirmə sorğusu» görür. O vaxta qədər dəvət gözləyən kimi göstərilir; ləğv etmək üçün kursoru onun üzərinə gətirin.',
  'help.guide.invite.result':
    'Hər iki plan birləşir: hər kəsin öz rəngi olur, bir-biriniz üçün gün qeyd edə bilirsiniz və hər şey canlı sinxronlaşır.',
  'help.guide.invite.tip.1':
    'Birləşdirməni geri qaytarmaq üçün «Tənzimləmələr»də «Ayır» düyməsinə klikləyin. Hər kəsin qeydləri öz planına qayıdır.',
  'help.guide.invite.tip.2':
    'Qarşı tərəf yalnız sizin günlərinizi görməlidirsə, təqvimləri birləşdirməyin, təqviminizi paylaşın.',

  // share-calendar
  'help.guide.share-calendar.title': 'Təqviminizi yalnız baxış üçün paylaşın',
  'help.guide.share-calendar.goal':
    'Kiminsə nə vaxt istirahətdə olduğunuzu görməsinə icazə verin, amma planınızı dəyişməsinə yox.',
  'help.guide.share-calendar.step.1': '«Paylaşılan təqvimlər» kartında paylaşma işarəsinə klikləyin.',
  'help.guide.share-calendar.step.2':
    'İstifadəçini seçin və «Paylaş» düyməsini klikləyin. Qarşı tərəfin təsdiqi tələb olunmur.',
  'help.guide.share-calendar.step.3':
    'Sizinlə paylaşılan təqvimlər kartın yuxarısında görünür: gizlətmək və ya göstərmək üçün birinə klikləyin, silmək üçün isə kursoru üzərinə gətirib x işarəsinə klikləyin. «Paylaşdığınız şəxslər» altında kursoru ada gətirin və «Paylaşımı dayandır» düyməsinə klikləyin.',
  'help.guide.share-calendar.result':
    'İstirahət günləriniz onların cədvəlində rəngli halqa kimi görünür. Paylaşdığınız heç nəyi onlar dəyişə bilməz.',
  'help.guide.share-calendar.tip.1':
    'Paylaşım və birləşmə bir-birindən asılı deyil: bir nəfərlə birləşib başqaları ilə paylaşa bilərsiniz.',
  'help.guide.share-calendar.tip.2':
    'Kimin və nə qədər istirahətdə olduğunu görmək üçün kursoru halqalı günün üzərinə gətirin.',

  // ── Screen: atlas ──────────────────────────────────────────────────────────
  'help.ctx.atlas.title': 'Atlas',
  'help.ctx.atlas.summary':
    'Atlas harada olduğunuzu dünya xəritəsində göstərir: səyahətlə getdiyiniz hər ölkə rənglənir, TREK-dən əvvəl olduğunuz ölkələri isə əllə əlavə edə bilərsiniz. Regionları görmək üçün xəritəni yaxınlaşdırın, hələ görmək istədiyiniz yerlərin arzu siyahısını tutun və rəqəmlərinizi aşağıdakı şüşə paneldə izləyin.',
  'help.ctx.atlas.bullet.1':
    'Xəritə: ziyarət etdiyiniz hər ölkənin öz sabit rəngi var, planlaşdırılan ölkələr qırıq konturla, arzu siyahısındakı ölkələr diaqonal xətlərlə, qalan bütün ölkələr isə boz rəngdə göstərilir. Ölkənin səyahətlərini, məkanlarını, ilk və son ziyarətini görmək üçün kursoru onun üzərinə aparın.',
  'help.ctx.atlas.bullet.2':
    'Yuxarıdakı axtarış: ölkə və ya yer adı yazın. Olmadığınız ölkə üçün onun pəncərəsi açılır. Olduğunuz ölkə üçün paneldə kartı görünür. Yer seçsəniz, xəritə onun regionunu açır ki, onu işarələyə biləsiniz.',
  'help.ctx.atlas.bullet.3':
    '«Planlaşdırılan ölkələri göstər», sağ yuxarıda: qarşıdakı səyahətlərinizin ölkələrini göstərir. Bu açar yalnız belə səyahətləriniz olanda görünür.',
  'help.ctx.atlas.bullet.4':
    'Aşağıdakı panel: «Statistika» vərəqi ölkələri (yanında planlaşdırılanlar), regionları, səyahətləri, məkanları, şəhərləri, günləri, qitələri, ardıcıllıq seriyanızı və bu ilin səyahətlərini göstərir; «Arzular siyahısı» vərəqində hələ getmək istədiyiniz yerlər var; Turlar əlavəsi aktivdirsə, «Turlar» vərəqi keçdiyiniz turların məsafəsini və qalxışını göstərir.',
  'help.ctx.atlas.bullet.5':
    'Regionlar: xəritəni yaxınlaşdırdıqda ştatlar və vilayətlər görünür. Birini işarələmək, işarəni götürmək və ya arzular siyahısına əlavə etmək üçün ona klikləyin.',
  'help.ctx.atlas.bullet.6':
    'Dawarich: əlavə qoşulduqda statistikanın solundakı panel arzuları yerinə yetirilmiş kimi işarələyir və qeydlərinizdən ölkələr əlavə edir. Bunu yalnız siz təsdiqlədikdən sonra edir.',
  // mark-country
  'help.guide.mark-country.title': 'Ölkəni ziyarət edilmiş kimi işarələyin',
  'help.guide.mark-country.goal':
    'TREK-dən əvvəl getdiyiniz ölkəni əlavə edin ki, xəritə və sayınız onu da nəzərə alsın.',
  'help.guide.mark-country.step.1': 'Ölkənin adını xəritənin yuxarısındakı axtarış xanasına yazın.',
  'help.guide.mark-country.step.2': 'Onu siyahıdan seçin. Xəritə həmin ölkəyə keçir və onun üçün pəncərə açılır.',
  'help.guide.mark-country.step.3': '«Ziyarət edilib kimi işarələ» bəndini seçin.',
  'help.guide.mark-country.result':
    'Ölkə xəritədə rənglənir və «Ölkə» sayğacı bir vahid artır. Bu rəng sabitdir: yeni ölkələr işarələdikdə digər ölkələrin rəngləri olduğu kimi qalır.',
  'help.guide.mark-country.tip.1':
    'Xəritədə boz ölkəyə klikləsəniz, eyni pəncərə açılır. Kiçik ölkələr üçün axtarış daha etibarlıdır.',
  'help.guide.mark-country.tip.2':
    'Əl ilə işarələdiyiniz ölkə, oraya gedən səyahətlərin tarixlərindən asılı olmayaraq, həmişə ziyarət edilmiş sayılır.',
  // unmark-country
  'help.guide.unmark-country.title': 'Qeyd etdiyiniz ölkəni silin',
  'help.guide.unmark-country.goal': 'Əl ilə işarələdiyiniz ölkəni xəritədən çıxarın.',
  'help.guide.unmark-country.step.1':
    'Ölkəni axtarıb seçin və ya xəritədə onun üzərinə klikləyin. Özünüz işarələdiyiniz ölkədə pəncərə onu silmək istəyib-istəmədiyinizi soruşur.',
  'help.guide.unmark-country.step.2': '«Sil» düyməsi ilə təsdiqləyin.',
  'help.guide.unmark-country.result': 'Ölkə yenidən boz rəngə dönür və artıq sayılmır.',
  'help.guide.unmark-country.tip.1':
    'Bu yolla yalnız əl ilə işarələdiyiniz ölkələri silmək olar. Səyahətləri və ya məkanları olan ölkə həmin səyahətlər və ya məkanlar silinənədək işarəli qalır. Əl ilə işarələdiyiniz ölkə üçün «Sil» düyməsi paneldəki ətraflı kartda da var.',
  // country-details
  'help.guide.country-details.title': 'Ölkədə nələr etdiyinizə baxın',
  'help.guide.country-details.goal': 'Getdiyiniz ölkəni açın və sizi ora aparan səyahətlərə keçin.',
  'help.guide.country-details.step.1': 'Xəritənin yuxarısındakı axtarış sahəsinə olduğunuz ölkənin adını yazın.',
  'help.guide.country-details.step.2':
    'Ölkəni seçin. Xəritə ora keçir və aşağıdakı paneldə kart görünür. Kartda ölkənin bayrağı, məkanları, səyahətləri və ziyarət edilmiş regionları üçün nişanlar, ilk üç səyahətinin hər biri üçün isə bir düymə var.',
  'help.guide.country-details.result': 'Səyahəti planlayıcıda açmaq üçün onun çipinə klikləyin.',
  'help.guide.country-details.tip.1':
    'Kursoru xəritədə ölkənin üzərinə gətirəndə eyni rəqəmlərlə yanaşı ilk və son səfər də görünür.',
  // planned-countries
  'help.guide.planned-countries.title': 'Gedəcəyiniz ölkələri göstərmək',
  'help.guide.planned-countries.goal':
    'Qarşıdakı səyahətlərinizin ölkələrini ziyarət edilmiş saymadan xəritədə göstərin.',
  'help.guide.planned-countries.step.1':
    'Sağ yuxarıda «Planlaşdırılan ölkələri göstər» açarını yandırın. Yanındakı rəqəm neçə planlaşdırılan ölkə olduğunu göstərir.',
  'help.guide.planned-countries.step.2':
    'Planlaşdırdığınız ölkəni axtarıb seçin: paneldə «Planlaşdırılıb» yazılır, xəritədəki ipucu isə nə vaxt gedəcəyinizi göstərir.',
  'help.guide.planned-countries.result':
    'Planlaşdırılan ölkələr qırıq xətli konturla göstərilir, ona görə getdiyiniz ölkələrlə qarışmır. Açar seçiminizi yadda saxlayır.',
  'help.guide.planned-countries.tip.1':
    'Ölkəyə səyahət başlayan kimi ölkə ziyarət edilmiş sayılır. Davam edən səyahət də sayılır. Tarixi olmayan səyahətlər statistikaya ümumiyyətlə daxil edilmir.',
  'help.guide.planned-countries.tip.2': 'Bu açar yalnız qarşıdakı səyahətləriniz olanda görünür.',
  // regions
  'help.guide.regions.title': 'Regionu işarələmək',
  'help.guide.regions.goal': 'Təkcə ölkələri deyil, olduğunuz ştatları, əyalətləri və ya prefekturaları da işarələyin.',
  'help.guide.regions.step.1':
    'Ştatların və vilayətlərin sərhədləri görünənə qədər ölkəyə yaxınlaşın. Ölkəni axtarıb seçsəniz, xəritə kifayət qədər yaxınlaşır.',
  'help.guide.regions.step.2':
    'Regiona klikləyin. Kursoru regionun üzərinə apardıqda onun adı görünür. Açılan pəncərədə region və onun ölkəsi göstərilir.',
  'help.guide.regions.step.3': '«Ziyarət edilib kimi işarələ»ni seçin.',
  'help.guide.regions.result':
    'Region ölkənin rənginə boyanır. Ölkə hələ qeyd olunmayıbsa, regionu qeyd etdikdə ölkə də getdiyiniz ölkələrə əlavə olunur.',
  'help.guide.regions.tip.1':
    'Ziyarət edilmiş regiona kliklədikdə «Sil» seçimi çıxır: regionu özünüz işarələmisinizsə də, o hansısa məkana görə əlavə olunubsa da.',
  'help.guide.regions.tip.2':
    'Real məkanlarınız olan regionlar avtomatik işarələnir. Onlar üçün heç nə etməli deyilsiniz.',
  // search-place
  'help.guide.search-place.title': 'Məkanı tapıb regionunu işarələmək',
  'help.guide.search-place.goal': 'Şəhərin hansı regionda olduğunu bilmədən Münhen axtarmaqla Bavariyanı işarələyin.',
  'help.guide.search-place.step.1':
    'Axtarış sahəsinə şəhər, görməli yer və ya ünvan yazın. Əvvəlcə ölkələr çıxır, uyğun yerlər isə onların altında «Məkan» bölməsində görünür.',
  'help.guide.search-place.step.2':
    'Məkanı seçin. Xəritə oraya keçir və həmin nöqtənin hansı regionda olduğunu müəyyən edir.',
  'help.guide.search-place.step.3':
    'Həmin region üçün «Ziyarət edilib kimi işarələ»ni, hələ orada olmamısınızsa, «Arzular siyahısına əlavə et»i seçin.',
  'help.guide.search-place.result':
    'Region qeyd olunur, onunla birlikdə ölkə də. Xəritə paketində region məlumatı olmayan ölkələrdə isə ölkənin özü qeyd olunur.',
  'help.guide.search-place.tip.1':
    'Məkanlar TREK-in hər yerində işləyən eyni axtarışdan gəlir, yəni administratorunuzun qurduğu provayderdən istifadə edir.',
  // bucket-country
  'help.guide.bucket-country.title': 'Ölkəni arzu siyahısına əlavə edin',
  'help.guide.bucket-country.goal':
    'Getmək istədiyiniz ölkələrin siyahısını ziyarət etdiyiniz ölkələrdən ayrıca xəritədə saxlayın.',
  'help.guide.bucket-country.step.1': 'Ölkəni axtarıb seçin və ya xəritədə üzərinə klikləyin.',
  'help.guide.bucket-country.step.2': '«Arzular siyahısına əlavə et» seçimini edin.',
  'help.guide.bucket-country.step.3':
    'Nə vaxt gedəcəyinizi artıq bilirsinizsə, ay və il seçin, sonra «Arzular siyahısına əlavə et» ilə təsdiqləyin.',
  'help.guide.bucket-country.result':
    'Ölkə getdikdən sonra alacağı rəngdə çəp xətlərlə göstərilir və paneldəki «Arzular siyahısı» tabında görünür.',
  'help.guide.bucket-country.tip.1':
    'Ölkə siyahıya düşəndən sonra həmin pəncərədə «Arzular siyahısından sil» seçimi çıxır.',
  'help.guide.bucket-country.tip.2':
    'Hər hədəf tarixə bir qeyd: eyni ölkə siyahıda iki fərqli ay üçün ola bilər, eyni ay üçün isə iki dəfə yox.',
  // bucket-place
  'help.guide.bucket-place.title': 'Məkanı arzu siyahısına əlavə etmək',
  'help.guide.bucket-place.goal':
    'Getmək istədiyiniz şəhəri, görməli yeri və ya ünvanı koordinatları və hədəf tarixi ilə yadda saxlayın.',
  'help.guide.bucket-place.step.1': 'Aşağıdakı paneldə «Arzular siyahısı» bölməsini açın.',
  'help.guide.bucket-place.step.2': '«Məkan əlavə et» düyməsinə klikləyin.',
  'help.guide.bucket-place.step.3':
    'Adı yazın və axtarış düyməsini basın; məkanın koordinatları olsun deyə uyğun nəticəni seçin. Adı yazıb axtarışsız da keçə bilərsiniz.',
  'help.guide.bucket-place.step.4': 'İstəsəniz, ay və il seçin, sonra «Əlavə et» düyməsinə klikləyin.',
  'help.guide.bucket-place.result':
    'Məkan hədəf tarixi ilə birlikdə arzular siyahınızın yuxarısında görünür. Onu silən × işarəsini görmək üçün kursoru üzərinə gətirin.',
  'help.guide.bucket-place.tip.1':
    'Dawarich arzunu sonradan yalnız onun koordinatları varsa tamamlanmış kimi işarələyə bilər. Bunu qeydləriniz orada olduğunuzu göstərəndə edir.',
  // stats
  'help.guide.stats.title': 'Statistikanızı oxumaq',
  'help.guide.stats.goal': 'Paneldəki rəqəmlərin nəyi saydığını və nəyi saymadığını öyrənin.',
  'help.guide.stats.step.1':
    '«Ölkə» əslində olduğunuz fərqli ölkələrin sayıdır. Planlaşdırılan ölkələr rəqəmin altında göstərilir və ona daxil edilmir. «Region» olduğunuz ştatları və vilayətləri sayır. «Səyahət», «Məkan» və «Gün» bütün səyahətlərinizin cəmidir. «Şəhər» məkanlarınızın ünvanlarından hesablanır, ona görə təxminidir.',
  'help.guide.stats.step.2':
    'Qitələr bölməsində hər qitə üzrə ziyarət etdiyiniz ölkələr göstərilir. Antarktida yalnız orada olduqdan sonra sırada görünür. Sonra seriyanız (ən azı bir səyahət olan ardıcıl illər) və bu il neçə səyahət etdiyiniz gəlir.',
  'help.guide.stats.result':
    'Səyahətlərinizi planlaşdırdıqca rəqəmlər avtomatik yenilənir. Burada heç nəyi əl ilə izləmək lazım deyil.',
  'help.guide.stats.tip.1':
    'Şəhərlər ayrıca axtarılmır, ünvan mətnindən götürülür. Ona görə “Osteria Francescana, Italy” kimi qısa ünvan və ya prefektura ilə bitən ünvan şəhər yox, region kimi sayıla bilər.',
  'help.guide.stats.tip.2':
    'Əl ilə işarələdiyiniz ölkələr «Ölkə» sayına və qitələrə daxil olur, amma səyahət, məkan və ya gün artırmır.',

  // dawarich-countries
  'help.guide.dawarich-countries.title': 'Qeydlərinizdən ölkələr əlavə edin',
  'help.guide.dawarich-countries.goal':
    'Son bir ildə hansı ölkələrdə olduğunuzu Dawarich ilə öyrənin və təsdiqlədiklərinizi xəritəyə əlavə edin.',
  'help.guide.dawarich-countries.step.1':
    'Dawarich əlavəsi qoşulanda xəritənin aşağısında, statistikanın solunda iki xanalı Dawarich paneli görünür. «Ölkə» xanasına klikləyin.',
  'help.guide.dawarich-countries.step.2':
    'Pəncərə «Ölkə» bölməsində açılır. «Ölkələri axtar» düyməsinə klikləyin: TREK qeydlərinizin son 12 ayda əhatə etdiyi ölkələri və şəhərləri ay-ay oxuyur, ona görə bu bir az vaxt ala bilər. Atlasınızda hələ olmayan hər ölkə bayrağı, şəhərlərin sayı və ilk şəhərin adı ilə siyahıda göstərilir. Hər ölkə əvvəlcədən işarələnib. Ölkəni çıxarmaq üçün onun sətrinə klikləyin.',
  'help.guide.dawarich-countries.step.3':
    'Sağ aşağıdakı düymə ilə təsdiqləyin: beş sətir seçiləndə onun üzərində «5 ölkə əlavə et» yazılır. Pəncərə neçə ölkənin əlavə olunduğunu bildirir. Onu bağlayanda xəritə artıq yenilənmiş olur.',
  'help.guide.dawarich-countries.result':
    'Təsdiqlədiyiniz ölkələr xəritədə rənglənir və «Ölkə» sayına əlavə olunur, mənbə kimi Dawarich qeyd edilir. Əl ilə qeyd etdiyiniz ölkələr dəyişmir.',
  'help.guide.dawarich-countries.tip.1':
    'Atlasda artıq ziyarət edilmiş kimi görünən ölkələr (əl ilə, səyahət vasitəsilə və ya əvvəlki yoxlamada işarələnənlər) buraya düşmür, belə ki, öz işarələriniz heç vaxt dəyişmir. Əvvəllər Atlasdan sildiyiniz ölkəni burada təsdiqləsəniz, o yenidən əlavə olunur.',
  'help.guide.dawarich-countries.tip.2':
    'TREK ölkə adını tanıya bilməsə, ad atılmır, sətirlərin altında göstərilir. «Yenidən yoxla» Dawarich-dən məlumatı bir daha soruşur. Siyahının altındakı qeyd son 12 ayın yoxlandığını bildirir. Bu müddəti dəyişmək olmur.',
  // dawarich-wishes
  'help.guide.dawarich-wishes.title': 'Qeydlərinizə əsasən arzuları yerinə yetirilmiş kimi işarələmək',
  'help.guide.dawarich-wishes.goal':
    'Arzu siyahınızdakı hansı yerlərə həqiqətən çatdığınızı öyrənin və onları çatdığınız tarixlə birlikdə çatılmış kimi işarələyin.',
  'help.guide.dawarich-wishes.step.1':
    'Xəritənin aşağısındakı Dawarich panelində, statistikanın solunda «Arzular siyahısı» düyməsinə klikləyin.',
  'help.guide.dawarich-wishes.step.2':
    'Pəncərə «Arzular siyahısı» bölməsində açılır. «Arzular siyahısını yoxla» düyməsinə klikləyin: TREK koordinatı olan hər qeyd üçün yazılarınızı yoxlayır. Çatdığınız arzu nə qədər yaxınlaşdığınız, nə qədər qaldığınız və hansı gün olduğu ilə siyahıda görünür və avtomatik seçilmiş olur. Artıq işarələdiyiniz arzunun yanında «Artıq tamamlandı kimi işarələnib» yazılır. Siyahının altındakı qeyd koordinatsız qeydlərin sayını və qaydanı göstərir: arzu 250 m məsafədə və yerində 20 dəqiqə qaldıqdan sonra çatılmış sayılır.',
  'help.guide.dawarich-wishes.step.3':
    'Sağ aşağıdakı düymə ilə təsdiqləyin: iki sətir seçiləndə onun üzərində «2 arzunu işarələ» yazılır. Sonra pəncərəni bağlayın və yanındakı paneldə «Arzular siyahısı» tabını açın.',
  'help.guide.dawarich-wishes.result':
    'Hər arzunun yanında bugünkü tarixlə deyil, səfər tarixi ilə yaşıl işarə görünür. Onun ipucunda «Dawarich qeydlərinizə əsasən tamamlandı kimi işarələnib» yazılır. Bunu geri qaytarmaq üçün tarixə klikləyin.',
  'help.guide.dawarich-wishes.tip.1':
    'Yanından ötüb keçmək sayılmır: məkana yaxın olmalı və orada bir müddət qalmalısınız. Uyğun gələn bir neçə qalma varsa, ən uzunu götürülür. Koordinatı olmayan arzunu yoxlamaq mümkün deyil, ona görə məkanları sadəcə adla yox, «Məkan əlavə et» bölməsindəki axtarışla əlavə edin.',
  'help.guide.dawarich-wishes.tip.2':
    'Bir yoxlama ən çox 50 qeydə baxır, hələ işarələnməmişlərdən başlayaraq. Daha çox qeyd varsa, TREK bunu sizə bildirir. Artıq işarələnmiş arzu öz tarixini saxlayır.',
  // ── Screen: collections ────────────────────────────────────────────────────
  'help.ctx.collections.title': 'Kolleksiyalar',
  'help.ctx.collections.summary':
    '«Kolleksiyalar» hər hansı səyahətdən kənar kitabxananızdır: tapdığınız və saxlamaq istədiyiniz yerlərin adlı siyahıları, hər yer «İdeya», «Getmək istəyirəm» və ya «Ziyarət edilib» vəziyyəti ilə, Turlar aktivdirsə, səyahətdən saxladığınız bütöv turlar da. Yerlər və turlar səyahətlərə və səyahətlərdən kopyalanır, heç vaxt bağlanmır, ona görə siyahı və səyahət bir-birini heç vaxt dəyişmir.',
  'help.ctx.collections.bullet.1':
    'Soldakı siyahılar sütununda öz siyahılarınız, sizinlə paylaşılan siyahılar, hələ cavab vermədiyiniz dəvətlər və sizə məxsus siyahılardakı hər şeyi birləşdirən «Bütün saxlanılanlar» var. «Yeni siyahı» və fayldan idxal yuxarıdadır.',
  'help.ctx.collections.bullet.2':
    'Açıq siyahının başlığında onun rəngi, üz şəkli, təsviri və linkləri, üzvləri, sağda isə «Redaktə et» (yalnız sahib üçün), «İxrac et» və «Paylaş» düymələri var. Sizinlə paylaşılan siyahıda «Paylaş» düyməsində «Paylaşılan» yazılır.',
  'help.ctx.collections.bullet.3':
    'Məkanların üstündəki filtr sətri: məkan əlavə etmək üçün +, «Vəziyyət», «Kateqoriya», «Reytinq» və «Sırala» siyahıları, «Seç» üçün işarə qutusu və «Səyahətdən idxal et» üçün bulud işarəsi. Etiket filtri bu sətirdə yalnız xəritə göstərilmədikdə görünür.',
  'help.ctx.collections.bullet.4':
    'Məkan sətirləri: foto, ad və ünvan, etiketlər və kateqoriya, sağda isə vəziyyət düyməsi. Düyməyə bir klik vəziyyəti növbətiyə keçirir.',
  'help.ctx.collections.bullet.5':
    'Sağdakı xəritə: koordinatları olan hər məkan üçün sancaq. Yuxarı panelində «Xəritəni genişləndir» (xəritə tam ekran olduqda «Siyahını göstər»), etiketləri idarə etmək düyməsi ilə etiket filtri və «Məkanları axtar» sahəsi var. Həmin məkanı açmaq üçün sancağa klikləyin.',
  'help.ctx.collections.bullet.6':
    'Məlumat vərəqi: üz şəkli, kateqoriya, vəziyyət, ulduz reytinqi, etiketlər, təsvir və linklər üçün sətrə klikləyin. Üz şəklindəki kamera fotonu dəyişir. Aşağıda «Redaktə et», «Səyahətə kopyala», naviqasiya düyməsi və «Siyahıdan sil» var.',
  // create-list
  'help.guide.create-list.title': 'Siyahı yaradın',
  'help.guide.create-list.goal': 'Adı, rəngi və üz qabığı olan yeni siyahı yaradın və məkanlarla doldurmağa başlayın.',
  'help.guide.create-list.step.1': 'Siyahılar panelinin yuxarısındakı «Yeni siyahı» düyməsinə klikləyin.',
  'help.guide.create-list.step.2':
    'Siyahıya ad verin və rəng seçin. Üzlük şəkli, təsvir və linklər məcburi deyil, onları sonra «Redaktə et» ilə əlavə edə bilərsiniz.',
  'help.guide.create-list.step.3': '«Yarat» düyməsinə klikləyin.',
  'help.guide.create-list.result':
    'Siyahı boş açılır və onu iki yolla doldura bilərsiniz: «Məkan əlavə et» və «Səyahətdən idxal et».',
  'help.guide.create-list.tip.1':
    'Üz qabığı üçün öz şəklinizi yükləyə və ya həmin pəncərədəki Unsplash axtarışı ilə şəkil tapa bilərsiniz.',
  // add-place
  'help.guide.add-place.title': 'Məkan əlavə edin',
  'help.guide.add-place.goal':
    'Məkanı tapın və adı, kateqoriyası, statusu və qeydləri ilə birlikdə bir addımda açıq siyahıya əlavə edin.',
  'help.guide.add-place.step.1':
    'Məkanların üstündəki filtr sətrinin əvvəlindəki + düyməsinə klikləyin. Hələ boş olan siyahıda səhifənin ortasındakı «Məkan əlavə et» düyməsinə klikləyin.',
  'help.guide.add-place.step.2':
    'Məkanın adını axtarış xanasına yazın və nəticələrdən birini seçin. Ad, ünvan və koordinatlar nəticədən avtomatik doldurulur.',
  'help.guide.add-place.step.3':
    'Vəziyyəti, istəsəniz kateqoriya, təsvir və linkləri təyin edin, sonra «Əlavə et» düyməsinə klikləyin. Pəncərə növbəti məkan üçün açıq qalır, «Ləğv et» onu bağlayır.',
  'help.guide.add-place.result': 'Məkan siyahıda görünür, koordinatları varsa, xəritədə də nişan kimi çıxır.',
  'help.guide.add-place.tip.1':
    'Səyahətin içində məkan təfərrüatlarındakı və ya məkan menyusundakı «Kolleksiyada yadda saxla» səyahətdən çıxmadan səyahət məkanını siyahıya əlavə edir.',
  'help.guide.add-place.tip.2':
    'Siyahı sizin olmalıdır, ya da orada redaktor və ya administrator olmalısınız; «Bütün saxlanılanlar» bölməsində və yalnız baxa bildiyiniz siyahıda + düyməsi yoxdur.',
  // import-from-trip
  'help.guide.import-from-trip.title': 'Səyahətdən məkan idxal etmək',
  'help.guide.import-from-trip.goal':
    'Məkanları bir-bir saxlamaq əvəzinə bütöv səyahətin məkanlarını bir dəfəyə siyahıya köçürün.',
  'help.guide.import-from-trip.step.1':
    'Filtr sırasındakı buludlu ox işarəli idxal düyməsinə klikləyin. Siyahı boşdursa, həmin düymə «Məkan əlavə et» düyməsinin yanındadır.',
  'help.guide.import-from-trip.step.2': 'Səyahətlərinizdən birini seçin.',
  'help.guide.import-from-trip.step.3':
    'İstədiyiniz məkanları işarələyin. Siyahıda artıq olan məkanlar boz görünür. Səyahətin heç bir gününə əlavə olunmamış məkanlar əvvəlcədən seçilir. Bütün məkanlar artıq günlərə əlavə olunubsa, bütün yeni məkanlar seçilir. «Yalnız yenilər» siyahıda artıq olan məkanları gizlədir.',
  'help.guide.import-from-trip.step.4':
    '«İdxal et» düyməsinə klikləyin. Düymədə həmişə neçə məkanın əlavə olunacağı yazılır.',
  'help.guide.import-from-trip.result':
    'Məkanlar adı, ünvanı, koordinatları, təsviri və kateqoriyası ilə siyahıya köçürülür. Səyahətin özü dəyişmir.',
  'help.guide.import-from-trip.tip.1':
    'TREK adı və ya koordinatları eyni olan təkrarları avtomatik ötürür, ona görə iki dəfə idxal etmək təhlükəsizdir.',
  'help.guide.import-from-trip.tip.2':
    'Səyahətin məkan siyahısında seçim rejimi bunun əvəzinə əl ilə seçdiyiniz məkanlar üçün «Kolleksiyada yadda saxla» təklif edir.',
  // place-status
  'help.guide.place-status.title': 'Məkanın statusunu təyin etmək',
  'help.guide.place-status.goal':
    'Nəyin sadəcə ideya olduğunu, nəyin seçilmişlər arasında olduğunu və harada olduğunuzu izləyin.',
  'help.guide.place-status.step.1':
    'Məkan sətrinin sağ ucundakı status nişanına klikləyin. «İdeya» «Getmək istəyirəm» olur.',
  'help.guide.place-status.step.2':
    '«Ziyarət edilib» üçün bir də klikləyin, «İdeya»ya qayıtmaq üçün isə yenə bir dəfə.',
  'help.guide.place-status.result':
    'Nişan və onun rəngi dərhal dəyişir, siyahının üstündəki vəziyyət filtrində saylar yenilənir.',
  'help.guide.place-status.tip.1':
    'Vəziyyət yalnız Kolleksiyalarda var. Məkanı səyahətə köçürəndə vəziyyəti köçürülmür.',
  'help.guide.place-status.tip.2':
    'Səyahətdə «Kolleksiyada yadda saxla» «Siyahıda saxla» pəncərəsini açır, məkanın olduğu hər siyahı üçün vəziyyət düyməsi göstərilir; məkanlar panelinin seçim zolağında isə «Siyahılarınızdakıları ziyarət edilib kimi işarələ» var.',
  // place-detail
  'help.guide.place-detail.title': 'Yadda saxlanmış məkanı açmaq',
  'help.guide.place-detail.goal':
    'Məkan haqqında hər şeyi və onunla nə edə biləcəyinizi görün: redaktə etmək, səyahətə köçürmək, yol tapmaq, silmək.',
  'help.guide.place-detail.step.1':
    'Məkan sətrinə klikləyin. Ətraflı panel siyahının yanında açılır, xəritə isə məkana keçir.',
  'help.guide.place-detail.step.2':
    'Aşağıda «Redaktə et», «Səyahətə kopyala», məkanı xəritə tətbiqində açan naviqasiya düyməsi və «Siyahıdan sil» var. Üz şəklindəki kamera avtomatik fotonu öz fotonuzla əvəz edir.',
  'help.guide.place-detail.result':
    '«Redaktə et» ilə adı, kateqoriyanı, etiketləri, ünvanı, koordinatları, təsviri və linkləri birbaşa paneldə dəyişə bilərsiniz.',
  'help.guide.place-detail.tip.1':
    'Məkanın öz şəkli olmadıqda üz şəkli avtomatik yüklənir. Öz yüklədiyiniz şəkil 20 MB-a qədər JPG, PNG, GIF, WebP və ya HEIC ola bilər. Kameranın yanındakı zibil qutusu avtomatik fotonu bərpa edir.',
  'help.guide.place-detail.tip.2':
    'Siz də daxil olmaqla hər üzv vəziyyətin altında ulduz reytinqi verə bilər; filtr sətrindəki «Reytinq» filtri orta dəyərdən istifadə edir.',
  // labels
  'help.guide.labels.title': 'Məkanları etiketlərlə qruplaşdırın',
  'help.guide.labels.goal':
    'Siyahıya ümumi kateqoriyalardan əlavə öz etiketlərini verin, məsələn, rayonlar və ya günlər.',
  'help.guide.labels.step.1':
    'Xəritənin üstündəki etiketlərin yanında «Etiket əlavə et» düyməsinə (siyahıda etiketlər olduqdan sonra «Etiketləri idarə et») klikləyin. Xəritə göstərilmədikdə düymə filtr sətrinin sonundadır.',
  'help.guide.labels.step.2':
    'Ad yazın, rəng seçin və «Etiket əlavə et» düyməsinə klikləyin. Mövcud etiketlərin adını, rəngini həmin pəncərədə dəyişə və ya onları silə bilərsiniz.',
  'help.guide.labels.step.3':
    '«Seç» rejimini açın, məkanları işarələyin və seçim panelində «Etiket təyin et» düyməsinə klikləyin, sonra etiketləri seçib yenə «Etiket təyin et» ilə təsdiqləyin. Tək bir məkana etiketi onun məlumat vərəqindəki «Redaktə et» vasitəsilə də əlavə edə bilərsiniz.',
  'help.guide.labels.step.4':
    'Siyahıda və xəritədə yalnız bu etiketlərdən hər hansı birinə malik məkanları görmək üçün xəritənin üstündəki bir və ya bir neçə etiketə klikləyin. Etiketi filtrdən çıxarmaq üçün ona yenidən klikləyin.',
  'help.guide.labels.result':
    'Etiketli məkanların etiketləri sətirdə görünür. Etiket filtri izləyicilər daxil olmaqla bütün üzvlər üçün əlçatandır.',
  'help.guide.labels.tip.1':
    'Etiketlər yaradıldıqları siyahıya aiddir. Məkanı başqa siyahıya köçürsəniz, onun etiketləri silinir.',
  'help.guide.labels.tip.2': 'Etiketləri idarə etmək və təyin etmək üçün siyahıda redaktə hüququnuz olmalıdır.',
  // filter-select
  'help.guide.filter-select.title': 'Məkanları filtrləyin və seçin',
  'help.guide.filter-select.goal': 'Siyahını filtrləyin və bir neçə məkanı birdən dəyişin.',
  'help.guide.filter-select.step.1':
    'Filtr sətrindəki siyahılardan istifadə edin: vəziyyət, kateqoriya, minimum reytinq və sıralama. Vəziyyət və kateqoriyada hər seçimə neçə məkanın uyğun gəldiyi göstərilir.',
  'help.guide.filter-select.step.2':
    'Siyahılardan sonrakı işarə qutusu düyməsinə, «Seç»ə klikləyin. Hər sətirdə işarə qutusu, aşağıda isə seçim paneli görünür.',
  'help.guide.filter-select.step.3':
    'Məkanları işarələyin və ya filtrin göstərdiyi bütün məkanlar üçün «Hamısını seç» istifadə edin, sonra «Etiket təyin et», «Siyahıya köçür», «Siyahıya kopyala», «Səyahətə kopyala» və ya «Sil» seçin. Köçürmə və silmədən yalnız siyahının sahibi və ya admini istifadə edə bilər.',
  'help.guide.filter-select.result':
    'Əməliyyatlar bütün seçilənlərə birdən tətbiq olunur. Sağdakı × seçim rejimini bağlayır.',
  'help.guide.filter-select.tip.1':
    '«Hamısını seç» yalnız filtrə uyğun məkanları seçir. Bütün «Getmək istəyirəm» məkanları ilə işləmək üçün «Getmək istəyirəm» üzrə filtrləyin və «Hamısını seç» düyməsinə klikləyin.',
  // copy-to-trip
  'help.guide.copy-to-trip.title': 'Məkanları səyahətə kopyalamaq',
  'help.guide.copy-to-trip.goal': 'Yadda saxlanmış məkanları səyahətlərinizdən birinə dayanacaq kimi əlavə edin.',
  'help.guide.copy-to-trip.step.1':
    '«Seç» rejimini yandırıb məkanları işarələyin və ya bir məkanı açıb ətraflı panelindəki «Səyahətə kopyala» düyməsindən istifadə edin.',
  'help.guide.copy-to-trip.step.2': 'Seçim panelində «Səyahətə kopyala» düyməsinə klikləyin.',
  'help.guide.copy-to-trip.step.3': 'Səyahəti seçin. Siyahı uzundursa, axtarış xanası ilə filtrləyin.',
  'help.guide.copy-to-trip.result':
    'Məkanlar adı, təsviri, kateqoriyası, qeydləri, qiyməti, koordinatları, fotosu və teqləri ilə həmin səyahətin məkan siyahısına əlavə olunur. Kolleksiyada heç nə dəyişmir.',
  'help.guide.copy-to-trip.tip.1':
    'Paylaşılan siyahının izləyiciləri də bunu edə bilər. Məkanlar siyahıdan kopyalanır, siyahının özü dəyişmir.',
  // share-list
  'help.guide.share-list.title': 'Siyahını kiminləsə paylaşmaq',
  'help.guide.share-list.goal': 'Siyahını bu TREK-dəki digər istifadəçilərlə birlikdə, canlı rejimdə planlaşdırın.',
  'help.guide.share-list.step.1': 'Siyahınızın başlıq hissəsində «Paylaş» düyməsinə klikləyin.',
  'help.guide.share-list.step.2': 'İstifadəçini və rolu seçin: «İzləyici», «Redaktor» və ya «Administrator».',
  'help.guide.share-list.step.3':
    '«Dəvət göndər» düyməsinə klikləyin. Şəxs dəvəti siyahılar zolağında və ya bildirişindən qəbul edənə qədər gözləyən kimi göstərilir.',
  'help.guide.share-list.result':
    'Dəvəti qəbul edəndən sonra siyahı onlarda «Paylaşılan» bölməsində görünür və hər dəyişiklik dərhal sinxronlaşır. Üzvləri və onların rollarını yenə də həmin pəncərədə dəyişə bilərsiniz.',
  'help.guide.share-list.tip.1':
    'İzləyicilər yerlərə baxa, onları qiymətləndirə və öz səyahətlərinə kopyalaya bilər. Redaktorlar yer və etiket əlavə edir və redaktə edir. Administratorlar həmçinin köçürə və silə bilər.',
  'help.guide.share-list.tip.2':
    'İnsanları yalnız sahib dəvət edə və çıxara bilər; üzv isə paylaşılan siyahıdan özü çıxa bilər.',
  // export-list
  'help.guide.export-list.title': 'Siyahını fayl kimi ixrac edin',
  'help.guide.export-list.goal': 'Siyahını başqa TREK serverindəki birinə verin və ya onu xəritə tətbiqində açın.',
  'help.guide.export-list.step.1': 'Siyahının üst hissəsində «İxrac et» düyməsini klikləyin.',
  'help.guide.export-list.step.2':
    'Siyahını etiketləri və statusu ilə başqa bir TREK-də istifadə etmək üçün «TREK siyahısı», OsmAnd, Organic Maps, Garmin və yol nöqtələrini oxuyan digər tətbiqlər üçün isə GPX seçin.',
  'help.guide.export-list.result': 'Fayl endirilir. Paylaşılan siyahının istənilən üzvü onu ixrac edə bilər.',
  'help.guide.export-list.tip.1':
    'Koordinatı olmayan məkan GPX yol nöqtəsinə çevrilə bilməz. Belə məkanlar buraxılır və TREK onların sayını bildirir.',
  'help.guide.export-list.tip.2':
    'Reytinqlər, üzvlər və yüklədiyiniz fotolar qəsdən ixrac edilmir: onlar siyahıya yox, bu TREK-ə aiddir.',
  // import-file
  'help.guide.import-file.title': 'Fayldan siyahı idxal edin',
  'help.guide.import-file.goal':
    'TREK siyahı faylını və ya GPX faylını yeni siyahı kimi və ya mövcud siyahıya idxal edin.',
  'help.guide.import-file.step.1':
    'Siyahılar panelində «Yeni siyahı» yanındakı yükləmə oxu olan idxal düyməsini klikləyin.',
  'help.guide.import-file.step.2':
    'Faylı seçin. TREK idxal etməzdən əvvəl faylda nə olduğunu göstərir: adı, neçə məkan və neçə etiket.',
  'help.guide.import-file.step.3':
    '«Yeni siyahı»nı saxlayın, istəsəniz adını dəyişin, sonra «İdxal et» düyməsinə klikləyin. Və ya yerləri redaktə edə bildiyiniz siyahıya qoymaq üçün «Siyahıya əlavə et» seçin və «Siyahıya əlavə et» düyməsinə klikləyin.',
  'help.guide.import-file.result':
    'Siyahı idxal edilmiş məkanlarla açılır. Siyahıya idxal yalnız məkan əlavə edir. Artıq orada olan məkanların statusu, qeydləri və etiketləri olduğu kimi qalır.',
  'help.guide.import-file.tip.1':
    'GPX faylında adı olan hər yol nöqtəsi məkana çevrilir. Treklər xətt olduğu üçün buraxılır, önizləmə isə bunun neçə nöqtə olduğunu göstərir.',
  'help.guide.import-file.tip.2':
    'Nə TREK siyahısı, nə də GPX olan fayl qəbul edilmir və TREK səbəbini göstərir. Hansısa məkan oxunmasa, bütün fayl yox, yalnız həmin məkan ötürülür.',
  // edit-list
  'help.guide.edit-list.title': 'Siyahını redaktə edin və ya silin',
  'help.guide.edit-list.goal':
    'Siyahının adını, rəngini, üz şəklini, təsvirini və ya linklərini dəyişin, yaxud siyahını silin.',
  'help.guide.edit-list.step.1':
    'Siyahının üst hissəsində «Redaktə et» düyməsini klikləyin. Bu düyməni yalnız sahib görür.',
  'help.guide.edit-list.step.2':
    'İstədiyinizi dəyişin və «Yadda saxla» düyməsinə klikləyin. Aşağı soldakı zibil qutusu, «Siyahını sil», təsdiqdən sonra siyahını bütün məkanları ilə birlikdə silir.',
  'help.guide.edit-list.result': 'Yuxarıdakı başlıqda yeni rəng, üz qabığı və təsvir dərhal görünür.',
  'help.guide.edit-list.tip.1':
    'Silinmiş siyahını geri qaytarmaq olmur. Nüsxəsini saxlamaq istəyirsinizsə, əvvəlcə onu ixrac edin.',
  // all-saved
  'help.guide.all-saved.title': 'Bütün kitabxananızda axtarın',
  'help.guide.all-saved.goal': 'Sahibi olduğunuz bütün siyahıların məkanlarını bir yerdə görün.',
  'help.guide.all-saved.step.1':
    'Siyahılar zolağında «Bütün saxlanılanlar» düyməsinə klikləyin. Burada sahibi və ya ortaq sahibi olduğunuz bütün siyahıların məkanları bir görünüşdə toplanır.',
  'help.guide.all-saved.step.2':
    'Xəritənin üstündəki «Məkanları axtar» sahəsinə yazın və filtrlərdən istənilən siyahıda olduğu kimi istifadə edin. «Seç» burada da işləyir: siyahılar arasında köçürmək, kopyalamaq, səyahətə köçürmək və ya silmək.',
  'help.guide.all-saved.result':
    'Burada bütün saxlanılmış məkanlarınız bir yerdə görünür. Bu görünüşdə məkan əlavə etmək və ya idxal etmək olmur, çünki onları əlavə etmək üçün konkret bir siyahı yoxdur.',
  'help.guide.all-saved.tip.1':
    'Etiketlər və saxlanmış turlar bir siyahıya aiddir, ona görə «Bütün saxlanılanlar»da heç biri təklif olunmur.',

  // ── Screen: journey ───────────────────────────────────────────────────────
  'help.ctx.journey.title': 'Səyahət gündəliyi',
  'help.ctx.journey.summary':
    'Səyahət gündəliyi fotolar üzərində qurulan səyahət jurnalınızdır. Hər gündəlik bir və ya bir neçə səyahətə bağlıdır, siz onu gün-gün hekayəsi, fotoları, əhvalı və havası olan qeydlərlə doldurursunuz. Bu ekranda gündəlikləriniz sadalanır, yazmaq üçün birini açın.',
  'help.ctx.journey.bullet.1':
    'Yuxarıdakı banner davam edən və ya ən son gündəliyinizi qeyd, foto və məkan sayları ilə göstərir. «Yazmağa davam et» onu bugünkü gündə açır. Səyahət indicə bitibsə, onun üstündəki «Səyahət indicə başa çatdı» banneri həmin səyahəti gündəliyə çevirməyi təklif edir.',
  'help.ctx.journey.bullet.2':
    '«Bütün səyahət gündəlikləri» altında hər gündəlik üçün üz şəkli, vəziyyəti, tarixləri və sayları olan bir kart var; bannerdə göstərilən gündəlik burada təkrar görünmür. Açmaq üçün karta klikləyin.',
  'help.ctx.journey.bullet.3':
    'Şəbəkədəki sonuncu kart, «Yeni səyahət gündəliyi yarat», səyahətlərinizdən yeni gündəlik başladır.',
  // create-journey
  'help.guide.create-journey.title': 'Səyahət gündəliyi yaradın',
  'help.guide.create-journey.goal':
    'Səyahət üçün gündəlik başladın, səyahətin məkanları artıq təklif kimi əlavə olunacaq.',
  'help.guide.create-journey.step.1': 'Şəbəkədəki sonuncu kart olan «Yeni səyahət gündəliyi yarat» üzərinə klikləyin.',
  'help.guide.create-journey.step.2':
    'Ona ad, istəsəniz alt başlıq verin, sonra aid olduğu səyahətləri işarələyin. Sayğac neçə məkanın əlavə olunacağını göstərir.',
  'help.guide.create-journey.step.3': '«Səyahət gündəliyi yarat» düyməsinə klikləyin.',
  'help.guide.create-journey.result':
    'Gündəlik açılır. Bağlı səyahətlərin hər məkanı zaman xəttində təklif kimi, planlaşdırıldığı hər gün üçün bir dəfə görünür. Hər biri üçün qeyd yaza bilərsiniz.',
  'help.guide.create-journey.tip.1':
    'Başqa səyahətləri sonra da «Səyahət gündəliyi tənzimləmələri» bölməsində bağlaya bilərsiniz.',
  'help.guide.create-journey.tip.2':
    'Səyahətə bağlı olmayan gündəlik də olar, bu halda qeydləri əl ilə əlavə edirsiniz.',
  // open-journey
  'help.guide.open-journey.title': 'Səyahət gündəliyini açın',
  'help.guide.open-journey.goal': 'Gündəliyi açın və onun harada açıldığını görün.',
  'help.guide.open-journey.step.1':
    'Karta klikləyin. Hər kartda üzlük, tarixlər və gündəlikdə neçə qeyd, foto və məkan olduğu görünür.',
  'help.guide.open-journey.result':
    'Davam edən gündəlik bugünkü gündə açılır, bu gün üçün hələ heç nə yazılmayıbsa, bu gündən əvvəlki son qeyddə. Bitmiş gündəlik isə əvvəldən açılır.',
  'help.guide.open-journey.tip.1':
    '«Səyahət gündəliyi tənzimləmələri» bölməsində üz şəkli təyin etməsəniz, gündəliyin ilk fotosu üz şəkli olur.',
  // continue-writing
  'help.guide.continue-writing.title': 'Cari səyahət gündəliyinə davam etmək',
  'help.guide.continue-writing.goal': 'Davam edən səyahət gündəliyinin bugünkü səhifəsini birbaşa açın.',
  'help.guide.continue-writing.step.1':
    'Yuxarıdakı bannerdə «Yazmağa davam et» düyməsinə klikləyin. Orada davam edən səyahət gündəliyi, belə yoxdursa, ən sonuncu gündəlik göstərilir.',
  'help.guide.continue-writing.result':
    'Gündəlik bu günün üzərində açılır, hələ heç nə yazılmayıbsa, bu gündən əvvəlki son qeydin üzərində.',
  'help.guide.continue-writing.tip.1':
    'Səyahət indicə bitibsə, bunun üstündə «Səyahət indicə başa çatdı» banneri görünür: «Səyahət gündəliyi yarat» həmin səyahət seçilmiş halda gündəlik başladır, «Bağla» isə təklifi bu brauzerdə gizlədir.',

  // ── Screen: journey-detail ────────────────────────────────────────────────────────────
  'help.ctx.journey-detail.title': 'Gündəlik',
  'help.ctx.journey-detail.summary':
    'Açıq səyahət gündəliyi: solda gün-gün zaman xətti, sağda isə plan, qeydə alınanlar, qeydlər və fotolar üçün qatları açılıb bağlanan xəritə. Başlıqda saylar, Studio, təkliflər açarı və «Səyahət gündəliyi tənzimləmələri» üçün ⋯ var. Qeyd əlavə etmək üçün altındakı alətlər panelindən istifadə edin.',
  'help.ctx.journey-detail.bullet.1':
    'Başlıq: geri oxu və vəziyyət nişanı, üz şəkli, başlıq və alt başlıq, gün, məkan, qeyd və foto sayları, sağda isə Studio, təklifləri gizlədən və ya göstərən göz və «Səyahət gündəliyi tənzimləmələri» üçün ⋯.',
  'help.ctx.journey-detail.bullet.2':
    'Alətlər paneli: «Zaman xətti» və «Qalereya» vərəqləri, «Bu səyahət gündəliyində axtar» və «Qeyd əlavə et». «Qalereya»da «Qeyd əlavə et» əvəzinə «Yüklə» olur.',
  'help.ctx.journey-detail.bullet.3':
    '«Zaman xətti»: hər gün üçün nömrəsi, məkan sayı və həmin günə qeyd əlavə etmək üçün + olan bölmə. Altında foto, əhval, hava və hekayə olan qeyd kartları, səyahətlərdən gələn qırıq xətli təklif kartları var, hər birində onu rədd etmək üçün × işarəsi.',
  'help.ctx.journey-detail.bullet.4':
    'Xəritə: yuxarıdakı qatlar paneli «Plan» (içi boş sancaqlar və səyahətlərin qırıq xətli GPX marşrutları), «Qeydə alınan» (Dawarich-dən saxlanmış bütöv marşrutlar), «Qeydlər» (gün rənglərində, tarix ardıcıllığı ilə nazik qırıq xətlə birləşdirilmiş sancaqlar) və «Fotolar» arasında keçid edir. Yanındakı (i) hər simvolu izah edir.',
  'help.ctx.journey-detail.bullet.5':
    '«Səyahət gündəliyi tənzimləmələri» (⋯): üz şəkli, ad və alt başlıq, vəziyyət, GPX izləri, qeydə alınmış günlər, fotolardan məkanlar, qeyd sahələri, rədd edilmiş təkliflər, sinxronlaşdırılmış səyahətlər, iştirakçılar və səyahət üzvlərindən kimin giriş əldə etdiyi, ictimai paylaşım, arxivləşdirmə və silmə.',
  'help.ctx.journey-detail.bullet.6':
    'Uzun zaman xəttinin aşağısında «Yuxarı qayıt», istənilən günə və ya qeydə keçməyə imkan verən gün sayğacı və «Sonuncu qeydə keç» var.',
  // add-entry
  'help.guide.add-entry.title': 'Qeyd yazmaq',
  'help.guide.add-entry.goal': 'Günün hekayəsini başlıq, mətn, əhval və hava ilə əlavə edin.',
  'help.guide.add-entry.step.1':
    'Alətlər panelində «Qeyd əlavə et» düyməsinə, ya da həmin gündən başlamaq üçün gün başlığının sağ tərəfindəki + işarəsinə klikləyin.',
  'help.guide.add-entry.step.2':
    'Qeydə başlıq verin və mətninizi yazın. Mətnin üstündəki alətlər paneli Markdown ilə qalın, kursiv, başlıqlar, sitatlar, linklər və siyahılar əlavə edir.',
  'help.guide.add-entry.step.3':
    'Sağ sütunda tarixi və vaxtı yoxlayın, məkan axtarın və ya cari mövqeyinizdən istifadə edin, əhvalınızı və havanı seçin.',
  'help.guide.add-entry.step.4': '«Yadda saxla» düyməsinə klikləyin.',
  'help.guide.add-entry.result':
    'Qeyd zaman xəttində öz günündə, xəritədə isə pin kimi görünür. Başlıqdakı saylar yenilənir.',
  'help.guide.add-entry.tip.1':
    'Təklifin üzərinə yazanda da eyni redaktordan istifadə edirsiniz, sadəcə məkan artıq seçilib.',
  'help.guide.add-entry.tip.2':
    'Məkanı olan qeydin «Marşruta daxil etmə» seçimi var: qeyd gündəlikdə qalır, amma məsafəyə və ölkələrə daxil edilmir və Studio-dakı xəritədə göstərilmir.',
  // entry-photos
  'help.guide.entry-photos.title': 'Qeydə foto və video əlavə edin',
  'help.guide.entry-photos.goal': 'Günə fotolar əlavə edin; birincisi qeydin üz şəkli olur.',
  'help.guide.entry-photos.step.1': 'Qeydin kartındakı ⋯ ilə menyunu açın və «Redaktə et» seçin.',
  'help.guide.entry-photos.step.2':
    '«Fotolar yüklə» düyməsinə klikləyin və faylları seçin. «Qalereyadan» gündəliyin qalereyasında olan şəkilləri götürür, «Xarici fotolar» isə qoşulmuş Immich və ya Synology kitabxanasında həmin günün şəkillərini axtarır.',
  'help.guide.entry-photos.step.3':
    'Üz qabığını seçmək üçün kursoru şəklin üzərinə gətirib «1-ci et» düyməsinə, sonra «Yadda saxla» düyməsinə klikləyin.',
  'help.guide.entry-photos.result':
    'Fotolar kartda və qalereyada görünür, birincisi hər yerdə miniatür kimi istifadə olunur.',
  'help.guide.entry-photos.tip.1':
    'Videoları da qeydə eyni qaydada əlavə edirsiniz: 500 MB-a qədər mp4, m4v, webm və ya mov. Onlar dəyişdirilmədən saxlanılır.',
  'help.guide.entry-photos.tip.2':
    'iPhone-dan gələn HEIC faylları yüklənərkən JPEG-ə çevrilir və bu zaman onların GPS və kamera metaməlumatları silinir.',
  // suggestions
  'help.guide.suggestions.title': 'Təklifləri qəbul etmək və ya rədd etmək',
  'help.guide.suggestions.goal':
    'Səyahətlərinizin məkanlarını qeydlərə çevirin, haqqında yazmayacağınızları isə kənarlaşdırın.',
  'help.guide.suggestions.step.1':
    'Təklif qırıq xətli haşiyəsi və «Qeyd əlavə et» düyməsi olan kartdır: əlaqələndirilmiş səyahətin planlaşdırıldığı gündəki məkanı. Məkan və gün artıq təyin edilmiş halda redaktoru açmaq üçün ona klikləyin.',
  'help.guide.suggestions.step.2':
    'İstifadə etməyəcəyiniz kartın sağ tərəfindəki × işarəsinə klikləyin. Kart zaman xəttindən çıxarılır, amma silinmir, səyahət sinxronizasiyası da onu bir daha təklif etmir.',
  'help.guide.suggestions.step.3':
    'Fikrinizi dəyişdiniz? Başlıqdakı ⋯ ilə «Səyahət gündəliyi tənzimləmələri»ni açın: «Bağlanmış təklifləri geri qaytar» onların sayını göstərir və hamısını qaytarır.',
  'help.guide.suggestions.result':
    'Zaman xəttində yalnız yazmaq istədiyiniz qeydlər qalır. Oxuyarkən başlıqdakı göz işarəsi bütün təklifləri birdəfəlik gizlədir.',
  'help.guide.suggestions.tip.1': 'İki gündə planlaşdırılan məkan hər iki gün üçün ayrıca təklif yaradır.',
  'help.guide.suggestions.tip.2': 'Təkliflər statistikaya heç vaxt daxil edilmir, yalnız yazılmış qeydlər sayılır.',
  // add-on-day
  'help.guide.add-on-day.title': 'Əvvəlki günə qeyd əlavə edin',
  'help.guide.add-on-day.goal': 'Keçmiş bir gün haqqında yazın, tarixi sonradan dəyişmək lazım olmasın.',
  'help.guide.add-on-day.step.1': 'Həmin günün başlığının sağ tərəfindəki + işarəsinə klikləyin.',
  'help.guide.add-on-day.step.2':
    'Redaktor həmin tarix seçilmiş halda açılır. Həmişəki kimi yazın və «Yadda saxla» düyməsinə klikləyin.',
  'help.guide.add-on-day.result': 'Qeyd dərhal düzgün günə əlavə olunur.',
  'help.guide.add-on-day.tip.1':
    'Gün içində ardıcıllığı dəyişmək üçün kursoru qeydin üzərinə gətirin: solunda «Yuxarı daşı» və «Aşağı daşı» görünür.',
  // pros-cons
  'help.guide.pros-cons.title': 'Yekun rəy əlavə etmək',
  'help.guide.pros-cons.goal': 'Günü yekunlaşdırın: nə əla idi, nə yox.',
  'help.guide.pros-cons.step.1':
    'Redaktorda hekayənin altında «Müsbət və mənfi cəhətlər» bölməsini tapın. «Müsbət cəhətlər» və ya «Mənfi cəhətlər» sahəsinə bir fikir yazın, növbəti fikir üçün «Başqasını əlavə et» düyməsindən istifadə edin.',
  'help.guide.pros-cons.step.2':
    'Yadda saxlayın. Kartda «Daha çox göstər» hekayəni və yekun rəyi iki qısa siyahı kimi açır.',
  'help.guide.pros-cons.result':
    'Müsbət və mənfi cəhətlər hekayənin altında görünür, onları bir baxışda görə bilərsiniz.',
  'help.guide.pros-cons.tip.1':
    'Səyahət gündəliyində yekun rəydən istifadə etmirsinizsə, bu bölməni «Səyahət gündəliyi tənzimləmələri» içində «Qeyd sahələri» altında söndürə bilərsiniz.',
  // search-journey
  'help.guide.search-journey.title': 'Uzun gündəlikdə axtarış edin',
  'help.guide.search-journey.goal': 'Həftələrlə qeydləri sürüşdürmədən lazım olan qeydi tapın.',
  'help.guide.search-journey.step.1':
    'Alətlər panelindəki «Bu səyahət gündəliyində axtar» sahəsinə yazın. Yazdıqca zaman xətti başlıqlar, hekayələr, məkanlar və teqlər üzrə süzülür. Diakritik işarələr və böyük-kiçik hərf nəzərə alınmır.',
  'help.guide.search-journey.step.2':
    'Əvəzinə bir günə keçmək üçün zaman xəttinin aşağısında, «Yuxarı qayıt» və «Sonuncu qeydə keç» arasındakı gün sayğacına klikləyin.',
  'help.guide.search-journey.result':
    'Zaman xətti seçdiyiniz günə və ya qeydə sürüşür, xəritə də ora keçir. Axtarış sahəsini təmizləyənə qədər yalnız uyğun qeydlər göstərilir.',
  'help.guide.search-journey.tip.1':
    'Davam edən səyahət gündəliyi bugünkü səhifədə açılır, ona görə də cari səhifə adətən artıq görünür.',
  'help.guide.search-journey.tip.2':
    'Başlıqdakı göz təklifləri gizlədir, beləliklə, yalnız yazdığınız qeydləri görürsünüz.',
  // gallery-map
  'help.guide.gallery-map.title': 'Qalereyaya və xəritəyə baxın',
  'help.guide.gallery-map.goal': 'Bütün səyahət gündəliyinə şəkillər və xəritədəki məkanlar kimi baxın.',
  'help.guide.gallery-map.step.1':
    'Alətlər panelində «Qalereya»ya keçin. Burada hər qeydin bütün fotoları, üstəlik birbaşa qalereyaya yüklənmiş şəkillər görünür. Şəkli baxış pəncərəsində açmaq üçün ona klikləyin.',
  'help.guide.gallery-map.step.2':
    'Sağdakı «Yüklə» qalereyaya şəkil əlavə edir. Immich və ya Synology qoşulubsa, kitabxananın adı yazılmış düymə ilə şəkilləri oradan seçə bilərsiniz.',
  'help.guide.gallery-map.result':
    'Sancaqlar öz günlərinin rəngindədir və tarix ardıcıllığı ilə nazik qırıq xətlə birləşdirilir. Xəritənin yuxarısındakı qatlar paneli nəyin göstəriləcəyini dəyişir.',
  'help.guide.gallery-map.tip.1':
    'Səyahətin GPX izləri xəritənin «Plan» qatında qırıq xətlərlə göstərilir. «Səyahət gündəliyi tənzimləmələri»ndə «Bütün səyahət GPX izlərini göstər» onları söndürür.',
  'help.guide.gallery-map.tip.2':
    'Həm «Qalereya», həm də «Xəritə» paylaşılıbsa, yeri bəlli olan qalereya fotoları ictimai xəritədə də görünür.',
  // entry-fields
  'help.guide.entry-fields.title': 'Qeyd sahələrini söndürmək',
  'help.guide.entry-fields.goal': 'Redaktorda yalnız bu gündəliyin istifadə etdiyi sahələri göstərin.',
  'help.guide.entry-fields.step.1':
    '«Səyahət gündəliyi tənzimləmələri»ni açmaq üçün başlığın yuxarı sağındakı ⋯ düyməsinə klikləyin.',
  'help.guide.entry-fields.step.2':
    '«Qeyd sahələri» altında «Əhvali-ruhiyyə», «Hava» və ya «Müsbət və mənfi cəhətlər» sahəsini söndürün.',
  'help.guide.entry-fields.result':
    'Redaktor bu sahələri artıq göstərmir. Yazdıqlarınız itmir: sahəni yenidən yandıranda saxlanmış dəyərlər yenə görünür. Paylaşılan səyahət gündəliyində də həmin sahələr gizlədilir.',
  'help.guide.entry-fields.tip.1':
    'Açarlar hər səyahət gündəliyi üçün ayrıdır, ona görə iş səfəri ilə tətil fərqli ola bilər.',
  // link-trip
  'help.guide.link-trip.title': 'Başqa səyahəti əlaqələndirmək',
  'help.guide.link-trip.goal': 'İkinci səyahətin məkanlarını gündəliyə təklif kimi əlavə edin.',
  'help.guide.link-trip.step.1':
    '«Səyahət gündəliyi tənzimləmələri»ni açmaq üçün başlığın yuxarı sağındakı ⋯ düyməsinə klikləyin.',
  'help.guide.link-trip.step.2': '«Sinxronlaşdırılmış səyahətlər» altında «Səyahət əlavə et» düyməsinə klikləyin.',
  'help.guide.link-trip.step.3':
    'Səyahəti ada və ya təyinat yerinə görə axtarın və yanındakı «Əlaqələndir» düyməsinə klikləyin.',
  'help.guide.link-trip.result':
    'Səyahətin məkanları zaman xəttində öz günlərində təklif kimi görünür və GPX izləri ilə birlikdə xəritənin «Plan» qatına əlavə olunur.',
  'help.guide.link-trip.tip.1':
    'Əlaqələndirilmiş səyahətin yanındakı zibil qutusu soruşduqdan sonra əlaqəni silir; yazdığınız qeydlər qalır.',
  'help.guide.link-trip.tip.2': 'Günü olan qeydlər, həmin günü neçə səyahət əhatə etsə də, yalnız bir dəfə sayılır.',
  // share-public
  'help.guide.share-public.title': 'Gündəliyi ictimai paylaşın',
  'help.guide.share-public.goal': 'TREK hesabı olmayan insanlara yalnız oxumaq üçün link verin.',
  'help.guide.share-public.step.1':
    'Başlıqdakı ⋯ ilə «Səyahət gündəliyi tənzimləmələri»ni açın və «İctimai paylaşım» bölməsinə qədər sürüşdürün.',
  'help.guide.share-public.step.2': '«Paylaşım linki yarat» düyməsini klikləyin.',
  'help.guide.share-public.step.3':
    'Ziyarətçilərin nə görəcəyini seçin: «Zaman xətti», «Qalereya» və «Xəritə». «Xəritə» altında «Səyahət planı» planlaşdırılmış məkanları və marşrutları, «Qeydə alınmış marşrutlar» isə qeydə aldığınız günlərin marşrutlarını əlavə edir. «Kopyala» linki mübadilə buferinə köçürür.',
  'help.guide.share-public.result':
    'Linki olan hər kəs yalnız aktiv bölmələri görür. «Qeyd sahələri»ndə söndürdüyünüz sahələr orada da gizli qalır.',
  'help.guide.share-public.tip.1':
    'Fotolar ictimai xəritədə yalnız «Qalereya» və «Xəritə» hər ikisi aktiv olduqda görünür. «Xəritə» deaktiv olduqda server fotoları göndərməzdən əvvəl onların koordinatlarını silir.',
  'help.guide.share-public.tip.2': 'Paylaşımı dayandırmaq üçün «Kopyala» yanındakı «Linki sil» düyməsinə klikləyin.',
  // contributors
  'help.guide.contributors.title': 'Birlikdə yazın',
  'help.guide.contributors.goal': 'Başqa səyahətçiyə öz qeydlərini və fotolarını əlavə etməyə icazə verin.',
  'help.guide.contributors.step.1':
    'Başlıqdakı ⋯ ilə «Səyahət gündəliyi tənzimləmələri»ni açın və «İştirakçılar» bölməsini tapın.',
  'help.guide.contributors.step.2':
    '«İştirakçı dəvət et» düyməsinə klikləyin və istifadəçini adı və ya e-poçtu ilə axtarın.',
  'help.guide.contributors.step.3': '«İzləyici» və ya «Redaktor» seçin və «Dəvət et» düyməsinə klikləyin.',
  'help.guide.contributors.result':
    'Gündəlik onların siyahısında görünür, yazdıqları qeydlərdə isə adları göstərilir. İştirakçını çıxarmaq üçün yanındakı × işarəsinə klikləyin.',
  'help.guide.contributors.tip.1': '«İştirakçılar» bu TREK-dəki insanlar üçündür. Qalan hər kəs üçün ictimai link var.',
  // studio
  'help.guide.studio.title': 'Səyahət gündəliyini foto kitab kimi tərtib etmək',
  'help.guide.studio.goal': 'Gündəliyi çap üçün hazır səhifələrə çevirin.',
  'help.guide.studio.step.1':
    'Yuxarı hissədə Studio düyməsinə klikləyin. Dizayner səyahət gündəliyinin üzərində açılır.',
  'help.guide.studio.step.2':
    'Geri qayıtmaq üçün yuxarı panelin sağ ucundakı × işarəsinə klikləyin. Olduğunuz yerə qayıdırsınız.',
  'help.guide.studio.result':
    'Panel və onun bölmələri solda, açılım iş masasında, xüsusiyyətlər isə sağdadır. Avtomatik tərtibat kitabı qeydlərinizdən qurur. İxrac et çapa hazır PDF yaradır.',
  'help.guide.studio.tip.1':
    'Studio üçün pəncərənin eni ən azı 1024 px olmalıdır, telefonda isə Studio təklif olunmur.',
  'help.guide.studio.tip.2':
    'Kitaba giriş səyahət gündəliyi ilə eynidir: gündəliyi oxuya bilən hər kəs kitabı aça, gündəliyi redaktə edə bilən hər kəs isə onu yadda saxlaya bilər.',
  // archive-journey
  'help.guide.archive-journey.title': 'Səyahət gündəliyini arxivləşdirmək və ya silmək',
  'help.guide.archive-journey.goal': 'Bitmiş səyahət gündəliyini bağlayın və ya həmişəlik silin.',
  'help.guide.archive-journey.step.1':
    '«Səyahət gündəliyi tənzimləmələri»ni açmaq üçün başlığın yuxarı sağındakı ⋯ düyməsinə klikləyin.',
  'help.guide.archive-journey.step.2':
    'Aşağıdakı «Səyahət gündəliyini arxivləşdir» gündəliyi bitirir və arxivləşdirilmiş kimi qeyd edir; «Səyahət gündəliyini bərpa et» onu geri qaytarır. «Sil» isə təsdiqdən sonra gündəliyi bütün qeydləri və fotoları ilə birlikdə silir.',
  'help.guide.archive-journey.result':
    'Arxivləşdirilmiş səyahət gündəliyini yenə oxumaq və paylaşmaq olur; sadəcə o, artıq bugünkü gündə açılmır.',
  'help.guide.archive-journey.tip.1':
    'Silməni geri qaytarmaq olmur, səyahət gündəliyinin bağlı olduğu səyahətlər isə dəyişmir.',
  'help.guide.archive-journey.tip.2': 'Üzlük, ad və alt başlıq həmin pəncərədə, yuxarıdadır.',
  'help.guide.journey-status.title': 'Gündəliyin statusunu təyin etmək',
  'help.guide.journey-status.goal':
    'Gündəliyin qaralama, canlı və ya tamamlanmış olduğunu səyahət tarixlərinə görə deyil, özünüz təyin edin.',
  'help.guide.journey-status.step.1':
    '«Səyahət gündəliyi tənzimləmələri»ni açmaq üçün gündəliyin başlığının yuxarı sağındakı ⋯ düyməsinə klikləyin.',
  'help.guide.journey-status.step.2':
    '«Vəziyyət» altında «Qaralama», «Canlı» və ya «Tamamlanıb» seçin. Seçim dərhal yadda saxlanılır.',
  'help.guide.journey-status.result':
    'Gündəlik seçdiyiniz vəziyyəti saxlayır: «Qaralama» və «Tamamlanıb» kartında və başlığında nişan kimi göstərilir, «Canlı» gündəlik isə gündəliklər siyahısının yuxarısındakı bannerdə görünür.',
  'help.guide.journey-status.tip.1':
    '«Avtomatik» yenidən bağlı səyahətlərin tarixlərindən istifadə edir. Bağlı səyahət yoxdursa, avtomatik səyahət gündəliyi qaralama olaraq qalır.',
  'help.guide.journey-status.tip.2':
    'Əl ilə təyin etdiyiniz status siz dəyişənə qədər qalır, səyahət tarixləri dəyişsə belə.',

  // ── Screen: journey-studio ─────────────────────────────────────────────────
  'help.ctx.journey-studio.title': 'Studio', // same-as-en
  'help.ctx.journey-studio.summary':
    'TREK Studio səyahəti çap edə biləcəyiniz foto kitab kimi tərtib edir. O, gündəliyin üzərində açılır: panel və onun bölmələri solda, üzərində işlədiyiniz açılım ortada, xüsusiyyətləri isə sağdadır. Avtomatik tərtibat qeydlərinizdən ilk layihəni qurur, mövzu kitaba rənglərini və şriftlərini verir, köməkçi isə səhifələri sizinlə birlikdə dizayn edə bilər. Bundan sonra hər şeyi köçürə, kəsə və yenidən üslublaşdıra bilərsiniz, hər addımı da geri ala bilərsiniz.',
  'help.ctx.journey-studio.bullet.1':
    'Yuxarı panel: solda səyahətin üz qabığı və adı. Sağda kitabda daha kimin olduğu və onun yadda saxlanıb-saxlanmadığı, səhifə formatı, geri al, təkrar et və yapışdır, Avtomatik tərtibat, köməkçi, kömək, İxrac et və Studio-nu bağlayan düymə.',
  'help.ctx.journey-studio.bullet.2':
    'Soldakı panel: Səhifələr, Məzmun (səyahətin fotoları və qeydləri), Tərtibatlar, Elementlər (mətn, fiqurlar, xətlər, çərçivələr, ikonlar və stikerlər), Səyahət (səyahətdən qurulan rəqəmlər, xəritələr, ölkələr və nişanlar) və onların altında ayrıca Mövzu və Laylar.',
  'help.ctx.journey-studio.bullet.3':
    'İş masası: daşma payı və təhlükəsiz kənar boşluqları ilə cari açılım, onun altında isə Görünüşə sığdır, Kitab görünüşü və Bu açılımı endir düymələri olan miqyas paneli.',
  'help.ctx.journey-studio.bullet.4':
    'Sağdakı Xüsusiyyətlər: seçilmiş element haqqında hər şey, mövqe, ölçü və kəsmədən tutmuş rənglərə, effektlərə, üst-üstə düzülmə sırasına və kilidə qədər. Heç nə seçilməyibsə, səhifə fonu, mövzu, səhifə nömrələri və sənəd göstərilir.',
  'help.ctx.journey-studio.bullet.5':
    'Kitab çap olunmuş kitab kimi düzülür: üz qabığı, qabığın boş daxili üzünün qarşısında tək ilk səhifə, açılımlar, tək son səhifə və arxa qabıq. Səhifə nömrələri ilk səhifədən hesablanır və göstərildiyi kimi çap olunur.',
  'help.ctx.journey-studio.bullet.6':
    'Bir neçə nəfər eyni anda dizayn edə bilər: hər kəs digərlərinin kursorlarını adları ilə görür. Başqasının dəyişdirdiyi versiyanı yadda saxlasanız, TREK onun işinin üzərinə yazmır, ziddiyyət göstərir.',
  'help.ctx.journey-studio.bullet.7':
    'Mövzu: bütün kitab üçün bir görünüş, onun kağızı, mürəkkəbi və üç vurğu rəngi, şriftləri və motivləri. Mövzuya bağlı elementlər onu dəyişdiyiniz zaman ona uyğunlaşır.',
  'help.ctx.journey-studio.bullet.8':
    'Köməkçi: administrator süni intellekti qurubsa, yuxarı paneldəki söz balonu sizinlə birlikdə səhifələr düzən, izahlar yazan və kitabın üslubunu dəyişən köməkçini açır. Onun etdiyi hər dəyişiklik bir geri alma addımıdır.',
  // studio-auto-layout
  'help.guide.studio-auto-layout.title': 'Kitabı avtomatik qurmaq',
  'help.guide.studio-auto-layout.goal': 'Gündəliyin qeyd və fotolarından bir kliklə tam ilk qaralama alın.',
  'help.guide.studio-auto-layout.step.1': 'Yuxarı paneldə «Avtomatik tərtibat» düyməsinə klikləyin.',
  'help.guide.studio-auto-layout.step.2':
    '«Bütün kitab»ı seçin: bütün səhifələr əvəzlənir, başlığınız və səhifə ayarları isə qalır. «Bu açılım» yalnız ekrandakı açılımı yenidən qurur. Bu seçim yalnız qeyddən yaradılmış açılımda çıxır.',
  'help.guide.studio-auto-layout.step.3':
    'Səhifələr panelinə baxın. Əvvəlki variant daha çox xoşunuza gəlirdisə, «Geri qaytar» bütün tərtibatı geri alır.',
  'help.guide.studio-auto-layout.result':
    'Hər qeyd üçün ardıcıllıqla bir ikiqat səhifə, fotoları, başlığı və mətni artıq yerləşdirilmiş halda. Hər element siz onu redaktə edənədək öz qeydinə bağlı qalır və onunla birlikdə yenilənir.',
  'help.guide.studio-auto-layout.tip.1':
    'Hər iki bənd adi geri qaytarma addımıdır, ona görə onları sınayıb geri qaytara bilərsiniz.',
  'help.guide.studio-auto-layout.tip.2':
    'Avtomatik tərtibat elementi qeydə bağlayanda həmin qeydi redaktə etdikcə element də yenilənir. Elementi «Xüsusiyyətlər» panelində dəyişsəniz, bu əlaqə silinir.',
  // studio-pages
  'help.guide.studio-pages.title': 'Açılımları əlavə edin, yerini dəyişin və silin',
  'help.guide.studio-pages.goal': 'Kitabı səhifə-səhifə redaktə edin.',
  'help.guide.studio-pages.step.1':
    'Paneldə Səhifələr bölməsini açın. Miniatürlər kitabı ardıcıllıqla göstərir: üz qabığı, ilk səhifə, açılımlar, son səhifə və arxa qabıq. İlk və son səhifə öz qabıqlarının boş daxili üzünün yanında, cildlənmiş kitabın açıldığı kimi çəkilir.',
  'help.guide.studio-pages.step.2':
    'Aşağıdakı «Açılım əlavə et» son səhifədən əvvəl yeni açılım əlavə edir. İki miniatür arasındakı + isə açılımı məhz həmin yerə daxil edir.',
  'help.guide.studio-pages.step.3':
    'Əməliyyatları görmək üçün kursoru miniatürün üzərinə aparın: «Əvvələ daşı», «Sonraya daşı», «Açılımın dublikatını yarat» və «Açılımı sil». Miniatürə klikləsəniz, həmin açılım iş masasında açılır.',
  'help.guide.studio-pages.result':
    'Üz qabığı, ilk və son səhifələr və arxa qabıq yerində qalır. Yeni açılımlar həmişə onların arasına əlavə olunur.',
  'help.guide.studio-pages.tip.1':
    'Yuxarı paneldəki «Kitab görünüşü» bütün kitabı cildlənəcəyi kimi, vərəq-vərəq göstərir.',
  'help.guide.studio-pages.tip.2':
    'Səhifə nömrələri heç nə seçilməmiş halda «Xüsusiyyətlər» panelində «Sənəd» bölməsində yandırılır.',
  // studio-layouts
  'help.guide.studio-layouts.title': 'Açılıma tərtibat tətbiq edin',
  'help.guide.studio-layouts.goal': 'Açılıma foto və mətn çərçivələrinin hazır düzülüşünü verin.',
  'help.guide.studio-layouts.step.1':
    'Paneldə Tərtibatlar bölməsini açın. Əvvəlcə dizayn olunmuş səhifələr gəlir: kitabın mövzusunda hazırlanmış bütöv üz qabıqları və açılımlar; üslub düymələri onları bir görünüşə qədər daraldır. Mənim tərtibatlarım və Daxili onların altında eyni şəbəkədə gəlir.',
  'help.guide.studio-layouts.step.2':
    'Birinə klikləyin. İş masasındakı açılım bu tərtibatın çərçivələrini alır, mövcud fotolarınız və mətniniz də onlara yerləşdirilir.',
  'help.guide.studio-layouts.result':
    'Boş çərçivələr məzmun üçün yer tutucudur: «Məzmun» bölməsindən birinin üzərinə foto sürüşdürün və ya «Bu səhifəyə əlavə et» düyməsindən istifadə edin.',
  'help.guide.studio-my-layouts.title': 'Səhifəni öz tərtibatınız kimi saxlayın',
  'help.guide.studio-my-layouts.goal': 'Kitabın digər səhifələrində qurduğunuz düzülüşdən təkrar istifadə edin.',
  'help.guide.studio-my-layouts.step.1': 'Səhifəni istədiyiniz kimi düzün, sonra paneldə Tərtibatlar bölməsini açın.',
  'help.guide.studio-my-layouts.step.2':
    'Mənim tərtibatlarım altında Bu səhifəni tərtibat kimi saxla düyməsinə klikləyin. Səhifə siyahıda kart kimi görünür.',
  'help.guide.studio-my-layouts.tip.1':
    'Başqa səhifədə öz tərtibatınıza klikləyin ki, həmin səhifə öz foto və sözləri ilə eyni cür düzülsün.',
  'help.guide.studio-my-layouts.result':
    'Tərtibatlarınız kitabla birlikdə saxlanılır və eyni növ səhifələrdə təklif olunur: üz qabığınınkı üz qabıqlarında, açılımınkı açılımlarda.',
  'help.guide.studio-layouts.tip.1': 'Tərtibatı da istənilən digər addım kimi geri qaytarmaq olar.',
  // studio-content
  'help.guide.studio-content.title': 'Səhifəyə foto və qeydlər yerləşdirin',
  'help.guide.studio-content.goal': 'Səyahət gündəliyinin öz fotolarını və qeydlərini açılıma əlavə edin.',
  'help.guide.studio-content.step.1':
    'Yan paneldə «Məzmun»u açın. «Fotolar» səyahət gündəliyinin bütün şəkillərini, «Qeydlər» isə qeydləri mətnləri ilə birlikdə göstərir.',
  'help.guide.studio-content.step.2':
    'Fotonu səhifə cütünə və ya boş çərçivəyə sürükləyin, ya da altındakı «Bu səhifəyə əlavə et» düyməsinə klikləyin. «Fotolar yüklə» hələ gündəlikdə olmayan şəkilləri əlavə edir; «From Immich» və ya «From Synology» onları qoşulmuş kitabxanadan seçir.',
  'help.guide.studio-content.step.3':
    'Qeydin altında «Başlıq», «Hekayə» və «Məkan» həmin mətni səhifəyə mətn elementi kimi yerləşdirir. Tarix və koordinatlar nişan kimi əlavə olunur, qeydin fotoları da elə orada sıralanır.',
  'help.guide.studio-content.result':
    'Buraxdığınız foto foto elementinə çevrilir. Mətn isə siz onu redaktə edənədək qeydə bağlı qalır.',
  'help.guide.studio-theme.title': 'Kitaba mövzu verin',
  'help.guide.studio-theme.goal': 'Bütün kitabın rənglərini və şriftlərini bir dəfəyə təyin edin.',
  'help.guide.studio-theme.step.1':
    'Paneldə Mövzu bölməsini açın. Hər kart mövzunu kiçik səhifə kimi göstərir: onun kağızı, şrifti və üç vurğu rəngi.',
  'help.guide.studio-theme.step.2':
    'Sınamaq üçün mövzuya klikləyin. Kartların altında onun palitrasını dəyişə, başqa şriftlər seçə, motivləri və bəzəyi təyin edə bilərsiniz.',
  'help.guide.studio-theme.step.3':
    'Kitaba tətbiq et düyməsinə, ekrandakı açılım üçün isə Bu səhifəyə tətbiq et düyməsinə klikləyin.',
  'help.guide.studio-theme.tip.1':
    'Mövzuya bağlı elementlər onun rənglərini və şriftlərini alır, mövzu dəyişəndə də ona uyğunlaşır. Hələ bağlı olmayanı da yenidən üslublaşdır əvvəlcə qalanını bağlayır.',
  'help.guide.studio-theme.tip.2': 'Fotolardan rənglər səyahətin şəkillərindən palitra qurur.',
  'help.guide.studio-theme.result':
    'Kitabdakı bütün bağlı rənglər və şriftlər eyni anda dəyişir, mövzunun tətbiqi isə bir geri alma addımıdır.',
  'help.guide.studio-content.tip.1': '«Məzmun» bölməsinin yuxarısındakı axtarış sahəsi hər iki siyahını süzür.',
  'help.guide.studio-content.tip.2':
    'Kompüterinizdən faylı iş masasına atdıqda TREK onu bir addımda yükləyir və yerləşdirir.',
  // studio-elements
  'help.guide.studio-elements.title': 'Mətn, fiqur, ikon və stiker əlavə edin',
  'help.guide.studio-elements.goal': 'Açılıma fotolar və hekayələrdən əlavə bəzək elementləri qoyun.',
  'help.guide.studio-elements.step.1':
    'Paneldə Elementlər bölməsini açın. Altı tab əlavə edə biləcəklərinizi ayırır: Mətn, Fiqurlar, Xətlər, Çərçivələr, İkonlar və Stikerlər.',
  'help.guide.studio-elements.step.2':
    'Mətn üslubuna və ya dizayn olunmuş başlığa, fiqura, xəttə, boş çərçivəyə, ikona və ya stikerə klikləyin. Hər biri açılımın ortasına yerləşdirilir və sonra onu köçürə bilərsiniz.',
  'help.guide.studio-elements.result':
    'Mətn elementinə yazmaq üçün onu iki dəfə klikləyin. Şrift, qalınlıq, ölçü, aralıq və düzləndirmə «Xüsusiyyətlər» panelindədir.',
  'help.guide.studio-stickers.title': 'Stikerlərlə bəzəyin',
  'help.guide.studio-stickers.goal':
    'Görməli yerlərdən və yeməklərdən heyvanlara və oxlara qədər illüstrasiyalar əlavə edin.',
  'help.guide.studio-stickers.step.1': 'Paneldə Elementlər bölməsini açın və Stikerlər seçin.',
  'help.guide.studio-stickers.step.2':
    'Söz axtarın və ya rəflərə baxın, sonra stikeri açılıma yerləşdirmək üçün ona klikləyin.',
  'help.guide.studio-stickers.tip.1':
    'Stiker seçiləndə Xüsusiyyətlər onun hissələrini yenidən rəngləyir və güzgüdə əks etdirir.',
  'help.guide.studio-stickers.result': 'Stiker çəkilmiş şəkildir, ona görə də istənilən ölçüdə kəskin qalır.',
  'help.guide.studio-elements.tip.1': 'Çərçivələr boş foto yerləridir: şəkli sonra ora atın.',
  // studio-travel
  'help.guide.studio-travel.title': 'Xəritə, rəqəm, ölkə və nişan əlavə edin',
  'help.guide.studio-travel.goal': 'Səyahətin özünü səhifədə dizayn olunmuş elementlərə çevirin.',
  'help.guide.studio-travel.step.1':
    'Paneldə Səyahət bölməsini açın. Dörd tab əlavə edə biləcəklərinizi ayırır: Rəqəmlər, Xəritələr, Ölkələr və Nişanlar.',
  'help.guide.studio-travel.step.2':
    'Hər kart elementi səyahətinizin öz rəqəmləri ilə, mövzunun rənglərində göstərir: afişa, bilet, yol nişanı və ya kilometrsayan kimi xülasə, nömrələnmiş dayanacaqlı və ya bir ölkəyə kəsilmiş xəritə, marka, açıqca və ya sancaq kimi ölkə, möhür, etiket və ya lent kimi tarix və ya məsafə.',
  'help.guide.studio-travel.step.3':
    'Karta klikləyin. Element açılımın ortasına yerləşdirilir, sonra onu köçürə və ölçüsünü dəyişə bilərsiniz.',
  'help.guide.studio-travel.result':
    'Element açılımda görünür. Xüsusiyyətlər onun görünüşünü dəyişir, səyahət dəyişəndə isə hər rəqəm, xəritə və ölkə yenilənir.',
  'help.guide.studio-text-effects.title': 'Mətnə effekt əlavə edin',
  'help.guide.studio-text-effects.goal': 'Başlığa kontur, kölgə, əyri və ya naxışla doldurulmuş hərflər verin.',
  'help.guide.studio-text-effects.step.1': 'Seçmək üçün səhifədəki mətn elementinə klikləyin.',
  'help.guide.studio-text-effects.step.2':
    'Xüsusiyyətlərdə Effektlər bölməsini açıb kontur, kölgə və ya vurğu əlavə edin, yaxud hərfləri keçid və ya naxışla doldurun. Hərf ölçüsü və yer sətri əyir və çərçivəyə uyğunlaşdırır.',
  'help.guide.studio-text-effects.tip.1':
    'Çərçivəyə sığdır mətni çərçivəyə sığana qədər kiçildir, ona görə də uzun başlıq heç vaxt kənara daşmır.',
  'help.guide.studio-text-effects.result': 'Effekt mətnlə birlikdə çəkilir, çapda ekrandakı kimi görünür.',
  'help.guide.studio-background.title': 'Səhifə fonunu dəyişin',
  'help.guide.studio-background.goal': 'Səhifəni rənglə, keçidlə və ya naxışla boyayın, yaxud altına foto qoyun.',
  'help.guide.studio-background.step.1':
    'Heç nə seçilməsin deyə səhifənin boş yerinə klikləyin. Səhifə fonu Xüsusiyyətlərin yuxarısındadır.',
  'help.guide.studio-background.step.2':
    'Kağız, Bərk, Keçid və ya Naxış və bir rəng seçin, yaxud Fon kimi foto altında fotoya klikləyin.',
  'help.guide.studio-background.tip.1': 'Bütün səhifələrə tətbiq et kitabın hər səhifəsinə eyni fonu verir.',
  'help.guide.studio-background.result':
    'Fon daşma payına qədər uzanır, ona görə də səhifənin kənarına qədər çap olunur.',
  'help.guide.studio-layers.title': 'Laylarla düzün, gizlədin və kilidləyin',
  'help.guide.studio-layers.goal': 'Açılımdakı hər şeyi üst-üstə düzülmə sırası ilə görün və orada onunla işləyin.',
  'help.guide.studio-layers.step.1': 'Paneldə Laylar bölməsini açın. Siyahının yuxarısı səhifənin ön hissəsidir.',
  'help.guide.studio-layers.step.2':
    'Sırasını dəyişmək üçün sətri sürüşdürün, elementi gizlətmək üçün gözdən, yerində saxlamaq üçün kilidən istifadə edin. Bir neçəsini seçib birlikdə köçürmək üçün qruplaşdırın.',
  'help.guide.studio-layers.tip.1': 'Elementə öz adını vermək üçün sətrə iki dəfə klikləyin.',
  'help.guide.studio-layers.tip.2': 'Gizlədilmiş elementlər PDF-ə daxil edilmir.',
  'help.guide.studio-layers.result':
    'Dolu səhifələrin redaktəsi asan qalır, hazır hissələr isə təsadüfən köçürülə bilməz.',
  'help.guide.studio-travel.tip.1':
    'Xəritələr altında Dayanacaqlar marşrutun hər dayanacağını sadalayır. Birini xəritələrdən və rəqəmlərdən çıxarmaq üçün söndürün, məsələn ev hava limanınızı.',
  'help.guide.studio-travel.tip.2':
    'Ölkə xəritəsi yalnız həmin ölkənin dayanacaqlarını göstərir, ona görə də səyahət uzun uçuşla başlasa belə ölkə səhifəni doldurur.',
  // studio-properties
  'help.guide.studio-properties.title': 'Seçdiyinizi redaktə etmək',
  'help.guide.studio-properties.goal': 'Elementin yerini, kəsimini, üslubunu və qat sırasını inspektorla dəyişin.',
  'help.guide.studio-properties.step.1':
    'Açılımda elementə klikləyin. Ölçü və fırlatma üçün tutacaqlar görünür. Yerini dəyişmək üçün elementi sürükləyin.',
  'help.guide.studio-properties.step.2':
    'Sağdakı «Xüsusiyyətlər» seçilmiş elementin tənzimləmələrini göstərir: mövqe və ölçü, çərçivədə nəyin qalacağını təyin edən fokus nöqtəsi ilə «Kəs», «Doldur» və ya «Sığdır», «Görünüş» filtrləri, künc radiusu, çərçivə üslubu, qatların sırası və «Kilidlə».',
  'help.guide.studio-properties.step.3':
    '«Nüsxəsini yarat» və «Sil» inspektorun yuxarısındadır. Yuxarı paneldəki «Geri qaytar» bu dəyişikliklərin istənilənini ləğv edir.',
  'help.guide.studio-properties.result':
    'Kilidli elementi səhifədə seçmək və ya yerini dəyişmək olmur. Beləliklə, digər elementlər üzərində işləyərkən hazır tərtibat qorunur.',
  'help.guide.studio-properties.tip.1':
    'Shift basılı klikləməklə bir neçə element seçilir, inspektor onları birlikdə redaktə edir.',
  'help.guide.studio-properties.tip.2':
    'Avtomatik tərtibatın yerləşdirdiyi elementi redaktə etsəniz, o, artıq qeydlə bağlı olmur və həmin qeydin sonrakı dəyişikliklərini izləmir.',
  // studio-format
  'help.guide.studio-format.title': 'Səhifə formatını seçmək',
  'help.guide.studio-format.goal': 'Tərtibata başlamazdan əvvəl kitabın çap ölçüsünü təyin edin.',
  'help.guide.studio-format.step.1':
    'Yuxarı paneldə, redaktə alətlərinin yanında səhifə formatına klikləyin. O, formatın adını və formasını göstərir.',
  'help.guide.studio-format.step.2':
    '«Kvadrat 21 × 21 sm», «Kvadrat 30 × 30 sm», A4 və ya A5 albom və ya portret formatını seçin, yaxud eni və hündürlüyü millimetrlə özünüz daxil edin. Daşma payı və təhlükəsiz kənar boşluğu aşağıdadır.',
  'help.guide.studio-format.result':
    'Hər açılım bu ölçüdə çəkilir, standart olaraq 3 mm daşma payı və 5 mm təhlükəsiz kənar boşluğu ilə.',
  'help.guide.studio-format.tip.1':
    'Əvvəlcə formatı dəyişin, sonra «Avtomatik tərtibat»ı işə salın. «Avtomatik tərtibat» işə düşdüyü anda seçilmiş formatı götürür.',
  'help.guide.studio-format.tip.2': 'Mətbəədən daşma payı və təhlükəsiz zona dəyərlərini soruşun və onları daxil edin.',
  // studio-export
  'help.guide.studio-export.title': 'Kitabı PDF kimi ixrac etmək',
  'help.guide.studio-export.goal': 'Çapa hazır və ya ekranda oxumaq üçün fayl alın.',
  'help.guide.studio-export.step.1': 'Yuxarı paneldə «İxrac et» düyməsinə klikləyin.',
  'help.guide.studio-export.step.2':
    '«Ayrı-ayrı səhifələr»i (oxuma ardıcıllığı ilə hər vərəqdə bir səhifə, mətbəəyə məhz bu lazımdır) və ya «Açılımlar»ı (kitab açıldığı kimi, eyni anda iki səhifə) seçin. «Kəsim nişanları» hər kənara daşma payı əlavə edir və kəsiləcək yeri göstərir.',
  'help.guide.studio-export.step.3':
    '«Çap görünüşü» düyməsinə klikləyin. Brauzer səhifələri açır. Faylı yaratmaq üçün «PDF kimi yadda saxla» seçin.',
  'help.guide.studio-export.result':
    'Pəncərədə göstərilən sayda vərəqdən ibarət, təyin etdiyiniz səhifə formatında PDF.',
  'help.guide.studio-export.tip.1': 'PDF-i, Studio-nun özü kimi, yalnız kompüterdə yarada bilərsiniz.',
  'help.guide.studio-export.tip.2':
    'Yoxlama nüsxəsi üçün «Açılımlar»ı kəsim nişanları olmadan, mətbəə üçün isə «Ayrı-ayrı səhifələr»i nişanlarla ixrac edin.',
  // studio-spread-file
  'help.guide.studio-spread-file.title': 'Açılımı başqa kitabda yenidən istifadə edin',
  'help.guide.studio-spread-file.goal': 'Bəyəndiyiniz dizaynı bir səyahət gündəliyinin kitabından digərinə köçürün.',
  'help.guide.studio-spread-file.step.1':
    'Açılım iş masasında olarkən miqyas panelinin sağ ucundakı «Bu açılımı endir» düyməsinə klikləyin. Faylda fotolar yox, dizayn saxlanılır.',
  'help.guide.studio-spread-file.step.2':
    'Digər kitabda «Səhifələr» bölməsini açın, «Açılım əlavə et» yanındakı «İdxal et» düyməsinə klikləyin və faylı seçin.',
  'help.guide.studio-spread-file.result':
    'Açılım çərçivələri və mətn üslubları ilə birlikdə idxal olunur. Yeni gündəliyin fotolarını çərçivələrə atın.',
  'help.guide.studio-spread-file.tip.1': 'Fayl açılım dizaynı deyilsə, TREK onu qəbul etmir və səbəbini göstərir.',

  // ── Screen: settings (all tabs) ────────────────────────────────────────────
  'help.ctx.settings.title': 'Tənzimləmələr',
  'help.ctx.settings.summary':
    'Şəxsi tənzimləmələriniz, soldakı yan paneldə hər mövzu üçün bir vərəq. Açarların çoxu dəyişdirilən kimi qüvvəyə minir. «Yadda saxla» düyməsi olan forma yalnız «Yadda saxla»ya kliklədikdə saxlanır. Buradakı heç nə başqaları üçün TREK-i dəyişmir.',
  'help.ctx.settings.bullet.1':
    'Soldakı yan panel: «Ümumi», «Görünüş», «Xəritə», «Bildirişlər», «İnteqrasiyalar», «Oflayn» və «Hesab». «Plaginlər» aktiv plagin olduqda görünür. «Haqqında» operator onu gizlətməyibsə görünür. Versiya aşağıda göstərilir.',
  'help.ctx.settings.bullet.2':
    'Birinci «Ümumi» açılır. Burada dil, məkan adlarının dili, vahidlər, vaxt formatı, həftənin başlanğıcı və göstərilən valyuta, həmçinin səyahət xəritəsinin necə işlədiyi var. «Görünüş»də tema, rənglər, oxunaqlılıq, mətn ölçüsü və idarə paneli vidcetləri var.',
  'help.ctx.settings.bullet.3':
    '«Xəritə» xəritə mühərrikini və üslubunu seçir; «Bildirişlər» hansı hadisənin hansı kanala göndəriləcəyini təyin edir; «İnteqrasiyalar» foto kitabxanalarını, AirTrail, Dawarich və wanderer xidmətlərini qoşur, burada həmçinin API açarları və MCP var; «Oflayn» bu cihazda nələrin saxlanacağını təyin edir.',
  'help.ctx.settings.bullet.4':
    '«Hesab» bölməsində profiliniz, parolunuz, iki mərhələli doğrulama, keçid açarları və hesabı silmək imkanı var.',
  'help.ctx.settings-display.title': 'Ümumi',
  'help.ctx.settings-display.summary':
    'TREK-in hansı səhifə ilə açıldığı, hansı dil və vahidlərdən istifadə etdiyi, səyahət xəritəsinin və rezervasiyaların necə işlədiyi. Hər dəyişiklik dərhal tətbiq olunur.',
  'help.ctx.settings-display.bullet.1':
    '«Başlanğıc»: «Başlanğıc səhifəsi» «İdarə paneli» və ya «Aktiv səyahət» ilə açılır; «Aktiv səyahət» seçildikdə «Başlanğıc tabı» həmin səyahətin hansı vərəqdə açılacağını təyin edir.',
  'help.ctx.settings-display.bullet.2':
    '«Dil və region»: «Göstərilən valyuta» (çevirmə istəmirsinizsə, «Səyahət valyutası»), «Dil», «Məkan adları», «Temperatur vahidi», «Məsafə vahidi», «Vaxt formatı» və «Həftənin başlanğıcı».',
  'help.ctx.settings-display.bullet.3':
    '«Səyahət və xəritə»: «Yerləri açmaq üçün», «Gün başlıqlarında əvvəlcə tarix», «Rezervasiya marşrutu etiketləri», «Rezervasiya marşrutlarını həmişə göstər», «Planlaşdırılmamış məkanlar üçün kiçik nişanlar», «Xəritədə məkanları kəşf et», «Rezervasiya kodlarını bulanıqlaşdır» və «Marşrutu yaşayış yerindən başlayaraq optimallaşdır».',
  'help.ctx.settings-appearance.title': 'Görünüş',
  'help.ctx.settings-appearance.summary':
    'TREK-in bu hesabda görünüşü: işıqlı və ya tünd rejim, vurğu rəngi, şüşə effekti və animasiya, mətn ölçüsü və idarə panelində hansı vidcetlərin görünəcəyi. Dəyişikliklər daxil olduğunuz bütün cihazlarda dərhal tətbiq olunur.',
  'help.ctx.settings-appearance.bullet.1':
    '«Tema»: «Rəng rejimi» («İşıqlı», «Tünd» və ya «Avtomatik»), «Rəng sxemi», «Fərdi» seçildikdə isə kontrast yoxlaması ilə işıqlı və tünd rejim üçün öz vurğu rənginiz.',
  'help.ctx.settings-appearance.bullet.2':
    '«Eksperimental» kimi işarələnmiş «Oxunaqlılıq»: «Şəffaflıq», «Hərəkəti azalt», «Sıxlıq» və «Mətn ölçüsü»; sonuncuda «Hər şey» üçün bir, «Böyük», «Orta», «Normal» və «Kiçik» üçün isə ayrıca sürüşdürücü var.',
  'help.ctx.settings-appearance.bullet.3':
    '«İdarə paneli vidcetləri»: «Kompüter» («Əsas blokun altında», «Sağ yan panel») və «Mobil» («Əsas blokun altında», «Səhifənin aşağısında») üçün ayrıca açarlar.',
  'help.ctx.settings-appearance.bullet.4':
    'Kartların altındakı «Standart dəyərlərə sıfırla» bütün vərəqi standart dəyərlərinə qaytarır.',
  'help.ctx.settings-map.title': 'Xəritə',
  'help.ctx.settings-map.summary':
    'Səyahət planlaşdırıcısı və gündəlik xəritələrini hansı mühərrikin, hansı üslubda çəkdiyi. Leaflet klassik raster xəritədir, Mapbox GL öz tokeninizlə 3D binalar və relyef əlavə edir, MapLibre GL isə tokensiz OpenFreeMap vektor plitələrini çəkir. Atlas həmişə Leaflet istifadə edir.',
  'help.ctx.settings-map.bullet.1':
    '«Xəritə provayderi»: Leaflet, Mapbox GL («Eksperimental») və ya MapLibre GL, hər seçimin qısa təsviri ilə.',
  'help.ctx.settings-map.bullet.2':
    'Leaflet üçün «Xəritə şablonu» və «CARTO API açarı»; iki GL mühərriki üçün «Xəritə üslubu», Mapbox GL üçün isə əlavə olaraq «Mapbox giriş tokeni».',
  'help.ctx.settings-map.bullet.3':
    'Yalnız Mapbox GL üçün: «3D binalar və relyef» və «Yüksək keyfiyyət rejimi». «Xəritəni yadda saxla» düyməsinin üstündə canlı önizləmə göstərilir. «Xəritəni yadda saxla» seçiminizi saxlayır.',
  'help.ctx.settings-notifications.title': 'Bildirişlər',
  'help.ctx.settings-notifications.summary':
    'TREK-in tətbiqdən kənarda sizinlə necə əlaqə saxladığı. Yuxarıda hər hadisə üçün bir sətir və hər kanal üçün bir sütun olan cədvəl nəyin hara göndəriləcəyini təyin edir. Altında webhook, ntfy, bu cihazda push və plagin kanalları üçün kartlar var.',
  'help.ctx.settings-notifications.bullet.1':
    '«Bildirişlər»: hər hadisəni kanallar üzrə yandırın və ya söndürün. Kilid adminin onu hamı üçün söndürdüyünü bildirir.',
  'help.ctx.settings-notifications.bullet.2':
    '«Webhook URL-i»: Discord, Slack və ya öz webhook-unuz, «Sına» və «Yadda saxla» ilə.',
  'help.ctx.settings-notifications.bullet.3':
    'Ntfy: «Ntfy mövzusu», istəyə görə «Ntfy server URL-si» və giriş tokeni, «Sına» və «Yadda saxla» düymələri ilə.',
  'help.ctx.settings-notifications.bullet.4':
    '«Bu cihazda push bildirişləri»: «Bu cihaz üçün aktiv et» yalnız bu brauzerə aiddir; «Test göndər» sınaq bildirişi göndərir. Plagin kanalı qurulana qədər «Konfiqurasiya et» göstərir.',
  'help.ctx.settings-integrations.title': 'İnteqrasiyalar',
  'help.ctx.settings-integrations.summary':
    'TREK-ə kənardan qoşulan hər şey: gündəlik üçün foto kitabxanaları, uçuşlar üçün AirTrail, əslində getdiyiniz yerlər üçün Dawarich, cığırlar üçün wanderer, başqa proqramlar üçün yalnız oxuma API açarları və AI müştəriləri üçün MCP. Başqa xidmətə qoşulma yalnız admin onu aktiv etdikdən sonra görünür.',
  'help.ctx.settings-integrations.bullet.1':
    'Immich və Synology Photos, AirTrail, Dawarich və wanderer: hər kartda ünvan və açar, «Yadda saxla» və «Bağlantını yoxla», həmçinin «Qoşulub» və ya «Qoşulmayıb» nişanı var.',
  'help.ctx.settings-integrations.bullet.2':
    '«API açarları»: ictimai API üçün yalnız oxuma açarları, hər biri seçdiyiniz bölmələrlə məhdudlaşır, kopyalamaq üçün «Son nöqtə» də var.',
  'help.ctx.settings-integrations.bullet.3':
    '«MCP konfiqurasiyası»: «MCP son nöqtəsi», «OAuth 2.1 müştəriləri» altında qeydiyyatdan keçmiş müştəriləriniz, kopyalamaq üçün «Müştəri konfiqurasiyası» və «Ləğv et» düyməsi ilə «Aktiv OAuth sessiyaları».',
  'help.ctx.settings-integrations.bullet.4':
    '«API tokenləri»: MCP-yə qoşulmağın köhnə üsulu, «Köhnəlmiş» kimi işarələnib; bunun əvəzinə «OAuth 2.1 müştəriləri»ndən istifadə edin.',
  'help.ctx.settings-offline.title': 'Oflayn',
  'help.ctx.settings-offline.summary':
    'Bağlantı olmadan da səyahəti aça bilmək üçün TREK-in bu cihazda nə saxladığı və oflayn etdiyiniz dəyişiklik başqa yerdə edilmiş dəyişikliklə toqquşanda nə baş verdiyi.',
  'help.ctx.settings-offline.bullet.1':
    '«Oflayn rejim»: «Oflayn rejimi məcburi aktivləşdir» əvvəlcə hər şeyi yükləyir, sonra yalnız keşdən işləyir və dəyişikliklərinizi növbəyə qoyur.',
  'help.ctx.settings-offline.bullet.2':
    '«Oflayn istifadə üçün hazırla»: «Oflayn istifadə üçün endir» səyahət məlumatlarını, sənədləri və xəritə plitələrini yükləyir; «İndi yenidən sinxronlaşdır» əl ilə yenidən sinxronlaşdırır.',
  'help.ctx.settings-offline.bullet.3':
    '«Oflayn saxlanılacaq məlumatlar»: «Xəritə plitələrini oflayn saxla» və hər səyahət üçün açar. Bitmiş səyahət yalnız açarını yandırdıqda saxlanır.',
  'help.ctx.settings-offline.bullet.4':
    '«Sinxronlaşdırma ziddiyyətləri» yalnız iki dəyişiklik ziddiyyət təşkil etdikdə, «Mənim versiyamı saxla», «Server versiyasını saxla» və «Ziddiyyət yarandıqda» ilə görünür. «Oflayn keş» səyahətləri, gözləyən və ya uğursuz dəyişiklikləri «Yenidən cəhd et», «İmtina et» və «Keşi təmizlə» ilə sayır.',
  'help.ctx.settings-account.title': 'Hesab',
  'help.ctx.settings-account.summary':
    'Bu TREK-dəki hesabınız və necə daxil olduğunuz: profil şəkli, istifadəçi adı və e-poçt, parol, iki faktorlu doğrulama və keçid açarları. «Hesabı sil» düyməsi «Hesab» kartının aşağısındadır.',
  'help.ctx.settings-account.bullet.1':
    '«Hesab»: şəkil yükləmək üçün şəkildəki kameraya, silmək üçün qırmızı zibil qutusuna klikləyin. «İstifadəçi adı» və «E-poçt» «Profili yadda saxla» ilə saxlanır.',
  'help.ctx.settings-account.bullet.2':
    '«Parolu dəyiş»: cari parol, yeni parol iki dəfə (yazdıqca qaydalar işarələnir), sonra «Parolu yenilə». Bu TREK-ə yalnız SSO ilə daxil olunursa, bu kart göstərilmir.',
  'help.ctx.settings-account.bullet.3':
    'Autentifikator tətbiqi və ehtiyat kodlarla «İki mərhələli autentifikasiya (2FA)», parolsuz giriş üçün isə «Keçid açarları».',
  'help.ctx.settings-account.bullet.4':
    '«Hesabı sil» «Hesab» kartının aşağısında, solda yerləşir və təsdiq istəyir. Yeganə administrator özünü silə bilməz.',
  // language-region
  'help.guide.language-region.title': 'Dili, ölçü vahidlərini və valyutanı təyin etmək',
  'help.guide.language-region.goal': 'TREK-dən öz dilinizdə və regionunuzun formatları ilə istifadə edin.',
  'help.guide.language-region.step.1':
    '«Dil və region» altında düymələr sırasından «Dil» seçin. TREK daxil olduğunuz bütün cihazlarda dərhal həmin dilə keçir.',
  'help.guide.language-region.step.2':
    '«Məkan adları» məkan axtarışının, təkliflərin və ünvanların dilini təyin edir; «Tətbiqlə eyni» interfeys dilini izləyir.',
  'help.guide.language-region.result':
    'Tarixlər, məsafələr və məbləğlər gözlədiyiniz formatda göstərilir. «Xərclər» bölməsində məbləğlər yalnız görüntü üçün göstərilən valyutanızda əks olunur; daxil edilmiş məbləğlər dəyişmir.',
  'help.guide.language-region.tip.1': '«Səyahət valyutası» hər səyahəti çevirmədən öz valyutasında göstərir.',
  'help.guide.language-region.tip.2': 'Dil Vacay və gündəlikdəki gün və ay adlarını da müəyyən edir.',
  // travel-map-prefs
  'help.guide.travel-map-prefs.title': 'Səyahət xəritəsini və gün başlıqlarını tənzimləmək',
  'help.guide.travel-map-prefs.goal':
    'Bütün səyahətlərdə səyahət xəritəsinin nəyi göstərəcəyini və gün başlıqlarının necə görünəcəyini seçin.',
  'help.guide.travel-map-prefs.step.1':
    '«Səyahət və xəritə» bölməsində «Yerləri açmaq üçün» naviqasiya düyməsinin birbaşa hansı xəritə tətbiqini açacağını təyin edir; «Hər dəfə soruş» hər dəfə tətbiq seçməyə imkan verir. «Gün başlıqlarında əvvəlcə tarix» hər gün başlığında əvvəlcə təqvim tarixini göstərir.',
  'help.guide.travel-map-prefs.step.2':
    '«Rezervasiya marşrutlarını həmişə göstər» bütün uçuşları, qatarları və digər rezervasiyaları xəritədə çəkir; «Rezervasiya marşrutu etiketləri» hər ucda stansiyanın və ya aeroportun adını göstərir. «Planlaşdırılmamış məkanlar üçün kiçik nişanlar» hələ günə əlavə olunmamış məkanları kiçildir ki, planlaşdırılmış dayanacaqlar daha yaxşı seçilsin.',
  'help.guide.travel-map-prefs.result':
    'Səyahət xəritəsi siz yenidən dəyişənə qədər bütün səyahətlərdə bu ayarlardan istifadə edir.',
  'help.guide.travel-map-prefs.tip.1':
    'Bu tənzimləmələr səyahətə yox, hesaba aiddir. Paylaşılan səyahətin hər üzvü öz seçimlərini görür.',
  'help.guide.travel-map-prefs.tip.2':
    'Admin hamı üçün standart dəyərləri təyin edə bilər; burada dəyişdikləriniz isə yalnız sizə aiddir.',
  // startup
  'help.guide.startup.title': 'TREK-in nə ilə açılacağını seçmək',
  'help.guide.startup.goal': 'TREK hər dəfə idarə panelində deyil, ən çox istifadə etdiyiniz səhifədə açılsın.',
  'help.guide.startup.step.1':
    '«Ümumi» bölməsinin yuxarısında, «Başlanğıc» altında «Başlanğıc səhifəsi»ni «İdarə paneli» və ya «Aktiv səyahət» olaraq seçin.',
  'help.guide.startup.step.2':
    '«Aktiv səyahət» seçildikdə «Başlanğıc tabı» görünür: həmin səyahətin hansı vərəqdə açılacağını seçin.',
  'help.guide.startup.result': 'Növbəti dəfə TREK-i açdıqda birbaşa həmin səhifə açılır.',
  'help.guide.startup.tip.1':
    '«Aktiv səyahət» bu gün davam edən və ya növbəti başlayacaq səyahətdir. Bu, idarə panelinin yuxarısında göstərilən səyahətin eynisidir.',
  // theme-scheme
  'help.guide.theme-scheme.title': 'Temanı və vurğu rəngini təyin etmək',
  'help.guide.theme-scheme.goal': 'TREK-i istədiyiniz rəngdə işıqlı, tünd və ya cihazınıza uyğun edin.',
  'help.guide.theme-scheme.step.1':
    '«Tema» altında «Rəng rejimi»ni «İşıqlı», «Tünd» və ya «Avtomatik» edin. «Avtomatik» cihazınızın ayarını izləyir.',
  'help.guide.theme-scheme.step.2':
    '«Rəng sxemi» seçin: Standart, Yüksək kontrast, İndiqo, Mavi-yaşıl, Qızılgül, Kəhrəba, Bənövşəyi və ya Fərdi.',
  'help.guide.theme-scheme.step.3':
    '«Fərdi» seçildikdə rəng nöqtələrindən birini seçin və ya «İşıqlı» və «Tünd» üçün vurğu rəngini ayrıca təyin edin. Yanındakı nişanda «Yaxşı kontrast» və ya «Aşağı kontrast» yazılır.',
  'help.guide.theme-scheme.result':
    'Düymələr, linklər və vurğulamalar daxil olduğunuz bütün cihazlarda hər yerdə vurğu rəngi ilə göstərilir.',
  'help.guide.theme-scheme.tip.1':
    'Naviqasiya panelində işıqlı və tünd rejim arasında tez keçmək üçün açar da var; o da eyni temanı təyin edir.',
  'help.guide.theme-scheme.tip.2': 'Standart sxemi oxumaq çətin olanda «Yüksək kontrast» sxemini seçin.',
  // readability
  'help.guide.readability.title': 'Oxunaqlılığı və mətn ölçüsünü tənzimləyin',
  'help.guide.readability.goal': 'Daha az şüşə effekti və animasiya, daha çox boşluq və ya daha böyük şrift seçin.',
  'help.guide.readability.step.1':
    '«Oxunaqlılıq» bölməsində «Şəffaflıq» şüşə panelləri tutqun səthlərə çevirir, «Hərəkəti azalt» animasiyaları minimuma endirir, «Sıxlıq» isə «Rahat» və ya «Yığcam» görünüşü seçir.',
  'help.guide.readability.step.2':
    '«Mətn ölçüsü»: bütün mətni birdəfəlik böyütmək və ya kiçiltmək üçün «Hər şey» sürüşdürücüsünü çəkin, ya da «Böyük», «Orta», «Normal» və «Kiçik» ölçülərini ayrı-ayrılıqda təyin edin. Hər ölçüdə nümunə göstərilir, beləliklə, sürüşdürdükcə nəticəni görürsünüz.',
  'help.guide.readability.result':
    'Dəyişiklik bütün tətbiqə, o cümlədən xəritə panellərinə və gündəliyə dərhal tətbiq olunur.',
  'help.guide.readability.tip.1':
    'Cihazınızda hərəkətin azaldılması ayarı aktivdirsə, TREK-in bəzi hissələri artıq daha az animasiya istifadə edir. «Hərəkəti azalt» qalan hissələrdə də animasiyanı azaldır.',
  'help.guide.readability.tip.2':
    'Mətn ölçüsü tipoqrafiya səviyyələri ilə tətbiq olunur, ona görə heç nə kəsilmir: sığmayan mətn yeni sətrə keçir.',
  // dashboard-widgets
  'help.guide.dashboard-widgets.title': 'İdarə paneli üçün vidcetləri seçin',
  'help.guide.dashboard-widgets.goal':
    'Kompüterdə və telefonda ayrı-ayrılıqda yalnız istifadə etdiyiniz vidcetləri göstərin.',
  'help.guide.dashboard-widgets.step.1':
    '«İdarə paneli vidcetləri» altında «Kompüter» «Əsas blokun altında» olan vidcetləri və «Sağ yan panel»i sadalayır. «Sağ yan panel»i söndürmək bütün sütunu gizlədir və idarə panelini mərkəzə gətirir; onun vidcetləri siz onu yenidən yandırana qədər solğun qalır.',
  'help.guide.dashboard-widgets.step.2':
    'Telefondakı idarə paneli üçün «Mobil» bölməsinin öz açarları var: «Əsas blokun altında» və «Səhifənin aşağısında».',
  'help.guide.dashboard-widgets.result':
    'İdarə paneli dərhal dəyişir. Sağ yan panel söndürülübsə, idarə paneli mərkəzə düzülür.',
  'help.guide.dashboard-widgets.tip.1':
    'Əlavənin vidcetləri yalnız administrator həmin əlavəni aktiv saxladıqda görünür.',
  'help.guide.dashboard-widgets.tip.2':
    'İdarə panelinin özü hər cihazda tor və ya siyahı görünüşünü və sıralama qaydasını yadda saxlayır.',
  // map-provider
  'help.guide.map-provider.title': 'Xəritə mühərrikini və üslubunu seçmək',
  'help.guide.map-provider.goal': 'Klassik xəritə, vektor plitələri və Mapbox-un 3D xəritəsi arasında keçin.',
  'help.guide.map-provider.step.1':
    '«Xəritə provayderi» altında istənilən raster plitələrlə klassik 2D xəritə üçün Leaflet, 3D binalar və relyefli vektor plitələr üçün Mapbox GL, tokensiz OpenFreeMap vektor plitələri üçün isə MapLibre GL seçin.',
  'help.guide.map-provider.step.2':
    'Leaflet üçün «Xəritə şablonu», GL mühərriki üçün «Xəritə üslubu» seçin və ya öz URL-nizi yapışdırın. Mapbox GL üçün «Mapbox giriş tokeni», CARTO şablonları üçün «CARTO API açarı» lazımdır; hər sahənin altındakı link onu haradan əldə edəcəyinizi göstərir.',
  'help.guide.map-provider.step.3':
    'Mapbox GL ilə «3D binalar və relyef» açarını, cihazınız kifayət qədər sürətlidirsə, «Yüksək keyfiyyət rejimi»ni də yandırın. Önizləməyə baxın, sonra «Xəritəni yadda saxla» düyməsinə klikləyin.',
  'help.guide.map-provider.result':
    'Səyahət planlaşdırıcısı və gündəlik xəritələri seçdiyiniz mühərrikdən istifadə edir. Atlas həmişə Leaflet istifadə edir.',
  'help.guide.map-provider.tip.1': 'Token olmadıqda Mapbox GL boş xəritə göstərmək əvəzinə Leaflet istifadə edir.',
  'help.guide.map-provider.tip.2':
    'Oflayn saxladığınız xəritə plitələri endirdiyiniz anda aktiv olan provayderdən götürülür.',
  // notification-channels
  'help.guide.notification-channels.title': 'Bildirişlərin harada gələcəyini qurmaq',
  'help.guide.notification-channels.goal':
    'Səyahət xatırlatmalarını və birgə iş bildirişlərini telefonunuzda və ya başqa alətdə alın.',
  'help.guide.notification-channels.step.1':
    'Webhook üçün Discord, Slack və ya öz «Webhook URL-i»nizi yapışdırın, «Sına», sonra «Yadda saxla» düyməsinə klikləyin.',
  'help.guide.notification-channels.step.2':
    'ntfy üçün «Ntfy mövzusu»nu doldurun, öz serveriniz varsa, «Ntfy server URL-si»ni və giriş tokenini əlavə edin. «Sına» dərhal mesaj göndərir; «Yadda saxla» tənzimləmələri saxlayır.',
  'help.guide.notification-channels.step.3':
    'Yuxarıdakı «Bildirişlər» kartında hər hadisəni kanallar üzrə yandırın və ya söndürün. Kilid adminin onu hamı üçün söndürdüyünü bildirir. Plagin kanalı qurulana qədər «Konfiqurasiya et» göstərir; «Test göndər» onu yoxlayır.',
  'help.guide.notification-channels.result':
    'Hadisələr onlar üçün yandırdığınız kanallarla göndərilir. «Tətbiqdaxili» sütunu naviqasiya panelindəki zəngin nəyi göstərəcəyini təyin edir.',
  'help.guide.notification-channels.tip.1':
    'Səyahətin öz «Xatırlatma»sı, yəni yola düşməzdən neçə gün əvvəl, səyahətin redaktə formasında təyin olunur.',
  'help.guide.notification-channels.tip.2':
    'Administrator hamı üçün standart ntfy serverini əvvəlcədən doldura bilər; öz mövzunuzu isə yenə özünüz seçirsiniz.',
  // photo-providers
  'help.guide.photo-providers.title': 'Foto kitabxanasını qoşmaq',
  'help.guide.photo-providers.goal':
    'Gündəliyin günün fotolarını Immich və ya Synology Photos-dan yükləməsinə icazə verin.',
  'help.guide.photo-providers.step.1':
    '«İnteqrasiyalar» altında Immich və ya Synology Photos kartını tapın və istənilənləri daxil edin: Immich üçün «Server URL-i» və «API açarı», Synology Photos üçün «İstifadəçi adı» və «Parol». Immich həmçinin yüklədiyiniz gündəlik fotolarını Immich kitabxanasına kopyalaya bilər.',
  'help.guide.photo-providers.step.2':
    '«Bağlantını yoxla», sonra «Yadda saxla» düyməsinə klikləyin. Nişan «Qoşulub» olur.',
  'help.guide.photo-providers.result':
    'Qeyd redaktorundakı «Xarici fotolar» bölməsi qoşulmuş kitabxanada qeydin gününə aid şəkilləri axtarır, əvvəlcə qeydin məkanına ən yaxın olanları göstərir.',
  'help.guide.photo-providers.tip.1':
    'Bağlantı yalnız sizin hesabınıza aiddir: səyahət gündəliyinin digər üzvləri öz kitabxanalarını özləri qoşur.',
  'help.guide.photo-providers.tip.2':
    'Fotolarında GPS məlumatı olmayan provayder də işləyir. Bu halda siyahı vaxta görə sıralanır.',
  // api-keys
  'help.guide.api-keys.title': 'API açarı yaradın',
  'help.guide.api-keys.goal': 'Başqa proqramlar ictimai API vasitəsilə səyahətlərinizi oxuya bilsin.',
  'help.guide.api-keys.step.1':
    '«API açarları» altında «Açar yarat» düyməsinə klikləyin, açara harada istifadə ediləcəyini bildirən «Ad» verin və «Bu açarın oxuya biləcəyi məlumatlar» altında yalnız lazım olan bölmələri saxlayın. «Yarat» düyməsinə klikləyin.',
  'help.guide.api-keys.step.2':
    'Açarı «API açarı yaradıldı» pəncərəsindən kopyalayın: o, yalnız bir dəfə göstərilir. «Hazır» düyməsinə klikləyin. Müraciət ediləcək «Son nöqtə» siyahının altında göstərilir.',
  'help.guide.api-keys.result':
    'Açarı olan proqram seçdiyiniz bölmələri oxuya bilər və heç vaxt heç nəyi dəyişə bilməz. Siyahıda hər açarın nə vaxt yaradıldığı və son dəfə istifadə edildiyi göstərilir, zibil qutusu isə onu silir.',
  'help.guide.api-keys.tip.1':
    'Hər alət üçün ayrıca açar istifadə edin ki, bir açarı ləğv edəndə digər alətlərə təsir etməsin.',
  'help.guide.api-keys.tip.2':
    'AI müştərisinin dəyişiklik edə bilməsi üçün bunun əvəzinə OAuth ilə MCP istifadə edin; API açarları yalnız oxuyur.',
  // mcp-oauth
  'help.guide.mcp-oauth.title': 'Süni intellekt köməkçisini MCP ilə qoşmaq',
  'help.guide.mcp-oauth.goal': 'Claude-a, IDE-yə və ya başqa MCP klientinə səyahətlərinizə giriş verin.',
  'help.guide.mcp-oauth.step.1': '«MCP konfiqurasiyası» altında müştəriniz üçün «MCP son nöqtəsi»ni kopyalayın.',
  'help.guide.mcp-oauth.step.2':
    '«OAuth 2.1 müştəriləri» altında «Yeni müştəri» düyməsinə klikləyin və Claude Desktop və ya Cursor kimi hazır şablon seçin, ya da «Tətbiqin adı», «Yönləndirmə URI-ləri» və «İcazə verilən sahələr»i özünüz doldurun; brauzeri olmayan server üçün maşın müştərisini seçin. «Müştərini qeydiyyatdan keçir» düyməsinə klikləyin və «Müştəri sirri»ni kopyalayın: o, yalnız bir dəfə göstərilir.',
  'help.guide.mcp-oauth.step.3':
    'Hər müştərinin «Sirri yenilə» və «Müştərini sil» düymələri var. «Aktiv OAuth sessiyaları» daxil olmuş müştəriləri «Ləğv et» düyməsi ilə sadalayır. «Müştəri konfiqurasiyası» açıldıqda JSON istifadə edən müştərilər üçün hazır kod parçası göstərir.',
  'help.guide.mcp-oauth.result':
    'Müştəri icazə sahələrinin imkan verdiyi hər şeyi sizin adınızdan oxuya və dəyişə bilər, hər əməliyyat da sizin adınızla görünür.',
  'help.guide.mcp-oauth.tip.1':
    'İcazə sahələri müştərinin nə edə biləcəyini məhdudlaşdırır: daha çoxu lazım olana qədər müştəriyə yalnız oxuma icazəsi verin.',
  'help.guide.mcp-oauth.tip.2': 'Administrator MCP-ni bütün instansiya üçün söndürə bilər. Onda bu bölmə görünmür.',
  // offline-prepare
  'help.guide.offline-prepare.title': 'Səyahətləri oflayn istifadəyə hazırlayın',
  'help.guide.offline-prepare.goal':
    'Bağlantı kəsilməzdən əvvəl səyahətlərinizi və onların xəritələrini bu cihazda saxlayın.',
  'help.guide.offline-prepare.step.1':
    '«Oflayn saxlanılacaq məlumatlar» altında «Xəritə plitələrini oflayn saxla» açarını yandırılmış saxlayın və bu cihazda istədiyiniz səyahətləri yandırın. Bitmiş səyahət yalnız onu yandırdıqda saxlanır.',
  'help.guide.offline-prepare.step.2':
    'Yuxarıda, «Oflayn istifadə üçün hazırla» altında «Oflayn istifadə üçün endir» düyməsinə klikləyin. O, səyahət məlumatlarını, sənədləri və xəritə plitələrini yükləyir və neçə səyahət saxladığını bildirir.',
  'help.guide.offline-prepare.step.3':
    '«Oflayn rejimi məcburi aktivləşdir» məlumatları bir daha yükləyir, sonra yalnız bu cihazdan işləyir ki, yola çıxmazdan əvvəl hər şeyin yerində olduğunu yoxlayasınız.',
  'help.guide.offline-prepare.result':
    'Səyahətlər internet olmadan da açılır. Etdiyiniz dəyişikliklər növbədə saxlanılır və yenidən onlayn olanda göndərilir.',
  'help.guide.offline-prepare.tip.1':
    'Ən çox yeri xəritə plitələri tutur; yalnız səyahət məlumatlarını və sənədləri saxlamaq üçün onları söndürün.',
  'help.guide.offline-prepare.tip.2':
    'Oflayn rejimdə ən rahat başlanğıc üçün TREK-i brauzerdən tətbiq kimi quraşdırın.',
  // offline-conflicts
  'help.guide.offline-conflicts.title': 'Sinxronlaşdırma ziddiyyətində hansı versiyanın qalacağını seçin',
  'help.guide.offline-conflicts.goal':
    'Oflayn etdiyiniz dəyişiklik başqa yerdə edilmiş dəyişikliklə toqquşanda TREK-in bunu necə həll edəcəyini seçin.',
  'help.guide.offline-conflicts.step.1':
    'Oflayn etdiyiniz dəyişiklik daha yeni dəyişikliklə ziddiyyət təşkil etdikdə «Oflayn» bölməsinin yuxarısına yaxın «Sinxronlaşdırma ziddiyyətləri» görünür. Hər dəyişiklik üçün «Mənim versiyamı saxla» və ya «Server versiyasını saxla» düyməsinə klikləyin.',
  'help.guide.offline-conflicts.step.2':
    'Həmin kartda «Ziddiyyət yarandıqda» növbəti dəfə üçün qərar verir: «Hər dəfə məndən soruş», «Həmişə mənim versiyamı saxla» və ya «Həmişə server versiyasını saxla».',
  'help.guide.offline-conflicts.result':
    '«Hər dəfə məndən soruş» seçildikdə ziddiyyət siz qərar verənə qədər «Sinxronlaşdırma ziddiyyətləri» bölməsində qalır. Digər iki seçimdə TREK onu avtomatik həll edir.',
  'help.guide.offline-conflicts.tip.1': '«Keşi təmizlə» yalnız bu cihazdakı nüsxəni silir. Serverdə heç nə dəyişmir.',
  // profile
  'help.guide.profile.title': 'Profilinizi dəyişin',
  'help.guide.profile.goal': 'Adınızı, e-poçtunuzu və şəklinizi yeniləyin.',
  'help.guide.profile.step.1':
    '«Hesab» kartında şəkil yükləmək üçün şəklinizdəki kameraya klikləyin; qırmızı zibil qutusu onu silir və yerinə adınızın baş hərfini qaytarır.',
  'help.guide.profile.step.2': 'Şəklin altında «İstifadəçi adı» və «E-poçt»u redaktə edin.',
  'help.guide.profile.result': 'Adınız və şəkliniz hər yerdə, o cümlədən paylaşdığınız səyahətlərdə, dərhal yenilənir.',
  'help.guide.profile.tip.1':
    'SSO ilə bağlanmış hesabda SSO nişanı və provayderi ilə birlikdə «Əlaqələndirilib:» göstərilir.',
  // password
  'help.guide.password.title': 'Parolu dəyişmək',
  'help.guide.password.goal': 'Yeni parol təyin edin.',
  'help.guide.password.step.1':
    '«Parolu dəyiş» altında «Cari parol»u, sonra «Yeni parol»u daxil edin və «Yeni parolu təsdiqlə» sahəsində təkrarlayın. Yazdıqca altındakı siyahı hər qaydanı yerinə yetirilmiş kimi işarələyir.',
  'help.guide.password.step.2': '«Parolu yenilə» düyməsinə klikləyin.',
  'help.guide.password.result':
    'Yeni parol dərhal qüvvəyə minir. Bütün digər cihazlar hesabdan çıxarılır, MCP API tokenləriniz silinir, OAuth müştəriləri yenidən daxil olmalıdır; bu cihaz isə daxil olmuş qalır.',
  'help.guide.password.tip.1': 'Bu TREK-ə yalnız SSO ilə daxil olunursa, TREK parolu və «Parolu dəyiş» kartı yoxdur.',
  // mfa
  'help.guide.mfa.title': 'İki faktorlu autentifikasiyanı aktivləşdirmək',
  'help.guide.mfa.goal': 'Hesabınızı autentifikator tətbiqindəki kodla qoruyun.',
  'help.guide.mfa.step.1':
    '«İki mərhələli autentifikasiya (2FA)» bölməsində «Autentifikatoru quraşdır» düyməsinə klikləyin.',
  'help.guide.mfa.step.2':
    'QR kodu tətbiqinizlə skan edin və ya gizli açarı əl ilə daxil edin, sonra tətbiqin göstərdiyi altırəqəmli kodu yazıb «2FA-nı aktivləşdir» düyməsini klikləyin.',
  'help.guide.mfa.step.3':
    'Ehtiyat kodlarını «Kodları kopyala», «TXT endir» və ya «Çap / PDF» ilə saxlayın, sonra OK düyməsinə klikləyin. Hər kod bir dəfə işləyir. Telefonunuz yanınızda olmadıqda koddan istifadə edin.',
  'help.guide.mfa.result': 'Hər girişdə paroldan sonra kod tələb olunur.',
  'help.guide.mfa.tip.1':
    '«2FA-nı deaktiv et» üçün parolunuz və cari kod və ya istifadə olunmamış ehtiyat kod lazımdır.',
  'help.guide.mfa.tip.2': 'Administrator 2FA-nı hamı üçün məcburi edə bilər. Bu halda onu burada söndürmək olmur.',
  // passkeys
  'help.guide.passkeys.title': 'Passkey ilə daxil ol',
  'help.guide.passkeys.goal': 'Parol əvəzinə cihazınızın barmaq izi, üz tanıma və ya PIN kodundan istifadə edin.',
  'help.guide.passkeys.step.1':
    '«Keçid açarları» altında «Keçid açarı əlavə et» düyməsinə klikləyin, cari parolunuzu təsdiqləyin, açara hansı cihaz olduğunu bildirən ad verin, sonra cihazınızın göstərişlərinə əməl edin.',
  'help.guide.passkeys.step.2':
    'Hər keçid açarında onun «Sinxronlaşdırılıb» və ya «Bu cihaz»a bağlı olduğu və son dəfə nə vaxt istifadə edildiyi göstərilir. «Adını dəyiş» adını dəyişir, silmə düyməsi isə parolunuzu daxil etdikdən sonra onu silir.',
  'help.guide.passkeys.result': 'Giriş səhifəsi keçid açarını təklif edir. Parolla da daxil olmaq mümkün qalır.',
  'help.guide.passkeys.tip.1':
    'Giriş açarı cihazda və ya onun parol menecerində saxlanılır, ona görə hər cihaz üçün ayrıca giriş açarı əlavə edin.',
  'help.guide.passkeys.tip.2':
    'Keçid açarları yalnız admin onları aktiv etdikdən sonra görünür. Serverin WebAuthn domeni olmayana qədər kart «Keçid açarı əlavə et» təklif etmək əvəzinə bunu bildirir.',
  // delete-account
  'help.guide.delete-account.title': 'Hesabınızı silmək',
  'help.guide.delete-account.goal': 'Hesabınızı və yalnız sizə aid olan məlumatları silin.',
  'help.guide.delete-account.step.1':
    '«Hesab» kartında aşağıda, solda «Hesabı sil», sonra «Həmişəlik sil» düyməsinə klikləyin.',
  'help.guide.delete-account.result':
    'Hesabınız sahibi olduğunuz səyahətlər, məkanlar və fayllarla birlikdə silinir. Başqalarının sahib olduğu səyahətlər qalır.',
  'help.guide.delete-account.tip.1':
    'Yeganə administrator sizsinizsə, TREK «Silmək mümkün deyil» bildirir: əvvəlcə başqa istifadəçini admin edin.',
  'help.guide.delete-account.tip.2':
    'Bunu geri qaytarmaq mümkün deyil. Təsdiqləməzdən əvvəl saxlamaq istədiklərinizi ixrac edin.',

  // ── Screen: admin (all tabs) ───────────────────────────────────────────────
  'help.ctx.admin.title': 'Administrator',
  'help.ctx.admin.summary':
    'Bütün TREK instansiyası və bütün istifadəçilər üçün tənzimləmələr: kimin və necə daxil ola biləcəyi, nəyin aktiv olduğu, faylların harada saxlandığı, serverin insanlarla necə əlaqə saxladığı və ehtiyat nüsxələrin necə çıxarıldığı. Bu səhifəni yalnız adminlər görür. Yan panel vərəqləri «İstifadəçilər», «Konfiqurasiya», «İnteqrasiyalar» və «Texniki xidmət» altında qruplaşdırır, hər vərəq ayrıca ekrandır.',
  'help.ctx.admin.bullet.1':
    'Başlığın sağında istifadəçilərin, səyahətlərin, məkanların və faylların sayı göstərilir. Altında TREK-in daha yeni buraxılışı olduqda «Yeniləmə mövcuddur» banneri görünür.',
  'help.ctx.admin.bullet.2':
    '«İstifadəçilər» və «İstifadəçi standartları»: hesablar, dəvət linkləri və icazələr, həmçinin yeni hesabın başlanğıc tənzimləmələri və xəritəsi.',
  'help.ctx.admin.bullet.3':
    '«Fərdiləşdirmə», «Tənzimləmələr», «Əlavələr», «Plaginlər» və «Saxlama»: baqaj şablonları, kateqoriyalar və məktəb tətilləri; giriş, keçid açarları, 2FA, API açarları və axtarış provayderləri; funksiya modulları; üçüncü tərəf plaginləri; yükləmələrin harada saxlandığı.',
  'help.ctx.admin.bullet.4':
    '«Bildirişlər», «MCP girişi» və GitHub: istifadəçilərin seçə biləcəyi kanallar və onların ilkin ayarları, AI müştərilərinin tokenləri və sessiyaları, buraxılış tarixçəsi.',
  'help.ctx.admin.bullet.5':
    '«Ehtiyat nüsxə» və «Audit»: istənilən an və plan üzrə çıxarılan ehtiyat nüsxələr, həmçinin təhlükəsizlik baxımından vacib hadisələrin jurnalı.',
  'help.ctx.admin-users.title': 'İstifadəçilər',
  'help.ctx.admin-users.summary':
    'Bu TREK-dəki bütün hesablar rolu, e-poçtu və son aktiv olduğu vaxtla, qapalı instansiyada qeydiyyata imkan verən dəvət linkləri, həmçinin səyahətlərdə kimin nə edə biləcəyi.',
  'help.ctx.admin-users.bullet.1':
    'Cədvəl: istifadəçi, e-poçt, rol, yaradılma tarixi və «Son aktivlik», hər sətirdə «İstifadəçini redaktə et» və «İstifadəçini sil». Avatardakı yaşıl nöqtə şəxsin hazırda onlayn olduğunu bildirir; öz sətrinizdə «(Siz)» yazılır.',
  'help.ctx.admin-users.bullet.2':
    '«İstifadəçilər» kartının yuxarı sağındakı «İstifadəçi yarat» hesabı əl ilə əlavə edir; parolu siz təyin edib istifadəçiyə verirsiniz.',
  'help.ctx.admin-users.bullet.3':
    'Aşağıdakı «Dəvət keçidləri»: istifadə limiti, bitmə müddəti və istəsəniz yeni istifadəçinin qeydiyyatdan keçəndə qoşulacağı səyahət olan qeydiyyat linkləri.',
  'help.ctx.admin-users.bullet.4':
    'Aşağıdakı «İcazə tənzimləmələri»: hər əməliyyatı kimin edə biləcəyi («Hər kəs», «Səyahət üzvləri», «Səyahətin sahibi» və ya «Yalnız administrator»). Saxlamaq üçün kartın yuxarısındakı «Yadda saxla» düyməsinə klikləyin.',
  'help.ctx.admin-defaults.title': 'İstifadəçi standartları',
  'help.ctx.admin-defaults.summary':
    'Yeni hesabın başlanğıc ayarları, beləliklə, heç kim əvvəlcə onları qurmalı olmur: rəng rejimi, vahidlər, vaxt formatı, həftənin başlanğıcı, göstərilən valyuta və bulanıqlaşdırılmış rezervasiya kodları, həmçinin xəritə, onun açarları və marşrut serverləri.',
  'help.ctx.admin-defaults.bullet.1':
    'Solda «Standart istifadəçi tənzimləmələri»: «Rəng rejimi», «Temperatur vahidi», «Məsafə vahidi», «Vaxt formatı», «Həftənin başlanğıcı», «Göstərilən valyuta» və «Rezervasiya kodlarını bulanıqlaşdır».',
  'help.ctx.admin-defaults.bullet.2':
    'Sağda «Xəritə»: «Xəritə şablonu», «Paylaşılan CARTO açarı», «Şəxsi marşrut mühərriki» və «Şəxsi Valhalla instansiyası», önizləmə, sonra «Xəritə üslubu» ilə «Xəritə mühərriki», «Paylaşılan Mapbox tokeni», «3D binalar və relyef» və «Yüksək keyfiyyət rejimi».',
  'help.ctx.admin-config.title': 'Fərdiləşdirmə',
  'help.ctx.admin-config.summary':
    'İnstansiyadakı bütün səyahətlər üçün ortaq olan tənzimləmələr: baqaj şablonları, məkanlar və kolleksiyalar üçün kateqoriya dəsti və Vacay-ın istifadə etdiyi məktəb tətilləri kataloqu.',
  'help.ctx.admin-config.bullet.1':
    '«Baqaj şablonları»: səyahətin baqaj siyahısı üçün əsas ola biləcək, kateqoriya və elementlərdən ibarət adlı siyahılar.',
  'help.ctx.admin-config.bullet.2':
    '«Kateqoriyalar»: məkan təfərrüatlarından «Kolleksiyalar»a qədər TREK-də istifadə olunan kateqoriyaların adı, işarəsi və rəngi, hər biri önizləməsi olan pəncərədə redaktə olunur.',
  'help.ctx.admin-config.bullet.3':
    '«Məktəb tətilləri»: tətil dövrləri ilə birlikdə ölkə və regionların kataloqu, hər kəs onları Vacay-də seçə bilər.',
  'help.ctx.admin-settings.title': 'Tənzimləmələr',
  'help.ctx.admin-settings.summary':
    'İnsanların necə daxil olduğu və serverin hansı xarici xidmətlərdən istifadə edə biləcəyi. Solda: «Doğrulama üsulları», «Keçid açarı ilə giriş», «İki faktorlu doğrulamanı (2FA) tələb et» və «Tək giriş (OIDC)». Sağda: «İcazə verilən fayl növləri» və axtarış və nəqliyyat provayderləri ilə «API açarları». «Təhlükəli zona» aşağıdadır.',
  'help.ctx.admin-settings.bullet.1':
    '«Doğrulama üsulları»: «Parolla giriş», «Parolla qeydiyyat», OIDC qurulduqdan sonra isə «SSO ilə giriş» və «SSO ilə avtomatik hesab yaratma». «İki faktorlu doğrulamanı (2FA) tələb et» üçün ayrıca kart var.',
  'help.ctx.admin-settings.bullet.2':
    '«Keçid açarı ilə giriş»: «Keçid açarı ilə girişi aktivləşdir», «Relying Party ID (domen)» və «İcazə verilən mənbələr». «Tək giriş (OIDC)»: «Göstərilən ad», «Təminatçı URL-si», istəyə görə Discovery URL, «Müştəri ID-si» və «Müştəri sirri».',
  'help.ctx.admin-settings.bullet.3':
    '«API açarları»: birinci TREK Places API gəlir və açar tələb etmir. Onun altında «Google Maps API açarı» («Sına» və «Açarın hansı məqsədlərlə istifadə edilə biləcəyi» ilə), Unsplash və Amap açarları, kartın aşağısında isə bir «Yadda saxla» düyməsi var.',
  'help.ctx.admin-settings.bullet.4':
    '«İctimai nəqliyyat provayderi» və «Məkan axtarışı provayderi» ictimai nəqliyyat və məkan axtarışlarına kimin cavab verəcəyini seçir; «Məkan axtarışı jurnalı» hansı nəticənin seçildiyini qeyd edir; «İcazə verilən fayl növləri» yükləmələri məhdudlaşdırır.',
  'help.ctx.admin-addons.title': 'Əlavələr',
  'help.ctx.admin-addons.summary':
    'TREK-in funksiya modulları, hər birinin öz açarı var: Baqaj, Büdcə, Sənədlər, Vacay, Atlas, Collab, Səyahət gündəliyi, Kolleksiyalar, Avtomobil səyahəti, MCP, AirTrail, Dawarich və süni intellektlə təhlil. Söndürülmüş modulun menyu bəndi, səhifələri və API-si hamı üçün aradan qalxır.',
  'help.ctx.admin-addons.bullet.1':
    'Hər əlavə üçün bir kart: keçid düyməsi, seçimləri olan əlavələrdə isə onlar üçün alt sətirlər.',
  'help.ctx.admin-addons.bullet.2':
    'Foto və sənəd provayderləri də burada kart kimi görünür, beləliklə Immich və ya Synology-ni istifadəçilərə təklif edə bilərsiniz.',
  'help.ctx.admin-addons.bullet.3': '«Çantaların izlənməsi» üçün kartların altında ayrıca açar var.',
  'help.ctx.admin-plugins.title': 'Plaginlər',
  'help.ctx.admin-plugins.summary':
    'TREK-in yanında öz prosesində işləyən üçüncü tərəf plaginləri; hər biri quraşdırılarkən istədiyi icazələrlə işləyir. Kataloqdan quraşdırın, paket yükləyin və ya plagin hazırlayarkən qovluğu əlaqələndirin.',
  'help.ctx.admin-plugins.bullet.1':
    '«Quraşdırılıb» və «Kəşf et», «Plaginləri axtar…», «Növ», «Vəziyyət» və «Sırala» filtrləri ilə. Hər sətirdə versiya, «Yoxlanılıb», «İmzalanıb» və ya «İmzalanmayıb», plaginin nəyə giriş əldə edə biləcəyi, açar və ⋯ menyusu göstərilir.',
  'help.ctx.admin-plugins.bullet.2':
    'Kartın başlığındakı iki işarə: «Plagin yüklə» .zip, .tgz və ya .tar.gz faylını qəbul edir (.zip faylını səhifəyə də ata bilərsiniz); «Yenidən skan et» inkişaf üçün bağlanmış plagin qovluğunu tapır.',
  'help.ctx.admin-plugins.bullet.3':
    'Hər plagin üçün «İcazə verilən hostlar»: plaginin müraciət edə biləcəyi ünvanlar, çünki xaricə çıxan bağlantılar standart olaraq bloklanır.',
  'help.ctx.admin-storage.title': 'Saxlama',
  'help.ctx.admin-storage.summary':
    'Yükləmələrin harada saxlandığı: yerli disk və ya S3 bucket, istəyə görə əlavə saxlama yerlərinə kopyalanmaqla. Hər yükləmə kateqoriyası ayrı saxlama yerinə gedə bilər və «Dəyişiklikləri yadda saxla» düyməsinə klikləyənə qədər heç nə dəyişmir.',
  'help.ctx.admin-storage.bullet.1':
    'Yuxarıdakı «Sağlamlıq»: güzgü hədəfinə uğursuz yazmalar və ya «Heç bir replika xətası qeydə alınmayıb.»',
  'help.ctx.admin-storage.bullet.2':
    '«Saxlama sistemləri»: ad, növ, istifadə və hara güzgüləndiyi, «Sına», «Redaktə et» və «Sil» düymələri ilə. «İndi hesabla» saxlanılanların həcmini hesablayır; mühit dəyişəni ilə təyin edilmiş saxlama sistemi yalnız oxunandır.',
  'help.ctx.admin-storage.bullet.3':
    '«Kateqoriyalar»: səyahət sənədləri, gündəlik fotoları, üz şəkilləri, profil şəkilləri, məkan şəkilləri, foto keşləri və ehtiyat nüsxələr, hər biri bir saxlama sisteminə təyin edilir.',
  'help.ctx.admin-notifications.title': 'Bildirişlər',
  'help.ctx.admin-notifications.summary':
    'İnstansiyanın istifadəçilərinə təklif etdiyi kanallar və administrator kimi sizə gələn kanallar. İstifadəçilər öz mövzularını və URL-lərini «Tənzimləmələr» bölməsində seçir. Nəyin mövcud olduğunu isə siz müəyyən edirsiniz, e-poçtu da siz qurursunuz.',
  'help.ctx.admin-notifications.bullet.1':
    '«E-poçt (SMTP)», Webhook, Ntfy və Web Push kanallarının hər birinin onu istifadəçilərə təklif edən açarı var; e-poçt üçün həmçinin server ayarları lazımdır. «Tətbiqdaxili» həmişə aktivdir.',
  'help.ctx.admin-notifications.bullet.2':
    '«Səyahət xatırlatmaları»: server səyahət başlamazdan əvvəl xatırlatma göndərsin, ya yox.',
  'help.ctx.admin-notifications.bullet.3':
    '«Administrator webhook-u», «Administrator Ntfy» və «Bildirişlər» kartı: admin hadisələrinin («Yeni versiya əlçatandır», «Yaddaş replikasında xəta», «Avarçəkmə regionu sorğulanıb») hara göndəriləcəyi, hər birində sınaq düyməsi ilə.',
  'help.ctx.admin-mcp-tokens.title': 'MCP girişi',
  'help.ctx.admin-mcp-tokens.summary':
    'Süni intellekt müştərilərinin bu TREK-də bütün istifadəçilər üzrə sahib olduğu bütün tokenlər və OAuth sessiyaları. Onlardan istənilənini ləğv edə bilərsiniz.',
  'help.ctx.admin-mcp-tokens.bullet.1':
    '«OAuth sessiyaları»: müştəri, ona verilmiş icazələr, sahibi və tarix, həmçinin sessiyanı ləğv edən zibil qutusu.',
  'help.ctx.admin-mcp-tokens.bullet.2':
    '«API tokenləri»: ad, sahib, «Yaradılıb» və «Son istifadə», həmçinin tokeni silən zibil qutusu.',
  'help.ctx.admin-github.title': 'GitHub',
  'help.ctx.admin-github.summary':
    'TREK-də nə yenilik var: GitHub-dan buraxılış tarixçəsi və sizinkindən daha yeni versiyanın olub olmadığı. Yeniləmənin özü tətbiqdən kənarda, hostda aparılır.',
  'help.ctx.admin-github.bullet.1':
    '«Buraxılış tarixçəsi» buraxılışları qeydləri ilə birlikdə zaman xətti kimi sadalayır. Ən yenisində «Ən son» etiketi, ilkin buraxılışlarda «İlkin buraxılış» yazılır, GitHub isə buraxılışlar səhifəsini açır.',
  'help.ctx.admin-github.bullet.2':
    'Daha yeni buraxılış olduqda səhifə başlığının altında «Yeniləmə mövcuddur» görünür; «Necə yeniləməli» Docker üçün əmrləri, digər quraşdırmalar üçün isə yeniləmə bələdçisini göstərir.',
  'help.ctx.admin-backup.title': 'Ehtiyat nüsxə',
  'help.ctx.admin-backup.summary':
    'Verilənlər bazasının və yüklənmiş faylların tam ehtiyat nüsxələri: əl ilə və ya cədvəl üzrə yaradılır, serverdə saxlanılır və tək fayl kimi endirilə bilər. Ehtiyat nüsxəni geri qaytarmaq üçün «Bərpa et» düyməsindən istifadə edin.',
  'help.ctx.admin-backup.bullet.1':
    '«Məlumatların ehtiyat nüsxəsi»: kartın yuxarısında «Ehtiyat nüsxə yarat» və «Ehtiyat nüsxəni yüklə», həmçinin «Endir», «Bərpa et» və silmək üçün zibil qutusu olan ehtiyat nüsxələr siyahısı.',
  'help.ctx.admin-backup.bullet.2':
    '«Ehtiyat nüsxəni yüklə» «Bərpa et» ilə eyni sualdan sonra başqa instansiyada və ya əvvəlki gündə yaradılmış fayldan bərpa edir.',
  'help.ctx.admin-backup.bullet.3':
    '«Avtomatik ehtiyat nüsxələmə»: aktiv və ya deaktiv, «İnterval», «İcra saatı» və gün, həmçinin «Köhnə ehtiyat nüsxələri bu müddətdən sonra sil» (1 gündən «Həmişə saxla»ya qədər); hamısı «Yadda saxla» ilə tətbiq olunur.',
  'help.ctx.admin-audit.title': 'Audit', // same-as-en
  'help.ctx.admin-audit.summary':
    'Təhlükəsizlik və idarəetmə baxımından vacib hadisələrin jurnalı: girişlər və uğursuz cəhdlər, MFA dəyişiklikləri, istifadəçi və tənzimləmə dəyişiklikləri, ehtiyat nüsxələr və bərpalar. Yalnız oxumaq üçündür, ən yenilər yuxarıdadır.',
  'help.ctx.admin-audit.bullet.1':
    'Hər hadisə üçün bir sətir: vaxt, istifadəçi, əməliyyat, resurs, IP və təfərrüatlar.',
  'help.ctx.admin-audit.bullet.2':
    'Kartın başlığındakı «Yenilə» siyahını yenidən yükləyir. Başlığın yanındakı nişan ümumi saydan neçə qeydin yükləndiyini göstərir, «Daha çox yüklə» isə köhnə qeydləri yükləyir.',
  // create-user
  'help.guide.create-user.title': 'İstifadəçi yaradın',
  'help.guide.create-user.goal': 'Dəvət göndərmədən hesabı əl ilə əlavə edin.',
  'help.guide.create-user.step.1': '«İstifadəçilər» kartının yuxarı sağındakı «İstifadəçi yarat» düyməsinə klikləyin.',
  'help.guide.create-user.step.2':
    '«İstifadəçi adı», «E-poçt» və «Parol» daxil edin; parolun altındakı siyahı parolun hansı qaydalara uyğun gəldiyini göstərir. «Rol» seçin: «İstifadəçi» və ya «Administrator».',
  'help.guide.create-user.step.3': '«İstifadəçi yarat» düyməsinə klikləyin.',
  'help.guide.create-user.result':
    'Hesab cədvəldə görünür və onunla dərhal daxil olmaq olar. Parolu həmin şəxsə etibar etdiyiniz kanalla ötürün.',
  'help.guide.create-user.tip.1': 'Parolunu özü seçməli olan şəxs üçün dəvət linki daha yaxşıdır.',
  'help.guide.create-user.tip.2':
    '«Administrator» bu səhifəni görür və hər şeyi edə bilər. «İstifadəçi»nin səyahətlərdə nə edə biləcəyi aşağıdakı «İcazə tənzimləmələri»ndə təyin olunur.',
  // edit-user
  'help.guide.edit-user.title': 'İstifadəçinin məlumatlarını və ya parolunu dəyişmək',
  'help.guide.edit-user.goal':
    'Kiminsə adını dəyişin, rolunu artırın və ya azaldın, ya da parolunu itirdikdən sonra yenidən daxil olmasına kömək edin.',
  'help.guide.edit-user.step.1':
    'İstifadəçinin sətrindəki qələmə («İstifadəçini redaktə et») klikləyin. Pəncərənin yuxarısında hesabın e-poçtu göstərilir.',
  'help.guide.edit-user.step.2':
    '«İstifadəçi adı», «E-poçt» və ya «Rol» sahəsini dəyişin, ya da «Yeni parol» yazın (cari parolu saxlamaq üçün boş buraxın) və «Yadda saxla» düyməsinə klikləyin. Aşağıdakı «Keçid açarlarını sıfırla» təsdiqdən sonra hesabın bütün keçid açarlarını silir.',
  'help.guide.edit-user.result':
    'Dəyişiklik dərhal tətbiq olunur. Yeni parol həmçinin şəxsi bütün cihazlarda hesabdan çıxarır, beləliklə, köhnə sessiya işləməz olur.',
  'help.guide.edit-user.tip.1': 'Sonuncu administrator olduğunuz halda administrator rolunu özünüzdən ala bilməzsiniz.',
  'help.guide.edit-user.tip.2':
    'Keçid açarlarını sıfırlamaq parola toxunmur. İstifadəçi yeni keçid açarlarını «Tənzimləmələr», «Hesab» bölməsində əlavə edir.',
  // invite-links
  'help.guide.invite-links.title': 'Kimisə link ilə dəvət edin',
  'help.guide.invite-links.goal':
    'Qapalı instansiyada kiminsə qeydiyyatdan keçməsinə icazə verin və istəsəniz, onu səyahətə əlavə edin.',
  'help.guide.invite-links.step.1': '«Dəvət keçidləri» kartının yuxarı sağındakı «Keçid yarat» düyməsinə klikləyin.',
  'help.guide.invite-links.step.2':
    '«Maksimum istifadə» (1× ilə 5× arası və ya ∞) və «Bu müddətdən sonra bitir» (1d ilə 14d arası və ya ∞) seçin, istəsəniz «Səyahətə əlavə et (istəyə bağlı)» altında səyahət seçin və «Yarat və kopyala» düyməsinə klikləyin.',
  'help.guide.invite-links.step.3':
    'Linki göndərin. Hər sətirdə neçə dəfə istifadə edildiyi, nə vaxt bitdiyi, hansı səyahətə əlavə etdiyi və kimin yaratdığı, yanında isə «Aktiv», «Müddəti bitib» və ya «İstifadə limiti bitib» göstərilir. «Keçidi kopyala» onu yenidən kopyalayır, zibil qutusu isə silir.',
  'help.guide.invite-links.result':
    'Linki açan şəxs öz parolu ilə qeydiyyatdan keçir. Səyahət seçilibsə, dərhal ona qoşulur.',
  'help.guide.invite-links.tip.1':
    'Dəvət linkləri «Tənzimləmələr» bölməsində «Parolla qeydiyyat» söndürülmüş olsa belə işləyir.',
  'help.guide.invite-links.tip.2':
    'Tək bir şəxs üçün ən təhlükəsiz standart seçim birdəfəlik və qısa müddətli linkdir.',
  // delete-user
  'help.guide.delete-user.title': 'İstifadəçini silmək',
  'help.guide.delete-user.goal': 'Hesabı və ona aid olan hər şeyi silin.',
  'help.guide.delete-user.step.1':
    'İstifadəçinin sətrindəki zibil qutusuna («İstifadəçini sil») klikləyin və «Sil» ilə təsdiqləyin.',
  'help.guide.delete-user.result':
    'Hesab sahibi olduğu bütün səyahətlər və gündəliklərlə, hətta başqaları ilə paylaşdığı səyahətlərlə birlikdə silinir. Yalnız üzvü olduğu səyahətlər sahiblərində qalır.',
  'help.guide.delete-user.tip.1': 'Bunu geri qaytarmaq mümkün deyil. Əmin deyilsinizsə, əvvəlcə ehtiyat nüsxə çıxarın.',
  'help.guide.delete-user.tip.2':
    'Öz sətrinizdəki zibil qutusu işləmir: özünüzü silə bilməzsiniz. Bunu başqa admin etməlidir.',
  // permissions
  'help.guide.permissions.title': 'Kimin nə edə biləcəyini təyin edin',
  'help.guide.permissions.goal': 'Bu TREK-də hər əməliyyatı hansı rolun edə biləcəyini ayrıca təyin edin.',
  'help.guide.permissions.step.1':
    '«İcazə tənzimləmələri» altında əməliyyatı öz qrupunda tapın, məsələn, «Səyahət idarəetməsi» altında «Səyahətləri sil», və bunu kimin edə biləcəyini seçin: «Hər kəs», «Səyahət üzvləri», «Səyahətin sahibi» və ya «Yalnız administrator». Dəyişdirilmiş sətir «fərdiləşdirilib» kimi işarələnir.',
  'help.guide.permissions.step.2':
    'Kartın yuxarı sağındakı «Yadda saxla» düyməsinə klikləyin. «Standart dəyərlərə sıfırla» hər sətri ilkin səviyyəsinə qaytarır; bundan sonra da «Yadda saxla» düyməsinə klikləyin.',
  'help.guide.permissions.result':
    'Qayda bütün səyahətlərə birdən tətbiq olunur. Bu səviyyədən aşağı olanlar həmin düymələri və menyuları artıq görmür.',
  'help.guide.permissions.tip.1':
    '«Səyahətin sahibi» səyahəti yaradan şəxsdir; administratorlar həmişə hər şeyi edə bilər.',
  'help.guide.permissions.tip.2':
    'Hər əməliyyat ayrıca sətirdir, beləliklə, məsələn, üzvlərə məkan və günləri planlaşdırmağa icazə verib səyahətin silinməsini yalnız sahibinə saxlaya bilərsiniz.',
  // default-map
  'help.guide.default-map.title': 'Yeni istifadəçilər üçün standart xəritə ayarlarını təyin etmək',
  'help.guide.default-map.goal': 'Hər yeni hesaba şəxsi token tələb etmədən işləyən xəritə verin.',
  'help.guide.default-map.step.1':
    '«Xəritə» altında «Xəritə şablonu» seçin və ya plitə URL-si yapışdırın, CARTO plitələrindən istifadə edirsinizsə, «Paylaşılan CARTO açarı»nı daxil edin. Aşağıdakı önizləmə nəticəni göstərir.',
  'help.guide.default-map.step.2':
    'Bir az aşağıda «Xəritə mühərriki»ni seçin: «Standart (pulsuz)», Mapbox (3D) və ya MapLibre (OpenFreeMap). Mapbox və MapLibre üçün «Xəritə üslubu»nu seçin; Mapbox üçün «Paylaşılan Mapbox tokeni»ni əlavə edin və «3D binalar və relyef» ilə «Yüksək keyfiyyət rejimi» barədə qərar verin.',
  'help.guide.default-map.result':
    'Yeni hesablar bu ayarlarla başlayır. «Tənzimləmələr»də öz xəritəsini seçmiş istifadəçilərin seçimi dəyişmir.',
  'help.guide.default-map.tip.1':
    'Burada daxil edilən token və ya açar özününkü olmayan hər kəs tərəfindən paylaşılır, ona görə limitinə diqqət edin.',
  'help.guide.default-map.tip.2':
    'Xəritə tabında heç nəyi dəyişməmiş mövcud hesablar da bu standartlardan istifadə edir.',
  // packing-templates
  'help.guide.packing-templates.title': 'Baqaj şablonu yaratmaq',
  'help.guide.packing-templates.goal': 'Səyahətlərə boş siyahı yox, hazır baqaj siyahısı ilə başlamaq imkanı verin.',
  'help.guide.packing-templates.step.1': '«Yeni şablon» düyməsinə klikləyin, ad yazın və quş işarəsi ilə təsdiqləyin.',
  'help.guide.packing-templates.step.2':
    'Açmaq üçün şablonun adına, sonra «Kateqoriya əlavə et» düyməsinə klikləyin. Kateqoriyanın yuxarısındakı + element əlavə edir, element üçün yalnız ad lazımdır.',
  'help.guide.packing-templates.step.3':
    'Hər şey işlədikcə yadda saxlanır. Qələm şablonun, kateqoriyanın və ya elementin adını dəyişir. Zibil qutusu elementi dərhal silir. Şablon və ya kateqoriya üçün isə əvvəlcə soruşur, çünki içindəki hər şey də silinir.',
  'help.guide.packing-templates.result':
    'Şablon hər səyahətin baqaj siyahısında təklif olunur. Tətbiq edəndə elementlər köçürülür, ona görə səyahətdə onları istədiyiniz kimi dəyişə bilərsiniz.',
  'help.guide.packing-templates.tip.1':
    'Hər səyahət növü üçün ayrıca şablon (çimərlik, şəhər, yürüş) çox uzun bir siyahıdan daha yaxşı işləyir.',
  'help.guide.packing-templates.tip.2': 'Şablonu silmək onu artıq tətbiq etmiş səyahətlərə təsir etmir.',
  'help.guide.packing-templates.tip.3':
    'Səyahətin baqaj siyahısındakı «Şablon kimi yadda saxla» hər elementin çəkisi, miqdarı və çantası ilə şablon yaradır. Bunlar burada elementin yanında görünür və şablonu tətbiq etdikdə elementlər həmin çantalara yerləşdirilir.',
  // categories
  'help.guide.categories.title': 'Kateqoriya dəstini idarə edin',
  'help.guide.categories.goal':
    'Məkanların və kolleksiyaların hansı kateqoriyaları ola biləcəyini və onların necə görünəcəyini müəyyən edin.',
  'help.guide.categories.step.1':
    '«Yeni kateqoriya» düyməsinə klikləyin, adı pəncərənin başlıq sətrinə yazın, «İkon» və «Rəng» seçin və «Önizləmə»yə baxın. «Yarat» düyməsinə klikləyin.',
  'help.guide.categories.step.2':
    'Siyahıda qələm («Redaktə et») kateqoriyanı açır, «Yenilə» onu saxlayır. Zibil qutusu («Sil») təsdiqdən sonra onu silir.',
  'help.guide.categories.result':
    'Dəst hər yerdə birdən tətbiq olunur: məkan inspektorunda, xəritə sancaqlarında, Kolleksiyalarda və filtrlərdə.',
  'help.guide.categories.tip.1':
    'Məkanlar kateqoriyanın ID-sini saxlayır, ona görə kateqoriyanın adını dəyişsəniz, ad bütün məkanlarda dəyişir.',
  'help.guide.categories.tip.2':
    'Kateqoriyanı silsəniz, onun məkanları kateqoriyasız qalır. Bu vacibdirsə, əvvəlcə onları başqa kateqoriyaya keçirin.',
  // school-holiday-catalog
  'help.guide.school-holiday-catalog.title': 'Məktəb tətillərini əl ilə idarə etmək',
  'help.guide.school-holiday-catalog.goal':
    'Hər kəsin Vacay-də seçə biləcəyi ölkə və ya region üzrə məktəb tətillərini idarə edin.',
  'help.guide.school-holiday-catalog.step.1':
    '«Məktəb tətilləri» altında «Ölkə» seçin və ya + («Ölkə əlavə et») düyməsinə klikləyin, «Ölkə» və «Ölkə kodu (məs. US)» daxil edin və «Yadda saxla» düyməsinə klikləyin. «Region əlavə et» ölkənin öz tarixləri olan hər hissəsini əlavə edir.',
  'help.guide.school-holiday-catalog.step.2':
    '«Region və ya məktəb dairəsi»ni açmaq üçün regiona klikləyin: «Tətil dövrü əlavə et», hər dövrə «Tətilin adı», «Başlanğıc tarixi» və «Bitmə tarixi» verin və «Yadda saxla» düyməsinə klikləyin. Zibil qutusu dövrü və ya regionu silir; ölkəni regionu qalmadıqdan sonra silmək olar.',
  'help.guide.school-holiday-catalog.result':
    'İstifadəçilər ölkəni və regionu Vacay-da «Tənzimləmələr» altında tapır və dövrləri illik cədvəllərində görürlər.',
  'help.guide.school-holiday-catalog.tip.1': 'Kiminsə artıq öz Vacay təqvimində seçdiyi regionu silmək olmur.',
  // auth-methods
  'help.guide.auth-methods.title': 'İstifadəçilərin necə daxil olacağını təyin edin',
  'help.guide.auth-methods.goal': 'Parolla girişi, SSO-nu və qeydiyyatı yandırın və ya söndürün, 2FA-nı məcburi edin.',
  'help.guide.auth-methods.step.1':
    '«Doğrulama üsulları» altında «Parolla giriş» və «Parolla qeydiyyat» açarlarını yandırın və ya söndürün; hər açar dərhal tətbiq olunur. Qeydiyyat söndürüldükdə yeni hesablar yalnız dəvət linkləri, SSO və ya «İstifadəçi yarat» ilə yaranır.',
  'help.guide.auth-methods.step.2':
    '«SSO ilə giriş» və «SSO ilə avtomatik hesab yaratma» üçün aşağıda «Tək giriş (OIDC)» qurulmalıdır. Avtomatik hesab yaratma kimsə SSO ilə ilk dəfə daxil olanda onun üçün hesab açır.',
  'help.guide.auth-methods.step.3':
    '«İki faktorlu doğrulamanı (2FA) tələb et» açarını yandırın: 2FA qurmamış hər kəs TREK-dən istifadə etməzdən əvvəl onu «Tənzimləmələr» bölməsində qurmalı olacaq.',
  'help.guide.auth-methods.result': 'Giriş səhifəsi məhz aktiv saxladığınız üsulları təklif edir.',
  'help.guide.auth-methods.tip.1':
    'TREK son giriş üsulunu söndürməyə imkan vermir: onun açarı boz olur və ipucunda «At least one login method must remain enabled» yazılır.',
  'help.guide.auth-methods.tip.2':
    'Serverdə OIDC_ONLY təyin edilibsə, parol açarları kilidlənir və bu barədə qeyd göstərilir.',
  // oidc
  'help.guide.oidc.title': 'Vahid giriş sistemini qoşmaq',
  'help.guide.oidc.goal': 'İstifadəçilərin sizin identifikasiya provayderiniz vasitəsilə daxil olmasına imkan verin.',
  'help.guide.oidc.step.1':
    '«Tək giriş (OIDC)» altında düymə üçün «Göstərilən ad»ı, provayderinizdən alınan «Təminatçı URL-si», «Müştəri ID-si» və «Müştəri sirri»ni daxil edin. «Discovery URL (könüllü)» sahəsini yalnız provayderiniz onu adi ünvanda dərc etmirsə doldurun, məsələn, Authentik-də olduğu kimi. «Yadda saxla» düyməsinə klikləyin.',
  'help.guide.oidc.step.2': '«Doğrulama üsulları» altında «SSO ilə giriş»i aktiv edin.',
  'help.guide.oidc.result':
    'Giriş səhifəsində SSO düyməsi görünür; «SSO ilə avtomatik hesab yaratma» aktivdirsə, ilk dəfə daxil olan istifadəçiyə hesab avtomatik yaradılır.',
  'help.guide.oidc.tip.1':
    'Provayderinizin tələb etdiyi yönləndirmə URI-si TREK ünvanınız və sənədlərdəki OIDC callback yolundan ibarətdir.',
  'help.guide.oidc.tip.2':
    'Claim uyğunlaşdırması hansı SSO qruplarının administrator olacağını müəyyən edir. Ətraflı məlumat sənədlərdəki OIDC səhifəsindədir.',
  // instance-keys
  'help.guide.instance-keys.title': 'API açarlarını daxil etmək',
  'help.guide.instance-keys.goal':
    'Bütün instansiya üçün Google fotoları və reytinqlərini, Unsplash üz şəkillərini və Amap axtarışını əlavə edin.',
  'help.guide.instance-keys.step.1':
    '«API açarları» altında yuxarıdakı TREK Places API məkan axtarışını artıq açarsız həyata keçirir. «Nələr daxildir» onun nəyi əhatə etdiyini və etmədiyini sadalayır.',
  'help.guide.instance-keys.step.2':
    'Fotolar, reytinqlər və iş saatları üçün «Google Maps API açarı»nı yapışdırın və «Sına» düyməsinə klikləyin; nəticə «Qoşulub» və ya «Etibarsızdır» olur. «Açarın hansı məqsədlərlə istifadə edilə biləcəyi»ni açın və yalnız ödəniş etmək istədiklərinizi yandırın: «Məkan fotoları», «Məkanın avtomatik tamamlanması», «Məkan məlumatları», «Məkan məlumatlarının zənginləşdirilməsi» və «Yalnız Google ilə axtar», həmçinin «Google sorğuları üçün gündəlik limit».',
  'help.guide.instance-keys.step.3':
    'Üz şəkli axtarışı üçün «Unsplash API açarı»nı və materik Çində məkan axtarışı üçün «Amap (高德地图) API açarı»nı yapışdırın, sonra kartın aşağısındakı «Yadda saxla» düyməsinə klikləyin.',
  'help.guide.instance-keys.result':
    'İstifadəçilər öz açarları olmadan bu funksiyalardan istifadə edir. Google açarı olmadıqda axtarış TREK Places API və OpenStreetMap ilə işləyir.',
  'help.guide.instance-keys.tip.1':
    'İstifadəçinin «Tənzimləmələr» bölməsində şəxsi açarı varsa, TREK həmin istifadəçi üçün instansiya açarı əvəzinə onu istifadə edir.',
  'help.guide.instance-keys.tip.2':
    'Açarlar mühit dəyişənlərindən də gələ bilər, belə açarlar burada yalnız oxumaq üçün göstərilir.',
  'help.guide.instance-keys.tip.3':
    '«Google sorğuları üçün gündəlik limit» TREK-in bu açarla gündə nə qədər xərcləyə biləcəyini məhdudlaşdırır. Başlığın yanındakı nişan bugünkü sorğuları sayır. Limit dolduqda axtarışlar növbəti günə (UTC) qədər OpenStreetMap ilə işləyir.',
  // places-transit
  'help.guide.places-transit.title': 'Axtarış və ictimai nəqliyyat provayderlərini seçin',
  'help.guide.places-transit.goal':
    'Məkan axtarışlarına və ictimai nəqliyyat marşrutu sorğularına hansı xidmətin cavab verəcəyini seçin.',
  'help.guide.places-transit.step.1':
    '«İctimai nəqliyyat provayderi» altında açarsız işləyən və Avropada ən güclü olan «Transitous (pulsuz)» və ya Google açarından istifadə edən Google seçin. Seçim dərhal yadda saxlanır.',
  'help.guide.places-transit.step.2':
    '«Məkan axtarışı provayderi» altında TREK indeksi və OpenStreetMap heç nə tapmadıqda TREK-in hansı xidmətə müraciət edəcəyini seçin: «Avtomatik» (açar varsa Google, sonra Amap), Google Places, Amap (高德地图) və ya OpenStreetMap.',
  'help.guide.places-transit.result':
    'TREK-dəki bütün axtarış xanaları və ictimai nəqliyyat marşrutları bu seçimdən istifadə edir.',
  'help.guide.places-transit.tip.1':
    'Açarı olmayan seçimdə burada xəbərdarlıq göstərilir. Bu zaman məkan axtarışı yalnız TREK indeksindən və OpenStreetMap-dən, ictimai nəqliyyat isə yalnız Transitous-dan istifadə edir.',
  'help.guide.places-transit.tip.2':
    'Google ictimai nəqliyyat marşrutları hər sorğu üçün ödənişlidir, Transitous üçün isə ödəniş alınmır.',
  // file-types
  'help.guide.file-types.title': 'Fayl növlərini məhdudlaşdırmaq',
  'help.guide.file-types.goal': 'Yüklənən faylların hansı uzantılara malik ola biləcəyini müəyyən edin.',
  'help.guide.file-types.step.1':
    '«İcazə verilən fayl növləri» altında vergüllə ayrılmış uzantılar siyahısını redaktə edin və ya bütün növlərə icazə vermək üçün * yazın və «Yadda saxla» düyməsinə klikləyin.',
  'help.guide.file-types.result':
    'Başqa növ fayllar sənədlərdə, gündəlikdə və üz qabıqlarında aydın mesajla rədd edilir.',
  'help.guide.file-types.tip.1':
    'Şəkil növlərini siyahıdan çıxarmayın: üz qabıqları və səyahət gündəliyi fotoları da həmin siyahı ilə yoxlanılır.',
  // toggle-addon
  'help.guide.toggle-addon.title': 'Əlavəni yandırmaq və ya söndürmək',
  'help.guide.toggle-addon.goal': 'Funksiya modulunu hamı üçün aktiv edin və ya söndürün.',
  'help.guide.toggle-addon.step.1':
    'Əlavənin kartındakı keçidə klikləyin. Naviqasiya bəndi hamı üçün dərhal görünür və ya yox olur.',
  'help.guide.toggle-addon.step.2':
    'Bəzi kartlarda seçimlər üçün alt sətirlər var, məsələn, «Siyahılar» altında «Çantaların izlənməsi» və ya «Səyahət gündəliyi» altında foto provayderləri. Onlar yalnız əlavə aktiv olanda görünür.',
  'help.guide.toggle-addon.result':
    'Əlavəni söndürdükdə onun məlumatları saxlanılır. Yenidən yandırdıqda məlumatlar yenə görünür.',
  'help.guide.toggle-addon.tip.1': 'MCP-ni söndürdükdə endpoint və ondan asılı «İnteqrasiyalar» bölmələri yox olur.',
  'help.guide.toggle-addon.tip.2':
    'İstifadəçilərin ən çox istədiyi əlavələr Vacay, Atlas və Səyahət gündəliyidir; Sənədlər üçün isə yükləmələrə yaddaş yeri lazımdır.',
  // document-providers
  'help.guide.document-providers.title': 'Sənəd anbarı təqdim etmək',
  'help.guide.document-providers.goal':
    'Səyahətin sənədlərini hansı saxlama xidmətləri ilə sinxronlaşdıra biləcəyini seçin.',
  'help.guide.document-providers.step.1':
    '«Sənədlər» kartında anbarlar sətir kimi sadalanır: Paperless-ngx, Papra, Nextcloud, OpenCloud və Synology Drive. Başlanğıcda beşi də söndürülüb, sətirlər isə yalnız «Sənədlər» özü aktiv olanda görünür.',
  'help.guide.document-providers.step.2':
    'Nextcloud sətrindəki açarı yandırın. «Əlavə yeniləndi» mesajı çıxır və bundan sonra səyahət sahibləri öz səyahətlərinin «Fayl» tabında «Sənəd sinxronizasiyası» bölməsini, «Provayder qoş» altında isə Nextcloud-u tapırlar.',
  'help.guide.document-providers.result':
    'Anbar bu TREK-dəki hər səyahətdə əlçatandır. Səyahət sahibi qoşmayanadək heç nə qoşulmur.',
  'help.guide.document-providers.tip.1':
    'Burada yalnız saxlama xidmətinin təklif edilib-edilməyəcəyi həll olunur. Ünvan və giriş məlumatları səyahətə aiddir: onları administrator panelində yox, səyahətin «Fayl» bölməsində səyahətin sahibi daxil edir.',
  'help.guide.document-providers.tip.2':
    'Sənədləri söndürəndə bütün anbarlar da sönür və Sənədlər sönülü olduqca heç bir anbarı yandırmaq olmur: server «Əvvəlcə Sənədlər əlavəsini aktivləşdirin» cavabını verir. Öz şəbəkənizdəki anbar üçün serverdə ALLOW_INTERNAL_NETWORK=true da lazımdır.',
  // install-plugin
  'help.guide.install-plugin.title': 'Plagin quraşdırmaq',
  'help.guide.install-plugin.goal': 'Üçüncü tərəf plagini quraşdırın və ona yalnız istədiyi icazələri verin.',
  'help.guide.install-plugin.step.1':
    '«Kəşf et»i açın, «Plaginləri axtar…» və ya «Növ» filtri ilə plagin tapın və «Quraşdır» düyməsinə klikləyin. Paket faylı üçün «Plagin yüklə» düyməsinə (kartın yuxarı sağındakı bulud işarəsi) klikləyin və ya .zip faylını səhifəyə atın.',
  'help.guide.install-plugin.step.2':
    '«Quraşdırılıb» altında sətri oxuyun: plaginin nəyə giriş əldə edə biləcəyi, qoşulduğu hostlar və onun «Yoxlanılıb» və «İmzalanıb» olub olmadığı. Sonra «Plagini aktivləşdir» açarını yandırın; sətirdə «Aktiv» yazılır.',
  'help.guide.install-plugin.step.3':
    'Sətrin ⋯ menyusunda «Yenidən başlat», «Xəta jurnalına bax», «İcazə verilən hostlar» və «Versiyanı dəyiş…», həmçinin mənbəyə linklər var; «Sil» plagini və məlumatlarını silir. Yeni versiya sətirdə yeniləmə kimi görünür, yeni hüquqlar istəyən versiya isə siz onları təsdiqləyənə qədər deaktiv qalır.',
  'help.guide.install-plugin.result':
    'Plagin öz prosesində işləyir. Onun əlavə etdiyi hər şey, məsələn vidcetlər, xəritə qatları və ya alətlər, plaginin müəyyən etdiyi yerdə görünür.',
  'help.guide.install-plugin.tip.1':
    '«Yenidən skan et» inkişaf məqsədilə paketsiz bağlanmış plagin qovluğunu da tapır.',
  'help.guide.install-plugin.tip.2': 'İmzasız plagin belə qeyd olunur. Onu yalnız mənbəyinə etibar etdikdə quraşdırın.',
  // storage-backends
  'help.guide.storage-backends.title': 'Yükləmələri S3-ə köçürmək və ya güzgüləmək',
  'help.guide.storage-backends.goal':
    'Faylları obyekt yaddaşında saxlayın və ya hər yükləməni ikinci saxlama yerinə kopyalayın.',
  'help.guide.storage-backends.step.1':
    '«Saxlama sistemləri» altında «Saxlama sistemi əlavə et» düyməsinə klikləyin, ona «Ad» verin, «Növ» olaraq Local və ya S3 seçin və sahələrini doldurun. Nüsxəni başqa yerdə saxlamaq üçün «Güzgü hədəfləri»ni işarələyin. «Tətbiq et», sonra bağlantını yoxlamaq üçün yeni sətirdə «Sına» düyməsinə klikləyin.',
  'help.guide.storage-backends.step.2':
    '«Kateqoriyalar» altında hər yükləmə növünü, məsələn, «Səyahət sənədləri», «Səyahət gündəliyinin fotoları» və ya «Ehtiyat nüsxələr»i bir saxlama sisteminə təyin edin.',
  'help.guide.storage-backends.step.3':
    'Aşağıdakı «Dəyişiklikləri yadda saxla» düyməsinə klikləyin. Kateqoriya indi başqa yerə yönəlirsə, TREK «Mövcud obyektləri köçür» və ya «Yalnız yeni yazmaları yönləndir» seçimini soruşur.',
  'help.guide.storage-backends.result':
    'Yeni yükləmələr təyin edilmiş saxlama sisteminə gedir. Köçürülmüş fayllar oradan verilir, köçürməmək qərarına gəldikləriniz isə yerində qalır.',
  'help.guide.storage-backends.tip.1':
    'Mühit dəyişənləri ilə qurulmuş saxlama sistemi burada görünür, amma redaktə edilə bilməz.',
  'help.guide.storage-backends.tip.2':
    'Güzgü hədəfi hər yeni yazmanın nüsxəsini alır; sətirdəki «İndi sinxronlaşdır» əvvəlcədən saxlananları kopyalayır. Yavaş hədəf həmin saxlama sistemindəki bütün yükləmələri ləngidir.',
  // channels-instance
  'help.guide.channels-instance.title': 'Bildiriş kanallarını konfiqurasiya edin',
  'help.guide.channels-instance.goal': 'İstifadəçilərin hansı kanalları seçə biləcəyini müəyyən edin və e-poçtu qurun.',
  'help.guide.channels-instance.step.1':
    'Kartın başlığında «E-poçt (SMTP)» açarını yandırın, SMTP Host, SMTP Port, SMTP User, SMTP Password və From Address sahələrini doldurun və «Yadda saxla» düyməsinə klikləyin. «Sınaq e-poçtu göndər» sizə məktub göndərir. «TLS sertifikat yoxlamasını keç» yalnız öz sertifikatı olan yerli poçt serveri üçündür.',
  'help.guide.channels-instance.step.2':
    'Webhook, Ntfy və Web Push açarlarını yandırın ki, istifadəçilərə təklif olunsun. Sonra istifadəçilər «Tənzimləmələr», «Bildirişlər» bölməsində öz URL-lərini və ya mövzularını daxil edir, ya da push-u cihaz üzrə yandırır.',
  'help.guide.channels-instance.step.3':
    '«Səyahət xatırlatmaları» səyahət başlamazdan əvvəlki xatırlatmanı yandırıb söndürür; «Tətbiqdaxili» həmişə aktivdir.',
  'help.guide.channels-instance.result': 'Hər istifadəçinin «Bildirişlər» bölməsində aktiv etdiyiniz kanallar görünür.',
  'help.guide.channels-instance.tip.1':
    '«Administrator Ntfy» kartındakı «Ntfy server URL-si» həm də istifadəçilər üçün standart serverdir. İstifadəçilər yenə də öz serverlərini təyin edə bilər.',
  'help.guide.channels-instance.tip.2': 'Plagin kanalları bu imkanı olan plagin aktiv olan kimi avtomatik görünür.',
  // admin-channels
  'help.guide.admin-channels.title': 'Admin hadisələrini telefonda almaq',
  'help.guide.admin-channels.goal':
    'Yeni buraxılışlar, işləməyən saxlama güzgüləri və avarçəkmə regionu sorğuları barədə bildiriş alın.',
  'help.guide.admin-channels.step.1':
    '«Administrator Ntfy» altında «Administrator mövzusu»nu, lazım olsa, «Ntfy server URL-si» və «Giriş tokeni (istəyə bağlı)» daxil edin; «Administrator webhook-u» altında isə URL. Hər kartda «Yadda saxla» düyməsinə klikləyin.',
  'help.guide.admin-channels.step.2':
    'Mesajın gəldiyini görmək üçün «Sınaq ntfy bildirişi göndər» və ya «Sınaq webhook-u göndər» düyməsinə klikləyin.',
  'help.guide.admin-channels.result':
    'Admin hadisələri tətbiqdə bütün adminlərə, yandırdığınız hallarda isə admin ntfy mövzusuna və webhook-a göndərilir.',
  'help.guide.admin-channels.tip.1':
    'Administrator mövzusunu şəxsi mövzunuzdan ayrı saxlayın ki, nasazlıq xəbərləri səyahət mesajları arasında itməsin.',
  'help.guide.admin-channels.tip.2':
    'Admin webhook-u və mövzusu «Tənzimləmələr», «Bildirişlər» altındakı şəxsi kanallarınızdan ayrıdır.',
  // mcp-tokens-admin
  'help.guide.mcp-tokens-admin.title': 'Süni intellektin girişini ləğv edin',
  'help.guide.mcp-tokens-admin.goal':
    'İstənilən istifadəçi üçün süni intellekt müştərisində olan bütün tokenləri və sessiyaları görün və ləğv edin.',
  'help.guide.mcp-tokens-admin.step.1':
    '«OAuth sessiyaları» altında müştərini adına və sahibinə görə tapın; onun nişanları ona verilmiş icazələri göstərir. Zibil qutusu təsdiqdən sonra sessiyanı ləğv edir.',
  'help.guide.mcp-tokens-admin.step.2':
    '«API tokenləri» altında tokenlər üçün də eynisi: ad, sahib, «Yaradılıb» və «Son istifadə». Zibil qutusu tokeni silir və müştəri dərhal işləməz olur.',
  'help.guide.mcp-tokens-admin.result':
    'Müştəri proqramının istifadəçisi onu yenidən qoşmalıdır. Başqa heç nə dəyişmir.',
  'help.guide.mcp-tokens-admin.tip.1':
    'İcazə sahələri müştərinin nə edə biləcəyini göstərir; yalnız oxuma üçün olan icazə sahəsini saxlamaq təhlükəsizdir.',
  'help.guide.mcp-tokens-admin.tip.2':
    'MCP əlavəsini söndürmək bütün müştəriləri dərhal dayandırır və bu vərəqi gizlədir, amma heç nəyi silmir: əlavə yenidən yandırıldıqda tokenlər yenə işləyir.',
  // release-history
  'help.guide.release-history.title': 'Yeni versiyanı yoxlamaq',
  'help.guide.release-history.goal': 'TREK-inizin aktual olub-olmadığını və növbəti versiyanın nə gətirdiyini öyrənin.',
  'help.guide.release-history.step.1':
    'Daha yeni buraxılış olduqda səhifə başlığının altında istifadə etdiyiniz versiya ilə birlikdə «Yeniləmə mövcuddur» görünür. «GitHub-da bax» buraxılışı açır, «Necə yeniləməli» isə Docker üçün əmrləri və ya digər quraşdırmalar üçün yeniləmə bələdçisini göstərir.',
  'help.guide.release-history.step.2':
    '«Buraxılış tarixçəsi» hər buraxılışı qeydləri ilə göstərir. «Ətraflı məlumatı göstər» onları açır, ən yeni buraxılışda «Ən son» nişanı var, «Daha çox yüklə» isə köhnə buraxılışları göstərir.',
  'help.guide.release-history.result':
    'Yeniləmə serverin özündə edilir: yeni imici çəkirsiniz və ya yeni tag-i yığırsınız; məlumat qovluğu toxunulmaz qalır.',
  'help.guide.release-history.tip.1':
    'Yeniləmədən əvvəl ehtiyat nüsxə çıxarın. «Ehtiyat nüsxə» tabı elə bunun yanındadır.',
  'help.guide.release-history.tip.2':
    'İlkin buraxılışlar siyahıda görünür, amma özünüz ilkin buraxılış istifadə etmirsinizsə, yeniləmə kimi bildirilmir.',
  // create-backup
  'help.guide.create-backup.title': 'Ehtiyat nüsxə yaratmaq və bərpa etmək',
  'help.guide.create-backup.goal':
    'Bütün instansiyanın ehtiyat nüsxəsini çıxarın, surətini başqa yerdə saxlayın və lazım olanda bərpa edə bilin.',
  'help.guide.create-backup.step.1':
    '«Məlumatların ehtiyat nüsxəsi» altında yuxarı sağdakı «Ehtiyat nüsxə yarat» düyməsinə klikləyin. O, verilənlər bazasını və yükləmələri serverdə bir faylda saxlayır.',
  'help.guide.create-backup.step.2':
    '«Endir» nüsxəni maşından kənarda saxlamağa imkan verir; zibil qutusu təsdiqdən sonra köhnə nüsxələri silir.',
  'help.guide.create-backup.step.3':
    'Ehtiyat nüsxədəki «Bərpa et» və ya faylla «Ehtiyat nüsxəni yüklə», «Ehtiyat nüsxə bərpa edilsin?» pəncərəsində «Bəli, bərpa et» düyməsinə kliklədikdən sonra bütün cari məlumatları əvəz edir.',
  'help.guide.create-backup.result':
    'Bərpa istifadəçiləri, səyahətləri, faylları və tənzimləmələri tam olaraq həmin ehtiyat nüsxədəki vəziyyətə qaytarır.',
  'help.guide.create-backup.tip.1':
    'Bərpa burada geri qaytarıla bilməyən yeganə əməliyyatdır. Əvvəlcə yeni ehtiyat nüsxə yaradın.',
  'help.guide.create-backup.tip.2':
    'Ehtiyat nüsxələr məlumat qovluğunda saxlanılır. Bu kompüter sıradan çıxsa da itməmələri üçün onları başqa kompüterə köçürün.',
  // auto-backup
  'help.guide.auto-backup.title': 'Ehtiyat nüsxələri planlaşdırın',
  'help.guide.auto-backup.goal': 'Server özünün ehtiyat nüsxəsini çıxarsın və köhnə nüsxələri silsin.',
  'help.guide.auto-backup.step.1':
    '«Avtomatik ehtiyat nüsxələmə» altında «Avtomatik ehtiyat nüsxələməni aktivləşdir» açarını yandırın, «İnterval» («Hər saat», «Hər gün», «Hər həftə» və ya «Hər ay»), «İcra saatı», həftəlik və ya aylıq üçün isə «Həftənin günü» və ya «Ayın günü» seçin.',
  'help.guide.auto-backup.step.2':
    '«Köhnə ehtiyat nüsxələri bu müddətdən sonra sil» altında ehtiyat nüsxənin nə qədər saxlanacağını «1 gün»dən «Həmişə saxla»ya qədər seçin və «Yadda saxla» düyməsinə klikləyin.',
  'help.guide.auto-backup.result':
    'Ehtiyat nüsxələr cədvələ uyğun olaraq siyahıda görünür. Seçdiyiniz müddətdən köhnə olan nüsxələr silinir.',
  'help.guide.auto-backup.tip.1':
    '«İcra saatı» serverin vaxtından istifadə edir; altındakı ipucu serverin saat qurşağını göstərir.',
  'help.guide.auto-backup.tip.2':
    'Serverdəki yaddaş məhduddur: adətən 7 və ya 14 gün kifayətdir, endirilmiş nüsxə isə başqa yerdə saxlanılsın.',
  // audit-log
  'help.guide.audit-log.title': 'Audit jurnalını oxumaq',
  'help.guide.audit-log.goal': 'Kimin nə vaxt nə etdiyini öyrənin.',
  'help.guide.audit-log.step.1':
    'Sətirlər ən yenidən başlayır: «Vaxt», «İstifadəçi», «Əməliyyat», «Resurs», IP və «Ətraflı məlumat». Əməliyyatlar baş verən hadisəyə görə adlanır, məsələn, uğursuz giriş, MFA dəyişikliyi və ya bərpa.',
  'help.guide.audit-log.step.2':
    'Yuxarı sağdakı «Yenilə» siyahını yenidən yükləyir. Başlığın yanındakı nişan ümumi saydan neçə qeydin yükləndiyini göstərir, «Daha çox yüklə» isə köhnə qeydləri yükləyir.',
  'help.guide.audit-log.result': 'Nəyinsə niyə dəyişdiyini soruşan hər kəsə göstərə biləcəyiniz qeydiniz olur.',
  'help.guide.audit-log.tip.1': 'Vaxtlar serverin saat qurşağında göstərilir.',
  'help.guide.audit-log.tip.2':
    'Jurnala yalnız yeni qeydlər əlavə olunur, buradakı heç nəyi tətbiqdən redaktə etmək və ya silmək olmur.',

  // ── Screen: trip ──────────────────────────────────────────────────────────────────────
  'help.ctx.trip.title': 'Səyahət',
  'help.ctx.trip.summary':
    'Bir səyahət haqqında hər şey: günləri, xəritəsi və məkanları ilə plan, həmçinin turlar, nəqliyyat, rezervasiyalar, siyahılar, xərclər, fayllar, birgə iş və əlaqələndirilmiş gündəlik üçün vərəqlər. Onların hər birinin bunun altında öz kömək ekranı var.',
  'help.ctx.trip.bullet.1':
    'Üst panelin altındakı vərəqlər: «Plan», «Turlar», «Nəqliyyat», «Rezervasiyalar», «Siyahılar», «Xərclər», «Fayl», «Collab» və gündəlik əlaqələndirildikdən sonra «Gündəlik». Sizin TREK-də hansı vərəqlərin olacağını əlavələr və plaginlər müəyyən edir.',
  'help.ctx.trip.bullet.2':
    '«Plan» üç sütundan ibarətdir: solda günlər, ortada xəritə, sağda məkanlar. Avtomobil səyahəti əlavəsi aktivdirsə, günlər sütunu «Gün» və «Avtomobil səyahəti» keçidi ilə, Turlar əlavəsi aktivdirsə, məkanlar sütunu «Məkan» və «Turlar» ilə başlayır. Rezervasiyalar və nəqliyyat planın bir hissəsidir, dayanacaqda və dayanacaqlar arasında göstərilir; vərəqlər onları siyahı halında göstərir.',
  'help.ctx.trip.bullet.3':
    'Yuxarı solda səyahətin adının yanındakı «Səyahət parametrləri» düyməsi səyahətin tənzimləmələrini açır: «İnsanlar» (üzvlər və qonaqlar), «Paylaşım» (yalnız oxuma üçün ictimai link və dəvət linki) və «Gündəlik».',
  'help.ctx.trip.bullet.4':
    'Başlıq, tarixlər, üz şəkli və valyuta «Səyahətlərim» səhifəsində səyahət kartındakı qələmlə redaktə olunur. Yuxarı soldakı səyahət adı sizi ora qaytarır.',
  'help.ctx.trip.bullet.5':
    'Sütunun daxili kənarındakı dil sütunu yığır, xəritə isə boşalan yeri tutur. Yığılmış sütun xəritənin yuxarı küncündə kiçik xana kimi görünür; sütunu yenidən göstərmək üçün ona klikləyin. Enini dəyişmək üçün sütunun yanındakı nazik ayırıcını sürükləyin.',
  'help.ctx.trip.bullet.6':
    'Günlərin alətlər panelindəki geri qaytarma oxu plandakı son dəyişikliklərinizi bir-bir geri qaytarır.',
  // add-member
  'help.guide.add-member.title': 'Üzv əlavə edin',
  'help.guide.add-member.goal': 'TREK hesabı olan birinə bu səyahətə giriş verin.',
  'help.guide.add-member.step.1':
    'Yuxarı solda səyahətin adının yanındakı «Səyahət parametrləri» düyməsinə klikləyin. O, «İnsanlar» bölməsində açılır.',
  'help.guide.add-member.step.2':
    '«İstifadəçi dəvət et» altında «İstifadəçi seçin…» siyahısından şəxsi seçin və «Dəvət et» düyməsinə klikləyin.',
  'help.guide.add-member.step.3':
    'Şəxs indi «Giriş icazəsi» altında görünür. Sahibi «Sahib» nişanı göstərir. Sətrin sonundakı «Giriş icazəsini ləğv et» təsdiqdən sonra şəxsi çıxarır.',
  'help.guide.add-member.result':
    'Üzv səyahəti sizin kimi görür və redaktə edir, administratorun «İcazə tənzimləmələri» bölməsində təyin etdiyi səviyyələr çərçivəsində.',
  'help.guide.add-member.tip.1':
    'Siyahıda olmayan şəxsin hələ TREK hesabı yoxdur: onu qonaq kimi əlavə edin və ya dəvət linki ilə qeydiyyatdan keçməsini təklif edin.',
  'help.guide.add-member.tip.2':
    '«Giriş icazəsi» yanındakı rəqəm səyahətdəki insanların sayını göstərir; qonaqlar aşağıda ayrıca sadalanır.',
  // trip-invite-link
  'help.guide.trip-invite-link.title': 'Link ilə dəvət etmək',
  'help.guide.trip-invite-link.goal': 'İnsanların səyahətə özləri qoşulmasına imkan verin.',
  'help.guide.trip-invite-link.step.1':
    'Səyahətin adının yanındakı «Səyahət parametrləri» düyməsinə klikləyin və solda «Paylaşım» seçin. «Səyahət dəvət linki» altında «Dəvət linki yarat» düyməsinə klikləyin.',
  'help.guide.trip-invite-link.step.2':
    '«Kopyala» düyməsinə klikləyib linki göndərin. TREK hesabı olan hər kəs linki açanda üzv kimi qoşulur.',
  'help.guide.trip-invite-link.step.3':
    '«Yenidən yarat» linki yenisi ilə əvəz edir və köhnə link işləməz olur; «Deaktiv et» onu söndürür.',
  'help.guide.trip-invite-link.result': 'Linki açan hər kəs səyahətə qoşulur və «Giriş icazəsi» bölməsində görünür.',
  'help.guide.trip-invite-link.tip.1':
    'Hesabı olmayan şəxs bu linkdən istifadə edə bilməz. Administrator qeydiyyat linklərini «Administrator», «İstifadəçilər» bölməsində yaradır və onlardan birini bu səyahətə bağlaya bilər.',
  'help.guide.trip-invite-link.tip.2':
    'Linki səhv çata göndərmisinizsə, onu «Yenidən yarat» ilə yeniləyin: köhnə link dərhal işləməz olur.',
  // add-guest
  'help.guide.add-guest.title': 'Hesabı olmayan qonaq əlavə etmək',
  'help.guide.add-guest.goal': 'TREK-dən istifadə etməyən birini səyahətə əlavə edin.',
  'help.guide.add-guest.step.1':
    'Səyahətin adının yanındakı «Səyahət parametrləri» düyməsinə klikləyin. «İnsanlar» bölməsində «Qonaqlar» ən sondadır, «Giriş icazəsi»nin altında.',
  'help.guide.add-guest.step.2': 'Adı «Qonağın adı» sahəsinə yazıb «Qonaq əlavə et» düyməsinə klikləyin.',
  'help.guide.add-guest.result':
    'Qonağı xərclərə, baqaj elementlərinə və tapşırıqlara təyin etmək olar, amma o, daxil ola bilmir.',
  'help.guide.add-guest.tip.1':
    '«Adını dəyiş» (qələm) qonağın adını dəyişir. «Giriş icazəsini ləğv et» (zibil qutusu) təsdiqdən sonra qonağı silir: onun təyinatları silinir, hər xərcdəki payı isə bölgüdəki digər şəxslər arasında bölünür.',
  'help.guide.add-guest.tip.2': 'Həmin şəxs sonradan hesab açsa, onu üzv kimi dəvət edin və qonağı silin.',
  // public-link
  'help.guide.public-link.title': 'Yalnız baxış üçün link paylaşın',
  'help.guide.public-link.goal': 'Səyahəti onu redaktə etməməli olan insanlara göstərin.',
  'help.guide.public-link.step.1':
    'Səyahətin adının yanındakı «Səyahət parametrləri» düyməsinə klikləyin və solda «Paylaşım» seçin.',
  'help.guide.public-link.step.2':
    '«İctimai link» kartında linkin nəyi göstərə biləcəyini yandırın. «Xəritə və plan» həmişə aktivdir; rezervasiyalar, baqaj, xərclər və çat sizin seçiminizdir.',
  'help.guide.public-link.step.3':
    '«Seçimlər» altında «Yalnız səfər və qalma yerləri» fəaliyyətləri, gün qeydlərini və boş günləri çıxarır. «Fotosuz» məkan fotolarını çıxarır.',
  'help.guide.public-link.result':
    'Linki olan hər kəs seçilmiş hissələri daxil olmadan görür, amma heç nəyi dəyişə bilmir.',
  'help.guide.public-link.tip.1':
    'Link heç yerdə dərc olunmur, amma onu əldə edən hər kəs aça bilər. Onu parol kimi gizli saxlayın.',
  'help.guide.public-link.tip.2': 'Redaktə hüququ vermək istəyirsinizsə, həmin şəxsi üzv kimi əlavə edin.',
  // transfer-ownership
  'help.guide.transfer-ownership.title': 'Səyahəti başqasına verin və ya ondan çıxın',
  'help.guide.transfer-ownership.goal': 'Başqasını sahib edin və ya sizə məxsus olmayan səyahətdən çıxın.',
  'help.guide.transfer-ownership.step.1':
    'Səyahətin adının yanındakı «Səyahət parametrləri» düyməsinə klikləyin. «Giriş icazəsi» altında üzvün sətrində «Sahib et» (tac) düyməsinə klikləyin və təsdiqləyin.',
  'help.guide.transfer-ownership.step.2':
    'Öz sətrinizdəki «Səyahətdən ayrıl» təsdiqdən sonra sizi səyahətdən çıxarır. Sahibsinizsə, əvvəlcə sahibliyi başqasına verin.',
  'help.guide.transfer-ownership.result':
    'Yeni sahib üzvləri idarə edir və səyahəti silə bilər, siz isə adi üzv kimi qalırsınız.',
  'help.guide.transfer-ownership.tip.1':
    'Sahiblik başqasına verilənə qədər sahib səyahəti yaradan şəxsdir. Səyahəti yalnız sahib silə bilər.',
  'help.guide.transfer-ownership.tip.2':
    'Başqa üzvün sətrindəki «Giriş icazəsini ləğv et» əks istiqamətdə işləyir: sahib həmin üzvü səyahətdən çıxarır.',
  // collapse-columns
  'help.guide.collapse-columns.title': 'Xəritə üçün yer açmaq',
  'help.guide.collapse-columns.goal': 'Sütunu yığın və ya genişləndirin.',
  'help.guide.collapse-columns.step.1':
    'Sütunu yığmaq üçün günlər sütununun daxili kənarındakı panel ikonlu taba klikləyin; boşalan yeri xəritə tutur. Məkanlar sütununda da eyni tab var.',
  'help.guide.collapse-columns.step.2':
    'Sütun yığıldıqda xəritənin yuxarı küncündə panel işarəsi olan kiçik xana görünür; ipucunda «Plan» və ya «Məkan» yazılır. Sütunu yenidən göstərmək üçün ona klikləyin.',
  'help.guide.collapse-columns.step.3':
    'Sütunun enini dəyişmək üçün sütunla xəritə arasındakı nazik ayırıcını sürüşdürün.',
  'help.guide.collapse-columns.result':
    'Sütunların eni yadda saxlanılır. Növbəti dəfə girəndə sütunlar yenidən açıq olur.',
  'help.guide.collapse-columns.tip.1': 'Yalnız xəritəni görmək üçün hər iki sütunu eyni anda yığa bilərsiniz.',
  'help.guide.collapse-columns.tip.2':
    'Dar pəncərəyə yalnız bir sütun sığır: birini açdıqda digəri yığılır. Telefonda sütunlar yoxdur; görünüşlər arasında yuxarıdakı «Səyahət», «Plan» və «Məkan» ilə keçid edilir.',
  // undo-change
  'help.guide.undo-change.title': 'Son dəyişikliyi geri qaytarmaq',
  'help.guide.undo-change.goal': 'Plana etdiyiniz son dəyişikliyi geri alın.',
  'help.guide.undo-change.step.1':
    'Günlərin üstündəki alətlər panelində geri al oxuna klikləyin. Onun ipucu hansı dəyişikliyin geri alınacağını göstərir.',
  'help.guide.undo-change.result':
    'Plan əvvəlki vəziyyətinə qayıdır, qısa mesaj isə nəyin geri qaytarıldığını bildirir.',
  'help.guide.undo-change.tip.1':
    '«Geri qaytar» planı əhatə edir: məkanları əlavə etmək, təyin etmək, çıxarmaq, sıralamaq, köçürmək və kilidləmək, günü təmizləmək, marşrutu optimallaşdırmaq, məkanları silmək, kateqoriya dəyişiklikləri və idxallar.',
  'help.guide.undo-change.tip.2':
    'Daha geriyə getmək üçün yenə klikləyin: TREK siz səyahətdən çıxana qədər bu səyahətdəki son 30 dəyişikliyinizi, ən yenisi birinci olmaqla, saxlayır.',
  'help.guide.clear-day.title': 'Günü təmizləyin',
  'help.guide.clear-day.goal': 'Gündəki bütün məkanları bir anda silin, məsələn, günü sıfırdan planlaşdırmaq üçün.',
  'help.guide.clear-day.step.1': 'Planda günün başlığına sağ klikləyin.',
  'help.guide.clear-day.step.2': '«Günü təmizlə» seçin və təsdiqləyin.',
  'help.guide.clear-day.result':
    'Gün boşalır, məkanları isə planlaşdırılmamış kimi siyahıya qayıdır. Günlərin üstündəki geri al oxu onları yerinə qaytarır.',
  'help.guide.clear-day.tip.1': 'Yalnız məkanlar silinir. Günün qeydləri və rezervasiyaları yerində qalır.',

  // ── Screen: trip-places ───────────────────────────────────────────────────────────────
  'help.ctx.trip-places.title': 'Məkanlar',
  'help.ctx.trip-places.summary':
    'Planın sağ sütunu: səyahətin planlaşdırılmış və ya planlaşdırılmamış bütün məkanları, axtarış, filtrlər və sıralama, həmçinin məkan əlavə etmə yolları: axtarışla, əl ilə və ya paylaşılmış siyahıdan. Yuxarıdakı «Məkan» və «Turlar» məkanlarla səyahətin turları arasında keçid edir.',
  'help.ctx.trip-places.bullet.1':
    'Sütunun yuxarısındakı «Məkan» və «Turlar» siyahını dəyişir. Daxil olduqda «Məkan» açıq olur. «Turlar» səyahətin turlarını sadalayır və «GPX və ya KML idxal et» ilə GPX, KML və KMZ faylları idxal edir; tur məkanlar siyahısında görünmür.',
  'help.ctx.trip-places.bullet.2':
    '«Məkan/Fəaliyyət əlavə et» axtardığınız və ya yazdığınız məkan üçün formanı açır. Gün açıq olduqda düymədə «Yeni məkan» yazılır, yanındakı «Günə əlavə et» isə məkanı birbaşa həmin gündə yaradır.',
  'help.ctx.trip-places.bullet.3':
    'Yanındakı işarə düyməsi, «Məkanları idxal et», Google Maps və ya Naver Maps-dən paylaşılmış siyahı üçün «Siyahı idxalı» təklif edir. Administrator Turlar əlavəsini söndürübsə, burada .gpx, .kml və .kmz faylları üçün «Faylı idxal et» də var və faylı sütunun üzərinə atmaq olar.',
  'help.ctx.trip-places.bullet.4':
    'Onların altında təsvirlərdə və qeydlərdə də axtaran «Axtar» sahəsi və yanında «Seç» işarə qutusu var. Altındakı sətirdə filtrlər yerləşir: «Göstər» «Hamısı», «Planlaşdırılmayıb» və «Planlaşdırılıb» arasında keçid edir, hər birinin yanında sayı göstərilir. Etiket düyməsi kateqoriyaya, ulduz minimum reytinqə, qlobus (səyahət birdən çox ölkə və ya regionu əhatə etdikdə) ölkə və ya regiona görə süzür, «Sıralama» isə siyahının ardıcıllığını təyin edir.',
  'help.ctx.trip-places.bullet.5':
    'Sətirdə şəkil, ad və təsvir və ya ünvan, kimsə məkanı qiymətləndirdikdən sonra isə orta reytinqli ulduz göstərilir. Məkanın təfərrüatlarını görmək üçün ona klikləyin, günə sürükləyin, ya da sağ klikləyin (və ya üç nöqtəyə, «Daha çox seçim»ə klikləyin): «Redaktə et», «+ Gün», «Veb-saytı aç», Google Maps, «Kolleksiyada yadda saxla» və «Sil».',
  'help.ctx.trip-places.bullet.6':
    'Gün açıq olduqda sətrin sonundakı dairəvi + («+ Gün») məkanı həmin günə əlavə edir. O, həmin gündə hələ olmayan bütün məkanlarda görünür. Bu zaman «Planlaşdırılıb» yalnız həmin günü göstərir, «Yalnız açıq gün göstərilir» nişanı da bunu bildirir. Onun x işarəsi, «Bütün səyahəti göstər», günü bağlayır.',
  // create-place
  'help.guide.create-place.title': 'Məkan yaratmaq',
  'help.guide.create-place.goal': 'Məkanı və ya fəaliyyəti plan üçün lazım olan bütün məlumatlarla əllə əlavə edin.',
  'help.guide.create-place.step.1':
    'Məkanlar sütununun yuxarısındakı «Məkan/Fəaliyyət əlavə et» düyməsinə (gün açıq olduqda «Yeni məkan») klikləyin. Forma kursor axtarış sahəsində olmaqla açılır.',
  'help.guide.create-place.step.2':
    'Məkanı «Məkanları axtarın…» sahəsinə yazın və nəticəni seçin. Pəncərənin yuxarısındakı ad, «Ünvan», «Enlik», «Uzunluq» və «Veb-sayt» doldurulur, soldakı «Məkan təfərrüatları» isə şəkilləri, iş saatlarını və təsviri göstərir. Google açarı olan TREK-də nəticələrin altındakı «Not the right place? Search Google instead» eyni axtarışı Google ilə aparır. Kolleksiyalar aktivdirsə, sağdakı «Saxlanılan məkanlar» siyahılarınızdakı yerləri eyni qaydada təklif edir.',
  'help.guide.create-place.step.3':
    '«Məkan təfərrüatları» bölməsində «Şəkil seç» altındakı şəklə klikləyin ki, o, məkanın şəkli olsun. «Bu mətndən istifadə et» təsviri formaya köçürür.',
  'help.guide.create-place.step.4':
    'Formanın sahələrini yoxlayın. Pəncərənin yuxarısındakı ad yeganə məcburi sahədir. Onun altındakı «Kateqoriya» düyməsi səyahətin kateqoriyalarından birini seçir, yanındakı + isə yenisini yaradır. «Ünvan», «Enlik» və «Uzunluq» axtarışdan gəlir və ya onları özünüz yazırsınız. «Təsvir» və «Qeydlər» öz mətniniz üçündür. «Veb-sayt» linki saxlayır, «Fayl» altındakı «Əlavə et» sənəd əlavə edir, «Telefon», «E-poçt» və «İş saatlarını əlavə et» isə axtarışın tapmadığı məlumatlar üçündür.',
  'help.guide.create-place.step.5':
    '«Əlavə et» düyməsinə klikləyin. Səyahətdə eyni adlı və ya eyni yerdə olan məkan artıq varsa, TREK xəbərdarlıq göstərir və düymə «Yenə də əlavə et» olur.',
  'help.guide.create-place.result':
    'Məkan siyahıda və xəritədə görünür, hansısa günə əlavə olunana qədər «Planlaşdırılmayıb» altında qalır.',
  'help.guide.create-place.tip.1':
    'Büdcə əlavəsi aktivdirsə, formanın aşağısındakı «Xərclər» yadda saxladıqdan dərhal sonra məkanın xərci üçün xərc redaktorunu açır. Pəncərəyə yapışdırılmış şəkil və ya PDF «Fayl» altında fayl kimi əlavə olunur.',
  'help.guide.create-place.tip.2':
    'Hər TREK-də axtarış nəticələrini TREK indeksi və OpenStreetMap verir, «Məkan təfərrüatları» isə Wikipedia, Wikivoyage və Wikimedia-dan avtomatik doldurulur. TREK Google-a yalnız hər ikisi heç nə tapmadıqda müraciət edir və reytinqləri yalnız Google verir.',
  'help.guide.create-place.tip.3':
    'Məkanı xəritədə də yarada bilərsiniz: nöqtəyə sağ klikləyin, forma koordinat və ünvan doldurulmuş halda açılacaq.',
  // place-to-open-day
  'help.guide.place-to-open-day.title': 'Məkanı birbaşa açıq günə əlavə edin',
  'help.guide.place-to-open-day.goal': 'Məkanı yaradın və ya seçin və bir addımda günə əlavə edin.',
  'help.guide.place-to-open-day.step.1':
    'Günlər sütununda günün başlığına klikləyin. Gün açılır: kartı vurğulanır, məkanlar sütununda isə «Yeni məkan» yanında «Günə əlavə et» düyməsi görünür.',
  'help.guide.place-to-open-day.step.2':
    '«Günə əlavə et» «Yeni məkan» ilə eyni formanı açır, amma «Əlavə et» düyməsinə kliklədiyiniz an məkan açıq günə əlavə olunur.',
  'help.guide.place-to-open-day.step.3':
    'Mövcud məkanı açıq günə əlavə etmək üçün sətrinin sonundakı dairəvi + düyməsinə («+ Gün») klikləyin və ya ona sağ klikləyib «+ Gün» seçin. + həmin gündə hələ olmayan bütün məkanlarda görünür.',
  'help.guide.place-to-open-day.step.4':
    'Əvvəlcə günü açmadan, əksinə də işləyir: məkanın sətrini sütundan çıxarıb gün kartının üzərinə buraxın. İki dayanacaq arasına buraxsanız, dəqiq ora yerləşdirilir.',
  'help.guide.place-to-open-day.result':
    'Məkan günün siyahısının sonuna əlavə olunur. Onu yuxarı və ya aşağı çəkərək lazımi yerə qoyun.',
  'help.guide.place-to-open-day.tip.1':
    'Açıq gün axtarışa da təsir edir: hansısa gün açıq olanda xəritə və yaxınlıqdakı axtarış həmin gündə artıq olan məkanlardan başlayır.',
  'help.guide.place-to-open-day.tip.2': 'Günlərin üstündəki alətlər panelində «Geri qaytar» bu təyinatı ləğv edir.',
  // filter-places
  'help.guide.filter-places.title': 'Siyahıda məkan tapmaq',
  'help.guide.filter-places.goal': 'Sütunda yalnız axtardığınız məkanları göstərin.',
  'help.guide.filter-places.step.1':
    'Axtarışın altındakı «Göstər» siyahısı ilə «Hamısı», «Planlaşdırılmayıb» (hələ heç bir günə əlavə olunmayıb) və «Planlaşdırılıb» (bir günə əlavə olunub) arasında keçid edin, hər birinin yanında sayı göstərilir. Turlar əlavəsi söndürülübsə və GPX izi idxal edilibsə, «İzlər» seçimi də görünür.',
  'help.guide.filter-places.step.2':
    'Yuxarıdakı «Axtar» sahəsinə yazın. Siyahı yazdıqca ada, ünvana, təsvirə və qeydlərə görə daralır; sahədəki x onu təmizləyir.',
  'help.guide.filter-places.step.3':
    '«Göstər» yanındakı etiket düyməsi kateqoriyaları sadalayır: bir və ya bir neçəsini işarələyin, aralarında «Kateqoriya yoxdur» da var. Düymədə neçəsinin işarələndiyi göstərilir, siyahının aşağısındakı «Filtri təmizlə» isə hamısını götürür.',
  'help.guide.filter-places.step.4':
    'Yanındakı ulduz minimum reytinqi təyin edir: 5+, 4+ və s. yalnız orta reytinqi ən azı həmin qədər olan məkanları saxlayır. Reytinqi olmayan məkanlar gizlədilir.',
  'help.guide.filter-places.result':
    '«Göstər» üzərindəki rəqəm neçə məkanın uyğun gəldiyini göstərir, filtrlər isə bir-biri ilə birləşir.',
  'help.guide.filter-places.tip.1':
    'Gün açıq olanda «Planlaşdırılıb» yalnız həmin günü göstərir və bunu yazır: «Yalnız açıq gün göstərilir», yanında isə «Bütün səyahəti göstər».',
  'help.guide.filter-places.tip.2':
    'Xəritə də «Göstər», kateqoriyalar və reytinqi tətbiq edir, gün açıq olduqda isə xəritədə «Planlaşdırılıb» yalnız həmin günü göstərir. Axtarış və qlobus yalnız siyahını süzür.',
  // edit-place
  'help.guide.edit-place.title': 'Məkanı dəyişmək',
  'help.guide.edit-place.goal':
    'Adı düzəldin, sancağın yerini dəyişin, veb-sayt əlavə edin və ya kateqoriyanı dəyişin.',
  'help.guide.edit-place.step.1':
    'Sətrə sağ klikləyib «Redaktə et» seçin, ya da sətrin sonundakı «Daha çox seçim» düyməsinə klikləyin, ya da məkanı açıb təfərrüatlarında «Redaktə et» düyməsinə klikləyin.',
  'help.guide.edit-place.step.2':
    '«Məkanı redaktə et» pəncərəsində lazım olanı dəyişin: yuxarıdakı ad və «Kateqoriya» düyməsi, «Ünvan», «Enlik» və «Uzunluq», «Təsvir», «Qeydlər», «Veb-sayt», «Telefon», «E-poçt» və iş saatları. Məkan yalnız bir gündədirsə və ya onu bir gündən açmısınızsa, formada «Başlanğıc», «Son» və «Bu gün üçün qeydlər» də olur.',
  'help.guide.edit-place.step.3': '«Yenilə» düyməsinə klikləyin.',
  'help.guide.edit-place.result':
    'Dəyişiklik məkanın göründüyü hər yerdə tətbiq olunur: siyahıda, xəritədə və məkanın olduğu bütün günlərdə.',
  'help.guide.edit-place.tip.1': '«Bu gün üçün qeydlər» məkana yalnız həmin gündə aiddir, «Qeydlər» isə məkanın özünə.',
  'help.guide.edit-place.tip.2':
    '«Son» vaxtı «Başlanğıc»dan əvvəldirsə, «Yenilə» işləmir. «Vaxt üst-üstə düşür:» isə yalnız xəbərdarlıqdır: günün başqa dayanacağının eyni vaxtda olduğunu bildirir.',
  // delete-place
  'help.guide.delete-place.title': 'Məkanı silin',
  'help.guide.delete-place.goal': 'Məkanı səyahətdən həmişəlik silin.',
  'help.guide.delete-place.step.1':
    'Sətrə sağ klikləyib «Sil» seçin (sətrin sonundakı «Daha çox seçim»də də var), ya da məkanın təfərrüatlarında «Sil» düyməsinə klikləyin.',
  'help.guide.delete-place.step.2':
    'Təsdiq sualında «Sil» düyməsinə klikləyin. Məkanda gecələmə rezerv olunubsa və ya ona rezervasiya bağlıdırsa, sualda onunla birlikdə nəyin silinəcəyi yazılır.',
  'help.guide.delete-place.result':
    'Məkan siyahıdan, xəritədən və bütün günlərdən silinir. Günlərin üstündəki alətlər panelində «Geri qaytar» onu bərpa edir.',
  'help.guide.delete-place.tip.1':
    'Məkanı yalnız bir gündən çıxarmaq üçün bunun əvəzinə həmin dayanacaqda «Gündən çıxar» seçin.',
  'help.guide.delete-place.tip.2':
    'Bir neçə məkanı birdən silmək üçün axtarışın yanındakı işarəyə klikləyib seçim rejimini başladın.',
  // select-places
  'help.guide.select-places.title': 'Bir neçə məkanı birdən dəyişin və ya silin',
  'help.guide.select-places.goal': 'Məkanları bir-bir deyil, birdən dəyişin.',
  'help.guide.select-places.step.1':
    'Axtarış xanasının yanındakı işarəyə klikləyin. Sətirlərdə dairəvi qeyd qutuları peyda olur, sütunun aşağısında isə əməliyyatlar paneli görünür.',
  'help.guide.select-places.step.2':
    'Sətirləri işarələmək üçün onlara klikləyin. Paneldəki ikiqat işarə, «Hamısını seç», filtrlərin göstərdiyi bütün sətirləri seçir.',
  'help.guide.select-places.step.3':
    'Panel işarələnmiş məkanları sayır. «Kateqoriyanı dəyiş» hamısına bir kateqoriya verir; «Kolleksiyada yadda saxla» (Kolleksiyalar aktiv olduqda) onları kolleksiyalarınızdan birinə köçürür; «Seçilənləri sil» təsdiqdən sonra onları silir.',
  'help.guide.select-places.step.4': 'Seçimi bitirmək üçün panelin sonundakı X, yəni «Hazır» düyməsinə klikləyin.',
  'help.guide.select-places.result':
    'Dəyişiklik bütün seçilmiş məkanlara tətbiq olunur. Silməni günlərin üstündəki alətlər panelindən geri qaytarmaq olar.',
  'help.guide.select-places.tip.1':
    'Seçim zamanı filtrlər işləməyə davam edir: əvvəlcə «Planlaşdırılmayıb» filtrini seçin, sonra «Hamısını seç» yalnız həmin məkanları seçəcək.',
  'help.guide.select-places.tip.2':
    '«Kolleksiyalar» əlavəsi aktivdirsə, paneldə «Siyahılarınızdakıları ziyarət edilib kimi işarələ» görünür: məkanları saxlandıqları kolleksiyalarda ziyarət edilmiş kimi işarələyir.',
  // import-places-file
  'help.guide.import-places-file.title': 'GPX, KML və ya KMZ faylından məkan idxal edin',
  'help.guide.import-places-file.goal':
    'Turlar əlavəsi söndürülübsə, Google My Maps, Google Earth və ya GPS izləyicinin ixrac etdiyi sancaqları və xətləri məkan kimi idxal edin.',
  'help.guide.import-places-file.step.1':
    'Əlavə etmə düyməsinin yanındakı işarə düyməsinə, «Məkanları idxal et»ə klikləyin və «Faylı idxal et» seçin, ya da faylı məkanlar sütununun istənilən yerinə atın. Hər ikisi yalnız administrator Turlar əlavəsini söndürdükdə mövcuddur.',
  'help.guide.import-places-file.step.2':
    'Faylı seçin və ya qutuya sürükləyin. GPX üçün nəyi idxal edəcəyinizi işarələyin: «Yol nöqtələri», «Marşrutlar», «İzlər (marşrut xətti ilə)». KML və KMZ üçün «Nöqtələr (Placemarks)» və «Yollar (LineStrings)» işarələyin.',
  'help.guide.import-places-file.step.3':
    'Qutu bir neçə faylı birdən qəbul edir, amma yalnız .gpx, .kml və .kmz. Başqa növ fayl və ya 10 MB-dan böyük fayl pəncərədə rədd edilir və idxal olunmur.',
  'help.guide.import-places-file.step.4':
    '«İdxal et» düyməsinə klikləyin. Mesaj neçə məkanın idxal edildiyini bildirir. KML və ya KMZ faylı üçün pəncərə açıq qalır və nəyin yaradıldığı, nəyin buraxıldığı barədə xülasə göstərir.',
  'help.guide.import-places-file.result':
    'Məkanlar siyahıdadır. İzin sətrində rəngli xətt olur, o, xəritədə çəkilir və öz «İzlər» filtrini alır.',
  'help.guide.import-places-file.tip.1':
    'Çox böyük fayl qəbul edilmir və TREK ölçü limitini göstərir; faylı fotolarsız yenidən ixrac edin və ya hissələrə bölün.',
  'help.guide.import-places-file.tip.2': 'Bütün idxalı günlərin üstündəki alətlər panelindən geri qaytara bilərsiniz.',
  // import-places-list
  'help.guide.import-places-list.title': 'Paylaşılmış Google Maps və ya Naver Maps siyahısını idxal edin',
  'help.guide.import-places-list.goal': 'Paylaşılan siyahı linkindən məkanları idxal edin.',
  'help.guide.import-places-list.step.1':
    'Əlavə etmə düyməsinin yanındakı işarə düyməsinə, «Məkanları idxal et»ə klikləyin və «Siyahı idxalı» seçin.',
  'help.guide.import-places-list.step.2':
    '«Provayder» altında «Google siyahısı» və ya «Naver siyahısı» seçin, sonra siyahının paylaşma linkini «Əlaqələndir» sahəsinə yapışdırın. Google Maps marşrut linki də işləyir: onun dayanacaqları sürüş ardıcıllığı ilə məkanlara çevrilir.',
  'help.guide.import-places-list.step.3': '«İdxal et» düyməsinə klikləyin.',
  'help.guide.import-places-list.result':
    'Siyahının bütün məkanları siyahıdakı adları ilə səyahətə əlavə olunur; səyahətdə artıq olan məkanlar ötürülür.',
  'help.guide.import-places-list.tip.1':
    'Siyahı hamı üçün açıq paylaşılmalıdır. Şəxsi siyahının linki ilə heç nə idxal olunmur.',
  'help.guide.import-places-list.tip.2':
    'TREK-inizdə Google açarı olduqda pəncərədə «Məkan məlumatlarını Google vasitəsilə tamamla» görünür: o, idxal edilən hər məkanı axtarır və fotoları, ünvanı və təfərrüatları doldurur.',
  'help.guide.sort-places.title': 'Məkanlar siyahısını sıralayın',
  'help.guide.sort-places.goal':
    'Siyahını ada, reytinqə və ya ən son nəyin əlavə edildiyinə, yaxud dəyişdirildiyinə görə sıralayın.',
  'help.guide.sort-places.step.1':
    'Filtr sətrinin sonundakı oxlar düyməsinə, «Sıralama»ya klikləyin. Cari ardıcıllıq işarə ilə göstərilir, düymənin ipucunda isə onun adı yazılır.',
  'help.guide.sort-places.step.2':
    'Ardıcıllıq seçin, məsələn, «Ən yüksək reytinq», və ya ada görə sıralayın. Siyahı dərhal yenilənir.',
  'help.guide.sort-places.result': 'Siz başqa sıralama seçənə qədər siyahı məkanları seçdiyiniz qaydada göstərir.',
  'help.guide.sort-places.tip.1':
    '«Son əlavə edilənlər»dən başqa istənilən sıralama düyməni vurğulayır, beləliklə siyahının fərqli sıralandığını dərhal görürsünüz.',
  'help.guide.sort-places.tip.2':
    'Sıralama yalnız siyahını dəyişir. Günlər öz ardıcıllığını saxlayır, brauzeriniz isə seçdiyiniz ardıcıllığı yadda saxlayır.',
  'help.guide.place-by-hand.title': 'Axtarışın tapmadığı məkanı əlavə edin',
  'help.guide.place-by-hand.goal':
    'Məkan axtarışı heç nə tapmayanda məkanı telefonu, e-poçtu və iş saatları ilə özünüz daxil edin.',
  'help.guide.place-by-hand.step.1':
    'Məkan pəncərəsində adı axtarış xanasına yazın və Enter düyməsini basın. Heç nə tapılmasa, pəncərə bunu bildirir və «Əllə əlavə et» seçimini təklif edir.',
  'help.guide.place-by-hand.step.2':
    '«Əllə əlavə et» düyməsinə klikləyin. Axtardığınız mətn məkanın adı olur, pəncərə isə əlaqə xanalarına qədər sürüşür.',
  'help.guide.place-by-hand.step.3': 'Bilirsinizsə, «Telefon» və «E-poçt» sahələrini doldurun.',
  'help.guide.place-by-hand.step.4':
    '«İş saatlarını əlavə et» düyməsini klikləyin və məkanın hər gün nə vaxt açılıb bağlandığını təyin edin. Kopyalama düyməsi bütün günlərə birinci günün saatlarını verir, günün açarı isə həmin günü «Bağlanıb» kimi qeyd edir.',
  'help.guide.place-by-hand.step.5': '«Əlavə et» düyməsinə klikləyin.',
  'help.guide.place-by-hand.result':
    'Məkan siyahıya əlavə olunur. Təfərrüatlarında daxil etdiyiniz telefon, e-poçt və iş saatları axtarışla tapılan məkanlardakı kimi görünür.',
  'help.guide.place-by-hand.tip.1':
    'Öz iş saatları olmayan məkanı redaktə edəndə iş saatları soldakı «Məkan təfərrüatları» bölməsindən avtomatik köçürülür. Saatlar artıq varsa, onların yanındakı düymə tapılmış saatları köçürür.',
  'help.guide.place-by-hand.tip.2':
    'Daxil etdiyiniz iş saatları tapılmış saatları əvəz edir, beləliklə mövsümi iş saatları olan kafe sizin bildiyiniz saatları göstərir.',

  // ── Screen: trip-days ─────────────────────────────────────────────────────────────────
  'help.ctx.trip-days.title': 'Günlər',
  'help.ctx.trip-days.summary':
    'Planın sol sütunu: hər gün üçün bir kart, içində ardıcıl dayanacaqlar, qeydlər, günün rezervasiyaları və nəqliyyatı, həmçinin dayanacaqlar arasındakı marşrut. Səyahət əslində burada planlaşdırılır.',
  'help.ctx.trip-days.bullet.1':
    'Yuxarıdakı başlıq: solda «İxrac et» (PDF, təqvim, GPX); sağda geri qaytarma oxu, «Bütün günləri genişləndir» / «Bütün günləri yığ», «Günlərin sırasını dəyiş» və rezervasiyanın çəkiləcək marşrutu olduqda «Bütün rezervasiya marşrutlarını göstər».',
  'help.ctx.trip-days.bullet.2':
    'Gün kartı: gün nömrəsi və hava proqnozu olan xana, başlıq (ad verənə qədər «Gün 1») və tarix, altında isə gecələmə (giriş günü yaşıl, çıxış günü qırmızı, təsdiqlənməyibsə qırıq xətli; bilet işarəsi rezervasiyanı açır) və icarə avtomobili üçün nişanlar. Günü açmaq üçün başlığa klikləyin, ox onu yığır, + («Günə əlavə et») isə menyu açır: «Bu günə məkan əlavə et», «Yaşayış yeri əlavə et», «Nəqliyyat əlavə et», «İctimai nəqliyyat» və «Qeyd əlavə et». Başlığa sağ klik eyni seçimləri, üstəlik «Günü təmizlə» təklif edir.',
  'help.ctx.trip-days.bullet.3':
    'Günün içində: ardıcıllıqla dayanacaqlar, hər birində şəkil, kateqoriya işarəsi, ad, vaxt və təsvir, ona bağlı rezervasiyalar və kimlərin gedəcəyi; qeydlər; günün rezervasiyaları və nəqliyyatı, növünə görə rənglənmiş. Dayanacağın sürükləmə tutacağını, şəklindəki kilidi, oxları, «Rezervasiya əlavə et» və üç nöqtəni («Daha çox seçim») görmək üçün kursoru onun üzərinə gətirin. Dayanacaq və qeydlərin menyusunu sağ kliklə də aça bilərsiniz.',
  'help.ctx.trip-days.bullet.4':
    'Açıq gündə iki dayanacaq olduqdan sonra altında marşrut paneli görünür: «Marşrut» günü xəritədə göstərir və dayanacaqlar arasındakı hər hissənin yol vaxtını göstərir, üç işarə gün üçün «Avtomobil», «Piyada» və ya «Velosiped» təyin edir, sonra «Optimallaşdır», «Google Maps-də aç» və «CoMaps-də aç» gəlir.',
  'help.ctx.trip-days.bullet.5':
    'Məkanları günə bir neçə yolla əlavə edə bilərsiniz: məkanlar sütunundan sətri sürükləyin, həmin sətirdəki «+ Gün» düyməsindən, günün + menyusundakı və ya boş gündəki «Bu günə məkan əlavə et» seçimindən, yaxud məkanın təfərrüatlarından istifadə edin.',
  'help.ctx.trip-days.bullet.6':
    'Aşağıdakı «Ümumi xərc» «Xərclər» bölməsindəki günün dayanacaqlarına və rezervasiyalarına aid xərcləri, hər birini bir dəfə, göstərilən valyutanızda toplayır.',
  // read-day-plan
  'help.guide.read-day-plan.title': 'Gün planını oxumaq',
  'help.guide.read-day-plan.goal': 'Nəyisə dəyişməzdən əvvəl gün kartının hər hissəsinin nə demək olduğunu öyrənin.',
  'help.guide.read-day-plan.step.1':
    'Başlıq: gün nömrəsi və hava proqnozu olan xana, sonra «Gün 1» və ya verdiyiniz başlıq və tarix. Onların altında gecələmə (giriş günü yaşıl, çıxış günü qırmızı, təsdiqlənməyibsə qırıq xətli; üzərindəki bilet rezervasiyanı açır) və icarə avtomobili üçün nişanlar. Günü açmaq üçün başlığa klikləyin (təfərrüatlar paneli xəritənin üzərində açılır). Sağdakı + («Günə əlavə et») məkan, qalma, nəqliyyat, ictimai nəqliyyat əlaqəsi və ya qeyd əlavə edir, ox isə kartı yığır.',
  'help.guide.read-day-plan.step.2':
    'Dayanacaqda onun şəkli, kateqoriya işarəsi və adı, «Başlanğıc» vaxtı varsa vaxtı və təsviri göstərilir. «Bu gün üçün qeydlər» onun altında görünür. Kursoru sətrin üzərinə gətirdikdə idarəetmə düymələri çıxır: soldakı tutacaqla onu sürükləyirsiniz, şəkil marşrut optimallaşdırması üçün kilidə çevrilir, sağ tərəfdə isə oxlar («Yuxarı daşı», «Aşağı daşı»), «Rezervasiya əlavə et» və üç nöqtə («Daha çox seçim») var.',
  'help.guide.read-day-plan.step.3':
    'Dayanacaqdakı rezervasiya onun üzərində «Rezervasiya» nişanı kimi göstərilir: təsdiqləndikdə yaşıl, gözləyərkən sarı rəngdə, vaxtı və daşıyıcısı ilə. Rezervasiyanı açmaq üçün nişana klikləyin; yanındakı marşrut düyməsi onun marşrutunu çəkir. Nəqliyyatın növünə görə rənglənmiş, vaxtı və «Yola düşmə» və ya «Çatma» göstərilən ayrıca sətri var. Təfərrüatlarını açmaq üçün rezervasiyaya klikləyin; oradakı «Redaktə et» onu dəyişir.',
  'help.guide.read-day-plan.step.4':
    '«Marşrut» aktiv olduqda iki dayanacaq arasındakı birləşdirici hissənin günün hərəkət rejimində nə qədər vaxt apardığını və məsafəsini göstərir; yalnız həmin hissənin rejimini dəyişmək üçün ona klikləyin.',
  'help.guide.read-day-plan.step.5':
    'Açıq günün dayanacaqlarının altındakı marşrut paneli: «Marşrut» günün yolunu xəritədə çəkir, üç işarə «Avtomobil», «Piyada» və ya «Velosiped» seçir, sonra «Optimallaşdır» dayanacaqları yenidən sıralayır, «Google Maps-də aç» və «CoMaps-də aç» isə günü həmin tətbiqlərdə açır.',
  'help.guide.read-day-plan.result':
    'Kartdakı hər işarənin bir mənası var; aşağıdakı bələdçilər onların hər birini necə dəyişəcəyinizi izah edir.',
  'help.guide.read-day-plan.tip.1':
    'Menyusu üçün dayanacağa sağ klikləyin və ya üç nöqtəsinə klikləyin: «Redaktə et», «Gündən çıxar», «Marşruta daxil etmə», «Veb-saytı aç», «Kolleksiyada yadda saxla», «Sil». Naviqasiya tətbiqləri məkanın təfərrüatlarında, «Naviqasiya» altındadır.',
  'help.guide.read-day-plan.tip.2':
    'Dayanacağın üzərinə gələndə sətrin sonunda «Rezervasiya əlavə et» görünür. Orada yaradılan rezervasiya bu gündəki bu dayanacağa bağlanır.',
  // place-onto-day
  'help.guide.place-onto-day.title': 'Məkanı günə əlavə edin',
  'help.guide.place-onto-day.goal': 'Siyahıdakı məkanı günün dayanacağı edin və ardıcıllıqda lazımi yerə qoyun.',
  'help.guide.place-onto-day.step.1':
    'Məkanlar sütunundan sətri gün kartına sürükləyin. Dəqiq ora qoymaq üçün iki dayanacaq arasına, sona əlavə etmək üçün isə günün başlığına buraxın.',
  'help.guide.place-onto-day.step.2':
    'Sürükləmədən: başlığına klikləyərək günü açın, sonra məkanın sətrinin sonundakı dairəvi + düyməsinə («+ Gün») klikləyin və ya sətrə sağ klikləyib «+ Gün» seçin.',
  'help.guide.place-onto-day.step.3':
    'Günün + menyusunda və ya boş gündə olan «Bu günə məkan əlavə et» məkan formasını açır və yeni məkan dərhal həmin günə əlavə olunur.',
  'help.guide.place-onto-day.step.4':
    'Gün açıq olduqda məkanın təfərrüatlarındakı «Günə əlavə et» onu həmin günə qoyur; məkanlar sütununun başlığındakı «Günə əlavə et» isə birbaşa açıq gündə yeni məkan yaradır.',
  'help.guide.place-onto-day.result':
    'Məkan artıq günün dayanacağıdır. O, xəritədə günün nömrəsi ilə görünür, məkanlar sütunu isə onu «Planlaşdırılıb» altında sayır.',
  'help.guide.place-onto-day.tip.1':
    'Məkan bir neçə gündə ola bilər: onu ikinci günə məkanlar sütunundan əlavə edin. Dayanacağı bir gün kartından digərinə sürükləsəniz, o, köçürülür.',
  'help.guide.place-onto-day.tip.2': 'Başlıqdakı geri qaytarma oxu təyinatı ləğv edir.',
  'help.guide.place-onto-day.tip.3':
    'Dayanacağı vaxtı sabit olan iki qeydin arasına və ya vaxtı artıq təyin edilmiş rezervasiyadan əvvələ qoya bilməzsiniz: plan vaxt ardıcıllığını qoruyur.',
  // reorder-stops
  'help.guide.reorder-stops.title': 'Gündəki sıranı dəyişmək',
  'help.guide.reorder-stops.goal': 'Dayanacağı yuxarı, aşağı və ya başqa günə keçirin.',
  'help.guide.reorder-stops.step.1':
    'Kursoru dayanacağın üzərinə gətirin və onu tutacağından tutub kartda yeni yerə sürükləyin.',
  'help.guide.reorder-stops.step.2':
    'Və ya kursorun altındakı dayanacağın sağ tərəfindəki oxlardan («Yuxarı daşı», «Aşağı daşı») istifadə edin: hər klik bir addım.',
  'help.guide.reorder-stops.step.3':
    'Dayanacağı başqa günə köçürmək üçün onu həmin günün kartının üzərinə sürükləyin; o, köhnə gündən silinir.',
  'help.guide.reorder-stops.step.4':
    'Dayanacağın sabit vaxtı varsa və köçürmə günün ardıcıllığını pozarsa, TREK «Vaxt silinsin?» deyə soruşur, çünki vaxt dayanacağın yerini müəyyən edir. «Təsdiqlə» vaxtı silir ki, dayanacaq istənilən yerə keçə bilsin. «Ləğv et» günü olduğu kimi saxlayır.',
  'help.guide.reorder-stops.result': 'Marşrut və yol vaxtları dərhal yeni sıraya uyğun yenilənir.',
  'help.guide.reorder-stops.tip.1':
    'Sabit vaxtı olan rezervasiya öz vaxtının mövqeyində qalır. Onu günün başqa yerinə atsanız, geri qayıdır. Başqa günün kartına sürükləsəniz, həmin günə köçür.',
  'help.guide.reorder-stops.tip.2':
    'Gündə üç və ya daha çox dayanacaq olduqda marşrut panelindəki «Optimallaşdır» bütün günü ən qısa yola görə sıralayır. Dayanacağı yerində saxlamaq üçün əvvəlcə onu kilidləyin.',
  // set-stop-times
  'help.guide.set-stop-times.title': 'Dayanacağa vaxt təyin etmək',
  'help.guide.set-stop-times.goal': 'Dayanacağın başlama və bitmə vaxtını təyin edin ki, gün cədvəl kimi işləsin.',
  'help.guide.set-stop-times.step.1':
    'Dayanacağa sağ klikləyin və ya onun üç nöqtəsinə klikləyib «Redaktə et» seçin. Formanı gündən açanda məkan sahəsinin düz altında həmin gün üçün «Başlanğıc» və «Son» olur.',
  'help.guide.set-stop-times.step.2':
    '«Başlanğıc»ı, istəsəniz «Son»u da daxil edin. «Vaxt üst-üstə düşür:» xəbərdarlığı günün vaxtı olan başqa bir dayanacağı ilə üst-üstə düşmə olduğunu bildirir. «Son» «Başlanğıc»dan əvvəldirsə, «Yenilə» bloklanır.',
  'help.guide.set-stop-times.step.3':
    '«Yenilə» düyməsinə klikləyin. Dayanacağa vaxt nişanı əlavə olunur və o, vaxtına görə gün içində uyğun yerə keçir.',
  'help.guide.set-stop-times.result':
    'Vaxtı olan dayanacaqlar sıradakı yerini saxlayır; vaxtı olmayanlar onların ətrafında sıralanır.',
  'help.guide.set-stop-times.tip.1':
    'Vaxt həmin gündəki dayanacağa aiddir. Eyni məkanın başqa gündə başqa vaxtı ola bilər.',
  'help.guide.set-stop-times.tip.2':
    'Vaxtı təyin olunmuş dayanacağı əl ilə köçürmək üçün onu sürüşdürün. TREK «Vaxt silinsin?» deyə soruşur, «Təsdiqlə» düyməsinə kliklədikdə vaxt silinir.',
  'help.guide.set-stop-times.tip.3':
    'Eyni formadakı «Bu gün üçün qeydlər» yalnız həmin günə aid məlumat üçündür, məsələn, masa rezervasiyası və ya bilet nömrəsi.',
  // remove-from-day
  'help.guide.remove-from-day.title': 'Dayanacağı gündən çıxarın',
  'help.guide.remove-from-day.goal': 'Məkanı səyahətdən silmədən gündən çıxarın.',
  'help.guide.remove-from-day.step.1': 'Dayanacağa sağ klikləyin və ya üç nöqtəsinə klikləyin və «Gündən çıxar» seçin.',
  'help.guide.remove-from-day.step.2':
    'Dayanacaq gündən çıxarılır. Məkan məkanlar sütununda qalır, başqa heç bir günə əlavə olunmayıbsa, «Planlaşdırılmayıb» altında.',
  'help.guide.remove-from-day.result':
    'Gün, onun marşrutu və xərci yenilənir. Geri qaytarma oxu dayanacağı bərpa edir.',
  'help.guide.remove-from-day.tip.1': 'Eyni menyudakı «Sil» məkanı bütün günlər daxil olmaqla bütün səyahətdən silir.',
  'help.guide.remove-from-day.tip.2':
    '«Gündən çıxar» məkanın təfərrüatlar panelində, «Günə əlavə et» düyməsinin yanında da var.',
  // lock-stop
  'help.guide.lock-stop.title': 'Dayanacağı yerində kilidləyin',
  'help.guide.lock-stop.goal': 'Marşrut optimallaşdırılanda dayanacaq öz yerində qalsın.',
  'help.guide.lock-stop.step.1':
    'Dayanacağın şəklinin üzərinə gəlin və kilidə klikləyin: «Marşrut optimallaşdırılarkən mövqeyi dəyişməz saxla».',
  'help.guide.lock-stop.step.2':
    'İndi «Optimallaşdır» digər dayanacaqları onun ətrafında düzür. Kilidi açmaq üçün yenidən kilidə klikləyin («Kilidi açmaq üçün klikləyin»).',
  'help.guide.lock-stop.result': 'Kilid şəkildə görünür; siz kilidi açana qədər dayanacaq öz yerində qalır.',
  'help.guide.lock-stop.tip.1':
    'Sabit vaxtı olan dayanacaq öz vaxtı ilə kilidlənir və optimallaşdırma zamanı heç vaxt yerini dəyişmir.',
  'help.guide.lock-stop.tip.2':
    'Kilid yalnız səhifəni yeniləyənədək qüvvədədir. Yenilədikdən sonra bütün dayanacaqların kilidi açılır, yalnız vaxtı təyin olunmuş dayanacaqlar yerində qalır.',
  // day-note
  'help.guide.day-note.title': 'Günə qeyd əlavə edin',
  'help.guide.day-note.goal': 'Xatırlatmanı, bilet nömrəsini və ya ehtiyat planı birbaşa günün içində saxlayın.',
  'help.guide.day-note.step.1': 'Günün başlığındakı + düyməsinə («Günə əlavə et») klikləyin və «Qeyd əlavə et» seçin.',
  'help.guide.day-note.step.2':
    'Qeydin adını pəncərənin yuxarısında, «Qeyd» yazılan yerə yazın. Gün kartında bu ad göstərilir. Qalanını «Günlük qeyd» altında yazın: üstündəki alətlər paneli mətni formatlayır (qalın şrift, siyahılar, linklər, sitatlar), soldakı «Önizləmə» isə sətrin necə görünəcəyini göstərir.',
  'help.guide.day-note.step.3':
    'Qeydi dayanacaqlardan asan ayırmaq üçün «İkon» və «Rəng» seçin, sonra «Əlavə et» düyməsinə klikləyin.',
  'help.guide.day-note.step.4':
    'Qeyd gündə dayanacaq kimi görünür: onu lazımi yerə sürükləyin və ya oxlarından istifadə edin. Redaktə etmək üçün ona klikləyin. «Sil» pəncərədə, həmçinin üç nöqtə və ya sağ klik menyusunda var və əvvəlcə «Qeyd silinsin?» deyə soruşur.',
  'help.guide.day-note.result': 'Qeyd sürüklədiyiniz yerdə günün və PDF-in bir hissəsi olur.',
  'help.guide.day-note.tip.1': 'Qeyddəki linklər yeni tabda açılır, tək sətir keçidi isə sətir keçidi olaraq qalır.',
  'help.guide.day-note.tip.2': 'Qeydlər hər günə ayrıca aiddir. Bütün səyahət üçün qeydi «Əməkdaşlıq» bölməsinə yazın.',
  // day-route
  'help.guide.day-route.title': 'Günün marşrutunu göstərmək və optimallaşdırmaq',
  'help.guide.day-route.goal':
    'Dayanacaqlar arasındakı marşrutu görün, necə hərəkət edəcəyinizi seçin və sıralamanı TREK-ə tapşırın.',
  'help.guide.day-route.step.1':
    'Günü açın və dayanacaqların altındakı marşrut panelində «Marşrut» düyməsinə klikləyin: dayanacaqlar arasındakı marşrut xəritədə çəkilir, aralarındakı birləşdiricilərdə isə hər hissənin vaxtı və məsafəsi göstərilir.',
  'help.guide.day-route.step.2':
    'Yanındakı üç işarə günün hərəkət rejimini təyin edir: «Avtomobil», «Piyada» və ya «Velosiped». Hissələr yenidən hesablanır. Plaginlər öz rejimlərini əlavə edə bilər.',
  'help.guide.day-route.step.3':
    'Yalnız həmin hissənin rejimini dəyişmək üçün birləşdiriciyə klikləyin: rejim seçin, təklif olunan yerdə əlaqə axtarmaq üçün «İctimai nəqliyyat», ya da yenidən günün rejiminə qayıtmaq üçün «Günün standart seçimindən istifadə et».',
  'help.guide.day-route.step.4':
    '«Optimallaşdır» (dairəvi ox) üç dayanacaqdan başlayaraq dayanacaqları ən qısa yola görə yenidən sıralayır. Kilidli və ya sabit vaxtlı dayanacaqlar yerində qalır; gündə yaşayış yeri varsa, marşrut oradan başlayır.',
  'help.guide.day-route.step.5':
    '«Google Maps-də aç» və ya «CoMaps-də aç» yolda naviqasiya üçün bütün günü həmin tətbiqdə marşrut kimi açır; CoMaps günün hərəkət rejimindən də istifadə edir.',
  'help.guide.day-route.result':
    'Gün vaxtları olan marşruta çevrilir. Sıra dəyişdikcə «Ümumi xərc» və hissələr yenilənir.',
  'help.guide.day-route.tip.1':
    'Marşrutlar standart olaraq OSRM-dən gəlir; administrator «İstifadəçi standartları» bölməsində TREK üçün başqa marşrut mühərriki seçə bilər.',
  'help.guide.day-route.tip.2':
    'Marşrutu qurulmayan hissədə vaxt göstərilmir. Hər iki dayanacağın koordinatlarının olduğunu yoxlayın.',
  'help.guide.day-route.tip.3': 'Geri ox optimallaşdırmanı ləğv edir.',
  // manage-days
  'help.guide.manage-days.title': 'Günləri əlavə etmək, sıralamaq və adlandırmaq',
  'help.guide.manage-days.goal': 'Təkcə günlərdəki məkanları deyil, günlərin özünü dəyişin.',
  'help.guide.manage-days.step.1':
    'Günlər səyahətin tarixlərindən yaranır. Tarixləri «İdarə paneli»ndəki səyahətin redaktə formasında dəyişin, günlər əvvələ və ya sona əlavə olunur, ya da oradan silinir. İçində məlumat olan gün silinməzdən əvvəl hansı günlərin silinəcəyi və onlarda nə olduğu siyahı şəklində göstərilir.',
  'help.guide.manage-days.step.2':
    'Başlıqdakı «Günlərin sırasını dəyiş» siyahı açır: günü tutacağından sürükləyin və ya «Yuxarı daşı» və «Aşağı daşı» istifadə edin, gün məkanları, qeydləri və rezervasiyaları ilə birlikdə köçür. Siyahının altında növbəti tarixlə «Əlavə et» son tarixli günün ardınca gün əlavə edir və səyahəti bir gün uzadır; «Tarixsiz» sona tarixsiz gün əlavə edir. Tarixsiz səyahətdə yalnız «Gün əlavə et» var.',
  'help.guide.manage-days.step.3':
    'Sətrin sonundakı zibil qutusu, «Günü sil», əvvəlcə soruşur. Gün ilə birlikdə nəyin silinəcəyini sadalayır: məkanları, qeydləri və rezervasiyaları, həmin gün giriş və ya çıxışı olan qalmanı və bir tarix əvvələ keçəcək günləri. «Günü sil» onu silir, «Ləğv et» saxlayır; son günü silmək olmaz.',
  'help.guide.manage-days.step.4':
    'Günün adını dəyişmək üçün onu açın və xəritənin üzərindəki təfərrüatlar panelində başlığın yanındakı qələmə klikləyin. Yeni ad kartda və PDF-də «Gün 1» yazısını əvəz edir.',
  'help.guide.manage-days.step.5':
    'Başlıqdakı «Bütün günləri genişləndir» və «Bütün günləri yığ» bütün kartları birdəfəlik açır və ya yığır. Tək kartı yığmaq üçün onun oxuna klikləyin.',
  'help.guide.manage-days.result':
    'Tarixlər sıraya bağlı qalır: günü yuxarı daşıdıqda o, əvvəlki tarixi alır, dayanacaqları, qeydləri və rezervasiyaları da onunla birlikdə köçür.',
  'help.guide.manage-days.tip.1':
    'Günlərin köçürülməsini geri qaytarma oxu ilə geri qaytarmaq olar; günün silinməsini isə yox.',
  'help.guide.manage-days.tip.2':
    'Planın aşağısındakı «Ümumi xərc» bütün səyahəti toplayır; «Xərclər» vərəqi isə onu təfərrüatı ilə göstərir.',
  // bookings-in-plan
  'help.guide.bookings-in-plan.title': 'Plandakı rezervasiyaları və nəqliyyatı başa düşün',
  'help.guide.bookings-in-plan.goal':
    'Rezervasiya yarananda harada göründüyünü və onu hansı ekranın yaratdığını öyrənin.',
  'help.guide.bookings-in-plan.step.1':
    'Nəqliyyat (uçuş, qatar, bərə, avtobus, avtomobil) növünə görə rənglənmiş sətirdir: yola düşdüyü gün vaxtı və «Yola düşmə», endiyi gün isə «Çatma» ilə; yanındakı qlobus saat qurşağını göstərir, aralıq dayanacaqlı uçuşda isə hər hissə üçün bir sətir olur. İctimai nəqliyyat əlaqəsinin xətlərini göstərmək üçün oxa klikləyin. Sətrə klikləyin, rezervasiya açılır; oradakı «Redaktə et» onu dəyişir.',
  'help.guide.bookings-in-plan.step.2':
    'Dayanacağa bağlı rezervasiya (restoran, tur) həmin dayanacaqda vaxtı ilə birlikdə «Rezervasiya» nişanı kimi görünür. Təsdiqlənibsə nişan yaşıl, gözləmədədirsə kəhrəba rəngindədir. Günü olan, amma dayanacağa bağlı olmayan rezervasiya gün içində ayrıca sətirdə göstərilir.',
  'help.guide.bookings-in-plan.step.3':
    'Oteldə gecələmə yaşayış yeri sayılır: gün başlığındakı nişanı giriş günü yaşıl, çıxış günü qırmızıdır, bilet işarəsi isə rezervasiyanı açır. Günün təfərrüatlar panelində o, «Yaşayış yeri» altında göstərilir və həmin günlərin hər birinin marşrutu oradan başlayır.',
  'help.guide.bookings-in-plan.step.4':
    'Rezervasiya sətrindəki marşrut düyməsi onun marşrutunu xəritədə çəkir; başlıqdakı «Bütün rezervasiya marşrutlarını göstər» isə hamısını çəkir.',
  'help.guide.bookings-in-plan.step.5':
    'Yaratmaq üçün: kursorun altındakı dayanacaqda «Rezervasiya əlavə et», günün + menyusunda «Nəqliyyat əlavə et» və «İctimai nəqliyyat», idxal və fayllarla tam siyahı üçün isə «Rezervasiyalar» və «Nəqliyyat» vərəqləri.',
  'help.guide.bookings-in-plan.result':
    'Hər rezervasiya planda bir dəfə görünür. Tablar eyni rezervasiyaları siyahı kimi göstərir.',
  'help.guide.bookings-in-plan.tip.1':
    '«Təsdiqlənib» və «Gözləyir» rezervasiyada təyin etdiyiniz vəziyyətdir; plan onu dayanacaqda göstərir, «Rezervasiyalar» vərəqi isə hər ikisini sayır.',
  'help.guide.bookings-in-plan.tip.2':
    'Vaxtı olan rezervasiyanı günün başqa yerinə atsanız, o, öz vaxtının mövqeyinə qayıdır. Başqa günün kartına sürükləsəniz, həmin günə köçür. Vaxtını dəyişmək üçün rezervasiyanı redaktə edin.',
  // export-plan
  'help.guide.export-plan.title': 'Planı ixrac etmək',
  'help.guide.export-plan.goal': 'Planı sənəd kimi, təqviminizə və ya GPS cihazına ixrac edin.',
  'help.guide.export-plan.step.1': 'Günlərin üstündəki başlıq panelinin solundakı «İxrac et» düyməsinə klikləyin.',
  'help.guide.export-plan.step.2':
    '«Sənəd»: PDF bütün günlərin dayanacaqları, qeydləri və rezervasiyaları ilə çap görünüşünü marşrut icmalı xəritəsi ilə başlayaraq açır; «Mənim planım PDF kimi» yalnız iştirak etdiklərinizi saxlayır. Görünüşdə «Hər gün üçün yeni səhifə» hər günü yeni səhifədən başladır, «Nəqliyyat qeydləri» nəqliyyatınızın qeydlərini əlavə edir, «PDF kimi yadda saxla» isə onu endirir.',
  'help.guide.export-plan.step.3':
    '«Təqvim»: «.ics faylını endir» rezervasiyaları təqvim faylı kimi saxlayır, «Təqvimə abunə ol» isə təqvim tətbiqinizin avtomatik yenilədiyi link verir.',
  'help.guide.export-plan.step.4':
    '«Xəritələr və GPS» (GPX): «Bütün səyahət» məkanları, gün marşrutlarını və izləri ixrac edir; «Yalnız məkanlar» yalnız sancaqları; «Günlər marşrut kimi» oflayn xəritələr və GPS cihazları üçün hər gün bir marşrut.',
  'help.guide.export-plan.result': 'Fayl endirilir; səyahətdə heç nə dəyişmir.',
  'help.guide.export-plan.tip.1':
    'Tək bir günü xəritə tətbiqində açmaq üçün onun marşrut panelindən istifadə edin: «Google Maps-də aç» və ya «CoMaps-də aç».',
  'help.guide.export-plan.tip.2':
    '«Təqvimə abunə ol» üçün tənzimləmələrinizdə təqvim axınları yandırılmalı və səyahəti paylaşmaq hüququnuz olmalıdır; bunun üçün «İdarə paneli» bölməsində bələdçi var.',
  'help.guide.export-plan.tip.3':
    'İxrac üçün yalnız oxuma hüququ kifayətdir: səyahətin hər üzvü PDF, .ics və GPX ixrac edə bilər.',

  // ── Screen: trip-place ────────────────────────────────────────────────────────────────
  'help.ctx.trip-place.title': 'Məkan təfərrüatları',
  'help.ctx.trip-place.summary':
    'Məkan seçdikdə xəritənin üzərində açılan kart: səyahətin onun haqqında bildiyi hər şey, hər kəsin verdiyi ulduz reytinqləri, şəkli və faylları, həmçinin onu açıq günə əlavə etmək, xəritə tətbiqində açmaq və ya siyahıda saxlamaq üçün düymələr.',
  'help.ctx.trip-place.bullet.1':
    'Məkanlar sütununda sətrə, gün içindəki dayanacağa və ya xəritədəki nişana klikləyin, kart xəritənin üzərində açılır. Onu gündən açsanız, kart hansı dayanacağı nəzərdə tutduğunuzu bilir və dayanacağın iştirakçılarını və rezervasiyasını da göstərir. Tur («Turlar» vərəqindən yürüş, velosiped və ya piyada gəzinti) bunun əvəzinə öz tur kartını açır.',
  'help.ctx.trip-place.bullet.2':
    'Başlıqda dairəvi şəkil, ad, bir sətirdə ünvan və məlum olanlar üçün etiketlər var: açıq və ya bağlı, kateqoriya, vaxt, qiymət, telefon nömrəsi, e-poçt və koordinatlar. Öz şəklinizi və ya məkanın fayllarındakı fotonu istifadə etmək üçün şəklə klikləyin. Məkanın adını dəyişmək üçün ada iki dəfə klikləyin. Sağdakı X kartı bağlayır. Şəkil, adın dəyişdirilməsi, «Redaktə et» və «Sil» yalnız məkanları dəyişmək hüququ olan səyahətçilərə əlçatandır.',
  'help.ctx.trip-place.bullet.3':
    'Onun altında: hər səyahətçinin məkana verdiyi ulduzlar, təsvir və qeydlər, dayanacaqda varsa «Bu gün üçün qeydlər».',
  'help.ctx.trip-place.bullet.4':
    'Sonra aid olduqca «İş saatları», «Trekin rəngi», «Trek statistikası» və «Fayl» gəlir. «Fayl» başlığındakı «Yüklə» kompüterinizdən fayl əlavə edir, siyahıda isə bu dayanacağa bərkidilmiş və onun rezervasiyasına aid fayllar, o cümlədən otel təsdiqi də göstərilir. Plaginlər aşağıya öz sətirlərini əlavə edə bilər.',
  'help.ctx.trip-place.bullet.5':
    'Aşağıdakı sətir: gün açıq olduqda «Günə əlavə et» və ya «Gündən çıxar», sonra «Naviqasiya» (və ya «Tənzimləmələr»də seçmisinizsə, xəritə tətbiqinizin adı), «Veb-saytı aç» və «Kolleksiyada yadda saxla». Sağda qırmızı zibil qutusu məkanı silir, «Redaktə et» isə formasını açır.',
  'help.ctx.trip-place.bullet.6':
    'Axtarışdan seçdiyiniz məkanda TREK indeksinin və ya OpenStreetMap-in onun haqqında bildikləri göstərilir: yuxarıdakı nişanlar arasında məkanın yerli vaxtına görə «Açıq» və ya «Bağlanıb», şəklin ətrafında yaşıl və ya qırmızı halqa; telefon nömrəsi, o da nişan kimi; aşağıda «İş saatları», sətirdə bugünkü saatlar, klikləyəndə isə bütün həftə; veb-saytı isə «Veb-saytı aç» altında. Google reytinqi yalnız Google vasitəsilə tapılmış məkanda və Google açarı olan TREK-də görünür. Məkanın formasına özünüz yazdığınız iş saatları, telefon nömrəsi və e-poçt tapılmış məlumatları əvəz edir və halqanın rəngini də müəyyən edir.',
  // read-place
  'help.guide.read-place.title': 'Kart məkan haqqında nə deyir',
  'help.guide.read-place.goal': 'Səyahətdə bir məkan haqqında olan bütün məlumatları bir kartda oxuyun.',
  'help.guide.read-place.step.1':
    'Günlər sütununda baxmaq istədiyiniz dayanacağa klikləyin. Kart xəritənin üzərində açılır, dayanacaq isə öz günündə işarəli qalır.',
  'help.guide.read-place.step.2':
    'Yuxarıda: dairəvi şəkil, bir sətirdə ad və ünvan; ipucunda tam ünvan göstərilir. Altındakı nişanlar məkanın yerli vaxtına görə hazırda «Açıq» və ya «Bağlanıb» olduğunu bildirir, şəklin ətrafında da uyğun olaraq yaşıl və ya qırmızı halqa olur. Onlar həmçinin kateqoriyanı, vaxtı, telefon nömrəsini və e-poçtu (telefon və ya poçt tətbiqini açmaq üçün onlara klikləyin), geniş ekranda isə dəqiq koordinatları göstərir. Sağdakı X kartı bağlayır.',
  'help.guide.read-place.step.3':
    'Başlığın altındakı ilk bölmə «Reytinq»dir: hər səyahətçinin məkana verdiyi ulduzlar, orta qiymət və səs verənlərin sayı. Hələ heç kim səs verməyibsə, «Hələ qiymətləndirilməyib» yazılır.',
  'help.guide.read-place.step.4':
    'Sonra təsvir, onun altında isə qeydlər gəlir. Hər ikisi məkanın formasındakı mətndir və formatı saxlanılır: siyahılar, linklər və qalın şrift işləyir.',
  'help.guide.read-place.step.5':
    '«İştirakçılar» bu dayanacağa kimin gedəcəyini göstərir. Kimisə çıxarana qədər hamı daxildir.',
  'help.guide.read-place.step.6':
    'Bir az aşağıda «İş saatları»: sətirdə baxdığınız günün iş saatları görünür. Bütün həftəni görmək üçün ona klikləyin, həmin gün qalın şriftlə göstəriləcək. «Fayllar» onun yanındadır.',
  'help.guide.read-place.step.7':
    'Aşağıdakı sətir buradan edə biləcəyiniz əməliyyatlardır: məkanı açıq günə əlavə etmək və ya oradan çıxarmaq, xəritə tətbiqində və ya veb-saytında açmaq, siyahıda saxlamaq, sağda isə silmək (qırmızı zibil qutusu) və ya redaktə etmək.',
  'help.guide.read-place.result':
    'Kart onu X ilə bağlayana və ya başqa məkan seçənə qədər açıq qalır. Həftəlik iş saatları açıq görünür, aid olduğu dayanacaq isə günlər sütununda işarələnmiş qalır.',
  'help.guide.read-place.tip.1':
    'Məkanı məkanlar sütunundan seçdikdə kart dayanacağı deyil, məkanı göstərir. Ona görə iştirakçılar və yalnız məkanın özünə aid rezervasiyalar göstərilir, məsələn, otelin qalması. Hər şeyi görmək üçün dayanacağı günün içindən seçin.',
  'help.guide.read-place.tip.2':
    'Məkanları dəyişmək hüququnuz varsa, formanı açmadan məkanın adını dəyişmək üçün ada iki dəfə klikləyin. Enter saxlayır, Escape dəyişikliyi ləğv edir.',
  'help.guide.read-place.tip.3':
    'Əl ilə daxil edilmiş məkanda yalnız formasına yazılmış məlumatlar olur. «Redaktə et» düyməsinə klikləyib «Telefon», «E-poçt» və iş saatlarını özünüz doldurun, ya da onların tapılması üçün məkanı «Məkanları axtarın…» altındakı təkliflərdən seçib «Yenilə» düyməsinə klikləyin. Google reytinqi üçün Google açarı lazımdır.',
  // rate-place
  'help.guide.rate-place.title': 'Məkanı qiymətləndirmək',
  'help.guide.rate-place.goal': 'Məkana öz ulduzlarınızı verin və başqalarının verdiyi qiymətləri görün.',
  'help.guide.rate-place.step.1':
    'Məkanı açın. Ulduzlar başlığın düz altındadır və indiyədək verilən səslərin ortasını, mötərizədə isə səslərin sayını göstərir.',
  'help.guide.rate-place.step.2':
    'İstədiyiniz ulduza klikləyin. Kursoru ulduzların üzərində gəzdirdikcə onlar dolur, beləcə hansı reytinqi verəcəyinizi görürsünüz.',
  'help.guide.rate-place.step.3':
    'Səsiniz dərhal orta qiymətə əlavə olunur, yanındakı üzlər isə kimin səs verdiyini göstərir. Hamının ulduzlarını görmək üçün siçanı sətrin üzərinə gətirin.',
  'help.guide.rate-place.step.4':
    'Həmin orta qiymət məkanlar sütununda məkanın sətrində də görünür, belə ki ən yaxşı məkanları siyahıda asanlıqla tapa bilərsiniz.',
  'help.guide.rate-place.result':
    'Səyahətdəki hər kəs məkanda ulduzlarınızı görür. Siyahının üstündəki filtr sətrindəki ulduz indi yalnız ən azı müəyyən reytinqi olan məkanları göstərə bilər.',
  'help.guide.rate-place.tip.1':
    'Hər səyahətçi qiymət verə bilər, hətta məkanları yalnız bəzilərinizin dəyişə bildiyi səyahətdə də.',
  'help.guide.rate-place.tip.2':
    'Qiymətinizi silmək üçün artıq verdiyiniz ulduza klikləyin. Məkanı heç kim qiymətləndirmədikdə yenə «Hələ qiymətləndirilməyib» yazısı görünür.',
  'help.guide.rate-place.tip.3':
    'Ulduzların yanında altı nəfərə qədər səs verənin şəkli görünür. İpucu hamısını sadalayır və sizi ayrıca qeyd edir.',
  // place-image
  'help.guide.place-image.title': 'Məkana öz şəklinizi qoyun',
  'help.guide.place-image.goal': 'Avtomatik miniatürü öz fotonuzla əvəz edin.',
  'help.guide.place-image.step.1': 'Məkanı məkanlar sütunundan açın.',
  'help.guide.place-image.step.2':
    'Kursoru başlıqdakı dairəvi şəklin üzərinə gətirin: kamera görünür, ipucunda isə «Şəkil yüklə» yazılır. Ona klikləyin və faylınızı seçin. Məkanın fayllarında artıq fotolar varsa, TREK əvvəlcə seçim etməyi xahiş edir: «Cihazdan yüklə» və ya «Əlavə edilmiş fayllardan» altındakı şəkillərdən biri.',
  'help.guide.place-image.step.3': 'Kartın yuxarısında indi sizin şəkliniz görünür, küncündə isə kiçik qırmızı X var.',
  'help.guide.place-image.step.4':
    'Həmin şəkil məkanlar sütunundakı məkan sətrində və xəritədəki markerində də görünür.',
  'help.guide.place-image.result':
    'Şəkliniz məkan üçün hər yerdə istifadə olunur: kartda, məkanlar sütununda, gündəki dayanacaqda, xəritədəki markerdə və paylaşılan səyahətdə.',
  'help.guide.place-image.tip.1': 'JPG, PNG, GIF və WebP qəbul olunur, iPhone-dan gələn HEIC isə yükləyəndə çevrilir.',
  'help.guide.place-image.tip.2':
    'Küncdəki X şəklinizi silir və yenidən avtomatik şəkil görünür. Məkanın özü dəyişmir.',
  'help.guide.place-image.tip.3':
    'Şəkil əlavə etməmisinizsə, TREK məkanın koordinatlarına görə şəkil axtarır. Tapmasa, kateqoriyanın işarəsini göstərir. Şəkli yalnız məkanları dəyişmək hüququ olan səyahətçilər təyin edə bilər.',
  // place-day-assign
  'help.guide.place-day-assign.title': 'Məkanı açıq günə əlavə etmək və ya oradan çıxarmaq',
  'help.guide.place-day-assign.goal': 'Sətri planlayıcı boyunca çəkmək əvəzinə kartdakı düymədən istifadə edin.',
  'help.guide.place-day-assign.step.1':
    'Günlər sütununda günün başlığına klikləyin. İndi açıq gün odur və kart ona aid olur.',
  'help.guide.place-day-assign.step.2':
    'Məkanlar sütununda həmin gündə olmayan məkana klikləyin. Onun kartı açılır və aşağıdakı sətirdə «Günə əlavə et» düyməsi olur.',
  'help.guide.place-day-assign.step.3':
    '«Günə əlavə et» düyməsinə klikləyin. Dayanacaq günün sonuna əlavə olunur, düymə isə «Gündən çıxar» olur.',
  'help.guide.place-day-assign.step.4':
    'Dayanacaq artıq gündədir, siyahının sonunda. Onu yuxarı sürükləyib lazım olan yerə qoyun.',
  'help.guide.place-day-assign.step.5':
    '«Gündən çıxar» dayanacağı yenidən gündən çıxarır və kartda yenə «Günə əlavə et» görünür.',
  'help.guide.place-day-assign.result': 'Dayanacaq günə əlavə olunur və ya oradan çıxarılır. Məkanın özü dəyişmir.',
  'help.guide.place-day-assign.tip.1':
    'Düymə yalnız hansısa gün açıq olanda görünür. Açıq gün yoxdursa, məkanı əlavə etmək üçün gün də yoxdur.',
  'help.guide.place-day-assign.tip.2':
    'Dayanacağı gündən çıxarsanız, məkan səyahətdə və məkanlar sütununda qalır. «Sil» isə onu hər yerdən silir.',
  'help.guide.place-day-assign.tip.3':
    'Yaşayış yeri rezervasiyasının günə əlavə etdiyi dayanacaqda bu düymələrin heç biri olmur. Həmin gecəni günün gecələmə blokunda əlavə edir və silirsiniz.',
  // place-participants
  'help.guide.place-participants.title': 'Bu dayanacağa kimin gedəcəyini göstərmək',
  'help.guide.place-participants.goal':
    'Səyahətin iştirakçılarını dəyişmədən bir dayanacağa kimlərin gedəcəyini seçin.',
  'help.guide.place-participants.step.1':
    'Günün içindəki dayanacağa klikləyin. Kart açılır və «İştirakçılar» bölməsində səyahətdəki hər kəs sadalanır.',
  'help.guide.place-participants.step.2':
    'Səyahətçini bu dayanacaqdan çıxarmaq üçün onun çipinə klikləyin. Çipin üzərinə gələndə adın üstündən xətt çəkilir.',
  'help.guide.place-participants.step.3':
    'Kimsə əlavə olunmayıbsa, qırıq xətli + görünür. Dayanacaqda kimlərin olmadığını görmək üçün ona klikləyin.',
  'help.guide.place-participants.step.4':
    'Həmin şəxsi yenidən əlavə etmək üçün adına klikləyin. Hamı yenidən əlavə olunanda dayanacaq yenə bütün qrupa aid olur.',
  'help.guide.place-participants.result':
    'Dayanacaqda yalnız seçdiyiniz səyahətçilər göstərilir. Qrupun qalanı həmin vaxt sərbəstdir.',
  'help.guide.place-participants.tip.1':
    '«İştirakçılar» yalnız dayanacaq seçildikdə görünür, ona görə məkanı məkanlar sütununda deyil, günün içində seçin. Bu bölmə həm də yalnız birdən çox səyahətçisi olan səyahətdə görünür.',
  'help.guide.place-participants.tip.2':
    'Heç kim seçilməyibsə, hamı gedir. Buna görə dayanacaqdan son səyahətçini çıxarmaq olmur.',
  'help.guide.place-participants.tip.3': 'Öz hesabı olmayan qonaq da hamı kimi iştirakçı ola bilər.',
  // place-booking
  'help.guide.place-booking.title': 'Dayanacaqdakı rezervasiya',
  'help.guide.place-booking.goal': 'Dayanacağa aid rezervasiyaya baxın, onu açın və ya ona yeni rezervasiya bağlayın.',
  'help.guide.place-booking.step.1':
    'Rezervasiyanın aid olduğu dayanacağı açın. Kart onu «Rezervasiyalar» altında ayrıca kiçik kart kimi göstərir: rezervasiyanın adı və «Təsdiqlənib» ya da «Gözləyir».',
  'help.guide.place-booking.step.2':
    'Rezervasiya kartında «Tarix», «Vaxt» və «Rezervasiya kodu», rezervasiyanın digər təfərrüatları üçün etiketlər (uçuş nömrəsi, platforma, qeydiyyat) və rezervasiyanın qeydləri göstərilir.',
  'help.guide.place-booking.step.3': 'Rezervasiya kartına klikləyin. Rezervasiya xəritənin üzərində açılır.',
  'help.guide.place-booking.step.4':
    'Rezervasiyanın aşağısındakı «Redaktə et» onun formasını açır. Həmin formada «Günlük planla əlaqələndir» rezervasiyanı dayanacağa bağlayır və orada bu dayanacaq artıq göstərilir. Formanı yenidən bağlayın.',
  'help.guide.place-booking.step.5':
    'Dayanacaq üçün yeni rezervasiyaya günlər sütunundan başlayın: kursoru dayanacağın üzərinə gətirin və sonundakı bilet ikonuna, yəni «Rezervasiya əlavə et» düyməsinə klikləyin. Forma dayanacağa artıq bağlanmış «Yeni rezervasiya» kimi açılır.',
  'help.guide.place-booking.result':
    'Rezervasiya dayanacağa bağlanır: kartda və gündə göstərilir, faylları isə burada «Fayl» altında da görünür.',
  'help.guide.place-booking.tip.1':
    'Rezervasiya bərkidildiyi dayanacaqda görünür, otel rezervasiyası isə otelin özündə, onu harada açsanız, görünür. Dayanacağı olmayan rezervasiya «Rezervasiyalar» vərəqində göstərilir.',
  'help.guide.place-booking.tip.2':
    'Bir dayanacaqda bir neçə rezervasiya ola bilər, məsələn, nahar və eyni yerdən başlayan tur.',
  'help.guide.place-booking.tip.3':
    'Qatar, uçuş və ya bərə üçün «Redaktə et» bunun əvəzinə «Nəqliyyat» vərəqinin istifadə etdiyi nəqliyyat formasını açır.',
  // place-files
  'help.guide.place-files.title': 'Məkanın biletlərini məkanın özündə saxlayın',
  'help.guide.place-files.goal': 'Bileti, vauçeri və ya xəritəni aid olduğu məkana əlavə edin.',
  'help.guide.place-files.step.1':
    'Məkanı açın. «Fayl» təfərrüatların altında, məkanın iş saatları varsa onların yanında yerləşir; məkanda fayl olmadıqda da «Fayl» yazılır.',
  'help.guide.place-files.step.2': '«Fayl» başlığının sağındakı «Yüklə» düyməsinə klikləyin və faylı seçin.',
  'help.guide.place-files.step.3': 'Düymə məkanın neçə faylı olduğunu göstərir və siyahı avtomatik açılır.',
  'help.guide.place-files.step.4': 'Hər sətirdə faylın adı və ölçüsü göstərilir. Faylı açmaq üçün sətrə klikləyin.',
  'help.guide.place-files.result':
    'Fayl məkana əlavə olunur və kartda sayılır. O, səyahətin «Fayl» bölməsində də görünür.',
  'help.guide.place-files.tip.1':
    '«Fayl» həmçinin bu dayanacağa bərkidilmiş və onun rezervasiyasına əlavə edilmiş faylları göstərir, beləliklə, otel təsdiqi otelin özündə görünür.',
  'help.guide.place-files.tip.2':
    '«Yüklə» bir neçə faylı birdən qəbul edir, aralarındakı foto məkanın şəkli ola bilər.',
  'help.guide.place-files.tip.3':
    'Fayl yükləməyə icazəniz yoxdursa, «Yüklə» düyməsi görünmür; məkanda artıq olan fayllar isə yenə göstərilir.',
  // place-navigation
  'help.guide.place-navigation.title': 'Məkanı xəritə tətbiqində və ya saytında açmaq',
  'help.guide.place-navigation.goal': 'Məkana getmək üçün onu istifadə etdiyiniz naviqasiya tətbiqində açın.',
  'help.guide.place-navigation.step.1': 'Məkanı açın və aşağıdakı sətirdə «Naviqasiya» düyməsinə klikləyin.',
  'help.guide.place-navigation.step.2':
    'Siyahıda bu məkana uyğun xəritə tətbiqləri var: Google Maps, Waze, Apple Maps, OpenStreetMap və CoMaps, Android-də isə əlavə olaraq «Başqa xəritə tətbiqi».',
  'help.guide.place-navigation.step.3':
    'İstifadə etdiyiniz tətbiqə klikləyin. Mümkün olduqda TREK tətbiqə yalnız koordinatları deyil, məkanın özünü ötürür, belə ki, düz girişə gəlib çıxırsınız.',
  'help.guide.place-navigation.step.4':
    'Yanındakı «Veb-saytı aç» məkanın öz saytını iş saatları və biletləri ilə birlikdə yeni tabda açır.',
  'help.guide.place-navigation.result':
    'Xəritə tətbiqi məkanda açılır, veb-sayt yeni tabda açılır, səyahətdə isə heç nə dəyişmir. TREK tətbiq kimi quraşdırılıbsa, yeni tab əvəzinə xəritə tətbiqi açılır.',
  'help.guide.place-navigation.tip.1':
    'Waze naviqasiyaya dərhal başlayır. Digər tətbiqlər məkanı açır, naviqasiyaya başlamaq üçün bir dəfə də toxunmalısınız.',
  'help.guide.place-navigation.tip.2':
    'Hansı tətbiqlərin təklif olunacağı məkandan və cihazınızdan asılıdır: Apple Maps Android-də təklif olunmur, 高德地图 yalnız Çindəki məkan üçün təklif olunur, Waze, Apple Maps və CoMaps üçün isə məkanın koordinatları lazımdır. «Başqa xəritə tətbiqi» məkanı Android telefonunuzdakı istənilən xəritə tətbiqində açır.',
  'help.guide.place-navigation.tip.3':
    'Xəritə tətbiqinizi bir dəfə «Tənzimləmələr»də, «Yerləri açmaq üçün» altında seçin. Bundan sonra düymədə onun adı yazılır və onu dərhal açır. Məkana yalnız bir tətbiq uyğun gəldikdə də eyni şey olur.',
  // place-to-collection
  'help.guide.place-to-collection.title': 'Məkanı siyahılarınızdan birində saxlayın',
  'help.guide.place-to-collection.goal': 'Bu səyahətdə tapdığınız məkanı növbəti səyahət üçün saxlayın.',
  'help.guide.place-to-collection.step.1':
    'Məkanı açın və kartın aşağı sətrindəki «Kolleksiyada yadda saxla» düyməsinə klikləyin.',
  'help.guide.place-to-collection.step.2':
    '«Siyahıda saxla» sahibi olduğunuz və ya paylaşdığınız bütün siyahıları göstərir. Sağdakı dolu əlfəcin bu məkanın artıq olduğu siyahıları işarələyir.',
  'help.guide.place-to-collection.step.3': 'Siyahıya klikləyin. Məkan dərhal ona əlavə olunur.',
  'help.guide.place-to-collection.step.4': 'Pəncərəni X ilə bağlayın, kartdakı düymədə «Yadda saxlandı» yazılır.',
  'help.guide.place-to-collection.result':
    'Məkan şəkli, qeydləri və ünvanı ilə siyahınızdadır, növbəti səyahətə hazırdır.',
  'help.guide.place-to-collection.tip.1':
    'Bu düymə yalnız «Kolleksiyalar» əlavəsi aktiv olanda görünür. Onu administrator «Əlavələr» bölməsində aktivləşdirir.',
  'help.guide.place-to-collection.tip.2':
    'Məkan eyni anda bir neçə siyahıda ola bilər, hər birində fərqli statusla: birində ideya, digərində ziyarət edilib.',
  'help.guide.place-to-collection.tip.3':
    'Seçicinin yuxarısında, məkanın adının altındakı «Ziyarət edilib kimi işarələ» məkanı siyahıda ziyarət edilmiş kimi işarələyir. Məkan bir neçə siyahınızdadırsa, düymədə «Hamısını ziyarət edilib kimi işarələ» yazılır və o, hamısında birdəfəlik işarələyir. «Görünüş» siyahılarınızı «Kolleksiyalar»da açır.',
  // place-track
  'help.guide.place-track.title': 'Treki oxuyun və ona ayrıca rəng verin',
  'help.guide.place-track.goal':
    'İdxal etdiyiniz gəzintinin uzunluğunu və xəritədə hansı xəttin bu gəzinti olduğunu görün.',
  'help.guide.place-track.step.1':
    'Məkanlar sütununda izin sətrində xəritədəki izin rəngində qısa bir xətt var. Ona klikləyin.',
  'help.guide.place-track.step.2': '«Trek statistikası» yolun uzunluğunu seçdiyiniz ölçü vahidlərində göstərir.',
  'help.guide.place-track.step.3':
    'Onun üstündəki «Trekin rəngi» hazırkı rəngi göstərir. Rəng nümunələrini açmaq üçün sətrə klikləyin.',
  'help.guide.place-track.step.4': 'Rəng seçin. Xəritədəki xətt və sətirdəki zolaq onunla birlikdə dəyişir.',
  'help.guide.place-track.step.5':
    'Soldakı qırıq xətli xana, «Avtomatik rəng», trekə yenidən standart rəngini qaytarır. Sağdakı pipet isə istənilən başqa rəng üçün sisteminizin rəng seçicisini açır.',
  'help.guide.place-track.result': 'Trek seçdiyiniz rənglə kartda, məkanlar sütunundakı sətrində və xəritədə çəkilir.',
  'help.guide.place-track.tip.1':
    'Bu iki blok yalnız xətti olan məkanda olur: Turlar yaranmazdan əvvəl və ya Turlar söndürülmüş TREK-də GPX, KML və ya KMZ faylından idxal edilmiş məkan. Turlar aktiv olduqda yeni GPX faylı tura çevrilir və öz tur kartını açır.',
  'help.guide.place-track.tip.2':
    'Hündürlük məlumatı ilə yazılmış trek ən yüksək və ən aşağı nöqtəni, qalxış və enişin metrlərini və gəzintinin profilini də göstərir.',
  'help.guide.place-track.tip.3':
    'İdxal əlavə etdiyi hər izə ayrıca rəng verir, ona görə iki gəzinti heç vaxt eyni rəngdə olmur.',

  // ── Screen: trip-day-detail ───────────────────────────────────────────────────────────
  'help.ctx.trip-day-detail.title': 'Günün təfərrüatları',
  'help.ctx.trip-day-detail.summary':
    'Gün başlığına kliklədikdə xəritənin üzərində açılan panel. Burada gün bütövlükdə görünür: adı və tarixi, olacağınız yerdə hava, həmin günün rezervasiyaları və bu gün üçün rezerv edilmiş gecələr.',
  'help.ctx.trip-day-detail.bullet.1':
    'Günlər sütununda günün başlığına klikləyin, panel xəritənin ortasında açılır. Paneli bağlamaq və gün seçimini götürmək üçün həmin başlığa yenidən və ya sağdakı X-ə klikləyin. Məkanlar sütunundan və ya xəritədən məkanı açdıqda panel bağlanır və əvəzinə məkan göstərilir.',
  'help.ctx.trip-day-detail.bullet.2':
    'Başlıqda günün adı və tarixi göstərilir. Adın yanındakı qələm günün adını dəyişir. İkiqat ox paneli nazik zolağa yığır ki, xəritəni yenidən görə biləsiniz.',
  'help.ctx.trip-day-detail.bullet.3':
    'Yuxarıda günün havası göstərilir. «Proqnoz» sətri proqnozun hansı yer üçün olduğunu bildirir: günün ilk dayanacağı və ya oyandığınız otel.',
  'help.ctx.trip-day-detail.bullet.4':
    '«Rezervasiyalar» həmin günün rezervasiyalarını növü, aid olduğu dayanacaq və vaxtları ilə sadalayır. Yaşıl təsdiqlənmiş, sarı hələ gözləyən deməkdir, ictimai nəqliyyat səfəri isə mavidir və vəziyyəti yoxdur. Sətrə klik rezervasiyanı açır.',
  'help.ctx.trip-day-detail.bullet.5':
    '«Yaşayış yeri» bu günə düşən bütün rezerv edilmiş gecələri, baş verdiyi günlərdə «Giriş» və «Çıxış», giriş vaxt aralığı, çıxış vaxtı və təsdiq nömrəsi ilə göstərir. Qalmanın rezervasiyası varsa, altındakı «Rezervasiya» qutusu rezervasiyanı «Gözləyir» və ya «Təsdiqlənib» ilə göstərir. Rezervasiyanı açmaq üçün ona klikləyin.',
  'help.ctx.trip-day-detail.bullet.6':
    '«Yaşayış yeri əlavə et» bu günə gecələmə əlavə edir: obyekti səyahətin məkanlarından seçin, hansı günləri əhatə etdiyini göstərin, vaxtları və kodu əlavə edin. Günün başlığındakı + düyməsində («Günə əlavə et» ipucu ilə) də «Yaşayış yeri əlavə et» var: o, bu paneli forma artıq açılmış halda açır.',
  // day-panel
  'help.guide.day-panel.title': 'Günü açın və təfərrüatlarına baxın',
  'help.guide.day-panel.goal':
    'Bir günün hamısını, havası, rezervasiyaları və harada gecələdiyinizlə birlikdə xəritədən ayrılmadan görün.',
  'help.guide.day-panel.step.1':
    'Günlər sütununda günün başlığına klikləyin. Gün seçilir və təfərrüatları xəritənin ortasında açılır.',
  'help.guide.day-panel.step.2': 'Başlıqda günün adı (ad verənə qədər «Gün 1») və onun altında tarixi göstərilir.',
  'help.guide.day-panel.step.3':
    'Günün havası yuxarıdadır. «Proqnoz» onun hansı yer üçün olduğunu göstərir: günün ilk dayanacağı və ya əvvəlki gecəni keçirdiyiniz otel.',
  'help.guide.day-panel.step.4': 'Onun altındakı «Rezervasiyalar» bu günə düşən rezervasiyaları vaxtları ilə göstərir.',
  'help.guide.day-panel.step.5':
    '«Yaşayış yeri» bu günə düşən rezerv edilmiş gecələri göstərir, «Giriş» və «Çıxış» isə müvafiq günlərdə görünür.',
  'help.guide.day-panel.step.6':
    'Başlıqdakı ikiqat ox paneli nazik zolağa qədər yığır. Yanındakı X paneli bağlayır və günün seçimini ləğv edir.',
  'help.guide.day-panel.result':
    'Paneli zolağa qədər yığanda xəritə açılır, gün isə seçili qalır. Paneli bağlayanda günün seçimi götürülür, plan isə olduğu kimi qalır.',
  'help.guide.day-panel.tip.1':
    'Panelin başlıq zolağının istənilən yerinə klikləsəniz də, panel yığılır. Ox bunun yollarından yalnız biridir.',
  'help.guide.day-panel.tip.2':
    'Məkanı məkanlar sütunundan və ya xəritədən açdıqda günün paneli bağlanır və əvəzinə məkanın təfərrüatları göstərilir. Günü yenidən görmək üçün günün başlığına təkrar klikləyin.',
  // day-weather
  'help.guide.day-weather.title': 'Günün hava proqnozuna baxın',
  'help.guide.day-weather.goal': 'Həmin gün həqiqətən olduğunuz yerin havasını görün.',
  'help.guide.day-weather.step.1':
    'Proqnoz sətrində rəqəmlərin hansı yerə aid olduğu göstərilir: günün ilk dayanacağı, dayanacağı olmayan gündə isə əvvəlki gecə qaldığınız otel.',
  'help.guide.day-weather.step.2':
    'Böyük rəqəm günün temperaturudur. Yanında ən aşağı və ən yüksək temperatur, həmçinin havanın sözlə təsviri var.',
  'help.guide.day-weather.step.3':
    'Onun sağındakı nişanlar: yağış ehtimalı, yağıntının miqdarı, ən güclü külək, gündoğumu və günbatımı.',
  'help.guide.day-weather.step.4':
    'Ən aşağıda gün saat-saat, iki saatdan bir göstərilir: vaxt, ikon, temperatur və yağış ehtimalı. Ehtimal 50 faizdən çox olan saat mavi fonla seçilir.',
  'help.guide.day-weather.result':
    'Günlər sütunundakı gün kartında da hava nömrənin altında kiçik yazı ilə göstərilir, belə ki, bütün səyahətin havasını bir baxışda görə bilərsiniz.',
  'help.guide.day-weather.tip.1':
    'Dərəcə və külək Tənzimləmələrdə «Ümumi» bölməsindəki «Temperatur vahidi» ilə göstərilir: «°F Fahrenheit» seçsəniz, eyni proqnoz °F və mph ilə görünəcək.',
  'help.guide.day-weather.tip.2':
    'Yeri təyin edilmiş dayanacağı və əvvəlki gecədən oteli olmayan gün üçün hava ümumiyyətlə göstərilmir: proqnoz həmişə səyahət üçün deyil, konkret yer üçündür.',
  'help.guide.day-weather.tip.3':
    '16 gündən uzaq tarixlər üçün proqnoz yoxdur. Bu halda rəqəmlər həmin tarix üçün əvvəlki illərin orta göstəriciləridir. Onlar Ø ilə işarələnir, altındakı qeyd də bunu bildirir.',
  // rename-day
  'help.guide.rename-day.title': 'Günə ad vermək',
  'help.guide.rename-day.goal': 'Günə «Gün 5» əvəzinə «Kiotoya çatma» və ya «İstirahət günü» kimi ad verin.',
  'help.guide.rename-day.step.1': 'Günü açın. Başlıqda «Gün 5», altında isə tarix yazılıb.',
  'help.guide.rename-day.step.2': 'Adın yanındakı karandaşa klikləyin.',
  'help.guide.rename-day.step.3': 'Ad redaktə xanasına çevrilir. İstədiyiniz adı yazın.',
  'help.guide.rename-day.step.4':
    'Enter düyməsini basın və ya başqa yerə klikləyin. Escape dəyişikliyi ləğv edir. Günlər sütunundakı günün kartında da bu ad görünür.',
  'help.guide.rename-day.result':
    'Yeni ad paneldə və günlər sütunundakı gün kartında «Gün 5» yazısını əvəz edir, tarix isə dəyişmir.',
  'help.guide.rename-day.tip.1':
    'Sahəni təmizləyib yadda saxlasanız, gün yenidən «Gün 5» adlanacaq: ad olmadıqda nömrə göstərilir.',
  'help.guide.rename-day.tip.2':
    'Ad tarixə yox, günə aiddir. Günlərin sırasını dəyişsəniz, ad həmin gündəki hər şeylə birlikdə köçür.',
  // add-accommodation
  'help.guide.add-accommodation.title': 'Günə gecələmə rezerv edin',
  'help.guide.add-accommodation.goal':
    'Oteli plana bir dəfə əlavə edin: əhatə etdiyi günlər, vaxtlar və təsdiq nömrəsi ilə.',
  'help.guide.add-accommodation.step.1':
    'Yaşayış obyekti əvvəlcə səyahətdə məkan kimi olmalıdır. Onu məkanlar sütununda istənilən başqa məkan kimi yaradın: seçim siyahısında yalnız artıq mövcud olan məkanlar var.',
  'help.guide.add-accommodation.step.2':
    'Gəldiyiniz günü açın və «Yaşayış yeri» altında «Yaşayış yeri əlavə et» düyməsinə klikləyin.',
  'help.guide.add-accommodation.step.3':
    '«Günlərə tətbiq et» qalmanın hansı gecələri əhatə etdiyini təyin edir: «Başlanğıc» giriş günü, «Son» çıxış günüdür, «Hamısı» isə bütün səyahəti əhatə edir. Pəncərənin yuxarısında tarix aralığı və gecələrin sayı göstərilir.',
  'help.guide.add-accommodation.step.4':
    '«Giriş», «Qədər» və «Çıxış» sahələrini doldurun, rezervasiya nömrəsini isə «Təsdiq» sahəsinə yazın. Dördü də boş qala bilər.',
  'help.guide.add-accommodation.step.5':
    'Obyekti «Yaşayış yeri seç» altında seçin. Siyahının üstündəki «Kateqoriya» onu bir kateqoriya ilə məhdudlaşdırır.',
  'help.guide.add-accommodation.step.6': '«Yadda saxla» düyməsinə klikləyin.',
  'help.guide.add-accommodation.result':
    'Qalma əhatə etdiyi bütün günlərdə görünür: ilk gündə «Giriş», sonuncuda «Çıxış». Obyekt giriş günündə dayanacaq olur, ona görə xəritə ora gedən marşrutu göstərir, «Rezervasiyalar» vərəqində isə otel rezervasiyası görünür.',
  'help.guide.add-accommodation.tip.1':
    'Seçici gəldiyiniz gündə açılır, çıxış isə növbəti günə təyin olunur; yadda saxlamazdan əvvəl hər ikisini dəyişə bilərsiniz.',
  'help.guide.add-accommodation.tip.2':
    'Oteli yaradanda ona «Otel» kateqoriyasını verin. Onda siyahının üstündəki «Kateqoriya» bir kliklə yalnız otellərinizi göstərəcək.',
  'help.guide.add-accommodation.tip.3':
    'Vaxtların heç biri məcburi deyil: giriş vaxtı və kodu olmayan qalma da öz gecələrini əhatə edir və marşrutu yenə də çəkilir.',
  // edit-accommodation
  'help.guide.edit-accommodation.title': 'Rezerv edilmiş gecəni dəyişmək və ya ləğv etmək',
  'help.guide.edit-accommodation.goal': 'Qalmanı başqa tarixə keçirin, vaxtlarını düzəldin və ya plandan çıxarın.',
  'help.guide.edit-accommodation.step.1':
    'Kartda obyekt və onun ünvanı, baş verdiyi günlərdə vaxtları ilə «Giriş» və ya «Çıxış», təsdiq nömrəsi, «Rezervasiya» altında isə onunla gələn rezervasiya göstərilir.',
  'help.guide.edit-accommodation.step.2':
    'Sağdakı qələm, «Yaşayış yerini redaktə et», qalmanı redaktə üçün açır. Pəncərənin başlığı indi «Yaşayış yerini redaktə et» olur.',
  'help.guide.edit-accommodation.step.3':
    '«Giriş», «Qədər», «Çıxış» və «Təsdiq» sahələrini düzəldin. Onların üstündəki günləri və aşağıdakı obyekti də burada dəyişmək olar.',
  'help.guide.edit-accommodation.step.4': '«Yadda saxla» düyməsinə klikləyin.',
  'help.guide.edit-accommodation.step.5':
    'Qələmin yanındakı X, «Sil», qalmanı silir. Təsdiq soruşulmur və qalmaya aid otel rezervasiyası da silinir.',
  'help.guide.edit-accommodation.result':
    'Dəyişiklik qalmanın əhatə etdiyi bütün günlərə və «Rezervasiyalar» vərəqindəki otel rezervasiyasına dərhal tətbiq olunur.',
  'help.guide.edit-accommodation.tip.1':
    'Qalmanın ortasındakı gecədə «Giriş» və «Çıxış» yazısı olmur: onlar yalnız aralığın ilk və son günündə görünür.',
  'help.guide.edit-accommodation.tip.2':
    'Qalmanı ləğv etsəniz, onun giriş gününə əlavə etdiyi dayanacaq və rezervasiyaya bağlı hər hansı xərc də silinir. Səhvən etmisinizsə, gecəni yenidən rezerv edin.',
  // day-bookings
  'help.guide.day-bookings.title': 'Günün rezervasiyaları bir baxışda',
  'help.guide.day-bookings.goal':
    'Bu gün üçün nələrin artıq rezerv edildiyini və təsdiqlənib-təsdiqlənmədiyini bir yerdə görün.',
  'help.guide.day-bookings.step.1':
    '«Rezervasiyalar» günün rezervasiyalarını sadalayır: həmin günün tarixi ilə olanları və onun dayanacaqlarından birinə bağlananları. Başqa gündəki dayanacağa bağlanmış rezervasiya yalnız həmin dayanacaqda görünür.',
  'help.guide.day-bookings.step.2':
    'Sətirdə rezervasiyanın növü, adı, dayanacağa aiddirsə, ondan sonra boz rəngdə həmin dayanacaq göstərilir. Vaxtları sağ kənarda, status nöqtəsindən əvvəl yazılır.',
  'help.guide.day-bookings.step.3':
    'Rəng rezervasiyanın vəziyyətini göstərir: yaşıl təsdiqlənmiş, sarı hələ gözləyən, ictimai nəqliyyat səfəri isə vəziyyətsiz, mavidir. Otellər bu siyahıda deyil, onların aşağıda ayrıca bölməsi var.',
  'help.guide.day-bookings.step.4':
    'Sətrə klikləyin, rezervasiya açılır. Başlığındakı nişan onu «Gözləyir» və «Təsdiqlənib» arasında keçirir, aşağıdakı «Redaktə et» isə qalanını dəyişir. Yeni rezervasiyalar «Rezervasiyalar» vərəqində, nəqliyyat isə «Nəqliyyat» vərəqində yaradılır.',
  'help.guide.day-bookings.result':
    'O günə tarixlənmiş hər şey və onun dayanacaqlarından birinə bağlı hər şey bu siyahıdadır.',
  'help.guide.day-bookings.tip.1':
    'Rezervasiya öz tarixinin gününə düşür. Tarixi «Rezervasiyalar» və ya «Nəqliyyat» vərəqində dəyişsəniz, rezervasiya avtomatik olaraq digər günə köçür.',
  'help.guide.day-bookings.tip.2':
    '«Rezervasiyalar» bloku görünmürsə, həmin gün üçün rezervasiya yoxdur: boş blok göstərilmir, gizlədilir.',
  'help.guide.map-lock.title': 'Xəritəni kilidləmək',
  'help.guide.map-lock.goal': 'Günlər və məkanlar arasında keçərkən xəritəni yerində saxlayın.',
  'help.guide.map-lock.step.1':
    'Kilid xəritənin aşağı solundakı iki dairəvi düymədən yuxarıdakıdır; kursoru üzərinə gətirdikdə «Xəritə görünüşünü kilidlə» yazılır. Ona klikləyin. Kilid bağlı olduqca gün açmaq və ya məkan seçmək artıq xəritəni yaxınlaşdırmır və sürüşdürmür, düymədə isə «Xəritə seçimi izləsin» yazılır.',
  'help.guide.map-lock.result': 'Plan üzərində işlədiyiniz müddətdə xəritə buraxdığınız yerdə qalır.',
  'help.guide.map-lock.tip.1':
    'Kilidə yenidən, indi «Xəritə seçimi izləsin» yazılmış düyməyə klikləyin, xəritə yenə seçdiyinizi izləməyə başlayır. Kilid yalnız kompüterdədir; telefonda xəritə həmişə seçimi izləyir.',

  // ── Screen: trip-map ──────────────────────────────────────────────────────────────────
  'help.ctx.trip-map.title': 'Xəritə',
  'help.ctx.trip-map.summary':
    'Planın ortası: səyahətin hər məkanı sancaq, hər tur xətt kimi, aralarındakı marşrutlar, xəritənin kənarlarında isə görünüşü kilidləmək, peyk görünüşünə keçmək, bütün səyahəti birdən göstərmək və baxdığınız ərazidəki məkanları göstərmək üçün düymələr.',
  'help.ctx.trip-map.bullet.1':
    'Sancaq məkandır: varsa, öz fotosu, yoxdursa, kateqoriya rəngi və kateqoriya işarəsi. Şəkli, adı, ünvanı, varsa, reytinqi və kateqoriyası olan kartı görmək üçün kursoru sancağın üzərinə gətirin. Məkanı bir günə planlaşdırmaq üçün sancağı gün kartına sürükləyin. Rezervasiyası hələ gözləyən qalma solğun, qırıq xətli halqa ilə göstərilir.',
  'help.ctx.trip-map.bullet.2':
    'Bir-birinə çox yaxın olan sancaqlar sayı yazılmış bir tünd dairədə qruplaşdırılır. Dairəyə klikləyin, xəritə içindəki sancaqlara yaxınlaşır. «Tənzimləmələr» > «Ümumi» bölməsində, «Səyahət və xəritə» altında «Planlaşdırılmamış məkanlar üçün kiçik nişanlar» aktivdirsə, hələ heç bir günə əlavə olunmamış məkanlar fotosuz kiçik nöqtələr kimi göstərilir, beləliklə, planlaşdırılmış dayanacaqlar daha yaxşı seçilir.',
  'help.ctx.trip-map.bullet.3':
    'Məkanı xəritənin aşağısındakı kartda reytinqi, faylları və növbəti addımlarla açmaq üçün pinə klikləyin. Kartı bağlamaq üçün xəritənin boş yerinə klikləyin.',
  'help.ctx.trip-map.bullet.4':
    'Günlər sütununda gün açıq olduqda onun dayanacaqlarında həmin gündəki nömrəsi olan kiçik ağ nişan görünür. Gündə iki dəfə olan məkanda hər iki nömrəsi göstərilir. Məkanlar siyahısının üstündəki filtrlər («Göstər», kateqoriyalar və minimum reytinq üçün ulduz) xəritədəki sancaqları da süzür.',
  'help.ctx.trip-map.bullet.5':
    'Yuxarıdakı işarələr sırası xəritənin görünən hissəsində axtarır: «Restoranlar», «Kafelər», «Barlar və gecə həyatı», «Yaşayış yeri», «Görməli yerlər», «Muzeylər və mədəniyyət», «Təbiət və parklar» və «Fəaliyyətlər». Plaginin əlavə etdiyi kateqoriyalar nazik ayırıcı xətdən sonra gəlir. Sıra xəritədən geniş olduqda siçanın təkəri onu yana sürüşdürür. Xəritəni hərəkət etdirdikdən sonra «Bu ərazidə axtar» axtarışı təkrarlayır.',
  'help.ctx.trip-map.bullet.6':
    'Ünvanı artıq tapılmış halda həmin nöqtədə məkan formasını açmaq üçün xəritənin istənilən yerinə sağ klikləyin. Aşağı solda iki dairəvi düymə var: kilid, «Xəritə görünüşünü kilidlə», günlər və məkanlar arasında klikləyərkən xəritə görünüşünü yerində saxlayır, altındakı düymə, «Peyk görünüşünə keç», isə çəkilmiş xəritəni peyk görüntüləri ilə əvəz edir.',
  'help.ctx.trip-map.bullet.7':
    'Sağ aşağıdakı «Bütün səyahəti göstər» bütün səyahət günlərini birdən çəkir və hər günün nələri əhatə etdiyini sadalayır. Rezervasiya sətrindəki marşrut ikonu həmin rezervasiyanı, günlərin üstündəki alətlər panelindəki marşrut ikonu isə bütün rezervasiyaları çəkir. Çəkilmiş rezervasiyanın təfərrüatlarını açmaq üçün onun ucuna klikləyin.',
  'help.ctx.trip-map.bullet.8':
    'Dawarich əlavəsi aktiv olanda «Bütün səyahəti göstər» altındakı dairəvi Dawarich düyməsi telefonunuzun həqiqətən qeydə aldığı marşrutu göstərir. «Qeydə alınmış marşrutu göstər» onu planlaşdırılmış marşrutun altında qırıq xətlə, hər gün üçün ayrı rəngdə çəkir. Xətt olmayanda düymənin yazısı səbəbini bildirir.',
  // map-markers
  'help.guide.map-markers.title': 'Xəritəni oxumaq',
  'help.guide.map-markers.goal': 'Xəritədəki hər pinin, nişanın və qabarcığın nə demək olduğunu öyrənin.',
  'help.guide.map-markers.step.1':
    'Xəritədə səyahətin bütün məkanları göstərilir. Pinlər bir-birindən seçilməyəcək qədər yaxın olduqda, içində pinlərin sayı yazılan bir tünd dairədə birləşir. Dairəyə klikləyin: xəritə həmin pinlərə yaxınlaşır, ən böyük miqyasda isə pinləri bir-birindən ayırır.',
  'help.guide.map-markers.step.2':
    'Məkanın öz fotosu varsa, sancaqda o göstərilir, yoxdursa, kateqoriya rəngi və kateqoriya işarəsi. Rezervasiyası hələ gözləyən qalma solğun, qırıq xətli halqa ilə göstərilir. Kursoru sancağın üzərinə gətirdikdə yanında kart açılır: həmin foto daha böyük, ad və ünvan, məkanda varsa reytinq və kateqoriya.',
  'help.guide.map-markers.step.3':
    'Sancağa klikləyin, məkan xəritənin aşağı hissəsində kartda açılır: yuxarıda şəkil, ad və ünvan, sonra ulduzlar, təsvir və fayllar, o cümlədən rezervasiyasının faylları. Aşağıda əməliyyatlar var: gün açıq olduqda «Günə əlavə et» (məkan artıq həmin gündədirsə «Gündən çıxar»), «Naviqasiya», «Veb-saytı aç», «Kolleksiyada yadda saxla» (kolleksiyaya əlavə olunduqdan sonra «Yadda saxlandı»), sağda isə zibil qutusu və «Redaktə et». Kartı yuxarıdakı X ilə və ya xəritənin boş yerinə klikləməklə bağlayın.',
  'help.guide.map-markers.step.4':
    'Günlər sütununda günü açın, onun dayanacaqları nömrələnəcək: pinin küncündəki kiçik ağ nişan dayanacağın gün içindəki sırasını göstərir. Gündə iki dəfə olan məkanda hər iki nömrə görünür. Heç bir gün açıq deyilsə, nömrə olmur, küncdə isə, varsa, məkanın reytinqi göstərilir.',
  'help.guide.map-markers.step.5':
    'Pini xəritədən günlər sütunundakı gün kartına sürükləyin, məkan həmin günə planlaşdırılacaq, eynilə onun sətrini məkanlar siyahısından sürüklədiyiniz kimi.',
  'help.guide.map-markers.result':
    'Səyahətdə heç nə dəyişməyib: xəritə sadəcə səyahəti göstərir. Hər sancaq hansı məkan olduğunu, hansı gündə və neçənci sırada olduğunu göstərir.',
  'help.guide.map-markers.tip.1':
    'Günlər sütununda günü yığsanız, onun dayanacaqları xəritədə gizlənir. Onları göstərmək üçün günü yenidən açın.',
  'help.guide.map-markers.tip.2':
    'Məkanlar siyahısının üstündəki filtrlər xəritədə nəyin göstəriləcəyini də müəyyən edir: «Göstər» («Planlaşdırılmayıb», «Planlaşdırılıb»), etiket düyməsindəki kateqoriyalar və ulduzdakı minimum reytinq sancaqların sayını azaldır. Ölkə filtri yalnız siyahını daraldır.',
  'help.guide.map-markers.tip.3':
    'Bu xəritədə miqyas düymələri yoxdur: siçanın təkəri miqyası dəyişir, ikiqat klik bir pillə yaxınlaşdırır, xəritəni sürükləyəndə isə o yerini dəyişir.',
  // map-nearby-places
  'help.guide.map-nearby-places.title': 'Xəritədə ətrafdakı məkanları tapmaq',
  'help.guide.map-nearby-places.goal':
    'Xəritədə gördüyünüz şəhər hissəsində restoran, görməli yer və ya otel axtarın və birini səyahətə əlavə edin.',
  'help.guide.map-nearby-places.step.1':
    'Xəritənin yuxarısındakı işarələr sırası kateqoriya axtarışıdır: «Restoranlar», «Kafelər», «Barlar və gecə həyatı», «Yaşayış yeri», «Görməli yerlər», «Muzeylər və mədəniyyət», «Təbiət və parklar» və «Fəaliyyətlər». Plaginin əlavə etdiyi kateqoriyalar nazik ayırıcıdan sonra gəlir; adını görmək üçün kursoru işarənin üzərinə gətirin.',
  'help.guide.map-nearby-places.step.2':
    'Kateqoriyaya klikləyin. TREK xəritənin görünən hissəsində həmin növ məkanları axtarır və hər nəticə üçün kateqoriyanın rəngində pin qoyur. Eyni anda yalnız bir kateqoriya olur: başqasına klikləsəniz, onu əvəz edir, aktiv olana klikləsəniz, sönür.',
  'help.guide.map-nearby-places.step.3':
    'Xəritəni sürüşdürəndə sıranın altında ikinci düymə görünür: «Bu ərazidə axtar» eyni axtarışı yeni görünüş üçün aparır. Xəritəni sürüşdürmək özü-özlüyündə yeni axtarış başlatmır. Bu, sorğuların sayını az saxlayır.',
  'help.guide.map-nearby-places.step.4':
    'Axtarışın nə tapdığının adını görmək üçün kursoru sancağın üzərində saxlayın. Sancağa klikləyin, məkan forması təfərrüatları artıq doldurulmuş halda açılır: pəncərənin yuxarısında ad, «Ünvan», «Enlik» və «Uzunluq», axtarış tapıbsa, veb-sayt və telefon nömrəsi.',
  'help.guide.map-nearby-places.step.5':
    'Nəyin doldurulduğunu yoxlayın və axtarışın bilə bilmədiklərini əlavə edin. Səyahətdə uyğun kateqoriya varsa, məsələn, restoran üçün restoran, adın altındakı kateqoriya düyməsi artıq təyin edilib; əks halda siz seçənə qədər onda «Kateqoriya yoxdur» yazılır. Öz «Təsvir»inizi və qeydlərinizi əlavə edin.',
  'help.guide.map-nearby-places.step.6':
    '«Əlavə et» düyməsinə klikləyin. Səyahətdə eyni adlı və ya eyni nöqtədə məkan artıq varsa, TREK bunu bildirir və düymə «Yenə də əlavə et» olur.',
  'help.guide.map-nearby-places.result':
    'Məkan məkanlar siyahısında və xəritədə səyahətin öz pinlərindən biri kimi görünür; onu hansısa günə qoyana qədər «Planlaşdırılmayıb» altında qalır. Axtarış pinləri isə kateqoriyanı söndürənə qədər qalır.',
  'help.guide.map-nearby-places.tip.1':
    '«Tənzimləmələr» > «Ümumi» bölməsində, «Səyahət və xəritə» altında «Xəritədə məkanları kəşf et» söndürülübsə, sıra gizlənir.',
  'help.guide.map-nearby-places.tip.2':
    'Nəticələr TREK Places indeksindən və OpenStreetMap-dən gəlir, ona görə bu, planda internet tələb edən azsaylı funksiyalardan biridir.',
  'help.guide.map-nearby-places.tip.3':
    'Axtarış yalnız ekranda görünən ərazini əhatə edir, ona görə maraqlandığınız küçəyə yaxınlaşın. Bütün şəhər üzrə axtarış yalnız ilk altmış nəticəni, heç bir aydın sıra olmadan qaytarır.',
  // map-add-place
  'help.guide.map-add-place.title': 'Xəritəyə sağ klikləyib məkan yaradın',
  'help.guide.map-add-place.goal': 'Məkanı əvvəlcə axtarmadan düz istədiyiniz yerə qoyun.',
  'help.guide.map-add-place.step.1':
    'Xəritədə istədiyiniz nöqtəyə sağ klikləyin. «Məkan/Fəaliyyət əlavə et» başlıqlı məkan forması açılır.',
  'help.guide.map-add-place.step.2':
    '«Enlik» və «Uzunluq» artıq həmin nöqtəyə uyğun doldurulub. TREK koordinatları yoxlayır və orada tapdığı ünvanla «Ünvan» xanasını doldurur. Yoxlama ad da taparsa, TREK pəncərənin yuxarısındakı adı da doldurur. Hələ heç nə yadda saxlanmayıb, ona görə səhv olanı düzəldin.',
  'help.guide.map-add-place.step.3':
    'Dialoqun yuxarısındakı sahəyə tanıyacağınız bir ad yazın. Onun altındakı nişandan kateqoriya seçin; seçənə qədər orada «Kateqoriya yoxdur» yazılır. Sonra plan üçün digər məlumatları əlavə edin: «Təsvir», «Qeydlər», «Veb-sayt».',
  'help.guide.map-add-place.step.4':
    '«Əlavə et» düyməsini klikləyin. Gün açıq olsa belə, məkan siyahıya planlaşdırılmamış kimi əlavə olunur: xəritədə sağ klik günü deyil, yeri təyin edir.',
  'help.guide.map-add-place.result':
    'Məkan siyahıda və xəritədədir, onu günə əlavə edənədək «Planlaşdırılmayıb» altında qalır.',
  'help.guide.map-add-place.tip.1':
    'Ünvan koordinatlara görə tapılır, ona görə ad əvəzinə küçə görünə bilər, açıq ərazidə isə boş qala bilər. Hər iki sahəni dəyişə bilərsiniz.',
  'help.guide.map-add-place.tip.2':
    'MapLibre GL və Mapbox GL xəritələrində eyni işi orta klik, toxunma ekranında isə uzun basma görür.',
  // map-satellite
  'help.guide.map-satellite.title': 'Peyk görünüşünə keçmək',
  'help.guide.map-satellite.goal': 'Adi xəritədən peyk görüntülərinə keçin və geri qayıdın.',
  'help.guide.map-satellite.step.1':
    'Əsas qat açarı xəritənin aşağı solundakı iki dairəvi düymədən aşağıdakıdır, kilidin altında. Onun işarəsi həmişə keçəcəyi qatı göstərir, ipucunda da bu yazılır: «Peyk görünüşünə keç». Ona klikləyin.',
  'help.guide.map-satellite.step.2':
    'Xəritə indi peyk şəkillərini göstərir. Onlar ayrı-ayrı binaları görmək üçün kifayət qədər detallıdır və öz açarınız lazım deyil. TREK-in çəkdiyi hər şey üstdə qalır: pinlər, günün marşrutu, treklər və rezervasiya marşrutları.',
  'help.guide.map-satellite.step.3':
    'Düymədə indi «Xəritə görünüşünə keç» yazılır. Xəritə görünüşünə qayıtmaq üçün ona klikləyin.',
  'help.guide.map-satellite.result': 'Xəritə yenidən çəkilir, seçdiyiniz qat isə hesabınızda yadda saxlanılır.',
  'help.guide.map-satellite.tip.1':
    'Seçim səyahətdə yox, hesabınızda saxlanılır. Hansı xəritə renderindən istifadə etməyinizdən asılı olmayaraq, hər səyahət onu necə qoymusunuzsa, elə açılır.',
  'help.guide.map-satellite.tip.2':
    'Peyk şəkillərində yazılar yoxdur: küçə adları, rayonlar və ev nömrələri yalnız adi xəritədədir, ona görə ünvan axtaranda geri keçin.',
  // map-whole-trip
  'help.guide.map-whole-trip.title': 'Bütün səyahəti və məsafələri görmək',
  'help.guide.map-whole-trip.goal':
    'Yalnız açıq günü deyil, səyahətin bütün yol günlərini göstərin və hər gün nə qədər yol getdiyinizi görün.',
  'help.guide.map-whole-trip.step.1':
    'Dairəvi «Bütün səyahəti göstər» düyməsi xəritənin sağ aşağı küncündədir. Ona klikləyin: səyahətin bütün yol günləri birdən, hər biri öz rəngində çəkilir və qonşu günləri asanlıqla ayırd edə bilirsiniz.',
  'help.guide.map-whole-trip.step.2':
    'Düymənin üstündəki kart həmin günləri sadalayır: rəngli nöqtə, günün adı, həmin gün istifadə etdiyiniz hər hərəkət növü üçün ikon və qət edilən məsafə. «Ümumi məsafə» ən yuxarıdadır.',
  'help.guide.map-whole-trip.step.3':
    'Günü seçmək üçün kartda ona klikləyin: sətri kölgələnir, gün isə günlər sütununda açılır. Yaxınlaşdırmaq üçün şəhərin üzərində siçanın təkərini fırladın. Şəhərdən keçən günlər hər biri öz rəngində yan-yana göstərilir.',
  'help.guide.map-whole-trip.step.4':
    'Düymədə indi «Bütün səyahəti gizlət» yazılır. Yalnız açıq günü yenidən göstərmək üçün ona klikləyin.',
  'help.guide.map-whole-trip.result':
    'Hər səyahət günü öz rəngində çəkilir, kart isə hər günün nə qədər yol əhatə etdiyini və səyahətin ümumi məsafəsini göstərir.',
  'help.guide.map-whole-trip.tip.1':
    'Ümumi məsafə hər dəfə bir neçə mərhələ olmaqla hesablanır. Rəqəmin yanında … göründüyü müddətdə bu, yalnız qismən cəmdir. Bütün mərhələlər hesablananda rəqəm yekunlaşır.',
  'help.guide.map-whole-trip.tip.2':
    'Marşrutlaşdırıcı mərhələni hesablaya bilmədikdə mərhələ düz xətt olaraq qalır və hesaba alınmır. Kart bunu bildirir, beləliklə ümumi məsafə xəbərdarlıqsız az görünmür.',
  'help.guide.map-whole-trip.tip.3':
    'Yeri bəlli ikidən az dayanacağı olan və otelə gediş-gəlişi olmayan günün çəkiləcək marşrutu yoxdur, ona görə o, kartda heç görünmür.',
  // map-booking-routes
  'help.guide.map-booking-routes.title': 'Rezervasiyanın marşrutunu xəritədə göstərin',
  'help.guide.map-booking-routes.goal':
    'Rezerv etdiyiniz uçuşları, qatarları və avtomobil yollarını xəritədə göstərin, sonra yenidən götürün.',
  'help.guide.map-booking-routes.step.1':
    'Rezervasiya marşrutları siz aktiv edənə qədər söndürülüdür. Günlər sütununda nəqliyyat sətrinin sağ ucunda kiçik marşrut ikonu var: «Rezervasiya marşrutlarını göstər».',
  'help.guide.map-booking-routes.step.2':
    'Ona klikləyin və rezervasiya xəritədə görünür: uçuş böyük dairə qövsü kimi, avtomobil səfəri real yollar boyunca, qatar isə stansiyalar zənciri kimi. «Təsdiqlənib» bütöv, «Gözləyir» qırıq xətlə çəkilir, marşrutun ucları isə nəqliyyat ikonu olan mavi nişanlardır.',
  'help.guide.map-booking-routes.step.3':
    'Uc nişanına klikləyin, rezervasiyanın təfərrüatları açılır: rəngli başlıqda nişan kimi vəziyyət, növ və günlər, hər iki ucdakı vaxtlar, aşağıda digər təfərrüatlar, ən aşağıda isə bu marşrutu yenidən söndürən «Xəritədə», ictimai nəqliyyat əlaqəsində «Marşrutu dəyiş», rezervasiyanı silən zibil qutusu və «Redaktə et». Başlıqdakı X təfərrüatları bağlayır.',
  'help.guide.map-booking-routes.step.4':
    'Günlərin üstündəki alətlər panelindəki marşrut ikonu bütün səyahət üçün birdən işləyir: «Bütün rezervasiya marşrutlarını göstər» marşrutu olan hər rezervasiyanı xəritədə çəkir.',
  'help.guide.map-booking-routes.step.5':
    'Bu, əvvəlki seçimlərinizi əvəz edir, ona görə rezervasiyalar üzrə ayrı-ayrılıqda yandırdığınız marşrutlar sıfırlanır. Bütün rezervasiya marşrutlarını gizlətmək üçün düyməni yenidən basın, indi onun adı «Bütün rezervasiya marşrutlarını gizlət» olur.',
  'help.guide.map-booking-routes.result':
    'İstədiyiniz rezervasiyalar xəritədə çəkilir. Seçim siz dəyişənə qədər bu brauzerdə bu səyahət üçün yadda qalır.',
  'help.guide.map-booking-routes.tip.1':
    'Uclarda aeroport kodu və ya stansiyanın adı yalnız «Tənzimləmələr» > «Ümumi» bölməsində, «Səyahət və xəritə» altında «Rezervasiya marşrutu etiketləri» aktiv olduqda göstərilir; əks halda yalnız işarə görünür.',
  'help.guide.map-booking-routes.tip.2':
    'Həmin bölmədəki «Rezervasiya marşrutlarını həmişə göstər» onları bu seçimi hələ özünüz etmədiyiniz bütün səyahətlərdə əvvəldən göstərir.',
  'help.guide.map-booking-routes.tip.3':
    'Rezervasiyanın xəritədə çəkilməsi üçün koordinatları olan başlanğıc və son nöqtəsi olmalıdır, ona görə otel və ya restoranda marşrut ikonu olmur.',
  // map-dawarich-trail
  'help.guide.map-dawarich-trail.title': 'Əslində keçdiyiniz marşrutu göstərmək',
  'help.guide.map-dawarich-trail.goal':
    'Dawarich-in telefonunuzda qeydə aldığı yolu xəritədə planlaşdırdığınız marşrutun yanında qırıq xətlə göstərin və səyahətin gün-gün əslində necə keçdiyini görün.',
  'help.guide.map-dawarich-trail.step.1':
    'Dairəvi Dawarich düyməsi xəritənin sağ aşağı hissəsində, «Bütün səyahəti göstər» düyməsinin altındadır. Kursoru üzərinə aparanda «Qeydə alınmış marşrutu göstər» yazısı görünür. Ona klikləyin. TREK səyahətin tarixləri üçün məlumatı Dawarich-dən sorğulayır və cavabı gözləyərkən düymənin ətrafında halqa fırlanır.',
  'help.guide.map-dawarich-trail.step.2':
    'Qeydə alınmış marşrut hər gün üçün ayrı rəngdə qırıq xətt kimi görünür və plan oxunaqlı qalsın deyə planlaşdırılmış marşrutun altında çəkilir. Düymədə indi «Qeydə alınmış marşrutu gizlət» yazılır. Hər gün yerli vaxtla gecə yarısı bitir. Günlər sütununda günü yığsanız, onun qırıq xətti və dayanacaqları xəritədə gizlənir.',
  'help.guide.map-dawarich-trail.step.3':
    '«Bütün səyahəti göstər» düyməsinə də klikləyin, hər planlaşdırılmış gün qırıq xətli qeydin yanında bütöv xətlə çəkiləcək. İki xəttin üst-üstə düşdüyü yerdə gün plana uyğun keçib. Qırıq xəttin planlaşdırılmış marşrutdan ayrıldığı yerdə isə yox.',
  'help.guide.map-dawarich-trail.result':
    'Planlaşdırdığınız və əslində getdiyiniz yol xəritədə birlikdə göstərilir: qırıq və bütöv xətlərlə. Düymələrin üstündəki kart yenə də planlaşdırılmış günləri və məsafələrini göstərir.',
  'help.guide.map-dawarich-trail.tip.1':
    'Yandırılıb-söndürülməsi hər səyahət üçün hesabınızda saxlanılır, ona görə bütün brauzerlərdə və cihazlarda eynidir. Marşrut yanılı olduqca TREK iki dəqiqədən bir Dawarich-dən yenidən məlumat alır, beləcə davam edən səyahət səhifəni yeniləmədən yenilənir. Marşrutun özü heç vaxt saxlanılmır: o, nə TREK-in verilənlər bazasında, nə ehtiyat nüsxələrdə var, nə də oflayn əlçatandır.',
  'help.guide.map-dawarich-trail.tip.2':
    'Düymənin yazısı xəritənin niyə boş olduğunu bildirir: yüklənərkən «Qeydə alınmış marşrut yüklənir…», «Bu tarixlərdə heç nə qeydə alınmayıb», «Qeydə alınmış marşrutu yükləmək mümkün olmadı» və ya TREK oflayn olanda «Qeydə alınmış marşrut internet bağlantısı tələb edir».',
  // map-compass
  'help.guide.map-compass.title': 'Xəritəni fırladın və şimalı yenidən tapın',
  'help.guide.map-compass.goal': 'Xəritəni getdiyiniz istiqamətə çevirin və bir kliklə yenidən şimala qaytarın.',
  'help.guide.map-compass.step.1':
    'Xəritəni sağ düymə ilə sürükləyərək və ya Ctrl düyməsini basıb saxlayaraq sol düymə ilə sürükləyərək fırladın, toxunma ekranında isə iki barmağınızı çevirin. Xəritənin yuxarısında, kateqoriya ikonları sırasının yanındakı dairəvi kompas da onunla birlikdə fırlanır: onun oxu həmişə şimalı göstərir, ona görə xəritə ilə eyni bucaq qədər əyilir.',
  'help.guide.map-compass.step.2':
    'Kompasa klikləyin. «Şimalı sıfırla» adlı bu düymə xəritəni şimal yuxarıda olacaq şəkildə çevirir, görünüşü yenidən düz edir və ox yenidən yuxarını göstərir.',
  'help.guide.map-compass.result':
    'Xəritə yenidən şimala baxır və düz durur. Səyahətdə heç nə dəyişmir: kompas yalnız görünüşü dəyişir.',
  'help.guide.map-compass.tip.1':
    'Kompas yalnız MapLibre GL və Mapbox GL xəritələrində var; Leaflet xəritəsini fırlatmaq olmur, ona görə orada kompas yoxdur. Hansı xəritədən istifadə edəcəyinizi Tənzimləmələrdə «Xəritə» altındakı «Xəritə provayderi» təyin edir, «Xəritəni yadda saxla» isə seçimi saxlayır.',
  'help.guide.map-compass.tip.2':
    'Klik əyilməni də aradan qaldırır. Görünüşü əymək üçün siçanın sağ düyməsi ilə yuxarı və ya aşağı sürükləyin, «Şimalı sıfırla» isə görünüşü düzəldir və fırlanmanı sıfırlayır. Mapbox GL-də «3D binalar və relyef» yandırılıbsa, bu, 3D görünüşü də siz yenidən əyənə qədər düzləşdirir.',
  // ── Screen: trip-transports ───────────────────────────────────────────────────────────
  'help.ctx.trip-transports.title': 'Nəqliyyat',
  'help.ctx.trip-transports.summary':
    'Dayanacaqlar arasında hərəkət etdiyiniz bütün yollar: uçuşlar, qatarlar, avtobuslar, avtomobillər, taksilər, velosipedlər, kruizlər, bərələr, kanat yolları və TREK-in sizin üçün tapdığı ictimai nəqliyyat əlaqələri. Vərəq onları sadalayır. Onları planda da yarada və baxa bilərsiniz, xəritədə də çəkilirlər.',
  'help.ctx.trip-transports.bullet.1':
    'Vərəqdə yalnız gedişlər göstərilir. Yaşayış yeri, restoranlar, tədbirlər və biletlər «Rezervasiyalar» vərəqindədir, ona görə eyni qeyd heç vaxt iki dəfə görünmür.',
  'help.ctx.trip-transports.bullet.2':
    'Yuxarıdakı paneldə «Axtar», vəziyyət, növlər və səyahətçilər üçün «Filtrlə», üç görünüş («Kartlar», «Siyahı» və «Zaman xətti»), «Görünüş seçimləri» və göstəriləni endirən «Cədvəl kimi ixrac et (CSV)» var. Sağdakı «Nəqliyyat» gedişi əl ilə əlavə edir. Ondan əvvəlki «Rezervasiya təsdiqlərini idxal et» və «AirTrail-dən idxal et» işarələri server təsdiqləri oxuya bildikdə və ya AirTrail qoşulduqda görünür. Boş vərəqdə eyni əməliyyatlar ortada «Nəqliyyat», «Fayldan idxal et» və AirTrail kimi görünür.',
  'help.ctx.trip-transports.bullet.3':
    '«Kartlar» tabın açıldığı görünüşdür: əvvəlcə «Təsdiqlənib», sonra «Gözləyir». Hər bölməni başlığına klikləyərək yığa bilərsiniz. Planlaşdırılmış ictimai nəqliyyat əlaqələrinin vəziyyəti yoxdur; «Görünüş seçimləri» onlara ayrıca «Avtomatik ictimai nəqliyyat» bölməsi verməyibsə, onlar təsdiqlənmiş gedişlər arasında vaxt sırası ilə göstərilir. «Siyahı» günlərə görə qruplaşdırır, «Zaman xətti» isə səyahətin günləri boyunca bütün gedişləri göstərir.',
  'help.ctx.trip-transports.bullet.4':
    'Kartın yuxarı zolağı statusuna görə rənglənir: təsdiqlənmiş üçün yaşıl, gözləyən üçün kəhrəba, planlaşdırılmış əlaqə üçün mavi. Orada status nöqtəsi, növ, başlıq, qələm və zibil qutusu var. Altında: «Tarix», «Vaxt», «Rezervasiya kodu», «Marşrut», həmçinin aviaşirkət və reys nömrəsi və ya qatar nömrəsi, platforma və oturacaq. Təfərrüatları açmaq üçün karta klikləyin.',
  'help.ctx.trip-transports.bullet.5':
    'Nəqliyyatı planda da yarada bilərsiniz: günün başlığındakı + (ipucu «Günə əlavə et») və ya başlığa sağ klik «Nəqliyyat əlavə et» və «İctimai nəqliyyat» təklif edir. İki dayanacaq arasındakı yol vaxtı birləşdiricisi həmin hissə üçün eyni axtarışı açır.',
  'help.ctx.trip-transports.bullet.6':
    'Hər iki ucu təyin edilmiş nəqliyyat xəritədə xətt çəkir. Gün planında onun sətrindəki marşrut ikonu və təfərrüatlarındakı «Xəritədə» həmin xətti yandırır. Günlərin üstündəki alətlər panelində «Bütün rezervasiya marşrutlarını göstər» bütün səyahətin xətlərini yandırır və ya söndürür.',
  // transports-list
  'help.guide.transports-list.title': '«Nəqliyyat» bölməsini oxuyun',
  'help.guide.transports-list.goal': 'Siyahıda nəyisə dəyişməzdən əvvəl onun nə göstərdiyini başa düşün.',
  'help.guide.transports-list.step.1':
    '«Nəqliyyat» səyahətin «Plan»dan (və həmin əlavə aktivdirsə, «Turlar»dan) sonrakı vərəqidir. Orada yalnız gedişlər var: otellər, restoranlar, tədbirlər və biletlər «Rezervasiyalar» vərəqindədir.',
  'help.guide.transports-list.step.2':
    'Panelin solundakı «Axtar» yazdıqca gedişləri süzür. Yanındakı qıf, «Filtrlə», seçimləri açır: «Hamısı», «Təsdiqlənib» və «Gözləyir» ilə «Vəziyyət», sonra istifadə olunan bütün növlər sayları ilə. Yalnız onları görmək üçün bir və ya bir neçə növü işarələyin. Qıfdakı rəqəm neçə filtrin aktiv olduğunu, panel isə neçə gedişin göstərildiyini bildirir, məsələn, 4-dən 1. Menyunun aşağısındakı «Filtrləri sıfırla» yenidən bütün gedişləri göstərir.',
  'help.guide.transports-list.step.3':
    'Yanındakı «Kartlar», «Siyahı» və «Zaman xətti» nəqliyyatı kartlar, günlərə görə qruplaşdırılmış sətirlər və ya səyahət günləri boyunca zolaqlar kimi göstərir. Sürgü ikonlu «Görünüş seçimləri» «Kartlar» və «Siyahı» üçün «Qruplaşdır» və «Sıralama»nı, «Zaman xətti» üçün isə cərgələri təyin edir. «Görünüşü sıfırla» standart ayarlara qaytarır. «Kartlar»da «İctimai nəqliyyat ayrıca bölmədə» planlaşdırılmış əlaqələri «Avtomatik ictimai nəqliyyat» altında göstərir.',
  'help.guide.transports-list.step.4':
    'Hər kartda bütün təfərrüatlar var. Yuxarıdakı zolaq «Təsdiqlənib» olanda yaşıl, «Gözləyir» olanda kəhrəba rəngindədir, orada vəziyyət nöqtəsi, növ və başlıq görünür. Onun altında «Tarix» əhatə olunan günləri tarixləri ilə göstərir. Sonra «Vaxt», «Rezervasiya kodu», dayanacaqlar arasında növün ikonu olan «Marşrut», həmçinin aviaşirkət və reys nömrəsi və ya qatar nömrəsi, platforma və yer gəlir. Təfərrüatları açmaq üçün karta klikləyin.',
  'help.guide.transports-list.step.5':
    'Gedişi «Gözləyir» və «Təsdiqlənib» arasında keçirmək üçün vəziyyət nöqtəsinə klikləyin; ipucu hansı vəziyyətə keçəcəyini göstərir, məsələn, «Gözləyir» vəziyyətinə keçir. Başlıqdakı qələm nəqliyyatın formasını açır, zibil qutusu isə «Rezervasiya silinsin?» sualından sonra onu silir; sualda əlaqəli xərclər də daxil olmaqla nələrin silinəcəyi sadalanır.',
  'help.guide.transports-list.result':
    'Hər kart gedişin rezerv edilib-edilmədiyini göstərir, paneldən istifadə edərək siyahını istənilən vaxt süzə və ya sıralaya bilərsiniz.',
  'help.guide.transports-list.tip.1':
    'Tab ayarlarınızı yadda saxlayır: görünüşü, qruplaşdırmanı və sıralamanı bu brauzerdə, yığılmış bölmələri hər səyahət üçün ayrıca, filtrləri isə brauzer tabını bağlayana qədər.',
  'help.guide.transports-list.tip.2':
    '«Nəqliyyat» düyməsindən əvvəlki iki ikon, «Rezervasiya təsdiqlərini idxal et» və «AirTrail-dən idxal et», yalnız server təsdiqləri oxuya bildikdə və AirTrail instansiyası qoşulduqda görünür. Onlar olmadan siyahını əl ilə və ya ictimai nəqliyyat axtarışı ilə doldurursunuz.',
  // add-transport
  'help.guide.add-transport.title': 'Günə nəqliyyat əlavə edin',
  'help.guide.add-transport.goal': 'Sizi bir dayanacaqdan növbətisinə aparan nəqliyyatı onun olduğu günə əlavə edin.',
  'help.guide.add-transport.step.1':
    'Gedişin olduğu günün başlığında + düyməsinə («Günə əlavə et» ipucu ilə) klikləyin və «Nəqliyyat əlavə et» seçin. Günün başlığına sağ klik eyni menyunu açır. Forma həmin gün artıq doldurulmuş halda açılır.',
  'help.guide.add-transport.step.2':
    'Başlıqdakı növ düyməsi nəqliyyat növünü göstərir, standart olaraq «Uçuş». «Uçuş», «Qatar», «Avtobus», «Avtomobil», «Taksi», «Velosiped», «Kruiz», «Bərə», «Kanat yolu» və ya «Digər» seçmək üçün ona klikləyin, forma da uyğun şəkildə dəyişir: uçuşda hər dayanacaqda aeroport, qatarda stansiyalar zənciri, kruizdə «Gəmiyə minmə», «Dayanacaq limanı» və «Gəmidən düşmə», avtomobildə isə «Götürmə», «Qaytarma» və «Yolboyu dayanacaqlar» olur.',
  'help.guide.add-transport.step.3':
    'Başlığı birbaşa yuxarı zolağa, boz nümunə mətnin olduğu yerə yazın. Bu, yeganə məcburi sahədir: onu doldurana qədər altındakı sətirdə «Başlıq *» yazılır və «Əlavə et» boz qalır. Gediş lövhəsində tanıyacağınız bir başlıq yazın.',
  'help.guide.add-transport.step.4':
    '«Marşrut» altında «Haradan» və «Haraya» xanalarına stansiya, liman və ya ünvan yazılır. Yazmağa başlamazdan əvvəl səyahətin öz məkanları təklif olunur. Axtarmaq üçün ən azı üç hərf yazın və nəticələrdən birini seçin. Sadəcə yazılıb nəticələrdən seçilməyən ad yadda saxlanmır və xəritədə heç nə göstərilmir.',
  'help.guide.add-transport.step.5':
    '«Tarix» və «Başlanğıc vaxtı» nə vaxt başladığını, «Bitmə tarixi» və «Bitmə vaxtı» isə nə vaxt bitdiyini göstərir; ertəsi gün çatan gediş üçün orada növbəti günü seçin. Aşağıdakı «Rezervasiya kodu» və «Qeydlər» məcburi deyil. Vəziyyəti «Təsdiqlənib» etmək üçün başlıqdakı «Gözləyir» nişanına klikləyin.',
  'help.guide.add-transport.step.6': '«Əlavə et» düyməsini klikləyin.',
  'help.guide.add-transport.result':
    'Nəqliyyat gün planında dayanacaqlar arasında öz vaxtında bir sətir kimi, «Nəqliyyat» bölməsində isə «Gözləyir» və ya «Təsdiqlənib» altında kart kimi görünür.',
  'help.guide.add-transport.tip.1':
    'Sətir başlama vaxtına görə, ondan tez başlayan sonuncu dayanacaqdan sonra yerləşir. Onu tutacağından tutub günün başqa yerinə və ya başqa günə sürükləyə bilərsiniz.',
  'help.guide.add-transport.tip.2':
    'Bileti əlavə etmək üçün «Fayl» altındakı «Fayl əlavə et» düyməsindən istifadə edin. «Xərclər» altındakı «Xərc yarat» rezervasiyanı yadda saxlayır və gediş haqqı üçün xərc redaktorunu açır.',
  'help.guide.add-transport.tip.3':
    'Formanın ilk bloku olan «Səyahətçilər» bu nəqliyyatla kimin getdiyini təyin edir. Səyahətin birdən çox üzvü olanda və nəqliyyatda kimsə göstəriləndə bölmədəki «Filtrlə» menyusunda «Səyahətçilər» də çıxır və yalnız bir nəfərin nəqliyyatını göstərir.',
  // import-transport-file
  'help.guide.import-transport-file.title': 'Reysi elektron biletdən idxal edin',
  'help.guide.import-transport-file.goal':
    'Qoy TREK daşıyıcının göndərdiyi biletdən uçuşu, qatarı və ya bərəni oxusun, siz də yadda saxlamazdan əvvəl onu yoxlayın.',
  'help.guide.import-transport-file.step.1':
    '«Nəqliyyat» vərəqinin panelində «Nəqliyyat» qarşısındakı endirmə işarəsinə klikləyin, ipucunda «Rezervasiya təsdiqlərini idxal et» yazılır. Həmin adlı pəncərə açılır, «Rezervasiyalar» vərəqindəki ilə eyni. Boş vərəqdə ortadakı «Fayldan idxal et» eyni işi görür.',
  'help.guide.import-transport-file.step.2':
    'Bileti qutuya atın və ya qutuya klikləyib faylı seçin: EML, PDF, PKPass, HTML və TXT, hər biri 10 MB-a qədər olan beş fayla qədər, serverinizdə onları oxuya bilən AI modeli varsa, biletin fotoları da (JPG, PNG, WEBP). Seçdiyiniz faylların adları qutuda görünür.',
  'help.guide.import-transport-file.step.3':
    '«İdxal et» düyməsini klikləyin. Pəncərə dərhal bağlanır, fayl isə arxa planda oxunur.',
  'help.guide.import-transport-file.step.4':
    'Aşağı sağdakı kart faylın adı altında gedişatı göstərir. Oxuma bitdikdə «Fayllar təhlil edilir…» yazısı işarəyə çevrilir və kartda «İdxal et» görünür. Ona klikləyin.',
  'help.guide.import-transport-file.step.5':
    'Uçuş artıq doldurulmuş halda «Nəqliyyat əlavə et» formasında açılır: növ nişanında «Uçuş», başlıqda ad kimi aviaşirkət və uçuş nömrəsi, «Marşrut» altında «Yola düşmə» və «Çatma» ilə hər iki hava limanı, onların vaxtları və saat qurşaqları, «Aviaşirkət» və «Uçuş nömrəsi», «Rezervasiya kodu», «Fayl» altında isə bilet. Yoxlayıb «Əlavə et» düyməsinə klikləyin.',
  'help.guide.import-transport-file.result':
    'Uçuş «Nəqliyyat» tabında «Gözləyir» altında kart, uçduğu gündə isə sətir kimi görünür, bilet də «Fayl» altında olur. Hər iki hava limanı məlumdursa, uçuş xəritədə əyri xətlə göstərilir.',
  'help.guide.import-transport-file.tip.1':
    'Hər iki bölmə eyni idxaldan istifadə edir. Uçuş və otel olan fayl, hansı bölmədən başlamağınızdan asılı olmayaraq, uçuşu «Nəqliyyat əlavə et», sonra oteli «Yeni rezervasiya» formasında açır.',
  'help.guide.import-transport-file.tip.2':
    'Hava limanları koduna görə yerləşdirilir. Stansiya və ya limanın yeri tapılmasa, onun adı sağ aşağıdakı idxal kartında kəhrəba rəngində göstərilir. «Əlavə et» düyməsinə klikləməzdən əvvəl onu «Marşrut» altında əllə seçin, əks halda nəqliyyat xəritədə görünməyəcək.',
  // plan-transit
  'help.guide.plan-transit.title': 'İctimai nəqliyyat əlaqəsini planlaşdırmaq',
  'help.guide.plan-transit.goal':
    'Qoy TREK günün iki nöqtəsi arasında real qatar və avtobusları tapsın, seçdiyinizi isə plana əlavə etsin.',
  'help.guide.plan-transit.step.1':
    'Günün başlığındakı + düyməsinə klikləyin və «İctimai nəqliyyat» seçin. Axtarış həmin gün üçün açılır: gün başlıqda nişan kimi göstərilir, yanındakı «Əl ilə» və «Avtomatik» isə bu axtarışla adi forma arasında keçid edir.',
  'help.guide.plan-transit.step.2':
    '«Kimdən» və «Hara» sahələrinə dayanacaq və ya stansiya yazılır. Sahə boş olduqca TREK günün yaşayış yerini, günün rezervasiyalarındakı stansiya və aeroportları və günün öz dayanacaqlarını təklif edir. İki hərf yazdıqda isə əvəzinə cədvəldəki stansiyalarda axtarır. İki sahə arasındakı «Yerlərini dəyiş» «Kimdən» və «Hara» sahələrinin yerini dəyişir.',
  'help.guide.plan-transit.step.3':
    'Vaxtla birlikdə «Yola düşmə» və ya «Çatma» nə vaxt getmək istədiyinizi, «Ən yaxşı marşrut», «Daha az dəyişmə» və ya «Daha az piyada yol» isə nəticələrin necə sıralanacağını müəyyən edir.',
  'help.guide.plan-transit.step.4':
    'Aşağıdakı düymələr hansı nəqliyyat növlərindən istifadə oluna biləcəyini göstərir: Qatar, Metro, Tramvay, Avtobus, Bərə və Kanat yolu. Birini istisna etmək üçün söndürün; ən azı biri yanılı qalır. Sonra «Axtar» düyməsinə klikləyin.',
  'help.guide.plan-transit.step.5':
    'Hər nəticədə yola düşmə və çatma vaxtı, yolun nə qədər çəkdiyi, neçə dəyişmə və nə qədər piyada yol olduğu göstərilir, xətlər isə nişan kimi, cədvəldə rəngləri varsa, öz rənglərində. Hər mərhələni görmək üçün nəticəyə klikləyib onu açın: mindiyiniz və dəyişdiyiniz dayanacaqlar, platformalar və xətlər arasındakı piyada yollar.',
  'help.guide.plan-transit.step.6': '«Günə əlavə et» düyməsinə klikləyin.',
  'help.guide.plan-transit.result':
    'Əlaqə gündə xətt nişanları olan bir sətir kimi görünür. Hər hissəni görmək üçün onun oxuna klikləyin. O, həmçinin «Nəqliyyat» tabında təsdiqlənmiş gedişlər arasında mavi rəngli kart kimi göstərilir.',
  'help.guide.plan-transit.tip.1':
    'Variantlar Transitous-dan gəlir: bu, açıq nəqliyyat cədvəllərindən istifadə edən pulsuz icma xidmətidir, açar və hesab tələb etmir. Administrator axtarışı Google ilə işləyəcək şəkildə dəyişə bilər.',
  'help.guide.plan-transit.tip.2':
    'Heç nə tapılmadı? Məlumat axınları müəyyən region və dövrü əhatə edir. Başqa vaxt yoxlayın, daha çox nəqliyyat növünü yandırın və ya yerin özü əvəzinə stansiya seçin. Mesajda cavab verən xidmətin adı göstərilir. Tarixsiz səyahətdə axtarış üçün gün olmadığından yalnız adi forma təklif olunur.',
  'help.guide.plan-transit.tip.3':
    'Eyni axtarış tək mərhələ üçün də açılır: iki dayanacaq arasındakı yol vaxtı birləşdiricisinə klikləyin və «İctimai nəqliyyat» seçin. «Kimdən», «Kimə» və yola düşmə vaxtı avtomatik doldurulur.',
  // change-transit-route
  'help.guide.change-transit-route.title': 'Planlaşdırılmış reysi açın və dəyişin',
  'help.guide.change-transit-route.goal':
    'Bağlantını sətir-sətir oxuyun, adını dəyişin və ya marşrutu yenidən axtarın.',
  'help.guide.change-transit-route.step.1':
    '«Nəqliyyat» bölməsində planlaşdırılmış əlaqə mavi yuxarı zolaqlı kartdır və təsdiqlənmiş nəqliyyatla birlikdə vaxt sırası ilə düzülür. «Görünüş seçimləri»ndə «İctimai nəqliyyat ayrıca bölmədə» yandırılıbsa, o, əvəzində «Avtomatik ictimai nəqliyyat» altında göstərilir. Karta klikləyin. Əlaqə rezervasiya kimi açılır.',
  'help.guide.change-transit-route.step.2':
    'Yuxarıdakı xanalarda dayanacaqları ilə birlikdə yola düşmə və çatma, «Müddət», «Dəyişmələr» və «Piyada» göstərilir. Onların altında «Marşrut planı» əlaqəni vaxtlar, platformalar və xətlər arasındakı piyada keçidlərlə birlikdə sətir-sətir göstərir.',
  'help.guide.change-transit-route.step.3':
    'Rezervasiyanın aşağısındakı «Marşrutu dəyiş» axtarışı yenidən açır; bu əlaqənin iki ucu və günü artıq doldurulmuş olur.',
  'help.guide.change-transit-route.step.4':
    '«Axtar» düyməsini klikləyin, başqa variantı açın və «Günə əlavə et» düyməsini klikləyin, o, köhnəsini əvəz edir. Rezervasiyanın aşağısında, ən sağdakı «Redaktə et» isə adi nəqliyyat formasını açır. Orada «Rezervasiya kodu»nu, səyahətçiləri, qeydləri və faylları redaktə edə bilərsiniz.',
  'help.guide.change-transit-route.result':
    'Səfər artıq yeni marşrutla gedir, «Nəqliyyat» bölməsindəki kartı isə yeni xətləri və vaxtları göstərir.',
  'help.guide.change-transit-route.tip.1':
    'Marşrutu dəyişmədən reysin adını dəyişmək üçün rezervasiyanın başlığındakı ada klikləyin. Qeydləri isə «Redaktə et» ilə açılan nəqliyyat formasında yazırsınız.',
  'help.guide.change-transit-route.tip.2':
    'Rezervasiyanın aşağısındakı zibil qutusu təsdiqdən sonra bağlantını silir; günün dayanacaqları yerində qalır.',
  // leg-travel-mode
  'help.guide.leg-travel-mode.title': 'Bir hissənin necə keçiləcəyini dəyişmək',
  'help.guide.leg-travel-mode.goal':
    'Avtomobil gününün bir hissəsini piyada edin və ya həmin hissəni ictimai nəqliyyat axtarışı ilə planlaşdırın.',
  'help.guide.leg-travel-mode.step.1':
    'Dayanacaqlar arasındakı birləşdiricilər yalnız günün marşrutu aktiv olanda görünür. Günü açmaq üçün onun başlığına, sonra dayanacaqların altındakı paneldə «Marşrut» düyməsinə klikləyin.',
  'help.guide.leg-travel-mode.step.2':
    'Hər birləşdirici həmin hissənin yol vaxtını və məsafəsini, marşrutun hansı rejimdə qurulduğunu göstərən işarə ilə birlikdə göstərir: avtomobil üçün maşın, piyada üçün ayaq, velosiped üçün velosiped.',
  'help.guide.leg-travel-mode.step.3':
    'Birləşdiriciyə klikləyin. Menyu «Avtomobil», «Piyada» və «Velosiped», yalnız bu hissə üçün «İctimai nəqliyyat» və «Günün standart seçimindən istifadə et» təklif edir.',
  'help.guide.leg-travel-mode.step.4':
    '«Piyada» seçin. Yalnız bu mərhələ dəyişir, günün qalan hissəsi öz hərəkət növünü saxlayır.',
  'help.guide.leg-travel-mode.result':
    'Mərhələdə piyada ikonu və piyada gediş vaxtı görünür, günün digər mərhələləri isə günün hərəkət üsulunu saxlayır.',
  'help.guide.leg-travel-mode.tip.1':
    'Rejim günə deyil, hissəyə aiddir: bütün günün «Avtomobil», «Piyada» və «Velosiped» düymələri əl ilə təyin etdiyiniz hissəni heç vaxt dəyişmir. «Günün standart seçimindən istifadə et» hissəni yenidən həmin düymələrə tabe edir.',
  'help.guide.leg-travel-mode.tip.2':
    'Eyni menyudakı «İctimai nəqliyyat» məhz bu hissə üçün reys axtarışını açır: hər iki nöqtə və yola düşmə vaxtı artıq doldurulmuş olur.',
  'help.guide.leg-travel-mode.tip.3':
    'Vaxtlar real yollar və piyada yolları üzrə hesablayan açıq marşrut xidmətindən gəlir. Xidmət hansısa hissəni hesablaya bilməsə, həmin hissə düz xətt olaraq qalır və vaxt göstərilmir.',
  // edit-transport
  'help.guide.edit-transport.title': 'Nəqliyyatı dəyişmək və ya silmək',
  'help.guide.edit-transport.goal':
    'Vaxtı, platformanı və ya rezervasiya kodunu düzəldin, yaxud nəqliyyatı səyahətdən silin.',
  'help.guide.edit-transport.step.1':
    'Gün planında nəqliyyat dayanacaqlar arasında, növünə görə rənglənmiş sətirdir. Rezervasiyanı açmaq üçün ona klikləyin: yuxarıda vəziyyət, növ, günlər və «Rezervasiya kodu» (kopyalama düyməsi ilə) nişan kimi, aşağıda isə yola düşmə və çatma vaxtları aeroport və ya stansiyaları ilə göstərilir.',
  'help.guide.edit-transport.step.2':
    'Rezervasiyanın aşağısındakı «Redaktə et» onu yaradan formanı açır; formanın başlığında adın üstündə «Nəqliyyatı redaktə et» yazılır. Orada hər şeyi dəyişə bilərsiniz: adı, vəziyyət və növ nişanlarını, marşrutu, günləri və vaxtları, «Rezervasiya kodu» sahəsini.',
  'help.guide.edit-transport.step.3':
    'Uçuşun marşrutu aeroportlar, qatarınki stansiyalar, kruizinki isə limanlar zənciridir. «Ara dayanacaq əlavə et» (kruizdə «Liman əlavə et») araya yenisini əlavə edir, hər hissə isə öz vaxtlarını və öz uçuş və ya qatar nömrəsini saxlayır.',
  'help.guide.edit-transport.step.4':
    '«Yenilə» düyməsini klikləyin. Nəqliyyatı tamamilə silmək üçün həmin zolağın solundakı, rezervasiyanın aşağısındakı və ya «Nəqliyyat» tabında kartındakı zibil qutusuna klikləyin və təsdiqləyin.',
  'help.guide.edit-transport.result':
    'Dəyişiklik nəqliyyatın göründüyü hər yerdə əks olunur: «Nəqliyyat» bölməsində, onun olduğu gündə və xəritədəki xəttində.',
  'help.guide.edit-transport.tip.1':
    'Eyni forma iki yerdən açılır: gün planındakı sətirdən açılan rezervasiyada «Redaktə et» ilə və «Nəqliyyat» bölməsindəki kartın karandaş ikonu ilə. Planlaşdırılmış ictimai nəqliyyat reysi də rezervasiya kimi açılır: orada «Marşrutu dəyiş» axtarışı yenidən açır, «Redaktə et» isə bu formanı.',
  'help.guide.edit-transport.tip.2':
    'Nəqliyyatı başqa günə keçirmək üçün formaya ehtiyac yoxdur: onun sətrini bir günün kartından digərinə sürükləyin.',
  // transport-on-map
  'help.guide.transport-on-map.title': 'Nəqliyyatı xəritədə göstərmək',
  'help.guide.transport-on-map.goal': 'Reysin, avtomobil yolunun və ya əlaqənin real marşrutuna baxın.',
  'help.guide.transport-on-map.step.1':
    'Hər iki ucu təyin edilmiş nəqliyyatın gün planındakı sətrində kiçik marşrut ikonu görünür. Ona klikləyin; ipucusu «Rezervasiya marşrutlarını gizlət» olur.',
  'help.guide.transport-on-map.step.2':
    'Marşrut xəritədə çəkilir, hər iki ucunda nəqliyyatın ikonu olan oval nişan görünür.',
  'help.guide.transport-on-map.step.3':
    'Uc markerinə klikləyin, rezervasiya xəritənin üzərində açılır. Başlığında status, növ, günlər və «Rezervasiya kodu» göstərilir. Onların altında hava limanları və ya stansiyalarla birlikdə vaxtlar, aviaşirkət və uçuş nömrəsi var. Bağlamaq üçün başlıqdakı «Bağla» düyməsinə klikləyin.',
  'help.guide.transport-on-map.step.4':
    'Günlərin üstündəki alətlər panelində marşrut ikonu bütün səyahətə birdən təsir edir: «Bütün rezervasiya marşrutlarını göstər», yenidən gizlətmək üçün isə «Bütün rezervasiya marşrutlarını gizlət».',
  'help.guide.transport-on-map.step.5':
    'Planlaşdırılmış ictimai nəqliyyat bağlantısının öz marşrut ikonu yoxdur. O, günün «Marşrut» açarı ilə çəkilir, ona görə həmin günün marşrutu yanılı olduqca «Bütün rezervasiya marşrutlarını gizlət» onu gizlətmir.',
  'help.guide.transport-on-map.result':
    'Marşrutlar hər iki ucunda nişanla xəritədə göstərilir və siz söndürənə qədər orada qalır.',
  'help.guide.transport-on-map.tip.1':
    'Reys, kruiz və bərə əyri xətlə çəkilir. Avtomobil, avtobus, taksi və velosiped real yollarla gedir. Qatar və ya planlaşdırılmış əlaqə dayandığı stansiyalardan keçir.',
  'help.guide.transport-on-map.tip.2':
    'Təsdiqlənmiş rezervasiya bütöv, gözləyən isə qırıq xətlə çəkilir. «Rezervasiya marşrutu etiketləri» ayarı uc nişanlarında hava limanının kodunu və ya stansiyanın adını göstərir.',
  'help.guide.transport-on-map.tip.3':
    '«Bütün rezervasiya marşrutlarını göstər» artıq göstərdiyiniz marşrutların üstünə əlavə etmir: ayrı-ayrı ikonlarla etdiyiniz seçimləri əvəz edir. Basdıqdan sonra bütün marşrutlar ya göstərilir, ya da gizlədilir.',
  // airtrail-import
  'help.guide.airtrail-import.title': 'AirTrail-dən uçuşları idxal etmək',
  'help.guide.airtrail-import.goal':
    'AirTrail-dəki uçuşlarınızı bir dəfəyə səyahətə köçürün və sonra da onları AirTrail-dən yenilənmiş saxlayın.',
  'help.guide.airtrail-import.step.1':
    'AirTrail əlavəsi aktivdirsə və AirTrail serveriniz Tənzimləmələrdə «İnteqrasiyalar» altında qoşulubsa, «Nəqliyyat» tabının panelində «Nəqliyyat» düyməsindən əvvəl təyyarə ikonu, «AirTrail-dən idxal et», görünür. Ona klikləyin.',
  'help.guide.airtrail-import.step.2':
    '«AirTrail-dən idxal et» hesabınızdakı uçuşları iki qrupda göstərir. «Bu səyahət zamanı» qrupunda tarixi səyahətə düşən uçuşlar artıq işarələnmiş olur. «Digər uçuşlar» qrupunda qalanları işarəsiz olur. Səyahətdə artıq olan uçuş boz görünür və «İdxal edilib» kimi qeyd olunur.',
  'help.guide.airtrail-import.step.3':
    'Hər sətir aviaşirkət və reys nömrəsi, iki hava limanı və tarixi olan işarə xanasıdır. Reysi daxil etmək və ya çıxarmaq üçün sətrə klikləyin. «Digər uçuşlar» altındakı reyslər yalnız onları işarələdikdə idxal olunur.',
  'help.guide.airtrail-import.step.4':
    'Birləşən uçuşlar birlikdə qruplaşdırılır: hər biri bir gün ərzində əvvəlkinin endiyi hava limanından qalxır. Aşağıdakı «Həmin hava limanında tranzitlə bir uçuş kimi idxal et» qutusu artıq işarələnib. Dayanacaqlı bir rezervasiya üçün onu belə saxlayın, hissələri ayrı uçuşlar kimi idxal etmək üçünsə işarəni götürün.',
  'help.guide.airtrail-import.step.5':
    'Aşağı sağdakı düyməni klikləyin, orada işarələnmiş uçuşların sayı göstərilir, məsələn, «2 uçuşu idxal et». Sonra çıxan mesaj neçə uçuşun idxal olunduğunu bildirir.',
  'help.guide.airtrail-import.step.6':
    'Uçuşlar «Təsdiqlənib» altında kart kimi, hər birinin adının yanında mavi AirTrail nişanı ilə, həmçinin uçduqları günlərdə sətir kimi görünür. Tranzit uçuş bir kartdır və onun marşrutu tranzit nöqtəsindən keçir.',
  'help.guide.airtrail-import.result':
    'AirTrail-dən gələn uçuşlar «Nəqliyyat» bölməsində kart, öz günlərində isə sətir kimi görünür. Hər birində haradan gəldiyini göstərən AirTrail nişanı var.',
  'help.guide.airtrail-import.tip.1':
    'Səyahətdə eyni nömrə və tarixlə artıq olan uçuş ötürülür və mesajda neçəsinin ötürüldüyü yazılır. Günlərin üstündəki alətlər panelində geri qaytarma oxu bütün idxalı geri alır.',
  'help.guide.airtrail-import.tip.2':
    'Məlumatın əsas mənbəyi AirTrail olaraq qalır. TREK səyahəti açanda və arxa fonda bir neçə dəqiqədən bir onun dəyişikliklərini oxuyur. AirTrail-də silinmiş uçuşun kartı TREK-də qalır, nişanı isə «Sinxronlaşdırılmayıb» olur. TREK-də etdiyiniz dəyişikliklər yalnız «İnteqrasiyalar» altında «Dəyişiklikləri AirTrail-ə geri yaz» yandırılıbsa, AirTrail-ə göndərilir.',
  'help.guide.airtrail-import.tip.3':
    'Birləşdirilmiş əlaqə sinxronlaşdırıla bilən tək AirTrail reysi deyil, ona görə bu, birdəfəlik idxaldır: mavi nişan qalır və kursoru onun üzərinə gətirəndə bu barədə məlumat görünür. Sinxronlaşdırılmış reysə əllə dayanacaq əlavə etdikdə də eyni şey baş verir.',
  // ── Screen: trip-bookings ─────────────────────────────────────────────────────────────
  'help.ctx.trip-bookings.title': 'Rezervasiyalar',
  'help.ctx.trip-bookings.summary':
    'Bu tabda nəqliyyatdan başqa səyahət üçün rezerv olunan hər şey saxlanılır: qalacağınız yerlər, masalar, biletlər, turlar və parkinq. Hər rezervasiya kodu, sənədləri, səyahətçiləri və xərci ilə birlikdə kart, siyahı sətri və ya zaman xəttində zolaq kimi görünür. Təfərrüatları açmaq üçün rezervasiyaya klikləyin.',
  'help.ctx.trip-bookings.bullet.1':
    'Panelin sağ ucundakı «Əl ilə rezervasiya et» «Yeni rezervasiya» pəncərəsini açır. Burada altı növ rezervasiya yaradılır: Yaşayış yeri, Restoran, Tədbir, Tur, Parkinq və Digər. Uçuşlar, qatarlar və digər nəqliyyat «Nəqliyyat» bölməsindədir və burada heç vaxt görünmür.',
  'help.ctx.trip-bookings.bullet.2':
    '«Əl ilə rezervasiya et» qarşısındakı endirmə işarəsi, «Rezervasiya təsdiqlərini idxal et», təsdiqləri yükləyir ki, TREK onları avtomatik oxusun: EML, PDF, PKPass, HTML və ya TXT, ən çoxu 10 MB-lıq beş fayl, AI modeli şəkilləri oxuya bilirsə, fotolar da. Bu işarə yalnız server onları oxuya bildikdə görünür.',
  'help.ctx.trip-bookings.bullet.3':
    'Axtarış başlıqlar, növlər, məkanlar, qeydlər, rezervasiya kodları və səyahətçilər üzrə aparılır. Yanındakı huni, «Filtrlə», bölməni «Vəziyyət» üzrə, hər biri üçün sayı göstərilən «Növ» üzrə və rezervasiyada adamlar qeyd olunduqdan sonra «Səyahətçilər» üzrə daraldır. Hunidəki rəqəm neçə filtrin aktiv olduğunu göstərir.',
  'help.ctx.trip-bookings.bullet.4':
    '«Filtrlə»dən sonrakı üç işarə görünüşü dəyişir: «Kartlar», «Siyahı» və «Zaman xətti». Yanındakı sürüşdürücülər, «Görünüş seçimləri», kartları və siyahını qruplaşdırır və sıralayır, ya da zaman xəttinin zolaqlarını təyin edir; ondan sonrakı cədvəl işarəsi, «Cədvəl kimi ixrac et (CSV)», vərəqdə göstəriləni fayl kimi endirir. Standart olaraq kartlar «Təsdiqlənib» və «Gözləyir» üzrə, siyahı isə günlər üzrə qruplaşdırılır. Bölməni yığmaq üçün onun başlığına klikləyin.',
  'help.ctx.trip-bookings.bullet.5':
    'Kartın başlığı statusuna görə rənglənir: orada status nöqtəsi (klikləyəndə «Gözləyir» və «Təsdiqlənib» arasında keçir), növ, başlıq, qələm və zibil qutusu var. Altında rezervasiyada olan məlumatlar gəlir: Tarix, Vaxt, Rezervasiya kodu, Giriş və Çıxış, Məkan / Ünvan, Yaşayış yeri, Əlaqələndirilib (plandakı dayanacaq), Link, Qeydlər, Səyahətçilər, Fayl və bağlı xərclər.',
  'help.ctx.trip-bookings.bullet.6':
    'Karta, sətrə və ya zolağa klik rezervasiyanın təfərrüatlarını açır, aşağısında «Xəritədə» (rezervasiyanın məkanı varsa), zibil qutusu və «Redaktə et» olur. Silmək bir dəfə soruşur («Rezervasiya silinsin?», xərclərin də silinəcəyini bildirir). Sonra rezervasiya və ona bağlı xərclər silinir, yaşayış yeri üçün isə onun gecələri gün planından çıxarılır.',
  // booking-views
  'help.guide.booking-views.title': 'Görünüşü dəyişmək və rezervasiyanı açmaq',
  'help.guide.booking-views.goal':
    'Rezervasiyalara kart, siyahı və ya zaman xətti kimi baxın və bütün təfərrüatları görmək üçün birini açın.',
  'help.guide.booking-views.step.1':
    'Paneldə «Filtrlə» düyməsindən sonrakı üç ikon görünüşlərdir, kursoru üzərinə aparanda hər biri adını göstərir: «Kartlar», «Siyahı» və «Zaman xətti». Tab «Kartlar» görünüşündə açılır: «Təsdiqlənib» və «Gözləyir» bölmələrində hər rezervasiya üçün bir kart. Ortadakı «Siyahı» ikonuna klikləyin.',
  'help.guide.booking-views.step.2':
    '«Siyahı» hər rezervasiyanı gün başlıqları altında ayrıca sətir kimi göstərir, gün və vaxt sağda olur. Ox düymələri ilə sətirdən sətrə keçə bilərsiniz. Üç düymənin sonuncusu olan «Zaman xətti»ni klikləyin.',
  'help.guide.booking-views.step.3':
    '«Zaman xətti» rezervasiyaları səyahət günləri üzrə göstərir: hər növ üçün bir zolaq və hər rezervasiya üçün başlanğıcdan sonadək bir blok. Gözləyən rezervasiyanın konturu qırıq xətlidir. «Səyahət» bütün səyahəti enə sığdırır. Həmin günü saatbasaat görmək üçün günün başlığına klikləyin.',
  'help.guide.booking-views.step.4':
    '«Gün» bir günü saat şkalasında göstərir, hər zolağın uzunluğu onun vaxtını göstərir. Günün adının yanındakı oxlar əvvəlki və növbəti günə keçir. Səyahət davam edərkən «Bu gün» cari günə keçir, sağdakı «Səyahət» və «Gün» keçidi isə bütün səyahətə qaytarır.',
  'help.guide.booking-views.step.5':
    'Günü, vaxtları və məkanı görmək üçün kursoru zolağın üzərinə gətirin, rezervasiyanın təfərrüatlarını açmaq üçün isə ona klikləyin. «Kartlar» görünüşündəki kart və «Siyahı»dakı sətir də eyni pəncərəni açır.',
  'help.guide.booking-views.step.6':
    'Ətraflı görünüşün başlığında başlıq və status (klikləyəndə dəyişir), növ, gün və rezervasiya kodu üçün nişanlar var, kodun yanında onu kopyalayan düymə də olur. Altında vaxtlar plitələr şəklində, sonra rezervasiyada varsa məkan, səyahətçilər, qeydlər, xərclər və fayllar, ən aşağıda isə «Xəritədə», zibil qutusu və «Redaktə et» gəlir.',
  'help.guide.booking-views.result':
    'Rezervasiya təfərrüat görünüşündə açılır: «Redaktə et» onun formasını açır, «Xəritədə» onu planda göstərir, «Bağla» və ya Escape isə sizi gəldiyiniz görünüşə qaytarır.',
  'help.guide.booking-views.tip.1':
    'Görünüş ikonlarından sonrakı sürüngəc ikonu, «Görünüş seçimləri», «Kartlar» və «Siyahı» görünüşlərini «Qruplaşdır» və «Sıralama» ilə qruplaşdırmağa və sıralamağa imkan verir. «Zaman xətti» görünüşündə isə burada «Hər növ üçün bir zolaq» və «Digər bölməni göstər» var. «Digər bölməni göstər» «Nəqliyyat» bölməsinin qeydlərini yuxarıda nazik zolaqda solğun göstərir. «Görünüşü sıfırla» standart ayarları qaytarır, hər bölmə isə öz görünüşünü bu brauzerdə yadda saxlayır.',
  'help.guide.booking-views.tip.2':
    'Səyahətdən əvvəl və ya sonra olan, yaxud tarixi olmayan rezervasiya zaman xəttində görünə bilməz. O, qrafikin altında «Səyahətdən əvvəl», «Səyahətdən sonra» və ya «Tarix yoxdur» başlığı altında kiçik kart kimi göstərilir.',
  'help.guide.booking-views.tip.3':
    'Rezervasiya harada görünürsə görünsün, eyni təfərrüat pəncərəsi açılır: «Nəqliyyat» tabında, gün planında, günün və məkanın təfərrüatlarında. Başlığa klikləyərək rezervasiyanın adını dəyişə bilərsiniz.',
  // create-booking
  'help.guide.create-booking.title': 'Rezervasiya yaratmaq',
  'help.guide.create-booking.goal':
    'Restoran, tədbir, tur, parkinq yeri və ya istənilən başqa şeyi səyahətə əl ilə əlavə edin.',
  'help.guide.create-booking.step.1':
    'Panelin sağ ucundakı «Əl ilə rezervasiya et» düyməsinə klikləyin. «Yeni rezervasiya» açılır, yuxarıdakı başlıqda ad və iki nişan olur.',
  'help.guide.create-booking.step.2':
    'Yuxarı zolaqdakı növ yazısına klikləyin (yeni rezervasiyada orada «Digər» yazılır) və «Rezervasiya növü»nü seçin. Bu bölmədə altı növ yaradılır: «Yaşayış yeri», «Restoran», «Tədbir», «Tur», «Parkinq» və «Digər». Forma seçiminizə görə dəyişir: yalnız «Yaşayış yeri» tarixlər əvəzinə günlər aralığından istifadə edir.',
  'help.guide.create-booking.step.3':
    'Başlığı yuxarıdakı zolağa, nişanların üstündəki xanaya yazın. Bu, yeganə məcburi xanadır və nəsə yazmayana qədər «Əlavə et» boz qalır.',
  'help.guide.create-booking.step.4':
    '«Tarix» və «Başlanğıc vaxtı»nı, rezervasiyanın sonu varsa, «Bitmə tarixi» və «Bitmə vaxtı»nı təyin edin. Təqvimlər yalnız səyahət daxilindəki günləri təklif edir. Başlanğıcdan sonra olmayan bitmə tarixi və vaxtı qırmızı göstərilir və «Əlavə et»i bloklayır. Bitmə tarixi olmadan başlanğıcdan əvvəlki bitmə vaxtı isə yalnız xəbərdarlıq edir: rezervasiya növbəti gün bitirsə, bitmə tarixi təyin edin.',
  'help.guide.create-booking.step.5':
    '«Rezervasiya kodu» sahəsinə təsdiq məktubundakı kodu yazın, sonra başlıqda növün yanındakı vəziyyət nişanına klikləyin. Yeni rezervasiyada orada «Gözləyir» yazılır, klikdən sonra isə «Təsdiqlənib» olur. Kartın hansı bölmədə görünəcəyini vəziyyət müəyyən edir.',
  'help.guide.create-booking.step.6': 'Formanın aşağısındakı «Əlavə et» düyməsini klikləyin.',
  'help.guide.create-booking.result':
    'Rezervasiya öz bölməsində kart kimi görünür. Başlığın rəngi statusunu göstərir, kartda isə növü, tarixi, vaxtları və kodu var. Səyahətdəki hər kəs onu dərhal görür.',
  'help.guide.create-booking.tip.1':
    '«Məkan / Ünvan» siz yazdıqca real ünvanlar təklif edir. Birini seçsəniz, yazdığınızın yerini tutur, özünüz yazdığınız ünvan isə olduğu kimi qalır.',
  'help.guide.create-booking.tip.2':
    '«Link» sahəsinə rezervasiyanın provayderdəki öz səhifəsini yazın. Kartda və ətraflı görünüşdə o, yeni tabda açılan link kimi göstərilir.',
  'help.guide.create-booking.tip.3':
    'Qeydlərdə Markdown işləyir, ona görə siyahı və ya qalın sətir kartda və təfərrüat görünüşündə siyahı və ya qalın mətn kimi göstərilir.',
  // booking-hotel
  'help.guide.booking-hotel.title': 'Qalmaq üçün yer rezerv edin',
  'help.guide.booking-hotel.goal':
    'Yaşayış yerini daxil edin ki, o, eyni anda həm rezervasiya, həm də gün planında gecələr kimi sayılsın.',
  'help.guide.booking-hotel.step.1':
    '«Əl ilə rezervasiya et» düyməsini klikləyin və yuxarı zolaqdakı növ seçicisində «Yaşayış yeri» seçin. Tarix sahələrinin yerinə otel sahələri bloku çıxır.',
  'help.guide.booking-hotel.step.2':
    'Oteli «Yaşayış yeri» altında seçin. Siyahıda səyahətin məkanları var, idxal edilmiş izlər və turlar istisna olmaqla. Birini seçdikdə onun adı boş başlığa, ünvanı isə «Məkan / Ünvan» sahəsinə yazılır.',
  'help.guide.booking-hotel.step.3':
    '«Kimdən» və «Kimə» sahələrini təyin edin: ilk gecə və yola düşdüyünüz səhər. Hər ikisində səyahət günləri tarixləri ilə təklif olunur və TREK «Kimə» tarixini həmişə «Kimdən» tarixindən sonra saxlayır.',
  'help.guide.booking-hotel.step.4':
    '«Giriş», «Son giriş vaxtı» və «Çıxış» sahələrini, həmçinin təsdiq məktubundakı «Rezervasiya kodu»nu doldurun.',
  'help.guide.booking-hotel.step.5': '«Əlavə et» düyməsinə klikləyin.',
  'help.guide.booking-hotel.result':
    'Kartda «Tarix» altında günlər aralığı, giriş və çıxış vaxtları və ünvan göstərilir. Qalma indi planın həmin günlərində də görünür.',
  'help.guide.booking-hotel.tip.1':
    '«Yaşayış yeri» «Tarix» və «Başlanğıc vaxtı» olmayan yeganə növdür. Onun tarixləri «Kimdən» və «Kimə» xanalarıdır və burada təqvim tarixləri yox, səyahətin günləri seçilir.',
  'help.guide.booking-hotel.tip.2':
    '«Yaşayış yeri» sahəsini boş qoyub əvəzinə ünvanı yazın: məkan axtarılır, yaradılır və sizin üçün xəritədə işarələnir.',
  'help.guide.booking-hotel.tip.3': 'Rezervasiyanı silsəniz, onun gecələri də gün planından çıxarılır.',
  // link-booking
  'help.guide.link-booking.title': 'Rezervasiyanı plana bağlamaq',
  'help.guide.link-booking.goal':
    'Rezervasiyanı aid olduğu dayanacağa və məkana bağlayın ki, lazım olan yerdə görünsün.',
  'help.guide.link-booking.step.1':
    'Bağlamaq istədiyiniz kartın üzərinə kursoru gətirin və başlığındakı qələmə klikləyin. «Rezervasiyanı redaktə et» açılır.',
  'help.guide.link-booking.step.2':
    '«Günlük planla əlaqələndir» sahəsini açın. Siyahıda planınız görünür: hər gün üçün başlıq, sonra həmin günün nömrələnmiş və vaxtı göstərilmiş dayanacaqları. Rezervasiyanın aid olduğu dayanacağı seçin.',
  'help.guide.link-booking.step.3':
    '«Məkan / Fəaliyyət» məkanın özünü bağlayır. Onu orada seçin, başlıq və «Məkan / Ünvan» boşdursa, avtomatik doldurulacaq.',
  'help.guide.link-booking.step.4': '«Yenilə» düyməsinə klikləyin.',
  'help.guide.link-booking.result':
    'Kartda «Əlaqələndirilib» altında gün və dayanacaq göstərilir, rezervasiya isə gün planında həmin dayanacaqla birlikdə görünür.',
  'help.guide.link-booking.tip.1':
    'Siyahının yuxarısındakı «Əlaqə yoxdur (müstəqil)» bağlantını yenidən ləğv edir. Yaşayış yeri üçün dayanacaq seçimi yoxdur: o, gecələri vasitəsilə bağlanır.',
  'help.guide.link-booking.tip.2':
    'Tarixi olan gündə dayanacaq seçsəniz, boş «Tarix» sahəsi avtomatik doldurulur. Artıq təyin etdiyiniz tarix dəyişmir.',
  // booking-travelers
  'help.guide.booking-travelers.title': 'Rezervasiyanın kim üçün olduğunu göstərin',
  'help.guide.booking-travelers.goal':
    'Rezervasiyanın hansı səyahətçilər üçün olduğunu qeyd edin və sonra yalnız onların rezervasiyalarını göstərin.',
  'help.guide.booking-travelers.step.1':
    'Rezervasiyanı kartındakı karandaşla açın. «Səyahətçilər» «Rezervasiya kodu»nun yanındadır. Rezervasiyaya heç kim təyin olunmayıbsa, orada «Səyahətçiləri təyin et» yazılır.',
  'help.guide.booking-travelers.step.2':
    'Ona klikləyin və bu rezervasiyanın kimlər üçün olduğunu seçin; adı qeyd olunmuş qonaqlar da siyahıdadır. Seçilmiş şəxsin yanında quş işarəsi görünür, avatarı isə sahədə göstərilir. Şəxsi çıxarmaq üçün adına yenidən klikləyin.',
  'help.guide.booking-travelers.step.3': '«Yenilə» düyməsini klikləyin.',
  'help.guide.booking-travelers.step.4':
    'Paneldə «Filtrlə» düyməsinə klikləyin: yalnız bir nəfərin rezervasiyalarını görmək üçün «Səyahətçilər» altında onun adına klikləyin. Eyni anda bir neçə nəfər seçilə bilər.',
  'help.guide.booking-travelers.result':
    'Kartda kimlər üçün olduğu göstərilir, «Filtrlə» isə bölməni seçdiyiniz adamların rezervasiyaları ilə daraldır.',
  'help.guide.booking-travelers.tip.1':
    'Kartda və ətraflı görünüşdə səyahətçilər yalnız göstərilir, orada onları dəyişə bilməzsiniz. Onları burada, formada təyin edirsiniz.',
  'help.guide.booking-travelers.tip.2':
    'Səyahətin birdən çox üzvü olanda və ən azı bir rezervasiyada kimsə göstəriləndə «Filtrlə» menyusunda «Səyahətçilər» çıxır. Seçiminiz brauzer tabını bağlayana qədər yadda qalır.',
  // booking-files
  'help.guide.booking-files.title': 'Vauçeri rezervasiya ilə birlikdə saxlayın',
  'help.guide.booking-files.goal': 'Təsdiqi, bileti və ya minik talonunu aid olduğu rezervasiyaya əlavə edin.',
  'help.guide.booking-files.step.1':
    'Rezervasiyanı kartındakı qələmlə açın. «Fayl» bölməsi «Əlaqələndir» bölməsinin yanındadır, orada «Fayl əlavə et» düyməsini klikləyin. Artıq mövcud rezervasiyada sənəd dərhal yüklənir və TREK «Fayl yükləndi» bildirir.',
  'help.guide.booking-files.step.2': 'Sənəd adı ilə siyahıda göstərilir, yanında onu açmaq üçün düymə və X var.',
  'help.guide.booking-files.step.3':
    '«Mövcud faylı əlaqələndir» səyahətin bu rezervasiyaya hələ əlavə olunmamış sənədlərini təklif edir. Birini seçin, heç nə yenidən yüklənmədən əlavə olunacaq.',
  'help.guide.booking-files.step.4': '«Yenilə» düyməsinə klikləyin.',
  'help.guide.booking-files.result':
    'Kartda və təfərrüatlar görünüşündə sənədlər «Fayl» altında sadalanır. Sənədi açmaq üçün ona klikləyin. Təfərrüatlar görünüşündə siyahının üstündəki «Fayllarda göstər» sizi «Fayl» vərəqinə aparır.',
  'help.guide.booking-files.tip.1':
    'Hələ yaratdığınız rezervasiyada sənəd «Əlavə et» düyməsinə kliklədikdə yüklənir. Yükləmək üçün internet bağlantısı lazımdır.',
  'help.guide.booking-files.tip.2':
    'Sənədin yanındakı X sənədi deyil, əlaqəni silir. Sənəd səyahətin «Fayllar» bölməsində qalır.',
  'help.guide.booking-files.tip.3':
    'Hansı fayl növlərinin əlavə oluna biləcəyini administrator «İcazə verilən fayl növləri» bölməsində təyin edir. Standart olaraq sənədlərə, mətnlərə və şəkillərə icazə verilir.',
  // booking-cost
  'help.guide.booking-cost.title': 'Rezervasiyanın qiymətini xərcə çevirmək',
  'help.guide.booking-cost.goal':
    'Rezervasiyanın dəyərini «Xərclər» bölməsinə əlavə edin və onu ödəyənlər arasında bölün.',
  'help.guide.booking-cost.step.1':
    'Rezervasiyanı kartındakı qələmlə açın və formanın aşağısına keçin. «Xərclər» altında «Xərc yarat» və «Mövcud xərci əlaqələndir» düymələri, həmçinin «Rezervasiyanı yadda saxlayır, sonra Xərclər redaktorunu açır» qeydi var.',
  'help.guide.booking-cost.step.2':
    '«Xərc yarat» düyməsinə klikləyin. Rezervasiya yadda saxlanılır, forma bağlanır və «Xərclər» redaktoru «Xərc əlavə et» kimi açılır.',
  'help.guide.booking-cost.step.3':
    'Başlıqdakı ad artıq rezervasiyanın başlığıdır, «Gün» də rezervasiyanın günüdür. «Ümumi məbləğ»i yazın və yanındakı «Valyuta»nı yoxlayın.',
  'help.guide.booking-cost.step.4':
    'Başlıqdakı nişan «Kateqoriya»dır və artıq rezervasiya növünə uyğun seçilib. «Kim ödədi?» altında ödəyəni, «Bölüşdür» altında isə məbləğin necə bölünəcəyini seçin.',
  'help.guide.booking-cost.step.5': '«Xərc əlavə et» düyməsinə klikləyin.',
  'help.guide.booking-cost.result':
    'Kartın aşağısında məbləğ görünür, rezervasiyanın formasında xərc «Əlaqəli xərclər» altında göstərilir, həmin xərc isə «Xərclər» bölməsində də bu rezervasiyaya bağlı şəkildə yer alır.',
  'help.guide.booking-cost.tip.1':
    'Kateqoriya növdən asılıdır: «Restoran» növü «Yemək və içki», «Yaşayış yeri» növü «Yaşayış yeri», «Parkinq» növü «Parkinq» kateqoriyasına düşür, «Tədbir» və «Tur» isə hər ikisi «Digər» olur.',
  'help.guide.booking-cost.tip.2':
    'Bir rezervasiyanın bir neçə xərci ola bilər. «Mövcud xərci əlaqələndir» «Xərclər» bölməsində hələ heç nəyə bağlanmamış xərcləri təklif edir. Bağlı xərcdə «Əlaqəni sil, xərci saxla» əlaqəni silir və xərci «Xərclər»də saxlayır, zibil qutusu isə xərci silir.',
  'help.guide.booking-cost.tip.3':
    '«Xərclər» formada yalnız «Xərclər» əlavəsi aktiv olduqda görünür. Onu administrator «Əlavələr» bölməsində yandırır.',
  // filter-bookings
  'help.guide.filter-bookings.title': 'Rezervasiya tapın',
  'help.guide.filter-bookings.goal': 'Uzun tabı sözə, statusa, növə və ya şəxsə görə filtrləyin.',
  'help.guide.filter-bookings.step.1':
    'Paneldəki «Axtar» xanasına yazın. Axtarış başlıqlar, növlər, məkanlar və ünvanlar, qeydlər, rezervasiya kodları və səyahətçilərin adları üzrə aparılır, siz yazdıqca nəticələr azalır. Escape xananı təmizləyir.',
  'help.guide.filter-bookings.step.2':
    'Axtarışın yanındakı huni ikonuna, «Filtrlə» düyməsinə klikləyin. Paneldə «Vəziyyət», «Növ» və rezervasiyaya insanlar təyin olunandan sonra «Səyahətçilər» var.',
  'help.guide.filter-bookings.step.3':
    'Yalnız onları görmək üçün «Vəziyyət» altında «Təsdiqlənib» və ya «Gözləyir» seçin; «Hamısı» hər ikisini göstərir.',
  'help.guide.filter-bookings.step.4':
    'Yalnız müəyyən növləri saxlamaq üçün «Növ» altında bir və ya bir neçə növə klikləyin. Hər növün yanında neçə rezervasiya olduğu yazılır, seçilənlər isə işarə ilə qeyd olunur.',
  'help.guide.filter-bookings.step.5':
    '«Filtrlə» üzərindəki rəqəm neçə filtrin aktiv olduğunu, axtarışın yanındakı çip isə bütün rezervasiyalardan neçəsinin qaldığını göstərir. Hər şeyi yenidən görmək üçün çipə və ya panelin aşağısındakı «Filtrləri sıfırla» düyməsinə klikləyin.',
  'help.guide.filter-bookings.result':
    'Bölmə «Kartlar», «Siyahı» və «Zaman xətti» görünüşlərində eyni qaydada yalnız seçdiklərinizi göstərir. Filtrlər brauzer tabını bağlayana qədər bu səyahət üçün qalır.',
  'help.guide.filter-bookings.tip.1':
    '«Növ» yalnız tabda birdən çox növ olanda görünür və yalnız tabdakı növləri sadalayır. Yəni tabda tur yoxdursa, «Növ» içində «Tur» seçimi də olmur.',
  'help.guide.filter-bookings.tip.2':
    'Filtrə heç nə uyğun gəlmirsə, bölmədə «Bu filtrlərə uyğun heç nə yoxdur» yazısı, düz altında isə «Filtrləri sıfırla» düyməsi görünür.',
  // import-booking-file
  'help.guide.import-booking-file.title': 'Rezervasiyanı təsdiq məktubundan idxal edin',
  'help.guide.import-booking-file.goal':
    'Qoy TREK rezervasiyanı provayderin göndərdiyi e-poçtdan və ya PDF-dən oxusun, onu yenidən yazmalı olmayasınız.',
  'help.guide.import-booking-file.step.1':
    'Paneldəki endirmə ikonunu, yəni «Rezervasiya təsdiqlərini idxal et» düyməsini klikləyin. Onun adı kursoru üzərinə gətirəndə görünür. Eyni adlı pəncərə açılır.',
  'help.guide.import-booking-file.step.2':
    'Təsdiqləri qutuya atın və ya qutuya klikləyib seçin: EML, PDF, PKPass, HTML və TXT, hər biri 10 MB-a qədər beş fayla qədər, AI modeli şəkilləri oxuya bilirsə, fotolar da (JPG, PNG, WEBP). Seçdiklərinizin adları qutuda görünür.',
  'help.guide.import-booking-file.step.3':
    '«İdxal et» düyməsinə klikləyin. Pəncərə dərhal bağlanır, çünki oxuma arxa planda gedir.',
  'help.guide.import-booking-file.step.4':
    'Sağ aşağıdakı kart faylın adının altında gedişatı göstərir. Tətbiqdə başqa yerə keçdikdə və səhifəni yenilədikdə də görünür. Oxuma bitəndə «Fayllar təhlil edilir…» işarəyə çevrilir və kartda «İdxal et» çıxır. Ona klikləyin.',
  'help.guide.import-booking-file.step.5':
    'Tapılan hər rezervasiya artıq doldurulmuş halda bir-birinin ardınca «Yeni rezervasiya» pəncərəsində açılır. Otel üçün bunlardır: başlıq kimi otelin adı və səyahətdə həmin məkan varsa, «Yaşayış yeri» altında da onun adı, «Məkan / Ünvan», gecələrə uyğun başlanğıc və son gün, «Giriş» və «Çıxış», «Rezervasiya kodu», «Fayl» altında təsdiq sənədi və Xərclər aktivdirsə, «Əlaqəli xərc» kimi qiymət. Yoxlayın və «Əlavə et» düyməsinə klikləyin.',
  'help.guide.import-booking-file.result':
    'Rezervasiya «Gözləyir» bölməsində gecələri, kodu və «Fayllar» altında təsdiqi ilə kart kimi görünür. Qalma planın həmin günlərində görünür. «Xərclər» yandırılıbsa, qiymət rezervasiyaya bağlı xərc kimi əlavə olunur.',
  'help.guide.import-booking-file.tip.1':
    'İdxal ikonu yalnız server təsdiq məktublarını oxuya bildikdə görünür. Bunun üçün ya çıxarıcı, ya da «Süni intellektlə təhlil» əlavəsi lazımdır. «Süni intellektlə təhlil» əlavəsini administrator «Əlavələr» bölməsində aktiv edir. Heç bir rezervasiyası olmayan bölmədə o, «Fayldan idxal et» düyməsi kimi də görünür.',
  'help.guide.import-booking-file.tip.2':
    'Heç nə oxunmayıbsa, kart bunu bildirir. «Süni intellektlə təhlil» aktivdirsə, kart «AI ilə təhlil et» təklif edir və eyni faylları birbaşa modelə göndərir. Hazır təhlil on dəqiqə saxlanılır; yoxlamaya bu müddət ərzində başlayın.',
  'help.guide.import-booking-file.tip.3':
    'Təsdiq məktubu yalnız onun növü admin tənzimləmələrindəki «İcazə verilən fayl növləri» siyahısında olduqda əlavə olunur. PDF standart olaraq icazəlidir. E-poçt faylı, yəni EML, əvvəlcə əlavə edilməlidir, əks halda rezervasiya onsuz yadda saxlanılır.',
  // edit-booking
  'help.guide.edit-booking.title': 'Rezervasiyanı dəyişmək',
  'help.guide.edit-booking.goal':
    'Vaxtı düzəldin, sonradan gələn kodu əlavə edin və ya rezervasiyanı «Gözləyir»dən «Təsdiqlənib» vəziyyətinə keçirin.',
  'help.guide.edit-booking.step.1':
    'Kursoru kartın üzərinə gətirin və başlığındakı qələmə klikləyin. «Rezervasiyanı redaktə et» rezervasiyanın bütün məlumatları ilə açılır.',
  'help.guide.edit-booking.step.2':
    'Dəyişmək lazım olanı dəyişin, məsələn, operatorun sonradan göndərdiyi «Rezervasiya kodu»nu.',
  'help.guide.edit-booking.step.3':
    'Yuxarıdakı zolaqda «Gözləyir» nişanına klikləyin. O, «Təsdiqlənib» olur, zolaq isə yaşıllaşır.',
  'help.guide.edit-booking.step.4': '«Yenilə» düyməsinə klikləyin.',
  'help.guide.edit-booking.result':
    'Kart yerini dəyişir: təsdiqlənmiş rezervasiya yaşıl nöqtə və yaşıl yuxarı zolaqla «Təsdiqlənib» bölməsinə keçir və səyahətdəki hər kəs bu dəyişikliyi görür.',
  'help.guide.edit-booking.tip.1':
    '«Rezervasiya kodu» oxunmursa, deməli «Tənzimləmələr»də, «Ümumi» bölməsində «Rezervasiya kodlarını bulanıqlaşdır» yandırılıb. Kodu oxumaq üçün kursoru onun üzərinə aparın və ya ona klikləyin.',
  'help.guide.edit-booking.tip.2':
    'Növü dəyişsəniz, bağlı xərcin kateqoriyası da dəyişir. Yalnız «Xərclər» redaktorunda kateqoriyanı əl ilə seçmisinizsə, dəyişmir.',
  'help.guide.edit-booking.tip.3':
    'Rezervasiyanın ətraflı görünüşünün aşağısındakı «Redaktə et» də eyni formanı açır. Statusu formasız da dəyişə bilərsiniz: kartdakı və ya sətirdəki nöqtəyə, yaxud ətraflı görünüşdəki status nişanına klikləyin.',
  // delete-booking
  'help.guide.delete-booking.title': 'Rezervasiyanı silmək',
  'help.guide.delete-booking.goal': 'Ləğv olunmuş rezervasiyanı səyahətdən silin.',
  'help.guide.delete-booking.step.1':
    'Kursoru kartın üzərinə aparın və başlığındakı zibil qutusuna klikləyin. Rezervasiyanın təfərrüatlarının aşağısındakı zibil qutusu da eyni işi görür.',
  'help.guide.delete-booking.step.2':
    '«Rezervasiya silinsin?» seçdiyiniz rezervasiyanın adını çəkir və onun həmişəlik silinəcəyini bildirir. Ona bağlı xərclər varsa, onların da silinəcəyi deyilir.',
  'help.guide.delete-booking.step.3': '«Sil» düyməsini klikləyin.',
  'help.guide.delete-booking.result':
    'Kart səyahətdəki hər kəs üçün silinir. Silinmiş rezervasiyanı geri qaytarmaq olmur, ona görə təsdiq sualı ləğv etmək üçün son şansınızdır.',
  'help.guide.delete-booking.tip.1':
    'Rezervasiyanı sildikdə ona bağlı xərclər də silinir. Yaşayış yerini sildikdə onun gecələri də gün planından çıxarılır.',
  'help.guide.delete-booking.tip.2':
    'Əlavə edilmiş sənədlər səyahətin «Fayl» tabında qalır; yalnız onların rezervasiya ilə əlaqəsi silinir.',

  // ── Screen: trip-lists ────────────────────────────────────────────────────────────────
  'help.ctx.trip-lists.title': 'Siyahılar',
  'help.ctx.trip-lists.summary':
    'Bir səyahət üçün iki siyahı: kimin nə götürdüyü və nəyin neçə çəkdiyi göstərilən baqaj siyahısı, bir də səyahətdən əvvəl və səyahət zamanı görülməli işlərin tapşırıq siyahısı. Bu bölmə «Siyahılar» əlavəsi aktiv olanda görünür.',
  'help.ctx.trip-lists.bullet.1':
    'Yuxarıdakı paneldə «Baqaj siyahısı» və «Tapşırıqlar» ikisi arasında keçid edir və hər birində neçə element olduğunu göstərir; panelin sağ ucundakı düymələr hazırda hansı açıqdırsa, ona aiddir.',
  'help.ctx.trip-lists.bullet.2':
    'Baqaj siyahısı istədiyiniz adlarla siyahılara bölünür, məsələn, «Sənədlər» və ya «Geyim». Hər siyahı bir kartdır. Kartın başlığında bütün siyahını başqa yerə sürükləmək üçün tutacaq, rəng nöqtəsi, yığılanların ümumi saya nisbətini göstərən nişan, «Adını dəyiş», «Hamısını işarələ», «Bütün işarələri sil» və «Siyahını sil» olan üç nöqtə, həmçinin kartı yığan ox var. Yuxarıdakı paneldə «Siyahı əlavə et» yeni siyahı yaradır.',
  'help.ctx.trip-lists.bullet.3':
    'Sətirdə sürükləmə tutacağı, işarə qutusu və ad, sonra elementi gətirəcək şəxsin kiçik avatarı var. Miqdarı birdən çox olan elementdə həmçinin mənfi və müsbət düymələri olan 3/10 kimi sayğac olur. Sonra kiçik nişan şəklində miqdar, «Çantaların izlənməsi» aktiv olduqda qramla çəki və çanta dairəsi, ardınca zibil qutusu və «Siyahıya köçür», «Paylaşım», «Adını dəyiş» və «Sil» olan üç nöqtə menyusu gəlir. Sətrin istifadə etmədiyi idarəetmələr kursoru üzərinə gətirənə qədər solğun görünür.',
  'help.ctx.trip-lists.bullet.4':
    '«Paylaşılan» və «Mənim siyahım» baqaj siyahısını ikiyə bölür: hamının gördüyü siyahı və sizin şəxsi siyahınız. Yanındakı «Hamısı», «Açıq» və «Hazır» hansı açıqdırsa, onu süzür. Sətrin ən sonundakı «A-dan Z-yə» hər siyahının elementlərini ada görə sıralayır, ikinci klik isə öz sıranıza qaytarır. Yuxarıdakı irəliləyiş kartı nəyin yığıldığını sayır.',
  'help.ctx.trip-lists.bullet.5':
    '«Şablonu tətbiq et» və «Şablon kimi yadda saxla» siyahını doldurur və ya yadda saxlayır, beləliklə hər şeyi yenidən yazmağa ehtiyac qalmır. Onlardan sonrakı iki ikon, «İxrac et» və «İdxal et», siyahını çap, PDF və ya fayl kimi ixrac edir və siyahı idxal edir. İrəliləyiş kartının sağ ucundakı qırmızı düymə neçə elementin işarələndiyini göstərir və onları silir.',
  'help.ctx.trip-lists.bullet.6':
    '«Tapşırıqlar» bölməsinin öz yan paneli var: irəliləyiş kartı, «Hamısı», «Mənim tapşırıqlarım», «Vaxtı keçmiş» və «Hazır» filtrləri, hər siyahı üçün bir sətir və onların altında «Siyahı əlavə et». Tapşırıqlar bir kartın içindədir. Kartın başlığında filtrin adı və sıralama («Prioritet» və ya «Son tarix») göstərilir. Tapşırığı sağdakı paneldə açmaq üçün ona klikləyin. Zolaqdakı «Yeni tapşırıq əlavə et» «Yeni tapşırıq» pəncərəsini açır.',
  // packing-categories
  'help.guide.packing-categories.title': 'Baqaj siyahısını qurun',
  'help.guide.packing-categories.goal':
    'Götürəcəklərinizi siyahılara bölün, onlara elementlər əlavə edin və hər siyahıya kimin cavabdeh olduğunu seçin.',
  'help.guide.packing-categories.step.1':
    'Siyahıların üstündəki paneldə «Siyahı əlavə et» düyməsinə klikləyin. Kiçik pəncərə açılır. Adı onun yuxarı zolağına, «Siyahının adı (məs. Geyim)» yazılan yerə yazın və «Əlavə et» düyməsinə klikləyin.',
  'help.guide.packing-categories.step.2':
    'Yeni siyahı yalnız üç solğun nöqtədən ibarət boş sətirlə başlayır. Sətrin aşağısındakı «Element əlavə et» düyməsinə klikləyin, elementi «Elementin adı...» xanasına yazın və Enter basın: ilk element boş sətrin yerini tutur, xana isə növbəti element üçün açıq qalır.',
  'help.guide.packing-categories.step.3':
    'Sətrin adını dəyişmək üçün adına və ya sağ ucundakı üç nöqtədə «Adını dəyiş» bəndinə klikləyin.',
  'help.guide.packing-categories.step.4':
    'Siyahının yuxarı zolağındakı, içində adam təsviri olan qırıq xətli dairə səyahət üzvlərini siyahıya təyin edir. Ad seçin. Həmin şəxsi yenidən çıxarmaq üçün görünən nişana klikləyin.',
  'help.guide.packing-categories.step.5':
    'Sayın yanındakı üç nöqtə əlavə seçimləri açır: «Adını dəyiş», «Hamısını işarələ», «Bütün işarələri sil» və «Siyahını sil». «Siyahını sil» siyahını bütün elementləri ilə birlikdə yenidən soruşmadan silir. Ən sağdakı ox siyahını yığır.',
  'help.guide.packing-categories.result':
    'Yeni siyahı cədvəldə elementləri və rəngli nöqtəsi ilə görünür, nişanı isə artıq yığılanları sayır.',
  'help.guide.packing-categories.tip.1':
    'Siyahı yalnız elementləri hesabına mövcuddur. Sonuncu elementi silsəniz, sətir yer tutucuya çevrilir ki, siyahının yeri və rəngi qorunsun; həmin sətri də silsəniz, siyahı silinir.',
  'help.guide.packing-categories.tip.2':
    'Kimisə siyahıya təyin edəndə ona baqaj bildirişi gəlir. Bu, elementləri kimin görə biləcəyini dəyişmir. Bu, sətrin üç nöqtə menyusundakı «Paylaşım» bölməsində təyin olunur.',
  'help.guide.packing-categories.tip.3':
    'İki siyahının adı eyni ola bilər. TREK onları daxildə ayrı saxlayır, ona görə adlar yazdığınız kimi qalır.',
  // check-off-packing
  'help.guide.check-off-packing.title': 'Çamadan yığarkən əşyaları işarələmək',
  'help.guide.check-off-packing.goal':
    'Çantada olanları işarələyin, irəliləyiş zolağını izləyin və yığılmış elementləri silin.',
  'help.guide.check-off-packing.step.1':
    'Sətrin solundakı qutuya klikləyin. Adın üstündən xətt çəkilir və irəliləyiş zolağı yenilənir.',
  'help.guide.check-off-packing.step.2':
    'Siyahıların üstündəki irəliləyiş kartı siyahıdakı bütün elementlərdən neçəsinin yığıldığını rəqəm, faiz və zolaq kimi göstərir.',
  'help.guide.check-off-packing.step.3':
    'Bütün siyahını birdən işarələmək üçün başlığındakı üç nöqtədə «Hamısını işarələ» və «Bütün işarələri sil» var.',
  'help.guide.check-off-packing.step.4':
    '«Paylaşılan» və «Mənim siyahım» yanındakı «Hamısı», «Açıq» və «Hazır» cədvəli filtrləyir. «Açıq» yalnız hələ çatışmayanları göstərir, ona görə tam yığılmış siyahı gizlənir.',
  'help.guide.check-off-packing.step.5':
    'İrəliləyiş kartının sağ tərəfindəki, içində işarələnmiş elementlərin sayı yazılmış qırmızı «Remove … checked» düyməsi brauzerdən bir təsdiqdən sonra onların hamısını birdəfəlik silir.',
  'help.guide.check-off-packing.result':
    'Yalnız yığılmamış elementlər göstərilir, yuxarıdakı zolaq isə yığmanın nə qədərinin hazır olduğunu göstərir.',
  'help.guide.check-off-packing.tip.1': 'İşarələnmiş elementin adını yenə də dəyişə bilərsiniz: adına klikləyin.',
  'help.guide.check-off-packing.tip.2':
    '«Hamısını işarələ» və «Bütün işarələri sil» hər dəfə yalnız bir siyahıya tətbiq olunur, həmin siyahının öz üç nöqtə menyusundan.',
  'help.guide.check-off-packing.tip.3':
    'Bütün elementlər işarələndikdə sayğacın yerində «Hər şey yığılıb!» yazılır və zolaq yaşıl olur.',
  // apply-packing-template
  'help.guide.apply-packing-template.title': 'Baqaj şablonunu tətbiq edin',
  'help.guide.apply-packing-template.goal':
    'Səyahətə hazır siyahı əlavə edin və bu səyahətin siyahısını növbəti səyahət üçün saxlayın.',
  'help.guide.apply-packing-template.step.1': 'Siyahının üstündəki paneldə «Şablonu tətbiq et» düyməsinə klikləyin.',
  'help.guide.apply-packing-template.step.2':
    'Şablon seçin. Hər sətirdə şablonun adı və neçə element olduğu göstərilir.',
  'help.guide.apply-packing-template.step.3':
    'Elementlər olduğunuz görünüşə əlavə olunur: «Paylaşılan» onları hamının gördüyü ümumi siyahıya, «Mənim siyahım» isə öz siyahınıza əlavə edir.',
  'help.guide.apply-packing-template.step.4':
    'Bu səyahətin siyahısını növbəti səyahət üçün saxlamaq istəyirsinizsə, «Şablon kimi yadda saxla» düyməsini klikləyin. Kiçik pəncərə açılır. Yuxarıdakı, «Şablonun adı» yazılan sahəyə ad yazın və «Yadda saxla» düyməsini klikləyin.',
  'help.guide.apply-packing-template.result':
    'Şablonun siyahıları və elementləri səyahətə, əvvəlcədən olanların yanına əlavə olunur.',
  'help.guide.apply-packing-template.tip.1':
    'Şablon hər elementin siyahısını, miqdarını, çəkisini və çantasını kopyalayır, səyahətdə hələ olmayan çantanı isə yaradır. İşarələr kopyalanmır, siyahıda artıq olan heç nə silinmir.',
  'help.guide.apply-packing-template.tip.2':
    '«Şablonu tətbiq et» yalnız ən azı bir şablon olduqda görünür. Şablon yoxdursa, düymə ümumiyyətlə çıxmır.',
  'help.guide.apply-packing-template.tip.3':
    '«Şablon kimi yadda saxla» yalnız server administratoruna və yalnız siyahıda element olanda görünür. O, ümumi elementləri və sizin öz elementlərinizi saxlayır, digər üzvlərin şəxsi elementlərini isə heç vaxt saxlamır.',
  // import-packing-list
  'help.guide.import-packing-list.title': 'Bütöv baqaj siyahısını yapışdırmaq',
  'help.guide.import-packing-list.goal': 'Başqa yerdə olan hazır siyahını bir anda baqaj elementlərinə çevirin.',
  'help.guide.import-packing-list.step.1':
    'Siyahının üstündəki panelin sağ ucunda aşağı oxlu ikona, yəni «İdxal et» düyməsinə klikləyin.',
  'help.guide.import-packing-list.step.2':
    'Hər sətirdə bir element: Kateqoriya, Ad, qramla çəki (istəyə bağlı), Çanta (istəyə bağlı), checked/unchecked (istəyə bağlı). Xanadakı boz nümunə dörd formatın hamısını göstərir, sol kənardakı rəqəmlər isə yazdığınız sətirləri sayır. Markdown siyahısı da olar: başlıq siyahının adı olur, "- [ ]" və "- [x]" isə elementə çevrilir.',
  'help.guide.import-packing-list.step.3':
    'Və ya sətirləri pəncərənin aşağı solundakı «CSV/TXT/MD yüklə» ilə fayldan yükləyin. O, .csv, .txt və ya .md faylı qəbul edir və xanadakı hər şeyi əvəz edir.',
  'help.guide.import-packing-list.step.4':
    'Sağ aşağıdakı «3 elementi idxal et» düyməsinə klikləyin. Üzərindəki rəqəm TREK-in başa düşdüyü sətirlərin sayıdır.',
  'help.guide.import-packing-list.result':
    'Hər sətir birinci sahədə adı yazılan siyahıda ayrıca sətrə çevrilir. Əvvəldən olan elementlər dəyişmir.',
  'help.guide.import-packing-list.tip.1':
    'Vergül, nöqtəli vergül və tab sahələri ayırır, qoşa dırnaq isə sahəni bir yerdə saxlayır, ona görə "Köynək, mavi" tək ad kimi qalır. Tək dəyərli sətir sadəcə addır. Öz siyahısı olmayan sətir «Digər»ə düşür. Adın qarşısındakı "3x" miqdarı təyin edir.',
  'help.guide.import-packing-list.tip.2':
    'Dördüncü sahədə adı yazılan çanta səyahətdə hələ yoxdursa, TREK onu yaradır. Çox elementə birdəfəlik çəki və çanta əlavə etməyin iki yolu var: «İdxal et» və «Şablonu tətbiq et».',
  // export-packing-list
  'help.guide.export-packing-list.title': 'Baqaj siyahısını çap edin və ya ixrac edin',
  'help.guide.export-packing-list.goal':
    'Siyahını çap edin, PDF kimi saxlayın və ya başqa tətbiq, yaxud növbəti səyahət üçün fayl kimi ixrac edin.',
  'help.guide.export-packing-list.step.1':
    'Siyahının üstündəki paneldə, «İdxal et»dən dərhal əvvəl gələn yuxarı oxlu ikona, yəni «İxrac et» düyməsinə klikləyin.',
  'help.guide.export-packing-list.step.2':
    '«Markdown yoxlama siyahısı (.md)» və «İdxal üçün CSV (.csv)» siyahını dərhal fayl kimi saxlayır.',
  'help.guide.export-packing-list.step.3':
    '«Çap et və ya PDF kimi saxla» düyməsinə klikləyin. Önizləmə siyahını səhifə kimi göstərir: yuxarıda səyahət, tarixləri və nə qədərinin yığıldığı, sonra hər siyahı kart kimi, hər elementin yanında işarələmək üçün xana.',
  'help.guide.export-packing-list.step.4':
    'Önizləmənin altındakı «Çap et və ya PDF kimi saxla» düyməsinə klikləyin. Brauzer çap pəncərəsini açır: printer seçin və ya faylı saxlamaq üçün «PDF kimi yadda saxla» seçin.',
  'help.guide.export-packing-list.result':
    'Çap nüsxəsində və fayllarda açıq olan görünüş, «Paylaşılan» və ya «Mənim siyahım», miqdarlar, çəkilər və işarələrlə birlikdə olur.',
  'help.guide.export-packing-list.tip.1':
    'CSV, çantalar da daxil olmaqla, «İdxal et» funksiyasının oxuduğu formatdır, ona görə onu öz baqaj şablonunuz kimi istifadə edə bilərsiniz: sadəcə növbəti səyahətə idxal edin.',
  'help.guide.export-packing-list.tip.2':
    'Markdown faylı Obsidian, Notion və ya GitHub-da yoxlama siyahısı kimi açılır və onu «İdxal et» ilə yenidən idxal edə bilərsiniz.',
  // share-packing-item
  'help.guide.share-packing-item.title': 'Elementi kimin görəcəyini və kimin gətirəcəyini təyin etmək',
  'help.guide.share-packing-item.goal':
    'Elementi qrupun ümumi siyahısı, öz siyahınız və onu gətirdiyiniz insanlar arasında köçürün.',
  'help.guide.share-packing-item.step.1':
    'Siyahıların üstündə «Paylaşılan» hamının gördüyü siyahı, «Mənim siyahım» isə sizin şəxsi siyahınızdır. Hər birində elementlərin sayı göstərilir. Öz siyahınıza baxmaq üçün «Mənim siyahım» üzərinə klikləyin.',
  'help.guide.share-packing-item.step.2':
    '«Paylaşılan» bölməsinə qayıdın, sətrin sonundakı üç nöqtəni açın və «Paylaşım» üzərinə klikləyin.',
  'help.guide.share-packing-item.step.3':
    'Üç səviyyə var: «Paylaşılan», qrupda hamıya görünür; «Şəxsi», yalnız siz görürsünüz; və «Paylaşılıb:», burada elementin kimlər üçün olduğunu seçirsiniz.',
  'help.guide.share-packing-item.step.4':
    '«Şəxsi» element yalnız «Mənim siyahım»da olur. Onu tapmaq üçün «Mənim siyahım»a keçin.',
  'help.guide.share-packing-item.step.5':
    '«Paylaşım» bölməsini yenidən açın və «Paylaşılıb:» altında bir adı işarələyin. Element həmin şəxsin siyahısında da görünür, sətirdə isə neçə nəfərlə paylaşıldığını göstərən kiçik nişan yaranır.',
  'help.guide.share-packing-item.result':
    'Element seçdiyiniz səviyyədədir, sətirdə isə onu kimin gətirəcəyi göstərilir.',
  'help.guide.share-packing-item.tip.1':
    'Elementin paylaşımını yalnız onu gətirən şəxs dəyişə bilər. Paylaşdığınız şəxs elementi öz «Mənim siyahım» bölməsində kiçik əl nişanı ilə görür, kursoru nişanın üzərinə apardıqda sizin adınız görünür. O, elementi işarələyə bilər.',
  'help.guide.share-packing-item.tip.2':
    'Başqasının gətirdiyi paylaşılan elementdə üç nöqtə menyusunda «Paylaşım» əvəzinə iki başqa bənd olur: sizi onun yanına əlavə edən «Mən də bunu gətirə bilərəm» və sizin üçün şəxsi nüsxə yaradan «Mənim siyahıma köçür».',
  'help.guide.share-packing-item.tip.3':
    'Yeni elementlərin paylaşımı onları əlavə etdiyiniz görünüşdən asılıdır. «Paylaşılan» görünüşündə əlavə edilənlər hamı ilə paylaşılır. «Mənim siyahım» görünüşündə əlavə edilənlər «Şəxsi» olur, bir şərtlə ki, həmin siyahının bütün elementləri eyni insanlarla paylaşılmasın: belə olduqda yeni element də onlarla paylaşılır.',
  // packing-bags
  'help.guide.packing-bags.title': 'Çantaları çəkin',
  'help.guide.packing-bags.goal':
    'Hər elementə çəki yazın, elementləri çantalara bölün və hər çantanı aviaşirkətin limitindən aşağı saxlayın.',
  'help.guide.packing-bags.step.1': 'Dairədən əvvəlki çəki nişanına klikləyin və elementin çəkisini qramla yazın.',
  'help.guide.packing-bags.step.2': 'Çəkidən sonrakı dairə elementin çantasıdır. Ona klikləyin.',
  'help.guide.packing-bags.step.3':
    'Hələ çanta yoxdursa, «Çanta əlavə et» düyməsini klikləyin, ad yazın və Enter basın. Çanta yaradılır və element ona əlavə olunur.',
  'help.guide.packing-bags.step.4':
    'İlk çanta yarandıqdan sonra siyahıların sağında «Çantalar» kartı görünür. Hər çantada onun adı, kimin daşıdığı, doluluq zolağı, içindəki elementlərin sayı və çəkisi göstərilir. Çantaların altında «Təyin edilməyib» və «Ümumi çəki», onun altında isə «Yığılıb» gəlir: artıq yığılmış çəki və onun payını göstərən nazik zolaq.',
  'help.guide.packing-bags.step.5':
    'Çantanın çəkisinin yanındakı «Limit təyin et» düyməsinə klikləyin və limiti aviaşirkətlərin göstərdiyi kimi kiloqramla yazın.',
  'help.guide.packing-bags.step.6':
    'Çantanın ad sətrinin sonunda, çarpazdan bir az əvvəl olan qırıq xətli artı «Üzvləri təyin et» pəncərəsini açır. Çantanı daşıyan üzvləri işarələyin: onlar artının yanında görünür, kartın aşağısındakı «Hər nəfərə» isə onlardan hər birinin nə daşıdığını sadalayır.',
  'help.guide.packing-bags.result':
    'Sağdakı «Çantalar» kartı hər çantanın çəkisini limitə nisbətən, heç bir çantada olmayanları, hər şəxsin nə daşıdığını və cəmi, onun nə qədərinin yığıldığı ilə birlikdə göstərir.',
  'help.guide.packing-bags.tip.1':
    'Çəki sahəsi, çanta dairəsi və «Çantalar» kartı yalnız administrator «Siyahılar» əlavəsində «Çantaların izlənməsi»ni aktiv etdikdə görünür. Dar pəncərədə çantalar irəliləyiş kartının üstündəki «Çantalar» düyməsi ilə açılır.',
  'help.guide.packing-bags.tip.2':
    'Çantanın çəkisini server bütün üzvlərin elementlərindən, sizin görmədikləriniz də daxil olmaqla, hesablayır, ona görə göstərilən rəqəm çantanın həqiqi çəkisidir.',
  'help.guide.packing-bags.tip.3':
    'Limiti olmayan çanta ən ağır çanta ilə müqayisə olunur, belə ki, zolaqları bir-biri ilə müqayisə edə bilərsiniz. Çantaya limit versəniz, onun zolağı həmin limitə görə ölçülür.',
  // create-todo
  'help.guide.create-todo.title': 'Tapşırıq əlavə edin',
  'help.guide.create-todo.goal': 'Tapşırığı siyahı, prioritet, tarix və məsul şəxslə birlikdə qeyd edin.',
  'help.guide.create-todo.step.1': 'Panelin sağ ucundakı «Yeni tapşırıq əlavə et» düyməsini klikləyin.',
  'help.guide.create-todo.step.2':
    '«Yeni tapşırıq» pəncərəsi kursor başlıqda olmaqla açılır. Adı «Tapşırığın adı» sahəsinə yazın, yadda saxlamaq istədiyiniz hər şeyi isə «Təsvir» bölməsinə əlavə edin.',
  'help.guide.create-todo.step.3':
    '«Siyahı» tapşırığı qruplaşdırır. Birini seçin və ya yanındakı artı ilə kiçik pəncərədə yenisini yaradıb ad verin.',
  'help.guide.create-todo.step.4': '«Prioritet» bölməsində qırmızıdan maviyə dörd düymə var: «Heç biri», P1, P2 və P3.',
  'help.guide.create-todo.step.5':
    '«Siyahı» yanındakı «Son tarix» təqvim açır, «Təyin edilən şəxslər» isə tapşırığı bir nəfərə təyin edir.',
  'help.guide.create-todo.step.6': '«Tapşırıq yarat» düyməsinə klikləyin.',
  'help.guide.create-todo.result':
    'Tapşırıq siyahıda görünür: prioritet, son tarix və siyahı nişan kimi, məsul şəxsin avatarı isə sətrin sonunda. Tapşırıq sağdakı paneldə açılır.',
  'help.guide.create-todo.tip.1': 'Yalnız ad mütləqdir. Qalan hər şeyi sonra sağdakı paneldə doldura bilərsiniz.',
  'help.guide.create-todo.tip.2': 'Yan paneldə siyahı seçilibsə, yeni tapşırıq həmin siyahıda yaranır.',
  'help.guide.create-todo.tip.3': 'Ad sahəsində Enter basdıqda tapşırıq digər sahələrə toxunmadan dərhal yaradılır.',
  // todo-filters
  'help.guide.todo-filters.title': 'Tapşırığı tapın və dəyişin',
  'help.guide.todo-filters.goal':
    'Yalnız indi vacib olan tapşırıqları göstərin, sonra tapdığınız tapşırığı redaktə edin.',
  'help.guide.todo-filters.step.1':
    'Yan paneldə «Tapşırıqlar»: «Hamısı» hələ açıq olan hər şeyi, «Mənim tapşırıqlarım» sizə təyin olunanları, «Vaxtı keçmiş» tarixi ötmüş tapşırıqları, «Hazır» isə tamamlanmış tapşırıqları göstərir. Hər birinin yanında sayı var. «Vaxtı keçmiş» üzərinə klikləyin.',
  'help.guide.todo-filters.step.2':
    '«Siyahılar» altında hər siyahı üçün bir sətir var. Həmin siyahını tamamlanmış tapşırıqlarla birlikdə görmək üçün birini seçin.',
  'help.guide.todo-filters.step.3':
    'Siyahının yuxarısındakı sıralama ekrandakıların qaydasını dəyişir: «Prioritet» P1-i birinci qoyur, «Son tarix» isə ən yaxın son tarixi. Eyni anda bu ikisindən yalnız birini istifadə edə bilərsiniz, ikinci klik isə öz sıranıza qaytarır.',
  'help.guide.todo-filters.step.4': 'Tapşırığı sağdakı paneldə açmaq üçün ona klikləyin.',
  'help.guide.todo-filters.step.5':
    'Lazım olanı dəyişin: ad, «Prioritet», «Siyahı», «Son tarix» və ya «Təyin edilən şəxslər». «Təsvir» mətnini işləyən linklərlə göstərir; redaktə etmək üçün içinə klikləyin. Sonra paneldə aşağıdakı «Dəyişiklikləri yadda saxla» düyməsinə klikləyin. Panelin başlığındakı qutu tapşırığı tamamlanmış kimi işarələyir, «Dəyişiklikləri yadda saxla» yanındakı «Sil» isə onu dərhal silir.',
  'help.guide.todo-filters.result':
    'Siyahıda yalnız istədiyiniz tapşırıqlar qalır, sağdakı paneldə isə seçdiyiniz tapşırığı redaktə edirsiniz.',
  'help.guide.todo-filters.tip.1':
    'Siyahı sətri yalnız açıq tapşırıqları sayır, amma onu seçəndə bitmiş tapşırıqlar da göstərilir. «Hamısı», «Mənim tapşırıqlarım» və «Vaxtı keçmiş» bitmiş tapşırıqları gizlədir; «Hazır» isə yalnız bitmiş tapşırıqları göstərir.',
  'help.guide.todo-filters.tip.2':
    'Sıralamada «Prioritet» və «Son tarix» birlikdə işlədilə bilməz. Onlardan biri yandırılıbsa, sətirləri sürükləyib öz sıranızı qura bilməzsiniz.',

  // ── Screen: trip-costs ────────────────────────────────────────────────────────────────
  'help.ctx.trip-costs.title': 'Xərclər',
  'help.ctx.trip-costs.summary':
    'Səyahətin pulları: hər xərc tarixli jurnalda və ya cədvəldə, kimin daxil etdiyi və kimin borclu olduğu ilə, qəbzdəki valyutada. Sağ sütun hesablaşmaq üçün kimin kimə ödəməli olduğunu göstərir.',
  'help.ctx.trip-costs.bullet.1':
    'Yuxarıdakı panel səyahətin tarixlərini və xərclərin bölüşdürüldüyü səyahətçiləri göstərir. Orada həmçinin «Xərcləri axtarın…», «Filtrlə» (huni), «CSV ixrac et» (endirmə ikonu) və «Siyahı» / «Cədvəl» keçidi var.',
  'help.ctx.trip-costs.bullet.2':
    'Zolağın sağ ucunda «Hesablaş» bütün açıq köçürmələri bir dəfəyə qeyd edir, «Qəbzi skan et» «Süni intellektlə təhlil» əlavəsi şəkilləri oxuya bildikdə xərci fotodan doldurur, «Xərc əlavə et» isə redaktoru açır.',
  'help.ctx.trip-costs.bullet.3':
    'Zolağın altında dörd kart var: «Sizin borcunuz» və «Sizə olan borc» hesablaşmada sizin payınızı göstərir, «Gözləyən məbləğ» qeyd olunmuş, amma hələ ödəyicisi olmayan məbləğdir, «Səyahətin ümumi xərci» isə hər şeyi toplayır, altında «Sizin payınız» və «Siz ödəmisiniz» göstərilir.',
  'help.ctx.trip-costs.bullet.4':
    'Hesab dəftəri günlərə görə qruplaşdırılır, ən yenisi birinci, hər günün başlığında neçə qeyd olduğu və həmin gün nə qədər xərcləndiyi göstərilir. Sətirdə rəngli zolaq kimi kateqoriya, ad, ödəyən şəxslərin hər birinin nə qədər ödədiyi göstərilən nişanlar, altında hər səyahətçinin payı ilə «Bölüşdür» (öz payını ödəyən işarə ilə qeyd olunur), sonra qeyd və məbləğ, bölgü başqalarının sizə və ya sizin başqalarına borcunuz olduğunu bildirdikdə isə «borc verdiniz» və ya «borc aldınız» göstərilir.',
  'help.ctx.trip-costs.bullet.5':
    'Sağ sütunda nəticələr var: «Hesablaş» kimin kimə ödədiyini sadalayır, «Balanslar» hər səyahətçinin artıq və ya əskik ödədiyini göstərir, «Yekun büdcə» səyahətin hər birinə neçəyə başa gəldiyini, «Kateqoriya üzrə» isə pulun nəyə xərcləndiyini göstərir.',
  'help.ctx.trip-costs.bullet.6':
    'Qeydə alınmış ödəniş həmin hesab dəftərində ayrıca sətir kimi görünür, yanında qələm və «Geri qaytar» olur. Xərcin qələmi və zibil qutusu var, zibil qutusu xərci silməzdən əvvəl soruşur. Qəbzləri olan xərcin adının yanında onları açan «Qəbz» nişanı olur.',
  'help.ctx.trip-costs.bullet.7':
    'Paneldəki «Cədvəl» eyni xərcləri kateqoriyaya görə qruplaşdırılmış cədvəl kimi, «Nəfər» və «Gün» sütunları, həmçinin nəfər və gün başına məbləğlə göstərir. Bu zaman «Kateqoriya üzrə» əvəzinə «Xülasə» görünür. «Xərclər» seçdiyiniz görünüşü yadda saxlayır.',
  // add-expense
  'help.guide.add-expense.title': 'Xərc əlavə edin',
  'help.guide.add-expense.goal': 'Nəyin neçəyə başa gəldiyini, kimin ödədiyini və kimlərlə bölüşdürüldüyünü qeyd edin.',
  'help.guide.add-expense.step.1':
    'Panelin sağ ucundakı «Xərc əlavə et» düyməsini klikləyin. Redaktor bugünkü tarixlə, ödəyən kimi siz və bölgüyə artıq hamı daxil edilmiş halda açılır.',
  'help.guide.add-expense.step.2':
    'Xərcin nə üçün olduğunu pəncərənin yuxarısındakı sahəyə yazın. Sahə boş olduqda orada «məs. Şam yeməyi, suvenirlər, yanacaq…» görünür. Bu, xərcin adıdır və adsız xərci yadda saxlamaq olmur.',
  'help.guide.add-expense.step.3':
    'Adın altındakı nişan «Kateqoriya»dır, başqasını seçməyincə «Yemək və içki» olur. Kateqoriyalar on dörd dənədir və dəyişdirilə bilməz. Başlıq seçdiyiniz kateqoriyanın rəngini alır, sətirdəki işarə və «Kateqoriya üzrə» bölməsindəki zolaq da.',
  'help.guide.add-expense.step.4':
    'Qəbzdəki məbləği «Ümumi məbləğ» sahəsinə yazın. Yanındakı «Valyuta» əvvəlcə Xərclərin göstərildiyi valyutaya təyin olunur; onu dəyişsəniz, redaktor çevrilmiş məbləği göstərir. «Gün» əvvəlcə bu günə təyin olunur və xərc siyahıda həmin günün altında qruplaşdırılır.',
  'help.guide.add-expense.step.5':
    '«Kim ödədi?» altında pulu əslində ödəyən şəxsə klikləyin. «Siz» əvvəlcədən seçilib. «Hələ heç kim ödəməyib» məbləği heç kimi borclu etmədən qeydə alır, başlığın yanındakı keçiddəki «Bir neçə nəfər ödədi» isə hesabı bir neçə ödəyici arasında bölür.',
  'help.guide.add-expense.step.6':
    'Aşağıdakı «Bölüşdür» əvvəlcə «Bərabər» rejimindədir: hamı işarələnib və hər kəsin payı adının yanında göstərilir. Belə saxlayın və ya dəyişin. Yadda saxlamaq üçün pəncərənin aşağısındakı «Xərc əlavə et» düyməsinə klikləyin.',
  'help.guide.add-expense.result':
    'Xərc jurnalda öz günü altında görünür və «Səyahətin ümumi xərci» göstəricisinə daxil olur, hesablaşma sütunu isə kimin kimə borclu olduğunu yenidən hesablayır.',
  'help.guide.add-expense.tip.1':
    'Standart dəyərləri dəyişməsəniz, xərc bugünkü tarixlə yazılır, ödəyən siz olursunuz və məbləğ hamı arasında bərabər bölünür: yalnız adı və məbləği doldurmaq lazımdır.',
  'help.guide.add-expense.tip.2':
    'Məbləğin yanındakı ± xərci geri ödənişə çevirir. Mənfi cəm pulun geri qaytarıldığını bildirir və bölgü əks istiqamətdə işləyir.',
  'help.guide.add-expense.tip.3':
    'Pəncərənin aşağısında «Qəbzlər və fakturalar» yanındakı «Əlavə et» şəkil və PDF qəbul edir. Onlar yadda saxladıqda yüklənir, səyahətin «Fayl» bölməsində saxlanır və siyahıda adın yanında «Qəbz» nişanı görünür.',
  // expense-payers
  'help.guide.expense-payers.title': 'Kimin ödədiyini göstərin',
  'help.guide.expense-payers.goal': 'Xərci kimin ödədiyini qeyd edin. Hesablaşmanın ikinci yarısı budur.',
  'help.guide.expense-payers.step.1':
    'Xərci sətrin yanındakı karandaşla açın və «Kim ödədi?» bölməsinə baxın. Başlığın yanındakı keçiddə standart olaraq «Bir nəfər ödədi» seçilib: hər səyahətçi bir çipdir, konturlu çip isə ödəyən şəxsdir. Dəyişmək üçün başqa çipə klikləyin.',
  'help.guide.expense-payers.step.2':
    'Səyahətçilərdən sonrakı qırıq xətli nişan, «Hələ heç kim ödəməyib», məbləği heç kimi borclu etmədən qeydə alır. Xərc yenə də «Səyahətin ümumi xərci»nə daxil olur.',
  'help.guide.expense-payers.step.3':
    'Həmin keçidin digər seçimi, «Bir neçə nəfər ödədi», bütün səyahətçiləri işarələmə qutusu ilə sadalayır və işarələnən hər kəs üçün məbləğ sahəsi açılır. Ödəyənləri işarələyin və hər birinin nə qədər ödədiyini yazın; məbləğlərin cəmi ümumi məbləğə bərabər olmalıdır.',
  'help.guide.expense-payers.step.4':
    'Heç kimin ödəmədiyi xərc sətrində «Tamamlanmayıb» kimi işarələnir və «Gözləyən məbləğ» kartında hesablanır. Bu kart hələ ödəyəni olmayan xərcləri toplayır.',
  'help.guide.expense-payers.result':
    'Kimin ödədiyi pulun kimə qaytarılacağını, bölgü isə kimin ödəyəcəyini müəyyən edir. «Balanslar» bu ikisi arasındakı fərqdir.',
  'help.guide.expense-payers.tip.1':
    '«Kim ödədi?» və «Bölüşdür» bir-birindən asılı deyil: iştirak etmədiyiniz şam yeməyinin pulunu ödəyə, ödəmədiyiniz şam yeməyinin bölgüsünə isə daxil ola bilərsiniz.',
  'help.guide.expense-payers.tip.2':
    'Bir neçə ödəyən olanda məbləğlərin cəmi ümumi məbləğə bərabər olmalıdır. Daha bir ödəyən işarələsəniz, qalan məbləğ özünüz yazmadığınız məbləğlər arasında yenidən bölünür. Məbləğlər uyğun gəlməyənə qədər redaktor cəmin nə qədər olmalı olduğunu göstərir və yadda saxlamır.',
  'help.guide.expense-payers.tip.3':
    'Xərci yenidən «Hələ heç kim ödəməyib» vəziyyətinə qaytarmaq onu silmir: məbləğ «Səyahətin ümumi xərci»ndə qalır, sətir isə «Tamamlanmayıb» olur.',
  // split-expense
  'help.guide.split-expense.title': 'Hesabı səyahətçilər arasında bölüşdürün',
  'help.guide.split-expense.goal':
    'Xərc üçün kimin borclu olduğunu müəyyən edin: hamı bərabər, məbləğə görə və ya qəbzdəki hər mövqe üzrə ayrıca.',
  'help.guide.split-expense.step.1':
    'Xərc redaktorunda «Bölüşdür» bütün səyahətçiləri işarə qutusu ilə sadalayır. Kimisə bu xərcdən çıxarmaq üçün adının işarəsini götürün: ad bozarır, payı ləğv olunur və həmin şəxs bu xərc üzrə heç nə borclu olmur.',
  'help.guide.split-expense.step.2':
    'Başlığın yanındakı keçiddə standart seçim «Bərabər»dir: işarələnmiş hər səyahətçi eyni payı alır və pay adın yanında göstərilir. Siyahının altındakı nişanlar neçə nəfərin bölüşdüyünü və hər payın nə qədər olduğunu göstərir.',
  'help.guide.split-expense.step.3':
    '«Fərdi» payların yerinə məbləğ sahələri qoyur. Hər səyahətçinin borcunu yazın. Aşağıdakı nişan siz yazdıqca yenilənir və «Bölüşdürmə ümumi məbləğə uyğundur» yazılanda yaşıla çevrilir. Məbləğlər ümumi məbləğə uyğun gəlmədikcə yadda saxlamaq olmur.',
  'help.guide.split-expense.step.4':
    '«Qəbz üzrə» qəbzi sətir-sətir bölür: «Element əlavə et», sonra hər sətir üçün ad və qiymət, «Bölüşdürmə:» yanında isə həmin sətri bölüşən səyahətçilər.',
  'help.guide.split-expense.step.5':
    'Sətirlərin altındakı «Fərdi paylar» hər səyahətçinin sonda nə qədər borclu olduğunu, yuxarıdakı «Ümumi məbləğ» isə sətirlərin cəmini göstərir. Pəncərənin aşağısındakı «Yadda saxla» düyməsinə klikləyin.',
  'help.guide.split-expense.result':
    'Bütün balanslar bölgüyə əsasən hesablanır. Bölgü xərclə birlikdə saxlanır, sətrində hər səyahətçinin payı ilə «Bölüşdür» kimi göstərilir və başqa heç nəyi dəyişmədən sonradan dəyişdirilə bilər.',
  'help.guide.split-expense.tip.1':
    'İşarəsini götürdüyünüz səyahətçi yalnız bu xərc üzrə heç nə borclu olmur, qalanlar öz paylarını ödəyir.',
  'help.guide.split-expense.tip.2':
    '«Bərabər» qəpiyinədək dəqiq bölür: artıq qəpik hər xərcdə başqa adama düşür, belə ki, onu həmişə eyni adam ödəmir.',
  'help.guide.split-expense.tip.3':
    '«Qəbz üzrə» rejimində «Ümumi məbləğ» avtomatik hesablanır və sahə boz olur: cəm qəbzdəki sətirlərin cəmidir.',
  'help.guide.split-expense.tip.4':
    'Fərdi bölgünü faizlə də daxil etmək olar: «Payları belə daxil et» seçimini % vəziyyətinə keçirin. Xərcin yadda saxlanması üçün payların cəmi 100 % olmalıdır.',
  // expense-currency
  'help.guide.expense-currency.title': 'Xərci başqa valyutada daxil edin',
  'help.guide.expense-currency.goal': 'Qəbzdəki məbləği yazın, məzənnəni isə TREK yadda saxlayır.',
  'help.guide.expense-currency.step.1':
    '«Xərc əlavə et»i açın. Adı pəncərənin yuxarısına yazın, məbləği isə «Ümumi məbləğ» sahəsinə qəbzdə olduğu kimi daxil edin, çevrilmiş məbləği yox.',
  'help.guide.expense-currency.step.2':
    'Məbləğin yanındakı «Valyuta» siyahısını açın və qəbzdəki valyutanı seçin. Siyahıda TREK-in tanıdığı bütün kodlar var və axtarış etmək olar: üç hərfi yazın.',
  'help.guide.expense-currency.step.3':
    'Sahələrin altında nişanlar sırası görünür: yazdığınız məbləğ və onun hazırkı dəyəri, «cari məzənnə» qeydi ilə. Bu, sadəcə önizləmədir. Yadda saxlanılan dəyər bu deyil.',
  'help.guide.expense-currency.step.4':
    'Pəncərənin aşağısındakı «Xərc əlavə et» düyməsini klikləyin. Məzənnə həmin anda sabitlənir: bu xərc daxil etdiyiniz gündəki dəyərini saxlayır.',
  'help.guide.expense-currency.step.5':
    'Jurnalda sətir adın altında hər iki məbləği göstərir: yazdığınız məbləğ, ox və səyahətin valyutasındakı məbləğ. «Xərclər» bölməsindəki bütün cəmlər, balanslar və hesablaşmalar ikinci məbləğə əsaslanır.',
  'help.guide.expense-currency.result':
    'Xərc yazdığınız məbləği və valyutanı saxlayır. Jurnalda hər ikisi göstərilir, səyahətin cəmləri və balansları isə səyahətin valyutasında hesablanır.',
  'help.guide.expense-currency.tip.1':
    'Məzənnə yadda saxladığınız anda sabitlənir, ona görə bir həftə sonra məzənnə dəyişsə də, bağlanmış borc dəyişmir. Yeni məzənnə yalnız xərcin valyutasını dəyişəndə saxlanılır.',
  'help.guide.expense-currency.tip.2':
    'Tənzimləmələrdəki «Göstərilən valyuta» yalnız məbləğlərin necə göstərildiyini dəyişir. Saxlanılan məbləğlər heç vaxt dəyişmir. Boşdursa, hər səyahət öz valyutasında göstərilir.',
  'help.guide.expense-currency.tip.3':
    'Səyahətin valyutası səyahətin özündə, «Səyahəti redaktə et» bölməsində təyin olunur və bunun üçün «Səyahət məlumatlarını redaktə etmək» icazəsi lazımdır. Valyutanı dəyişsəniz, bütün dondurulmuş məzənnələr yeni valyuta üçün yenidən hesablanır. Məbləğlərin özü çevrilmir.',
  // filter-costs
  'help.guide.filter-costs.title': 'Xərci və ya bir günün xərclərini tapmaq',
  'help.guide.filter-costs.goal': 'Uzun xərc siyahısını süzün ki, yalnız axtardığınız görünsün.',
  'help.guide.filter-costs.step.1':
    'Zolaqdakı «Xərcləri axtarın…» sahəsinə yazın. Siz yazdıqca xərcin adı üzrə axtarış gedir, Esc isə sahəni təmizləyir.',
  'help.guide.filter-costs.step.2':
    'Axtarışın yanındakı huni, «Filtrlə», filtrləri açır. Yuxarıdakı açar jurnala öz baxışınızdır: «Hamısı», ödədiyiniz xərclər üçün «Mənim ödədiklərim» və payınızdan çox ödədiyiniz xərclər üçün «Mənə borcludurlar».',
  'help.guide.filter-costs.step.3':
    '«Kateqoriya» altında on dörd kateqoriyadan birini seçin, yalnız həmin kateqoriyanın xərcləri göstəriləcək. Huni neçə filtrin aktiv olduğunu göstərir.',
  'help.guide.filter-costs.step.4':
    '«Gün» altında xərc olan günlərdən birini seçin. Gün başlıqlarının yerində banner çıxır və həmin günü tam, xərclərinin sayı və cəmi ilə göstərir.',
  'help.guide.filter-costs.step.5':
    'Huninin yanındakı endirmə ikonu, «CSV ixrac et», bütün xərcləri ilkin məbləğ, onun valyutası və çevrilmiş məbləğlə birlikdə fayla saxlayır.',
  'help.guide.filter-costs.result':
    'Filtrləri birləşdirə bilərsiniz; gün qrupları qalan xərclər üçün öz cəmləri ilə yenilənir.',
  'help.guide.filter-costs.tip.1':
    'Qeydə alınmış ödənişlərin adı və kateqoriyası yoxdur, ona görə axtarış və ya kateqoriya filtri onları gizlədir, «Mənə borcludurlar» da. Gün filtri isə onları ödənişin baş verdiyi gün altında saxlayır.',
  'help.guide.filter-costs.tip.2':
    '«CSV ixrac et» ekranda hansı filtr olmasından asılı olmayaraq həmişə bütün xərcləri ixrac edir, hər xərc üçün bir sətir.',
  'help.guide.filter-costs.tip.3':
    'Filtr aktiv olduqda filtr menyusunun aşağısında görünən «Filtrləri sıfırla» hamısını birdən söndürür.',
  // settle-up
  'help.guide.settle-up.title': 'Kimin kimə borclu olduğuna baxın və borcları bağlayın',
  'help.guide.settle-up.goal':
    'Çoxlu ortaq xərci bütün borcları bağlayan ən az sayda köçürməyə çevirin və köçürmələr ediləndə onları qeyd edin.',
  'help.guide.settle-up.step.1':
    'Sağ sütundakı «Hesablaş» kartı bütün borcları bağlayacaq köçürmələri sadalayır: kim kimə ödəyir (ipucunda adları olan iki avatar kimi) və nə qədər. Başlıqdakı rəqəm neçəsinin hələ açıq olduğunu göstərir.',
  'help.guide.settle-up.step.2':
    'Köçürmənin yanındakı «Hesablaş» onu ödənilmiş kimi qeyd edir. Köçürmə kartdan itir, balanslar isə yenilənir.',
  'help.guide.settle-up.step.3':
    'Qeydə alınmış köçürmə jurnalda baş verdiyi günün altında bir sətir kimi görünür: «Ödəniş» qeydi, iki səyahətçi və məbləğ.',
  'help.guide.settle-up.step.4':
    'Həmin sətrin yanındakı qələm ödənişi düzəldir, «Geri qaytar» isə onu ləğv edir və köçürmə yenidən «Hesablaş» kartına qayıdır.',
  'help.guide.settle-up.step.5':
    'Kartın başlığındakı «Ödəniş əlavə et» təklifə uyğun olmayan köçürməni qeyd edir. «Kimdən» və «Hara», məbləği, valyutasını və baş verdiyi günü seçin, istəsəniz necə ödənildiyi kimi «Qeyd» əlavə edin, sonra pəncərənin aşağısındakı «Ödəniş əlavə et» düyməsinə klikləyin.',
  'help.guide.settle-up.step.6':
    'Yuxarıdakı zolaqda olan «Hesablaş» bütün açıq köçürmələri soruşmadan bir dəfəyə qeyd edir, məsələn, qrup səyahətin sonunda bütün borcları bağladıqda.',
  'help.guide.settle-up.result':
    'Qeyd olunan hər köçürmə jurnalda bir sətir olur və «Hesablaş» kartından bir sətri silir. Kartda «Hamının hesabı bağlanıb» yazılanda səyahətin bütün hesabları ödənmiş olur.',
  'help.guide.settle-up.tip.1':
    'Kart hər borcu deyil, ən az sayda köçürməni göstərir: üç nəfər bir-birinə dairəvi borcludursa, bu, bir və ya iki ödənişə endirilir.',
  'help.guide.settle-up.tip.2':
    '«Hesablaş» yalnız köçürməni qeydə alır, pul göndərmir. Adi ödəniş üsulunuzla ödəyin, sonra «Hesablaş» düyməsinə klikləyin.',
  'help.guide.settle-up.tip.3':
    'Ödənişi istənilən valyutada etmək olar, yəni yen borcunu avro ilə qaytarmaq tamamilə normaldır: pəncərənin öz valyuta seçimi var və o məzənnə də dondurulur.',
  // final-budget
  'help.guide.final-budget.title': 'Səyahətin hər səyahətçiyə neçəyə başa gəldiyini görmək',
  'help.guide.final-budget.goal': 'Hər şəxs üzrə rəqəmlərə baxın: bugünkü balans və adambaşına real xərc.',
  'help.guide.final-budget.step.1':
    '«Balanslar» hər səyahətçinin vəziyyətini göstərir: səyahət ona borcludursa, sağa yaşıl zolaq, o səyahətə borcludursa, sola qırmızı zolaq, adın yanında isə məbləğ.',
  'help.guide.final-budget.step.2':
    'Altındakı «Yekun büdcə» başqa suala cavab verir: indi kimin nə qədər borclu olduğuna yox, hər şey qaytarıldıqdan sonra səyahətin hər səyahətçiyə neçəyə başa gəldiyinə.',
  'help.guide.final-budget.step.3':
    'Hesablamanı görmək üçün ada klikləyin: «Ödənilmiş xərclər», altında isə «Xalis geri ödənişlər» və «Gözləyən geri ödənişlər».',
  'help.guide.final-budget.step.4':
    'Üç sətrin altında hər səyahətçinin adı ilə bir siyahı var və o sətri təşkil edən sətirləri göstərir: həmin səyahətçinin ödədiyi xərclər, artıq qeydə alınmış köçürmələr və hələ açıq köçürmələr. Hər siyahının cəmi eyni adlı sətrə tam bərabərdir.',
  'help.guide.final-budget.result':
    '«Balanslar» hazırda kimin pul alacağını, kimin borclu olduğunu göstərir. «Yekun büdcə» isə hər şey qaytarılandan sonra səyahətin hər birinizə neçəyə başa gəldiyini göstərir.',
  'help.guide.final-budget.tip.1':
    'Ödənişi qeydə almaq heç kimin yekun büdcəsini dəyişmir. O, sadəcə məbləği gözləyən geri ödənişlərdən xalis geri ödənişlərə keçirir.',
  'help.guide.final-budget.tip.2':
    'Ödəyəni olmayan xərc hesablaşma təkliflərinə daxil edilmədiyi kimi, hər iki karta da daxil edilmir.',
  // expense-from-booking
  'help.guide.expense-from-booking.title': 'Rezervasiyanı xərcə çevirmək',
  'help.guide.expense-from-booking.goal': 'Uçuşun, otelin və ya məkanın real xərcini aid olduğu qeydə bağlayın.',
  'help.guide.expense-from-booking.step.1':
    'Rezervasiyanı «Nəqliyyat» və ya «Rezervasiyalar» vərəqində tapın və kartının yuxarısındakı qələmə klikləyin.',
  'help.guide.expense-from-booking.step.2':
    'Formanın sonuna yaxın «Xərclər» bölməsinə qədər sürüşdürün. Orada əvvəlcə rezervasiyanı yadda saxlayan «Xərc yarat» və artıq Xərclərdə olan xərc üçün «Mövcud xərci əlaqələndir» var.',
  'help.guide.expense-from-booking.step.3':
    '«Xərc yarat» düyməsinə klikləyin. Rezervasiya yadda saxlanır, forma bağlanır və xərc redaktoru açılır: ad olaraq rezervasiyanın başlığı, növünə uyğun kateqoriya, xərcin günü olaraq isə rezervasiyanın günü.',
  'help.guide.expense-from-booking.step.4':
    'Məbləği və valyutasını, kimin ödədiyini və bölgünü istənilən xərcdə olduğu kimi doldurun və «Xərc əlavə et» düyməsinə klikləyin. Rezervasiyanı yenidən açanda xərc «Əlaqəli xərclər» altında görünür: redaktə üçün karandaş, əlaqəni silib xərci saxlamaq üçün «Əlaqəni sil, xərci saxla» və silmək üçün zibil qutusu.',
  'help.guide.expense-from-booking.result':
    'Rezervasiyada onun xərci görünür, xərc isə «Xərclər» bölməsində ödəyəni, bölgüsü və valyutası olan, digərləri kimi adi sətirdir.',
  'help.guide.expense-from-booking.tip.1':
    'Rezervasiyanı silmək ona bağlı xərcləri də silir, təsdiq sualı da bunu bildirir. Rezervasiyanın «Xərclər» blokundakı «Xərci sil» əksini edir: xərci silir, rezervasiyanı saxlayır. «Əlaqəni sil, xərci saxla» hər ikisini saxlayır.',
  'help.guide.expense-from-booking.tip.2':
    'Məkanın formasında da eyni blok var; orada «Xərc yarat» əvvəlcə məkanı yadda saxlayır.',
  // costs-table
  'help.guide.costs-table.title': 'Xərcləri cədvəldə planlaşdırmaq',
  'help.guide.costs-table.goal':
    'Xərclərə kateqoriyalar üzrə sıralanmış, nəfər və gün başına hesablanmış cədvəl kimi baxın və onları dəyişin.',
  'help.guide.costs-table.step.1':
    'Zolaqdakı «Siyahı / Cədvəl» açarının ikinci ikonu olan «Cədvəl» üzərinə klikləyin. Jurnalın yerində eyni xərclərin cədvəli açılır, axtarış və filtrlər ona da tətbiq olunur.',
  'help.guide.costs-table.step.2':
    'Cədvəl kateqoriyalara görə qruplaşdırılır. Hər qrupun başlığında adı, neçə xərci olduğu və aralıq cəmi göstərilir; qrupu yığmaq üçün başlığa klikləyin. Sütunlar: «Ad», «Tarix», «Ümumi», «Nəfər» və «Gün», sonra boz fonda onlardan hesablanan «Nəfər başına», «Gün başına» və «Nəfər/gün». Aşağıdakı «Ümumi» sətri hamısını toplayır.',
  'help.guide.costs-table.step.3':
    'Xananı birbaşa dəyişmək üçün ona klikləyin: ad, cəm, «Nəfər» və ya «Gün». Yazın, sonra saxlamaq üçün Enter basın və ya başqa yerə klikləyin, ləğv etmək üçün Esc basın; tarix xanası təqvimi açır. «Nəfər başına» və digər hesablanan sütunlar dərhal yenilənir.',
  'help.guide.costs-table.step.4':
    'Kilidli cəmi burada dəyişmək olmaz: onu kimsə ödəyib və ya o başqa valyutada daxil edilib, hansı olduğunu ipucu deyir. Ona klikləyəndə əvəzində xərc açılır ki, balanslar və sabitlənmiş məzənnə düzgün qalsın.',
  'help.guide.costs-table.step.5':
    'Kateqoriyanın sonundakı «Xərc əlavə et» ona «Yeni qeyd» adlı sətir əlavə edir, tarixi isə həmin kateqoriyadakı ən son qeydin tarixi olur. Ad xanası artıq açıqdır, adı dəyişə bilərsiniz. Cəmi də eyni qaydada daxil edin.',
  'help.guide.costs-table.step.6':
    'Bu görünüşdə sağ sütun «Kateqoriya üzrə» əvəzinə «Xülasə» göstərir. O, xərcləri dörd cür toplayır: «Kateqoriya», «Gün», «Ödəyən» (ödənilməmişlər üçün «Hələ ödəyən yoxdur») və «Vəziyyət» («Ödənilib» və «Açıq» qarşılaşdırılır).',
  'help.guide.costs-table.result':
    'Hər xərc öz kateqoriyasında adambaşına və gün başına məbləği ilə göstərilir. Xanada cəmi dəyişdikdə yuxarıdakı kartlar və «Xülasə» dərhal yenilənir.',
  'help.guide.costs-table.tip.1':
    '«Xərclər» görünüşü bu brauzerdə yadda saxlayır: siz yenidən «Siyahı» düyməsinə klikləyənədək cədvəl açılır.',
  'help.guide.costs-table.tip.2':
    '«Fərdi» və ya «Qəbz üzrə» bölüşdürülmüş xərcdə hər nəfərin vahid payı olmur, ona görə «Nəfər başına» və «Nəfər/gün» xanaları boş qalır.',
  'help.guide.costs-table.tip.3':
    'Ödəyənləri, bölgünü, qeydi və qəbzləri xərcin özündə redaktə edirsiniz: sətrin sonundakı «Daha çox seçim» içində «Redaktə et» və sətri silmək üçün «Sil» var.',

  // ── Screen: trip-files ────────────────────────────────────────────────────────────────
  'help.ctx.trip-files.title': 'Fayllar',
  'help.ctx.trip-files.summary':
    'Səyahətin bütün sənədləri bir siyahıda: biletlər, təsdiq məktubları, talonlar və şəkillər. Hər birinə qeyd yazmaq, onu aid olduğu məkana və ya rezervasiyaya bağlamaq olar, silinənləri isə zibil qutusundan bərpa etmək mümkündür.',
  'help.ctx.trip-files.bullet.1':
    'Paneldən aşağıdakı qırıq xətli qutu, «Faylları buraya sürükləyib buraxın», üzərinə atdığınız faylları qəbul edir. Ona klik fayl seçicisini açır. Qutuda bu TREK-in qəbul etdiyi fayl növləri və hər fayl üçün limit (administrator başqa limit təyin etməyibsə, maksimum 50 MB) göstərilir.',
  'help.ctx.trip-files.bullet.2':
    'Yuxarıdakı paneldə «Fayl» və filtr tabları var: «Hamısı», «PDF-lər», «Şəkillər» və «Sənədlər», hər birinin yanında sayı. Hər hansı fayl ulduzlananda «Hamısı» tabından sonra ulduz tabı, qeydə əlavə qoşulanda isə sonda «Əməkdaşlıq qeydləri» tabı görünür.',
  'help.ctx.trip-files.bullet.3':
    'Sətirdə miniatür və ya faylın növü, faylı kimin yüklədiyi, adı, altındakı qeyd, ölçüsü və tarixi, həmçinin hər əlaqə üçün bir nişan göstərilir: adı ilə məkan, rezervasiya və ya nəqliyyat (kursoru üzərinə gətirsəniz, «Günlük plan», «Rezervasiya» və ya «Nəqliyyat» yazılır) və «Əməkdaşlıq qeydlərindən».',
  'help.ctx.trip-files.bullet.4':
    'Sətrin sonunda beşə qədər işarə var, kursoru üzərinə gətirdikdə hər birinin adı görünür: «Ulduzla», «Təyin et» (qələm), «Açıq», «Endir» və «Sil». «Sil» soruşmur: fayl zibil qutusuna düşür, oradan onu bərpa edə bilərsiniz. Oflayn olduqda qeyd, əlaqə, ulduz və zibil qutusu yenə işləyir və TREK yenidən onlayn olduqda göndərilir; yalnız yükləmə və əlavə əlaqəni silmək üçün bağlantı lazımdır.',
  'help.ctx.trip-files.bullet.5':
    'Şəkil və ya video tam ekranda, ox düymələri və miniatür zolağı ilə açılır. Digər bütün sənədlər pəncərədə açılır: yuxarıda adı, altında isə «Yeni tabda aç» və «Endir». Wallet kartı dərhal endirilir.',
  'help.ctx.trip-files.bullet.6':
    'Zolağın sağ ucundakı zibil qutusu ikonu («Zibil qutusu») siyahını silinmiş fayllara keçirir. Orada hər faylı bərpa edə və ya həmişəlik silə bilərsiniz, zolaqdakı «Zibil qutusunu boşalt» isə hamısını silir. Səyahət sənəd saxlama xidmətinə qoşulubsa, yaxud xidmət aktiv edilən kimi səyahətin sahibi və administrator üçün, zibil qutusu ikonunun solunda «Sənəd sinxronizasiyası» görünür.',
  // files-upload
  'help.guide.files-upload.title': 'Səyahətə sənəd əlavə edin',
  'help.guide.files-upload.goal':
    'Bileti, təsdiqi və ya fotonu endirmələr qovluğundan səyahətə yükləyin ki, səyahətdəki hər kəs onu aça bilsin.',
  'help.guide.files-upload.step.1':
    'Səyahəti açın və bölmələr panelində «Fayllar» üzərinə klikləyin. Səyahətin sənədləri orada sıralanır, üstündə isə yükləmə sahəsi var.',
  'help.guide.files-upload.step.2':
    '«Faylları buraya sürükləyib buraxın» sahəsinə klikləyin və bir və ya bir neçə fayl seçin. Onlar bir-birinin ardınca yüklənir, bu müddətdə qutuda «Yüklənir...» yazılır. Qutunun içində, «və ya seçmək üçün klikləyin» altında bu TREK-in qəbul etdiyi fayl növlərini və faylın maksimum ölçüsünü görürsünüz.',
  'help.guide.files-upload.step.3':
    'Son faylın yüklənməsi bitəndə onun üçün «Faylı təyin et» avtomatik açılır (səyahətdə məkan və ya rezervasiya varsa), dialoqun yuxarısında faylın adı olur. «Qeyd» altındakı «Qeyd əlavə edin...» sahəsi fayla qeyd əlavə edir, onun altındakı siyahılar isə faylı məkana və ya rezervasiyaya bağlayır. Dialoqu yuxarı sağdakı × ilə bağlayın; bağlasanız da heç nə itmir.',
  'help.guide.files-upload.step.4':
    'Yeni fayllar siyahının yuxarısında görünür, onlardan yuxarıda yalnız ulduzlu fayllar olur. Sətirdə faylı kimin yüklədiyi, adı, ölçüsü və tarixi göstərilir. Şəkil üçün miniatür çıxır, qalan fayllarda isə növü göstərilir.',
  'help.guide.files-upload.result':
    'Sənədlər səyahətə əlavə olunub və səyahəti görə bilən hər kəs onları aça və endirə bilər.',
  'help.guide.files-upload.tip.1':
    'Faylı iş masasından birbaşa xananın üzərinə də sürükləyə bilərsiniz. Fayl xananın üzərində olduqca xana vurğulanır.',
  'help.guide.files-upload.tip.2':
    'Mübadilə buferindəki şəkli siyahıya əlavə etmək üçün Ctrl+V basın; beləcə rezervasiyanın ekran görüntüsünü əvvəlcə ayrıca saxlamağa ehtiyac qalmır.',
  'help.guide.files-upload.tip.3':
    'Yükləmək üçün fayl yükləmə hüququ lazımdır; bu hüquq olmadıqda qutu ümumiyyətlə görünmür. Siyahıda olmayan fayl növü mesajla rədd edilir və heç nə yüklənmir. Limiti aşan fayl (administrator başqa limit təyin etməyibsə, 50 MB) heç nə göndərilmədən rədd edilir və mesajda limit göstərilir. Yükləmək üçün internet bağlantısı da lazımdır: oflayn olduqda TREK bunu bildirir və heç nə yükləmir.',
  // files-link
  'help.guide.files-link.title': 'Sənədi məkana və ya rezervasiyaya bağlamaq',
  'help.guide.files-link.goal': 'Bileti təkcə bu siyahıdan yox, aid olduğu gündən də asan tapın.',
  'help.guide.files-link.step.1':
    'Sətrin sonundakı qələmə («Təyin et») klikləyin. «Faylı təyin et» açılır, dialoqun yuxarısında faylın adı olur.',
  'help.guide.files-link.step.2':
    '«Qeyd» altında «Qeyd əlavə edin...» sahəsinə bir sətir yazmaq olar, o, siyahıda faylın adının altında görünür. Enter basanda və ya sahədən çıxanda yadda saxlanılır.',
  'help.guide.files-link.step.3':
    'Solda, «Məkan» altında səyahətin məkanları günlərə görə tarixləri ilə qruplaşdırılıb, heç bir günə düşməyən məkanlar isə sonda «Təyin edilməyib» altındadır. İşarələmək üçün birinə klikləyin.',
  'help.guide.files-link.step.4':
    'Sağda, «Rezervasiya» və «Nəqliyyat» altında səyahətin rezervasiyaları var. Sənədin aid olduğu rezervasiyaya klikləyin, onun da yanında işarə görünəcək.',
  'help.guide.files-link.step.5':
    'Yuxarı sağdakı × ilə bağlayın. Burada yadda saxla düyməsi yoxdur: hər klik dərhal yadda saxlanılıb.',
  'help.guide.files-link.result':
    'Sətirdə qeyd və hər əlaqə üçün bir nişan görünür: biri məkanın adı ilə, biri uçuşun adı ilə. Nişanın üzərinə gələndə «Günlük plan» və ya «Nəqliyyat» yazılır. Sənəd həm də məkana və uçuşa əlavə olunur.',
  'help.guide.files-link.tip.1':
    'Faylı eyni anda bir neçə yerə bağlamaq olar, yəni eyni təsdiq məktubu həm otel rezervasiyasına, həm də otelin məkanına aid ola bilər.',
  'help.guide.files-link.tip.2':
    'Həmin əlaqəni silmək üçün işarələnmiş bəndə yenidən klikləyin; faylın özü qalır. Oflayn olduqda qeyd və yeni işarələr saxlanır və TREK yenidən onlayn olduqda göndərilir; yalnız başqa əlaqəni silmək üçün bağlantı lazımdır.',
  'help.guide.files-link.tip.3':
    'Əks istiqamətdə də işləyir: məkana və ya rezervasiyaya əlavə edilmiş sənəd də bu siyahıda, sətrində eyni nişanla görünür.',
  // files-star
  'help.guide.files-star.title': 'Vacib sənədləri yuxarıda saxlamaq',
  'help.guide.files-star.goal':
    'Həqiqətən lazım olacaq bir neçə sənədi işarələyin ki, uzun siyahıda onları tez tapasınız.',
  'help.guide.files-star.step.1':
    'Sətrin sonundakı ulduza («Ulduzla») klikləyin. Ulduz qızılı rəngə boyanır, faylın adının qarşısında ikinci ulduz çıxır, düymənin üzərinə gələndə isə artıq «Ulduzu sil» yazılır.',
  'help.guide.files-star.step.2':
    'Siyahı yenidən sıralanır: ulduzlu fayllar bütün digər fayllardan yuxarıda durur, hər qrupda ən yenisi birinci gəlir.',
  'help.guide.files-star.step.3':
    'İndi paneldəki filtr tablarında, düz «Hamısı»ndan sonra ulduz görünür, yanında ulduzlu faylların sayı. Yalnız həmin faylları görmək üçün ona klikləyin.',
  'help.guide.files-star.result':
    'Ulduzlu fayllar siyahının yuxarısında göstərilir, ayrıca bölmədə isə yalnız ulduzlu fayllar görünür.',
  'help.guide.files-star.tip.1':
    'Ulduz tabı yalnız ulduzlanmış fayl olduqda görünür. Son faylın ulduzunu götürsəniz, tab yox olur.',
  'help.guide.files-star.tip.2':
    'Ulduz qoymaq üçün «Təyin et» ilə eyni icazə, yəni «Fayl metaməlumatlarını redaktə etmək» lazımdır. Bu icazəsi olmayan üzv ulduzları görür, amma «Ulduzla» düyməsinə klikləməsi heç nəyi dəyişmir.',
  // files-filter
  'help.guide.files-filter.title': 'Siyahıda sənəd tapmaq',
  'help.guide.files-filter.goal': 'Yalnız axtardığınız növ sənədləri göstərin.',
  'help.guide.files-filter.step.1':
    'Filtr tabları yuxarıdakı paneldə, «Fayl» yanındadır: «Hamısı», «PDF-lər», «Şəkillər» və «Sənədlər», hər birinin yanında fayl sayı.',
  'help.guide.files-filter.step.2': '«PDF-lər» üzərinə klikləyin: siyahıda yalnız PDF faylları qalır.',
  'help.guide.files-filter.step.3':
    'Daha iki bölmə yalnız səyahətdə uyğun fayllar olanda görünür. «Əməkdaşlıq qeydləri» üzərinə klikləyin: bu bölmə Collab bölməsindəki qeydə fayl əlavə olunan kimi görünür və siyahıda yalnız həmin faylları göstərir. Ulduz bölməsi də eyni qaydada, hansısa fayl ulduzlananda görünür.',
  'help.guide.files-filter.step.4': '«Hamısı» bütün siyahını geri qaytarır.',
  'help.guide.files-filter.result':
    'Siyahıda yalnız seçilmiş tabın faylları göstərilir, hər tabdakı say isə onların neçə olduğunu bildirir.',
  'help.guide.files-filter.tip.1':
    'Burada qovluq yoxdur və faylların adını dəyişmək olmur. Sənədləri bir-birindən ayırmaq üçün «Faylı təyin et» pəncərəsindəki qeyddən, məkan və rezervasiyalarla əlaqələrdən və ulduzdan istifadə edin.',
  'help.guide.files-filter.tip.2':
    'Siyahı həmişə əvvəlcə ulduzlu fayllara, sonra ən yenilərə görə sıralanır. Bu gün yüklənən sənəd keçən ayın sənədindən yuxarıda durur.',
  // files-preview
  'help.guide.files-preview.title': 'Sənədi TREK-dən çıxmadan oxuyun',
  'help.guide.files-preview.goal': 'Biletə və ya şəklə dərhal baxın, lazım olanda onu cihazınıza endirin.',
  'help.guide.files-preview.step.1':
    'Şəklin adına və ya miniatürünə klikləyin. O, tam ekranda açılır, yuxarı solda faylın adı və şəkillər arasında sırası göstərilir. Video da eyni qaydada açılır və orada oynadılır.',
  'help.guide.files-preview.step.2':
    'Siyahıda hazırda görünən bütün şəkillər arasında keçmək üçün kənarlardakı dairəvi oxlardan, sol və sağ ox düymələrindən və ya aşağıdakı miniatür zolağından istifadə edin.',
  'help.guide.files-preview.step.3':
    '«Yeni tabda aç» və «Endir» yuxarı sağda, × yanındakı dairəvi düymələrdir. Şəkli bağlamaq üçün × işarəsinə klikləyin, Escape düyməsini basın və ya tünd fona klikləyin.',
  'help.guide.files-preview.step.4':
    'Şəkil olmayan sənəd isə pəncərədə açılır: yuxarıda adı, altında «Yeni tabda aç» və «Endir» düymələri, PDF üçün isə aşağıda səhifənin özü. Yuxarı sağdakı ×, Escape və ya pəncərədən kənara klik onu bağlayır.',
  'help.guide.files-preview.step.5': 'Sətrin sonundakı ox («Endir») faylı əvvəlcə açmadan birbaşa cihazınıza yükləyir.',
  'help.guide.files-preview.result':
    'Sənəd ekranda açılır, həmin iki düymə isə onu brauzer tabında açır və ya diskinizə saxlayır.',
  'help.guide.files-preview.tip.1': 'Toxunma ekranında oxlara klikləmək əvəzinə şəkilləri barmağınızla sürüşdürün.',
  'help.guide.files-preview.tip.2':
    'Wallet kartı heç vaxt önizləmədə açılmır. O dərhal endirilir ki, telefon onu pulqabı tətbiqində aça bilsin.',
  'help.guide.files-preview.tip.3':
    '«Yeni tabda aç» və «Endir» faylı sizin sessiyanızla yükləyir, ona görə ünvan sətrindən kopyalanmış link başqa heç kimdə işləmir.',
  // files-trash
  'help.guide.files-trash.title': 'Sənədi silmək və bərpa etmək',
  'help.guide.files-trash.goal': 'Səyahətə artıq lazım olmayanları silin, hələ lazım olan faylları isə bərpa edin.',
  'help.guide.files-trash.step.1':
    'Sətrin sonundakı zibil qutusuna («Sil») klikləyin. Fayl dərhal siyahıdan çıxır və «Zibil qutusuna köçürüldü» mesajı görünür. Təsdiq sualı verilmir.',
  'help.guide.files-trash.step.2':
    'Zolağın sağ ucundakı zibil qutusu ikonu («Zibil qutusu») siyahını silinmiş fayllara keçirir. Zolağın başlığında «Zibil qutusu» yazılır, filtr tabları və yükləmə xanası gizlənir.',
  'help.guide.files-trash.step.3':
    'Zibil qutusundakı sətir boz rəngdə olur və orada iki ikon var: faylı geri qaytaran «Bərpa et» və təsdiqdən sonra onu birdəfəlik silən «Sil».',
  'help.guide.files-trash.step.4':
    '«Bərpa et» düyməsinə klikləyin. «Fayl bərpa edildi» mesajı görünür və fayl zibil qutusundan çıxır. Onun qeydi və əlaqələri saxlanılır.',
  'help.guide.files-trash.step.5':
    'Paneldə zibil qutusu ikonunun yanındakı «Zibil qutusunu boşalt» zibil qutusunda qalan hər şeyi həmişəlik silir. Brauzer bundan əvvəl bir dəfə təsdiq istəyir. Zibil qutusu ikonu sizi yenidən fayllara qaytarır.',
  'help.guide.files-trash.result': 'Fayl siyahıda əvvəlki yerinə qayıdır.',
  'help.guide.files-trash.tip.1':
    'Sətirdəki «Sil» əvvəlcə soruşmur. Zibil qutusu buna görə var: burada silməyənə qədər TREK-dən heç nə silinmir. Bunların hamısı oflayn da işləyir və TREK yenidən onlayn olduqda göndərilir.',
  'help.guide.files-trash.tip.2':
    'Faylı silmək və bərpa etmək üçün fayl silmə hüququ lazımdır. Bu hüququ olmayan üzv nə sətirdəki «Sil» düyməsini, nə də zibil qutusundakı düymələri görür.',
  'help.guide.files-trash.tip.3': 'Zibil qutusundan həmişəlik silinmiş faylı geri qaytarmaq olmur.',
  // files-sync
  'help.guide.files-sync.title': 'Sənədləri sənəd saxlama xidmətinizlə sinxronlaşdırın',
  'help.guide.files-sync.goal':
    'Səyahəti öz sənəd anbarınıza qoşun ki, burada yüklədiyiniz fayllar orada saxlanılsın, orada saxladığınız fayllar isə burada görünsün.',
  'help.guide.files-sync.step.1':
    'Panelin sağ ucunda, zibil qutusu ikonunun yanındakı «Sənəd sinxronizasiyası» düyməsinə klikləyin. Başlığının altında səyahətin adı olan pəncərə açılır. Solda, «Provayder qoş» altında administratorun yandırdığı anbarlar sadalanır, hər birinin yanında faylları necə saxladığını bildirən bir sətir: Paperless-ngx və Papra etiketlə, Nextcloud və Synology Drive qovluqda, OpenCloud isə iş sahəsində. Sağda «Hələ heç nə qoşulmayıb» yazılır.',
  'help.guide.files-sync.step.2':
    'Saxlama xidmətinizə, bu nümunədə Nextcloud-a klikləyin. Qoşulma üçün kiçik pəncərə açılır. Orada xidmətin adı yazılır və həmin xidmət üçün lazım olan giriş məlumatları soruşulur.',
  'help.guide.files-sync.step.3':
    '«Ünvan» sahəsini və anbarın öz giriş məlumatlarını doldurun: Paperless-ngx üçün «API tokeni», Papra üçün «API açarı» və «Təşkilat ID-si», Nextcloud üçün «İstifadəçi adı» və «Tətbiq parolu», OpenCloud üçün «İstifadəçi adı» və «Tətbiq tokeni», Synology Drive üçün isə «İstifadəçi adı», «Parol» və hesab tələb edirsə, «İki faktorlu doğrulama kodu». Anbar tətbiq parolu və ya tokeni təklif edirsə, həmişə ondan istifadə edin, heç vaxt hesab parolunuzdan yox. Nextcloud və Synology Drive həmçinin istəyə bağlı «Əsas qovluq» qəbul edir; TREK səyahət qovluqlarını orada axtarır, bu nümunədə /Reisen. Aşağıdakı «Öz-özünə imzalanmış sertifikatı qəbul et» yalnız öz şəbəkənizdə belə sertifikatla işləyən anbar üçündür.',
  'help.guide.files-sync.step.4':
    '«Bağlantını yoxla» düyməsini klikləyin. TREK yazdığınız məlumatlarla yaddaşa qoşulur və alt hissədə əlaqənin qurulduğu, ardınca da hansı hesabla daxil olunduğu yazılır. Giriş məlumatları rədd edilsə və ya ünvana çatmaq mümkün olmasa, alt hissədə bu göstərilir. Hər iki halda heç nə yadda saxlanılmır.',
  'help.guide.files-sync.step.5':
    '«Qoşul» düyməsinə klikləyin. Bağlantı səyahətlə birlikdə yadda saxlanılır və TREK səyahətin sənədlərinin anbarda harada olmalı olduğunu soruşur: onları saxlayan etiket, qovluq və ya sahə. Yalnız oradakılar sinxronlaşdırılır. «Yenisini yarat» «Yarat» düyməsinə kliklədikdə səyahətin adından götürülmüş adla yenisini yaradır. «Və ya mövcud olanlardan istifadə et» altında mövcud olanları görürsünüz. Birinə klikləyin, burada «Yaponiyada payız» qovluğuna.',
  'help.guide.files-sync.step.6':
    'Pəncərə yenidən açılır: saxlama xidmətiniz solda «Bu səyahət» altında görünür, sağdakı kartında isə hara sinxronlaşdırdığı, axırıncı dəfə nə vaxt işlədiyi və «İndi sinxronlaşdır» göstərilir. İlk sinxronlaşdırma avtomatik başlayır, istədiyiniz vaxt yenisini başlatmaq üçün «İndi sinxronlaşdır» düyməsinə klikləyin. Sinxronlaşdırmadan sonra adın yanındakı «Hələ sinxronlaşdırılmayıb» nişanının yerində yaşıl nöqtə çıxır, üzərinə gələndə «Sinxronlaşdırılıb» yazılır. Axın zolağı TREK-də və xidmətdə neçə sənəd olduğunu göstərir, aralarında «Saxlama xidmətinə» və «Saxlama xidmətindən» istiqamətləri var. Pəncərəni sağ yuxarıdakı × ilə bağlayın.',
  'help.guide.files-sync.result':
    'Anbarda əvvəldən olan sənədlər siyahının yuxarısında sizin adınızla yüklənmiş kimi görünür, səyahətin bütün sənədləri isə, «Əməkdaşlıq qeydləri»ndəkilər istisna olmaqla, anbarda da olur. Bundan sonra TREK anbarı arxa fonda yoxlayır, siyahıdakı dəyişikliklər isə anbara köçürülür.',
  'help.guide.files-sync.tip.1':
    'Səyahəti yalnız onun sahibi və ya instansiya administratoru qoşa bilər, çünki giriş məlumatları anbardakı bütün hesaba çıxış verir. Səyahət qoşulandan sonra hər üzv «Sənəd sinxronizasiyası»nı görür, onu aça, kartı oxuya və «İndi sinxronlaşdır» düyməsini basa bilər.',
  'help.guide.files-sync.tip.2':
    'Öz şəbəkənizdəki saxlama xidməti üçün TREK serverində ALLOW_INTERNAL_NETWORK=true olmalıdır, xidmətin ünvanı isə localhost yox, cihazın şəbəkədəki ünvanı olmalıdır. Əks halda «Bağlantını yoxla» «Bu ünvana icazə verilmir.» cavabını verir.',
  'help.guide.files-sync.tip.3':
    '«İndi sinxronlaşdır» yanındakı ikon, «Bağlantını kəs», bir dəfə təsdiq istəyir. Sonra bağlantını bitirir və bütün sənədləri hər iki tərəfdə saxlayır. Etiketi, qovluğu və ya sahəni ikinci dəfə qoşsanız, TREK onu yeni kimi qəbul edir və içindəki hər şeyi yenidən idxal edir. Ona görə bağlantını kəsdikdən sonra köhnəsini yox, boş birini qoşun.',
  // ── Screen: trip-collab ───────────────────────────────────────────────────────────────
  'help.ctx.trip-collab.title': 'Collab', // same-as-en
  'help.ctx.trip-collab.summary':
    'Qrupun birlikdə planlaşdırdığı bölmə beş kartdan ibarətdir: solda çat, yanında «Qeydlər» və «Linklər», onların altında «Sorğular» və «Növbədə nə var». Burada yazılan hər şey səhifəni yeniləmədən dərhal digər üzvlərin ekranında görünür.',
  'help.ctx.trip-collab.bullet.1':
    'Çat soldakı kartdır. «Mesaj yazın...» sahəsinə yazıb Enter basın, yeni sətir üçün Shift və Enter basın. Smaylik emoji əlavə edir, «Şəkillər əlavə et» isə mesaja dörd şəklə qədər qoşur.',
  'help.ctx.trip-collab.bullet.2':
    'Kursoru mesajın üzərinə gətirin, «Cavab ver», öz mesajlarınızda isə «Sil» də görünəcək; səkkiz sürətli reaksiya üçün mesaja sağ klikləyin. Silinmiş mesajın yerində onu kimin sildiyini bildirən qeyd qalır.',
  'help.ctx.trip-collab.bullet.3':
    '«Qeydlər» ortaq qeydlər bölməsidir: başlıqdakı «Yeni qeyd» qeyd yaradır, yanındakı dişli çarx isə kateqoriyaların ad və rəngləri üçün «Kateqoriyaları idarə et» pəncərəsini açır. Kateqoriyalar yarandıqdan sonra başlığın altındakı düymələr kartları süzür: «Hamısı» və ya bir kateqoriya. Qeyd kartında kateqoriya rəngli nöqtə, link isə dairəvi düymə kimi göstərilir, üç nöqtədə («Daha çox seçim») isə «Genişləndir», «Bərkit», «Redaktə et» və «Sil» var.',
  'help.ctx.trip-collab.bullet.4':
    '«Linklər» səyahət üçün veb ünvanları toplayır. «Link əlavə et» başlıq və http və ya https ünvanı tələb edir. «Linki redaktə et», «Linki bərkit» və «Linki sil» çipin sonundadır, bərkidilmiş linklər isə öndə qalır.',
  'help.ctx.trip-collab.bullet.5':
    'Qərar vermək üçün sorğulardan istifadə edin. «Yeni sorğu» ən azı iki variantlı sual yaradır. Səs vermək üçün variantlardan birinə klikləyin. Sorğu başlığının sağındakı kilid («Bağla») və zibil qutusu («Sil») səsverməni bitirir və ya sorğunu silir.',
  'help.ctx.trip-collab.bullet.6':
    '«Növbədə nə var» səyahətin hələ qarşıda olan dayanacaqlarını, ən çoxu səkkizini, vaxtları və iştirakçıları ilə sadalayır. O, yalnız gün planını oxuyur; vaxtlar orada təyin olunur.',
  // write-note
  'help.guide.write-note.title': 'Ortaq qeyd yazmaq',
  'help.guide.write-note.goal':
    'Bütün qrupa lazım olanı, məsələn, qaydanı, ünvanı və ya xatırlatmanı hər kəsin tapa biləcəyi yerə yazın.',
  'help.guide.write-note.step.1':
    '«Qeydlər» kartının başlığında «Yeni qeyd» düyməsinə klikləyin. Qeyd pəncərəsi açılır, kursor artıq başlıq sahəsində olur.',
  'help.guide.write-note.step.2':
    'Başlığı pəncərənin yuxarısında, «Qeydin başlığı» yazılan yerə yazın. Yeganə məcburi sahə budur: başlığa nəsə yazılmayınca «Yarat» boz qalır, başlıqda Enter basanda isə qeyd dərhal yaradılır.',
  'help.guide.write-note.step.3':
    '«Məzmun» mətni saxlayır və Markdown dəstəkləyir: qalın söz, siyahı, başlıq. Kart ilk üç sətri göstərir, menyusundakı «Genişləndir» isə qeydi tam açır.',
  'help.guide.write-note.step.4':
    '«Kateqoriya» altında qeydin aid olduğu kateqoriyanı seçin. Onun rəngi indi pəncərənin, sonra isə kartın başlığında istifadə olunur. İlk kateqoriya artıq seçilib. Düymələr mövcud kateqoriyalardır, yenisini isə «Kateqoriyaları idarə et» bölməsində yaradırsınız. Səyahətdə hələ kateqoriya yoxdursa, bu sətir görünmür.',
  'help.guide.write-note.step.5':
    '«Veb-sayt» xanasına qeydə aid link yazılır. Sonra kartın yuxarısında onu açan dairəvi link düyməsi görünür.',
  'help.guide.write-note.step.6':
    '«Yarat» düyməsinə klikləyin. Dialoqu yalnız «Ləğv et» və onun xaçı bağlayır, ona görə kənara klikləsəniz və ya Esc bassanız, yazdıqlarınız itmir.',
  'help.guide.write-note.result':
    'Qeyd «Qeydlər» panelində yuxarısı kateqoriyanın rəngində olan kart kimi görünür və digər üzvlər onu dərhal görür.',
  'help.guide.write-note.tip.1':
    'Kartdakı üç nöqtə («Daha çox seçim») «Genişləndir», «Bərkit», «Redaktə et» və «Sil» seçimlərini açır. «Bərkit» qeydi öz rəngində çərçivə ilə panelin yuxarısında saxlayır. Digər qeydlər son dəyişiklik vaxtına görə sıralanır.',
  'help.guide.write-note.tip.2':
    '«Yeni qeyd» yanındakı dişli çarx «Kateqoriyaları idarə et» pəncərəsini açır. Orada kateqoriyaya rəng verə, adını hər yerdə birdən dəyişə və ya heç bir qeyd istifadə etməzdən əvvəl yeni kateqoriya əlavə edə bilərsiniz. «Yadda saxla» düyməsinə klikləməyincə heç nə dəyişmir.',
  'help.guide.write-note.tip.3':
    'Səyahətə fayl yükləmək hüququnuz varsa, «Fayllar əlavə et» qeydə sənəd əlavə edir. «Əlavə et» fayl seçicisini açır, pəncərəyə şəkil və ya PDF də yapışdıra bilərsiniz.',
  'help.guide.write-note.tip.4':
    'Qeydlərin «Əlavələr» bölməsində, Collab altında öz açarı var: administrator onu söndürüb çatı, linkləri, sorğuları və «Növbədə nə var» bölməsini işlək saxlaya bilər.',
  // shared-links
  'help.guide.shared-links.title': 'Səyahətin linklərini toplamaq',
  'help.guide.shared-links.goal':
    'Rezervasiya portalını, ortaq albomu və hərəkət cədvəlini bir yerdə saxlayın ki, onları çatda axtarmalı olmayasınız.',
  'help.guide.shared-links.step.1':
    '«Linklər» kartının başlığındakı «Link əlavə et» düyməsinə klikləyin. Dialoq açılır, kursor yuxarıdakı sahədə olur.',
  'help.guide.shared-links.step.2':
    'Adı «Linkin başlığı» sahəsinə yazın, ünvanı onun altındakı «Link» sahəsinə yapışdırın, sonra «Linki yadda saxla» düyməsini klikləyin.',
  'help.guide.shared-links.step.3':
    'Çipdə ad və linkin apardığı sayt göstərilir. Səhifəni yeni tabda açmaq üçün ona klikləyin.',
  'help.guide.shared-links.step.4':
    'Sonundakı üç dairəvi düymə «Linki redaktə et», «Linki bərkit» və «Linki sil» düymələridir. «Linki bərkit» çipi panelin əvvəlinə keçirir və vurğu rəngində göstərir. «Linki sil» əvvəlcə təsdiq istəyir, çünki link bütün üzvlər üçün silinir.',
  'help.guide.shared-links.result':
    'Link «Linklər» panelində önə bərkidilmiş çip kimi görünür və dərhal bütün üzvlərin ekranında çıxır.',
  'help.guide.shared-links.tip.1':
    'Yalnız http və ya https ünvanı qəbul olunur. Qalan hər şey rədd edilir və pəncərə yazdığınızla birlikdə açıq qalır.',
  'help.guide.shared-links.tip.2':
    'Əvvəlcə bərkidilmiş linklər, sonra ən yeniləri gəlir. Başlığın yanındakı kiçik ikon saytın öz faviconudur və saytın özündən yüklənir, ona görə internet olmayanda nişanda adi link ikonu görünür.',
  'help.guide.shared-links.tip.3':
    '«Linklər» «Əlavələr» bölməsində, «Əməkdaşlıq» altında ayrıca keçiddir, ona görə administrator tabın qalan hissəsinə toxunmadan paneli söndürə bilər.',
  // create-poll
  'help.guide.create-poll.title': 'Qrupdan soruşmaq',
  'help.guide.create-poll.goal': 'Çatda heç kimin cavab vermədiyi sualı hər kəsin səs verə biləcəyi sorğuya çevirin.',
  'help.guide.create-poll.step.1': '«Sorğular» kartının başlığında «Yeni sorğu» düyməsinə klikləyin. Pəncərə açılır.',
  'help.guide.create-poll.step.2':
    'Sualı «Sual» altına yazın. Xananın altındakı «Markdown dəstəklənir» o deməkdir ki, burada qalın mətn, sətir keçidi və ya qısa siyahı işləyir.',
  'help.guide.create-poll.step.3':
    '«Seçimlər» altında «Seçim 1» və «Seçim 2» sahələrini doldurun. Ən azı iki boş olmayan seçim lazımdır, bir seçim bir neçə sətirdən ibarət ola bilər.',
  'help.guide.create-poll.step.4':
    'Onların altındakı «Seçim əlavə et» üçüncü, dördüncü, lazım olduğu qədər variant əlavə edir. İkidən çox variant olanda sətrin yanında görünən kiçik xaç həmin variantı silir.',
  'help.guide.create-poll.step.5':
    '«Çoxseçimli» hər kəsə birdən çox variant seçməyə imkan verir. Söndürülübsə, kimsə başqa variant seçəndə onun səsi yeni varianta keçir.',
  'help.guide.create-poll.step.6': '«Sorğu yarat» düyməsini klikləyin.',
  'help.guide.create-poll.result':
    'Sorğu «Sorğular» panelinin yuxarısında açıq vəziyyətdə görünür, başlığında 0 səs yazılıb.',
  'help.guide.create-poll.tip.1': 'Sual Markdown kimi göstərilir, variantlar isə adi mətn olaraq qalır.',
  'help.guide.create-poll.tip.2': 'Sual və mətni olan ən azı iki seçim olmayınca «Sorğu yarat» boz qalır.',
  'help.guide.create-poll.tip.3':
    'Son tarixi yalnız telefon tətbiqində təyin etmək olar. Son tarixi olan sorğu başlığındakı kəhrəba rəngli çipdə qalan vaxtı göstərir və vaxt bitəndə bağlanır.',
  'help.guide.create-poll.tip.4':
    '«Sorğular»ın «Əlavələr» bölməsində, Collab altında öz açarı var: administrator onu söndürüb qalan dörd paneli aktiv saxlaya bilər.',
  // vote-poll
  'help.guide.vote-poll.title': 'Səs vermək və nəticəni oxumaq',
  'help.guide.vote-poll.goal': 'Səs verin, qrupun nəticələrini görün və səsinizi dəyişin.',
  'help.guide.vote-poll.step.1':
    'İstədiyiniz variantın üzərinə klikləyin. Onun dairəsində işarə görünür, variant aksent rəngində çərçivə alır və arxasındakı zolaq böyüyür.',
  'help.guide.vote-poll.step.2':
    'İndi bütün nəticəni görürsünüz: zolaq payı, sağdakı rəqəm faizi göstərir, kiçik dairələr isə həmin variantı seçənlərdir, ən çoxu üç nəfər.',
  'help.guide.vote-poll.step.3':
    'Fikrinizi dəyişdiniz? Başqa seçimə klikləyin. «Çoxseçimli» olmayan sorğuda ikinci səs əlavə olunmur, səsiniz yeni seçimə keçir.',
  'help.guide.vote-poll.step.4':
    'Səslərin sayı sualın altındakı çipdə göstərilir. Artıq seçdiyiniz seçimə klikləsəniz, səsiniz geri götürülür və say azalır.',
  'help.guide.vote-poll.result':
    'Seçdiyiniz variant işarələnir, zolaqlar qrupun necə səs verdiyini, dairələr isə kimin hansı variantı seçdiyini göstərir.',
  'help.guide.vote-poll.tip.1':
    'Faizlər və kimin nəyə səs verdiyi yalnız özünüz səs verdikdən və ya sorğu bağlandıqdan sonra görünür. Başlıqdakı səs sayını isə hər kəs görür.',
  'help.guide.vote-poll.tip.2':
    'Səsvermə heç vaxt anonim deyil: kimin səs verdiyini görmək üçün kursoru variantdakı dairələrdən birinin üzərinə gətirin.',
  // close-poll
  'help.guide.close-poll.title': 'Sorğunu bağlamaq və ya silmək',
  'help.guide.close-poll.goal': 'Qrup qərar verəndə səsverməni dayandırın, artıq lazım olmayan sorğunu isə silin.',
  'help.guide.close-poll.step.1':
    'Sorğu başlığının sağındakı kilid, yəni «Bağla», səsverməni bitirir. Bundan sonra seçimlərə klikləmək olmur.',
  'help.guide.close-poll.step.2':
    'Bağlanmış sorğu panelin aşağısına keçir, yuxarıda açıq sorğular varsa, «Bağlanıb» başlığı altında. Onda «Bağlanıb» nişanı olur və səs versin-verməsin hər kəsə nəticəni göstərir. Qalib seçim yaşıl zolaqda qalın şriftlə yazılır; o, sizin seçiminizdirsə, zolaq bunun əvəzinə vurğu rənginizdə olur.',
  'help.guide.close-poll.step.3':
    'Başlığın sağındakı zibil qutusu, yəni «Sil», sorğunu silir. Bağlanmış sorğuda bu, yeganə düymədir, çünki kilid artıq yoxdur. Təsdiq soruşulmur, səslər də silinir.',
  'help.guide.close-poll.result':
    'Silinmiş sorğu bütün üzvlərin panelindən yox olur. Sadəcə bağlanmış sorğu isə nəticəsi ilə birlikdə aşağıda görünməyə davam edir.',
  'help.guide.close-poll.tip.1':
    'Bağlamanı geri qaytarmaq olmur: sorğunu yenidən açmaq mümkün deyil. Təsadüfən bağlanmış sorğunu yenidən yaratmaq lazımdır.',
  'help.guide.close-poll.tip.2': '«Sil» sorğunu və bütün səsləri hamı üçün dərhal və təsdiq soruşmadan silir.',
  // whats-next
  'help.guide.whats-next.title': '«Növbədə nə var» bölməsini oxumaq',
  'help.guide.whats-next.goal': 'Planı açmadan qrupun növbəti addımını görün.',
  'help.guide.whats-next.step.1':
    'Kart səyahətin qarşıdakı dayanacaqlarını, səkkizədək, vaxt sırası ilə və hər gün üçün ayrıca başlıq altında sadalayır: «Bu gün», «Sabah» və ya tarix, günün adı varsa, yanında o da yazılır. Kartın başlığında neçə dayanacaq olduğu göstərilir.',
  'help.guide.whats-next.step.2':
    'Hər dayanacağın solunda onun vaxtı göstərilir: başlanğıc vaxtı, dayanacağın bitmə vaxtı varsa, ondan sonra bitmə vaxtı, vaxt hələ təyin edilməyibsə, TBD.',
  'help.guide.whats-next.step.3':
    'Onun yanında ad, ünvan və həmin dayanacaqdakı insanlar nişan şəklində göstərilir. Dayanacağa heç kim təyin olunmayıbsa, səyahətdəki hər kəs göstərilir.',
  'help.guide.whats-next.result':
    'Qarşıda olanların yalnız oxumaq üçün siyahısı: plana uyğun yenilənir, buradakı heç nə isə planı dəyişmir.',
  'help.guide.whats-next.tip.1':
    'Burada heç nə təyin etmirsiniz. Vaxtlar gün planından gəlir, onları orada dəyişəndə bu siyahı dərhal yenilənir.',
  'help.guide.whats-next.tip.2':
    'Yalnız hələ qarşıda olanlar sadalanır: dayanacaq başlama vaxtı keçdikdən sonra siyahıdan çıxır, bu günün vaxtsız dayanacağı gün bitənə qədər qalır, səyahətin sonunda isə panel boş olur.',
  'help.guide.whats-next.tip.3':
    '«Növbədə nə var» üçün «Əlavələr» bölməsində, Collab-ın altında ayrıca açar var. Bu, masaüstü paneldir: telefon tətbiqindəki Collab bölməsində görünmür.',
  // trip-chat
  'help.guide.trip-chat.title': 'Qrupla yazışın',
  'help.guide.trip-chat.goal':
    'Mesaj göndərin, konkret mesaja cavab verin, başqa mesaja reaksiya bildirin və öz mesajınızı silin.',
  'help.guide.trip-chat.step.1':
    '«Mesaj yazın...» xanasına yazın və Enter düyməsini basın. Xananın yanındakı dairəvi ox da eyni işi görür. Shift və Enter isə yeni sətir açır.',
  'help.guide.trip-chat.step.2':
    'Smaylik ikonu Smileys, Reactions və Travel bölmələri olan emoji seçimini açır. Seçdiyiniz emoji yazdığınız mətnə əlavə olunur, ayrıca göndərilmir.',
  'help.guide.trip-chat.step.3':
    'Kursoru başqasının mesajının üzərinə aparın: küncündə kiçik dairəvi düymə görünür. Bu, «Cavab ver» düyməsidir.',
  'help.guide.trip-chat.step.4':
    'Cavab verdiyiniz mesaj yazı sahəsinin üstündə sitat kimi görünür. Mesajınızı yazıb göndərin, sitat da onunla birlikdə göndərilir. Sitatı silmək üçün onun üzərindəki xaça klikləyin.',
  'help.guide.trip-chat.step.5':
    'Səkkiz sürətli reaksiyanı görmək üçün mesaja sağ klikləyin. Reaksiyanız mesajın altında görünür. Silmək üçün eyni reaksiyaya yenidən klikləyin.',
  'help.guide.trip-chat.step.6':
    'Öz mesajlarınızda «Cavab ver» yanında «Sil», yəni zibil qutusu ikonu var. Mesaj dərhal silinir və onun yerində sildiyinizi bildirən qeyd qalır. Bunu geri qaytarmaq olmur.',
  'help.guide.trip-chat.result':
    'Cavabınız ən yeni mesaj olur, yuxarısında isə sitat gətirdiyiniz mesaj görünür. Reaksiyanız digər mesajın altında görünür. Sildiyiniz mesajın yerində onu sizin sildiyinizi bildirən qeyd qalır.',
  'help.guide.trip-chat.tip.1':
    'Enter göndərir, Shift və Enter yeni sətir açır. Yalnız birdən üçədək emojidən ibarət mesaj böyük göstərilir.',
  'help.guide.trip-chat.tip.2':
    '«Şəkillər əlavə et» ilə bir mesaja dörd şəklə qədər əlavə edə bilərsiniz. Şəkilləri xanaya yapışdırmaq və ya sürüşdürüb atmaq da olar.',
  'help.guide.trip-chat.tip.3':
    'Link olan mesajın altında öz TREK-inizin yüklədiyi önizləmə kartı görünür, ona görə yalnız sizin aça bildiyiniz ünvana aparan link adi link kimi qalır.',
  'help.guide.trip-chat.tip.4':
    '«Çat»ın «Əlavələr» bölməsində, «Collab» altında öz açarı var: administrator onu söndürüb qeydləri, linkləri, sorğuları və «Növbədə nə var» bölməsini aktiv saxlaya bilər.',

  // ── Screen: trip-roadtrip ─────────────────────────────────────────────────────────────
  'help.ctx.trip-roadtrip.title': 'Avtomobil səyahəti',
  'help.ctx.trip-roadtrip.summary':
    'Plan bir bütöv yol kimi: eyni günlər və eyni məkanlar aralarındakı sürüşlə birlikdə dayanacaqlar kimi bağlanır, sol sütundakı lentdə və xəritədə göstərilir. Məsafəni və sürüş vaxtını, harada yanacaq doldurmalı olduğunuzu və yol boyu nələrin olduğunu görürsünüz.',
  'help.ctx.trip-roadtrip.bullet.1':
    'Sol sütunun yuxarısındakı «Gün» və «Avtomobil səyahəti» günlük plan ilə yol arasında keçid edir. Heç nə kopyalanmır və heç nə dəyişmir: «Gün» planı tam olduğu kimi göstərir.',
  'help.ctx.trip-roadtrip.bullet.2':
    'Zolağın yuxarısında səyahətin cəmləri göstərilir: «Məsafə», «Sürmə vaxtı» və «Dayanacaqlar». Altında yolu olan hər gün üçün bir kart var: xanada günün nömrəsi və tarixi, sonra kilometrləri və sürmə vaxtı, dayanacaqlarının sayı, keçdiyi yerlər üçün nişanlar və iz nişanı. Rezerv etdiyiniz uçuş, qatar və ya bərə ardıcıllıqda ayrıca kart kimi görünür.',
  'help.ctx.trip-roadtrip.bullet.3':
    'Nömrəli dayanacaq günün məqsədi olan yerdir. Yanacaq, şarj və ya istirahət yeri kimi yol üstü dayanacaqda nömrə əvəzinə növünün işarəsi göstərilir və o, sayılmır. Bunu dəyişmək üçün nömrəyə, nə qədər qalacağınızı təyin etmək üçün dayanma nişanına klikləyin, dayanacağı günün içində və ya başqa günə köçürmək üçün isə onu sürükləyin.',
  'help.ctx.trip-roadtrip.bullet.4':
    'İki dayanacaq arasındakı yol zolağı hissənin məsafəsini və vaxtını göstərir. «Bu hissə üçün alternativ yollar» üçün ona klikləyin və ya hissəni ara nöqtədən keçirmək üçün xəritədəki marşruta klikləyin.',
  'help.ctx.trip-roadtrip.bullet.5':
    'Sağ sütun «Marşrut boyunca» olur: bir sətirdə nəyi axtaracağınızı və günü, sonra dəhlizin enini seçin və «Axtar» düyməsinə klikləyin. Nəticədəki artı, «Əlavə et», onu yolda əslində keçdiyiniz nöqtəyə əlavə edir, oteldəki çarpayı işarəsi isə gecələmə əlavə edir. «Əl ilə» axtarışın tapmadığı yeri əlavə edir, başlığın yanındakı üç nöqtə isə Google Maps marşrutunu idxal edir.',
  'help.ctx.trip-roadtrip.bullet.6':
    'Altındakı «Sürmə tənzimləmələri»ndə limitlər, avtomobil və onun yürüş məsafəsi, gündəlik yol vaxtları, nədən qaçılacağı, xəttin necə çəkildiyi və cari xəbərdarlıqların xəritədə göstərilib göstərilməməsi var. Bunlar səyahətə aiddir, ona görə hamı eyni avtomobillə planlaşdırır.',
  // roadtrip-mode
  'help.guide.roadtrip-mode.title': 'Səyahətə vahid avtomobil yolu kimi baxın',
  'help.guide.roadtrip-mode.goal': 'Planı avtomobil səyahəti rejiminə keçirin və lentin nə göstərdiyini anlayın.',
  'help.guide.roadtrip-mode.step.1':
    'Sol sütunun yuxarısındakı «Gün» və «Avtomobil səyahəti» keçidində «Avtomobil səyahəti» seçiminə klikləyin. Gün planının yerinə yol göstərilir, xəritədə isə marşrutu olan bütün günlər görünür.',
  'help.guide.roadtrip-mode.step.2':
    'Zolağın yuxarısındakı kart bütün səyahəti yekunlaşdırır: «Məsafə», «Sürmə vaxtı» və «Dayanacaqlar». Günləri sürüşdürdükdə o, yerində qalır.',
  'help.guide.roadtrip-mode.step.3':
    'Altında yolu olan hər gün üçün bir kart var; yolu olmayan gün göstərilmir. Kartın başlığında günün nömrəsi, altında tarixi, sonra yolun məsafəsi və vaxtı, həmin günün dayanacaqlarının sayı üçün nişanlar göstərilir.',
  'help.guide.roadtrip-mode.step.4':
    'Kartın içində gün ardıcıllıq kimi göstərilir: hər yer üçün nömrəli dayanacaq, hər cütün arasında yol hissəsi, sağ kənarda isə çatma vaxtı. Rezerv etdiyiniz uçuş, qatar və ya bərə ardıcıllıqda ayrıca kart kimi görünür.',
  'help.guide.roadtrip-mode.step.5':
    'Günü yığmaq üçün başlığına klikləyin; sonundakı ox fırlanır. Yığılmış gün xəritədə də gizlənir. Yenidən göstərmək üçün başlığa təkrar klikləyin.',
  'help.guide.roadtrip-mode.result':
    'Sol sütunda yol, xəritədə isə onun hər günü göstərilir. «Gün» düyməsi sizi dəyişməmiş plana dərhal qaytarır.',
  'help.guide.roadtrip-mode.tip.1':
    'Seçim hər səyahət üçün hesabınızda saxlanılır. Səhifəni yeniləsəniz də, başqa brauzerdə və ya cihazda açsanız da, səyahət yenə avtomobil səyahəti görünüşündə açılır.',
  'help.guide.roadtrip-mode.tip.2':
    'Bu açar yalnız administrator admin panelində «Əlavələr» bölməsində «Avtomobil səyahəti» əlavəsini yandırandan sonra görünür.',
  'help.guide.roadtrip-mode.tip.3':
    'Telefonda keçid düyməsi yoxdur: əlavə «Plan» yanında öz «Avtomobil səyahəti» tabını əlavə edir.',
  // roadtrip-stops
  'help.guide.roadtrip-stops.title': 'Yoldakı dayanacaqlar və qalma müddəti',
  'help.guide.roadtrip-stops.goal':
    'Yol üstündəki məkanı yolboyu dayanacaq edin və hər dayanacağın nə qədər çəkdiyini təyin edin.',
  'help.guide.roadtrip-stops.step.1':
    'Lentdə dayanacağın qarşısındakı rəqəmə klikləyin. Onun adı «Yolboyu dayanacağa çevir»dir və klikləyəndə altında rəngli dairələr sırası şəklində dayanacaq növləri açılır.',
  'help.guide.roadtrip-stops.step.2':
    'Növ seçin. Dairənin adını görmək üçün kursoru üzərinə aparın: Yaşayış yeri, Yanacaq, Şarj, İstirahət zonası, Düşərgə, Yemək və ya Görməli yerlər. Nömrə həmin növün ikonuna çevrilir, altındakı dayanacaqlar isə yenidən nömrələnir.',
  'help.guide.roadtrip-stops.step.3':
    'Yolüstü dayanacaq təyinat yeri sayılmır, ona görə günün başlığında dayanacaqların sayı bir az göstərilir.',
  'help.guide.roadtrip-stops.step.4':
    'İkona, yəni «Dayanacağın növünü dəyiş» düyməsinə yenidən klikləyin və dayanacağa nömrəsini qaytarmaq üçün «Yenidən təyinat yeri et» seçin.',
  'help.guide.roadtrip-stops.step.5':
    'Hər dayanacağın dayanma nişanı var, heç nə planlaşdırılmadıqca orada artı göstərilir. «Bu dayanacaqda qalma müddəti»ni açmaq üçün ona klikləyin.',
  'help.guide.roadtrip-stops.step.6':
    'Müddəti sürgü, mənfi və artı düymələri və ya hazır variantlardan biri ilə təyin edin. «Yola düşmə» dəyişir, «Çatma» isə avtomobilin çatdığı vaxtda qalır. Sonra «Yadda saxla» düyməsinə klikləyin.',
  'help.guide.roadtrip-stops.result':
    'Dəyişdiyiniz dayanacağın «Dayanacaq» nişanında yeni müddət görünür və ondan sonrakı bütün çatma vaxtları buna uyğun sürüşür. Başqa növə keçirib geri qaytardığınız dayanacaq yenidən nömrəli təyinat nöqtəsi olur.',
  'help.guide.roadtrip-stops.tip.1':
    'Qalma müddəti bir ziyarətə yox, məkana aiddir: iki gündə planlaşdırılmış məkanın qalma müddəti hər iki gündə eynidir.',
  'help.guide.roadtrip-stops.tip.2':
    'Yolboyu dayanacaqlar «Gün» bölməsində də görünür. «Sürmə tənzimləmələri»ndə «Xidmət dayanacaqları» altında «Günlər bölməsində də göstər» seçimini söndürsəniz, onlar yalnız «Avtomobil səyahəti»ndə qalır.',
  'help.guide.roadtrip-stops.tip.3': 'Eyni pəncərədəki «Qalma yoxdur» müddəti yenidən silir.',
  'help.guide.roadtrip-stops.tip.4':
    'Yolüstü dayanacağa və ya rezerv olunmuş gecəyə klikləsəniz, kartı xəritənin üzərində açılır. «Avtomobil səyahəti» aktivdirsə, oradakı «Redaktə et» məkan forması əvəzinə axtarışın istifadə etdiyi yığcam pəncərəni açır, həmin pəncərədəki «Daha çox təfərrüat» isə tam formanı açır.',
  // roadtrip-corridor
  'help.guide.roadtrip-corridor.title': 'Marşrut boyunca yanacaq, yemək və gecələmə yeri tapın',
  'help.guide.roadtrip-corridor.goal':
    'Əslində sürdüyünüz yol boyunca axtarın və tapdığınızı düzgün hissəyə əlavə edin.',
  'help.guide.roadtrip-corridor.step.1':
    '«Axtarılanlar» altında siyahını açın və lazım olanları işarələyin. «Yanacaq», «Şarj», «İstirahət zonası», «Düşərgə», «Yaşayış yeri», «Yemək» və «Görməli yerlər» birlikdə seçilə bilər: siyahı növbəti seçim üçün açıq qalır, xanada isə hər növ üçün ikon görünür.',
  'help.guide.roadtrip-corridor.step.2':
    'Günü həmin sətrin sonundakı açılan siyahıdan seçin. Orada lentdə kartı olan günlər var, «Axtar» isə seçdiyiniz günün marşrutu hesablanana qədər gözləyir.',
  'help.guide.roadtrip-corridor.step.3':
    '«Məsafə» altında yolun hər iki tərəfində nə qədər məsafədə axtarılacağını seçin: 2 km, 5 km və ya 10 km. Sonra «Axtar» düyməsini klikləyin.',
  'help.guide.roadtrip-corridor.step.4':
    'Nəticələr növlərə görə qruplaşdırılır, keçəcəyiniz ardıcıllıqla göstərilir. Hər birində marşrutdan nə qədər uzaq olduğu və günün yolunun hansı məsafəsində yerləşdiyi göstərilir.',
  'help.guide.roadtrip-corridor.step.5':
    'Nəticədəki artıya, «Əlavə et»ə klikləyin. «Dayanacaq kimi əlavə et» onun hansı günə və hansı mövqeyə əlavə olunacağını göstərir və «Dayanacağın növü» ilə «Bu dayanacaqda qalma müddəti»ni soruşur; şarj məntəqəsində həmçinin «Əlçatanlıq və qiymətlər» göstərilir. «Əlavə et» onu marşruta əlavə edir, «Daha çox təfərrüat» isə bunun əvəzinə tam məkan formasını açır.',
  'help.guide.roadtrip-corridor.result':
    'Əlavə etdiyiniz dayanacaq marşrutda onun yanından keçdiyiniz nöqtədə, öz növünün ikonu ilə görünür. Günün marşrutu dayanacaqdan keçməklə yenidən hesablanır və bu, siyahını təmizləyir: növbəti dayanacaq üçün yenidən axtarın.',
  'help.guide.roadtrip-corridor.tip.1':
    '«Axtar» düyməsinə basmayınca heç nə axtarılmır: bir axtarış ortaq xidmətə çoxlu sorğu göndərir.',
  'help.guide.roadtrip-corridor.tip.2':
    '«Ada görə filtrlə» yeni axtarış etmədən nəticələri filtrləyir, «Nəticələri təmizlə» isə siyahını boşaldır və onun pinlərini silir. Nəticəni xəritədə görmək üçün ona klikləyin.',
  'help.guide.roadtrip-corridor.tip.3':
    'Nəticəni xəritədən marşrutun üzərinə də sürükləyə bilərsiniz. Eyni yolu iki dəfə sürəndə hissəni beləcə özünüz seçirsiniz. «Axtar» yanındakı «Əl ilə» axtarışın tapmadığı məkanı adına görə axtarıb əlavə edir.',
  // roadtrip-via
  'help.guide.roadtrip-via.title': 'Yol hissəsini ara nöqtədən keçirin',
  'help.guide.roadtrip-via.goal': 'Dayanacaq əlavə etmədən hissənin istədiyiniz yoldan keçməsini təmin edin.',
  'help.guide.roadtrip-via.step.1':
    'İstədiyiniz mərhələni xəritədə göstərin: lentdə dayanacağa klikləyin, sonra xəritənin üzərində açılan kartı bağlayın.',
  'help.guide.roadtrip-via.step.2':
    'Çəkilmiş marşruta klikləyin. Kliklədiyiniz mərhələyə ara nöqtə əlavə olunur və mərhələ onun üzərindən yenidən hesablanır.',
  'help.guide.roadtrip-via.step.3':
    'Lent yenilənir: günün başlığında yeni məsafə və sürüş vaxtı görünür, ara nöqtədən sonrakı bütün çatma vaxtları da dəyişir.',
  'help.guide.roadtrip-via.step.4':
    'Nə etdiyini görmək üçün kursoru tutacağın üzərinə gətirin: «Marşrutu dəyişmək üçün sürükləyin, silmək üçün sağ klikləyin». Onu başqa yerə sürükləyin, həmin hissə yeni nöqtədən keçməklə yenidən çəkiləcək.',
  'help.guide.roadtrip-via.step.5': 'Tutacağı silmək üçün ona sağ klikləyin. Hissə yenidən birbaşa marşrutla gedir.',
  'help.guide.roadtrip-via.result':
    'Yol hissəsi seçdiyiniz yolla gedir, günün məsafəsi, sürmə vaxtı və çatma vaxtları yenidən hesablanır.',
  'help.guide.roadtrip-via.tip.1':
    'Ara nöqtə dayanacaq deyil: onun nömrəsi, qalma müddəti və çatma vaxtı yoxdur, günün dayanacaqlarına da daxil edilmir.',
  'help.guide.roadtrip-via.tip.2':
    'Tutacaqlar yalnız 9-cu miqyas səviyyəsindən göstərilir, ona görə bütün səyahəti göstərən xəritədə xətt onlarsız görünür.',
  'help.guide.roadtrip-via.tip.3':
    'Çəkilmiş istənilən mərhələdən iki kilometrdən uzaqda edilən klik, həmçinin uçuş, qatar və ya bərə üzərinə klik nəzərə alınmır.',
  // roadtrip-alternatives
  'help.guide.roadtrip-alternatives.title': 'Hissəni başqa yolla keçməyi sınayın',
  'help.guide.roadtrip-alternatives.goal':
    'Marşrut xidmətinin yolun bir hissəsi üçün təklif etdiyi digər marşrutlara baxın və birini seçin.',
  'help.guide.roadtrip-alternatives.step.1':
    'Yan paneldə yol zolağına, yəni iki dayanacaq arasında hissənin məsafəsini və vaxtını göstərən sətrə klikləyin. Onun yazısı «Digər marşrutlar»dır.',
  'help.guide.roadtrip-alternatives.step.2':
    'Xəritənin üzərində «Bu hissə üçün alternativ yollar» açılır, hər yol üçün uzunluğu ilə bir sətir. Xəritə hər yolu sürmə vaxtı ilə çəkir: hazırkı yolunuz tam mavi, digərləri daha açıq mavi rəngdə.',
  'help.guide.roadtrip-alternatives.step.3':
    'Həmin yolu vurğulamaq üçün kursoru bəndin üzərinə aparın. «Cari» istifadə etdiyiniz yoldur, «Ən sürətli» isə ən tez olanı; digərləri nə qədər yavaş olduqlarını və ya hansı yol sinfindən yan keçdiklərini göstərir.',
  'help.guide.roadtrip-alternatives.step.4':
    'Həmin marşrutu seçmək üçün siyahıdakı bəndə, cari marşrutu saxlamaq üçün isə «Bağla» düyməsinə klikləyin.',
  'help.guide.roadtrip-alternatives.result':
    'Mərhələ artıq seçdiyiniz yolla gedir, yan sütundakı məsafə və sonrakı çatma vaxtları da dəyişir.',
  'help.guide.roadtrip-alternatives.tip.1':
    'Başqa yol seçdikdə TREK onu əvvəlcə avtomobil səyahətinin marşrutlaşdırıcısı ilə yoxlayır. Sonra hissəni mümkün qədər az ara nöqtə ilə həmin yolda saxlayır və hissənin əvvəlki ara nöqtələrini əvəz edir. Marşrutlaşdırıcının izləyə bilmədiyi yol yadda saxlanılmır. Marşrutlaşdırıcının öz yolunu seçsəniz, ara nöqtələr yenidən silinir.',
  'help.guide.roadtrip-alternatives.tip.2':
    '«Avtomagistralsız», «Ödənişli yolsuz» və «Bərəsiz» öz sürət modeli olan ikinci mühərrikdən gəlir, ona görə onların vaxtlarını digərləri ilə müqayisə etmək olmaz.',
  // roadtrip-limits
  'help.guide.roadtrip-limits.title': 'Avtomobili və sürmə limitlərini təyin etmək',
  'help.guide.roadtrip-limits.goal':
    'TREK-ə hansı nəqliyyat vasitəsi sürdüyünüzü və fasiləsiz nə qədər sürmək istədiyinizi bildirin.',
  'help.guide.roadtrip-limits.step.1':
    '«Sürmə tənzimləmələri» sağ sütunda axtarışın altındadır. Onun nişanları nəyin təyin edildiyini göstərir; açmaq üçün ona klikləyin.',
  'help.guide.roadtrip-limits.step.2':
    '«Avtomobil» altında «Bir dəfəyə ən uzun sürmə» və «Günlük sürmə» dəqiqə ilə göstərilir. Boş sahə söndürülmüş deməkdir və heç nə işarələnmir.',
  'help.guide.roadtrip-limits.step.3':
    '«Nəqliyyat vasitəsi» altında nə sürdüyünüzü göstərin. «Benzin» yalnız yanacaqdoldurma məntəqələrində, «Elektrik» yalnız şarj məntəqələrində, «Fərqi yoxdur» isə hər ikisində doldurulur.',
  'help.guide.roadtrip-limits.step.4':
    '«Bir çənlə məsafə» və ya «Bir şarjla məsafə»ni özünüz yazın. Və ya «Doldurma səviyyəsi» altında «Avtomobil göstəricilərindən hesabla»nı açın: o, «Çənin həcmi» və «Sərfiyyat», ya da «Batareya», «Sərfiyyat» və «Batareyanın köhnəlməsi»ni götürüb məsafəni hesablayır.',
  'help.guide.roadtrip-limits.step.5':
    'Sol sütundakı «Mümkün olduqda yayın» qadağa deyil, üstünlükdür: gün üçün başqa yol yoxdursa, həmin yoldan yenə də istifadə olunur və günün başlığında qeyd göstərilir.',
  'help.guide.roadtrip-limits.step.6':
    '«Bağla» düyməsinə klikləyin. Kartdakı nişanlar nəyin təyin edildiyini göstərir, zolaq isə limiti aşan hər hissəni və hər günü işarələyir.',
  'help.guide.roadtrip-limits.result':
    'Kartdakı nişanlar nələrin təyin olunduğunu göstərir, limiti aşan hər hissə və günün də lentdə nişanı olur.',
  'help.guide.roadtrip-limits.tip.1':
    'Tənzimləmələr səyahətə aiddir, ona görə səyahətdəki hər kəs eyni avtomobil və eyni limitlərlə planlaşdırır.',
  'help.guide.roadtrip-limits.tip.2':
    '«Doldurma səviyyəsi» dayanacaqda bakın və ya batareyanın nə qədər doldurulacağını göstərir, çünki yolda heç kim 100 %-ə qədər şarj etmir. Yanacaq və ya şarj dayanacağı bunu öz sətrindəki batareya nişanı ilə dəyişə bilər.',
  'help.guide.roadtrip-limits.tip.3':
    '«Marşrut xətti» altında «Günləri birləşdir» bir günün son dayanacağından növbəti günün ilk dayanacağına qədər yolu da marşrutlaşdırır. «Hər günü yaşayış yerinizdə başladın və bitirin» hər günü həmin gecələr üçün rezerv edilmiş yaşayış yerində başladır və bitirir. «Hər gün üçün ayrı rəng» hər günü öz rəngində göstərir.',
  // roadtrip-day-window
  'help.guide.roadtrip-day-window.title': 'Sürmə günü üçün başlanğıc və bitmə vaxtı təyin edin',
  'help.guide.roadtrip-day-window.goal': 'Seçdiyiniz saatda sürməyi dayandırın və günün harada bitəcəyini təyin edin.',
  'help.guide.roadtrip-day-window.step.1':
    'Sağ sütunda «Sürmə tənzimləmələri»ni açın və pəncərənin sol sütununda «Günlük səyahət vaxtları»nı tapın.',
  'help.guide.roadtrip-day-window.step.2':
    '«Günün başlanma vaxtı»nı təyin edin. Təkbaşına heç nə etmir: altındakı qeyddə deyildiyi kimi, hər iki vaxt lazımdır.',
  'help.guide.roadtrip-day-window.step.3':
    '«Günün bitmə vaxtı»nı təyin edin. Yol indi həmin saatda dayanır və növbəti səhər davam edir. Yan sütunda bu, «Günün sonu» və «Səyahətə davam et» sətirləri kimi görünür.',
  'help.guide.roadtrip-day-window.step.4':
    '«Günü bitir» altında bitmə vaxtında yolda dayanmaq üçün «Marşrut boyunca»nı, növbəti sürüş həmin vaxtı keçəcəksə ondan əvvəl dayanmaq üçün «Son məkanda»nı seçin.',
  'help.guide.roadtrip-day-window.step.5':
    '«Bağla» düyməsinə klikləyin. «Sürmə tənzimləmələri» kartı iki vaxtı nişan kimi göstərir.',
  'help.guide.roadtrip-day-window.result':
    'Yol təyin etdiyiniz uzunluqda səyahət günlərinə bölünür, sığmayan hissə isə sonuncu gündən sonra hesablanmış günlərdə davam edir. Sizin günləriniz və onların məkanları dəyişmir.',
  'help.guide.roadtrip-day-window.tip.1':
    'Vaxtlardan birini silsəniz, bu funksiya yenidən söndürülür. Dayanacaqda özünüz təyin etdiyiniz vaxtlar həmişə üstündür.',
  'help.guide.roadtrip-day-window.tip.2':
    'Günlük səyahət vaxtları təyin olunanda günlər həmişə bir-birinə bağlanır: bir günün son dayanacağından növbəti günün ilk dayanacağına qədər yol üçün marşrut qurulur və hesaba daxil edilir.',
  'help.guide.roadtrip-day-window.tip.3':
    'Hər günün sonu xəritədə də nişandır: gün nömrəsi olan ay. Günü başqa yerdə bitirmək üçün onu marşrut boyunca və ya bir yerin üzərinə sürükləyin. Avtomatik sonu bərpa etmək üçün ona sağ klikləyin. Bu pəncərədəki «Avtomatik gün sonlarını bərpa et» bütün bu dəyişiklikləri geri qaytarır. Günü bir dayanacaqda bitirmək üçün dayanacağa klikləyin və kartında «Günü burada bitir» açarını yandırın.',
  // roadtrip-refuel
  'help.guide.roadtrip-refuel.title': 'Bak boşalmamış yanacaq doldurmaq',
  'help.guide.roadtrip-refuel.goal':
    'Avtomobilin hələ çata biləcəyi yol hissəsində yanacaq doldurmaq üçün yer tapın və onu marşruta əlavə edin.',
  'help.guide.roadtrip-refuel.step.1':
    'Yürüş məsafəsi təyin edildikdə yan sütun yanacağın və ya batareyanın bitdiyi mərhələdə zolaq göstərir: «Yanacaq burada bitir», elektromobil üçün isə «Batareya burada bitir». Altında bunun mərhələnin başlanğıcından nə qədər məsafədə olduğu göstərilir.',
  'help.guide.roadtrip-refuel.step.2':
    'Zolaqdakı lampa ikonu düymədir: «Yanacaq məntəqəsi tap», elektromobil üçün isə «Şarj məntəqəsi tap». O, həmin nöqtədən əvvəlki yol boyunca axtarır və axtarış zamanı «Marşrut boyunca axtarılır…» yazılır.',
  'help.guide.roadtrip-refuel.step.3':
    'Üçədək yanacaq məntəqəsi göstərilir, hər birinin marşrutdan məsafəsi və sizdə nə qədər yürüş ehtiyatı qalacağı ilə.',
  'help.guide.roadtrip-refuel.step.4':
    'Təklifdəki artı işarəsi onu yanacaq dayanacağı kimi əlavə edir. «Dayanacaq kimi əlavə et» növ və vaxt artıq doldurulmuş halda açılır, «Əlavə et» isə onu hissədə marşrutun həqiqətən keçdiyi nöqtəyə qoyur.',
  'help.guide.roadtrip-refuel.result':
    'Dayanacaq öz ikonu ilə düzgün yol hissəsində görünür və yürüş ehtiyatı həmin dayanacaqdan yenidən hesablanır. Zolaq bakın indi boşalacağı nöqtəyə keçir, yolun sonuna başqa dayanacaqsız çata bilirsinizsə, yox olur.',
  'help.guide.roadtrip-refuel.tip.1':
    'Yürüş məsafəsi günlər boyu son yanacaq və ya şarj dayanacağından hesablanır. Hansı dayanacaqların sayılacağını nəqliyyat vasitənizin növü müəyyən edir: «Benzin» üçün yalnız yanacaq, «Elektrik» üçün yalnız şarj.',
  'help.guide.roadtrip-refuel.tip.2':
    'Axtarış yanacağın bitəcəyi nöqtədən əvvəlki yola baxır, ehtiyat saxlayır və dolama yolu iki dəfə hesablayır, ona görə təklif etdiyi hər yerə həqiqətən çatmaq olar.',
  'help.guide.roadtrip-refuel.tip.3':
    'Nəticə olmasa, yenidən axtara bilərsiniz: lampa «Yenidən cəhd et» düyməsinə çevrilir, çünki məkan axtarışı bəzən vaxt aşımına düşən ortaq xidmətdir.',
  // roadtrip-track
  'help.guide.roadtrip-track.title': 'Günü idxal edilmiş izə uyğunlaşdırın',
  'help.guide.roadtrip-track.goal':
    'GPX və ya KML treki kimi idxal etdiyiniz mənzərəli marşrutu günün yolu üçün istifadə edin.',
  'help.guide.roadtrip-track.step.1': 'Günün başlığındakı «İz» nişanına klikləyin. Pəncərə həmin gün üçün açılır.',
  'help.guide.roadtrip-track.step.2':
    'İz seçin. Hər birində uzunluğu və bu günün marşrutu ilə getdiyi və ya ondan nə qədər uzaq olduğu göstərilir. Ən yaxın iz birinci gəlir.',
  'help.guide.roadtrip-track.step.3':
    '«Bu izi izlə» düyməsinə klikləyin. TREK marşrutun izdən ən çox uzaqlaşdığı yerlərə ara nöqtələr əlavə edir, marşrutu yenidən hesablayır və bunu bir neçə dəfə təkrarlayır.',
  'help.guide.roadtrip-track.step.4':
    'Pəncərə neçə aralıq nöqtə qoyulduğunu və marşrutun indi izə nə qədər yaxın olduğunu, ya da marşrutun artıq izlə getdiyini bildirir. Aşağı soldakı «Aralıq nöqtələri sil» onları çıxarır və marşrutlaşdırıcı günü yenidən planlaşdırır. Pəncərəni bağlasanız, iz qalır.',
  'help.guide.roadtrip-track.result':
    'Günün yolu marşrutlaşdırıcının seçəcəyi yolu deyil, izi izləyir. İzin adını görmək üçün kursoru «İz» nişanının üzərinə gətirin. Ara nöqtələr yolu izin üstündə saxlayanda nişan həm də vurğulanır.',
  'help.guide.roadtrip-track.tip.1':
    'Pəncərədə səyahətin xətti olan məkanları sadalanır: «Gün» altındakı məkanlar sütununda «Faylı idxal et» ilə idxal edilmiş GPX və ya KML; GPX üçün «Marşrutlar» və ya «İzlər (marşrut xətti ilə)», KML üçün «Yollar (LineStrings)» işarələnmiş olmalıdır. «Faylı idxal et» yalnız Turlar əlavəsi söndürülü olduqda təklif olunur; Turlar aktivdirsə, GPX tura çevrilir və bu pəncərədə görünmür. Səyahətdə iz olmayana qədər heç bir gündə bu nişan görünmür.',
  'help.guide.roadtrip-track.tip.2':
    'İzi izləmək günün mərhələlərində artıq olan ara nöqtələri əvəz edir, ona görə mərhələni əl ilə izdən əvvəl deyil, sonra formalaşdırın.',
  'help.guide.dateless-trip.step.1': '«Yeni səyahət» düyməsinə klikləyin və səyahətə ad verin.',
  'help.guide.edit-trip.tip.2':
    'Burada əlavə etdiyiniz və ya çıxardığınız səyahət yoldaşları «Yenilə» düyməsini basmadan dərhal qüvvəyə minir.',
  'help.guide.trip-reminder.result':
    'Xatırlatma səyahətin başlamasından seçdiyiniz sayda gün əvvəl, bildiriş aldığınız kanallar vasitəsilə gəlir.',
  'help.guide.upcoming-reservations.step.1':
    'Sağ sütunda «Qarşıdakı rezervasiyalar» bölməsini tapın. Burada bütün səyahətlərinizin növbəti altı rezervasiyası tarixi, vaxtı və növü ilə, ən yaxını birinci olmaqla göstərilir.',
  'help.guide.half-company-holiday.step.1': 'Alətlər panelini «Şirkət tətili» rejiminə keçirin.',
  'help.guide.edit-holiday-calendar.result': 'Cədvəl və izahat hər dəyişiklikdən dərhal sonra yenilənir.',
  'help.guide.person-color.result': 'Şəxsin qeyd etdiyi bütün günlər indi yeni rənglə göstərilir.',
  'help.guide.answer-fusion-request.step.1':
    'Kimsə sizi dəvət etdikdən sonra Vacay bölməsini açın. «Birləşdirmə sorğusu» pəncərəsi avtomatik açılır.',
  'help.guide.log-for-partner.step.1': '«Nəfər» kartında şəxsin adına klikləyin. Onun seçildiyini işarə göstərir.',
  'help.guide.dissolve-fusion.step.1': '«Tənzimləmələr» bölməsini açın.',
  'help.guide.country-places.step.2': 'Kartdakı sancaqlı «Məkan» nişanına klikləyin.',
  'help.guide.search-place.tip.2':
    'Region artıq işarələnibsə, pəncərə bunun əvəzinə onu silmək istəyib istəmədiyinizi soruşur.',
  'help.guide.tour-activity-stats.step.4':
    'Sağdakı nişanlar cəmlərin nəyə əsaslandığını göstərir: «Planlaşdırılıb» səyahət planınıza görə hesablanan turlar, «Qeydə alınan» isə real izi əlaqələndirilmiş turlar üçündür. «Hələ qarşıda», «Günsüz» və «Tarix yoxdur» hələ hesaba daxil olmayan turları sayır. Qaydanı i işarəsi izah edir.',
  'help.guide.move-to-list.step.2':
    'Məkanları burada da saxlamaq istəyirsinizsə «Siyahıya kopyala», bu siyahıdan çıxarmaq istəyirsinizsə «Siyahıya köçür» düyməsinə klikləyin.',
  'help.guide.accept-list-invite.title': 'Siyahıya dəvəti qəbul etmək',
  'help.guide.tour-collection-add-to-trip.step.3':
    '«Yol nöqtələri» altında başlanğıcı, dayanacaqları və sonu sıra ilə əlavə etmək üçün yol nöqtələri olan xananı, yalnız saxlanmış xətti əlavə etmək üçün isə «Yalnız xətt» seçin.',
  'help.guide.tour-collection-manage.step.1':
    'Siyahını açın. Saxlanmış hər turda onun dərəcəsi, növü, hansı səyahətdən saxlandığı, məsafəsi, qalxışı və neçə yol nöqtəsi olduğu göstərilir. Turu kimin saxladığını görmək üçün kursoru səyahətin adının üzərinə gətirin.',
  'help.guide.entry-draft.step.1': 'Redaktorun sağ sütununda «Qaralama» açarını yandırın.',
  'help.guide.journey-map-layers.step.3':
    'Xəritədə içi boş sancağa və ya kiçik nöqtəyə klikləyin. Açılan kart onun nə olduğunu göstərir: planlaşdırılmış məkan və onun günü, ya da «Qeydi aç» düyməsi olan dayanma. Bu düymə sizi dayanmanın aid olduğu gün hesabatına aparır.',
  'help.guide.journey-keep-route.step.3': '«Marşrutu saxla» düyməsinə klikləyin.',
  'help.guide.journey-day-stays.step.3':
    'İstəmədiyiniz dayanmada «Ziyarət etdiyim məkan deyil» düyməsinə klikləyin. Dayanma siyahıdan çıxarılır.',
  'help.guide.journey-take-over-day.step.3':
    'Bütün gün üçün bir qeyd istəyirsinizsə, «Qeydlər» seçimini «Gün hesabatı» vəziyyətinə keçirin: bir qeyddə seçilmiş bütün dayanmalar vaxtları ilə sadalanır.',
  'help.guide.journey-auto-prepare.step.2':
    '«Qeydə alınmış günlər» altında «Qeydə alınmış günləri avtomatik hazırla» açarını yandırın.',
  'help.guide.photo-location.step.2': '«Fotolar» altında «Qeydləri fotolarına görə yerləşdir» açarını yandırın.',
  'help.guide.link-trip.tip.3':
    'Hələ əlaqələndirilməmiş səyahətin bir günü üçün qeyd yazsanız, redaktor elə qeydin içində «Səyahəti əlaqələndir» təklif edir.',
  'help.ctx.settings-plugins.summary':
    'Adminin quraşdırdığı plaginlər üçün şəxsi tənzimləmələriniz: hər plaginin sizdən istədiyi açarlar və seçimlər, həmçinin plaginlərin sizin adınızdan etdiklərinin jurnalı. Bu vərəq yalnız aktiv plagin olduqda görünür.',
  'help.ctx.settings-about.bullet.3':
    'Ko-fi, «Mənə qəhvə al» və Discord vasitəsilə TREK-i dəstəkləyə və ya onu hazırlayan insanlarla danışa bilərsiniz.',
  'help.guide.language-region.step.3':
    '«Göstərilən valyuta»nı seçin və ya hər səyahəti öz valyutasında görmək üçün «Səyahət valyutası»nı saxlayın. Sonra «Temperatur vahidi», «Məsafə vahidi», «Vaxt formatı» və həftənin hansı gündən başladığını seçin.',
  'help.guide.travel-map-prefs.step.3':
    '«Xəritədə məkanları kəşf et» yaxınlıqdakı məkanları tapmaq üçün kateqoriya düymələrini göstərir. «Rezervasiya kodlarını bulanıqlaşdır» təsdiq nömrələrini kursoru üzərinə gətirənə və ya toxunana qədər gizlədir. «Marşrutu yaşayış yerindən başlayaraq optimallaşdır» günü otelinizdə başladır və bitirir.',
  'help.guide.web-push-device.step.2':
    'Yuxarıdakı «Bildirişlər» kartında Push sütunu hansı hadisələrin cihazlarınıza göndəriləcəyini təyin edir.',
  'help.guide.connect-airtrail.goal': 'TREK öz AirTrail serverinizdəki uçuşları idxal edib sinxronlaşdırsın.',
  'help.guide.connect-dawarich.goal': 'TREK öz Dawarich serverinizdən əslində hara getdiyinizi oxusun.',
  'help.guide.tour-connect-wanderer.goal':
    'TREK öz wanderer serverinizdəki cığırları oxusun ki, onları tur kimi idxal edə biləsiniz.',
  'help.guide.tour-wanderer-watch.title': 'wanderer cığırlarınız dəyişəndə bildiriş almaq',
  'help.guide.plugin-settings.tip.2':
    '«Bildirişlər» altındakı plagin kanalının bu səhifəni açan «Konfiqurasiya et» düyməsi var.',
  'help.guide.default-user-settings.result':
    'Yeni hesablar və bu tənzimləmələri heç vaxt dəyişməmiş hər kəs sizin seçimlərinizi görür.',
  'help.guide.own-routing-engine.goal':
    'Günlərin və avtomobil səyahətlərinin marşrutlarını ictimai serverlər əvəzinə öz OSRM və ya Valhalla serverinizlə qurun.',
  'help.guide.admin-passkeys.tip.1':
    'TREK hələ domeni müəyyən edə bilmirsə, bu barədə xəbərdarlıq görünür və APP_URL və ya Relying Party ID təyin edənə qədər keçid açarları gizli qalır.',
  'help.guide.rotate-jwt-secret.step.1':
    '«Tənzimləmələr» vərəqinin aşağısında, «Təhlükəli zona» bölməsində «JWT sirrini yenilə» yanındakı «Yenilə» düyməsinə klikləyin.',
  'help.guide.storage-backends.tip.3':
    'TREK foto keşlərini yenidən yükləyə bilir, ona görə onları güzgüləmək adətən yaddaşı boş yerə tutur.',
  'help.guide.admin-channels.step.3':
    'Aşağıdakı «Bildirişlər» kartında hər hadisə üçün onu hansı kanalların göndərəcəyini seçin: «Yeni versiya əlçatandır», «Yaddaş replikasında xəta» və «Avarçəkmə regionu sorğulanıb». Hər açar dərhal yadda saxlanır.',
  'help.guide.notification-defaults.tip.1':
    '«Söndürülüb» standart vəziyyətdir, hər istifadəçi onu yenə də yandıra bilər; «Bloklanıb» isə hamı üçün söndürür.',
  'help.ctx.notifications.bullet.4':
    'Hər bildirişin vaxtının yanındakı «Oxunmuş kimi işarələ» (qoşa işarə) və «Sil» (zibil qutusu) yalnız həmin bildirişə aiddir. Yuxarıdakı «Hamısını oxunmuş kimi işarələ» və «Hamısını sil» bütün siyahıya tətbiq olunur.',
  'help.guide.read-notifications.tip.2':
    'Düyməsi olmayan bildiriş yalnız məlumat xarakterlidir. Onu paneldə oxuyun və orada oxunmuş kimi işarələyin.',
  'help.guide.filter-notifications.result':
    'Siyahıda yalnız hələ oxunmamış bildirişlər, ən yenisi birinci olmaqla göstərilir.',
  'help.guide.delete-notifications.title': 'Bildirişləri silmək',
  'help.guide.notification-settings.goal':
    'Hansı hadisələrin zəng işarəsinin altında görünəcəyini və hansılarının sizə həm də e-poçt, webhook, ntfy və ya push ilə göndəriləcəyini seçin.',
  'help.guide.public-link.step.4': '«Link yarat», sonra «Kopyala» düyməsinə klikləyin və linki göndərin.',
  'help.guide.link-journal.step.2':
    '«Jurnal bağlamaq» düyməsinə klikləyin və «Gündəlik seçin» siyahısından gündəliklərinizdən birini seçin.',
  'help.guide.dawarich-stays.title': 'Qeydə alınmış dayanmanı məkana çevirmək',
  'help.guide.dawarich-stays.tip.2': 'Dayanmadan yaranmış məkanı silsəniz, dayanma gözləyən kimi siyahıya qayıdır.',
  'help.guide.leave-stop-off-route.goal':
    'Piyada keçdiyiniz və ya sadəcə xəritədə görmək istədiyiniz yer üçün: dayanacaq gündə qalsın, amma marşrut ora getməsin.',
  'help.guide.day-route.tip.4':
    'Gündə qalmalı, amma marşruta düşməməli olan dayanacaq üçün onun menyusunda «Marşruta daxil etmə» seçin.',
  'help.guide.move-booking-day.step.2':
    'Sətri başqa günün kartının başlığına sürükləyin. Bir günlük rezervasiya tamamilə həmin günə köçür. Bir neçə günü əhatə edən rezervasiyada «Yola düşmə» sətri başlanğıc gününü, «Çatma» sətri isə bitmə gününü dəyişir.',
  'help.guide.place-image-from-file.title': 'Əlavə edilmiş fotonu məkanın şəkli etmək',
  'help.guide.place-image-from-file.tip.2':
    'Dayanacağa bərkidilmiş və ya onun rezervasiyasına əlavə edilmiş foto da təklif olunur.',
  'help.guide.place-own-hours.step.5':
    '«Yenilə» düyməsinə klikləyin. Kartda «İş saatları» altında indi sizin saatlarınız göstərilir, yuxarıdakı «Açıq» və ya «Bağlanıb» da onlara əsaslanır.',
  'help.guide.confirm-stay-booking.step.3':
    'Yuxarıdakı «Gözləyir» düyməsinə klikləyin. İpucunda «Təsdiqlənib» vəziyyətinə keçirmək təklif olunur və nöqtə yaşıla çevrilir.',
  'help.guide.map-nearby-places.tip.4':
    'Axtarışı alınmayan kateqoriyada qırmızı nöqtə görünür, «Bu ərazidə axtar» isə xəbərdarlıq işarəsi ilə qırmızı olur: yenidən cəhd etmək üçün ona klikləyin.',
  'help.guide.tour-map-lines.tip.1':
    'Günlər sütununda bir günü yığdıqda onun turları və dayanacaqları xəritədə gizlənir.',
  'help.guide.car-stops.step.3':
    'Başlığa ad yazın. «Marşrut» altında avtomobili götürdüyünüz yeri «Kimdən», qaytardığınız yeri isə «Hara» sahəsində seçin; yazmağa başlamazdan əvvəl səyahətin öz məkanları təklif olunur. «Götürmə» və «Götürmə vaxtı» avtomobili nə vaxt götürdüyünüzü, «Qaytarma» və «Qaytarma vaxtı» isə nə vaxt qaytardığınızı göstərir.',
  'help.guide.transport-details.step.1':
    '«Nəqliyyat» vərəqində karta klikləyin. Təfərrüatlar vərəqin üzərində açılır, başlıq kartla eyni rəngdə olur. Gün planındakı nəqliyyat sətri də eyni təfərrüatları açır.',
  'help.guide.export-transports-csv.tip.2':
    '«Rezervasiyalar» vərəqində də eyni işarə var və o, adı bookings.csv ilə bitən ayrıca fayl yaradır.',
  'help.guide.group-sort-bookings.step.2':
    '«Qruplaşdır» altında «Vəziyyət», «Gün», «Növ» və ya «Qruplaşdırmadan» seçin. Vərəq dərhal həmin bölmələrə görə sıralanır.',
  'help.guide.export-bookings-csv.result':
    'Brauzeriniz səyahətin və vərəqin adını daşıyan fayl yükləyir, məsələn, autumn-in-japan-bookings.csv; vərəqdə göstərilən hər rezervasiya üçün bir sətir olur.',
  'help.guide.arrange-packing-list.result':
    'Siyahılar sürüklədiyiniz ardıcıllıqdadır, elementlər isə siz bunu söndürənə qədər A-dan Z-yə sıralanır. TREK sizin öz sıranızı da yadda saxlayır.',
  'help.guide.count-packed-pieces.step.2':
    'Miqdarın qarşısında mənfi və müsbət düymələri olan sayğac görünür: 0/5. Çantaya qoyduğunuz hər ədəd üçün müsbətə klikləyin.',
  'help.guide.expense-receipts.step.4':
    'Hesab dəftərinə qayıtdıqda sətirdə adın yanında «Qəbz» nişanı görünür, bir neçə qəbz varsa, mötərizədə onların sayı. Qəbzi açmaq üçün ona klikləyin.',
  'help.guide.final-budget.tip.3':
    'Səyahətdən ayrılmış şəxsin ona borc və ya onun borcu qaldıqca «Balanslar» və «Yekun büdcə» bölmələrində sətri qalır.',
  'help.guide.files-sync-settings.step.2':
    'Axın panelində TREK və sizin saxlama xidmətiniz hər birindəki sənədlərlə, aralarında isə iki xətt göstərilir: «Saxlama xidmətinə» və «Saxlama xidmətindən». Söndürmək üçün «Saxlama xidmətinə» üzərinə klikləyin. Xətt boz olur və xətlərin altındakı sətirdə «Yalnız daxil olan» yazılır. Yenidən yandırmaq üçün yenə klikləyin.',
  'help.guide.files-sync-settings.tip.4':
    'Bunların heç birini səyahətin sahibi və ya administratordan başqa kimsə dəyişə bilməz. Digər üzvlər axın panelini «Sənədlər hər iki istiqamətdə hərəkət edir» kimi bir sətirlə görür, amma «Tənzimləmələr» onlarda yoxdur.',
  'help.guide.manage-notes.step.2':
    '«Genişləndir» qeydi tam açır: bütün mətn, onun «Veb-sayt» və «Fayl» hissəsi. Faylı önizləmək üçün ona klikləyin. Aşağıdakı «Redaktə et» birbaşa redaktora keçir; yuxarı sağdakı çarpaz qeydi yenidən bağlayır.',
  'help.guide.note-categories.goal':
    'Qrupun qeydlərinə adlı, rəngli kateqoriyalar verin və hər dəfə bir kateqoriyanı göstərin.',
  'help.guide.note-categories.tip.1':
    'Zibil qutusu yalnız heç bir qeydin istifadə etmədiyi kateqoriyanı silir. Qeydlərin hələ istifadə etdiyi kateqoriya həmin qeydləri başqa kateqoriyaya köçürənə qədər siyahıda qalır.',
  'help.guide.roadtrip-reorder.title': 'Dayanacağın yerini dəyişmək və ya onu başqa günə köçürmək',
  'help.guide.roadtrip-reorder.tip.3':
    'Bərkitdiyiniz vaxt barədə TREK soruşmur: zolaq günü dərhal yenidən hesablayır və artıq vaxtında çatılması mümkün olmayan dayanacağı işarələyir.',
  'help.guide.roadtrip-overnight.step.3':
    'Pəncərənin yuxarısında «Gecələmə» gecələmə əlavə edir, «Fasilə» isə onu müəyyən müddətlik dayanacaq edir. Otel «Gecələmə», kempinq isə «Fasilə» ilə açılır. Gecələmə üçün yalnız «Giriş» vaxtı soruşulur, onu boş da buraxa bilərsiniz.',
  'help.guide.roadtrip-stop-fill.step.1':
    'Zolaqda yanacaq və ya şarj dayanacağının batareya nişanına klikləyin. O, dayanacaqda hansı səviyyəyə qədər doldurulduğunu göstərir: «Doldurma səviyyəsi» dəyərinizdən istifadə etdikcə solğun, öz dəyəri olduqda isə tünd.',
  'help.guide.roadtrip-bookings.step.1':
    'Gedişi öz günündə «Uçuş», «Qatar», «Bərə», «Kruiz» və ya «Avtobus» rezervasiyası kimi, hər iki ucunun yeri göstərilməklə əlavə edin. Səfər onu avtomatik nəzərə alır: yol gedişin yola düşdüyü terminalda bitir və çatdığı yerdə yenidən başlayır.',
  'help.guide.roadtrip-google-import.result':
    'Marşrutun dayanacaqları həmin günün son dayanacağından sonra əlavə olunur, zolaqdakı və xəritədəki marşrut da onlardan keçir.',
  'help.guide.roadtrip-hazards.step.3':
    'Xəbərdarlıqlar xəritədə sahə kimi göstərilir. Nə haqqında olduğunu, hansı xidmətin bildirdiyini və son dəfə nə vaxt yeniləndiyini görmək üçün birinə klikləyin.',
  'help.ctx.trip-tours.bullet.2':
    'Yuxarıdakı «GPX və ya KML idxal et» faylları tur kimi əlavə edir. Altındakı filtr düyməsi (əvvəlcə «Hamısı», turların sayı ilə) siyahını vəziyyətə, mənbəyə, marşrut limitinə və növə görə süzür.',
  'help.guide.tour-show-list.step.2':
    'Hər sətir bir turdur. Rəngli zolaq onun xəritədəki xəttidir, dairəvi xana isə TREK-də planlaşdırılmış piyada gəzintisinin marşrut limitini (T1-dən T6-ya qədər) və ya növünün işarəsini göstərir. Adın altındakı nişanlar turun hansı günlərdə olduğunu, vaxtını, məsafəsini və qalxışını göstərir. Çoxgünlük turda rəqəmli ay neçə mərhələ olduğunu bildirir.',
  'help.guide.tour-add-to-day.title': 'Turu günə əlavə etmək',
  'help.guide.tour-add-to-day.tip.2':
    'Səyahət son mərhələdən əvvəl bitirsə, seçimdə sığan son mərhələ göstərilir, ondan sonrakı mərhələlər isə günsüz qalır.',
  'help.guide.tour-day-times.step.3':
    '«Yenilə» düyməsinə klikləyin. Sətirdə indi başlanğıc → son göstərilir. Hesablanmış bitmə vaxtı daha açıq rəngdədir: təxmini vaxt üçün ≈, dayanmanın hələ vaxtı olmadıqda ≥, gecə yarısından sonra isə +1 qoyulur. Necə hesablandığını görmək üçün kursoru onun üzərinə gətirin.',
  'help.guide.tour-remove-from-day.goal': 'Turu silmədən plandan çıxarın.',
  'help.guide.tour-filter-list.goal':
    'Uzun siyahını lazım olan turlara qədər daraldın: hələ planlaşdırılmamış, fayldan gələn, bir növdən olan.',
  'help.guide.tour-filter-list.result':
    'Siyahıda yalnız filtrlədiyiniz turlar qalır; digərləri səyahətdə qalmağa davam edir.',
  'help.guide.tour-hide-on-map.result':
    'Xəritədə yalnız istədiyiniz turlar görünür, gizlədilənlər isə siyahıda solğun halda qalır.',
  'help.guide.tour-import-plan-tab.result': 'İz səyahətin turu olur: siyahıda GPX nişanlı sətir və xəritədə xətt.',
  'help.guide.tour-detail-read.title': 'Turu açmaq və kartını oxumaq',
  'help.guide.tour-detail-read.step.7': 'Kartı yuxarısındakı X ilə bağlayın və ya Escape düyməsini basın.',
  'help.guide.tour-rename-colour.goal': 'Tura tanıyacağınız ad və xəritədə asan seçilən xətt rəngi verin.',
  'help.guide.tour-take-along.title': 'Turu telefona və ya GPS cihazına yükləmək',
  'help.guide.tour-take-along.tip.4':
    '«Turlar» vərəqində həmin yükləmə sol sütunun yuxarısındadır. Turda yadda saxlanmamış dəyişikliklər varsa, yükləmə əvvəlcə yadda saxlamağı xahiş edir.',
  'help.guide.tour-copy-keep.tip.1':
    'Hər ikisi nüsxədir: turda sonradan edilən dəyişikliklər nə nüsxəyə, nə də kolleksiyada saxladığınız versiyaya təsir edir.',
  'help.guide.tour-packing-link.step.2':
    '«Hara bağlansın» altında «Bütün baqaj siyahısı» və ya onun siyahılarından birini seçin. Hər sətirdə neçə element olduğu göstərilir.',
  'help.guide.tour-files.title': 'Tura fayl əlavə etmək',
  'help.guide.tour-activity-link.title': 'Əslində keçdiyiniz izi əlaqələndirmək',
  'help.guide.tour-activity-link.tip.2':
    'Yalnız tur planlaşdırmaq üçün istifadə olunmamış idxal edilmiş izi əlaqələndirə bilərsiniz və hər iz yalnız bir tura bağlana bilər.',
  'help.guide.tour-activity-compare.step.4':
    'İzin altındakı «Dəyiş» başqa qeydi seçir. «Əlaqəni sil» onu turdan ayırır, iz isə idxal kimi səyahətdə qalır.',
  'help.guide.tour-origin-check.step.3':
    '«Turlar» vərəqində çəkdiyiniz turda «TREK-də planlaşdırılıb» və «Yaradılıb» günü göstərilir.',
  'help.ctx.trip-tour-planner.bullet.2':
    'Sol zolaq redaktordur. Heç nə açıq olmadıqda «Yeni tur planlaşdır» təklif edir. Açıq turda onun adı, növü, yol nöqtələri, növünə aid kartlar və təfərrüatları, aşağıda isə «İmtina et» və «Yadda saxla» göstərilir.',
  'help.guide.tour-open-workspace.step.2':
    'Sol zolaq redaktordur. Açıq tur olmadıqda «Yeni tur planlaşdır» təklif edir, bu da xəritədə yeni tura başlayır.',
  'help.guide.tour-open-workspace.tip.3':
    'Redaktorda yadda saxlanmamış dəyişikliklər olarkən başqa turu açsanız, əvvəlcə soruşulur: «Dəyişiklikləri ləğv et» və ya redaktəyə davam etmək.',
  'help.guide.tour-draw-route.step.5':
    'Növbəti yerlərə gedəcəyiniz ardıcıllıqla klikləyin. Hər klik nöqtəni yeni son kimi əlavə edir, iki nöqtədən sonra isə TREK marşrutu yollar boyunca planlaşdırır.',
  'help.guide.tour-type-profile.goal':
    'Tur növünü, velosiped turu üçün isə profili seçin ki, marşrut düzgün yollarla getsin.',
  'help.guide.tour-edit-points.title': 'Nöqtələri köçürmək, sıralamaq və silmək',
  'help.guide.tour-edit-points.tip.1':
    'İlk nöqtədə «Başlanğıc», sonuncuda «Son» nişanı var. Nöqtəni ən yuxarıya və ya ən aşağıya köçürsəniz, o, başlanğıc və ya son olur.',
  'help.guide.tour-shaping-points.step.4':
    'Dayanacağı forma nöqtəsinə çevirmək və ya geri qaytarmaq üçün onun sətrində «Digər əməliyyatlar» menyusunu açın və «Forma nöqtəsi et» və ya «Dayanacaq et» seçin.',
  'help.guide.tour-loop-reverse.step.2':
    'Son sətirdə indi «Başlanğıca qayıdış» yazılır və xəritədəki marşrut başladığı yerdə bitir.',
  'help.guide.tour-leg-by-hand.step.1':
    'Hissənin başladığı nöqtədə «Digər əməliyyatlar» menyusunu açın və «Növbəti hissəni əllə çək» seçin.',
  'help.guide.tour-trip-places.goal': 'Səyahətdə artıq planlaşdırdığınız məkanı tura dayanacaq kimi əlavə edin.',
  'help.guide.tour-trip-places.result': 'Turda səyahətin məkanı üçün eyni adlı yeni dayanacaq yaranır.',
  'help.guide.tour-details-times.tip.2':
    'Piyada gəzintisində «Ətraflı məlumat» bölməsində həmçinin «Maksimum cığır çətinliyi» və «Marşrut seçimi» var, onları gəzinti bələdçiləri izah edir. Şəhər gəzintisində «Fasilələr» yoxdur: əvəzinə dayanacaqlarda qaldığınız vaxt hesablanır.',
  'help.guide.tour-save.step.4': 'Tur indi «Bu səyahətin turları» altında görünür, hələ heç bir günə əlavə olunmayıb.',
  'help.guide.tour-edit-saved.step.2':
    'Yeni turda olduğu kimi lazım olanı dəyişin: nöqtələri köçürün və ya əlavə edin, növü dəyişin və ya təfərrüatları redaktə edin, burada olduğu kimi «Təsvir»i.',
  'help.guide.tour-summary-profile.goal':
    'Turun uzunluğunu, nə qədər dik olduğunu və marşrutun harasında hansı hündürlük olduğunu görün.',
  'help.guide.tour-summary-profile.result':
    'Turun uzunluğunu, nə qədər qalxdığını, nə qədər vaxt apardığını və harada dikləşdiyini bilirsiniz.',
  'help.guide.tour-list-manage.tip.1':
    'Hər tur cəmlərdə bir dəfə sayılır, bir neçə gündə olsa belə. Qarşısında ≥ olan cəmə bəzi turlar daxil deyil. Neçə tur olduğunu görmək üçün kursoru üzərinə gətirin.',
  'help.guide.tour-delete.tip.1': 'Bunu geri qaytarmaq olmur, «Geri qaytar» da turu bərpa etmir.',
  'help.guide.tour-saved-elsewhere.step.3':
    'Yenə də «Yadda saxla» düyməsinə klikləsəniz, əvəzinə «Bu arada dəyişib» pəncərəsi açılır və heç nə üzərinə yazılmır.',
  'help.ctx.trip-tour-import.bullet.2':
    '«İdxal önbaxışı» heç nə saxlanmazdan əvvəl fayllardakı bütün izləri məsafəsi, qalxışı, enişi və nöqtələri ilə xəritədə göstərir. «Bu kimi idxal et» altında izlərin nə olduğunu göstərirsiniz.',
  'help.guide.tour-import-gpx.step.3':
    '«İdxal önbaxışı» açılır, hələ heç nə saxlanmayıb. Xəritədə bütün marşrut görünür, fayllardakı hər iz isə məsafəsi, qalxışı, enişi və nöqtələri olan nömrəli sətirdir. Qeydə alınmış izdə həmçinin nə vaxt yazıldığı və nə qədər vaxt apardığı göstərilir.',
  'help.guide.tour-import-gpx.result':
    'Tur «Bu səyahətin turları» bölməsindədir, hələ heç bir günə əlavə olunmayıb. Tək tur dərhal xəritədə «GPX turu» kimi açılır.',
  'help.guide.tour-view-import.tip.3': 'wanderer cığırı da eyni qaydada, «wanderer turu» kimi açılır.',
  'help.guide.tour-plan-from-import.tip.1': '«İmtina et» təklifi silir. Siz yadda saxlayana qədər heç nə saxlanmır.',
  'help.guide.tour-restore-recorded.step.2': '«Qeydə alınmış izi bərpa et» düyməsinə klikləyin.',
  'help.guide.tour-take-over.step.2': '«Başqa səfərdən tur götür» seçin.',
  'help.guide.tour-take-over.result':
    'Mesaj turun götürüldüyünü təsdiqləyir və tur redaktorda açılır, günə əlavə edilməyə hazırdır.',
  'help.guide.tour-import-wanderer.tip.2':
    'İdxal nüsxədir: wanderer-də sonradan edilən dəyişikliklər tura təsir etmir. Cığırın nə vaxt dəyişdiyini turun «Mənşə» bölməsindəki «Mənbəni yoxla» göstərir.',
  'help.ctx.trip-tour-map.bullet.3':
    'Xəritənin yuxarısındakı «Yer və ya ünvan axtar» tura heç nə əlavə etmədən xəritəni şəhərə, daxmaya və ya zirvəyə aparır.',
  'help.guide.tour-map-layers.result':
    'Tur ona uyğun xəritədə göstərilir, düymə isə hansı xəritənin aktiv olduğunu göstərir.',
  'help.guide.tour-along-search.step.3':
    '«Marşrutdan bu məsafədə» altında xətdən nə qədər uzaqda axtarılacağını seçin: 250 m, 500 m, 1 km və ya 2 km.',
  'help.guide.tour-along-add-stop.goal':
    'Yol boyunca tapdığınız seyr nöqtəsini, daxmanı və ya bulağı marşruta daxil edin.',
  'help.guide.tour-along-add-stop.tip.3':
    'Dayanacaq əlavə etmək mümkün olmayan hissə (sabit xətt kimi əlavə edilmiş via ferrata və ya daşıma, yaxud əllə çəkilmiş hissə) siyahıda solğun qalır, səbəbi yanında göstərilir.',
  'help.guide.tour-3d-terrain.result':
    'Turu dik hissələri rənglənmiş halda 3D relyefdə gördünüz, planlaşdırma üçün isə düz xəritə geri qayıdıb.',
  'help.guide.tour-3d-flyover.step.3':
    '«Fasilə» uçuşu olduğu yerdə dayandırır, «Uçuşu oynat» isə oradan davam etdirir. «Yenidən başla» əvvələ qayıdır və uçuşu təzədən başladır.',
  'help.guide.tour-map-overlays.step.1':
    '«Turlar» vərəqində xizək turunu açın. Pistlər əvvəldən görünür: onların açarı aşağı soldakı paneldə qarlı dağ işarəsidir, «Trasslar, xizək qaçışı yolları və liftlər». Xəritədə gizlətmək üçün ona klikləyin, yenidən göstərmək üçün təkrar klikləyin.',
  'help.ctx.trip-tour-stages.title': 'Çoxgünlük turlar',
  'help.guide.tour-multi-day.goal': 'Bir marşrutu mərhələlərə bölün: yolda olduğunuz hər gün üçün bir mərhələ.',
  'help.guide.tour-multi-day.tip.2':
    'İki mərhələni yenidən birləşdirmək üçün ay işarəli dayanacağın menyusunda «Mərhələ sonunu sil» seçin. Həmin dayanacağı silsəniz də mərhələlər birləşir və bildirişdə «Geri qaytar» təklif olunur.',
  'help.guide.tour-stages-on-days.step.3':
    '«Bu gündən etibarən mərhələlər» seçin: 1-ci mərhələ həmin günə, hər növbəti mərhələ isə sonrakı günə düşür. «Bütün tur bu gündə» isə əvəzinə bütün marşrutu həmin bir günə yerləşdirir.',
  'help.guide.tour-stages-on-days.result': 'Hər mərhələ səyahətin öz günündədir, açdığınız mərhələ isə redaktordadır.',
  'help.ctx.trip-tour-hike.bullet.6':
    'Sağdakı «Turun xülasəsi» məsafəni, qalxışı, təxmini yeriş və ya qaçış vaxtını, fasilələri və planlaşdırılan ümumi vaxtı, altında isə hündürlük profilini göstərir. Redaktorun aşağısındakı «Yadda saxla» turu saxlayır.',
  'help.guide.tour-hike-plan.step.6': 'Sol sütunun aşağısındakı «Yadda saxla» düyməsinə klikləyin.',
  'help.guide.tour-hike-trail-details.step.1':
    'Gəzintini «Bu səyahətin turları» bölməsindən açın və «Yol nöqtələri» kartının altında «Cığır təfərrüatları»nı tapın. «Marşrut boyunca göstər» açarını yandırın.',
  'help.guide.tour-hike-trail-details.tip.3':
    'Kartdakı heç nə turu dəyişmir, onun üçün internet bağlantısı lazımdır. İdxal edilmiş gəzinti də öz görünüşündə eyni kartı göstərir, sadəcə marşrut limiti olmadan.',
  'help.guide.tour-hike-round.result':
    'Gəzinti seçdiyiniz dairəvi marşrutla gedib başlanğıca qayıdır. Xəritənin aşağısındakı «Dairə seçildi» bildirişində «Geri qaytar» var, «Yadda saxla» isə dəyişikliyi saxlayır.',
  'help.guide.tour-hike-compare-ways.step.3':
    'Sətirdəki nişanlar onun cari yoldan nə qədər uzun, yüksək və ya yavaş olduğunu göstərir. İstədiyinizə klikləyin.',
  'help.guide.tour-ferrata-add.step.1':
    'Gəzinti açıq olduqda aşağı soldakı xəritə düymələri sırasında «Via ferrata marşrutları» düyməsinə klikləyin. Nişan görünən sahədəki via ferrata marşrutlarını sayır; xahiş olunarsa, xəritəni yaxınlaşdırın.',
  'help.guide.tour-ferrata-add.tip.3':
    'Via ferrata hissəsi hündürlük profilində vurğulanır, beləliklə, günün hansı anında ora çatdığınızı görürsünüz.',
  'help.guide.tour-run-plan.step.5': '«Turun adı» altında qaçışa ad verin və «Yadda saxla» düyməsinə klikləyin.',
  'help.guide.tour-run-ways.step.1':
    'Qaçışı «Bu səyahətin turları» bölməsindən açın və «Yol nöqtələri» kartının altındakı «Cığır təfərrüatları»nda «Marşrut boyunca göstər» açarını yandırın.',
  'help.ctx.trip-tour-walk.bullet.1':
    '«Tur növü» olaraq «Şəhər / görməli yerlər gəzintisi» seçdikdə tur gəzintiyə çevrilir. Onun nöqtələri «Etiket», qalma müddəti və əhəmiyyəti olan dayanacaqlardır. Gəzintidə piyada gəzinti limiti və «Fasilələr» sahəsi yoxdur: əvəzinə qalma müddətləri hesablanır.',
  'help.guide.tour-walk-plan.step.2':
    'Dayanacaqları əlavə edin: «Nöqtə əlavə et» rejiminin aktiv olduğunu yoxlayın və xəritədə hər birinə klikləyin, ya da səyahətdə artıq olan məkanı götürmək üçün «Səfər yerləri» düyməsinə klikləyin.',
  'help.guide.tour-walk-plan.result':
    'Gəzintidə dayanacaqlar qalma müddətləri ilə sadalanır, «Turun xülasəsi» isə onları toplayır. Hər dayanacağa nə vaxt çatacağınızı görmək üçün gəzintini günə əlavə edin.',
  'help.guide.tour-walk-sights.tip.1': 'O, səyahətin məkanı deyil, gəzintinin dayanacağı olur.',
  'help.guide.tour-walk-day-times.step.3':
    'Gəzintini «Turlar» vərəqində yenidən açın. «Yol nöqtələri»nin yuxarısında «Vaxtlar üçün gün» günü və başlanğıc vaxtını göstərir. Bir neçə gündə planlaşdırılmış gəzintidə başqa günü seçmək üçün ona klikləyin.',
  'help.guide.tour-walk-google-import.goal':
    'Google Maps-dən paylaşılmış piyada marşrutunu yapışdırın və dayanacaqlarını gəzinti kimi yükləyin.',
  'help.guide.tour-walk-google-import.result':
    'Redaktorda Google Maps-dən gələn dayanacaqlarla yeni şəhər gəzintisi açılır, yadda saxlamağa hazırdır.',
  'help.guide.tour-walk-check-off.tip.2': 'Gün planındakı gəzinti sətrində də say göstərilir, məsələn, 3/7.',
  'help.ctx.trip-tour-bike.bullet.4':
    'MTB profilində həmin kart xəritəçilərin əlavə etdiyi yerlərdə cığır dərəcələrini (mtb:scale) göstərir. Dərəcəsi olmayan yol asan deyil, naməlumdur.',
  'help.guide.tour-bike-profile.step.6':
    '«Turun adı» altında ad yazın, sonra sol zolağın aşağısındakı «Yadda saxla» düyməsinə klikləyin.',
  'help.guide.tour-bike-surfaces.goal':
    'Marşrutun nə qədərinin asfalt, çınqıl və ya naməlum örtüklü olduğunu və hansı yol növlərindən keçdiyini öyrənin.',
  'help.guide.tour-bike-surfaces.tip.3':
    'Kart marşrutu marşrutlaşdırıcının planlaşdırdığı kimi götürür və turda heç nəyi dəyişmir. Onun üçün internet bağlantısı lazımdır; oflayn olduqda bunu bildirir, marşruta isə təsir etmir.',
  'help.guide.tour-bike-mtb-grades.tip.1':
    '«Məlumatda dərəcə yoxdur» asan demək deyil, naməlum deməkdir. Dərəcə cığırın sizə uyğun olub olmadığı barədə heç nə demir.',
  'help.ctx.trip-tour-ski.bullet.3':
    'Xəritədə kliklədiyiniz hər nöqtə özündən əvvəlkinə pistlər, liftlər və cığırlar boyunca birləşdirilir. Hər nöqtənin altında onun hissəsi nişanlar kimi sadalanır: pistlər dərəcələrinin rəngində, dəqiqələri ilə. Planlaşdırıla bilməyən hissə qırmızı olur, səbəbini bildirir və düzəliş və ya «Düz çək» təklif edir.',
  'help.guide.tour-ski-plan.step.4':
    '«Nöqtə əlavə et» rejiminin aktiv olduğunu yoxlayın, sonra xəritədə başladığınız yerə və çatmaq istədiyiniz hər yerə ardıcıllıqla klikləyin. Trass marşrutlaşdırıcısı hər nöqtəni özündən əvvəlkinə pistlər, liftlər və cığırlar boyunca birləşdirir.',
  'help.guide.tour-ski-options.title': 'Trass marşrutlaşdırıcısına necə xizək sürdüyünüzü bildirmək',
  'help.guide.tour-ski-options.tip.2':
    '«Liftlərdən istifadə et» «Alp xizəyi» və «Snoubord» üçün standart olaraq aktiv, digər növlər üçün deaktivdir. «Çıxar» və «Lazım olsa liftlə en» yalnız liftlərdən istifadə edildikdə görünür.',
  'help.guide.tour-ski-fix-leg.tip.1':
    'Nöqtəni xəritədə pistə, cığıra və ya liftə yaxın da sürükləyə bilərsiniz. Buraxdıqda hissə yenidən planlaşdırılır.',
  'help.guide.tour-ski-summary.step.2':
    '«Xizək sürmə», «Liftlərdə», «Gözləmə» və «Piyada» hər biri üçün vaxtı göstərir. «Pistlər», «Pistlərdə eniş» və «Lift gedişləri» pistlərin uzunluğunu, onlarda endiyiniz hündürlüyü və neçə liftə mindiyinizi göstərir.',
  'help.guide.tour-ski-pistes-layer.goal':
    'Xizək turunuzun ətrafındakı pistləri, xizək qaçışı yollarını və liftləri, həmçinin rənglərinin nə demək olduğunu görün.',
  'help.guide.tour-ski-import.title': 'Xizək izini idxal edib nə olduğunu göstərmək',
  'help.guide.tour-ski-import.tip.1':
    'İdxal edilmiş iz qeydə alındığı kimi saxlanır: TREK onu pistlərə uyğunlaşdırmır və kartında «Xizək vaxtı» üçün «Hesablanmayıb» göstərilir.',
  'help.ctx.trip-tour-paddle.bullet.3':
    'Nöqtədəki «Digər əməliyyatlar» menyusunda avarçəkmə alətləri var: növbəti hissəni suda planlaşdırmaq və ya əllə çəkmək, «Qayığı buradan daşı» və «Bu nöqtədə şlüz».',
  'help.guide.tour-paddle-setup.step.3':
    '«Qayıq» altında «Kayak», «Kanoe», SUP və ya «Digər» seçin. TREK-in təklif etdiyi sürət qayıqdan asılıdır.',
  'help.guide.tour-paddle-setup.tip.4':
    'Sütunun aşağısındakı «Avarçəkmənin riskləri var» sətri «Suda təhlükəsizlik» bölməsini açır. İlk turunuzdan əvvəl onu bir dəfə oxuyun.',
  'help.guide.tour-paddle-water-route.step.5':
    'Əllə çəkilmiş bütün hissələri birdən planlaşdırmaq üçün «Yol nöqtələri» başlığındakı dalğalara, «Əllə çəkilmiş hissələri su ilə planlaşdır» düyməsinə klikləyin.',
  'help.guide.tour-paddle-portage.step.1':
    'Sudan çıxdığınız dayanacağın üzərinə gəlin və üç nöqtəyə, «Digər əməliyyatlar» düyməsinə klikləyin.',
  'help.guide.tour-paddle-portage.result':
    'Bu hissə xəritədə və yol nöqtələrində daşıma kimi göstərilir, «Vaxt təxmini» də onu daşıma kimi hesablayır.',
  'help.guide.tour-paddle-lock.tip.2':
    'Daşıma şlüzün ətrafından keçirsə, şlüz solğunlaşır və «Ətrafından daşınır» kimi işarələnir. Bu halda daşıma vaxtı hesablanır, şlüzün dəqiqələri isə daxil edilmir.',
  'help.guide.tour-paddle-time.step.4':
    'Turda daşıma varsa, «Daşıma» sətri onu hesablayır. Sürətinə klikləyin və qayığı hansı sürətlə daşıdığınızı yazın. «Sudan çıxış və yenidən giriş» hər daşımaya dəqiqələr əlavə edir.',
  'help.guide.tour-paddle-wind.step.1':
    'Avarçəkmə turunu səyahətin bir gününə əlavə edin. Bundan sonra sol sütundakı «Külək» kartı həmin gün üçün turun başlanğıcındakı proqnozu göstərir.',
  'help.guide.tour-paddle-wind.result': 'Suya düşdüyünüz yerdə günün küləyini saat-saat bilirsiniz.',
  'help.guide.tour-paddle-checklist.tip.1':
    'Hər maneə üçün nə edəcəyinizi seçin: «Avarla keç», «Ətrafından daşı», «Ətrafından dolan» və ya «Təsir etmir». «Növbəti» sizi növbəti cavablanmamış bəndə aparır.',
  'help.guide.tour-paddle-track-marks.step.1':
    '«Turlar» vərəqində sağ sütundakı «Tur əlavə et» düyməsinə klikləyin, «GPX və ya KML idxal et» seçin və faylı seçin.',
  'help.guide.tour-paddle-track-marks.tip.2':
    '«İmtina et» yadda saxlamadığınız işarələri silir. Qeydə alınmış izin özü heç vaxt yenidən çəkilmir.',
  'help.ctx.trip-tour-horse.bullet.4':
    'TREK at sürmə vaxtını hesablamır. Gündə vaxt görmək istəyirsinizsə, onu «Ətraflı məlumat» bölməsində «Planlaşdırılıb» sahəsinə yazın.',
  'help.guide.tour-horse-plan.step.5':
    '«Bölmələr» altında bir bölmə seçin. Onu hansı «İstiqamət»də keçdiyinizi və boyunca «At üçün giriş» nə göstərdiyini yoxlayın.',
  'help.guide.tour-horse-plan.tip.5':
    'At gəzintisində heç nə marşrutlaşdırılmır: çəkilmiş xəttə klik forma nöqtəsi əlavə etmir, bölmənin uclarındakı nöqtələr isə marşrutdakı yerlərində qalır.',
  'help.guide.tour-horse-gap.tip.1':
    'Əl ilə çəkilmiş bölməni nə marşrutlaşdırıcı, nə də at marşrutu yoxlayıb. Onun əslində haradan keçdiyini görmək üçün xəritəyə baxın.',
  'help.guide.tour-horse-recorded.step.4':
    'At gəzintisi sol sütunda açılır. «Qeydə alınmış gəzinti» kartında «Qeydə alındığı kimi», «Sürmə vaxtı yoxdur» və «Giriş yoxlanılmayıb» göstərilir. Səbəbini oxumaq üçün kursoru nişanın üzərinə gətirin.',
  'help.guide.dateless-trip.step.2':
    '«Başlama tarixi» və «Bitmə tarixi» sahələrini boş buraxın. Altında «Günlərin sayı» sahəsi görünür: neçə gün planlaşdırmaq istədiyinizi yazın.',
  'help.guide.trip-reminder.tip.1':
    '«Xatırlatma» blokunu yalnız səyahətin sahibi (və ya administrator) görür. Blok boz görünürsə, administrator əvvəlcə «Admin», «Bildirişlər» bölməsində səyahət xatırlatmalarını yandırmalıdır.',
  'help.guide.upcoming-reservations.step.2': 'Rezervasiyanın aid olduğu səyahəti açmaq üçün ona klikləyin.',
  'help.guide.timezones-widget.tip.1':
    'Siyahıda rəsmi saat qurşağı adları istifadə olunur, məsələn, Europe/Lisbon və ya America/New_York, ona görə adda keçən şəhəri axtarın.',
  'help.guide.half-company-holiday.step.2': 'Həmin alətlər panelində «Yarım gün» açarını yandırın.',
  'help.guide.edit-holiday-calendar.tip.1': 'Hər dəyişiklik dərhal yadda saxlanır. «Yadda saxla» düyməsi yoxdur.',
  'help.guide.person-color.tip.1': 'Alətlər panelində və «Məzuniyyət limiti» kartında şəxs eyni rənglə işarələnir.',
  'help.guide.answer-fusion-request.step.2':
    'Birləşdirmənin nə demək olduğunu oxuyun: bir ortaq təqvim, bir-biriniz üçün redaktə edə biləcəyiniz qeydlər və ortaq tətil tənzimləmələri.',
  'help.guide.log-for-partner.step.2':
    'Alətlər panelinə baxın: onun ilk düyməsində indi həmin şəxsin adı və rəngi görünür.',
  'help.guide.dissolve-fusion.step.2': 'Aşağıdakı «Birləşdirməni ləğv et» bölməsində «Ayır» düyməsinə klikləyin.',
  'help.guide.country-places.step.3':
    'Pəncərədə ölkə üçün sayılan bütün məkanlar səyahətlərə görə qruplaşdırılmış şəkildə göstərilir; altıdan çox olduqda yuxarıdakı «Məkanları axtar» siyahını daraldır. Həmin səyahəti planlaşdırıcıda açmaq üçün məkana və ya səyahətin başlığına klikləyin.',
  'help.guide.tour-activity-stats.step.5':
    '«Turları göstər» düyməsinə klikləyin. «Tamamladığım turlar» cəmlər, «Növə görə» bölgü və dövrün bütün turları günü, səyahəti, məsafəsi və qalxışı ilə birlikdə açılır. Başlıqdakı düymələrlə burada da dövrü və növü dəyişə bilərsiniz.',
  'help.guide.move-to-list.step.3':
    'Məkanların köçürüləcəyi siyahını seçin. Üçdən çox siyahı olduqda yuxarıdakı axtarış sahəsi onları daraldır.',
  'help.guide.accept-list-invite.goal': 'Kiminsə sizinlə paylaşdığı siyahıya qoşulun və ya dəvəti rədd edin.',
  'help.guide.tour-collection-add-to-trip.step.4':
    'İstəsəniz «Səfərdəki ad» sahəsini dəyişin, sonra «Səfərə əlavə et» düyməsinə klikləyin.',
  'help.guide.tour-collection-manage.step.2':
    '«Məkanları axtar» sahəsinə yazın. Turlar da məkanlarla birlikdə ada görə süzülür.',
  'help.guide.create-journey.tip.3':
    'Səyahət indicə bitibsə, yuxarıdakı «Səyahət indicə başa çatdı» bannerindəki «Səyahət gündəliyi yarat» həmin səyahət artıq seçilmiş halda yeni gündəlik başladır.',
  'help.guide.entry-draft.step.2': '«Yadda saxla» düyməsinə klikləyin. Kartda indi «Qaralama» nişanı görünür.',
  'help.guide.gallery-map.step.3':
    '«Zaman xətti»nə qayıtdıqda sağdakı xəritə sürüşdürməyinizi izləyir: görünən qeyd gününün rəngində halqa ilə işarələnir. Zaman xəttini qeydə sürüşdürmək üçün sancağa klikləyin.',
  'help.guide.journey-map-layers.tip.1':
    'Qırıq xətli rəngli xətt səyahətin GPX marşrutudur, planın bir hissəsidir; bütöv xətt isə həmin gün qeydə alınmış marşrutdur.',
  'help.guide.journey-keep-route.tip.1':
    'Qeyd harada dayanırsa, xətt də orada dayanır. TREK yalnız qeydə alınanı çəkir.',
  'help.guide.journey-day-stays.tip.1':
    'Bu sətir yalnız gündəliyi redaktə edə bilən və öz Dawarich hesabını qoşmuş şəxslərə, həm də yalnız hələ qərar verilməli bir şey qalan günlərdə görünür.',
  'help.guide.journey-take-over-day.step.4':
    'Marşrutu da saxlamaq üçün «Günün marşrutunu da saxla» açarını yandırılmış qoyun, sonra götürmə düyməsinə klikləyin. Düymədə neçə qaralama yaradılacağı göstərilir.',
  'help.guide.journey-auto-prepare.step.3':
    'Altındakı sətir dayanmalarınızın son dəfə nə vaxt alındığını və ya bunun niyə alınmadığını göstərir. Dawarich-dən dərhal sorğu üçün «İndi yüklə» düyməsinə klikləyin.',
  'help.guide.photo-location.tip.1': 'Özünüz təyin etdiyiniz məkanların yeri heç vaxt dəyişdirilmir.',
  'help.ctx.settings-plugins.bullet.1':
    '«Plagin tənzimləmələri»: altında sizdən məlumat tələb edən hər plagin üçün sahələri və «Yadda saxla» düyməsi olan bir kart var. Gizli sahə yadda saxlandıqdan sonra bir daha göstərilmir.',
  'help.guide.dashboard-widgets.step.3':
    'Kartların altındakı «Standart dəyərlərə sıfırla» bütün «Görünüş» vərəqini ilkin tənzimləmələrə qaytarır.',
  'help.guide.web-push-device.result':
    'Kartda «Bu cihaz üçün aktivdir» yazılır, Push altında yandırılmış hadisələr isə TREK bağlı olsa belə gəlir.',
  'help.guide.connect-airtrail.step.1':
    '«İnteqrasiyalar» altında AirTrail-i tapın və «İnstansiya URL-i» ilə API açarını daxil edin. Açarı AirTrail-də «Settings», «Security» bölməsində yaradırsınız.',
  'help.guide.connect-dawarich.step.1':
    '«İnteqrasiyalar» altında Dawarich-i tapın, «İnstansiya ünvanı»nı və Dawarich-də «Account», «API key» bölməsindəki API açarını daxil edin.',
  'help.guide.tour-connect-wanderer.step.1':
    '«İnteqrasiyalar» altında wanderer-i tapın və «İnstansiya URL-i» ilə API tokenini daxil edin. Tokeni wanderer-də «Settings», «Account», «API tokens» bölməsində yaradırsınız; o, wanderer_key_ ilə başlayır.',
  'help.guide.tour-wanderer-watch.goal': 'TREK idxal etdiyiniz cığırlardakı dəyişiklikləri arxa planda yoxlasın.',
  'help.guide.mcp-oauth.tip.3':
    '«API tokenləri» hələ də işləyir, amma «Köhnəlmiş» kimi işarələnib; OAuth müştərisinə keçin.',
  'help.guide.offline-conflicts.tip.2': 'Seçim yalnız bu cihaza aiddir.',
  'help.guide.default-user-settings.tip.1':
    'İstifadəçinin «Tənzimləmələr»də etdiyi öz seçimi həmişə üstündür; bu dəyərlər həmin tənzimləməni dəyişməmiş hər kəsə aiddir.',
  'help.guide.own-routing-engine.step.1':
    '«İstifadəçi standartları» bölməsində «Xəritə» altında OSRM serverinizin ünvanını «Şəxsi marşrut mühərriki» sahəsinə daxil edin.',
  'help.guide.admin-passkeys.tip.2':
    'Domeni sonradan dəyişsəniz, istifadəçilərin artıq əlavə etdiyi bütün keçid açarları işləməz olur.',
  'help.guide.instance-keys.tip.4': 'Amap açarı JS API açarı deyil, Web 服务 (veb xidməti) açarı olmalıdır.',
  'help.guide.rotate-jwt-secret.step.2': 'Xəbərdarlığı oxuyun və «Yenilə və çıx» düyməsinə klikləyin.',
  'help.guide.notification-defaults.tip.2': 'Standart dəyər yalnız həmin xananı özü dəyişməmiş şəxslərə aiddir.',
  'help.ctx.notifications.bullet.5':
    'Hansı hadisələri burada, hansılarını e-poçt, webhook, ntfy və ya push ilə alacağınızı «Tənzimləmələr»də, «Bildirişlər» altında seçirsiniz.',
  'help.guide.read-notifications.result': 'Bildirişin aid olduğu ekrandasınız, zəng işarəsindəki rəqəm isə bir azalır.',
  'help.guide.mark-notifications-read.title': 'Bildirişləri oxunmuş kimi işarələmək',
  'help.guide.delete-notifications.goal': 'Artıq lazım olmayanları silməklə siyahını qısa saxlayın.',
  'help.guide.notification-settings.step.1': 'Yuxarı sağda adınıza klikləyin.',
  'help.guide.public-link.step.5': 'Link mövcud olduqca seçimləri dəyişə bilərsiniz. «Linki sil» linki deaktiv edir.',
  'help.guide.link-journal.step.3':
    'Səyahətin hər iştirakçısı üçün «Giriş yoxdur», «Oxumaq» və ya «Redaktə et» seçin. «Hamı oxuya bilər» və «Heç kim» hamısını birdəfəlik təyin edir.',
  'help.guide.collapse-columns.tip.3': 'Ayırıcı fokusda olduqda onu ox düymələri ilə də hərəkət etdirə bilərsiniz.',
  'help.guide.edit-place.tip.3':
    'Pəncərənin kənarına klikləsəniz, dəyişiklikləriniz itmir: TREK əvvəlcə «Dəyişikliklər ləğv edilsin?» deyə soruşur, «Redaktəyə davam et» isə sizi formaya qaytarır.',
  'help.guide.dawarich-stays.goal':
    'Dawarich-in səyahət zamanı qeydə aldığı dayanma yerlərini hər birini yoxladıqdan sonra əlavə edin.',
  'help.guide.leave-stop-off-route.step.1':
    'Dayanacağa sağ klikləyin və ya üç nöqtəsinə klikləyin və «Marşruta daxil etmə» seçin.',
  'help.guide.move-booking-day.step.3':
    'Sətir indi yeni gündə, öz vaxtında görünür. Vaxtı da dəyişmək lazımdırsa, rezervasiyanı açın.',
  'help.guide.place-image-from-file.goal': 'Məkanın fayllarında artıq olan fotonu yenidən yükləmədən onun şəkli edin.',
  'help.guide.place-image-from-file.tip.3': 'Şəkli yalnız məkanları dəyişmək hüququ olan səyahətçilər dəyişə bilər.',
  'help.guide.place-own-hours.result':
    'Kartda sizin telefon nömrəniz, e-poçtunuz və iş saatlarınız göstərilir, şəklin ətrafındakı halqa isə saatlarınıza görə yaşıl və ya qırmızı olur.',
  'help.guide.confirm-stay-booking.step.4':
    'Rezervasiyanı yuxarı sağdakı X ilə bağlayın. «Rezervasiya» altında qalmanın kartında indi «Təsdiqlənib» yazılır.',
  'help.guide.tour-map-lines.title': 'Turlarınızı xəritədə tapmaq',
  'help.guide.tour-map-lines.tip.2':
    'Turu gizlətmək yalnız sizə aiddir və bu səyahət üçün bu brauzerdə saxlanır: tur, onun günləri və rəngi hamı üçün olduğu kimi qalır. «Turlar» siyahısının üstündəki «Hamısını göstər» gizlədilmiş bütün turları yenidən göstərir, telefondakı xəritə isə həmişə bütün turları göstərir.',
  'help.guide.car-stops.step.4':
    '«Yolboyu dayanacaqlar» altında yolun keçdiyi hər yer üçün «Ara dayanacaq əlavə et» düyməsinə klikləyin və həmin yeri seçin, istəsəniz yanında vaxt da göstərin. Yeri seçilməmiş dayanacaq yadda saxladıqda silinir.',
  'help.guide.transport-details.step.2':
    'Başlıqdakı nişanlar vəziyyəti, növü, günü və «Rezervasiya kodu»nu göstərir. «Gözləyir» və «Təsdiqlənib» arasında keçmək üçün vəziyyət nişanına klikləyin. Kod nişanındakı kiçik kopyalama işarəsi, «Rezervasiya kodunu kopyala», kodu mübadilə buferinə köçürür.',
  'help.guide.group-sort-bookings.step.3':
    '«Sıralama» altında «Tarix», «Başlıq», «Növ» və ya «Vəziyyət» seçin. Altındakı sətir ardıcıllığı tərsinə çevirir: tarixlər üçün «Əvvəlcə ən erkən» və ya «Əvvəlcə ən gec», qalanları üçün «A-dan Z-yə» və ya «Z-dən A-ya».',
  'help.guide.booking-on-map.title': 'Rezervasiyanı xəritədə tapmaq',
  'help.guide.export-bookings-csv.tip.1':
    'Sütunlar: «Növ», «Başlıq», «Vəziyyət», «Başlanğıc», «Son», «Kimdən», «Hara», «Məkan», «Təsdiq» və «Qeydlər».',
  'help.guide.arrange-packing-list.tip.1':
    '«A-dan Z-yə» aktiv olduqda elementləri sürükləmək olmur, amma bütöv siyahıları yenə də sürükləyə bilərsiniz.',
  'help.guide.count-packed-pieces.step.3':
    'Ədədlərin yalnız bir qismi yığıldıqda sayğac vurğu rənginizdə olur və işarə qutusu həmin rəngdə haşiyə alır. Bir ədədi saydan çıxarmaq üçün mənfiyə klikləyin.',
  'help.guide.expense-receipts.step.5':
    'Önizləmədə qəbz göstərilir, yuxarıda «Yeni tabda aç» və «Endir» var. Bir neçə qəbz olduqda ox düymələri ilə onlar arasında keçin, Esc önizləməni bağlayır.',
  'help.guide.files-sync-settings.step.3':
    'Qalan seçimləri görmək üçün axın panelinin altındakı «Tənzimləmələr» düyməsinə klikləyin.',
  'help.guide.manage-notes.step.3':
    'Həmin menyudakı «Bərkit» qeydi panelin yuxarısında saxlayır, onu kateqoriyasının rəngində çərçivə və başlığın yanında sancaqla göstərir. Həmin menyudakı «Bərkidilməni ləğv et» qeydi əvvəlki yerinə qaytarır.',
  'help.guide.note-categories.step.1':
    '«Qeydlər» kartının başlığında «Yeni qeyd» yanındakı dişli çarxa klikləyin. «Kateqoriyaları idarə et» açılır, hər kateqoriya üçün bir sətir: rəngi, adı, altı rəng nöqtəsi və zibil qutusu.',
  'help.guide.note-categories.tip.2':
    'Qeydi olmayan kateqoriya yalnız sizin brauzerinizdə saxlanır. Digər üzvlər onu yalnız həmin kateqoriyaya qeyd əlavə olunduqdan sonra görür.',
  'help.guide.roadtrip-reorder.goal':
    'Yolun ardıcıllığını dəyişin və ya dayanacağı birbaşa zolaqda başqa günə köçürün.',
  'help.guide.roadtrip-overnight.step.4':
    'Yanındakı «Yaşayış yeri tap» kopyalamaq üçün adı və rezervasiya saytlarına linkləri göstərir: otel üçün trivago və ya CHECK24, kempinq üçün PiNCAMP və ya Pitchup. Saytda yeri, tarixləri və qonaqları yoxlayın.',
  'help.guide.roadtrip-stop-fill.step.2':
    '«Doldurma səviyyəsi» altında 50 ilə 100 arasında seçin. Düymələrin altındakı sətir bununla buradan nə qədər gedə biləcəyinizi göstərir.',
  'help.guide.roadtrip-bookings.step.2':
    'Zolaqda gediş öz növünün rəngində kartdır: cədvəli çatma sütununda, başlanğıc və son nöqtələri isə başlığın altında göstərilir.',
  'help.guide.roadtrip-google-import.tip.1':
    'TREK dayanacaqlar arasında öz marşrutunu hesablayır; Google-un yolunu kopyalamır.',
  'help.guide.roadtrip-hazards.result':
    'Xəritə səyahətinizin ətrafındakı cari xəbərdarlıqları göstərir, marşrut isə dəyişmir.',
  'help.ctx.trip-tours.bullet.3':
    'Sətir: rəngli zolaq turun xəritədəki xəttidir, dairəvi xana marşrut limitini (T1-dən T6-ya qədər) və ya növü göstərir, kiçik GPX və ya wanderer nişanı idxalı bildirir, nişanlar isə günləri, vaxtı, məsafəni və qalxışı göstərir. Rəqəmli ay çoxgünlük turun mərhələlərinin sayını göstərir.',
  'help.guide.tour-show-list.step.3': 'Sətrə klikləyin. Turun kartı xəritənin üzərində açılır.',
  'help.guide.tour-add-to-day.goal':
    'Turu nə vaxt keçəcəyinizi planlaşdırın ki, o, xəritədəki xətti ilə birlikdə həmin gündə görünsün.',
  'help.guide.tour-add-to-day.tip.3':
    'Turu bir günə yalnız bir dəfə əlavə edə bilərsiniz. Onu artıq olduğu günə atsanız, TREK yalnız «Bu tur artıq həmin gündədir.» bildirir.',
  'help.guide.tour-day-times.step.4':
    'Tur günün növbəti bəndi başlayandan sonra bitirsə, sətrin altındakı qeyd bunu bildirir, məsələn, «Ends at 13:30, after Lunch at Gostner Schwaige starts at 12:30». Heç nə köçürülmür.',
  'help.guide.tour-remove-from-day.step.1':
    'Günlər sütununda kursoru turun sətrinin üzərinə gətirin, «Daha çox seçim» düyməsinə klikləyin və «Gündən çıxar» seçin.',
  'help.guide.tour-filter-list.step.1':
    '«GPX və ya KML idxal et» altındakı filtr düyməsinə klikləyin. Onda süzülən vəziyyət, əvvəlcə «Hamısı», yanında isə turların sayı göstərilir.',
  'help.guide.tour-hide-on-map.title': 'Turun xəttini xəritədə gizlətmək',
  'help.guide.tour-import-plan-tab.title': '«Plan» vərəqindən iz idxal etmək',
  'help.ctx.trip-tour-detail.title': 'Turun təfərrüatları',
  'help.guide.tour-detail-read.goal':
    'Səyahətdə tur haqqında olan bütün məlumatları görün: günləri, məsafəsi və hündürlükləri, profili və mənbəyi.',
  'help.guide.tour-detail-read.tip.1':
    'Sarı «use with caution» nişanı idxalda hündürlüklərin və ya ölçmələrin natamam olduğunu bildirir. Qalxışı və profili oxuyarkən bunu nəzərə alın.',
  'help.guide.tour-rename-colour.step.1':
    'Turun kartını açın və adının yanındakı qələmə klikləyin. Ad redaktə sahəsinə çevrilir.',
  'help.guide.tour-take-along.goal':
    'Turun başlanğıcına yol göstərişi alın, onun veb səhifəsini açın və ya marşrutunu GPX faylı kimi endirin.',
  'help.guide.tour-take-along.result': 'Xəritə tətbiqinizdə başlanğıca gedən yol, GPX faylında isə bütün marşrut var.',
  'help.guide.tour-copy-keep.tip.2':
    'Gün planında turun menyusundakı «Kolleksiyada yadda saxla» eyni pəncərəni açır, beləliklə, marşrut orada da saxlanır.',
  'help.guide.tour-packing-link.step.3': '«Əlaqələndir» düyməsinə klikləyin.',
  'help.guide.tour-files.goal':
    'Tura rezervasiya, xəritə və ya marşrutun təsvirini əlavə edin və onları turun kartından yenidən açın.',
  'help.guide.tour-activity-link.goal': 'Qeydə alınmış GPX izini planı dəyişmədən planlaşdırılmış tura bağlayın.',
  'help.guide.tour-activity-link.tip.3':
    '«Sərf olunan vaxt» izdəki ilk vaxt qeydindən sonuncuya qədər, fasilələr daxil olmaqla hesablanır.',
  'help.guide.tour-activity-compare.tip.1':
    '«Xəritədə müqayisə et» yalnız kart xəritənin yanında göstərildikdə mövcuddur, telefonda yoxdur.',
  'help.guide.tour-origin-check.tip.1':
    'Başqa səyahətdən götürülmüş turda «Götürüldüyü yer» altında həmin səyahətin və turun adı göstərilir.',
  'help.ctx.trip-tour-planner.bullet.3':
    'Sağ zolaq, «Bu səyahətin turları», bütün turları sadalayır, siyahının üstündə filtr və «Səfərin həcmi» var. Tur açıq olduqda yuxarıdakı «Turun xülasəsi» onun məsafəsini, qalxışını, vaxtını və hündürlük profilini göstərir. Yuxarıdakı artı, «Tur əlavə et», tur planlaşdırır, idxal edir və ya başqa səyahətdən götürür.',
  'help.guide.tour-open-workspace.step.3':
    'Sağ zolaq, «Bu səyahətin turları», səyahətin bütün turlarını sadalayır, siyahının üstündə filtr və «Səfərin həcmi» var.',
  'help.guide.tour-open-workspace.result':
    '«Turlar» vərəqi: solda redaktor, sağda səyahətin turları, aralarında isə xəritə.',
  'help.guide.tour-draw-route.step.6':
    '«Yol nöqtələri» altında hər nöqtə nömrəsi ilə bir sətir alır, ad yükləndikdən sonra isə yerin adı ilə adlanır. TREK işlədikcə «Yeni tur» yanındakı kiçik nöqtə vəziyyəti göstərir.',
  'help.guide.tour-type-profile.step.1':
    '«Turun adı» altındakı «Tur növü» düyməsinə klikləyin. Orada cari növ və onun necə planlaşdırıldığını izah edən bir sətir göstərilir.',
  'help.guide.tour-edit-points.goal': 'Nöqtələri xəritədə və ya siyahıda köçürməklə turun keçdiyi yeri dəyişin.',
  'help.guide.tour-edit-points.tip.2':
    'Yerin adı yüklənənə qədər sətirdə koordinatlar göstərilir. «Geri qaytar» və «Təkrar et» üçün klaviatura qısayolu yoxdur.',
  'help.guide.tour-shaping-points.tip.1': 'Başlanğıc və son həmişə dayanacaqdır.',
  'help.guide.tour-loop-reverse.step.3':
    'Bütün turu əks istiqamətdə keçmək üçün yanındakı «İstiqaməti dəyiş» düyməsinə klikləyin.',
  'help.guide.tour-leg-by-hand.step.2':
    'Hissə qırıq xətli düz xəttə çevrilir və siyahıda sətrin altında uzunluğu ilə birlikdə «Əllə çəkilib, marşrutlaşdırılmayıb» yazılır.',
  'help.guide.tour-trip-places.step.1':
    '«Yol nöqtələri» altında «Nöqtə əlavə et» yanındakı «Səfər yerləri» düyməsinə klikləyin. Səyahətin məkanları altında görünür.',
  'help.guide.tour-details-times.title': 'Turu adlandırmaq və vaxtını planlaşdırmaq',
  'help.guide.tour-details-times.tip.3':
    '«Ətraflı məlumat» bölməsini yığmaq üçün yanındakı oxa klikləyin. Sahələrindən birində «Yadda saxla»nın qəbul etmədiyi dəyər olduqda bölmə avtomatik açılır.',
  'help.guide.tour-save.tip.1':
    '«Yadda saxla» yanındakı «İmtina et» təsdiqdən sonra yadda saxlanmamış dəyişiklikləri ləğv edir. Saxlanmış tura təsir etmir.',
  'help.guide.tour-edit-saved.step.3':
    '«Yadda saxla» düyməsinə klikləyin. «Tur saxlanıldı» görünür, tur isə günlərini, fayllarını və qeydlərini saxlayır.',
  'help.guide.tour-summary-profile.step.1':
    '«Bu səyahətin turları»nın yuxarısındakı «Turun xülasəsi» redaktordakı turun «Məsafə», «Yüksəlmə» və «Enmə» göstəricilərini, təxmini vaxtını, fasilələri və planlaşdırılan ümumi vaxtı göstərir.',
  'help.guide.tour-list-manage.title': 'Səyahətin turlarını idarə etmək',
  'help.guide.tour-list-manage.tip.2':
    'Turun artıq olduğu gün günlər menyusunda boz görünür. Çoxgünlük turda TREK mərhələlərin həmin gündən başlayacağını, yoxsa bütün turun həmin günə yerləşəcəyini soruşur.',
  'help.guide.tour-delete.tip.2':
    'Turu sadəcə gündən çıxarmaq üçün bunun əvəzinə günün menyusundakı «Gündən çıxar» seçimindən istifadə edin.',
  'help.guide.tour-saved-elsewhere.step.4':
    'Hər ikisini saxlamaq üçün «Yeni tur kimi saxla», digər versiyanı yükləmək üçün «Yenisini yüklə», digər versiyanı özünüzünkü ilə əvəz etmək üçün isə «Üzərinə yaz» seçin.',
  'help.ctx.trip-tour-import.bullet.3':
    'İdxal «GPX turu» və ya «wanderer turu» kimi açılır: onun xətti, «Turun xülasəsi» və hündürlük profili tam idxal edildiyi kimidir. Siyahıdakı sətrində «GPX idxalı» nişanı olur.',
  'help.guide.tour-import-gpx.step.4':
    '«Bu kimi idxal et» altında izlərin nə olduğunu yoxlayın. «Yürüş» əvvəlcədən seçilib. «Velosiped turu» və ya «Qaçış» üçün profil, «Avarlı tur» üçün qayıq və su, «Xizək və qış» üçün isə idman növü soruşulur.',
  'help.guide.tour-view-import.title': 'İdxal edilmiş izə baxmaq',
  'help.guide.tour-view-import.result':
    'Qeydə alınmış izi heç nə yenidən hesablanmadan, tam idxal edildiyi kimi görürsünüz.',
  'help.guide.tour-plan-from-import.tip.2':
    'Kart təklifin uzun hissələrdə izdən uzaq olduğunu bildirirsə, onunla planlaşdırmazdan əvvəl həmin hissələri xəritədə yoxlayın.',
  'help.guide.tour-restore-recorded.step.3':
    '«Qeydə alınmış izi bərpa et» ilə təsdiqləyin. Yol nöqtələri və marşrutlaşdırılmış xətt silinir, günlər və qeydlər qalır.',
  'help.guide.tour-take-over.step.3':
    'Turu tapın: «Ada görə axtar» sahəsinə yazın və ya siyahını «Səyahət» və «Növ» filtrləri ilə daraldın.',
  'help.guide.tour-import-wanderer.title': 'wanderer-dən cığır idxal etmək',
  'help.guide.tour-import-wanderer.tip.3':
    'Səyahətdə artıq olan cığır «Bu səyahətdə» kimi işarələnir və «Turu aç» təklif edir. İdxaldan sonra dəyişmiş cığır köhnəsinin yanında «Yeni versiya kimi idxal et» təklif edir.',
  'help.ctx.trip-tour-map.bullet.4':
    'Sol paneldəki «Tur boyunca» kartı marşrutun yaxınlığında seyr nöqtələri, su, daxmalar, yemək yerləri və başqa yerləri axtarır və nəticələri sadalayır. Siyahıdakı yeri tura dayanacaq kimi əlavə edə bilərsiniz.',
  'help.guide.tour-map-layers.tip.1':
    'Seçdiyiniz xəritə səhifəni yenidən yükləyənə qədər açdığınız bütün turlar üçün qalır. Növü həmin xəritəni təklif etməyən tur «Xəritə» üzərində açılır, «Plan» vərəqindəki xəritə və «Tənzimləmələr»dəki ayar isə dəyişmir.',
  'help.guide.tour-along-search.step.4': '«Tur boyunca axtar» düyməsinə klikləyin. TREK yalnız axtarır: tur dəyişmir.',
  'help.guide.tour-along-add-stop.step.1':
    '«Tur boyunca» siyahısında yerə və ya xəritədəki sancağına klikləyin. Kartı xəritənin üzərində açılır: nə olduğu, marşrutdan nə qədər uzaq olduğu və turun hansı məsafəsində yerləşdiyi.',
  'help.guide.tour-3d-terrain.title': 'Turu 3D görünüşdə görmək',
  'help.guide.tour-3d-terrain.tip.1':
    'Görünüşü dəyişdikdən sonra həmin sətirdəki «İcmal» bütün marşrutu yenidən göstərir.',
  'help.guide.tour-3d-flyover.step.4': 'Bütün turu yenidən görmək üçün «İcmal» düyməsinə klikləyin.',
  'help.guide.tour-map-overlays.step.2':
    'Açarın yanındakı rəngli nöqtələrdən ibarət kiçik kvadrata, «Trass legendası»na klikləyin.',
  'help.ctx.trip-tour-stages.summary':
    'Çoxgünlük tur mərhələlərə bölünmüş bir marşrutdur, yolda olduğunuz hər gün üçün bir mərhələ. Burada hər günün harada bitdiyini təyin edir, hər mərhələnin ölçülərini görür və mərhələləri səyahətin günlərinə yerləşdirirsiniz.',
  'help.guide.tour-multi-day.step.1': '«Bu səyahətin turları» bölməsində turu redaktorda açmaq üçün ona klikləyin.',
  'help.guide.tour-multi-day.tip.3':
    'Mərhələnin vaxtına fasilələr daxil deyil. Xəbərdarlıq rəngindəki vaxt, «Bir gündən çox hərəkətdə», bir gündən uzundur.',
  'help.guide.tour-stages-on-days.step.4':
    'Mərhələləri görmək üçün ay və mərhələ sayı olan düyməyə, «Mərhələləri göstər»ə klikləyin.',
  'help.ctx.trip-tour-hike.title': 'Yürüşlər və qaçışlar',
  'help.guide.tour-hike-plan.title': 'Seçdiyiniz çətinlik daxilində yürüş planlaşdırmaq',
  'help.guide.tour-hike-plan.result':
    'Yürüş «Bu səyahətin turları» altında məsafəsi, qalxışı və yeriş vaxtı ilə görünür, günə əlavə edilməyə hazırdır.',
  'help.guide.tour-hike-trail-details.step.2':
    'Nəyin göstəriləcəyini seçin: yürüş dərəcəsi üçün SAC, «Səth» və ya «Yol növü». Xəritədəki marşrut siyahı ilə eyni rənglərdə göstərilir.',
  'help.guide.tour-hike-round.title': 'Təxminən istədiyiniz uzunluqda dairəvi yürüş tapmaq',
  'help.guide.tour-hike-round.tip.1':
    'Dairəvi marşrutlar yürüşün «Maksimum cığır çətinliyi» daxilində qalır; kartdakı T nişanı bunun hansı olduğunu göstərir.',
  'help.guide.tour-hike-compare-ways.step.4':
    '«Bu yolu seç» düyməsinə klikləyin. TREK marşrutun həqiqətən həmin yolla getdiyini marşrutlaşdırıcı ilə yoxlayır.',
  'help.guide.tour-ferrata-add.step.2':
    'Xəritədə via ferrata marşrutuna, onun qırıq xəttinə və ya işarəsinə klikləyin. Kartında adı, dərəcəsi və uzunluğu göstərilir.',
  'help.guide.tour-ferrata-add.tip.4':
    'Kartdakı «OpenStreetMap-də bax» via ferrata marşrutunun öz məlumatlarını açır. Heç nə yüklənə bilmədikdə nişan sarı olur, səbəbi isə ipucunda göstərilir.',
  'help.guide.tour-run-plan.result':
    'Qaçış «Bu səyahətin turları» altında «Qaçış vaxtı (planlaşdırılan)» ilə görünür, profili və tempi də onunla birlikdə saxlanır.',
  'help.guide.tour-run-ways.step.2':
    'Kartın yuxarısında indi qaçışın nə qədərinin asfaltsız olduğu və üzərindəki ən çətin dərəcəli cığır göstərilir.',
  'help.ctx.trip-tour-walk.bullet.2':
    '«Yol nöqtələri» dayanacaqları ardıcıllıqla sadalayır. Dayanacağın nömrəsi ətrafındakı halqa onu «Mütləq baxılmalı» (bütöv) və ya «İstəyə bağlı» (qırıq xətli) kimi, kiçik qalxan isə «Qorunur» kimi işarələyir; adın altındakı nişan orada nə qədər qalacağınızı göstərir.',
  'help.guide.tour-walk-plan.step.3':
    '«Yol nöqtələri»ndə kursoru dayanacağın üzərinə gətirin, yanındakı «Digər əməliyyatlar» düyməsinə klikləyin və «Dayanacağı redaktə et» seçin.',
  'help.guide.tour-walk-sights.title': 'Şəhər gəzintisinə yol boyu görməli yerlər əlavə etmək',
  'help.guide.tour-walk-sights.tip.2':
    'Marşrutu dəyişdikdən sonra düymədə «Yenidən axtar» yazılır, çünki tapılan yerlər köhnə marşruta aiddir.',
  'help.guide.tour-walk-day-times.step.4':
    'Hər dayanacağın altında nə vaxt çatacağınız və nə qədər qalacağınız göstərilir. Yer həmin vaxt bağlıdırsa və ya qalma zamanı bağlanırsa, xəbərdarlıq görünür.',
  'help.guide.tour-walk-google-import.step.1':
    '«Bu səyahətin turları» bölməsində «Tur əlavə et» (yuxarıdakı +) düyməsinə klikləyin və «Google Maps-dən gəzinti idxal et» seçin.',
  'help.guide.tour-walk-check-off.title': 'Gəzintinin dayanacaqlarını həmin gün işarələmək',
  'help.guide.tour-walk-check-off.tip.3':
    'Gəzintini oflayn olarkən günə əlavə etmisinizsə, sinxronlaşdıqdan sonra onu işarələyə bilərsiniz.',
  'help.guide.tour-bike-profile.title': 'Sürmə tərzinizə uyğun velosiped turu planlaşdırmaq',
  'help.guide.tour-bike-profile.result':
    'Velosiped turu yadda saxlanır və «Bu səyahətin turları» altında görünür: marşrutu profilinə görə qurulub, sürmə vaxtı isə «Turun xülasəsi»ndə göstərilir.',
  'help.guide.tour-bike-surfaces.step.1':
    'Sağdakı «Bu səyahətin turları» bölməsində velosiped turunu açmaq üçün ona klikləyin. Marşrut hesablandıqdan sonra «Yol nöqtələri» altında «Səth və yollar» kartı görünür.',
  'help.guide.tour-bike-surfaces.tip.4':
    'Kartı yığmaq üçün başlığına klikləyin. Səhifəni yenidən yüklədikdən sonra da bu brauzerdə yığılmış qalır.',
  'help.guide.tour-bike-mtb-grades.tip.2':
    'Xəritəçilər yoxuşlara dərəcə veribsə, aşağıda öz sətirləri ilə «Yoxuş çətinliyi (mtb:scale:uphill)» göstərilir.',
  'help.ctx.trip-tour-ski.bullet.4':
    'Yol nöqtələrinin altındakı «Pist marşrutu» kartı günü «Xizək sürmə», «Liftlərdə», «Gözləmə» və «Piyada» hissələrinə bölür, pistlərin uzunluğunu, onlarda endiyiniz hündürlüyü və lift gedişlərini göstərir. Bütün hissələr planlaşdırıldıqdan sonra sağdakı «Turun xülasəsi»ndə «Xizək vaxtı» bunları toplayır.',
  'help.guide.tour-ski-plan.step.5':
    'Hər nöqtənin altında onun hissəsi nişanlar kimi sadalanır: hər pist, lift və piyada hissə adı və ya növü ilə, pistlər dərəcələrinin rəngində nöqtə ilə, hər biri dəqiqələri ilə.',
  'help.guide.tour-ski-options.goal':
    'Ən çətin pistləri, nəyə üstünlük verildiyini, tempinizi və hansı liftlərdən istifadə ediləcəyini təyin edin ki, hissələr sizə uyğun olsun.',
  'help.guide.tour-ski-options.tip.3':
    '«Təxmin edilən əlaqələrdən qaç» marşrutu xəritə məlumatlarının yalnız təxmin etdiyi birləşmələrdən, məsələn, iki pist arasında xəritədə olmayan hissədən kənarda saxlayır.',
  'help.guide.tour-ski-fix-leg.tip.2':
    'Ərazi üçün pist məlumatları hələ yüklənirsə, planlaşdırıcı gözləyir və avtomatik yenidən cəhd edir.',
  'help.guide.tour-ski-summary.step.3':
    'Sağdakı «Turun xülasəsi»ndə «Xizək vaxtı» hamısını toplayır. Onun məlumat nöqtəsi necə hesablandığını izah edir.',
  'help.guide.tour-ski-pistes-layer.step.1':
    '«Xizək və qış» turu açıq olduqda xəritə pistləri avtomatik göstərir. Xəritənin aşağı solundakı sırada qarlı dağ açarı onları söndürüb yandırır; ipucunda «Trasslar, xizək qaçışı yolları və liftlər» yazılır.',
  'help.guide.tour-ski-import.goal':
    'Qeydə alınmış xizək, xizək qaçışı və ya qar ayaqqabısı izini idxal edin və ona düzgün idman növü verin.',
  'help.guide.tour-ski-import.tip.2':
    'Onu planlaşdırılmış tur kimi redaktə etmək üçün «Redaktə edilə bilən versiya» kartındakı «Redaktə edilə bilən versiya planlaşdır» seçimindən istifadə edin. Onun nöqtələri düz xətlərlə birləşdirilir.',
  'help.ctx.trip-tour-paddle.bullet.4':
    '«Vaxt təxmini» suda keçən vaxtı, qayığın daşınmasını, sudan çıxıb yenidən girməyi, şlüzləri və fasilələri dəyişə biləcəyiniz sürət və dəqiqələr əsasında toplayır.',
  'help.guide.tour-paddle-setup.step.4':
    '«Su» altında «Çay» və ya «Göl» seçin. Həm qayıq, həm su növü seçilməyənə qədər turu yadda saxlamaq olmur.',
  'help.guide.tour-paddle-setup.result':
    'Qayığı, su növü və sürəti təyin edilmiş yeni avarçəkmə turu xəritədə ilk nöqtəsini gözləyir.',
  'help.guide.tour-paddle-water-route.tip.1':
    'Su məlumatları olmayan yerdə TREK instansiyanın necə qurulmasından asılı olaraq onları bölgə üçün ya avtomatik yükləyir, ya da admindən istəyir. Bu zaman hissədə «Su məlumatı yüklənir» yazılır və məlumat gəldikdən sonra, adətən bir-üç dəqiqə ərzində, avtomatik planlaşdırılır.',
  'help.guide.tour-paddle-portage.step.2':
    '«Qayığı buradan daşı» seçin. Növbəti nöqtəyə qədər olan hissə quruda çəkilmiş daşımaya çevrilir.',
  'help.guide.tour-paddle-lock.title': 'Şlüz və onun gözləmə vaxtını əlavə etmək',
  'help.guide.tour-paddle-lock.tip.3': '«Şlüzü sil» açıq kartın aşağısında və «Digər əməliyyatlar» menyusundadır.',
  'help.guide.tour-paddle-time.step.5':
    'Bütün şlüzlərin vaxtları daxil edilməyənə qədər təxmində «Natamam» yazılır və sətirlərin altındakı qeyd nəyin çatışmadığını sadalayır.',
  'help.guide.tour-paddle-wind.step.2':
    'Küləyin istiqamətini, «Orta» və «Ani əsmələr» göstəricilərini yoxlayın. «Orta» günün ən güclü saatlıq orta dəyəri, «Ani əsmələr» isə ən güclü ani əsmədir.',
  'help.guide.tour-paddle-checklist.title': 'Maneələrin yoxlama siyahısını keçmək',
  'help.guide.tour-paddle-checklist.tip.2':
    '«Ətrafından daşı» daşımanı avtomatik planlaşdırmır. Onu xəritədə qurmaq üçün «Daşımanı planlaşdır» düyməsinə klikləyin.',
  'help.guide.tour-paddle-track-marks.step.2':
    '«İdxal önbaxışı»nda «Bu kimi idxal et» seçimini «Avarlı tur» edin, sonra «Qayıq» və «Su» seçin. Hər ikisi seçilməyənə qədər idxal davam etmir.',
  'help.guide.tour-paddle-track-marks.tip.3':
    'Qeydə alınmış izdə «Vaxt təxmini»nin «Su» sətrinin öz sürəti var: ona klikləyin və hansı sürətlə avar çəkdiyinizi yazın.',
  'help.ctx.trip-tour-horse.bullet.5':
    'GPX faylından idxal edilmiş at gəzintisi tam qeydə alındığı kimi qalır, «Qeydə alınmış gəzinti» kartı isə idxalın nəyi hesablaya bilmədiyini göstərir.',
  'help.guide.tour-horse-plan.step.6':
    '«Hissəni götür» düyməsinə klikləyin. Hissə «Yol nöqtələri» kartında marşrutun adı ilə nişan şəklində gəzintiyə əlavə olunur. Başqa hissələri də eyni qaydada əlavə edin.',
  'help.guide.tour-horse-gap.title': 'At marşrutları arasındakı boşluğu birləşdirmək',
  'help.guide.tour-horse-gap.tip.2':
    'Xəritədə kliklədiyiniz nöqtələr də gəzintiyə eyni qaydada, düz və yoxlanılmamış hissələr kimi əlavə olunur.',
  'help.guide.tour-horse-recorded.result':
    'At gəzintisi səyahətdə tam keçdiyiniz kimidir, məsafəsi və hündürlükləri fayldan götürülüb.',
  'help.guide.dateless-trip.step.3': '«Yeni səyahət yarat» düyməsinə klikləyin.',
  'help.guide.trip-reminder.tip.2':
    'Yeni səyahətdə yola düşməzdən 3 gün əvvəl xatırlatma avtomatik qurulur. Onun hansı kanallarla göndəriləcəyini «Tənzimləmələr», «Bildirişlər» bölməsində seçirsiniz.',
  'help.guide.upcoming-reservations.result':
    'Səyahət açılır. İdarə panelinə qayıtdıqda vidcet növbəti gələnləri göstərməyə davam edir.',
  'help.guide.entitlement.tip.2':
    'Birləşdirilmiş planda hər kəsin öz sətri olur və başqalarının məzuniyyət limitini də təyin edə bilərsiniz.',
  'help.guide.half-company-holiday.step.3': 'Günə klikləyin. Xananın yarısı sarı olur.',
  'help.guide.school-holidays.tip.2':
    'Tətil gününün adını «Məktəb tətilləri» altında görmək üçün kursoru həmin günün üzərinə gətirin.',
  'help.guide.answer-fusion-request.step.3':
    'Planları birləşdirmək üçün «Qəbul et və birləşdir», planınızı ayrı saxlamaq üçün «Rədd et» düyməsinə klikləyin.',
  'help.guide.log-for-partner.step.3':
    'Qeyd etmək istədiyiniz günlərə klikləyin, sonra «Nəfər» bölməsində yenidən öz adınıza klikləyin.',
  'help.guide.dissolve-fusion.result':
    'Hər kəs öz qeydləri ilə öz planına qayıdır, «Nəfər» siyahısında isə yalnız siz qalırsınız.',
  'help.guide.country-places.result': 'Planlaşdırıcı məkanın aid olduğu səyahətdə açılır.',
  'help.guide.tour-activity-stats.step.6':
    'Baş tutmamış tur üçün sətrinin sonundakı dairəvi düyməyə, «Çıxar»a klikləyin. Tur siyahıda solğun halda və «Daxil edilməyib» işarəsi ilə qalır. Həmin düymə, indi «Yenidən say», onu yenidən hesaba qatır.',
  'help.guide.move-to-list.tip.1':
    'Etiketlər bir siyahıya aiddir, ona görə köçürülmüş və ya kopyalanmış məkanın yeni siyahıda etiketi olmur.',
  'help.guide.accept-list-invite.step.1':
    'Dəvəti siyahılar zolağında «Dəvətlər» altında tapın. Dəvət bildirişindən gəlmisinizsə, kart səhifənin yuxarısındadır. Kartda siyahının adı və dəvəti kimin göndərdiyi yazılır.',
  'help.guide.tour-collection-add-to-trip.tip.1':
    'Yeni tur hələ heç bir günə əlavə olunmayıb və məkan əlavə etmir. Nə siyahı, nə də orijinal tur dəyişir.',
  'help.guide.tour-collection-manage.step.3':
    'Turun sətrinin sonundakı zibil qutusuna klikləyin və «Kolleksiyadan çıxar» ilə təsdiqləyin.',
  'help.ctx.journey-detail.bullet.7':
    'Dawarich qoşulubsa, gün başlığında həmçinin «Qeydi götür» (və ya gün üçün saxlanmış marşrutun məsafəsi) və «Günü köçür» görünür. Gözləyən dayanmaları olan gündə dayanmalar günün sonunda bir sətirdə qruplaşdırılır.',
  'help.guide.entry-draft.tip.1':
    'İştirakçılar qaralamanı yenə də görür. Onu yalnız ictimai link, siz «Qaralama»nı söndürənə qədər gizlədir.',
  'help.guide.journey-map-layers.tip.2':
    'Solğun açarın hələ göstərəcəyi bir şey yoxdur, səbəbi ipucunda yazılır. Seçiminiz bu brauzerdə hər gündəlik üçün ayrıca saxlanır.',
  'help.guide.journey-keep-route.tip.2':
    'Sonradan Dawarich ilə yenidən müqayisə etmək üçün gün başlığındakı məsafəyə klikləyin: «Əvəz et» yeni versiyanı götürür, «Marşrutu sil» günün marşrutunu gündəlikdən silir.',
  'help.guide.journey-day-stays.tip.2':
    'Çox hadisəli gün üçün sətrin sonundakı «Günü köçür» bütün dayanmaları birdəfəlik emal edir.',
  'help.guide.journey-take-over-day.tip.1':
    'Həmin düyməyə klikləyənə qədər heç nə saxlanmır və heç nə iki dəfə saxlanmır: gündəlikdə artıq olan dayanma işarələnir və yenidən seçilə bilməz.',
  'help.guide.journey-auto-prepare.tip.1':
    'Yalnız tarixləri olan əlaqələndirilmiş səyahətlərin günləri hazırlanır və gündəliyə avtomatik heç nə əlavə edilmir.',
  'help.guide.photo-location.result':
    'Məkanı olmayan qeyd GPS məlumatlı ilk fotosunun çəkildiyi yeri alır və xəritədə görünür.',
  'help.guide.contributors.tip.2':
    '«Səyahətlər vasitəsilə» əlaqələndirilmiş səyahət sayəsində girişi olan şəxsləri sadalayır. Onların girişini burada deyil, həmin səyahətin tənzimləmələrində dəyişin.',
  'help.ctx.settings-plugins.bullet.2':
    'Plagin öz kartına təsdiqinizdən sonra icra olunan «Əməliyyatlar», sizin adınızdan başqa xidmətə daxil olduqda isə «Qoşul» və ya «Bağlantını kəs» düymələri əlavə edə bilər.',
  'help.guide.web-push-device.tip.1':
    'Push hər brauzer üçün ayrıca işləyir: bildiriş almaq istədiyiniz hər telefon və kompüterdə bunu təkrarlayın. «Bu cihaz üçün deaktiv et» onu yalnız həmin cihazda dayandırır.',
  'help.guide.connect-airtrail.step.2':
    '«Öz-özünə imzalanmış sertifikatlara icazə ver» yalnız öz şəbəkənizdəki etibarlı instansiya üçündür. «Dəyişiklikləri AirTrail-ə geri yaz» standart olaraq söndürülüb, yəni TREK yalnız oxuyur; redaktələrinizi geri göndərmək üçün onu yandırın.',
  'help.guide.connect-dawarich.step.2':
    '«Yeni dayanma qeydlərini avtomatik yoxla» TREK-ə özbaşına yoxlamağa imkan verir. Söndürülübsə, TREK Dawarich-i yalnız siz istədikdə oxuyur. «Öz-özünə imzalanmış sertifikata icazə ver» yalnız serverinizin etibar etmədiyi instansiya üçündür.',
  'help.guide.tour-connect-wanderer.step.2':
    '«Özü tərəfindən imzalanmış sertifikata icazə ver» açarını yalnız öz şəbəkənizdəki instansiya üçün yandırın.',
  'help.guide.tour-wanderer-watch.step.1':
    'wanderer kartında «Marşrutlarımdakı dəyişiklikləri yoxla» açarını yandırın. Bunun üçün əvvəlcə bağlantı yadda saxlanmalıdır.',
  'help.guide.plugin-settings.title': 'Plagini özünüz üçün qurmaq',
  'help.guide.default-user-settings.tip.2':
    '«Göstərilən valyuta» məbləğləri yalnız görüntü üçün çevirir. «Xərclər» bölməsində daxil edilmiş məbləğlər olduğu kimi qalır.',
  'help.guide.own-routing-engine.step.2':
    'Ödənişli yollardan, magistrallardan və ya bərələrdən yan keçən marşrutlar üçün Valhalla ünvanınızı «Şəxsi Valhalla instansiyası» sahəsinə daxil edin. Hər sahə ondan çıxdıqda yadda saxlanır; sonra TREK serverini yenidən başladın və səhifəni yeniləyin.',
  'help.guide.admin-passkeys.tip.3':
    'İstifadəçi keçid açarları olan cihazı itiribsə, onları «İstifadəçini redaktə et» pəncərəsindəki «Keçid açarlarını sıfırla» ilə silin.',
  'help.guide.rotate-jwt-secret.result':
    'Yeni imza sirri qüvvəyə minib və siz də daxil olmaqla bütün istifadəçilər yenidən daxil olmalıdır.',
  'help.guide.read-notifications.title': 'Bildirişlərinizi oxumaq',
  'help.guide.filter-notifications.title': 'Bütün bildirişlərə və ya yalnız oxunmamışlara baxmaq',
  'help.guide.mark-notifications-read.goal':
    'Yenilikləri gördükdən sonra vurğulamanı və zəng işarəsindəki rəqəmi götürün.',
  'help.guide.delete-notifications.step.1':
    'Yalnız bir bildirişi silmək üçün onun vaxtının yanındakı zibil qutusuna, «Sil»ə klikləyin.',
  'help.guide.notification-settings.step.2': 'Menyuda «Tənzimləmələr» seçin.',
  'help.guide.public-link.tip.3': 'Seçimin nəyi gizlətdiyini oxumaq üçün kursoru onun üzərinə gətirin.',
  'help.guide.link-journal.step.4':
    'Sarı qeydi oxuyun: orada gündəliyə ilk dəfə kimin giriş əldə edəcəyi yazılır. Sonra «Gündəliyi bağla» düyməsinə klikləyin.',
  'help.guide.dawarich-stays.step.1':
    '«Tənzimləmələr», «İnteqrasiyalar» bölməsində Dawarich qoşulubsa, məkanlar siyahısının üstündə «Dawarich-dən» görünür. Başlığında TREK-in son dəfə nə vaxt yoxladığı və neçə dayanmanın gözlədiyi yazılır. Siyahını açmaq üçün ona klikləyin.',
  'help.guide.leave-stop-off-route.step.2':
    'Adın yanında «Marşrutdan kənar» nişanı görünür. Dayanacaq gündə və xəritədə qalır, amma günün marşrutu və hissə vaxtları onu nəzərə almır.',
  'help.guide.move-booking-day.result': 'Rezervasiya planda yeni günə aiddir, vaxtı isə dəyişməyib.',
  'help.guide.clear-day.tip.2': 'Bu menyu bəndi yalnız məkanları olan gündə görünür.',
  'help.guide.place-image-from-file.step.1':
    '«Fayl» bölməsində foto olan məkanı açın. Kartın aşağısına yaxın «Fayl» bloku məkanın neçə faylı olduğunu göstərir.',
  'help.guide.place-own-hours.title': 'Məkanın iş saatlarını, telefonunu və ya e-poçtunu düzəltmək',
  'help.guide.place-own-hours.tip.1':
    'Daxil etdiyiniz saatlar TREK-in tapdıqlarını əvəz edir, beləliklə, mövsümi iş saatları olan kafedə sizin bildiyiniz saatlar göstərilir.',
  'help.guide.day-panel.tip.3':
    'Təqvimə görə planlaşdırırsınız? «Tənzimləmələr»də, «Ümumi» altında «Gün başlıqlarında əvvəlcə tarix» açarını yandırın: başlıqda əvvəlcə tarix, altında isə «Gün 1» və ya günün adı göstərilir.',
  'help.guide.confirm-stay-booking.result':
    'Otel rezervasiyası həm qalmanın kartında, həm də «Rezervasiyalar» vərəqində təsdiqlənib.',
  'help.guide.tour-map-lines.goal':
    'Səyahətin turlarını xəritədə bir-birindən ayırın, xəttindən birini açın və hazırda lazım olmayanları gizlədin.',
  'help.guide.tour-map-lines.tip.3':
    'Gün planında turun sətrinin menyusundakı «Marşruta daxil etmə» o deməkdir ki, günün marşrutu artıq turun başlanğıcına və sonuna getmir. «Yenidən marşruta əlavə et» onları yenidən birləşdirir.',
  'help.guide.car-stops.step.5':
    'Dayanacaqların ardıcıllığı marşrutdur. Dayanacağın solundakı «Yuxarı daşı» və «Aşağı daşı» onu dəyişir, sağındakı çarpaz, «Dayanacağı sil», onu silir.',
  'help.guide.transport-details.step.3':
    'Aşağıdakı xanalar yola düşmə və çatmanı stansiya və ya aeroportları ilə, təyin olunubsa, platforma və oturacağı göstərir. Arada dayanacaqları olan gedişdə onlar «Marşrut» altında, hissə-hissə rezerv edilmiş gedişdə isə hər hissənin kodu «Seqment kodları» altında sadalanır. Sonra «Səyahətçilər», «Qeydlər», «Xərclər» və «Fayl» gəlir; «Fayllarda göstər» bileti «Fayl» vərəqində açır.',
  'help.guide.export-transports-csv.title': 'Nəqliyyatı cədvəl kimi ixrac etmək',
  'help.guide.group-sort-bookings.step.4':
    'Bölməni yığmaq üçün başlığına klikləyin. Yanındakı rəqəm içində neçə rezervasiya olduğunu göstərir, ikinci klik onu yenidən açır.',
  'help.guide.booking-on-map.goal': 'Rezervasiyadan onun plandakı və xəritədəki yerinə keçin.',
  'help.guide.export-bookings-csv.tip.2':
    'Sütunlar nöqtəli vergüllə ayrılır və Excel faylı xüsusi hərflər pozulmadan açır.',
  'help.guide.arrange-packing-list.tip.2':
    'TREK «A-dan Z-yə» seçimini bu brauzerdə yadda saxlayır, ona görə siyahı növbəti dəfə də sıralanmış açılır. Bu, yalnız sizin gördüyünüzü dəyişir, başqalarının gördüyü sıranı heç vaxt dəyişmir.',
  'help.guide.count-packed-pieces.step.4': 'Sayğac miqdara çatdıqda element avtomatik işarələnir və yığılmış sayılır.',
  'help.guide.expense-receipts.result':
    'Qəbz xərclə birlikdə saxlanır: sətrindəki nişan onu açır, fayl isə həm də səyahətin «Fayl» bölməsindədir.',
  'help.guide.files-sync-settings.step.4':
    '«Sənəd silindikdə» altında digər tərəfdəki nüsxəyə nə olacağını seçin. «Hər iki nüsxəni saxla» saxlama xidmətindəki nüsxəyə toxunmur. «Zibil qutusuna köçür» sənəd TREK-də silindikdə onu saxlama xidmətinin zibil qutusuna göndərir.',
  'help.ctx.trip-collab.bullet.7':
    'Burada hər şey üçün internet bağlantısı lazımdır. Oflayn olduqda mesaj, qeyd, link, sorğu və ya səs saxlanmır və TREK «This needs a connection. Try again once TREK is back online.» bildirir. Collab-ı redaktə etmək hüququ olmayan üzvlər hər şeyi oxuya bilər, amma onlar üçün «Yeni qeyd», «Link əlavə et» və «Yeni sorğu» yoxdur, mesaj sahəsi isə boz görünür.',
  'help.guide.manage-notes.step.4':
    '«Redaktə et» qeyd pəncərəsini bütün sahələri doldurulmuş halda açır. Lazım olanı dəyişin, burada «Məzmun» altına bir sətir əlavə edilib, və «Yadda saxla» düyməsinə klikləyin.',
  'help.guide.note-categories.step.2':
    'Aşağıdakı «Yeni kateqoriya...» sahəsinə ad yazın və Enter basın və ya yanındakı artıya klikləyin. Yeni kateqoriya növbəti rəngi və öz sətrini alır.',
  'help.guide.note-categories.tip.3':
    'Kartda kateqoriya yalnız başlıqdakı rəngli nöqtə ilə göstərilir. Adını görmək üçün kursoru nöqtənin üzərinə gətirin.',
  'help.guide.roadtrip-reorder.step.1':
    'Dayanacağı sətrindən tutub sürükləyin və eyni günün başqa dayanacağının üzərinə buraxın. O, həmin dayanacağın yerini tutur və günün marşrutu yeni ardıcıllıqla yenidən qurulur.',
  'help.guide.roadtrip-overnight.step.5':
    '«Əlavə et» düyməsinə klikləyin. Gecələmə bu gündən növbəti günə qədər rezerv edilir və yer marşruta həmin günün gecəsi kimi əlavə olunur.',
  'help.guide.roadtrip-stop-fill.step.3':
    'Dayanacaq üçün yenidən öz ayarınızdan istifadə etmək üçün nişanı təkrar açın və «Standart seçimimdən istifadə et» düyməsinə klikləyin.',
  'help.guide.roadtrip-bookings.step.3':
    '«Giriş» və ya «Minmə» nişanı sizin terminala nə vaxta qədər çatmalı olduğunuzu göstərir: yola düşmə cədvəldəkindən həmin qədər əvvələ salınır.',
  'help.guide.roadtrip-google-import.title': 'Google Maps-dən marşrut idxal etmək',
  'help.guide.roadtrip-google-import.tip.2':
    'Linkdə TREK-in xəritədə yerləşdirə biləcəyi ən azı iki, ən çoxu 30 dayanacaq olmalıdır.',
  'help.guide.roadtrip-hazards.tip.1':
    'Xəbərdarlıqlar yol bağlanması demək deyil: marşrut onlara görə heç vaxt dəyişmir və bunlar sizin tarixləriniz üçün proqnoz deyil, cari bildirişlərdir.',
  'help.ctx.trip-tours.bullet.4':
    'Göz («Xəritədə gizlət») və dairəvi + («Günə əlavə et») işarələrini görmək üçün kursoru sətrin üzərinə gətirin. Turu bir günə planlaşdırmaq üçün sətri sol sütundakı günə sürükləyin, ya da turun kartını xəritənin üzərində açmaq üçün ona klikləyin.',
  'help.guide.tour-show-list.step.4':
    'Kartda turun ölçüləri, «Səyahət günləri» altında isə onun olduğu günlər göstərilir. Marşrutun özünü dəyişmək üçün «Turlar» vərəqini açın və «Bu səyahətin turları» altında tura klikləyin.',
  'help.guide.tour-add-to-day.step.1':
    'Kursoru siyahıdakı turun üzərinə gətirin və sətrin sağındakı dairəvi + düyməsinə («Günə əlavə et») klikləyin.',
  'help.guide.tour-add-to-day.tip.4':
    'Gün açıq olduqda (başlığına klikləyin) turun kartı həmin gün üçün də «Günə əlavə et» təklif edir. Günlərin üstündəki geri qaytarma oxu təyinatı ləğv edir.',
  'help.guide.tour-day-times.tip.1': 'Daxil etdiyiniz bitmə vaxtı hesablanmış vaxtı əvəz edir.',
  'help.guide.tour-remove-from-day.step.2':
    'Tur sağdakı siyahıda qalır. Onun gün nişanı yox olur və filtr onu yenidən «Planlaşdırılmayıb» altında sayır.',
  'help.guide.tour-filter-list.step.2':
    '«Vəziyyət» altında hələ heç bir gündə olmayan turlar üçün «Planlaşdırılmayıb», artıq bir gündə olanlar üçün «Planlaşdırılıb» seçin. Hər sətirdə neçə turun uyğun gəldiyi göstərilir.',
  'help.guide.tour-hide-on-map.goal': 'Hazırda lazım olmayan turları başqaları üçün dəyişmədən xəritədə gizlədin.',
  'help.guide.tour-import-plan-tab.goal': 'Günləri planlaşdırarkən GPX və ya KML izini tur kimi idxal edin.',
  'help.ctx.trip-tour-detail.summary':
    '«Plan» vərəqində tur seçdikdə xəritənin üzərində açılan kart: günləri, ölçüləri və profili, haradan gəldiyi, həmçinin onu telefona göndərmək, kopyalamaq, kolleksiyada saxlamaq və ya baqaj siyahısına bağlamaq üçün düymələr.',
  'help.guide.tour-detail-read.step.1':
    'Sağ sütunun yuxarısında «Məkan»dan «Turlar»a keçin, sonra tura klikləyin. Kartı xəritənin üzərində açılır. Gün içindəki sətri və ya xəritədəki xətti də eyni kartı açır.',
  'help.guide.tour-detail-read.tip.2':
    'Avarçəkmə turunda hündürlüklər və profil göstərilmir: nöqtələri sahildədir, ona görə hündürlüklər yanlış olardı.',
  'help.guide.tour-rename-colour.step.2':
    'Yeni adı yazın və dairəvi təsdiq düyməsinə klikləyin və ya Enter basın. Escape köhnə adı saxlayır.',
  'help.guide.tour-take-along.step.1':
    'Turun kartını açın. Kartın aşağısındakı «Naviqasiya» turun başlanğıcını xəritə tətbiqində açır, bir neçə tətbiq varsa, əvvəlcə onları sadalayır. O, sizi marşrut boyunca deyil, başlanğıca aparır.',
  'help.guide.tour-copy-keep.title': 'Turu kopyalamaq və ya kolleksiyada saxlamaq',
  'help.guide.tour-copy-keep.tip.3':
    '«Turlar» vərəqində sol sütunun yuxarısındakı əlfəcin açıq tur üçün eyni işi görür. Turda yadda saxlanmamış dəyişikliklər varsa, əvvəlcə onu yadda saxlamağı xahiş edir.',
  'help.guide.tour-packing-link.step.4':
    'Kartda indi siyahı, elementlərindən neçəsinin yığıldığı, zolaq və ilk elementlər göstərilir. Yığılmış elementlərin üstündən xətt çəkilir.',
  'help.guide.tour-files.step.1':
    'Turun kartını açın və sonundakı «Fayl» bölməsinə qədər sürüşdürün. Bölmənin başlığındakı «Yüklə» düyməsinə klikləyin və bir və ya bir neçə fayl seçin.',
  'help.guide.tour-activity-link.step.1':
    'Planlaşdırılmış turun kartını açın və «Faktiki iz» bölməsinə qədər sürüşdürün. «Faktiki iz əlavə et» düyməsinə klikləyin.',
  'help.guide.tour-activity-link.result': 'İz tura bağlanır və kartda plan ilə əslində etdiyiniz yan-yana göstərilir.',
  'help.guide.tour-activity-compare.tip.2':
    'Atlasdakı tur fəaliyyətləri planlaşdırılmış dəyərlər əvəzinə bağlanmış izi hesablayır.',
  'help.guide.tour-origin-check.tip.2':
    'wanderer-dən gələn turda mənbəyin yanında ox, «wanderer-də aç», bölmənin başlığında isə «Mənbəni yoxla» var. Yoxlama wanderer-dən cığırın idxaldan sonra dəyişib dəyişmədiyini soruşur. Bundan sonra «Yeni snapşot kimi idxal et» yeni versiyanı ayrıca tur kimi idxal edir. Bu tur öz günlərini və qeydlərini saxlayır.',
  'help.ctx.trip-tour-planner.bullet.4':
    '«Nöqtə əlavə et» aktiv olduqca (xəritədəki paneldə «Nöqtə qoy») xəritəyə klik nöqtə qoyur. Sancağı yerini dəyişmək üçün sürükləyin, forma nöqtəsi əlavə etmək üçün çəkilmiş marşruta klikləyin, səyahətin məkanını isə «Səfər yerləri» ilə seçin.',
  'help.guide.tour-open-workspace.step.4':
    'Sağ zolağın yuxarısındakı artı, «Tur əlavə et», «GPX və ya KML idxal et», «Google Maps-dən gəzinti idxal et» və «Başqa səfərdən tur götür» təklif edir. Tur açıq olduqda orada «Yeni tur planlaşdır» da olur.',
  'help.guide.tour-draw-route.title': 'Yeni tur çəkmək',
  'help.guide.tour-draw-route.tip.1':
    '«Nöqtə qoy» aktiv olduqda kursor nişangah şəklində olur. Nöqtə əlavə etmədən xəritəni sürüşdürmək üçün onu söndürün. 3D görünüşdə o, söndürülmüş başlayır, çünki 3D-də ətrafa baxmaq üçün xəritəni sürükləyirsiniz.',
  'help.guide.tour-type-profile.step.2':
    'Siyahıdan növü seçin: «Yürüş», «Şəhər / görməli yerlər gəzintisi», «Qaçış», «Velosiped turu», «Avarlı tur», «At gəzintisi» və ya «Xizək və qış». Hər birində nəyi planlaşdırdığı yazılır, yeni növ isə marşrutu yenidən planlaşdırır.',
  'help.guide.tour-edit-points.step.1':
    'Xəritədə nömrəli sancağı nöqtənin olmalı olduğu yerə sürükləyin. Marşrut yeni yerdən keçməklə yenidən planlaşdırılır.',
  'help.guide.tour-edit-points.result':
    'Nöqtələr istədiyiniz yerdə və ardıcıllıqdadır, marşrut isə yenidən planlaşdırılıb.',
  'help.guide.tour-shaping-points.tip.2': 'Forma nöqtəsi çoxgünlük turun mərhələsini bitirə bilməz.',
  'help.guide.tour-loop-reverse.tip.1':
    'Tur dairəvi olduqdan sonra «Başlanğıca qayıt» «Tur artıq başlanğıca qayıdır» göstərir.',
  'help.guide.tour-leg-by-hand.step.3':
    'Marşrutlaşdırıcının onu yenidən planlaşdırması üçün həmin menyunu açın və «Növbəti hissəni yenidən marşrutlaşdır» seçin.',
  'help.guide.tour-trip-places.step.2':
    '«Səfərin yerlərində axtar» və ya «Tura yaxın» altına baxın: marşrutdan iki kilometr məsafədəki məkanlar, ən yaxını birinci, hər biri məsafəsi ilə.',
  'help.guide.tour-details-times.goal': 'Tura ad, təsvir və link verin və vaxtına fasilələr əlavə edin.',
  'help.guide.tour-details-times.result': 'Turun indi adı, qeydləri və onun üçün planlaşdırdığınız vaxt var.',
  'help.guide.tour-save.tip.2':
    'Zolağın yuxarısındakı «Turlara qayıt» redaktoru bağlayır, yadda saxlanmamış dəyişikliklər varsa, əvvəlcə soruşur.',
  'help.guide.tour-edit-saved.step.4':
    'Bağlamaq üçün «Turlara qayıt» düyməsinə klikləyin. Yadda saxlanmamış dəyişikliklər varsa, əvvəlcə «Turun saxlanılmamış dəyişiklikləri ləğv edilsin?» deyə soruşur.',
  'help.guide.tour-summary-profile.step.2':
    'Təxmini vaxtın yanındakı məlumat nöqtəsi onun necə hesablandığını izah edir.',
  'help.guide.tour-list-manage.goal':
    'Səyahətin turlarının cəmini görün, birini günə əlavə edin və siyahını lazım olana qədər daraldın.',
  'help.guide.tour-list-manage.tip.3':
    'Sətirdəki zibil qutusu turu silir. Sağ sütunu «Turlar»a keçirdikdə «Plan» vərəqi də eyni turları göstərir.',
  'help.guide.tour-delete.tip.3':
    'Tur burada, «Turlar» vərəqində silinir. Zibil qutusu yalnız səyahətin məkanlarını redaktə etmək hüququ olan səyahətçilərə görünür.',
  'help.guide.tour-saved-elsewhere.tip.1':
    '«Yeni tur kimi saxla» nüsxənizə turun adını, arxasına isə (my version) əlavə edir.',
  'help.ctx.trip-tour-import.bullet.4':
    '«Redaktə edilə bilən versiya» idxalı yerini dəyişə biləcəyiniz yol nöqtələri olan tura çevirir. «İdxalı əvəz et» qeydə alınmış izi saxlayır, redaktordakı «Qeydə alınmış iz» kartı isə sizi ona qaytarır.',
  'help.guide.tour-import-gpx.step.5': '«1 tur idxal et» düyməsinə klikləyin (üç izi olan fayl üçün «3 tur idxal et»).',
  'help.guide.tour-view-import.goal':
    'İdxal edilmiş turun marşrutunu, ölçülərini və hündürlüyünü idxal edildiyi kimi görün.',
  'help.guide.tour-plan-from-import.title': 'İdxaldan redaktə edilə bilən tur planlaşdırmaq',
  'help.guide.tour-plan-from-import.tip.3':
    'Avarçəkmə və ya xizək idxalında nöqtələr marşrutlaşdırılmır, düz xətlərlə birləşdirilir.',
  'help.guide.tour-restore-recorded.tip.1':
    'Bu kart yalnız «İdxalı əvəz et» ilə əvəzlənib sonra yadda saxlanmış tur üçün göstərilir.',
  'help.guide.tour-take-over.step.4': 'Tura klikləyin. Sağ tərəfdə onun xətti, ölçüləri və gəldiyi səyahət göstərilir.',
  'help.guide.tour-import-wanderer.goal': 'Öz wanderer serverinizdəki cığırlardan birini səyahətə tur kimi idxal edin.',
  'help.guide.tour-import-wanderer.tip.4': '«wanderer-də aç» cığırı öz instansiyanızda açır.',
  'help.ctx.trip-tour-map.bullet.5':
    '3D görünüşdə marşrut relyef üzərində dikliyinə görə rənglənmiş halda göstərilir; meyllərini ümumiləşdirən legenda və onu başlanğıcdan sona qədər izləyən uçuş da var.',
  'help.guide.tour-map-layers.tip.2':
    '«Gəzinti» və «Velosiped» könüllü serverlərdən gəlir və yalnız admininiz icazə verdikdə mövcuddur. Biri cavab vermədikdə onun seqmentində ! görünür və başqa xəritəyə keçə bilərsiniz; turunuz olduğu kimi qalır.',
  'help.guide.tour-along-search.step.5':
    'Tapılan yerlər marşrutdan məsafələri ilə sadalanır və xəritədə öz rənglərində göstərilir. Ulduz ən məşhurlarını, «Turda» isə artıq dayanacaq olanları işarələyir. Düymədə indi «Yenidən axtar» yazılır.',
  'help.guide.tour-along-add-stop.step.2':
    '«Hara əlavə olunur» yerin ən yaxşı uyğun gəldiyi hissəni təklif edir. Bunun əvəzinə onun hansı iki dayanacaq arasına düşəcəyini və ya «Yeni son nöqtə kimi» seçmək üçün ona klikləyin. Heç nə dəyişməzdən əvvəl xəritə yeni marşrutu qırıq xətlə göstərir.',
  'help.guide.tour-3d-terrain.goal': 'Tura real relyef üzərində, dikliyinə görə rənglənmiş halda baxın.',
  'help.guide.tour-3d-terrain.tip.2':
    'Seçdiyiniz xəritə 3D-də də istifadə olunur, via ferrata marşrutları, pistlər və dəniz nişanları da. Turu redaktə edərkən nöqtələrini relyef üzərində sürükləyə bilərsiniz, «Nöqtə qoy» aktiv olduqda isə klik yeni nöqtə əlavə edir.',
  'help.guide.tour-3d-flyover.result': 'Turu seçdiyiniz sürətlə, başlanğıcdan sona qədər yuxarıdan gördünüz.',
  'help.guide.tour-map-overlays.step.3':
    'Legenda rənglərin mənasını izah edir: «Yeni başlayan»dan «Fririd»ə qədər eniş pistləri, «Xizək qaçışı yolları», «Qış və qar ayaqqabısı cığırları», «Kirşə yolları», «Liftlər və kanat yolları». «Tam legenda OpenSnowMap-də» bütün simvolları açır. Bağlamaq üçün Escape basın.',
  'help.ctx.trip-tour-stages.bullet.1':
    'Redaktordakı «Gün» açıq turu «Bir günlük» və ya «Çoxgünlük» edir. Yenidən bir günlük tura keçdikdə təsdiqdən sonra bütün mərhələ sonları silinir, marşrut isə olduğu kimi qalır.',
  'help.guide.tour-multi-day.step.2':
    '«Gün» altında «Çoxgünlük» düyməsinə klikləyin. Qeyd ilk mərhələ sonunun harada qoyulduğunu bildirir.',
  'help.guide.tour-multi-day.tip.4':
    'Mərhələlər «Yadda saxla» düyməsinə kliklədikdə saxlanır. Dəyişiklik səyahətin bir günündə olan mərhələni silirsə, bildiriş yadda saxladıqda onun həmin gündən çıxarılacağını xəbər verir.',
  'help.guide.tour-stages-on-days.step.5':
    'Hər mərhələdə onun olduğu gün göstərilir. Mərhələni başqa günə köçürmək üçün gününə klikləyin, ya da gündən çıxarmaq üçün «Gün yoxdur» seçin.',
  'help.ctx.trip-tour-hike.summary':
    '«Turlar» vərəqində açıq yürüş və ya qaçış: solda redaktor, ortada xəritə, sağda turun xülasəsi və səyahətin digər turları. Yürüş icazə verdiyiniz cığır çətinliyindən kənara çıxmır, qaçışın vaxtı isə öz tempinizə görə hesablanır; hər ikisində OpenStreetMap-in yol boyu qeyd etdikləri göstərilir.',
  'help.guide.tour-hike-plan.goal':
    'Yürüşə başlayın, dayanacaqlarını təyin edin, marşrutun istifadə edə biləcəyi ən çətin cığır dərəcəsini seçin və yadda saxlayın.',
  'help.guide.tour-hike-plan.tip.1':
    'Yeni yürüş T2 («Dağ yürüşü») ilə başlayır. T3 seçildikdə belə cığırların açıq, uçurumlu ola biləcəyi, möhkəm addım və hündürlük qorxusunun olmamasını tələb etdiyi barədə xəbərdarlıq əlavə olunur.',
  'help.guide.tour-hike-trail-details.step.3':
    'Nişanlar yekunu göstərir: marşrutun nə qədərinin «Məlum» olduğu, «Ən yüksək məlum» dərəcə və ayrıca yürüşün planlaşdırıldığı «Marşrut həddi».',
  'help.guide.tour-hike-round.goal':
    'TREK yürüşün bir dayanacağından başlayan, istədiyiniz uzunluqda dairəvi marşrutlar təklif etsin.',
  'help.guide.tour-hike-round.tip.2':
    '1 ilə 60 km arasında məsafələr qəbul olunur və sizin məsafənizdən 20 %-dən çox fərqlənməyən dairəvi marşrutlar təklif olunur.',
  'help.guide.tour-hike-compare-ways.result':
    'Yalnız həmin hissə seçdiyiniz yolla gedir, yürüşün qalanı olduğu kimi qalır. Xəritənin aşağısındakı «Yol seçildi» bildirişində «Geri qaytar» var.',
  'help.guide.tour-ferrata-add.step.3':
    '«Tura əlavə et» düyməsinə klikləyin. Via ferrata marşrutun sonuna ayrıca hissə kimi, hər ucunda bir nöqtə ilə əlavə olunur.',
  'help.guide.tour-run-plan.title': 'Öz tempinizlə qaçış planlaşdırmaq',
  'help.guide.tour-run-plan.tip.1': 'Temp göstərilməsə, qaçışı yadda saxlamaq olmur.',
  'help.guide.tour-run-ways.step.3':
    '«Səth» düyməsinə, sonra siyahıda bir örtük növünə klikləyin ki, xəritədə yalnız həmin hissələr göstərilsin.',
  'help.ctx.trip-tour-walk.bullet.3':
    'Gəzinti başlanğıc vaxtı olan bir günə əlavə edildikdən sonra «Yol nöqtələri»nin yuxarısındakı «Vaxtlar üçün gün» həmin günü göstərir, hər dayanacaqda isə çatma vaxtı, qalma müddəti və iş saatlarına görə vəziyyəti görünür.',
  'help.guide.tour-walk-plan.step.4':
    'Dayanacağa «Etiket» və «Qalma müddəti, dəqiqə» verin. Hələ bilmirsinizsə, qalma müddətini boş buraxın, sadəcə yanından keçdiyiniz nöqtə üçün 0 yazın.',
  'help.guide.tour-walk-sights.goal': 'Mövzu seçin, gəzinti boyu axtarın və bir yeri dayanacaq kimi əlavə edin.',
  'help.guide.tour-walk-sights.tip.3':
    'İş saatları və veb-saytlar mənbədən, əsasən OpenStreetMap-dən gəlir. Getməzdən əvvəl onları yoxlayın.',
  'help.guide.tour-walk-day-times.tip.1':
    'Başlanğıc vaxtı olmadıqda sətirdə bu barədə yazılır: «Give the walk a time on this day to see arrivals and opening hours».',
  'help.guide.tour-walk-google-import.step.2':
    'Linki «Piyada marşrutunun keçidi» sahəsinə yapışdırın və «Keçidi oxu» düyməsinə klikləyin.',
  'help.guide.tour-walk-check-off.goal':
    'Həmin gün dayanacaqları ziyarət edilmiş və ya buraxılmış kimi işarələyin və nə qədər yol qaldığını görün.',
  'help.guide.tour-walk-check-off.result':
    'Ziyarət edilmiş dayanacaqlar işarələnib, buraxılanların üstündən xətt çəkilib, qalan vaxt isə yalnız hələ qarşıda olanları hesablayır.',
  'help.guide.tour-bike-profile.goal':
    'Velosiped turuna başlayın və TREK marşrutu turinq, şosse, qravel və ya MTB üçün qursun.',
  'help.guide.tour-bike-profile.tip.1':
    'Profili sonradan dəyişsəniz, bütün marşrut yeni profil üçün yenidən planlaşdırılır.',
  'help.guide.tour-bike-surfaces.step.2':
    'Kartın başlığındakı nişan marşrutun asfaltsız olduğu məlum olan hissəsinin payını göstərir.',
  'help.guide.tour-bike-mtb-grades.title': 'Dağ velosipedi turunun cığır dərəcələrini yoxlamaq',
  'help.guide.tour-bike-mtb-grades.tip.3':
    'Dərəcələri oxumaq mümkün olmadıqda kart bunu bildirir. «Yenidən cəhd et» düyməsinə klikləyin.',
  'help.ctx.trip-tour-ski.bullet.5':
    '«Xizək və qış» turu açıq olduqda xəritədə OpenSnowMap pistləri göstərilir, açarlarının yanında «Trass legendası» var. Bunların hamısı xəritə məlumatıdır: burada pistin və ya liftin açıq olub olmadığı, qarın vəziyyəti və ya uçqunlar barədə heç nə yoxdur.',
  'help.guide.tour-ski-plan.step.6': '«Turun adı» altında tura ad verin və «Yadda saxla» düyməsinə klikləyin.',
  'help.guide.tour-ski-options.step.1':
    '«Xizək və qış» turunda marşrutlaşdırıcının seçimləri «Növ» altındadır. Yalnız idman növünüzə aid olanları görürsünüz: məsələn, «Xizək qaçışı»nda «Ən çətin pistlər» yoxdur.',
  'help.guide.tour-ski-options.result':
    'Tur sizin limitləriniz daxilində yenidən planlaşdırılır, «Pist marşrutu» kartında isə onun yan keçdiyi daha çətin pistlər sadalanır.',
  'help.guide.tour-ski-fix-leg.tip.3':
    'Oflayn olduqda hissələr hələlik düz xətlə çəkilir. Yay cığırları barədə boz sətir xəta deyil, qeyddir.',
  'help.guide.tour-ski-summary.tip.1':
    '«Qaçınıldı» marşrutlaşdırıcının «Ən çətin pistlər» limitinizə görə yan keçdiyi daha çətin pistləri sadalayır.',
  'help.guide.tour-ski-pistes-layer.step.2':
    'Açarın yanındakı dörd rəngli nöqtəli düyməyə, «Trass legendası»na klikləyin.',
  'help.guide.tour-ski-import.step.1':
    '«Turlar» vərəqində «Tur əlavə et» düyməsinə («Bu səyahətin turları» üstündəki artı) klikləyin, «GPX və ya KML idxal et» seçin və faylı seçin.',
  'help.guide.tour-ski-import.tip.3':
    'Eyni önbaxışı açmaq üçün GPX, KML və ya KMZ fayllarını «Turlar» vərəqinin istənilən yerinə də ata bilərsiniz.',
  'help.ctx.trip-tour-paddle.bullet.5':
    '«Külək» turun planlaşdırıldığı gün üçün başlanğıcdakı proqnozu göstərir. «Yoxlama siyahısı» saxlanmış marşrutdakı maneələri və hər biri üçün verdiyiniz qərarı sadalayır.',
  'help.guide.tour-paddle-setup.step.5':
    'Göldə «Göllərdə» marşrutu müəyyən edir: «Düz keçid» ən qısasıdır, «Sahilə yaxın» isə küləkli günlər üçün sahilə yaxın gedir.',
  'help.guide.tour-paddle-water-route.title': 'Su üzərindəki hissələri planlaşdırmaq',
  'help.guide.tour-paddle-water-route.tip.2':
    'Marşrut qayığı bəndin ətrafından daşıyırsa və ya şlüzdən keçirsə, TREK orada öz nöqtəsini qoyur və onu «Tapıldı» kimi işarələyir. Onu köçürsəniz və ya dəyişsəniz, o, sizin öz nöqtəniz olur.',
  'help.guide.tour-paddle-portage.step.3':
    'Nöqtənin altında uzunluğu və əlavə dəqiqələri ilə «Daşıma» kartı görünür. Açmaq üçün ona klikləyin.',
  'help.guide.tour-paddle-lock.goal': 'Tura şlüz əlavə edin və gözləmə ilə keçid vaxtını tur vaxtına daxil edin.',
  'help.guide.tour-paddle-lock.result': 'Şlüz dəqiqələri ilə birlikdə turdadır və «Vaxt təxmini» onları əlavə edir.',
  'help.guide.tour-paddle-time.tip.1':
    'TREK suda 4 km/saat, daşımada 2 km/saat və hər daşımada 10 dəqiqə ilə başlayır. Bunlar ölçmə deyil, dəyişdirilməli başlanğıc dəyərlərdir.',
  'help.guide.tour-paddle-wind.step.3':
    'Zolaqlar günün saatlarını göstərir, ani əsmələr orta küləyin arxasındadır. Həmin saatın göstəricilərini və istiqamətini görmək üçün kursoru zolağın üzərinə gətirin.',
  'help.guide.tour-paddle-checklist.goal':
    'Saxlanmış marşrutdakı bəndlər, şlüzlər və giriş qaydaları barədə nəyin məlum olduğunu görün və hər birində nə edəcəyinizə qərar verin.',
  'help.guide.tour-paddle-checklist.tip.3':
    '«Yenidən yoxla» ilə işarələnmiş bənd üzrə qərar marşrut və ya məlumatlar dəyişməzdən əvvəl verilib. Yenidən qərar verin və ya «Qərarı saxla» və ya «Qərarı sil» seçin. Artıq aid olmayan qərarlar «Əvvəlki qərarlar» altında sadalanır.',
  'help.guide.tour-paddle-track-marks.step.3': '«1 tur idxal et» düyməsinə klikləyin.',
  'help.guide.tour-paddle-track-marks.result':
    'Qeydə alınmış izdə daşımalar və şlüzlər var, «Vaxt təxmini» də onları hesablayır.',
  'help.guide.tour-horse-plan.title': 'At marşrutları boyunca gəzinti planlaşdırmaq',
  'help.guide.tour-horse-plan.step.7':
    '«Turun adı» altında gəzintiyə ad verin, sonra sol sütunun aşağısındakı «Yadda saxla» düyməsinə klikləyin.',
  'help.guide.tour-horse-gap.goal': 'Gəzintinizin sonundan uzaqda başlayan hissə ilə davam edin.',
  'help.guide.tour-horse-gap.tip.3':
    'Gəzintinizin sonundan 25 m məsafədə başlayan hissə birbaşa ondan davam edir və «Gəzintiyə qoşulma» sətrində «Gəzintinin sonuna qoşulur» yazılır.',
  'help.guide.tour-horse-recorded.tip.1':
    'Xətt tam fayldakı kimi qalır. Heç nə yenidən marşrutlaşdırılmır və qeydə alınmış gəzintinin redaktə edilə bilən versiyası olmur.',
  'help.guide.dateless-trip.result':
    'Kartda «İdeya» və «Tarixlər təyin edilməyib» görünür, səyahətdə isə istədiyiniz qədər boş gün olur.',
  'help.guide.trip-reminder.title': 'Səyahətdən əvvəl xatırlatma almaq',
  'help.guide.upcoming-reservations.tip.1': 'Oteldə qalma iki dəfə görünür: bir dəfə giriş, bir dəfə çıxış üçün.',
  'help.guide.half-company-holiday.result':
    'Şirkət yarım gün istirahət edir, həmin gün qeyd olunan məzuniyyət günü isə yarım gün sayılır.',
  'help.guide.edit-holiday-calendar.title': 'Tətil təqvimini dəyişmək və ya silmək',
  'help.guide.answer-fusion-request.result':
    '«Qəbul et və birləşdir»dən sonra hər iki plan bir cədvəldə göstərilir, hər şəxs öz rəngində.',
  'help.guide.log-for-partner.result':
    'Günlər digər şəxsin rəngində göstərilir və sizin deyil, onun məzuniyyət limitindən çıxılır.',
  'help.guide.dissolve-fusion.tip.1':
    'Həmin pəncərədə «Ləğv et» planı olduğu kimi saxlayır; qeydləriniz hər halda qalır.',
  'help.guide.country-places.tip.1':
    'Səhv ölkədə görünən məkanın adətən ünvanı və ya koordinatları səhvdir. Səyahətini buradan açın və məkanı orada düzəldin.',
  'help.guide.tour-activity-stats.title': 'Turlarda nə etdiyinizi görmək',
  'help.guide.tour-activity-stats.result':
    'Pəncərədəki və «Turlar» vərəqindəki cəmlərə hesabdan çıxardığınız tur artıq daxil deyil. Onun marşrutu, günləri və səyahət olduğu kimi qalır.',
  'help.guide.move-to-list.tip.2':
    'Köçürmə məkanları siyahıdan çıxardığı üçün «Siyahıya köçür» yalnız siyahının sahibinə və ya adminə görünür. «Siyahıya kopyala» aça bildiyiniz istənilən siyahıda işləyir.',
  'help.guide.accept-list-invite.step.2':
    'Qoşulmaq üçün «Qəbul et», dəvəti rədd etmək üçün «Rədd et» düyməsinə klikləyin.',
  'help.guide.tour-collection-add-to-trip.tip.2':
    'Tur xətti olmadan saxlanıbsa, onun yol nöqtələri də əlavə edilməlidir. Pəncərə bunu bildirir və həmin seçimi sizin üçün seçir.',
  'help.guide.tour-collection-manage.tip.1':
    'Turu siyahıdan silmək ondan səyahətlərinizdə artıq yaradılmış turlara təsir etmir.',
  'help.guide.entry-draft.tip.2':
    'Günü Dawarich-dən götürdükdə onun qeydləri qaralama olur. Paylaşmazdan əvvəl nişanı yoxlayın.',
  'help.guide.journey-map-layers.result':
    'Xəritədə yalnız istədiyiniz qatlar göstərilir, hər sancağın, nöqtənin və xəttin mənasını legendadan oxumaq olar.',
  'help.guide.journey-keep-route.result':
    'Gün başlığında məsafə göstərilir, marşrut isə gündəlikdəki hər kəs üçün xəritənin «Qeydə alınan» qatında bütöv xətlə çəkilir. Paylaşılmış linkdə o, yalnız «Qeydə alınmış marşrutlar» aktiv olduqda görünür.',
  'help.guide.journey-day-stays.result':
    'Qərar verdiyiniz dayanmalar sətirdən çıxarılır. Yazdığınız qeydlər digər qeydlər kimi öz günlərində görünür, onlara həmişəki kimi foto və mətn əlavə edə bilərsiniz.',
  'help.guide.journey-take-over-day.tip.2':
    'Qaralamalar paylaşılmış linklərdə görünmür. Foto və mətn əlavə edin, sonra hər qeyddə «Qaralama»nı söndürün.',
  'help.guide.journey-auto-prepare.tip.2':
    'Günün siyahı düyməsindəki nöqtə günün hələ yekun olmadığını bildirir; səbəbi ipucunda yazılır.',
  'help.ctx.settings-plugins.bullet.3':
    'Aşağıdakı «Plagin fəaliyyəti» plaginlərin sizin adınızdan etdiyi bütün əməliyyatları ən yenisi birinci olmaqla sadalayır, «Yenilə» düyməsi ilə.',
  'help.guide.language-region.tip.3':
    '«Həftənin başlanğıcı» bütün tarix seçicilərinin ilk sütununu təyin edir; Vacay-in öz ayarı var.',
  'help.guide.web-push-device.tip.2': 'iPhone və iPad-də əvvəlcə TREK-i Əsas ekrana əlavə edin və onu oradan açın.',
  'help.guide.connect-airtrail.step.3':
    '«Yadda saxla», sonra «Bağlantını yoxla» düyməsinə klikləyin. Neçə uçuş tapıldığı göstərilir və nişan «Qoşulub» olur.',
  'help.guide.connect-dawarich.step.3':
    '«Yadda saxla», sonra «Bağlantını yoxla» düyməsinə klikləyin: son 30 gündəki dayanmalar sayılır. Qoşulduqdan sonra «İndi yoxla» dərhal yoxlayır, sağdakı «Bağlantını kəs» isə bağlantını bitirir.',
  'help.guide.tour-connect-wanderer.step.3':
    '«Yadda saxla», sonra «Bağlantını yoxla» düyməsinə klikləyin. Cığırlarınızdan neçəsini idxal edə biləcəyiniz göstərilir və nişan «Qoşulub» olur.',
  'help.guide.tour-wanderer-watch.step.2':
    'TREK gündə ən çoxu bir dəfə idxal etdiyiniz hər cığırın qısa qeydini oxuyur, sətirdə isə son yoxlama vaxtı göstərilir. Cığır dəyişmiş ola bilərsə, bildiriş alırsınız və «Xəbərdarlıqlar» onu sayır: hər turu «Dəyişmiş ola bilər», «Dəyişib» və ya «Yoxlanıla bilmir» kimi görmək və oradan açmaq üçün «Xəbərdarlıqlar»a klikləyin.',
  'help.guide.plugin-settings.goal':
    'Plaginə öz açarlarınızı və seçimlərinizi verin və sizin adınızdan nə etdiyini görün.',
  'help.guide.own-routing-engine.result': 'Bütün səyahətlərdə marşrutlar sizin serverlərinizdə hesablanır.',
  'help.guide.admin-passkeys.title': 'Keçid açarı ilə giriş təklif etmək',
  'help.guide.rotate-jwt-secret.tip.1': 'Siz də hesabdan çıxırsınız, ona görə dərhal sonra yenidən daxil olun.',
  'help.guide.notification-defaults.title': 'İstifadəçilər üçün standart bildiriş ayarlarını təyin etmək',
  'help.ctx.notifications.title': 'Bildirişlər',
  'help.guide.read-notifications.goal': 'Siz yoxkən səyahətlərinizdə nə baş verdiyini görün və birbaşa açın.',
  'help.guide.filter-notifications.goal': 'Bütün bildirişlərinizə və ya yalnız hələ oxumadıqlarınıza baxın.',
  'help.guide.mark-notifications-read.step.1':
    'Yalnız bir bildirişi işarələmək üçün onun vaxtının yanındakı qoşa işarəyə, «Oxunmuş kimi işarələ»yə klikləyin.',
  'help.guide.delete-notifications.step.2':
    'Yuxarıdakı «Hamısını sil» pəncərədə təsdiq etdikdən sonra bütün siyahını birdəfəlik silir.',
  'help.guide.notification-settings.step.3':
    '«Tənzimləmələr» yan panelində «Bildirişlər»ə klikləyin. İlk kartda hər hadisə üçün bir sətir var, «Tətbiqdaxili» sütunu isə zəngin nəyi göstərəcəyini təyin edir.',
  'help.guide.link-journal.result':
    'Səyahətin vərəqlər panelində «Gündəlik» vərəqi görünür. «Oxumaq» və ya «Redaktə et» icazəsi verdiyiniz hər kəs gündəliyi həmin vərəqdə canlı yeniləmələrlə aça bilər.',
  'help.guide.create-place.tip.4':
    'Google Maps-dən kopyalanmış link axtarışda da işləyir: yapışdırın, Enter basın, TREK məkanı linkdən oxuyur. Formada mövqe olduqdan sonra axtarışın yanındakı nişangah, «Bu nişanın yaxınlığındakı məkanlar», ətrafdakıları sadalayır.',
  'help.guide.dawarich-stays.step.2':
    'Dayanmalar günlərə görə qruplaşdırılır, hər birində gəliş və ayrılma vaxtı göstərilir; göstərici işarəsi Dawarich-in əmin olmadığı dayanmanı bildirir. Dayanmanın yanındakı sancağa, «Məkan kimi əlavə et»ə klikləyin.',
  'help.guide.leave-stop-off-route.step.3':
    'Onu yenidən marşruta qatmaq üçün həmin menyunu açın və «Yenidən marşruta əlavə et» seçin.',
  'help.guide.move-booking-day.tip.1':
    'Çoxgünlük rezervasiyanın aradakı günlərindəki solğun sətirləri sürükləmək olmur, aralıq dayanacaqlı uçuşun ayrıca hissəsini də.',
  'help.guide.place-image-from-file.step.2':
    'Başlıqdakı dairəvi şəklə klikləyin. Məkanın fotoları olduğu üçün kiçik pəncərə şəklin haradan götürüləcəyini soruşur.',
  'help.guide.place-own-hours.goal':
    'Tapılan saatlar səhv olduqda və ya olmadıqda, karta özünüzün yoxladığı saatları yazın.',
  'help.guide.place-own-hours.tip.2':
    'Telefon nömrəsi və e-poçt kartın başlığında nişan kimi görünür. Telefon və ya poçt tətbiqində açmaq üçün birinə klikləyin.',
  'help.guide.edit-accommodation.tip.3':
    '«Tənzimləmələr»də, «Ümumi» altında «Rezervasiya kodlarını bulanıqlaşdır» aktivdirsə, təsdiq nömrəsi bulanıq qalır. Oxumaq üçün kursoru üzərinə gətirin və ya ona klikləyin.',
  'help.guide.confirm-stay-booking.tip.1': 'Nişana yenidən klikləsəniz, rezervasiya yenə «Gözləyir» olur.',
  'help.guide.map-markers.tip.4':
    '«Tənzimləmələr» > «Ümumi» bölməsində, «Səyahət və xəritə» altında «Planlaşdırılmamış məkanlar üçün kiçik nişanlar» aktivdirsə, hələ heç bir günə əlavə olunmamış məkanlar fotosuz və reytinqsiz kiçik nöqtələr kimi göstərilir. Seçdiyiniz məkan həmişə tam göstərilir.',
  'help.guide.tour-map-lines.step.1':
    'Səyahətin hər turu xəritədə öz rəngində xətt kimi, başlanğıcında sancaqla çəkilir. Tur üçün rəng seçmisinizsə, xətt həmin rəngdə olur. Əks halda xətt kateqoriyasının rəngindədir.',
  'help.guide.car-stops.step.6': '«Əlavə et» düyməsinə klikləyin.',
  'help.guide.transport-details.step.4':
    'Formanı açmadan gedişin adını dəyişmək üçün başlığa klikləyin. «Adını dəyiş» ad doldurulmuş halda açılır: yenisini yazın və «Yadda saxla» düyməsinə klikləyin.',
  'help.guide.export-transports-csv.goal':
    'Səyahətin gedişlərini TREK-dən CSV faylı kimi ixrac edin: cədvəl, səyahət agenti və ya çap üçün.',
  'help.guide.group-sort-bookings.result':
    'Rezervasiyalar seçdiyiniz bölmələrdə və ardıcıllıqla göstərilir, bu brauzer isə seçimi növbəti dəfə üçün yadda saxlayır.',
  'help.guide.booking-on-map.step.1':
    '«Məkan / Fəaliyyət» altında, qalma üçün isə «Yaşayış yeri» altında məkan bağlanmış rezervasiyanın kartına klikləyin. Onun təfərrüatları açılır.',
  'help.guide.export-bookings-csv.title': 'Rezervasiyaları cədvəl kimi ixrac etmək',
  'help.guide.export-bookings-csv.tip.3':
    'Vərəqdə ilk rezervasiya yarandıqdan sonra düymə görünür. «Nəqliyyat» vərəqi öz qeydlərini eyni qaydada ixrac edir.',
  'help.guide.arrange-packing-list.title': 'Baqaj siyahısını öz ardıcıllığınızla düzmək',
  'help.guide.count-packed-pieces.result':
    'Sətirdə neçə ədədin yığıldığı göstərilir, sonuncu da qoyulduqda element işarələnir.',
  'help.guide.expense-receipts.title': 'Xərcə qəbz əlavə etmək',
  'help.guide.expense-receipts.tip.1':
    'Redaktorda siyahıdakı faylın adına klik eyni önizləməni açır. Bu halda Esc xərci deyil, yalnız önizləməni bağlayır.',
  'help.guide.files-sync-settings.step.5':
    '«Hər iki tərəf dəyişdikdə» sənəd hər iki yerdə redaktə edildikdə hansı nüsxənin saxlanacağını təyin edir: «Məndən soruş», «TREK nüsxəsini saxla» və ya «Saxlama xidmətindəki nüsxəni saxla». «Avtomatik sinxronlaşdır» TREK-ə dəyişiklikləri arxa planda yoxlamağa imkan verir; söndürülübsə, kartda «Dayandırılıb» yazılır və sinxronizasiyanı yalnız «İndi sinxronlaşdır» işə salır. Burada hər dəyişiklik dərhal yadda saxlanır.',
  'help.guide.manage-notes.step.5':
    '«Sil» əvvəlcə «Qeyd silinsin?» deyə soruşur, çünki qeyd faylları ilə birlikdə bütün üzvlər üçün silinir. Təsdiqləmək üçün «Sil» düyməsinə klikləyin.',
  'help.guide.note-categories.step.3':
    'Kateqoriyanın adını dəyişmək üçün adına klikləyin. Yeni adı yazın və Enter basın; Esc köhnə adı saxlayır.',
  'help.guide.roadtrip-reorder.step.2':
    'Dayanacağı başqa günə köçürmək üçün onu həmin günün kartındakı dayanacağın üzərinə buraxın. Sürüklədikcə ikidən az dayanacağı olan gün zolağın sonunda qırıq xətli kart kimi görünür, onun üzərinə də buraxa bilərsiniz.',
  'help.guide.roadtrip-corridor.tip.4':
    'Filtrin altında günün bir dayanacağını və ya iki dayanacaq arasındakı yarı yolu seçin ki, yalnız həmin nöqtədən 25, 50 və ya 100 km məsafədə olanlar qalsın. Siyahıda şarj məntəqələri varsa, «İstənilən konnektor» və «İstənilən güc» onları rozetkaya və gücə görə süzür.',
  'help.guide.roadtrip-overnight.result':
    'Yer marşrutda həmin günün gecələmə dayanacağı kimi görünür, qalma isə səyahətdə digərləri kimi rezerv olunur.',
  'help.guide.roadtrip-stop-fill.result':
    'Bu dayanacaqda bak seçdiyiniz səviyyəyə qədər doldurulur. Ondan sonrakı yürüş məsafəsi, o cümlədən «Yanacaq burada bitir» zolağı, buna əsasən hesablanır.',
  'help.guide.roadtrip-bookings.step.4': 'Rezervasiyanı açmaq üçün karta klikləyin.',
  'help.guide.roadtrip-google-import.goal':
    'Google Maps-də planlaşdırdığınız marşrutu günlərinizdən birində dayanacaqlara çevirin.',
  'help.guide.roadtrip-google-import.tip.3':
    'İdxal üçün internet bağlantısı, həmçinin həm məkanları, həm də günləri redaktə etmək hüququ lazımdır.',
  'help.guide.roadtrip-hazards.tip.2':
    'DWD Almaniyanı əhatə edir, GDACS isə bütün dünyada fəlakətlər barədə məlumat verir. Yalnız nöqtə kimi verilmiş xəbərdarlıq təsir zonasının məlum olmadığını bildirir.',
  'help.ctx.trip-tours.bullet.5':
    'Günlər sütununda tur dayanacaq kimi bir sətirdir. «Başlanğıc» vaxtı varsa, başlanğıc → son göstərilir, son vaxt turun müddətindən hesablanır; «Daha çox seçim» menyusunda «Redaktə et», «Gündən çıxar», «Marşruta daxil etmə» və «Kolleksiyada yadda saxla» var.',
  'help.guide.tour-show-list.step.5':
    'Məkanlar siyahısını geri qaytarmaq üçün həmin keçiddə «Məkan» düyməsinə klikləyin.',
  'help.guide.tour-add-to-day.step.2':
    'Günü seçin. Menyuda səyahətin bütün günləri tarixi və başlığı ilə sadalanır; turun artıq olduğu gün boz görünür.',
  'help.guide.tour-add-to-day.result': 'Tur öz günü altında görünür, xətti isə xəritədə həmin günün bir hissəsidir.',
  'help.guide.tour-day-times.tip.2':
    'Çoxgünlük turun bir mərhələsi olan gündə hesablanmış bitmə vaxtı olmur, çünki turun vaxtı bütün marşrutun vaxtıdır.',
  'help.guide.tour-remove-from-day.step.3':
    'Və ya günü açmaq üçün başlığına klikləyin, siyahıda tura klikləyin və kartın aşağısındakı «Gündən çıxar» düyməsinə klikləyin.',
  'help.guide.tour-filter-list.step.3':
    'Siyahıda müxtəlif turlar varsa, «Mənbə» (TREK, «GPX idxalı», wanderer), «Marşrut həddi» (T1-dən T6-ya qədər) və «Növ» («Yürüş», «Velosiped turu» və s.) onu daha da daraldır. İşarələnmiş dəyəri götürmək üçün ona yenidən klikləyin.',
  'help.guide.tour-hide-on-map.step.1':
    'Kursoru siyahıdakı turun üzərinə gətirin və sətrin sağında görünən gözə («Xəritədə gizlət») klikləyin.',
  'help.guide.tour-import-plan-tab.step.1':
    '«Plan» vərəqində sağ sütunun yuxarısındakı keçiddə «Turlar» düyməsinə klikləyin.',
  'help.ctx.trip-tour-detail.bullet.1':
    '«Turlar» siyahısında tura (əvvəlcə sağ sütunu «Məkan»dan «Turlar»a keçirin), gün içindəki sətrinə və ya xəritədəki xəttinə klikləyin, kartı xəritənin üzərində açılır. Kart açıq olduqca xəritədən istifadə etmək olar.',
  'help.guide.tour-detail-read.step.2':
    'Başlıqda turun adı və nişanlarla xülasə göstərilir: turun növü, idxal edilibsə, haradan gəldiyi, planlaşdırılan müddət, məsafə, qalxış və eniş.',
  'help.guide.tour-detail-read.tip.3':
    'Bəzi turlar daha çox göstərir: şəhər gəzintisi stansiyalarını, avarçəkmə turu yoxlamalarını və küləyi, artıq keçilmiş tur «Faktiki iz»ini, siyahıya bağlanmış tur isə «Baqaj siyahısı»nı.',
  'help.guide.tour-rename-colour.step.3':
    'Turun dairəvi xanasının küncündəki rəngli nöqtəyə, iz rənginə klikləyin. Başlığın altında iz rəngi bölməsi açılır.',
  'help.guide.tour-take-along.step.2':
    'Turun veb səhifəsi varsa, yanındakı düymədə saytın adı (Komoot, AllTrails, Outdooractive və ya Wanderer), başqa saytlar üçün isə «Veb-sayt» yazılır. O, səhifəni yeni tabda açır.',
  'help.guide.tour-copy-keep.goal':
    'Bu səyahətdə turun variantını yaradın və ya sonrakı səyahətlər üçün onu kolleksiyalarınızdan birində saxlayın.',
  'help.guide.tour-copy-keep.tip.4':
    '«Kolleksiya» yalnız Kolleksiyalar əlavəsi aktiv olduqda var. Yalnız oxuya bildiyiniz siyahını seçmək olmur, hələ siyahı yoxdursa, pəncərə «Kolleksiyaları aç» təklif edir.',
  'help.guide.tour-packing-link.step.5':
    'Elementləri işarələmək üçün «Baqaj siyahısını aç» düyməsinə klikləyin. TREK «Siyahılar» vərəqinə, baqaj siyahısına keçir.',
  'help.guide.tour-files.step.2': 'Altındakı sətir indi onları sayır və siyahı açılır.',
  'help.guide.tour-activity-link.step.2':
    '«Keçirildiyi gün» altında turu hansı gün keçdiyinizi yoxlayın. Heç bir günə aid deyilsə, «Gün yoxdur» seçin.',
  'help.guide.tour-activity-compare.title': 'Planı əslində etdiklərinizlə müqayisə etmək',
  'help.guide.tour-activity-compare.result': 'Günü planla kartda və xəritədə tez müqayisə edə bilərsiniz.',
  'help.guide.tour-origin-check.tip.3':
    '«wanderer bağlantısı yoxdur» hesabınızın hələ qoşulmadığını bildirir. Onu «Tənzimləmələr»də, «İnteqrasiyalar» altında qoşun.',
  'help.ctx.trip-tour-planner.bullet.5':
    'Xəritənin yuxarısındakı «Yer və ya ünvan axtar» xəritəni hərəkət etdirir. Aşağı soldakı panel turun növünün təklif etdiyi xəritələr, məsələn, Topo və ya «Peyk» arasında keçid edir və açıq turun «Nöqtə qoy» və 3D kimi açarlarını saxlayır.',
  'help.guide.tour-open-workspace.step.5':
    'Xəritənin yuxarısındakı «Yer və ya ünvan axtar» xəritəni bir yerə aparır ki, turun olduğu yerdən başlayasınız.',
  'help.guide.tour-draw-route.goal': 'Yeni turun nöqtələrini xəritədə qoyun və TREK aralarındakı marşrutu hesablasın.',
  'help.guide.tour-draw-route.tip.2':
    'Xəritə panelində Topo və ya «Gəzinti» yolları göstərir, bu da onlardan birinə klikləməyi asanlaşdırır. Növün istifadə edə biləcəyi heç bir yoldan çox uzaq olan nöqtə üçün marşrut əvəzinə bildiriş göstərilir.',
  'help.guide.tour-type-profile.step.3':
    'Velosiped turunda növün altında «Profil» soruşulur: «Turinq», «Yol», «Qravel» və ya MTB. Altındakı sətir profilin nəyə üstünlük verdiyini bildirir.',
  'help.guide.tour-edit-points.step.2':
    'Nöqtəsini seçmək üçün «Yol nöqtələri» altında sətrə klikləyin. Onun sancağı xəritədə vurğulanır.',
  'help.guide.tour-shaping-points.title': 'Forma nöqtəsi ilə marşrutu dəyişmək',
  'help.guide.tour-shaping-points.tip.3':
    'At gəzintisində xəttə klik heç nə əlavə etmir, çünki onu heç bir marşrutlaşdırıcı formalaşdırmır.',
  'help.guide.tour-loop-reverse.tip.2':
    'Turu yenidən birtərəfli etmək üçün «Başlanğıca qayıdış» sətrini silin. Tur tərsinə çevrildikdə əllə çəkilmiş hissə əllə çəkilmiş olaraq qalır.',
  'help.guide.tour-leg-by-hand.step.4':
    '«Növbəti hissəni yenidən hesabla» digərlərinə toxunmadan yalnız həmin hissə üçün marşrutlaşdırıcıya bir daha müraciət edir.',
  'help.guide.tour-trip-places.step.3':
    'Məkana klikləyin. O, turun yeni sonu kimi əlavə olunur, siyahı isə növbəti üçün açıq qalır.',
  'help.guide.tour-details-times.step.1':
    'Sol zolağın yuxarısındakı «Turun adı» sahəsində ad yazılır. Yeni turda oradakı boz mətn, məsələn, «Adsız yürüş», sadəcə nümunədir: öz adınızı yazın.',
  'help.guide.tour-save.title': 'Turu yadda saxlamaq',
  'help.guide.tour-save.tip.3':
    'Sahədə yanlış dəyər olduqda da «Yadda saxla» işləmir, məsələn, veb-sayt ünvan deyilsə. Bunu göstərmək üçün «Ətraflı məlumat» avtomatik açılır.',
  'help.guide.tour-edit-saved.tip.1': 'Dəyişmədiyiniz turda «Yadda saxla» boz qalır.',
  'help.guide.tour-summary-profile.step.3':
    'Kursoru «Yüksəklik profili» boyunca hərəkət etdirin. O, həmin nöqtədəki məsafəni və hündürlüyü göstərir, xəritədə isə nöqtə eyni yeri işarələyir.',
  'help.guide.tour-list-manage.step.1':
    '«Səfərin həcmi» siyahının üstündədir. Yığılmış halda turların sayını, onlardan neçəsinin «Planlaşdırılıb» və «Planlaşdırılmayıb» olduğunu göstərir. Sağdakı ox hər növ üçün məsafə, qalxış, eniş və vaxtların cəmi olan sətirləri açır.',
  'help.guide.tour-list-manage.result':
    'Filtrin göstərdiyi turların cəmini görürsünüz, hər tur da istədiyiniz gündədir.',
  'help.guide.tour-delete.result': 'Tur siyahıdan, xəritədən və bütün günlərdən silinib.',
  'help.guide.tour-saved-elsewhere.tip.2':
    'Turu başqa cihazda dəyişdikdə də eyni şey olur. Dəyişmədiyiniz tur sadəcə yenidən yüklənir və bu barədə qeyd göstərilir.',
  'help.ctx.trip-tour-import.bullet.5':
    '«Tənzimləmələr», «İnteqrasiyalar» altında wanderer qoşulduqdan sonra heç bir tur açıq olmadıqda «Yeni tur planlaşdır» yanında wanderer düyməsi görünür. O, idxal üçün öz cığırlarınızı sadalayır.',
  'help.guide.tour-import-gpx.tip.1':
    'Faylları kompüterinizdən «Turlar» vərəqinə sürükləyib ata da bilərsiniz. Eyni önbaxış açılır.',
  'help.guide.tour-view-import.step.1':
    '«Turlar» vərəqində «Bu səyahətin turları» siyahısında «GPX idxalı» nişanı olan tura klikləyin.',
  'help.guide.tour-plan-from-import.goal':
    'Qeydə alınmış izdən yerini dəyişə biləcəyiniz yol nöqtələri alın və yeni marşrutun ona nə qədər yaxın qaldığını görün.',
  'help.guide.tour-plan-from-import.tip.4':
    '«At gəzintisi»nin redaktə edilə bilən versiyası yoxdur: o, keçildiyi kimi saxlanır.',
  'help.guide.tour-restore-recorded.tip.2':
    '«Yeni tur kimi planlaşdır» ilə yaradılmış turun öz qeydə alınmış izi yoxdur. Onun yarandığı idxal hələ də siyahıdadır.',
  'help.guide.tour-take-over.step.5': 'İstəsəniz, «Bu səfərdəki ad» altında ona başqa ad verin.',
  'help.guide.tour-import-wanderer.step.1':
    '«Turlar» vərəqində, heç bir tur açıq olmadıqda «Yeni tur planlaşdır» yanındakı wanderer düyməsinə klikləyin.',
  'help.guide.tour-import-wanderer.result': 'Cığır səyahətin turu olur və xəritədə «wanderer turu» kimi açılır.',
  'help.guide.tour-map-layers.title': 'Tur üçün xəritə seçmək',
  'help.guide.tour-map-layers.tip.3':
    'Avarçəkmə turu və şəhər gəzintisi yalnız «Xəritə» və «Peyk» təklif edir; qaçış, xizək turu və at gəzintisi «Xəritə», Topo və «Peyk» təklif edir.',
  'help.guide.tour-along-search.result': 'Marşrut boyundakı yerlər siyahıda və xəritədədir, baxmağa hazırdır.',
  'help.guide.tour-along-add-stop.step.3':
    '«Dayanacaq kimi əlavə et» düyməsinə klikləyin. Yanındakı nişan düz xətlə ölçülmüş yoldan kənara çıxmanın təxmini dəyəridir.',
  'help.guide.tour-3d-terrain.step.1':
    '«Turlar» vərəqində turu açın və aşağı soldakı panelin sonundakı 3D düyməsinə klikləyin. Xəritə əyilir və relyefi üzərində çəkilmiş marşrutla 3D görünüşdə göstərir.',
  'help.guide.tour-3d-terrain.tip.3':
    'Relyef üçün internet bağlantısı lazımdır: hündürlüklər açıq Mapzen relyef plitələrindən gəlir. Avarçəkmə turu meyllər olmadan öz rəngində çəkilir, çünki su düzdür.',
  'help.guide.tour-3d-flyover.tip.1':
    'Uçuş zamanı yaxınlaşdırmaq və ya uzaqlaşdırmaq üçün siçanın təkərini fırladın; kamera nöqtənin üzərində qalır. Fasilə verənə qədər xəritəni sürükləmək olmur.',
  'help.guide.tour-map-overlays.step.4':
    'Avarçəkmə turunda panel bunun əvəzinə «Dəniz nişanları» təklif edir. Suda üzən nişanları, mayakları və liman işarələrini göstərmək üçün ona klikləyin.',
  'help.ctx.trip-tour-stages.bullet.2':
    'Dayanacağın «Digər əməliyyatlar» menyusundakı «Mərhələni burada bitir» mərhələni həmin dayanacaqda bitirir. Bundan sonra «Yol nöqtələri»ndə hər mərhələ üçün məsafəsi və vaxtı ilə «Stage N» başlığı göstərilir, mərhələni bitirən dayanacaqda isə ay işarəsi olur.',
  'help.guide.tour-multi-day.step.3':
    'Kursoru ilk günün bitdiyi dayanacağın üzərinə gətirin, «Digər əməliyyatlar» düyməsinə klikləyin və «Mərhələni burada bitir» seçin.',
  'help.guide.tour-multi-day.result':
    'Mərhələləri olan bir marşrut, hər mərhələ ayrıca ölçülür. Saxlamaq üçün «Yadda saxla» düyməsinə klikləyin.',
  'help.guide.tour-stages-on-days.step.6':
    'Yanındakı ox, «Bu mərhələni planlayıcıda aç», turu redaktorda həmin mərhələdə açır.',
  'help.ctx.trip-tour-hike.bullet.1':
    'Redaktorun yuxarısındakı «Tur növü» marşrutun necə planlaşdırılacağını müəyyən edir. «Yürüş» «Ətraflı məlumat» altındakı «Maksimum cığır çətinliyi»nə qədər olan cığırlardan istifadə edir; «Qaçış» qaçmaq mümkün olan yollardan istifadə edir və «Planlaşdırılan temp»inizi soruşur.',
  'help.guide.tour-hike-plan.step.1':
    'Sol sütunun yuxarısındakı «Yeni tur planlaşdır» düyməsinə klikləyin. Redaktor «Yeni tur» kimi açılır.',
  'help.guide.tour-hike-plan.tip.2':
    'T4 və yuxarıda əvvəlcə «Alp marşrutlaşdırması aktivləşdirilsin?» soruşulur. Yalnız marşrut uçurumlu və ya nişanlanmamış ərazidən keçə bilərsə, təsdiqləyin; sual hər redaktə sessiyasında bir dəfə verilir.',
  'help.guide.tour-hike-trail-details.step.4':
    'Xəritədə yalnız həmin hissələri göstərmək üçün siyahıda dərəcəyə klikləyin. Bütün marşrutu göstərmək üçün ona yenidən klikləyin.',
  'help.guide.tour-hike-round.step.1':
    'Yürüş açıq olduqda «Yol nöqtələri» kartının başlığında «Başlanğıcdan dairəvi marşrut» düyməsinə klikləyin. Başqa dayanacaqdan başlamaq üçün onun «Digər əməliyyatlar» menyusunu açın və «Buradan dairəvi marşrut» seçin.',
  'help.guide.tour-hike-round.tip.3':
    '«Yenidən axtar» məsafə seçiminə qayıdır, «Ləğv et» isə heç nəyi dəyişmədən kartı bağlayır.',
  'help.guide.tour-hike-compare-ways.tip.1':
    'Bunu yalnız yürüşlər təklif edir, həm də yalnız əllə çəkilmiş deyil, marşrutlaşdırıcının planlaşdırdığı hissə üçün.',
  'help.guide.tour-ferrata-add.step.4':
    '«Yol nöqtələri»ndə həmin iki nöqtə arasındakı hissədə via ferrata marşrutunun adı, dərəcəsi və uzunluğu göstərilir.',
  'help.guide.tour-run-plan.goal': 'Qaçmaq mümkün olan yollarla qaçış planlaşdırın və vaxtını tempinizə görə alın.',
  'help.guide.tour-run-plan.tip.2':
    'Qalxışlar, enişlər və yolun texniki çətinliyi vaxta daxil deyil: vaxt sadəcə məsafəni tempə vurmaqla hesablanır.',
  'help.guide.tour-run-ways.result': 'Yola çıxmazdan əvvəl qaçışın hansı hissələrinin asfaltda olmadığını bilirsiniz.',
  'help.ctx.trip-tour-walk.bullet.4':
    '«Tur boyunca» marşrutdan müəyyən məsafədə «Gəzinti mövzusu»na görə görməli yerlər tapır, «Dayanacaq kimi əlavə et» isə birini gəzintiyə seçdiyiniz yerdə əlavə edir.',
  'help.guide.tour-walk-plan.step.5':
    '«Əhəmiyyət»i «Adi», «İstəyə bağlı» və ya «Mütləq baxılmalı» edin. Sonradan dəyişiklik təklif olunduqda yerində qalmalı olan dayanacaq üçün «Qorunur» açarını yandırın, sonra «Yadda saxla» düyməsinə klikləyin.',
  'help.guide.tour-walk-sights.step.1':
    'Şəhər gəzintisi açıq olduqda sol sütunda «Tur boyunca» kartını tapın və «Gəzinti mövzusu» seçin: «Mədəniyyət və tarix», «Parklar və mənzərələr», «Yemək və yerli həyat» və ya «Hər şeydən bir az».',
  'help.guide.tour-walk-sights.result':
    'Görməli yer gəzintinin dayanacağıdır və marşruta seçdiyiniz dayanacaqlar arasında daxil edilib.',
  'help.guide.tour-walk-day-times.tip.2':
    'Dayanacağın hələ qalma müddəti yoxdursa, ondan sonrakı çatma vaxtları mümkün olan ən erkən vaxtlar kimi göstərilir.',
  'help.guide.tour-walk-google-import.step.3':
    '«Keçiddəki dayanacaqlar»ı yoxlayın. Linkdə mövqeyi olmayan dayanacaq işarələnir və daxil edilmir.',
  'help.guide.tour-walk-check-off.step.1':
    '«Plan» vərəqində öz günündəki şəhər gəzintisinə klikləyin. Kartı xəritənin yanında açılır.',
  'help.ctx.trip-tour-bike.title': 'Velosiped turları',
  'help.guide.tour-bike-profile.step.1':
    '«Turlar» vərəqində sol zolağın yuxarısındakı «Yeni tur planlaşdır» düyməsinə klikləyin.',
  'help.guide.tour-bike-profile.tip.2':
    'Profil yalnız marşrutlaşdırıcıya istiqamət verir. Yolla sürmək mümkün olub olmadığı barədə heç nə demir: marşrutun hansı örtükdən keçdiyini «Səth və yollar» kartı göstərir.',
  'help.guide.tour-bike-surfaces.step.3':
    '«Səth» altında «Qravel» və ya «Təbii torpaq» kimi sətrə klikləyin. Onun hissələri xəritədə vurğulanır. Vurğulamanı götürmək üçün sətrə yenidən klikləyin.',
  'help.guide.tour-bike-mtb-grades.goal': 'MTB turundakı cığırların nə qədər çətin olduğunu sürməzdən əvvəl görün.',
  'help.guide.tour-bike-mtb-grades.tip.4':
    '«Profil»i MTB-dən başqasına keçirsəniz, dərəcə hissələri yox olur. Bundan sonra marşrut yeni profil üçün yenidən planlaşdırılır.',
  'help.guide.tour-ski-plan.title': 'Xizək və qış turu planlaşdırmaq',
  'help.guide.tour-ski-plan.tip.1':
    '«Xizək qaçışı» üçün həmçinin «Texnika» seçin: «Klassik», «Konki üslubu» və ya «Naməlum». Sahələrin altındakı bildiriş nəyin hələ çatışmadığını göstərir.',
  'help.guide.tour-ski-options.step.2':
    '«Ən çətin pistlər»i açın və sürmək istədiyiniz ən yüksək dərəcəni «Yeni başlayan»dan «Ekspert»ə qədər seçin. Standart dəyər «Orta»dır.',
  'help.guide.tour-ski-fix-leg.title': 'Planlaşdırıla bilməyən xizək hissəsini düzəltmək',
  'help.guide.tour-ski-fix-leg.tip.4':
    'Bütün hissələr planlaşdırılmayana qədər «Pist marşrutu» kartında hələ xizək vaxtının olmadığı yazılır.',
  'help.guide.tour-ski-summary.tip.2':
    'Bütün hissələr planlaşdırılmayana qədər «Xizək vaxtı» «Hesablanmayıb» olaraq qalır. Tura yenə də vaxt vermək üçün onun təfərrüatlarında planlaşdırılan ümumi vaxtı daxil edin.',
  'help.guide.tour-ski-pistes-layer.step.3':
    'Legenda eniş pistlərini çətinliyə görə, xizək qaçışı yollarını, qış və qar ayaqqabısı cığırlarını, kirşə yollarını və liftləri göstərir. «Tam legenda OpenSnowMap-də» tam legendanı açır.',
  'help.guide.tour-ski-import.step.2': '«İdxal önbaxışı»nda «Bu kimi idxal et»i açın və «Xizək və qış» seçin.',
  'help.guide.tour-ski-import.result':
    'İz «Bu səyahətin turları»ndadır, idman növü və texnikası onun «Xizək izi» kartında göstərilir.',
  'help.ctx.trip-tour-paddle.bullet.6':
    'Sol sütunun aşağısındakı «Avarçəkmənin riskləri var» sətri «Suda təhlükəsizlik» bölməsini açır. Xəritə «Xəritə» və «Peyk», üst qat kimi isə «Dəniz nişanları» təklif edir.',
  'help.guide.tour-paddle-setup.step.6':
    '«Avar sürəti» qayığa görə təklif olunan sürəti boz rəngdə göstərir. Öz sürətinizi yazdıqda sahədə «Öz sürətin» yazılır; altındakı «Use the suggested» linki yenidən qayığın sürətini götürür.',
  'help.guide.tour-paddle-water-route.goal':
    'TREK hissəni çay və ya göl boyunca planlaşdırsın, planlaşdıra bilmədiyi hissədəki qeydləri isə başa düşün.',
  'help.guide.tour-paddle-water-route.tip.3':
    'Planlaşdırılmış hissənin altındakı qeydlər dərəcəsi ilə «Whitewater», «Qayıq keçidi» və ya düz xətlə birləşdirilmiş «Xəritə məlumatlarında boşluq» barədə xəbərdarlıq edir.',
  'help.guide.tour-paddle-portage.step.4':
    '«Marşrut» altında «Yolu izlə» xəritədəki yoldan istifadə edir, «Düz xətt» isə birbaşa keçir. TREK yolu özü axtarır və uzun dolama olmadan yol olmadıqda bunu bildirir.',
  'help.guide.tour-paddle-lock.step.1':
    'Kursoru şlüzdəki dayanacağın üzərinə gətirin və üç nöqtəyə, «Digər əməliyyatlar»a klikləyin.',
  'help.guide.tour-paddle-time.title': 'Avarçəkmə turunun vaxtını oxumaq və tənzimləmək',
  'help.guide.tour-paddle-time.tip.2': 'Axın və külək təxminə daxil deyil.',
  'help.guide.tour-paddle-wind.step.4':
    'Qarşı küləyin, yan küləyin, açıq su keçidlərinin və ani əsmələrin qayığa necə təsir etdiyini öyrənmək üçün «Külək avarçəkmə üçün nə deməkdir» bölməsini açın.',
  'help.guide.tour-paddle-checklist.step.1':
    'Avarçəkmə turunu yadda saxlayın, sonra sol sütunda «Yoxlama siyahısı»nı tapın. Başlığındakı nişan siyahının vəziyyətini ümumiləşdirir.',
  'help.guide.tour-paddle-checklist.tip.4':
    'Maneələr TREK-də olan bölgələrin OpenStreetMap məlumatlarından gəlir. Məlumat yoxdursa, kart bunu bildirir və bəndləri, şlüzləri və daşımaları özünüz yoxlayırsınız.',
  'help.guide.tour-paddle-track-marks.step.4':
    '«Bu səyahətin turları»nda izə klikləyin. Sol sütun onu qeydə alındığı kimi, «Daşımalar və şlüzlər» kartı ilə birlikdə göstərir.',
  'help.ctx.trip-tour-horse.title': 'At gəzintiləri',
  'help.guide.tour-horse-plan.goal':
    'Xəritə görünüşündə nişanlanmış at marşrutlarının hissələrindən at gəzintisi qurun.',
  'help.guide.tour-horse-plan.result':
    'Gəzinti götürdüyünüz hissələrlə gedir, hər birində marşrutun adı, giriş nöqtəsi və uzunluğu göstərilir, gəzinti isə «Bu səyahətin turları» altında görünür.',
  'help.guide.tour-horse-gap.step.1':
    'Gəzintidə bir hissə olduqda başqa marşrutu açın və gəzintinizin sonuna toxunmayan hissə seçin. «Gəzintiyə qoşulma» altında bildiriş onların arasında nə qədər məsafə olduğunu göstərir.',
  'help.guide.tour-horse-recorded.title': 'GPX faylından qeydə alınmış gəzintini saxlamaq',
  'help.guide.tour-horse-recorded.tip.2':
    'Hündürlükləri olmayan faylda sıfır qalxış əvəzinə «Faylda hündürlük yoxdur» göstərilir.',
  'help.guide.dateless-trip.tip.1':
    'Nə vaxt səyahət edəcəyinizi bildikdə formanı kartdakı qələmlə açın və tarixləri seçin. Planlaşdırdığınız günlər ardıcıllığını saxlayır və tarixləri həmin ardıcıllıqla alır.',
  'help.guide.trip-reminder.goal': 'Yola çıxmazdan bir neçə gün əvvəl xatırlatma alın.',
  'help.guide.upcoming-reservations.tip.2':
    '«Gözləyir» hələ təsdiqlənməmiş rezervasiyanı bildirir. Ləğv edilmiş rezervasiyalar və arxivləşdirilmiş səyahətlər göstərilmir.',
  'help.guide.half-company-holiday.tip.1':
    'Həmin gün artıq qeyd olunmuş məzuniyyət yarım günə endirilir. Həmin günü sonradan qeyd edən hər kəs yalnız 0,5 gün istifadə edir.',
  'help.guide.edit-holiday-calendar.goal':
    'Əlavə etdiyiniz rəsmi və ya məktəb tətili təqviminin adını, rəngini, yerini dəyişin və ya onu silin.',
  'help.guide.person-color.title': 'Şəxsin rəngini dəyişmək',
  'help.guide.answer-fusion-request.tip.1':
    'Sorğu siz cavab verənə qədər açıq qalır. Bir neçə sorğu varsa, onları bir-birinin ardınca görürsünüz.',
  'help.guide.log-for-partner.tip.1': '«Yarım gün» və «Kompensasiya / çevik gün» seçilmiş şəxs üçün də işləyir.',
  'help.guide.dissolve-fusion.tip.2':
    'Kiminsə sadəcə günlərinizi görməsini istəyirsinizsə, bunun əvəzinə təqviminizi paylaşın.',
  'help.guide.country-details.tip.2':
    'Ölkə üçün sayılan bütün məkanları səyahətlərə görə qruplaşdırılmış halda görmək üçün «Məkan» nişanına klikləyin.',
  'help.guide.country-places.tip.2':
    'Nişan yalnız ölkənin öz məkanları olduqda görünür. Yalnız əl ilə işarələdiyiniz ölkənin məkanı olmur.',
  'help.guide.tour-activity-stats.goal':
    'Bütün səyahətlərinizdə müəyyən dövr və növ üzrə keçdiyiniz məsafəni, qalxışı və turların sayını görün, baş tutmamış turu isə hesabdan çıxarın.',
  'help.guide.tour-activity-stats.tip.1':
    'Tur son günü bitdikdən sonra sayılır. Heç bir gündə olmayan və ya yalnız tarixsiz günlərdə olan tur heç vaxt sayılmır. Onun sayılması üçün turu səyahətindəki tarixli günə əlavə edin.',
  'help.guide.move-to-list.result':
    'Məkanlar digər siyahıdadır, qısa qeyd isə neçəsinin köçürüldüyünü və ya kopyalandığını bildirir.',
  'help.guide.accept-list-invite.tip.1':
    'Siyahıda nə edə biləcəyiniz sahibin sizə verdiyi roldan asılıdır: «İzləyici», «Redaktor» və ya «Administrator».',
  'help.guide.tour-collection-add-to-trip.title': 'Siyahıdan səyahətə tur əlavə etmək',
  'help.guide.tour-collection-add-to-trip.tip.3':
    'Turu siyahıda saxlamaq üçün səyahətdə saxlanmış turu açın və onun aşağısındakı «Kolleksiya» düyməsinə klikləyin.',
  'help.guide.tour-collection-manage.tip.2': 'Zibil qutusunu yalnız siyahının sahibi və adminləri görür.',
  'help.guide.entry-draft.result':
    'Qeyd zaman xəttinizdə «Qaralama» işarəsi ilə qalır və paylaşılmış linkdə göstərilmir.',
  'help.guide.journey-map-layers.title': 'Gündəlik xəritəsində nəyin göstəriləcəyini seçmək',
  'help.guide.journey-keep-route.title': 'Bir gündə qeydə aldığınız marşrutu saxlamaq',
  'help.guide.journey-day-stays.title': 'Dawarich-in qeydə aldığı dayanmalardan qeydlər yazmaq',
  'help.guide.journey-take-over-day.title': 'Qeydə alınmış bütöv günü götürmək',
  'help.guide.journey-take-over-day.result':
    'Gündə indi hər dayanma və ya birləşdirilmiş qrup üçün bir qaralama, ya da bir gün hesabatı var, dayanmaları isə artıq açıq kimi göstərilmir.',
  'help.guide.journey-auto-prepare.result':
    'Əlaqələndirilmiş səyahət davam etdikcə hər günün dayanmaları həmin gündə sadalanır, «Günü köçür» üçün hazırdır.',
  'help.ctx.settings-about.title': 'Haqqında',
  'help.guide.web-push-device.tip.3':
    'Push üçün TREK HTTPS ilə açılmalıdır. Bildirişlər bloklanıbsa, brauzer tənzimləmələrində onlara icazə verin və yenidən cəhd edin.',
  'help.guide.connect-airtrail.result':
    'Nişanda «Qoşulub» yazılır, səyahətin «Nəqliyyat» vərəqi isə «AirTrail-dən idxal et» təklif edir.',
  'help.guide.connect-dawarich.result':
    'Nişanda «Qoşulub» yazılır, səyahət planlaşdırıcısı, gündəlik və Atlas isə Dawarich-in qeydə aldıqlarını təklif edə bilər.',
  'help.guide.tour-connect-wanderer.result':
    'Nişanda «Qoşulub» yazılır, səyahətin «Turlar» vərəqi isə wanderer serverinizdə axtarış edib cığırları idxal edə bilər.',
  'help.guide.tour-wanderer-watch.result':
    'TREK idxal etdiyiniz cığırları yoxlayır və biri dəyişmiş ola bilərsə, sizə xəbər verir. Tur yalnız siz dəyişikliyi qəbul etdikdə dəyişir.',
  'help.guide.plugin-settings.step.1':
    'Tənzimləmələrin yan panelində «Plaginlər»i açın. «Plagin tənzimləmələri» altında sizdən ayar tələb edən hər plaginin sahələri olan kartı var: onları doldurun və «Yadda saxla» düyməsinə klikləyin. Kartdakı «Əməliyyatlar» təsdiqinizdən sonra icra olunur.',
  'help.guide.profile.step.3': 'Kartın aşağı sağındakı «Profili yadda saxla» düyməsinə klikləyin.',
  'help.guide.default-user-settings.title': 'Yeni istifadəçilərin başlanğıc ayarlarını təyin etmək',
  'help.guide.own-routing-engine.tip.1':
    'İctimai OSRM serverləri saniyədə təxminən bir sorğuya icazə verir. Bu, bir gün üçün kifayətdir, amma avtomobil səyahəti üçün çox yavaş ola bilər.',
  'help.guide.admin-passkeys.goal': 'İstifadəçilər barmaq izi, üz və ya cihaz PIN-i ilə daxil ola bilsin.',
  'help.guide.rotate-jwt-secret.tip.2':
    'Bunun əvəzinə yalnız bir nəfəri hesabdan çıxarmaq üçün «İstifadəçini redaktə et» pəncərəsində ona «Yeni parol» verin. Bu, yalnız onun sessiyalarını bitirir.',
  'help.guide.notification-defaults.goal':
    'Hər istifadəçinin bildirişlərinin ilkin vəziyyətini təyin edin və hadisə üçün kanalı tamamilə bloklayın.',
  'help.ctx.notifications.summary':
    'TREK-in tətbiq daxilində sizə göstərdiyi bütün bildirişlər, ən yenisi birinci: kiminsə dəyişdiyi rezervasiya, səyahət çatında yeni mesaj, sizinlə paylaşılan təqvim. Yuxarı sağdakı zəng son onunu, bu səhifə isə hamısını göstərir.',
  'help.guide.read-notifications.step.1':
    'Yuxarı sağdakı zəngə klikləyin. Üzərindəki qırmızı rəqəm hələ oxumadığınız bildirişləri sayır.',
  'help.guide.filter-notifications.step.1': 'Yuxarı sağdakı zəngə klikləyin.',
  'help.guide.mark-notifications-read.step.2':
    'Bütün bildirişləri birdəfəlik oxunmuş kimi işarələmək üçün yuxarıdakı «Hamısını oxunmuş kimi işarələ» düyməsinə klikləyin.',
  'help.guide.delete-notifications.tip.1':
    'Silmə bildirişi yalnız sizin üçün silir. Onun aid olduğu rezervasiya, mesaj və ya paylaşım olduğu kimi qalır.',
  'help.guide.notification-settings.tip.1': 'Xanadakı kilid adminin həmin hadisəni hamı üçün söndürdüyünü bildirir.',
  'help.guide.add-guest.tip.3':
    'Qonaqları yalnız səyahətin sahibi əlavə edə, adını dəyişə və silə bilər. Xərci ödəmiş qonağı ödəyicini dəyişməyənə və ya ödənişi silməyənə qədər silmək olmur.',
  'help.guide.link-journal.tip.1':
    'Yalnız sahibi olduğunuz gündəlikləri bağlaya bilərsiniz. Yalnız yaza bildiyiniz gündəliyi bağlamaq olmur.',
  'help.ctx.trip-places.bullet.7':
    'Axtarışın yanındakı işarə seçim rejimini başladır. Sütunun aşağısındakı paneldən bir neçə sətrə birdəfəlik yeni kateqoriya vermək, onları kolleksiyaya əlavə etmək, ziyarət edilmiş kimi işarələmək və ya silmək üçün istifadə edin.',
  'help.guide.filter-places.step.5':
    'Səyahət birdən çox ölkə və ya regionu əhatə etdikdə qlobus siyahını bir ölkəyə və ya onun bir regionuna görə süzür, hər birinin yanında sayı göstərilir. «Filtri təmizlə» onu «Bütün ölkələr»ə qaytarır.',
  'help.guide.import-places-file.tip.3':
    'Turlar aktiv olduqda (standart olaraq belədir) faylı sütunun yuxarısındakı «Turlar» vasitəsilə, «GPX və ya KML idxal et» ilə idxal edirsiniz və onun xətləri tura çevrilir. Fayldakı sancaqlar orada idxal olunmur, çünki turlarda yalnız xətlər olur.',
  'help.guide.dawarich-stays.step.3':
    '«Ad», «Çatma» və «Ayrılma»nı yoxlayın, «Gün» seçin və ya «Hələ günə təyin edilməyib» olaraq saxlayın, istəsəniz «Qeydlər» əlavə edin və «Məkan əlavə et» düyməsinə klikləyin.',
  'help.guide.leave-stop-off-route.result':
    'Dayanacaq günün və PDF-in bir hissəsi olaraq qalır; «Marşrutdan kənar» işarəsi olduqca marşrut ondan əvvəlki dayanacaqdan birbaşa sonrakına gedir.',
  'help.guide.move-booking-day.tip.2': 'Öz günü daxilində vaxtı olan rezervasiya həmişə öz vaxtının mövqeyinə qayıdır.',
  'help.guide.place-image-from-file.step.3':
    '«Əlavə edilmiş fayllardan» altında istədiyiniz fotoya klikləyin. Onun üstündəki «Cihazdan yüklə» bunun əvəzinə kompüterinizdən yeni şəkil seçir.',
  'help.guide.place-own-hours.step.1':
    'Məkanı açın və kartın aşağı sağındakı «Redaktə et» düyməsinə klikləyin. Məkanın forması açılır.',
  'help.guide.place-own-hours.tip.3':
    'Kartda yenidən avtomatik tapılmış saatları göstərmək üçün «İş saatlarını sil», sonra «Yenilə» düyməsinə klikləyin.',
  'help.guide.confirm-stay-booking.title': 'Qalmanın rezervasiyasını təsdiqləmək',
  'help.guide.confirm-stay-booking.tip.2':
    'Eyni nişan bütün rezervasiyalarda, o cümlədən gündə «Rezervasiyalar» altındakı rezervasiyalarda işləyir.',
  'help.guide.map-lock.tip.2':
    'Bu brauzer kilidi hər səyahət üçün yadda saxlayır. Səyahəti açdıqda xəritə yenə də bir dəfə səyahətə yaxınlaşır ki, heç vaxt boş ərazidə açılmasın.',
  'help.guide.tour-map-lines.step.2':
    'Xəttə və ya onun başlanğıcındakı sancağa klikləyin. Turun kartı xəritənin aşağı hissəsində açılır, xətti isə ağ haşiyə ilə daha qalın çəkilir ki, onu digər xətlər arasında görəsiniz. Kartın başlığındakı X onu bağlayır.',
  'help.guide.car-stops.title': 'Yolboyu dayanacaqlarla avtomobil səfəri planlaşdırmaq',
  'help.guide.car-stops.result':
    'Səfər «Nəqliyyat» vərəqində kart, öz günündə isə sətirdir, xəritədəki xətti götürmə yerindən bütün dayanacaqlardan ardıcıllıqla keçərək qaytarma yerinə gedir.',
  'help.guide.transport-details.step.5':
    'Təfərrüatların aşağısındakı «Xəritədə» gedişin xəttini göstərir və «Plan»ı onun günündə açır. Ən sağdakı «Redaktə et» tam formanı açır, yanındakı zibil qutusu isə təsdiqdən sonra gedişi silir.',
  'help.guide.export-transports-csv.step.1':
    'Yalnız bir hissəsini istəyirsinizsə, əvvəlcə siyahını daraldın. «Axtar», «Filtrlə» və «Görünüş seçimləri»ndəki sıralama nəzərə alınır: faylda vərəqin göstərdikləri, göstərdiyi ardıcıllıqla olur.',
  'help.guide.group-sort-bookings.tip.1':
    '«Kartlar» və «Siyahı» öz qruplaşdırmasını saxlayır: «Kartlar» «Vəziyyət», «Siyahı» isə «Gün» ilə başlayır. «Görünüş seçimləri»ndəki nöqtə nəyinsə standartdan fərqli olduğunu göstərir, panelin aşağısındakı «Görünüşü sıfırla» isə standartı bərpa edir.',
  'help.guide.booking-on-map.step.2': 'Təfərrüatların aşağısındakı «Xəritədə» düyməsinə klikləyin.',
  'help.guide.export-bookings-csv.goal':
    'Səyahətin rezervasiyalarını Excel, Numbers və ya başqa cədvəl proqramında açmaq üçün CSV faylı kimi ixrac edin.',
  'help.guide.arrange-packing-list.goal':
    'Bütöv siyahıları və ayrı-ayrı elementləri istədiyiniz yerə köçürün və ya hər siyahını ad sırası ilə görün.',
  'help.guide.check-off-packing.tip.4':
    'Miqdarı birdən çox olan elementin ədədlərini bir-bir də yığılmış kimi işarələyə bilərsiniz. «Pack several of one thing» bələdçisinə baxın.',
  'help.guide.count-packed-pieces.tip.1':
    'Qutunu işarələmək bütün ədədləri birdəfəlik yığır, işarəni götürmək isə hamısını yenidən çıxarır.',
  'help.guide.expense-receipts.goal':
    'Qəbzi və ya fakturanı aid olduğu xərclə birlikdə saxlayın və hesab dəftərindən yenidən açın.',
  'help.guide.expense-receipts.tip.2':
    'Qəbzin yanındakı zibil qutusu yadda saxladıqda onu xərcdən çıxarır. Faylın özü «Fayl» bölməsində qalır; tamamilə silmək üçün onu orada silin.',
  'help.guide.files-sync.tip.4':
    'Kartda «Yenidən qoşul» olan sarı bildiriş görünürsə, saxlama xidməti saxlanmış giriş məlumatlarını artıq qəbul etmir. «Yenidən qoşul» düyməsinə klikləyin, yeni tətbiq parolu və ya token daxil edin, sinxronizasiya yenidən başlayır.',
  'help.guide.files-sync-settings.result':
    'Növbəti dəfədən etibarən səyahət yalnız seçdiyiniz istiqamətdə sinxronlaşır, silinmələr və ziddiyyətli redaktələr isə təyin etdiyiniz qaydalarla həll olunur.',
  'help.guide.manage-notes.result':
    'Qeyd «Qeydlər» kartından bütün üzvlər üçün birdəfəlik silinib. Sadəcə bərkitdiyiniz və ya dəyişdiyiniz qeyd qalır və digərləri onu sizin buraxdığınız kimi görür.',
  'help.guide.note-categories.step.4':
    'Sətirdəki rəng nöqtələri həmin kateqoriyanın rəngini təyin edir: «İndiqo», «Qırmızı», «Kəhrəba», zümrüd, «Mavi» və ya «Bənövşəyi». Burada «Yaşayış yeri» kəhrəba rəngə keçir.',
  'help.guide.roadtrip-reorder.step.3':
    'Klaviatura ilə dayanacağı fokuslayın və onu gün daxilində bir pillə hərəkət etdirmək üçün Alt ilə yuxarı və ya aşağı oxu basın.',
  'help.guide.roadtrip-overnight.title': 'Marşrut boyunca gecələmək',
  'help.guide.roadtrip-overnight.tip.1':
    'Gecələmə növbəti günə qədər davam edir. Başqa tarixlər üçün rezervasiyanı dəyişin: tarixləri «Gün» altında, qalmanın qalan hissəsi ilə birlikdə dəyişin.',
  'help.guide.roadtrip-stop-fill.tip.1':
    'Nişan yalnız avtomobilinizin yanacaq və ya enerji ala biləcəyi dayanacaqlarda görünür: «Benzin» üçün yanacaq dayanacaqlarında, «Elektrik» üçün şarj dayanacaqlarında, «Fərqi yoxdur» üçün hər ikisində.',
  'help.guide.roadtrip-bookings.result':
    'Rezerv edilmiş hər gediş səfərdə baş verdiyi nöqtədə görünür, ondan əvvəlki və sonrakı marşrut isə onun terminallarına gedir və oradan çıxır.',
  'help.guide.roadtrip-google-import.step.1':
    '«Marşrut boyunca»nın yuxarısındakı üç nöqtəyə klikləyin və «Google Maps marşrutunu idxal et» seçin.',
  'help.guide.roadtrip-hazards.title': 'Cari xəbərdarlıqları xəritədə göstərmək',
  'help.guide.roadtrip-hazards.tip.3':
    'Məlumat axınları hər on dəqiqədən bir yenilənir və internet bağlantısı tələb edir. Digər sürmə tənzimləmələri kimi, bu açar da səyahət üçün yadda saxlanır.',
  'help.ctx.trip-tours.bullet.6':
    'Marşrutu dəyişmək və turu silmək «Turlar» vərəqində, «Bu səyahətin turları» altında olur.',
  'help.guide.tour-show-list.tip.1':
    'Xəritədə turun xəttinə klikləyin, siyahı həmin turu işarələyir və ona qədər sürüşür.',
  'help.guide.tour-add-to-day.step.3':
    '«Added to day 10» bunu təsdiqləyir, sətirdə gün nişanı yaranır, sol sütundakı gün isə turu vaxtı, məsafəsi və qalxışı ilə göstərir.',
  'help.guide.tour-day-times.title': 'Tura öz günündə başlama vaxtı vermək',
  'help.guide.tour-day-times.tip.3':
    'Həmin menyudakı «Marşruta daxil etmə» turu gündə saxlayır, amma xəritədə günün marşrutundan çıxarır. «Yenidən marşruta əlavə et» bunu geri qaytarır.',
  'help.guide.tour-remove-from-day.tip.1':
    'Çoxgünlük turu günlərdən bir-bir çıxarırsınız, çünki hər günün öz mərhələsi var.',
  'help.guide.tour-filter-list.step.4':
    'Menyunu bağlayın. Düymədə indi vəziyyət, qalan turların sayı və təyin etdiyiniz hər əlavə filtr üçün +1 göstərilir.',
  'help.guide.tour-hide-on-map.step.2':
    'Turun xətti xəritədə gizlənir. Sətri siyahıda solğun halda qalır və üstündən xətt çəkilmiş göz («Xəritədə göstər») göstərir. Xətti yenidən göstərmək üçün ona klikləyin.',
  'help.guide.tour-import-plan-tab.step.2':
    'Siyahının yuxarısındakı «GPX və ya KML idxal et» düyməsinə klikləyin və fayllarınızı (GPX, KML və ya KMZ) seçin.',
  'help.ctx.trip-tour-detail.bullet.2':
    'Başlıqda turun dairəvi xanası, adı və adını dəyişmək üçün qələm, xəttinin rəngi üçün rəngli nöqtə, həmçinin növ, mənbə, planlaşdırılan vaxt, məsafə, qalxış və eniş üçün nişanlar var. Sağdakı X kartı bağlayır, Escape də.',
  'help.guide.tour-detail-read.step.3':
    'Vaxtın nədən ibarət olduğunu görmək üçün kursoru onun üzərinə gətirin: hərəkətdə keçən vaxt, fasilələr və planlaşdırılan ümumi vaxt.',
  'help.guide.tour-detail-read.tip.4':
    'Kart marşrutu dəyişmir. Nöqtəni köçürmək və ya hissəni yenidən çəkmək üçün «Turlar» vərəqini açın və «Bu səyahətin turları» altında tura klikləyin.',
  'help.guide.tour-rename-colour.step.4':
    'Rəng seçin. İlk xana, «Avtomatik rəng», xətti standart rənginə qaytarır, sonuncu, «Fərdi rəng seç», istənilən rəngi seçməyə imkan verir. Xəritədəki xətt və «Turlar» siyahısındakı zolaq dərhal dəyişir.',
  'help.guide.tour-take-along.step.3':
    'Saxlanmış turu GPX faylı kimi endirmək üçün GPX düyməsinə klikləyin: bütün marşrutu mövcud hündürlüklərlə birlikdə, naviqasiya tətbiqi və ya GPS cihazı üçün hazır.',
  'help.guide.tour-copy-keep.step.1':
    'Turun kartını açın və aşağıdakı «Kopyala» düyməsinə klikləyin. TREK günləri olmayan yeni, müstəqil tur yaradır, orijinal isə olduğu kimi qalır.',
  'help.guide.tour-copy-keep.result':
    'Səyahətdə sərbəst dəyişə biləcəyiniz ikinci tur var, kolleksiyada isə başqa səyahətə əlavə etməyə hazır öz nüsxəsi saxlanır.',
  'help.guide.tour-packing-link.tip.1':
    'Bu, sadəcə əlaqədir. Heç nə kopyalanmır və köçürülmür, elementlər «Siyahılar»da qalır. Orada birini işarələyin, tur bunu dərhal göstərir.',
  'help.guide.tour-files.step.3': 'Faylı açmaq üçün ona klikləyin.',
  'help.guide.tour-activity-link.step.3':
    '«İz» altında qeydi seçin və ya yeni fayl gətirmək üçün «GPX idxal et» düyməsinə klikləyin.',
  'help.guide.tour-activity-compare.goal':
    'Faktiki izin plandan harada fərqləndiyini görün, onu dəyişin və ya əlaqəni silin.',
  'help.guide.tour-origin-check.title': 'Turun haradan gəldiyini görmək',
  'help.guide.tour-origin-check.result':
    'Turun haradan, nə vaxt gəldiyini və o vaxtdan bəri dəyişib dəyişmədiyini bilirsiniz.',
  'help.ctx.trip-tour-planner.bullet.6':
    'Yadda saxlanmamış qaralama itmir: «Turlar» vərəqini yenidən açın, o, «Saxlanılmamış qaralama bərpa edildi» işarəsi ilə bərpa olunur. «Turlara qayıt» və «İmtina et» dəyişiklikləri ləğv etməzdən əvvəl soruşur.',
  'help.guide.tour-open-workspace.step.6':
    'Aşağı soldakı panel xəritəni dəyişir, əvvəlcə «Xəritə» və ya «Peyk». Tur açıq olduqda onun növünə aid xəritələri, məsələn, Topo və ya «Gəzinti», həmçinin «Nöqtə qoy» və 3D kimi açarları təklif edir.',
  'help.guide.tour-draw-route.step.1':
    'Sol zolağın yuxarısındakı «Yeni tur planlaşdır» düyməsinə klikləyin. Zolaq «Yeni tur» olur; başqa növ seçməsəniz, bu yürüşdür.',
  'help.guide.tour-draw-route.tip.3':
    'Qaralamada yadda saxlanmamış dəyişikliklər varsa, «Tur əlavə et» menyusundakı «Yeni tur planlaşdır» əvvəlcə «Yeni tur başlansın?» deyə soruşur, «Ləğv et və başla» seçimi ilə.',
  'help.guide.tour-type-profile.step.4':
    'Marşrut profil üçün yenidən planlaşdırılır, sağdakı «Turun xülasəsi» isə onun məsafəsini və vaxtını göstərir.',
  'help.guide.tour-edit-points.step.3':
    'Ardıcıllığı dəyişmək üçün kursoru sətrin üzərinə gətirin və sol kənarında görünən tutacaqdan tutub sürükləyin.',
  'help.guide.tour-shaping-points.goal': 'Dayanacaq əlavə etmədən marşrutu başqa yola keçirin.',
  'help.guide.tour-shaping-points.result':
    'Marşrut sürüklədiyiniz yerdən keçir, dayanacaqlar isə əvvəlki kimi nömrələnib.',
  'help.guide.tour-loop-reverse.tip.3':
    'Yürüşdə onların yanındakı «Başlanğıcdan dairəvi marşrut» seçdiyiniz uzunluqda dairəvi yürüşlər axtarır.',
  'help.guide.tour-leg-by-hand.tip.1':
    'Əllə çəkilmiş hissəni heç bir marşrutlaşdırıcı yoxlamayıb: o, sudan, şəxsi ərazidən və ya qayalıqdan keçə bilər.',
  'help.guide.tour-trip-places.step.4':
    'Onun sətrində adın altında «Səfərin yeri» yazılır. «Digər əməliyyatlar»dakı «Yerlə əlaqəni ləğv et» nöqtəni saxlayır, amma əlaqəni silir.',
  'help.guide.tour-details-times.step.2': '«Ətraflı məlumat» altında «Təsvir» yazın və varsa, «Veb-sayt» əlavə edin.',
  'help.guide.tour-save.goal': 'Çəkdiyiniz turu səyahətdə saxlayın.',
  'help.guide.tour-save.result': 'Tur səyahətdə yadda saxlanıb, günə əlavə edilməyə hazırdır.',
  'help.guide.tour-edit-saved.tip.2':
    'İdxal edilmiş GPX və ya KML izi baxmaq üçün «GPX turu» kimi açılır. Oradakı «Redaktə edilə bilən versiya planlaşdır» dəyişə biləcəyiniz tur yaradır.',
  'help.guide.tour-summary-profile.step.4':
    'Başlığın yanındakı ox, «Yüksəklik profilini yığ», profili gizlədir; göstərmək üçün ona yenidən klikləyin.',
  'help.guide.tour-list-manage.step.2':
    'Səyahətin günlərini açmaq üçün kursoru turun üzərinə gətirin və sətrindəki dairəvi artıya, «Günə əlavə et»ə klikləyin.',
  'help.guide.tour-delete.title': 'Turu silmək',
  'help.guide.tour-saved-elsewhere.title': 'Tur başqa yerdə yadda saxlandıqda',
  'help.guide.tour-saved-elsewhere.result': 'Kimsə onları ləğv etməyi seçməsə, heç bir dəyişiklik itmir.',
  'help.guide.tour-import-gpx.title': 'GPX, KML və ya KMZ faylını tur kimi idxal etmək',
  'help.guide.tour-import-gpx.tip.2': 'Fayldakı hər iz və ya marşrut ayrıca tur olur. İzlər heç vaxt birləşdirilmir.',
  'help.guide.tour-view-import.step.2':
    'Sol sütun onu «GPX turu» kimi göstərir: məsafəsi, hündürlükləri və qeydə alınmış vaxtı ilə «Turun xülasəsi», altında isə hündürlük profili. Xəritədə onun xətti göstərilir.',
  'help.guide.tour-plan-from-import.step.1':
    'İdxal edilmiş turu «Turlar» vərəqində açın. Soldakı «Redaktə edilə bilən versiya» kartında «Redaktə edilə bilən versiya planlaşdır» düyməsinə klikləyin.',
  'help.guide.tour-plan-from-import.result':
    'Turda indi sürükləyə biləcəyiniz yol nöqtələri var, «Mənşə» bölməsində isə «Yenidən planlaşdırılıb, yazılmış iz saxlanılıb» yazılır.',
  'help.guide.tour-restore-recorded.result': 'Tur yenidən «GPX turu»dur və qeydə alındığı xətti göstərir.',
  'help.guide.tour-take-over.step.6': '«Götür» düyməsinə klikləyin.',
  'help.guide.tour-import-wanderer.step.2':
    '«Cığırları axtar» sahəsinə yazın. «Bu xəritə sahəsində axtar» yalnız xəritənin görünən hissəsindəki cığırları göstərir.',
  'help.ctx.trip-tour-map.title': 'Tur xəritəsi',
  'help.guide.tour-map-layers.goal':
    'Tur növünə ən uyğun xəritədə planlaşdırın: qalxışlar üçün horizontallar, nişanlanmış cığırlar və ya velosiped marşrutları, ya da peyk görüntüləri.',
  'help.guide.tour-along-search.title': 'Tur boyunca yerlər tapmaq',
  'help.guide.tour-along-search.tip.1':
    'Marşrutu, növləri və ya məsafəni dəyişdikdən sonra «Yenidən axtar» vurğulanır və siyahının marşrutun əvvəlki halı üçün tapıldığını bildirir. Siyahını yeniləmək üçün ona klikləyin.',
  'help.guide.tour-along-add-stop.step.4':
    'Marşrut həmin yerdən keçməklə yenidən planlaşdırılır, «Tur boyunca» isə turun nə qədər məsafə və vaxt artdığını göstərir. Həmin sətirdəki «Geri qaytar» dayanacağı yenidən silir.',
  'help.guide.tour-3d-terrain.step.2':
    'Marşrut meylə görə rənglənir. Bunun əvəzinə onu turun rəngində çəkmək üçün aşağıdakı sırada «Meyil» düyməsinə, meylləri yenidən göstərmək üçün isə ona təkrar klikləyin.',
  'help.guide.tour-3d-flyover.title': 'Tur boyunca uçmaq',
  'help.guide.tour-3d-flyover.tip.2':
    'Uçuş yalnız bütün marşrut boyunca relyef yükləndikdən sonra başlayır ki, xəritə məlumatlarını yükləmək üçün yarı yolda dayanmasın. Nə qədərinin yükləndiyini görmək üçün kursoru halqanın üzərinə gətirin.',
  'help.guide.tour-map-overlays.result':
    'Pistlər və ya dəniz nişanları xəritənin üzərində çəkilir, legenda isə onları izah edir.',
  'help.ctx.trip-tour-stages.bullet.3':
    '«Turun xülasəsi» «Mərhələlər» altında hər mərhələni başladığı dayanacaqdan bitdiyi dayanacağa qədər sadalayır. Mərhələyə klik onun son dayanacağını seçir və hündürlük profilində həmin yeri işarələyir.',
  'help.guide.tour-multi-day.step.4':
    '«Yol nöqtələri» indi «Stage 1» və «Stage 2» bölmələrinə ayrılır, hər birində məsafə və vaxt göstərilir. Mərhələni bitirən dayanacaqda ay işarəsi görünür.',
  'help.guide.tour-stages-on-days.title': 'Çoxgünlük turu səyahətin günlərinə yerləşdirmək',
  'help.guide.tour-stages-on-days.tip.1':
    'Səyahət son mərhələdən əvvəl bitirsə, seçimdə sığan son mərhələ göstərilir. Ondan sonrakı mərhələlərə gün verilmir.',
  'help.ctx.trip-tour-hike.bullet.2':
    '«Yol nöqtələri» dayanacaqları ardıcıllıqla sadalayır. «Nöqtə əlavə et» əvvəldən aktivdir, ona görə xəritəyə klik növbəti nöqtəni qoyur; yanındakı «Səfər yerləri» səyahətdəki daxmanı və ya oteli dayanacağa çevirir.',
  'help.guide.tour-hike-plan.step.2': '«Tur növü»nü açın və «Yürüş» seçin: piyada, təyin etdiyiniz çətinlik daxilində.',
  'help.guide.tour-hike-plan.tip.3':
    'Çətinliyin altındakı «Marşrut seçimi» marşrut üçün üstünlükləri təyin edir: «Dik yoxuşlardan qaç», «Pilləkənlərdən qaç» və «Bərələrdən qaç». Başqa yol olmadıqda marşrut yenə də oradan keçir.',
  'help.guide.tour-hike-trail-details.step.5':
    'Eyni marşrutu ayağınızın altındakı örtüyə görə, asfaltdan təbii torpaq və qayaya qədər görmək üçün «Səth» düyməsinə klikləyin.',
  'help.guide.tour-hike-round.step.2':
    'Xəritənin üzərində «Dairəvi yürüş» kartı açılır. «Kimdən» altında başlanğıcı yoxlayın və istədiyiniz «Məsafə»ni yazın. Yanındakı nişan dairəvi yürüşün ola biləcəyi uzunluq aralığını göstərir.',
  'help.guide.tour-hike-compare-ways.title': 'Yürüşün bir hissəsi üçün başqa yolları müqayisə etmək',
  'help.guide.tour-hike-compare-ways.tip.2':
    'Marşrutlaşdırıcı başqa yol bilmirsə, kart bunu bildirir. Marşrutlaşdırıcı seçdiyiniz yolla gedə bilmirsə, hissə olduğu kimi qalır və kart bunu sizə deyir.',
  'help.guide.tour-ferrata-add.step.5':
    'Sağdakı «Turun xülasəsi» dərəcəsi ilə «Via ferrata marşrutu» nişanını göstərir, redaktorun başlığı isə «Marşrut via ferrata üzərindən keçir» xəbərdarlığını verir.',
  'help.guide.tour-run-plan.step.1': '«Yeni tur planlaşdır» düyməsinə klikləyin, «Tur növü»nü açın və «Qaçış» seçin.',
  'help.guide.tour-run-plan.tip.3': 'Məsafələriniz mil ilədirsə, temp də hər mil üçündür.',
  'help.guide.tour-run-ways.tip.1': 'Buradakı heç nə qaçışın marşrutunu və ya vaxtını dəyişmir.',
  'help.ctx.trip-tour-walk.bullet.5':
    '«Bu səyahətin turları»ndakı «Tur əlavə et» Google Maps-dən paylaşılmış piyada marşrutunu idxal edir. «Plan» vərəqində öz günündən açılan gəzintinin dayanacaqlarını həmin gün üçün işarələyə bilərsiniz.',
  'help.guide.tour-walk-plan.step.6':
    'Sağdakı «Turun xülasəsi» «Təxm. piyada vaxtı», «Dayanacaqlar» və ikisinin cəmi olan «Planlaşdırılıb» göstərir. Gəzintini saxlamaq üçün sol sütunun aşağısındakı «Yadda saxla» düyməsinə klikləyin.',
  'help.guide.tour-walk-sights.step.2':
    'Mövzu «Nə axtarılsın» bölməsini doldurur. Növləri yandırıb söndürmək üçün onu açın və «Marşrutdan bu məsafədə» altında nə qədər uzaqda axtarılacağını seçin.',
  'help.guide.tour-walk-day-times.title': 'Gün üçün çatma vaxtlarını və iş saatlarını görmək',
  'help.guide.tour-walk-day-times.tip.3':
    'İş saatları OpenStreetMap-dən və ya dayanacağın aid olduğu səyahət yerindən gəlir, yanındakı nişan hansından gəldiyini göstərir. Getməzdən əvvəl onları yoxlayın.',
  'help.guide.tour-walk-google-import.step.4':
    '«Gəzinti kimi yüklə» düyməsinə klikləyin. TREK dayanacaqlar arasındakı piyada yolu özü planlaşdırır. Gəzintini saxlamaq üçün «Yadda saxla» düyməsinə klikləyin.',
  'help.guide.tour-walk-check-off.step.2':
    '«Gəzintinin dayanacaqları»na qədər sürüşdürün. Hər dayanacaqda orada nə qədər qalacağınız, gəzintinin başlama vaxtı varsa, nə vaxt çatacağınız göstərilir.',
  'help.ctx.trip-tour-bike.summary':
    '«Turlar» vərəqində redaktorda açıq velosiped turu: marşrutun qurulduğu profil, sürmə vaxtı, marşrutun hansı örtüklərdən keçdiyi, dağ velosipedi turunda isə cığırlarının hansı çətinlik dərəcəsində olduğu.',
  'help.guide.tour-bike-profile.step.2': '«Tur növü» sahəsini açın və «Velosiped turu» seçin.',
  'help.guide.tour-bike-profile.tip.3':
    'Nöqtənin yaxınlığında velosiped üçün yol yoxdursa, zolaqda «No way for bikes reaches point N» yazılır. Nöqtəni köçürün və ya ondan əvvəlki nöqtədə «Digər əməliyyatlar»ı açıb «Növbəti hissəni əllə çək» seçin.',
  'help.guide.tour-bike-surfaces.step.4':
    'Marşrutun harada həmin yolla getdiyini görmək üçün «Yol növü» altında «Təsərrüfat və ya meşə yolu» və ya «Nəqliyyatlı yol» kimi sətrə klikləyin.',
  'help.guide.tour-bike-mtb-grades.step.1':
    'Velosiped turunu redaktorda açın və «Profil»in MTB olduğunu yoxlayın. Cığır dərəcələri yalnız bu profildə oxunur.',
  'help.ctx.trip-tour-ski.title': 'Xizək və qış turları',
  'help.guide.tour-ski-plan.goal':
    'Xəritədəki pistlər, liftlər və cığırlar boyunca pistlərdə bir gün, xizək qaçışı dairəsi, xizək turu və ya qar ayaqqabısı ilə gəzinti planlaşdırın.',
  'help.guide.tour-ski-plan.tip.2':
    '«Növ» yanındakı məlumat nöqtəsi TREK-in xizək turları ilə nə etdiyini izah edir. Orada və ümumiyyətlə burada heç nə qar, uçqunlar və ya pistlərin, liftlərin və cığırların açıq olub olmadığı barədə məlumat vermir.',
  'help.guide.tour-ski-options.step.3':
    '«Üstünlük ver» altında «Ən sürətli», «Ən çox xizək» və ya «Ən asan» seçin. «Temp» altında «Sakit», «Normal» və ya «İdmanlı» seçin: bu, marşrutlaşdırıcının hər pistə verdiyi vaxtı dəyişir.',
  'help.guide.tour-ski-fix-leg.goal': 'Qırmızı hissəni bir kliklə planlaşdırın və ya düz çəkin.',
  'help.guide.tour-ski-fix-leg.result':
    'Artıq qırmızı hissə yoxdur: hər biri ya pistlərlə gedir, ya da nöqtələri arasında düz xətt kimi uzanır.',
  'help.guide.tour-ski-summary.tip.3':
    'Saxlanmış tur saxlandığı kimi açılır. Onu cari pist məlumatları ilə yenidən planlaşdırmaq üçün nöqtəni köçürün və ya seçimi dəyişin.',
  'help.guide.tour-ski-pistes-layer.tip.1':
    'Açar boz qalırsa və «Trassları görmək üçün yaxınlaşdırın» yazırsa, xizək ərazisinə yaxınlaşın.',
  'help.guide.tour-ski-import.step.3':
    '«Növ»ü, «Xizək qaçışı» üçün isə «Texnika»nı seçin. Bunu edənə qədər pəncərədə «Choose a discipline to import the track as ski» yazılır.',
  'help.ctx.trip-tour-paddle.title': 'Avarçəkmə turları',
  'help.guide.tour-paddle-setup.title': 'Avarçəkmə turu planlaşdırmaq',
  'help.guide.tour-paddle-setup.step.7':
    '«Nöqtə əlavə et» rejiminin aktiv olduğunu yoxlayın, sonra xəritəyə klikləyin: əvvəlcə suya düşdüyünüz yer, sonra yoldakı nöqtələr və sudan çıxdığınız yer.',
  'help.guide.tour-paddle-water-route.step.1':
    'Əllə çəkilmiş hissədə nöqtənin altında uzunluğu ilə birlikdə «Əllə çəkilib, marşrutlaşdırılmayıb» yazılır. TREK onun xəttini çəkdiyiniz kimi saxlayır.',
  'help.guide.tour-paddle-water-route.tip.4':
    'Hissə planlaşdırılmayıbsa, yadda saxlamaq olmur. Əvvəlcə onu suda planlaşdırın və ya əllə çəkin.',
  'help.guide.tour-paddle-portage.step.5':
    '«Çıxış və giriş» altında sudan çıxmaq, yükü boşaltmaq və yenidən suya düşmək üçün lazım olan dəqiqələri yazın. Boş buraxsanız, TREK 10 dəqiqə götürür.',
  'help.guide.tour-paddle-lock.step.2':
    '«Bu nöqtədə şlüz» seçin. Nöqtənin altında «Vaxt göstərilməyib» işarəli şlüz kartı görünür.',
  'help.guide.tour-paddle-time.goal':
    'Su, daşıma, şlüzlər və fasilələrin necə toplandığını görün və öz dəyərlərinizi təyin edin.',
  'help.guide.tour-paddle-time.tip.3':
    'Fasilələr və öz planlaşdırdığınız ümumi vaxt «Ətraflı məlumat» altında təyin olunur. Planlaşdırılan ümumi vaxt varsa, kart təxminin yanında «Planlaşdırdığın ümumi müddət»i göstərir.',
  'help.guide.tour-paddle-wind.tip.1':
    'Proqnoz yalnız növbəti 16 gün üçün var. Daha uzaq gün üçün proqnozun hansı tarixdən mövcud olacağı, keçmiş gün üçün isə günün keçdiyi bildirilir.',
  'help.guide.tour-paddle-checklist.step.2':
    'Altındakı sətir məlumatların nə qədər təzə olduğunu göstərir: OpenStreetMap üçün «OSM tarixi», TREK-in onu oxuduğu vaxt üçün «Alınma tarixi», bütün marşrutu əhatə etmədikdə isə «Maneə məlumatları».',
  'help.guide.tour-paddle-checklist.tip.5':
    'Yoxlama siyahısı təhlükəsizlik və ya hüquqi icazə deyil. Qərarınız OpenStreetMap-də qeydə alınmış qadağanı və ya şəxsi ərazini aradan qaldırmır.',
  'help.guide.tour-paddle-track-marks.step.5':
    '«Daşıma» düyməsinə klikləyin, sonra xəttdə sudan çıxdığınız və yenidən suya düşdüyünüz yerə klikləyin.',
  'help.ctx.trip-tour-horse.summary':
    'At gəzintisi heç vaxt marşrutlaşdırılmır. O, OpenStreetMap-in bildiyi nişanlanmış at marşrutlarının hissələrindən qurulur və əllə çəkdiyiniz parçalarla birləşdirilir, ya da tam qeydə aldığınız kimi saxlanır.',
  'help.guide.tour-horse-plan.step.1':
    'Gəzmək istədiyiniz ərazini xəritədə görünən hala gətirin, sonra sol sütunun yuxarısındakı «Yeni tur planlaşdır» düyməsinə klikləyin.',
  'help.guide.tour-horse-plan.tip.1':
    'At marşrutu orada at sürməyə icazə vermir. «At üçün giriş» yalnız OpenStreetMap-dəki teqləri göstərir. Həmişə yerindəki nişanlara əməl edin.',
  'help.guide.tour-horse-gap.step.2':
    '«Əl ilə çəkilmiş hissə ilə birləşdir» açarını yandırın. Boşluq düz və yoxlanılmamış xətlə çəkilir.',
  'help.guide.tour-horse-recorded.goal':
    'GPS cihazında və ya tətbiqdə qeydə aldığınız at gəzintisini idxal edin və onu tam keçdiyiniz kimi saxlayın.',
  'help.guide.tour-horse-recorded.tip.3':
    'Eyni önbaxışı açmaq üçün faylı «Turlar» vərəqinin istənilən yerinə də ata bilərsiniz.',
  'help.guide.create-trip.tip.3':
    '«Səyahət yoldaşları» altında burada artıq hesabı olan insanları əlavə edə bilərsiniz. Səyahət yaradılan kimi onlar onun üzvü olur.',
  'help.guide.trip-reminder.step.1':
    'Səyahətin kartındakı qələmə klikləyin. Yeni səyahət üçün «Yeni səyahət» formasında eyni bölmə var.',
  'help.guide.company-holidays.tip.2':
    'Tam şirkət tətili həmin gün artıq qeyd olunmuş məzuniyyəti silir, beləliklə, heç kim bunun üçün məzuniyyət limitindən istifadə etmir.',
  'help.guide.half-company-holiday.tip.2':
    'Təmizləmək üçün eyni ayarlarla günə yenidən klikləyin, tam şirkət tətili etmək üçün isə «Yarım gün» söndürülmüş halda klikləyin.',
  'help.guide.edit-holiday-calendar.step.1':
    '«Tənzimləmələr»i açın və təqvimi «Rəsmi bayramlar» və ya «Məktəb tətilləri» altında tapın.',
  'help.guide.person-color.goal': 'Özünüzə və ya birgə planlaşdırdığınız şəxsə daha asan seçilən rəng verin.',
  'help.guide.answer-fusion-request.tip.2': 'Sonradan hər biriniz birləşdirməni ləğv edə bilər, qeydləriniz isə qalır.',
  'help.guide.log-for-partner.tip.2':
    'Həmin şəxs dəyişikliyi dərhal görür, onun «Məzuniyyət limiti» sətri də dərhal yenilənir.',
  'help.guide.country-places.title': 'Ölkədəki bütün məkanları görmək',
  'help.guide.tour-activity-stats.step.1':
    'Xəritənin aşağısındakı paneldə «Statistika» və «Arzular siyahısı» yanındakı «Turlar» vərəqini açın.',
  'help.guide.tour-activity-stats.tip.2':
    'Turun təfərrüatlarında «Faktiki iz əlavə et» ilə əslində keçdiyiniz izi bağlayın, burada planlaşdırılmış dəyərləri onun qeydə alınmış dəyərləri əvəz edir. Bir neçə günə planlaşdırılmış tur bir dəfə sayılır.',
  'help.ctx.collections.bullet.7':
    'Saxlanmış turlar: səyahətdən saxladığınız turlar siyahının ilk sətirləridir, dərəcəsi, növü, gəldiyi səyahət və ölçüləri ilə. «Səfərə əlavə et» ondan yeni tur yaradır, zibil qutusu isə onu siyahıdan silir.',
  'help.guide.move-to-list.title': 'Məkanları başqa siyahıya köçürmək və ya kopyalamaq',
  'help.guide.copy-to-trip.tip.2': 'Səyahətdə artıq olan məkan buraxılır və TREK neçəsinin buraxıldığını göstərir.',
  'help.guide.accept-list-invite.tip.2':
    'Üzvlərini görmək üçün siyahının yuxarısındakı «Paylaşılan» düyməsinə klikləyin. Siyahıdan yenidən çıxmaq üçün orada «Siyahıdan ayrıl» düyməsinə klikləyin.',
  'help.guide.tour-collection-add-to-trip.goal':
    'Siyahıda saxlanmış turdan səyahətlərinizdən birində yol nöqtələri ilə və ya onlarsız yeni tur yaradın.',
  'help.guide.tour-collection-add-to-trip.result':
    'Pəncərə turun artıq həmin səyahətə aid olduğunu təsdiqləyir. «Səfəri aç» sizi ora aparır. «Bağla» sizi «Kolleksiyalar»da saxlayır.',
  'help.guide.tour-collection-manage.tip.3':
    'Saxlanmış turlar yalnız öz siyahılarında görünür, «Bütün saxlanılanlar»da yox.',
  'help.guide.search-journey.step.3':
    'Ora sürüşmək üçün günə, həmin günün qeydlərini görüb birini seçmək üçün isə onun oxuna klikləyin.',
  'help.guide.journey-map-layers.goal':
    'Plan ilə əslində baş verənlər arasındakı fərqi görün və qatları yandırıb söndürün.',
  'help.guide.journey-keep-route.goal':
    'Günün Dawarich-dən gələn real marşrutunu gündəlik xəritəsinə əlavə edin və orada saxlayın.',
  'help.guide.journey-day-stays.goal': 'Dawarich-in qeydə aldığı dayanmaları bir-bir qeydlərə çevirin.',
  'help.guide.journey-take-over-day.goal':
    'Günün dayanmalarını bir addımda qaralama qeydlərə və ya bir gün hesabatına çevirin.',
  'help.guide.journey-auto-prepare.title': 'TREK qeydə alınmış günlərinizi hazırlasın',
  'help.guide.photo-location.title': 'Qeydləri fotolarının çəkildiyi yerə yerləşdirmək',
  'help.ctx.settings-about.summary':
    'TREK nədir, bu server hansı versiyada işləyir və layihəni harada tapmaq olar: sənədlər, xətanı harada bildirmək və layihəni dəstəkləmək yolları.',
  'help.guide.startup.tip.2': 'Söndürdüyünüz əlavəyə aid başlanğıc vərəqi əvəzinə planı açır.',
  'help.guide.web-push-device.title': 'Bu cihazda push bildirişləri almaq',
  'help.guide.connect-airtrail.tip.1': 'Kart yalnız admin AirTrail əlavəsini aktiv saxladıqca görünür.',
  'help.guide.connect-dawarich.tip.1':
    'TREK yalnız qeyd, məkan və ölkə təklif edir; siz təsdiqləyənə qədər heç nə əlavə olunmur və Dawarich-ə heç nə geri yazılmır.',
  'help.guide.tour-connect-wanderer.tip.1': 'Kart yalnız admin «Turlar» altında wanderer-ə icazə verdikdə görünür.',
  'help.guide.tour-wanderer-watch.tip.1':
    'Xəbərdarlıq turu heç vaxt dəyişmir; nəyin həqiqətən dəyişdiyini turun mənbə yoxlaması göstərir.',
  'help.guide.api-keys.tip.3':
    'Açarı /api/v1 ünvanına Authorization: Bearer və ya X-API-Key kimi göndərin. Bir hesabda ən çoxu 10 açar ola bilər.',
  'help.guide.plugin-settings.step.2':
    '«Plagin fəaliyyəti» plaginlərin sizin adınızdan etdiyi bütün əməliyyatları ən yenisi birinci olmaqla sadalayır; «Yenilə» ən sonuncuları yükləyir.',
  'help.ctx.admin-github.bullet.3':
    '«Haqqında»: Ko-fi, «Mənə qəhvə al», Discord, «Xəta bildir», «Funksiya təklifi» və Wiki.',
  'help.guide.default-user-settings.goal':
    'Heç kim «Tənzimləmələr»i açmadan hər hesaba uyğun vahidlər, rəng rejimi və valyuta verin.',
  'help.guide.default-map.step.3':
    'Hər sahə ondan çıxdıqda yadda saxlanır. Sahənin adının yanındakı «sıfırla» linki TREK-in standart dəyərini bərpa edir.',
  'help.guide.own-routing-engine.tip.2':
    'Yalnız öz marşrut mühərrikiniz təyin edildikdə ictimai Valhalla da istifadə olunmur. Sahənin yanındakı «sıfırla» linki onu yenidən təmizləyir.',
  'help.guide.admin-passkeys.step.1':
    '«Tənzimləmələr» vərəqində, «Keçid açarı ilə giriş» altında «Keçid açarı ilə girişi aktivləşdir» açarını yandırın.',
  'help.guide.storage-backends.step.4':
    'Yuxarıdakı «Sağlamlıq» güzgü hədəfinə uğursuz yazmaları sadalayır. Orada «Heç bir replika xətası qeydə alınmayıb.» yazılırsa, hər şey işləyir.',
  'help.guide.channels-instance.tip.3':
    'Web Push üçün HTTPS lazımdır. iPhone və iPad-də istifadəçilər əvvəlcə TREK-i Əsas ekrana əlavə edir.',
  'help.guide.notification-defaults.step.1':
    '«Bildirişlər» vərəqində aşağıdakı «İstifadəçilər üçün ilkin dəyərlər» bölməsinə qədər sürüşdürün. Hər sətir bir hadisə, hər sütun bir kanaldır.',
  'help.ctx.notifications.bullet.1':
    'Yuxarı sağdakı zəng hələ oxumadığınız bildirişləri sayır. Son on bildiriş üçün ona, bu səhifə üçün isə aşağısındakı «Bütün bildirişləri göstər»ə klikləyin.',
  'help.guide.read-notifications.step.2':
    'Paneldə son on bildirişiniz sadalanır. Hər birində kimin, nəyi, harada etdiyi yazılır, oxunmamışların isə fonu rənglidir.',
  'help.guide.filter-notifications.step.2': 'Panelin aşağısında «Bütün bildirişləri göstər» düyməsinə klikləyin.',
  'help.guide.mark-notifications-read.tip.1': 'Bildirişi düyməsi ilə açdıqda o da oxunmuş kimi işarələnir.',
  'help.guide.delete-notifications.tip.2':
    'Silinmiş bildirişi bərpa etmək olmur. Bildirişi gizlədib saxlamaq üçün onu oxunmuş kimi işarələyin və «Oxunmamış» filtrindən istifadə edin.',
  'help.guide.notification-settings.tip.2': 'Səyahət üzrə ayrıca ayar yoxdur: bir açar bütün səyahətlərinizə aiddir.',
  'help.guide.link-journal.title': 'Səyahətə gündəlik bağlamaq',
  'help.guide.link-journal.tip.2':
    'Bundan sonra giriş verdiyiniz insanlar gündəliyi öz gündəliklər siyahılarında da görür.',
  'help.ctx.trip-places.bullet.8':
    'Dawarich qoşulubsa, siyahının yuxarısındakı «Dawarich-dən» Dawarich-in səyahət zamanı qeydə aldığı dayanmaları göstərir. «Məkan kimi əlavə et» dayanmanı məkana çevirir. «Ziyarət etdiyim məkan deyil» onu siyahıdan çıxarır.',
  'help.guide.dawarich-stays.step.4':
    'Dayanma əsl ziyarət deyildisə, onu silmək üçün yanındakı x işarəsinə, «Ziyarət etdiyim məkan deyil»ə klikləyin. Siyahının aşağısındakı «Show … already dealt with» əlavə etdiyiniz və ya sildiyiniz dayanmaları göstərir. «Geri qaytar» silinmiş dayanmanı siyahıya qaytarır.',
  'help.guide.leave-stop-off-route.tip.1':
    'Bu seçim yalnız koordinatları olan dayanacaqda var və yalnız həmin günə aiddir: başqa gündəki eyni məkan marşruta daxil olmağa davam edir.',
  'help.guide.move-booking-day.title': 'Rezervasiyanı başqa günə köçürmək',
  'help.guide.place-image-from-file.step.4':
    'Foto indi məkanın şəklidir. Onu yenidən silmək üçün küncündəki kiçik qırmızı X işarəsinə klikləyin.',
  'help.guide.place-own-hours.step.2': '«Veb-sayt» altında bilirsinizsə, «Telefon» və «E-poçt» sahələrini doldurun.',
  'help.guide.add-accommodation.tip.4':
    'Daha sürətli yol: günün başlığındakı + düyməsində («Günə əlavə et» ipucu ilə) «Yaşayış yeri əlavə et» var. O, günü bu forma artıq açılmış halda açır.',
  'help.guide.confirm-stay-booking.goal':
    'Qalmanın arxasındakı otel rezervasiyasını birbaşa gündən təsdiqlənmiş kimi işarələyin.',
  'help.guide.map-whole-trip.tip.4':
    'Bütün səyahətin göstərilib göstərilməməsi hesabınızda hər səyahət üçün ayrıca saxlanır, beləliklə, səyahət başqa brauzerdə də eyni cür açılır.',
  'help.guide.tour-map-lines.step.3':
    'Günlər sütununda turun olduğu günü açın, tur günün marşrutunun bir hissəsi olur: marşrut turun başladığı yerə gedir və bitdiyi yerdən davam edir.',
  'help.guide.car-stops.goal':
    'İcarə avtomobilinə və ya öz avtomobilinizə götürmə və qaytarma yerini, arada dayandığınız yerləri əlavə edin.',
  'help.guide.car-stops.tip.1': 'Ayrıca icarə növü yoxdur: icarə avtomobili də, öz avtomobiliniz də «Avtomobil»dir.',
  'help.guide.transport-details.result':
    '«Plan» gedişin günündə açılır, xəritədə onun xətti çəkilib, sətrindəki marşrut işarəsi isə aktivdir.',
  'help.guide.export-transports-csv.step.2':
    '«Görünüş seçimləri»ndən sonrakı cədvəl işarəsinə klikləyin, ipucunda «Cədvəl kimi ixrac et (CSV)» yazılır.',
  'help.guide.group-sort-bookings.title': 'Rezervasiyaları qruplaşdırmaq və sıralamaq',
  'help.guide.group-sort-bookings.tip.2':
    '«Zaman xətti»ndə həmin düymədə «Hər növ üçün bir zolaq» və «Digər bölməni göstər» var.',
  'help.guide.booking-on-map.result':
    'Təfərrüatlar bağlanır və «Plan» vərəqi rezervasiyanın günündə açılır, onun məkanı xəritədə seçilmiş olur.',
  'help.guide.export-bookings-csv.step.1':
    'Vərəqin yalnız bir hissəsini ixrac etmək üçün əvvəlcə onu «Axtar» və ya «Filtrlə» ilə daraldın. Faylda tam vərəqin göstərdikləri olur.',
  'help.guide.import-booking-file.tip.4':
    'Təsdiqi oxumaq üçün internet bağlantısı lazımdır. Oflayn olduqda «İdxal et» bunu bildirir, TREK yenidən onlayn olduqda təkrar cəhd edirsiniz.',
  'help.guide.arrange-packing-list.step.1':
    'Siyahı başlığının sol ucundakı, rəng nöqtəsindən əvvəlki tutacağı sürükləyin və siyahını başqa kartın üzərinə buraxın. Hədəf kart vurğu rənginizdə çərçivə ilə işarələnir, siyahı isə səyahətdəki hər kəs üçün həmin kartın yerini tutur.',
  'help.guide.count-packed-pieces.title': 'Eyni əşyadan bir neçəsini yığmaq',
  'help.guide.count-packed-pieces.tip.2':
    '«Çantaların izlənməsi» aktiv olduqda «Çantalar» kartındakı «Yığılıb» yalnız artıq sayılmış ədədləri hesablayır.',
  'help.guide.packing-bags.tip.4':
    'Bir neçə nəfərin daşıdığı çantanın çəkisi «Hər nəfərə» altında onlar arasında bərabər bölünür. Bu çəkinin altından nöqtəli xətt çəkilir və kursoru üzərinə gətirdikdə bu barədə qeyd göstərilir.',
  'help.guide.expense-receipts.step.1':
    'Xərcin sətrinin yanındakı qələmə klikləyin. Redaktor açılır, aşağıya yaxın «Qəbzlər və fakturalar» bölməsi var.',
  'help.guide.expense-receipts.tip.3':
    'Əlavə etmək üçün internet bağlantısı və fayl yükləmə icazəsi lazımdır, çünki qəbz səyahətin fayllarından biri kimi saxlanır.',
  'help.guide.files-sync-settings.title': 'Sənədlər üçün sinxronizasiya istiqamətini seçmək',
  'help.guide.files-sync-settings.tip.1':
    'Bir xətt həmişə aktiv qalır: hələ aktiv olan yeganə xəttə klikləmək heç nə etmir.',
  'help.guide.manage-notes.title': 'Qeydi oxumaq, bərkitmək və redaktə etmək',
  'help.guide.manage-notes.tip.1':
    '«Genişləndir» menyuda yalnız qeydin mətni olduqda olur. Collab-ı redaktə etmək hüququ olmayan üzv yalnız «Genişləndir»i görür.',
  'help.guide.note-categories.step.5':
    '«Yadda saxla» düyməsinə klikləyin. Adı və ya rəngi dəyişdirilmiş kateqoriyadakı bütün qeydlər bütün üzvlər üçün dərhal dəyişir. «Ləğv et» dəyişikliklərinizi ləğv edir.',
  'help.guide.trip-chat.tip.5':
    'Çatda əvvəlcə ən son mesajlar göstərilir. Çatın yuxarısındakı «Əvvəlki mesajları yüklə» daha köhnə mesajları yükləyir.',
  'help.guide.roadtrip-reorder.result':
    'Dayanacaqlar təyin etdiyiniz ardıcıllıqdadır, dəyişdirdiyiniz hər günün məsafəsi, sürmə vaxtı və çatma vaxtları yenidən hesablanır.',
  'help.guide.roadtrip-overnight.goal': 'Yolda gecələmək üçün yer tapın və gecəni səfərə rezervasiya kimi əlavə edin.',
  'help.guide.roadtrip-overnight.tip.2':
    'Rezerv edilmiş gecəni kartındakı «Redaktə et» ilə yenidən «Fasilə»yə keçirdikdə əvvəlcə «Gecələmə ləğv edilsin?» soruşulur. «Fasiləyə çevir» gecəni rezervasiyası və ona bağlı xərclə birlikdə silir, dayanacağı isə marşrutda saxlayır.',
  'help.guide.roadtrip-stop-fill.tip.2':
    'Dayanacaqda artıq olan dəyəri seçsəniz, dayanacaq standart dəyərinizə qayıdır.',
  'help.guide.roadtrip-bookings.tip.1':
    'Qeydiyyat üçün vaxt qalsın deyə terminaldakı vaxt cədvəldəkindən tez təyin olunur: uçuş və ya kruiz üçün bir saat, bərə üçün yarım saat, qatar və ya avtobus üçün on dəqiqə.',
  'help.guide.roadtrip-google-import.step.2':
    'Google Maps-dən paylaşdığınız marşrutun linkini yapışdırın və «Önizləmə» düyməsinə klikləyin.',
  'help.guide.roadtrip-hazards.goal':
    'Səfəriniz ətrafındakı hava xəbərdarlıqlarını və fəlakət siqnallarını xəritədə görün.',
  'help.ctx.trip-tours.title': 'Plandakı turlar',
  'help.guide.tour-show-list.title': 'Səyahətin turlarını planda göstərmək',
  'help.guide.tour-show-list.tip.2':
    'Hələ tur yoxdur? Siyahının yuxarısındakı «GPX və ya KML idxal et» fayl idxal edir, «Turlar» vərəqindəki «Yeni tur planlaşdır» isə yeni tur yaradır.',
  'help.guide.tour-add-to-day.step.4':
    'Və ya sətri siyahıdan çıxarıb sol sütundakı günün üzərinə buraxın. İki dayanacaq arasına buraxsanız, tur oraya yerləşdirilir.',
  'help.guide.tour-day-times.goal':
    'Turun nə vaxt bitdiyini və həmin gün sonrakı planla üst-üstə düşüb düşmədiyini görün.',
  'help.guide.tour-day-times.tip.4':
    'Həmin menyudakı «Kolleksiyada yadda saxla» turu kartdakı «Kolleksiya» düyməsi kimi marşrutu ilə birlikdə kolleksiyada saxlayır.',
  'help.guide.tour-remove-from-day.tip.2':
    'Bu menyularda və kartda «Sil» yoxdur. Tur «Turlar» vərəqində, «Bu səyahətin turları» altında sətrindəki zibil qutusu ilə silinir.',
  'help.guide.tour-filter-list.tip.1':
    '«Marşrut həddi» cığırda ölçülmüş çətinlik deyil, marşrutun planlaşdırılarkən icazə verilən ən yüksək çətinliyidir.',
  'help.guide.tour-hide-on-map.step.3':
    'Hər hansı tur gizlədildikdə siyahının üstündəki sətirdə neçəsinin gizləndiyi ilə birlikdə «Xəritədə gizlidir» yazılır. «Hamısını göstər» bütün turları birdəfəlik qaytarır.',
  'help.guide.tour-import-plan-tab.step.3':
    '«İdxal önbaxışı» heç nə saxlanmazdan əvvəl hər izi göstərir. «Bu kimi idxal et» altında növü («Yürüş», «Velosiped turu» və s.) seçin, sonra «1 tur idxal et» düyməsinə klikləyin.',
  'help.ctx.trip-tour-detail.bullet.3':
    'Aşağıda turun olduğu hər gün üçün xanası olan «Səyahət günləri», hündürlük profili ilə ölçülər, sonra aid olduqca: şəhər gəzintisinin stansiyaları, avarçəkmə turunun yoxlamaları və küləyi, «Faktiki iz», «Baqaj siyahısı», «Təsvir», «Qeydlər», «Mənşə» və «Fayl» gəlir.',
  'help.guide.tour-detail-read.step.4':
    '«Səyahət günləri» turun olduğu hər gün üçün tarixi ilə bir xana göstərir. «Not on any day of the trip yet» turun hələ planlaşdırılmadığını bildirir.',
  'help.guide.tour-detail-read.tip.5':
    'Telefonda kart oxumaq və turu özünüzlə götürmək üçün aşağıdan açılan vərəq kimi açılır.',
  'help.guide.tour-rename-colour.tip.1':
    'Ad və rəng səyahətə aiddir, ona görə səyahətdəki hər kəs onları görür. Turu başqaları üçün dəyişmədən yalnız öz xəritənizdə gizlətmək üçün «Turlar» siyahısındakı gözdən istifadə edin.',
  'help.guide.tour-take-along.tip.1':
    'Fayl paylaşa bilən cihazda GPX yanında «Paylaş» görünür və eyni faylı birbaşa başqa tətbiqə göndərir.',
  'help.guide.tour-copy-keep.step.2':
    'Nüsxə dərhal açılır, adı orijinalın adından və (copy) sözündən ibarətdir. Ona öz adını vermək üçün qələmə klikləyin.',
  'help.guide.tour-packing-link.title': 'Turu baqaj siyahısına bağlamaq',
  'help.guide.tour-packing-link.tip.2':
    'Bölmənin başlığındakı «Dəyiş» turu başqa siyahıya bağlayır. Həmin pəncərədəki «Əlaqəni sil» əlaqəni silir, siyahı isə dəyişmir.',
  'help.guide.tour-files.tip.1': 'Fayllar həm də səyahətin fayllarıdır, ona görə «Fayl» vərəqində də görünür.',
  'help.guide.tour-activity-link.step.4':
    '«Faktiki» altında onun nə ölçdüyünü yoxlayın, sonra «Əlaqələndir» düyməsinə klikləyin.',
  'help.guide.tour-activity-compare.step.1':
    'Turun kartını açın. «Plan və faktiki» planın «Məsafə», «Yüksəlmə», «Enmə» və «Fasilələrlə vaxt» göstəricilərini izinkilərlə yan-yana, «Fərq» ilə birlikdə göstərir.',
  'help.guide.tour-origin-check.goal':
    'Turun TREK-də çəkildiyini, yoxsa idxal edildiyini, hansı fayldan gəldiyini və o vaxtdan dəyişib dəyişmədiyini öyrənin.',
  'help.ctx.trip-tour-planner.title': 'Turlar',
  'help.guide.tour-open-workspace.title': '«Turlar» vərəqində yolunuzu tapmaq',
  'help.guide.tour-open-workspace.step.7':
    'Sağ zolaqda tura klikləyin. TREK-də planlaşdırılmış tur redaktorda açılır. İdxal edilmiş iz isə baxmaq üçün dəyişmədən, «GPX turu» kimi açılır.',
  'help.guide.tour-draw-route.step.2':
    'Turun başladığı yeri «Yer və ya ünvan axtar» sahəsinə yazın və nəticəni seçin. Xəritə ora keçir.',
  'help.guide.tour-draw-route.tip.4':
    'Yadda saxlanmamış qaralama itmir. Səyahətin «Turlar» vərəqini yenidən açın, o, «Saxlanılmamış qaralama bərpa edildi» işarəsi ilə bərpa olunur.',
  'help.guide.tour-type-profile.tip.1':
    'Növün dəyişdirilməsi tarixçədə bir addım sayılır: zolağın başlığındakı «Yol nöqtəsi dəyişikliyini geri al» köhnə növü və onun marşrutunu bərpa edir.',
  'help.guide.tour-edit-points.step.4':
    'Və ya sətirdə «Digər əməliyyatlar»ı (üç nöqtə) açın və «Yol nöqtəsini yuxarı köçür» və ya «Yol nöqtəsini aşağı köçür» seçin.',
  'help.guide.tour-shaping-points.step.1':
    'Xəritədə çəkilmiş marşrutun başqa cür getməli olduğu yerə klikləyin. Orada kiçik nöqtə görünür: forma nöqtəsi.',
  'help.guide.tour-loop-reverse.title': 'Dairəvi tur etmək və ya turu tərsinə çevirmək',
  'help.guide.tour-loop-reverse.result': 'Başladığı yerdə bitən dairə, ya da əks istiqamətdə eyni tur.',
  'help.guide.tour-leg-by-hand.tip.2':
    'Heç bir yolun çatmadığı nöqtədə «Show point» və nöqtənin nömrəsi olan bildiriş görünür. Nöqtəni yolun üzərinə köçürün və ya ona gedən hissəni əllə çəkin.',
  'help.guide.tour-trip-places.tip.1': 'Turda artıq olan məkan «Turda» kimi işarələnir və onu iki dəfə seçmək olmur.',
  'help.guide.tour-details-times.step.3': '«Fasilələr» daxil edin, məsələn, 0:45. Onlar təxmini vaxta əlavə olunur.',
  'help.guide.tour-save.step.1': '«Turun adı» sahəsinə ad yazın. Ad olmadan «Yadda saxla» boz qalır.',
  'help.guide.tour-edit-saved.title': 'Saxlanmış turu dəyişmək',
  'help.guide.tour-edit-saved.tip.3':
    'Zolağın başlığındakı «GPX yüklə» və «Kolleksiyada saxla» dəyişikliklər yadda saxlandıqdan sonra işləyir.',
  'help.guide.tour-summary-profile.tip.1': 'Bütün xülasəni yığmaq üçün kartın başlığına klikləyin.',
  'help.guide.tour-list-manage.step.3': 'Günü seçin. Tur həmin günə əlavə olunur, sətrində isə gün göstərilir.',
  'help.guide.tour-delete.goal': 'Turu səyahətdən birdəfəlik silin.',
  'help.guide.tour-saved-elsewhere.goal': 'Siz turu dəyişərkən başqası onu yadda saxlayıbsa, nə olacağına qərar verin.',
  'help.ctx.trip-tour-import.title': 'Turların idxalı',
  'help.guide.tour-import-gpx.goal':
    'GPS saatından, tətbiqdən və ya Google Earth-dən gələn izi heç nə saxlanmazdan əvvəl yoxlayaraq səyahətin turuna çevirin.',
  'help.guide.tour-import-gpx.tip.3': 'Səyahətdə artıq olan iz «Artıq səyahətdədir» kimi boz görünür və buraxılır.',
  'help.guide.tour-view-import.step.3': 'Yuxarı soldakı ox, «Turlara qayıt», onu yenidən bağlayır.',
  'help.guide.tour-plan-from-import.step.2':
    'TREK izdən nəzarət nöqtələri götürür və onları yenidən marşrutlaşdırır. Xəritə idxalı nöqtəli, təklifi isə bütöv xətlə çəkir, kart isə onların uzunluqlarını, izdən 50 m məsafədə qalan payı və «Ən böyük kənarlaşma»nı müqayisə edir.',
  'help.guide.tour-restore-recorded.title': 'Qeydə alınmış izə qayıtmaq',
  'help.guide.tour-take-over.title': 'Başqa səyahətdən tur götürmək',
  'help.guide.tour-take-over.tip.1':
    'Nüsxə ayrıca turdur. O, hələ heç bir gündə deyil, orijinalda sonradan edilən dəyişikliklər nüsxəyə, nüsxədəkilər də orijinala təsir etmir. Onun «Mənşə» bölməsində götürüldüyü səyahətin adı yazılır.',
  'help.guide.tour-import-wanderer.step.3':
    'Cığıra klikləyin. O, xəritədə görünür, sütunda isə GPX faylının ölçüləri, təsviri və wanderer-də ictimai və ya şəxsi olduğu göstərilir.',
  'help.ctx.trip-tour-map.summary':
    '«Turlar» vərəqinin ortasındakı xəritə, açıq olan tur üçün: onun növünə uyğun xəritələr, üzərində göstərilən pistlər və ya dəniz nişanları, marşrutu boyunca yerlər və real relyef üzərində 3D görünüşdə eyni tur.',
  'help.guide.tour-map-layers.step.1':
    '«Turlar» vərəqini açın və sağda «Bu səyahətin turları» altında tura klikləyin. O, planlaşdırıcıda açılır, xəritənin aşağı solundakı panel isə bu tur növünün təklif etdiyi xəritələri sadalayır.',
  'help.guide.tour-along-search.goal':
    'Planlaşdırdığınız turun marşrutuna yaxın seyr nöqtələri, su, daxmalar və ya yemək yeri axtarın.',
  'help.guide.tour-along-search.tip.2':
    'Şəhər gəzintisində siyahının üstündəki dörd mövzu sizin üçün uyğun növləri seçir.',
  'help.guide.tour-along-add-stop.result':
    'Tur indi həmin yerdən keçir, yeni məsafəsi və vaxtı «Turun xülasəsi»ndə göstərilir. Dəyişikliyi saxlamaq üçün turu yadda saxlayın.',
  'help.guide.tour-3d-terrain.step.3':
    'Sağdakı «Meyil bölgüsü» nişanına klikləyin. O, açılır və turun nə qədərinin «5%-dən az», «5% ilə 10% arası», «10% ilə 18% arası», «18% ilə 27% arası» və «27% və daha çox» meyillə getdiyini göstərir. Yığılmış halda ən hündür nöqtəni və ən dik hissəni göstərir.',
  'help.guide.tour-3d-flyover.goal':
    'Yolu piyada, velosipedlə və ya xizəklə keçməzdən əvvəl bütün tura başlanğıcdan sona qədər baxın.',
  'help.guide.tour-3d-flyover.tip.3':
    'Uçuş dayandırıldıqda nöqtəni həmin yerə köçürmək üçün hündürlük profili boyunca hərəkət edin. «Uçuşu oynat» oradan davam edir.',
  'help.guide.tour-map-overlays.tip.1':
    'Pistlər canlı hesabat deyil, xəritə məlumatıdır: nəyin açıq və ya hazırlanmış olduğu, qar və ya uçqunlar barədə heç nə demir. Xizək ərazisindən uzaqlaşdıqda açarda «Trassları görmək üçün yaxınlaşdırın» yazılır.',
  'help.ctx.trip-tour-stages.bullet.4':
    '«Bu səyahətin turları»nda çoxgünlük turda mərhələlərin sayı olan ay göstərilir. Həmin düymə, «Mərhələləri göstər», hər mərhələnin hansı gündə olduğu və «Bütün tur» cəmləri ilə mərhələlər siyahısını açır.',
  'help.guide.tour-multi-day.step.5':
    '«Turun xülasəsi» «Mərhələlər» altında bütün mərhələləri sadalayır. Harada bitdiyini görmək üçün birinə klikləyin: onun son dayanacağı seçilir və hündürlük profili həmin yeri işarələyir.',
  'help.guide.tour-stages-on-days.goal': 'Hər mərhələni ayrıca günə və ya bütün turu bir günə yerləşdirin.',
  'help.guide.tour-stages-on-days.tip.2':
    'Turun artıq olduğu gündə «Bütün tur bu gündə» boz görünür. «Bu gündən etibarən mərhələlər» orada da işləyir və həmin gündəki bütün turu əvəz edir.',
  'help.ctx.trip-tour-hike.bullet.3':
    '«Yol nöqtələri» kartının başlığında marşrut alətləri var: «İstiqaməti dəyiş», «Başlanğıca qayıt», yürüşdə isə «Başlanğıcdan dairəvi marşrut». Dayanacağın «Digər əməliyyatlar» menyusunda «Növbəti hissə üçün yolları müqayisə et» var.',
  'help.guide.tour-hike-plan.step.3': '«Turun adı» altında ad yazın.',
  'help.guide.tour-hike-plan.tip.4':
    'Yeriş vaxtı yürüş nişanlarının qaydasına (DIN 33466) əsasən hesablanır və fasilələri nəzərə almır. Onları «Ətraflı məlumat»da «Fasilələr» altında əlavə edin, planlaşdırılan ümumi vaxtda görünəcəklər.',
  'help.guide.tour-hike-trail-details.result':
    'Yürüşün hansı hissələrinin hansı dərəcədə olduğunu, nədən ibarət olduğunu və xəritədə harada yerləşdiyini bilirsiniz.',
  'help.guide.tour-hike-round.step.3':
    '«Dairələri tap» düyməsinə klikləyin. Siyahıda və xəritədə hər biri öz rəngində Round A, Round B və s. görünür.',
  'help.guide.tour-hike-compare-ways.goal':
    'Yürüşün iki dayanacaq arasında hansı başqa cığırlarla gedə biləcəyini görün və onlardan birini seçin.',
  'help.guide.tour-hike-compare-ways.tip.3': '«Ləğv et» kartı bağlayır və marşrutu dəyişmir.',
  'help.guide.tour-ferrata-add.result':
    'Yürüş via ferrata boyunca OpenStreetMap-dən gələn öz xətti ilə gedir. Zirvədən davam etmək üçün xəritəyə klikləyin. Marşrutlaşdırıcı yalnız via ferrataya gedən və ondan sonrakı yolu planlaşdırır.',
  'help.guide.tour-run-plan.step.2':
    '«Profil» seçin: şəhərdə, parklarda və çay boyu əsasən asfalt yollar üçün «Qaçış», meşə yolları və təbii cığırlar üçün «Trail qaçışı».',
  'help.guide.tour-run-plan.tip.4':
    '«Trail qaçışı» dağ cığırlarına (T2) qədər olan cığırları seçir, heç vaxt daha çətinlərini yox.',
  'help.guide.tour-run-ways.tip.2':
    'Marşrutun daha çox təbii cığırlardan keçməsi üçün «Profil»i «Trail qaçışı»na, bərk zəmində qalması üçün isə «Qaçış»a keçirin.',
  'help.guide.tour-walk-plan.title': 'Dayanacaqdan dayanacağa şəhər gəzintisi planlaşdırmaq',
  'help.guide.tour-walk-plan.tip.1':
    'Dayanacağın nömrəsi ətrafındakı halqa onun əhəmiyyətini göstərir: «Mütləq baxılmalı» üçün bütöv, «İstəyə bağlı» üçün qırıq xətli. Kiçik qalxan «Qorunur» dayanacağı işarələyir.',
  'help.guide.tour-walk-sights.step.3':
    '«Tur boyunca axtar» düyməsinə klikləyin. Adın qarşısındakı ulduz buradakı ən tanınmış yerlərdən birini, «Diqqətəlayiq» yeri işarələyir.',
  'help.guide.tour-walk-day-times.goal':
    'Gəzinti günündə hər dayanacağa nə vaxt çatacağınızı və hansı yerlərin həmin vaxt bağlı olduğunu bilin.',
  'help.guide.tour-walk-day-times.tip.4':
    'Bir gündə iki gəzinti: «Plan» vərəqində onların arasındakı hissəyə («Nəqliyyat növünü dəyiş») klikləyin və «İctimai nəqliyyat» seçin. Axtarış birinci gəzintinin bitdiyi yerdən, bitdiyi vaxtdan başlayır və əlaqə növbəti gəzinti başlayandan sonra çatırsa, sizi xəbərdar edir.',
  'help.guide.tour-walk-google-import.tip.1':
    'Yalnız piyada planlaşdırılmış marşrut oxunur. Paylaşmazdan əvvəl Google Maps-i piyada rejiminə keçirin.',
  'help.guide.tour-walk-check-off.step.3':
    'Gördüyünüz dayanacaqda «Ziyarət edilib kimi işarələ», buraxdığınızda isə «Keç» düyməsinə klikləyin.',
  'help.ctx.trip-tour-bike.bullet.1':
    '«Tur növü» altındakı «Profil» marşrutlaşdırıcının hansı sürmə növü üçün planlaşdırdığını göstərir: «Turinq», «Yol», «Qravel» və ya MTB. Altındakı sətir marşrutlaşdırıcının nə axtardığını bildirir, onu dəyişmək isə bütün marşrutu yenidən planlaşdırır.',
  'help.guide.tour-bike-profile.step.3':
    '«Profil» altında «Turinq», «Yol», «Qravel» və ya MTB seçin. Altındakı sətir həmin profillə marşrutlaşdırıcının nə axtardığını bildirir.',
  'help.guide.tour-bike-profile.tip.4':
    'Turun adı olmayana, marşrut və hündürlükləri hesablanmayana qədər «Yadda saxla» boz qalır.',
  'help.guide.tour-bike-surfaces.result':
    'Xəritə seçdiyiniz sətrin hissələrini işarələyir və marşrutun hansı örtüklərdən keçdiyini bilirsiniz. Turun özü dəyişməyib.',
  'help.guide.tour-bike-mtb-grades.step.2':
    '«Səth və yollar» kartında «Cığır çətinliyi (mtb:scale)» göstəricisini oxuyun: marşrutun «S0, xüsusi çətinlik yoxdur»dan «S4 və yuxarı, ekspert ərazisi»nə qədər olan payları.',
  'help.ctx.trip-tour-ski.summary':
    '«Turlar» vərəqində «Xizək və qış» növündə tur: pistlərdə bir gün, xizək qaçışı dairəsi, xizək turu, qar ayaqqabısı və ya qış gəzintisi. Onun hissələri OpenStreetMap-də xəritələşdirilmiş pistlər, liftlər və cığırlarla gedir, trass marşrutlaşdırıcısı onları sizin idman növünüzə və limitlərinizə görə planlaşdırır; qeydə alınmış xizək izi isə idman növü ilə birlikdə idxal olunur.',
  'help.guide.tour-ski-plan.step.1':
    '«Turlar» vərəqində sol zolağın yuxarısındakı «Yeni tur planlaşdır» düyməsinə klikləyin.',
  'help.guide.tour-ski-plan.tip.3':
    'İdman növünü sonradan dəyişsəniz, nöqtələriniz qalır, hissələr isə həmin növün istifadə etdiyi seçimlərlə yenidən planlaşdırılır.',
  'help.guide.tour-ski-options.step.4':
    'Açarlardan istifadə edin: «Liftlərdən istifadə et», «Freeride marşrutlarına icazə ver», «Lazım olsa liftlə en» və «Təxmin edilən əlaqələrdən qaç». «Xizək qaçışı» «Yalnız hazırlanmış cığırlar» və «Yalnız işıqlandırılmış cığırlar», «Dağ xizəyi turu» isə «Pistin kənarı ilə qalx» əlavə edir.',
  'help.guide.tour-ski-fix-leg.step.1':
    'Marşrutlaşdırıcının planlaşdıra bilmədiyi hissənin nöqtəsi altında səbəbi göstərilən qırmızı sətir görünür, məsələn, «Only a lift you left out joins these points», həmçinin aid olduğu pist və ya lift.',
  'help.guide.tour-ski-summary.title': 'Xizək turunun pist marşrutunu oxumaq',
  'help.guide.tour-ski-summary.tip.4':
    'Kartın aşağısında xizək ərazilərinin adları və turun planlaşdırıldığı xəritə məlumatlarının tarixi göstərilir.',
  'help.guide.tour-ski-pistes-layer.tip.2':
    'Pistlərin yüklənməsi dayanarsa, açarda xəbərdarlıq işarəsi görünür. Xəritə və marşrutunuz işləməyə davam edir.',
  'help.guide.tour-ski-import.step.4': '«1 tur idxal et» düyməsinə klikləyin.',
  'help.ctx.trip-tour-paddle.summary':
    'Çayda və ya göldə kayak, kanoe və ya SUP turu. Onun qayığı və su növü göstərilir, TREK-də məlumat olan yerlərdə su boyunca gedir, daşımaları və şlüzləri vaxtına daxil edir, avar çəkdiyiniz gün küləyi və yoldakı maneələr barədə məlum olanları göstərir.',
  'help.guide.tour-paddle-setup.goal':
    'Kayak, kanoe və ya SUP turuna başlayın və nə ilə, hansı suda və hansı sürətlə avar çəkdiyinizi göstərin.',
  'help.guide.tour-paddle-setup.tip.1':
    '«Qayıq» «Digər» olduqda təklif olunan sürət yoxdur. Sürət daxil edin, əks halda suda keçən vaxt boş qalır.',
  'help.guide.tour-paddle-water-route.step.2':
    'Bir hissəni suda planlaşdırmaq üçün kursoru ondan əvvəlki dayanacağın üzərinə gətirin və üç nöqtəyə, «Digər əməliyyatlar»a klikləyin.',
  'help.guide.tour-paddle-water-route.result':
    'Hər hissə ya su ilə gedir, ya da qəsdən əllə çəkilib, TREK-in planlaşdıra bilmədiyi hissədə isə səbəbi göstərilir.',
  'help.guide.tour-paddle-portage.tip.1':
    'Həmin parçanı yenə də avarla keçmək üçün nöqtədə «Digər əməliyyatlar»ı yenidən açın və «Bu hissəni yenidən avarla keç» seçin. O, yenidən əllə çəkilmiş hissəyə çevrilir.',
  'help.guide.tour-paddle-lock.step.3': 'Şlüz kartını açmaq üçün ona klikləyin.',
  'help.guide.tour-paddle-time.step.1':
    '«Vaxt təxmini» sol sütunda yol nöqtələrinin altındadır. Başlığındakı nişan fasilələr daxil olmaqla ümumi vaxtdır.',
  'help.guide.tour-paddle-time.result': 'Təxmin daxil etdiklərinizi hesablayır və hələ nəyin çatışmadığını göstərir.',
  'help.guide.tour-paddle-wind.tip.2':
    'Bir neçə günlük turda kartın başlığında hər gün üçün gün nişanı göstərilir. Həmin günü görmək üçün birinə klikləyin.',
  'help.guide.tour-paddle-checklist.step.3':
    'Bəndlər marşrut ardıcıllığı ilə gedir: OpenStreetMap-dən bəndlər, şlüzlər, astanalar, suya giriş yerləri və giriş qaydaları, həmçinin «Öz planın» kimi işarələnmiş öz daşımalarınız və şlüzləriniz.',
  'help.guide.tour-paddle-checklist.result':
    'Marşrutdakı hər bənd üçün qərar verilib və təhlükəsizlik qeydini oxumusunuz.',
  'help.guide.tour-paddle-track-marks.step.6': '«Şlüz» düyməsinə, sonra xəttdə şlüzün olduğu yerə klikləyin.',
  'help.ctx.trip-tour-horse.bullet.1':
    'Redaktorda «Tur növü»nü «At gəzintisi» edin, sol sütunda «Atçılıq marşrutları» kartı görünür. «Xəritə görünüşündə axtar» xəritənin görünən hissəsindəki marşrutları sadalayır.',
  'help.guide.tour-horse-plan.step.2':
    '«Turun adı» altındakı «Tur növü» sahəsinə klikləyin və «At gəzintisi» seçin. «Yol nöqtələri» altında «Atçılıq marşrutları» kartı görünür.',
  'help.guide.tour-horse-plan.tip.2':
    'TREK at gəzintisi üçün sürmə vaxtı hesablamır. Gündə vaxt görmək istəyirsinizsə, onu «Ətraflı məlumat»da «Planlaşdırılıb» sahəsinə yazın.',
  'help.guide.tour-horse-gap.step.3': '«Hissəni götür» düyməsinə klikləyin. Açar yandırılmayana qədər düymə boz qalır.',
  'help.guide.tour-horse-recorded.step.1':
    '«Bu səyahətin turları»nda «Tur əlavə et» (+) düyməsinə klikləyin, «GPX və ya KML idxal et» seçin və gəzintinizin faylını seçin.',
  'help.guide.dateless-trip.title': 'Tarixsiz səyahət planlaşdırmaq',
  'help.guide.trip-reminder.step.2':
    '«Xatırlatma» altında 1, 3 və ya 9 gün seçin. Başqa müddət üçün «Fərdi» düyməsinə klikləyin və 1 ilə 30 arasında gün sayı yazın.',
  'help.guide.upcoming-reservations.title': 'Növbəti rezervasiyalarınıza keçmək',
  'help.guide.half-company-holiday.title': 'Yarım günlük şirkət tətilini işarələmək',
  'help.guide.edit-holiday-calendar.step.2':
    'Yeni rəng seçmək üçün rəng kvadratına klikləyin və ya yeni etiket yazıb Enter basın.',
  'help.guide.person-color.step.1': '«Nəfər» kartında adın qarşısındakı rəngli nöqtəyə klikləyin.',
  'help.guide.answer-fusion-request.title': 'Birləşdirmə sorğusuna cavab vermək',
  'help.guide.log-for-partner.title': 'Birgə planlaşdırdığınız şəxs üçün gün qeyd etmək',
  'help.guide.dissolve-fusion.title': 'Birgə planlaşdırmanı dayandırmaq',
  'help.guide.country-places.goal':
    'Orada nə etdiyinizi yoxlamaq və ya TREK-in səhv ölkəyə aid etdiyi məkanı tapmaq üçün TREK-in ölkə üzrə saydığı məkanları siyahı şəklində görün.',
  'help.guide.regions.tip.3':
    '«Arzular siyahısına əlavə et» region üçün də işləyir. Region arzular siyahınızdakı ölkə kimi eyni ştrixlə göstərilir.',
  'help.guide.tour-activity-stats.step.2':
    'Soldakı iki düymə ilə dövr və növ seçin. «Dövr» «Bütün dövr», «Bu il», «Son 12 ay» və turunuz olan bütün əvvəlki illəri təklif edir; «Növ» rəqəmləri bir tur növü ilə məhdudlaşdırır və ya «Bütün növlər» göstərir.',
  'help.guide.tour-activity-stats.tip.3':
    'İştirakçıları göstərilmiş gün yalnız onlar üçün, heç kim göstərilməmiş gün isə səyahətdəki hər kəs üçün sayılır. Vərəq canlı məlumat yükləyir və internet bağlantısı tələb edir.',
  'help.guide.move-to-list.goal':
    'Məkanları siyahılar arasında köçürərək və ya ikinci siyahıya kopyalayaraq siyahılarınızı yenidən təşkil edin.',
  'help.guide.accept-list-invite.result':
    'Siyahı zolaqda «Paylaşılan» altında görünür və məkanları ilə açılır. Üzvlərinin etdiyi dəyişikliklər canlı göstərilir.',
  'help.guide.tour-collection-add-to-trip.step.1':
    'Siyahını açın. Saxlanmış turlar məkanların üstündə, ilk sətirlərdədir. Turda «Səfərə əlavə et» düyməsinə və ya sətrin özünə klikləyin.',
  'help.guide.tour-collection-manage.title': 'Saxlanmış turları tapmaq və silmək',
  'help.guide.tour-collection-manage.result': 'Tur siyahıdan silinir, qısa mesaj da bunu təsdiqləyir.',
  'help.guide.entry-draft.title': 'Qeydi qaralama kimi saxlamaq',
  'help.guide.journey-map-layers.step.1':
    'Xəritənin yuxarısındakı qatlar panelində «Plan», «Qeydə alınan», «Qeydlər» və «Fotolar» var, hər birinin yanında sayı. Gizlətmək və ya göstərmək üçün birinə klikləyin.',
  'help.guide.journey-keep-route.step.1': 'Günün başlığında Dawarich düyməsinə, «Qeydi götür»ə klikləyin.',
  'help.guide.journey-day-stays.step.1':
    'Yoxlanılmalı dayanmaları olan gün «4 stays from Dawarich» kimi sətir və vaxt aralığı ilə bitir. Dayanmaları göstərmək üçün ona klikləyin.',
  'help.guide.journey-take-over-day.step.1':
    'Günün dayanmalar sətrinin sonundakı «Günü köçür» düyməsinə və ya gün başlığındakı, neçə dayanmanın gözlədiyini göstərən siyahı düyməsinə klikləyin.',
  'help.guide.journey-auto-prepare.goal':
    'Səyahət davam edərkən hər günün dayanmaları yoxlama üçün avtomatik hazırlansın.',
  'help.guide.photo-location.goal': 'Hər biri üçün yer axtarmadan qeydləri xəritəyə yerləşdirin.',
  'help.ctx.settings-about.bullet.1': 'Bu serverdə işləyən versiya başlığın yanında göstərilir.',
  'help.guide.readability.tip.3':
    '«Oxunaqlılıq» «Eksperimental» kimi işarələnib. Nəsə düzgün görünmürsə, standart ayarları bərpa etmək üçün vərəqin aşağısındakı «Standart dəyərlərə sıfırla» düyməsinə klikləyin.',
  'help.guide.web-push-device.goal':
    'TREK bağlı olsa belə, onun bildirişlərini telefonunuzda və ya kompüterinizdə görün.',
  'help.guide.connect-airtrail.tip.2':
    'Açar şifrələnmiş saxlanır və bir daha göstərilmir; sahədəki nöqtələr açarın saxlandığını bildirir.',
  'help.guide.connect-dawarich.tip.2':
    'Düymələrin altında kart TREK-in son dəfə nə vaxt yoxladığını və Dawarich versiyanızın nəyi dəstəkləmədiyini göstərir.',
  'help.guide.tour-connect-wanderer.tip.2':
    'Şəxsi ünvandakı instansiya üçün adminin daxili şəbəkələrə icazə verməsi lazım ola bilər.',
  'help.guide.tour-wanderer-watch.tip.2':
    '«Paused until» wanderer-in cavab vermədiyini bildirir; «Token rədd edildi» isə token üçün uğurlu bağlantı yoxlaması və ya yeni token lazım olduğunu göstərir.',
  'help.guide.plugin-settings.result':
    'Plagin sizin ayarlarınızla işləyir, sizin üçün etdiyi hər əməliyyat isə «Plagin fəaliyyəti» altında sadalanır.',
  'help.ctx.admin-defaults.bullet.3':
    'Təyin etdiyiniz sahənin yanındakı «sıfırla» linki TREK-in öz standart dəyərini bərpa edir. İstifadəçinin öz ayarı həmişə bunlardan üstündür.',
  'help.ctx.admin-settings.bullet.5':
    '«Təhlükəli zona»: «JWT sirrini yenilə» siz də daxil olmaqla bütün istifadəçiləri hesabdan çıxarır.',
  'help.guide.default-user-settings.step.1':
    '«Standart istifadəçi tənzimləmələri» altında «Rəng rejimi» («İşıqlı», «Tünd» və ya «Avtomatik»), «Temperatur vahidi», «Məsafə vahidi», «Vaxt formatı», «Həftənin başlanğıcı», «Göstərilən valyuta» və «Rezervasiya kodlarını bulanıqlaşdır» seçiminin aktiv və ya deaktiv olmasını seçin. Hər seçim dərhal yadda saxlanır.',
  'help.guide.admin-passkeys.step.2':
    '«Relying Party ID (domen)» (məsələn, trek.example.org) və TREK-inizin açıldığı «İcazə verilən mənbələr»i daxil edin, sonra «Yadda saxla» düyməsinə klikləyin. APP_URL istifadə etmək üçün hər ikisini boş buraxın.',
  'help.guide.rotate-jwt-secret.title': 'Hamını birdəfəlik hesabdan çıxarmaq',
  'help.guide.notification-defaults.step.2':
    'Xananı növbəti vəziyyətə keçirmək üçün ona klikləyin: aktiv, «Söndürülüb», «Bloklanıb». İpucu növbəti vəziyyəti göstərir, hər klik dərhal yadda saxlanır.',
  'help.ctx.notifications.bullet.2':
    'Yuxarıdakı «Hamısı» və «Oxunmamış» bütün bildirişlər ilə yalnız oxumadıqlarınız arasında keçid edir. Sürüşdürdükcə siyahı daha çoxunu yükləyir.',
  'help.guide.read-notifications.step.3':
    'Bildirişin nə haqqında olduğunu açmaq üçün altındakı düyməyə, burada «Tətilə bax»a klikləyin. Bu, onu oxunmuş kimi də işarələyir.',
  'help.guide.filter-notifications.step.3':
    'Yalnız oxumadığınız bildirişləri görmək üçün «Oxunmamış» düyməsinə klikləyin. «Hamısı» yenidən hamısını göstərir.',
  'help.guide.mark-notifications-read.tip.2':
    'Oxunmuş kimi işarələmək yalnız fon rəngini və sayı dəyişir. Bildiriş siz silənə qədər siyahıda qalır.',
  'help.guide.delete-notifications.result': 'Bildiriş siyahıdan və zəng işarəsindən silinib.',
  'help.guide.notification-settings.result':
    '«Tənzimləmələr» «Bildirişlər» bölməsində açıqdır, hər hadisə və kanal üçün açar var.',
  'help.guide.link-journal.goal':
    'Səyahət gündəliklərinizdən birini seçdiyiniz insanlar üçün səyahətin içində göstərin.',
  'help.guide.link-journal.tip.3':
    'Sonradan «Səyahət parametrləri»ndəki «Gündəlik» bölməsində «Girişi redaktə et», «Gündəliyi dəyiş» və «Əlaqəni sil» olur. Əlaqəni silmək vərəqi silir; gündəliyin özündə əlavə etdiyiniz insanlar isə girişlərini saxlayır.',
  'help.guide.dawarich-stays.result':
    'Dayanma seçdiyiniz gündə və ya «Planlaşdırılmayıb» altında səyahətin məkanı olur, panel isə onu tamamlanmış kimi işarələyir.',
  'help.ctx.trip-days.bullet.7': 'Səyahət davam edərkən plan bugünkü gündə açılır və ona qədər sürüşür.',
  'help.guide.leave-stop-off-route.tip.2':
    '«Gündən çıxar» isə dayanacağı gündən götürür; «Marşruta daxil etmə» onu planda saxlayır.',
  'help.guide.move-booking-day.goal':
    'Nəqliyyatı və ya rezervasiyanı formasını açmadan birbaşa plandan başqa günə köçürün.',
  'help.guide.place-image-from-file.result': 'Foto kartda, məkanlar sütununda, gündə və xəritədə məkanın şəklidir.',
  'help.guide.place-own-hours.step.3':
    'Onların altındakı «İş saatları» həftəni hər gün üçün bir sətirlə göstərir. TREK məkan üçün saat tapıbsa, onlar artıq doldurulub; əks halda əvvəlcə «İş saatlarını əlavə et» düyməsinə klikləyin. Hər günün açılış və bağlanış vaxtını yazın, açılmadığı gündə isə «Bağlanıb» düyməsinə klikləyin.',
  'help.guide.add-accommodation.tip.5':
    'GPX izləri və tur məkanları heç vaxt qalma yeri kimi təklif olunmur, yalnız səyahətin adi məkanları.',
  'help.guide.confirm-stay-booking.step.1':
    'Giriş etdiyiniz günü açın. Qalmanın kartında «Rezervasiya» altında həmin gecənin otel rezervasiyasını «Gözləyir» və ya «Təsdiqlənib» ilə görürsünüz. Həmin qutuya klikləyin.',
  'help.guide.tour-map-lines.step.4':
    'Turu xəritədən götürmək üçün sağ sütunu «Turlar»a keçirin, kursoru turun üzərinə gətirin və gözə, «Xəritədə gizlət»ə klikləyin. Onun xətti və sancağı xəritədən yox olur, sətri isə siyahıda solğun halda, onu yenidən göstərən üstündən xətt çəkilmiş gözlə, «Xəritədə göstər» ilə qalır.',
  'help.guide.car-stops.step.1':
    'Avtomobili götürdüyünüz günün başlığında + düyməsinə («Günə əlavə et» ipucu ilə) klikləyin və «Nəqliyyat əlavə et» seçin.',
  'help.guide.car-stops.tip.2':
    '«Yuxarı daşı» və «Aşağı daşı» yalnız səfərdə iki və ya daha çox dayanacaq olduqda görünür.',
  'help.guide.transport-details.title': 'Nəqliyyatı açmaq və təfərrüatlarından istifadə etmək',
  'help.guide.transport-details.tip.1': 'Xətti çəkilmiş gedişdə «Xəritədə» düyməsinə yenidən klik xətti söndürür.',
  'help.guide.export-transports-csv.result':
    'Brauzeriniz səyahətin adını daşıyan faylı saxlayır, məsələn, autumn-in-japan-transports.csv; hər gediş üçün bir sətir: «Növ», «Başlıq», «Vəziyyət», «Başlanğıc», «Son», «Kimdən», «Hara», «Məkan», «Təsdiq» və «Qeydlər».',
  'help.guide.group-sort-bookings.goal':
    'Kartları və ya siyahını vəziyyətə, günə və ya növə görə, istədiyiniz ardıcıllıqla düzün.',
  'help.guide.booking-on-map.tip.1':
    '«Xəritədə» yalnız məkanı olan rezervasiyada var. Formada «Məkan / Fəaliyyət» altında birini seçin, düymə görünəcək.',
  'help.guide.export-bookings-csv.step.2':
    'Görünüş işarələrindən sonrakı sürüşdürücüləri, «Görünüş seçimləri»ni açın və «Sıralama» altında ardıcıllıq seçin. Sətirlər bölmələr olmadan, hər rezervasiya üçün bir sətir olmaqla həmin ardıcıllığı izləyir.',
  'help.guide.edit-booking.tip.4':
    'Nəyisə dəyişmisinizsə, formanın kənarına klik və ya Escape «Dəyişikliklər ləğv edilsin?» deyə soruşur. «Redaktəyə davam et» sizi formaya qaytarır.',
  'help.guide.arrange-packing-list.step.2':
    'Siyahının içində sətrin solundakı tutacaq həmin elementi yuxarı və ya aşağı sürükləyir. Sətrin sol kənarında vurğu rənginizdə xətt onun hara düşəcəyini göstərir.',
  'help.guide.count-packed-pieces.goal': 'Elementə miqdar verin və ədədlərini bir-bir yığılmış kimi işarələyin.',
  'help.guide.count-packed-pieces.tip.3': 'Miqdar bir olduqda sayğac göstərilmir; yalnız işarə qutusu olur.',
  'help.guide.expense-receipts.step.2':
    '«Qəbzlər və fakturalar» yanındakı «Əlavə et» düyməsinə klikləyin və fotonu və ya PDF-i seçin; bir neçəsini birdən də seçə bilərsiniz. Hər fayl başlığın altında silmək üçün zibil qutusu ilə sadalanır.',
  'help.guide.files-sync-settings.goal':
    'Sənədlərin yalnız saxlama xidmətinizdən idxal ediləcəyinə, yalnız ora ixrac ediləcəyinə və ya hər ikisinə, həmçinin sənəd silindikdə və ya hər iki yerdə dəyişdirildikdə nə olacağına qərar verin.',
  'help.guide.files-sync-settings.tip.2':
    '«Məndən soruş» seçildikdə hər iki yerdə redaktə edilmiş sənəd kartın altındakı «Yoxlanılmalıdır» bölməsində gözləyir. «Resolve» düyməsinə klikləyin və «TREK versiyasını saxla», «Provayder versiyasını saxla» və ya «Hər ikisini saxla» seçin.',
  'help.guide.manage-notes.goal': 'Qeydi tam açın, vacibini yuxarıda saxlayın, köhnəlmiş olanı düzəldin və ya silin.',
  'help.guide.manage-notes.tip.2':
    'Redaktə edərkən artıq əlavə edilmiş fayldakı qırmızı çarpaz onu «Yadda saxla»ya klikləməzdən əvvəl dərhal silir və fayl zibil qutusuna düşmür. Qeydin bütün faylları səyahətin «Fayl» vərəqində də görünür.',
  'help.guide.note-categories.step.6':
    '«Qeydlər» kartında başlığın altındakı düymələr kartları süzür. Yalnız onun qeydlərini görmək üçün kateqoriyaya klikləyin; «Hamısı» və ya həmin düyməyə təkrar klik hamısını göstərir.',
  'help.guide.roadtrip-reorder.tip.1':
    'Dayanacağı burada köçürmək onu gün planında da köçürür: «Gün» də eyni ardıcıllığı göstərir.',
  'help.guide.roadtrip-overnight.step.1':
    '«Marşrut boyunca» bölməsində «Axtarılanlar» altında «Yaşayış yeri»ni, çadır yeri üçün «Düşərgə»ni işarələyin, dayanmaq istədiyiniz günü seçin və «Axtar» düyməsinə klikləyin.',
  'help.guide.roadtrip-overnight.tip.3':
    '«Sürmə tənzimləmələri»ndə «Marşrut xətti» altında «Hər günü yaşayış yerinizdə başladın və bitirin» aktivdirsə, növbəti günün yolu yatdığınız yerdən başlayır.',
  'help.guide.roadtrip-stop-fill.title': 'Bir dayanacaqda doldurma səviyyəsini təyin etmək',
  'help.guide.roadtrip-bookings.title': 'Uçuşu, qatarı və ya bərəni səfərə daxil etmək',
  'help.guide.roadtrip-bookings.tip.2':
    'Dayanacaqda rezerv edilmiş masa və ya bilet həmin dayanacaqda nişan kimi göstərilir; heç bir dayanacağa aid olmayanlar «Bu gün üçün digər rezervasiyalar» altında sadalanır.',
  'help.guide.roadtrip-google-import.step.3':
    'Tapılan dayanacaqları yoxlayın. Hər birinin harada olduğu göstərilir; «Location unresolved» kimi işarələnmiş dayanacaq buraxılır.',
  'help.guide.roadtrip-hazards.step.1': 'Sağ sütunda «Sürmə tənzimləmələri»ni açın.',
  'help.ctx.trip-tours.summary':
    'Turlar rejimində «Plan» vərəqinin sağ sütunu: səyahətin bütün turları günlərin yanında bir siyahıda. Buradan turları günlərə əlavə edir, siyahını süzür, xəritədə xətləri gizlədir və GPX və ya KML faylları idxal edirsiniz. Marşrutlar «Turlar» vərəqində çəkilir və dəyişdirilir.',
  'help.guide.tour-show-list.goal':
    'Məkanlar sütununu səyahətin turları ilə əvəz edin ki, onları günlərin yanında görüb seçə biləsiniz.',
  'help.guide.tour-show-list.tip.3':
    'Turlar əlavəsi aktiv olduqda izlər heç vaxt «Məkan» siyahısında görünmür: idxal edilmiş hər iz turdur və burada sadalanır.',
  'help.guide.tour-add-to-day.step.5':
    'Mərhələli turda növbəti sual həmin menyuda verilir. «Bu gündən etibarən mərhələlər» 1-ci mərhələni həmin günə, hər növbəti mərhələni isə sonrakı günə qoyur; «Bütün tur bu gündə» hamısını həmin bir günə yerləşdirir.',
  'help.guide.tour-day-times.step.1':
    'Günlər sütununda kursoru turun sətrinin üzərinə gətirin, «Daha çox seçim» (üç nöqtə) düyməsinə klikləyin və «Redaktə et» seçin.',
  'help.guide.tour-day-times.result':
    'Tur istənilən vaxtlı dayanacaq kimi başlanğıc və sonu ilə günün zaman xəttində görünür.',
  'help.guide.tour-remove-from-day.result': 'Gündə artıq tur yoxdur, siyahıdakı sətrində də gün nişanı yoxdur.',
  'help.guide.tour-filter-list.tip.2':
    'Bölmə yalnız turlar həmin cəhətdən fərqləndikdə görünür, ona görə qısa siyahıda yalnız «Vəziyyət» ola bilər.',
  'help.guide.tour-hide-on-map.tip.1':
    'Gizlətmək yalnız sizə aiddir və bu səyahət üçün bu brauzerdə saxlanır: tur, onun günləri və rəngi dəyişmir, tur başqalarının xəritəsində görünməyə davam edir.',
  'help.guide.tour-import-plan-tab.tip.1':
    'Səyahətdə artıq olan iz «Artıq səyahətdədir» kimi işarələnir və iki dəfə idxal edilmir.',
  'help.ctx.trip-tour-detail.bullet.4':
    'Aşağıdakı sətir: gün açıq olduqda «Günə əlavə et» və ya «Gündən çıxar», başlanğıca «Naviqasiya», turun veb səhifəsi, GPX, cihazınız fayl paylaşa bilirsə «Paylaş», «Kolleksiya» və «Kopyala».',
  'help.guide.tour-detail-read.step.5':
    'Sonra ölçülər gəlir: «Məsafə», «Minimum yüksəklik», «Maksimum yüksəklik», «Yüksəlmə» və «Enmə», altında vaxtlar və turun xətti rəngində hündürlük profili.',
  'help.guide.tour-detail-read.result':
    'Turun kartı planın yanında açıqdır və onun hansı günlərdə olduğunu, nə qədər uzun və dik olduğunu, haradan gəldiyini bilirsiniz.',
  'help.guide.tour-rename-colour.tip.2': 'Qələm və nöqtə yalnız məkanları redaktə edə bilən üzvlər üçün işləyir.',
  'help.guide.tour-take-along.tip.2':
    '«Tənzimləmələr»də üstünlük verdiyiniz xəritə tətbiqini seçin, «Naviqasiya» tətbiqləri sadalamaq əvəzinə dərhal onu açacaq.',
  'help.guide.tour-copy-keep.step.3':
    'Turu başqa səyahətlər üçün saxlamaq üçün onu açın və kartın aşağısındakı «Kolleksiya» düyməsinə klikləyin.',
  'help.guide.tour-packing-link.goal':
    'Tur üçün nə yığmaq lazım olduğunu səyahətin baqaj siyahısından və ya onun siyahılarından birindən birbaşa turun kartında göstərin.',
  'help.guide.tour-packing-link.tip.3':
    'Bağlamaq üçün məkanları redaktə etmək hüququ lazımdır. Qalanlar bağlanmış siyahını görür, amma əlaqəni dəyişə bilmir.',
  'help.guide.tour-files.tip.2': '«Yüklə» yalnız turu dəyişmək və fayl əlavə etmək hüququ olan üzvlərə göstərilir.',
  'help.guide.tour-activity-link.step.5':
    'İz indi «Faktiki iz» altında, planın yanında öz dəyərləri və öz profili ilə görünür.',
  'help.guide.tour-activity-compare.step.2':
    '«Plandan ən uzaq məsafə» iz ilə planlaşdırılmış xətt arasındakı ən böyük məsafəni, «Plandan kənar» isə izin nə qədərinin həmin xətdən kənarda olduğunu göstərir.',
  'help.guide.tour-origin-check.step.1':
    'Turun kartını açın və «Mənşə»yə qədər sürüşdürün. «Mənbə» onun haradan gəldiyini göstərir: faylın adı ilə «GPX idxalı», KML və ya KMZ idxalı, ya da ünvanı ilə wanderer.',
  'help.ctx.trip-tour-planner.summary':
    'Səyahətin tur planlaşdırıcısı: solda redaktor, sağda səyahətin bütün turları, aralarında isə xəritə. Burada turu nöqtə-nöqtə çəkir, real cığırlar və yollar boyunca marşrutlaşdırır, təfərrüatlarını əlavə edir və səyahətə saxlayırsınız.',
  'help.guide.tour-open-workspace.goal': 'Tur planlaşdırıcısını açın və hər hissəsinin nə üçün olduğunu öyrənin.',
  'help.guide.tour-open-workspace.tip.1':
    'Hər zolağın daxili kənarındakı dildə olan «Yığcamlaşdır» xəritəyə daha çox yer vermək üçün zolağı gizlədir; «Plan» və «Bu səyahətin turları» zolaqları yenidən göstərir. Zolağı genişləndirmək və ya daraltmaq üçün kənarını sürükləyin.',
  'help.guide.tour-draw-route.step.3':
    '«Yol nöqtələri» altında «Nöqtə əlavə et»in aktiv olduğunu yoxlayın (bu, xəritə panelindəki «Nöqtə qoy» ilə eyni açardır), sonra xəritədə turun başladığı yerə klikləyin.',
  'help.guide.tour-draw-route.result':
    'Xəritədə nömrəli marşrut, «Yol nöqtələri» altında isə onun nöqtələri, adlandırmağa və yadda saxlamağa hazır.',
  'help.guide.tour-type-profile.tip.2':
    'Bəzi növlər yadda saxlanmazdan əvvəl əlavə məlumat istəyir: «Qaçış» «Planlaşdırılan temp», «Avarlı tur» qayıq və su növü, «Xizək və qış» turu isə idman növü.',
  'help.guide.tour-edit-points.step.5': 'Yanındakı zibil qutusu, «Yol nöqtəsini sil», nöqtəni turdan çıxarır.',
  'help.guide.tour-shaping-points.step.2':
    'Nöqtəni marşrutun getməli olduğu yolun üzərinə sürükləyin. Marşrut ondan keçməklə yenidən planlaşdırılır.',
  'help.guide.tour-loop-reverse.goal': 'Turu başlanğıcında bitirin və ya istiqamətini tərsinə çevirin.',
  'help.guide.tour-leg-by-hand.title': 'Hissəni əllə çəkmək və ya yenidən planlaşdırmaq',
  'help.guide.tour-leg-by-hand.result':
    'Hissə seçdiyiniz yerdə əllə çəkilmiş kimi işarələnmiş düz xətdir və ya yenidən marşrutlaşdırılıb.',
  'help.guide.tour-trip-places.tip.2':
    'Dayanacağı silmək və ya əlaqəsini ləğv etmək məkanı günləri də daxil olmaqla səyahətdə olduğu kimi saxlayır.',
  'help.guide.tour-details-times.step.4':
    '«Planlaşdırılıb» ümumi vaxtı göstərir. Onu əvəz etmək üçün öz vaxtınızı yazın; bu zaman o, «Əl ilə dəyişdirmə» kimi işarələnir.',
  'help.guide.tour-save.step.2':
    '«Yeni tur» yanındakı nöqtə yox olana qədər gözləyin. «Yadda saxla» üçün marşrut və onun bütün hündürlükləri lazımdır.',
  'help.guide.tour-edit-saved.goal': 'Əvvəl planlaşdırdığınız turu açın, dəyişin və yenidən yadda saxlayın.',
  'help.guide.tour-edit-saved.result': 'Saxlanmış turda indi dəyişiklikləriniz var.',
  'help.guide.tour-summary-profile.tip.2':
    'Via ferrata üzərindən keçən marşrutda rəqəmlərin üstündə dərəcəsi ilə xəbərdarlıq nişanı görünür.',
  'help.guide.tour-list-manage.step.4':
    '«Səfərin həcmi» üstündəki düymə filtrdir. Onda göstərdiyi vəziyyət, əvvəlcə «Hamısı», turların sayı ilə yazılır.',
  'help.guide.tour-delete.step.1':
    'Kursoru «Bu səyahətin turları» altında turun üzərinə gətirin və sətrin sağındakı, turun adı ilə «Sil» olan zibil qutusuna klikləyin.',
  'help.guide.tour-saved-elsewhere.step.1':
    'Redaktə edərkən zolağın yuxarısında «Bu tur başqa yerdə saxlanıb» görünür. Siz qərar verənə qədər dəyişiklikləriniz saxlanır.',
  'help.ctx.trip-tour-import.summary':
    'Burada başqa yerdə artıq mövcud olan turları səyahətə idxal edirsiniz: saatdan və ya tətbiqdən GPX, KML və ya KMZ faylı, başqa səyahətinizdəki tur və ya öz wanderer serverinizdən cığır. İdxal tam qeydə alındığı kimi saxlanır və ondan redaktə edilə bilən versiya planlaşdıra bilərsiniz.',
  'help.guide.tour-import-gpx.step.1':
    'Səyahətin «Turlar» vərəqini açın. Sağda «Bu səyahətin turları»nın yuxarısındakı + («Tur əlavə et») düyməsinə klikləyin.',
  'help.guide.tour-import-gpx.tip.4':
    'KML və ya KMZ faylında xətlərdən başqa olanlar da «İdxal edilmir» altında sadalanır: sancaqlar, sahələr və digər elementlər.',
  'help.guide.tour-view-import.tip.1':
    'İdxalı nöqtə-nöqtə redaktə etmək olmur. Yuxarıdakı «Redaktə edilə bilən versiya» kartında «Redaktə edilə bilən versiya planlaşdır» ondan dəyişə biləcəyiniz tur yaradır.',
  'help.guide.tour-plan-from-import.step.3':
    'Bu turu yerindəcə yenidən planlaşdırmaq üçün «İdxalı əvəz et» düyməsinə klikləyin: günləri və qeydləri qalır, qeydə alınmış iz isə bərpa edə biləsiniz deyə saxlanır. «Yeni tur kimi planlaşdır» idxalı dəyişmir və onun yanında ikinci tur yaradır.',
  'help.guide.tour-restore-recorded.goal':
    'İdxalın yenidən planlaşdırılmasını geri qaytarın və orijinal izi, hətta çox sonra da olsa, geri alın.',
  'help.guide.tour-take-over.goal':
    'Başqa səyahətinizdə artıq planlaşdırdığınız və ya idxal etdiyiniz turu yenidən çəkmədən istifadə edin.',
  'help.guide.tour-take-over.tip.2':
    'Yalnız digər səyahətləriniz və yalnız ilk 100 tur sadalanır. Qalanlarını tapmaq üçün axtarın və ya süzün.',
  'help.guide.tour-import-wanderer.step.4': '«Səyahətə idxal et» düyməsinə klikləyin.',
  'help.ctx.trip-tour-map.bullet.1':
    'Xəritənin aşağı solundakı paneldə açıq turun növünün təklif etdiyi əsas xəritələr var: «Xəritə», Topo, yürüşdə «Gəzinti», velosiped turunda «Velosiped» və «Peyk». Orada seçdiyiniz yalnız planlaşdırıcıya aiddir və «Tənzimləmələr»dəki xəritə ayarını heç vaxt dəyişmir.',
  'help.guide.tour-map-layers.step.2':
    'Horizontallar və kölgəli relyef, yəni yerin nə qədər dik olduğunu göstərən xəritə üçün Topo düyməsinə klikləyin. Seçdiyiniz xəritə paneldə vurğulanmış qalır.',
  'help.guide.tour-along-search.step.1':
    '«Turlar» vərəqində turu açın və sol paneli turun dayanacaqlarının altındakı «Tur boyunca» bölməsinə qədər sürüşdürün. Kart turun marşrutu olduqda görünür.',
  'help.guide.tour-along-search.tip.3':
    'Nəticələr OpenStreetMap-dən və TREK-in məkan indeksindən gəlir, ona görə axtarış üçün internet bağlantısı lazımdır. Heç nə tapılmadıqda «Widen to» növbəti məsafəni yoxlayır; server məşğul olduqda «Yenidən cəhd et» yenidən cəhd edə bilənə qədər geri sayım göstərir.',
  'help.guide.tour-along-add-stop.tip.1':
    'Yer səyahətin məkanı deyil, turun dayanacağı olur, ona görə məkanlar siyahısında görünmür.',
  'help.guide.tour-3d-terrain.step.4':
    'Təpələri üç dəfəyə qədər hündür göstərmək üçün «Relyef» sürüşdürücüsünü çəkin, bu, mülayim ərazidə kömək edir.',
  'help.guide.tour-3d-flyover.step.1':
    'Turu 3D görünüşə keçirin. Marşrut boyunca relyef yüklənərkən oynatma düyməsinin yerində halqa dolur; dolduqdan sonra «Uçuşu oynat» düyməsinə klikləyin. Kamera marşrut boyunca nöqtəni izləyir, «Turun xülasəsi»ndəki hündürlük profilində kursor da onunla birlikdə hərəkət edir.',
  'help.guide.tour-map-overlays.title': 'Xəritənin üzərində pistləri və ya dəniz nişanlarını göstərmək',
  'help.guide.tour-map-overlays.tip.2':
    'Heç bir tur açıq olmadıqda da pist açarı var, beləliklə, nəyisə planlaşdırmazdan əvvəl xizək ərazisinə baxa bilərsiniz. Yürüşdə panel bunun əvəzinə görünən sahədəki marşrutların sayı ilə «Via ferrata marşrutları» təklif edir.',
  'help.ctx.trip-tour-stages.bullet.5':
    'Turun sətrindəki artı, «Günə əlavə et», mərhələləri seçdiyiniz gündən başlayaraq gündə bir mərhələ olmaqla səyahətə yerləşdirir və ya bütün turu həmin bir günə qoyur.',
  'help.guide.tour-multi-day.step.6':
    'Onu yenidən bir günlük tur etmək üçün «Bir günlük» düyməsinə klikləyin və «Bir günlük tura çevrilsin?» sualını «Mərhələ sonlarını sil» ilə təsdiqləyin. Marşrut olduğu kimi qalır.',
  'help.guide.tour-stages-on-days.step.1':
    '«Bu səyahətin turları»nda kursoru çoxgünlük turun üzərinə gətirin və artıya, «Günə əlavə et»ə klikləyin.',
  'help.guide.tour-stages-on-days.tip.3':
    'Çoxgünlük turu «Plan» vərəqində günə sürüklədikdə eyni sual pəncərədə verilir, turun kartındakı «Günə əlavə et» də eyni şeyi soruşur.',
  'help.ctx.trip-tour-hike.bullet.4':
    'Yol nöqtələrinin altındakı «Cığır təfərrüatları» OpenStreetMap-dən hər hissənin SAC dərəcəsini, örtüyünü və yol növünü göstərir və xəritədə marşrutu onlara görə rəngləyir. Oradakı heç nə turu dəyişmir.',
  'help.guide.tour-hike-plan.step.4':
    '«Nöqtə əlavə et» əvvəldən aktivdir: xəritədə yürüşün başladığı və bitdiyi yerə klikləyin. Yanındakı «Səfər yerləri» bunun əvəzinə səyahətdəki daxmanı və ya oteli seçir. İki nöqtədən sonra TREK piyada marşrutunu hesablayır.',
  'help.guide.tour-hike-trail-details.title': 'Yürüş boyunca dərəcələri, örtükləri və yol növlərini görmək',
  'help.guide.tour-hike-trail-details.tip.1':
    'OpenStreetMap-də dəyəri olmayan yollar «Naməlum» altında sadalanır, naməlum isə asan demək deyil. Bəzilərində «Bu dəfə soruşmaq mümkün olmadı» görünürsə, «Yenidən cəhd et» düyməsinə klikləyin.',
  'help.guide.tour-hike-round.step.4':
    'Dairəvi marşrutu seçmək üçün ona klikləyin. Onun sətrində məsafə, qalxış və vaxt, həmçinin istədiyiniz məsafədən nə qədər fərqləndiyi göstərilir.',
  'help.guide.tour-hike-compare-ways.step.1':
    'Kursoru hissənin başladığı dayanacağın üzərinə gətirin, sətrində «Digər əməliyyatlar» düyməsinə klikləyin və «Növbəti hissə üçün yolları müqayisə et» seçin.',
  'help.guide.tour-ferrata-add.title': 'Yürüşə via ferrata əlavə etmək',
  'help.guide.tour-ferrata-add.tip.1':
    'Via ferrata avadanlıq və təcrübə tələb edir. Nişanın ipucu marşrutun onun nə qədərini qalxdığını göstərir.',
  'help.guide.tour-run-plan.step.3':
    '«Planlaşdırılan temp»inizi kilometr başına dəqiqə və saniyə ilə yazın, məsələn, 7:30.',
  'help.guide.tour-run-ways.title': 'Qaçışın hansı yollardan keçdiyini görmək',
  'help.ctx.trip-tour-walk.title': 'Şəhər gəzintisi',
  'help.guide.tour-walk-plan.goal':
    'Hər birində nə qədər qalacağınız və hansılarının vacib olduğu ilə dayanacaqlardan görməli yerlər gəzintisi qurun.',
  'help.guide.tour-walk-plan.tip.2':
    'Şəhər gəzintisində piyada gəzinti limiti və «Fasilələr» sahəsi yoxdur: əvəzinə qalma müddətləri hesablanır.',
  'help.guide.tour-walk-sights.step.4':
    'Siyahıda yerə klikləyin. Kartı xəritənin üzərində açılır: «Hara əlavə olunur» altında onun hansı iki dayanacaq arasına düşəcəyini seçin.',
  'help.guide.tour-walk-day-times.step.1':
    'Gəzintini günə əlavə edin: «Bu səyahətin turları»nda sətrindəki dairəvi + düyməsinə («Günə əlavə et») klikləyin və günü seçin.',
  'help.guide.tour-walk-day-times.result':
    'Ora çatanda hər yer açıq olana qədər dayanacaqların yerini və ya qalma müddətlərini dəyişə bilərsiniz.',
  'help.guide.tour-walk-google-import.tip.2':
    '«Başqa keçid götür» sizi link sahəsinə qaytarır. Yükləmə planlaşdırıcıdakı yadda saxlanmamış dəyişiklikləri əvəz edir, pəncərə bu barədə əvvəlcədən xəbərdarlıq edir.',
  'help.guide.tour-walk-check-off.step.4':
    'Siyahının yuxarısında ziyarət edilmiş dayanacaqlar sayılır və qalan piyada vaxtı göstərilir. Dayanacaqdakı «Geri al» işarəsini götürür.',
  'help.ctx.trip-tour-bike.bullet.2':
    'Sağdakı «Turun xülasəsi» «Sürüş vaxtı (təxmini)» göstərir: marşrutlaşdırıcının profil üçün qalxışlar daxil olmaqla hesabladığı vaxt. Fasilələr daxil deyil.',
  'help.guide.tour-bike-profile.step.4':
    '«Yol nöqtələri» altında «Səfər yerləri» düyməsinə klikləyin və başlanğıcı və sonu seçin, burada Hotel Alpenroyal, sonra Hotel Greif. «Nöqtə əlavə et»in aktiv olduğunu yoxlayıb xəritəyə də klikləyə bilərsiniz. İki nöqtədən sonra TREK marşrutu hesablayır.',
  'help.guide.tour-bike-profile.tip.5':
    'Admin CyclOSM xəritəsinə icazə veribsə, velosiped turu açıq olduqda xəritədəki qatlar sırası «Velosiped» də təklif edir. Yüklənməsi dayanarsa, «Xəritə»yə keçin. Tur dəyişmir.',
  'help.guide.tour-bike-surfaces.tip.1':
    '«Məlumatda yoxdur» OpenStreetMap-in orada örtük qeyd etmədiyini bildirir. Örtük naməlumdur, mütləq yaxşı deyil.',
  'help.guide.tour-bike-mtb-grades.step.3': 'Həmin cığırları xəritədə vurğulamaq üçün dərəcə sətrinə klikləyin.',
  'help.ctx.trip-tour-ski.bullet.1':
    'Birinci «Növ» gəlir və heç nə əvvəlcədən seçilmir: «Alp xizəyi», «Snoubord», «Xizək qaçışı», «Dağ xizəyi turu», «Qar ayaqqabısı» və ya «Qış yürüşü». «Xizək qaçışı» həmçinin «Texnika» soruşur: «Klassik», «Konki üslubu» və ya «Naməlum». İdman növü olmadan turu yadda saxlamaq olmur.',
  'help.guide.tour-ski-plan.step.2': '«Tur növü»nü açın və «Xizək və qış» seçin.',
  'help.guide.tour-ski-plan.tip.4':
    'Pist məlumatı olmayan yerdə hissə nöqtələri arasında düz xətdir. Qar ayaqqabısı və qış yürüşü üçün bunun əvəzinə yay cığırlarından istifadə oluna bilər, hissədəki boz qeyd də bunu bildirir.',
  'help.guide.tour-ski-options.step.5':
    '«Çıxar» altında minmək istəmədiyiniz hər lift növünü basın: «Dartma liftlər», «Açıq kreslo liftlər», «Qondollar», «Kanat yolları» və ya «Funikulyorlar və qatarlar». Basılmış olanın üstündən xətt çəkilir.',
  'help.guide.tour-ski-fix-leg.step.2':
    'Sətrin təklif etdiyi düzəlişə klikləyin: «Daha çətin pistlərə icazə ver», «Bu liftə icazə ver», «Liftlə en», «Texnikanı dəyiş» və ya «Növü dəyiş». Seçim dəyişir və hissə yenidən planlaşdırılır.',
  'help.guide.tour-ski-summary.goal':
    'Günün xizək sürmə, liftlər, gözləmə və piyada hissələrinə necə bölündüyünü görün.',
  'help.guide.tour-ski-summary.result':
    'Günün pistlərdə, liftlərdə və onlarda gözləməklə nə qədər vaxt apardığını bilirsiniz.',
  'help.guide.tour-ski-pistes-layer.tip.3':
    'Qat canlı hesabat deyil, xəritə məlumatıdır: nəyin açıq və ya hazırlanmış olduğu, qar və ya uçqunlar barədə heç nə demir. Açar heç bir tur açıq olmadıqda da var, beləliklə, planlaşdırmazdan əvvəl xizək ərazisinə baxa bilərsiniz.',
  'help.guide.tour-ski-import.step.5':
    'Açmaq üçün «Bu səyahətin turları»nda izə klikləyin. İdman növünü sonradan düzəltmək üçün onun «Xizək izi» kartında «Dəyiş» düyməsinə klikləyin.',
  'help.ctx.trip-tour-paddle.bullet.1':
    '«Tur növü» altında «Avarlı tur» «Qayıq» («Kayak», «Kanoe», SUP və ya «Digər») və «Su» («Çay» və ya «Göl») soruşur. Hər ikisi seçilməyənə qədər turu yadda saxlamaq olmur.',
  'help.guide.tour-paddle-setup.step.1':
    '«Turlar» vərəqində sol sütunun yuxarısındakı «Yeni tur planlaşdır» düyməsinə klikləyin.',
  'help.guide.tour-paddle-setup.tip.2':
    'Avarçəkmə turunun xəritəsi «Xəritə» və «Peyk», üst qat kimi isə OpenSeaMap-dən «Dəniz nişanları» təklif edir.',
  'help.guide.tour-paddle-water-route.step.3':
    '«Növbəti hissəni su ilə planlaşdır» seçin. TREK bu nöqtədən növbətiyə qədər hissəni çay və ya göl boyunca planlaşdırır.',
  'help.guide.tour-paddle-portage.title': 'Qayığı maneənin ətrafından daşımaq',
  'help.guide.tour-paddle-portage.tip.2':
    'Son nöqtədə «Qayığı buradan daşı» növbəti nöqtəni qoyduqdan sonra tətbiq olunur. Sətirdə «Buradan daşıma» yazılır, onun çarpazı, «Daşımadan imtina et», isə bunu geri qaytarır.',
  'help.guide.tour-paddle-lock.step.4':
    '«Gözləmə» və «Keçid» üçün dəqiqələri yazın. Hər ikisi daxil edildikdən sonra kart onların cəmini göstərir.',
  'help.guide.tour-paddle-time.step.2':
    'Zolaq marşrutu başlanğıcdan sona qədər göstərir: su, qəhvəyi rəngdə daşımalar və cizgi kimi şlüzlər. Marşrutdakı maneələr xəritədə tapmaq üçün klikləyə biləcəyiniz işarələrdir.',
  'help.guide.tour-paddle-wind.title': 'Avarçəkmə günü üçün küləyi yoxlamaq',
  'help.guide.tour-paddle-wind.tip.3':
    'Göl keçidi olan küləkli gündə kart göllərdən sahil boyu keçməyi planlaşdıran «Sahilə yaxın planlaşdır» təklif edir.',
  'help.guide.tour-paddle-checklist.step.4':
    'Bəndə klikləyin. Xəritə ora keçir: maneə üçün onun kartı qərarınızla açılır; öz daşımanız və ya şlüzünüz üçün isə onun nöqtəsi seçilir.',
  'help.guide.tour-paddle-track-marks.title': 'Qeydə alınmış avarçəkmə izində daşımaları və şlüzləri işarələmək',
  'help.guide.tour-paddle-track-marks.step.7':
    'Kartları açın, dəqiqələrini yazın və «Yadda saxla» düyməsinə klikləyin.',
  'help.ctx.trip-tour-horse.bullet.2':
    'Marşrut öz pəncərəsində açılır: hissəni və onu keçdiyiniz «İstiqamət»i seçin, «At üçün giriş»i yoxlayın, sonra «Hissəni götür» düyməsinə klikləyin.',
  'help.guide.tour-horse-plan.step.3':
    '«Atçılıq marşrutları» kartında «Xəritə görünüşündə axtar» düyməsinə klikləyin. Görünən sahədəki bütün nişanlanmış at marşrutları oradakı uzunluqları ilə sadalanır.',
  'help.guide.tour-horse-plan.tip.3':
    'Axtarışdan sonra xəritəni hərəkət etdirdiniz? Düymədə «Bu görünüşdə axtar» yazılır. Çox böyük sahə üçün əvvəlcə yaxınlaşdırmaq xahiş olunur.',
  'help.guide.tour-horse-gap.step.4':
    '«Yol nöqtələri» kartında körpü uzunluğu ilə birlikdə «Əl ilə, yoxlanılmayıb» kimi göstərilir. Səbəbini oxumaq üçün kursoru onun üzərinə gətirin.',
  'help.guide.tour-horse-recorded.step.2':
    '«İdxal önbaxışı» açılır, hələ heç nə saxlanmayıb. «Bu kimi idxal et» altında «Tur növü»nü «At gəzintisi» edin. Üç nişan idxalın nəyi saxladığını və nəyi hesablamadığını göstərir.',
  'help.guide.dateless-trip.goal': 'Nə vaxt səyahət edəcəyinizi bilmədən planlaşdırmağa başlayın.',
  'help.guide.trip-reminder.step.3': '«Yenilə» düyməsinə klikləyin.',
  'help.guide.upcoming-reservations.goal':
    'Bütün səyahətlərinizdə növbəti nəyin rezerv edildiyini görün və aid olduğu səyahəti açın.',
  'help.guide.log-day.tip.3':
    'Tam şirkət tətili kimi işarələnmiş günü qeyd etmək olmur. Yarım günlük şirkət tətilində məzuniyyət günü yalnız 0,5 sayılır.',
  'help.guide.half-company-holiday.goal':
    'Bütün günü bağlamadan hər kəsə boş günortadan sonra verin, məsələn, Milad ərəfəsində.',
  'help.guide.public-holidays.tip.2': 'Bayramın adını görmək üçün kursoru cədvəldə onun üzərinə gətirin.',
  'help.guide.edit-holiday-calendar.step.3':
    'Siyahılarda ölkəni və ya regionu dəyişin, ya da təqvimi silmək üçün zibil qutusuna klikləyin.',
  'help.guide.person-color.step.2': 'Rəng seçin. O, dərhal yadda saxlanır və pəncərə bağlanır.',
  'help.guide.answer-fusion-request.goal':
    'Məzuniyyət planınızı sizi dəvət edən şəxsin planı ilə birləşdirib birləşdirməyəcəyinizə qərar verin.',
  'help.guide.log-for-partner.goal':
    'Planınıza birləşdirilmiş şəxs üçün istirahət günü daxil edin, məsələn, o sizdən xahiş etdikdə.',
  'help.guide.dissolve-fusion.goal': 'Birləşdirilmiş planı yenidən ayrı planlara bölün.',
  'help.guide.country-places.step.1': 'Olduğunuz ölkəni axtarıb seçin. Onun kartı aşağıdakı paneldə görünür.',
  'help.guide.tour-activity-stats.step.3':
    'Rəqəmləri oxuyun: küncündə turların sayı olan məsafə, sonra «Yüksəlmə» və «Enmə». «Bütün növlər» seçildikdə ardınca ən çox etdiyiniz üç növ, hər biri sayı və məsafəsi ilə sadalanır.',
  'help.guide.move-to-list.step.1':
    'Filtr sətrindəki işarə qutusu düyməsinə, «Seç»ə klikləyin və məkanları işarələyin.',
  'help.guide.tour-collection-add-to-trip.step.2':
    '«Səfərə» altında səyahəti seçin. Tur əlavə edə bilmədiyiniz səyahət solğun görünür.',
  'help.guide.tour-collection-manage.goal':
    'Siyahıda hansı turların olduğunu və haradan gəldiyini görün, artıq lazım olmayanları silin.',
  'help.guide.entry-draft.goal': 'Qeydi indi yazın və hazır olana qədər paylaşılan gündəlikdən gizlədin.',
  'help.guide.journey-map-layers.step.2':
    'Xəritə legendası üçün panelin sonundakı (i) işarəsinə klikləyin: o, hər sancağı, nöqtəni və xətti izah edir.',
  'help.guide.journey-keep-route.step.2':
    'Günün harada başlayıb bitdiyini müəyyən edən «Günün saat qurşağı»nı və qeydi yoxlayın: məsafə, vaxt aralığı, hissələr və boşluqlar.',
  'help.guide.journey-day-stays.step.2':
    'Dayanmada «Gündəlik qeydi yaz» düyməsinə klikləyin. Qeyd həmin günə gəliş vaxtında, dayanmanın adı və mövqeyi ilə əlavə olunur.',
  'help.guide.journey-take-over-day.step.2':
    'Saxlanacaq dayanmaları işarələyin və adlarını düzəldin. İki işarələnmiş dayanma arasındakı «Bir qeyddə birləşdir» onları birləşdirir, «Ayrı saxla» isə yenidən ayırır.',
  'help.guide.journey-auto-prepare.step.1':
    '«Səyahət gündəliyi tənzimləmələri»ni açmaq üçün başlığın yuxarı sağındakı ⋯ düyməsinə klikləyin.',
  'help.guide.photo-location.step.1':
    '«Səyahət gündəliyi tənzimləmələri»ni açmaq üçün başlığın yuxarı sağındakı ⋯ düyməsinə klikləyin.',
  'help.guide.share-public.tip.3':
    'Qaralamalar linkdə heç vaxt görünmür, qeydə alınmış marşrutlar isə yalnız dərc edilmiş qeydi olan günlərdə göstərilir.',
  'help.ctx.settings-plugins.title': 'Plaginlər',
  'help.ctx.settings-about.bullet.2':
    '«Xəta bildir» və «Funksiya təklifi» layihəni GitHub-da açır; Wiki isə sənədləri açır.',
  'help.guide.map-provider.tip.3':
    'GL xəritəsində fırlatmaq və əymək üçün sağ klikləyib sürükləyin; orta düymə ilə klik yer əlavə edir.',
  'help.guide.web-push-device.step.1':
    '«Bu cihazda push bildirişləri» altında «Bu cihaz üçün aktiv et» düyməsinə klikləyin və brauzer soruşduqda bildirişlərə icazə verin. «Test göndər» bildirişin gəldiyini yoxlayır.',
  'help.guide.connect-airtrail.title': 'AirTrail-inizi qoşmaq',
  'help.guide.connect-dawarich.title': 'Dawarich-inizi qoşmaq',
  'help.guide.tour-connect-wanderer.title': 'wanderer-inizi qoşmaq',
  'help.guide.tour-connect-wanderer.tip.3': 'Sağdakı «Bağlantını kəs» tokeni yenidən silir.',
  'help.guide.tour-wanderer-watch.tip.3':
    'Bu xəbərdarlıqlar üçün kanalları «Bildirişlər»də, «wanderer: marşrutların barədə xəbərdarlıqlar» sətrində seçirsiniz.',
  'help.guide.plugin-settings.tip.1': 'Bu ayarlar yalnız sizindir; digər üzvlər plagini özləri üçün qurur.',
  'help.guide.offline-conflicts.step.3':
    'Serverin davamlı rədd etdiyi dəyişikliklər «Oflayn keş» altında «Uğursuz dəyişikliklər» kimi görünür: «Yenidən cəhd et» onları bir daha göndərir, «İmtina et» serverin versiyasını saxlayır.',
  'help.ctx.admin-notifications.bullet.4':
    'Aşağıdakı «İstifadəçilər üçün ilkin dəyərlər»: dəyişməmiş hər kəs üçün hər hadisə və kanal üzrə aktiv, «Söndürülüb» və ya «Bloklanıb».',
  'help.guide.default-user-settings.step.2':
    'Təyin etdiyiniz sahənin adının yanında «sıfırla» linki görünür; o, TREK-in daxili standart dəyərini bərpa edir.',
  'help.guide.own-routing-engine.title': 'Öz marşrut serverlərinizdən istifadə etmək',
  'help.guide.admin-passkeys.result':
    'Giriş səhifəsi «Passkey ilə daxil ol» təklif edir, istifadəçilər isə öz tənzimləmələrində keçid açarları əlavə edə bilər.',
  'help.guide.rotate-jwt-secret.goal': 'Sızma şübhəsindən sonra bütün sessiyaları bitirin.',
  'help.guide.notification-defaults.result':
    'Xananı dəyişməmiş hər kəs sizin seçiminizdən başlayır, bloklanmış xanalar isə onların tənzimləmələrində kilidli göstərilir.',
  'help.ctx.notifications.bullet.3':
    'Hər bildirişdə kimin, nəyi, harada etdiyi yazılır. Oxunmamışların fonu rənglidir. Altındakı düymə, məsələn, «Səyahətə bax» və ya «Tətilə bax», sizi ora aparır və bildirişi oxunmuş kimi işarələyir.',
  'help.guide.read-notifications.tip.1':
    'Zəng naviqasiya paneli olan bütün ekranlardadır, rəqəmi isə yeni nəsə gəldikdə avtomatik yenilənir.',
  'help.guide.filter-notifications.tip.1':
    'Aşağı sürüşdürdükcə səhifə köhnə bildirişləri yükləyir, ona görə ilk ekrandan sonra heç nə kəsilmir.',
  'help.guide.mark-notifications-read.result':
    'Heç bir bildirişin fonu artıq rəngli deyil, zəngdəki qırmızı rəqəm də yox olub.',
  'help.guide.notification-settings.title': 'Nə barədə bildiriş alacağınızı seçmək',
  'help.guide.link-journal.step.1':
    'Səyahətin adının yanındakı «Səyahət parametrləri» düyməsinə klikləyin və solda «Gündəlik» seçin.',
  'help.guide.dawarich-stays.tip.1':
    '«Məkan əlavə et» düyməsinə klikləyənə qədər səyahətə heç nə əlavə olunmur. Dayanmadan əlavə edilmiş məkanın təfərrüatlarında «Dawarich qeydlərinizdən əlavə edilib» yazılır.',
  'help.guide.leave-stop-off-route.title': 'Dayanacağı marşrutdan çıxarmaq',
  'help.guide.move-booking-day.step.1':
    'Kursoru gündə rezervasiyanın sətrinin üzərinə gətirin: solundakı tutacaq onun sürüklənə biləcəyini göstərir.',
  'help.guide.place-image-from-file.tip.1':
    'Yalnız JPG, PNG, GIF və WebP faylları təklif olunur; PDF bilet təklif olunmur.',
  'help.guide.place-own-hours.step.4':
    '«İş saatları»nın sağındakı düymələr: kopyalama düyməsi bütün günlərə bazar ertəsinin saatlarını verir, X isə saatlarınızı yenidən silir. TREK öz saatlarını tapıbsa, «Yer təfərrüatlarından götür» onları geri qaytarır.',
  'help.guide.confirm-stay-booking.step.2':
    'Rezervasiya planın üzərində açılır. Başlığındakı ilk nişan onun vəziyyətini göstərir.',
  'help.ctx.trip-map.bullet.9':
    'Səyahətin hər turu öz rəngində xətt, başlanğıcında isə sancaqdır. Turun kartını açmaq üçün xəttə klikləyin. Turu olan gündə günün marşrutu turun başladığı yerə gedir və bitdiyi yerdən davam edir. «Turlar» siyahısında turun yanındakı göz, «Xəritədə gizlət», onun xəttini xəritənizdən götürür.',
  'help.guide.tour-map-lines.result':
    'İstədiyiniz turlar hər biri öz rəngində xəritədədir, gizlətdiyiniz isə «Turlar» siyahısında solğun göstərilir.',
  'help.guide.car-stops.step.2':
    'Başlıqdakı növ düyməsinə klikləyin və «Avtomobil» seçin. Forma dəyişir: «Tarix» və «Başlanğıc vaxtı» «Götürmə» və «Götürmə vaxtı», «Bitmə tarixi» və «Bitmə vaxtı» «Qaytarma» və «Qaytarma vaxtı» olur, «Kimdən» və «Hara» altında isə «Yolboyu dayanacaqlar» görünür.',
  'help.guide.transport-details.goal':
    'Gedişin bütün təfərrüatlarını bir yerdə görün, rezervasiya kodunu kopyalayın, adını dəyişin və ya xəritədə ona keçin.',
  'help.guide.transport-details.tip.2':
    'Escape və ya təfərrüatların kənarına klik onları bağlayır. «Adını dəyiş» və ya silmə sualı açıqdırsa, əvvəlcə o bağlanır.',
  'help.guide.export-transports-csv.tip.1': 'İşarə yalnız vərəqdə ən azı bir gediş olduqca paneldə görünür.',
  'help.guide.group-sort-bookings.step.1':
    '«Kartlar» və ya «Siyahı» görünüşündə üç görünüş işarəsindən sonrakı sürüşdürücülərə, «Görünüş seçimləri»nə klikləyin.',
  'help.guide.create-booking.tip.4':
    'Oflayn olduqda rezervasiya bu cihazda saxlanır və yenidən onlayn olduqda sinxronlaşır. Yeni fayllar üçün bağlantı lazımdır, ona görə onları silin və ya sonra yadda saxlayın. Təsadüfən formanın kənarına kliklədiyiniz və ya Escape basdığınız halda TREK yazdıqlarınız itməzdən əvvəl «Dəyişikliklər ləğv edilsin?» deyə soruşur.',
  'help.guide.booking-on-map.tip.2': 'Qalma ilk gecəsində açılır.',
  'help.guide.export-bookings-csv.step.3':
    '«Görünüş seçimləri»ndən sonrakı cədvəl işarəsinə, «Cədvəl kimi ixrac et (CSV)»yə klikləyin.',
  'help.guide.arrange-packing-list.step.3':
    '«Paylaşılan» və «Mənim siyahım» olan sətrin ən sağındakı «A-dan Z-yə» hər siyahının elementlərini ad sırası ilə göstərir ki, nəyinsə artıq siyahıda olub olmadığını tez görəsiniz. Öz sıranıza qayıtmaq üçün ona yenidən klikləyin.',
  'help.guide.count-packed-pieces.step.1':
    'Sətirdəki miqdar nişanına, arxasında x olan kiçik rəqəmə klikləyin, neçə ədəd götürdüyünüzü yazın, məsələn, 5, və Enter basın.',
  'help.guide.expense-receipts.step.3':
    'Pəncərənin aşağısındakı «Yadda saxla» düyməsinə klikləyin. Fayllar xərclə birlikdə yüklənir və səyahətin «Fayl» bölməsində də görünür.',
  'help.guide.files-sync-settings.step.1':
    'Panelin sağ ucundakı «Sənəd sinxronizasiyası» düyməsinə klikləyin. Səyahət bağlanıbsa, sağda saxlama xidmətinizin kartı açılır; birdən çox xidmət varsa, solda «Bu səyahət» altında istədiyinizə klikləyin.',
  'help.guide.files-sync-settings.tip.3':
    'Yanında «Kopyala» olan link, «Ani yeniləmələr», yalnız TREK-in dəyişikliklərə avtomatik abunə ola bilmədiyi saxlama xidmətləri üçün var. Linki saxlama xidmətinə yapışdırın, dəyişikliklər növbəti yoxlamanı gözləmədən dərhal gələcək.',
  'help.guide.manage-notes.step.1':
    'Qeyd kartının başlığındakı üç nöqtəyə («Daha çox seçim») klikləyin. Menyuda «Genişləndir», «Bərkit», «Redaktə et» və «Sil» var.',
  'help.guide.note-categories.title': 'Qeydləri kateqoriyalara bölmək',
  'help.guide.note-categories.result':
    'Qeydlər yeni adları və rəngləri göstərir, «Qeydlər» kartı isə yalnız seçdiyiniz kateqoriyanı göstərir.',
  'help.guide.roadtrip-stops.tip.5':
    'Gün planında bitmə vaxtı olan dayanacaq həmin vaxta qədər davam edir. Onun pəncərəsi yolun nə vaxt davam etdiyini bildirir, «Bitmə vaxtını sil» isə müddəti yenidən özünüz təyin etməyə imkan verir.',
  'help.guide.roadtrip-reorder.tip.2':
    'Rezerv edilmiş gedişlər və onların terminalları rezervasiyanın qoyduğu yerdə qalır; yalnız yerləri sürükləmək olar.',
  'help.guide.roadtrip-overnight.step.2':
    'Oteldə artı əvəzinə çarpayı işarəsi göstərilir. Gecə üçün «Dayanacaq kimi əlavə et» pəncərəsini açmaq üçün ona, «Gecələmə yeri kimi əlavə et»ə klikləyin. Kempinqdə adi «Əlavə et» var.',
  'help.guide.roadtrip-stop-fill.goal':
    'Bir yanacaq və ya şarj dayanacağına öz doldurma səviyyəsini verin, məsələn, sürətli şarj məntəqəsində 80 % və ya gecə ərzində 100 %.',
  'help.guide.roadtrip-bookings.goal':
    'Rezerv edilmiş gedişin səfərdə harada olduğunu və ora nə vaxt çatmalı olduğunuzu görün.',
  'help.guide.roadtrip-bookings.tip.3':
    'Səyahətin heç bir gününə düşməyən gediş səfərin bir hissəsi deyil: zolağın yuxarısındakı qeyd onun adını çəkir və ona tarix vermək üçün «Rezervasiyanı aç» təklif edir.',
  'help.guide.roadtrip-google-import.step.4':
    '«Gün» altında dayanacaqların əlavə olunacağı günü seçin, sonra «İdxal et» düyməsinə klikləyin.',
  'help.guide.roadtrip-hazards.step.2':
    'Pəncərənin sağ sütununun aşağısında, «Cari xəbərdarlıqlar» altında «Təhlükəli əraziləri göstər» açarını yandırın, sonra «Bağla» düyməsinə klikləyin.',
  'help.ctx.trip-tours.bullet.1':
    'Sağ sütunun yuxarısındakı «Məkan» və «Turlar» keçidi məkanlar siyahısını turlarla əvəz edir. O, yalnız Turlar əlavəsi aktiv olduqca var və bu halda turlar heç vaxt «Məkan» siyahısında görünmür.',
  'help.guide.tour-show-list.step.1':
    '«Plan» vərəqində sağ sütunun yuxarısındakı keçiddə «Turlar» düyməsinə klikləyin. Sütun indi məkanlar əvəzinə turları sadalayır.',
  'help.guide.tour-show-list.result': 'Sağ sütun səyahətin turlarını sadalayır, kliklədiyiniz isə kartında açıqdır.',
  'help.guide.tour-add-to-day.tip.1':
    'Mərhələli turu günə sürüklədikdə eyni sual kiçik pəncərədə verilir. «Ləğv et» planı olduğu kimi saxlayır.',
  'help.guide.tour-day-times.step.2':
    '«Başlanğıc» təyin edin, «Son»u boş buraxın. Sahələrin altındakı sətir TREK-in hesabladığı bitmə vaxtını göstərir: başlanğıc üstəgəl turun müddəti.',
  'help.guide.tour-remove-from-day.title': 'Turu gündən çıxarmaq',
  'help.guide.tour-filter-list.title': 'Turlar siyahısını süzmək',
  'help.guide.tour-filter-list.tip.3':
    'Heç nə qalmırsa, siyahıda «No tour matches these filters» yazılır, «Filtrləri sıfırla» isə hamısını təmizləyir. Filtrlər yalnız siyahının göstərdiyini dəyişir, heç vaxt turu və ya günü dəyişmir.',
  'help.guide.tour-hide-on-map.tip.2':
    'Telefondakı xəritə həmişə bütün turları göstərir, «Turlar» vərəqində isə göz yoxdur: gizlətmə burada, «Plan» vərəqində işləyir.',
  'help.guide.tour-import-plan-tab.tip.2':
    'İdxal burada siyahıda qalır və planlaşdırıcıda açılmır. Onu dairəvi + ilə günə əlavə edin və ya ona baxmaq üçün «Turlar» vərəqini açın.',
  'help.ctx.trip-tour-detail.bullet.5':
    'Kart oxumaq və turla bağlı olanlar üçündür. Marşrutun özü «Turlar» vərəqində dəyişdirilir: onu açın və «Bu səyahətin turları» altında tura klikləyin. Tur da burada deyil, orada silinir.',
  'help.guide.tour-detail-read.step.6':
    '«Təsvir» və «Qeydlər», sonra «Mənşə» üçün sürüşdürməyə davam edin: TREK-də planlaşdırılıb, idxal edildiyi fayl və ya gəldiyi wanderer cığırı, tarixi ilə.',
  'help.guide.tour-rename-colour.title': 'Turun adını və rəngini dəyişmək',
  'help.guide.tour-rename-colour.result':
    'Tur səyahətin hər yerində yeni adı ilə görünür, xətti isə seçdiyiniz rəngdə çəkilir.',
  'help.guide.tour-take-along.tip.3':
    'Fayl serverdən gəlir, ona görə bağlantı lazımdır. Oflayn yaradılmış turu sinxronlaşdıqdan sonra endirmək olar.',
  'help.guide.tour-copy-keep.step.4':
    '«Kolleksiya» altında siyahını seçin, «Kolleksiyadakı ad»ı yoxlayın və «Saxla» düyməsinə klikləyin.',
  'help.guide.tour-packing-link.step.1':
    'Turun kartını açın və «Baqaj siyahısı»na qədər sürüşdürün. «Baqaj siyahısı bağla» düyməsinə klikləyin.',
  'help.guide.tour-packing-link.result':
    '«Siyahılar» vərəqində baqaj siyahısındasınız, turun kartı isə işarələdiyiniz hər elementi göstərir.',
  'help.guide.tour-files.result': 'Fayllar tura əlavə olunub və onun kartından açılır.',
  'help.guide.tour-activity-link.tip.1':
    'Plan olduğu kimi qalır. İz sadəcə bağlanır, «Əlaqəni sil» isə əlaqəni yenidən silir.',
  'help.guide.tour-activity-compare.step.3':
    'Faktiki izi planın yanında nöqtəli xətlə çəkmək üçün «Xəritədə müqayisə et» düyməsinə klikləyin. «Müqayisəni bitir» onu yenidən götürür.',
  'help.guide.tour-origin-check.step.2':
    '«İdxal edilib» idxal edildiyi günü göstərir. «Burada» onun cari vəziyyətini göstərir: «İdxal edildiyi kimi», «TREK-də redaktə edilib» və ya «Yenidən planlaşdırılıb, yazılmış iz saxlanılıb».',
  'help.ctx.trip-tour-planner.bullet.1':
    'Turlar əlavəsi aktiv olduqca «Turlar» səyahətin vərəqlər panelində «Plan»dan dərhal sonra yerləşir. Vərəq kompüterdə və planşetdə var; telefonda isə turlara baxılır və «Plan» vərəqindən günlərə əlavə edilir, amma çəkilmir.',
  'help.guide.tour-open-workspace.step.1':
    'Səyahətin vərəqlər panelində «Plan»dan dərhal sonrakı «Turlar»a klikləyin. Xəritə ekranı doldurur, hər tərəfdə bir zolaq olur.',
  'help.guide.tour-open-workspace.tip.2':
    'GPX, KML və ya KMZ fayllarını səyahətin turları kimi idxal etmək üçün onları bu vərəqin istənilən yerinə atın.',
  'help.guide.tour-draw-route.step.4':
    'Xəritənin aşağısında «Nöqtə qoyuldu» görünür. Yanındakı «Geri qaytar» nöqtəni yenidən silir.',
  'help.guide.tour-type-profile.title': 'Turun növünü seçmək',
  'help.guide.tour-type-profile.result': 'Tur seçdiyiniz növ və profil üçün marşrutlaşdırılır.',
  'help.guide.tour-edit-points.step.6':
    'Zolağın başlığındakı «Yol nöqtəsi dəyişikliyini geri al» və «Yol nöqtəsi dəyişikliyini təkrarla» hər dəyişikliyi bir-bir geri qaytarır və ya təkrarlayır.',
  'help.guide.tour-shaping-points.step.3':
    '«Yol nöqtələri» altında o, «Forma nöqtəsi» nişanı ilə və nömrəsiz sadalanır, beləliklə, dayanacaqlar öz nömrələrini saxlayır.',
  'help.guide.tour-loop-reverse.step.1':
    '«Yol nöqtələri» kartının başlığındakı «Başlanğıca qayıt» düyməsinə klikləyin. Tura ilk nöqtəsinə qayıdan son hissə əlavə olunur.',
  'help.guide.tour-leg-by-hand.goal':
    'Marşrutlaşdırıcının yol tapmadığı yerdə iki nöqtəni düz xətlə birləşdirin və ya hissəni yenidən planlaşdırın.',
  'help.guide.tour-trip-places.title': 'Səyahətin məkanını dayanacaq kimi istifadə etmək',
  'help.guide.tour-trip-places.tip.3': 'Səyahətin digər turları heç vaxt dayanacaq kimi təklif olunmur.',
  'help.guide.tour-details-times.tip.1': 'Vaxtları 2:56, 2 h 56 və ya 176 dəqiqə kimi yazmaq olar.',
  'help.guide.tour-save.step.3':
    'Sol zolağın aşağısındakı «Yadda saxla» düyməsinə klikləyin. «Tur saxlanıldı» görünür, zolağın başlığı isə «Turu redaktə et» olur.',
  'help.guide.tour-edit-saved.step.1':
    '«Bu səyahətin turları» altında tura klikləyin. O, sol zolaqda «Turu redaktə et» kimi açılır, xəritə isə onun marşrutunu göstərir.',
  'help.guide.tour-summary-profile.title': 'Turun xülasəsini və hündürlük profilini oxumaq',
  'help.guide.tour-summary-profile.tip.3':
    'Avarçəkmə turunda hündürlüklər göstərilmir, çünki suda mövcud olan yeganə hündürlüklər sahillərinki olardı.',
  'help.guide.tour-list-manage.step.5':
    'Hələ heç bir gündə olmayan turlar üçün «Planlaşdırılmayıb» seçin və ya «Mənbə», «Marşrut həddi» və ya «Növ» üzrə daraldın. Hər sətirdə neçə turun uyğun gəldiyi göstərilir, cəmlər də filtrə uyğunlaşır.',
  'help.guide.tour-delete.step.2':
    'Onunla birlikdə nəyin silinəcəyini oxuyun: marşrut, redaktə edilə bilən yol nöqtələri və gün təyinatları. «Həmişəlik sil» düyməsinə klikləyin.',
  'help.guide.tour-saved-elsewhere.step.2':
    '«Yenisini yüklə» təsdiqdən sonra dəyişikliklərinizi daha yeni versiya ilə əvəz edir.',
  'help.ctx.trip-tour-import.bullet.1':
    '«Bu səyahətin turları»nın yuxarısındakı + «Tur əlavə et» düyməsidir. O, «GPX və ya KML idxal et», «Google Maps-dən gəzinti idxal et» və «Başqa səfərdən tur götür» təklif edir. Faylları «Turlar» vərəqinin istənilən yerinə də atmaq olar.',
  'help.guide.tour-import-gpx.step.2':
    '«GPX və ya KML idxal et» seçin və hər biri 10 MB-a qədər bir və ya bir neçə .gpx, .kml və ya .kmz faylı seçin.',
  'help.guide.tour-import-gpx.tip.5':
    'Hündürlükləri olmayan faylda «Faylda hündürlük yoxdur» yazılır. Xətt və məsafə yenə düzgündür, amma qalxış və eniş naməlum qalır.',
  'help.guide.tour-view-import.tip.2':
    'Başlıqdakı endirmə işarəsi onu yenidən GPX faylı kimi saxlayır, əlfəcin isə kolleksiyada saxlayır.',
  'help.guide.tour-plan-from-import.step.4':
    'Tur yol nöqtələri ilə redaktorda açılır. İstəsəniz dəyişin, sonra sütunun aşağısındakı «Yadda saxla» düyməsinə klikləyin.',
  'help.guide.tour-restore-recorded.step.1':
    '«Bu səyahətin turları»nda yenidən planlaşdırdığınız tura klikləyin. Redaktordakı «Qeydə alınmış iz» kartı onun qeydə alındığı izin saxlandığını bildirir.',
  'help.guide.tour-take-over.step.1':
    'Turun əlavə olunacağı səyahətin «Turlar» vərəqini açın. «Bu səyahətin turları»nın yuxarısındakı + («Tur əlavə et») düyməsinə klikləyin.',
  'help.guide.tour-take-over.tip.3':
    'Turu götürmək üçün bağlantı lazımdır. Redaktorda yadda saxlanmamış dəyişikliklər varsa, nüsxə yenə siyahıya əlavə olunur, amma açılmır ki, işiniz açıq qalsın.',
  'help.guide.tour-import-wanderer.tip.1':
    'Düymə «Tənzimləmələr», «İnteqrasiyalar» altında wanderer qoşulduqdan sonra görünür. O vaxta qədər siyahı «Parametrlərdə qoş» təklif edir.',
  'help.ctx.trip-tour-map.bullet.2':
    'Paneldə ayırıcıdan sonra turun növünə aid açarlar gəlir: turu redaktə edərkən «Nöqtə qoy», yürüşdə «Via ferrata marşrutları», avarçəkmə turunda «Dəniz nişanları», xizək turunda isə pistlər. Sonundakı 3D turu 3D relyef üzərində göstərir.',
  'help.guide.tour-map-layers.step.3':
    'Yürüşdə nişanlanmış cığırlar və onların nömrələri üçün «Gəzinti» düyməsinə klikləyin; velosiped turu bunun əvəzinə velosiped marşrutları üçün «Velosiped» təklif edir. «Peyk» peyk görüntülərini göstərir, «Xəritə» isə standart xəritəyə qaytarır.',
  'help.guide.tour-along-search.step.2':
    '«Nə axtarılsın» düyməsinə klikləyin və istədiyiniz növləri, bir dəfəyə altıya qədər, işarələyin: «Mənzərə nöqtələri», «Zirvələr», «Daxmalar və sığınacaqlar», «İçməli su», «Yemək» və s. Siyahı turun növünə uyğun olanları təklif edir, turda əvvəlcədən onlardan üçü işarələnmiş olur.',
  'help.guide.tour-along-add-stop.title': 'Tur boyunca yeri dayanacaq kimi əlavə etmək',
  'help.guide.tour-along-add-stop.tip.2':
    'Yeni son olan yer «Turu uzadır» kimi işarələnir: köhnə son artıq son deyil, tur bu yerə qədər davam edir.',
  'help.guide.tour-3d-terrain.step.5':
    'Düz xəritəyə qayıtmaq və planlaşdırmağa davam etmək üçün 3D düyməsinə yenidən klikləyin.',
  'help.guide.tour-3d-flyover.step.2':
    '«Sürət» altında 1×, 2× və ya 4× seçin. 1× sürətdə turların çoxu başlanğıcdan sona qədər təxminən 45 saniyə çəkir.',
  'help.guide.tour-map-overlays.goal':
    'Xizək və ya avarçəkmə turu planlaşdırarkən xəritədə xizək pistlərini və liftləri, ya da şamandıraları və liman nişanlarını göstərin.',
  'help.guide.tour-map-overlays.tip.3':
    'Qat yüklənməyi dayandırdıqda onun açarında ! və izahat görünür; xəritə və marşrutunuz onsuz da işləyir.',
  'help.guide.tour-multi-day.title': 'Bir neçə günlük tur planlaşdırmaq',
  'help.guide.tour-multi-day.tip.1':
    '«Mərhələni burada bitir» bir günlük turda da işləyir: bu zaman tur avtomatik çoxgünlük olur. İlk və son dayanacaq, həmçinin forma nöqtəsi mərhələni bitirə bilməz.',
  'help.guide.tour-stages-on-days.step.2': 'İlk mərhələyə başladığınız günü seçin.',
  'help.guide.tour-stages-on-days.tip.4':
    'Gün planında hər mərhələ öz məsafəsi və vaxtı ilə «Stage N» kimi göstərilir. «Plan» vərəqində günlərin üstündəki «Geri qaytar» bütün bölgünü bir addımda geri qaytarır.',
  'help.ctx.trip-tour-hike.bullet.5':
    'Yürüşdə aşağı soldakı xəritə düymələri sırasındakı «Via ferrata marşrutları» yaxınlıqdakı via ferrata marşrutlarını göstərir. Via ferrata kartı onu marşruta ayrıca hissə kimi əlavə edir.',
  'help.guide.tour-hike-plan.step.5':
    '«Ətraflı məlumat» altında «Maksimum cığır çətinliyi»ni açın və cığırların nə qədər çətin ola biləcəyini T1-dən (Hiking) T6-ya («Çətin alp yürüşü») qədər seçin. Marşrut onun daxilində yenidən planlaşdırılır.',
  'help.guide.tour-hike-trail-details.goal':
    'OpenStreetMap-in yürüşün altındakı yollar üçün nə qeyd etdiyini oxuyun və həmin hissələri xəritədə tapın.',
  'help.guide.tour-hike-trail-details.tip.2':
    'Yürüşün həddindən yüksək dərəcənin sətrində «Həddən yuxarı» nişanı göstərilir.',
  'help.guide.tour-hike-round.step.5':
    '«Bu dairəni seç» düyməsinə, planlaşdırılmış marşrutun əvəz edilib edilməyəcəyi soruşulduqda isə «Əvəz et» düyməsinə klikləyin.',
  'help.guide.tour-hike-compare-ways.step.2':
    'Xəritənin üzərində «Bu hissə üçün digər yollar» «Cari yol» və Way A, Way B və s. ilə açılır. Hər biri xəritədə öz rəngində çəkilir, kursoru sətrin üzərinə gətirmək isə onun xəttini vurğulayır.',
  'help.guide.tour-ferrata-add.goal':
    'Yürüşünüzün ətrafındakı via ferrata marşrutlarını tapın və onlardan birini marşrutun bir hissəsinə çevirin.',
  'help.guide.tour-ferrata-add.tip.2':
    'Via ferrata marşrutları yalnız yürüşlərdə təklif olunur. Marşrutun artıq keçdiyi via ferratanın kartında «Tura əlavə et» əvəzinə «Turun bir hissəsi» göstərilir.',
  'help.guide.tour-run-plan.step.4':
    'Xəritədə başlanğıcı və sonu təyin edin və ya onları «Səfər yerləri» ilə seçin. Tempin altında qaçış vaxtını görürsünüz: məsafə vurulsun temp.',
  'help.guide.tour-run-ways.goal':
    'Qaçışın nə qədərinin asfaltsız olduğunu və cığırlarının nə qədər çətinləşdiyini yoxlayın.',
  'help.ctx.trip-tour-walk.summary':
    '«Turlar» vərəqində planlaşdırılan, dayanacaqdan dayanacağa piyada tur: hər dayanacaqda nə qədər qalacağınız, hansılarının vacib olduğu, yol boyu görməli yerlər və gəzinti günü hər birinə nə vaxt çatacağınız, iş saatları ilə yoxlanılmış halda.',
  'help.guide.tour-walk-plan.step.1':
    'Sol sütunun yuxarısındakı «Yeni tur planlaşdır» düyməsinə klikləyin, sonra «Tur növü»nü açın və «Şəhər / görməli yerlər gəzintisi» seçin.',
  'help.guide.tour-walk-plan.tip.3':
    'Dayanacağın «Digər əməliyyatlar» menyusundakı «Yerlə əlaqəni ləğv et» yalnız səyahət məkanı ilə əlaqəni ləğv edir. Məkanın özü səyahətdə qalır.',
  'help.guide.tour-walk-sights.step.5':
    '«Dayanacaq kimi əlavə et» düyməsinə klikləyin. Bildiriş gəzintinin nə qədər uzandığını göstərir, yanında «Geri qaytar» var.',
  'help.guide.tour-walk-day-times.step.2':
    'Ona həmin gün başlama vaxtı verin: «Plan» vərəqində gündəki gəzintiyə sağ klikləyin, «Redaktə et» seçin və «Başlanğıc» daxil edin.',
  'help.guide.tour-walk-google-import.title': 'Google Maps piyada marşrutunu şəhər gəzintisinə çevirmək',
  'help.guide.tour-walk-google-import.tip.3':
    'Google Maps-də çəkilmiş xətt deyil, yalnız dayanacaqlar götürülür. Qısa maps.app.goo.gl linkini açmaq üçün bağlantı lazımdır.',
  'help.guide.tour-walk-check-off.tip.1':
    'İşarələr hər gün üçün ayrıca saxlanır: gəzintini turlar siyahısından deyil, plandakı öz günündən açın.',
  'help.ctx.trip-tour-bike.bullet.3':
    '«Yol nöqtələri» altındakı «Səth və yollar» kartı marşrutun zəminini göstərir: örtüklər, yol növləri və asfaltsız olduğu məlum olan pay. Xəritədə onun hissələrini vurğulamaq üçün sətrə klikləyin.',
  'help.guide.tour-bike-profile.step.5':
    'Sağdakı «Turun xülasəsi»ndə «Sürüş vaxtı (təxmini)»ni oxuyun. Necə hesablandığını görmək üçün kursoru onun məlumat nöqtəsinin üzərinə gətirin.',
  'help.guide.tour-bike-surfaces.title': 'Velosiped turunun örtüklərini görmək',
  'help.guide.tour-bike-surfaces.tip.2':
    '«Yol» profilində zolaqların üstündəki xəbərdarlıq nə qədər məsafənin asfaltsız olduğunun məlum olduğunu bildirir. «Show on the map» həmin hissələri işarələyir.',
  'help.guide.tour-bike-mtb-grades.result':
    'Xəritə seçdiyiniz dərəcəli cığırları işarələyir və turun hansı hissələrinin çətin olduğunu bilirsiniz.',
  'help.ctx.trip-tour-ski.bullet.2':
    'İdman növünün altında trass marşrutlaşdırıcısının seçimləri var, yalnız sizin idman növünüzə aid olanlar: «Ən çətin pistlər», «Üstünlük ver», «Temp», «Liftlərdən istifadə et» kimi açarlar və minmək istəmədiyiniz lift növləri üçün «Çıxar». Hər dəyişiklik turu yenidən planlaşdırır.',
  'help.guide.tour-ski-plan.step.3':
    '«Növ» altında nə edəcəyinizi seçin: «Alp xizəyi», «Snoubord», «Xizək qaçışı», «Dağ xizəyi turu», «Qar ayaqqabısı» və ya «Qış yürüşü». Heç nə əvvəlcədən seçilmir və onsuz turu yadda saxlamaq olmur.',
  'help.guide.tour-ski-plan.result':
    '«Bu səyahətin turları»nda yadda saxlanmış «Xizək və qış» turu: hissələri xəritədəki pistlər, liftlər və cığırlar boyunca gedir, vaxtı isə «Turun xülasəsi»ndə hesablanıb.',
  'help.guide.tour-ski-options.tip.1': 'Hər dəyişiklik turu hissə-hissə yenidən planlaşdırır.',
  'help.guide.tour-ski-fix-leg.step.3':
    'Heç bir düzəliş sizə uyğun deyilsə, «Düz çək» düyməsinə klikləyin. Hissə iki nöqtəsi arasında düz xəttə çevrilir.',
  'help.guide.tour-ski-summary.step.1':
    'Yol nöqtələrinin altında «Pist marşrutu» kartını tapın. Onu yığmaq və ya yenidən açmaq üçün başlığına klikləyin.',
  'help.guide.tour-ski-pistes-layer.title': 'Pistləri xəritədə göstərmək',
  'help.guide.tour-ski-pistes-layer.result': 'Pistlər turun altında çəkilir və onların rənglərini oxuya bilərsiniz.',
  'help.guide.tour-ski-import.step.6':
    '«Xizək izini təsnif et» pəncərəsində düzgün idman növünü və ya texnikanı seçin və «Yadda saxla» düyməsinə klikləyin.',
  'help.ctx.trip-tour-paddle.bullet.2':
    'Hər nöqtə öz rolunu nişan kimi göstərir: «Suya giriş», «Sudan çıxış», «Yenidən suya giriş» və ya «Sudan son çıxış». Nöqtənin altında ondan sonra nəyin gəldiyini görürsünüz: əllə çəkilmiş hissə, daşıma, şlüz və ya hissənin niyə planlaşdırıla bilmədiyi.',
  'help.guide.tour-paddle-setup.step.2': '«Tur növü»nü açın və «Avarlı tur», «Suda, kayak, kanoe və ya SUP ilə» seçin.',
  'help.guide.tour-paddle-setup.tip.3':
    'Avarçəkmə turunda «Tur boyunca» əvvəlcə «Suya buraxılma yerləri», «Qayıq icarəsi» və «İçməli su» axtarır.',
  'help.guide.tour-paddle-water-route.step.4':
    'TREK-in planlaşdıra bilmədiyi hissə qırmızı olur və səbəbini bildirir, məsələn, ərazi üçün hələ su məlumatı yoxdur. Hələlik onu əllə çəkmək üçün «Düz çək» düyməsinə klikləyin.',
  'help.guide.tour-paddle-portage.goal':
    'Qayığı daşıdığınız hissəni işarələyin ki, o, quru kimi sayılsın və qayıqdan çıxıb yenidən minmək üçün vaxt əlavə olunsun.',
  'help.guide.tour-paddle-portage.tip.3':
    '«Vaxt təxmini» kartında öz «Daşıma sürəti»nizi təyin edənə qədər daşıma 2 km/saat ilə hesablanır.',
  'help.guide.tour-paddle-lock.tip.1':
    'TREK şlüzlərin iş cədvəllərini bilmir. Vaxtlar yalnız sizin daxil etdiklərinizdir, ona görə şlüzün iş saatlarını özünüz yoxlayın.',
  'help.guide.tour-paddle-time.step.3':
    '«Su» sətri sizin «Avar sürəti» ilə suda keçilən məsafədir. Sürəti sütunun yuxarısındakı «Avar sürəti» sahəsində dəyişin.',
  'help.guide.tour-paddle-wind.goal': 'Avar çəkdiyiniz gün turun başlanğıcında proqnozlaşdırılan küləyi görün.',
  'help.guide.tour-paddle-wind.tip.4': 'Heç bir proqnoz dəyəri təhlükəsizlik demək deyil. Şəraiti yerində yoxlayın.',
  'help.guide.tour-paddle-checklist.step.5':
    'Yola çıxmazdan əvvəl «Suda təhlükəsizlik» bölməsini oxumaq üçün sütunun aşağısındakı «Avarçəkmənin riskləri var» sətrinə klikləyin.',
  'help.guide.tour-paddle-track-marks.goal':
    'Saatınızdan avarçəkmə izini idxal edin və qayığı harada daşıdığınızı, harada şlüzdən keçdiyinizi əlavə edin.',
  'help.guide.tour-paddle-track-marks.tip.1':
    'Düz izin üzərinə klikləyin: xətdən çox uzaq klik rədd edilir və kart bunu bildirir.',
  'help.ctx.trip-tour-horse.bullet.3':
    'Hər hissə «Yol nöqtələri» kartında marşrutun adı, giriş nöqtəsi və uzunluğu olan nişandır. Heç bir at marşrutunun əhatə etmədiyi parçada «Əl ilə, yoxlanılmayıb» yazılır.',
  'help.guide.tour-horse-plan.step.4':
    'Siyahıda marşruta klikləyin. O, hissələri nömrələnmiş halda öz xəritəsində açılır.',
  'help.guide.tour-horse-plan.tip.4':
    'Sol sütunun başlığındakı «Yol nöqtəsi dəyişikliyini geri al» bütöv hissəni bir addımda geri qaytarır.',
  'help.guide.tour-horse-gap.result':
    'Gəzintidə artıq boşluq yoxdur, birləşdirilmiş parça isə əllə çəkilmiş kimi işarələnib.',
  'help.guide.tour-horse-recorded.step.3': '«1 tur idxal et» düyməsinə klikləyin.',
  'help.guide.dissolve-fusion.step.3': 'Açılan pəncərədə «Ayır» düyməsi ilə təsdiqləyin.',
};

export default help;
